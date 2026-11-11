import RAPIER from './vendor/rapier/rapier.mjs';
import * as THREE from '../beans/vendor/three.module.js';

const UNIT=100; // Centimetres keep solver tolerances appropriate for small beans.
let initialized;
export async function createPouchRigidBodies({model,geometry,bounds,surface,settings}){
 await (initialized??=RAPIER.init());
 const world=new RAPIER.World({x:0,y:-13*settings.fallSpeed,z:0});
 world.integrationParameters.numSolverIterations=8;
 world.integrationParameters.numInternalPgsIterations=1;
 world.integrationParameters.normalizedAllowedLinearError=.0005;
 world.integrationParameters.normalizedPredictionDistance=.01;
 const cage=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
 const {minX,maxX,minY,maxY,minZ,maxZ}=bounds;
 const {lo,hi,nx,ny,dx,dy}=surface;
 // A closed, smooth collision shell, sampled from the actual pouch panels.
 const rows=7,columns=9,vertices=[];
 const at=(x,y)=>{
  const gx=(x-minX)/dx,gy=(y-minY)/dy,ix=Math.max(0,Math.min(nx-2,Math.floor(gx))),iy=Math.max(0,Math.min(ny-2,Math.floor(gy))),tx=gx-ix,ty=gy-iy,k=iy*nx+ix;
  const sample=a=>(a[k]*(1-tx)+a[k+1]*tx)*(1-ty)+(a[k+nx]*(1-tx)+a[k+nx+1]*tx)*ty;
  return [sample(lo),sample(hi)];
 };
 for(let row=0;row<rows;row++){
  const y=minY+.014+(maxY-minY)*.72*row/(rows-1),iy=Math.round((y-minY)/dy);
  let left=0,right=nx-1;
  while(left<right&&(!Number.isFinite(lo[iy*nx+left]+hi[iy*nx+left])||hi[iy*nx+left]-lo[iy*nx+left]<.002))left++;
  while(right>left&&(!Number.isFinite(lo[iy*nx+right]+hi[iy*nx+right])||hi[iy*nx+right]-lo[iy*nx+right]<.002))right--;
  const x0=minX+(left+1.25)*dx,x1=minX+(right-1.25)*dx;
  for(let col=0;col<columns;col++){
   const x=x0+(x1-x0)*col/(columns-1),range=at(x,y);
   const low=Number.isFinite(range[0])?range[0]+.0015:(minZ+maxZ)/2-.001;
   const high=Number.isFinite(range[1])?range[1]-.0015:(minZ+maxZ)/2+.001;
   vertices.push(x*UNIT,y*UNIT,low*UNIT,x*UNIT,y*UNIT,high*UNIT);
  }
 }
 const id=(r,c,side)=>(r*columns+c)*2+side;
 const walls=[];
 function slab(a,b,c,d,normal){
  const points=[];
  for(const i of [a,b,c,d]){
   const x=vertices[i*3],y=vertices[i*3+1],z=vertices[i*3+2];
   points.push(x,y,z,x+normal[0]*.4,y+normal[1]*.4,z+normal[2]*.4);
  }
  const shape=RAPIER.ColliderDesc.convexHull(new Float32Array(points));
  if(shape)walls.push(world.createCollider(shape.setFriction(settings.friction).setRestitution(0),cage));
 }
 // Solid convex wall tiles have thickness; they cannot be crossed from the
 // back side like a triangle sheet. No per-bean containment corrections.
 for(let r=0;r<rows-1;r++)for(let c=0;c<columns-1;c++)for(let side=0;side<2;side++)
  slab(id(r,c,side),id(r,c+1,side),id(r+1,c+1,side),id(r+1,c,side),[0,0,side===1?1:-1]);
 for(let c=0;c<columns-1;c++){
  slab(id(0,c,0),id(0,c+1,0),id(0,c+1,1),id(0,c,1),[0,-1,0]);
  slab(id(rows-1,c,0),id(rows-1,c+1,0),id(rows-1,c+1,1),id(rows-1,c,1),[0,1,0]);
 }
 for(let r=0;r<rows-1;r++){
  slab(id(r,0,0),id(r+1,0,0),id(r+1,0,1),id(r,0,1),[-1,0,0]);
  slab(id(r,columns-1,0),id(r+1,columns-1,0),id(r+1,columns-1,1),id(r,columns-1,1),[1,0,0]);
 }
 const bodies=[];
 // Simulate in the pouch's coordinate frame. Its solid walls stay fixed;
 // world gravity and pouch acceleration are transformed into this frame.
 // This avoids teleporting a thin collision container through its contents.
 const oldMatrix=model.matrixWorld.clone(),frameDelta=new THREE.Matrix4(),inverse=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),q=new THREE.Quaternion();
 const gravity=new THREE.Vector3(),direction=new THREE.Vector3();
 let lastGravity=settings.fallSpeed,lastFriction=settings.friction,scrollImpulse=0,steps=0;
 function clear(){for(const bean of bodies)world.removeRigidBody(bean.body);bodies.length=0;}
 function repack(beans){
  clear();model.updateMatrixWorld(true);oldMatrix.copy(model.matrixWorld);
  const source=geometry.attributes.position;
  for(const bean of beans){
   position.copy(bean.position).multiplyScalar(UNIT);
   q.setFromEuler(bean.rotation);
   const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setRotation(q).setLinearDamping(1.2).setAngularDamping(3).setCanSleep(true).setCcdEnabled(true));
   const points=new Float32Array(source.count*3),scale=bean.scale*settings.collisionSpacing*UNIT;
   for(let i=0;i<source.count;i++){points[i*3]=source.getX(i)*scale;points[i*3+1]=source.getY(i)*scale;points[i*3+2]=source.getZ(i)*scale;}
   const desc=RAPIER.ColliderDesc.convexHull(points);
   if(!desc)throw Error('Bean collision hull could not be built');
   const collider=world.createCollider(desc.setDensity(1).setFriction(settings.friction).setRestitution(0).setContactSkin(.001),body);
   bodies.push({bean,body,collider,wasAwake:true});
  }
 }
 function setProperties(){
  if(lastFriction!==settings.friction){for(const wall of walls)wall.setFriction(settings.friction);for(const b of bodies){b.collider.setFriction(settings.friction);b.body.wakeUp();}lastFriction=settings.friction;}
  if(lastGravity!==settings.fallSpeed){for(const b of bodies)b.body.wakeUp();lastGravity=settings.fallSpeed;}
 }
 function step(dt,pointer){
  setProperties();model.updateMatrixWorld(true);world.timestep=dt;
  model.getWorldQuaternion(rotation);rotation.invert();
  gravity.set(0,-13*settings.fallSpeed,0).applyQuaternion(rotation);world.gravity={x:gravity.x,y:gravity.y,z:gravity.z};
  inverse.copy(model.matrixWorld).invert();frameDelta.multiplyMatrices(inverse,oldMatrix);
  const moved=oldMatrix.elements.some((v,i)=>Math.abs(v-model.matrixWorld.elements[i])>1e-7);
  if(moved){
   for(const {body} of bodies){
    const p=body.translation();position.set(p.x/UNIT,p.y/UNIT,p.z/UNIT);
    direction.copy(position).applyMatrix4(frameDelta).sub(position).multiplyScalar(UNIT*.16*settings.motion/dt).clampLength(0,3);
    body.applyImpulse({x:direction.x*body.mass(),y:direction.y*body.mass(),z:direction.z*body.mass()},true);
   }
   oldMatrix.copy(model.matrixWorld);
  }
  if(scrollImpulse){
   direction.set(scrollImpulse*3,0,scrollImpulse);
   for(const {body} of bodies)body.applyImpulse({x:direction.x*body.mass(),y:direction.y*body.mass(),z:direction.z*body.mass()},true);
   scrollImpulse=0;
  }
  if(pointer&&settings.motion>0){
   const point=pointer.position.clone().multiplyScalar(UNIT);
   const push=pointer.delta.clone().multiplyScalar(UNIT*18*settings.motion).clampLength(0,8);
   if(push.lengthSq()>1e-6)for(const {body} of bodies){
    const p=body.translation(),distance=Math.hypot(p.x-point.x,p.y-point.y,p.z-point.z);
    if(distance<4.5){const strength=(1-distance/4.5)*body.mass();body.applyImpulse({x:push.x*strength,y:push.y*strength,z:push.z*strength},true);}
   }
  }
  world.step();steps++;
  let changed=false;
  for(const entry of bodies){
   const {bean,body}=entry,sleeping=body.isSleeping();
   if(sleeping&&!entry.wasAwake)continue;
   entry.wasAwake=!sleeping;changed=true;
   const p=body.translation(),r=body.rotation();bean.position.set(p.x/UNIT,p.y/UNIT,p.z/UNIT);
   q.set(r.x,r.y,r.z,r.w);bean.rotation.setFromQuaternion(q);bean.dirty=true;
  }
  return changed;
 }
 return {repack,step,scroll(delta){scrollImpulse+=delta*settings.motion;},
  state(){
   let maxPenetration=0;
   for(const {collider} of bodies)world.contactPairsWith(collider,other=>world.contactPair(collider,other,manifold=>{for(let i=0;i<manifold.numContacts();i++)maxPenetration=Math.max(maxPenetration,-manifold.contactDist(i));}));
   return {engine:'Rapier',steps,count:bodies.length,sleeping:bodies.filter(b=>b.body.isSleeping()).length,maxPenetration,
    positions:bodies.map(({body})=>({...body.translation()})),velocities:bodies.map(({body})=>({...body.linvel()})),angularVelocities:bodies.map(({body})=>({...body.angvel()}))};
  },
  dispose(){world.free();}};
}
