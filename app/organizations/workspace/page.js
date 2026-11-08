"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export default function OrganizationWorkspace(){
 const [memberships,setMemberships]=useState([]);const [message,setMessage]=useState("Checking organizational access...");
 useEffect(()=>{let active=true;fetch("/api/organizations",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(r.status===401?"Sign in with your organizational email.":d.error||"Access unavailable");return d}).then(d=>{if(active){setMemberships((d.memberships||[]).filter(m=>m.status==="active"&&m.organization?.id));setMessage("Choose your organization.")}}).catch(e=>{if(active)setMessage(e.message)});return()=>{active=false}},[]);
 return <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at top,#0d4939,#041611)",color:"#f4e5c9",padding:"35px 20px"}}><div style={{maxWidth:850,margin:"auto"}}>
 <Link href="/organizations" style={{color:"#e1bc77",fontSize:12}}>Virtus AI / Organizations</Link><h1 style={{font:"normal clamp(29px,4vw,43px) Georgia,serif",color:"#f2d69c"}}>Your organization</h1><p role="status" style={{fontSize:13,color:"#cbd1c5"}}>{message}</p>
 {memberships.map(m=><section key={m.organization_id} style={{border:"1px solid #b89a60",borderRadius:12,padding:18,background:"#0b352b",margin:"12px 0"}}>
 <h2 style={{fontSize:18,margin:"0 0 5px"}}>{m.organization.name}</h2><p style={{fontSize:12,color:"#d5c8a8"}}>{m.role==="owner"?"Organization owner":m.role==="admin"?"HR administrator":"Employee"}</p>
 <div style={{display:"flex",flexWrap:"wrap",gap:10}}><Link style={link} href="/">Full Virtus Mentor</Link><Link style={link} href={"/organizations/learning?organizationId="+encodeURIComponent(m.organization_id)}>My Development</Link><Link style={link} href={"/organizations/assessment?organizationId="+encodeURIComponent(m.organization_id)}>My Assessment</Link>{["owner","admin"].includes(m.role)&&<Link style={link} href="/organizations/dashboard">HR workspace</Link>}</div></section>)}
 {!memberships.length&&<div style={{display:"flex",gap:12,marginTop:20}}><Link style={link} href="/login">Sign in</Link><Link style={link} href="/organizations/dashboard">Register organization</Link></div>}
 </div></main>
}
const link={display:"inline-block",fontSize:12,padding:"10px 13px",border:"1px solid #d1af73",borderRadius:8,color:"#f4dcaa",textDecoration:"none",background:"#164939"};
