import test from "node:test";
import assert from "node:assert/strict";
import { ASSESSMENT_DOMAINS, assessmentDomainEvidence, planAssessmentReview, assessmentRef } from "../lib/virtus-organizational-assessment-evidence.mjs";
import { buildDevelopmentBar } from "../lib/virtus-development-bar.mjs";
import { FRAMEWORK_VERSION, DEVELOPMENT_DOMAINS } from "../lib/virtus-development-index.mjs";

const scores=Object.keys(ASSESSMENT_DOMAINS).map((domain,i)=>({
  id:"qa-id-"+i,user_id:"user-a",organization_id:"org-a",domain,exercise_key:"scenario-2026-11-15-"+domain,
  score:[5,5,1,5,5,2,4,3,2][i],scored_at:"2026-11-15T10:00:00Z"
}));
test("nine daily assessment domains map to all eight distinct competencies",()=>{
 const seen=new Set(Object.values(ASSESSMENT_DOMAINS).flat());
 assert.deepEqual([...seen].sort(),DEVELOPMENT_DOMAINS.map(d=>d.name).sort());
 assert.equal(scores.length,9);
 for(const domain of seen){
  const refs=assessmentDomainEvidence(scores,domain);
  assert.ok(refs.length>=1,domain);
  assert.ok(refs.every(r=>r.type==="assessment"&&r.maxScore===5));
 }
});
test("assessment references are typed, dated and attributed to their source",()=>{
 const a=assessmentDomainEvidence(scores,"Metacognition");
 assert.equal(a.length,1);
 assert.equal(a[0].ref,assessmentRef(scores[1]));
 assert.equal(a[0].score,5);
 assert.equal(assessmentDomainEvidence(scores,"Unknown domain").length,0);
});
test("new and updated assessment score records are reviewed once per version",()=>{
 const first=planAssessmentReview(scores,[]);
 assert.equal(first.pending.length,9);
 const prior=[{observations:[{reviewed_assessment_refs:scores.map(x=>({id:x.id,date:x.scored_at}))}]}];
 assert.equal(planAssessmentReview(scores,prior).pending.length,0);
 const modified=scores.map((s,i)=>i===2?{...s,score:2,scored_at:"2026-11-16T10:00:00Z"}:s);
 assert.deepEqual(planAssessmentReview(modified,prior).pending.map(x=>x.id),[scores[2].id]);
});
const review=(i,score,dir,sourceType="conversation")=>{
 const date="2026-11-"+String(i+6).padStart(2,"0")+"T10:00:00.000Z";
 return {id:"period-"+i,created_at:date,last_message_at:date,first_message_at:"2026-11-01T00:00:00Z",message_count:i*10,
  observations:DEVELOPMENT_DOMAINS.map(d=>({
   skill:d.name,framework_version:FRAMEWORK_VERSION,proficiency:score,confidence:"high",
   direction:dir,difficulty:3,source:sourceType,
   source_refs: sourceType==="assessment"?[{type:"assessment",id:"qa-id-"+i,date}]:[{type:sourceType,id:"independent-"+d.name+i,date}],
   reviewed_assessment_refs:scores.map(s=>({id:s.id,date:s.scored_at})),
   assessment_context:assessmentDomainEvidence(scores,d.name)
  }))};
};
test("repeated source-linked competency regression downgrades the bar conservatively",()=>{
 const baseline=[review(1,2,"stable"),review(2,2,"stable"),review(3,3,"improving")];
 const before=buildDevelopmentBar(baseline);
 const first=buildDevelopmentBar([...baseline,review(4,1,"declining")]);
 const second=buildDevelopmentBar([...baseline,review(4,1,"declining"),review(5,1,"declining")]);
 const third=buildDevelopmentBar([...baseline,review(4,1,"declining"),review(5,1,"declining"),review(6,1,"declining")]);
 assert.equal(before.indexStage,3);
 assert.equal(first.indexPercent,before.indexPercent);
 assert.ok(second.indexPercent<first.indexPercent);
 assert.equal(third.indexStage,2);
});
test("assessment-only changes are never valid independent progression or regression",()=>{
 const prior=[review(1,2,"stable"),review(2,2,"stable")];
 const before=buildDevelopmentBar(prior);
 const after=buildDevelopmentBar([...prior,review(3,0,"declining","assessment"),review(4,0,"declining","assessment")]);
 assert.equal(after.indexPercent,before.indexPercent);
 assert.equal(after.indexStage,before.indexStage);
});

test("eight-domain dashboard retains scenario context after later unscored review",()=>{
 const assessmentReview={id:"review-assessment",created_at:"2026-11-15T12:00:00Z",last_message_at:"2026-11-15T12:00:00Z",first_message_at:"2026-11-01T09:00:00Z",message_count:20,
  observations:DEVELOPMENT_DOMAINS.map(d=>({skill:d.name,framework_version:FRAMEWORK_VERSION,proficiency:null,confidence:"low",source_refs:[],assessment_context:assessmentDomainEvidence(scores,d.name)}))};
 const later={...assessmentReview,id:"review-later",created_at:"2026-11-16T12:00:00Z",last_message_at:"2026-11-16T12:00:00Z",message_count:30,
  observations:DEVELOPMENT_DOMAINS.map(d=>({skill:d.name,framework_version:FRAMEWORK_VERSION,proficiency:null,confidence:"low",source_refs:[],assessment_context:[]}))};
 const result=buildDevelopmentBar([assessmentReview,later]);
 assert.equal(result.scored,0);
 for(const d of result.domains)assert.ok(d.assessmentEvidence?.assessment_context?.length>0,d.name);
});
