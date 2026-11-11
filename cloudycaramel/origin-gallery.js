export function mountOriginGallery(){
 const rail=document.querySelector('.origin-rail');if(!rail)return;
 const originals=[...rail.querySelectorAll('.origin-slide')],track=document.createElement('div');track.className='origin-gallery-track';originals.forEach(slide=>track.append(slide));rail.append(track);
 const heights=[1,.73,1.12,.88,1.03];
 originals.forEach((slide,i)=>{const image=slide.querySelector('img');slide.style.setProperty('--photo-ratio',`${image.getAttribute('width')}/${image.getAttribute('height')}`);slide.style.setProperty('--photo-height',heights[i%heights.length]);image.draggable=false;});
 rail.setAttribute('aria-label','Drag or use arrow keys to browse origin photos');
 let animation=null,cycle=0,start=0,duration=1,visible=false,drag=null;
 const modulo=(a,b)=>((a%b)+b)%b;
 const position=()=>start+(animation?modulo(Number(animation.currentTime)||0,duration)/duration*cycle:0);
 function setPosition(value){if(animation&&cycle)animation.currentTime=modulo(value-start,cycle)/cycle*duration;}
 function run(){if(!animation)return;if(visible&&!document.hidden&&!drag?.active)animation.play();else animation.pause();}
 function clone(slide){const copy=slide.cloneNode(true);copy.dataset.galleryClone='';copy.setAttribute('aria-hidden','true');copy.querySelector('img').alt='';return copy;}
 function build(){
  const phase=animation?modulo(Number(animation.currentTime)||0,duration)/duration:0;animation?.cancel();
  track.querySelectorAll('[data-gallery-clone]').forEach(node=>node.remove());
  const gap=Number.parseFloat(getComputedStyle(track).gap)||4;
  const base=originals.reduce((sum,s)=>sum+s.getBoundingClientRect().width+gap,0);if(!base)return;
  const repeat=Math.max(1,Math.ceil((rail.clientWidth+1)/base)),before=document.createDocumentFragment(),middle=document.createDocumentFragment(),after=document.createDocumentFragment();
  for(let r=0;r<repeat;r++)for(const slide of originals){before.append(clone(slide));after.append(clone(slide));if(r>0)middle.append(clone(slide));}
  track.prepend(before);track.append(middle);const suffix=after.firstChild;track.append(after);
  start=originals[0].offsetLeft;cycle=suffix.offsetLeft-start;duration=cycle/24*1000;
  animation=track.animate([{transform:`translate3d(${-start}px,0,0)`},{transform:`translate3d(${-start-cycle}px,0,0)`}],{duration,iterations:Infinity,easing:'linear'});animation.currentTime=phase*duration;rail.scrollLeft=0;run();
 }
 function begin(id,x,y){drag={id,x,y,position:position(),active:false};}
 function move(id,x,y,event){
  if(!drag||id!==drag.id)return;const dx=x-drag.x,dy=y-drag.y;
  if(!drag.active){if(Math.hypot(dx,dy)<5)return;if(Math.abs(dy)>Math.abs(dx)){drag=null;run();return;}drag.active=true;drag.position=position()+dx;animation?.pause();rail.classList.add('is-dragging');}
  if(event.cancelable)event.preventDefault();setPosition(drag.position-dx);
 }
 function end(id){if(!drag||id!==drag.id)return;drag=null;rail.classList.remove('is-dragging');run();}
 rail.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'||!event.isPrimary||event.button!==0)return;begin(event.pointerId,event.clientX,event.clientY);rail.setPointerCapture(event.pointerId);});
 rail.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')move(event.pointerId,event.clientX,event.clientY,event);},{passive:false});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])rail.addEventListener(type,event=>{if(event.pointerType!=='touch')end(event.pointerId);});
 // Explicit touch handling also works on Safari versions with inconsistent pointer capture.
 rail.addEventListener('touchstart',event=>{if(event.touches.length!==1)return;const t=event.touches[0];begin(t.identifier,t.clientX,t.clientY);},{passive:true});
 rail.addEventListener('touchmove',event=>{const t=[...event.touches].find(t=>t.identifier===drag?.id);if(t)move(t.identifier,t.clientX,t.clientY,event);},{passive:false});
 for(const type of ['touchend','touchcancel'])rail.addEventListener(type,event=>{for(const t of event.changedTouches)end(t.identifier);},{passive:true});
 rail.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY)&&Math.abs(event.deltaX)>2){event.preventDefault();setPosition(position()+event.deltaX);}},{passive:false});
 rail.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setPosition(position()+(event.key==='ArrowRight'?1:-1)*Math.min(rail.clientWidth*.65,450));}});
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;run();},{rootMargin:'80px'}).observe(rail);
 document.addEventListener('visibilitychange',run);
 let frame=0;new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(build);}).observe(rail);
 build();
}
