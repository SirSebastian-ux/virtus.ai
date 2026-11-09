import test from "node:test";
import assert from "node:assert/strict";
import {buildDevelopmentIndex,DEVELOPMENT_DOMAINS,FRAMEWORK_VERSION} from "../lib/virtus-development-index.mjs";
const review=(id,obs)=>({id,created_at:new Date(2026,0,id).toISOString(),observations:obs,message_count:id*8,last_message_at:new Date(2026,0,id).toISOString()});
const observation=(skill,proficiency,confidence="high")=>({skill,proficiency,confidence,difficulty:2,framework_version:FRAMEWORK_VERSION,evidence:"Observed comparable reasoning evidence"});
test("eight distinct foundational domains without leadership",()=>{assert.equal(DEVELOPMENT_DOMAINS.length,8);assert.ok(!DEVELOPMENT_DOMAINS.some(x=>x.name==="Leadership"));});
test("no automatic 50% baseline",()=>{const d=buildDevelopmentIndex([review(1,[observation("Metacognition",2)])]).find(x=>x.name==="Metacognition");assert.equal(d.level,null);assert.equal(d.provisionalLevel,2);assert.equal(d.progress,null);});
test("longitudinal evidence moves up and down",()=>{const up=buildDevelopmentIndex([review(1,[observation("Metacognition",2)]),review(2,[observation("Metacognition",4)])]).find(x=>x.name==="Metacognition");assert.equal(up.level,3);const down=buildDevelopmentIndex([review(1,[observation("Metacognition",4)]),review(2,[observation("Metacognition",1)])]).find(x=>x.name==="Metacognition");assert.equal(down.level,3);});
test("legacy qualitative reviews never fabricate proficiency",()=>{const d=buildDevelopmentIndex([review(1,[{skill:"Metacognition",direction:"improving",confidence:"high"}])]);assert.equal(d.find(x=>x.name==="Metacognition").level,null);});
