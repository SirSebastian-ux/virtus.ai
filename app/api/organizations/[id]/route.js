import { organizationContext,orgResponse,requireOrganizationAdmin } from "@/lib/virtus-org-server";
import { privacySafeOrganizationReport } from "@/lib/virtus-organizations.mjs";

export async function GET(_request,{params}) {
  const {id}=await params;
  const {user,admin}=await organizationContext();
  if(!user) return orgResponse({error:"Sign in to view the organization."},401);
  const access=await requireOrganizationAdmin({admin,user,organizationId:id});
  if(!access) return orgResponse({error:"Organization administration is unavailable."},404);
  const [members,invites,library]=await Promise.all([
    admin.from("virtus_org_memberships")
      .select("id,role,status,created_at")
      .eq("organization_id",id).limit(1000),
    admin.from("virtus_org_invitations")
      .select("id,invited_email,status,expires_at,created_at")
      .eq("organization_id",id).order("created_at",{ascending:false}).limit(100),
    admin.from("virtus_ews_curriculum_registry")
      .select("id,title,collection_kind,expected_units,source_status,version_label")
      .order("title",{ascending:true}).limit(40),
  ]);
  if(members.error||invites.error||library.error) return orgResponse({error:"Organization information unavailable."},503);
  const activeSeatCount=(members.data||[]).filter(m=>m.role==="member"&&m.status==="active").length;
  return orgResponse({
    organization:access.org,
    serverNow:new Date().toISOString(),
    myRole:access.role,
    seats:{allocated:activeSeatCount,capacity:access.org.seat_limit,
      available:Math.max(0,access.org.seat_limit-activeSeatCount)},
    invitations:invites.data||[],
    programmeCatalogue:library.data||[],
    reporting:privacySafeOrganizationReport(members.data||[],activeSeatCount),
    privacyNotice:"Organization administrators cannot view members' private coaching, psychological reflections, goals, projects or development records.",
    billingNotice:access.org.billing_status==="active" && Date.parse(access.org.paid_through||"")>Date.now() ? null :
      "Company access is not yet activated. Seat invitations and employee sponsorship will become available after corporate billing is configured.",
  });
}
