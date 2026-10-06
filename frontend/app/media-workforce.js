 'use strict';
const MediaWorkforce=(()=>{
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function render(data,categoryId){
  const p=data&&data.mediaPlan;
  if(!p)return '<h2>Media Workforce</h2><p>Organization data unavailable.</p>';
  const categories=categoryId?p.categories.filter(c=>c.id===categoryId):p.categories;
  return '<div class="ac-breadcrumb">CITY › MEDIA › TEAMS</div><div class="ac-kicker">STAFFING PLAN · AWAITING ACTIVATION</div><h2>'+esc(categoryId&&categories[0]?categories[0].name:'Media Workforce')+'</h2>'
   +categories.map(c=>'<h3 class="ac-section-title">'+esc(c.name)+'</h3><div class="ac-simple-grid">'+c.workers.map(w=>'<article><b>'+esc(w.name)+'</b><p>'+esc(w.scope)+'</p><span>Reports to '+esc(p.managers.find(m=>m.id===w.managerId).name)+' · Planned</span></article>').join('')+'</div>').join('')
   +'<h3 class="ac-section-title">END-TO-END WORKFLOW</h3><ol>'+p.workflow.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
   +'<p>Trend discovery is planned every 72 hours. Each category shares findings across its three workers; managers can coordinate reassignment and review.</p>'
   +'<p>Editing engine: FFmpeg · No OpusClip subscription. Worker implemented; upload controls, AI highlight selection, captions and publishing are not connected yet.</p>'
   +'<h3 class="ac-section-title">CONTENT & COST POLICY</h3><p>'+esc(p.contentPolicy.editing)+'</p><p>'+esc(p.contentPolicy.eligibility)+'</p><p>'+esc(p.contentPolicy.economics)+'</p>'
   +'<h3 class="ac-section-title">REQUIRED TO ACTIVATE</h3><ul>'+p.requirements.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>'
   +'<div class="ac-panel-nav"><button data-media-nav="management">MANAGER OFFICE</button><button data-media-nav="home">MEDIA CAMPUS</button></div>';
 }
 return {render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={MediaWorkforce};
