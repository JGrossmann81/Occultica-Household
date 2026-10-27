/* Roadtripica: Guide tab. Offline road-trip reference from window.RTGUIDE. Check-offs are saved per trip; bookmarks; print/share. */
(function () {
  'use strict';
  const esc = OA.esc;
  OA.defaults({ guide: { cat: 'all', q: '', fav: {}, chk: {} } });
  const G = () => { const g = OA.S.guide; if (!g.fav) g.fav = {}; if (!g.chk) g.chk = {}; return g; };
  const D = () => window.RTGUIDE || { cats: [], items: [] };
  const item = id => D().items.find(i => i.id === id);
  const ICON = { before: 'car', kids: 'heart', drive: 'clock', trouble: 'alert', weather: 'cloud', remote: 'compass', rv: 'tool', money: 'ticket', food: 'fork', games: 'star', pack: 'backpack', scenic: 'mountain' };
  let page = 1;

  function tripKey() {
    try {
      const t = window.RT && (typeof RT.trip === 'function' ? RT.trip() : RT.trip);
      if (t && typeof t === 'object') { const k = t.id || t.name; if (k) return String(k); }
      if (typeof t === 'string' && t) return t;
    } catch (e) { }
    return 'default';
  }
  const tripName = () => { try { const t = window.RT && (typeof RT.trip === 'function' ? RT.trip() : RT.trip); return t && t.name ? String(t.name) : ''; } catch (e) { return ''; } };
  function chkMap(id) { const g = G(); const k = tripKey(); if (!g.chk[k]) g.chk[k] = {}; if (!g.chk[k][id]) g.chk[k][id] = {}; return g.chk[k][id]; }
  const doneCount = it => { const m = ((G().chk[tripKey()] || {})[it.id]) || {}; return (it.check || []).filter((c, i) => m[i]).length; };

  function matches(it, q) {
    if (!q) return true; q = q.toLowerCase();
    return [it.t, it.sum, (it.steps || []).join(' '), (it.check || []).join(' '), (it.list || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function filtered() {
    const g = G(), q = (g.q || '').trim();
    return D().items.filter(it => (g.cat === 'all' || (g.cat === 'fav' ? g.fav[it.id] : it.cat === g.cat)) && matches(it, q));
  }

  function listHTML() {
    const g = G(), cats = D().cats, rows = filtered();
    const chips = [['all', 'All'], ['fav', 'Saved']].concat(cats).map(c => `<button class="chip ${g.cat === c[0] ? 'on' : ''}" data-act="rgCat" data-c="${esc(c[0])}">${esc(c[1])}</button>`).join('');
    const show = rows.slice(0, page * 30);
    const body = show.map(it => {
      const n = (it.check || []).length, d = n ? doneCount(it) : 0;
      return `<div class="li" data-act="rgOpen" data-id="${esc(it.id)}" role="button" tabindex="0"><span class="ic">${OA.icon(ICON[it.cat] || 'book')}</span><div class="tx"><b>${esc(it.t)}</b><span>${esc(it.sum || '')}</span></div><div class="end">${g.fav[it.id] ? '<span class="gold">' + OA.icon('star', 'sm') + '</span> ' : ''}${n ? `<span class="${d === n ? 'green' : ''}">${d}/${n}</span>` : ''}</div></div>`;
    }).join('');
    return `${OA.header('Guide', 'Offline road-trip reference')}
      <div class="card tip rg-note"><div class="sm">Works with no signal. General guidance only: rules, closures and prices change. For roads and weather, check the official agency before you go.</div></div>
      <input class="in" type="search" id="rgq" placeholder="Search the guide (tires, flood, games…)" value="${esc(g.q || '')}" autocomplete="off">
      <div class="chips">${chips}</div>
      <div class="card">${body || `<div class="center dim pad">${g.cat === 'fav' ? 'No saved cards yet. Open a card and tap Save.' : 'Nothing matches that search.'}</div>`}</div>
      ${rows.length > show.length ? `<button class="btn block" data-act="rgMore">Show more (${rows.length - show.length} left)</button>` : ''}
      <div class="foot">Own-written reference, ${esc(D().asof || '')}. Not a substitute for training, a manual or an official source.</div>`;
  }

  OA.tab({
    id: 'guide', label: 'Guide', icon: 'book', order: 50,
    render() {
      const html = listHTML();
      return html;
    }
  });

  /* ---------- card sheet ---------- */
  function cardHTML(it) {
    const g = G(), m = chkMap(it.id), fav = !!g.fav[it.id];
    const chk = (it.check || []).length ? `<h3>Checklist <span class="xs dim">saved for ${esc(tripName() || 'this trip')}</span></h3>` + it.check.map((c, i) => `<label class="chk"><input type="checkbox" data-act="rgTick" data-id="${esc(it.id)}" data-i="${i}" ${m[i] ? 'checked' : ''}> <span${m[i] ? ' class="dim" style="text-decoration:line-through"' : ''}>${esc(c)}</span></label>`).join('') + `<div class="row"><button class="mini" data-act="rgClear" data-id="${esc(it.id)}">Clear ticks</button></div>` : '';
    const steps = (it.steps || []).length ? (it.check || []).length ? `<h3>Notes</h3><ul class="ls">${it.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : `<ol class="ls">${it.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : '';
    const list = (it.list || []).length ? `<ol class="ls">${it.list.map(s => { const i = s.indexOf(':'); return i > 0 && i < 40 ? `<li><b>${esc(s.slice(0, i))}</b>${esc(s.slice(i))}</li>` : `<li>${esc(s)}</li>`; }).join('')}</ol>` : '';
    return `${it.warn ? `<div class="alert danger" style="margin-top:0"><b class="t">Important</b>${esc(it.warn)}</div>` : ''}
      ${it.gen ? '<div class="alert"><b class="t">General description</b>Not source-checked. Confirm the current road status with the road agency before you plan around it.</div>' : ''}
      <p class="dim">${esc(it.sum || '')}</p>${list}${steps}${chk}
      ${(it.links || []).length ? `<h3>Official sites</h3>${it.links.map(l => `<div class="sm"><a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)}</a></div>`).join('')}` : ''}
      <div class="row wrap noprint"><button class="btn" data-act="rgFav" data-id="${esc(it.id)}">${fav ? 'Saved (tap to remove)' : 'Save'}</button><button class="btn" data-act="rgShare" data-id="${esc(it.id)}">Share</button><button class="btn" data-act="rgPrint" data-id="${esc(it.id)}">Print</button></div>`;
  }
  function cardText(it) {
    const done = chkMap(it.id);
    return it.t + '\n' + (it.sum || '') + '\n\n' + (it.warn ? 'IMPORTANT: ' + it.warn + '\n\n' : '') + (it.list || []).map((s, i) => (i + 1) + '. ' + s).join('\n') + (it.steps || []).map((s, i) => (i + 1) + '. ' + s).join('\n') + ((it.check || []).length ? '\n\nChecklist:\n' + it.check.map((c, i) => (done[i] ? '[x] ' : '[ ] ') + c).join('\n') : '') + '\n\n(Roadtripica guide, general guidance. Check official sources.)';
  }
  async function openCard(id) {
    const it = item(id); if (!it) return;
    /* one-time safety note, shown the first time a card is opened */
    if (!await OA.gate('rtguide', 'Before you rely on the guide', '<p class="sm">This guide is a short, general reference for road trips. It can be wrong or out of date, and it is not a substitute for your vehicle manual, local law, a road agency, a first-aid course or a professional.</p><ul class="ls sm"><li>Check road and weather conditions with the official source (state transportation department, National Weather Service, park rangers) before you drive.</li><li>Never leave a child or a pet alone in a parked car.</li><li>If someone is hurt or in danger, call 911 (or the local emergency number).</li></ul>', 'Open the guide')) return;
    OA.sheet(it.t, cardHTML(it));
  }
  function redraw(id) { const it = item(id); if (it) OA.redrawSheet(cardHTML(it)); }

  OA.act({
    rgCat(el) { G().cat = el.dataset.c; page = 1; OA.saveSoon(); OA.render(true); },
    rgMore() { page++; OA.render(true); },
    rgOpen(el) { openCard(el.dataset.id); },
    rgTick(el) { const m = chkMap(el.dataset.id); if (el.checked) m[el.dataset.i] = 1; else delete m[el.dataset.i]; OA.saveSoon(); const row = el.parentNode.querySelector('span'); if (row) { row.style.textDecoration = el.checked ? 'line-through' : ''; row.classList.toggle('dim', el.checked); } },
    rgClear(el) { const g = G(), k = tripKey(); if (g.chk[k]) delete g.chk[k][el.dataset.id]; OA.saveSoon(); redraw(el.dataset.id); },
    rgFav(el) { const g = G(); if (g.fav[el.dataset.id]) delete g.fav[el.dataset.id]; else g.fav[el.dataset.id] = 1; OA.saveSoon(); redraw(el.dataset.id); OA.toast(g.fav[el.dataset.id] ? 'Saved' : 'Removed'); },
    rgShare(el) { const it = item(el.dataset.id); if (it) OA.share.send({ title: it.t, text: cardText(it) }); },
    rgPrint(el) {
      const it = item(el.dataset.id); if (!it) return;
      const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(it.t)}</title><style>body{font:15px/1.45 Georgia,serif;color:#111;background:#fff;max-width:720px;margin:0 auto;padding:18px}h1{font-size:1.5rem;margin:0 0 4px}h3{border-bottom:1px solid #888;margin:16px 0 4px}.m{color:#555}li{margin:3px 0}.b{display:inline-block;width:14px;height:14px;border:1.5px solid #000;margin-right:8px;vertical-align:-2px}ul.c{list-style:none;padding:0}</style></head><body><h1>${esc(it.t)}</h1><p class="m">${esc(it.sum || '')}</p>${it.warn ? `<p><b>Important:</b> ${esc(it.warn)}</p>` : ''}${(it.list || []).length ? `<ol>${it.list.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}${(it.steps || []).length ? `<ol>${it.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}${(it.check || []).length ? `<h3>Checklist</h3><ul class="c">${it.check.map(c => `<li><span class="b"></span>${esc(c)}</li>`).join('')}</ul>` : ''}<p class="m">Roadtripica guide: general guidance, check official sources.</p></body></html>`;
      printDoc(doc);
    }
  });
  function printDoc(doc) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    const d = f.contentWindow.document; d.open(); d.write(doc); d.close();
    setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { OA.toast('Printing is not available here. Use Share instead.'); } setTimeout(() => f.remove(), 60000); }, 300);
  }
  let qt = null;
  document.addEventListener('input', e => {
    if (!e.target || e.target.id !== 'rgq') return;
    clearTimeout(qt); const v = e.target.value;
    qt = setTimeout(() => { G().q = v; page = 1; OA.saveSoon(); OA.render(true); const q = OA.$('#rgq'); if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (x) { } } }, 250);
  });
  window.RTGuide = { open: openCard, count: () => D().items.length };
})();
