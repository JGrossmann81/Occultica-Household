/* Saturnica I Got Thi$, round 3: month-ahead forecast, pay schedule, graduation reality check,
   beginner medals, skip a cycle, undo graduation. Loads after gm2.js. */

/* ================= date stepping ================= */
function gmStep(dstr, rec, dom) {
  const d = pd(dstr);
  if (rec === 'w') return dkey(addD(d, 7)); if (rec === 'b') return dkey(addD(d, 14));
  return dkey(monthShift(d, dom || d.getDate(), rec === 'q' ? 3 : rec === 'y' ? 12 : 1));
}

/* ================= 2. pay schedule ================= */
const GM_SF = [['w', 'Every week'], ['b', 'Every 2 weeks'], ['sm', 'Twice a month (two set dates)'], ['m', 'Once a month']];
const gmScheds = () => (S.gm.sched = S.gm.sched || []);
function gmSchedNext(s, from) {
  if (s.f === 'sm') { const d = pd(from), a = Math.min(s.d1, s.d2), b = Math.max(s.d1, s.d2), day = d.getDate(); const t = (y, m, dd) => dkey(monthShift(new Date(y, m, 1), dd, 0));
    if (day < a) return t(d.getFullYear(), d.getMonth(), a); if (day < b) return t(d.getFullYear(), d.getMonth(), b); return t(d.getFullYear(), d.getMonth() + 1, a); }
  return gmStep(from, s.f, pd(s.next).getDate());
}
function gmSchedFirst(s, today) { if (s.f !== 'sm') return s.next; const d = pd(today); d.setDate(d.getDate() - 1); return gmSchedNext(s, dkey(d)); }
ACT.gmSched = el => {
  const id = el && el.dataset ? el.dataset.id : null, s = id ? gmScheds().find(x => x.id === id) : null, L = gmScheds();
  let h = '<p class="sm dim">Tell Saturnica when you get paid. It pre-fills each payday for one tap, shows it in the month-ahead forecast, and adds it to your calendar.</p>';
  if (!s && L.length) h += L.map(x => '<div class="nrow"><b>' + esc(x.n) + '</b> ' + gmM(x.amt) + ' <span class="dim sm">' + esc((GM_SF.find(f => f[0] === x.f) || [0, ''])[1].toLowerCase()) + ', next ' + gmDate(x.next) + '</span> <button class="mini" data-act="gmSched" data-id="' + x.id + '">Edit</button></div>').join('') + '<h4 class="sech">Add another</h4>';
  h += '<label class="fl">Name<input class="in" id="gs_n" value="' + esc(s ? s.n : 'Paycheck') + '" autocomplete="off"></label><div class="grid2"><label class="fl">About how much<input class="in" id="gs_a" inputmode="decimal" placeholder="$" value="' + esc(s ? s.amt : '') + '"></label><label class="fl">How often<select class="in" id="gs_f" data-chg="gmSchedF">' + GM_SF.map(f => '<option value="' + f[0] + '"' + (s && s.f === f[0] ? ' selected' : '') + '>' + f[1] + '</option>').join('') + '</select></label></div>' +
    '<label class="fl" id="gs_dwrap">Next payday<input class="in" type="date" id="gs_d" value="' + (s ? s.next : dkey(addD(NOW(), 7))) + '"></label><div class="grid2" id="gs_swrap" hidden><label class="fl">First pay day of the month<input class="in" id="gs_d1" inputmode="numeric" value="' + (s && s.d1 ? s.d1 : 1) + '"></label><label class="fl">Second pay day<input class="in" id="gs_d2" inputmode="numeric" value="' + (s && s.d2 ? s.d2 : 15) + '"></label></div>' +
    '<button class="btn gold block" data-act="gmSchedSave" data-id="' + (s ? s.id : '') + '">Save pay schedule</button>' + (s ? '<button class="btn danger block" data-act="gmSchedDel" data-id="' + s.id + '">Remove</button>' : '');
  openSheet(s ? 'Edit pay schedule' : '📅 Pay schedule', h); if (s && s.f === 'sm') CHG.gmSchedF({ value: 'sm' });
};
CHG.gmSchedF = el => { const sm = el.value === 'sm'; $('#gs_swrap').hidden = !sm; $('#gs_dwrap').hidden = sm; };
ACT.gmSchedSave = el => {
  const amt = num($('#gs_a').value); if (amt <= 0) { toast('Type about how much you get paid.'); return; }
  const f = $('#gs_f').value, s = el.dataset.id ? gmScheds().find(x => x.id === el.dataset.id) : { id: uid() }; if (!el.dataset.id) gmScheds().push(s);
  Object.assign(s, { n: $('#gs_n').value.trim() || 'Paycheck', amt, f, d1: clamp(Math.round(num($('#gs_d1').value)) || 1, 1, 28), d2: clamp(Math.round(num($('#gs_d2').value)) || 15, 1, 28) });
  if (f === 'sm') s.next = gmSchedFirst(s, dkey()); else s.next = $('#gs_d').value || dkey(addD(NOW(), 7));
  logIt('Pay schedule set'); addXP(5); after(); closeSheetQuiet(); render(); toast('📅 Saved. Next payday ' + gmDate(s.next) + '.', 3000);
};
ACT.gmSchedDel = el => { S.gm.sched = gmScheds().filter(x => x.id !== el.dataset.id); save(); closeSheetQuiet(); render(); toast('Pay schedule removed.'); };
const gmPending = () => gmScheds().filter(s => dayDiff(pd(s.next), NOW()) <= 0).sort((a, b) => a.next < b.next ? -1 : 1)[0];
function gmPaydayCard() {
  const s = gmPending(); if (!s) return '';
  return '<section class="card gmwarn"><div class="ct"><span>💵 Payday?</span></div><p class="sm">Your <b>' + esc(s.n) + '</b> was expected ' + (dayDiff(pd(s.next), NOW()) === 0 ? 'today' : gmDate(s.next)) + ' (about ' + gmM(s.amt) + '). Did it land?</p><div class="row"><button class="btn gold" data-act="gmPayConfirm" data-id="' + s.id + '">Yes, ' + gmM(s.amt) + '</button><button class="btn" data-act="gmPayOther" data-id="' + s.id + '">Different amount</button></div><button class="btn block" data-act="gmPayMiss" data-id="' + s.id + '">It did not come this time</button></section>';
}
function gmLogSched(s, amt) { S.gm.pays.push({ id: uid(), d: s.next, amt, n: s.n }); logIt('Paycheck ' + gmM(amt)); s.next = gmSchedNext(s, s.next); const xp = addXP(10); after(); closeSheetQuiet(); render(); toast('💵 +' + gmM(amt) + ' in the pot · +' + xp + ' XP', 3000); }
ACT.gmPayConfirm = el => { const s = gmScheds().find(x => x.id === el.dataset.id); if (s) gmLogSched(s, num(s.amt)); };
ACT.gmPayOther = el => { const s = gmScheds().find(x => x.id === el.dataset.id); if (!s) return; openSheet('Payday amount', '<label class="fl">What you actually got<input class="in" id="gp_amt2" inputmode="decimal" value="' + esc(s.amt) + '"></label><button class="btn gold block" data-act="gmPayOther2" data-id="' + s.id + '">Add to the pot</button>'); };
ACT.gmPayOther2 = el => { const s = gmScheds().find(x => x.id === el.dataset.id), a = num($('#gp_amt2').value); if (!s || a <= 0) { toast('Type the amount.'); return; } gmLogSched(s, a); };
ACT.gmPayMiss = el => { const s = gmScheds().find(x => x.id === el.dataset.id); if (!s) return; s.next = gmSchedNext(s, s.next); save(); render(); toast('Skipped that payday.'); };
const _ps0 = ACT.gmPaySave; // a manually logged paycheck near a scheduled payday counts as that payday
ACT.gmPaySave = () => { const nm = ($('#gp_n') || {}).value ? $('#gp_n').value.trim().toLowerCase() : '', d = ($('#gp_d') || {}).value || dkey(), n0 = S.gm.pays.length; _ps0(); if (S.gm.pays.length > n0) gmScheds().forEach(s => { if (s.n.toLowerCase() === nm && Math.abs(dayDiff(pd(d), pd(s.next))) <= 5) s.next = gmSchedNext(s, s.next); }); save(); };
const _ics0 = buildBillICS;
buildBillICS = function () {
  let t = _ics0(); const ev = [], now = new Date(), st = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + 'T' + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + '00Z';
  gmScheds().forEach(s => { const rr = s.f === 'w' ? 'RRULE:FREQ=WEEKLY' : s.f === 'b' ? 'RRULE:FREQ=WEEKLY;INTERVAL=2' : s.f === 'sm' ? 'RRULE:FREQ=MONTHLY;BYMONTHDAY=' + Math.min(s.d1, s.d2) + ',' + Math.max(s.d1, s.d2) : 'RRULE:FREQ=MONTHLY';
    ev.push('BEGIN:VEVENT', 'UID:sat-pay-' + s.id + '@saturnica.local', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + icsD(s.next), 'DTEND;VALUE=DATE:' + icsD(dkey(addD(pd(s.next), 1))), rr, 'SUMMARY:' + icsEsc('💵 Payday: ' + s.n + ' (about ' + gmM(s.amt) + ')'), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Payday. Log it in Saturnica.', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT'); });
  return ev.length ? t.replace('END:VCALENDAR', ev.join('\r\n') + '\r\nEND:VCALENDAR') : t;
};

/* ================= 1. month-ahead forecast ================= */
function gmForecast(days) {
  days = days || 35; const g = S.gm, today = dkey(), end = dkey(addD(NOW(), days)), ev = {}, list = [];
  const add = (d, n, amt, kind) => { const k = d < today ? today : d; if (k > end) return; (ev[k] = ev[k] || []).push({ n, amt, kind }); list.push({ d: k, n, amt, kind }); };
  gmOpenBills().forEach(b => { let d = b.due, amt = num(b.amt) + (gmFeeOn(b) ? num(b.fee) : 0), first = true, guard = 0; while (d <= end && guard++ < 60) { add(d, b.n, -(first ? amt : num(b.base)), 'bill'); first = false; if ((b.rec || 'm') === 'o') break; d = gmStep(d, b.rec || 'm', b.dom); } });
  gmScheds().forEach(s => { let d = s.next, guard = 0; while (d <= end && guard++ < 60) { add(d, s.n, num(s.amt), 'pay'); d = gmSchedNext(s, d); } });
  gmGigs().forEach(x => add(x.d, x.n, num(x.amt), 'gig'));
  let pot = gmPot(); const daily = num(g.food) / 30.44, pts = []; let min = { v: pot, d: today }, firstNeg = null;
  for (let i = 0; i <= days; i++) { const d = dkey(addD(NOW(), i)); (ev[d] || []).forEach(e => { pot += e.amt; e.after = pot; }); if (i > 0) pot -= daily; pts.push({ d, v: pot }); if (pot < min.v) min = { v: pot, d }; if (pot < -0.5 && !firstNeg) firstNeg = { d, v: pot }; }
  list.sort((a, b) => a.d < b.d ? -1 : 1); let run = gmPot(); const daysBefore = d => Math.max(0, dayDiff(pd(d), NOW())); list.forEach(e => { run += e.amt; e.run = run - daily * daysBefore(e.d); });
  return { pts, min, firstNeg, list, hasPay: gmScheds().length > 0 };
}
function gmSpark(F) {
  const W = 350, H = 96, P = 6, vs = F.pts.map(p => p.v), lo = Math.min(0, Math.min.apply(null, vs)), hi = Math.max(1, Math.max.apply(null, vs)), X = i => P + i * (W - 2 * P) / (F.pts.length - 1), Y = v => P + (hi - v) * (H - 2 * P) / (hi - lo), z = Y(0);
  const d = F.pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="gmspark" role="img" aria-label="Projected pot over the next five weeks"><rect x="0" y="' + z.toFixed(1) + '" width="' + W + '" height="' + Math.max(0, H - z).toFixed(1) + '" fill="rgba(196,87,74,.14)"/><line x1="0" x2="' + W + '" y1="' + z.toFixed(1) + '" y2="' + z.toFixed(1) + '" stroke="#9aa8c4" stroke-dasharray="3 3" stroke-width="1"/><path d="' + d + '" fill="none" stroke="#e2b857" stroke-width="2.2" stroke-linejoin="round"/>' + (F.firstNeg ? '<circle cx="' + X(F.pts.findIndex(p => p.d === F.firstNeg.d)).toFixed(1) + '" cy="' + Y(F.firstNeg.v).toFixed(1) + '" r="4.5" fill="#c4574a"/>' : '') + '</svg>';
}
function gmForecastCard() {
  if (!gmOpenBills().length && !gmScheds().length) return '';
  const F = gmForecast(35); let head;
  if (F.firstNeg) { const need = Math.ceil(-F.min.v); head = '<p><b class="red">You will dip below zero on ' + gmDate(F.firstNeg.d) + '</b>, lowest about <b class="red">' + gmM(Math.round(F.min.v)) + '</b> on ' + gmDate(F.min.d) + '.</p><p class="sm">Closing that gap takes roughly <b>' + gmM(need) + '</b> more before then: a gig, a cash drop, or moving a bill (call them first).</p>'; }
  else head = '<p><b class="ok">You stay above zero for the next five weeks.</b> Lowest point about ' + gmM(Math.round(F.min.v)) + ' on ' + gmDate(F.min.d) + '.</p>';
  const rows = F.list.slice(0, 8).map(e => '<div class="gmq"><span class="sm dim" style="width:46px">' + gmDate(e.d) + '</span><div><b>' + esc(e.n) + '</b> <span class="' + (e.amt < 0 ? '' : 'ok') + '">' + (e.amt < 0 ? '-' : '+') + gmM(Math.abs(e.amt)) + '</span></div><small class="' + (e.run < 0 ? 'red' : 'dim') + '">' + gmM(Math.round(e.run)) + '</small></div>').join('');
  return '<section class="card' + (F.firstNeg ? ' gmwarn' : '') + '"><div class="ct"><span>🔮 Next five weeks</span><a class="lnk" data-act="gmSched">Pay schedule</a></div>' + head + gmSpark(F) + '<div class="sm dim gmaxis"><span>' + gmDate(F.pts[0].d) + '</span><span>' + gmDate(F.pts[F.pts.length - 1].d) + '</span></div>' +
    (F.hasPay ? '' : '<div class="flag"><b>Add your pay schedule.</b> <span class="sm">Right now this forecast assumes no more paychecks, which is the harshest case. Tell Saturnica when you get paid for a true picture.</span><button class="btn block" data-act="gmSched">📅 Set my pay schedule</button></div>') +
    '<details><summary class="sm">What is coming, with the pot after each (food money included)</summary>' + (rows || '<p class="sm dim">Nothing scheduled.</p>') + '</details></section>';
}
const _gm2b = gm2; gm2 = function (w) { return w === 'top' ? gmDigestCard() + gmPaydayCard() + gmForecastCard() + gmStepsCard() : _gm2b(w); };
const _hc1 = gmHomeCard; gmHomeCard = function () { return gmPaydayCard() + _hc1(); };
GM_STEPS.splice(1, 0, ['sched', '📅', 'Set your pay schedule', g => (g.sched || []).length > 0, 'gmSched']);

/* ================= 3. reality check ================= */
function gmReality(now, start) {
  const g = S.gm, first = gmFirst(); if (!first || now === '' || start === '') return null; const days = Math.max(14, dayDiff(NOW(), pd(first))), months = days / 30.44;
  const inc = g.pays.reduce((a, p) => a + num(p.amt), 0), bills = g.paid.reduce((a, p) => a + num(p.amt) + num(p.fee), 0), food = num(g.food) * months;
  const expected = inc - bills - food, actual = num(now) - num(start), gap = expected - actual;
  return { gap, per: gap / months, months, inc, bills, food, actual, expected };
}
function gmRealHTML() {
  return '<div class="flag"><b>Reality check (optional, 30 seconds)</b><br><span class="sm">Your budget is built from the bills you logged. Anything you never typed in (gas, haircuts, snacks, phone top-ups) is missing, so it would look better than real life. Tell Saturnica two bank balances and it will find the missing spending. Nothing leaves your device.</span><label class="fl">Bank balance now<input class="in" id="gr_now" inputmode="decimal" data-chg="gmReal" placeholder="$"></label><label class="fl">Bank balance when you started tracking (about)<input class="in" id="gr_start" inputmode="decimal" data-chg="gmReal" placeholder="$" value="' + esc(val(S.gm.cash0)) + '"></label><div id="gr_out" class="sm"></div></div>';
}
CHG.gmReal = () => {
  const n = $('#gr_now').value.trim(), s = $('#gr_start').value.trim(), out = $('#gr_out'); if (n === '' || s === '') { out.innerHTML = ''; return; }
  const R = gmReality(num(n), num(s)); if (!R) { out.innerHTML = ''; return; }
  if (R.per > 25) out.innerHTML = '<p>About <b>' + gmM(Math.round(R.per)) + '</b> a month went somewhere we never saw. That is real spending: gas, fun, small stuff.</p><label class="tog"><input type="checkbox" id="gr_add" data-amt="' + Math.round(R.per) + '" checked><span>Add "Everything else we did not see" at ' + gmM(Math.round(R.per)) + '/mo to my budget</span></label>';
  else if (R.per < -25) out.innerHTML = '<p>Your balance grew about <b>' + gmM(Math.round(-R.per)) + '</b> a month more than expected. Some income probably was not logged. Nice problem to have.</p>';
  else out.innerHTML = '<p class="ok">Your logged numbers match your bank. The budget should be close to real.</p>';
};
const _bh1 = gmBasisHTML; gmBasisHTML = function (A) { return _bh1(A) + gmRealHTML(); };

/* ================= undo graduation, one-time XP ================= */
const GRAD_KEYS = ['inc', 'exp', 'custom', 'debts', 'applied'];
const _grad0 = ACT.gmGrad;
ACT.gmGrad = () => {
  const g = S.gm, snap = {}; GRAD_KEYS.forEach(k => { snap[k] = JSON.parse(JSON.stringify(S[k] === undefined ? null : S[k])); }); const add = $('#gr_add') && $('#gr_add').checked ? +$('#gr_add').dataset.amt : 0, had = !!g.gradPaid, xp0 = S.game.xp;
  _grad0(); g.undoSnap = snap; g.undoOn = dkey(); if (had) S.game.xp = xp0; g.gradPaid = 1;
  if (add > 0) S.custom.push({ id: uid(), n: 'Everything else we did not see', amt: add, f: 'm', cat: 'other', gm: 1 }); save(); render();
};
const gmUngradOK = () => S.gm && S.gm.grad && S.gm.undoSnap && dayDiff(NOW(), pd(S.gm.undoOn)) <= 7;
ACT.gmUngrad = () => { const g = S.gm; if (!gmUngradOK()) return; GRAD_KEYS.forEach(k => { S[k] = g.undoSnap[k] === null ? (k === 'applied' ? null : S[k]) : g.undoSnap[k]; }); g.grad = null; g.undoSnap = null; UI.tab = 'gtoday'; logIt('Went back to I Got Thi$ mode'); save(); closeSheetQuiet(); render(); toast('Back in I Got Thi$ mode. Your bills and paychecks are all still here.', 4000); };
const _menu1 = ACT.menu;
ACT.menu = () => { _menu1(); if (!gmHas()) return; const body = $('#sheet .sh-body'); if (!body) return; const rows = [['gmSched', '📅', 'Pay schedule', 'Expected paydays, forecast, calendar']].concat(gmUngradOK() ? [['gmUngrad', '↩️', 'Go back to I Got Thi$ mode', 'Undo graduation (within 7 days)']] : []);
  const d = document.createElement('div'); d.innerHTML = rows.map(a => '<button class="mrow" data-act="' + a[0] + '"><span class="me">' + a[1] + '</span><span><b>' + a[2] + '</b><br><small class="dim">' + a[3] + '</small></span></button>').join(''); while (d.firstChild) body.insertBefore(d.firstChild, body.children[1] || null); };

/* ================= skip a cycle ================= */
const _pdo = ACT.gmPaid;
ACT.gmPaid = el => { _pdo(el); const b = S.gm.bills.find(x => x.id === el.dataset.id), body = $('#sheet .sh-body'); if (!b || !body) return; const d = document.createElement('div'); d.innerHTML = '<button class="btn block" data-act="gmSkip" data-id="' + b.id + '">⏭ Skip this cycle (not paying it this time)</button><p class="sm dim">Use this for a bill you are not paying this round, like a month you are on a payment plan or the company waived it. It moves to the next due date without touching your pot.</p>'; body.appendChild(d); };
ACT.gmSkip = el => { const g = S.gm, b = g.bills.find(x => x.id === el.dataset.id); if (!b) return; g.skips = g.skips || []; g.skips.unshift({ id: uid(), bid: b.id, n: b.n, d: dkey(), prev: { due: b.due, lateOn: b.lateOn, amt: b.amt, partial: !!b.partial, done: !!b.done } }); gmAdv(b); logIt('Skipped ' + b.n + ' this cycle'); save(); closeSheetQuiet(); render(); toast('⏭ ' + b.n + ' skipped. Next due ' + (b.done ? 'never (one-time)' : gmDate(b.due)) + '.', 3500); };
ACT.gmSkipUndo = el => { const g = S.gm, i = (g.skips || []).findIndex(x => x.id === el.dataset.id); if (i < 0) return; const k = g.skips[i], b = g.bills.find(x => x.id === k.bid); if (b) Object.assign(b, k.prev); g.skips.splice(i, 1); save(); render(); toast('Skip undone.'); };

/* ================= 4. beginner medals ================= */
const GM_MEDALS = [
  ['gstart', '😎', 'In the Game', 'Started I Got Thi$ mode'], ['gontime', '⏱️', 'On the Dot', 'Pay a bill on time'], ['gtrio', '🎯', 'Three in a Row', 'Pay three bills on time in a row'],
  ['gavoid', '🛡️', 'Fee Dodger', 'Pay on time a bill that has a late fee'], ['gdown', '📉', 'Balance Going Down', 'Pay down a debt balance'], ['gcrush', '💥', 'Debt Crusher', 'Pay a debt off completely'],
  ['gcover', '🏦', 'Covered', 'Have the next 14 days of bills and food covered'], ['g30', '🗓️', 'Thirty Clean Days', '30 days of tracking with no late fee'], ['gsched', '📅', 'Planner', 'Set your pay schedule'], ['gback', '💾', 'Safe and Sound', 'Make your first backup'], ['gside', '🛻', 'Side Hustler', 'Get paid for a gig']
];
function gmRun() { let n = 0; for (const p of S.gm.paid) { if (p.ont) n++; else break; } return n; }
function gmMedalCheck() {
  if (!gmHas()) return; const g = S.gm; g.meds = g.meds || {}; const P = g.paid, T = {
    gstart: true, gontime: P.some(p => p.ont), gtrio: gmRun() >= 3 || P.filter(p => p.ont).length >= 3 && gmRun() >= 3, gavoid: P.some(p => p.ont && num(p.bfee) > 0 && !num(p.fee)),
    gdown: P.some(p => p.prevBal != null && p.balAfter != null && p.balAfter < p.prevBal), gcrush: g.bills.some(b => b.type === 'debt' && b.done && num(b.bal) === 0 && P.some(p => p.bid === b.id && p.prevBal != null)),
    gcover: g.paid.length + g.pays.length > 0 && gmPot() - gmOpenBills().filter(b => gmDue(b) <= 14).reduce((a, b) => a + gmOwe(b), 0) - gmFoodShare(14) > 0 && gmOpenBills().length > 0,
    g30: gmDays() >= 30 && P.length > 0 && !P.some(p => num(p.fee) > 0 && dayDiff(NOW(), pd(p.d)) <= 30), gsched: (g.sched || []).length > 0, gback: !!S.lastBackup, gside: g.pays.some(p => p.kind === 'gig')
  };
  Object.keys(T).forEach(k => { if (T[k] && !g.meds[k]) { g.meds[k] = dkey(); const m = GM_MEDALS.find(x => x[0] === k); if (k !== 'gstart') { addXP(40); fanfare(false); toast('🏅 Medal: ' + m[2] + '. ' + m[3] + '.', 4500); } } });
}
const _after1 = after; after = function () { _after1(); try { gmMedalCheck(); } catch (e) {} };
function gmMedalCard() {
  if (!gmHas()) return ''; const m = (S.gm.meds = S.gm.meds || {});
  return '<section class="card"><div class="ct"><span>🏅 I Got Thi$ medals</span><span class="tag">' + Object.keys(m).length + ' of ' + GM_MEDALS.length + '</span></div><div class="medals">' + GM_MEDALS.map(x => '<div class="medal' + (m[x[0]] ? ' got' : '') + '"><span>' + (m[x[0]] ? x[1] : '🔒') + '</span><b>' + esc(x[2]) + '</b><small>' + esc(x[3]) + '</small></div>').join('') + '</div></section>';
}
const _gg = gmGame; gmGame = function () { return _gg() + gmMedalCard(); };
const _gmo = gmMoney; gmMoney = function () {
  const g = S.gm; let h = _gmo(); if ((g.skips || []).length) h += '<section class="card"><div class="ct"><span>⏭ Skipped cycles</span></div>' + g.skips.slice(0, 8).map(k => '<div class="nrow"><span class="dim sm">' + gmDate(k.d) + '</span> <b>' + esc(k.n) + '</b> <button class="mini" data-act="gmSkipUndo" data-id="' + k.id + '">Undo</button></div>').join('') + '</section>';
  return h + (gmOn() ? '' : gmMedalCard());
};
/* record the late fee a bill carried, for the Fee Dodger medal */
const _ps3 = ACT.gmPaidSave;
ACT.gmPaidSave = el => { const g = S.gm, b = g.bills.find(x => x.id === el.dataset.id), bf = b ? num(b.fee) : 0, n0 = g.paid.length; _ps3(el); if (g.paid.length > n0) { g.paid[0].bfee = bf; const bb = b; if (bb && g.paid[0].prevBal != null) g.paid[0].balAfter = bb.bal; save(); gmMedalCheck(); } };
