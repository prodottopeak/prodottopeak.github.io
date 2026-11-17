const E=RandomEngine,KEY='keli-website-preview-v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+E.randomIndex(1000000);
const $=id=>document.getElementById(id);
const paths={
  pickers:'<rect x="3" y="3" width="7" height="7" rx="2"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M3 15h7v6l-3.5-2L3 21Z"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  dice:'<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" stroke-width="3"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="16" cy="17" r="3" fill="var(--bg)"/>',
  edit:'<path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  undo:'<path d="M8 4 3 9l5 5M3 9h10a6 6 0 0 1 0 12"/>',
  clear:'<path d="m8 17 8-12 6 4-8 12H8l-5-4 8-12M6 13l7 5M14 21h8"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
  history:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v6l4 2"/>',
  library:'<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="m9 5 7 7-7 7"/>',
  down:'<path d="m6 9 6 6 6-6"/>',
  repeat:'<path d="m17 2 4 4-4 4M21 6H7a4 4 0 0 0-4 4m4 12-4-4 4-4m-4 4h14a4 4 0 0 0 4-4"/>',
  once:'<path d="m4 12 5 5L20 6"/>',
  shuffle:'<path d="m17 3 4 4-4 4M3 7h3c6 0 6 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 3-1 4-3m4-4c1-2 2-3 4-3h3"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const icon=(name,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.dice}</svg>`;
const make=(id,title,type,extra={})=>({id,title,type,min:1,max:100,text:'',exclude:'',repeat:false,count:1,used:[],round:uid(),history:[],displayCleared:false,...extra});
const defaults=()=>({version:1,active:'quick',page:'pick',motion:true,motionMode:'full',dark:true,appearanceVersion:2,welcomed:false,rememberSuggestions:true,suggestions:[],counters:emptyCounts(),sets:[make('quick','Pick a number','numbers'),make('names','Who goes first?','names',{text:AVENGERS,example:true}),make('custom','Game numbers','set',{text:'2, 4, 7, 12, 20'}),make('game','Game night','names',{text:'Codenames\nAzul\nWingspan\nTicket to Ride\nCarcassonne'}),make('savings','100-day challenge','numbers')]});
let state=defaults(),storageIssue='',toastTimer,sheetEpoch=0;state.welcomed=true;
function validate(data){
  if(!data||data.version!==1||!Array.isArray(data.sets)||!data.sets.length||data.sets.length>100)throw Error('Not a Keli backup.');
  const ids=new Set();
  for(const s of data.sets){
    if(!s||typeof s.id!=='string'||ids.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>60||!['numbers','names','set'].includes(s.type)||typeof s.repeat!=='boolean'||!Number.isInteger(s.count)||s.count<1||s.count>10||!Array.isArray(s.used)||!Array.isArray(s.history)||typeof s.round!=='string')throw Error('Invalid saved picker.');
    if(s.drawMode&&!['pick','order','teams','wheel','coin','chess'].includes(s.drawMode))throw Error('Invalid picker mode.');
    if(['order','teams'].includes(s.drawMode))E.arrange(s,()=>0);
    validateExtras(s);validateNumberBase(s);ids.add(s.id);const pool=new Set(E.pool(s));
    if(s.used.length>10000||new Set(s.used).size!==s.used.length||s.used.some(x=>!pool.has(x))||s.history.length>1000)throw Error('Invalid round data.');
    for(const r of s.history){if(r.kind&&!['teams','order'].includes(r.kind))throw Error('Invalid history mode.');if(r.kind==='teams'&&(!Array.isArray(r.groups)||r.groups.length<2||r.groups.some(g=>!Array.isArray(g)||!g.length)||JSON.stringify([...r.groups.flat()].sort())!==JSON.stringify([...r.values].sort())||new Set(r.groups.flat()).size!==r.values.length||Math.max(...r.groups.map(g=>g.length))-Math.min(...r.groups.map(g=>g.length))>1))throw Error('Invalid saved teams.');if(!Array.isArray(r.values)||!r.values.length||r.values.length>(['order','teams'].includes(r.kind)?10000:10)||r.values.some(v=>typeof v!=='string'||v.length>100)||typeof r.round!=='string'||typeof r.time!=='string'||!Number.isFinite(Date.parse(r.time)))throw Error('Invalid history.');}
  }
  data.counters=validateCounts(data.counters);data.suggestions=validateFills(data.suggestions);data.rememberSuggestions=data.rememberSuggestions!==false;
  if(!ids.has(data.active))data.active=data.sets[0].id;
  data.page='pick';data.motion=data.motion!==false;data.motionMode=['full','quick','instant'].includes(data.motionMode)?data.motionMode:(data.motion?'full':'instant');data.dark=data.appearanceVersion===2?!!data.dark:true;data.appearanceVersion=2;data.welcomed=data.welcomed!==false;return data;
}
const current=()=>state.sets.find(s=>s.id===state.active)||state.sets[0];
const recent=s=>s.history.filter(r=>r.round===s.round);
const visibleResult=s=>s.displayCleared?null:recent(s).at(-1);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const canMove=()=>state.motion&&state.motionMode!=='instant'&&!reducedMotion.matches;
function motion(el,frames,options={}){if(!el||!canMove()||!el.animate)return null;const animation=el.animate(frames,{duration:360,easing:'cubic-bezier(.22,1,.36,1)',...options});animation.playbackRate=state.motionMode==='quick'?1/.45:1;return animation;}
function save(){pruneHistory();}
function toast(text){$('toast').textContent=text;clearTimeout(toastTimer);motion($('toast'),[{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:180});toastTimer=setTimeout(()=>$('toast').textContent='',3300);}
function theme(){document.body.classList.toggle('dark',state.dark);document.body.classList.toggle('instant',!canMove());}
function description(s){return s.type==='numbers'?(s.numberMode==='digits'?`${s.length} digits · ${[...new Set(s.digits.replace(/[,\s]/g,''))].join('')}`:`${s.displayBase===1?s.min:displayValue(s,String(s.min))} — ${s.displayBase===1?s.max:displayValue(s,String(s.max))}${s.displayBase===1?' · Tally':''}`):`${E.pool(s).length} ${s.type==='names'?(E.pool(s).length===1?'choice':'choices'):(E.pool(s).length===1?'number':'numbers')}`;}
function displayValue(s,v){
 if(s.templateId==='bingo'&&Number(v)>=1&&Number(v)<=75)return `${'BINGO'[Math.floor((Number(v)-1)/15)]} ${v}`;
 if(s.type!=='names'&&s.numberMode!=='digits'&&s.displayBase&&s.displayBase!==10){const n=Number(v);return s.displayBase===1?(n===0?'0':'│'.repeat(Math.max(0,Math.min(50,n)))):n.toString(s.displayBase);}
 return v;
}
function roundCaption(s,remaining){
 if(['teams','order'].includes(s.drawMode))return '';
 const noun=s.type==='names'?(s.drawMode==='wheel'?'choices':'names'):'numbers';
 if(s.repeat)return 'Repeats allowed';
 if(!remaining)return `All ${noun} picked`;
 return s.used.length?`${remaining} ${remaining===1?noun.slice(0,-1):noun} left`:`Each ${noun.slice(0,-1)} is picked once`;
}
function pruneHistory(now=Date.now()){
 let changed=false;
 for(const s of state.sets){const fresh=s.history.filter(r=>Date.parse(r.time)>now-48*60*60*1000);if(fresh.length!==s.history.length){s.history=fresh;changed=true;}}
 return changed;
}

function resultHTML(s){const r=visibleResult(s);if(isSymbolPicker(s))return symbolHTML(s,r?.values[0]);if(usesDice(s)&&r)return dieHTML(Number(r.values[0]));if(!r&&['order','teams'].includes(s.drawMode))return arrangementIdle(s);if(!r)return '<span class="idle-die" aria-label="Ready to pick"><i></i><i></i><i></i><i></i></span>';if(r.kind)return arrangementHTML(r);const value=r.values.map(v=>displayValue(s,v)).join(' · ');if(s.drawMode==='wheel')return wheelWinner(s,value);if(s.type==='names')return r.values.length>1||value.length>40?readableNames(r.values):nameTiles(value);return [...value].map(c=>/[\p{L}\p{N}]/u.test(c)?`<span class="glyph">${esc(c)}</span>`:esc(c)).join('');}
let numberCarryHTML='',numberCarryPose=null;
function render(kind='none'){
  if(pruneHistory())save();
  document.querySelectorAll('.burst-layer').forEach(el=>el.remove());
  numberCarryPose=captureIdleDiePose($('stage'));
  numberCarryHTML=$('result')?.classList.contains?.('numeric-result')?$('result').innerHTML:'';
  const oldStage=$('stage'),carry=captureStageActors(oldStage);
  if(kind!=='draw')pauseAutoPick();
  if(kind!=='draw'&&typeof backdropAnimations!=='undefined'){backdropAnimations.forEach(a=>{a.sceneCleanup?.();a.cancel();});backdropAnimations=[];}
  const scenery=document.querySelector('.phone-art');if(scenery?.dataset){scenery.dataset.mode=state.page==='pick'&&current().type!=='names'?'numbers':'other';scenery.dataset.scenePage=state.page;}
  theme();$('store-warning').textContent=storageIssue;
  const s=current(),rs=recent(s),last=visibleResult(s),pool=E.pool(s),remaining=pool.length-s.used.length;
  const types=['numbers','names','set'],pages=['pick','library','history'];
  $('picker-tabs').hidden=true;$('picker-tabs').style.setProperty('--index',types.indexOf(s.type));
  document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b.dataset.type===s.type);b.setAttribute('aria-pressed',String(b.dataset.type===s.type));});
  document.querySelector('.navigation').style.setProperty('--index',pages.indexOf(state.page==='counts'?'pick':state.page));
  document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===(state.page==='counts'?'pick':state.page));b.setAttribute('aria-current',b.dataset.page===(state.page==='counts'?'pick':state.page)?'page':'false');});
  let out='';
  if(state.page==='counts'){out=countsHTML();
  }else if(state.page==='pick'){
    const value=last?.values.map(v=>displayValue(s,v)).join(' · ')||'';
    out=`<div class="picker-heading"><h1><button class="current-picker" data-action="mode" aria-label="Change picker">${s.drawMode==='coin'?'Heads or tails':s.drawMode==='chess'?'Chess colors':s.drawMode==='wheel'?'Wheel':s.drawMode==='teams'?'Teams':s.drawMode==='order'?'Shuffle':s.templateId?esc(s.title):s.type==='numbers'?'Numbers':s.type==='names'?'Names':'Number set'}${icon('down')}</button></h1><button class="quiet-button" data-action="round-menu" aria-label="Picker actions">${icon('more')}</button></div>
    <button class="pool-pill range-link" data-action="edit" aria-label="${s.type==='numbers'?'Edit number range or digit rules':'Edit choices'}"><span>${esc(s.type==='numbers'?description(s):s.drawMode&&s.drawMode!=='pick'?`${pool.length} ${s.drawMode==='teams'?(pool.length===1?'person':'people'):(pool.length===1?'choice':'choices')}`:s.title)}</span>${icon('edit')}</button>
    <div class="hero ${s.type==='names'?'name-hero':'number-hero'}"><div class="stage ${s.drawMode==='wheel'?'wheel-stage':s.drawMode==='teams'||s.drawMode==='order'?'arrangement-stage':s.type==='names'?'name-stage':'number-stage'}" id="stage"><div class="orb"></div>${s.drawMode==='wheel'?wheelHTML(s):s.type==='names'&&!isSymbolPicker(s)&&!['order','teams'].includes(s.drawMode)&&!last?flagBed():''}<div id="result" class="result ${s.type!=='names'?'numeric-result':''} ${last?(last.kind?'arranged':last.values.length>1?'batch':s.type==='names'?'words':value.length>4?'long-number':''):''}" style="--digits:${value.length}" aria-live="polite" aria-atomic="true">${resultHTML(s)}</div></div>
    <div class="badge" id="remaining">${s.templateId==='dice'&&last?`Total ${last.values.reduce((a,v)=>a+Number(v),0)}`:roundCaption(s,remaining)}</div></div>
    <div class="pick-footer"><div class="earlier-slot">${s.type!=='names'&&rs.length>1?`<button class="earlier-picks" data-page="history" aria-label="Earlier picks, view history"><span>Earlier</span>${rs.slice(0,-1).flatMap(r=>r.values).slice(-3).map(v=>`<b>${esc(displayValue(s,v))}</b>`).join('')}</button>`:''}</div><button class="primary" id="draw" data-action="draw"><span>${s.drawMode==='coin'?'Flip':s.drawMode==='wheel'?'Spin':s.drawMode==='teams'?'Make teams':s.drawMode==='order'?'Shuffle':!s.repeat&&remaining===0?'New round':s.count>1?`Pick ${s.count}`:usesDice(s)?'Roll':'Pick'}</span></button>
    </div>`;
  }else if(state.page==='library'){
    out=`<div class="page-title"><div class="illustrated-title">${sceneArt('library')}<h2>Your collection</h2></div><button class="icon-button" data-action="new" aria-label="Create a picker">${icon('plus')}</button></div>${countLibraryCard()}${state.sets.map(x=>`<button class="set-card" data-open="${esc(x.id)}"><span class="tile illustrated-tile">${sceneArt(pickerMode(x),'mini')}</span><span><b>${esc(x.title)}</b><small>${x.repeat?description(x):`${E.pool(x).length-x.used.length} ${x.type==='names'?'choices':'numbers'} left`}</small></span>${icon('arrow','chevron')}</button>`).join('')}<button class="new-card" data-action="templates">${icon('plus')}Start a game</button><button class="quiet-button" data-action="challenge">Saving challenge</button>${adSlot()}<div class="backup-row"><button class="quiet-button" data-action="export">Export</button><button class="quiet-button" data-action="import">Import</button></div>`;
  }else{
    const all=state.sets.flatMap(x=>x.history.map((r,recordIndex)=>({...r,title:x.title,setId:x.id,recordIndex,source:x}))).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
    out=`<div class="page-title"><div class="illustrated-title">${sceneArt('history')}<div><h2>History</h2><p class="help history-retention">Last 2 days</p></div></div></div>${all.length?all.slice(0,100).map(r=>`<button class="history-row" data-history-set="${esc(r.setId)}" data-history-index="${r.recordIndex}"><div><b>${r.kind==='teams'?`${r.groups.length} teams · ${r.values.length} people`:r.kind==='order'?`${r.values.length} names shuffled`:r.values.map(v=>esc(displayValue(r.source,v))).join(' · ')}</b><small>${esc(r.title)}</small></div><time>${new Date(r.time).toLocaleDateString(undefined,{month:'short',day:'numeric'})}<br>${new Date(r.time).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</time></button>`).join(''):`<div class="empty">${sceneArt('history','large')}<p>Your picks from the last 2 days will appear here.</p></div>`}${all.length>100?'<p class="history-note">Latest 100 picks</p>':''}${adSlot()}`;
  }
  $('content').classList.toggle('pick-screen',state.page==='pick');
  $('content').innerHTML=out;
  fitNumberBackdrop();
  if(kind==='page'){ $('content').scrollTop=0;motion($('content'),[{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:320}); }
  if(kind==='draw')reveal(carry);
  if(kind==='clear')motion($('result'),[{opacity:0,transform:'translateY(80px) rotate(-30deg) scale(.7)'},{opacity:1,transform:'translateY(-12px) rotate(8deg) scale(1.08)',offset:.6},{opacity:1,transform:'translateY(3px) rotate(-2deg) scale(.98)',offset:.84},{opacity:1,transform:'translateY(0) rotate(0) scale(1)'}],{duration:850});
  renderAutoPick();
}
function fitNumberBackdrop(){
  const stage=$('stage'),result=$('result'),orb=document.querySelector('.orb');
  if(current().type==='names'||!stage?.getBoundingClientRect||!orb?.style)return;
  const bounds=stage.getBoundingClientRect(),size=result.getBoundingClientRect();
  orb.style.width=Math.min(bounds.width,Math.max(220,size.width+48))+'px';
  orb.style.height=Math.min(bounds.height-12,250)+'px';
}
function readableNames(values){return `<div class="readable-names">${values.map(v=>`<p>${esc(v)}</p>`).join('')}</div>`;}
function nameTiles(value,hidden=false){
  const chars=[...value],columns=Math.min(9,chars.length),rows=Math.ceil(chars.length/columns);
  return `<span class="name-tiles" style="--columns:${columns};--rows:${rows}">${chars.map((c,i)=>`<span class="name-tile flag-${i%5} ${c===' '?'space-tile':''}" style="${hidden?'visibility:hidden;':''}--turn:${(i%3-1)*3}deg">${esc(c)}</span>`).join('')}</span>`;
}
function flagBed(){
  const letters=E.pool(current()).flatMap(name=>[...name]).filter(c=>c.trim());
  const unique=[...new Set(letters)],count=Math.max(30,Math.min(48,unique.length));
  const cast=Array.from({length:count},(_,i)=>unique[i]||letters[E.randomIndex(letters.length)]||'✦');
  for(let i=cast.length-1;i>0;i--){const j=E.randomIndex(i+1);[cast[i],cast[j]]=[cast[j],cast[i]];}
  return `<div class="flag-bed" aria-hidden="true">${cast.map((letter,i)=>`<span class="letter-flag flag-${i%5}" style="--x:${3+(i*37+Math.random()*8)%87}%;--y:${3+(i*29+Math.random()*8)%82}%;--turn:${motionRandom(-22,22)}deg;--drift:${motionRandom(4,8)}s;--phase:${-motionRandom(0,5)}s;--wander-x:${motionRandom(-15,15)}px;--wander-y:${motionRandom(-19,19)}px">${esc(letter)}</span>`).join('')}</div>`;
}
function celebrate(stage,anchor){
  if(!stage||!canMove())return;
  anchor=anchor||stage.querySelector('.numeric-result')||stage;
  const host=stage.closest('.phone')||stage,layer=document.createElement('div');layer.className='burst-layer';layer.setAttribute('aria-hidden','true');host.append(layer);
  const bounds=host.getBoundingClientRect(),origin=anchor.getBoundingClientRect(),cx=origin.left+origin.width/2-bounds.left,cy=origin.top+origin.height/2-bounds.top;
  const colors=['var(--art-lilac)','var(--art-coral)','var(--art-sky)','var(--art-rose)','var(--art-lime)'],random=()=>E.randomIndex(10000)/10000;
  const particles=Array.from({length:72},()=>{const angle=random()*Math.PI*2,radius=45+Math.sqrt(random())*145;return {dx:Math.cos(angle)*radius,dy:Math.sin(angle)*radius*.83,size:5+random()*9,delay:random()*155,spin:(random()-.5)*900,shape:Math.floor(random()*5),life:1100+random()*650};});
  const mx=particles.reduce((a,p)=>a+p.dx,0)/particles.length,my=particles.reduce((a,p)=>a+p.dy,0)/particles.length;
  for(const [i,p] of particles.entries()){
    const el=document.createElement('i');el.className='celebration-piece '+(p.shape===0?'piece-star':p.shape===1?'piece-ring':'');el.setAttribute('aria-hidden','true');
    el.style.cssText=`left:${cx}px;top:${cy}px;width:${p.size}px;height:${p.size*(p.shape>1?1.6:1)}px;background:${colors[i%5]};color:${colors[i%5]}`;layer.append(el);
    const dx=p.dx-mx,dy=p.dy-my;
    const a=motion(el,[
      {opacity:0,transform:'translate(-50%,-50%) rotate(0deg) scale(.3)'},
      {opacity:1,offset:.08},
      {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${p.spin}deg) scale(1)`,offset:.58},
      {opacity:0,transform:`translate(calc(-50% + ${dx*1.12}px),calc(-50% + ${dy+38}px)) rotate(${p.spin*1.4}deg) scale(.75)`}
    ],{duration:p.life,delay:p.delay,easing:'cubic-bezier(.12,.65,.25,1)'});
    const remove=()=>{el.remove();if(!layer.children.length)layer.remove();};a?.finished.then(remove,remove);
  }
}
function finishReveal(result,value,s,withBurst=false){
  if(!result.isConnected)return;
  result.setAttribute('aria-busy','false');result.setAttribute('aria-label',value);
  result.classList.remove('revealing');
  // The reveal timeline already contains its overshoot and settle.
  if(withBurst)celebrate($('stage'));
}
let backdropAnimations=[];
function animateBackdrop(stage){
 backdropAnimations.forEach(a=>{a.sceneCleanup?.();a.cancel();});backdropAnimations=[];
 const clock=startGravityScene(stage,$('result'));if(clock)backdropAnimations.push(clock);return clock;
}
function reveal(carry=[]){
  const result=$('result'),s=current(),value=visibleResult(s)?.values.map(v=>displayValue(s,v)).join(' · ')||'';
  if(!visibleResult(s))return;
  if(isSymbolPicker(s)){symbolReveal(result,s,value);return;}
  if(s.drawMode==='wheel'){spinWheel(result,s,value);return;}
  if(!canMove()||!result.animate)return;
  if(['order','teams'].includes(s.drawMode)){arrangementFlight(result,s,carry);return;}
  if(s.type==='names'){nameFlight(result,s,value,carry);return;}
  if(!result.animate)return;
  const finalHTML=result.innerHTML,stage=$('stage'),pool=E.pool(s),actual=visibleResult(s).values;
  const candidates=pool.filter(v=>!actual.includes(v)&&(s.repeat||!s.used.includes(v)));
  const maxDigits=Math.max(value.length,...pool.map(v=>displayValue(s,v).length));
  result.style.setProperty('--digits',maxDigits);result.classList.toggle('long-number',maxDigits>4);
  result.setAttribute('aria-busy','true');result.dataset.phase='anticipation';result.classList.add('revealing');
  result.innerHTML=numberCarryHTML||'<span class="energy-symbol" aria-hidden="true">✦</span>';
  const clock=animateBackdrop(stage);
  let nextChange=1100,previous='',frame,settled=false,landed=false,burst=false;
  const land=()=>{if(landed)return;landed=true;result.innerHTML=finalHTML;result.style.setProperty('--digits',value.length);result.classList.toggle('long-number',value.length>4&&actual.length===1);result.dataset.phase='release';};
  const settle=()=>{
    if(settled)return;settled=true;cancelAnimationFrame(frame);
    if(!result.isConnected)return;
    result.innerHTML=finalHTML;result.style.setProperty('--digits',value.length);result.classList.toggle('long-number',value.length>4&&actual.length===1);result.dataset.phase='settled';fitNumberBackdrop();finishReveal(result,value,s,!burst);
  };
  const tick=()=>{
    if(!result.isConnected){clock?.cancel();return;}
    if(!canMove()){clock?.finish();settle();return;}
    const t=Number(clock?.currentTime||0);
    if(t>=3916)land();
    if(t>=4180&&!burst){burst=true;celebrate(stage);}
    if(!landed&&t>=1100&&t>=nextChange){
      result.dataset.phase='rolling';
      let preview=candidates.length?candidates[E.randomIndex(candidates.length)]:'?';
      if(candidates.length>1&&preview===previous)preview=candidates[(candidates.indexOf(preview)+1)%candidates.length];
      previous=preview;if(usesDice(s)&&preview!=='?')result.innerHTML=dieHTML(Number(preview));else result.textContent=displayValue(s,preview);
      nextChange=t+(t<3000?65:t<3700?145:270);
    }
    frame=requestAnimationFrame(tick);
  };
  clock?.finished.then(settle,()=>cancelAnimationFrame(frame));frame=requestAnimationFrame(tick);

}
function openSheet(title,body,art=sheetArtKind(title)){pauseAutoPick();const d=$('sheet');sheetEpoch++;d.getAnimations?.().forEach(a=>a.cancel());if(d.open)d.close();d.innerHTML=`<div class="sheet-top"><div class="sheet-heading">${body.includes('scene-art-large')?'':sceneArt(art)}<h2 id="sheet-title">${title}</h2></div><button class="icon-button sheet-close" data-action="close" aria-label="Close">${icon('close')}</button></div>${body}`;d.showModal();motion(d,[{opacity:0,transform:'translateY(38px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:360});}
function closeSheet(){const d=$('sheet'),epoch=++sheetEpoch;const a=motion(d,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(22px)'}],{duration:150});if(a)a.finished.then(()=>{if(sheetEpoch===epoch)d.close();},()=>{});else d.close();}
function confirm(title,copy,label,fn){openSheet(title,`<p class="help">${copy}</p><button class="primary" id="confirm-action">${label}</button>`);$('confirm-action').onclick=()=>{fn();closeSheet();};}
function commitConfig(next,isNew=false,remember=true){
  if(!next.title.trim())throw Error('Add a name.');
  if(isNew&&state.sets.length>=100)throw Error('You can save up to 100 pickers.');
  if(next.type==='set'){const vals=E.entries(next.text);if(vals.some(v=>!/^[-+]?\d+$/.test(v)||!Number.isSafeInteger(Number(v))))throw Error('Use whole numbers, or switch to Names.');next.text=[...new Set(vals.map(v=>String(Number(v))))].join(', ');}
  if(next.type==='numbers'&&next.numberMode!=='digits'||next.type==='set')next.exclude=E.entries(next.exclude).map(v=>/^[-+]?\d+$/.test(v)?String(Number(v)):v).join(',');
  validateExtras(next);validateNumberBase(next);const pool=E.pool(next),s=isNew?null:current();
  if(['teams','order','wheel'].includes(next.drawMode)&&next.type!=='names')next.drawMode='pick';
  if(['teams','order'].includes(next.drawMode)){E.arrange(next);next.repeat=true;}
  if(next.drawMode==='wheel')next.count=1;
  if(next.drawMode==='wheel'&&pool.length>100)throw Error('Use up to 100 choices on a wheel.');
  if(!Number.isInteger(next.count)||next.count<1||next.count>10)throw Error('Pick between 1 and 10.');
  if(!next.repeat&&next.count>pool.length)throw Error('There are fewer entries than picks.');
  if(!s||JSON.stringify(pool)!==JSON.stringify(E.pool(s))||next.repeat!==s.repeat||next.drawMode!==s.drawMode||next.teamCount!==s.teamCount){next.used=[];next.round=uid();next.displayCleared=false;}
  if(isNew)state.sets.push(next);else state.sets[state.sets.findIndex(x=>x.id===s.id)]=next;
  if(remember){next.example=false;rememberFill(next);}state.active=next.id;state.page='pick';save();render('page');
}
const numberFields=s=>`<label class="field">Number style<select name="numberMode"><option value="range" ${s.numberMode!=='digits'?'selected':''}>Range</option><option value="digits" ${s.numberMode==='digits'?'selected':''}>Allowed digits</option></select></label><div id="range-fields" ${s.numberMode==='digits'?'hidden':''}>${fillRow('range')}<div class="split quick-range"><label class="field">From<input name="min" type="number" inputmode="numeric" step="1" min="-9007199254740991" max="9007199254740991" aria-describedby="range-limit form-error" value="${s.min}"></label><label class="field">To<input name="max" type="number" inputmode="numeric" step="1" min="-9007199254740991" max="9007199254740991" aria-describedby="range-limit form-error" value="${s.max}"></label></div><p class="help" id="range-limit">Up to 10,000 numbers in a range.</p>${baseFields(s)}<label class="check"><input name="showsDice" type="checkbox" ${s.showsDice!==false?'checked':''}>Show as dice</label><p class="help">For one decimal number in a range within 1–8.</p></div><div id="digit-fields" ${s.numberMode!=='digits'?'hidden':''}>${fillRow('digits')}<div class="split"><label class="field">Allowed digits<input name="digits" value="${esc(s.digits||'1, 2, 3')}" inputmode="numeric" maxlength="40"></label><label class="field">Result length<input name="length" type="number" min="1" max="8" step="1" value="${s.length||5}"></label></div><p class="help">1–8 digits per result. Up to 10,000 combinations.</p><label class="check"><input name="allowLeadingZero" type="checkbox" ${s.allowLeadingZero?'checked':''}>Allow a starting zero</label></div>`;
function connectNumberStyle(form){
 if(!form.elements.numberMode)return;
 const update=()=>{const digits=form.elements.numberMode.value==='digits';$('range-fields').hidden=digits;$('digit-fields').hidden=!digits;for(const name of ['min','max'])form.elements.namedItem(name).disabled=digits;for(const name of ['digits','length','allowLeadingZero'])form.elements.namedItem(name).disabled=!digits;form.elements.displayBase.disabled=digits;};
 form.elements.numberMode.onchange=update;form.addEventListener('change',update);update();
}
function connectNumberValidation(form,original){
  const update=()=>{
    const isNumbers=!form.elements.type||form.elements.type.value==='numbers';
    const error=form.querySelector('#form-error'),button=form.querySelector('button[type="submit"]');
    const fields=['min','max','digits','length'].map(name=>form.elements.namedItem(name)).filter(Boolean);
    fields.forEach(el=>el.setAttribute('aria-invalid','false'));
    if(!isNumbers){form.elements.displayBase.disabled=true;for(const name of ['min','max','digits','length','allowLeadingZero'])form.elements.namedItem(name).disabled=true;error.textContent='';button.disabled=false;return true;}
    const digitMode=form.elements.numberMode.value==='digits';form.elements.displayBase.disabled=digitMode;for(const name of ['min','max'])form.elements.namedItem(name).disabled=digitMode;for(const name of ['digits','length','allowLeadingZero'])form.elements.namedItem(name).disabled=!digitMode;
    const data=new FormData(form),digits=data.get('numberMode')==='digits';let message='';
    try{
      const active=digits?[form.elements.digits,form.elements.namedItem('length')]:[form.elements.min,form.elements.max];
      if(active.some(el=>!el.value.trim()||el.validity.badInput))throw Error(digits?'Add allowed digits and a result length.':'Enter both ends of the range.');
      const next=numbersFrom(data,original);E.pool({...next,type:'numbers',exclude:form.elements.exclude?.value??original.exclude});validateNumberBase({...next,type:'numbers'});
    }catch(e){message=e.message;}
    error.textContent=message;button.disabled=!!message;
    (digits?[form.elements.digits,form.elements.namedItem('length')]:[form.elements.min,form.elements.max]).forEach(el=>el.setAttribute('aria-invalid',String(!!message)));
    return !message;
  };
  form.addEventListener('input',update);form.addEventListener('change',update);update();
}
function numbersFrom(data,s){return {...s,showsDice:data.has('showsDice'),numberMode:data.get('numberMode')||s.numberMode||'range',displayBase:Number(data.get('displayBase')??s.displayBase??10),min:Number(data.get('min')??s.min),max:Number(data.get('max')??s.max),digits:String(data.get('digits')??s.digits??'123'),length:Number(data.get('length')??s.length??5),allowLeadingZero:data.has('allowLeadingZero')};}
function quickRange(){const s=current();openSheet('Your numbers',`<form id="range-form">${numberFields(s)}${s.used.length?'<p class="help">Changing this range starts a new round.</p>':''}<span class="fill-status" role="status"></span><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Save</button></form>`);const f=$('range-form');connectNumberStyle(f);connectNumberValidation(f,s);attachFillTools(f);f.onsubmit=e=>{e.preventDefault();try{const d=new FormData(f);if(d.get('numberMode')==='range'&&(!String(d.get('min')).trim()||!String(d.get('max')).trim()))throw Error('Enter both ends of the range.');commitConfig(numbersFrom(d,s));closeSheet();}catch(e){$('form-error').textContent=e.message;}};}
function edit(isNew=false){
  const s=isNew?make(uid(),'','names'):current();
  openSheet(editorTitle(s,isNew),`<form id="edit-form"><label class="field">Picker name<input name="title" list="picker-title-suggestions" value="${esc(s.title)}" maxlength="60" required placeholder="Friday game night"></label>${titleSuggestions()}<label class="field">Pick from<select name="type"><option value="numbers" ${s.type==='numbers'?'selected':''}>Numbers</option><option value="names" ${s.type==='names'?'selected':''}>Names or choices</option><option value="set" ${s.type==='set'?'selected':''}>Custom number set</option></select></label><div id="number-fields" ${s.type!=='numbers'?'hidden':''}>${numberFields(s)}</div><div id="entry-fields" ${s.type==='numbers'?'hidden':''}><div id="entry-suggestions"></div><label class="field">Choices<textarea name="text" placeholder="One per line, or separated by commas">${esc(s.text)}</textarea></label><p class="help">Duplicate labels count once. For two Sams, use “Sam A” and “Sam B”.</p></div><div id="name-mode-fields" ${s.type!=='names'?'hidden':''}><label class="field">Use this list for<select name="drawMode">${[['pick','Pick a name'],['wheel','Spin the wheel'],['order','Shuffle everyone'],['teams','Make teams'],['coin','Heads or tails'],['chess','Chess pieces']].map(([id,label])=>`<option value="${id}" ${(s.drawMode||'pick')===id?'selected':''}>${label}</option>`).join('')}</select></label><label class="field" id="team-count-field" ${s.drawMode!=='teams'?'hidden':''}>Number of teams<input name="teamCount" type="number" min="2" max="100" value="${s.teamCount||2}"></label><div id="team-suggestions"></div></div><details><summary>Draw settings</summary><label class="field">Leave out<input name="exclude" value="${esc(s.exclude)}" placeholder="Names or numbers, separated by commas"></label><div id="exclude-suggestions"></div><label class="field" id="pick-count-field">Picks per tap<input name="count" type="number" min="1" max="10" step="1" value="${s.count}" required></label><div id="count-suggestions"></div><label class="check" id="repeat-field"><input type="checkbox" name="repeat" ${s.repeat?'checked':''}>Allow repeats</label></details>${!isNew?'<p class="help">Changing choices or repeat settings starts a new round. Your recent history stays.</p>':''}<span class="fill-status" role="status"></span><p class="error" id="form-error" role="alert"></p><button class="primary" type="submit">Save</button></form>`);
  const f=$('edit-form');arrangePickerEditor(f,isNew);connectNumberStyle(f);
  const syncFields=()=>{const type=f.elements.type.value,mode=type==='names'?f.elements.drawMode.value:'pick',whole=['teams','order'].includes(mode);$('number-fields').hidden=type!=='numbers';$('entry-fields').hidden=type==='numbers';$('name-mode-fields').hidden=type!=='names';$('team-count-field').hidden=mode!=='teams';$('pick-count-field').hidden=whole||mode==='wheel';$('repeat-field').hidden=whole;f.elements.teamCount.disabled=mode!=='teams';f.elements.count.disabled=whole||mode==='wheel';};
  f.elements.drawMode.onchange=()=>{const mode=f.elements.drawMode.value;if(['coin','chess'].includes(mode)){f.elements.text.value=mode==='coin'?'Heads\nTails':CHESS_PIECES.join('\n');f.elements.count.value=1;f.elements.exclude.value='';f.elements.repeat.checked=true;}syncFields();};f.elements.type.onchange=syncFields;syncFields();connectNumberValidation(f,s);attachFillTools(f);
  f.onsubmit=e=>{e.preventDefault();try{const d=new FormData(f),type=d.get('type');if(type==='numbers'&&d.get('numberMode')==='range'&&(!String(d.get('min')).trim()||!String(d.get('max')).trim()))throw Error('Enter both ends of the range.');const next={...numbersFrom(d,s),title:String(d.get('title')).trim(),type,text:String(d.get('text')),exclude:String(d.get('exclude')),count:Number(d.get('count')||1),repeat:d.has('repeat'),drawMode:type==='names'?String(d.get('drawMode')||'pick'):'pick',teamCount:Number(d.get('teamCount')||2)};commitConfig(next,isNew);closeSheet();}catch(e){$('form-error').textContent=e.message;}};
}
function restart(){confirm('New round?','All entries return to the pool. Recent history stays.','Start round',()=>{const s=current();s.used=[];s.round=uid();s.displayCleared=false;save();render('clear');});}
function repeat(){const apply=()=>{commitConfig({...current(),repeat:!current().repeat});closeSheet();};if(recent(current()).length)confirm('Change repeat rule?','This starts a new round. Your past picks stay in History.','Change rule',apply);else apply();}
function pickCount(){openSheet('Picks per tap',`<form id="count-form"><label class="field">Count<input name="count" type="number" min="1" max="10" value="${current().count}" required></label><p class="error" id="form-error" role="alert"></p><button class="primary">Done</button></form>`);$('count-form').onsubmit=e=>{e.preventDefault();try{commitConfig({...current(),count:Number(new FormData(e.target).get('count'))});closeSheet();}catch(e){$('form-error').textContent=e.message;}};}
function exportBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='keli-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function preferences(){showSettings();}
function legacyPreferences(){openSheet('Preferences',`<button class="preference-row" data-setting="motion" role="switch" aria-checked="${state.motion}"><span>Playful motion</span><span class="switch ${state.motion?'on':''}"></span></button><button class="preference-row" data-setting="dark" role="switch" aria-checked="${state.dark}"><span>Dark appearance</span><span class="switch ${state.dark?'on':''}"></span></button><button class="preference-row" data-action="export">Export backup ${icon('arrow')}</button><button class="preference-row" data-action="import">Import backup ${icon('arrow')}</button><p class="preference-note">${reducedMotion.matches?'Reduce Motion is on. Reveals are instant.':'Saved in this browser. Export a backup before clearing website data.'}</p>`);}
function saveAs(){openSheet('Save a copy',`<form id="save-form"><label class="field">Picker name<input name="title" list="picker-title-suggestions" maxlength="60" required placeholder="Friday game night"></label>${titleSuggestions()}<p class="help">Keeps the choices and starts a new round.</p><button class="primary">Save</button><p class="error" id="form-error" role="alert"></p></form>`);$('save-form').onsubmit=e=>{e.preventDefault();try{const title=new FormData(e.target).get('title').trim();commitConfig({...current(),id:uid(),title,used:[],history:[],round:uid()},true);closeSheet();}catch(e){$('form-error').textContent=e.message;}};}
function challenge(){openSheet('Saving challenge',`<form id="challenge-form"><label class="field">Number range<select name="max"><option value="100">1–100</option><option value="150">1–150</option></select></label><p class="help">One number at a time. No repeats. Progress stays saved.</p><button class="primary">Create</button><p class="error" id="form-error" role="alert"></p></form>`);$('challenge-form').onsubmit=e=>{e.preventDefault();try{const max=Number(new FormData(e.target).get('max'));commitConfig(make(uid(),`${max}-day challenge`,'numbers',{max}),true);closeSheet();}catch(e){$('form-error').textContent=e.message;}};}
const actions={'keep-count':openCounts,'count-add':showCountAdd,'count-options':showCountOptions,'count-reset':()=>confirm('Reset counts?','Everyone goes back to 0. Names and levels stay saved.','Reset counts',()=>{state.counters.people.forEach(p=>p.count=0);save();render();}),suggestions:showSavedSuggestions,'clear-suggestions':()=>confirm('Clear saved suggestions?','Your pickers and current rounds stay.','Clear suggestions',()=>{state.suggestions=[];save();}),templates:showTemplates,board:showRoundBoard,support:showSupport,help:showHelp,welcome:showWelcome,start:startLucky,restore:()=>toast('Purchases will restore through the App Store in the iOS app.'),'preview-support':()=>{state.previewAdFree=true;save();render();closeSheet();toast('Ad-free preview is on. No purchase was made.');},'reset-support':()=>{state.previewAdFree=false;save();render();showSettings();},edit:()=>edit(),new:()=>edit(true),range:quickRange,repeat,count:pickCount,restart,close:closeSheet,export:exportBackup,import:()=>$('import-file').click(),saveas:saveAs,challenge,
  mode:showPickerChooser,
  'round-menu':()=>{const s=current(),last=visibleResult(s),whole=['teams','order'].includes(s.drawMode);openSheet('Picker actions',`<button class="preference-row" data-action="auto-pick">Auto pick ${icon('history')}</button><button class="preference-row" data-action="board">This round ${icon('history')}</button><button class="preference-row" data-action="edit">Edit picker ${icon('edit')}</button>${last?`<button class="preference-row" data-action="clear">Clear display ${icon('clear')}</button><button class="preference-row" data-action="copy">Copy result ${icon('copy')}</button>`:''}<button class="preference-row" data-action="restart">New round ${icon('repeat')}</button><button class="preference-row" data-action="saveas">Save a copy ${icon('copy')}</button>`);},
  draw:()=>{if($('result')?.getAttribute?.('aria-busy')==='true')return;const s=current();if(['order','teams'].includes(s.drawMode)){try{const {values,groups}=E.arrange(s);s.history.push({values,groups,kind:s.drawMode,time:new Date().toISOString(),round:s.round});s.history=s.history.slice(-1000);s.displayCleared=false;save();render('draw');}catch(e){toast(e.message);}return;}if(!s.repeat&&s.used.length===E.pool(s).length){restart();return;}try{const {result,used}=E.draw(s,s.used);s.used=used;s.displayCleared=false;s.history.push({values:result,time:new Date().toISOString(),round:s.round});s.history=s.history.slice(-1000);save();render('draw');}catch(e){toast(e.message);}},
  clear:()=>{closeSheet();if(!visibleResult(current()))return;current().displayCleared=true;save();render('clear');},
  undo:()=>{const s=current(),i=s.history.findLastIndex(r=>r.round===s.round);if(i<0)return;const [last]=s.history.splice(i,1);if(!s.repeat)s.used=s.used.filter(v=>!last.values.includes(v));s.displayCleared=false;save();render('page');},
  copy:async()=>{closeSheet();const r=visibleResult(current());if(!r)return;const text=r.kind==='teams'?r.groups.map((g,i)=>`Team ${i+1}: ${g.join(', ')}`).join('\n'):r.kind==='order'?r.values.map((v,i)=>`${i+1}. ${v}`).join('\n'):r.values.map(v=>displayValue(current(),v)).join(', ');try{await navigator.clipboard.writeText(text);toast('Copied');}catch(e){openSheet('Copy result',`<textarea aria-label="Result to copy" readonly>${esc(text)}</textarea>`);}}
};
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(handleCountClick(b))return;
  if(b.dataset.fill)applyFill(b);
  else if(b.dataset.countFill){const f=b.closest('form');f.elements.count.value=b.dataset.countFill;f.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(b.dataset.excludeChoice){const f=b.closest('form');f.elements.exclude.value=[...new Set([...E.entries(f.elements.exclude.value),b.dataset.excludeChoice])].join(', ');f.dispatchEvent(new Event('input',{bubbles:true}));}
  else if(b.dataset.teamFill){const f=b.closest('form');f.elements.teamCount.value=b.dataset.teamFill;f.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(b.dataset.forgetFill!==undefined){state.suggestions.splice(Number(b.dataset.forgetFill),1);save();showSavedSuggestions();}
  else if(b.dataset.welcome){welcomeChoice=b.dataset.welcome;document.querySelectorAll('[data-welcome]').forEach(el=>{el.classList.toggle('selected',el.dataset.welcome===welcomeChoice);el.setAttribute('aria-pressed',String(el.dataset.welcome===welcomeChoice));});}
  else if(b.dataset.picker)selectPicker(b.dataset.picker);
  else if(b.dataset.template)createGame(b.dataset.template);
  else if(b.dataset.historySet)showHistoryRecord(b.dataset.historySet,Number(b.dataset.historyIndex));
  else if(b.dataset.setting){const key=b.dataset.setting;state[key]=key==='rememberSuggestions'?state[key]===false:!state[key];save();theme();b.setAttribute('aria-checked',String(state[key]));b.querySelector('.switch').classList.toggle('on',state[key]);if(!canMove())document.getAnimations().forEach(a=>a.finish());}
  else if(b.dataset.page){if(b.dataset.page==='pick'){showPickerChooser();}else{state.page=b.dataset.page;render('page');}}
  else if(b.dataset.type){const s=state.sets.find(s=>s.type===b.dataset.type);if(s){state.active=s.id;save();render('page');closeSheet();}else edit(true);}
  else if(b.dataset.open){state.active=b.dataset.open;state.page='pick';save();render('page');}
  else if(b.dataset.action)actions[b.dataset.action]?.();
});
$('sheet').addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
$('sheet').addEventListener('click',e=>{if(e.target===$('sheet')){const r=$('sheet').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSheet();}});
$('preferences').innerHTML=icon('settings');$('preferences').onclick=preferences;
document.querySelectorAll('.navigation [data-page]').forEach(b=>{const page=b.dataset.page;b.innerHTML=icon(page==='pick'?'pickers':page)+`<span>${page==='pick'?'Tools':page==='library'?'Library':'History'}</span>`;});
$('import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5000000)throw Error('Use a backup smaller than 5 MB.');const imported=validate(JSON.parse(await file.text()));openSheet('Replace collection?',`<p class="help">Import ${imported.sets.length} pickers. This replaces your pickers and saved counts.</p><button class="secondary" data-action="export">Export current backup</button><button class="primary" id="confirm-import" style="margin-top:12px">Replace</button>`);$('confirm-import').onclick=()=>{state=imported;storageIssue='';save();render('page');closeSheet();};}catch(error){toast(error.message);}finally{e.target.value='';}};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body&&!$('sheet').open&&!$('welcome-screen')&&state.page==='pick'){e.preventDefault();actions.draw();}});
reducedMotion.addEventListener('change',()=>{theme();if(!canMove())document.getAnimations().forEach(a=>a.finish());});
render();

globalThis.addEventListener?.('resize',fitNumberBackdrop);

setTimeout(()=>{const launch=$('launch-screen');if(launch){const a=motion(launch,[{opacity:1},{opacity:0}],{duration:200});if(a)a.finished.then(()=>launch.remove(),()=>launch.remove());else launch.remove();}if(!state.welcomed)showWelcome();},0);

// History expires independently of the active no-repeat pool.
globalThis.setInterval?.(()=>{if(pruneHistory()){save();if(state.page==='history')render();}},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&pruneHistory()){save();if(state.page==='history')render();}});

keliInit();
