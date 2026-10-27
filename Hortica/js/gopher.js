/* Hortica Gopher War: per-tile mounds, traps, kills, tombstones, danger map, ranks, achievements. Over the top on purpose. */
const RANKS = [[0, 'Gopher Gawker'], [1, 'Mound Watcher'], [3, 'Trap Apprentice'], [5, 'Tunnel Terminator'], [8, 'Burrow Bouncer'], [12, 'Warden of the Weeds'], [18, 'Grim Reaper of the Rows'], [25, 'Burrow Baron'], [35, 'Marshal of the Meadow'], [50, 'Legendary General of the Garden']];
const GFIRST = ['Gus', 'Digby', 'Gordon', 'Reginald', 'Bucky', 'Gerald', 'Mortimer', 'Chuck', 'Barnaby', 'Dolores', 'Mabel', 'Gladys', 'Bertha', 'Winston', 'Cecil', 'Otis', 'Hank', 'Norbert', 'Fergus', 'Beatrice'];
const GLAST = ['the Gouger', 'the Root Reaper', 'the Tuber Thief', 'the Tunneler', 'Lord of the Burrows', 'the Bulb Bandit', 'the Carrot Crook', 'the Undermine', 'the Dirt Devil', 'the Underminer', 'the Rooter', 'of the Dark Tunnels', 'the Unwelcome', 'the Chomp'];
const EPIT = ['{n} dug too deep.', 'Here lies {n}. He came for the carrots and stayed for eternity.', '{n}: gone to the great burrow in the sky.', 'Tunnel vision was {n}\'s downfall.', '{n} will never rise again. Mounds, though... mounds were his thing.', 'RIP {n}. The lettuce sleeps well tonight.', '{n}: he had a hole life ahead of him.', 'Beloved by no one, mourned by no one. {n} was a gopher.', '{n} chose violence against the beets. The beets chose a trap.', 'Rest in the dirt, {n}. Not in mine.', 'Dig in peace, {n}. Elsewhere.', 'In loving memory of {n}\'s appetite.', '{n}: outdug, outwitted, outlasted.', '{n} met the Warden of the Weeds.'];
const FATAL = ['FATALITY!', 'GOPHER DOWN!', 'FLAWLESS VICTORY!', 'TUNNELS CLEARED!', 'ONE LESS HOLE!', 'DIRT NAP!', 'THE MOUND IS QUIET!', 'GOPHER-CIDE!'];
const GLOVE = ['carrot', 'beet', 'potato', 'sweetpot', 'bushbean', 'peas', 'parsnip', 'turnip', 'radish', 'lettuce', 'apple', 'pear', 'peach', 'plum', 'sweetcherry', 'tartcherry', 'apricot', 'fig', 'rose', 'lemon', 'asparagus', 'sunflower', 'corn', 'kohlrabi', 'celery', 'chard', 'persimmon', 'mulberry', 'hazelnut', 'pecan', 'blackwalnut'];
GLOVE.push('tulip', 'lily', 'dahlia', 'gladiolus', 'daylily', 'canna', 'crocus', 'hyacinth');
const GHATE = ['daffodil', 'garlic', 'chives', 'lavender', 'rosemary', 'sage', 'marigold', 'fennel', 'thyme', 'mint'];
const ACHS = [['first', '🩸 First Blood', 'Catch your first gopher.'], ['two', '✌️ Two-Fer', 'Two gophers in one day.'], ['three', '🎩 Hat Trick', 'Three gophers in a week.'], ['five', '🪦 Boot Hill', 'Five tombstones in the graveyard.'], ['ten', '☠️ Decimator', 'Ten gophers dispatched.'], ['mapper', '🗺️ Cartographer', 'Log 10 mounds on the map.'], ['trapper', '🪤 Trapper Keeper', 'Set 5 traps.'], ['fort', '🛡️ Fortress', 'Put guards on 10 tiles.'], ['dynasty', '👑 Dynasty Ended', 'Catch one at a tile with 3 or more mounds.'], ['night', '🌙 Night Shift', 'Log a kill between midnight and 6 a.m.'], ['peace', '🕊️ Pax Hortica', '30 days with no new mound after a kill.']];
const EVI = { mound: '🕳️', trap: '🪤', kill: '🪦', damage: '🥀', guard: '🛡️' };
UI.gtool = 'mound'; UI.gdanger = true;
const GTOOLS = [['look', '👆 Inspect'], ['mound', '🕳️ Mound'], ['trap', '🪤 Trap'], ['kill', '💀 Caught!'], ['damage', '🥀 Damage'], ['guard', '🛡️ Guard'], ['erase', '🧽 Erase']];
function gEv(g) { return S.gopher.ev.filter(e => e.g === g.id); }
function rankOf(k) { let r = RANKS[0], nx = null; for (let i = 0; i < RANKS.length; i++) { if (k >= RANKS[i][0]) { r = RANKS[i]; nx = RANKS[i + 1] || null; } } return { name: r[1], from: r[0], next: nx }; }
/* the map the gophers live on: a flower overlay shares its base map's mounds, traps and kills */
function gG() { const g = G() || GK('veg') || GK('herb'); return g && gk(g) === 'flower' && g.over ? (baseOf(g) || g) : g; }
/* deterrent plants (daffodil, allium, fritillaria...) shrink the danger around them, up to about six feet */
function repelMap(g) {
  const m = {}, rad = Math.max(1, Math.round(6 / g.ft));
  layerItems(g).forEach(it => { const v = GREPEL[it.p]; if (!v) return; for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const x = it.x + dx, y = it.y + dy; if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue; const d = Math.sqrt(dx * dx + dy * dy); if (d > rad + .4) continue; const r = v * (1 - d / (rad + 1.2)), k = x + ',' + y; m[k] = 1 - (1 - (m[k] || 0)) * (1 - r); } });
  Object.keys(m).forEach(k => { m[k] = Math.min(.7, m[k]); }); return m;
}
function repelPlants(g) { const o = {}; layerItems(g).forEach(it => { if (GREPEL[it.p]) o[it.p] = (o[it.p] || 0) + 1; }); return o; }
function dangerMap(g) {
  const m = {}, today = NOW(); gEv(g).forEach(e => { if (e.t !== 'mound' && e.t !== 'damage') return; const age = dayDiff(today, pd(e.d)), w = Math.max(.25, 1 - age / 45) * (e.t === 'damage' ? 1.2 : 1); for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = e.x + dx, y = e.y + dy; if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue; const d = Math.sqrt(dx * dx + dy * dy); if (d > 3.3) continue; m[x + ',' + y] = (m[x + ',' + y] || 0) + w * (1 - d / 3.6); } });
  gEv(g).forEach(e => { if (e.t === 'guard') { const k = e.x + ',' + e.y; if (m[k]) m[k] *= .25; } });
  const rm = repelMap(g); Object.keys(m).forEach(k => { if (rm[k]) m[k] *= (1 - rm[k]); });
  return m;
}
window.drawGopherLayer = function (c, g, cs) {
  const dm = dangerMap(g), rp = repelMap(g); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (UI.gdanger) Object.keys(rp).forEach(k => { const a = k.split(','); c.fillStyle = 'rgba(70,200,110,' + Math.min(.4, rp[k] * .55).toFixed(2) + ')'; c.fillRect(a[0] * cs, a[1] * cs, cs, cs); });
  if (UI.gdanger) Object.keys(dm).forEach(k => { const a = k.split(','), v = Math.min(.65, dm[k] * .38); c.fillStyle = 'rgba(255,40,30,' + v.toFixed(2) + ')'; c.fillRect(a[0] * cs, a[1] * cs, cs, cs); });
  const placed = {};
  gEv(g).forEach(e => { if (e.t === 'trap' && e.st !== 'set') return; const k = e.x + ',' + e.y, n = placed[k] = (placed[k] || 0) + 1; const off = (n - 1) * cs * .22; c.font = (cs * (e.t === 'kill' ? .62 : .5)) + 'px serif'; c.fillText(EVI[e.t], e.x * cs + cs / 2 + off, e.y * cs + cs / 2 + (e.t === 'guard' ? cs * .15 : 0) + 1); if (e.t === 'trap') { c.strokeStyle = '#ffd36a'; c.lineWidth = 2; c.strokeRect(e.x * cs + 3, e.y * cs + 3, cs - 6, cs - 6); } });
};
function gStats() {
  const ev = S.gopher.ev, today = NOW(); const mounds = ev.filter(e => e.t === 'mound'); const wk = (a, b) => mounds.filter(e => { const d = dayDiff(today, pd(e.d)); return d >= a && d < b; }).length;
  const kills = ev.filter(e => e.t === 'kill'), traps = ev.filter(e => e.t === 'trap'); const last = mounds.length ? Math.min.apply(null, mounds.map(e => dayDiff(today, pd(e.d)))) : null;
  return { thisWk: wk(0, 7), lastWk: wk(7, 14), kills, traps, set: traps.filter(e => e.st === 'set').length, caught: traps.filter(e => e.st === 'caught').length, empty: traps.filter(e => e.st === 'empty').length, daysQuiet: last, mounds: mounds.length };
}
function gopherTab() {
  const g = gG(); if (!g) return '<section class="card"><p>Make a garden first, then declare war.</p></section>';
  const G_ = S.gopher, k = G_.kills, r = rankOf(k), st = gStats(), pct = r.next ? Math.round((k - r.from) / (r.next[0] - r.from) * 100) : 100;
  const quiet = st.daysQuiet == null ? 'No mounds logged. Suspiciously peaceful.' : st.daysQuiet === 0 ? 'Fresh mound today. They are out there.' : st.daysQuiet + ' day' + (st.daysQuiet > 1 ? 's' : '') + ' since the last mound';
  let h = (gardensOf('herb').length || gardensOf('flower').length || LAND_ORDER.some(k => gardensOf(k).length) ? kindBar() : '') + '<section class="card war"><div class="wtitle">⚔️ GOPHER WAR ⚔️</div><div class="wsub">' + esc(r.name) + '</div><div class="wstats"><div><b>' + k + '</b><span>confirmed kills</span></div><div><b>$' + (k * (+S.settings.bounty || 0)) + '</b><span>bounty earned</span></div><div><b>' + st.set + '</b><span>traps live</span></div></div>' +
    (r.next ? '<div class="pbar"><i style="width:' + pct + '%"></i></div><p class="sm dim center">' + (r.next[0] - k) + ' more to reach <b>' + r.next[1] + '</b></p>' : '<p class="center gold">Maximum rank. The gophers speak your name in whispers.</p>') +
    '<p class="center sm">' + esc(quiet) + '</p><button class="btn gold block bigbtn" data-act="gGotOne">💀 I GOT ONE!</button></section>';
  h += '<section class="card gmap"><div class="ct"><span>🗺️ ' + esc(g.name) + ' battlefield</span><label class="sm dim"><input type="checkbox" ' + (UI.gdanger ? 'checked' : '') + ' data-chg="gdanger"> danger glow</label></div>' +
    '<div class="chips nowrap">' + GTOOLS.map(t => '<button class="chip' + (UI.gtool === t[0] ? ' on' : '') + (t[0] === 'kill' ? ' redchip' : '') + '" data-act="gtool" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<p class="sm dim" id="ghint">' + gHint() + '</p><div class="mapwrap2" id="mw"><canvas id="gcg" style="touch-action:pan-x pan-y pinch-zoom"></canvas></div>' +
    '<div class="legend"><span>🕳️ mound</span><span>🪤 trap set</span><span>🪦 fallen</span><span>🥀 damage</span><span>🛡️ guard</span><span><i style="background:rgba(255,40,30,.5)"></i>danger</span><span><i style="background:rgba(70,200,110,.5)"></i>deterrent flowers</span></div></section>';
  // intel
  const dm = dangerMap(g), risk = {}; Object.keys(dm).forEach(kk => { const c = g.cells[kk]; if (c && !isSp(c.p) && dm[kk] > .35 && GLOVE.indexOf(c.p) >= 0) risk[c.p] = (risk[c.p] || 0) + 1; });
  const hot = Object.keys(dm).sort((a, b) => dm[b] - dm[a]).slice(0, 3).filter(kk => dm[kk] > .3);
  const rpl = repelPlants(g), rpk = Object.keys(rpl), baitIn = layerItems(g).filter(it => ['tulip', 'lily', 'dahlia', 'gladiolus', 'daylily', 'canna', 'crocus', 'hyacinth'].indexOf(it.p) >= 0), baitN = {}; baitIn.forEach(it => { baitN[it.p] = 1; });
  h += '<section class="card"><div class="ct"><span>🎯 Intel</span></div><div class="sum"><div><b>' + st.thisWk + '</b><span>mounds this week</span></div><div><b>' + st.lastWk + '</b><span>last week</span></div><div><b>' + (st.traps.length ? Math.round(st.caught / Math.max(1, st.caught + st.empty + st.set) * 100) : 0) + '%</b><span>trap success</span></div></div>' +
    (st.thisWk < st.lastWk ? '<p class="ok sm center">Mound activity is down. The offensive is working.</p>' : st.thisWk > st.lastWk ? '<p class="warn sm center">More mounds than last week. Set another trap in the freshest run.</p>' : '') +
    (hot.length ? '<h3 class="h3">Hot zones</h3><p class="sm">' + hot.map(kk => { const a = kk.split(','); return 'Tile ' + (+a[0] + 1) + ', ' + (+a[1] + 1); }).join(' · ') + '</p>' : '') +
    (Object.keys(risk).length ? '<h3 class="h3">At risk right now</h3><p class="sm">' + Object.keys(risk).map(id => PBY[id].e + ' ' + PBY[id].n + ' (' + risk[id] + ' tile' + (risk[id] > 1 ? 's' : '') + ')').join(', ') + '. Gophers love roots, tubers, beans and young fruit trees. Wire-basket the trees and trap the nearest mound first.</p>' : '<p class="sm dim">Nothing valuable sits in the danger zone yet.</p>') +
    (rpk.length ? '<h3 class="h3">🛡 Deterrent flowers on guard</h3><p class="sm">' + rpk.map(id => PBY[id].e + ' ' + esc(PBY[id].n) + ' ×' + rpl[id]).join(', ') + '. The green glow on the map shows where they cut the danger (gophers dislike the taste and smell of these bulbs and roots, and the effect fades about six feet out). It helps, it does not replace traps.</p>' : '<p class="sm dim">Tip: daffodils, alliums, fritillaria and irises in your flower layer give gopher-prone beds a natural border. Add them from the Flowers button above.</p>') +
    (Object.keys(baitN).length ? '<p class="sm warn">🕳️ Bait alert: ' + Object.keys(baitN).map(id => PBY[id].e + ' ' + esc(PBY[id].n)).join(', ') + ' are favorite gopher snacks. Plant them in wire baskets or inside a ring of deterrents.</p>' : '') + '</section>';
  // wanted posters
  const act = gEv(g).filter(e => e.t === 'mound' && dayDiff(NOW(), pd(e.d)) <= 14 && !gEv(g).some(x => x.t === 'kill' && x.x === e.x && x.y === e.y && x.d >= e.d));
  if (act.length) { const seen = {}; const uniq = act.filter(e => { const kk = Math.round(e.x / 2) + ',' + Math.round(e.y / 2); if (seen[kk]) return false; seen[kk] = 1; return true; }).slice(0, 3);
    h += '<section class="card"><div class="ct"><span>📜 Most Wanted</span></div>' + uniq.map((e, i) => { const nm = wantedName(e); return '<div class="wanted"><div class="wh">WANTED</div><div class="wn">' + esc(nm) + '</div><div class="ws">Last seen: tile ' + (e.x + 1) + ', ' + (e.y + 1) + ' · ' + fmtD(pd(e.d)) + '<br>Crimes: root theft, mound construction<br>Reward: <b>$' + (+S.settings.bounty || 0) + '</b>, dead or alive (alive is not an option)</div></div>'; }).join('') + '</section>'; }
  // graveyard
  const kills = gEv(g).filter(e => e.t === 'kill').concat(S.gopher.ev.filter(e => e.t === 'kill' && e.g !== g.id)).sort((a, b) => b.d < a.d ? -1 : 1);
  h += '<section class="card"><div class="ct"><span>🪦 Boot Hill</span><span class="tag">' + kills.length + '</span></div>' + (kills.length ? kills.slice(0, 20).map(e => '<div class="tomb"><span class="ti">🪦</span><div><b>' + esc(e.name) + '</b> <span class="dim sm">' + fmtDY(pd(e.d)) + '</span><br><i class="sm">' + esc(e.ep) + '</i></div></div>').join('') : '<p class="dim sm">Empty. For now.</p>') + '</section>';
  // achievements
  h += '<section class="card"><div class="ct"><span>🏅 Medals</span></div><div class="ach">' + ACHS.map(a => '<div class="am' + (S.gopher.ach[a[0]] ? ' got' : '') + '"><b>' + a[1] + '</b><span>' + a[2] + '</span></div>').join('') + '</div></section>';
  h += '<section class="card"><div class="ct"><span>📖 Battle plan</span></div>' + GOPHER_TIPS.map(t => '<details><summary>' + t[0] + '</summary><div class="sm">' + t[1] + '</div></details>').join('') + '</section>';
  h += '<section class="card"><label class="fl">Bounty per gopher ($)<input class="in" type="number" min="0" max="500" value="' + (+S.settings.bounty || 0) + '" data-chg="bounty"></label><label class="tog"><input type="checkbox" ' + (S.settings.sound ? 'checked' : '') + ' data-chg="sound"><span>Victory fanfare and vibration</span></label></section>';
  return h;
}
function wantedName(e) { let n = 0; String(e.id).split('').forEach(c => n += c.charCodeAt(0)); return GFIRST[n % GFIRST.length] + ' ' + GLAST[(n * 7) % GLAST.length]; }
function gHint() { return ({ look: 'Tap a tile to see what happened there.', mound: 'Tap each fresh mound on the map to log it. Danger glows around it.', trap: 'Tap the tile where you set a trap.', kill: 'Tap the tile where it fell. Prepare for glory.', damage: 'Tap a plant a gopher destroyed.', guard: 'Tap tiles protected by wire baskets, hardware cloth or repellent plants.', erase: 'Tap a tile to remove its last mark.' })[UI.gtool]; }
function mountGopher() {
  const g = gG(); if (!g) return; const cv = $('#gcg'); if (!cv) return; cv._cs = cellSize(g, $('#mw').clientWidth || 340);
  cv.addEventListener('pointerup', e => { const c = cellFrom(e, cv, g); if (c) gTap(g, c); });
  drawMap(cv, g, 'gopher', {});
}
function gRedraw() { const g = gG(), cv = $('#gcg'); if (cv) drawMap(cv, g, 'gopher', {}); }
function gAdd(g, c, t, extra) { const e = Object.assign({ id: uid(), g: g.id, x: c.x, y: c.y, t, d: dkey() }, extra || {}); S.gopher.ev.push(e); return e; }
function gTap(g, c) {
  const t = UI.gtool, here = gEv(g).filter(e => e.x === c.x && e.y === c.y);
  if (t === 'look') { gTileSheet(g, c, here); return; }
  if (t === 'erase') { const last = here[here.length - 1]; if (last) { S.gopher.ev = S.gopher.ev.filter(e => e.id !== last.id); if (last.t === 'kill') { S.gopher.kills = Math.max(0, S.gopher.kills - 1); } save(); gRedraw(); toast('Removed.'); } return; }
  if (t === 'mound') { gAdd(g, c, 'mound'); toast('Mound logged. Danger map updated.'); }
  else if (t === 'trap') { gAdd(g, c, 'trap', { st: 'set' }); toast('Trap set. May the odds be ever in your favor.'); checkAch(); }
  else if (t === 'damage') { gAdd(g, c, 'damage'); const cell = g.cells[c.x + ',' + c.y]; toast('Damage logged' + (cell && !isSp(cell.p) ? ' on ' + pName(cell.p) : '') + '. They will pay.'); }
  else if (t === 'guard') { gAdd(g, c, 'guard'); toast('Guard posted.'); checkAch(); }
  else if (t === 'kill') { gKill(g, c); return; }
  save(); gRedraw(); const hint = $('#ghint'); if (hint) hint.textContent = gHint(); checkAch();
}
function gTileSheet(g, c, here) {
  const cell = g.cells[c.x + ',' + c.y], mc = here.filter(e => e.t === 'mound').length;
  let h = '<p class="dim sm">Tile ' + (c.x + 1) + ', ' + (c.y + 1) + (cell && !isSp(cell.p) ? ' · ' + PBY[cell.p].e + ' ' + esc(PBY[cell.p].n) : '') + '</p>';
  if (!here.length) h += '<p>Quiet. No gopher activity recorded here.</p>';
  here.forEach(e => { h += '<div class="flag ' + (e.t === 'mound' || e.t === 'damage' ? 'ask' : e.t === 'kill' ? 'space' : '') + '"><b>' + EVI[e.t] + ' ' + ({ mound: 'Mound', trap: 'Trap (' + (e.st === 'set' ? 'set' : e.st === 'caught' ? 'caught one' : 'sprung empty') + ')', kill: 'Killed: ' + esc(e.name || ''), damage: 'Plant damage', guard: 'Guard' })[e.t] + '</b> <span class="dim sm">' + fmtD(pd(e.d)) + '</span>' + (e.t === 'trap' && e.st === 'set' ? '<div class="row"><button class="btn gold" data-act="gTrapHit" data-id="' + e.id + '">💀 Caught one!</button><button class="btn" data-act="gTrapMiss" data-id="' + e.id + '">Empty</button></div>' : '') + '</div>'; });
  if (mc >= 2) h += '<div class="flag ask"><b>Repeat offender zone.</b> ' + mc + ' mounds on this tile. Probe for the main run (a gopher closes a probe hole within a day) and set two traps, one facing each direction.</div>';
  openSheet('Tile report', h);
}
ACT.gTrapHit = el => { const g = gG(), e = S.gopher.ev.find(x => x.id === el.dataset.id); if (!e) return; e.st = 'caught'; closeSheetQuiet(); gKill(g, { x: e.x, y: e.y, k: e.x + ',' + e.y }); };
ACT.gTrapMiss = el => { const e = S.gopher.ev.find(x => x.id === el.dataset.id); if (e) { e.st = 'empty'; save(); } closeSheet(); toast('Sprung empty. Reset it in the freshest run.'); };
ACT.gtool = el => { UI.gtool = el.dataset.v; render(); };
ACT.gGotOne = () => { UI.gtool = 'kill'; render(); setTimeout(() => { const m = $('#mw'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); toast('Tap the tile where it fell.', 3500); };
CHG.gdanger = el => { UI.gdanger = el.checked; gRedraw(); };
CHG.bounty = el => { S.settings.bounty = clamp(+el.value || 0, 0, 500); save(); };
CHG.sound = el => { S.settings.sound = el.checked; save(); };

/* ---------- the victory ---------- */
function gKill(g, c) {
  const G_ = S.gopher, prevRank = rankOf(G_.kills).name, name = pick(GFIRST) + ' ' + pick(GLAST), ep = pick(EPIT).replace(/\{n\}/g, name.split(' ')[0]);
  const mHere = gEv(g).filter(e => e.t === 'mound' && Math.abs(e.x - c.x) <= 1 && Math.abs(e.y - c.y) <= 1).length;
  const e = gAdd(g, c, 'kill', { name, ep, mh: mHere, hr: NOW().getHours() }); G_.kills++; G_.lastKill = dkey(); logIt('Gopher down: ' + name);
  // trap here becomes spent
  S.gopher.ev.forEach(x => { if (x.t === 'trap' && x.st === 'set' && x.g === g.id && x.x === c.x && x.y === c.y) x.st = 'caught'; });
  const newAch = checkAch(true), newRank = rankOf(G_.kills).name; save();
  celebrate(name, ep, newRank !== prevRank ? newRank : null, newAch);
  gRedraw();
}
function checkAch(silent) {
  const A = S.gopher.ach, ev = S.gopher.ev, kills = ev.filter(e => e.t === 'kill'), got = [], today = dkey();
  const give = k => { if (!A[k]) { A[k] = today; got.push(ACHS.find(a => a[0] === k)); } };
  if (kills.length >= 1) give('first'); if (kills.length >= 5) give('five'); if (kills.length >= 10) give('ten');
  if (kills.filter(e => e.d === today).length >= 2) give('two');
  if (kills.filter(e => dayDiff(NOW(), pd(e.d)) < 7).length >= 3) give('three');
  if (ev.filter(e => e.t === 'mound').length >= 10) give('mapper'); if (ev.filter(e => e.t === 'trap').length >= 5) give('trapper'); if (ev.filter(e => e.t === 'guard').length >= 10) give('fort');
  if (kills.some(e => e.mh >= 3)) give('dynasty'); if (kills.some(e => e.hr != null && e.hr < 6)) give('night');
  if (kills.length) { const last = kills.map(e => e.d).sort().pop(); if (dayDiff(NOW(), pd(last)) >= 30 && !ev.some(e => e.t === 'mound' && e.d > last)) give('peace'); }
  if (got.length) save(); if (got.length && !silent) toast('Medal unlocked: ' + got.map(a => a[1]).join(', '), 4500);
  return got;
}
let ACTX = null;
function fanfare() {
  if (!S.settings.sound) return; try {
    ACTX = ACTX || new (window.AudioContext || window.webkitAudioContext)(); const a = ACTX, t0 = a.currentTime;
    const note = (f, t, d, type, v) => { const o = a.createOscillator(), gn = a.createGain(); o.type = type || 'square'; o.frequency.value = f; gn.gain.setValueAtTime(0, t0 + t); gn.gain.linearRampToValueAtTime(v || .12, t0 + t + .02); gn.gain.exponentialRampToValueAtTime(.001, t0 + t + d); o.connect(gn); gn.connect(a.destination); o.start(t0 + t); o.stop(t0 + t + d + .05); };
    note(60, 0, .5, 'sine', .35); note(90, 0, .25, 'sawtooth', .2); // the thud
    [523, 659, 784, 1047].forEach((f, i) => note(f, .35 + i * .12, .28)); note(1047, .9, .6, 'square', .14); note(784, .9, .6, 'triangle', .12); note(1319, 1.15, .7);
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 220]); } catch (e) {}
}
function confetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv); const c = cv.getContext('2d'), em = ['🪦', '💀', '⭐', '🎉', '🏆', '🌱', '🥕'], P = [];
  for (let i = 0; i < 70; i++) P.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, e: pick(em), s: 18 + Math.random() * 18 });
  let t = 0; (function f() { c.clearRect(0, 0, cv.width, cv.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.font = p.s + 'px serif'; c.fillText(p.e, 0, 0); c.restore(); }); if (++t < 150) requestAnimationFrame(f); else cv.remove(); })();
}
function celebrate(name, ep, rank, ach) {
  const fx = $('#fx'), reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  fx.innerHTML = '<div class="fatal"><div class="fa">' + esc(pick(FATAL)) + '</div><div class="fb">☠️ ' + esc(name) + ' ☠️</div></div>'; fx.className = 'on';
  if (!reduce) { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 650); }
  fanfare(); confetti();
  setTimeout(() => {
    fx.className = ''; fx.innerHTML = '';
    const k = S.gopher.kills, bounty = (+S.settings.bounty || 0);
    openSheet('Victory', '<div class="victory"><div class="vstone">🪦</div><h2 class="big center">' + esc(name) + '</h2><p class="center epi">“' + esc(ep) + '”</p><div class="sum"><div><b>#' + k + '</b><span>confirmed kill</span></div><div><b>+$' + bounty + '</b><span>bounty</span></div><div><b>$' + k * bounty + '</b><span>career total</span></div></div>' +
      (rank ? '<div class="flag"><b>🎖️ PROMOTED: ' + esc(rank) + '</b></div>' : '') + (ach.length ? ach.map(a => '<div class="flag"><b>🏅 Medal unlocked: ' + a[1] + '</b><br><span class="sm">' + a[2] + '</span></div>').join('') : '') +
      '<p class="sm dim center">Pull the trap, reset it nearby (they often travel in pairs), and fill the hole so you can spot new mounds.</p><button class="btn gold block" data-act="closeSheet">Back to the war</button></div>');
  }, reduce ? 300 : 1700);
}
const GOPHER_TIPS = [
  ['Is it a gopher, mole or vole?', '<b>Gopher:</b> fan or crescent-shaped mound of fine soil with a plugged hole off to one side; plants vanish or wilt; it eats roots and bulbs. <b>Mole:</b> round volcano mounds or raised surface ridges; it eats grubs and worms, not roots. <b>Vole:</b> no mounds; shallow runways in grass and mulch, quarter-size holes, gnawed bark.'],
  ['Find the main run (the secret to trapping)', 'Probe 8 to 12 inches from a fresh mound with a metal rod or a broom handle. When you hit the open tunnel, the probe suddenly drops an inch or two. The main run is a few inches below the surface. Fresh mounds are the target: old ones mean it moved on. Dig out one mound plug and watch for the hole to be re-plugged: that confirms a gopher is home.'],
  ['Trapping step by step', '1. Pick the freshest mound and open the run with a trowel on the lateral side. 2. Set one or two traps, mouths pointing in opposite directions, in the main run (box traps like the Gophinator or Macabee-type traps are the classic choices). 3. Wire each trap to a stake so you can find it. 4. Cover the hole with a board or dirt-filled bucket to keep light out, since they plug light holes fast. 5. Check twice a day. 6. If nothing in 2 days, move to a fresher mound. Wear gloves and wash traps; gophers avoid human scent.'],
  ['What actually protects plants', 'Wire baskets of 1/2 inch hardware cloth around fruit tree roots and prized bulbs. Hardware cloth floor (1/2 inch, galvanized) under raised beds. Fencing buried 24 inches deep with an L-shaped foot. Daffodils, alliums, rosemary, lavender and gopher spurge in borders help a little. Predators: barn owl boxes, cats and snakes help over time.'],
  ['What does NOT work', 'Flooding (they run to higher ground and return), mothballs, chewing gum, ultrasonic stakes, windmills and vibrating spikes mostly fail. Smoke and gas bombs are poor value. Poison baits risk pets and hawks and owls: skip them. Castor oil repellents give brief, partial relief.'],
  ['Keep them out of the vegetables', 'Do not plant a carrot bed beside the lawn edge with mounds. Lift root crops promptly. Put vulnerable crops in wire-bottomed raised beds. Mark danger tiles on this map and plant gopher-resistant crops there first: daffodil, garlic, onion, rosemary, sage, lavender, mint.'],
  ['Set realistic expectations', 'One gopher is one territory, roughly 2,000 sq ft, and new ones move in when one is removed. Plan on a season-long program: trap early in spring when the soil is moist and they are active, keep guards in place, and keep logging mounds.']
];
