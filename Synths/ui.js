'use strict';
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const IDS = Object.keys(OCC.engines);
let ctx = null, node = null, ready = null, cur = null, unlocked = false, levelEl = $('#lvl');
const UI = { values: {}, ctl: {} };
const SAVE = 'occsynths.v1';
function say(t, err) { const m = $('#msg'); m.textContent = t; m.style.color = err ? '#ff9a9a' : ''; }
function fmt(s, v) { if (s.labels) return s.labels[Math.round(v)] || ''; const m = /%\.(\d)f/.exec(s.fmt); const d = m ? +m[1] : 2; const out = v.toFixed(d); return s.fmt.replace(/%\.\df/, out); }
const toS = (s, x) => s.log ? Math.log(x / s.min) / Math.log(s.max / s.min) : (x - s.min) / (s.max - s.min);
const fromS = (s, t) => s.log ? s.min * Math.pow(s.max / s.min, t) : s.min + t * (s.max - s.min);
function post(m) { if (node) node.port.postMessage(m); }
function unlock() {
  if (unlocked) return; unlocked = true;
  try { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); a.loop = true; a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; a.volume = 0.01; const p = a.play(); if (p && p.catch) p.catch(() => { }); window.__keep = a; } catch (e) { }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
}
function ensureAudio() {
  if (ready) return ready; unlock();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !window.AudioWorkletNode) { say('This browser is too old. Try a current Chrome, Edge, Safari or Firefox.', 1); return Promise.reject(new Error('no worklet')); }
  ctx = new AC({ latencyHint: 'interactive' }); const res = ctx.resume();
  try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { }
  ready = (async () => {
    try { await res; } catch (e) { }
    await ctx.audioWorklet.addModule('worklet.js');
    node = new AudioWorkletNode(ctx, 'occsynth', { numberOfInputs: 0, outputChannelCount: [2] }); node.connect(ctx.destination);
    node.port.onmessage = e => {
      const d = e.data;
      if (d.writes) d.writes.forEach(([id, v]) => setValue(id, v, false));
      if (d.peak != null && levelEl) levelEl.style.width = Math.min(100, Math.pow(d.peak, 0.6) * 100) + '%';
      if (d.error) say('Sound engine problem: ' + d.error.split('\n')[0], 1);
      
    };
    if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) { } }
    if (ctx.state !== 'running') say('Sound is blocked. Tap a key again. On iPhone, turn off the silent switch and turn the volume up.', 1);
  })().catch(err => { ready = null; try { ctx.close(); } catch (e) { } ctx = null; say('Sound could not start: ' + (err && err.message || err), 1); throw err; });
  return ready;
}
let loaded = null;
async function ensureEngine() { await ensureAudio(); if (loaded !== UI.id) { loaded = UI.id; post({ engine: UI.id }); sendAll(); } }
function sendAll() { const d = OCC.engines[UI.id]; d.specs.forEach((s, i) => { if (i > 0) post({ set: [i, UI.values[i]] }); }); }
function setValue(id, v, send) {
  UI.values[id] = v; const c = UI.ctl[id]; if (c) c.update(v);
  if (send) post({ set: [id, v] });
  persist();
}
function persist() { try { localStorage.setItem(SAVE, JSON.stringify({ id: UI.id, oct: UI.oct, vals: Object.assign(JSON.parse(localStorage.getItem(SAVE) || '{}').vals || {}, { [UI.id]: UI.values }) })); } catch (e) { } }
function restore() { try { return JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch (e) { return null; } }

function build(id, saved) {
  const d = OCC.engines[id]; UI.id = id; UI.ctl = {}; UI.values = {}; if (cur !== id) cur = null;
  d.specs.forEach((s, i) => UI.values[i] = s.def);
  if (saved) for (const k in saved) { const i = +k; if (d.specs[i] && typeof saved[k] === 'number' && isFinite(saved[k])) UI.values[i] = Math.min(d.specs[i].max, Math.max(d.specs[i].min, saved[k])); }
  $('#title').textContent = d.name; $('#blurb').textContent = d.blurb; document.title = d.name + ' - Occultica Synths';
  document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.id === id));
  const sel = $('#preset'); sel.innerHTML = ''; d.specs[0].labels.forEach((l, i) => { const o = el('option'); o.value = i; o.textContent = l; sel.appendChild(o); }); sel.value = Math.round(UI.values[0]);
  UI.ctl[0] = { update: v => { sel.value = Math.round(v); } };
  sel.onchange = () => { ensureEngine().then(() => setValue(0, +sel.value, true)); };
  const host = $('#params'); host.innerHTML = '';
  d.groups.forEach((g, gi) => {
    const det = el('details'); if (gi < 3) det.open = true; det.appendChild(el('summary', '', g[0])); const grid = el('div', 'grid');
    g[1].forEach(i => { const s = d.specs[i]; grid.appendChild(control(i, s)); }); det.appendChild(grid); host.appendChild(det);
  });
}
function control(i, s) {
  const w = el('div', 'ctl'), lab = el('label'), nm = el('span', '', s.name), val = el('b', '', fmt(s, UI.values[i])); lab.append(nm, val); w.appendChild(lab);
  if (s.labels && s.labels.length <= 4) {
    const seg = el('div', 'seg'); const bs = s.labels.map((l, k) => { const b = el('button', '', l); b.onclick = () => setValue(i, k, true); seg.appendChild(b); return b; });
    const upd = v => { bs.forEach((b, k) => b.setAttribute('aria-pressed', k === Math.round(v))); val.textContent = fmt(s, v); }; upd(UI.values[i]); UI.ctl[i] = { update: upd }; w.appendChild(seg);
  } else if (s.labels) {
    const sl = el('select'); sl.setAttribute('aria-label', s.name); s.labels.forEach((l, k) => { const o = el('option'); o.value = k; o.textContent = l; sl.appendChild(o); }); sl.value = Math.round(UI.values[i]);
    sl.onchange = () => setValue(i, +sl.value, true); UI.ctl[i] = { update: v => { sl.value = Math.round(v); val.textContent = ''; } }; val.textContent = ''; w.appendChild(sl);
  } else {
    const r = el('input'); r.type = 'range'; r.setAttribute('aria-label', s.name); const integer = /%\.0f/.test(s.fmt) && !s.log && (s.max - s.min) <= 64 && Number.isInteger(s.min) && Number.isInteger(s.max);
    if (integer) { r.min = s.min; r.max = s.max; r.step = 1; r.value = UI.values[i]; } else { r.min = 0; r.max = 1000; r.step = 1; r.value = Math.round(toS(s, UI.values[i]) * 1000); }
    r.oninput = () => { const v = integer ? +r.value : fromS(s, r.value / 1000); val.textContent = fmt(s, v); UI.values[i] = v; post({ set: [i, v] }); };
    r.onchange = persist;
    UI.ctl[i] = { update: v => { r.value = integer ? v : Math.round(toS(s, v) * 1000); val.textContent = fmt(s, v); } }; w.appendChild(r);
  }
  return w;
}
/* keyboard */
const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACKPOS = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
UI.oct = 4; const held = new Map(); const keyEls = {};
const baseNote = () => UI.oct * 12 + 12; // oct 4 -> C4 = 60... shown as C(oct)
function nOctaves() { return innerWidth < 640 ? 2 : 3; }
function renderKb() {
  const kb = $('#kb'); kb.innerHTML = ''; Object.keys(keyEls).forEach(k => delete keyEls[k]); const oc = nOctaves(), start = baseNote(), total = oc * 7 + 1;
  for (let w = 0; w < total; w++) { const oct = Math.floor(w / 7), n = start + oct * 12 + WHITE[w % 7]; const k = el('div', 'wk', w % 7 === 0 ? 'C' + (UI.oct + oct) : ''); k.dataset.n = n; kb.appendChild(k); keyEls[n] = k; }
  for (let w = 0; w < total - 1; w++) { const st = w % 7; const semi = WHITE[st] + 1; if ([1, 3, 6, 8, 10].indexOf(semi) < 0) continue; if (st === 2 || st === 6) continue; const n = start + Math.floor(w / 7) * 12 + semi; const k = el('div', 'bk'); k.dataset.n = n; const bw = 100 / total * 0.62; k.style.left = ((w + 1) / total * 100 - bw / 2) + '%'; k.style.width = bw + '%'; kb.appendChild(k); keyEls[n] = k; }
  $('#octl').textContent = 'C' + UI.oct;
}
function noteOn(n, vel) { if (held.has('n' + n)) return; held.set('n' + n, 1); ensureEngine().then(() => { post({ on: [n, vel || 0.8] }); }); if (keyEls[n]) keyEls[n].classList.add('dn'); }
function noteOff(n) { if (!held.has('n' + n)) return; held.delete('n' + n); post({ off: n }); if (keyEls[n]) keyEls[n].classList.remove('dn'); }
const ptr = new Map();
function keyAt(x, y) { const e = document.elementFromPoint(x, y); return e && e.dataset && e.dataset.n ? +e.dataset.n : null; }
function bindKb() {
  const kb = $('#kb');
  kb.addEventListener('pointerdown', e => { e.preventDefault(); const n = keyAt(e.clientX, e.clientY); if (n == null) return; try { kb.setPointerCapture(e.pointerId); } catch (x) { } ptr.set(e.pointerId, n); noteOn(n, 0.55 + 0.4 * Math.min(1, (e.offsetY || 70) / 140)); });
  kb.addEventListener('pointermove', e => { if (!ptr.has(e.pointerId)) return; const n = keyAt(e.clientX, e.clientY); const o = ptr.get(e.pointerId); if (n != null && n !== o) { noteOff(o); ptr.set(e.pointerId, n); noteOn(n, 0.75); } });
  const up = e => { if (!ptr.has(e.pointerId)) return; noteOff(ptr.get(e.pointerId)); ptr.delete(e.pointerId); };
  kb.addEventListener('pointerup', up); kb.addEventListener('pointercancel', up);
  const MAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15 }, down = {};
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
    const k = e.key.toLowerCase(); if (k === 'z') { setOct(UI.oct - 1); return; } if (k === 'x') { setOct(UI.oct + 1); return; }
    if (k in MAP && !down[k]) { down[k] = baseNote() + MAP[k]; noteOn(down[k], 0.8); }
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (down[k] != null) { noteOff(down[k]); delete down[k]; } });
  addEventListener('blur', panic); document.addEventListener('visibilitychange', () => { if (document.hidden) panic(); });
}
function panic() { held.forEach((v, k) => { const n = +k.slice(1); if (keyEls[n]) keyEls[n].classList.remove('dn'); }); held.clear(); ptr.clear(); post({ panic: 1 }); }
function setOct(o) { UI.oct = Math.max(1, Math.min(6, o)); panic(); renderKb(); persist(); }
/* demo */
let demoT = null, demoStep = 0;
const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
function demoPlay() {
  const mono = UI.id === 'minica', ch = CH[Math.floor(demoStep / (mono ? 8 : 2)) % 4];
  if (mono) { const arp = [0, 12, 7, 12, 0, 7, 4, 7][demoStep % 8], n = ch[0] - 12 + arp; post({ on: [n, 0.8] }); setTimeout(() => post({ off: n }), 220); }
  else if (demoStep % 2 === 0) { ch.forEach(n => post({ on: [n, 0.7] })); ch.forEach(n => setTimeout(() => post({ off: n }), 700)); post({ on: [ch[0] - 12, 0.7] }); setTimeout(() => post({ off: ch[0] - 12 }), 700); }
  demoStep++;
}
function toggleDemo() {
  const b = $('#demo');
  if (demoT) { clearInterval(demoT); demoT = null; b.setAttribute('aria-pressed', false); b.textContent = '▶ Demo'; panic(); return; }
  ensureEngine().then(() => { demoStep = 0; demoPlay(); demoT = setInterval(demoPlay, 360); b.setAttribute('aria-pressed', true); b.textContent = '■ Stop demo'; });
}
function midi() {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess().then(a => { const hook = () => a.inputs.forEach(i => { i.onmidimessage = m => { const [s, d1, d2] = m.data, c = s & 0xF0; if (c === 0x90 && d2 > 0) noteOn(d1, d2 / 127); else if (c === 0x80 || (c === 0x90 && d2 === 0)) noteOff(d1); else if (c === 0xE0) post({ bend: ((d2 << 7 | d1) - 8192) / 8192 }); else if (c === 0xB0 && d1 === 1) post({ mod: d2 / 127 }); }; }); hook(); a.onstatechange = hook; if (a.inputs.size) say('MIDI keyboard found. Play away.'); }).catch(() => { });
}
function go(id, push) {
  if (!OCC.engines[id]) id = 'minica'; if (demoT) toggleDemo(); panic();
  const sv = restore(), saved = sv && sv.vals && sv.vals[id]; build(id, saved);
  if (push !== false) history.replaceState(null, '', '#' + id);
  loaded = null; if (ready) ensureEngine();
}
function init() {
  const nav = $('#nav'); IDS.forEach(id => { const b = el('button', '', OCC.engines[id].name); b.dataset.id = id; b.onclick = () => go(id); nav.appendChild(b); });
  const sv = restore(); if (sv && typeof sv.oct === 'number') UI.oct = Math.max(1, Math.min(6, sv.oct));
  renderKb(); bindKb(); addEventListener('resize', () => { const n = nOctaves(); if ($('#kb').children.length !== undefined) renderKb(); });
  $('#octd').onclick = () => setOct(UI.oct - 1); $('#octu').onclick = () => setOct(UI.oct + 1);
  $('#bend').oninput = e => post({ bend: +e.target.value }); $('#bend').onpointerup = e => { e.target.value = 0; post({ bend: 0 }); };
  $('#mod').oninput = e => post({ mod: +e.target.value }); $('#panic').onclick = panic; $('#demo').onclick = toggleDemo;
  $('#reset').onclick = () => { const d = OCC.engines[UI.id]; d.specs.forEach((s, i) => { if (i > 0) { UI.values[i] = s.def; if (UI.ctl[i]) UI.ctl[i].update(s.def); } }); UI.values[0] = d.specs[0].def; UI.ctl[0].update(UI.values[0]); sendAll(); persist(); say('Knobs reset.'); };
  addEventListener('hashchange', () => go(location.hash.slice(1), false));
  // ensure the engine is loaded the first time anything is pressed
  const first = () => { ensureEngine(); removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); };
  addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);
  const start = location.hash.slice(1) || (sv && sv.id) || 'minica'; go(start, true); midi();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  window.__U = { UI, post, noteOn, noteOff, go, ensureAudio };
}
document.addEventListener('DOMContentLoaded', init);
