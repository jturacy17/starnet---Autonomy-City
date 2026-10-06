/* Media staffing blueprint. Planned positions are deliberately distinct from runtime agents. */
'use strict';
const CATEGORIES = [
 ['sports','Sports'], ['business-ai','Business / Money / AI'],
 ['comedy-viral','Comedy / Viral'], ['dating-relationships','Dating / Relationships'],
 ['gaming','Gaming'], ['streamer-pop-culture','Streamer / Pop Culture'],
 ['kids-a','Kids A'], ['kids-b','Kids B'], ['kids-c','Kids C']
];
const ROLES = [
 {id:'discovery',name:'Trend & Source Researcher',scope:'Find trending sources every 72 hours, understand the content, score clip opportunities and document source rights.'},
 {id:'production',name:'Clip & Video Editor',scope:'Select moments, trim, reframe for vertical viewing, caption, adjust audio and prepare separate YouTube Shorts, TikTok and Instagram Reels exports.'},
 {id:'distribution',name:'Publishing & Performance Operator',scope:'Prepare titles, descriptions and platform metadata; publish approved exports through connected accounts; record post IDs and measure performance.'}
];
function buildMediaPlan() {
 const managers=Array.from({length:4},(_,i)=>({id:'media-manager-'+(i+1),name:'Media Manager '+(i+1),workerIds:[],status:'planned'}));
 let index=0;
 const categories=CATEGORIES.map(([id,name])=>({id,name,status:'planned',workers:ROLES.map(role=>{
  const manager=managers[index++%4], workerId='media-'+id+'-'+role.id;
  manager.workerIds.push(workerId);
  return {id:workerId,name:role.name,role:role.id,scope:role.scope,managerId:manager.id,status:'planned'};
 })}));
 return {status:'awaiting_activation',workerCount:27,managerCount:4,managers,categories,
  discovery:{intervalHours:72,status:'not_scheduled'},
  contentPolicy:{editing:'Free editing tools only; no paid editing service.',eligibility:'Clip only owned or licensed sources with documented commercial reuse rights and verified platform monetization eligibility. Unknown eligibility blocks production.',economics:'Estimate model, hosting and processing costs before production. Revenue and positive profit are not guaranteed.'},
  workflow:['Trend discovery','Source rights verification','Clip selection & editing','Three platform exports','Manager quality review','Publish through connected accounts','Measure & improve'],
  platforms:['YouTube','TikTok','Instagram'].map(name=>({name,status:'not_connected'})),
  requirements:['Register the 31 planned positions with the execution harness and configure model budgets.',
   'Implement and verify video discovery, editing and platform publishing adapters.',
   'Connect platform accounts using developer OAuth applications; passwords are never entered in chat.',
   'Confirm owned or licensed source videos before production and publication.',
   'Use durable storage and an always-on scheduler for reliable 72-hour discovery.'],
  publishingEnabled:false};
}
module.exports={buildMediaPlan};
