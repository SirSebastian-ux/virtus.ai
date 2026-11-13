import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDevelopmentIndex, FRAMEWORK_VERSION } from '../lib/virtus-development-index.mjs';
const observation = (proficiency, refs, evidence) => ({skill:'Self-awareness',framework_version:FRAMEWORK_VERSION,proficiency,confidence:'high',difficulty:2,evidence,source_refs:refs});
const ref = id => ({ref:`checkin:${id}`,type:'checkin',id,date:'2026-11-13T10:00:00Z'});
test('new unscored goal check-in remains attributed without fabricating competency change',()=>{
 const reviews=[
 {id:'old',created_at:'2026-11-11T10:00:00Z',observations:[observation(2,[],'Earlier rubric observation')]},
 {id:'new',created_at:'2026-11-13T10:00:00Z',observations:[observation(null,[ref('qa-new')],'Fictional self-report; no demonstrated performance')]},
 ];
 const domain=buildDevelopmentIndex(reviews).find(d=>d.name==='Self-awareness');
 assert.equal(domain.provisionalLevel,2);
 assert.equal(domain.latestEvidence.proficiency,null);
 assert.equal(domain.attributedEvidence.source_refs[0].ref,'checkin:qa-new');
 assert.match(domain.stageJustification,/stage retained/i);
});
