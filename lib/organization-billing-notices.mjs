export async function dispatchOrganizationBillingNotices({admin,organizationId}){
 const {data:org,error:orgError}=await admin.from("virtus_organizations").select("id,name,owner_user_id,seat_limit,billing_status").eq("id",organizationId).maybeSingle();
 if(orgError||!org||org.billing_status!=="active")return {sent:0};
 const {data:rows,error}=await admin.from("virtus_org_billing_notices").select("*").eq("organization_id",organizationId).eq("status","pending").eq("new_seats",org.seat_limit).order("created_at",{ascending:true}).limit(10);
 if(error)throw Error("Billing notice lookup failed");
 if(!rows?.length)return {sent:0};
 const {data:{user},error:ownerError}=await admin.auth.admin.getUserById(org.owner_user_id);
 if(ownerError||!user?.email)throw Error("Company owner email not available");
 let sent=0;
 for(const notice of rows){
  const {data:claim,error:claimError}=await admin.from("virtus_org_billing_notices").update({status:"sending",attempted_at:new Date().toISOString()}).eq("id",notice.id).eq("status","pending").select("id").maybeSingle();
  if(claimError||!claim)continue;
  try{
   if(!process.env.RESEND_API_KEY||!process.env.VIRTUS_ORGANIZATION_INVITE_FROM)throw Error("Email sender not configured");
   const removed=notice.previous_seats-notice.new_seats;
   const recurring=(199+notice.new_seats*9.99).toFixed(2);
   const decrease=(removed*9.99).toFixed(2);
   const safe=v=>String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
   const subject="Virtus AI | Employee license downgrade confirmed";
   const text="Organization: "+org.name+"\nYour employee license downgrade is confirmed.\nEmployees removed: "+removed+"\nRemaining paid employee licenses: "+notice.new_seats+"\nMonthly reduction: $"+decrease+"\nUpdated monthly base: $"+recurring+" before applicable taxes.\nRemoved employees no longer receive organization-funded Mentor access. Their accounts and private histories remain preserved.\nNo automatic mid-cycle refund was issued.";
   const html='<div style="font-family:Arial,sans-serif;background:#082b23;color:#f7e4c4;padding:30px;border:1px solid #b69c63;border-radius:12px"><h2 style="color:#f1d39c">Employee license downgrade confirmed</h2><p>'+safe(org.name)+'</p><p>'+removed+' employee license(s) removed</p><p>Remaining employee licenses: <strong>'+notice.new_seats+'</strong></p><p>Monthly reduction: <strong>$'+decrease+'</strong></p><p>Updated monthly base: <strong>$'+recurring+'</strong> before taxes.</p><p style="font-size:13px">Removed employees no longer have company-funded Mentor access. Personal accounts and private history are preserved.</p></div>';
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"virtus-org-downgrade-"+notice.id},body:JSON.stringify({from:process.env.VIRTUS_ORGANIZATION_INVITE_FROM,to:[user.email],subject,text,html})});
   if(!response.ok)throw Error("Email provider status: "+response.status);
   const delivery=await response.json().catch(()=>({}));
   const saved=await admin.from("virtus_org_billing_notices").update({status:"sent",sent_at:new Date().toISOString(),provider_id:delivery.id||null,last_error:null}).eq("id",notice.id).eq("status","sending");
   if(saved.error)throw Error("Unable to record confirmation email");
   sent++;
  }catch(e){
   await admin.from("virtus_org_billing_notices").update({status:"failed",last_error:String(e.message).slice(0,180)}).eq("id",notice.id).eq("status","sending");
  }
 }
 return {sent};
}
