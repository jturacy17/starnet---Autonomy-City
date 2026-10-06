/* sidecar/enterprise/sports-workflow.js — controlled Sports clipping opportunity progression.
   Publishing is intentionally absent from the state machine in Phase 1. */
'use strict';
const { monetizationDecision, nextSportsStage, canEnterControlledProduction } = require('./model.js');

function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}
function makeSportsWorkflow(store,clock){
  if(!store||typeof store.update!=='function') throw new Error('makeSportsWorkflow: store required');
  clock=clock||{now:()=>0};
  const now=()=>Math.max(0,Number(clock.now())||0);
  function create(input){
    const x=input||{}, id=clip(x.id,120), title=clip(x.title,240);
    if(!id||!title) throw new Error('enterprise: opportunity id + title required');
    return store.update(state=>{
      if(state.opportunities.some(o=>o.id===id)) return state;
      state.opportunities.push({id,title,stage:'source_discovery',status:'active',workId:clip(x.workId,120),currentAgentId:'',runId:'',monetizationDecision:'',managementReview:'pending',ceoApprovalRequired:false,ceoDecision:'',publishingAuthorized:false,createdAt:now(),updatedAt:now()});
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:'media-manager',action:'sports.opportunity.created',targetId:id,detail:title,at:now()});
      return state;
    }).value;
  }
  function evaluateMonetization(id,input){
    const decision=monetizationDecision(input);
    return store.update(state=>{
      const o=state.opportunities.find(x=>x.id===id); if(!o) throw new Error('enterprise: opportunity not found');
      o.monetizationDecision=decision; o.updatedAt=now();
      if(decision==='REJECT') o.status='rejected';
      else if(decision==='REVIEW') o.status='blocked';
      else o.status='active';
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:'rights-analyst',action:'sports.monetization.'+decision.toLowerCase(),targetId:id,detail:decision,at:now()});
      return state;
    }).value;
  }
  function managerReview(id,verdict){
    if(!['approved','denied'].includes(verdict)) throw new Error('enterprise: invalid manager review');
    return store.update(state=>{
      const o=state.opportunities.find(x=>x.id===id); if(!o) throw new Error('enterprise: opportunity not found');
      o.managementReview=verdict;o.updatedAt=now(); if(verdict==='denied')o.status='paused';
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:'media-manager',action:'sports.management.'+verdict,targetId:id,detail:verdict,at:now()});
      return state;
    }).value;
  }
  function advance(id){
    return store.update(state=>{
      const o=state.opportunities.find(x=>x.id===id); if(!o) throw new Error('enterprise: opportunity not found');
      if(o.stage==='controlled_production'&&!canEnterControlledProduction(o)) throw new Error('enterprise: production gate not satisfied');
      const next=nextSportsStage(o.stage,o);
      if(!next) throw new Error('enterprise: workflow cannot advance');
      o.stage=next;o.updatedAt=now();
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:'media-manager',action:'sports.stage.advanced',targetId:id,detail:next,at:now()});
      return state;
    }).value;
  }
  function requireCeo(id,required){
    return store.update(state=>{const o=state.opportunities.find(x=>x.id===id);if(!o)throw new Error('enterprise: opportunity not found');o.ceoApprovalRequired=required===true;o.updatedAt=now();return state;}).value;
  }
  function recordCeoDecision(id,decision){
    if(!['approved','denied','modified','more_info'].includes(decision))throw new Error('enterprise: invalid CEO decision');
    return store.update(state=>{const o=state.opportunities.find(x=>x.id===id);if(!o)throw new Error('enterprise: opportunity not found');o.ceoDecision=decision;o.updatedAt=now();if(decision==='denied')o.status='paused';return state;}).value;
  }
  return {create,evaluateMonetization,managerReview,advance,requireCeo,recordCeoDecision};
}
module.exports={makeSportsWorkflow};
