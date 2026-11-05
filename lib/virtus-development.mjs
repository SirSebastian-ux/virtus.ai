/**
 * User-authored development records, not clinical assessments.
 * Pure functions used both by API and tests.
 */
export const DEVELOPMENT_DOMAINS = Object.freeze([
  { key: "self_awareness", label: "Self-awareness" },
  { key: "emotional_regulation", label: "Emotional regulation" },
  { key: "communication", label: "Communication" },
  { key: "decision_making", label: "Decision-making" },
  { key: "habits", label: "Habits and follow-through" },
  { key: "leadership", label: "Leadership" },
]);

const domainKeys = new Set(DEVELOPMENT_DOMAINS.map((domain) => domain.key));
const states = new Set(["active", "paused", "completed"]);

function clean(value, max) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max + 1) : "";
}
function inRange(text, min, max) { return text.length >= min && text.length <= max; }
function validRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
export function validateDevelopmentGoal(raw) {
  const title = clean(raw?.title, 120);
  const focus_domain = clean(raw?.focus_domain, 40);
  const observed_behavior = clean(raw?.observed_behavior, 500);
  const desired_behavior = clean(raw?.desired_behavior, 500);
  const baseline_rating = Number(raw?.baseline_rating);
  if (!inRange(title, 4, 120)) return { error: "Give your goal a title of 4–120 characters." };
  if (!domainKeys.has(focus_domain)) return { error: "Choose one supported development domain." };
  if (!inRange(observed_behavior, 10, 500)) return { error: "Describe one observable behavior in 10–500 characters." };
  if (!inRange(desired_behavior, 10, 500)) return { error: "Describe your intended response in 10–500 characters." };
  if (!validRating(baseline_rating)) return { error: "Choose a baseline self-rating from 1 to 5." };
  return { value: { title, focus_domain, observed_behavior, desired_behavior, baseline_rating } };
}
export function validateDevelopmentCheckin(raw) {
  const goal_id = clean(raw?.goal_id, 36);
  const rating = Number(raw?.rating);
  const evidence = clean(raw?.evidence, 1000);
  const next_action = clean(raw?.next_action, 500);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(goal_id)) {
    return { error: "Select a valid goal." };
  }
  if (!validRating(rating)) return { error: "Choose a self-rating from 1 to 5." };
  if (!inRange(evidence, 10, 1000)) return { error: "Describe observable evidence in 10–1,000 characters." };
  if (!inRange(next_action, 5, 500)) return { error: "Choose a practical next action in 5–500 characters." };
  return { value: { goal_id, rating, evidence, next_action } };
}
export function validateDevelopmentStatus(raw) {
  const goal_id = clean(raw?.goal_id, 36);
  const status = clean(raw?.status, 20);
  if (!/^[0-9a-f-]{36}$/i.test(goal_id) || !states.has(status)) return { error: "Invalid goal or status." };
  return { value: { goal_id, status } };
}
export function selfRatedTrajectory(goal, checkins = []) {
  const values = [{ date: goal.created_at, rating: goal.baseline_rating, source: "baseline" }];
  for (const record of [...checkins].reverse()) {
    if (record.goal_id === goal.id && validRating(Number(record.rating))) {
      values.push({ date: record.created_at, rating: Number(record.rating), source: "self_report" });
    }
  }
  return values;
}
