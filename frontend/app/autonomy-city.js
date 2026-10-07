/* frontend/app/autonomy-city.js — Phase 1 Autonomy City + Command HQ.
   Visual/navigation layer only. It never fabricates runtime/business truth: executive cards render
   from QuerySpine command-hq data; unavailable data is labeled unavailable. */
'use strict';
const AutonomyCity = (() => {
  let root=null, panel=null, status=null, unsub=null, lastCommand=null;

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function buildingMarkup(id){
    const base='<rect x="18" y="15" width="184" height="108" rx="18" fill="#d2d8c6"/><path d="M28 69h164M110 22v94" stroke="#b0baaa" stroke-width="3"/>';
    const civic='<rect x="40" y="42" width="140" height="46" rx="3" fill="#ede4ce" stroke="#8f998e" stroke-width="2"/><path d="M49 47h122M49 55h122M49 75h122M49 83h122" stroke="#c4bca5" stroke-width="2"/><rect x="84" y="25" width="52" height="80" rx="3" fill="#f7eed7" stroke="#a8a58e" stroke-width="2"/><circle class="ac-dome" cx="110" cy="64" r="24" fill="#7a9d92" stroke="#eee6cf" stroke-width="7"/><circle cx="110" cy="64" r="13" fill="#aec4ae" stroke="#5d8277" stroke-width="2"/><path d="M83 107h54m-58 5h62m-67 5h72" stroke="#a7af9e" stroke-width="3"/>';
    const media='<rect x="40" y="31" width="83" height="68" rx="5" fill="#c79764" stroke="#8b7253" stroke-width="3"/><rect x="49" y="40" width="65" height="50" rx="2" fill="#e2c398"/><path d="M50 52h62M50 65h62M50 78h62" stroke="#bc985f" stroke-width="3"/><rect x="134" y="43" width="41" height="60" rx="3" fill="#a6b6ad" stroke="#617d75" stroke-width="3"/><circle cx="154" cy="61" r="10" fill="#d5ddd1"/><path d="m147 60 18-9" stroke="#617d75" stroke-width="3"/>';
    const lab='<path d="M42 32h137v27H69v43H42z" fill="#6fadb5" stroke="#3f707c" stroke-width="3"/><path d="M83 73h96v30H83z" fill="#aed1ce" stroke="#638f97" stroke-width="3"/><path d="M52 36v17m16-17v17m16-17v17m16-17v17m16-17v17m16-17v17m16-17v17m16-17v17M95 78v20m17-20v20m17-20v20m17-20v20m17-20v20" stroke="#dcebe0" stroke-width="2"/><circle cx="114" cy="63" r="9" fill="#e5ddba"/>';
    const future='<rect x="40" y="29" width="138" height="78" rx="4" fill="#c2cab9" stroke="#8c9b89" stroke-width="2" stroke-dasharray="6 5"/><path d="M59 45h99v44H59zM108 45v44M59 67h99" fill="none" stroke="#a1af9a" stroke-width="2"/><path d="M161 40v59m-14-46h27" stroke="#c1a570" stroke-width="4"/><circle cx="48" cy="99" r="4" fill="#b69260"/>';
    return '<span class="ac-building '+(id==='hq'?'ac-building-hq':'')+'"><svg viewBox="0 0 220 140" aria-hidden="true">'+base+(id==='hq'?civic:id==='media'?media:id==='rnd'?lab:future)+'<g fill="#567c60" stroke="#88a27d" stroke-width="2"><circle cx="28" cy="29" r="9"/><circle cx="190" cy="113" r="9"/><circle cx="29" cy="109" r="7"/><circle cx="191" cy="27" r="7"/></g></svg></span>';
  }
  function mapLandscape(){
    return '<svg class="ac-landscape" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">'
      +'<defs><pattern id="ac-tree-pattern" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="8" fill="#3b6453"/><circle cx="13" cy="12" r="4" fill="#4b7560"/></pattern></defs>'
      +'<rect x="20" y="20" width="1160" height="660" rx="36" fill="#284a40" stroke="#5f807066"/>'
      +'<rect x="44" y="44" width="1112" height="612" rx="26" fill="none" stroke="#637267" stroke-width="18"/>'
      +'<path d="M53 350h1094M415 52v596M785 52v596" stroke="#182e2b" stroke-width="34" fill="none"/>'
      +'<path d="M53 350h1094M415 52v596M785 52v596" stroke="#69776b" stroke-width="22" fill="none"/>'
      +'<path d="M53 350h1094M415 52v596M785 52v596" stroke="#c0c2a366" stroke-dasharray="10 12" fill="none"/>'
      +'<path d="M95 320h280M460 320h280M830 320h280M95 390h280M460 390h280M830 390h280" stroke="#b7c1a766" stroke-width="5"/>'
      +'<rect x="83" y="68" width="290" height="48" rx="18" fill="url(#ac-tree-pattern)"/><rect x="1090" y="420" width="32" height="200" rx="14" fill="url(#ac-tree-pattern)"/>'
      +'<ellipse cx="230" cy="300" rx="62" ry="9" fill="#477d80" stroke="#81a69a" stroke-width="3"/>'
      +'<path d="M490 114h220M490 123h220" stroke="#8f9e8066" stroke-width="3"/>'
      +'<circle cx="600" cy="350" r="40" fill="#b1bba1" stroke="#263c31" stroke-width="4"/><circle cx="600" cy="350" r="24" fill="#4f8c91" stroke="#d0d2b2" stroke-width="5"/><circle cx="600" cy="350" r="8" fill="#a9d3ca"/>'
      +'<g fill="#678c6b"><circle cx="115" cy="390" r="10"/><circle cx="350" cy="309" r="10"/><circle cx="850" cy="307" r="10"/><circle cx="1090" cy="390" r="10"/></g></svg>';
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
    root.innerHTML='<header class="ac-top"><div class="ac-brand"><span class="ac-brand-mark" aria-hidden="true">A</span><div><strong>AUTONOMY CITY</strong><span>JT\'S SERVICE & SALE</span></div></div>'
      +'<div class="ac-top-actions"><span id="ac-link-status" class="ac-link">ENTERPRISE DATA · CONNECTING</span><button id="ac-close" type="button">Return to StarNet</button></div></header>'
      +'<div class="ac-intro"><div><span class="ac-eyebrow">YOUR ENTERPRISE, AT A GLANCE</span><h1>A place for every possibility.</h1><p>Explore your campuses. Open a district to see what comes next.</p></div><span class="ac-phase">PHASE 01 <i></i> FOUNDATION</span></div>'
      +'<div class="ac-world"><div class="ac-map-caption"><span>01 / CAMPUS OVERVIEW</span><span class="ac-map-north">↑ N</span></div><div id="ac-campus-layer">'+mapLandscape()+'</div>'
      +'<div class="ac-legend"><span><i></i> Active district</span><span><i class="pilot"></i> Pilot</span><span><i class="planned"></i> Future campus</span></div></div>'
      +'<footer class="ac-footer"><span>OVERHEAD CAMPUS MAP <b>·</b> Select a building to explore</span><span>Business activity reflects connected enterprise data.</span></footer>'
      +'<aside id="ac-panel" class="ac-panel"><button id="ac-panel-close" type="button" aria-label="Close detail">×</button><div id="ac-panel-body"></div></aside>';
    document.body.appendChild(root);
    panel=root.querySelector('#ac-panel');status=root.querySelector('#ac-link-status');
    const layer=root.querySelector('#ac-campus-layer');
    layer.append(
      campusCard('hq','COMMAND HQ','CEO · BOARD · STRATEGY','active'),
      campusCard('media','MEDIA CAMPUS','SPORTS CLIPPING PILOT','pilot'),
      campusCard('rnd','R&D / INNOVATION','SYSTEM LABS','active'),
      campusCard('commerce','COMMERCE','FUTURE OPERATIONS','construction'),
      campusCard('agency','AGENCY','FUTURE OPERATIONS','construction'),
      campusCard('finance','FINANCE','FUTURE OPERATIONS','construction')
    );
    if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.mount)AutonomyRenderer.mount(root);
    root.querySelector('#ac-close').onclick=close;
    root.querySelector('#ac-panel-close').onclick=()=>{panel.classList.remove('open');if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.clearFocus)AutonomyRenderer.clearFocus();};
    layer.addEventListener('click',e=>{const btn=e.target.closest('[data-campus]');if(btn)openCampus(btn.dataset.campus);});
    panel.addEventListener('click',async e=>{
      const create=e.target.closest('[data-media-create]');
      if(create){
        const feedback=panel.querySelector('#ac-media-create-status');create.disabled=true;
        try{if(typeof MediaAgents==='undefined'||typeof App==='undefined')throw new Error('Reload StarNet to load agent recruitment.');
          feedback.textContent='Creating agents and syncing the roster…';
          const result=await MediaAgents.create(lastCommand&&lastCommand.mediaPlan,create.dataset.mediaCreate==='all'?null:create.dataset.mediaCreate,App);
          const category=create.dataset.mediaCreate==='all'?'workforce':create.dataset.mediaCreate;
          openMedia(category);panel.querySelector('#ac-media-create-status').textContent=result.created+' new agents created; '+result.total+' positions synced. Open an agent to assign work.';
        }catch(error){if(feedback)feedback.textContent=error.message;}finally{create.disabled=false;}return;
      }
      const agentButton=e.target.closest('[data-media-agent]');
      if(agentButton){if(typeof App!=='undefined'&&App.selectAgent){App.selectAgent(agentButton.dataset.mediaAgent);close();}return;}
      const nav=e.target.closest('[data-ac-nav]');if(nav){openCampus(nav.dataset.acNav);return;}const media=e.target.closest('[data-media-nav]');if(media)openMedia(media.dataset.mediaNav);});
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
  function mediaDetail(){ return typeof MediaHome!=='undefined'&&MediaHome.render?MediaHome.render(lastCommand):'<h2>Media</h2>'; }
  function openMedia(id){
    panel.classList.add('open');
    if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.focus)AutonomyRenderer.focus('media');
    let html='';
    if(!id||id==='home') html=mediaDetail();
    else if(lastCommand&&lastCommand.mediaPlan&&lastCommand.mediaPlan.categories.some(c=>c.id===id)&&typeof MediaWorkforce!=='undefined') html=MediaWorkforce.render(lastCommand,id);
    else if(id==='management'&&typeof MediaManagement!=='undefined') html=MediaManagement.render(lastCommand);
    else if(id==='rights'&&typeof MediaRights!=='undefined') html=MediaRights.render(lastCommand);
    else if(id==='performance'&&typeof MediaPerformance!=='undefined') html=MediaPerformance.render(lastCommand);
    else if(id==='workforce'&&typeof MediaWorkforce!=='undefined') html=MediaWorkforce.render(lastCommand);
    else if(id==='sports-pilot'&&typeof MediaSports!=='undefined') html=MediaSports.render(lastCommand);
    else if(typeof MediaFuture!=='undefined') html=MediaFuture.render(id);
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
    if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.focus)AutonomyRenderer.focus(id);
    if(id==='hq'){renderBrief(lastCommand);return;}
    if(id==='media')openMedia('home');
    else if(id==='rnd')panel.querySelector('#ac-panel-body').innerHTML=rndDetail();
    else panel.querySelector('#ac-panel-body').innerHTML=constructionDetail(id);
  }
  function connectData(){
    if(typeof QuerySpine==='undefined'||!QuerySpine.subscribe){status.textContent='ENTERPRISE DATA · MODULE UNAVAILABLE';return;}
    if(unsub)return;
    try{
      unsub=QuerySpine.subscribe('command-hq',snap=>{
        if(snap.hasData&&!snap.error){lastCommand=snap.data;status.textContent='ENTERPRISE DATA · LIVE';status.classList.add('live');if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.sync)AutonomyRenderer.sync(lastCommand);}
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
  function close(){if(!root)return;if(typeof AutonomyRenderer!=='undefined'&&AutonomyRenderer.reset)AutonomyRenderer.reset();root.classList.remove('shown');setTimeout(()=>root.classList.add('hidden'),180);if(unsub){unsub();unsub=null;}}
  function installLauncher(){if(document.getElementById('autonomy-city-launch'))return;const btn=el('button','ac-launch','AUTONOMY CITY');btn.id='autonomy-city-launch';btn.type='button';btn.title='Open Autonomy City';btn.onclick=open;document.body.appendChild(btn);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLauncher);else installLauncher();
  return {open,close};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyCity};
