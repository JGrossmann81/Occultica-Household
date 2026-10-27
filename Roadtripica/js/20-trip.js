/* Roadtripica: Trip tab and the shared RT.trip API.
   RT.trip (other modules call it defensively: `window.RT && RT.trip && RT.trip.current()`):
     current()      -> the open trip object | null
     list()         -> all trips
     points(t?)     -> routing points [{id,label,lat,lon,kind,nights,idx,virtual?}] (a round trip adds a final "back to start" point)
     legs(t?)       -> [{from,to,mi,hr,src}] src 'osrm' (real driving route) | 'estimate' (straight line x 1.25 at 55 mph). Miles, hours.
     summary(t?)    -> null | {id,name,startDate,endDate,days,nights,miles,hours,src,waypoints,vehicle,party}
     plan(t?)       -> {days:[...], model, ...} the day-by-day split used by this tab
     addStop(stop)  -> the new waypoint. stop = {label|name, lat, lon, kind?, nights?, notes?, ref?}; creates a trip if none exists
     nightsOn(date) -> null | {date,label,lat,lon,suggested,wpIdx}  where the trip sleeps on that YYYY-MM-DD date
   Search centre for the Stops tab: OA.S.trip.searchAt = {lat,lon,label,kind:'stay'|'ev'|'fuel',ts}. Miles, hours and money stored in miles/hours/dollars. */
window.RT = window.RT || {};
(function () {
  'use strict';
  const RT = window.RT, esc = OA.esc, G = OA.geo;
  OA.defaults({ trip: { cur: null, trips: [], view: 'plan', searchAt: null } });
  const S = () => OA.S.trip;

  /* ---------- small helpers ---------- */
  const isNum = v => typeof v === 'number' && isFinite(v);
  const clamp = OA.clamp, r1 = v => Math.round(v * 10) / 10;
  const validKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(new Date(k + 'T12:00:00').getTime());
  const validTime = s => (typeof s === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(s)) ? s : '08:00';
  const ft = d => OA.fmtTime(d);
  const tzOf = lon => Math.round(lon / 15);
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); };
  const ROUTE_LABEL = 'OSRM demo router, estimated drive time without traffic';
  const VEH = {
    car: { label: 'Car', mpg: 28, tankGal: 14, rangeMi: 380 }, suv: { label: 'SUV', mpg: 22, tankGal: 19, rangeMi: 400 },
    van: { label: 'Van', mpg: 18, tankGal: 24, rangeMi: 400 }, rv: { label: 'RV', mpg: 9, tankGal: 40, rangeMi: 330 },
    truck: { label: 'Truck', mpg: 18, tankGal: 26, rangeMi: 430 }, ev: { label: 'Electric', mpg: 100, tankGal: 0, rangeMi: 260 }
  };
  const KINDS = { start: ['Start', 'pin'], stop: ['Stop', 'pin'], camp: ['Camp', 'tent'], hotel: ['Hotel', 'bed'], sight: ['Sight', 'eye'], end: ['End', 'pin'] };
  const KIDS_TIPS = [
    'Pick a park or playground for the break instead of a gas station. Ten minutes of running around saves an hour of grumbling.',
    'Everyone gets out, including the driver: stretch, drink water, use the bathroom, even if nobody asks.',
    'Hand out a snack and one new small activity at each break so the next stretch feels fresh.',
    'Never leave a child or pet in a parked car, even for a minute. A closed car heats up fast.',
    'Swap seats at the break. Changing places often settles squabbles.',
    'If someone gets carsick, stop before it gets bad: fresh air, eyes on the horizon, light snacks.'
  ];
  const ADULT_TIPS = [
    'Driver tiredness builds slowly. Stop about every two to three hours even if you feel fine.',
    'Yawning, drifting in the lane or missing exits mean stop soon at a safe place. A 15 to 20 minute nap helps; coffee and loud music only help briefly.',
    'Swap drivers at a break if someone else can drive.',
    'Walk briskly for a few minutes at each stop. It helps your legs and your attention.'
  ];

  /* ---------- trips: creation and repair ---------- */
  function newTrip(name) {
    return {
      id: OA.uid(), name: name || 'My road trip', startDate: OA.dkey(), endDate: null,
      vehicle: { type: 'car', mpg: 28, tankGal: 14, rangeMi: 380, lengthFt: null }, party: { adults: 2, kids: 0 }, waypoints: [], roundTrip: false,
      prefs: { maxDriveHoursPerDay: 6, avoidTolls: false, avoidHighways: false, departTime: '08:00' }, leave: { contact: '', checkin: '' }, days: [], routeCache: null
    };
  }
  function fix(t) {
    if (!t || typeof t !== 'object') return null;
    const d = newTrip();
    t.id = t.id || OA.uid(); t.name = typeof t.name === 'string' && t.name ? t.name : d.name;
    if (!validKey(t.startDate)) t.startDate = d.startDate; if (t.endDate && !validKey(t.endDate)) t.endDate = null;
    t.vehicle = Object.assign({}, d.vehicle, t.vehicle || {}); if (!VEH[t.vehicle.type]) t.vehicle.type = 'car';
    t.party = Object.assign({}, d.party, t.party || {}); t.prefs = Object.assign({}, d.prefs, t.prefs || {}); t.leave = Object.assign({}, d.leave, t.leave || {});
    t.roundTrip = !!t.roundTrip; if (!Array.isArray(t.days)) t.days = [];
    t.waypoints = (Array.isArray(t.waypoints) ? t.waypoints : []).filter(w => w && isNum(+w.lat) && isNum(+w.lon) && Math.abs(w.lat) <= 90 && Math.abs(w.lon) <= 180).map(w => {
      w.id = w.id || OA.uid(); w.lat = +w.lat; w.lon = +w.lon; w.label = typeof w.label === 'string' && w.label ? w.label : 'Stop'; if (!KINDS[w.kind]) w.kind = 'stop';
      w.nights = isNum(+w.nights) && +w.nights > 0 ? Math.min(60, Math.round(+w.nights)) : 0; w.notes = typeof w.notes === 'string' ? w.notes : ''; return w;
    });
    return t;
  }
  let fixed = false;
  function init() { if (fixed || !OA.S) return; fixed = true; const s = S(); s.trips = (Array.isArray(s.trips) ? s.trips : []).map(fix).filter(Boolean); if (!s.trips.find(t => t.id === s.cur)) s.cur = s.trips[0] ? s.trips[0].id : null; if (!['plan', 'days', 'strip'].includes(s.view)) s.view = 'plan'; }
  function cur() { init(); const s = S(); return s.trips.find(t => t.id === s.cur) || s.trips[0] || null; }
  const idxOf = t => S().trips.indexOf(t);
  function changed() { OA.saveSoon(); try { OA.publish(); } catch (e) { } }
  const redraw = () => { if (OA.current() === 'trip') OA.render(true); };

  /* ---------- route points, keys ---------- */
  function pointsOf(t) {
    const w = t.waypoints.map((x, i) => ({ id: x.id, label: x.label, lat: x.lat, lon: x.lon, kind: x.kind, nights: x.nights || 0, idx: i }));
    if (t.roundTrip && w.length >= 2) { const f = t.waypoints[0]; w.push({ id: 'return', label: 'Back to ' + f.label, lat: f.lat, lon: f.lon, kind: 'end', nights: 0, idx: w.length, virtual: true }); }
    return w;
  }
  const keyOf = pts => pts.map(p => p.lat.toFixed(4) + ',' + p.lon.toFixed(4)).join(';');

  /* ---------- geometry helpers ---------- */
  function perp(p, a, b) {
    const k = Math.cos(a[0] * Math.PI / 180), x = (p[1] - a[1]) * k, y = p[0] - a[0], dx = (b[1] - a[1]) * k, dy = b[0] - a[0], L = dx * dx + dy * dy;
    if (!L) return Math.hypot(x, y); const u = Math.max(0, Math.min(1, (x * dx + y * dy) / L)); return Math.hypot(x - u * dx, y - u * dy);
  }
  function dp(g, tol) {
    const keep = new Uint8Array(g.length); keep[0] = keep[g.length - 1] = 1; const st = [[0, g.length - 1]];
    while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; for (let i = a + 1; i < b; i++) { const d = perp(g[i], g[a], g[b]); if (d > md) { md = d; mi = i; } } if (md > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return g.filter((_, i) => keep[i]);
  }
  function simplify(g, max) {
    let out = g; if (g.length > max) { let tol = 0.0002; for (let it = 0; it < 16 && out.length > max; it++) { out = dp(g, tol); tol *= 1.7; } }
    return out.map(p => [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4]);
  }

  /* ---------- route model: polyline with road miles m[] and drive hours t[] at every point ---------- */
  function buildModel(pts, legs, geom, src, ts, wpiGiven) {
    const n = geom.length, ll = k => ({ lat: geom[k][0], lon: geom[k][1] });
    const cumP = [0]; for (let i = 1; i < n; i++) cumP.push(cumP[i - 1] + G.mi(ll(i - 1), ll(i)));
    const totalP = cumP[n - 1] || 1, wpM = [0], wpT = [0];
    legs.forEach(l => { wpM.push(wpM[wpM.length - 1] + l.mi); wpT.push(wpT[wpT.length - 1] + l.hr); });
    const totMi = wpM[wpM.length - 1] || 1, wpi = wpiGiven || [0];
    if (!wpiGiven) for (let i = 1; i < pts.length; i++) {
      if (i === pts.length - 1) { wpi.push(n - 1); continue; }
      const f = wpM[i] / totMi, lo = wpi[i - 1]; let best = -1, bd = 1e9;
      for (let k = lo; k < n; k++) { if (Math.abs(cumP[k] / totalP - f) > 0.1) continue; const d = G.mi(ll(k), pts[i]); if (d < bd) { bd = d; best = k; } }
      if (best < 0) best = Math.min(n - 1, Math.max(lo, Math.round(f * (n - 1))));
      wpi.push(best);
    }
    const m = new Array(n).fill(0), tt = new Array(n).fill(0);
    legs.forEach((l, i) => { const a = wpi[i], b = wpi[i + 1], span = (cumP[b] - cumP[a]) || 1; for (let k = a; k <= b; k++) { const fr = b === a ? 0 : (cumP[k] - cumP[a]) / span; m[k] = wpM[i] + fr * l.mi; tt[k] = wpT[i] + fr * l.hr; } });
    return { src, ts: ts || null, g: geom, m, t: tt, wpi, wpM, wpT, legs, miles: wpM[wpM.length - 1], hours: wpT[wpT.length - 1] };
  }
  /* point on the route at drive-hour value (key 't') or road-mile value (key 'm') */
  function ptAt(model, v, key) {
    const arr = model[key], n = arr.length; let lo = 0, hi = n - 1;
    if (v <= arr[0]) return { lat: model.g[0][0], lon: model.g[0][1], mi: model.m[0], t: model.t[0], idx: 0 };
    if (v >= arr[n - 1]) return { lat: model.g[n - 1][0], lon: model.g[n - 1][1], mi: model.m[n - 1], t: model.t[n - 1], idx: n - 1 };
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] <= v) lo = mid; else hi = mid; }
    const f = (arr[hi] - arr[lo]) ? (v - arr[lo]) / (arr[hi] - arr[lo]) : 0;
    return { lat: model.g[lo][0] + (model.g[hi][0] - model.g[lo][0]) * f, lon: model.g[lo][1] + (model.g[hi][1] - model.g[lo][1]) * f, mi: model.m[lo] + (model.m[hi] - model.m[lo]) * f, t: model.t[lo] + (model.t[hi] - model.t[lo]) * f, idx: hi };
  }
  const MM = new Map();
  function modelOf(t, pts) {
    pts = pts || pointsOf(t); if (pts.length < 2) return null;
    const key = keyOf(pts), rc = t.routeCache, real = !!(rc && rc.key === key && Array.isArray(rc.geom) && rc.geom.length > 1 && Array.isArray(rc.legs) && rc.legs.length === pts.length - 1);
    const tag = key + '|' + (real ? rc.ts : 'est'), hit = MM.get(t.id); if (hit && hit.tag === tag) return hit.model;
    let model;
    if (real) model = buildModel(pts, rc.legs, rc.geom, 'osrm', rc.ts);
    else {
      const legs = []; for (let i = 1; i < pts.length; i++) { const mi = G.mi(pts[i - 1], pts[i]) * 1.25; legs.push({ mi, hr: mi / 55 }); }
      model = buildModel(pts, legs, pts.map(p => [p.lat, p.lon]), 'estimate', null, pts.map((_, i) => i));
    }
    MM.set(t.id, { tag, model }); return model;
  }

  /* ---------- the day-by-day plan ---------- */
  const PM = new Map();
  function planOf(t) {
    const sig = JSON.stringify([t.waypoints.map(w => [w.lat, w.lon, w.nights, w.kind, w.label]), t.roundTrip, t.startDate, t.prefs, t.vehicle.rangeMi, t.vehicle.type, t.party.kids, t.routeCache && t.routeCache.key, t.routeCache && t.routeCache.ts, OA.unit.dist()]);
    const hit = PM.get(t.id); if (hit && hit.sig === sig) return hit.p;
    const p = compute(t); PM.set(t.id, { sig, p }); return p;
  }
  function compute(t) {
    const pts = pointsOf(t), model = modelOf(t, pts), p = { pts, model, days: [], arrive: {}, nights: [], miles: 0, hours: 0, endDate: null };
    if (!model) return p;
    const H = clamp(+t.prefs.maxDriveHoursPerDay || 6, 1, 14), B = t.party.kids > 0 ? 2 : 3, depT = validTime(t.prefs.departTime).split(':').map(Number);
    const total = model.hours, last = pts.length - 1, tw = model.wpT, mw = model.wpM;
    const rng = +t.vehicle.rangeMi > 0 ? +t.vehicle.rangeMi : 0, isEv = t.vehicle.type === 'ev';
    const forced = pts.map((q, i) => i === last || (i > 0 && q.nights > 0));
    p.miles = model.miles; p.hours = model.hours;
    let tcur = 0, date = validKey(t.startDate) ? t.startDate : OA.dkey(), n = 0, guard = 0;
    let from = { label: pts[0].label, wpIdx: 0, lat: pts[0].lat, lon: pts[0].lon };
    while (tcur < total - 0.004 && guard++ < 400) {
      let f = last; for (let i = 1; i <= last; i++) if (forced[i] && tw[i] > tcur + 0.004) { f = i; break; }
      let t1, toWp = null, sugg = false;
      if (tw[f] - tcur <= H + 0.001) { t1 = tw[f]; toWp = f; } else { t1 = tcur + H; sugg = true; }
      const a = ptAt(model, tcur, 't'), b = ptAt(model, t1, 't');
      let nextWp = null; if (sugg) { for (let i = 1; i <= last; i++) if (tw[i] > t1 + 0.004) { nextWp = i; break; } }
      const to = toWp != null ? { label: pts[toWp].label, wpIdx: toWp, lat: pts[toWp].lat, lon: pts[toWp].lon, suggested: false, mile: mw[toWp] }
        : { label: 'Suggested overnight', wpIdx: null, lat: b.lat, lon: b.lon, suggested: true, mile: b.mi, nextWp, toNextMi: nextWp != null ? mw[nextWp] - b.mi : null };
      const hrDay = t1 - tcur, mi0 = tcur === 0 ? 0 : a.mi, mi1 = toWp != null ? mw[toWp] : b.mi;
      const passes = []; for (let i = 1; i < last; i++) if (!forced[i] && tw[i] > tcur + 0.004 && tw[i] < t1 - 0.004) passes.push(i);
      const dd = OA.parseKey(date); dd.setHours(depT[0], depT[1], 0, 0); const depart = dd, passOff = passes.map(i => tw[i] - tcur);
      const clock = x => new Date(depart.getTime() + (x + (x > 0 ? Math.floor((x - 1e-6) / B) : 0) * 0.25 + passOff.filter(o => o < x - 1e-6).length * 0.75) * 3600000);
      const arrive = clock(hrDay); n++;
      const events = [{ k: 'from', label: from.label, wpIdx: from.wpIdx, m: mi0, x: 0, at: depart }];
      passes.forEach(i => events.push({ k: 'pass', label: pts[i].label, wpIdx: i, m: mw[i], x: tw[i] - tcur, at: clock(tw[i] - tcur) }));
      events.push({ k: 'to', label: to.label, wpIdx: toWp, m: mi1, x: hrDay, at: arrive, suggested: sugg, lat: to.lat, lon: to.lon });
      const breaks = []; for (let x = B; x < hrDay - 0.3; x += B) { const bp = ptAt(model, tcur + x, 't'); breaks.push({ x, at: clock(x), lat: bp.lat, lon: bp.lon, mile: bp.mi }); }
      const fuels = []; if (rng > 0) { const step = 0.8 * rng, dm = mi1 - mi0; for (let k = 1; k * step < dm - 8; k++) { const fp = ptAt(model, mi0 + k * step, 'm'); fuels.push({ dayMi: k * step, mile: fp.mi, lat: fp.lat, lon: fp.lon, at: clock(fp.t - tcur), ev: isEv }); } }
      const flags = [];
      if (hrDay > 8) flags.push({ lv: 'warn', t: 'A long driving day (' + OA.hm(hrDay) + '). Tiredness is a real risk past about 8 hours: share the driving, add breaks, or add a night.' });
      const sun1 = G.sun(to.lat, to.lon, arrive), sun0 = G.sun(from.lat, from.lon, depart);
      if (sun1 && sun1.set) {
        const dm = (arrive - sun1.set) / 60000;
        if (dm > 0) flags.push({ lv: 'danger', t: 'Arrive after dark: about ' + Math.round(dm) + ' min after sunset (' + ft(sun1.set) + '). Dusk and dawn are peak times for deer and other animals on the road. Leave earlier or stop sooner.' });
        else if (dm > -60) flags.push({ lv: 'warn', t: 'Sunset is ' + ft(sun1.set) + ' and you arrive about ' + Math.round(-dm) + ' min before it. Tight if anything runs late.' });
      }
      if (sun0 && sun0.rise && depart < sun0.rise) flags.push({ lv: 'info', t: 'You leave before sunrise (' + ft(sun0.rise) + '). Take care in the dark and watch for animals.' });
      const dtz = tzOf(to.lon) - tzOf(from.lon);
      if (dtz) flags.push({ lv: 'info', t: 'Time zone: local clocks there are about ' + Math.abs(dtz) + ' h ' + (dtz < 0 ? 'behind' : 'ahead of') + ' where this leg starts (approximate, from longitude; real borders and daylight saving differ). Times here are on your departure clock.' });
      const day = { n, date, type: 'drive', from, to, t0: tcur, t1, mi: mi1 - mi0, hr: hrDay, mi0, mi1, depart, arrive, events, passes, breaks, fuels, flags, B };
      p.days.push(day);
      const idStart = pts[0].id; if (n === 1) p.arrive[idStart] = { date, at: depart, n };
      passes.forEach((i, j) => { p.arrive[pts[i].id] = { date, at: events[1 + j].at, n }; });
      if (toWp != null) p.arrive[pts[toWp].id] = { date, at: arrive, n };
      const nn = toWp != null ? (pts[toWp].nights || 0) : 1, place = { label: to.label, lat: to.lat, lon: to.lon, suggested: sugg, wpIdx: toWp };
      for (let k = 0; k < nn; k++) p.nights.push(Object.assign({ date: OA.addDays(date, k) }, place));
      for (let k = 1; k < nn; k++) { n++; p.days.push({ n, date: OA.addDays(date, k), type: 'stay', from: place, to: place, mi: 0, hr: 0, flags: [], events: [], passes: [], breaks: [], fuels: [] }); }
      date = OA.addDays(date, Math.max(1, nn)); tcur = t1; from = { label: to.label, wpIdx: toWp, lat: to.lat, lon: to.lon };
      if (nn > 1 && toWp !== last) { /* next drive day already dated after the stay */ }
    }
    const lastDay = p.days[p.days.length - 1]; p.endDate = lastDay ? lastDay.date : null;
    t.waypoints.forEach(w => { const a = p.arrive[w.id]; w.arrive = a ? a.date : null; });
    t.days = p.days.map(d => ({ n: d.n, date: d.date, type: d.type, from: d.from.label, to: d.to.label, mi: r1(d.mi), hr: Math.round(d.hr * 100) / 100, suggested: !!d.to.suggested }));
    return p;
  }
  function nightsOn(date, t) { t = t || cur(); if (!t) return null; const n = planOf(t).nights.find(x => x.date === date); return n ? Object.assign({}, n) : null; }
  function summary(t) {
    t = t || cur(); if (!t) return null; const p = planOf(t);
    return { id: t.id, name: t.name, startDate: t.startDate, endDate: p.endDate || t.endDate || null, days: p.days.length, nights: p.nights.length, miles: p.model ? p.miles : 0, hours: p.model ? p.hours : 0, src: p.model ? p.model.src : null, waypoints: t.waypoints.length, vehicle: t.vehicle, party: t.party };
  }
  function legsOf(t) { t = t || cur(); if (!t) return []; const p = planOf(t); return p.model ? p.model.legs.map((l, i) => ({ from: p.pts[i], to: p.pts[i + 1], mi: l.mi, hr: l.hr, src: p.model.src })) : []; }
  function addWp(t, o) {
    let kind = KINDS[o.kind] ? o.kind : (t.waypoints.length ? 'stop' : 'start');
    const w = { id: OA.uid(), label: String(o.label || o.name || 'Stop').slice(0, 80), lat: +o.lat, lon: +o.lon, kind, nights: isNum(+o.nights) ? Math.max(0, Math.round(+o.nights)) : (kind === 'camp' || kind === 'hotel' ? 1 : 0), arrive: null, notes: o.notes ? String(o.notes).slice(0, 400) : '', ref: o.ref || null };
    if (kind === 'start') t.waypoints.unshift(w); else if (kind === 'end') t.waypoints.push(w);
    else { const l = t.waypoints[t.waypoints.length - 1]; if (l && l.kind === 'end') t.waypoints.splice(t.waypoints.length - 1, 0, w); else t.waypoints.push(w); }
    return w;
  }
  RT.trip = Object.assign(RT.trip || {}, {
    current: () => cur(), list: () => { init(); return S().trips; }, points: t => { t = t || cur(); return t ? pointsOf(t) : []; }, legs: legsOf, summary, plan: t => { t = t || cur(); return t ? planOf(t) : null; }, nightsOn,
    addStop(stop) {
      if (!stop || !isNum(+stop.lat) || !isNum(+stop.lon)) return null; init();
      let t = cur(); if (!t) { t = newTrip(); S().trips.push(t); S().cur = t.id; }
      const w = addWp(t, stop); changed(); redraw(); return w;
    }
  });

  /* ---------- routing: one OSRM request per tap ---------- */
  const MAXC = 25; let routing = null, routeNote = null;
  const chunksOf = n => { const out = []; let s = 0; while (s < n - 1) { const e = Math.min(n - 1, s + MAXC - 1); out.push([s, e]); s = e; } return out; };
  async function getChunk(pts, s, e, allowNet) {
    const sub = pts.slice(s, e + 1), key = keyOf(sub), id = 'rt:' + hash(key); let rec = null;
    try { rec = await OA.db.get('cache', id); } catch (x) { }
    if (rec && rec.key === key && rec.v && Date.now() - rec.ts < 90 * 86400000) return { v: rec.v, ts: rec.ts, cached: true };
    if (!allowNet) return null;
    if (!OA.online()) throw new Error('You are offline.');
    const url = 'https://router.project-osrm.org/route/v1/driving/' + sub.map(q => q.lon.toFixed(5) + ',' + q.lat.toFixed(5)).join(';') + '?overview=simplified&geometries=geojson&steps=false';
    let j; try { j = await OA.fetchJSON(url, null, 20000); } catch (x) { throw new Error(x && x.name === 'AbortError' ? 'The router did not answer in time. Try again in a moment.' : 'The router is not reachable right now (' + (x && x.message || 'network') + ').'); }
    if (!j || j.code !== 'Ok' || !j.routes || !j.routes[0]) throw new Error(j && j.code === 'NoRoute' ? 'No driving route between some of these places (islands, ferries or closed areas?).' : 'The router could not find a route' + (j && j.code ? ' (' + j.code + ')' : '') + '.');
    const r = j.routes[0], legs = (r.legs || []).map(l => ({ mi: Math.round(l.distance / 1609.344 * 10) / 10, hr: Math.round(l.duration / 36) / 100 }));
    if (legs.length !== sub.length - 1) throw new Error('The router answer did not match the stops. Try again.');
    const geom = simplify((r.geometry && r.geometry.coordinates || []).map(c => [c[1], c[0]]), 300);
    if (geom.length < 2) throw new Error('The router sent no route line.');
    const v = { legs, geom }, ts = Date.now(); try { await OA.db.put('cache', { id, key, ts, v }); } catch (x) { }
    return { v, ts, cached: false };
  }
  function assemble(parts, ptsKey) {
    const legs = [], geom = []; let ts = Infinity;
    parts.forEach((r, i) => { legs.push.apply(legs, r.v.legs); const g = r.v.geom; geom.push.apply(geom, i ? g.slice(1) : g); ts = Math.min(ts, r.ts); });
    return { key: ptsKey, ts, src: 'osrm', legs, geom, parts: parts.length };
  }
  async function fetchRoute(t) {
    const pts = pointsOf(t); if (pts.length < 2) throw new Error('Add at least two places first.');
    const ch = chunksOf(pts.length), parts = []; let net = false;
    for (const [s, e] of ch) {
      let r = await getChunk(pts, s, e, false);
      if (!r) { if (net) return { partial: true, done: parts.length, of: ch.length }; r = await getChunk(pts, s, e, true); net = true; }
      parts.push(r);
    }
    t.routeCache = assemble(parts, keyOf(pts)); OA.save(); return { partial: false, net };
  }
  const adopted = new Set();
  async function autoAdopt(t) {   // reuse a saved route (IndexedDB) for this exact list of places, with no network
    const pts = pointsOf(t); if (pts.length < 2) return; const key = keyOf(pts);
    if (adopted.has(t.id + key) || (t.routeCache && t.routeCache.key === key)) return; adopted.add(t.id + key);
    try {
      const parts = []; for (const [s, e] of chunksOf(pts.length)) { const r = await getChunk(pts, s, e, false); if (!r) return; parts.push(r); }
      t.routeCache = assemble(parts, key); OA.saveSoon(); redraw();
    } catch (x) { }
  }

  /* ---------- link builders ---------- */
  const f6 = v => v.toFixed(6);
  function navLinks(t, lat, lon, label) {
    const av = []; if (t && t.prefs.avoidTolls) av.push('tolls'); if (t && t.prefs.avoidHighways) av.push('highways');
    return {
      apple: `https://maps.apple.com/?daddr=${f6(lat)},${f6(lon)}&dirflg=d`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${f6(lat)},${f6(lon)}&travelmode=driving` + (av.length ? '&avoid=' + encodeURIComponent(av.join('|')) : ''),
      waze: `https://waze.com/ul?ll=${f6(lat)},${f6(lon)}&navigate=yes`
    };
  }
  function gRoutes(t, pts) {
    const out = [], av = []; if (t.prefs.avoidTolls) av.push('tolls'); if (t.prefs.avoidHighways) av.push('highways'); let s = 0;
    const c = q => f6(q.lat) + ',' + f6(q.lon);
    while (s < pts.length - 1) {
      const e = Math.min(pts.length - 1, s + 10), mid = pts.slice(s + 1, e);
      out.push({ from: pts[s].label, to: pts[e].label, url: 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(c(pts[s])) + '&destination=' + encodeURIComponent(c(pts[e])) + (mid.length ? '&waypoints=' + encodeURIComponent(mid.map(c).join('|')) : '') + '&travelmode=driving' + (av.length ? '&avoid=' + encodeURIComponent(av.join('|')) : '') });
      s = e;
    }
    return out;
  }
  const lnk = (u, l) => `<a class="mini" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`;

  /* ---------- text outputs ---------- */
  const fdate = k => OA.fmtDate(k), dayTitle = d => 'Day ' + d.n + ', ' + fdate(d.date);
  function itinText(t, p) {
    const L = [t.name, ''];
    L.push('Dates: ' + fdate(t.startDate) + (p.endDate ? ' to ' + fdate(p.endDate) : ''), 'Party: ' + t.party.adults + ' adult' + (t.party.adults === 1 ? '' : 's') + (t.party.kids ? ', ' + t.party.kids + ' kid' + (t.party.kids === 1 ? '' : 's') : ''));
    if (p.model) L.push('Route: about ' + OA.dist(p.miles, 0) + ', ' + OA.hm(p.hours) + ' of driving (' + (p.model.src === 'osrm' ? 'estimated without traffic' : 'rough estimate') + ')');
    L.push('');
    p.days.forEach(d => {
      if (d.type === 'stay') { L.push(dayTitle(d) + ': stay at ' + d.to.label); return; }
      L.push(dayTitle(d) + ': ' + d.from.label + ' to ' + (d.to.suggested ? 'overnight near mile ' + OA.dist(d.to.mile, 0) + ' (place to be chosen)' : d.to.label));
      L.push('  ' + OA.dist(d.mi, 0) + ', ' + OA.hm(d.hr) + ' driving. Leave ' + ft(d.depart) + ', arrive about ' + ft(d.arrive));
      const nt = t.waypoints.find(w => w.id === (p.pts[d.to.wpIdx] || {}).id);
      if (nt && nt.notes) L.push('  Note: ' + nt.notes);
    });
    L.push('', 'Made with Roadtripica. Times are estimates; check conditions and closures before you go.');
    return L.join('\n');
  }
  function leaveText(t, p) {
    const L = ['ROAD TRIP LEAVE-BEHIND NOTE', t.name, ''];
    L.push('Who: ' + t.party.adults + ' adult' + (t.party.adults === 1 ? '' : 's') + (t.party.kids ? ', ' + t.party.kids + ' kid' + (t.party.kids === 1 ? '' : 's') : ''), 'Vehicle: ' + VEH[t.vehicle.type].label + ' (add colour and plate here)');
    L.push('Dates: ' + fdate(t.startDate) + (p.endDate ? ' to ' + fdate(p.endDate) : ''), '');
    L.push('Planned nights:');
    if (!p.nights.length) L.push('  (none planned yet)');
    p.nights.forEach(n => { L.push('  ' + fdate(n.date) + ': ' + (n.suggested ? 'near ' : '') + n.label + '  https://maps.google.com/?q=' + f6(n.lat) + ',' + f6(n.lon)); });
    L.push('', 'Check-in plan: ' + (t.leave.checkin || 'I will message you each evening.'));
    if (t.leave.contact) L.push('Please tell: ' + t.leave.contact + ' if you have not heard from us.');
    L.push('If you have not heard from us when expected: try calling us, then the places we planned to stay. If you are worried, call the sheriff or police non-emergency line for the last place we were expected, or 911 if you think someone is in danger.', '', 'Sent ' + new Date().toLocaleString() + '. Plans can change; I will send an update if they do.');
    return L.join('\n');
  }
  const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const fold = line => { const out = []; while (line.length > 73) { out.push(line.slice(0, 73)); line = ' ' + line.slice(73); } out.push(line); return out.join('\r\n'); };
  function icsText(t, p) {
    const ymd = k => k.replace(/-/g, ''), st = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occultica//Roadtripica//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsEsc(t.name)];
    const ev = (uid, sum, a, b, desc, geo) => { L.push('BEGIN:VEVENT', 'UID:' + uid + '@roadtripica', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + ymd(a), 'DTEND;VALUE=DATE:' + ymd(b), 'SUMMARY:' + icsEsc(sum)); if (desc) L.push('DESCRIPTION:' + icsEsc(desc)); if (geo) L.push('GEO:' + geo[0].toFixed(5) + ';' + geo[1].toFixed(5)); L.push('END:VEVENT'); };
    if (p.endDate) ev(t.id + '-trip', 'Road trip: ' + t.name, t.startDate, OA.addDays(p.endDate, 1), 'Planned in Roadtripica.');
    const groups = []; p.nights.forEach(n => { const g = groups[groups.length - 1]; if (g && g.label === n.label && g.lat === n.lat && g.lon === n.lon && OA.addDays(g.date, g.count) === n.date) g.count++; else groups.push(Object.assign({ count: 1 }, n)); });
    groups.forEach((g, i) => ev(t.id + '-stay-' + i, (g.suggested ? 'Overnight (place to choose): near ' : 'Stay: ') + g.label, g.date, OA.addDays(g.date, g.count), (g.suggested ? 'Suggested overnight point along the route; choose a real place to stay. ' : '') + 'Coordinates ' + g.lat.toFixed(5) + ', ' + g.lon.toFixed(5), [g.lat, g.lon]));
    L.push('END:VCALENDAR'); return L.map(fold).join('\r\n') + '\r\n';
  }
  function printHtml(t, p) {
    const rows = p.days.map(d => d.type === 'stay' ? `<tr><td>${d.n}</td><td>${esc(fdate(d.date))}</td><td colspan="3">Stay at ${esc(d.to.label)}</td></tr>` :
      `<tr><td>${d.n}</td><td>${esc(fdate(d.date))}</td><td>${esc(d.from.label)} to ${esc(d.to.suggested ? 'overnight near mile ' + OA.dist(d.to.mile, 0) : d.to.label)}</td><td>${esc(OA.dist(d.mi, 0))}, ${esc(OA.hm(d.hr))}</td><td>${esc(ft(d.depart))} to ${esc(ft(d.arrive))}</td></tr>`).join('');
    const wps = t.waypoints.map(w => `<tr><td>${esc(w.label)}</td><td>${esc((KINDS[w.kind] || KINDS.stop)[0])}${w.nights ? ', ' + w.nights + ' night' + (w.nights > 1 ? 's' : '') : ''}</td><td>${esc(G.fmtCoord(w.lat, w.lon, 'dd'))}</td><td>${esc(w.notes)}</td></tr>`).join('');
    return `<h1>${esc(t.name)}</h1><p>${esc(fdate(t.startDate))}${p.endDate ? ' to ' + esc(fdate(p.endDate)) : ''}. ${p.model ? esc(OA.dist(p.miles, 0)) + ', ' + esc(OA.hm(p.hours)) + ' of driving (' + (p.model.src === 'osrm' ? 'estimated without traffic' : 'rough estimate') + ')' : ''}</p>
      <h2>Days</h2><table class="t"><tr><th>#</th><th>Date</th><th>Route</th><th>Drive</th><th>Clock</th></tr>${rows}</table>
      <h2>Places</h2><table class="t"><tr><th>Place</th><th>Type</th><th>Coordinates</th><th>Notes</th></tr>${wps}</table>
      <p style="font-size:.8em">Times are estimates on your departure clock. Check road conditions and closures before you go. Printed from Roadtripica.</p>`;
  }

  /* ---------- screens ---------- */
  const bindBase = t => 'trip.trips.' + idxOf(t);
  function emptyHtml() {
    return `<div class="card rt-newform"><div class="ct"><span>${OA.icon('route')} Plan your first road trip</span></div>
      <p class="sm dim">Name it, then add the places you want to pass through. Roadtripica works out the driving distance and time, splits it into days you choose, and keeps everything on this phone, so it works with no signal.</p>
      <label class="fl">Trip name<input class="in rt-nn" placeholder="Sierra to Death Valley" maxlength="60"></label>
      <label class="fl">Start date<input class="in rt-nd" type="date" value="${esc(OA.dkey())}"></label>
      <button class="btn gold block" data-act="tripCreate">Start the trip</button></div>
      <button class="btn block" data-act="tripHelp" data-smoke>How the planning works</button>`;
  }
  function tripBar(t) {
    const chips = S().trips.map(x => `<button class="chip ${x.id === t.id ? 'on' : ''}" data-act="tripSwitch" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('');
    return `<div class="chips">${chips}<button class="chip" data-act="tripNewSheet">+ New trip</button></div>`;
  }
  function srcLine(t, p) {
    const m = p.model; if (!m) return '<span class="dim">Add at least two places to see distance and drive time.</span>';
    if (m.src === 'osrm') return `<span class="online-pill">Driving route</span> ${esc(ROUTE_LABEL)}. Saved ${esc(OA.ago(m.ts))}.`;
    return `<span class="offline-pill">Rough estimate</span> Straight-line distance x 1.25 at 55 mph. Tap "Get driving route" for a real route.`;
  }
  function heroHtml(t, p) {
    const m = p.model, ti = idxOf(t); let over = '';
    if (t.endDate && p.endDate && p.endDate > t.endDate) over = `<div class="alert"><b class="t">Plan runs past your end date</b>The itinerary ends ${esc(fdate(p.endDate))}, ${OA.daysBetween(t.endDate, p.endDate)} day(s) after ${esc(fdate(t.endDate))}. Raise the daily driving limit, drop a night or change the end date.</div>`;
    return `<div class="hero"><div class="ct"><span>${esc(t.name)}</span><button class="mini" data-act="tripSettings">Settings</button></div>
      <div class="sm dim">${esc(fdate(t.startDate))}${p.endDate ? ' to ' + esc(fdate(p.endDate)) : ''} · ${t.party.adults} adult${t.party.adults === 1 ? '' : 's'}${t.party.kids ? ', ' + t.party.kids + ' kid' + (t.party.kids === 1 ? '' : 's') : ''} · ${esc(VEH[t.vehicle.type].label)}</div>
      <div class="stat rt-stat"><div><b>${m ? esc(OA.dist(p.miles, 0)) : '–'}</b><span>DRIVING</span></div><div><b>${m ? esc(OA.hm(p.hours)) : '–'}</b><span>DRIVE TIME</span></div><div><b>${p.days.length || '–'}</b><span>DAYS</span></div><div><b>${p.nights.length || '–'}</b><span>NIGHTS</span></div></div>
      <div class="xs">${srcLine(t, p)}</div></div>${over}`;
  }
  function viewChips() {
    return `<div class="chips">${[['plan', 'Places'], ['days', 'Days'], ['strip', 'Route strip']].map(v => `<button class="chip ${S().view === v[0] ? 'on' : ''}" data-act="tripView" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>`;
  }
  function sharedPlacesHtml() {
    const l = window.OCC && OCC.places ? OCC.places.list().filter(p => isNum(p.lat) && isNum(p.lon)).slice(0, 40) : [];
    if (!l.length) return '';
    return `<div class="sh-sec"><h3>Shared places</h3><p class="xs dim">Saved in Campica or Expandica on this site.</p>${l.map(p => `<button class="btn block" data-act="tripPlace" data-id="${esc(p.id)}">${esc(p.name)}${p.state ? ' · ' + esc(p.state) : ''}</button>`).join('')}</div>`;
  }
  function wpList(t, p) {
    if (!t.waypoints.length) return `<div class="card"><div class="ct"><span>${OA.icon('pin')} Places</span></div><p class="sm dim">Nothing here yet. Add where you start, the places you want to visit or sleep, and where you finish.</p><button class="btn gold block" data-act="tripAdd">Add a place</button></div>`;
    const legs = p.model ? p.model.legs : [], last = t.waypoints.length - 1;
    const rows = t.waypoints.map((w, i) => {
      const k = KINDS[w.kind] || KINDS.stop, a = p.arrive[w.id], l = legs[i];
      const sub = [k[0] + (w.nights ? ' · ' + w.nights + ' night' + (w.nights > 1 ? 's' : '') : ''), a ? fdate(a.date) : ''].filter(Boolean).join(' · ');
      const hint = (w.kind === 'camp' || w.kind === 'hotel') && !w.nights && i > 0 && i < last ? ' <span class="tag w">0 nights</span>' : '';
      return `<div class="li" data-act="tripWp" data-i="${i}"><span class="ic">${OA.icon(k[1])}</span><span class="tx"><b>${esc(w.label)}${hint}</b><span>${esc(sub)}</span></span>
        <span class="rt-ctl"><button class="rt-ib" data-act="tripUp" data-i="${i}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>&#9650;</button><button class="rt-ib" data-act="tripDown" data-i="${i}" aria-label="Move down" ${i === last ? 'disabled' : ''}>&#9660;</button></span></div>` +
        (l ? `<div class="rt-leg">${OA.icon('route', 'sm')} ${esc(OA.dist(l.mi, 0))} · ${esc(OA.hm(l.hr))}${p.model.src === 'estimate' ? ' (rough)' : ''}</div>` : '');
    }).join('');
    const ret = t.roundTrip && p.model ? (() => { const l = legs[legs.length - 1]; return `<div class="li"><span class="ic">${OA.icon('home')}</span><span class="tx"><b>Back to ${esc(t.waypoints[0].label)}</b><span>Round trip</span></span></div>` + ''; })() : '';
    return `<div class="card"><div class="ct"><span>${OA.icon('pin')} Places (${t.waypoints.length})</span><button class="mini" data-act="tripAdd">+ Add</button></div>${rows}${ret}
      <label class="chk"><input type="checkbox" data-bind="${bindBase(t)}.roundTrip" data-type="bool" data-then="tripChanged" ${t.roundTrip ? 'checked' : ''}> Round trip (drive back to the first place)</label></div>`;
  }
  function routeCard(t, p) {
    const busy = routing === t.id, n = t.waypoints.length, ch = chunksOf(pointsOf(t).length).length;
    const note = routeNote && routeNote.id === t.id ? `<div class="alert ${routeNote.kind === 'err' ? '' : routeNote.kind === 'ok' ? 'ok' : ''}"><b class="t">${esc(routeNote.title)}</b>${esc(routeNote.text)}</div>` : '';
    return `<div class="card"><div class="ct"><span>${OA.icon('route')} Driving route</span></div>
      <p class="sm dim">${n < 2 ? 'Add at least two places first.' : 'Gets the real road distance and drive time from the free OSRM demo router, one request per tap, and keeps it on this phone for offline use.' + (ch > 1 ? ' Long trips load in ' + ch + ' parts, one per tap.' : '')}</p>
      <button class="btn gold block" data-act="tripRoute" ${busy || n < 2 ? 'disabled' : ''}>${busy ? '<span class="spin"></span> Getting route…' : (p.model && p.model.src === 'osrm' ? 'Refresh driving route' : 'Get driving route')}</button>${note}
      <div class="xs dim">${p.model && p.model.src === 'osrm' ? 'This route is saved: everything on this screen works offline, and it is included in your backup code.' : 'Without a saved route, distances use a rough estimate.'} ${t.prefs.avoidTolls || t.prefs.avoidHighways ? 'The demo router cannot avoid tolls or highways: those choices apply to the Google Maps links only.' : ''}</div></div>`;
  }
  function shareCard(t, p) {
    return `<div class="card"><div class="ct"><span>${OA.icon('share')} Share and take along</span></div>
      <div class="two"><button class="btn" data-act="tripShare">Share itinerary</button><button class="btn" data-act="tripPrint">Print</button><button class="btn" data-act="tripIcs">Calendar file</button><button class="btn" data-act="tripLeave">Leave-behind note</button></div>
      <button class="btn block" data-act="tripNav">Navigate the whole route</button>
      <button class="lnk" data-act="tripHelp">How the planning works</button></div>`;
  }
  function parcelCard(t, p) { try { return window.RT && RT.parcels && RT.parcels.card ? RT.parcels.card(t, p) : ''; } catch (e) { return ''; } }
  function planView(t, p) { return wpList(t, p) + routeCard(t, p) + parcelCard(t, p) + shareCard(t, p); }

  function flagHtml(f) { return `<div class="alert ${f.lv === 'danger' ? 'danger' : ''}" style="${f.lv === 'info' ? 'border-color:var(--line);background:none' : ''}"><b class="t" style="${f.lv === 'info' ? 'color:var(--dim)' : ''}">${f.lv === 'danger' ? 'After dark' : f.lv === 'warn' ? 'Heads up' : 'Note'}</b>${esc(f.t)}</div>`; }
  function daysView(t, p) {
    const H = +t.prefs.maxDriveHoursPerDay || 6, ti = idxOf(t);
    let h = `<div class="card"><div class="ct"><span>${OA.icon('clock')} Driving per day</span><span class="sm dim">${H} h max</span></div>
      <div class="chips wrap">${[3, 4, 5, 6, 8, 10].map(v => `<button class="chip ${H === v ? 'on' : ''}" data-act="tripMaxDrive" data-v="${v}">${v} h</button>`).join('')}</div>
      <label class="fl">Leave at<input class="in" type="time" value="${esc(validTime(t.prefs.departTime))}" data-bind="${bindBase(t)}.prefs.departTime" data-then="tripChanged"></label>
      <div class="xs dim">Days are split by driving time only. Clock times add 15 minutes per break (every ${t.party.kids > 0 ? 2 : 3} h) and 45 minutes at each pass-through stop. Times use your phone's clock where you start.</div></div>`;
    if (t.party.kids > 0 && H > 5) h += `<div class="alert"><b class="t">Driving with kids</b>Around 4 to 5 hours of driving a day tends to go better with children. <div class="row"><button class="btn" data-act="tripMaxDrive" data-v="5">Use 5 hours</button></div></div>`;
    if (H > 8) h += `<div class="alert"><b class="t">Long driving days</b>More than about 8 hours a day raises the risk of drowsy driving. Share the driving or add nights.</div>`;
    if (!p.days.length) return h + `<div class="card"><p class="sm dim">${t.waypoints.length < 2 ? 'Add at least two places to see your driving days.' : 'These places are too close together to need driving days. Add places farther apart.'}</p></div>`;
    p.days.forEach(d => {
      if (d.type === 'stay') { h += `<div class="card"><div class="ct"><span>${esc(dayTitle(d))}</span><span class="tag">Stay</span></div><div class="sm">Stay at ${esc(d.to.label)}. No driving planned.</div></div>`; return; }
      const via = d.passes.length ? `<div class="sm dim">Passing: ${d.passes.map(i => esc(p.pts[i].label)).join(', ')}</div>` : '';
      h += `<div class="card"><div class="ct"><span>${esc(dayTitle(d))}</span><span class="sm dim">${esc(OA.dist(d.mi, 0))} · ${esc(OA.hm(d.hr))}</span></div>
        <div><b>${esc(d.from.label)}</b> &rarr; <b>${esc(d.to.suggested ? 'Overnight near mile ' + OA.dist(d.to.mile, 0) : d.to.label)}</b>${d.to.suggested ? ' <span class="tag a">place to choose</span>' : ''}</div>${via}
        <div class="sm dim">Leave ${esc(ft(d.depart))} · arrive about ${esc(ft(d.arrive))}${OA.dkey(d.arrive) !== d.date ? ' (next day)' : ''} · ${d.breaks.length} rest break${d.breaks.length === 1 ? '' : 's'}${d.fuels.length ? ' · ' + d.fuels.length + (d.fuels[0].ev ? ' charging' : ' fuel') + ' stop' + (d.fuels.length > 1 ? 's' : '') : ''}</div>
        ${d.flags.map(flagHtml).join('')}<div class="row"><button class="btn" data-act="tripDay" data-n="${d.n}">Day details</button></div></div>`;
    });
    return h;
  }

  function sketchSvg(t, p) {
    const m = p.model; if (!m) return '';
    const W = 340, Hh = 210, P = 26, g = m.g; let la0 = 1e9, la1 = -1e9, lo0 = 1e9, lo1 = -1e9;
    g.forEach(q => { la0 = Math.min(la0, q[0]); la1 = Math.max(la1, q[0]); lo0 = Math.min(lo0, q[1]); lo1 = Math.max(lo1, q[1]); });
    const k = Math.cos((la0 + la1) / 2 * Math.PI / 180), sx = (lo1 - lo0) * k || 0.01, sy = (la1 - la0) || 0.01, sc = Math.min((W - 2 * P) / sx, (Hh - 2 * P) / sy), ox = (W - sx * sc) / 2, oy = (Hh - sy * sc) / 2;
    const X = lon => ox + (lon - lo0) * k * sc, Y = lat => oy + (la1 - lat) * sc, step = Math.max(1, Math.floor(g.length / 400));
    const d = g.filter((_, i) => i % step === 0 || i === g.length - 1).map((q, i) => (i ? 'L' : 'M') + X(q[1]).toFixed(1) + ' ' + Y(q[0]).toFixed(1)).join('');
    const dash = m.src === 'estimate' ? ' stroke-dasharray="5 4"' : '';
    let s = `<svg class="rt-sketch" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Sketch of the route: ${esc(p.pts.map(q => q.label).join(', then '))}"><rect x="0.5" y="0.5" width="${W - 1}" height="${Hh - 1}" rx="12" fill="var(--panel)" stroke="var(--line)"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"${dash}/>`;
    p.days.forEach(dy => { if (dy.type === 'drive' && dy.to.suggested) s += `<g data-act="tripDay" data-n="${dy.n}"><circle cx="${X(dy.to.lon).toFixed(1)}" cy="${Y(dy.to.lat).toFixed(1)}" r="14" fill="transparent"/><path d="M${X(dy.to.lon).toFixed(1)} ${(Y(dy.to.lat) - 6).toFixed(1)}l6 6-6 6-6-6z" fill="var(--bg)" stroke="var(--gold)" stroke-width="1.6"/></g>`; });
    p.pts.forEach((q, i) => {
      const x = X(q.lon).toFixed(1), y = Y(q.lat).toFixed(1), col = i === 0 ? 'var(--green)' : (i === p.pts.length - 1 ? 'var(--gold)' : 'var(--accent)');
      s += `<g ${q.virtual ? '' : `data-act="tripWp" data-i="${q.idx}"`} style="cursor:pointer"><circle cx="${x}" cy="${y}" r="15" fill="transparent"/><circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="var(--bg)" stroke-width="2"/><text x="${x}" y="${(+y + 3.5).toFixed(1)}" text-anchor="middle" style="font:700 10px Lora,Georgia,serif;fill:#10151f">${q.virtual ? 'R' : i + 1}</text></g>`;
    });
    return s + `<text x="${W - 14}" y="20" text-anchor="middle" style="font:700 10px Lora,Georgia,serif;fill:var(--dim)">N&#8593;</text></svg>`;
  }
  function stripView(t, p) {
    if (!p.model) return `<div class="card"><p class="sm dim">Add at least two places to see the route strip.</p></div>`;
    let h = `<div class="card"><div class="ct"><span>${OA.icon('map')} Route sketch</span><span class="sm dim">offline</span></div>${sketchSvg(t, p)}
      <div class="xs dim">${p.model.src === 'estimate' ? 'Dashed line: straight lines between places, not roads. ' : 'Simplified line of the driving route. '}Numbers match your places; diamonds are suggested overnights. Tap one for details.</div></div>`;
    h += `<div class="card"><div class="ct"><span>${OA.icon('list')} Along the way</span><span class="sm dim">${esc(OA.dist(p.miles, 0))}</span></div>`;
    p.days.forEach(d => {
      if (d.type === 'stay') { h += `<div class="rt-dayhd">${esc(dayTitle(d))} <span class="tag">Stay</span></div><div class="sm dim">Stay at ${esc(d.to.label)}.</div>`; return; }
      h += `<div class="rt-dayhd">${esc(dayTitle(d))}<span class="dim sm"> · ${esc(OA.dist(d.mi, 0))}, ${esc(OA.hm(d.hr))}</span></div><div class="rt-tl">`;
      d.events.forEach((e, j) => {
        if (j) { const a = d.events[j - 1]; h += `<div class="rt-seg">${esc(OA.dist(e.m - a.m, 0))} · ${esc(OA.hm(e.x - a.x - 0))} driving</div>`; }
        const act = e.suggested ? `data-act="tripDay" data-n="${d.n}"` : (e.wpIdx != null && !(p.pts[e.wpIdx] || {}).virtual ? `data-act="tripWp" data-i="${p.pts[e.wpIdx].idx}"` : '');
        h += `<div class="rt-ev ${e.k}" ${act}><b>${esc(e.suggested ? 'Suggested overnight' : e.label)}</b><span>${j ? (e.k === 'from' ? 'leave ' : 'arrive ') : 'leave '}${esc(ft(e.at))} · mile ${esc(OA.dist(e.m, 0))} from start</span></div>`;
      });
      h += `</div>` + d.flags.map(flagHtml).join('');
    });
    return h + '</div>';
  }

  function render() {
    init(); const t = cur();
    if (!t) return OA.header('Trip', 'Plan your route') + emptyHtml();
    autoAdopt(t);
    const p = planOf(t), v = S().view;
    return OA.header('Trip', t.name) + tripBar(t) + heroHtml(t, p) + viewChips() + (v === 'days' ? daysView(t, p) : v === 'strip' ? stripView(t, p) : planView(t, p));
  }
  OA.tab({ id: 'trip', label: 'Trip', icon: 'route', order: 10, render });

  /* ---------- sheets ---------- */
  function helpSheet() {
    OA.sheet('How the planning works', `<div class="sh-sec"><h3>Distances and drive times</h3><p class="sm">With signal, Roadtripica asks the free OSRM demo router for the road route between your places (one request each time you tap the button) and keeps the answer on this phone. The times are estimates for normal driving <b>without traffic</b>, roadworks, weather, stops or closures, so add margin. Without a saved route it uses a rough estimate: straight-line distance x 1.25 at 55 mph.</p></div>
      <div class="sh-sec"><h3>Days, breaks and fuel</h3><p class="sm">Days are split by driving time using your daily limit. Where a day ends between your places, the app suggests an overnight point along the route; it is a spot on the road, not a real town, so choose a place to stay. Rest-break reminders come every 2 hours with kids, every 3 otherwise. A fuel or charging stop is suggested at 80% of the range you set for your vehicle. Stations and chargers are not checked: plan with a current source.</p></div>
      <div class="sh-sec"><h3>Daylight and time zones</h3><p class="sm">Sunrise and sunset come from the sky maths on your phone, so they work offline. Time zones are approximate (from longitude) and ignore real borders and daylight saving. Clock times are on your phone's clock where you start.</p></div>
      <div class="sh-sec"><h3>Leave-behind note</h3><p class="sm">Roadtripica cannot track you live. It has no server, so nobody sees where you are unless you tell them. The note you can share is only as good as the check-in plan you agree.</p></div>`);
  }
  function settingsHtml() {
    const t = cur(); if (!t) return ''; const b = bindBase(t), v = t.vehicle, ev = v.type === 'ev';
    return `<div class="sh-sec"><label class="fl">Trip name<input class="in" maxlength="60" value="${esc(t.name)}" data-bind="${b}.name" data-then="tripChanged"></label>
      <div class="two"><label class="fl">Start date<input class="in" type="date" value="${esc(t.startDate)}" data-bind="${b}.startDate" data-then="tripChanged"></label>
      <label class="fl">Must be home by<input class="in" type="date" value="${esc(t.endDate || '')}" data-bind="${b}.endDate" data-then="tripChanged"></label></div></div>
      <div class="sh-sec"><h3>Who is going</h3><div class="two"><label class="fl">Adults<input class="in" type="number" min="1" max="20" value="${t.party.adults}" data-bind="${b}.party.adults" data-type="number" data-then="tripChanged"></label>
      <label class="fl">Kids<input class="in" type="number" min="0" max="20" value="${t.party.kids}" data-bind="${b}.party.kids" data-type="number" data-then="tripChanged"></label></div></div>
      <div class="sh-sec"><h3>Vehicle</h3><label class="fl">Type<select class="in" data-bind="${b}.vehicle.type" data-then="tripVeh">${Object.keys(VEH).map(k => `<option value="${k}" ${k === v.type ? 'selected' : ''}>${VEH[k].label}</option>`).join('')}</select></label>
      <div class="two"><label class="fl">${ev ? 'Efficiency (MPGe)' : 'Miles per gallon'}<input class="in" type="number" step="0.1" min="1" value="${v.mpg == null ? '' : v.mpg}" data-bind="${b}.vehicle.mpg" data-type="number" data-then="tripChanged"></label>
      ${ev ? '' : `<label class="fl">Tank (gallons)<input class="in" type="number" step="0.5" min="0" value="${v.tankGal == null ? '' : v.tankGal}" data-bind="${b}.vehicle.tankGal" data-type="number" data-then="tripChanged"></label>`}
      <label class="fl">Range on a full ${ev ? 'charge' : 'tank'} (mi)<input class="in" type="number" min="30" value="${v.rangeMi == null ? '' : v.rangeMi}" data-bind="${b}.vehicle.rangeMi" data-type="number" data-then="tripChanged"></label>
      ${v.type === 'rv' || v.type === 'van' ? `<label class="fl">Length (ft)<input class="in" type="number" min="5" value="${v.lengthFt == null ? '' : v.lengthFt}" data-bind="${b}.vehicle.lengthFt" data-type="number" data-then="tripChanged"></label>` : ''}</div>
      <div class="xs dim">Values filled in for a type are typical starting numbers only. Replace them with your vehicle's real figures. Choose a conservative range, especially towing, loaded, in heat, cold or hills.</div></div>
      <div class="sh-sec"><h3>Driving</h3><div class="two"><label class="fl">Max driving hours a day<input class="in" type="number" min="1" max="14" step="0.5" value="${t.prefs.maxDriveHoursPerDay}" data-bind="${b}.prefs.maxDriveHoursPerDay" data-type="number" data-then="tripChanged"></label>
      <label class="fl">Leave at<input class="in" type="time" value="${esc(validTime(t.prefs.departTime))}" data-bind="${b}.prefs.departTime" data-then="tripChanged"></label></div>
      <label class="chk"><input type="checkbox" data-bind="${b}.prefs.avoidTolls" data-type="bool" data-then="tripChanged" ${t.prefs.avoidTolls ? 'checked' : ''}> Avoid tolls (Google Maps links only)</label>
      <label class="chk"><input type="checkbox" data-bind="${b}.prefs.avoidHighways" data-type="bool" data-then="tripChanged" ${t.prefs.avoidHighways ? 'checked' : ''}> Avoid highways (Google Maps links only)</label>
      <div class="xs dim">Distances and times come from a router that ignores these two choices; they only change the navigation links.</div></div>
      <div class="sh-sec"><button class="btn block" data-act="tripDup">Duplicate this trip</button><button class="btn danger block" data-act="tripDelete">Delete this trip</button></div>`;
  }

  let lastGeo = [];
  function addSheet() {
    const t = cur(); if (!t) return;
    OA.sheet('Add a place', `<div class="sh-sec"><label class="fl">Add it as<select class="in" id="rtAddAs"><option value="auto">Automatic (${t.waypoints.length ? 'stop' : 'start'})</option>${Object.keys(KINDS).map(k => `<option value="${k}">${KINDS[k][0]}</option>`).join('')}</select></label></div>
      <div class="sh-sec"><h3>Search for a place</h3><div class="row"><input class="in" id="rtGeoQ" placeholder="Town, park or address" maxlength="120" style="margin:0"><button class="btn gold" data-act="tripGeo" style="flex:none">Search</button></div>
      <div id="rtGeoOut" class="sm dim" style="margin-top:8px">Needs a signal. One search per tap.</div></div>
      <div class="sh-sec"><h3>My location</h3><button class="btn block" data-act="tripMyLoc">Use where I am now</button></div>
      <div class="sh-sec"><h3>Coordinates</h3><div class="two"><label class="fl">Latitude<input class="in" id="rtLat" inputmode="decimal" placeholder="38.5816"></label><label class="fl">Longitude<input class="in" id="rtLon" inputmode="decimal" placeholder="-121.4944"></label></div>
      <label class="fl">Name<input class="in" id="rtCLabel" maxlength="80" placeholder="Optional"></label><button class="btn block" data-act="tripCoord">Add these coordinates</button></div>
      ${sharedPlacesHtml()}
      ${window.CAMPS && Array.isArray(CAMPS.items) ? `<div class="sh-sec"><h3>Saved camps</h3><input class="in" id="rtCampQ" placeholder="Search campground names" maxlength="60"><div id="rtCampOut" class="sm dim">Type part of a name.</div></div>` : ''}`,
      {
        onOpen(root) {
          const q = root.querySelector('#rtGeoQ'); if (q) q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); OA.acts.tripGeo(root.querySelector('[data-act="tripGeo"]')); } });
          const c = root.querySelector('#rtCampQ'); if (c) c.addEventListener('input', () => campList(root));
        }
      });
  }
  function campList(root) {
    const out = root.querySelector('#rtCampOut'), q = (root.querySelector('#rtCampQ').value || '').trim().toLowerCase(); if (!out) return;
    if (q.length < 2) { out.className = 'sm dim'; out.textContent = 'Type part of a name.'; return; }
    const all = CAMPS.items.filter(c => c && ((c.name || '') + ' ' + (c.parent || '')).toLowerCase().includes(q)), ok = all.filter(c => isNum(c.lat) && isNum(c.lon)), nope = all.length - ok.length;
    out.className = 'sm'; out.innerHTML = (ok.length ? ok.slice(0, 12).map(c => `<div class="li" data-act="tripCamp" data-id="${esc(c.id)}"><span class="ic">${OA.icon('tent')}</span><span class="tx"><b>${esc(c.name)}</b><span>${esc(c.parent || c.county || '')}</span></span></div>`).join('') : '<span class="dim">No match with a verified location.</span>') + (nope ? `<div class="xs dim">${nope} match${nope > 1 ? 'es have' : ' has'} no verified coordinates and cannot be added.</div>` : '');
  }
  function finishAdd(o) {
    const t = cur(); if (!t) return; const sel = document.getElementById('rtAddAs'), kind = sel && sel.value !== 'auto' ? sel.value : null;
    const w = addWp(t, Object.assign({}, o, { kind: kind || undefined })); changed(); OA.closeSheet(); OA.toast('Added ' + w.label);
  }

  function wpSheet(i) {
    const t = cur(); if (!t || !t.waypoints[i]) return; const w = t.waypoints[i], b = bindBase(t) + '.waypoints.' + i, p = planOf(t), a = p.arrive[w.id], nav = navLinks(t, w.lat, w.lon), ml = G.mapLinks(w.lat, w.lon, w.label);
    const when = a ? a.at : OA.parseKey(OA.dkey()), sun = G.sun(w.lat, w.lon, when);
    const sunTxt = sun && sun.rise && sun.set ? `Sunrise ${ft(sun.rise)} · sunset ${ft(sun.set)} (${OA.hm(sun.dayHours)} of daylight)` : (sun && sun.polar === 'day' ? 'The sun does not set that day.' : sun && sun.polar === 'night' ? 'The sun does not rise that day.' : 'Not available');
    const tzd = tzOf(w.lon) - tzOf(t.waypoints[0].lon);
    OA.sheet(w.label, `<div class="sh-sec"><label class="fl">Name<input class="in" maxlength="80" value="${esc(w.label)}" data-bind="${b}.label" data-then="tripChanged"></label>
      <div class="two"><label class="fl">Type<select class="in" data-bind="${b}.kind" data-then="tripChanged">${Object.keys(KINDS).map(k => `<option value="${k}" ${k === w.kind ? 'selected' : ''}>${KINDS[k][0]}</option>`).join('')}</select></label>
      <label class="fl">Nights here<input class="in" type="number" min="0" max="60" value="${w.nights || 0}" data-bind="${b}.nights" data-type="number" data-then="tripChanged"></label></div>
      <label class="fl">Notes<textarea class="in" rows="2" maxlength="400" data-bind="${b}.notes" data-then="tripChanged">${esc(w.notes)}</textarea></label></div>
      <div class="sh-sec"><h3>When</h3>${a ? `<div class="kv"><span>Arrive</span><span>${esc(fdate(a.date))}, about ${esc(ft(a.at))}</span></div>` : '<div class="sm dim">Arrival time appears once the route has two or more places.</div>'}
      <div class="kv"><span>Daylight</span><span class="right">${esc(sunTxt)}</span></div>${tzd && i > 0 ? `<div class="xs dim">About ${Math.abs(tzd)} h ${tzd < 0 ? 'behind' : 'ahead of'} your start (approximate, from longitude).</div>` : ''}</div>
      <div class="sh-sec"><h3>Forecast</h3><div id="rtWx" class="sm dim">Loading…</div></div>
      <div class="sh-sec"><h3>Navigate</h3><div class="row wrap">${lnk(nav.apple, 'Apple Maps')}${lnk(nav.google, 'Google Maps')}${lnk(nav.waze, 'Waze')}</div>
      <h3>Map</h3><div class="row wrap">${lnk(ml.osm, 'OpenStreetMap')}${lnk(ml.google, 'Google Maps pin')}${lnk(ml.apple, 'Apple Maps pin')}</div>
      <div class="xs dim" style="margin-top:6px">${esc(G.fmtCoord(w.lat, w.lon))}</div>
      <button class="btn block" data-act="tripFindAt" data-i="${i}">Find places near here (Stops)</button></div>
      <div class="sh-sec"><div class="two"><button class="btn" data-act="tripUp" data-i="${i}" ${i === 0 ? 'disabled' : ''}>Move up</button><button class="btn" data-act="tripDown" data-i="${i}" ${i === t.waypoints.length - 1 ? 'disabled' : ''}>Move down</button></div>
      <button class="btn danger block" data-act="tripRemove" data-i="${i}">Remove from trip</button></div>`, { onOpen: () => loadWx(w, a) });
    if (!OA.tabs.find(x => x.id === 'stops')) { const bt = OA.$('#sheet [data-act="tripFindAt"]'); if (bt) bt.outerHTML = '<div class="xs dim">The Stops tab is not in this build.</div>'; }
  }
  async function loadWx(w, a) {
    const set = h => { const el = document.getElementById('rtWx'); if (el) el.innerHTML = h; };
    try {
      const r = await OA.weather(w.lat, w.lon), d = r.v && r.v.daily; if (!d || !d.time) throw new Error('No forecast data');
      const key = a ? a.date : null, rows = d.time.slice(0, 4).map((day, k) => {
        const hit = key === day;
        return `<div class="kv" ${hit ? 'style="color:var(--gold)"' : ''}><span>${esc(OA.fmtDate(day))}${hit ? ' (you arrive)' : ''}</span><span class="right">${esc(OA.wxText(d.weather_code[k]))}, ${esc(OA.temp(d.temperature_2m_max[k]))} / ${esc(OA.temp(d.temperature_2m_min[k]))}, rain ${d.precipitation_probability_max[k] == null ? '?' : Math.round(d.precipitation_probability_max[k])}%, wind to ${Math.round(d.wind_speed_10m_max[k])} mph</span></div>`;
      }).join('');
      set(rows + `<div class="xs dim">${r.stale ? 'Saved forecast, may be out of date. ' : ''}${key && !d.time.includes(key) ? 'Your arrival date is beyond the 7-day forecast. ' : ''}Forecast from Open-Meteo. Check closely before you drive, especially mountain passes and desert heat.</div>`);
    } catch (x) { set(OA.online() ? 'The forecast could not be loaded right now.' : 'You are offline and no forecast is saved for this place. Check the weather when you have signal.'); }
  }
  function daySheet(n) {
    const t = cur(); if (!t) return; const p = planOf(t), d = p.days.find(x => x.n === n); if (!d || d.type === 'stay') return;
    const kids = t.party.kids > 0, tips = kids ? KIDS_TIPS : ADULT_TIPS;
    const stopsTab = !!OA.tabs.find(x => x.id === 'stops'), ml = G.mapLinks(d.to.lat, d.to.lon, d.to.label);
    let h = `<div class="sh-sec"><div class="kv"><span>Drive</span><span>${esc(OA.dist(d.mi, 0))} · ${esc(OA.hm(d.hr))}</span></div><div class="kv"><span>Leave</span><span>${esc(ft(d.depart))}</span></div><div class="kv"><span>Arrive about</span><span>${esc(ft(d.arrive))}${OA.dkey(d.arrive) !== d.date ? ' (next day)' : ''}</span></div>
      ${d.passes.length ? `<div class="kv"><span>Passing</span><span class="right">${d.passes.map(i => esc(p.pts[i].label)).join(', ')}</span></div>` : ''}${d.flags.map(flagHtml).join('')}</div>`;
    h += `<div class="sh-sec"><h3>Rest breaks</h3>${d.breaks.length ? d.breaks.map((br, j) => `<div class="kv"><span>About ${esc(ft(br.at))}</span><span class="right">mile ${esc(OA.dist(br.mile, 0))}</span></div>`).join('') : '<div class="sm dim">Short day: one break is plenty.</div>'}
      <div class="card tip inner sm">${esc(tips[(n - 1) % tips.length])}</div></div>`;
    h += `<div class="sh-sec"><h3>${d.fuels.length && d.fuels[0].ev ? 'Charging stops' : 'Fuel stops'}</h3>`;
    if (!(+t.vehicle.rangeMi > 0)) h += '<div class="sm dim">Set your vehicle range in Settings to get fuel or charging suggestions.</div>';
    else if (!d.fuels.length) h += `<div class="sm dim">This day is shorter than 80% of your ${esc(OA.dist(t.vehicle.rangeMi, 0))} range. Start with a full ${t.vehicle.type === 'ev' ? 'charge' : 'tank'}.</div>`;
    else h += d.fuels.map((f, j) => `<div class="li" data-act="tripFindFuel" data-n="${n}" data-j="${j}"><span class="ic">${OA.icon(f.ev ? 'bolt' : 'fuel')}</span><span class="tx"><b>${f.ev ? 'Charging stop' : 'Fuel stop'} around ${esc(ft(f.at))}</b><span>${esc(OA.dist(f.dayMi, 0))} into the day (80% of range)${stopsTab ? ' · tap to look nearby' : ''}</span></div></div>`).join('');
    h += `<div class="xs dim">${t.vehicle.type === 'ev' ? 'Charger speed and availability vary and change. Check a charging network app before relying on one, and have a backup. ' : 'In remote country do not pass a station when under half a tank. '}Stations are not checked by this app.</div></div>`;
    if (d.to.suggested) {
      h += `<div class="sh-sec"><h3>Where to sleep</h3><div class="sm">The ${esc(OA.hm(d.hr))} limit ends about ${esc(OA.dist(d.to.mile, 0))} from the start${d.to.nextWp != null ? ', ' + esc(OA.dist(d.to.toNextMi, 0)) + ' before ' + esc(p.pts[d.to.nextWp].label) : ''}. This is a point on the road, so pick a town or camp nearby.</div>
        <div id="rtCand" class="sm dim"></div>${RT.stops && typeof RT.stops.near === 'function' ? `<button class="btn block" data-act="tripCand" data-n="${n}">Show candidate towns here</button>` : ''}
        ${stopsTab ? `<button class="btn gold block" data-act="tripFindStay" data-n="${n}">Find places to stay near here</button>` : '<div class="xs dim">The Stops tab is not in this build.</div>'}
        <div class="row wrap">${lnk(ml.osm, 'See on OpenStreetMap')}</div></div>`;
    } else {
      const nav = navLinks(t, d.to.lat, d.to.lon);
      h += `<div class="sh-sec"><h3>Navigate to ${esc(d.to.label)}</h3><div class="row wrap">${lnk(nav.apple, 'Apple Maps')}${lnk(nav.google, 'Google Maps')}${lnk(nav.waze, 'Waze')}</div>${stopsTab ? `<button class="btn block" data-act="tripFindStay" data-n="${n}">Find places to stay near here</button>` : ''}</div>`;
    }
    OA.sheet(dayTitle(d), h);
  }
  function setSearch(lat, lon, label, kind) { S().searchAt = { lat, lon, label, kind, ts: Date.now(), from: 'trip' }; OA.save(); OA.closeAllSheets(); OA.go('stops'); }
  function leaveSheet() {
    const t = cur(); if (!t) return; const b = bindBase(t) + '.leave', p = planOf(t);
    OA.sheet('Leave-behind note', `<div class="alert"><b class="t">What this can and cannot do</b>Roadtripica cannot track you live: it has no server, so nobody sees where you are unless you tell them. This note gives someone your plan before you go. Phone signal is patchy on many rural roads, so agree what happens if you miss a check-in.</div>
      <label class="fl">Who should be told if you go quiet?<input class="in" maxlength="80" value="${esc(t.leave.contact)}" data-bind="${b}.contact" data-then="tripLeavePrev"></label>
      <label class="fl">Check-in plan<input class="in" maxlength="140" placeholder="Text by 9 pm each night" value="${esc(t.leave.checkin)}" data-bind="${b}.checkin" data-then="tripLeavePrev"></label>
      <textarea class="in" id="rtLeaveTx" rows="12" readonly>${esc(leaveText(t, p))}</textarea>
      <button class="btn gold block" data-act="tripLeaveShare">Share this note</button>`);
  }
  function navSheet() {
    const t = cur(); if (!t) return; const pts = pointsOf(t); if (pts.length < 2) return OA.toast('Add at least two places first.');
    const parts = gRoutes(t, pts);
    OA.sheet('Navigate the route', `<p class="sm dim">Google Maps links take up to 9 stops in the middle, so a long trip is split into parts. Open each part when you reach the previous one.${t.prefs.avoidTolls || t.prefs.avoidHighways ? ' Your avoid choices are included.' : ''}</p>` +
      parts.map((q, i) => `<div class="card inner"><b>Part ${i + 1}</b><div class="sm dim">${esc(q.from)} to ${esc(q.to)}</div><div class="row wrap">${lnk(q.url, 'Open in Google Maps')}</div></div>`).join('') +
      `<h3>One place at a time</h3>` + pts.filter(q => !q.virtual).map(q => { const n = navLinks(t, q.lat, q.lon); return `<div class="card inner"><b>${esc(q.label)}</b><div class="row wrap">${lnk(n.apple, 'Apple')}${lnk(n.google, 'Google')}${lnk(n.waze, 'Waze')}</div></div>`; }).join(''));
  }
  function newSheet() { OA.sheet('New trip', `<div class="rt-newform"><label class="fl">Trip name<input class="in rt-nn" placeholder="Pacific coast in May" maxlength="60"></label><label class="fl">Start date<input class="in rt-nd" type="date" value="${esc(OA.dkey())}"></label><button class="btn gold block" data-act="tripCreate">Start the trip</button></div>`); }

  /* ---------- actions ---------- */
  OA.act({
    tripHelp: helpSheet, tripNewSheet: newSheet, tripAdd: addSheet, tripSettings() { OA.sheet('Trip settings', settingsHtml()); }, tripNav: navSheet, tripLeave: leaveSheet,
    tripCreate(el) {
      const f = el.closest('.rt-newform'), nm = f.querySelector('.rt-nn').value.trim().slice(0, 60), dt = f.querySelector('.rt-nd').value, t = newTrip(nm || 'My road trip'); if (validKey(dt)) t.startDate = dt;
      init(); S().trips.push(t); S().cur = t.id; S().view = 'plan'; changed(); if (OA.sheetOpen()) OA.closeAllSheets(); OA.render(); OA.toast('Trip started. Add your first place.');
    },
    tripSwitch(el) { S().cur = el.dataset.id; OA.saveSoon(); OA.render(true); },
    tripView(el) { S().view = el.dataset.v; OA.saveSoon(); OA.render(); },
    tripChanged() { changed(); },
    tripVeh(el) { const t = cur(); if (!t) return; const d = VEH[el.value]; if (d) { t.vehicle.mpg = d.mpg; t.vehicle.tankGal = d.tankGal; t.vehicle.rangeMi = d.rangeMi; } changed(); OA.redrawSheet(settingsHtml()); },
    tripMaxDrive(el) { const t = cur(); if (!t) return; t.prefs.maxDriveHoursPerDay = +el.dataset.v; changed(); OA.render(true); },
    async tripDelete() { const t = cur(); if (!t) return; if (!await OA.confirm('Delete "' + t.name + '" and all its places? This cannot be undone.', 'Delete')) return; const s = S(); s.trips = s.trips.filter(x => x.id !== t.id); s.cur = s.trips[0] ? s.trips[0].id : null; changed(); OA.closeAllSheets(); OA.render(); OA.toast('Trip deleted'); },
    tripDup() { const t = cur(); if (!t) return; const c = JSON.parse(JSON.stringify(t)); c.id = OA.uid(); c.name = (t.name + ' (copy)').slice(0, 60); c.waypoints.forEach(w => { w.id = OA.uid(); }); S().trips.push(c); S().cur = c.id; changed(); OA.closeAllSheets(); OA.render(); OA.toast('Copied'); },
    tripWp(el) { wpSheet(+el.dataset.i); },
    tripDay(el) { daySheet(+el.dataset.n); },
    tripUp(el) { const t = cur(), i = +el.dataset.i; if (!t || i < 1) return; [t.waypoints[i - 1], t.waypoints[i]] = [t.waypoints[i], t.waypoints[i - 1]]; changed(); if (OA.sheetOpen()) { OA.closeSheet(); } else OA.render(true); },
    tripDown(el) { const t = cur(), i = +el.dataset.i; if (!t || i >= t.waypoints.length - 1) return; [t.waypoints[i + 1], t.waypoints[i]] = [t.waypoints[i], t.waypoints[i + 1]]; changed(); if (OA.sheetOpen()) { OA.closeSheet(); } else OA.render(true); },
    async tripRemove(el) { const t = cur(), i = +el.dataset.i; if (!t || !t.waypoints[i]) return; if (!await OA.confirm('Remove "' + t.waypoints[i].label + '" from this trip?', 'Remove')) return; t.waypoints.splice(i, 1); changed(); OA.closeAllSheets(); OA.render(true); },
    /* adding places */
    async tripGeo(el) {
      const q = (OA.$('#rtGeoQ').value || '').trim(), out = OA.$('#rtGeoOut'); if (q.length < 2) return OA.toast('Type a place name first.');
      if (!OA.online()) { out.textContent = 'Place search needs a signal. You can still use My location, coordinates or a saved camp.'; return; }
      el.disabled = true; out.innerHTML = '<span class="spin"></span> Searching…';
      try {
        lastGeo = await OA.geocode(q);
        out.className = 'sm'; out.innerHTML = lastGeo.length ? lastGeo.map((r, i) => `<div class="li" data-act="tripPickGeo" data-i="${i}"><span class="ic">${OA.icon('pin')}</span><span class="tx"><b>${esc(r.short)}</b><span>${esc(r.name)}</span></span></div>`).join('') : 'Nothing found. Try a nearby town or add the state.';
      } catch (x) { out.className = 'sm dim'; out.textContent = 'Search did not work (' + (x && x.message || 'no signal') + '). Try again, or use coordinates.'; }
      el.disabled = false;
    },
    tripPickGeo(el) { const r = lastGeo[+el.dataset.i]; if (r) finishAdd({ label: r.short, lat: r.lat, lon: r.lon }); },
    async tripMyLoc(el) {
      el.disabled = true; el.textContent = 'Finding you…';
      try {
        const fix = await OA.geo.position(); let label = 'My location';
        if (OA.online()) { try { const rv = await Promise.race([OA.reverse(fix.lat, fix.lon), new Promise((_, rj) => setTimeout(() => rj(new Error('slow')), 6000))]); if (rv && rv.town) label = rv.town + (rv.state ? ', ' + rv.state : ''); } catch (x) { } }
        finishAdd({ label, lat: fix.lat, lon: fix.lon });
      } catch (x) { OA.toast(x.message, 4500); el.disabled = false; el.textContent = 'Use where I am now'; }
    },
    tripCoord() {
      let la = (OA.$('#rtLat').value || '').trim(), lo = (OA.$('#rtLon').value || '').trim();
      if (la.includes(',') && !lo) { const s = la.split(','); la = s[0].trim(); lo = (s[1] || '').trim(); }
      const lat = parseFloat(la), lon = parseFloat(lo); if (!isNum(lat) || !isNum(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return OA.toast('Enter a latitude (-90 to 90) and a longitude (-180 to 180).', 4000);
      finishAdd({ label: (OA.$('#rtCLabel').value || '').trim() || G.fmtCoord(lat, lon, 'dd'), lat, lon });
    },
    tripPlace(el) { const p = window.OCC && OCC.places && OCC.places.list().find(x => x.id === el.dataset.id); if (p && isNum(p.lat) && isNum(p.lon)) finishAdd({ label: p.name, lat: p.lat, lon: p.lon, kind: p.kind === 'camp' ? 'camp' : p.kind === 'sight' ? 'sight' : 'stop', ref: p.ref || ('place:' + p.id) }); },
    tripCamp(el) { const c = (window.CAMPS && CAMPS.items || []).find(x => x.id === el.dataset.id); if (c && isNum(c.lat) && isNum(c.lon)) finishAdd({ label: c.name, lat: c.lat, lon: c.lon, kind: 'camp', ref: 'camp:' + c.id }); },
    /* routing */
    async tripRoute() {
      const t = cur(); if (!t || routing) return; routing = t.id; routeNote = null; OA.render(true);
      try {
        const r = await fetchRoute(t);
        routeNote = r.partial ? { id: t.id, kind: 'ok', title: 'Part ' + r.done + ' of ' + r.of + ' saved', text: 'Tap again to load the next part. Each tap makes one request.' }
          : { id: t.id, kind: 'ok', title: r.net ? 'Route saved' : 'Route ready', text: r.net ? 'Distances and times now use the driving route, saved on this phone.' : 'Used the copy already saved on this phone.' };
      } catch (x) { routeNote = { id: t.id, kind: 'err', title: 'No driving route this time', text: (x && x.message || 'Unknown problem') + ' The rough estimate is shown instead; nothing else is blocked.' }; }
      routing = null; changed(); redraw();
    },
    /* stops integration */
    tripFindStay(el) { const t = cur(), p = t && planOf(t), d = p && p.days.find(x => x.n === +el.dataset.n); if (!d) return; setSearch(d.to.lat, d.to.lon, d.to.suggested ? 'Overnight near mile ' + Math.round(d.to.mile) : d.to.label, 'stay'); },
    tripFindAt(el) { const t = cur(), w = t && t.waypoints[+el.dataset.i]; if (w) setSearch(w.lat, w.lon, w.label, 'stay'); },
    tripFindFuel(el) { const t = cur(), p = t && planOf(t), d = p && p.days.find(x => x.n === +el.dataset.n), f = d && d.fuels[+el.dataset.j]; if (!f || !OA.tabs.find(x => x.id === 'stops')) return; setSearch(f.lat, f.lon, (f.ev ? 'Charging' : 'Fuel') + ' near mile ' + Math.round(f.mile), f.ev ? 'ev' : 'fuel'); },
    async tripCand(el) {
      const t = cur(), p = t && planOf(t), d = p && p.days.find(x => x.n === +el.dataset.n), out = OA.$('#rtCand'); if (!d || !out) return;
      out.innerHTML = '<span class="spin"></span> Looking…'; el.disabled = true;
      try {
        const r = await Promise.resolve(RT.stops.near(d.to.lat, d.to.lon)), a = Array.isArray(r) ? r : (r && Array.isArray(r.items) ? r.items : []);
        out.innerHTML = a.length ? a.slice(0, 6).map(x => { const nm = x.name || x.label || x.title || x.town || 'Place', dm = x.distMi != null ? x.distMi : (x.mi != null ? x.mi : x.d); return `<div class="kv"><span>${esc(nm)}</span><span>${isNum(+dm) && dm !== '' && dm != null ? esc(OA.dist(+dm, 0)) : ''}</span></div>`; }).join('') : 'No suggestions found here.';
      } catch (x) { out.textContent = 'Could not look up places right now.'; }
      el.disabled = false;
    },
    /* sharing */
    tripLeavePrev() { changed(); const t = cur(), el = OA.$('#rtLeaveTx'); if (t && el) el.value = leaveText(t, planOf(t)); },
    tripLeaveShare() { const t = cur(); if (t) OA.share.send({ title: 'Road trip plan: ' + t.name, text: leaveText(t, planOf(t)) }); },
    tripShare() { const t = cur(); if (!t) return; const p = planOf(t); if (!p.days.length) return OA.toast('Add at least two places first.'); OA.share.send({ title: t.name, text: itinText(t, p) }); },
    tripPrint() {
      const t = cur(); if (!t) return; const p = planOf(t); if (!p.days.length) return OA.toast('Add at least two places first.');
      let el = document.getElementById('rt-print'); if (!el) { el = document.createElement('div'); el.id = 'rt-print'; document.body.appendChild(el); }
      el.innerHTML = printHtml(t, p); document.body.classList.add('rt-printing');
      const done = () => { document.body.classList.remove('rt-printing'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done);
      setTimeout(() => { try { window.print(); } catch (x) { done(); } }, 60);
    },
    tripIcs() { const t = cur(); if (!t) return; const p = planOf(t); if (!p.nights.length) return OA.toast('No overnight stays planned yet. Add nights to a place, or add places farther apart.'); OA.download((t.name.replace(/[^\w-]+/g, '-').slice(0, 40) || 'trip') + '.ics', 'text/calendar', icsText(t, p)); OA.toast('Calendar file saved.'); }
  });

  /* ---------- household link ---------- */
  OA.publisher = () => {
    const t = cur(); if (!t) return { trip: null, events: [] };
    const s = summary(t), p = planOf(t); let cost = null;
    try { if (RT.miles && typeof RT.miles.tripCost === 'function') { const c = RT.miles.tripCost(); if (isNum(c)) cost = Math.round(c); } } catch (e) { }
    return { trip: { name: t.name, days: s.days, miles: Math.round(s.miles), cost }, events: p.days.slice(0, 45).map(d => ({ t: t.name + (d.type === 'stay' ? ' (stay)' : ': day ' + d.n), d: d.date, kind: 'trip' })) };
  };
})();
