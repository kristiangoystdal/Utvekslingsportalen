import homeUniversityJson from "../data/homeUniversities.json";
import ntnu from "../data/homeCourses/ntnu.json";
import uio from "../data/homeCourses/uio.json";
import uib from "../data/homeCourses/uib.json";
import uit from "../data/homeCourses/uit.json";
import uis from "../data/homeCourses/uis.json";

const coursesByKey = { NTNU: ntnu, UiO: uio, UiB: uib, UiT: uit, UiS: uis };

// Home-university courses are stored as static files (see src/data/homeCourses/),
// one per university, keyed the same way as homeUniversities.json. This is the
// primary/authoritative source for "replaced course" autocomplete suggestions;
// callers should only fall back to the courses database when a university has
// no file entries.
export function getHomeCoursesForUniversity(homeUniversity) {
  if (!homeUniversity) return [];

  const key = Object.keys(homeUniversityJson).find(
    (k) => homeUniversityJson[k] === homeUniversity || k === homeUniversity
  );
  if (!key) return [];

  const courses = coursesByKey[key]?.courses || {};
  return Object.entries(courses).map(([code, name]) => ({ code, name }));
}
