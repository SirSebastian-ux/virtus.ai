import test from "node:test";
import assert from "node:assert/strict";
import {buildDevelopmentBar} from "../lib/virtus-development-bar.mjs";
import {DEVELOPMENT_DOMAINS,FRAMEWORK_VERSION} from "../lib/virtus-development-index.mjs";

const review=(period,proficiency,direction="stable",sourceType="exercise")=>{
 const date="2026-11-"+String(period+6).padStart(2,"0")+"T10:00:00.000Z";
 return {id:"qa-review-"+period,created_at:date,first_message_at:"2026-11-01T00:00:00Z",last_message_at:date,message_count:period*10,observations:DEVELOPMENT_DOMAINS.map(domain=>({
  skill:domain.name,framework_version:FRAMEWORK_VERSION,proficiency,direction,
  confidence:"high",difficulty:3,source:sourceType,
  source_refs:[{type:sourceType,id:"qa-"+domain.name+"-"+period,ref:sourceType+":qa-"+domain.name+"-"+period,date}],
  evidence:"Independent simulated assessment period; used solely to test the scoring rules."
 }))};
};
test("all eight domains establish a Stage 3 baseline only after independent reviews",()=>{
 const one=buildDevelopmentBar([review(1,2)]);
 assert.equal(one.scored,0);
 const two=buildDevelopmentBar([review(1,2),review(2,2)]);
 assert.equal(two.scored,8);
 assert.equal(two.indexStage,3);
 assert.equal(two.indexPercent,40);
});
test("stage bar increases gradually then requires repeated evidence before declining",()=>{
 const h=[review(1,2),review(2,2),review(3,3,"improving")];
 const initial=buildDevelopmentBar(h);
 const first=buildDevelopmentBar([...h,review(4,1,"declining")]);
 const second=buildDevelopmentBar([...h,review(4,1,"declining"),review(5,1,"declining")]);
 const third=buildDevelopmentBar([...h,review(4,1,"declining"),review(5,1,"declining"),review(6,1,"declining")]);
 assert.ok(initial.indexPercent>40);
 assert.equal(initial.indexStage,3);
 assert.equal(first.indexPercent,initial.indexPercent);
 assert.ok(second.indexPercent<first.indexPercent);
 assert.ok(third.indexPercent<=second.indexPercent);
 assert.ok(third.indexPercent<40);
 assert.equal(third.indexStage,2);
 for(const [a,b] of [[initial,first],[first,second],[second,third]]){
  assert.ok(Math.abs(a.indexPercent-b.indexPercent)<=0.5);
 }
});
test("self-rated decline alone cannot lower any earned domain or the bar",()=>{
 const a=review(1,2),b=review(2,2),c=review(3,0,"declining","checkin");
 const baseline=buildDevelopmentBar([a,b]);
 const withCheckin=buildDevelopmentBar([a,b,c]);
 assert.equal(withCheckin.indexPercent,baseline.indexPercent);
 assert.equal(withCheckin.indexStage,baseline.indexStage);
 assert.ok(withCheckin.domains.every(x=>x.level===2));
});
