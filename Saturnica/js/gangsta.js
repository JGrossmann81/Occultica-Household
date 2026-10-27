/* Saturnica I Got Thi$ mode ("Trust the Math"): the no-questionnaire start for total beginners.
   Ask only rent, utilities, food. Log paychecks and bills as they arrive. After ~3 months,
   build an averaged budget from the real data and graduate into the full app (game included). */

const GM_TYPES = [
  ['rent', '🏠 Rent or mortgage', 'rent', 1], ['util', '💡 Utilities (all together)', 'util', 1], ['elec', '💡 Electric', 'electric', 1], ['gas', '🔥 Gas or heat', 'gas', 1],
  ['water', '🚰 Water and trash', 'water', 1], ['net', '🌐 Internet', 'internet', 0], ['phone', '📱 Phone', 'phone', 1], ['carins', '🚗 Car insurance', 'carins', 1],
  ['health', '🩺 Health insurance', 'healthins', 1], ['debt', '💳 Credit card or loan', 'debt', 0], ['other', '📄 Something else', 'other', 0]
];
const GM_REC = [['m', 'Every month'], ['w', 'Every week'], ['b', 'Every 2 weeks'], ['q', 'Every 3 months'], ['y', 'Once a year'], ['o', 'One time only']];
const GM_TABS = [['gtoday', '😎', 'Today'], ['gbills', '🧾', 'Bills'], ['gmoney', '💵', 'Money'], ['ggame', '🎮', 'Game']];

const gmM = (n, d) => $$$(n, d === undefined ? (Math.abs(n - Math.round(n)) > 0.004 ? 2 : 0) : d);
const gmOn = () => !!(S.gm && S.gm.on && !S.gm.grad);
const gmHas = () => !!(S.gm && S.gm.on);
const gmTabs = () => gmOn() ? GM_TABS : null;
const gmType = k => GM_TYPES.find(t => t[0] === k) || GM_TYPES[GM_TYPES.length - 1];
const gmDue = b => dayDiff(pd(b.due), NOW());
const gmLate = b => dayDiff(pd(b.lateOn || b.due), NOW());
const gmFeeOn = b => gmLate(b) < 0 && num(b.fee) > 0;
const gmOwe = b => num(b.amt) + (gmFeeOn(b) ? num(b.fee) : 0);
const gmOpenBills = () => (S.gm ? S.gm.bills : []).filter(b => !b.done);
const gmDate = k => fmtD(pd(k));

function monthShift(d, dom, n) { const t = new Date(d.getFullYear(), d.getMonth() + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(dom || d.getDate(), last)); return t; }
function nextFirst() { const n = NOW(); return new Date(n.getFullYear(), n.getMonth() + 1, 1); }
function gmAdv(b) {
  const rec = b.rec || 'm'; if (rec === 'o') { b.done = true; return; }
  const d = pd(b.due), off = dayDiff(pd(b.lateOn || b.due), d);
  const nd = rec === 'w' ? addD(d, 7) : rec === 'b' ? addD(d, 14) : monthShift(d, b.dom || d.getDate(), rec === 'q' ? 3 : rec === 'y' ? 12 : 1);
  b.due = dkey(nd); b.lateOn = dkey(addD(nd, off)); b.amt = num(b.base); b.partial = false;
}

/* ---------- money in the pot ---------- */
function gmPot() { const g = S.gm; return num(g.cash0) + g.pays.reduce((a, p) => a + num(p.amt) - num(p.tax), 0) - g.paid.reduce((a, p) => a + num(p.amt) + num(p.fee), 0); }
function gmJar() { const g = S.gm; return Math.max(0, g.pays.reduce((a, p) => a + num(p.tax), 0) - num(g.jarOut)); }
function gmGigs() { return ((S.gm.gigs) || []).filter(x => !x.done).sort((a, b) => a.d < b.d ? -1 : 1); }
function gmFoodShare(days) { return num(S.gm.food) * days / 30.44; }
function gmFirst() { const g = S.gm, ds = g.pays.map(p => p.d).concat(g.paid.map(p => p.d)).sort(); return ds[0] || null; }
function gmDays() { const f = gmFirst(); return f ? Math.max(0, dayDiff(NOW(), pd(f))) : 0; }
function gmReady() { const g = S.gm; return gmDays() >= 90 && g.pays.length >= 3 && g.paid.length >= 3; }
function gmUsable() { const g = S.gm; return g.pays.length >= 1 && g.paid.length >= 1; }

/* ---------- who to pay first ---------- */
function gmPlan() {
  const g = S.gm, pot = gmPot(), horizon = 10;
  const cands = gmOpenBills().filter(b => gmDue(b) <= horizon);
  const smallest = g.ord === 'small';
  cands.sort((a, b) => smallest ? num(a.amt) - num(b.amt) : ((b.ess ? 1 : 0) - (a.ess ? 1 : 0)) || (gmFeeOn(b) ? num(b.fee) : 0) - (gmFeeOn(a) ? num(a.fee) : 0) || num(b.fee) - num(a.fee) || gmDue(a) - gmDue(b) || num(a.amt) - num(b.amt));
  let left = pot - gmFoodShare(horizon); const gigs = gmGigs(); const pay = [], wait = [];
  cands.forEach(b => {
    const need = gmOwe(b); const why = smallest ? 'Small bill: clears one more off your list' : b.ess ? 'Essential: keeps a roof, lights, car or health covered' : num(b.fee) > 0 ? 'Waiting costs you a $' + Math.round(num(b.fee)) + ' late fee' : 'Cheapest one to let wait';
    if (left >= need - 0.005) { left -= need; pay.push({ b, need, why }); } else { const gg = gigs.filter(x => x.d <= (b.lateOn || b.due)), gsum = gg.reduce((a, x) => a + num(x.amt), 0); wait.push({ b, need, why, gig: gg.length && left + gsum >= need ? gg[0] : null }); }
  });
  const need = cands.reduce((a, b) => a + gmOwe(b), 0);
  return { pot, cands, pay, wait, left, short: cands.length > 0 && need > pot - gmFoodShare(horizon) + 0.005, need, lateN: gmOpenBills().filter(b => gmLate(b) < 0).length, pastN: gmOpenBills().filter(b => gmDue(b) < 0).length };
}

/* ---------- averaged budget ---------- */
function gmAvg() {
  const g = S.gm, from = dkey(addD(NOW(), -90)), allp = g.pays.filter(p => p.d >= from), pays = allp.filter(p => !p.kind || p.kind === 'pay'), paid = g.paid.filter(p => p.d >= from), notes = [];
  const grp = {}; pays.forEach(p => { const k = (p.n || 'Paycheck').trim().toLowerCase(); (grp[k] = grp[k] || { n: p.n || 'Paycheck', list: [] }).list.push(p); });
  const inc = Object.keys(grp).map(k => { const G = grp[k], L = G.list.slice().sort((a, b) => a.d < b.d ? -1 : 1), avg = L.reduce((a, p) => a + num(p.amt), 0) / L.length; let m = avg;
    if (L.length >= 2) { const gap = Math.max(5, dayDiff(pd(L[L.length - 1].d), pd(L[0].d)) / (L.length - 1)); m = avg * 30.44 / gap; } else notes.push('Only one "' + G.n + '" paycheck so far, so it is counted as monthly.');
    return { n: G.n, amt: Math.round(m) }; });
  const mths = Math.max(1, Math.min(3, gmDays() / 30.44)), side = [];
  ['gig', 'cash'].forEach(k => { const L = allp.filter(p => p.kind === k); if (L.length) side.push({ k, n: k === 'gig' ? 'Gig work (average)' : 'Cash drops (average)', amt: Math.round(L.reduce((a, p) => a + num(p.amt), 0) / mths), cnt: L.length }); });
  const lines = {}, custom = [], debts = []; let fees = 0;
  const bills = g.bills.filter(b => b.line !== 'none');
  bills.forEach(b => {
    const mine = paid.filter(p => p.bid === b.id); if (!mine.length && (b.done || (b.rec || 'm') === 'o')) return;
    const regular = (b.rec || 'm') !== 'o'; let m;
    if (regular) { const avg = mine.length ? mine.reduce((a, p) => a + num(p.amt), 0) / mine.length : num(b.base || b.amt); m = avg * (FREQ[b.rec || 'm'] || FREQ.m)[1]; }
    else m = mine.reduce((a, p) => a + num(p.amt), 0) / Math.max(1, Math.min(3, gmDays() / 30.44));
    m = Math.round(m); if (!m) return;
    if (num(b.bal) > 0) { debts.push({ n: b.n, t: b.dt || 'card', bal: Math.round(num(b.bal)), rate: num(b.apr), min: m }); return; }
    if (b.line && BLINES.some(l => l[0] === b.line) && b.type !== 'util') lines[b.line] = (lines[b.line] || 0) + m; else custom.push({ n: b.n, amt: m, cat: b.type === 'util' ? 'util' : 'other' });
  });
  paid.forEach(p => { fees += num(p.fee); });
  const months = Math.max(1, Math.min(3, gmDays() / 30.44)); const feeM = Math.round(fees / months);
  if (feeM > 0) custom.push({ n: 'Late fees (the leak to plug)', amt: feeM });
  if (num(g.food) > 0) lines.groc = Math.round(num(g.food));
  const incT = inc.reduce((a, x) => a + x.amt, 0), outT = Object.keys(lines).reduce((a, k) => a + lines[k], 0) + custom.reduce((a, x) => a + x.amt, 0) + debts.reduce((a, x) => a + x.min, 0);
  return { debts, inc, side, lines, custom, fees, feeM, incT, outT, left: incT - outT, notes, days: gmDays() };
}

/* ---------- setup (welcome screen entry) ---------- */
function gmSetupView() {
  let h = '<div class="hero"><img src="img/seal.png" alt=""><h1>Saturnica</h1><p class="gold"><i>Trust the math.</i></p></div>';
  h += '<section class="card"><div class="ct"><span>😎 I Got Thi$ mode</span></div><p>Three numbers. That is the whole setup. After that you only type in <b>paychecks</b> and <b>bills</b> as they show up in the mail. Saturnica tells you who to pay first and, after about 3 months, builds your real budget from what actually happened.</p>';
  h += '<label class="fl">Rent or mortgage, per month<input class="in" id="gm_rent" inputmode="decimal" placeholder="e.g. 1400" autocomplete="off"></label><label class="fl">Utilities, per month (electric, gas, water, trash, internet)<input class="in" id="gm_util" inputmode="decimal" placeholder="e.g. 250" autocomplete="off"></label><label class="fl">Food, per month (groceries and eating out)<input class="in" id="gm_food" inputmode="decimal" placeholder="e.g. 600" autocomplete="off"></label>';
  h += '<details><summary>Already have money set aside for bills? (optional)</summary><label class="fl">Cash for bills right now<input class="in" id="gm_cash" inputmode="decimal" placeholder="0" autocomplete="off"></label></details>';
  h += '<button class="btn gold block" data-act="gmStart">Start trusting the math</button><button class="btn block" data-act="gmBack">Back</button><p class="sm dim">Best guesses are fine. Real numbers replace them as bills come in. You can switch to the full setup interview any time.</p></section>';
  $('#view').innerHTML = h; $('#tabs').innerHTML = ''; window.scrollTo(0, 0);
}
ACT.gmSetup = () => { UI.gmSetup = true; renderWizard(); };
ACT.gmBack = () => { UI.gmSetup = false; renderWizard(); };
ACT.gmStart = () => {
  const rent = num($('#gm_rent').value), util = num($('#gm_util').value), food = num($('#gm_food').value), cash = num(($('#gm_cash') || {}).value);
  const g = S.gm = { on: true, start: dkey(), rent, util, food, cash0: cash, bills: [], pays: [], paid: [], ontime: 0, ord: 'smart', grad: null };
  const nf = nextFirst(), mid = new Date(nf.getFullYear(), nf.getMonth(), 15);
  if (rent > 0) g.bills.push({ id: uid(), n: 'Rent', type: 'rent', line: 'rent', amt: rent, base: rent, due: dkey(nf), dom: 1, lateOn: dkey(addD(nf, 5)), fee: 0, rec: 'm', ess: 1, guess: 1 });
  if (util > 0) g.bills.push({ id: uid(), n: 'Utilities', type: 'util', line: 'util', amt: util, base: util, due: dkey(mid), dom: 15, lateOn: dkey(mid), fee: 0, rec: 'm', ess: 1, guess: 1 });
  S.setup = true; UI.gmSetup = false; UI.tab = 'gtoday'; addXP(50); logIt('Started I Got Thi$ mode'); S.game.last = null; checkin(); after(); render();
  toast('😎 You are in. Log a paycheck and a bill when they show up.', 4200);
};

/* ---------- Today ---------- */
function gmChip(b) {
  const di = gmDue(b), lo = gmLate(b);
  if (lo < 0) return ['late', 'LATE' + (num(b.fee) ? ' · +' + gmM(b.fee) + ' fee' : '')];
  if (di < 0) return ['grace', 'Past due · fee starts ' + gmDate(b.lateOn)];
  if (di === 0) return ['soon', 'Due today'];
  if (di <= 7) return ['soon', 'Due in ' + di + ' day' + (di > 1 ? 's' : '')];
  return ['ok', 'Due ' + gmDate(b.due)];
}
function gmBillRow(b, compact) {
  const c = gmChip(b);
  return '<div class="gmbill"><div class="gmb1"><b>' + esc(b.n) + '</b>' + (b.ess ? ' <span class="tag">needs</span>' : '') + '<br><span class="gmchip ' + c[0] + '">' + esc(c[1]) + '</span>' + (b.guess ? ' <a class="lnk" data-act="gmBillEdit" data-id="' + b.id + '">set real date</a>' : '') + (b.partial ? ' <span class="sm dim">partly paid</span>' : '') + '</div><div class="gmb2"><b>' + gmM(gmOwe(b), gmOwe(b) % 1 ? 1 : 0) + '</b><br>' + (compact ? '' : '<button class="mini" data-act="gmBillEdit" data-id="' + b.id + '">Edit</button> ') + '<button class="mini gold" data-act="gmPaid" data-id="' + b.id + '">Paid</button></div></div>';
}
const gmX = w => (typeof gm2 === 'function' ? gm2(w) : '');
function gmToday() {
  const g = S.gm, P = gmPlan(), pot = P.pot, next14 = gmOpenBills().filter(b => gmDue(b) <= 14).reduce((a, b) => a + gmOwe(b), 0), food14 = gmFoodShare(14), after14 = pot - next14 - food14;
  let h = '<section class="card gmhero"><div class="ct"><span>😎 Trust the Math</span><span class="tag">day ' + gmDays() + ' of 90</span></div><div class="gmpot ' + (pot < 0 ? 'red' : '') + '"><small class="dim">In the bill pot</small><b>' + gmM(pot, 0) + '</b></div><div class="gmgrid"><div><small class="dim">Bills, next 14 days</small><b>' + gmM(next14) + '</b></div><div><small class="dim">Food set aside</small><b>' + gmM(food14) + '</b></div><div><small class="dim">Left after both</small><b class="' + (after14 < 0 ? 'red' : 'ok') + '">' + gmM(after14) + '</b></div></div><p class="sm dim">The pot is every paycheck you log minus every bill you mark paid.</p><div class="row"><button class="btn gold" data-act="gmPayNew">💵 Paycheck came</button><button class="btn gold" data-act="gmBillEdit">🧾 Bill came in</button></div><div class="row"><button class="btn" data-act="gmCashNew">🤫 Cash drop</button><button class="btn" data-act="gmGigNew">🛻 Gig coming</button></div>' + (gmJar() > 0 ? '<p class="sm center">🏺 Tax jar: <b>' + gmM(gmJar()) + '</b> <span class="dim">(not spendable)</span> <a class="lnk" data-act="gmJarPaid">I paid it</a></p>' : '') + '</section>';
  h += gmX('top');
  h += gmHelper(P);
  const up = gmUpcoming(7);
  h += '<section class="card"><div class="ct"><span>📅 Coming up</span><a class="lnk" data-act="goTab" data-v="gbills">All bills</a></div>' + (up.length ? up.join('') : '<p class="dim sm">Nothing yet. When a bill shows up in the mail tap <b>Bill came in</b>. Lined up some gig work? Tap <b>Gig coming</b>.</p>') + '</section>';
  h += gmProgress(); h += gmX('bottom');
  return h;
}
function gmHelper(P) {
  if (!gmOpenBills().length) return '';
  if (!P.short && !P.lateN && !P.pastN) return P.cands.length ? '<section class="card"><div class="ct"><span>✅ You are covered</span></div><p class="sm">Everything due in the next 10 days is covered, with food money set aside too.</p></section>' : '';
  const g = S.gm;
  let h = '<section class="card gmwarn"><div class="ct"><span>' + (P.short ? '⚠️ Not enough to cover everything' : '⏰ Bills need attention') + '</span></div>';
  if (P.short) h += '<p class="sm">Bills due in the next 10 days add up to <b>' + gmM(P.need) + '</b>. Your pot after food is <b>' + gmM(P.pot - gmFoodShare(10)) + '</b>. Here is the smartest order:</p>';
  h += '<div class="seg small"><button class="' + (g.ord !== 'small' ? 'on' : '') + '" data-act="gmOrd" data-v="smart">Needs first</button><button class="' + (g.ord === 'small' ? 'on' : '') + '" data-act="gmOrd" data-v="small">Smallest first</button></div>';
  if (P.pay.length) h += '<h4 class="sech">Pay these now</h4>' + P.pay.map((x, i) => '<div class="gmq"><span class="gmn">' + (i + 1) + '</span><div><b>' + esc(x.b.n) + '</b> ' + gmM(x.need, x.need % 1 ? 1 : 0) + '<br><small class="dim">' + esc(x.why) + '</small></div><button class="mini gold" data-act="gmPaid" data-id="' + x.b.id + '">Paid</button></div>').join('');
  if (P.wait.length) h += '<h4 class="sech">Cannot cover yet</h4>' + P.wait.map(x => { const lo = gmLate(x.b); return '<div class="gmq"><span class="gmn w">⏳</span><div><b>' + esc(x.b.n) + '</b> ' + gmM(x.need, x.need % 1 ? 1 : 0) + '<br><small class="dim">' + (lo < 0 ? 'Already late' : lo === 0 ? 'Late fee starts tomorrow' : 'Late fee starts ' + gmDate(x.b.lateOn) + ' (' + lo + ' day' + (lo > 1 ? 's' : '') + ')') + (x.gig ? '<br><small class="ok">🛻 Your gig "' + esc(x.gig.n) + '" (' + gmM(x.gig.amt) + ', ' + gmDate(x.gig.d) + ') should cover this if it pays on time.</small>' : '') + '</small></div><button class="mini" data-act="gmPaid" data-id="' + x.b.id + '">Paid</button></div>'; }).join('') + '<div class="flag"><b>📞 Call them first.</b> <span class="sm">Before a bill goes late, ask for a few extra days or a payment plan. Most companies say yes once, and some drop the late fee. Ask for the fee to be waived the first time.</span></div>';
  if (P.pastN && !P.short) h += '<p class="sm">Some bills are past due. Pay the ones marked late first so more fees do not pile up.</p>';
  return h + '</section>';
}
function gmProgress() {
  const g = S.gm, d = gmDays(), p = Math.min(100, Math.round(d / 90 * 100)), ready = gmReady();
  const ck = (ok, t) => '<div class="sm">' + (ok ? '✅' : '⬜') + ' ' + t + '</div>';
  let h = '<section class="card"><div class="ct"><span>🎓 Road to your real budget</span></div><div class="pbar"><i style="width:' + p + '%"></i></div><p class="sm center">' + (d >= 90 ? 'Three months in.' : 'Day ' + d + ' of 90') + '</p>' + ck(d >= 90, 'At least 90 days of tracking') + ck(g.pays.length >= 3, 'Three paychecks logged (' + g.pays.length + ')') + ck(g.paid.length >= 3, 'Three bills paid (' + g.paid.length + ')');
  h += ready ? '<button class="btn gold block" data-act="gmGradShow">🎓 Build my budget and level up</button>' : '<p class="sm dim">When all three boxes are checked, Saturnica builds your budget from the real average of everything you logged.</p><button class="btn block" data-act="gmGradShow"' + (gmUsable() ? '' : ' disabled') + '>Graduate early (rougher numbers)</button>';
  if (g.ontime) h += '<p class="sm center">⏱️ Bills paid on time so far: <b>' + g.ontime + '</b></p>';
  const fees = g.paid.reduce((a, p) => a + num(p.fee), 0); if (fees > 0) h += '<p class="sm center red">Late fees paid: ' + gmM(fees, 0) + '. Every one you skip is money kept.</p>';
  return h + '</section>';
}
ACT.gmOrd = el => { S.gm.ord = el.dataset.v; save(); render(); };

/* ---------- Bills page ---------- */
function gmBills() {
  const g = S.gm, open = gmOpenBills().slice().sort((a, b) => gmDue(a) - gmDue(b)), done = g.bills.filter(b => b.done);
  let h = gmBack() + '<section class="card"><div class="ct"><span>🧾 Bills</span><a class="lnk" data-act="gmBillEdit">Add a bill</a></div><p class="sm dim">Bills and gig money lined up by date. Type each bill in when it comes. When you tap Paid, a repeating bill rolls to its next due date by itself.</p>' + (gmUpcoming(60, true).join('') || '<p class="dim sm">No bills yet.</p>') + '<button class="btn gold block" data-act="gmBillEdit">🧾 Bill came in</button><button class="btn block" data-act="gmGigNew">🛻 Gig coming</button></section>';
  if (done.length) h += '<section class="card"><div class="ct"><span>One-time bills, finished</span></div>' + done.map(b => '<div class="nrow sm">' + esc(b.n) + ' <span class="dim">' + gmM(b.base) + '</span> <button class="mini" data-act="gmBillDel" data-id="' + b.id + '">Remove</button></div>').join('') + '</section>';
  return h;
}
function gmBack() { return gmOn() ? '' : '<button class="btn block" data-act="goTab" data-v="home">← Back to home</button>'; }
function gmMoney() {
  const g = S.gm; let h = gmBack() + '<section class="card"><div class="ct"><span>💵 Paychecks</span><a class="lnk" data-act="gmPayNew">Add</a></div>' + (g.pays.length ? g.pays.slice().sort((a, b) => a.d < b.d ? 1 : -1).slice(0, 12).map(p => '<div class="nrow"><span class="dim sm">' + gmDate(p.d) + '</span> ' + (p.kind === 'cash' ? '🤫' : p.kind === 'gig' ? '🛻' : '💵') + ' <b>' + esc(p.n || 'Paycheck') + '</b> ' + gmM(p.amt, p.amt % 1 ? 2 : 0) + (num(p.tax) ? ' <span class="dim sm">(' + gmM(p.tax) + ' to tax jar)</span>' : '') + ' <button class="mini" data-act="gmPayDel" data-id="' + p.id + '">Undo</button></div>').join('') : '<p class="dim sm">No paychecks logged yet.</p>') + '<button class="btn gold block" data-act="gmPayNew">💵 Paycheck came</button><div class="row"><button class="btn" data-act="gmCashNew">🤫 Cash drop</button><button class="btn" data-act="gmGigNew">🛻 Gig coming</button></div></section>';
  h += '<section class="card"><div class="ct"><span>✔️ Bills paid</span></div>' + (g.paid.length ? g.paid.slice(0, 15).map(p => '<div class="nrow"><span class="dim sm">' + gmDate(p.d) + '</span> <b>' + esc(p.n) + '</b> ' + gmM(num(p.amt) + num(p.fee), (num(p.amt) + num(p.fee)) % 1 ? 2 : 0) + (num(p.fee) ? ' <span class="red sm">incl. ' + gmM(p.fee) + ' fee</span>' : p.ont ? ' <span class="ok sm">on time</span>' : '') + ' <button class="mini" data-act="gmPaidUndo" data-id="' + p.id + '">Undo</button></div>').join('') : '<p class="dim sm">Nothing paid yet.</p>') + '</section>';
  return h;
}
function gmGame() {
  const g = S.game, L = lvlOf(g.xp);
  return '<section class="card"><div class="ct"><span>🎮 The game is on</span></div><p class="sm">Every paycheck you log and every bill you pay earns XP. Paying on time earns more. Level <b>' + L.n + '</b>, ' + esc(L.name) + ', ' + g.xp + ' XP, 🔥 ' + g.streak + '-day streak.</p><button class="btn gold block" data-act="quests">Open quests and medals</button></section><section class="card"><div class="ct"><span>🪐 The full game unlocks</span></div><p class="sm">When you graduate, your averaged budget fills in and you get everything: the Seven Rings, debt slayer, goals, side hustles, the vaults and life events. Your XP, level and streak carry over.</p>' + (gmReady() ? '<button class="btn gold block" data-act="gmGradShow">🎓 Graduate now</button>' : '<p class="sm dim">Day ' + gmDays() + ' of 90. Keep logging.</p><button class="btn block" data-act="gmGradShow"' + (gmUsable() ? '' : ' disabled') + '>Graduate early</button>') + '</section>';
}

/* ---------- sheets: paycheck, bill, paid ---------- */
ACT.gmPayNew = () => {
  const last = S.gm.pays.slice().sort((a, b) => a.d < b.d ? 1 : -1)[0];
  openSheet('Paycheck came', '<label class="fl">How much (take-home)<input class="in" id="gp_amt" inputmode="decimal" placeholder="e.g. 1250" autocomplete="off" value="' + (last ? esc(last.amt) : '') + '"></label><label class="fl">Date it arrived<input class="in" type="date" id="gp_d" value="' + dkey() + '"></label><label class="fl">From<input class="in" id="gp_n" value="' + esc(last ? last.n : 'Paycheck') + '" autocomplete="off"></label><button class="btn gold block" data-act="gmPaySave">Add to the pot</button>');
};
ACT.gmPaySave = () => {
  const amt = num($('#gp_amt').value); if (amt <= 0) { toast('Type the amount you got paid.'); return; }
  const g = S.gm; g.pays.push({ id: uid(), d: $('#gp_d').value || dkey(), amt, n: $('#gp_n').value.trim() || 'Paycheck' });
  logIt('Paycheck ' + gmM(amt)); const xp = addXP(10); after(); closeSheetQuiet(); render(); toast('💵 +' + gmM(amt) + ' in the pot · +' + xp + ' XP', 3000);
};
ACT.gmPayDel = el => { const g = S.gm, i = g.pays.findIndex(p => p.id === el.dataset.id); if (i >= 0) g.pays.splice(i, 1); save(); render(); toast('Paycheck removed.'); };

ACT.gmBillEdit = el => {
  const id = el && el.dataset ? el.dataset.id : null, b = id ? S.gm.bills.find(x => x.id === id) : null, n = NOW();
  const t = b ? b.type : 'other', dueD = b ? b.due : dkey(addD(n, 14)), off = b ? dayDiff(pd(b.lateOn || b.due), pd(b.due)) : 0;
  openSheet(b ? 'Edit bill' : 'Bill came in',
    '<label class="fl">What is it<select class="in" id="gb_t" data-chg="gmType">' + GM_TYPES.map(x => '<option value="' + x[0] + '"' + (x[0] === t ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label>' +
    '<label class="fl">Name<input class="in" id="gb_n" value="' + esc(b ? b.n : '') + '" placeholder="e.g. PG&E, Visa, Verizon" autocomplete="off"></label>' +
    '<div class="grid2"><label class="fl">Amount due<input class="in" id="gb_a" inputmode="decimal" value="' + esc(b ? val(b.partial ? b.base : b.amt) : '') + '" placeholder="$"></label><label class="fl">Due date<input class="in" type="date" id="gb_d" value="' + dueD + '"></label></div>' +
    '<div class="grid2"><label class="fl">Late on (fee starts after)<input class="in" type="date" id="gb_l" value="' + dkey(addD(pd(dueD), off)) + '"></label><label class="fl">Late fee amount<input class="in" id="gb_f" inputmode="decimal" value="' + esc(b ? val(b.fee) : '') + '" placeholder="$0 if none"></label></div>' +
    '<label class="fl">How often<select class="in" id="gb_r">' + GM_REC.map(x => '<option value="' + x[0] + '"' + (x[0] === (b ? b.rec || 'm' : 'm') ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label>' +
    '<label class="tog"><input type="checkbox" id="gb_e" ' + ((b ? b.ess : gmType(t)[3]) ? 'checked' : '') + '><span>This is a need (housing, power, water, phone, car, health)</span></label>' +
    '<p class="sm dim">Not sure about the late date or fee? Look on the bill, or leave them as they are.</p>' +
    '<button class="btn gold block" data-act="gmBillSave" data-id="' + (b ? b.id : '') + '">' + (b ? 'Save bill' : 'Add bill') + '</button>' + (b ? '<button class="btn danger block" data-act="gmBillDel" data-id="' + b.id + '">Delete this bill</button>' : ''));
};
CHG.gmType = el => { const t = gmType(el.value); const n = $('#gb_n'); if (!n.value.trim() || GM_TYPES.some(x => x[1].slice(3) === n.value)) n.value = el.value === 'other' ? '' : t[1].replace(/^\S+\s/, '').replace(/ \(all together\)/, ''); $('#gb_e').checked = !!t[3]; };
ACT.gmBillSave = el => {
  const g = S.gm, amt = num($('#gb_a').value); let nm = $('#gb_n').value.trim(); const type = $('#gb_t').value, T = gmType(type);
  if (!nm) nm = T[1].replace(/^\S+\s/, '').replace(/ \(all together\)/, ''); if (amt <= 0) { toast('Type the amount due.'); return; }
  const due = $('#gb_d').value || dkey(addD(NOW(), 14)); let lateOn = $('#gb_l').value || due; if (lateOn < due) lateOn = due;
  let b = el.dataset.id ? g.bills.find(x => x.id === el.dataset.id) : g.bills.find(x => !x.done && x.n.toLowerCase() === nm.toLowerCase()); const upd = !!b;
  if (!b) { b = { id: uid() }; g.bills.push(b); }
  Object.assign(b, { n: nm, type, line: T[2], amt, base: amt, partial: false, due, dom: pd(due).getDate(), lateOn, fee: num($('#gb_f').value), rec: $('#gb_r').value, ess: $('#gb_e').checked ? 1 : 0, guess: 0, done: false });
  if (!upd) { logIt('Bill added: ' + nm + ' ' + gmM(amt)); addXP(5); }
  after(); closeSheetQuiet(); render(); toast(upd ? 'Updated ' + nm + '.' : '🧾 Added ' + nm + ', due ' + gmDate(due) + '.', 2800);
};
ACT.gmBillDel = el => { if (!el.dataset.sure) { el.dataset.sure = 1; el.textContent = 'Tap again to delete'; return; } const g = S.gm; g.bills = g.bills.filter(b => b.id !== el.dataset.id); save(); closeSheetQuiet(); render(); toast('Bill deleted.'); };

ACT.gmPaid = el => {
  const b = S.gm.bills.find(x => x.id === el.dataset.id); if (!b) return; const fee = gmFeeOn(b);
  openSheet('Paid: ' + b.n, '<label class="fl">Amount you paid<input class="in" id="gq_a" inputmode="decimal" value="' + esc(b.amt) + '"></label><label class="fl">Date paid<input class="in" type="date" id="gq_d" value="' + dkey() + '"></label>' + (num(b.fee) > 0 ? '<label class="tog"><input type="checkbox" id="gq_f" ' + (fee ? 'checked' : '') + '><span>A late fee of ' + gmM(b.fee) + ' was charged</span></label>' : '') + '<p class="sm dim">Paying less than the amount due counts as a partial payment. The rest stays on the list.</p><button class="btn gold block" data-act="gmPaidSave" data-id="' + b.id + '">Mark paid</button>');
};
ACT.gmPaidSave = el => {
  const g = S.gm, b = g.bills.find(x => x.id === el.dataset.id); if (!b) return; const paid = num($('#gq_a').value); if (paid <= 0) { toast('Type what you paid.'); return; }
  const d = $('#gq_d').value || dkey(), feeAmt = $('#gq_f') && $('#gq_f').checked ? num(b.fee) : 0, ont = d <= b.due, partial = paid + 0.005 < num(b.amt);
  const prev = { due: b.due, lateOn: b.lateOn, amt: b.amt, partial: !!b.partial, done: !!b.done, guess: b.guess };
  g.paid.unshift({ id: uid(), bid: b.id, n: b.n, d, amt: paid, fee: feeAmt, line: b.line, ess: b.ess, ont: ont && !partial, prev });
  let msg, xp = 15;
  if (partial) { b.amt = Math.round((num(b.amt) - paid) * 100) / 100; b.partial = true; msg = '✔️ Partial payment on ' + b.n + '. ' + gmM(b.amt) + ' still due.'; }
  else { gmAdv(b); b.guess = 0; msg = '✔️ ' + b.n + ' paid' + (b.done ? '.' : '. Next due ' + gmDate(b.due) + '.'); if (ont) { g.ontime = (g.ontime || 0) + 1; xp += 10; } }
  logIt('Paid ' + b.n + ' ' + gmM(paid + feeAmt)); const got = addXP(xp); after(); closeSheetQuiet(); render(); toast(msg + ' +' + got + ' XP' + (ont && !partial ? ' (on time!)' : ''), 3600);
  if (!partial) fanfare(false);
};
ACT.gmPaidUndo = el => {
  const g = S.gm, i = g.paid.findIndex(p => p.id === el.dataset.id); if (i < 0) return; const p = g.paid[i], b = g.bills.find(x => x.id === p.bid);
  if (b && p.prev) { Object.assign(b, p.prev); if (p.ont) g.ontime = Math.max(0, (g.ontime || 0) - 1); }
  g.paid.splice(i, 1); save(); render(); toast('Payment undone. The bill is back on the list.');
};

/* ---------- graduation ---------- */
ACT.gmGradShow = () => {
  if (!gmUsable()) { toast('Log at least one paycheck and one paid bill first.'); return; }
  const A = gmAvg(), early = !gmReady();
  const names = id => (BLINES.find(l => l[0] === id) || [0, id])[1];
  let h = (early ? '<div class="flag ask"><b>Early graduation.</b> <span class="sm">You have ' + A.days + ' days of data. The budget below is a rough first draft. You can fix any number in the Budget tab.</span></div>' : '<div class="flag"><b>Three months of real numbers.</b> <span class="sm">Nothing guessed. This is what actually came in and went out.</span></div>');
  h += '<h4 class="sech">Income per month</h4>' + (A.inc.length ? A.inc.map(x => '<div class="nrow">' + esc(x.n) + ' <b class="ok">' + gmM(x.amt) + '</b></div>').join('') : '<p class="sm dim">None found.</p>');
  h += (typeof gmBasisHTML === 'function' ? gmBasisHTML(A) : '') + A.side.map(x => '<label class="tog"><input type="checkbox" id="gs_' + x.k + '" ' + (x.k === 'cash' || x.cnt >= 2 ? 'checked' : '') + '><span>Count ' + esc(x.n) + ' ' + gmM(x.amt) + '/mo as income? <small class="dim">Uncheck it to treat it as bonus money instead.</small></span></label>').join('') + '<h4 class="sech">Spending per month</h4>' + Object.keys(A.lines).map(k => '<div class="nrow">' + esc(names(k)) + ' <b>' + gmM(A.lines[k]) + '</b></div>').join('') + A.custom.map(x => '<div class="nrow">' + esc(x.n) + ' <b>' + gmM(x.amt) + '</b></div>').join('') + A.debts.map(x => '<div class="nrow">💳 ' + esc(x.n) + ' payment <b>' + gmM(x.min) + '</b> <span class="dim sm">balance ' + gmM(x.bal) + ', ' + x.rate + '%</span></div>').join('');
  h += '<div class="nrow"><b>Left over each month</b> <b class="' + (A.left < 0 ? 'red' : 'ok') + '">' + gmM(A.left) + '</b></div>' + A.notes.map(n => '<p class="sm dim">' + esc(n) + '</p>').join('');
  if (A.feeM > 0) h += '<p class="sm red">You paid about ' + gmM(A.feeM) + ' a month in late fees. The full app will help you plug that.</p>';
  h += '<p class="sm">This fills in your income and monthly bills, then opens everything: debts, goals, hustles, vaults, life events and the Counselor. Your bills and paychecks stay in <b>Menu → Bills and paychecks</b>.</p><button class="btn gold block" data-act="gmGrad">🎓 Make it my budget</button><button class="btn block" data-act="closeSheet">Keep tracking a while</button>';
  openSheet('Your averaged budget', h);
};
ACT.gmGrad = () => {
  const A = gmAvg(), g = S.gm;
  const sideOn = A.side.filter(x => $('#gs_' + x.k) && $('#gs_' + x.k).checked); A.inc = A.inc.concat(sideOn.map(x => ({ n: x.n, amt: x.amt })));
  const fac = typeof gmBasisFactor === 'function' ? gmBasisFactor(A) : 1; if (fac < 1) A.inc = A.inc.map(x => ({ n: x.n + ' (lowest-month basis)', amt: Math.round(x.amt * fac) }));
  S.inc = A.inc.map(x => ({ id: uid(), n: x.n, amt: x.amt, f: 'm' }));
  S.debts = S.debts.filter(d => !d.gm).concat(A.debts.map(x => ({ id: uid(), n: x.n, t: x.t, bal: x.bal, rate: x.rate, min: x.min, gm: 1 })));
  Object.keys(A.lines).forEach(k => { S.exp[k] = Object.assign(S.exp[k] || {}, { amt: A.lines[k] }); });
  S.custom = S.custom.filter(c => !c.gm).concat(A.custom.map(x => ({ id: uid(), n: x.n, amt: x.amt, f: 'm', cat: x.cat || 'other', gm: 1 })));
  g.grad = dkey(); S.setup = true; UI.tab = 'home'; logIt('Graduated from I Got Thi$ mode with an averaged budget'); addXP(150); S.applied = null;
  after(); closeSheetQuiet(); render(); fanfare(true); bigText('GRADUATED!', '🎓 Welcome to the full game 🎓', null, 1600); toast('Your budget is built from real numbers. Everything is unlocked.', 5000);
};
ACT.gmQuit = () => { if (S.gm) S.gm.on = false; S.setup = false; UI.wiz = 1; UI.gmSetup = false; closeSheetQuiet(); render(); };
ACT.gmOpen = () => { closeSheetQuiet(); UI.tab = 'gbills'; render(); window.scrollTo(0, 0); };

/* ---------- routing hooks ---------- */
function gmBody(tab) {
  if (gmOn()) return ({ gtoday: gmToday, gbills: gmBills, gmoney: gmMoney, ggame: gmGame }[tab] || gmToday)();
  if (gmHas() && (tab === 'gbills' || tab === 'gmoney')) return gmBills() + gmMoney().replace(gmBack(), '');
  return null;
}
function gmHomeCard() {
  if (!gmHas() || gmOn()) return '';
  const up = gmUpcoming(4), P = gmPlan();
  return '<section class="card' + (P.lateN ? ' gmwarn' : '') + '"><div class="ct"><span>🧾 Bills coming up</span><a class="lnk" data-act="gmOpen">Bills and paychecks</a></div>' + (up.length ? up.join('') : '<p class="sm dim">No open bills.</p>') + '<button class="btn block" data-act="gmPayNew">💵 Paycheck came</button></section>';
}
const _home0 = homeTab; homeTab = function () { return gmHomeCard() + _home0(); };
const _bud0 = budgetTab; budgetTab = function () { return (gmHas() && !gmOn() ? '<section class="card"><div class="ct"><span>🧾 Bills and paychecks</span><a class="lnk" data-act="gmOpen">Open</a></div><p class="sm dim">Keep logging what comes in the mail. Your budget stays honest.</p></section>' : '') + _bud0(); };

ACT.menu = () => {
  const full = [['life', '🌪️', 'Life events', 'Bonus, lost job, new partner, baby and more'], ['counsel', '🪙', 'Counsel', 'Advice, questions, warnings'], ['quests', '🎮', 'Quests and medals', 'XP, streaks, daily missions'], ['buyCheck', '🛒', 'Should I buy it?', 'The real cost of a purchase'], ['journal', '📓', 'Money journal', 'Everything you did'], ['redo', '🧭', 'Redo the setup interview', 'Change income, spending, debts'], ['settings', '⚙️', 'Settings and backup', 'Sound, AI key, export'], ['about', 'ℹ️', 'About and privacy', 'How Saturnica works']];
  let list;
  if (gmOn()) list = [['gmOpen', '🧾', 'Bills', 'Add, edit and pay bills'], ['gmRemind', '🔔', 'Reminders', 'Calendar alarms for bills and gigs'], ['quests', '🎮', 'Quests and medals', 'XP, streaks, daily missions'], ['gmGradShow', '🎓', 'Graduate now', 'Build my averaged budget and open the full app'], ['journal', '📓', 'Money journal', 'Everything you did'], ['gmQuit', '🧭', 'Switch to the full setup interview', 'Answer the questions instead'], ['gmBackup', '💾', 'Backup and sync', 'Save a copy, move to a new phone'], ['settings', '⚙️', 'Settings and backup', 'Sound, AI key, export'], ['about', 'ℹ️', 'About and privacy', 'How Saturnica works']];
  else { list = full.slice(); list.splice(6, 0, ['gmBackup', '💾', 'Backup and sync', 'Save a copy, move to a new phone']); if (gmHas()) { list.splice(4, 0, ['gmOpen', '🧾', 'Bills and paychecks', 'Due dates, late fees, who to pay first']); list.splice(5, 0, ['gmRemind', '🔔', 'Reminders', 'Calendar alarms for bills and gigs']); } }
  openSheet('Menu', list.map(a => '<button class="mrow" data-act="' + a[0] + '"><span class="me">' + a[1] + '</span><span><b>' + a[2] + '</b><br><small class="dim">' + a[3] + '</small></span></button>').join(''));
};

/* ---------- cash drops, gig funds ---------- */
const taxField = () => '<label class="fl">Set aside for taxes (percent, optional)<input class="in" id="gx_t" inputmode="decimal" placeholder="0" value="' + esc(val(S.gm.taxPct)) + '" autocomplete="off"></label><p class="sm dim">Cash and gig money is still taxable income. Many people park roughly 15 to 25 percent. That part goes into a tax jar that is not counted in your spendable pot.</p>';
ACT.gmCashNew = () => openSheet('🤫 Cash drop', '<p class="sm dim">Money that showed up outside a paycheck. Stays on this device.</p><label class="fl">How much<input class="in" id="gx_a" inputmode="decimal" placeholder="e.g. 150" autocomplete="off"></label><label class="fl">Where from (optional)<input class="in" id="gx_n" placeholder="Cash job, sold a bike, tip jar" autocomplete="off"></label><label class="fl">Date<input class="in" type="date" id="gx_d" value="' + dkey() + '"></label>' + taxField() + '<button class="btn gold block" data-act="gmCashSave">Drop it in the pot</button>');
ACT.gmCashSave = () => {
  const amt = num($('#gx_a').value); if (amt <= 0) { toast('Type how much came in.'); return; } const pct = clamp(num($('#gx_t').value), 0, 60), g = S.gm; g.taxPct = pct;
  g.pays.push({ id: uid(), d: $('#gx_d').value || dkey(), amt, n: $('#gx_n').value.trim() || 'Cash drop', kind: 'cash', tax: Math.round(amt * pct) / 100 });
  logIt('Cash drop'); const xp = addXP(10); after(); closeSheetQuiet(); render(); toast('🤫 Cash drop logged · +' + xp + ' XP', 3000);
};
ACT.gmGigNew = el => {
  const gg = el && el.dataset && el.dataset.id ? S.gm.gigs.find(x => x.id === el.dataset.id) : null;
  openSheet(gg ? 'Edit gig' : '🛻 Gig coming', '<p class="sm dim">Work you lined up but have not been paid for yet. It does not count as money until it lands, but Saturnica uses it to tell you which late bills it could cover.</p><label class="fl">Gig<input class="in" id="gg_n" placeholder="Deliveries, Saturday paint job" value="' + esc(gg ? gg.n : '') + '" autocomplete="off"></label><div class="grid2"><label class="fl">Expected pay<input class="in" id="gg_a" inputmode="decimal" placeholder="$" value="' + esc(gg ? gg.amt : '') + '"></label><label class="fl">Expected date<input class="in" type="date" id="gg_d" value="' + (gg ? gg.d : dkey(addD(NOW(), 7))) + '"></label></div><button class="btn gold block" data-act="gmGigSave" data-id="' + (gg ? gg.id : '') + '">Save gig</button>' + (gg ? '<button class="btn danger block" data-act="gmGigDel" data-id="' + gg.id + '">Remove gig</button>' : ''));
};
ACT.gmGigSave = el => {
  const amt = num($('#gg_a').value); if (amt <= 0) { toast('Type the expected pay.'); return; } const g = S.gm; g.gigs = g.gigs || []; let x = el.dataset.id ? g.gigs.find(y => y.id === el.dataset.id) : null; if (!x) { x = { id: uid() }; g.gigs.push(x); addXP(5); }
  Object.assign(x, { n: $('#gg_n').value.trim() || 'Gig', amt, d: $('#gg_d').value || dkey(), done: false }); after(); closeSheetQuiet(); render(); toast('🛻 Gig saved. Expected ' + gmDate(x.d) + '.', 2800);
};
ACT.gmGigDel = el => { S.gm.gigs = (S.gm.gigs || []).filter(x => x.id !== el.dataset.id); save(); closeSheetQuiet(); render(); };
ACT.gmGigPaid = el => {
  const x = (S.gm.gigs || []).find(y => y.id === el.dataset.id); if (!x) return;
  openSheet('Gig paid: ' + x.n, '<label class="fl">Amount you actually got<input class="in" id="gx_a" inputmode="decimal" value="' + esc(x.amt) + '"></label><label class="fl">Date<input class="in" type="date" id="gx_d" value="' + dkey() + '"></label>' + taxField() + '<button class="btn gold block" data-act="gmGigDone" data-id="' + x.id + '">Add to the pot</button>');
};
ACT.gmGigDone = el => {
  const g = S.gm, x = g.gigs.find(y => y.id === el.dataset.id), amt = num($('#gx_a').value); if (!x || amt <= 0) { toast('Type the amount you got.'); return; } const pct = clamp(num($('#gx_t').value), 0, 60); g.taxPct = pct;
  g.pays.push({ id: uid(), d: $('#gx_d').value || dkey(), amt, n: x.n, kind: 'gig', tax: Math.round(amt * pct) / 100 }); x.done = true; logIt('Gig paid: ' + x.n + ' ' + gmM(amt)); const xp = addXP(15); after(); closeSheetQuiet(); render(); fanfare(false); toast('🛻 Gig money in the pot · +' + xp + ' XP', 3200);
};
ACT.gmJarPaid = () => { const g = S.gm; g.jarOut = num(g.jarOut) + gmJar(); save(); render(); toast('Tax jar emptied. Nice work setting it aside.'); };
function gmGigRow(x) { return '<div class="gmbill gig"><div class="gmb1"><b>🛻 ' + esc(x.n) + '</b><br><span class="gmchip ok">Gig money expected ' + gmDate(x.d) + '</span></div><div class="gmb2"><b class="ok">+' + gmM(x.amt) + '</b><br><button class="mini" data-act="gmGigNew" data-id="' + x.id + '">Edit</button> <button class="mini gold" data-act="gmGigPaid" data-id="' + x.id + '">Got paid</button></div></div>'; }
function gmUpcoming(n, full) {
  const items = gmOpenBills().map(b => ({ d: b.due, h: gmBillRow(b, !full) })).concat(gmGigs().map(x => ({ d: x.d, h: gmGigRow(x) })));
  items.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0); return items.slice(0, n).map(i => i.h);
}
function gmGigCard() {
  const gg = gmGigs(); if (!gg.length) return '';
  return '<section class="card"><div class="ct"><span>🛻 Gigs coming</span><a class="lnk" data-act="gmGigNew">Add</a></div>' + gg.map(x => '<div class="gmbill"><div class="gmb1"><b>' + esc(x.n) + '</b><br><span class="gmchip soon">Expected ' + gmDate(x.d) + '</span></div><div class="gmb2"><b>' + gmM(x.amt) + '</b><br><button class="mini" data-act="gmGigNew" data-id="' + x.id + '">Edit</button> <button class="mini gold" data-act="gmGigPaid" data-id="' + x.id + '">Got paid</button></div></div>').join('') + '<p class="sm dim">Not counted as money until it lands.</p></section>';
}
