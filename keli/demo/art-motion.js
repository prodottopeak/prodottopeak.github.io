/* One rhythm, different physical objects: gather, hold, mix, release, settle. */
const motionRandom=(min,max)=>min+(max-min)*E.randomIndex(1000000)/1000000;
function captureStageActors(stage){
 if(!stage?.getBoundingClientRect)return [];
 const bounds=stage.getBoundingClientRect();
 return [...stage.querySelectorAll('.name-tile,.letter-flag,.person-card')].filter(el=>getComputedStyle(el).visibility!=='hidden').map(el=>{
  const r=el.getBoundingClientRect(),style=getComputedStyle(el),m=new DOMMatrix(style.transform==='none'?undefined:style.transform);
  const flying=el.classList.contains('letter-flag'),angle=Math.atan2(m.b,m.a)*180/Math.PI;
  return {x:flying?el.offsetLeft+m.e:r.left-bounds.left,y:flying?el.offsetTop+m.f:r.top-bounds.top,w:30,h:38,text:el.dataset.person||el.textContent,angle,color:el.dataset.color||[...el.classList].find(c=>/^flag-/.test(c))||'flag-0'};
 });
}
function nameFlight(result,s,value,carry=[]){
 const stage=$('stage'),width=stage.clientWidth,height=stage.clientHeight,cx=width/2-15,cy=height/2-19;
 if(visibleResult(s).values.length>1||value.length>40||Math.ceil(value.length/Math.floor((width-16)/36))*48>height-40){result.innerHTML=readableNames(visibleResult(s).values);motion(result,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:450});finishReveal(result,value,s);return;}
 stage.querySelector('.flag-bed')?.remove();stage.insertAdjacentHTML('beforeend',flagBed());
 const bed=stage.querySelector('.flag-bed'),freshLetters=[...bed.children].map(el=>el.textContent);bed.innerHTML='';
 result.classList.add('revealing');result.setAttribute('aria-busy','true');result.innerHTML=nameTiles(value,true);
 const rect=stage.getBoundingClientRect(),slots=[...result.querySelectorAll('.name-tile')];
 const cast=carry.length?carry:Array.from({length:30},(_,i)=>({x:12+motionRandom(0,width-54),y:12+motionRandom(0,height-60),text:freshLetters[i%freshLetters.length],color:'flag-'+i%5,angle:motionRandom(-18,18)}));
 const particles=cast.map((p,i)=>({...p,id:i,vx:0,vy:0,omega:0,phase:motionRandom(0,Math.PI*2),mass:motionRandom(.8,1.3),radius:motionRandom(.28,.64),flutter:motionRandom(6,11),frames:[],target:null}));
 const targets=slots.map((el,i)=>({el,index:i})).filter(({el})=>el.textContent!==' ');
 for(let i=targets.length-1;i>0;i--){const j=E.randomIndex(i+1);[targets[i],targets[j]]=[targets[j],targets[i]];}
 targets.forEach(({el,index},rank)=>{
  // Match actual letters. Never replace a flag's character during its flight.
  let p=particles.find(p=>!p.target&&p.text.toLocaleUpperCase()===el.textContent.toLocaleUpperCase());
  if(!p){p={id:particles.length,x:motionRandom(15,width-45),y:height-45,text:el.textContent,color:'flag-'+particles.length%5,angle:motionRandom(-20,20),vx:0,vy:-25,omega:0,phase:motionRandom(0,6.28),mass:motionRandom(.8,1.3),radius:motionRandom(.3,.6),flutter:motionRandom(6,11),frames:[]};particles.push(p);}
  const r=el.getBoundingClientRect();p.target={x:r.left-rect.left,y:r.top-rect.top,el,index};p.catchAt=2.75+rank/Math.max(1,targets.length-1)*.8+motionRandom(-.07,.07);p.end=p.catchAt+1.15;
  el.className='name-tile '+p.color;el.dataset.color=p.color;el.style.setProperty('--turn','0deg');
 });
 // Remaining flags return to varied pockets of air, leaving room around the answer.
 const rests=[];
 particles.forEach(p=>{
  let best=null,bestDistance=-1;
  for(let attempt=0;attempt<70;attempt++){
   const x=motionRandom(12,width-42),y=motionRandom(14,height-52);if(Math.abs(y-cy)<65)continue;
   const distance=rests.length?Math.min(...rests.map(r=>Math.hypot(r.x-x,r.y-y))):1000;
   if(distance>bestDistance){best={x,y};bestDistance=distance;}
  }
  best=best||{x:12,y:14};p.restX=best.x;p.restY=best.y;if(!p.target)rests.push(best);p.end=p.end||5.1;
 });
 const dt=1/120,total=5.1,record=()=>particles.forEach(p=>{if(p.frames.length&&p.time>p.end+.01)return;p.frames.push({transform:`translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px) rotate(${p.angle.toFixed(2)}deg)`,opacity:p.target?1:1-.48*Math.max(0,Math.min(1,(p.time-3.1)/1.5)),offset:Math.min(1,p.time/p.end)});});
 particles.forEach(p=>p.time=0);record();
 for(let step=1;step<=Math.ceil(total/dt);step++){
  const time=step*dt;
  for(const p of particles){
   if(time>p.end)continue;
   let ax=0,ay=0;const catching=p.target&&time>p.catchAt,returning=!p.target&&time>3.25;
   if(catching||returning){
    const destination=catching?p.target:{x:p.restX,y:p.restY},age=time-(catching?p.catchAt:3.25),k=catching?95:15,damping=catching?15:6.5;
    ax=(destination.x-p.x)*k-p.vx*damping;ay=(destination.y-p.y)*k-p.vy*damping;
   }else{
    // A smooth moving flow with different radii and inertia for every piece.
    const gather=Math.min(1,time/.65),hold=time<1.0,spread=hold?.28:.28+.72*Math.min(1,(time-1)/.65);
    const ox=cx+Math.sin(time*1.7)*38,oy=cy+Math.cos(time*1.5)*29,dx=p.x-ox,dy=(p.y-oy)*.8,r=Math.hypot(dx,dy)||1;
    const desiredRadius=Math.min(width,height)*p.radius*spread,radial=(desiredRadius-r)*1.3;
    const surge=.85+.55*Math.sin((time-1)*3.1)+.18*Math.sin(time*7+p.phase);
    const speed=(hold?36:175*surge)*gather/p.mass,noise=Math.sin(time*2.3+p.phase+p.y*.018)*42;
    const desiredX=-dy/r*speed+dx/r*radial+noise,desiredY=dx/r*speed+dy/r*radial+Math.cos(time*1.8+p.phase+p.x*.02)*38;
    ax=(desiredX-p.vx)*3.5;ay=(desiredY-p.vy)*3.5;
    for(const other of particles){if(other===p)continue;const dx=p.x-other.x,dy=p.y-other.y,d=Math.hypot(dx,dy);if(d>0&&d<31){ax+=dx/d*(31-d)*8;ay+=dy/d*(31-d)*8;}}
   }
   // Soft walls turn the flow before flags reach text or controls.
   if(!catching){ax+=Math.max(0,28-p.x)*160-Math.max(0,p.x-(width-58))*160;ay+=Math.max(0,24-p.y)*160-Math.max(0,p.y-(height-62))*160;}
   p.vx+=ax*dt;p.vy+=ay*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(!catching){if(p.x<18){p.x=18;p.vx=Math.abs(p.vx)*.45;}if(p.x>width-50){p.x=width-50;p.vx=-Math.abs(p.vx)*.45;}if(p.y<18){p.y=18;p.vy=Math.abs(p.vy)*.45;}if(p.y>height-55){p.y=height-55;p.vy=-Math.abs(p.vy)*.45;}}
   const flutter=Math.sin(time*p.flutter+p.phase)*(catching?Math.exp(-(time-p.catchAt)*5):1);
   const targetAngle=catching?0:Math.max(-40,Math.min(40,-p.vx*.22))+flutter*(time<1?7:16);
   p.omega+=((targetAngle-p.angle)*(catching?85:32)-p.omega*(catching?7:9))*dt;p.angle+=p.omega*dt;p.time=time;
  }
  if(step%2===0)record();
 }
 const promises=[];
 particles.forEach(p=>{
  const el=document.createElement('span');el.className='letter-flag '+p.color;el.dataset.color=p.color;el.textContent=p.text;el.style.cssText='animation:none;left:0;top:0;bottom:auto';bed.append(el);
  const end=p.target?{x:p.target.x,y:p.target.y,angle:0}:{x:p.x,y:p.y,angle:p.angle};
  p.frames=p.frames.filter((f,i,list)=>i===0||f.offset>list[i-1].offset);p.frames.push({transform:`translate(${end.x}px,${end.y}px) rotate(${end.angle}deg)`,opacity:p.target?1:.52,offset:1});
  const a=motion(el,p.frames,{duration:p.end*1000,easing:'linear',fill:'both'});
  if(a)promises.push(a.finished.then(()=>{if(!result.isConnected)return;if(p.target){p.target.el.style.visibility='visible';el.remove();}else{el.style.cssText=`--x:${end.x}px;--y:${end.y}px;--turn:${end.angle}deg;--drift:${motionRandom(6,10)}s;--wander-x:${motionRandom(-9,9)}px;--wander-y:${motionRandom(-12,12)}px;opacity:.52`;}a.cancel();},()=>{}));
 });
 // One fine line per row gives the landing a physical anchor.
 const rows=new Map();slots.forEach(el=>{const r=el.getBoundingClientRect(),y=Math.round(r.top-rect.top);const row=rows.get(y)||{left:r.left-rect.left,right:r.right-rect.left};row.left=Math.min(row.left,r.left-rect.left);row.right=Math.max(row.right,r.right-rect.left);rows.set(y,row);});
 for(const [y,row] of rows){const line=document.createElement('i');line.className='name-rail';line.style.cssText=`left:${row.left-9}px;top:${y+3}px;width:${row.right-row.left+18}px`;line.setAttribute('aria-hidden','true');stage.append(line);motion(line,[{opacity:0},{opacity:0,offset:.5},{opacity:.5,offset:.63},{opacity:.5}],{duration:5100,easing:'ease-in-out'});}
 Promise.all(promises).then(()=>{if(!result.isConnected)return;slots.forEach(el=>el.style.visibility='visible');finishReveal(result,value,s);});
}
function arrangementFlight(result,s,carry=[]){
 const stage=$('stage'),rect=stage.getBoundingClientRect(),record=visibleResult(s),teams=record.kind==='teams';
 const cards=[...result.querySelectorAll('.person-card')],layer=document.createElement('div');
 layer.className='deal-layer'+(teams?' team-deal':'');layer.setAttribute('aria-hidden','true');stage.append(layer);
 result.setAttribute('aria-busy','true');result.classList.add('dealing');result.dataset.phase='gather';
 const animations=[],visible=cards.filter(card=>{const r=card.getBoundingClientRect();return r.top>=rect.top&&r.bottom<=rect.bottom;});
 const chosen=visible.slice(0,30); // Only animate the visible viewport; every assignment stays in the result.
 // Deal teams in rounds so each group receives a person before its next one.
 if(teams)chosen.sort((a,b)=>record.values.indexOf(a.dataset.person)-record.values.indexOf(b.dataset.person));
 chosen.forEach((card,i)=>{
  const target=card.getBoundingClientRect(),prior=carry.find(c=>c.text===card.dataset.person),clone=card.cloneNode(true);
  clone.classList.add('flying-card');clone.style.width=target.width+'px';clone.style.height=target.height+'px';if(teams)clone.style.borderTop='1px solid var(--line)';layer.append(clone);
  const tx=target.left-rect.left,ty=target.top-rect.top,cx=rect.width/2-target.width/2,cy=rect.height/2-target.height/2;
  const x=prior?.x??cx+(i%2?16:-16),y=prior?.y??cy+(i%3-1)*13;
  const spread=Math.max(8,Math.min(motionRandom(48,76),(rect.width-target.width)/2-5)),side=i%2?1:-1,tilt=motionRandom(.7,1.3),lift=motionRandom(-8,8),hold=3200,release=hold+i*900/Math.max(1,chosen.length-1)+motionRandom(0,75),duration=release+420;
  const frame=(x,y,angle,offset,easing='ease-in-out')=>({transform:`translate(${x}px,${y}px) rotate(${angle}deg)`,offset,easing});
  const a=motion(clone,[
   frame(x,y,0,0),frame(cx+(i%3-1)*3,cy+i%4*2,(i%3-1)*3,600/duration),
   frame(cx+(i%3-1)*3,cy+i%4*2,(i%3-1)*3,1000/duration),
   frame(cx+side*spread,cy-28-i%3*7+lift,side*12*tilt,1500/duration),
   frame(cx-side*spread,cy+20+i%3*7+lift,-side*10*tilt,2050/duration),
   frame(cx+side*spread*.75,cy-18+lift,side*8*tilt,2550/duration),
   frame(cx+(i%3-1)*2,cy+i%3*2,0,3000/duration),
   frame(cx+(i%3-1)*2,cy+i%3*2,0,release/duration,'cubic-bezier(.2,.85,.3,1)'),
   frame(tx,ty-3,0,(duration-80)/duration),frame(tx,ty,0,1)
  ],{duration,easing:'linear',fill:'both'});
  if(a)animations.push(a.finished.then(()=>{if(result.isConnected){card.style.visibility='visible';card.closest('li')?.classList.add('dealt');}clone.remove();a.cancel();},()=>{}));
 });
 const backdrop=stage.querySelector('.orb');if(backdrop){backdrop.classList.add('deal-halo');motion(backdrop,[{opacity:0,scale:'1'},{opacity:.8,scale:'.5',offset:.14},{opacity:.8,scale:'.5',offset:.25},{opacity:.5,scale:'1.05',offset:.58},{opacity:.8,scale:'.5',offset:.72},{opacity:0,scale:'1.4'}],{duration:4500,easing:'ease-in-out'});}
 const headings=[...result.querySelectorAll('h3')];headings.forEach(el=>motion(el,[{opacity:0},{opacity:0,offset:.65},{opacity:1,offset:.75},{opacity:1}],{duration:4500,easing:'linear'}));
 Promise.all(animations).then(()=>{if(!result.isConnected)return;layer.remove();result.classList.remove('dealing');result.dataset.phase='settled';finishReveal(result,teams?record.groups.map((g,i)=>`Team ${i+1}: ${g.join(', ')}`).join('. '):record.values.join(', '),s);celebrate(stage,result.querySelector(teams?'.team-results':'.order-results'));});
}

/* A sampled 2D displacement field. Each vertex responds to radius and arrival
   time; objects bend through the field instead of scaling their containers. */
function gravityEnvelope(t){
 const beats=[[0,0],[.16,13],[.27,13],[.42,.20],[.78,.14],[.89,.14],[.935,0],[1,0]];
 for(let i=1;i<beats.length;i++)if(t<=beats[i][0]){const [a,x]=beats[i-1],[b,y]=beats[i],u=Math.max(0,(t-a)/(b-a)),ease=u*u*(3-2*u);return x+(y-x)*ease;}
 return 0;
}
function releaseSpring(t,amount=1){
 const beats=[[0,1],[.89,1],[.95,1+.10*amount],[.983,1-.013*amount],[1,1]];
 for(let i=1;i<beats.length;i++)if(t<=beats[i][0]){const [a,x]=beats[i-1],[b,y]=beats[i],u=Math.max(0,(t-a)/(b-a)),ease=u*u*(3-2*u);return x+(y-x)*ease;}
 return 1;
}
function gravityPoint(x,y,cx,cy,t,flow={}){
 const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),delay=Math.min(.10,r*.00013+(flow.delay||0)),local=Math.max(0,(t-delay)/(1-delay));
 const g=gravityEnvelope(local)*(flow.strength||1),bend=g*Math.pow(155/(r+45),1.7),radius=r/(1+bend)*releaseSpring(t,flow.spring??1),turn=(flow.turn??.48)*(g/(g+2))*Math.exp(-r/330);
 const angle=Math.atan2(dy,dx)+turn;
 return {x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius};
}
function gravityTexture(width,height,paint){
 const canvas=document.createElement('canvas'),ratio=2;canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
 const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);paint(ctx,width,height);return canvas;
}
function paintWarpTriangle(ctx,texture,source,dest){
 const [a,b,c]=source,[p,q,r]=dest,den=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);if(Math.abs(den)<.0001)return;
 const solve=key=>[(p[key]*(b.y-c.y)+q[key]*(c.y-a.y)+r[key]*(a.y-b.y))/den,(p[key]*(c.x-b.x)+q[key]*(a.x-c.x)+r[key]*(b.x-a.x))/den,(p[key]*(b.x*c.y-c.x*b.y)+q[key]*(c.x*a.y-a.x*c.y)+r[key]*(a.x*b.y-b.x*a.y))/den];
 const [aa,cc,ee]=solve('x'),[bb,dd,ff]=solve('y');
 ctx.save();ctx.beginPath();
 // Slight overlap removes hairline cracks between neighbouring textured triangles.
 const mx=(p.x+q.x+r.x)/3,my=(p.y+q.y+r.y)/3;
 [p,q,r].forEach((v,i)=>{const d=Math.hypot(v.x-mx,v.y-my)||1,x=v.x+(v.x-mx)/d*1.1,y=v.y+(v.y-my)/d*1.1;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,ee,ff);ctx.drawImage(texture,0,0);ctx.restore();
}
function gravityContours(w,h,border=0,ellipse=false){
 const oval=(rx,ry)=>Array.from({length:120},(_,i)=>{const a=i*Math.PI/60;return {x:w/2+Math.cos(a)*rx,y:h/2+Math.sin(a)*ry};});
 if(border)return [oval(w/2,h/2),oval(w/2-border,h/2-border)];
 if(ellipse)return [oval(w/2,h/2)];
 const curves=[[[.55,0],[.9,0],[1,.18],[1,.42]],[[1,.42],[1,.8],[.7,1],[.38,1]],[[.38,1],[.08,1],[0,.78],[0,.55]],[[0,.55],[0,.2],[.24,0],[.55,0]]];
 return [curves.flatMap(c=>Array.from({length:30},(_,i)=>{const t=i/30,u=1-t;return {x:w*(u*u*u*c[0][0]+3*u*u*t*c[1][0]+3*u*t*t*c[2][0]+t*t*t*c[3][0]),y:h*(u*u*u*c[0][1]+3*u*u*t*c[1][1]+3*u*t*t*c[2][1]+t*t*t*c[3][1])};}))];
}
function drawWarpItem(ctx,item,centre,t){
 const {texture,x,y,w,h,angle=0,alpha=1}=item,nx=Math.max(5,Math.ceil(w/24)),ny=Math.max(5,Math.ceil(h/24)),vertices=[];
 const cos=Math.cos(angle),sin=Math.sin(angle);
 if(item.contours){ctx.globalAlpha=alpha;ctx.fillStyle=item.color;ctx.beginPath();for(const contour of item.contours){contour.forEach((v,i)=>{const lx=v.x-w/2,ly=v.y-h/2,p=gravityPoint(x+w/2+lx*cos-ly*sin,y+h/2+lx*sin+ly*cos,centre.x,centre.y,t,item.flow);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();}ctx.fill('evenodd');ctx.globalAlpha=1;return;}
 for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++){
  const u=col/nx,v=row/ny,lx=(u-.5)*w,ly=(v-.5)*h;
  vertices.push({source:{x:u*texture.width,y:v*texture.height},dest:gravityPoint(x+w/2+lx*cos-ly*sin,y+h/2+lx*sin+ly*cos,centre.x,centre.y,t,item.flow)});
 }
 const output=ctx,layer=ctx.warpLayer;
 if(layer){ctx=layer.getContext('2d');ctx.setTransform(output.warpRatio,0,0,output.warpRatio,0,0);ctx.clearRect(0,0,layer.width/output.warpRatio,layer.height/output.warpRatio);}
 ctx.globalAlpha=1;
 for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
  const a=vertices[row*(nx+1)+col],b=vertices[row*(nx+1)+col+1],c=vertices[(row+1)*(nx+1)+col+1],d=vertices[(row+1)*(nx+1)+col];
  paintWarpTriangle(ctx,texture,[a.source,b.source,c.source],[a.dest,b.dest,c.dest]);paintWarpTriangle(ctx,texture,[a.source,c.source,d.source],[a.dest,c.dest,d.dest]);
 }
 if(layer){output.globalAlpha=alpha;output.drawImage(layer,0,0,layer.width/output.warpRatio,layer.height/output.warpRatio);output.globalAlpha=1;}
}
function captureIdleDiePose(stage){
 const die=stage?.querySelector?.('.idle-die');if(!die||!die.getBoundingClientRect)return null;
 const r=die.getBoundingClientRect(),s=stage.getBoundingClientRect(),style=getComputedStyle(die);
 return {dx:r.left+r.width/2-s.left-s.width/2,dy:r.top+r.height/2-s.top-s.height/2,angle:(parseFloat(style.rotate)||-12)*Math.PI/180,scale:parseFloat(style.scale)||1};
}
function startGravityScene(stage,result){
 const phone=document.querySelector('.phone'),art=phone.querySelector('.phone-art'),phoneRect=phone.getBoundingClientRect(),stageRect=stage.getBoundingClientRect(),orb=stage.querySelector('.orb');
 const centre={x:stageRect.left+stageRect.width/2-phoneRect.left,y:stageRect.top+stageRect.height/2-phoneRect.top};
 const canvas=document.createElement('canvas');canvas.className='gravity-canvas';canvas.setAttribute('aria-hidden','true');
 const ratio=Math.min(devicePixelRatio||1,2);canvas.width=phone.clientWidth*ratio;canvas.height=phone.clientHeight*ratio;phone.append(canvas);
 const ctx=canvas.getContext('2d');ctx.warpLayer=document.createElement('canvas');ctx.warpLayer.width=canvas.width;ctx.warpLayer.height=canvas.height;ctx.warpRatio=ratio;
 const idleAnimations=[...art.getAnimations({subtree:true}),...(orb?.getAnimations()||[])].filter(a=>a.playState==='running');idleAnimations.forEach(a=>a.pause());
 const items=[],colors=getComputedStyle(phone),color=name=>colors.getPropertyValue(name).trim();
 for(const [i,el] of [...art.children].entries()){
  const style=getComputedStyle(el);if(style.display==='none')continue;
  const w=el.offsetWidth,h=el.offsetHeight,border=parseFloat(style.borderTopWidth)||0,matrix=new DOMMatrix(style.transform==='none'?undefined:style.transform);
  const texture=gravityTexture(w,h,(c)=>{
   c.fillStyle=border?style.borderTopColor:style.backgroundColor;
   if(border){c.beginPath();c.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2);c.ellipse(w/2,h/2,w/2-border,h/2-border,0,0,Math.PI*2,true);c.fill('evenodd');}
   else{c.beginPath();c.moveTo(w*.55,0);c.bezierCurveTo(w*.9,0,w,h*.18,w,h*.42);c.bezierCurveTo(w,h*.8,w*.7,h,w*.38,h);c.bezierCurveTo(w*.08,h,0,h*.78,0,h*.55);c.bezierCurveTo(0,h*.2,w*.24,0,w*.55,0);c.fill();}
  });
  const drift=style.translate.split(' ').map(parseFloat),star=el.classList.contains('art-star');
  const contours=star?[Array.from({length:8},(_,j)=>{const a=j*Math.PI/4-Math.PI/2,r=j%2?.19:.5;return {x:w/2+Math.cos(a)*w*r,y:h/2+Math.sin(a)*h*r};})]:gravityContours(w,h,border,el.classList.contains('art-ring'));
  items.push({texture,flow:{delay:motionRandom(0,.04),strength:motionRandom(.7,1.25),spring:motionRandom(.45,.8),turn:motionRandom(-.4,.55)},contours,color:border?style.borderTopColor:style.backgroundColor,x:el.offsetLeft+(drift[0]||0),y:el.offsetTop+(drift[1]||0),w,h,angle:Math.atan2(matrix.b,matrix.a)+(parseFloat(style.rotate)||0)*Math.PI/180,alpha:Number(style.opacity)});
 }
 if(orb){const o=orb.getBoundingClientRect(),style=getComputedStyle(orb);items.push({texture:gravityTexture(o.width,o.height,(c,w,h)=>{c.fillStyle=style.backgroundColor;c.beginPath();c.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2);c.fill();}),contours:gravityContours(o.width,o.height,0,true),color:style.backgroundColor,x:o.left-phoneRect.left,y:o.top-phoneRect.top,w:o.width,h:o.height,alpha:Number(style.opacity)});}
 let cachedText,cachedNumber;
 const numberItem=()=>{
  const text=result.textContent||'✦',face=result.querySelector('.result-die'),isDie=!!result.querySelector('.idle-die'),style=getComputedStyle(result),key=text+'|'+style.fontSize+'|'+isDie+'|'+!!face;
  if(key===cachedText)return cachedNumber;cachedText=key;
  const r=result.getBoundingClientRect(),w=face?190:isDie?125:Math.max(r.width+30,60),h=face?220:isDie?125:Math.max(parseFloat(style.fontSize)*1.5,70);
  const texture=gravityTexture(w,h,(c)=>{
   if(face){drawDieTexture(c,w,h,Number(face.dataset.value));return;}
   if(isDie){c.fillStyle=color('--art-purple');c.beginPath();c.roundRect(16,18,105,105,29);c.fill();c.fillStyle=color('--lemon');c.beginPath();c.roundRect(10,10,105,105,29);c.fill();c.fillStyle='#30213f';for(const x of [42,83])for(const y of [42,83]){c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();}return;}
   c.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;c.textAlign='center';
   const metrics=c.measureText(text),baseline=h/2+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
   c.fillStyle=color('--number-edge');for(let n=7;n>=1;n--)c.fillText(text,w/2+n,baseline+n,w-24);
   c.fillStyle=color('--number-light');c.fillText(text,w/2-1,baseline-1,w-24);c.fillStyle=color('--number');c.fillText(text,w/2,baseline,w-24);
  });
  const pose=isDie?numberCarryPose:null,scale=pose?.scale||1;
  cachedNumber={texture,angle:isDie?(pose?.angle??-Math.PI/15):0,x:centre.x-w*scale/2+(pose?.dx??-3),y:centre.y-h*scale/2+(pose?.dy??-4),w:w*scale,h:h*scale};return cachedNumber;
 };
 art.style.visibility='hidden';if(orb)orb.style.visibility='hidden';result.style.visibility='hidden';
 const clock=motion(canvas,[{opacity:1},{opacity:1}],{duration:4400});let frame,closed=false;
 const paint=t=>{
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,phone.clientWidth,phone.clientHeight);
  for(const item of items)drawWarpItem(ctx,item,centre,t);
  // The glow belongs to the converging field, and fades before the answer opens.
  const glow=gravityEnvelope(t)/15;
  if(glow>.01){const gradient=ctx.createRadialGradient(centre.x,centre.y,2,centre.x,centre.y,50);gradient.addColorStop(0,color('--art-lilac'));gradient.addColorStop(.2,'#baa5fa60');gradient.addColorStop(1,'#baa5fa00');ctx.globalAlpha=glow*.7;ctx.fillStyle=gradient;ctx.fillRect(centre.x-50,centre.y-50,100,100);ctx.globalAlpha=1;}
  drawWarpItem(ctx,numberItem(),centre,t);
  canvas.dataset.progress=t.toFixed(3);
 };
 const cleanup=()=>{if(closed)return;closed=true;cancelAnimationFrame(frame);canvas.remove();art.style.visibility='';if(orb)orb.style.visibility='';result.style.visibility='';idleAnimations.forEach(a=>{if(canMove())a.play();else a.cancel();});};
 const tick=()=>{if(!result.isConnected){clock?.cancel();cleanup();return;}paint(Math.min(1,Number(clock?.currentTime||0)/4400));frame=requestAnimationFrame(tick);};
 clock?.finished.then(cleanup,cleanup);frame=requestAnimationFrame(tick);
 // Accessible DOM keeps the real answer; the canvas is only a temporary visual surface.
 canvas.gravityPreview=paint;if(clock)clock.sceneCleanup=cleanup;
 return clock;
}
