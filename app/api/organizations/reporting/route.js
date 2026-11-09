import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function GET(request) {
  if (process.env.VIRTUS_ORGANIZATIONS_ENABLED !== "true") return NextResponse.json({error:"Disabled"},{status:503});
  const client = await createClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) return NextResponse.json({error:"Authentication required"},{status:401});
  const id = new URL(request.url).searchParams.get("organizationId");
  if (!id) return NextResponse.json({error:"Missing organization"},{status:400});
  const {data,error} = await client.rpc("virtus_org_aggregate_learning",{p_org:id});
  if (error) return NextResponse.json({error:"Reporting unavailable"},{status:503});
  return NextResponse.json({learning:data,privacyMinimum:5},{headers:{"Cache-Control":"private, no-store"}});
}
