/* sidecar/enterprise/runtime-bridge.js — fold proven StarNet runtime events into enterprise state.
   Runtime telemetry updates operational truth only. It never grants business authority, raises autonomy,
   approves capital, or enables publishing. */
'use strict';

function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function makeEnterpriseRuntimeBridge(store, clock){
  if(!store||typeof store.update!=='function') throw new Error('makeEnterpriseRuntimeBridge: store required');
  clock=clock||{now:()=>0};
  const bindings=new Map(); // runId -> { workId, opportunityId }
  const charged=new Set();  // runId:model-cost reconciliation idempotency

  function now(){const n=Number(clock.now());return Number.isFinite(n)&&n>=0?n:0;}
  function bindRun(input){
    const x=input||{}, runId=clip(x.runId,120), workId=clip(x.workId,120), opportunityId=clip(x.opportunityId,120);
    if(!runId||!workId) throw new Error('enterprise: runId + workId required');
    bindings.set(runId,{workId,opportunityId});
    return {runId,workId,opportunityId};
  }
  function unbindRun(runId){bindings.delete(clip(runId,120));}
  function locate(state,b){
    const sports=state.businesses.media.teams.sports;
    return { sports, work:sports.work.find(w=>w.id===b.workId), opportunity:b.opportunityId?state.opportunities.find(o=>o.id===b.opportunityId):null };
  }
  function appendAudit(state,actorId,action,targetId,detail){
    state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:clip(actorId,120),action:clip(action,120),targetId:clip(targetId,120),detail:clip(detail,600),at:now()});
  }
  function handle(name,payload){
    const p=payload||{}, runId=clip(p.runId,120), b=bindings.get(runId);
    if(!b) return {handled:false,reason:'unbound'};
    store.update(state=>{
      const found=locate(state,b), work=found.work, opp=found.opportunity;
      if(!work) return state;
      if(name==='agent.run.start'){
        work.state='active';
        work.ownerAgentId=clip(p.agentId,120)||work.ownerAgentId;
        if(opp){opp.currentAgentId=clip(p.agentId,120);opp.runId=runId;opp.updatedAt=now();}
        appendAudit(state,p.agentId,'runtime.run.started',work.id,runId);
      } else if(name==='agent.cost'){
        const key=runId+':reconciled';
        if(p.reconciled===true&&!charged.has(key)){
          const usd=Math.max(0,num(p.usd,0));
          work.costUsd=Math.round((num(work.costUsd,0)+usd)*1000000)/1000000;
          state.financialEntries.push({id:'model-'+runId,businessId:'media',experimentId:'',kind:'model_cost',usd,minutes:0,at:now()});
          charged.add(key);
          appendAudit(state,p.agentId,'runtime.model_cost.recorded',work.id,String(usd));
        }
      } else if(name==='agent.run.end'){
        if(p.reason==='done'){
          work.state='review';
          work.blockedReason='';
          if(opp){opp.status='active';opp.updatedAt=now();}
          appendAudit(state,p.agentId,'runtime.run.completed',work.id,'awaiting management/quality review');
        } else if(['error','refusal','budget','empty','max_iters'].includes(p.reason)){
          work.state='blocked';
          work.blockedReason='run ended: '+clip(p.reason,40);
          if(opp){opp.status='blocked';opp.updatedAt=now();}
          appendAudit(state,p.agentId,'runtime.run.blocked',work.id,work.blockedReason);
        } else if(p.reason==='cancelled'){
          work.state='cancelled';
          appendAudit(state,p.agentId,'runtime.run.cancelled',work.id,'cancelled');
        }
      }
      return state;
    });
    return {handled:true};
  }
  return {bindRun,unbindRun,handle,bindingCount:()=>bindings.size};
}
module.exports={makeEnterpriseRuntimeBridge};
