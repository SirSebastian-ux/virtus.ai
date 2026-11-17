"use client";
import {useEffect,useState} from "react";
const panel={border:"1px solid #9e8353",background:"#082d26",borderRadius:12,padding:15};
const fmt=(n)=>Number(n||0).toLocaleString("en-US");
export default function HRDevelopmentIntelligence({organizationId}){
 const [data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[selected,setSelected]=useState("");
 useEffect(()=>{if(!organizationId)return;let alive=true;
  queueMicrotask(()=>{if(alive){setLoading(true);setError("");setData(null);}});
  fetch("/api/organizations/reporting/activity?organizationId="+encodeURIComponent(organizationId),{credentials:"same-origin",cache:"no-store"})
   .then(async response=>{const payload=await response.json().catch(()=>({}));if(!response.ok)throw Error(payload.error||"Report unavailable");return payload;})
   .then(payload=>{if(alive){setData(payload);setSelected(payload.employees?.[0]?.userId||"");}})
   .catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});
  return ()=>{alive=false};},[organizationId]);
 const emp=data?.employees?.find(e=>e.userId===selected);
 return <div style={{marginTop:18,display:"grid",gap:15}}>
 <div><h2 style={{color:"#f4daa5",fontSize:23}}>HR Development Intelligence</h2>
 <p style={{fontSize:13,color:"#d5d6c8"}}>Actual recorded organizational learning, not access to personal Mentor conversations. Last 30 days (UTC). The private personal development bar is not an HR metric. Pre-existing individual Mentor stages are not imported into company reports; the eight workplace domains below require separate organizational evidence.</p></div>
 {loading&&<p role="status">Loading verified learning records...</p>}
 {error&&<p role="alert" style={{color:"#f0b0a5"}}>{error}</p>}
 {data&&<>
  {!data.complete&&<p role="alert" style={{color:"#f0c987"}}>The reporting cap was reached. Totals are partial; this view does not claim complete organization coverage.</p>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:9}}>
   {[[data.totals.employeeCount,"Enrolled members"],[data.totals.activeLearners,"Active learners"],[data.totals.trainingHours+" h","Active learning"],[data.totals.exercisesCompleted,"Exercises completed"],[data.totals.assessmentsCompleted,"Scenario assessments"],[data.totals.trainingSessions,"Learning sessions"]].map(([value,label])=><div key={label} style={panel}><strong style={{display:"block",fontSize:24,color:"#f7d991"}}>{value}</strong><span style={{fontSize:11,color:"#c8d6c8"}}>{label}</span></div>)}
  </div>
  <div style={panel}><h3 style={{color:"#f3d99d",fontSize:18}}>Individual learning activity</h3>
  <p style={{fontSize:12,color:"#c8d6c8"}}>Employee identifiers are visible only to authorized organizational owners and admins.</p>
  <label htmlFor="hr-select" style={{fontSize:12,color:"#f3d99d"}}>Select an enrolled member</label>
  <select id="hr-select" value={selected} onChange={e=>setSelected(e.target.value)} style={{display:"block",width:"100%",maxWidth:520,padding:11,borderRadius:8,background:"#0e4236",color:"#fff3d9",border:"1px solid #b99a63",marginTop:6}}>
  {(data.employees||[]).map(e=><option key={e.userId} value={e.userId}>{e.email||"Member "+e.userId.slice(0,8)} ({e.role})</option>)}</select>
  {emp&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10,marginTop:14}}>
   {[[emp.hours+" h","Training time"],[emp.exercisesCompleted,"Exercises"],[emp.assessmentCount,"Scenarios"],[emp.activeDays,"Activity days"]].map(([v,l])=><div key={l} style={{padding:11,border:"1px solid #4d7866",borderRadius:8}}><strong style={{display:"block",color:"#f1d29a",fontSize:19}}>{v}</strong><small>{l}</small></div>)}</div>}
  </div>
  {emp&&<div style={panel}><h3 style={{color:"#f3d99d",fontSize:18,marginBottom:7}}>Eight development domains</h3>
   <p style={{fontSize:12,color:"#c8d6c8"}}>Scores shown below describe the quality of choices in organizational scenarios. They are not IQ, clinical assessments, or proven workplace capabilities. Unmeasured domains remain blank.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10,marginTop:12}}>
    {emp.domains.map(x=><div key={x.key} style={{padding:12,border:"1px solid #527b68",borderRadius:9,background:"#0c392e"}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,fontSize:13}}><strong>{x.label}</strong><strong style={{color:"#f0d292"}}>{x.latestScorePercent===null?"Not measured":x.latestScorePercent+"%"}</strong></div>
     <div style={{height:5,borderRadius:10,background:"#285041",marginTop:9,overflow:"hidden"}}><div style={{height:"100%",width:(x.latestScorePercent??0)+"%",background:"linear-gradient(90deg,#3fc9ac,#e7c27f)",borderRadius:10}} /></div>
     <div style={{color:"#baccc0",fontSize:11,marginTop:6}}>{x.observations?x.observations+" scored scenario"+(x.observations===1?"":"s")+(x.changePoints===null?" · Baseline only":" · "+(x.changePoints>0?"+":"")+x.changePoints+" points from first score"):"Insufficient mapped practice evidence"}</div>
    </div>)}
   </div>
   <p style={{fontSize:12,color:"#e1cb96",marginTop:14}}>Development priorities: {emp.domains.filter(x=>x.observations>=2&&x.latestScorePercent!==null).sort((a,b)=>a.latestScorePercent-b.latestScorePercent).slice(0,2).map(x=>x.label).join(", ")||"More comparable workplace exercises are needed before priorities can be inferred."}</p>
  </div>}
  {emp&&<div style={panel}><h3 style={{color:"#f3d99d",fontSize:18}}>Daily learning records</h3>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:450}}>
    <thead><tr>{["Date (UTC)","Learning minutes","Exercises","Scenarios","Sessions"].map(v=><th key={v} style={{padding:9,textAlign:"left",color:"#dfc385",borderBottom:"1px solid #557262"}}>{v}</th>)}</tr></thead>
    <tbody>{emp.daily.map(day=><tr key={day.date}>{[day.date,Math.round(day.activeSeconds/60),day.exercises,day.assessments,day.sessions].map((v,i)=><td key={i} style={{padding:9,borderBottom:"1px solid #2d5245"}}>{v}</td>)}</tr>)}</tbody></table></div>
   {emp.daily.length===0&&<p style={{fontSize:12}}>No tracked learning activity yet.</p>}
  </div>}
  <p style={{fontSize:11,color:"#c0c9b9",lineHeight:1.7}}>{data.measurementNote} Employee content and private reflections are excluded. Organizational insights should be reviewed as learning indicators, not used as automatic employment decisions.</p>
 </>}
 </div>;
}
