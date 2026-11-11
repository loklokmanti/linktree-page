import * as THREE from '../beans/vendor/three.module.js';

export const pouchBeanReference={size:new THREE.Vector3(.9034980535507202,2,1.5125826597213745),radius:1.0281157879734024};

// Spend vertices around the split on the flat face, not evenly around a pill.
// The back stays rounded; one end is a little fuller than the other.
export function createPouchBeanGeometry(){
 const angles=[-Math.PI,-2*Math.PI/3,-Math.PI/2,-Math.PI/3,-.14,0,.14,Math.PI/3,Math.PI/2,2*Math.PI/3];
 const rows=5,columns=angles.length,positions=[],colors=[],indices=[];
 for(let row=0;row<=rows;row++){
  const theta=row/rows*Math.PI,y=Math.cos(theta),ring=Math.sin(theta),fullness=1+.07*y-.03*y*y;
  for(const angle of angles){
   const front=Math.max(0,Math.cos(angle));
   const crease=Math.exp(-((angle/.115)**2));
   let x=Math.cos(angle)*ring*.451749*fullness;
   if(front>0)x=x*.88-.22*crease*ring**1.4;
   const z=(Math.sin(angle)+.11*Math.sin(y*3)*front**4)*ring*.756291*fullness;
   positions.push(x,y,z);
   const shade=(1-.5*crease*ring)*(.96+.04*y);
   colors.push(shade,shade,shade);
  }
 }
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*columns+col,b=row*columns+(col+1)%columns,c=(row+1)*columns+col,d=(row+1)*columns+(col+1)%columns;
  if(row>0)indices.push(a,b,c);
  if(row<rows-1)indices.push(b,d,c);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeBoundingBox();
 const size=geometry.boundingBox.getSize(new THREE.Vector3());geometry.center();
 geometry.scale(pouchBeanReference.size.x/size.x,pouchBeanReference.size.y/size.y,pouchBeanReference.size.z/size.z);
 geometry.rotateY(Math.PI);
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return geometry;
}

// Keep the inexpensive convex collision proxy independent of visual detail.
export function createPouchBeanCollisionGeometry(){
 const geometry=new THREE.SphereGeometry(1,6,4);
 geometry.scale(pouchBeanReference.size.x/2,1,pouchBeanReference.size.z/(2*Math.sin(Math.PI/3)));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
