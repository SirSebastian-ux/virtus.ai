"use client";
import {useEffect,useMemo,useState} from "react";
import {usePathname} from "next/navigation";
import {buildDevelopmentIndex} from "@/lib/virtus-development-index.mjs";

const excluded = /^\/(?:login|auth|forgot-password|update-password|pricing|privacy|terms|legal|support|install|embed)(?:\/|$)/;
export default function VirtusDevelopmentBar(){
 const path=usePathname()||"/";
 const [reviews,setReviews]=useState([]);
 const [authenticated,setAuthenticated]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{
  if(excluded.test(path))return;
  let active=true;
  async function load(){
   try{
    const r=await fetch("/api/account/coaching-history",{credentials:"same-origin",cache:"no-store"});
    if(!active)return;
    if(r.status===401){setAuthenticated(false);return;}
    if(!r.ok)throw Error("History unavailable");
    const data=await r.json();
    if(active){setReviews(Array.isArray(data.reviews)?data.reviews:[]);setAuthenticated(true);setError(false);}
   }catch{if(active)setError(true);}
  }
  load();
  window.addEventListener("virtus-coaching-review-saved",load);
  const onVisible=()=>{if(document.visibilityState==="visible")load();};
  document.addEventListener("visibilitychange",onVisible);
  return ()=>{active=false;window.removeEventListener("virtus-coaching-review-saved",load);document.removeEventListener("visibilitychange",onVisible);};
 },[path]);
 const summary=useMemo(()=>{
  const domains=buildDevelopmentIndex(reviews);
  const established=domains.filter(d=>d.level!==null);
  const scored=established.length;
  // A provisional review is evidence, not an earned score. No activity-based points.
  if(!scored)return {percent:0,stage:1,scored:0,trend:"Awaiting independent evidence",domains};
  const mean=established.reduce((sum,d)=>sum+d.level,0)/scored;
  const percent=Math.round(Math.max(0,Math.min(100,mean/5*100))*10)/10;
  const delta=established.reduce((sum,d)=>sum+(d.delta||0),0);
  return {percent,stage:Math.min(6,Math.floor(percent/20)+1),scored,trend:delta>0?"Evidence of improvement":delta<0?"Evidence of decline":"Development stable",domains};
 },[reviews]);
 if(excluded.test(path)||!authenticated)return null;
 const details=<><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold tracking-wide text-[#e9c681]">VIRTUS DEVELOPMENT</span><button type="button" onClick={()=>setExpanded(false)} aria-label="Close development details" className="text-[#e9c681]">×</button></div><p className="mt-2 text-2xl font-semibold text-white">{summary.percent.toFixed(1)}%</p><p className="text-xs text-[#e4c88f]">Stage {summary.stage} of 6 · {summary.scored}/8 domains established</p><p className="mt-2 text-xs leading-5 text-[#d4ded9]">{summary.trend}. Only assessed evidence changes this indicator; completing an exercise alone does not earn points.</p><p className="mt-2 text-[10px] leading-4 text-[#b8c9c0]">This is a coaching development indicator, not an IQ score or validated psychological measure. Private to your account.</p>{error&&<p className="text-xs text-amber-200">Recent update unavailable.</p>}</>;
 return <aside aria-label="Private Virtus development indicator" className="pointer-events-none fixed z-40 right-2 top-1/2 -translate-y-1/2 max-md:top-auto max-md:bottom-3 max-md:right-3 max-md:translate-y-0">
  <div className="pointer-events-auto hidden md:flex flex-col items-center gap-2 rounded-2xl border border-[#caa76c]/60 bg-[#082b25]/95 px-2 py-3 shadow-2xl">
   <button type="button" aria-label="Open development details" onClick={()=>setExpanded(!expanded)} className="text-[10px] font-semibold text-[#e9c681]">ST {summary.stage}</button>
   <button type="button" aria-label={"Development "+summary.percent.toFixed(1)+" percent; show details"} onClick={()=>setExpanded(!expanded)} className="flex h-36 w-5 items-end overflow-hidden rounded-full border border-[#ad8d52] bg-[#26483c]">
    <span className="block w-full rounded-full bg-gradient-to-t from-[#9b742f] via-[#d6aa53] to-[#f8e4a7] transition-all duration-1000" style={{height:summary.percent+"%"}}/>
   </button>
   <button type="button" onClick={()=>setExpanded(!expanded)} className="text-[10px] font-semibold text-[#f6deb0]">{summary.percent.toFixed(1)}%</button>
  </div>
  <button type="button" onClick={()=>setExpanded(!expanded)} className="pointer-events-auto flex md:hidden items-center gap-2 rounded-full border border-[#caa76c]/70 bg-[#082b25]/95 px-3 py-2 shadow-xl" aria-label="Open development details"><span className="text-xs text-[#f4d795]">ST {summary.stage}</span><span className="h-2 w-20 overflow-hidden rounded-full bg-[#26483c]"><span className="block h-full rounded-full bg-[#d6aa53]" style={{width:summary.percent+"%"}}/></span><span className="text-xs font-semibold text-[#f4d795]">{summary.percent.toFixed(1)}%</span></button>
  {expanded&&<div className="pointer-events-auto absolute right-10 top-0 w-64 rounded-xl border border-[#caa76c]/70 bg-[#092b25] p-4 shadow-2xl max-md:bottom-12 max-md:top-auto max-md:right-0">{details}</div>}
 </aside>;
}

