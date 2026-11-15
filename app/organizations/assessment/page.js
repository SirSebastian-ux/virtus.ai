"use client";
import {Suspense,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import { dailyScenarios } from "@/lib/virtus-org-daily-assessment.mjs";
import {useOrganizationTrainingSession} from "@/hooks/useOrganizationTrainingSession";
function Assessment(){
 const org=useSearchParams().get("organizationId")||"";
 useOrganizationTrainingSession(org);
 const scenarios=dailyScenarios();
 const dayKey=new Date().toISOString().slice(0,10);
 const [answers,setAnswers]=useState({}),[saving,setSaving]=useState(false),[status,setStatus]=useState(""),[finished,setFinished]=useState(false),[alreadyRecorded,setAlreadyRecorded]=useState(false);
 const answered=Object.keys(answers).length;
 async function submit(){
  if(!org||answered!==scenarios.length)return;setSaving(true);setStatus("");
  try{
   let replayed=false;
   for(let i=0;i<scenarios.length;i++){const s=scenarios[i];const r=await fetch("/api/organizations/training/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId:org,domain:s.domain,exerciseKey:"scenario-v2-daily-"+dayKey+"-"+s.domain,choiceIndex:answers[i]})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Unable to save assessment");if(d.alreadyRecorded)replayed=true;}
   setAlreadyRecorded(replayed);setFinished(true);setStatus(replayed?"Assessment already recorded for today. Original scores are preserved; new selections were not saved.":"Today’s practice assessment saved and linked to your private eight-domain evidence history. Your competency stage changes only with corroborating development evidence.");
   fetch("/api/account/coaching-progress",{credentials:"same-origin",cache:"no-store"})
    .then(r=>{if(r.ok)window.dispatchEvent(new Event("virtus-coaching-review-saved"));}).catch(()=>{});
  }catch(e){setStatus(e.message)}finally{setSaving(false)}
 }
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#104736,#051b16 75%)",color:"#f5e6c9",padding:"28px 18px"}}><div style={{maxWidth:820,margin:"auto"}}>
 <Link href={"/organizations/learning?organizationId="+encodeURIComponent(org)} style={{color:"#e6c480",fontSize:12}}>My Development / Practice assessment</Link>
 <h1 style={{font:"normal 34px Georgia,serif",color:"#f1d69c"}}>Daily development assessment</h1>
 <p style={{fontSize:13,lineHeight:1.7,color:"#cbd5c9"}}>Each day brings nine rotating workplace scenarios, spanning eight foundational domains and one leadership pathway to discover strengths and identify skills you can develop with Virtus AI. Your scenario choices become structured training evidence available to authorized HR reporting. Private Mentor conversations and reflections are never included. Scenario ratings are not proof of real-world ability.</p>
 <p style={{fontSize:12,color:"#e6c480"}}>{dayKey} · {answered} of {scenarios.length} completed</p>
 <div id="virtus-development-header-slot" className="mb-3 flex w-full justify-end empty:hidden md:hidden" />
 {scenarios.map((s,i)=><section key={s.domain} style={{border:"1px solid #9d8556",background:"#0b3027",borderRadius:12,padding:17,margin:"12px 0"}}>
 <div style={{fontSize:11,color:"#e4bf7b"}}>{i+1} / {s.name}</div><h2 style={{fontSize:16,lineHeight:1.5}}>{s.prompt}</h2>
 {s.choices.map((choice,j)=><label key={j} style={{display:"block",padding:"9px 10px",margin:"7px 0",border:"1px solid #637b68",borderRadius:8,background:answers[i]===j?"#245c43":"#123a2e",fontSize:13,cursor:"pointer"}}><input type="radio" name={"scenario-"+i} checked={answers[i]===j} onChange={()=>{if(!finished)setAnswers(a=>({...a,[i]:j}))}} disabled={finished} style={{marginRight:10}}/>{choice}</label>)}
 {finished&&!alreadyRecorded&&<p style={{fontSize:12,color:"#e6c480"}}>Practice score: {s.points[answers[i]]}/5. {s.feedback}</p>}
 </section>)}
 <button type="button" disabled={saving||finished||answered!==scenarios.length||!org} onClick={submit} style={{background:"#e3be7a",border:0,borderRadius:8,padding:"12px 20px",fontWeight:750,color:"#15231c"}}>{saving?"Saving...":finished?(alreadyRecorded?"Already recorded":"Baseline saved"):"Save my practice baseline"}</button><p role="status" style={{fontSize:13,color:"#e9cc92"}}>{status}</p>
 </div></main>;
}
export default function AssessmentPage(){return <Suspense fallback={<main>Loading assessment...</main>}><Assessment/></Suspense>}
