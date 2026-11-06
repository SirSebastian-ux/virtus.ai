import { organizationContext,orgResponse,appendOrgAudit } from "@/lib/virtus-org-server";
import { digestInviteToken,isBillableOrganization,normalizeInviteEmail } from "@/lib/virtus-organizations.mjs";
import { checkRateLimit,getRateLimitIdentity,rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request) {
  const rate=checkRateLimit({key:`org-accept:${getRateLimitIdentity(request)}`,limit:12,windowMs:60_000});
  if(!rate.allowed) return rateLimitResponse(rate);
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in with the invited email address."},401);
  if(!user.email_confirmed_at) return orgResponse({error:"Confirm your email address before accepting."},403);
  const raw=await request.json().catch(()=>null);
  const tokenHash=digestInviteToken(raw?.token);
  if(!tokenHash) return orgResponse({error:"Invalid or expired invitation."},400);
  const {data:invite,error}=await admin.from("virtus_org_invitations")
    .select("id,organization_id,invited_email,status,expires_at")
    .eq("token_hash",tokenHash).maybeSingle();
  if(error||!invite||invite.status!=="pending"||Date.parse(invite.expires_at)<=Date.now())
    return orgResponse({error:"Invalid or expired invitation."},404);
  const email=normalizeInviteEmail(user.email);
  if(email!==invite.invited_email) return orgResponse({error:"Sign in with the exact invited email address."},403);
  const {data:org,error:orgError}=await admin.from("virtus_organizations")
    .select("id,name,status,billing_status,seat_limit")
    .eq("id",invite.organization_id).maybeSingle();
  if(orgError||!isBillableOrganization(org))
    return orgResponse({error:"This organization's sponsored access is not currently active."},403);
  // Claim the invitation exactly once before allocating the seat. A revoked or
  // concurrently accepted token cannot create a new membership.
  const {data:claimed,error:claimError}=await admin.from("virtus_org_invitations")
    .update({status:"accepted",accepted_by:user.id,accepted_at:new Date().toISOString()})
    .eq("id",invite.id).eq("status","pending")
    .gt("expires_at",new Date().toISOString())
    .select("id").maybeSingle();
  if(claimError||!claimed) return orgResponse({error:"This invitation is no longer available."},409);
  const restoreInvite=()=>admin.from("virtus_org_invitations")
    .update({status:"pending",accepted_by:null,accepted_at:null})
    .eq("id",invite.id).eq("status","accepted").eq("accepted_by",user.id);
  const {data:existing,error:existingError}=await admin.from("virtus_org_memberships")
    .select("id,status,role").eq("organization_id",org.id)
    .eq("user_id",user.id).maybeSingle();
  if(existingError) { await restoreInvite(); return orgResponse({error:"Could not verify membership."},503); }
  if(existing?.status==="active") { await restoreInvite(); return orgResponse({error:"This account already belongs to the organization."},409); }
  let result;
  if(existing) {
    result=await admin.from("virtus_org_memberships").update({status:"active",role:"member"})
      .eq("organization_id",org.id).eq("user_id",user.id)
      .select("id").single();
  } else {
    result=await admin.from("virtus_org_memberships").insert({
      organization_id:org.id,user_id:user.id,role:"member",status:"active",
    }).select("id").single();
  }
  // Database trigger serializes seat claims and rejects any over-capacity insertion.
  if(result.error) {
    await restoreInvite();
    return orgResponse({error:"No licensed seat is available or the organization is inactive."},409);
  }
  await appendOrgAudit(admin,org.id,user.id,"invitation.accepted",invite.id);
  return orgResponse({accepted:true,organization:{id:org.id,name:org.name}});
}
