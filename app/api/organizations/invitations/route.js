import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
import {issueEmployeeInvitation,validEmployeeEmail} from "@/lib/organization-invitation-delivery.mjs";
export const dynamic="force-dynamic";
const reply=(error,status)=>NextResponse.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return reply("Not enabled",503);
 const client=await createClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return reply("Verified authentication required",401);
 const body=await request.json().catch(()=>null);
 const organizationId=typeof body?.organizationId==="string"?body.organizationId:"";
 const email=typeof body?.email==="string"?body.email.trim().toLowerCase():"";
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(organizationId)||!validEmployeeEmail(email))return reply("Invalid invitation",400);
 const admin=createAdminClient();
 const {data:membership,error:memberError}=await admin.from("virtus_organization_members").select("role,status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 if(memberError||membership?.status!=="active"||!["owner","admin"].includes(membership.role))return reply("Forbidden",403);
 const {data:org,error:orgError}=await admin.from("virtus_organizations").select("name,billing_status,seat_limit,archived_at").eq("id",organizationId).maybeSingle();
 if(orgError||!org||org.archived_at||!["active","trialing"].includes(org.billing_status))return reply("Organization does not have an active subscription",409);
 const {count,error:recentError}=await admin.from("virtus_organization_invitations").select("id",{count:"exact",head:true}).eq("organization_id",organizationId).gte("created_at",new Date(Date.now()-3600000).toISOString());
 if(recentError||count>=20)return reply("Invitation limit reached; retry later",429);
 try{
  await issueEmployeeInvitation({admin,organizationId,email,invitedBy:user.id,org});
  return NextResponse.json({status:"sent"},{status:202,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const noSeats=error.message.includes("No paid employee licenses");
  return NextResponse.json({error:error.message,upgradeAvailable:noSeats&&membership.role==="owner"&&org.billing_status==="active",requiredSeats:org.seat_limit+1},{status:noSeats?409:503,headers:{"Cache-Control":"no-store"}});
 }
}
