import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const reply=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return reply({error:"Not enabled"},503);
 const client=await createClient();
 const {data:{user}}=await client.auth.getUser();
 if(!user?.id||!user.email_confirmed_at)return reply({error:"Verified sign-in required"},401);
 const body=await request.json().catch(()=>null);
 const organizationId=body?.organizationId;
 if(typeof organizationId!=="string"||!/^[0-9a-f-]{36}$/i.test(organizationId))return reply({error:"Invalid organization"},400);
 const admin=createAdminClient();
 const {data:member}=await admin.from("virtus_organization_members").select("status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 const {data:org}=await admin.from("virtus_organizations").select("billing_status").eq("id",organizationId).maybeSingle();
 if(member?.status!=="active"||!["active","trialing"].includes(org?.billing_status))return reply({error:"Active membership required"},403);
 if(body?.action==="start"){
  const {data,error}=await admin.from("virtus_org_training_sessions").insert({organization_id:organizationId,user_id:user.id}).select("id").single();
  return error?reply({error:"Unable to start session"},503):reply({sessionId:data.id});
 }
 const sessionId=body?.sessionId;
 if(typeof sessionId!=="string"||!/^[0-9a-f-]{36}$/i.test(sessionId))return reply({error:"Invalid session"},400);
 const {data:session}=await admin.from("virtus_org_training_sessions").select("id,last_active_at,active_seconds,ended_at").eq("id",sessionId).eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 if(!session||session.ended_at)return reply({error:"Session unavailable"},404);
 const elapsed=(Date.now()-new Date(session.last_active_at).getTime())/1000;
 if(elapsed<0)return reply({error:"Clock mismatch"},409);
 const active=body?.action==="heartbeat"&&body?.active===true&&elapsed>=8&&elapsed<=75;
 const increment=active?Math.min(30,Math.floor(elapsed)):0;
 const patch={last_active_at:new Date().toISOString(),active_seconds:Math.min(86400,session.active_seconds+increment)};
 if(body?.action==="end")patch.ended_at=patch.last_active_at;
 else if(body?.action!=="heartbeat")return reply({error:"Invalid action"},400);
 const {error}=await admin.from("virtus_org_training_sessions").update(patch).eq("id",sessionId).eq("user_id",user.id).eq("active_seconds",session.active_seconds).is("ended_at",null);
 if(error)return reply({error:"Unable to record activity"},503);
 return reply({activeSeconds:patch.active_seconds});
}
