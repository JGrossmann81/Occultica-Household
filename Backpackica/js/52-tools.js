/* Backpackica: Survive > Tools. Compass, sun/stars/watch, signal, time to dark, pace/ETA, weather read, boil and water.
   Everything works offline. Pushes the 'Tools' section into BP.surviveSections.
   Other modules can offer "go to" targets for the compass: BP.gotoPoints.push(() => [{name, lat, lon}]). */
window.BP = window.BP || { todayCards: [] };
(function () {
  'use strict';
  const esc = OA.esc, G = OA.geo, $ = OA.$;
  BP.surviveSections = BP.surviveSections || [];
  BP.gotoPoints = BP.gotoPoints || [];
  OA.defaults({ svtools: { decl: null, declAt: null, declPlace: '', pts: [], goto: '', campMin: 60, tool: { pace: { dist: '', gain: '', loss: '', load: 'med', tired: 'fresh', brk: true }, water: { hours: 4, cond: 'mod' }, boil: { elev: '' } } } });
  const SV = () => OA.S.svtools;
  const U = () => OA.unit.dist() === 'km';
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const norm = a => ((a % 360) + 360) % 360;
  const hhmm = d => d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '–';
  const val = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const num = id => { const v = parseFloat(val(id)); return isNaN(v) ? null : v; };
  let cleanups = [];
  const onClose = () => { cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = []; };

  /* ---------- tool tiles ---------- */
  const TOOLS = [
    { id: 'compass', label: 'Compass', icon: 'compass', blurb: 'Phone heading, true vs magnetic, go-to bearing.', open: compassTool },
    { id: 'sun', label: 'Sun, watch and stars', icon: 'sun', blurb: 'Find direction with no compass.', open: sunTool },
    { id: 'signal', label: 'Signal', icon: 'bolt', blurb: 'Screen SOS flasher, whistle, mirror, ground symbols.', open: signalTool },
    { id: 'dark', label: 'Time to dark', icon: 'moon', blurb: 'Sunset countdown and make-camp-by time.', open: darkTool },
    { id: 'pace', label: 'Pace and ETA', icon: 'clock', blurb: 'Hiking time from distance and climb.', open: paceTool },
    { id: 'wx', label: 'Weather read', icon: 'cloud', blurb: 'Sky and wind signs, with the forecast.', open: wxTool },
    { id: 'water', label: 'Boil time and water', icon: 'drop', blurb: 'Boil minutes by elevation, water to carry.', open: waterTool }
  ];
  BP.surviveSections.push({
    id: 'tools', label: 'Tools', order: 30, render(el) {
      el.innerHTML = `<p class="sm dim">Each tool works with no signal. Phone sensors can be wrong: carry a paper map and a real compass.</p><div class="sv-grid tiles">${TOOLS.map((t, i) => `<button class="sv-tile" data-act="svtOpen" data-id="${t.id}" ${i === 0 ? 'data-smoke' : ''}>${OA.icon(t.icon, 'lg')}<b>${esc(t.label)}</b><span>${esc(t.blurb)}</span></button>`).join('')}</div>`;
    }
  });
  OA.act('svtOpen', el => { const t = TOOLS.find(x => x.id === el.dataset.id); if (t) t.open(); });
  function sheet(title, html, open) { cleanups = []; OA.sheet(title, html, { onOpen: root => { cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = []; if (open) open(root); }, onClose }); }

  /* ================= 1. COMPASS ================= */
  let C = null;
  function roseSvg() {
    let t = '';
    for (let a = 0; a < 360; a += 10) { const major = a % 90 === 0, mid = a % 30 === 0, r1 = major ? 76 : mid ? 82 : 86; t += `<line x1="0" y1="${-r1}" x2="0" y2="-92" transform="rotate(${a})" stroke="${major ? '#e0b861' : '#9db8a5'}" stroke-width="${major ? 2.2 : 1}"/>`; }
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(l => { t += `<g transform="rotate(${l[1]}) translate(0 -60)"><text class="cp-l" data-a="${l[1]}" text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="700" fill="${l[0] === 'N' ? '#e86a5c' : '#efe9cf'}">${l[0]}</text></g>`; });
    [45, 135, 225, 315].forEach((a, i) => { t += `<g transform="rotate(${a}) translate(0 -62)"><text class="cp-l" data-a="${a}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="#9db8a5">${['NE', 'SE', 'SW', 'NW'][i]}</text></g>`; });
    return `<svg viewBox="-100 -104 200 208" class="cp-svg" role="img" aria-label="Compass rose"><circle r="95" fill="#0b120b" stroke="#3b4d35" stroke-width="2"/><g id="cp-rose">${t}<g id="cp-tgt" style="display:none"><path d="M0 -99 L7 -111 L-7 -111 Z" fill="#6fd08a" stroke="#0b120b"/></g></g><path d="M0 -96 L8 -112 L-8 -112 Z" fill="#e0b861" stroke="#0b120b" transform="translate(0 4)"/><circle r="4" fill="#e0b861"/></svg>`;
  }
  function declText() {
    const d = SV().decl;
    if (d == null) return 'Declination not set, so only magnetic headings are shown.';
    let w = ''; const f = G.known(), at = SV().declAt;
    if (f && at) { const mi = G.mi(f, at); if (mi > 150) w = ` You are about ${esc(OA.dist(mi, 0))} from where you set it: declination changes with place, so check it again.`; }
    return `Declination ${Math.abs(d)}° ${d >= 0 ? 'east' : 'west'}${SV().declPlace ? ' (' + esc(SV().declPlace) + ')' : ''}.${w}`;
  }
  function ptsAll() {
    const own = SV().pts.map(p => ({ id: 'p:' + p.id, name: p.name, lat: p.lat, lon: p.lon }));
    let ext = []; BP.gotoPoints.forEach(fn => { try { (fn() || []).forEach((p, i) => { if (p && p.lat != null && p.lon != null) ext.push({ id: 'x:' + (p.id || p.name || i), name: p.name || 'Point', lat: +p.lat, lon: +p.lon }); }); } catch (e) { } });
    return own.concat(ext);
  }
  function ptOptions() { const s = SV().goto; return `<option value="">No target</option>` + ptsAll().map(p => `<option value="${esc(p.id)}" ${p.id === s ? 'selected' : ''}>${esc(p.name)}</option>`).join(''); }
  function compassTool() {
    const ios = typeof window.DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    const d = SV().decl;
    sheet('Compass', `
      <div class="cp-wrap">${roseSvg()}
        <div class="center"><div class="big-num" id="cp-h">--</div><div class="sm dim" id="cp-s">Waiting for the compass…</div><div class="b" id="cp-t"></div></div>
        ${ios ? `<button class="btn gold block" id="cp-on" data-act="svtCompassOn">Turn on the compass</button>` : ''}
        <div class="alert" id="cp-msg" style="display:none"></div>
      </div>
      <div class="card inner"><b>Declination (magnetic to true)</b>
        <div class="two"><label class="fl">Degrees (east +, west −)<input class="in" id="cp-decl" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 12.5 or -8" value="${d == null ? '' : esc(d)}" data-bind="svtools.decl" data-type="number" data-then="svtDecl"></label>
        <label class="fl">Place (optional)<input class="in" type="text" maxlength="40" placeholder="Yosemite" value="${esc(SV().declPlace)}" data-bind="svtools.declPlace"></label></div>
        <div class="sm" id="cp-dnote">${declText()}</div>
        <details><summary class="sm gold">How to find and use it</summary><div class="sm">
          <p>Declination is the angle between true north (the map's north pole) and where a magnetic compass points. It is different in every place and changes slowly over the years.</p>
          <p><b>East declination (positive):</b> add it to a magnetic bearing to get the true bearing. Example: magnetic 100° with 12° east gives true 112°.<br><b>West declination (negative):</b> subtract it. Example: magnetic 100° with 8° west (−8) gives true 92°.</p>
          <p>To go the other way, from a true (map) bearing to a magnetic one: subtract east, add west.</p>
          <p><b>Look it up before the trip</b> (it needs signal): NOAA's magnetic declination calculator (search “NOAA magnetic declination”), the NOAA <a href="https://ncei.noaa.gov/products/world-magnetic-model" target="_blank" rel="noopener">World Magnetic Model</a> page, or the margin of a recent topographic map. Type it in here. Update it each year, and when you travel far.</p></div></details></div>
      <div class="card inner"><b>Go to a saved point</b>
        <label class="fl">Target<select class="in" id="cp-pt" data-bind="svtools.goto" data-then="svtGoto">${ptOptions()}</select></label>
        <div id="cp-go" class="sm dim">Pick a point to see the bearing and distance. Needs a GPS fix (no signal needed).</div>
        <div class="row"><input class="in" id="cp-name" type="text" maxlength="30" placeholder="Name: car, camp, junction" style="flex:2"><button class="btn" data-act="svtSavePt">Save here</button></div>
        <details><summary class="sm gold">Add by coordinates or remove</summary><div class="two"><label class="fl">Latitude<input class="in" id="cp-lat" inputmode="decimal" placeholder="38.58160"></label><label class="fl">Longitude<input class="in" id="cp-lon" inputmode="decimal" placeholder="-121.49440"></label></div><div class="row"><button class="btn" data-act="svtAddPt">Add point</button><button class="btn danger" data-act="svtDelPt">Delete selected</button></div></details>
        <div class="two"><label class="fl">Back bearing of<input class="in" id="cp-bb" type="number" inputmode="decimal" placeholder="degrees" data-live="svtBack"></label><div class="fl">is<div class="b" id="cp-bbo" style="padding:12px 0">–</div></div></div></div>
      <div class="alert"><b class="t">Phone compasses are unreliable</b>Metal, magnets, cases, vehicles, power lines and electronics throw them off, and a phone that is not calibrated can be tens of degrees wrong. Hold it flat and away from metal. To calibrate, move the phone in a figure-8 in the air a few times. Check it against the sun (Sun, watch and stars tool) or a known landmark, and carry a real compass.</div>
      <details class="card inner"><summary class="b gold">Real compass and map: orient, bearing, resection</summary><div class="sm">
        <p><b>Orient the map:</b> lay the map flat, put the compass on it with the edge along a north-south grid line and the direction arrow toward the top. Turn map and compass together until the needle's red end sits in the orienting arrow, then adjust for declination. The map now matches the land.</p>
        <p><b>Take a bearing to a landmark:</b> point the direction-of-travel arrow at it, turn the dial until the orienting arrow lines up with the red end of the needle, and read the bearing at the index line. That is a magnetic bearing.</p>
        <p><b>Resection (find where you are):</b> take bearings to two or three landmarks you can identify on the map, spread at least 60 degrees apart. Convert each to a true (map) bearing, then flip each by 180° (the back bearing). On the map, draw each back bearing line from its landmark. Your position is where the lines cross; with three, the small triangle they form shows your error. Resection is only as good as your bearings.</p>
        <p>More: Survive manual, “Use a compass”. Practise before you need it.</p></div></details>`, compassOpen);
  }
  function compassOpen() {
    const ios = typeof window.DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    C = { raw: null, sm: null, abs: false, acc: null, raf: 0, watch: null, pos: null, got: false, t0: Date.now() };
    cleanups.push(compassStop);
    if (!ios) compassStart(); else setMsg('Tap “Turn on the compass”. Your phone will ask permission.');
    const loop = () => { if (!C) return; paint(); C.raf = requestAnimationFrame(loop); }; C.raf = requestAnimationFrame(loop);
    setTimeout(() => { if (C && !C.got && !ios) setMsg('No compass data from this phone or browser. Check that motion and orientation access is allowed, or use a real compass.'); }, 3000);
    startGoto();
  }
  function setMsg(m) { const e = $('#cp-msg'); if (e) { e.style.display = m ? '' : 'none'; e.textContent = m || ''; } }
  function onOri(e) {
    if (!C) return;
    if (e.type === 'deviceorientationabsolute' && e.alpha != null) C.abs = true; else if (C.abs && e.webkitCompassHeading == null) return;
    let h = null;
    if (e.webkitCompassHeading != null && !isNaN(e.webkitCompassHeading)) { h = e.webkitCompassHeading; C.acc = e.webkitCompassAccuracy; }
    else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) {
      const z = rad(e.alpha), x = rad(e.beta || 0), y = rad(e.gamma || 0), cA = Math.cos(z), sA = Math.sin(z), cB = Math.cos(x), sB = Math.sin(x), cG = Math.cos(y), sG = Math.sin(y);
      if (cB * cG > 0.7) h = norm(deg(Math.atan2(-sA * cB, cA * cB)));          /* held fairly flat: heading of the top edge */
      else h = norm(deg(Math.atan2(-(cA * sG + sA * sB * cG), -(sA * sG - cA * sB * cG))));   /* held upright: heading the back of the phone faces */
    }
    if (h == null) return; C.raw = h; if (!C.got) { C.got = true; setMsg(''); }
  }
  function compassStart() {
    window.addEventListener('deviceorientationabsolute', onOri, true); window.addEventListener('deviceorientation', onOri, true);
  }
  function compassStop() {
    window.removeEventListener('deviceorientationabsolute', onOri, true); window.removeEventListener('deviceorientation', onOri, true);
    if (C) { cancelAnimationFrame(C.raf); if (C.watch != null) G.unwatch(C.watch); } C = null;
  }
  function paint() {
    if (!C || C.raw == null) return;
    if (C.sm == null) C.sm = C.raw; else { const dl = ((C.raw - C.sm + 540) % 360) - 180; C.sm = norm(C.sm + 0.3 * dl); }
    const h = C.sm, rose = $('#cp-rose'); if (!rose) return;
    rose.setAttribute('transform', 'rotate(' + (-h).toFixed(1) + ')');
    const ls = rose.querySelectorAll('.cp-l'); for (let i = 0; i < ls.length; i++) ls[i].setAttribute('transform', 'rotate(' + (h - ls[i].dataset.a).toFixed(1) + ')');   /* keep the letters upright */
    const d = SV().decl, H = $('#cp-h'), S = $('#cp-s'), T = $('#cp-t');
    H.textContent = Math.round(h) % 360 + '° ' + G.compass(h); S.textContent = 'Magnetic' + (C.acc != null && C.acc >= 0 ? ' · ±' + Math.round(C.acc) + '°' : '') + (C.acc != null && C.acc < 0 ? ' · needs calibration (figure-8)' : '');
    T.textContent = d == null ? '' : 'True ' + Math.round(norm(h + d)) % 360 + '° ' + G.compass(norm(h + d));
    gotoPaint(h);
  }
  function target() { const id = SV().goto; return ptsAll().find(p => p.id === id) || null; }
  function startGoto() {
    if (!C) return; if (C.watch != null) { G.unwatch(C.watch); C.watch = null; }
    const t = target(); const tg = $('#cp-tgt'); if (tg) tg.style.display = t ? '' : 'none';
    if (!t) { const g = $('#cp-go'); if (g) g.textContent = 'Pick a point to see the bearing and distance. Needs a GPS fix (no signal needed).'; return; }
    C.pos = G.known(); C.watch = G.watch(p => { if (C) C.pos = p; }, () => { const g = $('#cp-go'); if (g) g.textContent = 'No GPS fix yet. Step into the open and wait a moment.'; });
  }
  function gotoPaint(h) {
    const t = target(), g = $('#cp-go'), tg = $('#cp-tgt'); if (!t || !g || !tg) return;
    const p = C.pos; if (!p) { g.textContent = 'Waiting for a GPS fix…'; return; }
    const brgT = G.bearing(p, t), mi = G.mi(p, t), d = SV().decl, mag = norm(brgT - (d || 0));
    tg.setAttribute('transform', 'rotate(' + mag.toFixed(1) + ')'); tg.style.display = '';
    const rel = ((mag - h + 540) % 360) - 180, turn = Math.abs(rel) < 8 ? 'Straight ahead' : (rel > 0 ? 'Turn right ' : 'Turn left ') + Math.round(Math.abs(rel)) + '°';
    g.innerHTML = `<b>${esc(t.name)}</b>: ${esc(OA.dist(mi, mi < 0.2 ? 2 : 1))} away${mi < 0.2 ? ' (' + esc(OA.ft(mi * 5280)) + ')' : ''}. Bearing <b>${Math.round(brgT)}° true</b>${d != null ? ', <b>' + Math.round(mag) + '° magnetic</b>' : ''} (${G.compass(brgT)}). <span class="gold b">${turn}</span><div class="xs dim">Straight-line distance; the ground in between may not allow it. GPS fix ${esc(OA.ago(p.ts || Date.now()))}.</div>`;
  }
  OA.act({
    async svtCompassOn(el) {
      try { const r = await DeviceOrientationEvent.requestPermission(); if (r === 'granted') { el.style.display = 'none'; setMsg('Waiting for the compass…'); compassStart(); setTimeout(() => { if (C && !C.got) setMsg('No compass data. Check Settings > Safari > Motion and Orientation Access, or use a real compass.'); }, 3000); } else setMsg('Compass access was refused. Allow Motion and Orientation in your browser settings, or use a real compass.'); }
      catch (e) { setMsg('Could not turn on the compass: ' + (e && e.message || e)); }
    },
    svtDecl() { const v = SV().decl; if (v != null) { SV().declAt = G.known() ? { lat: G.known().lat, lon: G.known().lon } : null; OA.saveSoon(); } const n = $('#cp-dnote'); if (n) n.innerHTML = declText(); },
    svtGoto() { startGoto(); },
    async svtSavePt() {
      const name = (val('cp-name') || '').trim() || 'Point ' + (SV().pts.length + 1);
      let f = G.known(); if (!f || Date.now() - (f.ts || 0) > 600000) { try { f = await G.position(); } catch (e) { if (!f) return OA.toast(e.message, 4500); } }
      const p = { id: OA.uid(), name, lat: f.lat, lon: f.lon }; SV().pts.push(p); SV().goto = 'p:' + p.id; OA.save(); refreshPts(); startGoto(); OA.toast('Saved “' + name + '”.');
    },
    svtAddPt() {
      const la = num('cp-lat'), lo = num('cp-lon'); if (la == null || lo == null || Math.abs(la) > 90 || Math.abs(lo) > 180) return OA.toast('Enter latitude and longitude in decimal degrees, like 38.58160 and -121.49440.', 4500);
      const p = { id: OA.uid(), name: (val('cp-name') || '').trim() || 'Point ' + (SV().pts.length + 1), lat: la, lon: lo }; SV().pts.push(p); SV().goto = 'p:' + p.id; OA.save(); refreshPts(); startGoto();
    },
    async svtDelPt() {
      const id = SV().goto; if (!id || id.indexOf('p:') !== 0) return OA.toast('Choose one of your own saved points to delete.');
      if (!await OA.confirm('Delete this saved point?', 'Delete')) return;
      SV().pts = SV().pts.filter(p => 'p:' + p.id !== id); SV().goto = ''; OA.save(); refreshPts(); startGoto();
    },
    svtBack() { const v = num('cp-bb'), o = $('#cp-bbo'); if (o) o.textContent = v == null ? '–' : Math.round(norm(v + 180)) + '°'; }
  });
  function refreshPts() { const s = $('#cp-pt'); if (s) s.innerHTML = ptOptions(); }
  document.addEventListener('input', e => { const t = e.target; if (t && t.dataset && t.dataset.live && OA.acts[t.dataset.live]) OA.acts[t.dataset.live](t, e); });

  /* ================= 2. SUN, WATCH, STARS ================= */
  function bigDipperSvg() {
    const S = { Dubhe: [11.0622, 61.751], Merak: [11.0307, 56.382], Phecda: [11.8972, 53.695], Megrez: [12.2571, 57.033], Alioth: [12.9005, 55.960], Mizar: [13.3987, 54.925], Alkaid: [13.7923, 49.313], Polaris: [2.5303, 89.264] };
    const pr = k => { const r = 90 - S[k][1], th = rad(S[k][0] * 15); return [-r * Math.sin(th), -r * Math.cos(th)]; };
    const P = {}; Object.keys(S).forEach(k => P[k] = pr(k));
    const v = [P.Dubhe[0] - P.Merak[0], P.Dubhe[1] - P.Merak[1]], ang = Math.atan2(v[0], -v[1]);
    const rot = p => { const c = Math.cos(ang), s = Math.sin(ang); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
    const Q = {}; Object.keys(P).forEach(k => Q[k] = rot(P[k]));
    const xs = Object.keys(Q).map(k => Q[k][0]), ys = Object.keys(Q).map(k => Q[k][1]), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const sc = Math.min(210 / (x1 - x0), 170 / (y1 - y0)), X = k => 70 + (Q[k][0] - x0) * sc, Y = k => 20 + (Q[k][1] - y0) * sc;
    const seq = ['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Dubhe', 'Merak', 'Phecda', 'Megrez'];
    const poly = seq.map(k => X(k).toFixed(1) + ',' + Y(k).toFixed(1)).join(' ');
    return `<svg viewBox="0 0 300 210" class="chart" role="img" aria-label="Big Dipper pointer stars lead to Polaris" style="background:#0b120b;border-radius:10px;border:1px solid var(--line)"><polyline points="${poly}" fill="none" stroke="#9db8a5" stroke-width="1.4"/>
      <line x1="${X('Merak')}" y1="${Y('Merak')}" x2="${X('Polaris')}" y2="${Y('Polaris')}" stroke="#e0b861" stroke-dasharray="4 4"/>
      ${['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Dubhe', 'Merak', 'Phecda'].map(k => `<circle cx="${X(k).toFixed(1)}" cy="${Y(k).toFixed(1)}" r="${k === 'Dubhe' || k === 'Merak' ? 4.5 : 3.5}" fill="${k === 'Dubhe' || k === 'Merak' ? '#e0b861' : '#efe9cf'}"/>`).join('')}
      <circle cx="${X('Polaris').toFixed(1)}" cy="${Y('Polaris').toFixed(1)}" r="5" fill="#6fd08a"/><text x="${(X('Polaris') + 9).toFixed(1)}" y="${(Y('Polaris') + 4).toFixed(1)}" fill="#6fd08a" font-size="12">Polaris (north)</text>
      <text x="${(X('Dubhe') + 8).toFixed(1)}" y="${(Y('Dubhe') + 4).toFixed(1)}" fill="#e0b861" font-size="10">pointer</text><text x="${(X('Merak') - 46).toFixed(1)}" y="${(Y('Merak') + 4).toFixed(1)}" fill="#e0b861" font-size="10">pointer</text><text x="${(X('Alioth') - 30).toFixed(1)}" y="${(Y('Alioth') + 28).toFixed(1)}" fill="#9db8a5" font-size="10">Big Dipper</text></svg>`;
  }
  function sunTool() {
    sheet('Sun, watch and stars', `
      <div class="card inner"><b>Where is the sun right now?</b><div id="sn-now" class="sm" style="margin-top:6px">Checking…</div></div>
      <div class="card inner"><b>Shadow stick (most reliable, any hemisphere)</b><ol class="ls sm"><li>Push a straight stick upright into flat ground in the sun.</li><li>Mark the tip of its shadow with a pebble.</li><li>Wait 15 to 20 minutes. The shadow tip moves. Mark the new tip.</li><li>Draw a line through the two marks. The first mark is <b>west</b>, the second is <b>east</b>.</li><li>Stand with your left foot on the first mark and your right foot on the second: you are facing <b>north</b> (true north, not magnetic).</li></ol><div class="xs dim">The longer you wait, the more accurate it is. It is least accurate in the tropics around midday and in the first and last hour of the day.</div></div>
      <div class="card inner"><b>Analog watch method (rough)</b><ol class="ls sm"><li>Use a watch with hands set to <b>local standard time</b>. If daylight saving time is on, put it back an hour (or use the 1 o'clock mark instead of 12).</li><li>Northern hemisphere: point the <b>hour hand</b> at the sun. South is halfway between the hour hand and the 12 o'clock mark.</li><li>Southern hemisphere: point the <b>12</b> at the sun. North is halfway between the 12 and the hour hand.</li></ol><div class="xs dim">Accuracy is loose, often 10 to 20 degrees or worse, poorer near the equator, and at midday in summer. Use it to get a rough direction, not to navigate a precise bearing. Check it against the sun's position above.</div></div>
      <div class="card inner"><b>North Star from the Big Dipper (northern hemisphere, clear night)</b>
        <p class="sm">Find the Big Dipper. Take the two stars at the outer edge of its bowl (the “pointer stars”) and follow the line they make, away from the bowl, about five times the gap between them. You arrive at Polaris, which sits within about a degree of true north. Polaris is not the brightest star, so it helps to have found the Dipper first. When the Dipper is low, Cassiopeia (a W shape) on the other side of Polaris can help.</p>${bigDipperSvg()}<div class="xs dim">Schematic star map, not to scale; the Dipper turns around Polaris through the night and seasons, so it may look upside down or sideways. Polaris’s height above the horizon is roughly your latitude. South of the equator Polaris is not visible.</div></div>
      <div class="alert"><b class="t">Cloud and trees</b>Direction tricks need a visible sun or sky. Moss, tree growth and similar “nature signs” are not reliable: do not use them.</div>`, sunOpen);
  }
  function sunOpen() {
    const tick = () => {
      const e = $('#sn-now'); if (!e) return; const f = G.known();
      if (!f) { e.innerHTML = 'The sun\'s position needs your location. <button class="mini" data-act="svtFix">Get my position</button>'; return; }
      const sp = G.sunPos(f.lat, f.lon, new Date());
      if (sp.alt < -0.8) { e.innerHTML = 'The sun is below the horizon now (' + Math.round(sp.alt) + '°). Use the stars if the sky is clear.'; return; }
      const az = sp.az, L = Math.round(az), R = Math.round(360 - az);
      e.innerHTML = `The sun is at <b>azimuth ${Math.round(az)}°</b> (${G.compass(az)}), about ${Math.round(sp.alt)}° above the horizon. Face the sun, then true north is <b>${L}° to your left</b> (or ${R}° to your right). Or: put the sun at ${G.compass(az)} and you know true north.<div class="xs dim">Uses your phone's clock and your last position (fixed ${esc(OA.ago(f.ts))}). Azimuth is a true (not magnetic) direction. A wrong clock or a stale position gives a wrong answer.</div>`;
    };
    tick(); const iv = setInterval(tick, 30000); cleanups.push(() => clearInterval(iv));
  }
  OA.act('svtFix', async el => { el.disabled = true; try { await G.position(); } catch (e) { OA.toast(e.message, 4500); } el.disabled = false; if (OA.sheetOpen()) { const n = $('#sn-now'), d = $('#dk-body'); if (n) sunOpen(); if (d) darkRefresh(); } });

  /* ================= 3. SIGNAL ================= */
  const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  let fl = null;
  function signalTool() {
    sheet('Signal', `
      <div class="alert danger"><b class="t">Call or press SOS first</b>If you have signal, call 911. If you carry a satellite messenger or PLB, press its SOS button for a life-threatening emergency. Signals below are for when you think someone can see or hear you.</div>
      <div class="card inner"><b>Screen SOS flasher</b>
        <p class="sm">Flashes the whole screen in the SOS pattern: three short, three long, three short, then a pause. Turn the brightness up. Best at night and when someone may be looking.</p>
        <label class="chk"><input type="checkbox" id="sg-vib" ${navigator.vibrate ? '' : 'disabled'}> Also vibrate (${navigator.vibrate ? 'if your phone allows it' : 'not supported on this phone'})</label>
        <button class="btn gold block" data-act="svtFlash">Start flashing the screen</button>
        <div class="alert"><b class="t">Battery</b>Flashing at full brightness drains the battery quickly. Use short bursts, or flash only when you hear or see a search party, aircraft or people. Keep enough battery to call. Flashing lights can trigger seizures in people with photosensitive epilepsy: warn people near you.</div></div>
      <div class="card inner"><b>Whistle and shout: rule of three</b><p class="sm">Three of anything is the distress signal: three short whistle blasts, a pause, repeat. A whistle carries farther than a voice and tires you less. Signal on a schedule and whenever you hear engines or voices.</p></div>
      <div class="card inner"><b>Signal mirror</b><ol class="ls sm"><li>Hold the mirror near your eye. Make a V with the fingers of your other hand around the target (aircraft, vehicle, person).</li><li>Tilt the mirror until its reflected spot of light lands on your fingers, then sweep it across the target.</li><li>Flash steadily. With no target, sweep the horizon slowly.</li></ol></div>
      <div class="card inner"><b>Ground signals</b><p class="sm">In an open spot, use contrasting material (gear, rocks, branches, snow trenches), each symbol at least 10 ft (3 m) long.</p>
        <div class="three center" style="font-size:2rem;font-weight:700"><div class="card inner">V<div class="xs dim" style="font-weight:400">I need help</div></div><div class="card inner">X<div class="xs dim" style="font-weight:400">Medical help / cannot go on</div></div><div class="card inner">↑<div class="xs dim" style="font-weight:400">Going this way</div></div></div>
        <div class="xs dim">Meanings are the commonly used ones; sources differ slightly on X. V is the safest. Three fires, panels or piles in a line or triangle also signals distress. Pick up your signals after rescue.</div></div>
      <div class="card inner"><b>Morse helper</b><div class="b" style="font-size:1.3rem;letter-spacing:.15em">· · ·  — — —  · · ·</div><div class="xs dim">SOS: dot dot dot, dash dash dash, dot dot dot.</div>
        <label class="fl">Type a word to see its Morse code<input class="in" id="mo-in" maxlength="30" placeholder="HELP" data-live="svtMorse" autocapitalize="characters"></label><div class="b" id="mo-out" style="word-break:break-word;letter-spacing:.1em">–</div></div>`, () => cleanups.push(stopFlash));
  }
  OA.act('svtMorse', el => { const o = $('#mo-out'); if (o) o.textContent = String(el.value || '').toUpperCase().split('').map(c => c === ' ' ? '/' : MORSE[c] ? MORSE[c].replace(/\./g, '·').replace(/-/g, '—') : '').filter(Boolean).join('  ') || '–'; });
  function stopFlash() {
    if (!fl) return; clearTimeout(fl.t); if (fl.el) fl.el.remove(); if (navigator.vibrate) try { navigator.vibrate(0); } catch (e) { } if (fl.lock) try { fl.lock.release(); } catch (e) { } fl = null;
  }
  OA.act('svtFlash', async () => {
    if (fl) return stopFlash();
    const vib = !!(document.getElementById('sg-vib') || {}).checked, u = 220, seq = [];
    const sym = (n, len) => { for (let i = 0; i < n; i++) { seq.push([1, len]); seq.push([0, u]); } seq[seq.length - 1] = [0, 3 * u]; };
    sym(3, u); sym(3, 3 * u); sym(3, u); seq[seq.length - 1] = [0, 7 * u];
    const el = document.createElement('div'); el.id = 'sv-flash'; el.setAttribute('role', 'button'); el.innerHTML = '<div class="sv-fl-msg">Tap to stop</div>'; document.body.appendChild(el);
    fl = { el, t: null, lock: null }; el.addEventListener('click', stopFlash);
    try { if (navigator.wakeLock) fl.lock = await navigator.wakeLock.request('screen'); } catch (e) { }
    const pat = seq.map(x => x[1]), buzz = () => { if (vib && navigator.vibrate) try { navigator.vibrate(pat); } catch (e) { } };
    let i = 0; buzz();
    const step = () => { if (!fl) return; const s = seq[i % seq.length]; el.style.background = s[0] ? '#fff' : '#000'; el.firstChild.style.color = s[0] ? '#000' : '#444'; i++; if (i % seq.length === 0) buzz(); fl.t = setTimeout(step, s[1]); };
    step();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fl) stopFlash(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopFlash(); });

  /* ================= 4. TIME TO DARK ================= */
  function darkTool() {
    const cm = SV().campMin;
    sheet('Time to dark', `<div id="dk-body"></div>
      <div class="card inner"><label class="fl">Minutes you need to make camp (shelter, water, food, warm layers)<input class="in" type="number" inputmode="numeric" min="15" max="240" step="5" id="dk-cm" value="${esc(cm)}" data-bind="svtools.campMin" data-type="number" data-then="svtDark"></label><div class="xs dim">Plan to be in camp with at least an hour of light. Mountains, canyons and thick forest hide the sun well before the official sunset.</div></div>
      <div class="card inner"><b>The hand trick (no watch or no phone)</b><p class="sm">Hold your arm straight out, fist sideways, with the bottom edge on the horizon below the sun. Stack fists up to the sun. One fist is about 10 degrees.</p>
        <label class="fl">Fists between sun and horizon<select class="in" id="dk-fist" data-live="svtFist">${[0.5, 1, 1.5, 2, 3, 4].map(n => `<option value="${n}">${n}</option>`).join('')}</select></label><div class="b" id="dk-fo">–</div>
        <div class="xs dim">One finger (index) is roughly 8 to 10 minutes and a fist roughly 45 to 55 minutes at mid-latitudes, near sunset. Older rules of 15 minutes per finger over-estimate. Rough only; hills in the way make it less.</div></div>`, () => { darkRefresh(); const iv = setInterval(darkRefresh, 30000); cleanups.push(() => clearInterval(iv)); OA.acts.svtFist({ value: $('#dk-fist').value }); });
  }
  function darkRefresh() {
    const b = $('#dk-body'); if (!b) return; const f = G.known();
    if (!f) { b.innerHTML = `<div class="card"><p>Sunset needs your position.</p><button class="btn gold block" data-act="svtFix">Get my position</button></div>`; return; }
    const now = new Date(), s = G.sun(f.lat, f.lon, now), cm = Math.max(0, SV().campMin || 60);
    if (s.polar) { b.innerHTML = `<div class="card"><p>${s.polar === 'day' ? 'The sun does not set today at your position.' : 'The sun does not rise today at your position.'}</p></div>`; return; }
    const mins = d => Math.round((d - now) / 60000), fmt = m => m < 0 ? 'Past' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' m';
    const left = s.set ? mins(s.set) : 0, camp = s.set ? new Date(s.set.getTime() - cm * 60000) : null, last = s.civilDusk;
    if (left <= 0) {
      const t2 = G.sun(f.lat, f.lon, new Date(now.getTime() + 86400000));
      b.innerHTML = `<div class="card"><div class="stat"><div><b>Dark</b><span>SUN HAS SET</span></div><div><b>${hhmm(last)}</b><span>LAST LIGHT TODAY</span></div><div><b>${hhmm(t2.rise)}</b><span>SUNRISE TOMORROW</span></div></div>
        <div class="sm">${now > last ? 'It is dark.' : 'Light is nearly gone.'} If you are not at camp, stop and set up now with a headlamp; do not wander on in the dark if you are unsure of the way. Tomorrow's sunset is about ${esc(hhmm(t2.set))}.</div>
        <div class="xs dim">Computed on the phone from your position (fixed ${esc(OA.ago(f.ts))}) and its clock; no signal needed. <button class="lnk" data-act="svtFix">Update position</button></div></div>`; return;
    }
    b.innerHTML = `<div class="card"><div class="stat"><div><b>${fmt(left)}</b><span>UNTIL SUNSET</span></div><div><b>${hhmm(s.set)}</b><span>SUNSET</span></div><div><b>${hhmm(camp)}</b><span>MAKE CAMP BY</span></div></div>
      <div class="sm">${mins(camp) <= 0 ? '<b class="warn">It is past your make-camp-by time.</b> Pick a site now.' : 'Stop and pick a site in ' + esc(fmt(mins(camp))) + '.'} Last light (civil twilight ends) about ${esc(hhmm(last))}.</div>
      <div class="xs dim">Computed on the phone from your position (fixed ${esc(OA.ago(f.ts))}) and its clock; no signal needed. <button class="lnk" data-act="svtFix">Update position</button></div></div>`;
  }
  OA.act('svtDark', darkRefresh);
  OA.act('svtFist', el => {
    const n = parseFloat(el.value), f = G.known(), lat = f ? f.lat : 40, rate = 15 * Math.cos(rad(lat)), o = $('#dk-fo'); if (!o) return;
    const m = Math.round(n * 10 / rate * 60 / 5) * 5; o.textContent = n + ' fist' + (n === 1 ? '' : 's') + ' ≈ ' + m + ' minutes of sun left' + (f ? '' : ' (assuming mid-latitude)');
  });

  /* ================= 5. PACE / ETA ================= */
  function paceTool() {
    const km = U(), P = SV().tool.pace, du = km ? 'km' : 'mi', eu = km ? 'm' : 'ft';
    const sel = (id, opts, v) => `<select class="in" id="${id}" data-bind="svtools.tool.pace.${id.slice(3)}" data-live="svtPace" data-then="svtPace">${opts.map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
    sheet('Pace and ETA', `
      <div class="card inner"><div class="two"><label class="fl">Distance (${du})<input class="in" type="number" inputmode="decimal" id="pc-dist" value="${esc(P.dist)}" data-bind="svtools.tool.pace.dist" data-type="number" data-live="svtPace"></label><label class="fl">Climb (${eu})<input class="in" type="number" inputmode="decimal" id="pc-gain" value="${esc(P.gain)}" data-bind="svtools.tool.pace.gain" data-type="number" data-live="svtPace"></label></div>
      <div class="two"><label class="fl">Descent (${eu}, optional)<input class="in" type="number" inputmode="decimal" id="pc-loss" value="${esc(P.loss)}" data-bind="svtools.tool.pace.loss" data-type="number" data-live="svtPace"></label><label class="fl">Pack<br>${sel('pc-load', [['light', 'Day pack'], ['med', 'Overnight'], ['heavy', 'Heavy / multi-day']], P.load)}</label></div>
      <label class="fl">How you feel / terrain<br>${sel('pc-tired', [['fresh', 'Fresh, good trail'], ['tired', 'Tired or end of a long day'], ['rough', 'Rough, off-trail or snow'], ['spent', 'Exhausted']], P.tired)}</label>
      <label class="chk"><input type="checkbox" id="pc-brk" ${P.brk ? 'checked' : ''} data-bind="svtools.tool.pace.brk" data-then="svtPace"> Add rest stops (about 10 minutes per hour)</label></div>
      <div id="pc-out" class="card"><p class="sm dim">Enter a distance and the climb to see the estimate.</p></div>
      <div class="xs dim">Naismith’s rule: about ${km ? '5 km/h plus 1 hour per 600 m climbed' : '3 mph plus 1 hour per 2,000 ft climbed'}. Tobler’s hiking function gives a speed from the steepness. Both assume a fit hiker on a good path in good conditions and tend to be optimistic for steep, rough or snowy ground. The two are shown so you can see the spread. Add margin: days are shorter than you think.</div>`, () => OA.acts.svtPace());
  }
  OA.act('svtPace', () => {
    const o = $('#pc-out'); if (!o) return; const km = U();
    const dist = num('pc-dist'), gain = num('pc-gain') || 0, loss = num('pc-loss') || 0; if (!dist || dist <= 0) { o.innerHTML = '<p class="sm dim">Enter a distance and the climb to see the estimate.</p>'; return; }
    const dKm = km ? dist : dist * 1.609344, gM = km ? gain : gain * 0.3048, lM = km ? loss : loss * 0.3048;
    const nais = dKm / 5 + gM / 600 + (0); // hours, Naismith (5 km/h + 1 h per 600 m)
    const tot = gM + lM, f = tot > 0 ? gM / tot : 0.5, dUp = dKm * f, dDn = dKm - dUp;
    const tob = (len, rise) => { if (len <= 0) return 0; const v = G.tobler(rise / (len * 1000)); return len / Math.max(0.5, v); };
    const tobler = tot > 0 ? tob(dUp, gM) + tob(dDn, -lM) : dKm / G.tobler(0);
    const mL = { light: 1, med: 1.1, heavy: 1.2 }[val('pc-load')] || 1, mT = { fresh: 1, tired: 1.25, rough: 1.4, spent: 1.6 }[val('pc-tired')] || 1;
    const brk = (document.getElementById('pc-brk') || {}).checked ? 1.17 : 1, base = Math.max(nais, tobler), plan = base * mL * mT * brk;
    const now = new Date(), eta = new Date(now.getTime() + plan * 3600000), f2 = G.known(); let sun = '';
    if (f2) { const s = G.sun(f2.lat, f2.lon, now); if (s.set && s.set > now) { const dm = Math.round((s.set - eta) / 60000); sun = dm >= 0 ? `Starting now you would arrive about ${dm >= 60 ? OA.hm(dm / 60) : dm + ' min'} before sunset (${hhmm(s.set)}).` : `<b class="warn">Starting now you would arrive about ${dm <= -60 ? OA.hm(-dm / 60) : -dm + ' min'} after sunset (${hhmm(s.set)}).</b> Start earlier, shorten the route or plan a camp.`; } }
    o.innerHTML = `<div class="stat"><div><b>${OA.hm(nais)}</b><span>NAISMITH</span></div><div><b>${OA.hm(tobler)}</b><span>TOBLER</span></div><div><b>${OA.hm(plan)}</b><span>PLAN WITH</span></div></div>
      <div class="sm">Plan with the slower of the two (${OA.hm(base)}), adjusted for pack, condition${brk > 1 ? ' and rests' : ''}. If you started now you would arrive about <b>${hhmm(eta)}</b>.</div>${sun ? `<div class="sm" style="margin-top:6px">${sun}</div>` : ''}`;
  });

  /* ================= 6. WEATHER READ ================= */
  function wxTool() {
    const L = BP.survive ? BP.survive.items().filter(i => i.cat === 'weather' || (i.tags || []).some(t => ['weather', 'lightning', 'storm', 'clouds', 'wind'].indexOf(t) >= 0)) : [];
    sheet('Weather read', `
      <div class="alert"><b class="t">No barometer in a phone you can trust</b>Many phones have a pressure sensor but browsers cannot read it, so this app cannot show a pressure trend. Use the forecast from the Today tab when you have signal, and read the sky.</div>
      <div class="card inner"><b>Signs to take seriously</b><ul class="ls sm"><li><b>Towering clouds building in late morning or early afternoon</b> in mountains: thunderstorms are likely later. Be off summits, ridges and open slopes early.</li><li><b>Thunder at any distance</b> means lightning can reach you. Start moving to safer ground.</li><li><b>A sudden temperature drop, strong gusts or a change in wind direction</b> ahead of dark clouds often means a storm is arriving within minutes.</li><li><b>Rain upstream or on distant slopes</b> can flood a canyon or wash even if the sky above you is clear. Stay out of dry washes and slot canyons.</li><li><b>Wind makes cold dangerous:</b> wet, windy and cold together are how hypothermia starts even at mild temperatures. Add layers before you feel cold.</li></ul><div class="xs dim">Rules of thumb, not forecasts. Local patterns differ.</div></div>
      <div class="card inner"><b>In the manual</b>${L.length ? L.slice(0, 12).map(i => `<div class="li" data-act="svOpen" data-id="${esc(i.id)}" role="button"><span class="ic">${OA.icon(i.icon || 'cloud')}</span><span class="tx"><b>${esc(i.title)}</b></span></div>`).join('') : `<p class="sm dim">Weather entries load with the rest of the manual. Open the Manual tab and search “storm” or “lightning”.</p>`}</div>
      <button class="btn block" data-go="today">Open the forecast (Today tab)</button>`);
  }

  /* ================= 7. BOIL TIME AND WATER ================= */
  function waterTool() {
    const km = U(), W = SV().tool.water, B = SV().tool.boil, f = G.known();
    const alt = f && f.alt != null ? Math.round(km ? f.alt : f.alt * 3.28084) : '';
    sheet('Boil time and water', `
      <div class="card inner"><b>How long to boil</b>
        <label class="fl">Your elevation (${km ? 'm' : 'ft'})${alt !== '' ? ` <span class="xs">(GPS says about ${alt}; GPS elevation is rough)</span>` : ''}<input class="in" type="number" inputmode="numeric" id="bl-elev" value="${esc(B.elev === '' || B.elev == null ? alt : B.elev)}" data-bind="svtools.tool.boil.elev" data-type="number" data-live="svtBoil"></label>
        <div class="big-num" id="bl-out" style="margin-top:6px">–</div><div class="sm dim" id="bl-note"></div></div>
      <div class="card inner"><b>Water to carry</b>
        <div class="two"><label class="fl">Hours until the next reliable water<input class="in" type="number" inputmode="decimal" id="wt-h" value="${esc(W.hours)}" data-bind="svtools.tool.water.hours" data-type="number" data-live="svtWater"></label>
        <label class="fl">Conditions<select class="in" id="wt-c" data-bind="svtools.tool.water.cond" data-then="svtWater" data-live="svtWater">${[['cool', 'Cool, easy'], ['mod', 'Moderate'], ['hot', 'Hot, dry or hard']].map(o => `<option value="${o[0]}" ${o[0] === W.cond ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label></div>
        <div class="big-num" id="wt-out">–</div><div class="sm dim" id="wt-note"></div></div>
      <div class="xs dim">Boil times follow CDC: 1 minute at a rolling boil; 3 minutes above 6,500 ft (2,000 m). Boiling kills viruses, bacteria and parasites. Cloudy water: strain it first. The water figures are rules of thumb: your needs depend on heat, effort, altitude and how you sweat. When in doubt, carry more and drink to thirst.</div>`, () => { OA.acts.svtBoil(); OA.acts.svtWater(); });
  }
  OA.act('svtBoil', () => {
    const v = num('bl-elev'), o = $('#bl-out'), n = $('#bl-note'); if (!o) return; const km = U();
    if (v == null) { o.textContent = '–'; n.textContent = 'Enter your elevation. If you do not know it, boil for 3 minutes to be safe.'; return; }
    const ft = km ? v / 0.3048 : v, hi = ft > 6500;
    o.textContent = (hi ? '3' : '1') + ' minutes'; n.textContent = hi ? 'Above 6,500 ft (2,000 m): rolling boil for 3 minutes.' : 'Rolling boil for 1 minute. Above 6,500 ft (2,000 m) use 3 minutes.';
  });
  OA.act('svtWater', () => {
    const h = num('wt-h'), c = val('wt-c'), o = $('#wt-out'), n = $('#wt-note'); if (!o) return; if (h == null || h <= 0) { o.textContent = '–'; n.textContent = 'Enter the hours of hiking between water sources.'; return; }
    const rate = { cool: 0.35, mod: 0.5, hot: 0.85 }[c] || 0.5, L = h * rate, vol = OA.unit.vol && OA.unit.vol() === 'L';
    o.textContent = (Math.ceil(L * 2) / 2).toFixed(1) + ' L' + ' (' + Math.round(L * 33.814) + ' oz)'; n.textContent = 'About ' + rate + ' L (' + Math.round(rate * 33.814) + ' oz) per hour for you, plus a reserve and what you will drink or cook with at camp. Carry the weight: dehydration slows you and clouds judgment.';
  });
})();
