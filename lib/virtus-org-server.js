import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isOrgAdmin } from "@/lib/virtus-organizations.mjs";

export const orgResponse = (body,status=200) => Response.json(body,{
  status,headers:{"Cache-Control":"private, no-store"},
});
export async function organizationContext() {
  const auth=await createClient();
  const {data:{user},error}=await auth.auth.getUser();
  if(error||!user?.id) return {user:null,admin:null};
  return {user,admin:createAdminClient()};
}
export function validOrgId(id) {
  return typeof id==="string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
export async function requireOrganizationAdmin({admin,user,organizationId}) {
  if(!user||!admin||!validOrgId(organizationId)) return null;
  const {data: org,error}=await admin.from("virtus_organizations")
    .select("id,name,slug,owner_user_id,seat_limit,billing_status,status")
    .eq("id",organizationId).maybeSingle();
  if(error||!org) return null;
  const {data:member,error:memberError}=await admin.from("virtus_org_memberships")
    .select("role,status").eq("organization_id",org.id)
    .eq("user_id",user.id).maybeSingle();
  if(memberError||!isOrgAdmin(member)) return null;
  return {org,role:member.role};
}
export async function appendOrgAudit(admin,organizationId,actorId,action,targetId=null) {
  const {error}=await admin.from("virtus_org_audit_events").insert({
    organization_id:organizationId,actor_user_id:actorId,
    action,target_id:targetId==null?null:String(targetId).slice(0,150),
  });
  if(error) console.error("Organization audit write failed:",error.code);
  return !error;
}
