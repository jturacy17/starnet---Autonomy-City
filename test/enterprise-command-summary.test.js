'use strict';
const A=require('./_assert.js');
const {buildCommandSummary}=require('../sidecar/enterprise/command-summary.js');

const state={
 businesses:{media:{teams:{sports:{
  metrics:{revenueUsd:1000,costUsd:300,humanMinutes:240},
  work:[
   {id:'w1',title:'Rights gate',state:'blocked',priority:'critical',dueAt:9000,blockedReason:'license unknown'},
   {id:'w2',title:'Scout',state:'done',priority:'normal',dueAt:7000,completedAt:6900,quality:91}
  ],
  correctiveActions:[
   {id:'c1',reason:'blocked:w1',ownerManagerId:'media-manager',status:'open',openedAt:9100},
   {id:'c2',reason:'overdue:w1',ownerManagerId:'media-manager',status:'monitoring',openedAt:9200}
  ]
 }}}},
 opportunities:[
  {id:'o1',title:'Highlight',status:'blocked'},
  {id:'o2',title:'Interview',status:'active'}
 ],
 decisions:[
  {id:'d1',title:'Approve $180 test',type:'capital',status:'pending',amountUsd:180,requestedBy:'board'}
 ],
 recommendations:[
  {id:'r1',title:'Hold expansion',recommendation:'Require recovery plan',confidence:82,upside:'Reduce waste',downside:'Slower scale',requiresCeoDecision:true,evidence:['two unresolved corrections'],disagreement:['growth prefers faster scale']}
 ],
 experiments:[
  {id:'e1',status:'completed',predictedRevenueUsd:500,predictedCostUsd:100,actualRevenueUsd:450,actualCostUsd:125}
 ],
 financialEntries:[
  {id:'f1',kind:'revenue',usd:450},{id:'f2',kind:'model_cost',usd:25}
 ],
 humanTimeEntries:[{id:'t1',kind:'ceo_review',minutes:10}]
};

const brief=buildCommandSummary(state,10000);
A.eq(brief.surface,'command_hq','brief is shaped for Command HQ');
A.eq(brief.attention,'DECIDE','material items dominate CEO attention');
A.eq(brief.decide.count,2,'CEO sees pending decisions and decision-grade recommendations');
A.eq(brief.watch.count,1,'management issue is summarized as one watch item');
A.eq(brief.inform.items.find(i=>i.id==='manager-performance').value,'intervention_required','CEO sees manager performance assessment');
A.eq(brief.portfolio.opportunities.total,2,'portfolio summarizes opportunities');
A.eq(brief.portfolio.experiments.actualProfitUsd,325,'experiment actual profit rolls up');
A.eq(brief.portfolio.financials.profitUsd,425,'financial ledger rolls up to profit');
A.eq(brief.portfolio.financials.humanMinutes,10,'CEO human time is visible');
A.ok(brief.decide.decisions[0].drilldown.kind==='decision','decision item has drilldown path');
A.ok(brief.inform.items.every(i=>i.drilldown),'inform cards are drillable');
A.ok(!Object.prototype.hasOwnProperty.call(brief,'work'),'raw work queue is absent from CEO surface');
A.ok(!Object.prototype.hasOwnProperty.call(brief,'agents'),'raw agent roster is absent from CEO surface');
A.eq(brief.navigation.decisions.target,'command/decisions','executive navigation exposes Decisions');

const healthy={businesses:{media:{teams:{sports:{metrics:{},work:[],correctiveActions:[]}}}},decisions:[],recommendations:[],opportunities:[],experiments:[],financialEntries:[],humanTimeEntries:[]};
const normal=buildCommandSummary(healthy,20000);
A.eq(normal.attention,'INFORM','healthy business does not manufacture CEO work');
A.eq(normal.decide.count,0,'healthy business has no fake decision');
A.eq(normal.watch.count,0,'healthy business has no fake watch item');

A.report('enterprise-command-summary.test');
