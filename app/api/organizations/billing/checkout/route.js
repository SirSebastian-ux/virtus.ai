import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const reply=(error,status)=>NextResponse.json({error},{status});
export async function POST(request){
  if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true" || process.env.VIRTUS_ORGANIZATION_BILLING_ENABLED!=="true") return reply("Organization billing is not enabled",503);
  if(!process.env.STRIPE_SECRET_KEY || !process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID || !process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID) return reply("Billing is not configured",503);
  const client=await createClient();
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user?.id||!user.email_confirmed_at) return reply("Verified authentication required",401);
  const body=await request.json().catch(()=>null);
  const id=typeof body?.organizationId==="string"?body.organizationId:"";
  const seats=body?.seats;
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)||!Number.isSafeInteger(seats)||seats<1||seats>10000) return reply("Invalid organization or seat quantity",400);
  const admin=createAdminClient();
  const {data:org,error}=await admin.from("virtus_organizations").select("id,name,owner_user_id,billing_status,stripe_subscription_id,industry,country,business_address,contact_email,contact_name,total_employees,requested_seats").eq("id",id).maybeSingle();
  if(error||!org||org.owner_user_id!==user.id) return reply("Organization owner required",403);
  if(org.stripe_subscription_id) return reply("Subscription already exists; manage seats through billing portal",409);
  if(!org.industry||!org.country||!org.business_address||!org.contact_email||!org.contact_name||!Number.isSafeInteger(org.total_employees)||!Number.isSafeInteger(org.requested_seats)||org.requested_seats!==seats||seats>org.total_employees) return reply("Complete organization registration and confirm license quantity before checkout",409);
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-03-31.basil"});
  const [platformPrice,seatPrice]=await Promise.all([stripe.prices.retrieve(process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID),stripe.prices.retrieve(process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID)]);
  if(!platformPrice.active||platformPrice.currency!=="usd"||platformPrice.unit_amount!==19900||platformPrice.recurring?.interval!=="month"||platformPrice.recurring?.usage_type!=="licensed"||!seatPrice.active||seatPrice.currency!=="usd"||seatPrice.unit_amount!==999||seatPrice.recurring?.interval!=="month"||seatPrice.recurring?.usage_type!=="licensed"||platformPrice.id===seatPrice.id) return reply("Organization price configuration invalid",503);
  const base=process.env.NEXT_PUBLIC_APP_URL;
  if(!base||!/^https:\/\//.test(base)) return reply("Application URL not configured",503);
  const session=await stripe.checkout.sessions.create({
    mode:"subscription",customer_email:user.email,client_reference_id:id,
    line_items:[{price:platformPrice.id,quantity:1},{price:seatPrice.id,quantity:seats}],
    subscription_data:{metadata:{virtus_product_family:"organizations",virtus_organization_id:id}},
    metadata:{virtus_product_family:"organizations",virtus_organization_id:id},
    success_url:new URL("/organizations?billing=success",base).toString(),
    cancel_url:new URL("/organizations?billing=cancelled",base).toString()
  },{idempotencyKey:`virtus-org-${id}-${seats}-${Math.floor(Date.now()/600000)}`});
  return NextResponse.json({url:session.url},{headers:{"Cache-Control":"no-store"}});
}
