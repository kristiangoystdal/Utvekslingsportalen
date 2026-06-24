const SECRET = import.meta.env.VITE_URL_SECRET || "";

function xorWithKey(input) {
  const result = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    result[i] = input[i] ^ SECRET.charCodeAt(i % SECRET.length);
  }
  return result;
}

export function encryptId(id) {
  const bytes = new TextEncoder().encode(id);
  const xored = xorWithKey(bytes);
  return btoa(String.fromCharCode(...xored))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decryptId(encoded) {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const xored = xorWithKey(bytes);
  return new TextDecoder().decode(xored);
}
