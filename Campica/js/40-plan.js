/* Campica: Plan tab. Trips (wizard), stays and drive legs, booking-window calculator, packing list, meal planner and groceries, budget, itinerary and leave-behind note.
   Exports CP.plan = {addCamp(id), trips(), current(), summary(), nextTrip(), events()} for other tabs.
   Honesty rules: nothing here knows a campground's real booking rule. The calculator does date arithmetic on a window the person types
   or that the camp record itself states (booking.window); it never claims a rule for a booking system. See data/SOURCES-plan.md. */
window.CP = window.CP || {};
(function () {
  'use strict';
  const esc = OA.esc, CPo = window.CP;
  OA.defaults({ plan: { trips: [], cur: null, sec: 'overview', draft: {}, hidePacked: false } });
  const P = () => { const p = OA.S.plan; p.trips = p.trips || []; return p; };
  const isN = v => typeof v === 'number' && isFinite(v);
  const num = v => { v = parseFloat(v); return isFinite(v) ? v : 0; };
  const validKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(OA.parseKey(k).getTime());
  const ext = u => (typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : null;
  const telHref = p => { const d = String(p || '').replace(/[^\d+]/g, ''); return d.length >= 7 ? 'tel:' + d : null; };
  const UI = { sheetKind: null, q: '', picking: false, driving: false, mealKey: null, mealTag: 'ok', wizOpen: false };
  let pubT = null;
  CPo.pubSoon = () => { clearTimeout(pubT); pubT = setTimeout(() => { try { if (OA.publish) OA.publish(); } catch (e) { } }, 500); };
  const touch = () => { OA.saveSoon(); CPo.pubSoon(); };

  /* ---------- camp lookup (Find defines CP.camp; fall back to the data pack) ---------- */
  function campOf(id) {
    if (!id) return null;
    try { if (typeof CPo.camp === 'function') { const c = CPo.camp(id); if (c) return c; } } catch (e) { }
    const it = (window.CAMPS && window.CAMPS.items) || [];
    for (let i = 0; i < it.length; i++) if (it[i].id === id) return it[i];
    return null;
  }
  CPo.campLookup = campOf;
  const savedList = () => { const s = OA.S.saved; return (s && Array.isArray(s.list)) ? s.list : []; };

  /* ---------- trips ---------- */
  const trips = () => P().trips;
  const cur = () => trips().find(t => t.id === P().cur) || null;
  const idxOf = t => trips().indexOf(t);
  const tp = t => 'plan.trips.' + idxOf(t);
  const parseAges = txt => String(txt || '').split(/[,\s;]+/).map(s => parseFloat(s)).filter(v => isFinite(v) && v >= 0 && v < 19);
  const people = t => Math.max(0, num(t.party.adults)) + Math.max(0, num(t.party.kids));
  const nightsOf = t => t.stays && t.stays.length ? OA.sum(t.stays, s => Math.max(0, num(s.nights))) : Math.max(0, num(t.nights));
  const daysOf = t => nightsOf(t) + 1;
  const stayStart = (t, i) => { if (!validKey(t.startDate)) return null; let n = 0; for (let k = 0; k < i; k++) n += Math.max(0, num(t.stays[k].nights)); return OA.addDays(t.startDate, n); };
  const stayEnd = (t, i) => { const s = stayStart(t, i); return s ? OA.addDays(s, Math.max(0, num(t.stays[i].nights))) : null; };
  const tripEnd = t => validKey(t.startDate) ? OA.addDays(t.startDate, nightsOf(t)) : null;
  const range = (a, b) => a && b ? OA.fmtDate(a) + ' to ' + OA.fmtDate(b) : a ? OA.fmtDate(a) : 'dates not set';
  const VTYPES = { tent: 'Tent', rv: 'RV / motorhome', trailer: 'Travel trailer', van: 'Camper van or car camping', cabin: 'Cabin or lodging' };

  function blankTrip(d) {
    d = d || {};
    const party = Object.assign({ adults: 2, kids: 0, kidAgesTxt: '', pets: 0 }, d.party || {});
    party.kidAges = parseAges(party.kidAgesTxt);
    return {
      id: OA.uid(), name: (d.name || '').trim() || 'Camping trip', where: d.where || '', startDate: validKey(d.startDate) ? d.startDate : '', nights: Math.max(1, num(d.nights) || 2),
      party, vehicle: Object.assign({ type: 'tent', lengthFt: null }, d.vehicle || {}), stays: [], notes: '',
      pack: { checked: {}, removed: {}, custom: [], cook: 'stove', lowF: null, highF: null, rain: false, water: false, src: '' },
      meals: {}, groc: {}, bud: { mpg: null, gas: null, extraMi: null, foodPPD: null, firewood: null, extras: [], site: {}, resv: {}, extraVeh: 0 },
      leave: {}, drive: {}
    };
  }
  function mkStay(c, fb, nights) {
    c = c || {};
    return { id: OA.uid(), campId: c.id || null, name: c.name || fb.name || 'Campsite', parent: c.parent || fb.parent || '', state: c.state || fb.state || '', lat: isN(c.lat) ? c.lat : (isN(fb.lat) ? fb.lat : null), lon: isN(c.lon) ? c.lon : (isN(fb.lon) ? fb.lon : null), nights: nights || 2, rule: null, booked: false, checkin: '' };
  }
  function addCamp(id, entry) {
    entry = entry || {};
    let t = cur();
    if (!t) { t = blankTrip({}); trips().push(t); P().cur = t.id; }
    const c = campOf(id), sv = savedList().find(s => s.id === id) || entry;
    const left = t.stays.length ? 2 : Math.max(1, num(t.nights) || 2);
    const s = mkStay(c, { name: sv.name || String(id), lat: sv.lat, lon: sv.lon, state: sv.state }, left);
    if (!c) s.campId = id;
    t.stays.push(s); touch(); return s;
  }

  /* ---------- drive legs ---------- */
  const hasPos = s => s && isN(s.lat) && isN(s.lon);
  function leg(t, i) {
    const a = t.stays[i], b = t.stays[i + 1];
    if (!hasPos(a) || !hasPos(b)) return null;
    const key = a.id + '>' + b.id, ck = a.lat + ',' + a.lon + '>' + b.lat + ',' + b.lon, d = t.drive && t.drive[key];
    if (d && d.ck === ck && isN(d.mi)) return { mi: d.mi, hr: d.hr, route: true };
    const mi = OA.geo.mi({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }) * 1.25;
    return { mi, hr: mi / 50, route: false };
  }
  function driveTotals(t) {
    let mi = 0, hr = 0, miss = 0, est = 0;
    for (let i = 0; i < t.stays.length - 1; i++) { const l = leg(t, i); if (!l) miss++; else { mi += l.mi; hr += l.hr; if (!l.route) est++; } }
    return { mi, hr, miss, est };
  }
  async function getDrive() {
    const t = cur(); if (!t || UI.driving) return;
    const idx = t.stays.map((s, i) => i).filter(i => hasPos(t.stays[i]));
    if (idx.length < 2) { OA.toast('Need at least two camps with map positions.'); return; }
    const coords = idx.map(i => t.stays[i].lon.toFixed(5) + ',' + t.stays[i].lat.toFixed(5)).join(';');
    if (!OA.online()) { let old = null; try { old = await OA.db.get('cache', 'osrm:' + coords); } catch (e) { } if (!old) { OA.toast('You are offline. Estimates stay in place.', 4000); return; } }
    UI.driving = true; OA.toast('Asking the route service…');
    try {
      const r = await OA.cached('osrm:' + coords, 30 * 86400000, () => OA.fetchJSON('https://router.project-osrm.org/route/v1/driving/' + coords + '?overview=false', null, 15000));
      const v = r.v, legs = v && v.routes && v.routes[0] && v.routes[0].legs;
      if (!v || v.code !== 'Ok' || !legs || legs.length !== idx.length - 1) throw new Error('The route service gave no route.');
      t.drive = t.drive || {};
      legs.forEach((l, j) => { const a = t.stays[idx[j]], b = t.stays[idx[j + 1]]; if (idx[j + 1] === idx[j] + 1) t.drive[a.id + '>' + b.id] = { mi: l.distance / 1609.344, hr: l.duration / 3600, ck: a.lat + ',' + a.lon + '>' + b.lat + ',' + b.lon, ts: Date.now() }; });
      touch(); OA.toast(r.fromCache ? 'Used the saved route times.' : 'Driving times updated.');
    } catch (e) { OA.toast(OA.online() ? 'Could not get driving times. Estimates stay in place.' : 'You are offline. Estimates stay in place.', 4000); }
    UI.driving = false; OA.render(true);
  }

  /* ---------- booking window arithmetic ---------- */
  const TZS = [['local', 'This phone\'s time zone'], ['America/Los_Angeles', 'Pacific'], ['America/Denver', 'Mountain'], ['America/Phoenix', 'Arizona'], ['America/Chicago', 'Central'], ['America/New_York', 'Eastern'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii']];
  const tzName = z => (TZS.find(x => x[0] === z) || [0, ''])[1];
  function subMonths(key, n) {
    const p = key.split('-').map(Number); let y = p[0], m = p[1] - 1 - n, d = p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    const dim = new Date(y, m + 1, 0).getDate(); d = Math.min(d, dim);
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function zonedToUtc(key, hh, mm, tz) {
    const p = key.split('-').map(Number);
    if (!tz || tz === 'local') return new Date(p[0], p[1] - 1, p[2], hh, mm).getTime();
    try {
      const guess = Date.UTC(p[0], p[1] - 1, p[2], hh, mm);
      const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
      const off = t => { const q = {}; f.formatToParts(new Date(t)).forEach(x => { q[x.type] = x.value; }); return Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour % 24, +q.minute, +q.second) - t; };
      let t = guess - off(guess); t = guess - off(t); return t;
    } catch (e) { return new Date(p[0], p[1] - 1, p[2], hh, mm).getTime(); }
  }
  function parseWindow(txt) {
    const m = /(\d+)\s*(month|week|day)/i.exec(String(txt || '')); if (!m) return null;
    const n = +m[1], u = m[2].toLowerCase();
    return u === 'month' ? { mode: 'months', n } : { mode: 'days', n: u === 'week' ? n * 7 : n };
  }
  /* -> {key, ms (or null when no time), label} or null */
  function bookOn(stay, start) {
    const r = stay.rule; if (!r || !start || !isN(r.n) || r.n <= 0) return null;
    const key = r.mode === 'days' ? OA.addDays(start, -Math.round(r.n)) : subMonths(start, Math.round(r.n));
    const tm = /^(\d{1,2}):(\d{2})$/.exec(r.time || '');
    const ms = tm ? zonedToUtc(key, +tm[1], +tm[2], r.tz || 'local') : null;
    return { key, ms, tz: r.tz || 'local' };
  }
  const fmtWhen = ms => new Date(ms).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  function countdown(b) {
    const target = b.ms != null ? b.ms : OA.parseKey(b.key).getTime() - 12 * 3600000;
    let d = target - Date.now();
    if (d <= 0) return { past: true, text: 'This moment has passed' };
    const day = Math.floor(d / 864e5), h = Math.floor(d % 864e5 / 36e5), m = Math.floor(d % 36e5 / 6e4);
    return { past: false, text: day > 0 ? day + (day === 1 ? ' day ' : ' days ') + h + ' h' : h > 0 ? h + ' h ' + m + ' min' : m + ' min' };
  }
  const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const icsUtc = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  function reminderICS(t, i) {
    const s = t.stays[i], start = stayStart(t, i), b = bookOn(s, start); if (!b) return null;
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occultica//Campica//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:campica-' + s.id + '@occultica', 'DTSTAMP:' + icsUtc(Date.now())];
    if (b.ms != null) L.push('DTSTART:' + icsUtc(b.ms), 'DTEND:' + icsUtc(b.ms + 15 * 60000));
    else L.push('DTSTART;VALUE=DATE:' + b.key.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + OA.addDays(b.key, 1).replace(/-/g, ''));
    L.push('SUMMARY:' + icsEsc('Book campsite: ' + s.name), 'DESCRIPTION:' + icsEsc('Stay starts ' + start + ' for ' + s.nights + ' nights. Booking date worked out by Campica from a window you entered (' + (s.rule.mode === 'days' ? s.rule.n + ' days' : s.rule.n + ' months') + ' before arrival). Check the booking site for the real release rule and time.'),
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Book ' + icsEsc(s.name), 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
    return L.join('\r\n');
  }

  /* ---------- small html helpers ---------- */
  const inp = (label, path, val, attrs, then) => `<label class="fl">${label}<input class="in" data-bind="${path}" ${then === false ? '' : 'data-then="' + (then || 'cpt') + '"'} value="${esc(val == null ? '' : val)}" ${attrs || ''}></label>`;
  const sel = (label, path, opts, val, then) => `<label class="fl">${label}<select class="in" data-bind="${path}" data-then="${then || 'cpt'}">${opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(val) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  const chipBtn = (act, on, label, data) => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" ${data || ''}>${esc(label)}</button>`;
  function money(v) { return OA.money(v); }

  /* ---------- wizard ---------- */
  const WSTEPS = ['When', 'Who', 'Sleep', 'Camps'];
  function groupWhen(pre, d, showNights) {
    return inp('Trip name', pre + '.name', d.name, 'placeholder="Spring break at the lake"') + inp('Where (area, park or region)', pre + '.where', d.where, 'placeholder="Sierra foothills"') +
      `<div class="two">${inp('First night', pre + '.startDate', d.startDate, 'type="date"')}${showNights ? inp('Nights', pre + '.nights', d.nights, 'type="number" min="1" max="60" inputmode="numeric"') : ''}</div>`;
  }
  function groupWho(pre, p) {
    return `<div class="two">${inp('Adults', pre + '.adults', p.adults, 'type="number" min="1" max="30" inputmode="numeric"')}${inp('Kids', pre + '.kids', p.kids, 'type="number" min="0" max="30" inputmode="numeric"')}</div>` +
      inp('Kids\' ages (comma separated, optional)', pre + '.kidAgesTxt', p.kidAgesTxt, 'placeholder="3, 7, 10"', 'cpAges') + inp('Pets', pre + '.pets', p.pets, 'type="number" min="0" max="10" inputmode="numeric"');
  }
  function groupSleep(pre, v) {
    return sel('Sleeping in', pre + '.type', Object.keys(VTYPES).map(k => [k, VTYPES[k]]), v.type, 'cpVeh') +
      (['rv', 'trailer', 'van'].includes(v.type) ? inp('Length of your rig in feet (with hitch or towed vehicle)', pre + '.lengthFt', v.lengthFt, 'type="number" min="5" max="80" inputmode="numeric"') : '');
  }
  function wizHTML() {
    const d = P().draft, st = d.step || 0;
    let body = '';
    if (st === 0) body = groupWhen('plan.draft', d, true);
    else if (st === 1) body = groupWho('plan.draft.party', d.party);
    else if (st === 2) body = groupSleep('plan.draft.vehicle', d.vehicle) + `<p class="sm dim">This sets the packing list and checks each camp's listed rig length.</p>`;
    else {
      const cs = d.campIds || [];
      body = `<p class="sm dim">Optional. You can add camps later, from here or from the Find and Saved tabs.</p>` +
        (cs.length ? cs.map(id => { const c = campOf(id) || savedList().find(s => s.id === id) || { name: (d.custom || {})[id] }; return `<div class="li"><div class="tx"><b>${esc(c.name || id)}</b><span>${esc(c.parent || '')} ${esc(c.state || '')}</span></div><div class="end"><button class="mini" data-act="cpWizDrop" data-id="${esc(id)}">Remove</button></div></div>`; }).join('') : '<div class="sm dim pad">No camps yet.</div>') +
        `<button class="btn block" data-act="cpPicker" data-mode="wiz">Add a camp</button>`;
    }
    return `<div class="chips">${WSTEPS.map((s, i) => `<span class="chip ${i === st ? 'on' : ''}">${i + 1}. ${esc(s)}</span>`).join('')}</div>${body}
      <div class="row">${st > 0 ? '<button class="btn" data-act="cpWizBack">Back</button>' : ''}${st < 3 ? '<button class="btn gold" data-act="cpWizNext">Next</button>' : '<button class="btn gold" data-act="cpWizDone">Create trip</button>'}</div>`;
  }
  function startWizard() {
    const d = P().draft = { name: '', where: '', startDate: '', nights: 2, party: { adults: 2, kids: 0, kidAgesTxt: '', pets: 0 }, vehicle: { type: 'tent', lengthFt: null }, campIds: [], step: 0 };
    UI.wizOpen = true; UI.sheetKind = 'wiz';
    OA.sheet('Plan a trip', wizHTML(), { onClose: () => { UI.wizOpen = false; UI.sheetKind = null; } });
  }
  const redrawWiz = () => OA.redrawSheet(wizHTML());

  /* ---------- camp picker ---------- */
  function pickerResults() {
    const q = UI.q.trim().toLowerCase(), items = (window.CAMPS && window.CAMPS.items) || [], sv = savedList();
    const toks = q.split(/\s+/).filter(Boolean);
    const hay = c => (c.name + ' ' + (c.parent || '') + ' ' + (c.state || '') + ' ' + (c.region || '') + ' ' + (c.county || '')).toLowerCase();
    const mine = sv.filter(s => !toks.length || toks.every(k => (s.name || '').toLowerCase().includes(k)));
    const seen = new Set(mine.map(s => s.id));
    const more = toks.length ? items.filter(c => !seen.has(c.id) && toks.every(k => hay(c).includes(k))).slice(0, 25) : [];
    return { mine: mine.slice(0, 30), more };
  }
  function pickHTML() {
    const r = pickerResults(), t = cur(), already = new Set(UI.pickMode === 'wiz' ? (P().draft.campIds || []) : (t ? t.stays.map(s => s.campId) : []));
    const row = (id, name, sub, tag) => `<div class="li"><div class="tx"><b>${esc(name)}</b><span>${esc(sub)}</span></div><div class="end">${already.has(id) ? '<span class="tag g">Added</span>' : `<button class="mini" data-act="cpPickAdd" data-id="${esc(id)}">Add</button>`}</div></div>`;
    const dataN = ((window.CAMPS && window.CAMPS.items) || []).length;
    return `<div class="row mid"><input class="in" id="cpq" placeholder="Camp, park or state" value="${esc(UI.q)}" data-onchange="cpSearch" enterkeyhint="search"><button class="btn" data-act="cpSearch" style="flex:none">Search</button></div>
      ${r.mine.length ? `<h3>Your saved camps</h3>${r.mine.map(s => row(s.id, s.name, (campOf(s.id) ? (campOf(s.id).parent || '') + ' ' + (campOf(s.id).state || '') : 'Saved by you'))).join('')}` : ''}
      ${r.more.length ? `<h3>From the camp list</h3>${r.more.map(c => row(c.id, c.name, (c.parent || '') + (c.state ? ', ' + c.state : ''))).join('')}` : ''}
      ${!r.mine.length && !r.more.length ? `<div class="sm dim pad">${dataN ? 'Nothing matches. Try a park name or a state code.' : 'The camp list is not loaded in this build. Add a camp by name below.'}</div>` : ''}
      <h3>Not in the list?</h3><p class="sm dim">Add it by name. You can type its details in later.</p>
      <div class="row mid"><input class="in" id="cpcustom" placeholder="Campground name"><button class="btn" data-act="cpPickCustom" style="flex:none">Add</button></div>`;
  }
  function pickInto(id, entry) {
    if (UI.pickMode === 'wiz') { const d = P().draft; d.campIds = d.campIds || []; if (!d.campIds.includes(id)) d.campIds.push(id); OA.save(); OA.toast('Added to the trip.'); }
    else { addCamp(id, entry); OA.toast('Added to the trip.'); }
    OA.redrawSheet(pickHTML());
  }

  /* ---------- overview: header, stays, drive ---------- */
  function feeText(c) {
    const f = c && c.fees; if (!f || !isN(f.nightlyMin)) return 'check with the source';
    return (f.nightlyMax != null && f.nightlyMax !== f.nightlyMin ? OA.money(f.nightlyMin) + ' to ' + OA.money(f.nightlyMax) : OA.money(f.nightlyMin)) + ' a night' + (f.asof ? ' (as of ' + f.asof + ')' : '');
  }
  function rigWarn(t, c) {
    if (!c || !['rv', 'trailer', 'van'].includes(t.vehicle.type)) return '';
    const L = num(t.vehicle.lengthFt), mx = c.sites && c.sites.maxRvFt, out = [];
    if (L && isN(mx) && L > mx) out.push(`<div class="alert danger"><b class="t">Rig may be too long</b>Your rig is listed at ${OA.ft(L)}; this camp lists a ${OA.ft(mx)} limit. Call to confirm before you book.</div>`);
    else if (L && !isN(mx)) out.push(`<div class="alert"><b class="t">Rig length not listed</b>Check with the source that a ${OA.ft(L)} rig fits.</div>`);
    if (c.sites && c.sites.hookups === 'none') out.push('<span class="tag w">No hookups listed</span>');
    return out.join('');
  }
  function stayCard(t, i) {
    const s = t.stays[i], c = campOf(s.campId), start = stayStart(t, i), end = stayEnd(t, i), n = t.stays.length;
    const ph = c && ((c.contact && c.contact.phone) || (c.booking && c.booking.phone));
    const bk = c && c.booking, bu = ext(bk && bk.url);
    const l = i < n - 1 ? leg(t, i) : null;
    return `<div class="card inner"><div class="ct"><span>${i + 1}. ${esc(s.name)}</span><span class="dim sm">${esc(s.state || '')}</span></div>
      ${s.parent ? `<div class="sm dim">${esc(s.parent)}</div>` : ''}
      <div class="kv"><span>Dates</span><span>${esc(range(start, end))}</span></div>
      <div class="kv"><span>Nightly fee</span><span>${esc(c ? feeText(c) : 'enter it under Budget')}</span></div>
      ${bk && bk.system ? `<div class="kv"><span>Booking</span><span>${esc(bk.system)}${bk.window ? ': ' + esc(bk.window) : ''}</span></div>` : ''}
      ${ph ? `<div class="kv"><span>Phone</span><span><a href="${esc(telHref(ph) || '#')}">${esc(ph)}</a></span></div>` : ''}
      ${rigWarn(t, c)}
      <div class="row mid"><span class="sm dim" style="flex:1">Nights</span><button class="mini" data-act="cpNights" data-id="${esc(s.id)}" data-d="-1" aria-label="Fewer nights" style="min-width:44px;min-height:44px">-</button><b style="min-width:30px;text-align:center">${esc(s.nights)}</b><button class="mini" data-act="cpNights" data-id="${esc(s.id)}" data-d="1" aria-label="More nights" style="min-width:44px;min-height:44px">+</button></div>
      <div class="row wrap">${i > 0 ? `<button class="mini" data-act="cpMove" data-id="${esc(s.id)}" data-d="-1">Move up</button>` : ''}${i < n - 1 ? `<button class="mini" data-act="cpMove" data-id="${esc(s.id)}" data-d="1">Move down</button>` : ''}${bu ? `<a class="mini" href="${esc(bu)}" target="_blank" rel="noopener">Booking page</a>` : ''}<button class="mini" data-act="cpRm" data-id="${esc(s.id)}">Remove</button></div></div>` +
      (i < n - 1 ? `<div class="cp-leg">${l ? `Drive to next camp: about <b>${esc(OA.dist(l.mi, 0))}</b>, ${esc(OA.hm(l.hr))} <span class="tag ${l.route ? 'g' : 'w'}">${l.route ? 'route service' : 'estimate'}</span>` : 'Drive to next camp: unknown (a camp has no map position).'}</div>` : '');
  }
  function overview(t) {
    const dt = driveTotals(t), hasLegs = t.stays.length > 1, placed = t.stays.filter(hasPos).length;
    return `<div class="card"><div class="ct"><span>${OA.icon('tent')} Stays</span><span class="dim sm">${nightsOf(t)} nights</span></div>
      ${t.stays.length ? t.stays.map((s, i) => stayCard(t, i)).join('') : `<div class="sm dim pad">No camps on this trip yet. ${t.where ? 'Add the camps you are considering for ' + esc(t.where) + '.' : 'Add a camp from your saved list or search the camp list.'}</div>`}
      <button class="btn block" data-act="cpPicker" data-mode="trip">Add a camp</button></div>
      ${hasLegs ? `<div class="card"><div class="ct"><span>${OA.icon('car')} Driving between camps</span></div>
        <div class="kv"><span>Total between camps</span><span>${esc(OA.dist(dt.mi, 0))} · ${esc(OA.hm(dt.hr))}</span></div>
        <p class="sm dim">${dt.est ? 'Estimates use straight-line distance x 1.25 at about 50 mph. They are rough and ignore terrain, traffic and your rig\'s speed. ' : 'Route service times are for a car and ignore traffic; allow more if you tow. '}${dt.miss ? dt.miss + ' leg(s) have no map position and are not counted.' : ''}</p>
        <button class="btn block" data-act="cpDrive" ${placed < 2 || UI.driving ? 'disabled' : ''}>Get driving times</button>
        <p class="xs dim">One request to the free OpenStreetMap-based route service per tap. Needs signal; the last result is kept for offline use.</p></div>` : ''}
      <div class="card"><div class="ct"><span>Notes</span></div><textarea class="in" rows="3" data-bind="${tp(t)}.notes" data-then="cpt" placeholder="Reservations to make, things to remember, ideas for the kids">${esc(t.notes)}</textarea></div>`;
  }

  /* ---------- booking section ---------- */
  function bookCard(t, i) {
    const s = t.stays[i], c = campOf(s.campId), start = stayStart(t, i), bk = (c && c.booking) || {}, r = s.rule || {}, base = tp(t) + '.stays.' + i;
    const sys = String(bk.system || '').toLowerCase(), first = sys.indexOf('first') >= 0;
    const w = parseWindow(bk.window), b = bookOn(s, start), bu = ext(bk.url), ph = (bk.phone || (c && c.contact && c.contact.phone)) || null;
    let result = '';
    if (!start) result = '<div class="alert"><b class="t">Set the trip start date</b>The booking date is counted back from your arrival day. Add it under Edit.</div>';
    else if (b) {
      const cd = countdown(b), pastStay = OA.daysBetween(OA.dkey(), start) < 0;
      result = `<div class="hero"><div class="sm dim">Book on</div><div class="big-num" style="font-size:1.4rem">${esc(OA.fmtDate(b.key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))}</div>
        ${b.ms != null ? `<div>${esc(fmtWhen(b.ms))} on your phone's clock <span class="dim sm">(${esc(r.time)} ${esc(tzName(b.tz) || '')})</span></div>` : '<div class="sm dim">No release time entered. Many sites open at a set hour; check the booking page.</div>'}
        <div class="${cd.past ? 'warn' : 'green'} b" style="margin-top:6px">${pastStay ? 'This stay date has passed.' : cd.past ? 'The window should already be open for this date. Check availability now.' : 'Opens in ' + esc(cd.text)}</div></div>
        <button class="btn block" data-act="cpIcs" data-i="${i}">Add reminder (.ics file)</button>`;
    }
    return `<div class="card"><div class="ct"><span>${esc(s.name)}</span><span class="dim sm">${esc(start ? OA.fmtDate(start) : 'no date')}</span></div>
      ${first ? `<div class="alert"><b class="t">First-come, first-served</b>${bk.firstComeNote ? esc(bk.firstComeNote) : 'This camp is listed as first-come. Call to ask how it fills and when to arrive.'}</div>` : ''}
      <div class="kv"><span>System</span><span>${esc(bk.system || 'check with the source')}</span></div>
      <div class="kv"><span>Window (from camp record)</span><span>${esc(bk.window || 'check with the source')}</span></div>
      ${bk.cancelNote ? `<div class="kv"><span>Cancellations</span><span>${esc(bk.cancelNote)}</span></div>` : ''}
      <div class="row wrap">${bu ? `<a class="mini" href="${esc(bu)}" target="_blank" rel="noopener">Open booking page</a>` : ''}${telHref(ph) ? `<a class="mini" href="${esc(telHref(ph))}">Call ${esc(ph)}</a>` : ''}</div>
      ${first ? '' : `<h3>When can I book?</h3>
      <p class="xs dim">Booking windows differ by campground and agency, and some release at a set time. Campica does only the date arithmetic with the window you enter below, or the one the camp record states. It does not know the real rule. Confirm on the booking site.</p>
      ${w && !(r.n > 0) ? `<button class="btn block" data-act="cpUseWin" data-i="${i}">Use the camp record's window: ${esc(w.n)} ${w.mode}</button>` : ''}
      <div class="two">${sel('Counted in', base + '.rule.mode', [['months', 'Months before'], ['days', 'Days before']], r.mode || 'months', 'cpPackRe')}${inp('How many', base + '.rule.n', r.n, 'type="number" min="1" max="400" inputmode="numeric"', 'cpPackRe')}</div>
      <div class="two">${inp('Release time (optional)', base + '.rule.time', r.time, 'type="time"', 'cpPackRe')}${sel('Time zone of that time', base + '.rule.tz', TZS, r.tz || 'local', 'cpPackRe')}</div>
      ${result}`}
      <label class="chk"><input type="checkbox" data-bind="${base}.booked" data-type="bool" data-then="cpBooked" data-i="${i}" ${s.booked ? 'checked' : ''}> I have reserved this stay</label>
      ${inp('Check-in time you were told (optional)', base + '.checkin', s.checkin, 'placeholder="2:00 PM"')}</div>`;
  }
  function bookSec(t) {
    if (!t.stays.length) return '<div class="card"><div class="sm dim pad">Add camps to the trip first, then work out when each one opens for booking.</div><button class="btn block" data-act="cpSec" data-s="overview">Go to Stays</button></div>';
    return t.stays.map((s, i) => bookCard(t, i)).join('') + '<div class="foot">Reservation confirmation numbers belong in the Saved tab, stored only on this phone.</div>';
  }

  /* ---------- packing ---------- */
  const PCATS = ['Before you go', 'Shelter and sleep', 'Rig and hookups', 'Camp kitchen', 'Fire', 'Food and water', 'Clothing', 'Health and safety', 'Kids', 'Pets', 'Fun and comfort', 'Papers and money', 'My items'];
  function ageGroups(t) {
    const k = Math.max(0, Math.round(num(t.party.kids))), ages = parseAges(t.party.kidAgesTxt), g = { baby: 0, tod: 0, kid: 0, teen: 0 };
    for (let i = 0; i < k; i++) { const a = ages[i]; if (a == null) g.kid++; else if (a < 2) g.baby++; else if (a < 5) g.tod++; else if (a < 13) g.kid++; else g.teen++; }
    return g;
  }
  function packList(t) {
    const out = [], pk = t.pack, v = t.vehicle.type, A = Math.max(1, Math.round(num(t.party.adults))), K = Math.max(0, Math.round(num(t.party.kids))), N = A + K, days = daysOf(t), pets = Math.round(num(t.party.pets));
    const g = ageGroups(t), low = isN(pk.lowF) ? pk.lowF : null, high = isN(pk.highF) ? pk.highF : null;
    const cold = low != null && low <= 45, cool = low != null && low < 55, hot = high != null && high >= 85, known = low != null || high != null;
    const cook = pk.cook || 'stove', fireOn = cook === 'fire' || cook === 'both', stoveOn = cook === 'stove' || cook === 'both';
    const add = (cat, id, text) => out.push({ cat, id, text });
    const pairs = Math.min(days + 1, 8);

    add('Before you go', 'b-confirm', 'Confirm the reservation, site and check-in time (call if unsure)');
    add('Before you go', 'b-rules', 'Check fire restrictions, closures and alerts on the camp\'s official page');
    add('Before you go', 'b-wx', 'Look at the forecast the day before and adjust the list');
    add('Before you go', 'b-friend', 'Leave your plan with a friend (Share tab has a note)');
    add('Before you go', 'b-maps', 'Save offline maps and the camp address; cell service may not exist there');
    add('Before you go', 'b-charge', 'Charge phones, headlamps and power banks');
    add('Before you go', 'b-gas', 'Fuel up and check tire pressure, including the spare');
    add('Before you go', 'b-freeze', 'Freeze water jugs or meals, and pre-chill the cooler');
    if (v === 'rv' || v === 'trailer') add('Before you go', 'b-rig', 'Check tires, brakes, lights, propane and batteries before leaving');

    if (v === 'tent') {
      add('Shelter and sleep', 's-tent', 'Tent big enough for ' + N + ' people, with poles and rain fly');
      add('Shelter and sleep', 's-foot', 'Ground tarp or footprint');
      add('Shelter and sleep', 's-stakes', 'Stakes, a mallet and spare guylines');
      add('Shelter and sleep', 's-repair', 'Repair kit: tape, pole splint, patches');
      add('Shelter and sleep', 's-broom', 'Small broom and dustpan');
    }
    if (v === 'tent' || v === 'van') {
      add('Shelter and sleep', 's-bags', 'Sleeping bags or bedding for ' + N + (low != null ? ' (rated at or below ' + Math.round(low) + '°F)' : ' (rated for the expected low)'));
      add('Shelter and sleep', 's-pads', 'Sleeping pads or air mattresses for ' + N);
      add('Shelter and sleep', 's-pump', 'Pump for air mattresses, if needed');
      add('Shelter and sleep', 's-pillow', 'Pillows for ' + N);
    }
    if (v === 'van') { add('Shelter and sleep', 's-cover', 'Window covers for privacy and warmth'); add('Shelter and sleep', 's-vent', 'Ventilation: cracked windows with bug screens or a small fan'); }
    if (v === 'rv' || v === 'trailer') { add('Shelter and sleep', 's-linen', 'Bedding and towels for ' + N); add('Shelter and sleep', 's-blank', 'Extra blankets for cold nights'); }
    if (v === 'cabin') { add('Shelter and sleep', 's-ask', 'Ask what the cabin supplies: bedding, towels, cookware, heat'); add('Shelter and sleep', 's-linen', 'Bedding and towels for ' + N + ' if not supplied'); add('Shelter and sleep', 's-lock', 'Cabin key or check-in instructions'); }
    if (cold) add('Shelter and sleep', 's-cold', 'Extra blankets or a warm liner; hot-water bottles are a comfort for kids');
    if (v === 'tent') add('Shelter and sleep', 's-mat', 'Doormat or tarp for the entrance to keep dirt out');

    if (v === 'rv' || v === 'trailer') {
      add('Rig and hookups', 'r-chock', 'Wheel chocks and leveling blocks');
      add('Rig and hookups', 'r-hose', 'Fresh-water hose made for drinking water, plus a pressure regulator');
      add('Rig and hookups', 'r-sewer', 'Sewer hose, fittings and gloves');
      add('Rig and hookups', 'r-power', 'Power cord, adapters for the plug type, and a surge protector');
      add('Rig and hookups', 'r-ext', 'Fire extinguisher and smoke/CO alarm: test them');
      add('Rig and hookups', 'r-tools', 'Basic tools, fuses and duct tape');
      if (v === 'trailer') add('Rig and hookups', 'r-hitch', 'Hitch pin, lock and safety chains checked');
      add('Rig and hookups', 'r-light', 'Outdoor mat and awning stakes');
    }

    add('Camp kitchen', 'k-cooler', 'Cooler(s): one for food, one for drinks if you can');
    add('Camp kitchen', 'k-ice', 'Ice or ice packs and an appliance thermometer for the cooler (keep food at 40°F / 4°C or colder)');
    add('Camp kitchen', 'k-dish', 'Plates, bowls, cups and utensils for ' + N);
    add('Camp kitchen', 'k-pots', 'Pot, pan, spatula, tongs, ladle');
    add('Camp kitchen', 'k-knife', 'Knife and cutting board');
    add('Camp kitchen', 'k-open', 'Can opener and bottle opener');
    add('Camp kitchen', 'k-wash', 'Dish tub, camp soap, sponge and towels');
    add('Camp kitchen', 'k-trash', 'Trash bags and a bag to pack out garbage');
    add('Camp kitchen', 'k-paper', 'Paper towels, foil, zip bags');
    add('Camp kitchen', 'k-bins', 'Sealed bins for dry food (keeps animals out)');
    add('Camp kitchen', 'k-mitt', 'Oven mitts or a pot gripper');
    add('Camp kitchen', 'k-table', 'Folding table if the site has no picnic table');
    add('Camp kitchen', 'k-coffee', 'Coffee or tea setup');
    if (stoveOn) { add('Camp kitchen', 'k-stove', 'Camp stove'); add('Camp kitchen', 'k-fuel', 'Stove fuel, with a spare canister or tank'); }
    if (cook === 'fire' || cook === 'both') add('Camp kitchen', 'k-grate', 'Grill grate or cast-iron pan for the fire ring');

    if (fireOn || cook === 'both') {
      add('Fire', 'f-wood', 'Firewood bought near camp (do not carry it from far away)');
      add('Fire', 'f-start', 'Fire starters and a long lighter');
      add('Fire', 'f-match', 'Matches in a waterproof container');
      add('Fire', 'f-glove', 'Heavy gloves for handling hot pots');
      add('Fire', 'f-bucket', 'Bucket and shovel to put the fire fully out');
      add('Fire', 'f-sticks', 'Roasting sticks');
    } else add('Fire', 'f-ban', 'Lighter or matches for the stove (campfires may be banned anyway; check)');
    if (fireOn) add('Fire', 'f-alt', 'Backup plan: a stove, in case fire restrictions ban campfires');

    add('Food and water', 'w-water', 'Drinking water: carry enough for ' + N + ' people (a common rule is about 1 gallon / 4 L per person per day if camp has no tap)');
    add('Food and water', 'w-bottles', 'Water bottles for ' + N);
    add('Food and water', 'w-jug', 'Water jug or collapsible container for camp');
    add('Food and water', 'w-spice', 'Salt, pepper, oil and a small spice kit');
    add('Food and water', 'w-groc', 'Groceries from the Meals tab list');
    add('Food and water', 'w-snack', 'Snacks for the car and the trail');

    add('Clothing', 'c-under', 'Underwear and socks: ' + pairs + ' pairs each');
    add('Clothing', 'c-shirts', 'Shirts and pants or shorts for each person (a few outfits, plus layers)');
    add('Clothing', 'c-sleep', 'Sleepwear');
    add('Clothing', 'c-shoes', 'Sturdy closed shoes, plus camp sandals or slip-ons');
    add('Clothing', 'c-fleece', 'Warm layer (fleece or sweater) for each person: nights are cooler than days');
    add('Clothing', 'c-hat', 'Sun hat for each person');
    add('Clothing', 'c-spare', 'One extra change of clothes in a dry bag for each child');
    if (cool || !known) add('Clothing', 'c-jacket', 'Warm jacket for each person' + (known ? '' : ' (temperature not set: pack for a range)'));
    if (cold) { add('Clothing', 'c-thermal', 'Thermal base layers, beanies and gloves for each person'); add('Clothing', 'c-wsleep', 'Warm sleepwear and thick socks'); }
    if (hot) { add('Clothing', 'c-light', 'Light, long-sleeved sun shirts'); add('Clothing', 'c-shade', 'Shade canopy or tarp'); add('Clothing', 'c-cool', 'Cooling towels and extra water'); }
    if (pk.rain || !known) add('Clothing', 'c-rain', 'Rain jackets for each person' + (pk.rain ? '' : ' (just in case)'));
    if (pk.rain) { add('Clothing', 'c-tarp', 'Extra tarp or rain canopy over the picnic area'); add('Clothing', 'c-boot', 'Waterproof boots or shoes and spare socks'); add('Clothing', 'c-dry', 'Dry bags and a clothesline'); }
    if (pk.water) { add('Clothing', 'c-swim', 'Swimsuits and quick-dry towels'); add('Clothing', 'c-shoes2', 'Water shoes'); }

    add('Health and safety', 'h-fa', 'First-aid kit, restocked');
    add('Health and safety', 'h-meds', 'Everyone\'s regular medications and allergy supplies');
    add('Health and safety', 'h-sun', 'Sunscreen and lip balm');
    add('Health and safety', 'h-bug', 'Insect repellent');
    add('Health and safety', 'h-tick', 'Tweezers for ticks; check everyone each evening');
    add('Health and safety', 'h-san', 'Hand sanitizer, wipes and toilet paper');
    add('Health and safety', 'h-lamp', 'Headlamp or flashlight for each person, plus spare batteries');
    add('Health and safety', 'h-lantern', 'Camp lantern');
    add('Health and safety', 'h-whistle', 'Whistle for each child');
    add('Health and safety', 'h-map', 'Paper map or printed directions to camp');
    add('Health and safety', 'h-power', 'Power bank for phones');
    add('Health and safety', 'h-ext', 'Contact list: camp, ranger station, nearest hospital');
    if (pk.water) add('Health and safety', 'h-pfd', 'Life jackets that fit each person, and a plan to watch kids near water');

    if (g.baby) { add('Kids', 'k-diap', 'Diapers and wipes (a few more than you expect)'); add('Kids', 'k-crib', 'Portable crib or safe sleep space'); add('Kids', 'k-food', 'Baby food or formula, plus a way to prepare it'); add('Kids', 'k-carrier', 'Baby carrier'); }
    if (g.tod) { add('Kids', 'k-pull', 'Pull-ups or spare underwear and plastic bags for accidents'); add('Kids', 'k-comfort', 'Comfort items: stuffed animal, blanket'); add('Kids', 'k-chair', 'Child-size camp chairs'); }
    if (g.kid) { add('Kids', 'k-lamp', 'Own headlamps for kids'); add('Kids', 'k-nat', 'Nature kit: bug jar, magnifier, binoculars, journal'); add('Kids', 'k-bike', 'Bikes and helmets, if the camp has quiet roads'); add('Kids', 'k-jr', 'Ask the park whether it offers a Junior Ranger or kids\' program'); }
    if (g.teen) { add('Kids', 'k-teen', 'Teens: headphones, book or games, power bank'); add('Kids', 'k-ham', 'Hammock'); }
    if (K) { add('Kids', 'k-snack', 'Favorite snacks and treats'); add('Kids', 'k-cards', 'Cards and travel games for downtime'); }

    if (pets) {
      add('Pets', 'p-leash', 'Leash (camps usually require one) and a tie-out; check the camp\'s pet rules');
      add('Pets', 'p-food', 'Pet food, bowls and enough water');
      add('Pets', 'p-bag', 'Waste bags');
      add('Pets', 'p-bed', 'Pet bed or blanket and a towel');
      add('Pets', 'p-med', 'Pet medications and vaccination records');
      add('Pets', 'p-id', 'ID tag and a recent photo of your pet');
      add('Pets', 'p-vet', 'Nearest vet or emergency clinic noted');
    }

    add('Fun and comfort', 'x-chairs', 'Camp chairs for ' + N);
    add('Fun and comfort', 'x-games', 'Cards, board games or a ball');
    add('Fun and comfort', 'x-lights', 'String lights or a lantern for the table');
    add('Fun and comfort', 'x-cam', 'Camera and a field guide (birds, stars or trees)');
    if (fireOn) add('Fun and comfort', 'x-smores', 'S\'mores supplies');

    add('Papers and money', 'd-id', 'ID and reservation confirmation (screenshot it; you may have no signal)');
    add('Papers and money', 'd-cash', 'Cash and coins for fees, showers, firewood and ice');
    add('Papers and money', 'd-pass', 'Park or entrance passes, if you have them');
    add('Papers and money', 'd-ins', 'Insurance and emergency contacts');
    if (v === 'rv' || v === 'trailer') add('Papers and money', 'd-reg', 'Vehicle and trailer registration');

    const rem = pk.removed || {};
    const items = out.filter(x => !rem[x.id]);
    (pk.custom || []).forEach(c => items.push({ cat: PCATS.includes(c.cat) ? c.cat : 'My items', id: c.id, text: c.text, custom: true }));
    return { items, removed: out.filter(x => rem[x.id]).length };
  }
  function packSec(t) {
    const pk = t.pack, base = tp(t) + '.pack', L = packList(t), done = L.items.filter(x => pk.checked[x.id]).length, hide = P().hidePacked;
    const cats = PCATS.filter(c => L.items.some(x => x.cat === c));
    const pct = L.items.length ? Math.round(done / L.items.length * 100) : 0;
    return `<div class="card"><div class="ct"><span>${OA.icon('backpack')} Your trip</span></div>
      <div class="two">${sel('Cooking with', base + '.cook', [['stove', 'Camp stove'], ['fire', 'Campfire'], ['both', 'Stove and fire'], ['nocook', 'No cooking']], pk.cook || 'stove', 'cpPackRe')}
      ${inp('Expected low (°F)', base + '.lowF', pk.lowF, 'type="number" inputmode="numeric"', 'cpPackRe')}</div>
      <div class="two">${inp('Expected high (°F)', base + '.highF', pk.highF, 'type="number" inputmode="numeric"', 'cpPackRe')}<div></div></div>
      <label class="chk"><input type="checkbox" data-bind="${base}.rain" data-type="bool" data-then="cpPackRe" ${pk.rain ? 'checked' : ''}> Rain is likely</label>
      <label class="chk"><input type="checkbox" data-bind="${base}.water" data-type="bool" data-then="cpPackRe" ${pk.water ? 'checked' : ''}> Swimming or boating</label>
      <div class="row wrap"><button class="mini" data-act="cpForecast">Use the forecast</button></div>
      <p class="xs dim">${pk.src ? esc(pk.src) : 'Type the low and high you expect, or tap the forecast button (needs signal, works up to about 7 days out; the last copy is used offline). Temperatures are entered in °F.'}</p></div>
      <div class="card"><div class="ct"><span>${OA.icon('list')} Packing list</span><span class="dim sm">${done} of ${L.items.length}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row wrap"><button class="mini" data-act="cpHidePacked">${hide ? 'Show packed items' : 'Hide packed items'}</button><button class="mini" data-act="cpPackShare">Share unpacked</button><button class="mini" data-act="cpPackPrint">Print</button></div>
      ${cats.map(c => {
        const its = L.items.filter(x => x.cat === c), shown = its.filter(x => !(hide && pk.checked[x.id]));
        if (!shown.length) return `<h3 class="cp-cat">${esc(c)} <span class="dim sm">all packed</span></h3>`;
        return `<h3 class="cp-cat">${esc(c)} <span class="dim sm">${its.filter(x => pk.checked[x.id]).length}/${its.length}</span></h3>` + shown.map(x =>
          `<div class="cp-item"><label class="chk"><input type="checkbox" data-bind="${base}.checked.${esc(x.id)}" data-type="bool" data-then="cpPackRe" ${pk.checked[x.id] ? 'checked' : ''}><span class="${pk.checked[x.id] ? 'cp-done' : ''}">${esc(x.text)}</span></label><button class="x" data-act="cpPackDel" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.text)}">×</button></div>`).join('');
      }).join('')}
      ${L.removed ? `<button class="lnk" data-act="cpPackRestore">Restore ${L.removed} removed item${L.removed > 1 ? 's' : ''}</button>` : ''}
      <h3>Add your own</h3><div class="row mid"><input class="in" id="cppadd" placeholder="Item" style="margin:0"><select class="in" id="cppcat" style="margin:0;max-width:130px">${PCATS.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
      <button class="btn block" data-act="cpPackAdd">Add item</button></div>`;
  }
  async function forecast() {
    const t = cur(); if (!t) return;
    const s = t.stays.find(hasPos); if (!s) { OA.toast('Add a camp with a map position first.'); return; }
    if (!validKey(t.startDate)) { OA.toast('Set the trip start date first.'); return; }
    try {
      const r = await OA.weather(s.lat, s.lon), d = r.v.daily, a = t.startDate, b = tripEnd(t) || a;
      let lo = null, hi = null, n = 0;
      (d.time || []).forEach((k, i) => { if (k >= a && k <= b) { n++; const mn = d.temperature_2m_min[i], mx = d.temperature_2m_max[i], pr = d.precipitation_probability_max && d.precipitation_probability_max[i]; if (isN(mn)) lo = lo == null ? mn : Math.min(lo, mn); if (isN(mx)) hi = hi == null ? mx : Math.max(hi, mx); if (isN(pr) && pr >= 40) t.pack.rain = true; } });
      if (!n) { OA.toast('The forecast only reaches about 7 days out. Type the temperatures you expect.', 4500); return; }
      t.pack.lowF = lo != null ? Math.round(lo) : null; t.pack.highF = hi != null ? Math.round(hi) : null;
      t.pack.src = 'Forecast for ' + s.name + (r.stale ? ' (saved copy, may be old)' : '') + ': low ' + OA.temp(lo) + ', high ' + OA.temp(hi) + '. Check again before you leave.';
      touch(); OA.render(true);
    } catch (e) { OA.toast(OA.online() ? 'Could not get the forecast.' : 'Offline and no saved forecast. Type the temperatures.', 4000); }
  }
  function packText(t, onlyOpen) {
    const L = packList(t), pk = t.pack, lines = ['Packing list: ' + t.name];
    PCATS.forEach(c => { const its = L.items.filter(x => x.cat === c && !(onlyOpen && pk.checked[x.id])); if (its.length) { lines.push('', c.toUpperCase()); its.forEach(x => lines.push((pk.checked[x.id] ? '[x] ' : '[ ] ') + x.text)); } });
    return lines.join('\n');
  }

  /* ---------- meals ---------- */
  /* [id, name, slots (b l d s), cook (fire|stove|none), perish (0 shelf-stable, 1 keep cold, 2 raw meat or fish), ingredients [name, per-person qty, unit, aisle]] Amounts are rough starting points. */
  const IDEAS = [
    ['oat', 'Instant oatmeal with fruit and nuts', 'b', 'stove', 0, [['Instant oatmeal packets', 2, 'ea', 'Pantry'], ['Bananas or apples', 1, 'ea', 'Produce'], ['Nuts or raisins', 0.25, 'cup', 'Pantry']]],
    ['scr', 'Scrambled eggs in tortillas', 'b', 'stove', 1, [['Eggs', 2, 'ea', 'Dairy and eggs'], ['Tortillas', 2, 'ea', 'Bread'], ['Shredded cheese', 1, 'oz', 'Dairy and eggs'], ['Salsa', 1, 'tbsp', 'Pantry']]],
    ['pan', 'Pancakes from batter mixed at home', 'b', 'stove', 1, [['Pancake batter (mixed at home, in a bottle)', 0.5, 'cup', 'Pantry'], ['Syrup', 2, 'tbsp', 'Pantry'], ['Fruit', 1, 'ea', 'Produce']]],
    ['hash', 'Foil-packet breakfast hash', 'b', 'fire', 1, [['Potatoes', 6, 'oz', 'Produce'], ['Precooked sausage', 3, 'oz', 'Meat and protein'], ['Onion or pepper', 2, 'oz', 'Produce']]],
    ['cer', 'Cereal with shelf-stable milk', 'b', 'none', 0, [['Cereal', 1.5, 'cup', 'Pantry'], ['Shelf-stable milk', 1, 'cup', 'Pantry'], ['Bananas or apples', 1, 'ea', 'Produce']]],
    ['yog', 'Yogurt, granola and fruit', 'b', 'none', 1, [['Yogurt', 6, 'oz', 'Dairy and eggs'], ['Granola', 0.33, 'cup', 'Pantry'], ['Fruit', 1, 'ea', 'Produce']]],
    ['bag', 'Bagels with cream cheese or nut butter', 'b', 'none', 0, [['Bagels', 1, 'ea', 'Bread'], ['Cream cheese or nut butter', 2, 'tbsp', 'Pantry'], ['Fruit', 1, 'ea', 'Produce']]],
    ['muf', 'Muffins, fruit and hot cocoa', 'b', 'stove', 0, [['Muffins', 1, 'ea', 'Bread'], ['Cocoa packets', 1, 'ea', 'Pantry'], ['Fruit', 1, 'ea', 'Produce']]],
    ['ftoast', 'French toast on a griddle', 'b', 'stove', 1, [['Bread', 2, 'ea', 'Bread'], ['Eggs', 1, 'ea', 'Dairy and eggs'], ['Syrup', 2, 'tbsp', 'Pantry']]],
    ['sand', 'Sandwich bar: deli fillings, cheese, veggies', 'l', 'none', 1, [['Bread or rolls', 2, 'ea', 'Bread'], ['Deli meat or cheese', 3, 'oz', 'Meat and protein'], ['Lettuce and tomato', 2, 'oz', 'Produce']]],
    ['pbj', 'Nut butter (or seed butter) and jelly wraps', 'l', 'none', 0, [['Tortillas', 1, 'ea', 'Bread'], ['Nut or seed butter', 2, 'tbsp', 'Pantry'], ['Jam', 1, 'tbsp', 'Pantry']]],
    ['pin', 'Cold turkey and cheese pinwheels', 'l', 'none', 1, [['Tortillas', 1, 'ea', 'Bread'], ['Deli turkey', 2, 'oz', 'Meat and protein'], ['Cream cheese', 1, 'tbsp', 'Dairy and eggs']]],
    ['tuna', 'Tuna or chicken pouch on crackers', 'l', 'none', 0, [['Tuna or chicken pouches', 0.5, 'ea', 'Pantry'], ['Crackers', 1.5, 'oz', 'Pantry'], ['Cucumber or carrots', 2, 'oz', 'Produce']]],
    ['hum', 'Hummus, veggies, pita and cheese plate', 'l', 'none', 1, [['Hummus', 3, 'tbsp', 'Dairy and eggs'], ['Pita', 1, 'ea', 'Bread'], ['Cut veggies', 3, 'oz', 'Produce'], ['Cheese', 1, 'oz', 'Dairy and eggs']]],
    ['gch', 'Grilled cheese sandwiches', 'l', 'stove', 1, [['Bread', 2, 'ea', 'Bread'], ['Sliced cheese', 2, 'oz', 'Dairy and eggs'], ['Butter', 1, 'tbsp', 'Dairy and eggs']]],
    ['que', 'Cheese quesadillas in a skillet', 'l', 'stove', 1, [['Tortillas', 2, 'ea', 'Bread'], ['Shredded cheese', 2, 'oz', 'Dairy and eggs'], ['Salsa', 1, 'tbsp', 'Pantry']]],
    ['ram', 'Instant noodles with peas and egg', 'l', 'stove', 1, [['Instant noodle packs', 1, 'ea', 'Pantry'], ['Frozen peas or veggies', 2, 'oz', 'Produce'], ['Eggs', 1, 'ea', 'Dairy and eggs']]],
    ['dogs', 'Hot dogs on sticks', 'ld', 'fire', 1, [['Hot dogs', 1.5, 'ea', 'Meat and protein'], ['Buns', 1.5, 'ea', 'Bread'], ['Ketchup and mustard', 1, 'tbsp', 'Pantry']]],
    ['soup', 'Canned soup with crackers', 'l', 'stove', 0, [['Canned soup', 0.5, 'ea', 'Pantry'], ['Crackers', 1, 'oz', 'Pantry']]],
    ['tmix', 'Trail mix lunch with cheese sticks and fruit', 'l', 'none', 1, [['Trail mix', 0.25, 'cup', 'Pantry'], ['Cheese sticks', 2, 'ea', 'Dairy and eggs'], ['Fruit', 1, 'ea', 'Produce']]],
    ['fsv', 'Foil-packet sausage and veggies', 'd', 'fire', 1, [['Smoked sausage (precooked)', 4, 'oz', 'Meat and protein'], ['Potatoes', 6, 'oz', 'Produce'], ['Zucchini or peppers', 4, 'oz', 'Produce'], ['Cooking oil', 1, 'tbsp', 'Pantry']]],
    ['fch', 'Foil-packet chicken and potatoes', 'd', 'fire', 2, [['Chicken pieces (raw)', 5, 'oz', 'Meat and protein'], ['Potatoes', 6, 'oz', 'Produce'], ['Carrots or green beans', 3, 'oz', 'Produce'], ['Cooking oil', 1, 'tbsp', 'Pantry']]],
    ['burg', 'Burgers on the grate', 'd', 'fire', 2, [['Ground beef patties (raw)', 5, 'oz', 'Meat and protein'], ['Buns', 1, 'ea', 'Bread'], ['Cheese slices', 1, 'ea', 'Dairy and eggs'], ['Lettuce and tomato', 2, 'oz', 'Produce']]],
    ['chili', 'One-pot chili with canned beans', 'd', 'stove', 0, [['Canned beans', 5, 'oz', 'Pantry'], ['Canned tomatoes', 4, 'oz', 'Pantry'], ['Chili seasoning', 1, 'tbsp', 'Pantry'], ['Shredded cheese', 1, 'oz', 'Dairy and eggs']]],
    ['pasta', 'Pasta with jarred sauce', 'd', 'stove', 0, [['Dry pasta', 3, 'oz', 'Pantry'], ['Jarred pasta sauce', 4, 'oz', 'Pantry'], ['Grated cheese', 1, 'tbsp', 'Dairy and eggs']]],
    ['taco', 'Tacos with ground meat cooked at home', 'd', 'stove', 1, [['Cooked taco meat (chilled)', 4, 'oz', 'Meat and protein'], ['Tortillas', 3, 'ea', 'Bread'], ['Shredded cheese', 1, 'oz', 'Dairy and eggs'], ['Lettuce and tomato', 2, 'oz', 'Produce']]],
    ['burr', 'Bean and cheese burritos', 'd', 'stove', 0, [['Canned beans', 4, 'oz', 'Pantry'], ['Instant rice pouch', 2, 'oz', 'Pantry'], ['Tortillas', 1.5, 'ea', 'Bread'], ['Shredded cheese', 1.5, 'oz', 'Dairy and eggs']]],
    ['mac', 'Boxed mac and cheese with peas', 'd', 'stove', 0, [['Boxed mac and cheese', 3, 'oz', 'Pantry'], ['Peas or broccoli', 2, 'oz', 'Produce']]],
    ['pizza', 'Flatbread pizzas on a skillet or grate', 'd', 'fire', 1, [['Flatbreads', 1, 'ea', 'Bread'], ['Pizza sauce', 2, 'tbsp', 'Pantry'], ['Shredded cheese', 2, 'oz', 'Dairy and eggs'], ['Pepperoni or veggies', 1, 'oz', 'Meat and protein']]],
    ['nach', 'Campfire nachos in a foil tray', 'd', 'fire', 1, [['Tortilla chips', 2, 'oz', 'Pantry'], ['Canned beans', 3, 'oz', 'Pantry'], ['Shredded cheese', 2, 'oz', 'Dairy and eggs'], ['Salsa', 2, 'tbsp', 'Pantry']]],
    ['kab', 'Chicken or veggie kabobs', 'd', 'fire', 2, [['Chicken (raw) or tofu', 4, 'oz', 'Meat and protein'], ['Peppers and onion', 4, 'oz', 'Produce'], ['Cooking oil', 1, 'tbsp', 'Pantry']]],
    ['rice', 'Rice and beans bowls', 'd', 'stove', 0, [['Dry rice', 0.25, 'cup', 'Pantry'], ['Canned black beans', 4, 'oz', 'Pantry'], ['Salsa', 2, 'tbsp', 'Pantry'], ['Shredded cheese', 1, 'oz', 'Dairy and eggs']]],
    ['brat', 'Bratwurst or sausages with peppers', 'd', 'fire', 1, [['Precooked sausages', 1.5, 'ea', 'Meat and protein'], ['Buns', 1.5, 'ea', 'Bread'], ['Peppers and onion', 3, 'oz', 'Produce'], ['Mustard', 1, 'tbsp', 'Pantry']]],
    ['csoup', 'One-pot noodle soup with canned chicken', 'd', 'stove', 0, [['Dry noodles', 2, 'oz', 'Pantry'], ['Broth', 8, 'oz', 'Pantry'], ['Canned chicken', 3, 'oz', 'Pantry'], ['Carrots', 2, 'oz', 'Produce']]],
    ['psal', 'Pasta salad made at home', 'd', 'none', 1, [['Pasta salad (made at home, chilled)', 7, 'oz', 'Meat and protein'], ['Bread or rolls', 1, 'ea', 'Bread']]],
    ['char', 'Cheese, crackers, salami and fruit supper', 'd', 'none', 1, [['Cheese', 2, 'oz', 'Dairy and eggs'], ['Crackers', 2, 'oz', 'Pantry'], ['Salami or summer sausage', 2, 'oz', 'Meat and protein'], ['Fruit', 1, 'ea', 'Produce']]],
    ['smo', 'S\'mores', 's', 'fire', 0, [['Graham crackers', 2, 'ea', 'Snacks'], ['Chocolate bars', 1, 'oz', 'Snacks'], ['Marshmallows', 2, 'ea', 'Snacks']]],
    ['bboat', 'Banana boats', 's', 'fire', 0, [['Bananas', 1, 'ea', 'Produce'], ['Chocolate chips', 1, 'oz', 'Snacks'], ['Mini marshmallows', 0.25, 'cup', 'Snacks']]],
    ['apnut', 'Apple slices with nut butter', 's', 'none', 0, [['Apples', 1, 'ea', 'Produce'], ['Nut or seed butter', 1, 'tbsp', 'Pantry']]],
    ['pop', 'Popcorn in a pot', 's', 'stove', 0, [['Popcorn kernels', 2, 'tbsp', 'Snacks'], ['Cooking oil', 1, 'tbsp', 'Pantry']]],
    ['cocoa', 'Hot cocoa', 's', 'stove', 0, [['Cocoa packets', 1, 'ea', 'Pantry']]]
  ];
  const IDEA = {}; IDEAS.forEach(x => { IDEA[x[0]] = { id: x[0], name: x[1], slots: x[2], cook: x[3], perish: x[4], ing: x[5] }; });
  CPo.mealIdeas = () => IDEAS.length;
  const SLOTS = [['b', 'Breakfast'], ['l', 'Lunch'], ['d', 'Dinner'], ['s', 'Snack or treat']];
  const COOKLBL = { fire: 'Campfire', stove: 'Stove', none: 'No cook' };
  function daySlots(t, di) {
    const n = daysOf(t), arr = ['b', 'l', 'd'];
    if (n === 1) return ['d'];
    if (di === 0) return ['l', 'd', 's'];
    if (di === n - 1) return ['b', 'l'];
    return ['b', 'l', 'd', 's'];
  }
  const mkey = (di, sl) => di + '-' + sl;
  function allowed(t, cook) { const m = t.pack.cook || 'stove'; if (cook === 'none') return true; if (m === 'nocook') return false; if (m === 'both') return true; return m === cook; }
  function servings(t) { return Math.max(1, num(t.party.adults)) + 0.6 * Math.max(0, num(t.party.kids)); }
  function autoFill(t) {
    const used = {}; let n = 0;
    for (let di = 0; di < daysOf(t); di++) daySlots(t, di).forEach(sl => {
      if (sl === 's' && di % 2 === 1) return;
      const key = mkey(di, sl); if (t.meals[key] && (t.meals[key].id || t.meals[key].text)) return;
      const maxP = di < 2 ? 2 : di < 4 ? 1 : 0;
      let pool = IDEAS.filter(x => x[2].includes(sl) && allowed(t, x[3]) && x[4] <= maxP);
      if (!pool.length) pool = IDEAS.filter(x => x[2].includes(sl) && x[3] === 'none');
      if (!pool.length) return;
      pool.sort((a, b) => (used[a[0]] || 0) - (used[b[0]] || 0));
      const pick = pool[(di + SLOTS.findIndex(s => s[0] === sl)) % Math.min(pool.length, 4)] || pool[0];
      const best = pool.find(x => !used[x[0]]) || pick;
      used[best[0]] = (used[best[0]] || 0) + 1;
      t.meals[key] = { id: best[0], text: best[1], tag: best[3] }; n++;
    });
    return n;
  }
  function groceries(t) {
    const sv = servings(t), map = {};
    Object.keys(t.meals).forEach(k => { const m = t.meals[k], idea = m && m.id && IDEA[m.id]; if (!idea) return; idea.ing.forEach(g => { const key = g[0] + '|' + g[2]; const e = map[key] || (map[key] = { name: g[0], unit: g[2], aisle: g[3], q: 0 }); e.q += g[1] * sv; }); });
    const list = Object.keys(map).map(k => Object.assign({ key: k }, map[k]));
    list.forEach(e => { e.q = Math.ceil(e.q * 2 - 1e-6) / 2; });
    return list;
  }
  function mealWarnings(t) {
    const w = [];
    Object.keys(t.meals).forEach(k => { const m = t.meals[k], idea = m && m.id && IDEA[m.id]; if (!idea) return; const di = parseInt(k, 10); if (idea.perish === 2 && di >= 2) w.push('Day ' + (di + 1) + ': ' + idea.name + ' uses raw meat. After the first two days it needs fresh ice or a restock, or swap in a shelf-stable meal.'); });
    return w;
  }
  function mealsSec(t) {
    const nd = daysOf(t), warns = mealWarnings(t), g = groceries(t), sv = servings(t), planned = Object.keys(t.meals).filter(k => t.meals[k] && (t.meals[k].id || t.meals[k].text)).length;
    let html = `<div class="card"><div class="ct"><span>${OA.icon('fork')} Meal plan</span><span class="dim sm">${nd} day${nd > 1 ? 's' : ''}</span></div>
      <p class="sm dim">Cooking with: <b>${esc(({ stove: 'camp stove', fire: 'campfire', both: 'stove and fire', nocook: 'no cooking' })[t.pack.cook || 'stove'])}</b> (change it on the Pack tab). Fire restrictions can ban campfires and charcoal, so keep a stove-friendly meal in reserve.</p>
      <div class="row wrap"><button class="mini" data-act="cpAutoMeals">Fill empty slots</button><button class="mini" data-act="cpClearMeals">Clear all</button></div></div>`;
    for (let di = 0; di < nd; di++) {
      const dk = t.startDate ? OA.addDays(t.startDate, di) : null;
      html += `<div class="card"><div class="ct"><span>Day ${di + 1}</span><span class="dim sm">${esc(dk ? OA.fmtDate(dk) : '')}</span></div>` +
        daySlots(t, di).map(sl => { const m = t.meals[mkey(di, sl)], nm = SLOTS.find(s => s[0] === sl)[1];
          return `<button class="cp-meal" data-act="cpMealPick" data-k="${mkey(di, sl)}" data-sl="${sl}"><span class="dim xs">${esc(nm)}</span><b>${m && m.text ? esc(m.text) : '<span class="dim">Choose</span>'}</b>${m && m.tag ? `<span class="tag ${m.tag === 'fire' ? 'a' : ''}">${esc(COOKLBL[m.tag] || m.tag)}</span>` : ''}</button>`; }).join('') + '</div>';
    }
    html += `<div class="card tip"><div class="ct"><span>${OA.icon('thermo')} Cooler plan</span></div>
      <ul class="ls sm"><li>Keep cold food at <b>40°F (4°C) or colder</b>. Put an appliance thermometer in the cooler and check it.</li>
      <li>Perishable food that has sat above 40°F for more than 2 hours (1 hour when the air is 90°F or hotter) should be thrown out. This is the USDA food-safety guidance.</li>
      <li>Pack raw meat sealed and on the bottom, drinks in their own cooler, and eat the most perishable meals first.</li>
      <li>Ice melts faster in heat and with the lid opening; plan to buy more ice every day or two on a trip of ${nd} days${nd >= 3 ? ', and to rely on shelf-stable food late in the trip' : ''}.</li></ul>
      ${nd >= 4 ? '<div class="alert"><b class="t">Long trip</b>With ' + nd + ' days, plan an ice and grocery stop, or choose canned and dry meals for the last days.</div>' : ''}
      ${warns.map(x => `<div class="alert"><b class="t">Cooler check</b>${esc(x)}</div>`).join('')}</div>`;
    html += `<div class="card"><div class="ct"><span>${OA.icon('cart')} Grocery list</span><span class="dim sm">${planned} meals planned</span></div>
      <p class="xs dim">Amounts are rough, for ${esc(OA.round(sv, 1))} adult-sized servings (children count as 0.6). Adjust for your family's appetite. Meals you typed yourself add nothing here.</p>`;
    if (!g.length) html += '<div class="sm dim pad">Pick meals above and the ingredients show up here.</div>';
    else {
      const ais = ['Produce', 'Dairy and eggs', 'Meat and protein', 'Bread', 'Pantry', 'Snacks'];
      ais.forEach(a => { const items = g.filter(x => x.aisle === a); if (!items.length) return; html += `<h3 class="cp-cat">${esc(a)}</h3>` + items.map(x => `<label class="chk"><input type="checkbox" data-bind="${tp(t)}.groc.${esc(x.key.replace(/[^a-z0-9]/gi, '_'))}" data-type="bool" ${t.groc[x.key.replace(/[^a-z0-9]/gi, '_')] ? 'checked' : ''}><span>${esc(x.name)} <span class="dim">${esc(x.q)} ${esc(x.unit === 'ea' ? '' : x.unit)}</span></span></label>`).join(''); });
    }
    const ppl = people(t), water = Math.ceil(ppl * nd);
    html += `<h3 class="cp-cat">Also</h3><div class="sm dim">Drinking water: about ${water} gallons (${OA.round(water * 3.785, 0)} L) if the camp has no tap, at roughly 1 gallon per person per day. Ice. Coffee, tea, drinks. Snacks for the road.</div>
      <div class="row wrap"><button class="mini" data-act="cpGrocShare">Share grocery list</button></div></div>`;
    return html;
  }
  function mealPickHTML() {
    const t = cur(), sl = UI.mealSlot, ideas = IDEAS.filter(x => x[2].includes(sl) && (UI.mealTag === 'all' || (UI.mealTag === 'ok' ? allowed(t, x[3]) : x[3] === UI.mealTag)));
    return `<div class="chips">${[['ok', 'Fits my cooking'], ['all', 'All'], ['fire', 'Campfire'], ['stove', 'Stove'], ['none', 'No cook']].map(c => chipBtn('cpMealTag', UI.mealTag === c[0], c[1], 'data-v="' + c[0] + '"')).join('')}</div>
      ${ideas.length ? ideas.map(x => `<div class="li" data-act="cpMealSet" data-id="${x[0]}"><div class="tx"><b>${esc(x[1])}</b><span>${esc(COOKLBL[x[3]])}${x[4] === 2 ? ', raw meat: eat early' : x[4] === 1 ? ', keep cold' : ', shelf-stable'}</span></div></div>`).join('') : '<div class="sm dim pad">No ideas fit that filter. Try All.</div>'}
      <h3>Or type your own</h3><input class="in" id="cpmtext" placeholder="Leftover chili, restaurant stop…"><div class="row"><button class="btn" data-act="cpMealCustom">Use this</button><button class="btn danger" data-act="cpMealClear">Clear slot</button></div>`;
  }

  /* ---------- budget ---------- */
  function calcBudget(t) {
    const b = t.bud, lines = [], nights = nightsOf(t), ppl = people(t), need = [];
    let site = 0, resv = 0, veh = 0;
    t.stays.forEach((s, i) => {
      const c = campOf(s.campId), f = (c && c.fees) || {}, n = Math.max(0, num(s.nights));
      let nightly = b.site && isN(b.site[s.id]) ? b.site[s.id] : (isN(f.nightlyMin) && f.nightlyMin === f.nightlyMax ? f.nightlyMin : null);
      if (nightly == null) need.push(s.id);
      site += (nightly || 0) * n;
      const rf = b.resv && isN(b.resv[s.id]) ? b.resv[s.id] : (isN(f.reservationFee) ? f.reservationFee : 0);
      resv += rf || 0;
      if (num(b.extraVeh) > 0 && isN(f.extraVehicle)) veh += f.extraVehicle * n * num(b.extraVeh);
    });
    const dt = driveTotals(t), miles = dt.mi + num(b.extraMi), gal = num(b.mpg) > 0 ? miles / num(b.mpg) : 0, fuel = gal * num(b.gas);
    const food = num(b.foodPPD) * ppl * daysOf(t), wood = num(b.firewood), extras = OA.sum(b.extras || [], e => num(e.amt));
    const total = site + resv + veh + fuel + food + wood + extras;
    return { site, resv, veh, fuel, food, wood, extras, total, perNight: nights > 0 ? total / nights : 0, perPerson: ppl > 0 ? total / ppl : 0, miles, need, nights };
  }
  function budgetSec(t) {
    const b = t.bud, base = tp(t) + '.bud', c = calcBudget(t), N = n => OA.money(n);
    const staysHtml = t.stays.map((s, i) => {
      const cp = campOf(s.campId), f = (cp && cp.fees) || {}, known = isN(f.nightlyMin) && f.nightlyMin === f.nightlyMax;
      const hint = isN(f.nightlyMin) && !known ? 'Listed ' + OA.money(f.nightlyMin) + ' to ' + OA.money(f.nightlyMax) + (f.asof ? ' (as of ' + f.asof + ')' : '') : known ? 'Listed ' + OA.money(f.nightlyMin) + (f.asof ? ' (as of ' + f.asof + ')' : '') : 'No fee on file: check with the source';
      return `<div class="card inner"><b>${esc(s.name)}</b> <span class="dim sm">${esc(s.nights)} nights</span><div class="xs dim">${esc(hint)}</div>
        <div class="two">${inp('Nightly fee ($)', base + '.site.' + s.id, b.site && b.site[s.id], 'type="number" min="0" step="1" inputmode="decimal" placeholder="' + (known ? f.nightlyMin : '') + '"', 'cpBud')}${inp('Reservation fee ($)', base + '.resv.' + s.id, b.resv && b.resv[s.id], 'type="number" min="0" step="1" inputmode="decimal" placeholder="' + (isN(f.reservationFee) ? f.reservationFee : '') + '"', 'cpBud')}</div></div>`;
    }).join('');
    const ex = (b.extras || []).map((e, i) => `<div class="row mid"><span style="flex:1">${esc(e.label)}</span><input class="in" style="max-width:100px;margin:0" type="number" inputmode="decimal" data-bind="${base}.extras.${i}.amt" data-then="cpBud" value="${esc(e.amt)}"><button class="x" data-act="cpExDel" data-i="${i}" aria-label="Remove">×</button></div>`).join('');
    const row = (l, v, sub) => `<div class="kv"><span>${esc(l)}${sub ? `<br><span class="xs">${esc(sub)}</span>` : ''}</span><span>${v}</span></div>`;
    const other = trips().filter(x => x !== t);
    return `<div class="card"><div class="ct"><span>${OA.icon('scale')} Budget</span></div>
      <div class="stat"><div><b>${N(c.total)}</b><span>TOTAL</span></div><div><b>${N(c.perNight)}</b><span>PER NIGHT</span></div><div><b>${N(c.perPerson)}</b><span>PER PERSON</span></div></div>
      ${c.need.length ? `<div class="alert"><b class="t">Some fees are missing</b>${c.need.length} stay${c.need.length > 1 ? 's have' : ' has'} no single listed fee. Type your price below; until then it counts as $0.</div>` : ''}
      ${row('Site fees', N(c.site))}${row('Reservation fees', N(c.resv))}${c.veh ? row('Extra vehicle fees', N(c.veh)) : ''}${row('Fuel', N(c.fuel), c.fuel ? OA.dist(c.miles, 0) + ' driven' : 'enter mpg and gas price')}${row('Food', N(c.food))}${row('Firewood and ice', N(c.wood))}${row('Other', N(c.extras))}</div>
      <div class="card"><div class="ct"><span>Camp fees</span></div>${staysHtml || '<div class="sm dim">Add camps to the trip to price them.</div>'}${t.stays.length ? inp('Extra vehicles (for camps that list a fee)', base + '.extraVeh', b.extraVeh, 'type="number" min="0" max="5" inputmode="numeric"', 'cpBud') : ''}</div>
      <div class="card"><div class="ct"><span>${OA.icon('fuel')} Fuel</span></div>
        <p class="sm dim">Between camps: ${esc(OA.dist(driveTotals(t).mi, 0))}${driveTotals(t).est ? ' (estimate)' : ''}. Add the round trip from home below.</p>
        <div class="two">${inp('Extra miles (home to camp and back)', base + '.extraMi', b.extraMi, 'type="number" min="0" inputmode="decimal"', 'cpBud')}${inp('Miles per gallon', base + '.mpg', b.mpg, 'type="number" min="1" inputmode="decimal"', 'cpBud')}</div>
        ${inp('Price per gallon ($)', base + '.gas', b.gas, 'type="number" min="0" step="0.01" inputmode="decimal"', 'cpBud')}</div>
      <div class="card"><div class="ct"><span>Food and extras</span></div>
        <div class="two">${inp('Food per person per day ($)', base + '.foodPPD', b.foodPPD, 'type="number" min="0" inputmode="decimal"', 'cpBud')}${inp('Firewood and ice, total ($)', base + '.firewood', b.firewood, 'type="number" min="0" inputmode="decimal"', 'cpBud')}</div>
        ${ex}<div class="row mid"><input class="in" id="cpexl" placeholder="Park pass, gear rental…" style="margin:0"><input class="in" id="cpexa" type="number" inputmode="decimal" placeholder="$" style="max-width:90px;margin:0"><button class="btn" data-act="cpExAdd" style="flex:none">Add</button></div></div>
      ${other.length ? `<div class="card"><div class="ct"><span>Compare trips</span></div><div class="scroll-x"><table class="t"><tr><th>Trip</th><th>Nights</th><th>Total</th><th>Per night</th></tr>${trips().map(x => { const k = calcBudget(x); return `<tr><td>${x === t ? '<b>' + esc(x.name) + '</b>' : esc(x.name)}</td><td>${k.nights}</td><td>${N(k.total)}</td><td>${N(k.perNight)}</td></tr>`; }).join('')}</table></div><p class="xs dim">Totals count only what is entered or listed on a camp record.</p></div>` : ''}`;
  }

  /* ---------- summary and leave-behind ---------- */
  function phoneOf(s) { const c = campOf(s.campId); return (c && ((c.contact && c.contact.phone) || (c.booking && c.booking.phone))) || null; }
  function recFor(s, st) {
    const r = (OA.S.saved && OA.S.saved.rec && s.campId && OA.S.saved.rec[String(s.campId).replace(/[^A-Za-z0-9_-]/g, '_')]) || {};
    return r.from && st && r.from === st ? r : {};
  }
  function summaryText(t) {
    if (!t) return '';
    const L = [t.name + (t.where ? ' (' + t.where + ')' : ''), range(t.startDate, tripEnd(t)) + ', ' + nightsOf(t) + ' night' + (nightsOf(t) === 1 ? '' : 's'),
      'Party: ' + t.party.adults + ' adult' + (num(t.party.adults) === 1 ? '' : 's') + (num(t.party.kids) ? ', ' + t.party.kids + ' kid' + (num(t.party.kids) === 1 ? '' : 's') + (parseAges(t.party.kidAgesTxt).length ? ' (ages ' + parseAges(t.party.kidAgesTxt).join(', ') + ')' : '') : '') + (num(t.party.pets) ? ', ' + t.party.pets + ' pet' + (num(t.party.pets) === 1 ? '' : 's') : ''),
      'Sleeping in: ' + (VTYPES[t.vehicle.type] || t.vehicle.type) + (num(t.vehicle.lengthFt) && t.vehicle.type !== 'tent' && t.vehicle.type !== 'cabin' ? ', ' + OA.ft(num(t.vehicle.lengthFt)) : ''), ''];
    t.stays.forEach((s, i) => {
      const c = campOf(s.campId), st = stayStart(t, i), en = stayEnd(t, i), ph = phoneOf(s), rec = recFor(s, st);
      L.push((i + 1) + '. ' + s.name + (s.parent ? ', ' + s.parent : '') + (s.state ? ' (' + s.state + ')' : ''));
      L.push('   ' + range(st, en) + ', ' + s.nights + ' night' + (num(s.nights) === 1 ? '' : 's') + (s.booked ? ', reserved' : ', not yet reserved'));
      if (rec.site) L.push('   Site: ' + rec.site);
      if (s.checkin) L.push('   Check-in: ' + s.checkin);
      L.push('   Phone: ' + (ph || 'check with the source'));
      if (hasPos(s)) L.push('   Map: ' + OA.geo.mapLinks(s.lat, s.lon).google);
      if (i < t.stays.length - 1) { const l = leg(t, i); if (l) L.push('   Next drive: about ' + OA.dist(l.mi, 0) + ', ' + OA.hm(l.hr) + (l.route ? '' : ' (estimate)')); }
    });
    if (t.notes) L.push('', 'Notes: ' + t.notes);
    const c = calcBudget(t); if (c.total > 0) L.push('', 'Budget so far: ' + OA.money(c.total) + ' (' + OA.money(c.perNight) + ' a night)');
    return L.join('\n');
  }
  function leaveText(t) {
    const lv = t.leave || {}, L = ['Camping trip note for ' + (lv.friend || 'a friend'), '', 'Who: ' + people(t) + ' people (' + t.party.adults + ' adults, ' + (t.party.kids || 0) + ' kids)' + (num(t.party.pets) ? ', ' + t.party.pets + ' pet(s)' : ''),
      'Vehicle: ' + (lv.vehicleDesc || '(add make, color and plate)'), 'Dates: ' + range(t.startDate, tripEnd(t)), ''];
    t.stays.forEach((s, i) => {
      const st = stayStart(t, i), en = stayEnd(t, i), ph = phoneOf(s), rec = recFor(s, st);
      L.push('Camp ' + (i + 1) + ': ' + s.name + (s.parent ? ', ' + s.parent : '') + (s.state ? ', ' + s.state : ''));
      L.push('  Nights: ' + (st ? OA.fmtDate(st) : '?') + ' to ' + (en ? OA.fmtDate(en) : '?'));
      if (rec.site) L.push('  Site: ' + rec.site);
      if (s.checkin) L.push('  Check-in: ' + s.checkin);
      L.push('  Camp phone: ' + (ph || 'not on file'));
      if (hasPos(s)) L.push('  Map: ' + OA.geo.mapLinks(s.lat, s.lon).google);
    });
    if (lv.expectBack) L.push('', 'Expect us home: ' + lv.expectBack);
    L.push(lv.callIf ? 'If you have not heard from us by ' + lv.callIf + ', please call us, then the camp or the local ranger or sheriff office.' : 'If you have not heard from us when we are due back, please call us, then the camp or the local ranger or sheriff office.');
    L.push('', 'There may be no cell signal at camp. This note is only a plan you can check against; Campica cannot track our location.');
    return L.join('\n');
  }
  function shareSec(t) {
    const lv = t.leave = t.leave || {}, base = tp(t) + '.leave', st = summaryText(t), lt = leaveText(t);
    return `<div class="card"><div class="ct"><span>${OA.icon('share')} Trip sheet</span></div><pre class="cp-pre">${esc(st)}</pre>
      <div class="row wrap"><button class="btn gold" data-act="cpShare" data-w="sum">Share</button><button class="btn" data-act="cpCopy" data-w="sum">Copy</button><button class="btn" data-act="cpPrint" data-w="sum">Print</button></div></div>
      <div class="card"><div class="ct"><span>${OA.icon('pin')} Leave-behind note</span></div>
      <div class="alert"><b class="t">No live tracking</b>This app cannot share your live location. The note below is a plan your friend can compare with a missed check-in. Set a time you will check in, and keep to it.</div>
      ${inp('Who is it for?', base + '.friend', lv.friend, 'placeholder="Sam"')}${inp('Vehicle (make, color, plate)', base + '.vehicleDesc', lv.vehicleDesc, 'placeholder="Green Subaru, plate ABC1234"')}
      <div class="two">${inp('Expect us home', base + '.expectBack', lv.expectBack, 'placeholder="Sun 5 pm"')}${inp('Call for help if no word by', base + '.callIf', lv.callIf, 'placeholder="Sun 8 pm"')}</div>
      <pre class="cp-pre">${esc(lt)}</pre>
      <div class="row wrap"><button class="btn gold" data-act="cpShare" data-w="leave">Send</button><button class="btn" data-act="cpCopy" data-w="leave">Copy</button><button class="btn" data-act="cpPrint" data-w="leave">Print</button></div></div>`;
  }
  function printOut(title, text) {
    let d = document.getElementById('cp-print'); if (d) d.remove();
    d = document.createElement('div'); d.id = 'cp-print'; d.innerHTML = `<h1>${esc(title)}</h1><pre>${esc(text)}</pre>`;
    document.body.appendChild(d); document.body.classList.add('cp-printing');
    const done = () => { document.body.classList.remove('cp-printing'); const x = document.getElementById('cp-print'); if (x) x.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) { done(); OA.toast('Printing is not available here. Use Copy or Share.'); }
    setTimeout(() => { if (document.body.classList.contains('cp-printing')) done(); }, 60000);
  }

  /* ---------- the tab ---------- */
  const SECS = [['overview', 'Stays'], ['book', 'Book'], ['pack', 'Pack'], ['meals', 'Meals'], ['budget', 'Budget'], ['share', 'Share']];
  function tripHead(t) {
    const nights = nightsOf(t), v = VTYPES[t.vehicle.type] || '';
    return `<div class="card hot"><div class="ct"><span>${esc(t.name)}</span><button class="lnk" data-act="cpEdit">Edit</button></div>
      ${t.where ? `<div class="sm dim">${esc(t.where)}</div>` : ''}
      <div class="kv"><span>When</span><span>${esc(range(t.startDate, tripEnd(t)))}${t.startDate ? '' : ' <button class="lnk" data-act="cpEdit">set</button>'}</span></div>
      <div class="kv"><span>Nights</span><span>${nights}</span></div>
      <div class="kv"><span>Who</span><span>${esc(t.party.adults)} adult${num(t.party.adults) === 1 ? '' : 's'}${num(t.party.kids) ? ', ' + esc(t.party.kids) + ' kid' + (num(t.party.kids) === 1 ? '' : 's') : ''}${num(t.party.pets) ? ', ' + esc(t.party.pets) + ' pet' + (num(t.party.pets) === 1 ? '' : 's') : ''}</span></div>
      <div class="kv"><span>Sleeping in</span><span>${esc(v)}${num(t.vehicle.lengthFt) && ['rv', 'trailer', 'van'].includes(t.vehicle.type) ? ', ' + esc(OA.ft(num(t.vehicle.lengthFt))) : ''}</span></div></div>`;
  }
  function renderPlan() {
    const ts = trips();
    if (!ts.length) return OA.header('Plan', 'Trips, booking dates, packing and meals') + `<div class="card tip center"><div style="font-size:2.2rem">${OA.icon('tent', 'lg')}</div><h2 class="big">Plan your first trip</h2>
      <p class="sm dim">Answer four quick questions (where, when, who, what you sleep in) and Campica builds a packing list, a meal plan with groceries, a budget, and the dates your camps open for booking.</p>
      <button class="btn gold block" data-act="cpNew" data-smoke>Start a trip</button>
      ${savedList().length ? `<p class="sm dim">You have ${savedList().length} saved camp${savedList().length > 1 ? 's' : ''} ready to add.</p>` : ''}</div>`;
    let t = cur(); if (!t) { t = ts[0]; P().cur = t.id; }
    const sec = SECS.find(s => s[0] === P().sec) ? P().sec : 'overview';
    const body = sec === 'overview' ? overview(t) : sec === 'book' ? bookSec(t) : sec === 'pack' ? packSec(t) : sec === 'meals' ? mealsSec(t) : sec === 'budget' ? budgetSec(t) : shareSec(t);
    return OA.header('Plan', 'Trips, booking dates, packing and meals') +
      `<div class="chips">${ts.map(x => chipBtn('cpOpen', x.id === t.id, x.name, 'data-id="' + esc(x.id) + '"')).join('')}<button class="chip" data-act="cpNew">+ New trip</button></div>` +
      tripHead(t) + `<div class="chips wrap cp-secs">${SECS.map(s => chipBtn('cpSec', s[0] === sec, s[1], 'data-s="' + s[0] + '"')).join('')}</div>` + body +
      `<div class="row"><button class="btn danger" data-act="cpDelTrip">Delete this trip</button></div>`;
  }
  OA.tab({ id: 'plan', label: 'Plan', icon: 'route', order: 30, render: () => renderPlan() });

  /* ---------- actions ---------- */
  const T0 = () => { const t = cur(); if (!t) throw new Error('No trip selected.'); return t; };
  const stayBy = (t, id) => t.stays.find(s => s.id === id);
  OA.act({
    cpt() { touch(); },
    cpAges(el) { const path = el.dataset.bind.replace(/\.[^.]+$/, ''), p = OA.getPath(OA.S, path); if (p) p.kidAges = parseAges(p.kidAgesTxt); touch(); },
    cpVeh() { touch(); redrawIfWiz(); },
    cpBud() { touch(); OA.render(true); },
    cpPackRe() { touch(); OA.render(true); },
    cpBooked(el) {
      const t = T0(), s = t.stays[+el.dataset.i]; touch();
      if (s && s.booked && s.campId && OA.S.saved && Array.isArray(OA.S.saved.list)) { const e = OA.S.saved.list.find(x => x.id === s.campId); if (e && e.status !== 'visited') { e.status = 'booked'; OA.saveSoon(); } }
    },
    cpNew() { startWizard(); },
    cpWizNext() { const d = P().draft; d.step = Math.min(3, (d.step || 0) + 1); redrawWiz(); },
    cpWizBack() { const d = P().draft; d.step = Math.max(0, (d.step || 0) - 1); redrawWiz(); },
    cpWizDrop(el) { const d = P().draft; d.campIds = (d.campIds || []).filter(x => x !== el.dataset.id); redrawWiz(); },
    cpWizDone() {
      const d = P().draft, t = blankTrip(d); trips().push(t); P().cur = t.id; P().sec = 'overview';
      const ids = d.campIds || [], n = Math.max(1, num(d.nights) || 2), base = Math.max(1, Math.floor(n / Math.max(1, ids.length)));
      ids.forEach((id, i) => {
        const c = campOf(id), sv = savedList().find(s => s.id === id), custom = (d.custom || {})[id];
        const s = mkStay(c, { name: (sv && sv.name) || custom || String(id), lat: sv && sv.lat, lon: sv && sv.lon, state: sv && sv.state }, base + (i === 0 ? Math.max(0, n - base * ids.length) : 0));
        if (!c && sv) s.campId = id; t.stays.push(s);
      });
      P().draft = {}; UI.wizOpen = false; UI.sheetKind = null; touch(); OA.closeAllSheets(); OA.go('plan'); OA.toast('Trip created.');
    },
    cpOpen(el) { P().cur = el.dataset.id; OA.saveSoon(); OA.render(true); },
    cpSec(el) { P().sec = el.dataset.s; OA.saveSoon(); OA.render(); window.scrollTo(0, 0); },
    cpEdit() { const t = T0(); UI.sheetKind = 'edit'; OA.sheet('Trip details', editHTML(t), { onClose: () => { UI.sheetKind = null; } }); },
    cpDelTrip: async () => {
      const t = T0(); if (!await OA.confirm('Delete "' + t.name + '" and its packing list, meals and budget?', 'Delete')) return;
      P().trips = trips().filter(x => x !== t); P().cur = P().trips[0] ? P().trips[0].id : null; touch(); OA.render();
    },
    cpPicker(el) { UI.pickMode = el.dataset.mode; UI.q = ''; const k = UI.sheetKind; UI.sheetKind = 'pick'; OA.sheet('Add a camp', pickHTML(), { onClose: () => { UI.sheetKind = k; if (UI.wizOpen) redrawWiz(); } }); },
    cpSearch() { const i = OA.$('#cpq'); UI.q = i ? i.value : UI.q; OA.redrawSheet(pickHTML()); },
    cpPickAdd(el) { const id = el.dataset.id, e = savedList().find(s => s.id === id) || {}; pickInto(id, e); },
    cpPickCustom() {
      const i = OA.$('#cpcustom'), name = i ? i.value.trim() : ''; if (!name) { OA.toast('Type the campground name.'); return; }
      const id = 'x-' + OA.uid();
      if (UI.pickMode === 'wiz') { const d = P().draft; d.campIds = d.campIds || []; d.campIds.push(id); d.custom = d.custom || {}; d.custom[id] = name; OA.save(); }
      else { const t = cur() || (() => { const n = blankTrip({}); trips().push(n); P().cur = n.id; return n; })(); t.stays.push(mkStay(null, { name }, t.stays.length ? 2 : Math.max(1, num(t.nights) || 2))); touch(); }
      OA.toast('Added.'); OA.redrawSheet(pickHTML());
    },
    cpNights(el) { const t = T0(), s = stayBy(t, el.dataset.id); if (!s) return; s.nights = OA.clamp(num(s.nights) + num(el.dataset.d), 1, 60); touch(); OA.render(true); },
    cpMove(el) { const t = T0(), i = t.stays.findIndex(s => s.id === el.dataset.id), j = i + num(el.dataset.d); if (i < 0 || j < 0 || j >= t.stays.length) return; const x = t.stays.splice(i, 1)[0]; t.stays.splice(j, 0, x); touch(); OA.render(true); },
    cpRm: async el => { const t = T0(), s = stayBy(t, el.dataset.id); if (!s) return; if (!await OA.confirm('Remove ' + s.name + ' from this trip?', 'Remove')) return; t.stays = t.stays.filter(x => x !== s); touch(); OA.render(true); },
    cpDrive() { return getDrive(); },
    cpUseWin(el) { const t = T0(), s = t.stays[+el.dataset.i], w = parseWindow(((campOf(s.campId) || {}).booking || {}).window); if (!w) return; s.rule = Object.assign({ time: '', tz: 'local' }, s.rule || {}, w); touch(); OA.render(true); },
    cpIcs(el) {
      const t = T0(), i = +el.dataset.i, ics = reminderICS(t, i); if (!ics) { OA.toast('Set the window and a start date first.'); return; }
      OA.download('book-' + String(t.stays[i].name).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 30) + '.ics', 'text/calendar', ics); OA.toast('Reminder file saved. Open it to add it to your calendar.', 4000);
    },
    cpForecast() { return forecast(); },
    cpHidePacked() { P().hidePacked = !P().hidePacked; OA.saveSoon(); OA.render(true); },
    cpPackDel(el) { const t = T0(), id = el.dataset.id; if (t.pack.custom.find(c => c.id === id)) t.pack.custom = t.pack.custom.filter(c => c.id !== id); else t.pack.removed[id] = true; touch(); OA.render(true); },
    cpPackRestore() { T0().pack.removed = {}; touch(); OA.render(true); },
    cpPackAdd() { const t = T0(), i = OA.$('#cppadd'), c = OA.$('#cppcat'), v = i ? i.value.trim() : ''; if (!v) { OA.toast('Type an item first.'); return; } t.pack.custom.push({ id: 'u-' + OA.uid(), cat: c ? c.value : 'My items', text: v }); touch(); OA.render(true); },
    cpPackShare() { const t = T0(); return OA.share.send({ title: 'Packing list: ' + t.name, text: packText(t, true) }); },
    cpPackPrint() { const t = T0(); printOut('Packing list: ' + t.name, packText(t, false)); },
    cpAutoMeals() { const t = T0(), n = autoFill(t); touch(); OA.render(true); OA.toast(n ? 'Filled ' + n + ' meals. Tap any to change it.' : 'Nothing to fill, or no ideas fit your cooking choice.'); },
    cpClearMeals: async () => { const t = T0(); if (!await OA.confirm('Clear every meal on this trip?', 'Clear')) return; t.meals = {}; touch(); OA.render(true); },
    cpMealPick(el) { UI.mealKey = el.dataset.k; UI.mealSlot = el.dataset.sl; UI.mealTag = 'ok'; OA.sheet(SLOTS.find(s => s[0] === UI.mealSlot)[1], mealPickHTML()); },
    cpMealTag(el) { UI.mealTag = el.dataset.v; OA.redrawSheet(mealPickHTML()); },
    cpMealSet(el) { const t = T0(), x = IDEA[el.dataset.id]; if (!x) return; t.meals[UI.mealKey] = { id: x.id, text: x.name, tag: x.cook }; touch(); OA.closeSheet(); },
    cpMealCustom() { const t = T0(), i = OA.$('#cpmtext'), v = i ? i.value.trim() : ''; if (!v) { OA.toast('Type a meal first.'); return; } t.meals[UI.mealKey] = { id: null, text: v, tag: ['fire', 'stove', 'none'].includes(UI.mealTag) ? UI.mealTag : '' }; touch(); OA.closeSheet(); },
    cpMealClear() { const t = T0(); delete t.meals[UI.mealKey]; touch(); OA.closeSheet(); },
    cpGrocShare() { const t = T0(), g = groceries(t); const L = ['Groceries: ' + t.name]; g.forEach(x => L.push('[ ] ' + x.name + ' ' + x.q + (x.unit === 'ea' ? '' : ' ' + x.unit))); return OA.share.send({ title: 'Groceries: ' + t.name, text: L.join('\n') }); },
    cpExAdd() { const t = T0(), l = OA.$('#cpexl'), a = OA.$('#cpexa'); if (!l || !l.value.trim()) { OA.toast('Add a label first.'); return; } t.bud.extras = t.bud.extras || []; t.bud.extras.push({ id: OA.uid(), label: l.value.trim(), amt: num(a && a.value) }); touch(); OA.render(true); },
    cpExDel(el) { const t = T0(); t.bud.extras.splice(+el.dataset.i, 1); touch(); OA.render(true); },
    cpShare(el) { const t = T0(), leave = el.dataset.w === 'leave'; return OA.share.send({ title: (leave ? 'Camping plan: ' : '') + t.name, text: leave ? leaveText(t) : summaryText(t) }); },
    cpCopy: async el => { const t = T0(); try { await navigator.clipboard.writeText(el.dataset.w === 'leave' ? leaveText(t) : summaryText(t)); OA.toast('Copied.'); } catch (e) { OA.toast('Could not copy. Select the text and copy it.'); } },
    cpPrint(el) { const t = T0(); printOut(el.dataset.w === 'leave' ? 'Camping plan: ' + t.name : t.name, el.dataset.w === 'leave' ? leaveText(t) : summaryText(t)); }
  });
  function redrawIfWiz() { if (UI.sheetKind === 'wiz') redrawWiz(); else if (UI.sheetKind === 'edit' && cur()) OA.redrawSheet(editHTML(cur())); }
  function editHTML(t) {
    const b = tp(t), has = t.stays.length > 0;
    return groupWhen(b, t, !has) + (has ? '<p class="sm dim">Nights come from your stays (' + nightsOf(t) + ' now). Change them on the Stays tab.</p>' : '') + '<h3>Who</h3>' + groupWho(b + '.party', t.party) + '<h3>Sleeping in</h3>' + groupSleep(b + '.vehicle', t.vehicle) + '<button class="btn gold block" data-act="closeSheet">Done</button>';
  }

  /* ---------- public API ---------- */
  function nextTrip() {
    const today = OA.dkey();
    const c = trips().filter(t => validKey(t.startDate) && tripEnd(t) >= today).sort((a, b) => a.startDate < b.startDate ? -1 : 1);
    return c[0] || null;
  }
  function events() {
    const out = [], today = OA.dkey();
    trips().forEach(t => t.stays.forEach((s, i) => {
      const st = stayStart(t, i); if (!st || st < today) return;
      out.push({ t: 'Camp: ' + s.name, d: st, kind: 'camp' });
      if (!s.booked) { const b = bookOn(s, st); if (b && b.key >= today) out.push({ t: 'Book camp: ' + s.name, d: b.key, kind: 'camp' }); }
    }));
    return out.slice(0, 20);
  }
  /* create a trip from a Trips-tab idea: {id,title,days,campIds[],campNames[],...} */
  function addTrip(e) {
    try {
      if (!e || typeof e !== 'object') return false;
      const days = parseFloat(e.days), nights = isFinite(days) && days >= 2 ? Math.min(60, Math.round(days) - 1) : 2;
      const t = blankTrip({ name: String(e.title || e.name || 'Camping trip'), nights });
      const ids = Array.isArray(e.campIds) ? e.campIds : [], names = Array.isArray(e.campNames) ? e.campNames : [];
      const total = ids.length + names.length, per = Math.max(1, Math.floor(nights / Math.max(1, total)));
      let k = 0;
      const nn = () => per + (k++ === 0 ? Math.max(0, nights - per * total) : 0);
      ids.forEach(id => { const c = campOf(id); if (c) t.stays.push(mkStay(c, {}, nn())); else names.push(String(id)); });
      names.forEach(n => { if (n) t.stays.push(mkStay(null, { name: String(n) }, nn())); });
      if (Array.isArray(e.itinerary) && e.itinerary.length) t.notes = e.itinerary.map(x => 'Day ' + x.day + ': ' + x.text).join('\n');
      trips().push(t); P().cur = t.id; P().sec = 'overview'; touch();
      OA.toast('Trip created: ' + t.name); return true;
    } catch (x) { console.warn(x); OA.toast('Could not create the trip.'); return false; }
  }
  CPo.plan = {
    addTrip,
    addCamp: id => addCamp(id),
    trips: () => trips(), current: () => cur(), summary: () => summaryText(cur()),
    nextTrip, events, stayStart, tripEnd, nightsOf, campOf
  };
})();
