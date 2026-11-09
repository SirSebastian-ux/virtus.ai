import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return json({error:"Not enabled"},503);
 const client=await createClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return json({error:"Authentication required"},401);
 const url=new URL(request.url);
 const organizationId=url.searchParams.get("organizationId")||"";
 const email=(url.searchParams.get("email")||"").trim().toLowerCase();
 if(!/^[0-9a-f-]{36}$/i.test(organizationId)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:"Valid organization and email required"},400);
 const admin=createAdminClient();
 const {data:actor,error:actorError}=await admin.from("virtus_organization_members").select("role,status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 if(actorError||!actor||actor.status!=="active"||!["owner","admin"].includes(actor.role))return json({error:"Forbidden"},403);
 const {data:invitations,error:inviteError}=await admin.from("virtus_organization_invitations").select("invited_email,created_at,accepted_at,revoked_at,expires_at").eq("organization_id",organizationId).eq("invited_email",email).order("created_at",{ascending:false}).limit(1);
 if(inviteError)return json({error:"Enrollment lookup unavailable"},503);
 const invite=invitations?.[0]||null;
 return json({email,enrollment:invite?{invitedAt:invite.created_at,accepted:!!invite.accepted_at,revoked:!!invite.revoked_at,expiresAt:invite.expires_at}:null,note:"Private mentorship conversations, reflections, individual psychological profiles and learning assessments are not available to administrators. Employee-specific training activity requires a separate consent-aware tracking system."});
}
