import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const table="virtus_companion_pilot_requests";
const reply=(v,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
async function auth(){const db=await createClient();const {data:{user},error}=await db.auth.getUser();return !error&&user&&!user.is_anonymous&&user.email_confirmed_at?{db,user}:null}
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const present=(r,uid)=>({id:r.id,direction:r.requester_id===uid?"outgoing":"incoming",name:r.requester_id===uid?r.companion_name:r.requester_name,minutes:r.minutes,status:r.status,createdAt:r.created_at,free:r.rate_cents===0});
export async function GET(){const a=await auth();if(!a)return reply({error:"Sign in required."},401);const {data,error}=await createAdminClient().from(table).select("id,requester_id,companion_id,requester_name,companion_name,minutes,status,created_at,rate_cents").or("requester_id.eq."+a.user.id+",companion_id.eq."+a.user.id).order("created_at",{ascending:false}).limit(100);return error?reply({error:"Could not load conversation requests."},500):reply({requests:data.map(r=>present(r,a.user.id))})}
export async function POST(req){if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"Invalid origin."},403);const a=await auth();if(!a)return reply({error:"Sign in required."},401);let b;try{const raw=await req.text();if(raw.length>2000)return reply({error:"Request too large."},413);b=JSON.parse(raw)}catch{return reply({error:"Invalid request."},400)}if(!b||typeof b!=="object")return reply({error:"Invalid request."},400);const admin=createAdminClient(),uid=a.user.id;
 if(b.action==="send"){
  if(!uuid(b.listingId)||![5,10,15,30,60].includes(b.minutes)||b.consent!==true)return reply({error:"Choose a duration and confirm your request."},400);
  const {data:customer,error:ce}=await a.db.from("virtus_companion_pilot_profiles").select("profile").eq("user_id",uid).eq("profile_type","customer").maybeSingle();
  if(ce||!customer?.profile?.adult||!customer.profile.name)return reply({error:"Save your adult customer profile first."},400);
  const {data:listing,error:le}=await admin.from("virtus_companion_pilot_listings").select("id,user_id,profile").eq("id",b.listingId).eq("status","approved").maybeSingle();
  if(le||!listing||listing.user_id===uid)return reply({error:"This companion is unavailable or is your own profile."},400);
  const {count,error:qe}=await admin.from(table).select("id",{count:"exact",head:true}).eq("requester_id",uid).gte("created_at",new Date(Date.now()-86400000).toISOString());
  if(qe)return reply({error:"Could not check request limit."},500);if(count>=10)return reply({error:"Daily request limit reached."},429);
  const {data,error}=await admin.from(table).insert({listing_id:listing.id,requester_id:uid,companion_id:listing.user_id,requester_name:String(customer.profile.name).slice(0,80),companion_name:String(listing.profile.name).slice(0,80),minutes:b.minutes,rate_cents:0,status:"pending"}).select("id").single();
  if(error)return reply({error:error.code==="23505"?"You already have a pending request to this companion.":"Could not send request."},error.code==="23505"?409:500);return reply({id:data.id,status:"pending"},201)
 }
 if(!uuid(b.id)||!["accept","decline","cancel"].includes(b.action))return reply({error:"Invalid request action."},400);
 let update=admin.from(table).update({status:{accept:"accepted",decline:"declined",cancel:"cancelled"}[b.action]}).eq("id",b.id);
 if(b.action==="cancel")update=update.or("requester_id.eq."+uid+",companion_id.eq."+uid).in("status",["pending","accepted"]);else update=update.eq("companion_id",uid).eq("status","pending");
 const {data,error}=await update.select("id");return error?reply({error:"Could not update request."},500):data.length?reply({saved:true}):reply({error:"Request unavailable or already updated."},409)
}
