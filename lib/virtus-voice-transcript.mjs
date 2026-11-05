// Merge independent Web Speech recognition cycles without repeating the boundary words.
// Do not remove repetitions inside a single utterance: they can be intentional speech.
export function normalizeSpeechText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function mergeSpeechCycles(previous, next) {
  const left = normalizeSpeechText(previous);
  const right = normalizeSpeechText(next);
  if (!left) return right;
  if (!right) return left;
  const a = left.split(" ");
  const b = right.split(" ");
  const max = Math.min(a.length, b.length);
  // Only remove a meaningful (2+ word) exact overlap; a single repeated word
  // across breaths may be legitimate and should never silently disappear.
  for (let size = max; size >= 2; size -= 1) {
    const last = a.slice(-size).join(" ").toLocaleLowerCase();
    const first = b.slice(0, size).join(" ").toLocaleLowerCase();
    if (last === first) return normalizeSpeechText([left, ...b.slice(size)].join(" "));
  }
  return normalizeSpeechText(left + " " + right);
}
