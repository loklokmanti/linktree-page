import {tasteEyeShapes} from './taste-eye-shapes.js?v=taste-eyes-mobile-20261111';
const NS='http://www.w3.org/2000/svg';
export function mountTasteEyes(container){
 const source=document.querySelector('.footer-cat .cat-illustration');if(!source||!container)return {update(){}};
 const originalPupils=[...source.querySelector('.cat-pupils').children];
 function bounds(nodes){const boxes=nodes.map(node=>node.getBBox()),x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));return {x,y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};}
 // Keep the exact unequal sizes and locations of the two original coffee pupils.
 const pupilBounds=[bounds(originalPupils.slice(0,2)),bounds(originalPupils.slice(2,4))];
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','50 45 255 115');svg.setAttribute('class','taste-eyes');svg.setAttribute('role','img');svg.setAttribute('aria-label','Blinking cat eyes with apricot pupils');svg.dataset.note='apricot';
 const whites=source.querySelector('.cat-eye-whites').cloneNode(true);whites.removeAttribute('class');whites.setAttribute('stroke','#27241f');whites.setAttribute('stroke-width','3');whites.setAttribute('stroke-linejoin','round');svg.append(whites);
 const defs=document.createElementNS(NS,'defs');svg.append(defs);const body=document.createElementNS(NS,'path');body.id='taste-pupil-body';body.setAttribute('fill','#27241f');defs.append(body);
 const details=[];tasteEyeShapes.forEach((shape,i)=>{const group=document.createElementNS(NS,'g');group.id='taste-pupil-detail-'+i;group.setAttribute('fill','#27241f');group.innerHTML=shape.details;defs.append(group);details.push(group);});
 const pupils=document.createElementNS(NS,'g');svg.append(pupils);const detailUses=[];
 for(const b of pupilBounds){const pupil=document.createElementNS(NS,'g');pupil.setAttribute('class','taste-pupil');pupil.setAttribute('transform',`translate(${b.x} ${b.y}) scale(${b.width} ${b.height})`);pupils.append(pupil);const use=document.createElementNS(NS,'use');use.setAttribute('href','#taste-pupil-body');pupil.append(use);const uses=[];for(let i=0;i<4;i++){const d=document.createElementNS(NS,'use');d.setAttribute('href','#taste-pupil-detail-'+i);d.setAttribute('opacity','0');pupil.append(d);uses.push(d);}detailUses.push(uses);}
 container.append(svg);
 const contours=tasteEyeShapes.map((shape,i)=>{
  const path=document.createElementNS(NS,'path');path.setAttribute('d',shape.body);defs.append(path);
  const box=path.getBBox();if(i===0){const leaf=details[i].querySelector('path'),b=leaf.getBBox();const right=Math.max(box.x+box.width,b.x+b.width),bottom=Math.max(box.y+box.height,b.y+b.height);box.x=Math.min(box.x,b.x);box.y=Math.min(box.y,b.y);box.width=right-box.x;box.height=bottom-box.y;}
  const length=path.getTotalLength(),points=Array.from({length:96},(_,n)=>{const p=path.getPointAtLength(n/96*length);return [(p.x-box.x)/box.width,(p.y-box.y)/box.height];});
  let top=0;for(let n=1;n<points.length;n++)if(points[n][1]<points[top][1])top=n;
  details[i].setAttribute('transform',`matrix(${1/box.width} 0 0 ${1/box.height} ${-box.x/box.width} ${-box.y/box.height})`);
  path.remove();return points.slice(top).concat(points.slice(0,top));
 });
 let last=-1;
 function update(progress){const phase=Math.max(0,Math.min(1,progress))*3;if(Math.abs(phase-last)<.0001)return;last=phase;const from=Math.min(2,Math.floor(phase)),to=from+1,t=phase-from,e=t*t*(3-2*t);const points=contours[from].map((a,i)=>[a[0]+(contours[to][i][0]-a[0])*e,a[1]+(contours[to][i][1]-a[1])*e]);body.setAttribute('d','M'+points.map(p=>p.map(n=>n.toFixed(5)).join(' ')).join('L')+'Z');for(const uses of detailUses)uses.forEach((use,i)=>use.setAttribute('opacity',i===from?1-e:i===to?e:0));const name=tasteEyeShapes[Math.round(phase)].name;svg.dataset.note=name;svg.setAttribute('aria-label',`Blinking cat eyes with ${name} pupils`);}
 update(0);
 const whiteBounds=whites.getBBox(),centerY=whiteBounds.y+whiteBounds.height/2;
 const glances=[[0,0,0],[2,0,0],[2.7,5,-2],[5,5,-2],[5.7,0,0],[9,0,0],[9.7,-5,2],[12,-5,2],[12.7,0,0],[14,0,0],[14.7,2,-3],[16,2,-3],[17,0,0]];
 let visible=false,frame=0;
 function animate(time){frame=0;if(!visible||document.hidden)return;let openness=1;const blinkTime=time%9700;for(const start of [3300,7200,7800]){const phase=(blinkTime-start)/180;if(phase>=0&&phase<=1)openness=1-.97*Math.sin(phase*Math.PI);}whites.setAttribute('transform',`translate(0 ${centerY}) scale(1 ${openness}) translate(0 ${-centerY})`);pupils.setAttribute('opacity',String(Math.max(0,Math.min(1,(openness-.55)/.35))));const t=time/1000%17;for(let i=1;i<glances.length;i++){const b=glances[i],a=glances[i-1];if(t>b[0])continue;const q=(t-a[0])/(b[0]-a[0]),e=q*q*(3-2*q);pupils.setAttribute('transform',`translate(${a[1]+(b[1]-a[1])*e} ${a[2]+(b[2]-a[2])*e})`);break;}frame=requestAnimationFrame(animate);}
 function run(){if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(animate);else if((!visible||document.hidden)&&frame){cancelAnimationFrame(frame);frame=0;}}
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;run();}).observe(container);document.addEventListener('visibilitychange',run);
 return {update};
}
