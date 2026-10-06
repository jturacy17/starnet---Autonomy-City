 'use strict';
const MediaManagement={render:(d)=>{
 const p=d&&d.mediaPlan;
 return '<div class="ac-breadcrumb">CITY › MEDIA › MANAGER OFFICE</div><div class="ac-kicker">SHARED LEADERSHIP PLAN</div><h2>Four Media Managers</h2><p>Each manager owns a similar share of worker positions. All four oversee source eligibility, priorities, quality, publication readiness and blocked work.</p>'
  +'<div class="ac-simple-grid">'+(p?p.managers.map(m=>'<article><b>'+m.name+'</b><p>'+m.workerIds.length+' assigned positions · Planned</p><ul>'+m.workerIds.map(id=>{const c=p.categories.find(c=>c.workers.some(w=>w.id===id));const w=c.workers.find(w=>w.id===id);return '<li>'+c.name+' — '+w.name+'</li>';}).join('')+'</ul></article>').join(''):'<p>Organization data unavailable.</p>')+'</div>'
  +'<div class="ac-panel-nav"><button data-media-nav="workforce">VIEW ALL TEAMS</button><button data-media-nav="home">MEDIA CAMPUS</button></div>';
}};
if(typeof module!=='undefined'&&module.exports)module.exports={MediaManagement};
