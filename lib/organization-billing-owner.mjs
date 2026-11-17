import Stripe from "stripe";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const billingError=(message,status=409)=>Object.assign(new Error(message),{httpStatus:status});
export const billingReply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export const billingFailure=(e)=>billingReply({error:e.message||"Billing action unavailable"},e.httpStatus||503);
export async function ownerBillingContext(organizationId){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true"||process.env.VIRTUS_ORGANIZATION_BILLING_ENABLED!=="true")throw billingError("Organization billing unavailable",503);
 if(!uuid.test(organizationId||""))throw billingError("Invalid organization",400);
 const auth=await createClient();const {data:{user},error:authError}=await auth.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)throw billingError("Verified sign-in required",401);
 const db=createAdminClient();
 const {data:org,error:orgError}=await db.from("virtus_organizations").select("id,name,owner_user_id,billing_status,seat_limit,stripe_subscription_id,archived_at").eq("id",organizationId).maybeSingle();
 if(orgError||!org||org.archived_at||org.owner_user_id!==user.id)throw billingError("Only the organization owner can manage the subscription",403);
 const {data:membership,error:memberError}=await db.from("virtus_organization_members").select("role,status").eq("organization_id",org.id).eq("user_id",user.id).maybeSingle();
 if(memberError||membership?.role!=="owner"||membership?.status!=="active")throw billingError("Active owner membership required",403);
 if(!org.stripe_subscription_id)throw billingError("No company subscription is linked",409);
 if(!process.env.STRIPE_SECRET_KEY||!process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID||!process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID)throw billingError("Stripe configuration missing",503);
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-03-31.basil"});
 const sub=await stripe.subscriptions.retrieve(org.stripe_subscription_id);
 if(sub.metadata?.virtus_product_family!=="organizations"||sub.metadata?.virtus_organization_id!==org.id)throw billingError("Subscription ownership mismatch",409);
 const items=sub.items?.data||[];
 const platform=items.find(i=>i.price?.id===process.env.VIRTUS_ORGANIZATION_PLATFORM_PRICE_ID);
 const seats=items.find(i=>i.price?.id===process.env.VIRTUS_ORGANIZATION_SEAT_PRICE_ID);
 if(items.length!==2||!platform||platform.quantity!==1||!seats||!Number.isSafeInteger(seats.quantity))throw billingError("Subscription prices are inconsistent",409);
 return {user,db,org,stripe,sub,platform,seats};
}
export async function seatCounts(db,orgId){
 const [active,endings,pending]=await Promise.all([
  db.from("virtus_organization_members").select("user_id").eq("organization_id",orgId).eq("status","active").neq("role","owner"),
  db.from("virtus_org_employee_access_endings").select("user_id").eq("organization_id",orgId),
  db.from("virtus_organization_invitations").select("id",{head:true,count:"exact"}).eq("organization_id",orgId).is("accepted_at",null).is("revoked_at",null).gt("expires_at",new Date().toISOString())
 ]);
 if(active.error||endings.error||pending.error)throw billingError("Unable to verify occupied licenses",503);
 const scheduled=new Set((endings.data||[]).map(e=>e.user_id));
 return {active:(active.data||[]).filter(m=>!scheduled.has(m.user_id)).length,pending:pending.count||0,endingAccess:(active.data||[]).filter(m=>scheduled.has(m.user_id)).length};
}
