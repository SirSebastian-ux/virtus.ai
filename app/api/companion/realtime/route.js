import {checkRateLimit,rateLimitResponse} from "@/lib/rate-limit";
export async function POST(req){
 if(process.env.VERCEL_ENV!=="preview")return new Response(null,{status:404});
 if(req.headers.get("origin")!==new URL(req.url).origin)return new Response("Invalid origin",{status:403});
 const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const rate=checkRateLimit({key:"companion-realtime:"+ip,limit:2});
 if(!rate.allowed)return rateLimitResponse(rate);
 const global=checkRateLimit({key:"companion-realtime-global",limit:6});
 if(!global.allowed)return rateLimitResponse(global);
 if(!process.env.OPENAI_API_KEY)return new Response("Voice service not configured",{status:503});
 try{
 const sdp=await req.text();
 if(sdp.length>24000||!sdp.startsWith("v=0"))return new Response("Invalid offer",{status:400});
 const form=new FormData();
 form.set("sdp",sdp);
 form.set("session",JSON.stringify({type:"realtime",model:"gpt-realtime-2.1-mini",output_modalities:["audio"],instructions:"You are Virtus AI Companion, an AI conversational companion. Listen carefully and interpret questions in their human context rather than assuming they refer to you. Match the user's language. Engage naturally in thoughtful psychological, philosophical, spiritual and everyday conversation. Use active listening, cognitive reframing, emotional intelligence and metacognition where relevant. Consider thought, awareness, emotion, behavior and communication as distinct interacting processes, without forcing a formula or exercise. Explore ambiguity and competing interpretations; offer nuanced insights when requested, not generic reassurance. Ask one relevant question when useful, not every turn. Avoid repeated AI disclaimers unless relevant; never imply you are human, a clinician, or have feelings. Do not claim access to proprietary workbooks unless retrieved. Do not diagnose, encourage dependence or discourage human relationships. Encourage appropriate immediate human support in emergencies. Do not request confidential information in this preview.",audio:{input:{turn_detection:{type:"server_vad",threshold:0.5,prefix_padding_ms:300,silence_duration_ms:650,create_response:true,interrupt_response:true}},output:{voice:"cedar"}},max_output_tokens:512}));
 const upstream=await fetch("https://api.openai.com/v1/realtime/calls",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(25000)});
 if(!upstream.ok)return new Response("Voice provider unavailable ("+upstream.status+")",{status:502});
 return new Response(await upstream.text(),{headers:{"Content-Type":"application/sdp","Cache-Control":"no-store"}});
 }catch{return new Response("Unable to connect voice service",{status:503});}
}