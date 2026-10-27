/* Healthica pattern finder: compares days you did something with days you did not, across everything
   Healthica logs (food, water, workouts, meditation, sleep, supplements and peptides, trackers, blood sugar,
   symptom check-ins). Runs on the phone only. Patterns are clues to test, never proof. */
const PAT_DAYS = 90;
const PAT_GOOD = { Mood: 1, Energy: 1, Sleep: 1, Steps: 1, 'Fasting sugar (next morning)': -1, 'Blood sugar (day average)': -1, 'Blood pressure (top number)': -1, 'Resting heart rate': -1, 'Symptom check-ins': -1 };
const ALC_RX = /\b(beer|wine|vodka|whiske?y|bourbon|rum|tequila|gin|liquor|cocktail|margarita|mimosa|sake|hard seltzer|hard cider|ipa|lager|stout)\b/i;
const CAF_RX = /\b(coffee|espresso|cold brew|latte|cappuccino|americano|energy drink|red bull|monster|matcha|black tea|pre-?workout)\b/i;
const SWEET_RX = /\b(soda|cola|candy|cookie|cake|donut|doughnut|ice cream|pastry|brownie|cupcake|juice|sweet tea|milkshake)\b/i;
function patNum(v) { const s = String(v == null ? '' : v); const m = s.match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
function patTable() {
  const today = dkey(), days = []; for (let i = PAT_DAYS; i >= 1; i--) days.push(addDays(today, -i)); days.push(today);
  const T = {}; days.forEach(d => T[d] = { f: {}, o: {} });
  const ed = !!H().edHist, b = budgetInfo(), m = b.macros;
  /* food-derived factors (only on days with 2+ food entries, so empty days do not count as "no") */
  const fdays = days.filter(d => foodsOn(d).length >= 2), carbs = fdays.map(d => totalsOn(d).c).sort((a, c) => a - c), hiC = carbs.length >= 9 ? carbs[Math.floor(carbs.length * 2 / 3)] : null;
  fdays.forEach(d => {
    const t = totalsOn(d), fs = foodsOn(d), F = T[d].f, hr = e => new Date(e.ts).getHours();
    F['ate plenty of vegetables'] = t.veg >= 300; F['hit your protein target'] = t.p >= m.p * 0.9; F['ate 25 g+ of fibre'] = t.fib >= 25;
    F['logged food after 8 pm'] = fs.some(e => hr(e) >= 20 || /snack/i.test(e.meal) && hr(e) >= 20);
    F['had alcohol'] = fs.some(e => ALC_RX.test(e.name)); F['logged caffeine after 2 pm'] = fs.some(e => CAF_RX.test(e.name) && hr(e) >= 14);
    if (!ed) { F['had sweets or sugary drinks'] = fs.some(e => SWEET_RX.test(e.name)); if (hiC != null) F['ate more carbs than usual'] = t.c >= hiC; }
    if (fs.some(e => e.home)) F['ate food you grew'] = true; else F['ate food you grew'] = false;
  });
  const anyLog = d => foodsOn(d).length || workoutsOn(d).length || S.logs.some(l => l.date === d) || waterOn(d) || mindOn(d);
  days.forEach(d => { if (!anyLog(d)) return; const F = T[d].f, w = workoutsOn(d);
    F['worked out'] = w.length > 0; F['walked or did cardio'] = w.some(x => x.kind === 'cardio'); F['meditated'] = mindOn(d) >= 3; F['drank 6+ glasses of water'] = waterOn(d) >= 6; });
  /* trackers: supplements and peptides become factors; metrics become outcomes */
  const byT = {}; S.logs.forEach(l => { (byT[l.trackerId] = byT[l.trackerId] || []).push(l); });
  S.trackers.forEach(tr => {
    const L = byT[tr.id] || []; if (!L.length) return;
    if (tr.type === 'supp' || tr.type === 'peptide') { const on = new Set(L.map(l => l.date)); days.forEach(d => { if (anyLog(d)) T[d].f['logged ' + tr.name] = on.has(d); }); return; }
    if (tr.name === 'Blood glucose') {
      const mg = l => typeof diaMg === 'function' ? diaMg(l) : (v => v == null ? null : /mmol/i.test(l.unit || '') ? v * 18 : v)(patNum(l.value));
      days.forEach(d => { const all = L.filter(l => l.date === d).map(mg).filter(v => v != null); if (all.length) T[d].o['Blood sugar (day average)'] = all.reduce((s, v) => s + v, 0) / all.length;
        const nx = addDays(d, 1); if (T[nx] !== undefined || nx === addDays(today, 1)) { const f = L.filter(l => l.date === nx && (l.ctx === 'fast' || new Date(l.ts).getHours() < 10)).map(mg).filter(v => v != null); if (f.length) T[d].o['Fasting sugar (next morning)'] = f[0]; } });
      return;
    }
    if (tr.name === 'Sleep') { days.forEach(d => { const nx = L.filter(l => l.date === addDays(d, 1)).map(l => patNum(l.value)).filter(v => v != null); if (nx.length) T[d].o['Sleep'] = nx[0]; const cur = L.filter(l => l.date === d).map(l => patNum(l.value)).filter(v => v != null); if (cur.length) T[d].f['slept under 6.5 hours (night before)'] = cur[0] < 6.5; }); return; }
    const name = tr.name === 'Blood pressure' ? 'Blood pressure (top number)' : tr.name;
    days.forEach(d => { const v = L.filter(l => l.date === d).map(l => patNum(l.value)).filter(x => x != null); if (v.length) T[d].o[name] = v.reduce((s, x) => s + x, 0) / v.length; });
  });
  const sym = new Set((S.symptoms || []).map(s => s.date));
  if (sym.size >= 3) days.forEach(d => { if (anyLog(d)) T[d].o['Symptom check-ins'] = sym.has(d) || sym.has(addDays(d, 1)) ? 1 : 0; });
  return { days, T };
}
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const vari = a => { const m0 = mean(a); return a.length > 1 ? a.reduce((s, x) => s + (x - m0) * (x - m0), 0) / (a.length - 1) : 0; };
function patFind() {
  const { days, T } = patTable(), facs = new Set(), outs = new Set(); days.forEach(d => { Object.keys(T[d].f).forEach(k => facs.add(k)); Object.keys(T[d].o).forEach(k => outs.add(k)); });
  const res = [];
  facs.forEach(f => outs.forEach(o => {
    if (f.startsWith('slept') && o === 'Sleep') return;
    const y = [], n = []; days.forEach(d => { const fv = T[d].f[f], ov = T[d].o[o]; if (fv === undefined || ov === undefined) return; (fv ? y : n).push(ov); });
    const bin = o === 'Symptom check-ins', minN = bin ? 6 : 4; if (y.length < minN || n.length < minN) return;
    const my = mean(y), mn = mean(n), diff = my - mn; let t, eff;
    if (bin) { const p = (y.reduce((s, x) => s + x, 0) + n.reduce((s, x) => s + x, 0)) / (y.length + n.length), se = Math.sqrt(p * (1 - p) * (1 / y.length + 1 / n.length)); t = se ? diff / se : 0; eff = Math.abs(diff); if (eff < 0.2) return; }
    else { const se = Math.sqrt(vari(y) / y.length + vari(n) / n.length), sd = Math.sqrt((vari(y) + vari(n)) / 2); t = se ? diff / se : 0; eff = sd ? Math.abs(diff) / sd : 0; if (eff < 0.4) return; }
    if (Math.abs(t) < 2.5) return; // many comparisons: a higher bar keeps chance findings out
    res.push({ f, o, my, mn, diff, t, eff, ny: y.length, nn: n.length, bin, good: f.startsWith('logged ') && !/food|caffeine/.test(f) ? null : PAT_GOOD[o] ? Math.sign(diff) === PAT_GOOD[o] : null, med: f.startsWith('logged ') && !/food|caffeine/.test(f), strong: Math.abs(t) >= 3.5 && Math.min(y.length, n.length) >= 8 });
  }));
  const seen = new Set(); return res.sort((a, b) => Math.abs(b.t) - Math.abs(a.t)).filter(r => { const sig = r.o + '|' + r.ny + '|' + r.nn + '|' + r.my.toFixed(2) + '|' + r.mn.toFixed(2); if (seen.has(sig)) return false; seen.add(sig); return true; }).slice(0, 12); // same days, same result = one finding
}
function patUnit(o) { return /sugar/.test(o) ? (typeof diaUnitMm === 'function' && diaUnitMm() ? ' mmol/L' : ' mg/dL') : o === 'Sleep' ? ' h' : /pressure/.test(o) ? ' mmHg' : /heart/.test(o) ? ' bpm' : ''; }
function patVal(o, v) { if (/sugar/.test(o) && typeof diaUnitMm === 'function' && diaUnitMm()) return (v / 18).toFixed(1); return Math.abs(v) >= 20 ? Math.round(v) : Math.round(v * 10) / 10; }
function patSentence(r) {
  if (r.bin) return `On days you ${r.f}, you logged a symptom check-in that day or the next ${Math.round(r.my * 100)}% of the time, vs ${Math.round(r.mn * 100)}% on other days.`;
  const lab = r.o === 'Fasting sugar (next morning)' ? 'your fasting sugar the next morning' : r.o === 'Sleep' ? 'you slept' : r.o === 'Blood sugar (day average)' ? 'your blood sugar' : 'your ' + r.o.toLowerCase();
  return `On days you ${r.f}, ${lab} ${r.o === 'Sleep' ? 'about ' + patVal(r.o, Math.abs(r.diff)) + ' h ' + (r.diff > 0 ? 'longer' : 'less') : 'averaged ' + patVal(r.o, Math.abs(r.diff)) + patUnit(r.o) + ' ' + (r.diff > 0 ? 'higher' : 'lower')} (${patVal(r.o, r.my)} vs ${patVal(r.o, r.mn)}${patUnit(r.o)}).`;
}
function patHTML(list) {
  if (!list.length) {
    const fd = new Set(S.food.map(e => e.date)).size, ld = new Set(S.logs.map(l => l.date)).size;
    return `<section class="card"><div class="ct"><span>🔎 Patterns</span></div><p class="sm">Nothing stands out yet. Healthica needs about two weeks of logs, with some days you did a thing and some you did not.</p>
      <div class="sm dim">So far: ${fd} days of food, ${ld} days of tracker logs. Most useful to log: Sleep, Mood and Energy (Log tab presets), your food, workouts and water.${typeof diaOn === 'function' && diaOn() ? ' Blood sugar readings with "Fasting" marked make the best sugar patterns.' : ''}</div></section>`;
  }
  return `<p class="sm dim">Healthica compared the last ${PAT_DAYS} days: days you did something vs days you did not. These are clues worth testing, not proof. Other things can explain them.</p>
    ${list.map(r => `<section class="card inner"><div class="sm"><b>${r.med ? '' : r.good === true ? '✓ ' : r.good === false ? '⚠ ' : ''}${esc(patSentence(r))}</b></div><div class="sm dim">${r.strong ? 'Strong pattern' : 'Possible pattern'} · ${r.ny} days vs ${r.nn} days${r.med ? ' · supplements and peptides: talk to your prescriber before changing anything' : ''}</div></section>`).join('')}
    <div class="card inner"><div class="sm"><b>Try it on purpose:</b> pick one pattern and do it (or skip it) for two weeks, then check back.</div><div class="sm dim">Never start, stop or change a medicine, peptide or supplement because of a pattern here. Talk to your prescriber.</div></div>`;
}
let PAT_CACHE = null;
function patCached() { const k = KEY + ':' + S.food.length + ':' + S.logs.length + ':' + S.workouts.length + ':' + (S.symptoms || []).length + ':' + S.trackers.length + ':' + dkey(); if (!PAT_CACHE || PAT_CACHE.k !== k) PAT_CACHE = { k, list: (() => { try { return patFind(); } catch (e) { return []; } })() }; return PAT_CACHE.list; }
function patView() { return patHTML(patCached()); }
function patTodayCard() { const L = patCached().filter(r => r.good !== null && !r.med); if (!L.length) return ''; const r = L.find(x => x.good) || L[0]; return `<section class="card"><div class="ct"><span>🔎 Pattern spotted</span><a class="lnk" data-act="patOpen">See all</a></div><div class="sm">${esc(patSentence(r))}</div><div class="sm dim">A clue, not proof. ${r.ny} vs ${r.nn} days.</div></section>`; }
Object.assign(ACT, { patOpen() { UI.logseg = 'pat'; setTab('log'); } });
(function () { const v0 = viewLog; viewLog = function () { const h = v0(); const seg = h.replace('<div class="seg">', '<div class="seg four">').replace(/(data-v="check">Checker<\/button>)/, '$1<button class="' + (UI.logseg === 'pat' ? 'on' : '') + '" data-act="logseg" data-v="pat">Patterns</button>'); if (UI.logseg !== 'pat') return seg; const m = seg.match(/^([\s\S]*?<div class="seg four">[\s\S]*?<\/div>)/); return (m ? m[1] : '') + patView(); }; })();
