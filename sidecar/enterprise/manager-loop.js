/* sidecar/enterprise/manager-loop.js — deterministic manager operating loop for Phase 1.
   Converts team state into priorities, corrective-action proposals, and escalation needs.
   It does not execute agent work or make CEO/Board decisions. */
'use strict';

function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}
const PRIORITY_WEIGHT={critical:400,high:300,normal:200,low:100};
const STATE_WEIGHT={blocked:80,review:60,active:40,queued:20};

function rankWork(team, now){
  const at=Math.max(0,num(now,0));
  const work=Array.isArray(team&&team.work)?team.work:[];
  return work.filter(w=>['queued','active','blocked','review'].includes(w.state)).map(w=>{
    const overdue=w.dueAt>0&&at>w.dueAt;
    const dueSoon=w.dueAt>0&&!overdue&&(w.dueAt-at)<=3600000;
    const score=(PRIORITY_WEIGHT[w.priority]||200)+(STATE_WEIGHT[w.state]||0)+(overdue?200:0)+(dueSoon?75:0);
    return {
      workId:w.id,title:w.title,agentId:w.ownerAgentId,state:w.state,priority:w.priority,
      dueAt:w.dueAt||0,overdue,dueSoon,score
    };
  }).sort((a,b)=>(b.score-a.score)||((a.dueAt||Infinity)-(b.dueAt||Infinity))||a.workId.localeCompare(b.workId));
}

function diagnose(team, now){
  const at=Math.max(0,num(now,0));
  const work=Array.isArray(team&&team.work)?team.work:[];
  const issues=[];
  for(const w of work){
    if(w.state==='blocked') issues.push({kind:'blocked',workId:w.id,severity:w.priority==='critical'?'critical':'high',reason:clip(w.blockedReason,280)||'work blocked'});
    if(['queued','active','review'].includes(w.state)&&w.dueAt>0&&at>w.dueAt) issues.push({kind:'overdue',workId:w.id,severity:w.priority==='critical'?'critical':'high',reason:'deadline missed'});
    if(w.state==='review'&&w.dueAt>0&&at>w.dueAt) issues.push({kind:'review_delay',workId:w.id,severity:'high',reason:'manager review overdue'});
  }
  return issues;
}

function correctionPlan(team, now){
  const issues=diagnose(team,now);
  const existing=new Set((Array.isArray(team&&team.correctiveActions)?team.correctiveActions:[]).filter(c=>c.status!=='resolved').map(c=>String(c.reason||'')));
  return issues.filter(i=>!existing.has(i.kind+':'+i.workId)).map(i=>({
    id:'auto-'+i.kind+'-'+i.workId,
    reason:i.kind+':'+i.workId,
    detail:i.reason,
    severity:i.severity,
    workId:i.workId
  }));
}

function escalationNeed(team, now){
  const issues=diagnose(team,now);
  const critical=issues.filter(i=>i.severity==='critical');
  const high=issues.filter(i=>i.severity==='high');
  if(critical.length>=1||high.length>=3) return {level:'board',reason:'material delivery risk',issueCount:issues.length};
  if(issues.length) return {level:'manager',reason:'manager correction required',issueCount:issues.length};
  return {level:'none',reason:'operating normally',issueCount:0};
}

module.exports={rankWork,diagnose,correctionPlan,escalationNeed};
