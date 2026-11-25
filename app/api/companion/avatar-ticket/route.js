import {createHmac,randomBytes} from "node:crypto";
import {checkRateLimit,rateLimitResponse} from "@/lib/rate-limit";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req){
 if(process.env.VERCEL_ENV!=="preview")return new Response(null,{status:404});
 if(req.headers.get("origin")!==new URL(req.url).origin)return new Response(null,{status:403});
 const rate=checkRateLimit({key:"avatar-ticket-global",limit:4});
 if(!rate.allowed)return rateLimitResponse(rate);
 const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const userRate=checkRateLimit({key:"avatar-ticket:"+ip,limit:2});
 if(!userRate.allowed)return rateLimitResponse(userRate);
 const secret=process.env.COMPANION_BRIDGE_SECRET;
 if(!secret||secret.length<32)return Response.json({error:"Avatar service not configured"},{status:503});
 const companion=new URL(req.url).searchParams.get("companion")||"male";
 if(!["male","female"].includes(companion))return new Response(null,{status:400});
 const nonce=randomBytes(16).toString("hex"),expiry=Date.now()+30000;
 const sig=createHmac("sha256",secret).update(nonce+"."+expiry+(companion==="female"?".female":"")).digest("hex");
 const url=new URL("wss://companion-avatar-preview.up.railway.app/session");
 url.searchParams.set("companion",companion);
 url.searchParams.set("ticket",nonce+"."+expiry+"."+sig);
 return Response.json({url:url.toString()},{headers:{"Cache-Control":"no-store"}});
}
