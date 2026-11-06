import {requireAdminApi} from "@/lib/admin-auth";
import {createAdminClient} from "@/lib/supabase-admin";
import {verifyCurriculumReadiness} from "@/lib/virtus-ews-curricula.mjs";

const respond=(data,status=200)=>Response.json(data,{
  status,headers:{"Cache-Control":"private, no-store"},
});
const validUuid=value=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function listMapping(admin) {
  const [collections,units,sources]=await Promise.all([
    admin.from("virtus_ews_curriculum_registry")
      .select("id,library_key,title,collection_kind,expected_units,source_status,version_label")
      .order("title",{ascending:true}),
    admin.from("virtus_ews_curriculum_units")
      .select("id,curriculum_id,unit_number,title,source_id,review_status,reviewed_at")
      .order("unit_number",{ascending:true}).limit(150),
    admin.from("virtus_library_sources")
      .select("id,title,library_key,category,module_number,created_at")
      .order("created_at",{ascending:false}).limit(250),
  ]);
  if(collections.error||units.error||sources.error)
    throw new Error("Could not load EWS knowledge sources.");
  return {collections:collections.data||[],units:units.data||[],sources:sources.data||[]};
}
export async function GET() {
  const {response}=await requireAdminApi();
  if(response)return response;
  try { return respond(await listMapping(createAdminClient())); }
  catch { return respond({error:"Curriculum catalogue unavailable."},503); }
}
export async function POST(request) {
  const {user,response}=await requireAdminApi();
  if(response)return response;
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=="object")return respond({error:"Invalid action."},400);
  const admin=createAdminClient();
  if(body.action==="map_unit") {
    if(!validUuid(body.curriculumId)||!validUuid(body.sourceId))
      return respond({error:"Invalid curriculum or source."},400);
    const number=Number(body.unitNumber),title=String(body.title||"").trim();
    const [registry,source]=await Promise.all([
      admin.from("virtus_ews_curriculum_registry").select("id,expected_units")
        .eq("id",body.curriculumId).maybeSingle(),
      admin.from("virtus_library_sources").select("id")
        .eq("id",body.sourceId).maybeSingle(),
    ]);
    if(registry.error||source.error||!registry.data||!source.data)
      return respond({error:"Original source or curriculum not found."},404);
    if(!Number.isInteger(number)||number<1||number>registry.data.expected_units||
       title.length<3||title.length>180)
      return respond({error:"Invalid unit number or title."},400);
    const {count,error:chunkError}=await admin.from("virtus_library_chunks")
      .select("id",{count:"exact",head:true}).eq("source_id",body.sourceId);
    if(chunkError||!count)return respond({error:"This library source has no extracted teaching material."},409);
    const {data,error}=await admin.from("virtus_ews_curriculum_units").upsert({
      curriculum_id:body.curriculumId,unit_number:number,title,
      source_id:body.sourceId,review_status:"pending",reviewed_at:null,
    },{onConflict:"curriculum_id,unit_number"}).select("id").single();
    if(error)return respond({error:"Could not map this source. Each source can only represent one unit in this curriculum."},409);
    await admin.from("virtus_ews_curriculum_registry")
      .update({source_status:"in_review",version_label:"unverified"})
      .eq("id",body.curriculumId);
    return respond({mapped:true,unitId:data.id});
  }
  if(body.action==="review_unit") {
    if(!validUuid(body.unitId))return respond({error:"Invalid unit."},400);
    const {data,error}=await admin.from("virtus_ews_curriculum_units").update({
      review_status:"reviewed",reviewed_at:new Date().toISOString(),
    }).eq("id",body.unitId).select("id").maybeSingle();
    if(error||!data)return respond({error:"Unit not found or review failed."},404);
    return respond({reviewed:true});
  }
  if(body.action==="approve_collection") {
    if(!validUuid(body.curriculumId)||body.confirmRightsAndAccuracy!==true)
      return respond({error:"Explicit EWS source and rights confirmation required."},400);
    const [registry,units]=await Promise.all([
      admin.from("virtus_ews_curriculum_registry").select("id,expected_units")
        .eq("id",body.curriculumId).maybeSingle(),
      admin.from("virtus_ews_curriculum_units").select("id,unit_number,source_id,review_status")
        .eq("curriculum_id",body.curriculumId).limit(120),
    ]);
    if(registry.error||units.error||!registry.data)
      return respond({error:"Curriculum verification failed."},503);
    const entries=units.data||[],expected=registry.data.expected_units;
    const readiness=verifyCurriculumReadiness(expected,entries);
    if(!readiness.ready)
      return respond({error:"Every original unit must be mapped and reviewed: "+readiness.reason},409);
    const {count,error:chunkError}=await admin.from("virtus_library_chunks")
      .select("id",{count:"exact",head:true}).in("source_id",entries.map(x=>x.source_id));
    if(chunkError||(count||0)<expected)return respond({error:"Insufficient verified source content."},409);
    const version=String(body.versionLabel||"").trim().slice(0,60);
    if(version.length<3)return respond({error:"Provide a source edition or version identifier."},400);
    const {error}=await admin.from("virtus_ews_curriculum_registry").update({
      source_status:"approved",version_label:version,
    }).eq("id",registry.data.id);
    if(error)return respond({error:"Could not approve curriculum."},503);
    return respond({approved:true,version,approvedBy:user.id});
  }
  return respond({error:"Unknown action."},400);
}
