/* Backpackica: Log tab. Trail journal, GPS/photo drops, daily log, check-ins, leave-behind packet, progress page, SOS, stats.
   State: OA.S.log = {entries, daily, contacts, sched, lastCheckin, checkins, packet, draft, milestone, started, view}
   Public: BP.log = {entries, lastDrop, stats, milesToday, milesTotal, dayMiles, checkinState, summary, _testAdd}
   No server: sharing goes through the share sheet, sms:/mailto: links and an exported web page. */
window.BP = window.BP || { todayCards: [] };
BP.todayCards = BP.todayCards || [];
(function () {
  'use strict';
  const esc = OA.esc, G = OA.geo;
  OA.defaults({
    log: {
      entries: [], daily: {}, contacts: [], checkins: [], lastCheckin: null, draft: null, milestone: 0, started: null, view: 'time',
      sched: { on: false, mode: 'daily', time: '20:00', every: 2, grace: 12, armedAt: null },
      packet: { name: '', phone: '', party: '', trail: '', trailhead: '', start: '', end: '', itinerary: '', towns: '', tent: '', pack: '', jacket: '', gearNote: '', vehicle: '', plate: '', parked: '', medical: '', includeMedical: false, extra: '' },
      exp: { days: 'all', photos: true, coords: 'none', hold: false }
    }
  });
  const L = () => { const l = OA.S.log; if (!l.entries) l.entries = []; if (!l.daily) l.daily = {}; if (!l.contacts) l.contacts = []; if (!l.checkins) l.checkins = []; if (!l.sched) l.sched = { on: false, mode: 'daily', time: '20:00', every: 2, grace: 12, armedAt: null }; if (!l.packet) l.packet = {}; if (!l.exp) l.exp = { days: 'all', photos: true, coords: 'none', hold: false }; return l; };
  const KINDS = [['drop', 'Pin', 'pin'], ['note', 'Note', 'edit'], ['camp', 'Camp', 'tent'], ['water', 'Water', 'drop'], ['town', 'Town', 'home'], ['resupply', 'Resupply', 'cart'], ['summit', 'Summit', 'mountain'], ['zero', 'Zero day', 'bed'], ['trouble', 'Trouble', 'alert']];
  const MOODS = ['Great', 'Good', 'OK', 'Low'], ENERGY = ['High', 'Steady', 'Tired', 'Spent'];
  const kindLabel = k => (KINDS.find(x => x[0] === k) || KINDS[0])[1];
  const kindIcon = k => (KINDS.find(x => x[0] === k) || KINDS[0])[2];
  const dayOf = e => OA.dkey(new Date(e.ts));
  const bpx = (a, b) => { try { const o = window.BP && BP[a]; return o && typeof o[b] === 'function' ? o[b]() : null; } catch (e) { return null; } };
  const toMi = v => OA.unit.dist() === 'km' ? v / OA.mi2km : v;
  const fromMi = v => OA.round(OA.distN(v), 1);
  const dunit = () => OA.unit.dist() === 'km' ? 'km' : 'mi';
  const phoneClean = p => String(p || '').replace(/[^\d+]/g, '');
  const sorted = () => L().entries.slice().sort((a, b) => a.ts - b.ts);

  /* ---------- trail context (defensive) ---------- */
  function trailNow() { const c = bpx('trail', 'current'); return c && typeof c === 'object' ? c : null; }
  function curMile() { const c = trailNow(); return c && c.mile != null && !isNaN(c.mile) ? +c.mile : null; }
  function nextTown() { const t = bpx('plan', 'nextTown') || (bpx('trail', 'summary') || {}).nextTown; if (!t) return null; if (typeof t === 'string') return { name: t }; return t.name ? t : null; }
  function nextTownText() { const t = nextTown(); return t ? t.name + (t.mi != null ? ' (' + OA.dist(t.mi) + ')' : '') + (t.date ? ', planned ' + OA.fmtDate(t.date) : '') : ''; }

  /* ---------- mileage ---------- */
  function marks() { return sorted().filter(e => e.mile != null && !isNaN(e.mile)); }
  function derivedMiles(key) {
    const m = marks(), today = m.filter(e => dayOf(e) === key); if (!today.length) return null;
    const last = today[today.length - 1].mile, prev = m.filter(e => dayOf(e) < key);
    let base = today[0].mile;
    if (prev.length) { const p = prev[prev.length - 1]; if (OA.daysBetween(dayOf(p), key) <= 2) base = p.mile; }
    if (today.length < 2 && base === last) return null;
    return OA.round(Math.abs(last - base), 1);
  }
  function dayMiles(key) {
    const d = L().daily[key] || {};
    if (d.zero) return 0;
    if (d.miles != null && !isNaN(d.miles)) return +d.miles;
    return derivedMiles(key) || 0;
  }
  function dayKeys() { const s = {}; Object.keys(L().daily).forEach(k => { const d = L().daily[k]; if (d && (d.miles != null || d.zero || d.camp || d.highlight || d.food || d.water || d.body || d.weather || d.gain != null)) s[k] = 1; }); L().entries.forEach(e => { s[dayOf(e)] = 1; }); return Object.keys(s).sort(); }
  function stats() {
    const keys = dayKeys(), t = OA.dkey();
    if (!keys.length) return { empty: true, total: 0, days: 0, zero: 0, hikeDays: 0, avg: 0, longest: 0, longestDay: null, gain: 0, photos: 0, towns: 0, series: [], start: null };
    const start = L().started && L().started <= keys[0] ? L().started : keys[0];
    let end = keys[keys.length - 1]; if (OA.daysBetween(end, t) <= 1 && OA.daysBetween(end, t) >= 0) end = t;
    const days = Math.max(1, OA.daysBetween(start, end) + 1), series = [];
    let total = 0, zero = 0, hike = 0, longest = 0, longestDay = null, gain = 0;
    for (let i = 0; i < days; i++) {
      const k = OA.addDays(start, i), d = L().daily[k] || {}, m = dayMiles(k); series.push({ k, m });
      total += m; if (d.zero || L().entries.some(e => e.kind === 'zero' && dayOf(e) === k)) zero++; if (m > 0.05) hike++; if (m > longest) { longest = m; longestDay = k; } if (d.gain) gain += +d.gain;
    }
    const towns = {}; L().entries.forEach(e => { if (e.kind === 'town' || e.kind === 'resupply') towns[dayOf(e)] = 1; });
    return { empty: false, total: OA.round(total, 1), days, zero, hikeDays: hike, avg: hike ? OA.round(total / hike, 1) : 0, longest: OA.round(longest, 1), longestDay, gain: Math.round(gain), photos: L().entries.filter(e => e.photoId).length, towns: Object.keys(towns).length, series, start, end };
  }
  function checkMilestone() {
    const st = stats(), n = Math.floor((OA.distN(st.total)) / 100), l = L();
    if (n > (l.milestone || 0)) { l.milestone = n; OA.save(); OA.toast(n * 100 + ' ' + dunit() + ' logged. Well walked.', 4000); }
  }
  function changed() { try { OA.publish(); } catch (e) { } checkMilestone(); }

  /* ---------- check-in schedule ---------- */
  function atTime(d, t) { const p = String(t || '20:00').split(':'), x = new Date(d); x.setHours(+p[0] || 20, +p[1] || 0, 0, 0); return x.getTime(); }
  function schedState() {
    const s = L().sched; if (!s.on) return { on: false, state: 'off' };
    const now = Date.now(), grace = Math.max(0, +s.grace || 0) * 3600000, ref = L().lastCheckin || s.armedAt || now;
    let dl, soft = null;
    if (s.mode === 'town') {
      dl = ref + Math.max(1, +s.every || 5) * 86400000;
      const t = sorted().find(e => (e.kind === 'town' || e.kind === 'resupply') && e.ts > ref); if (t) soft = t.ts;
    } else {
      const n = s.mode === 'days' ? Math.max(1, +s.every || 2) : 1;
      if (L().lastCheckin) { const d = new Date(ref); d.setDate(d.getDate() + n); dl = atTime(d, s.time); }
      else if (n === 1) { dl = atTime(ref, s.time); if (dl <= ref) { const d = new Date(ref); d.setDate(d.getDate() + 1); dl = atTime(d, s.time); } }
      else { const d = new Date(ref); d.setDate(d.getDate() + n); dl = atTime(d, s.time); }
    }
    let state = 'ok';
    if (now >= dl + grace) state = 'overdue'; else if (now >= dl) state = 'due'; else if (soft && now >= soft) state = 'due'; else if (dl - now < 3 * 3600000) state = 'soon';
    return { on: true, dl, soft, state, graceAt: dl + grace, grace: grace / 3600000, mode: s.mode };
  }
  function whenText(ts) {
    const d = new Date(ts), today = OA.dkey(), k = OA.dkey(d), diff = OA.daysBetween(today, k), tm = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff === -1 ? 'yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })) + ' ' + tm;
  }
  function dur(ms) { const h = ms / 3600000; return h < 1 ? Math.max(1, Math.round(h * 60)) + ' min' : h < 48 ? OA.round(h, 1) + ' h' : Math.round(h / 24) + ' days'; }
  function schedDesc() {
    const s = L().sched; if (!s.on) return 'No regular check-in schedule set.';
    const t = new Date(); t.setHours(+String(s.time).split(':')[0] || 20, +String(s.time).split(':')[1] || 0); const tm = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const m = s.mode === 'town' ? 'a message at every town stop, and at least every ' + (s.every || 5) + ' days' : s.mode === 'days' ? 'a message every ' + (s.every || 2) + ' days by ' + tm : 'a message every day by ' + tm;
    return 'I plan to send ' + m + '. If I am more than ' + (s.grace || 0) + ' hours late, someone should act.';
  }
  function bannerHTML() {
    const st = schedState(), l = L();
    if (!st.on) return `<section class="card tip lg-ban"><div class="ct"><span>${OA.icon('clock')} Check-ins are off</span></div><p class="sm dim">Tell someone when you will check in, and when they should worry. You choose the schedule and who gets it.</p><button class="btn block" data-act="logView" data-v="ci">Set up check-ins</button></section>`;
    const last = l.lastCheckin ? 'Last check-in ' + OA.ago(l.lastCheckin) + '.' : 'No check-in sent yet.';
    if (st.state === 'overdue') return `<div class="alert danger lg-ban"><b class="t">Check-in overdue</b>It was due ${esc(whenText(st.dl))}, ${esc(dur(Date.now() - st.dl))} ago. Your grace time (${esc(String(st.grace))} h) is over, so the people who have your plan may start to act. Send an "I'm okay" now if you can.<div class="row"><button class="btn gold" data-act="ciOkay">I'm okay: check in</button></div></div>`;
    if (st.state === 'due') return `<div class="alert lg-ban"><b class="t">Check-in due</b>${st.soft && Date.now() < st.dl ? 'You reached a town stop: let your people know.' : 'It was due ' + esc(whenText(st.dl)) + '.'} ${esc(last)}<div class="row"><button class="btn gold" data-act="ciOkay">I'm okay: check in</button></div></div>`;
    return `<section class="card lg-ban"><div class="ct"><span>${OA.icon('clock')} Next check-in</span><span class="sm ${st.state === 'soon' ? 'warn' : 'dim'}">${esc(whenText(st.dl))}</span></div><div class="sm dim">${esc(last)}</div><div class="row"><button class="btn gold" data-act="ciOkay">I'm okay: check in</button></div></section>`;
  }
  /* in-app reminder tick: only works while the app is open (iPhone web apps cannot wake in the background) */
  let lastKey = '';
  function tick() {
    const st = schedState(), key = st.state + ':' + st.dl; if (key === lastKey) return;
    const first = lastKey === ''; lastKey = key;
    if ((st.state === 'due' || st.state === 'overdue') && !first && L().sched.notifiedFor !== key) {
      L().sched.notifiedFor = key; OA.saveSoon();
      try { if (window.Notification && Notification.permission === 'granted') { const body = st.state === 'overdue' ? 'Check-in overdue. Tap to send an I am okay.' : 'Check-in due. Tap to send an I am okay.'; try { new Notification('Backpackica', { body }); } catch (e) { navigator.serviceWorker && navigator.serviceWorker.ready.then(r => r.showNotification('Backpackica', { body })); } } } catch (e) { }
    }
    if (!OA.sheetOpen() && (OA.current() === 'log' || OA.current() === 'today')) OA.render(true);
  }
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  OA.on('started', () => setTimeout(tick, 500));

  /* ---------- fixes and messages ---------- */
  async function grabFix(ms) { try { return await G.position({ timeout: ms || 8000, maximumAge: 120000 }); } catch (e) { return G.known(); } }
  function entText(e, link) {
    const t = new Date(e.ts); let s = kindLabel(e.kind) + ' · ' + t.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    if (e.mile != null) s += ' · mile ' + e.mile;
    if (e.text) s += '\n' + e.text;
    if (e.lat != null) s += '\n' + G.fmtCoord(e.lat, e.lon, 'dd') + (link !== false ? '\n' + G.mapLinks(e.lat, e.lon).google : '');
    return s;
  }
  function okMessage(fix) {
    const t = trailNow(), mile = curMile() != null ? curMile() : (marks().slice(-1)[0] || {}).mile, nt = nextTownText();
    const L2 = ['I am okay. Check-in from the trail.'];
    if (fix) { L2.push('Position: ' + G.fmtCoord(fix.lat, fix.lon, 'dd')); L2.push(G.mapLinks(fix.lat, fix.lon).google); L2.push('(GPS fix ' + OA.ago(fix.ts || Date.now()) + (fix.acc ? ', about ' + Math.round(fix.acc * 3.28) + ' ft accuracy' : '') + ')'); }
    else L2.push('Position: no GPS fix right now.');
    if (mile != null) L2.push((t && t.trail ? t.trail + ' ' : '') + 'mile ' + mile);
    if (nt) L2.push('Next town: ' + nt);
    L2.push('Sent ' + new Date().toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + '. This is my own message, not live tracking.');
    return L2.join('\n');
  }
  function recordCheckin(names, fix, via) {
    const l = L(); l.lastCheckin = Date.now(); l.checkins.unshift({ ts: l.lastCheckin, to: names || [], lat: fix ? fix.lat : null, lon: fix ? fix.lon : null, via: via || '' }); l.checkins = l.checkins.slice(0, 60); l.sched.notifiedFor = ''; lastKey = ''; OA.save(); changed();
  }

  /* ---------- photo thumbs ---------- */
  const urlCache = {}, BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  async function photoUrl(id, full) { const k = (full ? 'f' : 't') + id; if (urlCache[k]) return urlCache[k]; const r = await OA.photo.get(id); if (!r) return null; return (urlCache[k] = full ? OA.photo.fullUrl(r) : OA.photo.url(r)); }
  function fillImgs(root) { Array.prototype.forEach.call((root || document).querySelectorAll('img[data-ph]'), async im => { try { const u = await photoUrl(im.dataset.ph, im.dataset.full === '1'); if (u) im.src = u; else im.alt = 'photo not found'; } catch (e) { } }); }
  OA.on('render', id => { if (id === 'log') fillImgs(OA.$('#view')); });
  const img = (id, full, cls) => `<img data-ph="${esc(id)}"${full ? ' data-full="1"' : ''} class="${cls || 'lg-th'}" src="${BLANK}" alt="photo">`;

  /* ---------- tab ---------- */
  let tlDays = 6, dayKey = OA.dkey();
  const VIEWS = [['time', 'Timeline'], ['day', 'Daily log'], ['ci', 'Check-ins'], ['stats', 'Stats'], ['share', 'Share']];
  function queue() { return sorted().filter(e => !(e.share && e.share.at)); }

  OA.tab({
    id: 'log', label: 'Log', icon: 'camera', order: 60,
    render(el) {
      const l = L(), q = queue(), view = VIEWS.some(v => v[0] === l.view) ? l.view : 'time';
      const body = { time: timelineHTML, day: dayHTML, ci: ciHTML, stats: statsHTML, share: shareHTML }[view]();
      el.innerHTML = OA.header('Trail log', 'Drops, check-ins and what you share') + bannerHTML() +
        `<section class="card hero"><button class="btn gold block lg-big" data-act="dropOpen" data-smoke>${OA.icon('pin')} Drop a pin</button>
          <div class="row"><button class="btn" data-act="noteOpen">${OA.icon('edit', 'sm')} Quick note</button><button class="btn danger" data-act="sosOpen" data-smoke>${OA.icon('alert', 'sm')} SOS / trouble</button></div>
          <div class="xs dim" style="margin-top:8px">No live tracking: you choose what to send and when. Everything saves on this phone, with or without signal.</div></section>` +
        (q.length ? `<section class="card tip"><div class="ct"><span>${OA.icon('share')} Waiting to send</span><span class="tag w">${q.length}</span></div><div class="sm dim">${q.length} ${q.length === 1 ? 'entry has' : 'entries have'} not been sent to anyone yet.</div><button class="btn block" data-act="queueOpen" data-smoke>Send now</button></section>` : '') +
        `<div class="chips">${VIEWS.map(v => `<button class="chip ${v[0] === view ? 'on' : ''}" data-act="logView" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>` + body;
    }
  });
  function sheetSOSLink() { return `<button class="btn danger block" data-act="sosOpen">${OA.icon('alert', 'sm')} SOS / trouble</button>`; }

  /* ---------- timeline ---------- */
  function stripSVG() {
    const m = marks(); if (m.length < 2) return '<div class="sm dim">The trail strip draws once you have two drops with mile markers.</div>';
    const lo = Math.min.apply(null, m.map(e => e.mile)), hi = Math.max.apply(null, m.map(e => e.mile)), W = 360, H = 62, P = 14, X = v => P + (v - lo) / ((hi - lo) || 1) * (W - 2 * P);
    const col = k => k === 'trouble' ? 'var(--red)' : k === 'town' || k === 'resupply' ? 'var(--gold)' : k === 'camp' ? 'var(--green)' : k === 'water' ? 'var(--blue)' : 'var(--accent)';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Drops by trail mile"><line x1="${P}" x2="${W - P}" y1="26" y2="26" stroke="var(--line)" stroke-width="3" stroke-linecap="round"/>${m.map(e => `<circle cx="${X(e.mile).toFixed(1)}" cy="26" r="5" fill="${col(e.kind)}" stroke="var(--bg)" stroke-width="1.5"/>`).join('')}<text x="${P}" y="54" text-anchor="start">mile ${lo}</text><text x="${W - P}" y="54" text-anchor="end">mile ${hi}</text></svg>`;
  }
  function entRow(e) {
    const t = e.text ? e.text.split('\n')[0] : kindLabel(e.kind) + (e.lat != null ? ' at ' + G.fmtCoord(e.lat, e.lon, 'dd') : '');
    return `<div class="li" data-act="entOpen" data-id="${esc(e.id)}"><div class="ic">${OA.icon(kindIcon(e.kind))}</div><div class="tx"><b>${esc(t.length > 70 ? t.slice(0, 68) + '…' : t)}</b><span>${esc(OA.fmtTime(e.ts))} · ${esc(kindLabel(e.kind))}${e.mile != null ? ' · mile ' + esc(e.mile) : ''}${e.lat == null ? ' · no GPS' : ''}${e.share && e.share.at ? '' : ' · <span class="warn">not sent</span>'}</span></div><div class="end">${e.photoId ? img(e.photoId) : ''}</div></div>`;
  }
  function timelineHTML() {
    const all = sorted().reverse();
    if (!all.length) return `<section class="card"><div class="ct"><span>${OA.icon('book')} Timeline</span></div><p class="sm dim">Nothing logged yet. Your first drop saves where you are, an optional photo and a note, even with no signal. Later you can send what you like to the people you choose.</p><button class="btn gold block" data-act="dropOpen">Make the first drop</button></section>`;
    const groups = []; all.forEach(e => { const k = dayOf(e), g = groups[groups.length - 1]; if (g && g.k === k) g.list.push(e); else groups.push({ k, list: [e] }); });
    const st = stats(), shown = groups.slice(0, tlDays);
    return `<section class="card"><div class="ct"><span>${OA.icon('route')} Trail strip</span><span class="sm dim">${all.length} entries</span></div>${stripSVG()}</section>` +
      shown.map(g => { const n = st.start ? OA.daysBetween(st.start, g.k) + 1 : null, d = L().daily[g.k] || {}; return `<section class="card"><div class="ct"><span>${n ? 'Day ' + n + ' · ' : ''}${esc(OA.fmtDate(g.k))}</span><span class="sm dim">${d.zero ? 'zero day' : dayMiles(g.k) ? esc(OA.dist(dayMiles(g.k))) : ''}</span></div>${d.highlight ? `<div class="sm dim" style="margin-bottom:4px">${esc(d.highlight)}</div>` : ''}${g.list.map(entRow).join('')}</section>`; }).join('') +
      (groups.length > tlDays ? `<button class="btn block" data-act="tlMore">Show earlier days (${groups.length - tlDays} more)</button>` : '');
  }

  /* ---------- drop sheet ---------- */
  function newDraft(kind) {
    const f = G.known();
    return { ts: Date.now(), kind: kind || 'drop', text: '', mood: '', energy: '', mile: curMile(), photoId: null, lat: f ? f.lat : null, lon: f ? f.lon : null, alt: f ? f.alt : null, acc: f ? f.acc : null, fixTs: f ? f.ts : null };
  }
  function gpsLine(d) {
    if (d.lat == null) return '<span class="warn">No GPS fix yet.</span> You can still save: the entry keeps your note and photo, without a position.';
    return `${esc(G.fmtCoord(d.lat, d.lon, 'dd'))}<span class="dim"> · ${d.fixTs ? esc(OA.ago(d.fixTs)) : ''}${d.acc ? ' · ±' + Math.round(d.acc * 3.28) + ' ft' : ''}</span>`;
  }
  function dropHTML(d) {
    const chip = (arr, key, cur) => `<div class="chips wrap">${arr.map(x => `<button class="chip ${cur === x ? 'on' : ''}" data-act="dropChip" data-k="${key}" data-v="${x}">${x}</button>`).join('')}</div>`;
    return `${sheetSOSLink()}
      <div class="alert ok" style="margin-top:0"><b class="t">Position</b><div id="dgps" class="sm">${gpsLine(d)}</div><button class="btn block" data-act="dropFix" style="margin:6px 0 0">Update position</button></div>
      <label class="fl">What is this?</label><div class="chips wrap" id="dkinds">${KINDS.map(k => `<button class="chip ${d.kind === k[0] ? 'on' : ''}" data-act="dropKind" data-v="${k[0]}">${k[1]}</button>`).join('')}</div>
      <label class="fl">Note<textarea class="in" rows="3" id="dtext" placeholder="A line about the place, the day, how you feel">${esc(d.text)}</textarea></label>
      <label class="fl">Trail mile marker (the trail's own numbering)<input class="in" id="dmile" type="number" inputmode="decimal" step="0.1" value="${d.mile == null ? '' : esc(d.mile)}" placeholder="optional"></label>
      <label class="fl">Mood</label>${chip(MOODS, 'mood', d.mood)}<label class="fl">Energy</label>${chip(ENERGY, 'energy', d.energy)}
      <div id="dphoto">${d.photoId ? img(d.photoId, false, 'lg-prev') : ''}</div>
      <div class="row"><button class="btn" data-act="dropPhoto">${OA.icon('camera', 'sm')} ${d.photoId ? 'Replace photo' : 'Add photo'}</button>${d.photoId ? '<button class="btn" data-act="dropNoPhoto">Remove photo</button>' : ''}</div>
      <button class="btn gold block" data-act="dropSave">Save to my log</button>
      <button class="btn block" data-act="dropDiscard">Discard this draft</button>`;
  }
  function openDrop(kind) {
    const l = L(); if (!l.draft || Date.now() - l.draft.ts > 3 * 3600000 || (kind && l.draft.kind !== kind && !l.draft.text && !l.draft.photoId)) l.draft = newDraft(kind); else if (kind) l.draft.kind = kind;
    OA.save();
    OA.sheet(kind === 'note' ? 'Quick note' : 'Drop a pin', dropHTML(l.draft), { onOpen(root) { fillImgs(root); if (!L().draft) return; dropFix(); } });
  }
  async function dropFix() {
    const d = L().draft, box = document.getElementById('dgps'); if (!d) return;
    if (box) box.innerHTML = '<span class="spin"></span> Looking for a GPS fix (up to 8 seconds)…';
    let f = null, err = '';
    try { f = await G.position({ timeout: 8000, maximumAge: 30000 }); } catch (e) { err = e.message; f = G.known(); }
    const dd = L().draft; if (!dd) return;
    if (f) { dd.lat = f.lat; dd.lon = f.lon; dd.alt = f.alt; dd.acc = f.acc; dd.fixTs = f.ts; }
    OA.saveSoon(); const b = document.getElementById('dgps'); if (b) b.innerHTML = gpsLine(dd) + (err && f ? `<div class="xs warn">No fresh fix (${esc(err)}). Using the last one.</div>` : err && !f ? `<div class="xs dim">${esc(err)}</div>` : '');
  }
  function readDraftFields() { const d = L().draft; if (!d) return null; const t = OA.$('#dtext'), m = OA.$('#dmile'); if (t) d.text = t.value; if (m) { const v = parseFloat(m.value); d.mile = isNaN(v) ? null : v; } return d; }
  function addEntry(d) {
    const l = L(), e = { id: OA.uid(), ts: Date.now(), lat: d.lat != null ? d.lat : null, lon: d.lon != null ? d.lon : null, alt: d.alt != null ? d.alt : null, acc: d.acc != null ? d.acc : null, mile: d.mile != null && !isNaN(d.mile) ? +d.mile : null, text: String(d.text || '').trim(), photoId: d.photoId || null, kind: d.kind || 'drop', mood: d.mood || '', energy: d.energy || '', miles: 0, share: d.share || {} };
    l.entries.push(e); l.entries.sort((a, b) => a.ts - b.ts); if (!l.started || dayOf(e) < l.started) l.started = dayOf(e);
    e.miles = dayMiles(dayOf(e)); OA.save(); changed(); return e;
  }
  /* ---------- timeline entry detail, edit, delete, share ---------- */
  function detailHTML(e) {
    const f = e.lat != null ? ['dd', 'ddm', 'utm'].map(m => `<div class="kv"><span>${{ dd: 'Decimal', ddm: 'Deg, dec min', utm: 'UTM' }[m]}</span><b>${esc(G.fmtCoord(e.lat, e.lon, m))}</b></div>`).join('') : '<div class="sm dim">No GPS position was available for this entry.</div>';
    return `${e.photoId ? img(e.photoId, true, 'lg-full') : ''}
      <div class="ct" style="margin-top:8px"><span>${OA.icon(kindIcon(e.kind))} ${esc(kindLabel(e.kind))}</span><span class="sm dim">${esc(new Date(e.ts).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span></div>
      ${e.text ? `<p style="white-space:pre-wrap">${esc(e.text)}</p>` : ''}
      <div>${e.mile != null ? `<span class="tag a">mile ${esc(e.mile)}</span>` : ''}${e.mood ? `<span class="tag">${esc(e.mood)}</span>` : ''}${e.energy ? `<span class="tag">${esc(e.energy)} energy</span>` : ''}${e.alt != null ? `<span class="tag">${esc(OA.ft(e.alt * 3.28084))} (GPS)</span>` : ''}<span class="tag ${e.share && e.share.at ? 'g' : 'w'}">${e.share && e.share.at ? 'sent ' + esc(OA.ago(e.share.at)) : 'not sent'}</span></div>
      <div style="margin-top:8px">${f}</div>
      ${e.lat != null ? `<a class="btn block" href="${esc(G.mapLinks(e.lat, e.lon).osm || G.mapLinks(e.lat, e.lon).google)}" target="_blank" rel="noopener">Open in maps (needs signal)</a>` : ''}
      <button class="btn gold block" data-act="entShare" data-id="${esc(e.id)}">${OA.icon('share', 'sm')} Send this entry</button>
      <div class="row"><button class="btn" data-act="entEdit" data-id="${esc(e.id)}">${OA.icon('edit', 'sm')} Edit</button><button class="btn danger" data-act="entDel" data-id="${esc(e.id)}">${OA.icon('trash', 'sm')} Delete</button></div>`;
  }
  const findEnt = id => L().entries.find(e => e.id === id);
  async function sendEntries(list, title, text) {
    const files = [];
    for (const e of list.slice(0, 5)) { if (e.photoId) { try { const r = await OA.photo.get(e.photoId); if (r && r.blob) files.push(r.blob); } catch (x) { } } }
    const ok = await OA.share.send({ title: title || 'Trail update', text, files });
    if (ok) { list.forEach(e => { e.share = { at: Date.now(), via: 'share sheet' }; }); OA.save(); }
    return ok;
  }

  /* ---------- queue / send now ---------- */
  function queueText(list) {
    const f = list.slice().reverse().find(e => e.lat != null), p = L().packet;
    const head = 'Trail update' + (p.name ? ' from ' + p.name : '') + ' (sent by me from Backpackica, not live tracking)';
    return head + '\n\n' + list.map(e => entText(e, true)).join('\n\n') + (f ? '' : '\n\n(No GPS positions in these entries.)');
  }
  function queueHTML() {
    const q = queue().reverse(), l = L();
    const rows = q.slice(0, 20).map((e, i) => `<label class="chk"><input type="checkbox" class="qc" data-id="${esc(e.id)}" ${i < 6 ? 'checked' : ''} data-onchange="qRefresh"><span>${esc(OA.fmtTime(e.ts))} ${esc(OA.fmtDate(dayOf(e), { month: 'short', day: 'numeric' }))} · ${esc(kindLabel(e.kind))}${e.text ? ': ' + esc(e.text.slice(0, 50)) : ''}${e.photoId ? ' (photo)' : ''}</span></label>`).join('');
    const ctc = l.contacts.filter(c => c.phone).map((c, i) => `<button class="btn" data-act="qSms" data-id="${esc(c.id)}">Text ${esc(c.name)}</button>`).join('');
    return `<p class="sm dim">Pick what to send. Photos go along when your phone's share sheet allows it (some message apps take one photo at a time). The text below is exactly what will be sent.</p>${rows || '<p class="sm dim">Nothing is waiting.</p>'}
      <textarea class="in" rows="9" id="qtext"></textarea>
      <button class="btn gold block" data-act="qSend">${OA.icon('share', 'sm')} Share…</button>
      <div class="row wrap">${ctc}</div><button class="btn block" data-act="qCopy">Copy text</button><button class="btn block" data-act="qMark">Mark as sent without sending</button>`;
  }
  function qSelected() { const ids = OA.$$('.qc').filter(c => c.checked).map(c => c.dataset.id); return sorted().filter(e => ids.indexOf(e.id) >= 0); }

  /* ---------- daily log ---------- */
  const WX = ['Sunny', 'Cloudy', 'Rain', 'Snow', 'Windy', 'Hot', 'Cold', 'Fog'];
  function totalsHTML() {
    const s = stats();
    return `<div class="stat"><div><b>${esc(OA.dist(dayMiles(dayKey)))}</b><span>THIS DAY</span></div><div><b>${esc(OA.dist(s.total))}</b><span>TOTAL</span></div><div><b>${s.days}</b><span>DAYS</span></div></div>`;
  }
  function dayHTML() {
    const k = dayKey, d = L().daily[k] || {}, auto = derivedMiles(k), lastDrop = sorted().filter(e => dayOf(e) === k && e.lat != null).pop();
    const b = f => `data-bind="log.daily.${k}.${f}" data-then="dlChanged"`;
    return `<section class="card"><div class="ct"><span>${OA.icon('book')} Daily log</span></div>
      <div class="row mid"><button class="btn" data-act="dlShift" data-n="-1" aria-label="Previous day" style="flex:none">‹</button><input class="in" type="date" value="${k}" max="${OA.dkey()}" data-onchange="dlDate" style="margin:0"><button class="btn" data-act="dlShift" data-n="1" aria-label="Next day" style="flex:none">›</button></div>
      <div id="dltot">${totalsHTML()}</div>
      <label class="chk"><input type="checkbox" ${d.zero ? 'checked' : ''} ${b('zero')} data-type="bool"> Zero day (rest day, no miles)</label>
      <label class="fl">Miles walked (${dunit()})<input class="in lg-num" id="dlmiles" type="number" inputmode="decimal" step="0.1" value="${d.miles != null ? fromMi(d.miles) : ''}" placeholder="${auto != null ? 'auto: ' + fromMi(auto) : '0'}" data-onchange="dlMiles"></label>
      ${auto != null && d.miles == null ? `<div class="sm dim">From your mile markers: about <b>${esc(OA.dist(auto))}</b> (counts the distance from your last marker). <button class="lnk" data-act="dlUseAuto">Use it</button></div>` : ''}
      <label class="fl">Camp location<input class="in" id="dlcamp" ${b('camp')} value="${esc(d.camp || '')}" placeholder="Mile, landmark, creek name…"></label>
      ${lastDrop ? `<button class="mini" data-act="dlCampFill">Use my last drop of the day</button>` : ''}
      <label class="fl">Water sources used<input class="in" ${b('water')} value="${esc(d.water || '')}" placeholder="Creeks, taps, caches"></label>
      <label class="fl">Food eaten<input class="in" ${b('food')} value="${esc(d.food || '')}" placeholder="Rough list is fine"></label>
      <label class="fl">Feet and body<textarea class="in" rows="2" ${b('body')} placeholder="Hot spots, blisters, aches. Stays private; never shared by the app.">${esc(d.body || '')}</textarea></label>
      <label class="fl">Weather<input class="in" id="dlwx" ${b('weather')} value="${esc(d.weather || '')}" placeholder="Tap one or type"></label>
      <div class="chips wrap">${WX.map(w => `<button class="chip ${d.weather === w ? 'on' : ''}" data-act="dlWx" data-v="${w}">${w}</button>`).join('')}</div>
      <label class="fl">Climb for the day (${OA.unit.dist() === 'km' ? 'm' : 'ft'}, optional)<input class="in" type="number" inputmode="numeric" value="${d.gain ? (OA.unit.dist() === 'km' ? Math.round(d.gain * 0.3048) : d.gain) : ''}" data-onchange="dlGain"></label>
      <label class="fl">One-line highlight<input class="in" ${b('highlight')} value="${esc(d.highlight || '')}" placeholder="The best moment today"></label>
      <div class="xs dim">Saved as you type, on this phone.</div></section>`;
  }

  /* ---------- check-ins view ---------- */
  function ciHTML() {
    const l = L(), s = l.sched, st = schedState(), notif = window.Notification ? Notification.permission : 'unsupported';
    const contacts = l.contacts.map(c => `<div class="li" data-act="ctEdit" data-id="${esc(c.id)}"><div class="ic">${OA.icon('phone')}</div><div class="tx"><b>${esc(c.name)}</b><span>${esc([c.rel, c.phone, c.email].filter(Boolean).join(' · '))}</span></div><div class="end">${c.daily ? '<span class="tag g">check-in</span>' : ''}${c.emergency ? '<span class="tag a">packet</span>' : ''}</div></div>`).join('');
    const hist = l.checkins.slice(0, 5).map(c => `<div class="kv"><span>${esc(OA.ago(c.ts))}</span><b>${c.to && c.to.length ? esc(c.to.join(', ')) : esc(c.via || 'recorded')}</b></div>`).join('');
    return `<section class="card"><div class="ct"><span>${OA.icon('phone')} People</span><button class="mini" data-act="ctEdit" data-id="">Add</button></div>${contacts || '<p class="sm dim">Add the people who should hear from you: name, phone, email, and whether they get the daily check-in. They are stored on this phone only.</p>'}</section>
      <section class="card"><div class="ct"><span>${OA.icon('clock')} Check-in schedule</span></div>
        <label class="chk"><input type="checkbox" ${s.on ? 'checked' : ''} data-bind="log.sched.on" data-type="bool" data-then="schedChanged"> Remind me to check in</label>
        <label class="fl">How often<select class="in" data-bind="log.sched.mode" data-then="schedChanged"><option value="daily" ${s.mode === 'daily' ? 'selected' : ''}>Every day</option><option value="days" ${s.mode === 'days' ? 'selected' : ''}>Every few days</option><option value="town" ${s.mode === 'town' ? 'selected' : ''}>Every town stop</option></select></label>
        <div class="two"><label class="fl">By what time<input class="in" type="time" value="${esc(s.time || '20:00')}" data-bind="log.sched.time" data-then="schedChanged"></label>
        <label class="fl">${s.mode === 'town' ? 'At least every (days)' : 'Every (days)'}<input class="in" type="number" inputmode="numeric" min="1" max="30" value="${esc(s.every || 2)}" data-bind="log.sched.every" data-type="number" data-then="schedChanged"></label></div>
        <label class="fl">Grace hours before someone should act<input class="in" type="number" inputmode="decimal" min="0" max="96" value="${esc(s.grace == null ? 12 : s.grace)}" data-bind="log.sched.grace" data-type="number" data-then="schedChanged"></label>
        <div class="sm" id="schedsum">${schedSum(st)}</div>
        <div class="alert"><b class="t">Honest limits</b>Reminders only show while this app is open. iPhone web apps cannot wake up in the background, and with no signal a text will not go out until you have some. For a reminder that always rings, also add the alarm below to your phone's calendar or clock.</div>
        <button class="btn block" data-act="ciIcs">Save a repeating alarm for my calendar</button>
        <div class="sm dim">Notifications: ${notif === 'granted' ? 'allowed (shown only while the app is open)' : notif === 'denied' ? 'blocked in your browser settings' : notif === 'unsupported' ? 'not available on this phone' : 'not asked yet'}. ${notif === 'default' ? '<button class="lnk" data-act="notifAsk">Allow</button>' : ''}</div></section>
      <section class="card"><div class="ct"><span>${OA.icon('check')} Check in</span></div><p class="sm dim">The "I'm okay" button opens a message with your coordinates, map link, mile marker, time and next planned town. You pick who gets it, and it goes through your own messages app.</p><button class="btn gold block" data-act="ciOkay" data-smoke>I'm okay: check in</button>${hist ? '<h3>Recent</h3>' + hist : ''}</section>
      <section class="card"><div class="ct"><span>${OA.icon('first')} If I'm overdue</span></div><p class="sm dim">A printable page for the person who holds your plan: who you are, route, dates, gear colours, car, contacts, last known position, and who to call.</p><button class="btn block" data-act="pktOpen" data-smoke>Leave-behind packet</button></section>`;
  }
  function schedSum(st) {
    st = st || schedState(); if (!st.on) return '<span class="dim">Off.</span>';
    return esc(schedDesc()) + `<br><span class="dim">Next due ${esc(whenText(st.dl))}. Someone should act after ${esc(whenText(st.graceAt))}.</span>`;
  }

  /* ---------- stats ---------- */
  function statsHTML() {
    const s = stats(); if (s.empty) return `<section class="card"><div class="ct"><span>${OA.icon('mountain')} Stats</span></div><p class="sm dim">Stats appear once you log miles in the Daily log or drop pins with mile markers.</p><button class="btn block" data-act="logView" data-v="day">Open the daily log</button></section>`;
    const last = s.series.slice(-10).reverse(), rows = last.map(x => ({ label: OA.fmtDate(x.k, { weekday: 'short', day: 'numeric' }), v: x.m, note: x.m ? OA.dist(x.m) : 'zero/none' }));
    const sp = OA.chart.spark(s.series.slice(-30).map(x => x.m), 320, 36);
    return `<section class="card"><div class="ct"><span>${OA.icon('mountain')} Stats</span><span class="sm dim">since ${esc(OA.fmtDate(s.start, { month: 'short', day: 'numeric' }))}</span></div>
      <div class="stat"><div><b>${esc(OA.dist(s.total))}</b><span>LOGGED</span></div><div><b>${s.days}</b><span>DAYS</span></div><div><b>${s.zero}</b><span>ZERO DAYS</span></div></div>
      <div class="stat"><div><b>${esc(OA.dist(s.avg))}</b><span>AVG / HIKING DAY</span></div><div><b>${esc(OA.dist(s.longest))}</b><span>LONGEST</span></div><div><b>${s.gain ? esc(OA.ft(s.gain)) : '–'}</b><span>CLIMB (YOUR ENTRIES)</span></div></div>
      <div class="stat"><div><b>${s.photos}</b><span>PHOTOS</span></div><div><b>${s.towns}</b><span>TOWN DAYS</span></div><div><b>${L().entries.length}</b><span>ENTRIES</span></div></div>
      <div class="xs dim">Average counts days you walked, not zero days. Climb adds only what you typed into the daily log.</div></section>
      <section class="card"><div class="ct"><span>Last 10 days</span></div>${OA.chart.bars(rows, { max: Math.max.apply(null, last.map(x => x.m)) || 1 })}${sp ? `<div class="ct" style="margin-top:8px"><span>Last 30 days</span></div>${sp}` : ''}</section>`;
  }

  /* ---------- share view ---------- */
  function shareHTML() {
    const q = queue().length, x = L().exp;
    return `<section class="card"><div class="ct"><span>${OA.icon('share')} Tell people how it's going</span></div><p class="sm dim">There is no server and no live tracking. You decide what leaves this phone and when: through your share sheet, a text, an email, or a web page you publish yourself.</p>
      <button class="btn gold block" data-act="queueOpen">Send entries now${q ? ' (' + q + ' waiting)' : ''}</button>
      <button class="btn block" data-act="ciOkay">I'm okay message</button></section>
      <section class="card"><div class="ct"><span>${OA.icon('book')} Progress page</span></div><p class="sm dim">Saves one web page file (photos inside it) with your journal, a route sketch and stats. Email it, or publish it for loved ones.</p>
        <div class="two"><label class="fl">Include<select class="in" data-bind="log.exp.days"><option value="all" ${x.days === 'all' ? 'selected' : ''}>Everything</option><option value="30" ${x.days === '30' ? 'selected' : ''}>Last 30 days</option><option value="14" ${x.days === '14' ? 'selected' : ''}>Last 14 days</option><option value="7" ${x.days === '7' ? 'selected' : ''}>Last 7 days</option></select></label>
        <label class="fl">Positions shown<select class="in" data-bind="log.exp.coords"><option value="none" ${x.coords === 'none' ? 'selected' : ''}>None (miles only)</option><option value="approx" ${x.coords === 'approx' ? 'selected' : ''}>Approximate (~7 mi)</option><option value="exact" ${x.coords === 'exact' ? 'selected' : ''}>Exact + map links</option></select></label></div>
        <label class="chk"><input type="checkbox" ${x.photos ? 'checked' : ''} data-bind="log.exp.photos" data-type="bool"> Include photos</label>
        <label class="chk"><input type="checkbox" ${x.hold ? 'checked' : ''} data-bind="log.exp.hold" data-type="bool"> Hold back the last 24 hours</label>
        <button class="btn gold block" data-act="expMake" data-smoke>Create progress page</button>
        <div class="xs dim">Anyone with the page can read it. Your private feet and body notes are never included.</div></section>
      <section class="card"><div class="ct"><span>${OA.icon('first')} Leave-behind packet</span></div><p class="sm dim">The "if I'm overdue" page for the person at home.</p><button class="btn block" data-act="pktOpen">Open the packet</button></section>
      <section class="card inner"><div class="sm dim">Sister Occultica apps on the same phone get only totals (miles, pack weight, next town, dates), never your notes, photos or health detail.</div></section>`;
  }

  /* ---------- SOS ---------- */
  function sosText(f) {
    const p = L().packet, m = curMile() != null ? curMile() : (marks().slice(-1)[0] || {}).mile, t = trailNow();
    const gear = [p.tent && 'tent ' + p.tent, p.pack && 'pack ' + p.pack, p.jacket && 'jacket ' + p.jacket].filter(Boolean).join(', ');
    return ['HIKER NEEDS HELP', 'Name: ' + (p.name || '[name]') + '   Phone: ' + (p.phone || '[call-back number]'),
      'Location: ' + (f ? G.fmtCoord(f.lat, f.lon, 'dd') + ' (UTM ' + G.fmtCoord(f.lat, f.lon, 'utm') + ')' + (f.alt != null ? ', elevation ' + Math.round(f.alt * 3.281) + ' ft' : '') + ', GPS fix ' + OA.ago(f.ts || Date.now()) : '[describe where you are: trail, mile, landmarks]') + (t && t.trail ? '. Trail: ' + t.trail : '') + (m != null ? ', mile ' + m : ''),
      'What happened: [what, when]', 'People with me: [number]', 'Injuries: [who, what, conscious?, bleeding?, breathing?]', 'Equipment: ' + (gear || '[tent, jacket colours; food, water, warmth, light, whistle]'),
      'Plan: staying where I am unless it is unsafe. Phone battery: [percent].'].join('\n');
  }
  function sosHTML() {
    const f = G.known();
    const co = f ? ['dd', 'ddm', 'dms', 'utm'].map(m => `<div class="kv"><span>${{ dd: 'Decimal degrees', ddm: 'Degrees, decimal min', dms: 'Deg, min, sec', utm: 'UTM' }[m]}</span><b>${esc(G.fmtCoord(f.lat, f.lon, m))}</b></div>`).join('') + `<div class="xs dim" style="margin-top:6px">Fix taken ${esc(OA.ago(f.ts))}${f.acc ? ', about ' + Math.round(f.acc * 3.28) + ' ft accuracy' : ''}${f.alt != null ? ', elevation ' + esc(OA.ft(f.alt * 3.28084)) + ' (GPS, rough)' : ''}. Say which format you are reading out.</div>` : '<div class="sm warn">No position yet. Tap "Get a fresh fix" in the open with a clear view of the sky.</div>';
    return `<div class="alert danger" style="margin-top:0"><b class="t">Emergency? Call 911.</b>If you have any signal, call. If a call will not connect, try a text: texts need less signal, but text-to-911 is not available everywhere, so call if you can. Give the coordinates below.</div>
      <div class="row"><a class="btn danger" href="tel:911" style="flex:1">Call 911</a><a class="btn danger" href="sms:911" style="flex:1">Text 911</a></div>
      <section class="card inner"><div class="ct"><span>${OA.icon('pin')} My position</span></div>${co}<button class="btn block" data-act="sosFix">Get a fresh fix</button></section>
      <section class="card inner"><div class="ct"><span>Message for search and rescue</span></div><div class="sm dim">Fill in the brackets, then read it out, copy it or send it. Short is fine.</div><textarea class="in" rows="11" id="sostext">${esc(sosText(f))}</textarea>
        <div class="row"><button class="btn" data-act="sosCopy">Copy</button><button class="btn" data-act="sosShare">Share…</button></div></section>
      <div class="alert"><b class="t">No signal?</b>Newer iPhones and some Android phones can message emergency services by satellite in the open. A satellite messenger (inReach, ZOLEO, SPOT and similar) is more reliable and can send a check-in with no phone signal. If you carry one, use it, and test it before the trip.</div>
      <button class="btn block" data-go="survive">Open Survive: first aid and what to do next</button>
      <button class="btn block" data-act="sosLog">Log this as a trouble entry</button>`;
  }

  /* ---------- leave-behind packet ---------- */
  function packetSections() {
    const l = L(), p = l.packet, st = schedState(), t = trailNow(), S = [];
    const last = sorted().filter(e => e.lat != null).pop(), plan = (bpx('plan', 'summaryText') || '').toString().trim();
    const trail = p.trail || (t && t.trail) || '';
    S.push({ h: 'Who I am', lines: [p.name ? 'Name: ' + p.name : 'Name: (not filled in)', p.phone ? 'My phone: ' + p.phone + ' (often no signal)' : '', p.party ? 'People in my group: ' + p.party : ''] });
    S.push({ h: 'My trip', lines: [trail ? 'Trail / route: ' + trail : '', p.trailhead ? 'Start trailhead: ' + p.trailhead : '', (p.start || p.end) ? 'Dates: ' + (p.start ? OA.fmtDate(p.start, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '?') + ' to ' + (p.end ? OA.fmtDate(p.end, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '?') : '', plan ? 'Plan (from my Backpackica plan):\n' + plan : '', p.itinerary ? 'Itinerary notes:\n' + p.itinerary : '', p.towns ? 'Resupply towns and dates:\n' + p.towns : '', nextTownText() ? 'Next planned town: ' + nextTownText() : ''] });
    S.push({ h: 'What I look like and carry', lines: [p.tent ? 'Tent: ' + p.tent : '', p.pack ? 'Pack: ' + p.pack : '', p.jacket ? 'Jacket: ' + p.jacket : '', p.gearNote ? p.gearNote : ''] });
    S.push({ h: 'My vehicle', lines: [p.vehicle ? 'Vehicle: ' + p.vehicle : '', p.plate ? 'Plate: ' + p.plate : '', p.parked ? 'Parked at: ' + p.parked : ''] });
    const cons = l.contacts.filter(c => c.emergency), use = cons.length ? cons : l.contacts;
    S.push({ h: 'Emergency contacts', lines: use.length ? use.map(c => c.name + (c.rel ? ' (' + c.rel + ')' : '') + (c.phone ? ', ' + c.phone : '') + (c.email ? ', ' + c.email : '')) : ['(none added yet)'] });
    if (p.includeMedical && p.medical && p.medical.trim()) S.push({ h: 'Medical notes I chose to share', lines: [p.medical.trim()] });
    S.push({ h: 'My check-in plan', lines: [schedDesc(), l.lastCheckin ? 'My last check-in: ' + new Date(l.lastCheckin).toLocaleString() : 'No check-in recorded yet.', st.on ? 'The next one is due: ' + new Date(st.dl).toLocaleString() + '. If you have heard nothing by ' + new Date(st.graceAt).toLocaleString() + ', please act as below.' : ''] });
    S.push({ h: 'Last known position', lines: last ? [G.fmtCoord(last.lat, last.lon, 'dd') + '  (UTM ' + G.fmtCoord(last.lat, last.lon, 'utm') + ')', 'Logged ' + new Date(last.ts).toLocaleString() + (last.mile != null ? ', mile ' + last.mile : ''), G.mapLinks(last.lat, last.lon).google] : ['No position has been logged yet.'] });
    if (p.extra) S.push({ h: 'Other things to know', lines: [p.extra] });
    S.push({ h: 'What to do', lines: ['EMERGENCY (someone is hurt or in danger): call 911.', 'If I am overdue and there is no obvious emergency: first try to reach me and the people I am with. If I have not checked in after my grace time, contact the sheriff\'s office for the county where I was last known to be, and the land manager (park, forest or ranger district). In much of the US the county sheriff is responsible for search and rescue, but who leads varies by place: tell them this is an overdue hiker, share this page, and follow their instructions.', 'Do not wait long if the weather is bad or I have a medical condition. Calling early is better than calling late.'] });
    return S;
  }
  const secText = S => 'IF I AM OVERDUE\nLeave-behind information' + (L().packet.name ? ' for ' + L().packet.name : '') + '\nPrepared ' + new Date().toLocaleString() + ' (Backpackica)\n\n' + S.map(s => s.h.toUpperCase() + '\n' + s.lines.filter(Boolean).join('\n')).join('\n\n');
  const secHtml = S => S.map(s => `<h3>${esc(s.h)}</h3>${s.lines.filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('')}`).join('');
  function packetDoc(S) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>If I am overdue</title><style>body{font:15px/1.45 Georgia,serif;color:#111;background:#fff;max-width:720px;margin:0 auto;padding:18px}h1{font-size:1.5rem;margin:0 0 2px}h3{font-size:1rem;border-bottom:1px solid #888;margin:18px 0 4px;text-transform:uppercase;letter-spacing:.04em}p{margin:4px 0;white-space:pre-wrap}.m{color:#555;font-size:.85rem}</style></head><body><h1>If I am overdue</h1><div class="m">Leave-behind information${L().packet.name ? ' for ' + esc(L().packet.name) : ''}. Prepared ${esc(new Date().toLocaleString())} with Backpackica.</div>${secHtml(S)}</body></html>`; }
  function packetFormHTML() {
    const p = L().packet, f = (k, lab, ph, type) => `<label class="fl">${lab}<input class="in" ${type ? 'type="' + type + '"' : ''} data-bind="log.packet.${k}" data-then="pktChanged" value="${esc(p[k] || '')}" placeholder="${esc(ph || '')}"></label>`;
    const ta = (k, lab, ph, rows) => `<label class="fl">${lab}<textarea class="in" rows="${rows || 3}" data-bind="log.packet.${k}" data-then="pktChanged" placeholder="${esc(ph || '')}">${esc(p[k] || '')}</textarea></label>`;
    const plan = (bpx('plan', 'summaryText') || '').toString().trim();
    return `<p class="sm dim">Fill in what you want your people to have. Nothing is filled in for you from health data. Copy it, print it, or email it before you leave, and update it if plans change.</p>
      <div class="two">${f('name', 'Your name', 'Full name')}${f('phone', 'Your phone', '')}</div>${f('party', 'People in your group', 'e.g. 2 (names)')}
      ${f('trail', 'Trail or route', (trailNow() && trailNow().trail) || 'e.g. Pacific Crest Trail section')}${f('trailhead', 'Start trailhead', '')}
      <div class="two">${f('start', 'Start date', '', 'date')}${f('end', 'Planned finish', '', 'date')}</div>
      ${plan ? '<div class="sm dim">Your Plan tab summary is included automatically.</div>' : ''}${ta('itinerary', 'Itinerary notes', 'Day-by-day camps, side trips, alternates')}${ta('towns', 'Resupply towns and dates', 'Town, planned date, post office or hotel')}
      <div class="three">${f('tent', 'Tent colour', '')}${f('pack', 'Pack colour', '')}${f('jacket', 'Jacket colour', '')}</div>${f('gearNote', 'Other gear to recognise', 'Hat, trekking poles…')}
      ${f('vehicle', 'Vehicle make and model', '')}<div class="two">${f('plate', 'Plate', '')}${f('parked', 'Parked at', 'Lot or trailhead')}</div>
      <label class="chk"><input type="checkbox" ${p.includeMedical ? 'checked' : ''} data-bind="log.packet.includeMedical" data-type="bool" data-then="pktChanged"> Include medical notes</label>
      ${ta('medical', 'Medical notes (optional, only included if ticked)', 'Allergies, conditions, medications you want known', 2)}${ta('extra', 'Anything else', '', 2)}`;
  }
  function packetSheetHTML() {
    const cs = L().contacts.filter(c => c.email).slice(0, 4);
    return packetFormHTML() + `<h3>Preview</h3><div class="card inner" id="pktprev" style="font-size:.88rem">${secHtml(packetSections())}</div>
      <div class="row wrap"><button class="btn gold" data-act="pktCopy">Copy</button><button class="btn gold" data-act="pktShare">Share…</button></div>
      <div class="row wrap"><button class="btn" data-act="pktPrint">Print</button><button class="btn" data-act="pktSave">Save as file</button></div>
      ${cs.length ? cs.map(c => `<button class="btn block" data-act="pktMail" data-id="${esc(c.id)}">Email to ${esc(c.name)}</button>`).join('') : '<button class="btn block" data-act="pktMail" data-id="">Email it…</button>'}
      <div class="xs dim">Some email apps cut very long messages: if so, use "Save as file" and attach it.</div>`;
  }

  /* ---------- progress page export ---------- */
  async function jpegData(blob, max, q) {
    const bmp = await createImageBitmap(blob), s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
  }
  function sketchSVG(list) {
    const pts = list.filter(e => e.lat != null); if (pts.length < 2) return '';
    const lat0 = pts.reduce((a, e) => a + e.lat, 0) / pts.length, k = Math.cos(lat0 * Math.PI / 180);
    const xs = pts.map(e => e.lon * k), ys = pts.map(e => -e.lat), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), W = 320, H = 200, P = 14, sc = Math.min((W - 2 * P) / ((x1 - x0) || 1e-6), (H - 2 * P) / ((y1 - y0) || 1e-6));
    const X = i => (P + (xs[i] - x0) * sc + ((W - 2 * P) - (x1 - x0) * sc) / 2).toFixed(1), Y = i => (P + (ys[i] - y0) * sc + ((H - 2 * P) - (y1 - y0) * sc) / 2).toFixed(1);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Route sketch from the drops (not to scale, no map)"><rect width="${W}" height="${H}" rx="10" fill="none" stroke="#8886"/><polyline points="${pts.map((e, i) => X(i) + ',' + Y(i)).join(' ')}" fill="none" stroke="#c9a24a" stroke-width="2" stroke-linejoin="round"/>${pts.map((e, i) => `<circle cx="${X(i)}" cy="${Y(i)}" r="${i === pts.length - 1 ? 5 : 3}" fill="${i === pts.length - 1 ? '#c4574a' : '#c9a24a'}"/>`).join('')}</svg><div class="m">Route sketch from the pins, north up, not to scale. Red dot: latest.</div>`;
  }
  async function buildJournal(o, onProg) {
    const l = L(), st = stats(), p = l.packet; let list = sorted();
    const now = Date.now();
    if (o.days !== 'all') { const cut = now - (+o.days) * 86400000; list = list.filter(e => e.ts >= cut); }
    if (o.hold) list = list.filter(e => e.ts < now - 86400000);
    const imgs = {};
    if (o.photos) { let i = 0; for (const e of list) { if (!e.photoId) continue; onProg && onProg(++i); try { const r = await OA.photo.get(e.photoId); if (r && r.blob) imgs[e.id] = await jpegData(r.blob, 900, 0.68); } catch (x) { } } }
    const pos = e => { if (e.lat == null || o.coords === 'none') return ''; if (o.coords === 'approx') return `<div class="m">Near ${e.lat.toFixed(1)}, ${e.lon.toFixed(1)}</div>`; return `<div class="m">${esc(G.fmtCoord(e.lat, e.lon, 'dd'))} · <a href="${esc(G.mapLinks(e.lat, e.lon).google)}">map</a></div>`; };
    const groups = []; list.forEach(e => { const k = dayOf(e), g = groups[groups.length - 1]; if (g && g.k === k) g.l.push(e); else groups.push({ k, l: [e] }); });
    const body = groups.reverse().map(g => {
      const d = l.daily[g.k] || {}, n = st.start ? OA.daysBetween(st.start, g.k) + 1 : '', mi = dayMiles(g.k);
      const meta = [d.zero ? 'Zero day' : mi ? OA.dist(mi) : '', d.weather, d.camp && o.coords !== 'none' ? 'camp: ' + d.camp : d.camp ? 'camp: ' + d.camp : ''].filter(Boolean).join(' · ');
      return `<section><h2>${n ? 'Day ' + n + ' · ' : ''}${esc(OA.fmtDate(g.k, { weekday: 'long', month: 'long', day: 'numeric' }))}</h2>${meta ? `<div class="m">${esc(meta)}</div>` : ''}${d.highlight ? `<p class="hl">${esc(d.highlight)}</p>` : ''}` +
        g.l.slice().reverse().map(e => `<article><div class="m">${esc(OA.fmtTime(e.ts))} · ${esc(kindLabel(e.kind))}${e.mile != null ? ' · mile ' + esc(e.mile) : ''}${e.mood ? ' · ' + esc(e.mood) : ''}</div>${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}${imgs[e.id] ? `<img src="${imgs[e.id]}" alt="Photo from ${esc(OA.fmtTime(e.ts))}">` : ''}${pos(e)}</article>`).join('') + '</section>';
    }).join('');
    const lastE = list[list.length - 1];
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc((p.name ? p.name + ': ' : '') + 'Trail journal')}</title><style>:root{color-scheme:light dark;--bg:#fbf8ef;--tx:#1d2418;--dim:#667060;--ac:#8a6a1c;--ln:#d8d2bc}@media(prefers-color-scheme:dark){:root{--bg:#10170f;--tx:#efe9cf;--dim:#a3b59a;--ac:#e0b861;--ln:#3b4d35}}body{margin:0;background:var(--bg);color:var(--tx);font:17px/1.5 Georgia,serif}main{max-width:640px;margin:0 auto;padding:20px 16px 50px}h1{color:var(--ac);margin:.2em 0}h2{color:var(--ac);font-size:1.15rem;border-bottom:1px solid var(--ln);padding-bottom:3px;margin-top:28px}.m{color:var(--dim);font-size:.85rem}.hl{font-style:italic}article{margin:12px 0;padding-left:10px;border-left:3px solid var(--ln)}article img{width:100%;height:auto;border-radius:10px;margin-top:6px}.st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.st div{border:1px solid var(--ln);border-radius:10px;padding:8px;text-align:center}.st b{display:block;font-size:1.2rem;color:var(--ac)}svg{width:100%;height:auto;max-width:420px}a{color:var(--ac)}</style></head><body><main><h1>${esc((p.name ? p.name + ': ' : '') + 'Trail journal')}</h1><div class="m">${esc((p.trail || (trailNow() && trailNow().trail) || ''))}${lastE ? ' · latest entry ' + esc(new Date(lastE.ts).toLocaleString()) : ''}. Saved ${esc(new Date().toLocaleString())}. This page is a snapshot sent by hand, not live tracking.</div>
      <div class="st"><div><b>${esc(OA.dist(st.total))}</b>logged</div><div><b>${st.days}</b>days</div><div><b>${st.zero}</b>zero days</div><div><b>${esc(OA.dist(st.avg))}</b>avg per hiking day</div><div><b>${st.towns}</b>town days</div><div><b>${st.photos}</b>photos</div></div>${sketchSVG(list)}${body || '<p>No entries in this period.</p>'}<p class="m" style="margin-top:30px">Made with Backpackica, an Occultica app by 3lite Studios. Private notes are never included.</p></main></body></html>`;
  }

  /* ---------- actions ---------- */
  function afterEdit() { OA.closeAllSheets(); OA.render(true); }
  OA.act({
    logView(el) { L().view = el.dataset.v; OA.save(); OA.render(true); window.scrollTo(0, 0); },
    tlMore() { tlDays += 7; OA.render(true); },
    /* drop */
    dropOpen() { openDrop('drop'); },
    noteOpen() { openDrop('note'); },
    dropFix() { return dropFix(); },
    dropKind(el) { const d = readDraftFields(); if (!d) return; d.kind = el.dataset.v; OA.save(); OA.$$('#dkinds .chip').forEach(c => c.classList.toggle('on', c === el)); },
    dropChip(el) { const d = readDraftFields(); if (!d) return; const k = el.dataset.k, v = el.dataset.v; d[k] = d[k] === v ? '' : v; OA.save(); OA.$$('.chip[data-k="' + k + '"]').forEach(c => c.classList.toggle('on', d[k] === c.dataset.v)); },
    async dropPhoto() {
      const d = readDraftFields(); if (!d) return; const rec = await OA.photo.pick({ tag: 'log', note: d.text });
      if (!rec) return; const dd = L().draft; if (!dd) return;
      if (dd.photoId) { try { await OA.photo.del(dd.photoId); } catch (e) { } }
      dd.photoId = rec.id; if (dd.lat == null && rec.lat != null) { dd.lat = rec.lat; dd.lon = rec.lon; dd.fixTs = rec.ts; } OA.save();
      OA.redrawSheet(dropHTML(dd)); fillImgs(OA.sheetBody());
    },
    async dropNoPhoto() { const d = readDraftFields(); if (!d || !d.photoId) return; try { await OA.photo.del(d.photoId); } catch (e) { } d.photoId = null; OA.save(); OA.redrawSheet(dropHTML(d)); },
    dropSave() {
      const d = readDraftFields(); if (!d) return;
      if (d.kind === 'note' && !d.text.trim() && !d.photoId) return OA.toast('Write a line or add a photo first.');
      const e = addEntry(d); L().draft = null; OA.save(); OA.closeAllSheets(); OA.render(true);
      OA.toast((e.lat == null ? 'Saved without a GPS position. ' : 'Saved. ') + queue().length + ' waiting to send.', 3500);
    },
    async dropDiscard() { const d = L().draft; if (d && (d.text || d.photoId) && !await OA.confirm('Throw away this draft?', 'Discard')) return; if (d && d.photoId) { try { await OA.photo.del(d.photoId); } catch (e) { } } L().draft = null; OA.save(); OA.closeAllSheets(); OA.render(true); },
    /* entries */
    entOpen(el) { const e = findEnt(el.dataset.id); if (!e) return; OA.sheet(kindLabel(e.kind), detailHTML(e), { onOpen: fillImgs }); },
    async entShare(el) { const e = findEnt(el.dataset.id); if (!e) return; const ok = await sendEntries([e], 'Trail update', 'Trail update' + (L().packet.name ? ' from ' + L().packet.name : '') + '\n\n' + entText(e, true)); if (ok) { OA.toast('Marked as sent.'); OA.redrawSheet(detailHTML(e)); fillImgs(OA.sheetBody()); } },
    entEdit(el) {
      const e = findEnt(el.dataset.id); if (!e) return;
      OA.sheet('Edit entry', `<label class="fl">Type<select class="in" id="edkind">${KINDS.map(k => `<option value="${k[0]}" ${e.kind === k[0] ? 'selected' : ''}>${k[1]}</option>`).join('')}</select></label>
        <label class="fl">Note<textarea class="in" rows="4" id="edtext">${esc(e.text)}</textarea></label>
        <label class="fl">Trail mile marker<input class="in" type="number" step="0.1" inputmode="decimal" id="edmile" value="${e.mile == null ? '' : esc(e.mile)}"></label>
        <button class="btn gold block" data-act="entEditSave" data-id="${esc(e.id)}">Save changes</button>`);
    },
    entEditSave(el) {
      const e = findEnt(el.dataset.id); if (!e) return; const v = parseFloat(OA.$('#edmile').value);
      e.kind = OA.$('#edkind').value; e.text = OA.$('#edtext').value.trim(); e.mile = isNaN(v) ? null : v; e.miles = dayMiles(dayOf(e)); OA.save(); changed(); afterEdit(); OA.toast('Saved.');
    },
    async entDel(el) {
      const e = findEnt(el.dataset.id); if (!e || !await OA.confirm('Delete this entry' + (e.photoId ? ' and its photo' : '') + '? This cannot be undone.', 'Delete')) return;
      if (e.photoId) { try { await OA.photo.del(e.photoId); } catch (x) { } }
      L().entries = L().entries.filter(x => x.id !== e.id); OA.save(); changed(); afterEdit(); OA.toast('Deleted.');
    },
    /* queue */
    queueOpen() { if (!queue().length) return OA.toast('Nothing is waiting. Every entry has been sent.'); OA.sheet('Send now', queueHTML(), { onOpen() { acts.qRefresh(); } }); },
    qRefresh() { const t = OA.$('#qtext'); if (!t) return; const s = qSelected(); t.value = s.length ? queueText(s) : ''; },
    async qSend() { const s = qSelected(); if (!s.length) return OA.toast('Tick at least one entry.'); const ok = await sendEntries(s, 'Trail update', OA.$('#qtext').value); if (ok) { OA.closeAllSheets(); OA.render(true); OA.toast('Marked as sent.'); } },
    qSms(el) { const c = L().contacts.find(x => x.id === el.dataset.id), s = qSelected(); if (!c || !s.length) return OA.toast('Tick at least one entry.'); const txt = OA.$('#qtext').value; s.forEach(e => { e.share = { at: Date.now(), via: 'sms ' + c.name }; }); OA.save(); location.href = OA.share.sms(phoneClean(c.phone), txt); },
    async qCopy() { try { await navigator.clipboard.writeText(OA.$('#qtext').value); OA.toast('Copied. Paste it into a message.'); } catch (e) { OA.toast('Could not copy. Select the text and copy it.'); } },
    async qMark() { const s = qSelected(); if (!s.length) return OA.toast('Tick at least one entry.'); if (!await OA.confirm('Mark ' + s.length + ' entries as sent?', 'Mark sent')) return; s.forEach(e => { e.share = { at: Date.now(), via: 'marked' }; }); OA.save(); OA.closeAllSheets(); OA.render(true); },
    /* daily */
    dlDate(el) { if (el.value) { dayKey = el.value; OA.render(true); } },
    dlShift(el) { const k = OA.addDays(dayKey, +el.dataset.n); if (k > OA.dkey()) return; dayKey = k; OA.render(true); },
    dlMiles(el) { const v = parseFloat(el.value), d = L().daily[dayKey] = L().daily[dayKey] || {}; d.miles = isNaN(v) ? null : OA.round(toMi(v), 2); if (!L().started || dayKey < L().started) L().started = dayKey; OA.save(); const t = OA.$('#dltot'); if (t) t.innerHTML = totalsHTML(); changed(); },
    dlGain(el) { const v = parseFloat(el.value), d = L().daily[dayKey] = L().daily[dayKey] || {}; d.gain = isNaN(v) ? 0 : Math.round(OA.unit.dist() === 'km' ? v / 0.3048 : v); OA.save(); changed(); },
    dlUseAuto() { const a = derivedMiles(dayKey); if (a == null) return; const d = L().daily[dayKey] = L().daily[dayKey] || {}; d.miles = a; OA.save(); changed(); OA.render(true); },
    dlChanged() { const t = OA.$('#dltot'); if (t) t.innerHTML = totalsHTML(); if (!L().started || dayKey < L().started) L().started = dayKey; OA.saveSoon(); changed(); },
    dlWx(el) { const d = L().daily[dayKey] = L().daily[dayKey] || {}; d.weather = d.weather === el.dataset.v ? '' : el.dataset.v; OA.save(); const i = OA.$('#dlwx'); if (i) i.value = d.weather; OA.$$('.chip[data-act="dlWx"]').forEach(c => c.classList.toggle('on', c.dataset.v === d.weather)); },
    dlCampFill() { const e = sorted().filter(x => dayOf(x) === dayKey && x.lat != null).pop(); if (!e) return; const d = L().daily[dayKey] = L().daily[dayKey] || {}; d.camp = (e.mile != null ? 'Mile ' + e.mile + ', ' : '') + G.fmtCoord(e.lat, e.lon, 'dd'); OA.save(); const i = OA.$('#dlcamp'); if (i) i.value = d.camp; },
    /* contacts + schedule */
    ctEdit(el) {
      const c = L().contacts.find(x => x.id === el.dataset.id) || { id: '', name: '', phone: '', email: '', rel: '', daily: true, emergency: true };
      OA.sheet(c.id ? 'Edit person' : 'Add person', `<label class="fl">Name<input class="in" id="ctname" value="${esc(c.name)}"></label><label class="fl">Phone<input class="in" id="ctphone" type="tel" value="${esc(c.phone)}"></label><label class="fl">Email<input class="in" id="ctmail" type="email" value="${esc(c.email)}"></label><label class="fl">Relationship<input class="in" id="ctrel" value="${esc(c.rel)}" placeholder="Spouse, sister, friend…"></label>
        <label class="chk"><input type="checkbox" id="ctdaily" ${c.daily ? 'checked' : ''}> Gets my daily check-in</label><label class="chk"><input type="checkbox" id="ctem" ${c.emergency ? 'checked' : ''}> Listed in my overdue packet as an emergency contact</label>
        <button class="btn gold block" data-act="ctSave" data-id="${esc(c.id)}">Save</button>${c.id ? `<button class="btn danger block" data-act="ctDel" data-id="${esc(c.id)}">Remove</button>` : ''}`);
    },
    ctSave(el) {
      const name = OA.$('#ctname').value.trim(); if (!name) return OA.toast('Add a name.');
      let c = L().contacts.find(x => x.id === el.dataset.id); if (!c) { c = { id: OA.uid() }; L().contacts.push(c); }
      Object.assign(c, { name, phone: OA.$('#ctphone').value.trim(), email: OA.$('#ctmail').value.trim(), rel: OA.$('#ctrel').value.trim(), daily: OA.$('#ctdaily').checked, emergency: OA.$('#ctem').checked }); OA.save(); afterEdit();
    },
    async ctDel(el) { if (!await OA.confirm('Remove this person from your contacts?', 'Remove')) return; L().contacts = L().contacts.filter(x => x.id !== el.dataset.id); OA.save(); afterEdit(); },
    schedChanged(el) {
      const s = L().sched; if (s.on && !s.armedAt) s.armedAt = Date.now(); if (!s.on) s.armedAt = null; if (s.on && !s.armedAt) s.armedAt = Date.now();
      OA.saveSoon(); lastKey = ''; const o = OA.$('#schedsum'); if (o) o.innerHTML = schedSum();
      if (el && /sched\.(on|mode)$/.test(el.dataset.bind || '')) OA.render(true);
    },
    async notifAsk() { try { const r = await Notification.requestPermission(); OA.toast(r === 'granted' ? 'Allowed. It only works while the app is open.' : 'Not allowed. The in-app banner still works.'); } catch (e) { OA.toast('Not available on this phone.'); } OA.render(true); },
    ciIcs() {
      const s = L().sched, n = s.mode === 'days' ? Math.max(1, +s.every || 2) : 1, p = String(s.time || '20:00').split(':'), d = new Date(); d.setHours(+p[0] || 20, +p[1] || 0, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      const z = x => String(x).padStart(2, '0'), ts = d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' + z(d.getHours()) + z(d.getMinutes()) + '00', stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occultica//Backpackica//EN', 'BEGIN:VEVENT', 'UID:bp-checkin-' + OA.uid() + '@occultica', 'DTSTAMP:' + stamp, 'DTSTART:' + ts, 'DURATION:PT15M', 'RRULE:FREQ=DAILY;INTERVAL=' + n, 'SUMMARY:Backpackica: send my trail check-in', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Send my trail check-in', 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      OA.download('backpackica-checkin-alarm.ics', 'text/calendar', ics); OA.toast('Saved. Open the file to add a repeating alarm to your calendar.', 4500);
    },
    /* I'm okay */
    async ciOkay() {
      const cs = L().contacts, sel = cs.filter(c => c.daily), f0 = G.known(); let rec = null, dirty = false, fix = f0;
      OA.sheet("I'm okay", `${sheetSOSLink()}<p class="sm dim">This opens your own messages app with the text below. Edit it first if you like. Nothing is sent until you press send there.</p>
        <div class="sm" id="okfix">${f0 ? 'Using your last position (' + esc(OA.ago(f0.ts)) + '). Looking for a fresh one…' : 'Looking for your position…'}</div>
        <textarea class="in" rows="8" id="oktext">${esc(okMessage(f0))}</textarea>
        ${cs.length ? `<div class="ct" style="margin-top:6px"><span>Send to</span></div>` + cs.map(c => `<div class="li" style="cursor:default"><label class="chk" style="flex:1"><input type="checkbox" class="okc" data-id="${esc(c.id)}" ${c.daily ? 'checked' : ''}> <span>${esc(c.name)}<span class="dim sm"> ${esc(c.phone || c.email || 'no number')}</span></span></label></div>`).join('') : '<p class="sm warn">No people added yet. You can still share the message, or add people in Check-ins.</p>'}
        <button class="btn gold block" data-act="okSms">Text the ticked people</button>
        <div class="row wrap"><button class="btn" data-act="okMail">Email them</button><button class="btn" data-act="okShare">Share…</button></div>
        <button class="btn block" data-act="okRecord">I told them another way: just record it</button>`, { onOpen(root) { const ta = OA.$('#oktext', root); if (ta) ta.addEventListener('input', () => { dirty = true; }); okState.fix = fix; okState.rec = null; (async () => { const f = await grabFix(8000); fix = f; okState.fix = f; const o = OA.$('#okfix'); if (f && f !== f0 && ta && !dirty) { ta.value = okMessage(f); } if (o) o.textContent = f ? 'Position from ' + OA.ago(f.ts) + (f.acc ? ', about ' + Math.round(f.acc * 3.28) + ' ft accuracy' : '') + '.' : 'No GPS fix. The message goes without a position.'; })(); } });
    },
    okSms() {
      const picks = OA.$$('.okc').filter(c => c.checked).map(c => L().contacts.find(x => x.id === c.dataset.id)).filter(Boolean), ph = picks.map(c => phoneClean(c.phone)).filter(Boolean);
      if (!picks.length) return OA.toast('Tick who to text.'); if (!ph.length) return OA.toast('The people you ticked have no phone number.');
      okRecord(picks.map(c => c.name), 'sms'); location.href = OA.share.sms(ph.join(','), OA.$('#oktext').value);
    },
    okMail() {
      const picks = OA.$$('.okc').filter(c => c.checked).map(c => L().contacts.find(x => x.id === c.dataset.id)).filter(Boolean), em = picks.map(c => c.email).filter(Boolean);
      if (!em.length) return OA.toast('The people you ticked have no email.'); okRecord(picks.map(c => c.name), 'email'); location.href = OA.share.mail(em.join(','), 'I am okay (trail check-in)', OA.$('#oktext').value);
    },
    async okShare() { const ok = await OA.share.send({ title: 'I am okay', text: OA.$('#oktext').value }); if (ok) okRecord([], 'share sheet'); },
    okRecord() { okRecord([], 'recorded by hand'); OA.closeAllSheets(); OA.render(true); OA.toast('Check-in recorded.'); },
    /* SOS */
    sosOpen() { OA.sheet('SOS / trouble', sosHTML()); },
    async sosFix(el) { el.disabled = true; try { await G.position({ timeout: 10000, maximumAge: 0 }); } catch (e) { OA.toast(e.message, 4000); } OA.redrawSheet(sosHTML()); },
    async sosCopy() { try { await navigator.clipboard.writeText(OA.$('#sostext').value); OA.toast('Copied.'); } catch (e) { OA.toast('Select the text and copy it.'); } },
    sosShare() { OA.share.send({ title: 'Need help', text: OA.$('#sostext').value }); },
    sosLog() { const f = G.known(), d = newDraft('trouble'); if (f) { d.lat = f.lat; d.lon = f.lon; d.alt = f.alt; d.acc = f.acc; } d.text = 'Trouble logged.'; addEntry(d); OA.toast('Logged. Your position is saved with the time.'); },
    /* packet */
    pktOpen() { OA.sheet('Leave-behind packet', packetSheetHTML()); },
    pktChanged() { const o = OA.$('#pktprev'); if (o) o.innerHTML = secHtml(packetSections()); },
    async pktCopy() { try { await navigator.clipboard.writeText(secText(packetSections())); OA.toast('Copied.'); } catch (e) { OA.toast('Could not copy. Use Share or Save as file.'); } },
    pktShare() { OA.share.send({ title: 'If I am overdue', text: secText(packetSections()) }); },
    pktSave() { OA.download('if-i-am-overdue-' + OA.dkey() + '.html', 'text/html', packetDoc(packetSections())); OA.toast('Saved. Open it to print or attach it to an email.'); },
    pktPrint() {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
      const d = f.contentWindow.document; d.open(); d.write(packetDoc(packetSections())); d.close();
      setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { OA.toast('Printing is not available here. Use Save as file.'); } setTimeout(() => f.remove(), 60000); }, 300);
    },
    pktMail(el) { const c = L().contacts.find(x => x.id === el.dataset.id); location.href = OA.share.mail(c ? c.email : '', 'If I am overdue: my trip details', secText(packetSections())); },
    /* progress page */
    async expMake(el) {
      const x = L().exp, n = L().entries.filter(e => e.photoId).length; el.disabled = true; const old = el.textContent;
      try {
        if (!L().entries.length) { OA.toast('Nothing to export yet. Drop a pin or write a note first.'); return; }
        const html = await buildJournal(x, i => { el.textContent = 'Preparing photo ' + i + ' of ' + n + '…'; });
        const mb = html.length / 1048576;
        if (mb > 8 && !await OA.confirm('This page is about ' + OA.round(mb, 1) + ' MB. Many email apps and hosts struggle above 8 MB. Save it anyway? (You can go back and choose fewer days or skip photos.)', 'Save anyway')) return;
        OA.download('backpackica-journal-' + OA.dkey() + '.html', 'text/html', html);
        OA.sheet('Progress page saved', `<div class="alert ok" style="margin-top:0"><b class="t">${OA.round(mb, 2)} MB saved</b>It is one self-contained file: open it in any browser, no signal needed.</div><h3>Getting it to loved ones</h3><ol class="ls"><li><b>Email or message it</b> as an attachment (best under about 8 MB).</li><li><b>Publish it:</b> put the file in a folder, rename it <b>index.html</b>, and drag the folder onto a free static host such as Netlify Drop. You get a link to text to people. You need signal for that step.</li><li>Run it again later and publish again to update. Each page is a snapshot.</li></ol><div class="sm dim">Anyone who has the link can read the page. ${x.coords === 'exact' ? '<b class="warn">You chose exact positions: only share the link with people you trust.</b>' : ''}</div><button class="btn block" data-act="closeSheet">Done</button>`);
      } catch (e) { OA.toast('Could not build the page: ' + e.message, 5000); } finally { el.disabled = false; el.textContent = old; }
    }
  });
  const acts = OA.acts, okState = { fix: null, rec: null };
  function okRecord(names, via) {
    if (okState.rec && Date.now() - okState.rec < 20 * 60000) { const c = L().checkins[0]; if (c && names.length) c.to = Array.from(new Set((c.to || []).concat(names))); OA.save(); return; }
    okState.rec = Date.now(); recordCheckin(names, okState.fix, via);
  }

  /* ---------- Today card ---------- */
  BP.todayCards.push({
    order: 15,
    render() {
      const st = schedState(); let top = '';
      if (st.state === 'overdue' || st.state === 'due') top = bannerHTML();
      else if (st.on) top = `<div class="sm dim" style="margin-bottom:6px">Next check-in ${esc(whenText(st.dl))}${L().lastCheckin ? ' · last ' + esc(OA.ago(L().lastCheckin)) : ''}</div>`;
      return `<section class="card ${st.state === 'overdue' ? 'hot' : ''}"><div class="ct"><span>${OA.icon('camera')} Trail log</span><button class="lnk" data-go="log">Open</button></div>${st.state === 'overdue' || st.state === 'due' ? '' : top}<div class="row"><button class="btn gold" data-act="ciOkay">I'm okay</button><button class="btn" data-act="dropOpen">${OA.icon('pin', 'sm')} Drop a pin</button></div></section>${st.state === 'overdue' || st.state === 'due' ? top : ''}`;
    }
  });

  /* ---------- public API ---------- */
  BP.log = {
    entries: () => sorted(), lastDrop: () => sorted().filter(e => e.lat != null).pop() || null, stats, dayMiles, milesToday: () => dayMiles(OA.dkey()), milesTotal: () => stats().total,
    checkinState: schedState, dayNumber: () => { const s = stats(); return s.empty ? 0 : OA.daysBetween(s.start, OA.dkey()) + 1; },
    summary: () => { const s = stats(); return { total: s.total, days: s.days, zero: s.zero, today: dayMiles(OA.dkey()), photos: s.photos }; },
    _testAdd(e) { e = Object.assign({ kind: 'drop', text: '', share: {} }, e || {}); const l = L(); const x = { id: e.id || OA.uid(), ts: e.ts || Date.now(), lat: e.lat != null ? e.lat : null, lon: e.lon != null ? e.lon : null, alt: e.alt != null ? e.alt : null, acc: e.acc || null, mile: e.mile != null ? e.mile : null, text: e.text, photoId: e.photoId || null, kind: e.kind, mood: e.mood || '', energy: e.energy || '', miles: e.miles || 0, share: e.share }; l.entries.push(x); l.entries.sort((a, b) => a.ts - b.ts); if (!l.started || dayOf(x) < l.started) l.started = dayOf(x); OA.save(); changed(); return x; }
  };
})();
