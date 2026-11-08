import {createCoffeeBeans} from './beans.js?v=taste-mobile-20261108a';
import {createBeanStream} from './fallback.js?v=ios-bean-fallback-1';
const stage=document.querySelector('#taste-beans');
const tasteSection=document.querySelector('#taste');
if(stage&&tasteSection){
 let scene=null,loading=false,visible=false,disposed=false,usingFallback=false;
 const rendererFailed=()=>showFallback();
 async function showFallback(){
  if(disposed||usingFallback)return;
  usingFallback=true;
  scene?.dispose();scene=null;
  try{scene=createBeanStream(stage,{count:matchMedia('(max-width:700px)').matches?120:180});scene.setActive(visible);}
  catch(error){console.warn('Taste bean fallback unavailable',error);stage.hidden=true;}
 }
 const observer=new IntersectionObserver(async entries=>{
  visible=entries[0].isIntersecting;
  if(scene){scene.setActive(visible);return;}
  if(!visible||loading||disposed)return;
  loading=true;
  try{
   const mobile=matchMedia('(max-width:700px)').matches;
   const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   if(ios&&typeof WebGL2RenderingContext==='undefined')throw new Error('WebGL2 is unavailable on this device');
   scene=await createCoffeeBeans(stage,{count:mobile?288:1024});
   if(disposed){scene.dispose();return;}
   stage.addEventListener('beanrenderfailure',rendererFailed,{once:true});
   Object.assign(scene.settings,{blurEnabled:false,specularStrength:.35});
   scene.setActive(visible);
   const canvas=stage.querySelector('canvas');
   canvas?.addEventListener('webglcontextlost',event=>{event.preventDefault();showFallback();},{once:true});
  }catch(error){console.warn('Taste bean scene unavailable; using lightweight renderer',error);await showFallback();}
  finally{loading=false;}
 },{threshold:0});
 observer.observe(tasteSection);
 addEventListener('pagehide',event=>{if(event.persisted){scene?.setActive(false);return;}disposed=true;observer.disconnect();stage.removeEventListener('beanrenderfailure',rendererFailed);scene?.dispose();},{once:false});
 addEventListener('pageshow',()=>scene?.setActive(visible));
}
