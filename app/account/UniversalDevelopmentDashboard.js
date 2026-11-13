"use client";
import { useEffect, useMemo, useState } from "react";
import { buildDevelopmentIndex, FRAMEWORK_VERSION, STAGES } from "@/lib/virtus-development-index.mjs";
const colors = ["#e8c27e","#4ed3bb","#9bd6e7","#d7a4e7","#f4a8a1","#9cd4a5","#a6b9f0","#e5c18d"];
export default function UniversalDevelopmentDashboard({plan="free"}) {
  const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [selected,setSelected]=useState("All domains");
  const [reviewStatus,setReviewStatus]=useState("");
  useEffect(()=>{
    let active=true;
    async function load(){
      try {
        const refresh=await fetch("/api/account/coaching-progress",{cache:"no-store"});
        if(active && !refresh.ok) setReviewStatus("New review unavailable; displaying existing evidence.");
        const response=await fetch("/api/account/coaching-history",{cache:"no-store"});
        if(!response.ok) throw new Error("Development history unavailable.");
        const body=await response.json();
        if(active)setReviews(Array.isArray(body.reviews)?body.reviews:[]);
      }catch(e){if(active)setError(e.message);}finally{if(active)setLoading(false);}
    }
    load();
    window.addEventListener("virtus-coaching-review-saved",load);
    return ()=>{active=false;window.removeEventListener("virtus-coaching-review-saved",load);};
  },[]);
  const domains=useMemo(()=>buildDevelopmentIndex(reviews),[reviews]);
  const tier=plan==="premium"?"Mentor":plan==="plus"?"Trainer":plan==="life_coach"?"Life Coach":"Trial / Free";
  const observed=domains.filter(d=>d.provisionalLevel!==null);
  const established=domains.filter(d=>d.level!==null);
  const shown=selected==="All domains"?domains:domains.filter(d=>d.name===selected);
  const maxPoints=Math.max(2,...shown.map(d=>d.history.length));
  const x=i=>55+i*640/(maxPoints-1);
  const y=v=>240-v*37;
  const radar=(v,i,r=110)=>[150+Math.cos(-Math.PI/2+i*Math.PI/4)*r*(v/5),145+Math.sin(-Math.PI/2+i*Math.PI/4)*r*(v/5)];
  return <section className="rounded-2xl border border-[#d8bd85]/40 bg-[#092b25] p-4 text-[#f7ebd5] sm:p-6" aria-label="Eight-domain Virtus evolution dashboard">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#e4bd79]">Virtus evolution intelligence · {FRAMEWORK_VERSION}</p><h3 className="mt-2 font-serif text-3xl">My Development Dashboard</h3><p className="mt-2 text-sm text-[#c6d5ce]">Eight foundational capacities · evidence-based progression · adaptive challenges</p></div>
      <span className="rounded-full border border-[#d8bd85]/50 bg-[#15473a] px-4 py-2 text-sm text-[#e4bd79]">{tier} · {established.length}/8 established</span>
    </div>
    {loading&&<p className="mt-3 text-sm">Evaluating recent development evidence...</p>}
    {error&&<p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
    {reviewStatus&&<p className="mt-3 text-xs text-amber-200">{reviewStatus}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{domains.map((d,i)=><div key={d.name} className="rounded-xl border border-[#c6a56d]/35 bg-[#0e3a30] p-4">
      <h4 className="min-h-[3rem] text-lg font-semibold leading-snug" style={{color:colors[i]}}>{d.name}</h4>
      <p className="mt-2 text-xs text-[#d3e2d9]">{d.level===null?(d.provisionalLevel!==null?"Provisional evidence; second independent review required":"Baseline pending; awaiting sufficient evidence"):"Competency stage "+(Math.floor(d.level)+1)+" of "+STAGES.length}</p>
      <div className="mt-4 h-2 rounded-full bg-[#42675b]"><div className="h-full rounded-full" style={{width:(d.progress||0)+"%",background:colors[i]}}/></div>
      <p className="mt-2 text-xs text-[#c4d3cc]">{d.progress===null?"Milestone progress not established":d.progress+"% toward next stage"} · {d.count} review periods</p>
      {d.delta!==null&&<p className="mt-1 text-xs text-[#e8c27e]">{d.delta>0?"+":""}{d.delta} stages vs baseline</p>}
      <details className="mt-3 text-xs text-[#d3e2d9]"><summary className="cursor-pointer text-[#e8c27e]">Stage justification and evidence</summary><p className="mt-2 leading-relaxed">{d.stageJustification}</p><p className="mt-2">Rubric: {d.criteria.join("; ")}</p>{d.latestEvidence && <p className="mt-2">Latest evaluation: {d.latestEvidence.proficiency === null ? 'Insufficient evidence for stage change' : 'Rubric evidence considered'}; {d.latestEvidence.source_refs.length} attributed source(s).</p>}{d.latestEvidence?.reviewed_exercise_refs?.length>0&&<div className="mt-2"><p>Exercises examined in latest review (not necessarily supporting a competency stage):</p><ul className="mt-1 list-inside list-disc">{d.latestEvidence.reviewed_exercise_refs.slice(0,15).map(ref=><li key={ref.ref}>{ref.title||'Exercise'} · {d.latestEvidence.source_refs.some(s=>s.ref===ref.ref)?'Cited as domain evidence':'Reviewed; not cited for this domain'}</li>)}</ul></div>}{d.attributedEvidence?.source_refs?.length>0?<ul className="mt-2 list-inside list-disc">{d.attributedEvidence.source_refs.map((ref,i)=><li key={i}>{ref.type} · {ref.date ? new Date(ref.date).toLocaleDateString() : "undated"} · {ref.ref}</li>)}</ul>:<p className="mt-2 text-amber-200">Source-level attribution unavailable for this historical review.</p>}</details>
    </div>)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="rounded-xl border border-[#c6a56d]/35 bg-[#06241f] p-4">
        <h4 className="font-serif text-xl text-[#e8c27e]">Competency trajectory</h4><p className="mt-1 text-xs text-[#bdd6cd]">Rubric stages 0–5, not percentages of human potential.</p>
        <div className="mt-3 flex flex-wrap gap-2">{["All domains",...domains.map(d=>d.name)].map(name=><button key={name} type="button" onClick={()=>setSelected(name)} className={"rounded-lg border px-2.5 py-1.5 text-xs "+(selected===name?"border-[#e8c27e] bg-[#e8c27e] text-[#092b25]":"border-[#c6a56d]/50 text-[#e8c27e]")}>{name}</button>)}</div>
        <svg viewBox="0 0 740 280" className="mt-3 w-full" role="img" aria-label="Eight domain competency trajectory">
          {[0,1,2,3,4,5].map(n=><g key={n}><line x1="50" x2="715" y1={y(n)} y2={y(n)} stroke="#456a61" strokeDasharray="4 6"/><text x="13" y={y(n)+4} fontSize="12" fill="#bdd6cd">{n}</text></g>)}
          {shown.map(d=>{const i=domains.indexOf(d);return <g key={d.name}>{d.history.length>1&&<polyline fill="none" stroke={colors[i]} strokeWidth="3" points={d.history.map((p,j)=>x(j)+","+y(p.level)).join(" ")}/>}
          {d.history.map((p,j)=><circle key={j} cx={x(j)} cy={y(p.level)} r="5" fill={colors[i]}><title>{d.name} · stage {p.level.toFixed(1)} · {p.confidence} confidence</title></circle>)}</g>;})}
          {!observed.length&&<text x="360" y="135" textAnchor="middle" fill="#e8c27e">No rubric evidence yet</text>}
          <text x="50" y="270" fontSize="12" fill="#bdd6cd">First review</text><text x="655" y="270" fontSize="12" fill="#bdd6cd">Latest</text>
        </svg>
      </div>
      <div className="rounded-xl border border-[#c6a56d]/35 bg-[#06241f] p-4">
        <h4 className="font-serif text-xl text-[#e8c27e]">Eight-domain profile</h4><p className="mt-1 text-xs text-[#bdd6cd]">Unmeasured domains remain unscored</p>
        <svg viewBox="0 0 300 300" className="mx-auto mt-3 w-full max-w-[350px]" role="img" aria-label="Eight domain radar">
          {[1,2,3,4,5].map(level=><polygon key={level} points={domains.map((d,i)=>radar(level,i).join(",")).join(" ")} fill="none" stroke="#42675b"/>)}
          {domains.map((d,i)=><line key={d.name} x1="150" y1="145" x2={radar(5,i)[0]} y2={radar(5,i)[1]} stroke="#42675b"/>)}
          {established.length===8&&<polygon points={domains.map((d,i)=>radar(d.level,i).join(",")).join(" ")} fill="#e8c27e" fillOpacity=".15" stroke="#e8c27e" strokeWidth="2"/>}
          {domains.map((d,i)=>{const p=radar(5.95,i);return <text key={d.name} x={p[0]} y={p[1]} textAnchor="middle" fontSize="9" fill="#d6e3dc">{d.name.split(" ").map((w,j)=><tspan key={j} x={p[0]} dy={j?10:0}>{w}</tspan>)}</text>;})}
          {established.length<8&&<text x="150" y="148" textAnchor="middle" fill="#e8c27e" fontSize="12">{established.length}/8 stages established</text>}
        </svg>
      </div>
    </div>
    <div className="mt-4 rounded-xl border border-[#c6a56d]/35 bg-[#06241f] p-4"><h4 className="font-serif text-xl text-[#e8c27e]">Next developmental challenges</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{domains.map(d=><div key={d.name} className="rounded-lg border border-[#456a61] p-3"><p className="font-semibold">{d.name}</p><p className="mt-1 text-xs text-[#bdd6cd]">{d.criteria[Math.min(2,Math.floor(d.provisionalLevel??0)/2|0)]}</p><p className="mt-2 text-xs text-[#e8c27e]">{d.evidence||"Begin with a guided reflection or comparable practice task."}</p></div>)}</div>
    </div>
    <p className="mt-4 text-xs leading-5 text-[#c4d3cc]">Development stages are provisional coaching interpretations, not validated psychological scores. A first review never creates a 50% score. At least two independent review windows are required for an established stage. New evidence can support advancement or regression. Practice difficulty and confidence inform assessment; activity volume alone never earns a level. Leadership is a specialist advanced pathway, not a foundational domain. Private coaching evidence is not employer reporting data.</p>
  </section>;
}
