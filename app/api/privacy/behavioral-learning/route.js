import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
export async function GET(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user)return Response.json({error:"Sign in required"},{status:401});
 const db=createAdminClient();let {data}=await db.from("virtus_behavioral_learning_consent").select("opted_in,policy_version,updated_at").eq("user_id",user.id).maybeSingle();
 if(!data && user.user_metadata?.behavioral_learning_preference === true){
   const saved=await db.from("virtus_behavioral_learning_consent").upsert({user_id:user.id,opted_in:true,policy_version:"v1",updated_at:new Date().toISOString()},{onConflict:"user_id"}).select("opted_in,policy_version").single();
   if(saved.error)return Response.json({error:"Could not initialize consent"},{status:500});
   data=saved.data;
 }
 return Response.json({optedIn:data?.opted_in===true,policyVersion:data?.policy_version||"v1"});
}
export async function POST(req){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return Response.json({error:"Sign in required"},{status:401});
 const body=await req.json().catch(()=>({}));
 if(typeof body.optedIn!=="boolean")return Response.json({error:"Explicit choice required"},{status:400});
 const db=createAdminClient();const {error}=await db.from("virtus_behavioral_learning_consent").upsert({user_id:user.id,opted_in:body.optedIn,policy_version:"v1",updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)return Response.json({error:"Could not save consent"},{status:500});
 return Response.json({success:true,optedIn:body.optedIn});
}