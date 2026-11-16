"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GOLD = "#efd093";
const PANEL = { border:"1px solid rgba(218,178,104,.45)", borderRadius:22, padding:"clamp(24px,5vw,46px)", background:"linear-gradient(140deg,rgba(10,63,48,.97),rgba(4,27,24,.97))", boxShadow:"0 20px 70px rgba(0,0,0,.30),inset 0 1px 0 rgba(249,220,163,.12)" };
const primary = { display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:46,padding:"12px 22px",borderRadius:12,background:"linear-gradient(115deg,#f7dfa3,#cea052 52%,#f4d99d)",border:"1px solid #f5dfac",color:"#17170e",fontWeight:750,textDecoration:"none" };
const secondary = { display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:46,padding:"12px 22px",borderRadius:12,border:"1px solid rgba(227,192,127,.6)",color:"#f5daa7",background:"rgba(11,64,49,.6)",fontWeight:650,textDecoration:"none" };

export default function OrganizationWorkspace() {
  const router = useRouter();
  const [state,setState]=useState({ phase:"loading", memberships:[], message:"" });
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    let timedOut=false;
    const timeout=setTimeout(()=>{timedOut=true;controller.abort();},12000);
    let mounted=true;
    setState({phase:"loading",memberships:[],message:""});
    async function check(){
      try {
        const response=await fetch("/api/organizations",{cache:"no-store",credentials:"same-origin",signal:controller.signal});
        const data=await response.json().catch(()=>({}));
        if (!response.ok) {
          if (response.status===401) {if(mounted)setState({phase:"signed-out",memberships:[],message:""});return;}
          throw new Error(response.status===503 && data.error==="Organizational enrollment is not enabled."?"Organizational services are temporarily unavailable.":data.error||"We couldn't verify organizational access.");
        }
        const memberships=(Array.isArray(data.memberships)?data.memberships:[]).filter(m=>m.status==="active"&&m.organization?.id);
        if (!mounted)return;
        setState({phase:memberships.length>0?"choose":"no-membership",memberships,message:""});
      } catch (error){
        if(!mounted)return;
        setState({phase:"error",memberships:[],message:timedOut?"The connection took too long. Please try again.":error instanceof Error?error.message:"Unable to verify access"});
      }
    }
    check();
    return()=>{mounted=false;clearTimeout(timeout);controller.abort();};
  },[router,attempt]);

  const {phase,memberships,message}=state;
  return <main style={{minHeight:"100dvh",background:"radial-gradient(ellipse at 50% 0%,#145440 0%,#082d26 42%,#041410 100%)",color:"#f5ead3",padding:"clamp(28px,5vw,72px) 20px",boxSizing:"border-box"}}>
    <div style={{maxWidth:920,margin:"0 auto"}}>
      <nav style={{display:"flex",gap:10,alignItems:"center",fontSize:12,color:"#e8c486",marginBottom:48}}><Link href="/organizations" style={{color:"inherit",textDecoration:"none"}}>Virtus AI for Organizations</Link><span aria-hidden="true">/</span><span>Workspace</span></nav>
      <section style={PANEL}>
        <p style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",fontWeight:800,color:"#d7ad68",margin:"0 0 16px"}}>PRIVATE ORGANIZATIONAL ACCESS</p>
        <h1 style={{font:"normal clamp(36px,5vw,56px)/1.18 Georgia,serif",color:GOLD,margin:"0 0 18px"}}>{phase==="choose"?"Choose your organization":phase==="signed-out"?"Your organization's workspace":phase==="no-membership"?"Bring your organization to Virtus AI":phase==="error"?"Workspace unavailable":"Connecting to your organization"}</h1>
        {(phase==="loading"||phase==="redirecting")&&<div role="status" aria-live="polite" style={{padding:"18px 0 6px",color:"#d3ded3",display:"flex",alignItems:"center",gap:14}}><span aria-hidden="true" style={{width:15,height:15,border:"2px solid #9f8352",borderTopColor:"#ffdda0",borderRadius:"50%",display:"inline-block"}}/>{phase==="redirecting"?message:"Checking your secure organizational membership..."}</div>}
        {phase==="signed-out"&&<><p style={{fontSize:16,lineHeight:1.75,color:"#d6ddd2",maxWidth:690}}>Sign in to access your company's private mentorship, learning exercises, or organizational administration.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}><Link href="/login?next=%2Forganizations%2Fworkspace" style={primary}>Sign in to continue</Link><Link href="/organizations" style={secondary}>Explore Virtus AI for Organizations</Link></div></>}
        {phase==="no-membership"&&<><p style={{fontSize:16,lineHeight:1.75,color:"#d6ddd2",maxWidth:720}}>Your account is signed in, but it has no active organizational membership. Register a company or ask your administrator for an invitation.</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}><Link href="/organizations/dashboard" style={primary}>Register an organization</Link><Link href="/organizations/preview" style={secondary}>View sample dashboard</Link></div></>}
        {phase==="error"&&<><p role="alert" style={{fontSize:16,lineHeight:1.75,color:"#f5d5b6",maxWidth:700}}>{message}</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}><button type="button" onClick={()=>setAttempt(v=>v+1)} style={{...primary,cursor:"pointer"}}>Try again</button><Link href="/organizations" style={secondary}>Back to Organizations</Link></div></>}
        {phase==="choose"&&<><p style={{fontSize:15,color:"#d3ddd2",marginBottom:22}}>Select the organization you want to work with.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>{memberships.map(m=><article key={m.organization_id} style={{border:"1px solid #967c4d",borderRadius:14,padding:22,background:"#092e26"}}><h2 style={{font:"normal 25px Georgia,serif",color:GOLD,margin:"0 0 6px"}}>{m.organization.name}</h2><p style={{fontSize:12,color:"#d0c6ad",marginBottom:18}}>{m.role==="owner"?"Organization owner":m.role==="admin"?"HR administrator":"Employee member"}</p><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Link style={primary} href={["owner","admin"].includes(m.role)?"/organizations/dashboard":"/organizations/learning?organizationId="+encodeURIComponent(m.organization_id)}>Open workspace</Link>{["owner","admin"].includes(m.role)&&<Link style={secondary} href={"/organizations/learning?organizationId="+encodeURIComponent(m.organization_id)}>Development</Link>}</div></article>)}</div><div style={{marginTop:22,paddingTop:20,borderTop:"1px solid #987d4d"}}><Link href="/organizations/dashboard?create=1" style={primary}>+ Register another organization</Link><p style={{fontSize:12,color:"#c9d1c5",marginTop:12}}>Each organization has its own registration, employees, subscription and reports.</p></div></>}
      </section>
      <p style={{marginTop:24,fontSize:12,lineHeight:1.7,textAlign:"center",color:"#aabeb2"}}>Employee mentorship conversations and personal reflections remain private.</p>
    </div>
  </main>;
}
