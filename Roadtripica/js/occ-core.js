/* Occultica app shell, part 1: state, UI (tabs, sheets, toast, actions, data-bind), database, menu, start.
   One global: OA. Apps register tabs with OA.tab({id,label,icon,render(el)}) and call nothing else to start: the build adds OA.start().
   Conventions:
     OA.S           the saved state (localStorage). Change it, then OA.save() / OA.saveSoon(). OA.defaults({...}) merges starting values.
     data-act="name" on any element calls OA.acts.name(el, event). Register with OA.act('name', fn) or OA.act({a(){}, b(){}}).
     data-bind="a.b.c" on input/select/textarea keeps S.a.b.c in sync (data-type="number|bool|text"); add data-then="actName" to run after.
     data-go="tabId" jumps to a tab.  OA.sheet(title, html) opens a full-screen sheet; OA.closeSheet().
     OA.render() redraws the current tab; OA.on('render', fn) runs after every draw. */
(function () {
  'use strict';
  const OA = window.OA = { version: 1, acts: {}, tabs: [], hooks: {}, app: '', S: null, meta: {} };
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };
  OA.ls = ls;
  const $ = OA.$ = (s, r) => (r || document).querySelector(s);
  const $$ = OA.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = OA.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OA.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  OA.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  OA.round = (v, d) => { const m = Math.pow(10, d || 0); return Math.round(v * m) / m; };
  OA.sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  OA.on = (ev, fn) => { (OA.hooks[ev] = OA.hooks[ev] || []).push(fn); };
  OA.emit = (ev, a, b) => (OA.hooks[ev] || []).forEach(fn => { try { fn(a, b); } catch (e) { console.error(ev, e); } });

  /* ---------- dates ---------- */
  const pad = n => String(n).padStart(2, '0');
  OA.dkey = d => { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  OA.parseKey = k => new Date(k + 'T12:00:00');
  OA.addDays = (k, n) => { const d = OA.parseKey(k); d.setDate(d.getDate() + n); return OA.dkey(d); };
  OA.daysBetween = (a, b) => Math.round((OA.parseKey(b) - OA.parseKey(a)) / 86400000);
  OA.fmtDate = (k, o) => OA.parseKey(k).toLocaleDateString([], o || { weekday: 'short', month: 'short', day: 'numeric' });
  OA.fmtTime = d => d ? new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  OA.ago = ts => { const m = Math.round((Date.now() - ts) / 60000); if (m < 2) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; const d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago'); };

  /* ---------- units (saved in S.units) ---------- */
  const U = () => (OA.S && OA.S.units) || {};
  OA.unit = { dist: () => U().dist || 'mi', wt: () => U().wt || 'lb', temp: () => U().temp || 'F', vol: () => U().vol || 'L' };
  OA.mi2km = 1.609344; OA.lb2kg = 0.45359237; OA.oz2g = 28.349523125;
  OA.dist = (mi, d) => OA.unit.dist() === 'km' ? OA.round(mi * OA.mi2km, d == null ? 1 : d) + ' km' : OA.round(mi, d == null ? 1 : d) + ' mi';
  OA.distN = mi => OA.unit.dist() === 'km' ? mi * OA.mi2km : mi;
  OA.ft = (ft, d) => OA.unit.dist() === 'km' ? Math.round(ft * 0.3048) + ' m' : Math.round(ft).toLocaleString() + ' ft';
  OA.wt = (lb, d) => OA.unit.wt() === 'kg' ? OA.round(lb * OA.lb2kg, d == null ? 1 : d) + ' kg' : OA.round(lb, d == null ? 1 : d) + ' lb';
  OA.temp = (f, d) => OA.unit.temp() === 'C' ? Math.round((f - 32) * 5 / 9) + '°C' : Math.round(f) + '°F';
  OA.money = v => (v < 0 ? '-' : '') + '$' + Math.abs(Math.round(v)).toLocaleString();
  OA.money2 = v => (v < 0 ? '-' : '') + '$' + Math.abs(v).toFixed(2);
  OA.hm = h => { const m = Math.round(h * 60); return Math.floor(m / 60) + ' h ' + pad(m % 60) + ' m'; };

  /* ---------- state ---------- */
  let saveT = null, defaults = {};
  OA.key = () => OA.app + '.v1';
  OA.defaults = o => { for (const k in o) { const a = defaults[k], b = o[k]; defaults[k] = (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) ? Object.assign({}, a, b) : b; } if (OA.S) merge(OA.S, o); };   // modules may share a top-level key: their defaults are combined one level deep
  function merge(dst, src) { Object.keys(src).forEach(k => { if (dst[k] === undefined) dst[k] = JSON.parse(JSON.stringify(src[k])); else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object') merge(dst[k], src[k]); }); }
  OA.load = () => { let s = null; try { s = JSON.parse(ls.get(OA.key()) || 'null'); } catch (e) { } OA.S = s || {}; merge(OA.S, defaults); return OA.S; };
  OA.save = () => { clearTimeout(saveT); if (!ls.set(OA.key(), JSON.stringify(OA.S))) OA.toast('Could not save: storage is full. Make a backup in Menu.', 5000); };
  OA.saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(OA.save, 250); };
  OA.getPath = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
  OA.setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); let c = o; ks.forEach(k => { if (c[k] == null || typeof c[k] !== 'object') c[k] = {}; c = c[k]; }); c[last] = v; };
  OA.defaults({ units: { dist: 'mi', wt: 'lb', temp: 'F' }, shown: {}, gates: {}, made: Date.now() });

  /* ---------- toast, sheet ---------- */
  let toastT = null;
  function liveToast(t) { if (t.getAttribute('role') !== 'status') { t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); t.setAttribute('aria-atomic', 'true'); } }
  /* ---------- accessibility helpers: focus signature, inert background, modal focus ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const sig = e => { if (!e || e === document.body || !e.tagName) return null; const d = e.dataset || {}; return { id: e.id || '', tag: e.tagName, act: d.act || '', go: d.go || '', bind: d.bind || '', ds: JSON.stringify(d), txt: (e.textContent || '').trim().slice(0, 40) }; };
  const findSig = (g, root) => {
    if (!g) return null; root = root || document;
    if (g.id) { const e = document.getElementById(g.id); if (e) return e; }
    const cand = $$(g.tag.toLowerCase(), root).filter(e => { const d = e.dataset || {}; return (d.act || '') === g.act && (d.go || '') === g.go && (d.bind || '') === g.bind; });
    return cand.find(e => JSON.stringify(e.dataset) === g.ds) || cand.find(e => (e.textContent || '').trim().slice(0, 40) === g.txt) || null;
  };
  const setInert = (on, ids) => ids.forEach(i => { const e = document.getElementById(i); if (!e) return; if (on) { e.setAttribute('inert', ''); e.setAttribute('aria-hidden', 'true'); } else { e.removeAttribute('inert'); e.removeAttribute('aria-hidden'); } });
  function focusEl(e) { if (!e) return false; try { e.focus({ preventScroll: true }); } catch (x) { return false; } return document.activeElement === e; }
  function focusMain() { const v = $('#view'); if (v) { v.setAttribute('tabindex', '-1'); focusEl(v); } }
  OA.toast = (m, ms) => { const t = $('#toast'); if (!t) return; liveToast(t); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2600); };
  const sheetStack = [];
  OA.sheet = (title, html, opts) => {
    const sh = $('#sheet'); if (!sh) return;
    const opener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    sheetStack.push({ title, html, opts, opener, osig: sig(opener) });
    drawSheet(true);
  };
  function drawSheet(fresh) {
    const sh = $('#sheet'), top = sheetStack[sheetStack.length - 1];
    if (!top) { sh.classList.remove('open'); document.body.classList.remove('noscroll'); sh.removeAttribute('aria-labelledby'); setInert(false, ['view', 'tabs']); return; }
    const was = document.activeElement, keep = !fresh && sh.contains(was) ? sig(was) : null;
    let sel = null; if (keep && was.selectionStart != null) { try { sel = [was.selectionStart, was.selectionEnd]; } catch (e) { } }
    sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-labelledby', 'sh-title');
    sh.innerHTML = `<div class="sh-bar"><b id="sh-title" role="heading" aria-level="1" tabindex="-1">${esc(top.title)}</b><button class="x" data-act="closeSheet" aria-label="Close">×</button></div><div class="sh-body">${top.html}</div>`;
    sh.classList.add('open'); document.body.classList.add('noscroll'); sh.scrollTop = 0; setInert(true, ['view', 'tabs']);
    if (top.opts && top.opts.onOpen) { try { top.opts.onOpen($('.sh-body', sh)); } catch (e) { console.error(e); } }
    enhance(sh);
    if (fresh) focusEl($('#sh-title', sh));   // move focus into the dialog (title first, so a screen reader reads it)
    else if (keep) { const e = findSig(keep, sh); if (e && focusEl(e) && sel) { try { e.setSelectionRange(sel[0], sel[1]); } catch (x) { } } }
  }
  function restoreOpener(t) {
    const run = () => { let e = t.opener && t.opener.isConnected && !t.opener.closest('[inert]') ? t.opener : findSig(t.osig, document); if (!e || e.closest('[inert]') || !focusEl(e)) { if (!sheetStack.length) focusMain(); else focusEl($('#sh-title')); } };
    run();
  }
  OA.closeSheet = () => { const t = sheetStack.pop(); if (t && t.opts && t.opts.onClose) { try { t.opts.onClose(); } catch (e) { } } drawSheet(); if (!sheetStack.length) OA.render(true); if (t) restoreOpener(t); };
  OA.closeAllSheets = () => { let first = null; while (sheetStack.length) { const t = sheetStack.pop(); first = t; if (t.opts && t.opts.onClose) { try { t.opts.onClose(); } catch (e) { } } } drawSheet(); if (first) restoreOpener(first); };
  OA.sheetOpen = () => sheetStack.length > 0;
  OA.sheetBody = () => $('#sheet .sh-body');
  OA.redrawSheet = html => { const t = sheetStack[sheetStack.length - 1]; if (!t) return; if (html != null) t.html = html; const sc = $('#sheet').scrollTop; drawSheet(); $('#sheet').scrollTop = sc; };
  function openModal(d) {
    d._opener = document.activeElement; d._osig = sig(d._opener);
    document.body.appendChild(d); setInert(true, ['view', 'tabs', 'sheet']);
    focusEl($('h2', d) ? $('.box', d) : $('.btn.gold', d) || $('.box', d));
  }
  function closeModal(d) {
    d.remove();
    if ($('.gate')) return;
    setInert(false, ['view', 'tabs']); if (!sheetStack.length) { /* sheet stays inert-free when closed */ } setInert(false, ['sheet']);
    if (sheetStack.length) setInert(true, ['view', 'tabs']);
    const e = d._opener && d._opener.isConnected ? d._opener : findSig(d._osig, document);
    if (!e || !focusEl(e)) { if (sheetStack.length) focusEl($('#sh-title')); else focusMain(); }
  }
  /* Escape closes the top-most dialog (a confirm/gate first, then the sheet) */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const g = $$('.gate'); if (g.length) { e.preventDefault(); const d = g[g.length - 1]; if (d._cancel) d._cancel(); return; }
    if (sheetStack.length) { e.preventDefault(); OA.closeSheet(); }
  });
  OA.confirm = (msg, yes) => new Promise(res => {
    const d = document.createElement('div'); d.className = 'gate';
    d.innerHTML = `<div class="box" role="alertdialog" aria-modal="true" aria-describedby="gdesc" tabindex="-1"><p id="gdesc">${esc(msg)}</p><div class="row"><button class="btn" data-r="0">Cancel</button><button class="btn gold" data-r="1">${esc(yes || 'OK')}</button></div></div>`;
    d.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { closeModal(d); res(b.dataset.r === '1'); } });
    d._cancel = () => { closeModal(d); res(false); };
    openModal(d);
  });
  /* a one-time warning the person must acknowledge (safety content). OA.gate('forage', 'Title', html) -> Promise */
  OA.gate = (id, title, html, btn) => new Promise(res => {
    if (OA.S.gates[id]) return res(true);
    const d = document.createElement('div'); d.className = 'gate';
    d.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="gtitle" tabindex="-1"><h2 id="gtitle" style="margin-top:0">${esc(title)}</h2>${html}<label class="chk"><input type="checkbox" id="gatechk"> I understand</label><div class="row"><button class="btn" data-r="0">Not now</button><button class="btn gold" data-r="1" id="gateok" disabled>${esc(btn || 'Continue')}</button></div></div>`;
    d.addEventListener('change', e => { if (e.target.id === 'gatechk') $('#gateok', d).disabled = !e.target.checked; });
    d.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b || b.disabled) return; closeModal(d); if (b.dataset.r === '1') { OA.S.gates[id] = Date.now(); OA.save(); } res(b.dataset.r === '1'); });
    d._cancel = () => { closeModal(d); res(false); };
    openModal(d);
  });

  /* ---------- actions, binding, tabs ---------- */
  OA.act = (a, f) => { if (typeof a === 'string') OA.acts[a] = f; else Object.assign(OA.acts, a); };
  OA.acts.closeSheet = () => OA.closeSheet();
  OA.acts.go = el => OA.go(el.dataset.go);
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && !e.target.closest('[data-act]')) { OA.closeAllSheets(); OA.go(g.dataset.go, g.dataset.arg); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const f = OA.acts[a.dataset.act]; if (!f) { console.warn('no action', a.dataset.act); return; }
    try { const r = f(a, e); if (r && r.catch) r.catch(x => { console.error(x); OA.toast('Something went wrong: ' + (x && x.message || x)); }); } catch (x) { console.error(x); OA.toast('Something went wrong: ' + x.message); }
  });
  document.addEventListener('change', e => {
    const oc = e.target.closest('[data-onchange]'); if (oc && OA.acts[oc.dataset.onchange]) { try { const r = OA.acts[oc.dataset.onchange](oc, e); if (r && r.catch) r.catch(x => OA.toast(String(x && x.message || x))); } catch (x) { OA.toast(x.message); } return; }
    const b = e.target.closest('[data-bind]'); if (!b) return;
    let v; const t = b.dataset.type || (b.type === 'number' ? 'number' : b.type === 'checkbox' ? 'bool' : 'text');
    if (t === 'bool') v = !!b.checked; else if (t === 'number') { v = b.value === '' ? null : parseFloat(b.value); if (v != null && isNaN(v)) v = null; } else v = b.value;
    OA.setPath(OA.S, b.dataset.bind, v); OA.saveSoon();
    if (b.dataset.then && OA.acts[b.dataset.then]) OA.acts[b.dataset.then](b, e);
  });
  OA.tab = t => { OA.tabs.push(t); OA.tabs.sort((a, b) => (a.order || 50) - (b.order || 50)); };
  let cur = null, curArg = null;
  OA.current = () => cur;
  OA.go = (id, arg) => { if (!OA.tabs.find(t => t.id === id)) return; cur = id; curArg = arg || null; OA.S.lastTab = id; OA.render(); window.scrollTo(0, 0); };
  OA.render = quiet => {
    const tab = OA.tabs.find(t => t.id === cur) || OA.tabs[0]; if (!tab) return;
    const v = $('#view'); const y = window.scrollY; const fk = quiet && v.contains(document.activeElement) ? sig(document.activeElement) : null;
    try { v.innerHTML = ''; const out = tab.render(v, curArg); if (typeof out === 'string') v.innerHTML = out; }
    catch (x) { console.error(x); v.innerHTML = `<div class="alert danger"><b class="t">This screen hit a problem</b>${esc(x.message)}<div class="row"><button class="btn" data-act="reload">Reload the app</button></div></div>`; }
    drawTabs(); enhance(v); if (quiet) window.scrollTo(0, y); if (fk) { const e = findSig(fk, v); if (e) focusEl(e); } OA.emit('render', tab.id);
  };
  OA.acts.reload = () => location.reload();
  function drawTabs() {
    const n = $('#tabs'); if (!n) return;
    n.setAttribute('aria-label', 'Main sections');
    const had = n.contains(document.activeElement) ? sig(document.activeElement) : null;
    n.innerHTML = OA.tabs.filter(t => !t.hidden).map(t => `<button data-go="${t.id}" class="${t.id === cur ? 'on' : ''}"${t.id === cur ? ' aria-current="page"' : ''} aria-label="${esc(t.label)}">${OA.icon(t.icon || 'pin')}<span>${esc(t.label)}</span></button>`).join('');
    if (had) { const e = findSig(had, n); if (e) focusEl(e); }
  }
  /* Progressive accessibility fixes for markup the apps write: keyboard + role for clickable non-buttons, toggle state on chips,
     names for placeholder-only fields. Runs after every render, sheet draw and DOM change (cheap, idempotent). */
  const INTER = 'a[href],button,input,select,textarea,[tabindex],[role=button],[role=link]';
  function enhance(root) {
    root = root || document.body;
    $$('[data-act],[data-go]', root).forEach(e => {
      if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION)$/.test(e.tagName) || e.getAttribute('role')) return;
      if (e.querySelector(INTER)) return;   // a card holding its own buttons: leave it to the app author (nested controls)
      e.setAttribute('role', 'button'); if (!e.hasAttribute('tabindex')) e.setAttribute('tabindex', '0');
    });
    $$('button.chip', root).forEach(e => { if (!e.hasAttribute('role')) e.setAttribute('aria-pressed', e.classList.contains('on') ? 'true' : 'false'); });
    $$('input:not([type=hidden]),select,textarea', root).forEach(e => {
      if (e.hasAttribute('aria-label') || e.hasAttribute('aria-labelledby') || (e.labels && e.labels.length) || e.title) return;
      const t = e.getAttribute('placeholder'); if (t) e.setAttribute('aria-label', t);
    });
    $$('svg.ic:not([aria-hidden])', root).forEach(e => e.setAttribute('aria-hidden', 'true'));
  }
  OA.enhance = enhance;
  document.addEventListener('keydown', e => {
    if ((e.key !== 'Enter' && e.key !== ' ') || e.target.getAttribute('role') !== 'button' || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    e.preventDefault(); e.target.click();
  });
  let enhT = 0;
  function watch() {
    if (!window.MutationObserver) return;
    new MutationObserver(() => { if (enhT) return; enhT = requestAnimationFrame(() => { enhT = 0; enhance(document.body); }); })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  /* page header used by most tabs */
  OA.header = (title, sub) => `<div class="hd"><img class="logo" src="img/seal.png" alt=""><div><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div><button class="gear" data-act="menu" aria-label="Menu">${OA.icon('gear')}</button></div>`;

  /* ---------- IndexedDB: stores kv (small json), photos (blobs), cache (api results) ---------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('No database in this browser'));
      const r = indexedDB.open(OA.app + '.db', 1);
      r.onupgradeneeded = () => { const d = r.result; ['kv', 'photos', 'cache'].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(store, mode, fn) { return db().then(d => new Promise((res, rej) => { const t = d.transaction(store, mode), s = t.objectStore(store); let out; try { out = fn(s); } catch (e) { return rej(e); } t.oncomplete = () => res(out && typeof out === 'object' && 'result' in out ? (out.result === undefined ? null : out.result) : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })); }
  OA.db = {
    get: (store, id) => tx(store, 'readonly', s => s.get(id)).then(v => v || null),
    put: (store, obj) => tx(store, 'readwrite', s => { s.put(obj); }),
    del: (store, id) => tx(store, 'readwrite', s => { s.delete(id); }),
    all: store => tx(store, 'readonly', s => s.getAll()).then(v => v || []),
    clear: store => tx(store, 'readwrite', s => { s.clear(); })
  };
  /* cached network call: OA.cached('key', ttlMs, () => fetchSomething()) -> {v, stale, fromCache, error}. Works offline from the last good copy. */
  OA.cached = async (key, ttl, fetcher) => {
    let old = null; try { old = await OA.db.get('cache', key); } catch (e) { }
    if (old && Date.now() - old.ts < ttl) return { v: old.v, stale: false, fromCache: true };
    if (!navigator.onLine && old) return { v: old.v, stale: true, fromCache: true };
    try { const v = await fetcher(); try { await OA.db.put('cache', { id: key, ts: Date.now(), v }); } catch (e) { } return { v, stale: false, fromCache: false }; }
    catch (e) { if (old) return { v: old.v, stale: true, fromCache: true, error: e }; throw e; }
  };
  OA.fetchJSON = async (url, opt, ms) => {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 15000);
    try { const r = await fetch(url, Object.assign({ signal: c.signal }, opt || {})); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
  };
  OA.online = () => navigator.onLine !== false;

  /* ---------- menu (gear) ---------- */
  OA.menuItems = [];   // apps may push {label, icon, act}
  OA.acts.menu = () => {
    const U2 = OA.S.units, sel = (p, opts, v) => `<select class="in" data-bind="${p}" data-then="unitsChanged">${opts.map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
    const extra = OA.menuItems.map(m => `<button class="btn block" data-act="${m.act}">${esc(m.label)}</button>`).join('');
    OA.sheet('Menu', `
      <div class="sh-sec"><h3>Units</h3><div class="three">
        <label class="fl">Distance${sel('units.dist', [['mi', 'Miles'], ['km', 'Kilometers']], U2.dist)}</label>
        <label class="fl">Weight${sel('units.wt', [['lb', 'Pounds'], ['kg', 'Kilograms']], U2.wt)}</label>
        <label class="fl">Temperature${sel('units.temp', [['F', '°F'], ['C', '°C']], U2.temp)}</label></div></div>
      ${extra}
      <div class="sh-sec"><h3>Occultica household</h3><p class="sm dim">Link with Healthica, Hortica and the other Occultica apps, and share a calendar.</p><button class="btn block" data-act="occOpen">Household link</button></div>
      <div class="sh-sec"><h3>Back up</h3><p class="sm dim">Everything is stored on this phone only. Make a backup now and then, and before changing phones.</p>
        <button class="btn block" data-act="backupFile">Save a backup file</button><button class="btn block" data-act="backupCode">Copy a backup code</button>
        <textarea class="in" id="bkin" rows="3" aria-label="Backup code" placeholder="Paste a backup code or choose a file to restore"></textarea>
        <div class="row"><button class="btn" data-act="restoreCode">Restore from code</button><label class="btn" style="text-align:center">Choose file<input type="file" class="vh" accept=".json,application/json" id="bkfile" data-onchange="restoreFile"></label></div><div id="bkout" class="sm"></div></div>
      <div class="sh-sec"><h3>Storage</h3><div id="storinfo" class="sm dim">Checking…</div></div>
      <div class="sh-sec"><h3>About</h3><p class="sm dim">${esc(OA.meta.name || OA.app)} · an Occultica app by 3lite Studios. Version ${esc(OA.meta.version || '1.0')}. Works offline once opened; online lookups are used only when there is signal. Nothing leaves this phone unless you share it.</p>
        <p class="sm dim">Safety: this app is a planning aid. It can be wrong or out of date. Check conditions, closures and rules with the land manager, carry a paper map and plan for your own safety.</p>
        <button class="btn danger block" data-act="resetAll">Erase everything in this app</button></div>`, { onOpen: storageInfo });
  };
  OA.acts.unitsChanged = () => { OA.saveSoon(); OA.emit('units'); };
  async function storageInfo(root) {
    const out = $('#storinfo', root); if (!out) return;
    try { const e = await navigator.storage.estimate(); const ph = await OA.db.all('photos').catch(() => []); out.textContent = `Using about ${(e.usage / 1048576).toFixed(1)} MB of ${(e.quota / 1048576).toFixed(0)} MB. ${ph.length} photos saved.`; if (navigator.storage.persist) navigator.storage.persist(); } catch (x) { out.textContent = 'Not available in this browser.'; }
  }
  OA.acts.resetAll = async () => { if (!await OA.confirm('Erase all data in ' + (OA.meta.name || 'this app') + ' on this phone? This cannot be undone.', 'Erase')) return; ls.del(OA.key()); try { indexedDB.deleteDatabase(OA.app + '.db'); } catch (e) { } location.reload(); };

  /* ---------- start ---------- */
  OA.start = () => {
    OA.app = (document.body.dataset.app || '').toLowerCase();
    try { OA.meta = JSON.parse(document.getElementById('appmeta').textContent); } catch (e) { OA.meta = {}; }
    OA.load();
    { const t = $('#toast'); if (t) liveToast(t); const tb = $('#tabs'); if (tb) tb.setAttribute('aria-label', 'Main sections'); const vw = $('#view'); if (vw) vw.setAttribute('tabindex', '-1'); }
    OA.emit('ready');
    const first = OA.tabs.find(t => t.id === OA.S.lastTab) ? OA.S.lastTab : (OA.tabs[0] && OA.tabs[0].id);
    cur = first; OA.render();
    if (window.OCC && OCC.bind) OCC.bind(OA.acts, OA.app, () => { try { OA.publish(); } catch (e) { } });
    try { OA.publish(); } catch (e) { }
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => { });
    window.addEventListener('online', () => OA.emit('online')); window.addEventListener('offline', () => OA.emit('offline'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) OA.save(); });
    window.addEventListener('pagehide', OA.save);
    watch(); enhance(document.body);
    OA.emit('started');
  };
  /* apps set OA.publisher = () => ({...summary}) ; the shell publishes it to the household link whenever state is saved or the app opens */
  OA.publish = () => { if (window.OCC && OA.publisher) OCC.publish(OA.app, OA.publisher()); };
  OA.on('units', () => OA.render(true));
})();
