'use strict';
const A=require('./_assert.js');
const M=require('../sidecar/enterprise/manager-loop.js');
const {buildBoardRollup}=require('../sidecar/enterprise/board-rollup.js');

const now=10_000;
const team={
 metrics:{revenueUsd:800,costUsd:200,humanMinutes:240},
 work:[
  {id:'critical-1',title:'Rights gate',ownerAgentId:'rights-analyst',state:'blocked',priority:'critical',dueAt:9000,blockedReason:'license unknown'},
  {id:'high-1',title:'Opportunity score',ownerAgentId:'sports-analyst',state:'active',priority:'high',dueAt:8000},
  {id:'review-1',title:'Clip review',ownerAgentId:'sports-producer',state:'review',priority:'normal',dueAt:9500},
  {id:'done-1',title:'Scout',ownerAgentId:'sports-scout',state:'done',priority:'normal',dueAt:7000,completedAt:6900,quality:88}
 ],
 correctiveActions:[
  {id:'c1',reason:'blocked:critical-1',ownerManagerId:'media-manager',status:'monitoring',openedAt:9100},
  {id:'c2',reason:'overdue:high-1',ownerManagerId:'media-manager',status:'open',openedAt:9200}
 ]
};

const ranked=M.rankWork(team,now);
A.eq(ranked[0].workId,'critical-1','critical blocked work is manager top priority');
A.ok(ranked[0].overdue,'overdue state is explicit');
const issues=M.diagnose(team,now);
A.ok(issues.some(i=>i.kind==='blocked'&&i.workId==='critical-1'),'manager detects blocked work');
A.ok(issues.some(i=>i.kind==='overdue'&&i.workId==='high-1'),'manager detects missed deadlines');
A.eq(M.escalationNeed(team,now).level,'board','material delivery risk escalates above manager');
A.ok(M.correctionPlan(team,now).every(c=>!['blocked:critical-1','overdue:high-1'].includes(c.reason)),'existing corrections are not duplicated');

const state={businesses:{media:{teams:{sports:team}}},experiments:[]};
const board=buildBoardRollup(state,now);
A.eq(board.managerId,'media-manager','Board evaluates the accountable manager');
A.ok(board.challenges.length>0,'Board independently challenges manager performance');
A.ok(board.requiresCeoDecision,'critical unresolved performance can become CEO decision');
A.ok(!Object.prototype.hasOwnProperty.call(board,'agentInstructions'),'Board rollup does not micromanage agents');

const healthy={businesses:{media:{teams:{sports:{
 metrics:{revenueUsd:1000,costUsd:200,humanMinutes:180},
 work:[{id:'d1',title:'Done',state:'done',priority:'normal',dueAt:9000,completedAt:8500,quality:95}],
 correctiveActions:[]
}}}},experiments:[]};
const h=buildBoardRollup(healthy,now);
A.eq(h.managerPerformance,'strong','healthy manager performance is recognized');
A.eq(h.requiresCeoDecision,false,'healthy operation does not interrupt CEO');
A.eq(h.challenges.length,0,'healthy manager is not challenged artificially');

A.report('enterprise-manager-board-loop.test');
