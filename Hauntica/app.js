/* Hauntica: zones (each tied to one output device and channel), scenes (sets of looping sounds per zone), YouTube video windows. */
(function () {
  const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'hauntica-v1';
  const ZN = ['Front porch', 'Hallway', 'Living room', 'Basement'], ZN3 = ['Cave entrance', 'Mossy green', 'Main backyard', 'Living room'];
  const cue = (zone, snd, vol) => ({ zone, snd, vol });
  const MORE = () => [
    { id: 's7', name: "Banshee's wail", cues: [cue(0, 'wind', .5), cue(0, 'banshee', .55), cue(1, 'banshee', .45), cue(1, 'whispers', .4), cue(2, 'choir', .5), cue(2, 'knock', .4), cue(3, 'demon', .5), cue(3, 'heart', .5)] },
    { id: 's8', name: 'Werewolf woods', cues: [cue(0, 'howl', .7), cue(0, 'crickets', .4), cue(0, 'wind', .4), cue(1, 'steps', .5), cue(1, 'breath', .4), cue(2, 'howl', .4), cue(2, 'wind', .3), cue(3, 'demon', .4), cue(3, 'scratch', .5)] },
    { id: 's9', name: "Witch's cauldron", cues: [cue(0, 'wind', .3), cue(0, 'cauldron', .6), cue(1, 'cauldron', .5), cue(1, 'flies', .3), cue(2, 'organ', .5), cue(2, 'cauldron', .4), cue(2, 'whispers', .35), cue(3, 'flies', .5), cue(3, 'drips', .4), cue(3, 'chains', .3)] },
    { id: 's10', name: 'Possessed house', cues: [cue(0, 'knock', .6), cue(0, 'scratch', .3), cue(0, 'drone', .4), cue(1, 'clock', .5), cue(1, 'whispers', .5), cue(1, 'choir', .35), cue(2, 'demon', .5), cue(2, 'scrape', .8), cue(2, 'scratch', .4), cue(3, 'heart', .7), cue(3, 'breath', .5), cue(3, 'organ', .3)] }
  ];
  const DL = { s7: ['flicker', '#7ab0ff'], s8: ['breathe', '#fff3b0'], s9: ['flicker', '#33ff44'], s10: ['pulse', '#ff0000'], s1: ['lightning', '#7a9bff'], s2: ['flicker', '#ff8a2a'], s3: ['pulse', '#ff1a1a'], s4: ['fire', '#ff5a00'], s5: ['breathe', '#2a5bff'], s6: ['breathe', '#7a00c8'] };
  const lightOf = sc => sc.light || (DL[sc.id] ? { mode: DL[sc.id][0], color: DL[sc.id][1] } : { mode: 'off', color: '#ff2a00' });
  const DEF = () => ({
    fade: 2, cur: null,
    zones: ZN.map((n, i) => ({ name: n, dev: 'default', ch: i % 2 ? 'R' : 'L', vol: .85, mute: false })),
    scenes: [
      { id: 's1', name: 'Stormy arrival', cues: [cue(0, 'rain', .8), cue(0, 'wind', .5), cue(0, 'thunder', .8), cue(1, 'drone', .4), cue(1, 'wind', .25), cue(2, 'drone', .35), cue(3, 'drone', .3), cue(3, 'drips', .4)] },
      { id: 's2', name: 'Haunted hall', cues: [cue(0, 'wind', .4), cue(0, 'crickets', .3), cue(1, 'creak', .8), cue(1, 'whispers', .6), cue(1, 'drone', .4), cue(2, 'musicbox', .5), cue(2, 'bell', .4), cue(3, 'breath', .5), cue(3, 'drips', .5)] },
      { id: 's3', name: 'Seance', cues: [cue(0, 'crickets', .4), cue(1, 'whispers', .7), cue(2, 'radio', .4), cue(2, 'musicbox', .45), cue(2, 'drone', .3), cue(3, 'heart', .7), cue(3, 'chains', .35)] },
      { id: 's4', name: 'The crypt', cues: [cue(0, 'wind', .5), cue(1, 'drips', .6), cue(1, 'steps', .55), cue(2, 'chains', .5), cue(2, 'drone', .5), cue(3, 'breath', .6), cue(3, 'heart', .6), cue(3, 'whispers', .4)] },
      { id: 's5', name: 'Graveyard at midnight', cues: [cue(0, 'crickets', .6), cue(0, 'wind', .3), cue(1, 'bell', .5), cue(2, 'wind', .4), cue(2, 'whispers', .3), cue(2, 'drone', .3), cue(3, 'drips', .4), cue(3, 'drone', .4)] },
      { id: 's6', name: 'Quiet dread', cues: [cue(0, 'drone', .3), cue(1, 'drone', .35), cue(2, 'drone', .35), cue(3, 'drone', .4), cue(3, 'heart', .35)] }
    ],
    videos: [{ t: 'Example: paste a public-domain horror film link below', v: '' }]
  });
  /* version 3: the party layout. old zone 0 (outdoor ambience) -> Main backyard (quieter, movies play there), 1 -> Mossy green, 2 -> Living room, 3 (dark and close) -> Cave entrance */
  const REMAP = { 0: 2, 1: 1, 2: 3, 3: 0 };
  function toLayout3(st) { st.scenes.forEach(sc => { sc.cues = sc.cues.map(c => ({ ...c, zone: REMAP[c.zone] != null ? REMAP[c.zone] : c.zone, vol: c.zone === 0 ? Math.round(c.vol * 60) / 100 : c.vol })); }); st.zones.forEach((z, i) => { if (ZN[i] === z.name || !z.name) z.name = ZN3[i] || z.name; if (z.ch === 'both') z.ch = i % 2 ? 'R' : 'L'; }); st.ver = 3; return st; }
  let S; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!S || !S.zones) S = DEF();
  if (!S.ver || S.ver < 2) { MORE().forEach(m => { if (!S.scenes.some(x => x.id === m.id)) S.scenes.push(m); }); S.ver = 2; }
  if (S.ver < 3) { const def = S.zones.length === 4 && S.zones.every((z, i) => z.name === ZN[i]); if (def) toLayout3(S); else S.ver = 3; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  S.events = S.events || { on: false, mean: 45, vol: .8, onlyPlaying: true, pool: ['creak', 'whispers', 'chains', 'knock', 'scratch', 'bell', 'howl', 'banshee', 'steps', 'demon', 'slam'], zones: [] };
  S.remote = S.remote || { on: false, pin: '' };
  S.show = S.show || { loop: false, steps: [{ scene: 's1', min: 20, hit: true }, { scene: 's2', min: 20, hit: false }, { scene: 's3', min: 20, hit: false }, { scene: 's4', min: 20, hit: false }, { scene: 's10', min: 20, hit: true }, { scene: 's6', min: 20, hit: false }] };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  let tab = 'scenes', editSc = null, devs = [], custom = [], armed = false;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2800); };

  /* ---- custom sound files in IndexedDB ---- */
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open('hauntica', 1); r.onupgradeneeded = () => r.result.createObjectStore('snd', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const dbop = (mode, fn) => idb().then(db => new Promise((ok, no) => { const tx = db.transaction('snd', mode), st = tx.objectStore('snd'), q = fn(st); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => no(tx.error); })).catch(() => []);
  const loadCustom = async () => { custom = (await dbop('readonly', s => s.getAll())) || []; };
  const sndList = () => HS.order.map(id => ({ id, name: HS.gen[id].name, loop: HS.gen[id].loop })).concat(custom.map(c => ({ id: 'c:' + c.id, name: c.name, loop: !c.oneshot, custom: true })));
  const sndName = id => { const s = sndList().find(x => x.id === id); return s ? s.name : id + ' (missing)'; };

  /* ---- audio engine: one AudioContext per zone, sent to that zone's output device ---- */
  let dev = { mine: null }; try { dev = Object.assign(dev, JSON.parse(localStorage.getItem('hauntica-device') || '{}')); } catch (e) { }
  const saveDev = () => { try { localStorage.setItem('hauntica-device', JSON.stringify(dev)); } catch (e) { } };
  const mine = i => !dev.mine || !dev.mine.length || dev.mine.includes(i);
  const Z = [];
  function zone(i) {
    if (Z[i] && Z[i].ctx.state !== 'closed') return Z[i];
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
    const z = Z[i] = { ctx, bus: ctx.createGain(), mono: ctx.createGain(), mg: ctx.createChannelMerger(2), master: ctx.createGain(), voices: {}, bufs: {}, cfg: '' };
    z.mono.channelCount = 1; z.mono.channelCountMode = 'explicit'; z.master.connect(ctx.destination);
    applyZone(i); return z;
  }
  function applyZone(i) {
    const z = Z[i], c = S.zones[i]; if (!z || !c) return;
    z.master.gain.setTargetAtTime(c.mute ? 0 : c.vol, z.ctx.currentTime, .03);
    const sig = c.ch + '|' + c.dev;
    if (z.cfg.split('|').slice(0, 1)[0] !== c.ch || !z.cfg) { [z.bus, z.mono, z.mg].forEach(n => { try { n.disconnect(); } catch (e) { } }); if (c.ch === 'both') z.bus.connect(z.master); else { z.bus.connect(z.mono); z.mono.connect(z.mg, 0, c.ch === 'L' ? 0 : 1); z.mg.connect(z.master); } }
    if (z.cfg !== sig) { z.cfg = sig; if (z.ctx.setSinkId) z.ctx.setSinkId(c.dev === 'default' ? '' : c.dev).catch(e => toast('Zone ' + (i + 1) + ': could not use that output (' + (e.name || e) + ')')); }
  }
  async function buf(z, id) {
    if (z.bufs[id]) return z.bufs[id];
    let b;
    if (id.startsWith('c:')) { const rec = custom.find(c => 'c:' + c.id === id); if (!rec) throw new Error('missing file'); b = await z.ctx.decodeAudioData(await rec.blob.arrayBuffer()); }
    else { const [L, R] = HS.get(id); b = z.ctx.createBuffer(2, L.length, HS.SR); b.copyToChannel(L, 0); b.copyToChannel(R, 1); }
    return z.bufs[id] = b;
  }
  async function startCue(i, c, fade) {
    if (!mine(i)) return;
    const z = zone(i), t = z.ctx.currentTime, v = z.voices[c.snd];
    if (v) { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(c.vol, t, .3); v.keep = true; return; }
    let b; try { b = await buf(z, c.snd); } catch (e) { toast('Could not load ' + sndName(c.snd)); return; }
    if (z.voices[c.snd]) return;
    const src = z.ctx.createBufferSource(), g = z.ctx.createGain(), def = sndList().find(s => s.id === c.snd);
    src.buffer = b; src.loop = def ? def.loop : true; g.gain.setValueAtTime(0, z.ctx.currentTime); g.gain.linearRampToValueAtTime(c.vol, z.ctx.currentTime + Math.max(.02, fade));
    src.connect(g); g.connect(z.bus); src.start();
    const vo = z.voices[c.snd] = { src, g, keep: true }; src.onended = () => { if (z.voices[c.snd] === vo) delete z.voices[c.snd]; refresh(); };
  }
  function fadeOut(z, key, fade) { const v = z.voices[key]; if (!v) return; const t = z.ctx.currentTime; v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + Math.max(.02, fade)); try { v.src.stop(t + fade + .05); } catch (e) { } delete z.voices[key]; }
  async function arm() { for (let i = 0; i < S.zones.length; i++) { if (!mine(i)) continue; const z = zone(i); try { await z.ctx.resume(); } catch (e) { } } armed = true; $('#arm').textContent = 'Audio armed'; $('#arm').classList.add('ok'); }
  async function playScene(id) {
    if (!armed) await arm();
    const sc = S.scenes.find(s => s.id === id); if (!sc) return; S.cur = id; save();
    const want = {}; sc.cues.forEach(c => { want[c.zone + '|' + c.snd] = 1; });
    Z.forEach((z, i) => { if (!z) return; Object.keys(z.voices).forEach(k => { if (!want[i + '|' + k] && !k.startsWith('prev:')) fadeOut(z, k, S.fade); }); });
    const lt = lightOf(sc); if (window.HL && HL.lights.length) HL.set(lt.mode, lt.color);
    await Promise.all(sc.cues.filter(c => S.zones[c.zone] && mine(c.zone)).map(c => startCue(c.zone, c, S.fade))); refresh();
  }
  function stopAll() { Z.forEach(z => { if (z) Object.keys(z.voices).forEach(k => fadeOut(z, k, 1.2)); }); S.cur = null; save(); if (window.HL && HL.lights.length) HL.set('off'); refresh(); }
  async function hit(which, snd) { snd = snd || 'stinger'; if (!armed) await arm(); if (snd === 'stinger' && window.HL && HL.lights.length && S.flash !== false) { const m = HL.mode, c = HL.color; HL.set('solid', '#ffffff'); setTimeout(() => HL.set(m, c), 220); } const zs = which === 'all' ? S.zones.map((_, i) => i) : [which]; for (const i of zs.filter(mine)) { const z = zone(i), b = await buf(z, snd), s = z.ctx.createBufferSource(), g = z.ctx.createGain(); s.buffer = b; g.gain.value = 1; s.connect(g); g.connect(z.bus); s.start(); } }
  async function preview(i, id) { if (!armed) await arm(); const z = zone(i), k = 'prev:' + id; if (z.voices[k]) { fadeOut(z, k, .3); refresh(); return; } const b = await buf(z, id), s = z.ctx.createBufferSource(), g = z.ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = .7; s.connect(g); g.connect(z.bus); s.start(); const vo = z.voices[k] = { src: s, g }; s.onended = () => { if (z.voices[k] === vo) delete z.voices[k]; refresh(); }; setTimeout(() => { if (z.voices[k] === vo) { fadeOut(z, k, 1); refresh(); } }, 20000); refresh(); }
  async function testZone(i) {
    if (!mine(i)) { toast('Zone ' + (i + 1) + ' belongs to the other computer'); return; }
    if (!armed) await arm(); const z = zone(i); applyZone(i); const t0 = z.ctx.currentTime + .1;
    for (let k = 0; k <= i; k++) { const o = z.ctx.createOscillator(), g = z.ctx.createGain(); o.frequency.value = 660; g.gain.setValueAtTime(0, t0 + k * .5); g.gain.linearRampToValueAtTime(.35, t0 + k * .5 + .02); g.gain.linearRampToValueAtTime(0, t0 + k * .5 + .3); o.connect(g); g.connect(z.bus); o.start(t0 + k * .5); o.stop(t0 + k * .5 + .35); }
    toast('Zone ' + (i + 1) + ' (' + S.zones[i].name + '): ' + (i + 1) + ' beep' + (i ? 's' : ''));
  }
  async function listDevices(ask) {
    try { if (ask) { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => t.stop()); } devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audiooutput'); } catch (e) { toast('Could not read the output list: ' + (e.name || e)); }
    if (tab === 'zones') render();
  }

  /* ---- UI ---- */
  const live = i => Z[i] ? Object.keys(Z[i].voices).filter(k => !k.startsWith('prev:')) : [];
  const refresh = () => { if (tab === 'scenes' || tab === 'sounds') render(); };
  const sceneOpts = () => S.scenes.map(s => `<option value="${s.id}" ${s.id === editSc ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  const sndOpts = sel => sndList().map(s => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}${s.loop ? '' : ' (one shot)'}</option>`).join('');
  const views = {
    scenes() {
      const sup = !!(window.AudioContext && AudioContext.prototype.setSinkId);
      return `${sup ? '' : '<div class="card warn"><b>This browser cannot choose an output device per zone.</b> Use Chrome or Edge (version 110 or newer) on the computer that runs the show.</div>'}
      ${armed ? '' : '<div class="card warn">Press <b>1. Arm audio</b> once after opening the page (browsers block sound until you do). Then press a scene.</div>'}
      <h2>Scenes <span class="mu xs">(number keys 1 to ${Math.min(9, S.scenes.length)} start a scene, Esc stops everything)</span></h2>
      <div class="grid">${S.scenes.map((s, i) => `<button class="scene ${S.cur === s.id ? 'on' : ''}" data-play="${s.id}">${esc(s.name)}<kbd>${i < 9 ? i + 1 : ''}</kbd><small>${esc([...new Set(s.cues.map(c => c.zone))].length)} zones, ${s.cues.length} sounds</small></button>`).join('')}</div>
      <h2 style="margin-top:18px">Jump scare</h2><div class="row">${S.zones.map((z, i) => `<button data-hit="${i}">Zone ${i + 1}: ${esc(z.name)}</button>`).join('')}<button data-hit="all" class="rec">ALL zones</button></div><div class="row"><button data-hit="all|slam">Door slam, all zones</button><button data-hit="all|riser">Riser (8 s)</button><button data-hit="build" class="rec">Riser then BIG HIT</button></div>
      <h2 style="margin-top:18px">Zones now</h2>${S.zones.map((z, i) => `<div class="card"><div class="row"><span class="dot ${live(i).length ? 'live' : ''}"></span><b>Zone ${i + 1}: ${esc(z.name)}</b><span class="mu xs">${z.ch === 'both' ? 'stereo' : z.ch === 'L' ? 'mono, left channel' : 'mono, right channel'}</span><span class="grow"></span><input type="range" min="0" max="1" step=".01" value="${z.vol}" data-zvol="${i}" aria-label="Zone ${i + 1} volume"><button data-zmute="${i}" class="${z.mute ? 'on' : ''}">${z.mute ? 'Muted' : 'Mute'}</button></div><div>${live(i).map(k => `<span class="tag">${esc(sndName(k))}</span>`).join('') || '<span class="mu xs">silent</span>'}</div></div>`).join('')}`;
    },
    edit() {
      if (!S.scenes.find(s => s.id === editSc)) editSc = S.scenes[0] && S.scenes[0].id; const sc = S.scenes.find(s => s.id === editSc);
      if (!sc) return '<button data-newscene>New scene</button>';
      return `<h2>Edit scenes</h2><div class="row"><select id="scsel">${sceneOpts()}</select><input type="text" id="scname" value="${esc(sc.name)}" aria-label="Scene name"><button data-newscene>New</button><button data-dupscene>Duplicate</button><button data-delscene class="rec">Delete</button><button data-play="${sc.id}" class="big">Play this scene</button></div>
      <div class="card"><div class="row"><b>Lights</b><select id="lmode">${HL.modes.map(m => `<option value="${m[0]}" ${lightOf(sc).mode === m[0] ? 'selected' : ''}>${m[1]}</option>`).join('')}</select><input type="color" id="lcol" value="${lightOf(sc).color}" aria-label="Light color"><span class="mu xs">${HL.lights.length ? HL.lights.length + ' light(s) connected' : 'no lights connected (Lights tab)'}</span></div></div>
      <p class="mu xs">Changes save at once. If this scene is playing, press Play again to hear changes (sounds that stay in the scene keep playing without a gap).</p>
      ${S.zones.map((z, i) => `<div class="card"><h3>Zone ${i + 1}: ${esc(z.name)}</h3>${sc.cues.map((c, k) => c.zone !== i ? '' : `<div class="row"><select data-csnd="${k}">${sndOpts(c.snd)}</select><input type="range" min="0" max="1" step=".01" value="${c.vol}" data-cvol="${k}" aria-label="Volume"><button data-cdel="${k}" class="rec" aria-label="Remove">x</button></div>`).join('')}<div class="row"><select id="add${i}">${sndOpts('')}</select><button data-cadd="${i}">+ Add sound</button></div></div>`).join('')}`;
    },
    zones() {
      const opt = sel => `<option value="default" ${sel === 'default' ? 'selected' : ''}>Computer default output</option>` + (() => { const seen = {}; return devs.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications').map(d => { const n = d.label || 'Output ' + d.deviceId.slice(0, 6); seen[n] = (seen[n] || 0) + 1; return `<option value="${esc(d.deviceId)}" ${d.deviceId === sel ? 'selected' : ''}>${esc(n)}${seen[n] > 1 ? ' (#' + seen[n] + ', same name as another: use Test to tell them apart)' : ''}</option>`; }).join(''); })();
      return `<h2>Zones and outputs</h2><div class="card"><p>Each zone sends to one output device and one channel. A <b>Scarlett 2i2 has two output channels</b> (left and right), so it can feed <b>two mono zones</b>: set one zone to Left and another to Right on the same device. The RCA and 1/4 inch jacks carry the same two channels, and the headphone jack mirrors them. For more zones use other outputs: the computer's headphone jack, an HDMI or DisplayLink monitor with speakers, a USB sound adapter, or a second computer running this page.</p>
      <div class="row"><button data-devs="1" class="big">Show my output devices</button><span class="mu xs">The browser asks for microphone permission only so it will reveal device names. Nothing is recorded.</span></div><div class="row"><button data-testseq>Test all zones in turn</button><span class="mu xs">Zone 1 beeps once, zone 2 twice, and so on.</span></div></div>
      ${S.zones.map((z, i) => `<div class="card"><div class="row"><b>Zone ${i + 1}</b><input type="text" data-zname="${i}" value="${esc(z.name)}" aria-label="Zone name"><select data-zdev="${i}">${opt(z.dev)}</select><select data-zch="${i}"><option value="both" ${z.ch === 'both' ? 'selected' : ''}>Stereo (both channels)</option><option value="L" ${z.ch === 'L' ? 'selected' : ''}>Mono, left channel only</option><option value="R" ${z.ch === 'R' ? 'selected' : ''}>Mono, right channel only</option></select><button data-ztest="${i}">Test</button><button data-zdel="${i}" class="rec" aria-label="Remove zone">x</button></div></div>`).join('')}
      <button data-zadd>+ Add zone</button><p class="mu xs">${devs.length ? devs.length + ' output devices found.' : 'No device list yet.'} Zone settings are saved in this browser on this computer.</p>`;
    },
    sounds() {
      return `<h2>Sounds</h2><div class="card"><div class="row"><span>Listen on</span><select id="pz">${S.zones.map((z, i) => `<option value="${i}" ${sounds.pz == i ? 'selected' : ''}>Zone ${i + 1}: ${esc(z.name)}</option>`).join('')}</select><label class="big"><input type="file" id="up" accept="audio/*,video/mp4,video/webm" multiple> add your own files</label></div><div class="row"><button data-rec class="${rec ? 'rec on' : ''}">${rec ? 'Stop recording' : '&#127908; Record a voice line'}</button><label class="chk"><input type="checkbox" id="recfx" checked> make it deep and echoing</label><span class="mu xs">Saved as a one-shot for the Scare pads and Random scares.</span></div><p class="mu xs">Uploaded files stay on this computer (in the browser). Use only sounds you made, bought or that are free for public use. Good free sources: freesound.org (filter to CC0), pixabay.com/sound-effects, sonniss.com GDC free bundles, YouTube Audio Library. Check each license.</p></div>
      <table>${sndList().map(s => `<tr><td>${esc(s.name)}</td><td class="mu xs">${s.custom ? 'your file' : 'made by Hauntica'}${s.loop ? ', loops' : ''}</td><td><button data-dl="${esc(s.id)}" title="Save as a file">Save</button><button data-prev="${esc(s.id)}" class="${Z[sounds.pz] && Z[sounds.pz].voices['prev:' + s.id] ? 'on' : ''}">${Z[sounds.pz] && Z[sounds.pz].voices['prev:' + s.id] ? 'Stop' : 'Listen'}</button>${s.custom ? `<button data-oneshot="${esc(s.id)}">${s.loop ? 'Loops' : 'One shot'}</button><button data-delsnd="${esc(s.id)}" class="rec">Delete</button>` : ''}</td></tr>`).join('')}</table>`;
    },
    lights() {
      const hl = HL, ok = hl.supported();
      return `<h2>Lights</h2>${ok ? '' : '<div class="card warn"><b>This browser cannot talk to Bluetooth lights.</b> Use Chrome or Edge on a computer (not Safari or iPhone), with Bluetooth turned on.</div>'}
      <div class="card"><p>Close the Happy Lighting app on your phone first, or turn off the phone's Bluetooth, because these lights accept only one connection. Press Connect, pick the light in the list, then repeat for the second light. <b>Untested on real lights</b>: use the red, green and blue buttons to check each one.</p>
      <div class="row"><button class="big" data-lconn ${ok ? '' : 'disabled'}>Connect a light</button><button data-lpow="1">All on</button><button data-lpow="0">All off</button></div></div>
      ${hl.lights.map((li, i) => `<div class="card"><div class="row"><span class="dot ${li.ready ? 'live' : ''}"></span><b>${esc(li.name)}</b><span class="mu xs">${esc(li.fam.label)}</span><span class="grow"></span><button data-lrgb="${i}|255|0|0">Red</button><button data-lrgb="${i}|0|255|0">Green</button><button data-lrgb="${i}|0|0|255">Blue</button>${li.ready || li.bridge ? '' : `<button data-lre="${i}">Reconnect</button>`}<button data-lbye="${i}" class="rec">Remove</button></div><div class="row"><span class="mu xs">Brightness</span><input type="range" min=".05" max="1" step=".05" value="${li.bright}" data-lbr="${i}"></div></div>`).join('')}
      <div class="card"><h3>Philips Hue</h3><p class="xs mu"><b>Hue with a bridge (best):</b> type the bridge's address (find it in the Hue app, Settings, Bridges). Open <a href="https://${esc(bridge.ip || 'BRIDGE-ADDRESS')}/" target="_blank" rel="noopener">https://${esc(bridge.ip || 'bridge address')}/</a> once and accept the security warning. Press the round button on the bridge, then press Link, then add your lights below. <b>Hue Bluetooth bulb without a bridge:</b> use Connect a light above; the bulb usually has to be in pairing mode (power it off and on, or reset it) and not be in use by the Hue app. Both are untested here.</p>
      <div class="row"><input type="text" id="hip" placeholder="Bridge address, like 192.168.1.20" value="${esc(bridge.ip || '')}"><button data-hlink>Link bridge</button>${bridge.user ? '<button data-hlist>Show its lights</button>' : ''}</div>
      <div class="row">${bridgeLights.map(x => `<button data-hadd="${esc(x.id)}|${esc(x.name)}">+ ${esc(x.name)}${x.color ? '' : ' (no color)'}</button>`).join('')}</div></div>
      <div class="card"><h3>Try an effect now</h3><div class="row"><select id="tmode">${hl.modes.map(m => `<option value="${m[0]}">${m[1]}</option>`).join('')}</select><input type="color" id="tcol" value="#ff2a00"><button data-ltry>Run</button><span class="mu xs">Each scene remembers its own light effect (Edit scenes tab).</span></div></div>`;
    },
    video() {
      return `<h2>Video windows</h2><div class="card"><p>Opens a YouTube video in its own window. Drag that window onto the other display (HDMI or DisplayLink) and press F11. Only use videos you may show: your own, public domain, or channels that upload films legitimately. The window's sound goes to this computer's <b>default</b> output (set that in Windows sound settings, or run the video on a second computer).</p>
      <div class="row"><input type="text" id="vurl" placeholder="Paste a YouTube link" class="grow"><input type="text" id="vtitle" placeholder="Name"><button data-vadd>Add</button></div></div>
      ${S.videos.map((v, i) => `<div class="card"><div class="row"><b class="grow">${esc(v.t)}</b>${v.v ? `<button data-vopen="${i}" class="big">Open window</button><button data-vloop="${i}">Open, looping</button>` : '<span class="mu xs">needs a link</span>'}<button data-vdel="${i}" class="rec">x</button></div></div>`).join('')}`;
    },
    help() {
      return `<h2>How to run the party</h2><div class="card"><ol><li>Plug the Scarlett in, open this page in Chrome or Edge on that computer.</li><li><b>Zones and outputs</b> tab: press <i>Show my output devices</i>, choose the Scarlett for each zone, and set Left or Right. Press <i>Test all zones</i> and walk to each speaker.</li><li>Press <b>1. Arm audio</b>, then tap a scene. Scenes crossfade into each other. <b>Stop all</b> fades everything out.</li><li>Edit what plays where on the <b>Edit scenes</b> tab.</li></ol></div>
      <div class="card"><h3>Good to know</h3><ul><li>On Windows the browser may show the 2i2 as one stereo device. That is fine for two mono zones. In Focusrite Control you can set what the headphone jack mirrors.</li><li>Keep the computer awake and the browser window open (a minimized window is fine). Turn off sleep in Windows power settings.</li><li>This page works offline once opened, so a bad Wi-Fi night will not stop the sounds. Videos need internet.</li><li>For more outputs open this page on the other computers and run the scenes there (an all-in-one remote that starts every computer together is the next feature).</li></ul></div>`;
    }
  };
  let bridge = {}, bridgeLights = []; try { bridge = JSON.parse(localStorage.getItem('hauntica-hue') || '{}'); } catch (e) { }
  const sounds = { pz: 0 };
  function render() { const v = $('#view'), y = window.scrollY; v.innerHTML = views[tab](); document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); window.scrollTo(0, y); }

  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.t) { tab = d.t; render(); return; }
    if (b.id === 'arm') { await arm(); toast('Audio armed'); render(); return; }
    if (b.id === 'stopall') { act({ cmd: 'stop' }); return; }
    if (d.play) { act({ cmd: 'scene', id: d.play }); return; }
    if (d.hit) { if (d.hit === 'build') { act({ cmd: 'build' }); toast('Building... hit in 8 seconds'); return; } const [w, sn] = d.hit.split('|'); act({ cmd: 'hit', zone: w === 'all' ? 'all' : +w, snd: sn }); return; }
    if (d.zmute) { const c = S.zones[+d.zmute]; c.mute = !c.mute; save(); applyZone(+d.zmute); render(); return; }
    if (d.devs) { listDevices(true); return; }
    if (d.ztest) { testZone(+d.ztest); return; }
    if (d.testseq != null) { for (let i = 0; i < S.zones.length; i++) { await testZone(i); await new Promise(r => setTimeout(r, 700 + i * 500)); } return; }
    if (d.zadd != null) { if (S.zones.length >= 8) { toast('8 zones is the limit'); return; } S.zones.push({ name: 'Zone ' + (S.zones.length + 1), dev: 'default', ch: 'both', vol: .85, mute: false }); save(); render(); return; }
    if (d.zdel) { const i = +d.zdel; if (S.zones.length < 2) return; if (Z[i]) { try { Z[i].ctx.close(); } catch (er) { } } Z.splice(i, 1); S.zones.splice(i, 1); S.scenes.forEach(s => { s.cues = s.cues.filter(c => c.zone !== i).map(c => (c.zone > i ? { ...c, zone: c.zone - 1 } : c)); }); save(); render(); return; }
    if (d.newscene != null) { const id = 's' + Date.now(); S.scenes.push({ id, name: 'New scene', cues: [] }); editSc = id; save(); render(); return; }
    if (d.dupscene != null) { const sc = S.scenes.find(s => s.id === editSc), id = 's' + Date.now(); S.scenes.push({ id, name: sc.name + ' copy', cues: sc.cues.map(c => ({ ...c })) }); editSc = id; save(); render(); return; }
    if (d.delscene != null) { if (S.scenes.length < 2) return; S.scenes = S.scenes.filter(s => s.id !== editSc); editSc = null; save(); render(); return; }
    const sc = S.scenes.find(s => s.id === editSc);
    if (d.cadd != null) { const i = +d.cadd, sel = $('#add' + i).value; if (!sc.cues.some(c => c.zone === i && c.snd === sel)) sc.cues.push(cue(i, sel, .6)); save(); render(); return; }
    if (d.cdel) { sc.cues.splice(+d.cdel, 1); save(); render(); return; }
    if (d.prev) { preview(+sounds.pz, d.prev); return; }
    if (d.delsnd) { const id = d.delsnd.slice(2); await dbop('readwrite', s => s.delete(id)); await loadCustom(); S.scenes.forEach(s => { s.cues = s.cues.filter(c => c.snd !== d.delsnd); }); save(); render(); return; }
    if (d.lconn != null) { try { await HL.connect(); toast('Light connected'); } catch (er) { toast(er.name === 'NotFoundError' ? 'No light chosen' : (er.message || er)); } render(); return; }
    if (d.lpow != null) { HL.power(d.lpow === '1'); return; }
    if (d.lrgb) { const [i, r, g, bb] = d.lrgb.split('|').map(Number); HL.setRGB(HL.lights[i], r, g, bb); return; }
    if (d.lbye) { HL.disconnect(HL.lights[+d.lbye]); return; }
    if (d.lre) { try { await HL.reconnect(HL.lights[+d.lre]); } catch (er) { toast('Could not reconnect'); } render(); return; }
    if (d.hlink != null) { const ip = $('#hip').value.trim(); if (!ip) { toast('Type the bridge address first'); return; } try { bridge = { ip, user: await HL.bridgeLink(ip) }; localStorage.setItem('hauntica-hue', JSON.stringify(bridge)); bridgeLights = await HL.bridgeLights(bridge.ip, bridge.user); toast('Bridge linked'); } catch (er) { toast(er.message && er.message.startsWith('Press') ? er.message : 'Could not reach the bridge. Open its address in a tab and accept the warning first.'); } render(); return; }
    if (d.hlist != null) { try { bridgeLights = await HL.bridgeLights(bridge.ip, bridge.user); } catch (er) { toast('Could not read the bridge lights'); } render(); return; }
    if (d.hadd) { const [id, ...nm] = d.hadd.split('|'); HL.addBridgeLight(bridge.ip, bridge.user, id, nm.join('|')); return; }
    if (d.ltry != null) { HL.set($('#tmode').value, $('#tcol').value); return; }
    if (d.vadd != null) { const m = ($('#vurl').value || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); if (!m) { toast('That does not look like a YouTube link'); return; } S.videos.push({ t: $('#vtitle').value || 'Video ' + m[1], v: m[1] }); save(); render(); return; }
    if (d.vdel) { S.videos.splice(+d.vdel, 1); save(); render(); return; }
    if (d.vopen || d.vloop) { const i = +(d.vopen || d.vloop), v = S.videos[i]; window.open('video.html?v=' + encodeURIComponent(v.v) + (d.vloop ? '&loop=1' : ''), 'hv' + i, 'width=960,height=540'); return; }
  });
  document.addEventListener('input', e => {
    const t = e.target, d = t.dataset;
    if (t.id === 'fade') { S.fade = +t.value; $('#fadev').textContent = t.value + ' s'; save(); return; }
    if (d.zvol != null && d.zvol !== '') { S.zones[+d.zvol].vol = +t.value; save(); applyZone(+d.zvol); return; }
    if (d.cvol != null) { const sc = S.scenes.find(s => s.id === editSc); sc.cues[+d.cvol].vol = +t.value; save(); return; }
    if (d.lbr != null) { HL.lights[+d.lbr].bright = +t.value; return; }
    if (d.zname != null) { S.zones[+d.zname].name = t.value; save(); return; }
    if (t.id === 'lcol') { const sc = S.scenes.find(s => s.id === editSc); sc.light = { mode: lightOf(sc).mode, color: t.value }; save(); return; }
    if (t.id === 'scname') { S.scenes.find(s => s.id === editSc).name = t.value; save(); }
  });
  document.addEventListener('change', async e => {
    const t = e.target, d = t.dataset;
    if (d.zdev != null) { S.zones[+d.zdev].dev = t.value; save(); applyZone(+d.zdev); testZone(+d.zdev); return; }
    if (d.zch != null) { S.zones[+d.zch].ch = t.value; save(); if (Z[+d.zch]) { Z[+d.zch].cfg = ''; applyZone(+d.zch); } return; }
    if (d.csnd != null) { const sc = S.scenes.find(s => s.id === editSc); sc.cues[+d.csnd].snd = t.value; save(); return; }
    if (t.id === 'lmode') { const sc = S.scenes.find(s => s.id === editSc); sc.light = { mode: t.value, color: lightOf(sc).color }; save(); return; }
    if (t.id === 'scsel') { editSc = t.value; render(); return; }
    if (t.id === 'pz') { sounds.pz = +t.value; render(); return; }
    if (t.id === 'up') { for (const f of t.files) { const id = Date.now() + '' + Math.random().toString(36).slice(2, 6); await dbop('readwrite', s => s.put({ id, name: f.name.replace(/\.[^.]+$/, ''), blob: f })); } await loadCustom(); toast('Added ' + t.files.length + ' file(s)'); render(); }
  });
  document.addEventListener('keydown', e => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'Escape') { act({ cmd: 'stop' }); return; } if (e.key === 'p' || e.key === 'P') { act({ cmd: 'panic' }); return; } const n = +e.key; if (n >= 1 && n <= 9 && S.scenes[n - 1]) act({ cmd: 'scene', id: S.scenes[n - 1].id }); });
  navigator.mediaDevices && navigator.mediaDevices.addEventListener && navigator.mediaDevices.addEventListener('devicechange', () => listDevices(false));
  $('#fade').value = S.fade; $('#fadev').textContent = S.fade + ' s';
  /* ================= extras: one-shots, pads, random scares, show timeline, voice recorder, print sheet ================= */
  async function oneShot(i, id, vol, dur) {
    if (!mine(i)) return; if (!armed) await arm(); const z = zone(i), b = await buf(z, id), def = sndList().find(x => x.id === id), t = z.ctx.currentTime, src = z.ctx.createBufferSource(), g = z.ctx.createGain();
    let off = 0, d = b.duration; if (!def || def.loop) { d = Math.min(b.duration, dur || 5); off = Math.random() * (b.duration - d); }
    const fi = def && !def.loop ? .01 : .4, fo = Math.min(.8, d / 3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + fi); g.gain.setValueAtTime(vol, t + Math.max(fi, d - fo)); g.gain.linearRampToValueAtTime(0, t + d);
    src.buffer = b; src.connect(g); g.connect(z.bus); src.start(t, off, d);
  }
  let evT = null;
  function evStop() { clearTimeout(evT); evT = null; }
  function evStart() {
    evStop(); if (!S.events.on) return;
    const next = () => { evT = setTimeout(async () => {
      const E = S.events; if (E.on && armed && (!E.onlyPlaying || S.cur) && E.pool.length) { const id = E.pool[Math.random() * E.pool.length | 0], zs = (E.zones.length ? E.zones : S.zones.map((_, i) => i)).filter(mine), zi = zs[Math.random() * zs.length | 0]; if (S.zones[zi]) { try { await oneShot(zi, id, E.vol, 5); E.last = sndName(id) + ' in ' + S.zones[zi].name; const el = $('#evlast'); if (el) el.textContent = 'Last scare: ' + E.last; } catch (er) { } } }
      next(); }, S.events.mean * 1000 * (.4 + Math.random() * 1.2)); };
    next();
  }
  let showT = null, showI = -1, showEnd = 0, showTick = null;
  function showGo(i) {
    const st = S.show.steps; clearTimeout(showT); if (!st.length) return;
    if (i >= st.length) { if (S.show.loop) i = 0; else { showStop(true); return; } }
    showI = i; const step = st[i]; showEnd = Date.now() + step.min * 60000; playScene(step.scene); if (step.hit) setTimeout(() => hit('all'), 2500);
    showT = setTimeout(() => showGo(showI + 1), step.min * 60000); clearInterval(showTick); showTick = setInterval(showInfo, 1000); if (tab === 'auto') render(); showInfo();
  }
  function showStop(done) { clearTimeout(showT); clearInterval(showTick); showT = null; showI = -1; if (done) toast('Show finished'); if (tab === 'auto') render(); }
  function showInfo() { const el = $('#showinfo'); if (!el) return; if (showI < 0) { el.textContent = 'Show not running.'; return; } const st = S.show.steps[showI], left = Math.max(0, Math.round((showEnd - Date.now()) / 1000)), sc = S.scenes.find(x => x.id === st.scene); el.textContent = 'Now: step ' + (showI + 1) + ' of ' + S.show.steps.length + ', ' + (sc ? sc.name : '?') + ', ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' left'; }
  function panic() { evStop(); showStop(); stopAll(); if (window.HL && HL.lights.length) HL.set('solid', '#ffffff'); toast('PANIC: sound stopped, lights white'); }
  function wavOf(chs, sr) { const n = chs[0].length, buf = new ArrayBuffer(44 + n * 2 * chs.length), v = new DataView(buf), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }; w(0, 'RIFF'); v.setUint32(4, 36 + n * 2 * chs.length, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, chs.length, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2 * chs.length, true); v.setUint16(32, 2 * chs.length, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2 * chs.length, true); let o = 44; for (let i = 0; i < n; i++) chs.forEach(c => { const x = Math.max(-1, Math.min(1, c[i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }); return new Blob([buf], { type: 'audio/wav' }); }
  async function spooky(blob) {   /* deeper, with a long echo, rendered offline */
    const ac = new AudioContext(), src = await ac.decodeAudioData(await blob.arrayBuffer()); ac.close();
    const rate = .8, len = Math.ceil(src.length / rate) + src.sampleRate * 2, oc = new OfflineAudioContext(1, len, src.sampleRate), s0 = oc.createBufferSource(); s0.buffer = src; s0.playbackRate.value = rate;
    const dry = oc.createGain(), dl = oc.createDelay(1), fb = oc.createGain(), wet = oc.createGain(), lp = oc.createBiquadFilter(); dry.gain.value = 1; dl.delayTime.value = .27; fb.gain.value = .5; wet.gain.value = .6; lp.type = 'lowpass'; lp.frequency.value = 2600;
    s0.connect(dry); dry.connect(oc.destination); s0.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(lp); lp.connect(wet); wet.connect(oc.destination); s0.start(); const out = await oc.startRendering(); return wavOf([out.getChannelData(0)], out.sampleRate);
  }
  let rec = null;
  async function recToggle() {
    if (rec) { rec.mr.stop(); return; }
    try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }), mr = new MediaRecorder(st), ch = []; rec = { mr }; mr.ondataavailable = e => ch.push(e.data);
      mr.onstop = async () => { st.getTracks().forEach(t => t.stop()); rec = null; let blob = new Blob(ch, { type: mr.mimeType }); const fx = $('#recfx') && $('#recfx').checked; try { if (fx) blob = await spooky(blob); } catch (er) { toast('Could not add the effect; saved plain'); } const name = prompt('Name this recording', 'Voice ' + (custom.length + 1)); if (name) { await dbop('readwrite', q => q.put({ id: Date.now() + '', name, blob, oneshot: true })); await loadCustom(); toast('Saved. Find it under Sounds and on the Pads tab.'); } render(); };
      mr.start(); render(); } catch (er) { toast('Could not use the microphone'); }
  }
  /* ---- zone 5 default scenes ---- */
  const Z5 = { s1: [['rain', .6], ['wind', .4], ['thunder', .6]], s2: [['creak', .6], ['whispers', .4], ['crickets', .3]], s3: [['radio', .35], ['whispers', .5], ['drone', .3]], s4: [['drips', .5], ['chains', .45], ['drone', .4]], s5: [['crickets', .5], ['bell', .4], ['wind', .3]], s6: [['drone', .35], ['heart', .3]], s7: [['banshee', .45], ['wind', .4]], s8: [['howl', .5], ['crickets', .4], ['steps', .4]], s9: [['cauldron', .5], ['flies', .3], ['organ', .4]], s10: [['knock', .5], ['clock', .5], ['scratch', .3], ['choir', .3]] };
  if (S.ver < 4) { if (S.zones.length === 4 && S.zones[3].name === 'Living room') { S.zones.push({ name: 'Shop and front porch', dev: 'default', ch: 'both', vol: .85, mute: false }); S.scenes.forEach(sc => { (Z5[sc.id] || []).forEach(([snd, vol]) => sc.cues.push(cue(4, snd, vol))); }); } S.ver = 4; save(); }
  /* ---- phone remote (talks to remote-server.js running on this computer) ---- */
  let rem = { es: null, ok: false, timer: null };
  const REMOTE = 'http://localhost:8787';
  function padList() { return ['banshee', 'demon', 'howl', 'knock', 'scratch', 'creak', 'whispers', 'chains', 'bell', 'steps', 'thunder', 'heart'].concat(custom.filter(c => c.oneshot).map(c => 'c:' + c.id)).map(id => ({ id, name: sndName(id) })); }
  /* every button that should reach all linked computers goes through act() */
  function act(m) { remoteCmd(m); peerSend(m); }
  function remoteCmd(m) {
    if (m.cmd === 'scene') playScene(m.id); else if (m.cmd === 'stop') stopAll(); else if (m.cmd === 'panic') panic();
    else if (m.cmd === 'hit') hit(m.zone === 'all' ? 'all' : +m.zone, m.snd); else if (m.cmd === 'build') { hit('all', 'riser'); setTimeout(() => hit('all'), 8000); }
    else if (m.cmd === 'pad') { const zs = m.zone === 'all' ? S.zones.map((_, i) => i) : [+m.zone]; zs.forEach(i => oneShot(i, m.snd, .9, 6).catch(() => { })); if (m.snd === 'stinger' && m.zone === 'all') hit('all'); }
    else if (m.cmd === 'evtoggle') act({ cmd: 'evset', on: !S.events.on }); else if (m.cmd === 'evset') { S.events.on = !!m.on; save(); evStart(); if (tab === 'auto') render(); }
    else if (m.cmd === 'showgo') { (async () => { if (!armed) await arm(); showGo(0); })(); } else if (m.cmd === 'shownext') { if (showI >= 0) showGo(showI + 1); } else if (m.cmd === 'showstop') showStop();
  }
  function remotePush() { if (!rem.es) return; const el = $('#showinfo'); fetch(REMOTE + '/state', { method: 'POST', headers: { 'x-pin': S.remote.pin, 'content-type': 'application/json' }, body: JSON.stringify({ scenes: S.scenes.map(x => ({ id: x.id, name: x.name })), cur: S.cur, pads: padList(), zones: S.zones.map(z => z.name), events: !!S.events.on, show: showI >= 0 && el ? el.textContent : (showI >= 0 ? 'Show running, step ' + (showI + 1) : '') }) }).catch(() => { }); }
  function remoteOff() { if (rem.es) rem.es.close(); rem.es = null; rem.ok = false; clearInterval(rem.timer); S.remote.on = false; save(); if (tab === 'auto') render(); }
  function remoteOn(pin) {
    if (rem.es) rem.es.close(); clearInterval(rem.timer); S.remote = { on: true, pin }; save();
    const es = rem.es = new EventSource(REMOTE + '/events?pin=' + encodeURIComponent(pin));
    es.onopen = () => { rem.ok = true; if (tab === 'auto') render(); remotePush(); }; es.onerror = () => { if (rem.ok) { rem.ok = false; if (tab === 'auto') render(); } };
    es.onmessage = e => { try { act(JSON.parse(e.data)); } catch (er) { } }; rem.timer = setInterval(remotePush, 1500);
  }
  /* ---- export: mix a zone of a scene into one file for a USB stick or radio; or download one sound ---- */
  let exp = { scene: null, zone: 0, min: 3, fmt: 'mp3', busy: false };
  function loadLame() { return window.lamejs && lamejs.Mp3Encoder ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'lame.min.js'; sc.onload = ok; sc.onerror = () => no(new Error('lame')); document.head.appendChild(sc); }); }
  async function encodeFile(L, R, sr, fmt) {
    if (fmt === 'wav') return wavOf([L, R], sr);
    await loadLame(); const enc = new lamejs.Mp3Encoder(2, sr, 128), out = [], n = L.length, cv = (a, i, j) => { const x = new Int16Array(j - i); for (let k = i; k < j; k++) { const v = Math.max(-1, Math.min(1, a[k])); x[k - i] = v < 0 ? v * 32768 : v * 32767; } return x; };
    for (let i = 0; i < n; i += 1152 * 40) { const j = Math.min(n, i + 1152 * 40), b = enc.encodeBuffer(cv(L, i, j), cv(R, i, j)); if (b.length) out.push(new Uint8Array(b)); if ((i / 1152) % 400 === 0) await new Promise(r => setTimeout(r)); }
    const f = enc.flush(); if (f.length) out.push(new Uint8Array(f)); return new Blob(out, { type: 'audio/mpeg' });
  }
  const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };
  const fname = t => t.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'Hauntica';
  async function sourceOf(id) {
    if (!id.startsWith('c:')) { const g = HS.get(id); return { L: g[0], R: g[1], sr: HS.SR }; }
    const rec = custom.find(c => 'c:' + c.id === id), ac = new AudioContext(), b = await ac.decodeAudioData(await rec.blob.arrayBuffer()); ac.close(); return { L: b.getChannelData(0), R: b.numberOfChannels > 1 ? b.getChannelData(1) : b.getChannelData(0), sr: b.sampleRate };
  }
  async function makeMix() {
    const sc = S.scenes.find(x => x.id === exp.scene) || S.scenes[0], cues = sc.cues.filter(c => c.zone === exp.zone && (sndList().find(q => q.id === c.snd) || {}).loop);
    if (!cues.length) { toast('That scene has no looping sounds in that zone'); return; }
    exp.busy = true; $('#expst').textContent = 'Mixing... this takes a few seconds'; await new Promise(r => setTimeout(r, 50));
    try {
      const sr = HS.SR, N = exp.min * 60 * sr, X = 2 * sr, L = new Float32Array(N + X), R = new Float32Array(N + X);
      for (const c of cues) { const src = await sourceOf(c.snd); let sl = src.L, sr2 = src.R; if (src.sr !== sr) { const k = src.sr / sr, m = Math.floor(sl.length / k), a = new Float32Array(m), b = new Float32Array(m); for (let i = 0; i < m; i++) { a[i] = sl[Math.floor(i * k)]; b[i] = sr2[Math.floor(i * k)]; } sl = a; sr2 = b; } const len = sl.length, off = Math.floor(Math.random() * len); for (let i = 0; i < N + X; i++) { const k = (i + off) % len; L[i] += sl[k] * c.vol; R[i] += sr2[k] * c.vol; } }
      let m = 1e-6; for (let i = 0; i < N + X; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i])); const g = Math.min(1, .9 / m) * (m > .9 ? 1 : 1);
      const oL = new Float32Array(N), oR = new Float32Array(N); for (let i = 0; i < N; i++) { oL[i] = L[i] * g; oR[i] = R[i] * g; }
      for (let i = 0; i < X; i++) { const t = i / X, a = Math.sin(t * Math.PI / 2), b = Math.cos(t * Math.PI / 2); oL[i] = L[i] * g * a + L[N + i] * g * b; oR[i] = R[i] * g * a + R[N + i] * g * b; }
      $('#expst').textContent = 'Encoding...'; const blob = await encodeFile(oL, oR, sr, exp.fmt);
      saveBlob(blob, 'Hauntica_' + fname(sc.name) + '_' + fname(S.zones[exp.zone].name) + '.' + exp.fmt); $('#expst').textContent = 'Saved ' + (blob.size / 1048576).toFixed(1) + ' MB. Copy it to the USB stick.';
    } catch (er) { $('#expst').textContent = 'Could not make the file: ' + (er.message || er); }
    exp.busy = false;
  }
  async function dlSound(id) { toast('Making the file...'); try { const s0 = await sourceOf(id), blob = await encodeFile(s0.L, s0.R, s0.sr, exp.fmt); saveBlob(blob, 'Hauntica_' + fname(sndName(id)) + '.' + exp.fmt); } catch (er) { toast('Could not make the file'); } }
  const oldSounds = views.sounds;
  views.sounds = () => { if (!exp.scene || !S.scenes.some(x => x.id === exp.scene)) exp.scene = S.scenes[0].id; if (exp.zone >= S.zones.length) exp.zone = 0;
    return `<div class="card"><h3>Make a file for a USB stick or radio</h3><p class="mu xs">Mixes one zone of one scene into a single looping file. Copy it to a USB stick and plug it into the radio. MP3 plays on almost every radio. (There is a very short pause where the file repeats on most radios.)</p>
    <div class="row"><select data-expsc>${S.scenes.map(x => `<option value="${x.id}" ${x.id === exp.scene ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><select data-expz>${S.zones.map((z, i) => `<option value="${i}" ${i === exp.zone ? 'selected' : ''}>${i + 1}: ${esc(z.name)}</option>`).join('')}</select><select data-expm>${[2, 3, 5, 8].map(m => `<option value="${m}" ${m === exp.min ? 'selected' : ''}>${m} minutes</option>`).join('')}</select><select data-expf><option value="mp3" ${exp.fmt === 'mp3' ? 'selected' : ''}>MP3</option><option value="wav" ${exp.fmt === 'wav' ? 'selected' : ''}>WAV (big)</option></select><button data-mk class="big">Make file</button></div><p class="xs" id="expst"></p></div>` + oldSounds(); };
  const oldRows = null;
  const wrapAuto = () => { views.auto = (f => () => f() + `<h2>Phone remote</h2><div class="card"><p class="xs mu">Control scenes and jump scares from your phone while you walk around. It needs a small helper that runs on <b>this</b> computer (the one running Hauntica). Nothing leaves your Wi-Fi.</p>
    <ol class="sm"><li>Install Node.js (the LTS download at nodejs.org) on this computer, once.</li><li>Download <a href="remote-server.js" download>remote-server.js</a> and <a href="start-remote.bat" download>start-remote.bat</a> into the same folder. Double-click <b>start-remote.bat</b>. A window shows a PIN and your phone's web address.</li><li>Type the PIN here and press Connect. Then open the web address on your phone.</li></ol>
    <div class="row"><input type="text" id="rpin" placeholder="PIN" inputmode="numeric" value="${esc((S.remote || {}).pin || '')}" style="width:110px"><button data-rcon class="big">${rem.es ? 'Reconnect' : 'Connect'}</button>${rem.es ? '<button data-roff class="rec">Disconnect</button>' : ''}<span class="xs ${rem.ok ? '' : 'mu'}">${rem.ok ? '<span class="dot live"></span> connected to the helper' : rem.es ? 'waiting for the helper...' : 'not connected'}</span></div></div>`)(views.auto); };
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.mk != null) { if (!exp.busy) makeMix(); return; }
    if (d.dl) { dlSound(d.dl); return; }
    if (d.rcon != null) { const pin = $('#rpin').value.trim(); if (!pin) { toast('Type the PIN shown in the helper window'); return; } remoteOn(pin); render(); return; }
    if (d.roff != null) { remoteOff(); return; }
  });
  document.addEventListener('change', e => { const t = e.target, d = t.dataset; if (d.expsc != null) exp.scene = t.value; else if (d.expz != null) exp.zone = +t.value; else if (d.expm != null) exp.min = +t.value; else if (d.expf != null) exp.fmt = t.value; });
  /* ---- link another computer (WebRTC, pasted codes, no server) and copy settings ---- */
  const peers = []; let pend = null, devName = 'Computer ' + (Math.random() * 90 + 10 | 0);
  const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))), unb64 = t => JSON.parse(decodeURIComponent(escape(atob(t.trim().replace(/\s+/g, '')))));
  function peerSend(m) { const t = JSON.stringify({ t: 'cmd', m }); peers.forEach(p => { try { if (p.dc && p.dc.readyState === 'open') p.dc.send(t); } catch (e) { } }); }
  function peerWire(p) {
    p.dc.onopen = () => { p.ok = true; toast('Linked with another computer'); if (tab === 'auto') render(); };
    p.dc.onclose = () => { p.ok = false; if (tab === 'auto') render(); };
    p.dc.onmessage = e => { let o; try { o = JSON.parse(e.data); } catch (er) { return; } if (o.t === 'cmd') remoteCmd(o.m); else if (o.t === 'settings') applySettings(o.s, true); };
  }
  function newPC() { return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); }
  const gathered = pc => new Promise(ok => { if (pc.iceGatheringState === 'complete') return ok(); const t = setTimeout(ok, 4000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); ok(); } }); });
  async function linkStart() { const pc = newPC(), p = { pc, ok: false }; p.dc = pc.createDataChannel('h'); peerWire(p); await pc.setLocalDescription(await pc.createOffer()); await gathered(pc); pend = p; peers.push(p); return b64({ k: 'offer', d: pc.localDescription }); }
  async function linkJoin(code) { const o = unb64(code); if (o.k !== 'offer') throw new Error('That is not an offer code'); const pc = newPC(), p = { pc, ok: false }; pc.ondatachannel = e => { p.dc = e.channel; peerWire(p); }; await pc.setRemoteDescription(o.d); await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc); peers.push(p); return b64({ k: 'answer', d: pc.localDescription }); }
  async function linkFinish(code) { const o = unb64(code); if (o.k !== 'answer' || !pend) throw new Error('Start a link first, then paste the answer code'); await pend.pc.setRemoteDescription(o.d); pend = null; }
  const settingsOf = () => ({ zones: S.zones, scenes: S.scenes, events: S.events, show: S.show, videos: S.videos, fade: S.fade, flash: S.flash });
  function applySettings(inc, ask) {
    if (!inc || !inc.zones || !inc.scenes) { toast('That file is not Hauntica settings'); return; }
    if (ask && !confirm('The other computer wants to replace this computer\'s scenes and zone names with its own. Output devices on this computer stay as they are. Continue?')) return;
    const old = S.zones; S = Object.assign(S, inc, { ver: 4, remote: S.remote, cur: null }); S.zones = inc.zones.map((z, i) => ({ ...z, dev: old[i] ? old[i].dev : 'default', ch: old[i] ? old[i].ch : z.ch }));
    save(); toast('Settings copied'); render();
  }
  views.devices = () => '';
  const zonesOld = views.zones;
  views.zones = () => `<div class="card warn"><h3>This computer plays these zones</h3><p class="xs">Using two computers? Tick only the zones whose speakers are plugged into <b>this</b> computer. Each computer then plays just its own part of every scene. Leave all ticked if this is the only computer.</p><div class="row">${S.zones.map((z, i) => `<label class="chk"><input type="checkbox" data-mine="${i}" ${mine(i) ? 'checked' : ''}> ${i + 1}: ${esc(z.name)}</label>`).join('')}</div></div>` + zonesOld();
  const wrapAuto2 = () => { views.auto = (f => () => f() + `<h2>Link another computer</h2><div class="card"><p class="xs mu">Link two Hauntica computers so that pressing a scene, a jump scare, Stop or Panic on either one does it on both. Both computers must be on the same Wi-Fi. No server is needed: you copy two codes between them (text message, email or chat to yourself).</p>
    <div class="row"><span class="xs ${peers.some(p => p.ok) ? '' : 'mu'}">${peers.filter(p => p.ok).length ? '<span class="dot live"></span> ' + peers.filter(p => p.ok).length + ' computer(s) linked' : 'not linked'}</span></div>
    <h3>Computer A (start)</h3><div class="row"><button data-lk1>1. Make a link code</button></div><textarea id="lkcode" rows="3" style="width:100%;background:#0a0408;color:var(--tx);border:1px solid var(--ln);border-radius:8px" readonly placeholder="the code appears here: copy it to the other computer"></textarea><div class="row"><button data-lkcopy>Copy code</button></div>
    <h3>Computer B (join)</h3><div class="row"><span class="xs mu">Paste A's code, then press Make answer, and copy the answer back to A.</span></div><textarea id="lkin" rows="3" style="width:100%;background:#0a0408;color:var(--tx);border:1px solid var(--ln);border-radius:8px" placeholder="paste the code here"></textarea><div class="row"><button data-lk2>2. Make answer (on B)</button><button data-lk3>3. Finish (on A, with B's answer pasted above)</button></div></div>
    <h2>Copy settings</h2><div class="card"><p class="xs mu">Copies zone names, scenes, show timeline and random-scare settings. Output devices stay as set on each computer. Your own recorded or uploaded sound files are not copied: add them on each computer.</p><div class="row"><button data-sendset ${peers.some(p => p.ok) ? '' : 'disabled'}>Send my settings to linked computers</button><button data-expset>Save settings to a file</button><label class="big"><input type="file" id="impset" accept=".json"> load from file</label></div></div>`)(views.auto); };
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    try {
      if (d.lk1 != null) { $('#lkcode').value = 'working...'; $('#lkcode').value = await linkStart(); return; }
      if (d.lkcopy != null) { const t = $('#lkcode'); t.select(); try { await navigator.clipboard.writeText(t.value); toast('Copied'); } catch (er) { document.execCommand('copy'); } return; }
      if (d.lk2 != null) { $('#lkcode').value = 'working...'; $('#lkcode').value = await linkJoin($('#lkin').value); toast('Now copy the answer code back to computer A'); return; }
      if (d.lk3 != null) { await linkFinish($('#lkin').value); toast('Connecting...'); return; }
    } catch (er) { toast(er.message || 'That did not work. Start again.'); return; }
    if (d.sendset != null) { const t = JSON.stringify({ t: 'settings', s: settingsOf() }); peers.forEach(p => { try { if (p.dc.readyState === 'open') p.dc.send(t); } catch (er) { } }); toast('Sent'); return; }
    if (d.expset != null) { saveBlob(new Blob([JSON.stringify(settingsOf(), null, 1)], { type: 'application/json' }), 'hauntica-settings.json'); return; }
  });
  document.addEventListener('change', async e => { const t = e.target, d = t.dataset;
    if (d.mine != null) { const all = S.zones.map((_, i) => i); let m = (dev.mine && dev.mine.length ? dev.mine : all).slice(); const i = +d.mine; m = t.checked ? [...new Set(m.concat(i))] : m.filter(x => x !== i); dev.mine = m.length === all.length ? null : m; if (!m.length) { dev.mine = null; toast('At least one zone must stay ticked'); render(); } saveDev(); return; }
    if (t.id === 'impset' && t.files[0]) { try { applySettings(JSON.parse(await t.files[0].text()), false); } catch (er) { toast('Could not read that file'); } } });
  const SCARE = ['stinger', 'slam', 'riser', 'banshee', 'demon', 'howl', 'knock', 'scratch', 'creak', 'whispers', 'chains', 'bell', 'steps', 'breath', 'heart', 'cauldron', 'flies', 'scrape', 'choir', 'organ', 'musicbox', 'radio', 'thunder', 'drips'];
  let padZone = 'all';
  views.pads = () => `<h2>Scare pads</h2><div class="card"><div class="row"><span>Send to</span><button data-pz="all" class="${padZone === 'all' ? 'on' : ''}">All zones</button>${S.zones.map((z, i) => `<button data-pz="${i}" class="${padZone === String(i) ? 'on' : ''}">${i + 1}: ${esc(z.name)}</button>`).join('')}</div><p class="mu xs">Tap a pad to play that sound once (loops play a short random piece). Your recorded voice lines are at the end.</p></div>
    <div class="grid">${SCARE.map(id => `<button class="scene" data-pad="${id}" style="min-height:62px">${esc(sndName(id))}</button>`).join('')}${custom.filter(c => c.oneshot).map(c => `<button class="scene" data-pad="c:${esc(c.id)}" style="min-height:62px">&#127908; ${esc(c.name)}</button>`).join('')}</div>`;
  views.auto = () => { const E = S.events, sh = S.show; return `<h2>Random scares</h2><div class="card"><div class="row"><button data-evon class="${E.on ? 'on' : ''}">${E.on ? 'Random scares are ON' : 'Random scares are off'}</button><label class="chk"><input type="checkbox" data-evonly ${E.onlyPlaying ? 'checked' : ''}> only while a scene is playing</label></div>
      <div class="row"><span>About one every</span><input type="range" min="10" max="180" step="5" value="${E.mean}" data-evmean><b id="evmeanv">${E.mean} s</b><span class="mu xs">volume</span><input type="range" min=".2" max="1" step=".05" value="${E.vol}" data-evvol></div>
      <div class="row"><span class="mu xs">Zones:</span>${S.zones.map((z, i) => `<label class="chk"><input type="checkbox" data-evz="${i}" ${!E.zones.length || E.zones.includes(i) ? 'checked' : ''}> ${esc(z.name)}</label>`).join('')}</div>
      <div class="row"><span class="mu xs">Sounds that can pop up:</span>${SCARE.concat(custom.filter(c => c.oneshot).map(c => 'c:' + c.id)).map(id => `<label class="chk"><input type="checkbox" data-evs="${esc(id)}" ${E.pool.includes(id) ? 'checked' : ''}> ${esc(sndName(id))}</label>`).join('')}</div><p class="xs mu" id="evlast">${E.last ? 'Last scare: ' + esc(E.last) : 'Nothing has fired yet.'}</p></div>
    <h2>Show timeline</h2><div class="card"><p class="xs mu">Runs your scenes one after another by itself. Each step plays its scene for the minutes you set, then fades to the next.</p>
      ${sh.steps.map((st, i) => `<div class="row"><b>${i + 1}</b><select data-shs="${i}">${S.scenes.map(x => `<option value="${x.id}" ${x.id === st.scene ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><input type="number" min="1" max="120" value="${st.min}" data-shm="${i}" style="width:64px"> min<label class="chk"><input type="checkbox" data-shh="${i}" ${st.hit ? 'checked' : ''}> big hit at start</label><button data-shdel="${i}" class="rec">x</button></div>`).join('')}
      <div class="row"><button data-shadd>+ Add step</button><label class="chk"><input type="checkbox" data-shloop ${sh.loop ? 'checked' : ''}> repeat from the start</label></div>
      <div class="row"><button class="big ok" data-shgo>${showI < 0 ? 'Start show' : 'Restart show'}</button><button data-shnext>Next step</button><button data-shstop class="rec">Stop show</button></div><p id="showinfo" class="xs">Show not running.</p></div>`; };
  views.print = () => `<h2>Setup sheet</h2><div class="card"><button data-doprint class="big">Print this page</button><p class="mu xs">Fill in the speaker notes, then print and tape it up in the control room.</p></div>
    <div class="card"><table><tr><th>#</th><th>Zone</th><th>Output device</th><th>Channel</th><th>Speaker, cable and notes</th></tr>${S.zones.map((z, i) => `<tr><td>${i + 1}</td><td>${esc(z.name)}</td><td class="xs">${esc(z.dev === 'default' ? 'Computer default' : ((devs.find(d => d.deviceId === z.dev) || {}).label || 'selected device'))}</td><td>${z.ch === 'both' ? 'Stereo' : z.ch === 'L' ? 'Left' : 'Right'}</td><td><input type="text" data-znote="${i}" value="${esc(z.note || '')}" placeholder="e.g. Scarlett A out 1, mixer ch 1, cave amp" style="width:100%"></td></tr>`).join('')}</table></div>
    <div class="card"><h3>Before guests arrive</h3><ol><li>Both Scarletts and the mixer powered on, faders down.</li><li>Open Hauntica in Chrome or Edge. Press Arm audio.</li><li>Zones tab: Test all zones in turn. Walk every speaker.</li><li>Lights tab: connect each light, test red, green, blue.</li><li>Computer sleep off. Phone silenced.</li><li>Press Panic (top) to practice stopping everything.</li></ol></div>`;
  document.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (b.id === 'panic') { act({ cmd: 'panic' }); return; }
    if (d.pz != null && d.pz !== '') { padZone = d.pz; render(); return; }
    if (d.pad) { act({ cmd: 'pad', snd: d.pad, zone: padZone === 'all' ? 'all' : +padZone }); return; }
    if (d.evon != null) { act({ cmd: 'evset', on: !S.events.on }); return; }
    if (d.shadd != null) { S.show.steps.push({ scene: S.scenes[0].id, min: 15, hit: false }); save(); render(); return; }
    if (d.shdel) { S.show.steps.splice(+d.shdel, 1); save(); render(); return; }
    if (d.shgo != null) { act({ cmd: 'showgo' }); return; }
    if (d.shnext != null) { act({ cmd: 'shownext' }); return; }
    if (d.shstop != null) { act({ cmd: 'showstop' }); return; }
    if (d.doprint != null) { window.print(); return; }
    if (d.rec != null) { recToggle(); return; }
    if (d.oneshot) { const id = d.oneshot.slice(2), r = custom.find(c => c.id === id); if (r) { r.oneshot = !r.oneshot; await dbop('readwrite', q => q.put(r)); } render(); return; }
    if (d.flash != null) { S.flash = S.flash === false; save(); render(); return; }
  });
  document.addEventListener('input', e => {
    const t = e.target, d = t.dataset;
    if (d.evmean != null) { S.events.mean = +t.value; $('#evmeanv').textContent = t.value + ' s'; save(); return; }
    if (d.evvol != null) { S.events.vol = +t.value; save(); return; }
    if (d.shm != null) { S.show.steps[+d.shm].min = Math.max(1, +t.value || 1); save(); return; }
    if (d.znote != null) { S.zones[+d.znote].note = t.value; save(); }
  });
  document.addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (d.evonly != null) { S.events.onlyPlaying = t.checked; save(); return; }
    if (d.evz != null) { const all = S.zones.map((_, i) => i), cur = S.events.zones.length ? S.events.zones : all, i = +d.evz; let n = t.checked ? cur.concat(i) : cur.filter(x => x !== i); n = [...new Set(n)]; S.events.zones = n.length === all.length || !n.length ? [] : n; save(); return; }
    if (d.evs != null) { const p = S.events.pool; S.events.pool = t.checked ? [...new Set(p.concat(d.evs))] : p.filter(x => x !== d.evs); save(); return; }
    if (d.shs != null) { S.show.steps[+d.shs].scene = t.value; save(); return; }
    if (d.shh != null) { S.show.steps[+d.shh].hit = t.checked; save(); return; }
    if (d.shloop != null) { S.show.loop = t.checked; save(); return; }
  });
  wrapAuto(); wrapAuto2();
  if (S.remote && S.remote.on && S.remote.pin) setTimeout(() => remoteOn(S.remote.pin), 600);
  window.HAUNT = { S, Z, playScene, stopAll, hit, arm, zone, buf, sndList };
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  HL.onchange = () => { if (tab === 'lights' || tab === 'edit') render(); };
  evStart();
  loadCustom().then(() => listDevices(false)).then(render);
})();
