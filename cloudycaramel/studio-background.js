// Studio lighting with colour tuning.
const defaults={strength:60,height:56,archWidth:96,archHeight:39,lightY:58,brightness:100,grain:8,topColor:"#61432f",spotColor:"#ffffff",baseColor:"#f4f0ec"};
const settings={...defaults},key="cofbla-studio-background-v4-hex";
const definitions=[["strength","Top shading",0,80,1,"%"],["height","Fade distance",25,140,1,"vh"],["archWidth","Arch width",40,180,1,"vw"],["archHeight","Arch height",20,100,1,"vh"],["lightY","Light position",20,100,1,"vh"],["brightness","Center brightness",0,100,1,"%"],["grain","Grain",0,12,.1,"%"]];
const validHex=value=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value);
try{const saved=JSON.parse(localStorage.getItem(key));for(const [name,,min,max] of definitions)if(Number.isFinite(saved?.[name]))settings[name]=Math.max(min,Math.min(max,saved[name]));for(const name of ["topColor","spotColor","baseColor"])if(validHex(saved?.[name]))settings[name]=saved[name];}catch{}
settings.grain=8;
const light=document.createElement('div');light.className='studio-arch';light.setAttribute('aria-hidden','true');
const noise=document.createElement('div');noise.className='studio-grain';noise.setAttribute('aria-hidden','true');document.querySelector('main').prepend(light);document.body.append(noise);
// Generate a small static texture once; no filter or animation on scroll.
const tile=document.createElement('canvas');tile.width=tile.height=256;const ctx=tile.getContext('2d'),pixels=ctx.createImageData(256,256);let seed=821;
for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed>>>24;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);noise.style.backgroundImage=`url(${tile.toDataURL()})`;
function apply(){
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(",");
 const top=rgb(settings.topColor),spot=rgb(settings.spotColor);
 document.documentElement.style.setProperty("--studio-base",settings.baseColor);
 light.style.height=Math.max(settings.height,settings.lightY+settings.archHeight)+'vh';
 light.style.background=`radial-gradient(ellipse ${settings.archWidth/2}vw ${settings.archHeight}vh at 50% ${settings.lightY}vh, rgba(${spot},${settings.brightness/100}) 0%, rgba(${spot},${settings.brightness/140}) 32%, transparent 100%), linear-gradient(to bottom, rgba(${top},${settings.strength/100}) 0vh, rgba(${top},${settings.strength/200}) ${settings.height*.35}vh, transparent ${settings.height}vh)`;
 noise.style.opacity=settings.grain/100;
}
apply();
