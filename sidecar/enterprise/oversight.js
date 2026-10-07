/* sidecar/enterprise/oversight.js — Phase 1B management, board and CEO rollups.
   Pure calculations: agents produce work; managers own delivery; board evaluates manager/business health;
   CEO sees INFORM/WATCH/DECIDE instead of raw task noise. */
'use strict';

function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function pct(a,b){return b>0?Math.round((a/b)*1000)/10:100;}
function profitPerHumanHour(revenue,cost,minutes){
  const h=Math.max(0,num(minutes,0))/60;
  if(!h) return null;
  return Math.round(((num(revenue,0)-num(cost,0))/h)*100)/100;
}
function managerTeamHealth(team, now) {
  const t=team||{}, work=Array.isArray(t.work)?t.work:[], at=Math.max(0,num(now,0));
  const active=work.filter(w=>['queued','active','blocked','review'].includes(w.state));
  const completed=work.filter(w=>w.state==='done');
  const blocked=active.filter(w=>w.state==='blocked');
  const overdue=active.filter(w=>w.dueAt>0&&at>w.dueAt);
  const qualityRows=completed.filter(w=>num(w.quality,0)>0);
  const avgQuality=qualityRows.length?Math.round(qualityRows.reduce((s,w)=>s+num(w.quality,0),0)/qualityRows.length*10)/10:null;
  const corrections=Array.isArray(t.correctiveActions)?t.correctiveActions.filter(c=>c.status!=='resolved'):[];
  let health='healthy';
  if(blocked.length||overdue.length||corrections.length) health='watch';
  if(overdue.length>=3||blocked.length>=3||corrections.length>=2) health='at_risk';
  return {
    health,totalWork:work.length,active:active.length,completed:completed.length,blocked:blocked.length,overdue:overdue.length,
    onTimeRate:pct(completed.filter(w=>!w.dueAt||!w.completedAt||w.completedAt<=w.dueAt).length,completed.length),
    avgQuality,openCorrectiveActions:corrections.length,
    revenueUsd:Math.max(0,num(t.metrics&&t.metrics.revenueUsd,0)),costUsd:Math.max(0,num(t.metrics&&t.metrics.costUsd,0)),
    humanMinutes:Math.max(0,num(t.metrics&&t.metrics.humanMinutes,0))
  };
}
function boardReview(manager, experiments) {
  const m=manager||{}, ex=Array.isArray(experiments)?experiments:[];
  const completed=ex.filter(e=>e.status==='completed');
  const predicted=completed.reduce((s,e)=>s+num(e.predictedRevenueUsd,0)-num(e.predictedCostUsd,0),0);
  const actual=completed.reduce((s,e)=>s+num(e.actualRevenueUsd,0)-num(e.actualCostUsd,0),0);
  const forecastAccuracy=completed.length&&predicted!==0?Math.round((1-Math.min(1,Math.abs(actual-predicted)/Math.abs(predicted)))*1000)/10:null;
  const managerPerformance=m.health==='healthy'?'strong':m.health==='watch'?'needs_attention':'intervention_required';
  return {
    managerPerformance,businessHealth:m.health,
    forecastAccuracy,experimentCount:ex.length,completedExperiments:completed.length,
    profitPerHumanHour:profitPerHumanHour(m.revenueUsd,m.costUsd,m.humanMinutes),
    requiresBoardAction:m.health==='at_risk'
  };
}
function ceoBrief(board, decisions, recommendations) {
  const b=board||{}, d=Array.isArray(decisions)?decisions:[], r=Array.isArray(recommendations)?recommendations:[];
  const pending=d.filter(x=>x.status==='pending');
  const recDecisions=r.filter(x=>x.requiresCeoDecision===true);
  let attention='INFORM';
  if(pending.length||recDecisions.length||b.requiresBoardAction) attention='DECIDE';
  else if(b.businessHealth==='watch'||b.managerPerformance==='needs_attention') attention='WATCH';
  return {
    attention,
    headline: attention==='DECIDE'?'CEO decision required':attention==='WATCH'?'Business requires monitoring':'Business operating normally',
    pendingDecisions:pending.length,
    boardEscalations:b.requiresBoardAction?1:0,
    managerPerformance:b.managerPerformance||'unknown',
    businessHealth:b.businessHealth||'unknown',
    profitPerHumanHour:b.profitPerHumanHour==null?null:b.profitPerHumanHour
  };
}
function experimentVariance(experiment){
  const e=experiment||{};
  const predictedProfit=num(e.predictedRevenueUsd,0)-num(e.predictedCostUsd,0);
  const actualProfit=num(e.actualRevenueUsd,0)-num(e.actualCostUsd,0);
  return {
    predictedProfitUsd:Math.round(predictedProfit*100)/100,
    actualProfitUsd:Math.round(actualProfit*100)/100,
    profitVarianceUsd:Math.round((actualProfit-predictedProfit)*100)/100,
    predictedHumanMinutes:Math.max(0,num(e.predictedHumanMinutes,0)),
    actualHumanMinutes:Math.max(0,num(e.actualHumanMinutes,0))
  };
}
module.exports={profitPerHumanHour,managerTeamHealth,boardReview,ceoBrief,experimentVariance};
