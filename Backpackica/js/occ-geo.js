/* Occultica app shell, part 2: location and the sky. Everything here except weather, geocoding and OpenStreetMap lookups works with no signal. */
(function () {
  'use strict';
  const OA = window.OA, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const G = OA.geo = {};
  const R_MI = 3958.7613, R_KM = 6371.0088;

  /* ----- distance, bearing, destination ----- */
  G.km = (a, b) => { const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon), s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2; return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s))); };
  G.mi = (a, b) => G.km(a, b) / 1.609344;
  G.bearing = (a, b) => { const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat)), x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon)); return (deg(Math.atan2(y, x)) + 360) % 360; };
  G.dest = (a, brg, km) => { const d = km / R_KM, b = rad(brg), la = rad(a.lat), lo = rad(a.lon), la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b)), lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); return { lat: deg(la2), lon: ((deg(lo2) + 540) % 360) - 180 }; };
  G.compass = b => ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(((b % 360) + 360) % 360 / 22.5) % 16];
  /* length of a polyline [{lat,lon}] in miles */
  G.pathMi = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += G.mi(pts[i - 1], pts[i]); return s; };
  /* nearest point on a polyline: {i, d (mi), t} */
  G.nearest = (pts, p) => { let best = { i: 0, d: 1e9 }; for (let i = 0; i < pts.length; i++) { const d = G.mi(pts[i], p); if (d < best.d) best = { i, d }; } return best; };
  /* Tobler hiking function: walking speed (km/h) on a slope (rise/run) */
  G.tobler = s => 6 * Math.exp(-3.5 * Math.abs(s + 0.05));

  /* ----- position ----- */
  G.last = null;
  G.position = (opt) => new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('This browser has no location.'));
    navigator.geolocation.getCurrentPosition(p => { G.last = { lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude, acc: p.coords.accuracy, ts: p.timestamp }; try { OA.S.lastFix = G.last; OA.saveSoon(); } catch (e) { } res(G.last); }, e => rej(new Error(e.code === 1 ? 'Location is turned off for this app. Allow it in your phone settings.' : e.code === 2 ? 'No GPS fix yet. Step into the open and try again.' : 'Location timed out.')), Object.assign({ enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 }, opt || {}));
  });
  G.watch = (cb, err) => { if (!navigator.geolocation) return null; return navigator.geolocation.watchPosition(p => { G.last = { lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude, acc: p.coords.accuracy, ts: p.timestamp, speed: p.coords.speed, heading: p.coords.heading }; cb(G.last); }, e => err && err(e), { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }); };
  G.unwatch = id => { if (id != null && navigator.geolocation) navigator.geolocation.clearWatch(id); };
  G.known = () => G.last || (OA.S && OA.S.lastFix) || null;

  /* ----- coordinate formats ----- */
  const dms = (v, pos, neg) => { const h = v >= 0 ? pos : neg; v = Math.abs(v); const d = Math.floor(v), m = Math.floor((v - d) * 60), s = ((v - d) * 60 - m) * 60; return d + '° ' + m + "' " + s.toFixed(1) + '" ' + h; };
  const ddm = (v, pos, neg) => { const h = v >= 0 ? pos : neg; v = Math.abs(v); const d = Math.floor(v), m = (v - d) * 60; return d + '° ' + m.toFixed(3) + "' " + h; };
  /* WGS84 UTM (Snyder series), good to well under a metre */
  G.utm = (lat, lon) => {
    const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    const zone = Math.floor((lon + 180) / 6) + 1, lon0 = rad((zone - 1) * 6 - 180 + 3), phi = rad(lat), lam = rad(lon);
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2, A = Math.cos(phi) * (lam - lon0);
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * phi - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi) + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi) - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
    const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
    let y = k0 * (M + N * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720)); if (lat < 0) y += 10000000;
    const bands = 'CDEFGHJKLMNPQRSTUVWX', band = lat >= -80 && lat <= 84 ? bands[Math.floor((lat + 80) / 8)] : '?';
    return { zone, band, e: Math.round(x), n: Math.round(y) };
  };
  G.fmtCoord = (lat, lon, mode) => {
    mode = mode || (OA.S && OA.S.coordMode) || 'dd';
    if (mode === 'dms') return dms(lat, 'N', 'S') + '  ' + dms(lon, 'E', 'W');
    if (mode === 'ddm') return ddm(lat, 'N', 'S') + '  ' + ddm(lon, 'E', 'W');
    if (mode === 'utm') { const u = G.utm(lat, lon); return u.zone + u.band + ' ' + u.e + 'E ' + u.n + 'N'; }
    return lat.toFixed(5) + ', ' + lon.toFixed(5);
  };
  G.mapLinks = (lat, lon, label) => ({ google: 'https://maps.google.com/?q=' + lat.toFixed(6) + ',' + lon.toFixed(6), apple: 'https://maps.apple.com/?ll=' + lat.toFixed(6) + ',' + lon.toFixed(6) + (label ? '&q=' + encodeURIComponent(label) : ''), osm: 'https://www.openstreetmap.org/?mlat=' + lat.toFixed(6) + '&mlon=' + lon.toFixed(6) + '#map=15/' + lat.toFixed(5) + '/' + lon.toFixed(5), geo: 'geo:' + lat.toFixed(6) + ',' + lon.toFixed(6) });

  /* ----- sun and moon (NOAA algorithms; no network) ----- */
  /* G.sun(lat, lon, Date) -> {rise, set, noon, dayHours, civilDawn, civilDusk, polar:'day'|'night'|null}  (Date objects in the phone's local time) */
  G.sun = (lat, lon, date) => {
    const d = new Date(date || Date.now()), y = d.getFullYear(), m = d.getMonth(), dd = d.getDate();
    const jd0 = Date.UTC(y, m, dd, 12) / 86400000 + 2440587.5;   // Julian day at 12:00 UTC of that civil date
    function at(zenith, rising) {
      let t = (jd0 - 2451545.0) / 36525;                           // refined once below
      for (let k = 0; k < 3; k++) {
        const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360, M = 357.52911 + t * (35999.05029 - 0.0001537 * t), e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
        const C = Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) + Math.sin(rad(3 * M)) * 0.000289;
        const trueL = L0 + C, om = 125.04 - 1934.136 * t, lam = trueL - 0.00569 - 0.00478 * Math.sin(rad(om));
        const eps0 = 23 + (26 + ((21.448 - t * (46.815 + t * (0.00059 - t * 0.001813)))) / 60) / 60, eps = eps0 + 0.00256 * Math.cos(rad(om));
        const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam))));
        const yv = Math.tan(rad(eps / 2)) ** 2, eqt = 4 * deg(yv * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * yv * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * yv * yv * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
        const cosH = (Math.cos(rad(zenith)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
        if (cosH > 1) return { polar: 'night', eqt, decl }; if (cosH < -1) return { polar: 'day', eqt, decl };
        const H = deg(Math.acos(cosH)), minutes = 720 - 4 * lon - eqt + (rising ? -1 : 1) * 4 * H;   // UTC minutes from 00:00
        const jd = Math.floor(jd0 - 0.5) + 0.5 + minutes / 1440; t = (jd - 2451545.0) / 36525;
        if (k === 2) return { min: minutes, eqt, decl };
      }
    }
    const mk = (r) => r && r.min != null ? new Date(Date.UTC(y, m, dd) + r.min * 60000) : null;
    const rise = at(90.833, true), set = at(90.833, false), cd = at(96, true), ce = at(96, false);
    const noonR = at(90.833, true), noon = noonR && noonR.eqt != null ? new Date(Date.UTC(y, m, dd) + (720 - 4 * lon - noonR.eqt) * 60000) : null;
    const polar = (rise && rise.polar) || null;
    const r = mk(rise), s = mk(set);
    return { rise: r, set: s, noon, civilDawn: mk(cd), civilDusk: mk(ce), polar, dayHours: r && s ? (s - r) / 3600000 : polar === 'day' ? 24 : 0 };
  };
  G.moon = date => {
    const d = (date ? new Date(date) : new Date()).getTime() / 86400000 + 2440587.5, syn = 29.530588853, ph = (((d - 2451550.1) % syn) + syn) % syn / syn;
    const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    return { phase: ph, name: names[Math.floor(ph * 8 + 0.5) % 8], lit: (1 - Math.cos(2 * Math.PI * ph)) / 2 };
  };
  /* sun azimuth/altitude for pointing (degrees), simple but fine for compass tricks */
  G.sunPos = (lat, lon, date) => {
    const d = new Date(date || Date.now()), jd = d.getTime() / 86400000 + 2440587.5, n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360, g = rad((357.528 + 0.9856003 * n) % 360), lam = rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)), eps = rad(23.439 - 0.0000004 * n);
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24, lst = rad(((gmst * 15 + lon) % 360 + 360) % 360), H = lst - ra;
    const alt = Math.asin(Math.sin(rad(lat)) * Math.sin(dec) + Math.cos(rad(lat)) * Math.cos(dec) * Math.cos(H));
    const az = Math.atan2(-Math.sin(H) * Math.cos(dec), Math.cos(rad(lat)) * Math.sin(dec) - Math.sin(rad(lat)) * Math.cos(dec) * Math.cos(H));
    return { az: (deg(az) + 360) % 360, alt: deg(alt) };
  };

  /* ----- weather (Open-Meteo, no key). 7-day daily + next 48 h. Cached 1 h, readable offline from the last copy ----- */
  OA.weather = async (lat, lon) => {
    const key = 'wx:' + lat.toFixed(1) + ',' + lon.toFixed(1), u = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(3) + '&longitude=' + lon.toFixed(3) + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset&hourly=temperature_2m,precipitation_probability,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=7&timezone=auto&forecast_hours=48';
    return OA.cached(key, 3600000, () => OA.fetchJSON(u));
  };
  OA.wxText = c => c === 0 ? 'Clear' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c <= 86 ? 'Snow showers' : c >= 95 ? 'Thunderstorms' : 'Mixed';
  /* heat index (F, rain-free approximation) and wind chill (F) for plain safety notes */
  OA.windChill = (f, mph) => mph > 3 && f <= 50 ? 35.74 + 0.6215 * f - 35.75 * Math.pow(mph, 0.16) + 0.4275 * f * Math.pow(mph, 0.16) : f;

  /* ----- place search (Nominatim) and map data (Overpass). Online only; results are cached ----- */
  OA.geocode = async q => {
    const r = await OA.cached('geo:' + q.toLowerCase(), 30 * 86400000, () => OA.fetchJSON('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=' + encodeURIComponent(q), { headers: { 'Accept-Language': 'en' } }));
    return r.v.map(x => ({ name: x.display_name, short: (x.name || x.display_name.split(',')[0]), lat: +x.lat, lon: +x.lon, type: x.type, addr: x.address || {} }));
  };
  OA.reverse = async (lat, lon) => { const r = await OA.cached('rev:' + lat.toFixed(2) + ',' + lon.toFixed(2), 30 * 86400000, () => OA.fetchJSON('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=' + lat + '&lon=' + lon)); const a = r.v.address || {}; return { name: r.v.display_name, town: a.city || a.town || a.village || a.hamlet || a.county || '', state: a.state || '', addr: a }; };
  const OVP = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  /* OA.osm.around(lat, lon, meters, ['node["tourism"="camp_site"]', ...]) -> [{id,type,name,lat,lon,tags}] */
  OA.osm = {
    async raw(ql) {
      let last = null;
      for (const ep of OVP) { try { return await OA.fetchJSON(ep, { method: 'POST', body: 'data=' + encodeURIComponent(ql), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 30000); } catch (e) { last = e; } }
      throw last || new Error('Map data is not reachable right now.');
    },
    async around(lat, lon, m, filters, ttl) {
      const ql = '[out:json][timeout:25];(' + filters.map(f => f + '(around:' + Math.round(m) + ',' + lat.toFixed(5) + ',' + lon.toFixed(5) + ');').join('') + ');out center tags 400;';
      const r = await OA.cached('osm:' + ql, ttl || 7 * 86400000, () => OA.osm.raw(ql));
      return { items: (r.v.elements || []).map(e => ({ id: e.type + e.id, type: e.type, name: (e.tags && (e.tags.name || e.tags.brand)) || '', lat: e.lat != null ? e.lat : e.center && e.center.lat, lon: e.lon != null ? e.lon : e.center && e.center.lon, tags: e.tags || {} })).filter(x => x.lat != null), stale: r.stale, fromCache: r.fromCache };
    }
  };
})();
