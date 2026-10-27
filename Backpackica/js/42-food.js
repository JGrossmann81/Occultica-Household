/* Backpackica: Pack tab sections Food, Water and Body.
   Registers three BP.packSections entries (orders 20, 30, 40) and adds to BP.pack:
     foodCostPerDay()        average money per day from the prices the person typed (null if none)
     shoppingFor(days)       aggregated shopping list for the first N day menus {days, items, totals}
     consumablesLb()         food + water + fuel to carry at the start of the current stretch (lb). 40-pack.js reads this.
     kcalTargetPerDay()      daily calorie target (burn x percent planned) or null
     foodSummary()           {kcalTargetDay, foodLbPerDay, nextResupplyDays}  (numbers only, for the household publisher)
     healthicaWants()        the list of fields Backpackica would like from Healthica
   State: S.pack.food, S.pack.water, S.pack.body.
   Pure math lives in BP.foodCore so it can be tested without a browser. Health detail never leaves the phone: only totals are published. */
window.BP = window.BP || {};
BP.packSections = BP.packSections || [];
BP.pack = BP.pack || {};
BP.todayCards = BP.todayCards || [];
(function () {
  'use strict';
  const esc = OA.esc;
  const FOODS = window.TRAILFOODS || [], CATS = window.TRAILFOOD_CATS || [], SWAPS = window.TRAILFOOD_SWAPS || {};
  const FM = {}; FOODS.forEach(f => { FM[f.id] = f; });
  const G_OZ = 28.349523125, L_LB = 2.20462, LB_KG = 0.45359237, FLOZ_L = 33.814;
  const num = (v, d) => { v = parseFloat(v); return isFinite(v) ? v : (d == null ? 0 : d); };
  const SLOTS = [['b', 'Breakfast'], ['s', 'Snacks'], ['l', 'Lunch'], ['d', 'Dinner'], ['t', 'Treats']];
  const emptyMenu = () => ({ b: [], s: [], l: [], d: [], t: [] });
  const clone = o => JSON.parse(JSON.stringify(o));
  const KCAL_PER_OZ_DEFAULT = 125, FUEL_OZ_PER_DAY = 0.5, FUEL_ML_BASIS = 950;   // two 2-cup boils = about 950 ml

  /* ================================================================ pure math (BP.foodCore) */
  function dayTotals(menu, o) {
    o = o || {};
    const r = { kcal: 0, p: 0, c: 0, f: 0, carryG: 0, eatG: 0, hotMl: 0, coldMl: 0, n: 0 };
    SLOTS.forEach(s => ((menu && menu[s[0]]) || []).forEach(it => {
      const f = FM[it.id]; if (!f) return; const q = num(it.q, 1); if (q <= 0) return;
      r.n++; r.kcal += f.kcal * q; r.p += (f.protein || 0) * q; r.c += (f.carb || 0) * q; r.f += (f.fat || 0) * q;
      r.carryG += f.carry * q; r.eatG += f.g * q;
      if (f.cookMl) { if (o.coldSoak && f.coldSoak) r.coldMl += f.cookMl * q; else r.hotMl += f.cookMl * q; }
    }));
    r.oz = r.carryG / G_OZ; r.lb = r.oz / 16; r.density = r.oz > 0 ? r.kcal / r.oz : 0;
    return r;
  }
  function fuelOz(hotMl, o) {
    o = o || {}; if (!(hotMl > 0)) return 0;
    const per = o.type === 'alcohol' ? num(o.alcOzDay, 1) : FUEL_OZ_PER_DAY;
    return Math.max(0.1, per * hotMl / FUEL_ML_BASIS);
  }
  /* shopping aggregation: menus is an array of day menus; returns lines grouped later by category */
  function aggregate(menus) {
    const m = {};
    menus.forEach(menu => SLOTS.forEach(s => ((menu && menu[s[0]]) || []).forEach(it => {
      const f = FM[it.id]; if (!f) return; const q = num(it.q, 1); if (q <= 0) return;
      const a = m[it.id] = m[it.id] || { id: it.id, name: f.name, cat: f.cat, servings: 0, eatG: 0, carryG: 0, kcal: 0 };
      a.servings += q; a.eatG += f.g * q; a.carryG += f.carry * q; a.kcal += f.kcal * q;
    })));
    const items = Object.keys(m).map(k => m[k]);
    const order = {}; CATS.forEach((c, i) => { order[c.id] = i; });
    items.sort((a, b) => ((order[a.cat] == null ? 99 : order[a.cat]) - (order[b.cat] == null ? 99 : order[b.cat])) || a.name.localeCompare(b.name));
    const t = { kcal: 0, carryG: 0, eatG: 0 }; items.forEach(a => { t.kcal += a.kcal; t.carryG += a.carryG; t.eatG += a.eatG; });
    t.lb = t.carryG / G_OZ / 16; return { items, totals: t };
  }
  function waterRate(o) {
    o = o || {}; const t = o.tempF;
    const tf = t == null || !isFinite(t) ? 1 : t <= 40 ? 0.8 : t <= 60 ? 0.9 : t <= 75 ? 1 : t <= 85 ? 1.3 : t <= 95 ? 1.6 : 1.9;
    const ef = { easy: 0.8, mod: 1, hard: 1.25 }[o.exertion] || 1;
    const alt = num(o.altFt, 0), af = alt >= 10000 ? 1.15 : alt >= 8000 ? 1.1 : 1;
    const raw = 0.5 * tf * ef * af, lph = Math.min(1.2, Math.round(raw * 20) / 20);
    return { lph, capped: raw > 1.2, tf, ef, af };
  }
  function gapLiters(miles, paceMph, lph, reserveL) { const h = miles / Math.max(1, paceMph || 2.5); return { hours: h, drink: h * lph, total: h * lph + (reserveL || 0) }; }
  /* how many days a fresh food is good: halved when it is hot */
  function spoilDays(f, tempF) { if (!f || !(f.spoilDays > 0)) return 0; return tempF != null && tempF >= 85 ? Math.max(0.5, f.spoilDays / 2) : f.spoilDays; }
  /* weight (g carried) for a given calorie amount of one food */
  function gramsForKcal(f, kcal) { return f.kcal > 0 ? kcal * f.carry / f.kcal : 0; }
  function densityFor(f) { return f.carry > 0 ? f.kcal / (f.carry / G_OZ) : 0; }
  BP.foodCore = { dayTotals, fuelOz, aggregate, waterRate, gapLiters, spoilDays, gramsForKcal, densityFor, FM, SLOTS, G_OZ, L_LB };

  /* ================================================================ state */
  const DEF_FOOD = { pct: 85, kcalPerOz: KCAL_PER_OZ_DEFAULT, useBurn: true, kcal: 3000, mi: null, gain: null, nSnack: 4, nDays: 4, spare: 1, days: [], presets: [], mode: 'buy', firstNight: true, freshDays: 2, coldSoak: false, fuelType: 'canister', alcOzDay: 1, checks: {}, prices: {}, cmp: [], cmpKcal: 500, boxTo: '', touched: false };
  const DEF_WATER = { tempF: null, exertion: 'mod', altFt: 0, capL: 2, reserveL: 0.5, manualGaps: [], log: {}, carryL: 1.5, camp: 'dry' };
  const DEF_BODY = { weights: [], energy: {}, burnOverride: null };
  OA.defaults({ pack: { profile: {}, gear: [], lists: [], food: clone(DEF_FOOD), water: clone(DEF_WATER), body: clone(DEF_BODY) } });
  function P() { const s = OA.S; s.pack = s.pack || {}; return s.pack; }
  function fill(dst, def) { Object.keys(def).forEach(k => { if (dst[k] === undefined) dst[k] = clone(def[k]); }); return dst; }
  const F = () => { const p = P(); p.food = fill(p.food || {}, DEF_FOOD); return p.food; };
  const W = () => { const p = P(); p.water = fill(p.water || {}, DEF_WATER); return p.water; };
  const B = () => { const p = P(); p.body = fill(p.body || {}, DEF_BODY); return p.body; };
  function syncDays() {
    const f = F(); f.nDays = OA.clamp(Math.round(num(f.nDays, 4)), 1, 21);
    if (!Array.isArray(f.days)) f.days = [];
    while (f.days.length < f.nDays) f.days.push(f.days.length ? clone(f.days[f.days.length - 1]) : emptyMenu());
    if (f.days.length > f.nDays) f.days.length = f.nDays;
    f.days.forEach(d => SLOTS.forEach(s => { if (!Array.isArray(d[s[0]])) d[s[0]] = []; }));
    return f.days;
  }
  const ui = { food: 'plan', water: 'hydrate', body: 'check', day: 0, q: '', cat: '', pickSlot: 'b', pickCmp: false, limit: 40 };

  /* ================================================================ display helpers */
  const metricW = () => OA.unit.wt() === 'kg';
  const fwG = g => metricW() ? (g < 1000 ? Math.round(g) + ' g' : OA.round(g / 1000, 2) + ' kg') : (g / G_OZ < 16 ? OA.round(g / G_OZ, 1) + ' oz' : OA.round(g / G_OZ / 16, 2) + ' lb');
  const fwLb = lb => OA.wt(lb, 1);
  const fL = l => OA.round(l, 1) + ' L' + (metricW() ? '' : ' (' + Math.round(l * FLOZ_L) + ' fl oz)');
  const fk = n => Math.round(n).toLocaleString();
  const chips = (arr, cur, act, extra) => `<div class="chips wrap">${arr.map(a => `<button class="chip ${a[0] === cur ? 'on' : ''}" data-act="${act}" data-v="${esc(a[0])}" ${extra || ''}>${esc(a[1])}</button>`).join('')}</div>`;
  const tagKind = f => ({ dry: '<span class="tag g">dry</span>', wet: '<span class="tag w">wet</span>', fresh: '<span class="tag w">fresh</span>', treat: '<span class="tag">treat</span>', 'drink-mix': '<span class="tag">drink mix</span>', 'meal-dehydrated': '<span class="tag g">dehydrated meal</span>', 'meal-fresh': '<span class="tag w">town meal</span>' }[f.kind] || '');
  const bx = (v) => v != null && v !== '' ? `value="${esc(v)}"` : '';
  const fmtTempIn = f => f == null ? '' : (OA.unit.temp() === 'C' ? Math.round((f - 32) * 5 / 9) : Math.round(f));
  const tempUnitLabel = () => OA.unit.temp() === 'C' ? '°C' : '°F';
  function bpx(ns, fn) { try { const o = window.BP && BP[ns]; return o && typeof o[fn] === 'function' ? o[fn]() : null; } catch (e) { return null; } }

  /* ================================================================ calorie target */
  let guard = 0, lastCons = 0;
  function burnPerDay() {
    const f = F();
    if (f.useBurn && window.BP && BP.pack && typeof BP.pack.burnPerDay === 'function') {
      try {
        const pr = typeof BP.pack.profile === 'function' ? BP.pack.profile() : null;
        const mi = num(f.mi, 0) || null;
        if (mi) { const g = f.gain != null && f.gain !== '' ? num(f.gain) : mi * 120; return { kcal: BP.pack.burnPerDay({ miles: mi, gainFt: g, lossFt: g }).kcalTotal, src: 'burn model, ' + OA.dist(mi) + ' day' }; }
        if (typeof BP.pack.summary === 'function') { const s = BP.pack.summary(); if (s && s.kcalBurnDay > 0) return { kcal: s.kcalBurnDay, src: 'burn model, typical day' + (pr ? ' at ' + OA.round(pr.paceMph * pr.hoursPerDay, 0) + ' mi' : '') }; }
      } catch (e) { }
    }
    return null;
  }
  function target() {
    const f = F(), pct = OA.clamp(num(f.pct, 85), 50, 130), b = burnPerDay();
    if (b) return { burn: b.kcal, kcal: Math.round(b.kcal * pct / 100 / 10) * 10, pct, src: b.src, auto: true };
    const k = num(f.kcal, 0);
    return k > 0 ? { burn: null, kcal: Math.round(k), pct: null, src: 'the number you typed', auto: false } : null;
  }
  function targetLbPerDay() { const t = target(), f = F(); return t ? t.kcal / Math.max(60, num(f.kcalPerOz, KCAL_PER_OZ_DEFAULT)) / 16 : null; }

  /* ================================================================ built-in menu presets */
  const BUILTIN = [
    { id: 'p-nocook', name: 'No-cook', note: 'Cold-soaked oats, wraps and no stove at all.', menu: { b: [['oats-rolled', 1.5], ['milk-whole-pwd', 1], ['seed-chia', 1], ['fruit-raisin', 1], ['pb-jar', 1]], s: [['bar-fruitnut', 2], ['trailmix', 1.5], ['fruit-date', 2], ['jerky-beef', 1]], l: [['tort-big', 2], ['pb-jar', 1.5], ['honey', 1]], d: [['tort-big', 2], ['tuna-pouch', 1], ['cheddar', 2], ['oil-olive', 1], ['couscous', 1]], t: [['choc-dark', 1]] } },
    { id: 'p-stove', name: 'Stove dinners', note: 'Cold or no-cook day, one hot freeze-dried dinner with oil.', menu: { b: [['oats-rolled', 1.5], ['milk-whole-pwd', 1], ['nut-walnut', 1], ['sugar-brown', 1], ['coffee-instant', 1]], s: [['bar-fruitnut', 2], ['trailmix', 1.5], ['jerky-beef', 1], ['fruit-date', 2]], l: [['tort-big', 2], ['cheddar', 2], ['salami-dry', 1]], d: [['meal-ricechicken', 1], ['oil-olive', 1]], t: [['choc-milk', 1], ['cocoa-mix', 1]] } },
    { id: 'p-hotbk', name: 'Hot breakfast', note: 'Hot oatmeal and coffee, potato-and-cheese dinner.', menu: { b: [['oats-rolled', 2], ['milk-whole-pwd', 1], ['almond-butter', 1], ['fruit-cranberry', 1], ['coffee-3in1', 1]], s: [['bar-protein', 1], ['nut-cashew', 2], ['fruit-apricot', 2]], l: [['tort-big', 2], ['pb-jar', 2], ['jam', 1]], d: [['potato-flakes', 2], ['cheddar', 2], ['salami-dry', 1], ['oil-olive', 1]], t: [['cookie-choc', 2]] } }
  ];
  function presetMenu(p) { const m = emptyMenu(); SLOTS.forEach(s => { m[s[0]] = ((p.menu && p.menu[s[0]]) || []).map(a => Array.isArray(a) ? { id: a[0], q: a[1] } : { id: a.id, q: a.q }).filter(a => FM[a.id]); }); return m; }
  const allPresets = () => BUILTIN.concat(F().presets.map(p => Object.assign({ saved: true }, p)));

  /* ================================================================ public API on BP.pack */
  function stretchMenus() {
    const f = F(), d = syncDays(), spare = Math.max(0, num(f.spare, 0)), menus = d.slice();
    const whole = Math.floor(spare), frac = spare - whole;
    for (let i = 0; i < whole; i++) menus.push(d[d.length - 1]);
    return { menus, fracDay: frac > 0 ? d[d.length - 1] : null, frac };
  }
  function allMenusFor(n) {
    const d = syncDays(), out = [];
    for (let i = 0; i < n; i++) out.push(d[Math.min(i, d.length - 1)]);
    return out;
  }
  BP.pack.shoppingFor = function (days) {
    const n = Math.max(1, Math.round(num(days, F().nDays)));
    const r = aggregate(allMenusFor(n)); r.days = n; return r;
  };
  function fullShopping() {
    const f = F(), sm = stretchMenus(), r = aggregate(sm.menus);
    if (sm.fracDay) { const half = aggregate([sm.fracDay]); half.items.forEach(h => { const a = r.items.find(x => x.id === h.id); const k = sm.frac; if (a) { a.servings += h.servings * k; a.eatG += h.eatG * k; a.carryG += h.carryG * k; a.kcal += h.kcal * k; } else { r.items.push({ id: h.id, name: h.name, cat: h.cat, servings: h.servings * k, eatG: h.eatG * k, carryG: h.carryG * k, kcal: h.kcal * k }); } }); const t = { kcal: 0, carryG: 0, eatG: 0 }; r.items.forEach(a => { t.kcal += a.kcal; t.carryG += a.carryG; t.eatG += a.eatG; }); t.lb = t.carryG / G_OZ / 16; r.totals = t; const order = {}; CATS.forEach((c, i) => { order[c.id] = i; }); r.items.sort((a, b) => ((order[a.cat] == null ? 99 : order[a.cat]) - (order[b.cat] == null ? 99 : order[b.cat])) || a.name.localeCompare(b.name)); }
    r.days = f.nDays; r.spare = num(f.spare, 0); return r;
  }
  function stretchFuel() {
    const f = F(), d = syncDays(); let oz = 0, hot = 0;
    d.forEach(m => { const t = dayTotals(m, { coldSoak: f.coldSoak }); oz += fuelOz(t.hotMl, f); hot += t.hotMl; });
    const sp = Math.max(0, num(f.spare, 0)); if (sp > 0 && d.length) { const t = dayTotals(d[d.length - 1], { coldSoak: f.coldSoak }); oz += fuelOz(t.hotMl, f) * sp; }
    return { oz, hotMl: hot };
  }
  BP.pack.foodCostPerDay = function () {
    const f = F(), v = Object.keys(f.prices || {}).reduce((s, k) => s + num(f.prices[k], 0), 0);
    return v > 0 ? v / Math.max(1, f.nDays) : null;
  };
  BP.pack.kcalTargetPerDay = function () { const t = target(); return t ? t.kcal : null; };
  function waterCarryL() { return Math.max(0, num(W().carryL, 1)); }
  BP.pack.consumablesLb = function () {
    if (guard) return lastCons;
    guard++;
    try {
      const f = F(), d = syncDays(), hasMenu = d.some(m => dayTotals(m).n > 0);
      let foodLb = 0;
      if (hasMenu) { const sm = stretchMenus(); foodLb = OA.sum(sm.menus, m => dayTotals(m).lb) + (sm.fracDay ? dayTotals(sm.fracDay).lb * sm.frac : 0); }
      else { const tl = targetLbPerDay(); foodLb = tl && f.touched ? tl * (f.nDays + num(f.spare, 0)) : 0; }
      const waterLb = f.touched || hasMenu ? waterCarryL() * L_LB : 0;
      const fuelLb = hasMenu ? stretchFuel().oz / 16 : 0;
      lastCons = Math.round((foodLb + waterLb + fuelLb) * 10) / 10;
      return lastCons;
    } catch (e) { return lastCons; } finally { guard--; }
  };
  function resupplyDays() {
    const nt = bpx('plan', 'nextTown');
    if (nt && nt.date) { const n = OA.daysBetween(OA.dkey(), nt.date); if (n >= 1 && n < 60) return n; }
    if (nt && nt.mi > 0) { const pr = window.BP && BP.pack && BP.pack.profile ? BP.pack.profile() : null; const mpd = Math.max(5, F().mi || (pr ? pr.paceMph * pr.hoursPerDay : 15)); return Math.max(1, Math.ceil(nt.mi / mpd)); }
    return null;
  }
  BP.pack.foodSummary = function () {
    const t = target(), f = F(), hasMenu = syncDays().some(m => dayTotals(m).n > 0);
    const d0 = hasMenu ? dayTotals(syncDays()[0]) : null;
    return { kcalTargetDay: t ? t.kcal : 0, foodLbPerDay: d0 ? OA.round(d0.lb, 2) : (targetLbPerDay() ? OA.round(targetLbPerDay(), 2) : 0), nextResupplyDays: resupplyDays() || (hasMenu ? f.nDays : 0) };
  };
  BP.pack.healthicaWants = function () {
    return [
      { key: 'body.kg', type: 'number', unit: 'kg', why: 'Body weight, to check the burn estimate and the pace of any weight change.' },
      { key: 'body.tdee', type: 'number', unit: 'kcal/day', why: 'Everyday energy use away from the trail, a sanity check on the trail burn number.' },
      { key: 'body.kcalTarget', type: 'number', unit: 'kcal/day', why: 'Your usual daily calorie goal, shown next to the trail target for comparison.' },
      { key: 'body.units', type: 'text', unit: "'lb' or 'kg'", why: 'So weights show in the unit you use.' }
    ];
  };
  function healthicaWantsText() {
    return 'BACKPACKICA WOULD LIKE FROM HEALTHICA (optional, summary numbers only)\n\n' +
      BP.pack.healthicaWants().map(w => '  ' + w.key + ' (' + w.unit + '): ' + w.why).join('\n') +
      '\n\nBackpackica publishes back only these totals: kcalTargetDay, kcalBurnDay, packLb. No health records, no weights, no notes, no body measurements leave this phone.';
  }

  /* ================================================================ shared small UI */
  function copyText(t) {
    const fb = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); OA.toast('Copied.'); } catch (e) { OA.toast('Could not copy. Select the text and copy it by hand.', 4000); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => OA.toast('Copied.')).catch(fb); else fb();
  }
  const sub = (cur, arr, act) => `<div class="chips wrap">${arr.map(a => `<button class="chip ${a[0] === cur ? 'on' : ''}" data-act="${act}" data-v="${a[0]}">${esc(a[1])}</button>`).join('')}</div>`;
  const field = (label, path, o) => { o = o || {}; return `<label class="fl">${esc(label)}<input class="in" type="${o.type || 'number'}" inputmode="${o.inm || 'decimal'}" data-bind="${path}" data-type="${o.dt || 'number'}" data-then="${o.then || 'foodRedraw'}" ${bx(OA.getPath(OA.S, path))} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}></label>`; };

  /* ================================================================ FOOD */
  function renderFood(el) {
    const f = F(); syncDays();
    const views = [['plan', 'Target'], ['menu', 'Menu'], ['shop', 'Shopping'], ['drywet', 'Dry vs wet'], ['fuel', 'Fuel']];
    el.innerHTML = sub(ui.food, views, 'foodView') + ({ plan: foodPlan, menu: foodMenu, shop: foodShop, drywet: foodDryWet, fuel: foodFuel }[ui.food] || foodPlan)() +
      `<p class="xs dim">Nutrition numbers are typical generic values (USDA FoodData Central or a typical package label). Packaged foods differ by brand: read your own label.</p>`;
  }

  function foodPlan() {
    const f = F(), t = target(), tl = targetLbPerDay(), kpo = num(f.kcalPerOz, KCAL_PER_OZ_DEFAULT);
    const d0 = syncDays()[Math.min(ui.day, f.nDays - 1)], tot = dayTotals(d0, f), has = tot.n > 0;
    let h = `<section class="card"><div class="ct"><span>${OA.icon('fork')} Daily calorie target</span></div>`;
    if (t && t.auto) {
      h += `<div class="stat"><div><b>${fk(t.burn)}</b><span>BURN / DAY</span></div><div><b>${t.pct}%</b><span>PLAN TO EAT</span></div><div><b>${fk(t.kcal)}</b><span>TARGET KCAL</span></div></div><div class="xs dim">Burn from the ${esc(t.src)} (Pack, Burn).</div>`;
    } else {
      h += `<p class="sm dim">The burn model is not available yet. Type a daily calorie goal, or fill in the Burn section.</p>` + field('Calories per day', 'pack.food.kcal', { then: 'foodTouch' });
    }
    h += `<label class="fl">Percent of burn I plan to eat: <b>${esc(f.pct)}%</b><input type="range" min="60" max="110" step="5" value="${esc(f.pct)}" data-bind="pack.food.pct" data-type="number" data-then="foodTouch"></label>
      <div class="xs dim">Most hikers cannot eat everything they burn on the trail (it will not fit in the pack or the stomach), so planning about 85% is common. Appetite usually climbs after a couple of weeks (hiker hunger), so 90 to 100% is common later.</div>
      <div class="two">${field('My typical day: miles', 'pack.food.mi', { then: 'foodTouch', ph: 'from Burn' })}${field('Climb that day (ft)', 'pack.food.gain', { then: 'foodTouch', ph: 'about 120 per mile' })}</div></section>`;

    if (t) {
      const oz = t.kcal / kpo, lb = oz / 16;
      h += `<section class="card"><div class="ct"><span>${OA.icon('scale')} The weight math</span></div>
        <p class="sm"><b>Energy density</b> is calories divided by ounces carried. Trail rations usually run about 100 to 125 calories per ounce, and the higher the number the less you carry.</p>
        <label class="fl">Energy density I am aiming for (calories per ounce)<input class="in" type="number" inputmode="decimal" data-bind="pack.food.kcalPerOz" data-type="number" data-then="foodRedraw" value="${esc(kpo)}"></label>
        <div class="card inner"><div class="b">${fk(t.kcal)} kcal at ${esc(kpo)} kcal per ounce = ${OA.round(oz, 0)} oz = ${OA.round(lb, 2)} lb of food per day</div><div class="xs dim">For example, 4,000 kcal at 125 kcal per ounce is 32 oz, or 2 lb, per day. A week without a resupply is ${OA.round(lb * 7, 1)} lb of food at your numbers.</div></div>`;
      if (has) {
        const dens = tot.density, short = t.kcal - tot.kcal, heavy = dens > 0 && dens < kpo * 0.9, light = dens > kpo * 1.25;
        const pct = OA.clamp(dens / (kpo * 1.5) * 100, 3, 100), tgt = kpo / (kpo * 1.5) * 100;
        h += `<div class="meter"><div class="mt"><b>Day ${ui.day + 1} menu: ${OA.round(dens, 0)} kcal per oz</b><span>${fk(tot.kcal)} kcal, ${esc(fwG(tot.carryG))}</span></div>
          <div class="bar" style="position:relative"><i style="width:${pct}%;${heavy ? 'background:var(--warn)' : ''}"></i><span style="position:absolute;left:${tgt}%;top:-2px;bottom:-2px;width:2px;background:var(--gold)"></span></div></div>`;
        h += heavy ? `<div class="alert"><b class="t">Your food is heavier than your target</b>This day is ${OA.round(dens, 0)} kcal per oz and the goal is ${esc(kpo)}. Wet or fresh foods and light-calorie items (fruit, bread, cans) pull the number down. Try the Dry vs wet tab, or add olive oil, nut butter or nuts.</div>`
          : light ? `<div class="alert ok"><b class="t">Very light food</b>This day is ${OA.round(dens, 0)} kcal per oz, well above your goal. Check that it is still food you will want to eat day after day, and that you have enough fat and protein.</div>` : `<div class="alert ok"><b class="t">Weight is on target</b>${OA.round(dens, 0)} kcal per oz is close to your goal of ${esc(kpo)}.</div>`;
        if (short > 150) h += `<div class="alert"><b class="t">About ${fk(short)} kcal short of your target</b>Olive oil is about 250 kcal per ounce, so roughly ${OA.round(short / 250, 1)} oz of oil (or peanut butter at about 170 kcal per ounce) closes the gap for little weight.</div>`;
        else if (short < -250) h += `<div class="alert"><b class="t">About ${fk(-short)} kcal over your target</b>That is fine if you are burning more than the estimate. Otherwise you are carrying food you may not eat.</div>`;
      } else h += `<p class="sm dim">Build a day in the Menu tab and a meter will show whether your food is too heavy or too light for this target.</p>`;
      h += `</section>`;
    }
    const nt = bpx('plan', 'nextTown'), sd = resupplyDays();
    h += `<section class="card"><div class="ct"><span>${OA.icon('pin')} Resupply stretch</span></div>`;
    if (nt && nt.name) h += `<p class="sm">Next town in your plan: <b>${esc(nt.name)}</b>${nt.mi != null ? ' · ' + esc(OA.dist(nt.mi)) : ''}${nt.date ? ' · ' + esc(OA.fmtDate(nt.date)) : ''}.</p>` + (sd ? `<button class="btn" data-act="foodUseDays" data-n="${sd}">Plan ${sd} day${sd === 1 ? '' : 's'} of food</button>` : '');
    else h += `<p class="sm dim">No next town in your plan yet, so tell me how many days until you can resupply.</p>`;
    h += `<div class="two">${field('Days of food to carry', 'pack.food.nDays', { then: 'foodDaysChanged' })}${field('Extra days for delays', 'pack.food.spare', { then: 'foodRedraw', ph: '1' })}</div><div class="xs dim">One extra day of food is a common safety margin on a remote stretch. Weather, a wrong turn or an injury can add a day.</div></section>`;
    h += healthicaCompare();
    return h;
  }
  function healthicaCompare() {
    let hb = null; try { const h = window.OCC && OCC.get('healthica'); hb = h && h.data && h.data.body; } catch (e) { }
    if (!hb) return '';
    const bits = []; if (hb.kcalTarget) bits.push('usual daily goal ' + fk(hb.kcalTarget) + ' kcal'); if (hb.tdee) bits.push('everyday use about ' + fk(hb.tdee) + ' kcal');
    return bits.length ? `<section class="card tip"><div class="ct"><span>Paired with Healthica</span></div><p class="sm">Healthica shared: ${esc(bits.join(', '))}. Trail days burn much more than everyday life, so expect the trail target to be higher.</p></section>` : '';
  }

  /* ---------------------------------------------------------------- menu builder */
  function foodMenu() {
    const f = F(), days = syncDays(); ui.day = OA.clamp(ui.day, 0, f.nDays - 1);
    const m = days[ui.day], tot = dayTotals(m, f), t = target();
    let h = `<section class="card"><div class="ct"><span>Menu for ${f.nDays} day${f.nDays === 1 ? '' : 's'}</span></div>
      <div class="chips wrap">${days.map((d, i) => `<button class="chip ${i === ui.day ? 'on' : ''}" data-act="foodDay" data-i="${i}">Day ${i + 1}</button>`).join('')}</div>
      <div class="stat"><div><b>${fk(tot.kcal)}</b><span>KCAL${t ? ' OF ' + fk(t.kcal) : ''}</span></div><div><b>${esc(fwG(tot.carryG))}</b><span>WEIGHT</span></div><div><b>${tot.n ? OA.round(tot.density, 0) : '–'}</b><span>KCAL / OZ</span></div></div>`;
    if (t && tot.n) {
      const d = tot.kcal - t.kcal; h += `<div class="bar"><i style="width:${OA.clamp(tot.kcal / t.kcal * 100, 2, 100)}%;${d < -300 ? 'background:var(--warn)' : ''}"></i></div><div class="xs dim">${d < -150 ? fk(-d) + ' kcal below your target' : d > 250 ? fk(d) + ' kcal above your target' : 'About at your target'}. Protein ${Math.round(tot.p)} g, fat ${Math.round(tot.f)} g, carbs ${Math.round(tot.c)} g.</div>`;
    } else if (tot.n) h += `<div class="xs dim">Protein ${Math.round(tot.p)} g, fat ${Math.round(tot.f)} g, carbs ${Math.round(tot.c)} g.</div>`;
    h += `</section>`;
    SLOTS.forEach(s => {
      const items = m[s[0]], sk = items.reduce((a, it) => a + (FM[it.id] ? FM[it.id].kcal * num(it.q, 1) : 0), 0);
      const label = s[0] === 's' ? `Snacks (about ${f.nSnack} through the day)` : s[1];
      h += `<section class="card"><div class="ct"><span>${esc(label)}</span><span class="sm dim">${fk(sk)} kcal${s[0] === 's' && f.nSnack > 0 && sk ? ', about ' + fk(sk / f.nSnack) + ' each' : ''}</span></div>`;
      if (!items.length) h += `<p class="sm dim">Nothing yet.</p>`;
      items.forEach((it, i) => {
        const fd = FM[it.id]; if (!fd) return; const q = num(it.q, 1);
        h += `<div class="li" style="cursor:default"><div class="tx"><b>${esc(fd.name)}</b><span>${OA.round(q, 1)} × ${esc(fd.serving)} · ${fk(fd.kcal * q)} kcal · ${esc(fwG(fd.carry * q))} ${tagKind(fd)}${fd.cookMl ? `<span class="tag">${f.coldSoak && fd.coldSoak ? 'cold soak' : 'needs ' + Math.round(fd.cookMl * q) + ' ml hot water'}</span>` : ''}</span></div>
          <div class="end" style="display:flex;gap:4px"><button class="mini" data-act="foodQ" data-s="${s[0]}" data-i="${i}" data-d="-0.5" aria-label="Less" style="min-width:44px;min-height:44px">−</button><button class="mini" data-act="foodQ" data-s="${s[0]}" data-i="${i}" data-d="0.5" aria-label="More" style="min-width:44px;min-height:44px">+</button></div></div>`;
      });
      h += `<button class="btn block" data-act="foodPick" data-s="${s[0]}">Add to ${esc(s[1].toLowerCase())}</button></section>`;
    });
    h += `<section class="card"><div class="ct"><span>Presets and copying</span></div>
      <label class="fl">Snacks per day (for planning how often to eat)<input class="in" type="number" inputmode="numeric" data-bind="pack.food.nSnack" data-type="number" data-then="foodRedraw" value="${esc(f.nSnack)}"></label>
      <div class="chips wrap">${allPresets().map(p => `<button class="chip" data-act="foodLoadPreset" data-id="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</div>
      <div class="xs dim">Tap a preset to fill the whole day shown above. ${BUILTIN.map(p => esc(p.name) + ': ' + esc(p.note)).join(' ')}</div>
      <div class="row"><button class="btn" data-act="foodCopyAll">Copy this day to all days</button><button class="btn" data-act="foodSavePreset">Save as preset</button></div>
      <div class="row"><button class="btn danger" data-act="foodClearDay">Clear this day</button></div>
      ${f.presets.length ? `<div class="chips wrap">${f.presets.map(p => `<button class="chip" data-act="foodDelPreset" data-id="${esc(p.id)}">Delete ${esc(p.name)}</button>`).join('')}</div>` : ''}</section>`;
    h += menuWarnings();
    return h;
  }
  /* spoilage and weight flags across the stretch */
  function menuWarnings() {
    const f = F(), days = syncDays(), temp = W().tempF, out = [], seen = {};
    days.forEach((m, di) => SLOTS.forEach(s => (m[s[0]] || []).forEach(it => {
      const fd = FM[it.id]; if (!fd) return; const day = di + 1, sp = spoilDays(fd, temp), key = it.id + ':' + day;
      if (sp > 0 && day > sp && !seen[key]) { seen[key] = 1; out.push({ r: true, t: `Day ${day}: ${fd.name} should be eaten within about ${sp < 1 ? 'half a day' : OA.round(sp, 1) + ' day' + (sp === 1 ? '' : 's')} when carried without refrigeration${temp != null && temp >= 85 ? ' (shorter in this heat)' : ''}; this is a rule of thumb, not a guarantee. ${fd.shelf}.${sp <= 2 ? ' Food-safety agencies say perishable food left above 40 F for more than 2 hours (1 hour above 90 F) should be thrown away.' : ''}` }); }
      else if (f.firstNight && day > f.freshDays && (fd.kind === 'fresh' || fd.kind === 'meal-fresh') && !seen[it.id]) { seen[it.id] = 1; out.push({ r: false, t: `Day ${day}: ${fd.name} is a fresh food. With first-night mode on, fresh food is for the first ${f.freshDays} day${f.freshDays === 1 ? '' : 's'}; later days are dry.` }); }
      if (temp != null && temp >= 80 && /melts/i.test(fd.shelf) && !seen['m' + it.id]) { seen['m' + it.id] = 1; out.push({ r: false, t: `${fd.name} melts in heat. Keep it deep in the pack.` }); }
    })));
    if (!out.length) return '';
    return `<section class="card"><div class="ct"><span>${OA.icon('alert')} Check these</span></div>${out.slice(0, 12).map(o => `<div class="alert ${o.r ? 'danger' : ''}" style="margin:6px 0">${esc(o.t)}</div>`).join('')}</section>`;
  }

  /* ---------------------------------------------------------------- picker sheet */
  function pickerRows() {
    const q = ui.q.trim().toLowerCase();
    let L = FOODS.filter(f => (!ui.cat || f.cat === ui.cat) && (!q || (f.name + ' ' + f.cat + ' ' + f.kind).toLowerCase().indexOf(q) >= 0));
    L.sort((a, b) => a.name.localeCompare(b.name));
    const total = L.length; L = L.slice(0, ui.limit);
    return L.map(f => `<div class="li" data-act="fdAdd" data-id="${esc(f.id)}" role="button"><div class="tx"><b>${esc(f.name)}</b><span>${esc(f.serving)} · ${f.kcal} kcal · ${OA.round(densityFor(f), 0)} kcal/oz ${tagKind(f)}</span></div><div class="end"><span class="mini">${ui.pickCmp ? 'Compare' : 'Add'}</span></div></div>`).join('') +
      (total > L.length ? `<button class="btn block" data-act="fdMore">Show more (${total - L.length} left)</button>` : '') + (!total ? '<p class="sm dim">No match. Try another word or clear the category.</p>' : '');
  }
  function openPicker(slot, cmp) {
    ui.pickSlot = slot; ui.pickCmp = !!cmp; ui.q = ''; ui.cat = ''; ui.limit = 40;
    OA.sheet(cmp ? 'Add a food to compare' : 'Add food', `<input class="in" id="fdq" type="search" placeholder="Search foods (tortilla, oats, jerky...)" autocomplete="off">
      <div class="chips"><button class="chip on" data-act="fdCat" data-v="">All</button>${CATS.map(c => `<button class="chip" data-act="fdCat" data-v="${c.id}">${esc(c.label)}</button>`).join('')}</div><div id="fdlist">${pickerRows()}</div>
      <p class="xs dim">${FOODS.length} generic foods. Tap a food to add one serving; you can change the amount afterwards. Close this sheet when you are done.</p>`, {
      onOpen(root) {
        const i = root.querySelector('#fdq'); let t = null;
        i.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { ui.q = i.value; ui.limit = 40; const l = root.querySelector('#fdlist'); if (l) l.innerHTML = pickerRows(); }, 150); });
      }
    });
  }

  /* ---------------------------------------------------------------- shopping */
  function shopText(r) {
    const f = F(), nt = f.mode === 'box';
    let s = (nt ? 'RESUPPLY BOX PACKING LIST' : 'SHOPPING LIST') + '\n' + f.nDays + ' day' + (f.nDays === 1 ? '' : 's') + (f.spare > 0 ? ' plus ' + f.spare + ' spare' : '') + ' · ' + (nt ? 'mail a box' : 'buy in town') + '\n';
    s += 'Total: about ' + fwG(r.totals.carryG) + ' of food, ' + fk(r.totals.kcal) + ' kcal (' + fk(r.totals.kcal / Math.max(1, f.nDays + num(f.spare, 0))) + ' kcal per day)\n';
    let cat = ''; r.items.forEach(a => {
      const c = CATS.find(x => x.id === a.cat); if (c && c.id !== cat) { cat = c.id; s += '\n' + c.label.toUpperCase() + '\n'; }
      const fd = FM[a.id], q = Math.ceil(a.servings * 2) / 2, price = num(f.prices[a.id], 0);
      s += (f.checks[a.id] ? '[x] ' : '[ ] ') + q + ' × ' + a.name + ' (' + (fd ? fd.serving : '') + ') = ' + fwG(a.carryG) + (price > 0 ? ' · $' + price.toFixed(2) : '') + '\n';
    });
    const fu = stretchFuel(); if (fu.oz > 0) s += '\nFUEL\n' + (f.fuelType === 'alcohol' ? 'Alcohol stove fuel' : 'Canister fuel') + ': about ' + OA.round(fu.oz, 1) + ' oz for the stretch (an estimate: see the Fuel tab)\n';
    if (nt) s += '\nBOX NOTES\nTo: ' + (f.boxTo || '(name, place and address of where you will pick it up)') + '\nAsk the post office or business how long they hold packages: it varies. Do not mail fuel canisters or other flammable or hazardous items; buy fuel in town.\n';
    return s;
  }
  function foodShop() {
    const f = F(), r = fullShopping(), has = r.items.length > 0;
    let h = `<section class="card"><div class="ct"><span>${OA.icon('cart')} Shopping list</span><span class="sm dim">${f.nDays} day${f.nDays === 1 ? '' : 's'}${f.spare > 0 ? ' + ' + esc(f.spare) + ' spare' : ''}</span></div>`;
    h += chips([['buy', 'Buy in town'], ['box', 'Mail a box']], f.mode, 'foodMode');
    if (!has) return h + `<p class="sm dim">The list is built from your daily menus. Build a day in the Menu tab, copy it to all days, and the totals appear here.</p><button class="btn gold block" data-act="foodView" data-v="menu">Build a menu</button></section>`;
    h += `<div class="stat"><div><b>${esc(fwG(r.totals.carryG))}</b><span>FOOD WEIGHT</span></div><div><b>${fk(r.totals.kcal)}</b><span>TOTAL KCAL</span></div><div><b>${fk(r.totals.kcal / Math.max(1, f.nDays + num(f.spare, 0)))}</b><span>KCAL / DAY</span></div></div>`;
    let cat = '';
    r.items.forEach(a => {
      const c = CATS.find(x => x.id === a.cat); if (c && c.id !== cat) { cat = c.id; h += `<h3 style="color:var(--gold)">${esc(c.label)}</h3>`; }
      const fd = FM[a.id], q = Math.ceil(a.servings * 2) / 2, on = !!f.checks[a.id];
      h += `<div class="li" style="cursor:default"><label class="chk" style="flex:1;min-width:0;padding:0"><input type="checkbox" data-act="foodCheck" data-id="${esc(a.id)}" ${on ? 'checked' : ''}><span class="tx" style="${on ? 'text-decoration:line-through;opacity:.6' : ''}"><b>${q} × ${esc(a.name)}</b><span>${esc(fd ? fd.serving : '')} each · ${esc(fwG(a.carryG))} · ${fk(a.kcal)} kcal</span></span></label>
        <input class="in" style="width:84px;margin:0" type="number" inputmode="decimal" placeholder="$" aria-label="Price in dollars for ${esc(a.name)}" data-bind="pack.food.prices.${esc(a.id)}" data-type="number" data-then="foodRedraw" ${bx(f.prices[a.id])}></div>`;
    });
    const cpd = BP.pack.foodCostPerDay(), fu = stretchFuel();
    h += `<div class="xs dim">Type a price on a line if you want a cost estimate. Prices are yours; the app has no price data.</div>`;
    if (cpd) h += `<div class="kv"><span>Your typed prices come to</span><b>${esc(OA.money2(cpd * f.nDays))}, about ${esc(OA.money2(cpd))} per day</b></div>`;
    if (fu.oz > 0) h += `<div class="kv"><span>${f.fuelType === 'alcohol' ? 'Stove fuel (alcohol)' : 'Stove fuel (canister)'}</span><b>about ${OA.round(fu.oz, 1)} oz</b></div>`;
    if (f.mode === 'box') h += `<div class="card inner"><label class="fl">Mail the box to (name and address, or a business that holds packages)<textarea class="in" rows="3" data-bind="pack.food.boxTo" data-type="text">${esc(f.boxTo)}</textarea></label><div class="xs dim">Ask the post office or business how long they will hold a package: it varies. Fuel canisters and other flammable or hazardous items generally cannot be mailed, so buy fuel in town. A box costs postage and needs you to arrive during open hours; buying in town costs more per item in small stores. Weigh up both for each stop.</div></div>`;
    h += `<div class="row"><button class="btn" data-act="foodCopyList">Copy</button><button class="btn" data-act="foodShareList">Share</button><button class="btn" data-act="foodPrintList">Print</button></div>
      <div class="row"><button class="btn" data-act="foodUncheck">Uncheck all</button></div></section>`;
    return h;
  }

  /* ---------------------------------------------------------------- dry vs wet */
  const EXAMPLES = [['Fruit', ['fresh-apple', 'fruit-apple', 'fresh-banana', 'fruit-bananachip', 'fruit-raisin']], ['Dinner base', ['beans-can-black', 'beans-refried', 'rice-pouch', 'rice-instant', 'potato-flakes']], ['Protein', ['tuna-can-water', 'tuna-pouch', 'jerky-beef', 'egg-boiled', 'cheddar']]];
  function foodDryWet() {
    const f = F(), kc = OA.clamp(num(f.cmpKcal, 500), 50, 5000), ids = (f.cmp || []).filter(id => FM[id]);
    let h = `<section class="card"><div class="ct"><span>Dry vs wet: same calories, how much weight?</span></div>
      <p class="sm">Water is heavy (1 L weighs 2.2 lb) and gives no calories. A food that is mostly water costs you weight for every calorie. Pick foods to compare at the same calorie amount.</p>
      <label class="fl">Calories to compare<input class="in" type="number" inputmode="numeric" data-bind="pack.food.cmpKcal" data-type="number" data-then="foodRedraw" value="${esc(kc)}"></label>
      <div class="chips wrap">${EXAMPLES.map((e, i) => `<button class="chip" data-act="foodExample" data-i="${i}">Example: ${esc(e[0])}</button>`).join('')}</div>`;
    if (ids.length) {
      const rows = ids.map(id => { const fd = FM[id]; return { fd, g: gramsForKcal(fd, kc) }; }).sort((a, b) => a.g - b.g), mx = rows[rows.length - 1].g || 1;
      h += `<div class="scroll-x"><table class="t"><tr><th>Food</th><th>Weight for ${fk(kc)} kcal</th></tr>${rows.map(r => `<tr><td>${esc(r.fd.name)} ${tagKind(r.fd)}<div class="xs dim">${OA.round(densityFor(r.fd), 0)} kcal/oz${r.fd.waterPct != null ? ' · ' + r.fd.waterPct + '% water' : ''}</div><div class="bar" style="margin-top:4px"><i style="width:${Math.max(3, r.g / mx * 100)}%"></i></div></td><td class="b">${esc(fwG(r.g))}<div><button class="lnk" data-act="foodCmpDel" data-id="${esc(r.fd.id)}">remove</button></div></td></tr>`).join('')}</table></div>`;
      if (rows.length > 1) h += `<div class="alert ok"><b class="t">Lightest vs heaviest</b>${esc(rows[0].fd.name)} weighs ${esc(fwG(rows[0].g))}; ${esc(rows[rows.length - 1].fd.name)} weighs ${esc(fwG(rows[rows.length - 1].g))} for the same ${fk(kc)} kcal: ${OA.round(rows[rows.length - 1].g / Math.max(1, rows[0].g), 1)} times as much.</div>`;
      const notes = ids.map(id => FM[id]).filter(fd => fd.kind === 'wet' || fd.kind === 'fresh').slice(0, 4);
      notes.forEach(fd => { h += `<div class="xs dim">${esc(fd.name)}: ${esc(fd.note)}</div>`; });
    } else h += `<p class="sm dim">Nothing to compare yet. Tap an example, or add foods.</p>`;
    h += `<button class="btn block" data-act="foodPickCmp">Add a food to compare</button></section>`;

    /* pack-out summary over the stretch */
    const days = syncDays(); let saved = 0, lines = [];
    days.forEach((m, di) => SLOTS.forEach(s => (m[s[0]] || []).forEach(it => {
      const fd = FM[it.id], sw = fd && SWAPS[it.id] && FM[SWAPS[it.id]]; if (!sw || fd.carry <= 0) return;
      const q = num(it.q, 1), g = fd.carry * q - gramsForKcal(sw, fd.kcal * q);
      if (g > 5) { saved += g; lines.push({ day: di + 1, fd, sw, g }); }
    })));
    h += `<section class="card"><div class="ct"><span>${OA.icon('scale')} Pack-out: weight saved by going dry</span></div>`;
    if (lines.length) {
      h += `<div class="stat"><div><b>${esc(fwG(saved))}</b><span>SAVED</span></div><div><b>${lines.length}</b><span>SWAPS</span></div></div><p class="sm">Replacing the wet and fresh foods in your ${f.nDays}-day menu with dry swaps of the same calories would cut about ${esc(fwG(saved))} from the load.</p>`;
      const agg = {}; lines.forEach(l => { const k = l.fd.id; agg[k] = agg[k] || { fd: l.fd, sw: l.sw, g: 0 }; agg[k].g += l.g; });
      h += Object.keys(agg).map(k => `<div class="li" style="cursor:default"><div class="tx"><b>${esc(agg[k].fd.name)}</b><span>swap for ${esc(agg[k].sw.name)}</span></div><div class="end">−${esc(fwG(agg[k].g))}</div></div>`).join('');
    } else h += `<p class="sm dim">${days.some(m => dayTotals(m).n) ? 'Your menu has no wet or fresh foods that we have a dry swap for. That is a light menu.' : 'Build a menu first and this shows how much weight the wet foods in it add.'}</p>`;
    h += `</section>`;
    h += `<section class="card"><div class="ct"><span>First night out of town</span></div>
      <label class="chk"><input type="checkbox" data-bind="pack.food.firstNight" data-type="bool" data-then="foodRedraw" ${f.firstNight ? 'checked' : ''}> Allow fresh food for the first days, then go dry</label>
      ${f.firstNight ? `<label class="fl">Days fresh food is fine for<select class="in" data-bind="pack.food.freshDays" data-type="number" data-then="foodRedraw"><option value="1" ${f.freshDays == 1 ? 'selected' : ''}>1 day</option><option value="2" ${f.freshDays == 2 ? 'selected' : ''}>2 days</option></select></label>` : ''}
      <p class="sm dim">A town meal, a fresh apple or a sandwich is a nice start, and the first night is when the pack is heaviest. Fresh food spoils or bruises, so the menu checker flags fresh items later in the stretch. Hot weather shortens how long fresh food lasts, and perishable food should stay cold or be eaten within hours.</p></section>`;
    return h;
  }

  /* ---------------------------------------------------------------- fuel */
  function foodFuel() {
    const f = F(), d = syncDays(), fu = stretchFuel();
    const hasMenu = d.some(m => dayTotals(m).n > 0);
    let h = `<section class="card"><div class="ct"><span>Stove fuel estimate</span></div>
      <p class="sm"><b>Assumption:</b> about ${FUEL_OZ_PER_DAY} oz of canister fuel per day for one person who boils about two cups of water twice a day (roughly ${FUEL_ML_BASIS} ml). Wind, cold, altitude, big pots and simmering raise it. Test your own stove at home and carry a margin.</p>
      <label class="fl">Stove type<select class="in" data-bind="pack.food.fuelType" data-type="text" data-then="foodRedraw"><option value="canister" ${f.fuelType !== 'alcohol' ? 'selected' : ''}>Canister (isobutane blend)</option><option value="alcohol" ${f.fuelType === 'alcohol' ? 'selected' : ''}>Alcohol</option></select></label>`;
    if (f.fuelType === 'alcohol') h += field('Alcohol I use per day for 2 boils of about 2 cups (oz): test at home', 'pack.food.alcOzDay', { then: 'foodRedraw' }) + `<div class="xs dim">Alcohol stoves vary a lot, so there is no built-in number: measure your own.</div>`;
    h += `<label class="chk"><input type="checkbox" data-bind="pack.food.coldSoak" data-type="bool" data-then="foodRedraw" ${f.coldSoak ? 'checked' : ''}> Cold-soak what can be (no stove for those foods)</label></section>`;
    if (hasMenu) {
      h += `<section class="card"><div class="ct"><span>For this stretch</span></div><div class="stat"><div><b>${fu.oz > 0 ? OA.round(fu.oz, 1) + ' oz' : 'none'}</b><span>FUEL TO CARRY</span></div><div><b>${esc(fwG(fu.oz * G_OZ))}</b><span>WEIGHT</span></div><div><b>${fk(fu.hotMl)} ml</b><span>HOT WATER</span></div></div>`;
      const cs = [], hot = [];
      d.forEach(m => SLOTS.forEach(s => (m[s[0]] || []).forEach(it => { const fd = FM[it.id]; if (!fd || !fd.cookMl) return; (fd.coldSoak ? cs : hot).indexOf(fd.name) < 0 && (fd.coldSoak ? cs : hot).push(fd.name); })));
      if (hot.length) h += `<div class="sm"><b>Needs hot water:</b> ${esc(hot.join(', '))}</div>`;
      if (cs.length) h += `<div class="sm"><b>Can be cold-soaked:</b> ${esc(cs.join(', '))}. Soak them in a closed jar or bag for an hour or more, longer in cold water. Small grains, oats, couscous and flakes soak best.</div>`;
      h += `<div class="xs dim">The canister's own weight is extra. Always keep a margin: running out of fuel early in a stretch leaves you with cold food only.</div></section>`;
    } else h += `<section class="card"><p class="sm dim">Build a menu and this shows the hot water each day needs and the fuel for the whole stretch.</p></section>`;
    h += `<section class="card"><div class="ct"><span>No-stove (cold soak) option</span></div><p class="sm">Many long-distance hikers go stoveless. It removes the stove, the pot and the fuel, but leaves out hot drinks and meals. Good cold-soak foods: oats, couscous, instant potatoes, instant refried bean flakes, rice noodles, textured vegetable protein, and powdered milk. Wraps, nut butter, cheese, jerky and nuts need nothing. In cold weather a hot drink is also a safety tool, so think carefully before leaving the stove behind in cold or wet seasons.</p></section>`;
    return h;
  }

  /* ================================================================ WATER */
  function renderWater(el) {
    const views = [['hydrate', 'Hydration'], ['carry', 'Carry'], ['treat', 'Treatment'], ['log', 'Water log']];
    el.innerHTML = sub(ui.water, views, 'waterView') + ({ hydrate: waterHydrate, carry: waterCarry, treat: waterTreat, log: waterLog }[ui.water] || waterHydrate)();
  }
  function wRate() { const w = W(); return waterRate({ tempF: w.tempF, exertion: w.exertion, altFt: w.altFt }); }
  function waterHydrate() {
    const w = W(), r = wRate(), pr = window.BP && BP.pack && BP.pack.profile ? BP.pack.profile() : null, pace = pr ? pr.paceMph : 2.5, hrs = pr ? pr.hoursPerDay : 8;
    let h = `<section class="card"><div class="ct"><span>${OA.icon('drop')} How much to carry</span></div>
      <div class="two"><label class="fl">Air temperature (${tempUnitLabel()})<input class="in" type="number" inputmode="decimal" id="wtemp" data-onchange="waterTemp" value="${esc(fmtTempIn(w.tempF))}" placeholder="not set"></label>
      <label class="fl">Exertion<select class="in" data-bind="pack.water.exertion" data-type="text" data-then="foodRedraw"><option value="easy" ${w.exertion === 'easy' ? 'selected' : ''}>Easy</option><option value="mod" ${w.exertion === 'mod' ? 'selected' : ''}>Moderate</option><option value="hard" ${w.exertion === 'hard' ? 'selected' : ''}>Hard (steep, heavy pack)</option></select></label></div>
      <label class="fl">Elevation (${OA.unit.dist() === 'km' ? 'm' : 'ft'}) <input class="in" type="number" inputmode="numeric" id="walt" data-onchange="waterAlt" value="${w.altFt ? esc(OA.unit.dist() === 'km' ? Math.round(w.altFt * 0.3048) : w.altFt) : ''}" placeholder="0"></label>
      <button class="btn" data-act="waterFromWx">Use today's forecast high for my position</button><div class="xs dim" id="wxnote">${OA.online() ? 'Needs signal; uses a saved copy when there is none.' : 'No signal: type the temperature instead.'}</div>
      <div class="stat"><div><b>${r.lph.toFixed(2).replace(/0$/, '')}</b><span>LITERS / HOUR</span></div><div><b>${esc(OA.round(r.lph * hrs, 1))}</b><span>L OVER ${esc(OA.round(hrs, 0))} H</span></div><div><b>${esc(OA.round(r.lph * L_LB, 1))}</b><span>LB / HOUR</span></div></div>
      <div class="xs dim">${esc(fL(r.lph))} per hour of walking, ${esc(OA.round(pace, 1))} mph pace. This is a number to plan how much to CARRY, not an amount to force down.${r.capped ? ' Capped at 1.2 L per hour.' : ''}</div></section>
      <section class="card"><div class="ct"><span>Rules of thumb</span></div>
        <ul class="ls sm"><li>About 0.5 L per hour is a common starting point for moderate effort in moderate temperatures. Plan more in heat, at altitude or on hard climbs.</li>
        <li><b>Drink to thirst, and a little more in heat.</b> Pale yellow urine is a good sign; dark urine means drink more.</li>
        <li><b>Do not overdrink.</b> Drinking far more than you need can dilute the body's sodium (hyponatremia). Early signs are nausea, headache, bloating and swollen hands, and they can look like heat illness. If someone is confused or very unwell, that is an emergency.</li>
        <li><b>Electrolytes:</b> most of your sodium comes from salty food. Eat salty snacks; a drink mix with sodium helps in long sweaty days. It is not a replacement for food or sense.</li>
        <li>Drink at the source, then carry the rest ("tank up"), and keep a small reserve beyond the plan.</li></ul></section>`;
    return h;
  }
  function gapRows() {
    const w = W(), g = [];
    let tg = []; try { tg = (window.BP && BP.trail && typeof BP.trail.waterGaps === 'function' && BP.trail.waterGaps(5)) || []; } catch (e) { }
    tg.slice(0, 12).forEach(x => g.push({ from: (x.fromPoint && x.fromPoint.name) || 'Water', to: (x.toPoint && x.toPoint.name) || 'Water', miles: num(x.miles) }));
    (w.manualGaps || []).forEach((m, i) => g.push({ from: 'My entry', to: '', miles: num(m), manual: i }));
    return { rows: g, fromTrail: tg.length };
  }
  function waterCarry() {
    const w = W(), r = wRate(), pr = window.BP && BP.pack && BP.pack.profile ? BP.pack.profile() : null, pace = pr ? pr.paceMph : 2.5;
    const gaps = gapRows();
    let h = `<section class="card"><div class="ct"><span>Water to carry between sources</span></div>
      <div class="two">${field('Bottle capacity I carry (L)', 'pack.water.capL', { then: 'foodRedraw' })}${field('Reserve (L)', 'pack.water.reserveL', { then: 'foodRedraw' })}</div>
      ${field('Water I usually carry while walking (L), counted in your pack weight', 'pack.water.carryL', { then: 'foodRedraw' })}
      <div class="xs dim">At ${esc(fL(r.lph))} per hour and ${esc(OA.round(pace, 1))} mph (slower on climbs: add time for them). Use the Hydration tab to change the temperature and effort.</div></section>`;
    if (!gaps.fromTrail) h += `<div class="alert"><b class="t">No trail water gaps</b>${window.BP && BP.trail && BP.trail.current && BP.trail.current() ? 'This app lists no long gaps between water sources for the trail you picked.' : 'Pick a trail in the Trail tab to see its water gaps.'} Water sources change by season and can be dry: ask locally. You can still enter a gap yourself.</div>`;
    h += `<section class="card">`;
    if (gaps.rows.length) {
      h += `<div class="scroll-x"><table class="t"><tr><th>Dry stretch</th><th>Miles</th><th>Hours</th><th>Carry</th></tr>`;
      gaps.rows.forEach(g => {
        const c = gapLiters(g.miles, pace, r.lph, num(w.reserveL, 0.5)), over = c.total > num(w.capL, 2);
        h += `<tr><td>${esc(g.from)}${g.to ? ' to ' + esc(g.to) : ''}${g.manual != null ? ` <button class="lnk" data-act="waterDelGap" data-i="${g.manual}">remove</button>` : ''}${over ? `<div class="xs red">More than your ${esc(fL(num(w.capL, 2)))} capacity</div>` : ''}</td><td>${esc(OA.dist(g.miles))}</td><td>${esc(OA.round(c.hours, 1))}</td><td><b>${esc(fL(c.total))}</b><div class="xs dim">${esc(fwLb(c.total * L_LB))}</div></td></tr>`;
      });
      h += `</table></div>`;
      const worst = gaps.rows.map(g => gapLiters(g.miles, pace, r.lph, num(w.reserveL, 0.5)).total).reduce((a, b) => Math.max(a, b), 0);
      h += worst > num(w.capL, 2) ? `<div class="alert"><b class="t">One of these needs more than your bottles hold</b>Carry extra capacity, drink a lot at the source before you leave, find an alternate source, or camp before the dry stretch rather than push through. Do not ration water in heat to make it fit.</div>` : `<div class="alert ok"><b class="t">Fits your bottles</b>The longest gap needs ${esc(fL(worst))} and you can carry ${esc(fL(num(w.capL, 2)))}.</div>`;
    } else h += `<p class="sm dim">No gaps to show yet.</p>`;
    h += `<div class="row"><input class="in" type="number" inputmode="decimal" id="wgapmi" placeholder="Miles between water" aria-label="Miles between water"><button class="btn" data-act="waterAddGap">Add</button></div></section>`;
    const camp = campWaterL();
    h += `<section class="card"><div class="ct"><span>Dry camp guidance</span></div>
      <p class="sm">A dry camp is a night where there is no water at camp. Add the evening and morning needs to the carry above. For you that is about <b>${esc(fL(camp.total))}</b>: ${esc(fL(camp.drink))} to drink and ${esc(fL(camp.cook))} for cooking and breakfast${camp.cook === 0.5 && !camp.fromMenu ? ' (a guess: build a menu to make it exact)' : ''}.</p>
      <ul class="ls sm"><li>Drink well at the last source before the dry stretch, then carry what you need.</li><li>Cold-soak or no-cook dinners save water and fuel at a dry camp.</li><li>If you run low in hot weather, stop and rest in shade rather than push on, and turn back to the last source if the next is far.</li><li>Sources listed in this app can be dry, flooded or fouled: ask recent hikers and keep a margin.</li></ul></section>`;
    return h;
  }
  function campWaterL() {
    const d = syncDays(), m = d[0], t = dayTotals(m, F()), fromMenu = t.hotMl + t.coldMl > 0;
    const cook = fromMenu ? (t.hotMl + t.coldMl) / 1000 : 0.5;
    return { drink: 1, cook: Math.round(cook * 10) / 10, total: Math.round((1 + cook) * 10) / 10, fromMenu };
  }
  const TREAT = [
    ['Boiling', 'Yes', 'Yes', 'Yes', 'Rolling boil for 1 minute. Above 6,500 ft (about 2,000 m) boil for 3 minutes. Let it cool covered. Strain cloudy water first. Uses fuel and time.'],
    ['Filter, 0.3 micron or smaller (typical hollow-fiber)', 'Yes', 'Yes', 'No', 'Removes bacteria and protozoa (Giardia, Cryptosporidium) but not viruses. Do not let it freeze: a frozen filter can crack and fail without showing it. Follow the maker\'s care steps.'],
    ['Filter, 1 micron or cyst-rated', 'Some', 'Yes', 'No', 'Takes out protozoa (cysts) but may miss smaller bacteria and does not stop viruses.'],
    ['Chlorine dioxide (tablets or drops)', 'Yes', 'Giardia yes; Crypto only somewhat', 'Yes', 'Needs time to work, longer for Cryptosporidium and for cold or cloudy water, often hours. Follow the product label exactly.'],
    ['Chlorine bleach or iodine', 'Yes', 'Weak', 'Yes', 'Do not rely on them for parasites. Follow the product label for contact time and dose. Avoid iodine if you are pregnant, have thyroid problems or are sensitive to iodine, and do not use it for more than a few weeks at a time.'],
    ['Ultraviolet (UV) pen or bottle', 'Yes', 'Yes', 'Yes', 'Works only in clear water and with the maker\'s method (stir, time). Needs batteries. Pre-filter cloudy water first.']
  ];
  function waterTreat() {
    let h = `<section class="card"><div class="ct"><span>Treating backcountry water</span></div>
      <p class="sm">Water from clear streams and springs can still carry germs from animals and people. Treat all of it, or take it from a source you know is safe. The three kinds of germs are <b>bacteria</b>, <b>protozoa</b> (Giardia and Cryptosporidium) and <b>viruses</b>. No single cheap method is best everywhere.</p>
      <div class="scroll-x"><table class="t"><tr><th>Method</th><th>Bacteria</th><th>Protozoa</th><th>Viruses</th></tr>${TREAT.map(t => `<tr><td><b>${esc(t[0])}</b></td><td>${esc(t[1])}</td><td>${esc(t[2])}</td><td>${esc(t[3])}</td></tr>`).join('')}</table></div></section>`;
    TREAT.forEach(t => { h += `<div class="card inner"><b>${esc(t[0])}</b><div class="sm">${esc(t[4])}</div></div>`; });
    h += `<section class="card"><div class="ct"><span>Good practice</span></div><ul class="ls sm">
      <li><b>Cloudy water:</b> let it settle and pour it through a cloth or coffee filter before you treat it. Particles shield germs from chemicals and UV light.</li>
      <li><b>Chemical treatment:</b> contact times depend on the product, the water temperature and how cloudy it is. <b>Follow the product label.</b> Cold water takes longer.</li>
      <li><b>Chemicals and toxins:</b> no backpacking method makes water safe from fuel, farm runoff, mine drainage or algae toxins. Avoid scummy, foamy or bright green water and water near mines, dumps or heavy grazing.</li>
      <li><b>Choose a source:</b> moving water upstream of camps, trails and animals is usually better than still water. Keep clean and dirty bottles separate and wash hands after the toilet and before food, which is a common way hikers get sick.</li>
      <li><b>Stomach bug afterwards:</b> severe diarrhea, high fever, bloody stool or signs of dehydration (very dark urine, dizziness) mean getting medical care. Giardia usually starts one to two weeks after drinking.</li></ul>
      <p class="xs dim">Based on CDC guidance for treating water when hiking and camping. Always check your own product's instructions.</p></section>`;
    return h;
  }
  function waterLog() {
    const w = W(), k = OA.dkey(), today = num(w.log[k], 0), r = wRate(), pr = window.BP && BP.pack && BP.pack.profile ? BP.pack.profile() : null, hrs = pr ? pr.hoursPerDay : 8;
    const days = Object.keys(w.log).sort().slice(-6, -1).reverse();
    return `<section class="card"><div class="ct"><span>Water today</span><span class="sm dim">${esc(OA.fmtDate(k))}</span></div>
      <div class="center"><div class="big-num">${esc(OA.round(today, 2))} L</div><div class="sm dim">${metricW() ? '' : esc(Math.round(today * FLOZ_L)) + ' fl oz · '}about ${esc(OA.round(r.lph * hrs, 1))} L is a typical walking-day amount at your settings</div></div>
      <div class="bar" style="margin:10px 0"><i style="width:${OA.clamp(today / Math.max(1, r.lph * hrs) * 100, 1, 100)}%"></i></div>
      <div class="row"><button class="btn" data-act="waterLogAdd" data-l="0.25">+0.25 L</button><button class="btn" data-act="waterLogAdd" data-l="0.5">+0.5 L</button><button class="btn" data-act="waterLogAdd" data-l="1">+1 L</button></div>
      <div class="row"><button class="btn" data-act="waterLogAdd" data-l="-0.25">Undo 0.25 L</button></div>
      <p class="xs dim">This counts what you drink, for your own interest. It is not a target to force down: thirst, pale urine and how you feel matter more. Counting does not include water in food.</p></section>
      ${days.length ? `<section class="card"><div class="ct"><span>Recent days</span></div>${days.map(d => `<div class="kv"><span>${esc(OA.fmtDate(d))}</span><b>${esc(OA.round(num(w.log[d]), 2))} L</b></div>`).join('')}</section>` : ''}`;
  }

  /* ================================================================ BODY */
  function renderBody(el) {
    const views = [['check', 'Weight and energy'], ['signs', 'Warning signs'], ['feet', 'Feet, salt, sleep'], ['pair', 'Healthica']];
    el.innerHTML = sub(ui.body, views, 'bodyView') + ({ check: bodyCheck, signs: bodySigns, feet: bodyFeet, pair: bodyPair }[ui.body] || bodyCheck)();
  }
  const lbToDisp = lb => metricW() ? lb * LB_KG : lb;
  const dispToLb = v => metricW() ? v / LB_KG : v;
  function bodyCheck() {
    const b = B(), t = target(), k = OA.dkey();
    const ws = b.weights.slice().sort((a, c) => a.d < c.d ? -1 : 1), unit = metricW() ? 'kg' : 'lb';
    let h = `<section class="card"><div class="ct"><span>Weight on trail</span></div>
      <div class="row mid"><input class="in" style="margin:0" type="number" inputmode="decimal" id="bdw" placeholder="Weight (${unit})" aria-label="Weight in ${unit}"><button class="btn gold" data-act="bdWeightAdd">Log today</button></div>`;
    if (ws.length) {
      const first = ws[0], last = ws[ws.length - 1], chg = last.lb - first.lb, pct = first.lb ? chg / first.lb * 100 : 0, days = Math.max(1, OA.daysBetween(first.d, last.d));
      h += `<div class="stat"><div><b>${esc(OA.round(lbToDisp(last.lb), 1))}</b><span>LATEST (${unit.toUpperCase()})</span></div><div><b>${chg > 0 ? '+' : ''}${esc(OA.round(lbToDisp(chg), 1))}</b><span>SINCE ${esc(OA.fmtDate(first.d, { month: 'short', day: 'numeric' }).toUpperCase())}</span></div><div><b>${ws.length > 1 && days >= 3 ? (chg > 0 ? '+' : '') + OA.round(lbToDisp(chg / days * 7), 1) : '–'}</b><span>${unit.toUpperCase()} / WEEK</span></div></div>`;
      if (ws.length > 1) h += `<div id="bdchart"></div>`;
      if (pct <= -10) h += `<div class="alert danger"><b class="t">Large weight loss</b>You are down about ${esc(OA.round(-pct, 1))}% since you started logging. That is a lot. Eat more, rest, and see a clinician when you can, especially if you feel weak, dizzy or ill.</div>`;
      else if (pct <= -5) h += `<div class="alert"><b class="t">Weight is dropping</b>You are down about ${esc(OA.round(-pct, 1))}%. Some loss is common early on, but if it keeps going, eat more, plan a town day and consider a check-in with a clinician. This is a rule of thumb, not a diagnosis.</div>`;
      h += `<div class="sm"><button class="lnk" data-act="bdWeightUndo">Remove last entry</button></div>`;
    } else h += `<p class="sm dim">Weigh yourself the same way each time (for example at a town scale with similar clothes). Entries stay on this phone.</p>`;
    h += `</section>`;
    const burn = num(b.burnOverride, 0) || (t && t.burn) || 0, e = b.energy[k] || {}, last7 = Object.keys(b.energy).sort().slice(-7).filter(d => num(b.energy[d].eaten, 0) > 0);
    h += `<section class="card"><div class="ct"><span>Calories: burn vs eaten</span></div>
      <div class="two"><label class="fl">Burned today (kcal)<input class="in" type="number" inputmode="numeric" data-bind="pack.body.burnOverride" data-type="number" data-then="foodRedraw" ${bx(b.burnOverride)} placeholder="${burn ? esc(burn) : 'estimate'}"></label>
      <label class="fl">Eaten today (kcal)<input class="in" type="number" inputmode="numeric" data-bind="pack.body.energy.${k}.eaten" data-type="number" data-then="foodRedraw" ${bx(e.eaten)} placeholder="0"></label></div>`;
    if (burn && num(e.eaten, 0) > 0) { const d = burn - e.eaten; h += `<div class="kv"><span>Today</span><b>${d > 0 ? fk(d) + ' kcal below what you burned' : fk(-d) + ' kcal above'}</b></div>`; }
    if (last7.length >= 3 && burn) {
      const avg = last7.reduce((s, d) => s + (burn - num(b.energy[d].eaten, 0)), 0) / last7.length;
      h += `<div class="kv"><span>Average of the last ${last7.length} days</span><b>${avg > 0 ? fk(avg) + ' below' : fk(-avg) + ' above'}</b></div>` + (avg > 1000 ? `<div class="alert"><b class="t">A big gap for several days</b>You are eating well below what you burn. Eat more at every stop, add oil or nut butter to meals, and plan a rest or town day. A small shortfall is normal; a big one for days is how people end up weak and slow.</div>` : '');
    }
    h += `<div class="xs dim">A rough rule is that about 3,500 kcal is a pound of body weight, but on trail you also lose water and muscle. Treat the numbers as a guide, not a measurement. Add up what you ate from the Menu tab, or from the label.</div></section>
      <section class="card tip"><div class="ct"><span>Hiker hunger and recovery</span></div><p class="sm">After a week or two of long days, many hikers feel ravenous all the time and can eat a huge amount in town. That is the body asking for fuel, so feed it. Early in a trip appetite can lag behind need (tiredness, altitude, heat), so eat on a schedule: something every hour or two, a real meal at night, and food soon after you stop for the day. A mix of carbohydrate and protein helps recovery. Sleep and a rest day matter as much as food.</p></section>`;
    return h;
  }
  function bodySigns() {
    return `<section class="card"><div class="ct"><span>${OA.icon('alert')} When to slow down, and when to get help</span></div>
      <div class="alert"><b class="t">Slow down, eat, drink, rest, and think about a town stop</b>
      <ul class="ls sm"><li>Persistent tiredness, feeling cold all the time, low mood, or getting slower day by day.</li><li>Dizziness or light-headedness that clears after you sit, eat and drink, but comes back.</li><li>Dark yellow or brown urine, or very little urine, for more than a day.</li><li>Headache and nausea in heat, or at altitude.</li><li>Weight dropping steadily over many days (see the Weight tab).</li><li>A hot spot or blister that keeps worsening.</li></ul></div>
      <div class="alert danger"><b class="t">Get help now: call 911 if you have signal, or send someone for help</b>
      <ul class="ls sm"><li>Fainting, or dizziness that does not clear after you sit, drink and eat.</li><li>Confusion, strange behavior, slurred speech, stumbling or trouble walking straight.</li><li>Severe weakness, a racing heart that does not settle, chest pain, or trouble breathing at rest.</li><li>Vomiting or diarrhea that goes on for a day and you cannot keep fluids down.</li><li>Signs of heat stroke: hot, flushed skin, confusion, no sweating or heavy sweating, and not improving with rest and cooling. Move to shade and cool the person while help comes.</li><li>Shivering that will not stop, or stopped shivering with drowsiness in the cold.</li><li>Severe headache, vomiting and unsteadiness at altitude. Going down is the treatment.</li></ul></div>
      <p class="sm dim">These are general warning signs, not a diagnosis. Many causes look alike (dehydration, low sodium from overdrinking, heat illness, cold, low blood sugar, altitude sickness). When you cannot tell, treat it as serious, make the person safe and get help. This app is not a substitute for first-aid training; carry the first-aid items you know how to use.</p></section>`;
  }
  function bodyFeet() {
    return `<section class="card"><div class="ct"><span>Feet: hot spots and blisters</span></div>
      <p class="sm"><b>Stop at the first hot spot.</b> A warm, tender patch is a blister about to happen. Stopping for two minutes beats losing a week.</p>
      <ol class="ls sm"><li>Take off the shoe and sock. Dry the foot and let it air.</li><li>Cover the spot with tape or a blister pad that sticks well (clean, dry skin first). Smooth out wrinkles.</li><li>Change to dry socks, or wring out and turn wet ones, and re-lace so the foot does not slide.</li><li>If a blister has formed, keep it covered and padded, with a ring of padding around it so the pressure is off. Leave small blisters whole; the skin is a barrier.</li><li>Large, painful blisters may be drained with a clean (flame- or alcohol-cleaned) needle, leaving the skin on, then covered. Clean your hands first.</li><li>Check daily for spreading redness, warmth, swelling, pus, red streaks or fever. Those mean infection: get medical care.</li></ol>
      <p class="sm"><b>Prevention:</b> shoes that fit with room for swelling (feet grow on long days); trimmed toenails; socks that wick and are changed when wet; wash and dry feet at lunch; shake out grit; and let feet dry overnight. If you have diabetes or poor circulation, foot problems can become serious quickly: ask your clinician before a long trip.</p></section>
      <section class="card"><div class="ct"><span>Electrolytes</span></div><p class="sm">Sweat carries out sodium and some other minerals. Most hikers cover this with food: salty snacks, cheese, jerky, broth, ramen or electrolyte mix. A mix with sodium helps on long, hot days. Do not take salt tablets or drink huge amounts of plain water to "make up" for sweat: too much plain water can lower blood sodium. Cramps and headaches in heat are a sign to rest in shade and eat something salty.</p></section>
      <section class="card"><div class="ct"><span>Sleep and recovery</span></div><p class="sm">Most adults need seven to nine hours. After long days, aim for an early camp and a good night: poor sleep slows recovery, dulls judgment and raises injury risk. Eat a real dinner, stretch a little, keep warm, and use a zero day when you are run down. Pain that gets worse day by day, especially in the shins or feet, is worth a rest before it becomes a stoppage.</p></section>`;
  }
  function bodyPair() {
    let h = null; try { h = window.OCC && OCC.get('healthica'); } catch (e) { }
    const d = h && h.data;
    let out = `<section class="card"><div class="ct"><span>Healthica pairing</span></div>`;
    if (!d) out += `<p class="sm dim">Healthica has not shared anything with this app yet. Open the menu (gear) and use Household link in both apps, on the same site or by copying a link code. Nothing is needed for Backpackica to work.</p>`;
    else {
      out += `<p class="sm">Healthica last shared ${esc(OCC.ago(h.ts))}.</p>`;
      if (d.people && d.people.length) out += `<div class="kv"><span>People</span><b>${esc(d.people.join(', '))}</b></div>`;
      if (d.week) { const w = d.week; out += `<div class="kv"><span>Week</span><b>${w.meals != null ? esc(w.meals) + ' meals planned' : ''}${w.cost != null ? ', about $' + esc(Math.round(w.cost)) : ''}</b></div>`; }
      if (d.body) {
        const bd = d.body; out += `<div class="kv"><span>Body</span><b>${bd.kg ? esc(OA.wt(bd.kg / LB_KG, 1)) : ''}${bd.tdee ? ' · everyday use ' + fk(bd.tdee) + ' kcal' : ''}${bd.kcalTarget ? ' · goal ' + fk(bd.kcalTarget) + ' kcal' : ''}</b></div>`;
      } else out += `<p class="sm dim">Healthica has not shared body numbers (weight, energy use). Backpackica works without them.</p>`;
    }
    out += `</section><section class="card"><div class="ct"><span>What Backpackica would like from Healthica</span></div>
      <p class="sm">A short list of numbers (no records, notes or measurements) that would make food and burn planning better. Paste this into a note or into Healthica's own notes.</p>
      <textarea class="in" rows="9" readonly id="hwtext">${esc(healthicaWantsText())}</textarea>
      <div class="row"><button class="btn" data-act="bdCopyWants">Copy</button></div>
      <p class="xs dim">Backpackica shares back only totals: your calorie target, calorie burn and pack weight. It never sends weights, warning signs or notes.</p></section>`;
    return out;
  }

  /* ================================================================ actions */
  OA.act({
    foodRedraw() { OA.render(true); },
    foodTouch() { F().touched = true; OA.render(true); },
    foodView(el) { ui.food = el.dataset.v; OA.render(true); },
    waterView(el) { ui.water = el.dataset.v; OA.render(true); },
    bodyView(el) { ui.body = el.dataset.v; OA.render(true); },
    foodDaysChanged() { F().touched = true; syncDays(); ui.day = 0; OA.save(); OA.render(true); },
    foodUseDays(el) { const f = F(); f.nDays = OA.clamp(parseInt(el.dataset.n, 10) || 4, 1, 21); f.touched = true; syncDays(); OA.save(); OA.render(true); },
    foodDay(el) { ui.day = parseInt(el.dataset.i, 10) || 0; OA.render(true); },
    foodPick(el) { openPicker(el.dataset.s, false); },
    foodPickCmp() { openPicker('b', true); },
    fdCat(el) { ui.cat = el.dataset.v; ui.limit = 40; const r = OA.sheetBody(); if (r) { r.querySelectorAll('[data-act=fdCat]').forEach(b => b.classList.toggle('on', b === el)); const l = r.querySelector('#fdlist'); if (l) l.innerHTML = pickerRows(); } },
    fdMore() { ui.limit += 40; const l = OA.sheetBody() && OA.sheetBody().querySelector('#fdlist'); if (l) l.innerHTML = pickerRows(); },
    fdAdd(el) {
      const id = el.dataset.id, fd = FM[id]; if (!fd) return;
      const f = F(); f.touched = true;
      if (ui.pickCmp) { if (f.cmp.indexOf(id) < 0) f.cmp.push(id); OA.save(); return OA.toast('Added to compare: ' + fd.name); }
      const m = syncDays()[ui.day], a = m[ui.pickSlot].find(x => x.id === id);
      if (a) a.q = num(a.q, 1) + 1; else m[ui.pickSlot].push({ id, q: 1 });
      OA.save(); OA.toast('Added: ' + fd.name);
    },
    foodQ(el) {
      const m = syncDays()[ui.day], arr = m[el.dataset.s], i = parseInt(el.dataset.i, 10), it = arr[i]; if (!it) return;
      it.q = Math.round((num(it.q, 1) + parseFloat(el.dataset.d)) * 2) / 2; if (it.q <= 0) arr.splice(i, 1);
      OA.save(); OA.render(true);
    },
    foodLoadPreset(el) {
      const p = allPresets().find(x => x.id === el.dataset.id); if (!p) return;
      const f = F(); syncDays()[ui.day] = presetMenu(p); f.days[ui.day] = syncDays()[ui.day]; f.touched = true; OA.save(); OA.toast(p.name + ' loaded for day ' + (ui.day + 1)); OA.render(true);
    },
    foodCopyAll() { const f = F(), d = syncDays(); for (let i = 0; i < d.length; i++) if (i !== ui.day) f.days[i] = clone(d[ui.day]); OA.save(); OA.toast('Copied to all days.'); OA.render(true); },
    async foodClearDay() { if (!await OA.confirm('Clear everything from day ' + (ui.day + 1) + '?', 'Clear')) return; F().days[ui.day] = emptyMenu(); OA.save(); OA.render(true); },
    foodSavePreset() {
      const m = syncDays()[ui.day]; if (!dayTotals(m).n) return OA.toast('Add some food first.');
      OA.sheet('Save preset', `<label class="fl">Name<input class="in" id="fdpn" maxlength="30" placeholder="e.g. Desert week"></label><button class="btn gold block" data-act="foodSavePresetDo">Save</button>`);
    },
    foodSavePresetDo() {
      const n = (OA.$('#fdpn') || {}).value; if (!n || !n.trim()) return OA.toast('Give it a name.');
      F().presets.push({ id: 'u' + OA.uid(), name: n.trim().slice(0, 30), menu: clone(syncDays()[ui.day]) }); OA.save(); OA.closeSheet(); OA.toast('Preset saved.');
    },
    async foodDelPreset(el) { if (!await OA.confirm('Delete this preset?', 'Delete')) return; const f = F(); f.presets = f.presets.filter(p => p.id !== el.dataset.id); OA.save(); OA.render(true); },
    foodMode(el) { F().mode = el.dataset.v; OA.save(); OA.render(true); },
    foodCheck(el) { const f = F(); if (el.checked) f.checks[el.dataset.id] = 1; else delete f.checks[el.dataset.id]; OA.save(); OA.render(true); },
    foodUncheck() { F().checks = {}; OA.save(); OA.render(true); },
    foodCopyList() { copyText(shopText(fullShopping())); },
    foodShareList() { const t = shopText(fullShopping()); if (OA.share && OA.share.send) OA.share.send({ title: 'Backpackica shopping list', text: t }); else copyText(t); },
    foodPrintList() {
      const old = document.getElementById('bp-print'); if (old) old.remove();
      const d = document.createElement('div'); d.id = 'bp-print'; d.innerHTML = `<h2>Backpackica</h2><pre>${esc(shopText(fullShopping()))}</pre>`;
      document.body.appendChild(d); document.body.classList.add('bp-printing');
      const done = () => { document.body.classList.remove('bp-printing'); d.remove(); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 50);
    },
    foodExample(el) { const e = EXAMPLES[parseInt(el.dataset.i, 10)]; if (!e) return; F().cmp = e[1].filter(id => FM[id]); OA.save(); OA.render(true); },
    foodCmpDel(el) { const f = F(); f.cmp = f.cmp.filter(i => i !== el.dataset.id); OA.save(); OA.render(true); },
    waterTemp(el) { const v = parseFloat(el.value); W().tempF = isFinite(v) ? (OA.unit.temp() === 'C' ? v * 9 / 5 + 32 : v) : null; OA.save(); OA.render(true); },
    waterAlt(el) { const v = parseFloat(el.value); W().altFt = isFinite(v) && v > 0 ? Math.round(OA.unit.dist() === 'km' ? v / 0.3048 : v) : 0; OA.save(); OA.render(true); },
    async waterFromWx(el) {
      const fx = OA.geo && OA.geo.known && OA.geo.known(), n = OA.$('#wxnote');
      if (!fx) { if (n) n.textContent = 'No position yet. Get your position on the Today tab, or type the temperature.'; return; }
      el.disabled = true; if (n) n.textContent = 'Loading…';
      try { const r = await OA.weather(fx.lat, fx.lon), hi = r.v.daily.temperature_2m_max[0]; if (typeof hi === 'number') { W().tempF = Math.round(hi); OA.save(); OA.toast('Today\'s high: ' + OA.temp(hi) + (r.stale ? ' (saved copy)' : '')); } OA.render(true); }
      catch (e) { if (n) n.textContent = OA.online() ? 'The forecast did not load. Type the temperature instead.' : 'No signal. Type the temperature instead.'; el.disabled = false; }
    },
    waterAddGap() { const i = OA.$('#wgapmi'), v = parseFloat(i && i.value); if (!(v > 0)) return OA.toast('Type the miles between water.'); const mi = OA.unit.dist() === 'km' ? v / OA.mi2km : v; W().manualGaps.push(Math.round(mi * 10) / 10); OA.save(); OA.render(true); },
    waterDelGap(el) { W().manualGaps.splice(parseInt(el.dataset.i, 10), 1); OA.save(); OA.render(true); },
    waterLogAdd(el) { const w = W(), k = OA.dkey(), v = Math.max(0, Math.round((num(w.log[k], 0) + parseFloat(el.dataset.l)) * 100) / 100); w.log[k] = v; OA.save(); OA.render(true); },
    bdWeightAdd() {
      const i = OA.$('#bdw'), v = parseFloat(i && i.value); if (!(v > 20 && v < 700)) return OA.toast('Type your weight.');
      const b = B(), k = OA.dkey(), lb = Math.round(dispToLb(v) * 10) / 10, ex = b.weights.find(w => w.d === k);
      if (ex) ex.lb = lb; else b.weights.push({ d: k, lb });
      OA.save(); OA.toast('Logged.'); OA.render(true);
    },
    bdWeightUndo() { const b = B(); b.weights.sort((a, c) => a.d < c.d ? -1 : 1); b.weights.pop(); OA.save(); OA.render(true); },
    bdCopyWants() { copyText(healthicaWantsText()); }
  });

  /* ================================================================ chart after render */
  OA.on('render', () => {
    const c = OA.$('#bdchart'); if (!c || !OA.chart || !OA.chart.spark) return;
    try { const ws = B().weights.slice().sort((a, b) => a.d < b.d ? -1 : 1).map(w => lbToDisp(w.lb)); if (ws.length > 1) c.innerHTML = OA.chart.spark(ws) || ''; } catch (e) { }
  });

  /* ================================================================ registry + Today card */
  BP.packSections = BP.packSections.filter(s => s.id !== 'food' && s.id !== 'water' && s.id !== 'body');
  BP.packSections.push({ id: 'food', label: 'Food', order: 20, render: renderFood }, { id: 'water', label: 'Water', order: 30, render: renderWater }, { id: 'body', label: 'Body', order: 40, render: renderBody });

  BP.todayCards.push({
    order: 45,
    render() {
      const f = F(), t = target(), hasMenu = syncDays().some(m => dayTotals(m).n > 0), pr = window.BP && BP.pack && BP.pack.profile ? BP.pack.profile() : null;
      const showFood = t && (f.touched || hasMenu || (pr && pr.set && (pr.set.weightLb || pr.set.packLb)));
      let nw = null; try { const n = window.BP && BP.trail && BP.trail.nextOf && BP.trail.nextOf(['water'], 1); nw = n && n[0] ? n[0] : null; } catch (e) { }
      if (!showFood && !nw) return '';
      const bits = [];
      if (showFood) { const d0 = hasMenu ? dayTotals(syncDays()[0]) : null, lb = d0 ? d0.lb : targetLbPerDay(); bits.push(`<div><b>${fk(t.kcal)}</b><span>KCAL TARGET</span></div>`); if (lb) bits.push(`<div><b>${esc(fwLb(lb))}</b><span>FOOD / DAY</span></div>`); }
      let wnote = '';
      if (nw) {
        const r = wRate(), pace = pr ? pr.paceMph : 2.5, c = gapLiters(nw.distMi, pace, r.lph, nw.distMi < 0.3 ? 0 : num(W().reserveL, 0.5));
        bits.push(`<div><b>${nw.distMi < 0.3 ? 'Here' : esc(OA.round(c.total, 1)) + ' L'}</b><span>WATER TO ${esc(String((nw.point && nw.point.name) || 'NEXT').toUpperCase().slice(0, 14))}</span></div>`);
        wnote = `<div class="xs dim">${nw.distMi < 0.3 ? 'A listed water source is right here.' : 'Next listed water is ' + esc(OA.dist(nw.distMi)) + ' ahead' + (nw.point && nw.point.name ? ' (' + esc(nw.point.name) + ')' : '') + '. Sources can be dry: ask locally.'}</div>`;
      }
      return `<section class="card"><div class="ct"><span>${OA.icon('drop')} Fuel and water today</span><button class="lnk" data-act="foodGo" data-sec="food">Open</button></div><div class="stat">${bits.join('')}</div>${wnote}</section>`;
    }
  });
  OA.act('foodGo', el => { OA.go('pack'); try { if (OA.acts.pkSec) OA.acts.pkSec({ dataset: { id: el.dataset.sec || 'food' } }); } catch (e) { } });
})();
