"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function AcceptInvitationContent() {
  const params=useSearchParams();
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  async function accept() {
    setBusy(true);setStatus("");
    try {
      const response=await fetch("/api/organizations/invitations/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:params.get("token")})});
      const result=await response.json();
      setStatus(response.ok?"Invitation accepted. Your organization membership is active.":result.error||"Unable to accept invitation.");
    } catch {setStatus("Connection failed. Please retry.");}
    finally {setBusy(false);}
  }
  return <main style={{minHeight:"100vh",background:"#090a09",color:"#f6eedb",padding:"10vh 6vw",fontFamily:"inherit"}}>
    <div style={{maxWidth:600,margin:"auto",border:"1px solid #4b3d25",borderRadius:20,padding:36}}>
      <Link href="/" style={{color:"#d9b777"}}>Virtus AI</Link>
      <h1 style={{fontSize:36,marginTop:30}}>Join your organization</h1>
      <p style={{color:"#bdb9af",lineHeight:1.7}}>Sign in with the verified corporate email address that received your invitation. Then accept to activate your private mentorship membership.</p>
      <p style={{color:"#bdb9af"}}>Your private coaching conversations are not shared with your employer.</p>
      <button disabled={busy||!params.get("token")} onClick={accept} style={{background:"#d9b777",color:"#15110a",padding:"14px 24px",borderRadius:10,cursor:"pointer",fontWeight:700}}>{busy?"Processing...":"Accept invitation"}</button>
      <p role="status" style={{marginTop:20}}>{status}</p>
      <p><Link href="/login" style={{color:"#d9b777"}}>Sign in</Link></p>
    </div>
  </main>;
}

export default function AcceptInvitation() { return <Suspense fallback={<main>Loading invitation...</main>}><AcceptInvitationContent/></Suspense>; }
