"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {Suspense} from "react";
function Mentor(){
 const params=useSearchParams();
 const organizationId=params.get("organizationId")||"";
 const [history,setHistory]=useState([]);
 const [threads,setThreads]=useState([]);
 const [conversationId,setConversationId]=useState(null);
 const [message,setMessage]=useState("");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{setHistory([]);setConversationId(null);setThreads([]);setStatus("");
  if(!organizationId)return;
  fetch("/api/organizations/mentor/history?organizationId="+encodeURIComponent(organizationId),{cache:"no-store"})
   .then(r=>r.ok?r.json():Promise.reject(Error("History unavailable")))
   .then(d=>setThreads(d.conversations||[])).catch(e=>setStatus(e.message));
 },[organizationId]);
 async function openThread(id){
  setBusy(true);setStatus("");
  try{
   const r=await fetch("/api/organizations/mentor/history?organizationId="+encodeURIComponent(organizationId)+"&conversationId="+encodeURIComponent(id),{cache:"no-store"});
   const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load conversation");
   setConversationId(id);setHistory(d.messages||[]);
  }catch(e){setStatus(e.message);}finally{setBusy(false);}
 }
 function newThread(){setConversationId(null);setHistory([]);setStatus("");}
 async function send(e){
  e.preventDefault();if(!message.trim()||busy)return;
  const text=message.trim();setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/organizations/mentor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId,conversationId,message:text})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Mentorship unavailable");
   setHistory(h=>[...h,{role:"user",content:text},{role:"assistant",content:data.reply}]);
   setConversationId(data.conversationId);setMessage("");
   if(!conversationId)setThreads(t=>[{id:data.conversationId,created_at:new Date().toISOString()},...t]);
  }catch(e){setStatus(e.message);}finally{setBusy(false);}
 }
 return <main className="org-mentor" style={{background:"radial-gradient(ellipse at 50% 0%,#0d4c3b 0%,#072c25 40%,#041511 100%)",color:"#f3e7d0",minHeight:"100vh",padding:"5vh 5vw"}}>
  <div style={{maxWidth:1080,margin:"auto"}}>
   <Link href="/organizations/dashboard" style={{color:"#d7b674"}}>Organization workspace</Link>
   <p className="mentor-kicker">VIRTUS AI · CONFIDENTIAL DEVELOPMENT</p><h1 className="mentor-heading">Your private mentorship space</h1>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0"}}><button type="button" onClick={newThread} className="mentor-gold-button">New conversation</button><Link href={"/organizations/learning?organizationId="+encodeURIComponent(organizationId)} className="mentor-secondary-link">Leadership exercises</Link></div>
   <section aria-label="Previous conversations" style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>{threads.map((t,i)=><button key={t.id} disabled={busy} onClick={()=>openThread(t.id)} className={"mentor-thread"+(conversationId===t.id?" is-current":"")}>Conversation {threads.length-i} · {new Date(t.created_at).toLocaleDateString()}</button>)}</section>
   <p style={{color:"#bcb5a9"}}>Your conversation is confidential and is not visible to your employer. Access requires active organizational membership.</p>
   <div aria-live="polite" className="mentor-conversation">
    {!history.length&&<p>What would you like to reflect on today?</p>}
    {history.map((m,i)=><div key={i} className={"mentor-bubble "+(m.role==="user"?"is-user":"is-virtus")}><strong>{m.role==="user"?"You":"Virtus AI"}</strong><p>{m.content}</p></div>)}
   </div>
   <form onSubmit={send}>
    <textarea aria-label="Your private message" value={message} onChange={e=>setMessage(e.target.value)} maxLength={5000} rows={4} className="mentor-textarea"/>
    <button disabled={busy||!message.trim()||!organizationId} className="mentor-gold-button mentor-send">{busy?"Thinking...":"Send"}</button>
   </form>
   {status&&<p role="alert" className="mentor-status">{status}</p>}
  </div>
  <style jsx global>{`\n.org-mentor{font-family:inherit}.org-mentor>div>a{color:#e6c47f;text-decoration:none}.mentor-kicker{letter-spacing:.2em;font-size:12px;font-weight:800;color:#e9c57e;margin:35px 0 12px}.mentor-heading{font:normal clamp(34px,5vw,60px)/1.15 Georgia,serif;letter-spacing:-.03em;background:linear-gradient(115deg,#fff6d9,#dfb45d,#fff0c0);background-clip:text;-webkit-background-clip:text;color:transparent;margin:12px 0 25px}.mentor-gold-button{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;padding:14px 23px;border:1px solid #ffe4a3;border-radius:13px;background:linear-gradient(120deg,#f9e4a8,#d2a250 43%,#ffe6a5 65%,#b68b42);color:#1c160a;font-weight:800;box-shadow:inset 0 2px 1px #fff7d4,0 6px 22px #0006,0 0 17px #d9ad5550;cursor:pointer;transition:transform .2s,box-shadow .2s,filter .2s}.mentor-gold-button:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);box-shadow:inset 0 2px 1px #fff6d4,0 10px 28px #0008,0 0 24px #e5ba7088}.mentor-gold-button:disabled{opacity:.5;cursor:not-allowed}.mentor-secondary-link{display:inline-flex;align-items:center;color:#f3d998;text-decoration:none;padding:12px 18px;border:1px solid #bfa063;border-radius:12px;background:#0b392f}.mentor-secondary-link:hover{background:#12503e}.mentor-thread{padding:12px 16px;border:1px solid #a88952;background:#0b3028;color:#f4e5c5;border-radius:12px;white-space:nowrap;cursor:pointer}.mentor-thread.is-current{background:#245342;border-color:#e8c680}.mentor-conversation{min-height:290px;border:1px solid #d1ad68;border-radius:23px;padding:28px;margin:24px 0;background:linear-gradient(150deg,#0c4033,#06241f);box-shadow:inset 0 1px 0 #ffe7b52b,0 18px 45px #0006}.mentor-bubble{padding:18px 20px;margin-bottom:15px;border:1px solid #ac8b525e;border-radius:15px;white-space:pre-wrap;background:#0a2b25}.mentor-bubble.is-user{background:#174637;margin-left:10%}.mentor-bubble strong{color:#f0d28e}.mentor-bubble p{line-height:1.75;margin-bottom:0}.mentor-textarea{width:100%;box-sizing:border-box;background:#0b322a;color:#f7e8cb;border:1px solid #bc9c61;border-radius:17px;padding:19px;font:inherit;line-height:1.6;resize:vertical;box-shadow:inset 0 2px 8px #0005}.mentor-textarea:focus{outline:2px solid #ebc77e;outline-offset:2px}.mentor-send{margin-top:15px;min-width:125px}.mentor-status{padding:14px 18px;border:1px solid #b99b63;background:#163a31;border-radius:12px;color:#f4d28b}.org-mentor button:focus-visible,.org-mentor a:focus-visible{outline:3px solid #fbe5b1;outline-offset:3px}@media(max-width:600px){.mentor-conversation{padding:17px}.org-mentor{padding:28px 20px!important}.mentor-bubble.is-user{margin-left:0}}@media(prefers-reduced-motion:reduce){.mentor-gold-button{transition:none}}\n`}</style>
 </main>;
}
export default function MentorPage(){return <Suspense fallback={<main>Loading mentor...</main>}><Mentor/></Suspense>;}
