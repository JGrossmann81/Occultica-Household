/* Healthica base: storage, helpers, derived numbers, online food lookup. */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let KEY = (() => { try { const a = localStorage.getItem('healthica.active'); return a && a !== 'main' ? 'healthica.v1.p.' + a : 'healthica.v1'; } catch (e) { return 'healthica.v1'; } })(); // caregiver mode: one key per person
const DEFAULT_SCHEDULE = { 0: 'rest', 1: 'legs', 2: 'arms', 3: 'back', 4: 'core', 5: 'cardio', 6: 'active' };
let S = null;
function blank() {
  return {
    v: 1, profile: null, food: [], myfoods: [], weights: [], workouts: [], trackers: [], myex: [], symptoms: [], changes: [], appts: [], kitchen: { fat: 'avo', plan: [], saved: [], liked: {}, have: {}, shuf: 0, ideas: null }, logs: [], reminders: [], water: {}, mind: [],
    settings: { loc: null, usdaKey: '', schedule: Object.assign({}, DEFAULT_SCHEDULE), lastFired: {}, installed: false, vegan: false, injAdj: {} }
  };
}
function load() {
  try { const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : blank(); } catch (e) { S = blank(); }
  const b = blank(); Object.keys(b).forEach(k => { if (S[k] === undefined) S[k] = b[k]; });
  Object.keys(b.settings).forEach(k => { if (S.settings[k] === undefined) S.settings[k] = b.settings[k]; });
}
let saveT = null;
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save (storage full?)'); } }
function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 150); }

/* ---------- units ---------- */
const U = () => (S.profile && S.profile.units) || 'lb';
const showW = kg => U() === 'lb' ? round(kg2lb(kg), 1) : round(kg, 1);
const toKg = v => U() === 'lb' ? lb2kg(v) : v;
const wUnit = () => U() === 'lb' ? 'lb' : 'kg';

/* ---------- derived ---------- */
function latestWeightKg() { const w = S.weights.slice().sort((a, b) => a.date < b.date ? -1 : 1); return w.length ? w[w.length - 1].kg : (S.profile ? S.profile.weightKg : 65); }
function prof() { return Object.assign({}, S.profile, { weightKg: latestWeightKg() }); }
function budgetInfo() { const p = prof(); const g = goalBudget(p); g.macros = macroTargets(p, g.budget); if (typeof guard === 'function') { const gr = guard(); if (gr.proteinCap) g.macros.p = Math.min(g.macros.p, Math.round(gr.proteinCap * p.weightKg)); } return g; }
const foodsOn = d => S.food.filter(e => e.date === d);
function totalsOn(d) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, veg: 0, meat: 0, n: {} }; NUT_KEYS.forEach(k => t.n[k] = 0);
  foodsOn(d).forEach(e => {
    t.kcal += e.kcal || 0; t.p += e.p || 0; t.c += e.c || 0; t.f += e.f || 0; t.fib += e.fib || 0;
    if (e.cat === 'veg') t.veg += e.grams || 0;
    if (e.cat === 'meat' || e.cat === 'fish') t.meat += e.grams || 0;
    if (e.n) NUT_KEYS.forEach(k => t.n[k] += e.n[k] || 0);
  });
  return t;
}
const workoutsOn = d => S.workouts.filter(w => w.date === d);
const burnedOn = d => workoutsOn(d).reduce((s, w) => s + (w.kcal || 0), 0);
const waterOn = d => S.water[d] || 0;
const mindOn = d => S.mind.filter(m => m.date === d).reduce((s, m) => s + m.min, 0);
function streak() { // consecutive days (ending today or yesterday) with at least one food entry
  const days = new Set(S.food.map(e => e.date)); let k = dkey(), n = 0;
  if (!days.has(k)) k = addDays(k, -1);
  while (days.has(k)) { n++; k = addDays(k, -1); }
  return n;
}
function sortedWeights() { return S.weights.slice().sort((a, b) => a.date < b.date ? -1 : 1); }
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago'; const d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
}
function fmtTime(d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function hhmm(t) { const [h, m] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m); return fmtTime(d); }

/* ---------- foods ---------- */
const allFoods = () => FOODS.concat(S.myfoods);
function findFood(id) { return allFoods().find(f => f.id === id); }
function entryFrom(food, grams, meal, date, label) {
  const k = grams / (food.per || 100), n = {};
  NUT_KEYS.forEach(x => n[x] = round((food.n && food.n[x] || 0) * k, 2));
  return {
    id: uid(), date, meal, name: food.name, cat: food.cat, grams: round(grams, 1), label: label || '', foodId: food.id, ts: Date.now(),
    kcal: round(food.kcal * k), p: round(food.p * k, 1), c: round(food.c * k, 1), f: round(food.f * k, 1), fib: round((food.fib || 0) * k, 1), n
  };
}
function recentFoods(n = 8) {
  const seen = new Set(), out = [];
  S.food.slice().sort((a, b) => b.ts - a.ts).forEach(e => { if (e.foodId && !seen.has(e.foodId) && findFood(e.foodId) && foodOk(findFood(e.foodId)) && out.length < n) { seen.add(e.foodId); out.push(findFood(e.foodId)); } });
  return out;
}
function searchFoods(q, cat) {
  q = q.trim().toLowerCase(); let list = allFoods().filter(foodOk);
  if (cat === 'mine') list = S.myfoods; else if (cat && cat !== 'all') list = list.filter(f => f.cat === cat);
  if (!q) return list.slice(0, 60);
  const words = q.split(/\s+/);
  return list.map(f => { const nm = f.name.toLowerCase(); let sc = 0; if (words.every(w => nm.includes(w))) sc = 10 - Math.min(9, nm.indexOf(words[0]) / 4); return { f, sc }; })
    .filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).map(x => x.f).slice(0, 60);
}
/* online lookup: USDA FoodData Central (generic foods, many vitamins) and Open Food Facts (packaged, barcodes). */
const USDA_NUM = { kcal: '208', p: '203', f: '204', c: '205', fib: '291', vitA: '320', vitC: '401', vitD: '328', vitE: '323', vitK: '430', b12: '418', folate: '435', iron: '303', calcium: '301', magnesium: '304', potassium: '306', zinc: '309' };
const USDA_ID = { kcal: 1008, p: 1003, f: 1004, c: 1005, fib: 1079, vitA: 1106, vitC: 1162, vitD: 1114, vitE: 1109, vitK: 1185, b12: 1178, folate: 1190, iron: 1089, calcium: 1087, magnesium: 1090, potassium: 1092, zinc: 1095 };
function guessCat(name) {
  const s = name.toLowerCase();
  if (/chicken|beef|pork|turkey|lamb|bison|steak|sausage|bacon|ham\b/.test(s)) return 'meat';
  if (/fish|salmon|tuna|cod|shrimp|sardine|tilapia|crab|trout/.test(s)) return 'fish';
  if (/milk|cheese|yogurt|egg|butter|cream/.test(s)) return 'dairy';
  if (/broccoli|spinach|kale|lettuce|carrot|pepper|tomato|cabbage|onion|cucumber|zucchini|asparagus|bean, snap|celery|cauliflower|mushroom|vegetable/.test(s)) return 'veg';
  if (/apple|banana|berry|orange|grape|melon|mango|peach|pear|fruit/.test(s)) return 'fruit';
  if (/rice|bread|pasta|oat|potato|cereal|noodle|flour|tortilla|cracker/.test(s)) return 'carb';
  if (/protein|whey|shake|bar\b/.test(s)) return 'shake';
  return 'other';
}
function fromUSDA(f) {
  const get = k => { const nn = f.foodNutrients || []; const hit = nn.find(x => String(x.nutrientNumber) === USDA_NUM[k] || x.nutrientId === USDA_ID[k]); return hit ? (hit.value != null ? hit.value : (hit.amount || 0)) : 0; };
  const n = {}; NUT_KEYS.forEach(k => n[k] = get(k));
  const name = (f.description || 'Food').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 70);
  return { id: 'u' + f.fdcId, name, cat: guessCat(name), servG: 100, servLabel: '100 g', kcal: get('kcal'), p: get('p'), c: get('c'), f: get('f'), fib: get('fib'), n, per: 100, src: 'USDA' };
}
function fromOFF(p) {
  const nu = p.nutriments || {}; const g = k => +nu[k] || 0;
  const mg = k => (+nu[k] || 0) * 1000; // OFF stores minerals/vitamins in g per 100 g
  const name = ((p.brands ? p.brands.split(',')[0] + ' ' : '') + (p.product_name || 'Packaged food')).trim().slice(0, 70);
  let kcal = g('energy-kcal_100g'); if (!kcal && nu['energy_100g']) kcal = nu['energy_100g'] / 4.184;
  const n = { vitA: (+nu['vitamin-a_100g'] || 0) * 1e6, vitC: mg('vitamin-c_100g'), vitD: (+nu['vitamin-d_100g'] || 0) * 1e6, vitE: mg('vitamin-e_100g'), vitK: (+nu['vitamin-k_100g'] || 0) * 1e6, b12: (+nu['vitamin-b12_100g'] || 0) * 1e6, folate: (+nu['vitamin-b9_100g'] || 0) * 1e6, iron: mg('iron_100g'), calcium: mg('calcium_100g'), magnesium: mg('magnesium_100g'), potassium: mg('potassium_100g'), zinc: mg('zinc_100g') };
  const sg = +p.serving_quantity || 100;
  return { id: 'o' + (p.code || uid()), name, cat: guessCat(name), servG: sg, servLabel: p.serving_size || (sg + ' g'), kcal: round(kcal), p: g('proteins_100g'), c: g('carbohydrates_100g'), f: g('fat_100g'), fib: g('fiber_100g'), n, per: 100, src: 'Open Food Facts' };
}
async function searchOnline(q) {
  const out = [], errs = [];
  const to = ms => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
  try {
    const key = S.settings.usdaKey || 'DEMO_KEY';
    const r = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search?query=' + encodeURIComponent(q) + '&pageSize=8&dataType=Foundation,SR%20Legacy&api_key=' + key, { signal: to(9000) });
    if (!r.ok) throw new Error('USDA ' + r.status);
    const j = await r.json(); (j.foods || []).forEach(f => { const x = fromUSDA(f); if (x.kcal > 0 || x.p > 0) out.push(x); });
  } catch (e) { errs.push('USDA'); }
  try {
    const r = await fetch('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&search_simple=1&action=process&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size,serving_quantity,code', { signal: to(9000) });
    if (!r.ok) throw new Error('OFF ' + r.status);
    const j = await r.json(); (j.products || []).forEach(p => { if (p.product_name) { const x = fromOFF(p); if (x.kcal > 0) out.push(x); } });
  } catch (e) { errs.push('Open Food Facts'); }
  return { out, errs };
}
async function lookupBarcode(code) {
  const r = await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,code', { signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined });
  const j = await r.json(); if (j.status !== 1 || !j.product) throw new Error('not found'); return fromOFF(j.product);
}

/* ---------- words of encouragement ---------- */
const CHEER = [
  'Small, steady steps carry you a long way.', 'You do not have to be perfect. You just have to keep showing up.',
  'Every logged meal is a vote for the person you are becoming.', 'Strong is built in ordinary days like this one.',
  'Be proud of the effort, not only the number.', 'Your body is working for you all day. Give it good fuel.',
  'Progress is rarely a straight line. Trust the trend.', 'Rest is part of training. Honour it.',
  'One good choice at a time is plenty.', 'You are allowed to enjoy this journey.', 'Kind to yourself, firm with your habits.',
  'The hardest rep is starting. You already did.', 'Treat your body like someone you love.', 'Consistency is quiet magic.'
];
function cheerOfDay() { const d = parseKey(dkey()); return CHEER[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % CHEER.length]; }
