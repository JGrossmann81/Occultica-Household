/* Hortica views: shell, tabs, setup wizard, plant library, wisdom, settings. */
const TABS = [['garden', '🌱', 'Garden'], ['plan', '📅', 'Plan'], ['plants', '📚', 'Plants'], ['sky', '🌙', 'Almanac'], ['fungi', '🍄', 'Fungi'], ['fix', '🔍', 'Fix'], ['gopher', '🐹', 'Gophers']];
function setTab(t) { UI.tab = t; closeSheetQuiet(); render(); window.scrollTo(0, 0); }
ACT.goTab = el => setTab(el.dataset.v);
function header() {
  const g = G(), L = S.loc;
  let chip = ''; try { const m = moonInfo(), W = wxSummary(); chip = '<button class="wchip" data-act="goTab" data-v="sky" aria-label="Almanac and forecast">' + m.icon + (W && W.cur ? ' ' + Math.round(W.cur.temp) + '°' : '') + '</button>'; } catch (e) {}
  return '<div class="hd"><img class="logo" src="img/seal.png" alt=""><div><h1>Hortica</h1><div class="dim sm">' + esc(g ? g.name : 'Garden') + ' · zone ' + esc(L.zone || '?') + '</div></div>' + chip + '<button class="gear ask" data-act="askOpen" aria-label="Ask the gardener">🔧<small>Ask</small></button><button class="gear" data-act="menu" aria-label="Menu">☰</button></div>';
}
function alertBanner() {
  const W = wxSummary(); let h = '';
  if (W && W.minNext <= 34) h += '<div class="card alert"><b>🥶 Frost watch.</b> Low of ' + Math.round(W.minNext) + '°F in the next week. Cover tender plants at dusk and water the soil first.</div>';
  if (W) {
    if (W.maxNext >= 98) h += '<div class="card alert"><b>🔥 Heat wave.</b> Highs up to ' + Math.round(W.maxNext) + '°F this week. Water deeply at dawn, mulch, and shade lettuce, peas and seedlings. Skip transplanting until it breaks.</div>';
    const wd = W.days.slice(0, 5).find(x => x.wind != null && x.wind >= 30); if (wd) h += '<div class="card alert"><b>💨 Wind ' + Math.round(wd.wind) + ' mph on ' + WDAY[pd(wd.d).getDay()] + '.</b> Stake tall flowers and tomatoes, and take down any row cover you cannot pin.</div>';
    const dr = W.days.slice(0, 7).find(x => x.rain >= 1.2); if (dr) h += '<div class="card alert"><b>🌧 Heavy rain ' + WDAY[pd(dr.d).getDay()] + ' (' + dr.rain.toFixed(1) + ' in).</b> Hold off watering and fertilizing, and check drainage on low beds.</div>';
    else if (W.rainNext < .1 && W.maxNext >= 88 && W.rainPast < .3) h += '<div class="card alert"><b>🏜 Dry and hot week.</b> No rain in the forecast and ' + W.rainPast.toFixed(1) + ' in the last week. Check the Water tab daily.</div>';
  }
  const F = frostDates(), now = NOW(); if (!F.free) { const dd = dayDiff(F.first, now); if (dd >= 0 && dd <= 14 && !(W && W.minNext > 40)) h += '<div class="card alert"><b>🍂 First frost is due in about ' + dd + ' days.</b> Pick tomatoes and peppers, and bring in tender herbs.</div>'; }
  return h;
}
function todayCard() {
  const m = moonInfo(), g = G(), now = NOW(), ck = curKind(); const hk = ck === 'herb', fk = ck === 'flower', nowPlants = PLANTS.filter(p => { const w = plantWindow(p); return w && w.state === 'now' && zoneOk(p) && p.cat !== 'c' && (fk ? p.flw : LAND_KINDS[ck] ? p.lk === ck : hk ? (p.herb || p.cat === 'h') : (!p.hx && !p.fx && !p.lk)); }).slice(0, 8); let hr = null; try { hr = hourNow(); } catch (e) {}
  const w = WISDOM[(Math.floor((now - new Date(now.getFullYear(), 0, 0)) / MS)) % WISDOM.length];
  return '<section class="card"><div class="ct"><span>Today in your ' + (fk ? 'flower garden' : hk ? 'herb garden' : 'garden') + '</span><span class="tag">' + fmtD(now) + '</span></div>' + (S.settings.moon ? '<p class="sm">' + m.icon + ' <b>' + m.name + ' in ' + m.sym + ' ' + m.sign + '.</b> <span class="dim">' + m.note + '</span></p>' + (hr ? '<p class="sm"><span style="color:' + PCOL[hr.slot.planet] + '">' + PSYM[hr.slot.planet] + '</span> <b>' + hr.slot.planet + ' hour</b> until ' + tm(hr.slot.end) + ' on a ' + hr.H.wd + ' (' + hr.H.day + ' day). <a class="lnk" data-act="goTab" data-v="sky">Best times and forecast</a></p>' : '') : '') +
    (nowPlants.length ? '<p class="sm"><b>Good to plant now' + (hk ? ' (herbs)' : fk ? ' (flowers)' : '') + ':</b></p><div class="chips c">' + nowPlants.map(p => '<button class="chip" data-act="plantInfo" data-v="' + p.id + '">' + p.e + ' ' + esc(p.n) + '</button>').join('') + '</div>' : '<p class="sm dim">Nothing is in its planting window right now. Check the Plan tab for what comes next.</p>') + '</section>' +
    '<section class="card tip"><div class="ct"><span>🌾 Old-timer wisdom</span><a class="lnk" data-act="wisdom">More</a></div><b>' + esc(w.t) + '</b><p class="sm">' + esc(w.b) + '</p></section>';
}
function plantsTab() {
  return '<section class="card"><div class="ct"><span>📚 Plant and herb book</span><span class="tag">' + PLANTS.length + ' plants</span></div><input class="in" id="lq" data-inp="lq" placeholder="Search: tomato, basil, sleep, cough, sunflower, pink..." value="' + esc(UI.lq || '') + '" autocomplete="off"><div class="chips nowrap" id="lcats">' + lcatChips() + '</div><p class="foot" id="ldis">' + lDis() + '</p><div id="llist">' + libList() + '</div></section><section class="card tip"><b>🍄 Looking for mushrooms?</b><p class="sm">Mushrooms and spores have their own tab, grow-space map and how-to guides.</p><button class="btn block" data-act="goTab" data-v="fungi">Open Fungi</button></section>';
}
function lDis() { if (UI.lcat === 'ft:m' || UI.lcat === 'flowers' || UI.lcat === 'ft:e') return FLOWER_DISCLAIMER; return ['herbs', 'cul', 'spice', 'tea', 'med', 'aro', 'h'].indexOf(UI.lcat || 'all') >= 0 ? (['med', 'tea', 'herbs'].indexOf(UI.lcat) >= 0 ? HERB_DISCLAIMER : 'Open any herb for parts used, traditional uses and cautions.') : ''; }
const LFLOW = [['flowers', '🌸 All flowers'], ['ft:b', '🌸 Beauty'], ['ft:c', '✂️ Cut flower'], ['ft:o', '🐝 Pollinators'], ['ft:p', '🐛 Pest helpers'], ['ft:m', '⚕️ Medicinal'], ['ft:e', '🍽 Edible'], ['ft:f', '🪻 Fragrant'], ['ft:h', '🐦 Hummingbirds'], ['ft:g', '🛡 Gopher resistant'], ['ft:d', '💐 Dried']];
const LHERB = [['herbs', '🌿 All herbs'], ['cul', '🍳 Culinary'], ['spice', '🌶 Spices'], ['tea', '🍵 Tea'], ['med', '⚕️ Medicinal'], ['aro', '🌸 Aromatic']];
function lcatChips() { return [['all', 'All'], ['now', '🌱 Plant now']].concat(LHERB, LFLOW, LKCHIPS, CAT_NAMES.filter(a => a[0] !== 'h' && a[0] !== 'fl' && a[0] !== 'su')).map(a => '<button class="chip' + ((UI.lcat || 'all') === a[0] ? ' on' : '') + '" data-act="lcat" data-v="' + a[0] + '">' + a[1] + '</button>').join(''); }
function libList() {
  const q = (UI.lq || '').trim().toLowerCase(), cat = UI.lcat || 'all';
  const herbCat = LHERB.some(a => a[0] === cat), flCat = LFLOW.some(a => a[0] === cat), L = PLANTS.filter(p => (cat === 'all' || cat === 'now' || (landCat(cat) ? landMatch(cat, p) : flCat ? (cat === 'flowers' ? p.flw : p.flw && FLOWER_INFO[p.id].tags.indexOf(cat.slice(3)) >= 0) : herbCat ? (cat === 'herbs' ? (p.herb || p.cat === 'h') : (HERB_INFO[p.id] && HERB_INFO[p.id].tags.indexOf(cat) >= 0)) : p.cat === cat)) && (!q || (landText(LAND_INFO[p.id]) + ' ' + p.n + ' ' + p.vars + ' ' + CATS[p.cat] + (HERB_INFO[p.id] ? ' ' + HERB_INFO[p.id].uses + ' ' + HERB_INFO[p.id].parts : '') + (FLOWER_INFO[p.id] ? ' ' + FLOWER_INFO[p.id].uses + ' ' + FLOWER_INFO[p.id].colors : '')).toLowerCase().indexOf(q) >= 0) && (cat !== 'now' || (plantWindow(p) || {}).state === 'now'));
  return L.map(p => { const w = plantWindow(p); return '<button class="prow" data-act="plantInfo" data-v="' + p.id + '"><span class="pe">' + p.e + '</span><span class="pt"><b>' + esc(p.n) + '</b> <small>' + CATS[p.cat] + ' · ' + SUNN[p.sun].toLowerCase() + (HERB_INFO[p.id] ? ' · ' + HERB_INFO[p.id].tags.map(t => (HERB_TAGS[t] || t).toLowerCase()).join(', ') : LAND_INFO[p.id] ? ' · ' + landTagList(p, 3) : p.flw ? ' · ' + FLOWER_INFO[p.id].tags.slice(0, 3).map(t => (FLOWER_TAGS[t] || t).replace(/^\S+\s/, '').toLowerCase()).join(', ') : '') + '</small><br><small class="' + (w ? 'w' + w.state : '') + '">' + (zoneOk(p) ? '' : '⚠ not hardy in your zone. ') + (w ? esc(w.text) : '') + '</small></span></button>'; }).join('') || '<p class="dim pad">Nothing matches.</p>';
}
CHG.lq = el => { UI.lq = el.value; $('#llist').innerHTML = libList(); };
ACT.lcat = el => { UI.lcat = el.dataset.v; $('#ldis').textContent = lDis(); $('#lcats').innerHTML = lcatChips(); $('#llist').innerHTML = libList(); };

function render() {
  if (!S.setup) { renderSetup(); return; }
  const sy = window.scrollY, same = render.last === UI.tab; let body = '';
  if (UI.tab === 'garden') body = (typeof householdCards === 'function' ? householdCards() : '') + alertBanner() + startCard() + syncChip() + gardenTab() + digestCard() + todayCard(); else if (UI.tab === 'plan') body = planTab(); else if (UI.tab === 'plants') body = plantsTab(); else if (UI.tab === 'sky') body = skyTab(); else if (UI.tab === 'fungi') body = fungiTab(); else if (UI.tab === 'fix') body = fixTab(); else body = gopherTab();
  $('#view').innerHTML = header() + body;
  $('#tabs').innerHTML = TABS.map(t => '<button data-tab="' + t[0] + '" class="' + (UI.tab === t[0] ? 'on' : '') + '"><span class="ti">' + t[1] + '</span>' + t[2] + '</button>').join('');
  if (UI.tab === 'garden' || (UI.tab === 'fungi' && UI.fsub === 'grow' && fgarden())) mountGarden(); else if (UI.tab === 'plan') mountPlan(); else if (UI.tab === 'sky') mountSky(); else if (UI.tab === 'gopher') mountGopher();
  render.last = UI.tab; if (same) window.scrollTo(0, sy);
}

/* ---------- location form and setup ---------- */
function doyOf(d) { return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 1)) / MS) + 1; }
function locForm() {
  const L = S.loc, F = frostDates(), y = NOW().getFullYear(), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return '<div id="locform"><p class="sm"><b>' + esc(L.name || 'Location not set yet') + '</b><br><span class="dim">' + (L.src === 'history' ? 'Frost dates come from 5 years of weather at your location.' : L.src === 'manual' ? 'Dates set by you.' : 'Frost dates are an estimate from your latitude. Please check them against your local knowledge.') + '</span></p>' +
    '<div class="row"><input class="in" id="zip" placeholder="ZIP code (US)" inputmode="numeric" maxlength="5" value="' + esc(L.zip || '') + '"><button class="btn" data-act="setZip">Look up</button></div><button class="btn block" data-act="setGeo">📍 Use my location</button><p class="sm dim" id="locmsg"></p>' +
    '<div class="grid2"><label class="fl">Last spring frost<input class="in" type="date" id="fl" data-chg="frostDates" value="' + iso(F.last) + '"></label><label class="fl">First fall frost<input class="in" type="date" id="ff" data-chg="frostDates" value="' + iso(F.first) + '"></label></div>' +
    '<label class="fl">Hardiness zone<select class="in" data-chg="zonePick"><option value="">Not sure</option>' + Object.keys(ZONES).map(z => '<option' + (L.zone === z ? ' selected' : '') + '>' + z + '</option>').join('') + '</select></label><p class="sm dim">Picking a zone fills typical frost dates for it. Fine-tune them above using what you know from experience.</p></div>';
}
function setMsg(t) { const e = $('#locmsg'); if (e) e.textContent = t; }
function refreshLocForm() { const e = $('#locform'); if (e) e.outerHTML = locForm(); }
ACT.setZip = async () => {
  const zip = ($('#zip').value || '').trim(); if (!/^\d{5}$/.test(zip)) { setMsg('Enter a 5-digit US ZIP code.'); return; } setMsg('Looking up…');
  try { const r = await lookupZip(zip); setMsg('Found ' + r.name + '. Getting frost dates…'); const how = await refineLocation({ lat: r.lat, lon: r.lon, name: r.name, zip }); refreshLocForm(); setMsg(how === 'history' ? 'Done. Dates are based on local weather history.' : 'Done. Dates are estimated; adjust them if you know better.'); }
  catch (e) { setMsg('Could not look that up (are you online?). You can still pick your zone or enter dates by hand below.'); }
};
ACT.setGeo = () => {
  if (!navigator.geolocation) { setMsg('Location is not available. Use a ZIP code or pick your zone below.'); return; } setMsg('Asking for your location…');
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = +pos.coords.latitude.toFixed(3), lon = +pos.coords.longitude.toFixed(3); let name = 'Near ' + lat.toFixed(1) + ', ' + lon.toFixed(1);
    try { const j = await fetchJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=en'); if (j.city || j.locality) name = (j.city || j.locality) + (j.principalSubdivisionCode ? ', ' + j.principalSubdivisionCode.split('-').pop() : ''); } catch (e) {}
    const how = await refineLocation({ lat, lon, name }); refreshLocForm(); setMsg(how === 'history' ? 'Got it. Dates are based on local weather history.' : 'Got it. Dates are estimated from latitude; adjust if needed.');
  }, () => setMsg('Location was blocked. Use a ZIP code, or pick your zone below.'), { timeout: 12000, maximumAge: 600000 });
};
CHG.frostDates = () => { const a = $('#fl').value, b = $('#ff').value; if (a) S.loc.last = doyOf(pd(a)); if (b) S.loc.first = doyOf(pd(b)); S.loc.src = 'manual'; save(); };
CHG.zonePick = el => { const z = el.value; if (z) { const t = ZONES[z]; S.loc.zone = z; S.loc.last = t[0]; S.loc.first = t[1]; S.loc.src = 'manual'; } else S.loc.zone = ''; save(); refreshLocForm(); };
ACT.locSheet = () => openSheet('Your location and season', locForm() + '<button class="btn gold block" data-act="closeSheet">Done</button>');
const PRESETS = [['bed', 'Raised bed 4 × 8 ft', 8, 4, 1], ['yard', 'Backyard 20 × 30 ft', 10, 15, 2], ['big', 'Big garden 40 × 60 ft', 12, 18, 3.34], ['farm', 'Acre farm or orchard', 21, 21, 10]];
function renderSetup() {
  UI.step = UI.step || 1; let h = '<div class="hero"><img src="img/seal.png" alt=""><h1>Hortica</h1><p class="dim">Garden, orchard and farm planner</p></div>';
  if (UI.step === 1) h += '<section class="card"><div class="ct"><span>Where do you grow?</span></div><p class="sm">Frost dates, hardiness zone and weather decide what to plant and when. Hortica works offline once set up.</p>' + locForm() + '<button class="btn gold block" data-act="setNext">Continue</button></section>';
  else h += '<section class="card"><div class="ct"><span>How big is your plot?</span></div><p class="sm dim">You build your map tile by tile. Pick a starting size; you can change it any time.</p><div class="chips c">' + PRESETS.map(p => '<button class="chip' + (UI.preset === p[0] ? ' on' : '') + '" data-act="preset" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
    '<label class="fl">Garden name<input class="in" id="sn" value="' + esc(UI.sname || 'Home garden') + '"></label><label class="fl">Soil<select class="in" id="ss">' + Object.keys(SOILS).map(k => '<option value="' + k + '"' + (S.settings.soil === k ? ' selected' : '') + '>' + SOILS[k].n + '</option>').join('') + '</select></label><p class="sm dim">Not sure? Choose Loam. Squeeze a damp handful: if it holds a shape and crumbles when poked, it is loam. Sticky ribbon is clay; falls apart is sand.</p><button class="btn gold block" data-act="setFinish">Plant my first garden</button><button class="btn block" data-act="setStart">✨ Plan it for me instead</button><button class="btn block" data-act="setBack">Back</button></section>';
  $('#view').innerHTML = h; $('#tabs').innerHTML = '';
}
ACT.setNext = () => { UI.step = 2; UI.preset = UI.preset || 'yard'; renderSetup(); window.scrollTo(0, 0); };
ACT.setBack = () => { UI.step = 1; renderSetup(); };
ACT.preset = el => { UI.preset = el.dataset.v; UI.sname = $('#sn').value; renderSetup(); };
ACT.setStart = () => { ACT.setFinish(); setTimeout(() => ACT.startOpen(), 250); };
ACT.setFinish = () => {
  const p = PRESETS.find(x => x[0] === (UI.preset || 'yard')); S.settings.soil = $('#ss').value; const g = newGarden($('#sn').value.trim() || 'Home garden', p[2], p[3], p[4]); g.soil = S.settings.soil;
  S.gardens = [g]; S.cur = g.id; S.curBy = { veg: g.id }; S.setup = true; save(); UI.tab = 'garden'; render(); toast('Garden ready. Pick a plant and start painting tiles.', 4000); refreshWx().then(() => { if (!sheetOpen()) render(); });
};

/* ---------- menu, wisdom, settings ---------- */
ACT.menu = () => openSheet('Menu', [['startOpen', '✨', 'Start here: plan it for me', 'Answer 5 questions, get a starter garden'], ['remindOpen', '🔔', 'Reminders', 'Frost, planting, best hours in your phone calendar'], ['syncOpen', '🔄', 'Sync and share', 'Two devices, or share a garden with someone'], ['occOpen', '🏡', 'Household', 'Link Healthica and Saturnica, shared calendar, ritual of the day'], ['askOpen', '🔧', 'Ask the gardener', 'Tools, plants, problems, old-timer advice'], ['wisdom', '🌾', 'Old-timer wisdom', 'Traditional farm practice'], ['fungiLib', '🍄', 'Mushroom and spore library', 'Species, grow space, spore watchdog'], ['fungiHow', '🎓', 'Mushroom how-to for beginners', 'Kits, spawn, spores, fruiting, safety'], ['herbLib', '🌿', 'Herb library', 'Spices, seasonings, teas, traditional medicinals'], ['herbGarden', '🪴', 'My herb garden map', 'Build it tile by tile'], ['flowerGarden', '🌸', 'My flower garden map', 'On its own, or on top of your farm or herb map'], ['auditOpen', '🧾', 'Full audit before planting', 'Conflicts in water, sun, soil, spacing and neighbors'], ['skyOpen', '🌙', 'Almanac, forecast and best times', 'Planetary hours, moon signs, weather'], ['soilsheet', '🧪', 'Soil and planting temperatures', 'Soil types, when the ground is warm enough'], ['hvOpen', '🧺', 'Log a harvest', 'Record what you picked'], ['seedOpen', '🌰', 'Seed shelf', 'What seed you have and what to buy'], ['journal', '📓', 'Garden journal', 'What you planted and did'], ['settings', '⚙️', 'Settings and backup', 'Location, AI key, export']].map(a => '<button class="mrow" data-act="' + a[0] + '"><span class="me">' + a[1] + '</span><span><b>' + a[2] + '</b><br><small class="dim">' + a[3] + '</small></span></button>').join(''));
ACT.fungiLib = () => { UI.fsub = 'lib'; setTab('fungi'); };
ACT.fungiHow = () => { UI.fsub = 'how'; setTab('fungi'); };
ACT.herbLib = () => { UI.lcat = 'herbs'; setTab('plants'); };
ACT.herbGarden = () => { UI.gk = 'herb'; setTab('garden'); };
ACT.wisdom = () => {
  const tags = ['All'].concat(WISDOM.map(w => w.tag).filter((v, i, a) => a.indexOf(v) === i)); UI.wtag = UI.wtag || 'All';
  const body = () => WISDOM.filter(w => UI.wtag === 'All' || w.tag === UI.wtag).map(w => '<div class="flag"><b>' + esc(w.t) + '</b> <span class="tag">' + w.tag + '</span><br><span class="sm">' + esc(w.b) + '</span></div>').join('');
  openSheet('Old-timer wisdom', '<p class="sm dim">Traditional practice from Amish, Pennsylvania Dutch and other old-time farm families, collected as common knowledge. Practices with solid science behind them are marked in the text; moon and weather lore is folklore, kept for the fun and the discipline.</p><div class="chips nowrap" id="wtags">' + tags.map(t => '<button class="chip' + (UI.wtag === t ? ' on' : '') + '" data-act="wtag" data-v="' + t + '">' + t + '</button>').join('') + '</div><div id="wbody">' + body() + '</div>');
};
ACT.wtag = el => { UI.wtag = el.dataset.v; $$('#wtags .chip').forEach(c => c.classList.toggle('on', c.dataset.v === UI.wtag)); $('#wbody').innerHTML = WISDOM.filter(w => UI.wtag === 'All' || w.tag === UI.wtag).map(w => '<div class="flag"><b>' + esc(w.t) + '</b> <span class="tag">' + w.tag + '</span><br><span class="sm">' + esc(w.b) + '</span></div>').join(''); };
ACT.soilsheet = () => openSheet('Soil, seeds and temperature', '<h3 class="h3">Soil types</h3>' + Object.keys(SOILS).map(k => '<div class="flag"><b>' + SOILS[k].n + '</b><br><span class="sm">' + esc(SOILS[k].d) + '</span></div>').join('') + '<h3 class="h3">Soil temperature for sowing</h3><table class="tt"><tr><th>Crop</th><th>Min</th><th>Ideal</th></tr>' + SOILTEMP.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '°F</td><td>' + r[2] + '°F</td></tr>').join('') + '</table><p class="sm dim">Push a thermometer 4 inches down at 9 a.m. for three mornings in a row.</p><h3 class="h3">Soil amendments</h3>' + Object.keys(AMEND).map(k => '<div class="flag"><b>' + AMEND[k][0] + '</b><br><span class="sm">' + esc(AMEND[k][1]) + '. ' + esc(AMEND[k][2]) + '</span></div>').join(''));
ACT.journal = () => openSheet('Garden journal', S.log.length ? S.log.map(l => '<div class="nrow"><span class="dim sm">' + fmtD(pd(l.d)) + '</span> ' + esc(l.msg) + '</div>').join('') : '<p class="dim">Nothing yet. Planting, kills and other events land here.</p>');
ACT.settings = () => {
  const s = S.settings;
  openSheet('Settings', '<div class="sh-sec"><b>Location and season</b><button class="btn block" data-act="locSheet">Edit location and frost dates</button></div>' +
    '<div class="sh-sec"><label class="tog"><input type="checkbox" data-chg="smoon" ' + (s.moon ? 'checked' : '') + '><span>Show the moon and old-timer moon advice</span></label><label class="tog"><input type="checkbox" data-chg="snight" ' + (S.sky.night ? 'checked' : '') + '><span>Include night hours when suggesting the best time to plant</span></label><label class="tog"><input type="checkbox" data-chg="sound" ' + (s.sound ? 'checked' : '') + '><span>Victory fanfare and vibration</span></label></div>' +
    '<div class="sh-sec"><b>Garden Sage (AI)</b><p class="sm dim">Optional. Paste your own Anthropic API key to ask free-form questions. The key stays on this device and is sent only to Anthropic. Questions cost you a few cents each. Without a key the app uses its built-in library.</p><input class="in" type="password" id="akey" placeholder="sk-ant-..." value="' + esc(s.apiKey) + '" autocomplete="off"><label class="fl">Model<select class="in" id="amodel"><option value="claude-sonnet-5-5"' + (s.model === 'claude-sonnet-5-5' ? ' selected' : '') + '>Claude Sonnet 5.5 (balanced)</option><option value="claude-haiku-5-5"' + (s.model === 'claude-haiku-5-5' ? ' selected' : '') + '>Claude Haiku 5.5 (fastest, cheapest)</option><option value="claude-opus-5-5"' + (s.model === 'claude-opus-5-5' ? ' selected' : '') + '>Claude Opus 5.5 (deepest)</option></select></label><button class="btn block" data-act="saveKey">Save AI settings</button></div>' +
    '<div class="sh-sec"><b>Backup</b><p class="sm dim">Everything lives on this phone. Export a copy now and then.</p><div class="row"><button class="btn" data-act="exportData">Export</button><label class="btn filebtn">Import<input type="file" accept="application/json" data-chg="importData" hidden></label></div></div>' +
    '<div class="sh-sec"><button class="btn danger block" data-act="resetAll">Erase everything</button></div><p class="foot">Hortica is a planning aid. Frost dates and advice are estimates: check with your local extension office for your area.</p>');
};
CHG.smoon = el => { S.settings.moon = el.checked; save(); };
CHG.snight = el => { S.sky.night = el.checked; save(); };
ACT.saveKey = () => { S.settings.apiKey = $('#akey').value.trim(); S.settings.model = $('#amodel').value; save(); toast(S.settings.apiKey ? 'Saved. The Garden Sage is ready.' : 'Key removed.'); };
ACT.exportData = () => { try { const b = new Blob([JSON.stringify(Object.assign({}, S, { settings: Object.assign({}, S.settings, { apiKey: '' }) }), null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'hortica-backup-' + dkey() + '.json'; document.body.appendChild(a); a.click(); a.remove(); toast('Backup saved to your downloads.'); } catch (e) { toast('Could not export on this device.'); } };
CHG.importData = el => { const f = el.files && el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const j = JSON.parse(r.result); if (!j.v || !j.gardens) throw 0; const key = S.settings.apiKey; S = Object.assign(blank(), j); S.settings = Object.assign(blank().settings, j.settings, { apiKey: key }); save(); closeSheet(); toast('Backup restored.'); } catch (e) { toast('That file is not a Hortica backup.'); } }; r.readAsText(f); };
ACT.resetAll = el => { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = 'Tap again to erase all gardens and settings'; return; } try { localStorage.removeItem(KEY); } catch (e) {} S = blank(); UI.step = 1; closeSheetQuiet(); render(); };
