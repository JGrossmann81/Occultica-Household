/* Backpackica: household link publisher. Only totals and dates leave the app: never notes, photos, positions or health detail. */
(function () {
  'use strict';
  const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
  const call = (a, b) => { try { const o = window.BP && BP[a]; return o && typeof o[b] === 'function' ? o[b]() : null; } catch (e) { return null; } };
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  /* Plan days() shape is owned by the Plan module; read it defensively: any day with a town/resupply stop or a permit date becomes an event. */
  function planEvents() {
    const out = [], seen = {}, today = OA.dkey();
    const add = (t, d, kind) => { if (t && d && ISO.test(d) && d >= today && !seen[t + d]) { seen[t + d] = 1; out.push({ t, d, kind: kind || 'trail' }); } };
    let days = call('plan', 'days'); if (days && !Array.isArray(days) && Array.isArray(days.days)) days = days.days;
    (Array.isArray(days) ? days : []).forEach(x => {
      if (!x || typeof x !== 'object') return;
      const d = x.date || x.d || x.day, town = x.town || x.resupply || (x.stop && (x.stop.name || x.stop)) || (x.type === 'town' && x.name);
      if (town) add('Resupply: ' + (typeof town === 'string' ? town : town.name || 'town'), d);
      const permit = x.permit || x.permitDate; if (permit) add('Permit: ' + (typeof permit === 'string' ? permit : permit.name || x.name || 'trail permit'), x.permitOn || d);
    });
    const nt = call('plan', 'nextTown'); if (nt && nt.name && nt.date) add('Resupply: ' + nt.name, nt.date);
    const pm = call('plan', 'permits'); (Array.isArray(pm) ? pm : []).forEach(p => { if (p && (p.date || p.d)) add('Permit: ' + (p.name || p.t || 'trail permit'), p.date || p.d); });
    return out.sort((a, b) => a.d < b.d ? -1 : 1).slice(0, 20);
  }
  OA.publisher = () => {
    const tr = call('trail', 'current') || {}, ts = call('trail', 'summary') || {}, pk = call('pack', 'summary') || {}, fd = call('pack', 'foodSummary') || {};
    const nt = call('plan', 'nextTown') || ts.nextTown || null, lg = (window.BP && BP.log) || null;
    return {
      trail: tr.trail || ts.trail || '',
      day: lg ? lg.dayNumber() : 0,
      milesToday: lg ? Math.round(lg.milesToday() * 10) / 10 : 0,
      milesTotal: lg ? Math.round(lg.milesTotal() * 10) / 10 : 0,
      packLb: num(pk.packLb), kcalBurnDay: num(pk.kcalBurnDay), kcalTargetDay: num(fd.kcalTargetDay),
      nextTown: nt && nt.name ? { name: nt.name, mi: num(nt.mi), date: nt.date || null } : null,
      events: planEvents()
    };
  };
})();
