import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase-server";
export const dynamic="force-dynamic";
export async function GET(request){
 if(process.env.VIRTUS_ORGANIZATIONS_ENABLED!=="true")return NextResponse.json({error:"Disabled"},{status:503});
 const client=await createClient();
 const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
 const url=new URL(request.url);
 const organizationId=url.searchParams.get("organizationId");
 const conversationId=url.searchParams.get("conversationId");
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(organizationId||""))return NextResponse.json({error:"Invalid organization"},{status:400});
 const {data:allowed}=await client.rpc("virtus_organization_access",{p_organization_id:organizationId});
 if(allowed!==true)return NextResponse.json({error:"Access denied"},{status:403});
 const {data:threads,error}=await client.from("virtus_org_private_conversations").select("id,created_at,updated_at").eq("organization_id",organizationId).eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
 if(error)return NextResponse.json({error:"History unavailable"},{status:503});
 if(!conversationId)return NextResponse.json({conversations:threads},{headers:{"Cache-Control":"private, no-store"}});
 if(!threads.some(t=>t.id===conversationId))return NextResponse.json({error:"Conversation not found"},{status:404});
 const {data:messages,error:messagesError}=await client.from("virtus_org_private_messages").select("role,content,created_at").eq("conversation_id",conversationId).eq("user_id",user.id).order("created_at",{ascending:true}).limit(100);
 if(messagesError)return NextResponse.json({error:"History unavailable"},{status:503});
 return NextResponse.json({conversations:threads,messages},{headers:{"Cache-Control":"private, no-store"}});
}
