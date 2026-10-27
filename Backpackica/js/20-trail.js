/* Backpackica: Trail tab and the shared BP.trail API.

   BP.trail API (other modules call it defensively: `window.BP && BP.trail && BP.trail.x()`). Miles are mile markers
   in the trail's own numbering (as in guides); distances are in miles (display with OA.dist), elevations in feet.
     BP.trail.list()                     -> [trail objects] (data packs + imported GPX trails; an imported trail not loaded yet is a stub {id,name,miles,custom:true,stub:true,points:[]})
     BP.trail.get(id)                    -> trail object | null
     BP.trail.current()                  -> null | {trail, mile (number|null), dir, reversed, next(kinds,n), prev(kinds,n), nearest()}
                                            next/prev return [{point, distMi}] ahead of / behind the mile in the hiking direction
     BP.trail.setCurrent(id, mile, dir)  -> true|false. mile undefined keeps the current mile (same trail), null clears it. dir NOBO/SOBO/EB/WB/CW/CCW/FWD/REV
     BP.trail.nextOf(kinds, n=3)         -> [{point, distMi}] from the current mile in the hiking direction (SOBO reverses). kinds are point kinds
                                            or the pseudo kinds 'water' (any listed water), 'resupply' (grocery/post/resupplyBy), 'hazard' (hazard ranges + hazard points)
     BP.trail.pointsBetween(fromMi,toMi) -> points between (inclusive, ascending mile) on the current trail
     BP.trail.elevBetween(fromMi,toMi)   -> {gainFt, lossFt, approx, points} | null. From listed elevations only (interpolated); null when too sparse (< 3 points or gaps over 12 mi). Sparse data under-counts.
     BP.trail.waterGaps(minMi)           -> [{fromPoint,toPoint,miles}] gaps between consecutive LISTED water sources on the current trail
     BP.trail.summary()                  -> null | {trail:name, mile, nextTown:{name,mi,date:null}|null}
     BP.trail.open(id, view)             -> open the Trail tab on a trail page (views: strip towns water passes permits info)
   Point objects are the originals from window.TRAILS (do not mutate). A hazard range returned by nextOf is a synthetic point {kind:'hazard',name,mi,fromMi,toMi,note,hazard:true}.
   Any field except id/name/miles/points may be missing: everything here tolerates that. */
window.BP = window.BP || { todayCards: [] };
BP.todayCards = BP.todayCards || [];
(function () {
  'use strict';
  const esc = OA.esc, G = OA.geo, S = () => OA.S;
  OA.defaults({ trail: { id: null, mile: null, dir: 'NOBO', startDate: null, custom: [], customList: [] } });

  /* ---------- small helpers ---------- */
  const num = v => v != null && v !== '' && isFinite(+v);
  const safeUrl = u => (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : '';
  const link = (u, label) => safeUrl(u) ? `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(label || u)}</a>` : '';
  const fmtMile = m => num(m) ? (Math.round(m * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '–';
  const CHECK = 'check with the source';
  const KIND = { terminus: ['Terminus', 'pin'], town: ['Town', 'home'], trailhead: ['Trailhead', 'boot'], pass: ['Pass', 'mountain'], water: ['Water', 'drop'], landmark: ['Landmark', 'eye'], campsite: ['Campsite', 'tent'], hazard: ['Hazard', 'alert'], permit: ['Permit point', 'ticket'], 'bear-box': ['Bear box', 'bear'] };
  const kindOf = p => KIND[p && p.kind] || [p && p.kind ? String(p.kind) : 'Point', 'pin'];
  const SVC = { post: 'Post office', grocery: 'Grocery', lodging: 'Lodging', laundry: 'Laundry', shower: 'Showers', restaurant: 'Restaurant', outfitter: 'Outfitter', hikerBox: 'Hiker box', cell: 'Cell service', resupplyBy: 'Resupply by' };
  const OPP = { NOBO: 'SOBO', SOBO: 'NOBO', EB: 'WB', WB: 'EB', CW: 'CCW', CCW: 'CW', FWD: 'REV', REV: 'FWD' };
  const DIRLAB = { NOBO: 'Northbound (NOBO)', SOBO: 'Southbound (SOBO)', EB: 'Eastbound', WB: 'Westbound', CW: 'Clockwise', CCW: 'Counter-clockwise', FWD: 'Forward (as recorded)', REV: 'Reverse' };
  const M = p => +p.mi;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthsText(m) {
    if (m == null || m === '') return '';
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) {
      if (m.length && m.every(x => typeof x === 'number' && x >= 1 && x <= 12)) {
        const a = m.slice().sort((x, y) => x - y), consec = a.every((x, i) => !i || x === a[i - 1] + 1);
        return consec && a.length > 1 ? MONTHS[a[0] - 1] + '–' + MONTHS[a[a.length - 1] - 1] : a.map(x => MONTHS[x - 1]).join(', ');
      }
      return m.join(', ');
    }
    return '';
  }

  /* ---------- trail registry ---------- */
  const CUSTOM = {};        // imported GPX trails once loaded from the database
  let customLoaded = false;
  function packIds() { return Object.keys(window.TRAILS || {}).filter(k => window.TRAILS[k] && typeof window.TRAILS[k] === 'object'); }
  function getTrail(id) {
    if (!id) return null;
    const T = window.TRAILS || {};
    if (T[id] && typeof T[id] === 'object') return T[id];
    return CUSTOM[id] || null;
  }
  function stubOf(rec) { return { id: rec.id, name: rec.name, miles: rec.miles, custom: true, stub: true, points: [], gainFt: rec.gainFt, lossFt: rec.lossFt }; }
  function listTrails() {
    const out = packIds().map(id => window.TRAILS[id]);
    (S().trail.customList || []).forEach(r => out.push(CUSTOM[r.id] || stubOf(r)));
    return out;
  }
  function loadCustom() {
    const lst = S().trail.customList || []; let left = lst.length;
    if (!left) { customLoaded = true; return; }
    lst.forEach(r => {
      OA.db.get('kv', 'gpx:' + r.id).then(rec => { if (rec && rec.trail) CUSTOM[r.id] = rec.trail; }).catch(() => { })
        .then(() => { if (--left === 0) { customLoaded = true; if (OA.current && OA.current() && (OA.current() === 'trail' || OA.current() === 'today') && !OA.sheetOpen()) OA.render(true); } });
    });
  }

  /* ---------- normalised, cached view of a trail ---------- */
  const NORM = new WeakMap();
  function norm(t) {
    let n = NORM.get(t); if (n) return n;
    const raw = Array.isArray(t.points) ? t.points : [];
    const idx = new Map(), pts = [];
    raw.forEach((p, i) => { if (p && typeof p === 'object' && num(p.mi)) { idx.set(p, i); pts.push(p); } });
    pts.sort((a, b) => M(a) - M(b) || idx.get(a) - idx.get(b));
    const hz = (Array.isArray(t.hazards) ? t.hazards : []).map((h, i) => { if (!h || !num(h.fromMi)) return null; const a = +h.fromMi, b = num(h.toMi) ? +h.toMi : a; return { h, i, from: Math.min(a, b), to: Math.max(a, b) }; }).filter(Boolean);
    const secs = (Array.isArray(t.sections) ? t.sections : []).map((s, i) => (s && num(s.fromMi) && num(s.toMi)) ? { s, i, name: s.name || 'Section', from: Math.min(+s.fromMi, +s.toMi), to: Math.max(+s.fromMi, +s.toMi), note: s.note || '' } : null).filter(Boolean).sort((a, b) => a.from - b.from);
    const lo = 0, hi = num(t.miles) ? +t.miles : (pts.length ? M(pts[pts.length - 1]) : 0);
    // line used for GPS snapping: dense track for imported trails, else consecutive points with coordinates
    const line = { la: [], lo: [], mi: [], dense: false };
    if (Array.isArray(t.track) && t.track.length > 1) { t.track.forEach(r => { line.la.push(r[0]); line.lo.push(r[1]); line.mi.push(r[2]); }); line.dense = true; }
    else pts.forEach(p => { if (num(p.lat) && num(p.lon) && !(p.off && num(p.off.mi) && +p.off.mi > 0.3)) { line.la.push(+p.lat); line.lo.push(+p.lon); line.mi.push(M(p)); } });
    n = { pts, idx, hz, secs, lo, hi, line }; NORM.set(t, n); return n;
  }
  function secList(t) {
    const n = norm(t); if (n.secs.length) return n.secs;
    const out = [], step = 100; let a = n.lo, k = 0;
    if (n.hi - n.lo <= step * 1.2) return [{ name: 'Whole trail', from: n.lo, to: n.hi + 0.001, note: '', auto: true }];
    while (a < n.hi) { const b = Math.min(a + step, n.hi); out.push({ name: 'Mile ' + fmtMile(a) + '–' + fmtMile(b), from: a, to: b + (b >= n.hi ? 0.001 : 0), note: '', auto: true }); a += step; k++; }
    return out;
  }

  /* ---------- direction ---------- */
  function fwdDir(t) { const m = String(t.dir || '').toUpperCase().match(/NOBO|SOBO|CCW|CW|EB|WB|FWD|REV/); return m ? m[0] : 'NOBO'; }
  function dirPair(t) { const f = fwdDir(t); return [f, OPP[f]]; }
  function okDir(t, d) { return dirPair(t).indexOf(d) >= 0 ? d : fwdDir(t); }
  const isRev = (t, d) => d === OPP[fwdDir(t)];
  const sgn = (t, d) => isRev(t, d) ? -1 : 1;

  /* ---------- point classes ---------- */
  function isWater(p) {
    if (!p) return false;
    const w = p.water, ty = w && typeof w === 'object' && w.type ? String(w.type) : '';
    if (/^(none|no\b|dry)/i.test(ty)) return false;
    return p.kind === 'water' || !!(w && typeof w === 'object' && ty);
  }
  function isResupply(p) { const s = p && p.svc; return !!(s && typeof s === 'object' && ((s.grocery && !/^no/i.test(String(s.grocery))) || (s.post && !/^no/i.test(String(s.post))) || s.resupplyBy)); }
  function matcher(k) { return k === 'water' ? isWater : k === 'resupply' ? isResupply : p => p.kind === k; }

  /* ---------- the spatial core ---------- */
  function hazPoint(z, s) { const h = z.h; return { kind: 'hazard', name: h.title || 'Hazard', mi: s > 0 ? z.from : z.to, fromMi: z.from, toMi: z.to, note: h.note || '', hazard: true, hzIndex: z.i }; }
  /* items ahead (back=false) or behind (back=true) of mile m in the hiking direction, nearest first */
  function scan(t, m, dir, kinds, n, back) {
    if (!t || !num(m)) return [];
    kinds = Array.isArray(kinds) ? kinds : [kinds]; const nn = norm(t), s = sgn(t, dir) * (back ? -1 : 1), out = [];
    const ms = kinds.filter(k => k !== 'hazard').map(matcher);
    if (ms.length) nn.pts.forEach(p => { if (ms.some(f => f(p))) { const d = (M(p) - m) * s; if (d >= -0.01) out.push({ point: p, distMi: Math.max(0, d) }); } });
    if (kinds.indexOf('hazard') >= 0) nn.hz.forEach(z => {
      if (m >= z.from && m <= z.to && !back) out.push({ point: Object.assign(hazPoint(z, s), { mi: m, inside: true }), distMi: 0 });
      else { const hp = hazPoint(z, s), d = (hp.mi - m) * s; if (d >= -0.01) out.push({ point: hp, distMi: Math.max(0, d) }); }
    });
    out.sort((a, b) => a.distMi - b.distMi);
    return out.slice(0, n || 3);
  }
  function nearestPoint(t, m) { let best = null, bd = 1e9; norm(t).pts.forEach(p => { const d = Math.abs(M(p) - m); if (d < bd) { bd = d; best = p; } }); return best ? { point: best, distMi: bd } : null; }

  function series(t) {
    const n = norm(t); if (n.series) return n.series;
    let s, dense = false;
    if (Array.isArray(t.profile) && t.profile.length > 1) { s = t.profile.filter(r => Array.isArray(r) && num(r[0]) && num(r[1])).map(r => [+r[0], +r[1]]); dense = true; }
    else s = n.pts.filter(p => p.elev != null && num(p.elev)).map(p => [M(p), +p.elev]);
    s.sort((a, b) => a[0] - b[0]); n.series = s; n.dense = dense; return s;
  }
  function elevAt(t, mi) {
    const s = series(t); if (s.length < 2 || mi < s[0][0] || mi > s[s.length - 1][0]) return null;
    for (let i = 1; i < s.length; i++) if (s[i][0] >= mi) { const a = s[i - 1], b = s[i], d = b[0] - a[0]; return d <= 0 ? b[1] : a[1] + (b[1] - a[1]) * (mi - a[0]) / d; }
    return null;
  }
  function elevBetween(t, a, b) {
    if (!t || !num(a) || !num(b)) return null; a = +a; b = +b; if (a > b) { const x = a; a = b; b = x; }
    const s = series(t), dense = norm(t).dense; let pts = s.filter(r => r[0] >= a && r[0] <= b);
    if (!dense) {
      const ea = elevAt(t, a), eb = elevAt(t, b);
      if (ea != null && !(pts.length && pts[0][0] === a)) pts.unshift([a, ea]);
      if (eb != null && !(pts.length && pts[pts.length - 1][0] === b)) pts.push([b, eb]);
      if (pts.length < 3) return null;
      for (let i = 1; i < pts.length; i++) if (pts[i][0] - pts[i - 1][0] > 12) return null;
    } else if (pts.length < 2) return null;
    let g = 0, l = 0;
    for (let i = 1; i < pts.length; i++) { const d = pts[i][1] - pts[i - 1][1]; if (d > 0) g += d; else l -= d; }
    return { gainFt: Math.round(g / 10) * 10, lossFt: Math.round(l / 10) * 10, approx: !dense, points: pts.length };
  }
  function waterGaps(t, minMi) {
    if (!t) return []; const w = norm(t).pts.filter(isWater), out = []; minMi = num(minMi) ? +minMi : 10;
    for (let i = 1; i < w.length; i++) { const d = M(w[i]) - M(w[i - 1]); if (d >= minMi) out.push({ fromPoint: w[i - 1], toPoint: w[i], miles: Math.round(d * 10) / 10 }); }
    return out;
  }

  /* snap a GPS position onto the trail line: {mile, offMi, spanMi, dense} | null */
  function snap(t, f) {
    const L = norm(t).line, n = L.la.length; if (!n) return null;
    if (n === 1) return { mile: L.mi[0], offMi: G.mi({ lat: L.la[0], lon: L.lo[0] }, f), spanMi: 0, dense: false };
    const kx = Math.cos(f.lat * Math.PI / 180) * 69.17, ky = 69.0; let best = null;
    for (let i = 1; i < n; i++) {
      const ax = (L.lo[i - 1] - f.lon) * kx, ay = (L.la[i - 1] - f.lat) * ky, bx = (L.lo[i] - f.lon) * kx, by = (L.la[i] - f.lat) * ky, dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      if (L.mi[i] === L.mi[i - 1]) continue;
      let u = len2 > 0 ? -(ax * dx + ay * dy) / len2 : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
      const px = ax + u * dx, py = ay + u * dy, d = Math.sqrt(px * px + py * py);
      if (!best || d < best.offMi) best = { offMi: d, mile: L.mi[i - 1] + u * (L.mi[i] - L.mi[i - 1]), spanMi: Math.abs(L.mi[i] - L.mi[i - 1]), dense: L.dense };
    }
    return best;
  }

  /* ---------- BP.trail ---------- */
  function current() {
    const st = S().trail; if (!st || !st.id) return null; const t = getTrail(st.id); if (!t) return null;
    const mile = num(st.mile) ? +st.mile : null, dir = okDir(t, st.dir);
    return {
      trail: t, mile, dir, reversed: isRev(t, dir),
      next: (kinds, n) => scan(t, mile, dir, kinds, n, false), prev: (kinds, n) => scan(t, mile, dir, kinds, n, true),
      nearest: () => num(mile) ? nearestPoint(t, mile) : null
    };
  }
  function setCurrent(id, mile, dir) {
    const t = getTrail(id); if (!t) return false; const st = S().trail, same = st.id === id;
    st.id = id; st.dir = okDir(t, dir || (same ? st.dir : null));
    if (mile === null) st.mile = null;
    else if (mile === undefined) { if (!same) st.mile = null; }
    else st.mile = num(mile) ? OA.clamp(+mile, 0, num(t.miles) ? +t.miles : 1e6) : null;
    OA.save(); OA.emit('trail', st); try { OA.publish && OA.publish(); } catch (e) { } return true;
  }
  BP.trail = {
    list: listTrails, get: getTrail, current, setCurrent,
    nextOf(kinds, n) { const c = current(); return c ? c.next(kinds, n == null ? 3 : n) : []; },
    pointsBetween(a, b) { const c = current(); if (!c || !num(a) || !num(b)) return []; const lo = Math.min(+a, +b), hi = Math.max(+a, +b); return norm(c.trail).pts.filter(p => M(p) >= lo && M(p) <= hi); },
    elevBetween(a, b) { const c = current(); return c ? elevBetween(c.trail, a, b) : null; },
    waterGaps(minMi) { const c = current(); return c ? waterGaps(c.trail, minMi) : []; },
    summary() {
      const c = current(); if (!c) return null; const nt = c.next('town', 1)[0];
      return { trail: c.trail.name || c.trail.id, mile: c.mile, nextTown: nt ? { name: nt.point.name || 'Town', mi: Math.round(nt.distMi * 10) / 10, date: null } : null };
    },
    open(id, view) { if (!getTrail(id)) return false; UI.open = id; UI.view = view || 'strip'; UI.sec = 'here'; UI.filter = 'all'; UI.limit = 80; UI.q = ''; OA.go('trail'); return true; }
  };

  /* ---------- UI state (not saved) ---------- */
  const UI = { open: undefined, view: 'strip', sec: 'here', filter: 'all', limit: 80, q: '', lq: '', lf: 'all', behind: false, townF: 'all', gap: 15, pending: null };
  const VIEWS = [['strip', 'Strip map'], ['towns', 'Towns'], ['water', 'Water'], ['passes', 'Passes & hazards'], ['permits', 'Permits & seasons'], ['info', 'Info']];

  /* ---------- shared bits of markup ---------- */
  function milesTxt(t) { return num(t.miles) ? OA.dist(+t.miles, 0) : CHECK; }
  function daysTxt(t) { const d = t.typicalDays; if (!d || (!num(d.min) && !num(d.max))) return null; return num(d.min) && num(d.max) && +d.min !== +d.max ? d.min + '–' + d.max + ' days' : (d.max || d.min) + ' days'; }
  function distMsg(c, p) { // "12.3 mi ahead" relative to the current mile
    if (!c || c.mile == null || !p || !num(p.mi)) return ''; const d = (M(p) - c.mile) * sgn(c.trail, c.dir);
    return Math.abs(d) < 0.05 ? 'here' : d > 0 ? OA.dist(d) + ' ahead' : OA.dist(-d) + ' behind';
  }
  function curFor(t) { const c = current(); return c && c.trail === t ? c : null; }
  function icon(p, cls) { return OA.icon(kindOf(p)[1], cls); }

  /* ---------- LIBRARY ---------- */
  function trailCard(t) {
    const st = S().trail, mine = st.id === t.id, d = daysTxt(t), se = Array.isArray(t.seasons) && t.seasons[0], pe = t.permits;
    const season = se ? `<span class="tag g">${esc(se.label || 'Season')}${monthsText(se.months) ? ': ' + esc(monthsText(se.months)) : ''}</span>` : `<span class="tag">Season: ${CHECK}</span>`;
    const permit = Array.isArray(pe) ? (pe.length ? `<span class="tag w">Permit: ${pe.length}</span>` : `<span class="tag">No permit listed</span>`) : `<span class="tag">Permit: ${CHECK}</span>`;
    const st2 = Array.isArray(t.states) && t.states.length ? t.states.join(', ') : '';
    return `<section class="card ${mine ? 'hot' : ''}" data-act="openTrail" data-id="${esc(t.id)}">
      <div class="ct"><span>${OA.icon(t.custom ? 'route' : 'mountain')} ${esc(t.name || t.id)}</span><span class="sm dim">${esc(milesTxt(t))}</span></div>
      <div class="sm dim">${esc([t.short, st2].filter(Boolean).join(' · '))}</div>
      <div style="margin-top:6px">${t.custom ? '<span class="tag a">imported</span>' : ''}${mine ? '<span class="tag a">my trail</span>' : ''}${d ? `<span class="tag">${esc(d)}</span>` : ''}${season}${permit}</div>
      <div class="row"><button class="btn" data-act="openTrail" data-id="${esc(t.id)}">Open</button>${mine ? '' : `<button class="btn gold" data-act="trChoose" data-id="${esc(t.id)}">Set as my trail</button>`}</div></section>`;
  }
  function library() {
    let all = listTrails(); const q = UI.lq.trim().toLowerCase();
    if (q) all = all.filter(t => [t.name, t.short, (t.states || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0);
    if (UI.lf === 'long') all = all.filter(t => num(t.miles) && +t.miles >= 1000);
    else if (UI.lf === 'short') all = all.filter(t => num(t.miles) && +t.miles < 1000);
    else if (UI.lf === 'imp') all = all.filter(t => t.custom);
    const chip = (v, l) => `<button class="chip ${UI.lf === v ? 'on' : ''}" data-act="trLibF" data-v="${v}">${l}</button>`;
    return OA.header('Trails', 'Maps, towns, water and permits that work offline') +
      `<input class="in" id="trlq" type="search" placeholder="Search trails" value="${esc(UI.lq)}" data-onchange="trLibQ" aria-label="Search trails">
       <div class="chips">${chip('all', 'All')}${chip('long', 'Thru-hikes (1,000+ mi)')}${chip('short', 'Shorter')}${chip('imp', 'Imported')}</div>` +
      (all.length ? all.map(trailCard).join('') : `<section class="card"><p class="dim">${listTrails().length ? 'No trails match.' : 'No trail data is installed in this copy of the app yet.'} You can import your own route from a GPX file.</p></section>`) +
      `<section class="card tip"><div class="ct"><span>${OA.icon('route')} Import a GPX trail</span></div><p class="sm dim">Bring in a route from another app or a trail group. It is saved on this phone and works offline. Imported trails have mileage and elevation computed from the file only, so they carry no town or permit information.</p><button class="btn block" data-act="trImport" data-smoke>Import a GPX file</button></section>` +
      `<p class="foot">Trail data is a planning aid and can be out of date. Check with the land manager and carry a paper map.</p>`;
  }

  /* ---------- TRAIL PAGE ---------- */
  function trailPage(t) {
    const c = curFor(t), mine = S().trail.id === t.id;
    const st2 = Array.isArray(t.states) && t.states.length ? t.states.join(', ') : '';
    let h = `<div class="row mid between" style="margin:0 0 6px"><button class="mini" data-act="trLib">‹ All trails</button><button class="gear" data-act="menu" aria-label="Menu" style="margin:0">${OA.icon('gear')}</button></div>
      <h2 class="big">${esc(t.name || t.id)}</h2><div class="sm dim">${esc([milesTxt(t), st2, daysTxt(t)].filter(Boolean).join(' · '))}</div>`;
    if (t.custom) h += `<div style="margin-top:4px"><span class="tag a">imported</span></div>`;
    h += mine ? progressCard(t, c) + nextUpCard(t, c) :
      `<section class="card tip"><p class="sm">This is not your current trail.</p><button class="btn gold block" data-act="trChoose" data-id="${esc(t.id)}">Set as my trail</button></section>`;
    h += `<div class="chips">${VIEWS.map(v => `<button class="chip ${UI.view === v[0] ? 'on' : ''}" data-act="trView" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>`;
    const f = { strip: stripView, towns: townsView, water: waterView, passes: passesView, permits: permitsView, info: infoView }[UI.view] || stripView;
    return h + f(t, c) + `<p class="foot">${esc(t.disclaimer || 'Planning aid only. Conditions, closures and distances change: check with the land manager and carry a paper map.')}</p>`;
  }
  function progressCard(t, c) {
    const n = norm(t);
    if (!c || c.mile == null) return `<section class="card hot"><div class="ct"><span>${OA.icon('pin')} Where am I on the trail?</span></div><p class="sm dim">Set your mile to see what is coming up next.</p><div class="row"><button class="btn gold" data-act="trWhere">Set my mile</button></div></section>`;
    const total = Math.max(0.1, n.hi - n.lo), done = OA.clamp(c.reversed ? n.hi - c.mile : c.mile - n.lo, 0, total), pct = Math.round(done / total * 100);
    return `<section class="card hot"><div class="ct"><span>${OA.icon('pin')} You are at mile ${fmtMile(c.mile)}</span><span class="sm dim">${esc(DIRLAB[c.dir] || c.dir)}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div><div class="sm dim" style="margin-top:4px">${esc(OA.dist(done))} done · ${esc(OA.dist(total - done))} to go (${pct}%)</div>
      <div class="row"><button class="btn gold" data-act="trWhere" data-smoke>Update my mile</button></div></section>`;
  }
  function nextRows(c) {
    const defs = [['water', 'Next water', 'drop'], ['town', 'Next town', 'home'], ['resupply', 'Next resupply', 'cart'], ['pass', 'Next pass', 'mountain'], ['hazard', 'Next hazard', 'alert']];
    return defs.map(d => { const r = c.next(d[0], 1)[0]; return { key: d[0], label: d[1], ic: d[2], r }; });
  }
  function nextUpCard(t, c) {
    if (!c || c.mile == null) return '';
    const rows = nextRows(c).map(x => {
      const p = x.r && x.r.point; const wt = p && isWater(p) && p.water && p.water.type ? ' · ' + p.water.type : '';
      const act = p ? (p.hazard ? `data-act="trHaz" data-t="${esc(t.id)}" data-hz="${p.hzIndex}"` : `data-act="trPoint" data-t="${esc(t.id)}" data-i="${norm(t).idx.get(p)}"`) : '';
      return `<div class="li" ${act}><span class="ic">${OA.icon(x.ic)}</span><div class="tx"><b>${p ? esc(p.name || kindOf(p)[0]) : 'None listed ahead'}</b><span>${x.label}${esc(wt)}${p ? ' · mile ' + fmtMile(p.mi) : ''}</span></div><div class="end">${p ? (p.inside ? 'you are in it' : esc(OA.dist(x.r.distMi))) : ''}</div></div>`;
    }).join('');
    return `<section class="card"><div class="ct"><span>${OA.icon('compass')} Next up</span><span class="xs dim">from your mile, works offline</span></div>${rows}<div class="xs dim">Only places listed in this app. Water, services and conditions change: check recent reports.</div></section>`;
  }

  /* ----- strip map ----- */
  function stripView(t, c) {
    const n = norm(t), s = sgn(t, c ? c.dir : fwdDir(t)), rev = s < 0, mile = c && c.mile != null ? c.mile : null;
    if (!n.pts.length && !n.hz.length) return `<section class="card"><p class="dim">This trail has no points on file yet (${CHECK}).</p></section>`;
    const secs = secList(t), q = UI.q.trim().toLowerCase();
    let si = -1;
    if (UI.sec === 'here') { si = mile != null ? secs.findIndex(x => mile >= x.from && mile <= x.to) : -1; if (si < 0) si = rev ? secs.length - 1 : 0; }
    else if (UI.sec !== 'all') si = Math.min(+UI.sec, secs.length - 1);
    const sec = si >= 0 ? secs[si] : null, from = sec ? sec.from : n.lo, to = sec ? sec.to : n.hi + 1;
    const order = secs.map((x, i) => i); if (rev) order.reverse();
    const sel = `<select class="in" data-onchange="trSecSel" aria-label="Section">${order.map(i => `<option value="${i}" ${i === si ? 'selected' : ''}>${esc(secs[i].name)}${secs[i].auto ? '' : ' (mile ' + fmtMile(secs[i].from) + '–' + fmtMile(secs[i].to) + ')'}</option>`).join('')}<option value="all" ${UI.sec === 'all' ? 'selected' : ''}>Whole trail (long)</option></select>`;
    const fchip = (v, l) => `<button class="chip ${UI.filter === v ? 'on' : ''}" data-act="trFilter" data-v="${v}">${l}</button>`;
    let h = `<div><label class="fl">Section${sel}</label><label class="fl">Find a place<input class="in" type="search" placeholder="Name" value="${esc(UI.q)}" data-onchange="trSearch" aria-label="Find a place"></label></div>
      <div class="chips">${fchip('all', 'Everything')}${fchip('key', 'Towns & passes')}${fchip('water', 'Water')}${fchip('camp', 'Camps')}</div>`;
    if (rev) h += `<div class="xs dim">Listed in your direction of travel (${esc(DIRLAB[c.dir] || c.dir)}): top is behind you, bottom is ahead.</div>`;
    const KEY = { terminus: 1, town: 1, pass: 1, trailhead: 1, hazard: 1, permit: 1 }, CAMP = { campsite: 1, 'bear-box': 1 };
    let pts = n.pts;
    if (q) pts = pts.filter(p => String(p.name || '').toLowerCase().indexOf(q) >= 0);
    else if (sec) pts = pts.filter(p => M(p) >= from && M(p) <= to);
    if (UI.filter === 'key') pts = pts.filter(p => KEY[p.kind]); else if (UI.filter === 'water') pts = pts.filter(isWater); else if (UI.filter === 'camp') pts = pts.filter(p => CAMP[p.kind]);
    if (!q && sec) {
      h += `<section class="card inner"><b>${esc(sec.name)}</b> <span class="sm dim">mile ${fmtMile(sec.from)}–${fmtMile(Math.min(sec.to, n.hi))}</span>${sec.note ? `<div class="sm dim">${esc(sec.note)}</div>` : ''}</section>`;
      const prof = profileFor(t, sec, mile); if (prof) h += prof;
    }
    // build entries
    const E = [];
    pts.forEach(p => E.push({ k: s * M(p), pr: 2, mi: M(p), p }));
    if (!q) {
      n.hz.forEach(z => { if (z.from <= to && z.to >= from) { const e = Math.min(Math.max(s > 0 ? z.from : z.to, from), to); E.push({ k: s * e, pr: 1, mi: e, hz: z }); } });
      if (mile != null && mile >= from && mile <= to) E.push({ k: s * mile, pr: 0, mi: mile, here: true });
    }
    E.sort((a, b) => a.k - b.k || a.pr - b.pr);
    const inHaz = mi => n.hz.some(z => mi >= z.from && mi <= z.to);
    let shown = 0, last = null, rows = '', more = false;
    for (const e of E) {
      if (e.p) { if (shown >= UI.limit) { more = true; break; } shown++; }
      if (e.p && last != null) { const g = Math.abs(e.mi - last); if (g >= 0.05) rows += `<div class="tr-row tr-gaprow ${inHaz((e.mi + last) / 2) ? 'hz' : ''}"><span></span><span class="tr-rail"></span><span class="tr-gap">${esc(OA.dist(g))}</span></div>`; }
      const hzc = inHaz(e.mi) ? ' hz' : '';
      if (e.here) rows += `<div class="tr-row here${hzc}"><span class="tr-mi gold">${fmtMile(e.mi)}</span><span class="tr-rail"><span class="tr-dot">${OA.icon('pin')}</span></span><div class="tr-body"><b class="gold">You are here</b><div class="xs dim">Mile ${fmtMile(e.mi)}</div></div></div>`;
      else if (e.hz) rows += `<div class="tr-row hz" data-act="trHaz" data-t="${esc(t.id)}" data-hz="${e.hz.i}" role="button"><span class="tr-mi">${fmtMile(e.mi)}</span><span class="tr-rail"><span class="tr-dot red">${OA.icon('alert')}</span></span><div class="tr-body"><b class="red">Hazard: ${esc(e.hz.h.title || 'Hazard')}</b><div class="xs dim">Mile ${fmtMile(e.hz.from)}–${fmtMile(e.hz.to)}${e.hz.h.note ? ' · ' + esc(String(e.hz.h.note).slice(0, 90)) + (String(e.hz.h.note).length > 90 ? '…' : '') : ''}</div></div></div>`;
      else {
        const p = e.p, sub = [kindOf(p)[0], p.elev != null && num(p.elev) ? OA.ft(+p.elev) : null, p.off && num(p.off.mi) && +p.off.mi > 0 ? OA.dist(+p.off.mi) + ' off trail' : null].filter(Boolean).join(' · ');
        const tags = svcTags(p, true);
        rows += `<div class="tr-row${hzc}" data-act="trPoint" data-t="${esc(t.id)}" data-i="${n.idx.get(p)}" role="button"><span class="tr-mi">${fmtMile(e.mi)}</span><span class="tr-rail"><span class="tr-dot ${p.kind === 'hazard' ? 'red' : ''}">${icon(p)}</span></span><div class="tr-body"><b>${esc(p.name || kindOf(p)[0])}</b><div class="xs dim">${esc(sub)}</div>${tags ? `<div>${tags}</div>` : ''}</div></div>`;
        last = e.mi;
      }
    }
    h += rows ? `<div class="tr-strip">${rows}</div>` : `<section class="card"><p class="dim">${q ? 'Nothing with that name.' : 'No points match this view.'}</p></section>`;
    if (more) h += `<button class="btn block" data-act="trMore">Show more</button>`;
    return h;
  }
  function profileFor(t, sec, mile) {
    const s = series(t), dense = norm(t).dense; let pts = s.filter(r => r[0] >= sec.from && r[0] <= sec.to);
    if (pts.length < (dense ? 8 : 4)) return '';
    if (pts.length > 240) { const st = Math.ceil(pts.length / 240); pts = pts.filter((r, i) => i % st === 0 || i === pts.length - 1); }
    const km = OA.unit.dist() === 'km', ey = mile != null ? elevAt(t, mile) : null;
    return `<section class="card inner">${OA.chart.profile(pts, [], { label: 'Elevation profile', xfmt: v => Math.round(v), yfmt: v => km ? Math.round(v * 0.3048).toLocaleString() : Math.round(v).toLocaleString(), here: mile, hereY: ey != null ? ey : undefined })}<div class="xs dim">Elevation (${km ? 'm' : 'ft'}) by mile marker${dense ? '' : ', drawn from the listed points only, so it is rough'}.</div></section>`;
  }
  function svcTags(p, short) {
    const s = p.svc; if (!s || typeof s !== 'object') return '';
    const out = [];
    Object.keys(SVC).forEach(k => {
      const v = s[k]; if (v == null) return;
      if (v === false) { if (!short) out.push(`<span class="tag">No ${esc(SVC[k].toLowerCase())}</span>`); return; }
      if (short && (k === 'cell' || k === 'hikerBox')) return;
      let txt = SVC[k]; if (Array.isArray(v)) { if (!v.length) return; if (!short) txt += ': ' + v.join(', '); } else if (typeof v === 'string' && !short) txt += ': ' + v;
      out.push(`<span class="tag ${k === 'grocery' || k === 'post' ? 'g' : ''}">${esc(txt)}</span>`);
    });
    return out.join('');
  }

  /* ----- generic list used by towns / water / passes ----- */
  function aheadFilter(t, c, arr) {
    if (!c || c.mile == null || UI.behind) return arr;
    const s = sgn(t, c.dir); return arr.filter(p => (M(p) - c.mile) * s >= -0.05);
  }
  function placeRows(t, c, arr, sub) {
    const n = norm(t), s = sgn(t, c ? c.dir : fwdDir(t)); arr = arr.slice().sort((a, b) => (M(a) - M(b)) * s);
    const behindBtn = c && c.mile != null ? `<label class="chk"><input type="checkbox" data-act="trBehind" ${UI.behind ? 'checked' : ''}> Include places behind me</label>` : '';
    arr = aheadFilter(t, c, arr);
    const total = arr.length, vis = arr.slice(0, UI.limit);
    return behindBtn + (vis.length ? `<section class="card">${vis.map(p => `<div class="li" data-act="trPoint" data-t="${esc(t.id)}" data-i="${n.idx.get(p)}" role="button"><span class="ic">${icon(p)}</span><div class="tx"><b>${esc(p.name || kindOf(p)[0])}</b><span>${esc(sub(p))}</span></div><div class="end">mile ${fmtMile(M(p))}<br>${esc(distMsg(c, p))}</div></div>`).join('')}</section>` : `<section class="card"><p class="dim">Nothing listed here.</p></section>`) +
      (total > vis.length ? `<button class="btn block" data-act="trMore">Show more (${total - vis.length} left)</button>` : '');
  }
  function townsView(t, c) {
    const n = norm(t), f = UI.townF;
    let arr = n.pts.filter(p => p.kind === 'town' || isResupply(p));
    const has = (p, k) => p.svc && p.svc[k] && !/^no/i.test(String(p.svc[k]));
    if (f === 'grocery') arr = arr.filter(p => has(p, 'grocery')); else if (f === 'post') arr = arr.filter(p => has(p, 'post')); else if (f === 'lodging') arr = arr.filter(p => p.svc && Array.isArray(p.svc.lodging) ? p.svc.lodging.length : has(p, 'lodging'));
    const chip = (v, l) => `<button class="chip ${f === v ? 'on' : ''}" data-act="trTownF" data-v="${v}">${l}</button>`;
    return `<div class="chips">${chip('all', 'All towns')}${chip('grocery', 'Grocery')}${chip('post', 'Post office')}${chip('lodging', 'Lodging')}</div>` +
      placeRows(t, c, arr, p => { const tg = []; if (has(p, 'grocery')) tg.push('grocery'); if (has(p, 'post')) tg.push('post office'); if (p.svc && p.svc.lodging && (!Array.isArray(p.svc.lodging) || p.svc.lodging.length)) tg.push('lodging'); if (p.off && num(p.off.mi) && +p.off.mi > 0) tg.push(OA.dist(+p.off.mi) + ' off trail'); return tg.length ? tg.join(' · ') : (p.svc ? 'Tap for details' : 'Services: ' + CHECK); }) +
      `<div class="xs dim">Only towns and services on file are shown. Hours and services change: call ahead before mailing a resupply box.</div>`;
  }
  function waterView(t, c) {
    const n = norm(t), gaps = waterGaps(t, UI.gap).sort((a, b) => b.miles - a.miles);
    const chip = v => `<button class="chip ${UI.gap === v ? 'on' : ''}" data-act="trGap" data-v="${v}">${v}+ mi</button>`;
    let h = `<section class="card"><div class="ct"><span>${OA.icon('drop')} Long dry stretches</span></div><div class="chips">${chip(10)}${chip(15)}${chip(20)}${chip(30)}</div>`;
    h += gaps.length ? gaps.slice(0, 12).map(g => `<div class="li" data-act="trPoint" data-t="${esc(t.id)}" data-i="${n.idx.get(g.fromPoint)}" role="button"><span class="ic">${OA.icon('alert')}</span><div class="tx"><b>${esc(OA.dist(g.miles))} between listed water</b><span>${esc(g.fromPoint.name || 'Water')} (mile ${fmtMile(M(g.fromPoint))}) to ${esc(g.toPoint.name || 'Water')} (mile ${fmtMile(M(g.toPoint))})</span></div></div>`).join('') : `<p class="sm dim">${n.pts.some(isWater) ? 'No gaps this long between the water sources listed in this app.' : 'No water sources are listed for this trail (' + CHECK + ').'}</p>`;
    h += `<div class="xs dim">Based only on the sources listed here. Sources can be dry, and unlisted ones may exist: carry enough for the longest stretch and check recent reports. Treat all water.</div></section>`;
    return h + placeRows(t, c, n.pts.filter(isWater), p => { const w = p.water && typeof p.water === 'object' ? p.water : null; return [kindOf(p)[0], w && w.type ? w.type : null, w && w.note ? String(w.note).slice(0, 70) : null].filter(Boolean).join(' · ') || 'Water: ' + CHECK; });
  }
  function passesView(t, c) {
    const n = norm(t), s = sgn(t, c ? c.dir : fwdDir(t));
    let h = '';
    const hz = n.hz.slice().sort((a, b) => (a.from - b.from) * s);
    h += `<section class="card"><div class="ct"><span>${OA.icon('alert')} Hazards</span></div>` + (hz.length ? hz.map(z => `<div class="li" data-act="trHaz" data-t="${esc(t.id)}" data-hz="${z.i}" role="button"><span class="ic red">${OA.icon('alert')}</span><div class="tx"><b>${esc(z.h.title || 'Hazard')}</b><span>Mile ${fmtMile(z.from)}–${fmtMile(z.to)}${z.h.note ? ' · ' + esc(String(z.h.note).slice(0, 80)) : ''}</span></div></div>`).join('') : `<p class="sm dim">No hazard ranges on file (${CHECK}).</p>`) + `</section>`;
    return h + `<div class="ct" style="margin-top:6px"><span>${OA.icon('mountain')} Passes and high points</span></div>` + placeRows(t, c, n.pts.filter(p => p.kind === 'pass' || p.kind === 'hazard'), p => [kindOf(p)[0], num(p.elev) ? OA.ft(+p.elev) : null].filter(Boolean).join(' · '));
  }
  function permitsView(t, c) {
    const pe = t.permits, se = t.seasons; let h = '';
    h += `<section class="card"><div class="ct"><span>${OA.icon('ticket')} Permits</span></div>`;
    if (!Array.isArray(pe)) h += `<p class="sm">Permit information is not on file. Check with the land manager.</p>`;
    else if (!pe.length) h += `<p class="sm dim">No permit is listed for this trail. Rules change: confirm with the land manager.</p>`;
    else h += pe.map(x => `<div class="card inner"><b>${esc(x.name || 'Permit')}</b>${x.who ? `<div class="sm">For: ${esc(x.who)}</div>` : ''}${x.when ? `<div class="sm">When: ${esc(x.when)}</div>` : ''}<div class="sm">Cost: ${num(x.costUsd) ? esc(OA.money2(+x.costUsd)) : CHECK}</div>${x.note ? `<div class="sm dim">${esc(x.note)}</div>` : ''}${safeUrl(x.url) ? `<div class="sm">${link(x.url, 'Official page')}</div>` : ''}</div>`).join('');
    h += `</section><section class="card"><div class="ct"><span>${OA.icon('calendar')} Seasons</span></div>`;
    if (Array.isArray(se) && se.length) h += se.map(x => `<div class="kv"><span><b>${esc(x.label || 'Season')}</b>${x.note ? `<div class="xs">${esc(x.note)}</div>` : ''}</span><span class="right">${esc(monthsText(x.months) || CHECK)}</span></div>`).join('');
    else h += `<p class="sm">Season information is not on file. ${CHECK}.</p>`;
    h += `</section>`;
    const d = t.typicalDays, sd = S().trail.startDate, mine = S().trail.id === t.id;
    h += `<section class="card"><div class="ct"><span>${OA.icon('clock')} Typical time</span></div><div class="kv"><span>Usual length of trip</span><span>${esc(daysTxt(t) || CHECK)}</span></div>${d && d.note ? `<div class="sm dim">${esc(d.note)}</div>` : ''}`;
    if (mine) {
      h += `<label class="fl">My start date<input class="in" type="date" value="${esc(sd || '')}" data-bind="trail.startDate" data-type="text" data-then="trDate"></label>`;
      if (sd && d && (num(d.min) || num(d.max))) { const a = num(d.min) ? OA.addDays(sd, Math.round(+d.min)) : null, b = num(d.max) ? OA.addDays(sd, Math.round(+d.max)) : null; h += `<div class="sm">Typical finish: ${esc([a, b].filter(Boolean).filter((v, i, ar) => ar.indexOf(v) === i).map(k => OA.fmtDate(k, { month: 'short', day: 'numeric' })).join(' to '))}</div>`; }
    }
    return h + `</section>`;
  }
  function infoView(t, c) {
    const n = norm(t); let h = `<section class="card"><div class="ct"><span>${OA.icon('info')} About this data</span></div>`;
    const kv = (a, b) => `<div class="kv"><span>${a}</span><span class="right">${b}</span></div>`;
    h += kv('Length', esc(milesTxt(t)));
    if (t.milesSource) h += kv('Mileage from', esc(t.milesSource));
    if (t.mileNote) h += `<div class="sm dim">${esc(t.mileNote)}</div>`;
    h += kv('Direction of mile markers', esc(DIRLAB[fwdDir(t)] || fwdDir(t)));
    if (t.start && t.start.name) h += kv('Start (mile 0)', esc(t.start.name));
    if (t.end && t.end.name) h += kv('End', esc(t.end.name));
    if (Array.isArray(t.states) && t.states.length) h += kv('States', esc(t.states.join(', ')));
    h += kv('Points on file', String(n.pts.length)) + kv('Data checked', esc(t.asof || CHECK));
    if (num(t.gainFt)) h += kv('Climb (from file)', esc(OA.ft(+t.gainFt)) + ' up / ' + esc(OA.ft(+t.lossFt || 0)) + ' down');
    h += `</section>`;
    if (Array.isArray(t.links) && t.links.filter(l => safeUrl(l && l.url)).length) h += `<section class="card"><div class="ct"><span>${OA.icon('book')} Official links</span></div>${t.links.filter(l => safeUrl(l && l.url)).map(l => `<div class="li" style="cursor:default"><div class="tx">${link(l.url, l.label || l.url)}</div></div>`).join('')}</section>`;
    else h += `<section class="card"><p class="sm dim">No official links on file (${CHECK}).</p></section>`;
    if (S().trail.id !== t.id) h += `<button class="btn gold block" data-act="trChoose" data-id="${esc(t.id)}">Set as my trail</button>`;
    if (t.custom) h += `<button class="btn danger block" data-act="trDelete" data-id="${esc(t.id)}">Delete this imported trail</button>`;
    return h;
  }

  /* ---------- point and hazard sheets ---------- */
  function pointSheet(tid, i) {
    const t = getTrail(tid); if (!t) return; const p = (t.points || [])[i]; if (!p) return;
    const c = curFor(t), kd = kindOf(p), svc = svcTags(p, false), w = p.water && typeof p.water === 'object' ? p.water : null;
    let h = `<div class="sm dim">${esc(kd[0])} · mile ${fmtMile(M(p))}${distMsg(c, p) ? ' · ' + esc(distMsg(c, p)) : ''}</div>`;
    h += `<section class="sh-sec">`;
    if (p.elev != null && num(p.elev)) h += `<div class="kv"><span>Elevation</span><b>${esc(OA.ft(+p.elev))}</b></div>`;
    if (p.off && num(p.off.mi) && +p.off.mi > 0) h += `<div class="kv"><span>Off the trail</span><b>${esc(OA.dist(+p.off.mi))}${p.off.dir ? ' ' + esc(p.off.dir) : ''}</b></div>`;
    if (num(p.lat) && num(p.lon)) h += `<div class="kv"><span>Position</span><b>${esc(G.fmtCoord(+p.lat, +p.lon))}</b></div>`;
    h += `</section>`;
    if (p.kind === 'town' || p.svc) h += `<section class="sh-sec"><h3>Services</h3>${svc || `<span class="sm dim">Services: ${CHECK}.</span>`}</section>`;
    if (p.kind === 'water' || w) h += `<section class="sh-sec"><h3>Water</h3>${w ? `<div>${w.type ? `<span class="tag g">${esc(w.type)}</span>` : ''}</div>${w.note ? `<p class="sm">${esc(w.note)}</p>` : ''}` : `<p class="sm dim">Water details: ${CHECK}.</p>`}<div class="xs dim">Treat all water. Sources can be dry: check recent reports.</div></section>`;
    if (p.note) h += `<section class="sh-sec"><h3>Notes</h3><p class="sm">${esc(p.note)}</p></section>`;
    const contact = [];
    if (p.phone) contact.push(`<a class="btn" href="tel:${esc(String(p.phone).replace(/[^\d+]/g, ''))}">Call ${esc(p.phone)}</a>`);
    if (safeUrl(p.url)) contact.push(`<a class="btn" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">Website</a>`);
    if (contact.length) h += `<div class="row wrap">${contact.join('')}</div>`;
    else if (p.kind === 'town') h += `<p class="xs dim">Phone and website: ${CHECK}.</p>`;
    if (p.src) h += `<p class="xs dim">Source: ${safeUrl(p.src) ? link(p.src, 'official page') : esc(p.src)}${t.asof ? ' · checked ' + esc(t.asof) : ''}</p>`;
    h += `<div class="row"><button class="btn gold" data-act="trHere" data-t="${esc(tid)}" data-i="${i}">I'm here</button><button class="btn" data-act="trPlan" data-t="${esc(tid)}" data-i="${i}">Add to my plan</button></div>`;
    if (num(p.lat) && num(p.lon)) { const l = G.mapLinks(+p.lat, +p.lon, p.name); h += `<div class="row wrap"><a class="btn" href="${esc(l.apple)}" target="_blank" rel="noopener">Apple Maps</a><a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="${esc(l.osm)}" target="_blank" rel="noopener">OpenStreetMap</a></div>`; }
    else h += `<p class="xs dim">No coordinates on file for this place.</p>`;
    OA.sheet(p.name || kd[0], h);
  }
  function hazSheet(tid, hz) {
    const t = getTrail(tid); if (!t) return; const z = norm(t).hz.find(x => x.i === +hz); if (!z) return;
    const c = curFor(t), e = elevBetween(t, z.from, z.to);
    OA.sheet(z.h.title || 'Hazard', `<div class="alert danger"><b class="t">Mile ${fmtMile(z.from)}–${fmtMile(z.to)}</b>${esc(z.h.note || 'Details: ' + CHECK + '.')}</div>
      <div class="kv"><span>Length</span><b>${esc(OA.dist(z.to - z.from))}</b></div>${c && c.mile != null ? `<div class="kv"><span>From you</span><b>${esc(distMsg(c, { mi: sgn(t, c.dir) > 0 ? z.from : z.to }) || '–')}</b></div>` : ''}${e ? `<div class="kv"><span>Climb in this stretch (rough)</span><b>${esc(OA.ft(e.gainFt))} up / ${esc(OA.ft(e.lossFt))} down</b></div>` : ''}
      <p class="xs dim">Conditions change with the season and weather. Check with the land manager before you go and turn around if it is not safe.${t.asof ? ' Data checked ' + esc(t.asof) + '.' : ''}</p>`);
  }

  /* ---------- where am I ---------- */
  function whereHtml() {
    const c = current(); if (!c) return '<p class="dim">Choose a trail first.</p>';
    const hasPos = norm(c.trail).line.la.length > 0;
    return `<div class="center"><div class="big-num">${c.mile != null ? fmtMile(c.mile) : '–'}</div><div class="sm dim">your mile marker on ${esc(c.trail.name || c.trail.id)}</div></div>
      <section class="sh-sec"><h3>Enter it yourself</h3><p class="xs dim">Use the mile marker from your guide or a trail sign.</p>
        <div class="row mid"><button class="btn" data-act="trNudge" data-d="-1" aria-label="Back 1 mile">-1</button><button class="btn" data-act="trNudge" data-d="-0.1" aria-label="Back 0.1 mile">-0.1</button>
        <input class="in" id="trmile" type="number" inputmode="decimal" step="0.1" min="0" value="${c.mile != null ? Math.round(c.mile * 10) / 10 : ''}" data-onchange="trMileSet" style="text-align:center;margin:0" aria-label="Mile marker">
        <button class="btn" data-act="trNudge" data-d="0.1" aria-label="Forward 0.1 mile">+0.1</button><button class="btn" data-act="trNudge" data-d="1" aria-label="Forward 1 mile">+1</button></div></section>
      <section class="sh-sec"><h3>Use my GPS</h3>${hasPos ? `<p class="xs dim">Takes one position fix and finds the closest spot on the trail line. Works offline.</p><button class="btn gold block" data-act="trGps">Find me on the trail</button><div id="trgpsout"></div>` : `<p class="sm dim">This trail has no coordinates on file, so GPS matching is not possible. Enter your mile above.</p>`}</section>
      <button class="btn block" data-act="closeSheet">Done</button>`;
  }

  /* ---------- choose a trail ---------- */
  function chooseSheet(id) {
    const t = getTrail(id); if (!t) return; const st = S().trail, pair = dirPair(t), same = st.id === id;
    OA.sheet('Set as my trail', `<h2 class="big">${esc(t.name || t.id)}</h2><p class="sm dim">${esc(milesTxt(t))}</p>
      <label class="fl">Direction<select class="in" id="trdir">${pair.map(d => `<option value="${d}" ${(same ? okDir(t, st.dir) : pair[0]) === d ? 'selected' : ''}>${esc(DIRLAB[d] || d)}</option>`).join('')}</select></label>
      <label class="fl">Where are you now? Mile marker (leave empty to set later)<input class="in" id="trm" type="number" inputmode="decimal" step="0.1" min="0" value="${same && st.mile != null ? esc(st.mile) : ''}" placeholder="for example 0"></label>
      <button class="btn block" data-act="trStartFill" data-id="${esc(id)}">I am at the start of the trail</button>
      <label class="fl">Start date (optional)<input class="in" id="trsd" type="date" value="${esc(same && st.startDate || '')}"></label>
      <button class="btn gold block" data-act="trChooseGo" data-id="${esc(id)}">Save</button>`);
  }

  /* ---------- GPX import ---------- */
  const guessKind = s => {
    s = String(s || '').toLowerCase();
    if (/hazard|danger|caution|warning|avalanche|closure/.test(s)) return 'hazard';
    if (/water|spring|creek|stream|river|lake|pond|tank|cache|fountain|faucet/.test(s)) return 'water';
    if (/permit|ranger|registration/.test(s)) return 'permit';
    if (/bear/.test(s)) return 'bear-box';
    if (/camp|tent|shelter|hut|bivy|lean-to|lodge/.test(s)) return 'campsite';
    if (/trailhead|parking|\bth\b|lot\b/.test(s)) return 'trailhead';
    if (/pass|saddle|gap|summit|peak|col\b|notch/.test(s)) return 'pass';
    if (/town|city|village|store|grocery|market|post office|motel|hotel|restaurant|cafe|café|gas|inn\b/.test(s)) return 'town';
    return 'landmark';
  };
  function parseGpx(text) {
    const doc = new DOMParser().parseFromString(String(text), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length || !doc.documentElement || !/gpx/i.test(doc.documentElement.localName || doc.documentElement.nodeName)) throw new Error('That does not look like a GPX file.');
    const q = (r, n) => Array.from(r.getElementsByTagNameNS('*', n));
    const kid = (e, n) => { const k = Array.from(e.children).find(x => x.localName === n); return k ? k.textContent.trim() : ''; };
    const pt = e => { const lat = parseFloat(e.getAttribute('lat')), lon = parseFloat(e.getAttribute('lon')), ele = parseFloat(kid(e, 'ele')); return { lat, lon, ele: isFinite(ele) ? ele : null, name: kid(e, 'name'), sym: kid(e, 'sym') || kid(e, 'type'), desc: kid(e, 'desc') || kid(e, 'cmt') }; };
    let trk = []; q(doc, 'trkseg').forEach(sg => q(sg, 'trkpt').forEach(e => trk.push(pt(e))));
    if (trk.length < 2) { trk = []; q(doc, 'rte').forEach(r => q(r, 'rtept').forEach(e => trk.push(pt(e)))); }
    trk = trk.filter(p => isFinite(p.lat) && isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180);
    if (trk.length < 2) throw new Error('This file has no track or route to import.');
    const wp = q(doc, 'wpt').map(pt).filter(p => isFinite(p.lat) && isFinite(p.lon));
    const nm = doc.getElementsByTagNameNS('*', 'name')[0];
    return { trk, wp, name: (nm && nm.textContent.trim()) || '' };
  }
  function gainLoss(e, thr) { let ref = e[0], g = 0, l = 0; for (let i = 1; i < e.length; i++) { const d = e[i] - ref; if (d >= thr) { g += d; ref = e[i]; } else if (d <= -thr) { l -= d; ref = e[i]; } } return [g, l]; }
  function buildTrail(par, name, eleUnit) {
    const k = eleUnit === 'ft' ? 1 : 3.28084, raw = par.trk, cum = [0];
    for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + G.mi(raw[i - 1], raw[i]));
    // smooth elevations (moving average of 5) so GPS noise does not inflate the climb
    const hasEle = raw.filter(p => p.ele != null).length > raw.length * 0.8, sm = raw.map((p, i) => { if (!hasEle) return null; let s = 0, c = 0; for (let j = Math.max(0, i - 2); j <= Math.min(raw.length - 1, i + 2); j++) if (raw[j].ele != null) { s += raw[j].ele; c++; } return c ? s / c * k : null; });
    const track = []; let lastMi = -1;
    raw.forEach((p, i) => { if (i === 0 || i === raw.length - 1 || cum[i] - lastMi >= 0.1) { track.push([Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5, Math.round(cum[i] * 100) / 100, sm[i] == null ? null : Math.round(sm[i])]); lastMi = cum[i]; } });
    const miles = Math.round(cum[cum.length - 1] * 10) / 10;
    let gainFt = null, lossFt = null, profile = null;
    if (hasEle) { const e = track.map(r => r[3]).filter(v => v != null), gl = gainLoss(e, 10); gainFt = Math.round(gl[0] / 10) * 10; lossFt = Math.round(gl[1] / 10) * 10; profile = track.filter(r => r[3] != null).map(r => [r[2], r[3]]); }
    const eleAt = mi => { if (!profile) return null; let b = profile[0]; for (const r of profile) { if (Math.abs(r[0] - mi) < Math.abs(b[0] - mi)) b = r; if (r[0] > mi) break; } return b[1]; };
    const points = [{ mi: 0, name: 'Start', kind: 'terminus', lat: track[0][0], lon: track[0][1], elev: eleAt(0), src: 'Imported GPX' }];
    par.wp.slice(0, 500).forEach(w => {
      let bi = 0, bd = 1e9; for (let i = 0; i < track.length; i++) { const d = G.mi({ lat: track[i][0], lon: track[i][1] }, w); if (d < bd) { bd = d; bi = i; } }
      const mi = track[bi][2];
      points.push({ mi, name: w.name || 'Waypoint', kind: guessKind((w.name || '') + ' ' + w.sym), lat: w.lat, lon: w.lon, elev: w.ele != null ? Math.round(w.ele * k / 10) * 10 : eleAt(mi), note: w.desc || '', src: 'Imported GPX', off: bd > 0.1 ? { mi: Math.round(bd * 10) / 10, dir: null } : null });
    });
    points.push({ mi: miles, name: 'End', kind: 'terminus', lat: track[track.length - 1][0], lon: track[track.length - 1][1], elev: eleAt(miles), src: 'Imported GPX' });
    const id = 'gpx_' + OA.uid();
    return {
      id, name: name || 'Imported trail', short: 'Imported GPX route', miles, milesSource: 'Computed from the GPX file you imported', mileNote: 'Distance along the recorded line. The official trail length may differ.', asof: OA.dkey().slice(0, 7), dir: 'FWD', states: null,
      start: { name: 'Start', lat: track[0][0], lon: track[0][1] }, end: { name: 'End', lat: track[track.length - 1][0], lon: track[track.length - 1][1] }, typicalDays: null, permits: null, seasons: null, hazards: [], sections: [], points, links: [],
      disclaimer: 'Imported by you from a GPX file. Accuracy depends on the file; there is no permit, town or water information unless it was in the file.', custom: true, track, profile, gainFt, lossFt, hasEle
    };
  }
  function importSheetHtml() {
    const pe = UI.pending;
    if (!pe) return `<p class="sm dim">Choose a .gpx file from your phone, or paste the file contents below. Tracks and routes become the trail line; waypoints become places.</p>
      <label class="btn block center">Choose a GPX file<input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" style="display:none" data-onchange="trGpxFile"></label>
      <label class="fl">Or paste GPX text<textarea class="in" id="trgpaste" rows="4" placeholder="&lt;gpx ..."></textarea></label><button class="btn block" data-act="trGpxPaste">Read pasted text</button><div id="trgerr" class="sm red"></div>`;
    const t = buildTrail(pe.par, pe.name, pe.unit);
    pe.built = t;
    return `<label class="fl">Name<input class="in" id="trgname" value="${esc(pe.name)}" maxlength="80"></label>
      <div class="stat"><div><b>${esc(OA.dist(t.miles))}</b><span>LENGTH</span></div><div><b>${t.hasEle ? esc(OA.ft(t.gainFt)) : '–'}</b><span>CLIMB</span></div><div><b>${t.points.length - 2}</b><span>PLACES</span></div></div>
      ${t.hasEle ? `<label class="fl">Elevations in the file are in<select class="in" id="trgunit" data-onchange="trGpxUnit"><option value="m" ${pe.unit === 'm' ? 'selected' : ''}>Meters (the GPX standard)</option><option value="ft" ${pe.unit === 'ft' ? 'selected' : ''}>Feet</option></select></label><div class="xs dim">If the climb looks wrong, switch the unit. Climb is smoothed to ignore GPS noise and is approximate.</div>` : '<div class="alert"><b class="t">No elevation in this file</b>The trail will have no elevation profile or climb figures.</div>'}
      ${t.hasEle ? OA.chart.profile(t.profile, [], { label: 'Elevation', yfmt: v => OA.unit.dist() === 'km' ? Math.round(v * 0.3048) : Math.round(v) }) : ''}
      <div class="row"><button class="btn" data-act="trGpxCancel">Start over</button><button class="btn gold" data-act="trGpxSave">Save trail</button></div>`;
  }
  async function readFileText(f) { return f.text(); }
  function startPending(text, fname) {
    try {
      const par = parseGpx(text); UI.pending = { par, name: par.name || String(fname || '').replace(/\.gpx$/i, '') || 'Imported trail', unit: 'm' };
      OA.redrawSheet(`${importSheetHtml()}`);
    } catch (e) { const out = OA.$('#trgerr'); if (out) out.textContent = e.message; else OA.toast(e.message, 4500); }
  }

  /* ---------- actions ---------- */
  OA.act({
    openTrail(el) { UI.open = el.dataset.id; UI.view = 'strip'; UI.sec = 'here'; UI.filter = 'all'; UI.limit = 80; UI.q = ''; OA.render(); window.scrollTo(0, 0); },
    trLib() { UI.open = 'lib'; OA.render(); window.scrollTo(0, 0); },
    trView(el) { UI.view = el.dataset.v; UI.limit = 80; OA.render(true); },
    trSecSel(el) { UI.sec = (el.value === 'all' || el.value === 'here') ? el.value : +el.value; UI.limit = 80; OA.render(true); },
    trFilter(el) { UI.filter = el.dataset.v; UI.limit = 80; OA.render(true); },
    trSearch(el) { UI.q = el.value || ''; UI.limit = 80; OA.render(true); },
    trMore() { UI.limit += 80; OA.render(true); },
    trBehind(el) { UI.behind = !!el.checked; UI.limit = 80; OA.render(true); },
    trTownF(el) { UI.townF = el.dataset.v; UI.limit = 80; OA.render(true); },
    trGap(el) { UI.gap = +el.dataset.v; OA.render(true); },
    trLibQ(el) { UI.lq = el.value || ''; OA.render(true); },
    trLibF(el) { UI.lf = el.dataset.v; OA.render(true); },
    trDate() { OA.saveSoon(); OA.render(true); },
    trPoint(el) { pointSheet(el.dataset.t, +el.dataset.i); },
    trHaz(el) { hazSheet(el.dataset.t, el.dataset.hz); },
    trHere(el) {
      const t = getTrail(el.dataset.t), p = t && (t.points || [])[+el.dataset.i]; if (!p || !num(p.mi)) return;
      if (S().trail.id !== t.id) { setCurrent(t.id, +p.mi, S().trail.dir); } else setCurrent(t.id, +p.mi);
      UI.open = t.id; OA.toast('Your mile is now ' + fmtMile(+p.mi) + '.'); OA.closeSheet();
    },
    trPlan(el) {
      const t = getTrail(el.dataset.t), i = +el.dataset.i;
      if (window.BP && BP.plan && typeof BP.plan.addStop === 'function') { try { BP.plan.addStop(el.dataset.t, i); OA.toast('Added to your plan.'); } catch (e) { OA.toast('Could not add: ' + e.message); } }
      else OA.toast('The plan is not available in this build yet.');
    },
    trChoose(el) { chooseSheet(el.dataset.id); },
    trStartFill(el) {
      const t = getTrail(el.dataset.id); if (!t) return; const d = OA.$('#trdir'), m = OA.$('#trm'); if (!d || !m) return;
      const n = norm(t); m.value = isRev(t, d.value) ? Math.round(n.hi * 10) / 10 : 0;
    },
    trChooseGo(el) {
      const id = el.dataset.id, t = getTrail(id); if (!t) return;
      const mv = OA.$('#trm').value, dir = OA.$('#trdir').value, sd = OA.$('#trsd').value;
      setCurrent(id, mv === '' ? null : parseFloat(mv), dir); S().trail.startDate = /^\d{4}-\d{2}-\d{2}$/.test(sd) ? sd : null; OA.save();
      UI.open = id; UI.sec = 'here'; UI.view = 'strip'; OA.toast('Your trail is set to ' + (t.name || id) + '.'); OA.closeSheet();
    },
    trWhere() { if (!current()) { OA.toast('Choose a trail first.'); return; } OA.sheet('Where am I on the trail?', whereHtml()); },
    trNudge(el) { const c = current(); if (!c) return; const base = c.mile != null ? c.mile : 0; setCurrent(c.trail.id, Math.round((base + parseFloat(el.dataset.d)) * 10) / 10); OA.redrawSheet(whereHtml()); },
    trMileSet(el) { const c = current(); if (!c) return; const v = el.value === '' ? null : parseFloat(el.value); setCurrent(c.trail.id, v); OA.redrawSheet(whereHtml()); },
    async trGps(el) {
      const c = current(); if (!c) return; const out = OA.$('#trgpsout'); el.disabled = true; out.innerHTML = '<p class="sm"><span class="spin"></span> Getting a position…</p>';
      try {
        const f = await G.position(), r = snap(c.trail, f); el.disabled = false;
        if (!r) { out.innerHTML = '<p class="sm dim">This trail has no coordinates to match against.</p>'; return; }
        const far = r.offMi > 2, sparse = !r.dense && r.spanMi > 8;
        out.innerHTML = `<div class="alert ${far ? 'danger' : 'ok'}"><b class="t">Closest spot: mile ${fmtMile(r.mile)}</b>About ${esc(r.offMi < 0.1 ? OA.ft(r.offMi * 5280) : OA.dist(r.offMi))} from the trail line${f.acc ? ' (GPS accuracy about ' + esc(OA.ft(f.acc * 3.28084)) + ')' : ''}.${far ? '<br><b>You may be off trail or this data is sparse.</b> Check your map before relying on this mile.' : ''}${sparse ? '<br>The nearby points are far apart, so the mile is a rough estimate.' : ''}</div><button class="btn gold block" data-act="trSetSnap" data-mile="${Math.round(r.mile * 10) / 10}">Set my mile to ${fmtMile(r.mile)}</button>`;
      } catch (e) { el.disabled = false; out.innerHTML = `<p class="sm red">${esc(e.message)}</p>`; }
    },
    trSetSnap(el) { const c = current(); if (!c) return; setCurrent(c.trail.id, parseFloat(el.dataset.mile)); OA.toast('Mile updated.'); OA.closeSheet(); },
    trImport() { UI.pending = null; OA.sheet('Import a GPX trail', importSheetHtml()); },
    async trGpxFile(el) { const f = el.files && el.files[0]; if (!f) return; try { startPending(await readFileText(f), f.name); } catch (e) { OA.toast('Could not read the file: ' + e.message); } },
    trGpxPaste() { const v = OA.$('#trgpaste'); if (!v || !v.value.trim()) { const o = OA.$('#trgerr'); if (o) o.textContent = 'Paste the GPX text first.'; return; } startPending(v.value, ''); },
    trGpxUnit(el) { if (!UI.pending) return; const nm = OA.$('#trgname'); if (nm) UI.pending.name = nm.value; UI.pending.unit = el.value; OA.redrawSheet(importSheetHtml()); },
    trGpxCancel() { UI.pending = null; OA.redrawSheet(importSheetHtml()); },
    async trGpxSave(el) {
      const pe = UI.pending; if (!pe) return; const nm = OA.$('#trgname'); if (nm && nm.value.trim()) pe.name = nm.value.trim();
      const t = buildTrail(pe.par, pe.name, pe.unit); el.disabled = true;
      try { await OA.db.put('kv', { id: 'gpx:' + t.id, trail: t }); } catch (e) { el.disabled = false; OA.toast('Could not save: ' + (e && e.message || 'storage is full'), 5000); return; }
      CUSTOM[t.id] = t; const st = S().trail; st.custom.push(t.id);
      st.customList.push({ id: t.id, name: t.name, miles: t.miles, gainFt: t.gainFt, lossFt: t.lossFt, added: Date.now(), places: t.points.length - 2 });
      OA.save(); UI.pending = null; UI.open = t.id; UI.view = 'strip'; UI.sec = 'all'; OA.toast('Trail imported.'); OA.closeSheet();
    },
    async trDelete(el) {
      const id = el.dataset.id; if (!await OA.confirm('Delete this imported trail from this phone?', 'Delete')) return;
      const st = S().trail; try { await OA.db.del('kv', 'gpx:' + id); } catch (e) { }
      delete CUSTOM[id]; st.custom = st.custom.filter(x => x !== id); st.customList = st.customList.filter(r => r.id !== id);
      if (st.id === id) { st.id = null; st.mile = null; } OA.save(); UI.open = 'lib'; OA.render(); OA.toast('Deleted.');
    }
  });

  /* ---------- the tab ---------- */
  OA.tab({
    id: 'trail', label: 'Trail', icon: 'mountain', order: 20,
    render(el) {
      const st = S().trail;
      if (UI.open === undefined) UI.open = st.id && getTrail(st.id) ? st.id : 'lib';
      const t = UI.open && UI.open !== 'lib' ? getTrail(UI.open) : null;
      if (UI.open && UI.open !== 'lib' && !t) { if (!customLoaded) { el.innerHTML = OA.header('Trails') + '<div class="card"><span class="spin"></span> Loading your trail…</div>'; return; } UI.open = 'lib'; }
      el.innerHTML = t ? trailPage(t) : library();
    }
  });

  /* ---------- Today card ---------- */
  BP.todayCards.push({
    order: 20,
    render() {
      const c = current(), st = S().trail;
      if (!st.id) return `<section class="card"><div class="ct"><span>${OA.icon('mountain')} On the trail</span></div><p class="sm dim">Pick the trail you are hiking to see your next water, town and pass, even with no signal.</p><button class="btn gold block" data-go="trail">Choose a trail</button></section>`;
      if (!c) return `<section class="card"><div class="ct"><span>${OA.icon('mountain')} On the trail</span></div><p class="sm dim">${customLoaded ? 'Your trail could not be found on this phone.' : 'Loading your trail…'}</p><button class="btn block" data-go="trail">Open trails</button></section>`;
      const nxt = c.mile != null ? [['water', 'Water', 'drop'], ['town', 'Town', 'home'], ['pass', 'Pass', 'mountain']].map(d => { const r = c.next(d[0], 1)[0]; return `<div class="li" ${r && !r.point.hazard ? `data-act="trPoint" data-t="${esc(c.trail.id)}" data-i="${norm(c.trail).idx.get(r.point)}"` : ''}><span class="ic">${OA.icon(d[2])}</span><div class="tx"><b>${r ? esc(r.point.name || d[1]) : 'None listed ahead'}</b><span>${d[1]}${r ? ' · mile ' + fmtMile(r.point.mi) : ''}</span></div><div class="end">${r ? esc(OA.dist(r.distMi)) : ''}</div></div>`; }).join('') : '<p class="sm dim">Set your mile to see what is next.</p>';
      return `<section class="card hot"><div class="ct"><span>${OA.icon('mountain')} On the trail</span><span class="sm dim">${esc(DIRLAB[c.dir] || c.dir)}</span></div>
        <div class="b">${esc(c.trail.name || c.trail.id)}</div><div class="sm dim">${c.mile != null ? 'Mile ' + fmtMile(c.mile) : 'Mile not set'}</div>${nxt}
        <div class="row"><button class="btn gold" data-act="trWhere">Update my mile</button><button class="btn" data-go="trail">Open trail</button></div></section>`;
    }
  });

  OA.on('ready', loadCustom);
})();
