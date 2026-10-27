/* Hortica Fungi: mushroom library, grow-space tiles, calendar and spore watchdog, how-to guides, spore library. */
const FUNGI = [], FBY = {};
(FUNGI_TXT + '\n' + FUNGI2_TXT).trim().split('\n').filter(l => l.indexOf('|') > 0).forEach(l => {
  const f = l.split('|'); if (f.length < 20) return; const rg = s => s.split('-').map(Number);
  const s = { id: f[0], e: f[1], n: f[2], latin: f[3], diff: +f[4], where: f[5], sub: f[6], meth: f[7], col: rg(f[8]), fru: rg(f[9]), hum: f[10], colD: +f[11], fruD: +f[12], fl: +f[13], rest: +f[14], win: f[15] === '-' ? null : f[15].split(',').map(Number), use: f[16], how: f[17], tip: f[18], trouble: f[19] };
  s.log = /Log/.test(s.meth) && s.colD >= 150; FUNGI.push(s); FBY[s.id] = s;
  PBY[s.id] = { id: s.id, e: s.e, n: s.n, cat: 'm', fam: 'fungi', sun: 'S', wat: 3, feed: 'N', sp: 12, days: s.fruD, hw: 1, sow: [], ph: '-', zones: '-', h: 6, moon: 'u', vars: s.latin, how: s.how, tip: s.tip, perm: false, tree: false, fung: true };
});
CATS.m = 'Mushroom'; CATCOL.m = '#8a6a44';
Object.assign(SPECIAL, { _shelf: ['Shelf or rack', '#5b4a3a', '🗄️'], _humid: ['Humidifier or fogger', '#4a7a8a', '💨'], _tent: ['Fruiting chamber', '#35574a', '⛺'] });
const STAGEC = { colonizing: '#5fa0c9', ready: '#e0c24a', fruiting: '#7be08a', resting: '#9aa8a0', spent: '#777', dead: '#ff6a5c' };
const STAGEN = { colonizing: 'Colonizing', ready: 'Fully colonized: time to fruit', fruiting: 'Fruiting', resting: 'Resting between flushes', spent: 'Spent', dead: 'Contaminated', planned: 'Planned' };
const FWINLEN = 7;
function fungiStage(sp, c) {
  if (c.dead) return { s: 'dead', age: 0 }; if (c.s !== 'grow' || !c.d) return { s: 'planned', age: 0 };
  const now = NOW(), age = dayDiff(now, pd(c.d));
  if (age < sp.colD) return { s: 'colonizing', age };
  let start = addD(pd(c.d), sp.fruD);
  if (c.last) { if ((c.fl || 0) >= sp.fl) return { s: 'spent', age }; start = addD(pd(c.last), sp.rest + 5); }
  else if ((c.fl || 0) >= sp.fl) return { s: 'spent', age };
  const ds = dayDiff(now, start);
  if (ds < 0) return { s: age < sp.fruD - 8 ? 'ready' : (c.last ? 'resting' : 'ready'), age, next: start };
  if (ds <= FWINLEN + 3) return { s: 'fruiting', age, start, next: start };
  return { s: c.last ? 'resting' : 'spent', age, next: addD(start, FWINLEN + sp.rest), late: true };
}
function fungiEvents(sp, c) {
  const ev = []; if (!c.d) return ev; const b = pd(c.d);
  ev.push({ k: 'inoc', date: b, label: 'Inoculated' });
  ev.push({ k: 'half', date: addD(b, Math.round(sp.colD / 2)), label: 'About half white: check for contamination' });
  ev.push({ k: 'full', date: addD(b, sp.colD), label: 'Fully colonized: set up fruiting conditions' });
  let s = addD(b, sp.fruD); const f0 = c.fl || 0;
  for (let i = f0; i < sp.fl; i++) { if (i === f0 && c.last) s = addD(pd(c.last), sp.rest + 5); ev.push({ k: 'harv', date: s, end: addD(s, FWINLEN), label: 'Flush ' + (i + 1) + ' harvest window' }); ev.push({ k: 'spore', date: addD(s, 3), end: addD(s, 10), label: 'Spore watch: caps flattening. Harvest or take a print' }); s = addD(s, FWINLEN + sp.rest); }
  return ev;
}
function roomOf(g) { return g && g.room ? g.room : { t: 68, h: 70, where: 'in' }; }
function roomFit(sp, room) {
  if (sp.where === 'out') return { ok: true, msg: 'Outdoor species. Grow in a shaded outdoor bed or log yard.' };
  const t = room.t; if (t >= sp.fru[0] - 2 && t <= sp.fru[1] + 2) return { ok: true, msg: 'Good: ' + t + ' F suits fruiting (' + sp.fru.join(' to ') + ' F).' };
  if (t >= sp.col[0] && t <= sp.col[1]) return { ok: 'warn', msg: 'Colonizes at ' + t + ' F, but fruits at ' + sp.fru.join(' to ') + ' F: ' + (t > sp.fru[1] ? 'it needs a cooler spot to fruit.' : 'it needs a warmer spot to fruit.') };
  return { ok: false, msg: 'Wrong temperature: needs ' + sp.col.join(' to ') + ' F to colonize and ' + sp.fru.join(' to ') + ' F to fruit; your room is ' + t + ' F.' };
}
function fgarden() { return GK('fungi'); }
function fungiCounts(g) { const m = {}; Object.keys(g.cells).forEach(k => { const c = g.cells[k]; if (isSp(c.p) || !FBY[c.p]) return; const st = fungiStage(FBY[c.p], c).s; const o = m[c.p] = m[c.p] || { id: c.p, n: 0, st: {} }; o.n++; o.st[st] = (o.st[st] || 0) + 1; }); return Object.values(m); }
function fungiTasks(g) {
  const t = [], now = NOW(), grp = {};
  Object.keys(g.cells).forEach(k => { const c = g.cells[k], sp = FBY[c.p]; if (!sp) return; const st = fungiStage(sp, c); const key = sp.id + ':' + st.s; (grp[key] = grp[key] || { sp, st, cells: [] }).cells.push({ k, c }); });
  Object.values(grp).forEach(G_ => {
    const sp = G_.sp, st = G_.st, n = G_.cells.length, nm = sp.n + (n > 1 ? ' (' + n + ' tiles)' : ''), id = g.id + ':' + sp.id;
    if (st.s === 'planned') { if (sp.win) { const F = frostDates(), a = addD(F.last, sp.win[0] * 7), b = addD(F.last, sp.win[1] * 7); if (now >= addD(a, -7) && now <= b) t.push({ k: 'f:' + id + ':inoc', lay: 'fungi', e: sp.e, h: 'Inoculate ' + nm + ' now', d: 'Outdoor window ' + fmtD(a) + ' to ' + fmtD(b) + '.', act: { a: 'fInocAll', v: sp.id, g: g.id, l: 'Mark inoculated' }, pr: 1 }); } else t.push({ k: 'f:' + id + ':start', lay: 'fungi', e: sp.e, h: 'Ready to start ' + nm + '?', d: 'Whenever your spawn or kit arrives. ' + roomFit(sp, roomOf(g)).msg, act: { a: 'fInocAll', v: sp.id, g: g.id, l: 'Mark inoculated today' }, pr: 3 }); }
    if (st.s === 'colonizing') {
      const age = Math.min.apply(null, G_.cells.map(x => dayDiff(now, pd(x.c.d))));
      if (age >= 1 && age % 7 < 1 || age === 3) t.push({ k: 'f:' + id + ':chk:' + dkey(), lay: 'fungi', e: '🔬', h: 'Contamination check: ' + nm, d: 'Look for green, black or orange patches and sour smells. White fuzz is good. See How-to: Contamination.', pr: 2 });
      G_.cells.forEach(x => { fungiEvents(sp, x.c).filter(ev => ev.k === 'half' || ev.k === 'full').forEach(ev => { const dd = dayDiff(ev.date, now); if (Math.abs(dd) <= 2 && !t.some(q => q.k === 'f:' + id + ':' + ev.k)) t.push({ k: 'f:' + id + ':' + ev.k, lay: 'fungi', e: sp.e, h: ev.label.split(':')[0] + ': ' + sp.n, d: ev.label + '. ' + (dd > 0 ? 'In ' + dd + ' days.' : 'Now.'), pr: 1 }); }); });
    }
    if (st.s === 'ready') t.push({ k: 'f:' + id + ':ready', lay: 'fungi', e: sp.e, h: 'Move ' + nm + ' to fruiting', d: 'Fully colonized. Give it ' + sp.fru.join(' to ') + ' F, ' + sp.hum + '% humidity, fresh air and light. Pins in about a week.', pr: 1 });
    if (st.s === 'fruiting') { t.push({ k: 'f:' + id + ':harv', lay: 'fungi', e: sp.e, h: 'Harvest ' + nm, d: 'In the harvest window. Pick when cap edges flatten, before they drop spores.', act: { a: 'fHarvAll', v: sp.id, g: g.id, l: 'Mark flush harvested' }, pr: 0 }); t.push({ k: 'f:' + id + ':sp:' + dkey(), lay: 'fungi', e: '💨', h: 'Spore watch: ' + sp.n, d: 'Caps are releasing spores when they flatten or the veil tears. Harvest now, or leave one cap for a spore print. Ventilate and wear a mask in the grow room.', pr: 0 }); if (sp.hum !== 'n/a') t.push({ k: 'f:' + id + ':mist:' + dkey(), lay: 'fungi', e: '💦', h: 'Mist ' + sp.n + ' 2 or 3 times today', d: 'Keep humidity ' + sp.hum + '%. Mist the air and walls rather than soaking the fruits; delicate ones like lion\'s mane rot if they stay wet.', pr: 1 }); }
    if (st.s === 'resting' && st.next) { const dd = dayDiff(st.next, now); if (dd <= 4) t.push({ k: 'f:' + id + ':soak', lay: 'fungi', e: sp.e, h: (sp.log ? 'Soak ' : 'Prepare ') + nm + ' for the next flush', d: sp.log ? 'Soak the log in cold water for 24 hours, then stand it up. Next flush about ' + fmtD(st.next) + '.' : 'Rehydrate lightly and keep humid. Next flush about ' + fmtD(st.next) + '.', pr: 2 }); }
    if (st.s === 'dead') t.push({ k: 'f:' + id + ':dead', lay: 'fungi', e: '☣️', h: 'Remove contaminated ' + nm, d: 'Bag it, do not open indoors, and discard outside. Sanitize the shelf.', pr: 0 });
  });
  const room = roomOf(g); Object.keys(grp).map(k => grp[k].sp).filter((v, i, a) => a.indexOf(v) === i).forEach(sp => { const f = roomFit(sp, room); if (f.ok === false && g.room) t.push({ k: 'f:' + g.id + ':room:' + sp.id, lay: 'fungi', e: '🌡️', h: 'Room temperature problem for ' + sp.n, d: f.msg, pr: 2 }); });
  return t;
}
function fungiBars(sp, cells) {
  const y = NOW().getFullYear(), doy = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(y, 0, 1)) / MS) + 1, segs = [];
  const push = (k, a, b) => { let s = doy(a), e = doy(b); while (s < 1) { s += 365; e += 365; } while (s > 365) { s -= 365; e -= 365; } if (e > 365) { segs.push([k, s, 365]); segs.push([k, 1, Math.min(e - 365, 365)]); } else segs.push([k, s, e]); };
  const withD = cells.filter(c => c.d).map(c => pd(c.d)).sort((a, b) => a - b); let base = withD[0]; if (!base) { const F = frostDates(); base = sp.win ? addD(F.last, sp.win[0] * 7) : NOW(); }
  push('sow', base, addD(base, 7)); push('grow', base, addD(base, sp.colD)); let s = addD(base, sp.fruD); for (let i = 0; i < sp.fl; i++) { push('harv', s, addD(s, FWINLEN)); s = addD(s, FWINLEN + sp.rest); }
  return segs;
}
/* ---------- tile sheet ---------- */
function fungiTileSheet(g, x, y) {
  const k = x + ',' + y, c = g.cells[k], sp = FBY[c.p], st = fungiStage(sp, c), ev = fungiEvents(sp, c), fit = roomFit(sp, roomOf(g));
  let h = '<div class="tilehd"><span class="be">' + sp.e + '</span><div><h2 class="big">' + esc(sp.n) + '</h2><span class="dim sm">' + STAGEN[st.s] + (c.d ? ' · day ' + st.age : '') + (c.fl ? ' · ' + c.fl + ' flush' + (c.fl > 1 ? 'es' : '') + ' picked' : '') + '</span></div></div>';
  if (st.s === 'dead') h += '<div class="flag ask"><b>Contaminated.</b> Bag it, discard outdoors, sanitize the spot.</div>';
  if (c.d && st.s !== 'dead') h += '<div class="flag"><b>Calendar</b><br>' + ev.slice(0, 6).map(e => '<span class="sm">' + esc(e.label) + ': <b>' + fmtD(e.date) + (e.end ? ' to ' + fmtD(e.end) : '') + '</b></span>').join('<br>') + '</div>';
  else if (c.s !== 'grow') h += '<div class="flag"><b>Plan</b><br><span class="sm">Takes about ' + sp.colD + ' days to colonize and ' + sp.fruD + ' days to the first harvest. ' + esc(fit.msg) + '</span></div>';
  if (st.s === 'fruiting') h += '<div class="flag space"><b>💨 Spore watch</b><br><span class="sm">Harvest before caps flatten or curl, or leave one cap to take a spore print. Ventilate.</span></div>';
  if (fit.ok !== true) h += '<div class="flag ask"><b>🌡️ ' + esc(fit.msg) + '</b></div>';
  h += '<div class="row wrap">' + (c.s !== 'grow' ? '<button class="btn gold" data-act="fInoc" data-k="' + k + '">🧫 Inoculated today</button>' : '') + (st.s === 'fruiting' || st.s === 'ready' ? '<button class="btn gold" data-act="fHarv" data-k="' + k + '">🧺 Picked a flush</button>' : '') + (c.s === 'grow' ? '<button class="btn" data-act="fPrint" data-k="' + k + '">📄 Took a spore print</button>' : '') + '</div>';
  h += '<div class="row wrap"><button class="btn" data-act="fungiInfo" data-v="' + sp.id + '">About ' + esc(sp.n) + '</button>' + (c.s === 'grow' && !c.dead ? '<button class="btn danger" data-act="fDead" data-k="' + k + '">☣️ Contaminated</button>' : '') + '</div><button class="btn danger block" data-act="tileClear" data-k="' + k + '">Remove from map</button>';
  openSheet(sp.n, h);
}
ACT.fInoc = el => { const g = fgarden(), c = g.cells[el.dataset.k]; c.s = 'grow'; c.d = dkey(); c.fl = 0; c.last = null; logIt('Inoculated ' + pName(c.p)); save(); closeSheet(); toast('Inoculated. Your calendar is now counting.'); };
ACT.fHarv = el => { const g = fgarden(), c = g.cells[el.dataset.k]; c.fl = (c.fl || 0) + 1; c.last = dkey(); logIt('Harvested ' + pName(c.p) + ' flush ' + c.fl); save(); closeSheet(); toast('Flush logged. Next flush date set.'); };
ACT.fDead = el => { const g = fgarden(), c = g.cells[el.dataset.k]; c.dead = true; save(); closeSheet(); toast('Marked contaminated. Remove it and sanitize.'); };
ACT.fPrint = el => { const g = fgarden(), c = g.cells[el.dataset.k]; S.spores.push({ id: uid(), sp: c.p, type: 'print', d: dkey(), note: 'From ' + g.name }); save(); closeSheet(); toast('Logged in your spore library.'); };
ACT.fInocAll = el => { const g = S.gardens.find(x => x.id === el.dataset.g); Object.keys(g.cells).forEach(k => { const c = g.cells[k]; if (c.p === el.dataset.v && c.s !== 'grow') { c.s = 'grow'; c.d = dkey(); c.fl = 0; c.last = null; } }); logIt('Inoculated ' + pName(el.dataset.v)); save(); toast('Marked inoculated today.'); render(); };
ACT.fHarvAll = el => { const g = S.gardens.find(x => x.id === el.dataset.g); Object.keys(g.cells).forEach(k => { const c = g.cells[k]; if (c.p === el.dataset.v && c.s === 'grow' && !c.dead) { const st = fungiStage(FBY[c.p], c).s; if (st === 'fruiting') { c.fl = (c.fl || 0) + 1; c.last = dkey(); } } }); logIt('Harvested ' + pName(el.dataset.v)); save(); toast('Flush logged.'); render(); };
function fungiReport(g) {
  const cnt = fungiCounts(g); if (!cnt.length) return '<p class="dim">Choose a mushroom, paint it onto shelves, logs or bed tiles, then tap Look to start its calendar.</p>';
  let h = '<div class="rg">' + cnt.map(o => { const sp = FBY[o.id]; return '<button class="rgi" data-act="fungiInfo" data-v="' + o.id + '"><span>' + sp.e + '</span><b>' + esc(sp.n) + '</b><i>' + o.n + ' tile' + (o.n > 1 ? 's' : '') + '</i></button>'; }).join('') + '</div>';
  h += cnt.map(o => '<div class="nrow"><b>' + FBY[o.id].e + ' ' + esc(FBY[o.id].n) + '</b><br>' + Object.keys(o.st).map(s => '<span class="tag" style="border-color:' + (STAGEC[s] || '#888') + '">' + (STAGEN[s] || s).split(':')[0] + ' ' + o.st[s] + '</span>').join(' ') + '</div>').join('');
  h += '<div class="legend">' + ['colonizing', 'ready', 'fruiting', 'resting', 'dead'].map(s => '<span><i style="border:2px solid ' + STAGEC[s] + ';background:none"></i>' + STAGEN[s].split(':')[0].toLowerCase() + '</span>').join('') + '</div>';
  return h;
}
/* ---------- Fungi tab ---------- */
const FPRESETS = [['tent', 'Grow tent or shelf (4 × 2 ft)', 4, 2, 1, 'in'], ['room', 'Basement or spare room (8 × 6 ft)', 8, 6, 1, 'in'], ['logs', 'Log yard (20 × 12 ft)', 10, 6, 2, 'out'], ['bed', 'Outdoor mushroom bed (12 × 8 ft)', 6, 4, 2, 'out']];
UI.fsub = 'grow'; UI.fdiff = 'all';
function fungiTab() {
  const g = fgarden(), sub = UI.fsub;
  let h = '<section class="card"><div class="ct"><span>🍄 Fungi lab</span></div><p class="sm dim">Mushrooms and spores grow in the cool and dark, not the garden. Build your grow space tile by tile, track calendars, and get a spore watchdog.</p><div class="seg small four">' + [['grow', '🧫 Grow'], ['lib', '📚 Library'], ['how', '🎓 How-to'], ['spores', '📄 Spores']].map(a => '<button class="' + (sub === a[0] ? 'on' : '') + '" data-act="fsub" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div></section>';
  if (sub === 'grow') {
    if (!g) return h + '<section class="card"><div class="ct"><span>Make your grow space</span></div><p class="sm">Pick the kind of space you have. You can change the size later.</p>' + FPRESETS.map(p => '<button class="btn block" data-act="fMake" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</section>';
    const rm = roomOf(g);
    h += '<section class="card"><div class="ct"><span>Space conditions</span></div><div class="grid2"><label class="fl">Temperature (°F)<input class="in" type="number" min="30" max="110" value="' + rm.t + '" data-chg="froomT"></label><label class="fl">Humidity (%)<input class="in" type="number" min="10" max="100" value="' + rm.h + '" data-chg="froomH"></label></div><p class="sm dim">Tell Hortica what your space is like; it checks each mushroom against it.</p></section>';
    h += gardenTab();
    const tk = fungiTasks(g).sort((a, b) => a.pr - b.pr);
    h += '<section class="card"><div class="ct"><span>🐕 Spore and growth watchdog</span></div>' + (tk.length ? tk.map(t => '<div class="task"><div class="tt"><b>' + t.e + ' ' + esc(t.h) + '</b><br><span class="sm dim">' + esc(t.d) + '</span>' + (t.act ? '<br><button class="mini" data-act="' + t.act.a + '" data-v="' + t.act.v + '" data-g="' + t.act.g + '">' + t.act.l + '</button>' : '') + '</div></div>').join('') : '<p class="dim">Nothing needs you today. Paint a mushroom on the map and tap it to start its calendar.</p>') + '</section>';
  } else if (sub === 'lib') {
    const f = UI.fdiff, L = FUNGI.filter(s => f === 'all' || (f === 'easy' && s.diff <= 2) || (f === 'out' && s.where !== 'in') || (f === 'med' && /medicinal/i.test(s.use)) || (f === 'warm' && s.fru[0] >= 62) || (f === 'cool' && s.fru[1] <= 65));
    h += '<section class="card"><div class="chips nowrap">' + [['all', 'All'], ['easy', 'Beginner'], ['out', 'Outdoor'], ['med', 'Medicinal'], ['warm', 'Warm room'], ['cool', 'Cool room']].map(a => '<button class="chip' + (f === a[0] ? ' on' : '') + '" data-act="fdiff" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>' + L.map(s => '<button class="prow" data-act="fungiInfo" data-v="' + s.id + '"><span class="pe">' + s.e + '</span><span class="pt"><b>' + esc(s.n) + '</b> <small>' + '★'.repeat(s.diff) + '☆'.repeat(5 - s.diff) + ' · ' + esc(s.use) + '</small><br><small><i>' + esc(s.latin) + '</i> · ' + (s.where === 'in' ? 'indoor' : s.where === 'out' ? 'outdoor' : 'indoor or outdoor') + ' · first harvest in about ' + s.fruD + ' days</small></span></button>').join('') + '<p class="foot">Culinary and medicinal species only. Never eat wild mushrooms from an app.</p></section>';
  } else if (sub === 'how') {
    h += '<section class="card"><div class="ct"><span>🎓 New to mushrooms? Start here</span></div>' + FGUIDES.map((g_, i) => '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(g_[0]) + '</summary><ol class="ol sm">' + g_[1].map(s => '<li>' + esc(s) + '</li>').join('') + '</ol></details>').join('') + '</section>';
  } else {
    const items = S.spores.slice().sort((a, b) => b.d < a.d ? -1 : 1);
    h += '<section class="card"><div class="ct"><span>📄 Spore library</span><a class="lnk" data-act="sporeAdd">Log one</a></div><p class="sm dim">Your own collection of spore prints, syringes, liquid cultures and agar. Hortica tells you when each needs refreshing. Prints keep about 24 months in the fridge, syringes 9, liquid culture 6, agar plates 3, grain spawn 2.</p>' + (items.length ? items.map(s => { const sp = FBY[s.sp], life = SPORELIFE[s.type][1], age = dayDiff(NOW(), pd(s.d)), left = life - age; return '<div class="nrow"><b>' + (sp ? sp.e + ' ' + esc(sp.n) : esc(s.sp)) + '</b> <span class="tag">' + SPORELIFE[s.type][0] + '</span><br><span class="sm dim">Collected ' + fmtDY(pd(s.d)) + (s.note ? ' · ' + esc(s.note) : '') + '</span><br><span class="sm ' + (left < 0 ? 'red' : left < 45 ? 'warn' : 'ok') + '">' + (left < 0 ? 'Past its best by ' + (-left) + ' days. Refresh or replace.' : left < 45 ? 'Use or refresh within ' + left + ' days.' : 'Good for about ' + Math.round(left / 30) + ' more months.') + '</span> <button class="mini" data-act="sporeDel" data-id="' + s.id + '">Remove</button></div>'; }).join('') : '<p class="dim">Nothing logged yet. Take your first spore print from a mature mushroom (see How-to).</p>') + '</section><section class="card tip"><b>Spore watch tips</b><p class="sm">Most mushrooms drop the most spores in the day before the cap fully flattens. Collect for a print then, and harvest the rest to eat. Ventilate, wear a mask, and never grow from spores of unknown mushrooms.</p></section>';
  }
  return h;
}
const SPORELIFE = { print: ['Spore print', 730], syringe: ['Syringe', 270], lc: ['Liquid culture', 180], agar: ['Agar plate', 90], spawn: ['Grain spawn', 60] };
ACT.fsub = el => { UI.fsub = el.dataset.v; render(); };
ACT.fdiff = el => { UI.fdiff = el.dataset.v; render(); };
CHG.froomT = el => { const g = fgarden(); g.room = Object.assign(roomOf(g), { t: clamp(+el.value || 68, 30, 110) }); save(); render(); };
CHG.froomH = el => { const g = fgarden(); g.room = Object.assign(roomOf(g), { h: clamp(+el.value || 70, 10, 100) }); save(); render(); };
ACT.fMake = el => { const p = FPRESETS.find(x => x[0] === el.dataset.v), g = newGarden(p[1].split(' (')[0], p[2], p[3], p[4]); g.kind = 'fungi'; g.room = { t: p[5] === 'in' ? 68 : 60, h: p[5] === 'in' ? 70 : 80, where: p[5] }; g.soil = 'loam'; S.gardens.push(g); S.curBy.fungi = g.id; UI.brush = 'oyster'; UI.status = 'plan'; save(); render(); toast('Grow space ready. Pick a mushroom and paint it on.', 3500); };
ACT.fungiInfo = el => {
  const sp = FBY[el.dataset.v], g = fgarden(), fit = roomFit(sp, roomOf(g));
  openSheet(sp.n, '<div class="tilehd"><span class="be">' + sp.e + '</span><div><h2 class="big">' + esc(sp.n) + '</h2><span class="dim sm"><i>' + esc(sp.latin) + '</i> · ' + '★'.repeat(sp.diff) + '☆'.repeat(5 - sp.diff) + ' difficulty</span></div></div>' +
    '<div class="chips c"><span class="chip">' + esc(sp.use) + '</span><span class="chip">🌡️ colonize ' + sp.col.join('-') + ' F</span><span class="chip">🌡️ fruit ' + sp.fru.join('-') + ' F</span>' + (sp.hum !== 'n/a' ? '<span class="chip">💦 ' + sp.hum + '% humidity</span>' : '') + '<span class="chip">⏱ ' + sp.colD + ' days to colonize</span><span class="chip">🍄 first harvest ~' + sp.fruD + ' days</span><span class="chip">' + sp.fl + ' flush' + (sp.fl > 1 ? 'es' : '') + '</span></div>' +
    (g ? '<div class="flag ' + (fit.ok === true ? '' : 'ask') + '"><b>Your space</b><br><span class="sm">' + esc(fit.msg) + '</span></div>' : '') +
    '<h3 class="h3">Grows on</h3><p class="sm">' + esc(sp.sub) + '. Methods: ' + esc(sp.meth) + '.</p><h3 class="h3">How to grow it</h3><p>' + esc(sp.how) + '</p><div class="flag"><b>Tip</b><br><span class="sm">' + esc(sp.tip) + '</span></div><div class="flag ask"><b>Problems</b><br><span class="sm">' + esc(sp.trouble) + '</span></div>' +
    '<p class="foot">Grow from labeled spawn or kits. Never eat a mushroom you cannot identify with certainty.</p><button class="btn gold block" data-act="fBrush" data-v="' + sp.id + '">🖌 Paint it in my grow space</button>');
};
ACT.fBrush = el => { UI.brush = el.dataset.v; UI.tool = 'paint'; UI.tab = 'fungi'; UI.fsub = 'grow'; closeSheetQuiet(); if (!fgarden()) { render(); toast('Make a grow space first.'); return; } render(); toast(pName(el.dataset.v) + ' is your brush.'); };
ACT.sporeAdd = () => openSheet('Log a spore collection', '<label class="fl">Mushroom<select class="in" id="spsp">' + FUNGI.map(s => '<option value="' + s.id + '">' + esc(s.n) + '</option>').join('') + '</select></label><label class="fl">Type<select class="in" id="spty">' + Object.keys(SPORELIFE).map(k => '<option value="' + k + '">' + SPORELIFE[k][0] + '</option>').join('') + '</select></label><label class="fl">Date collected<input class="in" type="date" id="spdt" value="' + dkey() + '"></label><label class="fl">Note<input class="in" id="spnt" placeholder="where from, strain, storage"></label><button class="btn gold block" data-act="sporeSave">Save</button>');
ACT.sporeSave = () => { S.spores.push({ id: uid(), sp: $('#spsp').value, type: $('#spty').value, d: $('#spdt').value || dkey(), note: $('#spnt').value.trim() }); save(); closeSheet(); };
ACT.sporeDel = el => { S.spores = S.spores.filter(x => x.id !== el.dataset.id); save(); render(); };
function sporeTasks() { const t = []; S.spores.forEach(s => { const left = SPORELIFE[s.type][1] - dayDiff(NOW(), pd(s.d)); if (left < 30) t.push({ k: 'sp:' + s.id, lay: 'fungi', e: '📄', h: (left < 0 ? 'Refresh' : 'Use or refresh') + ' ' + (FBY[s.sp] ? FBY[s.sp].n : s.sp) + ' ' + SPORELIFE[s.type][0].toLowerCase(), d: 'Collected ' + fmtD(pd(s.d)) + '. ' + (left < 0 ? 'It is past its best.' : 'About ' + left + ' days of shelf life left.'), pr: 3 }); }); return t; }
