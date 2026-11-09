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
