/* Hortica planning: planting and harvest dates, water map, nutrient lists, plant pages. */
const STEPN = { i: 'Start seeds indoors', t: 'Transplant outdoors', d: 'Sow seed outdoors', f: 'Fall planting', pe: 'Plant in spring', dm: 'Plant dormant (early spring or fall)' };
const STEPLEN = { i: 21, t: 28, d: 35, f: 18, pe: 42, dm: 42 };
function zoneNum() { return parseInt(S.loc.zone, 10) || 0; }
function zoneOk(p) { if (p.lk === 'house') return true; if (!p.zones || p.zones === '-') return true; const m = /(\d+)\D+(\d+)/.exec(p.zones); const z = zoneNum(); return !m || !z || (z >= +m[1] && z <= +m[2]); }
function plantDates(p, year) {
  year = year || NOW().getFullYear(); const F = frostDates(year), steps = [];
  p.sow.forEach(s => {
    let d;
    if (s.k === 'f') d = addD(F.first, -s.w * 7); else if (s.k === 'pe') d = addD(F.last, -14); else if (s.k === 'dm') d = addD(F.last, -35); else d = addD(F.last, s.w * 7);
    steps.push({ k: s.k, date: d, end: addD(d, STEPLEN[s.k]), label: STEPN[s.k] });
  });
  steps.sort((a, b) => a.date - b.date);
  let harv = null;
  if (!p.perm) {
    const out = steps.filter(s => s.k === 't' || s.k === 'd' || s.k === 'f'); const spring = out.filter(s => s.k !== 'f')[0] || (steps.filter(s => s.k === 'i')[0] ? { date: addD(steps.filter(s => s.k === 'i')[0].date, 49) } : null);
    if (spring) { const a = addD(spring.date, p.days); harv = { start: a, end: addD(a, p.hw * 7), season: 'spring' }; }
    const fall = out.filter(s => s.k === 'f')[0]; if (fall) { const a = addD(fall.date, p.days); if (harv) harv.fall = { start: a, end: addD(a, p.hw * 7) }; else harv = { start: a, end: addD(a, p.hw * 7), season: 'fall' }; }
  } else if (p.days < 400) { const a = addD(addD(F.last, -14), p.days); harv = { start: a, end: addD(a, p.hw * 7), season: 'perennial' }; }
  return { steps, harvest: harv };
}
function plantWindow(p) {
  const now = NOW(), y = now.getFullYear(); let cands = [];
  [y, y + 1].forEach(yy => plantDates(p, yy).steps.forEach(s => { if (s.k !== 'i' || true) cands.push(s); }));
  const L = S.loc; if (L.first >= 362 && L.last <= 15 && !p.perm) { /* frost free: most crops can go in during the cool months */ }
  const act = cands.filter(s => s.k !== 'i'); const pool = act.length ? act : cands;
  const nowS = pool.find(s => now >= addD(s.date, -7) && now <= s.end);
  if (nowS) return { state: 'now', text: nowS.label.replace('Plant in spring', 'Plant now') + ' now, through ' + fmtD(nowS.end) + '.' };
  const ind = cands.find(s => s.k === 'i' && now >= addD(s.date, -7) && now <= s.end); if (ind) return { state: 'now', text: 'Start seeds indoors now, through ' + fmtD(ind.end) + '.' };
  const nx = cands.filter(s => s.date > now).sort((a, b) => a.date - b.date)[0]; if (!nx) return null;
  const dd = dayDiff(nx.date, now);
  return { state: dd <= 60 ? 'soon' : 'later', text: (dd <= 60 ? 'Soon: ' : 'Next: ') + nx.label.toLowerCase() + ' from ' + fmtD(nx.date) + (dd > 60 ? ' (' + fmtDY(nx.date).split(', ')[1] + ')' : ' (in ' + dd + ' days)') + '.' };
}

/* ---------- water ---------- */
function waterStatus(g) {
  const out = { cells: {}, due: 0, gal: 0, groups: {} }, WW = wxSummary(), soilF = (SOILS[g.soil] || SOILS.loam).f, today = NOW();
  Object.keys(g.cells).forEach(k => {
    const c = g.cells[k]; if (isSp(c.p)) return; const p = PBY[c.p]; if (!p || p.fung) return; const grown = c.s === 'grow'; const W = p.lk === 'house' ? null : WW; if (grown && p.lk === 'wet' && LAND_INFO[p.id] && LAND_INFO[p.id].tags.some(t => 'afsm'.indexOf(t) >= 0)) { out.cells[k] = { lvl: 3, due: false, grown: true, text: 'Lives in the water. Keep the pond topped up; no hand-watering needed.', gal: 0, p: c.p }; return; }
    let eff = p.wat; if (soilF >= 1.3 && eff < 3) eff++; if (soilF <= .8 && eff > 1) eff--; // sand and rock dry faster, clay holds water
    if (W && W.maxNext >= 92 && eff < 3) eff++;
    if (!grown) { out.cells[k] = { lvl: eff, due: false, grown: false, text: 'Planned. Water needs start once it is planted.' }; return; }
    let base = p.wat === 3 ? 2 : p.wat === 2 ? 3 : 5; if (p.tree) base = 7;
    let interval = base / soilF; if (W && W.maxNext >= 90) interval *= .75; else if (W && W.maxNext < 62) interval *= 1.35; if (W && W.et0 != null) { if (W.et0 >= .2) interval *= .88; else if (W.et0 <= .07) interval *= 1.15; }
    const age = c.d ? dayDiff(today, pd(c.d)) : 99; if (age < 14) interval = Math.min(interval, p.tree ? 3 : 2);
    let last = S.watered[g.id + ':' + k] ? pd(S.watered[g.id + ':' + k]) : (c.d ? pd(c.d) : addD(today, -30));
    const rainy = W && W.rain2 >= .5; if (rainy) { const rd = addD(today, -1); if (rd > last) last = rd; }
    const since = dayDiff(today, last); interval = Math.max(1, Math.round(interval)); let due = since >= interval; let text;
    if (W && W.rainNext >= .7 && due && since < interval + 2) { due = false; text = 'Rain is coming (about ' + W.rainNext.toFixed(1) + ' in this week). Hold off.'; }
    else text = due ? 'Water today. Last watered ' + (since > 29 ? 'a long while ago' : since + ' day' + (since === 1 ? '' : 's') + ' ago') + '; this plant likes every ' + interval + ' day' + (interval === 1 ? '' : 's') + '.' : 'Fine for now. Next water in ' + (interval - since) + ' day' + (interval - since === 1 ? '' : 's') + '.';
    if (rainy && !due) text = 'Recent rain covers it. Next check in ' + Math.max(1, interval - since) + ' days.';
    const inch = p.wat === 3 ? 1 : p.wat === 2 ? .75 : .5, area = g.ft * g.ft, gal = due ? area * inch * .623 : 0;
    out.cells[k] = { lvl: eff, due, grown: true, since, interval, text, gal, p: c.p }; if (due) { out.due++; out.gal += gal; }
    const o = out.groups[c.p] = out.groups[c.p] || { id: c.p, tiles: 0, due: 0, interval, lvl: eff, gal: 0, keys: [] }; o.tiles++; o.keys.push(k); if (due) { o.due++; o.gal += gal; }
  });
  return out;
}
const WCOL = { 1: '#8a7a52', 2: '#3f86aa', 3: '#1f5cc4' };
function waterColor(w) { if (!w) return '#3b2c20'; if (!w.grown) return '#4a5a52'; return WCOL[clamp(w.lvl, 1, 3)]; }
function waterLegend() {
  const W = wxSummary();
  return '<div class="wleg"><div class="legend"><span><i style="background:' + WCOL[1] + '"></i>drought-tolerant</span><span><i style="background:' + WCOL[2] + '"></i>moderate</span><span><i style="background:' + WCOL[3] + '"></i>thirsty</span><span><i style="background:#4a5a52"></i>planned</span><span>💧 = water today</span></div><p class="sm dim center">' +
    (W ? 'Rain last 7 days ' + W.rainPast.toFixed(1) + ' in · next 7 days ' + W.rainNext.toFixed(1) + ' in · high ' + Math.round(W.maxNext) + '°F' : 'Open the app online once for rain and heat. Until then, schedule uses soil type and plant needs.') + '</p></div>';
}

/* ---------- nutrients ---------- */
const NUTRI = NUTRI_TXT.trim().split('\n').map(l => { const f = l.split('|'); return { t: f[0].split(','), f: f[1], x: f[2] }; });
function nutriFor(id) { return NUTRI.filter(n => n.t.some(t => tokMatch(t, id))); }
function phRange(p) { const m = /([\d.]+)\D+([\d.]+)/.exec(p.ph || ''); return m ? [+m[1], +m[2]] : null; }
function stageOf(g, id) {
  const ks = Object.keys(g.cells).filter(k => g.cells[k].p === id && g.cells[k].s === 'grow' && g.cells[k].d); if (!ks.length) return null;
  const ages = ks.map(k => dayDiff(NOW(), pd(g.cells[k].d))), age = Math.max.apply(null, ages), p = PBY[id];
  if (permLike(p)) return { age, s: 'established', n: 'Established' };
  if (age < 14) return { age, s: 'young', n: 'Getting started' }; if (age >= p.days) return { age, s: 'harvest', n: 'Harvesting' }; if (age > p.days * .5) return { age, s: 'fruit', n: 'Flowering and fruiting' }; return { age, s: 'grow', n: 'Growing' };
}
function feedPlan(g) {
  const cnt = gardenCounts(g); const ids = cnt.map(o => o.id); const weekly = [], monthly = [], season = [];
  ids.forEach(id => { const p = PBY[id]; nutriFor(id).forEach(n => { const arr = n.f === 'W' ? weekly : n.f === 'M' ? monthly : season; let e = arr.find(x => x.x === n.x); if (!e) { e = { x: n.x, plants: [], tiles: 0 }; arr.push(e); } e.plants.push(id); e.tiles += cnt.find(o => o.id === id).tiles; }); });
  const now = [];
  cnt.forEach(o => { const p = PBY[o.id], st = stageOf(g, o.id); if (!st) return; let t;
    if (st.s === 'young') t = 'Just water it in. No strong feed for two weeks; a splash of kelp or compost tea helps roots.';
    else if (st.s === 'harvest') t = (p.cat === 'v' && ['carrot', 'beet', 'onion', 'garlic', 'potato', 'parsnip', 'radish', 'turnip'].indexOf(p.id) >= 0) ? 'Stop feeding. Roots and bulbs are finishing.' : (p.feed === 'N' ? 'No feed needed.' : 'Keep picking and give a light feed (fish emulsion or compost) once a month to keep it producing.');
    else if (st.s === 'fruit') t = p.feed === 'N' || p.feed === 'L' ? 'No nitrogen. Water and mulch.' : 'Switch from nitrogen to potash: kelp, compost or wood ash lightly. More nitrogen now just makes leaves.';
    else if (st.s === 'established') t = p.tree ? 'Feed in late winter (compost ring under the drip line). Nothing now.' : 'Established. A compost top-dress each spring is enough.';
    else t = p.feed === 'H' ? 'Heavy feeder: fish emulsion or compost tea every 1 to 2 weeks, and side-dress with compost.' : p.feed === 'M' ? 'Fish emulsion or compost tea every 2 to 3 weeks.' : p.feed === 'N' ? 'No nitrogen needed (it makes its own).' : 'Light feeder. Compost already in the bed is enough.';
    now.push({ id: o.id, st, t }); });
  const sqft = (feed) => Object.keys(g.cells).filter(k => !isSp(g.cells[k].p) && feed.indexOf(PBY[g.cells[k].p].feed) >= 0 && PBY[g.cells[k].p].cat !== 'c').length * g.ft * g.ft;
  const sH = sqft('H'), sM = sqft('M'), sL = sqft('L'), sN = sqft('N'), tot = sH + sM + sL + sN;
  const shop = [];
  if (tot) {
    const comp = (sH * 2 + sM * 1 + (sL + sN) * .5) / 12; shop.push(['compost', Math.ceil(comp * 10) / 10, 'cu ft', 'Work 1 to 2 inches into the beds before planting']);
    const sBone = Object.keys(g.cells).filter(k => { const p = PBY[g.cells[k].p]; return p && (p.feed === 'H' || p.feed === 'M') && (p.cat === 'v' || p.cat === 'f') && ['bra', 'ast', 'che'].indexOf(p.fam) < 0; }).length * g.ft * g.ft;
    if (sBone) shop.push(['bonemeal', Math.max(.5, Math.round(sBone * 3 / 100 * 10) / 10), 'lb', 'For fruiting vegetables and roots at planting time']);
    const sLeaf = Object.keys(g.cells).filter(k => { const p = PBY[g.cells[k].p]; return p && p.feed === 'H' && (p.fam === 'bra' || p.fam === 'ast' || p.fam === 'che' || p.fam === 'gra'); }).length * g.ft * g.ft;
    if (sLeaf) shop.push(['blood', Math.max(.5, Math.round(sLeaf * 1.5 / 100 * 10) / 10), 'lb', 'Side-dress leafy and corn plantings']);
    shop.push(['kelp', Math.max(.5, Math.round(tot / 100 * 10) / 10), 'lb', 'Spread lightly over the whole garden, or use liquid kelp monthly']);
    const nTom = Object.keys(g.cells).filter(k => ['tomato', 'pepper', 'hotpep', 'eggplant'].indexOf(g.cells[k].p) >= 0).length;
    if (nTom) shop.push(['gypsum', Math.max(.5, Math.round(nTom * g.ft * g.ft * 3 / 100 * 10) / 10), 'lb', 'Calcium for tomatoes and peppers, guards against blossom end rot']);
    if (ids.indexOf('blueberry') >= 0) shop.push(['sulfur', 1, 'lb', 'To bring blueberry soil down to pH 4.5-5.5 (test first)']);
    if (cnt.some(o => { const p = PBY[o.id]; return p.feed === 'H' && p.fam === 'bra'; })) shop.push(['lime', 5, 'lb', 'Only if a soil test shows pH below 6.2 where brassicas grow']);
  }
  // pH harmony
  let maxLo = 0, minHi = 14, loP = null, hiP = null; ids.forEach(id => { const r = phRange(PBY[id]); if (!r || PBY[id].cat === 'c') return; if (r[0] > maxLo) { maxLo = r[0]; loP = id; } if (r[1] < minHi) { minHi = r[1]; hiP = id; } });
  const ph = (loP && hiP && maxLo - minHi > .25) ? 'Your garden mixes plants that want different soil pH: ' + pName(hiP) + ' wants up to ' + minHi + ', but ' + pName(loP) + ' wants at least ' + maxLo + '. Give them separate beds or amend each bed on its own.' : '';
  return { weekly, monthly, season, now, shop, ph, sq: { sH, sM, sL, sN, tot } };
}

/* ---------- schedule ---------- */
function cropBars(p) { // returns segments [kind, startDoy, endDoy] for a year diagram, wrapping across Dec 31
  const y = NOW().getFullYear(), D = plantDates(p, y), segs = [], doy = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(y, 0, 1)) / MS) + 1;
  const push = (k, a, b) => { let s = doy(a), e = doy(b); while (s < 1) { s += 365; e += 365; } while (s > 365) { s -= 365; e -= 365; } if (e > 365) { segs.push([k, s, 365]); segs.push([k, 1, Math.min(e - 365, 365)]); } else segs.push([k, s, e]); };
  D.steps.forEach(s => push('sow', s.date, s.end));
  if (D.harvest) { const first = D.steps.filter(s => s.k === 't' || s.k === 'd' || s.k === 'pe' || s.k === 'dm')[0]; if (first && !p.perm) push('grow', first.date, D.harvest.start); push('harv', D.harvest.start, D.harvest.end); if (D.harvest.fall) { const fs = D.steps.filter(s => s.k === 'f')[0]; if (fs) push('grow', fs.date, D.harvest.fall.start); push('harv', D.harvest.fall.start, D.harvest.fall.end); } }
  return segs;
}
function timelineSVG(rows) {
  const W = 340, lw = 98, cw = W - lw - 6, rh = 24, H = rows.length * rh + 30, y = NOW().getFullYear(), L = S.loc;
  const x = d => lw + (d - 1) / 365 * cw; let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart tl" role="img" aria-label="Season timeline">';
  MON.forEach((m, i) => { const dd = Math.round((new Date(y, i, 1) - new Date(y, 0, 1)) / MS) + 1; s += '<text x="' + (x(dd) + 1) + '" y="11" class="ax">' + m.charAt(0) + '</text><line x1="' + x(dd) + '" x2="' + x(dd) + '" y1="14" y2="' + (H - 4) + '" stroke="#2f4d3a" stroke-width=".6"/>'; });
  rows.forEach((r, i) => { const yy = 18 + i * rh; s += '<rect x="0" y="' + (yy + 3) + '" width="2.5" height="16" rx="1" fill="' + (LAYCOL[r.lay] || '#4f8a52') + '"/><text x="6" y="' + (yy + 13) + '" class="tlt">' + r.e + ' ' + esc(r.n.length > 11 ? r.n.slice(0, 10) + '…' : r.n) + '</text>'; r.segs.forEach(b => { const col = b[0] === 'sow' ? '#5fa0c9' : b[0] === 'grow' ? '#4f8a52' : '#d9b45a', hh = b[0] === 'sow' ? 7 : 11; s += '<rect x="' + x(b[1]) + '" y="' + (yy + (b[0] === 'sow' ? 8 : 4)) + '" width="' + Math.max(2, x(b[2]) - x(b[1])) + '" height="' + hh + '" rx="3" fill="' + col + '" opacity="' + (b[0] === 'grow' ? .55 : .95) + '"/>'; }); });
  [[L.last, '#7be08a'], [L.first, '#ff8a7a']].forEach(a => { if (a[0] > 0 && a[0] < 365) s += '<line x1="' + x(a[0]) + '" x2="' + x(a[0]) + '" y1="14" y2="' + (H - 4) + '" stroke="' + a[1] + '" stroke-width="1.4" stroke-dasharray="3 3"/>'; });
  const td = Math.round((new Date(y, NOW().getMonth(), NOW().getDate()) - new Date(y, 0, 1)) / MS) + 1; s += '<line x1="' + x(td) + '" x2="' + x(td) + '" y1="14" y2="' + (H - 4) + '" stroke="#fff" stroke-width="1.6"/></svg>';
  return s + '<div class="legend"><span><i style="background:#5fa0c9"></i>sow, plant or inoculate</span><span><i style="background:#4f8a52"></i>growing</span><span><i style="background:#d9b45a"></i>harvest</span><span><i style="border:1.5px dashed #7be08a;background:none"></i>last frost</span><span><i style="border:1.5px dashed #ff8a7a;background:none"></i>first frost</span></div>';
}
function weekTasks(g) {
  const now = NOW(), t = [], cnt = gardenCounts(g);
  cnt.forEach(o => {
    const p = PBY[o.id], D = plantDates(p), planned = Object.keys(g.cells).filter(k => g.cells[k].p === o.id && g.cells[k].s !== 'grow').length;
    if (planned) D.steps.forEach(s => { const a = addD(s.date, -3), b = s.end; if (now >= a && now <= b) t.push({ k: 'sow:' + o.id + ':' + s.k, e: p.e, h: s.label + ': ' + p.n, d: 'Window ' + fmtD(s.date) + ' to ' + fmtD(s.end) + '. ' + planned + ' tile' + (planned > 1 ? 's' : '') + ' planned.' + (s.k !== 'i' || true ? bestHint(p, s.k === 't' ? 'trans' : 'sow') : ''), act: s.k !== 'i' ? { a: 'plantedAll', v: o.id, l: 'Mark planted' } : null, pr: 1 }); else { const dd = dayDiff(s.date, now); if (dd > 3 && dd <= 21) t.push({ k: 'soon:' + o.id + ':' + s.k, e: p.e, h: 'Coming up: ' + s.label.toLowerCase() + ' ' + p.n, d: 'Starts ' + fmtD(s.date) + ' (in ' + dd + ' days).', pr: 3 }); } });
    Object.keys(g.cells).filter(k => g.cells[k].p === o.id && g.cells[k].s === 'grow' && g.cells[k].d).slice(0, 1).forEach(k => {
      const c = g.cells[k]; if (p.perm && p.days > 400) return; const hs = addD(pd(c.d), p.days), dd = dayDiff(hs, now);
      if (dd <= 0 && dd > -p.hw * 7) t.push({ k: 'harv:' + o.id, e: p.e, h: (bloomy(p) ? 'Enjoy ' : 'Harvest ') + p.n, d: (bloomy(p) ? 'In bloom or at its best now (since ' : 'In the harvest window now (ready since ') + fmtD(hs) + ').' + bestHint(p, 'harv'), pr: 0 }); else if (dd > 0 && dd <= 14) t.push({ k: 'harvsoon:' + o.id, e: p.e, h: p.n + (bloomy(p) ? ' blooms in ' : ' ready in ') + dd + ' days', d: 'About ' + fmtD(hs) + '.', pr: 2 });
    });
  });
  const ws = waterStatus(g); if (ws.due) t.push({ k: 'water', e: '💧', h: 'Water ' + ws.due + ' ' + (gk(g) === 'herb' ? 'herb ' : '') + 'tile' + (ws.due > 1 ? 's' : '') + ' today', d: 'About ' + Math.max(1, Math.round(ws.gal)) + ' gallons in all. See the Water tab for where.', pr: 0 });
  const W = wxSummary(); if (W && W.minNext <= 34 && gk(g) !== 'house') t.push({ k: 'frost' + dkey(), e: '🥶', h: 'Frost watch: low of ' + Math.round(W.minNext) + '°F in the forecast', d: gk(g) === 'herb' ? 'Cover or bring in tender herbs (basil, lemongrass, stevia, rosemary in cold zones) at dusk, and water the soil first.' : 'Cover tender plants (tomato, pepper, squash, basil) at dusk with sheets or row cover, and water the soil first.', pr: 0 });
  return t.sort((a, b) => a.pr - b.pr);
}
const gOf = el => S.gardens.find(x => x.id === el.dataset.g) || G();
ACT.plantedAll = el => { const g = gOf(el); Object.keys(g.cells).forEach(k => { if (g.cells[k].p === el.dataset.v && g.cells[k].s !== 'grow') { g.cells[k].s = 'grow'; g.cells[k].d = dkey(); } }); logIt('Planted ' + pName(el.dataset.v)); save(); toast(pName(el.dataset.v) + ' marked planted today.'); render(); };
ACT.taskDone = el => { const k = el.dataset.k + ':' + dkey(); S.done[k] = !S.done[k]; save(); render(); };
ACT.waterAll = el => { const only = el.dataset.v, gs = el.dataset.g ? [gOf(el)] : plantGardens().filter(x => layOn(gk(x))); gs.forEach(g => { const ws = waterStatus(g); Object.keys(ws.cells).forEach(k => { const w = ws.cells[k]; if (w.due && (!only || w.p === only)) S.watered[g.id + ':' + k] = dkey(); }); }); save(); toast('Marked watered. Nice.'); render(); };

/* ---------- Plan tab: three layers (garden, herbs, fungi) ---------- */
const LAYS = [['all', 'All layers'], ['veg', '🥕 Garden'], ['herb', '🌿 Herbs'], ['flower', '🌸 Flowers'], ['shrub', '🌳 Shrubs'], ['succ', '🌵 Succulents'], ['fungi', '🍄 Fungi']];
const LAYCOL = { veg: '#4f8a52', herb: '#2a9a8a', flower: '#c4678f', shrub: '#5a7d3a', succ: '#3f8a73', fungi: '#b0834f' };
const LAYN = { veg: 'Garden', herb: 'Herbs', flower: 'Flowers', shrub: 'Shrubs', succ: 'Succulents', fungi: 'Fungi' };
UI.lay = 'all';
function layOn(k) { return UI.lay === 'all' || UI.lay === k; }
function layersPresent() { return ['veg', 'herb', 'flower'].concat(LAND_ORDER, ['fungi']).filter(k => gardensOf(k).some(g => Object.keys(g.cells).length)); }
function allTasks() {
  const out = []; let frost = false;
  S.gardens.forEach(g => {
    const k = gk(g); if (!layOn(k) || !Object.keys(g.cells).length) return;
    (k === 'fungi' ? fungiTasks(g) : weekTasks(g)).forEach(x => {
      if (/^frost/.test(x.k)) { if (frost) return; frost = true; }
      x.lay = k; x.k = g.id + ':' + x.k; if (x.act) x.act = Object.assign({}, x.act, { g: g.id }); if (S.gardens.length > 1 && !/frost/.test(x.k)) x.d += ' (' + g.name + ')'; out.push(x);
    });
  });
  if (layOn('fungi')) sporeTasks().forEach(x => out.push(x));
  return out.sort((a, b) => a.pr - b.pr);
}
function layerPlantIds() {
  const o = { veg: [], herb: [], flower: [] }; LAND_ORDER.forEach(k => { o[k] = []; }); plantGardens().forEach(g => { const k = gk(g); if (!layOn(k)) return; gardenCounts(g).forEach(c => { if (o[k].indexOf(c.id) < 0) o[k].push(c.id); }); }); return o;
}
function fungiSpecies() { const out = []; gardensOf('fungi').forEach(g => { const by = {}; Object.keys(g.cells).forEach(k => { const c = g.cells[k]; if (FBY[c.p]) (by[c.p] = by[c.p] || []).push(c); }); Object.keys(by).forEach(id => out.push({ sp: FBY[id], cells: by[id] })); }); return out; }
function timelineRows() {
  const sn = layerPlantIds(), rows = [];
  ['veg', 'herb', 'flower'].concat(LAND_ORDER).forEach(k => sn[k].forEach(id => { const p = PBY[id]; rows.push({ e: p.e, n: p.n, segs: cropBars(p), lay: k }); }));
  if (layOn('fungi')) fungiSpecies().forEach(f => rows.push({ e: f.sp.e, n: f.sp.n, segs: fungiBars(f.sp, f.cells), lay: 'fungi' }));
  return rows;
}
function taskRow(t, many) {
  const dn = S.done[t.k + ':' + dkey()];
  return '<div class="task' + (dn ? ' dn' : '') + '"><button class="ck" data-act="taskDone" data-k="' + esc(t.k) + '" aria-label="Done">' + (dn ? '✓' : '') + '</button><div class="tt"><b>' + t.e + ' ' + esc(t.h) + '</b>' + (many ? ' <span class="lay" style="background:' + LAYCOL[t.lay] + '">' + LAYN[t.lay] + '</span>' : '') + '<br><span class="sm dim">' + esc(t.d) + '</span>' + (t.act ? '<br><button class="mini" data-act="' + t.act.a + '" data-v="' + t.act.v + '" data-g="' + (t.act.g || '') + '">' + t.act.l + '</button>' : '') + '</div></div>';
}
function feedHTML(g, named) {
  const f = feedPlan(g), pre = named ? '<div class="lay big" style="background:' + LAYCOL[gk(g)] + '">' + KINDS[gk(g)][0] + ' ' + esc(g.name) + '</div>' : '';
  let h = pre + '<section class="card"><div class="ct"><span>What your plants need now</span></div>' + (f.now.length ? f.now.map(n => '<div class="nrow"><b>' + PBY[n.id].e + ' ' + esc(PBY[n.id].n) + '</b> <span class="tag">' + n.st.n + ' · day ' + n.st.age + '</span><br><span class="sm">' + esc(n.t) + '</span></div>').join('') : '<p class="dim">Mark plants as planted on the map and Hortica will follow their growth stage.</p>') + '</section>';
  const sect = (title, arr, empty) => '<section class="card"><div class="ct"><span>' + title + '</span></div>' + (arr.length ? arr.map(e => '<div class="nrow"><span class="sm">' + esc(e.x) + '</span><br><span class="dim sm">' + e.plants.map(id => PBY[id].e + ' ' + PBY[id].n).filter((v, i, a) => a.indexOf(v) === i).join(', ') + '</span></div>').join('') : '<p class="dim sm">' + empty + '</p>') + '</section>';
  h += sect('Every week', f.weekly, 'Nothing special beyond even watering.') + sect('Every month', f.monthly, 'No monthly feeds for these plants.') + sect('Once a season (at planting and renewals)', f.season, 'Nothing yet.');
  if (f.ph) h += '<section class="card tip"><b>⚠ Soil pH mix</b><p class="sm">' + esc(f.ph) + '</p></section>';
  h += '<section class="card"><div class="ct"><span>Shopping list' + (named ? ': ' + esc(g.name) : ' for your garden') + '</span></div><p class="sm dim">Sized to your ' + Math.round(f.sq.tot) + ' sq ft of plantings.</p>' + f.shop.map(s => '<div class="nrow"><b>' + AMEND[s[0]][0] + ': ' + s[1] + ' ' + s[2] + '</b><br><span class="sm dim">' + esc(s[3]) + '. ' + esc(AMEND[s[0]][1]) + '.</span></div>').join('') + '</section>';
  return h;
}
function fungiWaterCard() {
  const gs = gardensOf('fungi').filter(g => Object.keys(g.cells).length); if (!gs.length) return '';
  let h = '<section class="card"><div class="ct"><span>🍄 Mushroom moisture</span></div><p class="sm dim">Separate from plant watering: mushrooms need humid air and damp substrate, not wet soil.</p>';
  gs.forEach(g => { const rm = roomOf(g); fungiCounts(g).forEach(o => {
    const sp = FBY[o.id], dom = Object.keys(o.st).sort((a, b) => o.st[b] - o.st[a])[0], hm = /(\d+)\D+(\d+)/.exec(sp.hum); let t;
    if (dom === 'fruiting') t = sp.hum === 'n/a' ? 'Outdoors: water the logs or bed in dry spells.' : 'Mist 2 or 3 times a day. Target ' + sp.hum + '% humidity; your space reads ' + rm.h + '%.' + (hm && rm.h < +hm[1] ? ' Your air is too dry: add a humidifier or a damp perlite tray.' : '');
    else if (dom === 'colonizing') t = 'No misting. Keep it sealed (or the log shaded and rained on) while it colonizes.';
    else if (dom === 'ready') t = 'Move to fruiting conditions, then start misting when pins appear.';
    else if (dom === 'resting') t = sp.log ? 'Soak the log in cold water for 24 hours before the next flush.' : 'Rehydrate lightly and hold ' + (sp.hum === 'n/a' ? 'damp' : sp.hum + '% humidity') + ' for the next flush.';
    else t = 'Not started yet. Moisture needs begin at inoculation.';
    h += '<div class="wrow"><span class="pe">' + sp.e + '</span><div><b>' + esc(sp.n) + '</b> <span class="tag">' + o.n + ' tile' + (o.n > 1 ? 's' : '') + ' · ' + (STAGEN[dom] || dom).split(':')[0].toLowerCase() + '</span><br><span class="sm dim">' + esc(t) + '</span></div></div>'; }); });
  return h + '</section>';
}
function planTab() {
  const sub = UI.sub.plan || 'sched', m = moonInfo(), F = frostDates(), L = S.loc, pres = layersPresent();
  let h = '<section class="card"><div class="ct"><span>📅 Your season</span><a class="lnk" data-act="locSheet">Edit location</a></div><div class="sum"><div><b>' + (F.free ? 'Frost-free' : fmtD(F.last)) + '</b><span>last frost</span></div><div><b>' + (F.free ? 'Frost-free' : fmtD(F.first)) + '</b><span>first frost</span></div><div><b>' + (L.zone || '?') + '</b><span>zone</span></div></div><p class="sm dim center">' + esc(L.name || 'Your area') + (L.src === 'history' ? ' · from 5 years of local weather' : L.src === 'manual' ? ' · set by you' : ' · estimated, so check the dates for your area') + '</p>' +
    (S.settings.moon ? '<p class="sm center">' + m.icon + ' ' + m.name + '. <span class="dim">' + m.note + '</span></p>' : '') + '</section>';
  if (sub === 'log' || !pres.length && (UI.sub.plan === 'log')) return h + '<div class="seg small">' + [['sched', '📅 Schedule'], ['water', '💧 Water'], ['feed', '🌿 Feed'], ['log', '📓 Journal']].map(a => '<button class="' + (sub === a[0] ? 'on' : '') + '" data-act="psub" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>' + journalHTML();
  if (!pres.length) return h + '<section class="card"><p>Lay out some plants, herbs or mushrooms on a map and Hortica will build your planting, watering and feeding calendar from it. Each map becomes its own layer.</p><div class="row wrap"><button class="btn gold" data-act="goTab" data-v="garden">🥕 Garden map</button><button class="btn" data-act="goHerb">🌿 Herb garden</button><button class="btn" data-act="goTab" data-v="fungi">🍄 Fungi</button></div></section>';
  if (pres.indexOf(UI.lay) < 0 && UI.lay !== 'all') UI.lay = 'all';
  if (pres.length > 1) h += '<div class="seg small lays">' + LAYS.filter(a => a[0] === 'all' || pres.indexOf(a[0]) >= 0).map(a => '<button class="' + (UI.lay === a[0] ? 'on' : '') + '" data-act="lay" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  h += '<div class="seg small">' + [['sched', '📅 Schedule'], ['water', '💧 Water'], ['feed', '🌿 Feed'], ['log', '📓 Journal']].map(a => '<button class="' + (sub === a[0] ? 'on' : '') + '" data-act="psub" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  const many = UI.lay === 'all' && pres.length > 1;
  if (sub === 'sched') {
    const tk = allTasks();
    h += '<section class="card"><div class="ct"><span>This week</span>' + (many ? '<span class="tag">' + pres.map(k => LAYN[k] + ' ' + tk.filter(t => t.lay === k).length).join(' · ') + '</span>' : '') + '</div>' + (tk.length ? tk.map(t => taskRow(t, many)).join('') : '<p class="dim">Nothing is due this week. Check the timeline below for what is next.</p>') + '</section>';
    const rows = timelineRows();
    h += '<section class="card"><div class="ct"><span>Season timeline</span></div>' + (many ? '<div class="legend"><span><i style="background:' + LAYCOL.veg + '"></i>garden</span><span><i style="background:' + LAYCOL.herb + '"></i>herbs</span><span><i style="background:' + LAYCOL.flower + '"></i>flowers</span><span><i style="background:' + LAYCOL.fungi + '"></i>fungi</span></div>' : '') + timelineSVG(rows) + '</section>';
    const sn = layerPlantIds(), ids = sn.veg.concat(sn.herb.filter(x => sn.veg.indexOf(x) < 0), sn.flower.filter(x => sn.veg.indexOf(x) < 0 && sn.herb.indexOf(x) < 0));
    h += '<section class="card"><div class="ct"><span>Dates for each crop</span></div>' + ids.map(id => { const p = PBY[id], D = plantDates(p), hi = HERB_INFO[id]; return '<details><summary>' + p.e + ' ' + esc(p.n) + '</summary><div class="sm">' + D.steps.map(s => '<div>' + esc(s.label) + ': <b>' + fmtD(s.date) + '</b> to ' + fmtD(s.end) + '</div>').join('') + (D.harvest ? '<div>' + hlab(p) + ': <b>' + fmtD(D.harvest.start) + '</b> to ' + fmtD(D.harvest.end) + '</div>' : '') + (D.harvest && D.harvest.fall ? '<div>Fall ' + hlab(p).toLowerCase() + ': <b>' + fmtD(D.harvest.fall.start) + '</b> to ' + fmtD(D.harvest.fall.end) + '</div>' : '') + (p.perm && p.days > 400 ? '<div class="dim">Perennial: first real harvest in about ' + Math.round(p.days / 365) + ' years.</div>' : '') + (hi ? '<div class="dim">Use: ' + esc(hi.parts) + '</div>' : '') + '<div class="dim">Moon: ' + (p.moon === 'u' ? 'waxing' : 'waning') + ' (old-timer rule) · ruled by ' + rulerOf(p) + '</div></div></details>'; }).join('') +
      (layOn('fungi') ? fungiSpecies().map(f => { const c = f.cells.filter(x => x.d)[0], ev = c ? fungiEvents(f.sp, c) : []; return '<details><summary>' + f.sp.e + ' ' + esc(f.sp.n) + ' <span class="dim sm">(mushroom)</span></summary><div class="sm">' + (ev.length ? ev.slice(0, 7).map(e => '<div>' + esc(e.label) + ': <b>' + fmtD(e.date) + '</b>' + (e.end ? ' to ' + fmtD(e.end) : '') + '</div>').join('') : '<div>Colonizes in about ' + f.sp.colD + ' days; first harvest about ' + f.sp.fruD + ' days after inoculation.</div>') + '</div></details>'; }).join('') : '') + '</section>';
  } else if (sub === 'water') {
    const gs = plantGardens().filter(g => layOn(gk(g)) && Object.keys(g.cells).some(k => !isSp(g.cells[k].p)));
    let tdue = 0, tgal = 0; const wss = gs.map(g => { const ws = waterStatus(g); tdue += ws.due; tgal += ws.gal; return [g, ws]; });
    if (gs.length) {
      h += '<section class="card"><div class="ct"><span>Today</span><span class="tag">' + tdue + ' tiles · about ' + Math.max(0, Math.round(tgal)) + ' gal</span></div>' + (tdue ? '<button class="btn gold block" data-act="waterAll">💧 Mark all due tiles watered</button>' : '<p class="ok">Nothing needs water today.</p>') + waterLegend() + '</section>';
      wss.forEach(([g, ws]) => { const grp = Object.values(ws.groups).sort((a, b) => b.due - a.due || b.lvl - a.lvl);
        h += '<section class="card"><div class="ct"><span>' + KINDS[gk(g)][0] + ' ' + esc(g.name) + '</span><span class="tag">' + ws.due + ' due</span></div><div class="mapwrap2"><canvas class="gcw" data-wg="' + g.id + '"></canvas></div>' +
          grp.map(o => { const p = PBY[o.id]; return '<div class="wrow"><span class="pe">' + p.e + '</span><div><b>' + esc(p.n) + '</b> <span class="tag">' + (o.lvl === 3 ? 'thirsty' : o.lvl === 2 ? 'moderate' : 'drought-tolerant') + '</span><br><span class="sm dim">' + o.tiles + ' tile' + (o.tiles > 1 ? 's' : '') + ' · every ~' + o.interval + ' days · ' + (o.due ? '<b class="gold">' + o.due + ' due, ~' + Math.max(1, Math.round(o.gal)) + ' gal</b>' : 'all fine') + '</span></div>' + (o.due ? '<button class="mini" data-act="waterAll" data-v="' + o.id + '" data-g="' + g.id + '">Done</button>' : '') + '</div>'; }).join('') + '</section>'; });
      const g0 = gs[0];
      h += '<section class="card tip"><b>Watering the old-timer way</b><p class="sm">Water deep and early, at the base, not the leaves. Push a finger two inches into the soil: if it is dry, water. Mulch cuts your watering by a third. ' + (gs.some(x => gk(x) === 'herb') ? 'Herb tip: rosemary, thyme, lavender, sage and oregano like to dry out between drinks, while basil, mint, parsley and lemon balm want steady moisture. Keep the two crowds in separate patches. ' : '') + (SOILS[g0.soil] ? 'Your ' + SOILS[g0.soil].n.toLowerCase() + ' soil: ' + SOILS[g0.soil].d : '') + '</p></section>';
    }
    if (layOn('fungi')) h += fungiWaterCard();
    if (!gs.length && !fungiWaterCard()) h += '<section class="card"><p class="dim">No plants on this layer yet.</p></section>';
  } else {
    const gs = plantGardens().filter(g => layOn(gk(g)) && Object.keys(g.cells).some(k => !isSp(g.cells[k].p)));
    h += gs.map(g => feedHTML(g, gs.length > 1)).join('');
    if (layOn('fungi') && layersPresent().indexOf('fungi') >= 0) h += '<section class="card tip"><b>🍄 Mushrooms feed on their substrate</b><p class="sm">They need no fertilizer. Spent straw, sawdust blocks and wood chips make superb compost and mulch: bury them in the garden or herb beds. Many spent oyster blocks will even fruit again outdoors.</p></section>';
    if (!gs.length && !(layOn('fungi') && layersPresent().indexOf('fungi') >= 0)) h += '<section class="card"><p class="dim">No plants on this layer yet.</p></section>';
  }
  return h;
}
function mountPlan() { if ((UI.sub.plan || 'sched') !== 'water') return; $$('canvas.gcw').forEach(cv => { const g = S.gardens.find(x => x.id === cv.dataset.wg); if (!g) return; cv._cs = cellSize(g, cv.parentNode.clientWidth || 340); drawMap(cv, g, 'water'); cv.style.touchAction = 'pan-x pan-y pinch-zoom'; }); }
ACT.psub = el => { UI.sub.plan = el.dataset.v; render(); if ((UI.sub.plan === 'water')) refreshWx().then(() => { if (UI.tab === 'plan' && !sheetOpen()) render(); }); };
ACT.lay = el => { UI.lay = el.dataset.v; render(); };
ACT.goHerb = () => { UI.gk = 'herb'; setTab('garden'); };

/* ---------- plant page ---------- */
function tokNames(t) { if (t.charAt(0) === '@') { const f = PLANTS.filter(p => p.fam === t.slice(1)).map(p => p.n); return f.length > 4 ? f.slice(0, 3).join(', ') + ' and kin' : f.join(', '); } if (t.charAt(0) === '%') return GROUPS[t.slice(1)].map(pName).join(', '); return pName(t); }
function companionsOf(id) { const out = { good: [], bad: [] }; RULES.forEach(r => { let other = null; if (tokMatch(r.a, id)) other = r.b; else if (tokMatch(r.b, id)) other = r.a; if (other && other !== id) out[r.k].push({ t: other, why: r.why }); }); return out; }
ACT.plantInfo = el => {
  if (PBY[el.dataset.v] && PBY[el.dataset.v].fung) { ACT.fungiInfo(el); return; }
  const p = PBY[el.dataset.v], D = plantDates(p), cm = companionsOf(p.id), W = plantWindow(p), pests = typeof pestsFor === 'function' ? pestsFor(p.id) : [];
  let h = '<div class="tilehd"><span class="be">' + p.e + '</span><div><h2 class="big">' + esc(p.n) + '</h2><span class="dim sm">' + CATS[p.cat] + ' · ' + esc(p.vars.split(',')[0]) + '</span></div></div>' +
    '<div class="chips c"><span class="chip">☀️ ' + SUNN[p.sun] + '</span><span class="chip">💧 ' + WATN[p.wat] + '</span><span class="chip">🌿 ' + FEEDN[p.feed] + '</span><span class="chip">↔ ' + p.sp + ' in apart</span><span class="chip">pH ' + esc(p.ph) + '</span><span class="chip">↕ ' + (p.h >= 24 ? Math.round(p.h / 12) + ' ft tall' : p.h + ' in tall') + '</span>' + (p.zones !== '-' ? '<span class="chip">Zones ' + esc(p.zones) + '</span>' : '') + '</div>' +
    (zoneOk(p) ? '' : '<div class="flag ask"><b>Not hardy in zone ' + esc(S.loc.zone) + '.</b> It needs zones ' + esc(p.zones) + '. Try a pot you can bring inside.</div>') +
    (W ? '<div class="flag"><b>Timing for you</b><br>' + esc(W.text) + '</div>' : '') + (p.perm || p.sow.length ? timingBlock(p, p.sow.some(s => s.k === 't') ? 'trans' : 'sow', 2) : '') +
    '<h3 class="h3">How to grow it</h3><p>' + esc(p.how) + '</p><div class="flag"><b>Old-timer tip</b><br>' + esc(p.tip) + '</div>' +
    herbBlock(p) + flowerBlock(p) + landBlock(p) + fitCheck(p) +
    '<h3 class="h3">Varieties worth trying</h3><p class="sm">' + esc(p.vars) + '</p>' +
    '<h3 class="h3">Your dates</h3><div class="sm">' + D.steps.map(s => '<div>' + esc(s.label) + ': <b>' + fmtD(s.date) + '</b> to ' + fmtD(s.end) + '</div>').join('') + (D.harvest ? '<div>' + hlab(p) + ': <b>' + fmtD(D.harvest.start) + '</b> to ' + fmtD(D.harvest.end) + (p.perm ? ' (once established)' : ' (about ' + p.days + ' days)') + '</div>' : '') + (D.harvest && D.harvest.fall ? '<div>Fall ' + hlab(p).toLowerCase() + ': <b>' + fmtD(D.harvest.fall.start) + '</b> to ' + fmtD(D.harvest.fall.end) + '</div>' : '') + '</div>' +
    '<h3 class="h3">Soil and feeding</h3>' + nutriFor(p.id).map(n => '<p class="sm"><span class="tag">' + ({ W: 'weekly', M: 'monthly', S: 'seasonal' }[n.f]) + '</span> ' + esc(n.x) + '</p>').join('') +
    '<h3 class="h3">Friends</h3>' + (cm.good.length ? cm.good.map(c => '<div class="flag"><b>' + esc(tokNames(c.t)) + '</b><br><span class="sm">' + esc(c.why) + '</span></div>').join('') : '<p class="dim sm">No special companions on record.</p>') +
    (cm.bad.length ? '<h3 class="h3">Keep apart from</h3>' + cm.bad.map(c => '<div class="flag ask"><b>' + esc(tokNames(c.t)) + '</b><br><span class="sm">' + esc(c.why) + '</span></div>').join('') : '') +
    (pests.length ? '<h3 class="h3">Watch for</h3><div class="chips c">' + pests.slice(0, 10).map(x => '<button class="chip" data-act="pestOpen" data-v="' + x.id + '">' + x.e + ' ' + esc(x.n) + '</button>').join('') + '</div>' : '') +
    (p.perm || p.sow.length ? '<div class="flag"><b>' + PSYM[rulerOf(p)] + ' Ruled by ' + rulerOf(p) + '</b><br><span class="sm">Tradition: gather it in the hour of ' + rulerOf(p) + ' and plant with the intention of ' + PINT[rulerOf(p)] + '. <a class="lnk" data-act="bestOpen" data-v="' + p.id + '">Find the best times</a></span></div>' : '') +
    '<button class="btn gold block" data-act="useBrush" data-v="' + p.id + '">🖌 Paint ' + esc(p.n) + ' on my map</button>';
  openSheet(p.n, h);
};
function herbBlock(p) { const hi = HERB_INFO[p.id]; if (!hi) return ''; return '<h3 class="h3">Herb uses</h3><div class="chips c">' + hi.tags.map(t => '<span class="chip">' + (HERB_TAGS[t] || t) + '</span>').join('') + '</div><p class="sm"><b>Parts used:</b> ' + esc(hi.parts) + '</p><p class="sm">' + esc(hi.uses) + '</p><div class="flag ask"><b>Cautions</b><br><span class="sm">' + esc(hi.caution) + '</span></div><p class="foot">' + esc(HERB_DISCLAIMER) + '</p>'; }
ACT.useBrush = el => { if (PBY[el.dataset.v] && PBY[el.dataset.v].fung) { ACT.fBrush(el); return; } if (PBY[el.dataset.v] && PBY[el.dataset.v].lk) { const kk = PBY[el.dataset.v].lk; UI.gk = kk; if (!G()) { closeSheetQuiet(); setTab('garden'); toast('Start a ' + LAND_KINDS[kk].w + ' map first, then paint ' + pName(el.dataset.v) + '.', 3500); return; } } else if (PBY[el.dataset.v] && PBY[el.dataset.v].hx) UI.gk = 'herb'; else if (PBY[el.dataset.v] && PBY[el.dataset.v].fx) { UI.gk = 'flower'; if (!G()) { closeSheetQuiet(); setTab('garden'); toast('Start a flower garden first, then paint ' + pName(el.dataset.v) + '.', 3500); return; } } UI.brush = el.dataset.v; pushRecent(el.dataset.v); UI.tool = 'paint'; UI.tab = 'garden'; closeSheetQuiet(); setTab('garden'); toast(pName(el.dataset.v) + ' is your brush. Drag over the tiles.'); };
