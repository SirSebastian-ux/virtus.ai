import test from "node:test";
import assert from "node:assert/strict";
import { PORTFOLIO_SCOPE, choosePortfolioItems, buildPortfolioReview, loadPortfolioReview } from "../lib/virtus-coaching-portfolio.mjs";

const id = "cb6dd39c-b33d-4a99-91d6-bfc036550213";
const goal = {
  id, title: "Improve calm communication", focus_domain: "communication",
  status: "active", observed_behavior: "I sometimes interrupt colleagues",
  desired_behavior: "Pause, listen and respond respectfully",
  baseline_rating: 2, program_days: 30, created_at: "2026-11-01",
};
const checkins = [
  { goal_id: id, rating: 3, evidence: "I listened before answering.", created_at: "2026-11-02T14:00:00Z" },
  { goal_id: id, rating: 4, evidence: "I summarized my colleague's perspective.", created_at: "2026-11-03T14:00:00Z" },
];
const projects = [
  { id: "p1", title: "Professional Communication", chat_id: "chat-a-00001",
    chats_json: [{chatId:"chat-b-00002",title:"Handling disagreement"}], updated_at:"2026-11-04" },
  { id: "p2", title: "Fitness plan", chat_id: "chat-c-00003",
    chats_json: [], updated_at:"2026-11-05" },
];

test("membership scopes deepen evaluation without creating clinical claims", () => {
  assert.deepEqual(Object.keys(PORTFOLIO_SCOPE),["life_coach","plus","premium"]);
  const coach=buildPortfolioReview({plan:"life_coach",goals:[goal],checkins,projects,message:"communication"});
  const trainer=buildPortfolioReview({plan:"plus",goals:[goal],checkins,projects,message:"communication"});
  const mentor=buildPortfolioReview({plan:"premium",goals:[goal],checkins,projects,message:"communication"});
  assert.match(coach,/Life Coach: help the user examine/);
  assert.match(trainer,/Trainer: assess reported practice/);
  assert.match(mentor,/Mentor: integrate goal trajectories/);
  assert.match(coach,/baseline\/latest: 2\/4/);
  assert.match(coach,/Self-rating difference: \+2/);
  assert.match(coach,/check-in evidence reports: 2/);
  assert.match(coach,/self-report/i);
  assert.match(coach,/Do not infer psychological diagnoses/);
  assert.equal(buildPortfolioReview({plan:"free",goals:[goal],projects}),"");
});
test("relevant user project chosen before unrelated project", () => {
  assert.equal(choosePortfolioItems(projects,"Help me with communication",1)[0].id,"p1");
  assert.equal(choosePortfolioItems(projects,"something else",1,"p2")[0].id,"p2");
});
test("only supplied bounded project message samples are used", () => {
  const text=buildPortfolioReview({plan:"plus",projects:[projects[0]],projectMessages:[
    {content:"I practiced listening in today's meeting."},
    {content:"The interaction was more constructive."},
  ]});
  assert.match(text,/limited sample; NOT the complete project/);
  assert.match(text,/I practiced listening/);
  assert.doesNotMatch(text,/diagnosis established/);
});

function fakeDb(owner, externalProject=false) {
  const calls=[];
  const fixtures={
    virtus_development_goals:[{...goal,user_id:owner}],
    virtus_development_checkins:checkins.map(x=>({...x,user_id:owner})),
    project_spaces:projects.map(x=>({...x,user_id:owner})),
    conversations:[
      {chat_id:"chat-a-00001",role:"user",content:"I asked for more evidence before reacting.",user_id:owner},
      {chat_id:"chat-b-00002",role:"assistant",content:"I have completed your development.",user_id:owner},
      {chat_id:"chat-c-00003",role:"user",content:"My fitness plan is another project.",user_id:owner},
    ],
  };
  const db={
    calls,
    from(table) {
      calls.push({table,filters:[]});
      const call=calls[calls.length-1];
      let rows=fixtures[table]||[];
      const query={
        select(){return this;},
        eq(key,value){call.filters.push({key,value}); rows=rows.filter(x=>String(x[key])===String(value));return this;},
        in(key,values){call.filters.push({key,values});rows=rows.filter(x=>values.includes(x[key]));return this;},
        order(){return this;},
        limit(n){return Promise.resolve({data:rows.slice(0,n),error:null});},
      };
      if(externalProject && table==="project_spaces") {
        rows=rows.filter(p=>p.id!=="p1");
      }
      return query;
    },
  };
  return db;
}
test("disabled memory never queries private records", async () => {
  const db={from(){throw Error("should never access db");}};
  assert.equal(await loadPortfolioReview({db,userId:"owner1",plan:"premium",message:"goals",memoryEnabled:false}),"");
  assert.equal(await loadPortfolioReview({db,userId:"owner1",plan:"free",message:"goals",memoryEnabled:true}),"");
  assert.equal(await loadPortfolioReview({db,userId:null,plan:"premium",message:"goals",memoryEnabled:true}),"");
});
test("every project and conversation query is scoped to user, not chosen project ID alone", async () => {
  const db=fakeDb("owner1");
  const text=await loadPortfolioReview({db,userId:"owner1",plan:"premium",message:"communication",memoryEnabled:true,selectedProjectId:"p1"});
  assert.match(text,/I asked for more evidence/);
  assert.doesNotMatch(text,/My fitness plan is another project/);
  assert.doesNotMatch(text,/I have completed your development/);
  assert.ok(db.calls.every(c=>c.filters.some(f=>f.key==="user_id" && f.value==="owner1")));
});
test("unauthorized active project ID cannot cause a chat content read", async () => {
  const db=fakeDb("owner1",true);
  const text=await loadPortfolioReview({db,userId:"owner1",plan:"plus",message:"communication",memoryEnabled:true,selectedProjectId:"p1"});
  assert.doesNotMatch(text,/I asked for more evidence/);
  assert.equal(db.calls.filter(c=>c.table==="conversations").length,0);
});
