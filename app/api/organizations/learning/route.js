import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
const valid=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Disabled"},{status:503});
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const id=new URL(request.url).searchParams.get("organizationId");
 if(!valid.test(id||""))return NextResponse.json({error:"Invalid organization"},{status:400});
 const {data:allowed}=await client.rpc("virtus_organization_access",{p_organization_id:id});
 if(allowed!==true)return NextResponse.json({error:"Access denied"},{status:403});
 const {data,error}=await client.from("virtus_org_learning_progress").select("curriculum_type,module_number,exercise_number,completed_at").eq("organization_id",id).eq("user_id",user.id).order("completed_at",{ascending:false}).limit(300);
 if(error)return NextResponse.json({error:"Unable to retrieve progress"},{status:503});
 return NextResponse.json({progress:data},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Disabled"},{status:503});
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const body=await request.json().catch(()=>null);
 const {organizationId,curriculumType,moduleNumber,exerciseNumber}=body||{};
 if(!valid.test(organizationId||"")||!["leadership","conscious_mind"].includes(curriculumType)||!Number.isInteger(moduleNumber)||moduleNumber<1||moduleNumber>(curriculumType==="leadership"?10:8)||!Number.isInteger(exerciseNumber)||exerciseNumber<1||exerciseNumber>30)return NextResponse.json({error:"Invalid exercise"},{status:400});
 const {data:allowed}=await client.rpc("virtus_organization_access",{p_organization_id:organizationId});
 if(allowed!==true)return NextResponse.json({error:"Access denied"},{status:403});
 const {error}=await client.from("virtus_org_learning_progress").upsert({organization_id:organizationId,user_id:user.id,curriculum_type:curriculumType,module_number:moduleNumber,exercise_number:exerciseNumber},{onConflict:"organization_id,user_id,curriculum_type,module_number,exercise_number",ignoreDuplicates:true});
 if(error)return NextResponse.json({error:"Unable to save progress"},{status:503});
 return NextResponse.json({saved:true},{headers:{"Cache-Control":"private, no-store"}});
}
