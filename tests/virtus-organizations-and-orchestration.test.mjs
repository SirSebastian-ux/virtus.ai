import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  validateOrganizationName,normalizeInviteEmail,newOrganizationSlug,generateInviteToken,digestInviteToken,
  isOrgAdmin,isBillableOrganization,countPaidSeats,privacySafeOrganizationReport,
} from "../lib/virtus-organizations.mjs";
import {verifyCurriculumReadiness,availableEwsProgramme} from "../lib/virtus-ews-curricula.mjs";
import {chooseCoachingMove,coachingOrchestrationGuidance} from "../lib/virtus-coaching-orchestration.mjs";

test("company names and addresses are validated before provisioning",()=>{
  assert.equal(validateOrganizationName("  Enhanced Wellness Solutions  ").value,"Enhanced Wellness Solutions");
  assert.ok(validateOrganizationName("a").error);
  assert.equal(normalizeInviteEmail(" USER@Company.com "),"user@company.com");
  assert.equal(normalizeInviteEmail("invalid"),null);
  const slug=newOrganizationSlug("Enhanced Wellness Solutions");
  assert.match(slug,/^enhanced-wellness-solutions-[a-f0-9]{8}$/);
});
test("invitations use fresh unguessable tokens and irreversible digests",()=>{
  const a=generateInviteToken(),b=generateInviteToken();
  assert.match(a,/^[0-9a-f]{64}$/);
  assert.notEqual(a,b);
  assert.equal(digestInviteToken("bogus"),null);
  assert.notEqual(digestInviteToken(a),a);
  assert.equal(digestInviteToken(a),digestInviteToken(a));
});
test("company billing and role boundaries fail closed",()=>{
  assert.equal(isOrgAdmin({status:"active",role:"owner"}),true);
  assert.equal(isOrgAdmin({status:"active",role:"admin"}),true);
  assert.equal(isOrgAdmin({status:"active",role:"member"}),false);
  assert.equal(isOrgAdmin({status:"revoked",role:"owner"}),false);
  assert.equal(isBillableOrganization({status:"draft",billing_status:"pending",seat_limit:0}),false);
  assert.equal(isBillableOrganization({status:"active",billing_status:"active",seat_limit:0}),false);
  assert.equal(isBillableOrganization({status:"active",billing_status:"active",seat_limit:20}),false);
  assert.equal(isBillableOrganization({status:"active",billing_status:"active",seat_limit:20,paid_through:"2999-01-01T00:00:00Z"}),true);
  assert.equal(countPaidSeats([
    {role:"member",status:"active"},{role:"owner",status:"active"},
    {role:"member",status:"revoked"}]),1);
});
test("small employee groups cannot receive aggregate developmental reports",()=>{
  const rows=Array.from({length:9},()=>({role:"member",status:"active"}));
  assert.equal(privacySafeOrganizationReport(rows,9).available,false);
  const report=privacySafeOrganizationReport([...rows,{role:"member",status:"active"}],10);
  assert.equal(report.available,true);
  assert.equal(report.seatsActivated,10);
  assert.equal("ratings" in report,false);
  assert.equal("psychologicalPatterns" in report,false);
});
test("EWS knowledge cannot be approved from missing, duplicate or unreviewed sources",()=>{
  const source=i=>({unit_number:i,source_id:`id-${i}`,review_status:"reviewed"});
  assert.equal(verifyCurriculumReadiness(10,Array.from({length:9},(_,i)=>source(i+1))).ready,false);
  assert.equal(verifyCurriculumReadiness(10,Array.from({length:10},(_,i)=>
    i===6?{...source(i+1),review_status:"pending"}:source(i+1))).ready,false);
  assert.equal(verifyCurriculumReadiness(10,Array.from({length:10},(_,i)=>
    i===6?{...source(i+1),source_id:"id-1"}:source(i+1))).ready,false);
  assert.equal(verifyCurriculumReadiness(10,Array.from({length:10},(_,i)=>source(i+1))).ready,true);
  assert.equal(availableEwsProgramme({source_status:"awaiting_originals",version_label:"v1"}),false);
  assert.equal(availableEwsProgramme({source_status:"approved",version_label:"EWS 2026 edition"}),true);
});
test("coaching follows explicit intent but safety always takes precedence",()=>{
  assert.equal(chooseCoachingMove({message:"Please review my progress",hasDevelopmentContext:true}),"review");
  assert.equal(chooseCoachingMove({message:"Let's practice a role-play"}),"practice");
  assert.equal(chooseCoachingMove({message:"Help me decide between options"}),"decision");
  assert.equal(chooseCoachingMove({message:"I have a new goal"}),"plan");
  assert.equal(chooseCoachingMove({message:"I feel misunderstood"}),"explore");
  assert.equal(chooseCoachingMove({message:"Review my plan, I want to die",hasDevelopmentContext:true}),"safety");
  assert.match(coachingOrchestrationGuidance({message:"Train communication",plan:"plus"}),/skills rehearsal/i);
  assert.match(coachingOrchestrationGuidance({message:"Review my progress",plan:"premium",hasDevelopmentContext:true}),/client-confirmed/);
});
test("company admin API deliberately has no access to personal coaching tables",()=>{
  const source=readFileSync(new URL("../app/api/organizations/[id]/route.js",import.meta.url),"utf8");
  for(const forbidden of [
    '"conversations"','"virtus_cognitive_patterns"','"virtus_development_goals"',
    '"virtus_development_checkins"','"project_spaces"','"user_files"',
  ]) assert.equal(source.includes(forbidden),false,`Unexpected employer read: ${forbidden}`);
});
test("schema enforces RLS, private ownership and billable seat limits",()=>{
  const source=readFileSync(new URL("../supabase/migrations/20261105214000_virtus_organizations_foundation.sql",import.meta.url),"utf8");
  assert.match(source,/enable row level security/i);
  assert.match(source,/revoke all on public\.virtus_organizations/i);
  assert.match(source,/for update/i);
  assert.match(source,/v_org\.billing_status <> 'active'/i);
  assert.match(source,/v_used >= v_org\.seat_limit/i);
});
