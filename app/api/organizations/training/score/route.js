import { scoreDailyResponse } from "@/lib/virtus-org-daily-assessment.mjs";
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
 const domain=body?.domain,exerciseKey=body?.exerciseKey,organizationId=body?.organizationId,choiceIndex=body?.choiceIndex;
 const assessed=scoreDailyResponse({domain,exerciseKey,choiceIndex});
 if(!/^[0-9a-f-]{36}$/i.test(organizationId||"")||!assessed)return NextResponse.json({error:"Invalid exercise score"},{status:400});
 const admin=createAdminClient();
 const {data:member}=await admin.from("virtus_organization_members").select("status").eq("organization_id",organizationId).eq("user_id",user.id).maybeSingle();
 const {data:org}=await admin.from("virtus_organizations").select("billing_status").eq("id",organizationId).maybeSingle();
 if(member?.status!=="active"||!["active","trialing"].includes(org?.billing_status))return NextResponse.json({error:"Active membership required"},{status:403});
 const {data:prior,error:priorError}=await admin.from("virtus_org_exercise_scores").select("id,score").eq("organization_id",organizationId).eq("user_id",user.id).eq("domain",domain).eq("exercise_key",exerciseKey).maybeSingle();
 if(priorError)return NextResponse.json({error:"Unable to verify prior assessment"},{status:503});
 if(prior)return NextResponse.json({recorded:true,alreadyRecorded:true},{headers:{"Cache-Control":"private, no-store"}});
 const {error}=await admin.from("virtus_org_exercise_scores").insert({organization_id:organizationId,user_id:user.id,domain,exercise_key:exerciseKey,score:assessed.score,scored_at:new Date().toISOString()});
 if(error?.code==="23505")return NextResponse.json({recorded:true,alreadyRecorded:true},{headers:{"Cache-Control":"private, no-store"}});
 return error?NextResponse.json({error:"Score not recorded"},{status:503}):NextResponse.json({recorded:true},{headers:{"Cache-Control":"private, no-store"}});
}
