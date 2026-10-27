/* Saturnica x Occultica household: publish a small money summary for Healthica and Hortica,
   show what they share (meal plan cost, garden value, health-cost ideas) on Home. Loads after gm3.js and occ-link.js. */
(function () {
  if (!window.OCC) return;
  const r$ = n => Math.round(num(n));
  const lineAmt = id => num((S.exp[id] || {}).amt);
  const gmFoodOnly = () => !!(S.gm && S.gm.on && num(S.gm.food) > 0);

  /* ---------- what Saturnica shares ---------- */
  function cleanName(n) { // no account numbers, no person's name
    let t = String(n || '').replace(/\s*(?:#|\*+|\b[xX]+)?\d[\d\s-]{2,}\d/g, '').replace(/\b(acct|account|ending in|ending|no\.?)\s*$/i, '');
    const me = String((S.me && S.me.name) || '').trim(); if (me.length >= 2) t = t.split(new RegExp('\\b' + me.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig')).join('');
    t = t.replace(/\s{2,}/g, ' ').replace(/^[\s,:'’-]+|[\s,:#-]+$/g, '').replace(/^s\s+/i, '').trim(); return (t || 'Bill').slice(0, 40);
  }
  function hhEvents() {
    if (!(S.gm && S.gm.on) || typeof gmForecast !== 'function') return [];
    try {
      const out = [];
      gmForecast(60).list.forEach(e => {
        if (e.kind === 'bill') out.push({ t: cleanName(e.n) + ' due', d: e.d, kind: 'bill', amt: Math.round(Math.abs(num(e.amt))) });
        else if (e.kind === 'pay') out.push({ t: 'Payday', d: e.d, kind: 'pay', amt: Math.round(num(e.amt)) });
        else if (e.kind === 'gig') out.push({ t: 'Gig pay expected', d: e.d, kind: 'pay', amt: Math.round(num(e.amt)) });
      });
      return out.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.d)).map(x => { if (!x.amt) delete x.amt; return x; }).slice(0, 40);
    } catch (x) { return []; }
  }
  function hhData() {
    let g = lineAmt('groc'), dn = lineAmt('dining');
    if (!g && !dn && gmFoodOnly()) g = num(S.gm.food);
    return { groceryWeek: Math.round(g / 4.33), diningWeek: Math.round(dn / 4.33), health: { insurance: r$(lineAmt('healthins')), meds: r$(lineAmt('meds')), gym: r$(lineAmt('gym')) }, events: hhEvents() };
  }
  function hhPublish() { try { if (S.setup) OCC.publish('saturnica', hhData()); } catch (x) { } }
  let hhT = null; const hhSoon = () => { clearTimeout(hhT); hhT = setTimeout(hhPublish, 1000); };
  const _save0 = save; save = function () { const r = _save0.apply(this, arguments); hhSoon(); return r; };

  /* ---------- what the sister apps share ---------- */
  function hhCard() {
    const H = OCC.get('healthica'), G = OCC.get('hortica'), C = OCC.get('chorica'); if (!H && !G && !C) return '';
    const me = hhData(), gw = me.groceryWeek, hd = (H && H.data) || {}, gd = (G && G.data) || {}, wk = hd.week || {}; let h = '';
    if (H && num(wk.cost) > 0) {
      const W = Math.round(num(wk.cost)), N = Math.round(num(wk.meals)), diff = W - gw;
      h += '<div class="sm" style="margin:4px 0"><b>🍽️ Plate to budget</b><br>Healthica\'s meal plan this week: about <b>' + $$$(W) + '</b>' + (N ? ' (' + N + ' meals)' : '') + '.';
      if (gw > 0) {
        h += ' Your grocery budget: <b>' + $$$(gw) + '/week</b>. ' + (diff > 0 ? '<b class="red">Over by ' + $$$(diff) + '.</b>' : diff < 0 ? '<b class="ok">Fits, under by ' + $$$(-diff) + '.</b>' : '<b class="ok">Fits exactly.</b>');
        if (diff > 0) h += '<br><span class="dim">To close it: use the Kitchen\'s cheaper picks in Healthica, cook more from the garden, or raise the Groceries line in Budget.</span>';
      } else h += ' <span class="dim">Add a Groceries line in Budget to compare it with your plan.</span>';
      h += '</div>';
    }
    if (G && num(gd.value30) > 0) h += '<div class="sm" style="margin:6px 0"><b>🌿 Garden savings</b><br>Your garden grew about <b class="ok">' + $$$(num(gd.value30)) + '</b> this month: money you did not spend at the store.' + (H && num(wk.gardenSaved) > 0 ? ' This week\'s meal plan uses about ' + $$$(num(wk.gardenSaved)) + ' of it.' : '') + '</div>';
    else if (H && num(wk.gardenSaved) > 0) h += '<div class="sm" style="margin:6px 0"><b>🌿 Garden savings</b><br>This week\'s meal plan uses about <b class="ok">' + $$$(num(wk.gardenSaved)) + '</b> of homegrown food: money you did not spend at the store.</div>';
    const ideas = (Array.isArray(hd.healthIdeas) ? hd.healthIdeas : []).filter(i => i && i.text).slice(0, 4);
    if (ideas.length) {
      const gym = me.health.gym;
      h += '<div class="sm" style="margin:6px 0"><b>⚕ Budget to body</b>' + ideas.map(i => '<div style="margin:3px 0">• ' + esc(i.text) + (i.kind === 'gym' && gym > 0 ? ' A home workout plan could replace a gym membership costing ' + $$$(gym) + '/month.' : '') + '</div>').join('') +
        '<div class="dim">Ideas to ask about, not medical advice. Never stop or change a medicine without talking to your doctor or pharmacist.</div></div>';
    }
    const cd = (C && C.data) || {};
    if (C && (num(cd.owed) > 0 || num(cd.paidMonth) > 0 || num(cd.weekValue) > 0)) h += '<div class="sm" style="margin:6px 0"><b>🧹 Kids\' chores</b><br>' + (num(cd.owed) > 0 ? 'You owe the kids <b>' + $$$(num(cd.owed)) + '</b> for chores. ' : 'Nothing owed for chores right now. ') + (num(cd.paidMonth) > 0 ? 'Paid ' + $$$(num(cd.paidMonth)) + ' this month. ' : '') + (num(cd.weekValue) > 0 ? '<span class="dim">If every chore gets done, that is about ' + $$$(num(cd.weekValue)) + ' a week (' + $$$(Math.round(num(cd.weekValue) * 4.33)) + ' a month). Budget it as a line, for example under Giving or a custom "Kids chores" line.</span>' : '') + (num(cd.waiting) > 0 ? '<br><span class="dim">' + num(cd.waiting) + ' check-off(s) waiting for approval in Chorica.</span>' : '') + '</div>';
    if (!h) h = '<p class="sm dim">Linked. Numbers from ' + [H && 'Healthica', G && 'Hortica', C && 'Chorica'].filter(Boolean).join(' and ') + ' show here once they have a plan or a harvest.</p>';
    const ts = Math.max(H ? H.ts || 0 : 0, G ? G.ts || 0 : 0, C ? C.ts || 0 : 0);
    return '<section class="card occ-hh"><div class="ct"><span>🏡 Household</span><a class="lnk" data-act="occOpen">Linked apps</a></div>' + h + (ts ? '<div class="sm dim" style="margin-top:4px">Updated ' + esc(OCC.ago(ts)) + '.</div>' : '') + '</section>';
  }
  const hhCards = () => { try { return hhCard() + OCC.ritualHTML('saturnica'); } catch (x) { return ''; } };
  // Fix: the gm2/gm3 wrappers around gmHomeCard read S.gm before gangsta's own gmHas() check, so Home threw for anyone without I Got Thi$ data.
  if (typeof gmHomeCard === 'function') { const _ghc = gmHomeCard; gmHomeCard = function () { return gmHas() ? _ghc() : ''; }; }
  const MARK ='<section class="card tip"><b>🌪️';
  const _home1 = homeTab; homeTab = function () { const h = _home1(), i = h.indexOf(MARK); return i >= 0 ? h.slice(0, i) + hhCards() + h.slice(i) : h + hhCards(); };
  if (typeof gmToday === 'function') { const _today1 = gmToday; gmToday = function () { return _today1() + hhCards(); }; }

  /* ---------- menu + actions ---------- */
  const _menuH = ACT.menu;
  ACT.menu = () => {
    _menuH(); const body = $('#sheet .sh-body'); if (!body) return; const d = document.createElement('div');
    d.innerHTML = '<button class="mrow" data-act="occOpen"><span class="me">🏡</span><span><b>Household</b><br><small class="dim">Link Healthica and Hortica, shared calendar</small></span></button>';
    const at = body.querySelector('[data-act="settings"]'); body.insertBefore(d.firstChild, at || null);
  };
  OCC.bind(ACT, 'saturnica', w => { if (w === 'publish') hhPublish(); else if (w === 'linked' && S.setup) render(); });
  window.addEventListener('storage', e => { if (e.key && /^occ\.pub\.(healthica|hortica|chorica)$/.test(e.key) && S.setup && !sheetOpen()) render(); });
  window.addEventListener('DOMContentLoaded', () => setTimeout(hhPublish, 50));
  window.hhPublish = hhPublish;
})();
