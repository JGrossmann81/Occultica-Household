/* Chorica main: first run, tabs, settings, pasting codes and links, calendar, household link, startup. */
function openSheet(title, html, opts) { const sh = $('#sheet'); sh.innerHTML = `<div class="sh-bar"><b>${esc(title)}</b><button class="x" data-act="closeSheet" aria-label="Close">&times;</button></div><div class="sh-body">${html}</div>`; sh.classList.add('open'); document.body.classList.add('noscroll'); sh.scrollTop = 0; if (opts && opts.mount) opts.mount(sh); }
function closeSheet() { $('#sheet').classList.remove('open'); document.body.classList.remove('noscroll'); }
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 2600); }
const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

function viewWelcome() {
  return `<div class="center" style="margin-top:8vh"><div style="font-size:64px">🧹</div><h1>Chorica</h1><p class="dim">Chores, check-offs and pocket money.</p></div>
    <section class="card"><div class="ct"><span>Who is using this phone?</span></div>
      <button class="btn gold block" data-act="roleParent">I'm the parent</button>
      <button class="btn block" data-act="pasteOpen">I'm a kid: paste the chore list I was sent</button>
      <div class="sm dim">Kids: your parent sends you a link or a message by text. Tap the link, or copy the whole message and paste it here.</div></section>
    <p class="foot">Everything stays on this phone. Chorica tracks money owed; it never moves real money.</p>`;
}
function tabsHTML() {
  const T = isParent() && !UI.as ? [['home', '🏠', 'Today'], ['chores', '🧹', 'Chores'], ['kids', '👪', 'Kids'], ['history', '📜', 'History']] : [['today', '✅', 'Today'], ['week', '📅', 'Week'], ['money', '💰', 'Money']];
  const cur = isParent() && !UI.as ? UI.tab : UI.ktab;
  return T.map(t => `<button data-tab="${t[0]}" class="${cur === t[0] ? 'on' : ''}"><span style="font-size:20px">${t[1]}</span><span>${t[2]}</span></button>`).join('');
}
function render() {
  const v = $('#view'), nav = $('#tabs');
  if (!S.role) { v.innerHTML = viewWelcome(); nav.innerHTML = ''; return; }
  if (isParent() && UI.as && !kidById(UI.as)) UI.as = null;
  if (isParent()) accrue();
  let h;
  if (isParent() && !UI.as) h = ({ home: viewParentHome, chores: viewChores, kids: viewKids, history: viewHistory }[UI.tab] || viewParentHome)();
  else h = ({ today: viewKidToday, week: viewKidWeek, money: viewKidMoney }[UI.ktab] || viewKidToday)();
  const y = window.scrollY; v.innerHTML = h; window.scrollTo(0, y); nav.innerHTML = tabsHTML();
  if (isParent()) occPublish();
}

/* ---------- pasting codes ---------- */
function pasteSheet() {
  return `<p class="sm dim">Paste the whole text message here (or just the link). Chorica finds the code in it.</p>
    <textarea id="pin2" class="in" rows="5" placeholder="Paste here"></textarea>
    <div class="row"><button class="btn" data-act="pasteClip">Paste from clipboard</button><button class="btn gold" data-act="pasteGo">Use it</button></div>`;
}
async function useCode(text) {
  if (isParent() && UI.as) { toast('Hand the phone back to the parent first.'); return false; }
  let p; try { p = await decode(text); } catch (e) { toast(e.message, 5000); return false; }
  try {
    if (p.t === 'list') {
      if (S.role === 'kid' && S.me && S.me.id !== p.kid.id && window.KSWAP !== true) { window.KPEND = text; openSheet('Different person', `<p>This list is for <b>${esc(p.kid.name)}</b>, but this phone is set up for <b>${esc(S.me.name)}</b>.</p><button class="btn danger block" data-act="kSwapYes">Switch this phone to ${esc(p.kid.name)}</button><button class="btn block" data-act="closeSheet">Cancel</button>`); return false; }
      importList(p); window.KSWAP = false; UI.ktab = 'today'; closeSheet(); render(); toast(`Chore list from ${p.parent} loaded.`, 3500); return true;
    }
    if (p.t === 'done') {
      if (!isParent()) throw new Error('This is a check-off code. It goes to the parent\'s phone.');
      const r = await importDone(p); closeSheet(); UI.tab = 'home'; UI.as = null; render();
      toast(`${r.x.name}: ${r.added - r.auto ? (r.added - r.auto) + ' to review' : 'nothing new to review'}${r.auto ? ', ' + r.auto + ' paid automatically' : ''}${r.late ? ', ' + r.late + ' too late to count' : ''}${r.skipped - r.late > 0 ? ', ' + (r.skipped - r.late) + ' already had or not theirs' : ''}.`, 5000); return true;
    }
    throw new Error('Unknown code.');
  } catch (e) { window.KSWAP = false; toast(e.message, 5000); return false; }
}
async function handleHash() {
  let h = (location.hash || '').slice(1); try { h = decodeURIComponent(h); } catch (e) { } if (!/CHORICAZ?1\./.test(h)) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (!S.role && !standalone() && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    window.HPEND = h;
    openSheet('Open in Chorica', `<p>If you already added <b>Chorica to your Home Screen</b>, copy the code, open Chorica from its icon, and paste it there.</p><button class="btn gold block" data-act="hashCopy">Copy the code</button><p class="sm dim">Not using the Home Screen app? You can use Chorica right here in Safari instead.</p><button class="btn block" data-act="hashHere">Use it here</button>`);
    return;
  }
  useCode(h);
}

/* ---------- settings ---------- */
function settingsHTML() {
  if (isParent()) return `<label class="fl">Your name (kids see it)<input id="pn" class="in" value="${esc(S.fam.parent)}" placeholder="Mom, Dad, Jesse..."></label>
    <label class="fl">Payday</label><div class="chips c">${DAYN.map((d, i) => `<button type="button" class="chip${+S.fam.payday === i ? ' on' : ''}" data-act="setPayday" data-v="${i}">${d}</button>`).join('')}</div>
    <label class="fl">Parent PIN for a shared phone (optional, 4 to 6 digits)<input id="ppin" class="in" type="password" inputmode="numeric" maxlength="6" value="${esc(S.fam.pin)}" autocomplete="off"></label>
    <section class="card inner"><div class="ct"><span>House rules</span></div>
      <label class="fl">When a chore is missed</label><div class="chips c">${[['roll', 'Roll over: make it up within 7 days'], ['expire', 'Expire: it is gone'], ['flag', 'Flag it (optional deduction)']].map(o => `<button type="button" class="chip${missedMode() === o[0] ? ' on' : ''}" data-act="setMissed" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>
      ${missedMode() === 'flag' ? `<label class="fl">Deduct per missed chore ($, 0 for none)<input id="pfine" class="in" type="number" inputmode="decimal" min="0" step="0.25" value="${+S.fam.fine || 0}"></label>` : ''}
      <label class="fl">Streak bonus: every chore done Monday to Sunday ($, 0 for none)<input id="pstreak" class="in" type="number" inputmode="decimal" min="0" step="0.5" value="${+S.fam.streak || 0}"></label>
      <div class="sm dim">Allowance is set per kid (Kids > tap a kid). Allowance is added every Monday for the week before. Streak bonuses and deductions are settled a few days later (a week in roll-over mode), so late check-offs can still arrive. Missed chores always show up so you can see patterns.</div></section>
    <button class="btn gold block" data-act="setSave">Save</button>
    <section class="card inner"><div class="ct"><span>Calendar</span></div><div class="sm dim">Adds a weekly payday reminder to your phone calendar.</div><button class="btn block" data-act="icsParent">Save calendar file</button></section>
    <section class="card inner"><div class="ct"><span>Backup</span></div><div class="sm dim">Kids, chores and the money ledger live only on this phone.</div><button class="btn block" data-act="bkMake">Copy backup code</button><textarea id="bkin" class="in" rows="3" placeholder="Paste a backup code to restore"></textarea><button class="btn block" data-act="bkUse">Restore</button></section>
    <label class="fl"><input type="checkbox" class="plaintog" ${S.settings.plain ? 'checked' : ''}> Codes for older phones (longer links, works before iOS 16.4)</label>
    ${window.OCC ? '<button class="btn block" data-act="occOpen">🏡 Occultica household</button>' : ''}
    <button class="btn danger block" data-act="resetAsk">Start over</button>`;
  return `<p class="sm">This phone: <b>${esc((S.me || {}).name || '')}</b>, chores from <b>${esc(S.fam.parent)}</b>.</p>
    <button class="btn gold block" data-act="pasteOpen">Paste a new list from ${esc(S.fam.parent)}</button>
    <section class="card inner"><div class="ct"><span>Reminders</span></div><div class="sm dim">Puts your chores in your phone's calendar so it reminds you at 4 pm.</div><button class="btn block" data-act="icsKid">Save calendar file</button></section>
    <label class="fl"><input type="checkbox" class="plaintog" ${S.settings.plain ? 'checked' : ''}> Codes for older phones</label>
    <button class="btn danger block" data-act="resetAsk">Start over</button>`;
}
/* ---------- calendar files ---------- */
function icsWrap(evs) { const st = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occultica//Chorica//EN', 'X-WR-CALNAME:Chorica'].concat(...evs.map((e, i) => ['BEGIN:VEVENT', 'UID:chorica-' + i + '-' + e.uid + '@occultica', 'DTSTAMP:' + st, 'DTSTART:' + e.start, 'DTEND:' + e.end].concat(e.rule ? ['RRULE:' + e.rule] : [], ['SUMMARY:' + e.title.replace(/[,;]/g, ' '), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + e.title.replace(/[,;]/g, ' '), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'])), ['END:VCALENDAR']).join('\r\n'); }
function icsSave(txt, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
const icsT = (k, hm) => k.replace(/-/g, '') + 'T' + hm + '00';
const BYD = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function nextDay(dow) { let k = dkey(); for (let i = 0; i < 7; i++) { if (parseKey(k).getDay() === dow) return k; k = addDays(k, 1); } return k; }
/* ---------- household link (parent phone) ---------- */
function occPublish() {
  if (!window.OCC || !isParent()) return; clearTimeout(occPublish.t);
  occPublish.t = setTimeout(() => { try {
    const m = dkey().slice(0, 7), inMonth = ts => dkey(new Date(ts)).slice(0, 7) === m, pays = []; let k = nextDay(+S.fam.payday); for (let i = 0; i < 8; i++) { pays.push({ t: 'Chore payday', d: k, kind: 'pay' }); k = addDays(k, 7); }
    OCC.publish('chorica', { kids: S.kids.map(x => x.name), owed: round2(S.kids.reduce((s, x) => s + Math.max(0, ledger(x.id).owed), 0)), paidMonth: round2(S.pay.filter(p => inMonth(p.ts)).reduce((s, p) => s + p.amt, 0)), earnedMonth: round2(S.done.filter(d => d.status === 'approved' && inMonth(d.decidedTs || d.ts)).reduce((s, d) => s + (d.amt || 0), 0)), waiting: S.done.filter(d => d.status === 'pending').length, weekValue: round2(S.kids.reduce((s, x) => s + weekValue(x.id), 0)), events: pays });
  } catch (e) { } }, 600);
}
Object.assign(ACT, {
  closeSheet() { closeSheet(); },
  settings() { openSheet('Settings', settingsHTML()); },
  roleParent() { S.role = 'parent'; save(); openSheet('Welcome', `<label class="fl">What do your kids call you?<input id="pn" class="in" placeholder="Mom, Dad..."></label><button class="btn gold block" data-act="nameSave">Next</button>`, { mount: () => $('#pn').focus() }); render(); },
  nameSave() { S.fam.parent = ($('#pn').value || '').trim() || 'Parent'; save(); closeSheet(); ACT.kidAdd(); },
  pasteOpen() { openSheet('Paste a code', pasteSheet()); },
  async pasteClip() { try { const t = await navigator.clipboard.readText(); $('#pin2').value = t; if (/CHORICAZ?1\./.test(t)) useCode(t); } catch (e) { toast('Press and hold in the box, then Paste.'); } },
  pasteGo() { useCode($('#pin2').value); },
  async kSwapYes() { window.KSWAP = true; const t = window.KPEND; try { await useCode(t); } finally { window.KSWAP = false; } },
  hashCopy() { navigator.clipboard.writeText(window.HPEND).then(() => toast('Copied. Now open Chorica from your Home Screen and tap Paste.', 6000), () => toast('Could not copy.')); },
  hashHere() { closeSheet(); useCode(window.HPEND); },
  setMissed(el) { const ps = $('#pstreak') && $('#pstreak').value, pf = $('#pfine') && $('#pfine').value; if (el.dataset.v === 'flag' && S.fam.missed !== 'flag') S.fam.flagSince = dkey(); S.fam.missed = el.dataset.v; save(); const sh = $('#sheet'), y = sh.scrollTop; $('.sh-body', sh).innerHTML = settingsHTML(); if (ps != null && $('#pstreak')) $('#pstreak').value = ps; if (pf != null && $('#pfine')) $('#pfine').value = pf; sh.scrollTop = y; },
  setPayday(el) { S.fam.payday = +el.dataset.v; save(); $$('[data-act="setPayday"]').forEach(b => b.classList.toggle('on', b === el)); },
  setSave() { const pin = ($('#ppin').value || '').trim(); if (pin && !/^\d{4,6}$/.test(pin)) return toast('PIN must be 4 to 6 digits.'); S.fam.parent = ($('#pn').value || '').trim() || S.fam.parent; S.fam.pin = pin; if ($('#pfine')) S.fam.fine = Math.max(0, round2(+$('#pfine').value || 0)); if ($('#pstreak')) S.fam.streak = Math.max(0, round2(+$('#pstreak').value || 0)); S.chores.forEach(c => { if (c.active !== false) c.edited = Date.now(); }); save(); closeSheet(); render(); toast('Saved.'); },
  resetAsk() { openSheet('Start over?', `<p>This erases ${isParent() ? 'your kids, chores and the money ledger' : 'your chores and history'} on this phone.</p><button class="btn danger block" data-act="resetYes">Erase and start over</button><button class="btn block" data-act="closeSheet">Cancel</button>`); },
  resetYes() { S = blank(); save(); try { localStorage.removeItem('occ.pub.chorica'); } catch (e) { } UI.as = null; closeSheet(); render(); },
  async bkMake() { const c = await encode({ t: 'backup', v: 1, ts: Date.now(), S }); try { await navigator.clipboard.writeText(c); toast('Backup code copied. Keep it in Notes.'); } catch (e) { openSheet('Backup code', `<textarea class="in" rows="8" readonly>${esc(c)}</textarea>`); } },
  async bkUse() { try { const p = await decode($('#bkin').value); if (p.t !== 'backup' || !p.S) throw new Error('That is not a Chorica backup code.'); S = Object.assign(blank(), p.S); save(); closeSheet(); render(); toast('Restored.'); } catch (e) { toast(e.message, 5000); } },
  icsParent() { const k = nextDay(+S.fam.payday); icsSave(icsWrap([{ uid: 'payday', title: '🧹 Chore payday: approve and pay the kids', start: icsT(k, '1800'), end: icsT(k, '1815'), rule: 'FREQ=WEEKLY' }]), 'chorica-payday.ics'); toast('Calendar file saved. Open it to add.'); },
  icsKid() {
    const me = S.me, ev = []; S.chores.filter(c => c.active !== false && forKid(c, me.id)).forEach(c => { const r = c.rep || {}, k = dkey(), n = c.turns && Array.isArray(c.kids) && c.kids.length > 1 ? c.kids.length : 1, t = c.icon + ' ' + c.name + (n > 1 ? ' (your turn)' : '');
      let first = k; if (n > 1) { for (let i = 0; i < 7 * n; i++) { const d = addDays(k, i); if (turnKid(c, d) === me.id) { first = c.turns === 'week' ? weekStart(d) < k ? k : weekStart(d) : d; break; } } }
      const iv = n > 1 ? ';INTERVAL=' + n : '';
      if (r.t === 'daily') ev.push({ uid: c.id, title: t, start: icsT(first, '1600'), end: icsT(first, '1615'), rule: n > 1 && c.turns === 'week' ? 'FREQ=WEEKLY;INTERVAL=' + n + ';BYDAY=MO,TU,WE,TH,FR,SA,SU' : 'FREQ=DAILY' + iv });
      else if (r.t === 'days' && (r.days || []).length) { const d0 = (() => { let d = first; for (let i = 0; i < 7; i++) { if (r.days.includes(parseKey(d).getDay())) return d; d = addDays(d, 1); } return first; })(); ev.push({ uid: c.id, title: t, start: icsT(d0, '1600'), end: icsT(d0, '1615'), rule: 'FREQ=WEEKLY' + iv + ';BYDAY=' + r.days.map(d => BYD[d]).join(',') }); }
      else if (r.t === 'weekly') { const d = addDays(weekStart(first), 5) < k ? nextDay(6) : addDays(weekStart(first), 5); ev.push({ uid: c.id, title: c.icon + ' This week: ' + c.name, start: icsT(d, '1000'), end: icsT(d, '1015'), rule: 'FREQ=WEEKLY' + iv }); }
      else if (r.t === 'biweekly') { const d = addDays(biStart(c, k), 12) >= k ? addDays(biStart(c, k), 12) : addDays(biStart(c, k), 26); ev.push({ uid: c.id, title: c.icon + ' These 2 weeks: ' + c.name, start: icsT(d, '1000'), end: icsT(d, '1015'), rule: 'FREQ=WEEKLY;INTERVAL=2' }); }
      else if (r.t === 'monthly') { const e = occEnd(c, k), d = addDays(e, -2) >= k ? addDays(e, -2) : k; ev.push({ uid: c.id, title: c.icon + ' This month: ' + c.name, start: icsT(d, '1000'), end: icsT(d, '1015'), rule: 'FREQ=MONTHLY' }); }
      else if (r.t === 'once') { const d = r.date && r.date >= k ? r.date : addDays(k, 1); ev.push({ uid: c.id, title: t, start: icsT(d, '1600'), end: icsT(d, '1615') }); } });
    if (!ev.length) return toast('No chores yet.'); icsSave(icsWrap(ev), 'chorica-chores.ics'); toast('Calendar file saved. Open it to add your chores.');
  }
});
document.addEventListener('change', e => { if (e.target.classList && e.target.classList.contains('plaintog')) { S.settings.plain = e.target.checked; save(); toast(e.target.checked ? 'Codes will work on older phones.' : 'Shorter codes.'); } });
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); } });
function boot() {
  load(); if (isParent() && S.asKid && kidById(S.asKid)) { UI.as = S.asKid; UI.ktab = 'today'; }
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b) return; if (isParent() && !UI.as) UI.tab = b.dataset.tab; else UI.ktab = b.dataset.tab; closeSheet(); render(); window.scrollTo(0, 0); });
  render(); handleHash(); window.addEventListener('hashchange', handleHash);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#sheet').classList.contains('open')) render(); });
  if (window.OCC) OCC.bind(ACT, 'chorica', w => { occPublish(); if (w !== 'publish') render(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
}
window.addEventListener('DOMContentLoaded', boot);
