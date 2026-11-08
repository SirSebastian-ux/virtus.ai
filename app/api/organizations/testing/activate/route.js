import {isAdminUser} from "@/lib/admin-auth";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const reply=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request){
 // Free seats are permitted only for the authenticated platform administrator.
 // Production pilot records use the existing organization tables; no Stripe changes.
 if(!["preview","production"].includes(process.env.VERCEL_ENV) ||
    process.env.VIRTUS_ORG_TEST_MODE!=="true" ||
    process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true") return reply({error:"Test activation unavailable"},404);
 const client=await createClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return reply({error:"Verified owner sign-in required"},401);
 if(!isAdminUser(user))return reply({error:"Pilot activation restricted to platform administrator"},403);
 const body=await request.json().catch(()=>null);
 const id=body?.organizationId;
 const seats=body?.seats;
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)||!Number.isSafeInteger(seats)||seats<1||seats>25)return reply({error:"Invalid organization or test seats"},400);
 const admin=createAdminClient();
 const {data:org,error}=await admin.from("virtus_organizations").select("id,owner_user_id,verified_domain,billing_status,stripe_subscription_id").eq("id",id).maybeSingle();
 if(error||!org||org.owner_user_id!==user.id)return reply({error:"Organization owner required"},403);
 if(!org.verified_domain)return reply({error:"Verify the corporate email domain first"},409);
 if(org.stripe_subscription_id)return reply({error:"Existing Stripe subscription cannot be overridden"},409);
 if(!["pending","trialing"].includes(org.billing_status))return reply({error:"Organization is not eligible for pilot testing"},409);
 const {count,error:countError}=await admin.from("virtus_organization_members").select("id",{count:"exact",head:true}).eq("organization_id",id).eq("status","active");
 if(countError)return reply({error:"Unable to verify seat usage"},503);
 if(count>seats)return reply({error:"Test seat count is below active membership"},409);
 const {data:updated,error:updateError}=await admin.from("virtus_organizations").update({billing_status:"trialing",seat_limit:seats}).eq("id",id).eq("owner_user_id",user.id).is("stripe_subscription_id",null).select("id,seat_limit,billing_status").maybeSingle();
 if(updateError||!updated)return reply({error:"Test activation failed"},503);
 return reply({status:"test_active",seats:updated.seat_limit,charge:"none"});
}
