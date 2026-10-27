/* Backpackica: foraging and useful-plants guide.
   SAFETY: this module never identifies anything. Every card says so, puts dangerous lookalikes first, and the whole guide sits behind a one-time acknowledgement.
   Public API:  BP.forage.open()  full-screen guide (after the safety gate);  BP.forage.search(q) -> [{set,id,n,latin}];  BP.forage.card(set,id).
   Also registers a section {id:'forage'} in BP.surviveSections so the guide appears inside the Survive tab.
   Data: window.FORAGE (data/forage.js). State: OA.S.forage = {fav, region, month, cat, onlySeason, onlyFav}. Log entries: IndexedDB kv records {kind:'forage-log'} + photos (tag 'forage'). */
window.BP = window.BP || { todayCards: [] };
(function () {
  'use strict';
  const esc = OA.esc;
  const F = window.FORAGE || { plants: [], fungi: [], coast: [], useful: [], meta: { regions: [] } };
  BP.surviveSections = BP.surviveSections || [];
  OA.defaults({ forage: { fav: {}, region: 'auto', month: 0, cat: 'all', onlySeason: false, onlyFav: false } });
  const ST = () => OA.S.forage;
  const V = { tab: 'rules', q: '', scroll: null };
  const GATE = 'forage-intro';
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const REG = (F.meta && F.meta.regions) || [];
  const regName = id => { const r = REG.find(x => x[0] === id); return r ? r[1] : id; };
  const TABS = [['rules', 'Rules and risks'], ['plants', 'Plants and fruit'], ['fungi', 'Mushrooms: danger guide'], ['coast', 'Coast and water plants'], ['useful', 'Water, fire and shelter plants'], ['log', 'My finds']];
  const SETNAME = { plants: 'Plants and fruit', fungi: 'Mushrooms', coast: 'Coast and water', useful: 'Survival plants' };
  const CATS = [['all', 'All'], ['fruit', 'Berries and fruit'], ['nut', 'Nuts and seeds'], ['greens', 'Greens and bulbs'], ['tea', 'Teas']];
  const DATA = { plants: F.plants, coast: F.coast, useful: F.useful, fungi: F.fungi };
  const find = (set, id) => (DATA[set] || []).find(x => x.id === id) || null;

  /* ---------- small helpers ---------- */
  const ul = a => '<ul class="ls">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const p = a => a.map(x => '<p>' + esc(x) + '</p>').join('');
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const lnk = (u, t) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t || host(u)) + '</a>';
  const tel = '<a href="tel:18002221222" class="btn danger block" style="text-decoration:none">Call Poison Control: 1-800-222-1222</a>';
  const tag = (t, c) => '<span class="tag ' + (c || '') + '">' + esc(t) + '</span>';
  function monthText(a) {
    if (!a || !a.length) return '';
    if (a.length >= 12) return 'all year';
    const s = a.slice().sort((x, y) => x - y), out = []; let st = s[0], pr = s[0];
    for (let i = 1; i <= s.length; i++) { if (s[i] === pr + 1) { pr = s[i]; continue; } out.push(st === pr ? MN[st - 1] : MN[st - 1] + ' to ' + MN[pr - 1]); st = s[i]; pr = s[i]; }
    return out.join(', ');
  }
  /* rough region from a GPS fix: only a convenience filter, never a safety claim */
  function regionOf(f) {
    if (!f || f.lat == null || f.lon == null) return null;
    const la = f.lat, lo = f.lon;
    if (la < 24 || la > 72 || lo > -52 || lo < -170) return null;
    if (lo > -102) return 'east';
    if (la >= 42 && lo <= -117 && lo > -126) return 'pnw';
    if (la < 42 && (lo <= -120.5 || (lo <= -116.8 && la <= 35.5))) return 'ca';
    if (la < 37 && lo > -117 && lo <= -102) return 'sw';
    if (lo > -117 && lo <= -102) return 'rockies';
    return null;
  }
  function curRegion() { const r = ST().region; if (r === 'all') return { id: null, guessed: false }; if (r && r !== 'auto') return { id: r, guessed: false }; const g = regionOf(OA.geo.known()); return { id: g, guessed: true }; }
  const curMonth = () => ST().month || (new Date().getMonth() + 1);
  const inRegion = (it, r) => !r || !it.regions || it.regions.indexOf(r) >= 0;
  const inSeason = (it, m) => (it.months || []).indexOf(m) >= 0;
  const key = (set, id) => set + ':' + id;
  const isFav = (set, id) => !!ST().fav[key(set, id)];
  const hortica = () => { try { const o = window.OCC && OCC.get && OCC.get('hortica'); return o && o.data ? o.data : null; } catch (e) { return null; } };
  const riskTag = it => ({ low: tag('Risk: low, still confirm', 'g'), medium: tag('Risk: medium', 'w'), high: tag('Risk: high', 'r'), unverified: tag('Wild picking not covered', 'a') }[it.risk] || '');
  const lvTag = lv => ({ deadly: tag('Deadly', 'r'), toxic: tag('Toxic', 'r'), irritant: tag('Irritant', 'w'), harmless: tag('Harmless lookalike', 'g'), edible: tag('The edible one', 'g'), unknown: tag('Unknown: avoid', 'w') }[lv] || '');
  const kindTag = it => ({ danger: tag('Dangerous: never food', 'r'), grow: tag('Grow it, do not forage it', 'a'), forage: '', rule: tag('Read first', 'r') }[it.kind] || '');

  /* ---------- the safety gate ---------- */
  const GATE_HTML = '<p><b>Please read. This is about staying alive.</b></p>' + ul([
    'This app cannot identify plants or mushrooms, not from a photo, a name or a description. Only eat something you can identify with certainty, in person, with a local field guide or an expert in front of you. If in doubt, leave it.',
    'Eating the wrong plant or mushroom can kill, sometimes days later. Deadly lookalikes are common: death camas looks like wild onion, moonseed like wild grapes, yew like a fir, and a death cap mushroom looks harmless.',
    'Allergies are real and can be sudden. Try a tiny amount of any new food on a day you are near help.',
    'Gathering is restricted or illegal in many parks, preserves and open spaces. Many national parks ban it; some allow small amounts of fruit, berries or nuts. Check with the land manager first.',
    'Do not pick near roads, rail lines, power lines, sprayed areas, dog areas, mines, or polluted water: plants carry what is in the soil and water.',
    'Take very little. Leave most of every patch, and never dig up roots in parks.',
    'The "universal edibility test" is NOT recommended. Survival instructors warn it is unreliable and can poison you. This app does not teach it.',
    'In a true emergency the safest plan is usually NOT to eat unknown plants. People survive weeks without food but only days without water: water, shelter, warmth and being found matter first.',
    'If anyone eats something unknown: call Poison Control, 1-800-222-1222 (US), at once, and 911 if they are very ill.']);
  function gate() { return OA.gate(GATE, 'Foraging: safety first', GATE_HTML, 'Open the guide'); }

  /* ---------- items and search ---------- */
  function allItems() {
    const out = [];
    F.plants.forEach(it => out.push({ set: 'plants', it }));
    F.coast.forEach(it => out.push({ set: 'coast', it }));
    F.useful.forEach(it => out.push({ set: 'useful', it }));
    F.fungi.forEach(it => out.push({ set: 'fungi', it }));
    return out;
  }
  function hay(x) {
    const it = x.it, b = [it.n, it.latin, it.aka, it.cat, it.part, it.prep, it.say, it.watch, it.toxin, it.fact, it.note, it.do].concat(it.text || [], it.how || [], it.steps || [], it.see || [], (it.look || []).map(l => l.n + ' ' + (l.latin || '')), it.cautions || []);
    return b.filter(Boolean).join(' | ').toLowerCase();
  }
  let HAY = null;
  function search(q) {
    q = String(q || '').toLowerCase().trim(); if (q.length < 2) return [];
    if (!HAY) HAY = allItems().map(x => ({ x, h: hay(x) }));
    const toks = q.split(/\s+/).filter(Boolean), res = [];
    HAY.forEach(o => {
      if (!toks.every(t => o.h.indexOf(t) >= 0)) return;
      const nm = ((o.x.it.n || '') + ' ' + (o.x.it.latin || '')).toLowerCase();
      const rank = toks.every(t => nm.indexOf(t) >= 0) ? 0 : 1;
      res.push({ set: o.x.set, id: o.x.it.id, n: o.x.it.n, latin: o.x.it.latin || '', rank });
    });
    res.sort((a, b) => a.rank - b.rank || a.n.localeCompare(b.n));
    return res;
  }

  /* ---------- rows ---------- */
  function lookTag(it) {
    const ls = it.look || [];
    if (ls.some(l => l.level === 'deadly')) return tag('Deadly lookalike', 'r');
    if (ls.some(l => l.level === 'toxic')) return tag('Toxic lookalike', 'r');
    if (ls.some(l => l.level === 'irritant')) return tag('Irritant lookalike', 'w');
    return '';
  }
  function row(set, it, extra) {
    const reg = curRegion(), m = curMonth();
    const season = it.kind === 'forage' && it.months && it.months.length && it.months.length < 12 && inSeason(it, m) && inRegion(it, reg.id) ? tag('In season now', 'g') : '';
    return '<div class="li" data-act="fgCard" data-set="' + set + '" data-id="' + esc(it.id) + '" role="button">' +
      '<div class="ic">' + OA.icon(it.kind === 'danger' ? 'alert' : set === 'coast' ? 'water' : set === 'useful' ? 'tool' : 'leaf') + '</div>' +
      '<div class="tx"><b>' + esc(it.n) + '</b><span><i>' + esc(it.latin || '') + '</i></span><span>' + (extra || '') + kindTag(it) + (it.risk && it.kind !== 'danger' && it.kind !== 'grow' ? riskTag(it) : '') + lookTag(it) + season + '</span></div>' +
      '<button class="x fg-star' + (isFav(set, it.id) ? ' on' : '') + '" data-act="fgFav" data-set="' + set + '" data-id="' + esc(it.id) + '" aria-label="Save to favourites" aria-pressed="' + isFav(set, it.id) + '">' + (isFav(set, it.id) ? '★' : '☆') + '</button></div>';
  }
  function srow(set, id, n, sub, tg) {
    return '<div class="li" data-act="fgCard" data-set="' + set + '" data-id="' + esc(id) + '" role="button"><div class="ic">' + OA.icon(set === 'fungi' ? 'alert' : set === 'coast' ? 'water' : set === 'useful' ? 'tool' : 'leaf') + '</div><div class="tx"><b>' + esc(n) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + (tg ? '<span>' + tg + '</span>' : '') + '</div><div class="end">' + OA.icon('chev', 'sm') + '</div></div>';
  }

  /* ---------- tabs ---------- */
  function rulesTab() {
    return '<div class="alert danger"><b class="t">Rules that never change</b>' + ul([
      'Never eat what you cannot identify with certainty, in person, with an expert or a local field guide. This app cannot identify anything.',
      'Never eat a wild mushroom based on an app, a photo or a book. See the mushroom danger guide.',
      'In doubt, leave it. Walking away costs nothing.']) + '</div>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('check') + ' Before you pick anything</span></div>' + ul([
        'Do you know the land rules here? Gathering is banned in many parks and preserves.',
        'Is the spot clean? Skip roadsides, rail lines, power lines, sprayed areas, dog areas, old mines and polluted water.',
        'Are you sure of the plant, every feature, with the dangerous lookalike checked first?',
        'Allergic? Try a tiny amount of any new wild food on a day you are near help.',
        'Take little: leave most of every patch and never dig roots in parks.']) + '</section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('map') + ' Is picking allowed here?</span></div>' +
      p(['Always ask the land manager (park, forest, BLM office, city or county). Rules change and these examples can be out of date.']) + ul([
        'National parks: plants may not be gathered, picked or dug unless the superintendent allows it. The federal rule lets a park permit gathering of fruits, berries, nuts and unoccupied seashells by hand for personal use, with limits, and bans selling. Mushrooms are not mentioned in that rule, so assume no unless the park says yes. Example: Shenandoah allows about one quart of fruit or nuts per person per day.',
        'National forests: small "incidental" personal amounts are often free but limited. Example, Klamath National Forest: berries 1 gallon per day, mushrooms 1 gallon per day (not matsutake), none within 200 ft of water or a campground, and you must be able to identify what you pick.',
        'BLM land: small amounts of plants, seeds, berries, nuts, cones and mushrooms for personal use are allowed in most areas, never threatened or endangered plants. Local BLM offices have specific limits.',
        'City, county and many state lands: often banned. In the San Francisco Bay Area the default assumption is "not allowed" (older 2012 summary; check).',
        'Oregon and Washington have mushroom permit and quantity rules that differ by forest and park.']) +
      '<p class="xs dim">Sources: ' + lnk('https://www.law.cornell.edu/cfr/text/36/2.1', '36 CFR 2.1') + ', ' + lnk('https://www.nps.gov/shen/learn/management/collecting-plants.htm', 'Shenandoah NP') + ', ' + lnk('https://www.fs.usda.gov/r05/klamath/permits/forest-products-personal-use', 'Klamath NF') + ', ' + lnk('https://www.blm.gov/Learn/Can-I-Keep-This', 'BLM') + ', ' + lnk('https://baynature.org/article/foraging-101/', 'Bay Nature (2012)') + ', ' + lnk('https://cascademyco.org/resources/mushroom-picking-permits/', 'Cascade Mycological Society') + '. Read 2026-10.</p></section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('alert') + ' The "universal edibility test": not recommended</span></div>' +
      p(['You may have seen a step-by-step test of rubbing a plant on skin, then lips, then tongue, then eating a little and waiting. This app does not teach it and does not recommend it.', 'Survival instructors and writers who looked at it say that it is unreliable and can poison you. Some dangerous plants give no early warning, some are harmless in a small amount but harmful in a larger one, a proper test takes about a day per plant part, and mushrooms are excluded altogether because they can be deadly with no early warning.', 'One bushcraft instructor calls using it as a general way to know whether a plant is edible "categorically wrong and potentially dangerous". Use a local field guide and an expert instead.']) +
      '<p class="xs dim">Read: ' + lnk('https://paulkirtley.co.uk/?p=10793', 'Paul Kirtley') + ', ' + lnk('https://www.backpacker.com/skills/universal-edibility-test/?scope=anon', 'Backpacker magazine') + ', ' + lnk('https://merriwether.substack.com/p/the-uet-is-stupid', 'Merriwether (forager)') + '. This is what instructors and writers say; I did not find a medical review to cite.</p></section>' +
      '<section class="card tip"><div class="ct"><span>' + OA.icon('first') + ' If you are lost or in an emergency</span></div>' +
      p(['The safest approach is usually NOT to eat unknown plants and to wait to be found.', 'The old "rule of threes" is only a rough guide: about three days without water, about three weeks without food. Hot weather can kill in hours; many people survive well over three weeks without food. So the order is: stay safe and warm, get safe water, signal for help, and food last.', 'Hunger is uncomfortable and rarely the thing that hurts you. A poisonous plant can hurt you in hours. Water from a stream still needs boiling or a certified filter; no plant makes water safe (see the water card under Water, fire and shelter plants).']) + '<p class="xs dim">' + lnk('https://en.wikipedia.org/wiki/Rule_of_threes_(survival)', 'Rule of threes (Wikipedia)') + ' says it is "not scientifically accurate".</p></section>' +
      '<section class="card hot"><div class="ct"><span>' + OA.icon('phone') + ' If someone ate something they should not have</span></div>' + tel +
      ul(['Call Poison Control now, before symptoms. Outside the US call your local poison centre or emergency number.', 'Call 911 for confusion, seizure, trouble breathing or fainting.', 'Take any leftover plant or mushroom (a paper bag for mushrooms, not plastic) and any vomit with you.']) + '</section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('info') + ' About this guide</span></div>' +
      p(['The guide lists only plants whose edibility AND dangerous lookalikes could be checked against named sources (extension services, USDA, National Park Service, Forest Service, Oregon State and others). Each card shows its sources. Not being listed does not mean a plant is safe or unsafe.', 'Many familiar wild foods (dandelion, nettle, miner\'s lettuce, purslane, sorrel, plantain, ramps and more) are shown only as "Grow it, do not forage it" with Hortica\'s cautions, because their wild lookalikes were not verified for this build.', 'Months are rough guides. There are no photos in this app (to keep it small and offline); confirm with a local field guide or expert.']) + '</section>';
  }

  function hortRipeBlock() {
    const h = hortica(); if (!h || !h.ripe || !h.ripe.length) return '';
    const hits = [];
    h.ripe.forEach(r => {
      [['plants', F.plants], ['coast', F.coast]].forEach(a => a[1].forEach(it => { if (it.hid && it.hid === r.id && !hits.some(x => x.it === it)) hits.push({ set: a[0], it, r }); }));
    });
    if (!hits.length) return '';
    return '<section class="card tip"><div class="ct"><span>' + OA.icon('leaf') + ' In your Hortica garden</span></div><p class="sm dim">Ripe now in your garden, with a wild cousin in this guide:</p><div class="chips wrap">' +
      hits.map(x => '<button class="chip" data-act="fgCard" data-set="' + x.set + '" data-id="' + esc(x.it.id) + '">' + esc(x.r.n || x.it.n) + (x.r.until ? ' · until ' + esc(OA.fmtDate(x.r.until, { month: 'short', day: 'numeric' })) : '') + '</button>').join('') + '</div></section>';
  }
  function filterBar() {
    const s = ST(), reg = curRegion(), m = curMonth();
    const ropts = [['auto', 'Auto' + (reg.guessed ? (reg.id ? ': ' + regName(reg.id) : ': no position yet') : '')]].concat(REG.map(r => [r[0], r[1]]), [['all', 'All regions']]);
    const mopts = [[0, 'This month (' + MN[new Date().getMonth()] + ')']].concat(MN.map((x, i) => [i + 1, x]));
    return '<div class="two"><label class="fl">Region<select class="in" data-bind="forage.region" data-then="fgFilter">' + ropts.map(o => '<option value="' + o[0] + '"' + (s.region === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>' +
      '<label class="fl">Month<select class="in" data-bind="forage.month" data-type="number" data-then="fgFilter">' + mopts.map(o => '<option value="' + o[0] + '"' + (+s.month === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label></div>' +
      '<div class="chips">' + CATS.map(c => '<button class="chip' + (s.cat === c[0] ? ' on' : '') + '" data-act="fgCat" data-v="' + c[0] + '">' + c[1] + '</button>').join('') +
      '<button class="chip' + (s.onlySeason ? ' on' : '') + '" data-act="fgTog" data-k="onlySeason">In season: ' + MN[m - 1] + '</button>' +
      '<button class="chip' + (s.onlyFav ? ' on' : '') + '" data-act="fgTog" data-k="onlyFav">★ Saved</button></div>' +
      '<p class="xs dim">' + (reg.id ? 'Showing plants listed for ' + esc(regName(reg.id)) + (reg.guessed ? ' (guessed from your last saved position: change it above if wrong).' : '.') : (s.region === 'auto' ? 'No saved position yet, so every region is shown. Pick a region above or get your position on Today.' : 'Showing every region.')) + ' Months are rough: ripeness and local rules decide.</p>';
  }
  function plantsTab() {
    const s = ST(), reg = curRegion(), m = curMonth();
    let lst = F.plants.filter(x => x.kind === 'forage');
    lst = lst.filter(x => inRegion(x, reg.id) && (s.cat === 'all' || x.cat === s.cat) && (!s.onlySeason || inSeason(x, m)) && (!s.onlyFav || isFav('plants', x.id)));
    lst.sort((a, b) => a.n.localeCompare(b.n));
    const danger = F.plants.filter(x => x.kind === 'danger');
    const grow = F.plants.filter(x => x.kind === 'grow' && (!s.onlyFav || isFav('plants', x.id))).sort((a, b) => a.n.localeCompare(b.n));
    return hortRipeBlock() +
      '<div class="alert danger"><b class="t">Dangerous plants first</b>Know these lookalikes before you pick anything. Tap one to read it.<div class="chips wrap">' + danger.map(x => '<button class="chip" data-act="fgCard" data-set="plants" data-id="' + esc(x.id) + '">' + esc(x.n) + '</button>').join('') + '</div></div>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('leaf') + ' Wild food, lookalikes listed first</span><span class="sm dim">' + lst.length + '</span></div>' + filterBar() +
      (lst.length ? lst.map(x => row('plants', x)).join('') : '<p class="sm dim center pad">Nothing matches these filters. Clear the filters or pick another month. Leaving a plant alone is always an option.</p>') + '</section>' +
      (grow.length && !s.onlySeason && s.cat === 'all' ? '<section class="card"><div class="ct"><span>' + OA.icon('home') + ' Grow it, do not forage it</span></div><p class="sm dim">Familiar edible weeds and wild fruits from Hortica. Wild lookalikes for these were not verified for this guide, so they are not offered for wild picking.</p>' + grow.map(x => row('plants', x)).join('') + '</section>' : '') +
      '<p class="foot">Cattail and watercress are under Coast and water plants. No photos: confirm with a local field guide or expert.</p>';
  }
  function fungiTab() {
    const f = k => F.fungi.filter(x => x.kind === k), head = f('headline')[0];
    return '<div class="alert danger"><b class="t">' + esc(head.n) + '</b>' + p(head.text) + '</div>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('alert') + ' The deadliest groups</span></div><p class="sm dim">How people die, and when it starts. This is not an identification guide.</p>' +
      f('deadly').map(x => srow('fungi', x.id, x.n, x.latin, tag(x.tox || 'Deadly', 'r'))).join('') + '</section>' +
      '<section class="card hot"><div class="ct"><span>' + OA.icon('phone') + ' If someone ate an unknown mushroom</span></div>' + tel + ol(f('ifate')[0].steps) + '<p class="xs dim">' + srcLine(f('ifate')[0]) + '</p></section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('info') + ' Myths that kill</span></div>' +
      f('myth').map(x => '<details class="fg-d"><summary>' + esc(x.n) + '</summary><p class="sm">' + esc(x.fact) + '</p></details>').join('') + '</section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('book') + ' Learn from people</span></div>' + f('society').map(x => srow('fungi', x.id, x.n, x.url ? host(x.url) : '')).join('') + '</section>';
  }
  const ol = a => '<ol class="ls">' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
  function coastTab() {
    const reg = curRegion(); const sh = find('coast', 'shellfish'), sw = find('coast', 'seaweed');
    const seaw = F.coast.filter(x => x.kind === 'seaweed' && x.id !== 'seaweed');
    const water = F.coast.filter(x => x.cat === 'water'), marsh = F.coast.filter(x => x.cat === 'marsh');
    return '<div class="alert danger"><b class="t">Shellfish and red tide</b>' + esc(sh.text[0]) + ' <button class="lnk" data-act="fgCard" data-set="coast" data-id="shellfish">Read more</button></div>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('water') + ' Seaweed: rules first</span></div>' + ul(sw.cautions.slice(0, 3)) + '<button class="btn block" data-act="fgCard" data-set="coast" data-id="seaweed">All seaweed cautions</button>' +
      seaw.map(x => row('coast', x)).join('') + '</section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('leaf') + ' Lake and marsh plants</span></div>' + water.concat(marsh).map(x => row('coast', x)).join('') + '</section>' +
      '<section class="card tip"><div class="ct"><span>' + OA.icon('drop') + ' Water from lakes, marshes and the sea</span></div><p class="sm">No plant, charcoal, sand or cloth makes water safe to drink. Boil it or use a rated filter plus disinfectant.</p><button class="btn block" data-act="fgCard" data-set="useful" data-id="u_water">Read the water card</button></section>' +
      (reg.id && reg.id !== 'ca' ? '<p class="xs dim">Shellfish dates on this page are California rules. Other states run their own closures.</p>' : '') +
      '<p class="foot">Seaweed notes come from Hortica\'s seaweed guide. State rules on which seaweeds you may take were not verified here.</p>';
  }
  function usefulTab() {
    const w = find('useful', 'u_water'), rest = F.useful.filter(x => x.id !== 'u_water');
    return '<section class="card hot"><div class="ct"><span>' + OA.icon('drop') + ' ' + esc(w.n) + '</span></div>' + ul(w.text) + '<p class="xs dim">' + srcLine(w) + '</p></section>' +
      '<section class="card"><div class="ct"><span>' + OA.icon('tool') + ' Plants that help (not food)</span></div>' +
      rest.map(x => srow('useful', x.id, x.n, x.latin, x.basis ? tag('General practice', 'w') : '')).join('') + '</section>' +
      '<p class="foot">These are not substitutes for training. Learn fire, shelter and first aid from an instructor before you need them.</p>';
  }
  function logTab() {
    return '<section class="card"><div class="ct"><span>' + OA.icon('camera') + ' My finds</span></div><div class="alert"><b class="t">A log is a memory aid, not an identification</b>Nothing here says that what you saved is what you wrote. Do not eat anything because it is in your log.</div>' +
      '<button class="btn gold block" data-act="fgLog">Add a find</button><div class="fg-log sm dim">Loading…</div></section>' + favBlock();
  }
  function favBlock() {
    const favs = Object.keys(ST().fav).filter(k => ST().fav[k]).map(k => { const [set, id] = k.split(':'); const it = find(set, id); return it ? { set, it } : null; }).filter(Boolean);
    if (!favs.length) return '<section class="card"><div class="ct"><span>★ Saved cards</span></div><p class="sm dim">Tap the star on any plant to keep it here.</p></section>';
    return '<section class="card"><div class="ct"><span>★ Saved cards</span></div>' + favs.map(x => row(x.set, x.it)).join('') + '</section>';
  }
  function srcLine(it) {
    const s = it.src || [];
    if (!s.length) return it.basis ? esc(it.basis) : 'Not verified in this build: check with a local expert or the land manager.';
    return 'Sources: ' + s.map(u => /^https?:/.test(u) ? lnk(u) : esc(u.replace('hortica:', 'Hortica app data, ').replace('js/', ''))).join(', ') + '. Read ' + esc(it.asof || '') + '.' + (it.srcNote ? ' ' + esc(it.srcNote) : '');
  }

  function searchTab(q) {
    const res = search(q), mush = /mushroom|fung|toadstool|shroom|amanita|morel|chanterelle|puffball|boletus|truffle/i.test(q);
    let h = '';
    if (mush) h += '<div class="alert danger"><b class="t">Mushrooms: danger guide, not an ID guide</b>This app never tells you a wild mushroom is safe. <button class="lnk" data-act="fgTab" data-tab="fungi">Open the mushroom danger guide</button></div>';
    h += '<section class="card"><div class="ct"><span>' + OA.icon('search') + ' ' + res.length + ' result' + (res.length === 1 ? '' : 's') + '</span></div>';
    if (!res.length) h += '<p class="sm dim">Nothing matches. This guide covers only plants whose lookalikes could be checked, so not finding a plant here says nothing about whether it is safe. If you cannot identify it, leave it.</p>';
    res.slice(0, 40).forEach(r => { const it = find(r.set, r.id); h += srow(r.set, r.id, r.n, (r.latin ? r.latin + ' · ' : '') + SETNAME[r.set], it && it.kind === 'danger' ? tag('Dangerous: never food', 'r') : ''); });
    if (res.length > 40) h += '<p class="xs dim">Showing the first 40. Type more to narrow.</p>';
    return h + '</section>';
  }

  /* ---------- the guide shell ---------- */
  function shell() {
    return '<div class="fg-ban alert danger"><b class="t">This app cannot identify plants or mushrooms.</b>If in doubt, leave it. <button class="lnk" data-act="fgTab" data-tab="rules">Rules and risks</button></div>' +
      '<input class="in fg-q" type="search" placeholder="Search: berries, camas, yew, seaweed…" autocomplete="off" aria-label="Search the foraging guide">' +
      '<div class="chips fg-tabs" role="tablist"></div><div class="fg-main"></div>';
  }
  function paint(root) {
    const main = root.querySelector('.fg-main'); if (!main) return;
    const q = V.q.trim(), tabs = root.querySelector('.fg-tabs');
    tabs.innerHTML = TABS.map(t => '<button class="chip' + (!q && V.tab === t[0] ? ' on' : '') + '" role="tab" data-act="fgTab" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>').join('');
    const on = tabs.querySelector('.chip.on'); if (on) tabs.scrollLeft = Math.max(0, on.offsetLeft - 24);
    if (q.length >= 2) { main.innerHTML = searchTab(q); return; }
    const t = V.tab;
    main.innerHTML = t === 'plants' ? plantsTab() : t === 'fungi' ? fungiTab() : t === 'coast' ? coastTab() : t === 'useful' ? usefulTab() : t === 'log' ? logTab() : rulesTab();
    if (t === 'log') fillLog(main);
  }
  let tmr = null;
  function mount(root) {
    root.classList.add('fg'); root.innerHTML = shell();
    const inp = root.querySelector('.fg-q'); inp.value = V.q;
    inp.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => { V.q = inp.value; paint(root); }, 180); });
    paint(root);
    if (V.scroll != null) { const sc = V.scroll; V.scroll = null; const sh = document.getElementById('sheet'); requestAnimationFrame(() => { if (root.closest('#sheet') && sh) sh.scrollTop = sc; }); }
  }
  const rootOf = el => (el && el.closest && el.closest('.fg')) || document.querySelector('.fg');
  const repaint = el => { const r = rootOf(el); if (r) paint(r); };
  function open() {
    return gate().then(ok => { if (!ok) return; OA.sheet('Foraging guide', '<div class="fg"></div>', { onOpen(body) { mount(body.querySelector('.fg')); } }); });
  }

  /* ---------- cards ---------- */
  function cardHtml(set, it) {
    if (set === 'fungi') return fungiCard(it);
    if (set === 'useful') return usefulCard(it);
    let h = '<div>' + kindTag(it) + (it.kind === 'forage' || it.kind === 'grow' ? riskTag(it) : '') + '</div>';
    if (it.kind === 'rule') {
      h += '<div class="alert danger"><b class="t">' + esc(it.n) + '</b></div>' + p(it.text || []);
      return h + gardenBlock(it) + '<p class="xs dim">' + srcLine(it) + '</p>';
    }
    if (it.kind === 'danger') h += '<div class="alert danger"><b class="t">Dangerous: never food</b>' + esc(it.part) + '</div>';
    else if (it.kind === 'grow') h += '<div class="alert"><b class="t">Wild picking not covered</b>' + esc(it.lookNone) + '</div>';
    else if ((it.look || []).length) {
      h += '<div class="alert danger"><b class="t">Dangerous lookalikes: check these FIRST</b>' + it.look.map(l => '<div style="margin:8px 0"><b>' + esc(l.n) + '</b>' + (l.latin ? ' <i class="sm dim">' + esc(l.latin) + '</i>' : '') + ' ' + lvTag(l.level) + '<div class="sm">' + esc(l.diff) + '</div>' + (l.id && find('plants', l.id) ? '<button class="lnk" data-act="fgCard" data-set="plants" data-id="' + esc(l.id) + '">Open the ' + esc(find('plants', l.id).n) + ' card</button>' : '') + '</div>').join('') + '</div>';
    } else h += '<div class="alert"><b class="t">Lookalikes</b>' + esc(it.lookNone || 'None listed.') + '</div>';
    h += '<div class="alert danger" style="border-color:var(--warn);background:#e0a45814"><b class="t" style="color:var(--warn)">Not an identification</b>Confirm with a local field guide or an expert in person. Never eat it on this card alone. If in doubt, leave it.</div>';
    if ((it.see || []).length) h += '<h3>How to recognise it</h3>' + ul(it.see);
    if (it.kind === 'forage') h += '<h3>What is eaten, and how</h3><p><b>' + esc(it.part) + '</b></p>' + (it.prep ? '<p>' + esc(it.prep) + '</p>' : '');
    if ((it.cautions || []).length) h += '<h3>Other cautions</h3>' + ul(it.cautions);
    const where = [];
    if (it.habitat) where.push('<div class="kv"><span>Where</span><span>' + esc(it.habitat) + '</span></div>');
    if (it.regions && it.regions.length < 5) where.push('<div class="kv"><span>Regions</span><span>' + esc(it.regions.map(regName).join(', ')) + '</span></div>');
    else if (it.regions) where.push('<div class="kv"><span>Regions</span><span>Widespread</span></div>');
    if (it.months && it.months.length) where.push('<div class="kv"><span>When (rough)</span><span>' + esc(monthText(it.months)) + '</span></div>');
    if (it.monthsNote) where.push('<p class="xs dim">' + esc(it.monthsNote) + '</p>');
    if (where.length) h += '<h3>Where and when</h3>' + where.join('');
    if (it.legal) h += '<h3>Land rules</h3><p class="sm">' + esc(it.legal) + '</p><p class="xs dim">Always check with the land manager. Gathering is banned in many parks.</p>';
    h += gardenBlock(it);
    h += '<div class="row"><button class="btn" data-act="fgFav" data-set="' + set + '" data-id="' + esc(it.id) + '" data-card="1">' + (isFav(set, it.id) ? '★ Saved' : '☆ Save') + '</button>' + (it.kind === 'forage' ? '<button class="btn" data-act="fgLog" data-set="' + set + '" data-id="' + esc(it.id) + '">Log a find</button>' : '') + '</div>';
    return h + '<p class="xs dim" style="margin-top:12px">' + srcLine(it) + '</p>';
  }
  function gardenBlock(it) {
    const h = hortica(); if (!h) return '';
    if (it.hid) {
      const r = (h.ripe || []).find(x => x.id === it.hid);
      if (r) return '<div class="card tip inner"><b>In your Hortica garden</b><div class="sm">Ripe now: ' + esc(r.n || it.n) + (r.until ? ', until ' + esc(OA.fmtDate(r.until, { month: 'short', day: 'numeric' })) : '') + '. Picking your own is far safer than a wild lookalike.</div></div>';
      if (it.hortica) return '<div class="card inner"><b>In Hortica</b><div class="sm">Hortica has a garden page for this plant. Growing it yourself removes the identification risk.</div></div>';
    }
    return '';
  }
  function fungiCard(it) {
    let h = '';
    if (it.kind === 'deadly') {
      h += '<div class="alert danger"><b class="t">Do not eat any wild mushroom on an app\'s word</b>This card explains why. It does not help you identify anything.</div><p><i>' + esc(it.latin) + '</i></p><div class="kv"><span>Toxin</span><span>' + esc(it.toxin) + '</span></div><h3>How it hurts people</h3>' + ul(it.how) + '<div class="alert"><b class="t">What to do</b>' + esc(it.do) + '</div>' + tel;
    } else if (it.kind === 'group') {
      h += '<div class="alert"><b class="t">Not a recommendation to eat</b>' + esc(it.say) + '</div><p><i>' + esc(it.latin) + '</i></p><p class="sm">' + esc(it.watch) + '</p><p class="xs dim">' + esc(it.note) + '</p>' + (it.hid ? '<p class="sm">Hortica has a cultivated version of this to grow from a kit.</p>' : '');
    } else if (it.kind === 'society') {
      h += '<p>' + esc(it.note) + '</p>' + (it.url ? '<p>' + lnk(it.url, 'Open ' + host(it.url)) + '</p><p class="xs dim">Opens in your browser (needs signal).</p>' : '');
    } else if (it.kind === 'myth') h += '<p><b>' + esc(it.fact) + '</b></p>';
    else if (it.kind === 'ifate') h += tel + ol(it.steps);
    else if (it.kind === 'headline') h += p(it.text);
    return h + '<p class="xs dim" style="margin-top:12px">' + srcLine(it) + '</p>';
  }
  function usefulCard(it) {
    let h = '';
    if (it.basis) h += '<div class="alert"><b class="t">General practice</b>' + esc(it.basis) + '</div>';
    h += ul(it.text || []);
    if ((it.cautions || []).length) h += '<h3>Cautions</h3>' + ul(it.cautions);
    return h + '<p class="xs dim" style="margin-top:12px">' + srcLine(it) + '</p>';
  }
  function openCard(set, id) {
    const it = find(set, id); if (!it) return;
    OA.sheet(it.n, cardHtml(set, it));
  }

  /* ---------- finds log ---------- */
  const L = { photoId: null, lat: null, lon: null, saved: false, set: null, id: null };
  async function logs() { try { const all = await OA.db.all('kv'); return all.filter(r => r && r.kind === 'forage-log').sort((a, b) => b.ts - a.ts); } catch (e) { return []; } }
  async function fillLog(main) {
    const box = main.querySelector('.fg-log'); if (!box) return;
    const rows = await logs();
    if (!main.isConnected) return;
    if (!rows.length) { box.innerHTML = '<p class="sm">No finds yet. When you see something on a walk, add a note and a photo with your position. It stays on this phone.</p>'; return; }
    box.className = 'fg-log';
    box.innerHTML = rows.map(r => '<div class="li" data-act="fgLogView" data-id="' + esc(r.id) + '" role="button"><div class="ic"><img class="fg-th" alt="" data-ph="' + esc(r.photoId || '') + '" style="' + (r.photoId ? '' : 'display:none') + '">' + (r.photoId ? '' : OA.icon('leaf')) + '</div><div class="tx"><b>' + esc(r.guess || 'Unnamed find') + '</b><span>' + esc(OA.fmtDate(OA.dkey(new Date(r.ts)))) + (r.lat != null ? ' · ' + esc(OA.geo.fmtCoord(r.lat, r.lon)) : '') + '</span><span>' + esc((r.note || '').slice(0, 80)) + '</span></div></div>').join('');
    box.querySelectorAll('img[data-ph]').forEach(async im => { if (!im.dataset.ph) return; try { const rec = await OA.db.get('photos', im.dataset.ph); if (rec) im.src = OA.photo.url(rec); else im.style.display = 'none'; } catch (e) { im.style.display = 'none'; } });
  }
  function openLog(set, id) {
    Object.assign(L, { photoId: null, lat: null, lon: null, saved: false, set: set || null, id: id || null });
    const it = set && id ? find(set, id) : null;
    OA.sheet('Add a find', '<div class="alert"><b class="t">This is a note, not an identification</b>Save what you saw so you can ask an expert or look it up later. Never eat something because you logged it.</div>' +
      '<label class="fl">What do you think it is? (a guess)<input class="in" id="fl-guess" maxlength="80" value="' + esc(it ? it.n : '') + '" placeholder="e.g. a berry shrub by the creek"></label>' +
      '<label class="fl">Notes<textarea class="in" id="fl-note" rows="3" placeholder="Where it grew, what it looked like, what was near it"></textarea></label>' +
      '<div id="fl-photo"></div><button class="btn block" data-act="fgLogPhoto">' + OA.icon('camera') + ' Take or choose a photo</button>' +
      '<div class="kv"><span>Position</span><span id="fl-loc">not set</span></div><button class="btn block" data-act="fgLogLoc">Use my position</button>' +
      '<button class="btn gold block" data-act="fgLogSave">Save to my finds</button>', {
      onOpen() { const f = OA.geo.known(); if (f && !L.lat) { L.lat = f.lat; L.lon = f.lon; const e = document.getElementById('fl-loc'); if (e) e.textContent = OA.geo.fmtCoord(f.lat, f.lon) + ' (last saved)'; } },
      onClose() { if (L.photoId && !L.saved) { OA.db.del('photos', L.photoId).catch(() => { }); L.photoId = null; } }
    });
  }
  function showPhoto(rec) { const b = document.getElementById('fl-photo'); if (b && rec) b.innerHTML = '<img class="lg-prev" alt="Photo you took" src="' + OA.photo.url(rec) + '">'; }

  OA.act({
    fgTab(el) { V.tab = el.dataset.tab; V.q = ''; const r = rootOf(el); if (r) { const i = r.querySelector('.fg-q'); if (i) i.value = ''; paint(r); const sh = document.getElementById('sheet'); if (sh && r.closest('#sheet')) sh.scrollTop = 0; else window.scrollTo(0, 0); } },
    fgCard(el, ev) {
      if (ev && ev.target.closest && ev.target.closest('.fg-star')) return;
      const sh = document.getElementById('sheet');
      if (sh && sh.classList.contains('open') && el.closest('.fg') && el.closest('#sheet')) V.scroll = sh.scrollTop;
      openCard(el.dataset.set, el.dataset.id);
    },
    fgFav(el, ev) {
      if (ev) ev.stopPropagation(); const k = key(el.dataset.set, el.dataset.id), s = ST(); if (s.fav[k]) delete s.fav[k]; else s.fav[k] = 1; OA.saveSoon();
      const on = !!s.fav[k];
      if (el.dataset.card) el.textContent = on ? '★ Saved' : '☆ Save';
      else { el.textContent = on ? '★' : '☆'; el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); if (s.onlyFav || V.tab === 'log') repaint(el); }
      OA.toast(on ? 'Saved' : 'Removed from saved', 1200);
    },
    fgFilter(el) { repaint(el); },
    fgCat(el) { ST().cat = el.dataset.v; OA.saveSoon(); repaint(el); },
    fgTog(el) { const k = el.dataset.k; ST()[k] = !ST()[k]; OA.saveSoon(); repaint(el); },
    fgGate(el) { return gate().then(ok => { if (ok) OA.render(true); }); },
    fgOpenFull() { return open(); },
    fgLog(el) { openLog(el.dataset.set, el.dataset.id); },
    async fgLogPhoto(el) {
      el.disabled = true;
      try { const rec = await OA.photo.pick({ tag: 'forage', note: 'Forage find (a note, not an identification)', gps: true }); if (rec) { if (L.photoId) OA.db.del('photos', L.photoId).catch(() => { }); L.photoId = rec.id; if (rec.lat != null) { L.lat = rec.lat; L.lon = rec.lon; const e = document.getElementById('fl-loc'); if (e) e.textContent = OA.geo.fmtCoord(rec.lat, rec.lon); } showPhoto(rec); } }
      finally { el.disabled = false; }
    },
    async fgLogLoc(el) { el.disabled = true; try { const f = await OA.geo.position(); L.lat = f.lat; L.lon = f.lon; const e = document.getElementById('fl-loc'); if (e) e.textContent = OA.geo.fmtCoord(f.lat, f.lon); } catch (e) { OA.toast(e.message, 4000); } finally { el.disabled = false; } },
    async fgLogSave() {
      const g = document.getElementById('fl-guess'), n = document.getElementById('fl-note');
      const rec = { id: 'fl-' + OA.uid(), kind: 'forage-log', ts: Date.now(), guess: g ? g.value.trim() : '', note: n ? n.value.trim() : '', photoId: L.photoId, lat: L.lat, lon: L.lon, set: L.set, itemId: L.id };
      if (!rec.guess && !rec.note && !rec.photoId) return OA.toast('Add a note or a photo first.');
      await OA.db.put('kv', rec); L.saved = true; OA.toast('Saved to your finds'); OA.closeSheet();
    },
    async fgLogView(el) {
      const r = await OA.db.get('kv', el.dataset.id); if (!r) return;
      let img = ''; if (r.photoId) { const rec = await OA.db.get('photos', r.photoId).catch(() => null); if (rec) img = '<img class="lg-full" alt="Your photo" src="' + OA.photo.fullUrl(rec) + '">'; }
      const ml = r.lat != null ? OA.geo.mapLinks(r.lat, r.lon) : null;
      OA.sheet(r.guess || 'Find', '<div class="alert"><b class="t">A note, not an identification</b>Do not eat it because it is saved here.</div>' + img + '<div class="kv"><span>Saved</span><span>' + esc(new Date(r.ts).toLocaleString()) + '</span></div>' + (r.lat != null ? '<div class="kv"><span>Position</span><span>' + esc(OA.geo.fmtCoord(r.lat, r.lon)) + '</span></div>' + (ml && ml.google ? '<p class="sm">' + lnk(ml.google, 'Open in a map (needs signal)') + '</p>' : '') : '') + (r.note ? '<p>' + esc(r.note) + '</p>' : '') +
        (r.set && r.itemId && find(r.set, r.itemId) ? '<button class="btn block" data-act="fgCard" data-set="' + esc(r.set) + '" data-id="' + esc(r.itemId) + '">Open its card</button>' : '') +
        '<button class="btn danger block" data-act="fgLogDel" data-id="' + esc(r.id) + '">Delete this find</button>');
    },
    async fgLogDel(el) {
      if (!await OA.confirm('Delete this find and its photo from this phone?', 'Delete')) return;
      const r = await OA.db.get('kv', el.dataset.id); if (r && r.photoId) await OA.db.del('photos', r.photoId).catch(() => { });
      await OA.db.del('kv', el.dataset.id); OA.toast('Deleted'); OA.closeSheet();
    }
  });

  /* ---------- the Survive tab segment ---------- */
  BP.surviveSections.push({
    id: 'forage', label: 'Forage', order: 40,
    render(el) {
      const wrap = document.createElement('div'); el.innerHTML = ''; el.appendChild(wrap);
      if (!OA.S.gates[GATE]) {
        wrap.innerHTML = '<section class="card"><div class="ct"><span>' + OA.icon('leaf') + ' Foraging and useful plants</span></div><div class="alert danger"><b class="t">Read the safety rules first</b>This guide lists dangerous lookalikes before edible plants and teaches mushroom danger, not mushroom identification.</div><button class="btn gold block" data-act="fgGate">Read the rules and open the guide</button></section>';
        return;
      }
      wrap.className = 'fg-seg'; const inner = document.createElement('div'); wrap.appendChild(inner); mount(inner);
    }
  });

  BP.forage = { open, search, card: openCard };
})();
