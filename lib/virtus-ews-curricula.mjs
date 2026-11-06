/** EWS course publication is separate from organization subscription billing. */
export function verifyCurriculumReadiness(expectedUnits, units) {
  if(!Number.isInteger(expectedUnits)||expectedUnits<1||expectedUnits>120)
    return {ready:false,reason:"Invalid expected unit count"};
  const list=Array.isArray(units)?units:[];
  if(list.length!==expectedUnits) return {ready:false,reason:"Original units missing"};
  const mapped=new Map();
  const sources=new Set();
  for(const unit of list){
    if(!Number.isInteger(unit?.unit_number)||unit.unit_number<1||unit.unit_number>expectedUnits)
      return {ready:false,reason:"Invalid unit mapping"};
    if(unit.review_status!=="reviewed"||!unit.source_id)
      return {ready:false,reason:"A source has not been reviewed"};
    if(mapped.has(unit.unit_number)||sources.has(unit.source_id))
      return {ready:false,reason:"Duplicate unit or original source"};
    mapped.set(unit.unit_number,unit);sources.add(unit.source_id);
  }
  for(let n=1;n<=expectedUnits;n++)
    if(!mapped.has(n))return {ready:false,reason:"Source sequence is incomplete"};
  return {ready:true,sourceIds:[...sources]};
}
export function availableEwsProgramme(collection) {
  return collection?.source_status==="approved"&&
    typeof collection.version_label==="string" &&
    collection.version_label.length>=3 && collection.version_label!=="unverified";
}
