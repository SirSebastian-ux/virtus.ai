import test from "node:test";
import assert from "node:assert/strict";
import { dailyScenarios,scoreDailyResponse } from "../lib/virtus-org-daily-assessment.mjs";
const date=new Date("2026-11-15T12:00:00Z");
const key="scenario-v2-daily-2026-11-15-";
test("scores all daily questions from server-owned answer map",()=>{
 const rows=dailyScenarios(Math.floor(date.getTime()/86400000));
 assert.equal(rows.length,6);
 for(const s of rows){for(let i=0;i<3;i++)assert.equal(scoreDailyResponse({domain:s.domain,exerciseKey:key+s.domain,choiceIndex:i,now:date})?.score,s.points[i]);}
});
test("rejects tampered, late, missing, or arbitrary answers",()=>{
 assert.equal(scoreDailyResponse({domain:"communication",exerciseKey:key+"communication",choiceIndex:6,now:date}),null);
 assert.equal(scoreDailyResponse({domain:"communication",exerciseKey:"scenario-v2-daily-2026-11-14-communication",choiceIndex:0,now:date}),null);
 assert.equal(scoreDailyResponse({domain:"executive_functioning",exerciseKey:key+"executive_functioning",choiceIndex:0,now:date}),null);
 assert.equal(scoreDailyResponse({domain:"communication",exerciseKey:key+"communication",choiceIndex:"1",now:date}),null);
});
