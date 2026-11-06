import { organizationContext,orgResponse,appendOrgAudit } from "@/lib/virtus-org-server";
import { validateOrganizationName,newOrganizationSlug } from "@/lib/virtus-organizations.mjs";
import { checkRateLimit,getRateLimitIdentity,rateLimitResponse } from "@/lib/rate-limit";

export async function GET() {
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in to view organizations."},401);
  const {data:memberships,error}=await admin.from("virtus_org_memberships")
    .select("organization_id,role,status")
    .eq("user_id",user.id).eq("status","active").limit(20);
  if(error) return orgResponse({error:"Could not load organizations."},503);
  const ids=(memberships||[]).map(m=>m.organization_id);
  if(!ids.length) return orgResponse({organizations:[]});
  const {data:orgs,error:orgError}=await admin.from("virtus_organizations")
    .select("id,name,slug,seat_limit,billing_status,status")
    .in("id",ids).limit(20);
  if(orgError) return orgResponse({error:"Could not load organizations."},503);
  const organizations=(orgs||[]).map(org=>({
    ...org,role:memberships.find(m=>m.organization_id===org.id)?.role||"member",
  }));
  return orgResponse({organizations});
}

export async function POST(request) {
  const rate=checkRateLimit({key:`org-create:${getRateLimitIdentity(request)}`,limit:4,windowMs:60_000});
  if(!rate.allowed) return rateLimitResponse(rate);
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in to create an organization."},401);
  const raw=await request.json().catch(()=>null);
  const result=validateOrganizationName(raw?.name);
  if(result.error) return orgResponse({error:result.error},400);
  const {count,error:countError}=await admin.from("virtus_organizations")
    .select("id",{count:"exact",head:true}).eq("owner_user_id",user.id);
  if(countError) return orgResponse({error:"Could not verify organizational access."},503);
  if((count||0)>=3) return orgResponse({error:"You have reached the three-organization pilot limit."},409);
  const {data:org,error}=await admin.from("virtus_organizations")
    .insert({name:result.value,slug:newOrganizationSlug(result.value),
      owner_user_id:user.id,status:"draft",billing_status:"pending",seat_limit:0})
    .select("id,name,slug").single();
  if(error) return orgResponse({error:"Could not create the organization."},500);
  const {error:membershipError}=await admin.from("virtus_org_memberships")
    .insert({organization_id:org.id,user_id:user.id,role:"owner",status:"active"});
  if(membershipError) {
    await admin.from("virtus_organizations").delete().eq("id",org.id).eq("owner_user_id",user.id);
    return orgResponse({error:"Could not establish organization ownership."},500);
  }
  await appendOrgAudit(admin,org.id,user.id,"organization.created");
  return orgResponse({organization:org,billingConfigured:false},201);
}
