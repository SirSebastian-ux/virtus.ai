import { buildDevelopmentIndex, FRAMEWORK_VERSION } from "./virtus-development-index.mjs";
import { uniqueEvidencePeriods } from "./virtus-coaching-history.mjs";

// This is a conservative DEVELOPMENT JOURNEY indicator, not an IQ or psychometric score.
// It reads the established Eight-Domain Development Index; it never writes or overrides it.
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const MAX_PER_REVIEW = 0.5;
const independentTypes = new Set(["conversation", "exercise"]);

function hasFreshIndependentSource(observation, previousPeriod) {
  if (!Array.isArray(observation?.source_refs)) return false;
  const cutoff = previousPeriod?.last_message_at || previousPeriod?.created_at || "";
  return observation.source_refs.some((source) =>
    source && independentTypes.has(source.type) &&
    (!cutoff || (source.date && Date.parse(source.date) > Date.parse(cutoff)))
  );
}

/** Only source-backed, reviewed changes move the journey; no points for activity volume. */
export function buildDevelopmentBar(reviews) {
  const periods = uniqueEvidencePeriods(reviews);
  const zeroIndex = buildDevelopmentIndex([]);
  if (!periods.length) return {
    percent: 0, stage: 1, scored: 0, trend: "Awaiting assessed evidence",
    domains: zeroIndex, reviewedPeriods: 0, indexPercent: 0, indexStage: 1,
  };
  let previous = zeroIndex;
  let value = 0;
  let trend = "Development stable";
  const decliningStreak = new Map();

  for (let i = 0; i < periods.length; i += 1) {
    const period = periods[i];
    const domains = buildDevelopmentIndex(periods.slice(0, i + 1));
    const observed = Array.isArray(period.observations) ? period.observations : [];
    let movement = 0;

    for (let j = 0; j < domains.length; j += 1) {
      const current = domains[j];
      const prior = previous[j];
      const observation = observed.find((item) =>
        item && item.framework_version === FRAMEWORK_VERSION &&
        String(item.skill || "").toLowerCase() === current.name.toLowerCase()
      );
      const qualified = current.level !== null &&
        Number.isInteger(observation?.proficiency) &&
        ["medium", "high"].includes(observation?.confidence) &&
        hasFreshIndependentSource(observation, periods[i - 1]);
      if (!qualified) {
        decliningStreak.set(current.name, 0);
        continue;
      }
      const strong = observation.confidence === "high";
      const change = prior.level === null ? null : current.level - prior.level;
      const decline = (change !== null && change < 0) || observation.direction === "declining";
      const streak = decline ? (decliningStreak.get(current.name) || 0) + 1 : 0;
      decliningStreak.set(current.name, streak);
      if (prior.level === null) {
        // Establishing a domain gives small, one-time baseline evidence credit.
        movement += strong ? 0.2 : 0.1;
      } else if (change > 0) {
        movement += Math.min(0.25, change * (strong ? 0.2 : 0.1));
      } else if (decline && streak >= 2) {
        movement -= change < 0
          ? Math.min(0.25, Math.abs(change) * (strong ? 0.2 : 0.1))
          : strong ? 0.1 : 0.05;
      } else if (change === 0 && observation.direction === "improving") {
        movement += strong ? 0.1 : 0.05;
      }
    }
    const previousValue = value;
    value = clamp(value + clamp(movement, -MAX_PER_REVIEW, MAX_PER_REVIEW), 0, 100);
    if (value > previousValue) trend = "Evidence of improvement";
    else if (value < previousValue) trend = "Evidence of decline";
    previous = domains;
  }

  const percent = Math.round(value * 10) / 10;
  const established = previous.filter(domain => domain.level !== null);
  // The bar shows the existing competency INDEX baseline. The journey metric
  // records slow growth separately, preventing an established user from
  // misleadingly appearing to have zero assessed development.
  const indexPercent = established.length
    ? Math.round((established.reduce((sum,domain)=>sum+domain.level,0)/established.length)/5*1000)/10
    : 0;
  const indexStage = established.length
    ? Math.min(6, Math.floor(established.reduce((sum,domain)=>sum+domain.level,0)/established.length)+1)
    : 1;
  return {
    percent,
    stage: Math.min(6, 1 + Math.floor(percent / 20)),
    scored: established.length, indexPercent, indexStage,
    trend,
    domains: previous,
    reviewedPeriods: periods.length,
  };
}
