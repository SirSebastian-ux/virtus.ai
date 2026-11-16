import {randomBytes,createHash,createHmac} from "node:crypto";
import {invitationEmail} from "./organization-invitation-email.mjs";

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const validEmployeeEmail=email=>typeof email==="string"&&email.length<=254&&emailPattern.test(email);
const stamp=()=>new Date().toISOString();
async function sendEmail({orgName,email,token,idempotencyKey}){
 if(!process.env.RESEND_API_KEY||!process.env.VIRTUS_ORGANIZATION_INVITE_FROM)throw Error("Invitation sender not configured");
 const base=process.env.NEXT_PUBLIC_APP_URL;
 if(!base||!/^https:\/\//.test(base))throw Error("Application URL unavailable");
 const url=new URL("/organizations/accept",base);
 url.searchParams.set("token",token);
 const message=invitationEmail({organizationName:orgName,acceptUrl:url.toString(),recipientEmail:email});
 const response=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json",...(idempotencyKey?{"Idempotency-Key":idempotencyKey}:{})},
   body:JSON.stringify({from:process.env.VIRTUS_ORGANIZATION_INVITE_FROM,to:[email],...message})
 }).catch(()=>null);
 if(!response?.ok)throw Error("Invitation email could not be delivered");
}
export async function issueEmployeeInvitation({admin,organizationId,email,invitedBy,org,token,idempotencyKey}){
 if(!validEmployeeEmail(email))throw Error("Invalid invitation email");
 if(!["active","trialing"].includes(org.billing_status)||org.archived_at||org.seat_limit<1)throw Error("Organization not active");
 if(!idempotencyKey){
  const duplicate=await admin.from("virtus_organization_invitations").select("id").eq("organization_id",organizationId).eq("invited_email",email).is("accepted_at",null).is("revoked_at",null).gt("expires_at",stamp()).limit(1);
  if(duplicate.error)throw Error("Unable to verify existing invitations");
  if(duplicate.data?.length)throw Error("An invitation for this employee is already pending");
 }
 const [members,pending]=await Promise.all([
   admin.from("virtus_organization_members").select("id",{head:true,count:"exact"}).eq("organization_id",organizationId).eq("status","active").neq("role","owner"),
   admin.from("virtus_organization_invitations").select("id",{head:true,count:"exact"}).eq("organization_id",organizationId).is("accepted_at",null).is("revoked_at",null).gt("expires_at",stamp())
 ]);
 if(members.error||pending.error)throw Error("Seat reservation unavailable");
 const {count:queued,error:queueError}=!idempotencyKey ? await admin.from("virtus_organization_license_invite_queue").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).in("status",["pending","sending"]).lte("target_seats",org.seat_limit) : {count:0,error:null};
 if(queueError)throw Error("Unable to verify reserved licenses");
 if((members.count||0)+(pending.count||0)+(queued||0)>=org.seat_limit)throw Error("No paid employee licenses are available");
 const t=token||randomBytes(32).toString("hex");
 const hash=createHash("sha256").update(t).digest("hex");
 const {data:existing,error:findError}=await admin.from("virtus_organization_invitations").select("id,revoked_at").eq("token_hash",hash).maybeSingle();
 if(findError)throw Error("Unable to check invitation");
 let record=existing;
 if(record?.revoked_at){
  const revived=await admin.from("virtus_organization_invitations").update({revoked_at:null,expires_at:new Date(Date.now()+48*3600000).toISOString()}).eq("id",record.id);
  if(revived.error)throw Error("Unable to restore invitation for retry");
 }
 if(!record){
   const inserted=await admin.from("virtus_organization_invitations").insert({organization_id:organizationId,invited_email:email,invited_role:"member",token_hash:hash,invited_by:invitedBy,expires_at:new Date(Date.now()+48*3600000).toISOString()}).select("id").single();
   if(inserted.error||!inserted.data)throw Error("Unable to create invitation");
   record=inserted.data;
 }
 try{await sendEmail({orgName:org.name,email,token:t,idempotencyKey});}
 catch(error){if(!existing)await admin.from("virtus_organization_invitations").update({revoked_at:stamp()}).eq("id",record.id);throw error;}
 return {status:"sent"};
}
export async function dispatchPaidQueuedInvitations({admin,organizationId}){
 const {data:org,error:orgError}=await admin.from("virtus_organizations").select("id,name,owner_user_id,billing_status,seat_limit,archived_at").eq("id",organizationId).maybeSingle();
 if(orgError||!org||org.archived_at||org.billing_status!=="active")return {sent:0,unavailable:true};
 const {data:rows,error}=await admin.from("virtus_organization_license_invite_queue").select("*").eq("organization_id",organizationId).eq("status","pending").lte("target_seats",org.seat_limit).order("created_at",{ascending:true}).limit(10);
 if(error)throw Error("Pending invitations unavailable");
 let sent=0;
 for(const row of rows||[]){
  const claim=await admin.from("virtus_organization_license_invite_queue").update({status:"sending",processed_at:stamp()}).eq("id",row.id).eq("status","pending").select("id").maybeSingle();
  if(claim.error||!claim.data)continue;
  try{
    const secret=process.env.VIRTUS_ORGANIZATION_WEBHOOK_SECRET;
    if(!secret)throw Error("Queue token configuration missing");
    const token=createHmac("sha256",secret).update("queued-invite:"+row.request_id+":"+organizationId).digest("hex");
    await issueEmployeeInvitation({admin,organizationId,email:row.invited_email,invitedBy:row.requested_by,org,token,idempotencyKey:"virtus-employee-invite-"+row.request_id});
    const updated=await admin.from("virtus_organization_license_invite_queue").update({status:"sent",processed_at:stamp(),failure_reason:null}).eq("id",row.id);
    if(updated.error)throw Error("Invitation status update failed");
    sent++;
  }catch(error){
    await admin.from("virtus_organization_license_invite_queue").update({status:"failed",processed_at:stamp(),failure_reason:String(error.message).slice(0,180)}).eq("id",row.id);
  }
 }
 return {sent};
}
