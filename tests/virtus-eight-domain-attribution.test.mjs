import test from "node:test";
import assert from "node:assert/strict";
import { buildDevelopmentIndex } from "../lib/virtus-development-index.mjs";
const ref = (id, type="checkin") => ({ref:`${type}:${id}`,type,id,date:"2026-11-13T10:00:00Z"});
const observation = (proficiency, refs) => ({skill:"Self-awareness",framework_version:"virtus-foundations-1",proficiency,confidence:"high",difficulty:2,evidence:"Identifies the assumption before reacting.",source:"checkin",source_refs:refs});
const period = (id, day, obs) => ({id,created_at:`2026-11-${day}T10:00:00Z`,observations:[obs]});
test("first self-report is provisional and preserves source reference",()=>{
 const d=buildDevelopmentIndex([period("p1","12",observation(2,[ref("c1")]))])[0];
 assert.equal(d.level,null);assert.equal(d.source_refs[0].ref,"checkin:c1");assert.match(d.stageJustification,/provisional/);
});
test("self-report alone cannot advance established competency",()=>{
 const d=buildDevelopmentIndex([period("p1","11",observation(2,[ref("c1")])),period("p2","12",observation(4,[ref("c2")]))])[0];
 assert.equal(d.level,2);assert.match(d.stageJustification,/unchanged/);
});
test("independent evidence can justify advancement and retain source",()=>{
 const d=buildDevelopmentIndex([period("p1","11",observation(2,[ref("c1")])),period("p2","12",observation(4,[ref("e1","exercise")]))])[0];
 assert.equal(d.level,3);assert.equal(d.source_refs[0].type,"exercise");assert.match(d.stageJustification,/advanced/);
});
test("self-report alone cannot reduce established competency",()=>{ const d=buildDevelopmentIndex([period("p1","11",observation(4,[ref("e1","exercise")])),period("p2","12",observation(1,[ref("c2")]))])[0]; assert.equal(d.level,4); assert.match(d.stageJustification,/unchanged/); });
test("missing evidence cannot establish a stage",()=>{
 const d=buildDevelopmentIndex([])[0];assert.equal(d.level,null);assert.match(d.stageJustification,/No qualifying/);
});