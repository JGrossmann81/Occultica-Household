/* Backpackica: verified data packs for long trails other than the PCT.
   Facts come from the pages listed in data/SOURCES-other.md (read 2026-10). Anything not verified is null.
   Fields: llApprox:true means the lat/lon are rounded general-knowledge coordinates (about 0.01 degree, ~1 km),
   NOT read from a cited page; use them for orientation only. lat/lon null means "no verified coordinate".
   svc:null means "services not verified" (UI shows "check with the source"). */
window.TRAILS = window.TRAILS || {};
(function () {
  'use strict';
  /* P(mi, name, kind, lat, lon, elevFt, note, src, opts)
     opts: ap (coords approximate), off {mi,dir}, svc, water, phone, url */
  function P(mi, name, kind, lat, lon, elev, note, src, o) {
    o = o || {};
    var p = { mi: mi, name: name, kind: kind, lat: lat, lon: lon, elev: elev == null ? null : elev, note: note || '', src: src || null, off: o.off || null, svc: o.svc || null, water: o.water || null, phone: o.phone || null, url: o.url || null };
    if (o.ap) p.llApprox = true;
    return p;
  }
  function pack(t) { window.TRAILS[t.id] = t; return t; }
  window.__BP_OTHER = { P: P, pack: pack };
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var WB = 'https://www.whiteblaze.net/forum/articles/2024-resupply-options.pdf';
  var HEL = 'https://appalachiantrail.org/wp-content/uploads/2025/05/Helene-Conditions-Closures-Table-5.22.25.pdf';
  var GAC = 'https://georgia-atclub.org/wp-content/uploads/2024/11/GA-AT-Brochure-Map-Profile-2024.pdf';
  var GAA = 'https://georgia-atclub.org/plan-your-hike/accommodations-supplies/';
  var SH16 = 'https://www.whiteblaze.net/forum/articles/Shelter-2016_files/sheet001.htm';
  var ATP = 'https://appalachiantrail.org/experience/hike-the-trail/at-basics/permits-fees/';
  var KAT = 'https://appalachiantrail.org/experience/hike-the-trail/thru-hiking/finish-well/hikers-guide-to-katahdin/';
  var SOBO = 'https://appalachiantrail.org/experience/hike-the-trail/thru-hiking/southbound/sobo-logistics/';
  var FO = 'https://faroutguides.com/appalachian-trail-map/';
  var NOTE_WB = ' Listed on the WhiteBlaze 2024 resupply list; services (grocery, post office, lodging) not verified here.';
  function town(mi, name, lat, lon, off, dir, extra, ap) {
    return P(mi, name, 'town', lat, lon, null, (off ? 'About ' + off + ' mi ' + dir + ' of the trail by road.' : 'On or at the trail.') + (extra || '') + NOTE_WB, WB,
      { ap: ap !== false && lat != null, off: off ? { mi: off, dir: dir } : null });
  }

  pack({
    id: 'at', name: 'Appalachian Trail', short: 'AT',
    miles: 2197.4,
    milesSource: 'FarOut Guides total (2,197.4 mi, Springer Mountain to Katahdin). Point miles come from the WhiteBlaze 2024 resupply list (northbound miles, total 2,197.4) and the ATC May 2025 closure table; Georgia shelters from the Georgia AT Club 2024 brochure.',
    mileNote: 'The AT is rerouted most years, so mileage shifts by tenths each season and guides disagree. ATC says "2,190+ miles", FarOut 2,197.4, an NPS page 2,174. The Georgia AT Club brochure runs roughly 0.5 to 2 mi lower than WhiteBlaze/FarOut in the first 80 miles. The 8.8-mi Amicalola Falls approach trail is not counted. Treat every mile marker as plus or minus 1 to 2 miles and use the printed guide for the current year.',
    asof: '2026-10', dir: 'NOBO',
    states: ['GA', 'NC', 'TN', 'VA', 'WV', 'MD', 'PA', 'NJ', 'NY', 'CT', 'MA', 'VT', 'NH', 'ME'],
    start: { name: 'Springer Mountain, GA', lat: 34.63, lon: -84.19 },
    end: { name: 'Katahdin (Baxter Peak), ME', lat: 45.9044, lon: -68.9213 },
    typicalDays: { min: 150, max: 180, note: 'FarOut: a full hike usually takes about 5 to 6 months and staying out longer than 6 months risks snow at the end; the fastest known time is 41 days.' },
    permits: [
      { name: 'Great Smoky Mountains NP backcountry permit (thru-hiker)', who: 'Every AT hiker spending a night in the Smokies; the thru-hiker permit is for hikers who meet the park\'s thru-hiker definition', when: 'Before entering the park; ATC says that from April 30, 2026 permits come through Recreation.gov', costUsd: 44.5, url: 'https://www.recreation.gov/permits/4675347', note: 'ATC lists the thru-hiker permit at $44.50. A general backcountry permit is $8 per person per night plus a $6 transaction fee. Carry a printed copy. Parking tags are $5 daily, $15 weekly, $40 annual (not needed for passing through or parking under 15 minutes). Source: ' + ATP },
      { name: 'Shenandoah NP backcountry permit', who: 'Overnight hikers in Shenandoah National Park', when: 'Reserve on Recreation.gov up to 90 days ahead; permits cannot be bought in the park', costUsd: 9, url: 'https://www.nps.gov/shen/planyourvisit/backcountry-regulations.htm', note: 'ATC lists $9 per person plus a $6 reservation fee. Entry fee $30 per vehicle or $15 per person on foot (fees page https://www.nps.gov/shen/planyourvisit/fees.htm). Source: ' + ATP },
      { name: 'Baxter State Park Long Distance Hiker permit', who: 'All AT hikers, any direction, before climbing Katahdin', when: 'In person at the Katahdin Stream Campground ranger station, up to 7 days before the summit; valid 7 days', costUsd: 0, url: 'https://baxterstatepark.org/general-info/the-at/', note: 'Free. Rangers are generally at the station 7:00 to 8:30 am and 4:00 to 5:00 pm. The Birches campsite ($10, first come first served, 12 hikers, one night) is for northbound hikers who walked continuously from Monson. Other Baxter campgrounds start at $38 per night and need a reservation. Cash only; no ATMs. Sources: ' + KAT + ' and ' + ATP },
      { name: 'White Mountains and southern Maine AMC campsites', who: 'Campers at AMC high-use backcountry sites', when: 'No permit or reservation; fee collected at site', costUsd: 10, url: 'https://www.outdoors.org/destinations/huts/', note: 'ATC: about $10 per person per night at some sites (a fee is also charged at Speck Pond). AMC huts: reservations recommended; work-for-stay is often available to thru-hikers; the AMC Thru-Hiker Pass gives discounts. Source: ' + ATP }
    ],
    seasons: [
      { label: 'Northbound start', months: [3, 4, 5], note: 'FarOut: northbound thru-hikers usually leave Springer in March, April or early May because of snow.' },
      { label: 'Southbound start', months: [6], note: 'FarOut: southbound hikers usually start at Katahdin around June. Baxter says Katahdin opens when snow melts, from the end of May to early June; ATC advises not planning to summit before June 1 or over Labor Day weekend.' },
      { label: 'Finish deadline', months: [9, 10], note: 'ATC (Katahdin guide): northbound hikers should leave Monson by October 1 and summit by October 15; the mountain closes each fall depending on weather.' }
    ],
    hazards: [
      { id: 'at-helene', title: 'Hurricane Helene damage and closures', fromMi: 167.0, toMi: 637.8, note: 'ATC kept a conditions table of closures and damage from Fontana Dam (mile 167.0) through the Smokies and the NC/TN/VA ridges to Pearisburg (637.8). Its 22 May 2025 version is the one read here and conditions have changed since, so check the ATC conditions page before every trip.' },
      { id: 'at-100mw', title: '100 Mile Wilderness: no resupply', fromMi: 2082.7, toMi: 2182.1, note: 'Monson to Abol Bridge is about 100 miles with no public road crossings and no resupply. ATC advises 7 to 10 days and says food drops are difficult. Cell service is limited. Carry the whole food supply.' },
      { id: 'at-katahdin', title: 'Katahdin: exposed climb', fromMi: 2192.2, toMi: 2197.4, note: 'ATC calls it the hardest ascent on the AT: above treeline for over 2 miles with no shelter, rock scrambling and rebar ladders on the Hunt Trail, 5.2 miles and more than 4,000 ft of climbing from Katahdin Stream. Rangers loan day packs; take one. Check the 7:00 am forecast posted at ranger stations and the park-boundary kiosk. The park has no potable water.' },
      { id: 'at-nesowa', title: 'Nesowadnehunk Stream fords', fromMi: 2182.1, toMi: 2192.2, note: 'ATC: two fords of Nesowadnehunk Stream can be high; a high-water bypass trail avoids them. Camping is not allowed on the AT between Katahdin Stream and the park boundary.' },
      { id: 'at-smokies', title: 'Smokies: permit, shelter and parking rules', fromMi: 167.0, toMi: 239.5, note: 'A printed Smokies backcountry permit is required for any overnight stay (see Permits). Gatlinburg (15 mi W) and Cherokee (18 mi E) are the only road-access towns mid-park, at mile 208.0.' },
      { id: 'at-shen', title: 'Shenandoah: advance permit', fromMi: 864.6, toMi: 972.4, note: 'Backcountry permits for Shenandoah are reserved on Recreation.gov up to 90 days ahead and cannot be bought in the park (ATC). Resupply is by Loft Mountain Campground (0.1 mi W of mile 892.4), Lewis Mountain Campground (918.4) and Big Meadows Wayside (926.2), listed in the WhiteBlaze 2024 list.' },
      { id: 'at-dewa', title: 'Delaware Water Gap: treat all water', fromMi: 1297.4, toMi: 1297.4, note: 'NPS (Delaware Water Gap NRA, about 28 AT miles): carry enough water for the whole hike; treat trail water chemically or boil it for 5 minutes. Pets on a 6-ft leash; overnight parking requires the overnight parking log.' },
      { id: 'at-snow', title: 'Snow at both ends of the season', fromMi: 0, toMi: 2197.4, note: 'FarOut advises against a hike longer than 6 months because of likely snow, and northbound starts wait until spring because of snow in the south. Plan around the dates in Seasons.' }
    ],
    sections: [
      { id: 'ga-nc', name: 'Georgia and southern NC to Fontana', fromMi: 0, toMi: 167.0, note: 'Springer Mountain to Fontana Dam. Neel Gap (Mountain Crossings), Hiawassee, Franklin and the NOC are the main stops on the WhiteBlaze list.' },
      { id: 'smokies', name: 'Great Smoky Mountains NP', fromMi: 167.0, toMi: 239.5, note: 'Fontana Dam (167.0) to Davenport Gap (239.4 to 239.5). Kuwohi (Clingmans Dome), 6,643 ft, is the highest point on the AT (FarOut).' },
      { id: 'nc-tn', name: 'Davenport Gap to Damascus', fromMi: 239.5, toMi: 471.0, note: 'Hot Springs 275.2, Erwin 344.6, the Roan Highlands, then Damascus VA at 471.0.' },
      { id: 'va-south', name: 'Damascus to Pearisburg', fromMi: 471.0, toMi: 637.4, note: 'Southwest Virginia including the Mt. Rogers area; stops at Atkins 546.3 and Bland 592.1.' },
      { id: 'va-central', name: 'Pearisburg to Waynesboro', fromMi: 637.4, toMi: 864.6, note: 'Daleville (730.6) is the main stop. FarOut names McAfee Knob, Tinker Cliffs and Dragon\'s Tooth in this part of Virginia.' },
      { id: 'shen', name: 'Shenandoah National Park', fromMi: 864.6, toMi: 972.4, note: 'Waynesboro to Front Royal; permit required (see Permits).' },
      { id: 'va-north-md', name: 'Northern Virginia to Harpers Ferry', fromMi: 972.4, toMi: 1026.0, note: 'Front Royal 972.4, Bears Den Hostel 1005.9, Harpers Ferry 1026.0 (ATC headquarters, 799 Washington St).' },
      { id: 'md-pa', name: 'Maryland and Pennsylvania', fromMi: 1026.0, toMi: 1297.4, note: 'Pine Grove Furnace State Park (1105.4, AT Museum, close to the trail\'s halfway point), Boiling Springs, Duncannon, Port Clinton, ending at Delaware Water Gap.' },
      { id: 'nj-ny-ct', name: 'New Jersey, New York, Connecticut', fromMi: 1297.4, toMi: 1507.5, note: 'Port Jervis, Peekskill and Kent are the listed stops; Salisbury CT at 1507.5.' },
      { id: 'ma-vt-south', name: 'Massachusetts and southern Vermont', fromMi: 1507.5, toMi: 1711.5, note: 'Great Barrington, Dalton, North Adams/Williamstown, Bennington, Manchester, Killington. The Long Trail shares the southern ~100 miles of Vermont with the AT (Green Mountain Club).' },
      { id: 'vt-nh', name: 'Killington to Hanover', fromMi: 1711.5, toMi: 1755.0, note: 'Woodstock and Norwich are the listed stops before Hanover NH.' },
      { id: 'whites', name: 'New Hampshire (White Mountains)', fromMi: 1755.0, toMi: 1898.7, note: 'Hanover to Gorham. AMC huts and ~$10 campsites; reservations recommended at huts.' },
      { id: 'maine-west', name: 'Western Maine', fromMi: 1898.7, toMi: 2082.7, note: 'Gorham to Monson via Andover, Rangeley, Stratton and Caratunk.' },
      { id: '100mw', name: '100 Mile Wilderness', fromMi: 2082.7, toMi: 2182.1, note: 'Monson to Abol Bridge: no resupply.' },
      { id: 'baxter', name: 'Baxter State Park and Katahdin', fromMi: 2182.1, toMi: 2197.4, note: 'Abol Bridge to the summit. Permit and rules in Permits.' }
    ],
    points: [
      P(0.0, 'Springer Mountain (southern terminus)', 'terminus', 34.63, -84.19, null, 'Southern terminus. The 8.8-mi approach trail from Amicalola Falls State Park is not counted in the mile markers (FarOut; the Georgia AT Club map shows Amicalola at 8.8 on the approach).', FO + ' ; ' + GAC, { ap: true }),
      P(0.2, 'Springer Mountain Shelter', 'campsite', 34.62915, -84.1931, 3730, 'Shelter, capacity 12 (2016 shelter list). Mile 0.2 agrees with the Georgia AT Club brochure.', SH16 + ' ; ' + GAC),
      P(7.8, 'Hawk Mountain Shelter', 'campsite', 34.66583, -84.1364, 3210, 'Shelter, capacity 12; Georgia AT Club mile 7.8 (the 2016 list gives 8.1).', GAC + ' ; ' + SH16),
      P(20.5, 'Woody Gap (GA 60) and Suches', 'trailhead', null, null, null, 'Woody Gap is mile 20.1 on the Georgia AT Club map; the WhiteBlaze list puts Suches, 2.0 mi W, at 20.5. Dahlonega is about 13 mi away by road (GA AT Club).', WB + ' ; ' + GAC, { off: { mi: 2.0, dir: 'W' } }),
      P(28.3, 'Blood Mountain Shelter', 'campsite', 34.73996, -83.9375, 4460, 'Stone shelter on Blood Mountain, capacity 8 (2016 list); Georgia AT Club mile 28.3.', GAC + ' ; ' + SH16),
      P(31.3, 'Neel Gap: Mountain Crossings', 'town', 34.74, -83.92, null, 'Outfitter, hostel, short-term grocery resupply and mail drops on the trail (Georgia AT Club listing). Hostel is first come; free camping about 200 yd off the property if no bunks or if you have a pet. Georgia AT Club mile is 30.7; WhiteBlaze 31.3. Blairsville is 14 mi W and Dahlonega 17 mi E by road.', GAA + ' ; ' + WB, { ap: true, svc: { post: null, grocery: 'limited', lodging: ['Hostel (Mountain Crossings)'], laundry: null, shower: true, restaurant: null, outfitter: true, hikerBox: null, cell: null, resupplyBy: 'box' }, phone: '(706) 745-6095', url: GAA }),
      P(56.5, 'Tray Mountain Shelter', 'campsite', 34.80396, -83.6769, 4200, 'Shelter, capacity 7 (2016 list); Georgia AT Club mile 56.5. Tray Mountain summit 4,430 ft is nearby at 56.1.', GAC + ' ; ' + SH16),
      town(69.4, 'Hiawassee, GA', 34.95, -83.75, 11.0, 'W', ' The trail meets US 76 at Dicks Creek Gap (Georgia AT Club mile 67.5); Clayton is 18 mi E.'),
      town(109.6, 'Franklin, NC', 35.18, -83.38, 10.0, 'E'),
      P(136.9, 'Nantahala Outdoor Center (NOC)', 'town', 35.33, -83.59, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      town(150.7, 'Stecoah Gap (NC 143) and Robbinsville', null, null, 3.4, 'E', ' Stecoah is 3.4 mi E; Robbinsville is 7.0 mi W.', false),
      town(166.2, 'Fontana Village, NC', 35.45, -83.81, 2.0, 'W'),
      P(167.0, 'Fontana Dam (Smokies southern entrance)', 'permit', 35.45, -83.81, null, 'Southern boundary of Great Smoky Mountains NP; a printed backcountry permit is required to camp in the park (see Permits). ATC mile 167.0.', HEL + ' ; ' + ATP, { ap: true }),
      P(208.0, 'US 441 crossing: Gatlinburg and Cherokee', 'town', 35.61, -83.42, null, 'Road crossing in the middle of the Smokies. Gatlinburg TN is about 15 mi W and Cherokee NC about 18 mi E by road.' + NOTE_WB, WB, { ap: true, off: { mi: 15, dir: 'W' } }),
      P(239.5, 'Davenport Gap (northern Smokies boundary)', 'trailhead', null, null, null, 'Northern end of the park section (ATC 239.4; WhiteBlaze 239.5, with a road 1.2 mi E).', HEL + ' ; ' + WB),
      P(275.2, 'Hot Springs, NC', 'town', 35.90, -82.83, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      P(320.0, 'Sams Gap (I-26)', 'trailhead', null, null, null, 'Road crossing, 2.7 mi from services listed on the WhiteBlaze list.', WB + ' ; ' + HEL),
      P(344.6, 'Nolichucky River and Erwin, TN', 'town', 36.14, -82.42, null, 'Uncle Johnny\'s Nolichucky Hostel is on the trail at mile 344.6; Erwin is 3.8 mi W by road.' + NOTE_WB, WB + ' ; ' + HEL, { ap: true, off: { mi: 3.8, dir: 'W' } }),
      P(395.6, 'US 19E: Roan Mountain TN and Elk Park NC', 'town', null, null, null, 'Roan Mountain TN is 3.5 mi W; Elk Park NC is 2.3 mi E.' + NOTE_WB, WB + ' ; ' + HEL, { off: { mi: 3.5, dir: 'W' } }),
      P(420.3, 'Dennis Cove Road', 'trailhead', null, null, null, 'Hostel on the trail (WhiteBlaze list).', WB + ' ; ' + HEL),
      town(428.9, 'US 321: Hampton, TN', null, null, 2.6, 'W', '', false),
      P(471.0, 'Damascus, VA', 'town', 36.63, -81.78, null, 'On the trail (ATC mile 470.9, WhiteBlaze 471.0). Trail town on the Virginia line.' + NOTE_WB, WB + ' ; ' + HEL, { ap: true }),
      P(546.3, 'Atkins, VA', 'town', 36.87, -81.18, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      town(592.1, 'Bland and Bastian, VA', 37.13, -81.12, 2.5, 'E', ' Bland is 2.5 mi E; Bastian is 3.0 mi W.'),
      town(637.4, 'Pearisburg, VA', 37.33, -80.74, 1.3, 'E', ' ATC mile 637.8 at the New River.'),
      P(730.6, 'Daleville, VA', 'town', 37.40, -79.94, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      town(864.6, 'Waynesboro, VA (Rockfish Gap)', 38.07, -78.89, 3.7, 'W', ' Southern entrance of Shenandoah NP.'),
      P(892.4, 'Loft Mountain Campground (Shenandoah)', 'campsite', null, null, null, 'Campground 0.1 mi W of the trail inside Shenandoah NP (WhiteBlaze list).', WB),
      P(926.2, 'Big Meadows Wayside (Shenandoah)', 'landmark', 38.52, -78.44, null, 'Wayside 0.3 mi E of the trail (WhiteBlaze list).', WB, { ap: true, off: { mi: 0.3, dir: 'E' } }),
      town(972.4, 'Front Royal, VA', 38.92, -78.19, 3.5, 'W', ' Northern end of Shenandoah NP.'),
      P(1005.9, 'Bears Den Hostel', 'town', null, null, null, 'Hostel 0.2 mi E of the trail (WhiteBlaze list).', WB, { off: { mi: 0.2, dir: 'E' } }),
      P(1026.0, 'Harpers Ferry, WV', 'town', 39.3254, -77.7389, null, 'On the trail. Appalachian Trail Conservancy headquarters and visitor center are at 799 Washington Street, Harpers Ferry (ATC West Virginia page). Charles Town (6 mi W) and Frederick MD (20 mi E) are listed too.' + NOTE_WB, WB + ' ; https://appalachiantrail.org/experience/hike-the-trail/explore-by-state/west-virginia/', { ap: true }),
      P(1105.4, 'Pine Grove Furnace State Park (AT Museum)', 'town', 40.01, -77.30, null, 'On the trail, near the midpoint of the trail (half of 2,197.4 is 1,098.7).' + NOTE_WB, WB, { ap: true }),
      P(1124.6, 'Boiling Springs, PA', 'town', 40.15, -77.13, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      P(1150.3, 'Duncannon, PA', 'town', 40.39, -77.03, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      P(1220.2, 'Port Clinton, PA', 'town', 40.57, -76.03, null, 'On the trail; Hamburg is 1.6 mi E.' + NOTE_WB, WB, { ap: true }),
      P(1297.4, 'Delaware Water Gap, PA', 'town', 40.98, -75.14, null, 'On the trail at the Delaware River. Start of the Delaware Water Gap NRA section (about 28 AT miles); treat all water.' + NOTE_WB, WB + ' ; https://home.nps.gov/dewa/planyourvisit/appalachian-nst.htm', { ap: true }),
      town(1340.3, 'Port Jervis, NY', 41.38, -74.69, 4.4, 'W'),
      P(1415.1, 'Peekskill, NY and Appalachian Market', 'town', 41.29, -73.92, null, 'Appalachian Market is on the trail; Peekskill is 4.5 mi E.' + NOTE_WB, WB, { ap: true, off: { mi: 4.5, dir: 'E' } }),
      town(1473.5, 'Kent, CT', 41.73, -73.48, 0.8, 'E'),
      P(1507.5, 'Salisbury, CT', 'town', 41.98, -73.42, null, 'On the trail; Lakeville is 2.0 mi W.' + NOTE_WB, WB, { ap: true }),
      town(1528.0, 'Great Barrington, MA', 42.20, -73.36, 3.0, 'W', ' (the source list writes the state as VT; it is in Massachusetts). Sheffield is 3.0 mi E.'),
      P(1576.4, 'Dalton, MA', 'town', 42.47, -73.17, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      town(1599.6, 'North Adams and Williamstown, MA', 42.70, -73.20, 2.5, 'E', ' North Adams is 2.5 mi E; Williamstown 2.6 mi W.'),
      town(1618.0, 'Bennington, VT', 42.88, -73.20, 5.1, 'W'),
      town(1658.1, 'Manchester, VT', 43.16, -73.07, 5.4, 'W'),
      town(1711.5, 'Killington, VT (US 4)', 43.66, -72.82, 0.6, 'E', ' Rutland is 8.5 mi W (listed at 1708.2). The Long Trail leaves the AT near here (Green Mountain Club).'),
      P(1755.0, 'Hanover, NH', 'town', 43.7022, -72.2896, null, 'On the trail.' + NOTE_WB, WB, { ap: true }),
      P(1824.1, 'Franconia Notch: North Woodstock and Lincoln, NH', 'town', 44.05, -71.67, null, 'North Woodstock is 4.8 mi E and Lincoln 5.8 mi E by road; Franconia is 11 mi W.' + NOTE_WB, WB, { ap: true, off: { mi: 4.8, dir: 'E' } }),
      P(1851.8, 'Crawford Notch General Store and Campground', 'town', 44.22, -71.41, null, 'Store and campground 3.4 mi E of the trail.' + NOTE_WB, WB, { ap: true, off: { mi: 3.4, dir: 'E' } }),
      town(1898.7, 'Gorham, NH', 44.39, -71.17, 3.5, 'W'),
      town(1940.3, 'Andover, ME', 44.63, -70.75, 8.0, 'E'),
      town(1976.8, 'Rangeley, ME', 44.97, -70.64, 9.0, 'E'),
      town(2009.0, 'Stratton, ME (ME 16/27)', 45.14, -70.43, 5.0, 'W'),
      town(2046.0, 'Caratunk, ME', 45.23, -69.96, 0.3, 'E'),
      town(2082.7, 'Monson, ME', 45.29, -69.50, 3.6, 'E', ' Last town before the 100 Mile Wilderness; ATC says Monson is about 100 miles from Abol Bridge. Greenville is 10.4 mi W.'),
      P(2182.1, 'Abol Bridge and Golden Road', 'trailhead', 45.87, -68.95, null, 'End of the 100 Mile Wilderness. Store at Abol Bridge has no phone, internet or cell service (ATC). Millinocket is 19.6 mi E. NOBO hikers enter Baxter State Park at the kiosk just north of the bridge; ATC measures 9.2 mi from here to Katahdin Stream (mile 2192.2 when counted from the summit).', WB + ' ; ' + KAT + ' ; ' + SOBO, { ap: true }),
      P(2192.2, 'Katahdin Stream Campground (Baxter SP)', 'permit', 45.90, -68.99, null, 'AT hiker permit station (free, in person, valid 7 days). The Birches NOBO-only campsite is 0.25 mi away. Mile derived: summit 2,197.4 minus the 5.2 mi Hunt Trail distance given by ATC.', KAT + ' ; ' + FO, { ap: true }),
      P(2197.4, 'Katahdin, Baxter Peak (northern terminus)', 'terminus', 45.9044, -68.9213, 5270, 'Northern terminus. Hunt Trail: 5.2 mi and more than 4,000 ft of climbing from Katahdin Stream; above treeline for over 2 miles. Elevation as commonly published (5,267 ft).', KAT + ' ; ' + FO, { ap: true })
    ],
    links: [
      { label: 'ATC: permits and fees', url: ATP },
      { label: 'ATC: Katahdin and Baxter hiker guide', url: KAT },
      { label: 'ATC: southbound logistics and Baxter start', url: SOBO },
      { label: 'Great Smoky Mountains backcountry permits (Recreation.gov)', url: 'https://www.recreation.gov/permits/4675347' },
      { label: 'Shenandoah backcountry regulations (NPS)', url: 'https://www.nps.gov/shen/planyourvisit/backcountry-regulations.htm' },
      { label: 'Baxter State Park: AT information', url: 'https://baxterstatepark.org/general-info/the-at/' },
      { label: 'ATCamp registration (voluntary)', url: 'https://atcamp.org/' },
      { label: 'WhiteBlaze 2024 resupply options (PDF)', url: WB },
      { label: 'Georgia AT Club: accommodations and supplies', url: GAA }
    ],
    disclaimer: 'Mile markers, services and closures change every season; this is a planning aid, so confirm with ATC and the current guidebook.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var WIKI = 'https://en.wikipedia.org/wiki/John_Muir_Trail';
  var BFT = 'https://bearfoottheory.com/john-muir-trail-planning-guide/';
  var LLH = 'https://liveandlethike.com/2022/01/02/john-muir-trail-northbound-section-4-reds-meadow-to-happy-isles-ansel-adams-wilderness-yosemite-national-park-ca/';
  var SP = 'https://summitpost.org/john-muir-trail/158438';
  var NPSW = 'https://home.nps.gov/yose/planyourvisit/wildfaq.htm';
  var HST = 'https://highsierratrails.com/jmt/jmt_resources.html';
  var MSG = ' Mile is approximate: guides measure the JMT differently.';

  pack({
    id: 'jmt', name: 'John Muir Trail', short: 'JMT',
    miles: 221,
    milesSource: 'Wikipedia: 211 mi from Happy Isles (Yosemite Valley) to the Mount Whitney summit (its text also quotes 213.7 mi), plus the 10.6-mi Mount Whitney Trail to Whitney Portal = 221 mi. Mile 0 = Happy Isles, usual direction southbound (SOBO). Mile markers for resupply stops use Bearfoot Theory\'s figures (measured from Happy Isles); the first 23 mi are summed from Live and Let Hike section distances.',
    mileNote: 'Guides disagree: the Mount Whitney summit is 211 to about 214 mi from Happy Isles depending on the source, and the resupply miles of different guides differ by 1 to 3 miles (for example Reds Meadow 59.5 to 60.8, Muir Trail Ranch 106 to 109). Whitney Portal adds about 10 to 11 miles after the summit. Use these markers for planning only.',
    asof: '2026-10', dir: 'SOBO',
    states: ['CA'],
    start: { name: 'Happy Isles, Yosemite Valley', lat: 37.7317, lon: -119.5587 },
    end: { name: 'Whitney Portal', lat: 36.59, lon: -118.23 },
    typicalDays: { min: 14, max: 25, note: 'Planning estimate only (not taken from a source); the Kings Canyon stretch of about 60 mi has no quick exits (Sherpa Guides).' },
    permits: [
      { name: 'Yosemite wilderness permit (JMT, Happy Isles start)', who: 'Every overnight party starting in Yosemite; one permit covers the whole trip through Whitney Portal, no separate "Whitney stamp" is needed', when: '60% by weekly lottery 24 weeks ahead (applications Sunday to Saturday, up to 8 options); leftovers first come first served about 22 weeks ahead; the remaining 40% released 7 days ahead at 7:00 am Pacific on Recreation.gov', costUsd: 10, url: 'https://recreation.gov/permits/445859', note: '$10 per application plus $5 per person if you receive a permit; non-refundable. Half Dome add-on $10 per person. Donohue Pass exit quota is 45 people a day (30 from Lyell Canyon and 15 from Happy Isles past Little Yosemite Valley); Happy Isles starters must camp beyond Little Yosemite Valley the first night. Party size max 15. Pick up the permit by 10:00 am the day before or day of at a Yosemite wilderness center. NPS says up to 90% of requests on popular days are denied. Sources: ' + NPSW + ' ; ' + HST },
      { name: 'Bear canister', who: 'All overnight hikers in Yosemite and most of the route', when: 'Required year round in Yosemite; winter exception (Dec 15 to Mar 30) only when skiing or snowshoeing above 7,200 ft', costUsd: null, url: NPSW, note: 'Ursacks and Opsacks are not acceptable (Bearfoot Theory). Canisters can be rented at the Yosemite Valley Welcome Center (NPS FAQ). Kings Canyon and Sequoia also require canisters in most of the area (High Sierra Trails).' }
    ],
    seasons: [
      { label: 'Usual window', months: [7, 8, 9], note: 'Bearfoot Theory: best July through September depending on snowpack; typical mid-July to early September.' },
      { label: 'Low-snow years', months: [6, 7, 8, 9, 10], note: 'In low-snow years a June to mid-October season may be possible; snow on high passes is possible in June and storms with freezing nights in September and October.' },
      { label: 'Mosquitoes', months: [7, 8], note: 'Mosquitoes and biting flies are common in July and August (Bearfoot Theory).' }
    ],
    hazards: [
      { id: 'jmt-water', title: 'Stream crossings', fromMi: 0, toMi: 211, note: 'Crossings can stay dangerous through summer in high-snow years (Bearfoot Theory). Unbuckle the hip belt, cross early in the day when flow is lowest, and turn back if it is too fast.' },
      { id: 'jmt-passes', title: 'High passes: snow, wind, lightning', fromMi: 35, toMi: 211, note: 'The trail crosses six passes above 11,000 ft: Donohue (11,060 ft), Muir (11,955), Mather (12,068), Pinchot, Glen (11,978) and Forester (13,153, the highest on the JMT and PCT). Expect wind, afternoon lightning and freezing nights near passes (Bearfoot Theory).' },
      { id: 'jmt-alt', title: 'Altitude sickness', fromMi: 0, toMi: 211, note: 'Most of the trail averages about 9,000 ft and Whitney is 14,505 ft. Bearfoot Theory lists altitude sickness as a real possibility. Descend if symptoms worsen.' },
      { id: 'jmt-kings', title: 'Kings Canyon stretch: long way out', fromMi: 106, toMi: 180, note: 'Sherpa Guides: about 60 miles in Kings Canyon with no quick exits. The Bishop Pass and Kearsarge Pass trails are the main exits (Bearfoot Theory: Bishop Pass at mile 136.2, Onion Valley at mile 180.3).' },
      { id: 'jmt-fire', title: 'Campfire limits', fromMi: 0, toMi: 211, note: 'Campfires are banned above 9,600 ft in Yosemite and above 10,000 ft in Kings Canyon and Sequoia; some lakes such as Thousand Island and Garnet also ban fires (High Sierra Trails).' },
      { id: 'jmt-cell', title: 'Almost no cell service', fromMi: 0, toMi: 211, note: 'Cell service is rare (Bearfoot Theory). Carry a satellite messenger or leave a firm itinerary with someone.' },
      { id: 'jmt-donohue', title: 'Donohue Pass permit rule', fromMi: 23, toMi: 40, note: 'Leaving Yosemite south over Donohue Pass needs a permit from a Donohue-eligible trailhead (Happy Isles past Little Yosemite Valley, or Lyell Canyon). Quota is 45 a day (NPS).' }
    ],
    sections: [
      { id: 'yose', name: 'Happy Isles to Tuolumne Meadows', fromMi: 0, toMi: 22.8, note: 'Yosemite Valley (about 4,040 ft) climbs past Vernal and Nevada Falls and Little Yosemite Valley, over Cathedral Pass (9,700 ft) to Tuolumne Meadows. Only the first ~7 miles are below 7,000 ft (Wikipedia).' },
      { id: 'lyell', name: 'Tuolumne to Donohue and Island Pass', fromMi: 22.8, toMi: 60, note: 'Lyell Canyon, Donohue Pass (11,060 ft) out of Yosemite, Island Pass (10,200 ft) and Garnet Lake before Reds Meadow.' },
      { id: 'silver', name: 'Reds Meadow to Muir Trail Ranch', fromMi: 60.8, toMi: 106.1, note: 'Silver Pass (10,740 ft) and Selden Pass (10,900 ft). Vermilion Valley Resort is a side trip off the trail (Bearfoot Theory mile 88.1, with a 12-mile side trip or a ferry).' },
      { id: 'evo', name: 'Muir Trail Ranch to Bishop Pass', fromMi: 106.1, toMi: 136.2, note: 'Evolution basin and Muir Pass (11,955 ft by the University of Wisconsin map label).' },
      { id: 'kings', name: 'Kings Canyon high passes', fromMi: 136.2, toMi: 180.3, note: 'Mather Pass (12,068 ft), Pinchot Pass and Glen Pass (11,978 ft, NPS) before the Kearsarge Pass junction. Rae Lakes are near Glen Pass.' },
      { id: 'whitney', name: 'Forester Pass to Mount Whitney', fromMi: 180.3, toMi: 221, note: 'Forester Pass (13,153 ft), Crabtree Meadows, Trail Crest and the Whitney summit (14,505 ft), then 10.6 mi down to Whitney Portal.' }
    ],
    points: [
      P(0, 'Happy Isles (Yosemite Valley)', 'terminus', 37.7317, -119.5587, 4040, 'Northern terminus. Coordinates and elevation from Wikipedia (its infobox says 4,035 ft). Happy Isles past Little Yosemite Valley is a Donohue-eligible start with a 15-person quota.', WIKI + ' ; ' + NPSW),
      P(1.5, 'Vernal Fall', 'landmark', 37.73, -119.54, null, 'Landmark 1.5 mi from Happy Isles (SummitPost).' + MSG, SP, { ap: true }),
      P(3.7, 'Nevada Fall', 'landmark', 37.72, -119.53, null, 'Landmark 3.7 mi from Happy Isles (SummitPost).' + MSG, SP, { ap: true }),
      P(6.4, 'Half Dome junction / Little Yosemite Valley', 'permit', 37.73, -119.51, null, 'Half Dome side trip junction (about +4 mi round trip, SummitPost). Little Yosemite Valley is the usual first camp; Happy Isles Donohue-eligible starters must camp beyond it, at least to the Half Dome Trail junction.' + MSG, SP + ' ; ' + HST, { ap: true }),
      P(13.2, 'Sunrise High Sierra Camp area', 'landmark', 37.82, -119.48, null, 'Derived: Live and Let Hike gives Sunrise High Sierra Camp to Happy Isles as 13.2 mi.' + MSG, LLH, { ap: true }),
      P(22.8, 'Tuolumne Meadows', 'town', 37.87, -119.36, null, 'Common resupply point with a small store (Wikipedia; Sherpa Guides); Yosemite wilderness permits can be picked up in Tuolumne Meadows. Derived mile: 13.2 + 9.6 mi (Live and Let Hike).' + MSG, WIKI + ' ; ' + LLH + ' ; ' + HST, { ap: true, svc: { post: null, grocery: 'limited', lodging: null, laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      P(60.8, 'Reds Meadow (Devils Postpile)', 'town', 37.61, -119.08, null, 'Resupply stop with a general store, hot food, laundry, showers and a hiker box (Live and Let Hike). Bearfoot Theory mile 60.8; other sources about 59.5. Backpacker campsite at Reds Meadow Campground is the first pay campground since Onion Valley.' + MSG, BFT + ' ; https://liveandlethike.com/2021/12/31/john-muir-trail-northbound-section-3-muir-trail-ranch-to-reds-meadow-john-muir-wilderness-ca/', { ap: true, svc: { post: null, grocery: 'limited', lodging: null, laundry: true, shower: true, restaurant: true, outfitter: null, hikerBox: true, cell: null, resupplyBy: 'box' } }),
      P(88.1, 'Vermilion Valley Resort (side trip)', 'town', 37.37, -119.00, null, 'Resupply by side trip (Bearfoot Theory: 12-mile side trip off the JMT, or a ferry across the lake). Accepts and holds mailed food packages (Sherpa Guides).' + MSG, BFT + ' ; https://sherpaguides.com/california/mountains/long_trails/john_muir_trail.html', { ap: true, svc: { post: null, grocery: null, lodging: null, laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'box' } }),
      P(106.1, 'Muir Trail Ranch', 'town', 37.24, -118.92, null, 'Resupply stop about 0.25 mi off the trail; the store is at Blayney Meadow (Sherpa Guides). Bearfoot Theory mile 106.1; Sherpa Guides says about 109 mi.' + MSG, BFT + ' ; https://sherpaguides.com/california/mountains/long_trails/john_muir_trail.html', { ap: true, off: { mi: 0.25, dir: 'E' }, svc: { post: null, grocery: null, lodging: null, laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'box' } }),
      P(136.2, 'Bishop Pass trail junction (exit to Bishop)', 'trailhead', null, null, null, 'Exit to South Lake trailhead and Bishop; Bearfoot Theory lists a 23.6-mi round-trip side trip.' + MSG, BFT),
      P(180.3, 'Kearsarge Pass trail junction (exit to Onion Valley)', 'trailhead', null, null, null, 'Exit to Onion Valley trailhead and Independence; Bearfoot Theory lists a 15-mi side trip. Kearsarge Pass is 11,760 ft.' + MSG, BFT),
      P(211, 'Mount Whitney summit (southern terminus)', 'terminus', 36.5785, -118.292, 14505, 'Official southern terminus. 14,505 ft and coordinates from Wikipedia (other sources quote 14,494 to 14,508 ft). Hikers then descend the Mount Whitney Trail 10.6 mi to Whitney Portal.', WIKI),
      P(221, 'Whitney Portal', 'trailhead', 36.59, -118.23, null, 'Road end for the Mount Whitney Trail (about 10.6 mi below the summit, Wikipedia). Coordinates rounded from general reference.', WIKI, { ap: true })
    ],
    links: [
      { label: 'Yosemite wilderness permit FAQ (NPS)', url: NPSW },
      { label: 'Yosemite wilderness permits (Recreation.gov)', url: 'https://recreation.gov/permits/445859' },
      { label: 'Wikipedia: John Muir Trail', url: WIKI },
      { label: 'High Sierra Trails: JMT permits', url: HST },
      { label: 'Bearfoot Theory: JMT planning guide', url: BFT }
    ],
    disclaimer: 'The JMT and the PCT share the same route between Crabtree Meadows and Tuolumne Meadows (Wikipedia); distances and permit rules change, so confirm with the NPS and the Forest Service.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var HWA = 'https://www.halfwayanywhere.com/trails/continental-divide-trail/cdt-resupply-guide-2026/';
  var WIKI = 'https://en.wikipedia.org/wiki/Continental_Divide_Trail';
  var CDTC = 'https://cdtcoalition.org/explore-the-trail/thruhiking';
  var NOTE = ' Mile is the FarOut trail mile reported in the HalfwayAnywhere 2025 resupply survey (northbound, main route); off-trail distance and services were not stated there.';
  function t(mi, name, lat, lon, extra) { return P(mi, name, 'town', lat, lon, null, (extra || '') + NOTE, HWA, { ap: true }); }

  pack({
    id: 'cdt', name: 'Continental Divide Trail', short: 'CDT',
    miles: 3028,
    milesSource: 'Wikipedia: official length 3,028 mi (as hiked 2,700 to 3,150). Point miles are FarOut trail miles from the HalfwayAnywhere 2025 resupply survey, northbound from the Mexico border; the Canadian end of that system was not read, so the northern terminus is placed at the official length.',
    mileNote: 'The CDT has many official and unofficial alternates (Gila River, Old CDT through Dubois, Anaconda cutoff, and others), so two hikers rarely cover the same distance. CDTC says about 3,100 miles; Wikipedia 3,028 official; hikers report 2,700 to 3,150. FarOut miles are on the main route. East Glacier is about 2,895 on the FarOut scale.',
    asof: '2026-10', dir: 'NOBO',
    states: ['NM', 'CO', 'WY', 'ID', 'MT'],
    start: { name: 'Crazy Cook Monument, NM (Mexico border)', lat: 31.78, lon: -108.2 },
    end: { name: 'Chief Mountain / Waterton border, MT (Canada)', lat: 49.0, lon: -113.67 },
    typicalDays: { min: 150, max: 210, note: 'CDTC says a thru-hike can take 5 to 7 months; most hikers go northbound from April in New Mexico and finish in August or September.' },
    permits: [
      { name: 'Crazy Cook southern terminus: US Army permit', who: 'Hikers starting at Crazy Cook Monument', when: 'Required since the area became a National Defense Area (Wikipedia: as of 7 Oct 2025)', costUsd: null, url: WIKI, note: 'Wikipedia: only US citizens are granted permits; a shuttle may approach within about 1.1 mi (2 km). Check the current rule with CDTC before booking a shuttle.' },
      { name: 'Blackfeet Nation permit', who: 'Every hiker crossing the Blackfeet Reservation at the southern end of Glacier NP', when: 'Valid April 1 to March 31; one per person, carry proof of purchase', costUsd: null, url: CDTC, note: 'CDTC says it is required for the several miles of trail on the reservation. Fee not stated on the page read.' },
      { name: 'Glacier National Park wilderness camping permit', who: 'Overnight hikers in Glacier NP', when: 'About 70% of permits are advance reservations opening May 1 on Recreation.gov; 30% held for walk-ups', costUsd: 10, url: CDTC, note: 'CDTC: $10 fee plus $7 per person per night; designated campsites only; itineraries have at most 16 mi between campsites. Verify on the NPS site.' },
      { name: 'Yellowstone National Park backcountry permit', who: 'Overnight hikers in Yellowstone', when: 'In person, no more than 48 hours before entering; June to August permits are issued daily 8 am to 4:30 pm at ranger stations and visitor centers', costUsd: 3, url: CDTC, note: 'CDTC: $3 per person per night ($5 with stock). Outside June to August call the Central Backcountry Office, (307) 344-2160.' },
      { name: 'Rocky Mountain National Park backcountry permit', who: 'Overnight hikers in Rocky Mountain NP', when: 'Before camping; hard-sided bear canisters required', costUsd: 26, url: CDTC, note: 'CDTC: $26 per person per night; the CDT loop through the park is about 25 mi so many hikers do it in one day. Canisters can be rented at Never Summer Mountain Products in Grand Lake.' },
      { name: 'Indian Peaks Wilderness camping permit', who: 'Campers in Indian Peaks Wilderness, Colorado', when: 'Before camping', costUsd: null, url: CDTC, note: 'CDTC: avoid needing one by camping between Lonesome Peak and Devil\'s Thumb or after Rollins Pass; Arapaho and Roosevelt National Forests (970) 887-4100. Weminuche and Indian Peaks also use self-issued permits for tracking (REI).' }
    ],
    seasons: [
      { label: 'Northbound', months: [4, 5, 6, 7, 8, 9], note: 'Wikipedia and Advnture: start in New Mexico by April before the heat, reach Canada by August or September before snow.' },
      { label: 'Southbound', months: [6, 7, 8, 9, 10, 11], note: 'Wikipedia: a few hikers go southbound from June, finishing in October or November.' }
    ],
    hazards: [
      { id: 'cdt-heat', title: 'New Mexico heat and dry sections', fromMi: 0, toMi: 780, note: 'Advnture: the New Mexico start is hot, which is why hikers aim to start by April. Water can be far apart; use the CDT water report.' },
      { id: 'cdt-gila', title: 'Gila River alternate (approximate range)', fromMi: 156, toMi: 415, note: 'Wikipedia: about 95% of thru-hikers take the Gila River alternate through the Gila Wilderness. Doc Campbell\'s (about 40 mi into the alternate) was described as having "everything" in the 2025 survey.' },
      { id: 'cdt-san-juan', title: 'San Juan Mountains above 12,000 ft (approximate range)', fromMi: 848, toMi: 1064, note: 'Wikipedia: through the San Juan Mountains and Weminuche Wilderness the trail stays above 12,000 ft for a 32-mile section. Snow, lightning and avalanche terrain; CDTC links SNOTEL and Colorado avalanche information.' },
      { id: 'cdt-gdb', title: 'Great Divide Basin: scarce water', fromMi: 1611, toMi: 1732, note: 'Wikipedia: desert section in Wyoming where water is scarce. Rawlins (1611) to Lander (1732) in the survey.' },
      { id: 'cdt-grizz', title: 'Grizzly bears', fromMi: 1732, toMi: 3028, note: 'Wikipedia: grizzlies become possible from the Wind River Range north, especially in and near Yellowstone, and are present in Glacier. Carry bear spray and store food properly.' },
      { id: 'cdt-remote', title: 'Remote with little cell service', fromMi: 0, toMi: 3028, note: 'CDTC: remote areas may lack cell service; call 911 even without service, leave an itinerary and consider a satellite messenger. Hitching from passes is hard at several stops (survey flags Lima, Leadore, Encampment, Augusta).' },
      { id: 'cdt-glacier', title: 'Glacier: fixed campsites, Blackfeet permit', fromMi: 2895, toMi: 3028, note: 'Designated campsites only in Glacier, at most 16 mi between campsites, and a Blackfeet Nation permit for the reservation section (CDTC).' }
    ],
    sections: [
      { id: 'nm', name: 'New Mexico', fromMi: 0, toMi: 780, note: 'Wikipedia: 794.5 mi of official route in New Mexico. Lordsburg 83, Silver City 156, Pie Town 415, Grants 523, Cuba 628, Chama 780.' },
      { id: 'co', name: 'Colorado', fromMi: 780, toMi: 1436, note: 'Wikipedia: 735.5 mi official. Cumbres Pass (10,022 ft) is at the New Mexico/Colorado line; San Juans, then the Collegiate and Front Range stops to Steamboat.' },
      { id: 'wy', name: 'Wyoming', fromMi: 1436, toMi: 2000, note: 'Wikipedia: 513 mi official. Encampment, Rawlins, Great Divide Basin, Lander, Pinedale, the Wind River Range (more than 120 mi along its flanks) and Yellowstone.' },
      { id: 'idmt', name: 'Idaho and Montana', fromMi: 2000, toMi: 3028, note: 'Wikipedia: Idaho/Montana border section 358 mi, Montana 627 mi. West Yellowstone to Glacier via Lima, Leadore, Darby, Helena, Lincoln and Augusta.' }
    ],
    points: [
      P(0, 'Crazy Cook Monument (southern terminus)', 'terminus', 31.78, -108.2, null, 'Southern terminus east of the Big Hatchet Mountains, NM (Wikipedia). Coordinates rounded from general reference. Access needs a US Army permit (see Permits).', WIKI, { ap: true }),
      t(83, 'Lordsburg, NM', 32.35, -108.71),
      t(156, 'Silver City, NM', 32.77, -108.28),
      t(415, 'Pie Town, NM', 34.3, -108.13, 'Survey: mail a box here; no grocery store in town.'),
      t(523, 'Grants, NM', 35.15, -107.85),
      t(628, 'Cuba, NM', 36.02, -106.96),
      P(780, 'Chama, NM (via Cumbres Pass)', 'town', 36.9, -106.58, null, 'Reached by a hitch or road walk from Cumbres Pass, 10,022 ft (Wikipedia).' + NOTE, HWA + ' ; ' + WIKI, { ap: true }),
      t(848, 'Pagosa Springs, CO (via Wolf Creek Pass)', 37.27, -107.01, 'Hitch or road walk from the pass.'),
      t(964, 'Lake City, CO (via Spring Creek Pass)', 38.03, -107.31, 'Hitch or road walk from the pass.'),
      t(1064, 'Salida, CO (via Monarch Pass)', 38.53, -106.0, 'Hitch or road walk from the pass.'),
      t(1147, 'Twin Lakes, CO', 39.08, -106.38, 'Survey suggests mailing a box.'),
      t(1185, 'Leadville, CO', 39.25, -106.29, 'Hitch or road walk.'),
      t(1220, 'Breckenridge, CO', 39.48, -106.04, 'Hitch or road walk.'),
      t(1290, 'Winter Park, CO', 39.89, -105.76, 'Hitch or road walk.'),
      t(1343, 'Grand Lake, CO', 40.25, -105.82, 'Stores are reported to be expensive; mailing may save money. Rocky Mountain NP permit and hard-sided canister rules apply nearby.'),
      t(1436, 'Steamboat Springs, CO (via Rabbit Ears Pass)', 40.48, -106.83, 'Hitch or road walk.'),
      t(1529, 'Encampment, WY (via Battle Pass)', 41.2, -106.8, 'Hitching is reported difficult; hiker box at the visitor center.'),
      t(1611, 'Rawlins, WY', 41.79, -107.24, 'Start of the Great Divide Basin stretch.'),
      t(1732, 'Lander, WY', 42.83, -108.73, 'Hitch or road walk.'),
      t(1808, 'Pinedale, WY', 42.87, -109.86, 'Hitch or road walk.'),
      t(2000, 'Old Faithful Village, Yellowstone NP', 44.46, -110.83, 'Survey suggests mailing a box. Yellowstone backcountry permit is required for camping (see Permits).'),
      t(2051, 'West Yellowstone, MT', 44.66, -111.1, 'Hitch or road walk.'),
      t(2146, 'Lima, MT', 44.64, -112.59, 'Hitching reported difficult; survey suggests mailing a box.'),
      t(2250, 'Leadore, ID (via Bannock Pass)', 44.68, -113.36, 'Hitching reported difficult; survey suggests mailing a box.'),
      t(2381, 'Darby, MT (via Chief Joseph Pass)', 46.02, -114.18, 'Hitch or road walk.'),
      t(2640, 'Helena, MT', 46.59, -112.04, 'Hitch or road walk.'),
      t(2706, 'Lincoln, MT', 47.02, -112.68, 'Hitch or road walk.'),
      t(2763, 'Augusta, MT', 47.49, -112.39, 'Hitching reported difficult.'),
      t(2895, 'East Glacier Village, MT', 48.45, -113.22, 'Gateway for Glacier NP: backcountry permit and Blackfeet Nation permit needed (see Permits). Survey suggests mailing a box.'),
      P(3028, 'Northern terminus (Waterton Lakes NP / Chief Mountain border)', 'terminus', 49.0, -113.67, null, 'Wikipedia: Waterton village in Alberta is the official start and end point, with the trail meeting the US-Canada border in Glacier NP. A passport is needed to cross the border (Wikipedia). The mile is the official length, not a FarOut mile, and the coordinates are rounded from general reference.', WIKI, { ap: true })
    ],
    links: [
      { label: 'CDTC thru-hiking information', url: CDTC },
      { label: 'Wikipedia: Continental Divide Trail', url: WIKI },
      { label: 'HalfwayAnywhere: CDT resupply guide (2025 survey)', url: HWA }
    ],
    disclaimer: 'Alternates, closures, permits and hitching conditions change every year; confirm with the Continental Divide Trail Coalition and the land managers.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var SEG = 'https://coloradotrail.org/trail/segments-of-the-ct/';
  var SEGP = 'https://coloradotrail.org/?p=992';
  var WIKI = 'https://en.wikipedia.org/wiki/Colorado_Trail';
  var CMC = 'https://www.cmc.org/education-adventure/trips/routes-places/colorado-trail';
  var F5280 = 'https://5280.com/colorado-trail-denver-to-mt-massive/';
  function seg(mi, name, lat, lon, note, o) { return P(mi, name, 'trailhead', lat, lon, null, 'End of one Colorado Trail Foundation segment and start of the next. ' + (note || ''), SEG, o || (lat != null ? { ap: true } : {})); }

  pack({
    id: 'ct', name: 'Colorado Trail', short: 'CT',
    miles: 485.9,
    milesSource: 'Sum of the 28 Colorado Trail Foundation segment lengths (coloradotrail.org, segments 1 to 28), mile 0 = Waterton Canyon Trailhead, direction Denver to Durango (southwest).',
    mileNote: 'Wikipedia and the Foundation round to 486 mi. The Foundation\'s main page also quotes 567 mi, which includes the Collegiate West alternate (about 85 mi) in place of the Collegiate East segments 12 to 14; the Foundation notes the totals but does not explain the gap. A second mileage page lists slightly different Collegiate West segment lengths (differences of a few tenths).',
    asof: '2026-10', dir: 'SOBO',
    states: ['CO'],
    start: { name: 'Waterton Canyon Trailhead', lat: 39.4914, lon: -105.0947 },
    end: { name: 'Junction Creek Trailhead (Durango)', lat: 37.3314, lon: -107.9028 },
    typicalDays: { min: 30, max: 45, note: 'Planning estimate only (not sourced). Wikipedia: about 89,000 ft of climbing for a thru-hiker over the full length.' },
    permits: [
      { name: 'No trail-wide permit', who: 'Hikers on the main trail', when: 'n/a', costUsd: null, url: SEGP, note: 'Wikipedia does not mention permits. The Foundation lists only: a Southwest Area (SWA) pass may be needed on part of Segment 12, and a USFS parking permit applies at some trailheads (CMC page for the Long Gulch trailhead). Bicycles are not allowed in the six wilderness areas.' },
      { name: 'Lost Creek Wilderness party-size limit', who: 'Groups in Lost Creek Wilderness (Segment 5 area)', when: 'Maximum party size 12', costUsd: null, url: CMC, note: 'From the Colorado Mountain Club trip page for the Long Gulch to Rock Creek hike.' }
    ],
    seasons: [
      { label: 'Main season', months: [7, 8, 9], note: 'Wikipedia: primarily July, August and September. Low-elevation sections near Denver are often accessible April through June.' }
    ],
    hazards: [
      { id: 'ct-alt', title: 'Altitude: most of the trail is above 10,000 ft', fromMi: 71.7, toMi: 485.9, note: 'Wikipedia: most of the trail lies above 10,000 ft and the highest point is 13,271 ft on the slopes of Coney Mountain in the San Juans.' },
      { id: 'ct-tenmile', title: 'Tenmile Range: lightning', fromMi: 104.6, toMi: 117.4, note: '5280: the Tenmile Range traverse (high point about 12,495 ft) is exposed; thunderstorms are the main concern. Start early and be off ridges by early afternoon.' },
      { id: 'ct-remote', title: 'Segments with no nearby towns', fromMi: 282.7, toMi: 464.4, note: 'The Foundation lists no nearby towns for segments 16, 19, 26 and 27. Gunnison (39 mi) and Saguache (31 mi) are far from Segment 17; Creede (10 mi) from Segment 20; Lake City (17 mi) from Segment 21.' },
      { id: 'ct-wild', title: 'Wilderness rules', fromMi: 0, toMi: 485.9, note: 'The trail passes through six wilderness areas where possessing a bicycle is prohibited (Wikipedia).' },
      { id: 'ct-collegiate', title: 'Collegiate East vs Collegiate West', fromMi: 170.0, toMi: 267.5, note: 'The main route uses segments 12 to 14 (Collegiate East). Collegiate West (CW01 to CW05, about 85 mi through the Collegiate Peaks Wilderness with about 19,800 ft of climbing per CMC) leaves from Twin Lakes. Segment 12 may need an SWA pass.' }
    ],
    sections: [
      { id: 'front', name: 'Front Range (Segments 1-8)', fromMi: 0, toMi: 142.8, note: 'Waterton Canyon to Tennessee Pass via Kenosha Pass, Breckenridge/Frisco access, and Copper Mountain.' },
      { id: 'sawatch', name: 'Sawatch Range (Segments 9-15)', fromMi: 142.8, toMi: 267.5, note: 'Tennessee Pass, Mount Massive, Twin Lakes, Collegiate East, Mt. Princeton Hot Springs and US-50 to Marshall Pass.' },
      { id: 'cochetopa', name: 'Cochetopa Hills and San Juans north (Segments 16-21)', fromMi: 267.5, toMi: 358.0, note: 'Marshall Pass to Spring Creek Pass.' },
      { id: 'san-juan', name: 'San Juan Mountains (Segments 22-28)', fromMi: 358.0, toMi: 485.9, note: 'Carson Saddle, Stony Pass, Molas Pass to Junction Creek (Durango). Highest point 13,271 ft near Coney Mountain.' }
    ],
    points: [
      P(0, 'Waterton Canyon Trailhead (eastern terminus)', 'terminus', 39.4914, -105.0947, 5500, 'Start of Segment 1, southwest of Denver, and the lowest point of the trail (Wikipedia).', SEG + ' ; ' + WIKI),
      seg(16.8, 'South Platte River Trailhead', null, null, 'Segment 1 ends (16.8 mi). Segment 2 starts.'),
      seg(28.3, 'Little Scraggy Trailhead', null, null, 'Segment 2 ends (11.5 mi). Conifer is 15 mi from Segment 2.'),
      seg(40.5, 'Wellington Lake Road (FS-560) Trailhead', null, null, 'Segment 3 ends (12.2 mi). Buffalo Creek is 3.2 mi and Bailey 8 mi from Segment 3.'),
      seg(57.1, 'Long Gulch', null, null, 'Segment 4 ends (16.6 mi). Segment 5 runs through Lost Creek Wilderness (max party size 12); Jefferson is 4.5 mi and Fairplay 20 mi from Segment 5.'),
      P(71.7, 'Kenosha Pass', 'pass', 39.41, -105.76, 10000, 'Segment 5 ends (14.6 mi). Elevation about 10,000 ft (5280). Aspen groves peak in mid to late September.', SEG + ' ; ' + F5280, { ap: true }),
      P(104.6, 'Goldhill Trailhead (Breckenridge access)', 'trailhead', 39.53, -106.05, null, 'Segment 6 ends (32.9 mi); the trailhead is about 4 mi north of Breckenridge (5280). Frisco is 5 mi from Segment 6. Georgia Pass (11,874 ft) is on the Kenosha-to-Breckenridge stretch.', SEG + ' ; ' + F5280 + ' ; ' + SEGP, { ap: true, off: { mi: 4, dir: 'S' } }),
      P(117.4, 'Copper Mountain', 'town', 39.49, -106.15, null, 'Segment 7 ends (12.8 mi), under 1 mi from the resort. A free bus runs to Frisco and Breckenridge (5280). Leadville is 8 mi from Segment 8.', SEG + ' ; ' + SEGP + ' ; ' + F5280, { ap: true, off: { mi: 1, dir: null } }),
      P(142.8, 'Tennessee Pass Trailhead', 'trailhead', 39.36, -106.31, null, 'Segment 8 ends (25.4 mi). Camp Hale-Continental Divide National Monument is on the stretch before it (5280).', SEG + ' ; ' + F5280, { ap: true }),
      seg(156.4, 'Timberline Lake Trailhead', null, null, 'Segment 9 ends (13.6 mi), just west of Turquoise Lake near Leadville (5280).'),
      seg(170.0, 'Mount Massive Trailhead', null, null, 'Segment 10 ends (13.6 mi). Twin Lakes Village is 1 mi from Segment 11; the Collegiate West alternate leaves from Twin Lakes.'),
      seg(191.5, 'Clear Creek Road', null, null, 'Segment 11 ends (21.5 mi). Buena Vista is 9.5 mi from Segment 12.'),
      seg(210.0, 'Silver Creek Trailhead', null, null, 'Segment 12 ends (18.5 mi). An SWA pass may be required on part of Segment 12.'),
      P(232.8, 'Chalk Creek Trailhead (Mt. Princeton Hot Springs)', 'trailhead', 38.73, -106.17, null, 'Segment 13 ends (22.8 mi). The Foundation lists Mt. Princeton Hot Springs as on the trail at Segment 13.', SEG + ' ; ' + SEGP, { ap: true }),
      P(253.2, 'US-50 crossing (Salida access)', 'trailhead', null, null, null, 'Segment 14 ends (20.4 mi). Salida is 15 mi from Segment 14.', SEG + ' ; ' + SEGP),
      P(267.5, 'Marshall Pass Trailhead', 'pass', 38.39, -106.25, null, 'Segment 15 ends (14.3 mi).', SEG, { ap: true }),
      seg(282.7, 'Sargents Mesa', null, null, 'Segment 16 ends (15.2 mi). No nearby town is listed.'),
      seg(303.1, 'Colorado Highway 114', null, null, 'Segment 17 ends (20.4 mi). Gunnison is 39 mi and Saguache 31 mi from Segment 17.'),
      seg(316.9, 'Saguache Park Road', null, null, 'Segment 18 ends (13.8 mi).'),
      seg(330.6, 'Eddiesville Trailhead', null, null, 'Segment 19 ends (13.7 mi). No nearby town is listed.'),
      P(343.3, 'San Luis Pass', 'pass', 37.98, -106.93, null, 'Segment 20 ends (12.7 mi). Creede is 10 mi from Segment 20.', SEG + ' ; ' + SEGP, { ap: true }),
      P(358.0, 'Spring Creek Pass Trailhead', 'pass', 37.95, -107.15, null, 'Segment 21 ends (14.7 mi). Lake City is 17 mi from Segment 21.', SEG + ' ; ' + SEGP, { ap: true }),
      seg(375.2, 'Carson Saddle', null, null, 'Segment 22 ends (17.2 mi). The trail\'s highest point, 13,271 ft on the slopes of Coney Mountain, lies in this part of the San Juans (Wikipedia places it 12 mi south of Lake City).'),
      seg(391.1, 'Stony Pass Trailhead', null, null, 'Segment 23 ends (15.9 mi). Silverton is 6 mi from Segment 23.'),
      P(412.0, 'Molas Pass', 'pass', 37.74, -107.69, null, 'Segment 24 ends (20.9 mi).', SEG, { ap: true }),
      seg(432.9, 'Bolam Pass Road', null, null, 'Segment 25 ends (20.9 mi).'),
      seg(443.8, 'Hotel Draw Road', null, null, 'Segment 26 ends (10.9 mi). No nearby town is listed.'),
      seg(464.4, 'Kennebec Trailhead', null, null, 'Segment 27 ends (20.6 mi). No nearby town is listed.'),
      P(485.9, 'Junction Creek Trailhead (Durango, western terminus)', 'terminus', 37.3314, -107.9028, null, 'End of Segment 28 (21.5 mi), near Durango. Coordinates from Wikipedia (37°19\'53"N 107°54\'10"W).', SEG + ' ; ' + WIKI)
    ],
    links: [
      { label: 'Colorado Trail Foundation: segments', url: SEG },
      { label: 'Colorado Trail Foundation: trail pages', url: SEGP },
      { label: 'Wikipedia: Colorado Trail', url: WIKI }
    ],
    disclaimer: 'Segment mileages and services are from the Foundation and change with reroutes; use the Official Colorado Trail Databook for current resupply and water details.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var MAP = 'https://tahoerimtrail.org/maps-trail-';
  var WIKI = 'https://en.wikipedia.org/wiki/Tahoe_Rim_Trail';
  var BP = 'https://www.backpacker.com/trips/tahoe-rim-trail/?scope=anon';
  var SEGN = ' Mile is the running total of the Tahoe Rim Trail Association segment lengths (clockwise from Tahoe City).';

  pack({
    id: 'trt', name: 'Tahoe Rim Trail', short: 'TRT',
    miles: 173.9,
    milesSource: 'Sum of the eight Tahoe Rim Trail Association segment lengths (20.5 + 20.2 + 24.1 + 19.0 + 22.9 + 18.3 + 32.5 + 16.4 = 173.9 mi) read on tahoerimtrail.org, mile 0 = Tahoe City, clockwise (Tahoe City, Brockway, Mt. Rose, Spooner, Kingsbury, Big Meadow, Echo Lakes, Barker Pass).',
    mileNote: 'The loop is quoted as 165 mi (Wikipedia infobox, Backpacker), 170 mi (Wikipedia text, Sierra Rec) and the segment pages add up to 173.9 mi. Differences come from the connectors and reroutes between trailheads. Another page lists the first segment as 20.2 mi, not 20.5.',
    asof: '2026-10', dir: 'CW',
    states: ['CA', 'NV'],
    start: { name: 'Tahoe City Trailhead', lat: 39.17, lon: -120.14 },
    end: { name: 'Tahoe City Trailhead', lat: 39.17, lon: -120.14 },
    typicalDays: { min: 7, max: 10, note: 'Sierra Rec: the loop can be segment hiked over 7 to 10 days (page also notes many people hike it in sections).' },
    permits: [
      { name: 'Desolation Wilderness overnight permit', who: 'Overnight campers in Desolation Wilderness (between Echo Lakes and Barker Pass)', when: 'Quotas apply May through October; apply online (Recreation.gov) or at the Forest Service visitor center', costUsd: 10, url: BP, note: 'Backpacker: $5 per person for the first night and $10 per person for 2 to 14 nights, plus a $10 reservation fee. Day-use permits in Desolation are free and picked up at the trailhead. Verify current fees with the Forest Service.' },
      { name: 'California Campfire Permit', who: 'Anyone using a camp stove on the trail (also required in the Nevada backcountry)', when: 'Before the trip; free online; valid through the end of the year issued', costUsd: 0, url: 'https://preventwildfireca.org', note: 'Backpacker: required to use a stove anywhere on the trail. TRTA: portable pressurized gas stoves with an on/off switch are allowed with a valid permit. Campfires are prohibited on the trail; fires only in designated campgrounds when there are no restrictions.' },
      { name: 'Bear-resistant food storage', who: 'All overnight hikers', when: 'Always', costUsd: null, url: BP, note: 'Backpacker: bear-proofing is required by the Forest Service and Nevada State Parks and canisters are recommended because bear bags are hard to hang above treeline. TRTA: food caches only in hard-sided canisters, not buckets.' },
      { name: 'Mount Rose Wilderness group limit', who: 'Groups in Mt. Rose Wilderness', when: 'Always', costUsd: null, url: BP, note: 'Maximum 15 people (Backpacker).' }
    ],
    seasons: [
      { label: 'Best window', months: [7, 8, 9], note: 'Wikipedia/Backpacker: July through September; most of the trail melts out by the end of June but snow can persist at high elevation and on north slopes into early August. Peak wildflowers mid-July to mid-August.' },
      { label: 'Road closures', months: [10, 11, 12, 1, 2, 3, 4, 5, 6], note: 'Backpacker: road access to Barker Pass closes October to June; Kingsbury South is off limits to trail use in ski season; heavy snow returns in October.' }
    ],
    hazards: [
      { id: 'trt-dry', title: 'Dry east shore (approximate range)', fromMi: 40.7, toMi: 83.8, note: 'Backpacker: the east shore is dry and reaching water often means detours of a mile or more; carry extra and treat all water. The page says the longest carry hikers may face is 17 mi between Watson Lake and Gray Lake.' },
      { id: 'trt-desol', title: 'Desolation Wilderness: longest, steepest climbs', fromMi: 125.0, toMi: 157.5, note: 'Backpacker: the Desolation section has the longest steepest climbs (32.9 mi) and needs an overnight permit to camp.' },
      { id: 'trt-snow', title: 'Snow and cold at any time of year', fromMi: 0, toMi: 173.9, note: 'Backpacker: snow and freezing temperatures can occur year round; in winter snow up to 10 ft can hide the trail; dramatic weather changes between elevations.' },
      { id: 'trt-cell', title: 'Cell service unreliable', fromMi: 0, toMi: 173.9, note: 'Download maps in advance and carry a paper map (Backpacker).' },
      { id: 'trt-sun', title: 'High-elevation sun and altitude', fromMi: 20.5, toMi: 64.8, note: 'The highest point, Relay Peak, is 10,338 ft in Nevada; Tahoe Meadows is 8,740 ft (TRTA).' },
      { id: 'trt-fire', title: 'Fire rules', fromMi: 0, toMi: 173.9, note: 'No campfires on the trail; stoves need a California Campfire Permit (see Permits).' }
    ],
    sections: [
      { id: 'tc-brock', name: 'Tahoe City to Brockway Summit', fromMi: 0, toMi: 20.5, note: 'Watson Lake highlight (TRTA).' },
      { id: 'brock-rose', name: 'Brockway Summit to Mt. Rose Summit / Tahoe Meadows', fromMi: 20.5, toMi: 40.7, note: 'Includes Relay Peak, 10,338 ft, highest point of the TRT (TRTA).' },
      { id: 'rose-spooner', name: 'Mt. Rose / Tahoe Meadows to Spooner Summit', fromMi: 40.7, toMi: 64.8, note: 'Tahoe Meadows 8,740 ft down to Spooner Summit 7,150 ft; side trips to North Canyon Campground and Marlette Lake (TRTA).' },
      { id: 'spooner-kings', name: 'Spooner Summit to Kingsbury South Connector', fromMi: 64.8, toMi: 83.8, note: 'High point of segment 8,830 ft (TRTA).' },
      { id: 'kings-bigm', name: 'Kingsbury South to Big Meadow', fromMi: 83.8, toMi: 106.7, note: 'Grass Lake is an alternate trailhead reached by a 0.6-mi shortcut about two miles before the end (TRTA). Tramway Market is 0.8 mi from Kingsbury South (Backpacker).' },
      { id: 'bigm-echo', name: 'Big Meadow to Echo Lakes', fromMi: 106.7, toMi: 125.0, note: 'Ends at Echo Summit trailhead (TRTA). Meyers is about 5 mi from Echo Summit.' },
      { id: 'echo-barker', name: 'Echo Lakes to Barker Pass (Desolation Wilderness)', fromMi: 125.0, toMi: 157.5, note: 'Overnight permit required in Desolation.' },
      { id: 'barker-tc', name: 'Barker Pass to Tahoe City', fromMi: 157.5, toMi: 173.9, note: 'Ends on the Truckee River at the Tahoe City trailhead (TRTA).' }
    ],
    points: [
      P(0, 'Tahoe City Trailhead', 'terminus', 39.17, -120.14, 6240, 'Loop start/finish on the Truckee River. Lowest point of the TRT, about 6,240 ft (Wikipedia infobox; its text says 6,223 ft). Tahoe City is a main resupply town with South Lake Tahoe (Backpacker).' + SEGN, MAP + ' ; ' + WIKI + ' ; ' + BP, { ap: true }),
      P(20.5, 'Brockway Summit', 'trailhead', 39.27, -120.0, null, 'Segment ends (Tahoe City to Brockway, 20.5 mi). Kings Beach is about 3 mi from the Brockway West trailhead (Backpacker).' + SEGN, MAP + ' ; ' + BP, { ap: true }),
      P(40.7, 'Mt. Rose Summit / Tahoe Meadows', 'trailhead', 39.31, -119.92, 8740, 'Segment ends (Brockway to Mt. Rose / Tahoe Meadows, 20.2 mi). Tahoe Meadows 8,740 ft. Incline Village is about 8 mi from the Mt. Rose Summit trailhead (Backpacker).' + SEGN, MAP + ' ; ' + BP, { ap: true }),
      P(64.8, 'Spooner Summit', 'trailhead', 39.10, -119.91, 7150, 'Segment ends (24.1 mi). Carson City is about 12 mi from Spooner North trailhead (Backpacker).' + SEGN, MAP + ' ; ' + BP, { ap: true }),
      P(83.8, 'Kingsbury South Connector (Kingsbury Grade)', 'trailhead', 38.97, -119.90, null, 'Segment ends (19.0 mi). Tramway Market is 0.8 mi from Kingsbury South and may accept packages if you call ahead (Backpacker). Kingsbury South is closed to trail use in ski season.' + SEGN, MAP + ' ; ' + BP, { ap: true, off: { mi: 0.8, dir: null } }),
      P(106.7, 'Big Meadow Trailhead', 'trailhead', 38.78, -119.97, null, 'Segment ends (22.9 mi). Grass Lake is an alternate trailhead.' + SEGN, MAP, { ap: true }),
      P(125.0, 'Echo Lakes / Echo Summit Trailhead', 'trailhead', 38.83, -120.04, null, 'Segment ends (18.3 mi). Echo Chalet at Echo Lake is seasonal and does not accept hiker packages; Meyers is about 5 mi from Echo Summit (Backpacker). Desolation Wilderness begins here for the next 32.5 mi.' + SEGN, MAP + ' ; ' + BP, { ap: true }),
      P(157.5, 'Barker Pass Trailhead', 'trailhead', 39.07, -120.24, null, 'Segment ends (32.5 mi through Desolation Wilderness). Road access to Barker Pass closes October to June (Backpacker). A Forest Service closure between Barker Pass and the TRT/PCT Twin Peaks junction was reported lifted by TRTA.' + SEGN, MAP + ' ; ' + BP, { ap: true }),
      P(173.9, 'Tahoe City Trailhead (loop complete)', 'terminus', 39.17, -120.14, 6240, 'Final segment Barker Pass to Tahoe City is 16.4 mi.' + SEGN, MAP, { ap: true })
    ],
    links: [
      { label: 'Tahoe Rim Trail Association: maps and trail information', url: MAP },
      { label: 'Backpacker: TRT planning', url: BP },
      { label: 'Wikipedia: Tahoe Rim Trail', url: WIKI }
    ],
    disclaimer: 'Segment lengths, permit fees and closures change; check the Tahoe Rim Trail Association and the Forest Service before you go.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var DB = 'https://aztrail.org/wp-content/uploads/2022/09/azt-data-book-nobo-05152023.pdf';
  var BR = 'https://backpackingroutes.com/arizona-trail-resupply-guide/';
  var FO = 'https://faroutguides.com/arizona-trail-map/';
  var DBN = ' Mile from the Arizona Trail Association NOBO data book (dated 15 Dec 2023).';
  function box(mi, name, kind, lat, lon, elev, note, o) { return P(mi, name, kind, lat, lon, elev, note + DBN, DB, o); }

  pack({
    id: 'azt', name: 'Arizona Trail', short: 'AZT',
    miles: 800,
    milesSource: 'Arizona Trail Association NOBO data book (mile 0 = International Border, valid through mile 593.4 at Schultz Pass Road in Flagstaff); miles north of Flagstaff and the 800-mi total are from FarOut/Backpacking Routes figures (Tusayan 683.7, South Rim 687.7, Jacob Lake 761.7).',
    mileNote: 'FarOut lists 800 mi (a page metadata field says 788). The Flagstaff area has an urban route (Passage 33) and the Santa Catalina Mountains have a Pusch Ridge bypass (Passage 11e) with their own separate mileage, so mile markers there are not always one continuous count. The data book ends in the Flagstaff passage, so later miles are less certain.',
    asof: '2026-10', dir: 'NOBO',
    states: ['AZ'],
    start: { name: 'U.S.-Mexico border, Coronado National Memorial', lat: 31.33, lon: -110.3 },
    end: { name: 'Arizona-Utah border (Kaibab Plateau)', lat: 37.0, lon: -112.4 },
    typicalDays: { min: 35, max: 55, note: 'Planning estimate only (not sourced).' },
    permits: [
      { name: 'Overnight camping permits in some areas', who: 'Hikers camping in certain managed areas (for example national parks)', when: 'Before camping', costUsd: null, url: 'https://aztrail.org/passages', note: 'FarOut: no permit is required to hike or ride the trail, but a permit is needed to camp overnight in certain areas; the page does not name them. Check the Arizona Trail Association and each land manager (Grand Canyon, Saguaro and national forests).' }
    ],
    seasons: [
      { label: 'Northbound', months: [3, 4, 5], note: 'FarOut: northbound hikers typically start in March or early April when spring melts snow and water is easier to find.' },
      { label: 'Southbound', months: [10, 11], note: 'FarOut: southbound hikers usually start around October or November; starting this late can mean dry water sources.' }
    ],
    hazards: [
      { id: 'azt-water', title: 'Water is scarce and seasonal', fromMi: 0, toMi: 800, note: 'The data book flags many dry stretches (for example tanks, windmills and creeks marked unreliable) and no longer rates water; use the Arizona Trail Association water report (aztwaterreport.org) or the AZT app and carry extra.' },
      { id: 'azt-box', title: 'Long gaps between towns', fromMi: 199.9, toMi: 345.3, note: 'Backpacking Routes: Kearny 262.7, Superior 300.5 and Roosevelt Lake Marina 345.3 are the stops; Payson (30 mi) and Pine are the next real towns. Plan food and water carries; the data book marks resupply boxes at trailheads.' },
      { id: 'azt-winter', title: 'Kaibab Plateau: highest point and last resupply', fromMi: 700, toMi: 800, note: 'FarOut: the highest point is on the Kaibab Plateau at 9,148 ft. Jacob Lake (761.7) is the last resupply northbound and is 2.4 mi off trail (Backpacking Routes).' },
      { id: 'azt-flag', title: 'Santa Catalina bypass and Flagstaff variations', fromMi: 164.2, toMi: 183.9, note: 'The Santa Catalina section has a Pusch Ridge bypass with its own mileage (Passage 11e); Summerhaven at 183.9 has a store and post office. In Flagstaff the data book notes a no-camping, no-campfire area to the north of mile 564.2.' },
      { id: 'azt-gc', title: 'Grand Canyon crossing', fromMi: 683.7, toMi: 761.7, note: 'The Grand Canyon passages (37 to 39) go from the South Rim through the Inner Gorge to the North Rim; Tusayan 683.7, South Rim 687.7. Camping inside Grand Canyon National Park needs a park permit; this pack did not verify the rules, so check with the park.' }
    ],
    sections: [
      { id: 'south', name: 'Passages 1-13: border to Oracle', fromMi: 0, toMi: 198.2, note: 'Huachuca Mountains to Canelo Hills, Santa Ritas, Rincons, Santa Catalinas and Oracle.' },
      { id: 'central', name: 'Passages 14-26: Black Hills to Highline', fromMi: 198.2, toMi: 456.8, note: 'Gila River canyons, Superstition and Mazatzal wilderness and Four Peaks (passage starts per the data book).' },
      { id: 'rim', name: 'Passages 27-32: Mogollon Rim to Flagstaff', fromMi: 456.8, toMi: 593.4, note: 'Blue Ridge, Happy Jack, Mormon Lake, Anderson Mesa, Walnut Canyon, Elden Mountain.' },
      { id: 'north', name: 'Passages 33-43: Flagstaff to Utah', fromMi: 593.4, toMi: 800, note: 'San Francisco Peaks, Babbitt Ranch, Coconino Rim, Grand Canyon (South Rim, Inner Gorge, North Rim), Kaibab Plateau, Buckskin Mountain.' }
    ],
    points: [
      box(0.0, 'International Border (southern terminus)', 'terminus', 31.33, -110.3, 5911, 'Southern terminus in the Huachuca Mountains.', { ap: true }),
      box(1.8, 'Montezuma Pass / FR 61', 'trailhead', 31.35, -110.3, 6570, 'Trailhead with auto and trailer parking.', { ap: true }),
      box(6.3, 'Miller Peak trail junction', 'landmark', null, null, 9050, 'Miller Peak is 0.5 mi to the right.'),
      box(20.5, 'Parker Canyon Lake Trailhead', 'trailhead', null, null, 5680, 'Passage 1 ends. Seasonal store and water at Parker Canyon Lake; water 0.6 mi NW; marina access.', { water: { type: 'lake', note: 'Water 0.6 mi NW of the trailhead (data book).' } }),
      box(34.3, 'Canelo Pass Trailhead', 'trailhead', null, null, 5330, 'Resupply box. Patagonia is 19.5 mi south by road.'),
      box(44.1, 'Harshaw Connector (to Patagonia)', 'trailhead', null, null, 4520, 'Patagonia is 4.5 mi south; Casa Blanca Trailhead is 8.5 mi north. Backpacking Routes lists Patagonia with a post office, two small stores, Red Mountain Foods, a coffee shop and an RV park with Wi-Fi and showers (its mile 51.2).', { off: { mi: 4.5, dir: 'S' }, svc: { post: true, grocery: 'limited', lodging: null, laundry: null, shower: true, restaurant: true, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      box(52.7, 'Casa Blanca Canyon Trailhead', 'trailhead', null, null, 4302, 'Resupply box; trailhead parking.'),
      box(73.5, 'Apache Springs Trailhead', 'trailhead', null, null, 5235, 'Resupply box.'),
      box(77.0, 'Kentucky Camp', 'landmark', null, null, 5125, 'Fairly reliable water; cabin overnight possible.', { water: { type: 'spring/tank', note: 'Data book: fairly reliable.' } }),
      box(90.3, 'FR 231 and Helvetia Road Trailhead', 'trailhead', null, null, 4628, 'Resupply box.'),
      box(106.8, 'AZT gate / Sahuarita Road', 'trailhead', null, null, 3672, 'Roadside parking; resupply box.'),
      box(112.8, 'Gabe Zimmerman Trailhead (Rincon Valley)', 'trailhead', null, null, 3430, 'Resupply box. Marsh Station Road underpass at 114.0; Vail is about 6.4 mi away (data book), with a post office, Safeway and restaurants (Backpacking Routes).', { off: { mi: 6.4, dir: null }, svc: { post: true, grocery: 'full', lodging: null, laundry: null, shower: null, restaurant: true, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'box' } }),
      box(126.7, 'Saguaro National Park boundary', 'permit', null, null, 3110, 'Passage 8 ends, Passage 9 starts. Overnight camping rules apply inside the park: check with the Park Service.'),
      box(151.0, 'Redington Road and cache box', 'trailhead', null, null, 4334, 'Passage 9 ends. Tucson is about 15 mi west.'),
      box(161.6, 'Catalina Highway and cache box', 'trailhead', null, null, 4380, 'Tucson (all services) is about 12 mi south; Molino Basin Campground adjacent.', { off: { mi: 12, dir: 'S' } }),
      box(164.2, 'Gordon Hirabayashi Trailhead campground', 'trailhead', null, null, 4820, 'Passage 10 ends, Passage 11 starts; the Pusch Ridge bypass (11e) starts here with its own mileage.'),
      P(183.9, 'Summerhaven', 'town', 32.4, -110.7, 7720, 'On the trail: post office, small store, restaurants and Wi-Fi (Backpacking Routes). Data book notes water, PO, grocery and motel. Marshall Gulch Trailhead is at 182.9 (7,447 ft). Coordinates rounded from general reference.' + DBN, DB + ' ; ' + BR, { ap: true, svc: { post: true, grocery: 'limited', lodging: null, laundry: null, shower: null, restaurant: true, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      box(198.2, 'American Flag Trailhead (Oracle)', 'trailhead', null, null, 4410, 'Oracle is 4.0 mi west (Dollar General, post office, lodging per Backpacking Routes). Passage 12 ends.', { off: { mi: 4.0, dir: 'W' }, svc: { post: true, grocery: 'limited', lodging: null, laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      box(205.2, 'Highway 77 and cache box', 'trailhead', null, null, 4070, 'Services 2.2 mi south and about 7 mi northeast.'),
      box(262.6, 'Gila River at Kelvin Bridge', 'water', null, null, 1752, 'Passage 15 ends. Kearny is 6.2 mi southeast (two grocery stores, laundromat per Backpacking Routes, who list it at mile 262.7). Water rating 2-3.', { off: { mi: 6.2, dir: 'SE' }, water: { type: 'river', note: 'Gila River; data book rating w2-3 (probable).' } }),
      box(299.9, 'Picketpost Trailhead (Superior)', 'trailhead', null, null, 2388, 'Passage 17 ends. Superior is 4 to 5 mi east (post office, grocery, motel per Backpacking Routes).', { off: { mi: 4.5, dir: 'E' }, svc: { post: true, grocery: 'full', lodging: ['Motel (per Backpacking Routes)'], laundry: null, shower: null, restaurant: true, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      box(343.8, 'Cemetery Trail junction (Roosevelt Lake Marina)', 'town', null, null, 2274, 'Data book: store, laundry and motel about 0.25 mi north; post office 9 mi east. Backpacking Routes: marina has a restaurant and convenience store; call ahead for packages.', { off: { mi: 0.25, dir: 'N' } }),
      box(384.7, 'Highway 87 (toward Payson)', 'trailhead', null, null, 3433, 'Passage 21 ends. Payson (full services) is about 30 mi north per both sources; this is a long hitch.', { off: { mi: 30, dir: 'N' } }),
      box(456.8, 'Pine Trailhead / Highline', 'trailhead', null, null, 5380, 'Passage 25 ends. The town of Pine is about 0.8 mi northwest (water, groceries).', { off: { mi: 0.8, dir: 'NW' } }),
      box(495.7, 'Blue Ridge Trailhead', 'trailhead', null, null, 6847, 'Resupply box.'),
      box(532.8, 'Navajo Spring junction (Mormon Lake)', 'town', null, null, 7465, 'Mormon Lake Lodge and store about 1 mi east (data book); Backpacking Routes lists a post office, lodge, year-round store and restaurant.', { off: { mi: 1, dir: 'E' } }),
      box(565.5, 'Flagstaff Urban Trail junction', 'town', null, null, 6622, 'Flagstaff services are about 4.3 mi north via the urban route.', { off: { mi: 4.3, dir: 'N' } }),
      box(578.7, 'Interstate 40', 'landmark', null, null, 6500, 'Passage 31 ends, Passage 32 starts.'),
      box(593.4, 'Schultz Pass Road', 'trailhead', null, null, 8020, 'End of the data book range for the main route (Passage 32 ends here).'),
      P(683.7, 'Tusayan', 'town', null, null, null, 'On trail per Backpacking Routes: restaurants, store, Wi-Fi; high prices. The Grand Canyon South Rim is 4 mi further.', BR),
      P(687.7, 'Grand Canyon South Rim', 'town', null, null, null, 'About 1.2 mi off the trail: grocery, general store, post office, lodging, campground (Backpacking Routes).', BR, { off: { mi: 1.2, dir: null }, svc: { post: true, grocery: 'full', lodging: ['Park lodging (per Backpacking Routes)'], laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }),
      P(761.7, 'Jacob Lake', 'town', null, null, null, 'About 2.4 mi off the trail: inn, camping, basic necessities. Last resupply for northbound hikers (Backpacking Routes).', BR, { off: { mi: 2.4, dir: null } }),
      P(800, 'Arizona-Utah border (northern terminus)', 'terminus', 37.0, -112.4, null, 'Northern terminus on the Kaibab Plateau side; the Kaibab Plateau is the highest area of the trail at 9,148 ft (FarOut). Coordinates only roughly placed (within about 0.2 degree).', FO, { ap: true })
    ],
    links: [
      { label: 'Arizona Trail Association: passages', url: 'https://aztrail.org/passages' },
      { label: 'AZTA NOBO data book (PDF, Dec 2023)', url: DB },
      { label: 'Arizona Trail water report', url: 'https://aztwaterreport.org' },
      { label: 'FarOut: Arizona Trail', url: FO }
    ],
    disclaimer: 'Water, resupply boxes and services change; the Arizona Trail Association data book is the primary reference and the Grand Canyon crossing needs its own permit check.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;
  var CH = 'https://www.cleverhiker.com/backpacking/a-short-guide-to-vermonts-long-trail/';
  var GMC = 'https://greenmountainclub.org/hike/thru-hiking/';
  var GMC2 = 'https://www.greenmountainclub.org/the-long-trail/';
  var SH = 'https://sectionhiker.com/how-to-hike-vermonts-long-trail/';
  var NOTE = ' Mile is the Long Trail mile from the southern (Massachusetts) terminus as listed by Clever Hiker; it is the trail mile closest to the town road crossing, not the town itself.';
  function town(mi, name, lat, lon, groc, lvl) { return P(mi, name, 'town', lat, lon, null, 'Resupply town. Grocery: ' + groc + '.' + NOTE, CH, { ap: true, svc: { post: null, grocery: lvl || 'full', lodging: null, laundry: null, shower: null, restaurant: null, outfitter: null, hikerBox: null, cell: null, resupplyBy: 'town' } }); }

  pack({
    id: 'lt', name: 'Long Trail', short: 'LT',
    miles: 272,
    milesSource: 'Green Mountain Club: 272 miles from the Massachusetts border to the Canadian border. Town miles from Clever Hiker (Long Trail mile from the southern terminus).',
    mileNote: 'The southern ~100 miles overlap the Appalachian Trail, so AT mile markers and Long Trail mile markers do not match. Town mile figures come from one hiker guide and the trail is re-routed over time; check the GMC End-to-End Guide.',
    asof: '2026-10', dir: 'NOBO',
    states: ['VT'],
    start: { name: 'Massachusetts border (southern terminus)', lat: 42.74, lon: -73.2 },
    end: { name: 'Journey\'s End, Canadian border', lat: 45.0, lon: -72.47 },
    typicalDays: { min: 20, max: 30, note: 'GMC: the average thru-hike takes 20 to 30 days (the same page also says 21 to 25); daily mileage 5 to 20+.' },
    permits: [
      { name: 'No permit for individuals', who: 'Individual hikers', when: 'n/a', costUsd: null, url: GMC, note: 'GMC: individuals do not need a permit; some groups may need a special-use permit from the Green Mountain National Forest or the Vermont Department of Forests, Parks and Recreation. Overnight sites are free and first come first served.' },
      { name: 'Food storage', who: 'All overnight hikers', when: 'Always in the Green Mountain National Forest; encouraged elsewhere', costUsd: null, url: GMC, note: 'Bear canisters are recommended and available through a free, first-come lending program; Ursack bags and bear hangs are permitted. Do not sleep with food or hang it inside a shelter.' }
    ],
    seasons: [
      { label: 'Recommended', months: [7, 8, 9], note: 'GMC: July, August and September. June is popular but snow may remain and black flies are at their worst.' },
      { label: 'Avoid', months: [4, 5], note: 'GMC: April and May are mud season and high-elevation hiking is discouraged (Clever Hiker asks hikers to wait until after Memorial Day). October to March is winter; thru-hiking is not recommended.' }
    ],
    hazards: [
      { id: 'lt-tent', title: 'No tenting above 2,500 ft', fromMi: 0, toMi: 272, note: 'GMC: tenting is prohibited above 2,500 ft. Use designated sites; some have a communal firepit while fires are strictly prohibited at others.' },
      { id: 'lt-weather', title: 'Fast-changing mountain weather', fromMi: 0, toMi: 272, note: 'GMC: temperature can drop as much as 5 F per 1,000 ft; rain, fog and wind occur even in summer.' },
      { id: 'lt-terrain', title: 'Steep and rocky northern half', fromMi: 130, toMi: 272, note: 'GMC: rocks, roots, mud and steep climbs, especially in the northern half. Clever Hiker mentions ladders and hand-over-hand climbing in the northern half.' },
      { id: 'lt-water', title: 'Water can fail in dry weather', fromMi: 0, toMi: 272, note: 'GMC: treat all water; Giardia and other illnesses are possible. Sectionhiker adds that beavers are common.' },
      { id: 'lt-bears', title: 'Black bears', fromMi: 0, toMi: 272, note: 'Bears are common and some are habituated to food (GMC). Store food properly.' },
      { id: 'lt-ticks', title: 'Ticks, mosquitoes and black flies', fromMi: 0, toMi: 272, note: 'Mostly before September (Clever Hiker). Sectionhiker mentions ticks and Lyme disease.' },
      { id: 'lt-shared', title: 'Crowds on the AT-shared miles', fromMi: 0, toMi: 104, note: 'Clever Hiker: crowded on the first 100 miles, which overlap the Appalachian Trail.' }
    ],
    sections: [
      { id: 'south', name: 'Southern Vermont (shared with the AT)', fromMi: 0, toMi: 104.5, note: 'GMC: the southern 100 miles overlap the AT, which then forks east toward New Hampshire near Killington.' },
      { id: 'central', name: 'Killington to Waitsfield area', fromMi: 104.5, toMi: 163.7, note: 'Rutland access at mile 104.5 (US 4).' },
      { id: 'north', name: 'Waitsfield to Johnson', fromMi: 163.7, toMi: 221.6, note: 'Waterbury and the high summits including Mount Mansfield, 4,389 ft by Clever Hiker (the state\'s highest point; GMC says the trail crosses all five Vermont peaks over 4,000 ft).' },
      { id: 'far-north', name: 'Johnson to Canada', fromMi: 221.6, toMi: 272, note: 'Remote northern section ending at Journey\'s End on the Canadian border.' }
    ],
    points: [
      P(0, 'Massachusetts border (southern terminus)', 'terminus', 42.74, -73.2, null, 'Southern terminus near North Adams/Williamstown, MA (Sectionhiker). Coordinates only roughly placed from general reference (within a few km). Williamstown is the usual shuttle base.', GMC + ' ; ' + SH, { ap: true }),
      town(54.4, 'Manchester Center, VT', 43.16, -73.07, 'Shaw\'s; gear at The Mountain Goat'),
      town(104.5, 'Rutland, VT (US 4)', 43.61, -72.97, 'Price Chopper and Rutland Area Food Co-op; a free bus runs along Rt. 4'),
      town(163.7, 'Waitsfield, VT', 44.19, -72.82, 'Shaw\'s'),
      town(184.6, 'Waterbury, VT', 44.34, -72.76, 'Village Market and Shaw\'s; gear at Waterbury Sports'),
      town(221.6, 'Johnson, VT (Route 15)', 44.63, -72.68, 'Johnson General Store (reopened 2025); gear at Johnson Hardware & Rental. The post office handles mail drops (Sectionhiker)', 'limited'),
      P(272, 'Journey\'s End (Canadian border, northern terminus)', 'terminus', 45.0, -72.47, null, 'Northern terminus; shuttles run back to Massachusetts (Sectionhiker). Coordinates only roughly placed from general reference.', GMC + ' ; ' + SH, { ap: true })
    ],
    links: [
      { label: 'Green Mountain Club: thru-hiking', url: GMC },
      { label: 'Green Mountain Club: the Long Trail', url: GMC2 },
      { label: 'Clever Hiker: guide to the Long Trail', url: CH }
    ],
    disclaimer: 'Town miles come from a hiker guide, not the GMC; use the Long Trail End-to-End Guide for official mileages, shelters and rules.'
  });
})();
(function () {
  'use strict';
  var P = __BP_OTHER.P, pack = __BP_OTHER.pack;

  /* ---------------- Wonderland Trail ---------------- */
  var NPSW = 'https://home.nps.gov/mora/planyourvisit/the-wonderland-trail.htm';
  var NPSPDF = 'https://www.nps.gov/mora/planyourvisit/upload/Wonderland-Trail-Dec18.pdf';
  var WWIKI = 'https://en.wikipedia.org/wiki/Wonderland_Trail';
  var V3 = 'https://visitrainier.com/wonderland-trail-pt-3-mowich-lake-sunrise/';
  var V4 = 'https://visitrainier.com/?p=11766';
  var WNOTE = ' Mile counted clockwise from Mowich Lake (derived from the Visit Rainier segment tables).';
  pack({
    id: 'wonderland', name: 'Wonderland Trail', short: 'Wonderland',
    miles: 93,
    milesSource: 'NPS: about 93 miles around Mount Rainier. Mile 0 here is Mowich Lake, clockwise (Mowich Lake, Sunrise, Box Canyon...), because the only segment tables read were Mowich Lake to Sunrise Camp (21.5 mi) and Sunrise Camp to Box Canyon (22.2 mi) from Visit Rainier. The conventional start is Longmire; the remaining ~49 mi (Box Canyon, Longmire, back to Mowich Lake) are not mile-marked here.',
    mileNote: 'Sources give the loop as about 93 miles, with about 27,000 ft of gain (NPS) or 22,000 ft (Wikipedia) or 25,593 ft (a trip report). Miles after Box Canyon (43.7) are not covered by points in this pack.',
    asof: '2026-10', dir: 'CW',
    states: ['WA'],
    start: { name: 'Mowich Lake (mile 0 in this pack)', lat: 46.94, lon: -121.86 },
    end: { name: 'Mowich Lake', lat: 46.94, lon: -121.86 },
    typicalDays: { min: 10, max: 14, note: 'Visit Rainier: the full hike takes 10 to 14 days at 7 to 10 miles a day (shorter if you carry fast); a recommended pace, not a rule.' },
    permits: [
      { name: 'Mount Rainier wilderness permit (every night)', who: 'Anyone camping on the Wonderland Trail; the complete loop must use designated camps only', when: 'Early-year lottery for advance reservations, then remaining designated sites reserved on Recreation.gov; about 30% of sites are held for walk-up permits at the park\'s wilderness information centers', costUsd: null, url: NPSW, note: 'NPS: a wilderness permit is required for each night; reserving ahead is strongly recommended in summer; fires, pets, bicycles and firearms are not allowed. Parties of 6 to 12 need a camp with a group site (not Pyramid Creek, Klapatche Park, Dick Creek or Eagle\'s Roost). A trip-report blog (2019-era, not NPS) quoted a non-refundable $20 lottery request fee, so check the current fee. Longmire Wilderness Information Center 360-569-6650; park 360-569-2211 (NPS).' }
    ],
    seasons: [
      { label: 'Snow-free window', months: [7, 8, 9, 10], note: 'NPS: typically mostly snow-free mid-July to October; in an average snow year not advisable until mid to late July. Earlier needs winter skills, ice-axe self-arrest and fording glaciated rivers.' }
    ],
    hazards: [
      { id: 'wl-rivers', title: 'Glaciated river crossings', fromMi: 0, toMi: 93, note: 'NPS: dangerous glaciated river crossings are the specifically named hazard. Cross early in the day when glacial melt is lowest and do not cross if flow is high.' },
      { id: 'wl-panhandle', title: 'Panhandle Gap snowfields', fromMi: 31.8, toMi: 36.2, note: 'Visit Rainier: permanent snowfields on the Fryingpan/Panhandle Gap stretch can be dangerous; cross later in the day when snow softens, avoid bad weather and carry an ice axe early in the season. High point of the loop, 6,775 ft per Visit Rainier (Wikipedia: 6,750 ft).' },
      { id: 'wl-carbon', title: 'Carbon River washout stretch', fromMi: 6.8, toMi: 9, note: 'Visit Rainier: a one-mile stretch past the Northern Loop junction is prone to washing out and may be closed, requiring a detour. A 200+ ft suspension bridge crosses the Carbon River.' },
      { id: 'wl-descents', title: 'Long steep descents', fromMi: 22.3, toMi: 24.9, note: 'Visit Rainier: over 2,000 ft of descent in 2.6 mi from Sunrise toward White River; trekking poles are recommended.' },
      { id: 'wl-spray', title: 'Spray Park alternate: snowfields (position within this segment not given)', fromMi: 0, toMi: 21.5, note: 'Visit Rainier: the Spray Park alternate crosses permanent snowfields and can be dangerous early in the season or in bad weather.' },
      { id: 'wl-fuel', title: 'Food caches and fuel', fromMi: 0, toMi: 93, note: 'Food caches are available at Longmire, Sunrise and Mowich Lake; Ohanapecosh and White River are off the trail (Visit Rainier overview). A trip report notes fuel cannot be shipped and caches must be picked up by the date written on them.' }
    ],
    sections: [
      { id: 'mowich-sunrise', name: 'Mowich Lake to Sunrise Camp', fromMi: 0, toMi: 21.5, note: 'Visit Rainier: Mowich Lake to Dick Creek 9.0 mi, Mystic Lake 3.8, Granite Creek 4.4, Sunrise Camp 4.3 (21.5 mi; 6,300 ft of gain).' },
      { id: 'sunrise-box', name: 'Sunrise Camp to Box Canyon', fromMi: 21.5, toMi: 43.7, note: 'Visit Rainier: 22.2 mi with 4,350 ft of gain over Panhandle Gap and past Summerland and Indian Bar.' },
      { id: 'rest', name: 'Box Canyon to Longmire to Mowich Lake', fromMi: 43.7, toMi: 93, note: 'Not mile-marked in this pack. A trip report lists Longmire, Devil\'s Dream, North Puyallup River, Golden Lakes and South Mowich River as the first camps clockwise from Longmire.' }
    ],
    points: [
      P(0, 'Mowich Lake trailhead and camp', 'trailhead', 46.94, -121.86, 4950, 'Start of this pack\'s mile count. Food cache site (Visit Rainier).' + WNOTE, V3 + ' ; ' + NPSW, { ap: true }),
      P(5.1, 'Ipsut Creek junction', 'landmark', null, null, 2500, 'Side trail 0.3 mi to Ipsut Creek Campground. Visit Rainier gives 2,500 ft as the lowest point; Wikipedia gives Ipsut Creek Campground as the lowest point at 2,320 ft.' + WNOTE, V3 + ' ; ' + WWIKI),
      P(6.8, 'Northern Loop detour junction', 'landmark', null, null, null, 'Side trail across the Carbon River.' + WNOTE, V3),
      P(7.8, 'Carbon River Camp', 'campsite', null, null, null, 'About 1 mi past the 6.8 mi point (derived).' + WNOTE, V3),
      P(9.0, 'Dick Creek Camp', 'campsite', null, null, 4200, 'No group site (NPS). Steep climb after it.' + WNOTE, V3 + ' ; ' + NPSW),
      P(12.8, 'Mystic Lake camps', 'campsite', null, null, 5700, 'Lake elevation 5,700 ft.' + WNOTE, V3),
      P(17.2, 'Granite Creek Camp', 'campsite', null, null, 5800, 'Crossed after Winthrop Creek (milky, silted).' + WNOTE, V3),
      P(21.5, 'Sunrise Camp', 'campsite', 46.91, -121.64, 6250, 'Sunrise visitor area is about 0.5 mi away via the left trail at the Sunrise junction (Visit Rainier pt. 4). Food cache site.' + WNOTE, V3 + ' ; ' + V4, { ap: true }),
      P(24.9, 'White River Campground', 'campsite', null, null, null, 'Ranger station for food and fuel caches; hiker and car sites. Reached on the Sunrise to Box Canyon stretch 3.4 mi past Sunrise Camp.' + WNOTE, V4),
      P(31.8, 'Summerland Camp', 'campsite', null, null, 5900, 'Group shelter; heavy day-hiker use. 10.3 mi past Sunrise Camp.' + WNOTE, V4),
      P(33.2, 'Panhandle Gap', 'pass', null, null, 6775, 'Highest point of the Wonderland Trail; permanent snowfields can be dangerous early in the season (Visit Rainier). Wikipedia gives 6,750 ft.' + WNOTE, V4 + ' ; ' + WWIKI),
      P(36.2, 'Indian Bar Camp junction', 'campsite', null, null, 5100, 'Spur left to Indian Bar Camp; an Indian Bar trail shelter exists (Wikipedia).' + WNOTE, V4 + ' ; ' + WWIKI),
      P(40.9, 'Cowlitz Divide Trail junction', 'landmark', null, null, 4775, 'Cowlitz Divide Trail runs 4.3 mi to Stevens Canyon Road.' + WNOTE, V4),
      P(42.9, 'Nickel Creek camps', 'campsite', null, null, 3450, 'Relocated camp.' + WNOTE, V4),
      P(43.7, 'Box Canyon Picnic Area and trailhead', 'trailhead', 46.74, -121.60, 3050, 'Water and restrooms. End of the mapped stretch in this pack; the loop continues west to Longmire and north to Mowich Lake.' + WNOTE, V4, { ap: true })
    ],
    links: [
      { label: 'NPS: Wonderland Trail', url: NPSW },
      { label: 'NPS Wonderland Trail brochure (PDF, 2018)', url: NPSPDF },
      { label: 'Visit Rainier: Mowich Lake to Sunrise', url: V3 },
      { label: 'Wikipedia: Wonderland Trail', url: WWIKI }
    ],
    disclaimer: 'Only about half the loop is mile-marked here; use the NPS Wilderness Trip Planner and permit staff for camps and current conditions.'
  });

  /* ---------------- Rae Lakes Loop ---------------- */
  var RL = 'https://www.nps.gov/seki/planyourvisit/rae-lakes-loop.htm';
  var RLT = 'https://www.nps.gov/seki/planyourvisit/traildesc.htm?fullweb=1';
  var HP = 'https://www.hikingproject.com/trail/7050955/rae-lakes-loop';
  pack({
    id: 'raelakes', name: 'Rae Lakes Loop', short: 'Rae Lakes',
    miles: 41.4,
    milesSource: 'NPS Sequoia & Kings Canyon: 41.4 mi (the NPS trail-description page says 41; Hiking Project 40.4). Mile 0 = Road\'s End (Cedar Grove), clockwise via Woods Creek (north leg) and returning down Bubbs Creek.',
    mileNote: 'The route is a loop from Road\'s End. Clockwise goes up the Woods Creek/Paradise Valley side and down Bubbs Creek; counterclockwise is the reverse. Only the distances stated by NPS are marked; intermediate mile markers (Rae Lakes, Glen Pass) were not read from an official source.',
    asof: '2026-10', dir: 'CW',
    states: ['CA'],
    start: { name: 'Road\'s End (Kings Canyon)', lat: 36.795, lon: -118.587 },
    end: { name: 'Road\'s End (Kings Canyon)', lat: 36.795, lon: -118.587 },
    typicalDays: { min: 3, max: 5, note: 'Planning estimate only (not sourced).' },
    permits: [
      { name: 'Wilderness permit (Rae Lakes quota)', who: 'All overnight hikers; loop permits are issued only from the Road\'s End Permit Station', when: 'Quota season: May 23 to September 27 in 2025 (Hiking Project); reservations on Recreation.gov', costUsd: null, url: RL, note: 'NPS links to the park\'s wilderness permit and Recreation.gov pages; quota and fee amounts were not on the page read. Portable bear canisters are required.' },
      { name: 'Camping limits on the loop', who: 'Overnight hikers', when: 'Always', costUsd: null, url: RL, note: 'Lower Paradise Valley: designated sites only. Paradise Valley: 2-night limit. Rae Lakes: one night per lake. Charlotte Lake: 2 nights. Kearsarge Lakes: 2 nights. Bullfrog Lake: closed to all camping. Mist Falls: no camping. Campfires prohibited above 10,000 ft. No pets or wheeled vehicles.' }
    ],
    seasons: [
      { label: 'Practical window', months: [7, 8, 9], note: 'NPS: high water at crossings in May and early June; Glen Pass may be impassable to hikers until mid to late July. Quota season ran late May to late September.' }
    ],
    hazards: [
      { id: 'rl-bridge', title: 'South Fork Kings River bridge washed out (approximate position)', fromMi: 6.5, toMi: 12, note: 'NPS: the bridge above Paradise Valley washed out in winter 2016-17 and replacement was not planned before 2027. Crossing can be extremely hazardous; be prepared to turn back and backtrack to Cedar Grove.' },
      { id: 'rl-glen', title: 'Glen Pass (11,978 ft) (approximate position)', fromMi: 12, toMi: 30, note: 'NPS gives the pass as 11,978 ft (Hiking Project 11,927). It may be impassable to hikers until mid to late July. Snow, ice and afternoon storms: turn around if conditions are unsafe.' },
      { id: 'rl-water', title: 'High water at stream crossings', fromMi: 0, toMi: 41.4, note: 'NPS: crossings can be a problem in May and early June.' },
      { id: 'rl-bears', title: 'Bear canisters required', fromMi: 0, toMi: 41.4, note: 'NPS: hikers are required to carry portable bear-resistant canisters.' }
    ],
    sections: [
      { id: 'loop', name: 'Whole loop from Road\'s End', fromMi: 0, toMi: 41.4, note: 'Clockwise: Road\'s End up the South Fork Kings River to Paradise Valley (first allowed campsite 6.5 mi from the trailhead, NPS), then Woods Creek to the Rae Lakes basin, over Glen Pass and down Bubbs Creek (first allowed campsite from this end: Sphinx Creek Junction, 4 mi from the trailhead, NPS). Mile markers for the lakes and pass were not read from an official source.' }
    ],
    points: [
      P(0, 'Road\'s End Permit Station and trailhead', 'terminus', 36.795, -118.587, 5035, 'Start and end; the loop climbs from about 5,035 ft (NPS). Permits for the loop are issued only here. Coordinates rounded from general reference.', RL + ' ; ' + RLT, { ap: true }),
      P(6.5, 'Paradise Valley (first allowed campsite, clockwise)', 'campsite', null, null, null, 'Designated sites may be required in Lower Paradise Valley; two-night limit. Distance from NPS trail description.', RLT + ' ; ' + RL),
      P(37.4, 'Sphinx Creek Junction (first campsite, counterclockwise)', 'campsite', null, null, null, 'Four miles from Road\'s End via Bubbs Creek (NPS), so about mile 37.4 clockwise (derived: 41.4 minus 4). Provides access to the John Muir and Pacific Crest trails.', RLT, {}),
      P(41.4, 'Road\'s End (loop complete)', 'terminus', 36.795, -118.587, 5035, 'Loop closes at Road\'s End.', RL, { ap: true })
    ],
    links: [
      { label: 'NPS: Rae Lakes Loop', url: RL },
      { label: 'NPS: wilderness trail descriptions', url: RLT },
      { label: 'Hiking Project: Rae Lakes Loop', url: HP }
    ],
    disclaimer: 'Only distances stated by NPS are marked; check the Road\'s End Permit Station for current trail conditions, the river crossing and campsite rules.'
  });

  /* ---------------- Timberline Trail ---------------- */
  var HG = 'https://hikingguy.com/hiking-trails/timberline-trail-guide-mt-hood';
  var TR = 'https://www.treelinereview.com/where-to-go/timberline-trail-guide';
  var TNOTE = ' Mile counted clockwise from Timberline Lodge as given by Hiking Guy (camp mileages only).';
  pack({
    id: 'timberline', name: 'Timberline Trail (Mount Hood)', short: 'Timberline',
    miles: 41.5,
    milesSource: 'Hiking Guy: 41.5-mile loop (Treeline Review says 41). Mile 0 = Timberline Lodge, clockwise; only camp locations are mile-marked.',
    mileNote: 'Treeline Review\'s day-by-day distances sum to about 34.7 (it says they do not add up to 41), so use only the Hiking Guy camp miles, which are clockwise from the lodge.',
    asof: '2026-10', dir: 'CW',
    states: ['OR'],
    start: { name: 'Timberline Lodge', lat: 45.3311, lon: -121.7113 },
    end: { name: 'Timberline Lodge', lat: 45.3311, lon: -121.7113 },
    typicalDays: { min: 3, max: 5, note: 'Treeline Review plans a 5-day itinerary; a 4-day version is also given.' },
    permits: [
      { name: 'Wilderness permit (self-issue)', who: 'All hikers entering the wilderness', when: 'Free, self-issued at kiosks May 15 to Oct 15', costUsd: 0, url: HG, note: 'Sign it and carry it. Treeline Review: no trail permit or quota; self-register at the trailhead.' },
      { name: 'Northwest Forest Pass or Interagency pass (parking)', who: 'Vehicles parked at Cloud Cap, Top Spur and Ramona Falls', when: 'Required while parked', costUsd: null, url: HG, note: 'Timberline Lodge needs none in summer; park in the signed overnight lot (Hiking Guy).' }
    ],
    seasons: [
      { label: 'Best window', months: [7, 8, 9], note: 'Hiking Guy: late July through September; wildflowers peak late July to late August. Treeline Review: snow lingers into late spring and by October the trail may be snowy and hard to navigate.' }
    ],
    hazards: [
      { id: 'tl-eliot', title: 'Eliot Creek / Branch: hardest crossing (approximate position)', fromMi: 22, toMi: 28, note: 'Hiking Guy ranks it the most difficult: steep banks, swift current; the landslide area can wash out and fixed ropes are sometimes present (Treeline Review).' },
      { id: 'tl-white', title: 'White River (approximate position)', fromMi: 36, toMi: 41.5, note: 'Hiking Guy: hazardous, second-to-last major crossing. Treeline Review: camp before it and cross the next morning.' },
      { id: 'tl-newton', title: 'Newton Creek (approximate position)', fromMi: 34, toMi: 34, note: 'Hiking Guy: hazardous, near the Gnarl Ridge descent. Camping on both sides.' },
      { id: 'tl-sandy', title: 'Sandy River (approximate position)', fromMi: 9, toMi: 11, note: 'Hiking Guy: hazardous; a hiker died in 2014 falling from a log bridge. Glacial silt: treat water. Cross early in the day.' },
      { id: 'tl-ladd', title: 'Ladd and Coe Creeks (approximate position)', fromMi: 17, toMi: 22, note: 'Hiking Guy: deep, fast water at Ladd Creek; Coe Branch can be tough early in the season or after rain (Treeline Review).' },
      { id: 'tl-rule', title: 'Crossing rules of thumb', fromMi: 0, toMi: 41.5, note: 'Crossings change daily. Unclip pack straps, look for cairns and sticks, avoid loose sand banks, and do not cross if unsure: wait or backtrack (Hiking Guy). Streams are lowest in the morning.' },
      { id: 'tl-muddy', title: 'Muddy Fork / Yocum Ridge blowdowns (approximate position)', fromMi: 11, toMi: 19, note: 'Treeline Review: blowdowns from 2021 were unresolved as of fall 2025 and it suggests the PCT as a detour. Muddy Fork is the lowest point, 2,800 ft (Hiking Guy), crossed by a large log bridge.' }
    ],
    sections: [
      { id: 'west', name: 'Lodge to Cairn Basin', fromMi: 0, toMi: 19, note: 'Zigzag and Sandy Rivers, Ramona Falls (about mile 11) and Eden Park (mile 19, 1 mi off trail).' },
      { id: 'north', name: 'Elk Cove to Cloud Cap', fromMi: 19, toMi: 28, note: 'Elk Cove (mile 22) is the most popular camp (no camping in meadows); Cloud Cap Saddle Campground (mile 28) is the only official campground (fee, water spigot).' },
      { id: 'east', name: 'Newton Creek and Gnarl Ridge', fromMi: 28, toMi: 41.5, note: 'Gnarl Ridge is the high, exposed section; the high point is 7,335 ft (Hiking Guy) or 7,350 ft (Treeline Review). Cooper Spur Shelter is a stone shelter with no water nearby.' }
    ],
    points: [
      P(0, 'Timberline Lodge', 'terminus', 45.3311, -121.7113, null, 'Start and finish. Park in the signed overnight lot; no pass needed in summer.' + TNOTE, HG, { ap: true }),
      P(11, 'Ramona Falls area', 'campsite', 45.38, -121.8, null, 'Dispersed camping. Pass is required for parking at the Ramona Falls trailhead.' + TNOTE, HG, { ap: true }),
      P(19, 'Eden Park', 'campsite', null, null, null, 'Quieter camping, 1 mile off the trail.' + TNOTE, HG, { off: { mi: 1, dir: null } }),
      P(22, 'Elk Cove', 'campsite', null, null, null, 'Most popular camp; no camping in the meadows.' + TNOTE, HG),
      P(28, 'Cloud Cap Saddle Campground', 'campsite', 45.4, -121.65, null, 'Only official campground on the loop: fee and a water spigot (Hiking Guy); privy (Treeline Review). Parking needs an NW Forest Pass.' + TNOTE, HG + ' ; ' + TR, { ap: true }),
      P(34, 'Newton Creek camps', 'campsite', null, null, null, 'Small campsites on both sides of the creek; the crossing is hazardous.' + TNOTE, HG),
      P(41.5, 'Timberline Lodge (loop complete)', 'terminus', 45.3311, -121.7113, null, 'Loop closes at the lodge.' + TNOTE, HG, { ap: true })
    ],
    links: [
      { label: 'Hiking Guy: Timberline Trail guide', url: HG },
      { label: 'Treeline Review: Timberline Trail guide', url: TR }
    ],
    disclaimer: 'River crossings and trail damage change constantly; check the Forest Service (Mt. Hood National Forest) for current conditions.'
  });

  /* ---------------- Pacific Northwest Trail ---------------- */
  var PF = 'https://www.pnt.org/faq/';
  var PFA = 'https://faroutguides.com/pacific-northwest-trail-map/';
  var PFS = 'https://www.fs.usda.gov/main/pnt/about';
  pack({
    id: 'pnt', name: 'Pacific Northwest Trail', short: 'PNT',
    miles: 1200,
    milesSource: 'Pacific Northwest Trail Association: about 1,200 miles, east to west. FarOut splits it into an East guide (580 mi, Glacier to Oroville WA) and a West guide (640 mi, Oroville to the Pacific); Oroville is placed at mile 580.',
    mileNote: 'The PNTA says the route changes from year to year; FarOut\'s two guides total 1,220 mi and one retailer blurb says 1,217 mi.',
    asof: '2026-10', dir: 'WB',
    states: ['MT', 'ID', 'WA'],
    start: { name: 'Chief Mountain Customs, Glacier NP, MT', lat: 48.99, lon: -113.68 },
    end: { name: 'Cape Alava, Olympic NP, WA', lat: 48.17, lon: -124.73 },
    typicalDays: { min: 60, max: 75, note: 'PNTA: thru-hikes typically take 60 to 75 days; hikers usually start at Glacier in early July and reach the Pacific in September.' },
    permits: [
      { name: 'National park backcountry permits (no thru-hiker permit)', who: 'Overnight campers in Glacier NP, North Cascades NP Complex and Olympic NP', when: 'Contact each park; there is no coordinated PNT permit', costUsd: null, url: PF, note: 'PNTA: parking in national forests, state lands and some parks may require a pass or fee. All three parks require approved food storage. Bear canisters are required only in Olympic NP\'s Seven Lakes Basin and the Olympic Coast.' }
    ],
    seasons: [
      { label: 'Prime season', months: [7, 8, 9], note: 'PNTA: July through September; best weather mid-June to mid-September.' }
    ],
    hazards: [
      { id: 'pnt-grizz', title: 'Grizzly bears (about 400 miles of the trail)', fromMi: 0, toMi: 1200, note: 'PNTA: grizzlies live along roughly 400 miles of the trail (which stretches is not stated here); black bears along nearly all of it except about 70 miles in Section 8 (Puget Sound). Carry bear spray in grizzly country.' },
      { id: 'pnt-nav', title: 'Mostly unmarked trail and bushwhacking', fromMi: 0, toMi: 1200, note: 'PNTA: navigation challenges on mostly unmarked trail, rock scrambling, snow at altitude, and dangerous stream crossings such as the Swift Creek ford south of Mount Baker.' },
      { id: 'pnt-coast', title: 'Olympic Coast (approximate position)', fromMi: 1100, toMi: 1200, note: 'PNTA: coastal travel is a unique risk and bear canisters are required on the Olympic Coast. Check tide tables.' },
      { id: 'pnt-fire', title: 'Wildfire closures and reroutes', fromMi: 0, toMi: 1200, note: 'PNTA: wildfire closures and route changes can occur.' },
      { id: 'pnt-wild', title: 'Wildlife beyond bears', fromMi: 0, toMi: 1200, note: 'PNTA names moose, wolves and mountain lions among the risks.' }
    ],
    sections: [
      { id: 'east', name: 'Glacier to Oroville (East guide)', fromMi: 0, toMi: 580, note: 'FarOut East guide: 580 miles through Montana, Idaho and eastern Washington.' },
      { id: 'west', name: 'Oroville to the Pacific (West guide)', fromMi: 580, toMi: 1200, note: 'FarOut West guide: 640 miles through the Pasayten Wilderness, Ross Lake, the North Cascades, Puget Sound (a ferry crossing, the only one in the National Trails System) and about 140 miles in Olympic NP (Forest Service).' }
    ],
    points: [
      P(0, 'Chief Mountain Customs (eastern terminus)', 'terminus', 48.99, -113.68, null, 'Northeast corner of Glacier NP, Montana. Coordinates rounded from general reference.', PF, { ap: true }),
      P(580, 'Oroville, WA (trail midpoint)', 'town', 48.94, -119.44, null, 'PNTA: the midpoint is near Oroville. FarOut\'s East guide ends here (580 mi).', PF + ' ; ' + PFA, { ap: true }),
      P(1200, 'Cape Alava (western terminus)', 'terminus', 48.17, -124.73, null, 'Westernmost point in the contiguous US, in Olympic NP. Coordinates rounded from general reference.', PF, { ap: true })
    ],
    links: [
      { label: 'Pacific Northwest Trail Association: FAQ', url: PF },
      { label: 'US Forest Service: PNT about', url: PFS },
      { label: 'FarOut: Pacific Northwest Trail', url: PFA }
    ],
    disclaimer: 'This is a planning outline only (a few verified facts and no town miles); the PNTA digest and FarOut are the primary references.'
  });
})();
delete window.__BP_OTHER;
