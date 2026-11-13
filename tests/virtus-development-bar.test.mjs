import test from "node:test";
import assert from "node:assert/strict";
import { buildDevelopmentBar } from "../lib/virtus-development-bar.mjs";
import { DEVELOPMENT_DOMAINS, FRAMEWORK_VERSION } from "../lib/virtus-development-index.mjs";

const ref = (id, date, type = "exercise") => ({ref: type + ":" + id, type, id, date});
const period = (n, day, proficiency, {direction="stable", sourceType="exercise", confidence="high"}={}) => {
  const date = "2026-11-" + String(day).padStart(2,"0") + "T10:00:00.000Z";
  const previous = "2026-11-" + String(day-1).padStart(2,"0") + "T10:00:00.000Z";
  return {id:"review-"+n,created_at:date,first_message_at:"2026-11-01T09:00:00Z",
    last_message_at:date,message_count:n*10,
    observations: [{skill:"Self-awareness",framework_version:FRAMEWORK_VERSION,
      proficiency, confidence, difficulty:2, direction,
      source_refs:[ref("src-"+n,date,sourceType)],
      evidence:"Observed comparable reasoning on an evaluated task."}]};
};
test("starts at zero without inventing a cognitive baseline",()=>{
 const x=buildDevelopmentBar([]);
 assert.equal(x.percent,0);assert.equal(x.stage,1);assert.equal(x.scored,0);
 assert.equal(x.domains.length,8);
 assert.deepEqual(x.domains.map(d=>d.name),DEVELOPMENT_DOMAINS.map(d=>d.name));
});
test("one provisional review does not increase progress",()=>{
 assert.equal(buildDevelopmentBar([period(1,10,2)]).percent,0);
});
test("two independent reviews establish one domain, but move slowly",()=>{
 const x=buildDevelopmentBar([period(1,10,2),period(2,11,2)]);
 assert.equal(x.percent,0.2);assert.equal(x.scored,1);assert.equal(x.stage,1);
});
test("exercise completion alone, same evidence, and self-report do not earn new points",()=>{
 const p1=period(1,10,2),p2=period(2,11,2);
 const p3=period(3,12,4,{direction:"improving",sourceType:"checkin"});
 assert.equal(buildDevelopmentBar([p1,p2,p3]).percent,0.2);
 const p4=period(4,13,4,{direction:"improving"});
 // Reusing the original source, rather than a newly assessed response, must not count.
 p4.observations[0].source_refs=[ref("src-1",p1.created_at)];
 assert.equal(buildDevelopmentBar([p1,p2,p4]).percent,0.2);
});
test("supported improvement makes a small change but never jumps stages",()=>{
 const x=buildDevelopmentBar([
  period(1,10,2),period(2,11,2),period(3,12,4,{direction:"improving"})]);
 assert.equal(x.percent,0.4);assert.equal(x.stage,1);
});
test("one lower observation does not reduce the journey; repeated independent decline can",()=>{
 const base=[period(1,10,2),period(2,11,2),period(3,12,4,{direction:"improving"})];
 const first=period(4,13,1,{direction:"declining"});
 const second=period(5,14,1,{direction:"declining"});
 assert.equal(buildDevelopmentBar([...base,first]).percent,0.4);
 assert.ok(buildDevelopmentBar([...base,first,second]).percent<0.4);
});
test("a new review without fresh source attribution does not change the indicator",()=>{
 const first=period(1,10,2),second=period(2,11,2);
 const old=period(3,12,4,{direction:"improving"});
 old.observations[0].source_refs=[ref("src-old",first.created_at)];
 assert.equal(buildDevelopmentBar([first,second,old]).percent,0.2);
});
test("duplicate evidence windows are not rewarded twice",()=>{
 const a=period(1,10,2),b=period(2,11,2);
 const copy={...b,id:"another-id",created_at:"2026-11-11T11:00:00Z"};
 assert.equal(buildDevelopmentBar([a,b,copy]).percent,0.2);
});
test("multiple domains cannot move more than half a point per independent review",()=>{
 const a=period(1,10,2),b=period(2,11,2);
 for (const dom of DEVELOPMENT_DOMAINS.slice(1)) {
  a.observations.push({...a.observations[0],skill:dom.name});
  b.observations.push({...b.observations[0],skill:dom.name});
 }
 const out=buildDevelopmentBar([a,b]);
 assert.equal(out.scored,8);assert.equal(out.percent,0.5);
});
