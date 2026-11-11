// Frame cadence is not GPU timing. Measure raw RAF intervals before simulation clamps.
export function mountPerformanceMeter(){
 if(typeof document.createElement!=='function')return {sample(){},dispose(){}};
 const host=document.createElement('div');host.id='pouch-performance';
 const root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>:host{position:fixed;left:12px;top:max(12px,env(safe-area-inset-top));z-index:10001;pointer-events:none}div{padding:7px 10px;border-radius:9px;background:#25231fe8;color:#fffdf7;font:11px/1.5 ui-monospace,monospace;white-space:pre;font-variant-numeric:tabular-nums}strong{color:#bce4ab;font-weight:600}</style><div aria-label="Live performance" title="Frame cadence, raw frame interval, 95th percentile interval, and bean simulation CPU time. Not GPU timing."><strong>Measuring…</strong></div>`;
 document.body.append(host);const output=root.querySelector('div');
 let previous=0,start=0,intervals=[],cpuTotal=0;
 function reset(){previous=0;start=0;intervals.length=0;cpuTotal=0;}
 document.addEventListener('visibilitychange',reset);
 return {sample(now,cpu,active){
  if(document.hidden){reset();return;}
  if(!previous){previous=now;start=now;return;}
  const delta=now-previous;previous=now;if(delta<=0)return;
  intervals.push(delta);cpuTotal+=cpu;
  if(now-start<1000)return;
  const mean=intervals.reduce((a,b)=>a+b,0)/intervals.length;
  const sorted=intervals.slice().sort((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1];
  const fps=1000/mean;
  output.innerHTML=`<strong>${fps.toFixed(0)} FPS</strong> · ${mean.toFixed(1)} ms\nP95 ${p95.toFixed(1)} ms · Beans ${(cpuTotal/intervals.length).toFixed(1)} ms\n${active?'Pouch active':'Pouch offscreen'}`;
  output.querySelector('strong').style.color=fps>=50?'#bce4ab':fps>=30?'#f1d58a':'#ffaaa0';
  intervals.length=0;cpuTotal=0;start=now;
 },dispose(){document.removeEventListener('visibilitychange',reset);host.remove();}};
}
