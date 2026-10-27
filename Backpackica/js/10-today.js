/* Backpackica: Today tab. Other modules add cards with BP.todayCards.push({order, render(): html, after?(root)}). */
window.BP = window.BP || { todayCards: [] };
(function () {
  const esc = OA.esc, G = OA.geo;
  OA.defaults({ coordMode: 'dd', here: null, contacts: [], hereLabel: '' });

  function hereCard() {
    const f = G.known(), S = OA.S;
    if (!f) return `<section class="card"><div class="ct"><span>${OA.icon('pin')} Where I am</span></div><p class="sm dim">No position yet. Tap below when you are outside with a clear view of the sky.</p><button class="btn gold block" data-act="getFix">Get my position</button></section>`;
    return `<section class="card"><div class="ct"><span>${OA.icon('pin')} Where I am</span><span class="sm dim">${esc(OA.ago(f.ts))}${f.acc ? ' · ±' + Math.round(f.acc * 3.28) + ' ft' : ''}</span></div>
      <div class="b" style="font-size:1.15rem">${esc(G.fmtCoord(f.lat, f.lon))}</div>
      <div class="sm dim">${f.alt != null ? 'Elevation ' + esc(OA.ft(f.alt * 3.28084)) + ' (GPS, rough)' : 'Elevation not reported'}</div>
      <div class="row"><button class="btn" data-act="getFix">Update</button><button class="btn" data-act="sendHere">Send to someone</button></div>
      <div class="row"><button class="btn" data-act="coordSheet" data-smoke>Emergency coordinates</button></div></section>`;
  }
  function skyCard() {
    const f = G.known(), S = OA.S; if (!f) return '';
    const s = G.sun(f.lat, f.lon, new Date()), m = G.moon(), t = d => d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '–';
    const now = new Date(), left = s.set && now < s.set ? (s.set - now) / 3600000 : 0;
    return `<section class="card"><div class="ct"><span>${OA.icon('sun')} Sun and moon</span><span class="sm dim">${esc(m.name)} · ${Math.round(m.lit * 100)}% lit</span></div>
      <div class="stat"><div><b>${t(s.rise)}</b><span>SUNRISE</span></div><div><b>${t(s.set)}</b><span>SUNSET</span></div><div><b>${left > 0 ? OA.hm(left) : 'Dark'}</b><span>DAYLIGHT LEFT</span></div></div>
      <div class="sm dim">First light ${t(s.civilDawn)} · last light ${t(s.civilDusk)}. Plan to be in camp 30 minutes before sunset.</div></section>`;
  }
  function weatherCard() { return `<section class="card" id="wxcard"><div class="ct"><span>${OA.icon('cloud')} Weather</span><span class="sm" id="wxst"></span></div><div id="wxbody" class="sm dim">${G.known() ? '<span class="spin"></span> Loading…' : 'Get your position first.'}</div></section>`; }
  async function fillWeather(root) {
    const f = G.known(), b = OA.$('#wxbody', root); if (!f || !b) return;
    try {
      const r = await OA.weather(f.lat, f.lon), w = r.v, dly = w.daily; OA.$('#wxst', root).innerHTML = r.stale ? '<span class="offline-pill">old copy</span>' : '<span class="online-pill">live</span>';
      b.className = ''; b.innerHTML = `<div class="scroll-x"><table class="t"><tr><th>Day</th><th></th><th>High/Low</th><th>Rain</th><th>Wind</th></tr>${dly.time.slice(0, 5).map((d, i) => `<tr><td>${esc(OA.fmtDate(d, { weekday: 'short' }))}</td><td>${esc(OA.wxText(dly.weather_code[i]))}</td><td>${OA.temp(dly.temperature_2m_max[i])} / ${OA.temp(dly.temperature_2m_min[i])}</td><td>${dly.precipitation_probability_max[i] == null ? '–' : dly.precipitation_probability_max[i] + '%'}</td><td>${Math.round(dly.wind_speed_10m_max[i])} mph</td></tr>`).join('')}</table></div>
        <div class="xs dim">Forecast for the point you are at, not the ridge above. Mountain weather changes fast: it is colder, windier and wetter higher up (about 3–5 °F cooler per 1,000 ft climbed).</div>`;
    } catch (e) { b.className = 'sm dim'; b.innerHTML = OA.online() ? 'The forecast did not load. Try again in a moment.' : '<span class="offline-pill">no signal</span> The forecast loads when you have signal and is kept for later.'; }
  }

  OA.tab({
    id: 'today', label: 'Today', icon: 'home', order: 10,
    render(el) {
      const cards = BP.todayCards.slice().sort((a, b) => (a.order || 50) - (b.order || 50));
      el.innerHTML = OA.header('Backpackica', new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })) +
        cards.map(c => { try { return c.render(); } catch (e) { console.error(e); return ''; } }).join('') + hereCard() + skyCard() + weatherCard() +
        `<p class="foot">Planning aid only. Conditions, closures and distances change: check with the land manager and carry a paper map.</p>`;
      cards.forEach(c => c.after && c.after(el)); fillWeather(el);
    }
  });
  OA.act({
    async getFix(el) { const b = el; b.disabled = true; try { await G.position(); OA.render(true); } catch (e) { OA.toast(e.message, 4500); b.disabled = false; } },
    sendHere() {
      const f = G.known(); if (!f) return; const txt = OA.share.here('I am okay. Here is where I am:', f);
      OA.sheet('Send my location', `<p class="sm dim">This opens your phone's share sheet. Pick a person, a message app or email. It sends only what you see below.</p><textarea class="in" rows="5" id="sharetxt">${esc(txt)}</textarea><button class="btn gold block" data-act="doShare">Share</button>`);
    },
    doShare() { OA.share.send({ title: 'My location', text: OA.$('#sharetxt').value }); },
    coordSheet() {
      const f = G.known(); if (!f) return OA.toast('Get your position first.');
      const rows = ['dd', 'ddm', 'dms', 'utm'].map(m => `<div class="kv"><span>${{ dd: 'Decimal degrees', ddm: 'Degrees, decimal minutes', dms: 'Degrees, minutes, seconds', utm: 'UTM' }[m]}</span><b>${esc(G.fmtCoord(f.lat, f.lon, m))}</b></div>`).join('');
      OA.sheet('Emergency coordinates', `<div class="alert danger"><b class="t">In an emergency</b>Call 911 if you have any signal. Text works when a call will not (texts need less signal). Give the coordinates below, what happened, how many people, and stay where you are unless it is unsafe.</div>${rows}<div class="sm dim" style="margin-top:8px">Fix taken ${esc(OA.ago(f.ts))}${f.acc ? ', accurate to about ' + Math.round(f.acc * 3.28) + ' ft' : ''}. Search and rescue read decimal degrees or UTM; say which you are giving.</div><button class="btn block" data-act="sendHere">Send these to someone</button>`);
    }
  });
  OA.publisher = () => ({ at: OA.S.lastFix || null, events: [] });
})();
