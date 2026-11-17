import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("global learning event writes are restricted to privileged server client",()=>{
 const chat=read("app/api/chat/route.js");
 assert.match(chat,/createAdminClient\(\)\.rpc\(\s*"log_global_learning_event"/);
 assert.doesNotMatch(chat,/supabase\.rpc\(\s*"log_global_learning_event"/);
});

test("consumer Stripe invoice renewals accept current and legacy subscription references",()=>{
 const webhook=read("app/api/stripe/webhook/route.js");
 assert.match(webhook,/invoice\.parent\?\.subscription_details\?\.subscription\s*\?\?\s*invoice\.subscription/);
 assert.match(webhook,/stripe\.subscriptions\.retrieve\(subscriptionId\)/);
 assert.match(webhook,/stripe\.webhooks\.constructEvent/);
 assert.match(webhook,/stripe\.subscriptions\.retrieve\(event\.data\.object\.id\)/);
});

test("personal checkout is authenticated and prevents arbitrary pricing",()=>{
 const checkout=read("app/api/stripe/checkout/route.js");
 assert.match(checkout,/supabase\.auth\.getUser\(\)/);
 assert.match(checkout,/stripe\.prices\.retrieve\(priceId\)/);
 assert.match(checkout,/stripePrice\.active/);
 assert.match(checkout,/stripePrice\.product\s*!==\s*expectedProduct/);
 assert.match(checkout,/VIRTUS_PAID_MEMBERSHIPS_ENABLED/);
 assert.match(checkout,/stripe\.subscriptions\.list\(\{customer:stripeCustomerId,status:"all"/);
 assert.match(checkout,/existingVirtus/);
});

test("organizational payment changes require owner authority",()=>{
 const owner=read("lib/organization-billing-owner.mjs");
 assert.match(owner,/org\.owner_user_id!==user\.id/);
 assert.match(owner,/membership\?\.role!=="owner"/);
 const cancel=read("app/api/organizations/billing/cancel/route.js");
 assert.match(cancel,/body\.confirmName!==c\.org\.name/);
 assert.match(cancel,/cancel_at_period_end:true/);
});

test("organization privacy boundaries are server-scoped",()=>{
 const entitlement=read("lib/virtus-org-entitlement.mjs");
 assert.match(entitlement,/organization_id/);
 assert.match(entitlement,/user_id/);
 const reporting=read("app/api/organizations/reporting/route.js");
 assert.match(reporting,/organizationId/);
});
