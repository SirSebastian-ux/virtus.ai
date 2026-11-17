import {ownerBillingContext,billingError,billingFailure,billingReply,seatCounts} from "@/lib/organization-billing-owner.mjs";
export const dynamic="force-dynamic";
export async function GET(request){
 try{
  const id=new URL(request.url).searchParams.get("organizationId");
  const c=await ownerBillingContext(id);
  const end=c.sub.items?.data?.[0]?.current_period_end||c.sub.current_period_end||null;
  return billingReply({status:c.sub.status,cancelAtPeriodEnd:!!c.sub.cancel_at_period_end,endAt:end,companyName:c.org.name,activeSeats:c.org.seat_limit,cancelled:c.sub.status==="canceled"});
 }catch(e){return billingFailure(e);}
}
export async function POST(request){
 try{
  const body=await request.json().catch(()=>({}));
  const c=await ownerBillingContext(body.organizationId);
  if(body.timing!=="period_end")throw billingError("Select when the subscription should end",400);
  if(!["active","trialing","past_due"].includes(c.sub.status))throw billingError("Subscription is not in a cancellable state",409);
  const members=await c.db.from("virtus_organization_members").select("id",{count:"exact",head:true}).eq("organization_id",c.org.id).eq("status","active").neq("role","owner");
  if(members.error)throw billingError("Unable to verify employee access",503);
  return billingReply({companyName:c.org.name,timing:body.timing,employeesAffected:members.count||0,ownerAffected:true,effectiveAt:c.sub.items?.data?.[0]?.current_period_end||c.sub.current_period_end||null,summary:"Recurring billing stops at the end of the current paid period. All organization-funded Mentor access ends when Stripe confirms cancellation. Personal subscriptions and history remain untouched."});
 }catch(e){return billingFailure(e);}
}
export async function PUT(request){
 try{
  const body=await request.json().catch(()=>({}));
  const c=await ownerBillingContext(body.organizationId);
  if(body.confirm!==true||body.confirmName!==c.org.name||body.timing!=="period_end"||! /^[0-9a-f-]{36}$/i.test(body.requestId||""))throw billingError("Confirm the company name, timing and cancellation",409);
  if(c.sub.status==="canceled")return billingReply({status:"canceled",alreadyCancelled:true});
  if(c.sub.pending_update)throw billingError("Resolve pending billing updates before canceling",409);
  if(body.timing==="period_end"){
   const updated=await c.stripe.subscriptions.update(c.sub.id,{cancel_at_period_end:true},{idempotencyKey:"virtus-org-end-period-"+c.org.id+"-"+body.requestId});
   if(!updated.cancel_at_period_end)throw billingError("Stripe did not confirm scheduled cancellation",503);
   return billingReply({status:"scheduled",endAt:updated.items?.data?.[0]?.current_period_end||updated.current_period_end||null,note:"All organization-funded access remains active until the paid period ends. Stripe webhook will close it on cancellation."});
  }
  throw billingError("Only end-of-period cancellation is available",400);
 }catch(e){return billingFailure(e);}
}
