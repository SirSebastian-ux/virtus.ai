export async function hasOrganizationMentorAccess({userId, userClient, adminClient}) {
 if (!userId || process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true" || process.env.VIRTUS_ORG_MENTORSHIP_ENABLED !== "true") return false;
 const {data:members,error}=await adminClient.from("virtus_organization_members").select("organization_id").eq("user_id",userId).eq("status","active").limit(25);
 if(error) throw new Error("Organization membership verification unavailable");
 for(const member of members||[]){
   const {data:allowed,error:accessError}=await userClient.rpc("virtus_organization_access",{p_organization_id:member.organization_id});
   if(accessError) throw new Error("Organization access verification unavailable");
   if(allowed===true) return true;
 }
 return false;
}
