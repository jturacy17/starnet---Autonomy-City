/* sidecar/enterprise/operations.js — controlled Phase 1B mutations over enterprise state.
   This is the accountable business layer: managers correct delivery, board raises recommendations,
   CEO records decisions, and finance/time/outcomes are auditable. No external execution occurs here. */
'use strict';

function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function id(prefix, value){const v=clip(value,100);if(!v) throw new Error('enterprise: '+prefix+' id required');return v;}
function stamp(clock){const n=clock&&typeof clock.now==='function'?Number(clock.now()):0;return Number.isFinite(n)&&n>=0?n:0;}
function audit(state, clock, actorId, action, targetId, detail){
  state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+stamp(clock),actorId:clip(actorId,120),action:clip(action,120),targetId:clip(targetId,120),detail:clip(detail,600),at:stamp(clock)});
}
function makeEnterpriseOperations(store, clock){
  if(!store||typeof store.update!=='function') throw new Error('makeEnterpriseOperations: store required');
  clock=clock||{now:()=>0};

  function managerCorrect(input){
    const x=input||{}, managerId=id('manager',x.managerId), correctionId=id('correction',x.id);
    return store.update(state=>{
      const team=state.businesses.media.teams.sports;
      if(managerId!==state.businesses.media.managerId) throw new Error('enterprise: manager does not own sports team');
      if(team.correctiveActions.some(c=>c.id===correctionId)) return state;
      team.correctiveActions.push({id:correctionId,reason:clip(x.reason,280),ownerManagerId:managerId,status:'open',openedAt:stamp(clock),resolvedAt:0});
      audit(state,clock,managerId,'manager.corrective_action.opened',correctionId,x.reason);
      return state;
    }).value;
  }

  function resolveCorrection(input){
    const x=input||{}, managerId=id('manager',x.managerId), correctionId=id('correction',x.id);
    return store.update(state=>{
      if(managerId!==state.businesses.media.managerId) throw new Error('enterprise: manager does not own sports team');
      const c=state.businesses.media.teams.sports.correctiveActions.find(v=>v.id===correctionId);
      if(!c) throw new Error('enterprise: corrective action not found');
      c.status='resolved'; c.resolvedAt=stamp(clock);
      audit(state,clock,managerId,'manager.corrective_action.resolved',correctionId,x.detail||'resolved');
      return state;
    }).value;
  }

  function boardRecommend(input){
    const x=input||{}, recommendationId=id('recommendation',x.id);
    return store.update(state=>{
      if(state.recommendations.some(r=>r.id===recommendationId)) return state;
      state.recommendations.push({
        id:recommendationId,source:'board',title:clip(x.title,240),recommendation:clip(x.recommendation,800),
        evidence:Array.isArray(x.evidence)?x.evidence.slice(0,12):[],disagreement:Array.isArray(x.disagreement)?x.disagreement.slice(0,8):[],
        confidence:Math.max(0,Math.min(100,num(x.confidence,0))),upside:clip(x.upside,500),downside:clip(x.downside,500),
        requiresCeoDecision:x.requiresCeoDecision===true,createdAt:stamp(clock)
      });
      audit(state,clock,'board','board.recommendation.created',recommendationId,x.title);
      return state;
    }).value;
  }

  function requestCeoDecision(input){
    const x=input||{}, decisionId=id('decision',x.id);
    return store.update(state=>{
      if(state.decisions.some(d=>d.id===decisionId)) return state;
      state.decisions.push({
        id:decisionId,type:clip(x.type,80)||'general',title:clip(x.title,240),status:'pending',
        requestedBy:clip(x.requestedBy,120)||'board',decidedBy:'',rationale:'',amountUsd:Math.max(0,num(x.amountUsd,0)),
        createdAt:stamp(clock),decidedAt:0
      });
      audit(state,clock,clip(x.requestedBy,120)||'board','ceo.decision.requested',decisionId,x.title);
      return state;
    }).value;
  }

  function decide(input){
    const x=input||{}, decisionId=id('decision',x.id);
    const verdict=clip(x.status,40);
    if(!['approved','denied','modified','more_info'].includes(verdict)) throw new Error('enterprise: invalid CEO decision');
    return store.update(state=>{
      const d=state.decisions.find(v=>v.id===decisionId);
      if(!d) throw new Error('enterprise: decision not found');
      if(d.status!=='pending'&&d.status!=='more_info') throw new Error('enterprise: decision already closed');
      d.status=verdict; d.decidedBy='ceo'; d.rationale=clip(x.rationale,800); d.decidedAt=stamp(clock);
      audit(state,clock,'ceo','ceo.decision.'+verdict,decisionId,x.rationale);
      return state;
    }).value;
  }

  function recordFinancial(input){
    const x=input||{}, entryId=id('financial entry',x.id);
    return store.update(state=>{
      if(state.financialEntries.some(e=>e.id===entryId)) return state;
      state.financialEntries.push({id:entryId,businessId:clip(x.businessId,80)||'media',experimentId:clip(x.experimentId,120),kind:clip(x.kind,60)||'cost',usd:num(x.usd,0),minutes:0,at:stamp(clock)});
      audit(state,clock,clip(x.actorId,120)||'system','finance.entry.recorded',entryId,clip(x.kind,60));
      return state;
    }).value;
  }

  function recordHumanTime(input){
    const x=input||{}, entryId=id('human time entry',x.id);
    return store.update(state=>{
      if(state.humanTimeEntries.some(e=>e.id===entryId)) return state;
      state.humanTimeEntries.push({id:entryId,businessId:clip(x.businessId,80)||'media',experimentId:clip(x.experimentId,120),kind:clip(x.kind,60)||'ceo',usd:0,minutes:Math.max(0,num(x.minutes,0)),at:stamp(clock)});
      audit(state,clock,clip(x.actorId,120)||'ceo','human_time.recorded',entryId,String(Math.max(0,num(x.minutes,0)))+' minutes');
      return state;
    }).value;
  }

  return {managerCorrect,resolveCorrection,boardRecommend,requestCeoDecision,decide,recordFinancial,recordHumanTime};
}
module.exports={makeEnterpriseOperations};
