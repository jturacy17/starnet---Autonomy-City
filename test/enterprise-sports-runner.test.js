'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const A=require('./_assert.js');
const {makeEnterpriseStateStore}=require('../sidecar/enterprise/state-store.js');
const {makeEnterpriseRuntimeBridge}=require('../sidecar/enterprise/runtime-bridge.js');
const {makeManagerAssignment}=require('../sidecar/enterprise/manager-assignment.js');
const {makeSportsWorkflow}=require('../sidecar/enterprise/sports-workflow.js');
const {makeSportsRunner}=require('../sidecar/enterprise/sports-runner.js');

(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'starnet-sports-runner-'));
 try{
  let t=100;const clock={now:()=>t++};
  const store=makeEnterpriseStateStore({fs,path,workspaces:root});
  const manager=makeManagerAssignment(store,clock);
  manager.assign({id:'work-1',managerId:'media-manager',title:'Score candidate highlight',agentId:'sports-analyst',priority:'high',dueAt:500});
  const flow=makeSportsWorkflow(store,clock);
  flow.create({id:'opp-1',title:'Candidate highlight',workId:'work-1'});
  const bridge=makeEnterpriseRuntimeBridge(store,clock);
  const canonical=[];
  let captured=null;
  const runner=makeSportsRunner({
    store,bridge,clock,newId:()=> 'run-1',
    emit:(name,payload)=>canonical.push({name,payload}),
    runOnce:async opts=>{
      captured=opts;
      opts.emit('agent.run.start',{agentId:opts.agentId,runId:opts.runId,trigger:'directive',model:opts.model||'fixture'});
      opts.emit('agent.cost',{agentId:opts.agentId,runId:opts.runId,usd:0.05,tokensIn:10,tokensOut:5,reasoningTokens:0,cachedTokens:0,model:opts.model||'fixture',reconciled:true});
      opts.emit('agent.run.end',{agentId:opts.agentId,runId:opts.runId,reason:'done',turns:1,usd:0.05});
      return {reason:'done',usd:0.05};
    }
  });
  const result=await runner.launch({workId:'work-1',model:'fixture/model',provider:'fixture'});
  A.eq(result.reason,'done','runner returns canonical host result');
  A.eq(captured.agentId,'sports-analyst','manager-assigned executor is the real run identity');
  A.eq(captured.streamId,'enterprise-sports-run-1','enterprise run gets a dedicated durable stream');
  A.ok(/Do not self-approve/.test(captured.messages[0].content),'executor prompt preserves management authority boundary');
  A.eq(store.read().value.businesses.media.teams.sports.work[0].state,'review','real run completion routes work to manager review');
  A.eq(store.read().value.financialEntries[0].kind,'model_cost','real run cost reaches enterprise finance');
  A.eq(bridge.bindingCount(),0,'run binding is cleaned after host settles');
  A.eq(canonical.map(e=>e.name),['agent.run.start','agent.cost','agent.run.end'],'canonical telemetry remains intact');

  manager.markReviewed({id:'work-1',managerId:'media-manager',verdict:'accepted',quality:92});
  A.eq(store.read().value.businesses.media.teams.sports.work[0].state,'done','manager, not executor, accepts completed work');
  A.eq(store.read().value.businesses.media.teams.sports.work[0].quality,92,'manager records delivered quality');

  A.throws(()=>manager.assign({id:'bad',managerId:'media-manager',title:'Bad',agentId:'ceo'}),'CEO cannot be assigned as executor agent');
  A.throws(()=>manager.markReviewed({id:'work-1',managerId:'not-manager',verdict:'accepted'}),'wrong manager cannot approve Sports work');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 A.report('enterprise-sports-runner.test');
})().catch(e=>{A.ok(false,e.stack||e);A.report('enterprise-sports-runner.test');});
