 'use strict';
const MediaHome = (() => {
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function render(data){
  const plan=data&&data.mediaPlan;
  const app=typeof App!=='undefined'?App:null;
  const member=id=>typeof MediaAgents!=='undefined'?MediaAgents.find(app,id):null;
  if(!plan)return '<h2>Media</h2><p>Media organization data is unavailable. Reopen this campus when the connection returns.</p><button data-ac-nav="hq">BACK TO COMMAND HQ</button>';
  return '<div class="ac-breadcrumb">CITY › MEDIA CAMPUS</div><div class="ac-kicker">MEDIA ORGANIZATION</div><h2>Media</h2>'
   +'<p class="ac-campus-copy">Nine category teams. Three specialist positions per category, supported by four managers with shared quality and escalation responsibilities.</p>'
   +'<div class="ac-media-kpis"><article><span>WORKER POSITIONS</span><b>'+plan.workerCount+'</b></article><article><span>MANAGERS</span><b>'+plan.managerCount+'</b></article><article><span>DISCOVERY PLAN</span><b>72 hours</b></article><article><span>AUTOMATION</span><b>Not active</b></article></div>'
   +'<div class="ac-media-command-row"><button data-media-nav="workforce">TEAMS & WORKFLOW</button><button data-media-nav="management">MANAGER OFFICE</button><button data-media-nav="rights">RIGHTS & MONETIZATION</button><button data-media-nav="sports-pilot">EXISTING SPORTS PILOT</button></div>'
   +'<h3 class="ac-section-title">MEDIA DIVISIONS</h3><div class="ac-division-grid">'
   +plan.categories.map(c=>'<button class="ac-division" data-media-nav="'+esc(c.id)+'"><b>'+esc(c.name)+'</b><span>Research · Edit · Publish</span><em>'+c.workers.filter(w=>member(w.id)).length+'/3 AGENTS CREATED</em></button>').join('')+'</div>'
   +'<h3 class="ac-section-title">PLATFORM CONNECTIONS</h3><div class="ac-simple-grid">'+plan.platforms.map(p=>'<p><b>'+esc(p.name)+'</b><br>Not connected</p>').join('')+'</div>'
   +'<p class="ac-campus-copy">Create your teams under Teams & Workflow. Created agents can receive work in StarNet; discovery is not scheduled and automatic publishing is not enabled.</p>'
   +'<div class="ac-panel-nav"><button data-ac-nav="hq">BACK TO COMMAND HQ</button></div>';
 }
 return {render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={MediaHome};
