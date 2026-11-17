/* Persistent personal counters, separate from expiring random draw history. */
function emptyCounts(){return {people:[],levels:false,label:'Power',max:100};}
function validateCounts(value){
 if(value===undefined)return emptyCounts();
 if(!value||!Array.isArray(value.people)||value.people.length>50||typeof value.levels!=='boolean'||typeof value.label!=='string'||!value.label.trim()||value.label.length>24||!Number.isInteger(value.max)||value.max<1||value.max>100000)throw Error('Invalid saved counters.');
 const ids=new Set(),names=new Set();
 for(const p of value.people){
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60||names.has(p.name.trim().toLowerCase())||!Number.isInteger(p.count)||Math.abs(p.count)>999999||!Number.isInteger(p.level)||p.level<0||p.level>value.max)throw Error('Invalid saved person.');
  ids.add(p.id);names.add(p.name.trim().toLowerCase());
 }
 return value;
}
function addCountPeople(text){
 const names=[...new Set(text.split(/[\n,]/).map(s=>s.trim()).filter(Boolean))];
 if(!names.length)throw Error('Add a name first.');
 if(names.some(n=>n.length>60))throw Error('Keep each name under 61 characters.');
 const existing=new Set(state.counters.people.map(p=>p.name.toLowerCase()));
 const added=[];for(const name of names){if(existing.has(name.toLowerCase()))continue;existing.add(name.toLowerCase());added.push({id:uid(),name,count:0,level:0});}
 if(state.counters.people.length+added.length>50)throw Error('There’s room for 50 people.');
 state.counters.people.push(...added);save();return added.length;
}
function changeCount(id,delta){
 const p=state.counters.people.find(p=>p.id===id);if(!p||![-1,1].includes(delta))return;
 p.count=Math.max(-999999,Math.min(999999,p.count+delta));save();return p.count;
}
function openCounts(){state.page='counts';save();render('page');closeSheet();}
function countsHTML(){
 const board=state.counters;
 return `<div class="picker-heading"><h1><button class="current-picker" data-action="mode" aria-label="Change tool">Keep count${icon('down')}</button></h1><button class="quiet-button" data-action="count-options" aria-label="Count options">${icon('more')}</button></div>${board.people.length?`<div class="count-caption">${sceneArt('counts')}<span>Every point counts.</span><button class="icon-button" data-action="count-add" aria-label="Add people">${icon('plus')}</button></div><div class="count-list">${board.people.map((p,i)=>`<section class="count-card" data-person="${esc(p.id)}"><button class="count-name" data-count-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}"><span class="count-flag flag-${i%5}" aria-hidden="true">${esc([...p.name][0].toUpperCase())}</span><b>${esc(p.name)}</b>${icon('edit')}</button><div class="count-stepper"><button data-count-step="-1" data-person-id="${esc(p.id)}" aria-label="Subtract one from ${esc(p.name)}" ${p.count===-999999?'disabled':''}>−</button><output aria-label="${esc(p.name)} count" aria-live="polite" aria-atomic="true">${p.count}</output><button data-count-step="1" data-person-id="${esc(p.id)}" aria-label="Add one to ${esc(p.name)}" ${p.count===999999?'disabled':''}>+</button></div>${board.levels?`<label class="count-level"><span>${esc(board.label)}<output>${p.level}</output></span><input type="range" min="0" max="${board.max}" step="1" value="${p.level}" data-count-level="${esc(p.id)}" aria-label="${esc(p.name+' '+board.label)}"></label>`:''}</section>`).join('')}</div>`:`<div class="empty count-empty">${sceneArt('counts','large')}<h2>Who’s playing?</h2><p>Keep scores, wins, or whatever counts.</p><button class="primary" data-action="count-add">Add people</button></div>`}`;
}
function showCountAdd(){
 const lists=state.sets.filter(s=>s.type==='names'&&!s.example);
 openSheet('Add people',`<form id="count-add-form"><label class="field">Names<textarea name="names" rows="4" maxlength="4000" required placeholder="One name per line"></textarea></label>${lists.length?`<div class="fill-options"><span class="fill-label">Use a list</span><div class="fill-chips">${lists.slice(0,8).map(s=>`<button type="button" class="fill-chip" data-count-list="${esc(s.id)}">${esc(s.title)}</button>`).join('')}</div></div>`:''}<p class="help">Counts start at 0. People already here keep their scores.</p><p class="error" id="count-error" role="alert"></p><button class="primary">Add people</button></form>`,'counts');
 $('count-add-form').onsubmit=e=>{e.preventDefault();try{const n=addCountPeople(e.target.elements.names.value);openCounts();toast(n?`${n} ${n===1?'person':'people'} added`:'Everyone is already here.');}catch(error){$('count-error').textContent=error.message;}};
}
function showCountOptions(){
 const c=state.counters;
 openSheet('Count options',`<form id="count-options-form"><label class="preference-row">Show a level for each person<input type="checkbox" name="levels" ${c.levels?'checked':''}></label><div id="level-fields" ${c.levels?'':'hidden'}><label class="field">Call it<input name="label" value="${esc(c.label)}" maxlength="24" required></label><div class="fill-chips">${['Power','Level','Health'].map(label=>`<button type="button" class="fill-chip" data-level-label="${label}">${label}</button>`).join('')}</div><label class="field">Maximum<input type="number" name="max" min="1" max="100000" step="1" value="${c.max}" required inputmode="numeric"></label><p class="help">Levels stay saved when you reset counts.</p></div><p class="error" id="count-error" role="alert"></p><button class="primary">Save</button></form>${c.people.length?'<button class="quiet-button count-reset" data-action="count-reset">Reset counts</button>':''}`,'counts');
 const f=$('count-options-form');const update=()=>{$('level-fields').hidden=!f.elements.levels.checked;f.elements.label.disabled=f.elements.max.disabled=!f.elements.levels.checked;};f.elements.levels.onchange=update;update();
 f.onsubmit=e=>{e.preventDefault();try{const levels=f.elements.levels.checked,label=levels?f.elements.label.value.trim():c.label,max=levels?Number(f.elements.max.value):c.max;if(c.people.some(p=>p.level>max))throw Error('Choose a maximum at least as high as the saved levels.');const next={...c,levels,label,max};validateCounts(next);state.counters=next;save();render();closeSheet();}catch(error){$('count-error').textContent=error.message;}};
}
function editCountPerson(id){
 const c=state.counters,p=c.people.find(p=>p.id===id);if(!p)return;
 openSheet('Edit person',`<form id="count-person-form"><label class="field">Name<input name="name" value="${esc(p.name)}" maxlength="60" required></label><label class="field">Count<input name="count" type="number" min="-999999" max="999999" step="1" value="${p.count}" required></label>${c.levels?`<label class="field">${esc(c.label)}<input name="level" type="number" min="0" max="${c.max}" step="1" value="${p.level}" required inputmode="numeric"></label>`:''}<p class="error" id="count-error" role="alert"></p><button class="primary">Save</button></form><button class="quiet-button count-reset" id="remove-person">Remove person</button>`,'counts');
 $('count-person-form').onsubmit=e=>{e.preventDefault();try{const f=e.target.elements,next={...p,name:f.name.value.trim(),count:Number(f.count.value),level:c.levels?Number(f.level.value):p.level};const people=c.people.map(x=>x.id===id?next:x);validateCounts({...c,people});c.people=people;save();render();closeSheet();}catch(error){$('count-error').textContent=error.message;}};
 $('remove-person').onclick=()=>confirm('Remove person?',`Remove ${esc(p.name)} and their saved count and level?`,'Remove',()=>{c.people=c.people.filter(x=>x.id!==id);save();render();});
}
function handleCountClick(b){
 if(b.dataset.countStep){const value=changeCount(b.dataset.personId,Number(b.dataset.countStep)),card=b.closest('.count-card'),out=card.querySelector('.count-stepper output');out.textContent=value;card.querySelectorAll('[data-count-step]').forEach(el=>el.disabled=Number(el.dataset.countStep)===1?value===999999:value===-999999);out.getAnimations?.().forEach(a=>a.cancel());motion(out,[{transform:'translateY(0) scale(1)'},{transform:`translateY(${Number(b.dataset.countStep)>0?-4:4}px) scale(1.12)`,offset:.35},{transform:'translateY(0) scale(1)'}],{duration:280});return true;}
 if(b.dataset.countEdit){editCountPerson(b.dataset.countEdit);return true;}
 if(b.dataset.countList){const s=state.sets.find(s=>s.id===b.dataset.countList);if(s)$('count-add-form').elements.names.value=E.pool(s).join('\n');return true;}
 if(b.dataset.levelLabel){$('count-options-form').elements.label.value=b.dataset.levelLabel;return true;}
 return false;
}
document.addEventListener('input',e=>{const id=e.target.dataset?.countLevel;if(!id)return;const p=state.counters.people.find(p=>p.id===id),n=Number(e.target.value);if(!p||!Number.isInteger(n)||n<0||n>state.counters.max)return;p.level=n;e.target.closest('label').querySelector('output').textContent=n;save();});

function countLibraryCard(){return `<button class="set-card" data-action="keep-count"><span class="tile illustrated-tile">${sceneArt('counts','mini')}</span><span><b>Keep count</b><small>${state.counters.people.length?`${state.counters.people.length} people · counts saved`:'Scores and levels'}</small></span>${icon('arrow','chevron')}</button>`;}
