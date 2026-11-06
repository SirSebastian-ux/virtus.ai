"use client";
import {useEffect,useState} from "react";
function CatalogueCard({collection,units,sources,onChange,busy}){
  const [number,setNumber]=useState(1),[sourceId,setSourceId]=useState("");
  const [title,setTitle]=useState("");
  const [version,setVersion]=useState("");
  const [confirm,setConfirm]=useState(false);
  const rows=units.filter(x=>x.curriculum_id===collection.id);
  async function map(event){
    event.preventDefault();
    await onChange({action:"map_unit",curriculumId:collection.id,
      unitNumber:Number(number),sourceId,title});
    setTitle("");setSourceId("");
  }
  async function approve(){
    await onChange({action:"approve_collection",curriculumId:collection.id,
      versionLabel:version,confirmRightsAndAccuracy:confirm});
  }
  return <section className="rounded-2xl border border-[#bba06c]/45 bg-[#16231e] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-serif text-2xl text-[#f3dca5]">{collection.title}</h2>
        <p className="mt-2 text-xs text-[#cbd6c9]">{rows.length}/{collection.expected_units} mapped · {rows.filter(r=>r.review_status==="reviewed").length} reviewed · {collection.source_status.replaceAll("_"," ")}</p>
      </div>
      <span className="rounded-full border border-[#e2c68a]/55 px-3 py-2 text-xs text-[#ebd4a2]">{collection.version_label}</span>
    </div>
    <div className="mt-5 space-y-2">
      {rows.map(unit=><div key={unit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm">
        <div><strong>Unit {unit.unit_number}: {unit.title}</strong>
          <p className="mt-1 text-xs text-[#bdd0c5]">{unit.review_status} · {sources.find(s=>s.id===unit.source_id)?.title||"Linked source"}</p>
        </div>
        {unit.review_status!=="reviewed"&&<button disabled={busy} onClick={()=>void onChange({action:"review_unit",unitId:unit.id})}
          className="rounded-lg border border-[#d8bb7e] px-3 py-2 text-xs disabled:opacity-40">Confirm reviewed</button>}
      </div>)}
    </div>
    <form onSubmit={map} className="mt-6 grid gap-3 rounded-xl border border-[#bb9d61]/30 bg-[#0e1c18] p-4 md:grid-cols-[100px_1fr]">
      <label className="text-xs">Unit number
        <input type="number" required min={1} max={collection.expected_units} value={number} onChange={e=>setNumber(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#917d53] bg-[#172e26] p-2 text-sm"/>
      </label>
      <label className="text-xs">Original EWS source
        <select required value={sourceId} onChange={e=>setSourceId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#917d53] bg-[#172e26] p-2 text-sm">
          <option value="">Select an ingested source</option>
          {sources.map(s=><option key={s.id} value={s.id}>{s.title} · {s.category||"Uncategorized"}</option>)}
        </select>
      </label>
      <label className="text-xs md:col-span-2">Official unit title
        <input required minLength={3} maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#917d53] bg-[#172e26] p-2 text-sm"/>
      </label>
      <button disabled={busy||!sourceId} className="rounded-lg bg-[#e8c987] px-4 py-3 text-sm font-semibold text-[#13241e] disabled:opacity-40 md:col-span-2">
        Map original source (requires a new review)
      </button>
    </form>
    <div className="mt-5 space-y-3 rounded-xl border border-[#b59e6f]/40 p-4">
      <p className="text-sm font-semibold">Publication verification</p>
      <label className="block text-xs">Edition or source version
        <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="EWS verified edition"
          className="mt-2 w-full rounded-lg border border-[#917d53] bg-[#172e26] p-2 text-sm"/>
      </label>
      <label className="flex items-start gap-2 text-xs leading-5">
        <input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)} className="mt-1"/>
        I have reviewed each original work and confirm EWS authorization, accuracy and rights to use this edition.
      </label>
      <button type="button" disabled={busy||!confirm||rows.length!==collection.expected_units||rows.some(r=>r.review_status!=="reviewed")}
        onClick={()=>void approve()} className="rounded-lg border border-[#e6c886] px-4 py-2 text-sm disabled:opacity-40">Approve curriculum edition</button>
      <p className="text-xs text-[#b9c9bc]">Approval does not automatically assign or sell these materials. Organization licensing remains separate.</p>
    </div>
  </section>;
}
export default function CurriculaClient(){
  const [data,setData]=useState(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  async function load(){
    const r=await fetch("/api/admin/ews-curricula",{cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||"Could not load catalogue.");
    setData(d);
  }
  useEffect(()=>{
    let active=true;
    fetch("/api/admin/ews-curricula",{cache:"no-store"})
      .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unavailable.");return d})
      .then(d=>{if(active)setData(d)})
      .catch(e=>{if(active)setError(e.message)})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[]);
  async function change(body){
    if(busy)return;setBusy(true);setError("");setNotice("");
    try{
      const r=await fetch("/api/admin/ews-curricula",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||"Curriculum update failed.");
      await load();setNotice("Curriculum registry updated.");
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  return <div className="mt-8">
    {loading&&<p>Loading EWS source registry...</p>}
    {notice&&<p role="status" className="mb-4 text-sm text-emerald-200">{notice}</p>}
    {error&&<p role="alert" className="mb-4 text-sm text-red-200">{error}</p>}
    {data&&<div className="grid gap-6 lg:grid-cols-2">
      {(data.collections||[]).map(c=><CatalogueCard key={c.id} collection={c}
        units={data.units||[]} sources={data.sources||[]} busy={busy} onChange={change}/>)}
    </div>}
  </div>;
}
