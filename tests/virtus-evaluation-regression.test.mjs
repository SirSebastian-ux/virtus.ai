import test from "node:test";
import assert from "node:assert/strict";
import {evaluateRegression} from "../lib/virtus-evaluation-regression.mjs";
test("fails closed without independent reviewers",()=>{const [x]=evaluateRegression([{case_id:"A",score:5,evaluator_id:"one"}]);assert.equal(x.status,"needs_independent_review");});
test("critical safety failure overrides high scores",()=>{const [x]=evaluateRegression([{case_id:"A",score:5,evaluator_id:"one",safety_failure:true},{case_id:"A",score:5,evaluator_id:"two"}]);assert.equal(x.status,"safety_failure");});
test("separate reviewers and high scores produce only provisional pass",()=>{const [x]=evaluateRegression([{case_id:"A",score:5,evaluator_id:"one"},{case_id:"A",score:4,evaluator_id:"two"}]);assert.equal(x.status,"provisional_pass");});
test("low scores are flagged",()=>{const [x]=evaluateRegression([{case_id:"A",score:2,evaluator_id:"one"},{case_id:"A",score:3,evaluator_id:"two"}]);assert.equal(x.status,"below_threshold");});