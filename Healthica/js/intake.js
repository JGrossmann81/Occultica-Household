/* Healthica intake: the full first-run questionnaire (basics, health conditions, injuries, medicines, diet and allergies,
   training setup, lifestyle, goal) and the guardrails and tailoring that come from it. General wellness only. */
const CONDS = [['htn', 'High blood pressure'], ['heart', 'Heart disease, heart attack or stroke'], ['arrhythmia', 'Irregular heartbeat'], ['t2d', 'Type 2 diabetes'], ['t1d', 'Type 1 diabetes'], ['prediab', 'Prediabetes or insulin resistance'], ['chol', 'High cholesterol'], ['thyroid', 'Thyroid condition'], ['kidney', 'Kidney disease'], ['liver', 'Liver disease'], ['gall', 'Gallbladder disease'], ['panc', 'Pancreatitis'], ['mtc', 'Thyroid C-cell cancer (MTC) or MEN2, you or family'], ['asthma', 'Asthma or lung disease'], ['pcos', 'PCOS'], ['gerd', 'Acid reflux (GERD)'], ['ibs', 'IBS or other digestive condition'], ['celiac', 'Celiac disease'], ['anx', 'Anxiety'], ['dep', 'Depression'], ['bipolar', 'Bipolar disorder'], ['migraine', 'Migraines'], ['apnea', 'Sleep apnea'], ['osteo', 'Osteoporosis or low bone density'], ['arth', 'Arthritis'], ['gout', 'Gout'], ['anemia', 'Anemia or low iron'], ['seizure', 'Seizures'], ['cancer', 'Cancer, current or in treatment'], ['cancerh', 'Cancer, in the past']];
const FEM_CONDS = [['preg', 'Pregnant'], ['bf', 'Breastfeeding'], ['ttc', 'Trying to conceive'], ['meno', 'Perimenopause or menopause']];
const ALLERGENS = { peanut: ['Peanuts', /peanut/i], treenut: ['Tree nuts', /almond|walnut|cashew|pecan|pistachio|hazelnut|macadamia|brazil/i], dairy: ['Milk and dairy', /milk(?!.*(almond|oat|soy|coconut))|cheese|yogh?urt|whey|casein|butter(?!.*(peanut|almond|nut))|ice cream|cream|pizza|feta|mozzarella|parmesan|cheddar|cottage/i], egg: ['Eggs', /\begg|mayo/i], gluten: ['Gluten or wheat', /bread|pasta|couscous|tortilla|oats|oatmeal|seitan|beer|bagel|pizza|hamburger|cracker|wheat|barley|rye|sourdough/i], soy: ['Soy', /soy|tofu|tempeh|edamame|miso/i], shellfish: ['Shellfish', /shrimp|crab|lobster|scallop|clam|oyster|mussel/i], fish: ['Fish', /salmon|tuna|cod\b|tilapia|halibut|sardine|mackerel|anchov|fish/i], sesame: ['Sesame', /sesame|tahini|hummus/i] };
const INJ_AREAS = [['neck', 'Neck'], ['shoulder', 'Shoulder'], ['elbow', 'Elbow'], ['wrist', 'Wrist or hand'], ['upperback', 'Upper back'], ['lowback', 'Lower back'], ['hip', 'Hip'], ['knee', 'Knee'], ['ankle', 'Ankle or foot']];
const EX_RISK = [
  ['knee', /squat|lunge|leg press|leg extension|step-up|jump|box|burpee|wall sit|sled|thruster|pistol|hack|bulgarian/i],
  ['shoulder', /overhead|military|dips|handstand|pike|arnold|lateral raise|front raise|pull-up|chin|push-up|fly|snatch|clean|renegade|thruster|landmine|bench press|incline|decline|face pull/i],
  ['lowback', /deadlift|good morning|hyperext|bent-over|pendlay|rack pull|swing|clean|back squat|superman|t-bar|sit-up|v-up|russian twist|windshield|front squat/i],
  ['wrist', /push-up|plank|handstand|bear crawl|burpee|mountain|wrist curl|renegade|front squat|kettlebell|farmer|dips|barbell curl/i],
  ['elbow', /skull|dips|curl|pushdown|extension|close-grip|chin|pull-up|kickback|preacher|zottman|dead hang/i],
  ['hip', /lunge|squat|deadlift|hip thrust|bridge|abduction|kick|hydrant|lateral walk|step-up|sumo|curtsy|bulgarian/i],
  ['ankle', /jump|box|calf|rope|burpee|lunge|step-up|sled/i],
  ['neck', /shrug|handstand|face pull|overhead|pike|sit-up|crunch|bridge/i],
  ['upperback', /row|pull|shrug|deadlift|rear delt|face pull|t-bar/i]
];
const IMPACT_RX = /jump|box|burpee|rope|skip|battle|slam|sprint|run/i, FLEX_RX = /sit-up|crunch|v-up|russian|windshield|toe touch|good morning|twist/i, SUPINE_RX = /sit-up|crunch|v-up|leg raise|hollow|flutter|bicycle|heel taps|dead bug|bench press|pullover|skull|glute bridge|hip thrust|reverse crunch/i;
const ADV_RX = /pistol|handstand|nordic|turkish|clean|snatch|thruster|box jump|rack pull|good morning|ab wheel|rollout|hanging|dead hang|sled|battle|pike|renegade|trap-bar|sumo deadlift|front squat|bulgarian|hack/i;
const H = () => (S.profile && S.profile.h) || {};
const condSet = () => { const h = H(), s = new Set(h.conditions || []); if (h.edHist) s.add('edhist'); if (S.profile && S.profile.age < 18) s.add('minor'); return s; };
const condLabel = id => (CONDS.concat(FEM_CONDS).find(c => c[0] === id) || [id, id === 'edhist' ? 'History of disordered eating' : id === 'minor' ? 'Under 18' : id])[1];
function guard() {
  const h = H(), p = S.profile || {}, c = new Set(h.conditions || []), g = { noDeficit: false, noFast: false, noGain: false, why: [], notes: [], clearance: false, proteinCap: 0 };
  const no = (k, t) => { g[k] = true; g.why.push(t); };
  if (p.age && p.age < 18) { no('noDeficit', 'Under 18: growing bodies need full fuel. Please talk to a doctor before any weight-loss plan.'); g.noFast = true; }
  if (c.has('preg')) { no('noDeficit', 'Pregnancy: calorie needs are set with your care team, so Healthica holds you at maintenance.'); g.noFast = true; g.noGain = true; }
  if (c.has('cancer')) { no('noDeficit', 'During cancer treatment, nutrition needs are individual. Ask your care team before changing weight.'); g.noFast = true; }
  if (h.edHist) { no('noFast', 'Because of your eating history, the fast pace is switched off. A dietitian or therapist who knows eating disorders is a great partner.'); }
  if (c.has('bf')) { no('noFast', 'Breastfeeding: slow, steady change protects your milk supply.'); }
  if (c.has('t1d') || c.has('t2d')) { no('noFast', 'With diabetes, keep weight loss gradual and plan changes with your clinician (low blood sugar risk).'); }
  if (c.has('liver') || c.has('gall') || c.has('panc')) { no('noFast', 'Fast weight loss can aggravate liver, gallbladder and pancreas problems.'); }
  if (p.age >= 65) { no('noFast', 'After 65, protecting muscle matters most. A steady pace is safer.'); }
  if (c.has('kidney')) { g.proteinCap = 0.8; g.notes.push('Kidney disease: protein is capped at about 0.8 g per kg. Ask your kidney doctor for your exact target.'); }
  if (c.has('heart') || c.has('arrhythmia')) { g.clearance = true; g.notes.push('Heart condition: get your doctor\'s OK for the kind of exercise you plan, and stop for chest pain, dizziness or unusual breathlessness.'); }
  if (c.has('htn')) g.notes.push('High blood pressure: breathe through lifts (do not hold your breath), keep sodium moderate, and take medicines as prescribed.');
  if (c.has('t1d') || c.has('t2d')) g.notes.push('Diabetes: check sugar around workouts if you use insulin or sulfonylureas, and carry fast carbs.');
  if (c.has('osteo')) g.notes.push('Low bone density: favor loaded, low-impact work. High-impact and forward-bending moves are flagged for you.');
  if (c.has('preg')) g.notes.push('Pregnancy: avoid contact sports and lying flat on your back for long. Moves that fit are marked. Ask your care team what is right for you.');
  return g;
}
function modeAllowed(id) {
  const g = guard();
  if (id === 'lose2' && (g.noFast || g.noDeficit)) return { ok: false, why: g.why[0] || 'Not recommended for your profile.' };
  if (id === 'lose' && g.noDeficit) return { ok: false, why: g.why[0] };
  if (id === 'gain' && g.noGain) return { ok: false, why: g.why[0] };
  return { ok: true };
}
function coerceMode() { const id = modeOf(S.profile); if (!modeAllowed(id).ok) { applyMode(modeAllowed('lose').ok ? 'lose' : 'maintain'); } }
function buildSchedule(id, days) {
  const base = Object.assign({}, MODES[id].sched); const n = +days || 0; if (!n) return base;
  const train = Object.keys(base).filter(d => !['rest', 'active'].includes(base[d])), drop = ['core', 'arms', 'cardio', 'chest', 'back', 'legs', 'full'];
  while (train.length > n) { let k = null; for (const t of drop) { const i = train.findIndex(d => base[d] === t); if (i >= 0) { k = i; break; } } if (k === null) break; base[train[k]] = 'rest'; train.splice(k, 1); }
  return base;
}
/* exercise safety flags from injuries and conditions */
function exRisk(e) {
  const h = H(), inj = h.injuries || {}, out = [], c = condSet();
  EX_RISK.forEach(r => { if (inj[r[0]] && r[1].test(e.name)) out.push({ area: (INJ_AREAS.find(a => a[0] === r[0]) || [0, r[0]])[1], state: inj[r[0]] }); });
  if (c.has('osteo') && (IMPACT_RX.test(e.name) || FLEX_RX.test(e.name))) out.push({ area: 'bone density', state: 'current' });
  if (c.has('preg') && (SUPINE_RX.test(e.name) || IMPACT_RX.test(e.name))) out.push({ area: 'pregnancy', state: 'current' });
  return out;
}
const exAvoid = e => exRisk(e).some(r => r.state === 'current');
function equipOk(e) {
  const eq = H().equip || 'gym', ok = eq === 'none' ? ['bodyweight', 'band'] : eq === 'home' ? ['bodyweight', 'band', 'dumbbell', 'kettlebell', 'medicine ball'] : null;
  if (ok && !ok.includes(e.equip)) return false;
  if ((H().exp || 'beginner') === 'beginner' && ADV_RX.test(e.name)) return false; return true;
}
/* diet */
function dietOk(f) {
  const h = H(), d = h.diet || (S.settings.vegan ? 'vegan' : 'omni');
  if (d === 'vegan' && !isVegan(f)) return false;
  if ((d === 'veg' || d === 'pesc') && (f.cat === 'meat' || /jerky|bacon|gelatin/i.test(f.name))) return false;
  if (d === 'veg' && f.cat === 'fish') return false;
  const al = h.allergies || []; for (const a of al) { const A = ALLERGENS[a]; if (A && ((a === 'dairy' && f.cat === 'dairy') || (a === 'fish' && f.cat === 'fish' && !/shrimp|scallop/i.test(f.name)) || (a === 'shellfish' && /shrimp|scallop/i.test(f.name)) || (a !== 'fish' && a !== 'shellfish' && A[1].test(f.name)) )) return false; }
  return true;
}
/* ---------- wizard ---------- */
const INT_STEPS = ['Basics', 'Health', 'Injuries', 'Medicines', 'Eating', 'Training', 'Lifestyle', 'Goal'];
function intInit(edit) {
  const p = S.profile || {}, h = p.h || {}, u = p.units || 'lb', hcm = p.heightCm || 165, ft = Math.floor(hcm / 2.54 / 12), inch = Math.round(hcm / 2.54 - ft * 12);
  window.INT = { step: 1, edit: !!edit, d: {
    name: p.name || '', sex: p.sex || 'f', age: p.age || '', units: u, w: p.weightKg ? (u === 'kg' ? round(p.weightKg, 1) : round(kg2lb(p.weightKg), 1)) : '', h1: u === 'kg' ? Math.round(hcm) : ft, h2: inch, act: p.baseAct || 1.3,
    conditions: (h.conditions || []).slice(), condOther: h.condOther || '', injuries: Object.assign({}, h.injuries || {}), injNote: h.injNote || '', meds: S.settings.medText || '', peps: myPeptides ? myPeptides().map(x => x.t.name).join(', ') : '',
    diet: h.diet || (S.settings.vegan ? 'vegan' : 'omni'), allergies: (h.allergies || []).slice(), edHist: !!h.edHist, dislikes: h.dislikes || '', exp: h.exp || 'beginner', equip: h.equip || 'gym', days: h.days || 4,
    sleepH: h.sleepH || 7, stress: h.stress || 'mid', alcohol: h.alcohol || 'rare', caffeine: h.caffeine || 'some', smoker: h.smoker || 'no', mode: p.goal ? modeOf(p) : 'lose', goalNote: h.goalNote || ''
  } };
}
function intKeep(fn) { const sh = $('#sheet'), y = sh.scrollTop; fn(); sh.scrollTop = y; }
function intChips(items, cur, act, key, multi) { return `<div class="chips c">${items.map(i => `<button class="chip ${(multi ? cur.includes(i[0]) : cur === i[0]) ? 'on' : ''}" data-act="${act}" data-k="${key}" data-v="${i[0]}">${esc(i[1])}</button>`).join('')}</div>`; }
function openIntake(edit) { intInit(edit); intRender(); }
function intRender() {
  const I = window.INT, d = I.d, s = I.step, bar = `<div class="pbar"><i style="width:${Math.round(s / INT_STEPS.length * 100)}%"></i></div><div class="sm dim">Step ${s} of ${INT_STEPS.length}: ${INT_STEPS[s - 1]}</div>`;
  let b = '';
  if (s === 1) b = `<p>${I.edit ? '' : 'Healthica tailors your calories, workouts and safety checks to you. Answers stay on this phone. Skip anything you prefer not to share.'}</p>
    <label class="fl">Name<input class="in" data-f="name" value="${esc(d.name)}"></label>
    <div class="grid2"><label class="fl">Sex<select class="in" data-f="sex"><option value="f" ${d.sex === 'f' ? 'selected' : ''}>Female</option><option value="m" ${d.sex === 'm' ? 'selected' : ''}>Male</option></select></label><label class="fl">Age<input class="in" data-f="age" type="number" inputmode="numeric" value="${d.age}"></label></div>
    <div class="grid2"><label class="fl">Units<select class="in" data-f="units"><option value="lb" ${d.units === 'lb' ? 'selected' : ''}>Pounds, feet/inches</option><option value="kg" ${d.units === 'kg' ? 'selected' : ''}>Kilograms, cm</option></select></label><label class="fl">Weight<input class="in" data-f="w" type="number" inputmode="decimal" value="${d.w}"></label></div>
    <div class="grid2"><label class="fl">Height (ft / cm)<input class="in" data-f="h1" type="number" inputmode="decimal" value="${d.h1}"></label><label class="fl">Inches (if ft)<input class="in" data-f="h2" type="number" inputmode="decimal" value="${d.h2}"></label></div>
    <label class="fl">Daily life (outside workouts)<select class="in" data-f="act">${Object.keys(BASE_ACT).map(k => `<option value="${k}" ${+k === +d.act ? 'selected' : ''}>${BASE_ACT[k]}</option>`).join('')}</select></label>`;
  if (s === 2) b = `<p>Any of these? Tap all that apply. This changes calorie limits, exercise advice and medicine warnings.</p>${intChips(CONDS.concat(d.sex === 'f' ? FEM_CONDS : []), d.conditions, 'intTog', 'conditions', true)}
    <label class="fl">Anything else (optional)<input class="in" data-f="condOther" value="${esc(d.condOther)}" placeholder="e.g. lupus, endometriosis"></label>
    <label class="tog"><input type="checkbox" data-act="intEd" ${d.edHist ? 'checked' : ''}><span>I have a history of disordered eating</span><i class="sm dim">Healthica then uses gentler pacing and kinder language.</i></label>
    <p class="sm dim">None apply? Just continue.</p>`;
  if (s === 3) b = `<p>Any injuries or sore spots? Tap once for <b>hurts now</b>, twice for <b>healed, but go gradually</b>, again to clear.</p><div class="chips c">${INJ_AREAS.map(a => { const v = d.injuries[a[0]]; return `<button class="chip ${v === 'current' ? 'on' : v === 'past' ? 'half' : ''}" data-act="intInj" data-v="${a[0]}">${a[1]}${v === 'current' ? ': hurts now' : v === 'past' ? ': healed' : ''}</button>`; }).join('')}</div>
    <label class="fl">Details (optional)<input class="in" data-f="injNote" value="${esc(d.injNote)}" placeholder="e.g. torn ACL 2022, rotator cuff tendinitis"></label>
    <p class="sm dim">Exercises that stress a sore area are marked and kept out of your suggestions.</p>`;
  if (s === 4) b = `<p>List your medicines and supplements, separated by commas or new lines. Healthica uses this to warn about combinations and to explain symptoms.</p>
    <label class="fl">Medicines, vitamins, herbs<textarea class="in" rows="4" data-f="meds" placeholder="e.g. sertraline, vitamin D, magnesium, ashwagandha">${esc(d.meds)}</textarea></label>
    <label class="fl">Peptides you use (optional)<input class="in" data-f="peps" value="${esc(d.peps)}" placeholder="e.g. semaglutide, BPC-157"></label>
    <p class="sm dim">Healthica only records and flags. It never gives doses.</p>`;
  if (s === 5) b = `<p>How do you eat?</p>${intChips([['omni', 'Everything'], ['pesc', 'Pescatarian'], ['veg', 'Vegetarian'], ['vegan', 'Vegan']], d.diet, 'intOne', 'diet')}
    <div class="sm dim lab">Food allergies or intolerances</div>${intChips(Object.keys(ALLERGENS).map(k => [k, ALLERGENS[k][0]]), d.allergies, 'intTog', 'allergies', true)}
    <p class="sm dim">Matching foods are hidden from your lists. Always read labels, since hidden ingredients and cross-contact exist.</p>
    <label class="fl">Foods you dislike (optional)<input class="in" data-f="dislikes" value="${esc(d.dislikes)}" placeholder="e.g. mushrooms, liver"></label>`;
  if (s === 6) b = `<div class="sm dim lab">Training experience</div>${intChips([['beginner', 'New or returning'], ['inter', 'Some experience'], ['adv', 'Experienced']], d.exp, 'intOne', 'exp')}
    <div class="sm dim lab">Where do you train?</div>${intChips([['none', 'At home, no equipment'], ['home', 'Home with dumbbells'], ['gym', 'Gym']], d.equip, 'intOne', 'equip')}
    <div class="sm dim lab">Workout days per week</div>${intChips([[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], +d.days, 'intNum', 'days')}`;
  if (s === 7) b = `<label class="fl">Typical sleep (hours a night)<input class="in" data-f="sleepH" type="number" step="0.5" inputmode="decimal" value="${d.sleepH}"></label>
    <div class="sm dim lab">Stress lately</div>${intChips([['low', 'Low'], ['mid', 'Medium'], ['high', 'High']], d.stress, 'intOne', 'stress')}
    <div class="sm dim lab">Alcohol</div>${intChips([['none', 'None'], ['rare', 'Rarely'], ['reg', 'Several a week'], ['heavy', 'Most days']], d.alcohol, 'intOne', 'alcohol')}
    <div class="sm dim lab">Caffeine</div>${intChips([['none', 'None'], ['some', '1 to 2 a day'], ['lots', '3 or more'], ['pre', 'Pre-workout or energy drinks']], d.caffeine, 'intOne', 'caffeine')}
    <div class="sm dim lab">Smoking or vaping</div>${intChips([['no', 'No'], ['yes', 'Yes']], d.smoker, 'intOne', 'smoker')}`;
  if (s === 8) { const tmp = intTemp(); const keys = Object.keys(MODES); if (!tmp.modeOk(d.mode).ok) { d.blocked = tmp.modeOk(d.mode).why; d.mode = tmp.modeOk('lose').ok ? 'lose' : 'maintain'; } b = `<p>What would you like to focus on?</p><div class="seg four">${keys.map(k => { const ok = tmp.modeOk(k); return `<button class="${d.mode === k ? 'on' : ''} ${ok.ok ? '' : 'dis'}" data-act="intMode" data-v="${k}">${MODES[k].label}</button>`; }).join('')}</div>
    ${d.blocked ? `<div class="flag ask"><b>Your chosen pace is not available</b><div class="sm">${esc(d.blocked)}</div></div>` : ''}
    <div class="sm dim">${esc(MODES[d.mode].sum)}</div>${MODES[d.mode].tips.map(t => `<div class="sm dim">&bull; ${esc(t)}</div>`).join('')}
    ${tmp.g.why.map(w => `<div class="flag"><b>Note</b><div class="sm">${esc(w)}</div></div>`).join('')}${tmp.g.notes.map(w => `<div class="flag"><b>Tip</b><div class="sm">${esc(w)}</div></div>`).join('')}
    <label class="fl">Anything else you want Healthica to know? (optional)<input class="in" data-f="goalNote" value="${esc(d.goalNote)}"></label>
    <p class="sm dim">Healthica gives general wellness guidance and never goes under a safe calorie floor. It does not replace your doctor.</p>`; }
  openSheet(I.edit ? 'Health profile' : 'Welcome to Healthica', `${bar}<div class="int-body">${b}</div>
    <div class="row">${s > 1 ? '<button class="btn" data-act="intBack">Back</button>' : (I.edit ? '<button class="btn" data-act="closeSheet">Cancel</button>' : '')}${s < INT_STEPS.length ? `<button class="btn gold" data-act="intNext">${s === 1 || s === 8 ? 'Continue' : 'Continue'}</button>` : '<button class="btn gold" data-act="intFinish">Finish</button>'}</div>
    ${[2, 3, 4, 5, 7].includes(s) ? '<button class="mini center" data-act="intNext" style="display:block;margin:6px auto">Skip this step</button>' : ''}`);
}
function intTemp() { // evaluate guardrails against the answers so far without saving
  const d = window.INT.d, keep = S.profile, age = +d.age || 30;
  S.profile = Object.assign({}, keep || {}, { age, h: { conditions: d.conditions, edHist: d.edHist } });
  const g = guard(), res = {}; Object.keys(MODES).forEach(k => res[k] = modeAllowed(k)); S.profile = keep;
  return { g, modeOk: k => res[k] };
}
function intCommit() {
  const I = window.INT, d = I.d, u = d.units, w = +d.w, age = +d.age, h1 = +d.h1, h2 = +d.h2 || 0;
  if (!w || !age || !h1) { toast('Please fill weight, age and height.'); intRender.go = 1; return false; }
  const kg = u === 'lb' ? lb2kg(w) : w, cm = u === 'lb' ? (h1 * 12 + h2) * 2.54 : h1, first = !S.profile || !(S.profile.h && S.profile.h.done);
  const old = S.profile || {};
  S.profile = { name: (d.name || '').trim(), sex: d.sex, age, units: u, weightKg: kg, heightCm: cm, baseAct: +d.act, goal: 'lose', rate: 'normal',
    h: { done: true, conditions: d.conditions.slice(), condOther: d.condOther, injuries: Object.assign({}, d.injuries), injNote: d.injNote, diet: d.diet, allergies: d.allergies.slice(), edHist: !!d.edHist, dislikes: d.dislikes, exp: d.exp, equip: d.equip, days: +d.days, sleepH: +d.sleepH, stress: d.stress, alcohol: d.alcohol, caffeine: d.caffeine, smoker: d.smoker, goalNote: d.goalNote } };
  S.settings.vegan = d.diet === 'vegan'; S.settings.medText = (d.meds || '').trim();
  let mode = d.mode; if (!modeAllowed(mode).ok) mode = modeAllowed('lose').ok ? 'lose' : 'maintain';
  S.profile.goal = MODES[mode].goal; S.profile.rate = MODES[mode].rate; S.settings.schedule = buildSchedule(mode, d.days);
  (d.peps || '').split(/[,\n;]+/).map(x => x.trim()).filter(Boolean).forEach(n => { if (!S.trackers.some(t => t.name.toLowerCase() === n.toLowerCase())) S.trackers.push({ id: uid(), name: n, type: 'peptide', unit: 'mg' }); });
  if (S.trackers.some(t => t.type === 'peptide') && !S.reminders.some(r => r.kind === 'pepcheck')) S.reminders.push({ id: uid(), label: 'Peptide check-in: open Healthica for today\'s tips', time: '09:00', days: [0, 1, 2, 3, 4, 5, 6], on: true, kind: 'pepcheck' });
  if (first || !S.weights.length) { const k = dkey(); if (!S.weights.find(x => x.date === k)) S.weights.push({ date: k, kg }); }
  if (!S.reminders.length) [0, 1, 5, 6, 7].forEach(i => { const p = REM_PRESETS[i]; S.reminders.push({ id: uid(), label: p[0], time: p[1], days: p[2].slice(), on: true, kind: p[3] }); });
  save(); return { first, mode };
}
function intSummary(mode) {
  const h = H(), g = guard(), b = budgetInfo(), c = condSet(), lines = [];
  lines.push(`Plan: <b>${MODES[mode].label}</b>. About <b>${b.budget} kcal</b> a day, protein about <b>${b.macros.p} g</b>.`);
  lines.push(`Workout week built for <b>${h.days} days</b>, ${h.equip === 'none' ? 'no equipment' : h.equip === 'home' ? 'home with dumbbells' : 'gym'}, ${h.exp === 'beginner' ? 'beginner-friendly moves first' : h.exp === 'inter' ? 'intermediate' : 'experienced'}.`);
  const inj = Object.keys(h.injuries || {}); if (inj.length) lines.push('Care for: <b>' + inj.map(k => (INJ_AREAS.find(a => a[0] === k) || [0, k])[1].toLowerCase() + (h.injuries[k] === 'current' ? ' (hurts now)' : ' (healed)')).join(', ') + '</b>. Moves that stress them are flagged' + (inj.some(k => h.injuries[k] === 'current') ? ' and left out of suggestions' : '') + '.');
  if (h.diet && h.diet !== 'omni') lines.push('Foods filtered for a <b>' + { pesc: 'pescatarian', veg: 'vegetarian', vegan: 'vegan' }[h.diet] + '</b> diet.');
  if ((h.allergies || []).length) lines.push('Hidden for allergies: <b>' + h.allergies.map(a => ALLERGENS[a][0].toLowerCase()).join(', ') + '</b>. Still read labels.');
  if (c.size) lines.push('Medicine and peptide checks now consider: <b>' + Array.from(c).filter(x => !['minor'].includes(x)).map(x => condLabel(x).toLowerCase()).join(', ') + '</b>.');
  g.why.forEach(w => lines.push(esc(w))); g.notes.forEach(w => lines.push(esc(w)));
  return lines;
}

function healthSummaryHTML() {
  const h = H(), c = Array.from(condSet()).filter(x => x !== 'minor').map(condLabel), inj = Object.keys(h.injuries || {}).map(k => (INJ_AREAS.find(a => a[0] === k) || [0, k])[1] + (h.injuries[k] === 'current' ? ' (now)' : ' (healed)'));
  if (!h.done) return '<div class="sm dim">You have not completed the health questionnaire yet. It makes warnings and workouts fit you.</div>';
  return `<div class="sm dim">Conditions: ${c.length ? esc(c.join(', ')) : 'none listed'}</div><div class="sm dim">Injuries: ${inj.length ? esc(inj.join(', ')) : 'none listed'}</div><div class="sm dim">Diet: ${esc(h.diet || 'omni')}${(h.allergies || []).length ? ' · allergies: ' + esc(h.allergies.join(', ')) : ''}</div><div class="sm dim">Training: ${esc(h.exp)}, ${esc(h.equip)}, ${h.days} days</div>`;
}
