"use client";
import {useEffect,useState} from "react";
const surface={border:"1px solid #a88e60",borderRadius:12,padding:18,background:"#082d26",color:"#f5e4be"};
const primary={padding:"11px 16px",background:"linear-gradient(110deg,#ffe8ad,#c99a4f,#f8e0a4)",border:"1px solid #f6d89a",borderRadius:9,fontWeight:800,color:"#24190e",cursor:"pointer"};
const secondary={...primary,background:"#174638",color:"#f8dfaa"};
const field={padding:12,background:"#092c25",border:"1px solid #a98b57",borderRadius:8,color:"#f6e3c4",width:"100%",maxWidth:400};
async function send(url,method="GET",body){const res=await fetch(url,{method,headers:{"Content-Type":"application/json"},cache:"no-store",body:body?JSON.stringify(body):undefined});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||"Unable to process request");return data;}
export default function OrganizationCancellation({organizationId,onUpdate}){
 const [people,setPeople]=useState([]),[selected,setSelected]=useState([]),[review,setReview]=useState(null),[cancellation,setCancellation]=useState(null),[timing,setTiming]=useState("period_end"),[confirmedName,setConfirmedName]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[state,setState]=useState(null);
 const ids=selected;
 const load=async()=>{const [directory,subscription]=await Promise.all([send("/api/organizations/employees?organizationId="+encodeURIComponent(organizationId)),send("/api/organizations/billing/cancel?organizationId="+encodeURIComponent(organizationId))]);setPeople((directory.employees||[]).filter(x=>x.role!=="owner"&&x.status==="active"&&x.userId));setState(subscription);};
 useEffect(()=>{let mounted=true;Promise.all([send("/api/organizations/employees?organizationId="+encodeURIComponent(organizationId)),send("/api/organizations/billing/cancel?organizationId="+encodeURIComponent(organizationId))]).then(([directory,subscription])=>{if(!mounted)return;setPeople((directory.employees||[]).filter(x=>x.role!=="owner"&&x.status==="active"&&x.userId));setState(subscription);}).catch(e=>{if(mounted)setMessage(e.message)});return()=>{mounted=false};},[organizationId]);
 async function run(fn){setBusy(true);setMessage("");try{await fn()}catch(e){setMessage(e.message)}finally{setBusy(false)}}
 const downgradePath="/api/organizations/billing/downgrade",cancelPath="/api/organizations/billing/cancel";
 return <div style={{gridColumn:"1/-1",display:"grid",gap:16}}>
 <section style={surface}>
 <h2 style={{margin:"0 0 10px",color:"#f7dfa5"}}>Reduce employee licenses</h2>
 <p>Select the employees who should no longer receive organization-funded Mentor access. Their personal accounts, conversations and development history remain saved.</p>
 {people.length===0?<p>No currently enrolled employees are available to remove.</p>:<div style={{display:"grid",gap:10,marginTop:12}}>{people.map(p=><label key={p.userId} style={{display:"flex",gap:12,alignItems:"center",padding:12,border:"1px solid #426e5b",borderRadius:8,cursor:"pointer"}}><input type="checkbox" checked={ids.includes(p.userId)} onChange={e=>{setSelected(v=>e.target.checked?[...v,p.userId]:v.filter(id=>id!==p.userId));setReview(null);}}/><span style={{overflowWrap:"anywhere"}}>{p.email}</span></label>)}</div>}
 <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:15}}><button type="button" style={secondary} disabled={busy||!ids.length||!!state?.cancelAtPeriodEnd||state?.cancelled} onClick={()=>run(async()=>{setReview(await send(downgradePath,"POST",{organizationId,employeeIds:ids}));})}>Review license reduction</button>{review&&<button type="button" style={secondary} disabled={busy} onClick={()=>setReview(null)}>Back</button>}</div>
 {review&&<div style={{marginTop:16,borderTop:"1px solid #856d48",paddingTop:15}}><h3 style={{margin:"0 0 8px"}}>Confirm reduction</h3><p>Remove organizational access for <strong>{review.employeesToRemove} {review.employeesToRemove===1?"employee":"employees"}</strong>.</p><p>Next monthly bill decreases by <strong>${(review.monthlyReductionCents/100).toFixed(2)}</strong>; new monthly base <strong>${(review.nextMonthlyBaseCents/100).toFixed(2)}</strong>, before taxes.</p><p style={{fontSize:12}}>{review.note}</p><button type="button" style={primary} disabled={busy} onClick={()=>run(async()=>{const response=await send(downgradePath,"PUT",{organizationId,employeeIds:ids,expectedSeats:review.currentSeats,confirm:true,requestId:crypto.randomUUID()});setMessage(response.note);setSelected([]);setReview(null);await load();onUpdate?.();})}>Confirm employee downgrade</button></div>}
 </section>
 <section style={{...surface,borderColor:"#a27468"}}>
 <h2 style={{margin:"0 0 10px",color:"#f5d3a2"}}>Cancel organization subscription</h2>
 <p>Cancellation ends the organization's recurring subscription and all organization-funded Mentor access, including the owner's included access. Personal subscriptions and saved account history are not deleted.</p>
 {state?.cancelAtPeriodEnd?<p role="status">Subscription cancellation is scheduled for the end of the current paid period. Access continues until Stripe confirms cancellation.</p>:state?.cancelled?<p role="status">This company subscription is canceled.</p>:<>
 <div style={{display:"grid",gap:10,margin:"14px 0"}}>
 <label style={{display:"flex",gap:10}}><input type="radio" name="org-cancel-timing" checked={timing==="period_end"} onChange={()=>{setTiming("period_end");setCancellation(null);}}/>Cancel at the end of the paid billing period</label>
 <label style={{display:"flex",gap:10}}><input type="radio" name="org-cancel-timing" checked={timing==="immediate"} onChange={()=>{setTiming("immediate");setCancellation(null);}}/>Cancel immediately and end all company-funded access now</label>
 </div>
 <button type="button" style={secondary} disabled={busy} onClick={()=>run(async()=>{setCancellation(await send(cancelPath,"POST",{organizationId,timing}));setConfirmedName("");})}>Review cancellation</button>
 {cancellation&&<div style={{borderTop:"1px solid #936c58",marginTop:15,paddingTop:15}}>
 <h3 style={{margin:"0 0 8px"}}>Confirm organization cancellation</h3>
 <p>{cancellation.summary}</p>
 <p><strong>{cancellation.employeesAffected}</strong> currently active employee accounts will lose organization-funded access when cancellation takes effect.</p>
 <label htmlFor="cancel-org-name" style={{display:"block",marginBottom:8}}>Type <strong>{cancellation.companyName}</strong> to confirm</label>
 <input id="cancel-org-name" style={field} value={confirmedName} onChange={e=>setConfirmedName(e.target.value)} autoComplete="off"/>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:12}}><button type="button" disabled={busy||confirmedName!==cancellation.companyName} style={{...primary,background:"#8e4942",color:"#fff2e4"}} onClick={()=>run(async()=>{const result=await send(cancelPath,"PUT",{organizationId,confirm:true,confirmName:cancellation.companyName,timing,requestId:crypto.randomUUID()});setMessage(result.note||"Cancellation confirmed");setCancellation(null);await load();onUpdate?.();})}>{timing==="immediate"?"Cancel company subscription now":"Schedule company cancellation"}</button><button type="button" style={secondary} onClick={()=>setCancellation(null)} disabled={busy}>Keep subscription</button></div>
 </div>}
 </>}
 </section>
 {message&&<p role="status" style={{padding:12,border:"1px solid #ad9b64",borderRadius:8,color:"#f1d491"}}>{message}</p>}
 </div>;
}
