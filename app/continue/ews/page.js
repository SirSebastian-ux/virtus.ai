"use client";
import { useEffect, useState } from "react";
export default function ContinueEws() {
 const [status,setStatus]=useState("Restoring your Virtus AI conversation…");
 useEffect(()=>{
  const token=window.location.hash.slice(1);
  history.replaceState(null,"",window.location.pathname);
  if(!token){setStatus("Transfer link missing. Please reopen the chat on the EWS website.");return;}
  fetch("/api/embed/redeem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})})
  .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Transfer failed");return data})
  .then(({guestId,chatId})=>{
   localStorage.setItem("virtus_guest_id",guestId);localStorage.setItem("virtus_chat_id",chatId);
   localStorage.removeItem("virtus_guest_access");
   window.location.replace("/");
  }).catch(e=>setStatus(e.message||"Unable to restore this conversation."));
 },[]);
 return <main style={{minHeight:"100dvh",background:"#061c19",color:"#e8ce93",display:"grid",placeItems:"center",fontFamily:"Georgia,serif",padding:24,textAlign:"center"}}><div><h1>Virtus AI</h1><p>{status}</p><a style={{color:"#f7dfa8"}} href="/">Open Virtus AI World</a></div></main>;
}
