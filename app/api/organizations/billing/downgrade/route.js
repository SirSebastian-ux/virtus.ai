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
 const endAt=seats.current_period_end||sub.current_period_end;
 if(!Number.isSafeInteger(endAt)||endAt*1000<=Date.now())throw billingError("Unable to determine the end of the current paid period",503);
 return {body,ctx,ids,target,counts,endAt};
}
export async function POST(request){
 try{
  const {ctx,ids,target,endAt}=await validate(request);
  return billingReply({employeesToRemove:ids.length,currentSeats:ctx.seats.quantity,newSeats:target,monthlyReductionCents:ids.length*999,nextMonthlyBaseCents:19900+target*999,currency:"usd",accessEndsAt:endAt,note:"The selected employees keep their paid Mentor access until the current billing period ends. Their licenses will not renew. Personal accounts and development history remain intact."});
 }catch(e){return billingFailure(e);}
}
export async function PUT(request){
 try{
  const {body,ctx,ids,target,endAt}=await validate(request);
  if(body.confirm!==true||body.expectedSeats!==ctx.seats.quantity||typeof body.requestId!=="string"||!/^[0-9a-f-]{36}$/i.test(body.requestId))throw billingError("Review and confirm this downgrade",409);
  const emails=[];
  for(const id of ids){
   const {data:{user:employee},error:lookupError}=await ctx.db.auth.admin.getUserById(id);
   if(lookupError||!employee?.email)throw billingError("Cannot verify selected employee email",503);
   emails.push(employee.email.toLowerCase());
  }
  const saved=await ctx.db.from("virtus_org_billing_notices").insert({organization_id:ctx.org.id,owner_user_id:ctx.org.owner_user_id,request_id:body.requestId,kind:"employee_downgrade",previous_seats:ctx.seats.quantity,new_seats:target,removed_emails:emails,status:"pending"});
  if(saved.error)throw billingError("Could not prepare owner confirmation record",503);
  const effectiveAt=new Date(endAt*1000).toISOString();
  const result=await ctx.db.rpc("virtus_org_schedule_member_downgrades",{p_org:ctx.org.id,p_user_ids:ids,p_effective_at:effectiveAt});
  if(result.error||result.data!==ids.length)throw billingError("Unable to schedule end-of-period employee access",503);
  try{
   const changed=await ctx.stripe.subscriptions.update(ctx.sub.id,{
    items:[{id:ctx.platform.id,quantity:1},{id:ctx.seats.id,quantity:target}],
    proration_behavior:"none",payment_behavior:"error_if_incomplete"
   },{idempotencyKey:"virtus-org-downgrade-"+ctx.org.id+"-"+body.requestId});
   if(changed.items.data.find(x=>x.id===ctx.seats.id)?.quantity!==target)throw Error("Stripe did not return the expected employee license count");
   return billingReply({status:"scheduled",employeesScheduled:ids.length,accessEndsAt:endAt,requestedSeats:target,note:"License reduction confirmed. Selected employees retain Mentor access until the paid period ends, then lose organization-funded access automatically. Their personal history is retained."});
  }catch(e){
   // A definitive Stripe rejection permits safe restoration. An ambiguous network failure requires manual reconciliation.
   if(Number(e.statusCode)>=400&&Number(e.statusCode)<500){
    await ctx.db.rpc("virtus_org_rollback_member_downgrades",{p_org:ctx.org.id,p_user_ids:ids,p_effective_at:effectiveAt});
    await ctx.db.from("virtus_org_billing_notices").update({status:"canceled"}).eq("organization_id",ctx.org.id).eq("request_id",body.requestId).eq("status","pending");
   }
   throw billingError("Stripe downgrade was not confirmed. Check billing state before retrying.",503);
  }
 }catch(e){return billingFailure(e);}
}
