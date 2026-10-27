/* Roadtripica: Stops tab. Finds places along the way from OpenStreetMap (Overpass via OA.osm.around).
   One network request per tap (the "along the route" batch is the only exception: one request per chosen point, at least 2 s apart).
   Results are cached by the shell; the last search is also kept in the database so the list is there with no signal.
   Everything shown comes from OpenStreetMap volunteers and is unverified: the screen says so and asks people to call to confirm.
   API:  RT.stops.near(lat, lon, kind, radiusM) -> Promise<items>   kind = category id (sleep, eat, fuel, ev, groceries, rest, sights, services) or a sub-type id
         RT.stops.search({cat, subs, lat, lon, radiusMi | radiusM}) -> Promise<{items, stale, fromCache, truncated}>
         RT.stops.saved() -> saved places;  RT.stops.openNow(hoursString) -> {open, text} | null  (only plain 'Mo-Su 07:00-22:00' forms are understood) */
window.RT = window.RT || {};
(function () {
  'use strict';
  const esc = OA.esc, PAGE = 30, MI_M = 1609.344, MAXPTS = 8;

  OA.defaults({ stops: { view: 'find', cat: 'eat', sub: {}, radiusMi: 10, centre: { mode: '', q: '', lat: null, lon: null, name: '', ts: 0 }, sort: 'dist', filt: {}, saved: [] } });
  const S = () => {
    const s = OA.S.stops = OA.S.stops || {};
    s.saved = s.saved || []; s.sub = s.sub || {}; s.filt = s.filt || {}; s.centre = s.centre || { mode: '' };
    if (!s.cat) s.cat = 'eat'; if (!s.view) s.view = 'find'; if (!s.radiusMi) s.radiusMi = 10; if (!s.sort) s.sort = 'dist';
    return s;
  };
  const num = v => { v = parseFloat(v); return isFinite(v) ? v : null; };
  const title = s => String(s || '').replace(/_/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase());

  /* ---------------------------------------------------------------- what we can look for */
  const L = {
    hotel: 'Hotel', motel: 'Motel', guest_house: 'Guest house or B&B', hostel: 'Hostel', camp_site: 'Campground', caravan_site: 'RV / caravan park', chalet: 'Cabin or chalet',
    restaurant: 'Restaurant', fast_food: 'Fast food', cafe: 'Cafe', ice_cream: 'Ice cream', food_court: 'Food court', fuel: 'Fuel station', charging_station: 'EV charging',
    supermarket: 'Supermarket', convenience: 'Convenience store', playground: 'Playground', park: 'Park', rest_area: 'Rest area', services: 'Service area (highway)', picnic_site: 'Picnic site', toilets: 'Toilets',
    attraction: 'Attraction', viewpoint: 'Viewpoint', museum: 'Museum', zoo: 'Zoo', theme_park: 'Theme park', pharmacy: 'Pharmacy', hospital: 'Hospital', clinic: 'Clinic',
    car_repair: 'Car repair', tyres: 'Tire shop', car_wash: 'Car wash', sanitary_dump_station: 'RV dump station', water_point: 'Water fill point'
  };
  const CATS = [
    { id: 'sleep', label: 'Sleep', icon: 'bed', subs: [
      { id: 'hotel', label: 'Hotels and motels', q: [['tourism', 'hotel|motel|guest_house|hostel']] },
      { id: 'camp', label: 'Campgrounds and RV parks', q: [['tourism', 'camp_site|caravan_site']] },
      { id: 'cabin', label: 'Cabins', q: [['tourism', 'chalet']] }] },
    { id: 'eat', label: 'Eat', icon: 'fork', subs: [
      { id: 'rest', label: 'Restaurants', q: [['amenity', 'restaurant|food_court']] },
      { id: 'fast', label: 'Fast food', q: [['amenity', 'fast_food']] },
      { id: 'cafe', label: 'Cafes', q: [['amenity', 'cafe']] },
      { id: 'ice', label: 'Ice cream', q: [['amenity', 'ice_cream']] }] },
    { id: 'fuel', label: 'Fuel', icon: 'fuel', subs: [{ id: 'fuel', label: 'Fuel stations', q: [['amenity', 'fuel']] }] },
    { id: 'ev', label: 'EV charging', icon: 'bolt', subs: [{ id: 'ev', label: 'Charging stations', q: [['amenity', 'charging_station']] }] },
    { id: 'groceries', label: 'Groceries', icon: 'cart', subs: [
      { id: 'super', label: 'Supermarkets', q: [['shop', 'supermarket']] },
      { id: 'conv', label: 'Convenience stores', q: [['shop', 'convenience']] }] },
    { id: 'rest', label: 'Rest and kids', icon: 'tree', def: ['area', 'play', 'picnic', 'wc'], subs: [
      { id: 'area', label: 'Rest areas and services', q: [['highway', 'rest_area|services']] },
      { id: 'play', label: 'Playgrounds', q: [['leisure', 'playground']] },
      { id: 'park', label: 'Parks (can be many)', q: [['leisure', 'park']] },
      { id: 'picnic', label: 'Picnic sites', q: [['tourism', 'picnic_site']] },
      { id: 'wc', label: 'Toilets', q: [['amenity', 'toilets']] }] },
    { id: 'sights', label: 'Sights', icon: 'eye', def: ['attr', 'view', 'museum', 'zoo', 'theme'], subs: [
      { id: 'attr', label: 'Attractions', q: [['tourism', 'attraction']] },
      { id: 'view', label: 'Viewpoints', q: [['tourism', 'viewpoint']] },
      { id: 'museum', label: 'Museums', q: [['tourism', 'museum']] },
      { id: 'zoo', label: 'Zoos', q: [['tourism', 'zoo']] },
      { id: 'theme', label: 'Theme parks', q: [['tourism', 'theme_park']] },
      { id: 'hist', label: 'Historic sites (many)', q: [['historic', 'monument|memorial|castle|ruins|archaeological_site|battlefield|fort|manor']] }] },
    { id: 'services', label: 'Services', icon: 'first', def: ['pharm', 'hosp', 'repair'], subs: [
      { id: 'pharm', label: 'Pharmacies', q: [['amenity', 'pharmacy']] },
      { id: 'hosp', label: 'Hospitals and clinics', q: [['amenity', 'hospital|clinic']] },
      { id: 'repair', label: 'Car repair and tires', q: [['shop', 'car_repair|tyres']] },
      { id: 'wash', label: 'Car washes', q: [['amenity', 'car_wash']] },
      { id: 'dump', label: 'RV dump stations', q: [['amenity', 'sanitary_dump_station']] },
      { id: 'water', label: 'Water fill points', q: [['amenity', 'water_point']] }] }
  ];
  const catOf = id => CATS.find(c => c.id === id) || CATS[1];
  const subsOf = (cat, ids) => { const all = cat.subs.map(s => s.id), pick = (ids && ids.length ? ids : (cat.def || all)).filter(x => all.indexOf(x) >= 0); return pick.length ? pick : all; };
  const selSubs = cat => subsOf(cat, S().sub[cat.id]);
  const catIcon = id => (catOf(id).icon) || 'pin';

  function classify(t, cat) {
    for (const sub of cat.subs) for (const q of sub.q) {
      const v = t[q[0]]; if (v == null) continue;
      const first = String(v).split(';')[0].trim();
      if (new RegExp('^(' + q[1] + ')$').test(first)) return { sub: sub.id, kind: q[0] === 'historic' ? 'Historic: ' + title(first) : (L[first] || title(first)) };
    }
    return { sub: cat.subs[0].id, kind: cat.label };
  }
  const DROP = /^(source|note|fixme|check_date|survey|wikidata|wikipedia|image|name:|alt_name|old_|brand:|operator:|website:|contact:(?!phone$|website$)|payment:|ref:|addr:(?!housenumber$|street$|city$|state$|postcode$|unit$)|building|roof|toilets:|opening_hours:)/;
  function trimTags(t) {
    const o = {}; let n = 0;
    Object.keys(t || {}).forEach(k => { if (n > 45 || DROP.test(k) || k.length > 40) return; o[k] = String(t[k]).slice(0, 220); n++; });
    return o;
  }
  function mkItem(e, cat, c) {
    const k = classify(e.tags || {}, cat);
    const it = { id: e.id, name: e.name || '', lat: e.lat, lon: e.lon, cat: cat.id, sub: k.sub, kind: k.kind, t: trimTags(e.tags) };
    if (c) { it.d = OA.geo.mi(c, it); it.brg = OA.geo.bearing(c, it); }
    return it;
  }

  /* ---------------------------------------------------------------- the one network call */
  async function fetchAround(lat, lon, cat, subIds, radiusMi) {
    const filters = [];
    cat.subs.filter(s => subIds.indexOf(s.id) >= 0).forEach(s => s.q.forEach(q => filters.push('nwr["' + q[0] + '"~"^(' + q[1] + ')$"]')));
    const c = { lat: +lat.toFixed(3), lon: +lon.toFixed(3) };      // rounded so the same spot reuses the cached answer
    const r = await OA.osm.around(c.lat, c.lon, Math.round(radiusMi * MI_M), filters, 2 * 86400000);
    const items = r.items.map(e => mkItem(e, cat, { lat, lon })).sort((a, b) => a.d - b.d);
    return { items, stale: !!r.stale, fromCache: !!r.fromCache, truncated: r.items.length >= 400 };
  }
  const subFor = id => { for (const c of CATS) { if (c.id === id) return { cat: c, subs: null }; if (c.subs.find(s => s.id === id)) return { cat: c, subs: [id] }; } return null; };
  RT.stops = Object.assign(RT.stops || {}, {
    search(o) {
      o = o || {}; const cat = catOf(o.cat), lat = num(o.lat), lon = num(o.lon);
      if (lat == null || lon == null) return Promise.reject(new Error('No place to search around.'));
      const mi = o.radiusMi != null ? +o.radiusMi : (o.radiusM != null ? o.radiusM / MI_M : 10);
      return fetchAround(lat, lon, cat, subsOf(cat, o.subs), OA.clamp(mi, 0.5, 60));
    },
    near(lat, lon, kind, radiusM) {
      const f = subFor(kind); if (!f) return Promise.reject(new Error('Unknown kind: ' + kind));
      return RT.stops.search({ cat: f.cat.id, subs: f.subs, lat, lon, radiusM: radiusM || 16000 }).then(r => { const a = r.items; a.stale = r.stale; a.fromCache = r.fromCache; return a; });
    },
    saved: () => S().saved.slice(),
    openNow: s => openNow(s)
  });

  /* ---------------------------------------------------------------- opening hours: only plain forms are understood, anything else is shown raw */
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const fmtMin = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM'; return ((h % 12) || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap; };
  function parseHours(s) {
    s = String(s || '').trim(); if (!s) return null;
    if (s === '24/7') return { all: true };
    const sched = new Array(7).fill(null), D = '(?:Mo|Tu|We|Th|Fr|Sa|Su)', DR = D + '(?:-' + D + ')?', T = '\\d{1,2}:\\d{2}-\\d{1,2}:\\d{2}';
    const re = new RegExp('^(?:(' + DR + '(?:,' + DR + ')*) )?(off|' + T + '(?:,' + T + ')*)$');
    for (const raw of s.split(';')) {
      const r = raw.trim().replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ','); if (!r) continue;
      const m = r.match(re); if (!m) return null;
      let days = [0, 1, 2, 3, 4, 5, 6];
      if (m[1]) { days = []; for (const part of m[1].split(',')) { const ab = part.split('-'), a = DAYS.indexOf(ab[0]), b = ab[1] ? DAYS.indexOf(ab[1]) : a; for (let i = a, g = 0; g < 8; i = (i + 1) % 7, g++) { days.push(i); if (i === b) break; } } }
      let ranges = [];
      if (m[2] !== 'off') for (const tr of m[2].split(',')) {
        const p = tr.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/); if (!p) return null;
        const h1 = +p[1], m1 = +p[2], h2 = +p[3], m2 = +p[4];
        if (h1 > 24 || h2 > 24 || m1 > 59 || m2 > 59) return null;
        const a = h1 * 60 + m1; let b = h2 * 60 + m2; if (b === a) return null; if (b < a) b += 1440;
        ranges.push([a, b]);
      }
      days.forEach(d => { sched[d] = ranges; });
    }
    return { sched };
  }
  function openNow(s, when) {
    const p = parseHours(s); if (!p) return null;
    if (p.all) return { open: true, text: 'Listed as open 24 hours' };
    const d = when || new Date(), dow = (d.getDay() + 6) % 7, mins = d.getHours() * 60 + d.getMinutes();
    const today = p.sched[dow], yest = p.sched[(dow + 6) % 7];
    if (yest) for (const r of yest) if (r[1] > 1440 && mins < r[1] - 1440) return { open: true, text: 'Listed as open now, until ' + fmtMin(r[1]) };
    if (!today) return null;                       // no rule for today: unknown, do not guess
    for (const r of today) if (mins >= r[0] && mins < r[1]) return { open: true, text: 'Listed as open now, until ' + fmtMin(r[1]) };
    const later = today.filter(r => r[0] > mins).sort((a, b) => a[0] - b[0])[0];
    return { open: false, text: later ? 'Listed as closed now, opens ' + fmtMin(later[0]) : 'Listed as closed now' };
  }

  /* ---------------------------------------------------------------- tag helpers */
  const phoneOf = i => (i.t.phone || i.t['contact:phone'] || '').trim();
  const telHref = p => { const f = String(p).split(/[;,]/)[0].replace(/[^\d+]/g, ''); return f.length >= 7 ? 'tel:' + f : ''; };
  const webOf = i => {
    let w = String(i.t.website || i.t['contact:website'] || i.t.url || '').trim(); if (!w) return '';
    if (!/^https?:\/\//i.test(w)) { if (/^[a-z]+:/i.test(w) || /\s/.test(w)) return ''; w = 'https://' + w; }
    try { const u = new URL(w); return /^https?:$/.test(u.protocol) && u.hostname.indexOf('.') > 0 ? u.href : ''; } catch (e) { return ''; }
  };
  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const yes = (t, k) => t[k] === 'yes' || t[k] === 'only';
  function addrOf(i) {
    const t = i.t, l1 = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '), l2 = [t['addr:city'], [t['addr:state'], t['addr:postcode']].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return [l1, l2].filter(Boolean).join(', ');
  }
  const nameOf = i => i.name || i.t.operator || ('Unnamed ' + String(i.kind || 'place').toLowerCase());
  const SOCK = { type2_combo: 'CCS', ccs: 'CCS', chademo: 'CHAdeMO', type2: 'Type 2', type1: 'J1772', tesla_supercharger: 'Tesla', tesla_standard: 'Tesla', nacs: 'NACS', tesla_destination: 'Tesla destination', nema_14_50: 'NEMA 14-50', nema_5_20: 'NEMA 5-20', 'nema_5_15': 'NEMA 5-15' };
  function sockets(i) {
    const out = [];
    Object.keys(i.t).forEach(k => {
      const m = k.match(/^socket:([a-z0-9_]+)$/); if (!m) return;
      const v = i.t[k]; if (v === 'no') return;
      const out_ = i.t[k + ':output'], n = /^\d+$/.test(v) ? ' x' + v : '';
      out.push((SOCK[m[1]] || title(m[1])) + n + (out_ ? ' (' + out_ + ')' : ''));
    });
    return out;
  }
  const isTesla = i => /tesla/i.test([i.t.operator, i.t.brand, i.name].join(' ')) || !!(i.t['socket:tesla_supercharger'] || i.t['socket:nacs']);
  const FILTERS = {
    all: [{ id: 'named', label: 'Named only', t: i => !!i.name }, { id: 'phone', label: 'Has phone', t: i => !!phoneOf(i) }, { id: 'web', label: 'Has website', t: i => !!webOf(i) }],
    sleep: [{ id: 'rv', label: 'RV friendly', t: i => i.t.caravans === 'yes' || i.t.tourism === 'caravan_site' }, { id: 'power', label: 'Power hookups', t: i => yes(i.t, 'power_supply') }, { id: 'dog', label: 'Dogs: tagged yes', t: i => yes(i.t, 'dog') }, { id: 'tent', label: 'Tents', t: i => i.t.tents === 'yes' }],
    eat: [{ id: 'veg', label: 'Vegetarian', t: i => yes(i.t, 'diet:vegetarian') }, { id: 'vegan', label: 'Vegan', t: i => yes(i.t, 'diet:vegan') }, { id: 'out', label: 'Outdoor seating', t: i => yes(i.t, 'outdoor_seating') }, { id: 'take', label: 'Takeaway', t: i => yes(i.t, 'takeaway') }, { id: 'drive', label: 'Drive-through', t: i => yes(i.t, 'drive_through') }],
    fuel: [{ id: 'diesel', label: 'Diesel', t: i => yes(i.t, 'fuel:diesel') }, { id: 'lpg', label: 'Propane / LPG', t: i => yes(i.t, 'fuel:lpg') }, { id: 'h24', label: 'Open 24/7 (listed)', t: i => i.t.opening_hours === '24/7' }],
    ev: [{ id: 'nacs', label: 'Tesla / NACS', t: isTesla }, { id: 'ccs', label: 'CCS', t: i => !!(i.t['socket:type2_combo'] || i.t['socket:ccs']) }, { id: 'chademo', label: 'CHAdeMO', t: i => !!i.t['socket:chademo'] }, { id: 'j1772', label: 'J1772', t: i => !!i.t['socket:type1'] }],
    groceries: [{ id: 'h24', label: 'Open 24/7 (listed)', t: i => i.t.opening_hours === '24/7' }],
    sights: [{ id: 'free', label: 'Free (tagged)', t: i => i.t.fee === 'no' }],
    services: [{ id: 'er', label: 'Emergency dept (tagged)', t: i => i.t.emergency === 'yes' }, { id: 'h24', label: 'Open 24/7 (listed)', t: i => i.t.opening_hours === '24/7' }]
  };
  const filtersFor = cat => (FILTERS[cat] || []).concat(FILTERS.all);
  const activeFilt = cat => { const f = S().filt[cat]; if (f) return f; return { ids: cat === 'sights' ? ['named'] : [], cuisine: '' }; };
  const infoScore = i => (phoneOf(i) ? 1 : 0) + (webOf(i) ? 1 : 0) + (i.t.opening_hours ? 1 : 0) + (addrOf(i) ? 1 : 0) + (i.name ? 1 : 0);
  const cuisines = i => String(i.t.cuisine || '').split(';').map(x => x.trim()).filter(Boolean);

  /* ---------------------------------------------------------------- screen state (not saved) */
  const ui = { res: null, busy: false, err: '', page: 1, shown: [], places: [], placeMsg: '', typing: false, cur: null, loaded: false,
    route: { sel: null, prog: [], run: false, cancel: false } };
  const centre = () => { const c = S().centre; return c && num(c.lat) != null && num(c.lon) != null ? c : null; };
  function setCentre(mode, lat, lon, name) { const c = S().centre; c.mode = mode; c.lat = lat; c.lon = lon; c.name = name || ''; c.ts = Date.now(); OA.save(); }
  function redraw() { if (OA.current && OA.current() === 'stops' && !OA.sheetOpen()) OA.render(true); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const savedIdx = id => S().saved.findIndex(x => x.id === id);
  const compass = b => OA.geo.compass(b);

  function routePoints() {
    let a = []; try { if (window.RT && RT.trip && RT.trip.points) { const r = RT.trip.points(); a = Array.isArray(r) ? r : (r && (r.points || r.items || r.list)) || []; } } catch (e) { a = []; }
    return a.map((p, i) => {
      if (!p) return null; const lat = num(p.lat != null ? p.lat : p.latitude), lon = num(p.lon != null ? p.lon : (p.lng != null ? p.lng : p.longitude));
      return lat != null && lon != null ? { i, lat, lon, name: String(p.name || p.label || p.title || p.place || ('Point ' + (i + 1))), note: p.nights > 0 ? p.nights + ' night' + (p.nights > 1 ? 's' : '') : (p.kind || '') } : null;
    }).filter(Boolean);
  }
  function routeSel(pts) {
    const r = ui.route;
    if (!r.sel || r.n !== pts.length) {
      r.n = pts.length; r.sel = {};
      if (pts.length <= MAXPTS) pts.forEach(p => { r.sel[p.i] = true; });
      else for (let k = 0; k < MAXPTS; k++) r.sel[pts[Math.round(k * (pts.length - 1) / (MAXPTS - 1))].i] = true;
    }
    return r.sel;
  }

  /* ---------------------------------------------------------------- remembered last search (works with no signal) */
  function persist() {
    const R = ui.res; if (!R) return;
    OA.db.put('kv', { id: 'rs-last', ts: R.ts, res: R }).catch(() => { });
  }
  function loadLast() {
    if (ui.loaded) return; ui.loaded = true;
    OA.db.get('kv', 'rs-last').then(o => { if (o && o.res && !ui.res) { ui.res = o.res; ui.res.restored = true; ui.page = 1; redraw(); } }).catch(() => { });
  }

  /* ---------------------------------------------------------------- searching */
  const errText = e => (OA.online() ? 'The map service did not answer (' + (e && e.message || 'error') + '). Try again in a minute.' : 'You are offline and there is no saved copy of this exact search. Showing your last results below if there are any.');
  async function doSearch() {
    if (ui.busy) return; const s = S(), cat = catOf(s.cat); let c = centre();
    if (!c) {       // nothing chosen yet: the Search tap itself asks for your location
      ui.busy = true; redraw();
      try { const f = await OA.geo.position({ timeout: 12000 }); setCentre('here', f.lat, f.lon, 'My location'); } catch (e) { ui.busy = false; redraw(); OA.toast('Choose where to look first. ' + e.message, 5000); return; }
      c = centre(); ui.busy = false;
    }
    ui.busy = true; ui.err = ''; redraw();
    try {
      const subs = selSubs(cat), r = await fetchAround(c.lat, c.lon, cat, subs, s.radiusMi);
      ui.res = { mode: 'find', cat: cat.id, subs, radiusMi: s.radiusMi, centre: { lat: c.lat, lon: c.lon, name: c.name || 'the centre', here: c.mode === 'here' }, items: r.items, stale: r.stale, fromCache: r.fromCache, truncated: r.truncated, ts: Date.now() };
      ui.page = 1; persist();
    } catch (e) { ui.err = errText(e); }
    ui.busy = false; redraw(); toResults();
  }
  function toResults() { setTimeout(() => { const e = OA.$('#rs-res'); if (e && e.scrollIntoView) e.scrollIntoView({ block: 'start' }); }, 60); }
  async function doRoute() {
    const R = ui.route; if (R.run) return;
    const pts = routePoints(), sel = routeSel(pts), chosen = pts.filter(p => sel[p.i]);
    if (!chosen.length) { OA.toast('Tick at least one point on your route.'); return; }
    const s = S(), cat = catOf(s.cat), subs = selSubs(cat);
    R.run = true; R.cancel = false; ui.err = '';
    R.prog = chosen.map(p => ({ name: p.name, state: 'wait', n: 0 })); redraw();
    const all = new Map(); let lastEnd = 0, lastNet = false, fails = 0, stale = false, trunc = false;
    for (let k = 0; k < chosen.length; k++) {
      if (R.cancel) break;
      if (lastNet) { const wait = 2000 - (Date.now() - lastEnd); if (wait > 0) await sleep(wait); }
      if (R.cancel) break;
      const p = chosen[k]; R.prog[k].state = 'run'; redraw();
      try {
        const r = await fetchAround(p.lat, p.lon, cat, subs, s.radiusMi); lastNet = !r.fromCache; lastEnd = Date.now();
        stale = stale || r.stale; trunc = trunc || r.truncated; R.prog[k].state = 'ok'; R.prog[k].n = r.items.length;
        r.items.forEach(it => { it.grp = k; it.grpName = p.name; const o = all.get(it.id); if (!o || it.d < o.d) all.set(it.id, it); });
      } catch (e) { R.prog[k].state = 'err'; fails++; lastNet = true; lastEnd = Date.now(); if (!OA.online()) break; }
    }
    R.prog.forEach(p => { if (p.state === 'wait' || p.state === 'run') p.state = 'skip'; });
    if (all.size || !fails) {
      ui.res = { mode: 'route', cat: cat.id, subs, radiusMi: s.radiusMi, centre: { name: 'your route' }, items: Array.from(all.values()), groups: chosen.map(p => p.name), stale, fromCache: false, truncated: trunc, ts: Date.now(), failed: fails };
      ui.page = 1; persist();
    } else ui.err = errText(null);
    R.run = false; redraw(); if (ui.res && ui.res.mode === 'route') toResults();
  }

  /* ---------------------------------------------------------------- views */
  const chip = (act, on, label, data) => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" ${data || ''}>${label}</button>`;
  function head() {
    const s = S(), v = s.view;
    return OA.header('Stops', 'Places along the way, from OpenStreetMap') +
      `<div class="chips rs-views">${chip('rsView', v === 'find', 'Find', 'data-v="find"')}${chip('rsView', v === 'route', 'Along the route', 'data-v="route"')}${chip('rsView', v === 'saved', 'My stops (' + s.saved.length + ')', 'data-v="saved"')}</div>`;
  }
  function centreCard() {
    const s = S(), c = centre(), m = s.centre.mode, st = OA.S.trip && OA.S.trip.searchAt, hasSA = st && num(st.lat) != null && num(st.lon) != null;
    const where = c ? `<b>${esc(c.name || OA.geo.fmtCoord(c.lat, c.lon, 'dd'))}</b><div class="xs dim">${esc(OA.geo.fmtCoord(c.lat, c.lon, 'dd'))}${m === 'here' && c.ts ? ' · fix ' + esc(OA.ago(c.ts)) : ''}</div>` : '<span class="dim">Not chosen yet. Use your location, a point on your trip, or type a place.</span>';
    return `<div class="card"><div class="ct"><span>Where to look</span></div>${where}
      <div class="chips wrap rs-chips">${chip('rsCentre', m === 'here', 'My location', 'data-m="here"')}${chip('rsCentre', m === 'trip', 'Trip point', 'data-m="trip"')}${hasSA ? chip('rsCentre', m === 'search', 'Search area', 'data-m="search"') : ''}${chip('rsCentre', ui.typing || m === 'typed', 'Type a place', 'data-m="typed"')}</div>
      ${ui.typing || m === 'typed' && ui.places.length ? `<div class="row mid"><input class="in" id="rs-q" placeholder="Town, park or address" value="${esc(s.centre.q || '')}" enterkeyhint="search" style="margin:0"><button class="btn" data-act="rsGeo" style="flex:none">Look up</button></div><div class="xs dim">One lookup per tap (OpenStreetMap Nominatim). Needs signal unless you searched it before.</div>` : ''}
      ${ui.placeMsg ? `<div class="sm warn" style="margin-top:6px">${esc(ui.placeMsg)}</div>` : ''}
      ${ui.places.length ? `<div class="rs-places">${ui.places.map((p, i) => `<div class="li" data-act="rsPlace" data-i="${i}"><div class="tx"><b>${esc(p.short)}</b><span>${esc(p.name)}</span></div><div class="end">${OA.icon('chev')}</div></div>`).join('')}</div>` : ''}</div>`;
  }
  function whatCard(route) {
    const s = S(), cat = catOf(s.cat), sel = selSubs(cat);
    const rads = [2, 5, 10, 25, 50];
    return `<div class="card"><div class="ct"><span>What are you looking for?</span></div>
      <div class="chips wrap rs-chips">${CATS.map(c => chip('rsCat', c.id === cat.id, esc(c.label), 'data-c="' + c.id + '"')).join('')}</div>
      ${cat.subs.length > 1 ? `<div class="xs dim">Include (tap to change):</div><div class="chips wrap rs-chips">${cat.subs.map(x => chip('rsSub', sel.indexOf(x.id) >= 0, esc(x.label), 'data-s="' + x.id + '"')).join('')}</div>` : ''}
      <label class="fl">${route ? 'Distance from each point' : 'How far from the centre'}<select class="in" data-bind="stops.radiusMi" data-type="number">${rads.map(r => `<option value="${r}" ${r === +s.radiusMi ? 'selected' : ''}>${esc(OA.dist(r, 0))}</option>`).join('')}</select></label>
      ${cat.id === 'services' ? '<div class="alert danger"><b class="t">In an emergency call 911</b>This list is for planning. Do not use it to find help in an emergency.</div>' : ''}
      ${route ? '' : `<button class="btn gold block" data-act="rsSearch" ${ui.busy ? 'disabled' : ''}>${ui.busy ? '<span class="spin"></span> Searching…' : 'Search ' + esc(cat.label.toLowerCase())}</button>`}</div>`;
  }
  function routeCard() {
    const pts = routePoints(), R = ui.route;
    if (!pts.length) return `<div class="card"><div class="ct"><span>Along the route</span></div><p>Plan a trip first. Add a start, an end and any overnight stops in the Trip tab, then come back here to look for hotels, fuel and food near each one.</p><button class="btn block" data-go="trip">Open Trip</button></div>`;
    const sel = routeSel(pts), n = pts.filter(p => sel[p.i]).length;
    return `<div class="card"><div class="ct"><span>Points to search near</span><span class="dim xs">${n} of up to ${MAXPTS}</span></div>
      <div class="xs dim">One search per point, about 2 seconds apart to be gentle on the free map service. Searches you have already done are reused without waiting.</div>
      ${pts.map(p => `<label class="chk"><input type="checkbox" data-act="rsPt" data-i="${p.i}" ${sel[p.i] ? 'checked' : ''} ${R.run ? 'disabled' : ''}><span>${esc(p.name)}${p.note ? ` <span class="tag">${esc(p.note)}</span>` : ''}</span></label>`).join('')}
      ${R.prog.length ? `<ul class="rs-prog">${R.prog.map(p => `<li class="${p.state}"><span>${esc(p.name)}</span><span>${p.state === 'wait' ? 'waiting' : p.state === 'run' ? '<span class="spin"></span> searching' : p.state === 'ok' ? p.n + ' found' : p.state === 'err' ? 'no answer' : 'skipped'}</span></li>`).join('')}</ul>` : ''}
      ${R.run ? '<button class="btn block" data-act="rsRouteStop">Stop after this one</button>' : `<button class="btn gold block" data-act="rsRoute">Search ${esc(catOf(S().cat).label.toLowerCase())} near ${n} point${n === 1 ? '' : 's'}</button>`}</div>`;
  }

  function filtered() {
    const R = ui.res, f = activeFilt(R.cat), defs = filtersFor(R.cat);
    let a = R.items.slice();
    f.ids.forEach(id => { const d = defs.find(x => x.id === id); if (d) a = a.filter(d.t); });
    if (f.cuisine) a = a.filter(i => cuisines(i).indexOf(f.cuisine) >= 0);
    const sort = S().sort;
    a = a.slice();
    const g = i => i.grp == null ? 0 : i.grp;
    if (sort === 'name') a.sort((x, y) => g(x) - g(y) || nameOf(x).localeCompare(nameOf(y)));
    else if (sort === 'info') a.sort((x, y) => g(x) - g(y) || infoScore(y) - infoScore(x) || x.d - y.d);
    else a.sort((x, y) => g(x) - g(y) || x.d - y.d);
    return a;
  }
  function hoursShort(i, here) {
    const h = i.t.opening_hours;
    if (h) { const o = here ? openNow(h) : null; return o ? `<span class="rs-hrs ${o.open ? 'g' : 'w'}">${esc(o.text)}</span>` : `<span class="rs-hrs">Hours listed: ${esc(h.length > 70 ? h.slice(0, 68) + '…' : h)}</span>`; }
    const need = { eat: 1, fuel: 1, groceries: 1, services: 1, sights: i.sub === 'museum' || i.sub === 'zoo' || i.sub === 'theme' };
    return need[i.cat] ? '<span class="rs-hrs">Hours: call to confirm</span>' : '';
  }
  function tagsShort(i) {
    const t = i.t, out = [];
    if (i.cat === 'fuel') { if (yes(t, 'fuel:diesel')) out.push('Diesel'); if (yes(t, 'fuel:lpg')) out.push('Propane'); if (t.opening_hours === '24/7') out.push('24/7 listed'); }
    if (i.cat === 'ev') { sockets(i).slice(0, 3).forEach(x => out.push(x)); if (t.capacity) out.push(t.capacity + ' spots'); }
    if (i.cat === 'eat') { cuisines(i).slice(0, 2).forEach(x => out.push(title(x))); if (yes(t, 'diet:vegetarian')) out.push('Vegetarian'); if (yes(t, 'outdoor_seating')) out.push('Outdoor'); if (yes(t, 'takeaway')) out.push('Takeaway'); }
    if (i.cat === 'sleep') { if (t.stars) out.push(t.stars + ' star'); if (t.caravans === 'yes' || t.tourism === 'caravan_site') out.push('RV'); if (yes(t, 'power_supply')) out.push('Power'); if (t.fee) out.push(t.fee === 'no' ? 'Free' : t.fee === 'yes' ? 'Fee' : ''); }
    if (i.cat === 'sights' && t.fee) out.push(t.fee === 'no' ? 'Free' : t.fee === 'yes' ? 'Fee' : '');
    if (phoneOf(i)) out.push('Phone');
    return out.filter(Boolean).slice(0, 5).map(x => `<span class="tag">${esc(x)}</span>`).join('');
  }
  function resultsCard() {
    const R = ui.res, s = S();
    if (!R) {
      return `<div class="card center"><div style="margin:6px 0">${OA.icon('map', 'lg')}</div><b>No search yet</b><p class="sm dim">${centre() ? 'Pick what you need and tap Search. One tap is one request to the free map service.' : 'Choose where to look, then pick what you need and tap Search.'}</p></div>`;
    }
    const cat = catOf(R.cat), defs = filtersFor(R.cat), f = activeFilt(R.cat);
    const list = filtered(); ui.shown = list;
    const cs = {}; if (R.cat === 'eat') R.items.forEach(i => cuisines(i).forEach(c => { cs[c] = (cs[c] || 0) + 1; }));
    const topC = Object.keys(cs).sort((a, b) => cs[b] - cs[a]).slice(0, 8);
    const fil = defs.map(d => chip('rsFilt', f.ids.indexOf(d.id) >= 0, esc(d.label), 'data-f="' + d.id + '"')).join('') + topC.map(c => chip('rsCuisine', f.cuisine === c, esc(title(c)), 'data-c="' + esc(c) + '"')).join('');
    const upto = list.slice(0, ui.page * PAGE);
    let body = '', lastG = null;
    upto.forEach((i, k) => {
      if (R.mode === 'route' && i.grp !== lastG) { lastG = i.grp; body += `<div class="rs-grp">Near ${esc(i.grpName)}</div>`; }
      const saved = savedIdx(i.id) >= 0;
      body += `<div class="li" data-act="rsOpen" data-i="${k}"><div class="ic">${OA.icon(catIcon(i.cat))}</div><div class="tx"><b>${esc(nameOf(i))}${saved ? ' <span class="gold" title="Saved">★</span>' : ''}</b><span>${esc(i.kind)} · ${esc(OA.dist(i.d, 1))} ${esc(compass(i.brg))}</span>${hoursShort(i, R.centre.here)}<span>${tagsShort(i)}</span></div><div class="end">${OA.icon('chev')}</div></div>`;
    });
    if (!list.length) body = `<p class="sm dim center">${R.items.length ? 'Nothing matches those filters. Turn one off above.' : 'No ' + esc(cat.label.toLowerCase()) + ' places found in this area. In OpenStreetMap that can also mean nobody has mapped them yet, so try a wider distance.'}</p>`;
    const age = R.ts ? OA.ago(R.ts) : '';
    return `<div class="card" id="rs-res"><div class="ct"><span>${list.length} place${list.length === 1 ? '' : 's'}${list.length !== R.items.length ? ' of ' + R.items.length : ''}</span><span class="xs dim">${esc(cat.label)} · ${esc(OA.dist(R.radiusMi, 0))} of ${esc(R.centre.name || 'centre')}</span></div>
      ${R.restored ? `<div class="alert"><b class="t">Last search, saved on this phone</b>From ${esc(age)}. Search again when you have signal to refresh.</div>` : (R.stale || R.fromCache && !OA.online() ? `<div class="alert"><b class="t">Saved copy</b>${R.stale ? 'No signal or no answer, so this is an older copy' : 'Shown from a recent copy'} (${esc(age)}).</div>` : '')}
      ${R.truncated ? '<div class="alert"><b class="t">Very busy area</b>The map data limit was reached, so some places are not shown. Use a smaller distance or fewer types.</div>' : ''}
      ${R.failed ? `<div class="alert"><b class="t">${R.failed} point${R.failed === 1 ? '' : 's'} did not answer</b>Search again for those later.</div>` : ''}
      <div class="chips wrap rs-chips">${fil}</div>
      <label class="fl rs-sort">Sort<select class="in" data-bind="stops.sort" data-then="rsRedraw"><option value="dist" ${s.sort === 'dist' ? 'selected' : ''}>Nearest first</option><option value="name" ${s.sort === 'name' ? 'selected' : ''}>A to Z</option><option value="info" ${s.sort === 'info' ? 'selected' : ''}>Most details listed</option></select></label>
      <div>${body}</div>
      ${list.length > upto.length ? `<button class="btn block" data-act="rsMore">Show ${Math.min(PAGE, list.length - upto.length)} more (${list.length - upto.length} left)</button>` : ''}
      <div class="foot">${esc(HONEST)}</div></div>`;
  }
  const HONEST = 'OpenStreetMap volunteers, details unverified: call to confirm. Hours, phone numbers and what is open can be out of date. Fuel prices, ratings and live availability are not in this data.';

  function savedView() {
    const a = S().saved, k = OA.geo.known();
    if (!a.length) return `<div class="card center"><div style="margin:6px 0">${OA.icon('star', 'lg')}</div><b>No saved stops yet</b><p class="sm dim">Open any place in Find and tap Save. Saved places keep their details on this phone, so they work with no signal.</p><button class="btn gold block" data-act="rsView" data-v="find">Find a place</button></div>`;
    return `<div class="card"><div class="ct"><span>My stops</span><span class="xs dim">${a.length}</span></div>${a.map((i, n) => `<div class="li" data-act="rsOpenSaved" data-i="${n}"><div class="ic">${OA.icon(catIcon(i.cat))}</div><div class="tx"><b>${esc(nameOf(i))}</b><span>${esc(i.kind)}${k ? ' · ' + esc(OA.dist(OA.geo.mi(k, i), 0)) + ' from your last fix' : ''}</span>${i.note ? `<span>${esc(i.note.slice(0, 80))}</span>` : ''}</div><div class="end">${OA.icon('chev')}</div></div>`).join('')}
      <div class="row"><button class="btn" data-act="rsShareSaved">Share list</button><button class="btn danger" data-act="rsClearSaved">Clear all</button></div></div>`;
  }

  OA.tab({
    id: 'stops', label: 'Stops', icon: 'pin', order: 20,
    render() {
      const s = S(); loadLast();
      const sa = OA.S.trip && OA.S.trip.searchAt;
      if (sa && num(sa.lat) != null && num(sa.lon) != null && (sa.ts || 1) > (s.centre.saTs || 0)) {       // the Trip tab asked us to look around a point
        setCentre('search', +sa.lat, +sa.lon, sa.label || sa.name || 'Search area'); s.centre.saTs = sa.ts || 1;
        s.view = 'find'; ui.typing = false; ui.places = []; if (sa.kind === 'stay') s.cat = 'sleep'; else if (sa.kind === 'ev') s.cat = 'ev'; else if (sa.kind === 'fuel') s.cat = 'fuel';
      }
      if (!centre() && OA.geo.known()) { const k = OA.geo.known(); s.centre.mode = 'here'; s.centre.lat = k.lat; s.centre.lon = k.lon; s.centre.name = 'My last known location'; s.centre.ts = k.ts || Date.now(); }
      let h = head();
      if (s.view === 'saved') return h + savedView() + `<div class="foot">${esc(HONEST)}</div>`;
      h += s.view === 'route' ? routeCard() + whatCard(true) : centreCard() + whatCard(false);
      if (ui.err) h += `<div class="alert danger"><b class="t">Search did not finish</b>${esc(ui.err)}</div>`;
      if (!OA.online()) h += '<div class="alert"><b class="t">No signal</b>Searches you have already made still work. A new search needs signal.</div>';
      h += resultsCard();
      h += `<div class="row"><button class="btn" data-act="rsAbout" data-smoke>About this data</button></div>`;
      return h;
    }
  });

  /* ---------------------------------------------------------------- place sheet */
  const FIELD = { operator: 'Operator', brand: 'Brand', cuisine: 'Cuisine', 'diet:vegetarian': 'Vegetarian', 'diet:vegan': 'Vegan', outdoor_seating: 'Outdoor seating', takeaway: 'Takeaway', delivery: 'Delivery', drive_through: 'Drive-through', wheelchair: 'Wheelchair access', internet_access: 'Internet', fee: 'Fee', charge: 'Charge', stars: 'Stars', rooms: 'Rooms', capacity: 'Capacity', 'fuel:diesel': 'Diesel', 'fuel:lpg': 'Propane / LPG', 'fuel:e85': 'E85', 'fuel:HGV_diesel': 'Truck diesel', dog: 'Dogs', caravans: 'RVs / caravans', tents: 'Tents', power_supply: 'Power', toilets: 'Toilets', shower: 'Showers', drinking_water: 'Drinking water', openfire: 'Fires', maxstay: 'Max stay', access: 'Access', emergency: 'Emergency dept', description: 'Note on map', ele: 'Elevation (m)', authentication: 'Authentication' };
  const val = v => v === 'yes' ? 'Yes' : v === 'no' ? 'No' : v === 'only' ? 'Only' : String(v).replace(/_/g, ' ').replace(/;/g, ', ');
  const BOOK = i => {
    const q = encodeURIComponent([nameOf(i), i.t['addr:city'] || ''].filter(Boolean).join(' '));
    const l = [{ t: 'Search the web', u: 'https://www.google.com/search?q=' + q + '+' + (i.sub === 'camp' ? 'campground+reservations' : 'rates') }];
    if (i.sub === 'hotel' || i.sub === 'cabin') l.push({ t: 'Booking.com search', u: 'https://www.booking.com/searchresults.html?ss=' + q });
    if (i.sub === 'camp') l.push({ t: 'Recreation.gov search', u: 'https://www.recreation.gov/search?q=' + encodeURIComponent(nameOf(i)) });
    return l;
  };
  const ASK = ['What is the nightly rate with all taxes and fees (resort, parking, pet)?', 'Do you have a room or site free on my dates, and what is the cancellation deadline?', 'Pets: are they allowed, what is the fee, and are there size limits?', 'RVs and trailers: what is the parking height clearance, site length and hookup type? Is there a pull-through?', 'Do kids stay free, and can we have a room that sleeps everyone?', 'What time is check-in, and can we arrive late? How do we get in after hours?', 'Is breakfast included? Is there a fridge or microwave in the room?', 'Is the lot lit and safe for leaving a loaded car overnight?'];
  function placeHtml(i) {
    const R = ui.res, here = !i.cn && R && R.centre && R.centre.here, t = i.t, ph = phoneOf(i), tel = telHref(ph), web = webOf(i), ad = addrOf(i), sv = savedIdx(i.id) >= 0;
    const hrs = t.opening_hours, on = hrs && here ? openNow(hrs) : null, ml = OA.geo.mapLinks(i.lat, i.lon, nameOf(i));
    const rows = [];
    if (i.cat === 'ev') { const sk = sockets(i); if (sk.length) rows.push(['Plugs (as tagged)', sk.join(', ')]); }
    Object.keys(FIELD).forEach(k => { if (t[k] != null && t[k] !== '') rows.push([FIELD[k], val(t[k])]); });
    if (t.opening_hours && !FIELD.opening_hours) { /* shown in its own block */ }
    const raw = Object.keys(t).sort().map(k => `<div class="kv"><span>${esc(k)}</span><span class="rs-rawv">${esc(t[k])}</span></div>`).join('');
    const sk = savedIdx(i.id), note = sk >= 0 ? S().saved[sk].note || '' : '';
    const canAdd = window.RT && RT.trip && typeof RT.trip.addStop === 'function';
    return `<div class="card"><div class="ct"><span>${esc(i.kind)}</span>${i.d != null ? `<span class="xs dim">${esc(OA.dist(i.d, 1))} ${esc(compass(i.brg))} of ${esc(i.cn != null ? i.cn : ((R && R.centre && R.centre.name) || 'centre'))}</span>` : ''}</div>
      <h2 class="big" style="margin-top:0">${esc(nameOf(i))}</h2>
      ${ad ? `<div class="sm">${esc(ad)}</div>` : '<div class="sm dim">No address listed.</div>'}
      <div class="xs dim">${esc(OA.geo.fmtCoord(i.lat, i.lon, 'dd'))}</div>
      ${tel ? `<a class="btn gold block" href="${esc(tel)}">Call ${esc(ph.split(/[;]/)[0])}</a>` : `<div class="alert"><b class="t">No phone number listed</b>${web ? 'Try the website below.' : 'Look it up on the web or in your maps app.'}</div>`}
      <div class="row wrap rs-links"><a class="btn" href="${esc(ml.apple)}" target="_blank" rel="noopener">Apple Maps</a><a class="btn" href="${esc(ml.google)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="${esc(ml.osm)}" target="_blank" rel="noopener">OpenStreetMap</a></div>
      ${web ? `<a class="btn block" href="${esc(web)}" target="_blank" rel="noopener">Website: ${esc(hostOf(web))}</a>` : ''}</div>
    <div class="card"><div class="ct"><span>Hours</span></div>
      ${hrs ? `<div class="sm">Listed hours: <b>${esc(hrs)}</b></div>${on ? `<div class="sm ${on.open ? 'green' : 'warn'}">${esc(on.text)} by your phone's clock. Call to confirm.</div>` : '<div class="sm dim">Hours: call to confirm.</div>'}` : '<div class="sm">Hours: call to confirm. None are listed on the map.</div>'}</div>
    ${rows.length ? `<div class="card"><div class="ct"><span>Details on the map</span></div>${rows.map(r => `<div class="kv"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>` : ''}
    ${i.cat === 'sleep' ? sleepBlock(i, ph, tel) : ''}
    ${i.cat === 'ev' ? '<div class="alert"><b class="t">Before you rely on it</b>Plug types and counts are what volunteers entered, and chargers go offline. Check a charging app for live status and price.</div>' : ''}
    ${i.cat === 'fuel' ? '<div class="alert"><b class="t">No prices here</b>OpenStreetMap does not carry fuel prices. For RVs and trailers, check overhead canopy height and room to turn before you pull in.</div>' : ''}
    ${i.cat === 'services' && /hospital|clinic/i.test(i.kind) ? '<div class="alert danger"><b class="t">Emergency? Call 911</b>Do not drive by this list in an emergency.</div>' : ''}
    <div class="card"><div class="ct"><span>My stop</span></div>
      <div class="row"><button class="btn ${sv ? '' : 'gold'}" data-act="rsSave">${sv ? '★ Saved: tap to remove' : 'Save to My stops'}</button>${canAdd ? '<button class="btn" data-act="rsAdd">Add to trip</button>' : ''}</div>
      ${sv ? `<label class="fl">Note (kept on this phone)<textarea class="in" rows="2" data-onchange="rsNote" placeholder="Called, room held until 6 pm…">${esc(note)}</textarea></label>` : ''}
      <button class="btn block" data-act="rsShareOne">Share this place</button></div>
    <div class="foot">${esc(HONEST)}</div>
    <details class="rs-raw"><summary class="sm dim">All map tags for this place</summary>${raw || '<div class="sm dim">None.</div>'}<div class="xs dim">Map id ${esc(i.id)}</div></details>`;
  }
  function sleepBlock(i, ph, tel) {
    const links = BOOK(i);
    return `<div class="card hot"><div class="ct"><span>Call to check rates and availability</span></div>
      <p class="sm">The map does not know prices or whether there is a room. A short call is the reliable way. Ask:</p>
      <ul class="ls sm rs-ask">${ASK.slice(0, i.sub === 'camp' ? 8 : 8).map(q => `<li>${esc(q)}</li>`).join('')}</ul>
      ${tel ? `<a class="btn gold block" href="${esc(tel)}">Call now</a>` : ''}
      <div class="xs dim" style="margin-top:6px">Plain search links, no affiliate tracking. Prices there can differ from the property's own.</div>
      <div class="row wrap rs-links">${links.map(l => `<a class="btn" href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join('')}</div>
      <button class="btn block" data-act="rsShareAsk">Copy the questions</button></div>`;
  }
  function openPlace(i) { ui.cur = i; OA.sheet(nameOf(i), placeHtml(i)); }
  const strip = i => ({ id: i.id, name: i.name, lat: i.lat, lon: i.lon, cat: i.cat, sub: i.sub, kind: i.kind, t: i.t });

  /* ---------------------------------------------------------------- actions */
  async function useHere() {
    OA.toast('Finding you…');
    try { const f = await OA.geo.position({ timeout: 12000 }); setCentre('here', f.lat, f.lon, 'My location'); ui.places = []; ui.typing = false; ui.placeMsg = ''; }
    catch (e) { const k = OA.geo.known(); if (k) { setCentre('here', k.lat, k.lon, 'My last known location'); OA.toast(e.message + ' Using your last known location.', 4500); } else OA.toast(e.message, 4500); }
    redraw();
  }
  function tripPointSheet() {
    const pts = routePoints();
    const html = pts.length ? `<p class="sm dim">Search around one of the points on your trip.</p><div class="card">${pts.map(p => `<div class="li" data-act="rsPickPt" data-i="${p.i}"><div class="ic">${OA.icon('pin')}</div><div class="tx"><b>${esc(p.name)}</b><span>${esc(p.note || OA.geo.fmtCoord(p.lat, p.lon, 'dd'))}</span></div></div>`).join('')}</div>` : '<div class="card"><p>No trip points yet. Plan a trip in the Trip tab first.</p><button class="btn gold block" data-go="trip">Open Trip</button></div>';
    OA.sheet('Pick a trip point', html);
  }
  OA.act({
    rsView(el) { S().view = el.dataset.v; OA.saveSoon(); OA.render(true); },
    rsCat(el) { const s = S(); s.cat = el.dataset.c; ui.page = 1; OA.saveSoon(); OA.render(true); },
    rsSub(el) {
      const s = S(), cat = catOf(s.cat), cur = selSubs(cat).slice(), id = el.dataset.s, k = cur.indexOf(id);
      if (k >= 0) { if (cur.length === 1) { OA.toast('Keep at least one type.'); return; } cur.splice(k, 1); } else cur.push(id);
      s.sub[cat.id] = cur; OA.saveSoon(); OA.render(true);
    },
    rsCentre(el) {
      const m = el.dataset.m, s = S();
      if (m === 'here') { ui.typing = false; return useHere(); }
      if (m === 'trip') { tripPointSheet(); return; }
      if (m === 'search') { const st = OA.S.trip && OA.S.trip.searchAt; if (st && num(st.lat) != null) { setCentre('search', +st.lat, +st.lon, st.label || st.name || 'Search area'); ui.places = []; ui.typing = false; } OA.render(true); return; }
      if (m === 'typed') { ui.typing = true; OA.render(true); setTimeout(() => { const q = OA.$('#rs-q'); if (q) q.focus(); }, 60); }
      void s;
    },
    rsPickPt(el) {
      const p = routePoints().find(x => x.i === +el.dataset.i); if (!p) return;
      setCentre('trip', p.lat, p.lon, p.name); ui.places = []; ui.typing = false; OA.closeSheet();
    },
    async rsGeo() {
      const q = ((OA.$('#rs-q') || {}).value || '').trim(); if (q.length < 2) { OA.toast('Type a town, park or address.'); return; }
      S().centre.q = q; OA.saveSoon(); ui.placeMsg = 'Looking up…'; ui.places = []; OA.render(true);
      try { const r = await OA.geocode(q); ui.places = r.slice(0, 6); ui.placeMsg = r.length ? '' : 'Nothing found. Try the town and state.'; }
      catch (e) { ui.placeMsg = OA.online() ? 'The place lookup did not answer. Try again in a minute.' : 'Place lookup needs signal (or a search you made before).'; }
      OA.render(true);
    },
    rsPlace(el) { const p = ui.places[+el.dataset.i]; if (!p) return; setCentre('typed', p.lat, p.lon, p.short); ui.places = []; ui.placeMsg = ''; ui.typing = false; OA.render(true); },
    rsSearch() { return doSearch(); },
    rsRoute() { return doRoute(); },
    rsRouteStop() { ui.route.cancel = true; OA.toast('Stopping after the current search.'); },
    rsPt(el) {
      const pts = routePoints(), sel = routeSel(pts), i = +el.dataset.i;
      if (el.checked && pts.filter(p => sel[p.i]).length >= MAXPTS) { el.checked = false; OA.toast('Up to ' + MAXPTS + ' points per search.'); return; }
      sel[i] = el.checked; OA.render(true);
    },
    rsFilt(el) {
      const s = S(), cat = ui.res ? ui.res.cat : s.cat, cur = activeFilt(cat), ids = cur.ids.slice(), id = el.dataset.f, k = ids.indexOf(id);
      if (k >= 0) ids.splice(k, 1); else ids.push(id);
      s.filt[cat] = { ids, cuisine: cur.cuisine || '' }; ui.page = 1; OA.saveSoon(); OA.render(true);
    },
    rsCuisine(el) { const s = S(), cat = ui.res ? ui.res.cat : s.cat, cur = activeFilt(cat); s.filt[cat] = { ids: cur.ids.slice(), cuisine: cur.cuisine === el.dataset.c ? '' : el.dataset.c }; ui.page = 1; OA.saveSoon(); OA.render(true); },
    rsRedraw() { ui.page = 1; OA.render(true); },
    rsMore() { ui.page++; OA.render(true); },
    rsOpen(el) { const i = ui.shown[+el.dataset.i]; if (i) openPlace(i); },
    rsOpenSaved(el) {
      const i = S().saved[+el.dataset.i]; if (!i) return; const k = OA.geo.known();
      openPlace(Object.assign({}, i, k ? { d: OA.geo.mi(k, i), brg: OA.geo.bearing(k, i), cn: 'your last fix' } : { cn: '' }));
    },
    rsSave() {
      const i = ui.cur; if (!i) return; const s = S(), k = savedIdx(i.id);
      if (k >= 0) s.saved.splice(k, 1); else { s.saved.unshift(Object.assign(strip(i), { ts: Date.now(), note: '' })); OA.toast('Saved to My stops.'); }
      OA.save(); OA.redrawSheet(placeHtml(i));
    },
    rsNote(el) { const k = ui.cur ? savedIdx(ui.cur.id) : -1; if (k >= 0) { S().saved[k].note = el.value.slice(0, 500); OA.saveSoon(); } },
    rsAdd() {
      const i = ui.cur; if (!i) return;
      try {
        const kind = i.sub === 'camp' ? 'camp' : (i.cat === 'sleep' ? 'hotel' : i.cat === 'sights' ? 'sight' : 'stop'), tel = phoneOf(i), notes = [i.kind, tel ? 'Phone ' + tel : '', webOf(i), 'From OpenStreetMap, unverified: call to confirm.'].filter(Boolean).join('. ');
        const r = RT.trip.addStop({ label: nameOf(i), name: nameOf(i), lat: i.lat, lon: i.lon, kind, notes, ref: 'osm:' + i.id });
        OA.toast(!r ? 'The trip did not accept that stop.' : 'Added to your trip.');
      } catch (e) { OA.toast('Could not add: ' + e.message); }
    },
    rsShareOne() {
      const i = ui.cur; if (!i) return; const ml = OA.geo.mapLinks(i.lat, i.lon, nameOf(i)), ph = phoneOf(i);
      OA.share.send({ title: nameOf(i), text: [nameOf(i) + ' (' + i.kind + ')', addrOf(i), ph ? 'Phone: ' + ph : '', ml.google].filter(Boolean).join('\n') });
    },
    rsShareAsk() { OA.share.send({ title: 'Questions to ask', text: 'Questions to ask the property:\n' + ASK.map(q => '- ' + q).join('\n') }); },
    rsShareSaved() { const a = S().saved; OA.share.send({ title: 'My stops', text: a.map(i => nameOf(i) + ' (' + i.kind + ')\n' + OA.geo.mapLinks(i.lat, i.lon).google).join('\n\n') }); },
    async rsClearSaved() { if (await OA.confirm('Remove all ' + S().saved.length + ' saved stops from this phone?', 'Remove all')) { S().saved = []; OA.save(); OA.render(true); } },
    rsAbout() {
      OA.sheet('About this data', `<div class="card"><p>Places come from <b>OpenStreetMap</b>, a map that volunteers edit, through the free Overpass service. It is very good in some areas and thin in others.</p>
        <ul class="ls sm"><li>Names, phone numbers, websites and hours can be old or wrong. <b>Call to confirm</b> before you drive out of your way.</li><li>Hours are only called "open now" when the map lists plain hours such as <i>Mo-Su 07:00-22:00</i>, and then by your phone's clock. Anything else is shown as written.</li><li>No prices, ratings, reviews or live availability. No claim is made about overnight parking at stores: ask the store.</li><li>One tap makes one request. Results are saved on this phone, so the list is there with no signal. The last search is kept for the next time you open the app.</li><li>The distance is in a straight line from the centre, not a driving distance.</li></ul></div>`);
    }
  });
})();
