/* Campica data pack: Texas, Oklahoma, Arkansas, Louisiana.
   Facts only from pages listed in SOURCES-camps-tx-ok-ar.md. null = NOT verified: the UI must say "check with the source"
   and show the official link. Coordinates for Texas state parks are TPWD's own park-location pair (tpwd.texas.gov/state-parks/nearby),
   i.e. the park, not necessarily the campground loop. Entrance fees are charged in addition to Texas nightly fees and were not read. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', TPWD = 'Texas Parks & Wildlife', RG = 'recreation.gov', RGPHONE = '877-444-6777';
  function K(id, name, parent, agency, state, region, county, o){
    o = o || {};
    CAMPS.items.push({
      id: id, name: name, parent: parent, agency: agency, state: state, region: region, county: county || null,
      lat: o.lat === undefined ? null : o.lat, lon: o.lon === undefined ? null : o.lon, elevFt: o.elev === undefined ? null : o.elev,
      season: mix({open:null, close:null, note:null}, o.season),
      status: o.status === undefined ? null : o.status, statusNote: o.statusNote || null,
      types: o.types || [],
      sites: mix({total:null, rv:null, tent:null, maxRvFt:null, maxTrailerFt:null, hookups:null, hookupNote:null}, o.sites),
      amenities: mix({showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, pets:null, ada:null, cell:null}, o.amen),
      family: mix({swim:null, beach:null, playground:null, juniorRanger:null, rangerPrograms:null, easyTrails:null, fishing:null, boating:null, bikeFriendly:null, nearTown:null, kidNote:null}, o.fam),
      fees: mix({nightlyMin:null, nightlyMax:null, extraVehicle:null, reservationFee:null, note:'Nightly rate not verified: check the official page.', asof:ASOF}, o.fees),
      booking: mix({system:null, url:null, phone:null, window:null, firstComeNote:null, cancelNote:null}, o.book),
      contact: mix({phone:null, email:null, url:null, address:null}, o.contact),
      dispersedOk: false,
      highlights: o.hi || [], cautions: o.caut || [], src: o.src || [], asof: ASOF
    });
  }
  function R(url, extra){ return mix({system:RG, url:url, phone:RGPHONE}, extra); }
  var TPB = {system:'Texas State Parks reservations', url:'https://tpwd.texas.gov/state-parks/reservations/', phone:'512-389-8900'};
  var TPF = ' A daily park entrance fee is charged in addition (amount not read).';
  var NEARBY = 'https://tpwd.texas.gov/state-parks/nearby';
  var CONTACT = 'https://tpwd.texas.gov/state-parks/contact-a-park';
  function TP(id, name, slug, state, region, lat, lon, phone, o){
    o.src = (o.src || []).concat(['https://tpwd.texas.gov/state-parks/' + slug + '/fees-facilities/campsites', NEARBY, CONTACT]);
    o.book = mix(TPB, o.book);
    o.contact = mix({phone:phone, url:'https://tpwd.texas.gov/state-parks/' + slug}, o.contact);
    o.lat = lat; o.lon = lon;
    K(id, name, name.replace(/ \(.*/, ''), TPWD, 'TX', region, null, o);
  }

  /* ---------------- TEXAS: NATIONAL PARKS AND SEASHORE ---------------- */
  K('tx-chisos-basin-big-bend', 'Chisos Basin Campground', 'Big Bend National Park', NPS, 'TX', 'texas', null, {
    elev:5400, types:['tent','rv'],
    season:{open:'Year-round', close:null, note:'Reservable year-round; Recreation.gov says there is no first-come camping here.'},
    status:'open',
    sites:{total:60, hookups:'none', hookupNote:'60 non-electric sites, some held for administrative use. Most suit tents; few sites are level. Recreation.gov gives conflicting RV limits (about 19-20 ft trailers, 24 ft motorhomes). Dump station on site.', maxRvFt:24},
    amen:{showers:false, flush:true, water:true, dump:true, firepit:false, bearBox:true, pets:'limited'},
    fees:{note:'Nightly rate not shown on the current NPS or Recreation.gov pages read. An archived NPS release (effective 2020) gave $16 for developed campgrounds: confirm the current rate. Park entrance fee is separate.'},
    book:R('https://www.recreation.gov/camping/campgrounds/234038', {window:'Up to 6 months ahead', cancelNote:'Arriving the day after a reservation starts counts as a no-show.'}),
    contact:{phone:'432-477-1121', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm'},
    hi:['Cool mountain basin at about 5,400 ft','Food lockers for bear and wildlife safety','Trailheads start nearby'],
    caut:['No wood or ground fires; charcoal only in the provided grills.','Hang no hammocks from trees; pets are not allowed on trails or in buildings.','Store food in the lockers or a hard-sided vehicle.','Check-in 1 pm; call 432-477-2251 if you will arrive late.'],
    src:['https://www.recreation.gov/camping/campgrounds/234038','https://www.nps.gov/bibe/planyourvisit/camping.htm','https://www.nps.gov/bibe/learn/news/changes-to-big-bend-camping-fees-and-reservations.htm']
  });
  K('tx-rio-grande-village-big-bend', 'Rio Grande Village Campground', 'Big Bend National Park', NPS, 'TX', 'texas', null, {
    types:['tent','rv'], status:'open',
    sites:{hookups:'none', hookupNote:'The NPS campground has drinking water and restrooms. The separate concession RV park next to the store has full hookups (see its own record).'},
    amen:{water:true, flush:true, firepit:false},
    fees:{note:'Nightly rate not on the pages read. An archived NPS release (effective 2020) gave $16 for developed campgrounds: confirm. Site count not verified.'},
    book:R('https://www.recreation.gov/camping/campgrounds/234035', {window:'Reservations required per the NPS camping page; up to 6 months ahead per an archived release'}),
    contact:{phone:'432-477-1121', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm'},
    hi:['East side of the park beside the Rio Grande'],
    caut:['No wood or ground fires.','Fee, site count and season were not on the page read: check the NPS link.'],
    src:['https://www.nps.gov/bibe/planyourvisit/camping.htm','https://www.recreation.gov/camping/campgrounds/234035','https://www.nps.gov/bibe/learn/news/changes-to-big-bend-camping-fees-and-reservations.htm']
  });
  K('tx-rio-grande-village-rv-park-big-bend', 'Rio Grande Village RV Park', 'Big Bend National Park', 'Aramark (NPS concession)', 'TX', 'texas', null, {
    types:['rv'],
    sites:{total:25, rv:25, maxRvFt:38, hookups:'full', hookupNote:'Full hookups; 38 ft maximum. Reservations by phone.'},
    book:{system:'Concessioner (phone)', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm', phone:'855-765-1324'},
    contact:{phone:'855-765-1324', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm'},
    hi:['Only full-hookup option in Big Bend NP'],
    caut:['Rate and season not on the page read: call the concessioner.'],
    src:['https://www.nps.gov/bibe/planyourvisit/camping.htm']
  });
  K('tx-cottonwood-big-bend', 'Cottonwood Campground', 'Big Bend National Park', NPS, 'TX', 'texas', null, {
    types:['tent','rv'], status:'seasonal', statusNote:'The NPS page (updated July 2026) listed it as closed for summer; check current status.',
    sites:{hookups:'none'}, amen:{water:true, flush:true, firepit:false},
    fees:{note:'Nightly rate not on the pages read. An archived NPS release (effective 2020) said this campground is first-come, first-served and gave $16 for developed campgrounds: confirm both.'},
    book:{system:'First-come (per archived 2020 release)', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm'},
    contact:{phone:'432-477-1121', url:'https://www.nps.gov/bibe/planyourvisit/camping.htm'},
    hi:['West side of the park near the Rio Grande'], caut:['No wood or ground fires.'],
    src:['https://www.nps.gov/bibe/planyourvisit/camping.htm','https://www.nps.gov/bibe/learn/news/changes-to-big-bend-camping-fees-and-reservations.htm']
  });
  K('tx-pine-springs-guadalupe-mountains', 'Pine Springs Campground', 'Guadalupe Mountains National Park', NPS, 'TX', 'texas', null, {
    types:['tent','rv','walk-in'],
    sites:{total:33, rv:13, tent:20, maxRvFt:55, hookups:'none', hookupNote:'20 gravel walk-in tent sites (up to 6 people, 2 tents) and 13 paved RV sites. No hookups or dump station. RVs and trailers 55 ft or longer are prohibited.'},
    book:R('https://www.recreation.gov/', {window:'Up to 6 months ahead'}),
    contact:{phone:'915-828-3251', url:'https://www.nps.gov/gumo/planyourvisit/camping.htm'},
    hi:['Trailheads for the Guadalupe Peak hike nearby'],
    caut:['Voicemail at the park phone is answered within about five business days.','Fee not on the page read.'],
    src:['https://www.nps.gov/gumo/planyourvisit/camping.htm']
  });
  K('tx-dog-canyon-guadalupe-mountains', 'Dog Canyon Campground', 'Guadalupe Mountains National Park', NPS, 'TX', 'texas', null, {
    types:['tent','rv'],
    sites:{total:13, rv:4, tent:9, maxRvFt:23, hookups:'none', hookupNote:'9 tent sites and 4 RV sites; no hookups or dump station; 23 ft maximum RV length.'},
    book:R('https://www.recreation.gov/', {window:'Up to 6 months ahead'}),
    contact:{phone:'915-828-3251', url:'https://www.nps.gov/gumo/planyourvisit/camping.htm'},
    hi:['Remote north side of the park'],
    caut:['About a two-hour drive from Pine Springs.','Fee not on the page read.'],
    src:['https://www.nps.gov/gumo/planyourvisit/camping.htm']
  });
  K('tx-malaquite-padre-island', 'Malaquite Campground', 'Padre Island National Seashore', NPS, 'TX', 'texas', null, {
    types:['tent','rv'], season:{open:'Year-round', close:null, note:'Per a third-party summary of NPS information.'}, status:'open',
    sites:{total:48, hookups:'none', hookupNote:'48 sites: 24 paved (tent or RV), 18 ocean-side (tent or RV), 6 ocean-side tent-only, 1 accessible. Up to 8 people, 2 tents, 2 vehicles per site.'},
    fam:{beach:true},
    fees:{note:'A third-party page quoted $14 a night ($7 with Senior/Access pass) from an older NPS article: confirm the current rate with the park.'},
    book:{system:'First come, first served', firstComeNote:'No reservations. Pay at the self-registration station at the entrance.', url:'https://www.nps.gov/pais/planyourvisit/camping.htm'},
    contact:{url:'https://www.nps.gov/pais/planyourvisit/camping.htm'},
    hi:['Camp beside the Gulf beach'],
    caut:['Only a third-party page was read for this record; confirm status and rate with NPS.'],
    src:['https://npplan.com/parks-by-state/texas-national-parks/padre-island-national-seashore-park-at-a-glance/padre-island-national-seashore-camping/padre-island-national-seashore-malaquite-campground/']
  });

  /* ---------------- TEXAS: STATE PARKS (TPWD) ---------------- */
  TP('tx-palo-duro-canyon-state-park', 'Palo Duro Canyon State Park', 'palo-duro-canyon', 'TX', 'texas', 34.984709, -101.701867, '806-488-2227', {
    types:['tent','rv','group','hike-in'],
    sites:{total:null, maxRvFt:60, hookups:'varies', hookupNote:'Juniper (18), Mesquite/Sagebrush (47) and Hackberry (32) electric-and-water sites; 18 tent-only Fortress Cliff water sites; hike-in primitive sites. Some electric sites take 60 ft.'},
    fees:{nightlyMin:12, nightlyMax:26, note:'$12 hike-in primitive, $16 tent water sites, $26 electric sites; group camps $50-250.' + TPF},
    amen:{showers:true, water:true, firepit:true}, hi:['Second-largest canyon in the US, camp on the canyon floor'], caut:['Primitive hike-in sites have no water and no open fires.']
  });
  TP('tx-enchanted-rock-state-natural-area', 'Enchanted Rock State Natural Area', 'enchanted-rock', 'TX', 'texas', 30.496033, -98.819952, '830-685-3636', {
    types:['tent','walk-in','hike-in','group'],
    sites:{total:55, rv:0, hookups:'none', hookupNote:'35 walk-in sites with water (8 people), 20 hike-in primitive sites at Moss Lake and Walnut Springs (1-3 mile hike), plus a 50-person group area. Tent camping only.'},
    fees:{nightlyMin:14, nightlyMax:20, extraVehicle:6, note:'$20 walk-in (+$10 per extra person), $14 primitive hike-in, $100 group. Excess vehicle $6 per night.' + TPF},
    amen:{showers:true, water:true, firepit:true, pets:'limited'}, caut:['Primitive sites: no water, no ground fires, no hammocks from trees.','Minors under 17 not with a sponsored group need a written consent form for primitive sites.']
  });
  TP('tx-inks-lake-state-park', 'Inks Lake State Park', 'inks-lake', 'TX', 'texas', 30.737356, -98.369007, '512-793-2223', {
    types:['tent','rv','hike-in'],
    sites:{total:169, hookups:'varies', hookupNote:'114 electric/50-amp, 4 tent-only electric (walk-in, no RVs), 42 water-only (one RV under 26 ft, no generators), 9 primitive hike-in (1.58 miles).'},
    fees:{nightlyMin:11, nightlyMax:23, extraVehicle:6, note:'$23 electric, $21 tent-only electric, $16 water, $11 primitive hike-in; weekly/monthly rates Dec-Feb.' + TPF},
    amen:{showers:true, water:true, firepit:true}, fam:{swim:true, fishing:true, boating:true}, caut:['Primitive hike-in sites: no ground fires and no pets.']
  });
  TP('tx-lost-maples-state-natural-area', 'Lost Maples State Natural Area', 'lost-maples', 'TX', 'texas', 29.807719, -99.570697, '830-966-3413', {
    types:['tent','rv','hike-in'],
    sites:{total:60, hookups:'some', hookupNote:'30 sites with water and 30-amp electric (back-in, shade shelter) plus 30 hike-in primitive sites (1-3.2 miles). No RV length limit on the page.'},
    fees:{nightlyMin:10, nightlyMax:20, extraVehicle:5, note:'$20 electric ($120 per week), $10 primitive hike-in.' + TPF},
    amen:{showers:true, water:true, firepit:true, pets:'limited', cell:false}, caut:['No cell service in the park.','Hike-in sites: no water, no fires (stoves allowed), stay at your reserved site.'], hi:['Fall maple colour season']
  });
  TP('tx-pedernales-falls-state-park', 'Pedernales Falls State Park', 'pedernales-falls', 'TX', 'texas', 30.308054, -98.257649, '830-868-7304', {
    types:['tent','rv'], src:['https://tpwd.texas.gov/state-parks/pedernales-falls/fees-facilities/campsites/campsites-with-electric-and-water'],
    sites:{hookups:'electric', hookupNote:'69 sites with water and 30-amp electric (8 people). Other site types at this park were not read.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 for the electric-and-water sites (the only type read). Other types may differ.' + TPF}, amen:{showers:true, water:true, firepit:true}
  });
  TP('tx-mckinney-falls-state-park', 'McKinney Falls State Park', 'mckinney-falls', 'TX', 'texas', 30.180752, -97.722007, '512-243-1643', {
    types:['tent','rv'], src:['https://tpwd.texas.gov/state-parks/mckinney-falls/fees-facilities/campsites/premium-campsites'],
    sites:{hookups:'electric', hookupNote:'12 premium sites with water and 50/30/20-amp electric and a 16x16 ft tent pad. Other site types were not read.'},
    fees:{nightlyMin:24, nightlyMax:24, note:'$24 for the premium electric sites (the only type read).' + TPF}, amen:{showers:true, water:true, firepit:true}, fam:{nearTown:'Austin, TX'}
  });
  TP('tx-garner-state-park', 'Garner State Park', 'garner', 'TX', 'texas', 29.598887, -99.743981, '830-232-6132', {
    types:['tent','rv'],
    sites:{total:null, hookups:'varies', hookupNote:'Six types: 12 full-hookup pull-through (no tents), 39 + 137 + 35 electric, 49 + 75 water-only. Water-only sites at Pecan Grove, Persimmon Hill and Rio Frio take up to 20 ft. Live Oak and Persimmon Hill close Jan-Feb.'},
    fees:{nightlyMin:15, nightlyMax:35, extraVehicle:5, note:'$15 water (New Garner), $20 water (Old Garner), $22-26 electric, $35 full hookup.' + TPF},
    amen:{showers:true, water:true, firepit:true}, fam:{swim:true}, hi:['On the Frio River']
  });
  TP('tx-davis-mountains-state-park', 'Davis Mountains State Park', 'davis-mountains', 'TX', 'texas', 30.599103, -103.929450, '432-426-3337', {
    types:['tent','rv','hike-in'],
    sites:{total:93, hookups:'varies', hookupNote:'26 full hookup, 34 electric, 33 water-only, plus hike-in primitive sites 4 miles from the trailhead (no ground fires; pets allowed).'},
    fees:{nightlyMin:10, nightlyMax:25, note:'$25 full hookup, $20 electric, $15 water, $10 primitive hike-in.' + TPF}, amen:{water:true, firepit:true}
  });
  TP('tx-balmorhea-state-park', 'Balmorhea State Park', 'balmorhea', 'TX', 'texas', 30.945036, -103.786663, '432-375-2370', {
    types:['tent','rv'], src:['https://tpwd.texas.gov/state-parks/balmorhea/fees-facilities/campsites/campsites-water-electric'],
    sites:{total:18, hookups:'electric', hookupNote:'18 back-in sites with water and 20/30-amp electric; sites 12-17 are tent-only. Check-in 2 pm.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20.' + TPF}, amen:{showers:true, water:true, firepit:true}, fam:{swim:true, kidNote:'Famous spring-fed swimming pool at the park (pool details not read).'}
  });
  TP('tx-caprock-canyons-state-park', 'Caprock Canyons State Park & Trailway', 'caprock-canyons', 'TX', 'texas', 34.410296, -101.053264, '806-455-1492', {
    types:['tent','rv','walk-in','hike-in'],
    sites:{hookups:'varies', hookupNote:'Honey Flat: 10 sites with 50-amp and 25 with 30-amp electric; Lake Theo walk-in water sites (9); primitive walk-in and hike-in sites; trailway sites need a 7-mile hike or ride.'},
    fees:{nightlyMin:10, nightlyMax:22, note:'$22 50-amp, $17 30-amp, $14 Lake Theo/Little Red, $12 South Prong and hike-in, $10 overflow.' + TPF}, amen:{water:true, firepit:true}
  });
  TP('tx-goliad-state-park', 'Goliad State Park & Historic Site', 'goliad', 'TX', 'texas', 28.656544, -97.387265, '361-645-3405', {
    types:['tent','rv','walk-in'],
    sites:{total:58, hookups:'varies', hookupNote:'20 full-hookup pull-through, 14 electric, 10 walk-in water (tent only), 14 water sites along the San Antonio River.'},
    fees:{nightlyMin:10, nightlyMax:25, note:'$25 full hookup, $20 electric, $10 water and walk-in.' + TPF}, amen:{showers:true, water:true, firepit:true}
  });
  TP('tx-galveston-island-state-park', 'Galveston Island State Park', 'galveston-island', 'TX', 'texas', 29.198755, -94.956212, '409-737-1222', {
    types:['tent','rv','hike-in'],
    sites:{hookups:'varies', hookupNote:'Beachside premium (8) and electric (50) sites, 7 tent platforms, 15 hike-in tent sites; bay-side 20 electric and 10 water sites (no vehicles over 18 ft at water sites); 10 primitive dry-camp sites.'},
    fees:{nightlyMin:15, nightlyMax:35, note:'$35 premium beachside, $30 beachside electric, $20 bay-side/platform, $15 water and primitive.' + TPF},
    amen:{showers:true, water:true, firepit:true}, fam:{beach:true}, caut:['Bay-side sites are about 1.5 miles from the beach.'], book:{system:'ReserveAmerica (per TPWD)'}
  });
  TP('tx-brazos-bend-state-park', 'Brazos Bend State Park', 'brazos-bend', 'TX', 'texas', 29.371, -95.631921, null, {
    types:['tent','walk-in'], src:['https://tpwd.texas.gov/state-parks/brazos-bend/fees-facilities/campsites/campsites-primitive/'],
    sites:{hookups:'unknown', hookupNote:'Only the 6 primitive walk-in sites (35-70 yards from parking) were read; the park has other camping types not read.'},
    fees:{nightlyMin:12, nightlyMax:12, note:'$12 for the primitive walk-in sites (the only type read). Other types may cost more.' + TPF},
    amen:{showers:true, water:true, firepit:true}, caut:['Two TPWD pages gave different phone numbers (553-5101 and 553-5102): phone left blank, use the TPWD link.']
  });
  TP('tx-mother-neff-state-park', 'Mother Neff State Park', 'mother-neff', 'TX', 'texas', 31.321559, -97.469150, '254-853-2389', {
    types:['rv','tent'], sites:{total:20, hookups:'full', hookupNote:'20 full-hookup sites (water, sewer, 30/50-amp). Other site types were not read.'},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 for the full-hookup sites (the only type read).' + TPF}, amen:{showers:true, water:true, firepit:true}, book:{system:'ReserveAmerica (per TPWD)'}
  });
  TP('tx-colorado-bend-state-park', 'Colorado Bend State Park', 'colorado-bend', 'TX', 'texas', 31.022965, -98.442401, '325-628-3240', {
    types:['tent','rv','walk-in','hike-in','group'],
    sites:{maxRvFt:20, hookups:'none', hookupNote:'15 primitive drive-up (self-contained RVs to 20 ft, no hookups, no dump), 28 riverbank walk-in tent sites, backcountry hike-in sites, group camps.'},
    fees:{nightlyMin:10, nightlyMax:15, note:'$15 drive-up, $13 walk-in, $10 backcountry hike-in; groups $35-75.' + TPF}, amen:{water:true, firepit:true}
  });
  TP('tx-lake-brownwood-state-park', 'Lake Brownwood State Park', 'lake-brownwood', 'TX', 'texas', 31.856987, -99.028641, '325-784-5223', {
    types:['tent','rv'],
    sites:{hookups:'varies', hookupNote:'20 full hookup, 35 + 11 electric, 9 tent-only electric, 12 tent-only water sites. Comanche Trails electric sites limit RVs to 27 ft.', maxRvFt:27},
    fees:{nightlyMin:15, nightlyMax:30, extraVehicle:5, note:'$30 full hookup, $25 and $20 electric, $18 tent electric, $15 water.' + TPF}, amen:{showers:true, water:true, firepit:true}, fam:{fishing:true, boating:true}
  });
  TP('tx-big-bend-ranch-state-park', 'Big Bend Ranch State Park', 'big-bend-ranch', 'TX', 'texas', 29.470458, -103.957922, '432-358-4444', {
    types:['tent','hike-in'], sites:{hookups:'none', hookupNote:'Primitive drive-in sites (picnic table and fire ring) and backcountry hike-in sites. No RV rules on the page.'},
    fees:{nightlyMin:10, nightlyMax:16, note:'$12 or $16 drive-in, $10 hike-in.' + TPF}, book:{system:'TPWD reservations; backcountry permit at Barton Warnock or Fort Leaton'},
    caut:['Remote desert: no water at primitive sites, check road conditions at the east (432-424-3327) or west (432-229-3613) entrance.','Hike-in sites need a permit; the ranger station number 432-358-4444 is the park listing.']
  });
  TP('tx-lake-somerville-nails-creek', 'Lake Somerville State Park - Nails Creek Unit', 'lake-somerville', 'TX', 'texas', 30.290719, -96.667214, '979-289-2392', {
    types:['tent','rv'], src:['https://tpwd.texas.gov/state-parks/lake-somerville/fees-facilities/campsites/campsites-water-electric'],
    sites:{total:20, hookups:'electric', hookupNote:'20 electric sites (41-60) in Cedar Creek. Other site types and the Birch Creek unit were not read.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 for the electric sites (the only type read); $120 weekly Dec-Feb.' + TPF}, amen:{water:true}
  });

  /* ---------------- ARKANSAS: NATIONAL RIVER AND HOT SPRINGS ---------------- */
  var BUFF = 'https://www.nps.gov/buff/planyourvisit/camping.htm';
  var BUFFB = R('https://www.recreation.gov/', {window:'Up to 6 months ahead (required mid-March to mid-November at most sites)', firstComeNote:'Winter sites are first come and free.'});
  function BF(id, name, lat, o){ o.src = [BUFF].concat(o.src || []); o.book = mix(BUFFB, o.book); o.contact = mix({phone:'870-439-2502', url:BUFF}, o.contact); K(id, name, 'Buffalo National River', NPS, 'AR', 'oklahoma-arkansas', null, o); }
  BF('ar-buffalo-point-buffalo-river', 'Buffalo Point Campground', 0, {
    types:['tent','rv','walk-in','group'], season:{open:'Mid-March', close:'Mid-November', note:'Full services mid-March to mid-November; B Loop open for free first-come winter camping.'}, status:'seasonal',
    sites:{total:101, hookups:'partial', hookupNote:'80 drive-in sites in loops A-E with water and 30/50-amp electric (no sewer), 21 walk-in tent sites, 5 group sites. Reservations required for all sites from March 15, 2027.'},
    amen:{showers:true, flush:true, water:true, dump:true},
    fees:{nightlyMin:20, nightlyMax:30, note:'$30 loops A-E, $20 walk-in, $50 group.'},
    hi:['Largest Buffalo River campground, beside the lower river'], caut:['A and E Loops and walk-in sites F-U are first-come until the 2027 rule change.']
  });
  BF('ar-steel-creek-buffalo-river', 'Steel Creek Campground', 0, {
    types:['tent','walk-in','equestrian'], status:'open', src:['https://www.recreation.gov/camping/campgrounds/10001451'],
    book:{url:'https://www.recreation.gov/camping/campgrounds/10001451'},
    season:{open:'Year-round', close:null, note:'Reservations and water/flush toilets about mid-March to mid-November; free first-come outside that.'},
    sites:{hookups:'none', hookupNote:'26 tent-only walk-in sites plus horse sites (NPS says 14, Recreation.gov says 13: not settled).'},
    amen:{showers:false, flush:true, vault:true, water:true, cell:false}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 when reservations are required (NPS).'},
    hi:['Near Ponca, in the Upper District near the elk range'], caut:['Cell service is unreliable.']
  });
  BF('ar-kyles-landing-buffalo-river', 'Kyles Landing Campground', 0, {
    types:['tent','walk-in'], status:'open', sites:{total:33, hookups:'none', hookupNote:'33 walk-in tent-only sites.'},
    season:{open:'Year-round', close:null, note:'Water and flush toilets mid-March to mid-November; vault toilet in winter.'},
    amen:{showers:false, flush:true, vault:true, water:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20.'},
    caut:['Steep, rough access road: high-clearance 4WD strongly recommended.']
  });
  BF('ar-erbie-buffalo-river', 'Erbie Campground', 0, {
    types:['tent','rv','walk-in','group'], status:'open', sites:{total:26, hookups:'none', hookupNote:'13 drive-in, 13 walk-in tent sites and 5 group sites. No showers, hookups or dump station.'},
    amen:{showers:false, flush:true, vault:true, water:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 individual, $50 group.'}
  });
  BF('ar-ozark-buffalo-river', 'Ozark Campground', 0, {
    types:['tent','rv','walk-in'], status:'open', sites:{total:30, hookups:'none', hookupNote:'30 sites, some suited to primitive RVs. No showers, hookups or dump station.'},
    amen:{showers:false, flush:true, vault:true, water:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20; pavilion $25 per day.'}
  });
  BF('ar-carver-buffalo-river', 'Carver Campground', 0, {
    types:['tent','walk-in'], status:'open', sites:{total:8, hookups:'none', hookupNote:'8 walk-in tent sites; vault toilet only.'},
    amen:{showers:false, flush:false, vault:true, water:true}, fees:{nightlyMin:16, nightlyMax:16, note:'$16 when reservations are required.'}
  });
  BF('ar-tyler-bend-buffalo-river', 'Tyler Bend Campground', 0, {
    types:['tent','rv','walk-in','group'], status:'open', sites:{total:37, hookups:'none', hookupNote:'27 drive-in, 10 walk-in tent sites, 5 group sites (tent only). No hookups.'},
    amen:{showers:true, flush:true, water:true, dump:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 individual, $50 group.'},
    season:{open:'Year-round', close:null, note:'Water, showers and flush toilets year-round; dump station mid-March to mid-November.'}
  });
  BF('ar-spring-creek-buffalo-river', 'Spring Creek Campground', 0, {
    types:['tent'], status:'open', sites:{total:12, hookups:'none', hookupNote:'12 tent-only sites. No water or flush toilets; vault toilet in winter.'},
    amen:{showers:false, flush:false, vault:true, water:false}, fees:{nightlyMin:0, nightlyMax:0, note:'No fee (first come).'}, book:{system:'First come, first served', url:BUFF, phone:null, window:null},
    caut:['Vehicle launches at Spring Creek Landing are closed: watercraft must be hand-carried.']
  });
  BF('ar-rush-buffalo-river', 'Rush Campground', 0, {
    types:['tent','walk-in'], status:'open', sites:{total:12, hookups:'none', hookupNote:'12 walk-in tent sites; vault toilet only.'},
    amen:{showers:false, flush:false, vault:true, water:true}, fees:{nightlyMin:16, nightlyMax:16, note:'$16 when reservations are required.'},
    caut:['Access crosses Rush Creek and may close in high water.']
  });
  K('ar-gulpha-gorge-hot-springs', 'Gulpha Gorge Campground', 'Hot Springs National Park', NPS, 'AR', 'oklahoma-arkansas', 'Garland', {
    types:['tent','rv'], sites:{total:40, hookups:'full', hookupNote:'40 sites, none pull-through, with 30/50-amp electric, water and sewer. Max 8 people and 2 vehicles per site.'},
    fees:{nightlyMin:34, nightlyMax:34, note:'$34 per night.'},
    book:R('https://www.recreation.gov/', {window:'All sites require a reservation; accessible sites open one week ahead', phone:'501-620-6715'}),
    contact:{phone:'501-620-6715', url:'https://www.nps.gov/hosp/planyourvisit/campground.htm'},
    caut:['Season not stated on the page read.','Stay limit 14 days in a row, 30 per year.'],
    src:['https://www.nps.gov/hosp/planyourvisit/campground.htm']
  });

  /* ---------------- ARKANSAS: STATE PARKS (camping confirmed by arkansas.com list; details not read) ---------------- */
  var ARS = ['https://www.arkansas.com/state-parks/accommodations/camping','https://arkansas.com/state-parks/stay-in-a-park/camping'];
  function AR(id, name, note, o){
    o = o || {};
    K(id, name, name, 'Arkansas State Parks', 'AR', 'oklahoma-arkansas', null, {
      types:['tent','rv'], status:null, statusNote:note || null,
      fees:{note:'Site counts, hookups and nightly rate were not on the pages read: check Arkansas State Parks.'},
      book:{system:'Arkansas State Parks reservations', url:'https://reserve.arkansasstateparks.com', phone:'888-287-2757'},
      contact:{phone:'888-287-2757', email:'parks.info@arkansas.gov', url:'https://www.arkansas.com/state-parks/accommodations/camping'},
      hi:o.hi || [], caut:['The 888-287-2757 number is the Arkansas State Parks office (TD line), not the park itself.'], src:ARS
    });
  }
  AR('ar-petit-jean-state-park', 'Petit Jean State Park', null, {hi:['Cliff-edge sunrise views (per Arkansas tourism)']});
  AR('ar-devils-den-state-park', "Devil's Den State Park", null, {hi:['Hardwood-forest hiking (per Arkansas tourism)']});
  AR('ar-mount-magazine-state-park', 'Mount Magazine State Park', null, {hi:['Arkansas highest point, 2,753 ft (per Arkansas tourism)']});
  AR('ar-lake-ouachita-state-park', 'Lake Ouachita State Park', null, {hi:['On Arkansas largest lake (about 40,000 acres)']});
  AR('ar-crater-of-diamonds-state-park', 'Crater of Diamonds State Park', 'Camping confirmed only as listed by Arkansas tourism; no campground details read.', {});

  /* ---------------- OKLAHOMA ---------------- */
  var OKS = 'https://www.travelok.com/state_parks?page=2', OKB = {system:'Oklahoma State Parks reservations', url:'https://www.travelok.com/state-parks/campsites'};
  K('ok-beavers-bend-state-park', 'Beavers Bend State Park', 'Beavers Bend State Park', 'Oklahoma Tourism and Recreation', 'OK', 'oklahoma-arkansas', null, {
    types:['tent','rv','cabin'], fees:{note:'Rates, sites and hookups not read: check the Oklahoma State Parks link.'}, book:OKB,
    contact:{url:'https://www.travelok.com/state-parks/campsites'}, hi:['Tent and RV campgrounds; RV area under pine and hardwood trees'], src:[OKS]
  });
  K('ok-robbers-cave-state-park', 'Robbers Cave State Park', 'Robbers Cave State Park', 'Oklahoma Tourism and Recreation', 'OK', 'oklahoma-arkansas', 'Latimer', {
    lat:35.00278, lon:-95.34139, types:['tent','rv','equestrian','group','cabin'], fees:{note:'Rates and site counts not read: check the Oklahoma State Parks link.'}, book:OKB,
    contact:{url:'https://www.travelok.com/state-parks/campsites'}, hi:['RV, tent and equestrian sites, two group camps, cabins'],
    caut:['Coordinates are the park centre from Wikipedia, not the campground.'], src:['https://en.wikipedia.org/wiki/Robbers_Cave_State_Park',OKS]
  });
  K('ok-roman-nose-state-park', 'Roman Nose State Park', 'Roman Nose State Park', 'Oklahoma Tourism and Recreation', 'OK', 'oklahoma-arkansas', null, {
    types:['tent','rv','cabin'], fees:{note:'Rates not read: check the Oklahoma State Parks link.'}, book:OKB, contact:{url:'https://www.travelok.com/state-parks/campsites'},
    hi:['Tent and RV sites; teepees seasonally April-October'], caut:['Camping details come from a 2018 article and a state page that mentions only teepees: confirm current availability.'], src:[OKS,'https://www.okgazette.com/special-issues/summer-guide-explore-oklahomas-camping-grounds-3531461']
  });
  K('ok-turner-falls-park', 'Turner Falls Park', 'Turner Falls Park', null, 'OK', 'oklahoma-arkansas', 'Murray', {
    types:['tent','rv','cabin'], fees:{note:'Rates not read.'}, hi:['Camping, RV hookups and about a dozen cabins (2018 article)'],
    caut:['Pets are prohibited. Children 12 and under must wear a flotation device in the water. Source is a 2018 article: confirm with the park.'], src:['https://www.okgazette.com/special-issues/summer-guide-explore-oklahomas-camping-grounds-3531461']
  });

  /* ---------------- LOUISIANA ---------------- */
  var LAS = 'https://packyourtent.com/articles/la-state-parks';
  K('la-fontainebleau-state-park', 'Fontainebleau State Park', 'Fontainebleau State Park', 'Louisiana Office of State Parks', 'LA', 'louisiana', null, {
    types:['tent','rv','group'], sites:{hookups:'full', hookupNote:'The park page lists 23 premium, 103 improved (water and electric) and 37 unimproved sites; a Nov 2024 release says the campground (96 sites) was upgraded to full hookups. Counts conflict: check before relying on either.'},
    fees:{nightlyMin:18, nightlyMax:33, reservationFee:4.5, note:'Plus tax. Premium $25-33, improved $20-28 (cheaper Oct-Mar Sun-Thu), unimproved $18, primitive group $35-60. Reservation fee $4.50.'},
    book:{system:'Louisiana State Parks reservations', url:'https://www.lastateparks.com'}, contact:{url:'https://lastateparks.com/parks-preserves/fontainebleau-state-park', address:'62883 Hwy. 1089, Mandeville, LA 70448'},
    hi:['Lake Pontchartrain shore near New Orleans'], caut:['Park phone not on the page read.'],
    src:['https://lastateparks.com/parks-preserves/fontainebleau-state-park','https://www.lastateparks.com/press-release/full-hookup-campsites-now-available-at-fontainebleau-state-park']
  });
  function LA(id, name, hi){
    K(id, name, name, 'Louisiana Office of State Parks', 'LA', 'louisiana', null, {
      types:['tent','rv'], fees:{note:'Rates, sites and phone were not read: check lastateparks.com.'}, book:{system:'Louisiana State Parks reservations', url:'https://www.lastateparks.com'},
      contact:{url:'https://www.lastateparks.com'}, hi:hi, caut:['Details come from a third-party overview; confirm status and any hurricane damage with the park.'], src:[LAS]
    });
  }
  LA('la-chicot-state-park', 'Chicot State Park', ['Several loops, some on the water and some in pines']);
  LA('la-lake-fausse-pointe-state-park', 'Lake Fausse Pointe State Park', ['Well-spaced, mostly shaded sites']);
  LA('la-tickfaw-state-park', 'Tickfaw State Park', []);
  LA('la-bogue-chitto-state-park', 'Bogue Chitto State Park', []);
  LA('la-north-toledo-bend-state-park', 'North Toledo Bend State Park', ['Tiered sites on the bluff above the lake']);
  LA('la-lake-bistineau-state-park', 'Lake Bistineau State Park', ['Two camping areas']);
})();
