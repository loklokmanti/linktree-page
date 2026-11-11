export const beanDefaults={count:805,friction:1,motion:2,fallSpeed:1.15,collisionSpacing:1.3,startingSpacing:1,beanSize:.8,showPouch:true};
export const beanControls=[
 ['', 'count','Bean amount',400,2400,1,''],
 ['', 'beanSize','Bean size',.6,1.5,.05,'×'],
 ['', 'friction','Friction',0,1,.05,''],
 ['', 'motion','Movement',0,2,.05,'×'],
 ['', 'fallSpeed','Fall speed',0,3,.05,'×'],
 ['', 'collisionSpacing','Collision spacing',.75,1.35,.01,'×'],
 ['', 'startingSpacing','Starting spacing',1,1.6,.02,'×']
];
export function mountBeanTuner(settings,{maxCount,onChange,onReset}){
 const host=document.createElement('div');host.id='bean-tuner';
 const root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>
 :host{position:fixed;right:18px;bottom:112px;z-index:10000;font:13px/1.4 system-ui,sans-serif;color:#25231f}
 *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer;border:1px solid #d8d3c8;background:#fffdf7;border-radius:10px;padding:9px 12px;color:inherit}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #a0572c;outline-offset:3px}
 .trigger{background:#25231f;color:#fffdf7;border:0;border-radius:30px;box-shadow:0 4px 20px #0002}section{width:342px;max-width:calc(100vw - 28px);max-height:72vh;overflow:hidden;display:flex;flex-direction:column;background:#fffdf7;border:1px solid #d8d3c8;box-shadow:0 12px 40px #0002;border-radius:18px;margin-bottom:10px;padding:17px}section[hidden]{display:none}
 header{display:flex;justify-content:space-between;align-items:center;gap:12px}h2{font-size:17px;margin:0}header button{padding:3px 9px;font-size:22px}p{color:#777166;margin:8px 0 14px;font-size:12px}h3{font-size:10px;letter-spacing:.13em;text-transform:uppercase;margin:17px 0 10px;color:#8a6b51}
 .controls{overflow:auto;min-height:0;padding-right:5px}header,.actions,.status,section>p{flex-shrink:0}label{display:block;margin:10px 0}.row{display:flex;justify-content:space-between;align-items:center;gap:8px}.value{display:flex;gap:4px;align-items:center;color:#82786b;font-size:11px}input[type=number]{width:68px;text-align:right;border:1px solid #ded8cb;background:white;border-radius:5px;padding:3px;color:#25231f}input[type=range]{width:100%;accent-color:#9b653c;margin:7px 0 0;cursor:pointer}.actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:17px}.copy{background:#25231f;color:white;border-color:#25231f;flex:1}.status{font-size:11px;min-height:16px;margin-top:8px;color:#6b665b}textarea{display:block;width:100%;min-height:125px;font:11px/1.4 monospace;margin-top:8px}textarea[hidden]{display:none}
 </style><section role="dialog" aria-label="Bean tuning" hidden>
 <header><h2>Bean tuning</h2><button type="button" aria-label="Close bean tuning">×</button></header>
 <p>Rigid-body beans · friction, solid contacts and gravity. At 1× collision spacing, colliders match the bean size. Spacing changes repack the pile.</p>
 <div class="controls"></div><div class="actions"><button class="copy" type="button">Copy settings</button><button class="repack" type="button">Repack</button><button class="reset" type="button">Defaults</button></div>
 <div class="status" role="status" aria-live="polite">Settings are saved in this browser.</div><textarea aria-label="Settings to copy" readonly hidden></textarea>
 </section><button class="trigger" type="button" aria-expanded="false">Tune beans</button>`;
 const section=root.querySelector('section'),trigger=root.querySelector('.trigger'),status=root.querySelector('.status'),textarea=root.querySelector('textarea');
 const key='cofbla-bean-tuning-v7-size08';
 const controls=beanControls.map(row=>row[1]==='count'?[...row.slice(0,4),maxCount,...row.slice(5)]:row);
 function clampValue(key,value){const row=controls.find(r=>r[1]===key);return row?Math.max(row[3],Math.min(row[4],Number(value))):undefined;}
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');for(const row of controls){const value=saved?.[row[1]];if(typeof value==='number'&&Number.isFinite(value))settings[row[1]]=clampValue(row[1],value);}if(typeof saved?.showPouch==='boolean')settings.showPouch=saved.showPouch;}catch{}
 let repackTimer;
 const repackNames=new Set(['count','beanSize','collisionSpacing','startingSpacing']);
 function apply(name){
  if(repackNames.has(name)){
   clearTimeout(repackTimer);
   status.textContent='Release the slider to repack…';
   repackTimer=setTimeout(()=>{status.textContent=onChange(name)||'Applied.';},180);
  }else status.textContent=onChange(name)||'Applied live.';
 }
 const inputs=new Map();
 function save(){try{localStorage.setItem(key,JSON.stringify(settings));}catch{}}
 function refresh(){for(const [name,pair] of inputs)for(const input of pair)input.value=String(settings[name]);visibilityInput.checked=settings.showPouch;}
 const area=root.querySelector('.controls');
 for(const [group,name,label,min,max,step,unit] of controls){
  if(group){const heading=document.createElement('h3');heading.textContent=group;area.append(heading);}
  const wrapper=document.createElement('label');wrapper.innerHTML=`<span class="row"><span>${label}</span><span class="value"><input type="number" aria-label="${label}" min="${min}" max="${max}" step="${step}"><span>${unit}</span></span></span><input type="range" aria-label="${label} slider" min="${min}" max="${max}" step="${step}">`;
  const pair=[...wrapper.querySelectorAll('input')];inputs.set(name,pair);
  for(const input of pair)input.addEventListener('input',()=>{if(input.value===''||!Number.isFinite(input.valueAsNumber))return;settings[name]=clampValue(name,input.valueAsNumber);if(step===1)settings[name]=Math.round(settings[name]);refresh();save();apply(name);});
  area.append(wrapper);
 }
 const visibilityLabel=document.createElement('label');visibilityLabel.className='row';
 visibilityLabel.innerHTML='<span>Show pouch</span><input type="checkbox" aria-label="Show pouch">';
 const visibilityInput=visibilityLabel.querySelector('input');visibilityInput.style.accentColor='#9b653c';
 visibilityInput.addEventListener('change',()=>{settings.showPouch=visibilityInput.checked;onChange('showPouch');save();status.textContent=settings.showPouch?'Pouch visible.':'Pouch hidden · collisions and motion remain active.';});
 area.prepend(visibilityLabel);
 function close(){section.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}
 trigger.onclick=()=>{section.hidden=!section.hidden;trigger.setAttribute('aria-expanded',String(!section.hidden));};
 root.querySelector('header button').onclick=close;
 host.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
 root.querySelector('.repack').onclick=()=>{clearTimeout(repackTimer);status.textContent=onReset()||'Pile repacked with your current settings.';};
 root.querySelector('.reset').onclick=()=>{Object.assign(settings,beanDefaults,{count:Math.min(beanDefaults.count,maxCount)});refresh();clearTimeout(repackTimer);onChange('all');save();status.textContent='Defaults restored.';};
 root.querySelector('.copy').onclick=async()=>{
  const text=JSON.stringify({experiment:'frosted-pouch-beans',version:4,engine:'Rapier',settings:{...settings}},null,2);
  textarea.value=text;
  try{await navigator.clipboard.writeText(text);textarea.hidden=true;status.textContent='Copied! Paste these settings into the chat.';}
  catch{textarea.hidden=false;textarea.focus();textarea.select();status.textContent='Select and copy the settings below.';}
 };
 refresh();document.body.append(host);const initialMessage=onChange('all');if(initialMessage)status.textContent=initialMessage;
 return {dispose(){clearTimeout(repackTimer);host.remove();}};
}
