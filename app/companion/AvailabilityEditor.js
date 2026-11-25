"use client";
import {useState,useEffect} from "react";

const WEEK=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const pad=n=>String(n).padStart(2,"0");
const dateKey=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const dateFromKey=k=>new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,Number(k.slice(8,10)));
const localWeekday=k=>WEEK[(dateFromKey(k).getDay()+6)%7];
const TIMES=Array.from({length:97},(_,i)=>pad(Math.floor(i/4))+":"+pad((i%4)*15));
const timeNumber=s=>{if(s==="24:00")return 1440;if(!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(s))return -1;const [h,m]=s.split(":").map(Number);return h*60+m};
const datesLabel=dates=>dates.map(k=>dateFromKey(k).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})).join(", ");
const labelFor=slot=>slot.mode==="weekly"?WEEK.filter(d=>slot.days.includes(d)).join(", ")+" · every week":datesLabel(slot.dates);
function intersect(a,b){
 if(a.mode==="weekly"&&b.mode==="weekly")return a.days.some(d=>b.days.includes(d));
 if(a.mode==="dates"&&b.mode==="dates")return a.dates.some(d=>b.dates.includes(d));
 const weekly=a.mode==="weekly"?a:b,dated=a.mode==="dates"?a:b;
 return dated.dates.some(d=>weekly.days.includes(localWeekday(d)));
}
function overlaps(a,b){return intersect(a,b)&&timeNumber(a.start)<timeNumber(b.end)&&timeNumber(b.start)<timeNumber(a.end)}
export function AvailabilitySummary({slots=[]}){
 return <div className="cm-schedule-list">{slots.length?slots.map(s=><div className="cm-schedule-summary" key={s.id}><strong>{labelFor(s)}</strong><span>{s.start}–{s.end} · {s.zone}</span></div>):<p className="cm-muted">No availability selected.</p>}</div>;
}
export default function AvailabilityEditor({slots=[],onChange}){
 const [mode,M]=useState("weekly"),[days,D]=useState([]),[dates,DS]=useState([]),[start,S]=useState("08:00"),[end,E]=useState("18:00"),[edit,EDIT]=useState(null),[error,ER]=useState(""),[month,MO]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1)),[browserZone,Z]=useState("");
 useEffect(()=>Z(Intl.DateTimeFormat().resolvedOptions().timeZone||"Local time"),[]);
 const zone=slots[0]?.zone||browserZone||"Local time";
 const today=dateKey(new Date());
 const first=new Date(month.getFullYear(),month.getMonth(),1);
 const offset=(first.getDay()+6)%7;
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i-offset+1);
 const toggle=(list,v)=>list.includes(v)?list.filter(x=>x!==v):[...list,v];
 function reset(){EDIT(null);D([]);DS([]);S("08:00");E("18:00");ER("")}
 function add(){
  ER("");
  if((mode==="weekly"&&!days.length)||(mode==="dates"&&!dates.length)){ER("Select at least one day or date.");return;}
  if(mode==="dates"&&dates.some(d=>d<today)){ER("Choose today or a future date.");return;}
  if(!TIMES.includes(start)||!TIMES.includes(end)||start==="24:00"||timeNumber(start)>=timeNumber(end)){ER("End time must be after the start time. Split overnight availability into two days.");return;}
  const next={id:edit||crypto.randomUUID(),mode,days:mode==="weekly"?WEEK.filter(d=>days.includes(d)):[],dates:mode==="dates"?[...dates].sort():[],start,end,zone};
  if(slots.some(s=>s.id!==edit&&overlaps(s,next))){ER("This time overlaps an existing availability slot. Edit the existing slot or select another time.");return;}
  onChange(edit?slots.map(s=>s.id===edit?next:s):[...slots,next]);reset();
 }
 function editSlot(s){EDIT(s.id);M(s.mode);D([...s.days]);DS([...s.dates]);S(s.start);E(s.end);ER("");if(s.dates.length){const d=dateFromKey(s.dates[0]);MO(new Date(d.getFullYear(),d.getMonth(),1))}}
 function remove(id){onChange(slots.filter(s=>s.id!==id));if(edit===id)reset()}
 return <div className="cm-availability">
 <div className="cm-row"><div><strong>Availability calendar</strong><p className="cm-field-hint">Choose recurring days or individual dates. Time zone detected automatically: {zone}.</p></div><span className="cm-tag">{slots.length} saved {slots.length===1?"slot":"slots"}</span></div>
 <div className="cm-chips" role="group" aria-label="Schedule type"><button type="button" className="cm-chip" aria-pressed={mode==="weekly"} onClick={()=>{M("weekly");ER("")}}>Repeat every week</button><button type="button" className="cm-chip" aria-pressed={mode==="dates"} onClick={()=>{M("dates");ER("")}}>Specific calendar dates</button></div>
 {mode==="weekly"?<div className="cm-stack"><div className="cm-chips">{[["Weekdays",WEEK.slice(0,5)],["Weekends",WEEK.slice(5)],["Every day",WEEK]].map(([name,group])=><button type="button" key={name} className="cm-chip" aria-pressed={group.every(d=>days.includes(d))} onClick={()=>D(group.every(d=>days.includes(d))?days.filter(d=>!group.includes(d)):[...new Set([...days,...group])])}>{name}</button>)}</div><div className="cm-weekdays" role="group" aria-label="Days of the week">{WEEK.map(d=><button type="button" key={d} className="cm-chip" aria-pressed={days.includes(d)} aria-label={d} onClick={()=>D(toggle(days,d))}>{d.slice(0,3)}</button>)}</div></div>:<div className="cm-calendar"><div className="cm-row cm-calendar-head"><button type="button" className="cm-btn" aria-label="Previous month" onClick={()=>MO(new Date(month.getFullYear(),month.getMonth()-1,1))}>‹</button><strong aria-live="polite">{month.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong><button type="button" className="cm-btn" aria-label="Next month" onClick={()=>MO(new Date(month.getFullYear(),month.getMonth()+1,1))}>›</button></div><div className="cm-calendar-grid">{WEEK.map(d=><span key={d} className="cm-calendar-daylabel">{d.slice(0,3)}</span>)}{cells.map((n,i)=>{if(n<1||n>count)return <span key={"blank"+i}/>;const k=dateKey(new Date(month.getFullYear(),month.getMonth(),n));return <button type="button" key={k} className="cm-chip cm-calendar-date" disabled={k<today} aria-pressed={dates.includes(k)} aria-label={datesLabel([k])} onClick={()=>DS(toggle(dates,k))}>{n}</button>})}</div><p className="cm-field-hint">{dates.length?datesLabel([...dates].sort()):"Select one or more dates."}</p>{dates.length>0&&<button type="button" className="cm-btn" onClick={()=>DS([])}>Clear selected dates</button>}</div>}
 <div className="cm-grid cm-time-grid"><label className="cm-field">From<select value={start} onChange={e=>S(e.target.value)}>{TIMES.slice(0,-1).map(t=><option key={t}>{t}</option>)}</select></label><label className="cm-field">Until<select value={end} onChange={e=>E(e.target.value)}>{TIMES.slice(1).map(t=><option key={t}>{t}</option>)}</select></label></div>
 <p className="cm-field-hint">24-hour time · 15-minute intervals · 24:00 means midnight at the end of the selected day.</p>
 {error&&<p role="alert" className="cm-error">{error}</p>}
 <div className="cm-actions"><button type="button" className="cm-btn primary" onClick={add}>{edit?"Save changes":"Add availability"}</button>{edit&&<button type="button" className="cm-btn" onClick={reset}>Cancel edit</button>}</div>
 <div className="cm-schedule-list"><h3>Saved availability</h3>{slots.length?slots.map(s=><div className="cm-schedule-row" key={s.id}><div><strong>{labelFor(s)}</strong><p>{s.start}–{s.end} · {s.zone}</p></div><div className="cm-actions"><button type="button" className="cm-btn" onClick={()=>editSlot(s)}>Edit</button><button type="button" className="cm-btn" onClick={()=>remove(s.id)}>Remove</button></div></div>):<p className="cm-muted">No time slots saved. Select days and times, then add availability.</p>}</div>
 </div>;
}
