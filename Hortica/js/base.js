/* Hortica core: store, helpers, plant book parser, companion rules, frost dates, moon, weather, sheets. */
const KEY = 'hortica.v1';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOW = () => new Date(window.__now || Date.now());
const MS = 86400000;
const dkey = d => { d = d || NOW(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const pd = k => { const a = String(k).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); };
const addD = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + Math.round(n)); return x; };
const dayDiff = (a, b) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()) - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / MS);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = d => MON[d.getMonth()] + ' ' + d.getDate();
const fmtDY = d => fmtD(d) + ', ' + d.getFullYear();
const doyDate = (y, doy) => new Date(y, 0, doy);
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- store ---------- */
function blank() {
  return { v: 1, setup: false, loc: { name: '', lat: 40, lon: -90, zone: '', last: 110, first: 295, src: 'estimate', zip: '' }, settings: { soil: 'loam', moon: true, sound: true, apiKey: '', model: 'claude-sonnet-5-5', bounty: 5, mulch: false }, sky: { night: false, mag: true }, wxn: null, harv: [], seeds: {}, hist: [], photos: [], tomb: {}, start: null, sync: { on: false, t: 0 },
    gardens: [], cur: null, curBy: {}, spores: [], watered: {}, log: [], wx: null, gopher: { ev: [], kills: 0, best: 0, ach: {}, lastKill: null }, done: {}, chat: [], favs: {} };
}
let S = blank();
function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v) { S = Object.assign(blank(), j); S.settings = Object.assign(blank().settings, j.settings || {}); S.gopher = Object.assign(blank().gopher, j.gopher || {}); S.loc = Object.assign(blank().loc, j.loc || {}); S.curBy = S.curBy || {}; S.spores = S.spores || []; S.sky = Object.assign(blank().sky, j.sky || {}); S.harv = S.harv || []; S.seeds = S.seeds || {}; S.hist = S.hist || []; S.photos = S.photos || []; S.tomb = S.tomb || {}; S.sync = Object.assign(blank().sync, j.sync || {}); if (S.cur && !S.curBy.veg) S.curBy.veg = S.cur; } } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function newGarden(name, w, h, ft) { return { id: uid(), name: name || 'My garden', w: w || 10, h: h || 8, ft: ft || 2, soil: S.settings.soil || 'loam', cells: {}, made: dkey() }; }
const gk = g => (g && g.kind) || 'veg';
function GK(kind) { const L = S.gardens.filter(x => gk(x) === kind); return L.find(x => x.id === (S.curBy || {})[kind]) || L[0] || null; }
function curKind() { return UI.tab === 'fungi' ? 'fungi' : (UI.gk || 'veg'); }
function G() { return GK(curKind()); }
function setCur(g) { S.curBy = S.curBy || {}; S.curBy[gk(g)] = g.id; if (gk(g) === 'veg') S.cur = g.id; }
function gardensOf(kind) { return S.gardens.filter(x => gk(x) === kind); }
function allPlantIds() { const o = []; plantGardens().forEach(g => Object.keys(g.cells).forEach(k => { const p = g.cells[k].p; if (!isSp(p) && o.indexOf(p) < 0) o.push(p); })); return o; }
function plantGardens() { return S.gardens.filter(x => gk(x) !== 'fungi'); }
function logIt(msg) { S.log.unshift({ d: dkey(), msg }); if (S.log.length > 120) S.log.length = 120; }

/* ---------- plant book ---------- */
function parseSow(s) { const out = []; String(s || '').split(/\s+/).forEach(t => { const m = /^(i|t|d|f|pe|dm)([+-]?\d+)?$/.exec(t); if (m) out.push({ k: m[1], w: m[2] ? +m[2] : 0 }); }); return out; }
const CATS = { v: 'Vegetable', h: 'Herb', fl: 'Flower', f: 'Fruit or berry', s: 'Shrub or vine', t: 'Tree', su: 'Cactus or succulent', g: 'Grass, groundcover or shade plant', hp: 'Houseplant', aq: 'Water, bog or carnivorous plant', co: 'Coastal plant', c: 'Cover crop' };
const CAT_NAMES = [['v', 'Vegetables'], ['h', 'Herbs'], ['fl', 'Flowers'], ['f', 'Berries and fruit'], ['s', 'Shrubs and vines'], ['t', 'Trees'], ['su', 'Cacti and succulents'], ['c', 'Cover crops']];
const FEEDN = { H: 'Heavy feeder', M: 'Medium feeder', L: 'Light feeder', N: 'Fixes nitrogen' };
const SUNN = { F: 'Full sun', P: 'Part sun', S: 'Shade tolerant' };
const WATN = { 1: 'Low water', 2: 'Medium water', 3: 'High water' };
const PLANTS = [], PBY = {};
const LAND_KINDS = {
  tree: { e: '🌲', n: 'Trees', a: 'a tree', w: 'tree', q: 'Search: apple, shade, oak, citrus, evergreen, small yard...', src: [TREE1_TXT, TREE2_TXT] },
  shrub: { e: '🌳', n: 'Shrubs', a: 'a shrub', w: 'shrub', q: 'Search: hedge, berries, purple, shade, deer...', src: [SHRUB_TXT] },
  vine: { e: '🍇', n: 'Vines', a: 'a vine', w: 'vine', q: 'Search: grape, trellis, fragrant, hummingbird, wall...', src: [VINE_TXT] },
  succ: { e: '🌵', n: 'Succulents', a: 'a cactus or succulent', w: 'succulent', q: 'Search: agave, spineless, pot, pink, hardy...', src: [SUCC_TXT] },
  ground: { e: '🌾', n: 'Ground and shade', a: 'a grass, groundcover or shade plant', w: 'ground cover', q: 'Search: fern, hosta, lawn, bulb, deer, shade...', src: [GRND1_TXT, GRND2_TXT] },
  house: { e: '🪴', n: 'Houseplants', a: 'a houseplant', w: 'houseplant', q: 'Search: low light, pet safe, hanging, easy...', src: [HOUSE_TXT] },
  wet: { e: '💧', n: 'Water and bog', a: 'a water, bog or carnivorous plant', w: 'water plant', q: 'Search: lily, pitcher, rain garden, cattail, flytrap...', src: [WET_TXT] },
  coast: { e: '🏖️', n: 'Coastal', a: 'a coastal plant', w: 'coastal plant', q: 'Search: salt, dune, wind, sea, edible...', src: [COAST_TXT] }
};
const LAND_ORDER = Object.keys(LAND_KINDS), LAND_INFO = {}, LAND_OF = {};
LAND_ORDER.forEach(k => LAND_KINDS[k].src.forEach(t => t.trim().split('\n').forEach(l => { if (l.indexOf('|') > 0 && l.charAt(0) !== '/') LAND_OF[l.split('|')[0]] = k; })));
const LAND_TXT = LAND_ORDER.map(k => LAND_KINDS[k].src.join('\n')).join('\n');
const permLike = p => !!p.perm || (!!p.lk && !(p.lk === 'vine' && LAND_INFO[p.id] && LAND_INFO[p.id].tags.indexOf('a') >= 0));
const bloomy = p => p.cat === 'fl' || p.lk === 'succ' || (!!p.lk && !(['tree', 'shrub', 'vine'].indexOf(p.lk) >= 0 && LAND_INFO[p.id] && LAND_INFO[p.id].tags.indexOf('e') >= 0));
const HERB_IDS = new Set(HERB_TXT.trim().split('\n').map(l => l.split('|')[0]));
(PLANT_TXT + '\n' + HERB_TXT + '\n' + FLOWER_TXT + '\n' + FLOWER2_TXT + '\n' + VEG2_TXT + '\n' + FRUIT2_TXT + '\n' + LAND_TXT).trim().split('\n').forEach(l => {
  if (l.indexOf('|') < 0 || l.charAt(0) === '/') return; const f = l.split('|'); if (f.length < 19) return;
  const p = { id: f[0], e: f[1], n: f[2], cat: f[3], fam: f[4], sun: f[5], wat: +f[6], feed: f[7], sp: +f[8] || 12, days: +f[9] || 60, hw: +f[10] || 3, sow: parseSow(f[11]), sowRaw: f[11], ph: f[12], zones: f[13], h: +f[14] || 12, moon: f[15], vars: f[16], how: f[17], tip: f[18] };
  p.tree = p.cat === 't' || p.cat === 's' || (p.cat === 'f' && p.h > 60); p.perm = p.sow.some(x => x.k === 'pe' || x.k === 'dm'); p.herb = !!HERB_INFO[p.id] || p.cat === 'h'; p.hx = HERB_IDS.has(p.id); p.fx = FLOWER_IDS.has(p.id); p.flw = !!FLOWER_INFO[p.id];
  if (f.length >= 25 && LAND_OF[p.id]) { LAND_INFO[p.id] = { tags: f[19].split(',').map(x => x.trim()).filter(Boolean), bloom: f[20], colors: f[21], uses: f[22], role: f[23], caution: f[24] }; p.lk = LAND_OF[p.id]; p.shx = p.lk === 'shrub'; p.scx = p.lk === 'succ'; }
  PLANTS.push(p); PBY[p.id] = p;
});
const SPECIAL = { _path: ['Path', '#8a7b5c', '🟫'], _water: ['Water source', '#3d82b8', '💧'], _compost: ['Compost', '#6b4a2b', '♻️'], _struct: ['Shed or fence', '#555f5a', '🏠'], _rock: ['Rock or stump', '#7b7f7c', '🪨'], _bed: ['Bare soil', '#4a3626', ''] };
const isSp = id => id && id.charAt(0) === '_';
const pName = id => PBY[id] ? PBY[id].n : (SPECIAL[id] ? SPECIAL[id][0] : id);
function plantCost(p) { return Math.max(1, Math.round(p.sp)); }

/* ---------- companion rules ---------- */
function tokMatch(t, id) {
  if (t.charAt(0) === '@') return PBY[id] && PBY[id].fam === t.slice(1);
  if (t.charAt(0) === '%') return (GROUPS[t.slice(1)] || []).indexOf(id) >= 0;
  return t === id;
}
const RULES = [];
function buildRules() {
  const add = (txt, kind) => txt.trim().split('\n').forEach(l => { const f = l.split('|'); const ab = f[0].split(','); RULES.push({ a: ab[0], b: ab[1], why: f[1], r: f[2] ? +f[2] : 0, k: kind }); });
  GROUPS.root = ['carrot', 'beet', 'potato', 'parsnip', 'turnip', 'radish', 'sweetpot']; add(GOOD_TXT, 'good'); add(BAD_TXT, 'bad'); add(FLOWER_GOOD_TXT, 'good'); add(FLOWER_BAD_TXT, 'bad'); [VEG2_GOOD_TXT, FRUIT2_GOOD_TXT, FLOWER2_GOOD_TXT, SHRUB_GOOD_TXT, SUCC_GOOD_TXT, TREE1_GOOD_TXT, TREE2_GOOD_TXT, VINE_GOOD_TXT, GRND1_GOOD_TXT, GRND2_GOOD_TXT, HOUSE_GOOD_TXT, WET_GOOD_TXT, COAST_GOOD_TXT].forEach(t => add(t, 'good')); [VEG2_BAD_TXT, FRUIT2_BAD_TXT, FLOWER2_BAD_TXT, SHRUB_BAD_TXT, SUCC_BAD_TXT, TREE1_BAD_TXT, TREE2_BAD_TXT, VINE_BAD_TXT, GRND1_BAD_TXT, GRND2_BAD_TXT, HOUSE_BAD_TXT, WET_BAD_TXT, COAST_BAD_TXT].forEach(t => add(t, 'bad'));
}
buildRules();
function relation(a, b) { // all rules that apply between plant ids a and b (order independent)
  const out = [];
  if (a === b) return out;
  RULES.forEach(r => { if ((tokMatch(r.a, a) && tokMatch(r.b, b)) || (tokMatch(r.a, b) && tokMatch(r.b, a))) out.push(r); });
  return out;
}
function rangeFt(g) { return Math.max(3, g.ft * 1.5); }
function overlaysOf(g) { return S.gardens.filter(x => gk(x) === 'flower' && x.over === g.id); }
function baseOf(g) { return g && g.over ? (S.gardens.find(x => x.id === g.over) || null) : null; }
/* every plant that shares this map: its own tiles, plus the base map under a flower overlay, plus any flower overlays on it */
function layerItems(g) {
  const items = [], add = gg => Object.keys(gg.cells).forEach(k => { const c = gg.cells[k]; if (isSp(c.p) || (PBY[c.p] && PBY[c.p].fung)) return; const a = k.split(','); items.push({ k, x: +a[0], y: +a[1], p: c.p, g: gg.id }); });
  add(g); if (gk(g) === 'flower') { const b = baseOf(g); if (b) add(b); } else overlaysOf(g).forEach(add);
  return items;
}
/* evaluate a garden: returns {pairs, state: {tile: 'good'|'bad'}, shade, thirst} */
function companionReport(g) {
  const items = layerItems(g), pairs = {}, state = {}, shade = [], seenShade = {}, rf = rangeFt(g), byP = {};
  items.forEach(it => { (byP[it.p] = byP[it.p] || []).push(it); });
  const ids = Object.keys(byP), dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * g.ft;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const rels = relation(ids[i], ids[j]); if (!rels.length) continue;
    byP[ids[i]].forEach(ia => byP[ids[j]].forEach(ib => {
      const d = dist(ia, ib);
      rels.forEach(r => {
        const lim = r.r || rf; if (d > lim) return;
        const pk = r.k + '|' + [ids[i], ids[j]].sort().join('|') + (r.k === 'bad' ? '' : '|' + r.why);
        const o = pairs[pk] = pairs[pk] || { a: ids[i], b: ids[j], kind: r.k, why: r.why, n: 0 };
        o.n++;
        [ia.k, ib.k].forEach(k => { if (r.k === 'bad') state[k] = 'bad'; else if (!state[k]) state[k] = 'good'; });
      });
    }));
  }
  const thirst = [];
  if ((gk(g) !== 'veg' && gk(g) !== 'fungi') || overlaysOf(g).length) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const A = PBY[ids[i]], B = PBY[ids[j]]; if (!A || !B || Math.abs(A.wat - B.wat) < 2) continue; let near = false;
    byP[ids[i]].forEach(ia => byP[ids[j]].forEach(ib => { if (dist(ia, ib) <= rf) near = true; }));
    if (near && thirst.length < 6) thirst.push({ a: A.id, b: B.id, dry: A.wat < B.wat ? A.id : B.id, wet: A.wat < B.wat ? B.id : A.id });
  }
  // shade: tall plant to the south (larger y) shades sun-lovers to its north
  const at = {}; items.forEach(it => { (at[it.k] = at[it.k] || []).push(it); });
  items.forEach(tt => {
    const t = PBY[tt.p]; if (!t || t.h < 48) return; const reach = Math.ceil((t.h / 12) / g.ft);
    for (let dy = 1; dy <= Math.min(reach, 8); dy++) for (let dx = -1; dx <= 1; dx++) {
      (at[(tt.x + dx) + ',' + (tt.y - dy)] || []).forEach(c => { const sp = PBY[c.p]; if (sp && sp.sun === 'F' && sp.h < t.h / 2 && sp.cat !== 'c') { const sk = sp.id + '|' + t.id; if (!seenShade[sk]) { seenShade[sk] = 1; shade.push({ low: sp.id, tall: t.id }); } } });
    }
  });
  return { pairs: Object.values(pairs), state, shade, thirst };
}
/* quick answer for the plant picker: how does a candidate fit around this tile? */
function fitHere(g, x, y, id) {
  const rf = rangeFt(g), out = { good: [], bad: [] }; const seen = {};
  layerItems(g).forEach(c => {
    if (c.p === id) return; const d = Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) * g.ft;
    relation(id, c.p).forEach(r => { if (d > (r.r || rf)) return; const sk = r.k + c.p; if (seen[sk]) return; seen[sk] = 1; out[r.k].push({ p: c.p, why: r.why }); });
  });
  return out;
}

/* ---------- frost dates ---------- */
function zoneFrost(z) { const t = ZONES[z]; return t ? { last: t[0], first: t[1] } : null; }
function estFrost(lat) {
  const a = Math.abs(lat); let last = 46 + (a - 30) * 6.5, first = 344 - (a - 30) * 4.6;
  if (a < 27) { last = 10; first = 362; }
  return { last: clamp(Math.round(last), 1, 175), first: clamp(Math.round(first), 200, 365) };
}
function estZone(last) { let best = '7a', bd = 999; Object.keys(ZONES).forEach(z => { const d = Math.abs(ZONES[z][0] - last); if (d < bd) { bd = d; best = z; } }); return best; }
function frostDates(y) { const L = S.loc; y = y || NOW().getFullYear(); return { last: doyDate(y, L.last), first: doyDate(y, Math.min(L.first, 365)), free: L.first >= 362 && L.last <= 15 }; }
async function fetchJSON(url, opt) { const r = await fetch(url, opt); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
async function frostFromHistory(lat, lon) {
  const y = NOW().getFullYear();
  const j = await fetchJSON('https://archive-api.open-meteo.com/v1/archive?latitude=' + lat + '&longitude=' + lon + '&start_date=' + (y - 6) + '-01-01&end_date=' + (y - 1) + '-12-31&daily=temperature_2m_min&temperature_unit=fahrenheit&timezone=auto');
  const t = j.daily.time, m = j.daily.temperature_2m_min, lasts = [], firsts = [];
  const byY = {}; t.forEach((d, i) => { const yy = +d.slice(0, 4); (byY[yy] = byY[yy] || []).push([d, m[i]]); });
  Object.keys(byY).forEach(yy => {
    let last = null, first = null; byY[yy].forEach(([d, v]) => { if (v == null) return; const dt = pd(d), doy = Math.round((dt - new Date(+yy, 0, 1)) / MS) + 1; if (v <= 32) { if (dt.getMonth() < 6) last = Math.max(last || 0, doy); else if (first == null) first = doy; } });
    lasts.push(last == null ? 1 : last); firsts.push(first == null ? 365 : first);
  });
  const med = a => { a = a.slice().sort((x, z) => x - z); return a[Math.floor(a.length / 2)]; };
  return { last: med(lasts), first: med(firsts), years: lasts.length };
}
async function lookupZip(zip) {
  const j = await fetchJSON('https://api.zippopotam.us/us/' + encodeURIComponent(zip)); const p = j.places && j.places[0]; if (!p) throw new Error('ZIP not found');
  return { name: p['place name'] + ', ' + p['state abbreviation'], lat: +p.latitude, lon: +p.longitude };
}
async function lookupZone(zip) { try { const j = await fetchJSON('https://phzmapi.org/' + encodeURIComponent(zip) + '.json'); return j.zone || ''; } catch (e) { return ''; } }
function setFrostEstimate() { const e = estFrost(S.loc.lat); S.loc.last = e.last; S.loc.first = e.first; S.loc.zone = estZone(e.last); S.loc.src = 'estimate'; }
async function refineLocation(info) { // fills S.loc from coordinates/zip, uses the web when it can
  S.loc.lat = info.lat; S.loc.lon = info.lon; if (info.name) S.loc.name = info.name; if (info.zip) S.loc.zip = info.zip;
  setFrostEstimate(); let how = 'estimate';
  try { const f = await frostFromHistory(info.lat, info.lon); S.loc.last = f.last; S.loc.first = f.first; S.loc.src = 'history'; how = 'history'; if (!S.loc.zone || true) S.loc.zone = estZone(f.last); } catch (e) {}
  if (info.zip) { const z = await lookupZone(info.zip); if (z) S.loc.zone = z; }
  save(); return how;
}

/* ---------- weather (online, optional) ---------- */
async function refreshWx(force) {
  const w = S.wx; if (!force && w && w.t && w.v === 2 && NOW().getTime() - w.t < 3 * 3600 * 1000) return w;
  try {
    const j = await fetchJSON('https://api.open-meteo.com/v1/forecast?latitude=' + S.loc.lat + '&longitude=' + S.loc.lon + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,uv_index_max&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&past_days=7&forecast_days=16&timezone=auto&precipitation_unit=inch&temperature_unit=fahrenheit&wind_speed_unit=mph');
    const D = j.daily; S.wx = { t: NOW().getTime(), v: 2, cur: j.current ? { temp: j.current.temperature_2m, code: j.current.weather_code, wind: j.current.wind_speed_10m, hum: j.current.relative_humidity_2m } : null, days: D.time.map((d, i) => ({ d, rain: D.precipitation_sum[i] || 0, lo: D.temperature_2m_min[i], hi: D.temperature_2m_max[i], code: D.weather_code ? D.weather_code[i] : null, pop: D.precipitation_probability_max ? D.precipitation_probability_max[i] : null, wind: D.wind_speed_10m_max ? D.wind_speed_10m_max[i] : null, et0: D.et0_fao_evapotranspiration ? D.et0_fao_evapotranspiration[i] : null, uv: D.uv_index_max ? D.uv_index_max[i] : null })) }; save(); return S.wx;
  } catch (e) { return S.wx; }
}
function wxSummary() {
  const w = S.wx; if (!w || !w.days) return null; const t = dkey(); const past = w.days.filter(x => x.d < t), futAll = w.days.filter(x => x.d >= t), fut = futAll.slice(0, 7); if (!fut.length) return null;
  const et = fut.slice(0, 5).map(x => x.et0).filter(v => v != null);
  return { rainPast: past.reduce((a, x) => a + x.rain, 0), rain2: past.slice(-2).reduce((a, x) => a + x.rain, 0), rainNext: fut.reduce((a, x) => a + x.rain, 0), minNext: Math.min.apply(null, fut.map(x => x.lo)), maxNext: Math.max.apply(null, fut.map(x => x.hi)), et0: et.length ? et.reduce((a, v) => a + v, 0) / et.length : null, cur: w.cur || null, days: futAll, age: NOW().getTime() - w.t };
}
/* what this month usually looks like here, from the last five years of local weather */
async function refreshNormals(force) {
  const n = S.wxn; if (!force && n && n.t && NOW().getTime() - n.t < 90 * 86400000 && n.lat === S.loc.lat && n.lon === S.loc.lon) return n;
  try {
    const y = NOW().getFullYear();
    const j = await fetchJSON('https://archive-api.open-meteo.com/v1/archive?latitude=' + S.loc.lat + '&longitude=' + S.loc.lon + '&start_date=' + (y - 5) + '-01-01&end_date=' + (y - 1) + '-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto');
    const m = Array.from({ length: 12 }, () => ({ hi: 0, lo: 0, rain: 0, n: 0 })); const yrs = {};
    j.daily.time.forEach((d, i) => { const mm = +d.slice(5, 7) - 1, o = m[mm]; if (j.daily.temperature_2m_max[i] == null) return; o.hi += j.daily.temperature_2m_max[i]; o.lo += j.daily.temperature_2m_min[i]; o.rain += j.daily.precipitation_sum[i] || 0; o.n++; yrs[d.slice(0, 4)] = 1; });
    const ny = Object.keys(yrs).length || 1; S.wxn = { t: NOW().getTime(), lat: S.loc.lat, lon: S.loc.lon, m: m.map(o => ({ hi: o.n ? o.hi / o.n : null, lo: o.n ? o.lo / o.n : null, rain: o.rain / ny })) }; save(); return S.wxn;
  } catch (e) { return S.wxn; }
}

/* ---------- sheet, toast, dispatch ---------- */
const UI = { tab: 'garden', gk: 'veg', sub: {}, tool: 'paint', sel: null, wmode: false };
const ACT = {}, CHG = {};
function openSheet(title, html, opts) {
  const sh = $('#sheet'); sh.innerHTML = '<div class="sh-bar"><b>' + esc(title) + '</b><button class="x" data-act="closeSheet" aria-label="Close">&times;</button></div><div class="sh-body">' + html + '</div>';
  sh.classList.add('open'); document.body.classList.add('noscroll'); sh.scrollTop = 0; if (opts && opts.mount) opts.mount(sh);
}
function closeSheetQuiet() { $('#sheet').classList.remove('open'); document.body.classList.remove('noscroll'); }
function closeSheet() { closeSheetQuiet(); if (typeof render === 'function') render(); }
function sheetOpen() { return $('#sheet').classList.contains('open'); }
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 2600); }
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); } });
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (!el) return; const fn = CHG[el.dataset.chg]; if (fn) fn(el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (!el) return; const fn = CHG[el.dataset.inp]; if (fn) fn(el, e); });
ACT.closeSheet = closeSheet;
const chips = (arr, cur, act, extra) => arr.map(a => '<button class="chip' + (a[0] === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + esc(a[0]) + '" ' + (extra || '') + '>' + a[1] + '</button>').join('');
