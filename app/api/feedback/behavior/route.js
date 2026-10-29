import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
const signals=new Set(["clear","unclear","helpful","not_helpful","too_long","too_short"]);
const roles=new Set(["life_coach","trainer","mentor"]);
export async function POST(req){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user)return Response.json({error:"Sign-in required"},{status:401});
 const db=createAdminClient();
 const {data:consent}=await db.from("virtus_behavioral_learning_consent").select("opted_in").eq("user_id",user.id).maybeSingle();
 if(consent?.opted_in!==true)return Response.json({error:"Behavioral learning consent required"},{status:403});
 const {signal,role}=await req.json().catch(()=>({}));
 if(!signals.has(signal)||!roles.has(role))return Response.json({error:"Invalid feedback"},{status:400});
 const {error}=await db.from("virtus_behavioral_feedback").insert({user_id:user.id,signal,role});
 if(error)return Response.json({error:"Unable to record feedback"},{status:500});
 return Response.json({success:true});
}
