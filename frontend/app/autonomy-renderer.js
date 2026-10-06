/* frontend/app/autonomy-renderer.js — lightweight isometric renderer for Autonomy City.
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
    if(!world||!world.contains(e.target))return;
    if(e.target.closest('.ac-panel'))return;
    e.preventDefault();
    zoom=clamp(zoom+(e.deltaY<0?.06:-.06),MIN,MAX);apply();
  }
  function down(e){
    if(e.button!==0||e.target.closest('button,.ac-panel'))return;
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
  function addControls(root){
    if(root.querySelector('.ac-camera-controls'))return;
    const c=document.createElement('div');c.className='ac-camera-controls';
    c.innerHTML='<button type="button" data-cam="out" aria-label="Zoom out">−</button><button type="button" data-cam="reset">RESET VIEW</button><button type="button" data-cam="in" aria-label="Zoom in">＋</button>';
    root.appendChild(c);
    c.addEventListener('click',e=>{const b=e.target.closest('[data-cam]');if(!b)return;const a=b.dataset.cam;if(a==='in')zoom=clamp(zoom+.08,MIN,MAX);else if(a==='out')zoom=clamp(zoom-.08,MIN,MAX);else reset();apply();});
  }
  function addWorldLayers(root){
    if(!world||world.querySelector('.ac-enterprise-flow'))return;
    const flow=document.createElement('div');flow.className='ac-enterprise-flow';flow.setAttribute('aria-hidden','true');
    flow.innerHTML='<span class="ac-flow-line"></span><i class="ac-flow-pulse p1"></i><i class="ac-flow-pulse p2"></i><i class="ac-flow-node n-media"></i><i class="ac-flow-node n-hq"></i>';
    world.appendChild(flow);
    const depth=document.createElement('div');depth.className='ac-city-depth';depth.setAttribute('aria-hidden','true');
    depth.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';
    world.appendChild(depth);
    const traffic=document.createElement('div');traffic.className='ac-service-traffic';traffic.setAttribute('aria-hidden','true');
    traffic.innerHTML='<i class="v1"></i><i class="v2"></i><i class="v3"></i>';
    world.appendChild(traffic);
    const civic=document.createElement('div');civic.className='ac-civic-grounds';civic.setAttribute('aria-hidden','true');
    civic.innerHTML='<span class="ac-fountain"></span><span class="ac-walkway w1"></span><span class="ac-walkway w2"></span><span class="ac-lamp l1"></span><span class="ac-lamp l2"></span><span class="ac-lamp l3"></span><span class="ac-lamp l4"></span>';
    world.appendChild(civic);
    const stage=document.createElement('div');stage.className='ac-district-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<small>ENTERING DISTRICT</small><b></b><span></span>';
    world.appendChild(stage);
    const arrivals=document.createElement('div');arrivals.className='ac-arrival-zones';arrivals.setAttribute('aria-hidden','true');
    arrivals.innerHTML='<span class="az hq"></span><span class="az media"></span><span class="az rnd"></span><span class="az commerce"></span><span class="az agency"></span><span class="az finance"></span>';
    world.appendChild(arrivals);
    const boulevard=document.createElement('div');boulevard.className='ac-grand-boulevard';boulevard.setAttribute('aria-hidden','true');
    boulevard.innerHTML='<span></span><i></i><i></i><i></i><i></i>';
    world.appendChild(boulevard);
    const gates=document.createElement('div');gates.className='ac-campus-gates';gates.setAttribute('aria-hidden','true');
    gates.innerHTML='<span class="gate hq"><b>COMMAND</b></span><span class="gate media"><b>MEDIA</b></span><span class="gate rnd"><b>R&D</b></span><span class="gate commerce"><b>COMMERCE</b></span><span class="gate agency"><b>AGENCY</b></span><span class="gate finance"><b>FINANCE</b></span>';
    world.appendChild(gates);
    const parallax=document.createElement('div');parallax.className='ac-parallax';parallax.setAttribute('aria-hidden','true');
    parallax.innerHTML='<span class="ridge r-a"></span><span class="ridge r-b"></span><span class="near-tree t1"></span><span class="near-tree t2"></span><span class="near-tree t3"></span><span class="near-tree t4"></span>';
    world.appendChild(parallax);
    const horizon=document.createElement('div');horizon.className='ac-horizon-layer';horizon.setAttribute('aria-hidden','true');
    horizon.innerHTML='<span class="haze"></span><span class="skyline s1"></span><span class="skyline s2"></span><span class="skyline s3"></span><span class="skyline s4"></span><span class="skyline s5"></span>';
    world.appendChild(horizon);
  }
  function decorateBuildings(root){
    root.querySelectorAll('.ac-campus').forEach(c=>{
      if(c.querySelector('.ac-building-shadow'))return;
      const s=document.createElement('span');s.className='ac-building-shadow';s.setAttribute('aria-hidden','true');c.prepend(s);
      const b=c.querySelector('.ac-building');if(b)b.classList.add('ac-isometric-building');
    });
  }
  function focus(id){
    if(!rootEl||!layer)return;
    const presets={hq:[1.16,0,42],media:[1.18,120,44],rnd:[1.16,-118,42],commerce:[1.05,115,-58],agency:[1.05,-115,-58],finance:[1.08,-58,82]};
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
    world.classList.add('ac-rendered-iso');
    addWorldLayers(root);decorateBuildings(root);addControls(root);apply();
    world.addEventListener('wheel',wheel,{passive:false});
    world.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  }
  return {mount,reset,focus,sync,clearFocus};
})();
if(typeof window!=='undefined')window.AutonomyRenderer=AutonomyRenderer;
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyRenderer};
