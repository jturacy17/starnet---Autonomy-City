/* frontend/app/autonomy-renderer.js — lightweight isometric renderer for Autonomy City.
   Presentation-only: camera transforms and depth effects never alter enterprise truth/state. */
'use strict';
const AutonomyRenderer=(()=>{
  let world=null, layer=null, zoom=1, panX=0, panY=0, dragging=false, sx=0, sy=0, px=0, py=0;
  const MIN=.78, MAX=1.35;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function apply(){
    if(!layer)return;
    layer.style.setProperty('--ac-zoom',String(zoom));
    layer.style.setProperty('--ac-pan-x',panX+'px');
    layer.style.setProperty('--ac-pan-y',panY+'px');
  }
  function reset(){zoom=1;panX=0;panY=0;apply();}
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
  function decorateBuildings(root){
    root.querySelectorAll('.ac-campus').forEach(c=>{
      if(c.querySelector('.ac-building-shadow'))return;
      const s=document.createElement('span');s.className='ac-building-shadow';s.setAttribute('aria-hidden','true');c.prepend(s);
      const b=c.querySelector('.ac-building');if(b)b.classList.add('ac-isometric-building');
    });
  }
  function mount(root){
    world=root&&root.querySelector('.ac-world');
    layer=root&&root.querySelector('#ac-campus-layer');
    if(!world||!layer)return;
    world.classList.add('ac-rendered-iso');
    decorateBuildings(root);addControls(root);apply();
    world.addEventListener('wheel',wheel,{passive:false});
    world.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  }
  return {mount,reset};
})();
if(typeof window!=='undefined')window.AutonomyRenderer=AutonomyRenderer;
if(typeof module!=='undefined'&&module.exports)module.exports={AutonomyRenderer};
