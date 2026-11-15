import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Unavailable"},{status:503});
 const body=await request.json().catch(()=>null);
 const token=body?.token;
 if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Invalid invitation"},{status:400});
 const hash=createHash("sha256").update(token).digest("hex");
 const db=createAdminClient();
 const {data,error}=await db.from("virtus_organization_invitations").select("invited_email,expires_at,accepted_at,revoked_at").eq("token_hash",hash).maybeSingle();
 if(error||!data||data.revoked_at||data.accepted_at||new Date(data.expires_at).getTime()<=Date.now())return NextResponse.json({error:"Invitation unavailable or expired. Ask your HR administrator for a new invitation."},{status:410});
 return NextResponse.json({email:data.invited_email},{headers:{"Cache-Control":"private, no-store"}});
}
