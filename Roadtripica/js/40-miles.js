/* Roadtripica: Miles tab. Vehicle profiles, trip odometer, fuel-ups with mpg per fill, EV charging, expenses and budget,
   cost-to-drive calculator, pre-trip checklist, service reminders by odometer, trip stats and CSV export. Works fully offline.
   Everything is stored in miles, US gallons, kWh and dollars; distances are shown in the user's unit setting.
   API:  RT.miles.log()    -> copies of the records {vehicles, readings, fuel, ev, expenses}
         RT.miles.totals() -> {milesDriven, days, perDay, longestDay, fuelCost, spend, perMile, avgMpg, byCat, people, perPerson, states}
   mpg per fill uses the full-tank method: miles since the previous full fill divided by all gallons added since then (partial fills are folded in).
   A fill with no odometer, or the first full fill, has no mpg. The running average is total miles / total gallons, not an average of averages. */
window.RT = window.RT || {};
(function () {
  'use strict';
  const esc = OA.esc, PAGE = 25, KM = 1.609344;
  const CATS = [['gas', 'Gas and charging'], ['food', 'Food'], ['lodging', 'Lodging'], ['tolls', 'Tolls'], ['parking', 'Parking'], ['fun', 'Fun and tickets'], ['repairs', 'Repairs']];
  const CATN = {}; CATS.forEach(c => { CATN[c[0]] = c[1]; });
  const VTYPES = [['car', 'Car'], ['suv', 'SUV or crossover'], ['truck', 'Pickup truck'], ['van', 'Van or minivan'], ['rv', 'RV or motorhome'], ['tow', 'Vehicle towing a trailer'], ['ev', 'Electric car'], ['hybrid', 'Hybrid'], ['moto', 'Motorcycle']];
  const FUELS = [['gas', 'Gasoline'], ['diesel', 'Diesel'], ['electric', 'Electric'], ['phev', 'Plug-in hybrid']];
  const STATES = { alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC' };
  const SCODES = {}; Object.keys(STATES).forEach(k => { SCODES[STATES[k]] = 1; });

  OA.defaults({ miles: { sec: 'trip', vehicles: [], veh: '', readings: [], fuel: [], ev: [], exp: [], budget: {}, trip: { start: '', startOdo: null }, people: null, service: [], chk: {}, calc: { miles: null, price: null, mpg: null, pen: 0, round: false } } });
  const S = () => {
    const m = OA.S.miles = OA.S.miles || {};
    ['vehicles', 'readings', 'fuel', 'ev', 'exp', 'service'].forEach(k => { m[k] = m[k] || []; });
    m.budget = m.budget || {}; m.chk = m.chk || {}; m.calc = m.calc || {}; m.trip = m.trip || { start: '', startOdo: null }; m.sec = m.sec || 'trip'; m.veh = m.veh || '';
    return m;
  };
  const T = () => S().trip;
  const ui = { all: false, edit: null, pg: { fuel: 1, ev: 1, rd: 1, exp: 1 } };
  const num = v => { if (v === '' || v == null) return null; v = parseFloat(v); return isFinite(v) ? v : null; };
  const km = () => OA.unit.dist() === 'km';
  const dIn = v => v == null ? null : (km() ? v / KM : v);                 // typed distance -> miles
  const dOut = mi => mi == null ? '' : OA.round(km() ? mi * KM : mi, 1);   // miles -> number to show in a field
  const dU = () => km() ? 'km' : 'mi';
  const mpgTxt = m => m == null || !isFinite(m) ? 'n/a' : OA.round(m, 1) + ' mpg' + (km() ? ' (' + OA.round(235.215 / m, 1) + ' L/100 km)' : '');
  const money2 = v => OA.money2(v || 0);
  const today = () => OA.dkey();
  const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : today();
  const fd = d => d ? OA.fmtDate(d, { month: 'short', day: 'numeric' }) : '';
  const byNew = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.odo || 0) - (a.odo || 0) || (b.ts || 0) - (a.ts || 0);
  const byOld = (a, b) => -byNew(a, b);

  /* ---------------------------------------------------------------- vehicles */
  const vehicles = () => S().vehicles;
  const veh = () => { const s = S(); return s.vehicles.find(v => v.id === s.veh) || s.vehicles[0] || null; };
  const vid = () => { const v = veh(); return v ? v.id : ''; };
  const isElec = v => v && (v.fuel === 'electric' || v.type === 'ev');
  const mpgOf = v => v ? (v.mpg != null ? v.mpg : (v.kwh100 ? 3370 / v.kwh100 : null)) : null;
  const win = r => ui.all || !T().start || (r.date || '') >= T().start;
  const mine = k => S()[k].filter(r => (r.veh || '') === vid() && win(r));
  const mineAny = k => S()[k].filter(win);

  /* ---------------------------------------------------------------- calculations */
  function fuelRows() {
    const rows = mine('fuel').slice().sort(byOld); let last = null, acc = 0, mi = 0, gal = 0;
    const out = rows.map(r => {
      acc += r.gal || 0; let mpg = null;
      if (r.full !== false) {
        if (r.odo != null) { if (last != null && r.odo > last && acc > 0) { mpg = (r.odo - last) / acc; mi += r.odo - last; gal += acc; } last = r.odo; }
        else last = null;
        acc = 0;
      }
      return { r, mpg };
    });
    const mp = out.filter(x => x.mpg != null).map(x => x.mpg);
    return { rows: out, avg: gal > 0 ? mi / gal : null, best: mp.length ? Math.max.apply(null, mp) : null, worst: mp.length ? Math.min.apply(null, mp) : null, last: mp.length ? mp[mp.length - 1] : null, n: mp.length };
  }
  function odoPoints() {
    const p = [];
    ['readings', 'fuel', 'ev'].forEach(k => mine(k).forEach(r => { if (r.odo != null) p.push({ date: r.date, odo: r.odo }); }));
    if (T().startOdo != null) p.push({ date: T().start || '0000-00-00', odo: T().startOdo, start: true });
    return p.sort((a, b) => a.odo - b.odo || (a.date || '').localeCompare(b.date || ''));
  }
  function curOdo() {
    const v = veh(); let m = v && v.odo != null ? v.odo : null;
    ['readings', 'fuel', 'ev'].forEach(k => S()[k].filter(r => (r.veh || '') === vid()).forEach(r => { if (r.odo != null && (m == null || r.odo > m)) m = r.odo; }));
    return m;
  }
  function dayMiles() {
    const p = odoPoints(), d = {};
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], mi = b.odo - a.odo; if (mi <= 0) continue;
      const n = a.date && b.date && a.date !== '0000-00-00' ? OA.daysBetween(a.date, b.date) : 0;
      if (n <= 0) d[b.date] = (d[b.date] || 0) + mi;
      else for (let k = 1; k <= n; k++) { const dt = OA.addDays(a.date, k); d[dt] = (d[dt] || 0) + mi / n; }
    }
    return d;
  }
  function spendLines() {
    const a = [];
    mineAny('fuel').filter(r => (r.veh || '') === vid()).forEach(r => { if (r.total) a.push({ date: r.date, cat: 'gas', amt: r.total, note: (r.station || 'Fuel-up'), place: r.place || '' }); });
    mineAny('ev').filter(r => (r.veh || '') === vid()).forEach(r => { if (r.cost) a.push({ date: r.date, cat: 'gas', amt: r.cost, note: 'EV charge', place: r.place || '' }); });
    mineAny('exp').forEach(r => a.push({ date: r.date, cat: r.cat, amt: r.amt, note: r.note || '', place: r.place || '' }));
    return a.sort(byNew);
  }
  function partyCount() {
    let p = null; try { const sm = RT.trip && RT.trip.summary && RT.trip.summary(); p = sm && sm.party; } catch (e) { p = null; } if (p == null) return null;
    if (typeof p === 'number') return p > 0 ? p : null;
    if (Array.isArray(p)) return p.length || null;
    if (typeof p === 'object') { let n = 0; ['adults', 'kids', 'children', 'teens', 'infants', 'people', 'count'].forEach(k => { const v = num(p[k]); if (v) n += v; }); return n || null; }
    return null;
  }
  const people = () => { const v = num(S().people); return v && v > 0 ? v : partyCount(); };
  function tripVeh() { try { const t = RT.trip && RT.trip.current && RT.trip.current(), v = t && t.vehicle; return v && num(v.mpg) ? v : null; } catch (e) { return null; } }
  function routeInfo() {
    let sm = null; try { if (RT.trip && RT.trip.summary) sm = RT.trip.summary(); } catch (e) { sm = null; }
    if (!sm || typeof sm !== 'object') return { mi: null, days: null };
    let mi = null; ['totalMi', 'miles', 'distMi', 'distanceMi', 'totalMiles', 'dist', 'distance'].some(k => { const v = num(sm[k]); if (v != null && v > 0) { mi = v; return true; } return false; });
    let days = null; ['days', 'totalDays', 'nDays'].some(k => { const v = num(sm[k]); if (v != null && v > 0) { days = v; return true; } return false; });
    return { mi, days };
  }
  function places() {
    const set = {}, st = {};
    ['readings', 'fuel', 'ev', 'exp'].forEach(k => mineAny(k).forEach(r => {
      const p = String(r.place || '').trim(); if (!p) return; set[p.toLowerCase()] = p;
      const m = p.match(/,\s*([A-Za-z]{2})\s*$/); if (m && SCODES[m[1].toUpperCase()]) st[m[1].toUpperCase()] = 1;
      Object.keys(STATES).forEach(n => { if (new RegExp('\\b' + n + '\\b', 'i').test(p)) st[STATES[n]] = 1; });
    }));
    return { places: Object.keys(set).map(k => set[k]), states: Object.keys(st).sort() };
  }
  function totals() {
    const pts = odoPoints(), driven = pts.length >= 2 ? pts[pts.length - 1].odo - pts[0].odo : 0;
    const dm = dayMiles(), dk = Object.keys(dm).sort(), lines = spendLines(), byCat = {}; CATS.forEach(c => { byCat[c[0]] = 0; });
    lines.forEach(l => { byCat[l.cat] = (byCat[l.cat] || 0) + (l.amt || 0); });
    const spend = OA.sum(Object.keys(byCat), k => byCat[k]);
    const dates = []; ['readings', 'fuel', 'ev', 'exp'].forEach(k => mineAny(k).forEach(r => { if (r.date) dates.push(r.date); }));
    if (T().start) dates.push(T().start);
    dates.sort(); const days = dates.length ? OA.daysBetween(dates[0], dates[dates.length - 1]) + 1 : 0;
    const f = fuelRows(), pl = places(), pp = people(), longest = dk.reduce((b, k) => dm[k] > b.mi ? { mi: dm[k], date: k } : b, { mi: 0, date: '' });
    return { milesDriven: driven, days, drivingDays: dk.length, perDay: days > 0 ? driven / days : 0, longestDay: longest, fuelCost: byCat.gas || 0, spend, perMile: driven > 0 ? spend / driven : null, fuelPerMile: driven > 0 ? (byCat.gas || 0) / driven : null, avgMpg: f.avg, byCat, people: pp, perPerson: pp ? spend / pp : null, states: pl.states, places: pl.places, dayMiles: dm, lines };
  }
  RT.miles = Object.assign(RT.miles || {}, {
    log: () => { const s = S(); return JSON.parse(JSON.stringify({ vehicles: s.vehicles, readings: s.readings, fuel: s.fuel, ev: s.ev, expenses: s.exp, activeVehicle: vid() })); },
    totals
  });

  /* ---------------------------------------------------------------- csv */
  const csvCell = v => { if (v == null) return ''; if (typeof v === 'number') return String(OA.round(v, 3)); let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  const NOTE = 'For your own records only. Not tax advice and not an official mileage log. Check what your tax office requires.';
  function exportMileage() {
    const v = veh(), rows = [[NOTE], [], ['Date', 'Vehicle', 'Start odometer (mi)', 'End odometer (mi)', 'Miles', 'Place or purpose', 'Note']];
    let prev = T().startOdo, tot = 0;
    mine('readings').slice().sort(byOld).forEach(r => {
      const mi = prev != null ? r.odo - prev : null; if (mi != null && mi > 0) tot += mi;
      rows.push([r.date, v ? v.name : '', prev, r.odo, mi != null ? OA.round(mi, 1) : '', r.place || '', r.note || '']); prev = r.odo;
    });
    rows.push([], ['Total', '', '', '', OA.round(tot, 1)]);
    OA.download('roadtripica-mileage-' + today() + '.csv', 'text/csv;charset=utf-8', '﻿' + csv(rows)); OA.toast('Mileage log saved as a CSV file.');
  }
  function exportExpenses() {
    const rows = [[NOTE], [], ['Date', 'Category', 'Amount (USD)', 'Note', 'Place']];
    let tot = 0; spendLines().slice().sort(byOld).forEach(l => { tot += l.amt || 0; rows.push([l.date, CATN[l.cat] || l.cat, OA.round(l.amt || 0, 2), l.note, l.place]); });
    rows.push([], ['Total', '', OA.round(tot, 2)]);
    OA.download('roadtripica-expenses-' + today() + '.csv', 'text/csv;charset=utf-8', '﻿' + csv(rows)); OA.toast('Expenses saved as a CSV file.');
  }

  /* ---------------------------------------------------------------- form helpers */
  const fld = (label, id, val, o) => { o = o || {}; return `<label class="fl">${esc(label)}<input class="in" id="mf-${id}" type="${o.type || 'number'}" ${o.type === 'text' || o.type === 'date' ? '' : 'inputmode="decimal" step="any"'} value="${esc(val == null ? '' : val)}" ${o.ph ? 'placeholder="' + esc(o.ph) + '"' : ''} ${o.max ? 'maxlength="' + o.max + '"' : ''} ${o.on ? 'data-onchange="' + o.on + '"' : ''}></label>`; };
  const sel = (label, id, opts, v) => `<label class="fl">${esc(label)}<select class="in" id="mf-${id}">${opts.map(o => `<option value="${esc(o[0])}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  const g = id => { const e = OA.$('#mf-' + id); return e ? e.value : ''; };
  const gn = id => num(g(id));
  const placeRow = v => `<div class="row mid">${'<input class="in" id="mf-place" type="text" maxlength="80" placeholder="Town, ST" style="margin:0" value="' + esc(v || '') + '">'}<button class="btn" data-act="rmHere" style="flex:none">Where am I</button></div><div class="xs dim">Tip: end with the state, like "Moab, UT", so the trip stats can list states you visited.</div>`;
  const delBtn = () => ui.edit && ui.edit.id ? '<button class="btn danger block" data-act="rmDel">Delete this entry</button>' : '';

  function formHtml(kind, r) {
    r = r || {}; const v = veh();
    if (kind === 'reading') return `${fld('Date', 'date', r.date || today(), { type: 'date' })}${fld('Odometer (' + dU() + ')', 'odo', r.odo != null ? dOut(r.odo) : (curOdo() != null ? dOut(curOdo()) : ''), { ph: 'e.g. 48210' })}<label class="fl">Place</label>${placeRow(r.place)}${fld('Purpose or note', 'note', r.note, { type: 'text', max: 120, ph: 'Drive to the Grand Canyon' })}<button class="btn gold block" data-act="rmSave">Save reading</button>${delBtn()}`;
    if (kind === 'fuel') return `${fld('Date', 'date', r.date || today(), { type: 'date' })}<div class="two">${fld('US gallons', 'gal', r.gal, { ph: '12.4' })}${fld('Price per gallon ($)', 'ppg', r.ppg, { ph: '3.89' })}</div>${fld('Total paid ($), if you prefer', 'total', r.total, { ph: 'Filled in for you' })}${fld('Odometer (' + dU() + ')', 'odo', r.odo != null ? dOut(r.odo) : '', { ph: 'Needed for mpg' })}${fld('Station', 'station', r.station, { type: 'text', max: 60 })}<label class="fl">Place</label>${placeRow(r.place)}<label class="chk"><input type="checkbox" id="mf-full" ${r.full === false ? '' : 'checked'}> Filled the tank to full</label><div class="xs dim">mpg is worked out between full fills. If you only topped up, untick this and the gallons are folded into the next full fill.</div><button class="btn gold block" data-act="rmSave">Save fuel-up</button>${delBtn()}`;
    if (kind === 'ev') return `${fld('Date', 'date', r.date || today(), { type: 'date' })}<div class="two">${fld('kWh added', 'kwh', r.kwh)}${fld('Cost ($)', 'cost', r.cost)}</div>${fld('Odometer (' + dU() + ')', 'odo', r.odo != null ? dOut(r.odo) : '')}<label class="fl">Place or network</label>${placeRow(r.place)}<button class="btn gold block" data-act="rmSave">Save charge</button>${delBtn()}`;
    if (kind === 'exp') return `${fld('Date', 'date', r.date || today(), { type: 'date' })}<div class="two">${fld('Amount ($)', 'amt', r.amt)}${sel('Category', 'cat', CATS, r.cat || 'food')}</div><div class="xs dim">Fuel-ups and charges you log in Fuel already count as gas. Use "Gas" here only for fuel you did not log there.</div>${fld('What was it', 'note', r.note, { type: 'text', max: 80 })}<label class="fl">Place</label>${placeRow(r.place)}<button class="btn gold block" data-act="rmSave">Save expense</button>${delBtn()}`;
    if (kind === 'veh') return `${fld('Name', 'name', r.name || (v ? '' : 'Our car'), { type: 'text', max: 40 })}<div class="two">${sel('Type', 'type', VTYPES, r.type || 'car')}${sel('Fuel', 'fuel', FUELS, r.fuel || 'gas')}</div><div class="two">${fld('Miles per gallon (US)', 'mpg', r.mpg, { ph: 'Real-world number' })}${fld('kWh per 100 mi (electric)', 'kwh100', r.kwh100, { ph: 'e.g. 30' })}</div><div class="two">${fld('Fuel tank (US gal)', 'tank', r.tank)}${fld('Battery (kWh)', 'batt', r.batt)}</div>${fld('Odometer now (' + dU() + ')', 'odo', r.odo != null ? dOut(r.odo) : '')}<label class="chk"><input type="checkbox" id="mf-tow" ${r.tow ? 'checked' : ''}> I tow a trailer or drive an RV</label><div class="xs dim">Use your real-world mpg, not the sticker number. The Fuel tab shows what you actually get once you log fill-ups. MPGe is about 3370 divided by kWh per 100 mi.</div><button class="btn gold block" data-act="rmSave">Save vehicle</button>${delBtn()}`;
    if (kind === 'svc') return `${fld('What', 'name', r.name, { type: 'text', max: 60, ph: 'Oil change' })}<div class="chips wrap">${['Oil change', 'Tire rotation', 'Brake check', 'Air filter', 'Coolant', 'Transmission fluid'].map(n => `<button class="chip" data-act="rmSvcName" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div><div class="two">${fld('Every (' + dU() + ')', 'every', r.every != null ? dOut(r.every) : '', { ph: 'From your owner manual' })}${fld('Last done at (' + dU() + ')', 'last', r.last != null ? dOut(r.last) : (curOdo() != null ? dOut(curOdo()) : ''))}</div><div class="xs dim">Use the interval in your owner's manual. Severe use (towing, heat, mountains, short trips) is often shorter.</div>${fld('Note', 'note', r.note, { type: 'text', max: 100 })}<button class="btn gold block" data-act="rmSave">Save reminder</button>${delBtn()}`;
    return '';
  }
  const TITLES = { reading: 'Odometer reading', fuel: 'Fuel-up', ev: 'EV charge', exp: 'Expense', veh: 'Vehicle', svc: 'Service reminder' };
  const KEYS = { reading: 'readings', fuel: 'fuel', ev: 'ev', exp: 'exp', veh: 'vehicles', svc: 'service' };
  function openForm(kind, id) {
    const rec = id ? S()[KEYS[kind]].find(x => x.id === id) : null; ui.edit = { kind, id: rec ? rec.id : '' };
    OA.sheet((rec ? 'Edit ' : 'Add ') + TITLES[kind].toLowerCase(), formHtml(kind, rec || {}), { onClose: () => { ui.edit = null; } });
  }

  /* ---------------------------------------------------------------- screens */
  const sec = s => S().sec === s;
  const chipS = (id, label) => `<button class="chip ${sec(id) ? 'on' : ''}" data-act="rmSec" data-s="${id}">${label}</button>`;
  function more(k, n) { return n > ui.pg[k] * PAGE ? `<button class="btn block" data-act="rmMore" data-k="${k}">Show more (${n - ui.pg[k] * PAGE} left)</button>` : ''; }

  function vehicleCard() {
    const v = veh(), s = S();
    if (!v) {
      const tv = tripVeh();
      return `<div class="card center"><div style="margin:6px 0">${OA.icon('car', 'lg')}</div><b>Add your vehicle</b><p class="sm dim">Its mileage and tank size make the cost and fuel-stop numbers real. You can still log miles and costs without one.</p><button class="btn gold block" data-act="rmAdd" data-k="veh">Add vehicle</button>${tv && num(tv.mpg) ? '<button class="btn block" data-act="rmFromTrip">Use the vehicle from my trip plan</button>' : ''}</div>`;
    }
    const mp = mpgOf(v), range = !isElec(v) && mp && v.tank ? mp * v.tank : null;
    return `<div class="card"><div class="ct"><span>${OA.icon('car')} ${esc(v.name || 'My vehicle')}</span><button class="lnk" data-act="rmEdit" data-k="veh" data-id="${esc(v.id)}">Edit</button></div>
      <div class="kv"><span>Type</span><span>${esc((VTYPES.find(t => t[0] === v.type) || [0, 'Car'])[1])}${v.tow ? ' · towing' : ''}</span></div>
      ${isElec(v) ? `<div class="kv"><span>Efficiency</span><span>${v.kwh100 ? esc(v.kwh100 + ' kWh/100 mi (' + OA.round(3370 / v.kwh100, 0) + ' MPGe)') : 'not set'}</span></div>${v.batt ? `<div class="kv"><span>Battery</span><span>${esc(v.batt)} kWh</span></div>` : ''}` : `<div class="kv"><span>Mileage you entered</span><span>${esc(mpgTxt(v.mpg))}</span></div><div class="kv"><span>Tank</span><span>${v.tank ? esc(v.tank + ' gal') : 'not set'}${range ? ' · about ' + esc(OA.dist(range, 0)) + ' per tank' : ''}</span></div>`}
      <div class="kv"><span>Odometer now</span><span>${curOdo() != null ? esc(OA.dist(curOdo(), 0)) : 'not set'}</span></div>
      <div class="row">${s.vehicles.length > 1 ? '<button class="btn" data-act="rmSwitch">Switch vehicle</button>' : ''}<button class="btn" data-act="rmAdd" data-k="veh">Add another</button></div></div>`;
  }
  function tripSection() {
    const t = totals(), ri = routeInfo(), tr = T(), cur = curOdo();
    let h = vehicleCard();
    const plan = ri.mi, drivenTxt = t.milesDriven > 0 ? OA.dist(t.milesDriven, 0) : 'none yet';
    h += `<div class="card"><div class="ct"><span>Trip odometer</span><button class="lnk" data-act="rmTripStart">${tr.start || tr.startOdo != null ? 'Change start' : 'Set start'}</button></div>
      <div class="kv"><span>Started</span><span>${tr.start ? esc(fd(tr.start)) : 'not set'}${tr.startOdo != null ? ' at ' + esc(OA.dist(tr.startOdo, 0)) : ''}</span></div>
      <div class="kv"><span>Odometer now</span><span>${cur != null ? esc(OA.dist(cur, 0)) : 'log a reading'}</span></div>
      <div class="kv"><span>Driven so far</span><span><b>${esc(drivenTxt)}</b></span></div>
      <div class="kv"><span>Route plan (Trip tab)</span><span>${plan ? esc(OA.dist(plan, 0)) : 'no plan yet'}</span></div>
      ${plan && t.milesDriven > 0 ? `<div class="sm" style="margin-top:6px">${t.milesDriven >= plan ? 'You have driven ' + esc(OA.dist(t.milesDriven - plan, 0)) + ' (' + Math.round((t.milesDriven / plan - 1) * 100) + '%) more than the planned route.' : esc(OA.dist(plan - t.milesDriven, 0)) + ' of the planned route to go.'}</div>${OA.chart.bars([{ label: 'Driven vs plan', v: Math.min(100, t.milesDriven / plan * 100), note: Math.round(t.milesDriven / plan * 100) + '%', color: t.milesDriven > plan ? 'var(--warn)' : '' }], { max: 100 })}<div class="xs dim">Planned miles are an estimate of the route. Detours, sightseeing and wrong turns add to the real number.</div>` : ''}
      <div class="row"><button class="btn gold" data-act="rmAdd" data-k="reading">Log odometer</button><button class="btn" data-act="rmAdd" data-k="fuel" data-smoke>Log fuel-up</button></div>
      <div class="row"><button class="btn" data-act="rmAdd" data-k="exp">Add expense</button>${tr.start ? `<button class="btn" data-act="rmAll">${ui.all ? 'Hide earlier' : 'Show earlier'} entries</button>` : ''}</div></div>`;
    h += statsCard(t);
    h += `<div class="card"><div class="ct"><span>Export</span></div><p class="sm dim">Saves a CSV file you can open in a spreadsheet. Mileage rows come from your odometer readings. It is <b>for your own records</b>: not tax advice and not an official log.</p>
      <div class="row"><button class="btn" data-act="rmExport" data-k="mileage">Mileage log CSV</button><button class="btn" data-act="rmExport" data-k="exp">Expenses CSV</button></div></div>`;
    return h;
  }
  function statsCard(t) {
    const none = !t.milesDriven && !t.spend;
    if (none) return `<div class="card"><div class="ct"><span>Trip stats</span></div><p class="sm dim">Log two odometer readings or a fuel-up with its odometer and the stats appear here: miles driven, average per day, longest day, fuel cost and cost per mile.</p></div>`;
    const st = (v, l) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
    return `<div class="card"><div class="ct"><span>Trip stats</span><span class="xs dim">${t.days} day${t.days === 1 ? '' : 's'}</span></div>
      <div class="stat">${st(OA.dist(t.milesDriven, 0), 'driven')}${st(t.days ? OA.dist(t.perDay, 0) : 'n/a', 'per day')}${st(t.longestDay.mi ? OA.dist(t.longestDay.mi, 0) : 'n/a', 'longest day')}${st(OA.money(t.fuelCost), 'fuel and charging')}${st(OA.money(t.spend), 'total spent')}${st(t.perMile != null ? OA.money2(t.perMile) + '/' + dU() : 'n/a', 'cost per ' + dU())}</div>
      ${t.longestDay.mi ? `<div class="xs dim">Longest day was ${esc(fd(t.longestDay.date))}. Days with no log are shared out evenly between readings.</div>` : ''}
      ${t.avgMpg ? `<div class="kv"><span>Average mileage (fill-ups)</span><span>${esc(mpgTxt(t.avgMpg))}</span></div>` : ''}
      ${t.perPerson != null ? `<div class="kv"><span>Per person (${t.people})</span><span>${esc(OA.money(t.perPerson))}</span></div>` : ''}
      <div class="kv"><span>States seen in your log</span><span>${t.states.length ? esc(t.states.join(', ')) : 'none yet'}</span></div>
      <div class="kv"><span>Places logged</span><span>${t.places.length}</span></div></div>`;
  }

  function entryRow(kind, r, extra) {
    return `<div class="li" data-act="rmEdit" data-k="${kind}" data-id="${esc(r.id)}"><div class="tx"><b>${extra.title}</b><span>${extra.sub}</span></div><div class="end">${extra.end}</div></div>`;
  }
  function fuelSection() {
    const f = fuelRows(), v = veh(), rows = f.rows.slice().reverse(), ev = mine('ev').slice().sort(byNew), rd = mine('readings').slice().sort(byNew);
    let h = `<div class="card"><div class="ct"><span>Fuel-ups</span><button class="lnk" data-act="rmAdd" data-k="fuel">Add</button></div>`;
    if (!rows.length) h += `<p class="sm dim">No fuel-ups yet. Log each fill with the gallons, the price and your odometer. After two full fills the app shows your real mpg.</p><button class="btn gold block" data-act="rmAdd" data-k="fuel">Log a fuel-up</button>`;
    else {
      const gal = OA.sum(rows, x => x.r.gal || 0), cost = OA.sum(rows, x => x.r.total || 0);
      h += `<div class="stat"><div><b>${f.avg ? esc(OA.round(f.avg, 1)) : 'n/a'}</b><span>avg mpg</span></div><div><b>${f.last ? esc(OA.round(f.last, 1)) : 'n/a'}</b><span>last fill</span></div><div><b>${gal ? esc(money2(cost / gal)) : 'n/a'}</b><span>avg $/gal</span></div></div>
        ${f.n ? `<div class="xs dim">Best ${esc(OA.round(f.best, 1))} · worst ${esc(OA.round(f.worst, 1))} mpg over ${f.n} fill${f.n === 1 ? '' : 's'}.${v && v.mpg && f.avg ? ' You entered ' + esc(OA.round(v.mpg, 1)) + '.' : ''}${km() && f.avg ? ' ' + esc(mpgTxt(f.avg)) : ''}</div>` : '<div class="xs dim">Log one more full fill with an odometer reading to get your first mpg.</div>'}`;
      h += rows.slice(0, ui.pg.fuel * PAGE).map(x => entryRow('fuel', x.r, { title: esc(x.r.station || 'Fuel-up') + (x.r.full === false ? ' <span class="tag">top-up</span>' : ''), sub: esc(fd(x.r.date)) + ' · ' + esc(OA.round(x.r.gal || 0, 2)) + ' gal' + (x.r.ppg ? ' @ ' + esc(money2(x.r.ppg)) : '') + (x.r.odo != null ? ' · ' + esc(OA.dist(x.r.odo, 0)) : '') + (x.r.place ? ' · ' + esc(x.r.place) : ''), end: esc(money2(x.r.total)) + (x.mpg != null ? `<div class="gold">${esc(OA.round(x.mpg, 1))} mpg</div>` : '') })).join('') + more('fuel', rows.length);
    }
    h += '</div>';
    h += `<div class="card"><div class="ct"><span>EV charging</span><button class="lnk" data-act="rmAdd" data-k="ev">Add</button></div>`;
    if (!ev.length) h += '<p class="sm dim">Charging an electric or plug-in car? Log kWh and cost for each session.</p>';
    else {
      const kwh = OA.sum(ev, x => x.kwh || 0), cost = OA.sum(ev, x => x.cost || 0), od = ev.filter(x => x.odo != null).sort((a, b) => a.odo - b.odo);
      let eff = ''; if (od.length >= 2) { const mi = od[od.length - 1].odo - od[0].odo, k = OA.sum(od.slice(1), x => x.kwh || 0); if (mi > 0 && k > 0) eff = ' · about ' + OA.round(k / mi * 100, 0) + ' kWh/100 mi (rough: assumes similar charge levels)'; }
      h += `<div class="sm">${esc(OA.round(kwh, 1))} kWh · ${esc(OA.money2(cost))}${kwh ? ' · ' + esc(OA.money2(cost / kwh)) + '/kWh' : ''}${esc(eff)}</div>`;
      h += ev.slice(0, ui.pg.ev * PAGE).map(r => entryRow('ev', r, { title: esc(r.place || 'Charge'), sub: esc(fd(r.date)) + ' · ' + esc(OA.round(r.kwh || 0, 1)) + ' kWh' + (r.odo != null ? ' · ' + esc(OA.dist(r.odo, 0)) : ''), end: esc(money2(r.cost)) })).join('') + more('ev', ev.length);
    }
    h += '</div>';
    h += `<div class="card"><div class="ct"><span>Odometer log</span><button class="lnk" data-act="rmAdd" data-k="reading">Add</button></div>`;
    if (!rd.length) h += '<p class="sm dim">Note your odometer each morning or night with the place. It builds the mileage log, the longest day and the states list.</p>';
    else h += rd.slice(0, ui.pg.rd * PAGE).map(r => entryRow('reading', r, { title: esc(OA.dist(r.odo, 0)), sub: esc(fd(r.date)) + (r.place ? ' · ' + esc(r.place) : '') + (r.note ? ' · ' + esc(r.note) : ''), end: '' })).join('') + more('rd', rd.length);
    return h + '</div>';
  }
  function moneySection() {
    const t = totals(), s = S(), bud = s.budget, pp = t.people;
    let h = `<div class="card"><div class="ct"><span>Spending</span><button class="lnk" data-act="rmAdd" data-k="exp">Add expense</button></div>`;
    if (!t.spend) h += '<p class="sm dim">Nothing spent yet. Add expenses as you go, and fuel-ups from the Fuel section count automatically.</p><button class="btn gold block" data-act="rmAdd" data-k="exp">Add an expense</button>';
    else {
      h += `<div class="stat"><div><b>${esc(OA.money(t.spend))}</b><span>total</span></div><div><b>${t.days ? esc(OA.money(t.spend / t.days)) : 'n/a'}</b><span>per day</span></div><div><b>${t.perPerson != null ? esc(OA.money(t.perPerson)) : 'n/a'}</b><span>per person</span></div></div>`;
    }
    h += `<label class="fl">People sharing the costs${partyCount() ? ' (your trip plan says ' + partyCount() + ')' : ''}<input class="in" type="number" inputmode="numeric" min="1" step="1" data-bind="miles.people" data-type="number" data-then="rmRedraw" value="${esc(s.people != null ? s.people : '')}" placeholder="${partyCount() || 'e.g. 4'}"></label></div>`;
    const bAny = CATS.some(c => num(bud[c[0]]));
    h += `<div class="card"><div class="ct"><span>Budget vs actual</span><button class="lnk" data-act="rmBudget">${bAny ? 'Edit budget' : 'Set budget'}</button></div>`;
    if (!bAny) h += '<p class="sm dim">Set a budget for each kind of cost and the bars show how much is used. No budget set, so only the amounts are shown.</p>';
    const rows = CATS.filter(c => num(bud[c[0]]) || t.byCat[c[0]]).map(c => { const b = num(bud[c[0]]) || 0, a = t.byCat[c[0]] || 0; return { label: c[1], v: b ? Math.min(100, a / b * 100) : 0, note: b ? OA.money(a) + ' of ' + OA.money(b) + (a > b ? ' (over)' : '') : OA.money(a) + ' (no budget)', color: b && a > b ? 'var(--red)' : '' }; });
    if (rows.length) h += OA.chart.bars(rows, { max: 100 });
    const bt = OA.sum(CATS, c => num(bud[c[0]]) || 0);
    if (bt) h += `<div class="kv"><span>Total budget</span><span>${esc(OA.money(bt))} · ${t.spend > bt ? '<span class="red">' + esc(OA.money(t.spend - bt)) + ' over</span>' : esc(OA.money(bt - t.spend)) + ' left'}</span></div>`;
    h += '</div>';
    const dk = {}; t.lines.forEach(l => { dk[l.date] = (dk[l.date] || 0) + (l.amt || 0); });
    const days = Object.keys(dk).sort().reverse();
    if (days.length) h += `<div class="card"><div class="ct"><span>By day</span></div><div class="scroll-x"><table class="t"><tr><th>Day</th><th>Spent</th>${pp ? '<th>Each</th>' : ''}<th>Driven</th></tr>${days.slice(0, 21).map(d => `<tr><td>${esc(fd(d))}</td><td>${esc(OA.money(dk[d]))}</td>${pp ? `<td>${esc(OA.money(dk[d] / pp))}</td>` : ''}<td>${t.dayMiles[d] ? esc(OA.dist(t.dayMiles[d], 0)) : ''}</td></tr>`).join('')}</table></div>${days.length > 21 ? `<div class="xs dim">Latest 21 days shown. The CSV has everything.</div>` : ''}</div>`;
    const ex = mineAny('exp').slice().sort(byNew);
    if (ex.length) h += `<div class="card"><div class="ct"><span>Expenses</span><span class="xs dim">${ex.length}</span></div>${ex.slice(0, ui.pg.exp * PAGE).map(r => entryRow('exp', r, { title: esc(r.note || CATN[r.cat] || 'Expense'), sub: esc(fd(r.date)) + ' · ' + esc(CATN[r.cat] || r.cat) + (r.place ? ' · ' + esc(r.place) : ''), end: esc(money2(r.amt)) })).join('')}${more('exp', ex.length)}</div>`;
    return h;
  }

  /* ----- tools: cost to drive, checklist, service reminders ----- */
  const CHECK = [
    ['Tires and wheels', [['t1', 'Tire pressure checked cold, including the spare. Use the number on the placard in the driver door jamb or the owner manual, not the tire sidewall.'], ['t2', 'Tread: put a penny in the groove head first. If you can see all of Lincoln\'s head, the tread is about 2/32 inch or less and the tire needs replacing.'], ['t3', 'No bulges, cracks or nails. Lug nuts snug. Jack and lug wrench present and you know where they are.']]],
    ['Under the hood', [['e1', 'Oil level checked, and the oil change is not overdue (see the reminders below).'], ['e2', 'Coolant, brake fluid and washer fluid topped up.'], ['e3', 'Battery terminals clean and tight. Belts and hoses look fine.']]],
    ['See and be seen', [['s1', 'All lights work: headlights, brake lights, turn signals, hazards.'], ['s2', 'Wipers are not streaking. Windshield and mirrors clean.'], ['s3', 'Brakes feel firm, with no grinding or pulling.']]],
    ['Carry', [['c1', 'Registration, insurance card and roadside assistance number on you.'], ['c2', 'Phone charger, jumper cables or jump pack, flashlight, first aid kit.'], ['c3', 'Water, snacks and a blanket in the car in case you are stuck for hours.'], ['c4', 'A paper map or an offline map of the route for the stretches with no signal.']]],
    ['Towing or RV', [['r1', 'Hitch pinned and locked, safety chains crossed, breakaway cable attached.'], ['r2', 'Trailer lights and brakes tested. Tires and spare checked, including the trailer.'], ['r3', 'Load is within the vehicle tow rating and the tongue weight is in your manual\'s range. Know your height, for low bridges.'], ['r4', 'Propane off while driving and everything inside latched and stowed.']]]
  ];
  function calcOut() {
    const s = S(), c = s.calc, v = veh(), ri = routeInfo(), elec = isElec(v);
    let mi = num(c.miles); if (mi == null) mi = ri.mi;
    const pen = OA.clamp(num(c.pen) || 0, 0, 80), fRows = fuelRows(), last = s.fuel.filter(r => r.ppg).sort(byNew)[0];
    let price = num(c.price); if (price == null && last) price = last.ppg;
    const base = num(c.mpg) != null ? num(c.mpg) : (fRows.avg || (v ? mpgOf(v) : null));
    if (!mi || !price || !base) return '<div class="sm dim">Fill in the distance, the price and the mileage to see the cost.</div>';
    const trips = c.round ? 2 : 1, tot = mi * trips, eff = base * (1 - pen / 100);
    let cost, line;
    if (elec && v.kwh100) { const kwh = tot / 100 * v.kwh100 / (1 - pen / 100); cost = kwh * price; line = `${OA.round(kwh, 0)} kWh at ${OA.money2(price)} per kWh`; }
    else { const gal = tot / eff; cost = gal * price; line = `${OA.round(gal, 1)} gal at ${OA.money2(price)}, using ${OA.round(eff, 1)} mpg`; }
    const range = v && v.tank && !elec ? eff * v.tank * 0.85 : null;
    return `<div class="big-num">${esc(OA.money(cost))}</div><div class="sm">${esc(OA.dist(tot, 0))} · ${esc(line)}</div>${range ? `<div class="sm dim">Plan to refuel about every ${esc(OA.dist(range, 0))}: that uses 85% of the tank, which leaves a margin. About ${Math.max(1, Math.ceil(tot / range))} stop${Math.ceil(tot / range) === 1 ? '' : 's'} for this drive.</div>` : ''}${pen ? `<div class="xs dim">Includes your ${pen}% penalty for towing, loads, mountains or headwind.</div>` : ''}`;
  }
  function toolsSection() {
    const s = S(), c = s.calc, v = veh(), ri = routeInfo(), elec = isElec(v);
    const last = s.fuel.filter(r => r.ppg).sort(byNew)[0], fRows = fuelRows();
    const mpgShow = num(c.mpg) != null ? c.mpg : (fRows.avg ? OA.round(fRows.avg, 1) : (v && mpgOf(v) ? OA.round(mpgOf(v), 1) : ''));
    let h = `<div class="card"><div class="ct"><span>Cost to drive</span></div>
      <div class="two"><label class="fl">Distance (${dU()})<input class="in" id="rm-c-mi" type="number" inputmode="decimal" step="any" data-onchange="rmCalc" value="${esc(c.miles != null ? dOut(c.miles) : (ri.mi ? dOut(ri.mi) : ''))}" placeholder="${ri.mi ? 'from your route' : 'e.g. 600'}"></label>
      <label class="fl">${elec ? 'Price per kWh ($)' : 'Price per gallon ($)'}<input class="in" id="rm-c-pr" type="number" inputmode="decimal" step="any" data-onchange="rmCalc" value="${esc(c.price != null ? c.price : (last ? last.ppg : ''))}" placeholder="3.85"></label></div>
      <div class="two"><label class="fl">${elec ? 'Uses the vehicle kWh/100 mi' : 'Miles per gallon'}<input class="in" id="rm-c-mpg" type="number" inputmode="decimal" step="any" data-onchange="rmCalc" value="${elec ? '' : esc(mpgShow)}" ${elec ? 'disabled' : ''}></label>
      <label class="fl">Penalty % (towing, load, wind)<input class="in" id="rm-c-pen" type="number" inputmode="numeric" step="1" min="0" max="80" data-onchange="rmCalc" value="${esc(c.pen || 0)}"></label></div>
      <label class="chk"><input type="checkbox" id="rm-c-rt" data-onchange="rmCalc" ${c.round ? 'checked' : ''}> Round trip (double the distance)</label>
      <div id="rm-calc-out" class="rm-out">${calcOut()}</div>
      <div class="xs dim">${v && (v.tow || v.type === 'rv' || v.type === 'tow') ? 'You tow or drive an RV: ' : ''}Towing a trailer or driving an RV usually cuts mileage a lot, especially at highway speed, uphill and into wind. The penalty is your own guess: your logged fill-ups show the real number. The mileage here comes from your fill-ups when you have them, then from the vehicle you entered. Fuel price is the last one you logged unless you type one.</div></div>`;
    const done = Object.keys(s.chk).filter(k => s.chk[k]).length, total = OA.sum(CHECK, g_ => g_[1].length);
    h += `<div class="card"><div class="ct"><span>Before a long trip</span><span class="xs dim" id="rm-chk-n">${done} of ${total}</span></div>${CHECK.map(g_ => `<h3 class="gold">${esc(g_[0])}</h3>${g_[1].map(i => `<label class="chk"><input type="checkbox" data-bind="miles.chk.${i[0]}" data-type="bool" data-then="rmChk" ${s.chk[i[0]] ? 'checked' : ''}><span>${esc(i[1])}</span></label>`).join('')}`).join('')}
      <div class="row"><button class="btn" data-act="rmChkReset">Clear the ticks</button></div><div class="xs dim">A general list, not a mechanic's inspection. If something looks wrong, have a shop look at it before you leave.</div></div>`;
    const cur = curOdo();
    h += `<div class="card"><div class="ct"><span>Service reminders</span><button class="lnk" data-act="rmAdd" data-k="svc">Add</button></div>`;
    if (!s.service.length) h += '<p class="sm dim">Add oil changes, tire rotations and anything else with a mileage interval. The reminder counts down from your odometer.</p><button class="btn gold block" data-act="rmAdd" data-k="svc">Add a reminder</button>';
    else h += s.service.slice().map(r => {
      const next = (r.last || 0) + (r.every || 0), left = next - (cur != null ? cur : (r.last || 0)), soon = Math.min(500, (r.every || 0) * 0.1);
      const tag = cur == null ? '<span class="tag">log an odometer</span>' : left < 0 ? `<span class="tag r">overdue ${esc(OA.dist(-left, 0))}</span>` : left <= soon ? `<span class="tag w">due in ${esc(OA.dist(left, 0))}</span>` : `<span class="tag g">${esc(OA.dist(left, 0))} to go</span>`;
      return `<div class="li" data-act="rmEdit" data-k="svc" data-id="${esc(r.id)}"><div class="tx"><b>${esc(r.name)}</b><span>Every ${esc(OA.dist(r.every || 0, 0))} · last at ${esc(OA.dist(r.last || 0, 0))} · due at ${esc(OA.dist(next, 0))}</span>${r.note ? `<span>${esc(r.note)}</span>` : ''}</div><div class="end">${tag}<div><button class="mini" data-act="rmSvcDone" data-id="${esc(r.id)}">Done now</button></div></div></div>`;
    }).join('');
    return h + '</div>';
  }

  OA.tab({
    id: 'miles', label: 'Miles', icon: 'fuel', order: 30,
    render() {
      const v = veh();
      return OA.header('Miles', v ? v.name + (curOdo() != null ? ' · ' + OA.dist(curOdo(), 0) : '') : 'Vehicle, fuel and costs') +
        `<div class="chips rm-sec">${chipS('trip', 'Trip')}${chipS('fuel', 'Fuel')}${chipS('money', 'Money')}${chipS('tools', 'Tools')}</div>` +
        `<div id="rm-body">${sec('fuel') ? fuelSection() : sec('money') ? moneySection() : sec('tools') ? toolsSection() : tripSection()}</div>` +
        '<div class="foot">Your numbers stay on this phone. Costs and mileage are only as good as what you log.</div>';
    }
  });

  /* ---------------------------------------------------------------- saving */
  function saveForm() {
    const e = ui.edit; if (!e) return; const s = S(), kind = e.kind, list = s[KEYS[kind]];
    let rec = e.id ? list.find(x => x.id === e.id) : null; const isNew = !rec; if (isNew) rec = { id: OA.uid(), ts: Date.now() };
    const bad = m => { OA.toast(m, 3500); return false; };
    if (kind === 'reading') {
      const odo = dIn(gn('odo')); if (odo == null || odo < 0) return bad('Enter the odometer reading.');
      Object.assign(rec, { date: okDate(g('date')), odo, place: g('place').trim(), note: g('note').trim(), veh: rec.veh != null ? rec.veh : vid() });
    } else if (kind === 'fuel') {
      const gal = gn('gal'); if (!gal || gal <= 0) return bad('Enter the gallons.');
      let ppg = gn('ppg'), total = gn('total');
      if (ppg == null && total != null) ppg = total / gal; if (total == null && ppg != null) total = ppg * gal;
      Object.assign(rec, { date: okDate(g('date')), gal, ppg, total: total || 0, odo: dIn(gn('odo')), station: g('station').trim(), place: g('place').trim(), full: !!OA.$('#mf-full').checked, veh: rec.veh != null ? rec.veh : vid() });
    } else if (kind === 'ev') {
      const kwh = gn('kwh'); if (!kwh || kwh <= 0) return bad('Enter the kWh added.');
      Object.assign(rec, { date: okDate(g('date')), kwh, cost: gn('cost') || 0, odo: dIn(gn('odo')), place: g('place').trim(), veh: rec.veh != null ? rec.veh : vid() });
    } else if (kind === 'exp') {
      const amt = gn('amt'); if (amt == null || amt <= 0) return bad('Enter the amount.');
      Object.assign(rec, { date: okDate(g('date')), amt, cat: g('cat') || 'food', note: g('note').trim(), place: g('place').trim() });
    } else if (kind === 'veh') {
      const name = g('name').trim(); if (!name) return bad('Give the vehicle a name.');
      const fuel = g('fuel') || 'gas', mpg = gn('mpg'), kwh100 = gn('kwh100');
      if (fuel === 'electric' && !kwh100) return bad('Enter kWh per 100 miles for an electric vehicle.');
      if (fuel !== 'electric' && !mpg) { if (fuel !== 'phev' || !kwh100) return bad('Enter the miles per gallon (your best real-world guess).'); }
      Object.assign(rec, { name, type: g('type'), fuel, mpg, kwh100, tank: gn('tank'), batt: gn('batt'), odo: dIn(gn('odo')), tow: !!OA.$('#mf-tow').checked });
    } else if (kind === 'svc') {
      const name = g('name').trim(), every = dIn(gn('every')); if (!name) return bad('What needs doing?'); if (!every || every <= 0) return bad('Enter how often (distance between jobs).');
      Object.assign(rec, { name, every, last: dIn(gn('last')) || 0, note: g('note').trim(), lastDate: rec.lastDate || today() });
    }
    if (isNew) { if (kind === 'veh' || kind === 'svc') list.push(rec); else list.push(rec); }
    if (kind === 'veh') { if (isNew && !list.some(v_ => v_.id !== rec.id)) { ['readings', 'fuel', 'ev'].forEach(k => s[k].forEach(r => { if (!r.veh) r.veh = rec.id; })); } if (isNew) s.veh = rec.id; }
    OA.save();
    let msg = TITLES[kind] + ' saved.';
    if (kind === 'fuel') { const x = fuelRows().rows.find(q => q.r.id === rec.id); if (x && x.mpg != null) msg = 'Saved: ' + OA.round(x.mpg, 1) + ' mpg on that fill.'; }
    OA.toast(msg); OA.closeSheet();
  }

  OA.act({
    rmSec(el) { S().sec = el.dataset.s; OA.saveSoon(); OA.render(true); },
    rmAdd(el) { openForm(el.dataset.k); },
    rmEdit(el, ev) { if (ev && ev.target.closest('[data-act="rmSvcDone"]')) return; openForm(el.dataset.k, el.dataset.id); },
    rmSave() { saveForm(); },
    async rmDel() {
      const e = ui.edit; if (!e || !e.id) return; if (!await OA.confirm('Delete this ' + TITLES[e.kind].toLowerCase() + '? This cannot be undone.', 'Delete')) return;
      const s = S(), k = KEYS[e.kind]; s[k] = s[k].filter(x => x.id !== e.id);
      if (e.kind === 'veh' && s.veh === e.id) s.veh = s.vehicles[0] ? s.vehicles[0].id : '';
      OA.save(); OA.closeSheet();
    },
    rmMore(el) { ui.pg[el.dataset.k] = (ui.pg[el.dataset.k] || 1) + 1; OA.render(true); },
    rmAll() { ui.all = !ui.all; OA.render(true); },
    rmRedraw() { OA.render(true); },
    rmChk() { const n = Object.keys(S().chk).filter(k => S().chk[k]).length, e = OA.$('#rm-chk-n'); if (e) e.textContent = n + ' of ' + OA.sum(CHECK, g_ => g_[1].length); },
    rmChkReset() { S().chk = {}; OA.save(); OA.render(true); },
    rmSvcName(el) { const i = OA.$('#mf-name'); if (i) i.value = el.dataset.n; },
    rmSvcDone(el) { const r = S().service.find(x => x.id === el.dataset.id), c = curOdo(); if (!r) return; if (c == null) { OA.toast('Log your odometer first, so the app knows where you are.'); return; } r.last = c; r.lastDate = today(); OA.save(); OA.toast(r.name + ' marked done at ' + OA.dist(c, 0) + '.'); OA.render(true); },
    rmFromTrip() { const tv = tripVeh(); if (!tv) return; const tp = String(tv.type || 'car').toLowerCase(), t0 = VTYPES.some(t => t[0] === tp) ? tp : 'car', ev = t0 === 'ev'; openForm('veh'); const set = (id, v) => { const e = OA.$('#mf-' + id); if (e && v != null) e.value = v; }; set('name', 'My vehicle'); set('type', t0); set('fuel', ev ? 'electric' : 'gas'); if (ev) set('kwh100', OA.round(3370 / tv.mpg, 0)); else { set('mpg', num(tv.mpg)); set('tank', num(tv.tankGal)); } },
    rmSwitch() {
      const s = S();
      OA.sheet('Switch vehicle', `<div class="card">${s.vehicles.map(v => `<div class="li" data-act="rmPickVeh" data-id="${esc(v.id)}"><div class="tx"><b>${esc(v.name)}</b><span>${esc(mpgTxt(mpgOf(v)))}</span></div><div class="end">${v.id === vid() ? '<span class="tag g">in use</span>' : ''}</div></div>`).join('')}</div>`);
    },
    rmPickVeh(el) { S().veh = el.dataset.id; OA.save(); OA.closeSheet(); },
    rmTripStart() {
      const cur = curOdo(), tr = T();
      OA.sheet('Trip start', `<div class="card"><p class="sm">Totals and stats count from this day and odometer. Older entries are kept, just hidden (use "Show earlier entries" to see them).</p>${fld('Start date', 'date', tr.start || today(), { type: 'date' })}${fld('Start odometer (' + dU() + ')', 'odo', tr.startOdo != null ? dOut(tr.startOdo) : (cur != null ? dOut(cur) : ''))}<button class="btn gold block" data-act="rmTripSave">Save</button>${tr.start || tr.startOdo != null ? '<button class="btn danger block" data-act="rmTripClear">Clear the start</button>' : ''}</div>`);
    },
    rmTripSave() { const t = T(); t.start = okDate(g('date')); t.startOdo = dIn(gn('odo')); OA.save(); OA.closeSheet(); },
    rmTripClear() { const t = T(); t.start = ''; t.startOdo = null; ui.all = false; OA.save(); OA.closeSheet(); },
    rmBudget() {
      const b = S().budget;
      OA.sheet('Budget', `<div class="card"><p class="sm dim">Dollars for the whole trip. Leave blank for no budget.</p>${CATS.map(c => fld(c[1], 'b-' + c[0], b[c[0]], { ph: '0' })).join('')}<button class="btn gold block" data-act="rmBudgetSave">Save budget</button></div>`);
    },
    rmBudgetSave() { const b = S().budget; CATS.forEach(c => { const v = gn('b-' + c[0]); if (v && v > 0) b[c[0]] = v; else delete b[c[0]]; }); OA.save(); OA.closeSheet(); },
    rmCalc() {
      const c = S().calc, v = id => num((OA.$('#' + id) || {}).value);
      c.miles = dIn(v('rm-c-mi')); c.price = v('rm-c-pr'); c.mpg = v('rm-c-mpg'); c.pen = v('rm-c-pen') || 0; c.round = !!(OA.$('#rm-c-rt') || {}).checked;
      OA.saveSoon(); const o = OA.$('#rm-calc-out'); if (o) o.innerHTML = calcOut();
    },
    async rmHere(el) {
      const inp = OA.$('#mf-place'); if (!inp) return; OA.toast('Finding where you are…');
      try {
        const f = await OA.geo.position({ timeout: 10000 }); let txt = '';
        if (OA.online()) { try { const r = await OA.reverse(f.lat, f.lon), code = STATES[String(r.state || '').toLowerCase()]; txt = [r.town, code || r.state].filter(Boolean).join(', '); } catch (e) { txt = ''; } }
        inp.value = txt || OA.geo.fmtCoord(f.lat, f.lon, 'dd'); if (!txt) OA.toast('No signal for the town name, so the coordinates are filled in. Edit if you like.', 4000);
      } catch (e) { OA.toast(e.message, 4000); }
      void el;
    },
    rmExport(el) { if (el.dataset.k === 'mileage') exportMileage(); else exportExpenses(); }
  });
})();
