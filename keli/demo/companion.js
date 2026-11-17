const AVENGERS='Iron Man\nCaptain America\nThor\nHulk\nBlack Widow\nHawkeye';
/* Shared, local-only illustrations, saved fills and number presentation. */
function sceneArt(kind='edit',size='small'){
 const rect=(x,y,w,h,fill,turn=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--art-${fill})" transform="rotate(${turn} ${x+w/2} ${y+h/2})"/>`;
 const spark=(x,y,r=9)=>`<path d="M${x} ${y-r}Q${x+2} ${y-2} ${x+r} ${y}Q${x+2} ${y+2} ${x} ${y+r}Q${x-2} ${y+2} ${x-r} ${y}Q${x-2} ${y-2} ${x} ${y-r}" fill="var(--art-lime)"/>`;
 const ink='#30213f',line=(d)=>`<path d="${d}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
 const ticket=(x,y,color,text,angle)=>`<g transform="rotate(${angle} ${x+19} ${y+22})">${rect(x,y,38,44,color)}<text x="${x+19}" y="${y+29}" text-anchor="middle" fill="${ink}" font-size="25" font-weight="750" font-family="system-ui">${text}</text></g>`;
 const die=`<g transform="rotate(-12 57 44)">${rect(28,15,57,57,'lilac')}${[[43,30],[70,30],[43,57],[70,57]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="${ink}"/>`).join('')}</g>`;
 const shapes={
 appearance:`<circle cx="41" cy="43" r="21" fill="var(--art-coral)"/>`+line('M41 10v6M41 70v6M8 43h6M68 43h6M17 19l5 5M60 63l5 5M17 68l5-5M60 24l5-5')+`<path d="M85 15a31 31 0 1 0 15 52A31 31 0 0 1 85 15Z" fill="var(--art-lilac)"/>`,
 developer:rect(23,28,69,47,'sky',-7)+line('M38 44l-8 8 8 8M77 44l8 8-8 8M61 41l-9 22')+spark(89,15,10),
 counts:rect(15,20,40,53,'lilac',-9)+rect(61,14,40,53,'coral',8)+line('M26 46h17M34 38v16M72 40h17')+spark(91,77,7),
 numbers:`<g transform="translate(0 -3) scale(1.42)">${ticket(8,10,'lilac','7',-10)}</g><g transform="translate(33 16) scale(.9)">${die.replaceAll('--art-lilac','--art-coral')}</g>`,
 coin:`<ellipse cx="59" cy="48" rx="32" ry="33" fill="var(--art-coral)"/><circle cx="55" cy="42" r="32" fill="var(--art-lime)"/><circle cx="55" cy="42" r="25" stroke="${ink}" stroke-width="2"/>`+spark(55,42,14),
 chess:rect(18,55,78,23,'sky')+`<path d="M38 67h39l-6-11-7-24H49l-6 24Z" fill="var(--art-lilac)"/><circle cx="56" cy="22" r="12" fill="var(--art-lilac)"/>`,
 names:`<path d="M13 22Q57 32 101 21" fill="none" stroke="var(--muted)" stroke-width="2"/>`+`<g transform="rotate(-8 38 45)"><path d="M22 23h31v43L38 57 22 66Z" fill="var(--art-lilac)"/><text x="38" y="49" fill="${ink}" font-size="23" font-weight="750" text-anchor="middle">A</text></g><g transform="rotate(7 77 45)"><path d="M61 26h31v43L77 60 61 69Z" fill="var(--art-coral)"/><text x="77" y="52" fill="${ink}" font-size="23" font-weight="750" text-anchor="middle">B</text></g>`,
 wheel:`<circle cx="56" cy="46" r="32" fill="var(--art-lilac)"/><path d="M56 46V14A32 32 0 0 1 88 46Z" fill="var(--art-coral)"/><path d="M56 46h32A32 32 0 0 1 56 78Z" fill="var(--art-sky)"/><path d="M56 46v32A32 32 0 0 1 24 46Z" fill="var(--art-lime)"/><circle cx="56" cy="46" r="8" fill="${ink}"/><path d="M48 7h16l-8 15Z" fill="var(--ink)"/>`,
 order:rect(20,17,55,35,'coral',-13)+rect(30,28,55,35,'sky',4)+rect(39,40,55,35,'lilac',14)+line('M53 55h20'),
 teams:rect(17,13,33,29,'lilac',-6)+rect(17,47,33,29,'lilac',3)+rect(63,15,33,29,'coral',6)+rect(63,49,33,29,'coral',-3)+[ [33,27],[33,61],[80,29],[80,63] ].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${ink}"/>`).join(''),
 set:ticket(13,18,'lime','0',-10)+ticket(59,32,'rose','1',12),
 library:rect(19,12,52,52,'lilac',-8)+rect(42,22,52,52,'sky',8)+`<path d="M12 37h34l9 9h45l-5 34H18Z" fill="var(--art-coral)"/>`+line('M36 60h35'),
 history:rect(20,13,53,61,'rose',-8)+line('M34 31h23M34 43h17')+`<circle cx="78" cy="58" r="24" fill="var(--art-lilac)"/>`+line('M78 44v14l9 6'),
 settings:rect(19,12,75,65,'lilac',-5)+line('M33 31h48M33 55h48')+`<circle cx="48" cy="31" r="9" fill="var(--art-coral)"/><circle cx="70" cy="55" r="9" fill="var(--art-lime)"/>`,
 support:rect(23,22,68,53,'lilac',-9)+`<path d="M56 65C46 57 28 45 36 32c6-9 16-7 20 1 5-8 16-10 22-1 8 13-12 26-22 33Z" fill="var(--art-coral)"/>`+spark(92,17,8),
 help:rect(22,18,71,52,'sky',-6)+`<path d="m38 65 3 16 17-16Z" fill="var(--art-sky)"/><text x="58" y="56" font-size="37" font-weight="750" text-anchor="middle" fill="${ink}">?</text>`+spark(95,16,7),
 backup:rect(20,27,69,50,'lilac',-5)+rect(35,11,47,44,'sky',8)+line('M58 22v34m-11-11 11 11 11-11')+spark(98,39,7),
 edit:rect(23,14,57,61,'rose',-7)+line('M36 32h26M36 45h15')+`<g transform="rotate(32 78 49)">${rect(72,17,13,55,'lilac')}<path d="m72 72 6 10 7-10Z" fill="var(--art-coral)"/></g>`,
 round:die+`<path d="M86 16Q110 48 87 71m-1-13 1 13 13-1" fill="none" stroke="var(--art-coral)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
 games:die+ticket(72,42,'coral','2',12),
 welcome:die+ticket(72,43,'coral','A',13)+spark(94,13),
 suggestions:rect(17,29,43,35,'sky',-9)+rect(57,22,43,35,'lilac',10)+line('M29 44h17M69 37h17')+spark(60,70,11)
 };
 return `<span class="scene-art scene-art-${size}" data-illustration="${kind}" aria-hidden="true"><svg viewBox="0 0 116 90" fill="none"><g class="art-object">${shapes[kind]||shapes.edit}</g></svg></span>`;
}
function sheetArtKind(title){
 if(/Edit wheel/.test(title))return 'wheel';if(/Edit teams/.test(title))return 'teams';if(/Edit shuffle/.test(title))return 'order';if(/Edit names/.test(title))return 'names';if(/count|person|people/i.test(title))return 'counts';if(/Settings/.test(title))return 'settings';if(/Support|purchase/i.test(title))return 'support';if(/Help/.test(title))return 'help';
 if(/backup|Import|Replace collection/i.test(title))return 'backup';if(/suggestion/i.test(title))return 'suggestions';if(/Game presets|Saving/.test(title))return 'games';if(/round|repeat/i.test(title))return 'round';if(/numbers|digit|range/i.test(title))return 'numbers';if(/Choose a tool/.test(title))return 'welcome';if(/Copy result/.test(title))return 'history';return 'edit';
}
function validateNumberBase(s){
 if(s.type==='names'||s.numberMode==='digits')return;
 const base=s.displayBase??10;if(!Number.isInteger(base)||base<1||base>10)throw Error('Choose a number system from 1 to 10.');
 if(base===1){const values=s.type==='numbers'?[s.min,s.max]:E.entries(s.text).map(Number);if(values.some(n=>n<0||n>50))throw Error('Tally marks work with numbers from 0 to 50.');}
}
function baseFields(s){return `<details class="number-system" ${s.displayBase&&s.displayBase!==10?'open':''}><summary>Number system</summary><label class="field">Display as<select name="displayBase">${[[10,'Decimal · base 10'],[2,'Binary · base 2'],[8,'Octal · base 8'],[3,'Base 3'],[4,'Base 4'],[5,'Base 5'],[6,'Base 6'],[7,'Base 7'],[9,'Base 9'],[1,'Tally marks · base 1']].map(([n,label])=>`<option value="${n}" ${(s.displayBase||10)===n?'selected':''}>${label}</option>`).join('')}</select></label><p class="help" id="base-help">Enter the range in decimal. Only the result’s display changes. Tally marks support 0–50.</p></details>`;}
function setupFill(s){
 const fill={title:s.title,type:s.type,numberMode:s.numberMode||'range',min:s.min,max:s.max,text:s.text||'',digits:s.digits||'123',length:s.length||5,allowLeadingZero:!!s.allowLeadingZero,displayBase:s.displayBase||10,exclude:s.exclude||'',count:s.count,repeat:s.repeat,drawMode:s.drawMode||'pick',teamCount:s.teamCount||2};
 return fill;
}
function validateFills(values){
 if(values===undefined)return [];
 if(!Array.isArray(values)||values.length>20)throw Error('Invalid saved suggestions.');
 return values.map(f=>{if(!f||!['numbers','names','set'].includes(f.type)||typeof f.title!=='string'||!f.title.trim()||f.title.length>60||typeof f.text!=='string'||f.text.length>12000||typeof f.exclude!=='string'||f.exclude.length>12000||typeof f.repeat!=='boolean'||!Number.isInteger(f.count)||f.count<1||f.count>10)throw Error('Invalid saved suggestion.');const clean=setupFill(f);E.pool(clean);validateNumberBase(clean);return clean;});
}
function rememberFill(s){
 if(state.rememberSuggestions===false||s.text?.length>12000||s.exclude?.length>12000)return;
 const fill=setupFill(s),key=JSON.stringify(fill);state.suggestions=[fill,...(state.suggestions||[]).filter(f=>JSON.stringify(f)!==key)].slice(0,20);
}
function fillOptions(kind){
 const saved=state.rememberSuggestions===false?[]:state.suggestions||[],sets=(state.sets||[]).filter(s=>!s.example),seen=new Set(),options=[];
 const add=(label,values,source)=>{const key=JSON.stringify(values);if(seen.has(key))return;seen.add(key);options.push({label,values,source});};
 if(kind==='range'){
  for(const s of saved.filter(s=>s.type==='numbers'&&s.numberMode!=='digits').slice(0,4))add(`${s.min}–${s.max}`,{min:s.min,max:s.max},'Recent');
  for(const [a,b,label] of [[0,1,'0 or 1'],[1,6,'Die · 1–6'],[1,20,'1–20'],[1,100,'1–100'],[0,10,'0–10']])add(label,{min:a,max:b},'Quick fill');
 }else if(kind==='digits'){
  for(const s of saved.filter(s=>s.type==='numbers'&&s.numberMode==='digits').slice(0,3))add(`${s.length} digits · ${s.digits}`,{digits:s.digits,length:s.length,allowLeadingZero:s.allowLeadingZero},'Recent');
  add('4-digit code',{digits:'0123456789',length:4,allowLeadingZero:true},'Quick fill');add('5 binary digits',{digits:'01',length:5,allowLeadingZero:true},'Quick fill');
 }else if(kind==='names'||kind==='set'){
  for(const s of [...saved,...sets].filter(s=>s.type===kind&&s.text?.trim()))add(s.title,{text:s.text},'Your lists');
  if(kind==='names'){add('Yes or no',{text:'Yes\nNo'},'Quick fill');add('4 players',{text:'Player 1\nPlayer 2\nPlayer 3\nPlayer 4'},'Quick fill');}
  else{add('0 or 1',{text:'0, 1'},'Quick fill');add('Even numbers',{text:'2, 4, 6, 8, 10'},'Quick fill');add('Odd numbers',{text:'1, 3, 5, 7, 9'},'Quick fill');}
 }
 return options.slice(0,8);
}
function fillRow(kind){
 const options=fillOptions(kind);return `<div class="fill-options" data-fill-row="${kind}"><span class="fill-label">${kind==='range'||kind==='digits'?'Quick fill':'Use a list'}</span><div class="fill-chips">${options.map((o,i)=>`<button type="button" class="fill-chip" data-fill="${kind}" data-fill-index="${i}" aria-label="${esc(o.source+': '+o.label)}">${esc(o.label)}</button>`).join('')}</div></div>`;
}
function attachFillTools(form){
 const update=()=>{
  const type=form.elements.type?.value||'numbers',text=form.elements.text?.value||'';
  const holder=form.querySelector('#entry-suggestions');if(holder)holder.innerHTML=type==='numbers'?'':fillRow(type);
  let available=[];try{available=E.pool({type,numberMode:form.elements.numberMode?.value||'range',min:Number(form.elements.min?.value),max:Number(form.elements.max?.value),digits:form.elements.digits?.value||'123',length:Number(form.elements.namedItem('length')?.value||5),allowLeadingZero:!!form.elements.allowLeadingZero?.checked,text,exclude:form.elements.exclude?.value||''});}catch{}
  const counts=form.querySelector('#count-suggestions');if(counts){const whole=type==='names'&&['teams','order','wheel'].includes(form.elements.drawMode?.value);counts.hidden=whole;counts.innerHTML=whole?'':`<div class="fill-chips">${[1,2,3,5,10].filter(n=>form.elements.repeat?.checked||n<=available.length).map(n=>`<button type="button" class="fill-chip" data-count-fill="${n}">${n} ${n===1?'pick':'picks'}</button>`).join('')}</div>`;}
  const exclusions=form.querySelector('#exclude-suggestions');if(exclusions)exclusions.innerHTML=type==='names'?`<div class="fill-chips">${available.slice(0,6).map(name=>`<button type="button" class="fill-chip" data-exclude-choice="${esc(name)}" aria-label="Leave out ${esc(name)}">${esc(name)}</button>`).join('')}</div>`:'';
  const teams=form.querySelector('#team-suggestions');
  if(teams){let n=0;try{n=E.pool({type:'names',text,exclude:form.elements.exclude?.value||''}).length;}catch{}
   teams.innerHTML=form.elements.drawMode?.value==='teams'?`<div class="fill-chips">${[...new Set([2,3,4,Math.ceil(n/4)])].filter(k=>k>=2&&k<=Math.min(n,100)).map(k=>`<button type="button" class="fill-chip" data-team-fill="${k}">${k} teams · ${Math.floor(n/k)===Math.ceil(n/k)?Math.floor(n/k):`${Math.floor(n/k)}–${Math.ceil(n/k)}`} each</button>`).join('')}</div>`:'';
  }
 };
 form.addEventListener('change',update);form.addEventListener('input',update);update();
}
function applyFill(button){
 const form=button.closest('form');if(!form)return;
 const kind=button.dataset.fill,option=fillOptions(kind)[Number(button.dataset.fillIndex)];if(!option)return;
 const changed=[];
 for(const [name,value] of Object.entries(option.values)){const field=form.elements.namedItem(name);if(!field)continue;if(field.type==='checkbox')field.checked=value;else field.value=value;changed.push(field);}
 // Suggestions only change the draft. Save is still the single commit point.
 form.dispatchEvent(new Event('input',{bubbles:true}));form.dispatchEvent(new Event('change',{bubbles:true}));
 changed.forEach(field=>motion(field,[{backgroundColor:'var(--soft)'},{backgroundColor:'var(--paper)'}],{duration:450}));
 const status=form.querySelector('.fill-status');if(status)status.textContent=`Filled ${option.label}.`;
}
function titleSuggestions(){
 const names=[...new Set([...(state.rememberSuggestions===false?[]:state.suggestions||[]).map(s=>s.title),'Game night','Who goes first?','Raffle tickets','Weekend plans'])];
 return `<datalist id="picker-title-suggestions">${names.slice(0,12).map(title=>`<option value="${esc(title)}"></option>`).join('')}</datalist>`;
}
function showSavedSuggestions(){
 openSheet('Saved suggestions',`<p class="help">Lucky remembers setups when you save them. Suggestions stay on this device and are included in your backup.</p><button class="preference-row" data-setting="rememberSuggestions" role="switch" aria-checked="${state.rememberSuggestions!==false}"><span>Remember my inputs</span><span class="switch ${state.rememberSuggestions!==false?'on':''}"></span></button>${(state.suggestions||[]).length?`<div class="saved-fill-list">${state.suggestions.map((s,i)=>`<div class="saved-fill-row"><span><b>${esc(s.title)}</b><small>${esc(s.type==='numbers'?s.numberMode==='digits'?`${s.length} digits · ${s.digits}`:`${s.min}–${s.max}`:`${E.entries(s.text).length} choices${s.drawMode==='teams'?` · ${s.teamCount} teams`:''}`)}</small></span><button class="icon-button" data-forget-fill="${i}" aria-label="Forget ${esc(s.title)}">${icon('close')}</button></div>`).join('')}</div><button class="secondary" data-action="clear-suggestions">Clear saved suggestions</button>`:`<div class="empty suggestion-empty">${sceneArt('suggestions','large')}<p>No saved suggestions yet.</p></div>`}`,'suggestions');
}

/* Edit the choices first; less frequent setup changes stay together. */
function arrangePickerEditor(form,isNew){
 const number=form.querySelector('#number-fields'),entries=form.querySelector('#entry-fields'),mode=form.querySelector('#name-mode-fields');
 const title=form.elements.title.closest('label'),type=form.elements.type.closest('label');
 const about=document.createElement('details');about.className='editor-section editor-about';about.open=isNew;
 about.innerHTML='<summary><span>About this picker<small class="editor-about-value"></small></span></summary><div class="editor-section-body"></div>';
 const aboutBody=about.querySelector('div');aboutBody.append(title,type,mode);
 const team=mode.querySelector('#team-count-field'),teamSuggestions=mode.querySelector('#team-suggestions');
 const core=document.createElement('div');core.className='editor-choices';core.append(number,entries,team,teamSuggestions);
 const fills=entries.querySelector('#entry-suggestions');entries.append(fills);
 const choiceLabel=entries.querySelector('label');choiceLabel.childNodes[0].textContent='Names or choices';choiceLabel.querySelector('textarea').rows=4;
 const duplicateHelp=entries.querySelector('p');duplicateHelp.className='help editor-duplicate-help';
 const rules=form.querySelector('details');rules.className='editor-section editor-rules';rules.querySelector('summary').innerHTML='<span>Rules<small class="editor-rule-value"></small></span>';
 const rulesBody=document.createElement('div');rulesBody.className='editor-section-body';while(rules.children.length>1)rulesBody.append(rules.children[1]);rules.append(rulesBody);
 const footer=document.createElement('div');footer.className='editor-footer';footer.append(form.querySelector('.fill-status'),form.querySelector('#form-error'),form.querySelector('button[type="submit"]'));
 // Keep all existing fields and their event handlers. Only change their grouping.
 form.prepend(core);form.append(rules,about,footer);form.classList.add('picker-editor');
 const note=[...form.children].find(el=>el.matches?.('p.help'));if(note){note.textContent='Changing choices or repeats starts a new round.';rulesBody.append(note);}
 const update=()=>{
  const t=form.elements.type.value,m=t==='names'?form.elements.drawMode.value:'pick',whole=['teams','order'].includes(m);
  choiceLabel.childNodes[0].textContent=t==='set'?'Your numbers':m==='teams'?'Who’s playing?':'Names or choices';
  const raw=form.elements.text.value.split(/[\n,]/).map(v=>v.trim()).filter(Boolean),duplicates=raw.length-new Set(raw).size;
  duplicateHelp.hidden=!duplicates;duplicateHelp.textContent=duplicates?'Duplicate names count once. Use different labels for different people.':'';
  const omitted=form.elements.exclude.value.split(/[\n,]/).filter(v=>v.trim()).length;
  rules.querySelector('small').textContent=[whole?'Everyone gets a place':form.elements.repeat.checked?'Repeats allowed':'No repeats',whole||m==='wheel'?'':`${form.elements.count.value||1} per pick`,omitted?`${omitted} left out`:''].filter(Boolean).join(' · ');
  about.querySelector('small').textContent=form.elements.title.value.trim()||'Give it a name';
 };
 form.addEventListener('input',update);form.addEventListener('change',update);update();
 form.addEventListener('invalid',e=>{let node=e.target.parentElement;while(node&&node!==form){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}},true);
 for(const section of [rules,about])section.addEventListener('toggle',()=>{if(section.open)motion(section.querySelector('.editor-section-body'),[{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220});});
}
function editorTitle(s,isNew){if(isNew)return 'New picker';return 'Edit '+({wheel:'wheel',teams:'teams',order:'shuffle',numbers:'numbers',names:'names',set:'number set'}[pickerMode(s)]||'picker');}
