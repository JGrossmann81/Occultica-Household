'use strict';
/* Birthica for the web. The sound engine is in worklet.js; this file is the screen. */
const NV = 11, STEPS = 16, MACH = 4;
const P = { master: 0, swing: 1, vol: 2, mute: 6, drum: 10, acid: 76, poly: 84, sat: 95, count: 99 };
const MNAME = ['Rhythm 8', 'Rhythm 9', 'Acid Bass', 'Poly Synth'];
const VNAMES = [
  ['Kick', 'Snare', 'Low Tom', 'Mid Tom', 'Hi Tom', 'Rim', 'Clap', 'Cowbell', 'Closed Hat', 'Open Hat', 'Cymbal'],
  ['Kick', 'Snare', 'Low Tom', 'Mid Tom', 'Hi Tom', 'Rim', 'Clap', 'Closed Hat', 'Open Hat', 'Crash', 'Ride']];
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'];
const CHORDN = ['-', 'maj', 'min', 'maj7', 'm7', 'sus4', '5'];
const OCTN = ['low', 'mid', 'high'];
const $ = (s, r) => (r || document).querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

/* ---- parameter list: same order and ranges as the plugin ---- */
const SPEC = [];
SPEC[P.master] = { n: 'Master', min: -36, max: 6, def: -6, u: 'dB' };
SPEC[P.swing] = { n: 'Swing', min: 0, max: 100, def: 0, u: '%' };
for (let m = 0; m < MACH; m++) { SPEC[P.vol + m] = { n: MNAME[m] + ' Volume', min: -36, max: 6, def: 0, u: 'dB' }; SPEC[P.mute + m] = { n: MNAME[m] + ' Mute', min: 0, max: 1, def: 0 }; }
for (let m = 0; m < 2; m++) for (let v = 0; v < NV; v++) { const b = P.drum + m * 33 + v * 3; SPEC[b] = { n: 'Level', min: 0, max: 100, def: v < 2 ? 85 : 75, u: '%' }; SPEC[b + 1] = { n: 'Tune', min: -12, max: 12, def: 0, u: 'st', step: 0.5 }; SPEC[b + 2] = { n: 'Decay', min: 10, max: 200, def: 100, u: '%' }; }
const AC = [['Wave', 0, 1, 0, '', ['Saw', 'Square']], ['Tune', -12, 12, 0, 'st'], ['Cutoff', 60, 4000, 420, 'Hz', null, 1], ['Resonance', 0, 100, 72, '%'], ['Env Mod', 0, 100, 60, '%'], ['Decay', 100, 2000, 450, 'ms', null, 1], ['Accent', 0, 100, 65, '%'], ['Drive', 0, 100, 25, '%']];
const PY = [['Wave', 0, 2, 0, '', ['Saw', 'Square', 'Saw+Sq']], ['Detune', 0, 50, 12, 'ct'], ['Cutoff', 100, 12000, 2200, 'Hz', null, 1], ['Resonance', 0, 100, 20, '%'], ['Env Amount', 0, 100, 35, '%'], ['Attack', 1, 2000, 6, 'ms', null, 1], ['Decay', 10, 3000, 450, 'ms', null, 1], ['Sustain', 0, 100, 55, '%'], ['Release', 10, 4000, 350, 'ms', null, 1], ['Gate', 10, 100, 80, '%'], ['Chorus', 0, 100, 45, '%']];
AC.forEach((a, i) => SPEC[P.acid + i] = { n: a[0], min: a[1], max: a[2], def: a[3], u: a[4], labels: a[5], log: a[6] });
PY.forEach((a, i) => SPEC[P.poly + i] = { n: a[0], min: a[1], max: a[2], def: a[3], u: a[4], labels: a[5], log: a[6] });
[22, 22, 12, 15].forEach((d, m) => SPEC[P.sat + m] = { n: 'Saturation', min: 0, max: 100, def: d, u: '%' });

const emptyPat = () => ({ drum: [0, 1].map(() => Array.from({ length: NV }, () => new Array(STEPS).fill(0))),
  acid: Array.from({ length: STEPS }, () => ({ note: 0, oct: 1, gate: 0, accent: 0, slide: 0 })),
  poly: Array.from({ length: STEPS }, () => ({ note: 0, oct: 1, gate: 0, chord: 0 })) });
const S = { values: SPEC.map(s => s.def), pat: emptyPat(), tempo: 110, tab: 0, voice: [0, 0], oct: 1, playing: false, step: -1 };
const KEY = 'birthica.web.v1';
function save() { try { localStorage.setItem(KEY, JSON.stringify({ v: S.values, p: S.pat, t: S.tempo, tab: S.tab, vo: S.voice })); } catch (e) { } }
function load() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    if (Array.isArray(o.v) && o.v.length === SPEC.length) S.values = o.v.map((x, i) => { const s = SPEC[i]; return typeof x === 'number' && isFinite(x) ? Math.min(s.max, Math.max(s.min, x)) : s.def; });
    if (o.p && o.p.drum && o.p.acid && o.p.poly) { const p = emptyPat(); for (let m = 0; m < 2; m++) for (let v = 0; v < NV; v++) for (let i = 0; i < STEPS; i++) p.drum[m][v][i] = Math.min(2, Math.max(0, (o.p.drum[m] && o.p.drum[m][v] && o.p.drum[m][v][i]) | 0)); for (let i = 0; i < STEPS; i++) { const a = o.p.acid[i] || {}, q = o.p.poly[i] || {}; p.acid[i] = { note: Math.min(12, Math.max(0, a.note | 0)), oct: Math.min(2, Math.max(0, a.oct == null ? 1 : a.oct | 0)), gate: a.gate ? 1 : 0, accent: a.accent ? 1 : 0, slide: a.slide ? 1 : 0 }; p.poly[i] = { note: Math.min(12, Math.max(0, q.note | 0)), oct: Math.min(2, Math.max(0, q.oct == null ? 1 : q.oct | 0)), gate: q.gate ? 1 : 0, chord: Math.min(6, Math.max(0, q.chord | 0)) }; } S.pat = p; }
    if (o.t >= 40 && o.t <= 240) S.tempo = o.t; if (o.tab >= 0 && o.tab < MACH) S.tab = o.tab; if (Array.isArray(o.vo)) S.voice = [Math.min(NV - 1, Math.max(0, o.vo[0] | 0)), Math.min(NV - 1, Math.max(0, o.vo[1] | 0))];
  } catch (e) { }
}
function example(m) {
  const p = S.pat; clearM(m);
  const set = (mm, v, steps, val = 1) => steps.forEach(s => p.drum[mm][v][s] = val);
  if (m === 0) { set(0, 0, [0, 3, 10]); set(0, 0, [8], 2); set(0, 1, [4, 12], 2); set(0, 6, [12]); set(0, 8, [0, 2, 4, 6, 8, 10, 12, 14]); set(0, 9, [7]); set(0, 7, [5, 13]); }
  else if (m === 1) { set(1, 0, [0, 4, 8, 12], 2); set(1, 6, [4, 12]); set(1, 1, [12]); set(1, 7, [0, 1, 3, 5, 7, 9, 11, 13, 15]); set(1, 8, [2, 6, 10, 14]); set(1, 10, [0, 4, 8, 12]); }
  else if (m === 2) {
    const n = [0, 0, 12, 0, 3, 0, 7, 5, 0, 0, 10, 0, 3, 5, 0, 7], g = [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1], a = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1], s = [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0];
    for (let i = 0; i < STEPS; i++) p.acid[i] = { note: n[i], oct: 1, gate: g[i], accent: a[i], slide: s[i] };
  } else { const at = [0, 3, 6, 10, 12], nt = [9, 9, 5, 7, 7], ch = [4, 4, 1, 1, 5]; at.forEach((s, i) => p.poly[s] = { note: nt[i], oct: 1, gate: 1, chord: ch[i] }); }
}
function clearM(m) {
  const p = S.pat;
  if (m < 2) p.drum[m].forEach(r => r.fill(0));
  else if (m === 2) for (let i = 0; i < STEPS; i++) p.acid[i] = { note: 0, oct: 1, gate: 0, accent: 0, slide: 0 };
  else for (let i = 0; i < STEPS; i++) p.poly[i] = { note: 0, oct: 1, gate: 0, chord: 0 };
}
function randomM(m) {
  const p = S.pat, r = () => Math.random(); clearM(m);
  if (m < 2) {
    for (let i = 0; i < STEPS; i += 4) p.drum[m][0][i] = 2; if (r() < 0.6) p.drum[m][0][(2 + (r() * 3 | 0) * 4 + 3) % 16] = 1;
    p.drum[m][1][4] = 2; p.drum[m][1][12] = 2; if (r() < 0.5) p.drum[m][1][15] = 1;
    const hat = m === 0 ? 8 : 7; for (let i = 0; i < STEPS; i += 2) p.drum[m][hat][i] = 1; for (let i = 1; i < STEPS; i += 2) if (r() < 0.25) p.drum[m][hat][i] = 1;
    const x = m === 0 ? 9 : 8; p.drum[m][x][2 + (r() * 3 | 0) * 4 + 2 > 15 ? 14 : 2 + (r() * 3 | 0) * 4 + 2] = 1;
    [2, 3, 4, 5, 6].forEach(v => { if (r() < 0.35) p.drum[m][v][(r() * 16) | 0] = 1; });
  } else if (m === 2) {
    const sc = [0, 0, 3, 5, 7, 10, 12]; for (let i = 0; i < STEPS; i++) p.acid[i] = { note: sc[(r() * sc.length) | 0], oct: 1, gate: r() < 0.7 ? 1 : 0, accent: r() < 0.25 ? 1 : 0, slide: r() < 0.2 ? 1 : 0 };
  } else { const roots = [0, 3, 5, 7, 10], ch = [1, 2, 3, 4, 5]; for (let i = 0; i < STEPS; i += 1) if (i % 3 === 0 && r() < 0.9) p.poly[i] = { note: roots[(r() * roots.length) | 0], oct: 1, gate: 1, chord: ch[(r() * ch.length) | 0] }; }
}

/* ---- audio ---- */
let ctx = null, node = null, ready = null;
let unlocked = false;
function unlockIOS() { // phones: create + resume inside the tap, and move audio out of the "ringer" channel so the silent switch does not mute it
  if (unlocked) return; unlocked = true;
  try { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); a.loop = true; a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; a.volume = 0.01; const p = a.play(); if (p && p.catch) p.catch(() => { }); window.__keep = a; } catch (e) { }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
}
function ensureAudio() {
  if (ready) return ready;
  unlockIOS();
  const AC_ = window.AudioContext || window.webkitAudioContext;
  if (!AC_ || !window.AudioWorkletNode) { toast('This browser is too old for Birthica. Try a current Chrome, Edge, Safari or Firefox.'); return Promise.reject(new Error('no audio worklet')); }
  ctx = new AC_({ latencyHint: 'interactive' });
  const res = ctx.resume(); // inside the tap, before any waiting
  try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { }
  ready = (async () => {
    try { await res; } catch (e) { }
    await ctx.audioWorklet.addModule('worklet.js');
    node = new AudioWorkletNode(ctx, 'birthica', { numberOfInputs: 0, outputChannelCount: [2] });
    node.connect(ctx.destination);
    node.port.onmessage = e => { if (e.data && typeof e.data.step === 'number') { S.step = e.data.step; paintCursor(); } };
    sendAll();
    if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) { } }
    if (ctx.state !== 'running') toast('Sound is blocked. Tap Play again. On iPhone, turn off the silent switch and turn the volume up.');
  })().catch(err => { ready = null; try { ctx.close(); } catch (e) { } ctx = null; toast('Sound could not start: ' + (err && err.message || err)); throw err; });
  return ready;
}
const post = m => { if (node) node.port.postMessage(m); };
function sendValues() { const o = {}; S.values.forEach((v, i) => o[i] = v); post({ values: o }); }
function sendAll() { sendValues(); post({ pattern: S.pat }); post({ tempo: S.tempo }); }
function sendPat() { post({ pattern: S.pat }); save(); }
function toast(t) { let e = $('#toast'); if (!e) { e = el('div'); e.id = 'toast'; e.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#ff5d8f;color:#1a0a2e;padding:10px 16px;border-radius:10px;font-weight:700;z-index:9'; document.body.appendChild(e); } e.textContent = t; e.style.display = 'block'; clearTimeout(e._t); e._t = setTimeout(() => e.style.display = 'none', 3500); }

/* ---- screen ---- */
const TC = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)'];
function fmt(i, v) { const s = SPEC[i]; if (s.labels) return s.labels[Math.round(v)]; const d = Math.abs(v) < 10 && s.u !== 'ms' && s.u !== 'Hz' ? 1 : 0; return (s.u === 'st' || s.u === 'dB') && v > 0 ? '+' + v.toFixed(d) + ' ' + s.u : v.toFixed(d) + ' ' + s.u; }
const toS = (s, x) => s.log ? Math.log(x / s.min) / Math.log(s.max / s.min) : (x - s.min) / (s.max - s.min);
const fromS = (s, t) => s.log ? s.min * Math.pow(s.max / s.min, t) : s.min + t * (s.max - s.min);
function slider(i, label, host) {
  const s = SPEC[i], lab = el('label'), val = el('b', '', fmt(i, S.values[i])), inp = el('input'); inp.type = 'range';
  lab.append(label || s.n, val, inp);
  if (s.labels) { inp.min = s.min; inp.max = s.max; inp.step = 1; inp.value = S.values[i]; }
  else { inp.min = 0; inp.max = 1000; inp.value = Math.round(toS(s, S.values[i]) * 1000); }
  inp.setAttribute('aria-label', label || s.n);
  inp.addEventListener('input', () => { const v = s.labels ? +inp.value : fromS(s, inp.value / 1000); S.values[i] = s.step ? Math.round(v / s.step) * s.step : v; val.textContent = fmt(i, S.values[i]); sendValues(); });
  inp.addEventListener('change', save);
  host.appendChild(lab); return lab;
}
function seg(vals, cur, cb) { const d = el('div', 'seg'); vals.forEach((t, k) => { const b = el('button', k === cur ? 'on' : '', t); b.onclick = () => { cb(k); }; d.appendChild(b); }); return d; }

function renderTabs() {
  const t = $('#tabs'); t.innerHTML = '';
  MNAME.forEach((n, m) => { const b = el('button', 'tab' + (S.values[P.mute + m] > 0.5 ? ' muted' : ''), n); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', S.tab === m); b.style.setProperty('--tc', TC[m]); b.onclick = () => { S.tab = m; save(); renderAll(); }; t.appendChild(b); });
}
function machineBar(m) {
  const c = el('div', 'card'); c.style.setProperty('--tc', TC[m]);
  const r = el('div', 'row sp');
  const left = el('div', 'row');
  const mute = el('button', 'btn' + (S.values[P.mute + m] > 0.5 ? ' on' : ''), S.values[P.mute + m] > 0.5 ? 'Muted' : 'Mute'); mute.setAttribute('aria-pressed', S.values[P.mute + m] > 0.5);
  mute.onclick = () => { S.values[P.mute + m] = S.values[P.mute + m] > 0.5 ? 0 : 1; sendValues(); save(); renderAll(); };
  const ex = el('button', 'btn', 'Example'), rn = el('button', 'btn', 'Random'), cl = el('button', 'btn', 'Clear');
  ex.onclick = () => { example(m); sendPat(); renderAll(); }; rn.onclick = () => { randomM(m); sendPat(); renderAll(); }; cl.onclick = () => { clearM(m); sendPat(); renderAll(); };
  left.append(mute, ex, rn, cl); r.appendChild(left); c.appendChild(r);
  const g = el('div', 'ctl'); slider(P.vol + m, 'Volume', g); slider(P.sat + m, 'Warm saturation', g); c.appendChild(g);
  return c;
}
function drumPanel(m) {
  const frag = document.createDocumentFragment(), c = el('div', 'card'); c.style.setProperty('--tc', TC[m]);
  c.appendChild(el('div', 'mini', 'Tap a sound name to hear it. Tap steps to turn them on; tap again for an accent (white dot); again to turn off.'));
  for (let v = 0; v < NV; v++) {
    const row = el('div', 'drumrow'), nm = el('button', 'vname', VNAMES[m][v]); nm.setAttribute('aria-pressed', S.voice[m] === v);
    nm.onclick = () => { S.voice[m] = v; ensureAudio().then(() => post({ hit: [m, v, 0.85] })); save(); renderPanel(); };
    const st = el('div', 'steps');
    for (let i = 0; i < STEPS; i++) { const val = S.pat.drum[m][v][i], b = el('button', 'st' + (i % 4 === 0 ? ' b' : '') + (val ? ' on' : '') + (val === 2 ? ' acc' : '')); b.dataset.i = i; b.setAttribute('aria-label', VNAMES[m][v] + ' step ' + (i + 1) + (val === 2 ? ' accent' : val ? ' on' : ' off')); b.onclick = () => { const n = (S.pat.drum[m][v][i] + 1) % 3; S.pat.drum[m][v][i] = n; if (n) { ensureAudio().then(() => { if (!S.playing) post({ hit: [m, v, n === 2 ? 1 : 0.72] }); }); } sendPat(); renderPanel(); }; st.appendChild(b); }
    row.append(nm, st); c.appendChild(row);
  }
  frag.appendChild(c);
  const k = el('div', 'card'); k.style.setProperty('--tc', TC[m]); k.appendChild(el('div', 'mini', 'Sound: ' + VNAMES[m][S.voice[m]]));
  const g = el('div', 'ctl'), b = P.drum + m * 33 + S.voice[m] * 3; slider(b, 'Level', g); slider(b + 1, 'Tune', g); slider(b + 2, 'Decay', g); k.appendChild(g); frag.appendChild(k);
  return frag;
}
function melodic(m) {
  const acid = m === 2, arr = acid ? S.pat.acid : S.pat.poly, frag = document.createDocumentFragment(), c = el('div', 'card'); c.style.setProperty('--tc', TC[m]);
  c.appendChild(el('div', 'mini', acid ? 'Tap a square to put a note on that step. Tap it again to remove it.' : 'Tap a square to put a chord on that step. Pick the chord type below the grid.'));
  const roll = el('div', 'roll');
  for (let n = 12; n >= 0; n--) {
    const blk = [1, 3, 6, 8, 10].indexOf(n) >= 0, row = el('div', 'rrow' + (blk ? ' blk' : '')); row.appendChild(el('div', 'rname', NOTES[n]));
    const st = el('div', 'steps');
    for (let i = 0; i < STEPS; i++) { const on = arr[i].gate && arr[i].note === n, b = el('button', 'st' + (i % 4 === 0 ? ' b' : '') + (on ? ' on' : '')); b.dataset.i = i; b.setAttribute('aria-label', NOTES[n] + ' step ' + (i + 1) + (on ? ' on' : ' off'));
      b.onclick = () => { const a = arr[i]; if (a.gate && a.note === n) a.gate = 0; else { a.gate = 1; a.note = n; if (!acid && !a.chord) a.chord = 1; ensureAudio().then(() => { if (!S.playing) previewNote(m, a); }); } sendPat(); renderPanel(); }; st.appendChild(b); }
    row.appendChild(st); roll.appendChild(row);
  }
  c.appendChild(roll);
  const lane = (label, fn) => { const row = el('div', 'rrow'); row.appendChild(el('div', 'rname', label)); const st = el('div', 'steps'); for (let i = 0; i < STEPS; i++) st.appendChild(fn(i)); row.appendChild(st); c.appendChild(row); };
  if (acid) {
    lane('Accent', i => { const b = el('button', 'st' + (arr[i].accent ? ' on' : '')); b.dataset.i = i; b.setAttribute('aria-label', 'Accent step ' + (i + 1)); b.onclick = () => { arr[i].accent = arr[i].accent ? 0 : 1; sendPat(); renderPanel(); }; return b; });
    lane('Slide', i => { const b = el('button', 'st' + (arr[i].slide ? ' on' : '')); b.dataset.i = i; b.setAttribute('aria-label', 'Slide step ' + (i + 1)); b.onclick = () => { arr[i].slide = arr[i].slide ? 0 : 1; sendPat(); renderPanel(); }; return b; });
  } else {
    lane('Chord', i => { const b = el('button', 'st' + (arr[i].gate ? ' on' : ''), arr[i].gate ? '<span style="font-size:.55rem">' + CHORDN[arr[i].chord] + '</span>' : ''); b.dataset.i = i; b.setAttribute('aria-label', 'Chord step ' + (i + 1)); b.onclick = () => { if (!arr[i].gate) return; arr[i].chord = arr[i].chord % 6 + 1; sendPat(); renderPanel(); }; return b; });
  }
  lane('Octave', i => { const b = el('button', 'st', arr[i].gate ? '<span style="font-size:.55rem">' + OCTN[arr[i].oct] + '</span>' : ''); b.dataset.i = i; b.setAttribute('aria-label', 'Octave step ' + (i + 1)); b.onclick = () => { if (!arr[i].gate) return; arr[i].oct = (arr[i].oct + 1) % 3; sendPat(); renderPanel(); }; return b; });
  c.appendChild(el('div', 'mini', acid ? 'Accent adds a punch. Slide glides into the next note. Octave: tap a note\'s octave box to go low, mid or high.' : 'Tap a chord box to change the chord. Tap an octave box to go low, mid or high.'));
  frag.appendChild(c);
  const k = el('div', 'card'); k.style.setProperty('--tc', TC[m]); k.appendChild(el('div', 'mini', acid ? 'Acid bass sound' : 'Poly synth sound'));
  const g = el('div', 'ctl'), base = acid ? P.acid : P.poly, n = acid ? AC.length : PY.length;
  for (let i = 0; i < n; i++) { const s = SPEC[base + i]; if (s.labels) { const w = el('div'); w.appendChild(el('div', 'mini', s.n)); w.appendChild(seg(s.labels, Math.round(S.values[base + i]), kk => { S.values[base + i] = kk; sendValues(); save(); renderPanel(); })); g.appendChild(w); } else slider(base + i, null, g); }
  k.appendChild(g); frag.appendChild(k); return frag;
}
function previewNote(m, a) {
  const note = m === 2 ? 36 + a.note + (a.oct - 1) * 12 : 48 + a.note + (a.oct - 1) * 12;
  if (m === 2) { post({ on: [2, note, a.accent ? 1 : 0.7] }); setTimeout(() => post({ off: [2, note] }), 300); }
  else { const iv = [[0], [0, 4, 7], [0, 3, 7], [0, 4, 7, 11], [0, 3, 7, 10], [0, 5, 7], [0, 7, 12]][a.chord || 1]; iv.forEach(x => post({ on: [3, note + x, 0.8] })); setTimeout(() => iv.forEach(x => post({ off: [3, note + x] })), 500); }
}
function renderPanel() {
  const p = $('#panel'); p.innerHTML = ''; p.appendChild(machineBar(S.tab));
  p.appendChild(S.tab < 2 ? drumPanel(S.tab) : melodic(S.tab));
  renderKeys(); paintCursor();
}
function paintCursor() {
  document.querySelectorAll('.st.cur').forEach(e => e.classList.remove('cur'));
  if (S.step >= 0) document.querySelectorAll('#panel .st[data-i="' + S.step + '"]').forEach(e => e.classList.add('cur'));
}
/* live keys / pads */
const down = new Map();
function renderKeys() {
  const k = $('#keys'); k.innerHTML = ''; const m = S.tab; k.style.setProperty('--tc', TC[m]);
  if (m < 2) {
    k.appendChild(el('div', 'mini', 'Drum pads: play along'));
    const pads = el('div', 'pads');
    VNAMES[m].forEach((n, v) => { const b = el('button', 'pad', n); b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('dn'); ensureAudio().then(() => post({ hit: [m, v, 0.9] })); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.remove('dn'))); pads.appendChild(b); });
    k.appendChild(pads);
  } else {
    const r = el('div', 'row sp'); r.appendChild(el('div', 'mini', 'Keyboard: play along'));
    const oc = seg(['Low', 'Mid', 'High'], S.oct, kk => { S.oct = kk; renderKeys(); }); oc.style.width = '210px'; r.appendChild(oc); k.appendChild(r);
    const kb = el('div', 'kb'); const blk = [1, 3, 6, 8, 10];
    const base = (m === 2 ? 36 : 48) + (S.oct - 1) * 12;
    for (let n = 0; n <= 12; n++) {
      const b = el('div', 'key' + (blk.indexOf(n) >= 0 ? ' bk' : ''), NOTES[n]); b.dataset.n = n;
      b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { } b.classList.add('dn'); const note = base + n; down.set(e.pointerId, note); ensureAudio().then(() => post({ on: [m, note, 0.8] })); });
      const up = e => { b.classList.remove('dn'); if (down.has(e.pointerId)) { post({ off: [m, down.get(e.pointerId)] }); down.delete(e.pointerId); } };
      ['pointerup', 'pointercancel'].forEach(ev => b.addEventListener(ev, up)); kb.appendChild(b);
    }
    k.appendChild(kb);
  }
}
function renderAll() { renderTabs(); renderPanel(); syncTop(); }
function syncTop() { $('#bpm').textContent = S.tempo; $('#swing').value = S.values[P.swing]; $('#master').value = S.values[P.master]; const p = $('#play'); p.setAttribute('aria-pressed', S.playing); p.innerHTML = S.playing ? '&#9632; Stop' : '&#9654; Play'; }
async function togglePlay() {
  try { await ensureAudio(); if (ctx.state !== 'running') await ctx.resume(); } catch (e) { return; }
  S.playing = !S.playing; post({ play: S.playing }); if (!S.playing) { S.step = -1; paintCursor(); } syncTop();
}
function setTempo(t) { S.tempo = Math.max(40, Math.min(240, t)); post({ tempo: S.tempo }); syncTop(); save(); }
document.addEventListener('DOMContentLoaded', () => {
  load(); renderAll();
  $('#play').onclick = togglePlay; $('#bpmd').onclick = () => setTempo(S.tempo - 2); $('#bpmu').onclick = () => setTempo(S.tempo + 2);
  $('#swing').oninput = e => { S.values[P.swing] = +e.target.value; sendValues(); }; $('#swing').onchange = save;
  $('#master').oninput = e => { S.values[P.master] = +e.target.value; sendValues(); }; $('#master').onchange = save;
  addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|BUTTON/.test(e.target.tagName)) { e.preventDefault(); togglePlay(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.playing) togglePlay(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
});

/* iPhone: sound can only start from a finished tap; unlock on every touchend/click until running */
(function () {
  function g() { try { unlockIOS(); ensureAudio().then(() => { if (ctx && ctx.state !== 'running') return ctx.resume(); }).catch(() => { }); if (ctx && ctx.state === 'running') ['touchend', 'pointerup', 'click'].forEach(t => removeEventListener(t, g, true)); } catch (e) { } }
  ['touchend', 'pointerup', 'click'].forEach(t => addEventListener(t, g, true));
})();
