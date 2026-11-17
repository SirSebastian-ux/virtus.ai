import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { loadOrgPracticeMemory } from "@/lib/virtus-org-practice-memory.mjs";
export const dynamic="force-dynamic";
const fail=(error,status)=>NextResponse.json({error},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request){
  if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true"||process.env.VIRTUS_ORG_MENTORSHIP_ENABLED!=="true") return fail("Organizational mentorship unavailable",503);
  if(!process.env.OPENAI_API_KEY) return fail("Mentorship engine not configured",503);
  const client=await createClient();
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user?.id||!user.email_confirmed_at) return fail("Verified sign-in required",401);
  const body=await request.json().catch(()=>null);
  const organizationId=body?.organizationId;
  const message=typeof body?.message==="string"?body.message.trim():"";
  const conversationId=body?.conversationId||null;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!uuid.test(organizationId||"")||message.length<1||message.length>5000||(conversationId&&!uuid.test(conversationId))) return fail("Invalid request",400);
  const {data:allowed,error:accessError}=await client.rpc("virtus_organization_access",{p_organization_id:organizationId});
  if(accessError||allowed!==true) return fail("Organizational access denied",403);
  const admin=createAdminClient();
  let threadId=conversationId;
  if(threadId){
    const {data:thread,error}=await admin.from("virtus_org_private_conversations").select("id").eq("id",threadId).eq("user_id",user.id).eq("organization_id",organizationId).maybeSingle();
    if(error||!thread) return fail("Conversation not found",404);
  }else{
    const {data:thread,error}=await client.from("virtus_org_private_conversations").insert({organization_id:organizationId,user_id:user.id}).select("id").single();
    if(error||!thread) return fail("Unable to create private conversation",503);
    threadId=thread.id;
  }
  const {data:history,error:historyError}=await client.from("virtus_org_private_messages").select("role,content").eq("conversation_id",threadId).order("created_at",{ascending:false}).limit(20);
  if(historyError) return fail("Unable to load private conversation",503);
  const practiceMemory = await loadOrgPracticeMemory({ db: admin, userId: user.id, organizationId });
  const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  let answer;
  try{
    const response=await ai.responses.create({model:process.env.VIRTUS_ORG_MODEL||"gpt-4.1-mini",input:[
      {role:"system",content:"You are Virtus AI, a confidential workplace leadership mentor. Help the employee reflect critically on thought, awareness, emotion, behavior and communication. Be thoughtful, practical, respectful and psychologically responsible. Do not claim clinical diagnosis or share private disclosures with the employer. Employer access is limited to aggregate program metrics. Never invent database records or claim completion is proof of behavior."},
      ...(practiceMemory ? [{role:"system",content:practiceMemory}] : []),
      ...[...(history||[])].reverse().map(x=>({role:x.role,content:x.content})),
      {role:"user",content:message}
    ]});
    answer=String(response.output_text||"").trim().slice(0,20000);
    if(!answer) throw Error("Empty response");
  }catch{return fail("Mentorship response unavailable; please retry",502);}
  // Revalidate before persisting, including mid-request billing or membership changes.
  const {data:stillAllowed,error:recheckError}=await client.rpc("virtus_organization_access",{p_organization_id:organizationId});
  if(recheckError||stillAllowed!==true) return fail("Organizational access changed",403);
  const {error:writeError}=await admin.from("virtus_org_private_messages").insert([
    {conversation_id:threadId,user_id:user.id,role:"user",content:message},
    {conversation_id:threadId,user_id:user.id,role:"assistant",content:answer}
  ]);
  if(writeError) return fail("Unable to save private conversation",503);
  return NextResponse.json({conversationId:threadId,reply:answer},{headers:{"Cache-Control":"private, no-store"}});
}
