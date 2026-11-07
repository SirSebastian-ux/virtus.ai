import { randomBytes,createHash,timingSafeEqual } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const respond=(data,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
async function owner(id){
 const client=await createClient();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email_confirmed_at) return null;
 const admin=createAdminClient();
 const {data:org}=await admin.from("virtus_organizations").select("id,owner_user_id,domain_verification_requested,domain_verification_token_hash,verified_domain").eq("id",id).maybeSingle();
 return org?.owner_user_id===user.id?{org,admin}:null;
}
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return respond({error:"Not enabled"},503);
 const body=await request.json().catch(()=>null);
 const id=body?.organizationId;
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))return respond({error:"Invalid organization"},400);
 const ctx=await owner(id);
 if(!ctx)return respond({error:"Owner authentication required"},403);
 const domain=typeof body?.domain==="string"?body.domain.trim().toLowerCase():"";
 if(!/^(?=.{4,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(domain)||domain.endsWith(".local")||domain.endsWith(".test"))return respond({error:"Invalid public corporate domain"},400);
 const token="virtus-verify="+randomBytes(32).toString("hex");
 const hash=createHash("sha256").update(token).digest("hex");
 const {error}=await ctx.admin.from("virtus_organizations").update({domain_verification_requested:domain,domain_verification_token_hash:hash,verified_domain:null,domain_verified_at:null}).eq("id",id).eq("owner_user_id",ctx.org.owner_user_id);
 if(error)return respond({error:"Could not initiate verification"},503);
 return respond({recordType:"TXT",hostname:"_virtus-ai."+domain,value:token,instructions:"Publish this TXT record in your corporate DNS, then verify."});
}
export async function PUT(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return respond({error:"Not enabled"},503);
 const body=await request.json().catch(()=>null);
 const id=body?.organizationId;
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))return respond({error:"Invalid organization"},400);
 const ctx=await owner(id);
 if(!ctx)return respond({error:"Owner authentication required"},403);
 const domain=ctx.org.domain_verification_requested;
 const expected=ctx.org.domain_verification_token_hash;
 if(!domain||!expected)return respond({error:"No verification pending"},409);
 let records;
 try{records=await resolveTxt("_virtus-ai."+domain);}catch{return respond({error:"DNS TXT record not found yet"},409);}
 const valid=records.map(parts=>parts.join("")).some(value=>{
  const actual=createHash("sha256").update(value).digest("hex");
  return timingSafeEqual(Buffer.from(actual),Buffer.from(expected));
 });
 if(!valid)return respond({error:"DNS verification record does not match"},409);
 const {error}=await ctx.admin.from("virtus_organizations").update({verified_domain:domain,domain_verified_at:new Date().toISOString(),domain_verification_token_hash:null}).eq("id",id).eq("domain_verification_requested",domain).eq("domain_verification_token_hash",expected);
 if(error)return respond({error:"Could not save verification"},503);
 return respond({verified:true,domain});
}
