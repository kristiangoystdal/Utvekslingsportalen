import homeUniversityJson from "../data/homeUniversities.json";

const loaders = {
  NTNU: () => import("../data/studies/ntnu.json"),
  UiO: () => import("../data/studies/uio.json"),
  UiB: () => import("../data/studies/uib.json"),
  UiT: () => import("../data/studies/uit.json"),
  UiS: () => import("../data/studies/uis.json"),
  UiA: () => import("../data/studies/uia.json"),
  HVL: () => import("../data/studies/hvl.json"),
  OsloMet: () => import("../data/studies/oslomet.json"),
  NMBU: () => import("../data/studies/nmbu.json"),
  USN: () => import("../data/studies/usn.json"),
  Nord: () => import("../data/studies/nord.json"),
  INN: () => import("../data/studies/inn.json"),
  NHH: () => import("../data/studies/nhh.json"),
  BI: () => import("../data/studies/bi.json"),
  HiØ: () => import("../data/studies/hiof.json"),
  Kristiania: () => import("../data/studies/kristiania.json"),
};

const moduleCache = {};

// Study-program lists are stored as static files (see src/data/studies/), one
// per university. Each university's file is only fetched on demand (and then
// cached) so forms embedding HomeInfoSection don't have to bundle every
// university's study list up front.
export async function getStudiesForHomeUniversity(homeUniversity) {
  if (!homeUniversity) return [];

  const key = Object.keys(homeUniversityJson).find(
    (k) => homeUniversityJson[k] === homeUniversity || k === homeUniversity
  );
  if (!key || !loaders[key]) return [];

  if (!moduleCache[key]) {
    moduleCache[key] = loaders[key]().then((m) => m.default || m);
  }

  const data = await moduleCache[key];
  return data?.studies || [];
}
