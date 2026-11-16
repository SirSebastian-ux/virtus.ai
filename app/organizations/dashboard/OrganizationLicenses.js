"use client";
import {useEffect,useState} from "react";
const base={border:"1px solid #c7a35e",borderRadius:10,padding:12,background:"#092e26",color:"#f9e9be",maxWidth:540};
const field={padding:10,borderRadius:7,border:"1px solid #bf9e5b",background:"#06251f",color:"#fff0cc",width:110};
const action={padding:"12px 18px",border:"1px solid #ffe0a0",borderRadius:9,background:"linear-gradient(120deg,#fbe7af,#c89b50,#f8e2a0)",color:"#201609",fontWeight:800,cursor:"pointer"};
export default function OrganizationLicenses({organizationId}){
 const [info,setInfo]=useState(null),[number,setNumber]=useState(1),[quote,setQuote]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState("");
 async function api(method="GET",data){
  const url="/api/organizations/billing/seats"+(method==="GET"?"?organizationId="+encodeURIComponent(organizationId):"");
  const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},cache:"no-store",body:data?JSON.stringify(data):undefined});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(body.error||"Request failed");
  return body;
 }
 async function reload(){const d=await api();setInfo(d);setNumber(d.seats);setQuote(null);}
 useEffect(()=>{let alive=true;api().then(d=>{if(alive){setInfo(d);setNumber(d.seats);}}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false};},[organizationId]);
 async function run(fn){setBusy(true);setError("");setResult("");try{await fn();}catch(e){setError(e.message)}finally{setBusy(false);}}
 if(!info)return <div style={base}><h2>Employee licenses</h2><p>{error||"Loading subscription status..."}</p></div>;
 return <div style={{...base,maxWidth:"100%"}}>
 <h2>Billing & Employee Licenses</h2>
 <p><strong>Owner Mentor access: included</strong> in the $199/month platform fee. The owner does not use an employee license.</p>
 <p>Paid employee licenses: <strong>{info.seats}</strong> · Active enrolled employees using licenses: <strong>{info.usedSeats}</strong></p>
 <p>Current monthly base price: <strong>${(199+9.99*info.seats).toFixed(2)}</strong> before any taxes, discounts, or adjustments.</p>
 {!info.subscribed?<p>Complete the secure registration checkout to manage your subscription.</p>:!info.managementEnabled?<p>License management will be available when organizational billing is activated and your subscription is active.</p>:<>
 <label htmlFor="new-org-license-seats">New total employee licenses (owner excluded)</label>
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:8}}>
 <input id="new-org-license-seats" type="number" min={Math.max(1,info.usedSeats)} max={10000} style={field} value={number} onChange={e=>{setNumber(Number(e.target.value));setQuote(null);}}/>
 <button style={action} disabled={busy||!Number.isSafeInteger(number)||number<Math.max(1,info.usedSeats)||number===info.seats} onClick={()=>run(async()=>setQuote(await api("POST",{organizationId,seats:number})))}>Preview license change</button>
 </div>
 {quote&&<section style={{marginTop:18,padding:14,border:"1px solid #d7ba81",borderRadius:9}}>
 <h3>Review your license change</h3>
 <p>{quote.oldSeats} → {quote.newSeats} paid employee licenses.</p>
 <p>New recurring base price: <strong>${(quote.monthlyTotalCents/100).toFixed(2)} / month</strong>.</p>
 <p>{quote.direction==="increase"?"Estimated next invoice total":"Immediate charge"}: <strong>{quote.direction==="increase"?"$"+(quote.previewInvoiceTotalCents/100).toFixed(2):"$0.00"} {quote.currency.toUpperCase()}</strong></p>
 <p style={{fontSize:12}}>{quote.note}</p>
 <button style={action} disabled={busy} onClick={()=>run(async()=>{const response=await api("PUT",{organizationId,seats:quote.newSeats,expectedSeats:quote.oldSeats,confirm:true,requestId:crypto.randomUUID()});setResult(response.status==="payment_pending"?"Payment is pending. New licenses are not available until Stripe confirms payment.":"Stripe accepted the change. Reloading subscription status after billing reconciliation.");await reload();})}>Confirm license change</button>
 </section>}
 </>}
 <div style={{marginTop:12}}><button style={{...action,background:"#1a4e3f",color:"#f5d69a"}} disabled={busy} onClick={()=>run(reload)}>Refresh billing status</button></div>
 {error&&<p role="alert" style={{color:"#ffd49a"}}>{error}</p>}{result&&<p role="status" style={{color:"#c4ecd3"}}>{result}</p>}
 </div>;
}
