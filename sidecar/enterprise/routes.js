/* sidecar/enterprise/routes.js — read-only HTTP surface for StarNetOS enterprise state.
   Phase 1 exposes executive truth only; mutations remain behind the enterprise operations layer. */
'use strict';

const { makeEnterpriseStateStore } = require('./state-store.js');
const { buildCommandSummary } = require('./command-summary.js');

function makeEnterpriseRoutes(deps) {
  deps=deps||{};
  if(!deps.fs||!deps.path||!deps.workspaces) throw new Error('makeEnterpriseRoutes: fs + path + workspaces required');
  const now=typeof deps.now==='function'?deps.now:()=>0;
  const store=deps.store||makeEnterpriseStateStore({
    fs:deps.fs,path:deps.path,workspaces:deps.workspaces,
    writeDurable:deps.writeDurable,onIssue:deps.onIssue
  });

  function json(res,code,payload){
    res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify(payload));
  }

  function handleCommand(_req,res){
    const loaded=store.read();
    if(!loaded||!loaded.value) return json(res,503,{ok:false,error:'enterprise state unavailable'});
    return json(res,200,buildCommandSummary(loaded.value,now()));
  }

  return {
    store,
    routes:Object.freeze([
      Object.freeze({m:'GET',exact:'/api/enterprise/command',h:handleCommand})
    ])
  };
}

module.exports={makeEnterpriseRoutes};
