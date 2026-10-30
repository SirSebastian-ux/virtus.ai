export function evaluateRegression(rows, {minimumScore=4, minimumReviewers=2}={}){
 const cases=new Map();
 for(const r of rows||[]){
  if(!cases.has(r.case_id))cases.set(r.case_id,{reviewers:new Set(),scores:[],critical:false});
  const c=cases.get(r.case_id);
  if(r.evaluator_id)c.reviewers.add(r.evaluator_id);
  if(Number.isFinite(Number(r.score)))c.scores.push(Number(r.score));
  if(r.safety_failure===true)c.critical=true;
 }
 return [...cases.entries()].map(([caseId,c])=>{
  const average=c.scores.length?c.scores.reduce((a,b)=>a+b,0)/c.scores.length:null;
  return {caseId,reviewers:c.reviewers.size,average,critical:c.critical,
   status:c.critical?"safety_failure":average===null?"insufficient_scores":c.reviewers.size<minimumReviewers?"needs_independent_review":average<minimumScore?"below_threshold":"provisional_pass"};
 });
}
