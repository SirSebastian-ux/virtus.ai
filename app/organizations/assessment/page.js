"use client";
import {Suspense,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
const scenarios=[
 {domain:"communication",name:"Communication",prompt:"A colleague misunderstands your instructions. What is the most constructive first response?",choices:["Repeat the same instructions more firmly.","Ask what they understood, clarify the intended outcome, and invite questions.","Assume they were not paying attention."],points:[2,5,1],feedback:"Clarifying shared understanding demonstrates listening and communication practice."},
 {domain:"metacognition",name:"Metacognition",prompt:"You feel certain your first interpretation of a problem is correct. What next?",choices:["Act immediately.","Ask someone to confirm you are right.","Identify your assumptions and test an alternative explanation."],points:[1,2,5],feedback:"Checking your own reasoning demonstrates metacognitive practice."},
 {domain:"emotional_intelligence",name:"Emotional intelligence",prompt:"You receive unexpected critical feedback in a meeting. What is your next step?",choices:["Notice your reaction, clarify the feedback, and respond after considering it.","Defend your position immediately.","Withdraw from the conversation."],points:[5,1,2],feedback:"Noticing reactions while staying engaged supports deliberate communication."},
 {domain:"critical_thinking",name:"Decision-making",prompt:"Two solutions appear equally attractive, but evidence is incomplete. How do you proceed?",choices:["Choose whichever feels familiar.","Compare assumptions, consequences and missing evidence before deciding.","Delay indefinitely."],points:[2,5,1],feedback:"Explicit comparison of evidence and consequences supports decision quality."},
 {domain:"leadership_practice",name:"Leadership",prompt:"A delegated task is late. What do you do first?",choices:["Take over the task without discussion.","Publicly blame the colleague.","Discuss obstacles, clarify accountability and agree on a realistic next step."],points:[2,1,5],feedback:"Combining accountability with obstacle identification supports leadership practice."},
 {domain:"awareness",name:"Mind discipline",prompt:"You notice that frustration is affecting how you speak. What do you do?",choices:["Name the thought and emotion, pause, and choose a deliberate response.","Continue speaking until the frustration passes.","Suppress the feeling and avoid the issue."],points:[5,1,2],feedback:"Recognizing the thought-emotion-response sequence supports deliberate action."}
];
const dailyVariants={
 communication:[["A teammate leaves a meeting with a different understanding of the deadline. What do you do?",["Send a sharper reminder.","Ask them to restate the agreed deadline and confirm next actions.","Wait for the missed deadline."],[2,5,1]],["A colleague interrupts you repeatedly during a briefing. What response builds understanding?",["Pause, acknowledge the concern, and establish a turn-taking agreement.","Interrupt them back.","Stop sharing information."],[5,1,2]]],
 metacognition:[["Your first explanation of a setback feels obvious. How do you test it?",["Write down the assumption and seek contradictory evidence.","Treat your first thought as fact.","Ask only people who agree with you."],[5,1,2]],["You discover a decision was based on an incomplete assumption. What next?",["Defend the original decision.","Ignore the new information.","Re-examine the assumption and update your reasoning."],[1,2,5]]],
 emotional_intelligence:[["A tense message from a colleague triggers irritation. What do you do first?",["Reply immediately in the same tone.","Notice your reaction and clarify their intent before responding.","Avoid all future discussion."],[1,5,2]],["A team member is visibly upset after feedback. What is a constructive response?",["Invite their perspective and listen before planning next steps.","Dismiss the reaction.","Change the subject permanently."],[5,1,2]]],
 critical_thinking:[["A proposal promises quick results but provides little evidence. What is your next step?",["Accept because it sounds confident.","Reject without examination.","Ask for evidence, alternatives, and potential trade-offs."],[1,2,5]],["Two reports disagree about a problem. How do you decide?",["Compare methods, assumptions, and missing information.","Choose the report you prefer.","Ignore both."],[5,1,2]]],
 leadership_practice:[["A capable colleague misses a milestone. What is your first leadership move?",["Clarify obstacles, ownership, and a recovery plan together.","Assign blame in the team chat.","Take every task away without discussion."],[5,1,2]],["A team disagrees on priorities under pressure. How do you lead?",["Demand immediate compliance without context.","Clarify the shared outcome, trade-offs, and next decision.","Postpone all decisions indefinitely."],[1,5,2]]],
 awareness:[["You notice your tone becoming sharp in a difficult discussion. What next?",["Identify the thought behind the reaction and choose your next words.","Continue until the other person yields.","Leave without explanation."],[5,1,2]],["A setback causes you to assume a colleague intended harm. What is your next step?",["Treat the assumption as proven.","Separate what happened from your interpretation before speaking.","Confront them publicly."],[1,5,2]]]
};
function dailyIndex(){return Math.floor(Date.now()/86400000)}
const settings=["during a busy Monday morning","while preparing for an important meeting","during a remote team discussion","with a tight delivery deadline","after receiving unexpected news","during a high-pressure project review","while coordinating across departments"];
function dailyScenarios(){const day=dailyIndex();return scenarios.map((s,i)=>{const v=dailyVariants[s.domain][(Math.floor(day/7)+i)%dailyVariants[s.domain].length];const context=settings[(day+i)%settings.length];const shift=(day+i)%3;const choices=v[1].map((_,j)=>v[1][(j+shift)%3]);const points=v[2].map((_,j)=>v[2][(j+shift)%3]);return {...s,prompt:v[0]+" Consider the situation "+context+".",choices,points}})}
function Assessment(){
 const org=useSearchParams().get("organizationId")||"";
 const scenarios=dailyScenarios();
 const dayKey=new Date().toISOString().slice(0,10);
 const [answers,setAnswers]=useState({}),[saving,setSaving]=useState(false),[status,setStatus]=useState(""),[finished,setFinished]=useState(false);
 const answered=Object.keys(answers).length;
 async function submit(){
  if(!org||answered!==scenarios.length)return;setSaving(true);setStatus("");
  try{
   for(let i=0;i<scenarios.length;i++){const s=scenarios[i];const r=await fetch("/api/organizations/training/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId:org,domain:s.domain,exerciseKey:"scenario-daily-"+dayKey+"-"+s.domain,score:s.points[answers[i]]})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Unable to save assessment");}
   setFinished(true);setStatus("Today’s practice assessment saved. Return tomorrow for six new scenarios.");
  }catch(e){setStatus(e.message)}finally{setSaving(false)}
 }
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#104736,#051b16 75%)",color:"#f5e6c9",padding:"28px 18px"}}><div style={{maxWidth:820,margin:"auto"}}>
 <Link href={"/organizations/learning?organizationId="+encodeURIComponent(org)} style={{color:"#e6c480",fontSize:12}}>My Development / Practice assessment</Link>
 <h1 style={{font:"normal 34px Georgia,serif",color:"#f1d69c"}}>Daily development assessment</h1>
 <p style={{fontSize:13,lineHeight:1.7,color:"#cbd5c9"}}>Each day brings six rotating workplace scenarios to discover strengths and identify skills you can develop with Virtus AI. Your personal reflections support your development journey.</p>
 <p style={{fontSize:12,color:"#e6c480"}}>{dayKey} · {answered} of {scenarios.length} completed</p>
 {scenarios.map((s,i)=><section key={s.domain} style={{border:"1px solid #9d8556",background:"#0b3027",borderRadius:12,padding:17,margin:"12px 0"}}>
 <div style={{fontSize:11,color:"#e4bf7b"}}>{i+1} / {s.name}</div><h2 style={{fontSize:16,lineHeight:1.5}}>{s.prompt}</h2>
 {s.choices.map((choice,j)=><label key={j} style={{display:"block",padding:"9px 10px",margin:"7px 0",border:"1px solid #637b68",borderRadius:8,background:answers[i]===j?"#245c43":"#123a2e",fontSize:13,cursor:"pointer"}}><input type="radio" name={"scenario-"+i} checked={answers[i]===j} onChange={()=>{if(!finished)setAnswers(a=>({...a,[i]:j}))}} disabled={finished} style={{marginRight:10}}/>{choice}</label>)}
 {finished&&<p style={{fontSize:12,color:"#e6c480"}}>Practice score: {s.points[answers[i]]}/5. {s.feedback}</p>}
 </section>)}
 <button type="button" disabled={saving||finished||answered!==scenarios.length||!org} onClick={submit} style={{background:"#e3be7a",border:0,borderRadius:8,padding:"12px 20px",fontWeight:750,color:"#15231c"}}>{saving?"Saving...":finished?"Baseline saved":"Save my practice baseline"}</button><p role="status" style={{fontSize:13,color:"#e9cc92"}}>{status}</p>
 </div></main>;
}
export default function AssessmentPage(){return <Suspense fallback={<main>Loading assessment...</main>}><Assessment/></Suspense>}
