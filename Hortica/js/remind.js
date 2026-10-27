/* Hortica reminders. A phone web app cannot wake itself in the background without a server, so Hortica does two honest things:
   (1) builds a calendar file (.ics) with real alarms that your phone or PC calendar delivers on its own, and
   (2) shows a daily digest in the app and, if you allow it, a notification when you open it. */
const icsEsc = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const icsD = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
const icsT = d => d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0') + 'T' + String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0') + '00Z';
function reminderEvents(days) {
  const now = NOW(), end = addD(now, days || 60), ev = [], W = wxSummary();
  const day = (d, title, desc, alarm) => ev.push({ day: d, title, desc, alarm });
  if (W) W.days.slice(0, 10).forEach(x => { if (x.lo <= 34) day(pd(x.d), '🥶 Frost tonight: cover tender plants', 'Forecast low ' + Math.round(x.lo) + 'F. Cover tomatoes, peppers, basil and squash at dusk and water the soil first.', -360); if (x.hi >= 97) day(pd(x.d), '🔥 Heat wave: water early, shade seedlings', 'Forecast high ' + Math.round(x.hi) + 'F.', 360); if (x.rain >= 1.2) day(pd(x.d), '🌧 Heavy rain expected: skip watering', Math.round(x.rain * 10) / 10 + ' in forecast.', 360); });
  const F = frostDates(); if (!F.free) { [[F.last, '🌱 Average last spring frost', 'Tender crops can go out after this date, if the forecast agrees.'], [F.first, '🍂 Average first fall frost', 'Pick tomatoes and peppers, cover or bring in tender plants.']].forEach(a => { if (a[0] >= now && a[0] <= end) day(a[0], a[1], a[2], 540); }); }
  const seen = {}; plantGardens().forEach(g => gardenCounts(g).forEach(o => { const p = PBY[o.id]; if (!p || seen[o.id]) return; seen[o.id] = 1; const D = plantDates(p);
    if (o.grow < o.tiles) D.steps.forEach(s => { if (s.date >= now && s.date <= end) day(s.date, '🌱 ' + s.label + ': ' + p.n, 'Window ' + fmtD(s.date) + ' to ' + fmtD(s.end) + '. Open Hortica for the best hour.', 540); });
    if (o.grow > 0) { const c = Object.keys(g.cells).map(k => g.cells[k]).find(c => c.p === o.id && c.d); if (c && !permLike(p)) { const hs = addD(pd(c.d), p.days); if (hs >= now && hs <= end) day(hs, '🧺 ' + (p.cat === 'fl' ? 'Blooms due: ' : 'Harvest due: ') + p.n, 'About ' + p.days + ' days after planting.', 540); } } }));
  const timed = []; Object.keys(seen).slice(0, 6).forEach(id => { const p = PBY[id], w = plantWindow(p); if (w && w.state === 'now') { const b = bestTimes(p, 'sow', { days: 7 })[0]; if (b && b.stars >= 3) timed.push({ start: b.start, end: b.end, title: PSYM[b.planet] + ' Best hour to plant ' + p.n, desc: whenText(b) + ' (' + b.planet + ' hour, ' + b.moon.name + ' in ' + b.moon.sign + '). Tradition, not law: frost and rain come first.' }); } });
  phasesBetween(now, end).filter(p => p.tg === 0 || p.tg === 180).forEach(p => ev.push({ day: new Date(p.at.getFullYear(), p.at.getMonth(), p.at.getDate()), title: p.icon + ' ' + p.name + (p.tg === 180 ? ' (' + fullMoonName(p.at) + ')' : ''), desc: p.tg === 180 ? 'Old-timers harvest herbs for drying just after the full moon and begin weeding.' : 'A resting time in the garden. Plan and prepare; sow after it waxes.', alarm: null }));
  return { all: ev, timed };
}
function buildICS() {
  const R = reminderEvents(60), out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hortica//Garden Reminders//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Hortica garden'], stamp = icsT(new Date());
  const alarm = (min, t) => ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(t), 'TRIGGER:' + (min < 0 ? '-' : '') + 'PT' + Math.abs(min) + 'M', 'END:VALARM'];
  R.all.forEach((e, i) => { out.push('BEGIN:VEVENT', 'UID:hortica-' + icsD(e.day) + '-' + i + '@hortica.local', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + icsD(e.day), 'DTEND;VALUE=DATE:' + icsD(addD(e.day, 1)), 'SUMMARY:' + icsEsc(e.title), 'DESCRIPTION:' + icsEsc(e.desc), 'TRANSP:TRANSPARENT'); if (e.alarm != null) out.push.apply(out, alarm(e.alarm, e.title)); out.push('END:VEVENT'); });
  R.timed.forEach((e, i) => { out.push('BEGIN:VEVENT', 'UID:hortica-hr-' + i + '-' + icsT(e.start) + '@hortica.local', 'DTSTAMP:' + stamp, 'DTSTART:' + icsT(e.start), 'DTEND:' + icsT(e.end), 'SUMMARY:' + icsEsc(e.title), 'DESCRIPTION:' + icsEsc(e.desc)); out.push.apply(out, alarm(-15, e.title)); out.push('END:VEVENT'); });
  out.push('END:VCALENDAR'); return out.join('\r\n');
}
ACT.icsGet = () => { try { const b = new Blob([buildICS()], { type: 'text/calendar' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'hortica-reminders.ics'; document.body.appendChild(a); a.click(); a.remove(); toast('Calendar file saved. Open it to add the reminders to your calendar.', 4500); } catch (e) { toast('Could not save the file on this device.'); } };

/* ---- digest ---- */
function digestItems() {
  const L = [], now = NOW(), W = wxSummary(); let hr = null; try { hr = hourNow(now); } catch (e) {}
  const tonight = W && W.days[0] && W.days[0].lo <= 34 ? W.days[0] : null; if (tonight) L.push(['🥶', 'Frost tonight (low ' + Math.round(tonight.lo) + '°F). Cover tender plants at dusk.']);
  let due = 0; plantGardens().forEach(g => { due += waterStatus(g).due; }); if (due) L.push(['💧', due + ' tile' + (due > 1 ? 's' : '') + ' need water today.']);
  const planted = {}; plantGardens().forEach(g => gardenCounts(g).forEach(o => { if (o.grow < o.tiles) planted[o.id] = 1; })); let n = 0;
  Object.keys(planted).forEach(id => { if (n >= 2) return; const p = PBY[id], w = plantWindow(p); if (w && w.state === 'now') { const b = bestTimes(p, 'sow', { days: 3 })[0]; if (b && b.stars >= 4) { L.push([PSYM[b.planet], 'Good hour to plant ' + p.n + ': ' + whenText(b) + '.']); n++; } } });
  plantGardens().forEach(g => Object.keys(g.cells).forEach(k => { const c = g.cells[k], p = PBY[c.p]; if (c.s === 'grow' && c.d && p && !permLike(p) && L.length < 7 && !L.some(x => x[1].indexOf(p.n) >= 0 && x[0] === '🧺') && dayDiff(addD(pd(c.d), p.days), now) <= 0 && dayDiff(addD(pd(c.d), p.days + p.hw * 7), now) >= 0) L.push(['🧺', p.n + (p.cat === 'fl' ? ' is in bloom.' : ' is ready to harvest.')]); }));
  const m = moonInfo(now); if (m.f > .47 && m.f < .53) L.push(['🌕', 'Full moon tonight (' + fullMoonName(now) + ').']);
  return L;
}
function digestCard() { const L = digestItems(); if (!L.length) return ''; return '<section class="card"><div class="ct"><span>🔔 Today</span><a class="lnk" data-act="remindOpen">Reminders</a></div>' + L.map(x => '<div class="nrow"><span class="me">' + x[0] + '</span> <span class="sm">' + esc(x[1]) + '</span></div>').join('') + '</section>'; }
function maybeNotify() {
  try { if (!S.settings.notify || !('Notification' in window) || Notification.permission !== 'granted' || S.notifiedOn === dkey()) return; const L = digestItems(); if (!L.length) return; S.notifiedOn = dkey(); save(); const body = L.slice(0, 3).map(x => x[0] + ' ' + x[1]).join('\n'); if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('Hortica today', { body, icon: 'img/icon-192.png', tag: 'hortica-digest' })).catch(() => { new Notification('Hortica today', { body }); }); else new Notification('Hortica today', { body }); } catch (e) {}
}
ACT.remindOpen = () => {
  const np = 'Notification' in window ? Notification.permission : 'unsupported';
  openSheet('🔔 Reminders', '<p class="sm">A web app cannot run in the background by itself, so Hortica gives you two ways to get reminders without any server or account:</p>' +
    '<div class="flag"><b>1. Add them to your calendar (best)</b><br><span class="sm">Hortica builds a file with the next 60 days: frost nights, planting windows for your planned crops, harvest dates, full and new moons, and the best planetary hour for crops that are in season, each with an alarm. Open the file and your phone or computer calendar does the rest.</span><button class="btn gold block" data-act="icsGet">📅 Download calendar reminders</button><p class="sm dim">Frost and heat entries come from today\'s forecast, so download a fresh file every week or so.</p></div>' +
    '<div class="flag"><b>2. A daily note when you open the app</b><br><span class="sm">Frost, water, planting hours and harvests, shown at the top of your garden' + (np === 'unsupported' ? '.' : ' and, if you allow it, as a notification the first time you open Hortica each day.') + '</span>' + (np === 'unsupported' ? '' : '<label class="tog"><input type="checkbox" data-chg="notifyTog" ' + (S.settings.notify && np === 'granted' ? 'checked' : '') + '><span>Notify me when I open Hortica' + (np === 'denied' ? ' (blocked in your browser settings)' : '') + '</span></label>') + '</div>' +
    '<h3 class="h3">Today</h3>' + (digestItems().map(x => '<div class="nrow"><span class="me">' + x[0] + '</span> <span class="sm">' + esc(x[1]) + '</span></div>').join('') || '<p class="dim sm">Nothing urgent today.</p>'));
};
CHG.notifyTog = async el => { if (!el.checked) { S.settings.notify = false; save(); return; } try { const r = await Notification.requestPermission(); S.settings.notify = r === 'granted'; save(); if (r !== 'granted') { el.checked = false; toast('Notifications were not allowed.'); } else { S.notifiedOn = null; maybeNotify(); toast('Okay. You will get a daily note.'); } } catch (e) { el.checked = false; } };
