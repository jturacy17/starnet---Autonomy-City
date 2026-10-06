/* frontend/app/autonomy-city.js — Phase 1 first-pass Autonomy City + Command HQ preview.
   Visual shell only. It never fabricates runtime/business truth: executive cards render only from
   QuerySpine command-hq data; unavailable data is labeled unavailable. */
'use strict';
const AutonomyCity = (() => {
  let root = null, panel = null, status = null, unsub = null;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function el(tag, cls, text) {
    const n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n;
  }
  function campusCard(id, label, sub, state) {
    const b=el('button','ac-campus ac-'+id);
    b.type='button'; b.dataset.campus=id;
    b.innerHTML='<span class="ac-building"><i></i><i></i><i></i></span>'
      +'<b>'+esc(label)+'</b><small>'+esc(sub)+'</small>'
      +'<em class="ac-state '+esc(state)+'">'+(state==='active'?'ACTIVE':state==='pilot'?'PILOT':'UNDER CONSTRUCTION')+'</em>';
    return b;
  }
  function buildShell() {
    if (document.getElementById('autonomy-city-root')) return;
    root=el('section','autonomy-city hidden'); root.id='autonomy-city-root'; root.setAttribute('aria-label','Autonomy City preview');
    root.innerHTML='<header class="ac-top"><div><strong>AUTONOMY CITY</strong><span>JT\'S SERVICE & SALE · PHASE 1</span></div>'
      +'<div class="ac-top-actions"><span id="ac-link-status" class="ac-link">ENTERPRISE DATA · CONNECTING</span><button id="ac-close" type="button">RETURN TO STARNET</button></div></header>'
      +'<div class="ac-world"><div class="ac-road r1"></div><div class="ac-road r2"></div><div class="ac-road r3"></div><div class="ac-road r4"></div>'
      +'<div class="ac-plaza"><span>CEO COMMAND DISTRICT</span></div><div id="ac-campus-layer"></div>'
      +'<div class="ac-legend"><b>FIRST PASS</b><span>Campus layout + executive surface</span><span>Live activity appears only when proven by enterprise state.</span></div></div>'
      +'<aside id="ac-panel" class="ac-panel"><button id="ac-panel-close" type="button" aria-label="Close detail">×</button><div id="ac-panel-body"></div></aside>';
    document.body.appendChild(root);
    panel=root.querySelector('#ac-panel');
    status=root.querySelector('#ac-link-status');
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
    layer.addEventListener('click', e => {
      const btn=e.target.closest('[data-campus]'); if(!btn)return;
      openCampus(btn.dataset.campus);
    });
  }
  function renderUnavailable() {
    if(!panel)return;
    panel.querySelector('#ac-panel-body').innerHTML=
      '<div class="ac-kicker">COMMAND HQ</div><h2>Executive Brief</h2>'
      +'<div class="ac-unavailable"><b>ENTERPRISE DATA LINK NOT ACTIVE YET</b>'
      +'<p>The city shell is live, but no executive metrics are being invented. The next integration step connects the durable enterprise state to this surface.</p></div>'
      +'<div class="ac-tabs"><span>INFORM</span><span>WATCH</span><span>DECIDE</span></div>';
  }
  function renderBrief(data) {
    if(!data||data.surface!=='command_hq'){renderUnavailable();return;}
    const decide=data.decide||{count:0,decisions:[],recommendations:[]};
    const watch=data.watch||{count:0,items:[]};
    const inform=data.inform||{count:0,items:[]};
    const cards=(items,kind)=>items.map(x=>'<article class="ac-brief-card '+kind+'"><b>'+esc(x.title||x.id)+'</b>'
      +'<span>'+esc(x.value!=null?x.value:(x.detail||x.recommendation||''))+'</span></article>').join('');
    panel.querySelector('#ac-panel-body').innerHTML=
      '<div class="ac-kicker">COMMAND HQ · '+esc(data.attention)+'</div><h2>'+esc(data.headline)+'</h2>'
      +'<div class="ac-exec-grid"><section><h3>DECIDE <i>'+Number(decide.count||0)+'</i></h3>'
      +cards([...(decide.decisions||[]),...(decide.recommendations||[])],'decide')+'</section>'
      +'<section><h3>WATCH <i>'+Number(watch.count||0)+'</i></h3>'+cards(watch.items||[],'watch')+'</section>'
      +'<section><h3>INFORM <i>'+Number(inform.count||0)+'</i></h3>'+cards(inform.items||[],'inform')+'</section></div>';
  }
  function openCampus(id) {
    panel.classList.add('open');
    if(id==='hq'){ const s=window.QuerySpine&&QuerySpine.state?QuerySpine.state('command-hq'):null; renderBrief(s&&s.hasData?s.data:null); return; }
    const copy={
      media:['MEDIA CAMPUS','Sports Clipping is the first operational pilot. Manager-owned delivery, rights/monetization gating, experiments, measurement and learning live here.'],
      rnd:['R&D / INNOVATION','Enterprise architecture, workflow experiments, agent capability research and future system development.'],
      commerce:['COMMERCE','Reserved expansion campus. No operational automation enabled in Phase 1.'],
      agency:['AGENCY','Reserved expansion campus. No operational automation enabled in Phase 1.'],
      finance:['FINANCE','Reserved expansion campus. Financial intelligence exists in the enterprise layer; autonomous trading is not enabled in Phase 1.']
    }[id]||['CAMPUS',''];
    panel.querySelector('#ac-panel-body').innerHTML='<div class="ac-kicker">'+esc(copy[0])+'</div><h2>'+esc(copy[0])+'</h2><p class="ac-campus-copy">'+esc(copy[1])+'</p>';
  }
  function connectData() {
    if(!window.QuerySpine||!QuerySpine.subscribe){ if(status)status.textContent='ENTERPRISE DATA · MODULE UNAVAILABLE'; return; }
    try {
      unsub=QuerySpine.subscribe('command-hq', snap => {
        if(!status)return;
        if(snap.hasData&&!snap.error){status.textContent='ENTERPRISE DATA · LIVE';status.classList.add('live');}
        else if(snap.error){status.textContent='ENTERPRISE DATA · NOT CONNECTED';status.classList.remove('live');}
        else status.textContent='ENTERPRISE DATA · CONNECTING';
        if(panel&&panel.classList.contains('open')&&panel.querySelector('.ac-kicker')&&/COMMAND HQ/.test(panel.querySelector('.ac-kicker').textContent)) renderBrief(snap.hasData?snap.data:null);
      },{refresh:true});
    } catch (_) { if(status)status.textContent='ENTERPRISE DATA · NOT CONNECTED'; }
  }
  function open() { buildShell(); root.classList.remove('hidden'); requestAnimationFrame(()=>root.classList.add('shown')); connectData(); }
  function close() { if(!root)return;root.classList.remove('shown');setTimeout(()=>root.classList.add('hidden'),180);if(unsub){unsub();unsub=null;} }
  function installLauncher() {
    if(document.getElementById('autonomy-city-launch'))return;
    const btn=el('button','ac-launch','AUTONOMY CITY');btn.id='autonomy-city-launch';btn.type='button';btn.title='Open the Phase 1 Autonomy City view';btn.onclick=open;
    document.body.appendChild(btn);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLauncher);else installLauncher();
  return {open,close};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyCity};
