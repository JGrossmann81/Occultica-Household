/* Backpackica: Pack tab. Gear list with weights, calorie-burn model, and a registry other modules plug sections into.

   Registry (read at render time):  BP.packSections.push({id, label, order, render(el)})
   Public API on BP.pack:  profile(), packWeight(), burnPerDay(opts), burnPerMile(grade, loadLb, opts), dayBurn(day), summary(), terrains.
   The food module may define BP.pack.consumablesLb (a number or a function returning lb, or {lb}) for food, water and fuel by day-count.

   ------------------------------------------------------------------------------------------------------
   HOW THE BURN MODEL WORKS (kept in plain terms; the same text is shown in "How this is estimated")

   1. Oxygen cost of walking: ACSM walking equation (ACSM Guidelines for Exercise Testing and Prescription).
        VO2 (ml O2 per kg per min) = 0.1 * speed + 1.8 * speed * grade + 3.5      speed in m/min, grade as a fraction (0.10 = 10 percent)
      The 3.5 is resting oxygen use, so the result is a GROSS cost (it includes what you would burn standing still).
      Valid for roughly 1.9 to 3.7 mph; we clamp speed to 1.2 to 4.5 mph so odd inputs do not run away.
   2. Load: oxygen cost scales with the total mass that is moved (body + pack + worn clothing and shoes), so
        kcal per min = VO2 * total mass (kg) / 1000 * 4.86 kcal per litre of O2
      On top of that a small heavy-load term follows Pandolf et al. (1977): 2.0 * totalMass * (load / bodyMass)^2 watts, which is
      negligible for a light pack and grows quickly for a very heavy one (so each extra pound costs a little more than the last).
   3. Descents: the 1.8 * speed * grade term is dropped and the level cost is multiplied by an eccentric factor f(grade):
      f = 1 on the flat, falling to 0.5 at -10 percent (Minetti et al. 2002 find walking cost lowest near -10 percent at roughly
      half the level cost), rising again to 0.75 at -20 percent and to 1.0 at -30 percent and steeper (braking on steep ground costs effort).
   4. Terrain multiplier (Pandolf-style coefficients, rounded): smooth path 1.0, maintained trail 1.15, rocky or rooty 1.3, soft sand 2.0, snow 1.6.
   5. A day: the miles are split into climbing miles (assumed about 8 percent grade, steeper if the climb needs it), descending miles
      and flat miles. Moving time = miles / pace. Moving kcal = sum of each part. The other hours of the day cost the resting rate
      (Mifflin-St Jeor, Mifflin et al. 1990) times 1.25 for camp chores and sitting. Total is moving + other.
      Optional adders on the whole day: food digestion (about +7 percent, since hikers eat less than they burn), cold (+5), high altitude (+5).
   Honest accuracy: unvalidated; assume it can be off by 20 percent or more for any one person. Wind, heat, fatigue, fitness, pace changes on climbs and body
   fat are not modelled. It is a planning number, not a prescription. */
window.BP = window.BP || {};
BP.packSections = BP.packSections || [];
BP.pack = BP.pack || {};
BP.todayCards = BP.todayCards || [];
(function () {
  'use strict';
  const esc = OA.esc;
  const LB = 0.45359237, OZG = 28.349523125, MI_M = 1609.344, FT_M = 0.3048, MPH_MMIN = 26.8224, KCAL_PER_L = 4.86;
  const CATS = (window.GEAR_CATS && window.GEAR_CATS.length) ? window.GEAR_CATS : ['Shelter', 'Sleep', 'Pack', 'Clothing worn', 'Clothing carried', 'Kitchen', 'Water', 'Electronics', 'First aid and hygiene', 'Navigation and safety', 'Misc'];
  const PRE = window.GEAR_PRESETS || [];
  const PBYKEY = {}; PRE.forEach(p => { PBYKEY[p[0]] = p; });
  const TERRAIN = {
    road: { label: 'Smooth path or road', f: 1.0 },
    trail: { label: 'Maintained trail', f: 1.15 },
    rocky: { label: 'Rocky, rooty or overgrown', f: 1.3 },
    snow: { label: 'Snow (firm to soft)', f: 1.6 },
    sand: { label: 'Soft sand or scree', f: 2.0 }
  };
  const DEFAULT_CLOTHES_LB = 4;     // shoes and clothes when no gear list exists
  const DEFAULT_FOOD_WATER_LB = 5;  // used for the pack-weight guess only when no consumables are entered

  OA.defaults({ pack: { profile: {}, gear: [], lists: [] } });
  const S = () => { const s = OA.S; s.pack = s.pack || {}; s.pack.profile = s.pack.profile || {}; s.pack.gear = s.pack.gear || []; s.pack.lists = s.pack.lists || []; return s.pack; };
  const num = v => { v = parseFloat(v); return isFinite(v) ? v : 0; };
  const fmtN = n => Math.round(n).toLocaleString();
  const fmtR = n => (Math.round(n / 50) * 50).toLocaleString();   /* rough values: nearest 50 kcal */

  /* ---------------------------------------------------------------- lists and weights */
  function ensureLists() {
    const p = S();
    if (!p.lists.length) p.lists.push({ id: OA.uid(), name: 'My gear', gearIds: [] });
    const known = new Set(); p.lists.forEach(l => { l.gearIds = l.gearIds || []; l.gearIds.forEach(i => known.add(i)); });
    const valid = new Set(p.gear.map(g => g.id));
    p.lists.forEach(l => { l.gearIds = l.gearIds.filter(i => valid.has(i)); });
    p.gear.forEach(g => { if (!known.has(g.id)) p.lists[0].gearIds.push(g.id); });
    if (!p.lists.find(l => l.id === p.profile.activeList)) p.profile.activeList = p.lists[0].id;
    return p;
  }
  const activeList = () => { const p = ensureLists(); return p.lists.find(l => l.id === p.profile.activeList) || p.lists[0]; };
  function itemsOf(list) { const ids = new Set(list.gearIds); return S().gear.filter(g => ids.has(g.id)); }
  const itemOz = g => num(g.oz) * (g.qty == null ? 1 : Math.max(0, num(g.qty)));
  function extraConsumablesLb() {
    let v = BP.pack.consumablesLb;
    try { if (typeof v === 'function') v = v(); } catch (e) { v = 0; }
    if (v && typeof v === 'object') v = v.lb != null ? v.lb : (v.total || 0);
    v = num(v); return v > 0 ? v : 0;
  }
  function weightsOf(items) {
    let base = 0, worn = 0, cons = 0;
    items.forEach(g => { const o = itemOz(g); if (g.worn) worn += o; else if (g.consumable) cons += o; else base += o; });
    return { baseLb: base / 16, wornLb: worn / 16, gearConsumableLb: cons / 16 };
  }
  function weightClass(baseLb) { return baseLb < 10 ? 'Ultralight' : baseLb <= 20 ? 'Lightweight' : 'Traditional'; }
  BP.pack.packWeight = BP.pack.packWeight || function () {
    const items = itemsOf(activeList()), w = weightsOf(items), ex = extraConsumablesLb();
    const consumableLb = w.gearConsumableLb + ex;
    return { baseLb: w.baseLb, wornLb: w.wornLb, consumableLb, skinOutLb: w.baseLb + w.wornLb + consumableLb, items, gearConsumableLb: w.gearConsumableLb, foodModuleLb: ex, cls: weightClass(w.baseLb), entered: items.length > 0 };
  };

  /* ---------------------------------------------------------------- profile */
  BP.pack.profile = BP.pack.profile || function () {
    const p = S().profile, set = {};
    const pick = (k, d) => { const v = p[k]; if (v != null && v !== '' && isFinite(v)) { set[k] = true; return +v; } return d; };
    const sex = p.sex === 'f' || p.sex === 'm' ? p.sex : null; set.sex = !!sex;
    const weightLb = pick('weightLb', 165), heightIn = pick('heightIn', 68), age = pick('age', 35);
    const pw = BP.pack.packWeight();
    let packLb;
    if (p.packLb != null && p.packLb !== '' && isFinite(p.packLb)) { packLb = +p.packLb; set.packLb = true; }
    else if (pw.entered) packLb = pw.baseLb + pw.consumableLb + (pw.consumableLb > 0 ? 0 : DEFAULT_FOOD_WATER_LB);
    else packLb = 22;
    return { sex, age, heightIn, heightCm: heightIn * 2.54, weightLb, kg: weightLb * LB, packWeightLb: packLb, paceMph: pick('paceMph', 2.5), hoursPerDay: pick('hoursPerDay', 8), set };
  };

  /* ---------------------------------------------------------------- burn model */
  /* multiplier on the level cost when going downhill (grade < 0), see header comment */
  function eccentric(g) {
    const d = -g; if (d <= 0) return 1;
    if (d <= 0.10) return 1 - 0.5 * d / 0.10;
    if (d <= 0.20) return 0.5 + 0.25 * (d - 0.10) / 0.10;
    if (d <= 0.30) return 0.75 + 0.25 * (d - 0.20) / 0.10;
    return 1;
  }
  const terrainF = t => (TERRAIN[t] || TERRAIN.trail).f;
  /* kcal per minute of walking (gross) */
  function kcalMin(grade, speedMph, bodyKg, loadKg, terrain) {
    const mph = OA.clamp(speedMph, 1.2, 4.5), S_ = mph * MPH_MMIN, tot = bodyKg + loadKg;
    const levelVo2 = 0.1 * S_ + 3.5;
    let kc = levelVo2 * tot / 1000 * KCAL_PER_L;
    kc += 2.0 * tot * Math.pow(loadKg / bodyKg, 2) * 0.014331;   // Pandolf heavy-load term (watts -> kcal/min)
    if (grade < 0) kc *= eccentric(grade);
    else kc += 1.8 * S_ * grade * tot / 1000 * KCAL_PER_L;
    return kc * terrainF(terrain);
  }
  /* kcal per mile at a grade (fraction, +up -down) carrying loadLb on top of body weight. opts {kg, paceMph, terrain} default to the profile */
  BP.pack.burnPerMile = BP.pack.burnPerMile || function (grade, loadLb, opts) {
    opts = opts || {}; const pr = BP.pack.profile();
    const kg = opts.kg || pr.kg, pace = opts.paceMph || pr.paceMph;
    return kcalMin(grade || 0, pace, kg, Math.max(0, num(loadLb)) * LB, opts.terrain || 'trail') * 60 / OA.clamp(pace, 1.2, 4.5);
  };
  function splitDay(miles, gainFt, lossFt) {
    const G = 0.08, FT = 5280;
    if (miles <= 0) return { up: 0, dn: 0, flat: 0, upG: 0, dnG: 0 };
    let up = gainFt / (G * FT), dn = lossFt / (G * FT);
    if (up + dn > miles) { const k = gainFt + lossFt; up = k ? miles * gainFt / k : 0; dn = miles - up; }
    return { up, dn, flat: Math.max(0, miles - up - dn), upG: up > 0 ? gainFt / (up * FT) : 0, dnG: dn > 0 ? -lossFt / (dn * FT) : 0 };
  }
  function wornForBurn() { const pw = BP.pack.packWeight(); return pw.entered ? pw.wornLb : DEFAULT_CLOTHES_LB; }
  BP.pack.burnPerDay = BP.pack.burnPerDay || function (o) {
    o = o || {}; const pr = BP.pack.profile();
    const pace = OA.clamp(num(o.paceMph) || pr.paceMph, 1.2, 4.5);
    const miles = o.miles != null && isFinite(o.miles) ? Math.max(0, +o.miles) : pr.paceMph * pr.hoursPerDay;
    const gain = Math.max(0, num(o.gainFt)), loss = Math.max(0, o.lossFt != null ? num(o.lossFt) : gain);
    const packLb = o.packLb != null && isFinite(o.packLb) ? Math.max(0, +o.packLb) : pr.packWeightLb;
    const loadLb = packLb + (o.wornLb != null ? num(o.wornLb) : wornForBurn());
    const terrain = o.terrain || 'trail', kg = o.kg || pr.kg;
    const sp = splitDay(miles, gain, loss);
    const flatMi = BP.pack.burnPerMile(0, loadLb, { kg, paceMph: pace, terrain });
    const upMi = sp.up > 0 ? BP.pack.burnPerMile(sp.upG, loadLb, { kg, paceMph: pace, terrain }) : 0;
    const dnMi = sp.dn > 0 ? BP.pack.burnPerMile(sp.dnG, loadLb, { kg, paceMph: pace, terrain }) : 0;
    const kcalMoving = sp.flat * flatMi + sp.up * upMi + sp.dn * dnMi;
    const moveH = Math.min(24, miles / pace);
    const sexAdj = pr.sex === 'm' ? 5 : pr.sex === 'f' ? -161 : -78;
    const bmr = 10 * kg + 6.25 * pr.heightCm - 5 * pr.age + sexAdj;
    const restH = Math.max(0, 24 - moveH);
    const kcalOther = Math.max(1000, bmr) * 1.25 * restH / 24;
    const thermic = o.thermic == null ? true : !!o.thermic;
    const adj = (thermic ? 0.07 : 0) + (o.cold ? 0.05 : 0) + (o.altitude ? 0.05 : 0);
    const base = kcalMoving + kcalOther;
    return {
      kcalMoving: Math.round(kcalMoving), kcalOther: Math.round(kcalOther), kcalTotal: Math.round(base * (1 + adj)),
      detail: { miles, pace, moveHours: moveH, restHours: restH, bmr: Math.round(bmr), loadLb, packLb, kcalPerMile: miles > 0 ? kcalMoving / miles : 0, flatMi: sp.flat, upMi: sp.up, dnMi: sp.dn, upGrade: sp.upG, dnGrade: sp.dnG, adjPct: adj * 100, adjKcal: Math.round(base * adj), terrain }
    };
  };
  BP.pack.dayBurn = BP.pack.dayBurn || function (day) {
    day = day || {};
    const m = day.miles != null ? day.miles : (day.mi != null ? day.mi : day.dist);
    return BP.pack.burnPerDay({ miles: m, gainFt: day.gainFt != null ? day.gainFt : day.gain, lossFt: day.lossFt != null ? day.lossFt : day.loss, packLb: day.packLb, terrain: day.terrain });
  };
  BP.pack.terrains = TERRAIN;
  function typicalDay() {
    const pr = BP.pack.profile(), mi = OA.clamp(pr.paceMph * pr.hoursPerDay, 5, 30);
    return { miles: mi, gainFt: mi * 120, lossFt: mi * 120 };   // roughly 120 ft of climb per mile is typical of long trails
  }
  BP.pack.summary = BP.pack.summary || function () {
    const pw = BP.pack.packWeight(), pr = BP.pack.profile();
    return { packLb: OA.round(pw.entered ? pw.baseLb + pw.consumableLb : pr.packWeightLb, 1), baseLb: OA.round(pw.baseLb, 1), kcalBurnDay: BP.pack.burnPerDay(typicalDay()).kcalTotal };
  };

  /* ---------------------------------------------------------------- units */
  const kgMode = () => OA.unit.wt() === 'kg';
  const kmMode = () => OA.unit.dist() === 'km';
  const wUnit = () => kgMode() ? 'g' : 'oz';
  const ozToDisp = oz => kgMode() ? OA.round(oz * OZG, 1) : OA.round(oz, 2);
  const dispToOz = v => kgMode() ? v / OZG : v;
  function fmtOz(oz) {
    if (kgMode()) { const g = oz * OZG; return g < 1000 ? Math.round(g) + ' g' : OA.round(g / 1000, 2) + ' kg'; }
    if (oz < 16) return OA.round(oz, 1) + ' oz';
    let lb = Math.floor(oz / 16), r = OA.round(oz - lb * 16, 1); if (r >= 16) { lb++; r = 0; }
    return lb + ' lb ' + r + ' oz';
  }
  const fmtLb = lb => OA.wt(lb, 1);
  const lbToDisp = lb => kgMode() ? lb * LB : lb;
  const dispToLb = v => kgMode() ? v / LB : v;

  /* ---------------------------------------------------------------- module UI state (not saved) */
  const ui = { sec: 'gear', q: '', cat: '', sort: 'cat', all: false, profOpen: false, added: 0 };

  /* ---------------------------------------------------------------- items */
  function newItem(o) { return Object.assign({ id: OA.uid() + Math.random().toString(36).slice(2, 4), name: 'Item', cat: 'Misc', oz: 0, qty: 1, worn: false, consumable: false, note: '', tag: '' }, o); }
  function addToList(item, listId) { const p = ensureLists(); p.gear.push(item); const l = p.lists.find(x => x.id === (listId || p.profile.activeList)) || p.lists[0]; l.gearIds.push(item.id); return item; }
  function addPreset(key, qty, listId, skipHave) {
    const pr = PBYKEY[key]; if (!pr) return null;
    const p = ensureLists(), l = p.lists.find(x => x.id === (listId || p.profile.activeList)) || p.lists[0];
    const have = itemsOf(l).find(g => g.tag === key);
    if (have) { if (skipHave) return null; have.qty = (have.qty || 1) + (qty || 1); return have; }
    return addToList(newItem({ name: pr[2], cat: pr[1], oz: pr[3], qty: qty || 1, worn: pr[4].indexOf('w') >= 0, consumable: pr[4].indexOf('c') >= 0, tag: key, note: 'typical weight, weigh yours' }), l.id);
  }
  function hintFor(g) { return (window.GEAR_HINTS && window.GEAR_HINTS[g.tag]) || (window.GEAR_CAT_HINTS && window.GEAR_CAT_HINTS[g.cat]) || 'Ask whether you use this most days. Things used rarely are the first to leave the pack.'; }

  /* ---------------------------------------------------------------- the tab */
  OA.tab({
    id: 'pack', label: 'Pack', icon: 'backpack', order: 40,
    render(el) {
      ensureLists();
      const secs = BP.packSections.slice().sort((a, b) => (a.order || 50) - (b.order || 50));
      if (!secs.find(s => s.id === ui.sec)) ui.sec = secs[0] ? secs[0].id : 'gear';
      el.innerHTML = OA.header('Pack', 'Gear, weight and calories') + profileCard() +
        `<div class="chips wrap" role="tablist">${secs.map(s => `<button class="chip ${s.id === ui.sec ? 'on' : ''}" role="tab" data-act="pkSec" data-id="${esc(s.id)}">${esc(s.label)}</button>`).join('')}</div><div id="pksec"></div>`;
      const host = OA.$('#pksec', el), sec = secs.find(s => s.id === ui.sec);
      if (sec) { try { sec.render(host); } catch (e) { console.error(e); host.innerHTML = `<div class="alert danger"><b class="t">This section hit a problem</b>${esc(e.message)}</div>`; } }
    }
  });
  BP.packSections = BP.packSections.filter(s => s.id !== 'gear' && s.id !== 'burn');
  BP.packSections.push({ id: 'gear', label: 'Gear', order: 10, render: renderGear }, { id: 'burn', label: 'Burn', order: 20, render: renderBurn });

  /* ---------------------------------------------------------------- profile card */
  function healthicaBody() { try { const h = window.OCC && OCC.get('healthica'); return h && h.data && h.data.body && h.data.body.kg ? h.data.body : null; } catch (e) { return null; } }
  function profSummary() {
    const pr = BP.pack.profile(), set = pr.set;
    const bits = [OA.wt(pr.weightLb, 0) + (set.weightLb ? '' : ' (default)'), kmMode() ? OA.round(pr.paceMph * 1.609344, 1) + ' km/h' : pr.paceMph + ' mph', pr.hoursPerDay + ' h walking'];
    return bits.join(' · ');
  }
  function profileCard() {
    const p = S().profile, pr = BP.pack.profile(), hb = healthicaBody();
    const km = kmMode(), kgm = kgMode();
    const val = (k, f) => p[k] != null && p[k] !== '' ? f(+p[k]) : '';
    const fld = (k, label, v, ph, extra) => `<label class="fl">${label}<input class="in" type="number" inputmode="decimal" step="any" value="${esc(v)}" placeholder="${esc(ph)}" data-onchange="pkProf" data-k="${k}" ${extra || ''}></label>`;
    const head = `<div class="ct"><span>${OA.icon('heart')} About me</span><button class="lnk" data-act="pkProfToggle">${ui.profOpen ? 'Hide' : 'Edit'}</button></div>`;
    if (!ui.profOpen) return `<section class="card">${head}<div class="sm dim" id="pkprofsum">${esc(profSummary())}</div><div class="xs dim">Used for the calorie estimate. Stays on this phone. Defaults are used until you fill it in.</div></section>`;
    return `<section class="card">${head}<div class="sm dim" id="pkprofsum">${esc(profSummary())}</div>
      <div class="two"><label class="fl">Sex (for resting rate)<select class="in" data-onchange="pkProf" data-k="sex"><option value="" ${!pr.sex ? 'selected' : ''}>Not set</option><option value="f" ${pr.sex === 'f' ? 'selected' : ''}>Female</option><option value="m" ${pr.sex === 'm' ? 'selected' : ''}>Male</option></select></label>
      ${fld('age', 'Age (years)', val('age', v => v), '35')}</div>
      <div class="two">${fld('heightIn', 'Height (' + (km ? 'cm' : 'in') + ')', val('heightIn', v => km ? OA.round(v * 2.54, 0) : OA.round(v, 1)), km ? '173' : '68')}
      ${fld('weightLb', 'Body weight (' + (kgm ? 'kg' : 'lb') + ')', val('weightLb', v => kgm ? OA.round(v * LB, 1) : OA.round(v, 1)), kgm ? '75' : '165')}</div>
      <div class="two">${fld('paceMph', 'Hiking pace (' + (km ? 'km/h' : 'mph') + ')', val('paceMph', v => km ? OA.round(v * 1.609344, 1) : OA.round(v, 2)), km ? '4' : '2.5')}
      ${fld('hoursPerDay', 'Hours walking per day', val('hoursPerDay', v => v), '8')}</div>
      ${fld('packLb', 'Usual pack weight (' + (kgm ? 'kg' : 'lb') + '), blank = from gear list', val('packLb', v => kgm ? OA.round(v * LB, 1) : OA.round(v, 1)), kgm ? 'from gear list' : 'from gear list')}
      ${hb ? `<button class="btn block" data-act="pkHealthica">Use my Healthica numbers</button><div class="xs dim">From the Healthica app on this phone: weight ${esc(OA.wt(hb.kg / LB, 0))}${hb.age ? ', age ' + esc(hb.age) : ''}. Nothing is sent back.</div>` : ''}
      <div class="xs dim">Pace is your average moving speed including climbs; 2 to 3 mph is common on trails with packs. None of this is required.</div></section>`;
  }
  OA.act({
    pkProfToggle() { ui.profOpen = !ui.profOpen; OA.render(true); },
    pkProf(el) {
      const k = el.dataset.k, p = S().profile; let v = el.value;
      if (k === 'sex') { p.sex = v === 'f' || v === 'm' ? v : null; }
      else {
        v = parseFloat(v);
        if (!isFinite(v) || v < 0) delete p[k];
        else {
          if (k === 'heightIn' && kmMode()) v = v / 2.54;
          if ((k === 'weightLb' || k === 'packLb') && kgMode()) v = v / LB;
          if (k === 'paceMph' && kmMode()) v = v / 1.609344;
          p[k] = OA.round(v, 3);
        }
      }
      OA.saveSoon(); const s = OA.$('#pkprofsum'); if (s) s.textContent = profSummary();
    },
    pkHealthica() {
      const b = healthicaBody(); if (!b) return OA.toast('No Healthica numbers found on this phone.');
      const p = S().profile; p.weightLb = OA.round(b.kg / LB, 1);
      if (b.age) p.age = +b.age; if (b.heightCm) p.heightIn = OA.round(b.heightCm / 2.54, 1);
      const sx = String(b.sex || '').toLowerCase().charAt(0); if (sx === 'f' || sx === 'm') p.sex = sx;
      OA.save(); OA.toast('Filled in from Healthica. Check the numbers.'); OA.render(true);
    },
    pkSec(el) { ui.sec = el.dataset.id; OA.render(); window.scrollTo(0, 0); }
  });

  /* ---------------------------------------------------------------- gear section */
  function renderGear(el) {
    const p = ensureLists(), l = activeList(), pw = BP.pack.packWeight(), items = pw.items;
    const chips = p.lists.map(x => `<button class="chip ${x.id === l.id ? 'on' : ''}" data-act="pkUseList" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('');
    const tot = pw.skinOutLb;
    const foodNote = pw.foodModuleLb > 0 ? `Consumables include ${esc(fmtLb(pw.foodModuleLb))} of food, water and fuel from your food plan.` : 'Consumables are food, water and fuel. Add water or fuel from the presets; food is planned in the other sections.';
    const stats = `<div class="stat" style="grid-template-columns:repeat(2,1fr)"><div><b>${esc(fmtLb(pw.baseLb))}</b><span>BASE (carried, no consumables)</span></div><div><b>${esc(fmtLb(pw.wornLb))}</b><span>WORN</span></div><div><b>${esc(fmtLb(pw.consumableLb))}</b><span>CONSUMABLES</span></div><div><b>${esc(fmtLb(tot))}</b><span>SKIN-OUT (everything)</span></div></div>`;
    const rng = pw.cls === 'Ultralight' ? ['base under 10 lb', 'base under 4.5 kg'] : pw.cls === 'Lightweight' ? ['base 10 to 20 lb', 'base 4.5 to 9 kg'] : ['base over 20 lb', 'base over 9 kg'];
    const cls = items.length ? `<div><span class="tag a">${esc(pw.cls)}</span> <span class="xs dim">${rng[kgMode() ? 1 : 0]}</span></div>` : '';
    const catRows = CATS.map(c => ({ c, oz: OA.sum(items.filter(g => g.cat === c), itemOz) })).filter(r => r.oz > 0).sort((a, b) => b.oz - a.oz);
    const chart = catRows.length ? `<h3>Weight by category</h3>${OA.chart.bars(catRows.map(r => ({ label: r.c, v: r.oz, note: fmtOz(r.oz) })))}<div class="xs dim">Includes worn items and consumables.</div>` : '';
    const empty = !items.length ? `<section class="card tip"><div class="ct"><span>${OA.icon('backpack')} Start your list</span></div><p class="sm">Your gear list shows what you carry, what you wear and what you use up. Start from a starter kit and edit it, or add items one at a time. Weights come from common typical values: weigh your own gear on a scale for real numbers.</p>
      <button class="btn gold block" data-act="pkKits" data-smoke>Pick a starter kit</button><button class="btn block" data-act="pkPresets">Add items from the presets</button></section>` : '';
    el.innerHTML = `<section class="card"><div class="ct"><span>${OA.icon('backpack')} Pack weight</span></div>${cls}
      <div class="chips">${chips}</div>${stats}<div class="xs dim">${foodNote}</div>${chart}</section>${empty}
      <section class="card noprint"><div class="row wrap"><button class="btn gold" data-act="pkPresets" data-smoke>Add from presets</button><button class="btn" data-act="pkEdit" data-id="">Custom item</button></div>
      <div class="row wrap"><button class="btn" data-act="pkKits">Starter kits</button><button class="btn" data-act="pkWeigh">Weigh-in</button></div>
      <div class="row wrap"><button class="btn" data-act="pkHeavy">What is heavy</button><button class="btn" data-act="pkLists">Lists</button></div>
      <div class="row wrap"><button class="btn" data-act="pkExport">Export as text</button><button class="btn" data-act="pkPrint">Print</button></div></section>
      ${items.length ? `<section class="card"><div class="ct"><span>${OA.icon('list')} Items <span class="sm dim" id="pkcount"></span></span></div>
      <div class="noprint"><input class="in" id="pkq" type="search" placeholder="Search your items" value="${esc(ui.q)}" autocomplete="off">
      <div class="two"><select class="in" id="pkfcat" data-onchange="pkFilterCat"><option value="">All categories</option>${CATS.map(c => `<option value="${esc(c)}" ${ui.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <select class="in" data-onchange="pkSort"><option value="cat" ${ui.sort === 'cat' ? 'selected' : ''}>By category</option><option value="heavy" ${ui.sort === 'heavy' ? 'selected' : ''}>Heaviest first</option><option value="name" ${ui.sort === 'name' ? 'selected' : ''}>By name</option></select></div></div>
      <div id="pkitems"></div></section>` : ''}
      <p class="foot">Preset weights are typical figures for generic gear, not measurements of any product. Weigh your own.</p>`;
    drawItems();
  }
  function drawItems() {
    const box = OA.$('#pkitems'); if (!box) return;
    const q = ui.q.trim().toLowerCase();
    let items = BP.pack.packWeight().items.filter(g => (!ui.cat || g.cat === ui.cat) && (!q || (g.name + ' ' + g.cat + ' ' + (g.note || '')).toLowerCase().indexOf(q) >= 0));
    if (ui.sort === 'heavy') items.sort((a, b) => itemOz(b) - itemOz(a));
    else if (ui.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    else items.sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.name.localeCompare(b.name));
    const total = items.length, LIMIT = 80, shown = ui.all ? items : items.slice(0, LIMIT);
    const cnt = OA.$('#pkcount'); if (cnt) cnt.textContent = total + (total === 1 ? ' item' : ' items');
    const row = g => {
      const tags = (g.worn ? '<span class="tag g">worn</span>' : '') + (g.consumable ? '<span class="tag w">consumable</span>' : '') + (g.weighed ? '<span class="tag">weighed</span>' : '');
      return `<div class="li" data-act="pkEdit" data-id="${esc(g.id)}"><div class="tx"><b>${esc(g.name)}</b><span>${g.qty > 1 ? esc(g.qty) + ' x ' + esc(fmtOz(num(g.oz))) : esc(fmtOz(num(g.oz)))}${g.note ? ' · ' + esc(g.note) : ''}</span>${tags ? '<span>' + tags + '</span>' : ''}</div><div class="end b">${esc(fmtOz(itemOz(g)))}</div></div>`;
    };
    let html = '';
    if (!total) html = '<p class="sm dim">Nothing matches. Clear the search or the category filter.</p>';
    else if (ui.sort === 'cat') {
      let last = null;
      shown.forEach(g => {
        if (g.cat !== last) { last = g.cat; const sub = OA.sum(items.filter(x => x.cat === g.cat), itemOz); html += `<div class="ct" style="margin-top:12px;margin-bottom:0"><span>${esc(g.cat)}</span><span class="sm dim">${esc(fmtOz(sub))}</span></div>`; }
        html += row(g);
      });
    } else html = shown.map(row).join('');
    if (!ui.all && total > LIMIT) html += `<button class="btn block noprint" data-act="pkShowAll">Show all ${total} items</button>`;
    box.innerHTML = html;
  }
  document.addEventListener('input', e => {
    const t = e.target;
    if (t && t.id === 'pkq') { ui.q = t.value; drawItems(); }
    else if (t && t.id === 'pkpq') presetResults(t.value);
  });
  OA.act({
    pkUseList(el) { S().profile.activeList = el.dataset.id; OA.saveSoon(); OA.render(true); },
    pkFilterCat(el) { ui.cat = el.value; drawItems(); },
    pkSort(el) { ui.sort = el.value; drawItems(); },
    pkShowAll() { ui.all = true; drawItems(); },
    pkPrint() { ui.all = true; ui.sort = 'cat'; ui.cat = ''; ui.q = ''; OA.render(true); setTimeout(() => { try { window.print(); } catch (e) { OA.toast('Printing is not available here.'); } }, 150); }
  });

  /* ---- edit / add custom item */
  function editHTML(g) {
    const isNew = !g;
    g = g || { name: '', cat: 'Misc', oz: '', qty: 1, worn: false, consumable: false, note: '' };
    return `<label class="fl">Name<input class="in" id="pke-name" value="${esc(g.name)}" placeholder="e.g. Rain jacket" autocomplete="off"></label>
      <label class="fl">Category<select class="in" id="pke-cat">${CATS.map(c => `<option ${c === g.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <div class="two"><label class="fl">Weight of one (${wUnit()})<input class="in" id="pke-oz" type="number" inputmode="decimal" step="any" min="0" value="${g.oz === '' ? '' : esc(ozToDisp(num(g.oz)))}"></label>
      <label class="fl">How many<input class="in" id="pke-qty" type="number" inputmode="numeric" min="0" step="1" value="${esc(g.qty == null ? 1 : g.qty)}"></label></div>
      ${g.tag ? '<div class="xs dim">Started from a typical weight. Weigh it on a scale and type the real number.</div>' : ''}
      <label class="chk"><input type="checkbox" id="pke-worn" ${g.worn ? 'checked' : ''}> Worn (on my body while hiking)</label>
      <label class="chk"><input type="checkbox" id="pke-cons" ${g.consumable ? 'checked' : ''}> Consumable (used up: water, fuel, food)</label>
      <label class="fl">Note<input class="in" id="pke-note" value="${esc(g.note || '')}" placeholder="optional"></label>
      <button class="btn gold block" data-act="pkSaveItem" data-id="${esc(g.id || '')}">${isNew ? 'Add to list' : 'Save'}</button>
      ${isNew ? '' : `<div class="row"><button class="btn" data-act="pkDupItem" data-id="${esc(g.id)}">Duplicate</button><button class="btn danger" data-act="pkDelItem" data-id="${esc(g.id)}">Remove</button></div>`}`;
  }
  OA.act({
    pkEdit(el) {
      const g = el.dataset.id ? S().gear.find(x => x.id === el.dataset.id) : null;
      OA.sheet(g ? 'Edit item' : 'Custom item', editHTML(g));
    },
    pkSaveItem(el) {
      const name = OA.$('#pke-name').value.trim(); if (!name) return OA.toast('Give it a name.');
      const w = parseFloat(OA.$('#pke-oz').value), q = parseFloat(OA.$('#pke-qty').value);
      const f = { name, cat: OA.$('#pke-cat').value, oz: isFinite(w) && w >= 0 ? OA.round(dispToOz(w), 3) : 0, qty: isFinite(q) && q >= 0 ? Math.round(q) : 1, worn: OA.$('#pke-worn').checked, consumable: OA.$('#pke-cons').checked, note: OA.$('#pke-note').value.trim() };
      if (f.worn && f.consumable) f.consumable = false;
      const g = el.dataset.id ? S().gear.find(x => x.id === el.dataset.id) : null;
      if (g) { if (f.oz !== g.oz) g.weighed = true; Object.assign(g, f); } else { f.weighed = f.oz > 0; addToList(newItem(f)); }
      OA.save(); OA.closeSheet();
    },
    pkDupItem(el) { const g = S().gear.find(x => x.id === el.dataset.id); if (!g) return; const c = newItem(Object.assign({}, g, { id: undefined, name: g.name + ' (copy)' })); addToList(c); OA.save(); OA.toast('Duplicated.'); OA.closeSheet(); },
    async pkDelItem(el) {
      if (!await OA.confirm('Remove this item from your gear?', 'Remove')) return;
      const p = S(), id = el.dataset.id; p.gear = p.gear.filter(g => g.id !== id); p.lists.forEach(l => { l.gearIds = l.gearIds.filter(i => i !== id); }); OA.save(); OA.closeSheet();
    }
  });

  /* ---- presets */
  function presetResults(q) {
    const box = OA.$('#pkpres'); if (!box) return;
    q = (q || '').trim().toLowerCase();
    const cat = (OA.$('#pkpcat') || {}).value || '';
    let list = PRE.filter(p => (!cat || p[1] === cat) && (!q || (p[2] + ' ' + p[1]).toLowerCase().indexOf(q) >= 0));
    const n = list.length; list = list.slice(0, 40);
    box.innerHTML = list.map(p => `<div class="li" data-act="pkAddPreset" data-key="${esc(p[0])}"><div class="tx"><b>${esc(p[2])}</b><span>${esc(p[1])} · typical ${esc(fmtOz(p[3]))}${p[4].indexOf('w') >= 0 ? ' · worn' : ''}${p[4].indexOf('c') >= 0 ? ' · consumable' : ''}</span></div><div class="end"><span class="mini">Add</span></div></div>`).join('') +
      (n > 40 ? `<p class="xs dim">${n - 40} more. Type to narrow the list.</p>` : '') + (!n ? '<p class="sm dim">No match. Use "Custom item" to add your own.</p>' : '');
  }
  OA.act({
    pkPresets() {
      ui.added = 0;
      OA.sheet('Add from presets', `<p class="sm dim">Typical weights for common, generic gear. They are ballpark figures: <b>typical, weigh yours</b>. Tap an item to add it; tap again for another one.</p>
        <input class="in" id="pkpq" type="search" placeholder="Search: tent, stove, jacket" autocomplete="off">
        <select class="in" id="pkpcat" data-onchange="pkPresetCat"><option value="">All categories</option>${CATS.map(c => `<option>${esc(c)}</option>`).join('')}</select>
        <div id="pkadded" class="sm gold"></div><div id="pkpres"></div>`, { onOpen() { presetResults(''); } });
    },
    pkPresetCat() { presetResults((OA.$('#pkpq') || {}).value); },
    pkAddPreset(el) {
      const g = addPreset(el.dataset.key, 1); if (!g) return;
      OA.saveSoon(); ui.added++; OA.toast('Added: ' + g.name + (g.qty > 1 ? ' (now ' + g.qty + ')' : ''));
      const a = OA.$('#pkadded'); if (a) a.textContent = ui.added + ' added to "' + activeList().name + '". Close this screen when you are done.';
    }
  });

  /* ---- starter kits */
  function kitWeights(kit) {
    const items = kit.items.map(k => PBYKEY[k[0]] && { oz: PBYKEY[k[0]][3] * k[1], worn: PBYKEY[k[0]][4].indexOf('w') >= 0, consumable: PBYKEY[k[0]][4].indexOf('c') >= 0, qty: 1 }).filter(Boolean);
    return weightsOf(items);
  }
  OA.act({
    pkKits() {
      const kits = window.GEAR_KITS || [];
      OA.sheet('Starter kits', `<p class="sm dim">Each kit is a full set of generic items with typical weights. Add it, then change anything that does not match your gear and weigh it.</p>` + kits.map(k => {
        const w = kitWeights(k);
        return `<section class="card"><div class="ct"><span>${esc(k.name)}</span></div><p class="sm">${esc(k.desc)}</p><div class="sm dim">${k.items.length} items · base about ${esc(fmtLb(w.baseLb))} (typical)</div>
          <div class="row"><button class="btn gold" data-act="pkKitAdd" data-id="${esc(k.id)}">Add to "${esc(activeList().name)}"</button><button class="btn" data-act="pkKitNew" data-id="${esc(k.id)}">Start a new list</button></div></section>`;
      }).join(''));
    },
    pkKitAdd(el) { const k = (window.GEAR_KITS || []).find(x => x.id === el.dataset.id); if (!k) return; const l = activeList(); let n = 0; k.items.forEach(i => { if (addPreset(i[0], i[1], l.id, true)) n++; }); OA.save(); OA.toast(n + ' items added.'); OA.closeSheet(); },
    pkKitNew(el) {
      const k = (window.GEAR_KITS || []).find(x => x.id === el.dataset.id); if (!k) return;
      const p = ensureLists(), l = { id: OA.uid(), name: k.name.replace(/ starter list$/, ''), gearIds: [] }; p.lists.push(l); p.profile.activeList = l.id;
      k.items.forEach(i => addPreset(i[0], i[1], l.id, true)); OA.save(); OA.toast('New list: ' + l.name); OA.closeSheet();
    }
  });

  /* ---- weigh-in */
  function weighHTML() {
    const items = BP.pack.packWeight().items.slice().sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.name.localeCompare(b.name));
    if (!items.length) return '<p class="sm dim">Add some items first.</p>';
    const done = items.filter(g => g.weighed).length;
    let last = null, html = `<p class="sm dim">Put each item on a kitchen or luggage scale and type what it reads, in ${wUnit() === 'oz' ? 'ounces' : 'grams'}. Weigh one of each. Items you have weighed are marked.</p>
      <div class="card tip"><div class="kv"><span>Weighed</span><b id="wiCount">${done} of ${items.length}</b></div><div class="kv"><span>Base weight now</span><b id="wiBase">${esc(fmtLb(BP.pack.packWeight().baseLb))}</b></div></div>`;
    items.forEach(g => {
      if (g.cat !== last) { last = g.cat; html += `<div class="ct" style="margin:12px 0 0"><span>${esc(g.cat)}</span></div>`; }
      html += `<div class="li" style="cursor:default"><div class="tx"><b>${esc(g.name)}</b><span id="wi-s-${esc(g.id)}">${g.weighed ? 'weighed' : 'typical value'}${g.qty > 1 ? ' · ' + esc(g.qty) + ' of them, weigh one' : ''}</span></div>
        <div class="end"><input class="in" style="width:96px;text-align:right" type="number" inputmode="decimal" step="any" min="0" value="${esc(ozToDisp(num(g.oz)))}" data-onchange="pkWeighSet" data-id="${esc(g.id)}" aria-label="${esc(g.name)} weight in ${wUnit()}"></div></div>`;
    });
    return html;
  }
  OA.act({
    pkWeigh() { OA.sheet('Weigh-in', weighHTML()); },
    pkWeighSet(el) {
      const g = S().gear.find(x => x.id === el.dataset.id), v = parseFloat(el.value); if (!g) return;
      if (!isFinite(v) || v < 0) return OA.toast('Type the number from the scale.');
      g.oz = OA.round(dispToOz(v), 3); g.weighed = true; OA.saveSoon();
      const s = OA.$('#wi-s-' + g.id); if (s) s.textContent = 'weighed';
      const items = BP.pack.packWeight().items, c = OA.$('#wiCount'), b = OA.$('#wiBase');
      if (c) c.textContent = items.filter(x => x.weighed).length + ' of ' + items.length; if (b) b.textContent = fmtLb(BP.pack.packWeight().baseLb);
    }
  });

  /* ---- what is heavy */
  OA.act({
    pkHeavy() {
      const pw = BP.pack.packWeight(), base = pw.items.filter(g => !g.worn && !g.consumable).sort((a, b) => itemOz(b) - itemOz(a));
      if (!base.length) return OA.sheet('What is heavy', '<p class="sm dim">Add some gear first. This lists the five heaviest things you carry.</p>');
      const top = base.slice(0, 5), topOz = OA.sum(top, itemOz), baseOz = pw.baseLb * 16;
      const big3 = OA.sum(base.filter(g => g.cat === 'Shelter' || g.cat === 'Sleep' || g.cat === 'Pack'), itemOz);
      OA.sheet('What is heavy', `<p class="sm dim">The five heaviest things in your base weight. Ideas are general: what lighter options usually look like, not what to buy. Safety gear should not be traded for weight.</p>` +
        top.map((g, i) => `<section class="card"><div class="ct"><span>${i + 1}. ${esc(g.name)}</span><span class="sm dim">${esc(fmtOz(itemOz(g)))}</span></div><div class="bar"><i style="width:${Math.round(itemOz(g) / itemOz(top[0]) * 100)}%"></i></div><p class="sm" style="margin-top:8px">${esc(hintFor(g))}</p></section>`).join('') +
        `<div class="card inner"><div class="kv"><span>These five are</span><b>${Math.round(topOz / baseOz * 100)}% of base weight</b></div><div class="kv"><span>Shelter + sleep + pack (the "big three")</span><b>${Math.round(big3 / baseOz * 100)}% (${esc(fmtOz(big3))})</b></div></div>
        <p class="xs dim">Many hikers find the big three are over half of base weight, so that is where the biggest saving usually is. Small items still add up.</p>`);
    }
  });

  /* ---- lists */
  function listsHTML() {
    const p = ensureLists(), cur = activeList(), cw = weightsOf(itemsOf(cur));
    const rows = p.lists.map(l => {
      const w = weightsOf(itemsOf(l)), d = w.baseLb - cw.baseLb;
      return `<section class="card ${l.id === cur.id ? 'hot' : ''}"><label class="fl">List name<input class="in" value="${esc(l.name)}" data-onchange="pkListName" data-id="${esc(l.id)}"></label>
        <div class="sm dim">${l.gearIds.length} items · base ${esc(fmtLb(w.baseLb))} · skin-out ${esc(fmtLb(w.baseLb + w.wornLb + w.gearConsumableLb))}${l.id !== cur.id ? ' · ' + (d >= 0 ? '+' : '-') + esc(fmtLb(Math.abs(d))) + ' vs ' + esc(cur.name) : ' · in use'}</div>
        <div class="row wrap">${l.id !== cur.id ? `<button class="btn" data-act="pkListUse" data-id="${esc(l.id)}">Use</button>` : ''}<button class="btn" data-act="pkListDup" data-id="${esc(l.id)}">Duplicate</button><button class="btn danger" data-act="pkListDel" data-id="${esc(l.id)}">Delete</button></div></section>`;
    }).join('');
    const table = p.lists.length > 1 ? `<h3>Compare base weights</h3><div class="scroll-x"><table class="t"><tr><th>List</th><th>Items</th><th>Base</th><th>Worn</th></tr>${p.lists.map(l => { const w = weightsOf(itemsOf(l)); return `<tr><td>${esc(l.name)}</td><td>${l.gearIds.length}</td><td class="b">${esc(fmtLb(w.baseLb))}</td><td>${esc(fmtLb(w.wornLb))}</td></tr>`; }).join('')}</table></div>` : '';
    return `<p class="sm dim">Keep one list per section or season, such as Desert and Sierra, and compare them. Duplicating a list copies its items so you can change the copy freely.</p>${rows}<button class="btn gold block" data-act="pkListNew">New empty list</button>${table}`;
  }
  OA.act({
    pkLists() { OA.sheet('Lists', listsHTML()); },
    pkListName(el) { const l = S().lists.find(x => x.id === el.dataset.id); if (l && el.value.trim()) { l.name = el.value.trim().slice(0, 40); OA.saveSoon(); } },
    pkListUse(el) { S().profile.activeList = el.dataset.id; OA.save(); OA.redrawSheet(listsHTML()); },
    pkListNew() { const p = ensureLists(), l = { id: OA.uid(), name: 'List ' + (p.lists.length + 1), gearIds: [] }; p.lists.push(l); p.profile.activeList = l.id; OA.save(); OA.redrawSheet(listsHTML()); },
    pkListDup(el) {
      const p = ensureLists(), src = p.lists.find(x => x.id === el.dataset.id); if (!src) return;
      const l = { id: OA.uid(), name: src.name + ' copy', gearIds: [] }; itemsOf(src).forEach(g => { const c = newItem(Object.assign({}, g, { id: undefined })); p.gear.push(c); l.gearIds.push(c.id); });
      p.lists.push(l); p.profile.activeList = l.id; OA.save(); OA.toast('Duplicated. You are now on the copy.'); OA.redrawSheet(listsHTML());
    },
    async pkListDel(el) {
      const p = ensureLists(), l = p.lists.find(x => x.id === el.dataset.id); if (!l) return;
      if (!await OA.confirm('Delete the list "' + l.name + '" and its ' + l.gearIds.length + ' items? This cannot be undone.', 'Delete')) return;
      p.lists = p.lists.filter(x => x.id !== l.id); const keep = new Set(); p.lists.forEach(x => x.gearIds.forEach(i => keep.add(i)));
      p.gear = p.gear.filter(g => keep.has(g.id) || l.gearIds.indexOf(g.id) < 0);
      ensureLists(); OA.save(); OA.redrawSheet(listsHTML());
    }
  });

  /* ---- export */
  function exportText() {
    const l = activeList(), pw = BP.pack.packWeight(), out = [];
    out.push('Gear list: ' + l.name, 'Base ' + fmtLb(pw.baseLb) + ' (' + pw.cls + ') | Worn ' + fmtLb(pw.wornLb) + ' | Consumables ' + fmtLb(pw.consumableLb) + ' | Skin-out ' + fmtLb(pw.skinOutLb), '');
    CATS.forEach(c => {
      const its = pw.items.filter(g => g.cat === c); if (!its.length) return;
      out.push(c.toUpperCase() + ' (' + fmtOz(OA.sum(its, itemOz)) + ')');
      its.forEach(g => out.push('  - ' + g.name + (g.qty > 1 ? ' x' + g.qty : '') + ': ' + fmtOz(itemOz(g)) + (g.worn ? ' [worn]' : '') + (g.consumable ? ' [consumable]' : '') + (g.weighed ? '' : ' [typical]')));
      out.push('');
    });
    out.push('Weights marked [typical] are estimates, not measured. Made with Backpackica.');
    return out.join('\n');
  }
  OA.act({
    pkExport() {
      if (!BP.pack.packWeight().items.length) return OA.toast('Nothing to export yet.');
      OA.sheet('Export as text', `<p class="sm dim">Share this list, paste it into notes, or save it as a file.</p><textarea class="in" rows="14" id="pkexp">${esc(exportText())}</textarea>
        <button class="btn gold block" data-act="pkExpShare">Share or copy</button><button class="btn block" data-act="pkExpFile">Save as a text file</button>`);
    },
    pkExpShare() { OA.share.send({ title: 'Gear list: ' + activeList().name, text: OA.$('#pkexp').value }); },
    pkExpFile() { OA.download('gear-' + activeList().name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.txt', 'text/plain', OA.$('#pkexp').value); }
  });

  /* ---------------------------------------------------------------- burn section */
  function calcVals() {
    const c = S().profile.calc || {}, pr = BP.pack.profile(), pw = BP.pack.packWeight();
    const mi = Math.round(pr.paceMph * pr.hoursPerDay * 10) / 10;
    return {
      miles: c.miles != null ? c.miles : mi, gainFt: c.gainFt != null ? c.gainFt : Math.round(mi * 120 / 100) * 100, lossFt: c.lossFt != null ? c.lossFt : Math.round(mi * 120 / 100) * 100,
      packLb: c.packLb != null ? c.packLb : OA.round(pr.packWeightLb, 1), terrain: c.terrain || 'trail', cold: !!c.cold, altitude: !!c.altitude, thermic: c.thermic == null ? true : !!c.thermic, fromGear: pw.entered
    };
  }
  function renderBurn(el) {
    const v = calcVals(), km = kmMode(), kgm = kgMode(), pw = BP.pack.packWeight();
    const f = (id, label, val, k) => `<label class="fl">${label}<input class="in" id="${id}" type="number" inputmode="decimal" step="any" min="0" value="${esc(val)}" data-onchange="pkCalc"></label>`;
    el.innerHTML = `<section class="card"><div class="ct"><span>${OA.icon('flame')} Daily burn</span><button class="lnk" data-act="pkHow" data-smoke>How is this estimated?</button></div>
      <p class="sm dim">Describe a day of walking and get an estimate of what you burn, including the hours you are not walking.</p>
      <div class="two">${f('pkc-mi', 'Distance (' + (km ? 'km' : 'miles') + ')', OA.round(km ? v.miles * 1.609344 : v.miles, 1))}${f('pkc-pk', 'Pack weight (' + (kgm ? 'kg' : 'lb') + ')', OA.round(lbToDisp(v.packLb), 1))}</div>
      <div class="two">${f('pkc-up', 'Climb (' + (km ? 'm' : 'ft') + ')', Math.round(km ? v.gainFt * FT_M : v.gainFt))}${f('pkc-dn', 'Descent (' + (km ? 'm' : 'ft') + ')', Math.round(km ? v.lossFt * FT_M : v.lossFt))}</div>
      ${pw.entered ? `<button class="btn block" data-act="pkUseGear">Use my gear list (${esc(fmtLb(pw.baseLb + pw.consumableLb))} carried)</button>` : `<div class="xs dim">Add gear in the Gear section to fill the pack weight from your list.</div>`}
      <label class="fl">Ground<select class="in" id="pkc-terr" data-onchange="pkCalc">${Object.keys(TERRAIN).map(k => `<option value="${k}" ${v.terrain === k ? 'selected' : ''}>${esc(TERRAIN[k].label)}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" id="pkc-th" ${v.thermic ? 'checked' : ''} data-onchange="pkCalc"> Add food digestion (about 7%)</label>
      <label class="chk"><input type="checkbox" id="pkc-cold" ${v.cold ? 'checked' : ''} data-onchange="pkCalc"> Cold or wet day (+5%)</label>
      <label class="chk"><input type="checkbox" id="pkc-alt" ${v.altitude ? 'checked' : ''} data-onchange="pkCalc"> High altitude, above about 8,000 ft / 2,400 m (+5%)</label></section>
      <div id="pkres"></div>`;
    drawBurnResult();
  }
  function readCalc() {
    const g = id => { const e = OA.$(id); return e ? e.value : ''; };
    const p = S().profile, km = kmMode(), n = (id, d) => { const x = parseFloat(g(id)); return isFinite(x) && x >= 0 ? x : d; };
    const c = p.calc = p.calc || {}, cur = calcVals();
    c.miles = OA.round(km ? n('#pkc-mi', cur.miles * 1.609344) / 1.609344 : n('#pkc-mi', cur.miles), 3);
    c.packLb = OA.round(dispToLb(n('#pkc-pk', lbToDisp(cur.packLb))), 3);
    c.gainFt = Math.round(km ? n('#pkc-up', cur.gainFt * FT_M) / FT_M : n('#pkc-up', cur.gainFt));
    c.lossFt = Math.round(km ? n('#pkc-dn', cur.lossFt * FT_M) / FT_M : n('#pkc-dn', cur.lossFt));
    c.terrain = g('#pkc-terr') || 'trail';
    const ck = id => { const e = OA.$(id); return !!(e && e.checked); };
    c.thermic = ck('#pkc-th'); c.cold = ck('#pkc-cold'); c.altitude = ck('#pkc-alt');
    OA.saveSoon();
  }
  function drawBurnResult() {
    const box = OA.$('#pkres'); if (!box) return;
    const v = calcVals(), pr = BP.pack.profile(), km = kmMode();
    const opts = { miles: v.miles, gainFt: v.gainFt, lossFt: v.lossFt, packLb: v.packLb, terrain: v.terrain, cold: v.cold, altitude: v.altitude, thermic: v.thermic };
    const r = BP.pack.burnPerDay(opts), d = r.detail;
    const r2 = BP.pack.burnPerDay(Object.assign({}, opts, { packLb: v.packLb + 1 })), perLb = r2.kcalTotal - r.kcalTotal;
    const perUnit = kgMode() ? perLb / LB : perLb;
    const t = r.kcalTotal;
    const msg = t < 2200 ? 'A light day. Your body still needs its full resting needs, so eat normally.' : t < 3500 ? 'A moderate day, like a short or easy hike.' : t <= 6000 ? 'This is in the range long-distance hikers often burn (about 3,500 to 6,000 kcal a day).' : 'Higher than most people sustain. Check the distance and climb you entered; very few hikers burn this much for many days.';
    // chart: burn vs pack weight
    const maxP = Math.max(40, Math.ceil(v.packLb * 1.4 / 5) * 5), pts = [];
    for (let x = 0; x <= maxP; x += maxP / 20) pts.push([lbToDisp(x), BP.pack.burnPerDay(Object.assign({}, opts, { packLb: x })).kcalTotal]);
    const chart = OA.chart.profile(pts, [{ x: lbToDisp(v.packLb), label: 'you' }], { xfmt: x => Math.round(x), yfmt: y => fmtN(y), label: 'Daily calories against pack weight' });
    const hb = healthicaBody();
    box.innerHTML = `<section class="card hot"><div class="ct"><span>Estimated burn</span><span class="sm dim">${esc(OA.hm(d.moveHours))} walking</span></div>
      <div class="center"><div class="big-num">${fmtR(r.kcalTotal)}</div><div class="sm dim">kcal for the day (rough estimate)</div></div>
      <div class="stat"><div><b>${fmtR(r.kcalMoving)}</b><span>WALKING</span></div><div><b>${fmtR(r.kcalOther)}</b><span>REST OF DAY</span></div><div><b>${fmtN(d.kcalPerMile * (km ? 0.621371 : 1))}</b><span>PER ${km ? 'KM' : 'MILE'} (AVG)</span></div></div>
      ${d.adjKcal ? `<div class="xs dim">Includes ${fmtN(d.adjKcal)} kcal from the options ticked above.</div>` : ''}
      <p class="sm">${esc(msg)}</p>
      <div class="alert ok"><b class="t">Hiker hunger is normal</b>Most long-distance hikers cannot eat everything they burn at first, and appetite grows over the first weeks. Eat often, favor calorie-dense food, and do not skip meals on hard days. If you feel faint, shaky or confused, stop, eat and drink, and rest.</div>
      ${hb && hb.tdee ? `<div class="sm dim">Your usual day in Healthica is about ${fmtN(hb.tdee)} kcal, so this day is roughly ${fmtN(Math.max(0, r.kcalTotal - hb.tdee))} kcal more.</div>` : ''}</section>
      <section class="card"><div class="ct"><span>What your pack costs</span></div>
      <p><span class="gold b">1 ${kgMode() ? 'kg' : 'lb'} of pack is about ${fmtN(perUnit)} kcal a day</span> at this pace and day. Carrying ${kgMode() ? '2 kg' : '5 lb'} less saves roughly ${fmtN(perUnit * (kgMode() ? 2 : 5))} kcal over the day.</p>
      <div class="xs dim" style="margin:6px 0 0">Calories a day against pack weight (${kgMode() ? 'kg' : 'lb'}). The dashed line is your pack now.</div>${chart}
      <div class="xs dim">Pack ${esc(fmtLb(v.packLb))} plus ${esc(fmtLb(d.loadLb - d.packLb))} of worn clothes and shoes, on a body weight of ${esc(OA.wt(pr.weightLb, 0))}${pr.set.weightLb ? '' : ' (default: set yours under About me)'}.</div></section>`;
  }
  OA.act({
    pkCalc() { readCalc(); drawBurnResult(); },
    pkUseGear() { const pw = BP.pack.packWeight(), c = S().profile.calc = S().profile.calc || {}; c.packLb = OA.round(pw.baseLb + pw.consumableLb, 2); OA.saveSoon(); OA.render(true); },
    pkHow() {
      OA.sheet('How this is estimated', `
        <p class="sm">This is a rough planning estimate. Real burn can easily differ from it by 20 percent or more in either direction, and it has not been checked against measurements on you. It is built from published walking-energy research, not from a wearable.</p>
        <h3>Walking</h3><p class="sm">The cost of walking comes from the American College of Sports Medicine (ACSM) walking equation: oxygen used depends on your speed and on the steepness of the ground. Oxygen is turned into calories at about 4.9 kcal per liter.</p>
        <h3>Load</h3><p class="sm">Everything you move costs energy, so the cost grows with your body weight plus the pack plus worn clothes and shoes. For heavy loads there is a small extra amount (from the Pandolf load-carriage studies), so each added pound costs a little more than the one before.</p>
        <h3>Downhill</h3><p class="sm">Going down a gentle slope costs less than flat walking: about half at a 10 percent grade. Very steep descents cost more again because of braking. The model uses that shape, so a day with lots of descent burns less than climbing the same height, but never nothing.</p>
        <h3>Ground</h3><p class="sm">Rough or soft ground multiplies the cost: maintained trail 1.15 times smooth path, rocky or rooty ground 1.3, snow 1.6 and soft sand 2.0. These are rough values in the spirit of the Pandolf terrain factors, not exact figures.</p>
        <h3>The rest of the day</h3><p class="sm">Hours you are not walking use your resting rate (Mifflin-St Jeor equation from age, height, weight and sex) times 1.25 for camp chores and sitting. Options add about 7 percent for digesting food, and 5 percent each for cold or wet weather and high altitude.</p>
        <h3>What it does not know</h3><ul class="ls sm"><li>Your fitness, fatigue and body fat; wind, heat and mud.</li><li>That you walk slower on climbs. It assumes your average pace all day.</li><li>Poles, which lower leg effort but add arm effort.</li></ul>
        <h3>Reality check</h3><p class="sm">Long-distance hikers often report burning roughly 3,500 to 6,000 kcal a day and usually cannot eat all of it, especially early on. Hiker hunger is normal. Treat these numbers as a starting point for planning food, then adjust to how you feel and how your weight changes over weeks.</p>
        <p class="xs dim">Sources: ACSM Guidelines for Exercise Testing and Prescription (walking equation); Pandolf et al. 1977, J Appl Physiol (load carriage and terrain); Minetti et al. 2002, J Appl Physiol (cost of walking on slopes); Mifflin et al. 1990, Am J Clin Nutr (resting rate).</p>`);
    }
  });

  /* ---------------------------------------------------------------- Today card */
  BP.todayCards.push({
    order: 40,
    render() {
      const pw = BP.pack.packWeight(); if (!pw.entered) return '';
      const kc = BP.pack.burnPerDay(typicalDay()).kcalTotal, td = typicalDay();
      return `<section class="card" data-go="pack" style="cursor:pointer"><div class="ct"><span>${OA.icon('backpack')} Pack</span><span class="sm dim">${esc(pw.cls)}</span></div>
        <div class="stat"><div><b>${esc(fmtLb(pw.baseLb))}</b><span>BASE WEIGHT</span></div><div><b>${esc(fmtLb(pw.baseLb + pw.consumableLb))}</b><span>CARRIED</span></div><div><b>${fmtN(kc)}</b><span>KCAL, TYPICAL DAY</span></div></div>
        <div class="xs dim">A typical day here is ${esc(OA.dist(td.miles, 0))} with some climbing. Open the Pack tab to change it.</div></section>`;
    }
  });
})();
