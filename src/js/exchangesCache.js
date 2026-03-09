import { getDatabase, ref as dbRef, child, get } from "firebase/database";

const CACHE_KEY = "exchanges_cache_v1";
const CACHE_TIME_KEY = "exchanges_cache_time_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function readCachedExchanges() {
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
    console.error("Error reading cached exchanges:", error);
    return null;
  }
}

export function writeCachedExchanges(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (error) {
    console.error("Error writing cached exchanges:", error);
  }
}

export function clearCachedExchanges() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_TIME_KEY);
}

export async function getExchangesData() {
  const cached = readCachedExchanges();

  if (cached) {
    console.log("Loaded exchanges from sessionStorage cache");
    return cached;
  }

  const db = getDatabase();
  const snapshot = await get(child(dbRef(db), "exchanges"));

  if (!snapshot.exists()) {
    console.error("No exchanges found");
    return {};
  }

  const exchanges = snapshot.val();
  writeCachedExchanges(exchanges);

  console.log("Loaded exchanges from Firebase");

  return exchanges;
}

export async function refreshExchangesData() {
  clearCachedExchanges();
  return await getExchangesData();
}