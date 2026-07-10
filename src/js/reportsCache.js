import { getDatabase, ref as dbRef, child, get, push, set, update, remove } from "firebase/database";

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
  const existing = await getReportById(reportId);
  await set(dbRef(db, `test_reports/${reportId}`), {
    ...reportData,
    status: existing?.status ?? "published",
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });
  clearCachedReports();
}

export async function getReportsByExchangeId(exchangeId) {
  const reports = await getReportsData();
  return Object.entries(reports)
    .filter(([, r]) => r.exchangeId === exchangeId)
    .map(([id, r]) => ({ id, ...r }));
}

export async function syncHomeInfoToUserReports(userId, { homeUniversity, study, studyYear, year, numSemesters }) {
  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "test_reports"));
  if (!snapshot.exists()) return;

  const updates = {};
  for (const [id, report] of Object.entries(snapshot.val())) {
    if (report.authorId === userId) {
      updates[`test_reports/${id}/homeUniversity`] = homeUniversity ?? null;
      updates[`test_reports/${id}/study`] = study ?? null;
      updates[`test_reports/${id}/studyYear`] = studyYear ?? null;
      updates[`test_reports/${id}/year`] = year ?? null;
      updates[`test_reports/${id}/numSemesters`] = numSemesters ?? null;
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(dbRef(db), updates);
    clearCachedReports();
  }
}

export async function deleteReport(reportId) {
  const db = getDatabase();
  await remove(dbRef(db, `test_reports/${reportId}`));
  clearCachedReports();
}
