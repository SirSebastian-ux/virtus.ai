import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const chat=readFileSync(new URL("../app/api/chat/route.js",import.meta.url),"utf8");
const workspace=readFileSync(new URL("../app/organizations/workspace/page.js",import.meta.url),"utf8");
test("active organizational members get premium mentor access without modifying personal subscriptions",()=>{
 assert.match(chat,/hasActiveOrganizationMentorEntitlement\(/);
 assert.match(chat,/organizationMentorActive \? "premium"/);
 assert.match(chat,/organizationMentorActive \? "active"/);
 assert.doesNotMatch(chat,/\.from\("profiles"\)\.update\(\{\s*plan:\s*"premium"/);
});
test("mentor entitlement is gated and validated against active membership and organizational access",()=>{
 assert.match(chat,/VIRTUS_ORG_MENTORSHIP_ENABLED/);
 assert.match(chat,/\.eq\("status", "active"\)/);
 assert.match(chat,/virtus_organization_access/);
 assert.match(chat,/if \(allowed === true\) return true/);
});
test("organization entry links to full mentor and keeps HR workspace role-restricted",()=>{
 assert.match(workspace,/Full Virtus Mentor/);
 assert.match(workspace,/href="\/"/);
 assert.match(workspace,/\["owner","admin"\]\.includes\(m\.role\)/);
});
