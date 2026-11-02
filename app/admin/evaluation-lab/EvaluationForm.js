"use client";
import {useState} from "react";
const dimensions=["Accuracy","Coaching appropriateness","Communication","Practical usefulness","Safety","Context continuity"];
export default function EvaluationForm({cases}){
 const [caseId,setCaseId]=useState(cases[0]?.case_id||"");
 const [scores,setScores]=useState([3,3,3,3,3,3]);
 const [notes,setNotes]=useState("");
 const [excerpt,setExcerpt]=useState("");
 const [safetyFailure,setSafetyFailure]=useState(false);
 const [status,setStatus]=useState("");
 const chosen=cases.find(x=>x.case_id===caseId);
 async function submit(e){e.preventDefault();setStatus("Saving review...");try{const r=await fetch("/api/admin/evaluation-lab",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({caseId,scores,notes,safetyFailure,responseExcerpt:excerpt})});const d=await r.json();if(!r.ok)throw Error(d.error||"Save failed");setStatus("Review saved. Refresh to update dashboard.");}catch(e){setStatus(e.message)}}
 if(!cases.length)return <p>No standardized cases available.</p>;
 return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#967c4b]/40 bg-[#0b2923] p-6"><h2 className="text-xl text-[#eed39b]">Human evaluation review</h2><label className="block text-sm">Standardized test case<select className="mt-2 w-full rounded bg-[#17382f] p-3" value={caseId} onChange={e=>setCaseId(e.target.value)}>{cases.map(c=><option key={c.case_id} value={c.case_id}>{c.case_id} — {c.role}</option>)}</select></label>{chosen&&<div className="rounded-lg bg-[#17382f] p-4"><p>{chosen.scenario}</p><p className="mt-2 text-sm text-[#d6bf8b]">Expected: {chosen.expected_behaviors}</p><p className="mt-2 text-xs">Risk level: {chosen.risk_level}</p></div>}<label className="block text-sm">Virtus response excerpt (optional, avoid personal information)<textarea className="mt-2 w-full rounded bg-[#17382f] p-3" value={excerpt} maxLength={2000} onChange={e=>setExcerpt(e.target.value)} rows={3}/></label><div className="grid gap-3 md:grid-cols-2">{dimensions.map((d,i)=><label key={d} className="block text-sm">{d}<select className="mt-1 w-full rounded bg-[#17382f] p-2" value={scores[i]} onChange={e=>setScores(a=>a.map((v,j)=>i===j?Number(e.target.value):v))}>{[1,2,3,4,5].map(n=><option value={n} key={n}>{n} / 5</option>)}</select></label>)}</div><label className="flex items-center gap-2"><input type="checkbox" checked={safetyFailure} onChange={e=>setSafetyFailure(e.target.checked)}/>Critical safety failure</label><label className="block text-sm">Review notes<textarea className="mt-2 w-full rounded bg-[#17382f] p-3" value={notes} onChange={e=>setNotes(e.target.value)} rows={3}/></label><button className="rounded-lg bg-[#e3c68d] px-5 py-3 font-semibold text-[#08241d]" type="submit">Save evaluation</button><p role="status">{status}</p></form>
}
