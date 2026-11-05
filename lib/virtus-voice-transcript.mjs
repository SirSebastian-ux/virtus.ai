// Web Speech API can reissue growing transcripts, both within and across cycles.
// Treat cumulative text as a replacement, not new dictation. Never auto-send text.
export function normalizeSpeechText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function tokens(text) {
  return normalizeSpeechText(text).split(" ").filter(Boolean);
}
function comparable(text) {
  return String(text || "").toLocaleLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}
function sameSequence(a, b) {
  return a.length === b.length && a.every((x, i) => comparable(x) === comparable(b[i]));
}
export function mergeSpeechCycles(previous, next) {
  const left = normalizeSpeechText(previous);
  const right = normalizeSpeechText(next);
  if (!left) return right;
  if (!right) return left;
  const a = tokens(left);
  const b = tokens(right);

  // Android recognition may replay the whole utterance as a longer hypothesis.
  if (a.length >= 2 && b.length >= a.length &&
      sameSequence(a, b.slice(0, a.length))) return right;
  if (b.length >= 2 && a.length >= b.length &&
      sameSequence(b, a.slice(-b.length))) return left;

  // A newly restarted recognizer may replay the last 2+ words from its predecessor.
  for (let size = Math.min(a.length, b.length); size >= 2; size--) {
    if (sameSequence(a.slice(-size), b.slice(0, size))) {
      return normalizeSpeechText([left, ...b.slice(size)].join(" "));
    }
  }
  // Single word repetitions may be intentional; do not delete them.
  return left + " " + right;
}

// Within one event, browsers may return cumulative final hypotheses rather than
// independent chunks. Fold each one once, while preserving genuine repeated words.
export function combineRecognitionResults(finalResults, interimResults = []) {
  const finals = (finalResults || []).reduce((text, result) =>
    mergeSpeechCycles(text, result), "");
  const interim = (interimResults || []).reduce((text, result) =>
    mergeSpeechCycles(text, result), "");
  return mergeSpeechCycles(finals, interim);
}
