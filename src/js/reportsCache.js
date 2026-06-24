import { getDatabase, ref as dbRef, child, get, push, set, remove } from "firebase/database";

const CACHE_KEY = "reports_cache_v1";
const CACHE_TIME_KEY = "reports_cache_time_v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCachedReports() {
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

    if (!cachedData || !cachedTime) return null;

    const age = Date.now() - Number(cachedTime);
    if (age > CACHE_TTL_MS) {
      clearCachedReports();
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Error reading cached reports:", error);
    return null;
  }
}

function writeCachedReports(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (error) {
    console.error("Error writing cached reports:", error);
  }
}

export function clearCachedReports() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_TIME_KEY);
}

export async function getReportsData() {
  const cached = readCachedReports();
  if (cached) return cached;

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "test_reports"));

  if (!snapshot.exists()) return {};

  const all = snapshot.val();
  const published = {};
  for (const [id, report] of Object.entries(all)) {
    if (report.status === "published") {
      published[id] = report;
    }
  }

  writeCachedReports(published);
  return published;
}

export async function refreshReportsData() {
  clearCachedReports();
  return await getReportsData();
}

export async function getReportById(reportId) {
  const cached = readCachedReports();
  if (cached && cached[reportId]) return cached[reportId];

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), `test_reports/${reportId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getUserReports(userId) {
  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "test_reports"));

  if (!snapshot.exists()) return {};

  const userReports = {};
  for (const [id, report] of Object.entries(snapshot.val())) {
    if (report.authorId === userId) {
      userReports[id] = report;
    }
  }
  return userReports;
}

export async function createReport(reportData) {
  const db = getDatabase();
  const newRef = push(dbRef(db, "test_reports"));
  const now = Date.now();

  await set(newRef, {
    ...reportData,
    status: "published",
    createdAt: now,
    updatedAt: now,
  });

  clearCachedReports();
  return newRef.key;
}

export async function updateReport(reportId, reportData) {
  const db = getDatabase();
  await set(dbRef(db, `reports/${reportId}`), {
    ...reportData,
    updatedAt: Date.now(),
  });
  clearCachedReports();
}

export async function deleteReport(reportId) {
  const db = getDatabase();
  await remove(dbRef(db, `reports/${reportId}`));
  clearCachedReports();
}
