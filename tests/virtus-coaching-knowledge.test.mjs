import test from "node:test";
import assert from "node:assert/strict";
import { selectVirtusCoachingMode, buildVirtusCoachingKnowledgeLayer, getVirtusCoachingKnowledge } from "../lib/virtus-coaching-knowledge.mjs";

test("CBT thought concern selects CBT methodology", () => {
  const result=selectVirtusCoachingMode({message:"I feel anxious and keep thinking I always fail."});
  assert.equal(result.mode,"cbt");
  assert.equal(result.risk,false);
});

test("Explicit NLP request selects ethical NLP communication mode", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"Please show me an NLP language reframing exercise."});
  assert.equal(result.mode,"nlp");
  assert.match(result.instructions,/neuro-linguistic programming|NLP/i);
  assert.match(result.instructions,/not established|not a validated/i);
});

test("Mental-health safety overrides routine training and coaching", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"I want to end my life, help me with a coaching exercise."});
  assert.equal(result.mode,"safety");
  assert.match(result.instructions,/SAFETY FIRST/);
});

test("Software task is not routed into therapy", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"Please debug my JavaScript API and fix my React software bug."});
  assert.equal(result.mode,"general");
  assert.equal(result.instructions,"");
});

test("Skills practice activates training framework", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"Teach me a skill and give me an exercise."});
  assert.equal(result.mode,"training");
  assert.match(result.instructions,/active recall|graded|practice/i);
});

test("Mentor request selects mentoring framework", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"I need a mentor for my leadership career decisions."});
  assert.equal(result.mode,"mentorship");
  assert.match(result.instructions,/stakeholders|risks|decision/i);
});

test("No psychological interpretation is forced on a greeting", () => {
  assert.equal(selectVirtusCoachingMode({message:"Hi, how are you?"}).mode,"general");
});

test("Coaching knowledge does not include patient data or invented diagnoses", () => {
  const result=buildVirtusCoachingKnowledgeLayer({message:"Help me set a personal habit goal."});
  assert.equal(result.mode,"life_coaching");
  assert.doesNotMatch(result.instructions,/patient name:|diagnosis:\s*[A-Z]/i);
  assert.ok(getVirtusCoachingKnowledge("cbt").methods.length>=4);
});
