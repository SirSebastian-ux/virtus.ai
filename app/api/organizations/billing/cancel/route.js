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
  if(!["immediate","period_end"].includes(body.timing))throw billingError("Select when the subscription should end",400);
  if(!["active","trialing","past_due"].includes(c.sub.status))throw billingError("Subscription is not in a cancellable state",409);
  const members=await c.db.from("virtus_organization_members").select("id",{count:"exact",head:true}).eq("organization_id",c.org.id).eq("status","active").neq("role","owner");
  if(members.error)throw billingError("Unable to verify employee access",503);
  return billingReply({companyName:c.org.name,timing:body.timing,employeesAffected:members.count||0,ownerAffected:true,effectiveAt:body.timing==="immediate"?"immediately":(c.sub.items?.data?.[0]?.current_period_end||c.sub.current_period_end||null),summary:body.timing==="immediate"?"Organization-funded Mentor access ends immediately for the owner and all employees. Personal subscriptions and saved history remain untouched.":"Recurring billing stops at the end of the current paid period. All organization-funded Mentor access ends when Stripe confirms cancellation. Personal subscriptions and history remain untouched."});
 }catch(e){return billingFailure(e);}
}
export async function PUT(request){
 try{
  const body=await request.json().catch(()=>({}));
  const c=await ownerBillingContext(body.organizationId);
  if(body.confirm!==true||body.confirmName!==c.org.name||!["immediate","period_end"].includes(body.timing)||! /^[0-9a-f-]{36}$/i.test(body.requestId||""))throw billingError("Confirm the company name, timing and cancellation",409);
  if(c.sub.status==="canceled")return billingReply({status:"canceled",alreadyCancelled:true});
  if(c.sub.pending_update)throw billingError("Resolve pending billing updates before canceling",409);
  if(body.timing==="period_end"){
   const updated=await c.stripe.subscriptions.update(c.sub.id,{cancel_at_period_end:true},{idempotencyKey:"virtus-org-end-period-"+c.org.id+"-"+body.requestId});
   if(!updated.cancel_at_period_end)throw billingError("Stripe did not confirm scheduled cancellation",503);
   return billingReply({status:"scheduled",endAt:updated.items?.data?.[0]?.current_period_end||updated.current_period_end||null,note:"All organization-funded access remains active until the paid period ends. Stripe webhook will close it on cancellation."});
  }
  // Stripe cancellation is authoritative; then close access directly as a fail-closed safeguard.
  const ended=await c.stripe.subscriptions.cancel(c.sub.id,{prorate:false,invoice_now:false},{idempotencyKey:"virtus-org-cancel-now-"+c.org.id+"-"+body.requestId});
  if(ended.status!=="canceled")throw billingError("Stripe did not confirm cancellation",503);
  const closure=await c.db.rpc("virtus_org_close_entitlements",{p_org:c.org.id});
  if(closure.error)throw billingError("Stripe canceled billing, but automatic access closure needs immediate review",503);
  return billingReply({status:"canceled",employeesSuspended:closure.data,note:"Company billing canceled. Organization-funded access is disabled; accounts and history remain stored."});
 }catch(e){return billingFailure(e);}
}
