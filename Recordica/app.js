'use strict';
/* Recordica Web: record, import, beat, mix, export. Everything stays in your browser. */
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const COLORS = ['#ff7a59', '#ff5d8f', '#7be0c3', '#8fb4ff', '#f0c46a', '#c79bff', '#9be15d', '#ffa3d7'];
const DR = [['kick', 'Kick'], ['snare', 'Snare'], ['clap', 'Clap'], ['hat', 'Closed Hat'], ['ohat', 'Open Hat'], ['tom', 'Tom']];
const KEY = 'recordica.web.v1';
let uid = 1; const nid = p => p + (uid++) + '_' + Math.random().toString(36).slice(2, 6);

const S = { bpm: 100, tracks: [], clips: [], beat: { on: true, vol: 0.8, mute: false, pat: {} }, loop: { on: false, a: 1, b: 5 }, count: true, metro: false, snap: true, pps: 60, sel: null, armed: null, master: 0.7 };
DR.forEach(d => S.beat.pat[d[0]] = new Array(16).fill(0));
const BUF = new Map(), BLOB = new Map();
const beatSec = () => 60 / S.bpm, barSec = () => 240 / S.bpm, stepSec = () => 15 / S.bpm;
const msg = (t, err) => { const m = $('#msg'); m.textContent = t; m.className = err ? 'err' : ''; };

/* ---------- storage ---------- */
let idb = null;
const idbOpen = () => new Promise(res => { try { const r = indexedDB.open('recordica-web', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
const idbPut = (k, v) => new Promise(res => { if (!idb) return res(); try { const t = idb.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(v, k); t.oncomplete = res; t.onerror = res; } catch (e) { res(); } });
const idbGet = k => new Promise(res => { if (!idb) return res(null); try { const q = idb.transaction('blobs').objectStore('blobs').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } });
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ bpm: S.bpm, tracks: S.tracks, clips: S.clips, beat: S.beat, loop: S.loop, count: S.count, metro: S.metro, snap: S.snap, armed: S.armed, master: S.master })); } catch (e) { msg('Could not autosave (browser storage full or blocked).', 1); } }, 400); }
async function decodeBlob(blob) { const ab = await blob.arrayBuffer(); const oc = new OfflineAudioContext(2, 1, 44100); return await oc.decodeAudioData(ab); }
async function load() {
  idb = await idbOpen();
  let o = null; try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
  if (o && Array.isArray(o.tracks) && o.tracks.length) {
    S.bpm = Math.min(240, Math.max(40, +o.bpm || 100)); S.tracks = o.tracks; S.clips = Array.isArray(o.clips) ? o.clips : [];
    if (o.beat && o.beat.pat) { S.beat.on = o.beat.on !== false; S.beat.vol = +o.beat.vol || 0.8; S.beat.mute = !!o.beat.mute; DR.forEach(d => { const a = o.beat.pat[d[0]]; if (Array.isArray(a) && a.length === 16) S.beat.pat[d[0]] = a.map(x => x ? 1 : 0); }); }
    if (o.loop) S.loop = { on: !!o.loop.on, a: Math.max(1, o.loop.a | 0 || 1), b: Math.max(2, o.loop.b | 0 || 5) };
    S.count = o.count !== false; S.metro = !!o.metro; S.snap = o.snap !== false; S.armed = o.armed; S.master = o.master == null ? 0.9 : +o.master;
    const miss = [];
    for (const c of S.clips) { if (BUF.has(c.buf)) continue; const b = await idbGet(c.buf); if (b) { try { BLOB.set(c.buf, b); BUF.set(c.buf, await decodeBlob(b)); } catch (e) { miss.push(c.buf); } } else miss.push(c.buf); }
    if (miss.length) { S.clips = S.clips.filter(c => BUF.has(c.buf)); msg('Some audio from your last session could not be restored and was removed.', 1); }
  } else { for (let i = 0; i < 3; i++) addTrack(true); }
  if (!S.tracks.find(t => t.id === S.armed)) S.armed = S.tracks[0].id;
}
function addTrack(quiet) { const n = S.tracks.length; const t = { id: nid('t'), name: 'Track ' + (n + 1), vol: 0.85, pan: 0, mute: false, solo: false, color: COLORS[n % COLORS.length] }; S.tracks.push(t); if (!S.armed) S.armed = t.id; if (!quiet) { renderAll(); save(); } return t; }

/* ---------- audio graph ---------- */
let ctx = null, master = null, mAn = null, T = { playing: false, segs: [], nodes: [], recording: false }, trackNodes = {}, noiseBuf = null;
function mkNoise(c) { const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function buildMix(c, dest, live) {
  const m = c.createGain(); m.gain.value = S.master; const lim = c.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 3; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.15; m.connect(lim); lim.connect(dest); let an = null;
  if (live) { an = c.createAnalyser(); an.fftSize = 1024; m.connect(an); }
  const tn = {}, anySolo = S.tracks.some(t => t.solo);
  S.tracks.forEach(t => { const g = c.createGain(), p = c.createStereoPanner(); g.connect(p); p.connect(m); p.pan.value = t.pan; g.gain.value = trackGain(t, anySolo); let a = null; if (live) { a = c.createAnalyser(); a.fftSize = 512; p.connect(a); } tn[t.id] = { g, p, a }; });
  const bg = c.createGain(); bg.gain.value = (S.beat.on && !S.beat.mute) ? S.beat.vol : 0; bg.connect(m); let ba = null; if (live) { ba = c.createAnalyser(); ba.fftSize = 512; bg.connect(ba); } tn.beat = { g: bg, a: ba };
  const cl = c.createGain(); cl.gain.value = 0.6; cl.connect(m); tn.click = { g: cl };
  return { m, an, tn };
}
function trackGain(t, anySolo) { return anySolo ? (t.solo ? t.vol : 0) : (t.mute ? 0 : t.vol); }
function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const mix = buildMix(ctx, ctx.destination, true); master = mix.m; mAn = mix.an; trackNodes = mix.tn; noiseBuf = mkNoise(ctx);
  }
  S.tracks.forEach(t => { if (!trackNodes[t.id]) syncGraph(true); });
  return ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
}
function syncGraph(rebuildMissing) {
  if (!ctx) return; const anySolo = S.tracks.some(t => t.solo), tt = ctx.currentTime;
  S.tracks.forEach(t => {
    let n = trackNodes[t.id];
    if (!n && rebuildMissing) { const g = ctx.createGain(), p = ctx.createStereoPanner(), a = ctx.createAnalyser(); a.fftSize = 512; g.connect(p); p.connect(master); p.connect(a); n = trackNodes[t.id] = { g, p, a }; }
    if (n) { n.g.gain.setTargetAtTime(trackGain(t, anySolo), tt, 0.015); n.p.pan.setTargetAtTime(t.pan, tt, 0.015); }
  });
  trackNodes.beat.g.gain.setTargetAtTime((S.beat.on && !S.beat.mute) ? S.beat.vol : 0, tt, 0.015); master.gain.setTargetAtTime(S.master, tt, 0.015);
}

/* ---------- drum + click synthesis ---------- */
function env(c, dest, t, peak, dec) { const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); g.connect(dest); return g; }
function noiseSrc(c, nb, t, dur) { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s; }
function hit(c, dest, nb, name, t, v) {
  v = v || 1;
  if (name === 'kick') { const o = c.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); const g = env(c, dest, t, 1.0 * v, 0.45); o.connect(g); o.start(t); o.stop(t + 0.5); }
  else if (name === 'snare') { const n = noiseSrc(c, nb, t, 0.25), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500; n.connect(f); f.connect(env(c, dest, t, 0.7 * v, 0.2)); const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08); o.connect(env(c, dest, t, 0.6 * v, 0.12)); o.start(t); o.stop(t + 0.2); }
  else if (name === 'clap') { const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 0.9; const n = noiseSrc(c, nb, t, 0.4); n.connect(f); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);[0, 0.011, 0.022].forEach(d => { g.gain.setValueAtTime(0.8 * v, t + d); g.gain.exponentialRampToValueAtTime(0.1, t + d + 0.009); }); g.gain.setValueAtTime(0.8 * v, t + 0.033); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); f.connect(g); g.connect(dest); }
  else if (name === 'hat' || name === 'ohat') { const dec = name === 'hat' ? 0.05 : 0.3, n = noiseSrc(c, nb, t, dec + 0.05), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; n.connect(f); f.connect(env(c, dest, t, 0.45 * v, dec)); }
  else if (name === 'tom') { const o = c.createOscillator(); o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.2); o.connect(env(c, dest, t, 0.9 * v, 0.4)); o.start(t); o.stop(t + 0.45); }
}
function clickAt(c, dest, t, accent) { const o = c.createOscillator(); o.frequency.value = accent ? 1600 : 1000; o.connect(env(c, dest, t, 0.5, 0.04)); o.start(t); o.stop(t + 0.05); }

/* ---------- transport ---------- */
const songEnd = () => Math.max(0, ...S.clips.map(c => c.start + c.dur));
const loopRange = () => S.loop.on ? [(S.loop.a - 1) * barSec(), (S.loop.b - 1) * barSec()] : null;
function schedClips(c, tn, from, to, ct, nodes) {
  S.clips.forEach(cl => {
    const b = BUF.get(cl.buf), n = tn[cl.track]; if (!b || !n) return;
    const cs = cl.start, ce = cl.start + cl.dur; if (ce <= from || cs >= to) return;
    const a = Math.max(cs, from), z = Math.min(ce, to), s = c.createBufferSource(); s.buffer = b; s.connect(n.g);
    s.start(ct + (a - from), cl.off + (a - cs), z - a); nodes && nodes.push(s);
  });
}
function schedGrid(c, tn, nb, a, z, ct0, opts) { // drums + click for song time [a,z), song time s plays at ct0 + (s - segFrom)
  const st = stepSec();
  if (opts.beat && S.beat.on) for (let k = Math.ceil(a / st - 1e-9); k * st < z - 1e-9; k++) { const s = k * st, i = ((k % 16) + 16) % 16; DR.forEach(d => { if (S.beat.pat[d[0]][i]) hit(c, tn.beat.g, nb, d[0], opts.ct(s), i % 4 === 0 ? 1 : 0.85); }); }
  if (opts.click) { const bs = beatSec(); for (let k = Math.ceil(a / bs - 1e-9); k * bs < z - 1e-9; k++) clickAt(c, tn.click.g, opts.ct(k * bs), k % 4 === 0); }
}
function startSeg(from, ct) {
  const lr = loopRange(), to = lr && from < lr[1] ? lr[1] : Infinity;
  const seg = { from, to, ct, upto: from }; T.segs.push(seg); if (T.segs.length > 4) T.segs.shift();
  schedClips(ctx, trackNodes, from, to === Infinity ? 1e9 : to, ct, T.nodes); return seg;
}
function tick() {
  if (!T.playing) return; const seg = T.segs[T.segs.length - 1], now = ctx.currentTime, look = 0.3;
  const wantTo = Math.min(seg.to, seg.from + (now + look - seg.ct));
  if (wantTo > seg.upto) { const ctOf = s => seg.ct + (s - seg.from); schedGrid(ctx, trackNodes, noiseBuf, seg.upto, wantTo, seg.ct, { beat: true, click: S.metro || T.counting, ct: ctOf }); seg.upto = wantTo; }
  if (seg.to !== Infinity && seg.upto >= seg.to - 1e-9 && now + look >= seg.ct + (seg.to - seg.from) - 0.05) { const lr = loopRange(); if (lr) startSeg(lr[0], seg.ct + (seg.to - seg.from)); else { /* loop turned off: carry on past the end */ startSeg(seg.to, seg.ct + (seg.to - seg.from)); } }
}
function position() {
  if (!T.playing) return T.pos || 0; const now = ctx.currentTime; let seg = null;
  for (let i = T.segs.length - 1; i >= 0; i--) if (T.segs[i].ct <= now) { seg = T.segs[i]; break; }
  if (!seg) return T.segs[0].from; return Math.min(seg.to, seg.from + (now - seg.ct));
}
async function play(from, withRec) {
  try { await ensureAudio(); } catch (e) { return msg('Sound could not start.', 1); }
  stopPlay(true); T.pos = from == null ? (T.pos || 0) : from; syncGraph();
  const count = withRec && S.count ? barSec() : 0, ct = ctx.currentTime + 0.1 + count;
  T.counting = false; T.playing = true; T.segs = []; T.nodes = [];
  if (count) { // count-in: clicks only, before song time T.pos
    for (let i = 0; i < 4; i++) clickAt(ctx, trackNodes.click.g, ct - count + i * beatSec(), i === 0);
  }
  startSeg(T.pos, ct); T.timer = setInterval(tick, 25); tick(); syncUI();
  return ct;
}
function stopPlay(quiet) {
  if (T.playing) { T.pos = position(); }
  T.playing = false; clearInterval(T.timer); T.nodes.forEach(n => { try { n.stop(); } catch (e) { } try { n.disconnect(); } catch (e) { } }); T.nodes = [];
  if (ctx) { // silence anything already scheduled (drum voices): quick master dip
    const tt = ctx.currentTime; master.gain.cancelScheduledValues(tt); master.gain.setValueAtTime(0, tt); master.gain.setTargetAtTime(S.master, tt + 0.08, 0.01);
  }
  if (!quiet) syncUI();
}
/* ---------- recording ---------- */
let stream = null, mr = null, recChunks = [], inAn = null, inCtxSrc = null;
async function getStream() {
  if (stream && stream.active) return stream;
  const dev = $('#inSel') && $('#inSel').value;
  stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: dev ? { exact: dev } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
  await ensureAudio(); inCtxSrc = ctx.createMediaStreamSource(stream); inAn = ctx.createAnalyser(); inAn.fftSize = 512; inCtxSrc.connect(inAn);
  try { const ds = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput'); const s = $('#inSel'); if (s && s.options.length <= 1) { s.innerHTML = ''; ds.forEach(d => { const o = el('option'); o.value = d.deviceId; o.textContent = d.label || 'Input'; s.appendChild(o); }); const cur = stream.getAudioTracks()[0].getSettings().deviceId; if (cur) s.value = cur; } } catch (e) { }
  return stream;
}
async function startRec() {
  if (T.recording) return; if (!navigator.mediaDevices || !window.MediaRecorder) return msg('This browser cannot record audio. Try Chrome, Edge or Firefox.', 1);
  const tr = S.tracks.find(t => t.id === S.armed); if (!tr) return msg('Pick a track to record on (the R button).', 1);
  try { await getStream(); } catch (e) { return msg('Microphone blocked or not found. Allow the microphone for this page, then try again.', 1); }
  const startPos = T.playing ? position() : (T.pos || 0);
  recChunks = []; mr = new MediaRecorder(stream); const t0 = ctx.currentTime; mr.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
  mr.start(100); T.recording = true; T.recTrack = tr.id;
  const ct = await play(startPos, true); T.recStart = startPos; T.recCt = ct; T.recT0 = t0; syncUI();
  msg(S.count ? 'Count-in, then recording on “' + tr.name + '”. Press Stop when done.' : 'Recording on “' + tr.name + '”. Press Stop when done.');
}
async function stopRec() {
  if (!T.recording) return; T.recording = false; const m = mr, tid = T.recTrack, startPos = T.recStart, lead = Math.max(0, T.recCt - T.recT0), lat = (+($('#lat') && $('#lat').value) || 0) / 1000;
  stopPlay(); syncUI();
  await new Promise(r => { m.onstop = r; try { m.stop(); } catch (e) { r(); } });
  const blob = new Blob(recChunks, { type: m.mimeType || 'audio/webm' });
  try {
    const buf = await decodeBlob(blob), off = Math.min(buf.duration - 0.05, Math.max(0, lead + lat)), dur = buf.duration - off; if (dur <= 0.05) return msg('That recording was empty.', 1);
    const id = nid('b'); BUF.set(id, buf); BLOB.set(id, blob); await idbPut(id, blob);
    S.clips.push({ id: nid('c'), track: tid, start: startPos, off, dur, buf: id, name: 'Take' }); renderAll(); save(); msg('Recorded ' + dur.toFixed(1) + ' s. Press Play to hear it. If it sounds late, nudge “Latency” and record again.');
  } catch (e) { msg('Could not read that recording.', 1); }
}
async function importFiles(files) {
  const tid = S.armed; let n = 0;
  for (const f of files) {
    try { const blob = f; const buf = await decodeBlob(blob), id = nid('b'); BUF.set(id, buf); BLOB.set(id, blob); await idbPut(id, blob);
      const tr = S.tracks.find(t => t.id === tid) || S.tracks[0]; const start = S.clips.filter(c => c.track === tr.id).reduce((m, c) => Math.max(m, c.start + c.dur), 0);
      S.clips.push({ id: nid('c'), track: tr.id, start: n ? start : (T.pos || 0), off: 0, dur: buf.duration, buf: id, name: f.name.replace(/\.[^.]+$/, '') }); n++; }
    catch (e) { msg('Could not read “' + f.name + '” as audio.', 1); }
  }
  if (n) { renderAll(); save(); msg('Imported ' + n + ' file' + (n > 1 ? 's' : '') + ' onto the armed track.'); }
}
/* ---------- export ---------- */
function wav16(buf) {
  const ch = buf.numberOfChannels, n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2)); const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, d[c][i])); out.setInt16(o, v < 0 ? v * 32768 : v * 32767, true); o += 2; }
  return new Blob([out], { type: 'audio/wav' });
}
async function exportWav() {
  const hasBeat = S.beat.on && !S.beat.mute && Object.values(S.beat.pat).some(a => a.some(x => x)); let len = songEnd();
  if (!len && !hasBeat) return msg('Nothing to export yet. Record, import or make a beat first.', 1); if (!len) len = 4 * barSec(); if (hasBeat) len = Math.ceil(len / barSec()) * barSec();
  len += 1.5; msg('Rendering…'); stopPlay();
  try {
    const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(len * sr), sr), mix = buildMix(oc, oc.destination, false), nb = mkNoise(oc);
    schedClips(oc, mix.tn, 0, 1e9, 0, null); schedGrid(oc, mix.tn, nb, 0, len, 0, { beat: true, click: false, ct: s => s });
    const r = await oc.startRendering(); let pk = 0; for (let c = 0; c < 2; c++) { const d = r.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; } }
    const a = el('a'); a.href = URL.createObjectURL(wav16(r)); a.download = 'recordica-mix.wav'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    const db = pk > 0 ? 20 * Math.log10(pk) : -Infinity; msg('Exported recordica-mix.wav (' + len.toFixed(1) + ' s, 16-bit). Peak ' + (isFinite(db) ? db.toFixed(1) + ' dB' : 'silent') + (pk > 1 ? ' — it clipped; turn the faders or Master down and export again.' : '.'), pk > 1);
  } catch (e) { msg('Export failed: ' + (e && e.message || e), 1); }
}

/* ---------- screen ---------- */
const W = () => Math.max(900, Math.ceil((Math.max(songEnd(), 8 * barSec()) + 4 * barSec()) * S.pps));
function renderHeads() {
  const h = $('#heads'); h.innerHTML = '<div class="hh">Tracks</div>';
  S.tracks.forEach(t => {
    const d = el('div', 'th' + (t.id === S.armed ? ' armed' : '')); d.style.setProperty('--c', t.color);
    const nm = el('input'); nm.type = 'text'; nm.value = t.name; nm.setAttribute('aria-label', 'Track name'); nm.onchange = () => { t.name = nm.value.slice(0, 24) || 'Track'; renderMixer(); save(); }; d.appendChild(nm);
    const r = el('div', 'r'), arm = el('button', t.id === S.armed ? 'on' : '', 'R'); arm.title = 'Record here'; arm.setAttribute('aria-label', 'Arm for recording'); arm.setAttribute('aria-pressed', t.id === S.armed); arm.onclick = () => { S.armed = t.id; renderHeads(); save(); };
    const mu = el('button', t.mute ? 'on' : '', 'M'), so = el('button', t.solo ? 'on' : '', 'S'), dl = el('button', '', '✕'); mu.title = 'Mute'; so.title = 'Solo'; dl.title = 'Delete track and its clips';
    mu.onclick = () => { t.mute = !t.mute; syncGraph(); renderHeads(); renderMixer(); save(); }; so.onclick = () => { t.solo = !t.solo; syncGraph(); renderHeads(); renderMixer(); save(); };
    dl.onclick = () => { if (S.tracks.length < 2) return msg('Keep at least one track.', 1); if (S.clips.some(c => c.track === t.id) && !confirm('Delete “' + t.name + '” and its recordings?')) return; S.tracks = S.tracks.filter(x => x !== t); S.clips = S.clips.filter(c => c.track !== t.id); if (S.armed === t.id) S.armed = S.tracks[0].id; try { trackNodes[t.id] && trackNodes[t.id].p.disconnect(); } catch (e) { } delete trackNodes[t.id]; renderAll(); save(); };
    r.append(arm, mu, so, dl); d.appendChild(r); h.appendChild(d);
  });
}
function drawWave(cv, buf, off, dur) {
  const w = Math.min(4000, Math.max(8, Math.ceil(dur * S.pps))), h = 60; cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.85)'; const d = buf.getChannelData(0), sr = buf.sampleRate, per = dur * sr / w, o0 = off * sr;
  for (let x = 0; x < w; x++) { let mn = 1, mx = -1; const a = Math.floor(o0 + x * per), z = Math.min(d.length, Math.floor(a + per) + 1); const step = Math.max(1, ((z - a) / 40) | 0); for (let i = a; i < z; i += step) { const v = d[i]; if (v < mn) mn = v; if (v > mx) mx = v; } if (mx < mn) { mn = mx = 0; } g.fillRect(x, h / 2 - mx * h / 2, 1, Math.max(1, (mx - mn) * h / 2)); }
}
function renderLanes() {
  const L = $('#lanes'); L.innerHTML = ''; const w = W(); L.style.width = w + 'px'; $('#ruler').style.width = w + 'px';
  S.tracks.forEach(t => {
    const lane = el('div', 'lane'); lane.style.width = w + 'px'; lane.dataset.t = t.id; lane.style.backgroundSize = (beatSec() * S.pps) + 'px 100%'; lane.style.setProperty('--c', t.color);
    lane.onpointerdown = e => { if (e.target === lane) { S.sel = null; seek(xToSec(e)); S.armed = t.id; renderHeads(); renderLanes(); } };
    S.clips.filter(c => c.track === t.id).forEach(c => {
      const b = BUF.get(c.buf); if (!b) return; const d = el('div', 'clip' + (S.sel === c.id ? ' sel' : '')); d.style.left = c.start * S.pps + 'px'; d.style.width = Math.max(6, c.dur * S.pps) + 'px'; d.style.setProperty('--c', t.color); d.tabIndex = 0; d.setAttribute('aria-label', 'Clip ' + c.name);
      const cv = el('canvas'); d.appendChild(cv); d.appendChild(el('span', '', c.name || 'Clip')); drawWave(cv, b, c.off, c.dur);
      d.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); S.sel = c.id; document.querySelectorAll('.clip.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); d.focus(); const x0 = e.clientX, s0 = c.start; d.setPointerCapture(e.pointerId); let moved = false;
        d.onpointermove = ev => { let s = Math.max(0, s0 + (ev.clientX - x0) / S.pps); if (S.snap) { const q = beatSec() / 4; s = Math.round(s / q) * q; } if (Math.abs(ev.clientX - x0) > 3) moved = true; c.start = s; d.style.left = s * S.pps + 'px'; };
        d.onpointerup = ev => { d.onpointermove = d.onpointerup = null; if (moved) { renderAll(); save(); } else if (ev.target) { /* click selects only */ } }; };
      lane.appendChild(d);
    }); L.appendChild(lane);
  });
  if (!S.clips.length) { const e = el('div', 'empty', ''); e.style.cssText = 'position:absolute;left:12px;top:40px;pointer-events:none;color:var(--mu)'; e.textContent = 'No audio yet — Rec, or Import audio.'; L.style.position = 'relative'; L.appendChild(e); }
}
function renderRuler() {
  const r = $('#ruler'); r.innerHTML = ''; const bars = Math.ceil(W() / (barSec() * S.pps));
  for (let i = 0; i < bars; i++) { const t = el('div', 'tick b', String(i + 1)); t.style.left = i * barSec() * S.pps + 'px'; r.appendChild(t); }
  const lr = loopRange(); if (lr) { const d = el('div', 'loopr'); d.style.left = lr[0] * S.pps + 'px'; d.style.width = (lr[1] - lr[0]) * S.pps + 'px'; r.appendChild(d); }
}
function renderBeat() {
  const b = $('#beat'); b.innerHTML = ''; b.appendChild(el('h3', '', 'Beat maker'));
  const bm = el('div', 'bm'), on = el('button', S.beat.on ? 'on' : '', S.beat.on ? 'Beat on' : 'Beat off'); on.setAttribute('aria-pressed', S.beat.on); on.onclick = () => { S.beat.on = !S.beat.on; syncGraph(); renderBeat(); save(); };
  const ex = el('button', '', 'Example'), cl = el('button', '', 'Clear'), rn = el('button', '', 'Random');
  ex.onclick = () => { DR.forEach(d => S.beat.pat[d[0]].fill(0));[0, 4, 8, 12].forEach(i => S.beat.pat.kick[i] = 1);[4, 12].forEach(i => S.beat.pat.snare[i] = 1);[0, 2, 4, 6, 8, 10, 12, 14].forEach(i => S.beat.pat.hat[i] = 1); S.beat.pat.ohat[14] = 1; renderBeat(); save(); };
  cl.onclick = () => { DR.forEach(d => S.beat.pat[d[0]].fill(0)); renderBeat(); save(); };
  rn.onclick = () => { DR.forEach(d => S.beat.pat[d[0]].fill(0)); for (let i = 0; i < 16; i += 4) S.beat.pat.kick[i] = 1; if (Math.random() < .6) S.beat.pat.kick[6 + (Math.random() * 3 | 0) * 4 % 10] = 1; S.beat.pat.snare[4] = S.beat.pat.snare[12] = 1; for (let i = 0; i < 16; i += 2) S.beat.pat.hat[i] = 1; for (let i = 1; i < 16; i += 2) if (Math.random() < .25) S.beat.pat.hat[i] = 1; S.beat.pat.clap[Math.random() < .5 ? 12 : 4] = 1; if (Math.random() < .5) S.beat.pat.tom[(Math.random() * 16) | 0] = 1; renderBeat(); save(); };
  const hint = el('span', '', 'One bar, repeats under the whole song. Tap a square to turn it on or off.'); hint.style.color = 'var(--mu)'; bm.append(on, ex, rn, cl, hint); b.appendChild(bm);
  const g = el('div', 'grid');
  DR.forEach(d => { g.appendChild(el('div', 'n', d[1])); for (let i = 0; i < 16; i++) { const s = el('button', 'st' + (i % 4 === 0 ? ' b' : '') + (S.beat.pat[d[0]][i] ? ' on' : '')); s.dataset.i = i; s.setAttribute('aria-label', d[1] + ' step ' + (i + 1)); s.setAttribute('aria-pressed', !!S.beat.pat[d[0]][i]); s.onclick = () => { const v = S.beat.pat[d[0]][i] ? 0 : 1; S.beat.pat[d[0]][i] = v; s.classList.toggle('on', !!v); s.setAttribute('aria-pressed', !!v); if (v) ensureAudio().then(() => { if (!T.playing) hit(ctx, trackNodes.beat.g, noiseBuf, d[0], ctx.currentTime + 0.01, 0.9); }); save(); }; g.appendChild(s); } });
  b.appendChild(g);
}
const meters = [];
function renderMixer() {
  const m = $('#mixer'); m.innerHTML = ''; meters.length = 0;
  const strip = (name, color, obj, key, extra) => {
    const d = el('div', 'strip'); d.style.setProperty('--c', color); d.appendChild(el('b', '', name));
    const f = el('div', 'fad'), s = el('input'); s.type = 'range'; s.className = 'v'; s.min = 0; s.max = 1.25; s.step = 0.01; s.value = obj[key]; s.setAttribute('aria-label', name + ' volume'); s.oninput = () => { obj[key] = +s.value; syncGraph(); }; s.onchange = save; const mt = el('div', 'meter'), bar = el('i'); mt.appendChild(bar); f.append(s, mt); d.appendChild(f); extra && extra(d); return { d, bar };
  };
  S.tracks.forEach(t => {
    const x = strip(t.name, t.color, t, 'vol', d => { const l = el('label', '', 'Pan'), p = el('input'); p.type = 'range'; p.min = -1; p.max = 1; p.step = 0.05; p.value = t.pan; p.setAttribute('aria-label', t.name + ' pan'); p.oninput = () => { t.pan = +p.value; syncGraph(); }; p.onchange = save; l.appendChild(p); d.appendChild(l); const r = el('div', 'r'), mu = el('button', t.mute ? 'on' : '', 'M'), so = el('button', t.solo ? 'on' : '', 'S'); mu.onclick = () => { t.mute = !t.mute; syncGraph(); renderHeads(); renderMixer(); save(); }; so.onclick = () => { t.solo = !t.solo; syncGraph(); renderHeads(); renderMixer(); save(); }; r.append(mu, so); d.appendChild(r); });
    m.appendChild(x.d); meters.push({ id: t.id, bar: x.bar });
  });
  const bx = strip('Beat', '#ffd36e', S.beat, 'vol', d => { const r = el('div', 'r'), mu = el('button', S.beat.mute ? 'on' : '', 'M'); mu.onclick = () => { S.beat.mute = !S.beat.mute; syncGraph(); renderMixer(); save(); }; r.appendChild(mu); d.appendChild(r); }); m.appendChild(bx.d); meters.push({ id: 'beat', bar: bx.bar });
  const mx = strip('Master', '#ffffff', S, 'master', d => { const l = el('label', '', 'Input'), s = el('select'); s.id = 'inSel'; s.innerHTML = '<option value="">Default mic</option>'; s.onchange = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }; l.appendChild(s); d.appendChild(l); const l2 = el('label', '', 'Latency fix (ms)'), n = el('input'); n.type = 'number'; n.id = 'lat'; n.value = localStorage.getItem('recordica.lat') || 0; n.min = -300; n.max = 500; n.onchange = () => { try { localStorage.setItem('recordica.lat', n.value); } catch (e) { } }; l2.appendChild(n); d.appendChild(l2); });
  m.appendChild(mx.d); meters.push({ id: 'master', bar: mx.bar });
}
function renderAll() { renderHeads(); renderRuler(); renderLanes(); renderBeat(); renderMixer(); syncUI(); }
function syncUI() {
  const p = $('#play'); p.innerHTML = T.playing ? '■ Stop' : '▶ Play'; p.classList.toggle('on', T.playing); p.setAttribute('aria-pressed', T.playing);
  const r = $('#rec'); r.classList.toggle('on', !!T.recording); r.innerHTML = T.recording ? '● Recording' : '● Rec';
  $('#bpm').value = S.bpm; $('#metro').checked = S.metro; $('#count').checked = S.count; $('#snap').checked = S.snap; $('#loopOn').checked = S.loop.on; $('#loopA').value = S.loop.a; $('#loopB').value = S.loop.b;
}
const xToSec = e => { const sc = $('#scroll'), r = sc.getBoundingClientRect(); return Math.max(0, (e.clientX - r.left + sc.scrollLeft) / S.pps); };
function seek(s) { s = Math.max(0, s); if (T.playing) { const wasRec = T.recording; if (wasRec) return; play(s); } else T.pos = s; paintPos(); }
function fmtTime(s) { const bar = Math.floor(s / barSec()), beat = Math.floor((s % barSec()) / beatSec()), m = Math.floor(s / 60); return (bar + 1) + '.' + (beat + 1) + ' · ' + m + ':' + (s % 60).toFixed(1).padStart(4, '0'); }
function paintPos() { const s = T.playing ? position() : (T.pos || 0); $('#time').textContent = fmtTime(s); const ph = $('#ph'), sc = $('#scroll'); ph.style.left = (s * S.pps) + 'px'; if (T.playing) { const x = s * S.pps; if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = Math.max(0, x - 60); } }
function paintSteps() { document.querySelectorAll('#beat .st.cur').forEach(e => e.classList.remove('cur')); if (T.playing && S.beat.on) { const i = Math.floor(position() / stepSec() + 1e-6) % 16; if (position() >= 0) document.querySelectorAll('#beat .st[data-i="' + i + '"]').forEach(e => e.classList.add('cur')); } }
const lvl = (an, buf) => { if (!an) return 0; an.getByteTimeDomainData(buf); let m = 0; for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128) / 128; if (v > m) m = v; } return m; };
let tb = new Uint8Array(512), mb = new Uint8Array(1024);
function frame() {
  paintPos(); paintSteps();
  if (ctx) meters.forEach(m => { const n = m.id === 'master' ? { a: mAn } : trackNodes[m.id]; const v = n && n.a ? lvl(n.a, m.id === 'master' ? mb : tb) : 0; m.bar.style.height = Math.min(100, Math.pow(v, 0.6) * 100) + '%'; });
  requestAnimationFrame(frame);
}
function help() {
  $('#dbody').innerHTML = '<h3>How it works</h3><ul><li><b>Record:</b> pick a track with its <b>R</b> button, wear headphones, press <b>Rec</b>. The first time, allow the microphone. A one-bar count-in plays first.</li><li><b>Import:</b> bring in any audio file (drag it onto the page too).</li><li><b>Edit:</b> drag a clip to move it. Select a clip then press <b>S</b> to split at the playhead, <b>D</b> to duplicate, <b>Delete</b> to remove.</li><li><b>Beat maker:</b> tap squares; it plays under everything.</li><li><b>Mix:</b> faders, pan, mute, solo. <b>Export WAV</b> saves your mix.</li><li><b>Keys:</b> Space play/stop, R record, L loop, Home to start.</li><li>Your project saves in this browser automatically. Clearing site data erases it, so export what you love.</li></ul>';
  $('#dlg').showModal();
}
async function doSplit() { const c = S.clips.find(x => x.id === S.sel); if (!c) return msg('Click a clip first, then press S at the playhead.', 1); const p = T.playing ? position() : (T.pos || 0); if (p <= c.start + 0.05 || p >= c.start + c.dur - 0.05) return msg('Move the playhead inside the clip first.', 1); const a = p - c.start, n = { ...c, id: nid('c'), start: p, off: c.off + a, dur: c.dur - a }; c.dur = a; S.clips.push(n); S.sel = n.id; renderAll(); save(); }
function bind() {
  $('#play').onclick = () => { if (T.recording) return stopRec(); if (T.playing) stopPlay(); else play(T.pos || 0); };
  $('#rec').onclick = () => { if (T.recording) stopRec(); else startRec(); };
  $('#home').onclick = () => { if (T.recording) return; if (T.playing) play(0); else { T.pos = 0; paintPos(); $('#scroll').scrollLeft = 0; } };
  $('#bpm').onchange = e => { S.bpm = Math.min(240, Math.max(40, +e.target.value || 100)); if (T.playing) play(position()); renderAll(); save(); };
  $('#metro').onchange = e => { S.metro = e.target.checked; save(); }; $('#count').onchange = e => { S.count = e.target.checked; save(); }; $('#snap').onchange = e => { S.snap = e.target.checked; save(); };
  $('#loopOn').onchange = e => { S.loop.on = e.target.checked; renderRuler(); if (T.playing && !T.recording) play(position()); save(); };
  const lp = () => { S.loop.a = Math.max(1, +$('#loopA').value | 0 || 1); S.loop.b = Math.max(S.loop.a + 1, +$('#loopB').value | 0 || S.loop.a + 4); $('#loopA').value = S.loop.a; $('#loopB').value = S.loop.b; renderRuler(); save(); };
  $('#loopA').onchange = lp; $('#loopB').onchange = lp;
  $('#addT').onclick = () => addTrack(); $('#imp').onclick = () => $('#file').click(); $('#file').onchange = e => { importFiles([...e.target.files]); e.target.value = ''; };
  $('#exp').onclick = exportWav; $('#help').onclick = help; $('#dclose').onclick = () => $('#dlg').close();
  $('#rulerW').onpointerdown = e => seek(xToSec(e));
  addEventListener('dragover', e => e.preventDefault()); addEventListener('drop', e => { e.preventDefault(); const f = [...(e.dataTransfer.files || [])].filter(x => /^audio\//.test(x.type) || /\.(wav|mp3|m4a|ogg|flac|aac|webm)$/i.test(x.name)); if (f.length) importFiles(f); });
  addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'checkbox') return; if ($('#dlg').open) return;
    if (e.code === 'Space') { e.preventDefault(); $('#play').click(); } else if (e.key === 'r' || e.key === 'R') $('#rec').click(); else if (e.key === 'l' || e.key === 'L') { $('#loopOn').checked = !$('#loopOn').checked; $('#loopOn').onchange({ target: $('#loopOn') }); }
    else if (e.key === 'Home') $('#home').click(); else if (e.key === 's' || e.key === 'S') doSplit();
    else if (e.key === 'd' || e.key === 'D') { const c = S.clips.find(x => x.id === S.sel); if (c) { const n = { ...c, id: nid('c'), start: c.start + c.dur }; S.clips.push(n); S.sel = n.id; renderAll(); save(); } }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (S.sel) { S.clips = S.clips.filter(x => x.id !== S.sel); S.sel = null; renderAll(); save(); } }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && T.playing && !T.recording) stopPlay(); });
}
window.addEventListener('DOMContentLoaded', async () => {
  await load(); bind(); renderAll(); requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  window.__R = { S, T, BUF, play, stopPlay, exportWav, importFiles, position }; // for the self-test
});
