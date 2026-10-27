/* Healthica Steady Sugar: diabetes safety and a gentle, doctor-guided food on-ramp.
   One small habit at a time, blood sugar watched the whole way, and a report for the doctor.
   Healthica NEVER changes, lowers or stops insulin or any diabetes medicine. Only the person's clinician does that. */
const DIA_LO = 70, DIA_LO2 = 54, DIA_HI = 250, DIA_HI2 = 300, DIA_FLOOR = 130;
const DIA_STEPS = [
  { t: 'Learn your pattern', carb: false, d: 'Eat the way you normally do. Log your food and check your sugar before breakfast and about 2 hours after your biggest meal, or on the schedule your doctor gave you. No changes yet: this week is your starting picture.', why: 'You and your doctor need a "before" to compare against.' },
  { t: 'Swap one sweet drink', carb: true, d: 'Replace one soda, juice, sweet tea or sweetened coffee a day with water, sparkling water, or unsweetened tea or coffee. Keep everything else the same.', why: 'Liquid sugar raises blood sugar faster than anything else.' },
  { t: 'Protein at breakfast', carb: true, d: 'Add eggs, Greek yogurt, cottage cheese or a protein shake to your usual breakfast. Keep your toast or cereal for now, just a little less of it.', why: 'Protein slows the rise from breakfast carbs and keeps you full.' },
  { t: 'Walk after a meal', carb: false, d: 'Take an easy 10-minute walk after your biggest meal.', why: 'Working muscles pull sugar out of the blood, and the effect is strongest right after eating.' },
  { t: 'Half-plate veggies at dinner', carb: true, d: 'Fill half your dinner plate with non-starchy vegetables first (salad, broccoli, green beans, peppers). The rest of the plate gets a little smaller.', why: 'Fiber and volume, with fewer fast carbs.' },
  { t: 'One whole-grain swap', carb: true, d: 'Once a day, swap a white starch for a higher-fiber one: brown rice, whole-wheat bread or pasta, beans or lentils, or plain oats instead of sugary cereal.', why: 'Fiber makes the same carbs rise slower.' },
  { t: 'Most drinks unsweetened', carb: true, d: 'Finish what step 2 started: most of your drinks are now water, unsweetened tea, coffee or sparkling water. A small treat drink now and then is fine.', why: 'This is often the single biggest sugar change people make.' },
  { t: 'Never carbs alone', carb: true, d: 'Pair carbs with protein, fat or fiber: apple with peanut butter, crackers with cheese, fruit with yogurt.', why: 'Pairing flattens the spike.' },
  { t: 'Even out your meals', carb: true, d: 'Spread carbs across the day instead of one big carb meal. Similar amounts at similar times each day.', why: 'Steady meals mean steadier sugar, and they make insulin dosing easier for your care team.' },
  { t: 'Sweets a few times a week', carb: true, d: 'Move desserts from daily to 2 or 3 times a week. The Kitchen\'s Treats tab has low-sugar ideas.', why: 'Less added sugar, without banning anything.' },
  { t: 'Veggies at lunch too', carb: true, d: 'Add a serving of vegetables to lunch.', why: 'More fiber across the whole day.' },
  { t: 'Make it yours', carb: false, d: 'Keep every habit you built. Bring your report to your doctor and set the next goals together.', why: 'These habits are now your normal way of eating.' }
];
const DIA_CTX = [['fast', 'Fasting (before breakfast)'], ['pre', 'Before a meal'], ['post', '2 h after a meal'], ['bed', 'Bedtime'], ['low', 'I felt low'], ['other', 'Other']];

const diaType = () => { const c = condSet(); return c.has('t1d') ? 't1d' : c.has('t2d') ? 't2d' : c.has('prediab') ? 'prediab' : ''; };
const diaOn = () => !!(S && S.profile && diaType());
const D = () => S.dia || (S.dia = { setup: null, step: 0, stepStart: null, hist: [], base: null, started: null });
const diaUnitMm = () => !!(D().setup && D().setup.unit === 'mmol');
const fmtG = mg => mg == null ? '-' : diaUnitMm() ? (mg / 18).toFixed(1) + ' mmol/L' : Math.round(mg) + ' mg/dL';
const diaDays = k => !k ? 0 : Math.max(0, Math.round((parseKey(dkey()) - parseKey(k)) / 86400000));
const diaDay = k => !k ? '-' : parseKey(k).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

function diaMedTags() { const T = new Set(); try { medCheck(S.settings.medText || '').found.forEach(f => f.m.tags.forEach(t => T.add(t))); } catch (e) { } return T; }
function diaRisk() {
  const s = D().setup || {}, T = diaMedTags(), t1 = diaType() === 't1d';
  const insulin = t1 || !!s.insulin;
  return { t1, insulin, su: !!s.su, hypo: insulin || !!s.su || T.has('hypoglycemic'), sglt2: !!s.sglt2 || T.has('sglt2'), glp1: !!s.glp1 || T.has('glp1'), metformin: !!s.met || T.has('metformin'), meter: s.meter || 'none' };
}

/* ---------- readings ---------- */
const diaTracker = () => S.trackers.find(t => t.name === 'Blood glucose');
function diaMg(l) {
  const v = parseFloat(String(l.value).replace(',', '.')); if (!isFinite(v) || v <= 0) return null;
  const u = String(l.unit || ''); if (/mmol/i.test(u)) return Math.round(v * 18); if (/mg/i.test(u)) return Math.round(v);
  return diaUnitMm() ? Math.round(v * 18) : Math.round(v); // no unit: use the person's chosen unit, never guess from the size
}
function diaReadings(days) {
  const t = diaTracker(); if (!t) return []; const lim = Date.now() - days * 86400000;
  return S.logs.filter(l => l.trackerId === t.id && l.ts >= lim).map(l => ({ id: l.id, ts: l.ts, date: l.date, mg: diaMg(l), ctx: l.ctx || '', note: l.unote != null ? l.unote : (l.ctx ? '' : l.note || '') })).filter(r => r.mg != null).sort((a, b) => a.ts - b.ts);
}
const diaLows = days => diaReadings(days).filter(r => r.mg < DIA_LO);
const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

/* ---------- carbs ---------- */
function diaCarbAvg(fromK, toK) {
  const by = {}; S.food.filter(e => e.date >= fromK && e.date <= toK).forEach(e => { (by[e.date] = by[e.date] || { c: 0, n: 0 }); by[e.date].c += e.c || 0; by[e.date].n++; });
  const days = Object.values(by).filter(d => d.n >= 2); return { avg: days.length ? Math.round(avg(days.map(d => d.c))) : null, days: days.length };
}
function diaTarget() {
  const d = D(); if (!d.setup || !d.started || d.base == null || H().edHist) return null;
  const n = Math.min(10, DIA_STEPS.slice(1, d.step + 1).filter(s => s.carb).length);
  if (d.base <= DIA_FLOOR) return null; // already at or under the floor: habits only, no carb target
  return Math.max(DIA_FLOOR, Math.round(d.base * (1 - 0.03 * n)));
}
function diaMealCarbs(k) { const m = {}; foodsOn(k).forEach(e => { m[e.meal] = (m[e.meal] || 0) + (e.c || 0); }); return m; }

/* ---------- step gate ---------- */
function diaGate() {
  const d = D(), R = diaRisk(), why = []; if (!d.started) return { ok: false, why: ['Start the on-ramp first.'] };
  if (d.step >= DIA_STEPS.length - 1) return { ok: false, why: ['You are on the last step. Keep it going.'] };
  const days = diaDays(d.stepStart); if (days < 7) why.push(`Give each step at least a week (${7 - days} more day${7 - days === 1 ? '' : 's'}).`);
  if (d.redHold) why.push('After a serious low, talk to your doctor before any further change, then tick "My doctor knows" again in Diabetes setup.');
  const lows = diaLows(7); if (lows.length) why.push(`You had ${lows.length === 1 ? 'a low' : lows.length + ' lows'} in the last 7 days. Hold here and tell your doctor: your medicine may need adjusting first.`);
  if (R.hypo) {
    if (!d.setup.doctorOk) why.push('Your insulin or sulfonylurea can cause lows as you eat fewer carbs. Let your doctor know you are making these changes, then tick "My doctor knows" in Diabetes setup.');
    if (R.meter === 'none') why.push('You need a way to check your sugar (meter or CGM) before changing what you eat. Ask your doctor or pharmacist.');
    const n = diaReadings(7).length; if (n < 5) why.push(`Log at least 5 sugar readings this week so changes can be watched (${n} so far).`);
  }
  return { ok: !why.length, why };
}

/* ---------- safety alert from readings ---------- */
function diaAlert() {
  const lows3 = diaLows(3), lows7 = diaLows(7), r7 = diaReadings(7), worst = r7.length ? Math.min(...r7.map(r => r.mg)) : null, R = diaRisk();
  const serious = r7.some(r => r.mg < DIA_LO2) || lows7.length >= 2;
  const highs = diaReadings(2).filter(r => r.mg >= (R.t1 ? DIA_HI : DIA_HI2));
  if (serious) return { lvl: 'red', t: 'Call your doctor today', s: `${lows7.length} low reading${lows7.length === 1 ? '' : 's'} this week (lowest ${fmtG(worst)}). Your medicine dose may now be too strong for how you are eating. Do not take the next step, and do not change your medicine yourself.` };
  if (lows3.length) return { lvl: 'warn', t: 'You had a low', s: `${fmtG(lows3[lows3.length - 1].mg)} on ${diaDay(lows3[lows3.length - 1].date)}. Steps are on hold. Tell your doctor, especially if you did not skip a meal or exercise extra.` };
  if (highs.length) return { lvl: 'warn', t: 'High reading', s: `${fmtG(highs[highs.length - 1].mg)}. ${R.t1 || R.sglt2 ? 'Check ketones if you can. ' : ''}Drink water and follow your doctor's high-sugar plan. Tap Safety for when to get help.` };
  return null;
}

/* ---------- Today card ---------- */
function diaCard() {
  if (!diaOn()) return '';
  const d = D(), ty = diaType();
  if (!d.setup) return `<section class="card dia"><div class="ct"><span>Diabetes safety</span></div>
    <p class="sm">You noted ${esc(condLabel(ty).toLowerCase())}. Take one minute so Healthica can keep your food plan safe for your medicines.</p>
    <button class="btn gold block" data-act="diaSetup">Diabetes setup (1 minute)</button></section>`;
  const R = diaRisk(), k = dkey(), today = diaReadings(1).filter(r => r.date === k), last = diaReadings(30).slice(-1)[0], al = diaAlert();
  const st = DIA_STEPS[d.step], tg = diaTarget(), mc = diaMealCarbs(k);
  return `<section class="card dia${al && al.lvl === 'red' ? ' alert' : ''}"><div class="ct"><span>Steady Sugar</span><a class="lnk" data-act="diaHelp">Safety</a></div>
    ${al ? `<div class="nudge"><b class="${al.lvl === 'red' ? 'red' : 'warn'}">${esc(al.t)}</b><div class="sm">${esc(al.s)}</div></div>` : ''}
    <div class="sm">${last ? `Last sugar: <b>${fmtG(last.mg)}</b> · ${ago(last.ts)}` : 'No sugar readings yet.'}${today.length > 1 ? ` · ${today.length} today` : ''}</div>
    ${d.started ? `<div class="nudge"><b>Step ${d.step + 1} of ${DIA_STEPS.length}: ${esc(st.t)}</b> <span class="dim sm">day ${diaDays(d.stepStart) + 1}</span><div class="sm dim">${esc(st.d)}</div>
      ${R.hypo && st.carb ? '<div class="sm warn">This change can lower your sugar. Check more often this week and carry fast sugar.</div>' : ''}</div>
      ${tg ? `<div class="sm dim">Carb pace: about ${tg} g a day${d.base > tg ? ` (from your usual ${d.base} g)` : ''}. Never below ${DIA_FLOOR} g without your doctor.</div>` : ''}
      ${R.insulin && Object.keys(mc).length ? `<div class="sm dim">Carbs today: ${Object.keys(mc).map(m => `${esc(m)} ${Math.round(mc[m])} g`).join(' · ')}</div>` : ''}`
      : `<p class="sm">A slow, one-habit-at-a-time switch to healthier eating, with your sugar watched the whole way. No big diet changes.</p>`}
    <div class="row wrap"><button class="btn gold" data-act="diaLog">Log sugar</button>${d.started ? '<button class="btn" data-act="diaSteps">Steps</button>' : '<button class="btn" data-act="diaStart">Start on-ramp</button>'}<button class="btn" data-act="diaReport">Doctor report</button></div>
    <div class="sm dim">Healthica never changes your insulin or diabetes medicine. Only your doctor does.</div></section>`;
}

/* ---------- setup ---------- */
const diaChips = (k, opts) => `<div class="chips c">${opts.map(o => `<button type="button" class="chip${String(window.DIAT[k]) === String(o[0]) ? ' on' : ''}" data-act="diaPick" data-k="${k}" data-v="${o[0]}">${esc(o[1])}</button>`).join('')}</div>`;
const DIA_YN = [['1', 'Yes'], ['0', 'No']];
function diaSetupHTML() {
  const t = window.DIAT, t1 = diaType() === 't1d';
  return `<p class="sm dim">Answers stay on this phone. They make Healthica's food advice safe for your medicines. If unsure, check your pill bottles or pharmacy list.</p>
    ${t1 ? '<div class="nudge"><b>Type 1 diabetes</b><div class="sm dim">Insulin is always needed with type 1. Healthy eating makes it steadier, never unnecessary.</div></div>' : `<label class="fl">Do you take insulin (any kind)?</label>${diaChips('insulin', DIA_YN)}`}
    <label class="fl">Glipizide, glimepiride or glyburide (sulfonylureas)?</label>${diaChips('su', DIA_YN)}
    <label class="fl">Jardiance, Farxiga, Invokana or Steglatro (SGLT2)?</label>${diaChips('sglt2', DIA_YN)}
    <label class="fl">Ozempic, Mounjaro, Trulicity, Victoza or similar (GLP-1)?</label>${diaChips('glp1', DIA_YN)}
    <label class="fl">Metformin?</label>${diaChips('met', DIA_YN)}
    <label class="fl">How do you check your sugar?</label>${diaChips('meter', [['meter', 'Finger-stick meter'], ['cgm', 'CGM sensor'], ['none', 'I do not check']])}
    <label class="fl">Units</label>${diaChips('unit', [['mg', 'mg/dL (US)'], ['mmol', 'mmol/L']])}
    <label class="fl"><input type="checkbox" id="diadoc" ${t.doctorOk ? 'checked' : ''}> My doctor knows I am changing how I eat</label>
    <div class="sm dim">If you take insulin or a sulfonylurea, eating fewer carbs can drop your sugar too low unless your dose is adjusted. Your doctor needs to know first.</div>
    <button class="btn gold block" data-act="diaSaveSetup">Save</button>`;
}
function openDiaSetup() {
  const s = D().setup || {}, T = diaMedTags();
  window.DIAT = { insulin: s.insulin != null ? +s.insulin : '', su: s.su != null ? +s.su : '', sglt2: s.sglt2 != null ? +s.sglt2 : (T.has('sglt2') ? 1 : ''), glp1: s.glp1 != null ? +s.glp1 : (T.has('glp1') ? 1 : ''), met: s.met != null ? +s.met : (T.has('metformin') ? 1 : ''), meter: s.meter || '', unit: s.unit || 'mg', doctorOk: !!s.doctorOk };
  openSheet('Diabetes setup', diaSetupHTML());
}

/* ---------- logging ---------- */
function openDiaLog(ctx) {
  const now = new Date(), mm = diaUnitMm(); window.DIAL = { ctx: ctx || (now.getHours() < 10 ? 'fast' : 'other') };
  openSheet('Log blood sugar', `<label class="fl">Reading (${mm ? 'mmol/L' : 'mg/dL'})<input id="dgv" class="in big" inputmode="decimal" placeholder="${mm ? '6.5' : '120'}"></label>
    <label class="fl">When was it?</label><div class="chips c" id="dgc">${DIA_CTX.map(c => `<button type="button" class="chip${window.DIAL.ctx === c[0] ? ' on' : ''}" data-act="diaCtx" data-v="${c[0]}">${c[1]}</button>`).join('')}</div>
    <label class="fl">Time<input id="dgt" class="in" type="datetime-local" value="${dkey(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}"></label>
    <label class="fl">Note (optional)<input id="dgn" class="in" placeholder="Skipped lunch, long walk, sick..."></label>
    <button class="btn gold block" data-act="diaSaveLog">Save</button>`, { mount: () => { const i = $('#dgv'); if (i) i.focus(); } });
}
function diaCheckReading(mg) {
  const R = diaRisk(), al = diaAlert();
  if (al && al.lvl === 'red' && D().setup) { D().redHold = true; D().setup.doctorOk = false; save(); render(); }
  if (mg < DIA_LO) { openDiaHelp(mg < DIA_LO2 ? 'low2' : 'low'); return true; }
  if (mg >= (R.t1 ? DIA_HI : DIA_HI2)) { openDiaHelp('high'); return true; }
  return false;
}

/* ---------- safety sheet ---------- */
function diaHelpHTML(focus) {
  const R = diaRisk(), mm = diaUnitMm(), lo = mm ? '3.9 mmol/L' : '70 mg/dL', lo2 = mm ? '3.0 mmol/L' : '54 mg/dL', hi = mm ? (R.t1 ? '13.9 mmol/L' : '16.7 mmol/L') : (R.t1 ? '250 mg/dL' : '300 mg/dL');
  const low = `<section class="card inner${focus === 'low' || focus === 'low2' ? ' alert' : ''}"><div class="ct"><span>Low sugar: under ${lo}</span></div>
    ${focus === 'low2' ? `<p class="sm red"><b>This is a serious low (under ${lo2}).</b> Treat it now and call your doctor today.</p>` : ''}
    <div class="sm">Signs: shaky, sweaty, fast heartbeat, hungry, dizzy, confused, cranky.</div>
    <div class="sm"><b>The 15-15 rule:</b> eat or drink 15 g of fast sugar: 4 glucose tablets, half a cup (4 oz) of juice or regular soda, or 1 tablespoon of sugar or honey. Wait 15 minutes and check again. Still under ${lo}? Repeat. Once you are back up, eat a snack or meal.</div>
    <div class="sm red"><b>Call 911</b> if the person cannot swallow safely, passes out or has a seizure. Do not put food in their mouth. Use glucagon if they have it.</div>
    <div class="sm warn">Do not drive until you are back over ${lo} and have eaten.</div>
    <div class="sm dim">Any low while following Steady Sugar means: hold the next step and tell your doctor. Your medicine may need adjusting. Do not change it yourself.</div></section>`;
  const high = `<section class="card inner${focus === 'high' ? ' alert' : ''}"><div class="ct"><span>High sugar: over ${hi}</span></div>
    <div class="sm">Drink water, take your medicine as prescribed, and recheck in a few hours. ${R.t1 || R.sglt2 ? '<b>Check ketones</b> (urine strips or a ketone meter). Moderate or large ketones: call your doctor now.' : 'Call your doctor if it stays high on two checks in a row.'}</div>
    <div class="sm red"><b>Go to the ER or call 911</b> for vomiting that will not stop, belly pain, deep or fast breathing, fruity-smelling breath, confusion or extreme sleepiness.</div>
    ${R.sglt2 ? '<div class="sm warn">With an SGLT2 medicine, ketone trouble (DKA) can happen even when sugar looks normal, especially when sick, fasting or eating very low carb. Nausea, vomiting, belly pain or trouble breathing need same-day care.</div>' : ''}</section>`;
  const sick = `<section class="card inner"><div class="ct"><span>Sick days</span></div>
    <div class="sm">${R.insulin ? '<b>Never stop your insulin when you are sick</b>, even if you cannot eat. Call your doctor for how to adjust it. Check ketones every 4 hours while sick; moderate or large ketones: call now. ' : ''}Check your sugar every 3 to 4 hours. Sip fluids all day. If you cannot keep food down, small sips of juice or regular soda can replace carbs.${R.sglt2 || R.metformin ? ' Ask your doctor now whether to pause your ' + [R.sglt2 && 'SGLT2 medicine', R.metformin && 'metformin'].filter(Boolean).join(' and ') + ' on days you are vomiting or cannot drink.' : ''}</div></section>`;
  const move = `<section class="card inner"><div class="ct"><span>Exercise</span></div>
    <div class="sm">${R.hypo ? 'Check before you exercise. If you are under 100 mg/dL (5.6 mmol/L), have a small carb snack first. Carry fast sugar every time, and check again afterward: lows can show up hours later and overnight.' + (R.t1 ? ' Do not exercise if you are over 250 mg/dL (13.9 mmol/L) with ketones.' : '') : 'Walking after meals is one of the best tools you have. Stay hydrated.'}</div></section>`;
  const eat = `<section class="card inner"><div class="ct"><span>How Healthica keeps food safe for you</span></div>
    <div class="sm">No fasting or fast weight-loss pace. Changes come one habit at a time, at least a week apart, and pause after any low. Carbs come down slowly and never below ${DIA_FLOOR} g a day without your doctor. ${R.hypo ? 'Very low carb recipes are flagged for you, because they change how much insulin or pill you may need.' : ''}</div>
    <div class="sm dim">${R.t1 ? 'Type 1 always needs insulin. Better eating makes it steadier, never unnecessary.' : 'With type 2, some people need less medicine as their habits improve. Only your doctor can decide that, using your readings. Bring the Doctor report.'}</div></section>`;
  return (focus === 'high' ? high + low : low + high) + sick + move + eat + '<p class="foot">General education, not medical advice. Follow your own care plan when it differs.</p>';
}
function openDiaHelp(focus) { openSheet(focus === 'low' || focus === 'low2' ? 'Low blood sugar: treat it now' : focus === 'high' ? 'High blood sugar' : 'Diabetes safety', diaHelpHTML(focus)); }

/* ---------- steps sheet ---------- */
function diaStepsHTML() {
  const d = D(), g = diaGate();
  return `<p class="sm dim">One small change at a time. Stay on a step as long as you like: a week is the minimum, not a deadline.</p>
    ${DIA_STEPS.map((s, i) => `<div class="nudge"><b class="${i < d.step ? 'dim' : i === d.step ? 'gold' : ''}">${i < d.step ? '✓ ' : ''}${i + 1}. ${esc(s.t)}</b>${i === d.step ? `<div class="sm">${esc(s.d)}</div><div class="sm dim">Why: ${esc(s.why)}</div>` : ''}</div>`).join('')}
    ${g.ok ? '<button class="btn gold block" data-act="diaNext">I have this habit: next step</button>' : `<div class="card inner"><div class="sm"><b>Before the next step:</b></div>${g.why.map(w => `<div class="sm dim">• ${esc(w)}</div>`).join('')}</div>`}
    ${d.step > 0 ? '<button class="btn block" data-act="diaBack">Go back a step</button>' : ''}<button class="btn block" data-act="diaSetup">Diabetes setup</button>`;
}

/* ---------- doctor report ---------- */
function diaReportText() {
  const d = D(), s = d.setup || {}, R = diaRisk(), p = S.profile || {}, k = dkey(), r14 = diaReadings(14), mg = r14.map(r => r.mg);
  const by = c => avg(r14.filter(r => r.ctx === c).map(r => r.mg)), lo = s.lo || DIA_LO, hi = s.hi || 180;
  const inR = mg.length ? Math.round(100 * mg.filter(v => v >= lo && v <= hi).length / mg.length) : null;
  const c14 = diaCarbAvg(addDays(k, -13), k), w = sortedWeights(), w0 = d.started ? (w.filter(x => x.date <= d.started).slice(-1)[0] || w[0]) : null, w1 = w[w.length - 1];
  const meds = [R.insulin && 'insulin', s.su && 'sulfonylurea', s.sglt2 && 'SGLT2 inhibitor', s.glp1 && 'GLP-1', s.met && 'metformin'].filter(Boolean);
  const L = [];
  L.push('HEALTHICA - DIABETES SUMMARY FOR MY DOCTOR', 'Prepared ' + new Date().toLocaleDateString() + (p.name ? ' for ' + p.name : ''), '');
  L.push('Condition: ' + condLabel(diaType()));
  L.push('Diabetes medicines (my answers): ' + (meds.length ? meds.join(', ') : 'none listed'));
  if (S.settings.medText) L.push('Full medicine list I entered: ' + S.settings.medText.replace(/\n/g, ', '));
  L.push('Sugar checks: ' + ({ meter: 'finger-stick meter', cgm: 'CGM', none: 'not checking' }[R.meter] || 'not set'));
  L.push('Healthica does not tell me to change my medicines. Changes I made myself, if any: ______________', '');
  L.push('FOOD CHANGES (Steady Sugar, one habit at a time)');
  if (d.started) {
    L.push('Started ' + diaDay(d.started) + '. Now on step ' + (d.step + 1) + ' of ' + DIA_STEPS.length + ': ' + DIA_STEPS[d.step].t + ' (since ' + diaDay(d.stepStart) + ').');
    (d.hist || []).forEach(h => L.push('  Done: ' + DIA_STEPS[h.i].t + ' (' + diaDay(h.start) + ' to ' + diaDay(h.end) + ')'));
    if (d.base != null) L.push('Usual carbs at the start: about ' + d.base + ' g a day.');
  } else L.push('Not started yet.');
  L.push('Carbs, last 14 days: ' + (c14.avg != null ? 'about ' + c14.avg + ' g a day (' + c14.days + ' days logged)' : 'not enough food logged'));
  if (w0 && w1 && w0 !== w1) L.push('Weight: ' + showW(w0.kg) + ' ' + wUnit() + ' (' + diaDay(w0.date) + ') to ' + showW(w1.kg) + ' ' + wUnit() + ' (' + diaDay(w1.date) + ')');
  L.push('', 'BLOOD SUGAR, LAST 14 DAYS (' + mg.length + ' readings)');
  if (mg.length) {
    L.push('Average ' + fmtG(avg(mg)) + ' · lowest ' + fmtG(Math.min(...mg)) + ' · highest ' + fmtG(Math.max(...mg)));
    if (by('fast') != null) L.push('Fasting average ' + fmtG(by('fast')));
    if (by('post') != null) L.push('2 h after meals average ' + fmtG(by('post')));
    L.push('In my range (' + fmtG(lo) + ' to ' + fmtG(hi) + '): ' + inR + '% of readings');
    const lows = r14.filter(r => r.mg < DIA_LO); L.push('Lows under ' + fmtG(DIA_LO) + ': ' + lows.length + (lows.length ? ' (' + lows.filter(r => r.mg < DIA_LO2).length + ' under ' + fmtG(DIA_LO2) + ')' : ''));
    lows.forEach(r => L.push('  ' + new Date(r.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ': ' + fmtG(r.mg) + (r.ctx ? ' (' + (DIA_CTX.find(c => c[0] === r.ctx) || [0, r.ctx])[1] + ')' : '') + (r.note ? ' - ' + r.note : '')));
    const hiT = R.t1 ? DIA_HI : DIA_HI2; L.push('Highs over ' + fmtG(hiT) + ': ' + r14.filter(r => r.mg >= hiT).length);
    const felt = r14.filter(r => r.ctx === 'low' && r.mg >= DIA_LO); if (felt.length) { L.push('Felt low but number was not low: ' + felt.length); felt.forEach(r => L.push('  ' + new Date(r.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ': ' + fmtG(r.mg) + (r.note ? ' - ' + r.note : ''))); }
    L.push('', 'All readings:');
    r14.forEach(r => L.push('  ' + new Date(r.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '  ' + fmtG(r.mg) + (r.ctx ? '  ' + (DIA_CTX.find(c => c[0] === r.ctx) || [0, r.ctx])[1] : '') + (r.note ? '  ' + r.note : '')));
  } else L.push('No readings logged.');
  L.push('', 'QUESTIONS I WANT TO ASK');
  if (R.hypo) L.push('- I am eating fewer carbs. Do my insulin or diabetes pill doses need to change to prevent lows?');
  if (R.t1) L.push('- Should my insulin-to-carb ratio or correction factor change as my meals change?');
  if (R.hypo) L.push('- Should I have a glucagon prescription for severe lows?');
  if (s.su) L.push('- Is a sulfonylurea still the best fit if my sugars keep coming down?');
  if (R.sglt2) L.push('- Is my carb level safe with my SGLT2 medicine? What are my sick-day rules?');
  if (!R.t1) L.push('- If my numbers keep improving, what would a safe plan to reduce my medicines look like, and how would we monitor it?');
  L.push('- What blood sugar targets should I use, and how often should I check?', '- Could I see a diabetes educator (DSMES) or a registered dietitian?');
  L.push('', 'Made with Healthica, a general wellness app. Not medical advice.');
  return L.join('\n');
}
function openDiaReport() {
  const txt = diaReportText();
  openSheet('Doctor report', `<p class="sm dim">Show this at your next visit, or copy it into a message to your care team. It includes your sugar readings, food changes and questions about your medicines.</p>
    <textarea id="diarep" class="in" rows="16" readonly>${esc(txt)}</textarea>
    <div class="row wrap"><button class="btn gold" data-act="diaCopy">Copy</button><button class="btn" data-act="diaSaveTxt">Save as file</button></div>`);
}

/* ---------- actions ---------- */
Object.assign(ACT, {
  diaSetup() { openDiaSetup(); },
  diaPick(el) { window.DIAT[el.dataset.k] = el.dataset.v; const sh = $('#sheet'), y = sh.scrollTop, doc = $('#diadoc'); if (doc) window.DIAT.doctorOk = doc.checked; $('.sh-body', sh).innerHTML = diaSetupHTML(); sh.scrollTop = y; },
  diaSaveSetup() {
    const t = window.DIAT, doc = $('#diadoc'); if (doc) t.doctorOk = doc.checked; const b = v => v === '' || v == null ? false : String(v) === '1';
    if (!t.meter) { toast('Please choose how you check your sugar.'); return; }
    const prev = D().setup || {};
    D().setup = Object.assign({}, prev, { insulin: diaType() === 't1d' ? true : b(t.insulin), su: b(t.su), sglt2: b(t.sglt2), glp1: b(t.glp1), met: b(t.met), meter: t.meter, unit: t.unit || 'mg', doctorOk: !!t.doctorOk, lo: prev.lo || DIA_LO, hi: prev.hi || 180, ts: Date.now() });
    if (t.doctorOk) D().redHold = false;
    const tr = diaTracker(); if (tr) tr.unit = t.unit === 'mmol' ? 'mmol/L' : 'mg/dL';
    save(); closeSheet(); render();
    const R = diaRisk(); toast(R.hypo && R.meter === 'none' ? 'Saved. Please ask your doctor about a meter: you need one to change your eating safely.' : 'Diabetes setup saved.', 5000);
  },
  diaStart() {
    const d = D(); d.started = dkey(); d.step = 0; d.stepStart = dkey(); d.hist = []; d.base = null; save(); render();
    openSheet('Steady Sugar: week 1', `<p>This week, change nothing. Just log your food and check your sugar ${diaRisk().meter === 'none' ? '(if you can)' : 'before breakfast and 2 hours after your biggest meal'}.</p><p class="sm dim">After a week, Healthica learns your usual carbs and suggests your first small change. You decide when to move on.</p><button class="btn gold block" data-act="closeSheet">Got it</button>`);
  },
  diaLog() { openDiaLog(); },
  diaCtx(el) { window.DIAL.ctx = el.dataset.v; $$('#dgc .chip').forEach(c => c.classList.toggle('on', c.dataset.v === el.dataset.v)); },
  diaSaveLog() {
    const raw = ($('#dgv').value || '').trim().replace(',', '.'), v = parseFloat(raw); if (!isFinite(v) || v <= 0) { toast('Enter your reading.'); return; }
    const mm = diaUnitMm(), mg = mm ? Math.round(v * 18) : Math.round(v); if (mg < 15 || mg > 700) { toast('That number looks off. Check the units.'); return; }
    const t = $('#dgt').value ? new Date($('#dgt').value) : new Date(), tr = ensureTracker('Blood glucose', 'metric', mm ? 'mmol/L' : 'mg/dL');
    const ctx = window.DIAL.ctx, note = ($('#dgn').value || '').trim();
    S.logs.push({ id: uid(), trackerId: tr.id, ts: t.getTime(), date: dkey(t), value: raw, unit: mm ? 'mmol/L' : 'mg/dL', ctx, unote: note, note: [(DIA_CTX.find(c => c[0] === ctx) || [0, ''])[1], note].filter(Boolean).join(' · ') });
    save(); closeSheet(); render(); if (!diaCheckReading(mg)) toast('Saved: ' + fmtG(mg));
  },
  diaHelp() { openDiaHelp(); },
  diaSteps() { openSheet('Steady Sugar steps', diaStepsHTML()); },
  diaNext() {
    const d = D(), g = diaGate(); if (!g.ok) { openSheet('Steady Sugar steps', diaStepsHTML()); return; }
    if (d.step === 0 && d.base == null) { const c = diaCarbAvg(d.started, dkey()); d.base = c.days >= 3 ? c.avg : null; }
    d.hist.push({ i: d.step, start: d.stepStart, end: dkey() }); d.step++; d.stepStart = dkey(); save(); render();
    const s = DIA_STEPS[d.step], R = diaRisk();
    openSheet('New step: ' + s.t, `<p>${esc(s.d)}</p><p class="sm dim">Why: ${esc(s.why)}</p>${R.hypo && s.carb ? '<div class="card inner"><div class="sm warn">This change can lower your sugar. Check a little more often this week and carry fast sugar. Any low: treat it, hold here, and tell your doctor.</div></div>' : ''}${d.step === 1 && d.base == null && !H().edHist ? '<p class="sm dim">Not enough food was logged last week to set a carb pace, so Steady Sugar will work on habits only. That is fine.</p>' : ''}<button class="btn gold block" data-act="closeSheet">Let's do it</button>`);
  },
  diaBack() { const d = D(); if (d.step > 0) { d.hist.pop(); d.step--; d.stepStart = dkey(); save(); render(); } openSheet('Steady Sugar steps', diaStepsHTML()); },
  diaReport() { openDiaReport(); },
  diaCopy() { const ta = $('#diarep'), txt = ta.value; try { navigator.clipboard.writeText(txt).then(() => toast('Copied. Paste it into a message or note.'), () => { ta.focus(); ta.select(); }); } catch (e) { ta.focus(); ta.select(); } },
  diaSaveTxt() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([diaReportText()], { type: 'text/plain' })); a.download = 'healthica-diabetes-report-' + dkey() + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600); }
});

/* ---------- hooks into the rest of the app ---------- */
(function () {
  const s0 = ACT.saveLog; ACT.saveLog = function (el, e) { // readings typed in the general Log tab get the same safety check
    const tr = S.trackers.find(t => t.id === el.dataset.id), n = S.logs.length; s0(el, e);
    if (tr && tr.name === 'Blood glucose' && diaOn() && S.logs.length > n) { const l = S.logs[S.logs.length - 1]; const mg = l && l.trackerId === tr.id && diaMg(l); if (mg) diaCheckReading(mg); }
  };
  const b0 = budgetInfo; budgetInfo = function () { const g = b0(); if (diaOn()) { const t = diaTarget(); if (t) { g.macros.c = t; g.diaCarb = true; } } return g; };
  const g0 = guard; guard = function () {
    const g = g0(); if (!diaOn() || !S.dia || !S.dia.setup) return g; const R = diaRisk();
    if (R.hypo) g.noFast = true;
    if (R.sglt2) g.notes.push('SGLT2 medicine: avoid fasting and very low carb plans unless your doctor OKs it. Rare but serious ketone build-up (DKA) can happen even with normal sugar.');
    if (R.hypo) g.notes.push('Insulin or sulfonylurea: do not skip meals, keep carbs steady from day to day, and carry fast sugar.');
    return g;
  };
  const n0 = nudgeList; nudgeList = function () {
    const out = n0(); if (!diaOn() || !S.dia || !S.dia.setup) return out; const R = diaRisk(), h = new Date().getHours();
    if (R.hypo && R.meter !== 'none' && h >= 9 && !diaReadings(1).some(r => r.date === dkey())) out.unshift(['Check your sugar', 'No reading logged yet today. Tap Log sugar on the Steady Sugar card.', 'Today']);
    return out;
  };
  if (typeof kitFit === 'function') {
    const k0 = kitFit; kitFit = function (r) {
      const o = k0(r); if (o.hide || !diaOn() || !S.dia || !S.dia.setup || r.c == null) return o; const R = diaRisk();
      if (R.hypo && r.meal !== 'T' && r.meal !== 'S' && r.c < 15) o.flags.push('Very low carb: with insulin or a sulfonylurea, ask your doctor how to dose for meals like this');
      else if (R.sglt2 && r.c < 15) o.flags.push('Very low carb with an SGLT2 medicine: check with your doctor first');
      return o;
    };
  }
})();
