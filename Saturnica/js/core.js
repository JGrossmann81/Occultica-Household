/* Saturnica core: store, helpers, calculators (budget, debt payoff, retirement), score, rings, counsel rules. */
const KEY = 'saturnica.v1';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOW = () => new Date(window.__now || Date.now());
const MS = 86400000;
const pad2 = n => String(n).padStart(2, '0');
const dkey = d => { d = d || NOW(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const mkey = d => { d = d || NOW(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); };
const pd = k => { const a = String(k).split('-'); return new Date(+a[0], +a[1] - 1, +a[2] || 1); };
const addD = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const addM = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28));
const dayDiff = (a, b) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()) - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / MS);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = d => MON[d.getMonth()] + ' ' + d.getDate();
const fmtMY = d => MON[d.getMonth()] + ' ' + d.getFullYear();
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[$,\s]/g, '')); return isFinite(n) ? n : 0; };
const $$$ = (n, dec) => { n = +n || 0; const neg = n < 0; n = Math.abs(n); return (neg ? '-$' : '$') + (dec ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(n).toLocaleString('en-US')); };
const pct = n => (Math.round(n * 10) / 10) + '%';
const mo = it => num(it.amt) * (FREQ[it.f || 'm'] || FREQ.m)[1];
const yrs = m => { const y = Math.floor(m / 12), r = m % 12; return (y ? y + ' yr' + (y > 1 ? 's' : '') : '') + (y && r ? ' ' : '') + (r || !y ? r + ' mo' : ''); };

/* ---------- store ---------- */
function blank() {
  return { v: 1, setup: false, step: 0, me: { name: '', age: null, retireAge: null, hh: 1, kids: 0 }, inc: [], exp: {}, custom: [], subs: [], assets: { emerg: 0, retire: 0, invest: 0, home: 0, other: 0 },
    debts: [], extra: 0, strat: 'snow', ret: { want: 0, ss: 0, contrib: 0, real: 5 }, goals: [], vlog: [], hustle: { skills: [], assets: [], certs: [], hrs: 5, cost: 100, done: false, saved: [], target: 200 }, wins: [], sells: [],
    game: { xp: 0, streak: 0, last: null, best: 0, med: {}, q: {}, nosp: [], lvl: 1, tiers: {} }, settings: { sound: true, apiKey: '', model: 'claude-sonnet-5-5' }, chat: [], log: [], applied: null, cuts: {}, gm: null };
}
let S = blank();
function mergeDeep(a, b) { Object.keys(b || {}).forEach(k => { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) mergeDeep(a[k], b[k]); else a[k] = b[k]; }); return a; }
function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v) S = mergeDeep(blank(), j); } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function logIt(msg) { S.log.unshift({ d: dkey(), msg }); if (S.log.length > 150) S.log.length = 150; }

/* ---------- budget ---------- */
function mortgageOn() { return S.debts.some(d => d.t === 'mortgage' && num(d.min) > 0); }
function lineList() { // [{id,n,cat,amt (monthly),src}]
  const out = []; BLINES.forEach(l => { if (l[0] === 'rent' && mortgageOn()) return; const a = num((S.exp[l[0]] || {}).amt); if (a) out.push({ id: l[0], n: l[1], cat: l[2], amt: a }); });
  S.custom.forEach(c => { const a = mo(c); if (a) out.push({ id: c.id, n: c.n, cat: c.cat || 'other', amt: a, custom: true }); });
  S.subs.forEach(s => { if (s.cut) return; const a = mo(s); if (a) out.push({ id: s.id, n: s.n, cat: 'fun', amt: a, sub: true }); });
  return out;
}
function calc() {
  const inc = S.inc.reduce((a, x) => a + mo(x), 0), lines = lineList(), byCat = {}; Object.keys(BCATS).forEach(k => { byCat[k] = 0; });
  lines.forEach(l => { byCat[l.cat] = (byCat[l.cat] || 0) + l.amt; });
  const live = lines.reduce((a, l) => a + l.amt, 0), dmin = S.debts.reduce((a, d) => a + num(d.min), 0), saveM = num(S.ret.contrib);
  const ess = (byCat.housing || 0) + (byCat.util || 0) + (byCat.food || 0) + (byCat.trans || 0) + (byCat.health || 0) + (byCat.kids || 0) + dmin;
  const consumer = S.debts.filter(d => d.t !== 'mortgage'), cbal = consumer.reduce((a, d) => a + num(d.bal), 0), mbal = S.debts.filter(d => d.t === 'mortgage').reduce((a, d) => a + num(d.bal), 0);
  const tbal = cbal + mbal, A = S.assets, nw = num(A.emerg) + num(A.retire) + num(A.invest) + num(A.home) + num(A.other) - tbal;
  const subsM = S.subs.filter(s => !s.cut).reduce((a, s) => a + mo(s), 0);
  const surplus = inc - live - dmin - saveM;
  return { inc, live, dmin, saveM, ess, byCat, cbal, mbal, tbal, nw, subsM, surplus, hasInc: inc > 0, hasExp: live > 0, free: inc - live - dmin, months: ess > 0 ? num(A.emerg) / ess : null };
}
function weightedRate(ds) { const b = ds.reduce((a, d) => a + num(d.bal), 0); return b ? ds.reduce((a, d) => a + num(d.bal) * num(d.rate), 0) / b : 0; }

/* ---------- debt payoff simulator ---------- */
function simulate(debts, extra, strat, noRoll) {
  const D = debts.filter(d => num(d.bal) > 0).map(d => ({ id: d.id, n: d.n, b: num(d.bal), r: num(d.rate) / 1200, min: Math.max(0, num(d.min)), t: d.t, rate: num(d.rate) }));
  if (!D.length) return { months: 0, interest: 0, order: [], hist: [0], never: false, paid: 0 };
  let pool = D.reduce((a, d) => a + d.min, 0) + Math.max(0, extra), month = 0, interest = 0, paid = 0; const hist = [D.reduce((a, d) => a + d.b, 0)], order = [];
  const sorter = strat === 'aval' ? (a, b) => b.rate - a.rate || a.b - b.b : (a, b) => a.b - b.b || b.rate - a.rate;
  while (D.some(d => d.b > .005) && month < 1200) {
    month++; D.forEach(d => { if (d.b > 0) { const i = d.b * d.r; d.b += i; interest += i; } });
    let avail = noRoll ? 0 : pool; const live = D.filter(d => d.b > .005).sort(sorter);
    if (noRoll) { D.forEach(d => { if (d.b > 0) { const p = Math.min(d.b, d.min + (d === live[0] ? Math.max(0, extra) : 0)); d.b -= p; paid += p; } }); }
    else { live.forEach(d => { const p = Math.min(d.b, d.min); d.b -= p; avail -= p; paid += p; }); for (const d of live) { if (avail <= .005) break; if (d.b <= .005) continue; const p = Math.min(d.b, avail); d.b -= p; avail -= p; paid += p; } }
    D.forEach(d => { if (d.b <= .005 && !d.done) { d.done = month; d.b = 0; order.push({ id: d.id, n: d.n, month }); } });
    hist.push(D.reduce((a, d) => a + d.b, 0));
  }
  return { months: month, interest, paid, order, hist, never: D.some(d => d.b > .005) };
}
function minOnly(debts) { // each debt on its own minimum, no rolling
  let months = 0, interest = 0, never = false; debts.filter(d => num(d.bal) > 0).forEach(d => { const r = simulate([d], 0, 'snow', true); months = Math.max(months, r.months); interest += r.interest; if (r.never) never = true; }); return { months, interest, never };
}
function debtPlan() { const ds = S.debts.filter(d => d.t !== 'mortgage'); return { ds, plan: simulate(ds, num(S.extra), S.strat), base: minOnly(ds), snow: simulate(ds, num(S.extra), 'snow'), aval: simulate(ds, num(S.extra), 'aval') }; }
function mortgageInfo() { const ms = S.debts.filter(d => d.t === 'mortgage' && num(d.bal) > 0); if (!ms.length) return null; const r = simulate(ms, 0, 'snow'); return { bal: ms.reduce((a, d) => a + num(d.bal), 0), months: r.months, interest: r.interest, never: r.never }; }
const CUTTABLE = ['dining', 'hobby', 'dates', 'clothes', 'hair', 'gym', 'gifts', 'misc', 'kidstuff'];
function cutIdeas() { // discretionary lines and a 15-25% trim
  const out = []; CUTTABLE.forEach(id => { const a = num((S.exp[id] || {}).amt); if (a >= 20) out.push({ id, n: (BLINES.find(l => l[0] === id) || [0, id])[1], amt: a, cut: Math.round(a * (id === 'dining' ? .3 : .2)) }); });
  S.subs.forEach(s => { if (!s.cut && mo(s) > 0) out.push({ id: s.id, n: s.n + ' (subscription)', amt: mo(s), cut: Math.round(mo(s)), sub: true }); });
  return out.sort((a, b) => b.cut - a.cut).slice(0, 8);
}
function consolidate(newRate, termM, feePct) {
  const el = S.debts.filter(d => ['card', 'store', 'personal', 'payday', 'medical'].indexOf(d.t) >= 0 && num(d.bal) > 0), B = el.reduce((a, d) => a + num(d.bal), 0); if (!B) return null;
  const r = newRate / 1200, fee = B * feePct / 100, P = B + fee, pay = r ? P * r / (1 - Math.pow(1 + r, -termM)) : P / termM, tot = pay * termM, cur = minOnly(el), curPlan = simulate(el, 0, 'snow');
  return { B, el, pay, interest: tot - B, fee, curInterest: curPlan.interest, curMonths: curPlan.months, curMin: el.reduce((a, d) => a + num(d.min), 0), save: curPlan.interest - (tot - B), wr: weightedRate(el), never: curPlan.never };
}

/* ---------- retirement ---------- */
function retireCalc(extraMo) {
  const age = num(S.me.age), ra = num(S.me.retireAge) || 65; if (!age || ra <= age) return null;
  const c = calc(), n = ra - age, r = Math.pow(1 + (num(S.ret.real) || 5) / 100, 1 / 12) - 1, bal0 = num(S.assets.retire), contrib = num(S.ret.contrib) + (extraMo || 0);
  const live = c.live || 0, want = num(S.ret.want) || Math.round(live * .8), ss = num(S.ret.ss), needMo = Math.max(0, want - ss), target = needMo * 12 * 25;
  const fv = (bal, pmt, m) => bal * Math.pow(1 + r, m) + (r ? pmt * (Math.pow(1 + r, m) - 1) / r : pmt * m);
  const proj = fv(bal0, contrib, n * 12), need = r ? Math.max(0, (target - bal0 * Math.pow(1 + r, n * 12)) * r / (Math.pow(1 + r, n * 12) - 1)) : Math.max(0, (target - bal0) / (n * 12));
  const series = []; for (let a = age; a <= ra; a += Math.max(1, Math.round(n / 24))) series.push([a, fv(bal0, contrib, (a - age) * 12)]); if (series[series.length - 1][0] !== ra) series.push([ra, proj]);
  return { age, ra, n, bal0, contrib, want, ss, needMo, target, proj, incomeMo: proj * .04 / 12 + ss, need, gap: target - proj, pctGoal: target ? proj / target * 100 : 100, series, auto: !num(S.ret.want), onTrack: proj >= target };
}
function retireAtTable() { const age = num(S.me.age); if (!age) return []; const keep = S.me.retireAge; const out = []; [55, 60, 62, 65, 67, 70].filter(a => a > age).forEach(a => { S.me.retireAge = a; const r = retireCalc(); if (r) out.push({ ra: a, need: r.need, ok: r.onTrack, proj: r.proj }); }); S.me.retireAge = keep; return out; }

/* ---------- score, rings ---------- */
function reign() {
  const c = calc(), parts = []; // each: [name, score 0..100, weight]
  if (c.hasInc && (c.hasExp || c.dmin)) { const f = c.surplus / c.inc; parts.push(['Budget balance', f >= .1 ? 100 : f >= 0 ? 60 + f / .1 * 40 : clamp(60 + f / .25 * 60, 0, 60), 30]); }
  if (c.hasInc) { const d = c.dmin / c.inc; parts.push(['Debt load', clamp(100 - d / .4 * 100, 0, 100), 20]); }
  if (c.ess > 0) parts.push(['Emergency fund', clamp((num(S.assets.emerg) / c.ess) / 6 * 100, 0, 100), 25]); else if (num(S.assets.emerg) > 0) parts.push(['Emergency fund', clamp(num(S.assets.emerg) / 10000 * 100, 0, 100), 25]);
  if (c.hasInc) { const rate = (num(S.ret.contrib)) / c.inc; if (num(S.ret.contrib) || num(S.assets.retire)) parts.push(['Retirement saving', clamp(rate / .15 * 100, 0, 100), 25]); }
  if (!parts.length) return null; const w = parts.reduce((a, p) => a + p[2], 0), score = Math.round(parts.reduce((a, p) => a + p[1] * p[2], 0) / w);
  return { score, parts, label: score >= 85 ? 'Reigning' : score >= 70 ? 'Strong' : score >= 50 ? 'Building' : score >= 30 ? 'Shaky' : 'Needs a plan' };
}
function ringsState() {
  const c = calc(), A = S.assets, cons = c.cbal, out = [];
  const done = [num(A.emerg) >= 1000, S.debts.length > 0 ? cons <= 0 : false, c.ess > 0 ? num(A.emerg) >= 3 * c.ess : num(A.emerg) >= 9000, c.inc > 0 ? num(S.ret.contrib) / c.inc >= .15 : false, !(+S.me.kids > 0) || !!S.me.collegeDone, !S.debts.some(d => d.t === 'mortgage' && num(d.bal) > 0) && (S.debts.some(d => d.t === 'mortgage') || !!S.me.homeFree), c.nw >= 500000];
  if (!S.debts.length && !S.me.noDebt) done[1] = false; if (S.me.noDebt) done[1] = true;
  let cur = -1; done.forEach((d, i) => { if (cur < 0 && !d) cur = i; });
  RINGS.forEach((r, i) => out.push({ n: r[0], e: r[1], d: r[2], done: done[i], cur: i === cur, na: i === 4 && !(+S.me.kids > 0) }));
  return { rings: out, cur, count: done.filter(Boolean).length };
}
function vaultInfo() { // tiers and progress for the three vaults
  const c = calc(), A = S.assets, rc = retireCalc(), ess = c.ess, tr = [];
  const e = num(A.emerg), eT = ess > 0 ? [1000, ess, ess * 3, ess * 6, ess * 12] : [1000, 3000, 9000, 18000, 36000]; let et = 0; eT.forEach((t, i) => { if (e >= t) et = i + 1; });
  const rb = num(A.retire), rT = rc ? [.05, .15, .35, .6, 1].map(f => rc.target * f) : [5000, 25000, 100000, 250000, 1000000]; let rt = 0; rT.forEach((t, i) => { if (t > 0 && rb >= t) rt = i + 1; });
  const w = num(A.invest), wT = [1000, 10000, 50000, 150000, 500000]; let wt = 0; wT.forEach((t, i) => { if (w >= t) wt = i + 1; });
  return { emerg: { bal: e, tier: et, T: eT, next: eT[et] }, retire: { bal: rb, tier: rt, T: rT, next: rT[rt] }, invest: { bal: w, tier: wt, T: wT, next: wT[wt] }, boost: Math.min(.5, (et + rt + wt) * .04) };
}

/* ---------- counsel rules ---------- */
function advise() {
  const c = calc(), out = [], R = reign(), A = S.assets, dp = debtPlan(), inc = c.inc, add = (lvl, t, d, go) => out.push({ lvl, t, d, go });
  if (!c.hasInc) add('info', 'Add your income', 'Counsel works with whatever you tell it. Add take-home pay in Budget and the advice sharpens.', 'budget');
  if (c.hasInc && c.hasExp && c.surplus < 0) add('red', 'You are spending more than you earn', 'You are about ' + $$$(-c.surplus) + ' short every month. That gap becomes debt. Cut wants first (dining, subscriptions, fun), then shop insurance and bills. Do not cover the gap with a card.', 'budget');
  if (c.hasInc && c.dmin / inc > .4) add('red', 'Debt payments are over 40% of your income', 'Debt minimums take ' + pct(c.dmin / inc * 100) + ' of take-home. This is a plan-now situation: list every debt, stop new borrowing, raise income, and talk to a nonprofit credit counselor if you are falling behind.', 'debt');
  else if (c.hasInc && c.dmin / inc > .25) add('warn', 'Debt payments are heavy', 'Minimums take ' + pct(c.dmin / inc * 100) + ' of take-home. Aim to cut that below 15% by paying off smaller debts first.', 'debt');
  S.debts.filter(d => d.t === 'payday' && num(d.bal) > 0).forEach(d => add('red', 'Payday or title loan: ' + d.n, 'This is the most dangerous kind of debt. Make it your first target, never roll it over, and ask a nonprofit credit counselor about alternatives.', 'debt'));
  S.debts.filter(d => d.t !== 'mortgage' && num(d.bal) > 0 && num(d.min) < num(d.bal) * num(d.rate) / 1200 * 1.02 && num(d.rate) > 0).forEach(d => add('red', 'The minimum does not cover interest on ' + d.n, 'Your payment of ' + $$$(num(d.min)) + ' is barely above or below the monthly interest (' + $$$(num(d.bal) * num(d.rate) / 1200) + '). The balance will not fall. Raise the payment now.', 'debt'));
  const hi = S.debts.filter(d => d.t !== 'mortgage' && num(d.rate) >= 20 && num(d.bal) > 0); if (hi.length) add('warn', 'High-rate debt: ' + hi.map(d => d.n).join(', '), 'Rates of 20% or more cost you a fortune. A lower-rate consolidation or a balance transfer may help, but only if you stop adding to the cards. See the Debt tab.', 'debt');
  if (dp.plan.never && dp.ds.length) add('red', 'Your plan never pays the debt off', 'With the current payments the balances do not reach zero. Add an extra payment in the Debt tab, even $25 a month, to start moving.', 'debt');
  if (S.debts.length && num(A.emerg) < 1000 && c.cbal > 0) add('warn', 'Build the starter shield first', 'Before the big debt push, set aside $1,000 so a flat tire does not go on a card. It takes about ' + (c.surplus > 0 ? (Math.ceil((1000 - num(A.emerg)) / c.surplus) === 1 ? '1 month' : Math.ceil((1000 - num(A.emerg)) / c.surplus) + ' months') + ' at your current surplus.' : 'a plan: free up money first.'), 'vault');
  if (!S.debts.length && c.ess > 0 && c.months != null && c.months < 3) add('warn', 'Your emergency fund covers ' + (Math.round(c.months * 10) / 10) + ' months', 'Aim for 3 to 6 months of essentials (' + $$$(c.ess * 3) + ' to ' + $$$(c.ess * 6) + '). Feed the Fortress Vault each payday.', 'vault');
  if (c.hasInc && c.byCat.housing / inc > .35) add('warn', 'Housing is ' + pct(c.byCat.housing / inc * 100) + ' of take-home', 'Over 35% squeezes everything else. Options: a roommate or rented room, refinance, a cheaper place at lease end, or bringing in more income.', 'budget');
  if (c.hasInc && c.byCat.trans / inc > .2) add('warn', 'Transportation is ' + pct(c.byCat.trans / inc * 100) + ' of take-home', 'Over 15% is heavy. Shop insurance, consider selling a car with a big payment, and buy used with cash next time.', 'budget');
  if (c.hasInc && c.byCat.food / inc > .2) add('warn', 'Food is ' + pct(c.byCat.food / inc * 100) + ' of take-home', 'Meal planning, a weekly grocery list and cooking at home five nights usually saves $150 to $400 a month.', 'budget');
  if (c.hasInc && c.subsM > 0 && c.subsM / inc > .04) add('warn', 'Subscriptions cost ' + $$$(c.subsM * 12) + ' a year', 'Review them in Budget. Cancel what you have not used this month; most people find two or three.', 'budget');
  if (c.hasInc && c.surplus > 0 && !S.debts.length && num(S.ret.contrib) / inc < .15) add('info', 'Raise retirement saving toward 15%', 'You have ' + $$$(c.surplus) + ' a month left over. Even a few percent more, started now, compounds for decades.', 'vault');
  const rc = retireCalc(); if (rc && !rc.onTrack) add(rc.pctGoal < 40 ? 'warn' : 'info', 'Retirement at ' + rc.ra + ': ' + Math.round(rc.pctGoal) + '% of the way', 'At the current pace you would have ' + $$$(rc.proj) + ' of the ' + $$$(rc.target) + ' target. Closing the gap takes about ' + $$$(rc.need) + ' a month, or a later retirement age (see the Vault tab).', 'vault');
  if (c.hasInc && c.surplus > 0 && c.surplus / inc > .1 && !out.some(o => o.lvl === 'red')) add('good', 'You have a healthy margin', 'You keep ' + pct(c.surplus / inc * 100) + ' of your income. Give every extra dollar a job: shield, debt, retirement or a dream.', 'home');
  if (S.wins.length === 0 && c.hasInc && c.surplus < c.inc * .05) add('info', 'Raise income with a side hustle', 'When the budget is tight, earning more is as powerful as cutting. Try the questionnaire in the Hustle tab and sell what you do not use.', 'hustle');
  const rank = { red: 0, warn: 1, info: 2, good: 3 }; return out.sort((a, b) => rank[a.lvl] - rank[b.lvl]);
}
function nextMove() {
  const rs = ringsState(), c = calc(); if (!c.hasInc) return { t: 'Tell Saturnica what you earn', d: 'Every calculation starts with take-home income. Skip anything you do not want to share.', go: 'budget' };
  if (c.hasInc && c.hasExp && c.surplus < 0) return { t: 'Close the monthly gap', d: 'You are short ' + $$$(-c.surplus) + ' a month. Trim wants or add income before anything else.', go: 'budget' };
  const cur = rs.cur; const RM = [
    () => ({ t: 'Ring 1: Build the Starter Shield', d: 'Save $1,000. You have ' + $$$(num(S.assets.emerg)) + '. Feed the Fortress Vault.', go: 'vault' }),
    () => ({ t: 'Ring 2: Slay the debts', d: S.debts.length ? 'Pay every minimum and send all extra to one target. Debt-free in ' + yrs(debtPlan().plan.months) + ' at your plan.' : 'List your debts, or tell Saturnica you have none.', go: 'debt' }),
    () => ({ t: 'Ring 3: Fill the Fortress', d: 'Save 3 to 6 months of essentials (about ' + $$$(calc().ess * 3) + ' to ' + $$$(calc().ess * 6) + ').', go: 'vault' }),
    () => ({ t: 'Ring 4: Reach 15% for retirement', d: 'Move toward ' + $$$(calc().inc * .15) + ' a month. You are at ' + $$$(num(S.ret.contrib)) + '.', go: 'vault' }),
    () => ({ t: 'Ring 5: Kids\' education', d: 'Fund it after your own retirement. Mark it done in Goals when it is handled.', go: 'goals' }),
    () => ({ t: 'Ring 6: Own the home outright', d: 'Pay extra principal on the mortgage.', go: 'debt' }),
    () => ({ t: 'Ring 7: Build wealth and give', d: 'You are in the crown ring. Invest steadily and give with purpose.', go: 'goals' })
  ]; return cur >= 0 ? RM[cur]() : { t: 'You wear the Saturn Crown', d: 'Every ring complete. Keep building and keep giving.', go: 'goals' };
}
