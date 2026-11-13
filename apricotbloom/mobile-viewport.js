// Freeze scroll-scene geometry while mobile browser chrome expands/collapses.
// Genuine width/orientation changes still rebuild the layout.
(()=>{
 const root=document.documentElement;
 let width=0,height=0;
 function update(){
  const nextWidth=root.clientWidth||innerWidth;
  if(nextWidth<=700&&nextWidth===width&&height)return;
  width=nextWidth;
  if(width<=700){
   const probe=document.createElement('div');
   probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;height:100svh;width:0';
   root.append(probe);
   const smallHeight=probe.getBoundingClientRect().height;
   probe.remove();
   height=Math.round(Math.min(innerHeight,smallHeight||innerHeight));
   root.style.setProperty('--scroll-vh',`${height/100}px`);
  }else{height=innerHeight;root.style.removeProperty('--scroll-vh');}
  dispatchEvent(new Event('cofbla:layoutresize'));
 }
 window.cofblaViewport={get height(){return height},get width(){return width}};
 update();
 addEventListener('resize',update,{passive:true});
})();
