const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { v4: uuidv4 } = require("uuid");

initializeApp();

const db = getDatabase();
const tokensRef = db.ref("url_tokens");

exports.createToken = onCall(async (request) => {
  const { id, type } = request.data;

  if (!id || !type) {
    throw new HttpsError("invalid-argument", "id and type are required");
  }

  if (!["exchange", "report"].includes(type)) {
    throw new HttpsError("invalid-argument", "type must be exchange or report");
  }

  const existing = await tokensRef
    .orderByChild("realId")
    .equalTo(id)
    .limitToFirst(1)
    .once("value");

  const matches = existing.val();
  if (matches) {
    for (const [token, entry] of Object.entries(matches)) {
      if (entry.type === type) {
        return { token };
      }
    }
  }

  const token = uuidv4();
  await tokensRef.child(token).set({ realId: id, type });
  return { token };
});

exports.resolveToken = onCall(async (request) => {
  const { token } = request.data;

  if (!token) {
    throw new HttpsError("invalid-argument", "token is required");
  }

  const snapshot = await tokensRef.child(token).once("value");
  if (!snapshot.exists()) {
    throw new HttpsError("not-found", "Invalid token");
  }

  return { id: snapshot.val().realId, type: snapshot.val().type };
});

exports.createTokenBatch = onCall(async (request) => {
  const { ids, type } = request.data;

  if (!ids || !Array.isArray(ids) || !type) {
    throw new HttpsError("invalid-argument", "ids (array) and type are required");
  }

  if (!["exchange", "report"].includes(type)) {
    throw new HttpsError("invalid-argument", "type must be exchange or report");
  }

  const results = {};

  for (const id of ids) {
    const existing = await tokensRef
      .orderByChild("realId")
      .equalTo(id)
      .limitToFirst(1)
      .once("value");

    const matches = existing.val();
    let found = false;
    if (matches) {
      for (const [token, entry] of Object.entries(matches)) {
        if (entry.type === type) {
          results[id] = token;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      const token = uuidv4();
      await tokensRef.child(token).set({ realId: id, type });
      results[id] = token;
    }
  }

  return { tokens: results };
});
