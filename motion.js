(() => {
'use strict';
const steps = window.MOTION_STEPS;
const root = document.getElementById('motion');
if (!root || !Array.isArray(steps) || !steps.length) return;
const get = id => document.getElementById(id);
const key = 'mshary:motion:v1';
let done = new Set(), active = 0, resetUntil = 0;
try { const saved = JSON.parse(localStorage.getItem(key) || '{}'); done = new Set(Array.isArray(saved.done) ? saved.done.filter(x => steps.some(s => s.id === x)) : []); active = Math.max(0, steps.findIndex(s => s.id === saved.active)); } catch {}
const e = str => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist() { try { localStorage.setItem(key, JSON.stringify({done:[...done],active:steps[active].id})); } catch { get('motion-status').textContent='الحفظ غير متاح في هذا المتصفح؛ تقدر تكمل المسار خلال الزيارة.'; } }
function updateProgress() {
 get('motion-progress-label').textContent = done.size.toLocaleString('ar-SA') + ' من ٦ خطوات مكتملة';
 const bar = root.querySelector('[role="progressbar"]'); bar.setAttribute('aria-valuenow', String(done.size)); bar.querySelector('span').style.width = (done.size / steps.length * 100) + '%';
}
function drawRoute() {
 get('motion-route').innerHTML=steps.map((s,i)=>`<button type="button" class="motion-stop ${done.has(s.id)?'completed':''}" data-motion-step="${i}" ${active===i?'aria-current="step"':''} aria-controls="motion-panel"><span class="motion-stop-number">${done.has(s.id)?'✓':String(i+1).padStart(2,'0')}</span><span class="motion-stop-copy"><strong>${e(s.title)}</strong><small>${e(s.tool)}</small></span><span class="motion-stop-arrow" aria-hidden="true">↙</span></button>`).join('');
 updateProgress();
}
function drawPanel() {
 const s=steps[active],panel=get('motion-panel');
 panel.innerHTML=`<div class="motion-panel-top"><span>الخطوة ${String(active+1).padStart(2,'0')} من 06</span><span class="motion-tool">${e(s.tool)}</span></div><h3 id="motion-step-title" tabindex="-1">${e(s.title)}</h3><p class="motion-step-summary">${e(s.summary)}</p><p class="motion-step-body">${e(s.body)}</p><div class="motion-outcome"><span aria-hidden="true">↳</span> بيطلع معك: ${e(s.result)}</div><div class="motion-prompt-label"><strong>البرومبت الجاهز</strong><button type="button" class="motion-copy" id="motion-copy">انسخ البرومبت <span aria-hidden="true">⧉</span></button></div><pre class="motion-prompt" id="motion-prompt" tabindex="0" aria-label="نص البرومبت">${e(s.prompt)}</pre><div class="motion-panel-actions"><a class="motion-tool-link" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.link)} ↗</a><button type="button" class="motion-next-button" id="motion-share">انسخ رابط الخطوة ↗</button></div><div class="motion-next"><label class="motion-check"><input type="checkbox" id="motion-complete" ${done.has(s.id)?'checked':''}><span>خلصت هالخطوة</span></label><button type="button" class="motion-next-button" id="motion-next">${active===steps.length-1?'أكملت المسار ✓':'خلصت، للخطوة التالية ←'}</button></div>`;
 if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && panel.animate) panel.animate([{opacity:.65,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}
function openStep(index,changeURL=true,focus=false) {
 active=index; drawRoute();drawPanel();persist();
 if(changeURL) history.replaceState(null,'','#motion-step='+steps[active].id);
 if(focus) get('motion-step-title').focus({preventScroll:true});
}
async function copy(text) {
 if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}
 const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;top:0;left:-9999px';document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('copy');
}
get('motion-route').addEventListener('click',event=>{const b=event.target.closest('[data-motion-step]');if(b)openStep(Number(b.dataset.motionStep));});
get('motion-panel').addEventListener('change',event=>{if(event.target.id!=='motion-complete')return; const id=steps[active].id;event.target.checked?done.add(id):done.delete(id);drawRoute();persist();get('motion-status').textContent=event.target.checked?'حُفظ إنجاز الخطوة.':'أُزيلت علامة الإنجاز.';});
get('motion-panel').addEventListener('click',async event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.id==='motion-copy') {try{await copy(steps[active].prompt);b.textContent='تم النسخ ✓';b.classList.add('copied');get('motion-status').textContent='تم النسخ. غيّر اللي بين الأقواس على حسب فكرتك.';}catch{get('motion-status').textContent='تعذر النسخ التلقائي. حدّد النص وانسخه يدويًا.';get('motion-prompt').focus();}}
 if(b.id==='motion-share'){const url=new URL(location.href);url.hash='motion-step='+steps[active].id;try{await copy(url.href);get('motion-status').textContent='نُسخ رابط هذه الخطوة.';}catch{get('motion-status').textContent='انسخ الرابط من شريط العنوان.';}}
 if(b.id==='motion-next'){done.add(steps[active].id);if(active<steps.length-1)openStep(active+1,true,true);else{drawRoute();drawPanel();persist();get('motion-status').textContent='اكتمل المسار. افتح الفيديو على جوالك وراجع الصورة والصوت قبل النشر.';}}
});
get('motion-reset').addEventListener('click',()=>{const b=get('motion-reset');if(done.size&&Date.now()>resetUntil){resetUntil=Date.now()+5000;b.textContent='اضغط مرة ثانية لمسح التقدم';b.classList.add('motion-reset-pending');setTimeout(()=>{if(Date.now()>=resetUntil){b.textContent='ابدأ من جديد';b.classList.remove('motion-reset-pending');}},5100);return;} done.clear();resetUntil=0;b.textContent='ابدأ من جديد';b.classList.remove('motion-reset-pending');openStep(0);get('motion-status').textContent='بدأت المسار من جديد.';});
function fromHash(){if(!location.hash.startsWith('#motion-step='))return;const i=steps.findIndex(s=>s.id===location.hash.slice(13));if(i<0)return;openStep(i,false);if(!document.body.classList.contains('motion-standalone'))root.scrollIntoView({behavior:'instant',block:'start'});}
window.addEventListener('hashchange',fromHash);drawRoute();drawPanel();fromHash();
})();
