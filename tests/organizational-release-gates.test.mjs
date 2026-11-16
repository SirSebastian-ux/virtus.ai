import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("organizational chat never falls back to consumer access",()=>{
  const consumer=file("app/api/chat/route.js");
  assert.match(consumer,/body\?\.organizationId/);
  assert.match(consumer,/Organizational mentorship conversations are not enabled/);
});
test("private mentorship verifies paid access before and after model generation",()=>{
  const source=file("app/api/organizations/mentor/route.js");
  assert.equal((source.match(/virtus_organization_access/g)||[]).length,2);
  assert.match(source,/eq\("user_id",user\.id\)/);
  assert.match(source,/eq\("organization_id",organizationId\)/);
  assert.match(source,/virtus_org_private_messages/);
  assert.doesNotMatch(source,/from\("chat_messages"\)/);
});
test("billing endpoint uses isolated signed webhook and transactional reconciliation",()=>{
  const source=file("app/api/organizations/billing/webhook/route.js");
  assert.match(source,/webhooks\.constructEvent/);
  assert.match(source,/virtus_product_family/);
  assert.match(source,/virtus_reconcile_org_subscription/);
  assert.doesNotMatch(source,/from\("profiles"\)/);
});
test("billing, enrollment and mentorship are gated until enabled",()=>{
  for(const path of ["app/api/organizations/billing/checkout/route.js","app/api/organizations/billing/webhook/route.js","app/api/organizations/mentor/route.js","app/api/organizations/invitations/route.js"]){
    assert.match(file(path),/process\.env\.VIRTUS_/);
  }
});
test("employer-facing API cannot retrieve private mentorship tables",()=>{
  for(const path of ["app/api/organizations/route.js","app/api/organizations/access/route.js"]){
    assert.doesNotMatch(file(path),/virtus_org_private_(?:messages|conversations)/);
  }
});

test("licensed employees exclude the owner and cannot exceed purchased seats",()=>{
 const invitations=file("app/api/organizations/invitations/route.js");
 const seats=file("app/api/organizations/billing/seats/route.js");
 const checkout=file("app/api/organizations/billing/checkout/route.js");
 assert.match(invitations,/issueEmployeeInvitation/);
 assert.match(file("lib/organization-invitation-delivery.mjs"),/\.neq\("role","owner"\)/);
 assert.match(seats,/\.neq\("role","owner"\)/);
 assert.match(seats,/seats<ctx\.used/);
 assert.match(checkout,/quantity:1/);
 assert.match(checkout,/quantity:seats/);
});
test("seat changes are owner-only, confirmed, and applied by signed webhook, not browser",()=>{
 const seats=file("app/api/organizations/billing/seats/route.js");
 assert.match(seats,/org\.owner_user_id!==user\.id/);
 assert.match(seats,/member\?\.role!=="owner"/);
 assert.match(seats,/pending_if_incomplete/);
 assert.match(seats,/proration_behavior/);
 assert.match(seats,/ctx\.payload\.confirm!==true/);
 assert.match(seats,/idempotencyKey/);
 assert.doesNotMatch(seats,/\.update\(\{[^\n]*seat_limit/);
 assert.match(file("app/api/organizations/billing/webhook/route.js"),/virtus_reconcile_org_subscription/);
});
test("archived organizations are hidden from roster and invitation accepts check archive",()=>{
 assert.match(file("app/api/organizations/route.js"),/is\("archived_at",null\)/);
});

test("manual Premium organization transfer binds intent during EWS registration without charging or replacing account",()=>{
 const register=file("app/api/organizations/route.js");
 assert.match(register,/virtus_org_mentor_transfer_intents/);
 assert.match(register,/organization_id: organizationId/);
 assert.match(register,/name\.toLowerCase\(\) === "enhanced wellness solutions"/);
 assert.doesNotMatch(register,/\.update\(\{\s*plan:/);
});
test("transferred Mentor access remains effective for conversations, files and authenticated account",()=>{
 for (const path of [
  "app/api/conversations/route.js",
  "app/api/auth/claim-guest/route.js",
  "app/api/files/create-pdf/route.js",
  "app/api/files/create-pptx/route.js",
  "app/api/files/create-docx/route.js",
  "app/api/files/create-image/route.js"
 ]) {
  const source=file(path);
  assert.match(source,/hasOrganizationMentorAccess/);
  assert.match(source,/organizationMentorActive\s*\?\s*"premium"/);
 }
 const me=file("app/api/auth/me/route.js");
 assert.match(me,/planSource:\s*organizationMentorActive\s*\?\s*"organization"/);
});
