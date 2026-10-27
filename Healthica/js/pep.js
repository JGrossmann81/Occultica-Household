/* Healthica peptides + checker screens. Informational only: no dosing, never a substitute for a prescriber. */
const pepKB = () => (S.settings.pepKB && S.settings.pepKB.items) ? S.settings.pepKB : PEP_DEFAULT;
function pepResolve(name) {
  const kb = pepKB(), n = ' ' + name.toLowerCase().replace(/[^a-z0-9\- ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  for (const it of kb.items) if (it.names.some(a => n.includes(a.toLowerCase()))) return { it, cls: it.cls, sub: it.sub, info: kb.classes[it.cls], tags: [it.cls].concat(it.sub ? [it.cls + '.' + it.sub] : []) };
  return { it: null, cls: 'other', info: kb.classes.other, tags: ['other'] };
}
function myPeptides() {
  const cut = Date.now() - 21 * 86400e3;
  return S.trackers.filter(t => t.type === 'peptide').map(t => {
    const ls = S.logs.filter(l => l.trackerId === t.id).sort((a, b) => b.ts - a.ts), r = pepResolve(t.name);
    return Object.assign({ t, last: ls[0] || null, active: ls.length > 0 && ls[0].ts > cut || ls.length === 0 }, r);
  });
}
function pepPairs(list) {
  const kb = pepKB(), out = [], seen = new Set();
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) kb.pairs.forEach(r => {
    const A = list[i], B = list[j], hit = (x, y) => (r.a === '*' || x.tags.includes(r.a)) && (r.b === '*' || y.tags.includes(r.b));
    if (hit(A, B) || hit(B, A)) { const k = A.t.id + B.t.id + r.text; if (!seen.has(k)) { seen.add(k); out.push({ a: A.t.name, b: B.t.name, level: r.level, text: r.text }); } }
  });
  const C = (typeof condSet === 'function') ? condSet() : new Set(), act = list, has = c => act.some(x => x.cls === c);
  const F = (a, level, text) => out.push({ a, b: '', level, text });
  if (act.length && (C.has('preg') || C.has('bf'))) F('Pregnancy or breastfeeding', 'ask', 'Peptide products are generally avoided in pregnancy and breastfeeding. Talk to your care team before continuing any.');
  if (act.length && C.has('minor')) F('Under 18', 'ask', 'Peptides are not appropriate for growing bodies without specialist care. Please speak with a doctor.');
  if ((has('ghs') || has('healing')) && (C.has('cancer') || C.has('cancerh'))) F('Cancer history', 'ask', 'Growth-promoting peptides are generally avoided with active or past cancer. Talk to your oncologist first.');
  if (has('glp1') && C.has('mtc')) F('MTC or MEN2', 'ask', 'GLP-1 medicines carry a boxed warning for medullary thyroid cancer or MEN2. Do not use unless a specialist says so.');
  if (has('glp1') && (C.has('panc') || C.has('gall'))) F('Pancreas or gallbladder disease', 'ask', 'GLP-1 medicines can aggravate these. Needs your prescriber\'s approval.');
  if (has('glp1') && C.has('edhist')) F('Eating history', 'ask', 'Appetite-suppressing peptides can feed disordered eating. Work with a professional who knows eating disorders.');
  if (has('glp1') && (C.has('t1d') || C.has('t2d'))) F('Diabetes', 'watch', 'GLP-1 medicines can lower blood sugar further with insulin or sulfonylureas. Your prescriber may adjust doses.');
  if (has('ghs') && (C.has('t1d') || C.has('t2d') || C.has('prediab'))) F('Diabetes or insulin resistance', 'watch', 'Growth hormone stimulants can raise blood sugar. Monitor and tell your clinician.');
  if (has('glp1') && C.has('kidney')) F('Kidney disease', 'watch', 'Vomiting and dehydration from GLP-1 medicines can injure the kidneys. Keep fluids up.');
  if (list.length > 3) out.push({ a: 'Your stack', b: '', level: 'watch', text: 'Four or more peptides at once makes it very hard to tell what is causing any side effect. Consider adding one at a time.' });
  return out.sort((x, y) => (x.level === 'ask' ? 0 : 1) - (y.level === 'ask' ? 0 : 1));
}
const LVL = { ask: 'Ask first', space: 'Space apart', watch: 'Watch' };
const flagHTML = f => `<div class="flag ${f.level}"><b>${LVL[f.level]}</b> ${f.b ? esc(f.a) + ' + ' + esc(f.b) : esc(f.a)}<div class="sm">${esc(f.text)}</div></div>`;
function pepTips() {
  const act = myPeptides().filter(p => p.active); if (!act.length) return [];
  const h = new Date().getHours(), seed = Math.floor(Date.now() / 86400e3), out = [], pl = todayPlan(), seen = new Set();
  act.forEach(p => {
    if (seen.has(p.cls)) return; seen.add(p.cls); const f = p.info, pick = (a, o = 0) => a[(seed + o) % a.length];
    const plan = pl && pl.sug ? SPLITS[pl.sug.id][0] : '';
    out.push(['Train', (plan && !['rest', 'active'].includes(pl.sug.id) ? plan + ' today. ' : 'Light day. ') + pick(f.train)]);
    out.push(['Fuel', pick(f.fuel, 1)]);
    out.push([h >= 18 ? 'Wind down tonight' : 'Rest and recovery', pick(f.relax, 2)]);
  });
  return out.slice(0, 3);
}
function pepTodayCard() {
  const tips = pepTips(); if (!tips.length) return '';
  const names = myPeptides().filter(p => p.active).map(p => p.t.name).slice(0, 3).join(', ');
  return `<section class="card"><div class="ct"><span>Peptide check-in</span><a class="lnk" data-act="goPep">Details</a></div><div class="sm dim">Logging: ${esc(names)}</div>
    ${tips.map(t => `<div class="nudge"><b>${esc(t[0])}</b><div class="sm">${esc(t[1])}</div></div>`).join('')}<div class="sm dim">General information, not medical advice. Follow your prescriber.</div></section>`;
}
function pepView() {
  const list = myPeptides(), kb = pepKB(), flags = pepPairs(list.filter(p => p.active));
  const cards = list.length ? list.map(p => `<section class="card"><div class="ct"><span><b>${esc(p.t.name)}</b> <span class="tag">${esc(p.info.label)}</span></span></div>
    <div class="sm dim">${esc(p.info.status)}</div><div class="sm" style="margin-top:6px">${esc(p.info.summary)}</div>
    <details><summary>Things to watch</summary>${p.info.watch.map(w => `<div class="sm">&bull; ${esc(w)}</div>`).join('')}</details></section>`).join('') : '<section class="card"><p>Add a peptide in the Log tab (Track something new, then Peptide) and Healthica will show what is known about it, check it against your others, and send a daily check-in.</p></section>';
  return `${cards}
  ${flags.length ? `<section class="card"><div class="ct"><span>Combination check</span></div>${flags.map(flagHTML).join('')}</section>` : (list.length > 1 ? '<section class="card"><div class="ct"><span>Combination check</span></div><p class="sm">No flags in my reference for this mix. That does not mean it is safe. Run it by your prescriber.</p></section>' : '')}
  <section class="card"><div class="ct"><span>Safe habits</span></div>${kb.general.map(g => `<div class="sm">&bull; ${esc(g)}</div>`).join('')}</section>
  <section class="card"><div class="ct"><span>Reference version</span></div><div class="sm">Knowledge file ${esc(kb.version)}${S.settings.pepChecked ? ' · checked ' + new Date(S.settings.pepChecked).toLocaleDateString() : ''}</div>
    <div class="sm dim">${esc(kb.note)}</div><div class="sm dim">Healthica checks for a newer reference file about once a week when online. It can only pick up a file that was published with the app. It does not research on its own.</div>
    <button class="btn block" data-act="pepUpdate">Check for update now</button><div id="pepmsg" class="sm dim center"></div></section>`;
}
async function pepAutoUpdate(force) {
  const last = S.settings.pepChecked || 0; if (!force && Date.now() - last < 7 * 86400e3) return null;
  try {
    const r = await fetch('data/peptides.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json();
    S.settings.pepChecked = Date.now(); const cur = pepKB().version;
    if (j && j.items && j.version > cur) { S.settings.pepKB = j; save(); return 'updated'; } save(); return 'current';
  } catch (e) { return 'offline'; }
}
/* ---- medication checker ---- */
function checkerView() {
  return `<section class="card"><div class="ct"><span>Medicine and nutrient checker</span></div>
    <div class="sm dim">Type what you take, separated by commas or new lines: medicines, vitamins, supplements, even alcohol or grapefruit. Healthica looks for common side effects and combinations worth asking about. These are only suggestions to bring to a pharmacist or doctor.</div>
    <textarea id="medtxt2" class="in" rows="4" placeholder="e.g. sertraline, ibuprofen, vitamin D, magnesium, creatine">${esc(S.settings.medText || '')}</textarea>
    <button class="btn gold block" data-act="medRun">Check</button></section><div id="medout"></div>`;
}
function medResultHTML(res) {
  let h = '';
  if (!res.found.length && !res.unknown.length) return '<section class="card"><p>Add at least one item.</p></section>';
  if (res.flags.length) h += `<section class="card"><div class="ct"><span>Worth asking about</span></div>${res.flags.map(flagHTML).join('')}</section>`;
  else if (res.found.length > 1) h += '<section class="card"><div class="ct"><span>Combinations</span></div><p class="sm">No combination flags in my built-in reference. This list is small and not complete, so absence of a flag is not a green light. Ask a pharmacist.</p></section>';
  h += res.found.map(x => `<section class="card"><div class="ct"><span><b>${esc(x.m.name)}</b> <span class="tag">${x.m.kind === 'drug' ? 'Medicine' : x.m.kind === 'nutrient' ? 'Nutrient' : x.m.kind === 'food' ? 'Food or drink' : x.m.kind === 'herb' ? 'Herbal / traditional' : 'Supplement'}</span></span></div>
    <div class="sm"><b>Common effects:</b> ${esc(x.m.se)}</div><div class="sm dim"><b>Good to know:</b> ${esc(x.m.note)}</div></section>`).join('');
  if (res.unknown.length) h += `<section class="card"><div class="ct"><span>Not in my built-in list</span></div>${res.unknown.map((u, i) => `<div class="unk" data-u="${esc(u)}"><b>${esc(u)}</b><div class="sm dim" id="unk${i}">Looking up the FDA label...</div></div>`).join('')}<div class="sm dim">Online results come from the FDA drug label database and only cover US-labelled medicines. Herbs, supplements and imported formulas usually are not there, so ask the practitioner for the ingredient list and show it to a pharmacist.</div></section>`;
  if (res.found.some(x => x.m.kind === 'herb')) h += '<section class="card"><div class="sm"><b>About herbal and traditional products:</b> "natural" does not mean safe. Strength varies between brands, and mixed formulas often hold more than the label says. Pregnancy, breastfeeding, children, surgery and any long-term condition call for extra caution. Show your practitioner and your pharmacist the full ingredient lists.</div></section>';
  h += '<p class="sm dim">Healthica is not a medical device. Tell your pharmacist or doctor about everything you take, including supplements.</p>';
  return h;
}
async function runChecker() {
  const txt = ($('#medtxt2').value || '').trim(); S.settings.medText = txt; save();
  const res = medCheck(txt); $('#medout').innerHTML = medResultHTML(res);
  for (let i = 0; i < res.unknown.length; i++) {
    const r = await medOnline(res.unknown[i]), el = $('#unk' + i); if (!el) continue;
    el.innerHTML = r && (r.se || r.warn || r.inter) ? [r.warn && `<b>Warnings:</b> ${esc(r.warn)}`, r.se && `<b>Reported effects:</b> ${esc(r.se)}`, r.inter && `<b>Interactions:</b> ${esc(r.inter)}`].filter(Boolean).join('<br>') : 'No label found, or no connection. Ask a pharmacist about this one.';
  }
}
