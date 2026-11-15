import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import {summarizeOrganizationActivity} from "@/lib/virtus-org-hr-activity.mjs";
export const dynamic="force-dynamic";
const respond=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return respond({error:"Organizations disabled"},503);
 const client=await createClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return respond({error:"Verified login required"},401);
 const id=new URL(request.url).searchParams.get("organizationId");
 if(!uuid.test(id||""))return respond({error:"Invalid organization"},400);
 const admin=createAdminClient();
 const [actor,organization]=await Promise.all([
  admin.from("virtus_organization_members").select("role,status").eq("organization_id",id).eq("user_id",user.id).maybeSingle(),
  admin.from("virtus_organizations").select("billing_status").eq("id",id).maybeSingle()
 ]);
 if(actor.error||actor.data?.status!=="active"||!["owner","admin"].includes(actor.data?.role))return respond({error:"Forbidden"},403);
 if(organization.error||!["active","trialing"].includes(organization.data?.billing_status))return respond({error:"Active organizational subscription required"},403);
 const cutoff=new Date();cutoff.setUTCDate(cutoff.getUTCDate()-29);cutoff.setUTCHours(0,0,0,0);
 const fromDay=cutoff.toISOString().slice(0,10);
 const [memberRows,sessionRows,completedRows,scoreRows]=await Promise.all([
 admin.from("virtus_organization_members").select("user_id,role,status").eq("organization_id",id).eq("status","active").limit(100),
 admin.from("virtus_org_training_sessions").select("user_id,started_at,active_seconds").eq("organization_id",id).gte("started_at",cutoff.toISOString()).order("started_at",{ascending:false}).limit(1000),
 admin.from("virtus_org_learning_progress").select("user_id,completed_at").eq("organization_id",id).gte("completed_at",cutoff.toISOString()).order("completed_at",{ascending:false}).limit(1000),
 admin.from("virtus_org_exercise_scores").select("user_id,domain,score,scored_at").eq("organization_id",id).like("exercise_key","scenario-v2-daily-%").gte("scored_at",cutoff.toISOString()).order("scored_at",{ascending:false}).limit(1000)
 ]);
 if([memberRows,sessionRows,completedRows,scoreRows].some(r=>r.error))return respond({error:"Training activity unavailable"},503);
 const memberRecords=memberRows.data||[];
 // Never claim complete totals after hitting a query cap.
 const truncated=memberRecords.length>=100||[sessionRows,completedRows,scoreRows].some(r=>(r.data||[]).length>=1000);
 const visible=await Promise.all(memberRecords.map(async m=>{
  const {data:{user:memberUser},error:lookupError}=await admin.auth.admin.getUserById(m.user_id);
  return {...m,email:lookupError?null:memberUser?.email?.toLowerCase()||null};
 }));
 const report=summarizeOrganizationActivity({members:visible,sessions:sessionRows.data||[],completed:completedRows.data||[],scores:scoreRows.data||[],fromDay});
 return respond({...report,period:{from:fromDay,to:new Date().toISOString().slice(0,10),timezone:"UTC",days:30},complete:!truncated,
  measurementNote:"Training time is estimated from active interaction heartbeats. Scenario selections describe exercise performance, not verified professional competency. No private chats or reflections are used."});
}
