// Private, employee-specific daily workplace scenario data. Assessment choices are
// practice evidence, not direct observation of the employee in the workplace.
export const ASSESSMENT_DOMAINS = Object.freeze({
  awareness: ["Self-awareness", "Behavioral self-regulation"],
  metacognition: ["Metacognition", "Critical thinking"],
  critical_thinking: ["Critical thinking", "Executive functioning"],
  emotional_intelligence: ["Emotional intelligence", "Behavioral self-regulation"],
  communication: ["Communication", "Emotional intelligence"],
  leadership_practice: ["Executive functioning", "Adaptive performance", "Communication"],
});
export function assessmentRef(row) {
  return "assessment:" + row.id;
}
export function assessmentDomainEvidence(rows,skill) {
  return (Array.isArray(rows)?rows:[]).filter(row =>
    ASSESSMENT_DOMAINS[row?.domain]?.includes(skill) &&
    Number.isInteger(row.score) && row.score>=1 && row.score<=5
  ).map(row=>({
    ref: assessmentRef(row),type:"assessment",id:row.id,date:row.scored_at,
    domain:row.domain,score:row.score,maxScore:5,
    exerciseKey:row.exercise_key,organizationId:row.organization_id,
    note:"Scored scenario response; not a validated competency level or observed workplace behavior.",
  }));
}
export function planAssessmentReview(scores,reviews) {
  const all=Array.isArray(scores)?scores:[];
  const previous=new Map();
  for(const review of Array.isArray(reviews)?reviews:[])
    for(const observation of Array.isArray(review?.observations)?review.observations:[])
      for(const source of Array.isArray(observation?.reviewed_assessment_refs)?observation.reviewed_assessment_refs:[])
        if(typeof source?.id==="string")previous.set(source.id,source.date||"");
  return {all,pending:all.filter(s=>!previous.has(s.id)||String(s.scored_at||"")>String(previous.get(s.id)||""))};
}
