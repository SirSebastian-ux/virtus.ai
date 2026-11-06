"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {Suspense} from "react";
import Link from "next/link";
import {virtusModules} from "@/data/virtus-modules";
const workbookNames=["Foundations of Conscious Awareness","The Conscious Decision-Maker","Critical Thinking","Metacognitive Awareness","Disciplined Overthinking","Emotional Responsibility","The Psychology of Cadence","Integration and Conscious Living"];
function Learning(){
 const organizationId=useSearchParams().get("organizationId")||"";
 const [progress,setProgress]=useState([]);
 const [selected,setSelected]=useState({type:"leadership",module:1,exercise:1});
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 const [filter,setFilter]=useState("leadership");
 useEffect(()=>{if(!organizationId)return;fetch("/api/organizations/learning?organizationId="+encodeURIComponent(organizationId),{cache:"no-store"}).then(r=>r.json()).then(d=>setProgress(d.progress||[])).catch(()=>setStatus("Unable to load progress"));},[organizationId]);
 const done=(type,module,exercise)=>progress.some(p=>p.curriculum_type===type&&p.module_number===module&&p.exercise_number===exercise);
 async function complete(){
  setBusy(true);setStatus("");
  try{const r=await fetch("/api/organizations/learning",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId,curriculumType:selected.type,moduleNumber:selected.module,exerciseNumber:selected.exercise})});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to save");
  setProgress(p=>[...p,{curriculum_type:selected.type,module_number:selected.module,exercise_number:selected.exercise}]);setStatus("Exercise completion recorded.");
  }catch(e){setStatus(e.message);}finally{setBusy(false);}
 }
 const module=virtusModules[selected.module-1];
 const day=selected.type==="leadership"?module?.days?.[selected.exercise-1]:null;
 return <main style={{minHeight:"100vh",background:"#0a0908",color:"#f1e5ce",padding:"5vh 5vw"}}>
  <div style={{maxWidth:1000,margin:"auto"}}><Link href={"/organizations/mentor?organizationId="+encodeURIComponent(organizationId)} style={{color:"#d7b674"}}>Private mentor</Link>
  <h1>Leadership & Conscious Mind learning</h1>
  <p>Exercises are personal. Your organization receives only aggregate participation reports for sufficiently large groups.</p>
  <div style={{display:"flex",gap:10,margin:"22px 0"}}>
   <button onClick={()=>setFilter("leadership")} style={{padding:12,background:filter==="leadership"?"#d7b674":"#39332a"}}>Leadership Architecture (10)</button>
   <button onClick={()=>setFilter("conscious_mind")} style={{padding:12,background:filter==="conscious_mind"?"#d7b674":"#39332a"}}>Conscious Mind (8)</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
  {(filter==="leadership"?virtusModules.slice(0,10):workbookNames.map((title,i)=>({id:"workbook-"+(i+1),title,days:[]}))).map((m,i)=>{
   const count=progress.filter(p=>p.curriculum_type===filter&&p.module_number===i+1).length;
   return <button key={m.id} onClick={()=>{setSelected({type:filter,module:i+1,exercise:1});setStatus("");}} style={{textAlign:"left",padding:20,border:"1px solid #69502c",borderRadius:12,color:"#f1e5ce",background:selected.type===filter&&selected.module===i+1?"#40301b":"#191714"}}>
    <strong>{i+1}. {m.title}</strong><p>{count} exercise{count===1?"":"s"} completed</p>
   </button>;
  })}
  </div>
  {selected.type===filter&&<section style={{marginTop:24,padding:24,border:"1px solid #69502c",borderRadius:12}}>
   <h2>{filter==="leadership"?module?.title:workbookNames[selected.module-1]}</h2>
   {filter==="leadership"&&module?.days?.length?<>
    <label>Choose a day <select value={selected.exercise} onChange={e=>setSelected(s=>({...s,exercise:Number(e.target.value)}))} style={{padding:10,margin:12}}>{module.days.map((d,i)=><option key={i} value={i+1}>Day {i+1}: {d.title}</option>)}</select></label>
    <h3>{day?.title}</h3><p>{day?.goal}</p>
    <ol>{(day?.exercises||[]).map((e,i)=><li key={i} style={{marginBottom:8}}>{e}</li>)}</ol>
    <p>Reflect privately with your mentor before marking the exercise complete.</p>
    <button disabled={busy||done(filter,selected.module,selected.exercise)} onClick={complete} style={{padding:"12px 18px",background:"#d7b674",borderRadius:8}}>{done(filter,selected.module,selected.exercise)?"Completed":"Mark exercise completed"}</button>
   </>:<p>The complete workbook exercise text has not yet been imported. Progress recording is withheld until the verified source material is available.</p>}
  </section>}
  <p role="status">{status}</p></div>
 </main>;
}
export default function LearningPage(){return <Suspense fallback={<main>Loading curriculum...</main>}><Learning/></Suspense>;}
