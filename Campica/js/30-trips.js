/* Campica: Trips tab. Curated family camping ideas (window.CAMPTRIPS.items from data/trips.js).
   State: S.trips = {fav:{id:1}, f:{q,season,days,theme,diff,near}, sort, saved, shown}.
   Hooks (all optional, used defensively): CP.camp(id) / CP.campDetail(id) from the Find tab, CP.plan.addTrip(trip) from the Plan tab.
   Public: CP.trips = {open(id), items(), byId(id)}. Distances are straight-line from an approximate anchor and are labelled so. */
window.CP = window.CP || {};
(function () {
  'use strict';
  const esc = OA.esc, CP = window.CP, G = OA.geo;
  window.CAMPTRIPS = window.CAMPTRIPS || { items: [] };
  OA.defaults({ trips: { fav: {}, f: { q: '', season: '', days: '', theme: '', diff: '', near: '' }, sort: 'curated', saved: false, shown: 24 } });
  const TS = () => OA.S.trips;
  const THEMES = { beach: 'Beach', redwoods: 'Forest and redwoods', lakes: 'Lakes', desert: 'Desert', mountains: 'Mountains', 'dark-sky': 'Dark sky', 'first-timer': 'First-timer', wildlife: 'Wildlife', islands: 'Islands', history: 'History', canyons: 'Canyons', rivers: 'Rivers', waterfalls: 'Waterfalls', 'rv-friendly': 'RV friendly', 'hot-springs': 'Hot springs' };
  const SEASONS = [['spring', 'Spring'], ['summer', 'Summer'], ['fall', 'Fall'], ['winter', 'Winter']];
  const NEAR = [100, 250, 500, 1000];
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  const safeUrl = u => (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : '';
  const num = v => typeof v === 'number' && isFinite(v);

  /* ---------- index ---------- */
  let IDX = null, IDXN = -1;
  function idx() {
    const its = (window.CAMPTRIPS && CAMPTRIPS.items) || [];
    if (IDX && IDXN === its.length) return IDX;
    const by = {}, list = [];
    its.forEach((t, i) => {
      if (!t || !t.id || by[t.id]) return;
      ['season', 'theme', 'itinerary', 'campIds', 'campNames', 'kidHighlights', 'cautions', 'bookingTips', 'src'].forEach(k => { if (!Array.isArray(t[k])) t[k] = []; });
      t._o = i; t._h = [t.title, t.region, t.summary, t.theme.join(' '), t.campNames.join(' ')].join(' ').toLowerCase();
      by[t.id] = t; list.push(t);
    });
    IDX = { by, list }; IDXN = its.length; return IDX;
  }
  const byId = id => idx().by[id] || null;
  const fix = () => { const f = G.known && G.known(); return f && num(f.lat) && num(f.lon) ? f : null; };
  const distMi = t => { const f = fix(); return f && num(t.lat) && num(t.lon) ? G.mi({ lat: f.lat, lon: f.lon }, { lat: t.lat, lon: t.lon }) : null; };

  /* ---------- filtering ---------- */
  function filtered() {
    const f = TS().f, s = TS(), toks = (f.q || '').toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
    let L = idx().list.filter(t => {
      if (s.saved && !s.fav[t.id]) return false;
      if (f.season && t.season.indexOf(f.season) < 0) return false;
      if (f.days === 'short' && !(t.days <= 2)) return false;
      if (f.days === 'mid' && t.days !== 3) return false;
      if (f.days === 'long' && !(t.days >= 4)) return false;
      if (f.theme && t.theme.indexOf(f.theme) < 0) return false;
      if (f.diff && t.difficulty !== f.diff) return false;
      if (f.near) { const d = distMi(t); if (d == null || d > +f.near) return false; }
      for (const k of toks) if (t._h.indexOf(k) < 0) return false;
      return true;
    });
    if (s.sort === 'near' && fix()) L = L.slice().sort((a, b) => (distMi(a) == null ? 1e9 : distMi(a)) - (distMi(b) == null ? 1e9 : distMi(b)));
    return L;
  }
  const anyFilter = () => { const f = TS().f; return !!(f.q || f.season || f.days || f.theme || f.diff || f.near || TS().saved); };

  /* ---------- tab ---------- */
  OA.tab({
    id: 'trips', label: 'Trips', icon: 'route', order: 20,
    render(el) {
      el.innerHTML = OA.header('Trips', 'Family camping ideas, California and beyond') + '<div id="ctbody"></div>';
      fillTop(OA.$('#ctbody', el));
    }
  });
  function selHtml(path, label, opts, val) {
    return `<label class="fl">${esc(label)}<select class="in" data-bind="${path}" data-then="ctRefresh">${opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(val || '') ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  }
  function fillTop(root) {
    const s = TS(), f = s.f, hasFix = !!fix();
    const themesUsed = Object.keys(THEMES).filter(k => idx().list.some(t => t.theme.indexOf(k) >= 0));
    root.innerHTML = `<div class="alert ct-note"><b class="t">Ideas, not verified plans</b>These trips are starting points written from general knowledge. Seasons, road status, permits and fees change: confirm on the official page (linked in each trip) before you book.</div>
      <input class="in" id="ctq" type="search" inputmode="search" autocomplete="off" placeholder="Search: redwoods, beach, Yosemite…" value="${esc(f.q || '')}" aria-label="Search trips">
      <div class="two">${selHtml('trips.f.season', 'Season', [['', 'Any season']].concat(SEASONS), f.season)}${selHtml('trips.f.days', 'Length', [['', 'Any length'], ['short', '1 to 2 days'], ['mid', '3 days'], ['long', '4+ days']], f.days)}</div>
      <div class="two">${selHtml('trips.f.diff', 'Effort', [['', 'Any effort'], ['easy', 'Easy'], ['moderate', 'Moderate']], f.diff)}
      ${hasFix ? selHtml('trips.f.near', 'Distance from me', [['', 'Any distance']].concat(NEAR.map(n => [n, 'Within ' + OA.dist(n, 0)])), f.near) : `<div class="fl">Distance from me<button class="btn block ct-loc" data-act="ctLocate" style="margin:3px 0 0">Use my location</button></div>`}</div>
      <div class="chips ct-themes"><button class="chip ${!f.theme ? 'on' : ''}" data-act="ctTheme" data-id="">All themes</button>${themesUsed.map(k => `<button class="chip ${f.theme === k ? 'on' : ''}" data-act="ctTheme" data-id="${k}">${esc(THEMES[k])}</button>`).join('')}</div>
      <div class="row mid between"><button class="chip ${s.saved ? 'on' : ''}" data-act="ctSaved">★ Saved (${Object.keys(s.fav).filter(k => byId(k)).length})</button>
      ${hasFix ? `<label class="sm dim">Sort <select class="in ct-sort" data-bind="trips.sort" data-then="ctRefresh"><option value="curated" ${s.sort !== 'near' ? 'selected' : ''}>Our order</option><option value="near" ${s.sort === 'near' ? 'selected' : ''}>Nearest first</option></select></label>` : ''}</div>
      <div id="ctres"></div>`;
    fillList(root);
  }
  function cardHtml(t) {
    const d = distMi(t), s = TS();
    return `<section class="card ct-card" data-act="ctOpen" data-id="${esc(t.id)}" role="button" tabindex="0">
      <div class="ct-top"><div class="ct-nm"><b>${esc(t.title)}</b><span class="dim sm">${esc(t.region)}</span></div><div class="ct-end">${s.fav[t.id] ? '<span class="gold">★</span>' : ''}${d != null ? `<span class="xs dim">about ${esc(OA.dist(Math.round(d / 5) * 5 || 5, 0))}</span>` : ''}</div></div>
      <p class="sm" style="margin:6px 0">${esc(t.summary)}</p>
      <div><span class="tag a">${esc(t.days)} day${t.days === 1 ? '' : 's'}</span><span class="tag ${t.difficulty === 'easy' ? 'g' : 'w'}">${esc(cap(t.difficulty || ''))}</span>${t.season.map(x => `<span class="tag">${esc(cap(x))}</span>`).join('')}</div></section>`;
  }
  function fillList(root) {
    const out = OA.$('#ctres', root || document); if (!out) return;
    if (!idx().list.length) { out.innerHTML = '<div class="card"><p>The trip ideas did not load. Close and reopen the app.</p></div>'; return; }
    const L = filtered(), shown = L.slice(0, TS().shown || 24);
    out.innerHTML = `<div class="sm dim" style="margin:4px 0 8px">${L.length} trip${L.length === 1 ? '' : 's'}${fix() ? ' · distances are straight-line from your last location fix, to an approximate spot' : ''}</div>` +
      (L.length ? shown.map(cardHtml).join('') + (L.length > shown.length ? `<button class="btn block" data-act="ctMore">Show more (${L.length - shown.length})</button>` : '')
        : `<div class="card"><p>${TS().saved ? 'No saved trips yet. Open a trip and tap “Save idea”.' : 'No trips match these filters.'}</p>${anyFilter() ? '<button class="btn" data-act="ctReset">Clear filters</button>' : ''}</div>`);
  }
  let qT = null;
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'ctq') return;
    clearTimeout(qT); const v = e.target.value; qT = setTimeout(() => { TS().f.q = v; TS().shown = 24; OA.saveSoon(); fillList(document); }, 120);
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute && e.target.getAttribute('data-act') === 'ctOpen' && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); } });

  /* ---------- detail sheet ---------- */
  function campRow(t) {
    const rows = [];
    t.campIds.forEach(id => {
      const c = typeof CP.camp === 'function' ? CP.camp(id) : null;
      if (c) rows.push(`<div class="li" data-act="ctCamp" data-id="${esc(id)}" role="button" tabindex="0"><span class="ic">${OA.icon('tent')}</span><span class="tx"><b>${esc(c.name)}</b><span>${esc(c.parent || '')}</span></span><span class="end">Open</span></div>`);
    });
    const known = t.campIds.map(id => typeof CP.camp === 'function' ? CP.camp(id) : null).filter(Boolean).map(c => String(c.name).toLowerCase());
    t.campNames.forEach(n => {
      if (known.some(k => k === String(n).toLowerCase())) return;
      const q = encodeURIComponent(n + ' campground reservations');
      rows.push(`<div class="li"><span class="ic">${OA.icon('tent')}</span><span class="tx"><b>${esc(n)}</b><span>Not in the Find list yet</span></span><span class="end"><a href="https://duckduckgo.com/?q=${q}" target="_blank" rel="noopener">Search</a></span></div>`);
    });
    return rows.length ? `<div class="card inner">${rows.join('')}</div><p class="xs dim">Names are suggestions. Check the campground’s own page for size limits, season and rules.</p>` : '<p class="sm dim">No campground names listed. Use the Find tab to look near the area.</p>';
  }
  function detailHtml(t) {
    const s = TS(), fav = !!s.fav[t.id], d = distMi(t);
    const srcs = t.src.map(safeUrl).filter(Boolean);
    const ml = num(t.lat) && num(t.lon) ? G.mapLinks(t.lat, t.lon) : null;
    return `<div class="ct-full"><h2 class="big">${esc(t.title)}</h2>
      <div class="dim sm">${esc(t.region)}</div>
      <div style="margin-top:6px"><span class="tag a">${esc(t.days)} day${t.days === 1 ? '' : 's'}</span><span class="tag ${t.difficulty === 'easy' ? 'g' : 'w'}">${esc(cap(t.difficulty || ''))}</span>${t.theme.map(x => `<span class="tag">${esc(THEMES[x] || x)}</span>`).join('')}</div>
      <p style="margin-top:8px">${esc(t.summary)}</p>
      <div class="card inner">
        <div class="kv"><span>Best seasons</span><span>${t.season.length ? esc(t.season.map(cap).join(', ')) : 'check with the source'}</span></div>
        <div class="kv"><span>Good for ages</span><span>${esc(t.ages || 'check with the source')}</span></div>
        <div class="kv"><span>Driving</span><span>${t.drive ? esc(t.drive) : 'check a map for your start'}</span></div>
        ${d != null ? `<div class="kv"><span>From you</span><span>about ${esc(OA.dist(Math.round(d / 5) * 5 || 5, 0))} straight-line</span></div>` : ''}
      </div>
      <div class="row wrap"><button class="btn gold" data-act="ctPlan" data-id="${esc(t.id)}">Plan this trip</button><button class="btn" data-act="ctFav" data-id="${esc(t.id)}">${fav ? '★ Saved' : '☆ Save idea'}</button></div>
      <div class="row"><button class="btn" data-act="ctShare" data-id="${esc(t.id)}">Share</button>${ml ? `<a class="btn" href="${esc(ml.osm)}" target="_blank" rel="noopener">Map (approx.)</a>` : ''}</div>
      <h3>Day by day</h3>
      <ol class="ls ct-days">${t.itinerary.map(x => `<li><b>Day ${esc(x.day)}</b> ${esc(x.text)}</li>`).join('')}</ol>
      ${t.kidHighlights.length ? `<h3>Kid highlights</h3><ul class="ls">${t.kidHighlights.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <h3>Where to camp</h3>${campRow(t)}
      ${t.cautions.length ? `<div class="alert"><b class="t">Before you go</b><ul class="ls">${t.cautions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${t.bookingTips.length ? `<div class="card inner tip"><div class="ct"><span>Booking tips</span></div><ul class="ls">${t.bookingTips.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="sm dim" style="margin-top:12px"><b>Check the official pages</b>${srcs.length ? `<ul class="ls">${srcs.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a></li>`).join('')}</ul>` : '<div class="xs">No link listed.</div>'}
        <div class="xs">${t.verified === false ? 'Not source-checked: this idea was written from general knowledge. ' : ''}Written ${esc(t.asof || '')}. Confirm seasons, closures, permits, fees and reservation windows with the land manager.</div></div></div>`;
  }
  function textOf(t) {
    return t.title + ' (' + t.region + ')\n' + t.summary + '\n\n' + t.itinerary.map(x => 'Day ' + x.day + ': ' + x.text).join('\n') +
      (t.campNames.length ? '\n\nCamps to look at: ' + t.campNames.join('; ') : '') + '\n\n(Campica idea: confirm season, road status and reservations with the official page.)';
  }
  const redraw = id => { const t = byId(id); if (t) OA.redrawSheet(detailHtml(t)); };

  OA.act({
    ctRefresh() { TS().shown = 24; OA.saveSoon(); fillTop(OA.$('#ctbody')); },
    ctTheme(el) { TS().f.theme = el.dataset.id || ''; TS().shown = 24; OA.saveSoon(); fillTop(OA.$('#ctbody')); },
    ctSaved() { TS().saved = !TS().saved; TS().shown = 24; OA.saveSoon(); fillTop(OA.$('#ctbody')); },
    ctReset() { const s = TS(); s.f = { q: '', season: '', days: '', theme: '', diff: '', near: '' }; s.saved = false; OA.saveSoon(); fillTop(OA.$('#ctbody')); },
    ctMore() { TS().shown = (TS().shown || 24) + 24; fillList(document); },
    ctOpen(el) { const t = byId(el.dataset.id); if (t) OA.sheet('Trip idea', detailHtml(t)); },
    ctFav(el) { const s = TS(), id = el.dataset.id; if (s.fav[id]) delete s.fav[id]; else s.fav[id] = 1; OA.save(); redraw(id); },
    ctShare(el) { const t = byId(el.dataset.id); if (t) OA.share.send({ title: t.title, text: textOf(t) }); },
    ctCamp(el) {
      if (typeof CP.campDetail === 'function') { try { CP.campDetail(el.dataset.id); } catch (e) { OA.toast('Could not open that campground.'); } } else OA.toast('Open the Find tab to see this campground.');
    },
    ctPlan(el) {
      const t = byId(el.dataset.id); if (!t) return;
      if (CP.plan && typeof CP.plan.addTrip === 'function') {
        try { const r = CP.plan.addTrip(t); if (r !== false) { OA.toast('Added to your plans.'); return; } } catch (e) { OA.toast('Could not add it: ' + e.message); return; }
      }
      OA.toast('Planning from ideas is not connected yet. Save the idea and use the Plan tab.', 4200);
    },
    async ctLocate() {
      try { OA.toast('Getting your position…'); await G.position(); OA.toast('Got it.'); fillTop(OA.$('#ctbody')); }
      catch (e) { OA.toast(e && e.message ? e.message : 'Could not get your location.', 4500); }
    }
  });

  CP.trips = { open: id => { const t = byId(id); if (t) OA.sheet('Trip idea', detailHtml(t)); }, items: () => idx().list, byId };
})();
