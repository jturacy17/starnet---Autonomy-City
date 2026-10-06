'use strict';
const MediaHome = (() => {
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function card(id,name,status){return '<button class="ac-division '+(id==='sports'?'live':'future')+'" data-media-nav="'+esc(id)+'"><b>'+esc(name)+'</b><span>'+(id==='sports'?'Live Phase 1 clipping operation':'Future vertical')+'</span><em>'+status+'</em></button>';}
  function render(data){
    const opp=data&&data.portfolio&&data.portfolio.opportunities?data.portfolio.opportunities:null;
    const fin=data&&data.portfolio&&data.portfolio.financials?data.portfolio.financials:null;
    const board=data&&data.board?data.board:null;
    return '<div class="ac-breadcrumb">CITY › MEDIA CAMPUS</div><div class="ac-kicker">OPERATING CAMPUS</div><h2>Media</h2>'
      +'<p class="ac-campus-copy">Sports is the live Phase 1 pilot. The remaining Media divisions are reserved now so they can activate later without redesigning the campus.</p>'
      +'<div class="ac-media-kpis"><article><span>SPORTS STATUS</span><b>PILOT</b></article><article><span>MANAGER</span><b>'+esc(board&&board.managerPerformance||'—')+'</b></article><article><span>OPPORTUNITIES</span><b>'+Number(opp&&opp.total||0)+'</b></article><article><span>PROFIT</span><b>$'+Number(fin&&fin.profitUsd||0).toFixed(2)+'</b></article></div>'
      +'<div class="ac-media-command-row"><button data-media-nav="sports">ENTER SPORTS OPERATIONS</button><button data-media-nav="management">MANAGER OFFICE</button><button data-media-nav="rights">RIGHTS & MONETIZATION</button><button data-media-nav="performance">PERFORMANCE LAB</button></div>'
      +'<h3 class="ac-section-title">MEDIA DIVISIONS</h3><div class="ac-division-grid">'
      +card('sports','Sports','PILOT')
      +card('business-ai','Business / Money / AI','COMING SOON')
      +card('comedy-viral','Comedy / Viral','COMING SOON')
      +card('dating-relationships','Dating / Relationships','COMING SOON')
      +card('gaming','Gaming','COMING SOON')
      +card('streamer-pop-culture','Streamer / Pop Culture','COMING SOON')
      +card('kids-a','Kids A','COMING SOON')+card('kids-b','Kids B','COMING SOON')+card('kids-c','Kids C','COMING SOON')+'</div>'
      +'<div class="ac-panel-nav"><button data-ac-nav="hq">BACK TO COMMAND HQ</button></div>';
  }
  return {render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={MediaHome};
