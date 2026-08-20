import homeUniversityJson from "../data/homeUniversities.json";

const loaders = {
  NTNU: () => import("../data/homeCourses/ntnu.json"),
  UiO: () => import("../data/homeCourses/uio.json"),
  UiB: () => import("../data/homeCourses/uib.json"),
  UiT: () => import("../data/homeCourses/uit.json"),
  UiS: () => import("../data/homeCourses/uis.json"),
};

const moduleCache = {};

// Home-university courses are stored as static files (see src/data/homeCourses/),
// one per university, keyed the same way as homeUniversities.json. This is the
// primary/authoritative source for "replaced course" autocomplete suggestions;
// callers should only fall back to the courses database when a university has
// no file entries. Each university's file is only fetched on demand (and then
// cached) so the edit-exchange form doesn't have to bundle every university's
// course list up front.
export async function getHomeCoursesForUniversity(homeUniversity) {
  if (!homeUniversity) return [];

  const key = Object.keys(homeUniversityJson).find(
    (k) => homeUniversityJson[k] === homeUniversity || k === homeUniversity
  );
  if (!key || !loaders[key]) return [];

  if (!moduleCache[key]) {
    moduleCache[key] = loaders[key]().then((m) => m.default || m);
  }

  const data = await moduleCache[key];
  const courses = data?.courses || {};
  return Object.entries(courses).map(([code, name]) => ({ code, name }));
}
