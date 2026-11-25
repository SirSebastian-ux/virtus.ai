"use client";
import {useRef,useState,useEffect} from "react";
import Link from "next/link";
import "../companion.css";
export default function Realistic(){
 const host=useRef(null),active=useRef(null),[status,S]=useState("Ready"),[running,R]=useState(false),[muted,M]=useState(false),[companion,C]=useState("male");
 function stop(message="Ready"){const c=active.current;active.current=null;if(c){clearTimeout(c.timer);for(const p of c.pending.values())p.reject(Error("Session ended"));c.pending.clear();try{c.view?.disconnect()}catch{}try{c.socket?.close()}catch{}c.stream?.getTracks().forEach(t=>t.stop());c.processor?.disconnect();c.source?.disconnect();c.context?.close().catch(()=>{});}R(false);M(false);S(message);}
 useEffect(()=>()=>{if(active.current)stop()},[]);
 async function start(){
 if(active.current)return;const c={pending:new Map(),seq:0,ready:false,connected:false};active.current=c;R(true);S("Connecting...");
 try{
 c.context=new AudioContext({sampleRate:24000});await c.context.resume();
 const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(active.current!==c){stream.getTracks().forEach(t=>t.stop());return;}c.stream=stream;
 const sdk=await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "https://esm.sh/@talkingavatar/sdk@0.1.0/live");
 if(active.current!==c)return;
 const res=await fetch("/api/companion/avatar-ticket?companion="+companion,{method:"POST"});if(!res.ok)throw Error("Preview authorization unavailable");const {url}=await res.json();if(active.current!==c)return;
 const ws=new WebSocket(url);c.socket=ws;const send=e=>{if(ws.readyState===1)ws.send(JSON.stringify(e));};
 c.timer=setTimeout(()=>{if(active.current===c)stop("Five-minute preview ended")},300000);
 ws.onclose=()=>{if(active.current===c)stop("Connection ended")};ws.onerror=()=>{if(active.current===c)stop("Connection failed")};
 ws.onmessage=async event=>{if(active.current!==c)return;try{const e=JSON.parse(event.data);
 if(e.type==="connected"){c.view=new sdk.LiveAvatarView({container:host.current,endpoint:body=>new Promise((resolve,reject)=>{const id=String(++c.seq);c.pending.set(id,{resolve,reject});send({type:"view",id,body});}),onStatus:s=>{if(active.current===c){c.connected=s==="live"||s==="muted";S(s==="muted"?"Video ready — enable sound":s);}},onError:()=>{if(active.current===c)stop("Avatar playback failed")}});await c.view.connect();}
 else if(e.type==="view"){const p=c.pending.get(e.id);if(p){c.pending.delete(e.id);p.resolve(e.body);}}
 else if(e.type==="ready"){c.ready=true;S("Listening");}
 else if(e.type==="error")stop(e.message||"Voice service unavailable");
 else if(["listening","speaking","thinking"].includes(e.type))S(e.type);
 }catch(err){if(active.current===c)stop(err.message||"Avatar error");}};
 c.source=c.context.createMediaStreamSource(stream);c.processor=c.context.createScriptProcessor(2048,1,1);const gain=c.context.createGain();gain.gain.value=0;c.source.connect(c.processor);c.processor.connect(gain);gain.connect(c.context.destination);
 c.processor.onaudioprocess=e=>{if(active.current!==c||!c.ready||!c.connected||ws.readyState!==1||ws.bufferedAmount>65536)return;const x=e.inputBuffer.getChannelData(0),ratio=c.context.sampleRate/24000,n=Math.floor(x.length/ratio),bytes=new Uint8Array(n*2),dv=new DataView(bytes.buffer);for(let i=0;i<n;i++){const j=i*ratio,k=Math.floor(j),f=j-k,v=Math.max(-1,Math.min(1,x[k]*(1-f)+(x[Math.min(k+1,x.length-1)]||0)*f));dv.setInt16(i*2,v<0?v*32768:v*32767,true);}let binary="";for(const b of bytes)binary+=String.fromCharCode(b);send({type:"audio",audio:btoa(binary)});};
 }catch(e){if(active.current===c)stop(e.message||"Unable to connect");}
 }
 return <main className="virtus-interior companion-world"><div className="virtus-interior-shell narrow"><Link href="/companion" className="virtus-outline-button">Back to Companion</Link><h1 className="virtus-interior-title">Virtus AI Companion</h1><p>Realistic avatar · Private development preview · AI, not a human · No customer charges</p><section className="virtus-interior-panel" style={{padding:20,textAlign:"center"}}><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:16}}>{[["male","Sam","ava6"],["female","Sofia","ava9"]].map(([id,name,asset])=><button key={id} disabled={running} aria-pressed={companion===id} onClick={()=>C(id)} style={{border:companion===id?"2px solid #edc477":"1px solid #426457",background:"#0a2420",color:"#fff",borderRadius:12,overflow:"hidden",padding:8,textAlign:"center"}}><img src={"https://images.talking-avatar.dev/stock-avatar-images/"+asset+"-sm.webp"} alt={name+" AI avatar"} style={{width:"100%",aspectRatio:"16 / 9",objectFit:"contain",borderRadius:8}}/><span>{name} · {id==="male"?"Male":"Female"}</span></button>)}</div><div ref={host} style={{width:"100%",maxWidth:832,margin:"0 auto",aspectRatio:"16 / 9",background:running?"#061615":"center / contain no-repeat url(https://images.talking-avatar.dev/stock-avatar-images/"+(companion==="female"?"ava9":"ava6")+".webp)",borderRadius:16,overflow:"hidden"}}/><p role="status">{status}</p><button className="virtus-gold-button" onClick={running?()=>stop():start}>{running?"End conversation":"Start conversation"}</button>{running&&<><button className="virtus-outline-button" onClick={()=>active.current?.view?.unmute()}>Enable sound</button><button className="virtus-outline-button" onClick={()=>{const next=!muted;active.current?.stream?.getAudioTracks().forEach(t=>t.enabled=!next);M(next)}}>{muted?"Unmute microphone":"Mute microphone"}</button></>}<p>Five-minute session limit. Do not share confidential information in this test.</p></section></div></main>;
}
