import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function POST(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return NextResponse.json({error:"Not enabled"},{status:503});
  const client = await createClient();
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError || !user?.id || !user.email_confirmed_at) return NextResponse.json({error:"Verified sign-in required"},{status:401});
  const body=await request.json().catch(()=>null);
  const token=typeof body?.token==="string"?body.token:"";
  if(!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({error:"Invalid invitation"},{status:400});
  const hash=createHash("sha256").update(token).digest("hex");
  const {data,error}=await client.rpc("virtus_accept_organization_invitation",{p_token_hash:hash});
  if(error || !data) return NextResponse.json({error:"Invitation expired, invalid, or no seats available"},{status:409});
  return NextResponse.json({organizationId:data,status:"accepted"},{headers:{"Cache-Control":"no-store"}});
}
