/* Hortica side of the Occultica household (see occ-link.js): publish a small garden summary for Healthica and Saturnica,
   show Healthica's "cook what you grew" ideas, the shared ritual of the day, and Menu > Household.
   Dollar values are rough estimates from a small US$ price table, never prices you paid. */
const HH_PRICE = [ // [match on id or name, US$ per lb]
  [/tomatillo|tomato|ground ?cherry/, 3], [/pepper|jalapeno|habanero|poblano|shishito|cubanelle/, 3], [/zucchini|summer squash|tromboncino/, 2], [/cucumber|cuke|cucamelon/, 2],
  [/winter squash|winsq|pumpkin|butternut|acorn|delicata|spaghetti/, 1.5], [/broccoli|romanesco/, 3], [/garlic(?! chives)/, 6], [/sweet ?pot|potato/, 1], [/onion|shallot|scallion|leek/, 1.5], [/carrot/, 1.5],
  [/lettuce|greens|spinach|kale|arugula|chard|collard|mizuna|tatsoi|bok ?choy|komatsuna|mache|endive|escarole|radicchio|purslane|orach|mustard/, 5],
  [/\bpeas?\b|snow ?pea|snap ?pea/, 4], [/bean|edamame|cowpea|lentil|chickpea/, 4],
  [/strawberr/, 5], [/blueberr/, 7], [/raspberr/, 9], [/berr|currant/, 6], [/^apple|crabapple/, 2]
];
const HH_CAT = { v: 2.5, f: 3, t: 3, s: 3, h: 10, m: 8 }; // per lb; herbs 10/lb is about 2.5 per bunch
const HH_EACH = [[/tomato/, .4], [/pepper|jalapeno|habanero|poblano|shishito/, .3], [/zucchini|summer squash|eggplant/, .7], [/cucumber/, .5], [/lettuce|endive|escarole|radicchio|bok/, .75], [/cabbage|cauli/, 2], [/broccoli|romanesco/, 1],
  [/pumpkin/, 8], [/winter squash|winsq|butternut|acorn|delicata|spaghetti/, 2.5], [/watermelon|melon/, 5], [/cantaloupe|honeydew/, 3], [/corn/, .5], [/garlic/, .12], [/onion/, .4], [/potato/, .4], [/carrot|beet|turnip|parsnip/, .2], [/radish/, .05], [/apple|pear|peach|orange|lemon/, .4]];
function hhVal(h) { // rough US$ for one harvest entry
  const p = PBY[h.p], q = +h.q || 0; if (!p || !(q > 0)) return 0; const k = (p.id + ' ' + p.n).toLowerCase(), u = h.u || 'lb';
  if (p.cat === 'fl') return q * ({ bouquets: 10, bunches: 10, lb: 15, oz: 1, cups: 3 }[u] || 1); // stems or count, about $1 a stem
  const herb = p.cat === 'h', row = herb ? null : HH_PRICE.find(r => r[0].test(k)), perLb = herb ? HH_CAT.h : row ? row[1] : (HH_CAT[p.cat] || 2.5);
  if (u === 'bunches') return q * (herb ? 2.5 : perLb * .5);
  const each = herb ? .02 : (HH_EACH.find(r => r[0].test(k)) || [0, .5])[1];
  const lb = { lb: 1, oz: 1 / 16, pints: .75, quarts: 1.5, cups: .33, count: each, stems: herb ? .02 : .05, bouquets: .5 }[u]; return q * (lb == null ? 1 : lb) * perLb;
}
const hhR = v => Math.round(v * 100) / 100;
function hhData() {
  const now = NOW(), today = dkey(), d30 = dkey(addD(now, -30)), y = String(now.getFullYear()), end = addD(now, 60), endK = dkey(end);
  const good = (S.harv || []).filter(h => h && !h.fail && h.d && h.d <= today);
  const last = good.filter(h => h.d >= d30).sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  const harvest = last.slice(0, 60).map(h => ({ id: h.p, n: pName(h.p), q: +h.q || 0, u: h.u || '', d: h.d, val: hhR(hhVal(h)) }));
  const value30 = Math.round(last.reduce((a, h) => a + hhVal(h), 0)), valueYear = Math.round(good.filter(h => h.d.slice(0, 4) === y).reduce((a, h) => a + hhVal(h), 0));
  const ripe = [], seenR = {}, events = [], seenE = {}, ev = (t, d) => { const dk = dkey(d); if (dk < today || dk > endK || seenE[t + dk]) return; seenE[t + dk] = 1; events.push({ t, d: dk, kind: 'garden' }); };
  const SOWT = { i: 'Start seeds indoors', t: 'Transplant', d: 'Sow', f: 'Fall planting', pe: 'Plant', dm: 'Plant' };
  plantGardens().forEach(g => {
    Object.keys(g.cells).forEach(k => { // same window as the daily digest: planting date + days to maturity, for hw weeks
      const c = g.cells[k], p = PBY[c.p]; if (!p || c.s !== 'grow' || !c.d || permLike(p) || p.fung || p.cat === 'c') return;
      const hs = addD(pd(c.d), p.days), he = addD(pd(c.d), p.days + p.hw * 7);
      if (p.cat !== 'fl' && dayDiff(hs, now) <= 0 && dayDiff(he, now) >= 0 && !seenR[p.id] && ripe.length < 30) { seenR[p.id] = 1; ripe.push({ id: p.id, n: p.n, until: dkey(he) }); }
      ev((p.cat === 'fl' ? 'Blooms due: ' : 'Harvest window opens: ') + p.n, hs);
    });
    gardenCounts(g).forEach(o => { const p = PBY[o.id]; if (!p || p.fung || o.grow >= o.tiles) return; try { plantDates(p).steps.forEach(s => ev((SOWT[s.k] || s.label) + ': ' + p.n, s.date)); } catch (e) {} });
  });
  events.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
  return { harvest, ripe, value30, valueYear, events: events.slice(0, 40) };
}
function hhPublish() { try { return OCC.publish('hortica', hhData()); } catch (e) { return null; } }
let hhT = null; const hhSoon = () => { clearTimeout(hhT); hhT = setTimeout(hhPublish, 1000); };
const _saveHh = save;
var save = function () { _saveHh.apply(this, arguments); hhSoon(); };

/* cards at the top of the Garden tab */
function householdCards() {
  if (typeof OCC === 'undefined') return '';
  let h = OCC.ritualHTML('hortica'), v = 0; try { v = hhData().value30; } catch (e) {}
  const H = OCC.get('healthica'), rec = ((H && H.data && H.data.gardenRecipes) || []).filter(r => r && r.n).slice(0, 4), L = [];
  if (rec.length) L.push('<p class="sm"><b>🍳 Cook it:</b> ' + rec.map(r => esc(r.n)).join(', ') + '</p><p class="sm dim">Open Healthica &gt; Food &gt; Kitchen for the recipes.</p>');
  if (v > 0) L.push('<p class="sm"><b>💰 Your garden saved about $' + v.toLocaleString() + ' this month.</b> <span class="dim">Rough estimate from the last 30 days of logged harvests at typical store prices.</span></p>');
  if (L.length) h += '<section class="card occ-hh"><div class="ct"><span>🏡 Household</span><a class="lnk" data-act="occOpen">Linked apps</a></div>' + L.join('') + '</section>';
  return h;
}
OCC.bind(ACT, 'hortica', why => { if (why === 'publish') hhPublish(); else if (why === 'linked' && S.setup && !sheetOpen()) render(); });
window.addEventListener('DOMContentLoaded', () => setTimeout(hhPublish, 0)); // after boot() has loaded S
window.addEventListener('storage', e => { if (e.key === 'occ.pub.healthica' && S.setup && UI.tab === 'garden' && !sheetOpen()) render(); });
