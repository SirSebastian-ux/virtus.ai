import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const chat=file("app/api/chat/route.js");
const entitlement=file("lib/virtus-org-entitlement.mjs");
const workspace=file("app/organizations/workspace/page.js");
test("organizational Mentor entitlement does not mutate personal subscription",()=>{
 assert.match(chat,/hasOrganizationMentorAccess\(/);
 assert.match(chat,/organizationMentorActive\s*\?\s*"premium"/);
 assert.match(chat,/organizationMentorActive\s*\?\s*"active"/);
 assert.doesNotMatch(chat,/\.from\("profiles"\)\.update\(\{\s*plan:\s*"premium"/);
});
test("Mentor access checks feature flags, active membership and authorized organization",()=>{
 assert.match(entitlement,/VIRTUS_ORG_MENTORSHIP_ENABLED/);
 assert.match(entitlement,/VIRTUS_ORGANIZATIONS_ENABLED/);
 assert.match(entitlement,/\.eq\("status","active"\)/);
 assert.match(entitlement,/virtus_organization_access/);
 assert.match(entitlement,/if\(allowed===true\) return true/);
 assert.match(entitlement,/if\(error\) throw/);
});
test("organization links to full Mentor and limits HR workspace by role",()=>{
 assert.match(workspace,/Full Virtus Mentor/);
 assert.match(workspace,/href="\/"/);
 assert.match(workspace,/\["owner","admin"\]\.includes\(m\.role\)/);
});
