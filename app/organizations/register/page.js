"use client";
import {useState} from "react";
import Link from "next/link";
const initial={name:"",industry:"",country:"",business_address:"",contact_name:"",contact_email:"",total_employees:5,requested_seats:5};
const fields=[["name","Legal business name"],["industry","Industry / business type"],["country","Country"],["business_address","Registered business address"],["contact_name","Organization Administrator’s Full Name"],["contact_email","Business contact email"]];
export default function RegisterOrganization(){
 const [form,setForm]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[registered,setRegistered]=useState("");
 const update=(key,value)=>setForm(v=>({...v,[key]:value}));
 const input={display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:"12px 14px",borderRadius:9,border:"1px solid #a88952",background:"#082b24",color:"#fff2d5",fontSize:15};
 const button={border:0,borderRadius:10,padding:"14px 22px",fontWeight:800,background:"linear-gradient(110deg,#ffe7ad,#c99c50,#f5d89b)",color:"#19170f",cursor:"pointer"};
 async function send(url,method,payload){const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||"Request failed");return data;}
 async function submit(event){event.preventDefault();setBusy(true);setMessage("");try{
  if(!Number.isSafeInteger(form.total_employees)||form.total_employees<1||!Number.isSafeInteger(form.requested_seats)||form.requested_seats<1||form.requested_seats>form.total_employees)throw Error("Licenses must be between 1 and the total employee count.");
  let id=registered;
  if(!id){const result=await send("/api/organizations","POST",{name:form.name});id=result.organization.id;setRegistered(id);}
  await send("/api/organizations/profile","PUT",{organizationId:id,...form});
  const checkout=await send("/api/organizations/billing/checkout","POST",{organizationId:id,seats:form.requested_seats});
  if(!checkout.url?.startsWith("https://checkout.stripe.com/"))throw Error("Secure checkout is unavailable");
  window.location.assign(checkout.url);
 }catch(error){setMessage(error.message+(registered?" Your company registration is saved; you can retry payment later.":""));}finally{setBusy(false);}}
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 0%,#104c3b,#061e19 48%,#040d0b)",color:"#f4e8cc",padding:"45px 20px"}}><div style={{maxWidth:780,margin:"auto"}}>
 <Link href="/organizations/workspace" style={{color:"#f2cf87"}}>Organizations / Back to company selection</Link>
 <p style={{color:"#e1b96c",letterSpacing:3,fontWeight:800,fontSize:12,marginTop:35}}>VIRTUS AI FOR ORGANIZATIONS</p>
 <h1 style={{font:"normal clamp(32px,5vw,50px) Georgia,serif",color:"#f1d39c"}}>Register your organization</h1>
 <p>Complete the company information, choose licensed employees, then review your monthly subscription before payment.</p>
 <form onSubmit={submit} style={{border:"1px solid #b99b61",borderRadius:18,padding:"clamp(18px,4vw,36px)",background:"linear-gradient(145deg,#0b4737,#062a23)",display:"grid",gap:18,marginTop:26}}>
 <h2 style={{margin:0,color:"#f3d8a2"}}>1. Company information</h2>
 {fields.map(([key,label])=><label key={key} style={{fontWeight:650}}>{label}<input style={input} required minLength={2} maxLength={key==="name"?160:240} type={key==="contact_email"?"email":"text"} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}
 <h2 style={{margin:"10px 0 0",color:"#f3d8a2"}}>2. Employee licensing</h2>
 <label>Total company employees<input style={input} type="number" required min={1} max={1000000} value={form.total_employees} onChange={e=>update("total_employees",Number(e.target.value))}/></label>
 <label>Employees requiring Virtus AI licenses<input style={input} type="number" required min={1} max={10000} value={form.requested_seats} onChange={e=>update("requested_seats",Number(e.target.value))}/></label>
 <div style={{borderTop:"1px solid #ad8c55",paddingTop:22}}><h2 style={{color:"#f3d8a2",marginTop:0}}>3. Subscription review</h2><p>Organization platform: <strong>$199.00 / month</strong></p><p>{form.requested_seats||0} employee licenses × $9.99 / month</p><p style={{fontSize:24,color:"#f8d894",fontWeight:800}}>Total: ${(199+9.99*Math.max(0,form.requested_seats||0)).toFixed(2)} / month</p><p style={{fontSize:12}}>Taxes, if applicable, are determined at checkout. Access is activated only after verified payment.</p></div>
 {message&&<p role="alert" style={{color:"#ffd0b6"}}>{message}</p>}
 <button type="submit" disabled={busy} style={{...button,opacity:busy?.6:1}}>{busy?"Saving registration...":"Save and continue to secure payment"}</button>
 {registered&&<Link href={"/organizations/dashboard?organizationId="+encodeURIComponent(registered)} style={{color:"#f2cf87"}}>Return to your saved organization</Link>}
 </form></div></main>;
}
