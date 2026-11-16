import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const file=p=>readFileSync(new URL(p,root),"utf8");
test("downgrade requires the registered owner and explicit employee selection",()=>{
 const owner=file("lib/organization-billing-owner.mjs");
 const downgrade=file("app/api/organizations/billing/downgrade/route.js");
 assert.match(owner,/org.owner_user_id!==user.id/);
 assert.match(owner,/membership\?\.role!=="owner"/);
 assert.match(downgrade,/ids.includes\(org.owner_user_id\)/);
 assert.match(downgrade,/new Set\(ids\).size!==ids.length/);
 assert.match(downgrade,/body.confirm!==true/);
 assert.match(downgrade,/p_user_ids:ids/);
});
test("downgrade suspends employees, then changes Stripe seats with idempotency and no refund",()=>{
 const code=file("app/api/organizations/billing/downgrade/route.js");
 assert.ok(code.indexOf("virtus_org_suspend_members_for_downgrade")<code.indexOf("stripe.subscriptions.update"));
 assert.match(code,/proration_behavior:"none"/);
 assert.match(code,/idempotencyKey:/);
 assert.match(code,/virtus_org_resume_suspended_members/);
 assert.match(code,/target<0/);
});
test("cancellation supports now and period end with explicit owner confirmation",()=>{
 const code=file("app/api/organizations/billing/cancel/route.js");
 assert.match(code,/cancel_at_period_end:true/);
 assert.match(code,/subscriptions.cancel/);
 assert.match(code,/virtus_org_close_entitlements/);
 assert.match(code,/body.confirmName!==c.org.name/);
 assert.match(code,/body.timing==="period_end"/);
});
test("webhook permits zero employee seats and suspends all employee entitlements after cancellation",()=>{
 const code=file("app/api/organizations/billing/webhook/route.js");
 assert.match(code,/seats<0/);
 assert.match(code,/status==="canceled"/);
 assert.match(code,/virtus_org_close_entitlements/);
});
test("billing UI has employee downgrade and company cancellation controls",()=>{
 const ui=file("app/organizations/dashboard/OrganizationCancellation.js");
 const dash=file("app/organizations/dashboard/page.js");
 assert.match(ui,/Remove organizational access/);
 assert.match(ui,/Confirm employee downgrade/);
 assert.match(ui,/Cancel company subscription now/);
 assert.match(ui,/Schedule company cancellation/);
 assert.match(dash,/OrganizationCancellation/);
});
