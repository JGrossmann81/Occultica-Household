/* Healthica caregiver mode: several people on one phone (you, a parent, a child), each with their own
   profile, food, logs, medicines, appointments and reminders. Reminders and appointments fire for everyone. */
const PROF_IDX = 'healthica.people', PROF_ACT = 'healthica.active';
const REL = [['me', 'Me'], ['parent', 'Parent'], ['child', 'Child'], ['partner', 'Partner'], ['other', 'Someone else']];
const profKey = id => !id || id === 'main' ? 'healthica.v1' : 'healthica.v1.p.' + id;
const profActive = () => { try { return localStorage.getItem(PROF_ACT) || 'main'; } catch (e) { return 'main'; } };
function profList() {
  let L = null; try { L = JSON.parse(localStorage.getItem(PROF_IDX) || 'null'); } catch (e) { }
  if (!Array.isArray(L) || !L.length) L = [{ id: 'main', name: (S && S.profile && S.profile.name) || 'Me', rel: 'me' }];
  return L;
}
function profSaveList(L) { try { localStorage.setItem(PROF_IDX, JSON.stringify(L)); } catch (e) { } }
function profRead(id) { if (id === profActive()) return S; try { const raw = localStorage.getItem(profKey(id)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
const profMany = () => profList().length > 1;
const profName = p => (p && p.name) || 'Someone';
function profSwitch(id) {
  if (id === profActive()) return; save();
  try { localStorage.setItem(PROF_ACT, id); } catch (e) { }
  KEY = profKey(id); load();
  Object.assign(UI, { tab: 'today', date: dkey(), kit: null, logseg: 'log' }); window.INT = null;
  closeSheetQuiet(); render(); window.scrollTo(0, 0);
  if (S.profile) toast('Now viewing ' + (S.profile.name || profName(profList().find(p => p.id === id))) + '.');
}
/* keep the people list's names in step with each profile */
(function () {
  const s0 = save; save = function () {
    s0(); if (KEY !== profKey(profActive())) return; const L = profList(), me = L.find(p => p.id === profActive()), nm = S.profile && S.profile.name;
    if (me && nm && me.name !== nm) { me.name = nm; profSaveList(L); } else if (!localStorage.getItem(PROF_IDX) && S.profile) profSaveList(L);
  };
})();

/* ---------- header chip + Today card ---------- */
function profChip() {
  if (!profMany()) return '';
  const me = profList().find(p => p.id === profActive()) || {};
  return `<button class="mini pchip" data-act="profOpen" aria-label="Switch person">👥 ${esc(profName(me))}</button>`;
}
function profUpcoming(days) {
  const out = [], lim = addDays(dkey(), days), today = dkey();
  profList().forEach(p => { if (p.id === profActive()) return; const d = profRead(p.id); if (!d) return;
    (d.appts || []).filter(a => !a.done && a.date >= today && a.date <= lim).forEach(a => out.push({ who: p, t: a.title, d: a.date, time: a.time }));
    const rem = (d.reminders || []).filter(r => r.on && r.days.includes(new Date().getDay()) && /med|pill|dose|insulin|take|peptide|vitamin/i.test(r.label));
    if (rem.length) out.push({ who: p, t: rem.length + ' medicine reminder' + (rem.length > 1 ? 's' : '') + ' today', d: today, time: rem.map(r => r.time).sort()[0] });
    if (d.dia && d.dia.setup) { const tr = (d.trackers || []).find(t => t.name === 'Blood glucose'); const lows = tr ? (d.logs || []).filter(l => l.trackerId === tr.id && l.ts > Date.now() - 3 * 86400000 && parseFloat(l.value) > 0 && ((/mmol/i.test(l.unit || '') || (!/mg/i.test(l.unit || '') && d.dia.setup.unit === 'mmol') ? parseFloat(l.value) * 18 : parseFloat(l.value)) < 70)) : []; if (lows.length) out.push({ who: p, t: 'Low blood sugar logged recently', d: today, warn: true }); }
  });
  return out.sort((a, b) => (a.d + (a.time || '')) < (b.d + (b.time || '')) ? -1 : 1);
}
function profCard() {
  if (!profMany()) return ''; const up = profUpcoming(7);
  return `<section class="card"><div class="ct"><span>👥 Everyone else</span><a class="lnk" data-act="profOpen">People</a></div>
    ${up.length ? up.slice(0, 6).map(x => `<div class="entry" data-act="profGo" data-id="${x.who.id}"><div><b>${esc(profName(x.who))}</b><div class="sm ${x.warn ? 'warn' : 'dim'}">${esc(x.t)}</div></div><div class="sm dim">${x.d === dkey() ? 'Today' : fmtDayP(x.d)}${x.time ? ' ' + hhmm(x.time) : ''}</div></div>`).join('') : '<div class="sm dim">Nothing coming up for the others this week.</div>'}</section>`;
}
const fmtDayP = k => parseKey(k).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

/* ---------- people sheet ---------- */
function profSheet() {
  const L = profList(), act = profActive();
  return `<p class="sm dim">Caregiver mode: keep a separate Healthica for each person you look after. Everything stays on this phone. Reminders and appointments ring for everyone, labelled with their name.</p>
    ${L.map(p => `<div class="entry"><div><b>${esc(profName(p))}</b> ${p.id === act ? '<span class="tag">showing</span>' : ''}<div class="sm dim">${esc((REL.find(r => r[0] === p.rel) || [0, ''])[1])}</div></div><div class="row" style="margin:0">${p.id !== act ? `<button class="mini" data-act="profGo" data-id="${p.id}">Open</button>` : ''}${p.id !== 'main' && p.id !== act ? `<button class="x" data-act="profDel" data-id="${p.id}" aria-label="Remove">&times;</button>` : ''}</div></div>`).join('')}
    <section class="card inner"><div class="ct"><span>Add a person</span></div>
      <input id="pnm" class="in" placeholder="Name (e.g. Mom, Lily)"><div class="chips c" id="prel">${REL.slice(1).map((r, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-act="profRel" data-v="${r[0]}">${r[1]}</button>`).join('')}</div>
      <button class="btn gold block" data-act="profAdd">Add and set up their profile</button>
      <div class="sm dim">You will fill in their health profile next. For a child, Healthica keeps them on full fuel and never sets a weight-loss pace.</div></section>`;
}
Object.assign(ACT, {
  profOpen() { save(); openSheet('People', profSheet()); },
  profGo(el) { profSwitch(el.dataset.id); },
  profRel(el) { $$('#prel .chip').forEach(c => c.classList.toggle('on', c === el)); },
  profAdd() {
    const nm = ($('#pnm').value || '').trim(); if (!nm) { toast('Enter their name.'); return; }
    const rel = ($('#prel .chip.on') || { dataset: { v: 'other' } }).dataset.v, L = profList(), id = uid();
    L.push({ id, name: nm, rel }); profSaveList(L);
    try { const b = blank(); b.pendingName = nm; localStorage.setItem(profKey(id), JSON.stringify(b)); } catch (e) { }
    profSwitch(id); toast('Set up ' + nm + '\'s profile.', 4000);
  },
  profDel(el) {
    const p = profList().find(x => x.id === el.dataset.id); if (!p) return;
    openSheet('Remove ' + profName(p) + '?', `<p>This deletes all of ${esc(profName(p))}'s Healthica data on this phone. Make a backup first if you might want it later.</p><button class="btn danger block" data-act="profDelYes" data-id="${p.id}">Yes, remove</button><button class="btn block" data-act="profOpen">Cancel</button>`);
  },
  profDelYes(el) { const id = el.dataset.id; if (id === 'main' || id === profActive()) return; try { localStorage.removeItem(profKey(id)); } catch (e) { } profSaveList(profList().filter(p => p.id !== id)); openSheet('People', profSheet()); toast('Removed.'); }
});

/* ---------- new person's intake gets their name ---------- */
(function () {
  if (typeof openIntake !== 'function') return;
  const o0 = openIntake; openIntake = function (edit) { o0(edit); if (!S.profile && S.pendingName && window.INT && window.INT.d && !window.INT.d.name) { window.INT.d.name = S.pendingName; try { const i = document.querySelector('[data-f="name"]'); if (i) i.value = S.pendingName; } catch (e) { } } };
})();

/* ---------- reminders and appointments for everyone ---------- */
(function () {
  const c0 = checkReminders;
  checkReminders = function () {
    c0(); if (!profMany()) return;
    const actId = profActive(), keepS = S, keepK = KEY, keepF = fireReminder;
    profList().forEach(p => {
      if (p.id === actId) return; const d = profRead(p.id); if (!d || !d.profile) return;
      const b = blank(); Object.keys(b).forEach(k => { if (d[k] === undefined) d[k] = b[k]; }); Object.keys(b.settings).forEach(k => { if (d.settings[k] === undefined) d.settings[k] = b.settings[k]; });
      try {
        S = d; KEY = profKey(p.id);
        fireReminder = r => keepF(Object.assign({}, r, { label: profName(p) + ': ' + r.label }));
        c0(); localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) { } finally { S = keepS; KEY = keepK; fireReminder = keepF; }
    });
  };
})();

/* ---------- erase: this person or everyone ---------- */
Object.assign(ACT, {
  wipe() {
    if (!profMany()) { openSheet('Erase everything?', '<p>This deletes all food, weight, workouts and logs on this phone. It cannot be undone.</p><button class="btn danger block" data-act="wipeAll">Yes, erase</button><button class="btn block" data-act="closeSheet">Cancel</button>'); return; }
    const me = profName(profList().find(p => p.id === profActive()));
    openSheet('Erase data?', `<p>Choose what to delete. It cannot be undone. Make a backup first if you might want it later.</p><button class="btn danger block" data-act="wipeOne">Erase ${esc(me)}'s data only</button><button class="btn danger block" data-act="wipeAll">Erase everyone on this phone</button><button class="btn block" data-act="closeSheet">Cancel</button>`);
  },
  wipeOne() { try { localStorage.removeItem(KEY); } catch (e) { } load(); try { localStorage.removeItem('occ.pub.healthica'); } catch (e) { } closeSheet(); render(); toast('Erased.'); },
  wipeAll() {
    try { profList().forEach(p => localStorage.removeItem(profKey(p.id))); ['healthica.v1', PROF_IDX, PROF_ACT, 'occ.pub.healthica'].forEach(k => localStorage.removeItem(k)); } catch (e) { }
    KEY = 'healthica.v1'; load(); closeSheet(); render(); toast('Everything erased.');
  },
  wipeYes() { ACT.wipeAll(); },
  profBack() { // leave a new person's setup without finishing it
    const id = profActive(), back = window.PROF_PREV && window.PROF_PREV !== id ? window.PROF_PREV : 'main';
    if (!S.profile && id !== 'main') { try { localStorage.removeItem(profKey(id)); } catch (e) { } profSaveList(profList().filter(p => p.id !== id)); }
    profSwitch(back);
  }
});
(function () {
  const sw0 = profSwitch; profSwitch = function (id) { window.PROF_PREV = profActive(); sw0(id); };
  if (typeof intRender !== 'function') return;
  const r0 = intRender; intRender = function () {
    r0(); if (!profMany() || S.profile) return; const body = $('#sheet .sh-body'); if (!body || $('#profback')) return;
    const prev = profList().find(p => p.id === (window.PROF_PREV || 'main'));
    body.insertAdjacentHTML('beforeend', `<button id="profback" class="btn block" data-act="profBack">Cancel and go back to ${esc(profName(prev))}</button>`);
  };
})();
