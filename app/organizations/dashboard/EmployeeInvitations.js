"use client";
import {useEffect,useState} from "react";
const surface={border:"1px solid #d4b16e",borderRadius:14,padding:20,background:"linear-gradient(145deg,#0b4b3a,#07362c 55%,#06241f)",boxShadow:"0 12px 30px #0004"};
const gold={padding:"12px 18px",borderRadius:10,border:"1px solid #ffe6ac",background:"linear-gradient(110deg,#ffe8ad,#c99a4f,#f8e0a4)",color:"#21190e",fontWeight:800,cursor:"pointer"};
const input={width:"100%",padding:"12px 14px",maxWidth:440,borderRadius:9,border:"1px solid #b6995f",background:"#0a362d",color:"#fff0d2",fontSize:15};
async function api(path,method="GET",data){const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:data?JSON.stringify(data):undefined,cache:"no-store"});const result=await response.json().catch(()=>({}));return {...result,ok:response.ok,statusCode:response.status};}
export default function EmployeeInvitations({organizationId,isOwner,onInvitationSent}){
 const [email,setEmail]=useState(""),[billing,setBilling]=useState(null),[quote,setQuote]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[requestId,setRequestId]=useState(""),[paymentUrl,setPaymentUrl]=useState("");
 const base="/api/organizations/billing/seats";
 async function refresh(){if(!isOwner)return;const d=await api(base+"?organizationId="+encodeURIComponent(organizationId));if(d.ok)setBilling(d);else setMessage(d.error||"Unable to load billing status");}
 useEffect(()=>{let alive=true;if(!isOwner)return;api(base+"?organizationId="+encodeURIComponent(organizationId)).then(d=>{if(alive){if(d.ok)setBilling(d);else setMessage(d.error||"Billing status unavailable");}});return()=>{alive=false};},[organizationId,isOwner]);
 async function run(fn){setBusy(true);setMessage("");try{await fn();}catch(e){setMessage(e.message||"Request failed")}finally{setBusy(false);}}
 async function invite(){await run(async()=>{
  const cleaned=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned))throw Error("Enter a valid employee email address.");
  const sent=await api("/api/organizations/invitations","POST",{organizationId,email:cleaned});
  if(sent.ok){setMessage("Invitation email sent to "+cleaned+". The employee has 48 hours to accept.");setEmail("");setQuote(null);await refresh();onInvitationSent?.();return;}
  if(sent.statusCode===409&&sent.upgradeAvailable&&isOwner){
    const current=await api(base+"?organizationId="+encodeURIComponent(organizationId));
    if(!current.ok)throw Error(current.error||"Unable to verify licenses");
    setBilling(current);
    const preview=await api(base,"POST",{organizationId,seats:current.seats+1});
    if(!preview.ok)throw Error(preview.error||"Unable to preview additional license");
    setQuote({...preview,recipient:cleaned});setRequestId(crypto.randomUUID());setPaymentUrl("");return;
  }
  throw Error(sent.error||"Invitation unavailable. Ask the organization owner to add a paid employee license.");
 });}
 async function confirm(){await run(async()=>{
  if(!quote||!requestId)throw Error("Review the price before confirming.");
  const result=await api(base,"PUT",{organizationId,seats:quote.newSeats,expectedSeats:quote.oldSeats,confirm:true,requestId,invitedEmail:quote.recipient});
  if(!result.ok)throw Error(result.error||"Upgrade could not be submitted");
  setQuote(null);setPaymentUrl(result.paymentUrl||"");
  setMessage(result.status==="payment_pending"?"Payment requires completion. The invitation remains queued until Stripe verifies payment.":"Seat upgrade submitted. The invitation is queued and will send automatically after Stripe verifies the paid license.");
  await refresh();
 });}
 return <section style={{...surface,gridColumn:"1 / -1"}} aria-label="Invite an employee">
  <h2 style={{fontSize:20,color:"#f8dfa6",margin:"0 0 7px"}}>Invite an employee</h2>
  <p style={{margin:"0 0 16px",color:"#d0daca"}}>Each employee has a private Virtus AI account. Existing users sign in; new users create an account with the invited email.</p>
  {billing&&<p style={{color:"#f4d28c",fontWeight:650}}>Grow your team anytime — each additional Mentor license is just $9.99/month.</p>}
  <label htmlFor="new-employee-email" style={{display:"block",marginBottom:8}}>Employee email</label>
  <input id="new-employee-email" type="email" autoComplete="email" style={input} value={email} onChange={e=>{setEmail(e.target.value);setQuote(null);}} placeholder="employee@company.com"/>
  <div style={{marginTop:12}}><button type="button" style={gold} onClick={invite} disabled={busy||!email.includes("@")}>Send invitation email</button></div>
  {quote&&<div style={{border:"1px solid #e0c389",padding:18,borderRadius:12,marginTop:20,background:"#0a342b"}}>
   <strong style={{color:"#ffe3a0"}}>Extend Virtus AI Mentor to {quote.recipient}</strong>
   <p style={{marginTop:12,fontSize:21,fontWeight:800,color:"#ffe0a0"}}>Add this employee for just +$9.99/month</p>
   <p>Your existing monthly organization bill will increase by <strong>$9.99</strong>, before applicable taxes.</p>
   <details style={{marginTop:9,fontSize:12,color:"#d0cfbe"}}><summary style={{cursor:"pointer",color:"#f1d6a1"}}>Billing details</summary><p>Stripe estimates your upcoming invoice at <strong>${((quote.previewInvoiceTotalCents||0)/100).toFixed(2)} {quote.currency?.toUpperCase()}</strong>; this is not the amount necessarily charged today.</p></details>
   <p style={{fontSize:12,color:"#d0cfbe"}}>A prorated charge and any applicable taxes may apply today to the company’s saved payment method. The invitation is emailed automatically after payment is confirmed.</p>
   <button type="button" style={gold} disabled={busy} onClick={confirm}>Confirm +$9.99/month and invite</button>
   <button type="button" style={{...gold,marginLeft:12,background:"#134437",color:"#f9dc9d"}} disabled={busy} onClick={()=>setQuote(null)}>Cancel</button>
  </div>}
  {paymentUrl&&<p style={{marginTop:15}}><a href={paymentUrl} target="_blank" rel="noopener noreferrer" style={{color:"#ffe0a0",textDecoration:"underline",fontWeight:800}}>Complete payment securely with Stripe</a></p>}
  {message&&<p role="status" style={{padding:12,marginTop:12,border:"1px solid #ae9564",borderRadius:9,color:"#ffdf9d"}}>{message}</p>}
  {billing?.queuedInvitations?.length>0&&<div style={{marginTop:20,borderTop:"1px solid #9b8254",paddingTop:14}}><strong>Employee upgrade requests</strong>
    {billing.queuedInvitations.map((q,i)=><div key={q.request_id||i} style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}><p style={{fontSize:13,overflowWrap:"anywhere"}}>{q.invited_email} — {q.status==="sent"?"Invitation sent":q.status==="pending"||q.status==="sending"?"Awaiting paid license / email delivery":q.status==="failed"?"Delivery needs attention":q.status}</p>{q.status==="failed"&&<button type="button" style={{...gold,background:"#174b3b",color:"#f1d495"}} disabled={busy} onClick={()=>run(async()=>{const retried=await api("/api/organizations/invitations/retry","POST",{organizationId,requestId:q.request_id});if(!retried.ok)throw Error(retried.error||"Could not retry email");setMessage(retried.message||"Invitation retry submitted");await refresh();onInvitationSent?.();})}>Retry email</button>}</div>)}
  </div>}
  {isOwner&&<button type="button" style={{...gold,background:"#124638",color:"#ffe4a6",marginTop:12}} disabled={busy} onClick={()=>run(refresh)}>Refresh paid licenses</button>}
 </section>;
}
