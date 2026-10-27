// PCT coordinate overlay. Fills ONLY null/missing lat/lon on TRAILS.pct.points, never overwrites.
// Load-order safe: "trails-pct-coords.js" sorts BEFORE "trails-pct.js" (the "-" sorts before "."),
// so this applies immediately if TRAILS.pct exists, else waits for trails-pct.js to assign it.
// Points have no id field; entries are keyed by "mi|name" and skipped if the point does not match exactly.
// Each entry: {mi, name, lat, lon, approx (town centre, not trail crossing), src}. See SOURCES-pct-coords.md.
(function () {
  var COORDS = [
    // Wikipedia infobox coordinates (read 2026-10). approx:true = pass summit or town centre, NOT a verified trail crossing.
    {mi: 653.2, name: "Walker Pass (Highway 178)", lat: 35.66306, lon: -118.02694, approx: true, src: "https://en.wikipedia.org/wiki/Walker_Pass"},
    {mi: 1049.6, name: "Ebbetts Pass (Highway 4)", lat: 38.5443529, lon: -119.8118455, approx: true, src: "https://en.wikipedia.org/wiki/Ebbetts_Pass"},
    {mi: 1077.8, name: "Carson Pass (Highway 88)", lat: 38.69389, lon: -119.9875, approx: true, src: "https://en.wikipedia.org/wiki/Carson_Pass"},
    {mi: 1091.2, name: "Echo Summit trailhead", lat: 38.813, lon: -120.03, approx: true, src: "https://en.wikipedia.org/wiki/Echo_Summit"},
    {mi: 1908.9, name: "Highway 58 (Willamette Pass)", lat: 43.60028, lon: -122.03806, approx: true, src: "https://en.wikipedia.org/wiki/Willamette_Pass"},
    {mi: 2001.8, name: "Highway 20 (Santiam Pass)", lat: 44.3883, lon: -121.845, approx: true, src: "https://en.wikipedia.org/wiki/Santiam_Pass"},
    {mi: 2116.8, name: "Lolo Pass", lat: 45.4267847, lon: -121.7959109, approx: true, src: "https://en.wikipedia.org/wiki/Lolo_Pass_(Oregon)"},
    {mi: 2297.5, name: "Highway 12 (White Pass)", lat: 46.6383, lon: -121.39, approx: true, src: "https://en.wikipedia.org/wiki/White_Pass_(Washington)"},
    {mi: 2326.1, name: "Highway 410 (Chinook Pass)", lat: 46.8717, lon: -121.515483, approx: true, src: "https://en.wikipedia.org/wiki/Chinook_Pass"},
    {mi: 2395.7, name: "Snoqualmie Pass (Interstate 90)", lat: 47.4233, lon: -121.4108, approx: true, src: "https://en.wikipedia.org/wiki/Snoqualmie_Pass"},
    {mi: 2466.7, name: "Stevens Pass (Highway 2)", lat: 47.745, lon: -121.0933, approx: true, src: "https://en.wikipedia.org/wiki/Stevens_Pass"},
    {mi: 342, name: "Cajon Pass (Interstate 15)", lat: 34.32583, lon: -117.42833, approx: true, src: "https://en.wikipedia.org/wiki/Cajon_Pass"},
    {mi: 151.9, name: "Anza", lat: 33.555, lon: -116.67361, approx: true, src: "https://en.wikipedia.org/wiki/Anza,_California"},
    {mi: 266.1, name: "Big Bear City", lat: 34.23889, lon: -116.77833, approx: true, src: "https://en.wikipedia.org/wiki/Big_Bear_City,_California"},
    {mi: 653.2, name: "Ridgecrest", lat: 35.6225, lon: -117.67083, approx: true, src: "https://en.wikipedia.org/wiki/Ridgecrest,_California"},
    {mi: 653.2, name: "Lake Isabella", lat: 35.61806, lon: -118.47306, approx: true, src: "https://en.wikipedia.org/wiki/Lake_Isabella,_California"},
    {mi: 907.8, name: "Mammoth Lakes", lat: 37.6272627, lon: -118.9899436, approx: true, src: "https://en.wikipedia.org/wiki/Mammoth_Lakes,_California"},
    {mi: 1018.1, name: "Bridgeport", lat: 38.25056, lon: -119.23139, approx: true, src: "https://en.wikipedia.org/wiki/Bridgeport,_California"},
    {mi: 1502.1, name: "Castella", lat: 41.1554806, lon: -122.2925361, approx: true, src: "https://en.wikipedia.org/wiki/Castella,_California"},
    {mi: 1502.2, name: "Mount Shasta (city)", lat: 41.31444, lon: -122.31139, approx: true, src: "https://en.wikipedia.org/wiki/Mount_Shasta,_California"},
    {mi: 1600.7, name: "Etna", lat: 41.45722, lon: -122.89694, approx: true, src: "https://en.wikipedia.org/wiki/Etna,_California"},
    {mi: 1719.7, name: "Ashland", lat: 42.19139, lon: -122.70083, approx: true, src: "https://en.wikipedia.org/wiki/Ashland,_Oregon"},
    {mi: 2094.9, name: "Government Camp", lat: 45.30222, lon: -121.7525, approx: true, src: "https://en.wikipedia.org/wiki/Government_Camp,_Oregon"},
    {mi: 2149.9, name: "Stevenson (Washington)", lat: 45.69889, lon: -121.88472, approx: true, src: "https://en.wikipedia.org/wiki/Stevenson,_Washington"},
    {mi: 2466.7, name: "Skykomish", lat: 47.71028, lon: -121.35833, approx: true, src: "https://en.wikipedia.org/wiki/Skykomish,_Washington"},
    {mi: 2466.7, name: "Leavenworth", lat: 47.595, lon: -120.66278, approx: true, src: "https://en.wikipedia.org/wiki/Leavenworth,_Washington"},
    {mi: 2574.5, name: "Stehekin", lat: 48.30944, lon: -120.65528, approx: true, src: "https://en.wikipedia.org/wiki/Stehekin,_Washington"}
  ];
  function apply(t) {
    if (!t || !Array.isArray(t.points)) return;
    COORDS.forEach(function (c) {
      t.points.forEach(function (p) {
        if (p.mi === c.mi && p.name === c.name && p.lat == null && p.lon == null) {
          p.lat = c.lat; p.lon = c.lon; p.coordSrc = c.src; if (c.approx) p.coordApprox = true;
        }
      });
    });
  }
  window.TRAILS = window.TRAILS || {};
  if (window.TRAILS.pct) { apply(window.TRAILS.pct); return; }
  var val;
  Object.defineProperty(window.TRAILS, 'pct', {
    configurable: true, enumerable: true,
    get: function () { return val; },
    set: function (v) { Object.defineProperty(window.TRAILS, 'pct', { value: v, writable: true, configurable: true, enumerable: true }); apply(v); }
  });
})();
