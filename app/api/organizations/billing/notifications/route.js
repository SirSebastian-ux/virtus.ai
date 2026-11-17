import {ownerBillingContext,billingError,billingFailure,billingReply} from "@/lib/organization-billing-owner.mjs";
import {dispatchOrganizationBillingNotices} from "@/lib/organization-billing-notices.mjs";
export const dynamic="force-dynamic";
export async function POST(request){
 try{
  const body=await request.json().catch(()=>({}));
  const ctx=await ownerBillingContext(body.organizationId);
  const {org,db,sub,seats}=ctx;
  if(org.billing_status!=="active"||sub.status!=="active"||sub.pending_update||org.seat_limit!==seats.quantity)throw billingError("Subscription reconciliation pending",409);
  const {data:failed,error}=await db.from("virtus_org_billing_notices").select("id").eq("organization_id",org.id).eq("status","failed").eq("new_seats",org.seat_limit).limit(10);
  if(error)throw billingError("Unable to check downgrade notifications",503);
  if(failed?.length){
   const reset=await db.from("virtus_org_billing_notices").update({status:"pending"}).eq("organization_id",org.id).in("id",failed.map(x=>x.id)).eq("status","failed");
   if(reset.error)throw billingError("Unable to retry billing notification",503);
  }
  const result=await dispatchOrganizationBillingNotices({admin:db,organizationId:org.id});
  return billingReply({sent:result.sent,status:result.sent>0?"sent":"no_pending_confirmation"});
 }catch(e){return billingFailure(e);}
}