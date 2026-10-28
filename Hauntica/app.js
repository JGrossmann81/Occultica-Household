/* Hauntica: zones (each tied to one output device and channel), scenes (sets of looping sounds per zone), YouTube video windows. */
(function () {
  const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'hauntica-v1';
  const ZN = ['Front porch', 'Hallway', 'Living room', 'Basement'];
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
    zones: ZN.map((n, i) => ({ name: n, dev: 'default', ch: i === 0 ? 'L' : i === 1 ? 'R' : 'both', vol: .85, mute: false })),
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
  let S; try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!S || !S.zones) S = DEF();
  if (!S.ver || S.ver < 2) { MORE().forEach(m => { if (!S.scenes.some(x => x.id === m.id)) S.scenes.push(m); }); S.ver = 2; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  let tab = 'scenes', editSc = null, devs = [], custom = [], armed = false;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2800); };

  /* ---- custom sound files in IndexedDB ---- */
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open('hauntica', 1); r.onupgradeneeded = () => r.result.createObjectStore('snd', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const dbop = (mode, fn) => idb().then(db => new Promise((ok, no) => { const tx = db.transaction('snd', mode), st = tx.objectStore('snd'), q = fn(st); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => no(tx.error); })).catch(() => []);
  const loadCustom = async () => { custom = (await dbop('readonly', s => s.getAll())) || []; };
  const sndList = () => HS.order.map(id => ({ id, name: HS.gen[id].name, loop: HS.gen[id].loop })).concat(custom.map(c => ({ id: 'c:' + c.id, name: c.name, loop: true, custom: true })));
  const sndName = id => { const s = sndList().find(x => x.id === id); return s ? s.name : id + ' (missing)'; };

  /* ---- audio engine: one AudioContext per zone, sent to that zone's output device ---- */
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
  async function arm() { for (let i = 0; i < S.zones.length; i++) { const z = zone(i); try { await z.ctx.resume(); } catch (e) { } } armed = true; $('#arm').textContent = 'Audio armed'; $('#arm').classList.add('ok'); }
  async function playScene(id) {
    if (!armed) await arm();
    const sc = S.scenes.find(s => s.id === id); if (!sc) return; S.cur = id; save();
    const want = {}; sc.cues.forEach(c => { want[c.zone + '|' + c.snd] = 1; });
    Z.forEach((z, i) => { if (!z) return; Object.keys(z.voices).forEach(k => { if (!want[i + '|' + k] && !k.startsWith('prev:')) fadeOut(z, k, S.fade); }); });
    const lt = lightOf(sc); if (window.HL && HL.lights.length) HL.set(lt.mode, lt.color);
    await Promise.all(sc.cues.filter(c => S.zones[c.zone]).map(c => startCue(c.zone, c, S.fade))); refresh();
  }
  function stopAll() { Z.forEach(z => { if (z) Object.keys(z.voices).forEach(k => fadeOut(z, k, 1.2)); }); S.cur = null; save(); if (window.HL && HL.lights.length) HL.set('off'); refresh(); }
  async function hit(which, snd) { snd = snd || 'stinger'; if (!armed) await arm(); const zs = which === 'all' ? S.zones.map((_, i) => i) : [which]; for (const i of zs) { const z = zone(i), b = await buf(z, snd), s = z.ctx.createBufferSource(), g = z.ctx.createGain(); s.buffer = b; g.gain.value = 1; s.connect(g); g.connect(z.bus); s.start(); } }
  async function preview(i, id) { if (!armed) await arm(); const z = zone(i), k = 'prev:' + id; if (z.voices[k]) { fadeOut(z, k, .3); refresh(); return; } const b = await buf(z, id), s = z.ctx.createBufferSource(), g = z.ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = .7; s.connect(g); g.connect(z.bus); s.start(); const vo = z.voices[k] = { src: s, g }; s.onended = () => { if (z.voices[k] === vo) delete z.voices[k]; refresh(); }; setTimeout(() => { if (z.voices[k] === vo) { fadeOut(z, k, 1); refresh(); } }, 20000); refresh(); }
  async function testZone(i) {
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
      return `<h2>Sounds</h2><div class="card"><div class="row"><span>Listen on</span><select id="pz">${S.zones.map((z, i) => `<option value="${i}" ${sounds.pz == i ? 'selected' : ''}>Zone ${i + 1}: ${esc(z.name)}</option>`).join('')}</select><label class="big"><input type="file" id="up" accept="audio/*,video/mp4,video/webm" multiple> add your own files</label></div><p class="mu xs">Uploaded files stay on this computer (in the browser). Use only sounds you made, bought or that are free for public use. Good free sources: freesound.org (filter to CC0), pixabay.com/sound-effects, sonniss.com GDC free bundles, YouTube Audio Library. Check each license.</p></div>
      <table>${sndList().map(s => `<tr><td>${esc(s.name)}</td><td class="mu xs">${s.custom ? 'your file' : 'made by Hauntica'}${s.loop ? ', loops' : ''}</td><td><button data-prev="${esc(s.id)}" class="${Z[sounds.pz] && Z[sounds.pz].voices['prev:' + s.id] ? 'on' : ''}">${Z[sounds.pz] && Z[sounds.pz].voices['prev:' + s.id] ? 'Stop' : 'Listen'}</button>${s.custom ? `<button data-delsnd="${esc(s.id)}" class="rec">Delete</button>` : ''}</td></tr>`).join('')}</table>`;
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
    if (b.id === 'stopall') { stopAll(); return; }
    if (d.play) { playScene(d.play); return; }
    if (d.hit) { if (d.hit === 'build') { hit('all', 'riser'); setTimeout(() => hit('all'), 8000); toast('Building... hit in 8 seconds'); return; } const [w, sn] = d.hit.split('|'); hit(w === 'all' ? 'all' : +w, sn); return; }
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
  document.addEventListener('keydown', e => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'Escape') { stopAll(); return; } const n = +e.key; if (n >= 1 && n <= 9 && S.scenes[n - 1]) playScene(S.scenes[n - 1].id); });
  navigator.mediaDevices && navigator.mediaDevices.addEventListener && navigator.mediaDevices.addEventListener('devicechange', () => listDevices(false));
  $('#fade').value = S.fade; $('#fadev').textContent = S.fade + ' s';
  window.HAUNT = { S, Z, playScene, stopAll, hit, arm, zone, buf, sndList };
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  HL.onchange = () => { if (tab === 'lights' || tab === 'edit') render(); };
  loadCustom().then(() => listDevices(false)).then(render);
})();
