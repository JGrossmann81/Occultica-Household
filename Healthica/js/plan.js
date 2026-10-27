/* Healthica plan: goal modes (maintain / lose / 2x lose / gain) and the vegan filter. */
const MODES = {
  maintain: { label: 'Maintain', goal: 'maintain', rate: 'normal', sched: { 0: 'active', 1: 'legs', 2: 'chest', 3: 'core', 4: 'back', 5: 'arms', 6: 'rest' },
    sum: '4 to 5 balanced strength days, easy walks on the rest days.', tips: ['Eat at your daily base, give or take.', 'Keep protein steady and lift 3 to 4 times a week.', 'Let the weight trend wander within a couple of pounds.'] },
  lose: { label: 'Lose', goal: 'lose', rate: 'normal', sched: { 0: 'rest', 1: 'legs', 2: 'cardio', 3: 'back', 4: 'chest', 5: 'core', 6: 'cardio' },
    sum: 'Strength 4 days to hold on to muscle, 2 cardio days. About 1 lb (0.45 kg) a week.', tips: ['Moderate deficit, high protein, lots of veggies.', 'Lifting tells your body to keep muscle while fat goes.', 'Judge by the weekly trend, not one weigh-in.'] },
  lose2: { label: '2x Lose', goal: 'lose', rate: 'fast2', sched: { 0: 'active', 1: 'legs', 2: 'cardio', 3: 'back', 4: 'cardio', 5: 'chest', 6: 'rest' },
    sum: 'Double pace: bigger deficit, protein 2 g per kg, 3 strength days, 2 cardio days, daily walking. About 2 lb (0.9 kg) a week.', tips: ['This is a push, not a lifestyle. Use it for a few weeks, then step back to Lose or Maintain.', 'Healthica never goes under a safe calorie floor, so on a small frame this mode may match Lose.', 'Feeling dizzy, cold, exhausted or irritable means eat more. Check with a doctor before using this pace.'] },
  gain: { label: 'Gain', goal: 'gain', rate: 'normal', sched: { 0: 'rest', 1: 'legs', 2: 'chest', 3: 'back', 4: 'arms', 5: 'legs', 6: 'core' },
    sum: 'Strength 6 days with a leg day twice a week. Cardio stays light. About 0.25 to 0.5 lb a week of lean gain.', tips: ['Small surplus, protein at every meal, and progressive overload.', 'Slow gains are mostly muscle. Fast gains are mostly fat.', 'Sleep is when the building happens.'] }
};
function modeOf(p) { if (!p) return 'lose'; if (p.goal === 'maintain') return 'maintain'; if (p.goal === 'gain') return 'gain'; return p.rate === 'fast2' ? 'lose2' : 'lose'; }
function applyMode(id) {
  const m = MODES[id]; S.profile.goal = m.goal; S.profile.rate = m.rate; S.settings.schedule = (typeof buildSchedule === 'function') ? buildSchedule(id, (S.profile.h || {}).days) : Object.assign({}, m.sched); save();
}
function modeCard() {
  const id = modeOf(S.profile), m = MODES[id], b = budgetInfo(), v = !!S.settings.vegan;
  const adj = b.adj === 0 ? 'at your base' : (b.adj > 0 ? '+' : '') + b.adj + ' kcal vs base';
  return `<section class="card"><div class="ct"><span>My plan</span></div>
    <div class="seg four">${Object.keys(MODES).map(k => `<button class="${k === id ? 'on' : ''} ${modeAllowed(k).ok ? '' : 'dis'}" data-act="mode" data-v="${k}">${MODES[k].label}</button>`).join('')}</div>
    <div class="sm" style="margin-top:8px"><b>${b.budget} kcal</b> a day (${adj}) · protein ${b.macros.p} g${b.floored ? ' · safe floor applied' : ''}</div>
    <div class="sm dim">${esc(m.sum)}</div>
    ${guard().why.map(w => `<div class="sm" style="color:var(--gold)">${esc(w)}</div>`).join('')}
    ${m.tips.map(t => `<div class="sm dim">&bull; ${esc(t)}</div>`).join('')}
    <label class="tog"><input type="checkbox" data-act="vegan" ${v ? 'checked' : ''}><span>Vegan foods only</span><i class="sm dim">hides meat, fish, eggs, dairy, honey and whey</i></label></section>`;
}
/* ---- vegan ---- */
const NONVEG_RX = /whey|casein|collagen|honey|gelatin|jerky|ice cream|pizza|hamburger|ready-to-drink|protein bar|bacon|lard|egg|cheese|yogh?urt|butter|milk(?!.*(almond|oat|soy|coconut|plant))|fish|tuna|salmon|shrimp|sardine|beef|pork|chicken|turkey|lamb|bison|ham\b|sausage/i;
function isVegan(f) {
  if (['meat', 'fish', 'dairy'].includes(f.cat)) return false;
  if (/almond milk|oat milk|soy milk|coconut milk|plant protein|pea |peanut butter|nut butter|almond butter/i.test(f.name)) return true;
  return !NONVEG_RX.test(f.name);
}
const foodOk = f => (!S.settings.vegan || isVegan(f)) && (typeof dietOk !== 'function' || dietOk(f));
const VEG_TIPS = {
  vitA: 'Carrots, sweet potato, spinach and kale are rich in vitamin A.',
  vitD: 'Sunlight and fortified soy milk help. Many vegans use a D2 or algae-based D3 supplement. Ask your doctor, ideally after a blood test.',
  b12: 'B12 is the one nutrient plants do not reliably provide. Fortified nutritional yeast and fortified soy milk help, and most vegans take a B12 supplement. Ask your doctor.',
  iron: 'Lentils, beans, tofu, tempeh, pumpkin seeds and spinach. Pair them with vitamin C (peppers, citrus) to absorb more. Check with your doctor before taking iron supplements.',
  calcium: 'Calcium-set tofu, fortified soy milk, kale, almonds and tahini supply calcium.',
  zinc: 'Pumpkin seeds, hemp seeds, cashews, chickpeas, lentils and tofu are good zinc sources.'
};
const nutTip = k => (S.settings.vegan && VEG_TIPS[k]) || NUT_TIPS[k];
const PROTEIN_IDEAS = () => S.settings.vegan ? 'Tofu, tempeh, seitan, lentils, edamame or a plant protein shake' : 'Chicken, fish, eggs, Greek yogurt or a protein shake';
if (typeof module !== 'undefined') module.exports = { MODES, modeOf, isVegan };
