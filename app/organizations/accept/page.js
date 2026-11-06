"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

export default function AcceptOrganizationInvitation() {
  const [token,setToken]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(null);
  useEffect(()=>{
    const current=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const value=current.get("token")||"";
    if(/^[0-9a-f]{64}$/.test(value))setToken(value);
    // Remove the token from the address bar after it has been read.
    window.history.replaceState(null,"",window.location.pathname);
  },[]);
  async function accept(){
    if(busy||!token)return;
    setBusy(true);setError("");
    try{
      const res=await fetch("/api/organizations/accept",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token}),
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||"Unable to accept this invitation.");
      setSuccess(data.organization);
      setToken("");
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }
  return <main className="min-h-screen bg-[#0b1110] px-5 py-14 text-[#f6f0e4]">
    <div className="mx-auto max-w-lg rounded-3xl border border-[#b89b62]/50 bg-[#13221c] p-7">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#dcc48d]">Virtus AI · Organizations</p>
      <h1 className="mt-3 font-serif text-3xl">Your company invitation</h1>
      <p className="mt-4 text-sm leading-6 text-[#ccd8cb]">
        Sign in using the exact email address to which you were invited.
        Your company sponsors access; it cannot read your private coaching conversations, reflections or goals.
      </p>
      {success?<div className="mt-6 space-y-3">
        <p role="status" className="text-emerald-200">Membership accepted for {success.name}.</p>
        <Link href="/" className="inline-block rounded-xl bg-[#e7cc89] px-5 py-3 text-sm font-semibold text-[#10291e]">Open Virtus AI</Link>
      </div>:<>
        {!token&&<p className="mt-5 text-sm text-[#e9cd9b]">No valid invitation token found. Request a new link from your company administrator.</p>}
        {token&&<button disabled={busy} type="button" onClick={accept}
          className="mt-6 rounded-xl bg-[#e7cc89] px-5 py-3 font-semibold text-[#10291e] disabled:opacity-40">{busy?"Verifying...":"Accept invitation"}</button>}
        {error&&<p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
      </>}
      <div className="mt-7"><Link href="/" className="text-sm text-[#e7cc89] underline underline-offset-4">Return to sign in / Virtus AI</Link></div>
    </div>
  </main>;
}
