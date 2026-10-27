/* Healthica Kitchen: basic healthy recipes and shopping lists that follow the questionnaire. General wellness only. */
const FATS = { avo: ['Avocado oil', 'high heat, mild taste'], tallow: ['Beef tallow', 'high heat, great for searing'], ghee: ['Ghee', 'high heat, buttery'], coco: ['Refined coconut oil', 'medium-high heat'], olive: ['Olive oil', 'gentle heat'] };
const KSTYLES = { m: 'Mediterranean', k: 'Low-carb', l: 'Lean protein', p: 'Plant-forward', q: 'Quick', x: 'Meal-prep' };
const KMEAL = { B: 'Breakfast', L: 'Lunch', D: 'Dinner', S: 'Snack', T: 'Treat' };
const MEAT_RX = /chicken|beef|steak|turkey|pork|bacon|lamb|sausage|\bham\b|pepperoni|jerky|brisket|veal|duck/i, FISH_RX = /salmon|tuna|\bcod\b|shrimp|sardine|anchov|fish|scallop|tilapia|halibut|crab|lobster|prawn|mussel|clam|oyster/i;
const DAIRY_RX = /egg|cheese|feta|yogurt|cottage|(?<!almond |coconut |oat |soy )milk|(?<!peanut |almond |nut |cashew )butter(?! lettuce)|ghee|cream|parmesan|mozzarella|cheddar|provolone|honey|mayo|whey/i;
const SEEDOIL_RX = /\b(vegetable|canola|sunflower|rapeseed|soybean|soya|corn|safflower|grapeseed|cottonseed|peanut|groundnut|sesame)\s+oil\b|margarine|\bshortening\b/ig;
const SPICY_RX = /chili|cayenne|jalape|hot sauce|curry|harissa|pepper flakes|chilli/i, ACID_RX = /tomato|lemon|lime|vinegar|orange|marinara|caper/i, PURINE_RX = /sardine|anchov|liver|mackerel|herring|scallop|mussel/i;
function kitFat() { const f = (S.kitchen && S.kitchen.fat) || 'avo', vg = S.settings.vegan || H().diet === 'vegan'; return vg && (f === 'tallow' || f === 'ghee') ? 'avo' : f; }
const kitTok = s => String(s || '').replace(/\{HF\}/g, FATS[kitFat()][0].toLowerCase()).replace(/\{EV\}/g, 'extra-virgin olive oil');
const kitSeedFix = s => String(s || '').replace(SEEDOIL_RX, () => FATS[kitFat()][0].toLowerCase());
const QF = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']];
function fmtQ(n) { if (!n) return ''; let w = Math.floor(n + 1e-9), f = n - w, best = QF[0], bd = 9; QF.forEach(q => { const d = Math.abs(f - q[0]); if (d < bd) { bd = d; best = q; } }); if (best[0] === 1) { w++; best = QF[0]; } return (w ? w : '') + best[1] || (n < 0.1 ? '1 pinch' : String(Math.round(n * 100) / 100)); }
let RECIPES = null;
function kitBuild() {
  if (RECIPES) return RECIPES;
  RECIPES = RECIPE_ROWS.map((r, i) => {
    const ings = r[10].split(';').map(x => { const p = x.split('|'); return { n: +p[0] || 0, u: p[1] || '', name: p[2] }; });
    const text = ings.map(g => g.name).join(' ; ');
    const lvl = MEAT_RX.test(text) ? 3 : FISH_RX.test(text) ? 2 : DAIRY_RX.test(text) ? 1 : 0;
    return { id: 'r' + i, name: r[0], meal: r[1], st: r[2], kcal: r[3], p: r[4], c: r[5], f: r[6], fib: r[7], min: r[8], serv: r[9], ings, steps: r[11].split('|'), tip: r[12], lvl, text, own: true };
  });
  return RECIPES;
}
const kitAll = () => kitBuild().concat((S.kitchen && S.kitchen.saved) || []);
function kitById(id) { return kitAll().find(r => r.id === id) || (UI.tmpR && UI.tmpR.id === id ? UI.tmpR : null) || ((kit().res && kit().res.length ? kit().res : []).concat((S.kitchen && S.kitchen.ideas && S.kitchen.ideas.items) || [])).find(x => x.id === id) || null; }
/* what the questionnaire says about this person and this recipe */
function kitFit(r) {
  const h = H(), c = condSet(), out = { hide: false, why: '', flags: [], score: 0 };
  const lim = { vegan: 0, veg: 1, pesc: 2, omni: 3 }[S.settings.vegan ? 'vegan' : (h.diet || 'omni')];
  if (r.lvl > lim) { out.hide = true; out.why = 'diet'; return out; }
  const ingNames = r.ings.map(g => (g.u && !g.n ? g.u + ' ' : '') + g.name);
  for (const a of (h.allergies || [])) { const bad = a === 'dairy' ? ingNames.some(n => DAIRY_RX.test(n) && !/egg|mayo|honey/i.test(n)) : ingNames.some(n => ALLERGENS[a] && ALLERGENS[a][1].test(n)); if (bad) { out.hide = true; out.why = 'allergy'; return out; } }
  if (c.has('celiac') && ingNames.some(n => ALLERGENS.gluten[1].test(n))) { out.hide = true; out.why = 'allergy'; return out; }
  const dis = (h.dislikes || '').toLowerCase().split(/[,;\n]+/).map(x => x.trim()).filter(x => x.length > 2); if (dis.some(d => r.text.toLowerCase().includes(d))) { out.hide = true; out.why = 'dislike'; return out; }
  const mode = modeOf(S.profile);
  if ((mode === 'lose' || mode === 'lose2') && r.meal !== 'T' && r.meal !== 'S') out.score += r.kcal <= 420 ? 2 : r.kcal > 520 ? -1 : 0;
  if (mode === 'gain' && (r.meal === 'D' || r.meal === 'L')) out.score += r.kcal >= 450 ? 2 : 0;
  if (r.p >= 28 && (mode === 'lose2' || mode === 'lose')) out.score += 1;
  if (['t2d', 't1d', 'prediab', 'pcos'].some(x => c.has(x))) { if (r.c > 30) { out.flags.push('Higher in carbs'); out.score -= 2; } else if (r.c <= 20) out.score += 2; }
  if (c.has('gerd') && (SPICY_RX.test(r.text) || ACID_RX.test(r.text))) { out.flags.push('May trigger reflux'); out.score -= 2; }
  if (c.has('gout') && PURINE_RX.test(r.text)) { out.flags.push('Higher in purines'); out.score -= 2; }
  if (c.has('kidney') && r.p > 30) { out.flags.push('High in protein for kidney disease'); out.score -= 3; }
  if (c.has('chol') && /bacon|sausage|lamb|cheddar/i.test(r.text)) { out.flags.push('Higher in saturated fat'); out.score -= 1; }
  if (c.has('htn') && /olive|caper|bacon|pickle|feta|parmesan|miso|aminos/i.test(r.text)) out.flags.push('Check salt: use low-sodium versions');
  if (S.kitchen && S.kitchen.liked && S.kitchen.liked[r.id]) out.score += 2;
  return out;
}
function kitSeed() { const d = new Date(), y = d.getFullYear(), j = new Date(y, 0, 1), wk = Math.floor(((d - j) / 86400000 + j.getDay()) / 7); return y * 100 + wk + ((S.kitchen && S.kitchen.shuf) || 0) * 7; }
function kitRand(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function kitWeek() {
  const rnd = kitRand(kitSeed() * 31 + 7), ok = kitAll().map(r => ({ r, f: kitFit(r) })).filter(x => !x.f.hide), pick = (meal, n) => {
    const pool = ok.filter(x => x.r.meal === meal && x.r.own).sort((a, b) => (b.f.score + rnd() * 3) - (a.f.score + rnd() * 3)); return pool.slice(0, n).map(x => x.r);
  };
  return { B: pick('B', 3), L: pick('L', 3), D: pick('D', 4), S: pick('S', 2), T: pick('T', 1) };
}
const kitMacroLine = r => r.kcal != null ? `${r.kcal} kcal · P ${r.p} · C ${r.c} · F ${r.f}` : 'Nutrition not listed';
function kitRow(r) {
  const f = kitFit(r), liked = S.kitchen.liked && S.kitchen.liked[r.id];
  return `<div class="entry" data-act="kitOpen" data-id="${r.id}"><div><b>${esc(r.name)}</b>${liked ? ' <span class="gold">&#9733;</span>' : ''}<div class="sm dim">${kitMacroLine(r)}${r.min ? ' · ' + r.min + ' min' : ''}</div>${f.flags.map(x => `<div class="sm" style="color:var(--gold)">${esc(x)}</div>`).join('')}</div><div class="sm dim">${esc((r.st || '').split('').map(k => KSTYLES[k]).filter(Boolean).slice(0, 2).join(', '))}</div></div>`;
}
const kitKeep = fn => { const sh = $('#sheet'), y = sh.scrollTop; fn(); sh.scrollTop = y; };
const kit = () => UI.kit || (UI.kit = { tab: 'menu', meal: 'all', style: 'all', res: null, q: '' });
function openKitchen() { if (!S.kitchen) S.kitchen = { fat: 'avo', plan: [], saved: [], liked: {}, have: {}, shuf: 0, ideas: null }; kitRender(); kitIdeasAuto(); }
function kitRender() {
  const K = kit(), tabs = [['menu', 'This week'], ['recipes', 'Recipes'], ['treats', 'Treats'], ['pantry', 'Pantry']];
  const seg = `<div class="seg four">${tabs.map(t => `<button class="${K.tab === t[0] ? 'on' : ''}" data-act="kitTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  kitKeep(() => openSheet('Kitchen', seg + ({ menu: kitMenu, recipes: kitRecipes, treats: kitTreats, pantry: kitPantry }[K.tab])()));
}
function kitMenu() {
  const w = kitWeek(), h = H(), names = { B: 'Breakfasts', L: 'Lunches', D: 'Dinners', S: 'Snacks', T: 'Treat' }, plan = S.kitchen.plan || [];
  const sub = [`${{ omni: 'all foods', pesc: 'pescatarian', veg: 'vegetarian', vegan: 'vegan' }[S.settings.vegan ? 'vegan' : (h.diet || 'omni')]}`, (h.allergies || []).length ? 'allergens hidden' : '', modeOf(S.profile) !== 'maintain' ? MODES[modeOf(S.profile)].label.toLowerCase() + ' plan' : ''].filter(Boolean).join(', ');
  const hidden = kitBuild().filter(r => kitFit(r).hide).length;
  return `<p class="dim sm">A fresh set of simple recipes every week, picked for you (${esc(sub)}).${hidden ? ` ${hidden} recipes are hidden because of your diet, allergies or dislikes.` : ''} Cooking fat: <b>${esc(FATS[kitFat()][0].toLowerCase())}</b>. Seed oils are left out.</p>
  ${['D', 'L', 'B', 'S', 'T'].map(m => w[m].length ? `<div class="ct"><span>${names[m]}</span></div>${w[m].map(kitRow).join('')}` : '').join('')}
  <div class="grid2"><button class="btn gold" data-act="kitWeekAdd">Add week to shopping list</button><button class="btn" data-act="kitShuf">Show other ideas</button></div>
  <button class="btn block" data-act="kitList">Shopping list${plan.length ? ' (' + plan.length + ' recipes)' : ''}</button>
  ${kitIdeasHTML()}
  <div class="ct"><span>Sunday prep, 90 minutes</span></div><div class="sm dim">1. Roast a tray of vegetables and bake or slow-cook one big protein (whole chicken, pulled chicken or meatballs).<br>2. Boil a dozen eggs and cook a pot of quinoa, lentils or cauliflower rice.<br>3. Shake up a jar of dressing: {EV}, lemon, mustard, herbs, salt.<br>4. Portion into 4 to 5 containers: protein, vegetables, a starch, and the dressing on the side.<br>5. Wash and cut raw vegetables and fruit for snacks.</div>`.replace(/\{EV\}/g, 'extra-virgin olive oil');
}
function kitIdeasHTML() {
  const I = S.kitchen.ideas; let h = `<div class="ct"><span>Fresh ideas from the web</span></div>`;
  if (I && I.items && I.items.length) h += I.items.map(kitRow).join('') + `<div class="sm dim">Found ${esc(I.when || '')} on TheMealDB, a free recipe site. Their text is adjusted here to leave out seed oils.</div>`;
  else h += '<div class="sm dim">Connect to the internet and Healthica brings in a few new recipes each week.</div>';
  return h + `<div class="row"><input id="kq" class="in" placeholder="Search any food, e.g. salmon, lentil, curry" value="${esc(kit().q || '')}"><button class="btn" data-act="kitFind">Search</button></div><div id="kres">${kitResHTML()}</div>`;
}
const kitResHTML = () => { const K = kit(); if (!K.res) return ''; if (K.res === 'loading') return '<div class="sm dim">Searching...</div>'; if (K.res === 'fail') return '<div class="sm dim">Could not reach the recipe site. Check your connection and try again.</div>'; return K.res.length ? K.res.map(kitRow).join('') : '<div class="sm dim">Nothing matched your diet and allergies. Try another word.</div>'; };
function kitRecipes() {
  const K = kit(), meals = [['all', 'All'], ['B', 'Breakfast'], ['L', 'Lunch'], ['D', 'Dinner'], ['S', 'Snacks']], sty = [['all', 'Any style']].concat(Object.keys(KSTYLES).map(k => [k, KSTYLES[k]]));
  const list = kitAll().filter(r => r.meal !== 'T' && (K.meal === 'all' || r.meal === K.meal) && (K.style === 'all' || (r.st || '').includes(K.style))).map(r => ({ r, f: kitFit(r) })).filter(x => !x.f.hide).sort((a, b) => b.f.score - a.f.score);
  return `<div class="chips c">${meals.map(m => `<button class="chip ${K.meal === m[0] ? 'on' : ''}" data-act="kitMeal" data-v="${m[0]}">${m[1]}</button>`).join('')}</div>
  <div class="chips c">${sty.map(m => `<button class="chip ${K.style === m[0] ? 'on' : ''}" data-act="kitStyle" data-v="${m[0]}">${m[1]}</button>`).join('')}</div>
  ${list.map(x => kitRow(x.r)).join('') || '<div class="sm dim">Nothing matches those filters and your profile.</div>'}
  <div class="sm dim">Best fits for you are listed first. Nutrition is approximate, per serving.</div>`;
}
function kitTreats() {
  const list = kitAll().filter(r => r.meal === 'T').map(r => ({ r, f: kitFit(r) })).filter(x => !x.f.hide).sort((a, b) => b.f.score - a.f.score);
  return `<p class="dim sm">Low-sugar, lower-calorie ways to handle a craving. Sweetness comes from fruit, cocoa, or a little monk fruit or stevia. Sugar alcohols (erythritol and similar) can upset digestion, so start small. Treats still count toward your day.</p>${list.map(x => kitRow(x.r)).join('')}`;
}
function kitPantry() {
  const c = condSet(), warn = [];
  if (['kidney', 'panc', 'gall', 'liver', 't1d', 'preg', 'bf', 'edhist', 'minor'].some(x => c.has(x))) warn.push('Your profile includes a condition where very low-carb or very high-protein eating needs a clinician’s guidance. Lean on the Mediterranean and plant-forward recipes.');
  if (['kidney', 't2d', 'htn'].some(x => c.has(x))) warn.push('Strict high-protein plans such as Dukan are cautioned against for kidney disease, diabetes and high blood pressure.');
  return `<div class="ct"><span>Cooking fat</span></div><div class="chips c">${Object.keys(FATS).filter(k => !((S.settings.vegan || H().diet === 'vegan') && (k === 'tallow' || k === 'ghee'))).map(k => `<button class="chip ${kitFat() === k ? 'on' : ''}" data-act="kitFat" data-v="${k}">${FATS[k][0]}</button>`).join('')}</div>
  <div class="sm dim">Recipes use your pick for hot cooking, and extra-virgin olive oil for dressings and finishing. Approximate smoke points: avocado oil about 500°F, ghee about 485°F, refined coconut oil about 400°F, extra-virgin olive oil about 375°F, butter about 350°F. Tallow is stable at high heat too (check your product). Canola, soybean, sunflower, corn and similar seed oils are left out.</div>
  <div class="ct"><span>Eating styles</span></div>
  <div class="sm"><b>Mediterranean.</b> <span class="dim">Vegetables, legumes, fish, olive oil, nuts and whole foods. The best-studied pattern for heart health.</span></div>
  <div class="sm"><b>Low-carb or keto-friendly.</b> <span class="dim">Eggs, meat, fish, leafy vegetables and healthy fats, few starches. Good for steady appetite, but not for everyone.</span></div>
  <div class="sm"><b>Lean protein (Dukan-inspired).</b> <span class="dim">Lean meats, fish, eggs, yogurt and vegetables. We borrow the lean protein idea, not the strict phases, which experts note are low in fibre and hard to sustain.</span></div>
  <div class="sm"><b>Plant-forward.</b> <span class="dim">Beans, lentils, tofu, vegetables and whole grains.</span></div>
  ${warn.map(w => `<div class="sm" style="color:var(--gold)">${esc(w)}</div>`).join('')}
  <div class="ct"><span>Pantry starters</span></div><div class="sm dim"><b>Always have:</b> eggs, plain Greek yogurt, a big bag of frozen vegetables, canned tuna or salmon, canned beans and tomatoes, lemons, garlic, onions, leafy greens.<br><b>Fats:</b> avocado oil, extra-virgin olive oil, ghee or tallow, olives, nuts.<br><b>Flavor:</b> salt, pepper, cumin, paprika, oregano, chili, Dijon mustard, vinegar, coconut aminos.<br><b>Grains and starch:</b> quinoa, lentils, oats if tolerated, sweet potatoes.</div>
  <p class="sm dim">Styles drawn from widely used Mediterranean, low-carb and lean-protein guidance, including Cleveland Clinic’s Dukan review. Nutrition numbers are estimates. Healthica is for general wellness and is not medical advice.</p>`;
}
/* recipe sheet */
function kitOpenRecipe(id, mult) {
  const r = kitById(id); if (!r) return; mult = mult || 1; const f = kitFit(r), liked = S.kitchen.liked[id], inPlan = (S.kitchen.plan || []).some(p => p.id === id);
  const ing = r.ings.map(g => `<li>${g.n ? fmtQ(g.n * mult) + ' ' : ''}${esc(kitSeedFix(kitTok(g.u)))}${g.u ? ' ' : ''}${esc(kitSeedFix(kitTok(g.name)))}</li>`).join('');
  openSheet(r.name, `<div class="sm dim">${esc(KMEAL[r.meal] || '')} · ${r.min ? r.min + ' min · ' : ''}makes ${r.serv ? Math.round(r.serv * mult * 10) / 10 + ' serving' + (r.serv * mult === 1 ? '' : 's') : 'a batch'}</div>
  ${r.kcal != null ? `<div class="macrorow"><span><b>${r.kcal}</b> kcal</span><span>P ${r.p} g</span><span>C ${r.c} g</span><span>F ${r.f} g</span><span>Fibre ${r.fib} g</span></div><div class="sm dim">Per serving, approximate.</div>` : '<div class="sm dim">Nutrition is not listed for web recipes.</div>'}
  ${f.flags.map(x => `<div class="sm" style="color:var(--gold)">${esc(x)}</div>`).join('')}
  ${r.own ? `<div class="seg small">${[[0.5, '½×'], [1, '1×'], [2, '2×'], [3, '3×']].map(m => `<button class="${m[0] === mult ? 'on' : ''}" data-act="kitScale" data-id="${id}" data-m="${m[0]}">${m[1]}</button>`).join('')}</div>` : ''}
  <div class="ct"><span>Ingredients</span></div><ul class="ul">${ing}</ul>
  <div class="sm dim">Cooking fat: ${esc(FATS[kitFat()][0].toLowerCase())}. Swap in tallow, ghee or refined coconut oil if you prefer. Seed oils are left out.</div>
  <div class="ct"><span>Steps</span></div><ol class="ol">${r.steps.map(s => `<li>${esc(kitSeedFix(kitTok(s)))}</li>`).join('')}</ol>
  ${r.tip ? `<div class="sm dim"><b>Tip:</b> ${esc(kitTok(r.tip))}</div>` : ''}
  <div class="grid2">${r.kcal != null ? `<button class="btn gold" data-act="kitLog" data-id="${id}">Log 1 serving</button>` : ''}<button class="btn ${inPlan ? 'on' : ''}" data-act="kitPlan" data-id="${id}" data-m="${mult}">${inPlan ? 'On my list' : 'Add to shopping list'}</button>
  <button class="btn" data-act="kitLike" data-id="${id}" data-m="${mult}">${liked ? 'Unfavorite' : 'Favorite'}</button><button class="btn" data-act="kitHome">Back</button></div>
  ${r.src ? `<div class="sm dim">Source: ${esc(r.src)}. Adapted to leave out seed oils.</div>` : ''}<p class="sm dim">General wellness only. Check ingredients against your own allergies and your care team’s advice.</p>`);
}
/* shopping list */
function kitCat(n) { return /chicken|beef|steak|turkey|pork|bacon|lamb|salmon|tuna|cod|shrimp|sardine|fillet|tofu|sausage|egg|jerky|ham\b|pepperoni/i.test(n) ? 'Protein' : /yogurt|cheese|feta|milk|cream|butter|ghee|parmesan|mozzarella|cheddar|cottage/i.test(n) ? 'Dairy and eggs' : /oil|salt|pepper|spice|powder|vinegar|sauce|mustard|broth|flour|bean|lentil|rice|quinoa|oat|nut|almond|walnut|seed|chia|cocoa|stevia|monk|honey|tahini|paste|cumin|paprika|oregano|cinnamon|coriander|thyme|flakes|hummus|chickpea|tomato(es)? \(|marinara|aminos|yeast|vanilla|baking|mayonnaise|olives|capers|can\b|chocolate|aminos/i.test(n) ? 'Pantry' : 'Produce'; }
function kitListData() {
  const m = {}; (S.kitchen.plan || []).forEach(p => { const r = kitById(p.id); if (!r) return; r.ings.forEach(g => { const nm = kitSeedFix(kitTok(g.name)), key = (g.n ? g.u + '|' : (g.u || '') + '|') + nm.toLowerCase(); if (/\bsalt and pepper\b|^water$/i.test(nm)) return; const e = m[key] || (m[key] = { name: nm, u: g.u, n: 0, raw: !g.n, from: new Set() }); e.n += g.n * (p.m || 1); e.from.add(r.name); }); });
  const cats = { Produce: [], Protein: [], 'Dairy and eggs': [], Pantry: [] }; Object.keys(m).forEach(k => { const e = m[k]; e.key = k; cats[kitCat(e.name)].push(e); }); Object.keys(cats).forEach(c => cats[c].sort((a, b) => a.name.localeCompare(b.name))); return cats;
}
function kitListText() { const c = kitListData(); return Object.keys(c).filter(k => c[k].length).map(k => k + '\n' + c[k].map(e => '- ' + (e.n ? fmtQ(e.n) + ' ' : '') + (e.u ? e.u + ' ' : '') + e.name).join('\n')).join('\n\n'); }
function kitListView() {
  const c = kitListData(), plan = S.kitchen.plan || [], have = S.kitchen.have || {};
  if (!plan.length) return openSheet('Shopping list', '<p class="dim">Your list is empty. Open a recipe and tap Add to shopping list, or add the whole week.</p><button class="btn block" data-act="kitHome">Back to Kitchen</button>');
  openSheet('Shopping list', `<div class="sm dim">${plan.length} recipes: ${plan.map(p => esc((kitById(p.id) || {}).name || '')).join(', ')}. Tick what you already have.</div>
  ${Object.keys(c).filter(k => c[k].length).map(k => `<div class="ct"><span>${k}</span></div>${c[k].map(e => `<label class="entry" style="align-items:center"><span><input type="checkbox" data-kithave="${esc(e.key)}" ${have[e.key] ? 'checked' : ''}> <span style="${have[e.key] ? 'text-decoration:line-through;opacity:.55' : ''}">${e.n ? fmtQ(e.n) + ' ' : ''}${e.u ? esc(e.u) + ' ' : ''}${esc(e.name)}</span></span></label>`).join('')}`).join('')}
  <div class="grid2"><button class="btn gold" data-act="kitCopy">Copy list</button><button class="btn" data-act="kitClear">Clear list</button></div><button class="btn block" data-act="kitHome">Back to Kitchen</button>`);
}
/* online ideas (TheMealDB, free) */
const MEALDB = 'https://www.themealdb.com/api/json/v1/1/';
async function kitFetch(path) { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000); try { const r = await fetch(MEALDB + path, { signal: ctl.signal }); if (!r.ok) throw 0; return await r.json(); } finally { clearTimeout(t); } }
function kitFromDB(m) {
  const ings = []; for (let i = 1; i <= 20; i++) { const n = (m['strIngredient' + i] || '').trim(), q = (m['strMeasure' + i] || '').trim(); if (n) ings.push({ n: 0, u: q, name: n }); }
  const text = ings.map(g => g.name).join(' ; '), cat = (m.strCategory || ''), lvl = cat === 'Vegan' ? 0 : MEAT_RX.test(text) || /Beef|Chicken|Lamb|Pork|Goat/.test(cat) ? 3 : FISH_RX.test(text) || cat === 'Seafood' ? 2 : DAIRY_RX.test(text) ? 1 : 0;
  return { id: 'm' + m.idMeal, name: m.strMeal, meal: 'D', st: '', kcal: null, p: null, c: null, f: null, fib: null, min: 0, serv: 0, ings, steps: String(m.strInstructions || '').split(/\r?\n+/).map(x => x.trim()).filter(x => x.length > 3), tip: '', lvl, text, src: 'TheMealDB' + (m.strArea ? ', ' + m.strArea + ' cuisine' : '') };
}
async function kitIdeasAuto() {
  const K = S.kitchen, wk = kitSeed(); if (K.ideas && K.ideas.wk === wk) return; if (!navigator.onLine) return;
  const d = S.settings.vegan ? 'vegan' : (H().diet || 'omni'), cats = { omni: ['Chicken', 'Seafood', 'Beef', 'Lamb', 'Pork'], pesc: ['Seafood', 'Vegetarian'], veg: ['Vegetarian'], vegan: ['Vegan'] }[d], cat = cats[wk % cats.length];
  try {
    const list = (await kitFetch('filter.php?c=' + cat)).meals || [], rnd = kitRand(wk), ids = []; while (ids.length < 5 && list.length) ids.push(list.splice(Math.floor(rnd() * list.length), 1)[0].idMeal);
    const items = []; for (const id of ids) { const m = ((await kitFetch('lookup.php?i=' + id)).meals || [])[0]; if (m) { const r = kitFromDB(m); if (!kitFit(r).hide) items.push(r); } if (items.length >= 3) break; }
    if (items.length) { K.ideas = { wk, when: 'this week', items }; save(); } if (UI.kit && UI.kit.tab === 'menu' && $('#sheet').classList.contains('open') && /Kitchen/.test($('#sheet .sh-bar b').textContent)) kitRender();
  } catch (e) { }
}
async function kitSearch(q) {
  const K = kit(); K.q = q; K.res = 'loading'; const el = $('#kres'); if (el) el.innerHTML = kitResHTML();
  try { const j = await kitFetch('search.php?s=' + encodeURIComponent(q)); K.res = (j.meals || []).map(kitFromDB).filter(r => !kitFit(r).hide).slice(0, 8); } catch (e) { K.res = 'fail'; }
  const e2 = $('#kres'); if (e2) e2.innerHTML = kitResHTML();
}
Object.assign(ACT, {
  kitchen() { openKitchen(); },
  kitTab(el) { kit().tab = el.dataset.v; kitRender(); },
  kitMeal(el) { kit().meal = el.dataset.v; kitRender(); }, kitStyle(el) { kit().style = el.dataset.v; kitRender(); },
  kitHome() { kitRender(); },
  kitOpen(el) { kitOpenRecipe(el.dataset.id, 1); },
  kitScale(el) { kitOpenRecipe(el.dataset.id, +el.dataset.m); },
  kitFat(el) { S.kitchen.fat = el.dataset.v; save(); kitRender(); },
  kitShuf() { S.kitchen.shuf = (S.kitchen.shuf || 0) + 1; save(); kitRender(); },
  kitPlan(el) { const id = el.dataset.id, p = S.kitchen.plan, i = p.findIndex(x => x.id === id); if (i >= 0) p.splice(i, 1); else { p.push({ id, m: +el.dataset.m || 1 }); const r = kitById(id); if (r && !r.own && !(S.kitchen.saved || []).some(x => x.id === id)) S.kitchen.saved.push(r); } save(); kitOpenRecipe(id, +el.dataset.m || 1); },
  kitLike(el) { const id = el.dataset.id; S.kitchen.liked[id] = !S.kitchen.liked[id]; if (S.kitchen.liked[id]) { const r = kitById(id); if (r && !r.own && !S.kitchen.saved.some(x => x.id === id)) S.kitchen.saved.push(r); } save(); kitOpenRecipe(id, +el.dataset.m || 1); },
  kitWeekAdd() { const w = kitWeek(); ['B', 'L', 'D', 'S', 'T'].forEach(m => w[m].forEach(r => { if (!S.kitchen.plan.some(p => p.id === r.id)) S.kitchen.plan.push({ id: r.id, m: 1 }); })); save(); kitListView(); toast('Added this week’s recipes.'); },
  kitList() { kitListView(); },
  kitCopy() { const t = kitListText(); const done = () => toast('List copied.'); try { navigator.clipboard.writeText(t).then(done, () => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); done(); }); } catch (e) { toast('Could not copy.'); } },
  kitClear() { S.kitchen.plan = []; S.kitchen.have = {}; save(); kitListView(); },
  kitFind() { const q = ($('#kq').value || '').trim(); if (q.length < 2) return toast('Type a food to search for.'); kitSearch(q); },
  kitLog(el) {
    const r = kitById(el.dataset.id); if (!r || r.kcal == null) return; const meal = { B: 'Breakfast', L: 'Lunch', D: 'Dinner' }[r.meal] || 'Snacks';
    S.food.push({ id: uid(), date: UI.date || dkey(), meal, name: r.name, cat: 'other', grams: 0, label: '1 serving · recipe', ts: Date.now(), kcal: r.kcal, p: r.p, c: r.c, f: r.f, fib: r.fib, n: {} }); save(); toast('Logged to ' + meal + '.');
  }
});
function tonightCard() {
  if (!S.kitchen) S.kitchen = { fat: 'avo', plan: [], saved: [], liked: {}, have: {}, shuf: 0, ideas: null };
  const w = kitWeek(), d = w.D, r = d.length ? d[new Date().getDate() % d.length] : null; if (!r) return '';
  return `<section class="card"><div class="ct"><span>Kitchen</span><a class="lnk" data-act="kitchen">Open</a></div><div class="entry" data-act="kitOpenK" data-id="${r.id}"><div><b>Tonight: ${esc(r.name)}</b><div class="sm dim">${kitMacroLine(r)} · ${r.min} min</div></div></div></section>`;
}
ACT.kitOpenK = function (el) { openKitchen(); kitOpenRecipe(el.dataset.id, 1); };
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.kithave !== undefined) { S.kitchen.have[t.dataset.kithave] = t.checked; save(); kitKeep(kitListView); } });
