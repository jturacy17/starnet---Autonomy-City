/* sidecar/enterprise/media-read-model.js — read-only Media campus projection.
   Sports is the only operational Phase 1 vertical. Other divisions are structural placeholders only. */
'use strict';

const { managerTeamHealth } = require('./oversight.js');
const { rankWork, diagnose, escalationNeed } = require('./manager-loop.js');

const MEDIA_DIVISIONS = Object.freeze([
  {id:'sports',name:'Sports',status:'pilot'},
  {id:'business-ai',name:'Business / Money / AI',status:'coming_soon'},
  {id:'comedy-viral',name:'Comedy / Viral',status:'coming_soon'},
  {id:'dating-relationships',name:'Dating / Relationships',status:'coming_soon'},
  {id:'kids-a',name:'Kids A',status:'coming_soon'},
  {id:'kids-b',name:'Kids B',status:'coming_soon'},
  {id:'kids-c',name:'Kids C',status:'coming_soon'},
  {id:'gaming',name:'Gaming',status:'coming_soon'},
  {id:'streamer-pop-culture',name:'Streamer / Pop Culture',status:'coming_soon'}
]);

const SPORTS_WORKFLOW = Object.freeze([
  'source_discovery','content_understanding','opportunity_scoring','rights_compliance',
  'monetization_gate','management_review','experiment','ceo_approval',
  'controlled_production','quality_control','measurement','learning','terminal'
]);

function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function money(v){return Math.round(num(v,0)*100)/100;}
function sportsOpportunity(row){
  return {
    id:row.id,title:row.title,stage:row.stage,status:row.status,
    monetizationDecision:row.monetizationDecision||'',
    managementReview:row.managementReview||'pending',
    ceoApprovalRequired:row.ceoApprovalRequired===true,
    ceoDecision:row.ceoDecision||'',
    publishingAuthorized:false,
    currentAgentId:row.currentAgentId||'',
    workId:row.workId||''
  };
}
function experimentRow(row){
  const predicted=money(num(row.predictedRevenueUsd,0)-num(row.predictedCostUsd,0));
  const actual=money(num(row.actualRevenueUsd,0)-num(row.actualCostUsd,0));
  return {
    id:row.id,opportunityId:row.opportunityId,status:row.status,hypothesis:row.hypothesis,
    predictedProfitUsd:predicted,actualProfitUsd:actual,profitVarianceUsd:money(actual-predicted),
    predictedHumanMinutes:num(row.predictedHumanMinutes,0),actualHumanMinutes:num(row.actualHumanMinutes,0)
  };
}
function finance(state){
  const entries=Array.isArray(state.financialEntries)?state.financialEntries.filter(e=>!e.businessId||e.businessId==='media'):[];
  const time=Array.isArray(state.humanTimeEntries)?state.humanTimeEntries.filter(e=>!e.businessId||e.businessId==='media'):[];
  let revenue=0,cost=0;
  for(const e of entries){const usd=Math.max(0,num(e.usd,0));if(/revenue/i.test(e.kind||''))revenue+=usd;else cost+=usd;}
  const humanMinutes=time.reduce((s,e)=>s+Math.max(0,num(e.minutes,0)),0);
  return {revenueUsd:money(revenue),costUsd:money(cost),profitUsd:money(revenue-cost),humanMinutes};
}
function buildMediaReadModel(state,now){
  const media=state&&state.businesses&&state.businesses.media||{};
  const team=media.teams&&media.teams.sports||{work:[],correctiveActions:[],metrics:{}};
  const health=managerTeamHealth(team,now);
  const priority=rankWork(team,now);
  const issues=diagnose(team,now);
  const escalation=escalationNeed(team,now);
  const opportunities=(Array.isArray(state&&state.opportunities)?state.opportunities:[]).map(sportsOpportunity);
  const experiments=(Array.isArray(state&&state.experiments)?state.experiments:[]).map(experimentRow);
  const corrections=(Array.isArray(team.correctiveActions)?team.correctiveActions:[]).map(c=>({
    id:c.id,reason:c.reason,status:c.status,ownerManagerId:c.ownerManagerId,openedAt:c.openedAt,resolvedAt:c.resolvedAt
  }));
  const work=(Array.isArray(team.work)?team.work:[]).map(w=>({
    id:w.id,title:w.title,ownerAgentId:w.ownerAgentId,state:w.state,priority:w.priority,dueAt:w.dueAt,
    blockedReason:w.blockedReason,quality:w.quality,costUsd:money(w.costUsd),humanMinutes:w.humanMinutes
  }));
  return {
    surface:'media_campus',generatedAt:Math.max(0,num(now,0)),
    business:{id:'media',name:'Media',status:media.status||'active',managerId:media.managerId||'media-manager'},
    divisions:MEDIA_DIVISIONS,
    sports:{
      status:team.status||'pilot',
      workflow:SPORTS_WORKFLOW,
      health,escalation,
      work:{items:work,priorityQueue:priority,issues},
      correctiveActions:corrections,
      opportunities,experiments,
      rights:{
        monetize:opportunities.filter(o=>o.monetizationDecision==='MONETIZE').length,
        review:opportunities.filter(o=>o.monetizationDecision==='REVIEW'||!o.monetizationDecision).length,
        reject:opportunities.filter(o=>o.monetizationDecision==='REJECT').length
      },
      publishing:{authorized:false,reason:'Phase 1 autonomous publishing disabled'}
    },
    finance:finance(state),
    capabilities:[
      {id:'scout',name:'Scout',role:'source discovery'},
      {id:'analyst',name:'Analyst',role:'content understanding and scoring'},
      {id:'rights-analyst',name:'Rights / Monetization Analyst',role:'rights and monetization gate'},
      {id:'producer',name:'Producer',role:'controlled production'},
      {id:'performance-analyst',name:'Performance Analyst',role:'measurement and learning'}
    ]
  };
}

module.exports={MEDIA_DIVISIONS,SPORTS_WORKFLOW,buildMediaReadModel};
