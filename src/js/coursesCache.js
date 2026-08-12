import { getDatabase, ref as dbRef, child, get } from "firebase/database";

const CACHE_KEY = "courses_cache_v1";
const CACHE_TIME_KEY = "courses_cache_time_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function readCachedCourses() {
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);

    if (!cachedData || !cachedTime) return null;

    const age = Date.now() - Number(cachedTime);

    if (age > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_TIME_KEY);
      return null;
    }

    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Error reading cached courses:", error);
    return null;
  }
}

export function writeCachedCourses(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (error) {
    console.error("Error writing cached courses:", error);
  }
}

export function clearCachedCourses() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_TIME_KEY);
}

export async function getCoursesData() {
  const cached = readCachedCourses();

  if (cached) {
    console.log("Loaded courses from sessionStorage cache");
    return cached;
  }

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "courses"));

  if (!snapshot.exists()) {
    console.error("No courses found");
    return {};
  }

  const courses = snapshot.val();
  writeCachedCourses(courses);

  console.log("Loaded courses from Firebase");

  return courses;
}

export async function refreshCoursesData() {
  clearCachedCourses();
  return await getCoursesData();
}

export async function getCoursesForExchange(exchangeId) {
  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), `courses/${exchangeId}`));
  return snapshot.exists() ? snapshot.val() : null;
}
