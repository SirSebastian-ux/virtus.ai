import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
export const dynamic="force-dynamic";
const narratives={awareness:["Awareness practice shows a relative strength in the completed exercises.","Prioritize observing assumptions before acting."],metacognition:["Metacognitive reflection is comparatively well established in completed exercises.","Practice examining the reasoning behind decisions."],emotional_intelligence:["Emotional intelligence exercises show a relative strength.","Reinforce emotional identification and deliberate response."],critical_thinking:["Critical-thinking practice shows a relative strength.","Prioritize evidence checking and alternative explanations."],communication:["Communication practice shows a relative strength.","Practice clear requests, listening and constructive feedback."],leadership_practice:["Leadership practice shows a relative strength.","Develop consistent follow-through and accountable decisions."]};
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Not enabled"},{status:503});
 const client=await createClient();
 const {data:{user}}=await client.auth.getUser();
 if(!user?.id||!user.email_confirmed_at)return NextResponse.json({error:"Authentication required"},{status:401});
 const id=new URL(request.url).searchParams.get("organizationId");
 if(!id||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Invalid organization"},{status:400});
 const {data,error}=await client.rpc("virtus_org_development_report",{p_org:id});
 if(error)return NextResponse.json({error:"Development reporting unavailable"},{status:error.code==="42501"?403:503});
 const domains=Array.isArray(data?.domains)?data.domains:[];
 const narrative=domains.map(d=>({domain:d.domain,summary:(narratives[d.domain]||["Structured exercise activity recorded.","Continue guided practice."])[d.scorePercent>=70?0:1]}));
 return NextResponse.json({...data,narrative},{headers:{"Cache-Control":"private, no-store"}});
}
