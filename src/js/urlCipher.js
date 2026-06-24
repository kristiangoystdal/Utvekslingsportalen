import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const createTokenFn = httpsCallable(functions, "createToken");
const resolveTokenFn = httpsCallable(functions, "resolveToken");
const createTokenBatchFn = httpsCallable(functions, "createTokenBatch");

const STORAGE_KEY = "url_tokens_v1";
const REVERSE_KEY = "url_tokens_rev_v1";

function loadCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? new Map(JSON.parse(raw)) : new Map();
  } catch {
    return new Map();
  }
}

function saveCache(key, map) {
  try {
    sessionStorage.setItem(key, JSON.stringify([...map]));
  } catch {
    // storage full, continue with in-memory only
  }
}

const tokenCache = loadCache(STORAGE_KEY);
const reverseCache = loadCache(REVERSE_KEY);

function persistCaches() {
  saveCache(STORAGE_KEY, tokenCache);
  saveCache(REVERSE_KEY, reverseCache);
}

export async function encryptId(id, type = "exchange") {
  const cacheKey = `${type}:${id}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }
  const { data } = await createTokenFn({ id, type });
  tokenCache.set(cacheKey, data.token);
  reverseCache.set(data.token, id);
  persistCaches();
  return data.token;
}

export async function decryptId(token) {
  if (reverseCache.has(token)) {
    return reverseCache.get(token);
  }
  const { data } = await resolveTokenFn({ token });
  reverseCache.set(token, data.id);
  tokenCache.set(`${data.type}:${data.id}`, token);
  persistCaches();
  return data.id;
}

export async function encryptIds(ids, type = "exchange") {
  const uncached = ids.filter((id) => !tokenCache.has(`${type}:${id}`));

  if (uncached.length > 0) {
    const { data } = await createTokenBatchFn({ ids: uncached, type });
    for (const [id, token] of Object.entries(data.tokens)) {
      tokenCache.set(`${type}:${id}`, token);
      reverseCache.set(token, id);
    }
    persistCaches();
  }

  const results = {};
  for (const id of ids) {
    results[id] = tokenCache.get(`${type}:${id}`);
  }
  return results;
}
