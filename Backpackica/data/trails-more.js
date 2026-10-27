/* Backpackica: additional verified trail packs (Grand Canyon corridor, Whitney, Four Pass Loop, Teton Crest, Lost Coast,
   Northville-Placid, Zion West Rim). Facts come from the pages listed in data/SOURCES-more.md (read 2026-10).
   Anything not read is null. No latitude/longitude were read from any page, so lat/lon are null everywhere
   (the app shows "check with the source" and mile markers instead). Mile markers marked "derived" in a note are sums or
   differences of figures printed by the source; they are not printed mile markers. */
window.TRAILS = window.TRAILS || {};
(function () {
  'use strict';
  function P(mi, name, kind, elev, note, src, o) {
    o = o || {};
    return { mi: mi, name: name, kind: kind, lat: null, lon: null, elev: elev == null ? null : elev, note: note || '', src: src || null, off: o.off || null, svc: o.svc || null, water: o.water || null, phone: o.phone || null, url: o.url || null };
  }
  function pack(t) { window.TRAILS[t.id] = t; return t; }

  /* ================= Grand Canyon: common sources ================= */
  var GD = 'https://www.nps.gov/grca/planyourvisit/trail-distances.htm';
  var GNK = 'https://www.nps.gov/grca/planyourvisit/upload/North_Kaibab_Trail.pdf';
  var GBA = 'https://www.nps.gov/grca/planyourvisit/upload/bright_angel_trail.pdf';
  var GSK = 'https://www.nps.gov/grca/planyourvisit/upload/South_Kaibab_Trail.pdf';
  var GPM = 'https://www.nps.gov/grca/planyourvisit/backcountry-permit.htm';
  var GPERMITS = [
    { name: 'Grand Canyon backcountry permit (overnight camping below the rim)', who: 'Anyone camping at Bright Angel, Cottonwood or Havasupai Gardens campgrounds or elsewhere in the backcountry; not needed for day hikes or for a night at Phantom Ranch (lodging reservation instead)', when: 'Early-access lottery on Recreation.gov, applications from the 16th of the month to the 1st, four months before the start month; remaining space opens later and cancellations can be booked up to about 5 days ahead; limited walk-up one-night Havasupai Gardens permits are sold in person only (Mar 1 to Nov 30), not more than a day ahead', costUsd: 10, url: GPM, note: 'NPS: $10 per permit or lottery application (non-refundable) plus $15 per person per night below the rim. Designated campgrounds allow 2 nights per hike (up to 4 in the Corridor from Nov 15 to Feb 28). Carry the printed permit. Park entrance fee is separate. The page also notes availability at Havasupai Gardens is not guaranteed after an August 2026 flash flood, so check the NPS Backcountry Information Center before planning.' }
  ];

  pack({
    id: 'grca-r2r', name: 'Grand Canyon Rim to Rim (North Kaibab to Bright Angel)', short: 'GC R2R',
    miles: 23.5,
    milesSource: 'NPS distances from the rim: North Kaibab 13.6 mi to Phantom Ranch (NPS trail-distance table) plus Bright Angel 9.9 mi from the South Rim to Phantom Ranch. 13.6 + 9.9 = 23.5 (derived sum). Mile 0 is the North Kaibab trailhead on the North Rim.',
    mileNote: 'NPS pages disagree by 0.1 to 0.5 mi: the corridor table lists Bright Angel Trail resthouses at 1.6 / 3.1 / 8.0 mi, the Bright Angel PDF at 1.5 / 3.0 / 7.7 mi; the North Kaibab table puts Bright Angel Campground at 14.0 mi but Phantom Ranch at 13.6. Bright Angel miles in this pack are stitched at Phantom Ranch (13.6) from the Bright Angel PDF figures, so treat every Bright Angel mile as plus or minus 0.5.',
    asof: '2026-10', dir: 'SOBO',
    dirNote: 'Mile 0 is the North Rim and the route goes south to the South Rim (the common direction). Reverse it with the direction switch; the stitched miles still read from the North Rim.',
    states: ['AZ'],
    start: { name: 'North Kaibab Trailhead, North Rim (8,241 ft)', lat: null, lon: null },
    end: { name: 'Bright Angel Trailhead, South Rim (6,860 ft)', lat: null, lon: null },
    typicalDays: null,
    permits: GPERMITS.concat([{ name: 'North Rim access', who: 'Anyone starting on the North Kaibab', when: 'North Rim facilities close October 15. Highway 67 stays open until Nov 30 or until winter conditions block it (closure possible any time after Oct 15) and stays closed until May 15, so the trailhead cannot be reached by vehicle before then. In winter hikers must start and end at the South Rim.', costUsd: null, url: GNK, note: 'From NPS North Kaibab guide. A rim-to-rim needs a shuttle or a ride between rims; the shuttle is not covered in the pages read, so check with the park.' }]),
    seasons: [
      { label: 'North Rim road open', months: [5, 6, 7, 8, 9, 10], note: 'NPS: Highway 67 closed until May 15; facilities close October 15; the highway can stay open to Nov 30 weather permitting.' },
      { label: 'Extreme heat', months: [5, 6, 7, 8, 9], note: 'NPS: hot months run roughly May through September; the inner gorge is particularly dangerous. Start before dawn or wait until late afternoon and stay out of the sun between 10 a.m. and 4 p.m.' },
      { label: 'Ice and snow', months: [12, 1, 2], note: 'NPS: the top 2 miles of Bright Angel are often icy, most pronounced Dec to Feb; snow, ice and rockfall above Supai Tunnel on the North Kaibab.' }
    ],
    hazards: [
      { id: 'r2r-heat', title: 'Inner gorge heat (Cottonwood to Bright Angel)', fromMi: 6.8, toMi: 15.8, note: 'NPS: extremely hot in summer and considered particularly dangerous; overheating can lead to heat stroke and death. Reach Bright Angel Campground before 10 a.m. when passing through in hot weather. Soak clothing in creek water.' },
      { id: 'r2r-redwall', title: 'Redwall: exposed trail blasted into cliff', fromMi: 4.7, toMi: 5.4, note: 'NPS: significant exposure in half-tunnel sections of the North Kaibab Redwall section. The mile range here is approximate (NPS gives the hazard, not its mile markers).' },
      { id: 'r2r-ribbon', title: 'Ribbon Falls creek ford', fromMi: 8.4, toMi: 8.4, note: 'NPS: no bridge; spring snowmelt makes the ford dangerous.' },
      { id: 'r2r-dunes', title: 'Sand dunes near the river (River Resthouse to Bright Angel Campground)', fromMi: 14.0, toMi: 15.8, note: 'NPS: more than a mile of exposed sand that becomes dangerous in hot weather. Mile range approximate.' },
      { id: 'r2r-corkscrew', title: 'Devil\'s Corkscrew above the river', fromMi: 15.8, toMi: 19.0, note: 'NPS: steep section below Havasupai Gardens that is brutally hot in summer; hike it early morning or evening.' },
      { id: 'r2r-water', title: 'No water between Havasupai Gardens and Bright Angel Campground', fromMi: 15.8, toMi: 19.0, note: 'NPS Bright Angel guide: no potable water between those points; River Resthouse never has water. Pipelines break, so carry a backup water treatment method.' },
      { id: 'r2r-oneday', title: 'Do not try it in one day in summer', fromMi: 0, toMi: 23.5, note: 'NPS: hiking the entire North Kaibab in a single day is not recommended, particularly in summer. Heat-related deaths happen every year.' }
    ],
    sections: [
      { id: 'nk', name: 'North Kaibab: North Rim to Phantom Ranch', fromMi: 0, toMi: 13.6, note: 'Supai Tunnel, Roaring Springs, Manzanita Rest Area, Cottonwood Campground (about halfway, 6.8), Ribbon Falls spur.' },
      { id: 'inner', name: 'Phantom Ranch and the river', fromMi: 13.6, toMi: 15.8, note: 'Phantom Ranch Canteen and lodge (Xanterra) near Bright Angel Campground; River Trail follows the Colorado 1.7 mi between the Bright Angel and South Kaibab trails.' },
      { id: 'ba', name: 'Bright Angel: river to South Rim', fromMi: 15.8, toMi: 23.5, note: 'Havasupai Gardens (year-round water), Three-Mile and Mile-and-a-Half resthouses (seasonal water).' }
    ],
    points: [
      P(0, 'North Kaibab Trailhead (North Rim)', 'trailhead', 8240, 'Trailhead elevation 8,241 ft. Potable water is typically available at the trailhead in season.', GD + ' ; ' + GNK, { water: { type: 'tap (seasonal)', note: 'NPS: typically available at the trailhead; stations may be broken, check signage.' } }),
      P(1.7, 'Supai Tunnel', 'water', 6800, 'Vault toilets. Potable water usually available mid-May to mid-October.', GD + ' ; ' + GNK, { water: { type: 'tap (seasonal)', note: 'NPS: usually mid-May to mid-October.' } }),
      P(4.7, 'Roaring Springs', 'landmark', 5220, 'NPS lists Roaring Springs at 4.7 mi. Water from here to the river can be treated from nearby creeks.', GD + ' ; ' + GNK),
      P(5.4, 'Manzanita Rest Area', 'water', 4600, 'Toilet, drinking water, shaded benches and access to Bright Angel Creek; ranger station nearby. Water here in winter too (if not broken).', GD + ' ; ' + GNK, { water: { type: 'tap (winter too)', note: 'NPS: water at Manzanita in winter as well.' } }),
      P(6.8, 'Cottonwood Campground', 'campsite', 4080, 'Near the halfway point. Lockable food boxes are required for all scented items. Potable water typically available in open season. The NPS PDF gives 10.7 km (the table 10.9 km).', GD + ' ; ' + GNK, { water: { type: 'tap (seasonal)', note: 'NPS: typically available in open season.' } }),
      P(8.4, 'Ribbon Falls', 'landmark', 3720, 'Side trip (NPS PDF: 1.6 mi from Cottonwood; table: 8.4 mi from the rim). No bridge over the creek; spring snowmelt makes the ford dangerous.', GD + ' ; ' + GNK),
      P(13.6, 'Phantom Ranch', 'town', 2546, 'Phantom Ranch Canteen and lodge (operated by Xanterra) need a lodging or meal reservation; not needed for the trail. Elevation 2,546 ft.', GD + ' ; ' + GNK),
      P(14.0, 'Bright Angel Campground', 'campsite', 2480, 'Beside the Colorado at the canyon bottom (14.0 mi from the North Kaibab trailhead per NPS). 30 small and 2 large group sites. Potable water year-round but pipeline breaks happen. Lockable food boxes required.', GD + ' ; ' + GNK + ' ; ' + GBA, { water: { type: 'tap', note: 'NPS: potable water year-round, not guaranteed (pipeline breaks).' } }),
      P(15.8, 'River Resthouse', 'landmark', 2480, 'Never has water. Toilet near it. Derived mile: 13.6 + (9.9 - 7.7). Sand dunes follow toward Bright Angel Campground.', GBA + ' ; ' + GD),
      P(19.0, 'Havasupai Gardens Campground (Indian Garden)', 'campsite', 3800, 'Water year-round, toilets. 15 small group sites and 1 large; no stock. Derived mile: 13.6 + (9.9 - 4.5).', GBA + ' ; ' + GD, { water: { type: 'tap', note: 'NPS: year-round (check for breaks).' } }),
      P(20.5, 'Three-Mile Resthouse', 'water', 4750, 'Pre-treated water early May to early October (not guaranteed); toilets. Derived mile: 13.6 + (9.9 - 3.0).', GBA + ' ; ' + GD, { water: { type: 'tap (seasonal)', note: 'NPS: early May to early October.' } }),
      P(22.0, 'Mile-and-a-Half Resthouse', 'water', 5730, 'Pre-treated water early May to early October (not guaranteed); toilets. Derived mile: 13.6 + (9.9 - 1.5).', GBA + ' ; ' + GD, { water: { type: 'tap (seasonal)', note: 'NPS: early May to early October.' } }),
      P(23.5, 'Bright Angel Trailhead (South Rim)', 'trailhead', 6860, 'Trailhead elevation 6,860 ft. Total climb of the Bright Angel side is about 4,380 ft (derived: 6,860 minus 2,480).', GBA + ' ; ' + GD)
    ],
    links: [
      { label: 'NPS: corridor trail distances', url: GD },
      { label: 'NPS: North Kaibab Trail guide (PDF)', url: GNK },
      { label: 'NPS: Bright Angel Trail guide (PDF)', url: GBA },
      { label: 'NPS: backcountry permits', url: GPM }
    ],
    disclaimer: 'Miles are NPS distances stitched at Phantom Ranch, not surveyed mile markers; NPS pages differ by up to half a mile. Water stations break often: carry treatment. Check the NPS Backcountry Information Center and the current trail alerts before you go.'
  });

  pack({
    id: 'grca-skba', name: 'Grand Canyon: South Kaibab down, Bright Angel up', short: 'GC SK/BA',
    miles: 17.3,
    milesSource: 'NPS distances from the rim: South Kaibab 7.4 mi to Phantom Ranch (NPS corridor table) plus Bright Angel 9.9 mi from Phantom Ranch to the South Rim. 7.4 + 9.9 = 17.3 (derived sum).',
    mileNote: 'NPS pages disagree slightly (see the Rim to Rim pack). Bright Angel miles are stitched at Phantom Ranch (7.4) from the Bright Angel PDF. NPS does not recommend ascending in hot weather and treats Skeleton Point (3.0 mi) as the maximum recommended day-hike distance on South Kaibab.',
    asof: '2026-10', dir: 'SOBO',
    dirNote: 'Mile 0 is the South Kaibab trailhead. The route goes down South Kaibab and returns up Bright Angel to the same rim area; it is not a point-to-point trip to another rim.',
    states: ['AZ'],
    start: { name: 'South Kaibab Trailhead (7,260 ft)', lat: null, lon: null },
    end: { name: 'Bright Angel Trailhead (6,860 ft)', lat: null, lon: null },
    typicalDays: { min: 2, max: 2, note: 'NPS says the South Kaibab descent alone typically takes 4 to 6 hours. A day-length is not given for the loop; plan an overnight at Bright Angel Campground or Phantom Ranch.' },
    permits: GPERMITS.concat([{ name: 'No parking at South Kaibab Trailhead', who: 'Anyone starting at South Kaibab', when: 'Always', costUsd: null, url: GSK, note: 'NPS: use the Hiker Express (from Bright Angel Lodge and the Backcountry Information Center) or the Kaibab Rim (orange) shuttle from the Visitor Center. Schedules and fares were not on the page read.' }]),
    seasons: [
      { label: 'Extreme heat', months: [5, 6, 7, 8, 9], note: 'NPS: from May to September start well before dawn or wait until late afternoon; arriving at Bright Angel Campground after 10 a.m. in hot weather can lead to serious trouble. Success depends on staying off the trail 10 a.m. to 4 p.m.' },
      { label: 'Ice', months: [12, 1, 2], note: 'NPS: tight switchbacks near the top of South Kaibab and the top 2 miles of Bright Angel stay icy for days or weeks. Use traction devices and poles.' }
    ],
    hazards: [
      { id: 'skba-nowater', title: 'South Kaibab has no water', fromMi: 0, toMi: 7.0, note: 'NPS: the trail has no water. A spigot near the trailhead bus stop runs early May to mid-October. Carry at least 4 liters in hot weather and a backup treatment method.' },
      { id: 'skba-exposure', title: 'Exposed ledges after Skeleton Point', fromMi: 3.0, toMi: 7.0, note: 'NPS: sections blasted into limestone cliffs offer the most dramatic exposure on the route. Little shade.' },
      { id: 'skba-heat', title: 'Heat: do not ascend in the middle of the day', fromMi: 0, toMi: 17.3, note: 'NPS: heat-related fatalities occur every year; the canyon bottom can reach 100 F or more.' },
      { id: 'skba-dunes', title: 'Sand near the river and the long hot climb', fromMi: 7.4, toMi: 9.6, note: 'NPS Bright Angel guide: more than a mile of exposed sand between the River Resthouse and the campground becomes dangerous in hot weather.' },
      { id: 'skba-nowater2', title: 'No potable water between Havasupai Gardens and the river', fromMi: 7.4, toMi: 12.8, note: 'NPS: none between Havasupai Gardens and Bright Angel Campground; River Resthouse never has water.' },
      { id: 'skba-corkscrew', title: 'Devil\'s Corkscrew', fromMi: 9.6, toMi: 12.8, note: 'NPS: steep and brutally hot in summer; climb it early morning or evening.' }
    ],
    sections: [
      { id: 'sk', name: 'South Kaibab down to the river', fromMi: 0, toMi: 7.4, note: 'Cedar Ridge (toilets, no water), Skeleton Point, Tipoff (toilets and an emergency phone, no water), Bright Angel Campground, Phantom Ranch.' },
      { id: 'ba', name: 'Bright Angel up to the South Rim', fromMi: 7.4, toMi: 17.3, note: 'River Resthouse, Havasupai Gardens, Three-Mile and Mile-and-a-Half resthouses.' }
    ],
    points: [
      P(0, 'South Kaibab Trailhead', 'trailhead', 7260, 'No parking at the trailhead; use the NPS shuttles. A spigot near the bus stop gives water early May to mid-October.', GD + ' ; ' + GSK, { water: { type: 'tap (seasonal)', note: 'NPS: early May to mid-October.' } }),
      P(1.5, 'Cedar Ridge', 'landmark', 6120, 'Pit toilets. No water and no emergency phone.', GD + ' ; ' + GSK),
      P(3.0, 'Skeleton Point', 'landmark', 5220, 'NPS: maximum recommended day-hike distance on this trail.', GD + ' ; ' + GSK),
      P(4.4, 'Tipoff', 'landmark', 4000, 'Pit toilets and an emergency phone. No water.', GD + ' ; ' + GSK),
      P(7.0, 'Bright Angel Campground', 'campsite', 2480, 'Beside the Colorado. Potable water year-round but not guaranteed (pipeline breaks). Lockable food boxes required. NPS lists this camp at 7.0 mi (South Kaibab) and 9.5 mi (Bright Angel), i.e. 0.4 mi from Phantom Ranch in both cases.', GD + ' ; ' + GSK + ' ; ' + GBA, { water: { type: 'tap', note: 'NPS: year-round, not guaranteed.' } }),
      P(7.4, 'Phantom Ranch', 'town', 2546, 'Canteen and lodge operated by Xanterra (reservation needed for beds and meals). Elevation 2,546 ft.', GD),
      P(9.6, 'River Resthouse', 'landmark', 2480, 'Never has water. Derived mile: 7.4 + (9.9 - 7.7).', GBA + ' ; ' + GD),
      P(12.8, 'Havasupai Gardens Campground (Indian Garden)', 'campsite', 3800, 'Water year-round, toilets. Derived mile: 7.4 + (9.9 - 4.5).', GBA + ' ; ' + GD, { water: { type: 'tap', note: 'NPS: year-round (check for breaks).' } }),
      P(14.3, 'Three-Mile Resthouse', 'water', 4750, 'Pre-treated water early May to early October, not guaranteed. Derived mile: 7.4 + (9.9 - 3.0).', GBA + ' ; ' + GD, { water: { type: 'tap (seasonal)', note: 'NPS: early May to early October.' } }),
      P(15.8, 'Mile-and-a-Half Resthouse', 'water', 5730, 'Pre-treated water early May to early October, not guaranteed. Derived mile: 7.4 + (9.9 - 1.5).', GBA + ' ; ' + GD, { water: { type: 'tap (seasonal)', note: 'NPS: early May to early October.' } }),
      P(17.3, 'Bright Angel Trailhead (South Rim)', 'trailhead', 6860, 'Top of Bright Angel. The South Kaibab trailhead is not at the same spot; use the shuttle to return to a car.', GBA + ' ; ' + GD)
    ],
    links: [
      { label: 'NPS: corridor trail distances', url: GD },
      { label: 'NPS: South Kaibab Trail guide (PDF)', url: GSK },
      { label: 'NPS: Bright Angel Trail guide (PDF)', url: GBA },
      { label: 'NPS: backcountry permits', url: GPM }
    ],
    disclaimer: 'Miles are NPS distances stitched at Phantom Ranch; NPS pages differ slightly. Check current water status and alerts with the park before you go.'
  });

  /* ================= Mount Whitney Trail ================= */
  var WF = 'https://www.fs.usda.gov/r05/inyo/wilderness/mount-whitney';
  var WM = 'https://modernhiker.com/?p=3184';
  var WW = 'https://en.wikipedia.org/wiki/Mount_Whitney_Trail';
  pack({
    id: 'whitney', name: 'Mount Whitney Trail', short: 'Whitney',
    miles: 11,
    milesSource: 'Wikipedia: 11 mi one way from Whitney Portal to the summit (21.4 mi round trip). Waypoint miles from Modern Hiker\'s trip report (checked against Wikipedia for Outpost Camp 3.8 and Trail Camp 6.3, which agree).',
    mileNote: 'Modern Hiker\'s own numbers do not add up (Trail Camp plus the 1,738 ft of the 99 switchbacks does not reach the summit elevation), so Trail Crest, the JMT junction and the summit are approximate (estimated from its 2.2 mi switchback figure). The Forest Service page read does not give trail mileage. Summit elevation 14,505 ft per Wikipedia (Modern Hiker prints 14,501).',
    asof: '2026-10', dir: 'WB',
    dirNote: 'Mile 0 is Whitney Portal and the trail climbs west to the summit; the descent is the same trail.',
    states: ['CA'],
    start: { name: 'Whitney Portal (8,360 ft)', lat: null, lon: null },
    end: { name: 'Mount Whitney summit (14,505 ft)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Mount Whitney Zone permit (day use or overnight)', who: 'Everyone, any season; a wilderness permit is always required', when: 'Quota season May 1 to Nov 1: lottery applications Feb 1 to Mar 1 on Recreation.gov, results Mar 15, remaining dates open Apr 22 at 7 a.m. Pacific. Off-season (Nov 2 to Apr 30): unlimited, book online up to 2 weeks ahead.', costUsd: 15, url: WF, note: 'Inyo NF: quota 100 day users and 60 overnight users per day in season; lottery winners pay $15 per person by April 21 or the win is revoked. Modern Hiker: the permit must be visible on the pack inside the zone and a WAG (waste) bag is required; the Forest Service page read does not say this, so confirm with the Inyo National Forest. Whitney Portal is in Inyo NF; the summit is in Sequoia NP.' }
    ],
    seasons: [
      { label: 'Snow-free (non-technical)', months: [7, 8, 9], note: 'Inyo NF: usually July through late September when snow-free; snow and ice can last until early July and then need winter mountaineering skills and equipment.' },
      { label: 'Quota season', months: [5, 6, 7, 8, 9, 10], note: 'Inyo NF: May 1 to Nov 1.' }
    ],
    hazards: [
      { id: 'wh-snow', title: 'Snow and ice on the upper trail', fromMi: 6.3, toMi: 11, note: 'Inyo NF: snow and ice can last until early July. Modern Hiker: ice lingers near the cables on the 99 Switchbacks.' },
      { id: 'wh-crossing', title: 'Lone Pine Creek crossings', fromMi: 0.5, toMi: 1.0, note: 'Modern Hiker: boulder hop then logs near mile 0.8; difficult depending on season and snowpack.' },
      { id: 'wh-trailcrest', title: 'Trail Crest: wind and ice', fromMi: 8.0, toMi: 9.0, note: 'Modern Hiker: narrow ridge, dangerous in strong wind or ice. Missing the JMT junction on the descent is a known error.' },
      { id: 'wh-altitude', title: 'Altitude sickness', fromMi: 6.3, toMi: 11, note: 'Modern Hiker: especially above 12,000 ft. Descend if symptoms worsen.' },
      { id: 'wh-marmots', title: 'Marmots and food storage at Trail Camp', fromMi: 6.0, toMi: 6.6, note: 'Modern Hiker: marmots; store food and scented items in a bear canister. Check the Inyo NF rules for the current canister requirement.' },
      { id: 'wh-windows', title: 'Whitney Windows: steep drops', fromMi: 9.3, toMi: 10.9, note: 'Modern Hiker: steep drop-offs near the summit; use caution if you fear heights.' }
    ],
    sections: [
      { id: 'lower', name: 'Whitney Portal to Outpost Camp', fromMi: 0, toMi: 3.8, note: 'Enters the Mount Whitney Zone about mile 2.9.' },
      { id: 'mid', name: 'Outpost Camp to Trail Camp', fromMi: 3.8, toMi: 6.3, note: 'Mirror Lake and Trailside Meadow (last easy water refill).' },
      { id: 'upper', name: '99 Switchbacks to the summit', fromMi: 6.3, toMi: 11, note: 'Trail Crest, JMT junction, summit. The summit is the southern end of the John Muir Trail.' }
    ],
    points: [
      P(0, 'Whitney Portal trailhead', 'trailhead', 8360, 'Starting point and lowest elevation (Wikipedia). Trailhead is just south of the Whitney Portal store.', WW + ' ; ' + WM),
      P(2.8, 'Lone Pine Lake junction', 'landmark', null, '0.1 mi side trip to the lake. An overnight permit is needed to camp there. The Mount Whitney Zone starts about mile 2.9.', WM, {}),
      P(3.8, 'Outpost Camp', 'campsite', 10360, 'Brooks on two sides. Elevation 10,365 ft (Wikipedia). Composting toilet removed (Modern Hiker).', WM + ' ; ' + WW, { water: { type: 'creek', note: 'Modern Hiker: brooks on two sides; treat all water.' } }),
      P(4.3, 'Mirror Lake', 'landmark', null, 'Tight switchbacks. No camping above the shore (Modern Hiker).', WM),
      P(5.3, 'Trailside Meadow', 'water', null, 'Good refill point; no camping (Modern Hiker). No water source listed above Trail Camp.', WM, { water: { type: 'stream', note: 'Modern Hiker: good refill point. Treat it.' } }),
      P(6.3, 'Trail Camp', 'campsite', 12040, 'Large camp; marmots; trash problems reported. Fresher water is in the tributary west of the lake; treat it. Elevation 12,000 ft (Wikipedia), 12,039 (Modern Hiker).', WM + ' ; ' + WW, { water: { type: 'lake/stream', note: 'Modern Hiker: lake has algae; use the stream to the west. Treat.' } }),
      P(8.5, 'Trail Crest (top of the 99 Switchbacks)', 'pass', 13600, 'Approximate mile (6.3 + 2.2 mi of switchbacks, Modern Hiker). Elevation about 13,600 ft (Wikipedia). Cables about 1.4 mi into the switchbacks.', WM + ' ; ' + WW),
      P(9.0, 'John Muir Trail junction', 'landmark', null, 'Approximate mile. Turn right and climb to the summit. If you are going down and find yourself descending the west side, you missed the turn (Modern Hiker).', WM),
      P(11, 'Mount Whitney summit', 'terminus', 14505, 'Summit hut (Smithsonian shelter) per Wikipedia. Elevation 14,505 ft (Wikipedia); Modern Hiker prints 14,501.', WW + ' ; ' + WM)
    ],
    links: [
      { label: 'Inyo National Forest: Mount Whitney', url: WF },
      { label: 'Recreation.gov: Mount Whitney permits', url: 'https://www.recreation.gov/permits/233260' },
      { label: 'Modern Hiker: Mount Whitney Trail', url: WM }
    ],
    disclaimer: 'Mileage past Trail Camp is approximate and the Forest Service page read does not publish mile markers. Permit dates and fees change yearly; confirm on the Inyo National Forest page.'
  });

  /* ================= Four Pass Loop ================= */
  var FPG = 'https://thenextsummit.org/colorado-hiking-trails/four-pass-loop-backpacking-guide/';
  pack({
    id: 'fourpass', name: 'Four Pass Loop (Maroon Bells-Snowmass Wilderness)', short: 'Four Pass',
    miles: 26.1,
    milesSource: 'The Next Summit guide: legs sum to 26.1 mi clockwise from the Maroon Lake trailhead (the same page says 26 in one place and 27 in its FAQ).',
    mileNote: 'Cumulative miles here are sums of the guide\'s leg distances. The guide\'s elevation gain also varies (7,300 / 7,350 / about 7,900 ft depending on section; summed legs about 8,100). Check a map and recent trip reports.',
    asof: '2026-10', dir: 'CW',
    dirNote: 'The guide describes the loop clockwise from Maroon Lake: Buckskin Pass first, West Maroon Pass last. Counter-clockwise reverses the miles.',
    states: ['CO'],
    start: { name: 'Maroon Lake Trailhead', lat: null, lon: null },
    end: { name: 'Maroon Lake Trailhead', lat: null, lon: null },
    typicalDays: { min: 3, max: 5, note: 'The Next Summit: 3 to 5 nights.' },
    permits: [
      { name: 'Overnight camping permit (by zone, each night)', who: 'All overnight hikers; six zones on the route', when: 'Release dates: Feb 15 at 8 a.m. MT (for dates through July 31) and June 15 at 8 a.m. MT (for dates through Nov 30) on Recreation.gov', costUsd: null, url: FPG, note: 'Sell out fast. The guide does not list fees. Crater Lake has 11 sites, all by advance reservation; camp only at your reserved site. Group limit 10 people and 15 stock animals.' },
      { name: 'Trailhead parking and shuttle', who: 'Anyone starting at Maroon Lake', when: 'Parking is by reservation only and road access is controlled', costUsd: null, url: FPG, note: 'The guide recommends parking at Aspen Highlands and taking the shuttle (about every 15 minutes). The last bus leaves the trailhead at 5 p.m.; missing it means a 9 mi walk to Aspen Highlands. Fees not listed.' },
      { name: 'Bear-resistant food storage and waste', who: 'All overnight hikers', when: 'Always', costUsd: null, url: FPG, note: 'All food, trash and scented items in IGBC-approved bear-resistant containers (violators ticketed). Use WAG bags (free at specified trailheads, pack out) or bury waste 6 to 8 inches deep at least 200 ft from water, trails and camps. Campfires banned at Crater Lake, Snowmass Lake and above 10,800 ft.' }
    ],
    seasons: [
      { label: 'Best window', months: [7, 8, 9], note: 'Guide: mid-July to early September when snow has mostly melted and crossings are easier. Snow is possible year-round; winter avalanche risk is very high.' }
    ],
    hazards: [
      { id: 'fp-cross', title: 'Cold stream crossings, higher in the afternoon', fromMi: 8.2, toMi: 26.1, note: 'Guide: the first Snowmass-valley crossing reached mid-thigh with a muddy bottom; a Maroon Creek crossing was knee-deep and fast. Water rises through the afternoon; cross early. Exact positions are not given.' },
      { id: 'fp-snow', title: 'Snowfields late into summer', fromMi: 8.2, toMi: 10.1, note: 'Guide: a steep snowfield above Snowmass Lake persists into late season; glissading needs an ice axe and self-arrest skills.' },
      { id: 'fp-rock', title: 'Loose rock on West Maroon Pass', fromMi: 17.3, toMi: 19.8, note: 'Guide: lots of loose rock on the approach to West Maroon Pass.' },
      { id: 'fp-weather', title: 'Afternoon thunderstorms', fromMi: 0, toMi: 26.1, note: 'Guide: storms develop quickly on summer afternoons; be off passes early.' },
      { id: 'fp-alt', title: 'Altitude', fromMi: 0, toMi: 26.1, note: 'Guide: spend a night in Aspen or camp nearby first to acclimatize. West Maroon Pass is about 12,500 ft; the other passes are above 12,000 ft.' }
    ],
    sections: [
      { id: 'buckskin', name: 'Maroon Lake to Snowmass Lake via Buckskin Pass', fromMi: 0, toMi: 8.2, note: 'About 3,100 ft of climbing to Buckskin Pass (guide).' },
      { id: 'trailrider', name: 'Snowmass Lake to Trail Rider Pass and the North Fork valley', fromMi: 8.2, toMi: 13.4, note: 'Snowmass Lake sites: fires banned, 100 ft from shore per one cited rule, use the stricter 200 ft.' },
      { id: 'frigid', name: 'North Fork valley to West Maroon Pass via Frigid Air Pass', fromMi: 13.4, toMi: 19.8, note: 'Frigid Air Pass is the biggest single climb in the guide (2,040 ft).' },
      { id: 'out', name: 'West Maroon Pass to Maroon Lake', fromMi: 19.8, toMi: 26.1, note: 'Crater Lake camp at 23.7; then the trail to Maroon Lake.' }
    ],
    points: [
      P(0, 'Maroon Lake Trailhead', 'trailhead', null, 'Start and end. Parking by reservation; use the Aspen shuttle (last bus from the trailhead 5 p.m.).', FPG),
      P(4.6, 'Buckskin Pass', 'pass', null, 'About 3,100 ft of climbing from the trailhead (guide). Above 12,000 ft per the guide.', FPG),
      P(8.2, 'Snowmass Lake', 'campsite', null, 'Camping zone; fires banned; steep snowfield above the lake can persist late into the season.', FPG),
      P(10.1, 'Trail Rider Pass', 'pass', null, 'Climb of about 1,419 ft from Snowmass Lake (guide). Above 12,000 ft.', FPG),
      P(13.4, 'North Fork valley', 'landmark', null, 'Low point between Trail Rider and Frigid Air passes. River crossings in the valley (guide).', FPG),
      P(17.3, 'Frigid Air Pass', 'pass', null, 'About 2,040 ft of climbing from the valley (guide). Above 12,000 ft.', FPG),
      P(19.8, 'West Maroon Pass', 'pass', 12500, 'About 12,500 ft (guide). Loose rock on the way up.', FPG),
      P(23.7, 'Crater Lake', 'campsite', null, 'Eleven sites, all by advance reservation; camp only at your reserved site; fires banned.', FPG),
      P(26.1, 'Maroon Lake Trailhead (loop complete)', 'terminus', null, 'Last bus from the trailhead leaves at 5 p.m. (guide).', FPG)
    ],
    links: [
      { label: 'The Next Summit: Four Pass Loop guide', url: FPG },
      { label: 'Recreation.gov (permit reservations)', url: 'https://www.recreation.gov' }
    ],
    disclaimer: 'This is a single trip guide, not the Forest Service. Check White River National Forest for current permit rules, fees, closures and shuttle details.'
  });

  /* ================= Teton Crest Trail ================= */
  var TD = 'https://www.dirtinmyshoes.com/hike-wyoming-teton-crest-trail/';
  var TC = 'https://www.cleverhiker.com/backpacking/teton-crest-trail-backpacking-guide/';
  var TN = 'https://home.nps.gov/grte/planyourvisit/backcountryroutesandzones.htm';
  pack({
    id: 'teton', name: 'Teton Crest Trail (from the tram)', short: 'Teton Crest',
    miles: 35,
    milesSource: 'Dirt In My Shoes: about 35 mi from Rendezvous Mountain (top of the Jackson Hole tram) to the String/Leigh Lake junction. NPS Grand Teton: the full route from Phillips Pass is 39 mi and the tram saves about 4 mi and 2,400 ft of climbing. Clever Hiker gives a 35 to 45 mi range and 39 mi.',
    mileNote: 'Mile 0 here is the top of the tram (Rendezvous Mountain), not Phillips Pass. Cumulative miles are sums of one trip report\'s leg distances; that report\'s day totals do not add to its own legs (day 1 legs sum 8.8 vs 9.8 stated), so treat mileage as plus or minus 1 mi. Points after Alaska Basin are not mile-marked because no consistent figures were found.',
    asof: '2026-10', dir: 'NOBO',
    dirNote: 'Mile 0 is the tram top and the trail runs south to north to String Lake. NPS and Clever Hiker also describe starts at Phillips Pass or Granite Canyon.',
    states: ['WY'],
    start: { name: 'Rendezvous Mountain (top of the Jackson Hole tram)', lat: null, lon: null },
    end: { name: 'String Lake / Leigh Lake trailhead', lat: null, lon: null },
    typicalDays: { min: 3, max: 6, note: 'Clever Hiker: 3 to 5 days in its quick facts, 4 to 6 in its text; Dirt In My Shoes uses 4.' },
    permits: [
      { name: 'Grand Teton NP backcountry permit', who: 'All overnight trips in the park (camp only in designated zones)', when: 'Advance applications open the first non-holiday Wednesday in January on Recreation.gov. The park holds up to one third of each zone for advance booking; the rest are first-come on the day before the trip (no same-day starts).', costUsd: 20, url: TC, note: 'Clever Hiker: $20 non-refundable plus $7 per person per night (confirm on the NPS page, which did not list fees). Groups of 1 to 6 may use any zone; 7 to 12 need designated group sites. Mountain zones along the Crest are full almost every night from late July to early September (NPS). Alaska Basin is Bridger-Teton NF land and needs no Grand Teton permit (Dirt In My Shoes). Tram and Jenny Lake ferry have their own fees.' },
      { name: 'Food storage', who: 'Everyone', when: 'Always; bear canister required below 10,000 ft (Clever Hiker)', costUsd: null, url: TN, note: 'NPS: use the bear-resistant boxes at sites for food and scented items; do not hang items or leave them in boats; campfires not allowed; camp at least 200 ft from lakes and streams. Canisters can be borrowed free with a permit (Clever Hiker). Carry bear spray; it cannot fly.' }
    ],
    seasons: [
      { label: 'Main season', months: [7, 8, 9], note: 'Clever Hiker: July to early September, some years into early October. Snow lingers on passes: bare ground by about the third week of July above 6,700 ft; an ice axe may be needed into August on some passes.' }
    ],
    hazards: [
      { id: 'tc-snow', title: 'Snow and ice on passes', fromMi: 0, toMi: 35, note: 'Clever Hiker: ice axe and the skill to use it may be needed into August on several passes; microspikes help. Avoid crossing more than one pass in a day (NPS).' },
      { id: 'tc-water', title: 'Dry stretches on the Death Canyon Shelf', fromMi: 8.8, toMi: 14.7, note: 'Dirt In My Shoes: water may dry up on the Shelf and is scarce; Clever Hiker: many streams dry by late August, sources are usually about 2 hours apart.' },
      { id: 'tc-passes', title: 'High passes: Hurricane Pass and Paintbrush Divide', fromMi: 14.7, toMi: 35, note: 'Dirt In My Shoes: Hurricane Pass about 10,400 ft; Paintbrush Divide about 10,700 ft with a steep snowy descent (trekking poles recommended). Their mile positions were not read.' },
      { id: 'tc-ford', title: 'South Fork Teton Creek ford', fromMi: 0, toMi: 6.2, note: 'Clever Hiker lists stream fording at South Fork Teton Creek among hazards; position not given.' },
      { id: 'tc-bears', title: 'Grizzly and black bears', fromMi: 0, toMi: 35, note: 'NPS/Clever Hiker: carry bear spray within reach; store all food and scented items properly.' }
    ],
    sections: [
      { id: 'south', name: 'Tram to Alaska Basin', fromMi: 0, toMi: 14.7, note: 'Marion Lake, Fox Creek Pass / Death Canyon Shelf, Mount Meek Pass, Sheep Steps descent to Alaska Basin.' },
      { id: 'north', name: 'Alaska Basin to String Lake', fromMi: 14.7, toMi: 35, note: 'Sunset Lake, Hurricane Pass, South Fork Cascade Canyon, Lake Solitude, Paintbrush Divide, Holly Lake, String Lake.' }
    ],
    points: [
      P(0, 'Rendezvous Mountain (top of the tram)', 'trailhead', 10450, 'Vault toilets, no running water; fill bottles before the tram. Tram fee applies.', TD),
      P(4.1, 'Junction with the Teton Crest Trail', 'landmark', null, 'Leg distance 4.1 mi from the tram top (Dirt In My Shoes).', TD),
      P(6.2, 'Marion Lake', 'landmark', null, 'Derived mile (4.1 + 2.1). Lunch/swim stop. One of the named camping zones in Clever Hiker\'s list.', TD + ' ; ' + TC),
      P(8.8, 'Fox Creek Pass / Death Canyon Shelf', 'pass', null, 'Derived mile (6.2 + 2.6). Camp on the Shelf (Death Canyon zone); water may dry up.', TD),
      P(11.8, 'Mount Meek Pass', 'pass', null, 'Derived mile (8.8 + 3.0 along the Shelf). Water is scarce on the Shelf.', TD),
      P(14.7, 'Alaska Basin', 'campsite', null, 'Derived mile (11.8 + 2.9, Sheep Steps descent). Forest Service land: camping without a Grand Teton permit. Signage unclear; the report found the Sunset Lake sign inaccurate.', TD),
      P(35, 'String Lake / Leigh Lake trailhead', 'terminus', null, 'End of the route at about 35 mi from the tram (Dirt In My Shoes). Last leg 6.2 mi mostly downhill from the Cascade Canyon junction area.', TD)
    ],
    links: [
      { label: 'NPS Grand Teton: backcountry routes and zones', url: TN },
      { label: 'Clever Hiker: Teton Crest Trail guide', url: TC },
      { label: 'Dirt In My Shoes: Teton Crest Trail', url: TD }
    ],
    disclaimer: 'Mileage is from one trip report and the NPS route page, not a surveyed mile-marker system. The NPS page read does not list permit fees; confirm on nps.gov/grte and Recreation.gov.'
  });

  /* ================= Lost Coast Trail ================= */
  var LCP = 'https://www.recreation.gov/permits/72192';
  var LCB = 'https://www.blm.gov/visit/search-details/267873/1';
  var LCK = 'https://www.backpacker.com/trips/eureka-ca-lost-coast-trail/?scope=anon';
  pack({
    id: 'lostcoast', name: 'Lost Coast Trail (Mattole to Black Sands Beach)', short: 'Lost Coast',
    miles: 24.6,
    milesSource: 'BLM: the northern section runs 24.6 mi from Mattole to Black Sands Beach. Waypoint miles come from Backpacker\'s 26 mi version of the trip (Randall Creek 8.3, Spanish Flats 14.9 by adding its 6.6 mi leg), so late-trail miles are less certain than the total.',
    mileNote: 'Sources give 24.6 mi (BLM), 25 (a hiking site), 26 (Backpacker). Mile markers for tide zones are derived: the BLM tide guide gives lengths and landmarks, Backpacker gives Randall Creek at 8.3 mi. Treat every mile as plus or minus 1 to 2 mi and use the landmark names.',
    asof: '2026-10', dir: 'SOBO',
    dirNote: 'Mile 0 is Mattole Beach in the north; most hikers go south to Black Sands Beach (Shelter Cove) with a shuttle. Northbound is possible; the tide-zone rules apply either way.',
    states: ['CA'],
    start: { name: 'Mattole Beach trailhead', lat: null, lon: null },
    end: { name: 'Black Sands Beach (Shelter Cove)', lat: null, lon: null },
    typicalDays: { min: 3, max: 4, note: 'BLM: allow at least three days.' },
    permits: [
      { name: 'King Range Wilderness overnight permit', who: 'Everyone staying overnight; day use needs none', when: 'Recreation.gov, 90-day rolling release at 7:00 a.m. Pacific; up to 3 walk-up permits via a Mon to Sat 8:00 a.m. lottery at the King Range Visitor Center; print up to 7 days before entry', costUsd: 18, url: LCP, note: 'Recreation.gov: $6 per permit reservation fee (non-refundable) plus a $12 per person per trip special-area fee; youth under 16 exempt. The BLM page says "no user fee" for the trail itself, so the permit fees are the ones that count. Check tides for your dates BEFORE buying a permit (BLM). Permit is non-transferable and you must start on the date printed. Cost shown is for one adult: $6 + $12.' },
      { name: 'Hard-sided bear canister', who: 'Every person', when: 'Always', costUsd: null, url: LCP, note: 'Recreation.gov: hard-sided canisters required, at least one per person; bags and hangs are not allowed. Canisters must hold all scented items including trash, soap and sunscreen. Rentals at the King Range Visitor Center (an older trip report quoted $5; check).' },
      { name: 'Campfires and stoves', who: 'Everyone', when: 'Campfire ban listed June 19 to Sept 30 (alert) vs July to Oct (FAQ): confirm', costUsd: null, url: LCP, note: 'A CAL FIRE campfire permit is required for fires and camp stoves.' }
    ],
    seasons: [
      { label: 'Walk-up permits sold', months: [5, 6, 7, 8, 9], note: 'BLM: walk-up permits sold daily at the visitor center May 30 to Sept 5. The BLM page gives no formal hiking season; heavy winter storms can swell the creeks (no bridges) and close roads.' }
    ],
    hazards: [
      { id: 'lc-z1', title: 'Tide zone 1: Punta Gorda (about 0.25 mi)', fromMi: 0, toMi: 8.3, note: 'BLM tide guide: passable below about 6 ft tide. Position within the first 8.3 mi not mile-marked here (Backpacker puts the old lighthouse in the first miles).' },
      { id: 'lc-z2', title: 'Tide zone 2: Sea Lion Gulch to Randall Creek (about 4 mi)', fromMi: 4.3, toMi: 8.3, note: 'BLM: passable below about 2.5 ft tide. Derived miles: Randall Creek 8.3 (Backpacker) minus the 4 mi zone length (BLM). Enter on a receding tide and plan 1 mph; low tide alone does not mean passable.' },
      { id: 'lc-z3', title: 'Tide zone 3: Miller Creek/Miller Flat to Gitchell Creek (about 4.5 mi)', fromMi: 17.1, toMi: 21.6, note: 'BLM: passable below about 3 ft tide. Approximate miles: ends at Gitchell Creek, which one trip report puts about 3 mi from Black Sands Beach (24.6 - 3 = 21.6), minus the 4.5 mi zone length.' },
      { id: 'lc-creeks', title: 'No bridges: creeks swell after storms', fromMi: 0, toMi: 24.6, note: 'BLM: stream crossings can be impassable after heavy winter rains. A trip report adds that Buck Creek is hard to cross in spring/early summer runoff.' },
      { id: 'lc-waves', title: 'Sleeper waves, boulders and soft sand', fromMi: 0, toMi: 24.6, note: 'BLM: large waves can sweep hikers off; much of the route is over large rounded boulders. Sturdy boots.' },
      { id: 'lc-nocell', title: 'No cell coverage', fromMi: 0, toMi: 24.6, note: 'A trip report (SoCal Hiker) states there is no cell coverage; carry a satellite messenger and tell someone your tide plan.' }
    ],
    sections: [
      { id: 'north', name: 'Mattole Beach to Randall Creek', fromMi: 0, toMi: 8.3, note: 'Punta Gorda lighthouse and tide zone 1; zone 2 ends at Randall Creek.' },
      { id: 'mid', name: 'Randall Creek to Miller Flat', fromMi: 8.3, toMi: 17.1, note: 'Spanish Ridge/Spanish Flats uphill section (Backpacker puts Spanish Flats at 14.9).' },
      { id: 'south', name: 'Miller Flat to Black Sands Beach', fromMi: 17.1, toMi: 24.6, note: 'Tide zone 3, Gitchell Creek, then the final miles to Black Sands Beach (no camping at that trailhead; camping is allowed north of Telegraph Creek per BLM).' }
    ],
    points: [
      P(0, 'Mattole Beach trailhead', 'trailhead', null, 'Northern trailhead. Mattole Campground has 14 sites, vault toilets and no water; $8 per BLM (fee may have changed). Conical Rock area squeezes the beach at high tide soon after (Backpacker).', LCB + ' ; ' + LCK),
      P(8.3, 'Randall Creek', 'campsite', null, 'Backpacker: 8.3 mi on day 1. End of tide zone 2.', LCK, { water: { type: 'creek', note: 'Water is plentiful along the beach (BLM); treat it.' } }),
      P(14.9, 'Spanish Flats', 'landmark', null, 'Derived mile (8.3 + 6.6 mi leg, Backpacker). Uphill from the beach.', LCK),
      P(17.1, 'Miller Flat / Big Flat Creek area', 'campsite', null, 'Approximate (see tide zone 3 note). Driftwood shelters and camps (Backpacker).', LCK + ' ; ' + LCP),
      P(21.6, 'Gitchell Creek', 'campsite', null, 'Approximate mile. Tides are not a problem here per Backpacker; end of tide zone 3.', LCK + ' ; ' + LCP, { water: { type: 'creek', note: 'Treat it.' } }),
      P(24.6, 'Black Sands Beach (Shelter Cove)', 'terminus', null, 'Southern end. No camping at the trailhead. Shuttle services run from here to the Mattole end (about 1.5 hours, per a trip report); book ahead.', LCB)
    ],
    links: [
      { label: 'BLM: Lost Coast Trail', url: LCB },
      { label: 'Recreation.gov: King Range Wilderness permit', url: LCP },
      { label: 'Backpacker: Lost Coast Trail', url: LCK }
    ],
    disclaimer: 'Tide-zone mile markers are derived and approximate. Always carry a current tide table and the BLM tide guide; if in doubt about a zone, wait. The BLM visitor center phone line is 707-986-5400 (printed on a 2013 trip report; confirm on blm.gov).'
  });

  /* ================= Northville-Placid Trail ================= */
  var NE = 'https://goeast.ems.com/?p=87891';
  var NP = 'https://nptrail.org/trip-planning';
  var NA = 'https://albany.adk.org/about-our-chapter/northville-placid-trail/';
  pack({
    id: 'npt', name: 'Northville-Placid Trail', short: 'NPT',
    miles: 138.4,
    milesSource: 'Eastern Mountain Sports trip article (2021): mile points northbound from Northville, ending at 138.36 mi at the Averyville Road lot. The ADK chapter page says about 135 mi and a NY State Parks list says 133; the nptrail.org site says about 136.',
    mileNote: 'Official totals differ (133 to 138). Mile points in this pack come from a single 2021 article; the ADK guidebook distance log is the authority and the trail is re-routed. About 7.2 mi of the route are road walks (3.5 mi in Northville, about 3 mi in Piseco, a short stretch near Wakely Dam, 0.7 mi on Tarbell Road in Long Lake) per nptrail.org.',
    asof: '2026-10', dir: 'NOBO',
    dirNote: 'The guidebook and most hikers go south to north from Northville to Lake Placid; the ADK distance logs run that way.',
    states: ['NY'],
    start: { name: 'Waterfront Park, Northville', lat: null, lon: null },
    end: { name: 'Averyville Road and Old Military Road, Lake Placid', lat: null, lon: null },
    typicalDays: { min: 8, max: 12, note: 'EMS article: a typical thru-hike takes 8 to 12 days; mud, creek crossings and blowdowns slow pace.' },
    permits: [
      { name: 'No permit for hiking', who: 'Individual hikers', when: 'n/a', costUsd: null, url: NE, note: 'EMS article: no permits required. First-come lean-tos and designated sites; carry a tent as backup. Temporary camping is allowed at undeveloped state sites (ADK chapter page).' },
      { name: 'Bear canister (High Peaks Wilderness)', who: 'Overnight hikers between Long Lake and Lake Placid', when: 'As of 2021 per the EMS article (NYSDEC rule); check the DEC site for current rules', costUsd: null, url: NE, note: 'Canisters must be kept 100 ft from campsites and hold all scented items.' }
    ],
    seasons: [
      { label: 'Warm season', months: [6, 7, 8, 9], note: 'EMS: summer bugs are severe in wetland sections; the trail is generally wet. Post office hours may change off-season. No formal season is given by nptrail.org.' }
    ],
    hazards: [
      { id: 'npt-mud', title: 'Mud, blowdowns, beaver flooding and relocations', fromMi: 0, toMi: 138.4, note: 'nptrail.org: conditions can change hourly; mud, relocations, washed-out bridges, beaver activity, severe weather, biting insects, missing markers and overgrown sections.' },
      { id: 'npt-westcanada', title: 'West Canada Lakes: remote and wet', fromMi: 43.0, toMi: 74.2, note: 'EMS describes the West Canada Lakes Wilderness as remote with wetlands and old bridges. Long stretch between Piseco and Wakely Dam.' },
      { id: 'npt-ford', title: 'West Stony Creek ford (about 90 ft wide)', fromMi: 0, toMi: 12.3, note: 'EMS: check the water level before crossing; position within the section not given.' },
      { id: 'npt-private', title: 'Stretch near Rodney Point crosses private property', fromMi: 100.4, toMi: 112.9, note: 'EMS: respect landowner rules; position approximate (between Long Lake and Shattuck Clearing).' },
      { id: 'npt-highpeaks', title: 'High Peaks Wilderness: bear canister rule', fromMi: 100.4, toMi: 138.4, note: 'See Permits: DEC canister rule applied Long Lake to Lake Placid as of 2021.' }
    ],
    sections: [
      { id: 'south', name: 'Northville to Piseco', fromMi: 0, toMi: 43.0, note: 'Northville road walk, Benson Road, Silver Lake Wilderness, West Branch Sacandaga bridge, Piseco (post office).' },
      { id: 'wcl', name: 'Piseco to Wakely Dam (West Canada Lakes)', fromMi: 43.0, toMi: 74.2, note: 'The most remote part of the southern trail.' },
      { id: 'mid', name: 'Wakely Dam to Long Lake', fromMi: 74.2, toMi: 100.4, note: 'Lake Durant/Rt 28 (Blue Mountain Lake is a short walk west), Tirrell Pond, Long Lake village.' },
      { id: 'north', name: 'Long Lake to Lake Placid', fromMi: 100.4, toMi: 138.4, note: 'Cold River country, Shattuck Clearing, Duck Hole, Averyville Road.' }
    ],
    points: [
      P(0, 'Northville (Waterfront Park, southern terminus)', 'terminus', null, 'Wooden arch at the terminus. About 3.5 mi of road walk through Northville before the trail proper.', NE + ' ; ' + NP + ' ; ' + NA),
      P(12.3, 'Benson Road', 'trailhead', null, 'Road crossing (EMS mile 12.32).', NE),
      P(33.8, 'Whitehouse (West Branch Sacandaga bridge)', 'landmark', null, 'EMS mile 33.83.', NE),
      P(43.0, 'Piseco', 'town', null, 'First resupply stop; post office on the trail (call ahead for hours) and the Oxbow Inn about a 1 mi round trip from the Route 8 trailhead. About 3 mi of road walk through Piseco.', NE + ' ; ' + NP, { svc: { post: 'Piseco post office (mail ahead; call to confirm hours)', restaurant: 'Oxbow Inn (about 1 mi round trip, EMS)' } }),
      P(58.1, 'West Canada Lakes', 'landmark', null, 'EMS mile 58.07. Remote wilderness with lean-tos.', NE),
      P(74.2, 'Wakely Dam', 'landmark', null, 'EMS mile 74.23. Short road walk near Cedar River Road.', NE + ' ; ' + NP),
      P(86.4, 'Lake Durant / NY-28 crossing', 'trailhead', null, 'EMS mile 86.43. Blue Mountain Lake is a short walk west; its post office and Stewart\'s shop serve resupply (confirm hours).', NE + ' ; ' + NA, { svc: { post: 'Blue Mountain Lake post office (mail ahead)' } }),
      P(100.4, 'Long Lake (village)', 'town', null, 'EMS mile about 100.38; a detour of roughly 3 mi round trip. Food, lodging and the Adirondack Hotel, which accepts resupply boxes marked "NPT thru-hiker". Tarbell Road walk 0.7 mi (nptrail.org). Bear canister rule starts in the High Peaks section north of here.', NE + ' ; ' + NP, { svc: { post: 'Long Lake post office (mail ahead)', lodging: 'Adirondack Hotel (accepts resupply boxes, EMS)' } }),
      P(112.9, 'Shattuck Clearing', 'landmark', null, 'EMS mile 112.87.', NE),
      P(124.7, 'Duck Hole', 'campsite', null, 'EMS mile 124.71. Lean-to at Duck Hole.', NE),
      P(138.4, 'Averyville Road lot (Lake Placid, northern terminus)', 'terminus', null, 'EMS mile 138.36; official end at Averyville Road and Old Military Road.', NE + ' ; ' + NP)
    ],
    links: [
      { label: 'Northville-Placid Trail (nptrail.org)', url: NP },
      { label: 'ADK Albany chapter: NPT', url: NA },
      { label: 'EMS: NPT overview', url: NE }
    ],
    disclaimer: 'Mile points come from a single 2021 article; use the ADK Northville-Placid Trail guidebook for official mileages, lean-tos and current closures.'
  });

  /* ================= Zion West Rim Trail ================= */
  var ZA = 'https://americansouthwest.net/utah/zion/west-rim-trail.html';
  var ZC = 'https://www.citrusmilo.com/zionguide/westrimtrail.php';
  pack({
    id: 'zionwest', name: 'Zion West Rim Trail (Lava Point to the Grotto)', short: 'West Rim',
    miles: 14.5,
    milesSource: 'American Southwest: 14.5 mi one way from Lava Point to the Grotto. A guide (Citrus Milo) says about 15 mi from the West Rim trailhead and 16.2 mi from Lava Point, which adds a 1.2 mi dirt-road walk.',
    mileNote: 'Sources disagree (14.5, 15, 16.2); landmark miles are approximate and rounded from one guide that says it has no mile-by-mile table. Use the NPS map at the Wilderness Desk.',
    asof: '2026-10', dir: 'SOBO',
    dirNote: 'Top-down from Lava Point (7,890 ft, northern trailhead) to the Grotto in Zion Canyon, a drop of about 3,200 ft.',
    states: ['UT'],
    start: { name: 'Lava Point trailhead (7,890 ft)', lat: null, lon: null },
    end: { name: 'The Grotto (Zion Canyon shuttle stop 6)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Zion wilderness permit (overnight)', who: 'Backpackers; nine designated campsites on Horse Pasture Plateau', when: 'Pick up at the Zion Wilderness Desk or the Kolob Visitor Center (also where you choose a site); check NPS for reservation rules', costUsd: null, url: ZC, note: 'Citrus Milo (a guide, not NPS): day hikes need no permit; Angels Landing needs its own permit. Fees were not found. Verify on nps.gov/zion.' }
    ],
    seasons: [
      { label: 'Spring to fall', months: [4, 5, 6, 7, 8, 9, 10], note: 'American Southwest: spring, summer and fall; the northern half above 7,000 ft is cooler in summer. Lava Point is usually inaccessible in winter and snow lingers in shaded spots (Citrus Milo).' }
    ],
    hazards: [
      { id: 'zw-exposure', title: 'White Cliffs descent: exposed, unfenced drops', fromMi: 10.5, toMi: 14.5, note: 'Citrus Milo: the last 4 miles from Cabin Spring have exposed sections with sheer drops of about 2,000 ft. Steep switchbacks and crumbling sandstone (American Southwest).' },
      { id: 'zw-water', title: 'Springs can run dry', fromMi: 0, toMi: 10.5, note: 'Citrus Milo: Sawmill Springs, Potato Hollow and Cabin Spring can run dry later in the season; carry water for the lower section below the plateau and ask the Wilderness Desk about conditions.' },
      { id: 'zw-snow', title: 'Snow and ice early and late in the year', fromMi: 0, toMi: 14.5, note: 'Citrus Milo: snow, drifts and ice on exposed sections in winter and the early season. The Lava Point road can be a problem for non-4WD cars when wet.' }
    ],
    sections: [
      { id: 'plateau', name: 'Horse Pasture Plateau', fromMi: 0, toMi: 10.5, note: 'Nine designated campsites and three springs (American Southwest).' },
      { id: 'cliffs', name: 'White Cliffs descent to the Grotto', fromMi: 10.5, toMi: 14.5, note: 'Scout Lookout and the Angels Landing junction are near the bottom; the lower trail is much busier.' }
    ],
    points: [
      P(0, 'Lava Point (northern trailhead)', 'trailhead', 7890, 'Highest place in the park (American Southwest). Springdale outfitters offer shuttles to Lava Point. Citrus Milo counts about 1.2 mi of dirt road between Lava Point and the West Rim trailhead; this pack\'s mile 0 is Lava Point.', ZA + ' ; ' + ZC),
      P(5, 'Potato Hollow (spring, Campsite 8)', 'water', null, 'Citrus Milo: roughly 5 mi from the trailhead, after a gradual two-mile descent. Spring may dry late in the season.', ZC, { water: { type: 'spring', note: 'Citrus Milo: may run dry later in the season. Treat.' } }),
      P(10.5, 'Cabin Spring (West Rim Spring)', 'water', null, 'Approximate mile (the White Cliffs descent is the last 4 mi starting here, Citrus Milo). Spring may run dry.', ZC, { water: { type: 'spring', note: 'Citrus Milo: may run dry later in the season. Treat.' } }),
      P(14.0, 'Scout Lookout / Angels Landing junction', 'landmark', null, 'Near the bottom of the cliffs; Grotto is about an hour further including Walter\'s Wiggles (Citrus Milo). Mile approximate.', ZC),
      P(14.5, 'The Grotto', 'terminus', null, 'Stop 6 on the Zion Canyon shuttle (Citrus Milo). Bring your own water for the lower section.', ZC + ' ; ' + ZA)
    ],
    links: [
      { label: 'American Southwest: West Rim Trail', url: ZA },
      { label: 'Citrus Milo: West Rim Trail guide', url: ZC }
    ],
    disclaimer: 'Mile markers are approximate and from private guides; the NPS pages were not read. Confirm permits, springs and conditions at the Zion Wilderness Desk.'
  });
})();
