/* Roadtripica: Journal tab. Trip diary with pins and photo drops, daily summary, "send an update" text, shareable trip page, memory book, kids' corner.
   State: S.journal. Photos live in IndexedDB (OA.photo). There is no live tracking: everything shared is a snapshot sent by hand. */
(function () {
  'use strict';
  const esc = OA.esc, G = OA.geo;
  OA.defaults({ journal: { entries: [], daily: {}, view: 'time', hh: { name: '', phone: '' }, exp: { days: 'all', photos: true, pos: 'approx' }, bingo: { seed: 0, marks: {} }, plates: {}, day: '', familyName: '' } });
  const J = () => { const j = OA.S.journal; if (!j.entries) j.entries = []; if (!j.daily) j.daily = {}; if (!j.hh) j.hh = { name: '', phone: '' }; if (!j.exp) j.exp = { days: 'all', photos: true, pos: 'approx' }; if (!j.bingo) j.bingo = { seed: 0, marks: {} }; if (!j.plates) j.plates = {}; return j; };
  const TAGS = [['sight', 'Sight', 'eye'], ['food', 'Food', 'fork'], ['stay', 'Stay', 'bed'], ['fuel', 'Fuel', 'fuel'], ['funny', 'Funny', 'star'], ['kids', 'Kids', 'heart']];
  const MOODS = ['Great', 'Good', 'Tired', 'Grumpy', 'In awe'];
  const tagLabel = t => (TAGS.find(x => x[0] === t) || [0, ''])[1];
  const tagIcon = t => (TAGS.find(x => x[0] === t) || [0, 0, 'pin'])[2];
  const dayOf = e => OA.dkey(new Date(e.ts));
  const sorted = () => J().entries.slice().sort((a, b) => a.ts - b.ts);
  const dunit = () => OA.unit.dist() === 'km' ? 'km' : 'mi';
  let tlDays = 6, dr = null, msgLoc = false, lastBuilt = null;

  /* ---------- defensive links to other modules ---------- */
  function trip() { try { const t = window.RT && (typeof RT.trip === 'function' ? RT.trip() : RT.trip); return t && typeof t === 'object' ? t : null; } catch (e) { return null; } }
  const tripName = () => { const t = trip(); return t && t.name ? String(t.name) : ''; };
  function tripStart() { const t = trip(); const s = t && (t.start || t.startDate || (t.dates && t.dates.start)); return typeof s === 'string' && /^\d{4}-\d\d-\d\d/.test(s) ? s.slice(0, 10) : null; }
  function rtMiles() {
    try { const t = window.RT && RT.miles && typeof RT.miles.totals === 'function' ? RT.miles.totals() : null; const v = typeof t === 'number' ? t : t && (t.total != null ? t.total : t.driven != null ? t.driven : t.miles); return typeof v === 'number' && isFinite(v) && v > 0 ? v : null; } catch (e) { return null; }
  }
  function pathMiles(list) { const pts = list.filter(e => e.lat != null && e.lon != null); let s = 0; for (let i = 1; i < pts.length; i++) s += G.mi(pts[i - 1], pts[i]); return s; }
  function dayMiles(k) { return pathMiles(sorted().filter(e => dayOf(e) === k)); }
  function firstDay() { const s = tripStart(); if (s) return s; const l = sorted(); return l.length ? dayOf(l[0]) : OA.dkey(); }
  const dayNo = k => OA.daysBetween(firstDay(), k) + 1;
  function placeOf(e) { return e.place || ''; }
  function stats(list) {
    const days = {}, places = {}; let photos = 0;
    list.forEach(e => { days[dayOf(e)] = 1; if (placeOf(e)) places[placeOf(e)] = 1; if (e.photoId) photos++; });
    const derived = pathMiles(list), rt = list.length === J().entries.length ? rtMiles() : null;
    return { pins: list.length, days: Object.keys(days).length, photos, places: Object.keys(places), miles: rt != null ? rt : derived, fromApp: rt != null };
  }

  /* ---------- photo thumbs ---------- */
  const urlCache = {}, BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  async function photoUrl(id, full) { const k = (full ? 'f' : 't') + id; if (urlCache[k]) return urlCache[k]; const r = await OA.photo.get(id); if (!r) return null; return (urlCache[k] = full ? OA.photo.fullUrl(r) : OA.photo.url(r)); }
  function fillImgs(root) { Array.prototype.forEach.call((root || document).querySelectorAll('img[data-ph]'), async im => { try { const u = await photoUrl(im.dataset.ph, im.dataset.full === '1'); if (u) im.src = u; else im.alt = 'photo not found'; } catch (e) { } }); }
  OA.on('render', id => { if (id === 'journal') fillImgs(OA.$('#view')); });
  const img = (id, full, cls) => `<img data-ph="${esc(id)}"${full ? ' data-full="1"' : ''} class="${cls || 'rj-th'}" src="${BLANK}" alt="photo">`;
  const changed = () => { OA.saveSoon(); try { OA.publish(); } catch (e) { } };

  /* ---------- timeline ---------- */
  function entRow(e) {
    const head = e.text ? e.text.split('\n')[0].slice(0, 70) : (tagLabel(e.tag) || 'Pin');
    const meta = [OA.fmtTime(e.ts), placeOf(e), e.mood, e.text && e.tag ? tagLabel(e.tag) : ''].filter(Boolean).join(' · ');
    return `<div class="li rj-ent" data-act="rjOpen" data-id="${esc(e.id)}" role="button" tabindex="0">${e.photoId ? img(e.photoId) : `<span class="ic rj-ico">${OA.icon(e.tag ? tagIcon(e.tag) : 'pin')}</span>`}<div class="tx"><b>${esc(head)}</b><span>${esc(meta)}</span></div><div class="end">${e.lat == null ? '<span class="tag w">no GPS</span>' : ''}</div></div>`;
  }
  function timelineHTML() {
    const list = sorted(); if (!list.length) return `<div class="card center"><div class="big-num" style="font-size:1.4rem">${OA.icon('pin', 'lg')}</div><h2 class="big">Your trip diary starts here</h2><p class="dim">Drop a pin at a stop: it saves where you are, a note and a photo. Works with no signal.</p><button class="btn gold block" data-act="rjDrop">Drop your first pin</button></div>`;
    const groups = []; list.forEach(e => { const k = dayOf(e), g = groups[groups.length - 1]; if (g && g.k === k) g.l.push(e); else groups.push({ k, l: [e] }); });
    groups.reverse();
    const shown = groups.slice(0, tlDays);
    return shown.map(g => {
      const mi = pathMiles(g.l);
      return `<div class="card rj-day"><div class="ct"><span>Day ${dayNo(g.k)} · ${esc(OA.fmtDate(g.k))}</span><button class="lnk" data-act="rjDay" data-k="${esc(g.k)}">Summary</button></div><div class="sm dim" style="margin:-4px 0 4px">${g.l.length} ${g.l.length === 1 ? 'pin' : 'pins'}${mi >= 0.1 ? ' · about ' + esc(OA.dist(mi)) + ' between pins' : ''}</div>${g.l.map(entRow).join('')}</div>`;
    }).join('') + (groups.length > shown.length ? `<button class="btn block" data-act="rjMoreDays">Show earlier days (${groups.length - shown.length})</button>` : '');
  }

  /* ---------- drop a pin ---------- */
  function newDraft() { return { lat: null, lon: null, approx: false, fixTs: null, photoId: null, mood: '', tag: '', saved: false }; }
  function dropHTML() {
    return `<div class="card inner"><div class="row mid between" style="margin:0"><div id="rjgps" class="sm">Finding your position…</div><button class="mini" data-act="rjFix">Retry GPS</button></div></div>
      <div id="rjph" class="rj-ph"></div>
      <div class="row"><button class="btn" data-act="rjPhoto">${OA.icon('camera', 'sm')} Add photo</button></div>
      <label class="fl">Note<textarea class="in" id="rjtext" rows="4" placeholder="What happened here?" maxlength="2000"></textarea></label>
      <div class="fl">Mood</div><div class="chips wrap" id="rjmoods">${MOODS.map(m => `<button class="chip" data-act="rjMood" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>
      <div class="fl">Tag</div><div class="chips wrap" id="rjtags">${TAGS.map(t => `<button class="chip" data-act="rjTag" data-v="${t[0]}">${esc(t[1])}</button>`).join('')}</div>
      <button class="btn gold block" data-act="rjSave">Save pin</button><p class="xs dim center">Saved on this phone. Nothing is sent anywhere.</p>`;
  }
  function openDrop() {
    dr = newDraft();
    OA.sheet('Drop a pin', dropHTML(), { onOpen() { getFix(); }, onClose() { cleanDraft(); } });
  }
  function cleanDraft() { if (dr && !dr.saved && dr.photoId) { OA.photo.del(dr.photoId).catch(() => { }); } dr = null; }
  function setGps() {
    const n = OA.$('#rjgps'); if (!n || !dr) return;
    if (dr.lat == null) { n.innerHTML = '<span class="warn">No position.</span> You can still save a note or photo.'; return; }
    n.innerHTML = `${esc(G.fmtCoord(dr.lat, dr.lon, 'dd'))}<div class="xs dim">${dr.approx ? 'Last known position from ' + esc(OA.ago(dr.fixTs || Date.now())) + ', not a fresh fix' : 'Fresh GPS fix'}</div>`;
  }
  async function getFix() {
    const d = dr; if (!d) return;
    const n = OA.$('#rjgps'); if (n) n.innerHTML = '<span class="spin"></span> Finding your position…';
    try {
      const f = await Promise.race([G.position({ timeout: 8000, maximumAge: 60000 }), new Promise((_, rej) => setTimeout(() => rej(new Error('Location timed out.')), 10000))]);
      if (dr !== d) return; d.lat = f.lat; d.lon = f.lon; d.approx = false; d.fixTs = f.ts || Date.now();
    } catch (e) {
      if (dr !== d) return; const k = G.known();
      if (k && k.lat != null) { d.lat = k.lat; d.lon = k.lon; d.approx = true; d.fixTs = k.ts || null; } else { d.lat = null; d.lon = null; }
    }
    setGps();
  }
  async function pickPhoto() {
    const d = dr; if (!d) return;
    const rec = await OA.photo.pick({ gps: false, note: '' }); if (!rec || dr !== d) { if (rec) OA.photo.del(rec.id).catch(() => { }); return; }
    if (d.photoId) OA.photo.del(d.photoId).catch(() => { });
    d.photoId = rec.id; const ph = OA.$('#rjph'); if (ph) { ph.innerHTML = img(rec.id, true, 'rj-big'); fillImgs(ph); }
  }
  function saveDraft() {
    const d = dr; if (!d) return; const t = OA.$('#rjtext'), text = t ? t.value.trim() : '';
    if (!text && !d.photoId && !d.tag) { OA.toast('Add a note, photo or tag first.'); return; }
    const e = { id: OA.uid(), ts: Date.now(), lat: d.lat, lon: d.lon, text, mood: d.mood, tag: d.tag, photoId: d.photoId, place: '' };
    if (d.approx) e.last = 1;
    J().entries.push(e); d.saved = true; changed(); OA.closeSheet(); OA.toast('Pin saved');
  }

  /* ---------- detail ---------- */
  function detailHTML(e) {
    const l = e.lat != null ? G.mapLinks(e.lat, e.lon) : null;
    return `${e.photoId ? img(e.photoId, true, 'rj-big') : ''}
      <div class="sm dim">${esc(OA.fmtDate(dayOf(e), { weekday: 'long', month: 'long', day: 'numeric' }))} · ${esc(OA.fmtTime(e.ts))}</div>
      <div>${e.tag ? `<span class="tag a">${esc(tagLabel(e.tag))}</span>` : ''}${e.mood ? `<span class="tag">${esc(e.mood)}</span>` : ''}${e.last ? '<span class="tag w">last known position</span>' : ''}</div>
      <label class="fl">Note<textarea class="in" id="rjetext" rows="4" maxlength="2000">${esc(e.text)}</textarea></label>
      <div class="row"><button class="btn" data-act="rjEdit" data-id="${esc(e.id)}">Save note</button></div>
      <div class="sh-sec"><h3>Where</h3>${l ? `<div class="kv"><span>Place</span><span>${esc(placeOf(e) || 'not looked up')}</span></div><div class="kv"><span>Position</span><span>${esc(G.fmtCoord(e.lat, e.lon, 'dd'))}</span></div><div class="row wrap"><button class="btn" data-act="rjPlace" data-id="${esc(e.id)}">Look up place name</button><a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">Open map</a></div><p class="xs dim">The name lookup needs signal and sends this position to OpenStreetMap once, when you tap.</p>` : '<p class="dim sm">No position was saved for this pin.</p>'}</div>
      <button class="btn danger block" data-act="rjDel" data-id="${esc(e.id)}">Delete this pin</button>`;
  }
  const ent = id => J().entries.find(e => e.id === id);

  /* ---------- day summary ---------- */
  function dayHTML() {
    const j = J(), list = sorted(); if (!list.length) return '<div class="card center dim">Drop a pin and your daily summary will appear here.</div>';
    const keys = Array.from(new Set(list.map(dayOf))).sort(); if (!j.day || keys.indexOf(j.day) < 0) j.day = keys[keys.length - 1];
    const k = j.day, i = keys.indexOf(k), L = list.filter(e => dayOf(e) === k), s = stats(L), d = j.daily[k] || {};
    const places = Array.from(new Set(L.map(placeOf).filter(Boolean)));
    const tc = {}; L.forEach(e => { if (e.tag) tc[e.tag] = (tc[e.tag] || 0) + 1; });
    return `<div class="card"><div class="row mid between" style="margin:0"><button class="mini" data-act="rjPrevDay" ${i <= 0 ? 'disabled' : ''}>&larr; Earlier</button><b class="gold center">Day ${dayNo(k)}<br><span class="sm dim">${esc(OA.fmtDate(k, { weekday: 'long', month: 'short', day: 'numeric' }))}</span></b><button class="mini" data-act="rjNextDay" ${i >= keys.length - 1 ? 'disabled' : ''}>Later &rarr;</button></div>
      <div class="stat"><div><b>${s.pins}</b><span>PINS</span></div><div><b>${s.miles >= 0.1 ? esc(OA.dist(s.miles, 0).replace(/ (mi|km)$/, '')) : '0'}</b><span>${dunit().toUpperCase()} BETWEEN PINS</span></div><div><b>${s.photos}</b><span>PHOTOS</span></div></div>
      <p class="xs dim">Distance is the straight line between pins, so real driving is longer. For odometer miles use the Miles screen.</p>
      ${places.length ? `<div class="kv"><span>Places</span><span>${esc(places.join(', '))}</span></div>` : ''}
      ${Object.keys(tc).length ? `<div class="kv"><span>Tags</span><span>${Object.keys(tc).map(t => esc(tagLabel(t)) + ' ' + tc[t]).join(', ')}</span></div>` : ''}
      <label class="fl">Best moment of the day<input class="in" type="text" maxlength="200" data-bind="journal.daily.${esc(k)}.hl" value="${esc(d.hl || '')}" placeholder="One line to remember"></label>
      <div class="row"><button class="btn gold" data-act="rjUpdate" data-k="${esc(k)}">Send an update for this day</button></div></div>
      <div class="card"><div class="ct"><span>This day</span></div>${L.map(entRow).join('')}</div>`;
  }

  /* ---------- send an update ---------- */
  function updateText(k) {
    const L = sorted().filter(e => dayOf(e) === k), all = sorted(), s = stats(L), t = tripName(), d = J().daily[k] || {};
    const last = L.length ? L[L.length - 1] : all[all.length - 1], pl = last && placeOf(last);
    let x = (t ? t + ': ' : 'Road trip: ') + 'day ' + dayNo(k) + ' update.\n';
    const tot = rtMiles(); x += s.pins ? s.pins + (s.pins === 1 ? ' stop' : ' stops') + ' logged today' + (s.miles >= 1 ? ', about ' + OA.dist(s.miles, 0) + ' between pins' : '') + '.\n' : '';
    if (tot) x += 'Trip so far: ' + OA.dist(tot, 0) + '.\n';
    if (d.hl) x += 'Best moment: ' + d.hl + '\n';
    else { const n = L.filter(e => e.text)[0]; if (n) x += n.text.split('\n')[0].slice(0, 120) + '\n'; }
    if (pl) x += 'Near ' + pl + '.\n';
    x += 'All good here.';
    return x;
  }
  function openUpdate(k) {
    OA.sheet('Send an update', `<p class="sm dim">A short text for the people at home. Edit it, then send. This is a message you send by hand, not live tracking.</p>
      <textarea class="in" id="rjmsg" rows="7"></textarea>
      <label class="chk"><input type="checkbox" id="rjmloc" ${msgLoc ? 'checked' : ''}> Add a map link to my last position</label>
      <label class="fl">Who to text (number or name, optional)<input class="in" type="tel" inputmode="tel" data-bind="journal.hh.phone" value="${esc(J().hh.phone || '')}" placeholder="Phone number"></label>
      <div class="row wrap"><button class="btn gold" data-act="rjSms">Text it</button><button class="btn" data-act="rjShare">Share…</button><button class="btn" data-act="rjCopy">Copy</button></div>
      <p class="xs dim">Text opens your messages app with this note. Nothing is sent until you press send there.</p>`, { onOpen(root) { const t = OA.$('#rjmsg', root); if (t && !t.value) t.value = updateText(k); } });
  }
  function msgBody() {
    const t = OA.$('#rjmsg'); let x = t ? t.value.trim() : ''; msgLoc = !!(OA.$('#rjmloc') && OA.$('#rjmloc').checked);
    if (msgLoc) { const all = sorted().filter(e => e.lat != null), f = G.known() || (all.length ? all[all.length - 1] : null); if (f) x += '\nMap: ' + G.mapLinks(f.lat, f.lon).google; }
    return x;
  }

  /* ---------- export: trip page ---------- */
  async function jpegData(blob, max, q) {
    const bmp = await createImageBitmap(blob), s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * s)); c.height = Math.max(1, Math.round(bmp.height * s));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
  }
  function sketchSVG(list) {
    const pts = list.filter(e => e.lat != null); if (pts.length < 2) return '';
    const lat0 = pts.reduce((a, e) => a + e.lat, 0) / pts.length, k = Math.cos(lat0 * Math.PI / 180);
    const xs = pts.map(e => e.lon * k), ys = pts.map(e => -e.lat), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), W = 320, H = 200, P = 14, sc = Math.min((W - 2 * P) / ((x1 - x0) || 1e-6), (H - 2 * P) / ((y1 - y0) || 1e-6));
    const X = i => (P + (xs[i] - x0) * sc + ((W - 2 * P) - (x1 - x0) * sc) / 2).toFixed(1), Y = i => (P + (ys[i] - y0) * sc + ((H - 2 * P) - (y1 - y0) * sc) / 2).toFixed(1);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Route sketch from the pins, not to scale, no map"><rect width="${W}" height="${H}" rx="10" fill="none" stroke="#8886"/><polyline points="${pts.map((e, i) => X(i) + ',' + Y(i)).join(' ')}" fill="none" stroke="#2e6fd0" stroke-width="2" stroke-linejoin="round"/>${pts.map((e, i) => `<circle cx="${X(i)}" cy="${Y(i)}" r="${i === pts.length - 1 ? 5 : 3}" fill="${i === pts.length - 1 ? '#c4574a' : '#2e6fd0'}"/>`).join('')}</svg><div class="m">Route sketch from the pins, north up, not to scale. Red dot: latest.</div>`;
  }
  function pickList(o) {
    let list = sorted(); if (o.days !== 'all') { const cut = OA.addDays(OA.dkey(), -(+o.days - 1)); list = list.filter(e => dayOf(e) >= cut); } return list;
  }
  async function loadImgs(list, max, q, on) {
    const imgs = {}; let i = 0, n = list.filter(e => e.photoId).length;
    for (const e of list) { if (!e.photoId) continue; on && on(++i, n); try { const r = await OA.photo.get(e.photoId); if (r && r.blob) imgs[e.id] = await jpegData(r.blob, max, q); } catch (x) { } }
    return imgs;
  }
  const posLine = (e, mode) => {
    const pl = placeOf(e);
    if (mode === 'none' || e.lat == null) return '';
    if (mode === 'approx') return `<div class="m">Near ${esc(pl ? pl + ' (' : '(')}${e.lat.toFixed(1)}, ${e.lon.toFixed(1)})</div>`;
    return `<div class="m">${esc(pl ? pl + ' · ' : '')}${esc(G.fmtCoord(e.lat, e.lon, 'dd'))} · <a href="${esc(G.mapLinks(e.lat, e.lon).google)}">map</a></div>`;
  };
  const PAGE_CSS = ':root{color-scheme:light dark;--bg:#f7f9fd;--tx:#18202e;--dim:#5d6a80;--ac:#1f5fb8;--ln:#d3dbea}@media(prefers-color-scheme:dark){:root{--bg:#0e1424;--tx:#e8edf8;--dim:#a6b4d4;--ac:#6fb3ff;--ln:#34497a}}body{margin:0;background:var(--bg);color:var(--tx);font:17px/1.5 Georgia,serif}main{max-width:640px;margin:0 auto;padding:20px 16px 50px}h1{color:var(--ac);margin:.2em 0}h2{color:var(--ac);font-size:1.15rem;border-bottom:1px solid var(--ln);padding-bottom:3px;margin-top:28px}.m{color:var(--dim);font-size:.85rem}.hl{font-style:italic}article{margin:12px 0;padding-left:10px;border-left:3px solid var(--ln)}article img{width:100%;height:auto;border-radius:10px;margin-top:6px}.st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.st div{border:1px solid var(--ln);border-radius:10px;padding:8px;text-align:center}.st b{display:block;font-size:1.2rem;color:var(--ac)}svg{width:100%;height:auto;max-width:420px}a{color:var(--ac)}';
  async function buildPage(o, on) {
    const list = pickList(o), st = stats(list), t = tripName();
    const imgs = o.photos ? await loadImgs(list, 900, 0.68, on) : {};
    const groups = []; list.forEach(e => { const k = dayOf(e), g = groups[groups.length - 1]; if (g && g.k === k) g.l.push(e); else groups.push({ k, l: [e] }); });
    const body = groups.reverse().map(g => {
      const d = J().daily[g.k] || {}, mi = pathMiles(g.l);
      return `<section><h2>Day ${dayNo(g.k)} · ${esc(OA.fmtDate(g.k, { weekday: 'long', month: 'long', day: 'numeric' }))}</h2>${mi >= 0.1 ? `<div class="m">About ${esc(OA.dist(mi))} between pins</div>` : ''}${d.hl ? `<p class="hl">${esc(d.hl)}</p>` : ''}` +
        g.l.slice().reverse().map(e => `<article><div class="m">${esc(OA.fmtTime(e.ts))}${e.tag ? ' · ' + esc(tagLabel(e.tag)) : ''}${e.mood ? ' · ' + esc(e.mood) : ''}</div>${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}${imgs[e.id] ? `<img src="${imgs[e.id]}" alt="Photo from ${esc(OA.fmtTime(e.ts))}">` : ''}${posLine(e, o.pos)}</article>`).join('') + '</section>';
    }).join('');
    const lastE = list[list.length - 1], ttl = (t ? t + ': ' : '') + 'Road trip journal';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(ttl)}</title><style>${PAGE_CSS}</style></head><body><main><h1>${esc(ttl)}</h1><div class="m">${lastE ? 'Latest entry ' + esc(new Date(lastE.ts).toLocaleString()) + '. ' : ''}Saved ${esc(new Date().toLocaleString())}. This page is a snapshot sent by hand, not live tracking.</div>
      <div class="st"><div><b>${st.pins}</b>pins</div><div><b>${st.days}</b>days</div><div><b>${st.photos}</b>photos</div>${st.miles >= 0.1 ? `<div><b>${esc(OA.dist(st.miles, 0))}</b>${st.fromApp ? 'driven' : 'between pins'}</div>` : ''}${st.places.length ? `<div><b>${st.places.length}</b>places</div>` : ''}</div>${o.pos === 'none' ? '' : sketchSVG(list)}${body || '<p>No entries in this period.</p>'}<p class="m" style="margin-top:30px">Made with Roadtripica, an Occultica app by 3lite Studios.</p></main></body></html>`;
  }

  /* ---------- memory book (print layout) ---------- */
  async function buildBook(o, on) {
    const list = pickList(o), st = stats(list), t = tripName(), fam = J().familyName;
    const imgs = o.photos ? await loadImgs(list, 800, 0.7, on) : {};
    const groups = []; list.forEach(e => { const k = dayOf(e), g = groups[groups.length - 1]; if (g && g.k === k) g.l.push(e); else groups.push({ k, l: [e] }); });
    const first = list[0], last = list[list.length - 1];
    const pages = groups.map(g => {
      const d = J().daily[g.k] || {}, ph = g.l.filter(e => imgs[e.id]);
      return `<section class="pg"><h2>Day ${dayNo(g.k)} <small>${esc(OA.fmtDate(g.k, { weekday: 'long', month: 'long', day: 'numeric' }))}</small></h2>${d.hl ? `<p class="hl">Best moment: ${esc(d.hl)}</p>` : ''}${ph.length ? `<div class="gr">${ph.slice(0, 6).map(e => `<figure><img src="${imgs[e.id]}" alt="">${e.text ? `<figcaption>${esc(e.text.split('\n')[0].slice(0, 90))}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}<ul>${g.l.filter(e => e.text && !(imgs[e.id] && ph.indexOf(e) < 6 && e.text.indexOf('\n') < 0 && e.text.length < 91)).map(e => `<li><b>${esc(OA.fmtTime(e.ts))}</b>${placeOf(e) ? ' · ' + esc(placeOf(e)) : ''}: ${esc(e.text).replace(/\n/g, '<br>')}</li>`).join('')}</ul><div class="draw">Draw or write your favourite thing from today</div></section>`;
    }).join('');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc((t || 'Our') + ' memory book')}</title><style>@page{margin:14mm}body{font:15px/1.45 Georgia,serif;color:#111;background:#fff;margin:0;padding:18px;max-width:780px;margin:0 auto}.cover{text-align:center;padding:90px 0 60px;page-break-after:always}.cover h1{font-size:2.4rem;margin:.2em 0}.pg{page-break-after:always;padding-top:6px}h2{border-bottom:2px solid #333;margin:0 0 8px}h2 small{font-size:.8rem;font-weight:400;color:#555}.hl{font-style:italic}.gr{display:grid;grid-template-columns:1fr 1fr;gap:10px}figure{margin:0}figure img{width:100%;height:auto;border-radius:6px}figcaption{font-size:.8rem;color:#444}.draw{border:2px dashed #888;border-radius:10px;min-height:150px;margin-top:14px;padding:8px;color:#777;font-size:.8rem}.end{text-align:center;padding:40px 0}.st span{display:inline-block;margin:6px 14px;font-size:1.1rem}</style></head><body><div class="cover"><div style="font-size:.9rem;letter-spacing:.2em">MEMORY BOOK</div><h1>${esc(t || (fam ? fam + ' road trip' : 'Our road trip'))}</h1>${fam && t ? `<p>${esc(fam)}</p>` : ''}${first ? `<p>${esc(OA.fmtDate(dayOf(first), { month: 'long', day: 'numeric', year: 'numeric' }))}${last && dayOf(last) !== dayOf(first) ? ' to ' + esc(OA.fmtDate(dayOf(last), { month: 'long', day: 'numeric', year: 'numeric' })) : ''}</p>` : ''}</div>${pages || '<p>No entries in this period.</p>'}<div class="end"><h2>The trip in numbers</h2><div class="st"><span><b>${st.days}</b> days</span><span><b>${st.pins}</b> pins</span><span><b>${st.photos}</b> photos</span>${st.miles >= 0.1 ? `<span><b>${esc(OA.dist(st.miles, 0))}</b></span>` : ''}${st.places.length ? `<span><b>${st.places.length}</b> places</span>` : ''}</div><p>Made with Roadtripica, an Occultica app by 3lite Studios.</p></div></body></html>`;
  }
  function printDoc(doc) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    const d = f.contentWindow.document; d.open(); d.write(doc); d.close();
    setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { OA.toast('Printing is not available here. Use Save as file.'); } setTimeout(() => f.remove(), 60000); }, 400);
  }

  /* ---------- share view ---------- */
  function shareHTML() {
    const j = J(), x = j.exp, n = j.entries.length, np = j.entries.filter(e => e.photoId).length;
    return `<div class="alert"><b class="t">No live tracking</b>This app cannot follow you live: that needs a server and signal. What it can do is let you send a text update or a snapshot page whenever you choose, with no signal needed to make it.</div>
      <div class="card"><div class="ct"><span>${OA.icon('phone')} Send an update</span></div><p class="sm dim">A short text to the household: where you are, how it is going. You press send.</p><button class="btn gold block" data-act="rjUpdate" data-k="${esc(OA.dkey())}">Write an update</button></div>
      <div class="card"><div class="ct"><span>${OA.icon('book')} Shareable trip page</span></div><p class="sm dim">One web page file with your pins, notes, photos, a route sketch and stats. Open it anywhere; no signal needed to make it.</p>
        <div class="two"><label class="fl">Days<select class="in" data-bind="journal.exp.days">${[['all', 'All days'], ['1', 'Today'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['14', 'Last 14 days']].map(o => `<option value="${o[0]}" ${String(x.days) === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>
        <label class="fl">Positions<select class="in" data-bind="journal.exp.pos">${[['none', 'None'], ['approx', 'Approximate'], ['exact', 'Exact']].map(o => `<option value="${o[0]}" ${x.pos === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label></div>
        <label class="chk"><input type="checkbox" data-bind="journal.exp.photos" ${x.photos ? 'checked' : ''}> Include photos (${np}), shrunk to fit</label>
        <p class="xs dim">Approximate shows only a town and coordinates rounded to about 7 miles. Exact shows full coordinates and map links: share only with people you trust. Anyone with the page can read it.</p>
        <button class="btn gold block" data-act="rjExport" ${n ? '' : 'disabled'}>Create trip page</button>${n ? '' : '<p class="xs dim">Drop a pin first.</p>'}</div>
      <div class="card"><div class="ct"><span>${OA.icon('heart')} Memory book</span></div><p class="sm dim">A print layout for the family: a cover, a page per day with photos and a drawing box for the kids, and the trip in numbers. Uses the days and photos choices above; never prints coordinates.</p>
        <label class="fl">Family name on the cover (optional)<input class="in" type="text" maxlength="60" data-bind="journal.familyName" value="${esc(j.familyName || '')}"></label>
        <div class="row"><button class="btn" data-act="rjBook" data-m="print" ${n ? '' : 'disabled'}>Print</button><button class="btn" data-act="rjBook" data-m="save" ${n ? '' : 'disabled'}>Save as file</button></div></div>
      <div class="card"><div class="ct"><span>${OA.icon('trash')} Journal data</span></div><p class="sm dim">${n} pins and ${np} photos on this phone. Back them up with the Menu backup (photos are not inside the backup code).</p><button class="btn danger block" data-act="rjWipe" ${n ? '' : 'disabled'}>Erase the whole journal</button></div>`;
  }

  /* ---------- kids corner ---------- */
  const BINGO = ['Red car', 'Truck pulling a trailer', 'Motorcycle', 'A bridge', 'A tunnel', 'Cows', 'A horse', 'Sheep', 'Water tower', 'A red barn', 'Wind turbine', 'Gas station', 'A giant billboard', 'Stop sign', 'Yellow school bus', 'Police car', 'Fire truck', 'Ambulance', 'Tractor', 'A train', 'A boat', 'An airplane', 'A rainbow', 'A mountain', 'A river', 'A lake', 'A bird of prey', 'A statue', 'A church steeple', 'A flag', 'Orange road cone', 'Welcome-to-the-state sign', 'An RV', 'A camper trailer', 'Open-top car', 'Tow truck', 'A dog in a car', 'Rest area sign', 'Deer crossing sign', 'A hot-air balloon', 'A food truck', 'A farm stand', 'Someone waving'];
  const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bingoCard(seed) { const r = rng(seed || 1), a = BINGO.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[k]; a[k] = t; } const c = a.slice(0, 24); c.splice(12, 0, 'FREE'); return c; }
  function kidsHTML() {
    const b = J().bingo; if (!b.seed) { b.seed = Math.floor(Math.random() * 1e6) + 1; b.marks = {}; }
    const card = bingoCard(b.seed), plates = J().plates, nPl = STATES.filter(s => plates[s]).length;
    return `<div class="card"><div class="ct"><span>${OA.icon('star')} Road trip bingo</span><button class="lnk" data-act="rjBingoNew">New card</button></div><p class="sm dim">Tap a square when you spot it. Five in a row wins. Never take your eyes off the road if you are the driver: the driver just calls out!</p>
      <div class="rj-bingo">${card.map((c, i) => `<button class="rj-sq ${c === 'FREE' || b.marks[i] ? 'on' : ''}" data-act="rjSq" data-i="${i}" ${c === 'FREE' ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div></div>
      <div class="card"><div class="ct"><span>${OA.icon('car')} License plate game</span><span class="sm">${nPl} / ${STATES.length}</span></div><p class="sm dim">Tap each state when you see a plate from it (parked cars and passengers' views only).</p>
      <div class="bar"><i style="width:${nPl / STATES.length * 100}%"></i></div><div class="chips wrap" style="margin-top:8px">${STATES.map(s => `<button class="chip ${plates[s] ? 'on' : ''}" data-act="rjPlate" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="row"><button class="btn" data-act="rjPlatesClear">Start over</button></div></div>
      <div class="card"><div class="ct"><span>${OA.icon('book')} Print for the car</span></div><p class="sm dim">Two bingo cards and the plate checklist on paper, for the back seat. Also see the Guide tab for 30+ car games.</p><div class="row"><button class="btn" data-act="rjKidsPrint">Print</button><button class="btn" data-act="rjKidsSave">Save as file</button></div></div>`;
  }
  function kidsDoc() {
    const c = [bingoCard(11), bingoCard(222)];
    const grid = card => `<table class="b">${[0, 1, 2, 3, 4].map(r => '<tr>' + [0, 1, 2, 3, 4].map(k => { const s = card[r * 5 + k]; return `<td>${s === 'FREE' ? '<b>FREE</b>' : esc(s)}</td>`; }).join('') + '</tr>').join('')}</table>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Road trip kids pages</title><style>@page{margin:12mm}body{font:15px/1.35 Georgia,serif;color:#111;background:#fff;max-width:760px;margin:0 auto;padding:14px}h1{font-size:1.5rem;margin:0}.pg{page-break-after:always}table.b{border-collapse:collapse;width:100%;table-layout:fixed;margin:10px 0}table.b td{border:2px solid #222;height:92px;text-align:center;vertical-align:middle;padding:4px;font-size:.95rem}.pl{columns:3;list-style:none;padding:0}.pl li{margin:5px 0;break-inside:avoid}.bx{display:inline-block;width:14px;height:14px;border:1.5px solid #000;margin-right:6px;vertical-align:-2px}</style></head><body><div class="pg"><h1>Road trip bingo</h1><p>Cross off each thing when you spot it. Five in a row (across, down or corner to corner) wins!</p>${grid(c[0])}</div><div class="pg"><h1>Road trip bingo, card two</h1>${grid(c[1])}</div><div><h1>License plate game</h1><p>Tick each state or district when you see its plate.</p><ul class="pl">${STATES.map(s => `<li><span class="bx"></span>${esc(s)}</li>`).join('')}</ul></div></body></html>`;
  }

  /* ---------- tab ---------- */
  const VIEWS = [['time', 'Timeline'], ['day', 'Day'], ['share', 'Share'], ['kids', 'Kids']];
  OA.tab({
    id: 'journal', label: 'Journal', icon: 'camera', order: 40,
    render() {
      const j = J(), v = VIEWS.some(x => x[0] === j.view) ? j.view : 'time';
      const body = v === 'time' ? timelineHTML() : v === 'day' ? dayHTML() : v === 'share' ? shareHTML() : kidsHTML();
      return `${OA.header('Journal', tripName() ? tripName() : 'Trip diary and photo drops')}
        <div class="row"><button class="btn gold" data-act="rjDrop" data-smoke>${OA.icon('pin', 'sm')} Drop a pin</button><button class="btn" data-act="rjDropPhoto">${OA.icon('camera', 'sm')} Photo</button></div>
        <div class="chips">${VIEWS.map(x => `<button class="chip ${v === x[0] ? 'on' : ''}" data-act="rjView" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>${body}`;
    }
  });

  /* ---------- actions ---------- */
  const afterChange = () => { OA.closeAllSheets(); OA.render(true); };
  OA.act({
    rjView(el) { J().view = el.dataset.v; OA.saveSoon(); OA.render(true); },
    rjDrop() { openDrop(); },
    rjDropPhoto() { openDrop(); pickPhoto(); },
    rjFix() { getFix(); },
    rjPhoto() { pickPhoto(); },
    rjMood(el) { if (!dr) return; dr.mood = dr.mood === el.dataset.v ? '' : el.dataset.v; OA.$$('#rjmoods .chip').forEach(c => c.classList.toggle('on', c.dataset.v === dr.mood)); },
    rjTag(el) { if (!dr) return; dr.tag = dr.tag === el.dataset.v ? '' : el.dataset.v; OA.$$('#rjtags .chip').forEach(c => c.classList.toggle('on', c.dataset.v === dr.tag)); },
    rjSave() { saveDraft(); },
    rjMoreDays() { tlDays += 6; OA.render(true); },
    rjOpen(el) { const e = ent(el.dataset.id); if (e) OA.sheet('Pin', detailHTML(e), { onOpen(root) { fillImgs(root); } }); },
    rjEdit(el) { const e = ent(el.dataset.id), t = OA.$('#rjetext'); if (!e || !t) return; e.text = t.value.trim(); changed(); OA.toast('Saved'); },
    async rjPlace(el) {
      const e = ent(el.dataset.id); if (!e || e.lat == null) return;
      if (!OA.online()) { OA.toast('No signal. Try again when you are online.'); return; }
      el.disabled = true; el.textContent = 'Looking up…';
      try { const r = await OA.reverse(e.lat, e.lon); e.place = [r.town, r.state].filter(Boolean).join(', ') || (r.name || '').split(',').slice(0, 2).join(',').trim(); changed(); OA.redrawSheet(detailHTML(e)); fillImgs(OA.sheetBody()); }
      catch (x) { el.disabled = false; el.textContent = 'Look up place name'; OA.toast('Could not look up the place: ' + (x && x.message || 'no answer')); }
    },
    async rjDel(el) {
      const e = ent(el.dataset.id); if (!e) return;
      if (!await OA.confirm('Delete this pin' + (e.photoId ? ' and its photo' : '') + '? This cannot be undone.', 'Delete')) return;
      if (e.photoId) { try { await OA.photo.del(e.photoId); } catch (x) { } }
      J().entries = J().entries.filter(x => x.id !== e.id); changed(); afterChange(); OA.toast('Deleted');
    },
    rjDay(el) { const j = J(); j.day = el.dataset.k; j.view = 'day'; OA.saveSoon(); OA.render(); window.scrollTo(0, 0); },
    rjPrevDay() { const j = J(), keys = Array.from(new Set(sorted().map(dayOf))).sort(), i = keys.indexOf(j.day); if (i > 0) { j.day = keys[i - 1]; OA.render(true); } },
    rjNextDay() { const j = J(), keys = Array.from(new Set(sorted().map(dayOf))).sort(), i = keys.indexOf(j.day); if (i >= 0 && i < keys.length - 1) { j.day = keys[i + 1]; OA.render(true); } },
    rjUpdate(el) { openUpdate(el.dataset.k || OA.dkey()); },
    rjSms() { const x = msgBody(); if (!x) { OA.toast('Write a message first.'); return; } location.href = OA.share.sms((J().hh.phone || '').replace(/[^\d+]/g, ''), x); },
    async rjShare() {
      const x = msgBody(); if (!x) return; const files = []; const last = sorted().filter(e => e.photoId).pop();
      if (last && dayOf(last) === OA.dkey()) { try { const r = await OA.photo.get(last.photoId); if (r && r.blob) files.push(r.blob); } catch (e) { } }
      OA.share.send({ title: 'Road trip update', text: x, files });
    },
    async rjCopy() { const x = msgBody(); try { await navigator.clipboard.writeText(x); OA.toast('Copied. Paste it into a message.'); } catch (e) { const t = OA.$('#rjmsg'); if (t) { t.focus(); t.select(); } OA.toast('Select the text and copy it.'); } },
    async rjExport(el) {
      const x = J().exp, n = J().entries.filter(e => e.photoId).length; el.disabled = true; const old = el.textContent;
      try {
        if (!pickList(x).length) { OA.toast('No pins in those days. Choose "All days".'); return; }
        const html = await buildPage(x, (i, m) => { el.textContent = 'Preparing photo ' + i + ' of ' + m + '…'; });
        const mb = html.length / 1048576; lastBuilt = html;
        if (mb > 8 && !await OA.confirm('This page is about ' + OA.round(mb, 1) + ' MB. Many email apps and free hosts struggle above 8 MB. Preview it anyway? (You can go back and choose fewer days or turn photos off.)', 'Preview')) return;
        OA.sheet('Trip page preview', `<div class="alert ${mb > 8 ? '' : 'ok'}" style="margin-top:0"><b class="t">${OA.round(mb, 2)} MB</b>${mb > 8 ? 'Large: choose fewer days or turn photos off for email.' : 'A good size to email.'} Positions: <b>${esc(x.pos === 'none' ? 'none' : x.pos === 'approx' ? 'approximate' : 'exact')}</b>.${x.pos === 'exact' ? ' <b class="warn">Exact positions: share only with people you trust.</b>' : ''}</div>
          <iframe id="rjprev" class="rj-prev" title="Preview" sandbox=""></iframe>
          <button class="btn gold block" data-act="rjSavePage">Save the page</button>
          <h3>Getting it to people</h3><ol class="ls sm"><li><b>Email or message it</b> as an attachment (best under about 8 MB).</li><li><b>Publish it:</b> put the file in a folder, rename it <b>index.html</b>, and drag the folder onto a free static host such as Netlify Drop. You get a link to text to people. You need signal for that step.</li><li>Run it again later to make a new snapshot. Each page is a snapshot.</li></ol>`, { onOpen(root) { const f = OA.$('#rjprev', root); if (f && lastBuilt) f.srcdoc = lastBuilt; } });
      } catch (e) { OA.toast('Could not build the page: ' + e.message, 5000); } finally { el.disabled = false; el.textContent = old; }
    },
    rjSavePage() { if (!lastBuilt) return; OA.download('roadtrip-journal-' + OA.dkey() + '.html', 'text/html', lastBuilt); OA.toast('Saved. Open it in a browser, or attach it to an email.'); },
    async rjBook(el) {
      const x = J().exp, b = el.disabled; el.disabled = true; const old = el.textContent;
      try {
        if (!pickList(x).length) { OA.toast('No pins in those days.'); return; }
        const doc = await buildBook(x, (i, m) => { el.textContent = 'Photo ' + i + '/' + m + '…'; });
        if (el.dataset.m === 'save') { OA.download('memory-book-' + OA.dkey() + '.html', 'text/html', doc); OA.toast('Saved. Open it and print or save as PDF.'); } else printDoc(doc);
      } catch (e) { OA.toast('Could not make the book: ' + e.message, 5000); } finally { el.disabled = b; el.textContent = old; }
    },
    async rjWipe() {
      if (!await OA.confirm('Erase every pin, note and photo in the journal? This cannot be undone.', 'Erase journal')) return;
      for (const e of J().entries) { if (e.photoId) { try { await OA.photo.del(e.photoId); } catch (x) { } } }
      J().entries = []; J().daily = {}; changed(); OA.render(true); OA.toast('Journal erased');
    },
    rjSq(el) { const b = J().bingo; if (b.marks[el.dataset.i]) delete b.marks[el.dataset.i]; else b.marks[el.dataset.i] = 1; el.classList.toggle('on'); OA.saveSoon(); },
    async rjBingoNew() { if (Object.keys(J().bingo.marks).length && !await OA.confirm('Start a new bingo card?', 'New card')) return; J().bingo = { seed: Math.floor(Math.random() * 1e6) + 1, marks: {} }; OA.save(); OA.render(true); },
    rjPlate(el) { const p = J().plates, s = el.dataset.s; if (p[s]) delete p[s]; else p[s] = 1; OA.saveSoon(); OA.render(true); },
    async rjPlatesClear() { if (!await OA.confirm('Clear all the plates you have spotted?', 'Clear')) return; J().plates = {}; OA.save(); OA.render(true); },
    rjKidsPrint() { printDoc(kidsDoc()); },
    rjKidsSave() { OA.download('road-trip-kids-pages.html', 'text/html', kidsDoc()); OA.toast('Saved. Open it to print.'); }
  });

  window.RT = window.RT || {};
  RT.journal = { count: () => J().entries.length, entries: () => sorted(), open: () => OA.go('journal') };
})();
