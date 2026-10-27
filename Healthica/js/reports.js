/* Healthica doctor reports: plain-text summaries for any visit (general health, blood pressure, injuries,
   peptides, symptoms, medicines, weight and food, diabetes, patterns) and an appointment prep pack that
   picks the right ones for the visit, lists what changed since last time, and keeps your questions. */
const RP_TYPES = [['summary', 'Health summary'], ['meds', 'Medicines and supplements'], ['bp', 'Blood pressure'], ['dia', 'Diabetes (Steady Sugar)'], ['injury', 'Injuries and recovery'], ['sym', 'Symptoms'], ['pep', 'Peptides'], ['weight', 'Weight, food and activity'], ['pat', 'Patterns Healthica noticed']];
const rpD = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const rpDay = k => parseKey(k).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const rpTr = name => S.trackers.find(t => t.name === name);
const rpLogs = (tr, days) => tr ? S.logs.filter(l => l.trackerId === tr.id && l.ts >= Date.now() - days * 86400000).sort((a, b) => a.ts - b.ts) : [];
const rpAvg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
function rpBP() { return rpLogs(rpTr('Blood pressure'), 30).map(l => { const m = String(l.value).match(/(\d{2,3})\s*[\/\-\s]\s*(\d{2,3})/); return m ? { ts: l.ts, s: +m[1], d: +m[2], note: l.note || '' } : null; }).filter(Boolean); }
function rpHas(t) {
  if (t === 'summary' || t === 'meds') return true;
  if (t === 'bp') return rpBP().length > 0; if (t === 'dia') return typeof diaOn === 'function' && diaOn();
  if (t === 'injury') return (S.changes || []).some(c => c.kind === 'injury'); if (t === 'sym') return (S.symptoms || []).length > 0;
  if (t === 'pep') return S.trackers.some(x => x.type === 'peptide'); if (t === 'weight') return S.weights.length > 1 || S.food.length > 5;
  if (t === 'pat') return typeof patCached === 'function' && patCached().length > 0; return false;
}
function rpSection(t) {
  const L = [], p = S.profile || {}, h = H(), k = dkey();
  const push = (...a) => a.forEach(x => L.push(x));
  if (t === 'summary') {
    push('HEALTH SUMMARY', `${p.name || ''}${p.age ? ', age ' + p.age : ''}${p.sex ? ', ' + (p.sex === 'm' ? 'male' : 'female') : ''}`);
    const w = sortedWeights(); if (w.length) push('Weight: ' + showW(w[w.length - 1].kg) + ' ' + wUnit() + ' (' + rpDay(w[w.length - 1].date) + ')');
    const c = Array.from(condSet()).filter(x => !['minor'].includes(x)); push('Conditions: ' + (c.length ? c.map(condLabel).join(', ') : 'none listed') + (h.condOther ? ', ' + h.condOther : ''));
    push('Allergies: ' + ([(h.allergies || []).map(a => (ALLERGENS[a] || [a])[0]).join(', '), S.ice && S.ice.medAllergy].filter(Boolean).join('; ') || 'none listed'));
    const inj = (S.changes || []).filter(x => x.kind === 'injury' && x.status === 'active'); if (inj.length) push('Current injuries: ' + inj.map(x => x.label + ' since ' + rpDay(x.date)).join('; '));
    push('Medicines: ' + (S.settings.medText || 'none listed'));
  }
  if (t === 'meds') {
    push('MEDICINES AND SUPPLEMENTS', 'My list: ' + (S.settings.medText || 'none listed'));
    const sup = S.trackers.filter(x => x.type === 'supp'); if (sup.length) push('Supplements I track: ' + sup.map(x => { const l = rpLogs(x, 30); return x.name + (l.length ? ' (' + l.length + ' logs in 30 days, last ' + l[l.length - 1].value + ' ' + (l[l.length - 1].unit || '') + ')' : ''); }).join('; '));
    const rx = (S.changes || []).filter(x => x.kind === 'rx'); rx.slice(-8).forEach(x => push('- ' + x.label + ': ' + (x.status === 'active' ? 'started ' : 'stopped ') + rpDay(x.status === 'active' ? x.date : (x.end || x.date)) + (x.why ? ' (' + x.why + ')' : '')));
    try { const r = medCheck([S.settings.medText, sup.map(x => x.name).join(', ')].filter(Boolean).join(', ')); if (r.flags.length) { push('Healthica checker flagged (general information, please confirm):'); r.flags.slice(0, 10).forEach(f => push('- ' + f.a + ' + ' + f.b + ': ' + f.text)); } } catch (e) { }
    push('Question: Are all of these still needed, and do any of them interact?');
  }
  if (t === 'bp') {
    const R = rpBP(); push('BLOOD PRESSURE, LAST 30 DAYS (' + R.length + ' readings)');
    if (R.length) {
      push('Average ' + Math.round(rpAvg(R.map(r => r.s))) + '/' + Math.round(rpAvg(R.map(r => r.d))) + ' mmHg · highest ' + Math.max(...R.map(r => r.s)) + '/' + Math.max(...R.map(r => r.d)));
      const am = R.filter(r => new Date(r.ts).getHours() < 12), pm = R.filter(r => new Date(r.ts).getHours() >= 12);
      if (am.length && pm.length) push('Mornings ' + Math.round(rpAvg(am.map(r => r.s))) + '/' + Math.round(rpAvg(am.map(r => r.d))) + ' · afternoons and evenings ' + Math.round(rpAvg(pm.map(r => r.s))) + '/' + Math.round(rpAvg(pm.map(r => r.d))));
      push('At or above 130/80: ' + R.filter(r => r.s >= 130 || r.d >= 80).length + ' · at or above 140/90: ' + R.filter(r => r.s >= 140 || r.d >= 90).length + ' · 180/120 or higher: ' + R.filter(r => r.s >= 180 || r.d >= 120).length);
      push('Readings:'); R.forEach(r => push('  ' + rpD(r.ts) + '  ' + r.s + '/' + r.d + (r.note ? '  ' + r.note : '')));
    }
    push('Question: Is my home blood pressure where you want it, and is my cuff and technique right?');
  }
  if (t === 'dia' && typeof diaReportText === 'function') push(diaReportText());
  if (t === 'injury') {
    push('INJURIES AND RECOVERY');
    (S.changes || []).filter(x => x.kind === 'injury').slice(-6).forEach(c => {
      push('- ' + c.label + ': ' + (['', 'mild', 'moderate', 'severe'][+c.sev] || 'severity not set') + ', since ' + rpDay(c.date) + ' (day ' + (Math.round((parseKey(k) - parseKey(c.date)) / 86400000) + 1) + '), ' + (c.status === 'active' ? 'still healing' : 'healed ' + (c.end ? rpDay(c.end) : '')) + (c.note ? '. Notes: ' + c.note : ''));
      const ws = S.workouts.filter(w => w.date >= c.date); if (ws.length) push('  Workouts since: ' + ws.length + ' (' + ws.filter(w => w.kind === 'cardio').length + ' cardio).');
    });
    push('Questions: What can I safely load now? What should I avoid, and for how long? What signs mean I should stop?');
  }
  if (t === 'sym') {
    push('SYMPTOM HISTORY (Healthica symptom helper)');
    (S.symptoms || []).slice(-15).forEach(s => push('- ' + rpD(s.ts) + ': ' + (s.labels || 'check-in') + (s.level ? ' [' + s.level + ']' : '')));
    ['Mood', 'Energy', 'Sleep', 'Pain', 'Headache'].forEach(n => { const l = rpLogs(rpTr(n), 30).map(x => parseFloat(x.value)).filter(v => !isNaN(v)); if (l.length >= 3) push(n + ' (last 30 days): average ' + Math.round(rpAvg(l) * 10) / 10 + ', range ' + Math.min(...l) + ' to ' + Math.max(...l) + ', ' + l.length + ' logs'); });
  }
  if (t === 'pep') {
    push('PEPTIDES (what I logged; Healthica gives no doses)');
    S.trackers.filter(x => x.type === 'peptide').forEach(x => { const l = rpLogs(x, 60); push('- ' + x.name + ': ' + l.length + ' logs in 60 days' + (l.length ? ', first ' + rpD(l[0].ts) + ', last ' + rpD(l[l.length - 1].ts) + ', last entry ' + l[l.length - 1].value + ' ' + (l[l.length - 1].unit || '') + (l[l.length - 1].note ? ' (' + l[l.length - 1].note + ')' : '') : '')); });
    push('Questions: Is this safe with my conditions and medicines? Which labs should we check (for example glucose, IGF-1, kidney and liver)? Is my source reliable?');
  }
  if (t === 'weight') {
    push('WEIGHT, FOOD AND ACTIVITY');
    const w = sortedWeights().filter(x => x.date >= addDays(k, -90)); if (w.length > 1) push('Weight: ' + showW(w[0].kg) + ' ' + wUnit() + ' (' + rpDay(w[0].date) + ') to ' + showW(w[w.length - 1].kg) + ' ' + wUnit() + ' (' + rpDay(w[w.length - 1].date) + ')');
    const days = []; for (let i = 1; i <= 14; i++) { const d = addDays(k, -i); if (foodsOn(d).length >= 2) days.push(totalsOn(d)); }
    if (days.length >= 3) push('Food, ' + days.length + ' logged days of the last 14: about ' + Math.round(rpAvg(days.map(x => x.kcal))) + ' kcal, protein ' + Math.round(rpAvg(days.map(x => x.p))) + ' g, carbs ' + Math.round(rpAvg(days.map(x => x.c))) + ' g, fibre ' + Math.round(rpAvg(days.map(x => x.fib))) + ' g a day');
    const ws = S.workouts.filter(x => x.date >= addDays(k, -28)); push('Workouts, last 4 weeks: ' + ws.length + ' (' + ws.filter(x => x.kind === 'cardio').length + ' cardio), about ' + Math.round(ws.reduce((s, x) => s + (x.minutes || 0), 0) / 4) + ' minutes a week');
  }
  if (t === 'pat' && typeof patCached === 'function') { push('PATTERNS HEALTHICA NOTICED (clues, not proof)'); patCached().slice(0, 6).forEach(r => push('- ' + patSentence(r) + ' [' + r.ny + ' vs ' + r.nn + ' days]')); push('I have not changed any medicine, peptide or supplement because of these patterns.'); }
  return L.join('\n');
}
function rpBuild(types, head) {
  const p = S.profile || {}, parts = ['HEALTHICA REPORT' + (p.name ? ' - ' + p.name : ''), 'Prepared ' + new Date().toLocaleDateString() + '. From my own logs in a wellness app. Not a medical record.', ''];
  if (head) parts.push(head, '');
  types.forEach(t => { const s = rpSection(t); if (s) parts.push(s, ''); });
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function rpShow(title, txt) {
  window.RPTXT = txt;
  openSheet(title, `<textarea id="rptxt" class="in" rows="18" readonly>${esc(txt)}</textarea>
    <div class="row wrap"><button class="btn gold" data-act="rpCopy">Copy</button><button class="btn" data-act="rpSave">Save as file</button><button class="btn" data-act="rpPrint">Print</button></div>
    <button class="btn block" data-act="rpOpen">Other reports</button>`);
}
function rpMenu() {
  const ap = (S.appts || []).filter(a => !a.done && a.date >= dkey()).sort((a, b) => (a.date + a.time) < (b.date + b.time) ? -1 : 1).slice(0, 4);
  return `<p class="sm dim">Ready-to-share summaries from your own logs. Copy into a patient portal message, save as a file, or print for the visit.</p>
    ${ap.length ? `<div class="ct"><span>Get ready for an appointment</span></div>${ap.map(a => `<div class="entry" data-act="rpPrep" data-id="${a.id}"><div><b>${esc(a.title)}</b><div class="sm dim">${esc(a.kind || '')} · ${rpDay(a.date)} ${hhmm(a.time)}</div></div><span class="mini">Prepare</span></div>`).join('')}` : '<div class="sm dim">Add an appointment in Health updates and Healthica builds a prep pack for it.</div>'}
    <div class="ct"><span>Single reports</span></div>
    ${RP_TYPES.map(t => { const ok = rpHas(t[0]); return `<button class="btn block" data-act="rpOne" data-v="${t[0]}" ${ok ? '' : 'disabled'}>${t[1]}${ok ? '' : ' (nothing logged yet)'}</button>`; }).join('')}`;
}
const RP_BY_KIND = { 'Doctor visit': ['summary', 'meds', 'bp', 'dia', 'sym', 'weight', 'pat'], 'Physical therapy': ['injury', 'weight'], 'Therapy or counseling': ['sym', 'pat'], 'Specialist': ['summary', 'meds', 'bp', 'dia', 'injury', 'sym', 'pep'], 'Lab work or imaging': ['meds'], 'Dentist': ['summary', 'meds'], 'Other': ['summary', 'meds'] };
function rpPrep(a) {
  const types = (RP_BY_KIND[a.kind] || RP_BY_KIND.Other).filter(rpHas);
  const prev = (S.appts || []).filter(x => x.done && x.kind === a.kind && x.date < a.date).sort((x, y) => x.date < y.date ? 1 : -1)[0], since = prev ? prev.date : addDays(dkey(), -90);
  const ch = (S.changes || []).filter(c => c.date >= since && c.kind !== 'appt');
  const head = ['VISIT: ' + a.title + ' (' + (a.kind || 'appointment') + '), ' + rpDay(a.date) + ' ' + hhmm(a.time) + (a.place ? ' at ' + a.place : ''),
    'WHAT CHANGED SINCE ' + (prev ? 'MY LAST ' + (a.kind || 'VISIT').toUpperCase() + ' (' + rpDay(prev.date) + ')' : 'THE LAST 3 MONTHS') + ':', ch.length ? ch.map(c => '- ' + rpDay(c.date) + ': ' + (c.kind === 'rx' ? (c.status === 'stopped' ? 'Stopped prescription: ' : 'New prescription: ') : c.kind === 'condition' ? 'New condition: ' : '') + c.label + (c.status && c.status !== 'active' ? ' (' + c.status + ')' : '')).join('\n') : '- Nothing new logged.',
    '', 'MY QUESTIONS:', (a.questions || '').trim() ? a.questions.trim().split('\n').map(q => '- ' + q.replace(/^[-•]\s*/, '')).join('\n') : '- (add your questions in Healthica)'];
  if (a.kind === 'Lab work or imaging') head.push('', 'Ask: Do I need to fast or stop any supplement (for example biotin) before this test?');
  return rpBuild(types, head.join('\n'));
}
function rpPrepSheet(a) {
  openSheet('Prepare: ' + a.title, `<p class="sm dim">${esc(a.kind || '')} · ${rpDay(a.date)} ${hhmm(a.time)}. Healthica picks the reports that fit this visit and adds what changed since last time.</p>
    <label class="fl">My questions for this visit (one per line)<textarea id="rpq" class="in" rows="5" placeholder="Why am I so tired in the afternoons?&#10;Can I stop the knee brace?">${esc(a.questions || '')}</textarea></label>
    <button class="btn gold block" data-act="rpPrepGo" data-id="${a.id}">Build my visit pack</button>
    <div class="sm dim">Includes: ${(RP_BY_KIND[a.kind] || RP_BY_KIND.Other).filter(rpHas).map(t => RP_TYPES.find(x => x[0] === t)[1]).join(', ') || 'what changed and your questions'}.</div>`);
}
function rpNextAppt() { const lim = addDays(dkey(), 14); return (S.appts || []).filter(a => !a.done && a.date >= dkey() && a.date <= lim).sort((a, b) => (a.date + a.time) < (b.date + b.time) ? -1 : 1)[0]; }
function rpTodayCard() { const a = rpNextAppt(); if (!a) return ''; const d = Math.round((parseKey(a.date) - parseKey(dkey())) / 86400000); return `<section class="card"><div class="ct"><span>📋 ${esc(a.title)}</span><span class="sm dim">${d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'in ' + d + ' days'}</span></div><div class="sm dim">Get your questions and a summary ready before you go.</div><button class="btn block" data-act="rpPrep" data-id="${a.id}">Prepare for this visit</button></section>`; }
Object.assign(ACT, {
  rpOpen() { openSheet('Doctor reports', rpMenu()); },
  rpOne(el) { const t = el.dataset.v; rpShow((RP_TYPES.find(x => x[0] === t) || [0, 'Report'])[1], rpBuild([t])); },
  rpPrep(el) { const a = (S.appts || []).find(x => x.id === el.dataset.id); if (a) rpPrepSheet(a); },
  rpPrepGo(el) { const a = (S.appts || []).find(x => x.id === el.dataset.id); if (!a) return; a.questions = ($('#rpq').value || '').trim(); save(); rpShow('Visit pack: ' + a.title, rpPrep(a)); },
  rpCopy() { const ta = $('#rptxt'); try { navigator.clipboard.writeText(ta.value).then(() => toast('Copied.'), () => { ta.focus(); ta.select(); }); } catch (e) { ta.focus(); ta.select(); } },
  rpSave() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([window.RPTXT || ''], { type: 'text/plain' })); a.download = 'healthica-report-' + dkey() + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600); },
  rpPrint() { const w = window.open('', '_blank'); if (!w) { toast('Allow pop-ups to print.'); return; } w.document.write('<!doctype html><meta charset="utf-8"><title>Healthica report</title><pre style="white-space:pre-wrap;font:11pt/1.45 -apple-system,Arial,sans-serif;margin:16mm">' + esc(window.RPTXT || '') + '</pre><script>setTimeout(function(){print()},300)<\/script>'); w.document.close(); }
});
