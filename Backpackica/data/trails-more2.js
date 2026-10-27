/* Backpackica: second batch of additional trail packs (Uinta Highline, Loyalsock, Susquehannock, Desolation Wilderness
   Echo Lake to Glen Alpine, Superior Hiking Trail, Wind River Highline segment). Load after trails-more.js (same P() shape).
   Facts come from the pages listed in data/SOURCES-more2.md (read 2026-10). Anything not read is null.
   No latitude/longitude were read from any page, so lat/lon are null everywhere. Mile markers marked "derived" in a note
   are sums or differences of printed figures. Packs with few points say so in mileNote: sparse is honest, not a bug. */
window.TRAILS = window.TRAILS || {};
(function () {
  'use strict';
  function P(mi, name, kind, elev, note, src, o) {
    o = o || {};
    return { mi: mi, name: name, kind: kind, lat: null, lon: null, elev: elev == null ? null : elev, note: note || '', src: src || null, off: o.off || null, svc: o.svc || null, water: o.water || null, phone: o.phone || null, url: o.url || null };
  }
  function pack(t) { window.TRAILS[t.id] = t; return t; }
  var ALLYEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  /* ================= Uinta Highline Trail ================= */
  var UW = 'https://en.wikipedia.org/wiki/Uinta_Highline_Trail';
  var US = 'https://sectionhiker.com/uinta-highline-trail-a-quick-and-dirty-guide/';
  pack({
    id: 'uinta', name: 'Uinta Highline Trail (McKee Draw to Hayden Pass)', short: 'Uinta Highline',
    miles: 104,
    milesSource: 'Wikipedia (Uinta Highline Trail) and SectionHiker both give about 104 mi from the McKee Draw trailhead (east, US 191) to the Hayden Pass trailhead (west, Utah 150). Mile 0 is McKee Draw.',
    mileNote: 'Only a handful of mile points are printed anywhere I could read (Wikipedia: Little Brush Creek 4.3, Leidy Peak trailhead 24, Chepeta Lake trailhead 38). Wikipedia says starting at Leidy Peak leaves 80 mi and at Chepeta Lake 66 mi (24 + 80 and 38 + 66 both equal 104); SectionHiker says 79 and 66. The Rocky Sea Pass point is derived from Wikipedia giving the Ashley National Forest part (Trail 025) as 96 mi and the Wasatch-Cache part (Trail 083) as 8 mi, which assumes Trail 025 starts at McKee Draw. Anderson Pass, Kings Peak, Gunsight and the other passes have no mile marker here: check a map or guide.',
    asof: '2026-10', dir: 'WB',
    dirNote: 'Mile 0 is the east end (McKee Draw) and the route runs west to Hayden Pass, the direction SectionHiker recommends. Reverse it with the direction switch; miles still read from McKee Draw.',
    states: ['UT'],
    start: { name: 'McKee Draw Trailhead (US 191, Forest Road 062), 8,240 ft', lat: null, lon: null },
    end: { name: 'Hayden Pass Trailhead (Utah 150, near Mirror Lake)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'No backpacking permit listed; recreation pass at Hayden Pass', who: 'Overnight hikers', when: 'Not applicable as read', costUsd: null, url: null, note: 'Wikipedia: no permit is required to hike the trail. SectionHiker: backpacking permits are not currently required; the Hayden Pass trailhead is in a federal fee area (day pass or America the Beautiful pass on the dash); McKee Draw needs no pass. Over half the route is in the High Uintas Wilderness (foot and horse only; SectionHiker lists group limits of 14 people and 15 head of stock). Rules change: check with the Forest Service (Ashley and Uinta-Wasatch-Cache national forests) before you go; no official page was read.' }
    ],
    seasons: [
      { label: 'Summer window', months: [7, 8, 9], note: 'Wikipedia: July to September. Snowmelt and icy slopes early in the season; afternoon storms (SectionHiker).' }
    ],
    hazards: [
      { id: 'uinta-water', title: 'Scarce water early in the route', fromMi: 4.3, toMi: 25, note: 'Wikipedia: water can be scarce for more than 20 mi after Little Brush Creek (mile 4.3), especially late in the season. SectionHiker: scarce for about the first 25 mi, then not a concern. Carry capacity and treat all water.' },
      { id: 'uinta-lightning', title: 'Afternoon thunderstorms and lightning on passes', fromMi: 0, toMi: 104, note: 'SectionHiker: storms can stack up from the west in the afternoon; cross passes early in the day. Wikipedia lists severe weather and altitude as hazards (average trail elevation 10,700 ft; high point Anderson Pass 12,700 ft).' },
      { id: 'uinta-snow', title: 'Snowfields and icy slopes', fromMi: 0, toMi: 104, note: 'Snowfields persist depending on the winter and the month (SectionHiker; Wikipedia: icy slopes early season). Turn around rather than cross icy slopes without the gear and skill.' },
      { id: 'uinta-rock', title: 'Very rocky tread', fromMi: 0, toMi: 104, note: 'SectionHiker: large embedded rocks and crumbly quartz-sandstone; ankle injuries are a risk far from help.' },
      { id: 'uinta-bears', title: 'Black bears; no canister rule listed', fromMi: 0, toMi: 104, note: 'SectionHiker: black bears are present, store food and scented items properly; canisters are not required on that page.' },
      { id: 'uinta-cell', title: 'Unreliable cell coverage', fromMi: 0, toMi: 104, note: 'SectionHiker: service is unreliable (some phones work at Anderson Pass). Carry a satellite messenger or know your exit points; the Forest Service says to call 911 in an emergency.' }
    ],
    sections: [
      { id: 'east', name: 'McKee Draw to Leidy Peak', fromMi: 0, toMi: 24, note: 'Forested, meadow-filled first section; Little Brush Creek at 4.3. Dry stretch.' },
      { id: 'mid', name: 'Leidy Peak to Chepeta Lake', fromMi: 24, toMi: 38, note: 'Shorter versions of the hike start at Leidy Peak (about 80 mi to go) or Chepeta Lake (66 mi).' },
      { id: 'west', name: 'Chepeta Lake to Hayden Pass', fromMi: 38, toMi: 104, note: 'High Uintas Wilderness section with the high passes; Rocky Sea Pass divides the Ashley National Forest and Wasatch-Cache National Forest parts.' }
    ],
    points: [
      P(0, 'McKee Draw Trailhead', 'trailhead', 8240, 'East end, 0.5 mi west of US 191 on Forest Road 062; lowest point of the trail (Wikipedia: 8,240 ft). No recreation pass needed here (SectionHiker).', UW + ' ; ' + US),
      P(4.3, 'Little Brush Creek crossing', 'water', null, 'Water can be scarce for 20+ mi after this crossing (Wikipedia).', UW, { water: { type: 'creek', note: 'Wikipedia lists the crossing; flow late in the season not stated. Treat all water.' } }),
      P(24, 'Leidy Peak Trailhead', 'trailhead', null, 'SectionHiker says water is not a concern after about here (around mile 25). Shortcut start: about 80 mi to Hayden Pass.', UW + ' ; ' + US),
      P(38, 'Chepeta Lake Trailhead', 'trailhead', null, 'Shortcut start: about 66 mi to Hayden Pass.', UW),
      P(96, 'Rocky Sea Pass (approximate)', 'pass', null, 'Derived mile: Wikipedia gives Trail 025 (Ashley NF) as 96 mi and says Rocky Sea Pass divides it from Trail 083 (Wasatch-Cache NF, 8 mi). Treat as plus or minus several miles.', UW),
      P(104, 'Hayden Pass Trailhead', 'trailhead', null, 'West end near Mirror Lake on Utah 150. Federal fee area: recreation pass on the dash (SectionHiker).', UW + ' ; ' + US)
    ],
    links: [
      { label: 'Wikipedia: Uinta Highline Trail', url: UW },
      { label: 'SectionHiker: quick guide', url: US }
    ],
    disclaimer: 'Only a few mile points were verifiable and none come from the Forest Service. Passes, water and exits need a map or a guidebook. Check current conditions and rules with the Forest Service before you go.'
  });

  /* ================= Loyalsock Trail ================= */
  var LW = 'https://en.wikipedia.org/wiki/Loyalsock_Trail';
  var LK = 'https://www.kta-hike.org/loyalsock-trail.html';
  pack({
    id: 'loyalsock', name: 'Loyalsock Trail (PA 87 to Mead Road)', short: 'Loyalsock Trail',
    miles: 59.2,
    milesSource: 'Wikipedia and the Keystone Trails Association page both give 59.2 mi from PA 87 (west, mile 0) to Mead Road near US 220 (east, mile 59.2).',
    mileNote: 'Mile points are from Wikipedia and are not the Alpine Club guidebook numbers. The KTA page says the western end is 8.6 mi north of I-180/US 220 at Montoursville, Wikipedia says about 10 mi north of Montoursville. The trail has several long marked spurs (Red X) not counted in 59.2. Worlds End State Park is passed after mile 45.9 but its mile is not printed.',
    asof: '2026-10', dir: 'EB',
    dirNote: 'Mile 0 is the west end (PA 87) and the route runs east, the direction Wikipedia describes. Reverse it with the direction switch.',
    states: ['PA'],
    start: { name: 'PA 87 Trailhead (Lycoming County)', lat: null, lon: null },
    end: { name: 'Mead Road (near US 220, Ringdale/Laporte area)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Camping and permit rules not verified', who: 'Overnight hikers', when: 'Unknown', costUsd: null, url: null, note: 'Neither page read states camping rules or permits. The trail is in Loyalsock State Forest (Pennsylvania DCNR) and Worlds End State Park, which have their own rules: check with DCNR before an overnight trip.' }
    ],
    seasons: [
      { label: 'Open all year', months: ALLYEAR, note: 'Wikipedia: open year-round and rated strenuous. Season-specific conditions (snow, hunting seasons) were not read.' }
    ],
    hazards: [
      { id: 'loy-bugs', title: 'Ticks, mosquitoes, rattlesnakes, black bears', fromMi: 0, toMi: 59.2, note: 'Wikipedia lists uneven and wet terrain, rattlesnakes, mosquitoes, ticks and black bears. Check for ticks daily.' },
      { id: 'loy-nettles', title: 'Stinging nettles and briars', fromMi: 0, toMi: 59.2, note: 'KTA: nettles and briars are becoming a serious challenge. Location not given.' },
      { id: 'loy-ladder', title: 'Ladder up a short cliff', fromMi: 34.9, toMi: 34.9, note: 'Wikipedia: the trail uses a ladder to climb a short cliff near mile 34.9. Be careful when wet.' },
      { id: 'loy-creek', title: 'Hessler Run descent and steep climbs', fromMi: 13.1, toMi: 14.1, note: 'Wikipedia: a steep descent along Hessler Run then a climb back to the plateau. Range of the climb is approximate.' },
      { id: 'loy-bridge', title: 'Loyalsock Creek crossings (road bridges)', fromMi: 55.3, toMi: 55.3, note: 'Wikipedia: crosses Loyalsock Creek on an old iron road bridge at 55.3. A second crossing in Worlds End State Park is on a park road bridge (mile not given). Hikers share bridges with vehicles.' }
    ],
    sections: [
      { id: 'west', name: 'PA 87 to Highland Lake', fromMi: 0, toMi: 18.3, note: 'Allegheny Plateau, Sock Rock, Smiths Knob, Hessler Run.' },
      { id: 'mid', name: 'Highland Lake to PA 154', fromMi: 18.3, toMi: 45.9, note: 'Sullivan County; highest point at 19.9, side trail to Angel Falls at 23.3, High Knob vistas, the ladder.' },
      { id: 'east', name: 'PA 154 to Mead Road', fromMi: 45.9, toMi: 59.2, note: 'Worlds End State Park, Sones Pond, the iron bridge, the Haystacks.' }
    ],
    points: [
      P(0, 'PA 87 Trailhead (west end)', 'trailhead', null, 'Climbs onto the Allegheny Plateau and passes Sock Rock.', LW + ' ; ' + LK),
      P(6.7, 'Smiths Knob', 'landmark', null, 'High point on the early trail.', LW),
      P(13.1, 'Hessler Run descent', 'landmark', null, 'Steep descent along Hessler Run, then a climb back to the plateau.', LW),
      P(18.3, 'Highland Lake overlook / Sullivan County line', 'landmark', null, 'Passes above Highland Lake and enters Sullivan County.', LW),
      P(19.9, 'Highest point of the trail', 'landmark', 2140, 'Wikipedia: highest point is 2,140 ft, just north of the county line.', LW),
      P(23.3, 'Angel Falls side trail', 'landmark', null, 'Side trail to Angel Falls (80 ft per Wikipedia).', LW),
      P(25.0, 'High Knob section', 'landmark', null, 'Rugged section skirting High Knob with several vistas.', LW),
      P(34.9, 'Cliff ladder', 'landmark', null, 'A ladder climbs a short cliff.', LW),
      P(45.9, 'PA 154 crossing', 'trailhead', null, 'Road crossing; Worlds End State Park follows (its mile is not printed).', LW),
      P(53.3, 'Sones Pond', 'water', null, 'Trail passes along the pond, then descends steeply toward the creek about a mile later. Treat any water.', LW, { water: { type: 'pond', note: 'Wikipedia names the pond; quality not stated. Treat all water.' } }),
      P(55.3, 'Loyalsock Creek iron road bridge', 'landmark', null, 'Crosses Loyalsock Creek on an old iron road bridge.', LW),
      P(57.2, 'The Haystacks', 'landmark', null, 'Rock formation in the creek.', LW),
      P(59.2, 'Mead Road (east end)', 'trailhead', null, 'East terminus, a short way from US 220.', LW + ' ; ' + LK)
    ],
    links: [
      { label: 'Keystone Trails Association: Loyalsock Trail', url: LK },
      { label: 'Wikipedia: Loyalsock Trail', url: LW }
    ],
    disclaimer: 'Mile points come from Wikipedia, not the club guidebook. No water, camping or permit data was verified: get the Alpine Club guide and check with Pennsylvania DCNR before an overnight trip.'
  });

  /* ================= Susquehannock Trail System ================= */
  var SW = 'https://en.wikipedia.org/wiki/Susquehannock_Trail_System';
  var SD = 'https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-forests/find-a-forest/susquehannock/hiking';
  pack({
    id: 'sts', name: 'Susquehannock Trail System (loop)', short: 'STS',
    miles: 83.4,
    milesSource: 'Wikipedia: 83.4 mi loop, mile points clockwise from the Northern Gateway at the Susquehannock State Forest headquarters on US 6 (a 0.4 mi access trail joins the loop). The Pennsylvania DCNR page calls it an 85-mile loop.',
    mileNote: 'Wikipedia (83.4) and DCNR (85) differ by 1.6 mi, likely a rounded figure or the access trail. All mile points are Wikipedia, clockwise from the Northern Gateway, and are approximate against the club maps.',
    asof: '2026-10', dir: 'CW',
    dirNote: 'Wikipedia gives clockwise as the traditional direction and its mile points run that way. Counterclockwise with the direction switch reads the same miles backward.',
    states: ['PA'],
    start: { name: 'Northern Gateway, Susquehannock State Forest headquarters on US 6 (Potter County)', lat: null, lon: null },
    end: { name: 'Back at the Northern Gateway (loop)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Camping and permit rules not verified', who: 'Overnight hikers', when: 'Unknown', costUsd: null, url: SD, note: 'The DCNR hiking page did not state camping rules or permits (it points to the district office and the Susquehannock Trail Club, stc-hike.org, for maps and guides). Wikipedia says only that the trail has several overnight shelters.' }
    ],
    seasons: [
      { label: 'Open all year', months: ALLYEAR, note: 'Wikipedia: year-round. Strenuous with high elevation change. Hunting-season rules were not read.' }
    ],
    hazards: [
      { id: 'sts-wildlife', title: 'Rattlesnakes, ticks, mosquitoes, black bears', fromMi: 0, toMi: 83.4, note: 'Wikipedia lists uneven and wet terrain, rattlesnakes, mosquitoes, ticks and black bears.' },
      { id: 'sts-remote', title: 'Hammersley Wild Area: remote', fromMi: 54.4, toMi: 83.4, note: 'Wikipedia has the trail entering the Hammersley Wild Area at 54.4; DCNR describes it as a remote wilderness hiking option. End of the stretch is approximate.' },
      { id: 'sts-road', title: 'Short road sections', fromMi: 13.5, toMi: 13.5, note: 'Wikipedia: a brief stretch on PA 44 near 13.5 and a PA 144 crossing at 26.5. Watch for traffic.' }
    ],
    sections: [
      { id: 'n', name: 'Northern Gateway to PA 144', fromMi: 0, toMi: 26.5, note: 'Jacob Hollow, Lyman Run suspension bridge (6.6) with a 1.5 mi side trail to Lyman Run State Park, dynamite-shed shelter (10.5).' },
      { id: 'mid', name: 'PA 144 to Cross Fork', fromMi: 26.5, toMi: 49.0, note: 'Spook Hollow, link trails to the Black Forest Trail (31.9 and 34.2), Donut Hole Trail junction (35.6), Ted\'s Truss footbridge.' },
      { id: 's', name: 'Cross Fork to the gateway', fromMi: 49.0, toMi: 83.4, note: 'Hammersley Wild Area, East Fork Sinnemahoning Creek, Prouty Place and Patterson State Parks.' }
    ],
    points: [
      P(0, 'Northern Gateway (loop start)', 'trailhead', null, 'Susquehannock State Forest headquarters on US 6; a 0.4 mi access trail joins the loop.', SW + ' ; ' + SD),
      P(3.9, 'Jacob Hollow descent', 'landmark', null, 'Descent into Jacob Hollow.', SW),
      P(6.6, 'Lyman Run suspension bridge', 'landmark', null, 'A 1.5 mi side trail leads to Lyman Run State Park.', SW),
      P(10.5, 'Hiker shelter (former dynamite shed)', 'campsite', null, 'Now a hiker shelter per Wikipedia; rules and capacity not verified.', SW),
      P(13.5, 'PA 44 stretch / old fire tower and foreman cabin', 'landmark', null, 'Brief road section on PA 44.', SW),
      P(20.6, 'Second suspension bridge', 'landmark', null, '', SW),
      P(26.5, 'PA 144 crossing', 'trailhead', null, 'Road crossing. The southern gateway is at Ole Bull State Park on PA 144 (mile of the junction with the loop not stated).', SW),
      P(30.8, 'Spook Hollow', 'landmark', null, '', SW),
      P(35.6, 'Donut Hole Trail junction', 'landmark', null, 'Shared with the Donut Hole Trail for 8.6 mi.', SW),
      P(36.9, 'Ted\'s Truss footbridge', 'landmark', null, '', SW),
      P(49.0, 'Cross Fork (town)', 'town', null, 'Services in town not verified: check with the source before relying on a resupply here.', SW),
      P(54.4, 'Hammersley Wild Area entry', 'landmark', null, 'Remote wild area (DCNR).', SW + ' ; ' + SD),
      P(63.4, 'Semi-developed area on the East Fork Sinnemahoning Creek', 'landmark', null, 'Water quality not verified; treat all water.', SW),
      P(71.7, 'Side trail to Prouty Place State Park', 'landmark', null, '', SW),
      P(76.7, 'Patterson State Park', 'landmark', null, '', SW),
      P(80.4, 'Splash Dam Hollow', 'landmark', null, '', SW),
      P(83.4, 'Loop end (Northern Gateway)', 'trailhead', null, 'Back at the loop start.', SW)
    ],
    links: [
      { label: 'Pennsylvania DCNR: Susquehannock hiking', url: SD },
      { label: 'Wikipedia: Susquehannock Trail System', url: SW }
    ],
    disclaimer: 'Mile points come from Wikipedia, not the club maps. No water, camping or permit data was verified: contact the Susquehannock Trail Club or the DCNR district office before an overnight trip.'
  });

  /* ================= Desolation Wilderness: Echo Lake to Glen Alpine ================= */
  var DM = 'https://sierrarecmagazine.com/desolation-wilderness-trailhead-and-mileage/';
  var DP = 'https://fs.usda.gov/r05/eldorado/permits/desolation-wilderness-permits';
  var DW = 'https://fs.usda.gov/r05/eldorado/wilderness/desolation-wilderness';
  pack({
    id: 'desolation', name: 'Desolation Wilderness: Echo Lake to Glen Alpine via Lake Aloha', short: 'Desolation',
    miles: 13.3,
    milesSource: 'Sierra Recreation magazine trailhead and mileage table: Echo Lake trailhead to Lake Aloha 7.5 mi and Glen Alpine trailhead to Lake Aloha 5.8 mi. 7.5 + 5.8 = 13.3 (derived sum; assumes both trails meet at Lake Aloha, which the table supports but does not state as one route).',
    mileNote: 'Mile 0 is the Echo Lake trailhead. Lake points before Lake Aloha are the table\'s one-way miles from Echo Lake. Glen Alpine side lakes (Susie, Heather, Gilmore) are not placed because the table does not say they lie on this line. The pack does not use the Tahoe Rim Trail or PCT miles; the Tahoe Rim Trail pack covers those.',
    asof: '2026-10', dir: 'FWD',
    dirNote: 'Runs from Echo Lake (Highway 50 side, south) to Glen Alpine (Lake Tahoe side, north). Reverse it with the direction switch.',
    states: ['CA'],
    start: { name: 'Echo Lake trailhead (Lake Tahoe Basin side)', lat: null, lon: null },
    end: { name: 'Glen Alpine trailhead (Lake Tahoe Basin side)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Desolation Wilderness overnight permit', who: 'Every overnight visitor', when: 'Required year-round. 70% of the daily quota is reservable on Recreation.gov from 6 months to 1 day before the entry date; the other 30% is issued same day at the Placerville Ranger Station in Camino, 7 days a week, from the Friday before Memorial Day. Permits can also be picked up at the Forest Supervisor\'s Office in South Lake Tahoe (Mon-Fri 8:00 to 4:30) and the Placerville Ranger District; Taylor Creek Visitor Center was not issuing permits when read.', costUsd: null, url: DP, note: 'Eldorado NF page updated March 2026. Fees were not listed on the page read: check the permit page. Day use also needs a permit (DW). Hard-sided bear canisters are required for all overnight visitors. The Tahoe Rim Trail thru-hike zone (10 spaces per night, 2 nights, within 300 ft of the trail, no camping along or around Lake Aloha) is only for people completing the whole TRT in one trip; it does not apply to other hikers. The Forest Service alert at the time of reading said fire restrictions were in effect forest-wide, so check the current order.' }
    ],
    seasons: [
      { label: 'Permits needed all year', months: ALLYEAR, note: 'Overnight permits are required year-round (Eldorado NF). Snow season dates were not on the pages read: check conditions.' }
    ],
    hazards: [
      { id: 'des-bears', title: 'Black bears; hard-sided canister required', fromMi: 0, toMi: 13.3, note: 'Eldorado NF requires hard-sided canisters for all overnight visitors; the wilderness page says black bears are increasingly common.' },
      { id: 'des-aloha', title: 'Lake Aloha: no camping in the TRT thru-hike zone; difficult approach from Glen Alpine', fromMi: 7.5, toMi: 13.3, note: 'The magazine table rates the Glen Alpine route to Lake Aloha as Difficult and the Echo Lake route as Moderate. Treat these as the magazine\'s ratings, not agency ones.' },
      { id: 'des-fire', title: 'Fire restrictions', fromMi: 0, toMi: 13.3, note: 'The Forest Service wilderness page showed forest-wide fire restrictions (fire danger High) when read. Rules change: check the current order.' }
    ],
    sections: [
      { id: 'echo', name: 'Echo Lake to Lake Aloha', fromMi: 0, toMi: 7.5, note: 'Echo Lake, Tamarack, Haypress Meadow, Lake Lucille, Lake of the Woods.' },
      { id: 'glen', name: 'Lake Aloha to Glen Alpine', fromMi: 7.5, toMi: 13.3, note: '5.8 mi (rated Difficult in the source table).' }
    ],
    points: [
      P(0, 'Echo Lake trailhead', 'trailhead', null, 'Start. Check with the Forest Service on any water-taxi or road arrangements; none were read.', DM),
      P(2.5, 'Upper Echo Lake', 'water', null, 'Listed as an Easy hike from the Echo Lake trailhead.', DM, { water: { type: 'lake', note: 'Treat all lake water.' } }),
      P(3.8, 'Tamarack Lake', 'water', null, '', DM, { water: { type: 'lake', note: 'Treat all lake water.' } }),
      P(4.2, 'Haypress Meadow', 'landmark', null, '', DM),
      P(5.2, 'Lake Lucille', 'water', null, '', DM, { water: { type: 'lake', note: 'Treat all lake water.' } }),
      P(5.3, 'Lake of the Woods', 'water', null, '', DM, { water: { type: 'lake', note: 'Treat all lake water.' } }),
      P(7.5, 'Lake Aloha', 'water', null, 'Meeting point of the two trails in this pack. Camping near Lake Aloha is not allowed in the TRT thru-hike zone; other camping rules were not read.', DM + ' ; ' + DP, { water: { type: 'lake', note: 'Treat all lake water.' } }),
      P(13.3, 'Glen Alpine trailhead', 'trailhead', null, 'Derived mile: 7.5 + 5.8.', DM)
    ],
    links: [
      { label: 'Eldorado NF: Desolation Wilderness permits', url: DP },
      { label: 'Eldorado NF: Desolation Wilderness', url: DW },
      { label: 'Sierra Recreation: trailheads and mileage', url: DM }
    ],
    disclaimer: 'Mileage is from a magazine table, not the Forest Service; permit fees, campfire, group size and camping-distance rules were not on the pages read. Check the Eldorado National Forest before you go.'
  });

  /* ================= Superior Hiking Trail ================= */
  var HW = 'https://en.wikipedia.org/wiki/Superior_Hiking_Trail';
  var HM = 'https://www.minnesotaseasons.com/Destinations/Superior_Hiking_Trail.html';
  var HS = 'https://superiorhiking.org/trail-section/caribou-river-wayside-to-lutsen';
  pack({
    id: 'sht', name: 'Superior Hiking Trail (Minnesota)', short: 'SHT',
    miles: 310,
    milesSource: 'Wikipedia: 310 mi plus 17 mi of spurs, from the Minnesota-Wisconsin border southwest of Duluth to the Canadian border at the 270 Degree Overlook. The Minnesota Seasons page says 300 mi and the NRT listing 326 mi (an old 1980 record).',
    mileNote: 'No source I could open prints cumulative mile markers for trailheads or campsites; the SHTA Databook (sold separately) does. Mile 50 is derived: Wikipedia gives the Duluth section as 50 mi ending at the Martin Road trailhead, with the North Shore section the remaining 260 mi. SHTA section lengths include access spurs (for example 6.4 mi Lutsen to Caribou Trail, of which 5.2 are thru-hiker miles), so section lengths do not add to 310.',
    asof: '2026-10', dir: 'NOBO',
    dirNote: 'Mile 0 is the Wisconsin border at the south end; the common thru-hike runs north to the Canadian border (Wikipedia). Reverse with the direction switch.',
    states: ['MN'],
    start: { name: 'Minnesota-Wisconsin border (southern terminus, southwest of Duluth)', lat: null, lon: null },
    end: { name: '270 Degree Overlook, Canadian border (northern terminus)', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Backcountry campsites: no reservation', who: 'Overnight hikers', when: 'Not applicable as read', costUsd: null, url: null, note: 'Wikipedia: 94 fee-free backcountry campsites (93 on the North Shore, 1 in the Duluth section). The NRT listing says they do not require registration and cannot be reserved. Both could be out of date: check with the Superior Hiking Trail Association (superiorhiking.org). No parking or state-park camping fees were read.' }
    ],
    seasons: [
      { label: 'Late spring to early fall', months: [5, 6, 7, 8, 9, 10], note: 'Wikipedia: late spring to early fall.' },
      { label: 'Spring thaw: stay off the trail', months: [3, 4, 5], note: 'Minnesota Seasons asks visitors to avoid the trail in March to May when it is muddy. The page also says the trail may close for about two weeks in November for deer hunting; confirm dates with the SHTA.' }
    ],
    hazards: [
      { id: 'sht-wx', title: 'Severe weather, black bears and Lyme disease', fromMi: 0, toMi: 310, note: 'Wikipedia lists these. Check for ticks daily and store food away from bears.' },
      { id: 'sht-relief', title: 'Constant ascents and descents', fromMi: 50, toMi: 310, note: 'Wikipedia: about 37,800 ft of gain and 37,400 ft of loss northbound on the 260 mi North Shore section. SHTA: steep descents and ascents between Lutsen and Caribou Trail (position not given).' },
      { id: 'sht-hunt', title: 'November closure for deer hunting', fromMi: 0, toMi: 310, note: 'Minnesota Seasons: possible two-week closure each November. Check dates.' }
    ],
    sections: [
      { id: 'duluth', name: 'Duluth section', fromMi: 0, toMi: 50, note: 'Wikipedia: 50 mi including Jay Cooke State Park, Spirit Mountain, Enger Park, Canal Park and the Lakewalk, ending at Martin Road.' },
      { id: 'northshore', name: 'North Shore section', fromMi: 50, toMi: 310, note: 'Wikipedia: 260 mi, seven state parks (including Gooseberry Falls, Split Rock Lighthouse, Tettegouche), Lutsen and Grand Marais.' }
    ],
    points: [
      P(0, 'Minnesota-Wisconsin border (south end)', 'terminus', null, 'Southern terminus. The Wild Valley Road trailhead (Bandle Road, Wrenshall) is the first trailhead per Minnesota Seasons; its mile is not printed.', HW + ' ; ' + HM),
      P(50, 'Martin Road trailhead (Duluth / North Shore boundary)', 'trailhead', null, 'Derived mile: the Duluth section is 50 mi (Wikipedia), ending at Martin Road. Plus or minus a couple of miles depending on counting of spurs.', HW),
      P(310, '270 Degree Overlook (north end)', 'terminus', null, 'Northern terminus at the Canadian border. The Border Route Trail (65 mi) begins at Otter Lake Road.', HW)
    ],
    links: [
      { label: 'Superior Hiking Trail Association', url: 'https://superiorhiking.org' },
      { label: 'SHTA: Lutsen to Caribou Trail (section page)', url: HS },
      { label: 'Wikipedia: Superior Hiking Trail', url: HW }
    ],
    disclaimer: 'This pack has no verified mile markers for trailheads, water or campsites beyond the Duluth/North Shore split. Use the SHTA Databook and map set for mile planning and check trail closures with the SHTA.'
  });

  /* ================= Wind River Highline: Trail Creek Park to Elbow Lake ================= */
  var WR = 'https://www.hikingwalking.com/destinations/wy/wy_ww/green_river_lakes/bp_gr_ep/elbow_lake';
  pack({
    id: 'wr-highline-2', name: 'Wind River Highline Trail: Trail Creek Park to Elbow Lake basin (one segment)', short: 'Wind River Hline',
    miles: 8.2,
    milesSource: 'Hikingwalking.com guide (Segment 2 of its Green River Lakes to Elkhart Park backpack): 8.2 mi one way from Trail Creek Park to the Shannon Pass trail junction at the head of the Elbow Lake basin. Mile 0 is Trail Creek Park (New Fork Trail junction).',
    mileNote: 'This is one 8.2 mi segment, not the whole Highline (the guide\'s segment 1, Green River Lakes to Trail Creek Park, and later segments were not read). The page text places Green River Pass at 2.5 mi but its table gives 1.5 mi (0.7 + 0.8); 1.5 is used because it fits the table\'s following leg to Summit Lake. Mile points are from a private hiking guide, not the Forest Service.',
    asof: '2026-10', dir: 'SOBO',
    dirNote: 'The guide describes this segment southbound (Green River Lakes toward Elkhart Park). Reverse it with the direction switch.',
    states: ['WY'],
    start: { name: 'Trail Creek Park (New Fork Trail junction), 9,300 ft', lat: null, lon: null },
    end: { name: 'Shannon Pass trail junction at the head of the Elbow Lake basin, 10,950 ft', lat: null, lon: null },
    typicalDays: null,
    permits: [
      { name: 'Permit rules not verified', who: 'Overnight hikers in the Bridger Wilderness', when: 'Unknown', costUsd: null, url: null, note: 'The guide says to check with the Forest Service (Bridger-Teton National Forest) before the trip and does not give permit rules. Do not assume none are required.' }
    ],
    seasons: [
      { label: 'Snow and water levels vary', months: [7, 8, 9], note: 'The guide gives no open dates and says some crossings are easier late in the season. The months shown are a placeholder for summer only; verify with the Forest Service.' }
    ],
    hazards: [
      { id: 'wr-ford', title: 'Creek fords in high water', fromMi: 3.8, toMi: 7.5, note: 'Guide: Pine Creek (3.8) may need wading at high water; the Elbow Creek ford near the 5.4 mi rock slide is shin deep; the Elbow Creek crossing at the head of the lake (7.5) is hard in high water.' },
      { id: 'wr-wx', title: 'Rapid weather change, wind and thunderstorms', fromMi: 0, toMi: 8.2, note: 'Guide: gale-force winds and severe thunderstorms are possible, especially on open ground at this elevation. Choose sheltered camps behind boulders.' },
      { id: 'wr-climb', title: 'Steep rocky climb out of the Elbow Creek drainage', fromMi: 5.4, toMi: 6.3, note: 'Guide: rocky trail with a steep climb out of the drainage; the range is approximate.' }
    ],
    sections: [
      { id: 'seg2', name: 'Trail Creek Park to Elbow Lake basin', fromMi: 0, toMi: 8.2, note: 'Green River Pass, Summit Lake, Trapper Lake junction, Elbow Lake.' }
    ],
    points: [
      P(0, 'Trail Creek Park (New Fork Trail junction)', 'landmark', 9300, 'Start of this segment. The guide\'s basecamp is the Green River Lakes trailhead, about 50 mi from Pinedale (roughly 1 hr 45 min); passenger cars can usually reach it. Check road conditions with the Forest Service in Pinedale.', WR),
      P(0.7, 'Shannon Pass trail junction (Vista Pass)', 'landmark', 9640, 'Branches left (southeast).', WR),
      P(1.5, 'Green River Pass', 'pass', 10390, 'Tarns to the west. Mile 1.5 from the guide\'s table (text says 2.5).', WR, { water: { type: 'tarn', note: 'Treat all water.' } }),
      P(3.25, 'Summit Lake / Doubletop Mountain trail junction', 'water', 10330, 'Palmer Lake trail branches right.', WR, { water: { type: 'lake', note: 'Treat all water.' } }),
      P(3.3, 'Trapper Lake "Y" junction', 'landmark', null, 'Bear left toward Elbow Lake.', WR),
      P(3.8, 'Pine Creek crossing', 'water', null, 'May require wading at high water.', WR, { water: { type: 'creek', note: 'Treat all water.' } }),
      P(4.4, 'Elbow Creek bridge', 'water', null, '', WR, { water: { type: 'creek', note: 'Treat all water.' } }),
      P(5.0, 'Pass Lake outlet', 'water', null, 'A few campsites above Pass Lake.', WR, { water: { type: 'lake', note: 'Treat all water.' } }),
      P(5.4, 'Rock slide and shin-deep Elbow Creek ford', 'landmark', null, '', WR),
      P(6.3, 'Elbow Lake basin overlook', 'landmark', 10880, 'Main viewpoint.', WR),
      P(6.6, 'Elbow Lake', 'water', 10777, 'Trail follows the northwest shore; campsites above that shore.', WR, { water: { type: 'lake', note: 'Treat all water.' } }),
      P(7.5, 'Elbow Creek crossing at the head of the lake', 'landmark', null, 'Challenging in high water.', WR),
      P(8.2, 'Shannon Pass trail junction (head of basin)', 'landmark', 10950, 'Turn right for Jean Lakes and Island Lake.', WR)
    ],
    links: [
      { label: 'Hikingwalking.com: Trail Creek Park to Elbow Lake', url: WR }
    ],
    disclaimer: 'One segment only, from a private guide: no agency data. Check permits, fords and conditions with the Bridger-Teton National Forest and carry a map.'
  });
})();
