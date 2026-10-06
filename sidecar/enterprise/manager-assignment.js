/* sidecar/enterprise/manager-assignment.js — manager-owned assignment of Sports work.
   Managers assign accountable work to executor agents. Agents never create or approve their own management work. */
'use strict';

function clip(v,n){return String(v==null?'':v).trim().slice(0,n);}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:d;}
const SPORTS_EXECUTORS=new Set(['sports-scout','sports-analyst','rights-analyst','sports-producer','performance-analyst']);

function makeManagerAssignment(store,clock){
  if(!store||typeof store.update!=='function') throw new Error('makeManagerAssignment: store required');
  clock=clock||{now:()=>0};
  const now=()=>Math.max(0,Number(clock.now())||0);

  function assign(input){
    const x=input||{}, managerId=clip(x.managerId,120), workId=clip(x.id,120), title=clip(x.title,240), agentId=clip(x.agentId,120);
    if(managerId!=='media-manager') throw new Error('enterprise: only Media Manager may assign Sports work');
    if(!workId||!title) throw new Error('enterprise: work id + title required');
    if(!SPORTS_EXECUTORS.has(agentId)) throw new Error('enterprise: invalid Sports executor');
    return store.update(state=>{
      const team=state.businesses.media.teams.sports;
      if(team.work.some(w=>w.id===workId)) return state;
      team.work.push({
        id:workId,title,ownerAgentId:agentId,state:'queued',
        priority:['low','normal','high','critical'].includes(x.priority)?x.priority:'normal',
        dueAt:Math.max(0,num(x.dueAt,0)),createdAt:now(),completedAt:0,blockedReason:'',
        quality:0,costUsd:0,humanMinutes:0
      });
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:managerId,action:'manager.work.assigned',targetId:workId,detail:agentId+': '+title,at:now()});
      return state;
    }).value;
  }

  function markReviewed(input){
    const x=input||{}, managerId=clip(x.managerId,120), workId=clip(x.id,120);
    if(managerId!=='media-manager') throw new Error('enterprise: only Media Manager may review Sports work');
    const verdict=clip(x.verdict,40);
    if(!['accepted','rework','rejected'].includes(verdict)) throw new Error('enterprise: invalid work review');
    return store.update(state=>{
      const w=state.businesses.media.teams.sports.work.find(v=>v.id===workId);
      if(!w) throw new Error('enterprise: work not found');
      if(w.state!=='review') throw new Error('enterprise: work is not awaiting review');
      if(verdict==='accepted'){w.state='done';w.completedAt=now();w.quality=Math.max(0,Math.min(100,num(x.quality,0)));}
      else if(verdict==='rework'){w.state='queued';w.blockedReason=clip(x.reason,280);}
      else {w.state='cancelled';w.blockedReason=clip(x.reason,280);}
      state.audit.push({id:'audit-'+(state.audit.length+1)+'-'+now(),actorId:managerId,action:'manager.work.'+verdict,targetId:workId,detail:clip(x.reason,600),at:now()});
      return state;
    }).value;
  }

  return {assign,markReviewed,SPORTS_EXECUTORS};
}
module.exports={makeManagerAssignment,SPORTS_EXECUTORS};
