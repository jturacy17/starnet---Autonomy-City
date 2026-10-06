/* frontend/app/autonomy-renderer.js — overhead campus map controller for Autonomy City.
   Presentation-only: camera transforms and depth effects never alter enterprise truth/state. */
'use strict';
const AutonomyRenderer=(()=>{
  let rootEl=null, world=null, layer=null, zoom=1, panX=0, panY=0, dragging=false, sx=0, sy=0, px=0, py=0, focused='';
  const MIN=.78, MAX=1.35;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function apply(){
    if(!layer)return;
    layer.style.setProperty('--ac-zoom',String(zoom));
    layer.style.setProperty('--ac-pan-x',panX+'px');
    layer.style.setProperty('--ac-pan-y',panY+'px');
  }
  function clearFocus(){focused='';if(world){world.classList.remove('has-focus');world.removeAttribute('data-focus');const s=world.querySelector('.ac-district-stage');if(s)s.classList.remove('show');}if(rootEl){rootEl.querySelectorAll('.ac-campus.is-selected').forEach(n=>n.classList.remove('is-selected'));}}
  function reset(){clearFocus();zoom=1;panX=0;panY=0;apply();}
  function wheel(e){
    if(!world||!world.contains(e.target)||window.matchMedia('(max-width:800px)').matches)return;
    if(e.target.closest('.ac-panel'))return;
    e.preventDefault();
    zoom=clamp(zoom+(e.deltaY<0?.06:-.06),MIN,MAX);apply();
  }
  function down(e){
    if(e.button!==0||e.target.closest('button,.ac-panel')||window.matchMedia('(max-width:800px)').matches)return;
    dragging=true;sx=e.clientX;sy=e.clientY;px=panX;py=panY;
    if(world)world.classList.add('is-dragging');
  }
  function move(e){
    if(!dragging)return;
    panX=clamp(px+(e.clientX-sx),-220,220);
    panY=clamp(py+(e.clientY-sy),-150,150);
    apply();
  }
  function up(){dragging=false;if(world)world.classList.remove('is-dragging');}
  function keydown(e){
    if(!rootEl||rootEl.classList.contains('hidden'))return;
    if(e.target&&/input|textarea|select/i.test(e.target.tagName||''))return;
    let used=true;
    if(e.key==='ArrowLeft')panX=clamp(panX+24,-220,220);
    else if(e.key==='ArrowRight')panX=clamp(panX-24,-220,220);
    else if(e.key==='ArrowUp')panY=clamp(panY+18,-150,150);
    else if(e.key==='ArrowDown')panY=clamp(panY-18,-150,150);
    else if(e.key==='+'||e.key==='=')zoom=clamp(zoom+.08,MIN,MAX);
    else if(e.key==='-'||e.key==='_')zoom=clamp(zoom-.08,MIN,MAX);
    else if(e.key==='0')reset();
    else used=false;
    if(used){e.preventDefault();apply();}
  }
  function addControls(root){
    if(root.querySelector('.ac-camera-controls'))return;
    const c=document.createElement('div');c.className='ac-camera-controls';
    c.innerHTML='<button type="button" data-cam="out" aria-label="Zoom out">−</button><button type="button" data-cam="reset">RESET VIEW</button><button type="button" data-cam="in" aria-label="Zoom in">＋</button>';
    root.appendChild(c);
    c.addEventListener('click',e=>{const b=e.target.closest('[data-cam]');if(!b)return;const a=b.dataset.cam;if(a==='in')zoom=clamp(zoom+.08,MIN,MAX);else if(a==='out')zoom=clamp(zoom-.08,MIN,MAX);else reset();apply();});
  }
  function addWorldLayers(){
    if(!world||world.querySelector('.ac-district-stage'))return;
    const stage=document.createElement('div');stage.className='ac-district-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<small>ENTERING DISTRICT</small><b></b><span></span>';
    world.appendChild(stage);
  }
  function focus(id){
    if(!rootEl||!layer)return;
    const presets={hq:[1,0,0],media:[1,0,0],rnd:[1,0,0],commerce:[1,0,0],agency:[1,0,0],finance:[1,0,0]};
    const p=presets[id]||[1,0,0];
    clearFocus();focused=id;if(world){world.classList.add('has-focus');world.dataset.focus=id;const stage=world.querySelector('.ac-district-stage');if(stage){const names={hq:['COMMAND DISTRICT','CEO · BOARD · STRATEGY'],media:['MEDIA CAMPUS','SPORTS CLIPPING PILOT'],rnd:['R&D / INNOVATION','SYSTEM LABS'],commerce:['COMMERCE','FUTURE OPERATIONS'],agency:['AGENCY','FUTURE OPERATIONS'],finance:['FINANCE','FUTURE OPERATIONS']};const n=names[id]||['AUTONOMY CITY',''];stage.querySelector('b').textContent=n[0];stage.querySelector('span').textContent=n[1];stage.classList.add('show');setTimeout(()=>stage.classList.remove('show'),1200);}}zoom=p[0];panX=p[1];panY=p[2];
    const node=rootEl.querySelector('[data-campus="'+id+'"]');if(node)node.classList.add('is-selected');
    apply();
  }
  function sync(data){
    if(!rootEl)return;
    const hq=rootEl.querySelector('[data-campus="hq"]'),media=rootEl.querySelector('[data-campus="media"]');
    if(hq){hq.classList.remove('has-live','attention-watch','attention-decide');if(data&&data.attention){hq.classList.add('has-live');if(data.attention==='WATCH')hq.classList.add('attention-watch');if(data.attention==='DECIDE')hq.classList.add('attention-decide');}}
    const opp=data&&data.portfolio&&data.portfolio.opportunities;const exp=data&&data.portfolio&&data.portfolio.experiments;
    const mediaLive=Number(opp&&opp.total||0)>0||Number(exp&&exp.total||0)>0;
    if(media)media.classList.toggle('has-live',mediaLive);
    if(world)world.classList.toggle('media-flow-live',mediaLive);
  }
  function mount(root){
    rootEl=root;world=root&&root.querySelector('.ac-world');
    layer=root&&root.querySelector('#ac-campus-layer');
    if(!world||!layer)return;
    world.classList.add('ac-rendered-overhead');
    addWorldLayers();addControls(world);apply();
    world.addEventListener('wheel',wheel,{passive:false});
    world.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    window.addEventListener('keydown',keydown);
  }
  return {mount,reset,focus,sync,clearFocus};
})();
if(typeof window!=='undefined')window.AutonomyRenderer=AutonomyRenderer;
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyRenderer};
