/* Game setup and prototype-only product surfaces. No ad SDK or purchase calls. */
const GAME_PRESETS=[
 {id:'coin',title:'Heads or tails',detail:'One fair flip',type:'names',text:'Heads\nTails',drawMode:'coin',repeat:true},
 {id:'chess',title:'Chess pieces',detail:'Choose a piece',type:'names',text:'Pawn\nKnight\nBishop\nRook\nQueen\nKing',drawMode:'chess',repeat:true},
 {id:'binary',title:'0 or 1',detail:'One bit. Two possibilities.',type:'numbers',min:0,max:1,repeat:true,displayBase:2},
 {id:'binary-range',title:'Binary numbers',detail:'0–15, shown in base 2',type:'numbers',min:0,max:15,repeat:true,displayBase:2},
 {id:'octal',title:'Octal numbers',detail:'0–63, shown in base 8',type:'numbers',min:0,max:63,repeat:true,displayBase:8},
 {id:'bingo',title:'Bingo · 75',detail:'Call each number once',type:'numbers',min:1,max:75,repeat:false},
 {id:'tambola',title:'Tambola · 90',detail:'Call each number once',type:'numbers',min:1,max:90,repeat:false},
 {id:'raffle',title:'Raffle tickets',detail:'0–999, without repeats',type:'numbers',min:0,max:999,repeat:false},
 {id:'dice',title:'Two dice',detail:'Roll two six-sided dice',type:'numbers',min:1,max:6,count:2,repeat:true},
 {id:'d20',title:'1–20',detail:'1–20, with repeats',type:'numbers',min:1,max:20,repeat:true},
 {id:'turns',title:'Take turns',detail:'Everyone gets a turn',type:'names',repeat:false},
 {id:'order',title:'Shuffle a list',detail:'Put your list in a random order',type:'names',drawMode:'order',repeat:true},
 {id:'teams',title:'Make teams',detail:'Split everyone into balanced groups',type:'names',drawMode:'teams',teamCount:2,repeat:true},
 {id:'wheel',title:'Spin the wheel',detail:'Spin to choose',type:'names',drawMode:'wheel',repeat:true},
 {id:'challenge150',title:'150-day challenge',detail:'Pick once, keep your progress',type:'numbers',min:1,max:150,repeat:false}
];
function createGame(id){
 const p=GAME_PRESETS.find(p=>p.id===id);if(!p)return;
 const {id:templateId,detail,...config}=p;
 const source=state.sets.find(x=>x.type==='names'&&!isSymbolPicker(x)),text=p.text||source?.text||AVENGERS;
 try{commitConfig(make(uid(),p.title,p.type,{...config,text,templateId,example:p.type==='names'&&!!source?.example}),true,false);closeSheet();}catch(e){toast(e.message);}
}
function showTemplates(){openSheet('Game presets',`<div class="template-list">${GAME_PRESETS.map(p=>`<button class="template-card" data-template="${p.id}"><b>${p.title}</b><small>${p.detail}</small>${icon('arrow')}</button>`).join('')}</div><button class="secondary" data-action="new">Create a picker</button>`);}
const artColors=['art-lilac','art-coral','art-sky','art-rose','art-lime'];
function personCard(name,index=0){index=[...name].reduce((n,c)=>n+c.codePointAt(0),0)%5;return `<span class="person-card" data-person="${esc(name)}" style="--person-color:var(--${artColors[index%5]})"><i aria-hidden="true">${esc([...name][0])}</i><span>${esc(name)}</span></span>`;}
function arrangementHTML(record){
 if(record.kind==='teams')return `<div class="team-results">${record.groups.map((group,i)=>`<section style="--team-color:var(--${artColors[i%5]})"><h3><span class="team-emblem" aria-hidden="true">${['✦','●','◆','✿','▲'][i%5]}</span>Team ${i+1}<small>${group.length}</small></h3><div class="team-members">${group.map(v=>personCard(v,record.values.indexOf(v))).join('')}</div></section>`).join('')}</div>`;
 return `<ol class="order-results">${record.values.map((v,i)=>`<li><span class="order-rank" aria-hidden="true">${i+1}</span>${personCard(v,i)}</li>`).join('')}</ol>`;
}
function arrangementIdle(s){
 const names=E.pool(s).slice(0,6);
 return `<div class="card-cloud ${s.drawMode==='teams'?'team-cloud':''}" aria-label="Ready to ${s.drawMode==='teams'?'make teams':'shuffle'}">${names.map((name,i)=>`<div class="cloud-card" style="--card-i:${i};--card-turn:${(i%3-1)*8}deg">${personCard(name,i)}</div>`).join('')}<span class="cloud-spark" aria-hidden="true">✦</span></div>`;
}
function wheelColorIndices(count){
 const indices=Array.from({length:count},(_,i)=>i%artColors.length);
 if(count>1&&indices.at(-1)===indices[0])indices[count-1]=1;
 return indices;
}
function wheelHTML(s){
 const pool=E.pool(s),colors=['var(--art-lilac)','var(--art-coral)','var(--art-sky)','var(--art-rose)','var(--art-lime)'];
 const palette=wheelColorIndices(pool.length);
 const segments=pool.map((_,i)=>`${colors[palette[i]]} ${i*360/pool.length}deg ${(i+1)*360/pool.length}deg`).join(',');
 return `<div class="wheel-wrap"><span class="wheel-pointer" aria-hidden="true"></span><div class="choice-wheel" aria-hidden="true" style="background:conic-gradient(${segments});transform:rotate(${s.wheelRotation||0}deg)">${pool.length<=16?pool.map((v,i)=>`<span class="wheel-label" style="--label-size:${pool.length<=6?19:pool.length<=10?15:12}px;transform:rotate(${(i+.5)*360/pool.length}deg) translateY(var(--label-radius)) rotate(90deg)">${esc(displayValue(s,v))}</span>`).join(''):''}<span class="wheel-hub">✦</span></div></div>`;
}
function wheelWinner(s,value){
 const pool=E.pool(s),index=Math.max(0,pool.indexOf(visibleResult(s)?.values[0])),color=artColors[wheelColorIndices(pool.length)[index]];
 return `<span class="wheel-winner ${value.length>32?'long-choice':''}" style="--winner-color:var(--${color})"><span>${esc(value)}</span></span>`;
}
function spinWheel(result,s,value){
 const wheel=document.querySelector('.choice-wheel');if(!wheel)return;
 const pool=E.pool(s),index=pool.indexOf(visibleResult(s).values[0]),from=s.wheelRotation||0;
 const to=from+(4+E.randomIndex(3))*360+((360-(index+.5)*360/pool.length-from%360+360)%360);
 s.wheelRotation=to;save();
 if(!canMove()){wheel.style.transform=`rotate(${to}deg)`;result.setAttribute('aria-label',value);return;}
 result.style.opacity='0';result.setAttribute('aria-busy','true');
 const spin=motion(wheel,[
  {transform:`rotate(${from}deg)`,easing:'ease-in-out'},
  {transform:`rotate(${from-motionRandom(12,20)}deg)`,offset:.12,easing:'cubic-bezier(.12,.7,.18,1)'},
  {transform:`rotate(${to+Math.min(7,90/pool.length)}deg)`,offset:.85,easing:'ease-in-out'},
  {transform:`rotate(${to-2}deg)`,offset:.93,easing:'ease-out'},
  {transform:`rotate(${to}deg)`}
 ],{duration:4100,easing:'linear',fill:'forwards'});
 const wrap=document.querySelector('.wheel-wrap');
 motion(wrap,[{transform:'translateY(0)'},{transform:'translateY(8px)',offset:.12},{transform:'translateY(-5px)',offset:.25},{transform:'translateY(0)',offset:.65},{transform:'translateY(3px)',offset:.85},{transform:'translateY(-2px)',offset:.93},{transform:'translateY(0)'}],{duration:4100,easing:'ease-in-out'});
 spin?.finished.then(()=>{if(!result.isConnected)return;wheel.style.transform=`rotate(${to}deg)`;spin.cancel();result.style.opacity='1';motion(result.querySelector('.wheel-winner'),[{transform:'translateY(9px) rotate(-3deg) scale(.88)',opacity:0},{transform:'translateY(-3px) rotate(1.5deg) scale(1.06)',opacity:1,offset:.58},{transform:'translateY(0) rotate(0) scale(1)'}],{duration:480});finishReveal(result,value,s);celebrate($('stage'),document.querySelector('.wheel-wrap'));},()=>{});
}
function showRoundBoard(){
 const s=current(),records=recent(s),drawn=s.repeat?records.flatMap(r=>r.values):s.used,pool=E.pool(s),seen=new Set(drawn),sum=drawn.reduce((a,v)=>a+(Number(v)||0),0);
 const full=records.at(-1);
 openSheet(s.title,full?.kind?arrangementHTML(full):`${s.repeat?'<p class="help">Last 2 days</p>':''}<div class="round-summary"><span><b>${drawn.length}</b> picked</span><span><b>${s.repeat?sum:pool.length-seen.size}</b> ${s.repeat?'total':'left'}</span>${s.templateId==='challenge150'?`<span><b>${sum}</b> total picked</span>`:''}</div>${pool.length<=150?`<div class="called-grid">${pool.map(v=>`<span class="${seen.has(v)?'called':''}" aria-label="${esc(v)}${seen.has(v)?', picked':''}">${seen.has(v)?'<i>✓</i>':''}${esc(displayValue(s,v))}</span>`).join('')}</div>`:`<p class="help">Latest ${Math.min(30,drawn.length)} picks</p><div class="called-grid">${drawn.slice(-30).reverse().map(v=>`<span class="called">${esc(displayValue(s,v))}</span>`).join('')}</div>`}${!drawn.length?'<p class="help">No picks yet.</p>':''}`);
}
function adSlot(){return state.previewAdFree?'':`<aside class="ad-preview" aria-label="Advertisement placement preview"><span>Ad placement preview</span><button data-action="support">Remove ads</button></aside>`;}
function showSupport(){
 openSheet('Support Keli',`${sceneArt('support','large')}<p class="support-copy">I’m building Keli on my own. If you enjoy using it, removing ads is a way to support my work. Thank you.</p><div class="support-benefit"><b>Remove ads</b><span>Pay once. All pickers are free either way.</span></div><button class="primary" data-action="preview-support">Preview ad-free Keli</button><button class="secondary" data-action="close">Not now</button><button class="quiet-button restore-preview" data-action="restore">Restore purchases</button><p class="help preview-note">Purchase preview only. No payment is taken.</p>`);
}
function showSettings(){
 const toggle=(key,label)=>`<button class="preference-row" data-setting="${key}" role="switch" aria-checked="${state[key]}"><span>${label}</span><span class="switch ${state[key]?'on':''}"></span></button>`;
 openSheet('Settings',`<h3 class="settings-label">${sceneArt('appearance','mini')}Appearance</h3>${paceControl()}${toggle('dark','Dark mode')}<h3 class="settings-label">${sceneArt('suggestions','mini')}Your inputs</h3><button class="preference-row" data-action="suggestions">Saved suggestions ${icon('arrow')}</button><h3 class="settings-label">${sceneArt('backup','mini')}Backups</h3><button class="preference-row" data-action="export">Export backup ${icon('arrow')}</button><button class="preference-row" data-action="import">Import backup ${icon('arrow')}</button><h3 class="settings-label">${sceneArt('support','mini')}Support</h3><button class="preference-row" data-action="support"><span>Support Keli<small>${state.previewAdFree?'Ad-free preview is on':'Remove ads with a one-time purchase'}</small></span>${icon('arrow')}</button>${state.previewAdFree?'<button class="preference-row" data-action="reset-support">End ad-free preview</button>':''}<button class="preference-row" data-action="restore">Restore purchases ${icon('arrow')}</button><h3 class="settings-label">${sceneArt('help','mini')}Help</h3><button class="preference-row" data-action="help">How Keli works ${icon('arrow')}</button><button class="preference-row" data-action="welcome">Show welcome screen ${icon('arrow')}</button>${feedbackLinks()}<h3 class="settings-label">${sceneArt('developer','mini')}More from this developer</h3>${[[6761266648,'Beeper','Gentle recurring chimes'],[6807178905,'PhoneAware','A little space from your phone'],[6826699210,'Progress Pebble','Make small efforts count']].map(([id,name,detail])=>`<a class="preference-row developer-link" href="https://apps.apple.com/us/app/id${id}" target="_blank" rel="noopener"><span><b>${name}</b><small>${detail}</small></span>${icon('arrow')}</a>`).join('')}<p class="preference-note">${reducedMotion.matches?'Reduce Motion is on. Results appear without animation.':'Your lists and picks stay in this browser. Keep a backup before clearing its data.'}</p>`);
}
function showHelp(){openSheet('Help',`<div class="help-copy"><h3>Pickers</h3><p>Choose numbers, names, a wheel, a full shuffle, or balanced teams. Library keeps your setups ready for next time.</p><h3>Rounds</h3><p>No repeats means each choice gets one turn. Clear display only hides the result. A new round puts everyone back in, and History keeps picks for 48 hours.</p><h3>Duplicate names</h3><p>Each name counts once. For two Sams, use “Sam A” and “Sam B”. Everyone is assigned once, with team sizes as even as possible.</p><h3>Keep count</h3><p>Add people, tap + or − to keep score, and turn on levels in Count options for power or health. Counts and levels stay saved until you change them. Levels don’t change anyone’s chances in a picker.</p><h3>Your data</h3><p>Lists and suggestions stay on this device. Picks are removed from History after 48 hours. Export a backup before clearing browser data.</p></div>`);}
let welcomeChoice='numbers';
function showWelcome(){
 closeSheet();const old=$('welcome-screen');old?.remove();
 const welcome=document.createElement('div');welcome.id='welcome-screen';welcome.className='welcome-screen';
 welcome.innerHTML=`${sceneArt('welcome','welcome')}<h1>Leave it<br>to luck.</h1><p>What shall we pick?</p><div class="welcome-choices">${[['numbers','#','Numbers'],['names','Aa','Names'],['wheel','◉','Wheel'],['teams','∷','Teams']].map(([id,symbol,title])=>`<button data-welcome="${id}" class="${id===welcomeChoice?'selected':''}" aria-pressed="${id===welcomeChoice}"><span>${symbol}</span>${title}</button>`).join('')}</div><button class="primary" id="start-lucky" data-action="start">Let’s play</button><button class="welcome-support" data-action="support">Support Keli</button>`;
 const phone=document.querySelector('.phone');phone.append(welcome);for(const child of phone.children)if(child!==welcome)child.inert=true;welcome.setAttribute('role','dialog');welcome.setAttribute('aria-modal','true');welcome.setAttribute('aria-label','Welcome to Keli');welcome.querySelector('[data-welcome]').focus();motion(welcome,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:350});
}
function startLucky(){
 const page=$('welcome-screen');for(const child of document.querySelector('.phone').children)child.inert=false;state.welcomed=true;
 if(welcomeChoice==='numbers'||welcomeChoice==='names'){state.active=state.sets.find(s=>s.type===welcomeChoice)?.id||state.active;state.page='pick';save();render('page');}
 else{const existing=state.sets.find(s=>s.drawMode===welcomeChoice);if(existing){state.active=existing.id;state.page='pick';save();render('page');}else createGame(welcomeChoice);}
 const a=motion(page,[{opacity:1,scale:'1'},{opacity:0,scale:'.97'}],{duration:230});if(a)a.finished.then(()=>page?.remove(),()=>page?.remove());else page?.remove();
}

function showHistoryRecord(setID,index){const set=state.sets.find(s=>s.id===setID),record=set?.history[index];if(!record)return;openSheet(set.title,record.kind?arrangementHTML(record):`<div class="history-detail">${record.values.map(v=>esc(displayValue(set,v))).join(' · ')}</div><p class="help">${new Date(record.time).toLocaleString()}</p>`);}

const PICKER_MODES=[
 {id:'wheel',title:'Wheel',detail:'Spin to choose'},
 {id:'numbers',title:'Numbers & dice',detail:'Roll a die or pick a number'},
 {id:'coin',title:'Heads or tails',detail:'One fair flip'},
 {id:'names',title:'Names',detail:'Pick from your list'},
 {id:'teams',title:'Teams',detail:'Make balanced groups'},
 {id:'order',title:'Shuffle',detail:'Give everyone a place'},
 {id:'counts',title:'Keep count',detail:'Scores and levels'},
 {id:'chess',title:'Chess pieces',detail:'Choose a piece'},
 {id:'set',title:'Number set',detail:'Pick from your own numbers'}
];
function pickerMode(s){return ['wheel','order','teams','coin','chess'].includes(s.drawMode)?s.drawMode:s.type;}
function pickerArtwork(id){
 if(['counts','coin','chess','numbers'].includes(id))return sceneArt(id);
 const drawing={numbers:'<b>7</b><i>✦</i>',names:'<b>A</b><b>B</b><i>✦</i>',wheel:'<b></b><i>▼</i>',order:'<b></b><b></b><b></b>',teams:'<b>●</b><b>●</b><b>●</b><b>●</b>',set:'<b>2</b><b>7</b>'};
 return `<span class="picker-art picker-art-${id}" aria-hidden="true">${drawing[id]}</span>`;
}
function showPickerChooser(){
 const active=state.page==='counts'?'counts':pickerMode(current());
 openSheet('Choose a tool',`<div class="picker-grid">${PICKER_MODES.map(m=>`<button class="picker-choice ${active===m.id?'selected':''}" data-picker="${m.id}" aria-pressed="${active===m.id}">${pickerArtwork(m.id)}<b>${m.title}</b><small>${m.detail}</small>${active===m.id?'<span class="choice-check" aria-hidden="true">✓</span>':''}</button>`).join('')}</div>`);
}
function selectPicker(mode){
 if(mode==='counts'){openCounts();return;}
 state.lastPickerByMode={...state.lastPickerByMode,[pickerMode(current())]:current().id};
 const remembered=state.sets.find(s=>s.id===state.lastPickerByMode[mode]&&pickerMode(s)===mode);
 const existing=remembered||state.sets.find(s=>pickerMode(s)===mode);
 if(existing){state.active=existing.id;state.page='pick';save();render('page');closeSheet();}
 else if(['wheel','order','teams','coin','chess'].includes(mode))createGame(mode);
 else{const base=make(uid(),mode==='numbers'?'Pick a number':mode==='names'?'Who goes first?':'Game numbers',mode,{text:mode==='set'?'2, 4, 7, 12, 20':AVENGERS});commitConfig(base,true);closeSheet();}
}
