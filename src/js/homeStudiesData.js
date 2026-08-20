import homeUniversityJson from "../data/homeUniversities.json";

const loaders = {
  NTNU: () => import("../data/studies/ntnu.json"),
  UiO: () => import("../data/studies/uio.json"),
  UiB: () => import("../data/studies/uib.json"),
  UiT: () => import("../data/studies/uit.json"),
  UiS: () => import("../data/studies/uis.json"),
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
  return Object.keys(data?.studies || {});
}
