/* Campica: fix missing map positions on the phone, and save camps to the shared Places list.
   - Camps with no coordinates get "Find on map" (place search, needs signal, one request per tap) or typed coordinates. Your pin is stored on this phone (OA.S.cpos) and marked approximate.
   - "Save to Places" puts the camp in OCC.places so Roadtripica and Expandica can use it. */
window.CPL = window.CPL || {};
(function () {
  'use strict';
  const CPL = window.CPL, esc = OA.esc, num = v => typeof v === 'number' && isFinite(v);
  OA.defaults({ cpos: {} });
  const POS = () => OA.S.cpos;
  const res = {}; // id -> {msg, list}
  function apply(it) { const p = POS()[it.id]; if (p && !num(it.lat) && num(p[0]) && num(p[1])) { it.lat = p[0]; it.lon = p[1]; it.coordApprox = true; it.coordSrc = 'Pinned by you on this phone'; } }
  CPL.applyAll = () => { try { ((window.CAMPS && window.CAMPS.items) || []).forEach(apply); } catch (e) { } };
  CPL.applyAll();
  const inBox = (lat, lon) => lat >= 17 && lat <= 72 && lon >= -180 && lon <= -60;
  function set(it, lat, lon, how) {
    if (!(num(lat) && num(lon) && inBox(lat, lon))) { OA.toast('That position is outside the United States.'); return false; }
    POS()[it.id] = [Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5]; OA.save(); apply(it); it.lat = POS()[it.id][0]; it.lon = POS()[it.id][1]; it.coordApprox = true; it.coordSrc = how;
    delete res[it.id]; OA.toast('Pinned. It shows as approximate until you check it.'); if (window.CP && CP.redrawDetail) CP.redrawDetail(it.id); return true;
  }
  CPL.html = function (it) {
    const hasPos = num(it.lat) && num(it.lon), id = esc(it.id), saved = window.OCC && OCC.places && OCC.places.has('camp:' + it.id);
    let h = `<div class="card inner"><div class="ct"><span>${OA.icon('pin')} Map position and places</span></div>`;
    if (!hasPos) {
      const r = res[it.id] || {};
      h += `<p class="sm">This camp has no map position yet. You can look it up (needs signal) or type coordinates you trust, such as from the camp's own page.</p>
        <div class="row wrap"><button class="btn" data-act="cplFind" data-id="${id}">Find on map</button></div>`;
      if (r.msg) h += `<p class="sm dim">${esc(r.msg)}</p>`;
      if (r.list) h += `<div class="sm">Pick the right one, or none if it looks wrong:</div>` + r.list.map((g, i) => `<button class="btn block" data-act="cplPick" data-id="${id}" data-i="${i}">${esc(g.name.slice(0, 90))}</button>`).join('');
      h += `<label class="fl">Coordinates (latitude, longitude)</label><input class="in" id="cpl-${id}" placeholder="37.7416, -119.6025" inputmode="decimal"><button class="btn" data-act="cplType" data-id="${id}">Use these coordinates</button>`;
    } else if (it.coordApprox) h += `<p class="sm dim">Position is approximate (${esc(it.coordSrc || 'park or area level')}).</p>`;
    if (window.OCC && OCC.places) h += `<div class="row wrap"><button class="btn ${saved ? '' : 'gold'}" data-act="cplSave" data-id="${id}">${saved ? 'In shared Places: tap to remove' : 'Save to shared Places'}</button></div><p class="xs dim">Shared Places show up in Roadtripica and Expandica when the apps are on the same site.</p>`;
    return h + '</div>';
  };
  OA.act({
    async cplFind(el) {
      const it = CP.camp(el.dataset.id); if (!it) return;
      if (!OA.online()) { res[it.id] = { msg: 'Place search needs signal. Try again when you have it, or type coordinates.' }; CP.redrawDetail(it.id); return; }
      res[it.id] = { msg: 'Searching…' }; CP.redrawDetail(it.id);
      try {
        let r = await OA.geocode([it.name, it.parent, it.state].filter(Boolean).join(', '));
        if (!r.length && it.parent) r = await OA.geocode([it.parent, it.state].filter(Boolean).join(', '));
        res[it.id] = r.length ? { list: r.slice(0, 5) } : { msg: 'Nothing found. Try typing coordinates.' };
      } catch (e) { res[it.id] = { msg: 'Place search did not answer. Try again later.' }; }
      CP.redrawDetail(it.id);
    },
    cplPick(el) { const it = CP.camp(el.dataset.id), g = it && res[it.id] && res[it.id].list && res[it.id].list[+el.dataset.i]; if (g) set(it, g.lat, g.lon, 'Place search result you picked on this phone'); },
    cplType(el) {
      const it = CP.camp(el.dataset.id), inp = document.getElementById('cpl-' + el.dataset.id); if (!it || !inp) return;
      const m = String(inp.value).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
      if (!m) { OA.toast('Type latitude, then longitude, like 37.74, -119.60'); return; }
      set(it, +m[1], +m[2], 'Typed by you on this phone');
    },
    cplSave(el) {
      const it = CP.camp(el.dataset.id); if (!it || !window.OCC || !OCC.places) return;
      const ref = 'camp:' + it.id, have = OCC.places.byRef(ref);
      if (have) { OCC.places.remove(have.id); OA.toast('Removed from shared Places.'); }
      else { OCC.places.add({ name: it.name, lat: num(it.lat) ? it.lat : null, lon: num(it.lon) ? it.lon : null, state: it.state || '', kind: 'camp', ref, from: 'campica' }); OA.toast('Saved to shared Places.'); }
      CP.redrawDetail(it.id);
    }
  });
})();
