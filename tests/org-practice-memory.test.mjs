import test from "node:test";
import assert from "node:assert/strict";
import { loadOrgPracticeMemory } from "../lib/virtus-org-practice-memory.mjs";

function table(rows, error = null) {
  return {
    select() { return this; }, eq() { return this; }, order() { return this; },
    limit() { return Promise.resolve({data:rows,error}); },
    maybeSingle() { return Promise.resolve({data:rows[0] || null,error}); }
  };
}
function db({membership=true, billing="active", error=false}={}) {
  const calls=[];
  const tables={
    virtus_organization_members:table(membership?[{organization_id:"org-a"}]:[]),
    virtus_organizations:table([{billing_status:billing}]),
    virtus_org_learning_progress:table([{curriculum_type:"leadership",module_number:2,exercise_number:1,completed_at:"2026-11-10"}],error?{message:"offline"}:null),
    virtus_org_private_exercise_drafts:table([{exercise_key:"leadership-2-1",title:"Strategic Silence",responses:["I paused before replying"]}])
  };
  return {from(name){calls.push(name);return tables[name];},calls};
}
test("retrieves completed exercise and linked reflections",async()=>{
  const d=db();const s=await loadOrgPracticeMemory({db:d,userId:"employee",organizationId:"org-a"});
  assert.match(s,/Strategic Silence/);assert.match(s,/I paused before replying/);
  assert.match(s,/2026-11-10/);assert.match(s,/1 stored completion/);
});
test("no employee membership means no private data",async()=>{
  const d=db({membership:false});
  assert.equal(await loadOrgPracticeMemory({db:d,userId:"outsider"}),"");
  assert.ok(!d.calls.includes("virtus_org_private_exercise_drafts"));
});
test("inactive billing blocks private memory",async()=>{
  assert.equal(await loadOrgPracticeMemory({db:db({billing:"past_due"}),userId:"employee"}),"");
});
test("database error fails closed",async()=>{
  assert.equal(await loadOrgPracticeMemory({db:db({error:true}),userId:"employee"}),"");
});
test("no authenticated user yields no data",async()=>{
  assert.equal(await loadOrgPracticeMemory({db:db(),userId:null}),"");
});
