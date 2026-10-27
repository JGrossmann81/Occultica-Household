/* Hortica flower layer UI: overlay maps, flower advice, bloom calendar, helper-flower suggestions. */
const FLPRESETS = [['cut', 'Cutting garden (10 × 4 ft)', 10, 4, 1], ['pol', 'Pollinator border (12 × 3 ft)', 12, 3, 1], ['cottage', 'Cottage garden (12 × 10 ft)', 12, 10, 1], ['bulbs', 'Bulb and perennial bed (8 × 6 ft)', 8, 6, 1]];
const hlab = p => bloomy(p) ? 'Bloom' : 'Harvest';
const MONI = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function bloomMonths(id) { const i = FLOWER_INFO[id], out = new Set(); if (!i) return out; const re = /([A-Z][a-z]{2})-([A-Z][a-z]{2})/g; let m; while ((m = re.exec(i.bloom))) { let a = MONI[m[1]], b = MONI[m[2]]; if (a == null || b == null) continue; for (let x = a; ; x = (x + 1) % 12) { out.add(x); if (x === b) break; } } return out; }
/* how a candidate plant relates to everything already on this map, ignoring distance */
function fitSummary(g, id) {
  const out = { good: [], bad: [] }; if (!g || PBY[id] && PBY[id].fung) return out; const seen = {};
  layerItems(g).forEach(it => { if (it.p === id || seen[it.p]) return; seen[it.p] = 1; const rs = relation(id, it.p); if (rs.some(r => r.k === 'bad')) out.bad.push(it.p); else if (rs.length) out.good.push(it.p); });
  return out;
}
function flowerStart() {
  const bases = S.gardens.filter(x => ['veg', 'herb'].indexOf(gk(x)) >= 0);
  return '<section class="card"><div class="ct"><span>🌸 Build your flower garden</span></div><p class="sm">Flowers for beauty, cutting, bees, pest control and traditional medicine. Lay them out on a map of their own, or <b>on top of your farm or herb map</b> to see which flowers sit beside which vegetables. Hortica checks every pairing as you paint, and your gopher map updates when you plant gopher-resistant flowers.</p>' +
    (bases.length ? '<h3 class="h3">Overlay on a map you already have</h3>' + bases.map(b => '<button class="btn block gold" data-act="fOver" data-v="' + b.id + '">' + KINDS[gk(b)][0] + ' ' + esc(b.name) + ' (' + b.w + ' × ' + b.h + ' tiles)</button>').join('') + '<p class="sm dim">Same tiles, same size. You can show or hide the map underneath.</p>' : '') +
    '<h3 class="h3">Or start a separate flower bed</h3>' + FLPRESETS.map(p => '<button class="btn block" data-act="fMakeFl" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</section>';
}
function newFlowerGarden(g, name) { g.kind = 'flower'; S.gardens.push(g); setCur(g); UI.gk = 'flower'; UI.brush = 'zinnia'; UI.status = 'plan'; UI.baseOn = true; UI.tab = 'garden'; save(); closeSheetQuiet(); render(); toast(name, 4000); }
ACT.fOver = el => { const b = S.gardens.find(x => x.id === el.dataset.v); if (!b) return; const g = newGarden('Flowers on ' + b.name, b.w, b.h, b.ft); g.over = b.id; g.soil = b.soil; newFlowerGarden(g, 'Flower layer ready on top of ' + b.name + '. Pick a flower and paint.'); };
ACT.fMakeFl = el => { const p = FLPRESETS.find(x => x[0] === el.dataset.v), g = newGarden(p[1].split(' (')[0], p[2], p[3], p[4]); newFlowerGarden(g, 'Flower garden ready. Pick a flower and paint.'); };
ACT.flowerGarden = () => { UI.gk = 'flower'; setTab('garden'); };
function overlayBar(g) {
  let h = ''; const k = gk(g);
  if (k === 'flower' && g.over) { const b = baseOf(g); if (b) h += '<label class="tog"><input type="checkbox" data-chg="baseOn" ' + (UI.baseOn !== false ? 'checked' : '') + '><span>Show the <b>' + esc(b.name) + '</b> map underneath</span></label><p class="sm dim">This layer sits on top of ' + esc(b.name) + '. Same tiles. Painting here only changes the flowers.</p>'; }
  else if (k !== 'flower') { const ov = overlaysOf(g); if (ov.length) h += '<label class="tog"><input type="checkbox" data-chg="showFl" ' + (UI.showFl !== false ? 'checked' : '') + '><span>Show the flower layer on this map (' + ov.map(o => esc(o.name)).join(', ') + ')</span></label>'; else h += '<div class="row wrap"><button class="btn" data-act="flOverHere">🌸 Add a flower layer on top of this map</button></div>'; }
  return h;
}
ACT.flOverHere = () => { const b = G(); if (!b) return; ACT.fOver({ dataset: { v: b.id } }); };
function auditBar(g) { return '<div class="row wrap"><button class="btn" data-act="auditOpen" data-v="' + gk(g) + '">🧾 Full audit before planting</button><button class="btn" data-act="skyOpen">🌙 Best times</button></div>'; }
CHG.baseOn = el => { UI.baseOn = el.checked; render(); };
CHG.showFl = el => { UI.showFl = el.checked; render(); };

function flowerBlock(p, short) {
  const i = FLOWER_INFO[p.id]; if (!i) return '';
  let h = '<div class="flag fl"><b>🌸 Flower facts</b><div class="chips c">' + i.tags.map(t => '<span class="chip">' + (FLOWER_TAGS[t] || t) + '</span>').join('') + '</div>' + (short ? '' : '<p class="sm"><b>Blooms:</b> ' + esc(i.bloom) + ' · ' + esc(i.colors) + '</p>') + '<p class="sm">' + esc(i.uses) + '</p><p class="sm"><b>In the garden:</b> ' + esc(i.role) + '</p>' + (i.caution && !/^none known/i.test(i.caution) ? '<p class="sm ' + (i.tags.indexOf('t') >= 0 ? 'warn' : '') + '"><b>' + (i.tags.indexOf('t') >= 0 ? '☠️ ' : '') + 'Caution:</b> ' + esc(i.caution) + '</p>' : '') + '</div>';
  return h;
}
function flowerExtras(g, cnt, rep) {
  let h = ''; const ids = cnt.map(o => o.id), tags = {}; ids.forEach(id => { const i = FLOWER_INFO[id]; if (i) i.tags.forEach(t => { tags[t] = (tags[t] || 0) + 1; }); });
  const tk = Object.keys(tags); if (tk.length) h += '<div class="chips c">' + tk.map(t => '<span class="chip">' + (FLOWER_TAGS[t] || t) + ' ' + tags[t] + '</span>').join('') + '</div>';
  /* bloom calendar */
  const cov = Array.from({ length: 12 }, () => []); ids.forEach(id => bloomMonths(id).forEach(m => cov[m].push(id)));
  const gaps = cov.map((a, i) => a.length ? -1 : i).filter(i => i >= 0), now = NOW().getMonth();
  h += '<h3 class="h3">Bloom calendar</h3><div class="bloom">' + cov.map((a, i) => '<div class="bm' + (a.length ? ' on' : '') + (i === now ? ' now' : '') + '" title="' + esc(a.map(pName).join(', ')) + '"><b>' + MON[i].charAt(0) + '</b><span>' + (a.length || '') + '</span></div>').join('') + '</div>';
  if (gaps.length) {
    const spring = gaps.filter(m => m >= 2 && m <= 10);
    const sug = PLANTS.filter(p => p.flw && ids.indexOf(p.id) < 0 && FLOWER_INFO[p.id].tags.indexOf('o') >= 0 && spring.some(m => bloomMonths(p.id).has(m))).sort((a, b) => spring.filter(m => bloomMonths(b.id).has(m)).length - spring.filter(m => bloomMonths(a.id).has(m)).length).slice(0, 4);
    h += '<p class="sm">No blooms in ' + gaps.map(m => MON[m]).join(', ') + '.' + (spring.length ? ' Bees and butterflies go hungry in the warm gap months: ' + spring.map(m => MON[m]).join(', ') + '.' : '') + '</p>' + (sug.length ? '<div class="chips c">' + sug.map(p => '<button class="chip" data-act="plantInfo" data-v="' + p.id + '">' + p.e + ' ' + esc(p.n) + '</button>').join('') + '</div>' : '');
  } else h += '<p class="ok sm">Something is in bloom every month. Your pollinators will thank you.</p>';
  const tox = ids.filter(id => FLOWER_INFO[id] && FLOWER_INFO[id].tags.indexOf('t') >= 0);
  if (tox.length) h += '<div class="flag space"><b>☠️ Poisonous: ' + tox.map(id => esc(pName(id))).join(', ') + '</b><br><span class="sm">Keep these away from where children, pets and livestock roam and from the kitchen garden. Never eat or make tea from a flower you are not completely sure of.</span></div>';
  const run = ids.filter(id => ['tansy', 'morningglory', 'goldenrod', 'honeysuckle', 'violet', 'milkweed', 'fouroclock', 'californiapoppy', 'forgetmenot'].indexOf(id) >= 0);
  if (run.length) h += '<div class="flag space"><b>🏃 Spreaders: ' + run.map(id => esc(pName(id))).join(', ') + '</b><br><span class="sm">These self-sow or run by roots. Deadhead before seed set, edge the bed, or give them a corner of their own.</span></div>';
  const bait = ids.filter(id => ['tulip', 'lily', 'dahlia', 'gladiolus', 'daylily', 'canna'].indexOf(id) >= 0), repel = ids.filter(id => GREPEL[id]);
  if (bait.length) h += '<div class="flag space"><b>🕳️ Gopher bait: ' + bait.map(id => esc(pName(id))).join(', ') + '</b><br><span class="sm">Gophers and voles dig these bulbs, tubers and corms. Plant them in wire baskets' + (repel.length ? ' and keep them next to ' + repel.slice(0, 3).map(id => esc(pName(id))).join(', ') + '.' : ', and ring them with daffodils or alliums.') + '</span></div>';
  else if (repel.length) h += '<div class="flag"><b>🛡 Gopher deterrents planted: ' + repel.map(id => esc(pName(id))).join(', ') + '</b><br><span class="sm">The Gopher tab now shows a green deterrent zone around them. They help, but wire baskets and traps still do the heavy work.</span></div>';
  return h;
}
function helperFlowers(g) { // flowers not yet planted that have good pairings with what is on this map
  const items = layerItems(g), present = {}; items.forEach(it => { present[it.p] = 1; }); const pids = Object.keys(present).filter(id => !(FLOWER_INFO[id] && PBY[id].cat === 'fl')); if (!pids.length) return '';
  const rows = []; PLANTS.forEach(p => { if (!p.flw || present[p.id]) return; const ok = [], bad = []; pids.forEach(id => { const rs = relation(p.id, id); if (rs.some(r => r.k === 'bad')) bad.push(id); else if (rs.length) ok.push({ id, why: rs[0].why }); }); if (ok.length && !bad.length) rows.push({ p, ok }); });
  rows.sort((a, b) => b.ok.length - a.ok.length); const top = rows.slice(0, 5); if (!top.length) return '';
  return '<details open><summary>🌸 Flowers that would help what you are growing</summary>' + top.map(r => '<div class="flag"><b>' + r.p.e + ' ' + esc(r.p.n) + '</b> helps ' + r.ok.slice(0, 4).map(o => esc(pName(o.id))).join(', ') + '<br><span class="sm">' + esc(r.ok[0].why) + '</span><br><button class="mini" data-act="flHelp" data-v="' + r.p.id + '">🖌 Paint on my map</button></div>').join('') + '</details>';
}
ACT.flHelp = el => {
  let g = G(); if (!g) return; if (gk(g) !== 'flower') { let ov = overlaysOf(g)[0]; if (!ov) { ov = newGarden('Flowers on ' + g.name, g.w, g.h, g.ft); ov.over = g.id; ov.soil = g.soil; ov.kind = 'flower'; S.gardens.push(ov); } setCur(ov); }
  UI.gk = 'flower'; UI.brush = el.dataset.v; pushRecent(el.dataset.v); UI.tool = 'paint'; UI.baseOn = true; save(); closeSheetQuiet(); UI.tab = 'garden'; render(); toast(pName(el.dataset.v) + ' is your brush on the flower layer. Drag over the tiles.', 3500);
};
