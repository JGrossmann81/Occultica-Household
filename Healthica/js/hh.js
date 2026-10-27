/* Healthica in the Occultica household: rough meal costs, recipes from what Hortica says is ripe,
   "I grew this" credit for homegrown food, money ideas for Saturnica, and shared calendar dates.
   Shares only a small summary (see occ-link.js). Never shares symptoms, logs, weights or conditions. */
/* rough US grocery prices: [pattern, $, basis] basis: lb | each | cup | can | tbsp */
const HH_PRICE = [
  [/chicken breast|chicken thigh|ground chicken|boneless skinless/, 4.5, 'lb'], [/whole chicken/, 12, 'each'], [/ground turkey|turkey breast/, 5.5, 'lb'], [/lean ground beef|ground beef/, 6, 'lb'],
  [/sirloin|flank steak|steak/, 11, 'lb'], [/pork tenderloin/, 5, 'lb'], [/ground lamb/, 9, 'lb'], [/uncured bacon|bacon/, 7, 'lb'],
  [/wild salmon|salmon fillet|salmon/, 11, 'lb'], [/smoked salmon/, 16, 'lb'], [/cod/, 9, 'lb'], [/shrimp/, 10, 'lb'], [/tuna in water|tuna/, 1.5, 'can'],
  [/egg/, 0.35, 'each'], [/tofu/, 3, 'lb'], [/greek yogurt|yogurt/, 1.4, 'cup'], [/cottage cheese/, 1.3, 'cup'], [/parmesan/, 0.5, 'tbsp'],
  [/mozzarella|cheddar|provolone|cheese|feta/, 1.8, 'cup'], [/almond milk|oat milk|milk/, 0.35, 'cup'], [/coconut milk/, 2.5, 'can'], [/butter|ghee/, 0.25, 'tbsp'],
  [/spinach|kale|romaine|lettuce|greens|arugula|coleslaw|cabbage/, 0.7, 'cup'], [/broccoli|cauliflower|brussels|asparagus|snap peas|green beans/, 1.1, 'cup'],
  [/cherry tomato|tomatoes, diced|diced tomato|crushed tomato|marinara/, 1.4, 'can'], [/tomato/, 0.8, 'each'], [/zucchini|summer squash/, 1.1, 'each'], [/spaghetti squash/, 4, 'each'],
  [/bell pepper|red pepper(?! flake)/, 1.3, 'each'], [/cucumber/, 0.9, 'each'], [/mushroom/, 1.6, 'cup'], [/avocado(?! oil)/, 1.4, 'each'], [/onion/, 0.8, 'each'], [/garlic clove/, 0.12, 'each'], [/head of garlic/, 0.7, 'each'],
  [/carrot/, 0.3, 'each'], [/celery/, 0.25, 'each'], [/lemon|lime/, 0.6, 'each'], [/apple/, 0.9, 'each'], [/berries|raspberr|blueberr|strawberr/, 2.2, 'cup'],
  [/chickpea|black beans|kidney beans|white beans|beans/, 1.2, 'can'], [/lentil/, 0.5, 'cup'], [/quinoa/, 0.6, 'cup'], [/broth/, 0.6, 'cup'], [/hummus/, 0.6, 'tbsp'],
  [/almond flour/, 0.9, 'cup'], [/walnut|almond|pecan|cashew/, 0.5, 'tbsp'], [/almond butter|peanut butter|tahini/, 0.35, 'tbsp'], [/chia|flax/, 0.3, 'tbsp'],
  [/cocoa|dark chocolate/, 0.6, 'tbsp'], [/olive|caper|pickle/, 0.3, 'tbsp'], [/oil|\{hf\}|\{ev\}|mayonnaise/, 0.25, 'tbsp'], [/parsley|dill|cilantro|basil|chive|thyme|rosemary|mint|green onion/, 0.4, 'tbsp']
];
const HH_TBSP = { tbsp: 1, tsp: 1 / 3, pinch: 0.05, dash: 0.05, cup: 16, cups: 16, handful: 3, leaves: 0.3 };
function hhIngCost(g) {
  const nm = String(g.name || '').toLowerCase(), u = (g.u || '').toLowerCase(), n = +g.n || 1; if (/salt|pepper$|^water|spice|powder|dried|cumin|paprika|oregano|cinnamon|turmeric|vanilla|baking|stevia|monk fruit|aminos|mustard|vinegar|flakes|extract|curry|coriander/.test(nm) && !/bell pepper|red pepper(?! flake)/.test(nm)) return 0.12 * Math.min(n, 3);
  const row = HH_PRICE.find(r => r[0].test(nm)); if (!row) return { cup: 1, cups: 1, tbsp: .2, tsp: .07, oz: .5, lb: 5, can: 1.5, cans: 1.5, '': .8, handful: .6, slices: .5, slice: .5, serving: 1, bunch: 1.5 }[u] * n || 0.5;
  const [, p, basis] = row;
  if (basis === 'lb') return p * (u === 'lb' ? n : u === 'oz' ? n / 16 : u === '' ? n * 0.4 : /slice/.test(u) ? n * 0.06 : u === 'can' || u === 'cans' ? n * 0.3 : n * 0.25);
  if (basis === 'each') return p * (u === '' || u === 'slices' || u === 'slice' ? n : u === 'cup' || u === 'cups' ? n * 1.2 : n);
  if (basis === 'cup') return p * (u === 'cup' || u === 'cups' ? n : u === 'tbsp' ? n / 16 : u === 'oz' ? n / 8 : u === 'handful' ? n / 2 : u === 'can' || u === 'cans' ? n * 1.75 : n);
  if (basis === 'can') return p * (u === 'can' || u === 'cans' ? n : u === 'cup' || u === 'cups' ? n / 1.75 : u === 'oz' ? n / 15 : n * 0.5);
  if (basis === 'tbsp') return p * (HH_TBSP[u] != null ? n * HH_TBSP[u] : n);
  return 0.5;
}
const hhAdj = () => (S.kitchen && S.kitchen.priceAdj) || 1;
function hhRecipeCost(r, skipGarden) { if (!r || !r.ings) return 0; const gw = skipGarden ? [] : hhGardenWords(); return r.ings.reduce((s, g) => s + (gw.length && hhGardenHit(g.name, gw) ? 0 : hhIngCost(g)), 0) * hhAdj(); }
const money = v => '$' + (v >= 100 ? Math.round(v) : v.toFixed(2));

/* ---------- garden (from Hortica) ---------- */
function hhGarden() {
  const o = window.OCC && OCC.get('hortica'); if (!o) return null; const k14 = addDays(dkey(), -14);
  const items = {}; (o.data.harvest || []).filter(h => h.d >= k14).forEach(h => { (items[h.n] = items[h.n] || { n: h.n, picked: 0, u: h.u, ripe: false }).picked += +h.q || 0; });
  (o.data.ripe || []).forEach(r => { (items[r.n] = items[r.n] || { n: r.n, picked: 0, ripe: true }).ripe = true; });
  return { ts: o.ts, items: Object.values(items), value30: o.data.value30 || 0 };
}
function hhGardenWords() {
  const g = hhGarden(); if (!g) return [];
  return g.items.map(i => { const w = i.n.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, ' ').trim().split(/\s+/).filter(x => x.length > 2); const last = (w[w.length - 1] || '').replace(/(es|s)$/, '').replace(/ie$/, 'y'); return { n: i.n, key: last === 'berry' ? (w[0] || '').replace(/(es|s)$/, '') : last }; }).filter(x => x.key.length > 2);
}
function hhGardenHit(name, words) {
  const nm = String(name || '').toLowerCase(); if (/dried|powder|flakes|black pepper|white pepper|cayenne|canned|broth|sauce|marinara|oil\b/.test(nm)) return null;
  return words.find(w => nm.includes(w.key)) || null;
}
function hhGardenRecipes() {
  const w = hhGardenWords(); if (!w.length || typeof kitAll !== 'function') return [];
  return kitAll().filter(r => r.own && !kitFit(r).hide).map(r => { const uses = Array.from(new Set(r.ings.map(g => hhGardenHit(g.name, w)).filter(Boolean).map(x => x.n))); return { r, uses }; }).filter(x => x.uses.length).sort((a, b) => b.uses.length - a.uses.length).slice(0, 8);
}
function hhHomegrown() { const m = dkey().slice(0, 7), e = S.food.filter(f => f.home && f.date.slice(0, 7) === m); return { month: m, servings: e.length, grams: Math.round(e.reduce((s, f) => s + (f.grams || 0), 0)) }; }

/* ---------- money ideas for Saturnica ---------- */
const HH_GENERIC = { lipitor: 'atorvastatin', crestor: 'rosuvastatin', zocor: 'simvastatin', synthroid: 'levothyroxine', levoxyl: 'levothyroxine', glucophage: 'metformin', zestril: 'lisinopril', prinivil: 'lisinopril', norvasc: 'amlodipine', prilosec: 'omeprazole', nexium: 'esomeprazole', protonix: 'pantoprazole', zoloft: 'sertraline', lexapro: 'escitalopram', prozac: 'fluoxetine', celexa: 'citalopram', paxil: 'paroxetine', wellbutrin: 'bupropion', effexor: 'venlafaxine', cymbalta: 'duloxetine', desyrel: 'trazodone', singulair: 'montelukast', neurontin: 'gabapentin', lyrica: 'pregabalin', cozaar: 'losartan', diovan: 'valsartan', benicar: 'olmesartan', toprol: 'metoprolol', lopressor: 'metoprolol', lasix: 'furosemide', plavix: 'clopidogrel', coumadin: 'warfarin', flomax: 'tamsulosin', ambien: 'zolpidem', xanax: 'alprazolam', klonopin: 'clonazepam', ativan: 'lorazepam', valtrex: 'valacyclovir', seroquel: 'quetiapine', abilify: 'aripiprazole', lamictal: 'lamotrigine', topamax: 'topiramate', imitrex: 'sumatriptan', mobic: 'meloxicam', zofran: 'ondansetron', keflex: 'cephalexin', cialis: 'tadalafil', viagra: 'sildenafil', zyrtec: 'cetirizine', claritin: 'loratadine', allegra: 'fexofenadine', advil: 'ibuprofen', motrin: 'ibuprofen', aleve: 'naproxen', tylenol: 'acetaminophen', flonase: 'fluticasone' };
function hhIdeas() {
  const out = [], txt = (S.settings.medText || '').toLowerCase(), seen = new Set();
  Object.keys(HH_GENERIC).forEach(b => { if (new RegExp('\\b' + b + '\\b').test(txt)) seen.add(HH_GENERIC[b]); }); // names stay in Healthica; the shared summary only says how many
  if (seen.size) out.push({ kind: 'generic', text: `${seen.size === 1 ? 'A brand-name medicine' : seen.size + ' brand-name medicines'} on your Healthica list ${seen.size === 1 ? 'has' : 'have'} a common generic version. Ask your pharmacist whether it would cost less (Healthica > Doctor reports > Medicines shows which).` });
  if (txt.trim()) out.push({ kind: 'generic', text: 'Ask your pharmacist about 90-day supplies, mail order and discount cards. Never stop or switch a medicine without your prescriber.' });
  const eq = H().equip; if (eq === 'none' || eq === 'home') out.push({ kind: 'gym', text: `Your Healthica training plan is built for ${eq === 'none' ? 'no equipment' : 'home with dumbbells'}, so a gym membership is optional.` });
  const sup = S.trackers.filter(t => t.type === 'supp').length; if (sup >= 4) out.push({ kind: 'supp', text: `You track ${sup} supplements in Healthica. Ask your pharmacist which ones overlap or are no longer needed.` });
  return out.slice(0, 8);
}

/* ---------- publish ---------- */
function hhWeek() {
  const plan = (S.kitchen && S.kitchen.plan) || []; let list = plan.map(p => ({ r: kitById(p.id), m: p.m || 1 })).filter(x => x.r);
  if (!list.length && typeof kitWeek === 'function') { const w = kitWeek(); list = ['B', 'L', 'D', 'S'].reduce((a, k) => a.concat(w[k].map(r => ({ r, m: 1 }))), []); }
  let cost = 0, full = 0, meals = 0; const items = list.map(x => { const c = hhRecipeCost(x.r) * x.m, f = hhRecipeCost(x.r, true) * x.m; cost += c; full += f; meals += (x.r.serv || 1) * x.m; return { name: x.r.name, cost: Math.round(c * 100) / 100, garden: f - c > 0.01 }; });
  return { cost: Math.round(cost), meals, gardenSaved: Math.round((full - cost) * 100) / 100, planned: !!plan.length, list: items.slice(0, 20) };
}
function hhEvents() {
  const out = [], lim = addDays(dkey(), 60), today = dkey();
  const people = typeof profList === 'function' ? profList() : [{ id: 'main' }];
  people.forEach(p => { const d = typeof profRead === 'function' ? profRead(p.id) : S; if (!d || !d.profile) return;
    (d.appts || []).filter(a => !a.done && a.date >= today && a.date <= lim).forEach(a => out.push({ t: 'Health appointment', d: a.date, time: a.time, kind: 'appt', who: people.length > 1 ? (d.profile.name || p.name) : undefined }));
  });
  return out.slice(0, 40);
}
function hhPublish() {
  if (!window.OCC || !S.profile) return;
  try {
    const people = typeof profList === 'function' ? profList().map(p => p.name) : [S.profile.name];
    OCC.publish('healthica', { people: people.filter(Boolean), week: hhWeek(), gardenRecipes: hhGardenRecipes().map(x => ({ n: x.r.name, uses: x.uses })), healthIdeas: hhIdeas(), homegrown: hhHomegrown(), events: hhEvents() });
  } catch (e) { }
}
let hhT = null; const hhSoon = () => { clearTimeout(hhT); hhT = setTimeout(hhPublish, 1000); };
(function () { const s0 = save; save = function () { s0(); hhSoon(); }; })();

/* ---------- UI: Today, Kitchen, food logging ---------- */
function hhTodayCard() {
  const g = hhGarden(), sat = window.OCC && OCC.get('saturnica'); if (!g && !sat) return '';
  const recs = hhGardenRecipes(), wk = hhWeek(), bud = sat && sat.data.groceryWeek;
  const ripe = g ? g.items.filter(i => i.ripe || i.picked).map(i => i.n) : [];
  return `<section class="card"><div class="ct"><span>🏡 Household</span><a class="lnk" data-act="occOpen">Link</a></div>
    ${ripe.length ? `<div class="sm">🌿 From the garden: <b>${esc(ripe.slice(0, 5).join(', '))}</b>${recs.length ? ` · ${recs.length} recipe${recs.length > 1 ? 's' : ''} use them` : ''}</div>` : ''}
    ${bud ? `<div class="sm">🪐 Meals this week about <b>$${wk.cost}</b> vs grocery budget <b>$${Math.round(bud)}</b>: ${wk.cost <= bud ? '<span class="gold">fits</span>' : '<span class="warn">over by $' + Math.round(wk.cost - bud) + '</span>'}</div>` : ''}
    ${recs.length || ripe.length ? '<button class="btn block" data-act="kitOpenHome">Cook from the garden</button>' : ''}</section>`;
}
(function () {
  if (typeof kitMenu === 'function') {
    const m0 = kitMenu; kitMenu = function () {
      const recs = hhGardenRecipes(), g = hhGarden(), wk = hhWeek(), sat = window.OCC && OCC.get('saturnica'), bud = sat && sat.data.groceryWeek, adj = hhAdj();
      const top = `${g && g.items.length ? `<div class="ct"><span>🌿 From your garden</span><span class="sm dim">Hortica, ${OCC.ago(g.ts)}</span></div><div class="sm dim">${esc(g.items.map(i => i.n + (i.picked ? ' (' + Math.round(i.picked * 10) / 10 + ' ' + (i.u || '') + ' picked)' : ' (ripe)')).slice(0, 8).join(', '))}</div>${recs.length ? recs.slice(0, 5).map(x => kitRow(x.r).replace('</b>', '</b> <span class="sm" style="color:var(--green)">uses ' + esc(x.uses.join(', ').toLowerCase()) + '</span>')).join('') : '<div class="sm dim">No recipes here use those yet. Try Recipes > search.</div>'}` : ''}
        <div class="card inner"><div class="sm">${wk.planned ? 'Your shopping list' : 'This week\'s picks'}: about <b>$${wk.cost}</b> for ${wk.meals} servings (about ${money(wk.cost / Math.max(1, wk.meals))} each)${wk.gardenSaved > 0.5 ? `, <span style="color:var(--green)">${money(wk.gardenSaved)} saved from the garden</span>` : ''}.${bud ? ` Saturnica grocery budget: $${Math.round(bud)} a week.` : ''}</div>
        <div class="sm dim">Rough US prices. Your stores: <span class="chips c" style="display:inline-flex">${[[0.8, 'cheaper'], [1, 'average'], [1.25, 'pricier'], [1.5, 'much pricier']].map(a => `<button type="button" class="chip${Math.abs(adj - a[0]) < .01 ? ' on' : ''}" data-act="hhAdj" data-v="${a[0]}">${a[1]}</button>`).join('')}</span></div></div>`;
      return top + m0();
    };
  }
  if (typeof kitRow === 'function') { const r0 = kitRow; kitRow = function (r) { const h = r0(r), c = hhRecipeCost(r); return c > 0 ? h.replace('<div class="sm dim">', () => '<div class="sm dim">~' + money(c) + ' · ') : h; }; }
  if (typeof kitListView === 'function') {
    const l0 = kitListView; kitListView = function () {
      l0(); const w = hhGardenWords(), body = $('#sheet .sh-body'); if (!body || !(S.kitchen.plan || []).length) return; const wk = hhWeek();
      if (w.length) $$('#sheet label.entry span span').forEach(sp => { if (hhGardenHit(sp.textContent, w)) sp.insertAdjacentHTML('beforeend', ' <span style="color:var(--green)">🌱 from your garden</span>'); });
      body.insertAdjacentHTML('afterbegin', `<div class="card inner"><div class="sm">Estimated cost: <b>$${wk.cost}</b>${wk.gardenSaved > 0.5 ? ` · <span style="color:var(--green)">${money(wk.gardenSaved)} covered by your garden</span>` : ''}</div></div>`);
    };
  }
  if (typeof openAmount === 'function') {
    const a0 = openAmount; openAmount = function (food) {
      a0(food); if (!/veg|fruit|other/.test(food.cat || '')) return; const w = hhGardenWords(), hit = w.length && hhGardenHit(food.name, w);
      const b = $('#sheet [data-act="saveFood"]'); if (b) b.closest('.row').insertAdjacentHTML('beforebegin', `<label class="fl" style="margin:8px 0"><input type="checkbox" id="hhgrew" ${hit ? 'checked' : ''}> 🌱 I grew this${hit ? ' (Hortica says it is in season)' : ''}</label>`);
    };
  }
  const f0 = ACT.saveFood; ACT.saveFood = function (el, e) { const grew = $('#hhgrew') && $('#hhgrew').checked, n = S.food.length; f0(el, e); if (grew && S.food.length > n) { S.food[S.food.length - 1].home = true; save(); } };
})();
Object.assign(ACT, {
  hhAdj(el) { S.kitchen.priceAdj = +el.dataset.v; save(); kitRender(); },
  kitOpenHome() { openKitchen(); }
});
if (window.OCC) OCC.bind(ACT, 'healthica', w => { if (w === 'publish') hhPublish(); else { hhPublish(); render(); } });
window.addEventListener('DOMContentLoaded', () => setTimeout(hhPublish, 1500));
