export const preorderOpen=Date.parse('2026-11-14T19:00:00+01:00');
export const preorderClose=Date.parse('2026-11-21T19:00:00+01:00');
export const shippingEstimate=Date.parse('2026-12-05T19:00:00+01:00');
export function timelineState(now){
 const progress=(start,end)=>Math.max(0,Math.min(1,(now-start)/(end-start)));
 if(now<preorderOpen){const hours=Math.max(0,Math.ceil((preorderOpen-now)/3600000));return {phase:0,fill:1,countdown:`${Math.floor(hours/24)}d ${hours%24}h`,status:'Counting down to pre-orders.'};}
 if(now<preorderClose)return {phase:1,fill:progress(preorderOpen,preorderClose),countdown:'Complete',status:'Pre-orders are open.'};
 return {phase:2,fill:progress(preorderClose,shippingEstimate),countdown:'Complete',status:'Estimated roasting and shipping window.'};
}
const timeline=document.querySelector('.release-timeline');
if(timeline){
 const stages=[...timeline.querySelectorAll('.release-stage')],countdown=timeline.querySelector('[data-release-countdown]');
 function update(){
  const state=timelineState(Date.now());
  countdown.textContent=state.countdown;timeline.setAttribute('aria-label',`Release schedule. ${state.status}`);
  stages.forEach((stage,index)=>{if(index===state.phase)stage.setAttribute('aria-current','step');else stage.removeAttribute('aria-current');stage.style.setProperty('--release-fill',`${state.fill*100}%`);});
 }
 update();setInterval(()=>{if(!document.hidden)update()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
}
