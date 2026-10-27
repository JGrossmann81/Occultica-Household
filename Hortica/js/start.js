/* Hortica "Start here": ask what you want, how much room and time you have, then lay out a sensible starter garden
   (vegetables, herbs and a flower layer), run the audit on it, and give you a first-week checklist. */
const ST_GOALS = [['salad', '🥗 Fresh salads and snacking'], ['cook', '🍲 Cooking staples'], ['tea', '🍵 Tea and home remedies'], ['cut', '💐 Cut flowers'], ['poll', '🐝 Bees, butterflies and pest control'], ['kids', '🧒 Easy and fun for kids']];
const ST_SIZE = [['pots', 'Pots or window box (4 × 2 ft)', 4, 2, 1], ['bed', 'One raised bed (8 × 4 ft)', 8, 4, 1], ['yard', 'Backyard plot (10 × 15 tiles of 2 ft)', 10, 15, 2], ['big', 'Big garden (12 × 18 tiles of 3.3 ft)', 12, 18, 3.34]];
const ST_TIME = [['low', '15 minutes a week', 5], ['med', 'An hour or so', 8], ['high', 'Three hours or more', 12]];
const ST_SUN = [['F', '☀️ Full sun (6+ hours)'], ['P', '⛅ Part sun (3 to 6 hours)'], ['S', '☁️ Mostly shade']];
const ST_POOL = {
  salad: ['lettuce', 'radish', 'arugula', 'cucumber', 'tomato', 'carrot', 'spinach', 'chives', 'beet', 'pepper'],
  cook: ['tomato', 'pepper', 'onion', 'garlic', 'bushbean', 'zucchini', 'carrot', 'potato', 'basil', 'parsley', 'kale', 'thyme', 'oregano'],
  tea: ['chamomile', 'lemonbalm', 'peppermint', 'calendula', 'lavender', 'echinacea', 'tulsi', 'thyme', 'sage'],
  cut: ['zinnia', 'cosmos', 'sunflower', 'snapdragon', 'dahlia', 'sweetpea', 'calendula', 'lavender'],
  poll: ['borage', 'alyssum', 'beebalm', 'salvia', 'lavender', 'marigold', 'cosmos', 'zinnia', 'nasturtium', 'dill'],
  kids: ['sunflower', 'radish', 'tomato', 'bushbean', 'pumpkin', 'strawberry', 'nasturtium', 'carrot', 'peas']
};
UI.st = UI.st || { goals: { salad: 1, poll: 1 }, size: 'bed', time: 'med', sun: 'F', gopher: 'no' };
function stForm() {
  const A = UI.st, ch = (arr, key, multi) => '<div class="chips c">' + arr.map(a => '<button class="chip' + ((multi ? A.goals[a[0]] : A[key] === a[0]) ? ' on' : '') + '" data-act="stPick" data-k="' + key + '" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  return '<p class="sm">Answer five quick questions and Hortica lays out a starter garden for you, checks it, and gives you a first-week to-do list. You can change anything afterwards.</p>' +
    '<h3 class="h3">1. What do you want from your garden?</h3>' + ch(ST_GOALS, 'goals', true) +
    '<h3 class="h3">2. How much room?</h3>' + ch(ST_SIZE.map(a => [a[0], a[1]]), 'size') +
    '<h3 class="h3">3. How much time each week?</h3>' + ch(ST_TIME.map(a => [a[0], a[1]]), 'time') +
    '<h3 class="h3">4. How much sun?</h3>' + ch(ST_SUN, 'sun') +
    '<h3 class="h3">5. Gophers or voles?</h3>' + ch([['no', 'Not that I know'], ['yes', 'Yes, they are a problem']], 'gopher') +
    '<button class="btn gold block" data-act="stBuild">✨ Build my starter garden</button><p class="foot">Hortica picks plants that suit your zone, light and time, avoids bad neighbors, and puts tall plants at the north edge so they do not shade the rest.</p>';
}
ACT.startOpen = () => { openSheet('✨ Start here', '<div id="stbody">' + stForm() + '</div>'); };
ACT.stPick = el => { const k = el.dataset.k, v = el.dataset.v; if (k === 'goals') { UI.st.goals[v] = UI.st.goals[v] ? 0 : 1; } else UI.st[k] = v; $('#stbody').innerHTML = stForm(); };

function stScore(p, A, chosen) {
  let sc = 0; const W = plantWindow(p); if (W) sc += W.state === 'now' ? 3 : W.state === 'soon' ? 2 : 0;
  if (A.time === 'low') { if (p.wat === 3) sc -= 2; if (p.feed === 'H') sc -= 1; if (p.perm) sc += 1.5; if (p.days > 100 && !p.perm) sc -= 1; }
  if (A.time === 'high') sc += .5;
  if (A.gopher === 'yes' && GLOVE.indexOf(p.id) >= 0) sc -= 5;
  chosen.forEach(id => { relation(p.id, id).forEach(r => { sc += r.k === 'good' ? 1.2 : -20; }); });
  return sc;
}
function stPick(A) {
  const goals = Object.keys(A.goals).filter(k => A.goals[k]); if (!goals.length) goals.push('salad');
  const target = ST_TIME.find(t => t[0] === A.time)[2], area = (ST_SIZE.find(s => s[0] === A.size)[2]) * ST_SIZE.find(s => s[0] === A.size)[3], nKinds = Math.max(3, Math.min(target, Math.floor(area / 4)));
  const cand = []; goals.forEach(gl => ST_POOL[gl].forEach(id => { const p = PBY[id]; if (!p || cand.some(c => c.id === id)) return; if (!zoneOk(p)) return; if (A.sun === 'S' && p.sun === 'F') return; if (A.sun === 'P' && p.sun === 'F' && ['tomato', 'pepper', 'cucumber', 'zucchini', 'pumpkin', 'sunflower', 'zinnia', 'corn'].indexOf(id) >= 0) return; cand.push({ id, goal: gl, p }); }));
  const chosen = [], isFlower = c => c.p.fx, isHerb = c => c.p.hx;
  const hasVeg = goals.some(g => ['salad', 'cook', 'kids'].indexOf(g) >= 0), mainFlower = !hasVeg && !goals.includes('tea');
  /* round-robin across goals so every wish is represented */
  const per = {}; goals.forEach(g => { per[g] = cand.filter(c => c.goal === g); }); let guard = 0;
  while (chosen.length < nKinds && guard++ < 60) { let added = false; for (const g of goals) { if (chosen.length >= nKinds) break; const L = per[g].filter(c => !chosen.some(x => x.id === c.id)).map(c => [c, stScore(c.p, A, chosen.map(x => x.id))]).filter(a => a[1] > -10).sort((a, b) => b[1] - a[1]); if (L.length) { chosen.push(L[0][0]); added = true; } } if (!added) break; }
  /* the pest-helper edge: marigold or nasturtium for any vegetable layout, daffodil and allium when gophers are about */
  const helpers = []; const addH = id => { const p = PBY[id]; if (p && zoneOk(p) && helpers.indexOf(id) < 0 && !chosen.some(c => c.id === id) && !chosen.some(c => relation(id, c.id).some(r => r.k === 'bad'))) helpers.push(id); };
  if (chosen.some(c => !c.p.fx && !c.p.hx)) { addH('marigold'); addH('nasturtium'); addH('alyssum'); }
  if (A.gopher === 'yes') { addH('daffodil'); addH('allium'); }
  return { chosen, helpers, hasVeg, mainFlower, goals };
}
function stTiles(list, area, ft) { // how many tiles each plant gets
  const mins = list.map(p => Math.max(1, Math.round(Math.pow(p.sp / 12 / ft, 2)))), budget = Math.floor(area * .86), tot = mins.reduce((a, b) => a + b, 0), out = mins.map(m => m);
  if (tot > budget) { while (out.reduce((a, b) => a + b, 0) > budget && out.length > 2) { out.pop(); list.pop(); mins.pop(); } return out; }
  const cap = Math.max(2, Math.round(area * .16)); let spare = budget - tot, i = 0, guard = 0; while (spare > 0 && out.length && guard++ < 2000) { const j = i % out.length; if (out[j] < Math.max(cap, mins[j])) { out[j] += 1; spare--; } i++; } return out;
}
function stFill(g, ids, tilesN) { // tallest at the north edge, short plants toward the south
  const order = ids.map((id, i) => ({ id, n: tilesN[i], h: PBY[id].h })).sort((a, b) => b.h - a.h); let k = 0;
  order.forEach(o => { for (let i = 0; i < o.n && k < g.w * g.h; i++, k++) g.cells[(k % g.w) + ',' + Math.floor(k / g.w)] = { p: o.id, s: 'plan' }; });
}
function stGarden(kind, name, w, h, ft) { let g = gardensOf(kind).find(x => !Object.keys(x.cells).length && !overlaysOf(x).length); if (!g) { g = newGarden(name, w, h, ft); if (kind !== 'veg') g.kind = kind; S.gardens.push(g); } else { g.name = name; g.w = w; g.h = h; g.ft = ft; } g.cells = {}; g.soil = S.settings.soil || 'loam'; setCur(g); return g; }
ACT.stBuild = () => {
  const A = UI.st, sz = ST_SIZE.find(s => s[0] === A.size), R = stPick(A), veg = R.chosen.filter(c => !c.p.fx && !c.p.hx).map(c => c.id), herbs = R.chosen.filter(c => c.p.hx).map(c => c.id), flw = R.chosen.filter(c => c.p.fx).map(c => c.id);
  const made = [];
  if (veg.length) { const g = stGarden('veg', 'Starter garden', sz[2], sz[3], sz[4]); const list = veg.map(id => PBY[id]); const t = stTiles(list, g.w * g.h, g.ft); stFill(g, list.map(p => p.id), t); made.push(g); UI.gk = 'veg'; }
  if (herbs.length) { const hs = veg.length ? [6, 4, 1] : [sz[2], sz[3], sz[4]]; const g = stGarden('herb', 'Starter herbs', hs[0], hs[1], hs[2]); const list = herbs.map(id => PBY[id]); const t = stTiles(list, g.w * g.h, g.ft); stFill(g, list.map(p => p.id), t); made.push(g); if (!veg.length) UI.gk = 'herb'; }
  const base = made.length ? made[0] : null, fl = flw.concat(R.helpers);
  if (fl.length) { let g; if (base) { g = overlaysOf(base)[0]; if (!g) { g = newGarden('Flowers on ' + base.name, base.w, base.h, base.ft); g.over = base.id; g.kind = 'flower'; S.gardens.push(g); } g.cells = {}; g.soil = base.soil; const per = []; for (let x = 0; x < base.w; x++) { per.push([x, base.h - 1]); } for (let y = 0; y < base.h - 1; y++) { per.push([0, y]); per.push([base.w - 1, y]); } const edge = R.helpers.concat(flw.filter(id => PBY[id].h <= 36)), put = (x, y, id) => { if (!g.cells[x + ',' + y]) g.cells[x + ',' + y] = { p: id, s: 'plan' }; }; per.forEach((c, i) => { const id = edge[i % Math.max(1, edge.length)]; if (id && i % 2 === 0) put(c[0], c[1], id); }); flw.filter(id => PBY[id].h > 36).forEach((id, i) => { put(base.w - 1, i * 2, id); }); } else { g = stGarden('flower', 'Starter flowers', sz[2], sz[3], sz[4]); const list = fl.map(id => PBY[id]); const t = stTiles(list, g.w * g.h, g.ft); stFill(g, list.map(p => p.id), t); made.push(g); UI.gk = 'flower'; } setCur(g); }
  if (!made.length) { toast('Could not find plants that suit those answers. Try more sun or a different goal.', 4000); return; }
  const now = NOW(); const steps = [];
  const soilG = made[0], f = feedPlan(soilG); steps.push({ id: 's1', t: '🧪 Test your soil', d: 'A $15 kit tells you pH and nutrients. Aim for pH ' + (auditUnit(soilG, {}).phBest || 6.5) + ' for this mix.' });
  steps.push({ id: 's2', t: '📏 Mark out the beds', d: 'Your starter map is ' + made.map(g => g.w * g.ft + ' × ' + g.h * g.ft + ' ft').join(' and ') + '. Stakes and string work. Clear weeds and loosen the soil a spade deep.' });
  steps.push({ id: 's3', t: '🛒 Buy compost and mulch', d: f.shop.slice(0, 3).map(s => AMEND[s[0]][0] + ' ' + s[1] + ' ' + s[2]).join(', ') + '. Spread 1 to 2 inches of compost on top and work it in.' });
  const allIds = R.chosen.map(c => c.id).concat(R.helpers), nowIds = allIds.filter(id => { const w = plantWindow(PBY[id]); return w && w.state === 'now'; }), soonIds = allIds.filter(id => { const w = plantWindow(PBY[id]); return w && w.state === 'soon'; });
  if (nowIds.length) { const b = bestTimes(PBY[nowIds[0]], 'sow', { days: 7 })[0]; steps.push({ id: 's4', t: '🌱 Plant now: ' + nowIds.slice(0, 5).map(pName).join(', '), d: 'These are in their planting window today.' + (b ? ' A good hour for it: ' + whenText(b) + ' (' + b.planet + ' hour). Tradition, not law: frost and rain come first.' : '') }); }
  if (soonIds.length) steps.push({ id: 's5', t: '📅 Coming up: ' + soonIds.slice(0, 5).map(pName).join(', '), d: 'Their windows open soon. Get seed or starts ready (the Journal tab tracks your seed shelf).' });
  if (A.gopher === 'yes') steps.push({ id: 's6', t: '🕳️ Gopher defenses', d: 'Line the bed bottoms with half-inch hardware cloth before planting roots, plant the daffodil and allium edge, and log mounds on the Gopher tab.' });
  steps.push({ id: 's7', t: '💧 Set a watering habit', d: 'Water deeply in the morning; the Plan tab shows what is due. Mulch cuts watering by a third.' });
  steps.push({ id: 's8', t: '📸 Take a "day one" photo', d: 'Open any tile and add a photo. Next spring you will be glad you did.' });
  S.start = { at: dkey(), A: JSON.parse(JSON.stringify(A)), steps, ids: allIds, gs: made.map(g => g.id) }; save();
  const rr = auditRun('all', true);
  openSheet('✨ Your starter garden', '<p class="sm">Built for <b>' + R.goals.map(g => ST_GOALS.find(x => x[0] === g)[1].slice(3).toLowerCase()).join(', ') + '</b>, in ' + (A.sun === 'F' ? 'full sun' : A.sun === 'P' ? 'part sun' : 'shade') + ', for about ' + ST_TIME.find(t => t[0] === A.time)[1].toLowerCase() + ' a week.</p><div class="chips c">' + allIds.map(id => '<button class="chip" data-act="plantInfo" data-v="' + id + '">' + PBY[id].e + ' ' + esc(PBY[id].n) + '</button>').join('') + '</div>' + (rr.score != null ? '<div class="audscore"><div class="audring" style="border-color:' + (rr.n3 ? 'var(--red)' : rr.n2 ? 'var(--gold)' : 'var(--green)') + '"><b>' + rr.score + '</b><span>ready</span></div><div class="sm">Hortica ran the full audit on it: ' + (rr.n3 ? rr.n3 + ' thing(s) to fix first. ' : 'no blockers. ') + (rr.n2 ? rr.n2 + ' worth a look.' : '') + '</div></div>' : '') + '<h3 class="h3">Your first week</h3>' + steps.map(s => '<div class="nrow"><b>' + esc(s.t) + '</b><br><span class="sm dim">' + esc(s.d) + '</span></div>').join('') + '<button class="btn gold block" data-act="stDone">Show me my map</button><button class="btn block" data-act="auditOpen" data-v="all">🧾 See the full audit</button><p class="foot">This is a starting point, not a rulebook. Paint over anything you like.</p>');
};
ACT.stDone = () => { UI.tab = 'garden'; UI.status = 'plan'; closeSheetQuiet(); render(); window.scrollTo(0, 0); };
function startCard() {
  const s = S.start; const empty = !S.gardens.some(g => Object.keys(g.cells).length);
  if (!s && empty) return '<section class="card tip"><div class="ct"><span>✨ New here?</span></div><p class="sm">Tell Hortica what you want to grow and it will lay out a starter garden, check it, and plan your first week.</p><button class="btn gold block" data-act="startOpen">Start here</button></section>';
  if (!s || s.dismiss || s.steps.every(x => x.done)) return '';
  const left = s.steps.filter(x => !x.done), show = UI.stAll ? s.steps : s.steps.filter(x => !x.done).slice(0, 3);
  return '<section class="card tip"><div class="ct"><span>✨ Your first week</span><span class="tag">' + (s.steps.length - left.length) + '/' + s.steps.length + '</span></div>' + show.map(x => '<div class="task' + (x.done ? ' dn' : '') + '"><button class="ck" data-act="stStep" data-v="' + x.id + '" aria-label="Done">' + (x.done ? '✓' : '') + '</button><div class="tt"><b>' + esc(x.t) + '</b><br><span class="sm dim">' + esc(x.d) + '</span></div></div>').join('') + '<div class="row wrap">' + (left.length > 3 || UI.stAll ? '<button class="mini" data-act="stAll">' + (UI.stAll ? 'Show fewer' : 'Show all ' + s.steps.length + ' steps') + '</button>' : '') + '<button class="mini" data-act="startOpen">Start over</button><button class="mini" data-act="stHide">Hide</button></div></section>';
}
ACT.stStep = el => { const x = S.start.steps.find(s => s.id === el.dataset.v); x.done = !x.done; save(); render(); };
ACT.stHide = () => { S.start.dismiss = true; save(); render(); };

ACT.stAll = () => { UI.stAll = !UI.stAll; render(); };
