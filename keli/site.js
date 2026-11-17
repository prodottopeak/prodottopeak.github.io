const preview=document.querySelector('#tool-preview'),buttons=[...document.querySelectorAll('[data-mode]')],description=document.querySelector('#demo-description');
const descriptions={numbers:'Pick from 1–100 and watch the number emerge.',dice:'A rolling die, with its result on the face.',names:'A name from the sample list, revealed in flying flags.',coin:'A winking face or a curled tail. One fair flip.',wheel:'Six dinner choices. Give the wheel a spin.',teams:'Six people, mixed into two balanced teams.',shuffle:'The whole list, in a fresh random order.'};
let selected='numbers';
const previewOrigin=location.protocol==='file:'?'*':location.origin;
function sendSelection(){preview.contentWindow.postMessage({type:'keli-preview',mode:selected},previewOrigin)}
buttons.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.mode;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));description.textContent=descriptions[selected];sendSelection()}));
preview.addEventListener('load',sendSelection);
const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.contentWindow.postMessage({type:'keli-visibility',visible:e.isIntersecting},previewOrigin)),{threshold:.05});document.querySelectorAll('.native-preview iframe').forEach(frame=>observer.observe(frame));
