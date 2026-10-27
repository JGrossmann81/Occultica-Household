/* Hortica full audit: checks everything you plan to plant (garden, herbs, flowers, mushrooms) before you plant it.
   Sev: 3 = fix first, 2 = worth fixing, 1 = good to know. Every finding names the plants involved and what to do. */
const AUD_LAY = [['veg', '🥕 Garden'], ['herb', '🌿 Herbs'], ['flower', '🌸 Flowers'], ['shrub', '🌳 Shrubs'], ['succ', '🌵 Succulents'], ['fungi', '🍄 Fungi'], ['all', 'Everything']];
const SEVN = { 3: 'Fix first', 2: 'Worth fixing', 1: 'Good to know' };
const WEEKIN = { 1: .5, 2: 1, 3: 1.75 }; // inches of water per week
const AUD_RUN = ['mint', 'peppermint', 'spearmint', 'catnip', 'lemonbalm', 'horseradish', 'nettle', 'selfheal', 'comfrey', 'licorice', 'beebalm', 'sweetwoodruff', 'tansy', 'morningglory', 'goldenrod', 'honeysuckle', 'violet', 'milkweed'];
const AUD_BAIT = ['tulip', 'lily', 'dahlia', 'gladiolus', 'daylily', 'canna', 'crocus', 'hyacinth'];

function auditUnits(layer) { // the maps to audit: every base map (with its overlays) and every free-standing flower bed
  const out = [];
  S.gardens.forEach(g => { const k = gk(g); if (k === 'fungi') return; if (k === 'flower' && g.over && baseOf(g)) return; if (!Object.keys(g.cells).some(c => !isSp(g.cells[c].p)) && !overlaysOf(g).some(o => Object.keys(o.cells).length)) return; out.push(g); });
  if (layer === 'all') return out;
  return out.filter(g => gk(g) === layer || (layer === 'flower' && overlaysOf(g).length) || (layer !== 'flower' && gk(g) === layer));
}
function cellOf(it) { const g = S.gardens.find(x => x.id === it.g); return g ? g.cells[it.k] : null; }
function auditPlants(g) { // tiles by plant id across the whole unit, with state and kind of the map each lives on
  const m = {}; layerItems(g).forEach(it => { const c = cellOf(it), gg = S.gardens.find(x => x.id === it.g), o = m[it.p] = m[it.p] || { id: it.p, tiles: 0, planned: 0, lay: gk(gg), items: [] }; o.tiles++; if (!c || c.s !== 'grow') o.planned++; o.items.push(it); }); return m;
}
function kindName(id) { const p = PBY[id]; return !p ? '' : p.fx || p.cat === 'fl' ? 'flower' : p.lk ? LAND_KINDS[p.lk].w : p.hx ? 'herb' : 'garden'; }

function auditUnit(g, opt) {
  opt = opt || {}; const F = [], per = {}, A = auditPlants(g), ids = Object.keys(A), rep = companionReport(g), rf = rangeFt(g), today = NOW(), FD = frostDates();
  const subject = id => !opt.planned || A[id].planned > 0;
  const add = (sev, cat, title, text, pids, fix) => { const sj = (pids || []).filter(id => A[id]); if (opt.planned && sj.length && !sj.some(subject)) return; F.push({ sev, cat, title, text, ids: sj, fix: fix || '', unit: g.id }); sj.forEach(id => { const o = per[id] = per[id] || { id, sev: 0, notes: [] }; o.sev = Math.max(o.sev, sev); o.notes.push({ sev, text: title }); }); };
  ids.forEach(id => { per[id] = per[id] || { id, sev: 0, notes: [] }; });

  /* 1. hardiness and timing */
  ids.forEach(id => {
    const p = PBY[id]; if (!p || !subject(id)) return;
    if (!zoneOk(p)) add(p.perm || p.tree ? 3 : 2, 'Climate', p.n + ' is not hardy in zone ' + S.loc.zone, 'It needs zones ' + p.zones + '. ' + (zoneNum() > +(/(\d+)\D+(\d+)/.exec(p.zones) || [0, 0, 99])[2] ? (p.lk ? 'Your winters are too mild for it: it needs a cold spell to rest, flower and fruit, and tends to struggle in constant warmth. Choose a low-chill relative from the same group.' : 'Your winters are too mild: it needs winter chill to bloom or set bulbs. Try pre-chilled bulbs treated as annuals.') : (p.perm || p.tree ? 'It will not survive your winters outdoors.' : 'Treat it as a summer annual or grow it in a pot you can bring inside.')), [id], 'Use a pot, or pick a hardier relative.');
    const W = plantWindow(p);
    if (A[id].planned > 0) {
      if (W && W.state === 'later') add(2, 'Timing', p.n + ' is out of season', W.text + ' Planting it now means a poor or failed crop.', [id], 'Wait for the window, or plan it for next season.');
      else if (W && W.state === 'soon') add(1, 'Timing', p.n + ': window opens soon', W.text, [id]);
      if (!permLike(p) && p.days < 400 && !isCold(p)) { const left = dayDiff(FD.first, today); if (!FD.free && left > 0 && p.days > left + 12 && W && W.state !== 'later') add(2, 'Timing', p.n + ' may not finish before frost', 'It needs about ' + p.days + ' days and you have about ' + left + ' before the first frost (' + fmtD(FD.first) + '). Choose a fast variety, start it under cover, or use a row cover to stretch the season.', [id], 'Pick an early variety.'); }
      if (!isCold(p) && !permLike(p) && !FD.free && today < FD.last && p.sow.some(s => s.k === 'd' && s.w >= 0) && !p.sow.some(s => s.k === 'i' || s.k === 't')) add(1, 'Timing', p.n + ' must wait for the last frost', 'It cannot be sown outdoors until about ' + fmtD(FD.last) + '.', [id]);
    }
  });

  /* 2. neighbors: conflicts (all of them) and the happy pairs */
  rep.pairs.filter(p => p.kind === 'bad').forEach(p => add(3, 'Neighbors', pName(p.a) + ' and ' + pName(p.b) + ' do not mix', p.why + (kindName(p.a) !== kindName(p.b) ? ' (' + kindName(p.a) + ' next to ' + kindName(p.b) + ' layer)' : ''), [p.a, p.b], 'Move one of them at least ' + Math.round(rf) + ' ft away.'));
  const goodN = rep.pairs.filter(p => p.kind === 'good').length; if (goodN) F.push({ sev: 0, cat: 'Neighbors', title: goodN + ' helpful pairing' + (goodN > 1 ? 's' : ''), text: rep.pairs.filter(p => p.kind === 'good').slice(0, 4).map(p => pName(p.a) + ' + ' + pName(p.b) + ': ' + p.why).join(' · '), ids: [], unit: g.id });

  /* 3. water */
  rep.thirst.forEach(t => add(2, 'Water', pName(t.dry) + ' and ' + pName(t.wet) + ' want different watering', pName(t.dry) + ' likes it ' + (PBY[t.dry].wat === 1 ? 'dry' : 'moderate') + ' and ' + pName(t.wet) + ' wants steady moisture. They sit within ' + Math.round(rf) + ' ft of each other, so a single watering will fail one of them.', [t.dry, t.wet], 'Give them separate zones, or put the dry-lover on a mound or in a pot.'));
  const soilF = (SOILS[g.soil] || SOILS.loam).f;
  ids.forEach(id => { const p = PBY[id]; if (!p || !subject(id) || p.cat === 'c') return;
    if (soilF >= 1.3 && p.wat === 3) add(2, 'Water', p.n + ' is thirsty on fast-draining soil', 'Your ' + (SOILS[g.soil] || SOILS.loam).n.toLowerCase() + ' soil dries out quickly. Mulch deeply and expect to water often.', [id], 'Add compost and mulch 3 inches deep.');
    if (soilF <= .8 && p.wat === 1 && !p.tree) add(2, 'Water', p.n + ' hates wet feet and your soil holds water', 'Dry-loving plants rot in heavy ' + (SOILS[g.soil] || SOILS.loam).n.toLowerCase() + ' soil. ', [id], 'Plant on a mound, add grit, or use a raised bed.'); });
  let gal = 0; const rainWk = (S.wxn && S.wxn.m && S.wxn.m[today.getMonth()]) ? S.wxn.m[today.getMonth()].rain / 4.3 : null;
  ids.forEach(id => { const p = PBY[id]; if (!p || p.cat === 'c') return; gal += A[id].tiles * g.ft * g.ft * WEEKIN[p.wat || 2] * .623; });
  const needIn = ids.length ? gal / (Math.max(1, Object.keys(g.cells).filter(k => !isSp(g.cells[k].p)).length) * g.ft * g.ft * .623) : 0;
  if (gal) F.push({ sev: 0, cat: 'Water', title: 'Water budget: about ' + Math.round(gal) + ' gallons a week', text: 'Your mix averages ' + needIn.toFixed(1) + ' in of water a week at peak.' + (rainWk != null ? ' Typical rain here this month is about ' + rainWk.toFixed(1) + ' in a week, so you ' + (rainWk >= needIn ? 'should rarely need the hose.' : 'make up about ' + Math.round(gal * Math.max(0, 1 - rainWk / needIn)) + ' gallons by hand.') : ' Open the Almanac tab online once to learn your rainfall.'), ids: [], unit: g.id });

  /* 4. sun and shade */
  rep.shade.forEach(s => add(2, 'Sun', PBY[s.tall].n + ' shades ' + PBY[s.low].n, 'Tall plants cast shadow to the north (top of the map). ' + PBY[s.low].n + ' is a full-sun plant.', [s.low, s.tall], 'Swap places, or move the sun lover south of the tall plant.'));
  /* flowers sharing a tile with crops */
  if (gk(g) !== 'flower') overlaysOf(g).forEach(o => { const tall = []; Object.keys(o.cells).forEach(k => { const c = o.cells[k], b = g.cells[k]; if (isSp(c.p) || !b || isSp(b.p)) return; const fp = PBY[c.p], bp = PBY[b.p]; if (fp && bp && fp.h >= 36 && bp.h < 20 && bp.sun === 'F' && tall.indexOf(c.p + '|' + b.p) < 0) tall.push(c.p + '|' + b.p); }); tall.forEach(t => { const a = t.split('|'); add(2, 'Sun', PBY[a[0]].n + ' will shade ' + PBY[a[1]].n + ' on the same tile', PBY[a[0]].n + ' grows ' + Math.round(PBY[a[0]].h / 12) + ' ft tall over a low sun-loving crop.', [a[0], a[1]], 'Move the flower to the north edge of the bed.'); }); });

  /* 5. soil pH */
  const rng = ids.map(id => ({ id, r: phRange(PBY[id]), w: A[id].tiles })).filter(o => o.r && PBY[o.id].cat !== 'c' && PBY[o.id].cat !== 'm');
  let phBest = null; if (rng.length) { let best = -1; for (let v = 4.5; v <= 8; v += .1) { const sc = rng.filter(o => v >= o.r[0] - .01 && v <= o.r[1] + .01).reduce((a, o) => a + o.w, 0); if (sc > best + .001) { best = sc; phBest = +v.toFixed(1); } }
    const out = rng.filter(o => phBest < o.r[0] - .01 || phBest > o.r[1] + .01);
    if (out.length) { const worst = out.slice(0, 4); add(out.length > 2 ? 2 : 1, 'Soil', 'Soil pH: ' + out.length + ' plant' + (out.length > 1 ? 's' : '') + ' want something different', 'Most of this map will be happiest near pH ' + phBest + '. ' + worst.map(o => PBY[o.id].n + ' wants ' + PBY[o.id].ph).join('; ') + '.', out.map(o => o.id), 'Give them their own bed or pot and amend only that bed (sulfur lowers pH, lime raises it). Test first.'); }
    else F.push({ sev: 0, cat: 'Soil', title: 'Soil pH: everything agrees', text: 'Aim for about pH ' + phBest + '. A cheap test kit tells you where you stand.', ids: [], unit: g.id }); }

  /* 6. crowding */
  const at = {}; layerItems(g).forEach(it => { (at[it.k] = at[it.k] || []).push(it); });
  Object.keys(A).forEach(id => { const p = PBY[id]; if (!p || p.cat === 'c' || !subject(id)) return; const rd = Math.floor(p.sp / 12 / g.ft / 2); if (rd < 1) return; let crowd = 0; const names = {};
    A[id].items.forEach(it => { for (let dy = -rd; dy <= rd; dy++) for (let dx = -rd; dx <= rd; dx++) { if (!dx && !dy) continue; (at[(it.x + dx) + ',' + (it.y + dy)] || []).forEach(o => { if (o.p !== id && PBY[o.p] && PBY[o.p].h >= p.h * .4) { crowd++; names[o.p] = 1; } }); } });
    if (crowd >= 3) add(2, 'Spacing', p.n + ' is crowded', 'It spreads about ' + (p.sp >= 24 ? Math.round(p.sp / 12) + ' ft' : p.sp + ' in') + ' when grown, and ' + Object.keys(names).slice(0, 3).map(pName).join(', ') + ' sit inside that circle. Crowding invites mildew, blight and weak harvests.', [id].concat(Object.keys(names).slice(0, 2)), 'Leave a gap of ' + Math.max(1, rd) + ' tile' + (rd > 1 ? 's' : '') + ' around it.'); });

  /* 7. soil load and monoculture */
  const cropIds = ids.filter(id => PBY[id] && PBY[id].cat === 'v'), tv = cropIds.reduce((a, id) => a + A[id].tiles, 0);
  if (tv >= 8) { const heavy = cropIds.filter(id => PBY[id].feed === 'H').reduce((a, id) => a + A[id].tiles, 0); if (heavy / tv > .55) add(2, 'Soil', 'Heavy feeders fill ' + Math.round(heavy / tv * 100) + '% of the vegetables', 'Corn, tomatoes, squash and brassicas drain the soil. Dig in 2 inches of compost before planting, side-dress mid-season, and rotate this bed next year.', cropIds.filter(id => PBY[id].feed === 'H'), 'Mix in beans or peas (they fix nitrogen) and a cover crop after harvest.');
    const fam = {}; cropIds.forEach(id => { fam[PBY[id].fam] = (fam[PBY[id].fam] || 0) + A[id].tiles; }); const big = Object.keys(fam).sort((a, b) => fam[b] - fam[a])[0];
    if (big && fam[big] / tv > .45 && fam[big] >= 6) add(2, 'Pests', 'One plant family makes up ' + Math.round(fam[big] / tv * 100) + '% of the crops', 'Pests and blights that attack one member spread to them all. Mix families, and rotate: never grow the same family in the same spot two years running.', cropIds.filter(id => PBY[id].fam === big), 'Break the block up with herbs and flowers.'); }

  /* 8. runners and spreaders */
  const runs = ids.filter(id => AUD_RUN.indexOf(id) >= 0 && subject(id)); if (runs.length && ids.length > 3) add(2, 'Spread', 'Spreaders in a mixed bed: ' + runs.map(pName).join(', '), 'These run by roots or seed and will smother neighbors within a season or two.', runs, 'Sink them in a bottomless pot, edge the bed, or give them a corner of their own.');

  /* 9. pests, helpers and gophers */
  const hasHelper = ids.some(id => FLOWER_INFO[id] && FLOWER_INFO[id].tags.indexOf('p') >= 0 || ['marigold', 'nasturtium', 'alyssum', 'dill', 'borage', 'chives', 'garlic', 'basil', 'lavender'].indexOf(id) >= 0);
  const crops = cropIds.filter(id => typeof pestsFor === 'function' && pestsFor(id).length >= 2);
  if (crops.length >= 3 && !hasHelper) add(1, 'Pests', 'No pest-helper plants yet', 'You are growing ' + crops.slice(0, 3).map(pName).join(', ') + ', which many pests love, and nothing here to lure beneficials or confuse pests. Marigolds, nasturtiums, alyssum, borage, dill and chives all earn their place.', crops.slice(0, 3), 'Add a few of those at the bed edges (the Flowers layer suggests where).');
  const dm = dangerMap(g), repl = repelPlants(g), hot = Object.keys(dm).filter(k => dm[k] > .35);
  if (hot.length) { const risky = []; layerItems(g).forEach(it => { if (dm[it.k] > .35 && (GLOVE.indexOf(it.p) >= 0) && risky.indexOf(it.p) < 0) risky.push(it.p); }); if (risky.length) add(3, 'Gophers', 'Gopher activity near ' + risky.slice(0, 3).map(pName).join(', '), 'Mounds were logged close to plants gophers love.' + (Object.keys(repl).length ? ' Your deterrent flowers already help.' : ''), risky, Object.keys(repl).length ? 'Add wire baskets and a trap in the freshest run.' : 'Plant daffodils, alliums or fritillaria as a border, wire-basket the roots, and set a trap.'); }
  const baitN = ids.filter(id => AUD_BAIT.indexOf(id) >= 0 && subject(id)); if (baitN.length && !Object.keys(repl).length) add(1, 'Gophers', 'Gopher bait without deterrents: ' + baitN.map(pName).join(', '), 'Gophers and voles dig these bulbs and tubers.', baitN, 'Use wire baskets and ring them with daffodils or alliums.');

  /* rotation */
  { const rot = typeof rotationAudit === 'function' ? rotationAudit(g) : null; if (rot) rot.forEach(r => { const ids2 = cropIds.filter(id => PBY[id].fam === r.fam); add(2, 'Rotation', 'Same plant family on the same tiles as ' + r.y, r.n + ' tile' + (r.n > 1 ? 's' : '') + ' hold the same family as last season (' + ids2.slice(0, 3).map(pName).join(', ') + '). Growing it twice in a row builds up soil disease and pests.', ids2, 'Swap with a different family: ' + (ROT[r.fam] || 'something unrelated') ); }); }
  /* 10. workload clustering */
  const wk = {}, wkh = {}; ids.forEach(id => { const p = PBY[id]; if (!p || !subject(id) || A[id].planned === 0) return; const D = plantDates(p); D.steps.filter(s => s.k !== 'i' || true).forEach(s => { const d = s.date; if (dayDiff(d, today) < -3 || dayDiff(d, today) > 75) return; const key = dkey(addD(d, -d.getDay())); (wk[key] = wk[key] || []).push(id); }); if (D.harvest) { const key = dkey(addD(D.harvest.start, -D.harvest.start.getDay())); if (dayDiff(D.harvest.start, today) > 0 && dayDiff(D.harvest.start, today) < 160) (wkh[key] = wkh[key] || []).push(id); } });
  Object.keys(wk).sort().forEach(k => { const u = wk[k].filter((v, i, a) => a.indexOf(v) === i); if (u.length >= 6) F.push({ sev: 1, cat: 'Workload', title: 'Busy planting week of ' + fmtD(pd(k)), text: u.length + ' crops start that week (' + u.slice(0, 5).map(pName).join(', ') + (u.length > 5 ? ' and more' : '') + '). Plant the cold-hardy ones first and stagger the rest across two weeks.', ids: u.slice(0, 6), unit: g.id }); });
  Object.keys(wkh).sort().forEach(k => { const u = wkh[k].filter((v, i, a) => a.indexOf(v) === i); if (u.length >= 6) F.push({ sev: 1, cat: 'Workload', title: 'Harvest crunch the week of ' + fmtD(pd(k)), text: u.length + ' crops come ready together. Succession-sow half of them two or three weeks later so you are not buried in tomatoes and zucchini.', ids: u.slice(0, 6), unit: g.id }); });

  return { g, findings: F, per, A, phBest, gal };
}

function auditFungi(opt) {
  const F = [], per = {};
  gardensOf('fungi').forEach(g => { const room = roomOf(g), cnt = fungiCounts(g); if (!cnt.length) return;
    const add = (sev, cat, title, text, pids, fix) => { F.push({ sev, cat, title, text, ids: pids || [], fix: fix || '', unit: g.id }); (pids || []).forEach(id => { const o = per[id] = per[id] || { id, sev: 0, notes: [] }; o.sev = Math.max(o.sev, sev); o.notes.push({ sev, text: title }); }); };
    cnt.forEach(o => { per[o.id] = per[o.id] || { id: o.id, sev: 0, notes: [] }; });
    const sps = cnt.map(o => FBY[o.id]);
    sps.forEach(sp => { const f = roomFit(sp, room); if (f.ok === false) add(3, 'Temperature', sp.n + ': wrong room temperature', f.msg, [sp.id], 'Move it to a spot at ' + sp.fru.join(' to ') + ' F, or choose a species that suits your room.'); else if (f.ok === 'warn') add(2, 'Temperature', sp.n + ' will colonize but not fruit', f.msg, [sp.id], 'Colonize here, then move it to its fruiting temperature.'); });
    const ind = sps.filter(s => s.where !== 'out'); if (ind.length > 1) { const lo = Math.max.apply(null, ind.map(s => s.fru[0])), hi = Math.min.apply(null, ind.map(s => s.fru[1])); if (lo > hi + 2) { const cold = ind.slice().sort((a, b) => a.fru[1] - b.fru[1])[0], warm = ind.slice().sort((a, b) => b.fru[0] - a.fru[0])[0]; add(2, 'Temperature', 'These species want different temperatures', cold.n + ' fruits at ' + cold.fru.join(' to ') + ' F, but ' + warm.n + ' wants ' + warm.fru.join(' to ') + ' F. No single room suits both.', ind.map(s => s.id), 'Split them: a cool corner or basement for ' + cold.n + ', a warm shelf for ' + warm.n + '.'); } }
    ind.forEach(sp => { const m = /(\d+)\D+(\d+)/.exec(sp.hum); if (m && room.h < +m[1] - 5) add(2, 'Humidity', sp.n + ' needs more humidity', 'It fruits at ' + sp.hum + '% and your space reads ' + room.h + '%. Dry air makes small, cracked mushrooms.', [sp.id], 'Add a humidifier, a fogger, or a fruiting tent with damp perlite.'); });
    if (sps.some(s => s.where === 'out') && ind.length) add(1, 'Layout', 'Indoor and outdoor species on one map', 'Logs and outdoor beds live outside; kits and bags live indoors. Split them into two maps so each schedule reads clearly.', sps.map(s => s.id));
    const dead = cnt.filter(o => (o.st.dead || 0) > 0); if (dead.length) add(3, 'Contamination', 'Contaminated blocks on the map', 'Remove them from the area (do not open indoors) and clean the shelf with a dilute bleach or hydrogen-peroxide wipe before restarting.', dead.map(o => o.id));
    const sporeN = (S.spores || []).length; if (sporeN > 0 && sps.some(s => s.where !== 'out')) F.push({ sev: 1, cat: 'Spores', title: sporeN + ' spore sample' + (sporeN > 1 ? 's' : '') + ' on file', text: 'Keep spore syringes cool and dark, and label each with the date. Check the spore watchdog before opening any.', ids: [], unit: g.id });
  });
  return { findings: F, per };
}

function auditRun(layer, planned) {
  const units = layer === 'fungi' ? [] : auditUnits(layer), res = units.map(g => auditUnit(g, { planned })), F = [], per = {};
  const want = { veg: 'garden', herb: 'herb', flower: 'flower' }[layer];
  res.forEach(r => { r.findings.forEach(f => { if (want && f.ids.length && !f.ids.some(id => kindName(id) === want)) return; F.push(f); }); Object.keys(r.per).forEach(id => { if (want && kindName(id) !== want && !r.per[id].sev) return; const o = per[id] = per[id] || { id, sev: 0, notes: [] }; o.sev = Math.max(o.sev, r.per[id].sev); r.per[id].notes.forEach(n => { if (!o.notes.some(x => x.text === n.text)) o.notes.push(n); }); }); });
  if (layer === 'fungi' || layer === 'all') { const fr = auditFungi({ planned }); fr.findings.forEach(f => F.push(f)); Object.keys(fr.per).forEach(id => { per[id] = fr.per[id]; }); }
  const dedupe = {}; const FF = F.filter(f => { const k = f.cat + '|' + f.title; if (dedupe[k]) return false; dedupe[k] = 1; return true; });
  const n3 = FF.filter(f => f.sev === 3).length, n2 = FF.filter(f => f.sev === 2).length, n1 = FF.filter(f => f.sev === 1).length;
  const nPlants = Object.keys(per).length, score = nPlants ? clamp(Math.round(100 * Math.exp(-(n3 * .12 + n2 * .035 + n1 * .01))), 0, 100) : null;
  return { findings: FF.sort((a, b) => b.sev - a.sev), per, score, n3, n2, n1, nPlants, units: units.length };
}

/* ---------- audit sheet ---------- */
UI.aud = UI.aud || { layer: 'veg', planned: false };
function auditLayers() { const have = {}; S.gardens.forEach(g => { if (Object.keys(g.cells).length) have[gk(g)] = 1; }); return AUD_LAY.filter(a => a[0] === 'all' || have[a[0]]); }
function auditHTML() {
  const A = UI.aud, R = auditRun(A.layer, A.planned), lays = auditLayers();
  let h = '<p class="sm dim">Hortica checks everything on your maps against your climate, soil and each other, so you find the problem on paper and not in July.</p>' +
    '<div class="chips nowrap" id="audlay">' + lays.map(a => '<button class="chip' + (A.layer === a[0] ? ' on' : '') + '" data-act="audLay" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>' +
    '<label class="tog"><input type="checkbox" data-chg="audPlanned" ' + (A.planned ? 'checked' : '') + '><span>Judge only plants I have not planted yet</span></label>';
  if (R.score == null) return h + '<p class="dim">Nothing on this layer yet. Paint some plants first.</p>';
  const lab = R.score >= 85 && !R.n3 ? 'Ready to plant' : R.score >= 60 && R.n3 <= 1 ? 'Fix a few things first' : 'Needs rework', col = R.n3 ? 'var(--bad,#ff6a5c)' : R.n2 ? 'var(--gold,#e8c14b)' : 'var(--ok,#7be08a)';
  h += '<div class="audscore"><div class="audring" style="border-color:' + col + '"><b>' + R.score + '</b><span>ready</span></div><div><b>' + lab + '</b><div class="sm dim">' + R.nPlants + ' kind' + (R.nPlants > 1 ? 's' : '') + ' of plant checked<br>' + R.n3 + ' to fix first · ' + R.n2 + ' worth fixing · ' + R.n1 + ' good to know</div></div></div>';
  [3, 2, 1].forEach(sv => { const L = R.findings.filter(f => f.sev === sv); if (!L.length) return;
    h += '<h3 class="h3">' + (sv === 3 ? '⛔ ' : sv === 2 ? '⚠️ ' : 'ℹ️ ') + SEVN[sv] + ' (' + L.length + ')</h3>' + L.map(f => '<div class="flag ' + (sv === 3 ? 'ask' : sv === 2 ? 'space' : '') + '"><b>' + esc(f.title) + '</b> <span class="tag">' + esc(f.cat) + '</span><br><span class="sm">' + esc(f.text) + '</span>' + (f.fix ? '<br><span class="sm"><b>Try:</b> ' + esc(f.fix) + '</span>' : '') + (f.ids.length ? '<div class="chips c">' + f.ids.slice(0, 4).map(id => '<button class="chip" data-act="plantInfo" data-v="' + id + '">' + PBY[id].e + ' ' + esc(PBY[id].n) + '</button>').join('') + '</div>' : '') + '</div>').join(''); });
  const good = R.findings.filter(f => f.sev === 0); if (good.length) h += '<h3 class="h3">✅ Looking good</h3>' + good.map(f => '<div class="flag"><b>' + esc(f.title) + '</b><br><span class="sm">' + esc(f.text) + '</span></div>').join('');
  if (!R.n3 && !R.n2) h += '<p class="ok sm">No problems found. Go ahead and plant, at the best hours the Almanac suggests.</p>';
  const pl = Object.values(R.per).sort((a, b) => b.sev - a.sev); h += '<h3 class="h3">Plant by plant</h3><div class="audlist">' + pl.map(o => { const p = PBY[o.id]; if (!p) return ''; return '<button class="prow" data-act="plantInfo" data-v="' + o.id + '"><span class="pe">' + p.e + '</span><span class="pt"><b>' + esc(p.n) + '</b> <i class="dot s' + o.sev + '"></i><br><small>' + (o.notes.length ? esc(o.notes.slice(0, 2).map(n => n.text).join('; ')) : 'No issues') + '</small></span></button>'; }).join('') + '</div>';
  h += '<p class="foot">An audit is a planning aid built from general horticulture and traditional companion lore. Local conditions, microclimate and your extension office outrank it.</p>';
  return h;
}
ACT.auditOpen = el => { const want = el && el.dataset && el.dataset.v; const lays = auditLayers(); UI.aud.layer = want && lays.some(a => a[0] === want) ? want : (lays[0] ? lays[0][0] : 'veg'); if (lays.length > 2 && !want) UI.aud.layer = 'all'; openSheet('🧾 Full audit before planting', '<div id="audbody">' + auditHTML() + '</div>'); refreshNormals().then(() => { const b = $('#audbody'); if (b && sheetOpen()) b.innerHTML = auditHTML(); }); };
ACT.audLay = el => { UI.aud.layer = el.dataset.v; $('#audbody').innerHTML = auditHTML(); };
CHG.audPlanned = el => { UI.aud.planned = el.checked; $('#audbody').innerHTML = auditHTML(); };

/* ---------- will this plant fit my garden? (shown on every plant page) ---------- */
function fitCheck(p) {
  const L = []; const ok = t => L.push(['✅', t]), wn = t => L.push(['⚠️', t]), no = t => L.push(['⛔', t]);
  if (!zoneOk(p)) no('Not hardy in zone ' + S.loc.zone + ' (needs ' + p.zones + ').'); else if (p.zones !== '-' && S.loc.zone) ok('Hardy in your zone ' + S.loc.zone + '.');
  const W = plantWindow(p); if (W) { if (W.state === 'now') ok(W.text); else wn(W.text); }
  const g = p.lk ? GK(p.lk) : p.flw && p.cat !== 'h' ? GK('flower') : p.hx ? GK('herb') : GK('veg'); const gg = g || G();
  if (gg && Object.keys(gg.cells).some(k => !isSp(gg.cells[k].p))) {
    const fs = fitSummary(gg, p.id); if (fs.bad.length) no('Does not mix with ' + fs.bad.slice(0, 3).map(pName).join(', ') + ' on ' + gg.name + '.'); if (fs.good.length) ok('Friends already on the map: ' + fs.good.slice(0, 4).map(pName).join(', ') + '.');
    const items = layerItems(gg), here = {}; items.forEach(it => { here[it.p] = 1; });
    const far = Object.keys(here).filter(id => PBY[id] && Math.abs(PBY[id].wat - p.wat) >= 2); if (far.length) wn('Different thirst from ' + far.slice(0, 3).map(pName).join(', ') + '. Keep a few tiles apart.');
    const r = phRange(p); if (r) { const bad = Object.keys(here).filter(id => { const q = phRange(PBY[id]); return q && (q[1] < r[0] - .3 || q[0] > r[1] + .3); }); if (bad.length) wn('Soil pH ' + p.ph + ' differs from ' + bad.slice(0, 3).map(pName).join(', ') + '.'); else ok('Soil pH ' + p.ph + ' matches what is already there.'); }
    const soilF = (SOILS[gg.soil] || SOILS.loam).f; if (soilF >= 1.3 && p.wat === 3) wn('Thirsty plant on fast-draining ' + (SOILS[gg.soil] || SOILS.loam).n.toLowerCase() + ' soil.'); if (soilF <= .8 && p.wat === 1 && !p.tree) wn('Likes dry feet; your ' + (SOILS[gg.soil] || SOILS.loam).n.toLowerCase() + ' soil holds water. Use a mound or raised bed.');
  } else L.push(['ℹ️', 'Paint a few plants first and this check will compare it with your actual map.']);
  return '<div class="flag"><b>🧾 Will it fit my garden?</b>' + L.map(x => '<div class="sm">' + x[0] + ' ' + esc(x[1]) + '</div>').join('') + '<button class="mini" data-act="auditOpen">Run the full audit</button></div>';
}
