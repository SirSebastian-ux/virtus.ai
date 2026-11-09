import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { invitationEmail } from "@/lib/organization-invitation-email.mjs";

export const dynamic = "force-dynamic";
const reply = (error, status) => NextResponse.json({ error }, { status });
export async function POST(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return reply("Not enabled", 503);
  if (!process.env.RESEND_API_KEY || !process.env.VIRTUS_ORGANIZATION_INVITE_FROM) return reply("Invitation email service is not configured", 503);
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.id || !user.email_confirmed_at) return reply("Verified authentication required", 401);
  const body = await request.json().catch(() => null);
  const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply("Invalid invitation", 400);
  const admin = createAdminClient();
  const { data: membership, error: memberError } = await admin.from("virtus_organization_members").select("role,status").eq("organization_id", organizationId).eq("user_id", user.id).maybeSingle();
  if (memberError || !membership || membership.status !== "active" || !["owner","admin"].includes(membership.role)) return reply("Forbidden", 403);
  const { data: org, error: orgError } = await admin.from("virtus_organizations").select("name,verified_domain,billing_status,seat_limit").eq("id", organizationId).maybeSingle();
  if (orgError || !org || !["active","trialing"].includes(org.billing_status) || org.seat_limit < 1) return reply("Organization has no active seats", 409);
  const { count: activeCount, error: countError } = await admin.from("virtus_organization_members").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).eq("status","active");
  if (countError || activeCount >= org.seat_limit) return reply("No seats available", 409);
  const { count: recentCount, error: recentError } = await admin.from("virtus_organization_invitations").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).gte("created_at",new Date(Date.now()-3600000).toISOString());
  if (recentError || recentCount >= 20) return reply("Invitation limit reached; retry later",429);
  const token = randomBytes(32).toString("hex");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { data: invitation, error: insertError } = await admin.from("virtus_organization_invitations").insert({
    organization_id:organizationId, invited_email:email, invited_role:"member",token_hash,
    invited_by:user.id, expires_at:new Date(Date.now()+48*3600000).toISOString()
  }).select("id").single();
  if (insertError || !invitation) return reply("Unable to create invitation",503);
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!base || !/^https:\/\//.test(base)) {
    await admin.from("virtus_organization_invitations").update({revoked_at:new Date().toISOString()}).eq("id",invitation.id);
    return reply("Invitation URL not configured",503);
  }
  const url = new URL("/organizations/accept",base);
  url.searchParams.set("token",token);
  const message=invitationEmail({organizationName:org.name,acceptUrl:url.toString(),recipientEmail:email});
  const response = await fetch("https://api.resend.com/emails",{
    method:"POST",headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({from:process.env.VIRTUS_ORGANIZATION_INVITE_FROM,to:[email],...message})
  }).catch(()=>null);
  if (!response?.ok) {
    await admin.from("virtus_organization_invitations").update({revoked_at:new Date().toISOString()}).eq("id",invitation.id);
    return reply("Invitation email could not be delivered",502);
  }
  return NextResponse.json({status:"sent"},{status:202,headers:{"Cache-Control":"no-store"}});
}
