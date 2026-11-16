import {ownerBillingContext,seatCounts,billingError,billingFailure,billingReply} from "@/lib/organization-billing-owner.mjs";
export const dynamic="force-dynamic";
async function validate(request){
 const body=await request.json().catch(()=>({}));
 const ctx=await ownerBillingContext(body.organizationId);
 const {org,db,sub,seats}=ctx;
 if(org.billing_status!=="active"||sub.status!=="active"||sub.pending_update||sub.cancel_at_period_end||seats.quantity!==org.seat_limit)throw billingError("Subscription must be active and reconciled before reducing licenses");
 const ids=body.employeeIds;
 if(!Array.isArray(ids)||ids.length===0||ids.length>500||ids.some(i=>typeof i!=="string"||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(i))||new Set(ids).size!==ids.length)throw billingError("Select valid employees to remove",400);
 if(ids.includes(org.owner_user_id))throw billingError("The owner cannot be removed through employee downgrades",400);
 const [all,counts,queue]=await Promise.all([
  db.from("virtus_organization_members").select("user_id,status,role").eq("organization_id",org.id).in("user_id",ids),
  seatCounts(db,org.id),
  db.from("virtus_organization_license_invite_queue").select("id").eq("organization_id",org.id).in("status",["pending","sending"]).limit(1)
 ]);
 if(all.error||queue.error)throw billingError("Cannot verify members or queued invitations",503);
 if(queue.data?.length)throw billingError("Complete any pending invitations before changing licenses");
 if(all.data?.length!==ids.length||all.data.some(m=>m.role==="owner"||m.status!=="active"))throw billingError("Only active non-owner employees can be removed");
 if(counts.active>seats.quantity)throw billingError("Existing seat count needs reconciliation",409);
 const target=seats.quantity-ids.length;
 if(target<0||target<counts.active-ids.length+counts.pending)throw billingError("Pending invitations or remaining members require licenses. Revoke invitations first.");
 return {body,ctx,ids,target,counts};
}
export async function POST(request){
 try{
  const {ctx,ids,target}=await validate(request);
  return billingReply({employeesToRemove:ids.length,currentSeats:ctx.seats.quantity,newSeats:target,monthlyReductionCents:ids.length*999,nextMonthlyBaseCents:19900+target*999,currency:"usd",note:"Selected employees lose organization-funded Mentor access when the change is confirmed. Their personal account and development history remain. No automatic partial-period refund."});
 }catch(e){return billingFailure(e);}
}
export async function PUT(request){
 try{
  const {body,ctx,ids,target}=await validate(request);
  if(body.confirm!==true||body.expectedSeats!==ctx.seats.quantity||typeof body.requestId!=="string"||!/^[0-9a-f-]{36}$/i.test(body.requestId))throw billingError("Review and confirm this downgrade",409);
  const result=await ctx.db.rpc("virtus_org_suspend_members_for_downgrade",{p_org:ctx.org.id,p_user_ids:ids});
  if(result.error||result.data!==ids.length)throw billingError("Unable to safely suspend selected employee licenses",503);
  try{
   const changed=await ctx.stripe.subscriptions.update(ctx.sub.id,{
    items:[{id:ctx.platform.id,quantity:1},{id:ctx.seats.id,quantity:target}],
    proration_behavior:"none",payment_behavior:"error_if_incomplete"
   },{idempotencyKey:"virtus-org-downgrade-"+ctx.org.id+"-"+body.requestId});
   if(changed.items.data.find(x=>x.id===ctx.seats.id)?.quantity!==target)throw Error("Stripe did not return the expected employee license count");
   return billingReply({status:"submitted",employeesSuspended:ids.length,requestedSeats:target,note:"Stripe update accepted. License totals will reconcile through the signed webhook; employee history is retained."});
  }catch(e){
   // A definitive Stripe rejection permits safe restoration. An ambiguous network failure requires manual reconciliation.
   if(Number(e.statusCode)>=400&&Number(e.statusCode)<500){
    await ctx.db.rpc("virtus_org_resume_suspended_members",{p_org:ctx.org.id,p_user_ids:ids});
   }
   throw billingError("Stripe downgrade was not confirmed. Check billing state before retrying.",503);
  }
 }catch(e){return billingFailure(e);}
}
