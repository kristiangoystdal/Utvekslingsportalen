import { getDatabase, ref as dbRef, child, get, push, set, update, remove } from "firebase/database";

const CACHE_KEY = "experiences_cache_v1";
const CACHE_TIME_KEY = "experiences_cache_time_v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCachedExperiences() {
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

    if (!cachedData || !cachedTime) return null;

    const age = Date.now() - Number(cachedTime);
    if (age > CACHE_TTL_MS) {
      clearCachedExperiences();
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Error reading cached experiences:", error);
    return null;
  }
}

function writeCachedExperiences(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (error) {
    console.error("Error writing cached experiences:", error);
  }
}

export function clearCachedExperiences() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_TIME_KEY);
}

export async function getExperiencesData() {
  const cached = readCachedExperiences();
  if (cached) return cached;

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "experiences"));

  if (!snapshot.exists()) return {};

  const all = snapshot.val();
  const published = {};
  for (const [id, experience] of Object.entries(all)) {
    if (experience.status === "published") {
      published[id] = experience;
    }
  }

  writeCachedExperiences(published);
  return published;
}

export async function refreshExperiencesData() {
  clearCachedExperiences();
  return await getExperiencesData();
}

export async function getExperienceById(experienceId) {
  const cached = readCachedExperiences();
  if (cached && cached[experienceId]) return cached[experienceId];

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), `experiences/${experienceId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function getUserExperiences(userId) {
  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "experiences"));

  if (!snapshot.exists()) return {};

  const userExperiences = {};
  for (const [id, experience] of Object.entries(snapshot.val())) {
    if (experience.authorId === userId) {
      userExperiences[id] = experience;
    }
  }
  return userExperiences;
}

export async function createExperience(experienceData) {
  const db = getDatabase();
  const newRef = push(dbRef(db, "experiences"));
  const now = Date.now();

  await set(newRef, {
    ...experienceData,
    status: "published",
    createdAt: now,
    updatedAt: now,
  });

  clearCachedExperiences();
  return newRef.key;
}

export async function updateExperience(experienceId, experienceData) {
  const db = getDatabase();
  const existing = await getExperienceById(experienceId);
  await set(dbRef(db, `experiences/${experienceId}`), {
    ...experienceData,
    status: existing?.status ?? "published",
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });
  clearCachedExperiences();
}

export async function getExperiencesByExchangeId(exchangeId) {
  const experiences = await getExperiencesData();
  return Object.entries(experiences)
    .filter(([, e]) => e.exchangeId === exchangeId)
    .map(([id, e]) => ({ id, ...e }));
}

export async function syncHomeInfoToUserExperiences(userId, { homeUniversity, study, studyYear, year, numSemesters }) {
  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "experiences"));
  if (!snapshot.exists()) return;

  const updates = {};
  for (const [id, experience] of Object.entries(snapshot.val())) {
    if (experience.authorId === userId) {
      updates[`experiences/${id}/homeUniversity`] = homeUniversity ?? null;
      updates[`experiences/${id}/study`] = study ?? null;
      updates[`experiences/${id}/studyYear`] = studyYear ?? null;
      updates[`experiences/${id}/year`] = year ?? null;
      updates[`experiences/${id}/numSemesters`] = numSemesters ?? null;
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(dbRef(db), updates);
    clearCachedExperiences();
  }
}

export async function deleteExperience(experienceId) {
  const db = getDatabase();
  await remove(dbRef(db, `experiences/${experienceId}`));
  clearCachedExperiences();
}
