import { hasOrganizationMentorAccess } from "./virtus-org-entitlement.mjs";

export async function resolveEffectivePlan({ userId, userClient, adminClient, personalPlan = "free" }) {
  const organizationMentorActive = await hasOrganizationMentorAccess({ userId, userClient, adminClient });
  return {
    plan: organizationMentorActive ? "premium" : personalPlan,
    source: organizationMentorActive ? "organization" : "personal",
    organizationMentorActive,
  };
}
