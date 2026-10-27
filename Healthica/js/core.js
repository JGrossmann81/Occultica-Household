/* Healthica core: calculations (no DOM). Everything here is pure so it can be tested in Node. */
const KG_PER_LB = 0.45359237;
const lb2kg = v => v * KG_PER_LB, kg2lb = v => v / KG_PER_LB;
const pad2 = n => String(n).padStart(2, '0');
function dkey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); }
function daysBetween(a, b) { return Math.round((parseKey(b) - parseKey(a)) / 864e5); }
const round = (v, n = 0) => { const f = Math.pow(10, n); return Math.round(v * f) / f; };

/* ---------- energy ---------- */
function bmr(p) { // Mifflin-St Jeor
  const kg = p.weightKg;
  return 10 * kg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161);
}
const BASE_ACT = { 1.2: 'Mostly sitting', 1.3: 'Light movement (on feet some)', 1.4: 'On my feet most of the day' };
function baseKcal(p) { return bmr(p) * (p.baseAct || 1.2); }
const RATES = { slow: 250, normal: 500, fast: 750, fast2: 1000 };
function goalBudget(p) {
  const base = baseKcal(p); let adj = 0;
  if (p.goal === 'lose') adj = -(RATES[p.rate] || 500);
  if (p.goal === 'gain') adj = (p.rate === 'fast' ? 400 : 250);
  const floor = p.sex === 'm' ? 1500 : 1200;
  let budget = base + adj, floored = false;
  if (budget < floor) { budget = floor; floored = true; }
  return { base: round(base), budget: round(budget), adj: round(budget - base), floored, floor };
}
function macroTargets(p, budget) {
  const kg = p.weightKg;
  let pg = kg * (p.goal === 'maintain' ? 1.5 : (p.rate === 'fast2' ? 2.0 : 1.8));
  pg = Math.min(pg, budget * 0.35 / 4); pg = Math.max(pg, kg * 1.2);
  const fat = budget * 0.27 / 9;
  const carb = Math.max(0, (budget - pg * 4 - fat * 9) / 4);
  const fib = Math.max(25, round(14 * budget / 1000));
  return { p: round(pg), f: round(fat), c: round(carb), fib, veg: 400 };
}
/* MET values (Compendium of Physical Activities, rounded). Net kcal = (MET-1) x kg x hours so the
   resting part is not counted twice with the daily base. */
const CARDIO = [
  ['Walking, easy', 3.5], ['Walking, brisk', 4.5], ['Hiking', 6], ['Jogging', 7], ['Running', 9.8], ['Cycling, easy', 5.8],
  ['Cycling, hard', 8], ['Swimming', 6], ['Elliptical', 5], ['Rowing', 7], ['Stair climber', 8.8], ['HIIT / circuit', 8],
  ['Dance', 5], ['Jump rope', 11], ['Yoga', 2.5], ['Pilates', 3], ['Stretching / mobility', 2.3], ['Sport / other', 5]
];
const STRENGTH_MET = { light: 3, moderate: 4.5, hard: 6 };
function exerciseKcal(met, kg, minutes) { return Math.max(0, Math.round((met - 1) * kg * minutes / 60)); }

/* ---------- vitamins & minerals ---------- */
const NUTS = {
  vitA: ['Vitamin A', 'mcg'], vitC: ['Vitamin C', 'mg'], vitD: ['Vitamin D', 'mcg'], vitE: ['Vitamin E', 'mg'], vitK: ['Vitamin K', 'mcg'],
  b12: ['Vitamin B12', 'mcg'], folate: ['Folate', 'mcg'], iron: ['Iron', 'mg'], calcium: ['Calcium', 'mg'],
  magnesium: ['Magnesium', 'mg'], potassium: ['Potassium', 'mg'], zinc: ['Zinc', 'mg']
};
function rdaFor(p) { // adult reference intakes (NIH Office of Dietary Supplements, rounded)
  const m = p.sex === 'm', a = p.age || 30;
  return {
    vitA: m ? 900 : 700, vitC: m ? 90 : 75, vitD: a > 70 ? 20 : 15, vitE: 15, vitK: m ? 120 : 90, b12: 2.4, folate: 400,
    iron: m ? 8 : (a > 50 ? 8 : 18), calcium: (!m && a > 50) || (m && a > 70) ? 1200 : 1000,
    magnesium: m ? (a > 30 ? 420 : 400) : (a > 30 ? 320 : 310), potassium: m ? 3400 : 2600, zinc: m ? 11 : 8
  };
}
const NUT_TIPS = {
  vitA: 'Carrots, sweet potato, spinach, eggs and (occasionally) liver are rich in vitamin A.',
  vitC: 'Bell peppers, strawberries, oranges, broccoli and kiwi are vitamin C powerhouses.',
  vitD: 'Fatty fish (salmon, sardines, mackerel) and eggs help. Sunlight matters too. A supplement is common for vitamin D; ask your doctor, ideally after a blood test.',
  vitE: 'Almonds, sunflower seeds, spinach and olive oil are good vitamin E sources.',
  vitK: 'Leafy greens (kale, spinach, romaine), broccoli and Brussels sprouts are packed with vitamin K.',
  b12: 'B12 lives in animal foods: beef, fish, eggs, dairy. If you eat little of those, talk to your doctor about a supplement.',
  folate: 'Lentils, beans, spinach, asparagus and broccoli are rich in folate.',
  iron: 'Red meat, liver, shellfish, lentils and spinach (with vitamin C) are good iron sources. Check with your doctor before taking iron supplements.',
  calcium: 'Yogurt, milk, cheese, sardines, tofu with calcium and leafy greens supply calcium.',
  magnesium: 'Pumpkin seeds, almonds, cashews, spinach, beans and dark chocolate are rich in magnesium.',
  potassium: 'Potatoes, bananas, beans, avocado, spinach and salmon are high in potassium.',
  zinc: 'Beef, pumpkin seeds, cashews, chickpeas, shrimp and dairy are good zinc sources.'
};
function topFoodsFor(foods, key, rda, n = 4) {
  return foods.filter(f => ['meat', 'fish', 'dairy', 'veg', 'fruit', 'legume', 'nut', 'carb'].includes(f.cat) && f.name.indexOf('Liver') < 0)
    .map(f => ({ f, pct: (f.n[key] || 0) * f.servG / 100 / rda[key] * 100 }))
    .sort((a, b) => b.pct - a.pct).slice(0, n).map(x => ({ name: x.f.name, serv: x.f.servLabel, pct: Math.round(x.pct) }));
}
/* average intake per nutrient over days that look like real logging days */
function nutrientAverages(entriesByDay, budget) {
  const days = Object.keys(entriesByDay).filter(d => {
    const kc = entriesByDay[d].reduce((s, e) => s + (e.kcal || 0), 0);
    return kc >= Math.max(600, budget * 0.4);
  });
  if (!days.length) return { days: 0, avg: {} };
  const tot = {}; NUT_KEYS.forEach(k => tot[k] = 0);
  days.forEach(d => entriesByDay[d].forEach(e => { if (e.n) NUT_KEYS.forEach(k => tot[k] += (e.n[k] || 0)); }));
  const avg = {}; NUT_KEYS.forEach(k => avg[k] = tot[k] / days.length);
  return { days: days.length, avg };
}

/* ---------- planetary days & hours ---------- */
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sunday..Saturday
const DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PLANET_THEME = {
  Sun: ['Vitality', 'Step into daylight, a brisk walk, a protein-forward plate.'],
  Moon: ['Rest and water', 'Hydrate, wind down, gentle stretching, early sleep.'],
  Mars: ['Strength', 'A good hour to train. Lift something and earn your meal.'],
  Mercury: ['Mind and measure', 'Plan your meals, log your food, check your numbers.'],
  Jupiter: ['Abundance', 'Cook something nourishing with plenty of vegetables.'],
  Venus: ['Care', 'Self-care, a mindful meal, enjoy your food slowly.'],
  Saturn: ['Discipline', 'Steady cardio, mobility work, or a quiet meditation.']
};
function sunEvent(date, lat, lon, rise) { // Almanac for Computers algorithm, refined with a second pass; returns Date or null
  const R = Math.PI / 180, y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();
  const N1 = Math.floor(275 * mo / 9), N2 = Math.floor((mo + 9) / 12), N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
  const N = N1 - N2 * N3 + d - 30, lh = lon / 15;
  let hourGuess = rise ? 6 : 18, UT = 0;
  for (let pass = 0; pass < 3; pass++) {
    const t = N + (hourGuess - lh) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin(M * R) + 0.02 * Math.sin(2 * M * R) + 282.634; L = ((L % 360) + 360) % 360;
    let RA = Math.atan(0.91764 * Math.tan(L * R)) / R; RA = ((RA % 360) + 360) % 360;
    RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90; RA /= 15;
    const sinD = 0.39782 * Math.sin(L * R), cosD = Math.cos(Math.asin(sinD));
    const cosH = (Math.cos(90.833 * R) - sinD * Math.sin(lat * R)) / (cosD * Math.cos(lat * R));
    if (cosH > 1 || cosH < -1) return null;
    let H = rise ? 360 - Math.acos(cosH) / R : Math.acos(cosH) / R; H /= 15;
    const T = H + RA - 0.06571 * t - 6.622; UT = ((T - lh) % 24 + 24) % 24;
    hourGuess = (UT + lh + 24) % 24;
  }
  let ms = Date.UTC(y, mo - 1, d) + UT * 36e5;
  const noon = new Date(y, mo - 1, d, 12).getTime();
  while (ms - noon > 12 * 36e5) ms -= 864e5;
  while (noon - ms > 12 * 36e5) ms += 864e5;
  return new Date(ms);
}
function sunTimes(date, lat, lon) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  let sr = sunEvent(d, lat, lon, true), ss = sunEvent(d, lat, lon, false);
  if (!sr || !ss) { sr = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6); ss = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18); }
  return { sunrise: sr, sunset: ss };
}
function planetaryNow(now, lat, lon) {
  now = now || new Date();
  const day = (off) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off, 12); return d; };
  const T0 = sunTimes(day(0), lat, lon), Tm = sunTimes(day(-1), lat, lon), Tp = sunTimes(day(1), lat, lon);
  let start, end, hourIdx, dayDate;
  if (now < T0.sunrise) { start = Tm.sunset; end = T0.sunrise; dayDate = day(-1); const len = (end - start) / 12; hourIdx = 12 + Math.min(11, Math.floor((now - start) / len)); }
  else if (now < T0.sunset) { start = T0.sunrise; end = T0.sunset; dayDate = day(0); const len = (end - start) / 12; hourIdx = Math.min(11, Math.floor((now - start) / len)); }
  else { start = T0.sunset; end = Tp.sunrise; dayDate = day(0); const len = (end - start) / 12; hourIdx = 12 + Math.min(11, Math.floor((now - start) / len)); }
  const dayRuler = DAY_RULER[dayDate.getDay()], len = (end - start) / 12;
  const hs = start.getTime() + (hourIdx % 12) * len;
  const hourRuler = CHALDEAN[(CHALDEAN.indexOf(dayRuler) + hourIdx) % 7];
  const nextRuler = CHALDEAN[(CHALDEAN.indexOf(dayRuler) + hourIdx + 1) % 7];
  return {
    dayName: DAYNAMES[dayDate.getDay()], dayRuler, hourRuler, nextRuler, isDay: hourIdx < 12, hourNumber: (hourIdx % 12) + 1,
    from: new Date(hs), until: new Date(hs + len), sunrise: T0.sunrise, sunset: T0.sunset
  };
}

/* ---------- weight trend ---------- */
function weightTrend(weights) { // weights: [{date, kg}] sorted by date; returns exponentially smoothed series
  const out = []; let t = null;
  weights.forEach(w => { t = t === null ? w.kg : t + 0.25 * (w.kg - t); out.push({ date: w.date, kg: w.kg, trend: t }); });
  return out;
}
function weeklyRate(series) { // kg per week from regression of trend over the last 14 days
  if (series.length < 4) return null;
  const last = series[series.length - 1].date; const pts = series.filter(s => daysBetween(s.date, last) <= 14);
  if (pts.length < 4) return null;
  const x0 = parseKey(pts[0].date), xs = pts.map(p => (parseKey(p.date) - x0) / 864e5), ys = pts.map(p => p.trend);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) * (x - mx); });
  if (den === 0) return null; return num / den * 7;
}

/* ---------- muscles & exercises ---------- */
const MUSCLES = {
  chest: 'Chest', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', traps: 'Traps',
  lats: 'Back (lats)', lowback: 'Lower back', abs: 'Abs', obliques: 'Obliques', glutes: 'Glutes', quads: 'Quads',
  hamstrings: 'Hamstrings', calves: 'Calves'
};
const SPLITS = {
  legs: ['Leg day', ['quads', 'hamstrings', 'glutes', 'calves']],
  arms: ['Arm day', ['biceps', 'triceps', 'forearms', 'shoulders']],
  back: ['Back day', ['lats', 'traps', 'lowback', 'biceps']],
  chest: ['Chest and shoulders day', ['chest', 'shoulders', 'triceps']],
  core: ['Core day', ['abs', 'obliques', 'lowback']],
  cardio: ['Cardio day', []], active: ['Active recovery (walk, stretch)', []], rest: ['Rest day', []], full: ['Full body day', ['quads', 'chest', 'lats', 'shoulders', 'abs']]
};
// [name, split, primary, secondary]
const EXERCISES = [
  ['Back squat', 'legs', 'quads glutes', 'hamstrings lowback abs'], ['Front squat', 'legs', 'quads', 'glutes abs'], ['Goblet squat', 'legs', 'quads glutes', 'abs'],
  ['Leg press', 'legs', 'quads glutes', 'hamstrings'], ['Walking lunges', 'legs', 'quads glutes', 'hamstrings'], ['Bulgarian split squat', 'legs', 'quads glutes', 'hamstrings'],
  ['Romanian deadlift', 'legs', 'hamstrings glutes', 'lowback'], ['Deadlift', 'legs', 'hamstrings glutes lowback', 'quads traps forearms lats'], ['Hip thrust', 'legs', 'glutes', 'hamstrings'],
  ['Glute bridge', 'legs', 'glutes', 'hamstrings'], ['Leg extension', 'legs', 'quads', ''], ['Leg curl', 'legs', 'hamstrings', 'calves'], ['Step-ups', 'legs', 'quads glutes', 'calves'],
  ['Standing calf raise', 'legs', 'calves', ''], ['Seated calf raise', 'legs', 'calves', ''], ['Kettlebell swing', 'legs', 'glutes hamstrings', 'lowback shoulders'], ['Wall sit', 'legs', 'quads', 'glutes'],
  ['Bench press', 'chest', 'chest', 'shoulders triceps'], ['Incline dumbbell press', 'chest', 'chest shoulders', 'triceps'], ['Push-ups', 'chest', 'chest', 'shoulders triceps abs'],
  ['Dumbbell fly', 'chest', 'chest', 'shoulders'], ['Cable crossover', 'chest', 'chest', 'shoulders'], ['Overhead press', 'chest', 'shoulders', 'triceps traps'],
  ['Lateral raise', 'chest', 'shoulders', ''], ['Front raise', 'chest', 'shoulders', 'chest'], ['Rear delt fly', 'chest', 'shoulders', 'traps'], ['Arnold press', 'chest', 'shoulders', 'triceps'],
  ['Dips', 'chest', 'chest triceps', 'shoulders'], ['Triceps pushdown', 'arms', 'triceps', ''], ['Overhead triceps extension', 'arms', 'triceps', ''], ['Skull crushers', 'arms', 'triceps', ''],
  ['Close-grip bench press', 'arms', 'triceps', 'chest shoulders'], ['Barbell curl', 'arms', 'biceps', 'forearms'], ['Dumbbell curl', 'arms', 'biceps', 'forearms'],
  ['Hammer curl', 'arms', 'biceps forearms', ''], ['Preacher curl', 'arms', 'biceps', ''], ['Wrist curl', 'arms', 'forearms', ''],
  ['Pull-ups', 'back', 'lats', 'biceps forearms traps'], ['Lat pulldown', 'back', 'lats', 'biceps'], ['Bent-over row', 'back', 'lats traps', 'biceps lowback'],
  ['Seated cable row', 'back', 'lats traps', 'biceps'], ['One-arm dumbbell row', 'back', 'lats', 'biceps traps'], ['T-bar row', 'back', 'lats traps', 'biceps lowback'],
  ['Face pull', 'back', 'shoulders traps', ''], ['Shrugs', 'back', 'traps', 'forearms'], ['Back extension', 'back', 'lowback', 'glutes hamstrings'], ['Superman', 'back', 'lowback', 'glutes'],
  ['Plank', 'core', 'abs', 'obliques lowback shoulders'], ['Crunch', 'core', 'abs', ''], ['Hanging leg raise', 'core', 'abs', 'forearms'], ['Russian twist', 'core', 'obliques', 'abs'],
  ['Side plank', 'core', 'obliques', 'abs'], ['Bicycle crunch', 'core', 'abs obliques', ''], ['Dead bug', 'core', 'abs', ''], ['Cable woodchop', 'core', 'obliques', 'abs'],
  ['Ab wheel rollout', 'core', 'abs', 'lats shoulders'], ['Mountain climbers', 'core', 'abs', 'shoulders quads']
].map(e => ({ name: e[0], split: e[1], prim: e[2].split(' ').filter(Boolean), sec: e[3].split(' ').filter(Boolean) }));
function muscleLoad(workouts, sinceKey) {
  // returns { muscle: {sets, last} } using sets (primary=1, secondary=0.5). Quick-logged sessions carry muscles + sets directly.
  const out = {}; Object.keys(MUSCLES).forEach(m => out[m] = { sets: 0, last: null });
  workouts.filter(w => w.date >= sinceKey && w.kind === 'strength').forEach(w => {
    (w.items || []).forEach(it => {
      const n = it.sets ? it.sets.length : 0;
      (it.prim || []).forEach(m => { if (out[m]) { out[m].sets += n; if (!out[m].last || w.ts > out[m].last) out[m].last = w.ts; } });
      (it.sec || []).forEach(m => { if (out[m]) { out[m].sets += n * 0.5; if (!out[m].last || w.ts > out[m].last) out[m].last = w.ts; } });
    });
  });
  return out;
}
function lastTrained(workouts) { // muscle -> latest ts
  const out = {};
  workouts.filter(w => w.kind === 'strength').forEach(w => (w.items || []).forEach(it => (it.prim || []).concat(it.sec || []).forEach(m => { if (!out[m] || w.ts > out[m]) out[m] = w.ts; })));
  return out;
}
if (typeof module !== 'undefined') module.exports = { lb2kg, kg2lb, dkey, parseKey, addDays, daysBetween, bmr, baseKcal, goalBudget, macroTargets, exerciseKcal, rdaFor, topFoodsFor, nutrientAverages, planetaryNow, sunTimes, weightTrend, weeklyRate, muscleLoad, lastTrained, EXERCISES, MUSCLES, SPLITS, CARDIO, STRENGTH_MET, NUTS };
