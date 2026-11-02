import test from "node:test";
import assert from "node:assert/strict";
import {
  rankVirtusMemories,
  selectVirtusConversation,
  chooseVirtusIntelligence,
} from "../lib/virtus-intelligence.mjs";

test("Relevant user-owned memory beats unrelated facts", () => {
  const now = "2026-10-27T00:00:00Z";
  const rows = [
    { text: "My cycling preference is early morning.", source: "premium_personal_memory", createdAt: now },
    { text: "I need to redesign the leadership training program.", source: "premium_project_memory", createdAt: now },
  ];
  const ranked = rankVirtusMemories(rows, "Can we review leadership training?", { now, limit: 2 });
  assert.match(ranked[0].text, /leadership/);
});

test("Memory ranking limits records and removes duplicates", () => {
  const rows = [
    {text:"The client wants a practical lesson plan.",createdAt:"2026-10-26"},
    {text:"The client wants a practical lesson plan.",createdAt:"2026-10-25"},
    {text:"Training exercises last seven days.",createdAt:"2026-10-20"},
  ];
  assert.equal(rankVirtusMemories(rows, "lesson plan", {limit:10}).length, 2);
  assert.equal(rankVirtusMemories(rows, "lesson plan", {limit:0}).length, 0);
});

test("Memory facts are not mutated", () => {
  const rows = [{text:"Specific coaching preference.",source:"personal"}];
  rankVirtusMemories(rows, "coaching", {limit:10});
  assert.equal(rows[0].text, "Specific coaching preference.");
});

test("Conversation selection preserves chronology and recent messages", () => {
  const rows = Array.from({length:140}, (_,index)=>({
    role:index%2===0?"user":"assistant",
    content: index===4 ? "The leadership curriculum requires a new assessment framework." : "Turn " +index,
    created_at:"2026-10-27T10:00:00Z",
  }));
  const selected=selectVirtusConversation(rows,"leadership assessment", {recentLimit:8,relevantLimit:2,maxChars:100});
  assert.ok(selected.length<=12);
  assert.equal(selected.at(-1).content,"Turn 139");
  assert.ok(selected.some(row=>row.content.includes("leadership curriculum")));
});

test("Conversation selection truncates oversized older content", () => {
  const rows=[
    {role:"user",content:"a".repeat(5000),created_at:"2026-10-20"},
    {role:"assistant",content:"noted",created_at:"2026-10-20"},
  ];
  const out=selectVirtusConversation(rows,"question", {recentLimit:4,maxChars:300});
  assert.equal(out[0].content.length,300);
});

test("Reasoning selects model and effort by plan and complexity", () => {
  const premium=chooseVirtusIntelligence({plan:"premium",message:"Compare the tradeoffs of security architectures and analyze failure modes."});
  const simple=chooseVirtusIntelligence({plan:"free",message:"Hello."});
  assert.equal(premium.model,"gpt-6.1-sol");
  assert.equal(premium.effort,"high");
  assert.equal(simple.model,"gpt-6.1-terra");
  assert.equal(simple.effort,"low");
});

test("Image requests cannot be classed as simple", () => {
  const choice=chooseVirtusIntelligence({plan:"plus",message:"What is this?",hasImages:true});
  assert.notEqual(choice.class,"straightforward");
});
