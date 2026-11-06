"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
export default function OrganizationDashboard(){
 const [memberships,setMemberships]=useState([]);
 const [selected,setSelected]=useState("");
 const [name,setName]=useState("");
 const [domain,setDomain]=useState("");
 const [dns,setDns]=useState(null);
 const [email,setEmail]=useState("");
 const [seats,setSeats]=useState(5);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [report,setReport]=useState(null);
 const [showRegistration,setShowRegistration]=useState(false); const [employeeLookup,setEmployeeLookup]=useState(""); const [employeeResult,setEmployeeResult]=useState(null);
 async function api(path,method="GET",payload){
  const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:payload?JSON.stringify(payload):undefined,cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Request failed");
  return data;
 }
 async function refresh(){try{const data=await api("/api/organizations");setMemberships(data.memberships||[]);}catch(e){setMessage(e.message);}}
 useEffect(()=>{refresh();},[]);
 async function run(action){setBusy(true);setMessage("");try{await action();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 const active=selected||memberships[0]?.organization_id;
 const owner=memberships.find(m=>m.organization_id===active&&m.role==="owner");
 const panel={border:"1px solid #d4b16e",borderRadius:22,padding:"clamp(20px,3vw,36px)",background:"linear-gradient(145deg,#0b4b3a 0%,#07362c 52%,#06241f 100%)",marginTop:24,boxShadow:"inset 0 2px 0 #ffe6ac30,0 16px 45px #0006,0 0 18px #ba945027"};
 const input={display:"block",width:"100%",maxWidth:540,background:"#0a362d",color:"#fff1d6",border:"1px solid #ae9059",borderRadius:12,padding:16,margin:"15px 0",fontSize:16,boxSizing:"border-box"};
 const button={background:"linear-gradient(115deg,#fce9b2,#c99b4b 40%,#ffe5a2 65%,#b88a3c)",color:"#19150d",border:"1px solid #ffe6ab",borderRadius:12,padding:"15px 24px",fontWeight:800,cursor:"pointer"};
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#0c4436 0%,#071c19 40%,#050a09 100%)",color:"#f4e6c9",padding:"6vh 5vw"}}>
  <div style={{maxWidth:900,margin:"auto"}}>
   <nav className="virtus-org-breadcrumb"><Link href="/">Virtus AI</Link><span> / </span><Link href="/organizations">Organizations</Link><span> / Workspace</span></nav>
   <div className="virtus-org-eyebrow">VIRTUS AI <span>ORGANIZATIONS</span></div>
   <h1 className="virtus-org-heading" style={{fontSize:"clamp(32px,5vw,48px)",fontFamily:"Georgia,serif"}}>Organization workspace</h1>
   <p style={{color:"#c6bfae",lineHeight:1.7}}>A private leadership development environment for your people. Manage verified access, employee mentorship and organizational learning with confidence.</p>
   {active&&<div className="virtus-org-summary"><div><small>ORGANIZATION</small><strong>{memberships.find(m=>m.organization_id===active)?.organization?.name||"Your organization"}</strong></div><div><small>DOMAIN</small><strong>{memberships.find(m=>m.organization_id===active)?.organization?.verified_domain||"Verification pending"}</strong></div><div><small>ENROLLMENT</small><strong>{memberships.find(m=>m.organization_id===active)?.organization?.billing_status||"Pending"}</strong></div></div>}
   <div style={{marginTop:20}}><Link href="/organizations/preview" className="virtus-org-guide-link">Explore full dashboard preview with sample data →</Link></div><div className="virtus-org-onboarding"><div><span className="virtus-org-onboarding-icon">✦</span><h2>Welcome to your organization workspace</h2><p>Start by registering your organization, then verify your corporate domain, configure employee licenses and send invitations. Your employees will have their own confidential mentorship space.</p></div></div><section style={panel}><h2>Your organizations</h2>
    <p style={{color:"#c8bba1"}}>Your secure organizational workspace</p>
    <select style={input} value={active||""} onChange={e=>setSelected(e.target.value)}>
     {!memberships.length&&<option value="">No organization yet</option>}
     {memberships.map(m=><option key={m.organization_id} value={m.organization_id}>{m.organization?.name||"Organization"} ({m.role})</option>)}
    </select>
    {!showRegistration&&memberships.length>0?<button className="virtus-org-action" style={button} onClick={()=>setShowRegistration(true)}>+ Add another organization</button>:<div style={{marginTop:16}}><label htmlFor="org-name">Organization name</label><input id="org-name" style={input} placeholder="Enter legal organization name" value={name} onChange={e=>setName(e.target.value)}/><button className="virtus-org-action" disabled={busy||name.trim().length<2} style={button} onClick={()=>run(async()=>{const result=await api("/api/organizations","POST",{name});setMessage("Organization registered successfully.");setShowRegistration(false);setName("");await refresh();setSelected(result.organization.id);})}>Register organization</button></div>}
   </section>
   {active&&<><section style={panel}><h2>Corporate domain verification</h2>
    <p>Only the organization owner can verify the corporate email domain through DNS.</p>
    <input style={input} placeholder="company.com" value={domain} onChange={e=>setDomain(e.target.value)}/>
    <button disabled={busy||!owner} className="virtus-org-action" style={button} onClick={()=>run(async()=>{setDns(await api("/api/organizations/domain","POST",{organizationId:active,domain}));})}>Generate DNS verification record</button>
    {dns&&<div style={{overflowWrap:"anywhere",marginTop:16}}>Add {dns.recordType} record at <strong>{dns.hostname}</strong> with value <code>{dns.value}</code></div>}
    <div style={{marginTop:12}}><button disabled={busy||!owner} className="virtus-org-action" style={button} onClick={()=>run(async()=>{const r=await api("/api/organizations/domain","PUT",{organizationId:active});setMessage("Domain verified: "+r.domain);})}>Verify published DNS record</button></div>
   </section>
   <section style={panel}><h2>Invite an employee</h2>
    <p>Invite your team through secure, individual email links. Domain verification and available licensed seats are required before invitations can be sent.</p>
    <input style={input} type="email" placeholder="employee@company.com" value={email} onChange={e=>setEmail(e.target.value)}/>
    <button disabled={busy||!owner} className="virtus-org-action" style={button} onClick={()=>run(async()=>{await api("/api/organizations/invitations","POST",{organizationId:active,email});setMessage("Invitation submitted for delivery.");})}>Send secure invitation</button>
   </section>
   <section style={panel}><h2>Find an employee</h2><p>Search by verified corporate email to review enrollment status. Private mentoring conversations and reflections are never visible to organization administrators.</p><label htmlFor="org-employee-search">Corporate email</label><input id="org-employee-search" type="email" style={input} value={employeeLookup} placeholder="name@company.com" onChange={e=>{setEmployeeLookup(e.target.value);setEmployeeResult(null);}}/><button disabled={busy||!owner||!employeeLookup.includes("@")} className="virtus-org-action" style={button} onClick={()=>run(async()=>{const result=await api("/api/organizations/employees/lookup?organizationId="+encodeURIComponent(active)+"&email="+encodeURIComponent(employeeLookup));setEmployeeResult(result);})}>Find employee</button>{employeeResult&&<div className="virtus-org-employee-result" role="status"><strong>{employeeResult.email}</strong><p>{!employeeResult.enrollment?"No invitation found for this email.":employeeResult.enrollment.accepted?"Invitation accepted":employeeResult.enrollment.revoked?"Invitation revoked":"Invitation pending"}</p><small>Private mentorship content is not accessible from this directory.</small></div>}</section>
   <section style={panel}><h2>Employee mentorship licenses</h2>
    <p>Equip your team with confidential AI mentorship, structured leadership development and guided exercises.</p>
    <label htmlFor="org-license-count" style={{display:"block",marginTop:18,fontWeight:700,color:"#f2d99c"}}>Number of employee licenses</label><input id="org-license-count" aria-label="Number of employee licenses" style={input} type="number" min={1} max={10000} value={seats} onChange={e=>setSeats(Number(e.target.value))}/>
    <button disabled={busy||!owner} className="virtus-org-action" style={button} onClick={()=>run(async()=>{const r=await api("/api/organizations/billing/checkout","POST",{organizationId:active,seats});if(r.url&&new URL(r.url).hostname.endsWith("stripe.com"))window.location.assign(r.url);})}>Proceed to Stripe Checkout</button>
   </section>
   <section style={panel}><h2>Aggregate learning report</h2>
    <p>Review organizational learning participation, completed exercises and measurable development trends across eligible teams.</p>
    <button disabled={busy||!owner} className="virtus-org-action" style={button} onClick={()=>run(async()=>{
      const result=await api("/api/organizations/reporting?organizationId="+encodeURIComponent(active));
      setReport(result.learning||[]);
    })}>View participation report</button>
    {report&&<div style={{marginTop:16}}>{report.length===0?<p>No eligible group results available.</p>:report.map((item,i)=><p key={i}>{item.curriculum_type}, module {item.module_number}: {item.participants} participants, {item.completed_exercises} completed exercises</p>)}</div>}
   </section>
   <section style={panel}><h2>Private mentorship</h2><p>Employee conversations are private. Administrators cannot view personal mentoring exchanges.</p>
    <Link href={"/organizations/mentor?organizationId="+encodeURIComponent(active)} style={{color:"#d5b16a"}}>Open private mentor</Link>
   </section></>}
   {message&&<p role="status" className="virtus-org-status">{message}</p>}
  </div>
  <style jsx global>{`\n.virtus-org-breadcrumb{display:flex;gap:9px;flex-wrap:wrap;color:#c9b78f;font-size:13px}.virtus-org-breadcrumb a{color:#f0d38e;text-decoration:none}.virtus-org-onboarding{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;padding:28px;margin:30px 0 10px;border:1px solid #d8b573;border-radius:22px;background:linear-gradient(135deg,#10533f,#062d26);box-shadow:inset 0 2px 0 #ffe2a633,0 16px 40px #0006}.virtus-org-onboarding>div{flex:1;min-width:230px}.virtus-org-onboarding h2{font:normal 28px Georgia,serif;color:#f9e6bc;margin:12px 0}.virtus-org-onboarding p{color:#d1d7cb;line-height:1.7;max-width:670px}.virtus-org-onboarding-icon{color:#f1d28d;font-size:24px}.virtus-org-guide-link{color:#f5dc9e;text-decoration:none;border:1px solid #c9aa6d;border-radius:12px;padding:14px 18px;background:#0b392e;font-weight:700}.virtus-org-guide-link:hover{background:#175441}.virtus-org-section-label{color:#e9c77f;letter-spacing:.18em;font-size:11px;font-weight:800}.virtus-org-eyebrow{margin-top:26px;letter-spacing:.22em;font-size:12px;font-weight:800;color:#f4d892;text-shadow:0 0 15px #c89a4770}.virtus-org-eyebrow span{color:#fff1c9}.virtus-org-heading{background:linear-gradient(115deg,#fff5d8 10%,#e8bb62 45%,#fff8de 65%,#b98b3e 100%);background-clip:text;-webkit-background-clip:text;color:transparent;text-shadow:0 10px 35px #e4ba4520}.virtus-org-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:26px 0}.virtus-org-summary>div{background:linear-gradient(140deg,#0c4637,#082b26);border:1px solid #bda0609c;border-radius:15px;padding:20px;box-shadow:inset 0 1px 0 #f6db9e33,0 12px 30px #0005}.virtus-org-summary small{display:block;color:#c7aa70;letter-spacing:.15em;font-size:11px;margin-bottom:10px}.virtus-org-summary strong{display:block;color:#fff0d0;overflow-wrap:anywhere}.virtus-org-action{position:relative;overflow:hidden;isolation:isolate;box-shadow:inset 0 2px 1px #fff7cb99,0 5px 14px #0005,0 0 0 1px #9b7837;transition:transform .22s ease,box-shadow .22s ease,filter .22s ease}.virtus-org-action:before{content:"";position:absolute;inset:-60% auto -60% -55%;width:38%;background:linear-gradient(90deg,transparent,#fff9d7a6,transparent);transform:skewX(-24deg);transition:left .65s ease;pointer-events:none}.virtus-org-action:hover:not(:disabled){transform:translateY(-2px);box-shadow:inset 0 2px 1px #fff9dc,0 9px 24px #0008,0 0 23px #e7bd6b77;filter:brightness(1.12)}.virtus-org-action:hover:before{left:130%}.virtus-org-action:focus-visible{outline:3px solid #fff1b5;outline-offset:4px}.virtus-org-action:disabled{opacity:.48;cursor:not-allowed}.virtus-org-price{display:flex;align-items:baseline;gap:12px;margin:15px 0}.virtus-org-price strong{font:600 38px Georgia,serif;color:#f4d58c}.virtus-org-price span{color:#cbbda3}.virtus-org-status{margin:25px 0;padding:16px 20px;background:#183c32;border:1px solid #c7a45b;border-radius:12px;color:#f4d68f}@media(prefers-reduced-motion:reduce){.virtus-org-action,.virtus-org-action:before{transition:none}}\n`}</style>
 </main>;
}
