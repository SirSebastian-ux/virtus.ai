import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
export async function POST(req) {
  try {
    const {token} = await req.json();
    const [body,mac] = String(token||"").split(".");
    if(!body||!mac||!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:"Invalid transfer"},{status:400});
    const expected=crypto.createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update(body).digest();
    let supplied; try{ supplied=Buffer.from(mac,"base64url"); }catch{return NextResponse.json({error:"Invalid transfer"},{status:400});}
    if(supplied.length!==expected.length || !crypto.timingSafeEqual(supplied,expected)) return NextResponse.json({error:"Invalid transfer signature"},{status:403});
    const {g,c,exp}=JSON.parse(Buffer.from(body,"base64url").toString());
    if(!Number.isFinite(exp)||exp<Date.now()||exp>Date.now()+5*60*1000||!(/^[0-9a-f-]{36}$/i.test(g))||!(/^[0-9a-f-]{36}$/i.test(c))) return NextResponse.json({error:"Transfer link expired or invalid"},{status:410});
    const db=createAdminClient(); const {data}=await db.from("guest_access").select("guest_id,plan_status,trial_ends_at").eq("guest_id",g).maybeSingle();
    if(!data)return NextResponse.json({error:"Guest session not found"},{status:404});
    const response=NextResponse.json({guestId:g,chatId:c},{headers:{"Cache-Control":"no-store"}});
    response.cookies.set("virtus_trial_device_id",g,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:31536000});
    return response;
  }catch{return NextResponse.json({error:"Unable to restore conversation"},{status:503});}
}
