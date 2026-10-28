/**
 * Pure helpers for reviewing coaching observations. A review is an AI-generated
 * interpretation of a finite evidence window, not a psychometric measurement.
 */
export const COACHING_SKILLS = [
  "Self-awareness",
  "Emotional regulation",
  "Critical thinking",
  "Metacognition",
  "Accountability",
  "Communication",
];

export const DIRECTION_LABELS = Object.freeze({
  improving: "Signs of progress",
  stable: "Consistent patterns",
  declining: "Areas needing attention",
  unclear: "Insufficient evidence",
});

export function evidencePeriodKey(review) {
  if (!review || typeof review !== "object") return "";
  const first = String(review.first_message_at || "").trim();
  const last = String(review.last_message_at || "").trim();
  const count = Number(review.message_count);
  if (first && last && Number.isFinite(count)) {
    return first + "|" + last + "|" + count;
  }
  return "review:" + String(review.id || review.created_at || "");
}

export function uniqueEvidencePeriods(reviews) {
  if (!Array.isArray(reviews)) return [];
  const byWindow = new Map();
  const chronological = reviews
    .filter((review) => review && typeof review === "object")
    .slice()
    .sort((a, b) =>
      String(a.created_at || "").localeCompare(String(b.created_at || ""))
    );
  for (const review of chronological) {
    // Keep the most recently recorded interpretation for each same-evidence window.
    byWindow.set(evidencePeriodKey(review), review);
  }
  return [...byWindow.values()].sort((a, b) =>
    String(a.created_at || "").localeCompare(String(b.created_at || ""))
  );
}

export function getSkillObservations(reviews, skill) {
  const normalized = String(skill || "").trim().toLowerCase();
  return uniqueEvidencePeriods(reviews)
    .map((review) => {
      const observation = Array.isArray(review.observations)
        ? review.observations.find(
            (item) => String(item?.skill || "").trim().toLowerCase() === normalized
          )
        : null;
      if (!observation) return null;
      const direction = String(observation.direction || "").toLowerCase();
      if (!Object.hasOwn(DIRECTION_LABELS, direction)) return null;
      return {
        date: review.created_at,
        direction,
        confidence: ["low", "medium", "high"].includes(observation.confidence)
          ? observation.confidence
          : "low",
        evidence: String(observation.evidence || "").trim(),
        count: Number(review.message_count) || 0,
      };
    })
    .filter(Boolean);
}
