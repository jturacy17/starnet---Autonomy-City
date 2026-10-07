'use strict';
// Use the same recruitment and persistence path as StarNet's normal agent bay.
const MediaAgents=(()=>{
 function roster(app){return app&&app.agents?app.agents():[];}
 function find(app,positionId){return roster(app).find(a=>a.specialtyId===positionId)||null;}
 function specs(plan,categoryId){
  if(!plan||!Array.isArray(plan.categories)||!Array.isArray(plan.managers))throw new Error('Media plan unavailable');
  const categories=categoryId?plan.categories.filter(c=>c.id===categoryId):plan.categories;
  if(!categories.length)throw new Error('Unknown Media category');
  const rules='Use only tools actually available. Report blockers; never claim edits, posts, revenue or account connections without evidence. Use free FFmpeg editing, not OpusClip. Clip only owned or commercially licensed sources with documented evidence; uncertain rights or monetization eligibility block production. Prefer 30–60 second clips but choose an appropriate duration. Do not create schedules, spend money or publish without configured tools, account authorization and approved content. Do not request passwords or tokens in chat. Record source URLs, decisions, costs and artifact paths. Creation of this agent does not start any jobs.';
  const rows=plan.managers.map(m=>({id:m.id,name:m.name,agentName:m.name,purpose:'Manage Media workers assigned to '+m.name+'.',manual:rules+'\nYour worker positions: '+m.workerIds.join(', ')+'. Coordinate with the other three managers. Review rights evidence, priorities, output quality and publication readiness. Balance workload and escalate unresolved blockers to the owner. Leadership assignments are instructions, not exclusive tool permissions.'}));
  for(const [ci,c] of plan.categories.entries()){
   if(!categories.some(x=>x.id===c.id))continue;
   for(const [ri,w] of c.workers.entries())rows.push({id:w.id,name:c.name+' '+w.name,agentName:'M'+(ci+1)+' '+['RESEARCH','EDITOR','PUBLISH'][ri],purpose:c.name+': '+w.scope,manual:rules+'\nCategory: '+c.name+'. Position: '+w.id+'. Report to '+w.managerId+'. '+w.scope+'\nResearch horizon: latest 1–3 days; discovery cadence target: every 72 hours once a scheduler is configured. Share findings with the other two category specialists and assigned manager. Use the existing harness and ask-mode tool consent. For editing, use scripts/render-media-clip.js only if FFmpeg and a reviewed local source are available. Social account connectors are not yet implemented.'});
  }
  return rows;
 }
 function roomName(plan,positionId){
  const c=plan.categories.find(c=>c.workers.some(w=>w.id===positionId));
  return c?'Media · '+c.name:'Media · Managers';
 }
 function ensureRoom(st,name){
  let room=st.rooms().find(r=>r.name===name);
  if(room)return room;
  const rect=st.roomSpots(12,9,'lab',1)[0];
  if(!rect)throw new Error('No valid space for '+name+'. Make space in StarNet Build mode and retry.');
  const result=st.addRoom({kind:'lab',name,rect});
  if(!result||!result.ok)throw new Error('Could not build '+name);
  return st.roomById(result.id);
 }
 function placeDesk(st,room,agentId){
  const existing=st.propsByAgent(agentId).find(p=>p.t==='desk');
  if(existing&&st.roomAt(existing.x,existing.y)===room.id)return;
  const rect=room.rects[0];
  for(let y=rect.y1+1;y<=rect.y2-2;y+=3){
   for(let x=rect.x1+1;x<=rect.x2-2;x+=3){
    if(!st.canPlaceProp('desk',x,y,2,1).ok||st.propAt(x,y+1)||st.propAt(x+1,y+1))continue;
    const result=existing?st.moveProp(existing.id,x-existing.x,y-existing.y):st.addProp({t:'desk',x,y,w:2,h:1,block:true});
    if(!result||!result.ok)continue;
    if(!existing){const bound=st.assignPropAgent(result.id,agentId);if(!bound.ok)throw new Error('Could not assign Media desk');}
    return;
   }
  }
  throw new Error('No desk space in '+room.name+'. Make space and retry.');
 }
 let creating=false;
 async function create(plan,categoryId,app){
  if(creating)throw new Error('Media agents are already being created');
  if(!app||!app.currentAgent||!app.currentAgent())throw new Error('Return to StarNet and finish waking your Overseer first. Then reopen Media.');
  if(!app.summonAgent||!app.configSynced)throw new Error('Agent recruitment is unavailable; reload StarNet.');
  const st=app.station&&app.station();
  if(!st||!st.roomSpots||!st.propsByAgent)throw new Error('Wake your Overseer in StarNet before building Media rooms.');
  creating=true;
  let created=0;
  try{
   for(const spec of specs(plan,categoryId)){
    const room=ensureRoom(st,roomName(plan,spec.id));
    const old=find(app,spec.id);
    if(old){placeDesk(st,room,old.id);app.persist();continue;}
    const a=app.summonAgent(spec,{desk:false,activate:false});
    if(!a)throw new Error('Could not create '+spec.name);
    created++;
    placeDesk(st,room,a.id);app.persist();
    if(!await app.configSynced())throw new Error('Agent created locally, but server sync failed. Reopen StarNet and retry; existing positions will not be duplicated.');
   }
   // Retry persistence even if all positions already exist after a failed earlier sync.
   if(app.pushRoster&&!await app.pushRoster())throw new Error('Could not sync Media roster to server. Retry after checking the connection.');
   return {created,total:specs(plan,categoryId).filter(s=>find(app,s.id)).length};
  }finally{creating=false;}
 }
 return {specs,find,create,roomName};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={MediaAgents};
