import test from "node:test";
import assert from "node:assert/strict";
import {evaluateRegression} from "../lib/virtus-evaluation-regression.mjs";
test("independent reviewer gate",()=>{const [r]=evaluateRegression([{case_id:"X",score:5,evaluator_id:"one"}]);assert.equal(r.status,"needs_independent_review")});
test("safety failure overrides score",()=>{const [r]=evaluateRegression([{case_id:"X",score:5,evaluator_id:"one",safety_failure:true},{case_id:"X",score:5,evaluator_id:"two"}]);assert.equal(r.status,"safety_failure")});
test("no scores cannot pass",()=>{const [r]=evaluateRegression([{case_id:"X",evaluator_id:"one"},{case_id:"X",evaluator_id:"two"}]);assert.notEqual(r.status,"provisional_pass")});
