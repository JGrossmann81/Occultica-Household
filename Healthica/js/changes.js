/* Healthica changes: log a new injury, condition, allergy or prescription, and book appointments.
   Everything feeds the same tailoring as the first-run questionnaire. General wellness only. */
const CHG_SPLIT = { knee: ['legs', 'full'], hip: ['legs', 'full'], ankle: ['legs', 'cardio', 'full'], lowback: ['legs', 'back', 'core', 'full'], shoulder: ['arms', 'chest', 'full'], elbow: ['arms', 'full'], wrist: ['arms', 'chest', 'full'], upperback: ['back', 'full'] };
const APPT_KINDS = ['Doctor visit', 'Physical therapy', 'Therapy or counseling', 'Specialist', 'Lab work or imaging', 'Dentist', 'Other'];
const SEVS = [['1', 'Mild'], ['2', 'Moderate'], ['3', 'Severe']];
const RED_FLAGS = 'Get urgent care (or call 911) for: cannot put weight on it or use it, a bone that looks out of place, numbness or tingling that spreads, a head, neck or spine injury, severe swelling, fever, or chest pain.';
window.CHG = { sev: '2' };
const fmtDay = k => parseKey(k).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
const daysSince = k => Math.max(0, Math.round((parseKey(dkey()) - parseKey(k)) / 86400000));
const areaName = a => (INJ_AREAS.find(x => x[0] === a) || [0, a === 'other' ? 'Other area' : a])[1];
const chgActiveInj = () => (S.changes || []).filter(c => c.kind === 'injury' && c.status === 'active');
const apptStart = a => { const d = parseKey(a.date), [h, m] = (a.time || '09:00').split(':').map(Number); d.setHours(h, m, 0, 0); return d; };

/* ---- make the rest of the app follow the log ---- */
function syncHealth() {
  const h = S.profile && S.profile.h; if (!h) return;
  h.injuries = h.injuries || {};
  const areas = {}; (S.changes || []).filter(c => c.kind === 'injury' && c.area !== 'other').forEach(c => { areas[c.area] = areas[c.area] === 'current' || c.status === 'active' ? 'current' : 'past'; });
  Object.keys(areas).forEach(a => { h.injuries[a] = areas[a]; });
  const sch = S.settings.schedule, adj = S.settings.injAdj || {};
  Object.keys(adj).forEach(d => { if (sch[d] === 'active') sch[d] = adj[d]; }); S.settings.injAdj = {};
  const hit = new Set(); chgActiveInj().filter(c => +c.sev >= 2).forEach(c => (CHG_SPLIT[c.area] || []).forEach(s => hit.add(s)));
  Object.keys(sch).forEach(d => { if (hit.has(sch[d])) { S.settings.injAdj[d] = sch[d]; sch[d] = 'active'; } });
}
(function () {
  const g0 = guard; guard = function () {
    const g = g0(), inj = chgActiveInj();
    if (inj.some(c => +c.sev >= 3)) { g.noFast = true; g.why.push('Severe injury logged: the fast pace is paused while it heals, so your body has fuel to repair.'); }
    return g;
  };
  const a0 = applyMode; applyMode = function (id) { S.settings.injAdj = {}; a0(id); syncHealth(); };
})();

/* ---- guidance ---- */
function recoveryTips(c) {
  const d = daysSince(c.date), v = !!S.settings.vegan, p = budgetInfo().macros.p, t = [];
  if (d <= 3) t.push('First days: protect the area, avoid what hurts, and keep the rest of you gently moving. Ice or heat for comfort if it feels good.');
  else if (d <= 14) t.push('Settling in: gentle range-of-motion within comfort. Return to training slowly, and stop anything that brings the pain back.');
  else t.push('Over two weeks: if it still hurts or limits you, please have it checked rather than pushing through.');
  if (+c.sev >= 3) t.push('Severe: please have it examined soon.');
  t.push(`Fuel the repair: keep protein near ${p} g, and do not crash-diet. Vitamin C (peppers, citrus, berries), zinc (${v ? 'beans, pumpkin seeds' : 'beans, pumpkin seeds, meat'}), and ${v ? 'flax, walnuts, chia' : 'fish, flax, walnuts'} help. For a bone injury add calcium and vitamin D.`);
  return t;
}

/* ---- Today card ---- */
function changesCard() {
  const inj = chgActiveInj(), up = upcomingAppts(14).slice(0, 3);
  return `<section class="card"><div class="ct"><span>Health updates</span><a class="lnk" data-act="chgOpen">Open</a></div>
    ${inj.map(c => `<div class="nudge"><b>${esc(areaName(c.area))}: day ${daysSince(c.date) + 1}</b> <span class="dim sm">${SEVS[+c.sev - 1][1].toLowerCase()}</span><div class="sm dim">${esc(recoveryTips(c)[0])}</div></div>`).join('')}
    ${up.map(a => `<div class="entry"><div><b>${esc(a.title)}</b><div class="sm dim">${fmtDay(a.date)} · ${hhmm(a.time)}${a.place ? ' · ' + esc(a.place) : ''}</div></div></div>`).join('')}
    ${!inj.length && !up.length ? '<div class="sm dim">Hurt yourself, new diagnosis, new prescription or a doctor visit coming up? Add it here and Healthica adjusts.</div>' : ''}
    <button class="btn block" data-act="chgOpen">Injury, condition, prescription or appointment</button></section>`;
}
const upcomingAppts = days => { const now = Date.now() - 3600000, lim = Date.now() + days * 86400000; return (S.appts || []).filter(a => !a.done && apptStart(a) >= now && apptStart(a) <= lim).sort((a, b) => apptStart(a) - apptStart(b)); };

/* ---- main sheet ---- */
function chgMain() {
  const ch = S.changes || [], inj = ch.filter(c => c.kind === 'injury' && c.status === 'active'), other = ch.filter(c => (c.kind === 'condition' || c.kind === 'allergy') && c.status === 'active'),
    rx = ch.filter(c => c.kind === 'rx' && c.status === 'active'), ap = (S.appts || []).filter(a => !a.done && apptStart(a) >= Date.now() - 3600000).sort((a, b) => apptStart(a) - apptStart(b)),
    hist = ch.filter(c => c.status !== 'active').sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8);
  const row = (t, s, btns) => `<div class="entry"><div><b>${esc(t)}</b><div class="sm dim">${s}</div></div><div class="row">${btns}</div></div>`;
  return `<p class="dim sm">Tell Healthica what changed. Workouts, food filters, calorie pace and the medicine, peptide and symptom checks all follow. Everything stays on this phone.</p>
  <div class="grid2"><button class="btn gold" data-act="chgNew" data-v="injury">I got injured</button><button class="btn gold" data-act="chgNew" data-v="condition">New condition or allergy</button>
  <button class="btn gold" data-act="chgNew" data-v="rx">New prescription</button><button class="btn gold" data-act="chgNew" data-v="appt">Add appointment</button></div>
  ${inj.length ? `<div class="ct"><span>Injuries</span></div>${inj.map(c => row(areaName(c.area) + ' · ' + SEVS[+c.sev - 1][1].toLowerCase(), `since ${fmtDay(c.date)} (day ${daysSince(c.date) + 1})${c.note ? ' · ' + esc(c.note) : ''}`, `<button class="btn sm" data-act="chgHeal" data-id="${c.id}">Healed</button><button class="x" data-act="chgDel" data-id="${c.id}">&times;</button>`)).join('')}` : ''}
  ${other.length ? `<div class="ct"><span>Conditions and allergies</span></div>${other.map(c => row(c.label, `added ${fmtDay(c.date)}${c.note ? ' · ' + esc(c.note) : ''}`, `<button class="btn sm" data-act="chgHeal" data-id="${c.id}">No longer applies</button>`)).join('')}` : ''}
  ${rx.length ? `<div class="ct"><span>New prescriptions</span></div>${rx.map(c => row(c.label, `started ${fmtDay(c.date)}${c.why ? ' · for ' + esc(c.why) : ''}`, `<button class="btn sm" data-act="chgHeal" data-id="${c.id}">Stopped</button>`)).join('')}` : ''}
  ${ap.length ? `<div class="ct"><span>Appointments</span></div>${ap.map(a => row(a.title, `${fmtDay(a.date)} · ${hhmm(a.time)} · ${esc(a.kind)}${a.place ? ' · ' + esc(a.place) : ''}`, `<button class="btn sm" data-act="apptDone" data-id="${a.id}">Done</button><button class="x" data-act="apptDel" data-id="${a.id}">&times;</button>`)).join('')}<button class="btn block" data-act="ics">Add appointments and reminders to phone calendar</button>` : ''}
  ${hist.length ? `<div class="ct"><span>History</span></div>${hist.map(c => `<div class="sm dim">${fmtDay(c.date)} · ${esc(c.label)} · ${c.status === 'healed' ? 'healed' : c.status === 'stopped' ? 'stopped' : 'resolved'}</div>`).join('')}` : ''}
  <p class="sm dim">Healthica is for general wellness. For a new injury, condition or medicine, your clinician and pharmacist decide what is right for you.</p>`;
}
function openChanges() { openSheet('Health updates', chgMain()); }

/* ---- forms ---- */
const chgChips = (k, items) => `<div class="chips c" data-grp="${k}">${items.map(i => `<button type="button" class="chip" data-act="chgPick" data-k="${k}" data-v="${esc(i[0])}">${esc(i[1])}</button>`).join('')}</div>`;
const todayIn = id => `<input id="${id}" class="in" type="date" value="${dkey()}" max="2100-01-01">`;
function chgForm(kind, pre) {
  CHG = { sev: '2' }; let h = '';
  if (kind === 'injury') {
    h = `<p class="dim sm">Where does it hurt?</p>${chgChips('area', INJ_AREAS.concat([['other', 'Somewhere else']]))}
    <label class="fl">What happened?<textarea id="cn" class="in" rows="2" placeholder="e.g. rolled my ankle on a run"></textarea></label>
    <label class="fl">Date it happened${todayIn('cd')}</label>
    <p class="dim sm">How bad is it?</p><div class="seg" data-grp="sev">${SEVS.map(s => `<button type="button" class="${s[0] === '2' ? 'on' : ''}" data-act="chgPick" data-k="sev" data-v="${s[0]}">${s[1]}</button>`).join('')}</div>
    <p class="sm dim">${RED_FLAGS}</p>`;
  } else if (kind === 'condition') {
    const fem = S.profile && S.profile.sex === 'f', have = condSet(), items = CONDS.concat(fem ? FEM_CONDS : []).filter(c => !have.has(c[0])).map(c => ['c:' + c[0], c[1]]).concat(Object.keys(ALLERGENS).filter(a => !(H().allergies || []).includes(a)).map(a => ['a:' + a, 'Allergy: ' + ALLERGENS[a][0]]));
    h = `<p class="dim sm">What is new?</p>${chgChips('what', items.concat([['other', 'Something else']]))}
    <label class="fl">If something else, what is it?<input id="co" class="in" placeholder="Name of the condition"></label>
    <label class="fl">Date diagnosed or started${todayIn('cd')}</label><label class="fl">Notes (optional)<input id="cn" class="in" placeholder="e.g. diagnosed by my GP"></label>`;
  } else if (kind === 'rx') {
    h = `<label class="fl">Medicine or supplement name<input id="rn" class="in" placeholder="e.g. sertraline, metformin, ibuprofen"></label>
    <label class="fl">What is it for? (optional)<input id="cn" class="in" placeholder="e.g. knee pain"></label>
    <label class="fl">Start date${todayIn('cd')}</label>
    <label class="fl">Daily reminder to take it (optional)<input id="rt" class="in" type="time"></label>
    <p class="sm dim">Healthica adds it to your medicine list and checks it against everything else you take and your health profile. Never change a dose without your prescriber.</p>`;
  } else {
    h = `<label class="fl">Title<input id="at" class="in" placeholder="e.g. Dr. Lee, knee follow-up" value="${esc(pre && pre.title || '')}"></label>
    <label class="fl">Type<select id="ak" class="in">${APPT_KINDS.map(k => `<option ${pre && pre.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <div class="grid2"><label class="fl">Date${todayIn('cd')}</label><label class="fl">Time<input id="tm" class="in" type="time" value="09:00"></label></div>
    <label class="fl">Place (optional)<input id="ap" class="in" placeholder="Clinic or address"></label>
    <label class="fl">Repeats<select id="ar" class="in"><option value="1">Just once</option><option value="4">Weekly for 4 weeks</option><option value="6">Weekly for 6 weeks</option><option value="8">Weekly for 8 weeks</option><option value="12">Weekly for 12 weeks</option></select></label>
    <label class="fl">Remind me<select id="am" class="in"><option value="both">1 day before and 1 hour before</option><option value="1d">1 day before</option><option value="1h">1 hour before</option><option value="none">No reminder</option></select></label>
    <label class="fl">Notes (optional)<input id="cn" class="in" placeholder="Questions to ask, what to bring"></label>`;
  }
  openSheet({ injury: 'I got injured', condition: 'New condition or allergy', rx: 'New prescription', appt: 'Add appointment' }[kind], h + `<button class="btn gold block" data-act="chgSave" data-v="${kind}">Save</button><button class="btn block" data-act="chgOpen">Back</button>`);
}
function chgResult(title, lines, extra) {
  const m0 = modeOf(S.profile); syncHealth(); try { coerceMode(); } catch (e) { } save();
  const m1 = modeOf(S.profile); if (m1 !== m0) lines = lines.concat(['Your plan moved from <b>' + MODES[m0].label + '</b> to <b>' + MODES[m1].label + '</b> to fit this change. You can review it on Today.']);
  openSheet(title, lines.map(l => `<p>${l}</p>`).join('') + (extra || '') + '<button class="btn gold block" data-act="closeSheet">Done</button>');
}
function chgSave(kind) {
  const val = id => ($('#' + id) ? $('#' + id).value.trim() : ''), date = val('cd') || dkey(), id = uid();
  S.changes = S.changes || []; S.appts = S.appts || []; const h = S.profile.h = S.profile.h || {};
  if (kind === 'injury') {
    if (!CHG.area) return toast('Pick where it hurts.');
    const c = { id, kind, area: CHG.area, sev: CHG.sev || '2', date, note: val('cn'), status: 'active', label: areaName(CHG.area) + ' injury' }; S.changes.push(c);
    const hid = (typeof allEx === 'function') ? (() => { syncHealth(); try { return allEx().filter(e => typeof exRisk === 'function' && exRisk(e).length).length; } catch (x) { return 0; } })() : 0;
    const lines = [`Logged: <b>${esc(c.label)}</b>, ${SEVS[+c.sev - 1][1].toLowerCase()}, since ${fmtDay(date)}.`];
    syncHealth();
    if (+c.sev >= 2 && CHG_SPLIT[c.area]) lines.push('Your training week now swaps the days that load that area for gentle active recovery. They return when you mark it healed.');
    else if (CHG_SPLIT[c.area]) lines.push('Training stays as planned, but moves that stress it are marked "Careful" and left out of suggestions.');
    if (hid) lines.push(`${hid} exercises are now flagged for this area.`);
    if (c.area === 'other') lines.push('Healthica cannot map that area to exercises, so go by comfort and skip anything that hurts.');
    recoveryTips(c).forEach(t => lines.push(esc(t))); lines.push(esc(RED_FLAGS));
    return chgResult('Injury logged', lines, '<button class="btn block" data-act="chgNew" data-v="appt" data-pre="injury">Book a doctor or therapy visit for this</button>');
  }
  if (kind === 'condition') {
    const w = CHG.what; if (!w) return toast('Pick what is new.');
    let label, note = val('cn'); const c = { id, date, note, status: 'active' };
    if (w === 'other') { label = val('co'); if (!label) return toast('Type what it is.'); h.condOther = (h.condOther ? h.condOther + ', ' : '') + label; c.kind = 'condition'; c.other = label; }
    else if (w[0] === 'a') { const a = w.slice(2); label = 'Allergy: ' + ALLERGENS[a][0]; h.allergies = h.allergies || []; if (!h.allergies.includes(a)) h.allergies.push(a); c.kind = 'allergy'; c.key = a; }
    else { const k = w.slice(2); label = condLabel(k); h.conditions = h.conditions || []; if (!h.conditions.includes(k)) h.conditions.push(k); c.kind = 'condition'; c.key = k; }
    c.label = label; S.changes.push(c);
    const g = guard(), lines = [`Added: <b>${esc(label)}</b>.`, 'Medicine, peptide and symptom checks now take it into account' + (c.kind === 'allergy' ? ', and matching foods are hidden from search (still read labels).' : '.')];
    g.why.forEach(x => lines.push(esc(x))); if (c.key) g.notes.forEach(x => lines.push(esc(x)));
    if (c.kind === 'condition') lines.push('Remember to add any new prescriptions and appointments for it.');
    return chgResult('Updated', lines, '<button class="btn block" data-act="chgNew" data-v="rx">Add a prescription</button><button class="btn block" data-act="chgNew" data-v="appt">Add an appointment</button>');
  }
  if (kind === 'rx') {
    const n = val('rn'); if (!n) return toast('Type the medicine name.');
    const c = { id, kind, label: n, why: val('cn'), date, status: 'active' }, t = val('rt');
    if (t) { const r = { id: uid(), label: 'Take ' + n, time: t, days: [0, 1, 2, 3, 4, 5, 6], on: true, kind: 'custom' }; S.reminders.push(r); c.remId = r.id; }
    S.changes.push(c);
    const cur = (S.settings.medText || '').split(/[,\n;]+/).map(x => x.trim()).filter(Boolean); if (!cur.some(x => x.toLowerCase() === n.toLowerCase())) cur.push(n); S.settings.medText = cur.join(', ');
    save(); const res = medCheck(S.settings.medText);
    return chgResult('Prescription added', [`Added <b>${esc(n)}</b> to your medicine list${t ? ' with a daily reminder at ' + hhmm(t) : ''}. Here is the check against everything you take and your profile:`], medResultHTML(res));
  }
  if (kind === 'appt') {
    const title = val('at'); if (!title) return toast('Give the appointment a title.');
    const n = +val('ar') || 1, grp = uid();
    for (let i = 0; i < n; i++) S.appts.push({ id: uid(), grp, title, kind: val('ak'), date: addDays(date, 7 * i), time: val('tm') || '09:00', place: val('ap'), note: val('cn'), remind: val('am') || 'both', done: false });
    save(); return chgResult('Appointment added', [`<b>${esc(title)}</b> on ${fmtDay(date)} at ${hhmm(val('tm') || '09:00')}${n > 1 ? `, repeating weekly (${n} visits)` : ''}.`, val('am') === 'none' ? 'No reminder set.' : 'Healthica will remind you while it is open or recently used. For an alarm that always rings, add it to your phone calendar.'], '<button class="btn block" data-act="ics">Add to phone calendar</button>');
  }
}
Object.assign(ACT, {
  chgOpen() { openChanges(); },
  chgNew(el) { chgForm(el.dataset.v, el.dataset.pre === 'injury' ? { title: 'Follow-up for ' + areaName((chgActiveInj().slice(-1)[0] || {}).area || 'injury').toLowerCase(), kind: 'Doctor visit' } : null); },
  chgPick(el) { const k = el.dataset.k; $$(`[data-grp="${k}"] > *`).forEach(c => c.classList.remove('on')); el.classList.add('on'); CHG[k] = el.dataset.v; },
  chgSave(el) { chgSave(el.dataset.v); },
  chgHeal(el) {
    const c = (S.changes || []).find(x => x.id === el.dataset.id); if (!c) return;
    c.status = c.kind === 'injury' ? 'healed' : c.kind === 'rx' ? 'stopped' : 'resolved'; c.end = dkey();
    const h = S.profile.h;
    if (c.kind === 'condition' && c.key) h.conditions = (h.conditions || []).filter(x => x !== c.key);
    if (c.kind === 'allergy') h.allergies = (h.allergies || []).filter(x => x !== c.key);
    if (c.kind === 'rx') { const rx = c.label.toLowerCase(); S.settings.medText = (S.settings.medText || '').split(/[,\n;]+/).map(x => x.trim()).filter(x => x && x.toLowerCase() !== rx).join(', '); S.reminders = S.reminders.filter(r => r.id !== c.remId); }
    syncHealth(); try { coerceMode(); } catch (e) { } save(); openChanges();
    toast(c.kind === 'injury' ? 'Great. Ease back in slowly: start light, build over a couple of weeks.' : 'Updated.', 4500);
  },
  chgDel(el) { S.changes = (S.changes || []).filter(c => c.id !== el.dataset.id); const h = S.profile.h; Object.keys(h.injuries || {}).forEach(a => { if (!S.changes.some(c => c.kind === 'injury' && c.area === a)) { /* keep questionnaire answer */ } }); syncHealth(); save(); openChanges(); },
  apptDone(el) { const a = (S.appts || []).find(x => x.id === el.dataset.id); if (a) a.done = true; save(); openChanges(); },
  apptDel(el) { S.appts = (S.appts || []).filter(x => x.id !== el.dataset.id); save(); openChanges(); }
});

/* ---- appointment reminders and calendar file ---- */
function apptTick() {
  const now = Date.now(); S.settings.lastFired = S.settings.lastFired || {};
  (S.appts || []).forEach(a => {
    if (a.done || a.remind === 'none') return; const st = apptStart(a).getTime();
    [['1d', 86400000, 'tomorrow'], ['1h', 3600000, 'in 1 hour']].forEach(([k, off, w]) => {
      if (a.remind !== 'both' && a.remind !== k) return; const t = st - off, key = a.id + k;
      if (now >= t && now - t <= 40 * 60000 && now < st && !S.settings.lastFired[key]) { S.settings.lastFired[key] = 1; fireReminder({ id: key, label: a.title + ' ' + w, time: a.time }); saveSoon(); }
    });
  });
}
(function () { const c0 = checkReminders; checkReminders = function () { c0(); try { apptTick(); } catch (e) { } }; })();
exportICS = function () {
  const pad = pad2, now = new Date(), stamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00', BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'], cl = s => String(s || '').replace(/[,;\n]/g, ' '), ds = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const alarm = (txt, trig) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + cl(txt), 'TRIGGER:' + trig, 'END:VALARM'];
  const ev = S.reminders.filter(r => r.on).map(r => {
    const [h, m] = r.time.split(':').map(Number), s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m), e = new Date(s.getTime() + 10 * 60000);
    return ['BEGIN:VEVENT', 'UID:' + r.id + '@healthica', 'DTSTAMP:' + ds, 'DTSTART:' + stamp(s), 'DTEND:' + stamp(e), 'RRULE:FREQ=WEEKLY;BYDAY=' + r.days.map(d => BY[d]).join(','), 'SUMMARY:Healthica: ' + cl(r.label)].concat(alarm(r.label, 'PT0M'), ['END:VEVENT']).join('\r\n');
  });
  (S.appts || []).filter(a => !a.done && apptStart(a) > now).forEach(a => {
    const s = apptStart(a), e = new Date(s.getTime() + 3600000), L = ['BEGIN:VEVENT', 'UID:' + a.id + '@healthica', 'DTSTAMP:' + ds, 'DTSTART:' + stamp(s), 'DTEND:' + stamp(e), 'SUMMARY:' + cl(a.title) + ' (' + cl(a.kind) + ')'];
    if (a.place) L.push('LOCATION:' + cl(a.place)); if (a.note) L.push('DESCRIPTION:' + cl(a.note));
    if (a.remind === 'both' || a.remind === '1d') L.push.apply(L, alarm(a.title, '-P1D')); if (a.remind === 'both' || a.remind === '1h') L.push.apply(L, alarm(a.title, '-PT1H'));
    L.push('END:VEVENT'); ev.push(L.join('\r\n'));
  });
  if (!ev.length) return toast('Add and switch on some reminders or appointments first.');
  const txt = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Healthica//EN\r\nCALSCALE:GREGORIAN\r\n' + ev.join('\r\n') + '\r\nEND:VCALENDAR\r\n';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = 'healthica-calendar.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  toast('Open the file to add everything to your calendar.');
};
