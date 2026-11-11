// Retry after media readiness and user gestures; expose a play fallback if autoplay is blocked.
const mobile = matchMedia('(max-width:700px)');
const states = [...document.querySelectorAll('.cat-video-card')].map(card => {
  const video = card.querySelector('video');
  const button = card.querySelector('.cat-video-play');
  const state = {card,video,button,visible:false,near:false,lastAttempt:0};
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  const active = () => mobile.matches === card.classList.contains('cat-video-mobile');
  const sync = () => {
    const shouldPlay = mobile.matches || state.visible;
    if (!active() || document.hidden || !shouldPlay) {video.pause();return;}
    if (!video.getAttribute('src') || !video.paused) return;
    state.lastAttempt = performance.now();
    video.muted = true;
    video.play().then(() => {delete video.dataset.playbackError;if (button) button.hidden=true;}).catch(error => {
      video.dataset.playbackError = error.name;
      if (button && error.name !== 'AbortError' && state.visible) button.hidden=false;
    });
  };
  const load = () => {
    if (active() && (mobile.matches || state.near) && !video.getAttribute('src')) {
      video.preload = 'auto';
      video.src = video.dataset.src;
      video.load();
    }
    sync();
  };
  state.sync=sync;state.load=load;
  for (const event of ['loadedmetadata','loadeddata','canplay','canplaythrough']) video.addEventListener(event,sync);
  video.addEventListener('playing',()=>{if (button) button.hidden=true;});
  button?.addEventListener('click',()=>{video.muted=true;video.play().then(()=>{if (button) button.hidden=true;}).catch(()=>{button.hidden=false;});});
  return state;
});
const near = new IntersectionObserver(entries => entries.forEach(entry => {
  const state=states.find(s=>s.card===entry.target);state.near=entry.isIntersecting;state.load();
}),{rootMargin:'1800px 0px'});
const visible = new IntersectionObserver(entries => entries.forEach(entry => {
  const state=states.find(s=>s.card===entry.target);state.visible=entry.isIntersecting;state.sync();
}));
for (const state of states){near.observe(state.card);visible.observe(state.card);}
states.forEach(s=>s.load());
mobile.addEventListener('change',()=>states.forEach(s=>s.load()));
document.addEventListener('visibilitychange',()=>states.forEach(s=>s.sync()));
window.addEventListener('pageshow',()=>states.forEach(s=>s.sync()));
// Retry synchronously inside real touch activation, even if an earlier
// offscreen play request is still unresolved in iPhone WebKit.
for(const event of ['touchstart','touchend','pointerdown','pointerup','click']) document.addEventListener(event,()=>states.forEach(s=>s.sync()),{passive:true,capture:true});
window.addEventListener('scroll',()=>{
 if (!mobile.matches || document.hidden) return;
 const now=performance.now();
 for(const state of states) if(state.video.paused&&now-state.lastAttempt>300)state.sync();
},{passive:true});
window.addEventListener('focus',()=>states.forEach(s=>s.sync()));

// Scroll-driven depth without a continuously running animation loop.
const collage = document.querySelector('.cat-video-section');
const cards = [...document.querySelectorAll('.cat-video-desktop')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const depth = [0.12,0.18,0.08,0.15,0.10,0.17,0.11];
let parallaxFrame = 0;
function drawParallax() {
  parallaxFrame = 0;
  if (mobile.matches || reducedMotion.matches) {
    cards.forEach(card => {card.style.removeProperty('transform');card.querySelector('video').style.removeProperty('transform');});
    return;
  }
  const rect = collage.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight) return;
  const offset = innerHeight / 2 - (rect.top + rect.height / 2);
  cards.forEach((card,index) => {
    const y = Math.max(-70,Math.min(70,offset * depth[index]));
    card.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    const progress=Math.max(-1,Math.min(1,offset/((innerHeight+rect.height)/2)));
    const innerY=-progress*(5+(index%3));
    card.querySelector('video').style.transform=`translate3d(0,${innerY.toFixed(3)}%,0)`;
  });
}
function queueParallax() {
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(drawParallax);
}
window.addEventListener('scroll',queueParallax,{passive:true});
window.addEventListener('resize',queueParallax,{passive:true});
reducedMotion.addEventListener('change',queueParallax);
mobile.addEventListener('change',queueParallax);
queueParallax();
