export function mountOriginGallery(){
 const rail=document.querySelector('.origin-rail');if(!rail)return;
 const originals=[...rail.querySelectorAll('.origin-slide')],prev=document.querySelector('.origin-prev'),next=document.querySelector('.origin-next'),counter=document.querySelector('.origin-count');
 const heights=[1,.73,1.12,.88,1.03];
 originals.forEach((slide,i)=>{const image=slide.querySelector('img');slide.style.setProperty('--photo-ratio',`${image.getAttribute("width")}/${image.getAttribute("height")}`);slide.style.setProperty('--photo-height',heights[i%heights.length]);image.draggable=false;});
 rail.setAttribute('aria-label','Drag or use arrow keys to browse origin photos');counter.setAttribute('aria-live','off');prev.disabled=next.disabled=false;
 let cycle=0,basePeriod=0,slideStarts=[],start=0,position=0,visible=false,hover=false,focused=false,drag=null,resumeAt=0,frame=0,last=0,lastIndex=-1;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function clone(slide){const copy=slide.cloneNode(true);copy.dataset.galleryClone='';copy.setAttribute('aria-hidden','true');copy.inert=true;return copy;}
 function build(){
  rail.querySelectorAll('[data-gallery-clone]').forEach(node=>node.remove());
  const gap=Number.parseFloat(getComputedStyle(rail).gap)||4;
  const base=originals.reduce((sum,slide)=>sum+slide.getBoundingClientRect().width+gap,0);
  if(!base)return;
  basePeriod=base;
  const repeat=Math.max(1,Math.ceil((rail.clientWidth+1)/base));
  const before=document.createDocumentFragment(),middle=document.createDocumentFragment(),after=document.createDocumentFragment();
  for(let r=0;r<repeat;r++)for(const slide of originals){before.append(clone(slide));after.append(clone(slide));if(r>0)middle.append(clone(slide));}
  rail.prepend(before);rail.append(middle);const suffix=after.firstChild;rail.append(after);
  start=originals[0].offsetLeft;slideStarts=originals.map(slide=>slide.offsetLeft-start);cycle=suffix.offsetLeft-start;position=start;rail.scrollLeft=position;updateCount();
 }
 function normalize(){if(!cycle)return;position=start+((position-start)%cycle+cycle)%cycle;rail.scrollLeft=position;}
 function updateCount(){
  if(!cycle)return;
  const x=((rail.scrollLeft-start)%cycle+cycle)%cycle;
  const local=x%basePeriod;let index=0;
  for(let i=1;i<originals.length;i++)if(local>=slideStarts[i]-1)index=i;
  if(index!==lastIndex){counter.textContent=`${index+1} / ${originals.length}`;lastIndex=index;}
 }
 function animate(now){
  frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(visible&&!document.hidden&&!reduced.matches&&!hover&&!focused&&!drag&&now>=resumeAt){position+=18*dt;normalize();}
  if(visible&&!document.hidden)frame=requestAnimationFrame(animate);
 }
 function run(){last=0;if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(animate);}
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;last=0;}else run();},{rootMargin:'80px'}).observe(rail);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else run();});
 rail.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hover=true;});rail.addEventListener('pointerleave',()=>{hover=false;});
 rail.addEventListener('focusin',()=>{focused=true;});rail.addEventListener('focusout',()=>{focused=false;});
 rail.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,position:rail.scrollLeft,active:false};position=rail.scrollLeft;});
 rail.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.active){if(Math.hypot(dx,dy)<5)return;if(Math.abs(dy)>Math.abs(dx)){drag=null;return;}drag.active=true;rail.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');}
  event.preventDefault();position=drag.position-dx;normalize();
 },{passive:false});
 function release(event){if(!drag||event.pointerId!==drag.id)return;const id=drag.id;drag=null;rail.classList.remove('is-dragging');if(rail.hasPointerCapture(id))rail.releasePointerCapture(id);resumeAt=performance.now()+1500;}
 rail.addEventListener('pointerup',release);rail.addEventListener('pointercancel',release);rail.addEventListener('lostpointercapture',release);
 rail.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>.1)resumeAt=performance.now()+1500;},{passive:true});
 rail.addEventListener('scroll',()=>{if(!drag&&performance.now()<resumeAt)position=rail.scrollLeft;updateCount();},{passive:true});
 function move(direction){position=rail.scrollLeft+direction*Math.min(rail.clientWidth*.65,450);normalize();resumeAt=performance.now()+2000;updateCount();}
 prev.onclick=()=>move(-1);next.onclick=()=>move(1);
 rail.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
 let resizeFrame=0;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(build);}).observe(rail);
 build();
}
