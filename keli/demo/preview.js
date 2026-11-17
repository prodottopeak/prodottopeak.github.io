/* Bounded website examples. Reuses Keli's prototype renderer, not a second app. */
const sampleNames='Maya\nLeo\nAva\nNoah\nZoe\nFinn';
state.sets=[
 make('numbers','Pick a number','numbers',{repeat:true}),
 make('dice','Roll a die','numbers',{min:1,max:6,repeat:true}),
 make('names','Who goes first?','names',{text:sampleNames,repeat:true}),
 make('coin','Heads or tails','names',{text:'Heads\nTails',drawMode:'coin',repeat:true}),
 make('wheel','Dinner tonight','names',{text:'Pizza\nSushi\nTacos\nPasta\nCurry\nBurgers',drawMode:'wheel',repeat:true}),
 make('teams','Game night','names',{text:sampleNames,drawMode:'teams',teamCount:2,repeat:true}),
 make('shuffle','Who goes first?','names',{text:sampleNames,drawMode:'order',repeat:true})
];
state.dark=false;state.welcomed=true;state.active='numbers';state.page='pick';
state.counters={people:[{id:'maya',name:'Maya',count:12,level:3},{id:'leo',name:'Leo',count:9,level:2}],levels:true,label:'Level',max:10};
clearInterval(autoTick);
// Expose just the pick button and direct score/level controls. Full app menus,
// purchases, feedback and backup flows have no role in a marketing preview.
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(button&&button.id!=='draw'&&!button.dataset.countStep){event.preventDefault();event.stopImmediatePropagation();}
},true);
const oldResultHTML=resultHTML,oldReveal=reveal;
const faces=n=>pipPositions(n).map(([x,y])=>`<circle cx="${50+(x-50)*.8}" cy="${50+(y-50)*.8}" r="4.1"/>`).join('');
const dieValues=n=>{const right=[1,2,3].find(v=>v!==n&&v!==7-n),top=[1,2,3,4,5,6].find(v=>![n,7-n,right,7-right].includes(v));return [n,right,7-n,7-right,top,7-top]};
dieHTML=n=>`<span class="result-die native-die" data-value="${n}" aria-label="Rolled ${n}"><span class="die-cube">${dieValues(n).map((v,i)=>`<svg class="die-face face-${i}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="10"/>${faces(v)}<text x="84" y="87">${v}</text></svg>`).join('')}</span></span>`;
// CoinStamp's paths and face colours come from App/CoinChessViews.swift.
function coinFace(heads){return `<svg viewBox="0 0 190 190" aria-hidden="true"><circle cx="95" cy="95" r="95" fill="${heads?'#eaf4aa':'#f4cbd7'}"/><circle cx="95" cy="95" r="78.5" fill="none" stroke="#30213f" stroke-opacity=".33" stroke-width="3"/><svg x="30" y="30" width="130" height="130" viewBox="0 0 100 100" fill="none" stroke="#30213f" stroke-width="4.615" stroke-linecap="round" stroke-linejoin="round">${heads?'<ellipse cx="31.25" cy="36" rx="4.25" ry="7"/><path d="M58 37Q66.5 22 75 37M27 58C43 86 68 79 76 54"/>':'<path d="M29 75C18 36 81 36 72 75M50 60C46 36 88 45 69 20C57 10 46 19 58 31"/><ellipse cx="30.5" cy="76.5" rx="9.5" ry="4.5"/><ellipse cx="70.5" cy="76.5" rx="9.5" ry="4.5"/>'}</svg></svg>`;}
symbolHTML=(s,value)=>`<div class="symbol-result"><span class="native-coin ${value==='Tails'?'tails':''}" aria-hidden="true"><span class="coin-front">${coinFace(true)}</span><span class="coin-back">${coinFace(false)}</span></span><b>${esc(value||'Heads or tails')}</b></div>`;
resultHTML=s=>usesDice(s)&&!visibleResult(s)?dieHTML(4):oldResultHTML(s);
symbolReveal=(result,s,value)=>{
 if(!canMove()){finishReveal(result,value,s);return;}
 result.setAttribute('aria-busy','true');const coin=result.querySelector('.native-coin'),label=result.querySelector('b');label.style.visibility='hidden';
 const target=value==='Tails'?1260:1080;
 const animation=motion(coin,[
  {transform:'translateY(0) rotateX(0deg)'},
  {transform:'translateY(10px) rotateX(-14deg) scale(.94)',offset:.12},
  {transform:`translateY(-65px) rotateX(${target*.6}deg) rotateZ(-12deg)`,offset:.48},
  {transform:`translateY(-28px) rotateX(${target*.967}deg)`,offset:.8},
  {transform:`translateY(6px) rotateX(${target}deg) scale(1.06)`,offset:.94},
  {transform:`translateY(0) rotateX(${target}deg)`}
 ],{duration:4400,easing:'ease-in-out'});
 const done=()=>{label.style.visibility='';finishReveal(result,value,s);};animation?.finished.then(done,done);
};
reveal=(carry=[])=>{
 const s=current();if(!usesDice(s))return oldReveal(carry);
 const result=$('result'),value=visibleResult(s)?.values[0];if(!canMove()){finishReveal(result,value,s);return;}
 result.setAttribute('aria-busy','true');const cube=result.querySelector('.die-cube');
 // Native die's two x turns, three y turns and one z turn; flat face colours.
 const animation=motion(cube,[
  {transform:'translateY(0) rotateZ(-7deg) rotateY(-13deg) rotateX(10deg)'},
  {transform:'translateY(10px) rotateZ(-19deg) rotateY(-51deg) rotateX(-15deg)',offset:.12},
  {transform:'translateY(10px) rotateZ(-19deg) rotateY(-51deg) rotateX(-15deg)',offset:.25},
  {transform:'translateY(-42px) rotateZ(288deg) rotateY(872deg) rotateX(600deg)',offset:.68},
  {transform:'translateY(-24px) rotateZ(353deg) rotateY(1067deg) rotateX(730deg)',offset:.89},
  {transform:'translateY(5px) rotateZ(353deg) rotateY(1067deg) rotateX(730deg)',offset:.94},
  {transform:'translateY(0) rotateZ(353deg) rotateY(1067deg) rotateX(730deg)'}
 ],{duration:4400,easing:'ease-in-out'});
 animation?.finished.then(()=>{finishReveal(result,value,s,true);},()=>finishReveal(result,value,s));
};
function selectMode(mode){
 if(mode!=='counts'&&!state.sets.some(s=>s.id===mode))return;
 backdropAnimations.forEach(a=>{a.sceneCleanup?.();a.cancel();});backdropAnimations=[];
 document.getAnimations().forEach(a=>a.cancel());
 state.page=mode==='counts'?'counts':'pick';if(mode!=='counts')state.active=mode;
 document.body.dataset.mode=mode;render();
 document.querySelectorAll('button:not(#draw):not([data-count-step])').forEach(b=>{b.tabIndex=-1;b.setAttribute('aria-disabled','true');});
}
window.selectKeliPreview=selectMode;
window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='keli-preview')selectMode(e.data.mode);});
selectMode(new URLSearchParams(location.search).get('mode')||'numbers');
// Idle motion pauses with the page or when the parent scrolls the preview away.
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='keli-visibility')return;document.body.classList.toggle('preview-paused',!e.data.visible);});
