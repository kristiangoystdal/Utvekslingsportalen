import { getDatabase, ref as dbRef, child, get } from "firebase/database";
import { getExchangesData } from "./exchangesCache.js";

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

// Flattens the courses database into unique (code, name) pairs for use as
// autocomplete suggestions: one list for exchange-university courses and
// one for home-university courses (the ones being replaced).
//
// Both lists are scoped to courses logged against the matching exchange
// (host) university / home university, since course codes only make sense
// within the university that assigned them.
export async function getCourseSuggestions({ university, homeUniversity } = {}) {
  const [coursesByExchangeId, exchanges] = await Promise.all([
    getCoursesData(),
    getExchangesData(),
  ]);

  const toArray = (obj) => (Array.isArray(obj) ? obj : Object.values(obj || {}));
  const exchangeMap = new Map();
  const homeMap = new Map();

  for (const exchangeId in coursesByExchangeId) {
    const exchange = exchanges[exchangeId];
    if (university && exchange?.university !== university) continue;
    if (homeUniversity && exchange?.homeUniversity !== homeUniversity) continue;

    const courses = coursesByExchangeId[exchangeId];
    if (!courses) continue;

    const allCourses = [...toArray(courses.Høst), ...toArray(courses.Vår)];

    for (const course of allCourses) {
      if (!course) continue;

      const code = (course.courseCode || "").trim();
      const name = (course.courseName || "").trim();
      const ects = (course.ECTSPoints || "").toString().trim();
      if ((code || name) && !exchangeMap.has(code || name)) {
        exchangeMap.set(code || name, { code, name, ects });
      }

      const replacedCode = (course.replacedCourseCode || "").trim();
      const replacedName = (course.replacedCourseName || "").trim();
      if ((replacedCode || replacedName) && !homeMap.has(replacedCode || replacedName)) {
        homeMap.set(replacedCode || replacedName, { code: replacedCode, name: replacedName });
      }
    }
  }

  return {
    exchangeCourses: Array.from(exchangeMap.values()),
    homeCourses: Array.from(homeMap.values()),
  };
}
