'use strict';
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const clients=document.querySelector('.clients'),clientToggle=clients.querySelector('.motion-toggle');
clientToggle.addEventListener('click',()=>{const paused=clients.classList.toggle('is-paused');clientToggle.setAttribute('aria-pressed',String(paused));clientToggle.textContent=paused?'تشغيل الحركة':'إيقاف الحركة';clientToggle.setAttribute('aria-label',paused?'تشغيل حركة شعارات الشركات':'إيقاف حركة شعارات الشركات')});
const reel=document.querySelector('.work-reel'),reelWindow=reel.querySelector('.reel-window'),track=reel.querySelector('.reel-track'),toggle=reel.querySelector('.reel-toggle');
let paused=false,hovered=false,focused=false,inView=false,lastTime=0,frame=0,manualUntil=0;
const originals=Array.from(track.children);
// An inert second set makes the visual loop seamless without duplicating keyboard stops.
originals.forEach(card=>{const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.querySelectorAll('button,a').forEach(control=>control.tabIndex=-1);clone.addEventListener('click',e=>{if(e.target.closest('.film-trigger'))card.querySelector('.film-trigger').click()});track.append(clone)});
function cycleWidth(){return (originals[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap))*originals.length}
function setPaused(value){paused=value;toggle.textContent=paused?'تشغيل الحركة':'إيقاف الحركة';toggle.setAttribute('aria-pressed',String(paused));schedule()}
toggle.addEventListener('click',()=>setPaused(!paused));
function eligible(){return !paused&&!hovered&&!focused&&inView&&!document.hidden&&!motionPreference.matches&&!document.querySelector('#film-dialog').open}
function tick(now){frame=0;if(eligible()){const step=lastTime?Math.min(now-lastTime,40):0;if(now>manualUntil){reelWindow.scrollLeft+=step*.025;const cycle=cycleWidth();if(cycle>0&&reelWindow.scrollLeft>=cycle)reelWindow.scrollLeft-=cycle}lastTime=now;frame=requestAnimationFrame(tick)}else lastTime=0}
function schedule(){if(eligible()&&!frame){lastTime=0;frame=requestAnimationFrame(tick)}}
reelWindow.addEventListener('mouseenter',()=>{hovered=true});reelWindow.addEventListener('mouseleave',()=>{hovered=false;schedule()});
reel.addEventListener('focusin',()=>{focused=true});reel.addEventListener('focusout',e=>{if(!reel.contains(e.relatedTarget)){focused=false;schedule()}});
function stepReel(direction){manualUntil=performance.now()+5000;const width=originals[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap);const cycle=cycleWidth();if(direction<0&&reelWindow.scrollLeft<1)reelWindow.scrollLeft=cycle;if(direction>0&&reelWindow.scrollLeft+width>=cycle)reelWindow.scrollLeft-=cycle;reelWindow.scrollBy({left:width*direction,behavior:motionPreference.matches?'instant':'smooth'})}
reel.querySelector('.reel-prev').addEventListener('click',()=>stepReel(-1));reel.querySelector('.reel-next').addEventListener('click',()=>stepReel(1));
reelWindow.addEventListener('keydown',e=>{if(e.target!==reelWindow)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();stepReel(e.key==='ArrowRight'?1:-1)}});
reelWindow.addEventListener('pointerdown',()=>{manualUntil=performance.now()+5000});reelWindow.addEventListener('wheel',()=>{manualUntil=performance.now()+5000},{passive:true});
if('IntersectionObserver'in window){new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule()}).observe(reel)}else{inView=true;schedule()}
document.addEventListener('visibilitychange',schedule);document.querySelector('#film-dialog').addEventListener('close',schedule);
function syncMotion(){clientToggle.hidden=motionPreference.matches;toggle.hidden=motionPreference.matches;clients.classList.toggle('is-paused',motionPreference.matches);track.querySelectorAll('[aria-hidden="true"]').forEach(card=>card.hidden=motionPreference.matches);schedule()}
motionPreference.addEventListener('change',syncMotion);syncMotion();

document.querySelectorAll('[data-reel-start]').forEach(link=>link.addEventListener('click',()=>{setPaused(true);reelWindow.scrollLeft=Number(link.dataset.reelStart)*(originals[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap))}));
