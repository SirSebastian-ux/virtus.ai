import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
const respond = (body, status = 200) => NextResponse.json(body, {status, headers: {"Cache-Control": "private, no-store"}});
export async function GET(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return respond({error:"Unavailable"},503);
  const {data:{user},error} = await (await createClient()).auth.getUser();
  if (error || !user?.id || !user.email_confirmed_at) return respond({error:"Authentication required"},401);
  const organizationId = new URL(request.url).searchParams.get("organizationId") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) return respond({error:"Invalid organization"},400);
  const admin = createAdminClient();
  const {data:actor,error:actorError} = await admin.from("virtus_organization_members").select("role,status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
  if (actorError || actor?.status !== "active" || !["owner","admin"].includes(actor.role)) return respond({error:"Forbidden"},403);
  const [invites,members,endings] = await Promise.all([
    admin.from("virtus_organization_invitations").select("invited_email,created_at,accepted_at,revoked_at,expires_at").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(500),
    admin.from("virtus_organization_members").select("user_id,role,status").eq("organization_id",organizationId).eq("status","active").limit(500),
    admin.from("virtus_org_employee_access_endings").select("user_id,effective_at,state").eq("organization_id",organizationId).limit(500)
  ]);
  if (invites.error || members.error || endings.error) return respond({error:"Unable to load employee directory"},503);
  const scheduled=new Map((endings.data||[]).map(e=>[e.user_id,e]));
  const roster = new Map();
  for (const invite of invites.data || []) {
    const email = String(invite.invited_email || "").toLowerCase();
    if (!email || roster.has(email)) continue;
    const status = invite.revoked_at ? "revoked" : invite.accepted_at ? "accepted" : new Date(invite.expires_at).getTime() < Date.now() ? "expired" : "pending";
    roster.set(email,{email,status,invitedAt:invite.created_at});
  }
  // Resolve only confirmed organization members, never all platform users.
  for (const member of members.data || []) {
    const {data:{user:account},error:lookupError} = await admin.auth.admin.getUserById(member.user_id);
    if (lookupError || !account?.email) continue;
    const email = account.email.toLowerCase();
    const end=scheduled.get(member.user_id);
    roster.set(email,{email,userId:member.user_id,status:end ? (end.state==="scheduled"&&new Date(end.effective_at).getTime()>Date.now()?"ending":"suspended") : "active",accessEndsAt:end?.effective_at||null,role:member.role});
  }
  return respond({employees:[...roster.values()].sort((a,b)=>a.email.localeCompare(b.email))});
}
