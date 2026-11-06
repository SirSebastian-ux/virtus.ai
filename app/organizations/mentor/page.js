"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {Suspense} from "react";
function Mentor(){
 const params=useSearchParams();
 const organizationId=params.get("organizationId")||"";
 const [history,setHistory]=useState([]);
 const [conversationId,setConversationId]=useState(null);
 const [message,setMessage]=useState("");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{setHistory([]);setConversationId(null);setStatus("");},[organizationId]);
 async function send(e){
  e.preventDefault();if(!message.trim()||busy)return;
  const text=message.trim();setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/organizations/mentor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId,conversationId,message:text})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Mentorship unavailable");
   setHistory(h=>[...h,{role:"user",content:text},{role:"assistant",content:data.reply}]);
   setConversationId(data.conversationId);setMessage("");
  }catch(e){setStatus(e.message);}finally{setBusy(false);}
 }
 return <main style={{background:"#090909",color:"#f3e7d0",minHeight:"100vh",padding:"5vh 5vw"}}>
  <div style={{maxWidth:780,margin:"auto"}}>
   <Link href="/organizations/dashboard" style={{color:"#d7b674"}}>Organization workspace</Link>
   <h1>Private Virtus AI mentor</h1>
   <p style={{color:"#bcb5a9"}}>Your conversation is confidential and is not visible to your employer. Access requires active organizational membership.</p>
   <div aria-live="polite" style={{minHeight:220,border:"1px solid #59472a",borderRadius:16,padding:20,margin:"20px 0"}}>
    {!history.length&&<p>What would you like to reflect on today?</p>}
    {history.map((m,i)=><div key={i} style={{padding:14,marginBottom:12,background:m.role==="user"?"#292317":"#171715",borderRadius:12,whiteSpace:"pre-wrap"}}><strong>{m.role==="user"?"You":"Virtus AI"}</strong><p>{m.content}</p></div>)}
   </div>
   <form onSubmit={send}>
    <textarea aria-label="Your private message" value={message} onChange={e=>setMessage(e.target.value)} maxLength={5000} rows={4} style={{width:"100%",background:"#1c1b18",color:"#f3e7d0",border:"1px solid #59472a",borderRadius:10,padding:14}}/>
    <button disabled={busy||!message.trim()||!organizationId} style={{marginTop:12,background:"#d7b674",color:"#17120a",border:0,borderRadius:9,padding:"12px 22px",fontWeight:700}}>{busy?"Thinking...":"Send"}</button>
   </form>
   <p role="alert">{status}</p>
  </div>
 </main>;
}
export default function MentorPage(){return <Suspense fallback={<main>Loading mentor...</main>}><Mentor/></Suspense>;}
