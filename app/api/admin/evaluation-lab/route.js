import {requireAdminApi} from "@/lib/admin-auth";
import {createAdminClient} from "@/lib/supabase-admin";
const dimensions=["Accuracy","Coaching appropriateness","Communication","Practical usefulness","Safety","Context continuity"];
export async function POST(req){
 const {user,response}=await requireAdminApi();if(response)return response;
 try{
 const body=await req.json();
 const {caseId,scores,notes,safetyFailure,responseExcerpt}=body;
 if(typeof caseId!=="string"||!Array.isArray(scores)||scores.length!==6||scores.some(s=>!Number.isInteger(s)||s<1||s>5))return Response.json({error:"Invalid evaluation"},{status:400});
 const admin=createAdminClient();
 const {data:testCase,error:caseError}=await admin.from("virtus_evaluation_cases").select("case_id,role").eq("case_id",caseId).single();
 if(caseError||!testCase)return Response.json({error:"Unknown evaluation case"},{status:400});
 const rows=dimensions.map((dimension,index)=>({case_id:caseId,role:testCase.role,dimension,score:scores[index],notes:String(notes||"").slice(0,1000),safety_failure:Boolean(safetyFailure),response_excerpt:String(responseExcerpt||"").slice(0,2000),evaluator_id:user.id}));
 const {error}=await admin.from("virtus_evaluation_results").insert(rows);
 if(error)throw error;
 return Response.json({success:true,dimensions:rows.length});
 }catch(e){return Response.json({error:"Could not save evaluation"},{status:500});}
}
