/* Healthica exercise library: extra exercises, equipment/movement tags, and a best-effort guesser for typed-in exercises. */
const EXTRA_TXT = `
Incline push-up|chest|chest shoulders|triceps abs|push|bodyweight
Decline push-up|chest|chest shoulders|triceps abs|push|bodyweight
Diamond push-up|arms|triceps|chest shoulders|push|bodyweight
Pike push-up|chest|shoulders|triceps chest|push|bodyweight
Knee push-up|chest|chest|triceps shoulders|push|bodyweight
Bench dips|arms|triceps|chest shoulders|push|bodyweight
Handstand hold|chest|shoulders|triceps abs traps|push|bodyweight
Flat dumbbell press|chest|chest|shoulders triceps|push|dumbbell
Dumbbell shoulder press|chest|shoulders|triceps traps|push|dumbbell
Incline barbell press|chest|chest shoulders|triceps|push|barbell
Decline bench press|chest|chest|triceps shoulders|push|barbell
Chest press machine|chest|chest|triceps shoulders|push|machine
Pec deck|chest|chest|shoulders|push|machine
Landmine press|chest|shoulders chest|triceps abs|push|barbell
Dumbbell pullover|chest|chest lats|triceps|push|dumbbell
Dumbbell kickback|arms|triceps|shoulders|push|dumbbell
Cable lateral raise|chest|shoulders|traps|push|cable
Inverted row|back|lats traps|biceps forearms abs|pull|bodyweight
Chin-ups|back|lats biceps|forearms traps|pull|bodyweight
Australian pull-up|back|lats traps|biceps|pull|bodyweight
Dumbbell row|back|lats traps|biceps forearms|pull|dumbbell
Chest-supported row|back|lats traps|biceps|pull|dumbbell
Renegade row|back|lats|abs obliques shoulders biceps|pull|dumbbell
Dumbbell shrug|back|traps|forearms|pull|dumbbell
Dumbbell pullover (back)|back|lats|chest triceps|pull|dumbbell
Straight-arm pulldown|back|lats|triceps abs|pull|cable
Reverse fly machine|back|shoulders traps|lats|pull|machine
Band pull-apart|back|shoulders traps|lats|pull|band
Barbell row (Pendlay)|back|lats traps|biceps lowback|pull|barbell
Rack pull|back|traps lowback|glutes hamstrings forearms|pull|barbell
Good morning|back|lowback hamstrings|glutes|pull|barbell
Reverse hyperextension|back|glutes lowback|hamstrings|pull|machine
Bird dog|back|lowback glutes|abs shoulders|pull|bodyweight
Concentration curl|arms|biceps|forearms|pull|dumbbell
Incline dumbbell curl|arms|biceps|forearms|pull|dumbbell
Cable curl|arms|biceps|forearms|pull|cable
Zottman curl|arms|biceps forearms||pull|dumbbell
Reverse curl|arms|forearms biceps||pull|barbell
Farmer's carry|arms|forearms traps|abs obliques glutes|carry|dumbbell
Dead hang|arms|forearms|lats shoulders|pull|bodyweight
Bodyweight squat|legs|quads glutes|hamstrings abs|squat|bodyweight
Jump squat|legs|quads glutes|calves hamstrings|squat|bodyweight
Sumo squat|legs|quads glutes|hamstrings|squat|dumbbell
Dumbbell squat|legs|quads glutes|hamstrings abs|squat|dumbbell
Dumbbell lunge|legs|quads glutes|hamstrings|squat|dumbbell
Reverse lunge|legs|quads glutes|hamstrings|squat|bodyweight
Lateral lunge|legs|quads glutes|hamstrings|squat|bodyweight
Curtsy lunge|legs|glutes quads|hamstrings|squat|bodyweight
Pistol squat (assisted)|legs|quads glutes|hamstrings abs|squat|bodyweight
Hack squat machine|legs|quads|glutes|squat|machine
Smith machine squat|legs|quads glutes|hamstrings|squat|machine
Dumbbell Romanian deadlift|legs|hamstrings glutes|lowback forearms|hinge|dumbbell
Single-leg deadlift|legs|hamstrings glutes|lowback abs|hinge|dumbbell
Sumo deadlift|legs|glutes hamstrings quads|lowback traps|hinge|barbell
Trap-bar deadlift|legs|quads glutes hamstrings|lowback traps forearms|hinge|barbell
Nordic hamstring curl|legs|hamstrings|glutes calves|hinge|bodyweight
Glute kickback (cable)|legs|glutes|hamstrings|hinge|cable
Donkey kick|legs|glutes|hamstrings|hinge|bodyweight
Fire hydrant|legs|glutes|obliques|hinge|bodyweight
Banded lateral walk|legs|glutes|quads|hinge|band
Single-leg glute bridge|legs|glutes|hamstrings abs|hinge|bodyweight
Hip abduction machine|legs|glutes|quads|hinge|machine
Seated leg curl|legs|hamstrings|calves|hinge|machine
Box jump|legs|quads glutes|calves hamstrings|squat|bodyweight
Calf raise (single leg)|legs|calves||squat|bodyweight
Donkey calf raise|legs|calves||squat|machine
Kettlebell goblet squat|legs|quads glutes|abs|squat|kettlebell
Kettlebell clean|legs|glutes hamstrings|traps shoulders forearms|hinge|kettlebell
Kettlebell Turkish get-up|core|abs obliques shoulders|glutes quads|carry|kettlebell
Hollow body hold|core|abs|obliques|core|bodyweight
V-up|core|abs|obliques|core|bodyweight
Flutter kicks|core|abs|obliques quads|core|bodyweight
Leg raise (lying)|core|abs|obliques|core|bodyweight
Reverse crunch|core|abs|obliques|core|bodyweight
Sit-up|core|abs|obliques|core|bodyweight
Toe touch crunch|core|abs||core|bodyweight
Heel taps|core|obliques|abs|core|bodyweight
Windshield wipers|core|obliques abs|lats|core|bodyweight
Pallof press|core|obliques abs|shoulders|core|cable
Cable crunch|core|abs|obliques|core|cable
Suitcase carry|core|obliques|forearms traps|carry|dumbbell
Plank shoulder taps|core|abs|shoulders obliques|core|bodyweight
Plank up-downs|core|abs|triceps shoulders|core|bodyweight
Bear crawl|full|shoulders abs quads|triceps chest|core|bodyweight
Burpees|full|quads chest|shoulders abs triceps calves|squat|bodyweight
Medicine ball slam|full|abs shoulders|lats triceps|core|medicine ball
Thruster|full|quads shoulders|glutes triceps abs|squat|dumbbell
Dumbbell clean and press|full|shoulders glutes|quads hamstrings traps triceps|squat|dumbbell
Sled push|legs|quads glutes|calves abs|squat|machine
Battle ropes|full|shoulders abs|forearms lats|core|equipment
`;
const EQUIP_RX = [[/dumbbell|\bDB\b/i, 'dumbbell'], [/barbell|bench press|deadlift|back squat|front squat|skull|overhead press|bent-over|t-bar|hip thrust|preacher/i, 'barbell'], [/cable|pulldown|pushdown|crossover|woodchop|seated cable|face pull/i, 'cable'], [/machine|leg press|leg extension|leg curl|pec deck|seated calf/i, 'machine'], [/kettlebell/i, 'kettlebell'], [/band/i, 'band'], [/push-up|pull-up|plank|crunch|dips|bridge|lunge|sit|superman|twist|climber|dead bug|wall sit|raise|step-up|back extension|bicycle|rollout|hanging|shrug/i, 'bodyweight']];
function inferEquip(n) { for (const r of EQUIP_RX) if (r[0].test(n)) return r[1]; return 'bodyweight'; }
function inferMove(e) {
  if (e.move) return e.move;
  const p = e.prim;
  if (e.split === 'core') return 'core';
  if (e.split === 'legs') return /deadlift|bridge|thrust|curl|swing|kick/i.test(e.name) ? 'hinge' : 'squat';
  if (e.split === 'back') return 'pull';
  if (e.split === 'chest') return /raise|fly|rear/i.test(e.name) && p.includes('shoulders') && /rear/i.test(e.name) ? 'pull' : 'push';
  if (e.split === 'arms') return p.includes('triceps') ? 'push' : 'pull';
  return 'full';
}
(function () {
  EXERCISES.forEach(e => { e.equip = e.equip || inferEquip(e.name); e.move = inferMove(e); });
  EXTRA_TXT.trim().split('\n').forEach(l => {
    const a = l.split('|'); if (a.length < 6 || EXERCISES.some(e => e.name === a[0])) return;
    EXERCISES.push({ extra: true, name: a[0], split: a[1], prim: a[2].split(' ').filter(Boolean), sec: a[3].split(' ').filter(Boolean), move: a[4], equip: a[5] });
  });
})();
const MOVE_LABEL = { push: 'Push', pull: 'Pull', squat: 'Squat', hinge: 'Hinge', core: 'Core', carry: 'Carry', full: 'Full body' };

/* ---- guess muscles for a typed exercise (rules, then optional online help) ---- */
const GUESS_RULES = [
  [/push.?up|press.?up|bench|chest|pec|fly|flye|dip/i, 'chest', 'shoulders triceps', 'push'],
  [/shoulder|overhead|military|lateral raise|front raise|arnold|delt|handstand/i, 'shoulders', 'triceps traps', 'push'],
  [/tricep|pushdown|skull|kickback|extension.*(arm|overhead)/i, 'triceps', '', 'push'],
  [/bicep|curl(?!.*(leg|hamstring))|chin/i, 'biceps', 'forearms', 'pull'],
  [/pull.?up|pulldown|lat |row|pullover|back fly|rear/i, 'lats traps', 'biceps', 'pull'],
  [/shrug|trap/i, 'traps', 'forearms', 'pull'],
  [/deadlift|good.?morning|hyperext|rdl|hinge|swing/i, 'hamstrings glutes lowback', 'forearms traps', 'hinge'],
  [/squat|lunge|leg press|step.?up|quad|split squat|wall sit|sled/i, 'quads glutes', 'hamstrings calves', 'squat'],
  [/glute|bridge|thrust|kickback|hydrant|clam/i, 'glutes', 'hamstrings', 'hinge'],
  [/hamstring|leg curl|nordic/i, 'hamstrings', 'calves glutes', 'hinge'],
  [/calf|calves|heel raise|jump rope|skipping/i, 'calves', '', 'squat'],
  [/forearm|wrist|grip|hang|farmer/i, 'forearms', 'traps', 'carry'],
  [/oblique|twist|woodchop|side plank|side bend|windshield/i, 'obliques', 'abs', 'core'],
  [/plank|crunch|sit.?up|ab |abs|core|v-up|leg raise|hollow|dead bug|mountain|rollout|pilates/i, 'abs', 'obliques lowback', 'core'],
  [/burpee|thruster|clean|snatch|jump|box|battle|slam|crawl|crossfit|circuit/i, 'quads shoulders', 'glutes abs chest', 'full']
];
function guessExercise(name) {
  const n = name.trim(); let prim = [], sec = [], move = 'full', hit = 0;
  GUESS_RULES.forEach(r => { if (r[0].test(n)) { hit++; r[1].split(' ').forEach(m => { if (m && !prim.includes(m) && prim.length < 3) prim.push(m); }); r[2].split(' ').forEach(m => { if (m && !sec.includes(m)) sec.push(m); }); if (hit === 1) move = r[3]; } });
  prim = prim.filter(m => MUSCLES[m]); sec = sec.filter(m => MUSCLES[m] && !prim.includes(m));
  return { name: n, prim, sec, move, equip: inferEquip(n), guessed: true, matched: hit > 0 };
}
const WGER_MAP = [[/pectoralis/i, 'chest'], [/deltoid/i, 'shoulders'], [/biceps brachii|brachialis/i, 'biceps'], [/triceps/i, 'triceps'], [/latissimus|teres|rhomboid/i, 'lats'], [/trapezius/i, 'traps'], [/rectus abdominis|serratus/i, 'abs'], [/obliquus/i, 'obliques'], [/gluteus/i, 'glutes'], [/quadriceps|rectus femoris/i, 'quads'], [/biceps femoris|hamstring/i, 'hamstrings'], [/gastrocnemius|soleus/i, 'calves'], [/erector|lower back/i, 'lowback'], [/forearm|brachioradialis/i, 'forearms']];
const mapWger = list => { const out = []; (list || []).forEach(m => { const s = (m.name_en || '') + ' ' + (m.name || ''); const hit = WGER_MAP.find(r => r[0].test(s)); if (hit && !out.includes(hit[1])) out.push(hit[1]); }); return out; };
async function lookupExerciseOnline(name) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch('https://wger.de/api/v2/exercise/search/?language=english&term=' + encodeURIComponent(name), { signal: ctl.signal });
    const j = await r.json(); const first = (j.suggestions || [])[0]; if (!first) return null;
    const id = first.data && (first.data.base_id || first.data.id);
    const r2 = await fetch('https://wger.de/api/v2/exerciseinfo/' + id + '/?format=json', { signal: ctl.signal });
    const d = await r2.json();
    return { title: first.value || name, prim: mapWger(d.muscles), sec: mapWger(d.muscles_secondary) };
  } catch (e) { return null; } finally { clearTimeout(to); }
}
if (typeof module !== 'undefined') module.exports = { guessExercise };
