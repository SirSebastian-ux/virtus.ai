import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
const valid=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
async function context(req){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return {error:NextResponse.json({error:"Sign in required"},{status:401})};
 const id=req.method==="GET"?new URL(req.url).searchParams.get("organizationId"):(await req.clone().json().catch(()=>({}))).organizationId;
 if(!valid.test(id||""))return {error:NextResponse.json({error:"Invalid organization"},{status:400})};
 const {data:allowed}=await client.rpc("virtus_organization_access",{p_organization_id:id});
 if(allowed!==true)return {error:NextResponse.json({error:"Access denied"},{status:403})};
 return {client,user,id};
}
export async function GET(req){const c=await context(req);if(c.error)return c.error;
 const {data,error}=await c.client.from("virtus_org_private_exercise_drafts").select("exercise_key,title,responses,updated_at").eq("organization_id",c.id).eq("user_id",c.user.id).order("updated_at",{ascending:false}).limit(100);
 return error?NextResponse.json({error:"Unable to load drafts"},{status:503}):NextResponse.json({drafts:data},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req){const c=await context(req);if(c.error)return c.error;const b=await req.json().catch(()=>({}));
 if(typeof b.exerciseKey!=="string"||b.exerciseKey.length>100||!b.exerciseKey||typeof b.title!=="string"||b.title.length>180||!Array.isArray(b.responses)||b.responses.length>12||b.responses.some(x=>typeof x!=="string"||x.length>2000))return NextResponse.json({error:"Invalid reflection"},{status:400});
 const {error}=await c.client.from("virtus_org_private_exercise_drafts").upsert({organization_id:c.id,user_id:c.user.id,exercise_key:b.exerciseKey,title:b.title,responses:b.responses,updated_at:new Date().toISOString()},{onConflict:"organization_id,user_id,exercise_key"});
 return error?NextResponse.json({error:"Unable to save reflection"},{status:503}):NextResponse.json({saved:true});
}