import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
const disabled = () => NextResponse.json({ error: "Organizational enrollment is not enabled." }, { status: 503 });

async function authorizedUser() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}

export async function GET() {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return disabled();
  const user = await authorizedUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const admin = createAdminClient();
  const { data: memberships, error } = await admin.from("virtus_organization_members")
    .select("organization_id,role,status").eq("user_id", user.id).eq("status", "active");
  if (error) return NextResponse.json({ error: "Unable to load organizations" }, { status: 503 });
  const ids = [...new Set((memberships || []).map(m => m.organization_id))];
  const { data: organizations, error: organizationError } = ids.length
    ? await admin.from("virtus_organizations").select("id,name,verified_domain,billing_status,seat_limit").in("id", ids)
    : { data: [], error: null };
  if (organizationError) return NextResponse.json({ error: "Unable to load organization details" }, { status: 503 });
  const byId = new Map((organizations || []).map(o => [o.id, o]));
  const safeMemberships = (memberships || []).map(m => ({
    ...m, organization: byId.get(m.organization_id) || null
  }));
  return NextResponse.json({ memberships: safeMemberships }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return disabled();
  const user = await authorizedUser();
  if (!user?.id || !user?.email) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (name.length < 2 || name.length > 160) return NextResponse.json({ error: "Organization name must be 2–160 characters" }, { status: 400 });
  const client = await createClient();
  const { data: organizationId, error } = await client.rpc("virtus_register_organization", { p_name: name });
  if (error || !organizationId) return NextResponse.json({ error: "Unable to register organization" }, { status: 503 });
  return NextResponse.json({ organization: { id: organizationId, name, billing_status: "pending" } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
