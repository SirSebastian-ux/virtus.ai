import {requireAdminApi} from "@/lib/admin-auth";
import {createAdminClient} from "@/lib/supabase-admin";
export async function POST(){
 const {response}=await requireAdminApi();if(response)return response;
 const db=createAdminClient();
 const {data:rows,error}=await db.from("virtus_behavioral_feedback").select("user_id,role,signal").limit(10000);
 if(error)return Response.json({error:"Cannot read feedback"},{status:500});
 const groups=new Map();
 for(const x of rows||[]){const k=x.role+"|"+x.signal;if(!groups.has(k))groups.set(k,new Set());groups.get(k).add(x.user_id);}
 const proposals=[];
 for(const [key,users] of groups){if(users.size<10)continue;
 const [role,signal]=key.split("|");
 const message={unclear:"Evaluate a simpler explanation with examples.",too_long:"Evaluate shorter replies when requested.",too_short:"Evaluate more detailed explanation when requested.",not_helpful:"Investigate alternative strategies through standardized tests.",clear:"Retain clear communication patterns; monitor for regression.",helpful:"Test whether effective techniques generalize across cases."}[signal];
 const {data:prior}=await db.from("virtus_learning_proposals").select("id").eq("role",role).eq("signal",signal).eq("status","pending").maybeSingle();
 if(prior)continue;
 const {error:writeError}=await db.from("virtus_learning_proposals").insert({role,signal,sample_count:users.size,proposal:message,status:"pending"});
 if(!writeError)proposals.push({role,signal,sample_count:users.size});
 }
 return Response.json({success:true,created:proposals.length,proposals});
}
