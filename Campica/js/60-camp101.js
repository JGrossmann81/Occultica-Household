/* Campica: Camp 101 tab. Offline how-to library for families (window.CAMP101.items from data/camp101.js).
   State: S.c101 = {cat, q, saved, kids, fav:{id:1}, chk:{id:{stepIndex:1}}, shown}.
   Public: CP.camp101 = {open(id), items(), byId(id), cats()}. All text goes through OA.esc. Works with no signal. */
window.CP = window.CP || {};
(function () {
  'use strict';
  const esc = OA.esc, CP = window.CP;
  window.CAMP101 = window.CAMP101 || { items: [] };
  const CATS = [
    { id: 'first', label: 'First trip', icon: 'tent', blurb: 'Checklist, picking a campground, arriving before dark.' },
    { id: 'setup', label: 'Setting up', icon: 'pin', blurb: 'Tent site, pitching, stakes, warm sleep, camp layout.' },
    { id: 'cook', label: 'Fire and cooking', icon: 'flame', blurb: 'Fire rules, putting it out, stoves, food safety, cleanup.' },
    { id: 'meals', label: 'Camp meals', icon: 'fork', blurb: 'Easy family meals, foil dinners, breakfasts and treats.' },
    { id: 'kids', label: 'Kids', icon: 'star', blurb: 'Camp rules, lost-child plan, games, stars, rainy days.' },
    { id: 'wild', label: 'Wildlife', icon: 'bear', blurb: 'Bears, raccoons, ticks, snakes, bugs, itchy plants.' },
    { id: 'safety', label: 'Weather and safety', icon: 'cloud', blurb: 'Lightning, heat, cold, floods, smoke, first aid, getting help.' },
    { id: 'lnt', label: 'Leave No Trace', icon: 'leaf', blurb: 'Principles, quiet hours, camping with dogs.' },
    { id: 'rv', label: 'RV and trailer', icon: 'car', blurb: 'Hookups, levelling, tanks, backing, propane.' },
    { id: 'gear', label: 'Gear and care', icon: 'tool', blurb: 'What to buy first, tent care, cleaning, storage.' }
  ];
  const catOf = id => CATS.find(c => c.id === id) || { id, label: id, icon: 'book', blurb: '' };
  OA.defaults({ c101: { cat: '', q: '', saved: false, kids: false, fav: {}, chk: {}, shown: 40 } });
  const SS = () => OA.S.c101;

  /* ---------- index ---------- */
  let IDX = null, IDXN = -1;
  function idx() {
    const its = (window.CAMP101 && CAMP101.items) || [];
    if (IDX && IDXN === its.length) return IDX;
    const by = {}, list = [];
    its.forEach(it => {
      if (!it || !it.id || by[it.id]) return;
      ['steps', 'tips', 'warn', 'seeAlso', 'src'].forEach(k => { if (!Array.isArray(it[k])) it[k] = []; });
      it._t = String(it.title || '').toLowerCase();
      it._h = [it.title, catOf(it.cat).label, it.steps.join(' '), (it.ing || []).join(' '), it.kids || '', it.tips.join(' ')].join(' ').toLowerCase();
      by[it.id] = it; list.push(it);
    });
    IDX = { by, list }; IDXN = its.length; return IDX;
  }
  const byId = id => idx().by[id] || null;
  function search(q) {
    const toks = q.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean); if (!toks.length) return [];
    const out = [];
    idx().list.forEach(it => {
      let sc = 0;
      for (const t of toks) { if (it._h.indexOf(t) < 0) return; sc += (it._t.indexOf(t) >= 0 ? 5 : 0) + 1; }
      out.push([sc, it]);
    });
    return out.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).map(x => x[1]);
  }
  const safeUrl = u => (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : '';

  /* ---------- tab ---------- */
  const introHtml = `<p>Camp 101 is a <b>reference, not training</b>. It gives general, conservative family-camping guidance in plain words.</p>
    <ul class="ls"><li>Rules and conditions change. <b>Park and campground rules, fire restrictions and the rangers always win.</b></li>
    <li>Take a first-aid and CPR course, and tell someone your plan.</li>
    <li>If someone is in danger, call 911 first.</li></ul>`;
  OA.tab({
    id: 'camp101', label: 'Camp 101', icon: 'book', order: 50,
    render(el) {
      el.innerHTML = OA.header('Camp 101', 'How-to guides for families, offline') + '<div id="c1body"></div>';
      fillTop(OA.$('#c1body', el));
    }
  });
  function fillTop(root) {
    const s = SS(), all = idx().list;
    const counts = {}; all.forEach(it => counts[it.cat] = (counts[it.cat] || 0) + 1);
    const nfav = all.filter(it => s.fav[it.id]).length;
    root.innerHTML = `<input class="in" id="c1q" type="search" inputmode="search" autocomplete="off" placeholder="Search: fire, bear, tent, pancakes…" value="${esc(s.q || '')}" aria-label="Search Camp 101">
      <div class="chips c1-chips" role="tablist">
        <button class="chip ${!s.cat && !s.saved ? 'on' : ''}" data-act="c1Cat" data-id="">All (${all.length})</button>
        <button class="chip ${s.saved ? 'on' : ''}" data-act="c1Saved">★ Saved (${nfav})</button>
        ${CATS.filter(c => counts[c.id]).map(c => `<button class="chip ${s.cat === c.id && !s.saved ? 'on' : ''}" data-act="c1Cat" data-id="${c.id}">${esc(c.label)} (${counts[c.id]})</button>`).join('')}
      </div><div id="c1res"></div>`;
    fillList(root);
  }
  function fillList(root) {
    const out = OA.$('#c1res', root || document); if (!out) return;
    const s = SS(), q = (s.q || '').trim(), all = idx().list;
    if (!all.length) { out.innerHTML = '<div class="card"><p>The library did not load. Close and reopen the app.</p></div>'; return; }
    let L, head = '';
    if (q) { L = search(q); if (s.cat) L = L.filter(it => it.cat === s.cat); if (s.saved) L = L.filter(it => s.fav[it.id]); head = `<div class="sm dim">${L.length} result${L.length === 1 ? '' : 's'} for “${esc(q)}”</div>`; }
    else if (s.saved) L = all.filter(it => s.fav[it.id]);
    else if (s.cat) { L = all.filter(it => it.cat === s.cat); head = `<p class="sm dim">${esc(catOf(s.cat).blurb)}</p>`; }
    else L = null;
    if (L === null) {
      // home: category tiles plus the first-timer starters
      const counts = {}; all.forEach(it => counts[it.cat] = (counts[it.cat] || 0) + 1);
      const start = ['first-checklist', 'fire-out', 'wild-bear-food', 'kids-lost-plan', 'weather-lightning', 'cook-food-safety'].map(byId).filter(Boolean);
      out.innerHTML = `<h2>Start here</h2><div class="card">${start.map(rowHtml).join('')}</div>
        <h2>Topics</h2><div class="c1-grid">${CATS.filter(c => counts[c.id]).map(c => `<button class="c1-tile" data-act="c1Cat" data-id="${c.id}">${OA.icon(c.icon, 'lg')}<b>${esc(c.label)}</b><span>${counts[c.id]} guides</span></button>`).join('')}</div>
        <p class="foot">A reference, not training. Rules and conditions change: check with the park or campground.</p>`;
      return;
    }
    if (!s.saved && !q && s.cat) L = L.slice().sort((a, b) => a.title.localeCompare(b.title));
    const shown = L.slice(0, s.shown || 40);
    out.innerHTML = head + (L.length ? `<div class="card">${shown.map(rowHtml).join('')}</div>${L.length > shown.length ? `<button class="btn block" data-act="c1More">Show more (${L.length - shown.length})</button>` : ''}`
      : `<div class="card"><p>${s.saved ? 'Nothing saved yet. Open a guide and tap “Save”.' : 'Nothing matched. Try one word, like “fire”, “bear” or “tent”.'}</p>${q ? '<button class="btn" data-act="c1ClearQ">Clear search</button>' : ''}</div>`);
  }
  function rowHtml(it) {
    const s = SS();
    return `<div class="li" data-act="c1Open" data-id="${esc(it.id)}" role="button" tabindex="0"><span class="ic">${OA.icon(it.icon || catOf(it.cat).icon)}</span><span class="tx"><b>${esc(it.title)}</b><span>${esc(catOf(it.cat).label)}${it.minutes ? ' · ' + esc(it.minutes) + ' min' : ''}</span></span><span class="end">${s.fav[it.id] ? '<span class="gold">★</span>' : ''}</span></div>`;
  }
  let qT = null;
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'c1q') return;
    clearTimeout(qT); const v = e.target.value; qT = setTimeout(() => { const s = SS(); s.q = v; s.shown = 40; OA.saveSoon(); fillList(document); }, 120);
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute && e.target.getAttribute('data-act') === 'c1Open' && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); } });

  /* ---------- item sheet ---------- */
  function stopSpeak() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
  function itemHtml(it) {
    const s = SS(), cat = catOf(it.cat), fav = !!s.fav[it.id], kids = !!s.kids, ck = s.chk[it.id] || {};
    const done = Object.keys(ck).length, see = it.seeAlso.map(byId).filter(Boolean);
    const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    let body;
    if (kids) {
      body = `<div class="c1-kid">${it.kids ? `<p class="c1-kp">${esc(it.kids)}</p>` : '<p class="c1-kp dim">Grown-ups: read the steps out loud together.</p>'}
        <ol class="c1-ks">${it.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
        ${it.warn.length ? `<div class="alert"><b class="t">Grown-ups, careful</b><ul class="ls">${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}`;
    } else {
      body = `${it.ing && it.ing.length ? `<h3>You need</h3><ul class="ls">${it.ing.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <div class="row between mid"><h3 style="margin:10px 0 0">Steps</h3>${done ? `<button class="lnk" data-act="c1ClearChk" data-id="${esc(it.id)}">Clear ticks (${done}/${it.steps.length})</button>` : ''}</div>
        <div class="c1-steps">${it.steps.map((t, i) => `<button class="c1-step ${ck[i] ? 'done' : ''}" data-act="c1Chk" data-id="${esc(it.id)}" data-i="${i}" aria-pressed="${ck[i] ? 'true' : 'false'}"><span class="c1-box">${ck[i] ? '✓' : i + 1}</span><span class="c1-st">${esc(t)}</span></button>`).join('')}</div>
        ${it.warn.length ? `<div class="alert"><b class="t">Careful</b><ul class="ls">${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
        ${it.tips.length ? `<div class="card inner tip"><div class="ct"><span>Tips</span></div><ul class="ls">${it.tips.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}`;
    }
    const srcs = it.src.map(safeUrl).filter(Boolean);
    return `<div class="c1-full"><h2 class="big">${esc(it.title)}</h2>
      <div><span class="tag a">${esc(cat.label)}</span>${it.minutes ? `<span class="tag">${esc(it.minutes)} min</span>` : ''}</div>
      <div class="row wrap"><button class="btn" data-act="c1Fav" data-id="${esc(it.id)}">${fav ? '★ Saved' : '☆ Save'}</button><button class="btn ${kids ? 'gold' : ''}" data-act="c1Kids" data-id="${esc(it.id)}" aria-pressed="${kids}">${kids ? 'Kids: on' : 'For kids'}</button>${kids && canSpeak ? `<button class="btn" data-act="c1Speak" data-id="${esc(it.id)}">Read aloud</button>` : ''}</div>
      ${body}
      ${see.length ? `<h3>See also</h3><div class="card inner">${see.map(x => `<div class="li" data-act="c1Open" data-id="${esc(x.id)}" data-replace="1" role="button" tabindex="0"><span class="ic">${OA.icon(x.icon || catOf(x.cat).icon)}</span><span class="tx"><b>${esc(x.title)}</b></span></div>`).join('')}</div>` : ''}
      <div class="row"><button class="btn" data-act="c1Share" data-id="${esc(it.id)}">Share</button><button class="btn" data-act="c1Print" data-id="${esc(it.id)}">Print this card</button></div>
      <div class="sm dim" style="margin-top:12px"><b>Sources</b>${srcs.length ? `<ul class="ls">${srcs.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a></li>`).join('')}</ul><div class="xs">Written in our own words, in line with these agencies’ public guidance. Links need signal. Check with the park or campground for local rules.</div>` : '<div class="xs">General camping practice with no single source. Check with the park or campground for local rules.</div>'}</div>
      <p class="foot">A reference, not training.</p></div>`;
  }
  function plainText(it) {
    return it.title + '\n\n' + (it.ing && it.ing.length ? 'You need:\n- ' + it.ing.join('\n- ') + '\n\n' : '') + it.steps.map((t, i) => (i + 1) + '. ' + t).join('\n') +
      (it.warn.length ? '\n\nCareful:\n- ' + it.warn.join('\n- ') : '') + (it.tips.length ? '\n\nTips:\n- ' + it.tips.join('\n- ') : '') + '\n\n(Campica, a reference not training)';
  }
  function printItem(it) {
    let d = document.getElementById('c1print'); if (!d) { d = document.createElement('div'); d.id = 'c1print'; document.body.appendChild(d); }
    d.innerHTML = `<h1>${esc(it.title)}</h1>${it.ing && it.ing.length ? `<h3>You need</h3><ul>${it.ing.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<ol>${it.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` +
      (it.warn.length ? `<h3>Careful</h3><ul>${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '') + (it.tips.length ? `<h3>Tips</h3><ul>${it.tips.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '') + `<p><i>Campica. A reference, not training.</i></p>`;
    document.body.classList.add('c1printing');
    const done = () => { document.body.classList.remove('c1printing'); d.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
  }
  function openItem(id, replace) {
    const it = byId(id); if (!it) return OA.toast('That guide is not available.');
    stopSpeak();
    if (replace && OA.sheetOpen()) { OA.redrawSheet(itemHtml(it)); OA.$('#sheet').scrollTop = 0; } else OA.sheet(catOf(it.cat).label, itemHtml(it), { onClose: stopSpeak });
  }
  const redraw = id => { const it = byId(id); if (it) OA.redrawSheet(itemHtml(it)); };

  OA.act({
    c1Cat(el) { const s = SS(); s.cat = el.dataset.id || ''; s.saved = false; s.shown = 40; OA.saveSoon(); fillTop(OA.$('#c1body')); window.scrollTo(0, 0); },
    c1Saved() { const s = SS(); s.saved = !s.saved; if (s.saved) s.cat = ''; s.shown = 40; OA.saveSoon(); fillTop(OA.$('#c1body')); },
    c1More() { SS().shown = (SS().shown || 40) + 40; fillList(document); },
    c1ClearQ() { SS().q = ''; OA.saveSoon(); fillTop(OA.$('#c1body')); },
    async c1Open(el) {
      if (!OA.S.gates['c101-intro'] && !el.dataset.replace) { const ok = await OA.gate('c101-intro', 'Before you read Camp 101', introHtml, 'Open the guide'); if (!ok) return; }
      openItem(el.dataset.id, !!el.dataset.replace);
    },
    c1Fav(el) { const s = SS(), id = el.dataset.id; if (s.fav[id]) delete s.fav[id]; else s.fav[id] = 1; OA.save(); redraw(id); },
    c1Kids(el) { const s = SS(); s.kids = !s.kids; stopSpeak(); OA.save(); redraw(el.dataset.id); },
    c1Chk(el) { const s = SS(), id = el.dataset.id, i = +el.dataset.i; const ck = s.chk[id] = s.chk[id] || {}; if (ck[i]) delete ck[i]; else ck[i] = 1; if (!Object.keys(ck).length) delete s.chk[id]; OA.saveSoon(); redraw(id); },
    async c1ClearChk(el) { if (!await OA.confirm('Clear all ticks on this guide?', 'Clear')) return; delete SS().chk[el.dataset.id]; OA.save(); redraw(el.dataset.id); },
    c1Share(el) { const it = byId(el.dataset.id); if (it) OA.share.send({ title: it.title, text: plainText(it) }); },
    c1Print(el) { const it = byId(el.dataset.id); if (it) printItem(it); },
    c1Speak(el) {
      const it = byId(el.dataset.id); if (!it) return;
      try {
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
        const u = new SpeechSynthesisUtterance([it.title, it.kids || ''].concat(it.steps.map((t, i) => 'Step ' + (i + 1) + '. ' + t)).join('. ')); u.rate = 0.9; speechSynthesis.speak(u);
      } catch (e) { OA.toast('Reading aloud is not available on this phone.'); }
    }
  });

  CP.camp101 = { open: id => openItem(id), items: () => idx().list, byId, cats: () => CATS };
})();
