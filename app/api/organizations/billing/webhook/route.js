import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const ok=(extra={})=>NextResponse.json({received:true,...extra});
export async function POST(request){
  if(process.env.VIRTUS_ORGANIZATION_BILLING_ENABLED!=="true") return NextResponse.json({error:"Disabled"},{status:503});
  if(!process.env.STRIPE_SECRET_KEY||!process.env.VIRTUS_ORGANIZATION_WEBHOOK_SECRET||!process.env.VIRTUS_ORGANIZATION_PRICE_ID) return NextResponse.json({error:"Not configured"},{status:503});
  const signature=request.headers.get("stripe-signature");
  if(!signature) return NextResponse.json({error:"Missing signature"},{status:400});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-03-31.basil"});
  let event;
  try {event=stripe.webhooks.constructEvent(await request.text(),signature,process.env.VIRTUS_ORGANIZATION_WEBHOOK_SECRET);}
  catch {return NextResponse.json({error:"Invalid signature"},{status:400});}
  const relevant=new Set(["checkout.session.completed","customer.subscription.created","customer.subscription.updated","customer.subscription.deleted","invoice.payment_failed","invoice.payment_succeeded"]);
  if(!relevant.has(event.type)) return ok();
  let subscription;
  if(event.type==="checkout.session.completed"){
    const session=event.data.object;
    if(session.metadata?.virtus_product_family!=="organizations"||!session.subscription) return ok({ignored:true});
    subscription=await stripe.subscriptions.retrieve(session.subscription);
  }else if(event.type.startsWith("invoice.")){
    const invoice=event.data.object;
    const subscriptionId=typeof invoice.subscription==="string"?invoice.subscription:invoice.subscription?.id;
    if(!subscriptionId) return ok({ignored:true});
    subscription=await stripe.subscriptions.retrieve(subscriptionId);
  }else subscription=event.data.object;
  if(subscription.metadata?.virtus_product_family!=="organizations") return ok({ignored:true});
  const id=subscription.metadata?.virtus_organization_id;
  const item=subscription.items?.data?.[0];
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id||"")||!item||item.price?.id!==process.env.VIRTUS_ORGANIZATION_PRICE_ID) return NextResponse.json({error:"Organization subscription metadata mismatch"},{status:409});
  const seats=item.quantity;
  if(!Number.isSafeInteger(seats)||seats<1||seats>10000) return NextResponse.json({error:"Invalid licensed seats"},{status:409});
  const admin=createAdminClient();
  const {data:org,error:orgError}=await admin.from("virtus_organizations").select("id,stripe_subscription_id").eq("id",id).maybeSingle();
  if(orgError||!org) return NextResponse.json({error:"Organization not found"},{status:409});
  if(org.stripe_subscription_id&&org.stripe_subscription_id!==subscription.id) return NextResponse.json({error:"Subscription mismatch"},{status:409});
  const status=["active","trialing","past_due","unpaid","canceled"].includes(subscription.status)?subscription.status:"pending";
  const customer=typeof subscription.customer==="string"?subscription.customer:subscription.customer?.id;
  if(!customer) return NextResponse.json({error:"Customer missing"},{status:409});
  const {data:outcome,error:reconcileError}=await admin.rpc("virtus_reconcile_org_subscription",{
    p_org:id,p_event:event.id,p_created:event.created,p_subscription:subscription.id,
    p_customer:customer,p_status:status,p_seats:seats,p_event_type:event.type
  });
  if(reconcileError) return NextResponse.json({error:"Billing reconciliation failed"},{status:500});
  return ok({organization:true,reconciliation:outcome});
}
