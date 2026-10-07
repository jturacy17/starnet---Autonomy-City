'use strict';
const A=require('./_assert.js');
const {makeEnterpriseEventSink}=require('../sidecar/enterprise/event-sink.js');
const folded=[],canonical=[],issues=[];
const emit=makeEnterpriseEventSink({
 bridge:{handle:(name,payload)=>{folded.push({name,payload});if(name==='boom')throw new Error('enterprise fold failed');}},
 emit:(name,payload)=>canonical.push({name,payload}),
 onIssue:e=>issues.push(e.message)
});
emit('agent.run.start',{runId:'r1'});
A.eq(folded.map(x=>x.name),['agent.run.start'],'enterprise bridge receives canonical runtime event');
A.eq(canonical.map(x=>x.name),['agent.run.start'],'canonical StarNet emitter still receives event');
emit('boom',{});
A.eq(issues,['enterprise fold failed'],'enterprise fold failure is observable');
A.eq(canonical.map(x=>x.name),['agent.run.start','boom'],'enterprise observer failure never suppresses canonical telemetry');
A.report('enterprise-event-sink.test');
