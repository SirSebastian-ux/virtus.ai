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
 assert.match(downgrade,/p_effective_at:effectiveAt/);
});
test("downgrade schedules paid-period expiry before reducing renewal quantity",()=>{
 const code=file("app/api/organizations/billing/downgrade/route.js");
 assert.ok(code.indexOf("virtus_org_schedule_member_downgrades")<code.indexOf("stripe.subscriptions.update"));
 assert.doesNotMatch(code,/virtus_org_suspend_members_for_downgrade/);
 assert.match(code,/accessEndsAt:endAt/);
 assert.match(code,/proration_behavior:"none"/);
 assert.match(code,/idempotencyKey:/);
 assert.match(code,/virtus_org_rollback_member_downgrades/);
 assert.match(code,/target<0/);
});
test("cancellation permits only end of paid period and requires owner confirmation",()=>{
 const code=file("app/api/organizations/billing/cancel/route.js");
 assert.match(code,/cancel_at_period_end:true/);
 assert.doesNotMatch(code,/subscriptions.cancel/);
 assert.match(code,/cancel_at_period_end:true/);
 assert.match(code,/body.confirmName!==c.org.name/);
 assert.match(code,/body.timing!=="period_end"/);
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
 assert.match(ui,/Schedule the end of organization-funded access/);
 assert.match(ui,/Schedule employee downgrade/);
 assert.match(ui,/keep their already-paid Mentor access/);
 assert.doesNotMatch(ui,/Cancel company subscription now/);
 assert.match(ui,/Schedule company cancellation/);
 assert.match(dash,/OrganizationCancellation/);
 assert.doesNotMatch(dash,/Company registration and employee licenses/);
 assert.doesNotMatch(dash,/<OrganizationLicenses/);
 assert.match(file("lib/organization-billing-notices.mjs"),/Idempotency-Key/);
 assert.match(file("app/api/organizations/billing/notifications/route.js"),/ownerBillingContext/);
 assert.match(file("app/api/organizations/billing/downgrade/route.js"),/virtus_org_billing_notices/);
 assert.match(file("app/api/organizations/billing/webhook/route.js"),/dispatchOrganizationBillingNotices/);
});

test("renewing seats exclude members scheduled to lose access after paid period",()=>{
 assert.match(file("lib/organization-billing-owner.mjs"),/virtus_org_employee_access_endings/);
 assert.match(file("lib/organization-invitation-delivery.mjs"),/virtus_org_employee_access_endings/);
 assert.match(file("app/api/organizations/billing/seats/route.js"),/virtus_org_employee_access_endings/);
});
