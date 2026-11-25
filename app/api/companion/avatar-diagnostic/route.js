export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
export async function GET(request) {
 if(process.env.VERCEL_ENV !== "preview") return new Response(null,{status:404});
 const encoder=new TextEncoder();
 let timer;
 const stream=new ReadableStream({
 start(controller){
 const started=Date.now();
 const emit=(data)=>controller.enqueue(encoder.encode(JSON.stringify(data)+"\n"));
 emit({type:"start",avatarKeyConfigured:!!process.env.TALKING_AVATAR_API_KEY,openAIKeyConfigured:!!process.env.OPENAI_API_KEY,webSocketAvailable:typeof WebSocket==="function"});
 timer=setInterval(()=>{const elapsed=Date.now()-started;emit({type:"heartbeat",elapsed});if(elapsed>=65000){clearInterval(timer);controller.close();}},5000);
 },
 cancel(){clearInterval(timer);}
 });
 request.signal.addEventListener("abort",()=>clearInterval(timer),{once:true});
 return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store","X-Accel-Buffering":"no"}});
}
