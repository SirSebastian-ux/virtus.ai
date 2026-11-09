import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const send=(x,s=200)=>NextResponse.json(x,{status:s,headers:{"Cache-Control":"private, no-store"}});
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return send({error:"Unavailable"},503);
 const {data:{user}}=await(await createClient()).auth.getUser();
 if(!user?.id||!user.email_confirmed_at)return send({error:"Sign-in required"},401);
 const q=new URL(request.url).searchParams,org=q.get("organizationId"),email=(q.get("email")||"").toLowerCase().trim();
 if(!uuid.test(org||"")||!email.includes("@")||email.length>254)return send({error:"Invalid request"},400);
 const db=createAdminClient();
 const {data:actor,error:ae}=await db.from("virtus_organization_members").select("role,status").eq("organization_id",org).eq("user_id",user.id).maybeSingle();
 if(ae||actor?.status!=="active"||!["owner","admin"].includes(actor.role))return send({error:"Forbidden"},403);
 const {data:members,error:me}=await db.from("virtus_organization_members").select("user_id,role,status").eq("organization_id",org).eq("status","active").limit(500);
 if(me)return send({error:"Directory unavailable"},503);
 let target;
 for(const m of members||[]){const {data:{user:u}}=await db.auth.admin.getUserById(m.user_id);if(u?.email?.toLowerCase()===email){target=m;break;}}
 if(!target)return send({error:"Active employee not found"},404);
 const id=target.user_id;
 const [a,b,c]=await Promise.all([
 db.from("virtus_org_training_sessions").select("started_at,active_seconds").eq("organization_id",org).eq("user_id",id).order("started_at",{ascending:false}).limit(1000),
 db.from("virtus_org_learning_progress").select("curriculum_type,module_number,exercise_number,completed_at").eq("organization_id",org).eq("user_id",id).order("completed_at",{ascending:false}).limit(1000),
 db.from("virtus_org_exercise_scores").select("domain,exercise_key,score,scored_at").eq("organization_id",org).eq("user_id",id).order("scored_at",{ascending:false}).limit(1000)]);
 if(a.error||b.error||c.error)return send({error:"Records unavailable"},503);
 const domains={};
 for(const s of c.data||[]){const d=domains[s.domain]||(domains[s.domain]={domain:s.domain,count:0,total:0});d.count++;d.total+=s.score;}
 return send({employee:{email,role:target.role,status:target.status},summary:{exercisesCompleted:b.data.length,practiceSessions:a.data.length,activeSeconds:a.data.reduce((n,s)=>n+Math.max(0,Number(s.active_seconds)||0),0),scoredExercises:c.data.length},domains:Object.values(domains).map(d=>({domain:d.domain,count:d.count,percent:Math.round(d.total/d.count/5*100)})),exercises:b.data.slice(0,50),assessments:c.data.map(s=>({domain:s.domain,score:s.score,scored_at:s.scored_at})).slice(0,50),sessions:a.data.slice(0,50)});
}