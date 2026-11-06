"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AcceptInvitationContent(){
 const params=useSearchParams();
 const token=params.get("token");
 const [status,setStatus]=useState("");
 const [accepted,setAccepted]=useState(false);
 const [busy,setBusy]=useState(false);
 async function accept(){
  setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/organizations/invitations/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
   const result=await response.json().catch(()=>({}));
   if(response.ok){setAccepted(true);setStatus("Your invitation has been accepted. Your private development space is ready when your organization has an active license.");}
   else setStatus(result.error||"We could not accept this invitation. Confirm you are signed in with the invited corporate email.");
  }catch{setStatus("The connection could not be completed. Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="org-invite-page"><div className="org-invite-shell">
  <header className="org-invite-brand"><Link href="/"><span className="org-invite-emblem">✦</span><span><strong>Virtus AI</strong><small>BY ENHANCED WELLNESS SOLUTIONS</small></span></Link></header>
  <div className="org-invite-card">
   <p className="org-invite-eyebrow">VIRTUS AI · ORGANIZATIONAL MENTORSHIP</p>
   <div className="org-invite-sparkle" aria-hidden="true">✦</div>
   <h1>{accepted?"Welcome to your development space":"Your invitation to grow"}</h1>
   <p className="org-invite-lead">{accepted?"Your organizational membership has been confirmed. Your mentorship journey is personal to you.":"Your organization is offering you a private space to strengthen your thinking, communication, decision-making and leadership practice."}</p>
   <div className="org-invite-benefits"><div><span>01</span><strong>Confidential mentorship</strong><p>Your personal conversations are not accessible to your employer.</p></div><div><span>02</span><strong>Structured development</strong><p>Explore leadership exercises and guided personal reflection.</p></div><div><span>03</span><strong>Your own progress</strong><p>Develop at your pace, with your own private learning history.</p></div></div>
   {!accepted&&<><p className="org-invite-note">To accept, sign in using the same corporate email address that received the invitation.</p><button type="button" className="org-invite-gold" disabled={busy||!token} onClick={accept}>{busy?"Verifying your invitation…":"Accept my invitation"} <span aria-hidden="true">→</span></button></>}
   {accepted&&<Link className="org-invite-gold" href="/organizations/mentor">Open my private mentor <span aria-hidden="true">→</span></Link>}
   {status&&<p role="status" className="org-invite-status">{status}</p>}
   {!token&&!accepted&&<p role="alert" className="org-invite-status">This invitation link is incomplete. Please use the full link from your email.</p>}
   {!accepted&&<p className="org-invite-signin">Already invited but not signed in? <Link href="/login">Sign in to Virtus AI</Link></p>}
  </div>
  <footer className="org-invite-footer"><span>Virtus AI Organizations</span><Link href="/organizations">About organizational mentorship</Link></footer>
 </div>
 <style>{`
 .org-invite-page{min-height:100vh;color:#f7e9ca;background:radial-gradient(ellipse at 50% 0%,#0b4939 0%,#082d26 38%,#041612 100%);padding:24px;font-family:inherit}.org-invite-shell{max-width:960px;margin:auto}.org-invite-brand{border-bottom:1px solid #c2a46c77;padding:15px 0 25px}.org-invite-brand a{display:inline-flex;gap:14px;align-items:center;color:#f5db9d;text-decoration:none}.org-invite-brand strong{font:30px Georgia,serif;letter-spacing:.07em}.org-invite-brand small{display:block;font-size:9px;letter-spacing:.17em;margin-top:6px}.org-invite-emblem{display:grid;place-items:center;width:54px;height:54px;border:1px solid #e4c47e;border-radius:15px;background:linear-gradient(135deg,#0d513e,#041b18);box-shadow:0 0 18px #cda65b66;font-size:25px}.org-invite-card{margin:65px auto;padding:55px;border:1px solid #e1bb70;border-radius:26px;background:linear-gradient(150deg,#0e4838,#072b25 68%,#051c19);box-shadow:inset 0 2px 0 #ffefc044,0 25px 65px #0008,0 0 32px #b58b3333}.org-invite-eyebrow{text-align:center;color:#f0cb83;font-size:12px;letter-spacing:.2em;font-weight:800}.org-invite-sparkle{text-align:center;color:#f4d28e;font-size:28px;margin:22px}.org-invite-card h1{font:normal clamp(38px,5vw,60px)/1.15 Georgia,serif;text-align:center;background:linear-gradient(110deg,#fff7de,#ddb15c,#ffebad);background-clip:text;-webkit-background-clip:text;color:transparent;margin:15px 0 20px}.org-invite-lead{text-align:center;max-width:690px;margin:0 auto 35px;color:#d3dbd0;font-size:18px;line-height:1.7}.org-invite-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.org-invite-benefits>div{border:1px solid #bda06991;border-radius:17px;padding:20px;background:linear-gradient(145deg,#104c3a,#082a24)}.org-invite-benefits span{color:#e9c77f;font-size:13px}.org-invite-benefits strong{display:block;color:#f8e9c9;margin:12px 0}.org-invite-benefits p{color:#c9d5c9;line-height:1.6;font-size:14px;margin:0}.org-invite-note{color:#d4d7c8;text-align:center;line-height:1.6;margin:32px auto 20px}.org-invite-gold{display:flex;align-items:center;justify-content:center;gap:15px;width:fit-content;max-width:100%;margin:20px auto;padding:17px 27px;border:1px solid #ffe6aa;border-radius:13px;color:#191508;background:linear-gradient(120deg,#fce9b5,#cfa052 42%,#ffe7a9 66%,#b5893c);box-shadow:inset 0 2px 1px #fff9e3,0 10px 25px #0007,0 0 18px #dfb55d55;text-decoration:none;font-weight:800;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}.org-invite-gold:hover:not(:disabled){transform:translateY(-3px);filter:brightness(1.08);box-shadow:inset 0 2px 1px #fff9e3,0 12px 35px #0008,0 0 27px #dfb55d99}.org-invite-gold:disabled{opacity:.5;cursor:not-allowed}.org-invite-status{padding:17px;border:1px solid #c5a269;border-radius:13px;background:#123d31;color:#f3d99e;line-height:1.6}.org-invite-signin{text-align:center;color:#ccd1c6}.org-invite-signin a,.org-invite-footer a{color:#f1d18d}.org-invite-footer{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:20px 0 40px;color:#b9cbbd}.org-invite-page a:focus-visible,.org-invite-page button:focus-visible{outline:3px solid #fff0bd;outline-offset:4px}@media(max-width:680px){.org-invite-page{padding:15px}.org-invite-card{margin:35px auto;padding:28px 19px}.org-invite-benefits{grid-template-columns:1fr}.org-invite-brand strong{font-size:24px}.org-invite-lead{font-size:16px}}@media(prefers-reduced-motion:reduce){.org-invite-gold{transition:none}}
 `}</style></main>;
}
export default function AcceptInvitation(){return <Suspense fallback={<main>Loading invitation…</main>}><AcceptInvitationContent/></Suspense>}
