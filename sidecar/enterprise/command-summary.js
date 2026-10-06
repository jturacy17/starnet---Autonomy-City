/* sidecar/enterprise/command-summary.js — Command HQ executive briefing model.
   Converts Board + enterprise state into a concise CEO surface. Raw agent/task noise stays below this layer. */
'use strict';

const { buildBoardRollup } = require('./board-rollup.js');
const { experimentVariance } = require('./oversight.js');

function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function money(v){return Math.round(num(v,0)*100)/100;}

function pendingDecisions(state){
  return (Array.isArray(state&&state.decisions)?state.decisions:[])
    .filter(d=>d.status==='pending'||d.status==='more_info')
    .map(d=>({
      id:d.id,title:d.title,type:d.type,amountUsd:money(d.amountUsd),
      requestedBy:d.requestedBy,status:d.status,
      drilldown:{kind:'decision',id:d.id}
    }));
}

function decisionRecommendations(state){
  return (Array.isArray(state&&state.recommendations)?state.recommendations:[])
    .filter(r=>r.requiresCeoDecision===true)
    .map(r=>({
      id:r.id,title:r.title,recommendation:r.recommendation,
      confidence:r.confidence,upside:r.upside,downside:r.downside,
      evidence:r.evidence,disagreement:r.disagreement,
      drilldown:{kind:'recommendation',id:r.id}
    }));
}

function opportunitySummary(state){
  const rows=Array.isArray(state&&state.opportunities)?state.opportunities:[];
  const counts={active:0,blocked:0,rejected:0,paused:0,completed:0};
  for(const row of rows) if(counts[row.status]!=null) counts[row.status]++;
  return {total:rows.length,counts};
}

function experimentSummary(state){
  const rows=Array.isArray(state&&state.experiments)?state.experiments:[];
  const completed=rows.filter(e=>e.status==='completed');
  const variances=completed.map(experimentVariance);
  const predictedProfit=variances.reduce((s,v)=>s+v.predictedProfitUsd,0);
  const actualProfit=variances.reduce((s,v)=>s+v.actualProfitUsd,0);
  return {
    total:rows.length,completed:completed.length,
    predictedProfitUsd:money(predictedProfit),
    actualProfitUsd:money(actualProfit),
    profitVarianceUsd:money(actualProfit-predictedProfit)
  };
}

function financeSummary(state){
  const fin=Array.isArray(state&&state.financialEntries)?state.financialEntries:[];
  const time=Array.isArray(state&&state.humanTimeEntries)?state.humanTimeEntries:[];
  let revenueUsd=0,costUsd=0;
  for(const row of fin){
    const amount=Math.max(0,num(row.usd,0));
    if(row.kind&&/revenue/i.test(row.kind)) revenueUsd+=amount;
    else costUsd+=amount;
  }
  const humanMinutes=time.reduce((s,row)=>s+Math.max(0,num(row.minutes,0)),0);
  const hours=humanMinutes/60;
  return {
    revenueUsd:money(revenueUsd),costUsd:money(costUsd),profitUsd:money(revenueUsd-costUsd),
    humanMinutes,
    profitPerHumanHour:hours>0?money((revenueUsd-costUsd)/hours):null
  };
}

function buildCommandSummary(state,now){
  const board=buildBoardRollup(state,now);
  const decisions=pendingDecisions(state);
  const recommendations=decisionRecommendations(state);
  const watch=[];
  if(board.businessHealth==='watch'||board.businessHealth==='at_risk'){
    watch.push({
      id:'media-sports-health',
      title:'Media / Sports requires management attention',
      detail:board.recommendation,
      owner:'media-manager',
      confidence:board.confidence,
      drilldown:{kind:'business',id:'media/sports'}
    });
  }

  const inform=[
    {id:'business-health',title:'Media / Sports health',value:board.businessHealth,drilldown:{kind:'business',id:'media/sports'}},
    {id:'manager-performance',title:'Media Manager performance',value:board.managerPerformance,drilldown:{kind:'manager',id:'media-manager'}},
    {id:'profit-human-hour',title:'Profit per human hour',value:board.profitPerHumanHour,drilldown:{kind:'finance',id:'media/sports'}}
  ];

  const decisionCount=decisions.length+recommendations.length;
  const attention=decisionCount||board.requiresCeoDecision?'DECIDE':watch.length?'WATCH':'INFORM';

  return {
    surface:'command_hq',
    generatedAt:Math.max(0,num(now,0)),
    attention,
    headline:attention==='DECIDE'
      ? 'Business operating with '+decisionCount+' CEO decision item'+(decisionCount===1?'':'s')
      : attention==='WATCH'
        ? 'Business operating; management issue under correction'
        : 'Business operating normally',
    decide:{count:decisionCount,decisions,recommendations},
    watch:{count:watch.length,items:watch},
    inform:{count:inform.length,items:inform},
    board:{
      managerPerformance:board.managerPerformance,
      businessHealth:board.businessHealth,
      challenges:board.challenges,
      recommendation:board.recommendation,
      confidence:board.confidence,
      requiresCeoDecision:board.requiresCeoDecision
    },
    portfolio:{
      opportunities:opportunitySummary(state),
      experiments:experimentSummary(state),
      financials:financeSummary(state)
    },
    navigation:{
      city:{label:'City',target:'world'},
      decisions:{label:'Decisions',target:'command/decisions'},
      brief:{label:'Brief',target:'command/brief'},
      alerts:{label:'Alerts',target:'command/alerts'},
      command:{label:'Command',target:'command'}
    }
  };
}

module.exports={buildCommandSummary,pendingDecisions,decisionRecommendations,opportunitySummary,experimentSummary,financeSummary};
