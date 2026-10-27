/* Healthica main: actions, reminders, calendar export, startup. */
const MED = window.MED = { timer: null, stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } } };
function ensureTracker(name, type, unit) { let t = S.trackers.find(x => x.name === name); if (!t) { t = { id: uid(), name, type, unit }; S.trackers.push(t); } return t; }
function setTab(t) { UI.tab = t; render.keepTop = true; render(); render.keepTop = false; window.scrollTo(0, 0); }
function updTotals() { updAmt(); }

function el_wkAddByName(n) { ACT.wkAdd({ dataset: { n } }); toast('Saved to your exercises'); }
function symKeep(fn) { const sh = $('#sheet'), y = sh.scrollTop; fn(); sh.scrollTop = y; }
const ACT = {
  intTog(el) { const d = window.INT.d, k = el.dataset.k, v = el.dataset.v, i = d[k].indexOf(v); i < 0 ? d[k].push(v) : d[k].splice(i, 1); intKeep(intRender); },
  intOne(el) { window.INT.d[el.dataset.k] = el.dataset.v; intKeep(intRender); },
  intNum(el) { window.INT.d[el.dataset.k] = +el.dataset.v; intKeep(intRender); },
  intInj(el) { const d = window.INT.d, k = el.dataset.v, c = d.injuries[k]; if (!c) d.injuries[k] = 'current'; else if (c === 'current') d.injuries[k] = 'past'; else delete d.injuries[k]; intKeep(intRender); },
  intEd(el) { window.INT.d.edHist = el.checked; },
  intMode(el) { const I = window.INT; const t = intTemp().modeOk(el.dataset.v); if (!t.ok) { toast(t.why, 5000); return; } I.d.mode = el.dataset.v; I.d.blocked = ''; intKeep(intRender); },
  intNext() { const I = window.INT, d = I.d; if (I.step === 1 && (!(+d.w) || !(+d.age) || !(+d.h1))) { toast('Please fill weight, age and height.'); return; } I.step++; intRender(); },
  intBack() { window.INT.step--; intRender(); },
  intFinish() { const r = intCommit(); if (!r) { window.INT.step = 1; intRender(); return; } const lines = intSummary(r.mode); render(); openSheet('Your plan is ready', `<p>Here is how Healthica is set up for you:</p>${lines.map(l => `<div class="nudge"><div class="sm">${l}</div></div>`).join('')}<p class="sm dim">You can change any answer later in Settings, Health profile.</p><button class="btn gold block" data-act="closeSheet">Let's go</button>`); },
  symOpen() { openSymptoms(true); },
  symChip(el) { const st = symState(), id = el.dataset.v; st.sel.has(id) ? st.sel.delete(id) : st.sel.add(id); symKeep(symStep1); },
  symCtx(el) { const st = symState(), id = el.dataset.v; st.off.has(id) ? st.off.delete(id) : st.off.add(id); symKeep(symStep1); },
  symRed(el) { const st = symState(), id = el.dataset.v, i = st.reds.indexOf(id); i < 0 ? st.reds.push(id) : st.reds.splice(i, 1); symKeep(symStep1); },
  symNext() { const st = symState(), d = symDetect(st.text); d.ids.forEach(i => st.sel.add(i)); d.reds.forEach(r => { if (!st.reds.includes(r)) st.reds.push(r); });
    if (st.reds.length) { symResult(); return; } if (!st.sel.size) { toast('Tap at least one symptom, or describe it.'); return; } st.step = 2; symStep2(); },
  symAns(el) { const st = symState(); st.ans[el.dataset.q] = st.ans[el.dataset.q] === el.dataset.v ? '' : el.dataset.v; symKeep(symStep2); },
  symDur(el) { symState().dur = el.dataset.v; symKeep(symStep2); }, symSev(el) { symState().sev = el.dataset.v; symKeep(symStep2); },
  symBack() { const st = symState(); if (st.step === 3 && st.sel.size && !st.reds.length) { st.step = 2; symStep2(); } else { st.step = 1; symStep1(); } },
  symResult() { symResult(); },
  symSave() { const st = symState(), an = st.an || symAnalyze(st); S.symptoms = S.symptoms || []; S.symptoms.push({ id: uid(), ts: Date.now(), date: dkey(), labels: an.out.map(o => o.label).concat(an.reds.map(r => RED_CHIPS.find(c => c[0] === r)[1])).join(', '), level: an.level }); save(); const e = $('#symmsg'); if (e) e.textContent = 'Saved to your log.'; },
  symCopy() { const st = symState(), an = st.an || symAnalyze(st), txt = symSummaryText(st, an), e = $('#symmsg');
    const fallback = () => { e.innerHTML = '<textarea class="in" rows="8" readonly>' + esc(txt) + '</textarea>'; const ta = e.querySelector('textarea'); ta.focus(); ta.select(); };
    try { navigator.clipboard.writeText(txt).then(() => { e.textContent = 'Copied. Paste it into a message or note.'; }, fallback); } catch (x) { fallback(); } },
  symNew() { openSymptoms(true); },

  logseg(el) { UI.logseg = el.dataset.v; render(); },
  goPep() { UI.logseg = 'pep'; setTab('log'); },
  medRun() { runChecker(); },
  async pepUpdate() { const el = $('#pepmsg'); el.textContent = 'Checking...'; const r = await pepAutoUpdate(true); el.textContent = r === 'updated' ? 'Updated to the newest reference.' : r === 'current' ? 'You already have the newest reference.' : 'Could not reach the update file. It works offline with the built-in version.'; if (r === 'updated') render(); },
  mode(el) { const ok = modeAllowed(el.dataset.v); if (!ok.ok) { toast(ok.why, 5000); return; } applyMode(el.dataset.v); render(); toast(MODES[el.dataset.v].label + ' plan on. Targets and weekly split updated.'); },
  vegan(el) { S.settings.vegan = el.checked; S.profile.h = S.profile.h || {}; if (el.checked) S.profile.h.diet = 'vegan'; else if (S.profile.h.diet === 'vegan') S.profile.h.diet = 'omni'; save(); render(); toast(el.checked ? 'Vegan foods only' : 'All foods shown'); },
  closeSheet() { closeSheet(); },
  settings() { openSheet('Settings', viewSettings()); },
  goFood() { setTab('food'); }, goBody() { setTab('body'); },
  addFoodNow() { openAddFood(defaultMeal()); },
  water() { const k = dkey(); S.water[k] = waterOn(k) + 1; save(); render(); toast(S.water[k] + ' glass' + (S.water[k] > 1 ? 'es' : '') + ' today. Nice.'); },
  meditate() { openMeditate(); },
  medgo(el) {
    const min = +el.dataset.m; let left = min * 60; MED.stop();
    const orb = $('#orb'), tx = $('#medtxt'), tm = $('#medt'); orb.classList.add('go'); let ph = 0;
    const upd = () => { const m = Math.floor(left / 60), s = left % 60; tm.textContent = m + ':' + pad2(s); const c = (min * 60 - left) % 10; tx.textContent = c < 4 ? 'Breathe in' : 'Breathe out'; };
    upd(); MED.timer = setInterval(() => { left--; upd(); if (left <= 0) { MED.stop(); S.mind.push({ date: dkey(), min, ts: Date.now() }); save(); orb.classList.remove('go'); tx.textContent = 'Well done'; tm.textContent = min + ' min logged'; try { navigator.vibrate && navigator.vibrate(200); } catch (e) { } } }, 1000);
  },
  useLoc() {
    if (!navigator.geolocation) return toast('Location is not available here.');
    navigator.geolocation.getCurrentPosition(p => { S.settings.loc = { lat: p.coords.latitude, lon: p.coords.longitude, name: 'Your location' }; save(); toast('Location set. Planetary hours updated.'); render(); }, () => toast('Location was not shared. Using Los Angeles.'), { timeout: 8000 });
  },
  /* day nav & tabs */
  dayPrev() { UI.date = addDays(UI.date, -1); render(); }, dayNext() { if (UI.date < dkey()) { UI.date = addDays(UI.date, 1); render(); } },
  seg(el) { UI.seg = el.dataset.v; render(); },
  bview(el) { UI.view = el.dataset.v; UI.muscle = null; render(); }, range(el) { UI.range = +el.dataset.v; render(); },
  muscle(el) { UI.muscle = el.dataset.m; render(); },
  /* food */
  addFood(el) { openAddFood(el.dataset.meal); },
  cat(el) { UI.cat = el.dataset.v; $$('.chip', $('#sheet')).forEach(c => c.classList.toggle('on', c === el)); renderFoodResults(); },
  pickFood(el) { const id = el.dataset.id; const f = window.TMP[id] || findFood(id); if (f) openAmount(f); },
  svDec() { const i = $('#sv'); i.value = Math.max(0, round((+i.value || 0) - (window.TMP.unit === 'g' ? 10 : 0.5), 2)); updAmt(); },
  svInc() { const i = $('#sv'); i.value = round((+i.value || 0) + (window.TMP.unit === 'g' ? 10 : 0.5), 2); updAmt(); },
  unit(el) { const f = window.TMP.food; window.TMP.unit = el.dataset.v; $$('.seg button', $('#sheet')).forEach(b => b.classList.toggle('on', b === el)); $('#sv').value = window.TMP.unit === 'g' ? Math.round(f.servG) : 1; updAmt(); },
  saveFood() {
    const f = window.TMP.food, g = amtGrams(); if (g <= 0) return toast('Enter an amount.');
    const e = entryFrom(f, g, $('#mealsel').value, UI.date || dkey(), window.TMP.unit === 'serv' ? (round(g / f.servG, 2) + ' × ' + f.servLabel) : ''); S.food.push(e);
    if (f.src && !S.myfoods.find(x => x.id === f.id)) S.myfoods.push(Object.assign({}, f));
    save(); closeSheet(); toast('Added ' + e.name);
  },
  online() {
    const q = $('#fs').value.trim(); if (!q) return toast('Type what you are looking for first.');
    $('#onl').innerHTML = '<div class="sm dim pad">Searching online...</div>';
    searchOnline(q).then(r => {
      r.out.forEach(f => window.TMP[f.id] = f);
      $('#onl').innerHTML = '<div class="sm dim lab">Online results</div>' + (r.out.length ? r.out.map(foodRow).join('') : '<div class="sm dim pad">No online results.</div>') + (r.errs.length ? `<div class="sm warn pad">Could not reach: ${r.errs.join(', ')}. Check your connection.</div>` : '');
    });
  },
  barcode() { openSheet('Barcode', `<input id="bc" class="in" inputmode="numeric" placeholder="Type the number under the barcode"><button class="btn gold block" data-act="bcgo">Look up</button><div id="bcr"></div>`); },
  bcgo() { const c = $('#bc').value.trim(); if (!c) return; $('#bcr').innerHTML = '<div class="sm dim pad">Looking up...</div>'; lookupBarcode(c).then(f => { window.TMP[f.id] = f; openAmount(f); }).catch(() => { $('#bcr').innerHTML = '<div class="sm warn pad">Not found or offline. You can create the food by hand.</div>'; }); },
  newFood() { openNewFood(); },
  saveNewFood() {
    const v = id => +$('#nf_' + id).value || 0, name = $('#nf_name').value.trim(); if (!name || !v('kcal')) return toast('Add a name and calories.');
    const sg = v('g') || 100, k = 100 / sg, n = {}; NUT_KEYS.forEach(x => n[x] = round(v(x) * k, 2));
    const f = { id: 'm' + uid(), name, cat: $('#nf_cat').value, servG: sg, servLabel: $('#nf_lab').value || '1 serving', kcal: round(v('kcal') * k, 1), p: round(v('p') * k, 1), c: round(v('c') * k, 1), f: round(v('f') * k, 1), fib: round(v('fib') * k, 1), n, per: 100 };
    S.myfoods.push(f); save(); openAmount(f);
  },
  quickKcal() { openSheet('Quick calories', `<input id="qk_n" class="in" placeholder="What was it? (optional)"><div class="grid2"><input id="qk_k" class="in" type="number" inputmode="decimal" placeholder="Calories"><input id="qk_p" class="in" type="number" inputmode="decimal" placeholder="Protein g"><input id="qk_c" class="in" type="number" inputmode="decimal" placeholder="Carbs g"><input id="qk_f" class="in" type="number" inputmode="decimal" placeholder="Fat g"></div><button class="btn gold block" data-act="qkSave">Add</button>`); },
  qkSave() { const v = id => +$('#qk_' + id).value || 0; if (!v('k')) return toast('Enter calories.'); S.food.push({ id: uid(), date: UI.date || dkey(), meal: UI.addMeal || defaultMeal(), name: $('#qk_n').value.trim() || 'Quick add', cat: 'other', grams: 0, label: '', ts: Date.now(), kcal: v('k'), p: v('p'), c: v('c'), f: v('f'), fib: 0, n: {} }); save(); closeSheet(); },
  editEntry(el) {
    const e = S.food.find(x => x.id === el.dataset.id); if (!e) return;
    openSheet(e.name, `<div class="sm dim">${Math.round(e.kcal)} kcal · P ${Math.round(e.p)} C ${Math.round(e.c)} F ${Math.round(e.f)}</div>${e.grams ? `<label class="fl">Amount in grams<input id="eg" class="in" type="number" inputmode="decimal" value="${Math.round(e.grams)}"></label>` : ''}<div class="row"><button class="btn danger" data-act="delEntry" data-id="${e.id}">Delete</button>${e.grams ? `<button class="btn gold" data-act="saveEntry" data-id="${e.id}">Save</button>` : ''}</div>`);
  },
  saveEntry(el) { const e = S.food.find(x => x.id === el.dataset.id), g = +$('#eg').value; if (!e || g <= 0) return; const k = g / e.grams; ['kcal', 'p', 'c', 'f', 'fib'].forEach(x => e[x] = round(e[x] * k, 1)); NUT_KEYS.forEach(x => { if (e.n) e.n[x] = round((e.n[x] || 0) * k, 2); }); e.grams = g; e.label = ''; save(); closeSheet(); },
  delEntry(el) { S.food = S.food.filter(x => x.id !== el.dataset.id); save(); closeSheet(); },
  /* training */
  workout(el) { newWK(el.dataset.split); renderWorkout(); },
  wkPick() { openPicker(); }, wkBack() { renderWorkout(); },
  wkAdd(el) { const ex = allEx().find(e => e.name === el.dataset.n); if (!ex) return; const rk = exRisk(ex); if (rk.length) toast((rk.some(r => r.state === 'current') ? 'Careful: this can stress your ' : 'Go gradually: ') + rk.map(r => r.area.toLowerCase()).join(', '), 4500); window.WK.items.push({ name: ex.name, prim: ex.prim.slice(), sec: ex.sec.slice(), sets: [{ reps: 10, kg: 0 }, { reps: 10, kg: 0 }, { reps: 10, kg: 0 }] }); renderWorkout(); },
  exf(el) { UI.exf = el.dataset.v; drawPicker(); },
  exNew(el) { window.TMP = window.TMP || {}; openCustomEx(el.dataset.n); },
  cxm(el) { const c = window.TMP.cx, m = el.dataset.m; if (c.prim.includes(m)) { c.prim = c.prim.filter(x => x !== m); c.sec.push(m); } else if (c.sec.includes(m)) c.sec = c.sec.filter(x => x !== m); else c.prim.push(m); window.TMP.cxDraw(); },
  async cxOnline() { const c = window.TMP.cx, s = $('#cxs'); s.textContent = 'Looking it up...'; const r = await lookupExerciseOnline(c.name); if (r && (r.prim.length || r.sec.length)) { c.prim = r.prim; c.sec = r.sec.filter(m => !r.prim.includes(m)); s.textContent = 'Found "' + r.title + '" online (wger). Check the muscles below.'; window.TMP.cxDraw(); } else s.textContent = 'Nothing found online, or no connection. Tap the muscles yourself.'; },
  cxSave() { const c = window.TMP.cx; if (!c.prim.length) { toast('Pick at least one main muscle'); return; } const ex = { name: c.name, split: 'full', prim: c.prim.slice(), sec: c.sec.slice(), move: c.move, equip: c.equip }; S.myex = (S.myex || []).filter(e => e.name !== ex.name); S.myex.push(ex); save(); el_wkAddByName(ex.name); },
  wkRemove(el) { window.WK.items.splice(+el.dataset.i, 1); renderWorkout(); },
  wkAddSet(el) { const it = window.WK.items[+el.dataset.i], l = it.sets[it.sets.length - 1] || { reps: 10, kg: 0 }; it.sets.push({ reps: l.reps, kg: l.kg }); renderWorkout(); },
  wkDelSet(el) { const it = window.WK.items[+el.dataset.i]; it.sets.splice(+el.dataset.j, 1); renderWorkout(); },
  wkSave() {
    const W = window.WK; if (!W.items.length) return;
    const mins = +$('#wkmin').value || W.minutes, inten = $('#wkint').value, ms = {}; W.items.forEach(i => i.prim.forEach(m => ms[m] = 1));
    const first = Object.keys(ms).slice(0, 3).map(m => MUSCLES[m]).join(', ');
    S.workouts.push({ id: uid(), date: dkey(), ts: Date.now(), kind: 'strength', name: 'Strength: ' + first, minutes: mins, intensity: inten, kcal: exerciseKcal(STRENGTH_MET[inten], latestWeightKg(), mins), items: W.items });
    window.WK = null; save(); closeSheet(); toast('Workout saved. Muscle map updated.');
  },
  cardio() { openCardio(); },
  cdSave() { const c = CARDIO[+$('#cdt').value], m = +$('#cdm').value || 0; if (m <= 0) return; S.workouts.push({ id: uid(), date: dkey(), ts: Date.now(), kind: 'cardio', name: c[0], minutes: m, intensity: 'moderate', kcal: exerciseKcal(c[1], latestWeightKg(), m), items: [] }); save(); closeSheet(); toast('Cardio saved.'); },
  quickWorkout() { openQuick(); },
  qpick(el) { window.TMP.q = el.dataset.v; $$('.chip', $('#sheet')).forEach(c => c.classList.toggle('on', c === el)); },
  qSave() {
    const id = window.TMP.q || 'legs', sp = SPLITS[id], m = +$('#qm').value || 45, inten = $('#qi').value;
    S.workouts.push({ id: uid(), date: dkey(), ts: Date.now(), kind: 'strength', name: sp[0].replace(' day', '') + ' (quick log)', minutes: m, intensity: inten, kcal: exerciseKcal(STRENGTH_MET[inten], latestWeightKg(), m), items: [{ name: sp[0], prim: sp[1].slice(), sec: [], sets: [{}, {}, {}, {}] }] });
    save(); closeSheet(); toast('Saved. The muscle map is updated.');
  },
  viewWorkout(el) {
    const w = S.workouts.find(x => x.id === el.dataset.id); if (!w) return;
    openSheet(w.name, `<div class="sm dim">${w.date} · ${w.minutes} min · ${w.kcal} kcal</div>${(w.items || []).map(it => `<div class="card inner"><b>${esc(it.name)}</b><div class="sm dim">${it.sets.filter(s => s.reps).map(s => s.reps + '×' + (s.kg ? showW(s.kg) + wUnit() : 'BW')).join(', ') || it.sets.length + ' sets'}</div></div>`).join('')}<button class="btn danger block" data-act="delWorkout" data-id="${w.id}">Delete workout</button>`);
  },
  delWorkout(el) { S.workouts = S.workouts.filter(x => x.id !== el.dataset.id); save(); closeSheet(); },
  /* body */
  saveWeight() { const v = +$('#wv').value; if (!v || v < 20) return toast('Enter your weight.'); const k = dkey(), kg = toKg(v); const e = S.weights.find(w => w.date === k); if (e) e.kg = kg; else S.weights.push({ date: k, kg }); save(); render(); toast('Weight saved.'); },
  delWeight(el) { S.weights = S.weights.filter(w => w.date !== el.dataset.d); save(); render(); },
  /* log */
  newTracker() { openNewTracker(); },
  preset(el) { const p = PRESETS[+el.dataset.i]; $('#tn').value = (p[0] === 'Peptide' || p[0] === 'Supplement') ? '' : p[0]; $('#tt').value = p[1]; $('#tu').value = p[2]; $('#tn').focus(); },
  saveTracker() { const n = $('#tn').value.trim(); if (!n) return toast('Give it a name.'); S.trackers.push({ id: uid(), name: n, type: $('#tt').value, unit: $('#tu').value.trim() }); if ($('#tt').value === 'peptide' && !S.reminders.some(r => r.kind === 'pepcheck')) S.reminders.push({ id: uid(), label: 'Peptide check-in: open Healthica for today\'s tips', time: '09:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, kind: 'pepcheck' }); save(); closeSheet(); render(); },
  logIt(el) { openLogIt(el.dataset.id); },
  saveLog(el) { const v = $('#lv').value.trim(); if (!v) return toast('Enter a value.'); const t = $('#lt').value ? new Date($('#lt').value) : new Date(); S.logs.push({ id: uid(), trackerId: el.dataset.id, ts: t.getTime(), date: dkey(t), value: v, unit: $('#lu').value.trim(), note: ($('#ln').value || '') + ($('#ls') && $('#ls').value ? ' [' + $('#ls').value + ']' : '') }); save(); closeSheet(); toast('Logged.'); },
  delLog(el) { S.logs = S.logs.filter(l => l.id !== el.dataset.id); save(); render(); },
  trackerHist(el) { const t = S.trackers.find(x => x.id === el.dataset.id); const ls = S.logs.filter(l => l.trackerId === t.id).sort((a, b) => b.ts - a.ts); openSheet(t.name + ' history', ls.map(l => `<div class="entry"><div>${new Date(l.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}<div class="sm dim">${esc(l.note || '')}</div></div><div class="kc">${esc(l.value)} ${esc(l.unit || '')}</div></div>`).join('') + `<button class="btn danger block" data-act="delTracker" data-id="${t.id}">Delete this tracker and its entries</button>`); },
  delTracker(el) { const id = el.dataset.id; S.trackers = S.trackers.filter(t => t.id !== id); S.logs = S.logs.filter(l => l.trackerId !== id); S.reminders = S.reminders.filter(r => r.trackerId !== id); save(); closeSheet(); },
  reminderFor(el) { const t = S.trackers.find(x => x.id === el.dataset.id); openSheet('Reminder for ' + t.name, `<label class="fl">Time<input id="rft" class="in" type="time" value="20:00"></label><div class="chips" id="rd">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => `<button class="chip on" data-act="remDay" data-i="${i}">${d}</button>`).join('')}</div><button class="btn gold block" data-act="remForSave" data-id="${t.id}">Save reminder</button>`); },
  remForSave(el) { const t = S.trackers.find(x => x.id === el.dataset.id), days = $$('#rd .chip.on').map(c => +c.dataset.i); if (!days.length) return toast('Pick at least one day.'); S.reminders.push({ id: uid(), label: 'Take ' + t.name, time: $('#rft').value || '20:00', days, on: true, kind: 'tracker', trackerId: t.id }); save(); closeSheet(); toast('Reminder set. Add it to your phone calendar in Settings for a hard alarm.'); },
  /* reminders */
  remDay(el) { el.classList.toggle('on'); },
  remPreset(el) { const p = REM_PRESETS[+el.dataset.i]; S.reminders.push({ id: uid(), label: p[0], time: p[1], days: p[2].slice(), on: true, kind: p[3] }); save(); openSheet('Settings', viewSettings()); toast('Reminder added.'); },
  remCustom() { const l = $('#rl').value.trim(), t = $('#rt').value, days = $$('#rd .chip.on').map(c => +c.dataset.i); if (!l || !t || !days.length) return toast('Add text, time and days.'); S.reminders.push({ id: uid(), label: l, time: t, days, on: true, kind: 'custom' }); save(); openSheet('Settings', viewSettings()); },
  delRem(el) { S.reminders = S.reminders.filter(r => r.id !== el.dataset.id); save(); openSheet('Settings', viewSettings()); },
  notif() { if (typeof Notification === 'undefined') return toast('This browser cannot show notifications. Use the calendar button.'); Notification.requestPermission().then(p => { toast(p === 'granted' ? 'Notifications on.' : 'Notifications were not allowed.'); openSheet('Settings', viewSettings()); }); },
  ics() { exportICS(); },
  /* profile & data */
  editProfile() { openIntake(true); },
  saveProfile() {
    const u = $('#ob_u').value, w = +$('#ob_w').value, age = +$('#ob_age').value, h1 = +$('#ob_h1').value, h2 = +$('#ob_h2').value || 0;
    if (!w || !age || !h1) return toast('Please fill weight, age and height.');
    const kg = u === 'lb' ? lb2kg(w) : w, cm = u === 'lb' ? (h1 * 12 + h2) * 2.54 : h1;
    const first = !S.profile; S.profile = { name: $('#ob_name').value.trim(), sex: $('#ob_sex').value, age, units: u, weightKg: kg, heightCm: cm, baseAct: +$('#ob_act').value, goal: $('#ob_goal').value, rate: $('#ob_rate').value };
    if (first || !S.weights.length) { const k = dkey(); if (!S.weights.find(x => x.date === k)) S.weights.push({ date: k, kg }); }
    if (first) { [0, 1, 5, 6, 7].forEach(i => { const p = REM_PRESETS[i]; S.reminders.push({ id: uid(), label: p[0], time: p[1], days: p[2].slice(), on: true, kind: p[3] }); }); }
    save(); closeSheet(); toast(first ? 'All set. Welcome to Healthica.' : 'Profile saved.');
  },
  saveKey() { S.settings.usdaKey = $('#usda').value.trim(); save(); toast('Saved.'); },
  export() {
    const blob = new Blob([JSON.stringify(typeof bkAll === 'function' ? bkAll() : S, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'healthica-backup-' + dkey() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
  import() { $('#impf').click(); },
  wipe() { openSheet('Erase everything?', '<p>This deletes all food, weight, workouts and logs on this phone. It cannot be undone.</p><button class="btn danger block" data-act="wipeYes">Yes, erase</button><button class="btn block" data-act="closeSheet">Cancel</button>'); },
  wipeYes() { localStorage.removeItem(KEY); load(); closeSheet(); render(); },
  dismissTip() { S.settings.tipOff = true; save(); render(); }
};

document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); } });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.wk) { const it = window.WK.items[+t.dataset.i].sets[+t.dataset.j]; if (t.dataset.wk === 'reps') it.reps = +t.value || 0; else it.kg = t.value ? toKg(+t.value) : 0; }
  if (t.dataset && t.dataset.f && window.INT) window.INT.d[t.dataset.f] = t.value;
  if (t.id === 'symtxt') symState().text = t.value;
  if (t.id === 'wkmin') { window.WK.minutes = +t.value || 0; window.WK.touched = true; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'wkint') window.WK.intensity = t.value;
  if (t.dataset && t.dataset.sched !== undefined) { S.settings.schedule[+t.dataset.sched] = t.value; save(); }
  if (t.dataset && t.dataset.remtog) { const r = S.reminders.find(x => x.id === t.dataset.remtog); if (r) { r.on = t.checked; save(); } }
  if (t.id === 'impf' && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d.v && !d.multi) throw 0; t.value = ''; if (typeof bkRestoreAsk === 'function') { bkRestoreAsk(d); return; } S = d; save(); closeSheet(); render(); toast('Backup restored.'); } catch (x) { toast('That file is not a Healthica backup.'); } }; fr.readAsText(t.files[0]); }
});

/* ---------- reminders engine ---------- */
function fireReminder(r) {
  toast('Reminder: ' + r.label, 7000);
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { const opts = { body: 'Healthica · ' + hhmm(r.time), icon: 'img/icon-192.png', tag: r.id }; if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(reg => reg.showNotification('Healthica', Object.assign({ body: r.label }, opts))).catch(() => new Notification('Healthica', { body: r.label })); else new Notification('Healthica', { body: r.label }); } } catch (e) { }
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { }
}
function checkReminders() {
  const now = new Date(), k = dkey(now), cur = now.getHours() * 60 + now.getMinutes();
  S.reminders.forEach(r => {
    if (!r.on || !r.days.includes(now.getDay())) return;
    const [h, m] = r.time.split(':').map(Number), t = h * 60 + m, key = r.id + k;
    if (cur >= t && cur - t <= 5 && !S.settings.lastFired[key]) { S.settings.lastFired[key] = 1; fireReminder(r); saveSoon(); }
  });
  Object.keys(S.settings.lastFired).forEach(x => { if (x.slice(-10) < addDays(k, -2)) delete S.settings.lastFired[x]; });
}
function exportICS() {
  const pad = pad2, now = new Date(), stamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  const BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const ev = S.reminders.filter(r => r.on).map(r => {
    const [h, m] = r.time.split(':').map(Number), s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m), e = new Date(s.getTime() + 10 * 60000);
    return ['BEGIN:VEVENT', 'UID:' + r.id + '@healthica', 'DTSTAMP:' + now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART:' + stamp(s), 'DTEND:' + stamp(e), 'RRULE:FREQ=WEEKLY;BYDAY=' + r.days.map(d => BY[d]).join(','), 'SUMMARY:Healthica: ' + r.label.replace(/[,;]/g, ' '), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + r.label.replace(/[,;]/g, ' '), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  if (!ev.length) return toast('Add and switch on some reminders first.');
  const txt = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Healthica//EN\r\nCALSCALE:GREGORIAN\r\n' + ev.join('\r\n') + '\r\nEND:VCALENDAR\r\n';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = 'healthica-reminders.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  toast('Open the file to add the reminders to your calendar.');
}

/* ---------- startup ---------- */
function boot() {
  load();
  $('#tabs').innerHTML = ['today', 'food', 'train', 'body', 'log'].map(t => `<button data-tab="${t}">${icon(t, 22)}<span>${t[0].toUpperCase() + t.slice(1)}</span></button>`).join('');
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { UI.tab = b.dataset.tab; if (UI.tab === 'food') UI.date = dkey(); closeSheetQuiet(); setTab(UI.tab); } });
  render(); checkReminders(); pepAutoUpdate().then(r => { if (r === 'updated') render(); });
  setInterval(checkReminders, 20000);
  setInterval(() => { if (UI.tab === 'today' && !$('#sheet').classList.contains('open') && !document.hidden) render(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); if (!$('#sheet').classList.contains('open')) render(); } });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}
function closeSheetQuiet() { $('#sheet').classList.remove('open'); document.body.classList.remove('noscroll'); MED.stop(); }
window.addEventListener('DOMContentLoaded', boot);
