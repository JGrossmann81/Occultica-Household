/* Chorica parent side: kids, chores, approvals, payments, sending lists. */
function pendingAll() { return S.done.filter(d => d.status === 'pending').sort((a, b) => a.ts - b.ts); }
function needsSend(kidId) { const last = S.sent[kidId] || 0, x = kidById(kidId); return (x && (x.edited || 0) > last) || S.done.some(d => d.kid === kidId && (d.decidedTs || 0) > last) || S.chores.some(c => forKid(c, kidId) && (c.edited || 0) > last) || S.pay.some(p => p.kid === kidId && p.ts > last) || S.bonus.some(b => b.kid === kidId && b.ts > last); }
function doneRow(d, actions) {
  const c = choreById(d.chore) || { icon: '❔', name: 'Removed chore', amt: 0 }, k = kidById(d.kid) || { name: '?', emoji: '🙂' };
  const other = (c.kids === 'any' || c.turns) && S.done.find(x => x.chore === d.chore && x.key === d.key && x.kid !== d.kid && x.status !== 'rejected');
  return `<div class="chore" style="cursor:default"><span class="ic">${esc(c.icon)}</span><div class="t"><b>${esc(c.name)}</b><div class="sm dim">${esc(k.emoji)} ${esc(k.name)} · ${d.date ? fmtDay(d.date) : ''} ${new Date(d.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${d.from === 'device' ? ' · on this phone' : ''}</div>${d.note ? `<div class="sm">“${esc(d.note)}”</div>` : ''}${d.ph && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d.ph) ? `<img src="${d.ph}" alt="Photo" style="max-width:160px;border-radius:10px;margin:4px 0;display:block">` : d.photo ? `<div class="sm gold">📷 ${d.devph ? 'Photo was attached' : 'Sent a photo with the text message. Check your messages.'}</div>` : ''}${d.late ? '<div class="sm dim">Made up late (was due ' + fmtDay(d.date) + ')</div>' : ''}${other ? `<div class="sm warn">${esc((kidById(other.kid) || {}).name || 'Someone')} also checked this off.</div>` : ''}
    ${actions ? `<div class="row" style="margin-top:6px"><button class="mini" data-act="apOk" data-id="${esc(d.id)}">✓ Approve ${money(c.amt)}</button><button class="mini" data-act="apNo" data-id="${esc(d.id)}">Not yet</button></div>` : `<span class="pill ${d.status === 'approved' ? 'ok' : d.status === 'rejected' ? 'no' : 'wait'}">${d.status === 'approved' ? 'Approved ' + money(d.amt || 0) : d.status === 'rejected' ? 'Not yet' : 'Waiting'}</span>`}</div></div>`;
}
function viewParentHome() {
  const k = dkey(), pend = pendingAll(), pd = parseKey(k).getDay() === +S.fam.payday;
  const owedTotal = S.kids.reduce((s, x) => s + ledger(x.id).owed, 0);
  return `<div class="hd"><span class="av" style="width:52px;height:52px;font-size:28px">🧹</span><div><h1>Chorica</h1><div class="sm dim">${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div></div><button class="gear" data-act="settings" aria-label="Settings">⚙</button></div>
    ${!S.kids.length ? `<section class="card tip"><div class="ct"><span>Start here</span></div><p class="sm">1. Add your kids. 2. Pick their chores and what each pays. 3. Text each kid their list. They check off on their phone and text a code back for you to approve.</p><button class="btn gold block" data-act="kidAdd">Add a kid</button></section>` : ''}
    <button class="btn gold block" data-act="pasteOpen">📥 Paste a code from a kid</button>
    ${pend.length ? `<section class="card alert"><div class="ct"><span>Waiting for you (${pend.length})</span>${pend.length > 1 ? '<a class="lnk" data-act="apAll">Approve all</a>' : ''}</div>${pend.map(d => doneRow(d, true)).join('')}</section>` : ''}
    ${S.kids.filter(x => needsSend(x.id)).length ? `<section class="card"><div class="ct"><span>📤 Send updates</span></div><div class="sm dim">Their phones do not know about your approvals, payments or chore changes until you send them.</div>${S.kids.filter(x => needsSend(x.id)).map(x => `<button class="btn block" data-act="sendList" data-id="${x.id}">${S.sent[x.id] ? 'Send ' + esc(x.name) + ' the update' : 'Send ' + esc(x.name) + ' their chore list'}</button>`).join('')}</section>` : ''}
    ${S.kids.map(x => { const L = todayList(x.id, k), dn = L.filter(i => ['pending', 'approved'].includes(i.st)).length, lg = ledger(x.id);
      return `<section class="card"><div class="ct"><span>${esc(x.emoji)} ${esc(x.name)}</span><span class="sm dim">${dn} of ${L.filter(i => i.st !== 'taken').length} today · owed <b class="gold">${money(lg.owed)}</b></span></div>
        ${L.length ? L.map(i => `<div class="sm" style="margin:3px 0">${i.st === 'approved' ? '✅' : i.st === 'pending' ? '⏳' : i.st === 'taken' ? '➖' : i.late ? '⚠️' : '⬜'} ${esc(i.c.icon)} ${esc(i.c.name)} <span class="dim">${money(i.c.amt)}${i.late ? ' · overdue from ' + fmtDay(i.k) : ''}${i.st === 'taken' ? ' · done by ' + esc(i.by || 'someone') : ''}</span></div>`).join('') : '<div class="sm dim">Nothing due today.</div>'}
        ${kidWeekLine(x)}
        <div class="row wrap"><button class="mini" data-act="kidOpen" data-id="${x.id}">Money and details</button><button class="mini" data-act="asKid" data-id="${x.id}">Open ${esc(x.name)}'s list on this phone</button></div></section>`; }).join('')}
    ${pd && owedTotal > 0 ? `<section class="card tip"><div class="ct"><span>💵 It's payday</span></div>${S.kids.filter(x => ledger(x.id).owed > 0).map(x => `<div class="kidrow"><span class="av">${esc(x.emoji)}</span><div style="flex:1"><b>${esc(x.name)}</b><div class="sm dim">owed ${money(ledger(x.id).owed)}</div></div><button class="mini" data-act="payOpen" data-id="${x.id}">Pay</button></div>`).join('')}</section>` : ''}
    ${window.OCC ? OCC.ritualHTML('chorica') : ''}`;
}
function kidWeekLine(x) {
  const ws = weekStart(dkey()), miss = missedBetween(x.id, ws, addDays(dkey(), -1), x.added), m4 = missedBetween(x.id, addDays(ws, -28), addDays(ws, -1), x.added).length, bits = [];
  if (miss.length) bits.push(`<span class="warn">Missed this week: ${miss.map(m => esc(m.c.name) + ' (' + DAYN[parseKey(m.k).getDay()] + ')').join(', ')}</span>`);
  if (+S.fam.streak > 0) bits.push(miss.length && missedMode() !== 'roll' ? 'Streak bonus lost this week' : miss.length ? 'Make up the missed ones by Sunday to keep the ' + money(+S.fam.streak) + ' streak bonus' : '🔥 On track for the ' + money(+S.fam.streak) + ' streak bonus');
  if (+x.allow > 0) bits.push('Allowance ' + money(+x.allow) + ' a week');
  if (m4) bits.push('<span class="dim">Missed in the 4 weeks before: ' + m4 + '</span>');
  return bits.length ? '<div class="sm" style="margin-top:6px">' + bits.join(' · ') + '</div>' : '';
}
function turnText(c) { if (!c.turns || !Array.isArray(c.kids) || c.kids.length < 2) return ''; return 'Takes turns ' + (c.turns === 'day' ? 'daily' : 'weekly') + ': ' + c.kids.map(kidName).join(' → ') + ' (now: ' + kidName(turnKid(c, dkey())) + ')'; }
function viewChores() {
  const by = c => c.kids === 'any' ? 'Anyone' : turnText(c) || (c.kids || []).map(id => (kidById(id) || {}).name).filter(Boolean).join(', ') || 'Nobody yet';
  const act = S.chores.filter(c => c.active !== false);
  return `<div class="hd2"><h1>Chores</h1></div><button class="btn gold block" data-act="choreNew">+ Add a chore</button>
    <section class="card">${act.length ? act.map(c => `<div class="chore" data-act="choreEdit" data-id="${c.id}"><span class="ic">${esc(c.icon)}</span><div class="t"><b>${esc(c.name)}</b><div class="sm dim">${repLabel(c.rep)} · ${esc(by(c))}${c.approve === false ? ' · no approval needed' : ''}</div></div><span class="amt">${money(c.amt)}</span></div>`).join('') : '<div class="sm dim">No chores yet. Add one, or pick from the common ones.</div>'}</section>
    ${act.length ? `<div class="sm dim center">Weekly value if everything gets done: ${S.kids.map(k => esc(k.name) + ' ' + money(weekValue(k.id))).join(' · ')}</div>` : ''}`;
}
function weekValue(kidId) { let v = 0; S.chores.filter(c => c.active !== false && forKid(c, kidId)).forEach(c => { const r = c.rep || {}, share = c.turns && Array.isArray(c.kids) && c.kids.length > 1 ? 1 / c.kids.length : 1; const per = r.t === 'daily' ? 7 : r.t === 'days' ? (r.days || []).length : r.t === 'weekly' ? 1 : r.t === 'biweekly' ? 0.5 : r.t === 'monthly' ? 12 / 52 : 0; v += per * c.amt * share; }); const x = isParent() ? kidById(kidId) : S.me; return round2(v + (x && +x.allow > 0 ? +x.allow : 0)); }
function viewKids() {
  return `<div class="hd2"><h1>Kids</h1></div>${S.kids.map(x => { const lg = ledger(x.id); return `<section class="card"><div class="kidrow" data-act="kidOpen" data-id="${x.id}" style="cursor:pointer"><span class="av">${esc(x.emoji)}</span><div style="flex:1"><b>${esc(x.name)}</b><div class="sm dim">Earned ${money(lg.total)} · paid ${money(lg.paid)}${lg.pending ? ' · ' + money(lg.pending) + ' waiting' : ''}</div></div><div class="center"><div class="sm dim">Owed</div><b class="gold">${money(lg.owed)}</b></div></div>
    <div class="row wrap"><button class="mini" data-act="sendList" data-id="${x.id}">📤 Send list${needsSend(x.id) ? ' (update)' : ''}</button><button class="mini" data-act="payOpen" data-id="${x.id}">💵 Pay</button><button class="mini" data-act="bonusOpen" data-id="${x.id}">⭐ Bonus</button></div></section>`; }).join('')}
    <button class="btn gold block" data-act="kidAdd">+ Add a kid</button>`;
}
function viewHistory() {
  const ev = []; S.done.filter(d => d.status !== 'pending').forEach(d => ev.push({ ts: d.decidedTs || d.ts, h: doneRow(d, false) }));
  S.pay.forEach(p => { const k = kidById(p.kid) || {}; ev.push({ ts: p.ts, h: `<div class="chore" style="cursor:default"><span class="ic">💵</span><div class="t"><b>Paid ${esc(k.name || '')} ${money(p.amt)}</b><div class="sm dim">${new Date(p.ts).toLocaleDateString()}${p.how ? ' · ' + esc(p.how) : ''}</div></div></div>` }); });
  S.bonus.forEach(b => { const k = kidById(b.kid) || {}; ev.push({ ts: b.ts, h: `<div class="chore" style="cursor:default"><span class="ic">${b.amt >= 0 ? '⭐' : '➖'}</span><div class="t"><b>${b.amt >= 0 ? 'Bonus' : 'Adjustment'} for ${esc(k.name || '')}: ${money(b.amt)}</b><div class="sm dim">${new Date(b.ts).toLocaleDateString()}${b.why ? ' · ' + esc(b.why) : ''}</div></div></div>` }); });
  const m = dkey().slice(0, 7), mo = S.kids.map(k => { const e = S.done.filter(d => d.kid === k.id && d.status === 'approved' && dkey(new Date(d.decidedTs || d.ts)).slice(0, 7) === m).reduce((s, d) => s + (d.amt || 0), 0); return esc(k.name) + ': ' + money(round2(e)); });
  return `<div class="hd2"><h1>History</h1></div>${S.kids.length ? `<section class="card"><div class="ct"><span>Earned this month</span></div><div class="sm">${mo.join(' · ')}</div></section>` : ''}
    <section class="card">${ev.sort((a, b) => b.ts - a.ts).slice(0, 80).map(e => e.h).join('') || '<div class="sm dim">Nothing yet.</div>'}</section>`;
}

/* ---------- chore editor ---------- */
function choreForm(c) {
  const E = window.CE = Object.assign({ id: null, icon: '✨', name: '', amt: 1, rep: { t: 'weekly', days: [] }, kids: S.kids.length === 1 ? [S.kids[0].id] : [], steps: [], approve: true }, c ? JSON.parse(JSON.stringify(c)) : {});
  return choreFormHTML(E, !c);
}
function choreFormHTML(E, isNew) {
  const r = E.rep;
  return `${isNew ? `<div class="sm dim">Common chores (tap to fill in):</div><div class="chips">${PRESETS.map((p, i) => `<button type="button" class="chip" data-act="cePreset" data-i="${i}">${p[0]} ${esc(p[1].split(':')[0])}</button>`).join('')}</div>` : ''}
    <label class="fl">Chore<input id="cen" class="in" value="${esc(E.name)}" placeholder="e.g. Clean the upstairs bathroom"></label>
    <label class="fl">Icon</label><div class="icgrid">${ICONS.map(i => `<button type="button" class="${i === E.icon ? 'on' : ''}" data-act="ceIcon" data-v="${i}">${i}</button>`).join('')}</div>
    <div class="grid2"><label class="fl">Pays ($)<input id="cea" class="in" type="number" inputmode="decimal" min="0" step="0.25" value="${E.amt}"></label>
      <label class="fl">Needs your OK?<select id="ceap" class="in"><option value="1" ${E.approve !== false ? 'selected' : ''}>Yes, I approve</option><option value="0" ${E.approve === false ? 'selected' : ''}>No, pay when checked</option></select></label></div>
    <label class="fl">How often</label><div class="chips c">${REPS.map(o => `<button type="button" class="chip${r.t === o[0] ? ' on' : ''}" data-act="ceRep" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>
    ${r.t === 'days' ? `<div class="chips c">${DAYN.map((d, i) => `<button type="button" class="chip${(r.days || []).includes(i) ? ' on' : ''}" data-act="ceDay" data-v="${i}">${d}</button>`).join('')}</div>` : ''}
    ${r.t === 'once' ? `<label class="fl">Done by (optional)<input id="ced" class="in" type="date" value="${esc(r.date || '')}"></label>` : ''}
    <label class="fl">Who does it</label><div class="chips c">${S.kids.map(k => `<button type="button" class="chip${Array.isArray(E.kids) && E.kids.includes(k.id) ? ' on' : ''}" data-act="ceKid" data-v="${k.id}">${esc(k.emoji)} ${esc(k.name)}</button>`).join('')}<button type="button" class="chip${E.kids === 'any' ? ' on' : ''}" data-act="ceKid" data-v="any">Anyone (first to do it gets paid)</button></div>
    ${Array.isArray(E.kids) && E.kids.length > 1 ? `<div class="chips c">${[['', 'Each of them does it'], ['week', 'Take turns each week'], ['day', 'Take turns each day']].map(o => `<button type="button" class="chip${(E.turns || '') === o[0] ? ' on' : ''}" data-act="ceTurn" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>${E.turns ? `<div class="sm dim">Turns go in the order you tapped: ${E.kids.map(id => esc(kidName(id))).join(' → ')}. ${esc(kidName(E.kids[0]))} starts ${E.turns === 'day' ? 'today' : 'this week'}.</div>` : ''}` : ''}
    ${!S.kids.length ? '<div class="sm warn">Add a kid first (Kids tab), then assign this chore.</div>' : ''}
    <label class="fl">Steps (optional, one per line)<textarea id="ces" class="in" rows="4" placeholder="Toilet&#10;Sink and mirror&#10;Floor">${esc((E.steps || []).join('\n'))}</textarea></label>
    <button class="btn gold block" data-act="ceSave">${isNew ? 'Add chore' : 'Save changes'}</button>${!isNew ? '<button class="btn danger block" data-act="ceDel">Remove this chore</button>' : ''}`;
}
function ceKeep(isNew) { const E = window.CE; const v = id => ($('#' + id) || {}).value; if ($('#cen')) { E.name = v('cen'); E.amt = +v('cea') || 0; E.approve = v('ceap') !== '0'; E.steps = (v('ces') || '').split('\n').map(x => x.trim()).filter(Boolean); if ($('#ced')) E.rep.date = v('ced'); } const sh = $('#sheet'), y = sh.scrollTop; $('.sh-body', sh).innerHTML = choreFormHTML(E, isNew); sh.scrollTop = y; }

/* ---------- kid sheet, pay, bonus ---------- */
function kidSheet(x) {
  const lg = ledger(x.id), recent = S.done.filter(d => d.kid === x.id).sort((a, b) => b.ts - a.ts).slice(0, 8);
  return `<div class="center"><span class="av" style="width:64px;height:64px;font-size:34px;margin:0 auto">${esc(x.emoji)}</span><div class="money">${money(lg.owed)}</div><div class="sm dim">owed to ${esc(x.name)} · earned ${money(lg.total)} · paid ${money(lg.paid)}${lg.pending ? ' · ' + money(lg.pending) + ' waiting for you' : ''}</div></div>
    <div class="row wrap"><button class="btn gold" data-act="sendList" data-id="${x.id}">📤 Send list</button><button class="btn" data-act="payOpen" data-id="${x.id}">💵 Pay</button><button class="btn" data-act="bonusOpen" data-id="${x.id}">⭐ Bonus</button></div>
    <div class="sm dim" style="margin-top:6px">A full week is worth about ${money(weekValue(x.id))}${+x.allow > 0 ? ' including allowance' : ''}.</div>
    <section class="card inner"><div class="ct"><span>Weekly allowance</span></div><div class="sm dim">A flat amount added every Monday for the week before, on top of chore pay. 0 for none.</div><div class="grid2"><input id="kal" class="in" type="number" inputmode="decimal" min="0" step="0.5" value="${+x.allow || 0}"><button class="btn" data-act="kidAllow" data-id="${x.id}">Save</button></div></section>
    ${(() => { const ws = weekStart(dkey()), wk = [0, 1, 2, 3].map(i => { const a = addDays(ws, -7 * (i + 1)); return missedBetween(x.id, a, addDays(a, 6), x.added).length; }); return `<section class="card inner"><div class="ct"><span>Missed chores</span></div><div class="sm">${missedBetween(x.id, ws, addDays(dkey(), -1), x.added).map(m => esc(m.c.icon) + ' ' + esc(m.c.name) + ' (' + fmtDay(m.k) + ')').join('<br>') || 'None this week.'}</div><div class="sm dim">Earlier weeks, newest first: ${wk.join(', ')}</div></section>`; })()}
    <section class="card inner"><div class="ct"><span>Recent</span></div>${recent.map(d => doneRow(d, d.status === 'pending')).join('') || '<div class="sm dim">Nothing yet.</div>'}</section>
    <label class="fl">Name<input id="kn" class="in" value="${esc(x.name)}"></label><div class="chips">${EMOJI.map(e => `<button type="button" class="chip${e === x.emoji ? ' on' : ''}" data-act="kidEmoji" data-id="${x.id}" data-v="${e}">${e}</button>`).join('')}</div>
    <button class="btn block" data-act="kidRename" data-id="${x.id}">Save name</button><button class="btn danger block" data-act="kidDel" data-id="${x.id}">Remove ${esc(x.name)}</button>`;
}
async function sendList(kidId) {
  const x = kidById(kidId); if (!x) return; const since = Date.now() - 60 * 86400000;
  const chores = S.chores.filter(c => c.active !== false && forKid(c, kidId)).map(c => ({ id: c.id, icon: c.icon, name: c.name, amt: c.amt, rep: c.rep, kids: c.kids === 'any' ? 'any' : c.turns ? c.kids : [kidId], turns: c.turns || '', turnStart: c.turnStart || '', since: c.since || '', steps: c.steps || [], approve: c.approve !== false, start: c.start }));
  const status = S.done.filter(d => d.kid === kidId && d.ts > since).map(d => ({ id: d.id, chore: d.chore, key: d.key, date: d.date, ts: d.ts, st: d.status, amt: d.amt || 0, why: d.reason || '', note: d.note || '', photo: !!(d.photo || d.ph) }));
  const taken = S.done.filter(d => d.kid !== kidId && d.status !== 'rejected' && d.ts > since && (choreById(d.chore) || {}).kids === 'any').map(d => ({ chore: d.chore, key: d.key, by: (kidById(d.kid) || {}).name || 'someone' }));
  const lg = ledger(kidId), code = await encode({ t: 'list', v: 1, ts: Date.now(), parent: S.fam.parent || 'Parent', kid: { id: x.id, name: x.name, emoji: x.emoji, allow: +x.allow || 0, added: x.added || '' }, names: Object.fromEntries(S.kids.map(k => [k.id, k.name])), rules: { missed: missedMode(), fine: +S.fam.fine || 0, streak: +S.fam.streak || 0 }, chores, status, taken, bal: lg, pays: S.pay.filter(p => p.kid === kidId).slice(-10).map(p => ({ amt: p.amt, ts: p.ts, how: p.how || '' })), bonus: S.bonus.filter(b => b.kid === kidId).slice(-10).map(b => ({ amt: b.amt, ts: b.ts, why: b.why || '' })) });
  const r = await shareCode('Chorica chores for ' + x.name, `${esc(x.emoji)} ${x.name}, here are your chores in Chorica (you are owed ${money(lg.owed)}). Tap the link, or copy this whole message and paste it into Chorica.`, code);
  if (r !== 'cancel') { S.sent[kidId] = Date.now(); save(); }
  if (r === 'manual') openSheet('Send to ' + x.name, `<p class="sm">Copy this and text it to ${esc(x.name)}:</p><textarea class="in" rows="6" readonly>${esc(appLink(code))}</textarea>`); else render();
}
async function importDone(p) {
  const x = kidById(p.kid); if (!x) throw new Error('That code is from a kid who is not on this phone' + (p.name ? ' (' + p.name + ')' : '') + '.');
  let added = 0, auto = 0, skipped = 0, late = 0;
  (p.items || []).forEach(it => {
    const id = String(it.id || ''), date = String(it.date || ''), today = dkey();
    if (!/^[a-z0-9]{6,20}$/.test(id) || S.done.some(d => d.id === id)) { skipped++; return; }
    const c = choreById(it.chore); if (!c || c.active === false || !forKid(c, x.id, /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null)) { skipped++; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || date < addDays(today, -14) || (c.start && date < c.start) || !dueOn(c, date)) { skipped++; return; }
    const ts0 = Math.min(+it.ts || Date.now(), Date.now()), doneDay = dkey(new Date(ts0)), oe = occEnd(c, date); if (oe && oe < addDays(doneDay, -(missedMode() === 'roll' ? MAKEUP_DAYS : 0)) ) { skipped++; late++; return; }
    const key = occKey(c, date); if (S.done.some(d => d.chore === c.id && d.key === key && d.kid === x.id && d.status !== 'rejected')) { skipped++; return; }
    const d = { id, chore: c.id, kid: x.id, key, date, ts: Math.min(+it.ts || Date.now(), Date.now()), note: String(it.note || '').slice(0, 200), status: 'pending', from: 'code', photo: !!it.photo, late: occEnd(c, date) && occEnd(c, date) < dkey(new Date(Math.min(+it.ts || Date.now(), Date.now()))) };
    if ((c.kids === 'any' || c.turns) && S.done.some(o => o.chore === c.id && o.key === key && o.status === 'approved')) { d.status = 'rejected'; d.reason = 'Someone else already did this one.'; d.decidedTs = Date.now(); S.done.push(d); skipped++; return; }
    if (c.approve === false) { d.status = 'approved'; d.amt = c.amt; d.decidedTs = Date.now(); auto++; } S.done.push(d); added++;
  });
  save(); return { x, added, auto, skipped, late };
}
function approve(id, ok, why) { const d = S.done.find(x => x.id === id); if (!d || d.status !== 'pending') return;
  const c0 = choreById(d.chore); if (ok && c0 && (c0.kids === 'any' || c0.turns) && S.done.some(o => o !== d && o.chore === d.chore && o.key === d.key && o.status === 'approved')) { ok = false; why = 'Someone else already did this one.'; toast('Already paid to someone else for this one.'); } d.status = ok ? 'approved' : 'rejected'; d.decidedTs = Date.now(); if (d.ph) { d.ph = null; d.photo = true; d.devph = true; } if (ok) d.amt = (choreById(d.chore) || {}).amt || 0; else d.reason = why || ''; save(); }

Object.assign(ACT, {
  kidAdd() { openSheet('Add a kid', `<label class="fl">Name<input id="kn" class="in" placeholder="Name"></label><div class="chips" id="kem">${EMOJI.map((e, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-act="kemPick" data-v="${e}">${e}</button>`).join('')}</div><button class="btn gold block" data-act="kidSave">Add</button>`); },
  kemPick(el) { $$('#kem .chip').forEach(c => c.classList.toggle('on', c === el)); },
  kidSave() { const n = ($('#kn').value || '').trim(); if (!n) return toast('Type their name.'); const e = ($('#kem .chip.on') || { dataset: { v: '🙂' } }).dataset.v; S.kids.push({ id: uid(), name: n, emoji: e, added: dkey(), acc: addDays(weekStart(dkey()), -7), accS: addDays(weekStart(dkey()), -7), allow: 0 }); save(); closeSheet(); UI.tab = 'chores'; render(); toast(n + ' added. Now add their chores.'); },
  kidAllow(el) { const x = kidById(el.dataset.id), a = Math.max(0, round2(+$('#kal').value || 0)); x.allow = a; x.edited = Date.now(); save(); toast(a ? 'Allowance set: ' + money(a) + ' a week.' : 'No allowance.'); openSheet(x.name, kidSheet(x)); },
  kidOpen(el) { const x = kidById(el.dataset.id); if (x) openSheet(x.name, kidSheet(x)); },
  kidEmoji(el) { const x = kidById(el.dataset.id); x.emoji = el.dataset.v; save(); openSheet(x.name, kidSheet(x)); },
  kidRename(el) { const x = kidById(el.dataset.id), n = ($('#kn').value || '').trim(); if (n) { x.name = n; save(); toast('Saved.'); openSheet(x.name, kidSheet(x)); render(); } },
  kidDel(el) { const x = kidById(el.dataset.id); openSheet('Remove ' + x.name + '?', `<p>This removes ${esc(x.name)} and their history from this phone.${ledger(x.id).owed > 0 ? ` You still owe them ${money(ledger(x.id).owed)}.` : ''}</p><button class="btn danger block" data-act="kidDelYes" data-id="${x.id}">Remove</button><button class="btn block" data-act="closeSheet">Cancel</button>`); },
  kidDelYes(el) { const id = el.dataset.id; S.kids = S.kids.filter(k => k.id !== id); S.done = S.done.filter(d => d.kid !== id); S.pay = S.pay.filter(p => p.kid !== id); S.bonus = S.bonus.filter(b => b.kid !== id); S.chores.forEach(c => { if (Array.isArray(c.kids) && c.kids.includes(id)) { c.kids = c.kids.filter(k => k !== id); c.since = dkey(); c.edited = Date.now(); if (c.turns) c.turnStart = occStart(c, dkey()); } }); save(); closeSheet(); render(); },
  choreNew() { openSheet('Add a chore', choreForm(null)); },
  choreEdit(el) { const c = choreById(el.dataset.id); if (c) openSheet('Edit chore', choreForm(c)); },
  cePreset(el) { const p = PRESETS[+el.dataset.i], E = window.CE; Object.assign(E, { icon: p[0], name: p[1], amt: p[2], rep: { t: p[3], days: p[4] || [] }, steps: p[5] || [] }); const sh = $('#sheet'), y = sh.scrollTop; $('.sh-body', sh).innerHTML = choreFormHTML(E, true); sh.scrollTop = y; },
  ceIcon(el) { window.CE.icon = el.dataset.v; ceKeep(!window.CE.id); },
  ceRep(el) { window.CE.rep = { t: el.dataset.v, days: window.CE.rep.days || [], date: window.CE.rep.date }; ceKeep(!window.CE.id); },
  ceDay(el) { const d = window.CE.rep.days = window.CE.rep.days || [], v = +el.dataset.v, i = d.indexOf(v); i < 0 ? d.push(v) : d.splice(i, 1); ceKeep(!window.CE.id); },
  ceKid(el) { const E = window.CE, v = el.dataset.v; if (v === 'any') E.kids = E.kids === 'any' ? [] : 'any'; else { if (!Array.isArray(E.kids)) E.kids = []; const i = E.kids.indexOf(v); i < 0 ? E.kids.push(v) : E.kids.splice(i, 1); } ceKeep(!E.id); },
  ceTurn(el) { window.CE.turns = el.dataset.v; ceKeep(!window.CE.id); },
  ceSave() {
    const E = window.CE, v = id => ($('#' + id) || {}).value; E.name = (v('cen') || '').trim(); E.amt = Math.max(0, round2(+v('cea') || 0)); E.approve = v('ceap') !== '0'; E.steps = (v('ces') || '').split('\n').map(x => x.trim()).filter(Boolean); if ($('#ced')) E.rep.date = v('ced');
    if (!E.name) return toast('Name the chore.'); if (E.rep.t === 'days' && !(E.rep.days || []).length) return toast('Pick at least one day.'); if (E.kids !== 'any' && !(E.kids || []).length) return toast('Choose who does it.');
    if (!(Array.isArray(E.kids) && E.kids.length > 1)) E.turns = ''; const prev = E.id && choreById(E.id);
    if (E.turns && (!prev || prev.turns !== E.turns || JSON.stringify(prev.kids) !== JSON.stringify(E.kids))) E.turnStart = occStart(E, dkey());
    if (prev && (JSON.stringify(prev.rep) !== JSON.stringify(E.rep) || JSON.stringify(prev.kids) !== JSON.stringify(E.kids) || (prev.turns || '') !== (E.turns || ''))) E.since = dkey(); // new rules count from today
    E.edited = Date.now(); if (E.id) { const i = S.chores.findIndex(c => c.id === E.id); S.chores[i] = Object.assign(S.chores[i], E); } else { E.id = uid(); E.start = dkey(); E.active = true; S.chores.push(E); }
    save(); closeSheet(); render(); toast('Saved. Send the update to your kids from Today.');
  },
  ceDel() { const c = choreById(window.CE.id); if (c) { c.active = false; c.edited = Date.now(); save(); } closeSheet(); render(); toast('Removed. Past earnings are kept.'); },
  sendList(el) { sendList(el.dataset.id); },
  apOk(el) { approve(el.dataset.id, true); toast('Approved.'); keepSheetOr(); },
  apNo(el) { const d = S.done.find(x => x.id === el.dataset.id), c = choreById(d.chore) || {}; openSheet('Not yet', `<p class="sm">${esc(c.name)}: tell ${esc((kidById(d.kid) || {}).name)} what still needs doing. It goes back on their list.</p><input id="why" class="in" placeholder="e.g. The mirror still has spots"><button class="btn gold block" data-act="apNoGo" data-id="${esc(d.id)}">Send back</button>`); },
  apNoGo(el) { approve(el.dataset.id, false, ($('#why').value || '').trim()); closeSheet(); render(); toast('Sent back. Send them the update so they see it.'); },
  apAll() { pendingAll().forEach(d => approve(d.id, true)); render(); toast('All approved. Send each kid their update.'); },
  payOpen(el) { const x = kidById(el.dataset.id), o = ledger(x.id).owed; openSheet('Pay ' + x.name, `<div class="center"><div class="sm dim">Owed</div><div class="money">${money(o)}</div></div><label class="fl">Amount paid ($)<input id="pa" class="in" type="number" inputmode="decimal" step="0.25" value="${Math.max(0, o)}"></label><label class="fl">How (optional)<input id="ph" class="in" placeholder="Cash, Venmo, savings account..."></label><button class="btn gold block" data-act="paySave" data-id="${x.id}">Record payment</button><div class="sm dim">Chorica only keeps track. It does not move any money.</div>`); },
  paySave(el) { const a = round2(+$('#pa').value || 0); if (a <= 0) return toast('Enter an amount.'); S.pay.push({ id: uid(), kid: el.dataset.id, amt: a, how: ($('#ph').value || '').trim(), ts: Date.now() }); save(); closeSheet(); render(); toast('Payment recorded. Send them the update.'); },
  bonusOpen(el) { const x = kidById(el.dataset.id); openSheet('Bonus or adjustment', `<p class="sm dim">Reward extra effort, or correct a mistake. Use a minus for an adjustment (for example -2).</p><label class="fl">Amount ($)<input id="ba" class="in" type="number" inputmode="decimal" step="0.25" value="1"></label><label class="fl">Why<input id="bw" class="in" placeholder="Did every chore this week without being asked"></label><button class="btn gold block" data-act="bonusSave" data-id="${x.id}">Save</button>`); },
  bonusSave(el) { const a = round2(+$('#ba').value || 0); if (!a) return toast('Enter an amount.'); S.bonus.push({ id: uid(), kid: el.dataset.id, amt: a, why: ($('#bw').value || '').trim(), ts: Date.now() }); save(); closeSheet(); render(); toast('Saved.'); },
  asKid(el) { if (!S.fam.pin && !window.PINASKED) { window.PINASKED = el.dataset.id; openSheet('Set a parent PIN?', `<p class="sm">With a PIN, a kid using this phone cannot get back to your approvals and money.</p><div class="pin"><input id="npin" class="in" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="4-6 digits"></div><button class="btn gold block" data-act="pinSetGo">Set PIN and continue</button><button class="btn block" data-act="pinSkip">Skip</button>`); return; }
    UI.as = el.dataset.id; S.asKid = UI.as; save(); UI.ktab = 'today'; closeSheet(); render(); window.scrollTo(0, 0); },
  pinSetGo() { const v = ($('#npin').value || '').trim(); if (!/^\d{4,6}$/.test(v)) return toast('Use 4 to 6 digits.'); S.fam.pin = v; save(); ACT.asKid({ dataset: { id: window.PINASKED } }); },
  pinSkip() { ACT.asKid({ dataset: { id: window.PINASKED } }); }
});
function keepSheetOr() { if ($('#sheet').classList.contains('open')) { const t = $('.sh-bar b'); const x = S.kids.find(k => t && k.name === t.textContent); if (x) { openSheet(x.name, kidSheet(x)); return; } closeSheet(); } render(); }

/* Every Monday the allowance for the week before is added (cursor x.acc). Streak bonuses and missed-chore deductions
   wait a few days (cursor x.accS) so weekend check-offs have time to arrive, and wait while that week has check-offs
   still waiting for approval (up to 3 weeks). Each week is settled once. */
const SETTLE_GRACE = () => missedMode() === 'roll' ? MAKEUP_DAYS : 2;
function accrue() {
  const today = dkey(), thisWeek = weekStart(today); let changed = false;
  S.kids.forEach(x => {
    if (!x.added) { x.added = today; x.acc = addDays(thisWeek, -7); x.accS = x.acc; changed = true; return; }
    if (!x.accS) x.accS = x.acc || addDays(weekStart(x.added), -7);
    let W = x.acc ? addDays(x.acc, 7) : weekStart(x.added), g = 0;
    while (W < thisWeek && g++ < 60) { const end = addDays(W, 6); if (+x.allow > 0 && end >= x.added) S.bonus.push({ id: uid(), kid: x.id, amt: +x.allow, why: 'Weekly allowance (' + fmtDay(W) + ' to ' + fmtDay(end) + ')', ts: Date.now(), kind: 'allow', week: W }); x.acc = W; W = addDays(W, 7); changed = true; }
    W = addDays(x.accS, 7); g = 0;
    while (addDays(W, 7 + SETTLE_GRACE()) <= today && g++ < 60) {
      const end = addDays(W, 6), from = W < x.added ? x.added : W, wl = fmtDay(W) + ' to ' + fmtDay(end);
      const waiting = S.done.some(d => d.kid === x.id && d.status === 'pending' && d.date >= from && d.date <= end);
      if (waiting && addDays(W, 28) > today) break; // wait for approvals (at most 3 extra weeks)
      const miss = missedBetween(x.id, from, end, x.added);
      const due = S.chores.some(c => c.kids !== 'any' && Array.from({ length: 7 }, (_, i) => addDays(W, i)).some(k => k >= from && !(c.since && k < c.since) && dueOn(c, k) && forKid(c, x.id, k) && occEnd(c, k) === k));
      if (+S.fam.streak > 0 && due && !miss.length) S.bonus.push({ id: uid(), kid: x.id, amt: +S.fam.streak, why: '🔥 Streak: every chore done (' + wl + ')', ts: Date.now(), kind: 'streak', week: W });
      if (missedMode() === 'flag' && +S.fam.fine > 0 && miss.length && W >= weekStart(S.fam.flagSince || '2000-01-03')) S.bonus.push({ id: uid(), kid: x.id, amt: -round2(+S.fam.fine * miss.length), why: 'Missed: ' + miss.map(m => m.c.name + ' ' + DAYN[parseKey(m.k).getDay()]).join(', '), ts: Date.now(), kind: 'fine', week: W });
      x.accS = W; W = addDays(W, 7); changed = true;
    }
  });
  if (changed) save();
}
