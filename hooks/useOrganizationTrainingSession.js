"use client";
import {useEffect} from "react";
/** Only time spent actively working in organizational learning is logged. */
export function useOrganizationTrainingSession(organizationId){
 useEffect(()=>{
  if(!organizationId||!/^[0-9a-f-]{36}$/i.test(organizationId))return;
  let disposed=false,pageHidden=false,sessionId=null,lastInteraction=Date.now();
  const endpoint="/api/organizations/training/session";
  const post=async(payload)=>{try{const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",keepalive:true,body:JSON.stringify({organizationId,...payload})});return response.ok?await response.json():null;}catch{return null;}};
  const interacted=()=>{lastInteraction=Date.now();};
  const tick=()=>{if(!disposed&&sessionId&&document.visibilityState==="visible"){post({action:"heartbeat",sessionId,active:(Date.now()-lastInteraction)<45000});}};
  const endOnPageHide=()=>{pageHidden=true;if(sessionId){const id=sessionId;sessionId=null;post({action:"end",sessionId:id});}};
  window.addEventListener("pagehide",endOnPageHide);
  ["pointerdown","keydown","scroll","touchstart"].forEach(event=>window.addEventListener(event,interacted,{passive:true}));
  const timer=setInterval(tick,20000);
  post({action:"start"}).then(data=>{if(disposed||pageHidden){if(data?.sessionId)post({action:"end",sessionId:data.sessionId});}else sessionId=data?.sessionId||null;});
  return ()=>{disposed=true;clearInterval(timer);window.removeEventListener("pagehide",endOnPageHide);["pointerdown","keydown","scroll","touchstart"].forEach(event=>window.removeEventListener(event,interacted));if(sessionId)post({action:"end",sessionId});};
 },[organizationId]);
}
