import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const createTokenFn = httpsCallable(functions, "createToken");
const resolveTokenFn = httpsCallable(functions, "resolveToken");

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

// The deployed createToken/createTokenBatch Cloud Functions still validate
// against the pre-rename type name ("report") — functions/index.js already
// accepts "experience" locally, but that hasn't been deployed yet. Translate
// at the network boundary so callers can use the current "experience" name.
// Remove this once the functions are redeployed.
const WIRE_TYPE = { experience: "report" };
const FROM_WIRE_TYPE = { report: "experience" };
function toWireType(type) {
  return WIRE_TYPE[type] ?? type;
}
function fromWireType(type) {
  return FROM_WIRE_TYPE[type] ?? type;
}

export async function encryptId(id, type = "exchange") {
  const cacheKey = `${type}:${id}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }
  const { data } = await createTokenFn({ id, type: toWireType(type) });
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
  tokenCache.set(`${fromWireType(data.type)}:${data.id}`, token);
  persistCaches();
  return data.id;
}

// Cap concurrent createToken requests — firing hundreds at once (one per
// uncached id) exhausts the browser's connection pool (net::ERR_INSUFFICIENT_
// RESOURCES), which the Firebase SDK then reports as a generic "internal"
// error.
const MAX_CONCURRENT_REQUESTS = 20;

export async function encryptIds(ids, type = "exchange") {
  const uncached = ids.filter((id) => !tokenCache.has(`${type}:${id}`));

  // createTokenBatch on the currently-deployed Cloud Function throws an
  // internal error — fall back to the working single-token endpoint per id
  // instead of the batch one, throttled so we don't overwhelm the browser.
  // Revert to a single createTokenBatchFn call once the functions are
  // redeployed.
  for (let i = 0; i < uncached.length; i += MAX_CONCURRENT_REQUESTS) {
    const chunk = uncached.slice(i, i + MAX_CONCURRENT_REQUESTS);
    await Promise.all(chunk.map((id) => encryptId(id, type)));
  }

  const results = {};
  for (const id of ids) {
    results[id] = tokenCache.get(`${type}:${id}`);
  }
  return results;
}
