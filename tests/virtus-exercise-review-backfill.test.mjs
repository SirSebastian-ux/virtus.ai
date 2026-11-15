import test from "node:test";
import assert from "node:assert/strict";
import { planExerciseReview, isSyntheticQaBatch } from "../lib/virtus-exercise-review-planner.mjs";

const rows = Array.from({length:139},(_,i)=>({id:"ref-"+String(i+1).padStart(3,"0"),updated_at:"2026-11-15T02:"+String(Math.floor(i/60)).padStart(2,"0")+":"+String(i%60).padStart(2,"0")+"Z",responses:["FICTIONAL QA TEST ONLY — simulated employee answer"]}));
const observed=ids=>({observations:[{skill:"Self-awareness",reviewed_exercise_refs:ids.map(id=>({id}))}]});

test("reconciliation discovers all unique unreviewed exercises",()=>{
  const p=planExerciseReview(rows,[],15);
  assert.equal(p.total,139);assert.equal(p.pending.length,139);assert.equal(p.selected.length,15);
  assert.equal(p.selected[0].id,"ref-001");assert.equal(p.selected.at(-1).id,"ref-015");
});
test("historical evidence attribution is not reprocessed",()=>{
  const p=planExerciseReview(rows,[observed(rows.slice(0,35).map(x=>x.id))],15);
  assert.equal(p.pending.length,104);assert.equal(p.selected[0].id,"ref-036");
});
test("incremental batches cover every record without duplicates",()=>{
  const reviewed=[];let batches=0;const selectedIds=[];
  while(true){
    const p=planExerciseReview(rows,reviewed,15);
    if(!p.pending.length)break;
    reviewed.push(observed(p.selected.map(x=>x.id)));
    selectedIds.push(...p.selected.map(x=>x.id));batches++;
    if(batches>15)throw Error("No forward progress");
  }
  assert.equal(batches,10);
  assert.equal(selectedIds.length,139);
  assert.equal(new Set(selectedIds).size,139);
});
test("a completed review reuses latest records instead of inventing new sources",()=>{
  const p=planExerciseReview(rows,[observed(rows.map(x=>x.id))],15);
  assert.equal(p.pending.length,0);assert.equal(p.selected.length,15);
  assert.equal(p.selected[0].id,"ref-001");
});
test("only explicitly declared fictional exercises are excluded from competency scoring",()=>{
  assert.equal(isSyntheticQaBatch(rows.slice(0,2)),true);
  assert.equal(isSyntheticQaBatch([{responses:["A genuine user's answer"]}]),false);
  assert.equal(isSyntheticQaBatch([{responses:["FICTIONAL QA TEST ONLY", "A genuine user's answer"]}]),false);
  assert.equal(isSyntheticQaBatch([]),false);
});
