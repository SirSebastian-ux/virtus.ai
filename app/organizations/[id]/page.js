"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useCallback,useEffect,useState} from "react";

export default function OrganizationAdminPage() {
  const params=useParams();
  const orgId=typeof params?.id==="string"?params.id:"";
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [email,setEmail]=useState("");
  const [inviteUrl,setInviteUrl]=useState("");
  const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{
    if(!orgId)return;
    const res=await fetch(`/api/organizations/${encodeURIComponent(orgId)}`,{cache:"no-store"});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.error||"Could not load company administration.");
    setData(body);
  },[orgId]);
  useEffect(()=>{
    let active=true;
    if(!orgId)return;
    fetch(`/api/organizations/${encodeURIComponent(orgId)}`,{cache:"no-store"})
      .then(async r=>({status:r.status,body:await r.json()}))
      .then(({status,body})=>{
        if(status>=400)throw new Error(body.error||"Organization not found.");
        if(active)setData(body);
      }).catch(e=>{if(active)setError(e.message)})
      .finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[orgId]);
  async function invite(event){
    event.preventDefault();if(busy||!data)return;
    setError("");setNotice("");setBusy(true);setInviteUrl("");
    try{
      const res=await fetch(`/api/organizations/${encodeURIComponent(orgId)}/invitations`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(body.error||"Unable to create invitation.");
      setEmail("");setInviteUrl(body.inviteUrl||"");
      setNotice("Invitation link created. No email was sent automatically. Share securely with the intended employee.");
      await load();
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  async function revoke(invitationId){
    if(busy)return;
    setBusy(true);setError("");setNotice("");setInviteUrl("");
    try{
      const res=await fetch(`/api/organizations/${encodeURIComponent(orgId)}/invitations`,{
        method:"DELETE",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({invitationId}),
      });
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(body.error||"Could not revoke invitation.");
      await load();setNotice("Invitation revoked.");
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  const org=data?.organization;
  const ready=org?.status==="active"&&org?.billing_status==="active"&&Number(org.seat_limit)>0&&Date.parse(org.paid_through||"")>Date.now();
  return <main className="min-h-screen bg-[#0a1110] px-5 py-10 text-[#f7f1e4]">
    <div className="mx-auto max-w-6xl">
      <Link className="text-sm text-[#dcc58c] underline underline-offset-4" href="/organizations">All organizations</Link>
      {loading&&<p className="mt-9">Loading organization administration...</p>}
      {error&&<p role="alert" className="mt-5 rounded-xl border border-red-500/40 bg-red-950/25 p-4 text-sm text-red-100">{error}</p>}
      {notice&&<p role="status" className="mt-5 rounded-xl border border-emerald-500/40 p-3 text-sm text-emerald-100">{notice}</p>}
      {org&&<>
        <header className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9ba79]">Virtus AI · Organization administration</p>
          <h1 className="mt-3 font-serif text-4xl">{org.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#c9d5c8]">Your role: {data.myRole}. Company administration is separate from employee coaching, private reflections, development goals and personal projects.</p>
        </header>
        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            ["Licensed seats",org.seat_limit],
            ["Activated members",data.seats?.allocated??0],
            ["Available seats",data.seats?.available??0],
          ].map(([label,value])=><div key={label} className="rounded-2xl border border-[#b89b62]/40 bg-[#17251f] p-5">
            <p className="text-xs text-[#cbd6cb]">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#f1d79e]">{value}</p>
          </div>)}
        </section>
        {!ready&&<section className="mt-5 rounded-2xl border border-[#d5b878]/50 bg-[#28251a] p-5">
          <h2 className="font-semibold text-[#efcf88]">Corporate billing not activated</h2>
          <p className="mt-2 text-sm leading-6 text-[#e5dfcf]">{data.billingNotice}</p>
          <p className="mt-2 text-xs text-[#c8c0aa]">No seats are billed and no employee sponsored access is enabled. Enterprise checkout and invoicing must be verified before activation.</p>
        </section>}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#b89b62]/40 bg-[#14221c] p-5">
            <h2 className="font-serif text-2xl text-[#eed59d]">Seat invitations</h2>
            <p className="mt-2 text-sm text-[#cbd6cb]">Invite employees using their work email. Only the intended, email-verified account can accept. Individual coaching data stays private.</p>
            <form onSubmit={invite} className="mt-4 space-y-3">
              <label className="block text-sm">Employee email
                <input value={email} type="email" required onChange={e=>setEmail(e.target.value)}
                  placeholder="employee@company.com" disabled={!ready}
                  className="mt-2 w-full rounded-xl border border-[#997f50] bg-[#1b3027] p-3 text-white disabled:opacity-40"/>
              </label>
              <button disabled={!ready||busy} className="rounded-xl bg-[#e7c984] px-4 py-3 font-semibold text-[#10231b] disabled:opacity-40">
                Create invitation link
              </button>
            </form>
            {inviteUrl&&<div className="mt-4 rounded-xl border border-[#b89b62]/40 p-3">
              <p className="mb-2 text-xs text-[#e3d5b4]">One-time link (shown once)</p>
              <p className="break-all text-xs text-[#e9e6d9]">{inviteUrl}</p>
              <button className="mt-3 rounded-lg border border-[#e9d5a4] px-3 py-2 text-xs"
                onClick={()=>navigator.clipboard?.writeText(inviteUrl)}>Copy invitation</button>
            </div>}
            <h3 className="mt-7 font-semibold">Recent invitations</h3>
            <div className="mt-3 space-y-2">
              {!data.invitations?.length&&<p className="text-sm text-[#cbd6cb]">No invitations yet.</p>}
              {(data.invitations||[]).map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm">
                <div><p className="break-all">{i.invited_email}</p><p className="mt-1 text-xs text-[#c5cdbf]">{i.status} · expires {new Date(i.expires_at).toLocaleDateString()}</p></div>
                {i.status==="pending"&&<button disabled={busy} type="button" onClick={()=>void revoke(i.id)}
                  className="rounded-md border border-red-400/45 px-3 py-2 text-xs text-red-200 disabled:opacity-40">Revoke</button>}
              </div>)}
            </div>
          </section>
          <section className="rounded-2xl border border-[#b89b62]/40 bg-[#14221c] p-5">
            <h2 className="font-serif text-2xl text-[#eed59d]">EWS Development Academy</h2>
            <p className="mt-2 text-sm leading-6 text-[#cbd6cb]">The curriculum registry is being prepared for the original ten-module leadership architecture and eight-volume conscious-mind collection.</p>
            <div className="mt-4 space-y-3">
              {(data.programmeCatalogue||[]).map(p=><div key={p.id} className="rounded-xl border border-[#a78a5a]/35 p-4">
                <p className="font-medium text-[#f3dfb0]">{p.title}</p>
                <p className="mt-1 text-xs text-[#cbd6cb]">{p.expected_units} units · {p.source_status==="approved"?"Approved":"Original curriculum source required"}</p>
              </div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#cbd6cb]">No exercises are published or available to employers until EWS approves the source content. An organizational subscription does not automatically include a paid EWS Academy programme.</p>
          </section>
        </div>
        <section className="mt-6 rounded-2xl border border-[#b89b62]/40 bg-[#14221c] p-5">
          <h2 className="font-serif text-xl text-[#eed59d]">Privacy-preserving reporting</h2>
          <p className="mt-2 text-sm text-[#ccd6ce]">{data.reporting?.available
            ?`Company-licensed participation: ${data.reporting.seatsActivated} active member seats. Individual coaching data remains inaccessible.`
            :`Aggregated reporting is disabled for cohorts smaller than ${data.reporting?.minimumCohort||10} participating employees.`}</p>
          <p className="mt-3 text-xs text-[#bfcdbf]">No employee psychological ratings, chat transcripts, personal goal titles or document contents are shown to company administrators.</p>
        </section>
      </>}
    </div>
  </main>;
}
