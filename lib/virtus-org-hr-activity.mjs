export const EIGHT_DOMAINS=[
 ["awareness","Self-awareness","awareness"],
 ["metacognition","Metacognition","metacognition"],
 ["critical_thinking","Critical thinking","critical_thinking"],
 ["executive_functioning","Executive functioning","executive_functioning"],
 ["emotional_intelligence","Emotional intelligence","emotional_intelligence"],
 ["behavioral_regulation","Behavioral self-regulation","behavioral_regulation"],
 ["communication","Communication","communication"],
 ["adaptive_performance","Adaptive performance","adaptive_performance"],
];
const dayOf=(value)=>typeof value==="string"&&/^\d{4}-\d\d-\d\d/.test(value)?value.slice(0,10):null;
const amount=(n)=>Math.max(0,Number.isFinite(Number(n))?Number(n):0);
export function summarizeOrganizationActivity({members=[],sessions=[],completed=[],scores=[],fromDay=null}){
 const byUser=new Map(members.map(member=>[member.user_id,{userId:member.user_id,role:member.role,
  email:member.email||null,activeSeconds:0,sessionCount:0,exercisesCompleted:0,assessmentCount:0,activeDays:0,
  daily:{},domains:EIGHT_DOMAINS.map(([key,label])=>({key,label,latestScorePercent:null,firstScorePercent:null,changePoints:null,observations:0,measurement:"scenario choice, not demonstrated workplace competency"}))}]));
 function daily(user,date){if(!date||!byUser.has(user))return null;const bucket=byUser.get(user).daily;
   return bucket[date]||(bucket[date]={date,activeSeconds:0,sessions:0,exercises:0,assessments:0});}
 for(const s of sessions){const row=byUser.get(s.user_id),date=dayOf(s.started_at);if(!row||!date||(fromDay&&date<fromDay))continue;
  const seconds=amount(s.active_seconds);row.activeSeconds+=seconds;row.sessionCount++;const day=daily(s.user_id,date);day.activeSeconds+=seconds;day.sessions++;}
 for(const e of completed){const row=byUser.get(e.user_id),date=dayOf(e.completed_at);if(!row||!date||(fromDay&&date<fromDay))continue;
  row.exercisesCompleted++;daily(e.user_id,date).exercises++;}
 const ordered=[...scores].sort((a,b)=>String(a.scored_at||"").localeCompare(String(b.scored_at||"")));
 for(const s of ordered){const row=byUser.get(s.user_id),date=dayOf(s.scored_at);if(!row||!date||(fromDay&&date<fromDay))continue;
  row.assessmentCount++;daily(s.user_id,date).assessments++;
  const match=row.domains.find(d=>d.key===s.domain);if(!match)continue;
  const score=Number(s.score);if(!Number.isInteger(score)||score<1||score>5)continue;
  const percent=Math.round((score/5)*100);if(match.firstScorePercent===null)match.firstScorePercent=percent;
  match.latestScorePercent=percent;match.observations++;match.changePoints=match.observations>1?percent-match.firstScorePercent:null;}
 const employees=[...byUser.values()].map(row=>{row.daily=Object.values(row.daily).sort((a,b)=>b.date.localeCompare(a.date));
  row.activeDays=row.daily.length;row.hours=Number((row.activeSeconds/3600).toFixed(2));
  return row;}).sort((a,b)=>b.activeSeconds-a.activeSeconds||b.exercisesCompleted-a.exercisesCompleted);
 const totals={employeeCount:employees.length,activeLearners:employees.filter(e=>e.activeDays>0).length,
 activeSeconds:employees.reduce((n,e)=>n+e.activeSeconds,0),
 exercisesCompleted:employees.reduce((n,e)=>n+e.exercisesCompleted,0),
 assessmentsCompleted:employees.reduce((n,e)=>n+e.assessmentCount,0),
 trainingSessions:employees.reduce((n,e)=>n+e.sessionCount,0)};
 totals.trainingHours=Number((totals.activeSeconds/3600).toFixed(2));
 return {totals,employees,domains:EIGHT_DOMAINS.map(([key,label])=>({key,label,measuredEmployees:employees.filter(e=>e.domains.find(d=>d.key===key).latestScorePercent!==null).length}))};
}
