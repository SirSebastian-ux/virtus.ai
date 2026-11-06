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
 const panel={border:"1px solid #544429",borderRadius:16,padding:24,background:"#13120f",marginTop:18};
 const input={display:"block",width:"100%",maxWidth:460,background:"#242019",color:"#f4e6c9",border:"1px solid #6e5935",borderRadius:8,padding:12,margin:"12px 0"};
 const button={background:"#d5b16a",color:"#19150d",border:0,borderRadius:8,padding:"12px 20px",fontWeight:700,cursor:"pointer"};
 return <main style={{minHeight:"100vh",background:"#090909",color:"#f4e6c9",padding:"6vh 5vw"}}>
  <div style={{maxWidth:900,margin:"auto"}}>
   <Link href="/organizations" style={{color:"#d5b16a"}}>Virtus AI Organizations</Link>
   <h1 style={{fontSize:36}}>Organization workspace</h1>
   <p style={{color:"#bbb2a4"}}>Manage corporate identity, employee invitations, subscriptions, and confidential mentorship.</p>
   <section style={panel}><h2>Your organizations</h2>
    <select style={input} value={active||""} onChange={e=>setSelected(e.target.value)}>
     {!memberships.length&&<option value="">No organization yet</option>}
     {memberships.map(m=><option key={m.organization_id} value={m.organization_id}>{m.organization_id} ({m.role})</option>)}
    </select>
    <input style={input} placeholder="Organization name" value={name} onChange={e=>setName(e.target.value)}/>
    <button disabled={busy} style={button} onClick={()=>run(async()=>{const r=await api("/api/organizations","POST",{name});setMessage("Organization registered: "+r.organization.id);await refresh();})}>Register organization</button>
   </section>
   {active&&<><section style={panel}><h2>Corporate domain verification</h2>
    <p>Only the organization owner can verify the corporate email domain through DNS.</p>
    <input style={input} placeholder="company.com" value={domain} onChange={e=>setDomain(e.target.value)}/>
    <button disabled={busy||!owner} style={button} onClick={()=>run(async()=>{setDns(await api("/api/organizations/domain","POST",{organizationId:active,domain}));})}>Generate DNS verification record</button>
    {dns&&<div style={{overflowWrap:"anywhere",marginTop:16}}>Add {dns.recordType} record at <strong>{dns.hostname}</strong> with value <code>{dns.value}</code></div>}
    <div style={{marginTop:12}}><button disabled={busy||!owner} style={button} onClick={()=>run(async()=>{const r=await api("/api/organizations/domain","PUT",{organizationId:active});setMessage("Domain verified: "+r.domain);})}>Verify published DNS record</button></div>
   </section>
   <section style={panel}><h2>Invite an employee</h2>
    <p>Invitations require a verified corporate domain and an active subscription with available seats.</p>
    <input style={input} type="email" placeholder="employee@company.com" value={email} onChange={e=>setEmail(e.target.value)}/>
    <button disabled={busy||!owner} style={button} onClick={()=>run(async()=>{await api("/api/organizations/invitations","POST",{organizationId:active,email});setMessage("Invitation submitted for delivery.");})}>Send secure invitation</button>
   </section>
   <section style={panel}><h2>Employee subscriptions</h2>
    <p>$10 USD per licensed employee per month. Checkout is unavailable until live billing has been configured and verified.</p>
    <input style={input} type="number" min={1} max={10000} value={seats} onChange={e=>setSeats(Number(e.target.value))}/>
    <button disabled={busy||!owner} style={button} onClick={()=>run(async()=>{const r=await api("/api/organizations/billing/checkout","POST",{organizationId:active,seats});if(r.url&&new URL(r.url).hostname.endsWith("stripe.com"))window.location.assign(r.url);})}>Proceed to Stripe Checkout</button>
   </section>
   <section style={panel}><h2>Private mentorship</h2><p>Employee conversations are private. Administrators cannot view personal mentoring exchanges.</p>
    <Link href={"/organizations/mentor?organizationId="+encodeURIComponent(active)} style={{color:"#d5b16a"}}>Open private mentor</Link>
   </section></>}
   <p role="status" style={{marginTop:24,color:"#e2bf80"}}>{message}</p>
  </div>
 </main>;
}
