import { LiveAvatar } from "@talkingavatar/sdk/server";
import WebSocket from "ws";
export async function startSession({onEvent, onClose}) {
 if (!process.env.TALKING_AVATAR_API_KEY || !process.env.OPENAI_API_KEY) throw new Error("Voice or avatar service not configured");
 const avatar = await LiveAvatar.start({apiKey:process.env.TALKING_AVATAR_API_KEY,avatar:"ava6",sampleRate:24000});
 let ws, closed=false, item=null, clearing=false, epoch=0;
 const close=()=>{if(closed)return;closed=true;clearTimeout(timer);try{ws?.close()}finally{try{avatar.close()}finally{onClose?.()}}};
 const timer=setTimeout(close,300000);
 const send=(event)=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(event))};
 try {
 avatar.on("close",close);
 avatar.on("speechStarted",()=>onEvent?.({type:"speaking"}));
 avatar.on("speechEnded",()=>onEvent?.({type:"listening"}));
 ws=new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1-mini",{headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY}});
 ws.on("error",close);ws.on("close",close);
 ws.on("open",()=>send({type:"session.update",session:{type:"realtime",instructions:"You are Virtus AI Companion, an AI conversational companion. Listen carefully and interpret questions in their human context rather than assuming they refer to you. Match the user's language. Engage naturally in thoughtful psychological, philosophical, spiritual and everyday conversation. Use active listening, cognitive reframing, emotional intelligence and metacognition where relevant. Consider thought, awareness, emotion, behavior and communication as distinct interacting processes, without forcing a formula or exercise. Explore ambiguity and competing interpretations; offer nuanced insights when requested, not generic reassurance. Ask one relevant question when useful, not every turn. Avoid repeated AI disclaimers unless relevant; never imply you are human, a clinician, or have feelings. Do not claim access to proprietary workbooks unless retrieved. Do not diagnose, encourage dependence or discourage human relationships. Encourage appropriate immediate human support in emergencies. Do not request confidential information in this preview.",output_modalities:["audio"],audio:{input:{format:{type:"audio/pcm",rate:24000},turn_detection:{type:"server_vad",threshold:0.5,prefix_padding_ms:300,silence_duration_ms:650,create_response:true,interrupt_response:true}},output:{format:{type:"audio/pcm",rate:24000},voice:"cedar"}},max_output_tokens:512}}));
 ws.on("message",async raw=>{try{
 const e=JSON.parse(raw.toString());
 if(e.type==="session.updated"){onEvent?.({type:"ready"});}
 else if(e.type==="response.output_audio.delta"&&!clearing){item=e.item_id;avatar.pushAudio(e.delta);}
 else if(e.type==="input_audio_buffer.speech_started"){const current=item;const n=++epoch;clearing=true;onEvent?.({type:"listening"});const ms=await avatar.clear();if(current&&n===epoch)send({type:"conversation.item.truncate",item_id:current,content_index:0,audio_end_ms:Math.max(0,Math.floor(ms))});if(n===epoch){item=null;clearing=false;}}
 else if(e.type==="input_audio_buffer.speech_stopped")onEvent?.({type:"thinking"});
 else if(e.type==="error"){onEvent?.({type:"error"});close();}
 }catch{close()}});
 return {handleView:body=>avatar.handleView(body),appendAudio:base64=>send({type:"input_audio_buffer.append",audio:base64}),close};
 }catch(error){close();throw error;}
}
