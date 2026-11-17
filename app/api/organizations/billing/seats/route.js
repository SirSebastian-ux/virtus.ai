import { NextResponse } from "next/server";
import Stripe from "stripe";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
import {validEmployeeEmail} from "@/lib/organization-invitation-delivery.mjs";
export const dynamic="force-dynamic";
const reply=(data,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
const fail=e=>reply({error:e.message||"Billing unavailable"},e.httpStatus||503);
const err=(msg,status)=>Object.assign(new Error(msg),{httpStatus:status});
async function context(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")throw err("Organizations disabled",503);
 const client=await createClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.id||!user.email_confirmed_at)throw err("Verified login required",401);
 const payload=request.method==="GET"?{}:await request.json().catch(()=>({}));
 const id=request.method==="GET"?new URL(request.url).searchParams.get("organizationId"):payload.organizationId;
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))throw err("Invalid organization",400);
 const db=createAdminClient();
 const {data:org,error:orgError}=await db.from("virtus_organizations").select("id,owner_user_id,billing_status,seat_limit,stripe_subscription_id,archived_at").eq("id",id).maybeSingle();
 if(orgError||!org||org.owner_user_id!==user.id||org.archived_at)throw err("Owner required",403);
 const {data:member,error:memberError}=await db.from("virtus_organization_members").select("role,status").eq("organization_id",id).eq("user_id",user.id).maybeSingle();
 if(memberError||member?.role!=="owner"||member.status!=="active")throw err("Active owner membership required",403);
 const [roster,endings]=await Promise.all([
   db.from("virtus_organization_members").select("user_id").eq("organization_id",id).eq("status","active").neq("role","owner"),
   db.from("virtus_org_employee_access_endings").select("user_id").eq("organization_id",id)
 ]);
 if(roster.error||endings.error)throw err("Cannot verify seat use",503);
 const excluded=new Set((endings.data||[]).map(e=>e.user_id));
 const renewing=(roster.data||[]).filter(m=>!excluded.has(m.user_id)).length;
 const {count:pendingCount,error:pendingError}=await db.from("virtus_organization_invitations").select("id",{count:"exact",head:true}).eq("organization_id",id).is("accepted_at",null).is("revoked_at",null).gt("expires_at",new Date().toISOString());
 if(pendingError)throw err("Cannot verify pending invitations",503);
 return {org,payload,used:renewing,paidThroughExpiry:(roster.data||[]).filter(m=>excluded.has(m.user_id)).length,pending:pendingCount||0};
}
function stripe(){if(!process.env.STRIPE_SECRET_KEY||!process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID||!process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID)throw err("Billing not configured",503);return new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-03-31.basil"});}
async function load(ctx,client){
 if(!ctx.org.stripe_subscription_id)throw err("No Stripe subscription",409);
 const sub=await client.subscriptions.retrieve(ctx.org.stripe_subscription_id);
 if(sub.metadata?.virtus_product_family!=="organizations"||sub.metadata.virtus_organization_id!==ctx.org.id)throw err("Subscription mismatch",409);
 const items=sub.items?.data||[];
 const platform=items.find(i=>i.price.id===process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID);
 const seat=items.find(i=>i.price.id===process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID);
 if(items.length!==2||!platform||platform.quantity!==1||!seat||!Number.isSafeInteger(seat.quantity))throw err("Subscription prices mismatch",409);

 return {sub,platform,seat};
}
export async function GET(req){try{const ctx=await context(req);const db=createAdminClient();const {data:queued,error:queueError}=await db.from("virtus_organization_license_invite_queue").select("request_id,invited_email,status,target_seats,created_at,failure_reason").eq("organization_id",ctx.org.id).order("created_at",{ascending:false}).limit(8);if(queueError)throw err("Pending invitations unavailable",503);if(!ctx.org.stripe_subscription_id||process.env.VIRTUS_ORGANIZATION_BILLING_ENABLED!=="true")return reply({subscribed:!!ctx.org.stripe_subscription_id,seats:ctx.org.seat_limit,usedSeats:ctx.used,pendingInvites:ctx.pending,availableSeats:Math.max(0,ctx.org.seat_limit-ctx.used-ctx.pending),billingStatus:ctx.org.billing_status,managementEnabled:false,includedOwnerLicenses:1,queuedInvitations:queued||[]});const {sub,seat}=await load(ctx,stripe());return reply({subscribed:true,seats:ctx.org.seat_limit,usedSeats:ctx.used,pendingInvites:ctx.pending,availableSeats:Math.max(0,ctx.org.seat_limit-ctx.used-ctx.pending),billingStatus:sub.status,managementEnabled:sub.status==="active"&&ctx.org.billing_status==="active"&&!sub.pending_update&&!sub.cancel_at_period_end&&seat.quantity===ctx.org.seat_limit,includedOwnerLicenses:1,reconciling:seat.quantity!==ctx.org.seat_limit,paymentPending:!!sub.pending_update,queuedInvitations:queued||[]});}catch(e){return fail(e);}}
async function change(req){
 if(process.env.VIRTUS_ORGANIZATION_BILLING_ENABLED!=="true")throw err("Billing not enabled",503);
 const ctx=await context(req),seats=ctx.payload.seats;
 if(!Number.isSafeInteger(seats)||seats<1||seats>10000)throw err("Choose 1 to 10,000 licenses",400);
 if(seats<ctx.used+ctx.pending)throw err("Cannot remove seats reserved by active members or pending invitations; revoke invitations or deactivate employees first",409);
 const client=stripe(),{sub,platform,seat}=await load(ctx,client);
 if(sub.pending_update||sub.cancel_at_period_end)throw err("Subscription has a pending payment or scheduled cancellation. Resolve it before changing licenses.",409);
 if(sub.status!=="active"||ctx.org.billing_status!=="active")throw err("Subscription must be paid and active",409);
 if(ctx.org.seat_limit!==seat.quantity)throw err("Stripe reconciliation pending; refresh",409);
 if(seats===seat.quantity)throw err("Change the license quantity",400);
 return {ctx,seats,client,sub,platform,seat};
}
export async function POST(req){try{
 const {seats,client,sub,platform,seat}=await change(req);
 const result={oldSeats:seat.quantity,newSeats:seats,currency:"usd",monthlyTotalCents:19900+999*seats,direction:seats>seat.quantity?"increase":"decrease",estimatedImmediateInvoiceCents:0};
 if(seats>seat.quantity){
  const preview=await client.invoices.createPreview({customer:sub.customer,subscription:sub.id,subscription_details:{items:[{id:platform.id,quantity:1},{id:seat.id,quantity:seats}]}});
  result.estimatedImmediateInvoiceCents=null;
  result.previewInvoiceTotalCents=preview.amount_due;
  result.currency=preview.currency;
 }
 result.note=seats>seat.quantity?"Stripe preview of the upcoming invoice, which may include recurring charges, prorations and taxes; the immediate proration charge is finalized only when you confirm.":"Removing unoccupied licenses changes the next monthly amount without immediate refunds or credits.";
 return reply(result);
 }catch(e){return fail(e);}}
export async function PUT(req){try{
 const {ctx,seats,client,sub,platform,seat}=await change(req);
 if(ctx.payload.confirm!==true||ctx.payload.expectedSeats!==seat.quantity||typeof ctx.payload.requestId!=="string"||!/^[0-9a-f-]{36}$/i.test(ctx.payload.requestId))return reply({error:"Review and confirm this seat change first"},409);
 const increase=seats>seat.quantity;
 const invitedEmail=typeof ctx.payload.invitedEmail==="string"?ctx.payload.invitedEmail.trim().toLowerCase():"";
 if(invitedEmail&&(!increase||seats!==seat.quantity+1||!validEmployeeEmail(invitedEmail)))return reply({error:"An employee invitation requires exactly one additional paid seat and a valid email"},400);
 const db=createAdminClient();
 if(invitedEmail){
  const pending=await db.from("virtus_organization_license_invite_queue").select("id,request_id").eq("organization_id",ctx.org.id).in("status",["pending","sending"]).limit(1);
  if(pending.error)return reply({error:"Unable to verify pending seat upgrades"},503);
  if(pending.data?.length&&pending.data[0].request_id!==ctx.payload.requestId)return reply({error:"A previous employee upgrade is pending. Complete it first."},409);
  const queued=await db.from("virtus_organization_license_invite_queue").upsert({organization_id:ctx.org.id,requested_by:ctx.org.owner_user_id,invited_email:invitedEmail,request_id:ctx.payload.requestId,target_seats:seats,status:"pending"},{onConflict:"request_id",ignoreDuplicates:true});
  if(queued.error)return reply({error:"Unable to save the employee invitation before payment"},503);
 }
 let updated;
 try{
  updated=await client.subscriptions.update(sub.id,{items:[{id:platform.id,quantity:1},{id:seat.id,quantity:seats}],proration_behavior:increase?"always_invoice":"none",payment_behavior:increase?"pending_if_incomplete":"error_if_incomplete"},{idempotencyKey:"virtus-org-seat-"+ctx.org.id+"-"+ctx.payload.requestId});
 }catch(error){
  // A definitive Stripe API rejection means no new seat was purchased. Keep ambiguous network errors pending for reconciliation.
  if(invitedEmail&&error.statusCode>=400&&error.statusCode<500){
   await db.from("virtus_organization_license_invite_queue").update({status:"failed",failure_reason:"Stripe did not accept the seat purchase"}).eq("request_id",ctx.payload.requestId).eq("status","pending");
  }
  throw error;
 }
 let paymentUrl=null;
 if(updated.pending_update&&updated.latest_invoice){
  try{const invoiceId=typeof updated.latest_invoice==="string"?updated.latest_invoice:updated.latest_invoice.id;
   const invoice=await client.invoices.retrieve(invoiceId);
   if(invoice.hosted_invoice_url?.startsWith("https://invoice.stripe.com/"))paymentUrl=invoice.hosted_invoice_url;
  }catch{}
 }
 return reply({status:updated.pending_update?"payment_pending":"submitted",requestedSeats:seats,paymentUrl,note:"Seat availability and the queued email invitation are released only after verified payment and billing reconciliation."});
 }catch(e){return fail(e);}}
