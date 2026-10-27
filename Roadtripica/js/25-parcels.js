/* Roadtripica: "Family stops near your route" card (Trip tab, Places view).
   Reads Expandica's published summary (OCC.get('expandica'): {stops:[{name,state,stage,lat,lon}], owned, next}) and shared saved places (OCC.places).
   Distances are straight-line to the route line (not road distance); detour = 2 x that distance, a rough guide only.
   RT.parcels.card(trip, plan) -> html string ('' when it cannot be built). RT.parcels.near(trip, plan, maxMi) -> {owned,other,saved,linked,...} */
window.RT = window.RT || {};
(function () {
  'use strict';
  const RT = window.RT, esc = OA.esc, MAXMI = 60, SHOW = 6, R = 3958.8, D2R = Math.PI / 180;
  const isNum = v => typeof v === 'number' && isFinite(v);
  let rows = [];

  /* distance in miles from point p to segment a-b (all {lat,lon}); flat local plane centred on p, fine for tens of miles */
  function segMi(p, a, b) {
    const k = Math.cos(p.lat * D2R), f = q => { let dl = q.lon - p.lon; if (dl > 180) dl -= 360; if (dl < -180) dl += 360; return [dl * D2R * k * R, (q.lat - p.lat) * D2R * R]; };
    const A = f(a), B = f(b), dx = B[0] - A[0], dy = B[1] - A[1], L = dx * dx + dy * dy;
    if (!L) return Math.hypot(A[0], A[1]);
    const u = Math.max(0, Math.min(1, -(A[0] * dx + A[1] * dy) / L));
    return Math.hypot(A[0] + u * dx, A[1] + u * dy);
  }
  function lineMi(p, line) {
    if (!line.length) return null; if (line.length === 1) return segMi(p, line[0], line[0]);
    let best = Infinity; for (let i = 1; i < line.length; i++) { const d = segMi(p, line[i - 1], line[i]); if (d < best) best = d; } return best;
  }
  function routeLine(t, plan) {
    let g = null;
    try { g = plan && plan.model && Array.isArray(plan.model.g) ? plan.model.g.map(c => ({ lat: c[0], lon: c[1] })) : null; } catch (e) { }
    if (g && g.length > 1) return g;
    let pts = []; try { pts = RT.trip.points(t) || []; } catch (e) { }
    return pts.filter(q => q && isNum(q.lat) && isNum(q.lon)).map(q => ({ lat: q.lat, lon: q.lon }));
  }
  const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
  const onTrip = (t, ref, name, p) => (t.waypoints || []).some(w => (ref && w.ref === ref) || (norm(w.label) === norm(name) && isNum(w.lat) && isNum(w.lon) && OCC.places.miles(w, p) < 0.5));

  function near(t, plan, maxMi) {
    maxMi = maxMi || MAXMI;
    const out = { line: 0, linked: false, ts: null, owned: [], other: [], saved: [], skipped: 0, ownedCount: null, nextName: null };
    const line = routeLine(t, plan); out.line = line.length; if (!line.length || !window.OCC) return out;
    let pub = null; try { pub = OCC.get('expandica'); } catch (e) { }
    const d = pub && pub.data; out.linked = !!d; out.ts = pub && pub.ts || null;
    const mk = (src, o, ref, extra) => {
      const p = { lat: o.lat, lon: o.lon }, mi = lineMi(p, line); if (mi == null || mi > maxMi) return null;
      return Object.assign({ name: String(o.name).slice(0, 80), state: o.state ? String(o.state).slice(0, 20) : '', mi, detour: 2 * mi, ref, src, lat: o.lat, lon: o.lon, on: onTrip(t, ref, o.name, p) }, extra || {});
    };
    const seen = [];
    if (d) {
      if (isNum(d.owned)) out.ownedCount = d.owned; else if (Array.isArray(d.owned)) out.ownedCount = d.owned.length;
      if (d.next && d.next.name) out.nextName = String(d.next.name);
      (Array.isArray(d.stops) ? d.stops : []).forEach(s => {
        if (!s || !String(s.name || '').trim()) return;
        if (!isNum(s.lat) || !isNum(s.lon) || Math.abs(s.lat) > 90 || Math.abs(s.lon) > 180) { out.skipped++; return; }
        const stage = norm(s.stage), isOwned = /own|cabin|^stop/.test(stage), r = mk('expandica', s, 'expandica:' + s.name, { stage: String(s.stage || '').slice(0, 30) });
        seen.push({ name: s.name, lat: s.lat, lon: s.lon });
        if (r) (isOwned ? out.owned : out.other).push(r);
      });
    }
    let saved = []; try { saved = OCC.places.list() || []; } catch (e) { }
    saved.forEach(s => {
      if (!s || !String(s.name || '').trim() || !isNum(s.lat) || !isNum(s.lon)) return;
      if (/^expandica:/.test(s.ref || '') && out.owned.concat(out.other).some(x => x.ref === s.ref)) return;
      if (seen.some(x => norm(x.name) === norm(s.name) && OCC.places.miles(x, s) < 0.5)) return;
      const r = mk('saved', s, s.ref || ('place:' + s.id), { kind: s.kind || 'other' }); if (r) out.saved.push(r);
    });
    ['owned', 'other', 'saved'].forEach(k => out[k].sort((a, b) => a.mi - b.mi));
    return out;
  }

  function row(r, idx) {
    const dist = OA.dist(r.mi, 0), det = OA.dist(r.detour, 0);
    const tags = (r.stage ? `<span class="tag ${/own|cabin|^stop/i.test(r.stage) ? 'g' : ''}">${esc(r.stage)}</span> ` : '') + (r.kind && r.kind !== 'other' ? `<span class="tag">${esc(r.kind)}</span> ` : '');
    return `<div class="li"><span class="ic">${OA.icon('pin')}</span><span class="tx"><b>${esc(r.name)}${r.state ? ', ' + esc(r.state) : ''}</b><span>${tags}${esc(dist)} from your route, detour roughly ${esc(det)} extra (rough)</span></span>
      <span class="end">${r.on ? '<span class="tag g">On your trip</span>' : `<button class="mini" data-act="parcelAdd" data-i="${idx}">Add as a stop</button>`}</span></div>`;
  }
  function group(title, list, note) {
    if (!list.length) return '';
    const shown = list.slice(0, SHOW).map(r => { rows.push(r); return row(r, rows.length - 1); }).join('');
    return `<h3 class="sm" style="margin:10px 0 2px">${esc(title)} (${list.length})</h3>${note ? `<div class="xs dim">${esc(note)}</div>` : ''}${shown}${list.length > SHOW ? `<div class="xs dim">${list.length - SHOW} more farther out. Nearest ${SHOW} shown.</div>` : ''}`;
  }
  const HOW = `<div class="xs dim" style="margin-top:6px">To link Expandica: install both apps on the same site (the Occultica Household launcher does this) and open Expandica once, or in Expandica go to Menu &gt; Household, copy its link code, then paste it here under Menu &gt; Household. Places saved in Campica or Expandica on the same site also show up here.</div>`;

  function card(t, plan) {
    rows = [];
    try {
      if (!t || !window.OCC || !OCC.places) return '';
      const head = `<div class="ct"><span>${OA.icon('home')} Family stops near your route</span></div>`;
      const n = near(t, plan);
      if (!n.line) return `<div class="card">${head}<p class="sm dim">Add at least one place to your trip and any Expandica land stops or saved places within ${esc(OA.dist(MAXMI, 0))} of the route will be listed here.</p></div>`;
      const body = group('Family land you own', n.owned) + group('Scouted or visited', n.other, 'Sites you are still looking at, not owned.') + group('Saved places', n.saved, 'Saved in Campica or Expandica.');
      const any = n.owned.length + n.other.length + n.saved.length;
      let h = `<div class="card">${head}<p class="xs dim">Within ${esc(OA.dist(MAXMI, 0))} of the route line, straight-line distance, nearest first. The detour is a rough guess (twice the straight-line gap) and not a driving distance: check it on a map before you commit.</p>`;
      if (any) h += body;
      else if (!n.linked) h += `<p class="sm dim">Expandica is not linked on this phone yet, and nothing you saved is near this route.</p>${HOW}`;
      else h += `<p class="sm dim">Nothing from Expandica or your saved places is within ${esc(OA.dist(MAXMI, 0))} of this route${n.ownedCount === 0 ? ' (Expandica reports no owned parcels yet)' : ''}.</p>`;
      if (n.linked && n.skipped) h += `<div class="xs dim">${n.skipped} Expandica stop${n.skipped > 1 ? 's have' : ' has'} no location and cannot be checked.</div>`;
      if (n.linked && n.ts) h += `<div class="xs dim">Expandica summary updated ${esc(OCC.ago(n.ts))}${Date.now() - n.ts > 30 * 86400000 ? '. It is old: open Expandica to refresh it' : ''}.</div>`;
      if (any && !n.linked) h += HOW;
      if (any) h += `<div class="xs dim" style="margin-top:6px">"Add as a stop" puts the place at the end of your list (before the final stop). Use the arrows to move it.</div>`;
      return h + '</div>';
    } catch (e) { return ''; }
  }

  RT.parcels = { card, near, segMi, lineMi };
  OA.act({
    parcelAdd(el) {
      const r = rows[+el.dataset.i]; if (!r || !RT.trip || typeof RT.trip.addStop !== 'function') return;
      const w = RT.trip.addStop({ label: r.name, lat: r.lat, lon: r.lon, kind: 'stop', ref: r.ref });
      if (w) OA.toast('Added ' + r.name + ' to your trip'); else OA.toast('Could not add that place.');
    }
  });
})();
