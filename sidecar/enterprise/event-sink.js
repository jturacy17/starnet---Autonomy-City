/* sidecar/enterprise/event-sink.js — compose enterprise runtime folding with StarNet's existing emit seam.
   Enterprise observation is fail-safe for the business state and never replaces the canonical emitter. */
'use strict';

function makeEnterpriseEventSink(options){
  const opts=options||{};
  const bridge=opts.bridge;
  const downstream=typeof opts.emit==='function'?opts.emit:function(){};
  const onIssue=typeof opts.onIssue==='function'?opts.onIssue:function(){};
  if(!bridge||typeof bridge.handle!=='function') throw new Error('makeEnterpriseEventSink: bridge required');
  return function enterpriseAwareEmit(name,payload){
    try { bridge.handle(name,payload); }
    catch(error){ try{onIssue(error,{name,payload});}catch(_){} }
    return downstream(name,payload);
  };
}
module.exports={makeEnterpriseEventSink};
