import test from "node:test";
import assert from "node:assert/strict";
import { validateCognitivePattern, validatePatternDecision, confirmedPatternContext } from "../lib/virtus-cognitive-patterns.mjs";
import { programmeOutline, developmentExercise } from "../lib/virtus-development-pathways.mjs";
import { longitudinalGoalSummary, summarizeDevelopmentPortfolio } from "../lib/virtus-longitudinal.mjs";
import { selectRelevantGoals, buildDevelopmentContext, loadDevelopmentContext } from "../lib/virtus-development-context.mjs";

const pattern = {
  title: "Defensive reaction",
  observed_situation: "My colleague challenged a decision during our team meeting.",
  interpretation: "I immediately interpreted the disagreement as disrespect.",
  response: "I raised my voice before asking a clarifying question.",
  alternative_interpretation: "The colleague may have been asking for supporting evidence.",
  evidence: "The question referred to a specific figure, but I reacted before checking it.",
};
test("requires real client-authored evidence before saving a pattern", () => {
  assert.ok(validateCognitivePattern({...pattern,evidence:""}).error);
  assert.equal(validateCognitivePattern(pattern).value.title,"Defensive reaction");
  assert.ok(validatePatternDecision({id:"invalid",status:"confirmed"}).error);
  assert.ok(validatePatternDecision({id:"b020cff8-79c8-4a22-9218-ec0354904bca",status:"diagnosed"}).error);
});
test("only explicit confirmed patterns reach coaching; rejected and proposed are excluded", () => {
  const rows = [
    {...pattern,status:"proposed"},
    {...pattern,status:"rejected"},
    {...pattern,status:"confirmed"},
  ];
  const text = confirmedPatternContext(rows,3);
  assert.equal((text.match(/Reflection \d/g)||[]).length,1);
  assert.match(text,/client-confirmed hypothesis/);
  assert.ok(!confirmedPatternContext(rows.filter(x=>x.status!=="confirmed")));
});
test("each supported programme duration is bounded and complete", () => {
  for (const days of [7,30,60,90]) {
    const plan=programmeOutline(days,"communication");
    assert.equal(plan.length,days);
    assert.deepEqual(plan.map(x=>x.day),Array.from({length:days},(_,i)=>i+1));
    assert.ok(plan.every(x=>x.instruction&&x.question&&x.phase&&x.action));
    assert.equal(developmentExercise({program_days:days},days).completed,true);
  }
});
test("ninety day path contains progressive contextual exercises, not seven repeating lessons", () => {
  const all = programmeOutline(90,"leadership");
  assert.equal(new Set(all.map(x=>x.instruction)).size,90);
  assert.equal(new Set(all.map(x=>x.phase)).size,5);
  assert.match(all[89].lens,/authority/);
});
test("longitudinal evidence never becomes a clinical score", () => {
  const goal = {id:"goal1",created_at:"2026-11-01",baseline_rating:2,program_days:7,title:"Listen first",status:"active"};
  const entries=[
    {goal_id:"goal1",created_at:"2026-11-02",rating:3,evidence:"Asked one question and waited for the answer."},
    {goal_id:"goal1",created_at:"2026-11-03",rating:4,evidence:"Summarized the other view before responding."},
    {goal_id:"other",created_at:"2026-11-03",rating:5,evidence:"Do not use."},
  ];
  const result=longitudinalGoalSummary(goal,entries);
  assert.equal(result.baseline,2);
  assert.equal(result.latest,4);
  assert.equal(result.change,2);
  assert.equal(result.completedCheckins,2);
  assert.equal(result.evidenceCount,2);
  assert.match(result.disclosure,/Self-report/);
  const portfolio=summarizeDevelopmentPortfolio([goal],entries);
  assert.equal(portfolio.totalCheckins,2);
  assert.equal(portfolio.totalBehaviorReports,2);
});
test("adaptive coaching references goals related to the user request and confirmed patterns only", () => {
  const goals=[
    {id:"1",title:"Improve communication",status:"active",focus_domain:"communication",program_days:7,
      observed_behavior:"I interrupt people",desired_behavior:"Listen and ask a question",baseline_rating:2},
    {id:"2",title:"Build habits",status:"active",focus_domain:"habits",program_days:7,
      observed_behavior:"I miss exercise",desired_behavior:"Exercise daily",baseline_rating:2},
  ];
  assert.equal(selectRelevantGoals(goals,"Help me communicate and listen",1)[0].id,"1");
  const context=buildDevelopmentContext({goals,checkins:[],patterns:[{...pattern,status:"rejected"}],message:"communication"});
  assert.match(context,/client-authored/i);
  assert.doesNotMatch(context,/EXPLICITLY CLIENT-CONFIRMED REFLECTION HYPOTHESES/);
  assert.match(context,/not an instruction or diagnosis/);
});
test("chat context retrieval respects disabled memory and does not query the database", async () => {
  const db={from:()=>{throw Error("should not query when memory disabled");}};
  assert.equal(await loadDevelopmentContext({db,userId:"client",message:"anything",memoryEnabled:false}),"");
  assert.equal(await loadDevelopmentContext({db,userId:null,message:"anything",memoryEnabled:true}),"");
});
