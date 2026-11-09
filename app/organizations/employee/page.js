"use client";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
const box={padding:22,border:"1px solid #aa9256",borderRadius:15,background:"#08392d",marginTop:16};
const heading={color:"#eccc8b",fontFamily:"Georgia,serif"};
function EmployeeDevelopment(){
 const p=useSearchParams(),org=p.get("organizationId"),email=p.get("email"),[data,setData]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{if(!org||!email){setError("Select an employee from the directory");setLoading(false);return;}let live=true;
 fetch("/api/organizations/employees/profile?organizationId="+encodeURIComponent(org)+"&email="+encodeURIComponent(email),{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw Error(x.error||"Unavailable");return x;}).then(x=>{if(live)setData(x);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[org,email]);
 const fmt=s=>String(s).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
 return <main style={{minHeight:"100vh",background:"linear-gradient(145deg,#031710,#063a2c)",color:"#f5e9cc",padding:"35px 18px"}}><div style={{maxWidth:1060,margin:"auto"}}><a style={{color:"#f2d392"}} href="/organizations/dashboard">Organizations / Employees</a><h1 style={{...heading,fontSize:42}}>Employee development</h1>{loading?<p>Loading...</p>:error?<p role="alert" style={box}>{error}</p>:<>
 <section style={box}><h2 style={heading}>{data.employee.email}</h2><p>{fmt(data.employee.role)} · {fmt(data.employee.status)}</p></section>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:16}}>{[[data.summary.exercisesCompleted,"Exercises completed"],[data.summary.practiceSessions,"Practice sessions"],[Math.round(data.summary.activeSeconds/60)+" min","Tracked active time"],[data.summary.scoredExercises,"Scored exercises"]].map(([n,label])=><div key={label} style={{...box,marginTop:0}}><strong style={{fontSize:30,color:"#f1d397"}}>{n}</strong><p>{label}</p></div>)}</div>
 <section style={box}><h2 style={heading}>Structured development indicators</h2><p>Scores describe completed practice tasks, not verified workplace performance.</p>{data.domains.length?data.domains.map(d=><div key={d.domain} style={{margin:"18px 0"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong>{fmt(d.domain)}</strong><span>{d.percent}% · {d.count} scored</span></div><div style={{height:9,background:"#28584b",borderRadius:9,marginTop:8}}><div style={{height:"100%",width:d.percent+"%",background:"#e8c47f",borderRadius:9}}/></div></div>):<p>No scored practice recorded yet.</p>}</section>
 <section style={box}><h2 style={heading}>Exercise history</h2>{data.exercises.length?data.exercises.map((e,i)=><p key={i}>{fmt(e.curriculum_type)} · Module {e.module_number}, exercise {e.exercise_number} · {new Date(e.completed_at).toLocaleDateString()}</p>):<p>No completed exercises recorded.</p>}</section>
 <section style={box}><h2 style={heading}>Assessment activity</h2>{data.assessments.length?data.assessments.map((e,i)=><p key={i}>{fmt(e.domain)} · {new Date(e.scored_at).toLocaleDateString()}</p>):<p>No scored assessments yet.</p>}</section>
 <section style={box}><h2 style={heading}>Training sessions</h2>{data.sessions.length?data.sessions.map((s,i)=><p key={i}>{new Date(s.started_at).toLocaleDateString()} · {Math.round(s.active_seconds/60)} tracked minutes</p>):<p>No sessions recorded.</p>}</section>
 <p style={{opacity:.7,fontSize:13}}>Private Mentor conversations and reflections are not available in employer reporting.</p></>}</div></main>;
}
export default function Page(){return <Suspense fallback={<p>Loading employee profile...</p>}><EmployeeDevelopment/></Suspense>}
