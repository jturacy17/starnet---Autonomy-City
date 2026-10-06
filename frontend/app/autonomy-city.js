/* frontend/app/autonomy-city.js — Phase 1 Autonomy City + Command HQ.
   Visual/navigation layer only. It never fabricates runtime/business truth: executive cards render
   from QuerySpine command-hq data; unavailable data is labeled unavailable. */
'use strict';
const AutonomyCity = (() => {
  let root=null, panel=null, status=null, unsub=null, lastCommand=null;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function buildingMarkup(id){
    if(id==='hq') return '<span class="ac-building ac-building-hq"><i class="ac-dome"></i><i class="ac-main"></i><i class="ac-wing l"></i><i class="ac-wing r"></i><i class="ac-steps"></i></span>';
    return '<span class="ac-building"><i></i><i></i><i></i></span>';
  }
  function campusCard(id,label,sub,state){
    const b=el('button','ac-campus ac-'+id);b.type='button';b.dataset.campus=id;
    b.innerHTML=buildingMarkup(id)+'<b>'+esc(label)+'</b><small>'+esc(sub)+'</small>'
      +'<em class="ac-state '+esc(state)+'">'+(state==='active'?'ACTIVE':state==='pilot'?'PILOT':'UNDER CONSTRUCTION')+'</em>';
    return b;
  }
  function buildShell(){
    if(document.getElementById('autonomy-city-root'))return;
    root=el('section','autonomy-city hidden');root.id='autonomy-city-root';root.setAttribute('aria-label','Autonomy City preview');
    root.innerHTML='<header class="ac-top"><div><strong>AUTONOMY CITY</strong><span>JT\'S SERVICE & SALE · PHASE 1</span></div>'
      +'<div class="ac-top-actions"><span id="ac-link-status" class="ac-link">ENTERPRISE DATA · CONNECTING</span><button id="ac-close" type="button">RETURN TO STARNET</button></div></header>'
      +'<div class="ac-world"><div class="ac-skyline" aria-hidden="true"></div><div class="ac-green g1"></div><div class="ac-green g2"></div><div class="ac-water" aria-hidden="true"></div>'
      +'<div class="ac-road r1"></div><div class="ac-road r2"></div><div class="ac-road r3"></div><div class="ac-road r4"></div><div class="ac-road r5"></div>'
      +'<div class="ac-plaza"><span>CEO COMMAND DISTRICT</span></div><div class="ac-mall" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div id="ac-campus-layer"></div>'
      +'<div class="ac-legend"><b>FIRST PASS</b><span>Campus layout + executive surface</span><span>Live activity appears only when proven by enterprise state.</span></div></div>'
      +'<aside id="ac-panel" class="ac-panel"><button id="ac-panel-close" type="button" aria-label="Close detail">×</button><div id="ac-panel-body"></div></aside>';
    document.body.appendChild(root);
    panel=root.querySelector('#ac-panel');status=root.querySelector('#ac-link-status');
    if(window.AutonomyRenderer&&AutonomyRenderer.mount)AutonomyRenderer.mount(root);
    const layer=root.querySelector('#ac-campus-layer');
    layer.append(
      campusCard('hq','COMMAND HQ','CEO · BOARD · STRATEGY','active'),
      campusCard('media','MEDIA CAMPUS','SPORTS CLIPPING PILOT','pilot'),
      campusCard('rnd','R&D / INNOVATION','SYSTEM LABS','active'),
      campusCard('commerce','COMMERCE','FUTURE OPERATIONS','construction'),
      campusCard('agency','AGENCY','FUTURE OPERATIONS','construction'),
      campusCard('finance','FINANCE','FUTURE OPERATIONS','construction')
    );
    root.querySelector('#ac-close').onclick=close;
    root.querySelector('#ac-panel-close').onclick=()=>panel.classList.remove('open');
    layer.addEventListener('click',e=>{const btn=e.target.closest('[data-campus]');if(btn)openCampus(btn.dataset.campus);});
    panel.addEventListener('click',e=>{const nav=e.target.closest('[data-ac-nav]');if(nav){openCampus(nav.dataset.acNav);return;}const media=e.target.closest('[data-media-nav]');if(media)openMedia(media.dataset.mediaNav);});
  }
  function renderUnavailable(){
    panel.querySelector('#ac-panel-body').innerHTML=
      '<div class="ac-breadcrumb">CITY › COMMAND DISTRICT</div><div class="ac-kicker">COMMAND HQ</div><h2>Executive Brief</h2>'
      +'<div class="ac-unavailable"><b>ENTERPRISE DATA LINK NOT ACTIVE YET</b><p>No executive metrics are being invented. The city remains navigable while the data connection is unavailable.</p></div>'
      +'<div class="ac-tabs"><span>INFORM</span><span>WATCH</span><span>DECIDE</span></div>';
  }
  function cards(items,kind){
    return (items||[]).map(x=>'<article class="ac-brief-card '+kind+'"><b>'+esc(x.title||x.id)+'</b><span>'+esc(x.value!=null?x.value:(x.detail||x.recommendation||''))+'</span></article>').join('');
  }
  function renderBrief(data){
    if(!data||data.surface!=='command_hq'){renderUnavailable();return;}
    const decide=data.decide||{count:0,decisions:[],recommendations:[]},watch=data.watch||{count:0,items:[]},inform=data.inform||{count:0,items:[]};
    const fin=data.portfolio&&data.portfolio.financials?data.portfolio.financials:{};
    const opp=data.portfolio&&data.portfolio.opportunities?data.portfolio.opportunities:{};
    panel.querySelector('#ac-panel-body').innerHTML=
      '<div class="ac-breadcrumb">CITY › COMMAND DISTRICT › EXECUTIVE BRIEF</div><div class="ac-kicker">COMMAND HQ · '+esc(data.attention)+'</div><h2>'+esc(data.headline)+'</h2>'
      +'<div class="ac-hq-metrics"><article><span>PROFIT</span><b>$'+Number(fin.profitUsd||0).toFixed(2)+'</b></article><article><span>CEO TIME</span><b>'+Number(fin.humanMinutes||0)+'m</b></article><article><span>OPPORTUNITIES</span><b>'+Number(opp.total||0)+'</b></article></div>'
      +'<div class="ac-exec-grid"><section><h3>DECIDE <i>'+Number(decide.count||0)+'</i></h3>'+cards([...(decide.decisions||[]),...(decide.recommendations||[])],'decide')+'</section>'
      +'<section><h3>WATCH <i>'+Number(watch.count||0)+'</i></h3>'+cards(watch.items||[],'watch')+'</section>'
      +'<section><h3>INFORM <i>'+Number(inform.count||0)+'</i></h3>'+cards(inform.items||[],'inform')+'</section></div>'
      +'<div class="ac-panel-nav"><button data-ac-nav="media">ENTER MEDIA CAMPUS</button><button data-ac-nav="rnd">ENTER R&D</button></div>';
  }
  function mediaDetail(){ return window.MediaHome&&MediaHome.render?MediaHome.render(lastCommand):'<h2>Media</h2>'; }
  function openMedia(id){
    panel.classList.add('open');
    let html='';
    if(!id||id==='home') html=mediaDetail();
    else if(id==='sports'&&window.MediaSports) html=MediaSports.render(lastCommand);
    else if(id==='management'&&window.MediaManagement) html=MediaManagement.render(lastCommand);
    else if(id==='rights'&&window.MediaRights) html=MediaRights.render(lastCommand);
    else if(id==='performance'&&window.MediaPerformance) html=MediaPerformance.render(lastCommand);
    else if(id==='workforce'&&window.MediaWorkforce) html=MediaWorkforce.render(lastCommand);
    else if(window.MediaFuture) html=MediaFuture.render(id);
    else html='<h2>Media</h2>';
    panel.querySelector('#ac-panel-body').innerHTML=html;
  }
  function rndDetail(){
    return '<div class="ac-breadcrumb">CITY › R&D / INNOVATION</div><div class="ac-kicker">SYSTEM CAMPUS</div><h2>R&D / Innovation</h2>'
      +'<p class="ac-campus-copy">This campus is reserved for enterprise architecture, workflow experiments, agent capability research, and controlled system development.</p>'
      +'<div class="ac-campus-room-grid"><article><b>ARCHITECTURE LAB</b><span>Enterprise control and policy design</span><em>ACTIVE</em></article><article><b>EXPERIMENT BAY</b><span>Workflow and capability prototypes</span><em>ACTIVE</em></article><article><b>SAFETY LAB</b><span>Permissions, autonomy and failure controls</span><em>ACTIVE</em></article><article><b>FUTURE SYSTEMS</b><span>Reserved expansion</span><em>PLANNED</em></article></div>'
      +'<div class="ac-panel-nav"><button data-ac-nav="hq">BACK TO COMMAND HQ</button></div>';
  }
  function constructionDetail(id){
    const names={commerce:'COMMERCE',agency:'AGENCY',finance:'FINANCE'};
    return '<div class="ac-breadcrumb">CITY › '+names[id]+'</div><div class="ac-kicker">EXPANSION CAMPUS</div><h2>'+names[id]+'</h2>'
      +'<div class="ac-construction-card"><b>UNDER CONSTRUCTION</b><p>This campus is intentionally reserved. No operational automation is enabled here in Phase 1.</p></div>'
      +'<div class="ac-panel-nav"><button data-ac-nav="hq">BACK TO COMMAND HQ</button></div>';
  }
  function openCampus(id){
    panel.classList.add('open');
    if(id==='hq'){renderBrief(lastCommand);return;}
    if(id==='media')openMedia('home');
    else if(id==='rnd')panel.querySelector('#ac-panel-body').innerHTML=rndDetail();
    else panel.querySelector('#ac-panel-body').innerHTML=constructionDetail(id);
  }
  function connectData(){
    if(!window.QuerySpine||!QuerySpine.subscribe){status.textContent='ENTERPRISE DATA · MODULE UNAVAILABLE';return;}
    if(unsub)return;
    try{
      unsub=QuerySpine.subscribe('command-hq',snap=>{
        if(snap.hasData&&!snap.error){lastCommand=snap.data;status.textContent='ENTERPRISE DATA · LIVE';status.classList.add('live');}
        else if(snap.error){status.textContent='ENTERPRISE DATA · NOT CONNECTED';status.classList.remove('live');}
        else status.textContent='ENTERPRISE DATA · CONNECTING';
        if(panel&&panel.classList.contains('open')){
          const crumb=panel.querySelector('.ac-breadcrumb');
          if(crumb&&/COMMAND DISTRICT/.test(crumb.textContent))renderBrief(lastCommand);
        }
      },{refresh:true});
    }catch(_){status.textContent='ENTERPRISE DATA · NOT CONNECTED';}
  }
  function open(){buildShell();root.classList.remove('hidden');requestAnimationFrame(()=>root.classList.add('shown'));connectData();}
  function close(){if(!root)return;root.classList.remove('shown');setTimeout(()=>root.classList.add('hidden'),180);if(unsub){unsub();unsub=null;}}
  function installLauncher(){if(document.getElementById('autonomy-city-launch'))return;const btn=el('button','ac-launch','AUTONOMY CITY');btn.id='autonomy-city-launch';btn.type='button';btn.title='Open the Phase 1 Autonomy City view';btn.onclick=open;document.body.appendChild(btn);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLauncher);else installLauncher();
  return {open,close};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyCity};
