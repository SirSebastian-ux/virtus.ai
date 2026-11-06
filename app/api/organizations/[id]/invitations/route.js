import { organizationContext,orgResponse,requireOrganizationAdmin,appendOrgAudit } from "@/lib/virtus-org-server";
import { normalizeInviteEmail,generateInviteToken,digestInviteToken,isBillableOrganization } from "@/lib/virtus-organizations.mjs";
import { checkRateLimit,getRateLimitIdentity,rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request,{params}) {
  const {id}=await params;
  const rate=checkRateLimit({key:`org-invite:${getRateLimitIdentity(request)}`,limit:8,windowMs:60_000});
  if(!rate.allowed) return rateLimitResponse(rate);
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in to invite colleagues."},401);
  const access=await requireOrganizationAdmin({admin,user,organizationId:id});
  if(!access) return orgResponse({error:"Organization not found."},404);
  // No unpaid/unauthorized seat activation, and no silent organizational trial.
  if(!isBillableOrganization(access.org)) return orgResponse({
    error:"Corporate seats are not activated. Configure billing before inviting employees.",
    billingRequired:true,
  },403);
  const raw=await request.json().catch(()=>null);
  const email=normalizeInviteEmail(raw?.email);
  if(!email) return orgResponse({error:"Enter a valid employee email address."},400);
  if(email===user.email?.toLowerCase()) return orgResponse({error:"You already administer this organization."},409);
  const {count:active,error:activeError}=await admin.from("virtus_org_memberships")
    .select("id",{count:"exact",head:true})
    .eq("organization_id",id).eq("role","member").eq("status","active");
  if(activeError) return orgResponse({error:"Could not verify licensed seat capacity."},503);
  const {data:pending,error:pendingError}=await admin.from("virtus_org_invitations")
    .select("id,invited_email,expires_at")
    .eq("organization_id",id).eq("status","pending").limit(1000);
  if(pendingError) return orgResponse({error:"Could not verify pending invitations."},503);
  const validPending=(pending||[]).filter(p=>Date.parse(p.expires_at)>Date.now());
  if((active||0)+validPending.length>=access.org.seat_limit)
    return orgResponse({error:"No unused licensed seats remain."},409);
  const dup=validPending.find(p=>p.invited_email===email);
  if(dup) return orgResponse({error:"An active invitation already exists for this email."},409);
  const expired=(pending||[]).filter(p=>p.invited_email===email&&Date.parse(p.expires_at)<=Date.now());
  if(expired.length) {
    const {error:revokeError}=await admin.from("virtus_org_invitations").update({status:"revoked"})
      .eq("organization_id",id).eq("invited_email",email).eq("status","pending");
    if(revokeError) return orgResponse({error:"Could not replace expired invitation."},503);
  }
  const token=generateInviteToken(), token_hash=digestInviteToken(token);
  const expires_at=new Date(Date.now()+7*24*60*60*1000).toISOString();
  const {data:invitation,error}=await admin.from("virtus_org_invitations").insert({
    organization_id:id,invited_email:email,token_hash,
    expires_at,created_by:user.id,status:"pending",
  }).select("id").single();
  if(error) return orgResponse({error:"Could not create invitation."},500);
  await appendOrgAudit(admin,id,user.id,"invitation.created",invitation.id);
  // Token is returned only once, to the authorized administrator, for deliberate delivery.
  // URL fragment avoids sending the invitation token in ordinary HTTP request paths.
  const base=(process.env.NEXT_PUBLIC_APP_URL||"https://virtusaiworld.com").replace(/\/$/,"");
  return orgResponse({
    invitationId:invitation.id,invitedEmail:email,expires_at,
    inviteUrl:`${base}/organizations/accept#token=${token}`,
    emailSent:false,
    notice:"Copy and send this one-time invitation link securely. No email was sent automatically.",
  },201);
}
export async function DELETE(request,{params}) {
  const {id}=await params;
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in."},401);
  const access=await requireOrganizationAdmin({admin,user,organizationId:id});
  if(!access) return orgResponse({error:"Organization not found."},404);
  const raw=await request.json().catch(()=>null);
  const inviteId=raw?.invitationId;
  if(typeof inviteId!=="string"||!/^[0-9a-f-]{36}$/i.test(inviteId))
    return orgResponse({error:"Invalid invitation."},400);
  const {data,error}=await admin.from("virtus_org_invitations")
    .update({status:"revoked"})
    .eq("id",inviteId).eq("organization_id",id).eq("status","pending")
    .select("id").maybeSingle();
  if(error) return orgResponse({error:"Could not revoke invitation."},500);
  if(!data) return orgResponse({error:"Pending invitation not found."},404);
  await appendOrgAudit(admin,id,user.id,"invitation.revoked",inviteId);
  return orgResponse({revoked:true});
}
