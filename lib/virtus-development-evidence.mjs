/**
 * Unified development evidence contract.
 * All ingestion surfaces must normalize observations through this boundary.
 * This module does not grant permission to read or disclose source records.
 */
export const EVIDENCE_SOURCES = Object.freeze([
  "general_chat", "mentor_chat", "mentor_practice",
  "practice_studio", "organization_exercise", "organization_chat",
]);
export const EVIDENCE_KINDS = Object.freeze([
  "activity", "self_report", "demonstrated_in_exercise",
  "observed_in_conversation", "verified_follow_up",
]);
export const VISIBILITY = Object.freeze(["private", "organization_aggregate"]);
const SOURCE_SET = new Set(EVIDENCE_SOURCES);
const KIND_SET = new Set(EVIDENCE_KINDS);
const VISIBILITY_SET = new Set(VISIBILITY);
const text = (v, limit = 500) => String(v ?? "").trim().slice(0, limit);

/**
 * Reject unsupported dimensions rather than silently changing the index.
 * The canonical eight dimensions must be supplied by the configured index.
 */
export function normalizeDevelopmentEvidence(input, dimensions) {
  if (!input || typeof input !== "object") throw new TypeError("Evidence required");
  const allowed = new Set(dimensions);
  if (allowed.size !== 8) throw new Error("Exactly eight canonical dimensions required");
  if (!SOURCE_SET.has(input.source)) throw new Error("Unknown evidence source");
  if (!KIND_SET.has(input.kind)) throw new Error("Unknown evidence kind");
  if (!allowed.has(input.dimension)) throw new Error("Unknown development dimension");
  if (!text(input.userId, 100) || !text(input.sourceRecordId, 160))
    throw new Error("Owner and source record required");
  if (!text(input.observation, 800)) throw new Error("Evidence observation required");
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    throw new Error("Confidence must be between 0 and 1");
  // Private records remain private regardless of their originating surface.
  // Aggregation requires a separate authorization and privacy process.
  return Object.freeze({
    userId: text(input.userId, 100),
    tenantId: input.tenantId ? text(input.tenantId, 100) : null,
    source: input.source,
    sourceRecordId: text(input.sourceRecordId, 160),
    kind: input.kind,
    dimension: input.dimension,
    observation: text(input.observation, 800),
    confidence,
    visibility: "private",
    recordedAt: text(input.recordedAt || new Date().toISOString(), 40),
    isSynthetic: input.isSynthetic === true,
  });
}

/** Activity and uncorroborated intentions never prove development. */
export function evidenceSupportsDemonstratedChange(evidence) {
  return evidence?.isSynthetic !== true &&
    ["demonstrated_in_exercise", "observed_in_conversation", "verified_follow_up"]
      .includes(evidence?.kind) &&
    evidence.confidence >= 0.7;
}

/** Deduplicate repeated ingestion of the same source observation. */
export function evidenceIdentity(evidence) {
  return [evidence.userId, evidence.source, evidence.sourceRecordId,
    evidence.dimension, evidence.kind].join(":");
}

/** Never serialize private evidence into an employer-facing payload. */
export function employerSafeEvidenceSummary(records, { minimumGroupSize = 5 } = {}) {
  const items = Array.isArray(records) ? records : [];
  const eligible = items.filter(item => item?.visibility === "organization_aggregate" &&
    item?.isSynthetic !== true && item?.source === "organization_exercise");
  const uniqueUsers = new Set(eligible.map(item => item.userId));
  if (uniqueUsers.size < minimumGroupSize) return { status: "suppressed", count: 0 };
  return {
    status: "aggregate",
    participants: uniqueUsers.size,
    completedActivities: eligible.filter(item => item.kind === "activity").length,
  };
}
