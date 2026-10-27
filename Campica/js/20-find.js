/* Campica: Find tab (home). Curated campgrounds (window.CAMPS.items) + optional live OpenStreetMap results.
   Exports on window.CP (other tabs call these defensively):
     CP.camp(id)            -> campground object | null (curated, last OSM search, or an OSM camp the user saved)
     CP.campCard(itemOrId, opts) -> html string for a result card (opts: {compare:false, smoke:true}); data-act="cfOpen" opens the detail
     CP.campDetail(id)      -> opens the detail sheet
     CP.campFee(item)       -> '$30–$44/night, as of 2026-10' | 'fees: check with the source'
     CP.campsAll()          -> curated items array (never undefined)
     CP.savedCamps()        -> [{id,name,ts,note,status}] from S.saved.list
   Nothing here is invented: every null field shows "check with the source". */
window.CP = window.CP || {};
(function () {
  'use strict';
  const CP = window.CP, esc = OA.esc, G = OA.geo, S = () => OA.S;
  const CHECK = 'check with the source';
  OA.defaults({
    find: { place: null, homes: [], q: '', radius: 50, sort: 'near', types: [], am: [], kid: [], rvFt: null, hookups: false, maxPrice: null, agency: '', region: '', openNow: false, winFrom: '', winTo: '', strict: false, hideNoPos: false, osmSaved: {} },
    saved: { list: [], notes: [] }
  });
  const ui = { shown: 30, sig: '', cmp: [], geo: null, whereOpen: null, osm: null, osmBusy: false, osmErr: '', osmLoaded: false, osmById: {}, busy: false, geoMsg: '' };

  /* ---------- small helpers ---------- */
  const num = v => v != null && v !== '' && typeof v !== 'boolean' && isFinite(+v);
  const safeUrl = u => (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : '';
  const link = (u, label) => safeUrl(u) ? `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(label || u)}</a>` : '';
  const telHref = p => 'tel:' + String(p).replace(/[^\d+]/g, '');
  const looksPhone = p => typeof p === 'string' && /^[+\d][\d\s().\-+x]{6,}$/.test(p.trim());
  const cap = s => { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); };
  const money = n => '$' + (+n % 1 ? (+n).toFixed(2) : Math.round(+n));
  const SYS = { reservecalifornia: 'ReserveCalifornia', 'recreation.gov': 'Recreation.gov', 'first-come': 'First come', other: 'Other system' };
  const sysName = s => s ? (SYS[s] || String(s)) : '';
  const STATUS = { open: ['Open', 'g'], seasonal: ['Seasonal', 'w'], limited: ['Limited', 'w'], 'closed-check': ['Closed? check', 'r'] };
  const TYPES = [['tent', 'Tent'], ['rv', 'RV'], ['cabin', 'Cabin'], ['yurt', 'Yurt'], ['group', 'Group'], ['walk-in', 'Walk-in'], ['hike-in', 'Hike-in'], ['boat-in', 'Boat-in'], ['equestrian', 'Horse']];
  const TLAB = {}; TYPES.forEach(t => TLAB[t[0]] = t[1]);
  const AM = [['showers', 'Showers', 'drop'], ['flush', 'Flush toilets', 'home'], ['vault', 'Vault toilets', 'home'], ['water', 'Drinking water', 'water'], ['dump', 'Dump station', 'fuel'], ['store', 'Camp store', 'cart'], ['wifi', 'Wi-Fi', 'wifi'], ['firepit', 'Fire rings', 'flame'], ['bearBox', 'Bear boxes', 'bear'], ['laundry', 'Laundry', 'tool'], ['pets', 'Pets', 'heart'], ['ada', 'Accessible sites', 'info'], ['cell', 'Cell service', 'phone']];
  const AMF = ['showers', 'flush', 'water', 'dump', 'pets', 'ada'];
  const KID = [['swim', 'Swimming'], ['beach', 'Beach'], ['playground', 'Playground'], ['juniorRanger', 'Junior Ranger'], ['rangerPrograms', 'Ranger programs'], ['easyTrails', 'Easy trails'], ['fishing', 'Fishing'], ['boating', 'Boating'], ['bikeFriendly', 'Bike friendly']];
  const KIDF = ['swim', 'beach', 'playground', 'juniorRanger', 'easyTrails', 'fishing'];
  const lab = (arr, k) => { const r = arr.find(x => x[0] === k); return r ? r[1] : k; };
  /* three-state reading of a value: true / false / null (unknown) */
  function tri(v) {
    if (v === true) return true; if (v === false) return false;
    if (typeof v === 'string') { const s = v.trim().toLowerCase(); if (!s) return null; if (/^(no|none|false|not allowed)/.test(s)) return false; return true; }
    return null;
  }
  const triText = v => { const t = tri(v); return t === null ? null : typeof v === 'string' ? cap(v) : (t ? 'Yes' : 'No'); };

  /* ---------- data access ---------- */
  let idxN = -1, idx = {};
  CP.campsAll = () => { const c = window.CAMPS; return c && Array.isArray(c.items) ? c.items.filter(x => x && x.id && x.name != null) : []; };
  function index() { const a = CP.campsAll(); if (a.length !== idxN) { idx = {}; a.forEach(x => idx[x.id] = x); idxN = a.length; } return idx; }
  CP.camp = id => {
    if (id == null) return null;
    return index()[id] || ui.osmById[id] || (S().find.osmSaved || {})[id] || null;
  };
  CP.savedCamps = () => (S().saved.list || []).slice();
  const savedHas = id => (S().saved.list || []).some(x => x.id === id);

  /* ---------- fees, seasons, booking windows (all tolerant of missing data) ---------- */
  CP.campFee = it => {
    const f = (it && it.fees) || {}, a = num(f.nightlyMin) ? +f.nightlyMin : null, b = num(f.nightlyMax) ? +f.nightlyMax : null;
    if (a == null && b == null) return 'fees: ' + CHECK;
    const asof = f.asof ? ', as of ' + f.asof : '';
    if (a != null && b != null && a !== b) return money(Math.min(a, b)) + '–' + money(Math.max(a, b)) + '/night' + asof;
    if (a != null && b == null) return 'from ' + money(a) + '/night' + asof;
    return money(a != null ? a : b) + '/night' + asof;
  };
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function md(s, isClose) {
    const m = String(s == null ? '' : s).trim().toLowerCase().match(/^([a-z]{3,9})\.?\s*(\d{1,2})?(?:st|nd|rd|th)?$/);
    if (!m) return null; const mo = MON.indexOf(m[1].slice(0, 3));
    if (mo < 0 || !/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)$/.test(m[1])) return null;
    return [mo, m[2] ? +m[2] : (isClose ? 31 : 1)];
  }
  /* true / false from clear season dates, null when the dates are vague or missing */
  function openOn(it, date) {
    const s = it && it.season; if (!s) return null;
    if (s.open && /year[- ]?round|all year/i.test(String(s.open))) return true;
    const a = md(s.open, false), b = md(s.close, true); if (!a || !b) return null;
    const x = date.getMonth() * 100 + date.getDate(), p = a[0] * 100 + a[1], q = b[0] * 100 + b[1];
    return p <= q ? (x >= p && x <= q) : (x >= p || x <= q);
  }
  function aheadDays(win) {
    const m = String(win || '').match(/(\d+)\s*(month|week|day)s?\s*(?:ahead|in advance|before|prior|out|rolling)/i); if (!m) return null;
    return +m[1] * (/month/i.test(m[2]) ? 30.4 : /week/i.test(m[2]) ? 7 : 1);
  }
  function bookableOn(it, key) {
    const b = it.booking || {}; if (!key) return null;
    if (b.system === 'first-come') return true;
    const d = aheadDays(b.window); if (d == null) return null;
    return OA.daysBetween(OA.dkey(), key) <= d;
  }
  const opensOnKey = (it, key) => { const d = aheadDays(it.booking && it.booking.window); if (d == null || !key) return null; return OA.addDays(key, -Math.round(d)); };

  /* ---------- OpenStreetMap items -> same shape, unknown stays null ---------- */
  const yn = v => v == null ? null : /^(yes|true|1)$/i.test(v) ? true : /^(no|false|0)$/i.test(v) ? false : null;
  function fromOsm(e) {
    const t = e.tags || {}, id = 'osm-' + e.id, ph = t.phone || t['contact:phone'] || null, web = t.website || t['contact:website'] || t.url || null;
    const types = []; if (yn(t.tents) === true) types.push('tent');
    if (yn(t.caravans) === true || t.tourism === 'caravan_site') types.push('rv');
    if (yn(t.group_only) === true) types.push('group');
    const dog = t.dog == null ? null : /^yes$/i.test(t.dog) ? 'yes' : /^no$/i.test(t.dog) ? false : /leash/i.test(t.dog) ? 'limited' : null;
    const tl = t.toilets == null ? null : yn(t.toilets);
    return {
      id, osm: true, osmType: e.type, name: e.name || '', parent: t.operator || null, agency: null, state: null, region: null, county: null, lat: e.lat, lon: e.lon, elevFt: null,
      season: { open: null, close: null, note: t.opening_hours ? 'Hours per OpenStreetMap: ' + t.opening_hours : null }, status: null, statusNote: null, types,
      sites: { total: num(t.capacity) ? +t.capacity : null, rv: null, tent: num(t.tents) ? +t.tents : null, maxRvFt: null, maxTrailerFt: null, hookups: yn(t.power_supply) === true ? 'power listed' : (yn(t.power_supply) === false ? 'none' : null), hookupNote: null },
      amenities: { showers: yn(t.shower), flush: /flush/i.test(t['toilets:disposal'] || '') ? true : null, vault: /pit_latrine|chemical|bucket/i.test(t['toilets:disposal'] || '') ? true : null, water: yn(t.drinking_water), dump: yn(t.sanitary_dump_station), store: null, wifi: t.internet_access == null ? null : /^(wlan|wifi|yes|wired)$/i.test(t.internet_access) ? true : (/^no$/i.test(t.internet_access) ? false : null), firepit: null, bearBox: null, laundry: null, pets: dog, ada: yn(t.wheelchair), cell: null, toilets: tl },
      family: {}, fees: { nightlyMin: null, nightlyMax: null, extraVehicle: null, reservationFee: null, note: t.fee == null ? null : (yn(t.fee) === true ? 'OpenStreetMap says a fee is charged; the amount is not listed.' : yn(t.fee) === false ? 'OpenStreetMap says there is no fee. Confirm before you go.' : null), asof: null },
      booking: { system: null, url: web, phone: ph, window: null, firstComeNote: t.reservation ? 'OpenStreetMap reservation tag: ' + t.reservation : null, cancelNote: null },
      contact: { phone: ph, email: t.email || t['contact:email'] || null, url: web, address: [t['addr:housenumber'], t['addr:street'], t['addr:city']].filter(Boolean).join(' ') || null },
      highlights: [], cautions: [], src: ['https://www.openstreetmap.org/' + e.type + '/' + String(e.id).replace(/^\D+/, '')], asof: OA.dkey().slice(0, 7), fetched: Date.now()
    };
  }
  const STOP = /\b(campground|campgrounds|camp ground|campsite|camping|camp|state park|national park|state recreation area|sra|the|rv park|rv|park|area|and|of|at|site)\b/g;
  const nameKey = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(STOP, ' ').split(/\s+/).filter(Boolean);
  function sim(a, b) { const A = new Set(nameKey(a)), B = new Set(nameKey(b)); if (!A.size || !B.size) return 0; let n = 0; A.forEach(x => { if (B.has(x)) n++; }); return n / Math.min(A.size, B.size); }
  function dupOf(o, cur) {
    return cur.some(c => {
      if (!num(c.lat) || !num(c.lon)) return false;
      const d = G.mi(o, c); if (d >= 0.5) return false;
      if (!o.name) return d < 0.15;
      return sim(o.name, c.name) >= 0.6 || sim(o.name, c.parent) >= 0.8;
    });
  }

  /* ---------- the where-am-I bar ---------- */
  const place = () => { const p = S().find.place; return p && num(p.lat) && num(p.lon) ? p : null; };
  function setPlace(p) { S().find.place = { lat: p.lat, lon: p.lon, name: p.name, src: p.src, ts: Date.now() }; ui.geo = null; ui.geoMsg = ''; ui.whereOpen = false; ui.shown = 30; OA.save(); OA.render(true); }
  function whereCard() {
    const p = place(), F = S().find, open = ui.whereOpen == null ? !p : ui.whereOpen;
    const here = p && F.homes.find(h => Math.abs(h.lat - p.lat) < 1e-4 && Math.abs(h.lon - p.lon) < 1e-4);
    const known = G.known();
    let h = `<div class="card cf-where"><div class="ct"><span>${OA.icon('pin')} ${p ? 'Searching near' : 'Where are you camping?'}</span>${OA.online() ? '' : '<span class="offline-pill">offline</span>'}</div>`;
    if (p) h += `<div class="cf-place"><div><b>${esc(p.name || 'Chosen spot')}</b><div class="dim xs">${p.src === 'gps' ? 'GPS fix' : p.src === 'home' ? 'Home base' : 'Searched place'} · ${esc(OA.ago(p.ts || Date.now()))}${OA.online() ? '' : ' · using the saved spot'}</div></div><button class="mini" data-act="cfWhere">${open ? 'Hide' : 'Change'}</button></div>`;
    else h += `<p class="sm dim">Pick a starting point to see distances. You can still browse every campground below without one.</p>`;
    if (open) {
      h += `<div class="row"><button class="btn gold" data-act="cfLocate">${ui.busy ? '<span class="spin"></span> Finding you…' : 'Use my location'}</button></div>`;
      if (!p && known) h += `<p class="xs dim">Last known position: ${esc(OA.ago(known.ts || Date.now()))}. It is used if the GPS is unavailable.</p>`;
      h += `<div class="cf-q"><input class="in" id="cfplace" type="search" placeholder="Or type a town or park" autocomplete="off" aria-label="Type a place"><button class="btn" data-act="cfGeo">Find</button></div>`;
      if (ui.geoMsg) h += `<p class="sm warn">${esc(ui.geoMsg)}</p>`;
      if (ui.geo && ui.geo.length) h += `<div class="cf-geo">${ui.geo.map((g, i) => `<div class="li" data-act="cfPick" data-i="${i}"><div class="ic">${OA.icon('pin')}</div><div class="tx"><b>${esc(g.short)}</b><span>${esc(g.name)}</span></div></div>`).join('')}</div>`;
      if (F.homes.length) h += `<div class="xs dim" style="margin-top:6px">Home bases</div><div class="chips">${F.homes.map(x => `<button class="chip ${here && here.id === x.id ? 'on' : ''}" data-act="cfHome" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>`;
      if (p && !here) h += `<button class="mini" data-act="cfHomeSave">Save this spot as a home base</button>`;
      if (here) h += `<button class="mini" data-act="cfHomeDel" data-id="${esc(here.id)}">Remove home base “${esc(here.name)}”</button>`;
    }
    return h + '</div>';
  }

  /* ---------- filtering ---------- */
  function filterCount() {
    const F = S().find;
    return F.types.length + F.am.length + F.kid.length + (num(F.rvFt) ? 1 : 0) + (F.hookups ? 1 : 0) + (num(F.maxPrice) ? 1 : 0) + (F.agency ? 1 : 0) + (F.region ? 1 : 0) + (F.openNow ? 1 : 0) + (F.winFrom ? 1 : 0) + (F.strict ? 1 : 0) + (F.hideNoPos ? 1 : 0);
  }
  /* returns null if excluded, else {warns:[...]} */
  function evalItem(it, F, P) {
    const warns = [], strict = !!F.strict, unk = () => !strict;
    const q = (F.q || '').trim().toLowerCase();
    if (q) { const hay = [it.name, it.parent, it.region, it.county, it.state, it.agency].join(' ').toLowerCase(); if (!q.split(/\s+/).every(w => hay.indexOf(w) >= 0)) return null; }
    let d = null, brg = null;
    if (P && num(it.lat) && num(it.lon)) { d = G.mi(P, it); brg = G.bearing(P, it); }
    const nopos = !(num(it.lat) && num(it.lon));
    if (nopos && F.hideNoPos) return null;
    if (P && F.radius && d != null && d > F.radius) return null;
    if (F.agency && it.agency !== F.agency) return null;
    if (F.region && it.region !== F.region) return null;
    const ty = Array.isArray(it.types) ? it.types : [];
    if (F.types.length) { if (ty.length) { if (!F.types.some(t => ty.indexOf(t) >= 0)) return null; } else if (!unk()) return null; }
    const s = it.sites || {};
    if (num(F.rvFt)) { if (num(s.maxRvFt)) { if (+s.maxRvFt < +F.rvFt) return null; } else if (unk()) warns.push('RV length unknown'); else return null; }
    if (F.hookups) { const hk = s.hookups; if (hk == null || hk === '') { if (unk()) warns.push('Hookups unknown'); else return null; } else if (tri(hk) === false) return null; }
    if (num(F.maxPrice)) { const m = it.fees && num(it.fees.nightlyMin) ? +it.fees.nightlyMin : null; if (m != null) { if (m > +F.maxPrice) return null; } else if (!unk()) return null; }
    for (const k of F.am) { const t = tri((it.amenities || {})[k]); if (t === false) return null; if (t === null && !unk()) return null; }
    for (const k of F.kid) { const t = tri((it.family || {})[k]); if (t === false) return null; if (t === null && !unk()) return null; }
    if (F.openNow) { const o = openOn(it, new Date()); if (o === false) return null; if (o === null && !unk()) return null; }
    if (F.winFrom) {
      const from = F.winFrom, to = F.winTo && F.winTo >= from ? F.winTo : from;
      const oa = openOn(it, OA.parseKey(from)), ob = openOn(it, OA.parseKey(to));
      if (oa === false || ob === false) return null;
      const bk = bookableOn(it, from); if (bk === false) return null;
      if ((oa === null || bk === null) && !unk()) return null;
    }
    return { warns, d, brg, nopos };
  }
  function itemsNow() {
    const out = CP.campsAll().slice();
    if (ui.osm && Array.isArray(ui.osm.items)) ui.osm.items.forEach(o => { ui.osmById[o.id] = o; out.push(o); });
    return out;
  }
  function compute() {
    const F = S().find, P = place(), rows = [];
    itemsNow().forEach(it => { const r = evalItem(it, F, P); if (r) { r.it = it; rows.push(r); } });
    const sort = F.sort === 'near' && !P ? 'name' : F.sort;
    const nm = (a, b) => String(a.it.name).localeCompare(String(b.it.name));
    if (sort === 'near') rows.sort((a, b) => (a.d == null) - (b.d == null) || (a.d - b.d) || nm(a, b));
    else if (sort === 'cheap') { const pr = r => r.it.fees && num(r.it.fees.nightlyMin) ? +r.it.fees.nightlyMin : null; rows.sort((a, b) => (pr(a) == null) - (pr(b) == null) || (pr(a) - pr(b)) || nm(a, b)); }
    else rows.sort(nm);
    return { rows, sort, P };
  }

  /* ---------- cards ---------- */
  function amenityIcons(it) {
    const a = it.amenities || {}, got = AM.filter(x => tri(a[x[0]]) === true && x[0] !== 'cell' && x[0] !== 'vault' || (x[0] === 'vault' && a.vault === true && a.flush !== true)).slice(0, 3);
    if (!got.length) return `<span class="xs dim">amenities: ${CHECK}</span>`;
    return got.map(x => `<span class="cf-am" title="${esc(x[1])}">${OA.icon(x[2], 'sm')}<span>${esc(x[1])}</span></span>`).join('');
  }
  function cardHtml(it, w, o) {
    o = o || {};
    const P = place(); if (!w) w = P ? evalItem(it, { q: '', radius: 0, types: [], am: [], kid: [], agency: '', region: '' }, P) || {} : {};
    const d = w.d, st = STATUS[it.status], b = it.booking || {};
    const dist = d != null ? `<div class="cf-dist"><b>${esc(OA.dist(d, d < 10 ? 1 : 0))}</b><span>${esc(G.compass(w.brg))}</span></div>` : '';
    const tags = [];
    if (it.osm) tags.push('<span class="tag a">OpenStreetMap</span>');
    if (it.agency) tags.push(`<span class="tag">${esc(it.agency)}</span>`);
    if (st) tags.push(`<span class="tag ${st[1]}">${st[0]}</span>`);
    (it.types || []).slice(0, 4).forEach(t => tags.push(`<span class="tag g">${esc(TLAB[t] || t)}</span>`));
    if (b.system) tags.push(`<span class="tag a">${esc(sysName(b.system))}</span>`);
    if (w.nopos || !(num(it.lat) && num(it.lon))) tags.push('<span class="tag w">no map position</span>');
    else if (it.coordApprox) tags.push('<span class="tag w">approx. position</span>');
    (w.warns || []).forEach(x => tags.push(`<span class="tag w">${esc(x)}</span>`));
    if (savedHas(it.id)) tags.push('<span class="tag g">Saved</span>');
    const sub = [it.parent, it.county, it.region && !it.county ? regionLabel(it.region) : null].filter(Boolean).join(' · ');
    const cmp = o.compare === false ? '' : `<button class="cf-cmpb ${ui.cmp.indexOf(it.id) >= 0 ? 'on' : ''}" data-act="cfCmp" data-id="${esc(it.id)}" aria-pressed="${ui.cmp.indexOf(it.id) >= 0}">${ui.cmp.indexOf(it.id) >= 0 ? '✓ Comparing' : 'Compare'}</button>`;
    return `<div class="card cf-card ${it.osm ? 'cf-osm' : ''}" data-act="cfOpen" data-id="${esc(it.id)}" role="button" tabindex="0" ${o.smoke ? 'data-smoke' : ''}>
      <div class="cf-top"><div class="cf-nm"><b>${esc(it.name || 'Unnamed camp site')}</b>${sub ? `<span class="dim sm">${esc(sub)}</span>` : ''}</div>${dist}</div>
      <div class="cf-tags">${tags.join('')}</div>
      <div class="cf-fee sm">${esc(CP.campFee(it))}</div>
      ${it.osm ? '<div class="cf-unv xs">from OpenStreetMap, details unverified: call to confirm</div>' : ''}
      <div class="cf-bot"><div class="cf-ams">${amenityIcons(it)}</div>${cmp}</div></div>`;
  }
  CP.campCard = (x, o) => { const it = typeof x === 'string' ? CP.camp(x) : x; return it ? cardHtml(it, null, o) : ''; };

  /* ---------- results list ---------- */
  const REGION_LABELS = { 'yosemite': 'Yosemite', 'sequoia-kings': 'Sequoia and Kings Canyon', 'eastern-sierra': 'Eastern Sierra', 'big-sur': 'Big Sur', 'central-coast': 'Central Coast', 'sierra-foothills': 'Sierra foothills and lakes', 'central-valley': 'Central Valley', 'north-coast': 'North Coast and redwoods', 'shasta-cascade': 'Shasta and Cascades', 'bay-area': 'Bay Area', 'tahoe-north': 'Lake Tahoe and northern Sierra', 'gold-country': 'Gold Country', 'sacramento-valley': 'Sacramento Valley', 'joshua-tree-desert': 'Joshua Tree and low desert', 'death-valley-mojave': 'Death Valley and Mojave', 'channel-islands': 'Channel Islands', 'santa-barbara-ventura': 'Santa Barbara and Ventura', 'la-orange': 'Los Angeles and Orange County', 'san-diego': 'San Diego County', 'inland-mountains': 'Southern California mountains', 'inland-empire-mountains': 'Southern California mountains', 'desert-southwest': 'Desert Southwest', 'rockies': 'Rocky Mountains', 'pacific-northwest': 'Pacific Northwest', 'northern-rockies': 'Northern Rockies', 'great-plains': 'Great Plains', 'east': 'East', 'arizona': 'Arizona', 'utah': 'Utah', 'nevada': 'Nevada', 'colorado': 'Colorado', 'new-mexico': 'New Mexico', 'texas': 'Texas', 'oklahoma-arkansas': 'Oklahoma and Arkansas', 'louisiana': 'Louisiana', 'midwest': 'Midwest', 'southeast': 'Southeast', 'northeast': 'Northeast' };
  const regionLabel = r => REGION_LABELS[r] || String(r || '').replace(/-/g, ' ');
  function sigNow() { const F = S().find, p = place(); return JSON.stringify([F.q, F.radius, F.sort, F.types, F.am, F.kid, F.rvFt, F.hookups, F.maxPrice, F.agency, F.region, F.openNow, F.winFrom, F.winTo, F.strict, F.hideNoPos, p && [p.lat, p.lon]]); }
  function drawRes() {
    const host = OA.$('#cfres'); if (!host) return;
    const sg = sigNow(); if (sg !== ui.sig) { ui.sig = sg; ui.shown = 30; }
    const F = S().find, c = compute(), P = c.P, all = c.rows, curN = CP.campsAll().length, osmN = ui.osm && ui.osm.items ? ui.osm.items.length : 0;
    let h = '';
    if (ui.cmp.length) h += `<div class="cf-cmpbar"><span>${ui.cmp.length} to compare</span><span class="row" style="margin:0"><button class="btn gold" data-act="cfCmpGo" ${ui.cmp.length < 2 ? 'disabled' : ''}>Compare</button><button class="btn" data-act="cfCmpClear">Clear</button></span></div>`;
    h += `<div class="cf-sum"><span class="sm dim">${all.length} shown${curN ? ` of ${curN} curated${osmN ? ' + ' + osmN + ' map' : ''}` : ''}</span><select class="in cf-sort" data-bind="find.sort" data-then="cfRerender" aria-label="Sort"><option value="near" ${c.sort === 'near' ? 'selected' : ''}>Nearest</option><option value="cheap" ${c.sort === 'cheap' ? 'selected' : ''}>Cheapest</option><option value="name" ${c.sort === 'name' ? 'selected' : ''}>Name</option></select></div>`;
    if (!curN && !osmN) h += `<div class="card tip"><div class="ct"><span>${OA.icon('tent')} No campground list on this phone</span></div><p class="sm">The built-in campground list did not load. ${P ? 'You can still search the map below' + (OA.online() ? '.' : ' once you have signal.') : 'Set your location above, then search the map for campgrounds near you' + (OA.online() ? '.' : ' once you have signal.')}</p></div>`;
    else if (!all.length) h += `<div class="card"><div class="ct"><span>${OA.icon('search')} Nothing matches</span></div><p class="sm">No campground fits all your filters${F.q ? ' and the words “' + esc(F.q) + '”' : ''}. Try a wider distance or remove a filter.</p><div class="row"><button class="btn" data-act="cfReset">Clear filters</button></div></div>`;
    const part = all.slice(0, ui.shown); let lastNo = false;
    part.forEach((w, i) => {
      if (c.sort === 'near' && P && w.d == null && !lastNo && i > 0) h += `<div class="cf-div">No map position (distance unknown). Match by name, county or region.</div>`;
      if (w.d == null) lastNo = true;
      h += cardHtml(w.it, w, { smoke: i === 0 });
    });
    if (all.length > ui.shown) h += `<button class="btn block" data-act="cfMore">Show ${Math.min(30, all.length - ui.shown)} more (${all.length - ui.shown} left)</button>`;
    h += osmBlock(P);
    host.innerHTML = h;
  }
  function osmBlock(P) {
    let h = `<div class="card cf-osmbox"><div class="ct"><span>${OA.icon('map')} More from the map</span>${OA.online() ? '' : '<span class="offline-pill">offline</span>'}</div>`;
    if (!P) h += `<p class="sm dim">Set your location above to look for more campgrounds around you on OpenStreetMap.</p>`;
    else {
      h += `<p class="sm dim">Community-edited map data. It finds places the curated list does not have, but fees, phone numbers and dates are often missing or old.</p>`;
      h += `<button class="btn block" data-act="cfOsm" ${ui.osmBusy ? 'disabled' : ''}>${ui.osmBusy ? '<span class="spin"></span> Searching the map…' : 'Search the map for more near here'}</button>`;
      if (!OA.online()) h += `<p class="xs warn">You are offline. A search will only show map results you already looked up for this same spot.</p>`;
    }
    if (ui.osmErr) h += `<div class="alert"><b class="t">Map search did not work</b>${esc(ui.osmErr)}</div>`;
    if (ui.osm) h += `<p class="xs dim">${ui.osm.items.length} map result${ui.osm.items.length === 1 ? '' : 's'} added${ui.osm.near ? ' for ' + esc(ui.osm.near) : ''}${ui.osm.ts ? ' · ' + esc(OA.ago(ui.osm.ts)) : ''}${ui.osm.fromCache || ui.osm.fromSaved ? ' · saved copy' : ''}${ui.osm.stale ? ' (may be out of date)' : ''}. They are marked OpenStreetMap, details unverified: call to confirm.</p>`;
    return h + '</div>';
  }
  async function loadSavedOsm() {
    if (ui.osmLoaded) return; ui.osmLoaded = true;
    try { const rec = await OA.db.get('kv', 'find:osmlast'); if (rec && Array.isArray(rec.items) && rec.items.length && !ui.osm) { ui.osm = { items: rec.items, ts: rec.ts, near: rec.near, fromSaved: true }; drawRes(); } } catch (e) { }
  }

  /* ---------- tab ---------- */
  function chipsRow() {
    const F = S().find, n = filterCount();
    const R = [10, 25, 50, 100, 200, 0];
    const q = (k, v, label) => `<button class="chip ${F[k].indexOf(v) >= 0 ? 'on' : ''}" data-act="cfTog" data-k="${k}" data-v="${v}">${esc(label)}</button>`;
    return `<div class="chips" aria-label="Distance">${R.map(r => `<button class="chip ${F.radius === r ? 'on' : ''}" data-act="cfRadius" data-v="${r}">${r ? esc(OA.dist(r, 0)) : 'Any distance'}</button>`).join('')}</div>
      <div class="chips"><button class="chip ${n ? 'on' : ''}" data-act="cfFilters" data-smoke>${OA.icon('list', 'sm')} Filters${n ? ' (' + n + ')' : ''}</button>${q('types', 'tent', 'Tent')}${q('types', 'rv', 'RV')}${q('types', 'cabin', 'Cabin')}${q('am', 'showers', 'Showers')}${q('am', 'pets', 'Pets')}${q('kid', 'swim', 'Swim')}${q('kid', 'playground', 'Playground')}${q('kid', 'juniorRanger', 'Junior Ranger')}</div>`;
  }
  OA.tab({
    id: 'find', label: 'Find', icon: 'tent', order: 10,
    render(el) {
      el.innerHTML = OA.header('Campica', 'Find a family campground') + whereCard() +
        `<div class="cf-search"><span class="cf-sic">${OA.icon('search')}</span><input class="in" type="search" data-cfq value="${esc(S().find.q)}" placeholder="Search name, park, county or region" aria-label="Search campgrounds"></div>` + chipsRow() + '<div id="cfres"></div>' +
        '<p class="foot">Facts come from the agency pages listed on each campground. Fees, dates and rules change: confirm before you go.</p>';
      drawRes(); loadSavedOsm();
    }
  });
  let qT = null;
  document.addEventListener('input', e => {
    const t = e.target; if (!t || !t.hasAttribute || !t.hasAttribute('data-cfq')) return;
    clearTimeout(qT); qT = setTimeout(() => { S().find.q = t.value; OA.saveSoon(); drawRes(); }, 250);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'cfplace') { e.preventDefault(); OA.acts.cfGeo(); }
    if (e.key === 'Enter' && e.target && e.target.getAttribute && e.target.getAttribute('data-act') === 'cfOpen') OA.acts.cfOpen(e.target);
  });

  /* ---------- filter sheet ---------- */
  function filterHtml() {
    const F = S().find, items = CP.campsAll();
    const agencies = Array.from(new Set(items.map(x => x.agency).filter(Boolean))).sort(), regions = Array.from(new Set(items.map(x => x.region).filter(Boolean))).sort();
    const chip = (k, v, label) => `<button class="chip ${F[k].indexOf(v) >= 0 ? 'on' : ''}" data-act="cfTog" data-k="${k}" data-v="${esc(v)}">${esc(label)}</button>`;
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`;
    return `<div class="sh-sec"><h3>Distance and order</h3><div class="two">
        <label class="fl">Within<select class="in" data-bind="find.radius" data-type="number">${[10, 25, 50, 100, 200].map(r => opt(r, OA.dist(r, 0), F.radius)).join('')}${opt(0, 'Any distance', F.radius)}</select></label>
        <label class="fl">Sort by<select class="in" data-bind="find.sort">${opt('near', 'Nearest', F.sort)}${opt('cheap', 'Cheapest', F.sort)}${opt('name', 'Name', F.sort)}</select></label></div>
        <p class="xs dim">Campgrounds with no map position can not be measured, so they stay in the list, after the nearby ones.</p></div>
      <div class="sh-sec"><h3>Type of camping</h3><div class="chips wrap">${TYPES.map(t => chip('types', t[0], t[1])).join('')}</div></div>
      <div class="sh-sec"><h3>RV, trailer and price</h3><div class="two">
        <label class="fl">My rig length (ft)<input class="in" type="number" inputmode="numeric" min="0" max="80" data-bind="find.rvFt" data-type="number" value="${num(F.rvFt) ? esc(F.rvFt) : ''}" placeholder="any"></label>
        <label class="fl">Price ceiling ($/night)<input class="in" type="number" inputmode="numeric" min="0" data-bind="find.maxPrice" data-type="number" value="${num(F.maxPrice) ? esc(F.maxPrice) : ''}" placeholder="any"></label></div>
        <label class="chk"><input type="checkbox" data-bind="find.hookups" data-type="bool" ${F.hookups ? 'checked' : ''}> Needs hookups (power, water or sewer)</label>
        <p class="xs dim">Only campgrounds that list a smaller limit or a higher price are hidden. Unknown stays, with a warning tag.</p></div>
      <div class="sh-sec"><h3>Amenities</h3><div class="chips wrap">${AMF.map(k => chip('am', k, lab(AM, k))).join('')}</div></div>
      <div class="sh-sec"><h3>For the kids</h3><div class="chips wrap">${KIDF.map(k => chip('kid', k, lab(KID, k))).join('')}</div></div>
      <div class="sh-sec"><h3>Where and when</h3>
        <div class="two"><label class="fl">Agency<select class="in" data-bind="find.agency">${opt('', 'Any', F.agency)}${agencies.map(a => opt(a, a, F.agency)).join('')}</select></label>
        <label class="fl">Region<select class="in" data-bind="find.region">${opt('', 'Any', F.region)}${regions.map(a => opt(a, regionLabel(a), F.region)).join('')}</select></label></div>
        <label class="chk"><input type="checkbox" data-bind="find.openNow" data-type="bool" ${F.openNow ? 'checked' : ''}> Open today (by listed season dates)</label>
        <div class="two"><label class="fl">Arrive<input class="in" type="date" data-bind="find.winFrom" value="${esc(F.winFrom || '')}"></label>
        <label class="fl">Leave<input class="in" type="date" data-bind="find.winTo" value="${esc(F.winTo || '')}"></label></div>
        <p class="xs dim">Arrival date: hides places clearly closed then or whose booking window has not opened yet. If the dates or window are not clear in the data, the place stays.</p></div>
      <div class="sh-sec"><label class="chk"><input type="checkbox" data-bind="find.strict" data-type="bool" ${F.strict ? 'checked' : ''}> Only show confirmed matches (hide unknowns)</label>
        <label class="chk"><input type="checkbox" data-bind="find.hideNoPos" data-type="bool" ${F.hideNoPos ? 'checked' : ''}> Hide campgrounds with no map position</label></div>
      <div class="row"><button class="btn" data-act="cfReset">Reset</button><button class="btn gold" data-act="cfDone">Show results</button></div>`;
  }

  /* ---------- detail sheet ---------- */
  const kvRow = (k, v) => `<div class="kv"><span>${esc(k)}</span><span class="right">${v == null || v === '' ? `<span class="dim">${CHECK}</span>` : v}</span></div>`;
  const yesNo = v => { const t = triText(v); return t == null ? null : esc(t); };
  function bookBlock(it) {
    const b = it.booking || {}, c = it.contact || {}, F = S().find, from = F.winFrom || null, opens = opensOnKey(it, from);
    let h = `<div class="card inner"><div class="ct"><span>${OA.icon('ticket')} How to book</span></div>`;
    h += kvRow('System', b.system ? esc(sysName(b.system)) : null);
    h += kvRow('When reservations open', b.window ? esc(b.window) : null);
    if (opens) h += `<div class="sm" style="margin:6px 0">For your arrival on ${esc(OA.fmtDate(from))}, booking opens about <b>${esc(OA.fmtDate(opens))}</b> (worked out from the rule above; confirm on the booking site).</div>`;
    if (b.firstComeNote) h += `<p class="sm"><b>First come:</b> ${esc(b.firstComeNote)}</p>`;
    if (b.cancelNote) h += `<p class="sm"><b>Cancellations:</b> ${esc(b.cancelNote)}</p>`;
    h += '<div class="row wrap">';
    if (b.phone && looksPhone(b.phone)) h += `<a class="btn gold" href="${esc(telHref(b.phone))}">${OA.icon('phone', 'sm')} Call ${esc(b.phone)}</a>`;
    else if (b.phone) h += `<span class="sm">Phone: ${esc(b.phone)}</span>`;
    if (safeUrl(b.url)) h += `<a class="btn" href="${esc(safeUrl(b.url))}" target="_blank" rel="noopener">Booking site</a>`;
    if (safeUrl(c.url) && c.url !== b.url) h += `<a class="btn" href="${esc(safeUrl(c.url))}" target="_blank" rel="noopener">Official page</a>`;
    h += '</div>';
    if (!b.system && !b.phone && !safeUrl(b.url) && !safeUrl(c.url)) h += `<p class="sm dim">Booking details: ${CHECK}. Ask the agency that manages the land.</p>`;
    return h + '</div>';
  }
  function detailHtml(it) {
    const F = S().find, P = place(), s = it.sites || {}, a = it.amenities || {}, f = it.family || {}, fe = it.fees || {}, se = it.season || {}, c = it.contact || {}, st = STATUS[it.status];
    const hasPos = num(it.lat) && num(it.lon), d = P && hasPos ? G.mi(P, it) : null, brg = d != null ? G.compass(G.bearing(P, it)) : '';
    let h = '';
    if (it.osm) h += `<div class="alert"><b class="t">From OpenStreetMap, details unverified</b>Community-edited map data. Call to confirm fees, dates, rules and that the campground is open.</div>`;
    h += `<h2 class="big">${esc(it.name || 'Unnamed camp site')}</h2><div class="dim sm">${esc([it.parent, it.county ? it.county + ' County' : null, it.state].filter(Boolean).join(' · '))}</div>`;
    h += `<div class="cf-tags" style="margin:6px 0">${it.agency ? `<span class="tag">${esc(it.agency)}</span>` : ''}${st ? `<span class="tag ${st[1]}">${st[0]}</span>` : ''}${(it.types || []).map(t => `<span class="tag g">${esc(TLAB[t] || t)}</span>`).join('')}${it.booking && it.booking.system ? `<span class="tag a">${esc(sysName(it.booking.system))}</span>` : ''}</div>`;
    if (it.statusNote) h += `<div class="alert"><b class="t">Status</b>${esc(it.statusNote)}</div>`;
    const sv = savedHas(it.id);
    h += `<div class="row wrap"><button class="btn ${sv ? '' : 'gold'}" data-act="cfSave" data-id="${esc(it.id)}">${sv ? 'Saved: tap to remove' : 'Save to my list'}</button><button class="btn" data-act="cfPlan" data-id="${esc(it.id)}">Add to a trip plan</button></div>
      <div class="row wrap"><button class="btn" data-act="cfShare" data-id="${esc(it.id)}">${OA.icon('share', 'sm')} Share</button><button class="btn" data-act="cfReport" data-id="${esc(it.id)}">Report a problem</button></div>`;
    (it.cautions || []).forEach(x => { h += `<div class="alert"><b class="t">Heads up</b>${esc(x)}</div>`; });
    if (f.kidNote || (it.highlights || []).length) {
      h += `<div class="card inner"><div class="ct"><span>${OA.icon('star')} For families</span></div>`;
      if (f.kidNote) h += `<p class="sm">${esc(f.kidNote)}</p>`;
      if ((it.highlights || []).length) h += `<ul class="ls sm">${it.highlights.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      h += '</div>';
    }
    if (window.CPL) h += CPL.html(it);
    h += bookBlock(it);
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('info')} At a glance</span></div>`;
    if (d != null) h += kvRow('From ' + (P.name || 'your spot'), esc(OA.dist(d, d < 10 ? 1 : 0)) + ' ' + esc(brg) + ' (straight line)');
    h += kvRow('Elevation', num(it.elevFt) ? esc(OA.ft(it.elevFt)) : null);
    h += kvRow('Season', se.open || se.close ? esc([se.open, se.close].filter(Boolean).join(' to ')) : null);
    if (se.note) h += `<div class="xs dim" style="margin:2px 0 6px">${esc(se.note)}</div>`;
    h += kvRow('Total sites', num(s.total) ? esc(s.total) : null) + kvRow('Longest RV', num(s.maxRvFt) ? esc(OA.ft(s.maxRvFt)) : null) + kvRow('Longest trailer', num(s.maxTrailerFt) ? esc(OA.ft(s.maxTrailerFt)) : null);
    h += kvRow('Hookups', s.hookups ? esc(cap(s.hookups)) : null);
    if (s.hookupNote) h += `<div class="xs dim" style="margin:2px 0 6px">${esc(s.hookupNote)}</div>`;
    h += kvRow('Nightly fee', fe.nightlyMin != null || fe.nightlyMax != null ? esc(CP.campFee(it)) : null) + kvRow('Extra vehicle', num(fe.extraVehicle) ? esc(money(fe.extraVehicle)) + '/night' : null) + kvRow('Reservation fee', num(fe.reservationFee) ? esc(money(fe.reservationFee)) : null);
    if (fe.note) h += `<div class="xs dim" style="margin:2px 0 6px">${esc(fe.note)}</div>`;
    h += '</div>';
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('home')} Amenities</span></div>${AM.map(x => kvRow(x[1], yesNo(a[x[0]]))).join('')}${a.toilets != null && a.flush == null && a.vault == null ? kvRow('Toilets', yesNo(a.toilets)) : ''}</div>`;
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('leaf')} Kid features</span></div>${KID.map(x => kvRow(x[1], yesNo(f[x[0]]))).join('')}${f.nearTown ? kvRow('Nearest town', esc(f.nearTown)) : ''}</div>`;
    /* weather, sun, map */
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('cloud')} Weather and daylight</span></div>`;
    h += hasPos ? `<div id="cfwx" class="sm dim"><button class="btn block" data-act="cfWx" data-id="${esc(it.id)}">Show the forecast${OA.online() ? '' : ' (offline: saved copy only)'}</button></div><div id="cfsun" class="sm" style="margin-top:6px"></div>` : `<p class="sm dim">No map position for this campground, so no forecast or sun times. ${CHECK}.</p>`;
    h += '</div>';
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('map')} Map and directions</span></div>`;
    if (hasPos) {
      const L = G.mapLinks(it.lat, it.lon, it.name), dest = it.lat.toFixed(6) + ',' + it.lon.toFixed(6);
      h += `<div class="sm">${esc(G.fmtCoord(it.lat, it.lon))}</div><div class="row wrap"><a class="btn" href="${esc(L.google)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="${esc(L.apple)}" target="_blank" rel="noopener">Apple Maps</a><a class="btn" href="${esc(L.osm)}" target="_blank" rel="noopener">OpenStreetMap</a></div>
        <div class="row wrap"><a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=${esc(dest)}" target="_blank" rel="noopener">Directions (Google)</a><a class="btn" href="https://maps.apple.com/?daddr=${esc(dest)}" target="_blank" rel="noopener">Directions (Apple)</a><a class="btn" href="${esc(L.geo)}">Open in maps app</a></div>`;
    } else {
      const qs = encodeURIComponent([it.name, it.parent, it.county, it.state].filter(Boolean).join(' '));
      h += `<p class="sm dim">No coordinates are listed for this one. Use the address or park name, and confirm it with the agency.</p><div class="row wrap"><a class="btn" href="https://www.openstreetmap.org/search?query=${qs}" target="_blank" rel="noopener">Search the map for this name</a></div>`;
    }
    h += '</div>';
    h += `<div class="card inner"><div class="ct"><span>${OA.icon('phone')} Contact</span></div>${kvRow('Phone', c.phone ? (looksPhone(c.phone) ? `<a href="${esc(telHref(c.phone))}">${esc(c.phone)}</a>` : esc(c.phone)) : null)}${kvRow('Email', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : null)}${kvRow('Address', c.address ? esc(c.address) : null)}${kvRow('Official page', safeUrl(c.url) ? link(c.url, 'Open') : null)}</div>`;
    h += `<div class="xs dim" style="margin-top:12px"><b>Sources</b> (data as of ${esc(it.asof || 'unknown')})<br>${(it.src || []).length ? it.src.map(u => safeUrl(u) ? link(u, u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)) : esc(u)).join('<br>') : 'No source listed: ' + CHECK + '.'}</div>`;
    return h;
  }
  function wxFill(it) {
    const box = document.getElementById('cfwx'); if (!box) return;
    const when = F0().winFrom ? OA.parseKey(F0().winFrom) : new Date(), sunEl = document.getElementById('cfsun');
    try {
      const sun = G.sun(it.lat, it.lon, when);
      if (sunEl) sunEl.innerHTML = sun && sun.rise && sun.set ? `${OA.icon('sun', 'sm')} ${esc(F0().winFrom ? OA.fmtDate(F0().winFrom) : 'Today')}: sunrise ${esc(OA.fmtTime(sun.rise))}, sunset ${esc(OA.fmtTime(sun.set))} (${esc(OA.hm(sun.dayHours))} of daylight, your phone's time zone)` : '';
    } catch (e) { }
    OA.db.get('cache', 'wx:' + it.lat.toFixed(1) + ',' + it.lon.toFixed(1)).then(rec => { if (rec && rec.ts && rec.v) wxLoad(it); }).catch(() => { });
  }
  function wxLoad(it) {
    const b0 = document.getElementById('cfwx'); if (b0) b0.innerHTML = '<span class="spin"></span> Loading forecast…';
    OA.weather(it.lat, it.lon).then(r => {
      const el = document.getElementById('cfwx'); if (!el) return;
      const dd = r.v && r.v.daily; if (!dd || !dd.time) { el.textContent = 'No forecast available.'; return; }
      el.className = 'sm';
      el.innerHTML = dd.time.slice(0, 4).map((t, i) => `<div class="kv"><span>${esc(OA.fmtDate(t))}</span><span class="right">${esc(OA.wxText(dd.weather_code[i]))}, ${esc(OA.temp(dd.temperature_2m_max[i]))} / ${esc(OA.temp(dd.temperature_2m_min[i]))}${dd.precipitation_probability_max && dd.precipitation_probability_max[i] != null ? ', rain ' + esc(dd.precipitation_probability_max[i]) + '%' : ''}</span></div>`).join('') + `<div class="xs dim">Forecast for the campground's coordinates${r.stale ? ' (saved copy, may be out of date)' : ''}. Mountains change fast: check the park alerts.</div>`;
    }).catch(() => { const el = document.getElementById('cfwx'); if (el) el.innerHTML = `<span class="dim">${OA.online() ? 'The forecast did not load.' : 'Offline: no forecast saved for here.'}</span>`; });
  }
  const F0 = () => S().find;
  function openDetail(id) {
    const it = CP.camp(id); if (!it) { OA.toast('That campground is not in the list any more.'); return; }
    OA.sheet(it.name || 'Campground', detailHtml(it), { onOpen() { wxFill(it); } });
  }
  CP.campDetail = openDetail;
  CP.redrawDetail = id => redrawDetail(id);
  function redrawDetail(id) { const it = CP.camp(id); if (it) OA.redrawSheet(detailHtml(it)); }

  /* ---------- compare ---------- */
  function compareHtml() {
    const P = place(), its = ui.cmp.map(CP.camp).filter(Boolean);
    const row = (label, fn) => `<tr><th>${esc(label)}</th>${its.map(it => { let v; try { v = fn(it); } catch (e) { v = null; } return `<td>${v == null || v === '' ? `<span class="dim">${CHECK}</span>` : v}</td>`; }).join('')}</tr>`;
    const tf = (grp, k) => it => yesNo((it[grp] || {})[k]);
    return `<div class="scroll-x"><table class="t cf-cmp"><thead><tr><th></th>${its.map(it => `<th>${esc(it.name || 'Unnamed')}</th>`).join('')}</tr></thead><tbody>
      ${row('Distance', it => P && num(it.lat) && num(it.lon) ? esc(OA.dist(G.mi(P, it), 0)) + ' ' + esc(G.compass(G.bearing(P, it))) : null)}
      ${row('Agency', it => it.agency ? esc(it.agency) : null)}
      ${row('Status', it => STATUS[it.status] ? STATUS[it.status][0] : null)}
      ${row('Types', it => (it.types || []).length ? esc(it.types.map(t => TLAB[t] || t).join(', ')) : null)}
      ${row('Season', it => it.season && (it.season.open || it.season.close) ? esc([it.season.open, it.season.close].filter(Boolean).join(' to ')) : null)}
      ${row('Sites', it => num(it.sites && it.sites.total) ? esc(it.sites.total) : null)}
      ${row('Longest RV', it => num(it.sites && it.sites.maxRvFt) ? esc(OA.ft(it.sites.maxRvFt)) : null)}
      ${row('Hookups', it => it.sites && it.sites.hookups ? esc(cap(it.sites.hookups)) : null)}
      ${row('Fee', it => it.fees && (num(it.fees.nightlyMin) || num(it.fees.nightlyMax)) ? esc(CP.campFee(it)) : null)}
      ${row('Booking', it => it.booking && it.booking.system ? esc(sysName(it.booking.system)) : null)}
      ${AM.filter(x => ['showers', 'flush', 'vault', 'water', 'dump', 'pets', 'ada'].indexOf(x[0]) >= 0).map(x => row(x[1], tf('amenities', x[0]))).join('')}
      ${KIDF.map(k => row(lab(KID, k), tf('family', k))).join('')}
      ${row('Phone', it => it.booking && it.booking.phone ? esc(it.booking.phone) : it.contact && it.contact.phone ? esc(it.contact.phone) : null)}
      </tbody></table></div>
      <div class="row">${its.map(it => `<button class="btn" data-act="cfOpen" data-id="${esc(it.id)}">${esc((it.name || 'Open').slice(0, 18))}</button>`).join('')}</div>`;
  }

  /* ---------- actions ---------- */
  function osmFilters() { return ['node["tourism"="camp_site"]', 'way["tourism"="camp_site"]', 'node["tourism"="caravan_site"]', 'way["tourism"="caravan_site"]']; }
  OA.act({
    cfRerender() { drawRes(); },
    cfWhere() { const p = place(); ui.whereOpen = !(ui.whereOpen == null ? !p : ui.whereOpen); OA.render(true); },
    async cfLocate() {
      if (ui.busy) return; ui.busy = true; ui.geoMsg = ''; OA.render(true);
      let fix = null, note = '';
      try { fix = await G.position(); } catch (e) { fix = G.known(); note = e.message; if (fix) OA.toast('Using your last known position (' + OA.ago(fix.ts || Date.now()) + '). ' + note, 4500); }
      ui.busy = false;
      if (!fix) { ui.geoMsg = note || 'Could not get your position. Type a town instead.'; OA.render(true); return; }
      setPlace({ lat: fix.lat, lon: fix.lon, name: 'My location', src: 'gps' });
      if (OA.online()) OA.reverse(fix.lat, fix.lon).then(r => { const p = place(); if (p && Math.abs(p.lat - fix.lat) < 1e-6 && (r.town || r.state)) { p.name = [r.town, r.state].filter(Boolean).join(', '); OA.save(); if (OA.current() === 'find' && !OA.sheetOpen()) OA.render(true); } }).catch(() => { });
    },
    async cfGeo() {
      const inp = OA.$('#cfplace'), q = inp ? inp.value.trim() : ''; if (!q) { OA.toast('Type a town, park or address first.'); return; }
      ui.geoMsg = 'Searching…'; ui.geo = null;
      const keep = q; OA.render(true); const i2 = OA.$('#cfplace'); if (i2) i2.value = keep;
      try { const r = await OA.geocode(q); ui.geo = r; ui.geoMsg = r.length ? '' : 'No place found for “' + q + '”. Try a nearby town.'; }
      catch (e) { ui.geoMsg = OA.online() ? 'Place search did not answer. Try again, or use your location.' : 'Place search needs signal. Use your location or a saved home base.'; }
      OA.render(true); const i3 = OA.$('#cfplace'); if (i3) i3.value = keep;
    },
    cfPick(el) { const g = (ui.geo || [])[+el.dataset.i]; if (g) setPlace({ lat: g.lat, lon: g.lon, name: g.short, src: 'search' }); },
    cfHome(el) { const h = S().find.homes.find(x => x.id === el.dataset.id); if (h) setPlace({ lat: h.lat, lon: h.lon, name: h.name, src: 'home' }); },
    cfHomeSave() { const p = place(); if (!p) return; S().find.homes.push({ id: OA.uid(), name: p.name || 'Home base', lat: p.lat, lon: p.lon }); OA.save(); OA.toast('Saved as a home base.'); OA.render(true); },
    async cfHomeDel(el) { if (!await OA.confirm('Remove this home base?', 'Remove')) return; S().find.homes = S().find.homes.filter(x => x.id !== el.dataset.id); OA.save(); OA.render(true); },
    cfRadius(el) { S().find.radius = +el.dataset.v; OA.save(); OA.render(true); },
    cfTog(el) {
      const k = el.dataset.k, v = el.dataset.v, a = S().find[k]; if (!Array.isArray(a)) return;
      const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); OA.save();
      if (OA.sheetOpen()) OA.redrawSheet(filterHtml()); else OA.render(true);
    },
    cfFilters() { OA.sheet('Filters', filterHtml()); },
    cfDone() { OA.closeSheet(); },
    async cfReset() {
      Object.assign(S().find, { q: '', types: [], am: [], kid: [], rvFt: null, hookups: false, maxPrice: null, agency: '', region: '', openNow: false, winFrom: '', winTo: '', strict: false, hideNoPos: false, radius: 50, sort: 'near' }); OA.save();
      if (OA.sheetOpen()) OA.redrawSheet(filterHtml()); else OA.render(true);
    },
    cfMore() { ui.shown += 30; const y = window.scrollY; drawRes(); window.scrollTo(0, y); },
    async cfOsm() {
      const P = place(); if (!P) { OA.toast('Set your location first.'); return; }
      if (ui.osmBusy) return; ui.osmBusy = true; ui.osmErr = ''; drawRes();
      const miles = S().find.radius ? Math.min(S().find.radius, 100) : 100;
      try {
        const r = await OA.osm.around(P.lat, P.lon, miles * 1609.344, osmFilters());
        const cur = CP.campsAll(), seen = {}, items = [];
        r.items.forEach(e => { const o = fromOsm(e); if (seen[o.id]) return; seen[o.id] = 1; if (!dupOf(o, cur)) items.push(o); });
        ui.osm = { items, ts: Date.now(), near: P.name || null, fromCache: r.fromCache, stale: r.stale };
        items.forEach(o => ui.osmById[o.id] = o);
        try { await OA.db.put('kv', { id: 'find:osmlast', ts: ui.osm.ts, near: ui.osm.near, items }); } catch (e) { }
        if (!items.length) ui.osmErr = r.items.length ? 'Every map result was already in the curated list.' : 'The map has no campgrounds listed within ' + OA.dist(miles, 0) + ' of here.';
      } catch (e) { ui.osmErr = OA.online() ? 'The map service did not answer. Try again in a minute.' : 'You are offline and there is no saved map search for this spot.'; }
      ui.osmBusy = false; drawRes();
    },
    cfWx(el) { const it = CP.camp(el.dataset.id); if (it && num(it.lat) && num(it.lon)) wxLoad(it); },
    cfOpen(el) { openDetail(el.dataset.id); },
    cfCmp(el) {
      const id = el.dataset.id, i = ui.cmp.indexOf(id);
      if (i >= 0) ui.cmp.splice(i, 1); else if (ui.cmp.length >= 3) { OA.toast('Compare up to 3 at a time.'); return; } else ui.cmp.push(id);
      const y = window.scrollY; drawRes(); window.scrollTo(0, y);
    },
    cfCmpGo() { if (ui.cmp.length < 2) { OA.toast('Tick at least 2 to compare.'); return; } OA.sheet('Compare', compareHtml()); },
    cfCmpClear() { ui.cmp = []; drawRes(); },
    async cfSave(el) {
      const id = el.dataset.id, it = CP.camp(id); if (!it) return; const L = S().saved.list;
      const i = L.findIndex(x => x.id === id);
      if (i >= 0) { if (!await OA.confirm('Remove “' + (it.name || 'this campground') + '” from your list?', 'Remove')) return; L.splice(i, 1); OA.toast('Removed from your list.'); }
      else { L.push({ id, name: it.name || 'Unnamed camp site', ts: Date.now(), note: '', status: 'interested' }); if (it.osm) S().find.osmSaved[id] = it; OA.toast('Saved to your list.'); }
      OA.save(); redrawDetail(id);
    },
    cfPlan(el) {
      const id = el.dataset.id;
      if (window.CP && CP.plan && typeof CP.plan.addCamp === 'function') { try { const r = CP.plan.addCamp(id); if (r !== false) OA.toast('Added to your trip plan.'); } catch (e) { OA.toast('Could not add it: ' + e.message); } }
      else OA.toast('The trip planner is not ready yet. Use Save to my list for now.');
    },
    cfShare(el) {
      const it = CP.camp(el.dataset.id); if (!it) return; const c = it.contact || {}, b = it.booking || {};
      const url = safeUrl(c.url) || safeUrl(b.url) || (num(it.lat) && num(it.lon) ? G.mapLinks(it.lat, it.lon).google : undefined);
      const text = [it.name, it.parent, c.address, (c.phone || b.phone) ? 'Phone ' + (c.phone || b.phone) : null, it.osm ? '(from OpenStreetMap, unverified: call to confirm)' : null].filter(Boolean).join('\n');
      return OA.share.send({ title: it.name || 'Campground', text, url });
    },
    cfReport(el) {
      const it = CP.camp(el.dataset.id); if (!it) return;
      OA.sheet('Report a problem', `<p class="sm">What looks wrong about <b>${esc(it.name || 'this campground')}</b>? The note is saved on this phone with your other notes and copied so you can send it on.</p><textarea class="in" id="cfrep" rows="5" placeholder="For example: phone number is disconnected; closed for the season; fee is higher now."></textarea><div class="row"><button class="btn gold" data-act="cfRepSave" data-id="${esc(it.id)}">Save the note</button></div>`);
    },
    async cfRepSave(el) {
      const it = CP.camp(el.dataset.id), t = OA.$('#cfrep'); if (!it || !t) return;
      const body = t.value.trim(); if (!body) { OA.toast('Write what is wrong first.'); return; }
      const txt = 'Correction for ' + (it.name || 'campground') + ' (' + it.id + ') on ' + OA.dkey() + ': ' + body + (it.asof ? ' [data as of ' + it.asof + ']' : '');
      S().saved.notes.push({ id: OA.uid(), camp: it.id, name: it.name || '', ts: Date.now(), kind: 'correction', text: txt }); OA.save();
      try { await navigator.clipboard.writeText(txt); OA.toast('Note saved and copied.'); } catch (e) { OA.toast('Note saved.'); }
      OA.closeSheet();
    }
  });

  OA.on('online', () => { if (OA.current() === 'find' && !OA.sheetOpen()) OA.render(true); });
  OA.on('offline', () => { if (OA.current() === 'find' && !OA.sheetOpen()) OA.render(true); });
})();
