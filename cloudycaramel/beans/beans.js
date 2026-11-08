import * as THREE from './vendor/three.module.js';

// Packed reference mesh decoder. The reference geometry and maps retain their attribution.
async function loadBean(){
 const response=await fetch(new URL('./assets/bean.buf',import.meta.url));if(!response.ok)throw new Error('Bean model unavailable');
 const data=await response.arrayBuffer(),headerSize=new DataView(data).getUint32(0,true);
 const header=JSON.parse(new TextDecoder().decode(new Uint8Array(data,4,headerSize)));
 const types={Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Float32Array};
 const geometry=new THREE.BufferGeometry();let offset=4+headerSize;
 for(const spec of header.attributes){
  const Type=types[spec.storageType],length=(spec.id==='indices'?header.indexCount:header.vertexCount)*spec.componentSize;
  const source=new Type(data.slice(offset,offset+length*Type.BYTES_PER_ELEMENT));let values=source;
  if(spec.needsPack){values=new Float32Array(length);const range=2**(Type.BYTES_PER_ELEMENT*8),bias=spec.storageType.startsWith('Int')?range/2:0;for(let i=0;i<length;i++){const pack=spec.packedComponents[i%spec.componentSize];values[i]=(source[i]+bias)/(range-1)*pack.delta+pack.from;}}
  if(spec.id==='indices')geometry.setIndex(new THREE.BufferAttribute(values,1));else geometry.setAttribute(spec.id,new THREE.BufferAttribute(values,spec.componentSize));
  offset+=length*Type.BYTES_PER_ELEMENT;
 }
 geometry.computeBoundingSphere();return geometry;
}

export async function createCoffeeBeans(container,{count=matchMedia('(max-width:700px)').matches?288:1024}={}){
 const defaults={blurEnabled:false,focus:.75,focusWidth:.07,blurStrength:70,maxBlur:7,edgeProtection:.85,lightStrength:1,specularStrength:.45,glossiness:65,surfaceDetail:.00055,speed:1,pointerForce:1,pointerRadius:.11,beanSize:1};
 const settings={...defaults};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let active=true;
 let paused=false,disposed=false,frame=0,time=0,aspect=1,shaderFailed=false;
 if(reduced.matches)settings.speed=.28;
 const mobile=matchMedia('(max-width:700px)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'default'});
 renderer.debug.onShaderError=()=>{shaderFailed=true;};
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
 container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=null;
 const camera=new THREE.PerspectiveCamera(50,1,.02,4);camera.position.set(0,.12,.45);
 const geometry=await loadBean();const loader=new THREE.TextureLoader();
 const [color,heightMap]=await Promise.all(['bean-color.webp','bean-height.webp'].map(name=>loader.loadAsync(new URL('./assets/'+name,import.meta.url).href)));
 color.colorSpace=THREE.SRGBColorSpace;
 // A small, near-camera point source travels with the pointer. Light fades with distance.
 const movingLight={value:new THREE.Vector3(-.15,.15,-.2)};
 const material=new THREE.ShaderMaterial({uniforms:{skin:{value:color},heightMap:{value:heightMap},lightPosition:movingLight,lightStrength:{value:1},specularStrength:{value:.45},glossiness:{value:65},surfaceDetail:{value:.00055}},vertexShader:`
 attribute float Cd;varying vec2 texcoord;varying vec3 worldPosition,worldNormal;varying float occlusion;
 void main(){texcoord=uv;occlusion=clamp(Cd,.02,1.);vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);worldPosition=world.xyz;worldNormal=normalize(mat3(modelMatrix*instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`
 uniform sampler2D skin,heightMap;uniform vec3 lightPosition;uniform float lightStrength,specularStrength,glossiness,surfaceDetail;varying vec2 texcoord;varying vec3 worldPosition,worldNormal;varying float occlusion;
 void main(){vec3 N=normalize(worldNormal);float height=texture2D(heightMap,texcoord).r;vec3 a=dFdx(worldPosition),b=dFdy(worldPosition);vec3 r1=cross(b,N),r2=cross(N,a);float det=dot(a,r1);N=normalize(abs(det)*N-sign(det)*surfaceDetail*(dFdx(height)*r1+dFdy(height)*r2));
 vec3 L=lightPosition-worldPosition;float distance=length(L);L/=max(distance,.00001);vec3 V=normalize(cameraPosition-worldPosition),H=normalize(L+V);float diffuse=max(dot(N,L),0.);float spec=pow(max(dot(N,H),0.),glossiness);float falloff=1./(30.*distance*distance+.01);vec3 albedo=texture2D(skin,texcoord).rgb;
 vec3 lit=(albedo*diffuse+(albedo*.8+.2)*spec*specularStrength)*falloff*occlusion*lightStrength;lit+=albedo*.007;gl_FragColor=vec4(lit,1.);
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);
 const light=new THREE.PointLight(0xffead7,.085,2,2);scene.add(light);scene.add(new THREE.AmbientLight(0xb7a08e,.035));
 let seed=937;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const start=new THREE.Vector3(-.5,.32,-.3),end=new THREE.Vector3(.5,-.18,-.3),segment=new THREE.Vector3(),tangent=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3();
 let pathLength=1;
 function basis(){segment.subVectors(end,start);pathLength=segment.length();tangent.copy(segment).normalize();u.crossVectors(tangent,new THREE.Vector3(0,0,1)).normalize();v.crossVectors(tangent,u).normalize();}
 basis();
 function path(t,b,out){const a=8*t*pathLength+time*.25,spiral=8*b.frequency*t*pathLength+b.phase;return out.copy(start).addScaledVector(segment,t).addScaledVector(u,.05*Math.sin(a)+b.radius*Math.cos(spiral)).addScaledVector(v,.05*Math.cos(a)+b.radius*Math.sin(spiral));}
 const beans=[],temp=new THREE.Vector3(),delta=new THREE.Vector3(),dummy=new THREE.Object3D(),targetQuat=new THREE.Quaternion(),matrix=new THREE.Matrix4(),axis=new THREE.Vector3(),cross=new THREE.Vector3();
 for(let i=0;i<count;i++){const b={pos:new THREE.Vector3(),velocity:tangent.clone().multiplyScalar(.1),radius:rand()*.1,phase:rand()*Math.PI*2,frequency:rand()*2,orientation:new THREE.Quaternion(),offset:new THREE.Quaternion().setFromEuler(new THREE.Euler(rand()*6.28,rand()*6.28,rand()*6.28)),size:.0095+rand()*.001};path(rand(),b,b.pos);beans.push(b);mesh.setColorAt(i,new THREE.Color().setScalar(.58+rand()*.42));}
 const pointerTarget=new THREE.Vector2(-.42,-.12),pointer=pointerTarget.clone(),pointerWorld=new THREE.Vector3(-.15,.15,-.3),previousMouse=pointerWorld.clone(),mouseImpulse=new THREE.Vector3();let pointerActive=false;
 const ray=new THREE.Raycaster(),mousePlane=new THREE.Plane(new THREE.Vector3(0,0,1),.3);
 function move(e){const r=container.getBoundingClientRect();pointerTarget.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);pointerActive=true;}
 function leave(){pointerActive=false;}
 container.addEventListener('pointermove',move);container.addEventListener('pointerleave',leave);
 // Kept as an optional demo control; hovering alone drives the reference interaction.
 function stir(){if(paused)return;for(const b of beans){delta.subVectors(b.pos,pointerWorld);const d=delta.length();if(d<.25&&d>.001)b.velocity.addScaledVector(delta,.08/d);}}
 const target=new THREE.WebGLRenderTarget(1,1,{depthTexture:new THREE.DepthTexture(1,1),type:THREE.HalfFloatType});
 const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const postMaterial=new THREE.ShaderMaterial({uniforms:{image:{value:target.texture},depth:{value:target.depthTexture},resolution:{value:new THREE.Vector2()},focus:{value:.75},focusWidth:{value:.07},strength:{value:70},maxBlur:{value:7},edgeProtection:{value:.85}},vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position,1.);}`,fragmentShader:`
 uniform sampler2D image,depth;uniform vec2 resolution;uniform float focus,focusWidth,strength,maxBlur,edgeProtection;varying vec2 uv0;
 float distanceAt(vec2 p){float d=texture2D(depth,p).x;return .16/(4.02-(d*2.-1.)*3.98);}
 void main(){float z=distanceAt(uv0);float radius=z>3.9?0.:clamp(max(0.,abs(z-focus)-focusWidth*.5)*strength,0.,maxBlur);vec3 sum=texture2D(image,uv0).rgb*2.;float weight=2.;
 for(int i=0;i<32;i++){float a=float(i)*2.3999632;vec2 off=vec2(cos(a),sin(a))*sqrt((float(i)+.5)/32.)*radius/resolution;vec2 at=clamp(uv0+off,0.,1.);float zs=distanceAt(at);float difference=abs(zs-z);float w=mix(1.,exp(-difference*70.),edgeProtection);if(zs>3.9)w*=1.-edgeProtection;sum+=texture2D(image,at).rgb*w;weight+=w;}
 vec3 col=sum/weight;col*=1.-.12*length(uv0-.5);gl_FragColor=vec4(col,1.);
 #include <colorspace_fragment>
 }`});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial);postScene.add(quad);
 function resize(){const width=container.clientWidth,height=container.clientHeight;aspect=width/height;camera.aspect=aspect;
 // On narrow screens show the same diagonal stream through a wider lens.
 camera.fov=aspect>1.8?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(25))*1.5/aspect)):(aspect<.8?60:50);camera.position.y=aspect>1.8?0:(aspect<.8?.1:.12);camera.updateProjectionMatrix();renderer.setSize(width,height);const size=renderer.getDrawingBufferSize(new THREE.Vector2());target.setSize(size.x,size.y);postMaterial.uniforms.resolution.value.copy(size);}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 // Spatial hashing keeps the soft separation pass near linear at 1024 beans.
 const cell=.014,grid=new Map(),key=(x,y,z)=>`${x},${y},${z}`;
 function separate(){grid.clear();for(let i=0;i<count;i++){const b=beans[i],x=Math.floor(b.pos.x/cell),y=Math.floor(b.pos.y/cell),z=Math.floor(b.pos.z/cell);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const neighbours=grid.get(key(x+dx,y+dy,z+dz));if(!neighbours)continue;for(const j of neighbours){const other=beans[j];delta.subVectors(b.pos,other.pos);const d2=delta.lengthSq();if(d2<cell*cell&&d2>1e-12){const d=Math.sqrt(d2);delta.multiplyScalar((cell-d)*.5/d);b.pos.add(delta);other.pos.sub(delta);}}}const k=key(x,y,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}}
 function step(dt){time+=dt*settings.speed;pointer.lerp(pointerTarget,1-Math.exp(-dt*7));ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(mousePlane,pointerWorld);mouseImpulse.subVectors(pointerWorld,previousMouse).multiplyScalar(Math.exp(-dt*10));previousMouse.copy(pointerWorld);light.position.copy(pointerWorld);light.position.z+=.1;movingLight.value.copy(light.position);
  for(const b of beans){const t=delta.subVectors(b.pos,start).dot(segment)/segment.lengthSq();path(t,b,temp);b.velocity.addScaledVector(delta.subVectors(temp,b.pos),1-Math.exp(-dt*.5));const along=b.velocity.dot(tangent);b.velocity.addScaledVector(tangent,(.1*settings.speed-along)*(1-Math.exp(-dt*2)));b.velocity.multiplyScalar(Math.exp(-dt));b.pos.addScaledVector(b.velocity,dt);const next=delta.subVectors(b.pos,start).dot(segment)/segment.lengthSq();if(next>1)path(0,b,b.pos);else if(next<0)path(1,b,b.pos);
   delta.subVectors(b.pos,pointerWorld);const d=delta.length();if(pointerActive&&d<settings.pointerRadius&&d>.001){b.velocity.addScaledVector(delta,.25*settings.pointerForce*(settings.pointerRadius-d)/d);b.velocity.addScaledVector(mouseImpulse,settings.pointerForce);}
   // Orient by velocity with a fixed random local offset: tumbling follows the stream.
   axis.copy(b.velocity).normalize();cross.crossVectors(axis,new THREE.Vector3(0,0,1)).normalize();temp.crossVectors(cross,axis).normalize();matrix.makeBasis(cross,axis,temp);targetQuat.setFromRotationMatrix(matrix);b.orientation.slerp(targetQuat,1-Math.exp(-dt*35));
 }if(count>400)separate();

 }
 let previous=performance.now();
 function render(now){frame=0;if(disposed||!active||document.hidden)return;const dt=Math.min((now-previous)/1000,.033);previous=now;if(!paused&&!document.hidden)step(dt);else{ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(mousePlane,pointerWorld);light.position.copy(pointerWorld);light.position.z+=.1;movingLight.value.copy(light.position);}
  for(let i=0;i<count;i++){const b=beans[i];dummy.position.copy(b.pos);dummy.quaternion.copy(b.orientation).multiply(b.offset);dummy.scale.setScalar(b.size*settings.beanSize);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;
  material.uniforms.lightStrength.value=settings.lightStrength;material.uniforms.specularStrength.value=settings.specularStrength;material.uniforms.glossiness.value=settings.glossiness;material.uniforms.surfaceDetail.value=settings.surfaceDetail;
  for(const [name,value] of Object.entries({focus:settings.focus,focusWidth:settings.focusWidth,strength:settings.blurStrength,maxBlur:settings.maxBlur,edgeProtection:settings.edgeProtection}))postMaterial.uniforms[name].value=value;
  if(settings.blurEnabled&&settings.maxBlur>0&&settings.blurStrength>0){renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);}
  else{renderer.setRenderTarget(null);renderer.render(scene,camera);}
  if(shaderFailed){container.dispatchEvent(new Event('beanrenderfailure'));setActive(false);return;}
  frame=requestAnimationFrame(render);
 }
 function setActive(value){active=Boolean(value);if(!active&&frame){cancelAnimationFrame(frame);frame=0;}else if(active&&!frame&&!disposed&&!document.hidden){previous=performance.now();frame=requestAnimationFrame(render);}}
 function onVisibilityChange(){if(document.hidden){if(frame){cancelAnimationFrame(frame);frame=0;}}else if(active&&!frame&&!disposed){previous=performance.now();frame=requestAnimationFrame(render);}}
 document.addEventListener('visibilitychange',onVisibilityChange);
 frame=requestAnimationFrame(render);
 return {settings,defaults,setActive,reset(){Object.assign(settings,defaults);},get paused(){return paused;},togglePause(){paused=!paused;return paused;},scatter:stir,dispose(){disposed=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',onVisibilityChange);observer.disconnect();container.removeEventListener('pointermove',move);container.removeEventListener('pointerleave',leave);geometry.dispose();material.dispose();color.dispose();heightMap.dispose();mesh.dispose();target.dispose();postMaterial.dispose();quad.geometry.dispose();renderer.dispose();renderer.domElement.remove();}};
}
