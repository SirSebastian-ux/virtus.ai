import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export async function GET(request){
  if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true") return NextResponse.json({allowed:false},{status:503});
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user) return NextResponse.json({allowed:false},{status:401});
  const id=new URL(request.url).searchParams.get("organizationId");
  if(!id||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return NextResponse.json({allowed:false},{status:400});
  const {data:allowed,error:accessError}=await client.rpc("virtus_organization_access",{p_organization_id:id});
  if(accessError) return NextResponse.json({allowed:false},{status:503});
  return NextResponse.json({allowed:allowed===true},{headers:{"Cache-Control":"private, no-store"}});
}
