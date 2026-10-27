/* Healthica symptoms: a guided, offline "what could this be and what should I do" helper.
   It asks only the follow-up questions that matter, pre-filled from what the app already knows about the person.
   It does NOT diagnose. It lists common contributors, self-care ideas and when to get care. Emergencies come first. */
const EMERGENCY_TXT = 'Call 911 (US) or your local emergency number now. Do not drive yourself.';
const RED_CHIPS = [['r_chest', 'Chest pain or pressure'], ['r_breath', 'Trouble breathing'], ['r_faint', 'Passed out'], ['r_stroke', 'Face droop, slurred speech or one-sided weakness'], ['r_allergy', 'Swelling of lips, tongue or throat'], ['r_harm', 'Thoughts of hurting myself']];
const RED_INFO = {
  r_harm: ['You deserve support right now.', 'Call or text 988 (Suicide and Crisis Lifeline, US) any time, or call 911 if you are in immediate danger. If you are elsewhere, contact your local emergency number. If you can, tell someone near you.'],
  r_stroke: ['These can be signs of a stroke.', EMERGENCY_TXT + ' Note the time symptoms started.'],
  r_chest: ['Chest pain or pressure can be a heart emergency.', EMERGENCY_TXT],
  r_breath: ['Trouble breathing needs emergency care.', EMERGENCY_TXT],
  r_allergy: ['Swelling of the lips, tongue or throat can be a severe allergic reaction.', EMERGENCY_TXT + ' If you carry epinephrine, use it as directed.'],
  r_faint: ['Passing out needs prompt medical care.', EMERGENCY_TXT + ' Do not stand or drive until checked.']
};
const RED_TEXT = [[/chest (pain|pressure|tight)/i, 'r_chest'], [/can'?t breathe|trouble breathing|short(ness)? of breath|struggling to breathe|gasping/i, 'r_breath'], [/faint(ed|ing)|passed out|blacked out|collapsed/i, 'r_faint'], [/slurred|face droop|drooping|one[- ]sided|numb(ness)? on one side|can'?t move my (arm|leg)|sudden (confusion|vision loss)/i, 'r_stroke'], [/(lip|tongue|throat|face) (is |are )?swell|swelling of (the )?(lip|tongue|throat|face)|anaphyla/i, 'r_allergy'], [/suicid|kill myself|end my life|want to die|hurt myself|self[- ]harm/i, 'r_harm']];
const DUR = [['d1', 'Started today'], ['d3', '2 to 3 days'], ['d7', 'About a week'], ['d14', 'Weeks or on and off']];
const SEV = [['mild', 'Mild, I can go on'], ['mod', 'Moderate, it slows me'], ['sev', 'Severe, hard to function']];
const YN = (v) => [['y', 'Yes'], ['n', 'No']];
/* symptom knowledge. qs: yes/no questions, lvl = what a "yes" means (E emergency, U same-day care, V see a clinician).
   causes: n name, w base, b ctx boosts {tag: [add, why]}, a answer boosts {qid: [add, why]}, t tips, s see-a-clinician notes */
const SYMS = {
  headache: { label: 'Headache', al: ['headache', 'head ache', 'migraine', 'head pounding', 'head hurts'], kw: ['headache'],
    qs: [['h1', 'Sudden, the worst headache of your life?', 'E'], ['h2', 'With fever and a stiff neck, confusion, or a new rash?', 'E'], ['h3', 'With vision changes, weakness, trouble speaking, or after a head injury?', 'E'], ['h4', 'Is it worse when you stand up or after you skip meals or caffeine?', '']],
    causes: [
      { n: 'Dehydration', w: 3, b: { lowwater: [3, 'You have logged little water today.'], hardwork: [1, 'You trained recently.'], diuretic: [2, 'A water pill raises dehydration risk.'] }, t: ['Drink a large glass of water and a pinch of salt with food.', 'Sip steadily over the next hour.'] },
      { n: 'Short or poor sleep', w: 3, b: { lowsleep: [3, 'Your sleep log has been short.'] }, t: ['Aim for an earlier night and a steady wake time.'] },
      { n: 'Skipped meals or eating too little', w: 2, b: { undereat: [4, 'You are eating well under your plan.'], hypo: [3, 'Diabetes medicine can drop sugar.'] }, a: { h4: { y: [2, 'It eases with food or caffeine.'] } }, t: ['Eat a balanced snack with protein and carbs.', 'Review your calorie target. A deficit that is too deep often causes headaches.'] },
      { n: 'Caffeine swings (too much or withdrawal)', w: 2, b: { caffeine: [3, 'You take caffeine or pre-workout.'] }, a: { h4: { y: [1, ''] } }, t: ['Keep caffeine steady and before noon. Cut down gradually.'] },
      { n: 'Tension or screen strain', w: 3, t: ['Rest your eyes, loosen your neck and shoulders, and take a short walk.'] },
      { n: 'A side effect of something you take', w: 0, b: { ghs: [3, 'Growth hormone peptides can cause headaches.'], glp1: [2, 'GLP-1 drugs can cause headaches.'], hasmeds: [2, 'Check the effects list for your medicines below.'] }, t: ['Tell your prescriber if it is frequent.'] }
    ],
    s: ['A headache that is new after age 50, keeps getting worse, wakes you at night, or lasts more than a few days.', 'Frequent headaches that need pain relievers on most days.'] },
  nausea: { label: 'Nausea or vomiting', al: ['nausea', 'nauseous', 'queasy', 'sick to my stomach', 'vomit', 'throwing up', 'throw up'], kw: ['nausea', 'vomit', 'stomach upset'],
    qs: [['n1', 'Severe belly pain, especially in the upper belly or right side?', 'E'], ['n2', 'Vomiting blood, or material that looks like coffee grounds?', 'E'], ['n3', 'Unable to keep fluids down for 12 hours or more, or very little urine?', 'U'], ['n4', 'Could you be pregnant?', '']],
    causes: [
      { n: 'GLP-1 medicine effect', w: 0, b: { glp1: [8, 'You use a GLP-1 type medicine. Nausea is its most common effect.'] }, t: ['Eat smaller meals, slowly, and stop when full.', 'Skip greasy, very sweet or large meals. Try ginger or bland foods.', 'Tell your prescriber if it is lasting. They may adjust the pace.'] },
      { n: 'Medicine or supplement on an empty stomach', w: 2, b: { hasmeds: [3, 'Several medicines and supplements cause nausea. See your list below.'], ironzinc: [3, 'Iron or zinc often upset an empty stomach.'] }, t: ['Take supplements with food unless the label says otherwise.'] },
      { n: 'Low blood sugar or long gaps between meals', w: 2, b: { undereat: [3, 'You are eating well under your plan.'], hypo: [3, 'Diabetes medicine can drop sugar.'] }, t: ['Have a small snack with carbs and protein.'] },
      { n: 'Training on an empty stomach or too hard', w: 2, b: { hardwork: [3, 'You trained hard recently.'] }, t: ['Eat something light 1 to 2 hours before training, and sip fluids.'] },
      { n: 'Stomach bug or food that did not agree', w: 3, t: ['Small sips of fluid. Add bland food when you can.'] },
      { n: 'Pregnancy', w: 0, b: { c_preg: [8, 'You noted pregnancy.'] }, a: { n4: { y: [6, 'You said it could be.'] } }, t: ['A home test is a quick way to know.'] }
    ],
    s: ['Vomiting more than 24 hours, signs of dehydration, or severe pain. Ask about the gallbladder if you are losing weight fast.'] },
  dizzy: { label: 'Dizziness or lightheaded', al: ['dizzy', 'dizziness', 'lightheaded', 'light headed', 'faint feeling', 'room spinning', 'vertigo'], kw: ['dizz', 'lightheaded'],
    qs: [['z1', 'Chest pain, a racing or irregular heartbeat, or shortness of breath with it?', 'E'], ['z2', 'Sudden weakness, numbness, or trouble speaking or seeing?', 'E'], ['z3', 'Does it happen mostly when you stand up quickly?', ''], ['z4', 'Does the room spin?', '']],
    causes: [
      { n: 'Dehydration or low salt', w: 3, b: { lowwater: [3, 'You have logged little water.'], diuretic: [3, 'A water pill lowers fluid and salt.'], undereat: [1, ''] }, a: { z3: { y: [3, 'It happens when you stand up.'] } }, t: ['Drink fluids and add some salt in food. Rise slowly.'] },
      { n: 'Eating too little', w: 2, b: { undereat: [5, 'You are eating well under your plan.'], rapidloss: [3, 'Your weight is falling fast.'], glp1: [3, 'GLP-1 medicines reduce appetite and intake.'] }, t: ['Eat on time, add salt and carbs, and raise your calorie target.', 'Ease out of any aggressive plan mode.'] },
      { n: 'Blood pressure medicine or other effects', w: 0, b: { aceArb: [4, 'Blood pressure medicines can lower pressure too much.'], diuretic: [2, ''], hasmeds: [2, 'See your list below.'] }, t: ['Ask your prescriber about a check of your blood pressure and dose.'] },
      { n: 'Low iron or B12', w: 1, b: { female: [2, 'Iron deficiency is common in women.'], vegan: [2, 'Vegan diets need B12.'] }, t: ['A simple blood test can check iron, ferritin and B12.'] },
      { n: 'Inner-ear cause (spinning)', w: 0, a: { z4: { y: [5, 'The room spins.'] } }, t: ['Move slowly. A clinician can test and treat common positional vertigo.'] },
      { n: 'Poor sleep or stress', w: 2, b: { lowsleep: [2, 'Your sleep has been short.'] }, t: ['Rest, fluids, and an earlier night.'] }
    ], s: ['Dizziness with falls, new hearing loss, or that keeps returning.'] },
  fatigue: { label: 'Tired or low energy', al: ['tired', 'fatigue', 'exhausted', 'low energy', 'no energy', 'drained', 'sluggish'], kw: ['tired', 'fatigue', 'drows'],
    qs: [['f1', 'Heavy bleeding, black stools or unexplained weight loss?', 'U'], ['f2', 'Persistently low mood or loss of interest?', 'V'], ['f3', 'Snoring, gasping at night, or waking unrefreshed?', 'V']],
    causes: [
      { n: 'Eating too little for your activity', w: 2, b: { undereat: [5, 'You are eating well under your plan.'], rapidloss: [3, 'Your weight is falling fast.'], glp1: [3, 'GLP-1 medicines cut intake.'], lose2: [3, 'You chose the 2x pace.'] }, t: ['Raise calories toward your base for a week.', 'Prioritize protein, carbs around training and iron-rich foods.', 'Step the plan back to Lose or Maintain.'] },
      { n: 'Not enough sleep', w: 3, b: { lowsleep: [4, 'Your sleep log is short.'] }, a: { f3: { y: [2, 'Poor sleep quality.'] } }, t: ['Protect 7 to 9 hours and keep the same wake time daily.'] },
      { n: 'Training load without recovery', w: 2, b: { hardwork: [3, 'You trained hard recently.'] }, t: ['Add a rest day and extra carbs and protein after hard sessions.'] },
      { n: 'Low iron, B12 or vitamin D', w: 1, b: { female: [2, 'Iron deficiency is common in women.'], vegan: [3, 'Vegan diets need B12, iron and D.'] }, t: ['Ask for a blood test: ferritin, B12, vitamin D, thyroid.'] },
      { n: 'Dehydration', w: 1, b: { lowwater: [3, 'You have logged little water.'] }, t: ['Drink water through the day.'] },
      { n: 'Low mood, stress or a sleep disorder', w: 1, a: { f2: { y: [4, 'You noted low mood.'] }, f3: { y: [4, 'You noted poor night sleep.'] } }, t: ['Talk to a clinician. Both respond well to treatment.'] },
      { n: 'Medicine or supplement effect', w: 0, b: { hasmeds: [3, 'Several medicines cause tiredness. See your list below.'], sedativeish: [3, 'Sedating products are in your list.'] }, t: ['Ask your pharmacist whether any of it can cause fatigue.'] }
    ], s: ['More than 2 to 3 weeks without a clear reason, or with weight loss, fever, or shortness of breath.'] },
  constip: { label: 'Constipation', al: ['constipat', 'cannot poop', "can't poop", 'hard stool', 'not pooping', 'backed up'], kw: ['constipation'],
    qs: [['c1', 'No bowel movement for 7 days, or a swollen belly with vomiting?', 'U'], ['c2', 'Blood in stool, or black tarry stool?', 'U']],
    causes: [
      { n: 'GLP-1 slowed digestion', w: 0, b: { glp1: [6, 'GLP-1 medicines slow the gut.'] }, t: ['Water, fiber (oats, chia, veggies), a daily walk. Ask about magnesium or a gentle fiber product.'] },
      { n: 'Low fluid or fiber', w: 3, b: { lowfiber: [4, 'Your logged fiber is low.'], lowwater: [2, 'You logged little water.'] }, t: ['Build fiber up slowly with plenty of water.'] },
      { n: 'Iron, calcium or other supplements', w: 1, b: { ironzinc: [3, 'Iron can constipate.'], calciumsup: [3, 'Calcium can constipate.'], hasmeds: [2, '']}, t: ['Ask about a different form or timing.'] },
      { n: 'Medicines (opioids, some antacids and others)', w: 0, b: { opioid: [6, 'Opioids constipate.'], hasmeds: [2, 'See your list below.'] }, t: ['Ask your prescriber about a bowel plan.'] },
      { n: 'Low activity or a change in routine', w: 2, t: ['Walk daily and give yourself unhurried toilet time after meals.'] }
    ], s: ['Lasting more than 2 to 3 weeks, new change in bowel habit over age 45, or unintended weight loss.'] },
  diarrhea: { label: 'Loose stools or diarrhea', al: ['diarrhea', 'diarrhoea', 'loose stool', 'runs', 'watery stool'], kw: ['loose stool', 'diarrhea'],
    qs: [['d_1', 'Blood in stool, black stool, high fever, or severe belly pain?', 'U'], ['d_2', 'Signs of dehydration: very dry mouth, dizzy, little urine?', 'U'], ['d_3', 'Did it start after a new supplement, protein powder, or sugar-free food?', '']],
    causes: [
      { n: 'Magnesium or other supplements', w: 1, b: { magnesiumsup: [5, 'Magnesium commonly loosens stools.'], hasmeds: [1, '']}, a: { d_3: { y: [3, 'It started after something new.'] } }, t: ['Lower the dose or switch to glycinate. Ask your pharmacist.'] },
      { n: 'Metformin or GLP-1 effect', w: 0, b: { metformin: [5, 'Metformin often loosens stools.'], glp1: [4, 'GLP-1 medicines can cause loose stools.'] }, t: ['Take metformin with food. Ask your prescriber about extended-release.'] },
      { n: 'Lactose or sugar alcohols (protein shake, bars)', w: 1, b: { protein: [3, 'You use a protein powder.'] }, a: { d_3: { y: [3, 'It started after something new.'] } }, t: ['Try a lactose-free or plant protein and check labels for sugar alcohols.'] },
      { n: 'Stomach bug', w: 3, t: ['Fluids with a little salt and sugar. Bland foods. Wash hands.'] },
      { n: 'Fiber or food change', w: 2, t: ['Go back to your usual foods for a few days.'] }
    ], s: ['More than 2 days, any red flag above, or persistent for weeks.'] },
  muscle: { label: 'Muscle soreness, pain or cramps', al: ['sore', 'soreness', 'doms', 'muscle pain', 'muscle ache', 'cramp', 'cramps', 'charley horse', 'achy muscles'], kw: ['muscle', 'cramp'],
    qs: [['m1', 'Dark tea-colored urine with severe weakness or swelling?', 'U'], ['m2', 'One calf swollen, warm and painful?', 'U'], ['m3', 'A sudden pop, or you cannot use the limb normally?', 'V'], ['m4', 'Is the pain mostly cramping at night or during exercise?', '']],
    causes: [
      { n: 'Normal soreness after training (DOMS)', w: 1, b: { newlift: [6, 'You lifted in the last 2 days. Soreness peaks around day 2.'] }, t: ['Light movement, protein, sleep and water. Soreness fades in 2 to 4 days.'] },
      { n: 'Cramps from fluid and electrolytes', w: 2, b: { lowwater: [3, 'You logged little water.'], diuretic: [4, 'Water pills lower potassium and magnesium.'], hardwork: [1, ''] }, a: { m4: { y: [3, 'Cramps.'] } }, t: ['Drink fluids with salt, eat potassium foods (banana, potato), gentle stretching.'] },
      { n: 'Statin muscle aches', w: 0, b: { statin: [6, 'Statins can cause muscle aches.'] }, t: ['Do not stop on your own. Report it to your prescriber, especially with dark urine.'] },
      { n: 'Overuse or a minor strain', w: 2, t: ['Rest the area, then reintroduce load gradually. Heat or ice as it feels better.'] },
      { n: 'Injection or peptide-related soreness', w: 0, b: { healing: [2, ''], ghs: [2, 'Growth hormone peptides can cause aches.'] }, t: ['Track it in your log and mention it to your prescriber.'] }
    ], s: ['Pain that does not improve after a week, any red flag above, or night pain.'] },
  joint: { label: 'Joint pain or stiffness', al: ['joint pain', 'joints hurt', 'knee pain', 'achy joints', 'stiff joints', 'shoulder pain', 'elbow pain', 'hip pain', 'wrist pain', 'tendon'], kw: ['joint'],
    qs: [['j1', 'A hot, red, swollen joint, especially with fever?', 'U'], ['j2', 'After a fall or twist, or you cannot bear weight?', 'V']],
    causes: [
      { n: 'Overuse or a jump in training', w: 3, b: { hardwork: [2, 'You trained recently.'], newlift: [2, '']}, t: ['Reduce load 25 to 50% for a week, keep moving gently, and build back slowly.'] },
      { n: 'Fluid retention or aches from growth hormone peptides', w: 0, b: { ghs: [5, 'Growth hormone stimulants commonly cause joint aches and swelling.'] }, t: ['Report it to your prescriber. Often dose related.'] },
      { n: 'Statins or other medicines', w: 0, b: { statin: [3, 'Statins can cause aches.'], hasmeds: [1, ''] }, t: ['Ask your pharmacist.'] },
      { n: 'Tendon irritation', w: 2, t: ['Isometric holds and gradual loading often help. A physio can tailor it.'] },
      { n: 'Arthritis or inflammation', w: 1, t: ['Morning stiffness over 30 minutes or several swollen joints deserves a medical review.'] }
    ], s: ['Swelling lasting more than a week or night pain, or locking.'] },
  heartburn: { label: 'Heartburn or reflux', al: ['heartburn', 'reflux', 'acid reflux', 'burning chest after eating', 'sour taste', 'indigestion'], kw: ['heartburn', 'reflux', 'indigestion'],
    qs: [['b1', 'Chest pressure with sweating, breathlessness, or pain spreading to arm or jaw?', 'E'], ['b2', 'Trouble swallowing, black stools, or vomiting?', 'U']],
    causes: [
      { n: 'Large, late or fatty meals', w: 3, t: ['Smaller meals, finish eating 3 hours before bed, raise the head of the bed.'] },
      { n: 'GLP-1 slowed stomach emptying', w: 0, b: { glp1: [5, 'GLP-1 medicines slow emptying and can cause reflux.'] }, t: ['Eat smaller, plainer meals. Tell your prescriber.'] },
      { n: 'Caffeine, alcohol, pre-workout or spicy food', w: 2, b: { caffeine: [3, 'Caffeine and pre-workout can trigger reflux.'] }, t: ['Cut the biggest trigger for a week to test it.'] },
      { n: 'NSAIDs or supplements (iron, vitamin C, fish oil)', w: 0, b: { nsaid: [5, 'NSAIDs irritate the stomach.'], hasmeds: [2, 'See your list below.'] }, t: ['Take them with food. Ask about alternatives.'] }
    ], s: ['More than 2 times a week, or any red flag above.'] },
  sleep: { label: 'Trouble sleeping', al: ['insomnia', "can't sleep", 'cant sleep', 'trouble sleeping', 'wake up at night', 'waking at night', 'not sleeping'], kw: ['insomnia', 'sleep'],
    qs: [['s1', 'Is it difficult to fall asleep (rather than waking in the night)?', ''], ['s2', 'Do you feel anxious or on edge in the evenings?', '']],
    causes: [
      { n: 'Caffeine or stimulating supplements late in the day', w: 2, b: { caffeine: [5, 'You take caffeine or pre-workout.'], stimulantsup: [4, 'A stimulating supplement is in your list.'] }, t: ['No caffeine after noon. Take stimulating supplements earlier.'] },
      { n: 'Late hard workouts or late meals', w: 2, b: { hardwork: [1, '']}, t: ['Finish hard training 3 hours before bed. Keep dinner lighter.'] },
      { n: 'Too little food or a big deficit', w: 1, b: { undereat: [3, 'Under-eating disturbs sleep.'] }, t: ['A small protein and carb snack in the evening can help.'] },
      { n: 'Stress or anxiety', w: 2, a: { s2: { y: [4, 'You feel anxious.'] } }, t: ['A 3-minute Breathe session, a short wind-down routine, no screens in bed.'] },
      { n: 'Medicine effect (antidepressants, steroids, decongestants)', w: 0, b: { ssri: [3, 'Antidepressants can disturb sleep, especially early on.'], hasmeds: [1, '']}, t: ['Ask about the timing of the dose.'] }
    ], s: ['More than 3 weeks, loud snoring with gasping, or it affects work.'] },
  anxiety: { label: 'Anxious or jittery', al: ['anxious', 'anxiety', 'jittery', 'panic', 'on edge', 'shaky', 'nervous', 'restless'], kw: ['anxiety', 'jitter', 'nervous'],
    qs: [['a1', 'Chest pain, fainting, or a racing heartbeat that does not settle?', 'E'], ['a2', 'Thoughts of hurting yourself?', 'E']],
    causes: [
      { n: 'Caffeine or stimulants', w: 2, b: { caffeine: [5, 'You take caffeine or pre-workout.'], stimulantsup: [4, 'A stimulating supplement is in your list.'] }, t: ['Cut caffeine in half for a week and see.'] },
      { n: 'Low blood sugar or under-eating', w: 2, b: { undereat: [4, 'You are eating well under your plan.'], hypo: [3, 'Diabetes medicine can drop sugar.'] }, t: ['Eat a balanced snack. Do not skip meals.'] },
      { n: 'Poor sleep', w: 2, b: { lowsleep: [4, 'Your sleep log is short.'] }, t: ['Protect sleep. It changes mood quickly.'] },
      { n: 'Thyroid effect (some supplements or an overactive thyroid)', w: 0, b: { thyroidish: [4, 'A thyroid medicine or thyroid-active supplement is in your list.'] }, t: ['A thyroid blood test is simple. Ask your clinician.'] },
      { n: 'Stress or an anxiety condition', w: 3, t: ['Slow breathing (breathe out longer than in), a walk, talk to someone. Therapy works well.'] }
    ], s: ['Anxiety that interferes with daily life or lasts weeks.'] },
  heart: { label: 'Racing or pounding heart', al: ['palpitation', 'racing heart', 'heart racing', 'heart pounding', 'heart flutter', 'fluttering'], kw: ['heart rate', 'palpitation', 'racing heart'],
    qs: [['p1', 'Chest pain, fainting, severe dizziness, or shortness of breath with it?', 'E'], ['p2', 'Has it lasted more than 20 minutes at rest?', 'U']],
    causes: [
      { n: 'Caffeine, pre-workout or stimulant herbs', w: 2, b: { caffeine: [5, 'You take caffeine or pre-workout.'], stimulantsup: [5, 'A stimulating supplement is in your list.'] }, t: ['Stop the stimulant and see if it settles over a day or two.'] },
      { n: 'Dehydration or low electrolytes', w: 2, b: { lowwater: [3, 'You logged little water.'], diuretic: [3, 'Water pills lower potassium.'], undereat: [2, ''] }, t: ['Fluids, salt, potassium foods.'] },
      { n: 'Anxiety or poor sleep', w: 2, b: { lowsleep: [3, 'Your sleep is short.'] }, t: ['Slow breathing, sleep, caffeine down.'] },
      { n: 'Thyroid effect or fever', w: 0, b: { thyroidish: [4, 'A thyroid medicine or thyroid-active supplement is in your list.'] }, t: ['Ask for a thyroid test.'] },
      { n: 'A medicine effect', w: 0, b: { hasmeds: [2, 'See your list below.'], ghs: [2, ''] }, t: ['Ask your pharmacist.'] }
    ], s: ['Any episode that does not settle, or that repeats. An ECG is a simple first check.'] },
  bloat: { label: 'Bloating or gas', al: ['bloat', 'bloated', 'gas', 'gassy', 'distended', 'full stomach'], kw: ['gas', 'bloat'],
    qs: [['k1', 'Severe belly pain, vomiting, or unable to pass gas or stool?', 'U']],
    causes: [
      { n: 'A fast rise in fiber, beans or veggies', w: 3, t: ['Raise fiber gradually and drink water. Cooked veggies are gentler than raw.'] },
      { n: 'Protein shakes, bars or sugar alcohols', w: 1, b: { protein: [4, 'You use protein powder.'] }, t: ['Try a plant or lactose-free protein.'] },
      { n: 'Slowed digestion from GLP-1 medicine', w: 0, b: { glp1: [5, 'GLP-1 medicines slow the gut.'] }, t: ['Smaller meals, slower eating, a walk after meals.'] },
      { n: 'Carbonated drinks, chewing gum or swallowed air', w: 2, t: ['Cut for a few days to see the difference.'] }
    ], s: ['Persistent bloating for weeks, with weight loss or blood.'] },
  rash: { label: 'Rash or itching', al: ['rash', 'itch', 'itching', 'hives', 'red skin', 'skin reaction', 'sunburn easily'], kw: ['rash', 'allergic', 'sun sensitivity'],
    qs: [['r1', 'With trouble breathing, or swelling of the lips, tongue or throat?', 'E'], ['r2', 'With fever, blistering, peeling, or mouth sores?', 'U'], ['r3', 'Did it start within days of a new supplement, herb or medicine?', '']],
    causes: [
      { n: 'Reaction to something new (supplement, herb, medicine, product)', w: 1, b: { hasmeds: [2, '']}, a: { r3: { y: [6, 'It began after something new.'] } }, t: ['Pause the newest item and ask a pharmacist. Do not stop prescribed medicine without advice.'] },
      { n: 'Sun sensitivity from medicines or herbs', w: 0, b: { photo: [5, 'St. John\'s wort, dong quai, some antibiotics and others raise sun sensitivity.'] }, t: ['Use sunscreen and cover up. Ask your pharmacist.'] },
      { n: 'Injection-site irritation', w: 0, b: { pepinj: [4, 'You log injected peptides.'] }, t: ['Rotate sites, clean skin well, and let alcohol dry first.'] },
      { n: 'Dry skin, contact irritation or eczema', w: 3, t: ['Fragrance-free moisturizer, lukewarm showers, and a plain hydrocortisone cream for a few days.'] }
    ], s: ['Rash lasting more than a week, spreading fast, or any red flag above.'] },
  inject: { label: 'Injection-site reaction', al: ['injection site', 'injection reaction', 'lump at injection', 'redness where i inject', 'bruise from injection'], kw: ['injection'],
    qs: [['i1', 'Spreading redness, heat, pus, or fever?', 'U'], ['i2', 'Swelling of the face, lips or throat, or hives all over?', 'E']],
    causes: [
      { n: 'Common minor reaction (redness, small lump, bruise)', w: 5, t: ['Rotate sites each time, use a fresh needle, let alcohol dry fully, and apply a cool compress.'] },
      { n: 'Local irritation from the product or technique', w: 2, t: ['Check technique with your pharmacist. A smaller needle gauge may help if advised.'] },
      { n: 'Early infection', w: 0, a: { i1: { y: [10, 'You noted spreading redness, heat or pus.'] } }, t: ['See a clinician promptly.'] }
    ], s: ['Redness spreading beyond a few centimeters, increasing pain, or fever.'] },
  mood: { label: 'Low mood or stress', al: ['depressed', 'low mood', 'sad', 'stressed', 'overwhelmed', 'burned out', 'burnt out', 'hopeless'], kw: ['mood', 'depress'],
    qs: [['o1', 'Thoughts of hurting yourself or not wanting to live?', 'E'], ['o2', 'Lasting more than 2 weeks?', 'V']],
    causes: [
      { n: 'Under-eating or a very low-calorie plan', w: 1, b: { undereat: [4, 'Eating well under your plan affects mood.'], lose2: [2, ''] }, t: ['Raise calories toward your base and step back from 2x Lose.'] },
      { n: 'Poor sleep', w: 2, b: { lowsleep: [4, 'Your sleep log is short.'] }, t: ['Protect your sleep first.'] },
      { n: 'Stress and overload', w: 3, t: ['Short walks outdoors, a 3-minute Breathe session, and talking to someone you trust.'] },
      { n: 'Low vitamin D or B12, or a thyroid issue', w: 1, b: { vegan: [2, 'Vegan diets need B12.'] }, t: ['A basic blood panel can check these.'] },
      { n: 'Medicine effect', w: 0, b: { hasmeds: [1, '']}, t: ['Mention mood changes to your prescriber.'] }
    ], s: ['More than 2 weeks, or if it affects work and relationships. Support works.'] },
  cold: { label: 'Cough, sore throat or fever', al: ['cough', 'sore throat', 'fever', 'cold', 'flu', 'runny nose', 'congestion', 'stuffy nose'], kw: ['cough', 'fever'],
    qs: [['q1', 'Trouble breathing, chest pain, or lips turning blue?', 'E'], ['q2', 'Fever over 103 F (39.4 C), or fever lasting more than 3 days?', 'U'], ['q3', 'Stiff neck with severe headache?', 'E']],
    causes: [
      { n: 'Common cold or other viral infection', w: 5, t: ['Rest, fluids, honey in warm water (not for infants), and a humidifier.', 'Keep protein up and sleep long.'] },
      { n: 'Flu or COVID-like illness', w: 2, t: ['Test if available. Early antivirals help some people, so call a clinician quickly if you are high-risk.'] },
      { n: 'Low immune reserve from a deep calorie cut or little sleep', w: 0, b: { undereat: [3, 'Under-eating weakens defenses.'], lowsleep: [2, 'Short sleep weakens defenses.'], lose2: [1, ''] }, t: ['Eat enough and rest. Skip heavy training until well.'] },
      { n: 'Allergies', w: 2, t: ['If itchy eyes and sneezing recur seasonally, an antihistamine may help. Ask a pharmacist.'] }
    ], s: ['Symptoms past 10 days, getting worse after improving, or any red flag above.'] },
  swell: { label: 'Swelling (hands, feet, ankles)', al: ['swollen', 'swelling', 'puffy', 'water retention', 'edema', 'swollen ankles', 'swollen hands'], kw: ['swelling', 'edema', 'water retention'],
    qs: [['w1', 'Only one leg swollen, warm or painful?', 'U'], ['w2', 'With shortness of breath or chest discomfort?', 'E']],
    causes: [
      { n: 'Water retention from growth hormone peptides', w: 0, b: { ghs: [7, 'Growth hormone stimulants commonly cause fluid retention.'] }, t: ['Report it to your prescriber. It is often dose related.'] },
      { n: 'Salt, heat, long sitting or standing', w: 3, t: ['Elevate your legs, walk, cut salty foods, and drink water.'] },
      { n: 'Medicine effect', w: 0, b: { hasmeds: [3, 'Several medicines and supplements cause swelling. See your list below.'] }, t: ['Ask your pharmacist.'] },
      { n: 'Creatine or a new high-carb or salty diet', w: 1, b: { creatine: [3, 'Creatine holds water.'] }, t: ['Usually settles within weeks.'] }
    ], s: ['Swelling that is new, one-sided, or does not go down overnight. Both legs with shortness of breath is urgent.'] }
};
/* what the app already knows */
function symCtx() {
  const tags = new Set(), notes = [], p = S.profile || {}, add = (tag, label) => { tags.add(tag); notes.push({ tag, label }); };
  if (p.sex === 'f') tags.add('female');
  const peps = (typeof myPeptides === 'function') ? myPeptides().filter(x => x.active) : [];
  peps.forEach(x => { if (x.cls === 'glp1') add('glp1', x.t.name + ' (GLP-1 type)'); else if (x.cls === 'ghs') add('ghs', x.t.name + ' (growth hormone type)'); else if (x.cls === 'healing') add('healing', x.t.name); else add('peptideOther', x.t.name); });
  if (peps.length) tags.add('pepinj');
  let found = [];
  try { found = medCheck(S.settings.medText || '').found; } catch (e) { }
  const T = new Set(); found.forEach(f => f.m.tags.forEach(t => T.add(t)));
  const map = { glp1: 'glp1', ssri: 'ssri', statin: 'statin', nsaid: 'nsaid', diuretic: 'diuretic', aceArb: 'aceArb', metformin: 'metformin', opioid: 'opioid', hypoglycemic: 'hypo', creatine: 'creatine', protein: 'protein' };
  Object.keys(map).forEach(k => { if (T.has(k)) { if (!tags.has(map[k])) tags.add(map[k]); } });
  if (found.length) { tags.add('hasmeds'); notes.push({ tag: 'hasmeds', label: 'Your checker list: ' + found.slice(0, 5).map(f => f.m.name.split(' (')[0]).join(', ') + (found.length > 5 ? '...' : '') }); }
  if (found.some(f => /iron|zinc/i.test(f.m.name))) tags.add('ironzinc'); if (found.some(f => /calcium/i.test(f.m.name))) tags.add('calciumsup'); if (found.some(f => /magnesium/i.test(f.m.name))) tags.add('magnesiumsup');
  if (T.has('caffeine') || T.has('stimulant')) { tags.add('caffeine'); } if (T.has('bphigh') || T.has('stimulant') || T.has('ginsengx')) tags.add('stimulantsup');
  if (T.has('sedative')) tags.add('sedativeish'); if (T.has('thyroid') || T.has('ashwagandha') || T.has('iodine') || T.has('thyroid-up')) tags.add('thyroidish'); if (T.has('photosens') || T.has('sjw') || T.has('chelator')) tags.add('photo');
  condSet().forEach(c => { tags.add('c_' + c); if (c !== 'minor') notes.push({ tag: 'c_' + c, label: 'Condition: ' + condLabel(c) }); });
  const hh = H(); if (hh.sleepH && hh.sleepH < 6) add('lowsleep', 'Usually sleeps under 6 hours'); if (hh.caffeine === 'lots' || hh.caffeine === 'pre') add('caffeine', 'Heavy caffeine use'); if (hh.alcohol === 'reg' || hh.alcohol === 'heavy') add('alcohol', 'Regular alcohol');
  const hr = new Date().getHours(), k = dkey();
  if (waterOn(k) < 3 && hr >= 12) add('lowwater', 'Little water logged today');
  const sl = S.trackers.find(t => t.name === 'Sleep');
  if (sl) { const recent = S.logs.filter(l => l.trackerId === sl.id && l.ts > Date.now() - 3 * 86400e3).map(l => +l.value).filter(v => v > 0); if (recent.length && recent.reduce((a, b) => a + b) / recent.length < 6.5) add('lowsleep', 'Short sleep lately'); }
  const b = budgetInfo(); let under = false; const days = [0, 1, 2].map(i => totalsOn(addDays(k, -i)).kcal).filter(v => v > 400);
  if (days.length >= 2 && days.reduce((a, c) => a + c) / days.length < b.budget * 0.75) under = true; if (b.floored || modeOf(S.profile) === 'lose2') under = true;
  if (under) add('undereat', 'Eating well below your usual plan');
  if (modeOf(S.profile) === 'lose2') tags.add('lose2');
  const ws = sortedWeights().filter(w => w.date >= addDays(k, -14)); if (ws.length >= 2) { const a = ws[0], z = ws[ws.length - 1], d = daysBetween(a.date, z.date); if (d >= 5 && (a.kg - z.kg) / a.kg / (d / 7) > 0.012) add('rapidloss', 'Weight falling fast'); }
  if (foodsOn(k).length && (totalsOn(k).fib < 10 && hr > 17)) tags.add('lowfiber');
  const rw = S.workouts.filter(w => w.ts > Date.now() - 48 * 3600e3);
  if (rw.some(w => w.kind === 'strength')) add('newlift', 'Lifted in the last 2 days'); if (rw.some(w => w.minutes >= 60 || (w.kcal || 0) > 400 || w.intensity === 'hard')) { tags.add('hardwork'); if (!rw.some(w => w.kind === 'strength')) notes.push({ tag: 'hardwork', label: 'Hard session recently' }); } else if (rw.length) tags.add('hardwork');
  if (S.settings.vegan) add('vegan', 'Vegan diet');
  if (modeOf(S.profile) !== 'lose' && modeOf(S.profile) !== 'maintain' || modeOf(S.profile) === 'lose') notes.unshift({ tag: 'mode', label: 'Plan: ' + MODES[modeOf(S.profile)].label });
  return { tags, notes: notes.filter((n, i, a) => a.findIndex(x => x.label === n.label) === i), found };
}
/* conditions add extra contributors */
const COND_CAUSES = {
  headache: [{ n: 'Migraine pattern', w: 0, b: { c_migraine: [8, 'You noted migraines.'] }, t: ['Rest in a dark quiet room, hydrate, and use the plan your clinician gave you.'] }, { n: 'High blood pressure', w: 0, b: { c_htn: [3, 'You noted high blood pressure.'] }, t: ['Check your blood pressure if you have a cuff. A severe headache with very high readings needs urgent care.'] }],
  heartburn: [{ n: 'Your reflux condition', w: 0, b: { c_gerd: [8, 'You noted acid reflux.'] }, t: ['Review triggers and timing with your clinician. Raise the head of the bed.'] }],
  bloat: [{ n: 'IBS or digestive condition', w: 0, b: { c_ibs: [7, 'You noted a digestive condition.'] }, t: ['Keep a food and symptom note. A low-FODMAP trial with a dietitian can help.'] }, { n: 'Gluten exposure', w: 0, b: { c_celiac: [8, 'You noted celiac disease.'] }, t: ['Check for hidden gluten in foods and supplements.'] }],
  diarrhea: [{ n: 'IBS or digestive condition', w: 0, b: { c_ibs: [7, 'You noted a digestive condition.'] }, t: ['Keep a food and symptom note and share it with your clinician.'] }, { n: 'Gluten exposure', w: 0, b: { c_celiac: [8, 'You noted celiac disease.'] }, t: ['Check for hidden gluten.'] }],
  constip: [{ n: 'IBS or digestive condition', w: 0, b: { c_ibs: [6, 'You noted a digestive condition.'] }, t: ['Fiber, water and movement. Ask your clinician about options.'] }, { n: 'Underactive thyroid', w: 0, b: { c_thyroid: [3, 'You noted a thyroid condition.'] }, t: ['Ask whether your thyroid levels need a check.'] }],
  anxiety: [{ n: 'Your anxiety condition', w: 0, b: { c_anx: [8, 'You noted anxiety.'] }, t: ['Use the skills and plan you already have, and tell your clinician if it is worsening.'] }],
  mood: [{ n: 'Your mood condition', w: 0, b: { c_dep: [8, 'You noted depression.'], c_bipolar: [8, 'You noted bipolar disorder.'] }, t: ['Do not stop treatment on your own. Tell your clinician about changes soon.'] }],
  fatigue: [{ n: 'Thyroid condition', w: 0, b: { c_thyroid: [5, 'You noted a thyroid condition.'] }, t: ['Ask about a thyroid blood test.'] }, { n: 'Anemia', w: 0, b: { c_anemia: [6, 'You noted anemia or low iron.'] }, t: ['Ask for ferritin and a blood count.'] }, { n: 'Sleep apnea', w: 0, b: { c_apnea: [5, 'You noted sleep apnea.'] }, t: ['Use your treatment every night.'] }, { n: 'Blood sugar swings', w: 0, b: { c_t2d: [4, 'You noted diabetes.'], c_t1d: [4, 'You noted diabetes.'], c_prediab: [3, 'You noted blood sugar issues.'] }, t: ['Check your sugar if you can.'] }, { n: 'Your low mood or mood condition', w: 0, b: { c_dep: [5, 'You noted depression.'] }, t: ['Speak with your clinician.'] }],
  dizzy: [{ n: 'Low blood sugar', w: 0, b: { c_t1d: [5, 'You noted diabetes.'], c_t2d: [4, 'You noted diabetes.'] }, t: ['Check your sugar and have fast carbs if low.'] }, { n: 'Anemia', w: 0, b: { c_anemia: [5, 'You noted anemia.'] }, t: ['Ask about a blood count.'] }, { n: 'Heart rhythm or blood pressure', w: 0, b: { c_arrhythmia: [5, 'You noted a rhythm condition.'], c_heart: [4, 'You noted heart disease.'], c_htn: [2, 'You noted blood pressure.'] }, t: ['Tell your clinician soon, especially if it repeats.'] }],
  heart: [{ n: 'Your rhythm condition', w: 0, b: { c_arrhythmia: [8, 'You noted an irregular heartbeat.'] }, t: ['Follow your clinician’s plan for episodes.'] }, { n: 'Thyroid', w: 0, b: { c_thyroid: [4, 'You noted a thyroid condition.'] }, t: ['Ask about thyroid testing.'] }],
  joint: [{ n: 'Arthritis flare', w: 0, b: { c_arth: [8, 'You noted arthritis.'] }, t: ['Gentle motion, heat for stiffness, and talk to your clinician about flares.'] }, { n: 'Gout', w: 0, b: { c_gout: [7, 'You noted gout.'] }, t: ['A hot, swollen big toe or joint needs prompt care.'] }],
  swell: [{ n: 'Kidney, heart or liver condition', w: 0, b: { c_kidney: [6, 'You noted kidney disease.'], c_heart: [6, 'You noted heart disease.'], c_liver: [6, 'You noted liver disease.'] }, t: ['New or worsening swelling should be reviewed by your clinician.'] }],
  nausea: [{ n: 'Gallbladder problem', w: 0, b: { c_gall: [6, 'You noted gallbladder disease.'], glp1: [1, ''] }, t: ['Pain after fatty meals with nausea deserves a medical check.'] }, { n: 'Blood sugar problem', w: 0, b: { c_t1d: [4, 'You noted type 1 diabetes.'], c_t2d: [2, 'You noted diabetes.'] }, t: ['Check your sugar. With type 1 diabetes, vomiting can signal ketoacidosis, so check ketones and call your clinician.'] }],
  cold: [{ n: 'Asthma or lung condition flare', w: 0, b: { c_asthma: [6, 'You noted asthma or lung disease.'] }, t: ['Use your action plan and rescue inhaler as prescribed.'] }],
  sleep: [{ n: 'Sleep apnea or restless sleep', w: 0, b: { c_apnea: [6, 'You noted sleep apnea.'] }, t: ['Use your treatment every night.'] }]
};
Object.keys(COND_CAUSES).forEach(k => { if (SYMS[k]) SYMS[k].causes = SYMS[k].causes.concat(COND_CAUSES[k]); });
function symDetect(text) {
  const t = (text || '').toLowerCase(), ids = new Set(), reds = new Set();
  RED_TEXT.forEach(r => { if (r[0].test(t)) reds.add(r[1]); });
  Object.keys(SYMS).forEach(id => { if (SYMS[id].al.some(a => t.includes(a))) ids.add(id); });
  return { ids: Array.from(ids), reds: Array.from(reds) };
}
function symAnalyze(st) {
  const ctx = symCtx(), tags = new Set(Array.from(ctx.tags).filter(t => !st.off.has(t))), reds = new Set(st.reds);
  let level = reds.size ? 'E' : 'S'; const rank = { S: 0, V: 1, U: 2, E: 3 }, up = l => { if (rank[l] > rank[level]) level = l; };
  const out = [];
  st.sel.forEach(id => {
    const d = SYMS[id]; if (!d) return;
    d.qs.forEach(q => { if (st.ans[q[0]] === 'y' && q[2]) up(q[2]); });
    const causes = d.causes.map(c => {
      let sc = c.w, why = []; if (c.b) Object.keys(c.b).forEach(tg => { if (tags.has(tg)) { sc += c.b[tg][0]; if (c.b[tg][1]) why.push(c.b[tg][1]); } });
      if (c.a) Object.keys(c.a).forEach(q => { const v = st.ans[q]; if (v && c.a[q][v]) { sc += c.a[q][v][0]; if (c.a[q][v][1]) why.push(c.a[q][v][1]); } });
      return { n: c.n, sc, why, t: c.t };
    }).filter(c => c.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 4);
    const meds = ctx.found.filter(f => d.kw.some(w => f.m.se.toLowerCase().includes(w))).map(f => f.m.name.split(' (')[0]);
    out.push({ id, label: d.label, causes, meds, s: d.s });
  });
  const sev = st.sev, dur = st.dur;
  if (tags.has('c_t1d') && st.sel.has('nausea') && st.ans.n3 === 'y') up('U');
  if (tags.has('c_asthma') && st.sel.has('cold') && (dur === 'd7' || sev !== 'mild')) up('V');
  if (tags.has('c_t1d') && st.sel.has('nausea') && st.ans.n3 === 'y') up('U'); if (tags.has('c_asthma') && st.sel.has('cold') && (dur === 'd7' || sev !== 'mild')) up('V'); if (sev === 'sev') up('U'); if (sev === 'sev' && (dur === 'd7' || dur === 'd14')) up('U'); else if ((dur === 'd14' || dur === 'd7') && rank[level] < 1) up('V');
  return { level, out, reds: Array.from(reds), ctx, tags };
}
const LEVEL_UI = { E: ['Get emergency care now', 'sym-e'], U: ['Please speak to a clinician today', 'sym-u'], V: ['Worth booking a visit', 'sym-v'], S: ['Self-care is reasonable, with watchpoints', 'sym-s'] };
function symSummaryText(st, an) {
  const lines = ['Healthica symptom summary (' + new Date().toLocaleString() + ')', 'Not a diagnosis.'];
  const p = S.profile || {}; lines.push('Age ' + p.age + ', ' + (p.sex === 'm' ? 'male' : 'female') + '.');
  lines.push('Symptoms: ' + an.out.map(o => o.label).join(', ') + '.'); lines.push('Duration: ' + ((DUR.find(d => d[0] === st.dur) || [])[1] || 'not given') + '. Severity: ' + ((SEV.find(d => d[0] === st.sev) || [])[1] || 'not given') + '.');
  an.out.forEach(o => SYMS[o.id].qs.forEach(q => { if (st.ans[q[0]]) lines.push('- ' + q[1] + ' ' + (st.ans[q[0]] === 'y' ? 'Yes' : 'No')); }));
  if (an.ctx.notes.length) lines.push('Context: ' + an.ctx.notes.map(n => n.label).join('; ') + '.'); if (S.settings.medText) lines.push('Takes (self-reported): ' + S.settings.medText.replace(/\n/g, ', '));
  return lines.join('\n');
}
/* ---------- UI ---------- */
function symState() { return window.SYM || (window.SYM = { step: 1, sel: new Set(), ans: {}, text: '', off: new Set(), reds: [], dur: '', sev: '' }); }
function openSymptoms(fresh) { if (fresh) window.SYM = null; const st = symState(); st.step === 1 ? symStep1() : st.step === 2 ? symStep2() : symResult(); }
function chipRow(items, sel, act, extra) { return `<div class="chips c">${items.map(i => `<button class="chip ${sel(i[0]) ? 'on' : ''}" data-act="${act}" data-v="${i[0]}" ${extra || ''}>${esc(i[1])}</button>`).join('')}</div>`; }
function symStep1() {
  const st = symState(), ctx = symCtx();
  const hist = (S.symptoms || []).slice(-3).reverse().map(h => `<div class="sm dim">${new Date(h.ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}: ${esc(h.labels)}</div>`).join('');
  openSheet('Symptoms', `<div class="flag ask"><b>Emergency?</b> Chest pain, trouble breathing, stroke signs, severe allergic reaction, or thoughts of self-harm: call <b>911</b> (US). Crisis line: call or text <b>988</b>.</div>
    <div class="sm dim">Healthica asks only what matters, using what it already knows about you. It cannot diagnose. It lists common contributors, self-care and when to get care.</div>
    ${ctx.notes.length ? `<div class="sm dim lab">What I already know (tap to leave one out)</div><div class="chips c">${ctx.notes.map(n => `<button class="chip ${st.off.has(n.tag) ? '' : 'on'}" data-act="symCtx" data-v="${n.tag}">${esc(n.label)}</button>`).join('')}</div>` : ''}
    <div class="sm dim lab">What is going on? Tap any that fit</div>
    ${chipRow(Object.keys(SYMS).map(k => [k, SYMS[k].label]), k => st.sel.has(k), 'symChip')}
    <div class="sm dim lab">Serious signs</div>
    <div class="chips c">${RED_CHIPS.map(c => `<button class="chip redchip ${st.reds.includes(c[0]) ? 'on' : ''}" data-act="symRed" data-v="${c[0]}">${esc(c[1])}</button>`).join('')}</div>
    <label class="fl">Or describe it in your own words (optional)<textarea id="symtxt" class="in" rows="3" placeholder="e.g. headache since this morning, feel dizzy when I stand">${esc(st.text)}</textarea></label>
    <button class="btn gold block" data-act="symNext">Continue</button>
    ${hist ? `<div class="sm dim lab">Recent entries</div>${hist}` : ''}`);
}
function symStep2() {
  const st = symState(), ids = Array.from(st.sel).slice(0, 3);
  const qhtml = ids.map(id => `<section class="card inner"><div class="ct"><span><b>${esc(SYMS[id].label)}</b></span></div>${SYMS[id].qs.map(q => `<div class="sm" style="margin-top:8px">${esc(q[1])}</div><div class="seg small">${YN().map(o => `<button class="${st.ans[q[0]] === o[0] ? 'on' : ''}" data-act="symAns" data-q="${q[0]}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>`).join('')}</section>`).join('');
  openSheet('A few quick questions', `${qhtml}
    <div class="sm dim lab">How long?</div>${chipRow(DUR, v => st.dur === v, 'symDur')}
    <div class="sm dim lab">How bad?</div>${chipRow(SEV, v => st.sev === v, 'symSev')}
    <div class="row"><button class="btn" data-act="symBack">Back</button><button class="btn gold" data-act="symResult">See what helps</button></div>`);
}
function symResult() {
  const st = symState(); st.step = 3; const an = symAnalyze(st); st.an = an;
  let h = '';
  const hard = an.reds.filter(r => r !== 'r_harm');
  if (hard.length) h += `<section class="card sym-e">${hard.map(r => `<div><b>${esc(RED_INFO[r][0])}</b></div>`).join('')}<div style="margin-top:6px">${esc(RED_INFO[hard[0]][1])}</div></section>`;
  if (an.reds.includes('r_harm')) h += `<section class="card sym-e"><b>${esc(RED_INFO.r_harm[0])}</b><div>${esc(RED_INFO.r_harm[1])}</div></section>`;
  if (!an.reds.length || an.out.length) { const L = LEVEL_UI[an.level]; if (an.level !== 'E' || !an.reds.length) h += `<section class="card ${L[1]}"><b>${L[0]}</b>${an.level === 'E' ? `<div>${EMERGENCY_TXT}</div>` : ''}</section>`; }
  an.out.forEach(o => {
    h += `<section class="card"><div class="ct"><span><b>${esc(o.label)}</b></span></div>`;
    h += `<div class="sm dim lab">Common contributors, most likely first</div>`;
    h += o.causes.map(c => `<div class="nudge"><b>${esc(c.n)}</b>${c.why.length ? `<div class="sm gold">Why it fits you: ${esc(c.why.join(' '))}</div>` : ''}${c.t.map(t => `<div class="sm">&bull; ${esc(t)}</div>`).join('')}</div>`).join('');
    if (o.meds.length) h += `<div class="flag"><b>From your list</b><div class="sm">${esc(o.meds.join(', '))} can commonly cause this. Mention it to your pharmacist or prescriber. Do not stop prescribed medicine on your own.</div></div>`;
    h += `<div class="sm dim lab">See a clinician if</div>${o.s.map(s => `<div class="sm">&bull; ${esc(s)}</div>`).join('')}</section>`;
  });
  h += `<div class="row wrap"><button class="btn gold" data-act="symSave">Save to my log</button><button class="btn" data-act="symCopy">Copy summary for my doctor</button></div><div id="symmsg" class="sm dim center"></div>
    <div class="row"><button class="btn" data-act="symBack">Back</button><button class="btn" data-act="symNew">Start over</button></div>
    <p class="sm dim">Healthica is not a medical device and cannot examine you. Contributors are common possibilities from general knowledge and your own data, not a diagnosis. If you are worried or feel something is wrong, trust that and get care.</p>`;
  openSheet('What could help', h);
}
