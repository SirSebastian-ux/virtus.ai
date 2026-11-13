import { uniqueEvidencePeriods } from "./virtus-coaching-history.mjs";

export const FRAMEWORK_VERSION = "virtus-foundations-1";
export const DEVELOPMENT_DOMAINS = [
  { name: "Self-awareness", criteria: ["Recognizes internal states", "Identifies personal patterns", "Distinguishes intention from impact"] },
  { name: "Metacognition", criteria: ["Monitors reasoning", "Detects cognitive errors", "Revises strategy based on feedback"] },
  { name: "Critical thinking", criteria: ["Tests assumptions", "Evaluates evidence", "Considers alternatives"] },
  { name: "Executive functioning", criteria: ["Prioritizes attention", "Plans and inhibits impulses", "Adapts plans to changing demands"] },
  { name: "Emotional intelligence", criteria: ["Recognizes emotional signals", "Considers others' perspectives", "Responds constructively"] },
  { name: "Behavioral self-regulation", criteria: ["Sets actionable intentions", "Applies deliberate choices", "Adjusts behavior using outcomes"] },
  { name: "Communication", criteria: ["Expresses clearly", "Listens and clarifies", "Handles disagreement constructively"] },
  { name: "Adaptive performance", criteria: ["Transfers learning", "Responds to unfamiliar challenges", "Maintains flexible judgment under complexity"] },
];
export const STAGES = ["Foundation", "Awareness", "Application", "Integration", "Mastery", "Advanced mastery"];
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
export function buildDevelopmentIndex(reviews) {
  const periods = uniqueEvidencePeriods(reviews);
  return DEVELOPMENT_DOMAINS.map(({name,criteria}) => {
    const observations = periods.flatMap(period => {
      const matching = (Array.isArray(period.observations) ? period.observations : []).filter(o => String(o.skill || "").toLowerCase() === name.toLowerCase() && o.framework_version === FRAMEWORK_VERSION && Number.isInteger(o.proficiency) && o.proficiency >= 0 && o.proficiency <= 5 && ["medium","high"].includes(o.confidence));
      const best = matching.sort((a,b) => (a.confidence === "high" ? 2 : 1) - (b.confidence === "high" ? 2 : 1)).at(-1);
      return best ? [{ date:period.created_at, proficiency:best.proficiency, difficulty:clamp(Number(best.difficulty)||1,1,5), direction:best.direction, confidence:best.confidence, evidence:best.evidence, source:best.source, source_refs:Array.isArray(best.source_refs)?best.source_refs:[], window:period.id }] : [];
    });
    // Competence is anchored to explicit observed rubric levels, never an arbitrary midpoint.
    // One observation establishes provisional evidence, not an earned level.
    const history = [];
    for (const item of observations) {
      const last = history.at(-1);
      const selfReportOnly = item.source_refs?.length > 0 && item.source_refs.every(ref => ref.type === "checkin");
      const proposed = last ? clamp(last.level + Math.sign(item.proficiency - last.level) * (item.confidence === "high" ? 1 : 0.5),0,5) : item.proficiency;
      const level = last && selfReportOnly && proposed > last.level ? last.level : proposed;
      history.push({...item, level});
    }
    const latest = history.at(-1);
    const previous = history.length > 1 ? history.at(-2) : null;
    const stageJustification = !latest ? "No qualifying rubric evidence is available." :
      `${latest.source_refs?.length ? latest.source_refs.length + " source record(s) attributed" : "Legacy review without verifiable source references"}; ${latest.confidence} confidence. ${latest.evidence || "No rationale recorded."} ${previous ? (latest.level > previous.level ? "Stage advanced relative to previous evidence." : latest.level < previous.level ? "Stage reduced relative to previous evidence." : "Stage unchanged; no supported change.") : "First observation is provisional; an independent review period is required."}`;
    const established = history.length >= 2 && new Set(history.map(x => x.window)).size >= 2;
    const stage = latest ? STAGES[clamp(Math.floor(latest.level),0,5)] : null;
    // Milestone percentage reflects rubric fraction, not overall human potential.
    const progress = established ? Math.round((latest.level % 1)*100) : null;
    return {name,criteria,history,count:history.length,level:established ? latest.level : null,provisionalLevel:latest?.level ?? null,stage,progress,confidence:latest?.confidence ?? null,delta:established ? Number((latest.level-history[0].level).toFixed(1)) : null,evidence:latest?.evidence ?? null,source_refs:latest?.source_refs ?? [],stageJustification};
  });
}
