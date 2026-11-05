import test from "node:test";
import assert from "node:assert/strict";
import {
  membershipCapabilities, canChooseProgram, canCreateGoal, canResumeGoal, canAccessPractice, membershipConversationGuidance
} from "../lib/virtus-membership.mjs";
import { developmentExercise } from "../lib/virtus-development-pathways.mjs";

test("legacy Plus and Premium resolve to Trainer and Mentor", () => {
  assert.equal(membershipCapabilities("plus").publicName, "Trainer");
  assert.equal(membershipCapabilities("premium").publicName, "Mentor");
  assert.equal(membershipCapabilities("life_coach").publicName, "Life Coach");
});
test("unknown plan never defaults to trial premium access", () => {
  assert.equal(membershipCapabilities("unknown").maxActiveGoals, 0);
  assert.equal(membershipCapabilities(undefined).coachingMode, "account_only");
});
test("three memberships have 3/10/30 active goal capacity", () => {
  assert.deepEqual(["life_coach", "plus", "premium"].map(x => membershipCapabilities(x).maxActiveGoals), [3,10,30]);
  assert.equal(canCreateGoal("life_coach", [{status:"active"},{status:"active"},{status:"active"}]), false);
  assert.equal(canCreateGoal("plus", [{status:"active"},{status:"paused"}]), true);
});
test("program duration entitlements are cumulative", () => {
  assert.equal(canChooseProgram("life_coach",30),false);
  assert.equal(canChooseProgram("plus",30),true);
  assert.equal(canChooseProgram("plus",90),false);
  assert.equal(canChooseProgram("premium",90),true);
  assert.equal(canChooseProgram("free",7),false);
});
test("resume does not allow bypassing active goal capacity", () => {
  assert.equal(canResumeGoal("life_coach",[{id:"paused",status:"paused"},{status:"active"},{status:"active"},{status:"active"}],"paused"),false);
  assert.equal(canResumeGoal("plus",[{id:"paused",status:"paused"}],"paused"),true);
});
test("conversation guidance differs by service and retains safety responsibility", () => {
  assert.match(membershipConversationGuidance("life_coach"), /interpretation/i);
  assert.match(membershipConversationGuidance("plus"), /rehearsal/i);
  assert.match(membershipConversationGuidance("premium"), /judgment/i);
  assert.match(membershipConversationGuidance("life_coach"), /safety/i);
});
test("pathways advance only with recorded check-ins", () => {
  const goal={program_days:30,desired_behavior:"Pause before replying"};
  const first=developmentExercise(goal,0), second=developmentExercise(goal,1);
  assert.equal(first.day,1);
  assert.equal(second.day,2);
  assert.equal(first.duration,30);
  assert.equal(developmentExercise(goal,30).completed,true);
});

test("practice access does not confuse Life Coach with guest or free", () => {
  assert.equal(canAccessPractice("life_coach", "life_coach"), true);
  assert.equal(canAccessPractice("free", "life_coach"), false);
  assert.equal(canAccessPractice("trial_guest", "life_coach"), false);
  assert.equal(canAccessPractice("life_coach", "plus"), false);
  assert.equal(canAccessPractice("plus", "life_coach"), true);
  assert.equal(canAccessPractice("premium", "plus"), true);
  assert.equal(canAccessPractice("premium", "premium"), true);
});
