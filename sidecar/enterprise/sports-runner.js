/* sidecar/enterprise/sports-runner.js — controlled Sports work launcher over StarNet's existing runOnce host.
   It binds a manager-assigned work item to a real run, tees canonical lifecycle events into enterprise state,
   and returns the host result. No publishing or external business authority is granted here. */
'use strict';

const { makeEnterpriseEventSink } = require('./event-sink.js');

function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}

function makeSportsRunner(deps){
  deps=deps||{};
  const store=deps.store, bridge=deps.bridge, runOnce=deps.runOnce, newId=deps.newId;
  const canonicalEmit=typeof deps.emit==='function'?deps.emit:function(){};
  const clock=deps.clock||{now:()=>0};
  if(!store||typeof store.read!=='function') throw new Error('makeSportsRunner: store required');
  if(!bridge||typeof bridge.bindRun!=='function') throw new Error('makeSportsRunner: bridge required');
  if(typeof runOnce!=='function') throw new Error('makeSportsRunner: runOnce required');
  if(typeof newId!=='function') throw new Error('makeSportsRunner: newId required');

  function resolveWork(workId){
    const state=store.read().value;
    const work=state.businesses.media.teams.sports.work.find(w=>w.id===workId);
    if(!work) throw new Error('enterprise: work not found');
    if(work.state!=='queued') throw new Error('enterprise: only queued work may launch');
    const opp=state.opportunities.find(o=>o.workId===workId)||null;
    return {work,opportunity:opp};
  }

  function promptFor(work,opportunity){
    const lines=[
      'You are an executor in JT\'s Service & Sale → Media → Sports.',
      'Complete the assigned work only. Do not self-approve, change business policy, spend money, publish, contact third parties, or raise your own autonomy.',
      'Assignment: '+work.title
    ];
    if(opportunity) lines.push('Opportunity: '+opportunity.title+' (stage: '+opportunity.stage+')');
    lines.push('Return a concise result with evidence and any blocker that requires your manager.');
    return lines.join('\n');
  }

  async function launch(input){
    const x=input||{}, workId=clip(x.workId,120);
    const {work,opportunity}=resolveWork(workId);
    const runId=clip(x.runId,120)||clip(newId(),120);
    if(!runId) throw new Error('enterprise: run id required');
    bridge.bindRun({runId,workId,opportunityId:opportunity&&opportunity.id});
    const emit=makeEnterpriseEventSink({bridge,emit:canonicalEmit,onIssue:deps.onIssue});
    const opts={
      key:x.key||'',model:x.model||'',system:x.system||'',
      messages:Array.isArray(x.messages)&&x.messages.length?x.messages:[{role:'user',content:promptFor(work,opportunity)}],
      agentId:work.ownerAgentId,isTask:true,emit,signal:x.signal,
      runId,streamId:'enterprise-sports-'+runId,surface:'enterprise',trigger:'directive',
      provider:x.provider,reasoningEffort:x.reasoningEffort,
      reflect:true,requiredPreloads:true,
      preloadSkills:Array.isArray(x.preloadSkills)?x.preloadSkills:[],
      workdir:x.workdir||null,enabledToolsets:Array.isArray(x.enabledToolsets)?x.enabledToolsets:null,
      station:x.station||undefined,
      enterprise:{businessId:'media',teamId:'sports',workId,opportunityId:opportunity&&opportunity.id}
    };
    try{return await runOnce(opts);}
    finally{bridge.unbindRun(runId);}
  }

  return {launch,promptFor};
}
module.exports={makeSportsRunner};
