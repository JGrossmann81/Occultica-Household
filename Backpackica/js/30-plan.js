/* Backpackica: Plan tab. Day-by-day itinerary for a long trail.
   Part 1 (this IIFE): the pure itinerary engine, BP.plan.build(config, trail, env). No DOM, no clock, no randomness: same input gives the same plan.
   Part 2 (second IIFE): setup wizard, day list, day sheet with re-flow, resupply planner, permits and checklist, share and print, Today card.
   Mileage: the trail's own mile markers. "x" below means distance walked from the start of the plan in the direction of travel. */
window.BP = window.BP || { todayCards: [] };
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const BP = root.BP = root.BP || { todayCards: [] };
  const plan = BP.plan = BP.plan || {};

  /* ---------- small pure helpers ---------- */
  const isNum = v => typeof v === 'number' && isFinite(v);
  const r1 = v => Math.round(v * 10) / 10;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad2 = n => String(n).padStart(2, '0');
  const dkey = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const pkey = k => new Date(k + 'T12:00:00');
  const validKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(pkey(k).getTime());
  const addDays = (k, n) => { if (!validKey(k)) return null; const d = pkey(k); d.setDate(d.getDate() + n); return dkey(d); };
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* months field of a season: array of numbers or names, or text such as "Jun-Sep". Returns a Set of 1..12 or null if it cannot be read. */
  function parseMonths(m) {
    if (m == null) return null;
    const idx = s => { s = String(s).trim().toLowerCase().slice(0, 3); const i = MONTHS.indexOf(s); return i < 0 ? null : i + 1; };
    const set = new Set();
    if (Array.isArray(m)) {
      for (const it of m) { const n = isNum(it) ? it : /^\d+$/.test(String(it).trim()) ? +it : idx(it); if (!n || n < 1 || n > 12) return null; set.add(n); }
      return set.size ? set : null;
    }
    const parts = String(m).split(/[,;&]|\band\b/i);
    for (let p of parts) {
      p = p.trim(); if (!p) continue;
      const rg = p.split(/\s*(?:-|–|—|to|through|thru)\s*/i);
      const a = idx(rg[0]), b = rg.length > 1 ? idx(rg[1]) : a;
      if (!a || !b) return null;
      for (let k = a, g = 0; g < 12; g++) { set.add(k); if (k === b) break; k = k % 12 + 1; }
    }
    return set.size ? set : null;
  }

  /* ---------- config ---------- */
  const LEVELS = { first: { mpd: 12, mph: 2.0, hours: 6 }, some: { mpd: 16, mph: 2.3, hours: 7 }, exp: { mpd: 20, mph: 2.6, hours: 8 } };
  plan.LEVELS = LEVELS;
  function normConfig(c) {
    c = c || {};
    const lv = LEVELS[c.level] ? c.level : 'some', L = LEVELS[lv];
    const mph = isNum(c.mph) && c.mph > 0.5 ? clamp(c.mph, 0.8, 4) : L.mph;
    const hours = isNum(c.hours) && c.hours > 0 ? clamp(c.hours, 2, 14) : L.hours;
    const base = c.useHours ? r1(hours * mph) : (isNum(c.milesPerDay) && c.milesPerDay > 0 ? clamp(c.milesPerDay, 3, 40) : L.mpd);
    const st = c.stay || {};
    return {
      trailId: c.trailId || null,
      startMi: isNum(c.startMi) ? c.startMi : 0, endMi: isNum(c.endMi) ? c.endMi : 0,
      startDate: validKey(c.startDate) ? c.startDate : null,
      level: lv, useHours: !!c.useHours, hours, mph, base,
      ramp: c.ramp == null ? lv !== 'exp' : !!c.ramp,
      zeroEvery: isNum(c.zeroEvery) ? Math.max(0, Math.round(c.zeroEvery)) : 7,
      nero: ['none', 'leave', 'arrive', 'both'].includes(c.nero) ? c.nero : 'leave',
      stay: {
        near: st.near == null ? true : !!st.near, nearMi: isNum(st.nearMi) ? clamp(st.nearMi, 0, 30) : 5,
        laundry: st.laundry == null ? true : !!st.laundry, laundryEvery: isNum(st.laundryEvery) && st.laundryEvery > 0 ? Math.round(st.laundryEvery) : 7,
        zeroOnly: !!st.zeroOnly, rain: !!st.rain
      },
      hotelBudget: isNum(c.hotelBudget) && c.hotelBudget >= 0 ? c.hotelBudget : 100,
      maxFood: isNum(c.maxFoodDays) && c.maxFoodDays >= 2 ? c.maxFoodDays : 6,
      maxDay: isNum(c.maxDay) && c.maxDay > 0 ? c.maxDay : null,
      climbThr: isNum(c.climbThr) ? c.climbThr : 125,       // ft of climbing per planned mile before the day is shortened
      resup: c.resup && typeof c.resup === 'object' ? c.resup : {},
      edits: c.edits && typeof c.edits === 'object' ? c.edits : {}
    };
  }
  plan.normConfig = normConfig;

  /* ---------- point classification ---------- */
  const hasSvc = p => p.svc && typeof p.svc === 'object';
  function isTownPt(p) {
    if (p.kind === 'town') return true;
    if (p.kind === 'terminus' || p.kind === 'hazard' || p.kind === 'permit') return false;
    const s = hasSvc(p) ? p.svc : null; if (!s) return false;
    return !!((s.grocery && s.grocery !== 'none') || s.post || (Array.isArray(s.lodging) && s.lodging.length));
  }
  /* 0 = none or unknown, 1 = seasonal or unreliable, 2 = listed water */
  function waterOf(p) {
    const w = p.water && typeof p.water === 'object' ? p.water : null, t = w && w.type ? String(w.type) : '';
    if (/\b(dry|none|no water)\b/i.test(t)) return 0;
    if (isTownPt(p)) return 2;
    if (p.kind === 'water' || t) return (/seasonal|unreliab|intermit|cache|may be dry|tank|trough|seep/i.test(t) || /seasonal|unreliable|often dry|may be dry/i.test(w && w.note || '')) ? 1 : 2;
    return 0;
  }
  const isCampKind = p => p.kind === 'campsite' || p.kind === 'bear-box' || p.kind === 'water' || ((p.kind === 'pass' || p.kind === 'landmark') && waterOf(p) > 0);
  function stratFor(p, cfg) {
    const k = String(p.mi), o = cfg.resup[k];
    if (o === 'buy' || o === 'box' || o === 'none') return o;
    const s = hasSvc(p) ? p.svc : null;
    if (!s) return 'buy';
    if (s.resupplyBy === 'box') return 'box';
    if (s.resupplyBy === 'buy') return 'buy';
    if (s.grocery === 'full') return 'buy';
    if (s.grocery === 'none' || s.grocery === 'limited') {
      const holds = s.post || (Array.isArray(s.lodging) && s.lodging.length) || s.outfitter;
      return holds ? 'box' : 'none';
    }
    return 'buy';
  }
  const lodgingState = p => { const s = hasSvc(p) ? p.svc : null; if (!s || !Array.isArray(s.lodging)) return null; return s.lodging.length > 0; };   // null = unknown

  /* ---------- the engine ---------- */
  function build(config, trail, env) {
    env = env || {};
    const cfg = normConfig(config);
    const out = { config: cfg, days: [], summary: null, warnings: [], notes: [], ok: false, error: null };
    if (!trail || typeof trail !== 'object') { out.error = 'no-trail'; return out; }
    const inc = cfg.endMi >= cfg.startMi, total = r1(Math.abs(cfg.endMi - cfg.startMi));
    if (total < 0.5) { out.error = 'no-distance'; return out; }
    const lo = Math.min(cfg.startMi, cfg.endMi), hi = Math.max(cfg.startMi, cfg.endMi);
    const toX = mi => r1(inc ? mi - cfg.startMi : cfg.startMi - mi);
    const toMi = x => r1(inc ? cfg.startMi + x : cfg.startMi - x);
    const sunFn = env.sun || (root.OA && root.OA.geo && root.OA.geo.sun) || null;

    /* points inside the plan range, in walking order */
    const T = (trail.points || []).filter(p => p && isNum(p.mi) && p.mi >= lo - 0.001 && p.mi <= hi + 0.001).map(p => {
      const off = p.off && isNum(p.off.mi) && p.off.mi > 0 ? r1(p.off.mi) : 0;
      return { p, mi: p.mi, x: toX(p.mi), off, town: isTownPt(p), water: waterOf(p), camp: isCampKind(p), name: p.name || ('Mile ' + p.mi), lodg: lodgingState(p) };
    }).sort((a, b) => a.x - b.x);
    T.forEach(t => { t.strat = t.town ? stratFor(t.p, cfg) : null; });
    const RT = T.filter(t => t.town && t.strat !== 'none' && t.x > 0.05 && t.x < total - 0.05);
    const TW = T.filter(t => t.town && t.x > 0.05 && t.x < total - 0.05);
    const nextRTAfter = x => RT.find(t => t.x > x + 0.05) || null;
    const nextTownAfter = x => TW.find(t => t.x > x + 0.05 && (t.lodg !== false || t.strat !== 'none')) || null;
    const nm = v => v == null ? null : typeof v === 'string' ? v : (v && typeof v.name === 'string' ? v.name : null);
    const trailStartName = nm(trail.start), trailEndName = nm(trail.end);
    const termName = mi => (Math.abs(mi) < 0.05 ? trailStartName : isNum(trail.miles) && Math.abs(mi - trail.miles) < 0.05 ? trailEndName : null);
    const nameAt = x => {
      let best = null; for (const t of T) { if (t.x <= x + 0.05) best = t; else break; }
      if (best && Math.abs(best.x - x) <= 0.05) return best.name;
      return termName(toMi(x)) || ('Mile ' + toMi(x));
    };

    /* elevation: BP.trail.elevBetween when present, else the elevations listed on points (net, so a floor) */
    const elevPts = T.filter(t => isNum(t.p.elev));
    let elevSource = null;
    function elevAtX(x) {
      if (!elevPts.length) return null;
      if (x <= elevPts[0].x) return elevPts[0].p.elev; if (x >= elevPts[elevPts.length - 1].x) return elevPts[elevPts.length - 1].p.elev;
      for (let i = 1; i < elevPts.length; i++) if (elevPts[i].x >= x) { const a = elevPts[i - 1], b = elevPts[i]; const f = (x - a.x) / ((b.x - a.x) || 1); return a.p.elev + (b.p.elev - a.p.elev) * f; }
      return null;
    }
    function elev(xa, xb) {
      xb = Math.min(xb, total);
      const fn = env.elevBetween;
      if (typeof fn === 'function') {
        try {
          const a = toMi(xa), b = toMi(xb), r = a <= b ? fn(a, b) : fn(b, a);
          if (r && isNum(r.gainFt) && isNum(r.lossFt)) { elevSource = elevSource || 'trail'; return a <= b ? { gain: r.gainFt, loss: r.lossFt } : { gain: r.lossFt, loss: r.gainFt }; }
        } catch (e) { /* fall through */ }
      }
      if (elevPts.length < 2) return null;
      elevSource = elevSource || 'points';
      let prev = elevAtX(xa), gain = 0, loss = 0;
      const pts = [xa].concat(elevPts.filter(t => t.x > xa && t.x < xb).map(t => t.x), [xb]);
      for (let i = 1; i < pts.length; i++) { const e = elevAtX(pts[i]); if (e == null || prev == null) { prev = e; continue; } if (e > prev) gain += e - prev; else loss += prev - e; prev = e; }
      return { gain: Math.round(gain), loss: Math.round(loss) };
    }

    /* ----- walk ----- */
    const days = [], notes = out.notes;
    let x = 0, n = 0, back = 0, sinceRest = 0, nightsNoHotel = 0, wantRest = false, leftTown = false, guard = 0;
    let ignoredEdits = 0;
    while (x < total - 0.04 && guard++ < 3000) {
      n++;
      const ed = cfg.edits[n] || null;
      const ramp = cfg.ramp ? Math.min(1, 0.65 + 0.35 * (n - 1) / 13) : 1;
      let tgt0 = cfg.base * ramp, neroOut = false;
      if ((cfg.nero === 'leave' || cfg.nero === 'both') && leftTown) { tgt0 *= 0.6; neroOut = true; }
      tgt0 = Math.max(tgt0, 3);
      let tgt = tgt0;
      for (let k = 0; k < 3; k++) {
        const g = elev(x, x + tgt); if (!g) break;
        const adj = clamp((g.gain - cfg.climbThr * tgt) / 700, 0, tgt0 * 0.3);
        tgt = Math.max(tgt0 - adj, Math.min(tgt0, 3));
      }
      tgt = r1(tgt);
      let maxWalk = Math.max(tgt * 1.3, tgt + 2.5); if (cfg.maxDay) maxWalk = Math.max(tgt, Math.min(maxWalk, cfg.maxDay));
      maxWalk = r1(maxWalk);

      const remaining = total - x;
      let end = null, why = [], forced = false, edited = false, nearOk = false, laundryOk = false, restOk = false;

      /* a manual edit of this day's end point */
      if (ed && isNum(ed.endMi)) {
        const ex = toX(ed.endMi);
        if (ex > x + 0.05 && ex <= total + 0.001) {
          const hit = T.find(t => Math.abs(t.x - ex) <= 0.06);
          end = hit ? { t: hit, x: hit.x } : { t: null, x: Math.min(ex, total) };
          edited = true; forced = true;
        } else ignoredEdits++;
      }
      if (!end && remaining + back <= maxWalk * 0.97) end = { t: null, x: total, finish: true };
      if (!end) {
        const win = T.filter(t => t.x > x + 0.05 && t.x < total - 0.04 && t.kind !== 'hazard' && t.p.kind !== 'hazard' && t.p.kind !== 'permit');
        win.forEach(t => { t.walk = r1((t.x - x) + back + t.off); });
        const minTown = Math.max(0.5 * tgt, 3);
        /* 1. towns */
        let best = null;
        for (const t of win) {
          if (!t.town || t.walk < minTown || t.walk > maxWalk) continue;
          const isRT = t.strat !== 'none', reasons = [];
          if (isRT) { const nx = nextRTAfter(t.x); if (((nx ? nx.x : total) - x) / cfg.base > cfg.maxFood) reasons.push('resupply'); }
          if (wantRest && (t.lodg !== false || isRT)) reasons.push('rest');
          const usable = t.lodg !== false || isRT;
          if (!cfg.stay.zeroOnly) {
            if (cfg.stay.near && usable && Math.abs(t.walk - tgt) <= cfg.stay.nearMi) reasons.push('near');
            if (cfg.stay.laundry && usable && nightsNoHotel >= cfg.stay.laundryEvery && t.walk <= tgt + Math.max(cfg.stay.nearMi, tgt * 0.25)) reasons.push('laundry');
          }
          if (!reasons.length) continue;
          const f = reasons.includes('resupply') || reasons.includes('rest');
          const score = Math.abs(t.walk - tgt) - (f ? 100 : 0);
          if (!best || score < best.score) best = { t, score, reasons };
        }
        if (best) { end = { t: best.t, x: best.t.x }; why = best.reasons; nearOk = why.includes('near'); laundryOk = why.includes('laundry'); restOk = why.includes('rest'); }
        /* 2. camps at water */
        if (!end) {
          let cb = null;
          for (const t of win) {
            if (t.town || !t.camp || t.walk < Math.max(0.6 * tgt, 2) || t.walk > maxWalk) continue;
            let cost = t.walk < tgt ? (tgt - t.walk) * 0.8 : (t.walk - tgt) * 1.2;
            if (t.water === 0) cost += 4; else if (t.water === 1) cost += 1.5;
            if (t.p.kind === 'campsite' || t.p.kind === 'bear-box') cost -= 0.5;
            if (!cb || cost < cb.cost) cb = { t, cost };
          }
          if (cb) end = { t: cb.t, x: cb.t.x };
          else {
            /* nothing listed in reach: stop at the target distance and say so */
            const ex = r1(Math.min(total, x + Math.max(1, tgt - back)));
            end = { t: null, x: ex, generic: true };
            const hit = T.find(t => Math.abs(t.x - ex) <= 0.06 && t.p.kind !== 'hazard' && t.p.kind !== 'permit'); if (hit) { end = { t: hit, x: hit.x }; }
          }
        }
        /* do not leave a sliver for the last day if one slightly longer day finishes */
        if (end.x < total - 0.04) {
          const rem2 = total - end.x, walkNow = (end.x - x) + back + (end.t ? end.t.off : 0);
          if (rem2 < 0.3 * tgt && walkNow + rem2 <= maxWalk && !(end.t && end.t.town)) end = { t: null, x: total, finish: true, merged: true };
        }
      }
      const fin = end.x >= total - 0.04;
      if (fin) end.x = total;
      const et = end.t, town = !!(et && et.town) && !fin, off = town ? et.off : 0;
      const trailMiles = r1(end.x - x), walk = r1(trailMiles + back + off);
      const g = elev(x, end.x);

      /* hotel and zero-day decisions */
      let hotel = false, zeroAfter = false, lodg = town ? et.lodg : null;
      if (town) {
        if (ed && typeof ed.hotel === 'boolean') hotel = ed.hotel;
        else hotel = edited ? (lodg === true && !cfg.stay.zeroOnly) : (lodg === true && (nearOk || laundryOk));
      }
      if (!fin) {
        const sr = sinceRest + 1;
        if (ed && typeof ed.zeroAfter === 'boolean') zeroAfter = ed.zeroAfter;
        else if (cfg.zeroEvery > 0 && sr >= cfg.zeroEvery && total - end.x >= 2 * cfg.base) {
          if (town && (lodg !== false || et.strat !== 'none')) zeroAfter = true;
          else if (!town) {
            const nt = nextTownAfter(end.x), dist = nt ? nt.x - end.x : Infinity;
            if (sr < cfg.zeroEvery + 3 && dist <= 2.2 * cfg.base) wantRest = true;
            else if ((et && et.water > 0) || sr >= cfg.zeroEvery + 5) zeroAfter = true;
          }
        }
        if (zeroAfter && town && lodg === true && !(ed && typeof ed.hotel === 'boolean')) hotel = true;
      }
      const neroIn = (cfg.nero === 'arrive' || cfg.nero === 'both') && town && hotel && walk <= 0.65 * tgt0;
      const neroTag = !!(ed && ed.nero === true) || neroOut || neroIn;

      const d = {
        n, kind: 'hike', fromX: x, toX: end.x, fromMi: toMi(x), toMi: toMi(end.x),
        fromName: n === 1 ? nameAt(0) : days[days.length - 1].toName, toName: fin ? (termName(toMi(end.x)) || (et ? et.name : 'Mile ' + toMi(end.x))) : et ? et.name : 'Mile ' + toMi(end.x),
        trailMiles, detourIn: r1(back), detourOut: r1(off), miles: walk, target: tgt, maxWalk, gainFt: g ? Math.round(g.gain) : null, lossFt: g ? Math.round(g.loss) : null,
        camp: fin ? null : town ? null : { name: et ? et.name : 'Mile ' + toMi(end.x) + ' (no listed camp)', mi: toMi(end.x), kind: et ? et.p.kind : 'generic', water: et ? et.water : 0, listed: !!et, waterType: et && et.p.water ? et.p.water.type || null : null },
        town: town ? { name: et.name, mi: et.mi, off: et.off, svc: et.p.svc || null, phone: et.p.phone || null, url: et.p.url || null, lodging: lodg, point: et.p } : null,
        finish: fin, hotel, zero: false, nero: neroTag, neroOut, edited, forced: forced || false, why,
        rainHotel: !!(town && !hotel && lodg !== false && cfg.stay.rain),
        resupply: null, warnings: [], tags: []
      };
      d.stay = fin ? 'finish' : town ? (hotel ? 'hotel' : 'town') : 'camp';
      days.push(d);
      back = town ? off : 0;
      x = end.x;
      sinceRest++;
      if (hotel) nightsNoHotel = 0; else nightsNoHotel++;
      leftTown = town && hotel;
      if (zeroAfter) {
        n++;
        const z = {
          n, kind: 'zero', fromX: x, toX: x, fromMi: toMi(x), toMi: toMi(x), fromName: d.toName, toName: d.toName, trailMiles: 0, detourIn: 0, detourOut: 0, miles: 0, target: 0, gainFt: 0, lossFt: 0,
          camp: d.camp, town: d.town, finish: false, hotel: !!(d.town && d.town.lodging === true), zero: true, nero: false, neroOut: false, edited: false, forced: false, why: ['zero'],
          rainHotel: false, resupply: null, warnings: [], tags: [], stay: d.town ? (d.town.lodging === true ? 'hotel' : 'town') : 'camp', after: d.n
        };
        if (ed && typeof ed.hotel === 'boolean' && d.town) z.hotel = ed.hotel;
        days.push(z);
        sinceRest = 0; wantRest = false; if (z.hotel) nightsNoHotel = 0; else nightsNoHotel++;
        leftTown = !!(d.town);
      }
    }
    if (ignoredEdits) notes.push(ignoredEdits + ' manual change' + (ignoredEdits > 1 ? 's' : '') + ' no longer fit the route and were ignored.');
    if (guard >= 3000) out.error = 'runaway';

    /* ----- dates ----- */
    days.forEach(d => { d.date = cfg.startDate ? addDays(cfg.startDate, d.n - 1) : null; });

    /* ----- resupply stops and food days ----- */
    const stops = [];
    days.forEach((d, i) => {
      if (d.kind === 'hike' && d.town) {
        const t = T.find(q => q.p === d.town.point), strat = t ? t.strat : 'buy';
        d.resupply = { strategy: strat, mi: d.town.mi, name: d.town.name, foodDays: 0, spare: 1, shipBy: null, arrive: d.date, nextName: null, nextMi: null };
        if (strat !== 'none') stops.push(i);
      }
    });
    const lastIdx = days.length - 1;
    const stayEnd = i => { let j = i; while (days[j + 1] && days[j + 1].kind === 'zero') j++; return j; };
    const startFoodDays = stops.length ? stops[0] + 1 : days.length;
    out.startFood = { days: startFoodDays, toName: stops.length ? days[stops[0]].resupply.name : 'the finish' };
    stops.forEach((si, k) => {
      const r = days[si].resupply, from = stayEnd(si), toI = k + 1 < stops.length ? stops[k + 1] : lastIdx;
      r.foodDays = toI - from;
      r.nextName = k + 1 < stops.length ? days[toI].resupply.name : 'the finish';
      r.nextMi = k + 1 < stops.length ? days[toI].resupply.mi : toMi(total);
      r.shipBy = r.strategy === 'box' && days[si].date ? addDays(days[si].date, -7) : null;
    });
    days.forEach((d, i) => { const nx = stops.find(s => s >= i); d.foodLeft = (nx != null ? nx : lastIdx) - i + 1; });

    /* ----- water ----- */
    const WS = T.filter(t => t.water > 0);
    const mph = cfg.mph;
    if (WS.length >= 2) {
      const legs = []; for (let i = 0; i + 1 < WS.length; i++) if (WS[i + 1].x > WS[i].x + 0.05) legs.push({ a: WS[i], b: WS[i + 1] });
      days.forEach(d => {
        if (d.kind !== 'hike') return;
        const mine = legs.filter(L => L.a.x >= d.fromX - 0.05 && L.a.x < d.toX - 0.05);
        let worst = null;
        mine.forEach(L => {
          const gap = L.b.x - L.a.x, dryNight = d.toX > L.a.x && d.toX < L.b.x - 0.05 && !d.finish && !(d.camp && d.camp.water > 0);
          const need = 0.5 * (gap / mph) + (dryNight ? 1.5 : 0);
          if (!worst || need > worst.need) worst = { need, gap, L, dryNight };
        });
        if (worst) d.water = { carryL: Math.ceil(worst.need * 2) / 2, gapMi: r1(worst.gap), fromName: worst.L.a.name, fromMi: worst.L.a.mi, toName: worst.L.b.name, toMi: worst.L.b.mi, dryNight: worst.dryNight, unreliable: worst.L.a.water === 1 || worst.L.b.water === 1 };
        const prev = WS.filter(t => t.x <= d.fromX + 0.05).pop(), atStart = prev && Math.abs(prev.x - d.fromX) <= 0.05;
        if (!atStart && d.n > 1) {
          const nx = WS.find(t => t.x > d.fromX + 0.05);
          d.waterStartDry = nx ? { toName: nx.name, toMi: nx.mi, miles: r1(nx.x - d.fromX) } : null;
        }
      });
    } else out.notes.push('Few water sources are listed for this route, so water carries are not calculated. Check water reports and your map.');

    /* ----- sunrise and sunset along the way ----- */
    const geo = T.filter(t => isNum(t.p.lat) && isNum(t.p.lon));
    const latlonAt = x => {
      if (!geo.length) return null; if (geo.length === 1 || x <= geo[0].x) return { lat: geo[0].p.lat, lon: geo[0].p.lon };
      for (let i = 1; i < geo.length; i++) if (geo[i].x >= x) { const a = geo[i - 1], b = geo[i], f = (x - a.x) / ((b.x - a.x) || 1); return { lat: a.p.lat + (b.p.lat - a.p.lat) * f, lon: a.p.lon + (b.p.lon - a.p.lon) * f }; }
      const l = geo[geo.length - 1]; return { lat: l.p.lat, lon: l.p.lon };
    };
    days.forEach(d => {
      d.sun = null; if (!sunFn || !d.date) return;
      const ll = latlonAt((d.fromX + d.toX) / 2); if (!ll) return;
      try { const s = sunFn(ll.lat, ll.lon, new Date(d.date + 'T12:00:00')); if (s) d.sun = { rise: s.rise ? s.rise.getTime() : null, set: s.set ? s.set.getTime() : null, hours: isNum(s.dayHours) ? s.dayHours : null, dawn: s.civilDawn ? s.civilDawn.getTime() : null, dusk: s.civilDusk ? s.civilDusk.getTime() : null }; } catch (e) { d.sun = null; }
    });

    /* ----- hazards, permit points ----- */
    const hz = (trail.hazards || []).filter(h => h && isNum(h.fromMi));
    const pp = T.filter(t => t.p.kind === 'permit');
    days.forEach(d => {
      const a = Math.min(d.fromMi, d.toMi), b = Math.max(d.fromMi, d.toMi);
      d.hazards = d.kind === 'zero' ? [] : hz.filter(h => { const f = h.fromMi, t = isNum(h.toMi) ? h.toMi : h.fromMi; return Math.min(f, t) <= b && Math.max(f, t) >= a; }).map(h => ({ id: h.id || null, title: h.title || 'Hazard', note: h.note || '', fromMi: h.fromMi, toMi: isNum(h.toMi) ? h.toMi : h.fromMi }));
      d.permits = d.kind === 'zero' ? [] : pp.filter(t => (t.x > d.fromX + 0.05 || (d.n === 1 && t.x >= d.fromX - 0.05)) && t.x <= d.toX + 0.05).map(t => ({ name: t.name, mi: t.mi, note: t.p.note || '' }));
    });

    /* ----- warnings ----- */
    const level = cfg.level;
    days.forEach(d => {
      const W = d.warnings, add = (code, lv, text) => W.push({ code, level: lv, text });
      if (d.kind === 'hike') {
        if (level === 'first' && d.miles >= 20) add('long-beginner', 'r', 'A ' + r1(d.miles) + ' mile day is a lot for a first long hike.');
        else if (d.miles > d.maxWalk + 0.05 && !d.edited) add('long-day', 'w', 'Longer than your usual limit for this day.');
        if (d.edited && d.miles > Math.max(d.maxWalk, cfg.base * 1.3)) add('long-edit', 'w', 'Longer than your planned pace.');
        d.hazards.forEach(h => add('hazard', 'w', h.title + (isNum(h.fromMi) ? ' (mile ' + h.fromMi + (h.toMi !== h.fromMi ? ' to ' + h.toMi : '') + ')' : '')));
        d.permits.forEach(p => add('permit', 'w', 'Permit point: ' + p.name));
        if (d.water && d.water.carryL >= 3) add('water', d.water.carryL >= 5 ? 'r' : 'w', 'Long carry: about ' + d.water.carryL + ' L from ' + d.water.fromName);
        if (d.sun && d.sun.hours != null) {
          const need = d.miles / mph;
          if (need > d.sun.hours) add('daylight', 'r', 'About ' + r1(need) + ' h of walking but only ' + r1(d.sun.hours) + ' h of daylight.');
          else if (need > d.sun.hours - 1.5) add('daylight', 'w', 'Tight daylight: ' + r1(need) + ' h of walking, ' + r1(d.sun.hours) + ' h of daylight.');
        }
        if (d.camp && d.camp.water === 0 && !d.finish) add('dry-camp', 'w', d.camp.listed ? 'No water listed at this camp.' : 'No camp or water is listed here: choose a site from your map.');
        if (d.camp && d.camp.water === 1) add('water-unreliable', 'w', 'Water here may be seasonal: check recent reports.');
        if (d.town && d.town.lodging === null) add('lodging-unknown', 'i', 'Lodging is not listed for this town: check before you count on a room.');
      }
      if (d.resupply && d.resupply.foodDays > 7) add('food', 'r', d.resupply.foodDays + ' days of food to the next resupply.');
      if (d.resupply && d.resupply.strategy === 'box' && d.resupply.shipBy && cfg.startDate && d.resupply.shipBy < cfg.startDate) add('ship', 'i', 'Ship this box before you leave home.');
    });
    if (stops.length === 0 && days.length > 7) out.warnings.push({ code: 'food', level: 'r', text: 'No resupply stops are planned, so this is ' + days.length + ' days of food in one carry.' });
    else if (out.startFood.days > 7) out.warnings.push({ code: 'food', level: 'r', text: out.startFood.days + ' days of food before the first resupply (' + out.startFood.toName + ').' });
    const maxFoodGap = Math.max(0, ...stops.map(i => days[i].resupply.foodDays));
    if (maxFoodGap > 7) out.warnings.push({ code: 'food', level: 'r', text: 'The longest stretch between resupplies is ' + maxFoodGap + ' days of food.' });

    /* ----- seasons ----- */
    const sc = { startMonth: [], finishMonth: [], uncovered: [], readable: false };
    if (cfg.startDate && days.length && Array.isArray(trail.seasons) && trail.seasons.length) {
      const parsed = trail.seasons.map(s => ({ s, m: parseMonths(s && s.months) }));
      sc.readable = parsed.some(q => q.m);
      const months = []; for (const d of days) { const m = pkey(d.date).getMonth() + 1; if (!months.includes(m)) months.push(m); }
      const cover = m => parsed.filter(q => q.m && q.m.has(m)).map(q => ({ label: q.s.label || '', note: q.s.note || '' }));
      sc.startMonth = cover(months[0]); sc.finishMonth = cover(months[months.length - 1]);
      sc.months = months.map(m => ({ m, name: MONTH_NAMES[m - 1], seasons: cover(m) }));
      if (sc.readable) {
        sc.uncovered = months.filter(m => !cover(m).length).map(m => MONTH_NAMES[m - 1]);
        if (sc.uncovered.length) out.warnings.push({ code: 'season', level: 'w', text: 'No season in the trail data covers ' + sc.uncovered.join(', ') + '. Check typical conditions for those months before you commit.' });
      } else out.notes.push('Season windows are listed for this trail but could not be matched to your dates. Read them under Permits and checklist.');
    }
    out.seasonCheck = sc;
    if (!cfg.startDate) out.warnings.push({ code: 'date', level: 'w', text: 'No start date yet: dates, daylight and season checks need one.' });

    /* ----- summary ----- */
    const hikes = days.filter(d => d.kind === 'hike');
    out.days = days;
    out.elevSource = elevSource;
    out.summary = {
      totalDays: days.length, hikingDays: hikes.length, zeroDays: days.filter(d => d.zero).length, neroDays: hikes.filter(d => d.nero).length,
      hotelNights: days.filter(d => d.hotel && !d.finish).length, miles: r1(OA_sum(hikes, d => d.miles)), trailMiles: total,
      gainFt: hikes.every(d => d.gainFt != null) ? OA_sum(hikes, d => d.gainFt) : null,
      finishDate: days.length ? days[days.length - 1].date : null, startDate: cfg.startDate,
      resupplyStops: stops.length, boxStops: stops.filter(i => days[i].resupply.strategy === 'box').length,
      buyFoodDays: OA_sum(stops.filter(i => days[i].resupply.strategy === 'buy'), i => days[i].resupply.foodDays) + (out.startFood ? 0 : 0),
      hotelCost: 0, maxFoodGap, maxMiles: hikes.length ? Math.max(...hikes.map(d => d.miles)) : 0
    };
    out.summary.hotelCost = Math.round(out.summary.hotelNights * cfg.hotelBudget);
    out.ok = !out.error;
    return out;
  }
  function OA_sum(a, f) { return a.reduce((s, x) => s + f(x), 0); }
  plan.build = build;
  plan.parseMonths = parseMonths;
  plan.waterOf = waterOf; plan.isTownPt = isTownPt; plan.stratFor = stratFor;
  plan._u = { addDays, validKey, r1, MONTH_NAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = plan;
})();

/* ================= Part 2: the Plan tab ================= */
(function () {
  'use strict';
  if (typeof OA === 'undefined' || !OA.tab) return;
  const esc = OA.esc, BP = window.BP, P = BP.plan, S = () => OA.S, PL = () => OA.S.plan;
  BP.todayCards = BP.todayCards || [];
  const CHECK = 'check with the source';
  OA.defaults({
    plan: {
      built: false, edits: {}, check: {}, view: 'days', page: null, leave: { contact: '', checkin: '', overdue: '' },
      setup: {
        trailId: null, rev: false, startMi: null, endMi: null, startDate: null, level: 'some', milesPerDay: 16, useHours: false, hours: 7, mph: 2.3, ramp: true,
        zeroEvery: 7, nero: 'leave', stay: { near: true, nearMi: 5, laundry: true, laundryEvery: 7, zeroOnly: false, rain: false },
        hotelBudget: 100, maxFoodDays: 6, resup: {}
      }
    }
  });

  /* ---------- helpers ---------- */
  const num = v => typeof v === 'number' && isFinite(v);
  const safeUrl = u => (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : '';
  const link = (u, label) => safeUrl(u) ? `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(label || u)}</a>` : '';
  const mileTxt = m => num(m) ? String(Math.round(m * 10) / 10) : '–';
  const fdate = (k, long) => k ? OA.fmtDate(k, long ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : undefined) : 'no date';
  const OPP = { NOBO: 'SOBO', SOBO: 'NOBO', EB: 'WB', WB: 'EB', CW: 'CCW', CCW: 'CW', FWD: 'REV', REV: 'FWD' };
  const DIRLAB = { NOBO: 'Northbound', SOBO: 'Southbound', EB: 'Eastbound', WB: 'Westbound', CW: 'Clockwise', CCW: 'Counter-clockwise', FWD: 'Forward', REV: 'Reverse' };
  const fwdDir = t => { const m = String(t && t.dir || '').toUpperCase().match(/NOBO|SOBO|CCW|CW|EB|WB|FWD|REV/); return m ? m[0] : 'NOBO'; };
  const dirName = (t, rev) => { const f = fwdDir(t); return DIRLAB[rev ? OPP[f] : f] || 'Forward'; };
  function trailList() {
    let l = []; try { l = BP.trail && BP.trail.list ? BP.trail.list() : Object.values(window.TRAILS || {}); } catch (e) { l = Object.values(window.TRAILS || {}); }
    return (l || []).filter(t => t && t.id && !t.stub);
  }
  function trailGet(id) {
    if (!id) return null;
    try { const t = BP.trail && BP.trail.get ? BP.trail.get(id) : null; if (t) return t; } catch (e) { }
    return (window.TRAILS && window.TRAILS[id]) || null;
  }
  const trailMiles = t => num(t.miles) ? t.miles : Math.max(0, ...(t.points || []).filter(p => num(p.mi)).map(p => p.mi));
  const pop = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

  /* ---------- plan cache ---------- */
  let cache = { key: '', plan: null };
  function elevEnv(t) {
    try { const c = BP.trail && BP.trail.current && BP.trail.current(); if (c && c.trail && c.trail.id === t.id && typeof BP.trail.elevBetween === 'function') return { elevBetween: (a, b) => BP.trail.elevBetween(a, b) }; } catch (e) { }
    return {};
  }
  function getPlan() {
    const p = PL(); if (!p.built) return null;
    const t = trailGet(p.setup.trailId); if (!t || !Array.isArray(t.points)) return null;
    const env = elevEnv(t), key = JSON.stringify([p.setup, p.edits, t.id, t.points.length, !!env.elevBetween]);
    if (cache.key === key) return cache.plan;
    const cfg = Object.assign({}, p.setup, { edits: p.edits, maxFoodDays: p.setup.maxFoodDays });
    let r = null; try { r = P.build(cfg, t, env); } catch (e) { console.error('plan build', e); r = null; }
    cache = { key, plan: r }; return r;
  }
  const dropAfter = n => { const e = PL().edits; Object.keys(e).forEach(k => { if (+k > n) delete e[k]; }); };

  /* ---------- public API ---------- */
  P.current = () => getPlan();
  P.days = () => { const r = getPlan(); return r ? r.days : []; };
  P.summary = () => { const r = getPlan(); return r ? r.summary : null; };
  P.trail = () => { const t = trailGet(PL().setup.trailId); return t; };
  function todayN(r) { if (!r || !r.config.startDate) return null; return OA.daysBetween(r.config.startDate, OA.dkey()) + 1; }
  P.todayN = () => todayN(getPlan());
  P.nextTown = () => {
    const r = getPlan(); if (!r) return null; const tn = todayN(r) || 1;
    const d = r.days.find(x => x.kind === 'hike' && x.town && x.n >= Math.max(1, tn));
    return d ? { name: d.town.name, mi: d.town.mi, date: d.date } : null;
  };
  const dayLine = d => {
    if (d.kind === 'zero') return `Day ${d.n}${d.date ? ' ' + fdate(d.date) : ''}: zero day in ${d.town ? d.town.name : (d.camp ? d.camp.name : 'camp')}`;
    return `Day ${d.n}${d.date ? ' ' + fdate(d.date) : ''}: mile ${mileTxt(d.fromMi)} to ${mileTxt(d.toMi)} (${OA.dist(d.miles)}), ${d.finish ? 'finish at ' + d.toName : d.town ? d.town.name + (d.hotel ? ' (hotel)' : ' (town)') : 'camp at ' + (d.camp ? d.camp.name : d.toName)}`;
  };
  P.summaryText = () => {
    const r = getPlan(), t = P.trail(); if (!r || !t) return 'No plan yet.';
    const c = r.config, s = r.summary, L = [];
    L.push(`My plan: ${t.name || t.id}, mile ${mileTxt(c.startMi)} to ${mileTxt(c.endMi)} (${dirName(t, PL().setup.rev)})`);
    L.push(`Start ${fdate(s.startDate, true)} · finish ${fdate(s.finishDate, true)} · ${s.totalDays} days (${s.zeroDays} zero) · ${OA.dist(s.miles, 0)}`);
    const stops = r.days.filter(d => d.kind === 'hike' && d.town);
    if (stops.length) { L.push('', 'Town stops:'); stops.forEach(d => L.push(`- ${d.town.name}, mile ${mileTxt(d.town.mi)}: ${fdate(d.date)}${d.resupply && d.resupply.strategy !== 'none' ? ' (resupply: ' + d.resupply.strategy + ')' : ''}${d.hotel ? ', hotel' : ''}`)); }
    L.push('', 'Day by day:'); r.days.forEach(d => L.push(dayLine(d)));
    L.push('', 'This is a plan, not a promise: weather, injuries and closures change it. I will update it when I can.');
    return L.join('\n');
  };
  P.leaveText = () => {
    const r = getPlan(), t = P.trail(); if (!r || !t) return 'No plan yet.';
    const c = r.config, s = r.summary, lv = PL().leave, L = [];
    L.push(`LEAVE-BEHIND PLAN: ${t.name || t.id}`, '');
    L.push(`Route: mile ${mileTxt(c.startMi)} (${r.days[0] ? r.days[0].fromName : 'start'}) to mile ${mileTxt(c.endMi)} (${r.days.length ? r.days[r.days.length - 1].toName : 'finish'}), ${dirName(t, PL().setup.rev)}`);
    L.push(`Dates: start ${fdate(s.startDate, true)}, planned finish ${fdate(s.finishDate, true)} (${s.totalDays} days)`);
    L.push('Group: [add who is hiking with me]');
    const stops = r.days.filter(d => d.kind === 'hike' && d.town);
    if (stops.length) { L.push('', 'Planned town stops (dates can slip a day or two):'); stops.forEach(d => L.push(`- ${d.town.name} (mile ${mileTxt(d.town.mi)}): ${fdate(d.date)}`)); }
    L.push('', 'Contact plan:');
    L.push(`- Emergency contact: ${lv.contact || '[name and phone]'}`);
    L.push(`- Check-ins: ${lv.checkin || '[for example: a text from each town stop; no signal on the trail]'}`);
    L.push(`- If I am overdue: ${lv.overdue || '[for example: if no word 2 days after my planned finish, call the local sheriff / land agency with this plan]'}`);
    L.push('', 'I will have little or no cell signal between towns. Silence between towns is normal; silence past the dates above is not.');
    return L.join('\n');
  };

  /* ---------- tags and short labels ---------- */
  function shortOf(w) {
    switch (w.code) {
      case 'hazard': return w.text.replace(/\s*\(mile.*$/, '');
      case 'permit': return 'Permit point'; case 'water': return w.text.replace(/^Long carry: about /, 'Carry ').replace(/ from .*/, '');
      case 'daylight': return 'Daylight'; case 'food': return 'Food'; case 'long-beginner': case 'long-day': case 'long-edit': return 'Long day';
      case 'dry-camp': return 'Dry camp'; case 'water-unreliable': return 'Water?'; case 'lodging-unknown': return 'Lodging?'; case 'ship': return 'Ship box'; default: return w.text.slice(0, 22);
    }
  }
  const wcls = lv => lv === 'r' ? 'r' : lv === 'w' ? 'w' : '';
  function dayTags(d) {
    const t = [];
    if (d.zero) t.push('<span class="tag g">Zero day</span>');
    if (d.nero) t.push('<span class="tag">Nero</span>');
    if (d.hotel && !d.zero) t.push('<span class="tag g">Hotel</span>');
    else if (d.town && !d.finish && !d.zero) t.push('<span class="tag">Town</span>');
    if (d.resupply && d.resupply.strategy !== 'none') t.push(`<span class="tag a">Resupply: ${d.resupply.strategy === 'box' ? 'box' : 'buy'}</span>`);
    if (d.edited) t.push('<span class="tag a">Edited</span>');
    const ws = d.warnings.slice().sort((a, b) => 'rwi'.indexOf(a.level) - 'rwi'.indexOf(b.level));
    ws.slice(0, 3).forEach(w => t.push(`<span class="tag ${wcls(w.level)}">${esc(shortOf(w))}</span>`));
    if (ws.length > 3) t.push(`<span class="tag">+${ws.length - 3}</span>`);
    return t.join('');
  }

  /* ================= SETUP WIZARD ================= */
  let wiz = 0;
  const STEPS = ['Trail and dates', 'Pace', 'Rest and towns', 'Resupply'];
  function setupDefaults() {
    const s = PL().setup, t = trailGet(s.trailId);
    if (!t) return;
    const m = trailMiles(t);
    if (!num(s.startMi) || !num(s.endMi) || (s.startMi === s.endMi)) { s.startMi = s.rev ? m : 0; s.endMi = s.rev ? 0 : m; }
  }
  function openWizard() {
    const s = PL().setup, tr = S().trail || {};
    if (!s.trailId || !trailGet(s.trailId)) { const l = trailList(); s.trailId = (tr.id && trailGet(tr.id) && tr.id) || (l[0] && l[0].id) || null; s.startMi = null; s.endMi = null; }
    if (!s.startDate) s.startDate = tr.startDate || OA.addDays(OA.dkey(), 14);
    setupDefaults(); wiz = 0; OA.save();
    OA.sheet('Plan my trip', wizHtml());
  }
  function levelChips() {
    const L = PL().setup.level;
    return `<div class="chips wrap">${[['first', 'First long hike'], ['some', 'Some experience'], ['exp', 'Experienced']].map(([v, l]) => `<button class="chip ${L === v ? 'on' : ''}" data-act="plLevel" data-v="${v}">${l}</button>`).join('')}</div>`;
  }
  function wizHtml() {
    const s = PL().setup, t = trailGet(s.trailId), nav = (last) => `<div class="row"><button class="btn" data-act="plWizBack" ${wiz === 0 ? 'disabled' : ''}>Back</button><button class="btn gold" data-act="${last ? 'plWizDone' : 'plWizNext'}" ${wiz === 0 && !t ? 'disabled' : ''}>${last ? 'Build my plan' : 'Next'}</button></div><p class="xs dim center" style="margin-top:10px">Every setting can be changed later. Skip what you do not know: the defaults are reasonable.</p>`;
    const head = `<div class="xs dim" style="margin-bottom:4px">Step ${wiz + 1} of ${STEPS.length}</div><h2 class="big" style="margin-top:0">${esc(STEPS[wiz])}</h2>`;
    let b = '';
    if (wiz === 0) {
      const list = trailList();
      if (!list.length) return head + `<div class="alert"><b class="t">No trail data</b>No trail is installed in this copy of the app yet. Import a GPX route in the Trail tab, or update the app.</div>`;
      const m = t ? trailMiles(t) : 0, tot = Math.abs((s.endMi || 0) - (s.startMi || 0));
      b = `<label class="fl">Trail<select class="in" data-bind="plan.setup.trailId" data-then="plTrailChanged">${list.map(x => `<option value="${esc(x.id)}" ${x.id === s.trailId ? 'selected' : ''}>${esc(x.name || x.id)}</option>`).join('')}</select></label>
        <div class="chips wrap"><button class="chip ${!s.rev ? 'on' : ''}" data-act="plDir" data-v="0">${esc(t ? dirName(t, false) : 'Usual direction')}</button><button class="chip ${s.rev ? 'on' : ''}" data-act="plDir" data-v="1">${esc(t ? dirName(t, true) : 'Reverse')}</button></div>
        <div class="two"><label class="fl">Start at mile<input class="in" type="number" step="0.1" inputmode="decimal" data-bind="plan.setup.startMi" data-type="number" data-then="plRedrawWiz" value="${esc(s.startMi == null ? '' : s.startMi)}"></label>
        <label class="fl">Finish at mile<input class="in" type="number" step="0.1" inputmode="decimal" data-bind="plan.setup.endMi" data-type="number" data-then="plRedrawWiz" value="${esc(s.endMi == null ? '' : s.endMi)}"></label></div>
        <div class="sm dim">${OA.dist(tot, 0)} of ${esc(t ? (t.name || t.id) : 'trail')} (${esc(OA.dist(m, 0))} in all). Mile numbers are the trail's own markers. Hiking only part of it? Change the miles.</div>
        <label class="fl">Start date<input class="in" type="date" data-bind="plan.setup.startDate" data-type="text" value="${esc(s.startDate || '')}"></label>
        <div class="fl">Your experience</div>${levelChips()}`;
    } else if (wiz === 1) {
      const base = s.useHours ? Math.round(s.hours * s.mph * 10) / 10 : s.milesPerDay, tot = Math.abs((s.endMi || 0) - (s.startMi || 0)), est = base > 0 ? Math.ceil(tot / base) : 0;
      b = `<div class="fl">Your experience</div>${levelChips()}
        <label class="chk"><input type="checkbox" ${s.useHours ? 'checked' : ''} data-bind="plan.setup.useHours" data-type="bool" data-then="plRedrawWiz"> Plan by hours on trail and pace instead of miles</label>
        ${s.useHours ? `<div class="two"><label class="fl">Hours hiking per day<input class="in" type="number" step="0.5" min="2" max="14" inputmode="decimal" data-bind="plan.setup.hours" data-type="number" data-then="plRedrawWiz" value="${esc(s.hours)}"></label>
          <label class="fl">Pace (mph)<input class="in" type="number" step="0.1" min="1" max="4" inputmode="decimal" data-bind="plan.setup.mph" data-type="number" data-then="plRedrawWiz" value="${esc(s.mph)}"></label></div>`
          : `<div class="two"><label class="fl">Miles per day<input class="in" type="number" step="1" min="3" max="40" inputmode="decimal" data-bind="plan.setup.milesPerDay" data-type="number" data-then="plRedrawWiz" value="${esc(s.milesPerDay)}"></label>
          <label class="fl">Pace (mph)<input class="in" type="number" step="0.1" min="1" max="4" inputmode="decimal" data-bind="plan.setup.mph" data-type="number" data-then="plRedrawWiz" value="${esc(s.mph)}"></label></div>`}
        <div class="card inner"><b>${est ? 'About ' + est + ' hiking days' : 'Set your pace'}</b><div class="sm dim">at ${OA.dist(base, 1)} per day on average, before zero days. Pace is used for water carries, hours on trail and daylight checks. A typical loaded pace is about 2 mph on flat ground and slower uphill.</div></div>
        <label class="chk"><input type="checkbox" ${s.ramp ? 'checked' : ''} data-bind="plan.setup.ramp" data-type="bool"> Easier first two weeks (start near 65% and build up)</label>
        <p class="sm dim">The planner also shortens a day by about 1 mile for each 700 ft of climbing beyond about 125 ft per mile when elevations are listed.</p>`;
    } else if (wiz === 2) {
      b = `<div class="two"><label class="fl">A zero day every N hiking days (0 = never)<input class="in" type="number" min="0" max="30" inputmode="numeric" data-bind="plan.setup.zeroEvery" data-type="number" value="${esc(s.zeroEvery)}"></label>
        <label class="fl">Nero (short town day)<select class="in" data-bind="plan.setup.nero"><option value="none" ${s.nero === 'none' ? 'selected' : ''}>None</option><option value="leave" ${s.nero === 'leave' ? 'selected' : ''}>Short day after a town stay</option><option value="arrive" ${s.nero === 'arrive' ? 'selected' : ''}>Mark short arrival days</option><option value="both" ${s.nero === 'both' ? 'selected' : ''}>Both</option></select></label></div>
        <h3>Stay in a hotel when</h3>
        <label class="chk"><input type="checkbox" ${s.stay.zeroOnly ? 'checked' : ''} data-bind="plan.setup.stay.zeroOnly" data-type="bool" data-then="plRedrawWiz"> Only on zero days</label>
        ${s.stay.zeroOnly ? '' : `<label class="chk"><input type="checkbox" ${s.stay.near ? 'checked' : ''} data-bind="plan.setup.stay.near" data-type="bool" data-then="plRedrawWiz"> A town is within <input class="in" style="width:70px;display:inline-block;margin:0 6px" type="number" min="0" max="30" inputmode="decimal" data-bind="plan.setup.stay.nearMi" data-type="number" value="${esc(s.stay.nearMi)}"> miles of the day's end</label>
        <label class="chk"><input type="checkbox" ${s.stay.laundry ? 'checked' : ''} data-bind="plan.setup.stay.laundry" data-type="bool" data-then="plRedrawWiz"> Every <input class="in" style="width:70px;display:inline-block;margin:0 6px" type="number" min="2" max="21" inputmode="numeric" data-bind="plan.setup.stay.laundryEvery" data-type="number" value="${esc(s.stay.laundryEvery)}"> nights, for laundry and a shower</label>`}
        <label class="chk"><input type="checkbox" ${s.stay.rain ? 'checked' : ''} data-bind="plan.setup.stay.rain" data-type="bool"> When rain is forecast (the plan marks town days where you could; check the forecast then)</label>
        <div class="two"><label class="fl">Budget per hotel night ($)<input class="in" type="number" min="0" step="5" inputmode="decimal" data-bind="plan.setup.hotelBudget" data-type="number" value="${esc(s.hotelBudget)}"></label>
        <label class="fl">Most days of food to carry<input class="in" type="number" min="3" max="10" inputmode="numeric" data-bind="plan.setup.maxFoodDays" data-type="number" value="${esc(s.maxFoodDays)}"></label></div>
        <div class="sm dim">The planner stops in a town when skipping it would mean carrying more than that many days of food. Hotel prices vary a lot by town and season: use your own budget.</div>`;
    } else {
      const t2 = t, pts = t2 && Array.isArray(t2.points) ? t2.points.filter(p => num(p.mi) && P.isTownPt(p) && p.mi > Math.min(s.startMi, s.endMi) && p.mi < Math.max(s.startMi, s.endMi)) : [];
      const cnt = { buy: 0, box: 0, none: 0 }; pts.forEach(p => { cnt[P.stratFor(p, { resup: s.resup || {} })]++; });
      b = `<p>Where the trail data lists a full grocery, the planner assumes you <b>buy</b> food in town. Where it lists a limited or no grocery, it assumes a <b>box</b> you mail ahead, or no resupply when nothing there can hold a box.</p>
        <div class="stat"><div><b>${cnt.buy}</b><span>BUY IN TOWN</span></div><div><b>${cnt.box}</b><span>MAIL A BOX</span></div><div><b>${cnt.none}</b><span>NO RESUPPLY</span></div></div>
        <p class="sm dim">${pts.length ? 'These are the towns the data lists between your start and finish.' : 'The data lists no towns on this stretch: the plan will place camps from the water and camp points it has, and you will need to add towns yourself.'} You can change the choice for each town in the Resupply view after the plan is built.</p>`;
    }
    return head + b + nav(wiz === STEPS.length - 1);
  }
  function validateSetup() {
    const s = PL().setup;
    if (!trailGet(s.trailId)) return 'Pick a trail first.';
    if (!num(s.startMi) || !num(s.endMi) || Math.abs(s.endMi - s.startMi) < 0.5) return 'Start and finish miles need to be different.';
    return null;
  }

  /* ================= TAB ================= */
  let UI = { sec: null };
  const VIEWS = [['days', 'Days'], ['resupply', 'Resupply'], ['permits', 'Permits'], ['share', 'Share']];
  const PAGE = 30;

  function emptyState() {
    const list = trailList();
    return OA.header('Plan', 'Day by day, town by town') + `<section class="hero"><div class="ct"><span>${OA.icon('calendar')} Plan a long hike</span></div>
      <p>Pick a trail, a start date and how far you like to walk. The planner lays out each day: where to camp, when to hit a town, when to rest, how much water and food to carry, and what could go wrong.</p>
      <p class="sm dim">It works from the trail data in this app (mile markers, water, towns, hazards) and is a starting point: you can change any day and the days after it re-plan.</p>
      <button class="btn gold block" data-act="planSetup" data-smoke ${list.length ? '' : 'disabled'}>Plan my trip</button>
      ${list.length ? '' : '<div class="alert"><b class="t">No trail data yet</b>This copy of the app has no trail installed. Import a GPX route in the Trail tab to plan on it.</div>'}</section>`;
  }
  function brokenState() {
    return OA.header('Plan', '') + `<section class="card"><div class="alert danger"><b class="t">The plan cannot be built</b>The trail it was made for is not available now. Open the setup to pick another trail.</div><button class="btn gold block" data-act="planSetup">Open setup</button><button class="btn danger block" data-act="planErase">Delete this plan</button></section>`;
  }
  function foodCostPerDay() {
    try { const f = BP.pack && BP.pack.foodCostPerDay; const v = typeof f === 'function' ? f() : f; return num(v) && v > 0 ? v : null; } catch (e) { return null; }
  }
  function summaryCard(r, t) {
    const s = r.summary, c = r.config, fc = foodCostPerDay();
    const foodTotal = fc != null ? Math.round(fc * s.buyFoodDays) : null;
    const town = s.hotelCost + (foodTotal || 0);
    return `<section class="card"><div class="ct"><span>${OA.icon('route')} ${esc(t.name || t.id)}</span><span class="sm dim">${esc(dirName(t, PL().setup.rev))}</span></div>
      <div class="sm dim">Mile ${mileTxt(c.startMi)} to ${mileTxt(c.endMi)}${r.seasonCheck && r.seasonCheck.months ? ' · ' + r.seasonCheck.months.map(m => esc(m.name.slice(0, 3)) + ': ' + (m.seasons.length ? esc(m.seasons.map(x => x.label || 'listed').join('/')) : 'no season listed')).join(', ') : ''}</div>
      <div class="stat"><div><b>${s.totalDays}</b><span>DAYS</span></div><div><b>${esc(OA.dist(s.miles, 0))}</b><span>WALKING</span></div><div><b>${s.zeroDays}</b><span>ZERO DAYS</span></div>
      <div><b>${s.hotelNights}</b><span>HOTELS</span></div><div><b>${s.resupplyStops}</b><span>RESUPPLIES</span></div><div><b>${esc(OA.money(town))}</b><span>TOWN COST</span></div></div>
      <div class="sm dim">Town cost: ${s.hotelNights} night${s.hotelNights === 1 ? '' : 's'} at ${esc(OA.money(c.hotelBudget))} = ${esc(OA.money(s.hotelCost))}${fc != null ? ` plus about ${esc(OA.money(foodTotal))} of food bought in towns (${esc(OA.money2(fc))}/day from the Pack tab)` : '. Food prices are not included: set them in the Pack tab.'}${s.gainFt != null && r.elevSource ? ' Climbing about ' + esc(OA.ft(s.gainFt)) + (r.elevSource === 'points' ? ' (a minimum, from listed elevations)' : '') + '.' : ''}</div>
      <div class="row wrap"><button class="btn" data-act="planSetup">Change setup</button><button class="btn" data-act="planMenu">More</button></div></section>`;
  }
  function seasonCard(r, t) {
    const sc = r.seasonCheck, L = [];
    if (!Array.isArray(t.seasons) || !t.seasons.length) return `<section class="card"><div class="ct"><span>${OA.icon('cloud')} Season check</span></div><p class="sm dim">The trail data has no season information: ${CHECK}. Look up typical snow, heat, fire and flood conditions for your months.</p></section>`;
    if (sc && sc.months) sc.months.forEach(m => L.push(`<div class="kv"><span>${esc(m.name)}</span><span style="text-align:right">${m.seasons.length ? m.seasons.map(x => esc(x.label || 'listed')).join(', ') : '<span class="warn">not covered by a listed season</span>'}</span></div>`));
    const notes = sc && sc.startMonth && sc.startMonth.length ? sc.startMonth.filter(x => x.note).map(x => `<p class="sm"><b>${esc(x.label)}:</b> ${esc(x.note)}</p>`).join('') : '';
    return `<section class="card"><div class="ct"><span>${OA.icon('cloud')} Schedule against the seasons</span></div>${L.join('') || `<p class="sm dim">Season windows are listed but could not be matched to your dates.</p>`}${notes}<div class="xs dim">Seasons come from the trail data. A season label is not a forecast: check snow and fire reports before you go.</div></section>`;
  }
  function dayCard(d) {
    const hereN = todayN(getPlan());
    const where = d.kind === 'zero' ? (d.town ? d.town.name : (d.camp ? d.camp.name : 'camp')) : d.finish ? 'Finish: ' + d.toName : d.town ? d.town.name : (d.camp ? d.camp.name : d.toName);
    const ic = d.zero ? 'bed' : d.finish ? 'star' : d.town ? (d.hotel ? 'bed' : 'home') : 'tent';
    return `<div class="pl-day ${d.zero ? 'zero' : ''} ${hereN === d.n ? 'now' : ''}" data-act="planDay" data-n="${d.n}" role="button" tabindex="0">
      <div class="pl-n"><b>Day ${d.n}</b><span>${esc(d.date ? OA.fmtDate(d.date) : '')}</span></div>
      <div class="pl-mid"><b>${d.zero ? 'Rest day' : 'Mile ' + mileTxt(d.fromMi) + ' to ' + mileTxt(d.toMi)}</b><span>${d.zero ? '' : esc(OA.dist(d.miles)) + ' · '}${OA.icon(ic, 'sm')} ${esc(where)}</span><div>${dayTags(d)}</div></div>
      <div class="pl-go">${OA.icon('chev')}</div></div>`;
  }
  function daysView(r) {
    const n = r.days.length, pages = Math.ceil(n / PAGE), tn = todayN(r);
    let pg = PL().page; if (pg == null) pg = tn && tn >= 1 && tn <= n ? Math.floor((tn - 1) / PAGE) : 0;
    pg = OA.clamp(pg, 0, pages - 1);
    const list = r.days.slice(pg * PAGE, pg * PAGE + PAGE);
    const pager = pages > 1 ? `<div class="row mid between"><button class="mini" data-act="planPage" data-d="-1" ${pg === 0 ? 'disabled' : ''}>‹ Earlier</button><span class="sm dim">Days ${pg * PAGE + 1} to ${Math.min(n, pg * PAGE + PAGE)} of ${n}</span><button class="mini" data-act="planPage" data-d="1" ${pg >= pages - 1 ? 'disabled' : ''}>Later ›</button></div>` : '';
    return `${pager}<section class="card pl-days">${list.map(dayCard).join('')}</section>${pager}${tn && tn >= 1 && tn <= n && Math.floor((tn - 1) / PAGE) !== pg ? '<button class="btn block" data-act="planToday">Jump to today</button>' : ''}
      <p class="xs dim center">Tap a day for water, food, daylight and to change it. Changing a day re-plans the days after it.</p>`;
  }
  function render(el) {
    const p = PL();
    if (!p.built) { el.innerHTML = emptyState(); return; }
    const r = getPlan(), t = P.trail();
    if (!r || !t || !r.ok) { el.innerHTML = brokenState(); return; }
    const view = VIEWS.some(v => v[0] === p.view) ? p.view : 'days';
    const alerts = r.warnings.map(w => `<div class="alert ${w.level === 'r' ? 'danger' : ''}"><b class="t">${w.code === 'season' ? 'Season' : w.code === 'food' ? 'Food' : 'Check'}</b>${esc(w.text)}</div>`).join('') + (r.notes.length ? `<div class="alert"><b class="t">Note</b>${r.notes.map(esc).join(' ')}</div>` : '');
    const chips = `<div class="chips">${VIEWS.map(v => `<button class="chip ${v[0] === view ? 'on' : ''}" data-act="planView" data-v="${v[0]}">${v[1]}</button>`).join('')}</div>`;
    let body = '';
    if (view === 'days') body = daysView(r);
    else if (view === 'resupply') body = resupplyView(r, t);
    else if (view === 'permits') body = permitsView(r, t);
    else body = shareView(r, t);
    el.innerHTML = OA.header('Plan', `${r.summary.totalDays} days · ${fdate(r.summary.startDate)} to ${fdate(r.summary.finishDate)}`) + summaryCard(r, t) + alerts + chips + body +
      `<p class="foot">A plan is a guess. Weather, water and your body will change it. Mile markers and services come from the trail data: confirm what matters with the source.</p>`;
  }
  OA.tab({ id: 'plan', label: 'Plan', icon: 'calendar', order: 30, render });

  /* ================= DAY SHEET ================= */
  function svcHtml(sv, town) {
    if (!sv) return `<p class="sm dim">Services for this town are not listed: ${CHECK}.</p>`;
    const rows = [], yn = v => v === true ? 'Yes' : v === false ? 'No' : null;
    const add = (k, v) => { if (v != null && v !== '') rows.push(`<div class="kv"><span>${k}</span><span style="text-align:right">${esc(v)}</span></div>`); };
    add('Grocery', sv.grocery); add('Post office', yn(sv.post) || (typeof sv.post === 'string' ? sv.post : null));
    add('Lodging', Array.isArray(sv.lodging) ? (sv.lodging.length ? sv.lodging.map(x => typeof x === 'string' ? x : (x && x.name) || '').filter(Boolean).join(', ') : 'none listed') : null);
    add('Laundry', yn(sv.laundry)); add('Showers', yn(sv.shower)); add('Restaurant', yn(sv.restaurant)); add('Outfitter', yn(sv.outfitter)); add('Hiker box', yn(sv.hikerBox)); add('Cell service', typeof sv.cell === 'string' ? sv.cell : yn(sv.cell)); add('Resupply by', sv.resupplyBy);
    let extra = ''; if (town) { if (town.phone) extra += `<div class="kv"><span>Phone</span><span><a href="tel:${esc(String(town.phone).replace(/[^\d+]/g, ''))}">${esc(town.phone)}</a></span></div>`; if (safeUrl(town.url)) extra += `<div class="kv"><span>Web</span><span>${link(town.url, 'Official page')}</span></div>`; }
    return rows.join('') + extra || `<p class="sm dim">No services are listed: ${CHECK}.</p>`;
  }
  function pointsAhead(r, d) {
    const t = P.trail(); if (!t) return [];
    const c = r.config, inc = c.endMi >= c.startMi, lim = d.fromX + Math.max(d.maxWalk * 1.7, 12);
    return (t.points || []).filter(p => num(p.mi) && ['campsite', 'water', 'town', 'trailhead', 'bear-box', 'pass', 'landmark', 'terminus'].includes(p.kind)).map(p => ({ p, x: Math.round((inc ? p.mi - c.startMi : c.startMi - p.mi) * 10) / 10 })).filter(o => o.x > d.fromX + 1 && o.x <= Math.min(lim, Math.abs(c.endMi - c.startMi) + 0.05)).sort((a, b) => a.x - b.x).slice(0, 60);
  }
  const tri = (id, label, v) => `<label class="fl">${label}<select class="in" id="${id}"><option value="" ${v == null ? 'selected' : ''}>Planner decides</option><option value="1" ${v === true ? 'selected' : ''}>Yes</option><option value="0" ${v === false ? 'selected' : ''}>No</option></select></label>`;
  function daySheetHtml(r, d) {
    const L = [], ed = PL().edits[d.n] || {}, prev = r.days[d.n - 2];
    const h = d.sun && d.sun.hours != null ? d.sun : null, tm = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '–';
    L.push(`<div class="sm dim">${esc(fdate(d.date, true))}${d.edited ? ' · edited by you' : ''}</div>`);
    if (d.zero) {
      L.push(`<div class="card"><div class="ct"><span>${OA.icon('bed')} Zero day${d.town ? ' in ' + esc(d.town.name) : ''}</span></div><p class="sm">No miles. ${d.town ? 'Laundry, shower, resupply, repairs, calls home and real rest.' : 'Rest at camp: water, food and a short look at the next days.'}</p>${d.hotel ? '<span class="tag g">Hotel</span>' : '<span class="tag">No hotel counted</span>'}</div>`);
      if (d.town) L.push(`<div class="sh-sec"><h3>${esc(d.town.name)}, mile ${mileTxt(d.town.mi)}</h3>${svcHtml(d.town.svc, d.town)}</div>`);
      L.push(`<button class="btn danger block" data-act="planRemoveZero" data-n="${d.n}">Remove this zero day</button>`);
      return L.join('');
    }
    L.push(`<div class="stat"><div><b>${esc(OA.dist(d.miles))}</b><span>WALKING</span></div><div><b>${d.gainFt != null ? esc(OA.ft(d.gainFt)) : '–'}</b><span>CLIMB</span></div><div><b>${esc(OA.hm(d.miles / r.config.mph))}</b><span>ON THE MOVE</span></div></div>`);
    L.push(`<div class="kv"><span>From</span><span style="text-align:right">${esc(d.fromName)} (mile ${mileTxt(d.fromMi)})</span></div><div class="kv"><span>To</span><span style="text-align:right">${esc(d.toName)} (mile ${mileTxt(d.toMi)})</span></div>`);
    if (d.detourIn || d.detourOut) L.push(`<div class="kv"><span>Side trip</span><span style="text-align:right">${d.detourIn ? OA.dist(d.detourIn) + ' back to the trail' : ''}${d.detourIn && d.detourOut ? ', ' : ''}${d.detourOut ? OA.dist(d.detourOut) + ' into town' : ''}</span></div>`);
    if (d.gainFt != null && d.lossFt != null) L.push(`<div class="kv"><span>Down</span><span>${esc(OA.ft(d.lossFt))}</span></div>`);
    if (d.gainFt != null && r.elevSource === 'points') L.push('<div class="xs dim">Climb is worked out from the elevations listed on trail points, so real climbing is likely more.</div>');
    if (d.nero) L.push('<div class="sm"><span class="tag">Nero</span> A short day around a town stop.</div>');
    /* warnings */
    d.warnings.forEach(w => { if (w.code === 'hazard') return; L.push(`<div class="alert ${w.level === 'r' ? 'danger' : ''}"><b class="t">${esc(shortOf(w))}</b>${esc(w.text)}</div>`); });
    d.hazards.forEach(hz => L.push(`<div class="alert danger"><b class="t">${esc(hz.title)}</b>Miles ${mileTxt(hz.fromMi)}${hz.toMi !== hz.fromMi ? ' to ' + mileTxt(hz.toMi) : ''}.${hz.note ? ' ' + esc(hz.note) : ''}</div>`));
    d.permits.forEach(pm => L.push(`<div class="alert"><b class="t">Permit point</b>${esc(pm.name)} at mile ${mileTxt(pm.mi)}.${pm.note ? ' ' + esc(pm.note) : ''}</div>`));
    /* camp and water */
    if (d.camp) {
      L.push(`<div class="sh-sec"><h3>${OA.icon('tent', 'sm')} Camp: ${esc(d.camp.name)}</h3><div class="sm dim">Mile ${mileTxt(d.camp.mi)}${d.camp.waterType ? ' · water: ' + esc(d.camp.waterType) : ''}</div>
        <div class="sm">${d.camp.water === 2 ? 'Water is listed here.' : d.camp.water === 1 ? 'Water here may be seasonal or unreliable.' : 'No water is listed here: carry what you need for the evening and morning.'}</div></div>`);
    } else if (d.town) {
      L.push(`<div class="sh-sec"><h3>${OA.icon(d.hotel ? 'bed' : 'home', 'sm')} Town: ${esc(d.town.name)}</h3><div class="sm dim">Mile ${mileTxt(d.town.mi)}${d.town.off ? ' · ' + OA.dist(d.town.off) + ' off the trail' : ''}</div>
        <div class="row wrap">${d.hotel ? '<span class="tag g">Hotel night</span>' : '<span class="tag">No hotel counted</span>'}${d.rainHotel ? '<span class="tag w">Hotel if rain is forecast</span>' : ''}</div>${svcHtml(d.town.svc, d.town)}</div>`);
    }
    if (d.water) {
      const w = d.water;
      L.push(`<div class="sh-sec"><h3>${OA.icon('drop', 'sm')} Water</h3><div class="sm">Longest dry stretch on today's route: <b>${esc(OA.dist(w.gapMi))}</b> from ${esc(w.fromName)} (mile ${mileTxt(w.fromMi)}) to ${esc(w.toName)} (mile ${mileTxt(w.toMi)}).</div>
        <div class="sm">Carry about <b>${w.carryL} L</b> from ${esc(w.fromName)}${w.dryNight ? ' (this includes an evening and morning at a dry camp)' : ''}. That is half a liter per hour of walking in moderate heat: carry more in heat, climbs or when you are not sure of the next source.</div>
        ${w.unreliable ? '<div class="sm warn">One end of this stretch is a seasonal or unreliable source: check recent water reports.</div>' : ''}<div class="xs dim">Based only on the water points listed in this app, which may be incomplete.</div></div>`);
    } else if (d.waterStartDry) L.push(`<div class="sh-sec"><h3>${OA.icon('drop', 'sm')} Water</h3><div class="sm">You start from a camp without listed water. Next listed water: ${esc(d.waterStartDry.toName)} at mile ${mileTxt(d.waterStartDry.toMi)} (${esc(OA.dist(d.waterStartDry.miles))}).</div></div>`);
    L.push(`<div class="sh-sec"><h3>${OA.icon('fork', 'sm')} Food</h3><div class="sm">${d.foodLeft} day${d.foodLeft === 1 ? '' : 's'} of food from the start of today until the next resupply${d.resupply && d.resupply.strategy !== 'none' ? ' (you resupply tonight)' : ''}. Add a spare day.</div>${d.resupply && d.resupply.strategy !== 'none' ? `<div class="sm">After ${esc(d.resupply.name)}: carry <b>${d.resupply.foodDays}</b> day${d.resupply.foodDays === 1 ? '' : 's'} (+1 spare) to ${esc(d.resupply.nextName)}.</div>` : ''}</div>`);
    L.push(`<div class="sh-sec"><h3>${OA.icon('sun', 'sm')} Daylight</h3>${h ? `<div class="kv"><span>Sunrise</span><b>${esc(tm(h.rise))}</b></div><div class="kv"><span>Sunset</span><b>${esc(tm(h.set))}</b></div><div class="kv"><span>Daylight</span><b>${esc(OA.hm(h.hours))}</b></div><div class="xs dim">Times are shown in your phone's time zone for the middle of the day's route. On the trail the clock may differ by a few hours: use the length of daylight.</div>` : '<div class="sm dim">Daylight needs a start date and coordinates on the trail points.</div>'}</div>`);
    /* editing */
    const opts = pointsAhead(r, d), curMi = ed.endMi;
    L.push(`<div class="sh-sec"><h3>${OA.icon('edit', 'sm')} Change this day</h3><p class="sm dim">Days after this one re-plan from the new end point. Edits you made to later days are cleared.</p>
      <label class="fl">End the day at<select class="in" id="pe-end"><option value="">Planner decides${d.edited ? '' : ' (now: ' + esc(d.toName) + ')'}</option>${opts.map(o => `<option value="${o.p.mi}" ${curMi === o.p.mi ? 'selected' : ''}>${esc((o.p.name || 'Mile ' + o.p.mi) + ' · mile ' + mileTxt(o.p.mi) + ' · ' + OA.dist(o.x - d.fromX + d.detourIn) + ' (' + o.p.kind + ')')}</option>`).join('')}</select></label>
      <label class="fl">or any mile number<input class="in" id="pe-mile" type="number" step="0.1" inputmode="decimal" placeholder="mile" value="${curMi != null && !opts.some(o => o.p.mi === curMi) ? esc(curMi) : ''}"></label>
      <div class="two">${tri('pe-hotel', 'Hotel tonight (in a town)', typeof ed.hotel === 'boolean' ? ed.hotel : null)}${tri('pe-zero', 'Zero day after this day', typeof ed.zeroAfter === 'boolean' ? ed.zeroAfter : null)}</div>
      <label class="chk"><input type="checkbox" id="pe-nero" ${ed.nero ? 'checked' : ''}> Mark as a nero (short day)</label>
      <div class="row"><button class="btn gold" data-act="planApply" data-n="${d.n}">Apply and re-plan</button><button class="btn" data-act="planReset" data-n="${d.n}">Back to automatic</button></div></div>`);
    return L.join('');
  }
  function openDay(n) {
    const r = getPlan(); if (!r) return; const d = r.days[n - 1]; if (!d) return;
    OA.sheet('Day ' + d.n + (d.kind === 'zero' ? ' · Zero day' : ' · ' + (d.finish ? 'Finish' : (d.town ? d.town.name : d.camp ? d.camp.name : 'On trail'))), daySheetHtml(r, d));
  }

  /* ================= RESUPPLY ================= */
  function mailDrop(r, d, t) {
    const rs = d.resupply, tw = d.town, sv = tw.svc || {}, biz = Array.isArray(sv.lodging) && sv.lodging.length ? sv.lodging.map(x => typeof x === 'string' ? x : (x && x.name) || '').filter(Boolean) : [];
    const st = Array.isArray(t.states) && t.states.length === 1 ? t.states[0] : '[state]';
    const lines = ['[Your full name]', 'c/o General Delivery', `${tw.name}, ${st} [ZIP: confirm with the post office]`, `HOLD FOR HIKER. Expected arrival: ${d.date ? fdate(d.date, true) : '[date]'}`];
    return lines.join('\n');
  }
  function resupplyView(r, t) {
    const days = r.days, stops = days.filter(d => d.kind === 'hike' && d.resupply);
    const first = r.startFood;
    let h = `<section class="card"><div class="ct"><span>${OA.icon('fork', 'sm')} Start</span><span class="sm dim">${fdate(r.config.startDate)}</span></div><div class="sm">Carry <b>${first.days}</b> day${first.days === 1 ? '' : 's'} of food (+1 spare) from home to ${esc(first.toName)}.</div>${first.days > 7 ? '<div class="alert danger"><b class="t">Heavy start</b>More than 7 days of food. Add a stop, a box or a shorter first stretch.</div>' : ''}</section>`;
    if (!stops.length) h += '<section class="card"><p class="sm dim">No towns are planned on this route, so there are no resupply stops.</p></section>';
    stops.forEach(d => {
      const rs = d.resupply, tw = d.town, sv = tw.svc || {}, strat = rs.strategy;
      const chip = (v, l) => `<button class="chip ${strat === v ? 'on' : ''}" data-act="planStrat" data-mi="${tw.mi}" data-v="${v}">${l}</button>`;
      let box = '';
      if (strat === 'box') {
        const txt = mailDrop(r, d, t), ship = rs.shipBy;
        box = `<div class="card inner"><b>Mail-drop helper</b>
          <div class="sm">Ship the box by <b>${esc(fdate(ship, true))}</b> (7 days before you arrive${ship && r.config.startDate && ship < r.config.startDate ? ', which is before you leave home' : ''}). General Delivery mail is usually held about 30 days at the post office, so do not send it too early.</div>
          <textarea class="in" rows="6" readonly id="md-${d.n}" style="min-height:130px">${esc(txt)}</textarea>
          <div class="row"><button class="btn" data-act="planCopy" data-id="md-${d.n}">Copy address</button></div>
          ${Array.isArray(sv.lodging) && sv.lodging.length ? `<div class="sm dim">Some lodging, outfitters or stores hold boxes for guests. Ask first, and ask about fees. Listed lodging: ${esc(sv.lodging.map(x => typeof x === 'string' ? x : (x && x.name) || '').filter(Boolean).join(', '))}.</div>` : ''}
          <div class="alert"><b class="t">Confirm before you mail</b>Confirm the address and ZIP with the post office or business before mailing. This app does not have verified mailing addresses.${tw.phone ? ' Phone listed: ' + esc(tw.phone) + '.' : ''}${safeUrl(tw.url) ? ' ' + link(tw.url, 'Listed web page') : ''}</div></div>`;
      } else if (strat === 'buy') {
        box = `<div class="sm dim">${sv.grocery ? 'Grocery: ' + esc(sv.grocery) + '.' : 'The data does not say how well stocked the stores are: ' + CHECK + '.'}${sv.grocery === 'limited' ? ' Limited stores can run low on hiker staples: consider a box.' : ''}</div>`;
      }
      const shop = BP.pack && typeof BP.pack.shoppingFor === 'function'
        ? `<button class="btn" data-act="planShop" data-n="${d.n}">Shopping list (${rs.foodDays} days)</button>`
        : `<button class="btn" data-go="pack">Open Pack for food</button>`;
      h += `<section class="card"><div class="ct"><span>${OA.icon('cart', 'sm')} ${esc(rs.name)}</span><span class="sm dim">Day ${d.n} · ${esc(d.date ? OA.fmtDate(d.date) : '')}</span></div>
        <div class="sm dim">Mile ${mileTxt(tw.mi)}${tw.off ? ' · ' + OA.dist(tw.off) + ' off trail' : ''}${d.hotel ? ' · hotel night' : ''}</div>
        <div class="chips">${chip('buy', 'Buy there')}${chip('box', 'Mail a box')}${chip('none', 'No resupply')}</div>
        ${strat === 'none' ? '<div class="sm dim">No food is picked up here. The stop stays in the plan as a town visit.</div>' : `<div class="sm">Carry <b>${rs.foodDays}</b> day${rs.foodDays === 1 ? '' : 's'} of food (+1 spare) to ${esc(rs.nextName)} at mile ${mileTxt(rs.nextMi)}.</div>${rs.foodDays > 7 ? '<div class="alert danger"><b class="t">Long carry</b>More than 7 days of food.</div>' : ''}`}
        ${box}${strat !== 'none' ? `<div class="row wrap">${shop}</div>` : ''}</section>`;
    });
    return h;
  }

  /* ================= PERMITS AND CHECKLIST ================= */
  function checkItems(r, t) {
    const items = [], c = r.config, boxes = r.days.filter(d => d.resupply && d.resupply.strategy === 'box' && d.resupply.shipBy).sort((a, b) => a.resupply.shipBy < b.resupply.shipBy ? -1 : 1);
    (Array.isArray(t.permits) ? t.permits : []).forEach((pm, i) => items.push({ id: 'permit:' + i + ':' + (pm.name || ''), text: 'Permit: ' + (pm.name || 'listed permit') + (pm.when ? ' (' + pm.when + ')' : ''), sub: pm.who ? 'For: ' + pm.who : '' }));
    if (!Array.isArray(t.permits) || !t.permits.length) items.push({ id: 'g:permit', text: 'Permits: find out which apply to your route and dates', sub: 'The trail data lists none: ' + CHECK + '.' });
    items.push({ id: 'g:bear', text: 'Check whether bear canisters or other food storage are required on your route and dates', sub: 'Ask the land manager.' });
    if (boxes.length) items.push({ id: 'g:boxes', text: 'Mail resupply boxes (' + boxes.length + ')', sub: 'First one by ' + fdate(boxes[0].resupply.shipBy, true) + ' for ' + boxes[0].resupply.name + '.' });
    items.push({ id: 'g:insurance', text: 'Insurance: travel, medical and rescue cover checked', sub: '' });
    items.push({ id: 'g:shuttle', text: 'Transport to the start booked (and a way home from the finish)', sub: c.startDate ? 'Start ' + fdate(c.startDate, true) : '' });
    items.push({ id: 'g:leave', text: 'Leave your plan with someone you trust', sub: 'Use the leave-behind plan under Share.' });
    items.push({ id: 'g:contacts', text: 'Emergency contacts and any satellite messenger set up and tested', sub: '' });
    items.push({ id: 'g:conditions', text: 'Re-check snow, fire, water and closure reports a week before you start', sub: '' });
    items.push({ id: 'g:gear', text: 'Gear shakedown: a full pack on a real overnight before you go', sub: '' });
    return items;
  }
  function hazardRows(r) {
    const by = {};
    r.days.forEach(d => (d.hazards || []).forEach(h => { const k = h.title + '|' + h.fromMi; (by[k] = by[k] || { h, days: [] }).days.push(d); }));
    return Object.values(by);
  }
  function permitsView(r, t) {
    const c = r.config, ck = PL().check, items = checkItems(r, t), done = items.filter(i => ck[i.id]).length;
    let h = '';
    const pms = Array.isArray(t.permits) ? t.permits : null;
    h += `<section class="card"><div class="ct"><span>${OA.icon('ticket', 'sm')} Permits</span><span class="sm dim">${esc(fdate(c.startDate, true))} start</span></div>`;
    if (!pms) h += `<p class="sm dim">The trail data does not list permits: ${CHECK}.</p>`;
    else if (!pms.length) h += `<p class="sm dim">The trail data lists no permit for this trail. Rules for parks and wilderness areas along the way can still apply: ${CHECK}.</p>`;
    else pms.forEach(pm => {
      h += `<div class="card inner"><b>${esc(pm.name || 'Permit')}</b>
        ${pm.who ? `<div class="kv"><span>Who</span><span style="text-align:right">${esc(pm.who)}</span></div>` : ''}${pm.when ? `<div class="kv"><span>When</span><span style="text-align:right">${esc(pm.when)}</span></div>` : ''}
        <div class="kv"><span>Cost</span><span>${num(pm.costUsd) ? (pm.costUsd === 0 ? 'free' : esc(OA.money2(pm.costUsd))) : CHECK}</span></div>${pm.note ? `<div class="sm">${esc(pm.note)}</div>` : ''}
        ${safeUrl(pm.url) ? `<a class="btn block" href="${esc(safeUrl(pm.url))}" target="_blank" rel="noopener">Open the official page</a>` : `<div class="sm dim">No link in the data: ${CHECK}.</div>`}</div>`;
    });
    const pp = r.days.filter(d => d.permits && d.permits.length);
    if (pp.length) h += `<div class="sm"><b>Permit points on your route</b></div>` + pp.map(d => d.permits.map(x => `<div class="kv"><span>${esc(x.name)}</span><span>Day ${d.n} · ${esc(d.date ? OA.fmtDate(d.date) : '')}</span></div>`).join('')).join('');
    h += `<div class="xs dim">Permit details come from the trail data. Rules and fees change: confirm with the issuing agency before you rely on them.</div></section>`;
    const hz = hazardRows(r);
    h += `<section class="card"><div class="ct"><span>${OA.icon('alert', 'sm')} Hazards on your route</span></div>${hz.length ? hz.map(o => `<div class="alert"><b class="t">${esc(o.h.title)}</b>Miles ${mileTxt(o.h.fromMi)}${o.h.toMi !== o.h.fromMi ? ' to ' + mileTxt(o.h.toMi) : ''}, ${o.days.length > 1 ? 'days ' + o.days[0].n + ' to ' + o.days[o.days.length - 1].n : 'day ' + o.days[0].n}${o.days[0].date ? ' (' + esc(OA.fmtDate(o.days[0].date)) + ')' : ''}.${o.h.note ? ' ' + esc(o.h.note) : ''}</div>`).join('') : '<p class="sm dim">The trail data lists no hazards on this stretch. That is not the same as none: check current reports.</p>'}</section>`;
    h += seasonCard(r, t);
    h += `<section class="card"><div class="ct"><span>${OA.icon('check', 'sm')} Before you go</span><span class="sm dim">${done} of ${items.length}</span></div>${items.map(i => `<label class="chk pl-chk"><input type="checkbox" ${ck[i.id] ? 'checked' : ''} data-act="planCheck" data-id="${esc(i.id)}"><span>${esc(i.text)}${i.sub ? `<span class="pl-sub">${esc(i.sub)}</span>` : ''}</span></label>`).join('')}</section>`;
    return h;
  }

  /* ================= SHARE AND PRINT ================= */
  function shareView(r, t) {
    const lv = PL().leave;
    return `<section class="card"><div class="ct"><span>${OA.icon('share', 'sm')} Send my plan</span></div><p class="sm dim">A plain text summary: route, dates, town stops and each day. It opens your phone's share sheet.</p>
      <div class="row wrap"><button class="btn gold" data-act="planSend" data-smoke>Send my plan</button><button class="btn" data-act="planSave">Save as text file</button></div></section>
    <section class="card"><div class="ct"><span>${OA.icon('home', 'sm')} Leave-behind plan</span></div><p class="sm dim">For family or a friend: where you will be, when, and what to do if you go quiet. You choose what it says. It leaves your phone only when you share it.</p>
      <label class="fl">Emergency contact (name and phone)<input class="in" data-bind="plan.leave.contact" value="${esc(lv.contact)}" maxlength="120"></label>
      <label class="fl">How you will check in<input class="in" data-bind="plan.leave.checkin" value="${esc(lv.checkin)}" maxlength="200" placeholder="for example: a text from each town stop"></label>
      <label class="fl">If you are overdue, they should<input class="in" data-bind="plan.leave.overdue" value="${esc(lv.overdue)}" maxlength="240" placeholder="for example: call the sheriff 2 days after my finish date"></label>
      <div class="row wrap"><button class="btn gold" data-act="planLeave">Preview and send</button></div></section>
    <section class="card"><div class="ct"><span>${OA.icon('download', 'sm')} Print</span></div><p class="sm dim">A one-page-per-30-days table: day, date, miles, camp or town, notes. Print or save as PDF from your phone's print dialog.</p><button class="btn block" data-act="planPrint">Print itinerary</button></section>`;
  }
  function printHtml(r, t) {
    const s = r.summary, rows = r.days.map(d => `<tr><td>${d.n}</td><td>${esc(d.date ? OA.fmtDate(d.date) : '')}</td><td>${d.zero ? '' : mileTxt(d.fromMi) + ' to ' + mileTxt(d.toMi)}</td><td>${d.zero ? '0' : esc(OA.dist(d.miles))}</td><td>${esc(d.zero ? 'Zero day: ' + (d.town ? d.town.name : 'camp') : d.finish ? 'Finish: ' + d.toName : d.town ? d.town.name + (d.hotel ? ' (hotel)' : '') : d.camp ? d.camp.name : d.toName)}</td><td>${esc(d.warnings.map(w => shortOf(w)).concat(d.resupply && d.resupply.strategy !== 'none' ? ['Resupply ' + d.resupply.strategy + ': ' + d.resupply.foodDays + ' d'] : []).join('; '))}</td></tr>`).join('');
    return `<h1>${esc(t.name || t.id)}: itinerary</h1><p>Mile ${mileTxt(r.config.startMi)} to ${mileTxt(r.config.endMi)} · ${esc(fdate(s.startDate, true))} to ${esc(fdate(s.finishDate, true))} · ${s.totalDays} days · ${esc(OA.dist(s.miles, 0))} · ${s.zeroDays} zero days</p>
      <table><thead><tr><th>Day</th><th>Date</th><th>Miles (mile markers)</th><th>Distance</th><th>Camp or town</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><p class="pl-small">Planning aid only. Confirm conditions, permits and services with the source. Printed ${esc(fdate(OA.dkey(), true))}.</p>`;
  }
  function printBlock(html) {
    let el = document.getElementById('pl-print'); if (!el) { el = document.createElement('div'); el.id = 'pl-print'; document.body.appendChild(el); }
    el.innerHTML = html; document.body.classList.add('pl-printing');
    const done = () => { document.body.classList.remove('pl-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
  }

  /* ================= ACTIONS ================= */
  const redrawWiz = () => OA.redrawSheet(wizHtml());
  OA.act({
    planSetup() { openWizard(); },
    plWizNext() { const e = wiz === 0 ? validateSetup() : null; if (e) return OA.toast(e); wiz = Math.min(STEPS.length - 1, wiz + 1); redrawWiz(); },
    plWizBack() { wiz = Math.max(0, wiz - 1); redrawWiz(); },
    plWizDone() {
      const e = validateSetup(); if (e) { wiz = 0; redrawWiz(); return OA.toast(e); }
      const p = PL(), s = p.setup, st = S().trail;
      const apply = () => {
        p.built = true; p.edits = {}; p.page = null; p.view = 'days'; cache = { key: '', plan: null };
        if (st && !st.startDate && st.id === s.trailId && s.startDate) st.startDate = s.startDate;
        OA.save(); OA.closeAllSheets(); OA.go('plan'); OA.toast('Plan built.');
      };
      if (p.built && Object.keys(p.edits).length) OA.confirm('Rebuilding clears the changes you made to individual days. Rebuild?', 'Rebuild').then(y => { if (y) apply(); }); else apply();
    },
    plRedrawWiz() { redrawWiz(); },
    plTrailChanged() { const s = PL().setup; s.rev = false; s.startMi = null; s.endMi = null; s.resup = {}; setupDefaults(); OA.save(); redrawWiz(); },
    plDir(el) { const s = PL().setup, t = trailGet(s.trailId); s.rev = el.dataset.v === '1'; if (t) { const m = trailMiles(t); s.startMi = s.rev ? m : 0; s.endMi = s.rev ? 0 : m; } OA.save(); redrawWiz(); },
    plLevel(el) { const s = PL().setup, L = P.LEVELS[el.dataset.v]; if (!L) return; s.level = el.dataset.v; s.milesPerDay = L.mpd; s.mph = L.mph; s.hours = L.hours; s.ramp = s.level !== 'exp'; OA.save(); redrawWiz(); },
    planView(el) { PL().view = el.dataset.v; OA.save(); OA.render(true); },
    planPage(el) { const r = getPlan(); if (!r) return; const pages = Math.ceil(r.days.length / PAGE); let pg = PL().page; if (pg == null) { const tn = todayN(r); pg = tn && tn >= 1 && tn <= r.days.length ? Math.floor((tn - 1) / PAGE) : 0; } PL().page = OA.clamp(pg + (+el.dataset.d), 0, pages - 1); OA.save(); OA.render(); },
    planToday() { PL().page = null; OA.save(); OA.render(); },
    planDay(el) { openDay(+el.dataset.n); },
    planApply(el) {
      const n = +el.dataset.n, r = getPlan(); if (!r) return;
      const sel = OA.$('#pe-end'), mile = OA.$('#pe-mile'), e = {};
      let m = sel && sel.value !== '' ? parseFloat(sel.value) : (mile && mile.value !== '' ? parseFloat(mile.value) : null);
      if (m != null && !isNaN(m)) {
        const c = r.config, x = c.endMi >= c.startMi ? m - c.startMi : c.startMi - m, d = r.days[n - 1];
        if (!(x > d.fromX + 0.05 && x <= Math.abs(c.endMi - c.startMi) + 0.001)) return OA.toast('That mile is not ahead of where this day starts, or is past your finish.');
        e.endMi = m;
      }
      const tri2 = id => { const v = OA.$(id).value; return v === '1' ? true : v === '0' ? false : undefined; };
      const hz = tri2('#pe-hotel'), zr = tri2('#pe-zero'); if (hz !== undefined) e.hotel = hz; if (zr !== undefined) e.zeroAfter = zr; if (OA.$('#pe-nero').checked) e.nero = true;
      const p = PL(); dropAfter(n); if (Object.keys(e).length) p.edits[n] = e; else delete p.edits[n];
      OA.save(); OA.closeSheet(); OA.toast('Days after day ' + n + ' re-planned.');
    },
    planReset(el) { const n = +el.dataset.n; delete PL().edits[n]; dropAfter(n); OA.save(); OA.closeSheet(); OA.toast('Back to automatic from day ' + n + '.'); },
    planRemoveZero(el) {
      const r = getPlan(), d = r && r.days[+el.dataset.n - 1]; if (!d || !d.after) return;
      const p = PL(), prev = d.after; dropAfter(prev); p.edits[prev] = Object.assign({}, p.edits[prev] || {}, { zeroAfter: false }); OA.save(); OA.closeSheet(); OA.toast('Zero day removed. The days after it moved up.');
    },
    planStrat(el) { const s = PL().setup; s.resup = s.resup || {}; s.resup[el.dataset.mi] = el.dataset.v; OA.save(); OA.render(true); },
    planCopy(el) { const t = OA.$('#' + el.dataset.id); if (!t) return; try { navigator.clipboard.writeText(t.value).then(() => OA.toast('Copied.'), () => { t.select(); OA.toast('Select and copy.'); }); } catch (e) { t.select(); OA.toast('Select and copy.'); } },
    planShop(el) {
      const r = getPlan(), d = r && r.days[+el.dataset.n - 1]; if (!d || !d.resupply) return;
      let res = null; try { res = BP.pack.shoppingFor(d.resupply.foodDays); } catch (e) { console.error(e); }
      let body = '';
      if (typeof res === 'string') body = `<pre class="pl-pre">${esc(res)}</pre>`;
      else if (Array.isArray(res) && res.length) body = '<ul class="ls">' + res.map(x => typeof x === 'string' ? `<li>${esc(x)}</li>` : `<li>${esc(x.name || x.item || x.label || '')}${x.qty != null ? ' · ' + esc(x.qty) : x.amount != null ? ' · ' + esc(x.amount) : ''}${x.unit ? ' ' + esc(x.unit) : ''}</li>`).join('') + '</ul>';
      else body = '<p class="sm dim">The Pack tab has no food list for this yet. Add your meals there first.</p>';
      OA.sheet('Shopping: ' + d.resupply.name, `<p class="sm dim">${d.resupply.foodDays} days of food (+1 spare) to ${esc(d.resupply.nextName)}.</p>${body}<button class="btn block" data-act="planPrintShop">Print this list</button>`);
      OA.act('planPrintShop', () => printBlock(`<h1>Shopping: ${esc(d.resupply.name)}</h1>${body}`));
    },
    planCheck(el) { const ck = PL().check; if (el.checked) ck[el.dataset.id] = true; else delete ck[el.dataset.id]; OA.save(); OA.render(true); },
    planSend() { OA.share.send({ title: 'My trail plan', text: P.summaryText() }); },
    planSave() { OA.download('trail-plan-' + OA.dkey() + '.txt', 'text/plain', P.summaryText()); OA.toast('Saved as a text file.'); },
    planLeave() {
      OA.sheet('Leave-behind plan', `<p class="sm dim">Edit the text if you like, then send it. Add the names of the people you are hiking with.</p><textarea class="in" rows="16" id="pl-leave">${esc(P.leaveText())}</textarea>
        <button class="btn gold block" data-act="planLeaveSend">Share</button><button class="btn block" data-act="planLeaveCopy">Copy</button>`);
    },
    planLeaveSend() { OA.share.send({ title: 'Leave-behind plan', text: OA.$('#pl-leave').value }); },
    planLeaveCopy() { const t = OA.$('#pl-leave'); try { navigator.clipboard.writeText(t.value).then(() => OA.toast('Copied.'), () => { t.select(); }); } catch (e) { t.select(); } },
    planPrint() { const r = getPlan(), t = P.trail(); if (r && t) printBlock(printHtml(r, t)); },
    planMenu() {
      OA.sheet('Plan options', `<button class="btn block" data-act="planSetup">Change setup and rebuild</button>
        <button class="btn block" data-act="planClearEdits">Clear my changes to individual days</button>
        <button class="btn danger block" data-act="planErase">Delete this plan</button>`);
    },
    async planClearEdits() { if (!Object.keys(PL().edits).length) return OA.toast('No changes to clear.'); if (!await OA.confirm('Clear every change you made to individual days?', 'Clear')) return; PL().edits = {}; OA.save(); OA.closeAllSheets(); OA.render(true); },
    async planErase() { if (!await OA.confirm('Delete this plan? Your checklist ticks are kept.', 'Delete')) return; const p = PL(); p.built = false; p.edits = {}; OA.save(); OA.closeAllSheets(); cache = { key: '', plan: null }; OA.render(); }
  });

  /* ================= TODAY CARD ================= */
  BP.todayCards.push({
    order: 30,
    render() {
      const r = getPlan(); if (!r || !r.config.startDate) return '';
      const n = todayN(r), N = r.days.length, esc2 = esc;
      if (n < 1) {
        const left = 1 - n; if (left > 60) return '';
        const d = r.days[0];
        return `<section class="card"><div class="ct"><span>${OA.icon('calendar')} Trip plan</span><span class="sm dim">starts in ${left} day${left === 1 ? '' : 's'}</span></div><div class="sm">Day 1, ${esc2(fdate(d.date))}: mile ${mileTxt(d.fromMi)} to ${mileTxt(d.toMi)}, ${esc2(OA.dist(d.miles))}${d.camp ? ', camp at ' + esc2(d.camp.name) : d.town ? ', ' + esc2(d.town.name) : ''}.</div><div class="row"><button class="btn" data-go="plan">Open the plan</button></div></section>`;
      }
      if (n > N) return '';
      const d = r.days[n - 1], tm = r.days[n];
      const where = d.zero ? 'Zero day' + (d.town ? ' in ' + d.town.name : '') : d.finish ? 'Finish at ' + d.toName : d.town ? 'Town: ' + d.town.name + (d.hotel ? ' (hotel)' : '') : 'Camp: ' + (d.camp ? d.camp.name : d.toName);
      return `<section class="card"><div class="ct"><span>${OA.icon('calendar')} Today's plan</span><span class="sm dim">Day ${n} of ${N}</span></div>
        <div class="b">${d.zero ? 'Rest day' : 'Mile ' + mileTxt(d.fromMi) + ' to ' + mileTxt(d.toMi) + ' · ' + esc2(OA.dist(d.miles))}</div>
        <div class="sm">${esc2(where)}</div>
        ${d.water ? `<div class="sm">Water: carry about ${d.water.carryL} L (longest dry stretch ${esc2(OA.dist(d.water.gapMi))})</div>` : ''}
        <div class="sm">Food: ${d.foodLeft} day${d.foodLeft === 1 ? '' : 's'} to the next resupply</div>
        <div>${dayTags(d)}</div>
        ${tm ? `<div class="sm dim" style="margin-top:6px">Tomorrow: ${tm.kind === 'zero' ? 'zero day' : 'mile ' + mileTxt(tm.fromMi) + ' to ' + mileTxt(tm.toMi) + ', ' + esc2(OA.dist(tm.miles))}${tm.finish ? ' (finish)' : tm.town ? ', ' + esc2(tm.town.name) : tm.camp ? ', camp at ' + esc2(tm.camp.name) : ''}</div>` : ''}
        <div class="row"><button class="btn" data-act="planDay" data-n="${n}">Open today's plan</button></div></section>`;
    }
  });
})();
