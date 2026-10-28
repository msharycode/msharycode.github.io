const $ = id => document.getElementById(id);
const normalize = text => String(text).toLowerCase().normalize('NFKC').replace(/[أإآ]/g,'ا').replace(/[\u064B-\u065F\u0670ـ]/g,'').trim();
let saved = new Set(), mode = 'grid', activeFilter = 'all', activeResource = null, lastOpener = null, toastTimer, draftMessage = '';
try {
  const raw = JSON.parse(localStorage.getItem('mshary:saved') || '[]');
  if (Array.isArray(raw)) saved = new Set(raw.filter(id => items.some(item => item.id === id)));
  if (localStorage.getItem('mshary:view') === 'list') mode = 'list';
} catch {}
function persist(key, value) { try { localStorage.setItem(key, value); } catch {} }
function cover(item) {
  if (item.coverLabel) return '<span class="library-cover-word" dir="ltr">' + item.coverLabel + '</span><span class="cover-tag mono">' + item.tag + '</span>';
  if (item.cover === 'tool') return '<img src="assets/tool-preview.jpg" alt="واجهة جهّز صورتك" loading="lazy" width="1348" height="926">';
  if (item.cover === 'apple') return '<div class="apple-cover" aria-hidden="true">Design.<small>WITH PURPOSE</small></div><span class="cover-tag mono">APPLE HIG</span>';
  if (item.type === 'prompt') return '<div class="prompt-lines" aria-hidden="true"><strong>' + (item.id === 'build-prompt' ? '&gt; build_' : '&gt; review_') + '</strong><span></span><span></span><span></span></div><span class="cover-tag mono">' + item.tag + '</span>';
  if (item.type === 'repo') return '<svg class="icon large-icon" aria-hidden="true"><use href="#code"/></svg><span class="cover-decoration" aria-hidden="true">&lt;/&gt;</span><span class="cover-tag mono">' + item.tag + '</span>';
  return '<span class="cover-word" aria-hidden="true">' + (item.id === 'build-note' ? 'من فكرة.' : 'JPG?') + '</span><span class="cover-tag mono">' + item.tag + '</span>';
}
function render() {
  const query = normalize($('search').value);
  const filtered = items.filter(item => {
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'saved' ? saved.has(item.id) : (item.types || [item.type]).includes(activeFilter));
    const haystack = normalize([item.title, item.subtitle || '', item.description, item.category, item.tag || '', item.searchTerms || ''].join(' '));
    return matchesFilter && query.split(/\s+/).every(part => haystack.split(/\s+/).some(word => word.startsWith(part)));
  });
  $('resources').className = 'resource-grid' + (mode === 'list' ? ' list' : '');
  $('grid-view').setAttribute('aria-pressed', String(mode === 'grid'));
  $('list-view').setAttribute('aria-pressed', String(mode === 'list'));
  $('all-count').textContent = items.length.toLocaleString('ar-SA');
  $('saved-count').textContent = saved.size.toLocaleString('ar-SA');
  $('result-count').textContent = filtered.length.toLocaleString('ar-SA') + ' موارد' + (query ? ' تطابق بحثك' : ' للاستكشاف');
  $('clear-search').hidden = !query;
  if (revealObserver) $('resources').querySelectorAll('.resource').forEach(node => revealObserver.unobserve(node));
  $('resources').innerHTML = filtered.map(item => '<article class="resource" id="card-' + item.id + '"><div class="resource-cover ' + item.cover + '">' + cover(item) + '</div><div class="resource-body"><div class="resource-meta"><span>' + item.category + '</span><span class="badge">' + item.badge + '</span></div><h3>' + item.title + '</h3>' + (item.subtitle ? '<span class="resource-subtitle">' + item.subtitle + '</span>' : '') + '<p>' + item.description + '</p><div class="resource-footer">' + (item.direct ? '<a class="resource-action" href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + item.action + '<span aria-hidden="true">↖</span></a>' : '<button class="resource-action" data-open="' + item.id + '">' + item.action + '<span aria-hidden="true">↖</span></button>') + '<button class="save" data-save="' + item.id + '" aria-label="' + (saved.has(item.id) ? 'إلغاء حفظ ' : 'حفظ ') + item.title + '" aria-pressed="' + saved.has(item.id) + '"><svg class="icon" aria-hidden="true"><use href="#bookmark"/></svg></button></div></div></article>').join('');
  observeMotion($('resources'));
  $('empty').hidden = filtered.length > 0;
  if (!filtered.length) {
    let title = 'ما لقينا نتيجة', text = 'جرّب كلمة ثانية، أو غيّر التصنيف وشوف الموارد المتاحة.';
    if (!query && activeFilter === 'saved') { title = 'احفظ اللي ودّك ترجع له'; text = 'اضغط علامة الحفظ بجانب المورد، وتلقاه هنا على هذا الجهاز.'; }
    if (!query && activeFilter === 'recommendation') { title = 'الترشيح يبدأ بالتجربة'; text = 'تُضاف هنا الأدوات والمنتجات التي أرشّحها. وروابط العمولة، عند وجودها، تحمل توضيحًا مباشرًا بجانبها.'; }
    if (!query && activeFilter === 'news') { title = 'للجديد اللي يستحق وقتك'; text = 'تجد تحديثاتي وتجارب الذكاء الاصطناعي على TikTok. وتُضاف الروابط والشروحات هنا مع نشرها.'; }
    $('empty-title').textContent = title;
    $('empty-text').textContent = text;
  }
}
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2800);
}
function selectFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  render();
  animateResourceChange();
}
function resetSearch() { $('search').value = ''; selectFilter('all'); }
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter)));
$('search').addEventListener('input', render);
$('reset-search').addEventListener('click', resetSearch);
$('clear-search').addEventListener('click', () => { $('search').value = ''; render(); $('search').focus(); });
for (const view of ['grid', 'list']) $('' + view + '-view').addEventListener('click', () => {
  mode = view;
  persist('mshary:view', mode);
  render();
  animateResourceChange();
});
$('resources').addEventListener('click', event => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save, wasSaved = saved.has(id);
    if (wasSaved) saved.delete(id); else saved.add(id);
    persist('mshary:saved', JSON.stringify([...saved]));
    render();
    const replacement = document.querySelector('[data-save="' + id + '"]');
    (replacement || document.querySelector('[data-filter="saved"]')).focus({preventScroll:true});
    if (!wasSaved && replacement) replacement.classList.add('save-pop');
    toast(wasSaved ? 'أُزيل من المحفوظة' : 'حُفظ على هذا الجهاز');
    return;
  }
  const openButton = event.target.closest('[data-open]');
  if (openButton) openResource(openButton.dataset.open);
});
function openResource(id, updateHash = true) {
  const item = items.find(item => item.id === id);
  if (!item || item.direct) return;
  activeResource = item;
  lastOpener = document.activeElement;
  $('dialog-type').textContent = item.category + ' · ' + item.badge;
  $('dialog-title').textContent = item.title;
  $('dialog-description').textContent = item.description;
  $('dialog-status').textContent = '';
  $('dialog-body').replaceChildren();
  $('dialog-actions').replaceChildren();
  if (item.body) {
    const article = document.createElement('div');
    article.className = 'dialog-article';
    article.innerHTML = item.body;
    $('dialog-body').append(article);
  }
  $('dialog-prompt').hidden = !item.prompt;
  $('prompt-heading').textContent = item.type === 'repo' ? 'برومبت الاستخدام — جاهز للنسخ' : 'البرومبت';
  $('prompt-text').textContent = item.prompt || '';
  if (item.prompt) {
    const button = document.createElement('button');
    button.className = 'button primary';
    button.textContent = item.type === 'repo' ? 'انسخ برومبت الاستخدام' : 'انسخ البرومبت';
    button.addEventListener('click', async () => {
      try { await copyText(item.prompt); button.textContent = 'تم النسخ ✓'; $('dialog-status').textContent = 'نُسخ البرومبت. عدّل الحقول بين الأقواس لمشروعك.'; }
      catch { $('dialog-status').textContent = 'تعذر النسخ التلقائي. يمكنك تحديد نص البرومبت ونسخه يدويًا.'; $('prompt-text').focus(); }
    });
    $('dialog-actions').append(button);
  }
  if (item.url) {
    const link = document.createElement('a');
    link.className = 'button outline'; link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = (item.sourceLabel || 'افتح المصدر') + ' ↖';
    $('dialog-actions').append(link);
  }
  if (item.docsUrl) {
    const docs = document.createElement('a');
    docs.className = 'button outline'; docs.href = item.docsUrl; docs.target = '_blank'; docs.rel = 'noopener noreferrer';
    docs.textContent = 'دليل الاستخدام ↖';
    $('dialog-actions').append(docs);
  }
  if (!$('resource-dialog').open) $('resource-dialog').showModal();
  if (updateHash) history.replaceState(null, '', '#resource=' + encodeURIComponent(id));
}
$('resource-dialog').querySelector('.close-dialog').addEventListener('click', () => $('resource-dialog').close());
$('resource-dialog').addEventListener('click', event => {
  if (event.target === $('resource-dialog')) {
    const bounds = $('resource-dialog').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('resource-dialog').close();
  }
});
$('resource-dialog').addEventListener('close', () => {
  if (location.hash.startsWith('#resource=')) history.replaceState(null, '', '#library');
  if (lastOpener && lastOpener.isConnected) lastOpener.focus({preventScroll:true});
  activeResource = null;
});
$('share-resource').addEventListener('click', async () => {
  if (!activeResource) return;
  const url = new URL(location.href); url.hash = 'resource=' + encodeURIComponent(activeResource.id);
  try { await copyText(url.href); $('dialog-status').textContent = 'نُسخ رابط المورد، ويمكن مشاركته مباشرة.'; }
  catch { $('dialog-status').textContent = 'انسخ رابط المورد من شريط العنوان.'; }
});
function handleHash() {
  if (location.hash.startsWith('#resource=')) {
    let id; try { id = decodeURIComponent(location.hash.slice(10)); } catch { return; }
    openResource(id, false);
  } else if (location.hash === '#restaurant-details') {
    $('restaurant-details').open = true;
  }
}
window.addEventListener('hashchange', handleHash);
document.querySelectorAll('a[href="#restaurant-details"]').forEach(link => link.addEventListener('click', () => { $('restaurant-details').open = true; }));
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  const radio = document.querySelector('input[name="service"][value="' + link.dataset.service + '"]');
  if (radio) radio.checked = true;
  $('brief-result').hidden = true;
}));
$('project-form').addEventListener('submit', event => {
  event.preventDefault();
  const brief = $('project-brief').value.trim();
  if (!brief) { $('project-brief').setCustomValidity('اكتب نبذة قصيرة عن الفكرة.'); $('project-brief').reportValidity(); return; }
  const service = document.querySelector('input[name="service"]:checked').value;
  draftMessage = 'مرحبًا مشاري،\n\nأحتاج: ' + service + '\n\nعن المشروع:\n' + brief + '\n\nخلّنا نتكلم عن التفاصيل والخطوة الأولى.';
  $('brief-preview').textContent = draftMessage;
  $('mail-draft-link').href = 'mailto:mshary.code@gmail.com?subject=' + encodeURIComponent('مشروع جديد — ' + service) + '&body=' + encodeURIComponent(draftMessage);
  $('brief-result').hidden = false;
  $('copy-brief').textContent = 'انسخ الرسالة';
  $('mail-draft-link').focus();
});
$('project-brief').addEventListener('input', () => { $('project-brief').setCustomValidity(''); $('brief-result').hidden = true; });
document.querySelectorAll('input[name="service"]').forEach(input => input.addEventListener('change', () => { $('brief-result').hidden = true; }));
$('copy-brief').addEventListener('click', async () => {
  try { await copyText(draftMessage); $('copy-brief').textContent = 'تم النسخ ✓'; toast('نُسخت رسالة المشروع'); }
  catch { toast('يمكنك تحديد الرسالة ونسخها يدويًا.'); }
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault(); $('search').focus();
  }
});
let scrollQueued = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('reading-progress').style.width = (max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0) + '%';
  document.querySelector('.header').classList.toggle('is-scrolled', window.scrollY > 12);
  if (window.scrollY < 80) document.querySelectorAll('.header nav a[aria-current]').forEach(link => link.removeAttribute('aria-current'));
  scrollQueued = false;
}
window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); } }, {passive:true});
window.addEventListener('resize', updateProgress);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.header nav a').forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin:'-90px 0px -60% 0px', threshold:0});
  ['services','work','library'].forEach(id => observer.observe($(id)));
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(text); return; } catch {} }
  const previous = document.activeElement;
  const textarea = document.createElement('textarea'); textarea.value = text; textarea.setAttribute('readonly','');
  textarea.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;';
  const host = $('resource-dialog').open ? $('resource-dialog') : document.body;
  host.append(textarea); textarea.select(); textarea.setSelectionRange(0,text.length);
  let success = false;
  try { success = document.execCommand('copy'); } finally { textarea.remove(); previous?.focus({preventScroll:true}); }
  if (!success) throw new Error('Copy unavailable');
}
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver = null, resourceAnimation = null;
const seenMotion = new Set();
function observeMotion(root = document) {
  if (!revealObserver || motionPreference.matches) return;
  root.querySelectorAll('.section-heading, .service, .project, #about, .contact-inner, .resource').forEach(node => {
    if (node.dataset.motionObserved || (node.id && seenMotion.has(node.id))) return;
    node.dataset.motionObserved = 'true';
    revealObserver.observe(node);
  });
}
function setupMotion() {
  revealObserver?.disconnect();
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      revealObserver.unobserve(node);
      if (node.id) seenMotion.add(node.id);
      if (node.getBoundingClientRect().bottom <= 0) return;
      node.classList.add('motion-reveal');
      node.addEventListener('animationend', () => node.classList.remove('motion-reveal'), {once:true});
    });
  }, {threshold:0, rootMargin:'0px 0px -20px 0px'});
  observeMotion();
}
function animateResourceChange() {
  if (motionPreference.matches || !Element.prototype.animate) return;
  resourceAnimation?.cancel();
  resourceAnimation = $('resources').animate([{opacity:.7}, {opacity:1}], {duration:180, easing:'ease-out'});
}
motionPreference.addEventListener('change', () => {
  resourceAnimation?.cancel();
  document.querySelectorAll('.motion-reveal, .save-pop').forEach(node => {
    node.classList.remove('motion-reveal','save-pop');
  });
  document.querySelectorAll('[data-motion-observed]').forEach(node => delete node.dataset.motionObserved);
  setupMotion();
});
setupMotion(); render(); handleHash(); updateProgress();
