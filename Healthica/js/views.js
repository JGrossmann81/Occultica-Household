/* Healthica views: HTML builders for each tab, sheets and the body map. */
const UI = { tab: 'today', date: dkey(), seg: 'diary', view: 'front', range: 7, muscle: null };
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
function defaultMeal() { const h = new Date().getHours(); return h < 10 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snacks'; }
const LA = { lat: 34.05, lon: -118.24, name: 'Los Angeles (default)' };
const loc = () => S.settings.loc || LA;

/* ---------- small icons ---------- */
const PI = {
  Sun: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  Moon: '<path d="M16 3.5a9 9 0 1 0 4.5 11.5A7.5 7.5 0 0 1 16 3.5z"/>',
  Mars: '<circle cx="10" cy="14" r="5.5"/><path d="M14 10l6-6M15 4h5v5"/>',
  Mercury: '<circle cx="12" cy="13" r="4"/><path d="M8 3a4 4 0 0 0 8 0M12 17v5M9 20h6"/>',
  Jupiter: '<path d="M6 8c0-4 6-4 6 0 0 4-6 6-6 9h13M16 4v17"/>',
  Venus: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 18h6"/>',
  Saturn: '<path d="M7 3v13M4 6h6M7 10c4-4 8-1 7 3-1 3-3 4-3 6"/>'
};
const planetIcon = (n, s = 22) => `<svg class="pi" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PI[n]}</svg>`;
const ICON = {
  today: '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 3c-2 2-2 6 0 8v10"/>',
  train: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  body: '<path d="M4 20l5-6 4 3 7-10"/><circle cx="20" cy="7" r="1.5"/>',
  log: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const icon = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

/* ---------- sheets ---------- */
function openSheet(title, html, opts) {
  const sh = $('#sheet'); sh.innerHTML = `<div class="sh-bar"><b>${esc(title)}</b><button class="x" data-act="closeSheet" aria-label="Close">&times;</button></div><div class="sh-body">${html}</div>`;
  sh.classList.add('open'); document.body.classList.add('noscroll'); sh.scrollTop = 0; if (opts && opts.mount) opts.mount(sh);
}
function closeSheet() { $('#sheet').classList.remove('open'); document.body.classList.remove('noscroll'); if (window.MED && window.MED.stop) window.MED.stop(); render(); }
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms); }

/* ---------- today ---------- */
function planetCard() {
  const L = loc(), p = planetaryNow(new Date(), L.lat, L.lon), th = PLANET_THEME[p.hourRuler];
  return `<section class="card planet">
    <div class="pl-row"><div class="pl-badge">${planetIcon(p.hourRuler, 30)}</div>
      <div class="pl-txt"><div class="pl-h">Hour of ${p.hourRuler} <span class="dim">· ${p.isDay ? 'day' : 'night'} hour ${p.hourNumber}</span></div>
        <div class="dim sm">${fmtTime(p.from)} to ${fmtTime(p.until)}, then ${p.nextRuler}</div></div>
      <div class="pl-day"><div class="sm dim">${p.dayName}</div><div class="pl-d">${planetIcon(p.dayRuler, 16)} ${p.dayRuler}</div></div></div>
    <p class="th"><b>${th[0]}.</b> ${th[1]}</p>
    <div class="sm dim">Sunrise ${fmtTime(p.sunrise)} · Sunset ${fmtTime(p.sunset)} · ${esc(L.name || 'Your location')}${S.settings.loc ? '' : ' <a class="lnk" data-act="useLoc">Use my location</a>'}</div>
  </section>`;
}
function ringSVG(eaten, budget, burned) {
  const total = Math.max(1, budget + burned), pct = Math.min(1, eaten / total), r = 54, c = 2 * Math.PI * r;
  const left = Math.round(budget + burned - eaten), over = left < 0;
  return `<svg viewBox="0 0 140 140" class="ring"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--line)" stroke-width="12"/>
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="${over ? 'var(--red)' : 'var(--gold)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 70 70)"/>
    <text x="70" y="68" text-anchor="middle" class="rn" fill="${over ? 'var(--red)' : 'var(--text)'}">${Math.abs(left)}</text>
    <text x="70" y="88" text-anchor="middle" class="rl">${over ? 'over' : 'left'}</text></svg>`;
}
function meter(label, val, target, unit, col, hint) {
  const pct = Math.min(100, Math.round(val / Math.max(1, target) * 100));
  return `<div class="meter"><div class="mt"><b>${label}</b><span>${Math.round(val)} / ${Math.round(target)} ${unit}</span></div><div class="bar"><i style="width:${pct}%;background:${col}"></i></div>${hint ? `<div class="sm dim">${hint}</div>` : ''}</div>`;
}
function todayPlan() {
  const k = dkey(), wd = new Date().getDay(); let id = S.settings.schedule[wd] || 'rest';
  const sug = suggestSplit(id), done = workoutsOn(k).length > 0;
  return { id, sug, done };
}
function suggestSplit(scheduled) {
  const last = lastTrained(S.workouts), now = Date.now(); const hrs = m => last[m] ? (now - last[m]) / 36e5 : 999;
  const ms = SPLITS[scheduled] ? SPLITS[scheduled][1] : [];
  if (!ms.length || Math.min.apply(null, ms.map(hrs)) >= 36) return { id: scheduled, swapped: false };
  let best = null;
  ['legs', 'arms', 'back', 'chest', 'core'].forEach(s => { const r = Math.min.apply(null, SPLITS[s][1].map(hrs)); if (!best || r > best.r) best = { id: s, r }; });
  return best && best.r >= 36 ? { id: best.id, swapped: true, from: scheduled } : { id: 'active', swapped: true, from: scheduled };
}
function trainCard() {
  const pl = todayPlan(), sp = SPLITS[pl.sug.id] || SPLITS.rest;
  let msg = pl.done ? 'Today\'s session is logged. Nice work. Eat well and rest up.' : (pl.sug.id === 'rest' ? 'Recovery is when you get stronger. Walk, stretch, sleep.' : pl.sug.id === 'active' ? 'A walk, light mobility or yoga keeps you moving without taxing tired muscles.' : sp[1].length ? 'Muscles: ' + sp[1].map(m => MUSCLES[m]).join(', ') : 'Pick any cardio you enjoy.');
  if (pl.sug.swapped && !pl.done) msg = `Planned ${SPLITS[pl.sug.from][0].toLowerCase()}, but those muscles are still recovering. Today works better as ${sp[0].toLowerCase()}. ` + msg;
  return `<section class="card"><div class="ct"><span>${icon('train', 18)} Today's training</span></div><h2 class="big">${sp[0]}</h2><p class="dim">${msg}</p>
    <div class="row"><button class="btn gold" data-act="workout" data-split="${pl.sug.id}">Log strength</button><button class="btn" data-act="cardio">Log cardio</button><button class="btn" data-act="quickWorkout">Quick log</button></div></section>`;
}
function nudgeList() {
  const k = dkey(), t = totalsOn(k), b = budgetInfo(), now = new Date(), h = now.getHours(), out = [];
  const m = b.macros, w = S.weights.some(x => x.date === k);
  if (!w && h >= 6) out.push(['Weigh in', 'Step on the scale once this morning. Daily numbers wobble, the trend is what counts.', 'Body']);
  if (h >= 11 && foodsOn(k).length === 0) out.push(['Log your first meal', 'Nothing logged yet today. Even a rough entry helps.', 'Food']);
  if (h >= 14 && t.veg < m.veg * 0.4) out.push(['Add veggies', `You have ${Math.round(t.veg)} g of veggies so far. Aim for about ${m.veg} g. Try a big salad, broccoli or green beans next meal.`, 'Food']);
  if (h >= 16 && t.p < m.p * 0.6) out.push(['Protein is behind', `${Math.round(t.p)} of ${m.p} g so far. ${PROTEIN_IDEAS()} will close the gap.`, 'Food']);
  if (h >= 12 && waterOn(k) < 4) out.push(['Water', 'Sip some water. Tap the cup button to count a glass.', 'Today']);
  const bud = b.budget + burnedOn(k) - t.kcal; if (t.kcal > 0 && bud < -100) out.push(['A little over today', 'No stress. A walk or a lighter dinner balances it, and tomorrow is a fresh page.', 'Food']);
  const pl = todayPlan(); if (h >= 17 && !pl.done && !['rest', 'active'].includes(pl.sug.id)) out.push(['Training time', `${SPLITS[pl.sug.id][0]} is on today's plan. Even 20 minutes counts.`, 'Train']);
  const days = [0, 1, 2, 3, 4].map(i => workoutsOn(addDays(k, -i)).length > 0); if (days.slice(0, 4).every(Boolean)) out.push(['Take a rest day', 'Four training days in a row. Muscles grow while you rest. Walk, stretch and sleep well.', 'Train']);
  if (h >= 18 && mindOn(k) === 0) out.push(['Breathe', 'Take 3 quiet minutes to meditate before the evening wind-down.', 'Meditate']);
  const sl = S.logs.filter(l => l.date === addDays(k, -1) && (S.trackers.find(t => t.id === l.trackerId) || {}).name === 'Sleep');
  if (sl.length && +sl[0].value < 6.5) out.push(['Low sleep last night', 'Go easy today. Hydrate, eat protein and aim for an earlier night.', 'Rest']);
  const ins = nutrientInsights(); if (ins.low.length) { const x = ins.low[0]; out.push([`Low on ${NUTS[x.k][0]}`, `Your 7-day average is ${x.pct}% of the target. ${x.foods.map(f => f.name).slice(0, 3).join(', ')} would help.`, 'Nutrients']); }
  return out.slice(0, 5);
}
function installTip() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent), stand = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (stand || S.settings.tipOff || !location.protocol.startsWith('http')) return '';
  return `<section class="card tip"><b>Put Healthica on your Home Screen</b><div class="sm">${ios ? 'In Safari tap the Share button, then "Add to Home Screen".' : 'In Chrome open the menu, then "Install app" or "Add to Home screen".'} It then opens full screen like an app and works offline.</div><button class="mini" data-act="dismissTip">Got it</button></section>`;
}
function viewToday() {
  const k = dkey(), t = totalsOn(k), b = budgetInfo(), burned = burnedOn(k), m = b.macros, st = streak(), name = S.profile ? S.profile.name : '';
  const nud = nudgeList();
  return `<div class="hd"><img src="img/seal.png" alt="" class="logo"><div><h1>Healthica</h1><div class="sm dim">${esc(name ? 'Hello, ' + name + '.' : 'Welcome.')} ${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>${typeof profChip === 'function' ? profChip() : ''}<button class="gear" data-act="settings" aria-label="Settings">${icon('gear', 24)}</button></div>
  ${installTip()}${typeof diaCard === 'function' ? diaCard() : ''}${typeof rpTodayCard === 'function' ? rpTodayCard() : ''}${typeof profCard === 'function' ? profCard() : ''}${typeof hhTodayCard === 'function' ? hhTodayCard() : ''}${typeof patTodayCard === 'function' ? patTodayCard() : ''}${window.OCC ? OCC.ritualHTML('healthica') : ''}${planetCard()}${pepTodayCard()}${modeCard()}${tonightCard()}${changesCard()}
  <section class="card"><div class="cheer">${esc(cheerOfDay())}</div>${st > 1 ? `<div class="sm gold">${st}-day logging streak. Keep it going.</div>` : ''}</section>
  <section class="card"><div class="ct"><span>Calories</span><a class="lnk" data-act="goFood">Add food</a></div>
    <div class="calrow">${ringSVG(t.kcal, b.budget, burned)}<div class="calstats"><div><b>${b.budget}</b><span>Budget</span></div><div><b>${Math.round(t.kcal)}</b><span>Eaten</span></div><div><b>${burned}</b><span>Exercise</span></div></div></div>
    ${b.floored ? `<div class="sm warn">Budget held at the safe minimum of ${b.floor} kcal. A gentler pace is healthier.</div>` : ''}</section>
  <section class="card"><div class="ct"><span>Eat well</span></div>
    ${meter('Protein', t.p, m.p, 'g', 'var(--red)', S.settings.vegan ? 'Tofu, tempeh, lentils, beans, plant shakes' : (t.meat ? `${Math.round(t.meat)} g of meat and fish today` : 'Meats, fish, eggs, yogurt, shakes'))}
    ${meter('Veggies', t.veg, m.veg, 'g', 'var(--green)', 'About 5 handfuls a day')}
    ${meter('Carbs', t.c, m.c, 'g', 'var(--gold)', 'Simple carbs: rice, potato, oats, fruit')}
    ${meter('Fat', t.f, m.f, 'g', 'var(--blue)', '')}
    ${meter('Fibre', t.fib, m.fib, 'g', 'var(--sage)', '')}</section>
  ${trainCard()}
  <section class="card"><div class="ct"><span>Quick actions</span></div><div class="qa">
    <button data-act="addFoodNow">${icon('food', 22)}<span>Food</span></button>
    <button data-act="water"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/></svg><span>Water ${waterOn(k)}</span></button>
    <button data-act="goBody">${icon('body', 22)}<span>Weigh in</span></button>
    <button data-act="meditate"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg><span>Meditate ${mindOn(k) ? mindOn(k) + 'm' : ''}</span></button><button data-act="symOpen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/></svg><span>Symptoms</span></button></div></section>
  <section class="card"><div class="ct"><span>Tools</span></div><div class="row wrap"><button class="btn" data-act="iceOpen">✚ Emergency card</button><button class="btn" data-act="rpOpen">📋 Doctor reports</button><button class="btn" data-act="patOpen">🔎 Patterns</button><button class="btn" data-act="profOpen">👥 People</button><button class="btn" data-act="occOpen">🏡 Household</button></div></section>
  ${nud.length ? `<section class="card"><div class="ct"><span>Gentle reminders</span></div>${nud.map(n => `<div class="nudge"><b>${esc(n[0])}</b><div class="sm dim">${esc(n[1])}</div></div>`).join('')}</section>` : ''}
  <p class="foot">Healthica is for general wellness and is not medical advice. Talk to your doctor before changing your diet, exercise or supplements.</p>`;
}

/* ---------- food ---------- */
function dayNav(k) {
  const lbl = k === dkey() ? 'Today' : k === addDays(dkey(), -1) ? 'Yesterday' : parseKey(k).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `<div class="daynav"><button data-act="dayPrev" aria-label="Previous day">&lsaquo;</button><b>${lbl}</b><button data-act="dayNext" aria-label="Next day" ${k >= dkey() ? 'disabled' : ''}>&rsaquo;</button></div>`;
}
function viewFood() {
  const k = UI.date, t = totalsOn(k), b = budgetInfo(), burned = burnedOn(k);
  const seg = `<button class="btn block" data-act="kitchen">Kitchen: recipes, shopping list and ideas</button><div class="seg"><button class="${UI.seg === 'diary' ? 'on' : ''}" data-act="seg" data-v="diary">Diary</button><button class="${UI.seg === 'nutrients' ? 'on' : ''}" data-act="seg" data-v="nutrients">Vitamins</button></div>`;
  let body = '';
  if (UI.seg === 'diary') {
    body += `<section class="card sum"><div><b>${Math.round(t.kcal)}</b><span>eaten</span></div><div><b>${b.budget + burned}</b><span>allowed</span></div><div><b class="${b.budget + burned - t.kcal < 0 ? 'red' : ''}">${Math.round(b.budget + burned - t.kcal)}</b><span>left</span></div></section>
    <div class="macrorow"><span><i style="background:var(--red)"></i>P ${Math.round(t.p)}g</span><span><i style="background:var(--gold)"></i>C ${Math.round(t.c)}g</span><span><i style="background:var(--blue)"></i>F ${Math.round(t.f)}g</span><span><i style="background:var(--green)"></i>Veg ${Math.round(t.veg)}g</span></div>`;
    MEALS.forEach(meal => {
      const es = foodsOn(k).filter(e => e.meal === meal), kc = es.reduce((s, e) => s + e.kcal, 0);
      body += `<section class="card"><div class="ct"><span>${meal} <span class="dim">${Math.round(kc)} kcal</span></span><button class="mini" data-act="addFood" data-meal="${meal}">+ Add</button></div>
      ${es.length ? es.map(e => `<div class="entry" data-act="editEntry" data-id="${e.id}"><div><b>${esc(e.name)}</b><div class="sm dim">${e.label ? esc(e.label) + ' · ' : ''}${Math.round(e.grams)} g · P ${Math.round(e.p)} C ${Math.round(e.c)} F ${Math.round(e.f)}</div></div><div class="kc">${Math.round(e.kcal)}</div></div>`).join('') : '<div class="sm dim">Nothing yet.</div>'}</section>`;
    });
  } else body += nutrientsHTML();
  return `<div class="hd2"><h1>Food</h1></div>${seg}${UI.seg === 'diary' ? dayNav(k) : ''}${body}`;
}
function nutrientInsights() {
  const k = dkey(), by = {}; for (let i = 0; i < 7; i++) { const d = addDays(k, -i); const es = foodsOn(d); if (es.length) by[d] = es; }
  const b = budgetInfo(), av = nutrientAverages(by, b.budget), rda = rdaFor(prof()), rows = [], low = [];
  if (av.days >= 3) NUT_KEYS.forEach(key => {
    const pct = Math.round(av.avg[key] / rda[key] * 100); rows.push({ k: key, pct, avg: av.avg[key], rda: rda[key] });
    if (pct < 70) low.push({ k: key, pct, foods: topFoodsFor(allFoods().filter(foodOk), key, rda) });
  });
  low.sort((a, b) => a.pct - b.pct);
  return { days: av.days, rows, low, rda };
}
function nutrientsHTML() {
  const ins = nutrientInsights();
  if (ins.days < 3) return `<section class="card"><p>Log your food for at least 3 days and Healthica will show which vitamins and minerals you are getting, and which to add.</p><p class="sm dim">Days counted so far: ${ins.days}</p></section>`;
  const bars = ins.rows.map(r => `<div class="nb"><div class="mt"><b>${NUTS[r.k][0]}</b><span>${Math.round(r.pct)}% <span class="dim">(${r.avg >= 10 ? Math.round(r.avg) : round(r.avg, 1)} / ${r.rda} ${NUTS[r.k][1]})</span></span></div><div class="bar"><i style="width:${Math.min(100, r.pct)}%;background:${r.pct < 70 ? 'var(--red)' : r.pct < 90 ? 'var(--gold)' : 'var(--green)'}"></i></div></div>`).join('');
  const low = ins.low.length ? ins.low.map(x => `<div class="nudge"><b>Add more ${NUTS[x.k][0]}</b><div class="sm dim">${esc(nutTip(x.k))}</div><div class="sm">Top picks per serving: ${x.foods.map(f => `${esc(f.name)} (${f.pct}%)`).join(', ')}</div></div>`).join('') : '<p>Nicely done. Every tracked nutrient is on target.</p>';
  return `<section class="card"><div class="ct"><span>7-day average vs daily target</span></div><div class="sm dim">Based on ${ins.days} logged days. Foods you did not log are not counted, so treat this as a guide.</div>${bars}</section>
  <section class="card"><div class="ct"><span>Suggestions</span></div>${low}${S.settings.vegan ? '<p class="sm">Vegan reminder: B12 does not come reliably from plants. Fortified foods or a supplement are the norm. Ask your doctor about B12, vitamin D, iron, iodine and omega-3.</p>' : ''}<p class="sm dim">Food first. Before adding any supplement, talk to your doctor, and a blood test is the only way to know a true deficiency.</p></section>`;
}

/* food sheets */
window.TMP = {};
function openAddFood(meal) {
  UI.addMeal = meal || defaultMeal(); UI.cat = 'all'; window.TMP = {};
  const cats = [['all', 'All'], ['meat', 'Meats'], ['fish', 'Seafood'], ['veg', 'Veggies'], ['carb', 'Carbs'], ['fruit', 'Fruit'], ['dairy', 'Eggs & dairy'], ['legume', 'Beans & tofu'], ['nut', 'Nuts & fats'], ['shake', 'Shakes'], ['drink', 'Drinks'], ['mine', 'My foods']].filter(c => !['meat', 'fish', 'dairy'].includes(c[0]) || FOODS.some(f => f.cat === c[0] && foodOk(f)));
  openSheet('Add to ' + UI.addMeal, `<input id="fs" class="in" type="search" placeholder="Search foods (chicken, broccoli, rice...)" autocomplete="off">
    <div class="chips">${cats.map(c => `<button class="chip ${c[0] === 'all' ? 'on' : ''}" data-act="cat" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>
    <div id="fres"></div><div id="onl"></div>
    <div class="row wrap"><button class="btn" data-act="online">Search online</button><button class="btn" data-act="barcode">Barcode</button><button class="btn" data-act="newFood">Create food</button><button class="btn" data-act="quickKcal">Quick calories</button></div>`,
    { mount: () => { $('#fs').addEventListener('input', renderFoodResults); renderFoodResults(); } });
}
function foodRow(f) {
  const k = f.servG / (f.per || 100);
  return `<div class="entry" data-act="pickFood" data-id="${esc(f.id)}"><div><b>${esc(f.name)}</b><div class="sm dim">${esc(f.servLabel)} · P ${round(f.p * k)}g C ${round(f.c * k)}g F ${round(f.f * k)}g${f.src ? ' · ' + f.src : ''}</div></div><div class="kc">${Math.round(f.kcal * k)}</div></div>`;
}
function renderFoodResults() {
  const q = $('#fs') ? $('#fs').value : '', el = $('#fres'); if (!el) return;
  let list = searchFoods(q, UI.cat), head = '';
  if (!q.trim() && UI.cat === 'all') { const rec = recentFoods(); if (rec.length) { list = rec; head = '<div class="sm dim lab">Recent</div>'; } }
  el.innerHTML = head + (list.length ? list.map(foodRow).join('') : '<div class="sm dim pad">No match in your foods. Try Search online.</div>');
}
function openAmount(food) {
  window.TMP.food = food; window.TMP.servings = 1;
  const k = food.servG / (food.per || 100);
  openSheet(food.name, `<div class="sm dim">${esc(food.servLabel)} = ${Math.round(food.kcal * k)} kcal</div>
    <div class="amt"><button data-act="svDec">&minus;</button><input id="sv" class="in c" type="number" inputmode="decimal" step="0.25" min="0" value="1"><button data-act="svInc">+</button></div>
    <div class="seg"><button class="on" data-act="unit" data-v="serv">Servings</button><button data-act="unit" data-v="g">Grams</button></div>
    <div id="amtprev" class="card sum"></div>
    <div class="row"><select id="mealsel" class="in">${MEALS.map(m => `<option ${m === UI.addMeal ? 'selected' : ''}>${m}</option>`).join('')}</select><button class="btn gold" data-act="saveFood">Add</button></div>`,
    { mount: () => { window.TMP.unit = 'serv'; $('#sv').addEventListener('input', updAmt); updAmt(); } });
}
function amtGrams() { const f = window.TMP.food, v = +$('#sv').value || 0; return window.TMP.unit === 'g' ? v : v * f.servG; }
function updAmt() {
  const f = window.TMP.food, g = amtGrams(), k = g / (f.per || 100);
  $('#amtprev').innerHTML = `<div><b>${Math.round(f.kcal * k)}</b><span>kcal</span></div><div><b>${round(f.p * k, 1)}</b><span>protein</span></div><div><b>${round(f.c * k, 1)}</b><span>carbs</span></div><div><b>${round(f.f * k, 1)}</b><span>fat</span></div>`;
}
function openNewFood() {
  openSheet('Create a food', `<input id="nf_name" class="in" placeholder="Name (e.g. Mom's chili)">
    <select id="nf_cat" class="in">${Object.keys(FOOD_CATS).map(c => `<option value="${c}">${FOOD_CATS[c]}</option>`).join('')}</select>
    <input id="nf_lab" class="in" placeholder="Serving (e.g. 1 bowl)" value="1 serving"><input id="nf_g" class="in" type="number" inputmode="decimal" placeholder="Serving weight in grams (optional)">
    <div class="grid2"><input id="nf_kcal" class="in" type="number" inputmode="decimal" placeholder="Calories"><input id="nf_p" class="in" type="number" inputmode="decimal" placeholder="Protein g"><input id="nf_c" class="in" type="number" inputmode="decimal" placeholder="Carbs g"><input id="nf_f" class="in" type="number" inputmode="decimal" placeholder="Fat g"><input id="nf_fib" class="in" type="number" inputmode="decimal" placeholder="Fibre g"></div>
    <details><summary>Vitamins and minerals (optional, per serving)</summary><div class="grid2">${NUT_KEYS.map(k => `<input id="nf_${k}" class="in" type="number" inputmode="decimal" placeholder="${NUTS[k][0]} ${NUTS[k][1]}">`).join('')}</div></details>
    <button class="btn gold block" data-act="saveNewFood">Save food</button>`);
}

/* ---------- train ---------- */
function bodySVG(view, loads, last) {
  const now = Date.now();
  const col = m => { const L = loads[m]; const s = L ? L.sets : 0; if (!s) return '#262046'; const a = Math.min(1, 0.28 + s / 12); return `rgba(232,200,114,${a.toFixed(2)})`; };
  const stroke = m => { const t = last[m]; return t && now - t < 36 * 36e5 ? '#d9534f' : '#5a4f8a'; };
  const sel = m => UI.muscle === m ? ' sel' : '';
  const E = (m, cx, cy, rx, ry, rot) => `<ellipse class="mu${sel(m)}" data-act="muscle" data-m="${m}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''} fill="${col(m)}" stroke="${stroke(m)}" stroke-width="1.6"/>`;
  const P = (m, pts) => `<polygon class="mu${sel(m)}" data-act="muscle" data-m="${m}" points="${pts}" fill="${col(m)}" stroke="${stroke(m)}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const R = (m, x, y, w, h, rx) => `<rect class="mu${sel(m)}" data-act="muscle" data-m="${m}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${col(m)}" stroke="${stroke(m)}" stroke-width="1.6"/>`;
  const sil = '<g fill="#1b1636" stroke="#4a3f7a" stroke-width="1.2"><circle cx="100" cy="30" r="17"/><rect x="92" y="44" width="16" height="20" rx="4"/><path d="M66 66h68q18 4 20 24l-6 66q-4 30-10 62H62q-6-32-10-62l-6-66q2-20 20-24z"/><rect x="38" y="84" width="22" height="86" rx="10" transform="rotate(8 49 127)"/><rect x="140" y="84" width="22" height="86" rx="10" transform="rotate(-8 151 127)"/><rect x="30" y="140" width="18" height="64" rx="9" transform="rotate(7 39 172)"/><rect x="152" y="140" width="18" height="64" rx="9" transform="rotate(-7 161 172)"/><rect x="64" y="220" width="34" height="122" rx="16"/><rect x="102" y="220" width="34" height="122" rx="16"/><rect x="68" y="330" width="26" height="62" rx="12"/><rect x="106" y="330" width="26" height="62" rx="12"/></g>';
  let m = '';
  if (view === 'front') {
    m += E('shoulders', 62, 86, 14, 13) + E('shoulders', 138, 86, 14, 13) + P('traps', '88,64 112,64 122,78 78,78') + E('chest', 83, 106, 19, 14) + E('chest', 117, 106, 19, 14)
      + E('biceps', 46, 122, 9, 20, 8) + E('biceps', 154, 122, 9, 20, -8) + E('forearms', 38, 165, 8, 22, 6) + E('forearms', 162, 165, 8, 22, -6)
      + R('abs', 89, 126, 22, 52, 8) + E('obliques', 78, 150, 8, 24) + E('obliques', 122, 150, 8, 24) + E('quads', 80, 266, 14, 48, -2) + E('quads', 120, 266, 14, 48, 2) + E('calves', 81, 360, 9, 28) + E('calves', 119, 360, 9, 28);
  } else {
    m += P('traps', '100,60 128,80 100,116 72,80') + E('shoulders', 62, 86, 14, 13) + E('shoulders', 138, 86, 14, 13) + P('lats', '74,100 96,118 96,164 80,164 66,130') + P('lats', '126,100 104,118 104,164 120,164 134,130')
      + E('triceps', 46, 122, 9, 20, 8) + E('triceps', 154, 122, 9, 20, -8) + E('forearms', 38, 165, 8, 22, 6) + E('forearms', 162, 165, 8, 22, -6) + R('lowback', 87, 166, 26, 24, 6)
      + E('glutes', 84, 214, 16, 14) + E('glutes', 116, 214, 16, 14) + E('hamstrings', 80, 276, 14, 44, -2) + E('hamstrings', 120, 276, 14, 44, 2) + E('calves', 81, 360, 9, 28) + E('calves', 119, 360, 9, 28);
  }
  return `<svg viewBox="0 0 200 400" class="body" role="img" aria-label="Muscle map">${sil}${m}</svg>`;
}
function readiness(ts) {
  if (!ts) return ['Not trained yet', 'ok']; const h = (Date.now() - ts) / 36e5;
  return h < 36 ? ['Recovering (' + Math.round(h) + ' h ago)', 'hot'] : h < 72 ? ['Ready (' + Math.round(h / 24 * 10) / 10 + ' days ago)', 'ok'] : ['Rested (' + Math.round(h / 24) + ' days ago)', 'ok'];
}
function viewTrain() {
  const since = addDays(dkey(), -(UI.range - 1)), loads = muscleLoad(S.workouts, since), last = lastTrained(S.workouts);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], opt = (cur) => Object.keys(SPLITS).map(s => `<option value="${s}" ${s === cur ? 'selected' : ''}>${SPLITS[s][0].replace(' day', '')}</option>`).join('');
  const sel = UI.muscle, info = sel ? (() => { const L = loads[sel], r = readiness(last[sel]); return `<div class="card minfo"><b>${MUSCLES[sel]}</b><div class="sm">${round(L.sets, 1)} set${L.sets === 1 ? '' : 's'} in the last ${UI.range} days · <span class="${r[1]}">${r[0]}</span></div></div>`; })() : '<div class="sm dim center">Tap a muscle for details.</div>';
  const hist = S.workouts.slice().sort((a, b) => b.ts - a.ts).slice(0, 12);
  return `<div class="hd2"><h1>Train</h1></div>${trainCard()}
  <section class="card"><div class="ct"><span>Form coach</span></div><div class="sm dim">Prop up your phone and get live feedback on your angles, balance and form.</div><button class="btn gold block" data-act="formOpen">Open form coach (camera)</button></section>
  <section class="card"><div class="ct"><span>Muscle map</span></div>
    <div class="seg"><button class="${UI.view === 'front' ? 'on' : ''}" data-act="bview" data-v="front">Front</button><button class="${UI.view === 'back' ? 'on' : ''}" data-act="bview" data-v="back">Back</button></div>
    <div class="seg small"><button class="${UI.range === 3 ? 'on' : ''}" data-act="range" data-v="3">3 days</button><button class="${UI.range === 7 ? 'on' : ''}" data-act="range" data-v="7">7 days</button><button class="${UI.range === 14 ? 'on' : ''}" data-act="range" data-v="14">14 days</button></div>
    <div class="mapwrap">${bodySVG(UI.view, loads, last)}</div>${info}
    <div class="legend"><span><i style="background:#262046"></i>Not worked</span><span><i style="background:rgba(232,200,114,.55)"></i>Worked</span><span><i style="background:#e8c872"></i>Heavily</span><span><i class="ring"></i>Recovering</span></div></section>
  <section class="card"><div class="ct"><span>Weekly plan</span></div><div class="sched">${wd.map((d, i) => `<label><span>${d}</span><select data-sched="${i}">${opt(S.settings.schedule[i])}</select></label>`).join('')}</div></section>
  <section class="card"><div class="ct"><span>Recent workouts</span></div>${hist.length ? hist.map(w => `<div class="entry" data-act="viewWorkout" data-id="${w.id}"><div><b>${esc(w.name)}</b><div class="sm dim">${parseKey(w.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${w.minutes} min${w.items && w.items.length ? ' · ' + w.items.length + ' exercise' + (w.items.length > 1 ? 's' : '') : ''}</div></div><div class="kc">${w.kcal}<span class="sm dim"> kcal</span></div></div>`).join('') : '<div class="sm dim">No workouts yet. Log your first one above.</div>'}</section>`;
}
/* workout builder */
window.WK = null;
function newWK(preset) { window.WK = { kind: 'strength', items: [], minutes: 45, intensity: 'moderate', touched: false, preset }; }
function openWorkout(split) {
  if (!window.WK) newWK(split);
  renderWorkout();
}
function renderWorkout() {
  const W = window.WK, u = wUnit();
  const items = W.items.map((it, i) => `<div class="card inner"><div class="ct"><span><b>${esc(it.name)}</b><div class="sm dim">${it.prim.map(m => MUSCLES[m]).join(', ')}</div></span><button class="mini" data-act="wkRemove" data-i="${i}">Remove</button></div>
    ${it.sets.map((s, j) => `<div class="setrow"><span>Set ${j + 1}</span><input class="in" type="number" inputmode="numeric" placeholder="reps" value="${s.reps || ''}" data-wk="reps" data-i="${i}" data-j="${j}"><span>×</span><input class="in" type="number" inputmode="decimal" placeholder="${u}" value="${s.kg ? showW(s.kg) : ''}" data-wk="kg" data-i="${i}" data-j="${j}"><button class="x" data-act="wkDelSet" data-i="${i}" data-j="${j}">&times;</button></div>`).join('')}
    <button class="mini" data-act="wkAddSet" data-i="${i}">+ Set</button></div>`).join('');
  const sets = W.items.reduce((s, it) => s + it.sets.length, 0);
  if (!W.touched) W.minutes = Math.max(10, sets * 3 + 5);
  const preset = W.preset && SPLITS[W.preset] ? `<div class="sm dim">Suggested for ${SPLITS[W.preset][0].toLowerCase()}: ${EXERCISES.filter(e => e.split === W.preset || (SPLITS[W.preset][1].some(m => e.prim.includes(m)))).slice(0, 6).map(e => e.name).join(', ')}</div>` : '';
  const kc = exerciseKcal(STRENGTH_MET[W.intensity], latestWeightKg(), W.minutes);
  openSheet('Log strength', `${preset}${items || '<p class="dim">Add the exercises you did.</p>'}<button class="btn block" data-act="wkPick">+ Add exercise</button>
    <div class="grid2"><label class="fl">Minutes<input id="wkmin" class="in" type="number" inputmode="numeric" value="${W.minutes}"></label>
    <label class="fl">Effort<select id="wkint" class="in"><option value="light" ${W.intensity === 'light' ? 'selected' : ''}>Light</option><option value="moderate" ${W.intensity === 'moderate' ? 'selected' : ''}>Moderate</option><option value="hard" ${W.intensity === 'hard' ? 'selected' : ''}>Hard</option></select></label></div>
    <div class="sm dim center">About ${kc} kcal burned (extra, on top of your daily base)</div>
    <button class="btn gold block" data-act="wkSave" ${W.items.length ? '' : 'disabled'}>Save workout</button>`);
}
const allEx = () => EXERCISES.concat((S.myex || []).map(e => Object.assign({ mine: true }, e)));
function suggestEx(n) {
  const load = muscleLoad(S.workouts, addDays(dkey(), -7)), now = Date.now(), cap = {}, out = [];
  const sc = e => e.prim.reduce((a, m) => a + 1 / (1 + (load[m] ? load[m].sets : 0)) + (load[m] && load[m].last && now - load[m].last < 36 * 3600e3 ? -0.6 : 0), 0) / Math.max(1, e.prim.length) + Math.random() * 0.05;
  const todays = (S.settings.schedule || {})[new Date().getDay()], sp = SPLITS[todays];
  allEx().filter(e => equipOk(e) && !exAvoid(e)).map(e => ({ e, s: sc(e) + (sp && sp[1].some(m => e.prim.includes(m)) ? 0.4 : 0) + (e.extra || e.mine ? 0 : 0.35) + (e.move === 'full' ? -0.5 : 0) })).sort((a, b) => b.s - a.s).forEach(x => {
    const mv = x.e.move || 'full'; if (out.length < n && (cap[mv] || 0) < 2) { out.push(x.e); cap[mv] = (cap[mv] || 0) + 1; }
  });
  return out;
}
const EXF = [['sug', 'Suggested'], ['all', 'All'], ['push', 'Push'], ['pull', 'Pull'], ['legs', 'Legs'], ['core', 'Core'], ['bodyweight', 'Bodyweight'], ['dumbbell', 'Dumbbell'], ['barbell', 'Barbell'], ['machine', 'Machine'], ['cable', 'Cable'], ['kettlebell', 'Kettlebell'], ['mine', 'Mine']];
function exRow(e) { const rk = exRisk(e), warn = rk.length ? `<div class="sm" style="color:${rk.some(r => r.state === 'current') ? '#ff9a8f' : 'var(--gold)'}">${rk.some(r => r.state === 'current') ? 'Careful: stresses your ' : 'Go gradually: '}${esc(rk.map(r => r.area.toLowerCase()).join(', '))}</div>` : ''; return `<div class="entry" data-act="wkAdd" data-n="${esc(e.name)}"><div><b>${esc(e.name)}</b><div class="sm dim">${e.prim.map(m => MUSCLES[m]).join(', ') || 'Choose muscles'} · ${MOVE_LABEL[e.move] || ''}${e.equip ? ' · ' + e.equip : ''}</div>${warn}</div></div>`; }
function drawPicker() {
  const q = ($('#exq').value || '').trim().toLowerCase(), f = UI.exf || 'sug'; let list, head = '';
  const base = allEx();
  if (q) list = base.filter(e => e.name.toLowerCase().includes(q));
  else if (f === 'sug') { list = suggestEx(8); head = '<div class="sm dim lab">Picked to fill gaps in your muscle map, a mix of push, pull, legs and core</div>'; }
  else if (f === 'all') list = base;
  else if (f === 'legs') list = base.filter(e => e.split === 'legs');
  else if (f === 'mine') list = base.filter(e => e.mine);
  else if (f === 'push' || f === 'pull' || f === 'core') list = base.filter(e => e.move === f);
  else list = base.filter(e => e.equip === f);
  let html = head + list.map(exRow).join('');
  if (!list.length) html += `<p class="dim">${f === 'mine' && !q ? 'Exercises you add yourself show up here.' : 'No match.'}</p>`;
  if (q && !base.some(e => e.name.toLowerCase() === q)) html += `<button class="btn gold block" data-act="exNew" data-n="${esc($('#exq').value.trim())}">Add &ldquo;${esc($('#exq').value.trim())}&rdquo; as a new exercise</button>`;
  $('#exl').innerHTML = html;
  $$('#exf .chip').forEach(c => c.classList.toggle('on', c.dataset.v === f));
}
function openPicker() {
  openSheet('Pick an exercise', `<input id="exq" class="in" type="search" placeholder="Search, or type any exercise" autocomplete="off"><div id="exf" class="chips nowrap">${EXF.map(c => `<button class="chip ${c[0] === (UI.exf || 'sug') ? 'on' : ''}" data-act="exf" data-v="${c[0]}">${c[1]}</button>`).join('')}</div><div id="exl"></div><button class="btn block" data-act="wkBack">Back</button>`, {
    mount: () => { $('#exq').addEventListener('input', drawPicker); drawPicker(); }
  });
}
function openCustomEx(name) {
  const g = guessExercise(name); window.TMP.cx = g;
  const drawChips = () => { const c = window.TMP.cx; $('#cxm').innerHTML = Object.keys(MUSCLES).map(m => `<button class="chip ${c.prim.includes(m) ? 'on' : (c.sec.includes(m) ? 'half' : '')}" data-act="cxm" data-m="${m}">${MUSCLES[m]}</button>`).join(''); };
  openSheet('New exercise', `<div class="card inner"><b>${esc(name)}</b><div id="cxs" class="sm dim">${g.matched ? 'My best guess from the name. Tap muscles to correct it.' : 'I could not guess this one from the name. Tap the muscles it works, or try the online lookup.'}</div></div>
    <div class="sm dim lab">Main muscles (tap once = main, twice = helper, again = off)</div><div id="cxm" class="chips c"></div>
    <div class="row"><button class="btn" data-act="cxOnline">Look up online</button><button class="btn gold" data-act="cxSave">Save and add</button></div>
    <button class="btn block" data-act="wkPick">Back</button>`, { mount: drawChips });
  window.TMP.cxDraw = drawChips;
}
function openCardio() {
  openSheet('Log cardio', `<label class="fl">Activity<select id="cdt" class="in">${CARDIO.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('')}</select></label>
    <label class="fl">Minutes<input id="cdm" class="in" type="number" inputmode="numeric" value="30"></label><div id="cdk" class="sm dim center"></div>
    <button class="btn gold block" data-act="cdSave">Save</button>`, { mount: () => { const u = () => { const c = CARDIO[+$('#cdt').value]; $('#cdk').textContent = 'About ' + exerciseKcal(c[1], latestWeightKg(), +$('#cdm').value || 0) + ' kcal burned (extra)'; }; $('#cdt').addEventListener('change', u); $('#cdm').addEventListener('input', u); u(); } });
}
function openQuick() {
  const ids = ['legs', 'arms', 'back', 'chest', 'core', 'full'];
  openSheet('Quick log', `<p class="dim">Did a workout and just want to mark the muscles? Pick the day, and Healthica will shade the body map.</p>
    <div class="chips">${ids.map((s, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-act="qpick" data-v="${s}">${SPLITS[s][0].replace(' day', '')}</button>`).join('')}</div>
    <div class="grid2"><label class="fl">Minutes<input id="qm" class="in" type="number" inputmode="numeric" value="45"></label><label class="fl">Effort<select id="qi" class="in"><option value="light">Light</option><option value="moderate" selected>Moderate</option><option value="hard">Hard</option></select></label></div>
    <button class="btn gold block" data-act="qSave">Save</button>`, { mount: () => { window.TMP.q = 'legs'; } });
}

/* ---------- body / weight ---------- */
function weightChart(series) {
  const pts = series.slice(-45); if (pts.length < 2) return '<div class="sm dim center pad">Log at least two weigh-ins to see your chart.</div>';
  const W = 320, H = 170, pl = 34, pr = 8, pt = 10, pb = 20, vals = pts.map(p => showW(p.kg)).concat(pts.map(p => showW(p.trend)));
  let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); const sp = Math.max(1, hi - lo); lo -= sp * 0.15; hi += sp * 0.15;
  const x = i => pl + i * (W - pl - pr) / (pts.length - 1), y = v => pt + (hi - v) * (H - pt - pb) / (hi - lo);
  const dots = pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(showW(p.kg))}" r="2.6" fill="var(--dim)"/>`).join('');
  const tr = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(showW(p.trend)).toFixed(1)}`).join('');
  const ticks = [0, 1, 2, 3].map(i => { const v = lo + (hi - lo) * i / 3; return `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width=".6"/><text x="${pl - 4}" y="${y(v) + 3}" text-anchor="end" class="ax">${round(v, 1)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${ticks}${dots}<path d="${tr}" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-linejoin="round"/><text x="${pl}" y="${H - 4}" class="ax">${parseKey(pts[0].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</text><text x="${W - pr}" y="${H - 4}" text-anchor="end" class="ax">${parseKey(pts[pts.length - 1].date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</text></svg>`;
}
function weightAdvice(series) {
  const out = [], p = S.profile; if (!series.length) return ['Welcome. Log your weight each morning (after the bathroom, before eating). After a week Healthica can show your trend and explain the swings.'];
  const last = series[series.length - 1], diff = last.kg - last.trend, bw = last.trend, u = wUnit();
  if (Math.abs(diff) >= 0.012 * bw) out.push(`Today is ${showW(Math.abs(diff))} ${u} ${diff > 0 ? 'above' : 'below'} your trend. That is normal: day-to-day weight moves 1 to 2 lb (about 0.5 to 1 kg) from water, salt, carbs, digestion, hormones and hard workouts. Trust the line, not one morning.`);
  else out.push('Today sits right on your trend. Steady.');
  const rate = weeklyRate(series);
  if (rate !== null) {
    const pct = rate / bw * 100, r = showW(Math.abs(rate));
    if (p.goal === 'lose') {
      if (pct < -1) out.push(`Your trend is down ${r} ${u} a week, a bit fast. Add 150 to 250 calories of protein and carbs so you keep muscle and energy.`);
      else if (pct < -0.15) out.push(`Trend down ${r} ${u} a week. That is a healthy, sustainable pace.`);
      else if (series.length >= 10) out.push('Your trend has been flat for a while. Plateaus are normal. Check portions and weekends, add a daily walk, or take a 1 to 2 week break at maintenance calories.');
      if (pct > 0.3) out.push('The trend is creeping up. Review the last week of logs, salt and alcohol, and whether training volume jumped (muscle holds water too).');
    } else if (p.goal === 'gain') {
      if (pct > 0.6) out.push(`Trend up ${r} ${u} a week, faster than needed for lean gains. Trim about 150 calories.`);
      else if (pct > 0.05) out.push(`Trend up ${r} ${u} a week. A good lean-gain pace.`);
      else out.push('Trend is flat. Add about 150 to 250 calories and keep lifting progressively.');
    } else { out.push(Math.abs(pct) < 0.3 ? 'Your trend is steady, exactly what maintenance looks like.' : `Trend is moving ${r} ${u} a week. Adjust intake slightly if that is not your plan.`); }
  } else if (series.length < 4) out.push('A few more weigh-ins and the weekly trend will appear.');
  const hard = S.workouts.some(w => (w.intensity === 'hard' || w.minutes >= 60) && daysBetween(w.date, last.date) >= 0 && daysBetween(w.date, last.date) <= 2);
  if (hard && diff > 0.004 * bw) out.push('A hard workout in the last two days can raise the scale for a bit as muscles hold extra water while they repair. It is a good sign, not fat.');
  return out;
}
function viewBody() {
  const sw = sortedWeights(), series = weightTrend(sw), last = series[series.length - 1], k = dkey(), cur = sw.find(w => w.date === k);
  const rate = weeklyRate(series), u = wUnit();
  const ch30 = series.length ? (() => { const base = series.find(s => daysBetween(s.date, k) <= 30) || series[0]; return last.trend - base.trend; })() : 0;
  return `<div class="hd2"><h1>Body</h1></div>
  <section class="card"><div class="ct"><span>Today's weigh-in</span></div><div class="weigh"><input id="wv" class="in big" type="number" inputmode="decimal" step="0.1" placeholder="${u}" value="${cur ? showW(cur.kg) : (last ? showW(last.kg) : '')}"><span class="dim">${u}</span><button class="btn gold" data-act="saveWeight">${cur ? 'Update' : 'Save'}</button></div></section>
  <section class="card"><div class="ct"><span>Trend</span></div>${last ? `<div class="sum"><div><b>${showW(last.trend)}</b><span>trend ${u}</span></div><div><b>${rate === null ? '·' : (rate > 0 ? '+' : '') + showW(rate)}</b><span>${u} / week</span></div><div><b>${(ch30 > 0 ? '+' : '') + showW(ch30)}</b><span>30 days</span></div></div>` : ''}${weightChart(series)}<div class="legend"><span><i class="dotl"></i>Daily</span><span><i style="background:var(--gold)"></i>Trend</span></div></section>
  <section class="card"><div class="ct"><span>What your numbers say</span></div>${weightAdvice(series).map(t => `<p class="adv">${esc(t)}</p>`).join('')}</section>
  <section class="card"><div class="ct"><span>History</span></div>${sw.slice().reverse().slice(0, 14).map(w => `<div class="entry" data-act="delWeight" data-d="${w.date}"><div>${parseKey(w.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div><div class="kc">${showW(w.kg)} ${u}</div></div>`).join('') || '<div class="sm dim">No entries yet.</div>'}<div class="sm dim">Tap an entry to delete it.</div></section>`;
}

/* ---------- log (peptides & health) ---------- */
const PRESETS = [['Sleep', 'metric', 'hours'], ['Mood', 'metric', '1 to 5'], ['Energy', 'metric', '1 to 5'], ['Resting heart rate', 'metric', 'bpm'], ['Blood pressure', 'metric', 'mmHg'], ['Steps', 'metric', 'steps'], ['Blood glucose', 'metric', 'mg/dL'], ['Waist', 'metric', 'in'], ['Peptide', 'peptide', 'mcg'], ['Supplement', 'supp', 'mg']];
function viewLog() {
  const tr = S.trackers;
  const cards = tr.map(t => {
    const ls = S.logs.filter(l => l.trackerId === t.id).sort((a, b) => b.ts - a.ts), l = ls[0];
    const tag = t.type === 'peptide' ? 'Peptide' : t.type === 'supp' ? 'Supplement' : 'Metric';
    return `<div class="card"><div class="ct"><span><b>${esc(t.name)}</b> <span class="tag">${tag}</span></span><button class="mini" data-act="logIt" data-id="${t.id}">+ Log</button></div>
      <div class="sm dim">${l ? `Last: ${esc(l.value)} ${esc(l.unit || '')} · ${ago(l.ts)}${l.note ? ' · ' + esc(l.note) : ''}` : 'Nothing logged yet.'}</div>
      ${ls.length > 1 ? `<div class="sm dim">${ls.length} entries</div>` : ''}<div class="row"><button class="mini" data-act="reminderFor" data-id="${t.id}">Set reminder</button><button class="mini" data-act="trackerHist" data-id="${t.id}">History</button></div></div>`;
  }).join('');
  const recent = S.logs.slice().sort((a, b) => b.ts - a.ts).slice(0, 12).map(l => { const t = S.trackers.find(x => x.id === l.trackerId) || { name: '?' }; return `<div class="entry" data-act="delLog" data-id="${l.id}"><div><b>${esc(t.name)}</b><div class="sm dim">${new Date(l.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${l.note ? ' · ' + esc(l.note) : ''}</div></div><div class="kc">${esc(l.value)} <span class="sm dim">${esc(l.unit || '')}</span></div></div>`; }).join('');
  const ls2 = UI.logseg || 'log', sg = `<div class="seg"><button class="${ls2 === 'log' ? 'on' : ''}" data-act="logseg" data-v="log">Log</button><button class="${ls2 === 'pep' ? 'on' : ''}" data-act="logseg" data-v="pep">Peptides</button><button class="${ls2 === 'check' ? 'on' : ''}" data-act="logseg" data-v="check">Checker</button></div>`;
  if (ls2 === 'pep') return `<div class="hd2"><h1>Log</h1></div>${sg}${pepView()}`;
  if (ls2 === 'check') return `<div class="hd2"><h1>Log</h1></div>${sg}${checkerView()}`;
  return `<div class="hd2"><h1>Log</h1></div>${sg}<button class="btn block" data-act="symOpen">Symptom helper: not feeling right?</button><p class="dim sm">Track peptides, supplements and other health factors. Healthica only records and reminds. It does not recommend doses.</p>
  ${cards || '<section class="card"><p>Start by adding something to track: a peptide, a supplement, sleep, mood, energy.</p></section>'}
  <button class="btn gold block" data-act="newTracker">+ Track something new</button>
  <section class="card"><div class="ct"><span>Recent entries</span></div>${recent || '<div class="sm dim">No entries yet.</div>'}<div class="sm dim">Tap an entry to delete it.</div></section>`;
}
function openNewTracker() {
  openSheet('Track something', `<div class="chips">${PRESETS.map((p, i) => `<button class="chip" data-act="preset" data-i="${i}">${p[0]}</button>`).join('')}</div>
    <input id="tn" class="in" placeholder="Name (e.g. BPC-157, Vitamin D, Sleep)"><select id="tt" class="in"><option value="peptide">Peptide (dose log)</option><option value="supp">Supplement</option><option value="metric">Metric (number)</option></select>
    <input id="tu" class="in" placeholder="Unit (mcg, mg, IU, mL, hours...)"><button class="btn gold block" data-act="saveTracker">Add</button>`);
}
function openLogIt(id) {
  const t = S.trackers.find(x => x.id === id), last = S.logs.filter(l => l.trackerId === id).sort((a, b) => b.ts - a.ts)[0];
  const now = new Date(), val = last ? last.value : '';
  openSheet('Log ' + t.name, `<div class="grid2"><label class="fl">${t.type === 'metric' ? 'Value' : 'Dose'}<input id="lv" class="in" inputmode="decimal" value="${esc(val)}"></label><label class="fl">Unit<input id="lu" class="in" value="${esc(last ? last.unit : t.unit || '')}"></label></div>
    ${t.type === 'peptide' ? '<label class="fl">Site / route (optional)<input id="ls" class="in" placeholder="e.g. abdomen left"></label>' : ''}
    <label class="fl">Note (optional)<input id="ln" class="in" placeholder="How you felt, batch, anything"></label>
    <label class="fl">When<input id="lt" class="in" type="datetime-local" value="${dkey(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}"></label>
    <button class="btn gold block" data-act="saveLog" data-id="${id}">Save</button>`);
}

/* ---------- settings, reminders ---------- */
const REM_PRESETS = [['Morning weigh-in', '07:30', [0, 1, 2, 3, 4, 5, 6], 'weigh'], ['Drink water', '10:30', [0, 1, 2, 3, 4, 5, 6], 'water'], ['Drink water', '15:00', [0, 1, 2, 3, 4, 5, 6], 'water'], ['Log lunch', '13:00', [0, 1, 2, 3, 4, 5, 6], 'food'], ['Log dinner', '19:30', [0, 1, 2, 3, 4, 5, 6], 'food'],
  ['Workout time', '17:30', [1, 2, 3, 4, 5], 'train'], ['Meditate', '20:30', [0, 1, 2, 3, 4, 5, 6], 'mind'], ['Wind down and rest', '21:30', [0, 1, 2, 3, 4, 5, 6], 'rest'], ['Weekly vitamin check', '18:00', [0], 'vit']];
function viewReminders() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const list = S.reminders.slice().sort((a, b) => a.time < b.time ? -1 : 1).map(r => `<div class="entry"><div><b>${esc(r.label)}</b><div class="sm dim">${hhmm(r.time)} · ${r.days.length === 7 ? 'Every day' : r.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(' ')}</div></div><div><label class="sw"><input type="checkbox" ${r.on ? 'checked' : ''} data-remtog="${r.id}"><i></i></label><button class="x" data-act="delRem" data-id="${r.id}">&times;</button></div></div>`).join('');
  const notif = (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported';
  return `<p class="dim sm">Reminders pop up while Healthica is open or recently used. For alarms that always ring, add them to your phone's calendar with the button below.</p>
    <div class="card">${list || '<div class="sm dim">No reminders yet. Add some below.</div>'}</div>
    <div class="row wrap"><button class="btn" data-act="notif">${notif === 'granted' ? 'Notifications on' : 'Turn on notifications'}</button><button class="btn gold" data-act="ics">Add to phone calendar</button></div>
    <div class="ct"><span>Add a reminder</span></div><div class="chips">${REM_PRESETS.map((p, i) => `<button class="chip" data-act="remPreset" data-i="${i}">${p[0]} ${hhmm(p[1])}</button>`).join('')}</div>
    <input id="rl" class="in" placeholder="Custom reminder text"><div class="grid2"><input id="rt" class="in" type="time" value="08:00"><button class="btn" data-act="remCustom">Add</button></div>
    <div class="chips" id="rd">${days.map((d, i) => `<button class="chip on" data-act="remDay" data-i="${i}">${d}</button>`).join('')}</div>`;
}
function viewSettings() {
  const p = S.profile || {}, L = S.settings.loc;
  return `<div class="sh-sec"><div class="ct"><span>Reminders and alarms</span></div>${viewReminders()}</div>
  <div class="sh-sec"><div class="ct"><span>Profile</span></div><button class="btn block" data-act="chgOpen">Health updates: injury, condition, prescription, appointment</button><button class="btn block" data-act="editProfile">Health profile: review or update</button>${typeof diaOn === 'function' && diaOn() ? '<button class="btn block" data-act="diaSetup">Diabetes setup: medicines and sugar checks</button>' : ''}${healthSummaryHTML()}
    <div class="sm dim">${esc(p.name || '')} · ${p.sex === 'm' ? 'Male' : 'Female'} · age ${p.age} · goal: ${p.goal} · units: ${p.units}</div></div>
  <div class="sh-sec"><div class="ct"><span>Care and safety</span></div><button class="btn block" data-act="profOpen">People: caregiver mode</button><button class="btn block" data-act="iceOpen">Emergency health card</button><button class="btn block" data-act="rpOpen">Doctor reports and visit prep</button><button class="btn block" data-act="occOpen">Occultica household: garden, money, calendar</button></div>
  <div class="sh-sec"><div class="ct"><span>Planetary hours</span></div><div class="sm dim">Current location: ${esc(L ? 'your device location' : 'Los Angeles (default)')}. Hours follow local sunrise and sunset.</div><button class="btn block" data-act="useLoc">Use my location</button></div>
  <div class="sh-sec"><div class="ct"><span>Food lookup (online)</span></div><div class="sm dim">Healthica searches USDA FoodData Central and Open Food Facts for foods it does not know. Optional: paste your own free USDA key from fdc.nal.usda.gov to avoid rate limits.</div><input id="usda" class="in" placeholder="USDA API key (optional)" value="${esc(S.settings.usdaKey)}"><button class="btn block" data-act="saveKey">Save key</button></div>
  <div class="sh-sec"><div class="ct"><span>Your data</span></div><div class="sm dim">Everything stays on this phone. Back it up now and then.</div>${S.settings.lastBackup ? `<div class="sm dim">Last backup: ${new Date(S.settings.lastBackup).toLocaleDateString()}</div>` : '<div class="sm warn">No backup yet.</div>'}<button class="btn gold block" data-act="backup">Backup and restore</button><div class="row wrap"><button class="btn danger" data-act="wipe">Erase everything</button></div><input type="file" id="impf" accept=".json,application/json" hidden></div>
  <p class="foot">Healthica · part of the Occultica family. For general wellness only. Not medical advice. Food data are approximate.</p>`;
}
function openOnboard(edit) {
  const p = S.profile || { sex: 'f', age: 30, units: 'lb', baseAct: 1.3, goal: 'lose', rate: 'normal', name: '' };
  const hcm = p.heightCm || 165, ft = Math.floor(hcm / 2.54 / 12), inch = Math.round(hcm / 2.54 - ft * 12), w = p.weightKg ? (p.units === 'kg' ? round(p.weightKg, 1) : round(kg2lb(p.weightKg), 1)) : '';
  openSheet(edit ? 'Edit profile' : 'Welcome to Healthica', `${edit ? '' : '<p>Tell me a little about you so I can set your calorie and nutrient targets. It all stays on this phone.</p>'}
    <label class="fl">Name<input id="ob_name" class="in" value="${esc(p.name)}"></label>
    <div class="grid2"><label class="fl">Sex<select id="ob_sex" class="in"><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Female</option><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Male</option></select></label><label class="fl">Age<input id="ob_age" class="in" type="number" inputmode="numeric" value="${p.age}"></label></div>
    <div class="grid2"><label class="fl">Units<select id="ob_u" class="in"><option value="lb" ${p.units === 'lb' ? 'selected' : ''}>Pounds, feet/inches</option><option value="kg" ${p.units === 'kg' ? 'selected' : ''}>Kilograms, cm</option></select></label><label class="fl">Weight<input id="ob_w" class="in" type="number" inputmode="decimal" value="${w}"></label></div>
    <div class="grid2"><label class="fl">Height (ft / cm)<input id="ob_h1" class="in" type="number" inputmode="decimal" value="${p.units === 'kg' ? Math.round(hcm) : ft}"></label><label class="fl">Inches (if ft)<input id="ob_h2" class="in" type="number" inputmode="decimal" value="${inch}"></label></div>
    <label class="fl">Daily life (outside workouts)<select id="ob_act" class="in">${Object.keys(BASE_ACT).map(k => `<option value="${k}" ${+k === p.baseAct ? 'selected' : ''}>${BASE_ACT[k]}</option>`).join('')}</select></label>
    <div class="grid2"><label class="fl">Goal<select id="ob_goal" class="in"><option value="lose" ${p.goal === 'lose' ? 'selected' : ''}>Lose fat</option><option value="maintain" ${p.goal === 'maintain' ? 'selected' : ''}>Maintain</option><option value="gain" ${p.goal === 'gain' ? 'selected' : ''}>Build muscle</option></select></label><label class="fl">Pace<select id="ob_rate" class="in"><option value="slow" ${p.rate === 'slow' ? 'selected' : ''}>Gentle</option><option value="normal" ${p.rate === 'normal' ? 'selected' : ''}>Steady</option><option value="fast" ${p.rate === 'fast' ? 'selected' : ''}>Faster</option></select></label></div>
    <button class="btn gold block" data-act="saveProfile">${edit ? 'Save' : 'Start'}</button><p class="sm dim">Healthica gives general wellness guidance, never below a safe calorie floor. Check with your doctor before big changes, and especially if you are pregnant, have a medical condition, or a history of disordered eating.</p>`);
}
function openMeditate() {
  openSheet('Breathe', `<div class="med"><div id="orb" class="orb"></div><div id="medtxt" class="medtxt">Choose a length</div><div id="medt" class="dim">&nbsp;</div></div>
    <div class="chips c"><button class="chip" data-act="medgo" data-m="1">1 min</button><button class="chip" data-act="medgo" data-m="3">3 min</button><button class="chip" data-act="medgo" data-m="5">5 min</button><button class="chip" data-act="medgo" data-m="10">10 min</button></div>
    <p class="sm dim center">Breathe in for 4, out for 6. Let your shoulders drop.</p>`);
}

function render() {
  const el = $('#view'); let h = '';
  if (!S.profile) { el.innerHTML = ''; openIntake(false); return; }
  if (UI.tab === 'today') h = viewToday(); else if (UI.tab === 'food') h = viewFood(); else if (UI.tab === 'train') h = viewTrain(); else if (UI.tab === 'body') h = viewBody(); else if (UI.tab === 'log') h = viewLog();
  const y = window.scrollY; el.innerHTML = h; if (!render.keepTop) window.scrollTo(0, y);
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
}
