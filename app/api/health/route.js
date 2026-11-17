import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";

export async function GET() {
 try {
  const admin=createAdminClient();
  const {error}=await admin.from("profiles").select("id").limit(1);
  if(error)throw new Error("Database unavailable");
  return NextResponse.json({status:"healthy",database:"connected"},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
