import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
const getSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const validId = s => /^[0-9a-f-]{36}$/i.test(String(s || ""));
function encode(obj) { return Buffer.from(JSON.stringify(obj)).toString("base64url"); }
function sign(body) { return crypto.createHmac("sha256",getSecret()).update(body).digest("base64url"); }
export async function POST(req) {
  try {
    const { guestId, chatId } = await req.json();
    if (!validId(guestId) || !validId(chatId) || !getSecret()) return NextResponse.json({error:"Invalid guest session"},{status:400});
    const db = createAdminClient();
    const {data} = await db.from("guest_access").select("guest_id").eq("guest_id",guestId).maybeSingle();
    if(!data) return NextResponse.json({error:"Guest session not found"},{status:404});
    const body = encode({g:guestId,c:chatId,exp:Date.now()+5*60*1000});
    return NextResponse.json({url:"https://virtusaiworld.com/continue/ews#"+body+"."+sign(body)},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Unable to create transfer"},{status:503}); }
}
