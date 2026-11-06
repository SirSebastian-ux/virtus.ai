import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Not enabled"},{status:503});
 const client=await createClient();
 const {data:{user}}=await client.auth.getUser();
 if(!user?.id||!user.email_confirmed_at)return NextResponse.json({error:"Authentication required"},{status:401});
 const body=await request.json().catch(()=>null);
 const domain=body?.domain,exerciseKey=body?.exerciseKey,organizationId=body?.organizationId,score=body?.score;
 if(!/^[0-9a-f-]{36}$/i.test(organizationId||"")||!["awareness","metacognition","emotional_intelligence","critical_thinking","communication","leadership_practice"].includes(domain)||typeof exerciseKey!=="string"||exerciseKey.length<1||exerciseKey.length>120||!Number.isInteger(score)||score<1||score>5)return NextResponse.json({error:"Invalid exercise score"},{status:400});
 const admin=createAdminClient();
 const {data:member}=await admin.from("virtus_organization_members").select("status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 const {data:org}=await admin.from("virtus_organizations").select("billing_status").eq("id",organizationId).maybeSingle();
 if(member?.status!=="active"||!["active","trialing"].includes(org?.billing_status))return NextResponse.json({error:"Active membership required"},{status:403});
 const {error}=await admin.from("virtus_org_exercise_scores").upsert({organization_id:organizationId,user_id:user.id,domain,exercise_key:exerciseKey,score,scored_at:new Date().toISOString()},{onConflict:"organization_id,user_id,domain,exercise_key"});
 return error?NextResponse.json({error:"Score not recorded"},{status:503}):NextResponse.json({recorded:true},{headers:{"Cache-Control":"no-store"}});
}
