// Iterative Levenshtein (edit) distance between two strings.
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1, // insertion
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + cost // substitution
      );
    }
    prevRow = currentRow;
  }

  return prevRow[b.length];
}

// How many typos to tolerate for a word of this length — short words allow
// none (a 1-typo match on a 2-letter word is basically a coin flip), longer
// words scale up gradually.
function maxDistanceFor(length) {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

// Strips leading/trailing punctuation so "housing?" and "school," compare
// fairly against a plain typed word instead of losing distance budget to
// sentence punctuation.
function stripPunctuation(word) {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

// True if `needle` fuzzily matches `haystack`: an exact substring match
// always counts, and otherwise (for a single-word needle) any word in the
// haystack within a small edit-distance of the needle also counts (typo
// tolerance). Multi-word needles rely on the substring check only — comparing
// a whole phrase's edit distance against individual haystack words isn't
// meaningful.
export function fuzzyMatch(haystack, needle) {
  const text = (haystack || "").toLowerCase();
  const query = (needle || "").trim().toLowerCase();
  if (!query) return true;
  if (text.includes(query)) return true;
  if (/\s/.test(query)) return false;

  const maxDistance = maxDistanceFor(query.length);
  if (maxDistance === 0) return false;

  return text
    .split(/\s+/)
    .map(stripPunctuation)
    .some((word) => word.length > 0 && levenshtein(word, query) <= maxDistance);
}

// Convenience for the common "every search word must fuzzily match
// somewhere in this text" pattern used by the app's chip/word search bars.
export function fuzzyMatchAll(haystack, words) {
  return words.every((word) => fuzzyMatch(haystack, word));
}
