import * as THREE from '../beans/vendor/three.module.js';

export function convexHull(points){
 const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(sorted.length<3)return sorted;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const lower=[],upper=[];
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(let i=sorted.length-1;i>=0;i--){const p=sorted[i];while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 lower.pop();upper.pop();return lower.concat(upper);
}

// CSS can sample the page behind the canvas; WebGL transmission cannot.
// Project the bag outline only when its pose or camera changes, not per bean.
export function createPouchBackdrop(viewer){
 const canvas=viewer.renderer.domElement,parent=canvas.parentElement;
 const layer=document.createElement('div');layer.className='pouch-page-frost';layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'0',backdropFilter:'blur(9px)',webkitBackdropFilter:'blur(9px)',clipPath:'polygon(0 0,0 0,0 0)'});
 canvas.style.position='relative';canvas.style.zIndex='1';parent.prepend(layer);
 const points=[],local=new THREE.Vector3(),inverse=viewer.model.matrixWorld.clone().invert();
 viewer.model.updateMatrixWorld(true);
 viewer.model.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||(!mesh.visible&&!mesh.userData.pouchOriginalVisible)||/sticker|label|paper|valve/i.test(mesh.name))return;
  const vertices=mesh.geometry.attributes.position,index=mesh.geometry.index;
  const edges=new Map();
  if(index){
   for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
    for(const [u,v] of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)*vertices.count+Math.max(u,v);edges.set(key,(edges.get(key)||0)+1);}
   }
  }
  const boundary=new Set();
  for(const [key,count] of edges)if(count===1){boundary.add(Math.floor(key/vertices.count));boundary.add(key%vertices.count);}
  // Closed accessory meshes have no boundary; they do not define the bag outline.
  if(!boundary.size)return;
  const matrix=inverse.clone().multiply(mesh.matrixWorld);
  for(const i of boundary){local.fromBufferAttribute(vertices,i).applyMatrix4(matrix);points.push(local.clone());}
 });
 let previous='';
 function update(){
  layer.hidden=viewer.model.userData.showPouch===false;
  if(layer.hidden)return;
  viewer.camera.updateMatrixWorld(true);viewer.model.updateMatrixWorld(true);
  const width=parent.clientWidth,height=parent.clientHeight;
  const signature=[width,height,...viewer.camera.matrixWorld.elements,...viewer.camera.projectionMatrix.elements,...viewer.model.matrixWorld.elements].join(',');
  if(signature===previous)return;previous=signature;
  const projected=points.map(p=>{local.copy(p).applyMatrix4(viewer.model.matrixWorld).project(viewer.camera);return [(local.x*.5+.5)*width,(-local.y*.5+.5)*height];});
  const hull=convexHull(projected);
  if(hull.length<3){layer.style.clipPath='polygon(0 0,0 0,0 0)';return;}
  const cx=hull.reduce((sum,p)=>sum+p[0],0)/hull.length,cy=hull.reduce((sum,p)=>sum+p[1],0)/hull.length;
  layer.style.clipPath='polygon('+hull.map(([x,y])=>{const d=Math.hypot(x-cx,y-cy)||1;return `${(x-(x-cx)/d*.6).toFixed(2)}px ${(y-(y-cy)/d*.6).toFixed(2)}px`;}).join(',')+')';
 }
 update();return {update,dispose(){layer.remove();}};
}
