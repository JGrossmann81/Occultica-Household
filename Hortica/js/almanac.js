/* Hortica Almanac tab: today's sky, planetary hours, best-time finder, real forecast, moon calendar.
   The almanac is computed from astronomy for your location (not copied from any printed almanac); the forecast comes from Open-Meteo. */
UI.bt = UI.bt || { id: '', act: 'sow' };
const WXI = c => c == null ? '·' : c === 0 ? '☀️' : c === 1 ? '🌤' : c === 2 ? '⛅' : c === 3 ? '☁️' : c <= 48 ? '🌫' : c <= 57 ? '🌦' : c <= 67 ? '🌧' : c <= 77 ? '🌨' : c <= 82 ? '🌦' : c <= 86 ? '🌨' : '⛈';
const WXN = c => c == null ? '' : c === 0 ? 'Clear' : c === 1 ? 'Mostly clear' : c === 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow showers' : 'Thunderstorms';
const PGARDEN = { Sun: 'harvesting flowers and fruit, planting sun lovers, drying', Moon: 'leafy crops, seedlings, herbs, watering, transplanting', Mars: 'weeding, pruning, pest control and clearing (not a planting hour)', Mercury: 'fast growers, vines, herbs, grafting, garden planning', Jupiter: 'fruit trees, perennials, feeding, anything you want abundant', Venus: 'flowers, roses, love herbs, sowing for beauty and sweetness', Saturn: 'roots, bulbs, cutting back, composting, fencing' };
const WSUB = [['today', '🌙 Today'], ['wx', '🌦 Weather'], ['cal', '🗓 Calendar']];

function skyPlantOptions() {
  const on = []; plantGardens().forEach(g => gardenCounts(g).forEach(o => { if (on.indexOf(o.id) < 0) on.push(o.id); }));
  const opt = id => '<option value="' + id + '"' + (UI.bt.id === id ? ' selected' : '') + '>' + PBY[id].e + ' ' + esc(PBY[id].n) + '</option>';
  return (on.length ? '<optgroup label="On my maps">' + on.map(opt).join('') + '</optgroup>' : '') + '<optgroup label="All plants">' + PLANTS.filter(p => on.indexOf(p.id) < 0).sort((a, b) => a.n.localeCompare(b.n)).map(p => opt(p.id)).join('') + '</optgroup>';
}
function btResult() {
  const p = PBY[UI.bt.id]; if (!p) return '<p class="dim sm">Pick a plant.</p>';
  const L = bestTimes(p, UI.bt.act, { days: 14 }).slice(0, 5); const R = rulerOf(p);
  if (!L.length) return '<p class="dim sm">No usable hours in the next two weeks' + (S.sky.night ? '' : ' (night hours are off in Settings)') + '.</p>';
  return '<p class="sm">' + PSYM[R] + ' <b>' + esc(p.n) + '</b> is ruled by <b>' + R + '</b> (' + PINT[R] + '). Top hours for <b>' + ACTS[UI.bt.act][1].toLowerCase() + '</b>:</p>' + L.map((b, i) => '<div class="bt"><span class="pl" style="color:' + PCOL[b.planet] + '">' + PSYM[b.planet] + '</span><div><b>' + esc(whenText(b)) + '</b> <span class="gold">' + stars(b.stars) + '</span><br><span class="sm dim">' + b.moon.icon + ' ' + b.moon.name + ' in ' + b.moon.sign + ' · ' + b.planet + ' hour · ' + esc(b.why.slice(0, 3).join('; ')) + '.' + (b.warn.length ? ' <span class="warn">Watch: ' + esc(b.warn[0]) + '.</span>' : '') + '</span></div></div>').join('') +
    '<p class="foot">Hours come from your sunrise and sunset. Frost, heat, rain and wind from the forecast outrank the lore: a "perfect" hour in a freeze is still a freeze.</p>';
}
function hoursHTML() {
  const now = NOW(), hn = hourNow(now), H = hn.H, rows = H.slots.filter(s => S.sky.night || !s.night);
  return '<div class="hours">' + rows.map(s => '<div class="hr' + (s === hn.slot || (s.i === hn.slot.i && H.date === hn.H.date && s.start.getTime() === hn.slot.start.getTime()) ? ' cur' : '') + (s.night ? ' nt' : '') + '"><span class="pl" style="color:' + PCOL[s.planet] + '">' + PSYM[s.planet] + '</span><span class="hn"><b>' + s.planet + '</b> <small>' + tm(s.start) + ' to ' + tm(s.end) + (s.night ? ' · night' : '') + '</small><br><small class="dim">' + PGARDEN[s.planet] + '</small></span></div>').join('') + '</div>';
}
function skyToday() {
  const now = NOW(), m = moonInfo(now), hn = hourNow(now), H = hn.H, sun = sunOn(now); const nf = nextPhase(now, 180), nn = nextPhase(now, 0);
  if (!UI.bt.id) { const on = []; plantGardens().forEach(g => gardenCounts(g).forEach(o => { if (on.indexOf(o.id) < 0) on.push(o.id); })); UI.bt.id = on[0] || 'tomato'; }
  let h = '<section class="card sky"><div class="ct"><span>' + PSYM[DAYRULER[now.getDay()]] + ' ' + WDAY[now.getDay()] + '</span><span class="tag">' + fmtDY(now) + '</span></div>' +
    '<div class="skyrow"><div class="moonbig">' + m.icon + '</div><div><b>' + m.name + '</b> in <b>' + m.sym + ' ' + m.sign + '</b><br><span class="sm dim">' + Math.round(m.ill * 100) + '% lit · day ' + Math.floor(m.age) + ' of the moon · ' + (m.waxing ? 'waxing' : 'waning') + '</span></div></div>' +
    '<p class="sm">' + esc(SIGNADV[m.sign]) + '</p><p class="sm">' + esc(m.note) + '</p>' +
    '<div class="sum"><div><b>' + tm(sun.rise) + '</b><span>sunrise</span></div><div><b>' + tm(sun.set) + '</b><span>sunset</span></div><div><b>' + (Math.round((sun.set - sun.rise) / 36e5 * 10) / 10) + ' h</b><span>daylight</span></div></div>' +
    (now < H.rise ? '<p class="sm dim">Before sunrise (' + tm(H.rise) + '), the planetary day is still ' + H.wd + '\'s.</p>' : '') + '<p class="sm"><b>Day of ' + H.day + '</b> ' + PSYM[H.day] + ': ' + PINT[H.day] + '. Best for ' + PGARDEN[H.day] + '.</p>' +
    '<p class="sm dim">' + (nf ? '🌕 Next full moon: ' + fmtD(nf) + ' (' + fullMoonName(nf) + ') · ' : '') + (nn ? '🌑 Next new moon: ' + fmtD(nn) : '') + '</p></section>';
  h += '<section class="card"><div class="ct"><span>Planetary hours</span><label class="sm dim"><input type="checkbox" data-chg="snight" ' + (S.sky.night ? 'checked' : '') + '> night</label></div><p class="sm dim">Now: <b style="color:' + PCOL[hn.slot.planet] + '">' + PSYM[hn.slot.planet] + ' ' + hn.slot.planet + ' hour</b>, ending ' + tm(hn.slot.end) + '. The day is cut into 12 hours from sunrise to sunset, each ruled in turn by a planet, starting with the planet of the day. This is old Chaldean tradition.</p><div id="hrs">' + hoursHTML() + '</div></section>';
  h += '<section class="card"><div class="ct"><span>🌱 Best time to…</span></div><div class="row"><select class="in" id="btp" data-chg="btPlant">' + skyPlantOptions() + '</select></div><div class="chips c">' + Object.keys(ACTS).map(k => '<button class="chip' + (UI.bt.act === k ? ' on' : '') + '" data-act="btAct" data-v="' + k + '">' + ACTS[k][0] + ' ' + ACTS[k][1] + '</button>').join('') + '</div><div id="btres">' + btResult() + '</div></section>';
  return h;
}
CHG.btPlant = el => { UI.bt.id = el.value; $('#btres').innerHTML = btResult(); };
ACT.btAct = el => { UI.bt.act = el.dataset.v; $$('[data-act=btAct]').forEach(b => b.classList.toggle('on', b.dataset.v === UI.bt.act)); $('#btres').innerHTML = btResult(); };
CHG.snight = el => { S.sky.night = el.checked; save(); if (UI.tab === 'sky') { const a = $('#hrs'); if (a) a.innerHTML = hoursHTML(); const b = $('#btres'); if (b) b.innerHTML = btResult(); } };
ACT.skyOpen = () => { closeSheetQuiet(); UI.sub.sky = 'today'; setTab('sky'); };
ACT.bestOpen = el => { UI.bt.id = el.dataset.v; UI.bt.act = PBY[el.dataset.v] && PBY[el.dataset.v].perm ? 'sow' : 'sow'; UI.sub.sky = 'today'; closeSheetQuiet(); setTab('sky'); setTimeout(() => { const e = $('#btres'); if (e) e.scrollIntoView({ block: 'center' }); }, 60); };

/* ---------- weather ---------- */
function gardenWxBrief(W) {
  const L = [], n7 = W.days.slice(0, 7);
  if (W.minNext <= 32) L.push(['🥶', 'Freeze risk: low of ' + Math.round(W.minNext) + '°F. Cover tender plants and water the soil at dusk.']); else if (W.minNext <= 36) L.push(['🥶', 'Frost possible near ' + Math.round(W.minNext) + '°F. Cover tomatoes, peppers, basil and squash.']);
  if (W.maxNext >= 95) L.push(['🔥', 'Hot spell to ' + Math.round(W.maxNext) + '°F. Water at dawn, shade seedlings and lettuce, pick flowers early.']);
  const rain = n7.filter(d => d.rain >= .25); if (rain.length) L.push(['🌧', 'Rain ' + rain.map(d => WDAY[pd(d.d).getDay()].slice(0, 3) + ' ' + d.rain.toFixed(1) + ' in').join(', ') + '. Skip watering those days and hold off fertilizer before a downpour.']); else L.push(['☀️', 'No meaningful rain in the next 7 days. Plan on watering.']);
  const w = n7.find(d => d.wind != null && d.wind >= 25); if (w) L.push(['💨', 'Wind up to ' + Math.round(w.wind) + ' mph on ' + WDAY[pd(w.d).getDay()] + '. Stake tall flowers, tomatoes and corn.']);
  if (W.et0 != null) L.push(['💧', 'Plants will lose about ' + (W.et0 * 7).toFixed(1) + ' in of water this week to heat and sun (evapotranspiration). Vegetables want about 1 in a week beyond rain.']);
  const uv = n7.reduce((a, d) => Math.max(a, d.uv || 0), 0); if (uv >= 8) L.push(['😎', 'UV index up to ' + Math.round(uv) + '. Work in the morning and wear a hat.']);
  const good = n7.filter(d => d.lo > 38 && d.hi < 90 && d.rain < .3 && (d.wind == null || d.wind < 20)); if (good.length) L.push(['✅', 'Best working days: ' + good.slice(0, 4).map(d => WDAY[pd(d.d).getDay()].slice(0, 3)).join(', ') + ' (mild, dry and calm).']);
  return L;
}
function skyWx() {
  const W = wxSummary(), n = S.wxn; let h = '';
  if (!W) return '<section class="card"><div class="ct"><span>🌦 Forecast</span></div><p class="sm">' + (UI.wxTried ? 'Could not reach the forecast. Check your connection and tap Refresh.' : 'Loading your forecast…') + '</p><button class="btn block" data-act="wxRefresh">Refresh</button></section>';
  const c = W.cur, today = W.days[0];
  h += '<section class="card"><div class="ct"><span>🌦 ' + esc(S.loc.name || 'Your garden') + '</span><span class="tag">' + (W.age < 3600000 ? 'just now' : Math.round(W.age / 3600000) + ' h ago') + '</span></div>' +
    (c ? '<div class="skyrow"><div class="moonbig">' + WXI(c.code) + '</div><div><b style="font-size:1.6rem">' + Math.round(c.temp) + '°F</b> <span class="dim">' + WXN(c.code) + '</span><br><span class="sm dim">Wind ' + Math.round(c.wind) + ' mph · humidity ' + Math.round(c.hum) + '%</span></div></div>' : '') +
    (today ? '<p class="sm">Today: high <b>' + Math.round(today.hi) + '°</b>, low <b>' + Math.round(today.lo) + '°</b>' + (today.rain ? ', rain ' + today.rain.toFixed(2) + ' in' : '') + (today.pop != null ? ' (' + today.pop + '% chance)' : '') + '.</p>' : '') +
    '<p class="sm dim">Last 7 days brought ' + W.rainPast.toFixed(1) + ' in of rain. Next 7 days: ' + W.rainNext.toFixed(1) + ' in.</p></section>';
  h += '<section class="card"><div class="ct"><span>Next ' + Math.min(16, W.days.length) + ' days</span></div><div class="wxrow">' + W.days.slice(0, 16).map(d => { const dt = pd(d.d), fr = d.lo <= 32; return '<button class="wxd' + (fr ? ' frz' : '') + '" data-act="calDay" data-v="' + d.d + '"><small>' + WDAY[dt.getDay()].slice(0, 3) + '</small><small class="dim">' + fmtD(dt) + '</small><span class="wi">' + WXI(d.code) + '</span><b>' + Math.round(d.hi) + '°</b><small class="dim">' + Math.round(d.lo) + '°</small><small class="rn">' + (d.rain >= .02 ? '💧' + d.rain.toFixed(1) : '&nbsp;') + '</small></button>'; }).join('') + '</div><p class="foot">Days beyond about a week are less certain. Tap a day for its moon, planetary hours and what to do.</p></section>';
  h += '<section class="card tip"><div class="ct"><span>What this means for your gardens</span></div>' + gardenWxBrief(W).map(a => '<div class="nrow"><span class="me">' + a[0] + '</span> <span class="sm">' + esc(a[1]) + '</span></div>').join('') + '</section>';
  if (n && n.m) { const m = n.m[NOW().getMonth()], avg = a => a.reduce((x, y) => x + y, 0) / a.length, hi = avg(W.days.slice(0, 7).map(d => d.hi)), lo = avg(W.days.slice(0, 7).map(d => d.lo)); if (m && m.hi != null) h += '<section class="card"><div class="ct"><span>Compared with a normal ' + MON[NOW().getMonth()] + '</span></div><div class="sum"><div><b>' + Math.round(hi) + '°</b><span>avg high ahead</span></div><div><b>' + Math.round(m.hi) + '°</b><span>normal high</span></div><div><b>' + (hi - m.hi >= 0 ? '+' : '') + Math.round(hi - m.hi) + '°</b><span>difference</span></div></div><p class="sm dim">Normals are the average of the last five years at your location. A typical ' + MON[NOW().getMonth()] + ' brings about ' + m.rain.toFixed(1) + ' in of rain here; lows run near ' + Math.round(m.lo) + '°.</p></section>'; }
  h += '<section class="card"><div class="ct"><span>About the Almanac</span></div><p class="sm">Hortica does not copy the printed Old Farmer\'s Almanac or Farmers\' Almanac: their text and tables are copyrighted, and their long-range weather predictions have never been shown to beat chance. Instead, the moon, sun, equinoxes and planting calendar here are <b>calculated for your location</b>, and the weather is a <b>real forecast</b>. Want the print almanacs\' own take? Compare with their pages:</p><div class="row wrap"><a class="btn" href="https://www.almanac.com/gardening/planting-calendar" target="_blank" rel="noopener">almanac.com planting dates</a><a class="btn" href="https://www.farmersalmanac.com/" target="_blank" rel="noopener">farmersalmanac.com</a></div></section>';
  return h;
}
ACT.wxRefresh = async () => { UI.wxTried = false; toast('Refreshing forecast…'); await refreshWx(true); await refreshNormals(); UI.wxTried = true; if (UI.tab === 'sky') render(); };

/* ---------- moon calendar ---------- */
UI.calM = 0;
function stepMap() { // date key -> planting steps for the plants you have planned
  const m = {}; plantGardens().forEach(g => { gardenCounts(g).forEach(o => { const p = PBY[o.id]; if (!p || o.grow >= o.tiles) return; plantDates(p).steps.forEach(s => { const k = dkey(s.date); (m[k] = m[k] || []).push(p.e); }); }); }); return m;
}
function skyCal() {
  const now = NOW(), base = new Date(now.getFullYear(), now.getMonth() + UI.calM, 1), y = base.getFullYear(), mo = base.getMonth(), days = new Date(y, mo + 1, 0).getDate(), lead = base.getDay();
  const ph = phasesBetween(base, new Date(y, mo + 1, 1)), pk = {}; ph.forEach(p => { pk[dkey(p.at)] = p; });
  const eq = equinoxes(y), seas = {}; [['mar', 'Spring equinox'], ['jun', 'Summer solstice'], ['sep', 'Autumn equinox'], ['dec', 'Winter solstice']].forEach(a => { seas[dkey(eq[a[0]])] = a[1]; });
  const sm = stepMap(), F = frostDates(y), fk = {}; fk[dkey(F.last)] = 'last frost'; fk[dkey(F.first)] = 'first frost';
  let h = '<section class="card"><div class="calhd"><button class="mini" data-act="calNav" data-v="-1">‹</button><b>' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mo] + ' ' + y + '</b><button class="mini" data-act="calNav" data-v="1">›</button></div>' +
    '<div class="calg dow">' + 'SMTWTFS'.split('').map(d => '<span>' + d + '</span>').join('') + '</div><div class="calg">';
  for (let i = 0; i < lead; i++) h += '<span></span>';
  for (let d = 1; d <= days; d++) { const dt = new Date(y, mo, d), k = dkey(dt), v = dayVerdict(dt), p = pk[k]; h += '<button class="cd' + (k === dkey(now) ? ' today' : '') + (p ? ' ph' : '') + '" data-act="calDay" data-v="' + k + '"><small>' + d + '</small><span class="mi">' + (p ? p.icon : v.mi.icon) + '</span><span class="sg">' + v.mi.sym + '</span><span class="tg">' + v.tags.map(t => t[1]).join('') + (sm[k] ? '🌱' : '') + (seas[k] || fk[k] ? '⭐' : '') + '</span></button>'; }
  h += '</div><div class="legend"><span>🌱 sow above-ground</span><span>🥕 roots and bulbs</span><span>🌸 flowers (Libra)</span><span>✂️ weed and prune</span><span>⭐ season marker</span></div></section>';
  const ev = ph.map(p => [p.at, p.icon + ' ' + p.name + (p.tg === 180 ? ' · ' + fullMoonName(p.at) : '') + ' · ' + tm(p.at)]); Object.keys(seas).forEach(k => { const d = pd(k); if (d.getMonth() === mo) ev.push([d, '⭐ ' + seas[k]]); }); Object.keys(fk).forEach(k => { const d = pd(k); if (d.getMonth() === mo && !F.free) ev.push([d, '❄️ Typical ' + fk[k] + ' for your area']); });
  h += '<section class="card"><div class="ct"><span>This month in the sky</span></div>' + ev.sort((a, b) => a[0] - b[0]).map(e => '<div class="nrow"><b>' + fmtD(e[0]) + '</b> <span class="sm">' + esc(e[1]) + '</span></div>').join('') + '<p class="foot">Moon phases and signs are calculated (the tropical zodiac, as in most garden almanacs). Which days suit which job is old-timer tradition. Frost and rain always outrank it.</p></section>';
  return h;
}
ACT.calNav = el => { UI.calM += +el.dataset.v; render(); };
ACT.calDay = el => {
  const dt = pd(el.dataset.v), noon = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12), m = moonInfo(noon), H = planetaryHours(dt), wx = dayWx(dt), v = dayVerdict(dt), sun = sunOn(dt);
  const jobs = []; if (m.waxing && m.fert !== 'barren' && m.fert !== 'dry') jobs.push('Sow and transplant leafy and fruiting crops'); if (!m.waxing && m.elem === 'earth') jobs.push('Plant roots, bulbs and perennials'); if (m.sign === 'Libra') jobs.push('Plant flowers and vines'); if (m.fert === 'barren' || m.fert === 'dry') jobs.push('Weed, prune, cultivate and harvest for drying'); if (m.f < .03 || m.f > .97) jobs.push('Rest day: the new moon is a poor time to sow'); if (!jobs.length) jobs.push('A middling day: fine for general chores');
  let h = '<div class="tilehd"><span class="be">' + m.icon + '</span><div><h2 class="big">' + WDAY[dt.getDay()] + ' ' + fmtD(dt) + '</h2><span class="dim sm">' + m.name + ' in ' + m.sym + ' ' + m.sign + ' · day of ' + H.day + ' ' + PSYM[H.day] + '</span></div></div>' +
    (wx ? '<div class="flag"><b>' + WXI(wx.code) + ' Forecast</b> ' + WXN(wx.code) + ': high ' + Math.round(wx.hi) + '°, low ' + Math.round(wx.lo) + '°' + (wx.rain ? ', rain ' + wx.rain.toFixed(2) + ' in' : '') + (wx.wind ? ', wind ' + Math.round(wx.wind) + ' mph' : '') + '.</div>' : '') +
    '<div class="flag moon"><b>Old-timer verdict</b>' + jobs.map(j => '<div class="sm">• ' + esc(j) + '</div>').join('') + '<p class="sm dim">' + esc(SIGNADV[m.sign]) + '</p></div>' +
    '<p class="sm dim">Sunrise ' + tm(sun.rise) + ' · sunset ' + tm(sun.set) + '</p><h3 class="h3">Planetary hours</h3><div class="hours">' + H.slots.filter(s => !s.night).map(s => '<div class="hr"><span class="pl" style="color:' + PCOL[s.planet] + '">' + PSYM[s.planet] + '</span><span class="hn"><b>' + s.planet + '</b> <small>' + tm(s.start) + ' to ' + tm(s.end) + '</small></span></div>').join('') + '</div>';
  openSheet(WDAY[dt.getDay()] + ' ' + fmtD(dt), h);
};

function skyTab() {
  const sub = UI.sub.sky || 'today';
  const h = '<div class="seg small three">' + WSUB.map(a => '<button class="' + (sub === a[0] ? 'on' : '') + '" data-act="ssub" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  return h + (sub === 'wx' ? skyWx() : sub === 'cal' ? skyCal() : skyToday());
}
ACT.ssub = el => { UI.sub.sky = el.dataset.v; render(); window.scrollTo(0, 0); };
function mountSky() {
  if (UI.wxBusy) return; UI.wxBusy = true; const t0 = S.wx ? S.wx.t : 0, n0 = S.wxn ? S.wxn.t : 0;
  Promise.all([refreshWx(), UI.sub.sky === 'wx' ? refreshNormals() : null]).then(() => {
    UI.wxBusy = false; const changed = (S.wx ? S.wx.t : 0) !== t0 || (S.wxn ? S.wxn.t : 0) !== n0;
    if (UI.tab !== 'sky' || sheetOpen()) return;
    if (changed) render(); else if (!UI.wxTried && !wxSummary()) { UI.wxTried = true; render(); }
  }).catch(() => { UI.wxBusy = false; });
}
