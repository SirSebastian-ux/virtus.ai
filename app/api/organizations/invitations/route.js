import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isOrganizationEmail } from "@/lib/organizational-mentorship";

export const dynamic = "force-dynamic";
const respond = (error, status) => NextResponse.json({ error }, { status });
export async function POST(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return respond("Not enabled", 503);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return respond("Authentication required", 401);
  const body = await request.json().catch(() => null);
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[0-9a-f-]{36}$/i.test(organizationId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond("Invalid invitation", 400);
  const admin = createAdminClient();
  const { data: membership } = await admin.from("virtus_organization_members").select("role,status")
    .eq("organization_id", organizationId).eq("user_id", user.id).maybeSingle();
  if (!membership || membership.status !== "active" || !["owner", "admin"].includes(membership.role)) return respond("Forbidden", 403);
  const { data: org } = await admin.from("virtus_organizations").select("verified_domain,billing_status,seat_limit")
    .eq("id", organizationId).maybeSingle();
  if (!org || !["active", "trialing"].includes(org.billing_status) || org.seat_limit < 1) return respond("Organization has no active paid seats", 409);
  if (!org.verified_domain || !isOrganizationEmail(email, org.verified_domain)) return respond("Email domain not verified for organization", 403);
  // Delivery is intentionally disabled until an authenticated email sender and rate limit are configured.
  if (process.env.VIRTUS_ORG_INVITES_DELIVERY_READY !== "true") return respond("Invitation delivery is not configured", 503);
  const token = randomBytes(32).toString("hex");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { error } = await admin.from("virtus_organization_invitations").insert({
    organization_id: organizationId, invited_email: email, invited_role: "member", token_hash,
    invited_by: user.id, expires_at: new Date(Date.now() + 48 * 3600000).toISOString()
  });
  if (error) return respond("Could not create invitation", 503);
  // Never return raw invitation tokens to the browser or logs.
  return NextResponse.json({ status: "pending_delivery" }, { status: 202 });
}
