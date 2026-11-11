import {organicBeanStarts,organicBeanStartCount} from './organic-bean-starts.js?v=bean-reshuffle-9137-20261111';
import {createPouchRigidBodies} from './pouch-rigid-bodies.js?v=random-start-20261111';
import {beanDefaults} from './bean-tuner.js?v=random-start-20261111';
import * as THREE from '../beans/vendor/three.module.js';
import {createPouchBeanGeometry,createPouchBeanCollisionGeometry,pouchBeanReference} from './pouch-bean-geometry.js?v=random-start-20261111';

// Lightweight pouch-only beans; the separate interaction retains its detail.
export async function fillFrostedPouch(viewer, bounds) {
 const settings={...beanDefaults};
 const geometry=createPouchBeanGeometry();
 const collisionGeometry=createPouchBeanCollisionGeometry();
 const size=pouchBeanReference.size.clone();
 viewer.renderer.outputColorSpace=THREE.SRGBColorSpace;
 viewer.renderer.transmissionResolutionScale=.75;
 const material=new THREE.MeshStandardMaterial({color:'#65402a',roughness:.9,metalness:0,vertexColors:true});
 const {minX,maxX,minY,maxY,minZ,maxZ} = bounds;
 const width=maxX-minX, height=maxY-minY, depth=maxZ-minZ;
 const centerX=(minX+maxX)/2, centerZ=(minZ+maxZ)/2;
 const beanLength=.011;
 const scale=beanLength/Math.max(size.x,size.y,size.z);
 // Rasterize the actual front/back panels, including their wrinkles and tapered seams.
 // A bean's entire bounding sphere must fit, not just its center.
 const nx=161,ny=121,lo=new Float32Array(nx*ny).fill(Infinity),hi=new Float32Array(nx*ny).fill(-Infinity);
 const dx=width/(nx-1),dy=height/(ny-1),vertex=new THREE.Vector3();
 viewer.model.updateMatrixWorld(true);
 viewer.model.traverse(part=>{
  if(!part.isMesh||!/tensioned.*laminate/i.test(part.name))return;
  const position=part.geometry.attributes.position,index=part.geometry.index;
  const points=[];
  for(let i=0;i<position.count;i++){vertex.fromBufferAttribute(position,i).applyMatrix4(part.matrixWorld);points.push(vertex.clone());}
  const count=index?index.count:position.count;
  for(let i=0;i<count;i+=3){
   const a=points[index?index.getX(i):i],b=points[index?index.getX(i+1):i+1],c=points[index?index.getX(i+2):i+2];
   const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<1e-12)continue;
   const x0=Math.max(0,Math.ceil((Math.min(a.x,b.x,c.x)-minX)/dx)),x1=Math.min(nx-1,Math.floor((Math.max(a.x,b.x,c.x)-minX)/dx));
   const y0=Math.max(0,Math.ceil((Math.min(a.y,b.y,c.y)-minY)/dy)),y1=Math.min(ny-1,Math.floor((Math.max(a.y,b.y,c.y)-minY)/dy));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const px=minX+x*dx,py=minY+y*dy;
    const u=((b.y-c.y)*(px-c.x)+(c.x-b.x)*(py-c.y))/denominator;
    const v=((c.y-a.y)*(px-c.x)+(a.x-c.x)*(py-c.y))/denominator,w=1-u-v;
    if(Math.min(u,v,w)<-1e-5)continue;
    const z=u*a.z+v*b.z+w*c.z,k=y*nx+x;lo[k]=Math.min(lo[k],z);hi[k]=Math.max(hi[k],z);
   }
  }
 });
 geometry.computeBoundingSphere();
 const radius=pouchBeanReference.radius*scale+.0001,clearance=radius+.0016;
 // Bake bean clearance once. Runtime wall queries interpolate four numbers,
 // rather than resampling nine surface points for every neighbour contact.
 const innerLo=new Float32Array(nx*ny),innerHi=new Float32Array(nx*ny);
 const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]];
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  let lower=-Infinity,upper=Infinity;
  for(const [ox,oy] of offsets){
   const ix=Math.round(x+ox*clearance/dx),iy=Math.round(y+oy*clearance/dy);
   if(ix<0||ix>=nx||iy<0||iy>=ny){lower=Infinity;upper=-Infinity;break;}
   const k=iy*nx+ix;lower=Math.max(lower,lo[k]+clearance);upper=Math.min(upper,hi[k]-clearance);
  }
  innerLo[y*nx+x]=lower;innerHi[y*nx+x]=upper;
 }
 const wallRange=new Float64Array(2);
 function limits(x,y){
  if(y<minY+.019||y>minY+height*.80)return null;
  const gx=(x-minX)/dx,gy=(y-minY)/dy,ix=Math.floor(gx),iy=Math.floor(gy);
  if(ix<0||ix>=nx-1||iy<0||iy>=ny-1)return null;
  const k=iy*nx+ix,tx=gx-ix,ty=gy-iy;
  const a=innerLo[k],b=innerLo[k+1],c=innerLo[k+nx],d=innerLo[k+nx+1];
  const e=innerHi[k],f=innerHi[k+1],g=innerHi[k+nx],h=innerHi[k+nx+1];
  if(!Number.isFinite(a+b+c+d+e+f+g+h))return null;
  wallRange[0]=(a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
  wallRange[1]=(e+(f-e)*tx)*(1-ty)+(g+(h-g)*tx)*ty;
  return wallRange[0]<wallRange[1]?wallRange:null;
 }
 let seed=2721;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const beans=[];
 for(let y=minY+.023;y<minY+height*.79;y+=radius*1.18){
  for(let x=minX+clearance;x<maxX-clearance;x+=radius*1.22){
   const range=limits(x,y);if(!range)continue;
   const lower=range[0],upper=range[1];
   for(let z=lower+radius*.25;z<upper;z+=radius*1.22){
    beans.push({position:new THREE.Vector3(x,y,z),rotation:new THREE.Euler(),scale:scale*(.94+random()*.06)});
   }
  }
 }
 const pool=beans.slice();
 for(const bean of pool)bean.baseScale=bean.scale;
 const mesh=new THREE.InstancedMesh(geometry,material,beans.length);
 mesh.name='Experiment — moving contained coffee beans';mesh.frustumCulled=false;
 mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 const pouchVisuals=[];
 viewer.model.traverse(part=>{if(part.isMesh){part.userData.pouchOriginalVisible=part.visible;pouchVisuals.push({part,visible:part.visible});}});
 function applyVisibility(){
  viewer.model.userData.showPouch=settings.showPouch;
  for(const {part,visible} of pouchVisuals)part.visible=settings.showPouch&&visible;
 }
 const dummy=new THREE.Object3D();
 beans.forEach((bean,index)=>mesh.setColorAt(index,new THREE.Color().setScalar(.72+random()*.28)));
 viewer.model.add(mesh);
 const physics=await createPouchRigidBodies({model:viewer.model,geometry:collisionGeometry,bounds,surface:{lo,hi,nx,ny,dx,dy},settings});
 const canvas=viewer.renderer.domElement,pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
 const pointerLocal=new THREE.Vector3(),previousPointer=new THREE.Vector3(),pointerVelocity=new THREE.Vector3();
 let pointerActive=false,pointerReady=false,disposed=false,frame=0,lastTime=0,lastScroll=0,pointerDirty=false,accumulator=0;
 function move(event){
  const rect=canvas.getBoundingClientRect();
  pointerActive=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
  if(!pointerActive){pointerReady=false;return;}
  const x=(event.clientX-rect.left)/rect.width*2-1,y=1-(event.clientY-rect.top)/rect.height*2;
  if(pointer.x!==x||pointer.y!==y)pointerDirty=true;
  pointer.set(x,y);
 }
 document.addEventListener('pointermove',move,{passive:true});
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'});
 let visible=true;observer.observe(canvas);
 function step(dt){
  let interaction=null;
  if(pointerActive&&pointerDirty){
   viewer.model.updateMatrixWorld(true);ray.setFromCamera(pointer,viewer.camera);
   const origin=viewer.model.worldToLocal(ray.ray.origin.clone());
   const direction=ray.ray.direction.clone().transformDirection(viewer.model.matrixWorld.clone().invert());
   const t=(centerZ-origin.z)/direction.z;
   if(t>0&&Number.isFinite(t)){
    pointerLocal.copy(origin).addScaledVector(direction,t);
    if(pointerReady)pointerVelocity.subVectors(pointerLocal,previousPointer).clampLength(0,.025);else pointerVelocity.set(0,0,0);
    previousPointer.copy(pointerLocal);pointerReady=true;
    interaction={position:pointerLocal,delta:pointerVelocity};
   }
  }
  pointerDirty=false;return physics.step(dt,interaction);
 }
 function paint(force=true){
  let changed=false;
  beans.forEach((bean,index)=>{if(!force&&!bean.dirty)return;bean.dirty=false;changed=true;dummy.position.copy(bean.position);dummy.rotation.copy(bean.rotation);dummy.scale.setScalar(bean.scale);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);});
  if(changed){mesh.instanceMatrix.needsUpdate=true;viewer.invalidate();}
 }
 function animate(now){
  if(disposed)return;const dt=Math.min((now-(lastTime||now))/1000,.025);lastTime=now;
  if(visible&&!document.hidden&&dt>0){
   accumulator=Math.min(accumulator+dt,1/30);let changed=false;
   while(accumulator>=1/60){changed=step(1/60)||changed;accumulator-=1/60;}
   if(changed)paint(false);
  }else accumulator=0;
  frame=requestAnimationFrame(animate);
 }
 function repack(){
  // The approved 805-bean layout was relaxed offline with these same hulls.
  // Reading it is cheaper than searching grid slots, and adds no frame work.
  if(settings.beanSize===.8&&settings.collisionSpacing===1.3&&settings.startingSpacing===1&&settings.count<=organicBeanStartCount){
   beans.length=0;
   const count=Math.min(pool.length,Math.round(settings.count)),orientation=new THREE.Quaternion();
   for(let i=0;i<count;i++){
    const bean=pool[i],p=organicBeanStarts.subarray(i*7,i*7+7);
    bean.position.set(p[0],p[1],p[2]);orientation.set(p[3],p[4],p[5],p[6]).normalize();
    bean.rotation.setFromQuaternion(orientation);bean.scale=bean.baseScale*settings.beanSize;beans.push(bean);
   }
   mesh.count=count;physics.repack(beans);paint();return `Repacked ${count} beans.`;
  }
  const positions=[];
  const spacing=Math.max(1,settings.startingSpacing)*settings.collisionSpacing*settings.beanSize;
  // Generate safe slots, then sample across the whole volume instead of filling bottom rows first.
  const stepX=size.x*scale*spacing*1.08,stepY=size.y*scale*spacing*1.04,stepZ=size.z*scale*spacing*1.08;
  const halfHeight=size.y*scale*settings.beanSize*settings.collisionSpacing/2;
  const extra=Math.max(0,settings.beanSize*Math.max(1,settings.collisionSpacing)-1)*radius;
  const floor=Math.max(minY+.023,minY+.014+halfHeight+.001);
  const ceiling=Math.min(minY+height*.76,minY+.014+height*.72-halfHeight-.001);
  for(let y=floor;y<ceiling;y+=stepY){
   for(let x=minX+clearance+extra;x<maxX-clearance-extra;x+=stepX){
    let lower=-Infinity,upper=Infinity,valid=true;
    for(const [ox,oy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
     const range=limits(x+ox*extra,y+oy*extra);if(!range){valid=false;break;}
     lower=Math.max(lower,range[0]+extra);upper=Math.min(upper,range[1]-extra);
    }
    if(!valid||lower>=upper)continue;
    for(let z=lower+radius*.25;z<upper;z+=stepZ)positions.push([x,y,z]);
   }
  }
  // Fisher–Yates removes the bottom-to-top selection bias. Jitter is bounded
  // by the free gap between collider bounds, so it cannot create overlap.
  for(let i=positions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
  const collisionScale=scale*settings.beanSize*settings.collisionSpacing;
  const jitterX=Math.max(0,stepX-size.x*collisionScale)*.35;
  const jitterY=Math.max(0,stepY-size.y*collisionScale)*.35;
  const jitterZ=Math.max(0,stepZ-size.z*collisionScale)*.35;
  for(const p of positions){
   const x=p[0]+(random()*2-1)*jitterX,y=p[1]+(random()*2-1)*jitterY,z=p[2]+(random()*2-1)*jitterZ;
   let lower=-Infinity,upper=Infinity,valid=true;
   for(const [ox,oy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
    const range=limits(x+ox*extra,y+oy*extra);if(!range){valid=false;break;}
    lower=Math.max(lower,range[0]+extra);upper=Math.min(upper,range[1]-extra);
   }
   if(valid&&y>=floor&&y<ceiling&&x>=minX+clearance+extra&&x<maxX-clearance-extra&&z>=lower+radius*.25&&z<upper){p[0]=x;p[1]=y;p[2]=z;}
  }
  beans.length=0;
  const count=Math.min(pool.length,Math.round(settings.count),positions.length);
  for(let i=0;i<count;i++){
   const bean=pool[i];bean.scale=bean.baseScale*settings.beanSize;bean.position.fromArray(positions[i]);bean.rotation.set(0,0,0);beans.push(bean);
  }
  mesh.count=count;physics.repack(beans);paint();
  return `Repacked ${count} beans${count<Math.round(settings.count)?' · solid bodies limit the fill at this spacing':''}.`;
 }
 function applySettings(name){
  applyVisibility();
  if(name==='beanSize'||name==='count'||name==='startingSpacing'||name==='collisionSpacing'||name==='all')return repack();
  paint();
 }
 applyVisibility();
 repack();
 paint();frame=requestAnimationFrame(animate);
 viewer.model.traverse(part=>{
  if(!part.isMesh||part===mesh)return;
  const name=part.name.toLowerCase();
  if(/label|sticker|paper/.test(name)){
   // Exclude opaque sticker from the transmission capture: otherwise the film
   // blurs a second copy outside its silhouette. Alpha-test keeps cutout edges.
   part.renderOrder=100;part.castShadow=false;part.receiveShadow=false;
   for(const label of Array.isArray(part.material)?part.material:[part.material]){
    label.transparent=true;label.opacity=1;label.depthWrite=true;
    label.alphaTest=.5;label.transmission=0;label.needsUpdate=true;
   }
   return;
  }
  if(/valve/.test(name))return;
  for(const film of Array.isArray(part.material)?part.material:[part.material]){
   film.map=null;film.roughnessMap=null;film.color.set('#fff4df');
   film.transmission=.88;film.thickness=.0012;film.ior=1.36;
   film.roughness=.36;film.metalness=0;film.clearcoat=.08;
   film.normalScale?.setScalar(.10);
   film.attenuationColor.set('#fff0d9');film.attenuationDistance=.35;
   film.needsUpdate=true;
  }
 });
 viewer.setFresnel({strength:.15,power:2,color:'#fff4e5'});
 viewer.invalidate();
 return {
  scroll(progress){physics.scroll(THREE.MathUtils.clamp(progress-lastScroll,-.06,.06)*5);lastScroll=progress;},getPhysicsState:()=>physics.state(),
  dispose(){physics.dispose();collisionGeometry.dispose();disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('pointermove',move);mesh.dispose();}
 };
}
