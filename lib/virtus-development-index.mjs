import { uniqueEvidencePeriods } from "./virtus-coaching-history.mjs";

export const DEVELOPMENT_DOMAINS = [
  { name: "Critical thinking", aliases: ["critical thinking"] },
  { name: "Leadership", aliases: ["leadership", "accountability"] },
  { name: "Communication", aliases: ["communication"] },
  { name: "Metacognition", aliases: ["metacognition"] },
  { name: "Emotional intelligence", aliases: ["emotional intelligence", "emotional regulation"] },
  { name: "Self-awareness", aliases: ["self-awareness"] },
  { name: "Behavioral regulation", aliases: ["behavioral regulation", "emotional regulation"] },
];
const WEIGHTS = { high: 1, medium: 0.7, low: 0.4 };
const CHANGE = { improving: 8, stable: 0, declining: -8 };
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
export function buildDevelopmentIndex(reviews) {
  const periods = uniqueEvidencePeriods(reviews);
  return DEVELOPMENT_DOMAINS.map(({ name, aliases }) => {
    const observations = periods.flatMap((period) => {
      const matches = (Array.isArray(period.observations) ? period.observations : [])
        .filter((o) => aliases.includes(String(o.skill || "").toLowerCase()) && Object.hasOwn(CHANGE, o.direction));
      // A single review window counts once per domain, even when aliases overlap.
      const best = matches.sort((a, b) => (WEIGHTS[b.confidence] || 0.4) - (WEIGHTS[a.confidence] || 0.4))[0];
      return best ? [{ date: period.created_at, direction: best.direction, confidence: best.confidence, evidence: best.evidence, window: period.id }] : [];
    });
    // 50 is a neutral index origin, NOT a baseline ability score. No index until evidence exists.
    let index = 50;
    const history = observations.map((observation, i) => {
      const weight = WEIGHTS[observation.confidence] || 0.4;
      if (i > 0) index = clamp(index + CHANGE[observation.direction] * weight);
      return { ...observation, value: index };
    });
    return { name, history, value: history.length ? history.at(-1).value : null, count: history.length, delta: history.length > 1 ? history.at(-1).value - history[0].value : null };
  });
}
