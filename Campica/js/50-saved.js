/* Campica: Saved tab. Saved camps (written by the Find tab into S.saved.list), per-camp booking records, call-to-verify helper,
   photos and ratings after a stay, states visited, wish list, export. Also publishes the household summary (shape in shell/js/occ-link.js).
   S.saved = { list:[{id,name,ts,note,status}], rec:{ <id>:{conf,from,nights,site,cost,phone,checkin,calls[],qs{},callNotes,notes,rating,fam,state} }, wish:[{id,text}], filter, inclConf }
   Confirmation numbers and notes stay on this phone; they are never published and are left out of exports unless you switch that on. */
window.CP = window.CP || {};
(function () {
  'use strict';
  const esc = OA.esc, CPo = window.CP;
  OA.defaults({ saved: { list: [], rec: {}, wish: [], filter: 'all', inclConf: false } });
  const SV = () => { const s = OA.S.saved; s.list = Array.isArray(s.list) ? s.list : []; s.rec = s.rec || {}; s.wish = Array.isArray(s.wish) ? s.wish : []; return s; };
  const isN = v => typeof v === 'number' && isFinite(v);
  const num = v => { v = parseFloat(v); return isFinite(v) ? v : 0; };
  const ext = u => (typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : null;
  const telHref = p => { const d = String(p || '').replace(/[^\d+]/g, ''); return d.length >= 7 ? 'tel:' + d : null; };
  const rk = id => String(id).replace(/[^A-Za-z0-9_-]/g, '_');
  const rec = id => { const s = SV(); return s.rec[rk(id)] || {}; };
  const recPath = id => 'saved.rec.' + rk(id);
  const entry = id => SV().list.find(x => x.id === id) || null;
  const camp = id => { try { if (CPo.campLookup) return CPo.campLookup(id); if (typeof CPo.camp === 'function') return CPo.camp(id); } catch (e) { } const it = (window.CAMPS && window.CAMPS.items) || []; return it.find(c => c.id === id) || null; };
  const STATUS = [['interested', 'Interested'], ['booked', 'Booked'], ['waitlist', 'Waitlist'], ['visited', 'Visited'], ['not-again', 'Not again']];
  const STCLS = { interested: '', booked: 'g', waitlist: 'w', visited: 'a', 'not-again': 'r' };
  const stLabel = s => (STATUS.find(x => x[0] === s) || [0, 'Interested'])[1];
  let pubT = null;
  const pubSoon = () => { clearTimeout(pubT); pubT = setTimeout(() => { try { if (OA.publish) OA.publish(); } catch (e) { } }, 500); };
  const touch = () => { OA.saveSoon(); pubSoon(); };
  const photoUrls = [];
  const stateOf = e => { const c = camp(e.id); return String((c && c.state) || e.state || rec(e.id).state || '').toUpperCase().slice(0, 2); };

  /* ---------- the tab ---------- */
  function counts() { const c = {}; SV().list.forEach(e => { c[e.status || 'interested'] = (c[e.status || 'interested'] || 0) + 1; }); return c; }
  function row(e) {
    const c = camp(e.id), r = rec(e.id), st = e.status || 'interested', sub = [c && c.parent, c ? c.state : e.state].filter(Boolean).join(', ');
    return `<div class="li" data-act="csOpen" data-id="${esc(e.id)}"><div class="ic">${OA.icon('tent')}</div><div class="tx"><b>${esc(e.name || (c && c.name) || e.id)}</b><span>${esc(sub)}${r.from ? (sub ? ' · ' : '') + esc(OA.fmtDate(r.from)) + (num(r.nights) ? ', ' + esc(r.nights) + ' n' : '') : ''}</span>${e.note ? `<span>${esc(e.note)}</span>` : ''}</div><div class="end"><span class="tag ${STCLS[st] || ''}">${esc(stLabel(st))}</span>${isN(r.rating) && r.rating > 0 ? `<div class="gold">${'★'.repeat(r.rating)}</div>` : ''}</div></div>`;
  }
  function visited() {
    const st = {}, vis = SV().list.filter(e => e.status === 'visited'); let nights = 0;
    vis.forEach(e => { const s = stateOf(e) || '?'; st[s] = (st[s] || 0) + 1; nights += num(rec(e.id).nights); });
    return { st, n: vis.length, nights };
  }
  function renderSaved() {
    const s = SV(), f = s.filter || 'all', cn = counts(), v = visited();
    const list = s.list.filter(e => f === 'all' || (e.status || 'interested') === f).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const chips = [['all', 'All (' + s.list.length + ')']].concat(STATUS.map(x => [x[0], x[1] + (cn[x[0]] ? ' (' + cn[x[0]] + ')' : '')]));
    const hasFind = OA.tabs.some(t => t.id === 'find');
    let h = OA.header('Saved', 'Camps you like, book and visit');
    h += `<div class="chips">${chips.map(c => `<button class="chip ${f === c[0] ? 'on' : ''}" data-act="csFilter" data-f="${c[0]}">${esc(c[1])}</button>`).join('')}</div>`;
    if (!s.list.length) {
      h += `<div class="card tip center"><h2 class="big">No saved camps yet</h2><p class="sm dim">Save camps from the Find tab with the heart button. They land here with a booking record, a call-to-verify script and space for photos and notes.</p>
        ${hasFind ? '<button class="btn gold block" data-go="find">Find a campground</button>' : ''}<button class="btn block" data-act="csAdd" data-smoke>Add a camp by hand</button></div>`;
    } else {
      h += `<div class="card">${list.length ? list.map(row).join('') : '<div class="sm dim pad">Nothing with that status yet.</div>'}<button class="btn block" data-act="csAdd" data-smoke>Add a camp by hand</button></div>`;
    }
    const sts = Object.keys(v.st).sort();
    h += `<div class="card"><div class="ct"><span>${OA.icon('map')} Places you have camped</span></div>
      <div class="stat"><div><b>${v.n}</b><span>CAMPS</span></div><div><b>${sts.filter(x => x !== '?').length}</b><span>STATES</span></div><div><b>${v.nights}</b><span>NIGHTS</span></div></div>
      ${sts.length ? `<div class="cs-states">${sts.map(x => `<div class="cs-st"><b>${esc(x)}</b><span>${v.st[x]}</span></div>`).join('')}</div>` : '<p class="sm dim">Mark a saved camp as Visited and its state appears here. Nights count when you enter them in the booking record.</p>'}</div>`;
    h += `<div class="card"><div class="ct"><span>${OA.icon('star')} Wish list</span></div>
      ${s.wish.length ? s.wish.map(w => `<div class="row mid"><span style="flex:1">${esc(w.text)}</span><button class="x" data-act="csWishDel" data-id="${esc(w.id)}" aria-label="Remove">×</button></div>`).join('') : '<p class="sm dim">Dream trips and places someone told you about. No details needed.</p>'}
      <div class="row mid"><input class="in" id="cswish" placeholder="Big Sur in the fall…" style="margin:0"><button class="btn" data-act="csWishAdd" style="flex:none">Add</button></div></div>`;
    h += `<div class="card"><div class="ct"><span>${OA.icon('download')} Export and back up</span></div>
      <label class="chk"><input type="checkbox" data-bind="saved.inclConf" data-type="bool" ${s.inclConf ? 'checked' : ''}> Include confirmation numbers in exports</label>
      <div class="row wrap"><button class="btn" data-act="csCsv">Download CSV</button><button class="btn" data-act="csText">Share as text</button></div>
      <button class="btn block" data-act="backupFile">Save a full backup file</button>
      <p class="xs dim">The backup holds everything in this app except photos. The gear menu also has a copyable backup code.</p></div>
      <div class="foot">Confirmation numbers and notes stay on this phone only.</div>`;
    return h;
  }
  OA.tab({ id: 'saved', label: 'Saved', icon: 'heart', order: 40, render: () => renderSaved() });

  /* ---------- booking record ---------- */
  function phoneFor(id) { const c = camp(id), r = rec(id); return r.phone || (c && ((c.booking && c.booking.phone) || (c.contact && c.contact.phone))) || ''; }
  function recHTML(id) {
    const e = entry(id); if (!e) return '<p class="dim">This camp is no longer on your list.</p>';
    const c = camp(id), r = rec(id), P = recPath(id), ei = SV().list.indexOf(e), ph = phoneFor(id), f = c && c.fees;
    const bu = ext(c && c.booking && c.booking.url), cu = ext(c && c.contact && c.contact.url);
    const inp = (l, p, v, a) => `<label class="fl">${l}<input class="in" data-bind="${p}" data-then="csTouch" value="${esc(v == null ? '' : v)}" ${a || ''}></label>`;
    const calls = (r.calls || []);
    return `<div class="sm dim">${esc([c && c.parent, c ? c.state : e.state].filter(Boolean).join(', '))}</div>
      ${c ? `<div class="kv"><span>Listed fee</span><span>${f && isN(f.nightlyMin) ? esc(OA.money(f.nightlyMin) + (f.nightlyMax != null && f.nightlyMax !== f.nightlyMin ? ' to ' + OA.money(f.nightlyMax) : '') + ' a night') : 'check with the source'}</span></div>` : ''}
      <div class="row wrap">${bu ? `<a class="mini" href="${esc(bu)}" target="_blank" rel="noopener">Booking page</a>` : ''}${cu ? `<a class="mini" href="${esc(cu)}" target="_blank" rel="noopener">Official page</a>` : ''}${c && isN(c.lat) && isN(c.lon) ? `<a class="mini" href="${esc(OA.geo.mapLinks(c.lat, c.lon).google)}" target="_blank" rel="noopener">Open map</a>` : ''}</div>
      <label class="fl">Status<select class="in" data-bind="saved.list.${ei}.status" data-then="csStatus">${STATUS.map(x => `<option value="${x[0]}" ${(e.status || 'interested') === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label>
      <label class="fl">Short note<input class="in" data-bind="saved.list.${ei}.note" data-then="csTouch" value="${esc(e.note || '')}" placeholder="Quiet loop, good for the kids"></label>
      <div class="sh-sec"><h3>Booking record</h3>
        ${inp('Confirmation number (stored only on this phone)', P + '.conf', r.conf, 'autocomplete="off"')}
        <div class="two">${inp('Arrival', P + '.from', r.from, 'type="date"')}${inp('Nights', P + '.nights', r.nights, 'type="number" min="1" max="60" inputmode="numeric"')}</div>
        <div class="two">${inp('Site number', P + '.site', r.site)}${inp('Total cost ($)', P + '.cost', r.cost, 'type="number" min="0" step="0.01" inputmode="decimal"')}</div>
        <div class="two">${inp('Camp phone', P + '.phone', r.phone != null ? r.phone : '', 'type="tel" placeholder="' + esc(phoneFor(id) || 'not on file') + '"')}${inp('Check-in time', P + '.checkin', r.checkin, 'placeholder="2:00 PM"')}</div></div>
      <div class="sh-sec"><h3>Call to verify</h3>
        <p class="sm dim">Fees, closures and rules change. A short call confirms what you booked.</p>
        ${calls.length ? calls.map((t, i) => `<div class="row mid"><span style="flex:1" class="sm">Called to confirm on ${esc(new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }))}</span><button class="x" data-act="csCallDel" data-id="${esc(id)}" data-i="${i}" aria-label="Remove">×</button></div>`).join('') : '<p class="sm dim">Not called yet.</p>'}
        <div class="row wrap"><button class="btn" data-act="csCall" data-id="${esc(id)}" data-smoke>Open the call script</button><button class="btn" data-act="csCalled" data-id="${esc(id)}">I called today</button></div></div>
      <div class="sh-sec"><h3>Notes</h3><textarea class="in" rows="3" data-bind="${P}.notes" data-then="csTouch" placeholder="Reservation details, what to bring, gate code…">${esc(r.notes || '')}</textarea></div>
      <div class="sh-sec"><h3>After the stay</h3>
        <div class="chips">${[1, 2, 3, 4, 5].map(n => `<button class="chip ${r.rating === n ? 'on' : ''}" data-act="csRate" data-id="${esc(id)}" data-n="${n}">${'★'.repeat(n)}</button>`).join('')}</div>
        <textarea class="in" rows="3" data-bind="${P}.fam" data-then="csTouch" placeholder="Best sites, what the kids loved, what to do differently">${esc(r.fam || '')}</textarea></div>
      <div class="sh-sec"><h3>Photos</h3><div id="csph" class="photo-grid"></div><button class="btn block" data-act="csPhoto" data-id="${esc(id)}">Add a photo</button></div>
      <div class="sh-sec"><button class="btn gold block" data-act="csToTrip" data-id="${esc(id)}">Add to a trip</button><button class="btn danger block" data-act="csRemove" data-id="${esc(id)}">Remove from saved</button></div>`;
  }
  async function loadPhotos(id) {
    const box = OA.$('#csph'); if (!box) return;
    try {
      const all = (await OA.photo.all()).filter(p => p.tag === 'camp:' + id); if (!OA.$('#csph')) return;
      photoUrls.splice(0).forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { } });
      OA.$('#csph').innerHTML = all.length ? all.map(p => { const u = OA.photo.url(p); photoUrls.push(u); return `<div class="cs-ph"><img src="${u}" alt="Camp photo"><button class="x" data-act="csPhotoDel" data-pid="${esc(p.id)}" data-id="${esc(id)}" aria-label="Delete photo">×</button></div>`; }).join('') : '<div class="sm dim" style="grid-column:1/-1">No photos yet.</div>';
    } catch (e) { box.innerHTML = '<div class="sm dim" style="grid-column:1/-1">Photos are not available here.</div>'; }
  }
  function openRec(id) { OA.sheet((entry(id) || {}).name || 'Camp', recHTML(id), { onOpen: () => loadPhotos(id), onClose: () => { photoUrls.splice(0).forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { } }); } }); }

  /* ---------- call script ---------- */
  const QS = [
    ['fees', 'What is the nightly fee today, and are there extra fees (extra vehicle, pets, reservation, taxes)?'],
    ['rig', 'Will my rig fit? Give the length, and ask about pull-through sites, slope and tight turns.'],
    ['hook', 'Which hookups does my site have (electric amps, water, sewer), and is there a dump station?'],
    ['quiet', 'What are the quiet hours, and are generators allowed?'],
    ['fire', 'Are there fire restrictions or bans right now, for wood, charcoal or stoves?'],
    ['in', 'What are check-in and check-out times, and can I arrive early or late?'],
    ['cancel', 'What is the cancellation and refund policy, and is there a fee to change dates?'],
    ['water', 'Is drinking water on, and are the restrooms and showers open?'],
    ['road', 'Are the road, trails and nearby attractions open? Any closures or smoke, snow or flood alerts?'],
    ['pets', 'What are the pet and leash rules, and the rules for food storage and wildlife?'],
    ['cell', 'Is there cell service at the site? Where is the nearest store, fuel and hospital?']
  ];
  function callHTML(id) {
    const e = entry(id) || {}, c = camp(id), r = rec(id), ph = phoneFor(id), P = recPath(id), tl = telHref(ph), f = (c && c.fees) || {}, bk = (c && c.booking) || {};
    const listed = { fees: isN(f.nightlyMin) ? 'Listed: ' + OA.money(f.nightlyMin) + (f.nightlyMax != null && f.nightlyMax !== f.nightlyMin ? ' to ' + OA.money(f.nightlyMax) : '') + ' a night' + (f.asof ? ' (as of ' + f.asof + ')' : '') : '', rig: c && c.sites && isN(c.sites.maxRvFt) ? 'Listed max rig: ' + OA.ft(c.sites.maxRvFt) : '', cancel: bk.cancelNote ? 'Listed: ' + bk.cancelNote : '' };
    return `<div class="card">${ph ? `<div class="ct"><span>${OA.icon('phone')} ${esc(ph)}</span></div>${tl ? `<a class="btn gold block" href="${esc(tl)}">Call now</a>` : ''}` : '<div class="alert"><b class="t">No phone on file</b>Check with the source: look on the official page or booking site, or type a number in the booking record.</div>'}
      <p class="sm dim">Tick each question as you ask it. Write down the name of the person and what they said.</p>
      ${QS.map(q => `<label class="chk" style="align-items:flex-start"><input type="checkbox" data-bind="${P}.qs.${q[0]}" data-type="bool" ${r.qs && r.qs[q[0]] ? 'checked' : ''}><span>${esc(q[1])}${listed[q[0]] ? `<br><span class="xs dim">${esc(listed[q[0]])}</span>` : ''}</span></label>`).join('')}
      <textarea class="in" rows="4" data-bind="${P}.callNotes" placeholder="Spoke with… said…">${esc(r.callNotes || '')}</textarea>
      <button class="btn gold block" data-act="csCalledClose" data-id="${esc(id)}">Save: I called today</button></div>`;
  }

  /* ---------- export ---------- */
  const csvCell = v => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function csv() {
    const s = SV(), inc = s.inclConf, head = ['Name', 'Area', 'State', 'Status', 'Arrival', 'Nights', 'Site', 'Total cost', 'Rating', 'Last confirm call', 'Note', 'Family notes'].concat(inc ? ['Confirmation'] : []);
    const rows = s.list.map(e => { const r = rec(e.id), c = camp(e.id), last = (r.calls || []).slice(-1)[0]; return [e.name, c && c.parent, stateOf(e), stLabel(e.status || 'interested'), r.from, r.nights, r.site, r.cost, r.rating, last ? OA.dkey(new Date(last)) : '', e.note, r.fam].concat(inc ? [r.conf] : []); });
    return [head].concat(rows).map(r => r.map(csvCell).join(',')).join('\r\n');
  }
  function textExport() {
    const s = SV(), L = ['My saved camps (' + OA.dkey() + ')'];
    STATUS.forEach(st => { const g = s.list.filter(e => (e.status || 'interested') === st[0]); if (!g.length) return; L.push('', st[1].toUpperCase()); g.forEach(e => { const r = rec(e.id); L.push('- ' + e.name + (stateOf(e) ? ' (' + stateOf(e) + ')' : '') + (r.from ? ', ' + r.from + (num(r.nights) ? ' for ' + r.nights + ' nights' : '') : '') + (r.rating ? ', ' + r.rating + '/5' : '') + (e.note ? ': ' + e.note : '') + (s.inclConf && r.conf ? ' [conf ' + r.conf + ']' : '')); }); });
    if (s.wish.length) { L.push('', 'WISH LIST'); s.wish.forEach(w => L.push('- ' + w.text)); }
    return L.join('\n');
  }

  /* ---------- actions ---------- */
  OA.act({
    csTouch() { touch(); },
    csStatus(el) { touch(); if (OA.sheetOpen()) { /* keep the sheet; list redraws when it closes */ } },
    csFilter(el) { SV().filter = el.dataset.f; OA.saveSoon(); OA.render(true); },
    csOpen(el) { openRec(el.dataset.id); },
    csAdd() {
      OA.sheet('Add a camp', `<label class="fl">Name<input class="in" id="csn" placeholder="Campground name"></label><div class="two"><label class="fl">State<input class="in" id="css" maxlength="2" placeholder="CA" autocapitalize="characters"></label><label class="fl">Phone<input class="in" id="csp" type="tel"></label></div>
        <label class="fl">Note<input class="in" id="csq" placeholder="Why you like it"></label><button class="btn gold block" data-act="csAddDo">Save camp</button>`);
    },
    csAddDo() {
      const n = (OA.$('#csn') || {}).value || ''; if (!n.trim()) { OA.toast('Type the camp name.'); return; }
      const id = 'm-' + OA.uid(), st = ((OA.$('#css') || {}).value || '').trim().toUpperCase().slice(0, 2), ph = ((OA.$('#csp') || {}).value || '').trim();
      SV().list.unshift({ id, name: n.trim(), ts: Date.now(), note: ((OA.$('#csq') || {}).value || '').trim(), status: 'interested', state: st });
      if (ph || st) SV().rec[rk(id)] = { phone: ph, state: st };
      touch(); OA.closeSheet(); OA.toast('Saved.');
    },
    csCall(el) { OA.sheet('Call to verify', callHTML(el.dataset.id)); },
    csCalled(el) { const id = el.dataset.id; const k = rk(id), r = SV().rec[k] = SV().rec[k] || {}; r.calls = r.calls || []; r.calls.push(Date.now()); touch(); OA.redrawSheet(recHTML(id)); OA.toast('Logged.'); },
    csCalledClose(el) { const id = el.dataset.id; const k = rk(id), r = SV().rec[k] = SV().rec[k] || {}; r.calls = r.calls || []; r.calls.push(Date.now()); touch(); OA.closeSheet(); OA.redrawSheet(recHTML(id)); loadPhotos(id); OA.toast('Logged.'); },
    csCallDel(el) { const id = el.dataset.id, r = rec(id); if (r.calls) r.calls.splice(+el.dataset.i, 1); touch(); OA.redrawSheet(recHTML(id)); loadPhotos(id); },
    csRate(el) { const id = el.dataset.id, k = rk(id), r = SV().rec[k] = SV().rec[k] || {}; r.rating = r.rating === +el.dataset.n ? 0 : +el.dataset.n; touch(); OA.redrawSheet(recHTML(id)); loadPhotos(id); },
    csPhoto: async el => { const id = el.dataset.id, e = entry(id) || {}; const p = await OA.photo.pick({ tag: 'camp:' + id, note: e.name || '' }); if (p) { OA.toast('Photo saved.'); loadPhotos(id); } },
    csPhotoDel: async el => { if (!await OA.confirm('Delete this photo?', 'Delete')) return; await OA.photo.del(el.dataset.pid); loadPhotos(el.dataset.id); },
    csToTrip(el) { if (CPo.plan && CPo.plan.addCamp) { CPo.plan.addCamp(el.dataset.id); OA.toast('Added to your trip.'); OA.closeAllSheets(); OA.go('plan'); } else OA.toast('The trip planner is not available.'); },
    csRemove: async el => { const id = el.dataset.id, e = entry(id); if (!e) return; if (!await OA.confirm('Remove ' + e.name + ' from your saved camps? Its booking record on this phone is deleted too.', 'Remove')) return; const s = SV(); s.list = s.list.filter(x => x.id !== id); delete s.rec[rk(id)]; touch(); OA.closeSheet(); },
    csWishAdd() { const i = OA.$('#cswish'), v = i ? i.value.trim() : ''; if (!v) { OA.toast('Type a place first.'); return; } SV().wish.push({ id: OA.uid(), text: v }); touch(); OA.render(true); },
    csWishDel(el) { const s = SV(); s.wish = s.wish.filter(w => w.id !== el.dataset.id); touch(); OA.render(true); },
    csCsv() { OA.download('campica-saved-' + OA.dkey() + '.csv', 'text/csv', csv()); OA.toast('CSV saved.'); },
    csText() { return OA.share.send({ title: 'My saved camps', text: textExport() }); }
  });

  /* ---------- household summary (shape: campica { next:{place,from,to,nights}, saved, events:[{t,d,kind:'camp'}] }) ---------- */
  OA.publisher = () => {
    const out = { saved: SV().list.length, events: [] };
    try {
      const pl = CPo.plan;
      if (pl) {
        const nt = pl.nextTrip && pl.nextTrip();
        if (nt) { const s0 = nt.stays && nt.stays[0]; out.next = { place: s0 ? s0.name : (nt.where || nt.name), from: nt.startDate, to: pl.tripEnd(nt), nights: pl.nightsOf(nt) }; }
        out.events = pl.events ? pl.events() : [];
      }
    } catch (e) { }
    return out;
  };
  OA.on('render', pubSoon);
  CPo.saved = { open: openRec, list: () => SV().list };
})();
