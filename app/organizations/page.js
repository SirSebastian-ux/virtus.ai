"use client";
import Link from "next/link";
import { useEffect,useState } from "react";

export default function OrganizationsPage() {
  const [organizations,setOrganizations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [name,setName]=useState("");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [notSignedIn,setNotSignedIn]=useState(false);
  async function load(){
    const res=await fetch("/api/organizations",{cache:"no-store"});
    const data=await res.json().catch(()=>({}));
    if(res.status===401){setNotSignedIn(true);return;}
    if(!res.ok) throw new Error(data.error||"Could not load your organizations.");
    setOrganizations(data.organizations||[]);
    setNotSignedIn(false);
  }
  useEffect(()=>{
    let mounted=true;
    fetch("/api/organizations",{cache:"no-store"})
      .then(async r=>({status:r.status,data:await r.json()}))
      .then(({status,data})=>{
        if(!mounted)return;
        if(status===401){setNotSignedIn(true);return;}
        if(status>=400) throw new Error(data.error||"Could not load organizations.");
        setOrganizations(data.organizations||[]);
      }).catch(e=>{if(mounted)setError(e.message)})
      .finally(()=>{if(mounted)setLoading(false)});
    return()=>{mounted=false};
  },[]);
  async function create(event){
    event.preventDefault();if(busy)return;
    setBusy(true);setError("");setNotice("");
    try {
      const res=await fetch("/api/organizations",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||"Could not create organization.");
      setName("");await load();
      setNotice("Organization created in draft. No payment has been taken and employee seats are not yet activated.");
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  return <main className="min-h-screen bg-[#0a1110] px-5 py-12 text-[#f5f0e5]">
    <div className="mx-auto max-w-6xl">
      <Link href="/" className="text-sm text-[#d3b879] underline underline-offset-4">Back to Virtus AI</Link>
      <header className="mt-9 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d9bc82]">Virtus AI · Organizations</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Develop people. Strengthen leadership.</h1>
        <p className="mt-5 text-base leading-7 text-[#ccd5cc]">
          Give your team access to private AI coaching and structured training.
          Your company manages licensed seats, programmes and billing—not your employees&apos; thoughts.
        </p>
      </header>
      <section className="mt-9 grid gap-4 md:grid-cols-3">
        {[
          ["Confidential coaching","Each person owns their private conversations, personal goals and reflections."],
          ["Shared development","Assign licensed training pathways through a separate EWS curriculum architecture."],
          ["Responsible reporting","Company reporting is limited to authorized operational and privacy-safe participation data."],
        ].map(([title,body])=><div key={title} className="rounded-2xl border border-[#a68954]/35 bg-[#14201e] p-5">
          <h2 className="font-serif text-xl text-[#efd49d]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#c8d2c8]">{body}</p>
        </div>)}
      </section>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[#ba9a60]/45 bg-[#111c1a] p-6">
          <h2 className="font-serif text-2xl text-[#efd49d]">Your organizations</h2>
          {loading&&<p className="mt-4 text-sm">Loading your organizations...</p>}
          {!loading&&notSignedIn&&<p className="mt-4 text-sm text-[#d2dbd2]">Sign in to Virtus AI before creating or managing a company account.</p>}
          {!loading&&!notSignedIn&&!organizations.length&&<p className="mt-4 text-sm text-[#d2dbd2]">No company workspaces yet.</p>}
          <div className="mt-4 space-y-3">{organizations.map(org=>
            <Link key={org.id} href={`/organizations/${org.id}`} className="block rounded-xl border border-[#be9e66]/40 bg-[#1a2d28] p-4 hover:bg-[#254238]">
              <div className="flex items-center justify-between gap-3">
                <strong>{org.name}</strong><span className="text-xs capitalize text-[#eed2a0]">{org.role}</span>
              </div>
              <p className="mt-1 text-xs text-[#bed0c2]">Status: {org.status} · Billing: {org.billing_status}</p>
            </Link>)}</div>
        </div>
        <div className="rounded-2xl border border-[#ba9a60]/45 bg-[#111c1a] p-6">
          <h2 className="font-serif text-2xl text-[#efd49d]">Create a company workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[#ccd5cc]">Create a private draft for your organization. Billing and employee invitations activate only after the company contract is configured.</p>
          <form onSubmit={create} className="mt-5 space-y-4">
            <label className="block text-sm">Organization name
              <input required minLength={3} maxLength={140} value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Registered organization name"
                className="mt-2 w-full rounded-xl border border-[#aa8e57] bg-[#192d29] p-3 text-[#f6f1e9] placeholder:text-[#aebfaf]"/>
            </label>
            <button disabled={busy||notSignedIn||loading} className="rounded-xl bg-[#e6c985] px-5 py-3 font-semibold text-[#11231e] disabled:opacity-40">
              {busy?"Creating...":"Create organization"}
            </button>
          </form>
          {notice&&<p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p>}
          {error&&<p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
        </div>
      </section>
      <p className="mt-9 max-w-3xl text-xs leading-5 text-[#b7c2b8]">Organization pilots do not currently include an active checkout. Pricing, SSO, automated invitations and paid-seat entitlements require verified commercial setup. Personal coaching data never becomes employer-owned.</p>
    </div>
  </main>;
}
