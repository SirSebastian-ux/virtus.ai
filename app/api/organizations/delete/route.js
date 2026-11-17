import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
const reply = (body,status=200) => NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request) {
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true") return reply({error:"Unavailable"},503);
 const {data:{user},error:authError}=await (await createClient()).auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at) return reply({error:"Authentication required"},401);
 const body=await request.json().catch(()=>null);
 const id=body?.organizationId;
 if(typeof id!=="string"||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return reply({error:"Invalid organization"},400);
 const admin=createAdminClient();
 const {data:membership,error:memberError}=await admin.from("virtus_organization_members").select("role,status").eq("organization_id",id).eq("user_id",user.id).maybeSingle();
 if(memberError||membership?.role!=="owner"||membership?.status!=="active") return reply({error:"Only the organization owner can delete it"},403);
 const {data:org,error:orgError}=await admin.from("virtus_organizations").select("id,name,billing_status,seat_limit").eq("id",id).maybeSingle();
 if(orgError||!org) return reply({error:"Organization not found"},404);
 if(body?.confirmation!==`DELETE ${org.name}`||body?.confirmId!==id) return reply({error:"Confirmation does not match the selected organization"},400);
 if(!["pending","inactive","canceled"].includes(String(org.billing_status||"").toLowerCase())||Number(org.seat_limit||0)>0)
  return reply({error:"This organization has active or allocated seats. Disable billing and complete a managed closure before deleting."},409);
 const {count:otherMembers,error:membersError}=await admin.from("virtus_organization_members").select("user_id",{count:"exact",head:true}).eq("organization_id",id).neq("user_id",user.id);
 const {count:invites,error:invitesError}=await admin.from("virtus_organization_invitations").select("id",{count:"exact",head:true}).eq("organization_id",id);
 if(membersError||invitesError) return reply({error:"Unable to verify organization safety checks"},503);
 if(otherMembers||invites) return reply({error:"This organization has employees or invitation history. Contact support for managed closure."},409);
 const {data:deleted,error:deleteError}=await admin.from("virtus_organizations").delete().eq("id",id).eq("billing_status",org.billing_status).select("id");
 if(deleteError||deleted?.length!==1) return reply({error:"Deletion could not be completed safely"},409);
 return reply({deleted:true,organizationId:id});
}
