// Lightweight Canvas2D stream used when a mobile browser cannot initialize WebGL.
export function createBeanStream(container,{count=120}={}){
 const canvas=document.createElement('canvas');
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y';
 container.replaceChildren(canvas);
 const context=canvas.getContext('2d',{alpha:true});
 if(!context)throw new Error('Canvas rendering is unavailable');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const beans=Array.from({length:count},(_,index)=>({
  t:index/count,phase:Math.random()*Math.PI*2,size:8+Math.random()*8,
  wobble:Math.random()*.035+.012,spin:Math.random()*Math.PI
 }));
 let width=1,height=1,active=true,disposed=false,frame=0,lastTime=performance.now(),elapsed=0;
 let pointer={x:-1000,y:-1000,active:false};
 function resize(){
  const rect=container.getBoundingClientRect();
  const ratio=Math.min(window.devicePixelRatio||1,1.35);
  width=Math.max(1,rect.width);height=Math.max(1,rect.height);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  context.setTransform(ratio,0,0,ratio,0,0);
 }
 function point(bean,t){
  const x=(t*1.16-.08)*width;
  const y=(.29+t*.42+Math.sin(t*8+elapsed*.7+bean.phase)*bean.wobble)*height;
  let dx=0,dy=0;
  if(pointer.active){
   const px=x-pointer.x,py=y-pointer.y,d=Math.hypot(px,py),reach=Math.min(width,height)*.2;
   if(d>0&&d<reach){const force=(1-d/reach)*Math.min(width,height)*.075;dx=px/d*force;dy=py/d*force;}
  }
  return{x:x+dx,y:y+dy};
 }
 function draw(bean,t){
  const p=point(bean,t),size=bean.size*Math.min(1.2,width/390),angle=.38+Math.sin(t*7+bean.phase)*.25+bean.spin;
  context.save();context.translate(p.x,p.y);context.rotate(angle);
  const rx=size*.72,ry=size*1.18;
  const fill=context.createRadialGradient(-rx*.3,-ry*.55,1,0,0,ry*1.2);
  fill.addColorStop(0,'#b9814e');fill.addColorStop(.3,'#704326');fill.addColorStop(.72,'#38251b');fill.addColorStop(1,'#1b1512');
  context.fillStyle=fill;context.beginPath();context.ellipse(0,0,rx,ry,0,0,Math.PI*2);context.fill();
  context.strokeStyle='rgba(235,190,142,.7)';context.lineWidth=Math.max(1,size*.09);context.lineCap='round';
  context.beginPath();context.moveTo(-rx*.08,-ry*.82);context.bezierCurveTo(rx*.58,-ry*.38,-rx*.42,ry*.28,rx*.12,ry*.82);context.stroke();
  context.strokeStyle='rgba(224,177,130,.24)';context.lineWidth=Math.max(1,size*.07);
  context.beginPath();context.ellipse(-rx*.24,-ry*.3,rx*.28,ry*.4,-.18,Math.PI*1.1,Math.PI*1.8);context.stroke();
  context.restore();
 }
 function render(now){
  frame=0;if(disposed||!active||document.hidden)return;
  const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;elapsed+=dt*(reduced ? .25 : 1);
  context.clearRect(0,0,width,height);
  for(const bean of beans){const t=(bean.t+elapsed*(reduced ? .018 : .075))%1;draw(bean,t);}
  frame=requestAnimationFrame(render);
 }
 function start(){if(!frame&&!disposed&&active&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(render);}}
 function stop(){if(frame){cancelAnimationFrame(frame);frame=0;}}
 function visibilityChange(){document.hidden?stop():start();}
 function move(event){const rect=container.getBoundingClientRect();pointer={x:event.clientX-rect.left,y:event.clientY-rect.top,active:true};}
 function leave(){pointer.active=false;}
 const observer='ResizeObserver' in window?new ResizeObserver(resize):null;
 if(observer)observer.observe(container);else window.addEventListener('resize',resize,{passive:true});
 resize();
 container.addEventListener('pointermove',move,{passive:true});container.addEventListener('pointerleave',leave,{passive:true});
 document.addEventListener('visibilitychange',visibilityChange);
 start();
 return{setActive(value){active=Boolean(value);active?start():stop();},dispose(){disposed=true;stop();document.removeEventListener('visibilitychange',visibilityChange);observer?.disconnect();if(!observer)window.removeEventListener('resize',resize);container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);canvas.remove();}};
}
