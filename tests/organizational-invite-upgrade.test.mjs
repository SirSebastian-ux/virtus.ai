import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validEmployeeEmail,issueEmployeeInvitation} from "../lib/organization-invitation-delivery.mjs";
const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("employee email syntax is checked before invitation requests",()=>{
 assert.equal(validEmployeeEmail("worker@example.org"),true);
 assert.equal(validEmployeeEmail("badaddress"),false);
 assert.equal(validEmployeeEmail("x @example.org"),false);
});
test("registration uses custom steppers instead of browser number spinner inputs",()=>{
 const registration=file("app/organizations/register/page.js");
 assert.match(registration,/<LicenseQuantity/);
 assert.doesNotMatch(registration,/type="number"/);
 const stepper=file("app/organizations/LicenseQuantity.js");
 assert.match(stepper,/inputMode="numeric"/);
 assert.match(stepper,/aria-label="Add one license"/);
});
test("invitation sign-in is a visible dedicated CTA",()=>{
 const page=file("app/organizations/accept/page.js");
 assert.match(page,/org-invite-signin-button/);
 assert.match(page,/border:2px solid/);
});
test("private progress does not appear on HR administration or organization selection",()=>{
 const bar=file("app/components/VirtusDevelopmentBar.js");
 assert.match(bar,/organizations/);
 assert.match(bar,/register\|workspace\|dashboard\|accept/);
 const hr=file("app/organizations/dashboard/HRDevelopmentIntelligence.js");
 assert.match(hr,/Pre-existing individual Mentor stages are not imported/);
});
test("seat upgrade queues employee email before Stripe update and delivers after paid webhook only",()=>{
 const route=file("app/api/organizations/billing/seats/route.js");
 const webhook=file("app/api/organizations/billing/webhook/route.js");
 const sender=file("lib/organization-invitation-delivery.mjs");
 assert.match(route,/virtus_organization_license_invite_queue/);
 assert.ok(route.indexOf("virtus_organization_license_invite_queue")<route.indexOf("client.subscriptions.update"));
 assert.match(webhook,/event.type==="invoice.payment_succeeded"&&status==="active"/);
 assert.match(webhook,/dispatchPaidQueuedInvitations/);
 assert.match(sender,/idempotencyKey/);
 assert.match(sender,/status:"sent"/);
 assert.match(sender,/No paid employee licenses are available/);
});
test("billing upgrade CTA requires owner confirmation and does not automatically purchase seats on invite",()=>{
 const component=file("app/organizations/dashboard/EmployeeInvitations.js");
 assert.match(component,/setQuote/);
 assert.match(component,/Confirm purchase and queue invitation/);
 assert.match(component,/invitedEmail:quote.recipient/);
 assert.match(component,/payment_pending/);
});
test("seat guard counts active members, pending invitations and outstanding queued upgrades",async()=>{
 const table=name=>{
   const chain={};
   for(const k of ["select","eq","neq","is","gt","lte","in","limit"]){chain[k]=()=>chain;}
   chain.then=resolve=>resolve({count:name==="virtus_organization_members"?2:name==="virtus_organization_invitations"?0:1,data:[],error:null});
   return chain;
 };
 const fake={from:table};
 await assert.rejects(issueEmployeeInvitation({admin:fake,organizationId:"a",email:"member@example.com",invitedBy:"b",org:{billing_status:"active",seat_limit:2,archived_at:null}}),/No paid employee licenses/);
});
