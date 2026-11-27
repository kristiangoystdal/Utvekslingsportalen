#!/usr/bin/env python3
"""Import study programs and courses for home universities from DBH.

DBH (Database for statistikk om høgre utdanning, run by HK-dir) is the national
register every Norwegian institution reports its programs and courses to each
semester. This script pulls from its open API and writes the static files the
site loads on demand:

  src/data/studies/<file>.json      {"studies": ["Name (Bachelor)", ...]}
  src/data/homeCourses/<file>.json  {"courses": {"CODE": "Name", ...}}

Usage (from the repo root):

  python3 scripts/import_dbh.py programs            # default program set
  python3 scripts/import_dbh.py courses             # default course set
  python3 scripts/import_dbh.py courses UiO BI      # only these universities
  python3 scripts/import_dbh.py programs --dry-run  # print counts, write nothing

Keys are the ones in src/data/homeUniversities.json. A new university also needs
an entry there and a loader line in src/js/homeStudiesData.js and/or
src/js/homeCoursesData.js.

The NTNU, UiB, UiO, UiS and UiT program files were made by hand before this
script existed, so they are not in the default program set; pass their keys
explicitly to regenerate them from DBH.
"""

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

API = "https://dbh-data.dataporten-api.no/Tabeller/hentJSONTabellData"
PROGRAMS_TABLE = 347  # Studieprogrammer
COURSES_TABLE = 208  # Emner

ROOT = Path(__file__).resolve().parent.parent
STUDIES_DIR = ROOT / "src/data/studies"
COURSES_DIR = ROOT / "src/data/homeCourses"

# key in homeUniversities.json -> (DBH institution code, file name)
INSTITUTIONS = {
    "NTNU": ("1150", "ntnu"),
    "UiO": ("1110", "uio"),
    "UiB": ("1120", "uib"),
    "UiT": ("1130", "uit"),
    "UiS": ("1160", "uis"),
    "UiA": ("1171", "uia"),
    "HVL": ("0238", "hvl"),
    "OsloMet": ("1175", "oslomet"),
    "NMBU": ("1173", "nmbu"),
    "USN": ("1176", "usn"),
    "Nord": ("1174", "nord"),
    "INN": ("1177", "inn"),
    "NHH": ("1240", "nhh"),
    "BI": ("8241", "bi"),
    "HiØ": ("0256", "hiof"),
    "Kristiania": ("8253", "kristiania"),
}

DBH_GENERATED = ["UiA", "HVL", "OsloMet", "NMBU", "USN", "Nord", "INN", "NHH", "BI", "HiØ", "Kristiania"]
DEFAULT_PROGRAMS = DBH_GENERATED
DEFAULT_COURSES = DBH_GENERATED + ["UiO"]


def fetch(table, variables, filters):
    body = {
        "tabell_id": table,
        "api_versjon": 1,
        "statuslinje": "N",
        "begrensning": "0",
        "kodetekst": "J",
        "desimal_separator": ".",
        "variabler": variables,
        "sortBy": [],
        "filter": [
            {"variabel": k, "selection": {"filter": "item", "values": v}} for k, v in filters.items()
        ],
    }
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "dbh-import-script"},
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        sys.exit(f"DBH request failed ({e.code}): {e.read()[:500].decode(errors='replace')}")


def recent_years():
    y = date.today().year
    return [str(y - 1), str(y)]


def write_json(path, data, dry_run):
    if dry_run:
        return
    # Match the existing files: 2-space indent, UTF-8, no trailing newline.
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- programs

LEVELS = {
    "B3": "Bachelor",
    "B4": "Bachelor 4 år",
    "YU": "Bachelor 4 år",  # 4-year teacher education
    "M2": "Master 2 år",
    "M5": "Master 5 år",
    "AR": "Årsstudium",
    "PR": "Profesjonsstudium",
}

PROGRAM_SKIP = re.compile(
    r"^sammensatt|frie emner|kompletterende utdanning|tillitsvalgte|yrkesrettet bachelor|^felles|"
    r"næringsmaster|uspesifisert|uplassert|selvvalgt|selvkomponert|ferdigstilling|forskerlinjen|"
    r"kvalifisering|påbygging|innpassing|enkeltemne|tilrettelagt|bedriftsintern|oppdrag|innveksling|"
    r"utveksling|exchange|frittstående|forkurs|y-vei|tresemesterordning|ettårig|erasmus|joint degree semester",
    re.I,
)

PROGRAM_PREFIXES = [
    r"bachelorstudium:\s*", r"bachelorstudium (i )?", r"masterstudium (i )?", r"master of science,? (in )?",
    r"master i ", r"\d-årig ", r"master'?s?’?s? programme (in )?", r"bsc in ", r"msc in ", r"årsenhet i ",
    r"bachelor of ", r"joint msc in ", r"msc i ", r"i (?=[a-zæøå])", r"bachelorstudiet? (i|i\s)?", r"bachelorprogram(met)? (i )?",
    r"bachelor i ", r"bachelor of (science|arts) (in )?", r"bachelor in ", r"bachelor -? ?",
    r"masterstudiet? (i )?", r"masterprogram(met)? (i )?", r"master of (science|arts|philosophy) (in )?",
    r"master in ", r"master -? ?", r"erfaringsbasert ", r"årsstudium (i )?", r"årsstudiet (i )?",
    r"integrert (5-årig )?master(studium)? (i )?", r"femårig master(studium)? (i )?",
    r"5-årig master(studium)? (i )?",
]

PROGRAM_SUFFIXES = [
    r"\s+med$", r"\s*\(120 ECTS\)", r",?\s*-?\s*nettstudium$", r"\s*-\s*samlings- og$",
    r",?\s*(bachelorgradsstudium|4-årig)$", r"\s*[–-]$", r",?\s*\d-årig ingeniørutdanning$",
    r",?\s*årsprogram$", r"\s*[-–]\s*(industri|industry|part[- ]time)$", r"-\s*(industri|industry)$",
    r",?\s*(bachelorprogram|masterprogram|bachelor[’']s programme|master[’']s programme|årsstudium)\b.*$",
    r",?\s*distriktsvennlig$", r",?\s*årsenhet$", r"\s*\(\s*$",
    r",? ?-? ?(deltid|heltid|nett|nettbasert|samlingsbasert|online( programme)?|desentralisert|erfaringsbasert)\b.*$",
    r",? ?-? ?(årsstudium|bachelorstudium|bachelor|masterstudium|master|profesjonsstudium)$",
    r"\(\d+ ?(studiepoeng|stp)\)", r",? ?\d+ ?(studiepoeng|stp)", r",? integrert 5-årig studium.*$",
    r",? 5-årig( integrert)?.*$", r",? (femårig|toårig|treårig|tre-årig|to-årig|fire-årig|firårig)$",
    r"\s+med integrert praksis$",
]

CAMPUS = (
    r"(Hønefoss|Bø|Notodden|Drammen|Kongsberg|Porsgrunn|Vestfold|Ringerike|Rauland|Bodø|Levanger|Steinkjer|"
    r"Namsos|Mo i Rana|Stjørdal|Vesterålen|Lofoten|Helgeland|Sandnessjøen|Bergen|Haugesund|Stord|Førde|"
    r"Sogndal|Kristiansand|Grimstad|Lillehammer|Hamar|Elverum|Rena|Kongsvinger|Evenstad|Halden|Fredrikstad|"
    r"Oslo|Kjeller|Stavanger|Trondheim|Ås|Sandvika)"
)
CAMPUS_SUFFIX = re.compile(r",?\s*-?\s*\b" + CAMPUS + r"\b\s*$")
SPECIALISATION = re.compile(
    r",?\s*(?:-\s*)?(?:with\s+)?(?:major in|studieretning(?:en)?|spesialisering(?:en)?(?: i)?|fordypning(?: i)?|"
    r"specialization in|specialisation in|profil)[:\s]+(.+)$",
    re.I,
)


def clean_program_name(name):
    """Turn a DBH name like 'Bachelor i sykepleie - deltid, Hamar' into 'Sykepleie'."""
    n = re.sub(r"\s+", " ", name).strip()
    m = SPECIALISATION.search(n)
    if m:  # specialisations are not used; fold them into the parent program
        n = n[: m.start()]
    n = CAMPUS_SUFFIX.sub("", n)
    for _ in range(3):
        for p in PROGRAM_PREFIXES:
            n = re.sub("^" + p, "", n, flags=re.I).strip(" ,-:")
        for s in PROGRAM_SUFFIXES:
            n = re.sub(s, "", n, flags=re.I).strip(" ,-:")
        n = CAMPUS_SUFFIX.sub("", n).strip(" ,-")
    if not n or n.lower() in {"of science", "of arts"}:
        return None
    n = n[0].upper() + n[1:]
    if n.lower().startswith("med "):  # "Master med praktisk-pedagogisk utdanning"
        n = "Master " + n[0].lower() + n[1:]
    return n


def import_programs(keys, dry_run):
    codes = {INSTITUTIONS[k][0]: k for k in keys}
    rows = fetch(PROGRAMS_TABLE, ["*"], {"Institusjonskode": list(codes), "Årstall": recent_years()})
    first_open_term = int(recent_years()[1] + "3")  # still offered from this autumn on
    # Newest rows first, so a renamed program is listed under its current name.
    rows.sort(key=lambda r: (r["Årstall"], r["Semester"]), reverse=True)
    by_key = {k: set() for k in keys}
    seen = set()
    for r in rows:
        if r["Nivåkode"] not in LEVELS or r["Videreutd."] != "0":
            continue
        if int(r["Tilbys til"]) < first_open_term or PROGRAM_SKIP.search(r["Studieprogramnavn"]):
            continue
        ident = (r["Institusjonskode"], r["Studieprogramkode"])
        if ident in seen:
            continue
        seen.add(ident)
        name = clean_program_name(r["Studieprogramnavn"])
        if name:
            by_key[codes[r["Institusjonskode"]]].add(f"{name} ({LEVELS[r['Nivåkode']]})")
    for k in keys:
        studies = sorted(by_key[k], key=str.lower)
        path = STUDIES_DIR / f"{INSTITUTIONS[k][1]}.json"
        write_json(path, {"studies": studies}, dry_run)
        print(f"{k:<11} {len(studies):>5} programs -> {path.relative_to(ROOT)}")


# ----------------------------------------------------------------- courses

COURSE_SKIP = re.compile(r"not offered|expired|tilbys ikke|utgått|nedlagt|discontinued", re.I)
DISCONTINUED = "3"  # DBH status "Avviklet"


def course_code(key, raw):
    """DBH appends a version to every code; strip it to get the code students see."""
    if key == "BI":
        # BI: 'GRA60262' is GRA 6026, version 2. BI writes codes with a space.
        m = re.fullmatch(r"([A-ZÆØÅ]{3})(\d{4})\d", raw)
        return f"{m.group(1)} {m.group(2)}" if m else raw
    return re.sub(r"-\d+$", "", raw)


def import_courses(keys, dry_run):
    codes = {INSTITUTIONS[k][0]: k for k in keys}
    rows = fetch(
        COURSES_TABLE,
        ["Institusjonskode", "Emnekode", "Emnenavn", "Status", "Årstall", "Semester"],
        {"Institusjonskode": list(codes), "Årstall": recent_years()},
    )
    # Newest rows last, so a course's latest name wins.
    rows.sort(key=lambda r: (r["Årstall"], r["Semester"], r["Emnekode"]))
    by_key = {k: {} for k in keys}
    for r in rows:
        name = re.sub(r"\s+", " ", r["Emnenavn"] or "").strip()
        if r["Status"] == DISCONTINUED or not name or COURSE_SKIP.search(name):
            continue
        k = codes[r["Institusjonskode"]]
        by_key[k][course_code(k, r["Emnekode"])] = name
    for k in keys:
        courses = dict(sorted(by_key[k].items()))
        path = COURSES_DIR / f"{INSTITUTIONS[k][1]}.json"
        write_json(path, {"courses": courses}, dry_run)
        print(f"{k:<11} {len(courses):>5} courses  -> {path.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("what", choices=["programs", "courses"])
    parser.add_argument("keys", nargs="*", help="university keys (default: see DEFAULT_PROGRAMS / DEFAULT_COURSES)")
    parser.add_argument("--dry-run", action="store_true", help="fetch and report counts without writing files")
    args = parser.parse_args()

    keys = args.keys or (DEFAULT_PROGRAMS if args.what == "programs" else DEFAULT_COURSES)
    unknown = [k for k in keys if k not in INSTITUTIONS]
    if unknown:
        sys.exit(f"Unknown key(s): {', '.join(unknown)}. Known: {', '.join(INSTITUTIONS)}")

    (import_programs if args.what == "programs" else import_courses)(keys, args.dry_run)


if __name__ == "__main__":
    main()
