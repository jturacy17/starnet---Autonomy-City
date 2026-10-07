'use strict';
const fs=require('node:fs'), os=require('node:os'), path=require('node:path');
const A=require('./_assert.js');
const S=require('../sidecar/enterprise/state-store.js');
const O=require('../sidecar/enterprise/oversight.js');

const root=fs.mkdtempSync(path.join(os.tmpdir(),'starnet-enterprise-'));
try{
  const store=S.makeEnterpriseStateStore({fs,path,workspaces:root});
  A.eq(store.read().value.enterpriseId,'jts-service-sale','enterprise defaults are durable-store backed');
  store.update(state=>{
    const sports=state.businesses.media.teams.sports;
    sports.metrics={revenueUsd:1000,costUsd:250,humanMinutes:300};
    sports.work=[
      {id:'w1',title:'Scout opportunity',ownerAgentId:'sports-scout',state:'done',dueAt:10,completedAt:9,quality:90},
      {id:'w2',title:'Rights review',ownerAgentId:'rights-analyst',state:'blocked',dueAt:20,blockedReason:'license unknown'}
    ];
    sports.correctiveActions=[{id:'c1',reason:'Resolve rights uncertainty',ownerManagerId:'media-manager',status:'monitoring',openedAt:21}];
    state.experiments.push({id:'e1',opportunityId:'o1',status:'completed',predictedRevenueUsd:500,predictedCostUsd:100,actualRevenueUsd:450,actualCostUsd:125,predictedHumanMinutes:60,actualHumanMinutes:75});
    state.decisions.push({id:'d1',type:'capital',title:'Expand experiment',status:'pending',requestedBy:'board',amountUsd:180,createdAt:30});
    return state;
  });
  const loaded=store.read().value;
  A.eq(loaded.businesses.media.teams.sports.work.length,2,'work survives durable round trip');
  const manager=O.managerTeamHealth(loaded.businesses.media.teams.sports,25);
  A.eq(manager.health,'watch','blocked work and corrective action move manager health to watch');
  A.eq(manager.blocked,1,'manager sees blocked work');
  A.eq(manager.overdue,1,'manager sees overdue work');
  A.eq(manager.avgQuality,90,'manager sees delivered quality');
  const board=O.boardReview(manager,loaded.experiments);
  A.eq(board.managerPerformance,'needs_attention','board evaluates manager performance rather than raw agent task status');
  A.ok(board.profitPerHumanHour>0,'board receives profit per human hour');
  const brief=O.ceoBrief(board,loaded.decisions,loaded.recommendations);
  A.eq(brief.attention,'DECIDE','pending material decision reaches CEO as DECIDE');
  A.eq(brief.pendingDecisions,1,'CEO brief counts decisions, not raw work items');
  const v=O.experimentVariance(loaded.experiments[0]);
  A.eq(v.predictedProfitUsd,400,'prediction profit calculated');
  A.eq(v.actualProfitUsd,325,'actual profit calculated');
  A.eq(v.profitVarianceUsd,-75,'prediction-vs-actual variance retained');
  store.remove();
  A.ok(!fs.existsSync(path.join(root,'enterprise-state.json')),'enterprise state can be cleanly removed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
A.report('enterprise-state.test');
