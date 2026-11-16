import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
import {createAdminClient} from "@/lib/supabase-admin";
import {dispatchPaidQueuedInvitations} from "@/lib/organization-invitation-delivery.mjs";
export const dynamic="force-dynamic";
const response=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request){
 const client=await createClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return response({error:"Verified sign-in required"},401);
 const body=await request.json().catch(()=>({}));
 const id=body.organizationId,requestId=body.requestId;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id||"")||! /^[0-9a-f-]{36}$/i.test(requestId||""))return response({error:"Invalid request"},400);
 const db=createAdminClient();
 const {data:org,error:orgError}=await db.from("virtus_organizations").select("id,owner_user_id,billing_status,seat_limit,archived_at").eq("id",id).maybeSingle();
 if(orgError||!org||org.archived_at||org.owner_user_id!==user.id)return response({error:"Owner access required"},403);
 const {data:member}=await db.from("virtus_organization_members").select("role,status").eq("organization_id",id).eq("user_id",user.id).maybeSingle();
 if(member?.role!=="owner"||member.status!=="active")return response({error:"Owner access required"},403);
 if(org.billing_status!=="active")return response({error:"Subscription is not paid and active"},409);
 const {data:queue,error}=await db.from("virtus_organization_license_invite_queue").select("id,target_seats,status").eq("organization_id",id).eq("request_id",requestId).maybeSingle();
 if(error||!queue||queue.target_seats>org.seat_limit||queue.status!=="failed")return response({error:"No failed paid invitation is available for retry"},409);
 const reset=await db.from("virtus_organization_license_invite_queue").update({status:"pending",failure_reason:null}).eq("id",queue.id).eq("status","failed").select("id").maybeSingle();
 if(reset.error||!reset.data)return response({error:"Unable to queue retry"},409);
 try{await dispatchPaidQueuedInvitations({admin:db,organizationId:id});}
 catch{return response({error:"Invitation delivery remains unavailable"},503);}
 const {data:updated}=await db.from("virtus_organization_license_invite_queue").select("status,failure_reason").eq("id",queue.id).maybeSingle();
 return response({status:updated?.status||"pending",message:updated?.status==="sent"?"Invitation emailed successfully":"Invitation remains queued or requires attention."});
}
