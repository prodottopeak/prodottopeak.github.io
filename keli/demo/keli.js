/* Working-preview additions. The Research snapshot remains unchanged. */
const CHESS_PIECES=['Pawn','Knight','Bishop','Rook','Queen','King'];
const CHESS_MARKS={Pawn:'♟',Knight:'♞',Bishop:'♝',Rook:'♜',Queen:'♛',King:'♚'};
function isSymbolPicker(s){return ['coin','chess'].includes(s.drawMode);}
function usesDice(s){return s.type==='numbers'&&s.numberMode!=='digits'&&(s.displayBase??10)===10&&s.count===1&&s.min>=1&&s.max<=8&&s.showsDice!==false;}
function validateExtras(s){
 if(s.autoInterval!==undefined&&(!Number.isInteger(s.autoInterval)||s.autoInterval<10||s.autoInterval>3600))throw Error('Choose an interval from 10 seconds to 1 hour.');
 if(!isSymbolPicker(s))return;
 const pool=E.pool(s);
 if(s.type!=='names'||s.count!==1)throw Error('Choose one result at a time for this picker.');
 if(s.drawMode==='coin'&&(pool.length!==2||!pool.includes('Heads')||!pool.includes('Tails')))throw Error('A coin needs both Heads and Tails.');
 if(s.drawMode==='chess'&&pool.some(v=>!CHESS_PIECES.includes(v)))throw Error('Choose from Pawn, Knight, Bishop, Rook, Queen and King.');
}
function pipPositions(n){return ({1:[[50,50]],2:[[28,28],[72,72]],3:[[28,28],[50,50],[72,72]],4:[[28,28],[72,28],[28,72],[72,72]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]],6:[[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],7:[[25,25],[75,25],[25,50],[50,50],[75,50],[25,75],[75,75]],8:[[25,25],[50,25],[75,25],[25,50],[75,50],[25,75],[50,75],[75,75]]})[n]||[];}
function dieHTML(n){return `<span class="result-die" data-value="${n}" aria-label="Rolled ${n}"><svg viewBox="0 0 120 140" aria-hidden="true"><rect x="6" y="7" width="112" height="130" rx="30" fill="var(--art-purple)"/><rect x="1" y="1" width="112" height="130" rx="30" fill="var(--art-lime)"/>${pipPositions(n).map(([x,y])=>`<circle cx="${x+7}" cy="${y*.8+2}" r="6" fill="#30213f"/>`).join('')}<text x="57" y="113" text-anchor="middle" fill="#30213f" font-size="26" font-weight="800">${n}</text></svg></span>`;}
function drawDieTexture(c,w,h,n){
 c.fillStyle='#6e5790';c.beginPath();c.roundRect(10,12,w-14,h-15,34);c.fill();c.fillStyle='#EAF4AA';c.beginPath();c.roundRect(3,3,w-14,h-15,34);c.fill();c.fillStyle='#30213f';
 for(const [x,y] of pipPositions(n)){c.beginPath();c.arc(x/100*(w-30)+10,y/100*(h*.55)+8,8,0,Math.PI*2);c.fill();}
 c.font='800 38px system-ui';c.textAlign='center';c.fillText(String(n),w/2-4,h-28);
}
function symbolHTML(s,value){
 if(s.drawMode==='coin')return `<div class="symbol-result"><span class="result-coin" aria-hidden="true"><span>${value==='Tails'?'✦':'☺'}</span></span><b>${esc(value||'Heads or tails')}</b></div>`;
 return `<div class="symbol-result"><div class="chess-board" aria-hidden="true"><span class="result-piece">${CHESS_MARKS[value]||CHESS_MARKS.Knight}</span></div><b>${esc(value||'Pick a piece')}</b></div>`;
}
function symbolReveal(result,s,value){
 if(!canMove())return;
 result.setAttribute('aria-busy','true');const label=result.querySelector('b');label.style.visibility='hidden';
 const face=result.querySelector('.result-coin,.result-piece'),coin=s.drawMode==='coin';
 const a=motion(face,coin?[
  {transform:'translateY(0) rotateY(0deg)'}, {transform:'translateY(10px) rotateY(-20deg) scale(.94)',offset:.12},
  {transform:'translateY(-65px) rotateY(1080deg)',offset:.48}, {transform:'translateY(-28px) rotateY(1740deg)',offset:.8},
  {transform:'translateY(6px) rotateY(1800deg) scale(1.06)',offset:.94}, {transform:'translateY(0) rotateY(1800deg)'}
 ]:[{transform:'translate(0,0) rotate(0deg)'},{transform:'translate(30px,-25px) rotate(12deg)',offset:.22},{transform:'translate(-35px,-40px) rotate(-14deg)',offset:.46},{transform:'translate(20px,-15px) rotate(8deg)',offset:.68},{transform:'translate(0,-60px) scale(1.15)',offset:.85},{transform:'translate(0,0) scale(1)'}],{duration:4400,easing:'ease-in-out'});
 a?.finished.then(()=>{if(!result.isConnected)return;label.style.visibility='';finishReveal(result,value,s,true);},()=>{});
}
function paceControl(){const i=['full','quick','instant'].indexOf(state.motionMode||'full');return `<div class="pace-control"><label for="animation-pace">Animation pace</label><input id="animation-pace" type="range" min="0" max="2" step="1" value="${i}" aria-valuetext="${['Full','Quick','Instant'][i]}"><div aria-hidden="true"><span>Full</span><span>Quick</span><span>Instant</span></div></div>`;}
function feedbackLinks(){return `<h3 class="settings-label">${sceneArt('help','mini')}Feedback</h3><button class="preference-row" data-action="feature">Suggest a feature ${icon('arrow')}</button><button class="preference-row" data-action="problem">Report a problem ${icon('arrow')}</button><h3 class="settings-label">${sceneArt('games','mini')}Make it yours</h3><button class="preference-row" data-action="event">Keli for your event ${icon('arrow')}</button>`;}
function showFeedback(kind){
 const title={feature:'Suggest a feature',problem:'Report a problem',event:'Keli for your event'}[kind];
 openSheet(title,`<form id="feedback-form">${kind==='event'?'<p class="help">A tournament, a classroom, or a night with friends. Tell me what you have in mind.</p><label class="field">Event name (optional)<input name="event" maxlength="120"></label>':''}<label class="field">${kind==='feature'?'What would you like to do?':kind==='problem'?'What happened?':'What would make Keli yours?'}<textarea name="message" maxlength="4000" required rows="5"></textarea></label><p class="help">Opens an email draft for you to send. Your lists and picks aren’t included.</p><button class="primary" type="submit" disabled>Open email</button><p class="help">Or email prodottopeak@gmail.com</p></form>`,kind==='event'?'games':'help');
 const form=$('feedback-form');form.oninput=()=>form.querySelector('button').disabled=!form.elements.message.value.trim();
 form.onsubmit=e=>{e.preventDefault();const d=new FormData(form),body=(d.get('event')?`Event: ${d.get('event')}\n\n`:'')+d.get('message');location.href=`mailto:prodottopeak@gmail.com?subject=${encodeURIComponent('Keli: '+title)}&body=${encodeURIComponent(body)}`;};
}
let autoPickerID=null,autoNext=0,autoTick=null;
function pauseAutoPick(){autoPickerID=null;autoNext=0;if(typeof document!=='undefined'){document.getElementById('auto-status')?.remove?.();const button=document.getElementById('draw');if(button?.dataset?.auto==='true'){delete button.dataset.auto;button.querySelector('span').textContent=usesDice(current())?'Roll':({wheel:'Spin',coin:'Flip',teams:'Make teams',order:'Shuffle'}[current().drawMode]||'Pick');}}}
function renderAutoPick(){
 if(!autoPickerID)return;
 if(state.page!=='pick'||current().id!==autoPickerID){pauseAutoPick();return;}
 const footer=document.querySelector('.pick-footer');if(!footer)return;
 let status=$('auto-status');if(!status){status=document.createElement('div');status.id='auto-status';status.className='auto-status';footer.prepend(status);}
 status.textContent=`Next pick in ${Math.max(0,Math.ceil((autoNext-Date.now())/1000))}s`;
 const b=$('draw');b.dataset.auto='true';b.querySelector('span').textContent='Pause';b.disabled=false;
}
function canAutoDraw(s){return ['order','teams'].includes(s.drawMode)||s.repeat||E.pool(s).length-s.used.length>=s.count;}
function showAutoPick(){
 const s=current();openSheet('Auto pick',`<form id="auto-form"><label class="field">Every<select name="interval">${[10,30,60,300,...(![10,30,60,300].includes(s.autoInterval||10)?[s.autoInterval]:[])].map(n=>`<option value="${n}" ${n===(s.autoInterval||10)?'selected':''}>${n<60?n+' seconds':n%60?n+' seconds':n/60+' minute'+(n>60?'s':'')}</option>`).join('')}</select></label><label class="field">Seconds<input name="seconds" type="number" min="10" max="3600" step="1" value="${s.autoInterval||10}" required></label><p class="help">The first pick starts now. Leaving this picker or putting the app in the background pauses Auto pick.</p><p class="error" id="form-error" role="alert">${canAutoDraw(s)?'':'Start a new round first.'}</p><button class="primary" ${canAutoDraw(s)?'':'disabled'}>Start auto pick</button></form>`);
 const f=$('auto-form');f.elements.interval.onchange=()=>f.elements.seconds.value=f.elements.interval.value;
 f.onsubmit=e=>{e.preventDefault();const n=Number(f.elements.seconds.value);if(!Number.isInteger(n)||n<10||n>3600){$('form-error').textContent='Choose 10–3,600 seconds.';return;}s.autoInterval=n;save();closeSheet();autoPickerID=s.id;autoNext=Date.now()+n*1000;actions.draw();renderAutoPick();};
}
function keliInit(){
 actions['auto-pick']=showAutoPick;actions.feature=()=>showFeedback('feature');actions.problem=()=>showFeedback('problem');actions.event=()=>showFeedback('event');
 document.addEventListener('input',e=>{if(e.target.id!=='animation-pace')return;state.motionMode=['full','quick','instant'][Number(e.target.value)];state.motion=state.motionMode!=='instant';e.target.setAttribute('aria-valuetext',['Full','Quick','Instant'][Number(e.target.value)]);save();theme();if(!canMove())document.getAnimations().forEach(a=>a.finish());});
 document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b?.id==='draw'&&autoPickerID){e.stopImmediatePropagation();pauseAutoPick();}else if(b&&(b.dataset?.page||b.dataset?.open))pauseAutoPick();},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAutoPick();});
 autoTick=globalThis.setInterval?.(()=>{
  if(!autoPickerID)return;if(document.hidden||state.page!=='pick'||current().id!==autoPickerID){pauseAutoPick();return;}
  if(Date.now()>=autoNext&&$('result')?.getAttribute('aria-busy')!=='true'){
   if(!canAutoDraw(current())){pauseAutoPick();toast('Round finished. Start a new round when you’re ready.');return;}
   const before=current().history.at(-1);autoNext=Date.now()+(current().autoInterval||10)*1000;actions.draw();if(current().history.at(-1)===before){pauseAutoPick();return;}
  }renderAutoPick();
 },250);
}
