/**
 * Incrementally processes saved practice without conflating completion with competence.
 * Source IDs already examined by a previous review are never examined twice.
 */
export function planExerciseReview(practices, reviews, batchSize = 15) {
  const all = Array.isArray(practices) ? practices.slice() : [];
  const reviewedIds = new Set();
  for (const review of Array.isArray(reviews) ? reviews : []) {
    for (const observation of Array.isArray(review?.observations) ? review.observations : []) {
      for (const source of Array.isArray(observation?.reviewed_exercise_refs) ? observation.reviewed_exercise_refs : []) {
        if (typeof source?.id === "string") reviewedIds.add(source.id);
      }
    }
  }
  const pending = all.filter(item => item && typeof item.id === "string" && !reviewedIds.has(item.id))
    .sort((a, b) => String(a.updated_at || "").localeCompare(String(b.updated_at || "")));
  return {
    selected: pending.length ? pending.slice(0, batchSize) : all.slice(0, batchSize),
    pending,
    total: all.length,
    previouslyReviewed: reviewedIds.size,
  };
}

/** A test fixture explicitly says it is not a real employee's demonstrated ability. */
export function isSyntheticQaBatch(practices) {
  return Array.isArray(practices) && practices.length > 0 && practices.every(
    item => Array.isArray(item?.responses) && item.responses.length > 0 &&
      item.responses.every(answer => typeof answer === "string" && answer.trim().startsWith("FICTIONAL QA TEST ONLY"))
  );
}
