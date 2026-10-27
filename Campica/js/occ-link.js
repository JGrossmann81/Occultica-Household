/* Occultica household link: the same file ships in Healthica, Hortica and Saturnica.
   Each app publishes a SMALL summary of what its sister apps need (never full health records).
   Same site (Occultica Household launcher): apps read each other's summaries automatically.
   Separate sites or phones: copy a household link code in one app and paste it into another.
   Summary shapes (data):
   healthica: { people:[names], week:{cost, meals, gardenSaved, list:[{name,cost,garden}]}, gardenRecipes:[{n, uses:[words]}],
                healthIdeas:[{kind:'generic'|'gym'|'supp', text}], homegrown:{month, servings, grams}, events:[{t,d,time?,kind,who?}] }
   hortica:   { harvest:[{id,n,q,u,d,val}], ripe:[{id,n,until}], value30, valueYear, events:[{t,d,kind:'garden'}] }
   saturnica: { groceryWeek, diningWeek, health:{insurance, meds, gym}, events:[{t,d,kind:'pay'|'bill',amt?}] }
   backpackica: { trail, day, milesToday, milesTotal, packLb, kcalBurnDay, kcalTargetDay, nextTown:{name,mi,date}, events:[{t,d,kind:'trail'}] }
   campica:   { next:{place,from,to,nights}, saved, events:[{t,d,kind:'camp'}] }
   roadtripica: { trip:{name,days,miles,cost}, events:[{t,d,kind:'trip'}] }
   expandica: { stops:[{name,state,stage,lat,lon}], owned, next:{name,state,stage}, savings:{goal,saved}, events:[{t,d,kind:'land'}] }
   healthica (optional addition read by Backpackica): body:{kg, tdee, kcalTarget, units}
   chorica:   { kids:[names], owed, paidMonth, earnedMonth, waiting, weekValue, events:[{t:'Chore payday',d,kind:'pay'}] } (parent phone only) */
(function () {
  const OCC = window.OCC = {};
  OCC.APPS = { healthica: { name: 'Healthica', path: 'Healthica', glyph: '⚕', what: 'body' }, hortica: { name: 'Hortica', path: 'Hortica', glyph: '🌿', what: 'garden' }, saturnica: { name: 'Saturnica', path: 'Saturnica', glyph: '🪐', what: 'money' }, chorica: { name: 'Chorica', path: 'Chorica', glyph: '🧹', what: 'chores' }, backpackica: { name: 'Backpackica', path: 'Backpackica', glyph: '🥾', what: 'trail' }, campica: { name: 'Campica', path: 'Campica', glyph: '⛺', what: 'camping' }, roadtripica: { name: 'Roadtripica', path: 'Roadtripica', glyph: '🚐', what: 'road trips' }, expandica: { name: 'Expandica', path: 'Expandica', glyph: '🏡', what: 'family land' } };
  const PUB = a => 'occ.pub.' + a;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } };
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OCC.esc = e;
  OCC.publish = function (app, data) { const o = { app, v: 1, ts: Date.now(), data }; ls.set(PUB(app), JSON.stringify(o)); return o; };
  OCC.get = function (app) { try { const o = JSON.parse(ls.get(PUB(app)) || 'null'); return o && o.data ? o : null; } catch (x) { return null; } };
  OCC.ago = function (ts) { const m = Math.round((Date.now() - ts) / 60000); if (m < 2) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; const d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago'); };
  OCC.linked = function (self) { return Object.keys(OCC.APPS).filter(a => a !== self && OCC.get(a)); };


  /* ---- shared saved places (same site only: all apps on one Netlify site share this localStorage key) ----
     Place: {id,name,lat,lon,state,kind:'camp'|'parcel'|'stop'|'food'|'sight'|'other',ref,from,note,ts}
     OCC.places.list(kind?) / add(p) -> place (dedupes on ref, else same name within ~0.3 mi) / remove(id) / byRef(ref) / has(ref) */
  const PKEY = 'occ.places';
  const pread = () => { try { const a = JSON.parse(ls.get(PKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (x) { return []; } };
  const pwrite = a => ls.set(PKEY, JSON.stringify(a.slice(0, 500)));
  const num = v => typeof v === 'number' && isFinite(v);
  const mi = (a, b) => { const R = 3958.8, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  OCC.places = {
    list(kind) { const a = pread(); return kind ? a.filter(p => p.kind === kind) : a; },
    byRef(ref) { return pread().find(p => ref && p.ref === ref) || null; },
    has(ref) { return !!OCC.places.byRef(ref); },
    add(p) {
      if (!p || !String(p.name || '').trim()) return null;
      const a = pread(); let o = p.ref && a.find(x => x.ref === p.ref);
      if (!o && num(p.lat) && num(p.lon)) o = a.find(x => num(x.lat) && num(x.lon) && x.name === p.name && mi(x, p) < 0.3);
      if (o) { Object.assign(o, { lat: num(p.lat) ? p.lat : o.lat, lon: num(p.lon) ? p.lon : o.lon, note: p.note || o.note }); pwrite(a); return o; }
      o = { id: 'pl' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: String(p.name).slice(0, 120), lat: num(p.lat) ? p.lat : null, lon: num(p.lon) ? p.lon : null, state: p.state || '', kind: p.kind || 'other', ref: p.ref || '', from: p.from || '', note: String(p.note || '').slice(0, 300), ts: Date.now() };
      a.unshift(o); pwrite(a); return o;
    },
    remove(id) { pwrite(pread().filter(p => p.id !== id)); },
    miles: mi
  };

  /* ---- link codes ---- */
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  async function gz(u8, dir) { const S = dir ? CompressionStream : DecompressionStream; return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new S('gzip'))).arrayBuffer()); }
  OCC.code = async function (app) {
    const o = OCC.get(app); if (!o) throw new Error('Nothing to share yet.'); const raw = new TextEncoder().encode(JSON.stringify(o));
    if (typeof CompressionStream === 'function') { try { return 'OCCLINKZ1:' + b64(await gz(raw, true)); } catch (x) { } }
    return 'OCCLINK1:' + b64(raw);
  };
  OCC.accept = async function (code, self) {
    code = String(code || '').replace(/\s+/g, ''); let o;
    if (code.startsWith('OCCLINKZ1:')) { if (typeof DecompressionStream !== 'function') throw new Error('Update your browser to read this code.'); o = JSON.parse(new TextDecoder().decode(await gz(unb64(code.slice(10)), false))); }
    else if (code.startsWith('OCCLINK1:')) o = JSON.parse(new TextDecoder().decode(unb64(code.slice(9))));
    else throw new Error('That is not a household link code. Make one in any Occultica app.');
    if (!o || !OCC.APPS[o.app] || !o.data) throw new Error('That code is damaged. Copy the whole thing.');
    if (o.app === self) throw new Error('That code came from this app. Paste it into a sister app instead.');
    ls.set(PUB(o.app), JSON.stringify(o)); return o;
  };

  /* ---- ritual of the day (planetary day rulers) ---- */
  const RIT = [
    ['Sun', '☉', 'shine', 'Ten minutes of morning daylight, then a long, easy walk.', 'Harvest something and share it.', 'Write down one money win from this week.', 'Family reset: everyone tidies one room for 15 minutes.'],
    ['Moon', '☽', 'tend', 'Prep a few meals for the week and drink your water.', 'Water deeply and check on seedlings.', 'Plan this week\'s groceries and bills.', 'Laundry day: wash, fold, put away.'],
    ['Mars', '♂', 'strength', 'Your hardest workout of the week.', 'Weed, dig, or turn the compost.', 'Make one extra payment on your smallest debt, even $5.', 'Take on the tough job: bathrooms, oven or garage.'],
    ['Mercury', '☿', 'measure', 'Weigh in, log your food, check your numbers.', 'Walk the beds: notes, photos, pest check.', 'Track spending against the budget.', 'Check the chore list: approve, send updates.'],
    ['Jupiter', '♃', 'grow', 'Cook one new healthy recipe.', 'Feed the soil or plant something new.', 'Move a little into savings or investing.', 'Teach someone a new chore.'],
    ['Venus', '♀', 'enjoy', 'Stretch, rest, and enjoy a planned treat.', 'Cut flowers or herbs and enjoy the space.', 'One budgeted pleasure, guilt-free.', 'Fresh sheets and flowers on the table.'],
    ['Saturn', '♄', 'order', 'Recover: sleep in, stretch, tidy the kitchen.', 'Prune, repair, clean and oil the tools.', 'Review subscriptions and cancel one you do not use.', 'Trash, recycling, and declutter one drawer.']
  ];
  OCC.ritual = function (d) { const r = RIT[(d || new Date()).getDay()]; return { planet: r[0], glyph: r[1], theme: r[2], body: r[3], garden: r[4], money: r[5], home: r[6] }; };
  OCC.ritualHTML = function (self) {
    const r = OCC.ritual(), lead = { healthica: 'body', hortica: 'garden', saturnica: 'money', chorica: 'home', backpackica: 'body', campica: 'garden', roadtripica: 'home', expandica: 'money' }[self] || 'body';
    const row = (k, ic, lab) => `<div class="sm" style="margin:3px 0${k === lead ? ';font-weight:700' : ''}">${ic} <b>${lab}:</b> ${e(r[k])}</div>`;
    return `<section class="card occ-rit"><div class="ct"><span>${r.glyph} Ritual of the day</span><span class="sm dim">Day of ${r.planet}: ${r.theme}</span></div>
      ${row('body', '⚕', 'Body')}${row('garden', '🌿', 'Garden')}${row('money', '🪐', 'Money')}${row('home', '🧹', 'Home')}
      <div class="sm dim" style="margin-top:4px">The same ritual shows in every Occultica app today.</div></section>`;
  };

  /* ---- shared calendar ---- */
  const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const ymd = d => d.replace(/-/g, '');
  OCC.events = function () {
    const out = [];
    Object.keys(OCC.APPS).forEach(a => { const o = OCC.get(a); ((o && o.data && o.data.events) || []).forEach(ev => { if (ev && ev.d && /^\d{4}-\d{2}-\d{2}$/.test(ev.d)) out.push(Object.assign({ app: a }, ev)); }); });
    return out.sort((x, y) => (x.d + (x.time || '')) < (y.d + (y.time || '')) ? -1 : 1);
  };
  OCC.calendarICS = function () {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Occultica//Household//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Occultica household'], st = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    OCC.events().forEach((ev, i) => {
      const A = OCC.APPS[ev.app], title = A.glyph + ' ' + ev.t + (ev.who ? ' (' + ev.who + ')' : '') + (ev.amt ? ' $' + Math.round(ev.amt) : '');
      L.push('BEGIN:VEVENT', 'UID:occ-' + ev.app + '-' + ymd(ev.d) + '-' + i + '-' + (ev.t || '').replace(/\W+/g, '').slice(0, 20) + '@occultica', 'DTSTAMP:' + st);
      if (ev.time && /^\d{2}:\d{2}$/.test(ev.time)) { const t = ev.time.replace(':', '') + '00', h = +ev.time.slice(0, 2), end = String(Math.min(23, h + 1)).padStart(2, '0') + ev.time.slice(3) + '00'; L.push('DTSTART:' + ymd(ev.d) + 'T' + t, 'DTEND:' + ymd(ev.d) + 'T' + end); }
      else { const n = new Date(ev.d + 'T12:00:00'); n.setDate(n.getDate() + 1); L.push('DTSTART;VALUE=DATE:' + ymd(ev.d), 'DTEND;VALUE=DATE:' + n.toISOString().slice(0, 10).replace(/-/g, '')); }
      L.push('SUMMARY:' + icsEsc(title), 'DESCRIPTION:' + icsEsc('From ' + A.name + '. Day of ' + OCC.ritual(new Date(ev.d + 'T12:00:00')).planet + '.'));
      if (ev.time && ev.kind === 'appt') L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(title), 'TRIGGER:-PT2H', 'END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR'); return L.join('\r\n');
  };
  OCC.downloadCalendar = function () {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([OCC.calendarICS()], { type: 'text/calendar' })); a.download = 'occultica-household.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  };

  /* ---- household sheet (same in every app) ---- */
  OCC.sheetHTML = function (self) {
    const rows = Object.keys(OCC.APPS).map(a => { const A = OCC.APPS[a], o = OCC.get(a); return `<div class="sm" style="margin:4px 0">${A.glyph} <b>${A.name}</b> · ${a === self ? 'this app' : o ? 'linked, updated ' + OCC.ago(o.ts) : '<span class="dim">not linked yet</span>'}</div>`; }).join('');
    const ev = OCC.events().filter(x => x.d >= new Date().toISOString().slice(0, 10)).slice(0, 6);
    return `<p class="sm dim">Healthica (body), Hortica (garden), Saturnica (money), Chorica (chores), Backpackica (trail), Campica (camping) and Roadtripica (road trips) share a small summary with each other: harvests, grocery and health costs, budget numbers, chore money and dates. Never your full health records.</p>
      ${rows}
      <section class="card inner"><div class="ct"><span>Automatic</span></div><div class="sm dim">Install the Occultica Household app (one icon for all of them) and they stay linked by themselves. See HOW-TO-INSTALL in the Occultica-Household folder.</div></section>
      <section class="card inner"><div class="ct"><span>Link by code</span></div><div class="sm dim">Using separate apps or phones? Copy this app's code, open a sister app, Menu > Household, and paste it. Repeat now and then to refresh.</div>
        <button class="btn gold block" data-act="occCopy">Copy ${OCC.APPS[self].name} link code</button><div id="occout"></div>
        <textarea id="occin" class="in" rows="3" placeholder="Paste a code from a sister app"></textarea><button class="btn block" data-act="occPaste">Link from code</button></section>
      <section class="card inner"><div class="ct"><span>Household calendar</span></div><div class="sm dim">One calendar file with ${OCC.linked(self).length ? 'paydays, bills, planting and harvest days, appointments' : 'this app\'s dates (link the others to add theirs)'}. Add it to your phone calendar for alarms.</div>
        ${ev.length ? ev.map(x => `<div class="sm">${OCC.APPS[x.app].glyph} ${e(x.d)}${x.time ? ' ' + e(x.time) : ''} · ${e(x.t)}</div>`).join('') : ''}
        <button class="btn block" data-act="occCal">Save household calendar file</button></section>
      ${OCC.ritualHTML(self)}`;
  };
  OCC.bind = function (ACT, self, refresh) {
    Object.assign(ACT, {
      occOpen() { refresh && refresh('publish'); openSheet('Occultica household', OCC.sheetHTML(self)); },
      async occCopy() {
        refresh && refresh('publish'); const out = document.getElementById('occout');
        try { const c = await OCC.code(self); out.innerHTML = `<textarea class="in" rows="3" readonly id="occcode">${e(c)}</textarea>`; try { await navigator.clipboard.writeText(c); toast('Code copied. Paste it into a sister app.'); } catch (x) { const t = document.getElementById('occcode'); t.focus(); t.select(); } }
        catch (x) { out.innerHTML = `<div class="sm warn">${e(x.message)}</div>`; }
      },
      async occPaste() { try { const o = await OCC.accept(document.getElementById('occin').value, self); toast(OCC.APPS[o.app].name + ' linked.'); refresh && refresh('linked'); openSheet('Occultica household', OCC.sheetHTML(self)); } catch (x) { toast(x.message, 5000); } },
      occCal() { refresh && refresh('publish'); OCC.downloadCalendar(); toast('Calendar file saved. Open it to add the dates.'); }
    });
  };

  /* ---- "back to household" button when running inside the launcher ---- */
  OCC.homeButton = function () {
    if (ls.get('occ.home') !== '1' || !/\/(Healthica|Hortica|Saturnica|Chorica|Backpackica|Campica|Roadtripica)\//i.test(location.pathname) || document.getElementById('occhome')) return;
    const a = document.createElement('a'); a.id = 'occhome'; a.href = '../index.html'; a.textContent = '⌂'; a.setAttribute('aria-label', 'Occultica household');
    a.style.cssText = 'position:fixed;left:10px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:40;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,16,36,.85);border:1px solid #c9a24a;color:#e2bf68;font-size:20px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.4)';
    document.body.appendChild(a);
  };
  window.addEventListener('DOMContentLoaded', () => setTimeout(OCC.homeButton, 300));
})();
