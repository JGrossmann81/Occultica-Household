/* Chorica kid side: today's chores, check off with steps, send check-offs to a parent, money and a savings goal.
   Works on the kid's own phone (role 'kid') and on a shared phone (parent opens a kid's list). */
const kidId = () => isParent() ? UI.as : (S.me && S.me.id);
const kidMe = () => isParent() ? kidById(UI.as) : S.me;
const parentName = () => isParent() ? (S.fam.parent || 'your parent') : (S.fam.parent || 'your parent');
const unsent = () => isParent() ? [] : S.done.filter(d => !d.sent && d.status === 'pending');
function kidMoney() {
  if (isParent()) return ledger(UI.as);
  const b = S.bal || { owed: 0, total: 0, paid: 0, pending: 0 }, local = round2(S.done.filter(d => d.status === 'pending').reduce((s, d) => s + ((choreById(d.chore) || {}).amt || 0), 0));
  return Object.assign({}, b, { pending: local });
}
function kidRow(i) {
  const c = i.c, icon = i.st === 'approved' ? '✓' : i.st === 'pending' ? '⏳' : i.st === 'taken' ? '–' : '';
  const sub = i.st === 'approved' ? '<span class="pill ok">Approved</span>' : i.st === 'pending' ? `<span class="pill wait">${isParent() || (i.d && i.d.sent) ? 'Waiting for ' + esc(parentName()) : 'Not sent yet'}</span>` : i.st === 'taken' ? `<span class="pill">Done by ${esc(i.by || 'someone')}</span>` : i.rej ? `<span class="pill no">Not yet${i.rej.reason ? ': ' + esc(i.rej.reason) : ''}</span>` : i.late ? `<span class="pill wait">Overdue from ${fmtDay(i.k)}: make it up</span>` : `<span class="sm dim">${repLabel(c.rep)}${c.turns ? ' · your turn' : ''}</span>`;
  return `<div class="chore" ${i.st === 'todo' ? `data-act="kDo" data-id="${esc(c.id)}" data-k="${esc(i.k || dkey())}"` : ''}><span class="chk ${i.st === 'approved' ? 'on' : i.st === 'pending' ? 'wait' : ''}">${esc(icon)}</span><span class="ic">${esc(c.icon)}</span><div class="t"><b>${esc(c.name)}</b><div>${sub}</div></div><span class="amt">${money(c.amt)}</span></div>`;
}
function viewKidToday() {
  const me = kidMe(); if (!me) return '';
  const L = todayList(me.id), todo = L.filter(i => i.st === 'todo'), done = L.filter(i => i.st !== 'todo'), mon = kidMoney(), us = unsent();
  const left = round2(todo.reduce((s, i) => s + i.c.amt, 0));
  return `<div class="hd"><span class="av" style="width:52px;height:52px;font-size:28px">${esc(me.emoji || '🙂')}</span><div><h1>Hi, ${esc(me.name)}</h1><div class="sm dim">${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>${isParent() ? '' : '<button class="gear" data-act="settings" aria-label="Settings">⚙</button>'}</div>
    ${isParent() ? `<section class="card tip"><div class="sm">${esc(me.name)}'s list on this phone. Check-offs go straight to the approval list.</div><button class="btn block" data-act="kBack">${S.fam.pin ? '🔒 ' : ''}Back to parent</button></section>` : ''}
    ${us.length ? `<section class="card alert"><div class="ct"><span>📤 Send to ${esc(parentName())}</span></div><div class="sm">${us.length} check-off${us.length > 1 ? 's' : ''} worth ${money(round2(us.reduce((s, d) => s + ((choreById(d.chore) || {}).amt || 0), 0)))} ${us.length > 1 ? 'are' : 'is'} only on your phone. Send them to get paid.${missedMode() !== 'roll' && (+S.fam.streak > 0 || (missedMode() === 'flag' && +S.fam.fine > 0)) ? ' Send last week\'s by Tuesday night or they count as missed.' : ''}</div><button class="btn gold block" data-act="kSend">Send to ${esc(parentName())}</button></section>` : ''}
    <section class="card"><div class="ct"><span>Owed to you</span><span class="money" style="font-size:1.5rem">${money(mon.owed || 0)}</span></div>${mon.pending ? `<div class="sm dim">+ ${money(mon.pending)} waiting for approval</div>` : ''}${left ? `<div class="sm gold">${money(left)} more up for grabs today</div>` : ''}</section>
    ${!isParent() && S.lastList && Date.now() - S.lastList > 7 * 86400000 ? `<section class="card tip"><div class="sm">Your list is ${Math.floor((Date.now() - S.lastList) / 86400000)} days old. Ask ${esc(parentName())} to send you an update so you can see approvals and what you are owed.</div></section>` : ''}
    <section class="card"><div class="ct"><span>To do</span><span class="sm dim">${todo.length ? todo.length + ' left' : ''}</span></div>${todo.length ? todo.map(kidRow).join('') : `<div class="sm">${L.length ? 'All done for today. Nice work! 🎉' : 'Nothing due today.'}</div>`}</section>
    ${done.length ? `<section class="card"><div class="ct"><span>Done</span></div>${done.map(kidRow).join('')}</section>` : ''}
    ${(() => { const k = dkey(), other = S.chores.filter(c => c.active !== false && c.turns && Array.isArray(c.kids) && c.kids.includes(me.id) && dueOn(c, k) && turnKid(c, k) !== me.id); return other.length ? `<div class="sm dim" style="margin:0 4px 12px">Not your turn: ${other.map(c => esc(c.icon) + ' ' + esc(c.name) + ' (' + esc(kidName(turnKid(c, k))) + ')').join(', ')}</div>` : ''; })()}
    ${(() => { if (missedMode() === 'roll') return ''; const ws = weekStart(dkey()), m = missedBetween(me.id, ws, addDays(dkey(), -1), kidStartOf(me.id)); return m.length ? `<section class="card"><div class="ct"><span>Missed this week</span></div>${m.map(x => `<div class="sm">${esc(x.c.icon)} ${esc(x.c.name)} <span class="dim">${fmtDay(x.k)}${missedMode() === 'flag' && +S.fam.fine > 0 ? ' · -' + money(+S.fam.fine) : ''}</span></div>`).join('')}</section>` : ''; })()}
    ${!isParent() && S.lastList ? `<p class="foot">List from ${esc(parentName())}, updated ${new Date(S.lastList).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. Ask for an update to see approvals.</p>` : ''}`;
}
function viewKidWeek() {
  const me = kidMe(), k = dkey(), days = []; for (let i = 0; i < 7; i++) days.push(addDays(k, i));
  return `<div class="hd2"><h1>This week</h1></div>${days.map(d => { const L = S.chores.filter(c => forKid(c, me.id, d) && dueOn(c, d) && c.rep && ['daily', 'days'].includes(c.rep.t)); return `<section class="card"><div class="ct"><span>${d === k ? 'Today' : fmtDay(d)}</span><span class="sm dim">${money(round2(L.reduce((s, c) => s + c.amt, 0)))}</span></div>${L.map(c => `<div class="sm" style="margin:2px 0">${esc(c.icon)} ${esc(c.name)} <span class="dim">${money(c.amt)}</span></div>`).join('') || '<div class="sm dim">Free day.</div>'}</section>`; }).join('')}
    ${(() => { const any = S.chores.filter(c => c.active !== false && c.rep && ['weekly', 'biweekly', 'monthly', 'once'].includes(c.rep.t) && forKid(c, me.id, k)); const nxt = S.chores.filter(c => c.active !== false && c.turns === 'week' && Array.isArray(c.kids) && c.kids.includes(me.id) && turnKid(c, k) !== me.id && turnKid(c, addDays(k, 7)) === me.id);
      return (any.length ? `<section class="card"><div class="ct"><span>Any day (do it before it runs out)</span></div>${any.map(c => `<div class="sm" style="margin:2px 0">${esc(c.icon)} ${esc(c.name)} <span class="dim">${money(c.amt)} · ${repLabel(c.rep)}${occEnd(c, k) ? ', by ' + fmtDay(occEnd(c, k)) : ''}</span></div>`).join('')}</section>` : '') + (nxt.length ? `<section class="card"><div class="ct"><span>Your turn next week</span></div>${nxt.map(c => `<div class="sm">${esc(c.icon)} ${esc(c.name)} <span class="dim">${money(c.amt)}</span></div>`).join('')}</section>` : ''); })()}`;
}
function viewKidMoney() {
  const mon = kidMoney(), g = isParent() ? null : S.goal, prog = g ? Math.max(0, round2((mon.total || 0) - (g.base || 0))) : 0;
  const pays = isParent() ? S.pay.filter(p => p.kid === UI.as) : (S.pays || []), bon = isParent() ? S.bonus.filter(b => b.kid === UI.as) : (S.bonusL || []);
  return `<div class="hd2"><h1>Money</h1></div>
    <section class="card center"><div class="sm dim">Owed to you</div><div class="money">${money(mon.owed || 0)}</div><div class="sm dim">Earned ${money(mon.total || 0)} all time · paid ${money(mon.paid || 0)}${mon.pending ? ' · ' + money(mon.pending) + ' waiting' : ''}</div></section>
    ${(() => { const me = kidMe(), al = +(me && me.allow) || 0, st = +S.fam.streak || 0; if (!al && !st) return ''; const m = missedBetween(me.id, weekStart(dkey()), addDays(dkey(), -1), kidStartOf(me.id)).length;
      return `<section class="card"><div class="ct"><span>Every week</span></div>${al ? `<div class="sm">💵 Allowance: ${money(al)}, added every Monday.</div>` : ''}${st ? `<div class="sm">🔥 Streak bonus: do every chore this week for ${money(st)}. ${m ? (missedMode() === 'roll' ? m + ' missed so far: make them up by Sunday to keep it.' : 'Missed one this week, so not this time.') : 'You are on track!'}</div>` : ''}</section>`; })()}
    ${!isParent() ? `<section class="card"><div class="ct"><span>🎯 Saving for</span>${g ? '<a class="lnk" data-act="goalOpen">Change</a>' : ''}</div>${g ? `<b>${esc(g.name)}</b> <span class="dim">${money(prog)} of ${money(g.amt)}</span><div class="bar"><i style="width:${Math.min(100, Math.round(100 * prog / Math.max(1, g.amt)))}%"></i></div><div class="sm dim">${prog >= g.amt ? 'You earned enough! 🎉' : 'About ' + Math.ceil((g.amt - prog) / Math.max(0.25, weekWorth())) + ' more week(s) of chores.'}</div>` : '<div class="sm dim">Pick something to save for and watch it fill up as you earn.</div><button class="btn block" data-act="goalOpen">Set a goal</button>'}
      <div class="sm dim" style="margin-top:6px">Money tip: try the 3 jars. When you get paid, put some in Save, some in Spend, and a little in Give.</div></section>` : ''}
    <section class="card"><div class="ct"><span>Payments</span></div>${pays.slice().reverse().slice(0, 12).map(p => `<div class="sm">💵 ${money(p.amt)} · ${new Date(p.ts).toLocaleDateString()}${p.how ? ' · ' + esc(p.how) : ''}</div>`).join('') || '<div class="sm dim">None yet.</div>'}
      ${bon.length ? bon.slice().reverse().slice(0, 8).map(b => `<div class="sm">${b.amt >= 0 ? '⭐ Bonus' : '➖ Adjustment'} ${money(b.amt)}${b.why ? ' · ' + esc(b.why) : ''}</div>`).join('') : ''}</section>`;
}
function weekWorth() { return weekValue(kidMe().id); }
function doSheet(c, k) {
  window.KDO = { id: c.id, k, ph: null };
  return `<div class="center" style="font-size:44px">${esc(c.icon)}</div><div class="center"><b>${esc(c.name)}</b><div class="money" style="font-size:1.6rem">${money(c.amt)}</div></div>
    ${(c.steps || []).length ? `<div class="sm dim">Check each step:</div>${c.steps.map((s, i) => `<label class="chore" style="cursor:pointer"><input type="checkbox" data-kstep="${i}" style="width:22px;height:22px"> <span class="t">${esc(s)}</span></label>`).join('')}` : ''}
    <label class="fl">📷 Photo proof (optional)<input id="kph" class="in" type="file" accept="image/*" capture="environment"></label><div id="kphv"></div>
    <label class="fl">Note for ${esc(parentName())} (optional)<input id="kn2" class="in" placeholder="e.g. Did both bathrooms"></label>
    ${k && k < dkey() ? `<div class="sm warn">Making up ${fmtDay(k)}.</div>` : ''}<button class="btn gold block" data-act="kDone" data-id="${esc(c.id)}">✓ I did it!</button><div class="sm dim center">Be honest. ${esc(parentName())} checks before paying.</div>`;
}
async function kidSend() {
  const me = S.me, pend = S.done.filter(d => d.status === 'pending'); if (!pend.length) return toast('Nothing to send yet.');
  const withPh = pend.filter(d => d.ph); let files = [];
  if (withPh.length && navigator.share && navigator.canShare) { try { files = await Promise.all(withPh.map(async (d, i) => new File([await (await fetch(d.ph)).blob()], 'chore-' + (i + 1) + '.jpg', { type: 'image/jpeg' }))); if (!navigator.canShare({ files })) files = []; } catch (e) { files = []; } }
  const attach = files.length > 0, items = pend.map(d => ({ id: d.id, chore: d.chore, key: d.key, date: d.date, ts: d.ts, note: d.note || '', photo: !!(d.photo || (attach && d.ph)) }));
  const code = await encode({ t: 'done', v: 1, ts: Date.now(), kid: me.id, name: me.name, items }), n = pend.filter(d => !d.sent).length || pend.length;
  const text = `${esc(me.emoji || '✅')} ${me.name} finished ${n} chore${n > 1 ? 's' : ''} in Chorica. Tap the link, or copy this whole message and paste it into Chorica.`;
  let r = null;
  if (attach) { try { await navigator.share({ files, title: 'Chores done', text: text + '\n' + appLink(code) }); r = 'shared'; } catch (e) { r = e && e.name === 'AbortError' ? 'cancel' : null; } }
  if (r === null) { if (withPh.length) toast('This phone could not attach the photos. Send them in the chat yourself.', 5000); r = await shareCode('Chores done', text, code); }
  if (r !== 'cancel') { pend.forEach(d => { d.sent = true; if (d.ph && r === 'shared' && attach) { d.ph = null; d.photo = true; } }); save(); }
  if (r === 'manual') openSheet('Send to ' + parentName(), `<p class="sm">Copy this and text it to ${esc(parentName())}:</p><textarea class="in" rows="6" readonly>${esc(appLink(code))}</textarea>`); else render();
}
function importList(p) {
  if (S.role === 'parent') throw new Error('This phone is set up as the parent. Open the link on the kid\'s phone.');
  if (!p.kid || !p.kid.id || !Array.isArray(p.chores)) throw new Error('That code is damaged. Ask for a new one.');
  const swap = S.me && S.me.id !== p.kid.id; if (swap && !confirmSwap()) throw new Error('This list is for ' + p.kid.name + ', but this phone belongs to ' + S.me.name + '.');
  if (!swap && S.lastList && p.ts && p.ts < S.lastList) throw new Error('That is an older list. You already have a newer one from ' + (S.fam.parent || 'your parent') + '.');
  if (swap) { S.done = []; S.goal = null; S.lastList = 0; }
  S.role = 'kid'; S.me = p.kid; S.fam.parent = p.parent; S.names = p.names || {}; if (p.rules) { S.fam.missed = p.rules.missed || 'roll'; S.fam.fine = +p.rules.fine || 0; S.fam.streak = +p.rules.streak || 0; } S.chores = p.chores || []; S.taken = p.taken || []; S.bal = p.bal || null; S.pays = p.pays || []; S.bonusL = p.bonus || []; S.lastList = p.ts || Date.now();
  (p.status || []).forEach(s => { const d = S.done.find(x => x.id === s.id); const st = s.st === 'rejected' ? 'rejected' : s.st; if (d) { d.status = st; d.amt = s.amt; d.reason = s.why; d.sent = true; } else S.done.push({ id: s.id, chore: s.chore, kid: p.kid.id, key: s.key, date: s.date, ts: s.ts, status: st, amt: s.amt, reason: s.why, note: s.note, sent: true }); });
  S.done.forEach(d => { if (d.status !== 'pending' && d.ph) { d.ph = null; d.photo = true; } });
  S.done = S.done.filter(d => d.ts > Date.now() - 90 * 86400000 && (!S.chores.length || S.chores.some(c => c.id === d.chore) || d.status !== 'pending')); save();
}
function confirmSwap() { return window.KSWAP === true; }
Object.assign(ACT, {
  kDo(el) { const c = choreById(el.dataset.id); if (c) openSheet(c.name, doSheet(c, el.dataset.k || dkey())); },
  kDone(el) {
    const c = choreById(el.dataset.id), me = kidMe(); if (!c || !me) return; const all = $$('[data-kstep]'), ticked = all.filter(x => x.checked).length;
    if (all.length && ticked < all.length && !window.KWARN) { window.KWARN = true; toast(`${all.length - ticked} step${all.length - ticked > 1 ? 's' : ''} not ticked. Tap again if it's really done.`, 3500); return; }
    window.KWARN = false; const k = (window.KDO && window.KDO.id === c.id && window.KDO.k) || dkey(); if (k < addDays(dkey(), -MAKEUP_DAYS) || (k < dkey() && missedMode() !== 'roll')) { closeSheet(); return toast('Too late to make that one up.'); } const st = stateOf(c, me.id, k); if (st.st !== 'todo') { closeSheet(); render(); return toast(st.st === 'taken' ? 'Someone already did this one.' : 'Already checked off.'); }
    const d = { id: uid(), chore: c.id, kid: me.id, key: occKey(c, k), date: k, ts: Date.now(), note: ($('#kn2').value || '').trim().slice(0, 200), status: 'pending', sent: false, from: isParent() ? 'device' : 'phone', late: k < dkey() };
    if (window.KDO && window.KDO.ph) { const held = S.done.filter(x => x.ph); if (held.length >= 8) { held[0].ph = null; held[0].photo = true; } d.ph = window.KDO.ph; }
    if (isParent() && c.approve === false) { d.status = 'approved'; d.amt = c.amt; d.decidedTs = Date.now(); }
    S.done.push(d); save(); closeSheet(); render(); toast(isParent() ? (d.status === 'approved' ? 'Done! ' + money(c.amt) + ' earned.' : 'Done! Waiting for approval.') : 'Done! Send it when you finish your chores.', 3500);
  },
  kSend() { kidSend(); },
  kBack() { if (S.fam.pin) { openSheet('Parent PIN', `<div class="pin"><input id="pinin" class="in" type="password" inputmode="numeric" maxlength="6" autocomplete="off"></div><button class="btn gold block" data-act="kBackGo">Unlock</button>`, { mount: () => $('#pinin').focus() }); return; } UI.as = null; S.asKid = null; save(); render(); },
  kBackGo() { if (($('#pinin').value || '') !== S.fam.pin) { toast('Wrong PIN.'); $('#pinin').value = ''; return; } UI.as = null; S.asKid = null; save(); closeSheet(); render(); },
  goalOpen() { const g = S.goal || {}; openSheet('Saving for', `<label class="fl">What is it?<input id="gn" class="in" value="${esc(g.name || '')}" placeholder="New headphones"></label><label class="fl">Cost ($)<input id="ga" class="in" type="number" inputmode="decimal" value="${g.amt || ''}"></label><button class="btn gold block" data-act="goalSave">Save goal</button>${g.name ? '<button class="btn block" data-act="goalClear">Remove goal</button>' : ''}`); },
  goalSave() { const n = ($('#gn').value || '').trim(), a = +$('#ga').value || 0; if (!n || a <= 0) return toast('Name it and give it a cost.'); S.goal = { name: n, amt: a, base: (S.goal && S.goal.name === n) ? S.goal.base : ((S.bal && S.bal.total) || 0), ts: Date.now() }; save(); closeSheet(); render(); },
  goalClear() { S.goal = null; save(); closeSheet(); render(); }
});
document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.kstep !== undefined) window.KWARN = false; });

/* photo proof: shrink to about 900 px so it fits on the phone and sends quickly */
document.addEventListener('change', e => {
  const t = e.target; if (t.id !== 'kph' || !t.files || !t.files[0]) return; const f = t.files[0], img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const sc = Math.min(1, 900 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
    const data = cv.toDataURL('image/jpeg', 0.7); if (window.KDO) window.KDO.ph = data; const v = $('#kphv'); if (v) v.innerHTML = '<img src="' + data + '" alt="" style="max-width:140px;border-radius:10px;margin:4px 0">'; };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that photo.'); }; img.src = url;
});
