'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const WM=require('../frontend/app/worldmodel');
const {MediaAgents}=require('../frontend/app/media-agents');
const {buildMediaPlan}=require('../sidecar/enterprise/media-plan');
function bridge(){
 const crew=[],st=WM.create();let sync=true;
 return {agents:()=>crew,currentAgent:()=>({id:'agent',model:'test'}),station:()=>st,persist:()=>{},
  summonAgent(spec,opts){assert.equal(opts.activate,false);assert.equal(opts.desk,false);const a={id:'agent'+crew.length,specialtyId:spec.id,docs:{purpose:spec.purpose,manual:spec.manual}};crew.push(a);return a;},
  configSynced:async()=>sync,pushRoster:async()=>sync,setSync:v=>{sync=v;}};
}
test('creates 31 usable crew members with rooms and bound desks, retries without duplicates, preserves existing floor',async()=>{
 const app=bridge(),plan=buildMediaPlan(),original=app.station().rooms()[0];
 const result=await MediaAgents.create(plan,null,app);
 assert.equal(result.created,31);assert.equal(app.agents().length,31);
 assert.equal(app.station().rooms().length,11);
 assert.equal(app.station().roomById(original.id).name,original.name);
 for(const a of app.agents()){
  const desk=app.station().propsByAgent(a.id).find(p=>p.t==='desk');assert.ok(desk);
  const room=app.station().roomById(app.station().roomAt(desk.x,desk.y));
  assert.equal(room.name,MediaAgents.roomName(plan,a.specialtyId));
  assert.match(a.docs.manual,/never claim edits/);
 }
 assert.equal((await MediaAgents.create(plan,null,app)).created,0);
 assert.equal(app.station().props().length,31);
});
test('category creation and failed sync can resume without silently claiming success',async()=>{
 const app=bridge(),plan=buildMediaPlan();app.setSync(false);
 await assert.rejects(MediaAgents.create(plan,'sports',app),/sync failed/);
 assert.equal(app.agents().length,1);
 app.setSync(true);
 const result=await MediaAgents.create(plan,'sports',app);
 assert.equal(result.total,7);assert.equal(result.created,6);
 assert.equal(app.station().rooms().length,3);
 await assert.rejects(MediaAgents.create(plan,'missing',app),/Unknown/);
});
