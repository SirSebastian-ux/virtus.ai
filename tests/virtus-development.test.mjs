import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDevelopmentGoal, validateDevelopmentCheckin, validateDevelopmentStatus,
  selfRatedTrajectory
} from "../lib/virtus-development.mjs";

const base = {
  title: "Pause before responding",
  focus_domain: "communication",
  observed_behavior: "I interrupt when I interpret disagreement as disrespect.",
  desired_behavior: "Pause, reflect back what I heard, and ask one question.",
  baseline_rating: 2,
};
test("accepts a user-defined behavioral development goal", () => {
  assert.equal(validateDevelopmentGoal(base).value.focus_domain, "communication");
});
test("rejects unsupported and clinical-sounding domain instead of inventing diagnoses", () => {
  assert.match(validateDevelopmentGoal({ ...base, focus_domain: "clinical_diagnosis" }).error, /domain/);
});
test("rejects missing observed behavior", () => {
  assert.ok(validateDevelopmentGoal({ ...base, observed_behavior: "" }).error);
});
test("validates 1 to 5 self-ratings", () => {
  assert.ok(validateDevelopmentGoal({ ...base, baseline_rating: 9 }).error);
});
const goal = "d5d0af56-6146-4f81-95d7-812e14bb1000";
test("requires evidence and a next action for check-ins", () => {
  assert.ok(validateDevelopmentCheckin({ goal_id: goal, rating: 3, evidence: "good", next_action: "try" }).error);
  assert.equal(validateDevelopmentCheckin({
    goal_id: goal, rating: 3, evidence: "I paused before answering my colleague.",
    next_action: "Repeat this pause tomorrow."
  }).value.rating, 3);
});
test("only known goal states are accepted", () => {
  assert.ok(validateDevelopmentStatus({ goal_id: goal, status: "deleted" }).error);
});
test("trajectory keeps baseline distinct from self-reported check-ins", () => {
  const data = selfRatedTrajectory(
    { id: goal, created_at: "2026-11-01", baseline_rating: 2 },
    [{goal_id:goal, rating:4,created_at:"2026-11-03"},{goal_id:goal,rating:3,created_at:"2026-11-02"}]
  );
  assert.deepEqual(data.map(x=>x.rating),[2,3,4]);
  assert.deepEqual(data.map(x=>x.source),["baseline","self_report","self_report"]);
});
