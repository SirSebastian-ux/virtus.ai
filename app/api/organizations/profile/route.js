import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const bad=(error,status=400)=>NextResponse.json({error},{status});
export async function PUT(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return bad("Organizations unavailable",503);
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user?.id||!user.email_confirmed_at)return bad("Verified login required",401);
 const body=await request.json().catch(()=>null);const id=body?.organizationId;
 if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return bad("Invalid organization");
 const fields=["industry","country","business_address","contact_email","contact_name"];const values={};
 for(const key of fields){const v=body?.[key];if(typeof v!=="string"||v.trim().length<2||v.trim().length>240)return bad("Invalid "+key);values[key]=v.trim();}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email))return bad("Invalid contact email");
 if(!Number.isSafeInteger(body.total_employees)||body.total_employees<1||body.total_employees>1000000)return bad("Invalid employee count");
 if(!Number.isSafeInteger(body.requested_seats)||body.requested_seats<1||body.requested_seats>10000||body.requested_seats>body.total_employees)return bad("Invalid license quantity");
 values.total_employees=body.total_employees;values.requested_seats=body.requested_seats;
 const admin=createAdminClient();const {data:org}=await admin.from("virtus_organizations").select("id,owner_user_id,stripe_subscription_id").eq("id",id).maybeSingle();
 if(!org||org.owner_user_id!==user.id)return bad("Owner access required",403);
 if(org.stripe_subscription_id)return bad("Active subscriptions require billing management",409);
 const {error}=await admin.from("virtus_organizations").update(values).eq("id",id).eq("owner_user_id",user.id);
 if(error)return bad("Could not save organization profile",503);
 return NextResponse.json({saved:true},{headers:{"Cache-Control":"no-store"}});
}
