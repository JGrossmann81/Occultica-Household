/* Saturnica - Life Events: sudden changes, updated budget, tips from your numbers + Healthica */
const LIFE = [
  { id: 'bonus', e: '🎁', n: 'Bonus or tax refund', s: 'Money you did not plan on', f: [['amt', 'Amount after taxes', '$']], lump: 1 },
  { id: 'windfall', e: '💎', n: 'Inheritance or windfall', s: 'Gift, settlement, sale of something big', f: [['amt', 'Amount after taxes', '$']], lump: 1 },
  { id: 'raise', e: '📈', n: 'Raise or new higher job', s: 'More take-home every month', f: [['amt', 'Extra take-home per month', '$']] },
  { id: 'paycut', e: '📉', n: 'Pay cut or fewer hours', s: 'Income drops but is not gone', f: [['inc', 'Which income', 'inc'], ['amt', 'New take-home per month', '$']] },
  { id: 'jobloss', e: '🚨', n: 'Lost my job', s: 'Switch to survival mode', f: [['inc', 'Which income ended', 'inc'], ['sev', 'Severance or payout (one time)', '$'], ['ui', 'Unemployment or new income per month', '$']] },
  { id: 'partner', e: '💍', n: 'New partner or spouse', s: 'Moving in, marriage, merging households', f: [['inc', 'Their take-home per month', '$'], ['cost', 'Extra monthly costs (food, utilities)', '$'], ['rent', 'Housing cost that drops for you', '$']] },
  { id: 'roommate', e: '🛋️', n: 'New roommate', s: 'Rent income or shared bills', f: [['inc', 'Rent they pay you per month', '$'], ['cost', 'Extra utilities and food', '$']] },
  { id: 'baby', e: '👶', n: 'New child', s: 'A growing family', f: [['cost', 'New monthly costs (childcare, diapers, food)', '$'], ['one', 'One-time costs now (gear, hospital)', '$']] },
  { id: 'medical', e: '🩺', n: 'Medical bill or health event', s: 'Add it as a plan, not a panic', f: [['amt', 'Amount you owe', '$'], ['min', 'Monthly payment you can do', '$'], ['rate', 'Interest % (ask for 0)', '%']] },
  { id: 'repair', e: '🔧', n: 'Car or home emergency', s: 'The surprise repair', f: [['amt', 'Cost', '$'], ['src', 'Pay it from', 'src']] },
  { id: 'split', e: '💔', n: 'Separation or divorce', s: 'One household becomes two', f: [['inc', 'Which income changes', 'inc'], ['amt', 'New take-home for that income', '$'], ['cost', 'New monthly costs for you', '$']] },
  { id: 'move', e: '📦', n: 'Moving', s: 'New place, new rent', f: [['rent', 'New rent or housing payment per month', '$'], ['one', 'One-time moving costs', '$']] }
];
let LR = null;

function lifeSnap() {
  const c = calc(), dp = debtPlan();
  return { c, left: c.surplus, inc: c.inc, ess: c.ess, emerg: num(S.assets.emerg), runway: c.ess > 0 ? num(S.assets.emerg) / c.ess : null, months: dp.plan.months, never: dp.plan.never, hasDebt: dp.ds.some(d => num(d.bal) > 0), debt: c.cbal };
}
function consumerDebts() { return S.debts.filter(d => d.t !== 'mortgage' && num(d.bal) > 0).sort((a, b) => num(b.rate) - num(a.rate)); }
function allocate(amt, survival) {
  const out = [], A = S.assets, c = calc(); let rem = amt; const put = (to, a, why, id) => { a = Math.min(rem, Math.round(a)); if (a > 0) { out.push({ to, id, amt: a, why }); rem -= a; } };
  const ds = consumerDebts();
  if (num(A.emerg) < 1000) put('emerg', 1000 - num(A.emerg), 'Starter shield first');
  if (survival) { put('emerg', rem, 'Every dollar is runway while income is down'); return out; }
  const fun = amt >= 500 ? Math.round(amt * .05) : 0; rem -= fun;
  if (ds.length) { let pool = Math.round(rem * .7); ds.forEach(d => { const a = Math.min(pool, num(d.bal)); if (a > 0) { out.push({ to: 'debt', id: d.id, amt: a, why: d.n + ' at ' + pct(num(d.rate)) }); pool -= a; rem -= a; } }); }
  const target = c.ess * 3, emerg2 = num(A.emerg) + out.filter(o => o.to === 'emerg').reduce((a, o) => a + o.amt, 0);
  if (!ds.length || rem > 0) put('emerg', Math.max(0, target - emerg2), 'Build toward 3 months of essentials');
  if (rem > 0) put('retire', rem * (num(A.invest) > num(A.retire) ? .4 : .7), 'Feed the Retirement Ring');
  if (rem > 0) put('invest', rem, 'Feed the Crown Vault');
  if (fun) out.push({ to: 'fun', amt: fun, why: 'Enjoy it. A small reward keeps the plan alive' });
  return out;
}
const TO_NAME = { emerg: '🏰 Fortress Vault', retire: '🪐 Retirement Ring', invest: '👑 Crown Vault', fun: '🎉 Enjoy it', debt: '⚔️ Debt' };

function gymNote() { const g = num((S.exp.gym || {}).amt); return g > 0 ? 'You pay ' + $$$(g) + ' a month for a gym. Healthica has home routines, walking plans and bodyweight workouts that cost nothing, so this line is the first one to question.' : ''; }
const HL = {
  bonus: ['Spend a slice on your health: a good pair of shoes, a blood pressure cuff or a bike tune-up pays back for years.', 'Healthica plan: use the energy of a win to start a 10-minute daily walk. Free, and it improves sleep and spending decisions.'],
  windfall: ['Big money events are stressful even when happy. Use Healthica to keep sleep, water and walks steady before making any big decision.', 'Put a small, planned amount toward preventive care you have been skipping (dental, eye, checkups).'],
  raise: ['More income can mean more takeout. Open Healthica and set a cooking-at-home streak so the raise goes to your goals, not the drive-through.', 'Invest part of the raise in recovery: sleep, strength training and checkups keep the earning machine running.'],
  paycut: ['Stress eating and stress spending move together. Healthica daily walks, breathing and sleep targets are free and calm the urge to spend.', 'Meal plans from Healthica cut the food line, usually the easiest place to save $100 to $300 a month.'],
  jobloss: ['Protect your health while the money is tight: keep a sleep schedule, walk daily and cook at home. Healthica routines cost nothing and help you stay sharp for interviews.', 'Health insurance: losing job coverage usually opens a special enrollment window (often 60 days). Check the marketplace, a spouse plan or COBRA before the deadline, and do not go uninsured.', 'Book needed checkups and refills before coverage ends.'],
  partner: ['Join forces: shared Healthica workouts, shared cooking nights and a weekly walk-and-money-talk make both goals stick.', 'Combine insurance plans and compare. Often one plan is far cheaper for the pair.'],
  roommate: ['Shared kitchens make meal prep cheaper. Cook in batches and use Healthica meal ideas to keep food costs low.', 'Agree on quiet hours so sleep stays protected.'],
  baby: ['Sleep and recovery come first. Use Healthica for short, gentle routines, hydration and walking with the stroller.', 'Check your health plan for newborn coverage windows and use preventive visits, they are usually free.', 'Cook and freeze meals in batches before and after the birth to stay off the takeout trap.'],
  medical: ['Prevention is the cheapest medicine. Healthica habits (movement, sleep, food) lower the odds of the next bill.', 'Ask the billing office for an itemized bill, financial assistance and a 0% payment plan before paying anything. Errors are common.', 'Follow every recovery instruction. A repeat visit costs more than any other line in this budget.'],
  repair: ['Walking, biking and public transport days from Healthica give your car a break and your wallet one too.', 'Learn basic maintenance. Many repairs start as a cheap fix ignored.'],
  split: ['This is a hard season. Keep sleep, movement and a friend to talk to. Healthica daily routines give structure when everything else changes.', 'Do not skip checkups or therapy if you need them. Many plans and community clinics are low cost.'],
  move: ['A move is a perfect time to reset habits. Choose a place where walking and errands are close, and set a Healthica routine for week one.', 'Unpacking, lifting and stairs count as workouts. Lift with your legs.']
};

ACT.life = () => openSheet('Life events', '<p class="dim sm">Something changed? Tell Saturnica and it updates your numbers, shows the effect and gives tips based on your own budget. You can undo any event.</p>' + LIFE.map(x => '<button class="mrow" data-act="lifeEv" data-v="' + x.id + '"><span class="me">' + x.e + '</span><span><b>' + x.n + '</b><br><small class="dim">' + x.s + '</small></span></button>').join('') + (S.life && S.life.length ? '<h4 class="sech">Recent events</h4>' + S.life.slice(0, 6).map(l => '<div class="nrow sm"><span class="dim">' + fmtD(pd(l.d)) + '</span> ' + esc(l.n) + '</div>').join('') : ''));

function lifeField(f) {
  const [k, l, t] = f;
  if (t === 'inc') return '<label class="fl">' + l + '<select class="in" id="lf_' + k + '"><option value="">Not sure / none</option>' + (S.inc.length > 1 ? '<option value="all">All income</option>' : '') + S.inc.map(i => '<option value="' + i.id + '">' + esc(i.n) + ' (' + $$$(mo(i)) + '/mo)</option>').join('') + '</select></label>';
  if (t === 'src') return '<label class="fl">' + l + '<select class="in" id="lf_' + k + '"><option value="emerg">Emergency fund</option><option value="debt">Borrow (adds a debt)</option></select></label>';
  return '<label class="fl">' + l + '<input class="in" id="lf_' + k + '" inputmode="decimal" placeholder="' + t + ' (optional)"></label>';
}
ACT.lifeEv = el => {
  const x = LIFE.find(e => e.id === el.dataset.v); if (!x) return;
  const fixInc = x.id === 'partner' || x.id === 'roommate'; // those 'inc' fields are numbers
  openSheet(x.e + ' ' + x.n, '<p class="dim sm">Fill in what you know. Skip anything you do not.</p>' + x.f.map(f => (f[2] === 'inc' && !fixInc) || f[2] === 'src' ? lifeField(f) : lifeField([f[0], f[1], f[2] === 'inc' ? '$' : f[2]])).join('') + '<button class="btn gold block" data-act="lifeGo" data-v="' + x.id + '">Update my plan</button>');
};

function lifeApply(x, v) {
  const A = S.assets, tips = [], moves = []; const s0 = lifeSnap(); const snap = JSON.stringify(S);
  const incName = id => (S.inc.find(i => i.id === id) || {}).n || 'income';
  const addInc = (n, amt) => { if (amt > 0) S.inc.push({ id: uid(), n, amt, f: 'm' }); };
  const addCost = (n, amt, cat) => { if (amt > 0) S.custom.push({ id: uid(), n, amt, f: 'm', cat: cat || 'other' }); };
  const setInc = (id, newMonthly) => { const items = id === 'all' ? S.inc.slice() : S.inc.filter(i => i.id === id); items.forEach(i => { if (newMonthly > 0 && id !== 'all') i.amt = Math.round(newMonthly / (FREQ[i.f || 'm'] || FREQ.m)[1] * 100) / 100; else S.inc = S.inc.filter(z => z !== i); }); };
  const fromEmerg = a => { const t = Math.min(a, num(A.emerg)); A.emerg = num(A.emerg) - t; return a - t; };
  let head = '', lump = 0, survival = false;
  switch (x.id) {
    case 'bonus': case 'windfall': lump = v.amt; head = $$$(v.amt) + ' arrives'; break;
    case 'raise': addInc('Raise', v.amt); head = 'Raise of ' + $$$(v.amt) + ' a month'; break;
    case 'paycut': if (v.inc) { setInc(v.inc, v.amt); head = incName(v.inc) + ' drops to ' + $$$(v.amt) + ' a month'; } else head = 'Pay cut noted'; break;
    case 'jobloss': if (v.inc) setInc(v.inc, 0); addInc('Unemployment or new income', v.ui); if (v.sev > 0) { lump = v.sev; survival = true; } S.extra = 0; head = 'Survival mode on'; survival = true; break;
    case 'partner': addInc('Partner income', v.inc); addCost('Partner share (food, utilities)', v.cost); if (v.rent > 0 && S.exp.rent) S.exp.rent.amt = Math.max(0, num(S.exp.rent.amt) - v.rent); S.me.hh = num(S.me.hh || 1) + 1; head = 'Household of ' + S.me.hh; break;
    case 'roommate': addInc('Roommate rent', v.inc); addCost('Extra utilities and food', v.cost); head = 'Roommate adds ' + $$$(v.inc - v.cost) + ' net'; break;
    case 'baby': addCost('New child', v.cost, 'kids'); S.me.kids = num(S.me.kids) + 1; S.me.hh = num(S.me.hh || 1) + 1; S.me.collegeDone = false; if (v.one > 0) { const rest = fromEmerg(v.one); if (rest > 0) { S.debts.push({ id: uid(), n: 'Baby costs', t: 'other', bal: rest, rate: 0, min: Math.round(rest / 12) }); } } head = 'Family grows'; break;
    case 'medical': if (v.amt > 0) { S.debts.push({ id: uid(), n: 'Medical bill', t: 'medical', bal: v.amt, rate: v.rate || 0, min: v.min || Math.max(25, Math.round(v.amt / 24)) }); S.me.noDebt = false; } head = $$$(v.amt) + ' medical plan added'; break;
    case 'repair': if (v.src === 'debt') { S.debts.push({ id: uid(), n: 'Repair bill', t: 'card', bal: v.amt, rate: 22, min: Math.max(25, Math.round(v.amt * .04)) }); S.me.noDebt = false; head = $$$(v.amt) + ' repair on a card'; } else { const rest = fromEmerg(v.amt); head = $$$(v.amt - rest) + ' came from the Fortress Vault'; if (rest > 0) { S.debts.push({ id: uid(), n: 'Repair bill', t: 'card', bal: rest, rate: 22, min: Math.max(25, Math.round(rest * .04)) }); head += ', ' + $$$(rest) + ' on a card'; } } break;
    case 'split': if (v.inc) setInc(v.inc, v.amt); addCost('New household costs', v.cost); S.me.hh = Math.max(1, num(S.me.hh || 1) - 1); head = 'One household becomes two'; break;
    case 'move': if (v.rent > 0) { if (mortgageOn()) head = 'New housing costs noted'; else { S.exp.rent = S.exp.rent || {}; S.exp.rent.amt = v.rent; head = 'Housing is now ' + $$$(v.rent) + ' a month'; } } else head = 'Move noted'; if (v.one > 0) { const rest = fromEmerg(v.one); if (rest > 0) S.debts.push({ id: uid(), n: 'Moving costs', t: 'other', bal: rest, rate: 0, min: Math.max(25, Math.round(rest / 12)) }); } break;
  }
  const s1 = lifeSnap(), c = s1.c, A2 = S.assets;
  /* tips from the numbers */
  if (lump) {
    const alloc = allocate(lump, survival); LR = { alloc, lump };
    if (!survival) { tips.push('Do not spend a windfall in the first 30 days. Park it in the Fortress Vault, then follow the plan below.'); if (x.id === 'windfall') { tips.push('Large inheritances and settlements can have tax rules. A one-time visit with a fee-only advisor or tax pro is worth the cost for amounts over about $50,000.'); tips.push('Be careful lending it out. Decide on a gift amount you can afford to never see again.'); } else tips.push('Treat bonuses like part of the plan. Give most of it a job before it disappears into daily spending.'); }
  } else LR = { alloc: null };
  if (x.id === 'raise') { const half = Math.round(v.amt * .6); tips.push('Lifestyle creep eats raises. Send at least 60% of it (' + $$$(half) + ' a month) to a goal before it reaches your checking account.'); if (s1.hasDebt) moves.push({ l: 'Add ' + $$$(half) + ' to my extra debt payment', run: () => { S.extra = num(S.extra) + half; } }); else moves.push({ l: 'Add ' + $$$(half) + ' to retirement saving', run: () => { S.ret.contrib = num(S.ret.contrib) + half; } }); }
  if (x.id === 'paycut' || x.id === 'split') { if (s1.left < 0) tips.push('You are now about ' + $$$(-s1.left) + ' short each month. Cut wants first: dining, subscriptions, hobbies. Then call insurance, phone and internet providers.'); else tips.push('You are still ' + $$$(s1.left) + ' ahead, but the cushion is thinner. Pause extra goal saving only if you must, and keep the Starter Shield.'); }
  if (x.id === 'split') { tips.push('Update your insurance, beneficiaries and any shared accounts or cards. Split shared debts in writing and close joint credit lines.'); tips.push('Rebuild the emergency fund to 3 to 6 months for one income.'); }
  if (x.id === 'jobloss') {
    const run = s1.ess > 0 ? (num(A2.emerg)) / Math.max(1, s1.ess - Math.max(0, c.inc)) : null; const burn = Math.max(1, c.live + c.dmin - c.inc);
    const rw = (num(A2.emerg) + (lump || 0)) / burn;
    tips.push('Runway: your Fortress Vault covers about ' + (Math.round(rw * 10) / 10) + ' months at your current spending. ' + (rw < 3 ? 'That is short. Cut every want and start earning now.' : rw < 6 ? 'That is decent. Stay lean and move fast on a new income.' : 'That is a strong cushion. Stay lean and be selective.'));
    tips.push('Extra debt payments are paused (set to $0). Pay minimums only. Missing a minimum costs more than any other mistake right now.');
    const cuts = cutIdeas(); if (cuts.length) tips.push('Trim first: ' + cuts.slice(0, 4).map(x => x.n + ' ' + $$$(x.cut)).join(', ') + '. That frees about ' + $$$(cuts.slice(0, 4).reduce((a, x) => a + x.cut, 0)) + ' a month.');
    tips.push('Call your lenders before you miss a payment and ask about hardship plans. Also file for unemployment right away if you have not.');
    tips.push('Use the Hustle tab today. Selling unused items and quick gigs turn into money this week.');
    if (num(S.ret.contrib) > 0) moves.push({ l: 'Pause retirement saving of ' + $$$(num(S.ret.contrib)) + ' while income is down', run: () => { S.ret.contrib = 0; } });
    moves.push({ l: 'Cut the top trim ideas (set subscriptions to cancelled)', run: () => { S.subs.forEach(s => { if (!s.cut && mo(s) > 0) s.cut = dkey(); }); } });
  }
  if (x.id === 'partner' || x.id === 'roommate') { const gain = s1.left - s0.left; tips.push('Your monthly leftover moved by ' + (gain >= 0 ? '+' : '-') + $$$(Math.abs(gain)) + '.'); if (gain > 0) { tips.push('Do not let new income quietly raise your spending. Decide together to send at least half of the gain (' + $$$(gain / 2) + ') to debt or savings.'); if (s1.hasDebt) moves.push({ l: 'Add ' + $$$(Math.round(gain / 2)) + ' to extra debt payment', run: () => { S.extra = num(S.extra) + Math.round(gain / 2); } }); } if (x.id === 'partner') { tips.push('Hold a money meeting: list all debts, goals and credit scores. Pick one budget and one emergency fund. Agree on a personal-spending amount each.'); tips.push('Update the Goals tab with your shared dreams and retirement age.'); } else tips.push('Put the agreement in writing: rent amount, due date, deposit, shared bills. Keep roommate rent in its own envelope for the housing bill.'); }
  if (x.id === 'baby') { tips.push('Build the emergency fund toward 6 months of essentials. A child makes a job loss much costlier.'); tips.push('Term life insurance (about 10 to 12 times income) for each earner is usually cheap and protects the family.'); tips.push('The Legacy Ring is now active. Start education saving only after the Starter Shield, debt and retirement are on track.'); tips.push('Check dependent care accounts, the child tax credit and any employer benefits for new parents.'); }
  if (x.id === 'medical') { tips.push('Do not put this on a card. Ask for an itemized bill, check it for errors, and request charity care or financial assistance. Hospitals often reduce bills a lot.'); tips.push('Negotiate a 0% payment plan. Paying a lump sum fast can earn a discount.'); tips.push('Your plan: ' + $$$(num(v.min) || Math.max(25, Math.round(v.amt / 24))) + ' a month. Keep it in the Debt tab and attack it after high-rate cards.'); }
  if (x.id === 'repair') { tips.push(v.src === 'debt' ? 'A card makes this repair cost more. Pay it off before other goals and rebuild the Starter Shield.' : 'This is exactly what the emergency fund is for. Rebuild it to at least $1,000 as soon as you can.'); tips.push('Get two quotes for anything over $500, and ask about used or reconditioned parts.'); }
  if (x.id === 'move') { const hi = c.inc > 0 ? c.byCat.housing / c.inc : 0; tips.push('Housing is now ' + pct(hi * 100) + ' of take-home. ' + (hi > .35 ? 'That is above 35%, which crowds everything else. Consider a roommate, a smaller place or a longer commute from a cheaper area.' : 'That is a healthy level.')); tips.push('Update insurance, utilities and address. Moves are a good time to reshop auto and renter insurance.'); tips.push('Declutter first. Sell what you will not use instead of paying to move it (Hustle tab).'); }
  /* shared tips */
  if (s1.left < 0 && x.id !== 'jobloss') tips.push('Warning: you are now spending more than you earn. Fix this first, before any other goal.');
  if (s1.runway != null && s1.runway < 3 && x.id !== 'jobloss') tips.push('Your emergency fund covers about ' + (Math.round(s1.runway * 10) / 10) + ' months. Build it toward 3 to 6.');
  if (s1.never) tips.push('The debt plan no longer pays off the balances. Raise payments or cut spending in the Debt tab.');
  const gn = gymNote(); const hl = (HL[x.id] || []).concat(gn ? [gn] : []);
  LR = Object.assign(LR || {}, { x, v, s0, s1, tips, hl, moves, snap, head });
  S.life = S.life || []; S.life.unshift({ d: dkey(), id: x.id, n: x.n + ': ' + head }); if (S.life.length > 30) S.life.length = 30;
  logIt('Life event: ' + x.n + '. ' + head); if (['bonus', 'windfall', 'raise', 'partner', 'roommate'].includes(x.id)) addXP(15); after();
}

ACT.lifeGo = el => {
  const x = LIFE.find(e => e.id === el.dataset.v); if (!x) return; const v = {};
  x.f.forEach(f => { const n = $('#lf_' + f[0]); if (!n) return; v[f[0]] = (f[2] === 'inc' && !(x.id === 'partner' || x.id === 'roommate')) || f[2] === 'src' ? n.value : num(n.value); });
  if (x.lump && !(v.amt > 0)) { toast('Enter the amount first.'); return; }
  lifeApply(x, v); closeSheetQuiet(); render(); lifeResult();
};
function lifeResult() {
  const R = LR; if (!R || !R.x) return; const a = R.s0, b = R.s1, row = (l, x, y, fmt, goodUp) => { const d = y - x, cls = Math.abs(d) < .5 ? '' : ((d > 0) === goodUp ? 'good' : 'bad'); return '<tr><td>' + l + '</td><td>' + fmt(x) + '</td><td class="' + cls + '"><b>' + fmt(y) + '</b></td></tr>'; };
  const mf = m => m == null ? '-' : (Math.round(m * 10) / 10) + ' mo';
  const free = x => $$$(x), dm = m => (b.hasDebt || a.hasDebt) ? (m === 0 ? 'none' : yrs(m)) : 'none';
  const alloc = R.alloc && R.alloc.length ? '<h4 class="sech">Where the money should go</h4>' + R.alloc.map(o => '<div class="nrow"><b>' + $$$(o.amt) + '</b> to ' + TO_NAME[o.to] + (o.to === 'debt' ? ' <span class="dim">(' + esc(o.why) + ')</span>' : '<br><small class="dim">' + esc(o.why) + '</small>') + '</div>').join('') + '<button class="btn gold block" data-act="lifePlan">Apply this plan</button><small class="dim">Applying updates your balances. Skip it if you want to move the money yourself.</small>' : '';
  const html = '<div class="center"><div class="vstone">' + R.x.e + '</div><h2 class="big">' + esc(R.head) + '</h2></div>' +
    (R.x.lump ? '<p class="dim sm">Nothing in your budget changes until you apply the plan below.</p>' : '<table class="cmp"><tr><th></th><th>Before</th><th>Now</th></tr>' + row('Monthly left over', a.left, b.left, free, true) + row('Emergency months', a.runway || 0, b.runway || 0, mf, true) + row('Consumer debt', a.debt, b.debt, free, false) + (a.hasDebt || b.hasDebt ? '<tr><td>Debt-free in</td><td>' + (a.never ? 'never' : dm(a.months)) + '</td><td><b>' + (b.never ? 'never' : dm(b.months)) + '</b></td></tr>' : '') + '</table>') + alloc +
    '<h4 class="sech">💡 What to do with your numbers</h4>' + R.tips.map(t => '<div class="nrow">' + esc(t) + '</div>').join('') +
    (R.moves.length ? '<h4 class="sech">One-tap moves</h4>' + R.moves.map((m, i) => '<button class="btn block" data-act="lifeMove" data-i="' + i + '">' + esc(m.l) + '</button>').join('') : '') +
    '<h4 class="sech">💚 From Healthica</h4>' + R.hl.map(t => '<div class="nrow">' + esc(t) + '</div>').join('') + '<small class="dim">Open the Healthica app for the matching routines and meal plans.</small>' +
    '<div class="grid2" style="margin-top:14px"><button class="btn block" data-act="lifeUndo">Undo this event</button><button class="btn gold block" data-act="closeSheet">Done</button></div>';
  openSheet('Plan updated', html);
}
ACT.lifePlan = () => {
  const R = LR; if (!R || !R.alloc) return; const A = S.assets;
  R.alloc.forEach(o => { if (o.to === 'debt') { const d = S.debts.find(z => z.id === o.id); if (d) { d.bal = Math.max(0, num(d.bal) - o.amt); logIt('Life event money sent to ' + d.n + ': ' + $$$(o.amt)); } } else if (o.to !== 'fun') { A[o.to] = num(A[o.to]) + o.amt; S.vlog.push({ id: uid(), d: dkey(), k: o.to, amt: o.amt }); logIt('Life event money fed ' + VNAME[o.to].slice(3) + ': ' + $$$(o.amt)); } });
  addXP(40); R.alloc = null; after(); closeSheetQuiet(); render(); toast('Plan applied. Balances updated.', 3500);
};
ACT.lifeMove = el => { const m = LR && LR.moves[+el.dataset.i]; if (!m) return; m.run(); after(); render(); el.disabled = true; el.textContent = 'Done: ' + m.l; };
ACT.lifeUndo = () => { if (!LR || !LR.snap) return; S = mergeDeep(blank(), JSON.parse(LR.snap)); LR = null; save(); closeSheetQuiet(); render(); toast('Event undone.'); };

/* warn on Home and Counsel for the first weeks after a hard event */
(function () {
  const base = advise;
  advise = function () {
    const out = base(), recent = (S.life || []).filter(l => ['jobloss', 'paycut', 'split', 'medical'].includes(l.id) && (NOW() - pd(l.d)) / 864e5 < 60);
    if (recent.length) out.unshift({ lvl: 'warn', t: 'Recovery mode after ' + recent[0].n.split(':')[0].toLowerCase(), d: 'Keep spending lean, protect the Fortress Vault, and review your plan weekly. Tap Life events to see tips, or update numbers when things change.', go: 'life' });
    return out;
  };
})();
