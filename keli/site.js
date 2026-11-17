const preview=document.querySelector('#tool-preview'),buttons=[...document.querySelectorAll('[data-mode]')],description=document.querySelector('#demo-description');
const descriptions={numbers:'Pick from 1–100 and watch the number emerge.',dice:'A rolling die, with its result on the face.',names:'A name from the sample list, revealed in flying flags.',coin:'A winking face or a curled tail. One fair flip.',wheel:'Six dinner choices. Give the wheel a spin.',teams:'Six people, mixed into two balanced teams.',shuffle:'The whole list, in a fresh random order.',chess:'Choose White or Black. White makes the first move.','number-set':'Pick from the sample set: 2, 4, 7, 12 and 20.'};
let selected='numbers';
const previewOrigin=location.protocol==='file:'?'*':location.origin;
function sendSelection(){preview.contentWindow.postMessage({type:'keli-preview',mode:selected},previewOrigin)}
function selectMode(mode){if(!Object.hasOwn(descriptions,mode))return;selected=mode;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));description.textContent=descriptions[mode];sendSelection()}
buttons.forEach(button=>button.addEventListener('click',()=>selectMode(button.dataset.mode)));
function openPreview(hash,focus=false){
 const counts=hash==='#score-preview',mode=hash.replace('#preview-','');
 if(!counts&&!Object.hasOwn(descriptions,mode))return;
 if(!counts)selectMode(mode);
 const frame=counts?document.querySelector('#score-preview iframe'):preview;
 frame.parentElement.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 if(focus)frame.focus({preventScroll:true});
}
document.querySelectorAll('[data-preview]').forEach(link=>link.addEventListener('click',event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();if(location.hash!==link.hash)history.pushState(null,'',link.hash);openPreview(link.hash,true);
}));
window.addEventListener('hashchange',()=>openPreview(location.hash));
window.addEventListener('popstate',()=>openPreview(location.hash));
if(location.hash)openPreview(location.hash);
preview.addEventListener('load',sendSelection);
const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.contentWindow.postMessage({type:'keli-visibility',visible:e.isIntersecting},previewOrigin)),{threshold:.05});document.querySelectorAll('.native-preview iframe').forEach(frame=>observer.observe(frame));
