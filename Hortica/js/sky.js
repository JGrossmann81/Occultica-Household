/* Hortica sky: sun and moon math, planetary hours, moon signs, equinoxes, and the best-time finder for sowing, transplanting, harvesting and pruning.
   Planetary and zodiac lore is tradition and folklore, kept for the craft of it. Real weather and frost always outrank it. */
const D2R = Math.PI / 180;
const jdOf = d => d.getTime() / 86400000 + 2440587.5;
const norm360 = x => ((x % 360) + 360) % 360;
function sunLongitude(d) { const T = (jdOf(d) - 2451545) / 36525, L0 = 280.46646 + 36000.76983 * T, M = (357.52911 + 35999.05029 * T) * D2R; return norm360(L0 + (1.914602 - .004817 * T) * Math.sin(M) + .019993 * Math.sin(2 * M) + .000289 * Math.sin(3 * M)); }
function moonLongitude(d) {
  const T = (jdOf(d) - 2451545) / 36525, Lp = 218.3164477 + 481267.88123421 * T, Dm = (297.8501921 + 445267.1114034 * T) * D2R, M = (357.5291092 + 35999.0502909 * T) * D2R, Mp = (134.9633964 + 477198.8675055 * T) * D2R, F = (93.272095 + 483202.0175233 * T) * D2R;
  return norm360(Lp + 6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * Dm - Mp) + .658314 * Math.sin(2 * Dm) + .213618 * Math.sin(2 * Mp) - .185116 * Math.sin(M) - .114332 * Math.sin(2 * F) + .058793 * Math.sin(2 * Dm - 2 * Mp) + .057066 * Math.sin(2 * Dm - M - Mp) + .053322 * Math.sin(2 * Dm + Mp) + .045758 * Math.sin(2 * Dm - M) - .040923 * Math.sin(M - Mp) - .034720 * Math.sin(Dm) - .030383 * Math.sin(M + Mp));
}
const SIGNS = [['Aries', '♈', 'fire', 'dry'], ['Taurus', '♉', 'earth', 'semi'], ['Gemini', '♊', 'air', 'barren'], ['Cancer', '♋', 'water', 'fruitful'], ['Leo', '♌', 'fire', 'barren'], ['Virgo', '♍', 'earth', 'barren'], ['Libra', '♎', 'air', 'semi'], ['Scorpio', '♏', 'water', 'fruitful'], ['Sagittarius', '♐', 'fire', 'dry'], ['Capricorn', '♑', 'earth', 'semi'], ['Aquarius', '♒', 'air', 'barren'], ['Pisces', '♓', 'water', 'fruitful']];
const SIGNADV = { Aries: 'Fire and dry. Good for weeding, clearing and harvest. Poor for sowing.', Taurus: 'Earth, semi-fruitful. Good for roots, bulbs and perennials.', Gemini: 'Air and barren. Weed, cultivate and turn compost. Do not sow.', Cancer: 'Water and the most fruitful sign. Sow, transplant and graft.', Leo: 'Fire and barren. Harvest, dry herbs, weed. Do not sow.', Virgo: 'Earth but barren. Good for cultivating, weeding and gathering.', Libra: 'Air, semi-fruitful, and the traditional flower sign. Plant flowers and vines.', Scorpio: 'Water and fruitful. Sow, transplant and propagate.', Sagittarius: 'Fire and dry. Harvest, dry herbs and prune. Poor for sowing.', Capricorn: 'Earth, semi-fruitful. Good for roots, bulbs and perennials.', Aquarius: 'Air and barren. Weed, cultivate and clear. Do not sow.', Pisces: 'Water and very fruitful. Sow, transplant and graft. Leaf crops especially.' };
function moonInfo(d) {
  d = d || NOW(); const ml = moonLongitude(d), el = norm360(ml - sunLongitude(d)), f = el / 360, ill = (1 - Math.cos(el * D2R)) / 2, age = f * 29.530588853;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  const idx = Math.floor(f * 8 + .5) % 8, icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'], si = Math.floor(ml / 30) % 12, sg = SIGNS[si];
  return { age, f, ill, el, lon: ml, name: names[idx], icon: icons[idx], waxing: el < 180, sign: sg[0], signIdx: si, sym: sg[1], elem: sg[2], fert: sg[3], note: f < .5 ? 'Waxing: old-timers sow above-ground crops (leaves, beans, tomatoes).' : 'Waning: old-timers plant roots, bulbs and perennials, prune, and weed.' };
}
/* the next time the sun-moon angle reaches a target (0 new, 90 first quarter, 180 full, 270 last quarter) */
function nextPhase(from, target) {
  const ang = t => norm360(moonLongitude(new Date(t)) - sunLongitude(new Date(t)) - target), step = 3 * 3600000; let t = from.getTime(), prev = ang(t);
  for (let i = 0; i < 260; i++) { const t2 = t + step, cur = ang(t2); if (cur < prev && prev > 300 && cur < 60) { let lo = t, hi = t2; for (let k = 0; k < 28; k++) { const mid = (lo + hi) / 2; if (ang(mid) > 180) lo = mid; else hi = mid; } return new Date((lo + hi) / 2); } prev = cur; t = t2; }
  return null;
}
function phasesBetween(a, b) { // every quarter phase in [a,b)
  const out = [], names = { 0: ['New moon', '🌑'], 90: ['First quarter', '🌓'], 180: ['Full moon', '🌕'], 270: ['Last quarter', '🌗'] };
  [0, 90, 180, 270].forEach(tg => { let t = new Date(a.getTime() - 86400000); for (let i = 0; i < 4; i++) { const n = nextPhase(t, tg); if (!n) break; if (n >= b) break; if (n >= a) out.push({ at: n, tg, name: names[tg][0], icon: names[tg][1] }); t = new Date(n.getTime() + 5 * 86400000); } });
  return out.sort((x, y) => x.at - y.at);
}
const FULLNAMES = ['Wolf Moon', 'Snow Moon', 'Worm Moon', 'Pink Moon', 'Flower Moon', 'Strawberry Moon', 'Buck Moon', 'Sturgeon Moon', 'Corn Moon', "Hunter's Moon", 'Beaver Moon', 'Cold Moon'];
function fullMoonName(at) { const y = at.getFullYear(), eq = equinoxes(y).sep; let m = at.getMonth(); if ((m === 8 || m === 9) && Math.abs(at - eq) <= 15 * 86400000) return 'Harvest Moon'; return FULLNAMES[m]; }
function equinoxes(y) { // Meeus approximation, good to a few minutes
  const Y = (y - 2000) / 1000, mk = (a, b, c, d, e) => { const jde = a + b * Y + c * Y * Y + d * Y * Y * Y + e * Y * Y * Y * Y; return new Date((jde - 2440587.5) * 86400000 - 69 * 1000); };
  return { mar: mk(2451623.80984, 365242.37404, .05169, -.00411, -.00057), jun: mk(2451716.56767, 365241.62603, .00325, .00888, -.0003), sep: mk(2451810.21715, 365242.01767, -.11575, .00337, .00078), dec: mk(2451900.05952, 365242.74049, -.06223, -.00823, .00032) };
}

/* ---------- sunrise and sunset (NOAA method) ---------- */
function sunCalc(y, m, d, lat, lon) {
  const jd0 = Date.UTC(y, m, d, 12) / 86400000 + 2440587.5, t = (jd0 - 2451545) / 36525, rad = D2R;
  const L0 = (280.46646 + t * (36000.76983 + t * .0003032)) % 360, M = 357.52911 + t * (35999.05029 - .0001537 * t), e = .016708634 - t * (.000042037 + .0000001267 * t);
  const C = Math.sin(M * rad) * (1.914602 - t * (.004817 + .000014 * t)) + Math.sin(2 * M * rad) * (.019993 - .000101 * t) + Math.sin(3 * M * rad) * .000289;
  const tl = L0 + C, om = 125.04 - 1934.136 * t, al = tl - .00569 - .00478 * Math.sin(om * rad);
  const mo = 23 + (26 + (21.448 - t * (46.815 + t * (.00059 - t * .001813))) / 60) / 60, oc = mo + .00256 * Math.cos(om * rad);
  const decl = Math.asin(Math.sin(oc * rad) * Math.sin(al * rad)), yy = Math.pow(Math.tan(oc * rad / 2), 2);
  const eq = 4 / rad * (yy * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * yy * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - .5 * yy * yy * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad));
  const cosH = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  const noonMin = 720 - 4 * lon - eq, base = Date.UTC(y, m, d), at = mm => new Date(base + mm * 60000);
  if (cosH > 1 || cosH < -1) return { noon: at(noonMin), rise: at(noonMin - 360), set: at(noonMin + 360), polar: cosH > 1 ? 'night' : 'day' };
  const ha = Math.acos(cosH) / rad; return { noon: at(noonMin), rise: at(noonMin - 4 * ha), set: at(noonMin + 4 * ha), polar: null };
}
function sunOn(date) { const L = S.loc; return sunCalc(date.getFullYear(), date.getMonth(), date.getDate(), +L.lat || 40, +L.lon || -90); }

/* ---------- planetary days and hours ---------- */
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAYRULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PSYM = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄' };
const PCOL = { Sun: '#e8c14b', Moon: '#b9c6d6', Mars: '#d9604d', Mercury: '#6fb5c9', Jupiter: '#7a8fd9', Venus: '#7fcf8e', Saturn: '#a58e75' };
const PINT = { Sun: 'vitality, success and joy', Moon: 'intuition, dreams and the home', Mars: 'courage, protection and drive', Mercury: 'clear thinking, learning and speed', Jupiter: 'abundance, luck and growth', Venus: 'love, beauty and harmony', Saturn: 'boundaries, patience and endurance' };
const WDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hoursCache = {};
function planetaryHours(date) { // 24 slots from this day's sunrise to the next sunrise
  const k = dkey(date) + '|' + S.loc.lat + '|' + S.loc.lon; if (hoursCache[k]) return hoursCache[k];
  const t0 = sunOn(date), t1 = sunOn(addD(date, 1)), dayR = DAYRULER[date.getDay()], si = CHALDEAN.indexOf(dayR), slots = [];
  const dl = (t0.set - t0.rise) / 12, nl = (t1.rise - t0.set) / 12;
  for (let i = 0; i < 24; i++) { const night = i >= 12, start = night ? t0.set.getTime() + (i - 12) * nl : t0.rise.getTime() + i * dl, len = night ? nl : dl; slots.push({ i, night, start: new Date(start), end: new Date(start + len), planet: CHALDEAN[(si + i) % 7] }); }
  const r = { date: dkey(date), day: dayR, wd: WDAY[date.getDay()], rise: t0.rise, set: t0.set, nextRise: t1.rise, slots, polar: t0.polar }; hoursCache[k] = r; return r;
}
function hourNow(now) { now = now || NOW(); let H = planetaryHours(now); if (now < H.rise) H = planetaryHours(addD(now, -1)); const s = H.slots.find(x => now >= x.start && now < x.end) || H.slots[0]; return { H, slot: s }; }
const tm = d => { let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + ap; };

/* ---------- which planet rules which plant (a common Culpeper-style scheme; authors differ) ---------- */
const RULER_TXT = `Su:corn grape fig blackwalnut lemon rosemary chamomile lovage bay curryleaf lemongrass turmeric saffron stjohnswort goldenseal ginseng astragalus marigold sunflower zinnia calendula strawflower gomphrena blackeyedsusan peony crocus dahlia chrysanthemum tithonia safflower coreopsis californiapoppy
Mo:lettuce spinach kale collard cabbage broccoli cauli brussels kohlrabi bokchoy cucumber zucchini winsq pumpkin melon cantaloupe lemonbalm eveningprimrose jiaogulan aloe petunia moonflower milkweed iris lily daylily hydrangea forgetmenot sedum gardenia poppy
Ma:pepper hotpep onion garlic leek radish arugula gooseberry daikon basil tarragon chives garlicchives thaibasil perilla epazote culantro cumin nigella mustard horseradish ginger galangal echinacea milkthistle ashwagandha nettle hawthorn hops sweetwoodruff perillared nasturtium snapdragon celosia delphinium lupine allium gladiolus canna pyrethrum penstemon gaillardia
Me:carrot celery parsley cilantro dill oregano lavender fennel marjoram summersavory wintersavory chervil lemonverbena anise caraway fenugreek ajwain valerian licorice mulberry hazelnut cleome fouroclock muscari honeysuckle clematis ammi
Ju:sage borage tulsi anisehyssop hyssop pineapplesage dandelion chicory woodbetony costmary blueberry currant dianthus salvia hyacinth jasmine liatris pecan
Ve:tomato eggplant sweetpot bushbean polebean peas okra rhubarb strawberry raspberry blackberry elderberry apple pear peach plum sweetcherry tartcherry apricot rose clover buckwheat thyme mint peppermint spearmint catnip yarrow beebalm sorrel stevia scentedgeranium feverfew passionflower motherwort marshmallow plantain selfheal burdock redclover hibiscus vervain elderflower cosmos alyssum daffodil sweetpea pansy verbena lobelia phlox ageratum hollyhock foxglove columbine aster goldenrod catmint tulip lilac hellebore violet primrose bleedingheart camellia hardyhibiscus geranium tansy mallow scabiosa wildmix
Sa:potato beet turnip parsnip chard comfrey skullcap mullein rye cornflower statice fritillaria nicotiana`;
const RULER = {}; { const code = { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn' }; RULER_TXT.split('\n').forEach(l => { const i = l.indexOf(':'); l.slice(i + 1).trim().split(/\s+/).forEach(id => { RULER[id] = code[l.slice(0, i)]; }); }); }
function rulerOf(p) { if (RULER[p.id]) return RULER[p.id]; if (p.fung) return p.id === 'reishi' || p.id === 'shiitake' || p.id === 'turkeytail' ? 'Saturn' : 'Moon'; if (p.cat === 'fl') return 'Venus'; if (p.cat === 'c') return 'Saturn'; if (p.cat === 't') return 'Jupiter'; if (p.cat === 'f' || p.cat === 's') return 'Venus'; if (p.cat === 'h') return 'Mercury'; return p.moon === 'd' ? 'Saturn' : 'Moon'; }
function isCold(p) { return !p.sow.some(s => (s.k === 'i' || s.k === 't' || s.k === 'd') && s.w >= 0) && !!p.sow.length; } // can go out before the last frost

/* ---------- best time finder ---------- */
const ACTS = { sow: ['🌱', 'Sow or plant'], trans: ['🪴', 'Transplant'], harv: ['🧺', 'Harvest'], prune: ['✂️', 'Prune or weed'] };
function dayWx(date) { const w = S.wx; if (!w || !w.days) return null; return w.days.find(x => x.d === dkey(date)) || null; }
function scoreSlot(p, act, slot, mi, H, wx) {
  let sc = 0; const why = [], warn = [], R = rulerOf(p), hp = slot.planet, up = p.moon === 'u' || (p.moon !== 'd');
  const h = slot.start.getHours() + slot.start.getMinutes() / 60;
  if (act === 'sow' || act === 'trans') {
    if (hp === R) { sc += 3; why.push(hp + ' hour: the hour of ' + p.n.toLowerCase() + "'s own planet"); }
    else if (hp === 'Venus' || hp === 'Jupiter') { sc += 1.5; why.push(hp + ' hour favors growth and abundance'); }
    else if (hp === 'Sun') { sc += 1; why.push('Sun hour brings vigor'); } else if (hp === 'Moon') { sc += act === 'sow' && up ? 1.5 : 1; why.push('Moon hour favors seedlings and leafy growth'); }
    else if (hp === 'Mars') { sc -= 1; warn.push('Mars hour: not a planting hour'); } else if (hp === 'Saturn') { if (!up || p.perm) { sc += 1; why.push('Saturn hour suits roots, bulbs and perennials'); } else { sc -= 1; warn.push('Saturn hour slows growth'); } }
    if (H.day === R) { sc += 2; why.push('a ' + H.wd + ', the day of ' + R); }
    if (up) { if (mi.waxing) { sc += 2; why.push('waxing moon (sow above-ground crops)'); } else { sc -= .5; warn.push('waning moon is better for roots and bulbs'); } }
    else { if (!mi.waxing) { sc += 2; why.push('waning moon (plant roots, bulbs, perennials)'); } else { sc -= .5; warn.push('waxing moon is better for above-ground crops'); } }
    if (mi.fert === 'fruitful') { sc += 2; why.push('moon in ' + mi.sign + ', a fruitful sign'); } else if (mi.fert === 'semi') { sc += 1; why.push('moon in ' + mi.sign + ', a semi-fruitful sign'); } else { sc -= 1; warn.push('moon in ' + mi.sign + ', a ' + mi.fert + ' sign'); }
    if (p.cat === 'fl' && (mi.sign === 'Libra')) { sc += 1.5; why.push('Libra is the traditional flower sign'); }
    if (!up && (mi.sign === 'Taurus' || mi.sign === 'Capricorn')) { sc += 1; why.push(mi.sign + ' favors roots'); }
    if (mi.f < .03 || mi.f > .97) { sc -= 1.5; warn.push('new moon: a resting time'); }
  } else if (act === 'harv') {
    if (hp === R) { sc += 3; why.push(hp + ' hour: the hour of its own planet, said to hold the most virtue'); } else if (hp === 'Sun' && (p.cat === 'fl' || p.cat === 'f' || p.cat === 'v')) { sc += 1.5; why.push('Sun hour for flowers and fruit'); } else if (hp === 'Moon') { sc += 1; why.push('Moon hour for juicy leaves and herbs'); } else if (hp === 'Saturn' && !up) { sc += 1.5; why.push('Saturn hour for roots and storage crops'); } else if (hp === 'Venus' || hp === 'Jupiter') { sc += .5; }
    if (H.day === R) { sc += 2; why.push('a ' + H.wd + ', the day of ' + R); }
    const dry = /(dried|d)/.test(((FLOWER_INFO[p.id] || {}).tags || []).join(',')) || !!HERB_INFO[p.id];
    if (!mi.waxing && dry) { sc += 2; why.push('waning moon (better drying and keeping)'); } else if (mi.f > .42 && mi.f < .58) { sc += 1.5; why.push('near the full moon (fullest for fresh eating and potency)'); }
    if (mi.fert === 'barren' || mi.fert === 'dry') { sc += 1; why.push('moon in ' + mi.sign + ', a good gathering sign'); }
    if (h >= 7 && h < 11.5) { sc += 1.5; why.push('morning, after the dew dries'); } else if (h >= 12 && h < 16 && (p.cat === 'h' || p.cat === 'fl')) { sc -= 1; warn.push('hot afternoon: herbs and blooms wilt'); }
  } else {
    if (hp === 'Saturn' || hp === 'Mars') { sc += 2.5; why.push(hp + ' hour: classic for cutting back and banishing pests'); } else if (hp === R) { sc -= 1; warn.push('this is the plant\'s own hour: better for tending than cutting'); }
    if (!mi.waxing) { sc += 2; why.push('waning moon (cutting back heals faster and weeds regrow slowly)'); } else { sc -= .5; warn.push('waxing moon pushes regrowth'); }
    if (mi.fert === 'barren' || mi.fert === 'dry') { sc += 1.5; why.push('moon in ' + mi.sign + ', a barren sign: best for weeding and pruning'); }
  }
  /* practical weather and heat */
  if (wx) {
    if (wx.lo != null && wx.lo <= 33 && act !== 'prune' && !(act === 'harv') && !isCold(p)) { sc -= 5; warn.push('frost expected (low ' + Math.round(wx.lo) + ' F): wait'); }
    else if (wx.lo != null && wx.lo <= 28 && act === 'trans') { sc -= 4; warn.push('hard freeze'); }
    if (wx.hi >= 92 && (act === 'sow' || act === 'trans') && h >= 11 && h < 17) { sc -= 2; warn.push('midday heat of ' + Math.round(wx.hi) + ' F'); } else if (wx.hi >= 92 && act === 'trans' && h >= 17) { sc += 1; why.push('evening cool for transplanting'); }
    if (wx.rain >= .8) { sc -= 1.5; warn.push('heavy rain forecast (' + wx.rain.toFixed(1) + ' in)'); } else if (wx.rain >= .1 && wx.rain < .5 && act !== 'harv') { sc += .5; why.push('light rain to settle it in'); }
    if (wx.wind != null && wx.wind >= 28) { sc -= 1; warn.push('windy (' + Math.round(wx.wind) + ' mph)'); }
  } else if (act === 'trans' && h >= 16 && h < 19.5) { sc += .8; why.push('late afternoon: gentler on transplants'); } else if ((act === 'sow' || act === 'trans') && h >= 11.5 && h < 15.5) { sc -= .8; }
  return { sc, why, warn };
}
function bestTimes(p, act, opt) {
  opt = opt || {}; const now = NOW(), span = opt.days || 14, from = opt.from || now, night = !!(S.sky && S.sky.night) || !!opt.night, out = [];
  for (let d = 0; d < span; d++) {
    const day = addD(from, d), H = planetaryHours(day), wx = dayWx(day); let best = null;
    H.slots.forEach(s => { if (s.end <= now) return; if (s.night && !night) return; const mid = new Date((s.start.getTime() + s.end.getTime()) / 2), mi = moonInfo(mid), r = scoreSlot(p, act, s, mi, H, wx); if (!best || r.sc > best.sc) best = { slot: s, mi, H, r, sc: r.sc }; });
    if (best) out.push({ date: day, start: best.slot.start, end: best.slot.end, planet: best.slot.planet, day: best.H.wd, moon: best.mi, score: best.sc, stars: clamp(Math.round(best.sc / 2), 1, 5), why: best.r.why, warn: best.r.warn, night: best.slot.night });
  }
  return out.sort((a, b) => b.score - a.score || a.start - b.start);
}
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
function whenText(b) { const d = b.start; return WDAY[d.getDay()].slice(0, 3) + ' ' + fmtD(d) + ', ' + tm(b.start) + ' to ' + tm(b.end); }
function timingBlock(p, act, n) { // compact HTML for tile and plant sheets
  const L = bestTimes(p, act, { days: 14 }).slice(0, n || 3); if (!L.length) return '';
  return '<div class="flag moon"><b>' + ACTS[act][0] + ' Best times to ' + ACTS[act][1].toLowerCase() + ' (next 2 weeks)</b>' + L.map(b => '<div class="bt"><span class="pl" style="color:' + PCOL[b.planet] + '">' + PSYM[b.planet] + '</span><div><b>' + esc(whenText(b)) + '</b> <span class="gold">' + stars(b.stars) + '</span><br><span class="sm dim">' + esc(b.why.slice(0, 3).join('; ')) + '.' + (b.warn.length ? ' Watch: ' + esc(b.warn[0]) + '.' : '') + '</span></div></div>').join('') + '<p class="sm dim">' + moonLine(p) + '</p></div>';
}
function moonLine(p) { const R = rulerOf(p); return PSYM[R] + ' ' + esc(p.n) + ' is ruled by ' + R + ' (' + PINT[R] + '). Speak that intention as you plant. Planetary and moon lore is tradition; frost and rain still win.'; }
function dayVerdict(date) { // quick label for the calendar
  const mi = moonInfo(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)); const tags = [];
  if (mi.waxing && (mi.fert === 'fruitful' || mi.fert === 'semi')) tags.push(['sow', '🌱']);
  if (!mi.waxing && (mi.elem === 'earth') && mi.fert !== 'barren') tags.push(['root', '🥕']);
  if (mi.sign === 'Libra') tags.push(['flower', '🌸']);
  if (mi.fert === 'barren' || mi.fert === 'dry') tags.push(['weed', '✂️']);
  return { mi, tags };
}

function bestHint(p, act) { // one short sentence for a task row
  try { const b = bestTimes(p, act, { days: 10 })[0]; if (!b || b.stars < 3) return ''; return ' Best hour: ' + WDAY[b.start.getDay()].slice(0, 3) + ' ' + fmtD(b.start) + ', ' + tm(b.start) + ' ' + PSYM[b.planet] + ' ' + stars(b.stars) + '.'; } catch (e) { return ''; }
}

function skyContext() { // a line of sky and weather facts for the Garden Sage
  try { const m = moonInfo(), h = hourNow(), W = wxSummary(); return ' Sky today: ' + m.name + ' in ' + m.sign + ' (' + (m.waxing ? 'waxing' : 'waning') + '), ' + h.H.wd + ', the ' + h.slot.planet + ' hour now.' + (W ? ' Forecast: highs up to ' + Math.round(W.maxNext) + ' F, lows down to ' + Math.round(W.minNext) + ' F, about ' + W.rainNext.toFixed(1) + ' in of rain in the next 7 days.' : ''); } catch (e) { return ''; }
}
