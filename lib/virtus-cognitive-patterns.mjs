/**
 * Reflection patterns are user-authored hypotheses, never medical diagnoses.
 * Only explicitly confirmed patterns may influence future coaching.
 */
const fields = Object.freeze([
  ["title", 4, 120], ["observed_situation", 10, 600],
  ["interpretation", 10, 600], ["response", 10, 600],
  ["alternative_interpretation", 10, 600], ["evidence", 10, 1000],
]);
export function validateCognitivePattern(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return { error: "Invalid reflection." };
  const value = {};
  for (const [key, min, max] of fields) {
    const text = typeof raw[key] === "string" ? raw[key].trim().replace(/\s+/g, " ") : "";
    if (text.length < min || text.length > max)
      return { error: `Please enter ${key.replaceAll("_", " ")} (${min}–${max} characters).` };
    value[key] = text;
  }
  return { value };
}
export function validatePatternDecision(raw) {
  const id = String(raw?.id || "");
  const status = String(raw?.status || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    return { error: "Invalid reflection identifier." };
  if (!["proposed", "confirmed", "rejected"].includes(status))
    return { error: "Invalid reflection decision." };
  return { value: { id, status } };
}
export function confirmedPatternContext(patterns, maxPatterns = 3) {
  const confirmed = (Array.isArray(patterns) ? patterns : [])
    .filter((p) => p?.status === "confirmed")
    .slice(0, Math.min(5, Math.max(0, maxPatterns)));
  if (!confirmed.length) return "";
  return confirmed.map((p,i) => {
    const safe = (v,n) => String(v || "").slice(0,n).replace(/[\u0000-\u001f]/g, " ");
    return `Reflection ${i+1} (client-confirmed hypothesis):
Situation: ${safe(p.observed_situation,240)}
Interpretation: ${safe(p.interpretation,240)}
Observed response: ${safe(p.response,240)}
Alternative perspective: ${safe(p.alternative_interpretation,240)}`;
  }).join("\n");
}
