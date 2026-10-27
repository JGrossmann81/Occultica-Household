/* Backpackica: Survive tab. Offline field manual: Now (quick-launch), Manual (library), Tools (from 52-tools.js).
   Content comes from window.SURVIVE.items (data/survive-*.js). Other modules add sections with BP.surviveSections.push({id,label,order,render(el)}).
   Public: BP.survive = {open(id), openSituation(id), items(), byId(id), cats()}. */
window.BP = window.BP || { todayCards: [] };
(function () {
  'use strict';
  const esc = OA.esc, G = OA.geo;
  BP.surviveSections = BP.surviveSections || [];
  window.SURVIVE = window.SURVIVE || { items: [] };

  SURVIVE.cats = [
    { id: 'fire', label: 'Fire', icon: 'flame', blurb: 'Site, fuel, lighting, wet weather, putting it out, rules.', order: 10 },
    { id: 'shelter', label: 'Shelter', icon: 'tent', blurb: 'Where to sleep, tarps, bivies, insulation, storms, night.', order: 20 },
    { id: 'water', label: 'Water', icon: 'drop', blurb: 'Finding it, treating it, dehydration.', order: 30 },
    { id: 'nav', label: 'Navigation', icon: 'compass', blurb: 'Map, compass, trail markers, lost, phone GPS.', order: 40 },
    { id: 'signal', label: 'Signaling', icon: 'bolt', blurb: 'Whistle, mirror, ground signals, calling 911, PLBs.', order: 50 },
    { id: 'camp', label: 'Camp and Leave No Trace', icon: 'tree', blurb: 'Campsites, waste, food storage, cooking.', order: 60 },
    { id: 'medical', label: 'Medical', icon: 'first', blurb: 'Wilderness first aid and when to get help.', order: 70 },
    { id: 'wildlife', label: 'Wildlife', icon: 'bear', blurb: 'Bears, snakes, ticks and other animals.', order: 80 },
    { id: 'weather', label: 'Weather', icon: 'cloud', blurb: 'Heat, cold, lightning, wind, reading the sky.', order: 90 },
    { id: 'lost', label: 'Lost and overdue', icon: 'pin', blurb: 'What to do and what rescuers need.', order: 100 },
    { id: 'skills', label: 'Skills and knots', icon: 'tool', blurb: 'Knots, river crossings and trail craft.', order: 110 },
    { id: 'gear', label: 'Gear repair', icon: 'gear', blurb: 'Field fixes for poles, pads, stoves, boots.', order: 120 },
    { id: 'forage', label: 'Foraging', icon: 'leaf', blurb: 'Plant guide with the dangerous lookalikes first.', order: 130 }
  ];
  OA.defaults({ survive: { sec: 'now', fav: {}, practised: {}, recent: [], cat: '', q: '' } });
  const SS = () => { const s = OA.S.survive; return s; };

  /* ---------- index (built lazily, rebuilt if items are added) ---------- */
  let IDX = null, IDXN = -1;
  function idx() {
    const its = SURVIVE.items;
    if (IDX && IDXN === its.length) return IDX;
    const by = {}, list = [];
    its.forEach(it => {
      if (!it || !it.id || by[it.id]) return;
      it.steps = it.steps || []; it.warn = it.warn || []; it.whenHelp = it.whenHelp || []; it.tags = it.tags || []; it.seeAlso = it.seeAlso || []; it.src = it.src || [];
      it._h = [it.title, it.summary, it.tags.join(' '), it.steps.map(s => (s.t || '') + ' ' + (s.d || '')).join(' ')].join(' ').toLowerCase();
      it._t = (it.title || '').toLowerCase(); it._g = it.tags.join(' ').toLowerCase();
      by[it.id] = it; list.push(it);
    });
    IDX = { by, list }; IDXN = its.length; return IDX;
  }
  const byId = id => idx().by[id] || null;
  const catOf = id => SURVIVE.cats.find(c => c.id === id) || { id, label: id, icon: 'book', blurb: '', order: 999 };
  function search(q) {
    const toks = q.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean); if (!toks.length) return [];
    const out = [];
    idx().list.forEach(it => {
      let sc = 0;
      for (const t of toks) { if (it._h.indexOf(t) < 0) return; sc += (it._t.indexOf(t) >= 0 ? 5 : 0) + (it._g.indexOf(t) >= 0 ? 3 : 0) + 1; }
      out.push([sc, it]);
    });
    return out.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).map(x => x[1]);
  }

  /* ---------- situations (Now panel) ---------- */
  const SITS = [
    { id: 'lost', label: "I'm lost", icon: 'compass', ids: ['nav-lost-now'], cats: ['lost'], tags: ['lost', 'disoriented'] },
    { id: 'injured', label: "I'm injured", icon: 'first', ids: ['injured-now'], cats: ['medical'], tags: ['injured', 'injury', 'bleeding', 'first aid'], not: ['cold', 'hypothermia', 'heat', 'hot', 'lightning', 'storm', 'lost', 'bear', 'wildlife'] },
    { id: 'cold', label: "I'm cold or wet", icon: 'snow', ids: ['shelter-quick'], tags: ['cold', 'hypothermia', 'wet', 'freezing', 'shivering'] },
    { id: 'hot', label: "I'm too hot", icon: 'sun', ids: ['weather-hot-now'], tags: ['hot', 'heat', 'heat stroke', 'heat exhaustion', 'overheated'] },
    { id: 'water', label: 'No water', icon: 'drop', ids: ['water-none-now'], tags: ['no water', 'thirst'] },
    { id: 'storm', label: 'Storm coming', icon: 'cloud', ids: ['shelter-storm'], tags: ['storm', 'lightning', 'thunder', 'flood', 'flash flood'] },
    { id: 'night', label: 'Night is falling', icon: 'moon', ids: ['shelter-night'], tags: ['night', 'dark', 'dusk', 'sunset'] },
    { id: 'wildlife', label: 'Wildlife encounter', icon: 'bear', ids: ['camp-wildlife-now'], cats: ['wildlife'], tags: ['bear', 'snake', 'lion', 'moose'] },
    { id: 'signal', label: 'I need to signal for help', icon: 'bolt', ids: ['signal-help-now', 'signal-911'], cats: ['signal'], tags: ['signal', 'sos', 'rescue'] },
    { id: 'river', label: 'River crossing', icon: 'water', ids: ['nav-river'], tags: ['river', 'ford', 'stream crossing'] }
  ];
  function sitItems(s) {
    const L = idx().list.filter(it => {
      if (it.level !== 'now') return false;
      if (s.ids.indexOf(it.id) >= 0) return true;
      if (s.not && it.tags.some(t => s.not.indexOf(t) >= 0)) return false;
      return (s.cats && s.cats.indexOf(it.cat) >= 0) || it.tags.some(t => s.tags.indexOf(t) >= 0);
    });
    return L.sort((a, b) => (s.ids.indexOf(a.id) < 0 ? 99 : s.ids.indexOf(a.id)) - (s.ids.indexOf(b.id) < 0 ? 99 : s.ids.indexOf(b.id)));
  }

  /* ---------- sections ---------- */
  function sections() { return BP.surviveSections.slice().sort((a, b) => (a.order || 50) - (b.order || 50)); }
  BP.surviveSections.push({ id: 'now', label: 'Now', order: 10, render: renderNow });
  BP.surviveSections.push({ id: 'manual', label: 'Manual', order: 20, render: renderManual });

  OA.tab({
    id: 'survive', label: 'Survive', icon: 'first', order: 50,
    render(el) {
      const secs = sections(), s = SS();
      const cur = secs.find(x => x.id === s.sec) || secs[0];
      el.innerHTML = OA.header('Survive', 'Offline field manual') +
        `<div class="chips wrap sv-secs" role="tablist">${secs.map(x => `<button class="chip ${x.id === cur.id ? 'on' : ''}" role="tab" data-act="svSec" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div><div id="svbody"></div>`;
      const body = OA.$('#svbody', el);
      try { cur.render(body); } catch (e) { console.error(e); body.innerHTML = `<div class="alert danger"><b class="t">This section hit a problem</b>${esc(e.message)}</div>`; }
    }
  });

  /* ---------- NOW ---------- */
  function renderNow(el) {
    const have = idx().list.length;
    el.innerHTML = `
      <section class="card hot sv-em"><div class="ct"><span>${OA.icon('alert')} Emergency</span></div>
        <div class="row" style="margin-top:0"><a class="btn danger sv-call" href="tel:911">${OA.icon('phone')} Call 911</a><button class="btn" data-act="svCoords">${OA.icon('pin')} My coordinates</button></div>
        <p class="sm" style="margin:8px 0 6px">No luck with a call? Try a text to 911: it needs less signal, but is not available everywhere (and may not work when roaming). Stay on the line until told otherwise.</p>
        <div class="alert" style="margin:6px 0 0"><b class="t">Satellite messenger or PLB</b>If you carry a satellite messenger or PLB, press its SOS button for a life-threatening emergency.</div>
      </section>
      <h2 class="big">What is happening?</h2>
      <div class="sv-grid">${SITS.map((s, i) => `<button class="sv-sit" data-act="svSit" data-id="${s.id}" ${i === 0 ? 'data-smoke' : ''}>${OA.icon(s.icon, 'lg')}<span>${esc(s.label)}</span></button>`).join('')}</div>
      <p class="sm dim" style="margin-top:12px">${have ? '' : 'The manual has not loaded. '}Each button opens big, one-step-at-a-time instructions that work with no signal. This is a reference, not training: take a wilderness first-aid course and tell someone your plan.</p>
      <div class="row"><button class="btn" data-act="svSec" data-id="manual">Open the manual</button></div>`;
  }

  /* ---------- MANUAL ---------- */
  let limit = 30;
  function renderManual(el) {
    const s = SS();
    el.innerHTML = `<input class="in" id="svq" type="search" inputmode="search" autocomplete="off" placeholder="Search the manual: fire, water, bear, knot…" value="${esc(s.q || '')}" aria-label="Search the manual"><div id="svres"></div>`;
    fillManual(el);
  }
  function fillManual(root) {
    const out = OA.$('#svres', root || document); if (!out) return;
    const s = SS(), q = (s.q || '').trim();
    if (q) {
      const r = search(q), shown = r.slice(0, limit);
      out.innerHTML = `<div class="sm dim">${r.length} result${r.length === 1 ? '' : 's'} for “${esc(q)}”</div>` +
        (r.length ? `<div class="card">${shown.map(rowHtml).join('')}</div>${r.length > shown.length ? `<button class="btn block" data-act="svMore">Show more (${r.length - shown.length})</button>` : ''}` : `<div class="card"><p>Nothing matched. Try one word, like “water”, “knot” or “cold”.</p><button class="btn" data-act="svClearQ">Clear search</button></div>`);
      return;
    }
    if (s.cat) {
      const c = catOf(s.cat), L = idx().list.filter(it => it.cat === s.cat).sort((a, b) => (a.level === b.level ? 0 : a.level === 'now' ? -1 : 1) || a.title.localeCompare(b.title));
      out.innerHTML = `<div class="row mid between"><button class="mini" data-act="svCatClear">← All topics</button><span class="gold b">${esc(c.label)}</span></div><p class="sm dim">${esc(c.blurb)}</p>` +
        (L.length ? `<div class="card">${L.map(rowHtml).join('')}</div>` : `<div class="card"><p>No entries in this topic yet.</p></div>`);
      return;
    }
    const all = idx().list, done = all.filter(it => s.practised[it.id]).length, pct = all.length ? Math.round(done / all.length * 100) : 0;
    const favs = all.filter(it => s.fav[it.id]), rec = s.recent.map(byId).filter(Boolean).slice(0, 5);
    const counts = {}, prac = {}; all.forEach(it => { counts[it.cat] = (counts[it.cat] || 0) + 1; if (s.practised[it.id]) prac[it.cat] = (prac[it.cat] || 0) + 1; });
    const tiles = SURVIVE.cats.slice().sort((a, b) => a.order - b.order).filter(c => counts[c.id] || (c.id === 'forage' && window.BP && BP.forage && BP.forage.open)).map(c => c.id === 'forage'
      ? `<button class="sv-tile" data-act="svForage">${OA.icon(c.icon, 'lg')}<b>${esc(c.label)}</b><span>${esc(c.blurb)}</span></button>`
      : `<button class="sv-tile" data-act="svCat" data-id="${c.id}">${OA.icon(c.icon, 'lg')}<b>${esc(c.label)}</b><span>${counts[c.id]} entries${prac[c.id] ? ' · ' + prac[c.id] + ' practised' : ''}</span></button>`).join('');
    out.innerHTML = `
      <div class="card"><div class="meter"><div class="mt"><b>Skills I have actually tried</b><span>${done} of ${all.length}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div><div class="xs dim">Reading is not the same as doing. Open an entry and tap “Mark as practised” once you have tried the skill for real, at home or on a trail.</div></div>
      ${favs.length ? `<h2>Saved</h2><div class="card">${favs.map(rowHtml).join('')}</div>` : ''}
      ${rec.length ? `<h2>Recently read</h2><div class="card">${rec.map(rowHtml).join('')}</div>` : ''}
      <h2>Topics</h2><div class="sv-grid tiles">${tiles}</div>
      <p class="foot">A reference, not training. Take a wilderness first-aid course. Tell someone your plan and when to worry.</p>`;
  }
  function rowHtml(it) {
    const s = SS();
    return `<div class="li" data-act="svOpen" data-id="${esc(it.id)}" role="button" tabindex="0"><span class="ic">${OA.icon(it.icon || catOf(it.cat).icon)}</span><span class="tx"><b>${esc(it.title)}</b><span>${esc(catOf(it.cat).label)}${it.time ? ' · ' + esc(it.time) : ''}</span></span><span class="end">${it.level === 'now' ? '<span class="tag r">Act now</span>' : ''}${s.fav[it.id] ? '<span class="gold">★</span>' : ''}${s.practised[it.id] ? '<span class="tag g">tried</span>' : ''}</span></div>`;
  }
  let qT = null;
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'svq') return;
    clearTimeout(qT); const v = e.target.value; qT = setTimeout(() => { limit = 30; SS().q = v; OA.saveSoon(); fillManual(document); }, 120);
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute && e.target.getAttribute('data-act') === 'svOpen' && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); } });

  /* ---------- step-by-step reader (big, dark, gloves-friendly) ---------- */
  let rd = { id: null, p: 0, ids: [] };
  function readerHtml() {
    const it = byId(rd.id); if (!it) return '<p>This entry is not available.</p>';
    const n = it.steps.length, last = rd.p >= n, pct = n ? Math.round(Math.min(rd.p, n) / n * 100) : 100;
    let body;
    if (!last) {
      const st = it.steps[rd.p];
      body = `${rd.p === 0 ? `<p class="sv-sum">${esc(it.summary)}</p>` : ''}<div class="sv-step"><div class="sv-num">${rd.p + 1}</div><div class="sv-t">${esc(st.t)}</div>${st.d ? `<div class="sv-d">${esc(st.d)}</div>` : ''}</div>`;
    } else {
      const more = rd.ids.filter(i => i !== it.id).map(byId).filter(Boolean);
      body = `<div class="sv-step done"><div class="sv-t">${n ? 'Steps done' : esc(it.summary)}</div></div>${navHtml(it, last)}
        ${it.warn.length ? `<div class="alert"><b class="t">Careful</b><ul class="ls">${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
        ${it.whenHelp.length ? `<div class="alert danger"><b class="t">Get help or turn back if</b><ul class="ls">${it.whenHelp.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
        ${more.length ? `<h3 class="sv-h">Also for this situation</h3>${more.map(m => `<button class="btn block" data-act="svRead" data-id="${esc(m.id)}">${esc(m.title)}</button>`).join('')}` : ''}`;
    }
    return `<div class="sv-rd"><div class="sv-ttl">${esc(it.title)}</div>
      <div class="sv-prog"><span>${last ? 'Finished' : 'Step ' + (rd.p + 1) + ' of ' + n}</span><div class="bar"><i style="width:${last ? 100 : pct}%"></i></div></div>
      ${body}
      ${last ? '' : navHtml(it, last)}
      <div class="row"><button class="btn" data-act="svFull" data-id="${esc(it.id)}">Whole page</button><a class="btn danger" href="tel:911">Call 911</a></div></div>`;
  }
  function navHtml(it, last) {
    const n = it.steps.length;
    return `<div class="sv-nav"><button class="btn" data-act="svBack" ${rd.p === 0 ? 'disabled' : ''}>← Back</button>${last ? `<button class="btn gold" data-act="closeSheet">Close</button>` : `<button class="btn gold" data-act="svNext">${rd.p === n - 1 ? 'Done' : 'Next'} →</button>`}</div>`;
  }
  function openReader(id, ids) {
    if (!byId(id)) return; rd = { id, p: 0, ids: ids || [] }; addRecent(id);
    OA.sheet('Step by step', readerHtml());
  }

  /* ---------- full entry ---------- */
  function addRecent(id) { const r = SS().recent.filter(x => x !== id); r.unshift(id); SS().recent = r.slice(0, 8); OA.saveSoon(); }
  function fullHtml(it) {
    const s = SS(), cat = catOf(it.cat), fav = !!s.fav[it.id], pr = s.practised[it.id];
    const see = it.seeAlso.map(byId).filter(Boolean);
    return `<div class="sv-full"><h2 class="big">${esc(it.title)}</h2>
      <div><span class="tag a">${esc(cat.label)}</span>${it.level === 'now' ? '<span class="tag r">Act now</span>' : '<span class="tag">Learn</span>'}${it.time ? `<span class="tag">${esc(it.time)}</span>` : ''}${pr ? '<span class="tag g">practised</span>' : ''}</div>
      <p style="margin-top:10px">${esc(it.summary)}</p>
      <div class="row"><button class="btn" data-act="svFav" data-id="${esc(it.id)}">${fav ? '★ Saved' : '☆ Save'}</button>${it.steps.length ? `<button class="btn gold" data-act="svStepsMode" data-id="${esc(it.id)}">Step by step</button>` : ''}</div>
      ${it.steps.length ? `<h3>Steps</h3><ol class="ls sv-steps">${it.steps.map(st => `<li><b>${esc(st.t)}</b>${st.d ? `<div class="sm dim">${esc(st.d)}</div>` : ''}</li>`).join('')}</ol>` : ''}
      ${it.warn.length ? `<div class="alert"><b class="t">Careful</b><ul class="ls">${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
      ${it.whenHelp.length ? `<div class="alert danger"><b class="t">When to get help or turn back</b><ul class="ls">${it.whenHelp.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
      ${see.length ? `<h3>See also</h3><div class="card inner">${see.map(x => `<div class="li" data-act="svOpen" data-id="${esc(x.id)}" data-replace="1" role="button"><span class="ic">${OA.icon(x.icon || catOf(x.cat).icon)}</span><span class="tx"><b>${esc(x.title)}</b></span></div>`).join('')}</div>` : ''}
      <button class="btn block ${pr ? '' : 'gold'}" data-act="svPractised" data-id="${esc(it.id)}">${pr ? '✓ Practised ' + esc(OA.ago(pr)) + ' (tap to undo)' : 'Mark as practised'}</button>
      <div class="row"><button class="btn" data-act="svShare" data-id="${esc(it.id)}">Share</button><button class="btn" data-act="svPrint" data-id="${esc(it.id)}">Print</button></div>
      <div class="sm dim" style="margin-top:12px"><b>Sources</b>${it.src.length ? `<ul class="ls">${it.src.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(String(u).replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a></li>`).join('')}</ul><div class="xs">Links need signal. Rules and guidance change: check with the land manager.</div>` : '<div class="xs">General field practice with no single source. Check with a course instructor or the land manager.</div>'}</div>
      <p class="foot">A reference, not training.</p></div>`;
  }
  function plainText(it) {
    return it.title + '\n' + it.summary + '\n\n' + it.steps.map((s, i) => (i + 1) + '. ' + s.t + (s.d ? ' - ' + s.d : '')).join('\n') +
      (it.warn.length ? '\n\nCareful:\n- ' + it.warn.join('\n- ') : '') + (it.whenHelp.length ? '\n\nGet help or turn back if:\n- ' + it.whenHelp.join('\n- ') : '') + '\n\n(Backpackica, a reference not training)';
  }
  function printItem(it) {
    let d = document.getElementById('svprint'); if (!d) { d = document.createElement('div'); d.id = 'svprint'; document.body.appendChild(d); }
    d.innerHTML = `<h1>${esc(it.title)}</h1><p>${esc(it.summary)}</p><ol>${it.steps.map(s => `<li><b>${esc(s.t)}</b>${s.d ? ' ' + esc(s.d) : ''}</li>`).join('')}</ol>` +
      (it.warn.length ? `<h3>Careful</h3><ul>${it.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '') + (it.whenHelp.length ? `<h3>Get help or turn back if</h3><ul>${it.whenHelp.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '') + `<p><i>Backpackica. A reference, not training.</i></p>`;
    document.body.classList.add('svprinting');
    const done = () => { document.body.classList.remove('svprinting'); d.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(() => { try { window.print(); } catch (e) { done(); } }, 60);
  }

  /* ---------- actions ---------- */
  const introHtml = `<p>This manual is a <b>reference, not training</b>. Reading about a skill does not make you able to do it when you are cold, tired and frightened.</p>
    <ul class="ls"><li>Take a <b>wilderness first-aid course</b> and practise fire, shelter, navigation and water treatment before you need them.</li>
    <li><b>Tell someone your plan</b>: where you are going, who is with you and when to worry.</li>
    <li>Rules, closures and conditions change. Check with the land manager.</li>
    <li>If someone is in danger, call 911 first; use the Now tab.</li></ul>`;
  OA.act({
    async svSec(el) {
      const id = el.dataset.id;
      if (id === 'manual' && !OA.S.gates['survive-intro']) { const ok = await OA.gate('survive-intro', 'Before you read the manual', introHtml, 'Open the manual'); if (!ok) return; }
      SS().sec = id; OA.saveSoon(); OA.render(); window.scrollTo(0, 0);
    },
    svSit(el) {
      const s = SITS.find(x => x.id === el.dataset.id); if (!s) return;
      const L = sitItems(s), ids = L.map(i => i.id);
      if (!L.length) return OA.toast('No steps are loaded for this situation. Open the manual.');
      if (L.length === 1) return openReader(L[0].id, ids);
      OA.sheet(s.label, `<div class="sv-rd"><div class="sv-ttl">${esc(s.label)}</div><p class="sv-sum">Pick the closest match. Each opens one step at a time.</p>${L.map(i => `<button class="btn block sv-pick" data-act="svRead" data-id="${esc(i.id)}" data-ids="${esc(ids.join(','))}">${esc(i.title)}</button>`).join('')}<a class="btn danger block" href="tel:911">Call 911</a></div>`);
    },
    svRead(el) { const ids = (el.dataset.ids || '').split(',').filter(Boolean); openReader(el.dataset.id, ids.length ? ids : rd.ids); },
    svNext() { const it = byId(rd.id); if (!it) return; rd.p = Math.min(it.steps.length, rd.p + 1); OA.redrawSheet(readerHtml()); OA.$('#sheet').scrollTop = 0; },
    svBack() { rd.p = Math.max(0, rd.p - 1); OA.redrawSheet(readerHtml()); OA.$('#sheet').scrollTop = 0; },
    svFull(el) { const it = byId(el.dataset.id); if (!it) return; addRecent(it.id); OA.redrawSheet(fullHtml(it)); OA.$('#sheet').scrollTop = 0; },
    svStepsMode(el) { rd = { id: el.dataset.id, p: 0, ids: rd.ids || [] }; OA.redrawSheet(readerHtml()); OA.$('#sheet').scrollTop = 0; },
    svOpen(el) {
      const it = byId(el.dataset.id); if (!it) return OA.toast('That entry is not available.'); addRecent(it.id);
      if (el.dataset.replace && OA.sheetOpen()) { OA.redrawSheet(fullHtml(it)); OA.$('#sheet').scrollTop = 0; } else OA.sheet('Survive manual', fullHtml(it));
    },
    svFav(el) { const it = byId(el.dataset.id), s = SS(); if (!it) return; if (s.fav[it.id]) delete s.fav[it.id]; else s.fav[it.id] = 1; OA.save(); OA.redrawSheet(fullHtml(it)); },
    svPractised(el) { const it = byId(el.dataset.id), s = SS(); if (!it) return; if (s.practised[it.id]) delete s.practised[it.id]; else { s.practised[it.id] = Date.now(); OA.toast('Nice. Marked as practised.'); } OA.save(); OA.redrawSheet(fullHtml(it)); },
    svShare(el) { const it = byId(el.dataset.id); if (it) OA.share.send({ title: it.title, text: plainText(it) }); },
    svPrint(el) { const it = byId(el.dataset.id); if (it) printItem(it); },
    svCat(el) { SS().cat = el.dataset.id; limit = 30; OA.saveSoon(); fillManual(document); window.scrollTo(0, 0); },
    svCatClear() { SS().cat = ''; OA.saveSoon(); fillManual(document); },
    svClearQ() { SS().q = ''; OA.saveSoon(); const q = OA.$('#svq'); if (q) q.value = ''; fillManual(document); },
    svMore() { limit += 30; fillManual(document); },
    svForage() { if (BP.forage && BP.forage.open) BP.forage.open(); else OA.toast('The foraging guide is not available in this build.'); },
    async svCoords() {
      if (!G.known()) { try { OA.toast('Getting your position…'); await G.position(); } catch (e) { return OA.toast(e.message, 4500); } }
      if (OA.acts.coordSheet) OA.acts.coordSheet(); else { const f = G.known(); OA.sheet('My coordinates', `<div class="b" style="font-size:1.3rem">${esc(G.fmtCoord(f.lat, f.lon))}</div><p class="sm dim">Fix ${esc(OA.ago(f.ts))}.</p>`); }
    }
  });

  BP.survive = {
    open(id) { const it = byId(id); if (it) { addRecent(id); OA.sheet('Survive manual', fullHtml(it)); } },
    openSituation(id) { OA.acts.svSit({ dataset: { id } }); },
    items: () => idx().list, byId, cats: () => SURVIVE.cats
  };
})();
