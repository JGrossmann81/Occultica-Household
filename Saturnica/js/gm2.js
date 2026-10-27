/* Saturnica I Got Thi$ extras: reminders, quick-add + bill photo, plain-English tips and first-week steps,
   debt balances, lowest-month view, backup and sync. Loads after gangsta.js. */

/* ================= 1. reminders ================= */
const gmRem = () => (S.gm.rem = S.gm.rem || { lead: 3, weekly: true });
const icsEsc = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const icsD = k => k.replace(/-/g, '');
function icsFold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); }
function gmRRULE(b) {
  const r = b.rec || 'm', dom = b.dom || pd(b.due).getDate();
  if (r === 'o') return null; if (r === 'w') return 'RRULE:FREQ=WEEKLY'; if (r === 'b') return 'RRULE:FREQ=WEEKLY;INTERVAL=2';
  if (r === 'y') return 'RRULE:FREQ=YEARLY'; const mo = 'FREQ=MONTHLY' + (r === 'q' ? ';INTERVAL=3' : '') + (dom >= 29 ? ';BYMONTHDAY=-1' : '');
  return 'RRULE:' + mo;
}
function buildBillICS() {
  const g = S.gm, R = gmRem(), out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Saturnica//Bill Reminders//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Saturnica bills'];
  const now = new Date(), st = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + 'T' + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + '00Z';
  const alarm = (trig, t) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(t), 'TRIGGER:' + trig, 'END:VALARM'];
  const lead = Math.max(1, +R.lead || 3);
  gmOpenBills().forEach(b => {
    const rr = gmRRULE(b), off = dayDiff(pd(b.lateOn || b.due), pd(b.due)), amt = gmM(b.base || b.amt, 0);
    const e = ['BEGIN:VEVENT', 'UID:sat-bill-' + b.id + '@saturnica.local', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + icsD(b.due), 'DTEND;VALUE=DATE:' + icsD(dkey(addD(pd(b.due), 1))), 'SUMMARY:' + icsEsc('💸 ' + b.n + ' due (about ' + amt + ')'), 'DESCRIPTION:' + icsEsc(b.n + ' is due. Amount about ' + amt + '.' + (num(b.fee) ? ' Late fee ' + gmM(b.fee) + ' starts ' + gmDate(b.lateOn || b.due) + '.' : '') + ' Open Saturnica, tap Paid.')];
    if (rr) e.push(rr);
    e.push(...alarm('-P' + (lead - 1) + 'DT15H', b.n + ' due in ' + lead + ' days'), ...alarm('PT9H', b.n + ' is due today'));
    if (num(b.fee) > 0 && off > 0) e.push(...alarm('P' + (off - 1) + 'DT9H', 'Last day before the ' + gmM(b.fee) + ' late fee on ' + b.n));
    e.push('END:VEVENT'); out.push(...e.map(icsFold));
  });
  gmGigs().forEach(x => { out.push('BEGIN:VEVENT', 'UID:sat-gig-' + x.id + '@saturnica.local', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + icsD(x.d), 'DTEND;VALUE=DATE:' + icsD(dkey(addD(pd(x.d), 1))), 'SUMMARY:' + icsEsc('🛻 Gig money expected: ' + x.n + ' ' + gmM(x.amt)), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Gig money expected today', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT'); });
  if (R.weekly) { const n = NOW(), sun = addD(n, (7 - n.getDay()) % 7 || 7); out.push('BEGIN:VEVENT', 'UID:sat-weekly@saturnica.local', 'DTSTAMP:' + st, 'DTSTART:' + icsD(dkey(sun)) + 'T180000', 'DTEND:' + icsD(dkey(sun)) + 'T183000', 'RRULE:FREQ=WEEKLY;BYDAY=SU', 'SUMMARY:' + icsEsc('🪐 Saturnica check-in: log bills and paychecks'), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Open Saturnica and log what came in the mail', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'); }
  out.push('END:VCALENDAR'); return out.join('\r\n');
}
function gmDownload(name, text, type) { try { const b = new Blob([text], { type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); return true; } catch (e) { return false; } }
ACT.gmIcs = () => { const ok = gmDownload('saturnica-bills.ics', buildBillICS(), 'text/calendar'); if (ok) { S.gm.remDone = 1; save(); toast('Calendar file saved. Open it and tap Add to calendar.', 4500); gmStepCheck(); } else toast('Could not save the file on this device.'); };
ACT.gmRemind = () => {
  const R = gmRem(), np = 'Notification' in window ? Notification.permission : 'unsupported';
  openSheet('🔔 Reminders', '<p class="sm">A web app cannot wake your phone by itself without a server, and Saturnica has no server. So there are two honest ways to get reminders:</p><div class="flag"><b>1. Add them to your calendar (best)</b><br><span class="sm">Saturnica builds a calendar file with every bill, repeating on its own schedule, plus your gigs and an optional Sunday check-in. Your phone calendar then sends the alarms even when Saturnica is closed. Add it again after you add new bills.</span></div><label class="fl">Warn me this many days before a bill<select class="in" data-chg="gmLead">' + [1, 2, 3, 5, 7].map(n => '<option value="' + n + '"' + (n === (+R.lead || 3) ? ' selected' : '') + '>' + n + ' day' + (n > 1 ? 's' : '') + '</option>').join('') + '</select></label><label class="tog"><input type="checkbox" data-chg="gmWeekly" ' + (R.weekly ? 'checked' : '') + '><span>Sunday 6pm check-in: log bills and paychecks</span></label><button class="btn gold block" data-act="gmIcs">📅 Save calendar file</button><div class="flag"><b>2. A note when you open the app</b><br><span class="sm">Today shows what is late, due soon, and any gig money expected.' + (np === 'unsupported' ? '' : ' You can also get a notification the first time you open it each day.') + '</span></div>' + (np === 'unsupported' ? '' : '<label class="tog"><input type="checkbox" data-chg="notifyTog2" ' + (S.settings.notify ? 'checked' : '') + '><span>Notify me when I open Saturnica</span></label>') + '<h3 class="h3">Right now</h3>' + (gmDigest().map(x => '<div class="nrow"><span class="me">' + x[0] + '</span> <span class="sm">' + esc(x[1]) + '</span></div>').join('') || '<p class="dim sm">Nothing urgent.</p>'));
};
CHG.gmLead = el => { gmRem().lead = +el.value; save(); };
CHG.gmWeekly = el => { gmRem().weekly = el.checked; save(); };
CHG.notifyTog2 = async el => { if (!el.checked) { S.settings.notify = false; save(); return; } try { const r = await Notification.requestPermission(); S.settings.notify = r === 'granted'; if (r !== 'granted') { el.checked = false; toast('Notifications were not allowed.'); } else { S.gm.remDone = 1; gmStepCheck(); } save(); } catch (e) { el.checked = false; } };
function gmDigest() {
  const g = S.gm, L = [], lead = +gmRem().lead || 3;
  gmOpenBills().slice().sort((a, b) => gmDue(a) - gmDue(b)).forEach(b => { const di = gmDue(b), lo = gmLate(b);
    if (lo < 0) L.push(['🚨', b.n + ' is late' + (num(b.fee) ? ' and a ' + gmM(b.fee) + ' fee applies' : '') + '. ' + gmM(gmOwe(b)) + ' owed.']);
    else if (di < 0) L.push(['⏰', b.n + ' is past due. Late fee starts ' + gmDate(b.lateOn) + '.']);
    else if (di === 0) L.push(['💸', b.n + ' is due today: ' + gmM(gmOwe(b)) + '.']);
    else if (di <= lead) L.push(['📅', b.n + ' is due in ' + di + ' day' + (di > 1 ? 's' : '') + ': ' + gmM(gmOwe(b)) + '.']); });
  gmGigs().forEach(x => { const d = dayDiff(pd(x.d), NOW()); if (d <= 0) L.push(['🛻', x.n + ' was expected ' + (d === 0 ? 'today' : gmDate(x.d)) + '. Got paid? Tap Got paid.']); });
  const last = g.pays.map(p => p.d).sort().pop(); if (g.pays.length && last && dayDiff(NOW(), pd(last)) >= 10) L.push(['💵', 'Last paycheck logged ' + dayDiff(NOW(), pd(last)) + ' days ago. Log new ones as they land.']);
  return L;
}
function gmDigestCard() { const L = gmDigest(); if (!L.length) return ''; return '<section class="card"><div class="ct"><span>🔔 Heads up</span><a class="lnk" data-act="gmRemind">Reminders</a></div>' + L.slice(0, 5).map(x => '<div class="nrow"><span class="me">' + x[0] + '</span> <span class="sm">' + esc(x[1]) + '</span></div>').join('') + '</section>'; }
function gmNotify() {
  try { if (!gmHas() || !S.settings.notify || !('Notification' in window) || Notification.permission !== 'granted' || S.gm.notedOn === dkey()) return; const L = gmDigest(); if (!L.length) return; S.gm.notedOn = dkey(); save(); const body = L.slice(0, 3).map(x => x[0] + ' ' + x[1]).join('\n');
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('Saturnica', { body, icon: 'img/icon-192.png' })).catch(() => { new Notification('Saturnica', { body }); }); else new Notification('Saturnica', { body }); } catch (e) {}
}

/* ================= 2. quick add and bill photo ================= */
function gmLastPay() { return S.gm.pays.filter(p => !p.kind || p.kind === 'pay').sort((a, b) => a.d < b.d ? 1 : -1)[0]; }
ACT.gmPaySame = () => { const l = gmLastPay(); if (!l) return; S.gm.pays.push({ id: uid(), d: dkey(), amt: l.amt, n: l.n }); logIt('Paycheck ' + gmM(l.amt)); const xp = addXP(10); after(); closeSheetQuiet(); render(); toast('💵 +' + gmM(l.amt) + ' in the pot · +' + xp + ' XP', 3000); };
const _payNew = ACT.gmPayNew;
ACT.gmPayNew = el => { _payNew(el); const l = gmLastPay(); if (l) { const b = document.createElement('div'); b.innerHTML = '<button class="btn block" data-act="gmPaySame">↻ Same as last time: ' + gmM(l.amt, l.amt % 1 ? 2 : 0) + ' from ' + esc(l.n) + '</button>'; const body = $('#sheet .sh-body'); body.insertBefore(b.firstChild, body.firstChild); } };

const GM_HELP = '<p class="sm dim gmhelp"><b>Due date</b> is when the bill expects your money. <b>Late on</b> is the day the company starts charging a fee, often a few days after the due date (the grace period). Look for "late after" or "grace period" on the bill. Not sure? Leave Late on equal to the due date.</p>';
function gmDecorateBill(el) {
  const body = $('#sheet .sh-body'); if (!body) return; const id = el && el.dataset ? el.dataset.id : null, b = id ? S.gm.bills.find(x => x.id === id) : null;
  const top = document.createElement('div'); let h = '';
  if (!b) { const names = gmOpenBills(); if (names.length) h += '<p class="sm dim">Already on your list? Update it:</p><div class="chips">' + names.map(x => '<button class="chip" data-act="gmBillEdit" data-id="' + x.id + '">' + esc(x.n) + '</button>').join('') + '</div>'; }
  h += '<label class="btn block filebtn">📷 Read a photo of the bill<input type="file" accept="image/*" capture="environment" data-chg="gmScan" hidden></label><div id="gmscan" class="sm dim"></div>';
  top.innerHTML = h; body.insertBefore(top, body.firstChild);
  const lastSel = $('#gb_r'); if (lastSel) { const hp = document.createElement('div'); hp.innerHTML = GM_HELP; lastSel.closest('label').after(hp.firstChild); }
  const dbt = document.createElement('div'); dbt.id = 'gb_debt'; dbt.hidden = !(b && b.type === 'debt') && $('#gb_t').value !== 'debt';
  dbt.innerHTML = '<div class="flag"><b>💳 Debt details (optional)</b><br><span class="sm">Add the balance and interest rate and Saturnica shows how long this will take to clear and what the interest costs. It carries into the full app.</span></div><label class="fl">What kind<select class="in" id="gb_dt">' + Object.keys(DEBT_TYPES).filter(k => k !== 'mortgage').map(k => '<option value="' + k + '"' + (b && b.dt === k ? ' selected' : '') + '>' + DEBT_TYPES[k][0] + ' ' + DEBT_TYPES[k][1] + '</option>').join('') + '</select></label><div class="grid2"><label class="fl">Balance owed<input class="in" id="gb_bal" inputmode="decimal" placeholder="$" value="' + esc(b ? val(b.bal) : '') + '"></label><label class="fl">Interest rate (APR %)<input class="in" id="gb_apr" inputmode="decimal" placeholder="e.g. 24.9" value="' + esc(b ? val(b.apr) : '') + '"></label></div>';
  const save = body.querySelector('[data-act=gmBillSave]'); body.insertBefore(dbt, save);
}
const _be2 = ACT.gmBillEdit; ACT.gmBillEdit = el => { _be2(el); gmDecorateBill(el); };
const _gt0 = CHG.gmType; CHG.gmType = el => { _gt0(el); const d = $('#gb_debt'); if (d) d.hidden = el.value !== 'debt'; };
const _bs0 = ACT.gmBillSave;
ACT.gmBillSave = el => {
  const bal = $('#gb_bal') ? num($('#gb_bal').value) : 0, apr = $('#gb_apr') ? num($('#gb_apr').value) : 0, dt = $('#gb_dt') ? $('#gb_dt').value : 'card', isDebt = $('#gb_t') && $('#gb_t').value === 'debt', nm = ($('#gb_n') || {}).value ? $('#gb_n').value.trim().toLowerCase() : '', before = S.gm.bills.length;
  _bs0(el); if (!isDebt || sheetOpen()) return;
  const b = el.dataset.id ? S.gm.bills.find(x => x.id === el.dataset.id) : S.gm.bills.find(x => !x.done && x.n.toLowerCase() === nm) || S.gm.bills[S.gm.bills.length - 1];
  if (b && b.type === 'debt') { b.bal = bal; b.apr = apr; b.dt = dt; save(); render(); }
};
CHG.gmScan = async el => {
  const f = el.files && el.files[0], out = $('#gmscan'); if (!f) return;
  if (!S.settings.apiKey) { out.innerHTML = '<div class="flag ask"><b>Needs your AI key.</b> <span class="sm">Reading a photo uses your own Anthropic key (Menu → Settings). The photo goes only to Anthropic and is not saved. You can always type the bill in.</span></div>'; return; }
  out.textContent = 'Reading the bill...';
  try {
    const img = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82).split(',')[1]); }; im.onerror = rej; im.src = r.result; }; r.onerror = rej; r.readAsDataURL(f); });
    const prompt = 'Read this bill or statement. Reply with ONLY a JSON object, no other text: {"name": company or what it is, "type": one of rent|util|elec|gas|water|net|phone|carins|health|debt|other, "amount": amount due as a number, "due": due date as YYYY-MM-DD or null, "lateOn": date the late fee starts as YYYY-MM-DD or null, "fee": late fee as a number or null, "balance": total balance owed as a number or null (credit cards and loans), "apr": interest rate percent or null}. Today is ' + dkey() + '.';
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': S.settings.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: S.settings.model || 'claude-sonnet-5-5', max_tokens: 400, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img } }, { type: 'text', text: prompt }] }] }) });
    if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(), t = (j.content || []).map(x => x.text || '').join(''), m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('unreadable'); const o = JSON.parse(m[0]);
    const set = (id, v) => { const e = $('#' + id); if (e && v != null && v !== '') e.value = v; };
    if (o.type && GM_TYPES.some(x => x[0] === o.type)) { set('gb_t', o.type); const d = $('#gb_debt'); if (d) d.hidden = o.type !== 'debt'; $('#gb_e').checked = !!gmType(o.type)[3]; }
    set('gb_n', o.name); set('gb_a', o.amount); if (/^\d{4}-\d\d-\d\d$/.test(o.due || '')) set('gb_d', o.due); if (/^\d{4}-\d\d-\d\d$/.test(o.lateOn || '')) set('gb_l', o.lateOn); set('gb_f', o.fee); set('gb_bal', o.balance); set('gb_apr', o.apr);
    out.innerHTML = '<div class="flag"><b>Filled in from the photo.</b> <span class="sm">Check every number before you save. Photos can be misread.</span></div>';
  } catch (e) { out.innerHTML = '<p class="red sm">Could not read that photo (' + esc(e.message) + '). Type it in instead.</p>'; }
};

/* ================= 3. tips and first-week steps ================= */
const GM_TIPS = [
  ['Due date vs late date', 'The due date is when the bill wants your money. The late date is when the fee actually starts. Many bills give a few days of grace. Know both.'],
  ['Late fee', 'A one-time charge for paying after the late date. Often 5 to 10 percent of the bill. On rent it can be $50 or more, so protect rent first.'],
  ['Grace period', 'Extra days after the due date before a fee starts. It is usually on the bill or in the lease. Do not count on it unless you have seen it in writing.'],
  ['Minimum payment', 'The smallest amount a card or loan accepts so it is not late. Paying only the minimum keeps you in debt a long time because interest keeps growing.'],
  ['APR', 'The yearly interest rate on a debt. A card at 25 percent costs about $21 a month in interest for every $1,000 you owe.'],
  ['Calling first', 'If you will be short, call before the late date. Most companies will give a few extra days or a payment plan, and many will waive the first late fee.'],
  ['Needs first', 'Housing, power, water, phone, car, and health insurance come before streaming, subscriptions or store cards. Losing those costs far more than a fee.'],
  ['The pot', 'The bill pot is only your paychecks minus bills paid. If it is low, it is because that is the honest picture of what is left.'],
  ['Averages lie a little', 'If your pay changes month to month, the lowest month is the safest number to budget on. Saturnica can use it for you.'],
  ['Gig and cash money', 'Side income is still income. Setting aside a slice for taxes as you go keeps a surprise bill from wrecking your year.']
];
function gmTipCard() { const d = Math.floor(NOW() / MS), t = GM_TIPS[d % GM_TIPS.length]; return '<section class="card"><div class="ct"><span>💡 Tip of the day</span></div><p class="sm"><b>' + esc(t[0]) + '.</b> ' + esc(t[1]) + '</p><details><summary class="sm">All the plain-English tips</summary>' + GM_TIPS.map(x => '<p class="sm"><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</p>').join('') + '</details></section>'; }
const GM_STEPS = [
  ['pay', '💵', 'Log your first paycheck', g => g.pays.length > 0, 'gmPayNew'],
  ['real', '🗓️', 'Set the real due date on rent and utilities', g => g.bills.length > 0 && !g.bills.some(b => b.guess), 'gmBillEdit'],
  ['fee', '💸', 'Add a bill with its late date and late fee', g => g.bills.some(b => num(b.fee) > 0 && !b.guess), 'gmBillEdit'],
  ['paid', '✔️', 'Mark one bill paid', g => g.paid.length > 0, 'gmOpen'],
  ['rem', '🔔', 'Turn on reminders', g => !!g.remDone, 'gmRemind']
];
function gmStepCheck() {
  if (!gmHas()) return; const g = S.gm; g.stepXP = g.stepXP || {}; let got = 0;
  GM_STEPS.forEach(s => { if (!g.stepXP[s[0]] && s[3](g)) { g.stepXP[s[0]] = 1; addXP(20); got++; toast('✅ ' + s[2] + '. +20 XP', 2800); } });
  if (!g.stepsDone && GM_STEPS.every(s => g.stepXP[s[0]])) { g.stepsDone = 1; addXP(60); setTimeout(() => { fanfare(true); bigText('FIRST WEEK DONE', '+60 XP', null, 1300); }, 500); }
  if (got) save();
}
const _after0 = after; after = function () { _after0(); try { gmStepCheck(); } catch (e) {} };
function gmStepsCard() {
  const g = S.gm; if (g.stepsDone) return ''; g.stepXP = g.stepXP || {}; const n = GM_STEPS.filter(s => s[3](g)).length;
  const nxt = GM_STEPS.find(s => !s[3](g));
  return '<section class="card"><div class="ct"><span>🚀 Your first week</span><span class="tag">' + n + ' of ' + GM_STEPS.length + '</span></div><div class="pbar"><i style="width:' + Math.round(n / GM_STEPS.length * 100) + '%"></i></div>' + GM_STEPS.map(s => '<div class="task' + (s[3](g) ? ' dn' : '') + '"><span class="ck">' + (s[3](g) ? '✓' : '') + '</span><div class="tt"><b>' + s[1] + ' ' + esc(s[2]) + '</b> <span class="tag">+20 XP</span></div></div>').join('') + (nxt ? '<button class="btn gold block" data-act="' + nxt[4] + '">' + esc(nxt[2]) + '</button>' : '') + '<p class="sm dim">Finish all ' + GM_STEPS.length + ' for a +60 XP bonus.</p></section>';
}

/* ================= 4. debt ================= */
function gmCycleRate(b) { const r = num(b.apr) / 1200, f = b.rec || 'm'; return f === 'w' ? r * 12 / 52 : f === 'b' ? r * 12 / 26 : f === 'q' ? r * 3 : f === 'y' ? r * 12 : r; }
function gmPayoff(b) {
  const B = num(b.bal), P = num(b.base || b.amt), r = gmCycleRate(b); if (B <= 0 || P <= 0) return null;
  if (r > 0 && P <= B * r + 0.01) return { never: true, perCycleInterest: B * r };
  const n = r > 0 ? Math.ceil(-Math.log(1 - r * B / P) / Math.log(1 + r)) : Math.ceil(B / P); return { n, interest: Math.max(0, n * P - B), perCycleInterest: B * r, months: n * (b.rec === 'w' ? 12 / 52 : b.rec === 'b' ? 12 / 26 : b.rec === 'q' ? 3 : b.rec === 'y' ? 12 : 1) };
}
function gmDebtLine(b) { if (!(num(b.bal) > 0)) return ''; const p = gmPayoff(b); return '<br><span class="sm dim">Owe ' + gmM(b.bal) + (num(b.apr) ? ' at ' + b.apr + '%' : '') + ' · ' + (p ? p.never ? '<span class="red">this payment barely covers the interest</span>' : '~' + yrs(Math.round(p.months)) + ' to clear' : '') + '</span>'; }
const _row0 = gmBillRow; gmBillRow = function (b, c) { const h = _row0(b, c); return num(b.bal) > 0 ? h.replace('</span></div><div class="gmb2">', '</span>' + gmDebtLine(b) + '</div><div class="gmb2">') : h; };
const _pd0 = ACT.gmPaidSave;
ACT.gmPaidSave = el => {
  const g = S.gm, b = g.bills.find(x => x.id === el.dataset.id), n0 = g.paid.length, paid = $('#gq_a') ? num($('#gq_a').value) : 0, prevBal = b ? num(b.bal) : 0;
  _pd0(el); if (!b || !(prevBal > 0) || g.paid.length <= n0) return;
  const p = g.paid[0]; p.prevBal = prevBal; b.bal = Math.max(0, Math.round((prevBal + prevBal * gmCycleRate(b) - paid) * 100) / 100);
  if (b.bal <= 0) { b.bal = 0; b.done = true; logIt('Paid off ' + b.n + '!'); addXP(200); setTimeout(() => { fanfare(true); bigText('DEBT CRUSHED!', '💥 ' + b.n + ' is gone 💥', null, 1500); }, 700); }
  after(); render();
};
const _pu0 = ACT.gmPaidUndo;
ACT.gmPaidUndo = el => { const p = S.gm.paid.find(x => x.id === el.dataset.id), b = p ? S.gm.bills.find(x => x.id === p.bid) : null, pb = p ? p.prevBal : null; _pu0(el); if (b && pb != null) { b.bal = pb; save(); render(); } };
function gmDebtCard() {
  const D = gmOpenBills().filter(b => num(b.bal) > 0); if (!D.length) return '';
  const tot = D.reduce((a, b) => a + num(b.bal), 0), int = D.reduce((a, b) => a + num(b.bal) * num(b.apr) / 1200, 0), hi = D.slice().sort((a, b) => num(b.apr) - num(a.apr))[0], pays = D.map(gmPayoff).filter(Boolean), never = pays.some(p => p.never), last = Math.max.apply(null, pays.filter(p => !p.never).map(p => p.months).concat([0]));
  return '<section class="card"><div class="ct"><span>💳 Debt snapshot</span></div><div class="gmgrid"><div><small class="dim">You owe</small><b>' + gmM(tot) + '</b></div><div><small class="dim">Interest per month</small><b class="red">' + gmM(int) + '</b></div><div><small class="dim">Debt-free in</small><b>' + (never ? '?' : yrs(Math.round(last))) + '</b></div></div>' + (never ? '<p class="sm red">At least one payment barely covers its interest. Paying only that will not clear it.</p>' : '') + (D.length > 1 && num(hi.apr) > 0 ? '<p class="sm">Once the needs are covered, any extra money does the most good on <b>' + esc(hi.n) + '</b> (' + hi.apr + '%). That is the avalanche method. The full app plans it for you after you graduate.</p>' : '<p class="sm dim">Extra money beyond the minimum goes straight to the balance and saves interest.</p>') + '</section>';
}

/* ================= 5. income by month ================= */
function gmMonthTotals(kinds) {
  const g = S.gm, first = gmFirst(), cur = mkey(), m = {}; g.pays.forEach(p => { if (kinds && kinds.indexOf(p.kind || 'pay') < 0) return; const k = p.d.slice(0, 7); m[k] = (m[k] || 0) + num(p.amt); });
  const fk = first ? first.slice(0, 7) : null, fd = first ? +first.slice(8) : 1;
  return Object.keys(m).sort().filter(k => k < cur && !(k === fk && fd > 7)).map(k => ({ k, amt: m[k] }));
}
function gmMonthCard() {
  const M = gmMonthTotals(); if (M.length < 2) return ''; const hi = Math.max.apply(null, M.map(x => x.amt)), low = Math.min.apply(null, M.map(x => x.amt)), avg = M.reduce((a, x) => a + x.amt, 0) / M.length;
  return '<section class="card"><div class="ct"><span>📈 Income by month</span></div>' + M.slice(-4).map(x => '<div class="mrow2"><span class="sm">' + MON[+x.k.slice(5) - 1] + '</span><div class="pbar"><i style="width:' + Math.round(x.amt / hi * 100) + '%"></i></div><b class="sm">' + gmM(x.amt) + '</b></div>').join('') + '<p class="sm">Average <b>' + gmM(avg) + '</b>, lowest <b>' + gmM(low) + '</b>.' + ((avg - low) / avg > .2 ? ' Your income bounces around. Budgeting on the lowest month is the safe way.' : '') + '</p></section>';
}
function gmBasisHTML(A) {
  const kinds = ['pay'].concat(A.side.map(x => x.k)), M = gmMonthTotals(), avg = M.length ? M.reduce((a, x) => a + x.amt, 0) / M.length : 0, low = M.length ? Math.min.apply(null, M.map(x => x.amt)) : 0; if (M.length < 2) return '';
  const bouncy = (avg - low) / avg > .2;
  return '<div class="flag"><b>Which income should the budget use?</b><div class="seg small"><button id="gb_avg" class="' + (bouncy ? '' : 'on') + '" data-act="gmBasis" data-v="avg">Average ' + gmM(avg) + '</button><button id="gb_low" class="' + (bouncy ? 'on' : '') + '" data-act="gmBasis" data-v="low">Lowest month ' + gmM(low) + '</button></div><span class="sm dim">' + (bouncy ? 'Your months vary a lot, so the lowest month is preselected. ' : '') + 'Lowest is the safer pick for gig, tip and cash work.</span></div>';
}
ACT.gmBasis = el => { $('#gb_avg').classList.toggle('on', el.dataset.v === 'avg'); $('#gb_low').classList.toggle('on', el.dataset.v === 'low'); };
function gmBasisFactor(A) {
  const b = $('#gb_low'); if (!b || !b.classList.contains('on')) return 1; const kinds = ['pay'].concat(A.side.filter(x => $('#gs_' + x.k) && $('#gs_' + x.k).checked).map(x => x.k)), M = gmMonthTotals(kinds);
  const sum = A.inc.reduce((a, x) => a + x.amt, 0); if (!M.length || !sum) return 1; return Math.min(1, Math.min.apply(null, M.map(x => x.amt)) / sum);
}

/* ================= 6. backup and sync ================= */
const _saveRaw = save;
save = function () { try { S.mod = Date.now(); } catch (e) {} _saveRaw(); gmSyncSoon(); };
async function gz(str) { if (!window.CompressionStream) return 'P' + btoa(unescape(encodeURIComponent(str))); const cs = new CompressionStream('gzip'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(str)); w.close(); const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let s = ''; buf.forEach(b => { s += String.fromCharCode(b); }); return 'Z' + btoa(s); }
async function ungz(code) { const t = code[0], b = atob(code.slice(1)); if (t === 'P') return decodeURIComponent(escape(b)); const u = Uint8Array.from(b, c => c.charCodeAt(0)), ds = new DecompressionStream('gzip'), w = ds.writable.getWriter(); w.write(u); w.close(); return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer()); }
const backupObj = () => Object.assign({}, S, { settings: Object.assign({}, S.settings, { apiKey: '' }), chat: [] });
function markBackup() { S.lastBackup = dkey(); _saveRaw(); }
function sdb() { return new Promise((res, rej) => { try { const r = indexedDB.open('saturnica-sync', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
async function hGet() { try { const d = await sdb(); return await new Promise(res => { const q = d.transaction('h').objectStore('h').get('file'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } }
async function hPut(h) { const d = await sdb(); return new Promise(res => { const t = d.transaction('h', 'readwrite'); h ? t.objectStore('h').put(h, 'file') : t.objectStore('h').delete('file'); t.oncomplete = () => res(); t.onerror = () => res(); }); }
let syncH = null, syncTimer = null, syncMsg = '', syncBusy = false;
function gmSyncSoon() { if (!syncH) return; clearTimeout(syncTimer); syncTimer = setTimeout(gmSyncWrite, 2500); }
async function gmSyncWrite() { if (!syncH || syncBusy) return; syncBusy = true; try { if ((await syncH.queryPermission({ mode: 'readwrite' })) !== 'granted') { syncMsg = 'Tap Reconnect to keep syncing.'; syncBusy = false; return; } const w = await syncH.createWritable(); await w.write(JSON.stringify({ fmt: 'saturnica-sync', mod: S.mod || Date.now(), S: backupObj() })); await w.close(); S.lastBackup = dkey(); _saveRaw(); syncMsg = 'Synced ' + new Date().toLocaleTimeString(); } catch (e) { syncMsg = 'Could not write the file (' + (e.name || 'error') + ').'; } syncBusy = false; }
async function gmSyncRead() { try { const f = await (await syncH.getFile()).text(); const o = JSON.parse(f); if (o.fmt !== 'saturnica-sync' || !o.S) return false; if ((o.mod || 0) > (S.mod || 0) + 1000) { const key = S.settings.apiKey; S = mergeDeep(blank(), o.S); S.settings.apiKey = key; S.mod = o.mod; _saveRaw(); return true; } } catch (e) {} return false; }
async function gmSyncBoot() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try { syncH = await hGet(); if (!syncH) return; if ((await syncH.queryPermission({ mode: 'readwrite' })) === 'granted') { if (await gmSyncRead()) { render(); toast('Loaded a newer copy from your sync file.', 3500); } } else syncMsg = 'Tap Reconnect to keep syncing.'; } catch (e) { syncH = null; }
}
ACT.gmSyncPick = async () => {
  try { const h = await window.showSaveFilePicker({ suggestedName: 'saturnica-sync.json', types: [{ description: 'Saturnica file', accept: { 'application/json': ['.json'] } }] }); syncH = h; await hPut(h); S.mod = Date.now(); await gmSyncWrite(); toast('Sync file ready. Put it in OneDrive, Dropbox or Google Drive to share between devices.', 5000); ACT.gmBackup(); } catch (e) { if (e.name !== 'AbortError') toast('This browser cannot pick a sync file. Use the backup code instead.'); }
};
ACT.gmSyncOpen = async () => {
  try { const [h] = await window.showOpenFilePicker({ types: [{ description: 'Saturnica file', accept: { 'application/json': ['.json'] } }] }); syncH = h; await hPut(h); if (await gmSyncRead()) { closeSheetQuiet(); render(); toast('Loaded the data from that file.', 3500); } else { await gmSyncWrite(); toast('Connected. Your copy was newer, so the file was updated.', 3500); ACT.gmBackup(); } } catch (e) { if (e.name !== 'AbortError') toast('This browser cannot open a sync file.'); }
};
ACT.gmSyncReconnect = async () => { try { if (syncH && (await syncH.requestPermission({ mode: 'readwrite' })) === 'granted') { if (await gmSyncRead()) { render(); toast('Loaded a newer copy.'); } await gmSyncWrite(); ACT.gmBackup(); } } catch (e) { toast('Could not reconnect.'); } };
ACT.gmSyncOff = async () => { syncH = null; await hPut(null); syncMsg = ''; ACT.gmBackup(); toast('Sync turned off.'); };
ACT.gmCode = async () => { const code = 'SATURNICA1:' + await gz(JSON.stringify(backupObj())); markBackup(); const box = $('#gmcode'); box.value = code; box.hidden = false; box.select(); $('#gmcodebtns').hidden = false; };
ACT.gmCodeCopy = async () => { const t = $('#gmcode').value; try { await navigator.clipboard.writeText(t); toast('Copied. Paste it into a note or message to yourself.'); } catch (e) { $('#gmcode').select(); toast('Select the text and copy it.'); } };
ACT.gmCodeShare = async () => { try { await navigator.share({ title: 'Saturnica backup', text: $('#gmcode').value }); } catch (e) {} };
ACT.gmCodeLoad = async () => {
  const raw = ($('#gmrest').value || '').replace(/\s+/g, ''); try { if (raw.indexOf('SATURNICA1:') !== 0) throw 0; const o = JSON.parse(await ungz(raw.slice(11))); if (!o || !o.v || !o.inc) throw 0; const key = S.settings.apiKey; S = mergeDeep(blank(), o); S.settings.apiKey = key; S.mod = Date.now(); _saveRaw(); closeSheetQuiet(); render(); toast('Backup restored.', 3500); } catch (e) { toast('That does not look like a Saturnica backup code.'); }
};
ACT.gmFile = () => { if (gmDownload('saturnica-backup-' + dkey() + '.json', JSON.stringify(backupObj(), null, 1), 'application/json')) { markBackup(); toast('Backup file saved to your downloads.'); ACT.gmBackup(); } else toast('Could not save a file here.'); };
ACT.gmBackup = () => {
  const can = !!(window.showSaveFilePicker && window.showOpenFilePicker), ago = S.lastBackup ? dayDiff(NOW(), pd(S.lastBackup)) : null;
  openSheet('💾 Backup and sync', '<p class="sm">Your numbers live only in this browser. Clearing site data or switching phones erases them unless you keep a copy. ' + (ago == null ? '<b class="red">No backup yet.</b>' : 'Last backup: <b>' + (ago === 0 ? 'today' : ago + ' day' + (ago > 1 ? 's' : '') + ' ago') + '</b>.') + '</p>' +
    '<div class="flag"><b>1. Backup code (works everywhere)</b><br><span class="sm">A block of text that holds everything. Paste it into a note or message to yourself, or send it to your new phone. It contains your finances, so keep it private.</span></div><button class="btn block" data-act="gmCode">Make my backup code</button><textarea class="in" id="gmcode" rows="3" readonly hidden></textarea><div class="row" id="gmcodebtns" hidden><button class="btn" data-act="gmCodeCopy">Copy</button>' + (navigator.share ? '<button class="btn" data-act="gmCodeShare">Share</button>' : '') + '</div>' +
    '<div class="flag"><b>2. Restore from a code</b></div><textarea class="in" id="gmrest" rows="3" placeholder="Paste a code that starts with SATURNICA1:"></textarea><button class="btn block" data-act="gmCodeLoad">Restore</button>' +
    '<div class="flag"><b>3. Backup file</b></div><div class="row"><button class="btn" data-act="gmFile">Save a file</button><label class="btn filebtn">Open a file<input type="file" accept="application/json" data-chg="importData" hidden></label></div>' +
    (can ? '<div class="flag"><b>4. Automatic sync file</b><br><span class="sm">On Chrome or Edge: pick a file inside OneDrive, Dropbox or Google Drive. Saturnica keeps it up to date, and another device pointed at the same file loads the newest copy. Newest copy wins, so use one device at a time.</span></div>' + (syncH ? '<p class="sm ok">Connected. ' + esc(syncMsg) + '</p><div class="row"><button class="btn" data-act="gmSyncReconnect">Reconnect</button><button class="btn" data-act="gmSyncOff">Turn off</button></div>' : '<div class="row"><button class="btn" data-act="gmSyncPick">Make a sync file</button><button class="btn" data-act="gmSyncOpen">Use an existing one</button></div>') : '<p class="sm dim">Automatic sync files are not available in this browser. The backup code works everywhere.</p>'));
};
function gmBackupNag() {
  const g = S.gm; if (!g || (g.pays.length + g.paid.length) < 3 || syncH) return; const ago = S.lastBackup ? dayDiff(NOW(), pd(S.lastBackup)) : 99; if (ago < 14) return;
  return '<section class="card gmwarn"><div class="ct"><span>💾 Back up your numbers</span></div><p class="sm">' + (S.lastBackup ? 'Your last backup was ' + ago + ' days ago.' : 'You have not backed up yet.') + ' If this phone is lost or its browser data is cleared, everything you entered goes with it. It takes ten seconds.</p><button class="btn gold block" data-act="gmBackup">Back up now</button></section>';
}

/* ================= today hook ================= */
function gm2(where) {
  if (where === 'top') return gmDigestCard() + gmStepsCard();
  return gmDebtCard() + gmMonthCard() + (gmBackupNag() || '') + gmTipCard();
}
(function () { const t = setInterval(() => { if (typeof S !== 'undefined' && document.readyState !== 'loading' && document.getElementById('view')) { clearInterval(t); gmSyncBoot(); setTimeout(gmNotify, 800); } }, 200); document.addEventListener('visibilitychange', () => { if (!document.hidden) gmNotify(); }); })();

const _hc0 = gmHomeCard; gmHomeCard = function () { return gmDigestCard() + (gmBackupNag() || '') + _hc0(); };
