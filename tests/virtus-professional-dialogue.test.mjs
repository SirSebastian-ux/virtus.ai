import test from "node:test";
import assert from "node:assert/strict";
import { classifyVirtusMemoryIntent, getVirtusPublicPlanName, VIRTUS_PROFESSIONAL_CONVERSATION_STANDARD } from "../lib/virtus-professional-dialogue.mjs";

test("Changing from relationship to workplace coaching is not memory deletion", () => {
 const result=classifyVirtusMemoryIntent("forget about the relationship my manager specks down to me all the time");
 assert.equal(result.kind,"topic_shift");
 assert.equal(result.target,"");
});
test("Forget it and never mind are conversation topic changes", () => {
 for(const text of ["forget it, my manager is rude", "Never mind that, I have a new question", "forget about the marriage, I want to discuss work"]) {
  assert.equal(classifyVirtusMemoryIntent(text).kind,"topic_shift");
 }
});
test("Deletion is restricted to explicit saved-memory commands", () => {
 for(const [text,target] of [
  ["Delete memory about my former employer","my former employer"],
  ["Please remove saved memory about my old address.","my old address"],
  ["Forget what you remember about my former project.","my former project"],
  ["remove my old workplace from your saved memories","my old workplace"],
  ["forget saved fact: old project name","old project name"]
 ]) {
  const parsed=classifyVirtusMemoryIntent(text);
  assert.equal(parsed.kind,"delete",text);
  assert.equal(parsed.target,target);
 }
});
test("Ambiguous memory command never deletes anything", () => {
 for(const text of ["Forget memory", "Forget all", "remove from profile", "Forget this manager", "forget about my work problem"]) {
  assert.notEqual(classifyVirtusMemoryIntent(text).kind,"delete",text);
 }
});
test("Customer-facing plans match site names",()=>{
 assert.equal(getVirtusPublicPlanName("premium"),"Mentor");
 assert.equal(getVirtusPublicPlanName("plus"),"Trainer");
 assert.equal(getVirtusPublicPlanName("free"),"Life Coach");
 assert.equal(getVirtusPublicPlanName("trial_guest"),"Trial Guest");
 assert.match(VIRTUS_PROFESSIONAL_CONVERSATION_STANDARD,/highest paid coaching and mentorship tier/);
});
