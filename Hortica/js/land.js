/* Hortica land layers: trees, shrubs, vines, succulents, ground and shade, houseplants, water and bog, coastal.
   Start screens, filters, map advice, plant-page facts, seaweed guide. Registry LAND_KINDS lives in base.js. */
const LAND_TAGS = {
  tree: { e: '🍎 Edible fruit or nut', o: '🐝 Pollinators', l: '🦌 Wildlife food', s: '🌳 Shade tree', x: '🌲 Evergreen', n: '🦅 Native', f: '🪻 Fragrant', b: '🌸 Showy bloom', y: '🍁 Fall color', g: '🛡 Deer and gopher resistant', d: '☀️ Drought tolerant', t: '☠️ Toxic: caution', m: '⚕️ Traditional medicinal', p: '🪴 Small yard or pot', k: '🌵 Thorny', i: '⚠️ Can be invasive', u: '🤝 Needs a partner tree', r: '🛡 Tough windbreak or street tree', q: '⚡ Fast growing' },
  shrub: { e: '🍽 Edible', o: '🐝 Pollinators', h: '🐦 Hummingbirds', w: '🦌 Feeds wildlife', f: '🪻 Fragrant', b: '🌸 Showy bloom', s: '🌳 Hedge or screen', x: '🌲 Evergreen', n: '🦅 Native', g: '🛡 Gopher and deer resistant', d: '☀️ Drought tolerant', a: '🍂 Acid lover', t: '☠️ Toxic: caution', c: '✂️ Cut stems', m: '⚕️ Traditional medicinal', p: '🪴 Pots', k: '🌵 Thorny', i: '⚠️ Can be invasive', y: '🍁 Fall color' },
  vine: { e: '🍇 Edible', o: '🐝 Pollinators', h: '🐦 Hummingbirds', f: '🪻 Fragrant', b: '🌸 Showy bloom', x: '🌲 Evergreen', n: '🦅 Native', d: '☀️ Drought tolerant', t: '☠️ Toxic: caution', k: '🌵 Thorny', i: '⚠️ Can be invasive', a: '🌱 Annual vine', s: '🌥 Shade ok', l: '🧗 Self-clinging', r: '🪜 Needs a trellis', w: '🦋 Wildlife', g: '🛡 Deer resistant', p: '🪴 Pots', c: '✂️ Cut flowers', m: '⚕️ Traditional medicinal' },
  succ: { o: '🐝 Pollinators', h: '🐦 Hummingbirds', f: '🥶 Frost tender', c: '❄️ Cold hardy', p: '🪴 Pots and indoors', g: '🌿 Groundcover', r: '🪨 Rock garden', b: '🌸 Showy bloom', k: '🌵 Spiny: caution', t: '☠️ Toxic sap: caution', e: '🍽 Edible parts', m: '⚕️ Traditional medicinal', a: '🏛 Focal plant', i: '🏠 Low-light indoor', n: '🦅 Native', w: '🦋 Wildlife value', d: '💧 Needs sharp drainage' },
  ground: { o: '🐝 Pollinators', c: '🌿 Groundcover', r: '🌾 Ornamental grass', f: '🌿 Fern', l: '🚶 Lawn alternative', s: '🌥 Shade lover', u: '🧅 Bulb, corm or tuber', b: '🌸 Showy bloom', x: '🌲 Evergreen', n: '🦅 Native', d: '☀️ Drought tolerant', w: '💧 Tolerates wet soil', e: '🍽 Edible', t: '☠️ Toxic: caution', i: '⚠️ Can be invasive', k: '🛡 Deer resistant', y: '🍁 Fall or winter interest', p: '🪴 Pots', m: '⚕️ Traditional medicinal', v: '⛰ Erosion control', q: '🏃 Fast spreader' },
  house: { l: '🌥 Low light ok', b: '☀️ Needs bright light', t: '☠️ Toxic to pets: caution', p: '🐾 Pet safe', h: '🪢 Hanging or trailing', e: '🍽 Edible or kitchen herb', f: '🌸 Flowering', c: '👍 Easy for beginners', d: '🌵 Forgives neglect', v: '💦 Humidity lover', r: '🧐 Fussy', s: '🌴 Statement plant', o: '🌤 Can summer outdoors', m: '⚕️ Traditional medicinal' },
  wet: { a: '🌊 In the water', m: '🪷 Shallow edge', b: '🟫 Bog or wet soil', r: '🌧 Rain garden', c: '🪤 Carnivorous', f: '🍃 Floating', s: '🫧 Oxygenator', o: '🐝 Pollinators', w: '🦋 Wildlife', n: '🦅 Native', i: '⚠️ Invasive or restricted: caution', e: '🍽 Edible', t: '☠️ Toxic: caution', h: '❄️ Cold hardy', l: '🌸 Showy flowers', k: '🌴 Tropical, frost tender', p: '🪴 Tub or pot pond', x: '🌲 Evergreen' },
  coast: { s: '🌊 Salt spray ok', a: '🧂 Salty or alkaline soil ok', d: '☀️ Drought tolerant', w: '💨 Wind tolerant', e: '🍽 Edible', o: '🐝 Pollinators', n: '🦅 Native', b: '🌸 Showy bloom', x: '🌲 Evergreen', g: '⛰ Dune or bank stabilizer', t: '☠️ Toxic: caution', i: '⚠️ Can be invasive', m: '⚕️ Traditional medicinal', k: '🛡 Deer resistant', f: '🪻 Fragrant', p: '🪴 Pots' }
};
const LAND_ALL = {}; LAND_ORDER.slice().reverse().forEach(k => Object.assign(LAND_ALL, LAND_TAGS[k]));
const LAND_PICK = { tree: ['e', 's', 'x', 'n', 'b', 'y', 'p', 'u', 'd', 'g', 'o', 'q'], shrub: ['e', 'o', 's', 'x', 'n', 'b', 'f', 'g', 'd', 'a', 'p', 'k'], vine: ['e', 'o', 'h', 'f', 'b', 'x', 'n', 'a', 's', 'l', 'r', 'p'], succ: ['c', 'f', 'p', 'g', 'r', 'b', 'a', 'k', 'e', 'i'], ground: ['l', 'r', 'c', 'f', 's', 'u', 'o', 'n', 'd', 'w', 'k', 'v', 'e'], house: ['c', 'l', 'b', 'p', 't', 'h', 'f', 'd', 'v', 's', 'e'], wet: ['c', 'a', 'm', 'b', 'r', 'f', 'o', 'n', 'e', 'h', 'p'], coast: ['s', 'd', 'w', 'e', 'o', 'n', 'b', 'g', 'x', 'k'] };
const LKCHIPS = LAND_ORDER.map(k => ['lk:' + k, LAND_KINDS[k].e + ' All ' + LAND_KINDS[k].n.toLowerCase()]);
const landCat = c => c.indexOf('lk:') === 0;
function landMatch(c, p) { return p.lk === c.slice(3); }
function landText(i) { return i ? [i.uses, i.role, i.colors, i.bloom, i.tags.map(t => LAND_ALL[t] || '').join(' ')].join(' ') : ''; }
function landTagList(p, n) { const i = LAND_INFO[p.id], d = LAND_TAGS[p.lk] || {}; return i ? i.tags.slice(0, n).map(t => (d[t] || t).replace(/^\S+\s/, '').toLowerCase()).join(', ') : ''; }
function landDefault(k) { const d = { tree: 'pawpaw', shrub: 'forsythia', succ: 'sempervivum' }[k]; if (d && PBY[d]) return d; const p = PLANTS.find(x => x.lk === k); return p ? p.id : 'tomato'; }
const LPRE = {
  tree: [['orchard', 'Home orchard (8 × 6 tiles, 4 ft each)', 8, 6, 4], ['shade', 'Shade and yard trees (8 × 6 tiles, 5 ft each)', 8, 6, 5], ['wind', 'Windbreak or screen row (12 × 2 tiles, 4 ft each)', 12, 2, 4], ['small', 'Small-yard tree corner (6 × 4 tiles, 3 ft each)', 6, 4, 3]],
  shrub: [['hedge', 'Privacy hedge (12 × 2 tiles, 2 ft each)', 12, 2, 2], ['found', 'Foundation border (10 × 3 tiles, 2 ft each)', 10, 3, 2], ['berry', 'Berry and edible shrub patch (8 × 6 tiles, 2 ft each)', 8, 6, 2], ['wild', 'Pollinator and wildlife border (12 × 4 tiles, 2 ft each)', 12, 4, 2]],
  vine: [['arbor', 'Arbor or pergola (6 × 2 tiles, 2 ft each)', 6, 2, 2], ['fence', 'Fence or trellis row (12 × 1 tiles, 1 ft each)', 12, 1, 1], ['wall', 'Wall of climbers (10 × 2 tiles, 2 ft each)', 10, 2, 2], ['yard', 'Vineyard rows (10 × 4 tiles, 3 ft each)', 10, 4, 3]],
  succ: [['rock', 'Rock garden (10 × 6 tiles, 1 ft each)', 10, 6, 1], ['cactus', 'Desert cactus bed (8 × 5 tiles, 1 ft each)', 8, 5, 1], ['pots', 'Patio pots and containers (4 × 3 tiles, 1 ft each)', 4, 3, 1], ['xeri', 'Xeriscape front yard (14 × 8 tiles, 1 ft each)', 14, 8, 1]],
  ground: [['lawn', 'Lawn alternative (10 × 8 tiles, 1 ft each)', 10, 8, 1], ['shade', 'Shade garden (10 × 6 tiles, 1 ft each)', 10, 6, 1], ['meadow', 'Meadow and grass border (12 × 4 tiles, 2 ft each)', 12, 4, 2], ['bulbs', 'Bulb and fern bed (6 × 4 tiles, 1 ft each)', 6, 4, 1]],
  house: [['sill', 'Sunny windowsill (4 × 1 tiles, 1 ft each)', 4, 1, 1], ['living', 'Living room plant corner (6 × 4 tiles, 1 ft each)', 6, 4, 1], ['bath', 'Bathroom or kitchen shelf (4 × 2 tiles, 1 ft each)', 4, 2, 1], ['shelf', 'Plant wall or big shelf (8 × 3 tiles, 1 ft each)', 8, 3, 1]],
  wet: [['pond', 'Backyard pond (8 × 6 tiles, 1 ft each)', 8, 6, 1], ['bog', 'Bog garden (6 × 4 tiles, 1 ft each)', 6, 4, 1], ['rain', 'Rain garden (10 × 6 tiles, 2 ft each)', 10, 6, 2], ['carn', 'Carnivorous plant tub (3 × 3 tiles, 1 ft each)', 3, 3, 1]],
  coast: [['dune', 'Dune and seaside bank (12 × 4 tiles, 2 ft each)', 12, 4, 2], ['seaside', 'Seaside garden (10 × 6 tiles, 2 ft each)', 10, 6, 2], ['salt', 'Salty edible patch (6 × 4 tiles, 1 ft each)', 6, 4, 1]]
};
const LINTRO = {
  tree: 'Orchards, shade trees, windbreaks and small-yard trees on a map that thinks in decades. Hortica checks pairings and guilds, warns about roots, size and invasive kinds, and shows when everything blooms.',
  shrub: 'Hedges, foundation plantings, berry bushes and flowering shrubs, laid out tile by tile. Hortica checks the pairings, shows when your shrubs bloom, and flags thorns, poison and plants that spread.',
  vine: 'Arbors, fences, trellises and vineyard rows. Hortica checks which vines suit which supports, who strangles whom, and flags the aggressive and toxic ones.',
  succ: 'Rock gardens, desert beds, patio pots and low-water yards. Hortica checks drainage, warns about frost and spines, and tells you which ones can stay out all winter in your zone.',
  ground: 'Lawn alternatives, ornamental grasses, groundcovers, ferns, hostas and bulbs. Hortica flags spreaders and checks sun, shade and moisture against each other.',
  house: 'Indoor plants by room and shelf. Hortica flags pet-toxic plants, light needs and plants that want different humidity and watering.',
  wet: 'Ponds, bogs, rain gardens and carnivorous plant tubs. Hortica flags invasive water plants, checks hardiness and groups plants by how wet their feet want to be.',
  coast: 'Plants that take salt, wind and sand. Hortica flags what will burn in salt spray, what is invasive on the coast, and what stabilizes a dune. Edible seaweed has its own guide below.'
};
function landStart(k) {
  const K = LAND_KINDS[k];
  return '<section class="card"><div class="ct"><span>' + K.e + ' Build your ' + K.n.toLowerCase() + ' map</span></div><p class="sm">' + LINTRO[k] + '</p>' +
    LPRE[k].map(p => '<button class="btn block" data-act="lMake" data-v="' + k + ':' + p[0] + '">' + p[1] + '</button>').join('') +
    (k === 'coast' ? '<button class="btn block gold" data-act="seaGuide">🌊 Edible seaweed: forage-and-grow guide</button>' : '') + '</section>';
}
ACT.lMake = el => {
  const a = el.dataset.v.split(':'), k = a[0], p = (LPRE[k] || []).find(x => x[0] === a[1]); if (!p) return;
  const g = newGarden(p[1].split(' (')[0], p[2], p[3], p[4]); g.kind = k; if (k === 'succ') g.soil = 'sand'; if (k === 'wet' && a[1] !== 'rain') g.soil = 'clay'; if (k === 'coast') g.soil = 'sand';
  S.gardens.push(g); setCur(g); UI.gk = k; UI.brush = landDefault(k); UI.status = 'plan'; UI.tab = 'garden'; save(); closeSheetQuiet(); render();
  toast(LAND_KINDS[k].n + ' map ready. Pick a plant and paint it on.', 3500);
};
ACT.seaGuide = () => openSheet('🌊 Edible seaweed guide',
  '<p class="sm">Seaweed is wild food, not a garden crop, and it is regulated. Read this before you pick anything, and treat it as a starting point, not a field guide.</p>' +
  '<h3 class="h3">Before you go</h3><p class="sm">Check your state or country rules first. Many coasts require a permit, limit how much you can take, or close beaches after pollution or red tide. Never pick near storm drains, harbors, outfalls or after heavy rain. Water quality matters more than species: seaweed concentrates metals and pollutants from the water.</p>' +
  '<h3 class="h3">Common edible kinds</h3><div class="flag"><b>Sea lettuce (Ulva)</b><br><span class="sm">Bright green, thin sheets, rinse and eat fresh in salads or soup or dry it. Common on rocks in sheltered bays.</span></div>' +
  '<div class="flag"><b>Dulse (Palmaria)</b><br><span class="sm">Reddish-purple, leathery fronds, pan-fry or dry. Found low on rocky shores in cold water.</span></div>' +
  '<div class="flag"><b>Nori or laver (Porphyra)</b><br><span class="sm">Thin purple to brown sheets on upper rocks. Rinse well, dry flat in the sun or oven.</span></div>' +
  '<div class="flag"><b>Kelp, kombu, sugar kelp (Laminaria, Saccharina)</b><br><span class="sm">Long brown straps. Dry for broth. Very high in iodine, so go easy, especially with thyroid trouble.</span></div>' +
  '<div class="flag"><b>Wakame (Undaria)</b><br><span class="sm">Frilly brown fronds with a midrib. Invasive in some regions, so check local rules.</span></div>' +
  '<div class="flag"><b>Bladderwrack (Fucus)</b><br><span class="sm">Brown with air bladders. Mostly used in baths and teas, high in iodine.</span></div>' +
  '<h3 class="h3">How to harvest</h3><p class="sm">Cut with scissors, leaving the holdfast and at least two thirds of the plant so it regrows. Pick from living, attached plants, never the dead wrack on the beach line. Rinse in clean seawater, then fresh water, and dry or cook it the same day.</p>' +
  '<div class="flag ask"><b>Cautions</b><br><span class="sm">Iodine overload, heavy metals (especially arsenic in some brown seaweeds) and bacteria are real concerns. Pregnant people, children and anyone with thyroid problems should ask a doctor. When you cannot identify it for certain, leave it. Growing your own kelp or nori in the sea needs a lease or permit in most places; many coasts have a local sea grant or extension office that can help.</span></div>');
function landMonths(id) {
  const i = LAND_INFO[id], out = new Set(); if (!i) return out; const s = i.bloom;
  if (/year round/i.test(s)) { for (let x = 0; x < 12; x++) out.add(x); return out; }
  const re = /([A-Z][a-z]{2})-([A-Z][a-z]{2})/g; let m;
  while ((m = re.exec(s))) { const a = MONI[m[1]], b = MONI[m[2]]; if (a == null || b == null) continue; for (let x = a, n = 0; n < 12; x = (x + 1) % 12, n++) { out.add(x); if (x === b) break; } }
  s.replace(re, ' ').replace(/\b([A-Z][a-z]{2})\b/g, (z, mm) => { if (MONI[mm] != null) out.add(MONI[mm]); return z; });
  return out;
}
const LAND_WILD = { tree: 'l', shrub: 'w', vine: 'w', succ: 'w', wet: 'w' };
const LAND_SHOW = { tree: ['e', 's', 'x', 'n', 'u', 'o', 'l'], shrub: ['e', 'o', 'w', 'x', 'n', 'f', 's'], vine: ['e', 'o', 'h', 'x', 'n', 'a', 'r', 'l'], succ: ['c', 'f', 'p', 'r', 'g', 'b'], ground: ['l', 'r', 'c', 'f', 's', 'u', 'n', 'k'], house: ['c', 'l', 'b', 'p', 't', 'h', 'f'], wet: ['c', 'a', 'm', 'b', 'r', 'n', 'o'], coast: ['s', 'd', 'w', 'e', 'g', 'n', 'o'] };
function landExtras(g, cnt) {
  let h = ''; const k = gk(g), P = cnt.map(o => PBY[o.id]).filter(Boolean), has = (p, t) => { const i = LAND_INFO[p.id]; return !!i && i.tags.indexOf(t) >= 0; };
  const tags = {}; P.forEach(p => { const i = LAND_INFO[p.id]; if (i) i.tags.forEach(t => { tags[t] = (tags[t] || 0) + 1; }); });
  const chips = (LAND_SHOW[k] || []).filter(t => tags[t]).map(t => '<span class="chip">' + (LAND_TAGS[k][t] || t) + ' ' + tags[t] + '</span>').join(''); if (chips) h += '<div class="chips c">' + chips + '</div>';
  if (k !== 'house') { // bloom calendar and wildlife score
    const cov = new Array(12).fill(0); P.forEach(p => landMonths(p.id).forEach(m => { cov[m]++; }));
    if (cov.some(x => x)) { h += '<div class="flag"><b>🌸 Interest through the year</b><div class="bstrip">' + cov.map((n, m) => '<i class="' + (n ? 'on' : '') + '" title="' + MON[m] + '">' + MON[m].charAt(0) + (n ? '<u>' + n + '</u>' : '') + '</i>').join('') + '</div>';
      const gaps = []; for (let m = 2; m <= 9; m++) if (!cov[m]) gaps.push(MON[m]); h += '<span class="sm">' + (gaps.length ? 'Nothing blooms or shows color on this map in ' + gaps.join(', ') + '. Add a plant that peaks then.' : 'Something has interest every month from March to October.') + '</span></div>'; }
    const poll = P.filter(p => has(p, 'o') || has(p, 'h')).length, wd = LAND_WILD[k] ? P.filter(p => has(p, LAND_WILD[k])).length : 0, sc = P.length ? Math.round(100 * Math.min(1, (poll + wd * .6) / (P.length * 1.0))) : 0;
    if (P.length) h += '<div class="flag"><b>🐝 Wildlife score: ' + sc + '/100</b><br><span class="sm">' + poll + ' of ' + P.length + ' kinds feed pollinators or hummingbirds' + (LAND_WILD[k] ? ', ' + wd + ' feed or shelter wildlife' : '') + '. ' + (sc < 40 ? 'Add native flowering plants to lift it.' : sc < 70 ? 'A good start. A few more nectar plants would help.' : 'A real habitat for bees, birds and butterflies.') + '</span></div>';
  }
  if (k === 'house') {
    const tx = P.filter(p => has(p, 't')); if (tx.length) h += '<div class="flag ask"><b>☠️ Toxic to cats and dogs: ' + tx.slice(0, 6).map(p => esc(p.n)).join(', ') + (tx.length > 6 ? ' and more' : '') + '</b><br><span class="sm">Keep these out of reach, or swap them for pet-safe plants. If a pet chews one, call your vet or an animal poison line.</span></div>';
    const lo = P.filter(p => has(p, 'l')), br = P.filter(p => has(p, 'b')); if (lo.length && br.length) h += '<div class="flag space"><b>☀️ Light mix</b><br><span class="sm">' + br.length + ' plants want bright light and ' + lo.length + ' tolerate low light. Put the bright ones at the window and the shade-tolerant ones further back.</span></div>';
    const hu = P.filter(p => has(p, 'v')), dr = P.filter(p => has(p, 'd')); if (hu.length && dr.length) h += '<div class="flag space"><b>💦 Humidity mix</b><br><span class="sm">' + hu.slice(0, 3).map(p => esc(p.n)).join(', ') + ' want humid air; ' + dr.slice(0, 3).map(p => esc(p.n)).join(', ') + ' want to dry out. Group them apart, and put the humidity lovers in the bathroom or on a pebble tray.</span></div>';
    const fu = P.filter(p => has(p, 'r')); if (fu.length) h += '<div class="flag"><b>🧐 Needs extra care: ' + fu.slice(0, 4).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">These are the first to drop leaves when the light, water or humidity slips. Start beginners with the easy ones.</span></div>';
  } else {
    const sharp = P.filter(p => has(p, 'k') && (k === 'succ' || k === 'shrub' || k === 'tree' || k === 'vine')) .concat(P.filter(p => has(p, 't')));
    const uniq = []; sharp.forEach(p => { if (uniq.indexOf(p) < 0) uniq.push(p); });
    if (uniq.length) h += '<div class="flag ask"><b>⚠️ Thorns, spines or poison: ' + uniq.slice(0, 6).map(p => esc(p.n)).join(', ') + (uniq.length > 6 ? ' and more' : '') + '</b><br><span class="sm">Keep these back from paths, play areas and pet runs, and wear gloves to handle them. ' + esc(LAND_INFO[uniq[0].id].caution) + '</span></div>';
    const inv = P.filter(p => has(p, 'i')); if (inv.length) h += '<div class="flag space"><b>🏃 Can spread or be invasive: ' + inv.slice(0, 5).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">Check with your county extension office before planting. These are listed as invasive in some regions. Contain them or choose a native instead.</span></div>';
    const cold = P.filter(p => !zoneOk(p)); if (cold.length) h += '<div class="flag space"><b>🥶 Not hardy in zone ' + esc(S.loc.zone) + ': ' + cold.slice(0, 6).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">' + (k === 'succ' ? 'Grow these in pots and carry them indoors to a bright window before the first frost.' : k === 'wet' ? 'Treat tropical water plants as annuals, or lift them into a bucket of water indoors for winter.' : 'These will not survive your winters outdoors. Pick a hardier kind, plant against a warm south wall with deep mulch, or use a big pot you can move.') + '</span></div>';
  }
  if (k === 'succ') {
    const f = (SOILS[g.soil] || SOILS.loam).f, wet = P.filter(p => has(p, 'd')); if (wet.length && f < 1) h += '<div class="flag ask"><b>💧 Drainage</b><br><span class="sm">Your ' + esc((SOILS[g.soil] || SOILS.loam).n.toLowerCase()) + ' soil holds water, and most cacti and succulents rot in wet soil. Build a mound or raised bed and mix in half coarse grit or pumice.</span></div>';
    const th = P.filter(p => p.wat >= 3); if (th.length) h += '<div class="flag space"><b>💧 Thirstier than the rest: ' + th.slice(0, 4).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">Give these their own corner so the dry-loving plants stay dry.</span></div>';
  }
  if (k === 'tree') {
    const big = P.filter(p => p.h >= 360); if (big.length) h += '<div class="flag"><b>📏 Big trees: ' + big.slice(0, 4).map(p => esc(p.n) + ' (' + Math.round(p.h / 12) + ' ft tall, ' + Math.round(p.sp / 12) + ' ft wide)').join(', ') + '</b><br><span class="sm">Plant big shade trees at least 20 to 30 feet from the house, and well clear of pipes, septic fields, wires and paving. Roots and limbs reach about as far as the tree is tall.</span></div>';
    const pr = P.filter(p => has(p, 'u')); if (pr.length) h += '<div class="flag"><b>🤝 Needs a partner tree: ' + pr.slice(0, 5).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">These set little or no fruit alone. Plant a second compatible variety within about 50 feet, or check for a neighbor\'s tree that blooms at the same time.</span></div>';
    const sm = P.filter(p => p.h < 360 && p.h >= 120).length; if (!big.length && sm) h += '<div class="flag"><span class="sm">All small trees here, so shade and windbreak value is limited for the first ten years.</span></div>';
  }
  if (k === 'vine') { const nt = P.filter(p => has(p, 'r') && !has(p, 'l')); if (nt.length) h += '<div class="flag"><b>🪜 Need a trellis, wire or arbor: ' + nt.slice(0, 5).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">Build the support before you plant, rated for the full-grown weight. Heavy vines like wisteria and grapes pull down flimsy fences.</span></div>'; const cl = P.filter(p => has(p, 'l')); if (cl.length) h += '<div class="flag space"><b>🧱 Self-clinging: ' + cl.slice(0, 4).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">These grip with roots or pads and can damage soft mortar, wood siding and shingles. Keep them off painted wood and trees you want to keep.</span></div>'; }
  if (k === 'wet') { const car = P.filter(p => has(p, 'c')); const rich = P.filter(p => !has(p, 'c') && p.feed === 'H'); if (car.length) h += '<div class="flag"><b>🪤 Carnivorous: ' + car.slice(0, 5).map(p => esc(p.n)).join(', ') + '</b><br><span class="sm">Water only with rainwater or distilled water, never feed them fertilizer or tap-water minerals, and keep them in acid peat and sand. Hardy kinds need a cool winter rest.</span></div>'; if (car.length && rich.length) h += '<div class="flag ask"><b>🧪 Keep apart</b><br><span class="sm">Fertilized, mineral-rich plants (' + rich.slice(0, 3).map(p => esc(p.n)).join(', ') + ') will wash nutrients into the carnivorous bog and kill the sundews and pitchers. Give them separate tubs.</span></div>'; }
  if (k === 'coast') { const tend = P.filter(p => !has(p, 's') && !has(p, 'a')); if (tend.length && P.some(p => has(p, 's'))) h += '<div class="flag space"><b>🌊 Salt exposure</b><br><span class="sm">' + tend.slice(0, 4).map(p => esc(p.n)).join(', ') + ' are not listed as salt tolerant. Plant them behind a windbreak, away from direct spray.</span></div>'; }
  return h;
}
function landBlock(p) {
  const i = LAND_INFO[p.id]; if (!i) return ''; const d = LAND_TAGS[p.lk] || {};
  return '<h3 class="h3">' + LAND_KINDS[p.lk].n + ' facts</h3><div class="chips c">' + i.tags.map(t => '<span class="chip">' + esc(d[t] || t) + '</span>').join('') + '</div>' +
    '<p class="sm"><b>' + (/Foliage|Fall color|Year round/.test(i.bloom) ? 'Interest:' : 'Blooms:') + '</b> ' + esc(i.bloom) + ' · <b>Colors:</b> ' + esc(i.colors) + '</p><p class="sm"><b>Best for:</b> ' + esc(i.uses) + '</p><p class="sm"><b>Role in the garden:</b> ' + esc(i.role) + '</p>' +
    (p.lk === 'house' ? '<p class="sm dim">Indoor plant. Zones show where it could live outdoors year round.</p>' : '') +
    (/^none/i.test(i.caution) ? '' : '<div class="flag ask"><b>Caution</b><br><span class="sm">' + esc(i.caution) + '</span></div>');
}
/* register the new layers everywhere the old three are listed */
(function () {
  LAND_ORDER.forEach(k => {
    KINDS[k] = [LAND_KINDS[k].e, LAND_KINDS[k].n]; if (!SPK[k]) SPK[k] = k === 'house' ? ['_path', '_water', '_struct', '_bed'] : ['_path', '_water', '_compost', '_struct', '_rock', '_bed'];
    const col = { tree: '#3b7a3a', shrub: '#5a7d3a', vine: '#7a5a8a', succ: '#3f8a73', ground: '#6a8f4a', house: '#4aa07a', wet: '#3d82b8', coast: '#c0a060' }[k];
    LAYCOL[k] = col; LAYN[k] = LAND_KINDS[k].n;
    if (!LAYS.some(a => a[0] === k)) LAYS.splice(LAYS.findIndex(a => a[0] === 'fungi'), 0, [k, LAND_KINDS[k].e + ' ' + LAND_KINDS[k].n]);
    if (!AUD_LAY.some(a => a[0] === k)) AUD_LAY.splice(AUD_LAY.findIndex(a => a[0] === 'fungi'), 0, [k, LAND_KINDS[k].e + ' ' + LAND_KINDS[k].n]);
  });
  const cc = { g: '#6a8f4a', hp: '#4aa07a', aq: '#3d82b8', co: '#c0a060' }; Object.keys(cc).forEach(c => { if (!CATCOL[c]) CATCOL[c] = cc[c]; });
})();

/* feeding advice for the land layers (the vegetable rules would be wrong for these) */
(function () {
  const base = nutriFor, D = {
    tree: ['S', 'Mulch with 2 to 3 inches of compost or wood chips each spring, kept off the trunk. Feed young trees lightly in early spring only, and stop by midsummer so new growth hardens before winter.'],
    shrub: ['S', 'Top-dress with compost in spring and mulch deeply. Feed flowering shrubs right after bloom. Acid lovers want an acid fertilizer, never lime.'],
    vine: ['S', 'Feed lightly in spring. Too much nitrogen gives leaves and no flowers or fruit. Fruiting vines like grapes and kiwi want compost and a balanced feed once in spring.'],
    succ: ['S', 'Feed lightly: a diluted cactus fertilizer once or twice in the growing season, none in winter. Over-feeding makes soft growth that rots.'],
    ground: ['S', 'Top-dress with a thin layer of compost in spring. Most groundcovers and ornamental grasses want lean soil and little feed.'],
    house: ['M', 'Feed monthly in spring and summer with a balanced houseplant fertilizer at half strength. Reduce or stop in winter, and never feed a dry or stressed plant.'],
    wet: ['S', 'Little feed needed. In ponds, push aquatic plant tablets into the pot soil, never loose fertilizer into the water, which feeds algae.'],
    coast: ['S', 'Little feed needed. Sandy soil drains nutrients fast, so mulch and use compost at planting.']
  };
  nutriFor = function (id) {
    const p = PBY[id]; if (!p || !p.lk) return base(id); const i = LAND_INFO[id], t = i ? i.tags : [];
    if (p.lk === 'wet' && t.indexOf('c') >= 0) return [{ f: 'S', x: 'Do not fertilize. Carnivorous plants feed on insects, and fertilizer or mineral water burns the roots. Use rainwater or distilled water only, in acid peat and sand.' }];
    if (p.lk === 'wet' && t.some(x => 'afsm'.indexOf(x) >= 0)) return [{ f: 'M', x: 'Push an aquatic plant fertilizer tablet into the pot soil once a month in summer. Never put loose fertilizer in the water.' }];
    const d = D[p.lk]; return [{ f: d[0], x: d[1] }];
  };
})();
