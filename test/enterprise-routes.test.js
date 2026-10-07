'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const A=require('./_assert.js');
const {makeEnterpriseRoutes}=require('../sidecar/enterprise/routes.js');

const root=fs.mkdtempSync(path.join(os.tmpdir(),'starnet-enterprise-routes-'));
try{
  const enterprise=makeEnterpriseRoutes({fs,path,workspaces:root,now:()=>12345});
  A.eq(enterprise.routes.length,1,'enterprise route module exposes one Phase 1 route');
  A.eq(enterprise.routes[0].m,'GET','Command HQ endpoint is read-only');
  A.eq(enterprise.routes[0].exact,'/api/enterprise/command','Command HQ endpoint path is stable');

  let code=0,headers={},body='';
  const res={writeHead:(c,h)=>{code=c;headers=h||{};},end:v=>{body=String(v||'');}};
  enterprise.routes[0].h({},res);
  const payload=JSON.parse(body);
  A.eq(code,200,'Command HQ endpoint returns 200 from durable default state');
  A.eq(headers['Cache-Control'],'no-store','executive truth is never browser-cache asserted');
  A.eq(payload.surface,'command_hq','endpoint returns Command HQ model');
  A.eq(payload.generatedAt,12345,'endpoint uses injected clock');
  A.eq(payload.attention,'INFORM','empty healthy default does not manufacture CEO work');
  A.ok(!Object.prototype.hasOwnProperty.call(payload,'work'),'endpoint does not expose raw work queue');
  A.ok(!Object.prototype.hasOwnProperty.call(payload,'agents'),'endpoint does not expose raw agent roster');

  enterprise.store.update(state=>{
    state.decisions.push({id:'d1',type:'capital',title:'Approve pilot spend',status:'pending',requestedBy:'board',amountUsd:75,createdAt:1});
    return state;
  });
  code=0;body='';enterprise.routes[0].h({},res);
  const changed=JSON.parse(body);
  A.eq(changed.attention,'DECIDE','durable CEO decision immediately changes executive endpoint');
  A.eq(changed.decide.count,1,'pending decision reaches Command HQ');
}finally{fs.rmSync(root,{recursive:true,force:true});}
A.report('enterprise-routes.test');
