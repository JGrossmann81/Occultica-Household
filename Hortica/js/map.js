/* Hortica garden map: canvas tile editor, plant picker, tile and garden sheets, companion report. */
const CATCOL = { v: '#2f6b3a', h: '#2a6b61', fl: '#8a3f6b', f: '#8a3a3a', s: '#55702f', su: '#3f7a5a', t: '#1f5a2a', c: '#6f6e2e' };
UI.brush = 'tomato'; UI.status = 'plan'; UI.layer = 'plants'; UI.recent = ['tomato', 'basil', 'carrot']; UI.pq = ''; UI.pcat = 'all';
const TOOLS = [['look', '👆 Look'], ['paint', '🖌 Paint'], ['rect', '▭ Fill box'], ['erase', '🧽 Erase'], ['water', '💧 Water']];
const cellSize = (g, avail) => clamp(Math.floor(avail / g.w), 30, 58);
function plantsPerTile(p, ft) { return p.tree ? 1 : Math.pow(ft * 12 / p.sp, 2); }
function fmtN(n) { return n >= 1000 ? Math.round(n).toLocaleString('en-US') : n >= 10 ? String(Math.round(n)) : n >= 1 ? String(Math.round(n * 10) / 10).replace(/\.0$/, '') : n.toFixed(2).replace(/0$/, ''); }

function drawMap(cv, g, mode, opt) {
  opt = opt || {}; const cs = cv._cs, dpr = window.devicePixelRatio || 1, W = g.w * cs, H = g.h * cs;
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  c.fillStyle = gk(g) === 'fungi' ? '#241e1b' : '#3b2c20'; c.fillRect(0, 0, W, H);
  const rep = mode === 'plants' && gk(g) !== 'fungi' ? companionReport(g) : null, wat = mode === 'water' ? waterStatus(g) : null;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // canopies first
  Object.keys(g.cells).forEach(k => { const cell = g.cells[k], p = PBY[cell.p]; if (!p || !p.tree) return; const rt = (p.sp / 24) / g.ft; if (rt < .7) return; const a = k.split(','); c.beginPath(); c.arc((+a[0] + .5) * cs, (+a[1] + .5) * cs, rt * cs, 0, 7); c.fillStyle = 'rgba(70,140,70,.17)'; c.fill(); c.strokeStyle = 'rgba(120,190,110,.35)'; c.lineWidth = 1; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]); });
  const base = gk(g) === 'flower' ? baseOf(g) : null, fo = (gk(g) !== 'flower' && gk(g) !== 'fungi' && (mode === 'plants' || mode === 'gopher') && UI.showFl !== false) ? overlaysOf(g) : [], showBase = base && UI.baseOn !== false;
  if (showBase) Object.keys(base.cells).forEach(k => { const cl = base.cells[k], a = k.split(','), px = a[0] * cs, py = a[1] * cs; if (isSp(cl.p)) { c.globalAlpha = .5; c.fillStyle = SPECIAL[cl.p][1]; c.fillRect(px + 1, py + 1, cs - 2, cs - 2); c.globalAlpha = 1; return; } const bp = PBY[cl.p]; if (!bp) return; c.globalAlpha = .4; c.fillStyle = CATCOL[bp.cat] || '#2f6b3a'; c.fillRect(px + 1, py + 1, cs - 2, cs - 2); c.globalAlpha = 1; });
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const k = x + ',' + y, cell = g.cells[k], px = x * cs, py = y * cs;
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1; c.strokeRect(px + .5, py + .5, cs - 1, cs - 1);
    if (!cell) continue;
    if (isSp(cell.p)) { c.fillStyle = SPECIAL[cell.p][1]; c.fillRect(px + 1, py + 1, cs - 2, cs - 2); if (SPECIAL[cell.p][2]) { c.font = (cs * .55) + 'px serif'; c.fillText(SPECIAL[cell.p][2], px + cs / 2, py + cs / 2 + 1); } continue; }
    const p = PBY[cell.p]; if (!p) continue;
    if (mode === 'water' && !p.fung) { const w = wat.cells[k]; c.fillStyle = waterColor(w); c.fillRect(px + 1, py + 1, cs - 2, cs - 2); c.font = (cs * .46) + 'px serif'; c.globalAlpha = .9; c.fillText(p.e, px + cs / 2, py + cs / 2 - 2); c.globalAlpha = 1; if (w && w.due) { c.font = 'bold ' + (cs * .26) + 'px Lora,serif'; c.fillStyle = '#fff'; c.fillText(w.lvl === 3 ? '💧💧' : '💧', px + cs / 2, py + cs - cs * .16); } continue; }
    c.globalAlpha = cell.s === 'grow' ? 1 : .62; c.fillStyle = CATCOL[p.cat] || '#2f6b3a'; c.fillRect(px + 1, py + 1, cs - 2, cs - 2); c.globalAlpha = 1;
    c.font = (cs * .6) + 'px serif'; c.fillText(p.e, px + cs / 2 + (showBase ? cs * .1 : 0), py + cs / 2 + 1 + (showBase ? cs * .06 : 0));
    if (cell.s !== 'grow') { c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([3, 3]); c.lineWidth = 1.5; c.strokeRect(px + 3, py + 3, cs - 6, cs - 6); c.setLineDash([]); }
    if (p.fung && cell.s === 'grow') { const sg = fungiStage(FBY[cell.p], cell).s; c.strokeStyle = STAGEC[sg] || '#888'; c.lineWidth = 3; c.strokeRect(px + 1.5, py + 1.5, cs - 3, cs - 3); if (sg === 'dead') { c.font = (cs * .3) + 'px serif'; c.fillText('☣️', px + cs * .72, py + cs * .75); } }
    const st = rep && rep.state[k]; if (st) { c.strokeStyle = st === 'bad' ? '#ff6a5c' : '#7be08a'; c.lineWidth = 3; c.strokeRect(px + 1.5, py + 1.5, cs - 3, cs - 3); }
  }
  if (showBase) { c.font = (cs * .36) + 'px serif'; c.textAlign = 'center'; Object.keys(base.cells).forEach(k => { const cl = base.cells[k]; if (isSp(cl.p)) return; const bp = PBY[cl.p]; if (!bp) return; const a = k.split(','); c.globalAlpha = .9; c.fillText(bp.e, a[0] * cs + cs * .24, a[1] * cs + cs * .27); c.globalAlpha = 1; }); }
  fo.forEach(o => Object.keys(o.cells).forEach(k => { const cl = o.cells[k]; if (isSp(cl.p)) return; const fp = PBY[cl.p]; if (!fp) return; const a = k.split(','), cx = a[0] * cs + cs * .74, cy = a[1] * cs + cs * .74; c.beginPath(); c.arc(cx, cy, cs * .24, 0, 7); c.fillStyle = 'rgba(176,69,127,.55)'; c.fill(); c.strokeStyle = '#ff9ad0'; c.lineWidth = 1.5; c.stroke(); c.font = (cs * .36) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(fp.e, cx, cy + 1); }));
  if (mode === 'gopher' && window.drawGopherLayer) window.drawGopherLayer(c, g, cs);
  if (opt.rect) { const r = opt.rect, x0 = Math.min(r.x0, r.x1), x1 = Math.max(r.x0, r.x1), y0 = Math.min(r.y0, r.y1), y1 = Math.max(r.y0, r.y1); c.fillStyle = 'rgba(217,180,90,.25)'; c.fillRect(x0 * cs, y0 * cs, (x1 - x0 + 1) * cs, (y1 - y0 + 1) * cs); c.strokeStyle = '#d9b45a'; c.lineWidth = 2; c.strokeRect(x0 * cs + 1, y0 * cs + 1, (x1 - x0 + 1) * cs - 2, (y1 - y0 + 1) * cs - 2); }
  if (opt.sel) { c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeRect(opt.sel[0] * cs + 1.5, opt.sel[1] * cs + 1.5, cs - 3, cs - 3); }
  c.font = 'bold 11px Lora,serif'; c.fillStyle = 'rgba(255,255,255,.7)'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('N ↑', 4, 3);
}
function mountCanvas(id, g, mode, handlers) {
  const cv = $('#' + id); if (!cv) return null; const wrap = cv.parentNode; cv._cs = cellSize(g, wrap.clientWidth || 340);
  cv.addEventListener('pointerdown', e => { if (handlers.down) { cv.setPointerCapture(e.pointerId); handlers.down(cellFrom(e, cv, g), e); } });
  cv.addEventListener('pointermove', e => { if (handlers.move && e.buttons) handlers.move(cellFrom(e, cv, g), e); });
  cv.addEventListener('pointerup', e => { if (handlers.up) handlers.up(cellFrom(e, cv, g), e); });
  cv.addEventListener('pointercancel', e => { if (handlers.up) handlers.up(null, e); });
  drawMap(cv, g, mode); return cv;
}
function cellFrom(e, cv, g) { const r = cv.getBoundingClientRect(), cs = cv._cs; const x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs); return (x < 0 || y < 0 || x >= g.w || y >= g.h) ? null : { x, y, k: x + ',' + y }; }

/* ---------- editing ---------- */
function placeCell(g, k) {
  if (isSp(UI.brush)) { g.cells[k] = { p: UI.brush }; return; }
  g.cells[k] = { p: UI.brush, s: UI.status, d: UI.status === 'grow' ? dkey() : null };
}
let stroke = null;
function mapHandlers(g) {
  const cv = () => $('#gc'); const redraw = (o) => drawMap(cv(), g, gk(g) === 'fungi' ? 'plants' : UI.layer, Object.assign({ sel: UI.sel }, o || {}));
  const apply = c => { if (!c) return; const t = UI.tool; if (t === 'paint') { const cur = g.cells[c.k]; if (!cur || cur.p !== UI.brush || cur.s !== UI.status) { placeCell(g, c.k); stroke.changed = true; stroke.last = c; } } else if (t === 'erase') { if (g.cells[c.k]) { delete g.cells[c.k]; stroke.changed = true; } } else if (t === 'water') { if (g.cells[c.k] && !isSp(g.cells[c.k].p)) { S.watered[g.id + ':' + c.k] = dkey(); stroke.changed = true; } } };
  return {
    down: (c, e) => { stroke = { changed: false, start: c, last: null, moved: false }; if (!c) return; if (UI.tool === 'rect') { stroke.rect = { x0: c.x, y0: c.y, x1: c.x, y1: c.y }; redraw({ rect: stroke.rect }); } else if (UI.tool !== 'look') { apply(c); redraw(); } },
    move: (c, e) => { if (!stroke || !c) return; stroke.moved = true; if (UI.tool === 'rect' && stroke.rect) { stroke.rect.x1 = c.x; stroke.rect.y1 = c.y; redraw({ rect: stroke.rect }); } else if (UI.tool !== 'look') { apply(c); redraw(); } },
    up: (c, e) => {
      if (!stroke) return; const s = stroke; stroke = null; if (!c && !s.rect) return;
      if (UI.tool === 'look') { if (c && s.start && c.k === s.start.k) { UI.sel = [c.x, c.y]; redraw(); tileSheet(g, c.x, c.y); } return; }
      if (UI.tool === 'rect' && s.rect) { const r = s.rect; for (let y = Math.min(r.y0, r.y1); y <= Math.max(r.y0, r.y1); y++) for (let x = Math.min(r.x0, r.x1); x <= Math.max(r.x0, r.x1); x++) placeCell(g, x + ',' + y); s.changed = true; s.last = { x: r.x1, y: r.y1 }; }
      if (s.changed) { save(); redraw(); refreshReport(g); if (UI.tool === 'paint' || UI.tool === 'rect') placeFeedback(g, s.last); if (UI.tool === 'water') toast('Marked watered today'); }
    }
  };
}
function placeFeedback(g, c) {
  if (!c || isSp(UI.brush)) return; if (PBY[UI.brush].fung) { toast(pName(UI.brush) + ' placed. ' + roomFit(FBY[UI.brush], roomOf(g)).msg, 4200); return; } const f = fitHere(g, c.x, c.y, UI.brush), nm = pName(UI.brush);
  if (f.bad.length) toast('Careful: ' + nm + ' and ' + pName(f.bad[0].p) + ' do not mix. ' + f.bad[0].why, 5200);
  else if (f.good.length) toast('Nice: ' + nm + ' likes ' + pName(f.good[0].p) + '. ' + f.good[0].why, 4200);
  else { const p = PBY[UI.brush]; const w = plantWindow(p); toast(nm + ' placed. ' + (w ? w.text : ''), 3200); }
}

/* ---------- reports ---------- */
function gardenCounts(g) {
  const m = {}; Object.keys(g.cells).forEach(k => { const c = g.cells[k]; if (isSp(c.p)) return; const o = m[c.p] = m[c.p] || { id: c.p, tiles: 0, grow: 0 }; o.tiles++; if (c.s === 'grow') o.grow++; });
  return Object.values(m).map(o => { const p = PBY[o.id]; o.n = plantsPerTile(p, g.ft) * o.tiles; return o; }).sort((a, b) => b.tiles - a.tiles);
}
function reportHTML(g) {
  const cnt = gardenCounts(g), tiles = Object.keys(g.cells).length; if (!tiles) return '<p class="dim">Pick a plant below, switch to Paint, and drag across the tiles to lay out your garden. Hortica will tell you who likes who.</p>';
  const rep = companionReport(g), good = rep.pairs.filter(p => p.kind === 'good'), bad = rep.pairs.filter(p => p.kind === 'bad');
  const sq = tiles * g.ft * g.ft, planted = cnt.reduce((a, o) => a + o.grow, 0), tot = cnt.reduce((a, o) => a + o.tiles, 0);
  let h = '<div class="sum"><div><b>' + Math.round(Object.keys(g.cells).filter(k => !isSp(g.cells[k].p)).length * g.ft * g.ft) + '</b><span>sq ft planted</span></div><div><b>' + cnt.length + '</b><span>kinds</span></div><div><b>' + planted + '/' + tot + '</b><span>tiles in ground</span></div></div>';
  h += '<div class="rg">' + cnt.map(o => { const p = PBY[o.id]; return '<button class="rgi" data-act="plantInfo" data-v="' + o.id + '"><span>' + p.e + '</span><b>' + esc(p.n) + '</b><i>' + fmtN(o.n) + (o.n < 1.5 ? ' plant' : ' plants') + '</i></button>'; }).join('') + '</div>';
  if (gk(g) === 'herb') h += herbExtras(g, cnt, rep);
  if (gk(g) === 'flower') h += flowerExtras(g, cnt, rep);
  if (LAND_KINDS[gk(g)]) h += landExtras(g, cnt, rep);
  if (gk(g) !== 'herb' && rep.thirst && rep.thirst.length) h += rep.thirst.map(t => '<div class="flag space"><b>💧 ' + PBY[t.a].e + ' ' + esc(pName(t.a)) + ' &amp; ' + PBY[t.b].e + ' ' + esc(pName(t.b)) + '</b> <span class="tag">different thirst</span><br><span class="sm">' + esc(pName(t.dry)) + ' likes it drier than ' + esc(pName(t.wet)) + '. Water will fail one of them. Plant them a few tiles apart, or give the thirsty one its own spot.</span></div>').join('');
  h += '<h3 class="h3">Neighbors</h3>';
  if (bad.length) h += bad.map(p => '<div class="flag ask"><b>' + PBY[p.a].e + ' ' + esc(pName(p.a)) + ' &amp; ' + PBY[p.b].e + ' ' + esc(pName(p.b)) + '</b> <span class="tag">keep apart</span><br><span class="sm">' + esc(p.why) + '</span></div>').join('');
  else if (tiles > 1) h += '<p class="ok sm">No conflicts found between plants that sit near each other.</p>';
  h += good.length ? '<details' + (bad.length ? '' : ' open') + '><summary>' + good.length + ' happy pairing' + (good.length > 1 ? 's' : '') + '</summary>' + good.map(p => '<div class="flag"><b>' + PBY[p.a].e + ' ' + esc(pName(p.a)) + ' + ' + PBY[p.b].e + ' ' + esc(pName(p.b)) + '</b><br><span class="sm">' + esc(p.why) + '</span></div>').join('') + '</details>' : '<p class="dim sm">No known helpful pairings yet. Look at a plant\'s page for its best friends.</p>';
  if (rep.shade.length) h += '<details><summary>Shade warnings (' + rep.shade.length + ')</summary>' + rep.shade.map(s => '<div class="flag space"><b>' + esc(pName(s.tall)) + ' shades ' + esc(pName(s.low)) + '</b><br><span class="sm">Tall plants cast shadow to their north (top of the map). Move the sun lover, or swap places with the tall one.</span></div>').join('') + '</details>';
  h += helperFlowers(g);
  return h;
}
const RUNNERS = ['mint', 'peppermint', 'spearmint', 'catnip', 'lemonbalm', 'horseradish', 'nettle', 'selfheal', 'comfrey', 'licorice', 'beebalm', 'sweetwoodruff', 'lemongrass'].filter(x => true);
function herbExtras(g, cnt, rep) {
  let h = ''; const tags = {}; cnt.forEach(o => { const i = HERB_INFO[o.id]; if (i) i.tags.forEach(t => { tags[t] = (tags[t] || 0) + 1; }); });
  const tk = Object.keys(tags); if (tk.length) h += '<div class="chips c">' + tk.map(t => '<span class="chip">' + (HERB_TAGS[t] || t) + ' ' + tags[t] + '</span>').join('') + '</div>';
  const run = cnt.filter(o => RUNNERS.indexOf(o.id) >= 0 && o.id !== 'lemongrass'); if (run.length) h += '<div class="flag space"><b>🏃 Runners: ' + run.map(o => esc(pName(o.id))).join(', ') + '</b><br><span class="sm">These spread by underground runners and will take over a bed. Sink them in a bottomless pot or a bucket with the bottom cut out, or give them their own corner.</span></div>';
  const tender = cnt.filter(o => ['basil', 'thaibasil', 'tulsi', 'perilla', 'lemongrass', 'stevia', 'turmeric', 'ginger', 'galangal', 'aloe', 'curryleaf', 'lemonverbena', 'hibiscus', 'scentedgeranium', 'pineapplesage', 'cinnamonbasil'].indexOf(o.id) >= 0 || (o.id === 'rosemary' && zoneNum() && zoneNum() < 7));
  if (tender.length) h += '<div class="flag"><b>🥶 Frost-tender: ' + tender.map(o => esc(pName(o.id))).join(', ') + '</b><br><span class="sm">Bring these in or cover them before the first frost (' + fmtD(frostDates().first) + ').</span></div>';
  if (rep.thirst && rep.thirst.length) h += rep.thirst.map(t => '<div class="flag space"><b>💧 ' + PBY[t.a].e + ' ' + esc(pName(t.a)) + ' &amp; ' + PBY[t.b].e + ' ' + esc(pName(t.b)) + '</b> <span class="tag">different thirst</span><br><span class="sm">' + esc(pName(t.dry)) + ' likes it dry and gritty; ' + esc(pName(t.wet)) + ' likes steady moisture. Water will fail one of them. Plant them a few tiles apart, or put the dry one on a mound or in a pot.</span></div>').join('');
  return h;
}
function refreshReport(g) { const el = $('#grep'); if (el) el.innerHTML = gk(g) === 'fungi' ? fungiReport(g) : reportHTML(g); }

/* ---------- the Garden tab ---------- */
function brushName() { return isSp(UI.brush) ? SPECIAL[UI.brush][0] : pName(UI.brush); }
function brushEmoji() { return isSp(UI.brush) ? (SPECIAL[UI.brush][2] || '▫️') : PBY[UI.brush].e; }
const KINDS = { veg: ['🌱', 'Farm and garden'], herb: ['🌿', 'Herb garden'], flower: ['🌸', 'Flower garden'], fungi: ['🍄', 'Grow space'], shrub: ['🌳', 'Shrub map'], succ: ['🌵', 'Succulent garden'] };
const SPK = { veg: ['_path', '_water', '_compost', '_struct', '_rock', '_bed'], herb: ['_path', '_water', '_compost', '_struct', '_rock', '_bed'], flower: ['_path', '_water', '_compost', '_rock', '_bed'], fungi: ['_shelf', '_humid', '_tent', '_path', '_water', '_struct'] };
SPK.shrub = ['_path', '_water', '_compost', '_struct', '_rock', '_bed']; SPK.succ = ['_path', '_water', '_struct', '_rock', '_bed'];
function brushOk(id) { const k = curKind(); if (isSp(id)) return (SPK[k] || SPK.veg).indexOf(id) >= 0; const p = PBY[id]; if (!p) return false; if (k === 'fungi') return !!p.fung; if (p.fung) return false; if (k === 'flower') return !!p.flw; if (LAND_KINDS[k]) return p.lk === k; if (p.lk) return false; if (p.fx) return false; return k === 'herb' ? true : !p.hx; }
function ensureBrush() { if (!brushOk(UI.brush)) { const k = curKind(); UI.brush = k === 'fungi' ? 'oyster' : k === 'herb' ? 'basil' : k === 'flower' ? 'zinnia' : LAND_KINDS[k] ? landDefault(k) : 'tomato'; } }
const HPRESETS = [['pots', 'Kitchen herb pots or window box (4 × 2 ft)', 4, 2, 1], ['bed', 'Herb bed (8 × 4 ft)', 8, 4, 1], ['border', 'Herb border or spiral (10 × 6 ft)', 10, 6, 1], ['med', 'Tea and medicinal garden (16 × 12 ft)', 16, 12, 2]];
function kindBar() {
  return '<div class="seg small kinds five">' + [['veg', '🥕 Garden'], ['herb', '🌿 Herbs'], ['flower', '🌸 Flowers']].concat(LAND_ORDER.map(k => [k, LAND_KINDS[k].e + ' ' + LAND_KINDS[k].n])).map(a => '<button class="' + (UI.gk === a[0] ? 'on' : '') + '" data-act="gkind" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
}
function gardenTab() {
  const k = curKind(), g = G(); const m = moonInfo(); ensureBrush();
  if (!g) {
    if (k === 'herb') return kindBar() + '<section class="card"><div class="ct"><span>🌿 Build your herb garden</span></div><p class="sm">Spices, seasonings, teas and traditional medicinal herbs, laid out tile by tile just like the main garden. Its planting dates, watering and feeding join your Plan tab as their own layer.</p>' + HPRESETS.map(p => '<button class="btn block" data-act="hMake" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</section>';
    if (k === 'flower') return kindBar() + flowerStart();
    if (LAND_KINDS[k]) return kindBar() + landStart(k);
    return kindBar() + '<section class="card"><p>No garden yet.</p><button class="btn gold block" data-act="gardenNew">Make a garden</button></section>';
  }
  const list = gardensOf(k), fung = k === 'fungi';
  const gsel = list.length > 1 ? '<select class="in gs" data-chg="gardenPick">' + list.map(x => '<option value="' + x.id + '"' + (x.id === g.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' : '';
  const sp = SPK[k].map(a => '<button class="chip' + (UI.brush === a ? ' on' : '') + '" data-act="brush" data-v="' + a + '">' + (SPECIAL[a][2] || '◼') + ' ' + SPECIAL[a][0] + '</button>').join('');
  const recent = UI.recent.filter(id => PBY[id] && brushOk(id)).map(id => '<button class="chip' + (UI.brush === id ? ' on' : '') + '" data-act="brush" data-v="' + id + '">' + PBY[id].e + ' ' + esc(PBY[id].n) + '</button>').join('');
  const word = fung ? 'mushroom' : k === 'flower' ? 'flower' : 'plant';
  return (k === 'fungi' ? '' : kindBar()) + '<section class="card gmap"><div class="ct"><span>' + KINDS[k][0] + ' ' + esc(g.name) + ' <span class="tag">' + g.w + '×' + g.h + ' tiles · ' + g.ft + ' ft each · ' + Math.round(g.w * g.h * g.ft * g.ft) + ' sq ft</span></span><a class="lnk" data-act="gardenSet">Edit</a></div>' + gsel +
    '<div class="seg small five">' + TOOLS.filter(t => !(fung && t[0] === 'water')).map(t => '<button class="' + (UI.tool === t[0] ? 'on' : '') + '" data-act="tool" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div class="brush"><button class="bbtn" data-act="picker"><span class="be">' + brushEmoji() + '</span><span><b>' + esc(brushName()) + '</b><br><small>Tap to choose a ' + word + '</small></span></button>' +
    (isSp(UI.brush) ? '' : '<div class="seg small st"><button class="' + (UI.status === 'plan' ? 'on' : '') + '" data-act="status" data-v="plan">Planned</button><button class="' + (UI.status === 'grow' ? 'on' : '') + '" data-act="status" data-v="grow">' + (fung ? 'Inoculated' : 'Planted') + '</button></div>') + '</div>' +
    '<div class="chips nowrap">' + recent + '<span class="vr"></span>' + sp + '</div><p class="sm dim hint">' + toolHint() + '</p>' +
    '<div class="mapwrap2" id="mw"><canvas id="gc" style="touch-action:' + (UI.tool === 'look' ? 'pan-x pan-y pinch-zoom' : 'none') + '"></canvas></div>' +
    (fung ? '' : '<div class="seg small"><button class="' + (UI.layer === 'plants' ? 'on' : '') + '" data-act="layer" data-v="plants">' + (k === 'herb' ? '🌿 Herbs and neighbors' : k === 'flower' ? '🌸 Flowers and neighbors' : '🌿 Plants and neighbors') + '</button><button class="' + (UI.layer === 'water' ? 'on' : '') + '" data-act="layer" data-v="water">💧 Water map</button></div>') +
    (fung ? '' : UI.layer === 'plants' ? '<div class="legend"><span><i style="border:2px solid #7be08a"></i>likes neighbors</span><span><i style="border:2px solid #ff6a5c"></i>conflict</span><span><i style="border:1.5px dashed #ccc"></i>planned</span><span>solid = in the ground</span></div>' : waterLegend()) + (fung ? '' : overlayBar(g)) + auditBar(g) + '</section>' +
    '<section class="card" id="grep">' + (fung ? fungiReport(g) : reportHTML(g)) + '</section>';
}
function mountGarden() { const g = G(); if (!g) return; mountCanvas('gc', g, gk(g) === 'fungi' ? 'plants' : UI.layer, mapHandlers(g)); }
ACT.tool = el => { UI.tool = el.dataset.v; render(); };
ACT.layer = el => { UI.layer = el.dataset.v; if (UI.layer === 'water') refreshWx().then(() => { if (UI.tab === 'garden') { const cv = $('#gc'); if (cv) drawMap(cv, G(), UI.layer, { sel: UI.sel }); const l = $('.wleg'); if (l) l.outerHTML = waterLegend(); } }); render(); };
ACT.status = el => { UI.status = el.dataset.v; render(); };
ACT.brush = el => { UI.brush = el.dataset.v; if (!isSp(UI.brush)) pushRecent(UI.brush); if (UI.tool === 'look' || UI.tool === 'erase' || UI.tool === 'water') UI.tool = 'paint'; render(); };
CHG.gardenPick = el => { const g = S.gardens.find(x => x.id === el.value); if (g) setCur(g); UI.sel = null; save(); render(); };
ACT.gkind = el => { UI.gk = el.dataset.v; UI.sel = null; UI.layer = 'plants'; ensureBrush(); render(); };
ACT.hMake = el => { const p = HPRESETS.find(x => x[0] === el.dataset.v), g = newGarden(p[1].split(' (')[0], p[2], p[3], p[4]); g.kind = 'herb'; S.gardens.push(g); setCur(g); UI.gk = 'herb'; UI.brush = 'basil'; UI.status = 'plan'; save(); render(); toast('Herb garden ready. Pick an herb and paint it on.', 3500); };
function pushRecent(id) { UI.recent = [id].concat(UI.recent.filter(x => x !== id)).slice(0, 8); }

/* ---------- plant picker ---------- */
function pickPool() { const k = curKind(); if (k === 'fungi') return FUNGI.map(x => PBY[x.id]); if (k === 'flower') return PLANTS.filter(p => p.flw); if (k === 'herb') return UI.pcat === 'any' ? PLANTS : PLANTS.filter(p => p.herb || p.cat === 'h'); if (LAND_KINDS[k]) return PLANTS.filter(p => p.lk === k); return PLANTS.filter(p => !p.hx && !p.lk); }
function pickerList() {
  const k = curKind(), q = UI.pq.trim().toLowerCase(), pc = UI.pcat; let L = pickPool();
  L = L.filter(p => { if (pc !== 'all' && pc !== 'any' && pc !== 'now') { if (k === 'fungi') { const f = FBY[p.id]; if (pc === 'easy' && f.diff > 2) return false; if (pc === 'out' && f.where === 'in') return false; if (pc === 'in' && f.where === 'out') return false; } else if (k === 'herb') { const i = HERB_INFO[p.id]; if (!i || i.tags.indexOf(pc) < 0) return false; } else if (k === 'flower') { const i = FLOWER_INFO[p.id]; if (!i || i.tags.indexOf(pc) < 0) return false; } else if (LAND_KINDS[k]) { const i = LAND_INFO[p.id]; if (!i || i.tags.indexOf(pc) < 0) return false; } else if (p.cat !== pc) return false; }
    if (pc === 'now') { const w = plantWindow(p); if (!w || w.state !== 'now') return false; }
    if (!q) return true; const i = HERB_INFO[p.id], f = FBY[p.id], fi = FLOWER_INFO[p.id]; return (landText(LAND_INFO[p.id]) + ' ' + p.n + ' ' + p.vars + ' ' + CATS[p.cat] + ' ' + p.fam + (i ? ' ' + i.uses + ' ' + i.parts : '') + (f ? ' ' + f.use + ' ' + f.sub : '') + (fi ? ' ' + fi.uses + ' ' + fi.role + ' ' + fi.colors + ' ' + fi.bloom + ' ' + fi.tags.map(t => FLOWER_TAGS[t] || '').join(' ') : '')).toLowerCase().indexOf(q) >= 0; });
  return L.map(p => {
    if (p.fung) { const f = FBY[p.id], fit = roomFit(f, roomOf(G())); return '<button class="prow" data-act="pickPlant" data-v="' + p.id + '"><span class="pe">' + p.e + '</span><span class="pt"><b>' + esc(p.n) + '</b> <small>' + '★'.repeat(f.diff) + '☆'.repeat(5 - f.diff) + ' · ' + esc(f.use) + '</small><br><small class="' + (fit.ok === true ? 'wnow' : 'wsoon') + '">' + esc(fit.msg) + '</small></span></button>'; }
    const w = plantWindow(p), z = zoneOk(p), fs = fitSummary(G(), p.id), fi = FLOWER_INFO[p.id]; return '<button class="prow" data-act="pickPlant" data-v="' + p.id + '"><span class="pe">' + p.e + '</span><span class="pt"><b>' + esc(p.n) + '</b> <small>' + (fi && k === 'flower' ? 'Blooms ' + esc(fi.bloom.split(',')[0]) + ' · ' : LAND_INFO[p.id] ? esc(LAND_INFO[p.id].role.split(',')[0]) + ' · ' + esc(LAND_INFO[p.id].bloom) + ' · ' : CATS[p.cat] + ' · ') + SUNN[p.sun].toLowerCase() + ' · ' + p.sp + ' in apart</small><br><small class="' + (w ? 'w' + w.state : '') + '">' + (z ? '' : '⚠ Not hardy in your zone. ') + (w ? esc(w.text) : '') + '</small>' + (fs.bad.length ? '<br><small class="warn">⚠ Does not mix with ' + fs.bad.slice(0, 3).map(pName).join(', ') + '</small>' : '') + (fs.good.length ? '<br><small class="ok">✓ Works with ' + fs.good.slice(0, 3).map(pName).join(', ') + '</small>' : '') + '</span></button>'; }).join('') || '<p class="dim pad">Nothing matches. Try a shorter word.</p>';
}
ACT.picker = () => {
  UI.pq = ''; UI.pcat = 'all'; const k = curKind();
  openSheet(k === 'fungi' ? 'Choose a mushroom' : k === 'herb' ? 'Choose an herb' : k === 'flower' ? 'Choose a flower' : LAND_KINDS[k] ? 'Choose ' + LAND_KINDS[k].a : 'Choose a plant', '<input class="in" id="pq" data-inp="pq" placeholder="' + (k === 'fungi' ? 'Search: oyster, shiitake, log, beginner...' : k === 'flower' ? 'Search: bees, red, cut flower, gopher, tea...' : k === 'herb' ? 'Search: basil, sleep, cough, curry, tea...' : LAND_KINDS[k] ? LAND_KINDS[k].q : 'Search: tomato, apple, basil, shade, root...') + '" value="" autocomplete="off"><div class="chips nowrap" id="pcats">' + pcatChips() + '</div><div id="plist">' + pickerList() + '</div>');
};
function pcatChips() {
  const k = curKind(); let arr;
  if (k === 'fungi') arr = [['all', 'All'], ['easy', 'Beginner'], ['in', 'Indoor'], ['out', 'Outdoor']];
  else if (k === 'flower') arr = [['all', 'All flowers'], ['now', '🌱 Plant now'], ['b', '🌸 Beauty'], ['c', '✂️ Cut'], ['o', '🐝 Pollinators'], ['p', '🐛 Pest helpers'], ['g', '🛡 Gopher-proof'], ['m', '⚕️ Medicinal'], ['e', '🍽 Edible'], ['f', '🪻 Fragrant'], ['h', '🐦 Hummingbirds']];
  else if (LAND_KINDS[k]) arr = [['all', 'All'], ['now', '🌱 Plant now']].concat(LAND_PICK[k].map(t => [t, LAND_TAGS[k][t]]));
  else if (k === 'herb') arr = [['all', 'All herbs'], ['now', '🌱 Plant now'], ['cul', '🍳 Culinary'], ['spice', '🌶 Spice'], ['tea', '🍵 Tea'], ['med', '⚕️ Medicinal'], ['aro', '🌸 Aromatic'], ['any', 'Any plant']];
  else arr = [['all', 'All'], ['now', '🌱 Plant now']].concat(CAT_NAMES.filter(a => a[0] !== 'su'));
  return arr.map(a => '<button class="chip' + (UI.pcat === a[0] ? ' on' : '') + '" data-act="pcat" data-v="' + a[0] + '">' + a[1] + '</button>').join('');
}
CHG.pq = el => { UI.pq = el.value; $('#plist').innerHTML = pickerList(); };
ACT.pcat = el => { UI.pcat = el.dataset.v; $('#pcats').innerHTML = pcatChips(); $('#plist').innerHTML = pickerList(); };
ACT.pickPlant = el => {
  const id = el.dataset.v;
  if (UI.replace) { const g = G(), k = UI.replace; UI.replace = null; const old = g.cells[k] || {}; g.cells[k] = { p: id, s: old.s || 'plan', d: old.d || null }; save(); closeSheet(); toast(pName(id) + ' set.'); return; }
  UI.brush = id; pushRecent(id); if (UI.tool === 'look' || UI.tool === 'erase' || UI.tool === 'water') UI.tool = 'paint'; closeSheet(); const p = PBY[id], w = plantWindow(p); toast(p.n + ' is your brush. ' + (p.fung ? roomFit(FBY[id], roomOf(G())).msg : w ? w.text : ''), 3500);
};

function friendsOf(id, limit) {
  const out = []; companionsOf(id).good.forEach(c => { const t = c.t; let ids = t.charAt(0) === '@' ? PLANTS.filter(p => p.fam === t.slice(1)).map(p => p.id).slice(0, 3) : t.charAt(0) === '%' ? GROUPS[t.slice(1)] : [t]; ids.forEach(x => { if (x !== id && PBY[x] && out.indexOf(x) < 0) out.push(x); }); });
  out.sort((a, b) => (((plantWindow(PBY[b]) || {}).state === 'now') ? 1 : 0) - (((plantWindow(PBY[a]) || {}).state === 'now') ? 1 : 0)); return out.slice(0, limit || 8);
}
function toolHint() { return ({ look: 'Tap a tile for details. You can scroll the page past the map in this mode.', paint: 'Drag across the map to paint tiles. Switch to Look to scroll past the map.', rect: 'Drag a box to fill many tiles at once.', erase: 'Drag to erase tiles.', water: 'Tap or drag over planted tiles to mark them watered today.' })[UI.tool]; }
/* ---------- tile sheet ---------- */
function tileSheet(g, x, y) {
  const k = x + ',' + y, c = g.cells[k];
  if (!c) { const bc = baseOf(g) && baseOf(g).cells[k]; openSheet('Empty tile', '<p class="dim">Nothing here yet. Tile ' + (x + 1) + ', ' + (y + 1) + ' (' + g.ft + ' ft square).</p>' + (bc && !isSp(bc.p) ? '<div class="flag"><b>Underneath: ' + PBY[bc.p].e + ' ' + esc(pName(bc.p)) + '</b><br><span class="sm">Flowers planted here share this tile with it. Hortica checks how they get along.</span></div>' : '') + '<button class="btn gold block" data-act="tileFill" data-k="' + k + '">Plant ' + esc(brushName()) + ' here</button><button class="btn block" data-act="picker">Choose another plant</button>'); return; }
  if (isSp(c.p)) { openSheet(SPECIAL[c.p][0], '<p class="dim">A ' + SPECIAL[c.p][0].toLowerCase() + ' tile.</p><button class="btn danger block" data-act="tileClear" data-k="' + k + '">Clear this tile</button>'); return; }
  if (PBY[c.p] && PBY[c.p].fung) { fungiTileSheet(g, x, y); return; }
  const p = PBY[c.p], f = fitHere(g, x, y, c.p), ws = waterStatus(g).cells[k], pl = c.d ? pd(c.d) : null, dates = plantDates(p);
  let h = '<div class="tilehd"><span class="be">' + p.e + '</span><div><h2 class="big">' + esc(p.n) + '</h2><span class="dim sm">' + (c.s === 'grow' ? 'In the ground' + (pl ? ' since ' + fmtDY(pl) : '') : 'Planned') + ' · tile ' + (x + 1) + ', ' + (y + 1) + '</span></div></div>';
  if (pl && !permLike(p)) { const hs = addD(pl, p.days), he = addD(hs, p.hw * 7), dd = dayDiff(hs, NOW()); h += '<div class="flag"><b>' + hlab(p) + '</b><br>' + (dd > 0 ? (hlab(p) === 'Bloom' ? 'Blooms around ' : 'Ready around ') + fmtDY(hs) + ' (' + dd + ' days)' : 'Harvest window open since ' + fmtD(hs)) + ', lasting about ' + p.hw + ' weeks.</div>'; }
  else if (!pl && dates.steps.length) h += '<div class="flag"><b>Timing</b><br>' + dates.steps.slice(0, 3).map(s => esc(s.label + ': ' + fmtD(s.date))).join('<br>') + '</div>';
  if (HERB_INFO[p.id]) h += '<div class="flag"><b>Use</b><br><span class="sm">' + esc(HERB_INFO[p.id].parts) + '. ' + esc(HERB_INFO[p.id].uses) + '</span></div>';
  h += flowerBlock(p, true);
  { const bc = baseOf(g) && baseOf(g).cells[k]; if (bc && !isSp(bc.p)) h += '<div class="flag"><b>Underneath: ' + PBY[bc.p].e + ' ' + esc(pName(bc.p)) + '</b><br><span class="sm">Same tile, so they are close neighbors.</span></div>'; }
  h += c.s === 'grow' ? (pl && !permLike(p) && dayDiff(addD(pl, p.days), NOW()) <= 10 ? timingBlock(p, 'harv', 2) : '') : timingBlock(p, 'sow', 2);
  if (ws && c.s === 'grow') h += '<div class="flag space"><b>Water</b><br>' + esc(ws.text) + '</div>';
  f.bad.forEach(b => h += '<div class="flag ask"><b>Conflict: ' + esc(pName(b.p)) + ' nearby</b><br><span class="sm">' + esc(b.why) + '</span></div>');
  f.good.forEach(b => h += '<div class="flag"><b>Likes ' + esc(pName(b.p)) + ' nearby</b><br><span class="sm">' + esc(b.why) + '</span></div>');
  const fr = friendsOf(p.id, 8); if (fr.length) h += '<h3 class="h3">Good neighbors to plant next to it</h3><div class="chips c">' + fr.map(x => '<button class="chip" data-act="useBrush" data-v="' + x + '">' + PBY[x].e + ' ' + esc(PBY[x].n) + '</button>').join('') + '</div>';
  h += '<div class="row wrap">' + (c.s === 'grow' ? '<button class="btn" data-act="tileWater" data-k="' + k + '">💧 Watered today</button>' : '<button class="btn gold" data-act="tileGrow" data-k="' + k + '">🌱 Mark planted today</button>') + '<button class="btn" data-act="tileSame" data-k="' + k + '">' + (c.s === 'grow' ? 'Back to planned' : 'Keep planned') + '</button></div>';
  h += '<div class="row wrap"><button class="btn" data-act="hvOpen" data-v="' + p.id + '">🧺 Log harvest</button><button class="btn" data-act="flOpen" data-v="' + p.id + '">💀 It failed</button></div>' + tilePhotos(g, k, p.id) + hist2(g, k);
  h += '<div class="row wrap"><button class="btn" data-act="plantInfo" data-v="' + p.id + '">About ' + esc(p.n) + '</button><button class="btn" data-act="tileReplace" data-k="' + k + '">Swap plant</button></div><button class="btn danger block" data-act="tileClear" data-k="' + k + '">Remove from map</button>';
  openSheet(p.n, h);
}
ACT.tileFill = el => { const g = G(); placeCell(g, el.dataset.k); save(); closeSheet(); };
ACT.tileClear = el => { const g = G(); delete g.cells[el.dataset.k]; save(); UI.sel = null; closeSheet(); };
ACT.tileGrow = el => { const g = G(), c = g.cells[el.dataset.k]; c.s = 'grow'; c.d = dkey(); logIt('Planted ' + pName(c.p)); save(); closeSheet(); toast('Planted. Harvest dates are now counted from today.'); };
ACT.tileSame = el => { const g = G(), c = g.cells[el.dataset.k]; c.s = 'plan'; c.d = null; save(); closeSheet(); };
ACT.tileWater = el => { const g = G(); S.watered[g.id + ':' + el.dataset.k] = dkey(); save(); closeSheet(); toast('Watered.'); };
ACT.tileReplace = el => { UI.replace = el.dataset.k; ACT.picker(); };

/* ---------- garden settings ---------- */
ACT.gardenSet = () => {
  const g = G(); const fts = [1, 2, 3, 5, 10];
  openSheet('Garden settings', '<label class="fl">Name<input class="in" id="gn" value="' + esc(g.name) + '"></label>' + (g.over ? '<p class="sm dim">This flower layer sits on top of ' + esc((baseOf(g) || {}).name || 'another map') + ', so its size and soil follow that map. Change them there.</p>' : '') + '<div class="grid2"><label class="fl">Tiles across<input class="in" id="gw" type="number" min="2" max="60" value="' + g.w + '"' + (g.over ? ' disabled' : '') + '></label><label class="fl">Tiles down<input class="in" id="gh" type="number" min="2" max="60" value="' + g.h + '"' + (g.over ? ' disabled' : '') + '></label></div>' +
    '<label class="fl">Each tile is (feet on a side)<select class="in" id="gf"' + (g.over ? ' disabled' : '') + '>' + fts.map(f => '<option' + (f === g.ft ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></label><p class="dim sm">1 ft suits dense raised-bed planting. 2 to 3 ft suits rows. 5 to 10 ft suits an orchard or small farm. Changing this keeps your tiles but changes the real size.</p>' +
    '<label class="fl">Soil<select class="in" id="gsoil"' + (g.over ? ' disabled' : '') + '>' + Object.keys(SOILS).map(k => '<option value="' + k + '"' + (g.soil === k ? ' selected' : '') + '>' + SOILS[k].n + '</option>').join('') + '</select></label><p class="dim sm" id="soild">' + esc(SOILS[g.soil].d) + '</p>' +
    '<button class="btn gold block" data-act="gardenSave">Save</button><div class="row"><button class="btn" data-act="gardenNew">New garden</button><button class="btn" data-act="gardenDup">Copy this one</button></div>' + (gardensOf(gk(g)).length > 1 || gk(g) !== 'veg' ? '<button class="btn danger block" data-act="gardenDel">Delete this garden</button>' : ''), { mount: sh => { $('#gsoil', sh).onchange = e => { $('#soild', sh).textContent = SOILS[e.target.value].d; }; } });
};
ACT.gardenSave = () => {
  const g = G(), w = clamp(+$('#gw').value || g.w, 2, 60), h = clamp(+$('#gh').value || g.h, 2, 60); let cut = 0;
  Object.keys(g.cells).forEach(k => { const a = k.split(','); if (+a[0] >= w || +a[1] >= h) { delete g.cells[k]; cut++; } });
  g.name = $('#gn').value.trim() || g.name; g.w = w; g.h = h; g.ft = +$('#gf').value; g.soil = $('#gsoil').value; overlaysOf(g).forEach(o => { o.w = g.w; o.h = g.h; o.ft = g.ft; o.soil = g.soil; Object.keys(o.cells).forEach(kk => { const a = kk.split(','); if (+a[0] >= o.w || +a[1] >= o.h) delete o.cells[kk]; }); }); save(); closeSheet(); toast(cut ? 'Saved. ' + cut + ' tiles outside the new size were removed.' : 'Saved.');
};
ACT.gardenNew = () => { if (LAND_KINDS[curKind()]) { openSheet('New map', landStart(curKind())); return; } if (curKind() === 'flower') { openSheet('New flower garden', flowerStart()); return; } const k = curKind(), g = newGarden((k === 'herb' ? 'Herb garden ' : k === 'fungi' ? 'Grow space ' : 'Garden ') + (gardensOf(k).length + 1), k === 'veg' ? 10 : 6, k === 'veg' ? 8 : 4, k === 'veg' ? 2 : 1); if (k !== 'veg') g.kind = k; if (k === 'fungi') g.room = { t: 68, h: 70, where: 'in' }; S.gardens.push(g); setCur(g); save(); closeSheet(); setTab(k === 'fungi' ? 'fungi' : 'garden'); ACT.gardenSet(); };
ACT.gardenDup = () => { const g = G(), n = JSON.parse(JSON.stringify(g)); n.id = uid(); n.name = g.name + ' copy'; S.gardens.push(n); setCur(n); save(); closeSheet(); toast('Copied. Good for planning next year.'); };
ACT.gardenDel = el => { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = 'Tap again to delete for good'; return; } const g = G(), k = gk(g); S.tomb = S.tomb || {}; S.tomb[g.id] = Date.now(); S.gardens = S.gardens.filter(x => x.id !== g.id); S.gardens.forEach(x => { if (x.over === g.id) x.over = null; }); S.curBy[k] = null; if (k === 'veg') S.cur = (GK('veg') || {}).id || null; save(); closeSheet(); };

function hist2(g, k) { const ls = typeof lastSeason === 'function' ? lastSeason(g.id) : null; if (!ls || !ls.cells[k]) return ''; return '<p class="sm dim">Last season (' + ls.y + ') this tile held ' + esc(pName(ls.cells[k])) + '.</p>'; }
