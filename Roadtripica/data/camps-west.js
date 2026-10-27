/* Campica data pack: Western US (UT, AZ, NV, CO, OR, WY, MT) plus a few eastern national-park favourites.
   Facts only from pages listed in SOURCES-camps-west.md. Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. lat/lon are null where no coordinate could be sourced
   (the builder session had no coordinate source it could read). Nightly fees are given only when an NPS page stated them. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service';
  var RG = 'recreation.gov';
  var RGPHONE = '877-444-6777';
  function K(id, name, parent, agency, state, region, county, o){
    o = o || {};
    var d = {
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
    };
    CAMPS.items.push(d);
  }
  function R(url, extra){ return mix({system:RG, url:url, phone:RGPHONE}, extra); }

  /* ---------------- UTAH ---------------- */
  K('ut-watchman-campground-zion', 'Watchman Campground', 'Zion National Park', NPS, 'UT', 'desert-southwest', 'Washington', {
    lat:37.1975, lon:-112.9873,
    season:{open:'Year-round', close:null, note:'The canyon shuttle normally runs about March to November.'},
    status:'open', statusNote:'Reservations are required and the park says sites are nearly always full mid-March to late November.',
    types:['tent','rv','group','walk-in'],
    sites:{total:184, rv:null, tent:null, maxRvFt:null, maxTrailerFt:null, hookups:'electric', hookupNote:'Loops A and B have 30-amp electric (a few 50-amp); no water or sewer hookups. Loops C and D (non-electric) do not take vehicles 19 ft and over. Generators are not allowed. Total 184 is the Recreation.gov/AAA listing count (176 reservable).'},
    amen:{showers:false, flush:true, vault:null, water:true, dump:true, store:null, wifi:null, firepit:true, bearBox:true, laundry:null, pets:'limited', ada:true, cell:null},
    fam:{swim:null, beach:null, playground:null, juniorRanger:true, rangerPrograms:true, nearTown:'Springdale, UT', kidNote:'Near the Zion Canyon visitor centre and pedestrian entrance, so families can reach the shuttle without driving. Pets are allowed only on the Pa\'rus Trail.'},
    fees:{note:'Nightly camping rate not read on any official page. A third-party listing showed roughly $35 to $130 depending on site type; confirm on Recreation.gov. Seniors and Access pass holders may get 50% off one site.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232445', {window:'6 months ahead for standard sites', cancelNote:'Recreation.gov states a $10 modification fee, a $10 cancellation fee if cancelled at least 2 nights ahead, and first night forfeited for later cancellations.'}),
    contact:{phone:'435-772-3256', url:'https://www.nps.gov/zion/planyourvisit/watchman-campground.htm', address:null},
    hi:['Near the visitor centre and shuttle stop','Food storage lockers at each site','Amphitheater for evening programs','Water fill and dump station at the entrance'],
    caut:['Sites are very hard to get from mid-March to late November: book at the 6-month mark.','Summer afternoons are often above 95 F with little shade.','Vehicles over 35 ft 9 in long or 11 ft 4 in tall cannot use the Zion-Mt. Carmel Highway and must enter by the South Entrance.'],
    src:['https://www.nps.gov/zion/planyourvisit/campgrounds-in-zion.htm','https://www.recreation.gov/camping/campgrounds/232445','https://www.aaa.com/tripcanvas/campground/watchman-campground-NPS2DEDB733_BCA8_41FF_8E0C_3E676DE620DF','https://thedyrt.com:443/camping/utah/utah-watchman']
  });
  K('ut-south-campground-zion', 'South Campground', 'Zion National Park', NPS, 'UT', 'desert-southwest', 'Washington', {
    season:{open:'Early March', close:'End of October', note:'Per Recreation.gov; the NPS page says it closes seasonally without dates.'},
    status:'seasonal',
    types:['tent','rv','walk-in'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists 124 sites (Loops A and B including walk-to sites); a dump station is available.'},
    amen:{showers:false, flush:true, vault:null, water:true, dump:true, store:null, wifi:null, firepit:null, bearBox:null, laundry:false, pets:'limited', ada:null, cell:null},
    fam:{juniorRanger:true, nearTown:'Springdale, UT', kidNote:'Beside the South Entrance. Expect bugs: the booking page warns of tent caterpillars in spring, ants in summer and yellowjackets in late summer.'},
    book:R('https://www.recreation.gov/camping/campgrounds/272266', {window:'Up to 14 days ahead', cancelNote:'Reservations that extend past the 14-day window cannot be altered (Recreation.gov).'}),
    contact:{phone:'435-772-3256', url:'https://www.nps.gov/zion/planyourvisit/south-campground.htm'},
    hi:['Next to the South Entrance','Only a 14-day booking window, so plan a few days out','Dump station and drinking water on site','Dogs are allowed only on the Pa\'rus Trail'],
    caut:['Generators only 8-10 am and 6-8 pm.','Hammocks are prohibited.','Fire restrictions can apply: check Current Conditions.','Photo ID of the primary occupant is required at check-in.'],
    src:['https://www.nps.gov/zion/planyourvisit/campgrounds-in-zion.htm','https://www.recreation.gov/camping/campgrounds/272266']
  });
  K('ut-lava-point-campground-zion', 'Lava Point Campground', 'Zion National Park', NPS, 'UT', 'desert-southwest', 'Washington', {
    season:{open:'May', close:'September', note:'Typically open May through September, as weather allows.'},
    status:'seasonal',
    types:['tent'],
    sites:{total:6, hookups:'none', hookupNote:'Six non-electric sites. Vehicles longer than 19 ft are not permitted on the road to the campground.'},
    amen:{showers:false, flush:false, vault:true, water:false, dump:false, pets:'limited', cell:null},
    fam:{juniorRanger:true, nearTown:null, kidNote:'A small, high-elevation camp on Kolob Terrace Road, about 1 hour 20 minutes from the South Entrance. Bring all your drinking water.'},
    book:R('https://www.recreation.gov/camping/campgrounds/10138237', {window:'Up to 14 days ahead (per NPS page)', firstComeNote:'Reservations are required.'}),
    contact:{phone:'435-772-3256', url:'https://www.nps.gov/zion/planyourvisit/lava-point-campground.htm'},
    hi:['Only six sites','Reached by a long drive up Kolob Terrace Road','Pit toilets only'],
    caut:['No drinking water at the campground.','Check Current Conditions for fire restrictions and road status.'],
    src:['https://www.nps.gov/zion/planyourvisit/campgrounds-in-zion.htm','https://www.recreation.gov/camping/campgrounds/10138237']
  });
  K('ut-north-campground-bryce-canyon', 'North Campground', 'Bryce Canyon National Park', NPS, 'UT', 'desert-southwest', 'Garfield', {
    season:{open:'Year-round', close:null, note:'Loop A is open all year; Loop B is seasonal (the 2026 page said it opens March 25).'},
    status:'open',
    types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists 98 sites; no electric, water or sewer hookups. Loops C and D are for tents and small camper vans.'},
    amen:{showers:true, flush:true, water:true, dump:false, store:true, laundry:true, pets:'limited', cell:null, firepit:null, vault:null, bearBox:null, wifi:null, ada:null},
    fam:{juniorRanger:true, rangerPrograms:null, nearTown:'Bryce Canyon City, UT', kidNote:'Showers and laundry are at the nearby general store in spring through fall. Dark Sky Park rules mean no string lights, so bring a headlamp for the night sky instead.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per site per night on the NPS fee table (2026). Seniors and Access pass holders may get 50% off; Annual and other passes do not.'},
    book:R('https://www.recreation.gov/camping/campgrounds/234058', {window:'Up to 6 months ahead', firstComeNote:'Check the NPS page for any first-come sites.'}),
    contact:{phone:'435-834-5322', url:'https://www.nps.gov/brca/planyourvisit/campgrounds.htm', address:null},
    hi:['Open all year','Close to the rim and the general store','Dark Sky Park: great stargazing'],
    caut:['The park says front-country campgrounds can fill by noon on summer weekends.','Dump station is seasonal (mid-May to mid-October); it was closed for the season when read.','Generators only in Loops A and B at set hours.'],
    src:['https://www.nps.gov/brca/planyourvisit/campgrounds.htm?fullweb=1','https://www.recreation.gov/camping/campgrounds/234058']
  });
  K('ut-sunset-campground-bryce-canyon', 'Sunset Campground', 'Bryce Canyon National Park', NPS, 'UT', 'desert-southwest', 'Garfield', {
    elev:8000,
    season:{open:'Spring (about mid-April to May)', close:'About mid-October', note:'The 2025-26 winter closure was Oct 12, 2025 to Apr 14, 2026; the NPS page lists Loop A opening Mar 25, 2026. Check the 2026-27 dates.'},
    status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists about 101 sites: Loop A for RVs (non-electric), Loops B and C tent only, plus one group site. No hookups.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, laundry:true, pets:'limited', firepit:true, cell:null, vault:null, bearBox:null, wifi:null, ada:true},
    fam:{juniorRanger:true, nearTown:'Bryce Canyon City, UT', kidNote:'Close to the main amphitheater area and rim viewpoints. Showers and laundry are at the general store in summer.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per site per night on the NPS fee table (2026). Seniors and Access pass holders may get 50% off.'},
    book:R('https://www.recreation.gov/camping/campgrounds/234079', {window:'Up to 14 days ahead (non-peak and peak)', firstComeNote:'Accessible sites can be taken first-come through the campground host.'}),
    contact:{phone:'435-834-5322', url:'https://www.nps.gov/brca/planyourvisit/campgrounds.htm'},
    hi:['Sits at about 8,000 ft','Gravel spurs with fire rings and grills','Free dump station for registered campers (mid-May to mid-October)'],
    caut:['Only a 14-day booking window: plan to check often.'],
    src:['https://www.nps.gov/brca/planyourvisit/campgrounds.htm?fullweb=1','https://www.recreation.gov/camping/campgrounds/234079?tab=info']
  });
  K('ut-devils-garden-campground-arches', 'Devils Garden Campground', 'Arches National Park', NPS, 'UT', 'desert-southwest', 'Grand', {
    season:{open:'Year-round', close:null, note:'Reservation-only March 1 to October 31; first-come, first-served November to February.'},
    status:'open',
    types:['tent','rv','group'],
    sites:{total:51, hookups:'none', hookupNote:'51 reservable sites including 2 group sites and 1 accessibility site. No hookups and no dump station in the park.'},
    amen:{showers:false, flush:true, water:true, dump:false, firepit:true, pets:null, ada:true, cell:null, vault:null, bearBox:null, store:null, wifi:null, laundry:false},
    fam:{juniorRanger:true, nearTown:'Moab, UT', kidNote:'Flush toilets and a campground host on site; no showers. Check the park page for Devils Garden trail details.'},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per night for an individual site (1-10 campers). Group sites $75-$160 (Canyon Wren) or $100-$250 (Juniper) depending on group size.'},
    book:R('https://www.recreation.gov/camping/campgrounds/234059', {window:'Reservations required Mar 1 - Oct 31 (exact window not read)', firstComeNote:'Nov 1 - Feb 28 first-come; use the Recreation.gov app Scan & Pay.'}),
    contact:{phone:'435-719-2299', url:'https://www.nps.gov/arches/planyourvisit/camping.htm'},
    hi:['Flush toilets and a campground host','Often full every night during the reservation season'],
    caut:['Stays are limited to 7 days per month and 14 days per year.','Generators only 8-10 am and 4-8 pm.','Firewood is not sold at the campground (coupon at the visitor centre).'],
    src:['https://www.nps.gov/arches/planyourvisit/camping.htm','https://www.recreation.gov/camping/campgrounds/234059','https://www.nps.gov/arch/planyourvisit/fees.htm']
  });
  K('ut-fruita-campground-capitol-reef', 'Fruita Campground', 'Capitol Reef National Park', NPS, 'UT', 'desert-southwest', 'Wayne', {
    season:{open:'Year-round', close:null, note:'Loops A and B open all year; Loop C March 1 to end of November.'},
    status:'open',
    types:['tent','rv'],
    sites:{total:71, hookups:'none', hookupNote:'71 sites; no hookups (electric only at three ADA sites for medical devices). Free dump and water fill for campers; otherwise $5.'},
    amen:{showers:false, flush:true, water:true, dump:true, firepit:true, pets:'limited', ada:true, cell:'none', vault:null, bearBox:null, store:null, wifi:null, laundry:false},
    fam:{juniorRanger:true, nearTown:'Torrey, UT', kidNote:'Set among the historic Fruita orchards. No showers and no cell coverage.'},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per night (NPS). Seniors and Access pass holders get 50% off.'},
    book:R('https://www.recreation.gov/camping/campgrounds/272245', {window:'6 months ahead', firstComeNote:'All sites must be reserved on Recreation.gov; cancelled sites can be booked even same day.'}),
    contact:{phone:'435-425-3791', url:'https://www.nps.gov/care/planyourvisit/fruitacampground.htm'},
    hi:['The only developed campground in the park','Beside the historic orchards','Flush toilets, no showers'],
    caut:['Often fills daily from spring through fall.','Generators only in certain loops and posted hours.','Pets must be leashed (6 ft) and are not allowed on trails.'],
    src:['https://home.nps.gov/care/planyourvisit/fruitacampground.htm','https://www.recreation.gov/camping/campgrounds/272245']
  });
  K('ut-willow-flat-campground-canyonlands', 'Island in the Sky (Willow Flat) Campground', 'Canyonlands National Park', NPS, 'UT', 'desert-southwest', null, {
    season:{open:'Year-round', close:null, note:null},
    status:'open', statusNote:'First-come, first-served; sites fill quickly spring through fall.',
    types:['tent','rv'],
    sites:{total:12, maxRvFt:28, hookups:'none', hookupNote:'12 sites with paved parking for vehicles up to 28 ft; one accessible site.'},
    amen:{showers:false, flush:false, vault:true, water:false, dump:false, firepit:true, pets:null, ada:true, cell:null, bearBox:null, store:null, wifi:null, laundry:false},
    fam:{juniorRanger:true, kidNote:'A small, dry camp with shade structures. Water is only outside the visitor centre in spring to fall, so bring plenty.'},
    fees:{nightlyMin:15, nightlyMax:15, note:'$15 per site per night (Recreation.gov listing). Self-register at the campground.'},
    book:{system:'first-come', url:'https://www.recreation.gov/camping/poi/247541', phone:null, window:null, firstComeNote:'No reservations; self-register at the campground.'},
    contact:{url:'https://www.nps.gov/cany/planyourvisit/camping.htm'},
    hi:['Only 12 sites','Inside the Island in the Sky district','Vault toilets and shade structures'],
    caut:['No water at the campground.','Arrive early: first-come sites fill by spring and fall weekends.'],
    src:['https://www.recreation.gov/camping/poi/247541']
  });
  K('ut-needles-campground-canyonlands', 'Needles District (Squaw Flat) Campground', 'Canyonlands National Park', NPS, 'UT', 'desert-southwest', null, {
    season:{open:null, close:null, note:'Loop B bookings open mid-March through mid-November.'},
    status:'seasonal',
    types:['tent','rv'],
    sites:{total:null, maxRvFt:28, hookups:'none', hookupNote:'Recreation.gov lists 25 sites (Loop A 14, Loop B 11); 28 ft maximum combined length; no hookups, showers or dump station.'},
    amen:{showers:false, flush:true, water:true, dump:false, pets:null, cell:'none', vault:null, bearBox:null, store:null, wifi:null, firepit:null, laundry:false, ada:true},
    fam:{juniorRanger:true, kidNote:'Remote, with no lights on roads or campsites, so arrive before dark.'},
    book:R('https://www.recreation.gov/camping/campgrounds/251535', {window:'Loop B: up to 6 months ahead', firstComeNote:'Loop A and the two ADA sites are first-come, first-served.'}),
    contact:{phone:'435-259-4711', url:'https://www.nps.gov/cany/planyourvisit/camping.htm'},
    hi:['Remote district, no cell coverage','Flush toilets and drinking water','Loop A is first-come'],
    caut:['No cell coverage.','Limited services in the district.','Best for tents and small self-contained campers.'],
    src:['https://www.recreation.gov/camping/campgrounds/251535']
  });

  /* ---------------- ARIZONA ---------------- */
  K('az-mather-campground-grand-canyon', 'Mather Campground', 'Grand Canyon National Park (South Rim)', NPS, 'AZ', 'desert-southwest', 'Coconino', {
    season:{open:'Year-round', close:null, note:'Peak season March 1 to November 30.'},
    status:'limited', statusNote:'Recreation.gov carried a water-restriction notice when read: restrooms, drinking water and showers were listed as unavailable with portable toilets provided. Check before travelling.',
    types:['tent','rv','group','equestrian'],
    sites:{total:327, maxRvFt:30, hookups:'none', hookupNote:'327 sites including 7 large group sites and 2 equine sites; no hookups. A dump and water-fill station is at nearby Camper Services.'},
    amen:{showers:null, flush:true, water:true, dump:true, firepit:true, pets:'yes', cell:null, vault:null, bearBox:null, store:null, wifi:null, laundry:null, ada:null},
    fam:{juniorRanger:true, nearTown:'Grand Canyon Village', kidNote:'In Grand Canyon Village. Pets must be leashed and never left alone, even in a vehicle.'},
    fees:{note:'Standard nightly rate not read. Recreation.gov gives a hiker/biker rate of $6 per person per night.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232490', {window:'6 months ahead', firstComeNote:'Same-day booking is possible online or via the call centre (877-444-6777).'}),
    contact:{phone:'928-638-7888', url:'https://www.nps.gov/grca/planyourvisit/cg-sr.htm'},
    hi:['327 sites in the village','Open all year','Fire ring and grate at each site'],
    caut:['Reserve ahead in peak season.','Check the water-restriction notice before booking.'],
    src:['https://www.recreation.gov/camping/campgrounds/232490','https://www.nps.gov/grca/planyourvisit/cg-sr.htm','https://www.nps.gov/grca/planyourvisit/camping.htm']
  });
  K('az-desert-view-campground-grand-canyon', 'Desert View Campground', 'Grand Canyon National Park (South Rim)', NPS, 'AZ', 'desert-southwest', 'Coconino', {
    season:{open:'About mid-April', close:'About mid-October', note:'NPS listed April 11 through October 18, 2026. Reservations required in season.'},
    status:'seasonal',
    types:['tent','rv'],
    sites:{total:50, maxRvFt:30, hookups:'none', hookupNote:'50 dry sites. Some sites do not accept vehicles over 19 ft. No showers, laundromat or dump station.'},
    amen:{showers:false, flush:true, water:true, dump:false, store:true, laundry:false, firepit:true, pets:'yes', cell:null, vault:null, bearBox:null, wifi:null, ada:true},
    fam:{juniorRanger:true, nearTown:null, kidNote:'On the east side of the South Rim, 26 miles from Mather, with a general store and gas nearby. Restrooms have flush toilets with no hot water.'},
    book:R('https://recreation.gov/camping/campgrounds/258825', {window:'Up to 6 months ahead (same-day booking available)'}),
    contact:{phone:'928-638-7081', url:'https://www.nps.gov/grca/planyourvisit/cg-sr.htm'},
    hi:['Small: only 50 sites','Store and gas station nearby'],
    caut:['Closes for the winter.','Combinations over 29 ft may struggle with turns.'],
    src:['https://recreation.gov/camping/campgrounds/258825','https://www.nps.gov/grca/planyourvisit/camping.htm']
  });
  K('az-north-rim-campground-grand-canyon', 'North Rim Campground', 'Grand Canyon National Park (North Rim)', NPS, 'AZ', 'desert-southwest', 'Coconino', {
    season:{open:'June 1 (2026)', close:'About October 15', note:'NPS listed the campground open through October 15; Recreation.gov showed a June 1, 2026 reopening.'},
    status:'seasonal', statusNote:'The 2026 season had likely ended when read (Oct 15). Showers and laundry were closed for 2026.',
    types:['tent','rv','group'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov listed 87 sites (72 standard, 12 tent-only, 3 group), all non-electric. No dump station and no gray/black water dumping. Per-site lengths are on the campground map.'},
    amen:{showers:false, flush:false, water:false, dump:false, store:true, pets:'yes', cell:null, vault:null, firepit:false, bearBox:null, wifi:null, laundry:false, ada:null},
    fam:{juniorRanger:true, kidNote:'There is no drinking water in camp (buy it at the General Store) and only portable toilets.'},
    book:R('https://recreation.gov/camping/campgrounds/232489', {window:null}),
    contact:{phone:'928-638-7814', url:'https://www.nps.gov/grca/planyourvisit/cg-nr.htm'},
    hi:['Pets allowed on the Bridle Path and Arizona Trail','Check-in noon, check-out 11 am'],
    caut:['Fires, including charcoal, were prohibited when read.','Generators only 7-9 am and 6-8 pm, not in the tent-only area.','Vehicles on Cape Royal Road, Widforss and North Kaibab trailheads are limited to 22 ft.'],
    src:['https://recreation.gov/camping/campgrounds/232489','https://www.nps.gov/grca/planyourvisit/camping.htm']
  });
  K('az-trailer-village-grand-canyon', 'Trailer Village RV Park', 'Grand Canyon National Park (South Rim)', NPS, 'AZ', 'desert-southwest', 'Coconino', {
    season:{open:'Year-round', close:null, note:null},
    status:'closed-check', statusNote:'The NPS page marked Trailer Village "closed due to water shortage" when read. Confirm before planning.',
    types:['rv'],
    sites:{hookups:null},
    contact:{phone:'928-638-7888', url:'https://www.nps.gov/grca/planyourvisit/camping.htm'},
    book:{system:null, url:'https://www.nps.gov/grca/planyourvisit/camping.htm'},
    hi:['The South Rim RV park with hookups'],
    caut:['Closure notice for water shortage when last read; hookup type, site count and rates not verified here.'],
    src:['https://www.nps.gov/grca/planyourvisit/camping.htm']
  });

  /* ---------------- NEVADA ---------------- */
  var GB_FEE = {nightlyMin:20, nightlyMax:20, note:'$20 per night at developed campgrounds; seniors and Access pass holders 50% off. Pay through Recreation.gov.'};
  var GB_CAUT = ['Unstaffed: save your reservation confirmation offline because cell service may not work.','No refunds for weather or within 24 hours of the first reservation day.','Pets are not allowed on trails.'];
  K('nv-lower-lehman-creek-campground-great-basin', 'Lower Lehman Creek Campground', 'Great Basin National Park', NPS, 'NV', 'desert-southwest', 'White Pine', {
    status:'seasonal', types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'The page says nine sites in one place but lists sites 1-20 elsewhere, so the count is unclear. A limited number of pull-through sites fit RVs and trailers.'},
    amen:{vault:true, water:false, pets:'limited', cell:'spotty', showers:null, flush:false, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Pit toilets and no drinking water.'},
    fees:GB_FEE, book:R('https://www.recreation.gov/camping/campgrounds/10101362', {window:'Not read'}),
    contact:{phone:'775-234-7331', url:'https://www.nps.gov/grba/planyourvisit/campgrounds.htm'},
    hi:['Generators allowed 8 am to 8 pm; quiet hours 8 pm to 8 am','Pit toilets near each site'], caut:GB_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/10101362','https://www.nps.gov/grba/planyourvisit/campgrounds.htm','https://www.nps.gov/grba/planyourvisit/fees.htm']
  });
  K('nv-upper-lehman-creek-campground-great-basin', 'Upper Lehman Creek Campground', 'Great Basin National Park', NPS, 'NV', 'desert-southwest', 'White Pine', {
    status:'seasonal', statusNote:'May close any time in fall because of snow (reservations are refunded).', types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists 23 non-electric sites (1-24 minus 19).'},
    amen:{vault:true, water:false, pets:'limited', cell:'spotty', showers:null, flush:false, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Vault toilets and no drinking water: bring all your water.'},
    fees:GB_FEE, book:R('https://www.recreation.gov/camping/campgrounds/10101374', {window:'Not read'}),
    contact:{phone:'775-234-7331', url:'https://www.nps.gov/grba/planyourvisit/campgrounds.htm'},
    hi:['Vault toilets','Check in by 11 am the day after arrival or the booking may be cancelled'], caut:GB_CAUT.concat(['No-shows forfeit the booking minus the first night and a $20 fee (Recreation.gov).']),
    src:['https://www.recreation.gov/camping/campgrounds/10101374','https://www.nps.gov/grba/planyourvisit/fees.htm']
  });
  K('nv-wheeler-peak-campground-great-basin', 'Wheeler Peak Campground', 'Great Basin National Park', NPS, 'NV', 'desert-southwest', 'White Pine', {
    season:{open:'Late June', close:'Labor Day weekend', note:'Reservations open late June through Labor Day weekend; winter weather can close it as early as September.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:null, maxRvFt:24, maxTrailerFt:24, hookups:'none', hookupNote:'Recreation.gov lists 36 non-electric sites (2-37). 24 ft limit for vehicles and towed units.'},
    amen:{vault:true, water:false, pets:'limited', cell:'spotty', showers:null, flush:false, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Nearly 10,000 ft, so allow time to acclimatise. No drinking water; do not wash dishes in creeks.'},
    fees:GB_FEE, book:R('https://www.recreation.gov/camping/campgrounds/10088563', {window:'Up to 30 days ahead'}),
    contact:{phone:'775-234-7331', url:'https://www.nps.gov/grba/planyourvisit/campgrounds.htm'},
    hi:['Highest campground in the park, nearly 10,000 ft','Trailheads to Wheeler Peak nearby'], caut:GB_CAUT.concat(['Winter weather can close it without notice.']),
    src:['https://www.recreation.gov/camping/campgrounds/10088563','https://www.nps.gov/grba/planyourvisit/fees.htm']
  });
  K('nv-baker-creek-campground-great-basin', 'Baker Creek Campground', 'Great Basin National Park', NPS, 'NV', 'desert-southwest', 'White Pine', {
    status:'seasonal', statusNote:'Summer months per Recreation.gov; the Grey Cliffs page calls it first-come, first-served and a water source.', types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists 37 sites (standard non-electric plus one RV).'},
    amen:{vault:true, water:false, pets:'limited', cell:'spotty', showers:null, flush:false, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'No potable water at the campground.'},
    fees:GB_FEE, book:R('https://www.recreation.gov/camping/campgrounds/10354639', {window:'Short window, exact days not read'}),
    contact:{phone:'775-234-7331', url:'https://www.nps.gov/grba/planyourvisit/campgrounds.htm'},
    hi:['Vault toilets','Generators 8 am - 8 pm only'], caut:GB_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/10354639','https://www.nps.gov/grba/planyourvisit/fees.htm']
  });
  K('nv-grey-cliffs-campground-great-basin', 'Grey Cliffs Campground', 'Great Basin National Park', NPS, 'NV', 'desert-southwest', 'White Pine', {
    season:{open:'Memorial Day', close:'September', note:'Reservations accepted from Memorial Day through September.'},
    status:'seasonal', types:['tent','group'],
    sites:{total:null, hookups:'none', hookupNote:'13 tent-only sites listed (Loop A 10, Loop C 3) plus group sites for 9-16 people; RVs and trailers are not permitted.'},
    amen:{vault:true, water:false, pets:'limited', cell:'spotty', showers:null, flush:false, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Tent-only camp with group sites. Bring water or fill up at Baker Creek or the Lehman Caves Visitor Center.'},
    fees:{nightlyMin:20, nightlyMax:30, note:'$20 per night individual; group sites (A5, C1, C2, up to 16 campers) $30 per night.'},
    book:R('https://www.recreation.gov/camping/campgrounds/251958', {window:'Not read'}),
    contact:{phone:'775-234-7331', url:'https://www.nps.gov/grba/planyourvisit/campgrounds.htm'},
    hi:['Tent only','Group sites for up to 16'], caut:GB_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/251958','https://www.nps.gov/grba/planyourvisit/fees.htm']
  });

  /* ---------------- COLORADO ---------------- */
  var RM_FEE = {nightlyMin:35, nightlyMax:55, note:'Summer 2026 rates per NPS: $35 standard non-electric, $55 standard electric; seniors and Access pass holders 50% off standard sites. Glacier Basin group sites $50/$60/$70.'};
  function RMBOOK(){ return {system:RG, url:'https://www.recreation.gov/gateways/2907', phone:RGPHONE, window:'6 months ahead; some sites released short-term', firstComeNote:'No in-person reservations. Moraine Park, Glacier Basin, Aspenglen and Timber Creek need advance reservations; Longs Peak is first-come.'}; }
  K('co-moraine-park-campground-rocky-mountain', 'Moraine Park Campground', 'Rocky Mountain National Park', NPS, 'CO', 'rockies', 'Larimer', {
    season:{open:null, close:null, note:'Open in winter (Oct 19 to mid-May) while the other campgrounds close. Summer 2027 dates TBD at last read.'},
    status:'seasonal', types:['tent','rv','group'],
    sites:{hookups:'some', hookupNote:'Electric sites exist (winter Loops B and C). No water hookups. Site count not read.'},
    amen:{pets:null, dump:null, cell:null, showers:null, flush:null, vault:null, water:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Winter dump and water service was described inconsistently on the NPS page: confirm before a winter trip.'},
    fees:RM_FEE, book:RMBOOK(),
    contact:{phone:'970-586-1206', url:'https://www.nps.gov/romo/planyourvisit/camping.htm'},
    hi:['The only RMNP campground open in winter','Electric sites available','Reserve on Recreation.gov'], caut:['Check mid-November for 2027 open dates.'],
    src:['https://www.nps.gov/romo/planyourvisit/camping.htm']
  });
  K('co-glacier-basin-campground-rocky-mountain', 'Glacier Basin Campground', 'Rocky Mountain National Park', NPS, 'CO', 'rockies', 'Larimer', {
    season:{open:null, close:null, note:'Summer 2027 dates TBD at last read.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{hookups:'none', hookupNote:'Site count not read. Summer group sites are available.'},
    amen:{pets:null, cell:null, showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Summer group sites make this a good choice for family meetups.'},
    fees:RM_FEE, book:RMBOOK(),
    contact:{phone:'970-586-1206', url:'https://www.nps.gov/romo/planyourvisit/camping.htm'},
    hi:['Group sites in summer ($50-$70)'], caut:['Check mid-November for 2027 open dates.'],
    src:['https://www.nps.gov/romo/planyourvisit/camping.htm']
  });
  K('co-aspenglen-campground-rocky-mountain', 'Aspenglen Campground', 'Rocky Mountain National Park', NPS, 'CO', 'rockies', 'Larimer', {
    season:{open:null, close:null, note:'Summer 2027 dates TBD at last read.'}, status:'seasonal', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Site count not read.'},
    amen:{pets:null, cell:null, showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:null},
    fees:RM_FEE, book:RMBOOK(),
    contact:{phone:'970-586-1206', url:'https://www.nps.gov/romo/planyourvisit/camping.htm'},
    hi:['Advance reservation required'], caut:['Check mid-November for 2027 open dates.'],
    src:['https://www.nps.gov/romo/planyourvisit/camping.htm']
  });
  K('co-timber-creek-campground-rocky-mountain', 'Timber Creek Campground', 'Rocky Mountain National Park', NPS, 'CO', 'rockies', 'Grand', {
    season:{open:null, close:null, note:'Summer 2027 dates TBD at last read.'}, status:'seasonal', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Site count not read.'},
    amen:{pets:null, cell:null, showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:null},
    fees:RM_FEE, book:RMBOOK(),
    contact:{phone:'970-586-1206', url:'https://www.nps.gov/romo/planyourvisit/camping.htm'},
    hi:['Advance reservation required'], caut:['Check mid-November for 2027 open dates.'],
    src:['https://www.nps.gov/romo/planyourvisit/camping.htm']
  });
  K('co-pinon-flats-campground-great-sand-dunes', 'Pinon Flats Campground', 'Great Sand Dunes National Park and Preserve', NPS, 'CO', 'rockies', 'Saguache', {
    season:{open:'April', close:'October', note:'Open April through October per NPS.'}, status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:88, hookups:'none', hookupNote:'88 individual sites plus 3 group sites. Some Loop 1 and 2 sites fit RVs/trailers up to 35 ft; individual site listings say "up to 25 ft", so check each site. No hookups.'},
    amen:{showers:false, water:true, dump:true, store:true, firepit:null, pets:'yes', cell:null, flush:null, vault:null, bearBox:null, wifi:null, laundry:null, ada:null},
    fam:{swim:null, beach:null, juniorRanger:true, rangerPrograms:null, nearTown:null, kidNote:'Outdoor rinse showers are at the Dunes Parking Lot in summer, and the camp store sells ice, firewood and snacks. Pets must stay leashed and attended.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night individual sites; group sites $80 (A and B) or $65 (C).'},
    book:R('https://www.recreation.gov/gateways/2738', {window:'Up to 3 months ahead', firstComeNote:'All sites are reserved through Recreation.gov.'}),
    contact:{phone:'719-378-6395', url:'https://www.nps.gov/grsa/planyourvisit/pinonflatscampground.htm'},
    hi:['Rinse showers at the Dunes lot in summer','Water spigots in all three loops','Campground store between Loops 1 and 2'], caut:['Showers are at the Dunes lot only in summer.'],
    src:['https://www.nps.gov/grsa/planyourvisit/pinonflatscampground.htm','https://www.recreation.gov/gateways/2738']
  });
  K('co-morefield-campground-mesa-verde', 'Morefield Campground', 'Mesa Verde National Park', NPS, 'CO', 'rockies', 'Montezuma', {
    status:'seasonal', types:['tent','rv'],
    sites:{hookups:'some', hookupNote:'15 full-hookup RV sites (reservations recommended). Total site count not read.'},
    amen:{showers:true, laundry:true, store:true, pets:null, cell:null, flush:null, vault:null, water:null, dump:null, wifi:null, firepit:null, bearBox:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Four miles inside the entrance. Morefield Village nearby has coin laundry, free showers, a gas station, grocery store and gift shop.'},
    book:{system:'other', url:'https://www.nps.gov/meve/planyourvisit/camping.htm', phone:null, window:null, firstComeNote:'Booking details not read (the NPS page did not load them).'},
    contact:{phone:'970-529-4465', url:'https://www.nps.gov/meve/planyourvisit/camping.htm'},
    fees:{note:'Rates and season not read: use the NPS page.'},
    hi:['15 full-hookup RV sites','Showers and laundry in nearby Morefield Village'], caut:['Fees, season and rules not verified.'],
    src:['https://www.nps.gov/meve/planyourvisit/eatingsleeping.htm','https://www.nps.gov/meve/planyourvisit/camping.htm']
  });

  /* ---------------- OREGON ---------------- */
  K('or-mazama-village-campground-crater-lake', 'Mazama Village Campground', 'Crater Lake National Park', NPS, 'OR', 'pacific-northwest', 'Klamath', {
    season:{open:'June', close:'Late September', note:'Typically June to late September; varies with snow.'}, status:'seasonal',
    types:['tent','rv'],
    sites:{total:214, hookups:'some', hookupNote:'214 tent and RV sites; some electric RV sites (five ADA RV sites, two with electric).'},
    amen:{showers:true, water:true, dump:true, store:true, pets:'limited', cell:null, flush:true, vault:null, bearBox:null, wifi:null, firepit:null, laundry:null, ada:true},
    fam:{juniorRanger:true, kidNote:'The largest campground in the park, with a camp store and showers. Pets must be leashed (6 ft) on paved areas and at campsites only.'},
    fees:{note:'Hiker/biker walk-in sites $5 per person. Standard rate not read. A park entrance fee applies.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/10337002', phone:'866-292-6720', window:null, cancelNote:'Cancellations within 72 hours of arrival may incur a late fee and are generally not refunded.'},
    contact:{phone:'541-594-3000', url:'https://www.nps.gov/crla/planyourvisit/mazama_campground.htm', address:'PO Box 7, Crater Lake, OR 97604'},
    hi:['214 sites, the park\'s largest campground','Free dump station for campers ($10 for others)','Showers in Loop F and at the camp store'], caut:['Fire restrictions can be imposed without notice.','Generators 8 am - 8 pm; quiet hours 10 pm - 7 am.'],
    src:['https://www.recreation.gov/camping/campgrounds/10337002','https://www.nps.gov/crla/planyourvisit/mazama_campground.htm']
  });

  /* ---------------- MONTANA: GLACIER ---------------- */
  var GL_PHONE = '406-888-7800';
  var GL_CAUT = ['Bear country: food, coolers, cookware and pet food must be in a closed hard-sided vehicle or the bear lockers when not in use.','Vehicles over 21 ft long or 8 ft wide are banned on Going-to-the-Sun Road between Sun Point and Avalanche.'];
  function GLB(url, win){ return R(url, {window:win||'Most sites 6 months ahead; some about 4 days ahead', firstComeNote:'All sites require a reservation.'}); }
  K('mt-apgar-campground-glacier', 'Apgar Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Flathead', {
    season:{open:'Year-round', close:null, note:null}, status:'limited', statusNote:'From Sept 30, 2026 it converts to primitive status with no water; only Loop B open (Recreation.gov alert).',
    types:['tent','rv','group'],
    sites:{total:194, hookups:'none', hookupNote:'194 sites, non-electric. Five group sites can be reserved.'},
    amen:{flush:true, water:true, bearBox:true, pets:null, showers:null, dump:null, firepit:true, cell:null, vault:null, store:null, wifi:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Fire rings only (no grates); two tents per site; hammocks must hang on non-vegetated areas with straps over 1 inch.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/10171274'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['194 sites','Flush toilets and water in season','14-day stay limit'], caut:GL_CAUT.concat(['Generators 8-10 am, noon-2 pm, 5-7 pm only.']),
    src:['https://www.recreation.gov/camping/campgrounds/10171274']
  });
  K('mt-fish-creek-campground-glacier', 'Fish Creek Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Flathead', {
    status:'seasonal', types:['tent','rv'],
    sites:{total:178, hookups:'none', hookupNote:'178 sites in Loops A-D; most non-electric, some tent-only in Loops C and D. Generators banned in Loop C.'},
    amen:{flush:true, water:true, bearBox:true, firepit:true, pets:null, showers:null, dump:null, cell:null, vault:null, store:null, wifi:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Fire rings only, no grates; max 14-day stay.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/232493'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['178 sites','Flush toilets and potable water'], caut:GL_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/232493']
  });
  K('mt-many-glacier-campground-glacier', 'Many Glacier Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Glacier', {
    status:'seasonal', types:['tent','rv','group'],
    sites:{total:null, hookups:'none', hookupNote:'Recreation.gov lists 103 sites (101 non-electric, one group). Most sites are very small and will not fit towed units over 21 ft; few fit 26-30 ft; many cannot take slide-outs.'},
    amen:{flush:true, water:true, dump:true, showers:false, bearBox:true, pets:null, cell:'none', vault:null, store:null, wifi:null, firepit:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Coin-operated showers are at Swiftcurrent Motor Inn within walking distance. No phone or cell coverage in camp; the nearest phone is in Babb, about 12 miles east.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/251869'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['Dump station at the entrance','Generator-free sites 48-59, 71, 86-102'], caut:GL_CAUT.concat(['Hike in groups, make noise and carry bear spray.','No cell coverage in or near the campground.']),
    src:['https://www.recreation.gov/camping/campgrounds/251869']
  });
  K('mt-st-mary-campground-glacier', 'St. Mary Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Glacier', {
    status:'limited', statusNote:'Alerts said it was in primitive status (no potable water, flush toilets and showers closed, vault toilet only) when read in Oct 2026. Aug 17 - Sep 11 booking is day-of only.',
    types:['tent','rv','group'],
    sites:{total:139, hookups:'none', hookupNote:'139 sites: Loop A 38, B 50, C 51; 14 tent-only; one group site. Generators only in Loops B and C.'},
    amen:{bearBox:true, pets:null, showers:null, flush:null, water:null, dump:false, cell:null, vault:true, store:null, wifi:null, firepit:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Loops are one-way: face the direction of travel.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/232492', 'Required; advance window not listed'),
    contact:{phone:'406-732-7708', url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['139 sites on three loops'], caut:GL_CAUT.concat(['Posted for bear frequenting. Do not throw food or garbage into vault toilets.']),
    src:['https://www.recreation.gov/camping/campgrounds/232492']
  });
  K('mt-two-medicine-campground-glacier', 'Two Medicine Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Glacier', {
    status:'closed-check', statusNote:'Closed throughout 2026 due to construction (Recreation.gov alert).',
    types:['tent','rv','group'],
    sites:{total:100, hookups:'none', hookupNote:'100 sites in Loops A-C; two tent-only; one group site. Generators prohibited in Loop A.'},
    amen:{flush:true, water:true, bearBox:true, cell:'none', wifi:false, pets:null, showers:null, dump:null, vault:null, store:null, firepit:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'No cell or Wi-Fi. Reopening date not stated: check before planning.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/258799'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['100 sites (closed for 2026)'], caut:GL_CAUT.concat(['Grizzly and black bears frequent the area.']),
    src:['https://www.recreation.gov/camping/campgrounds/258799']
  });
  K('mt-sprague-creek-campground-glacier', 'Sprague Creek Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Flathead', {
    status:'seasonal', types:['tent','rv'],
    sites:{total:21, maxRvFt:21, hookups:'none', hookupNote:'21 non-electric sites; vehicles up to 21 ft incl. bumpers and 8 ft wide; towed units of any size not allowed. Generators prohibited.'},
    amen:{flush:true, water:true, bearBox:true, firepit:true, pets:null, showers:null, dump:null, cell:null, vault:null, store:null, wifi:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Small camp: 21 sites, no towed units and no generators.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/258795'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['Only 21 sites','Quiet: generators prohibited'], caut:GL_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/258795']
  });
  K('mt-rising-sun-campground-glacier', 'Rising Sun Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Glacier', {
    season:{open:'Early June', close:'Early September', note:'Typical season per Recreation.gov.'}, status:'seasonal', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Recreation.gov lists 82 non-electric sites. Some sites are hard-sided vehicles only.'},
    amen:{flush:true, water:true, bearBox:true, pets:null, showers:null, dump:null, cell:null, vault:null, store:null, wifi:null, firepit:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Showers may be available for a fee at Rising Sun Motor Inn.'},
    book:GLB('https://www.recreation.gov/camping/campgrounds/10363618', 'Not stated'),
    contact:{phone:'406-732-7708', url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['Motor inn showers may be available for a fee'], caut:GL_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/10363618']
  });
  K('mt-avalanche-campground-glacier', 'Avalanche Campground', 'Glacier National Park', NPS, 'MT', 'northern-rockies', 'Flathead', {
    status:'seasonal', types:['tent','rv'],
    sites:{maxRvFt:26, hookups:'none', hookupNote:'Only 50 sites fit vehicles up to 26 ft. Non-electric. Total count not stated.'},
    amen:{flush:true, water:true, bearBox:true, firepit:true, pets:null, showers:null, dump:null, cell:null, vault:null, store:null, wifi:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:null},
    book:GLB('https://www.recreation.gov/camping/campgrounds/258796'),
    contact:{phone:GL_PHONE, url:'https://www.nps.gov/glac/planyourvisit/reservation-campgrounds.htm'},
    hi:['Fire rings only, no grates'], caut:GL_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/258796']
  });

  /* ---------------- WYOMING: GRAND TETON ---------------- */
  var GT_CAUT = ['Bear country: store food and attractants in the site bear box or a hard-sided vehicle.','Max stay 14 nights; 30 nights across all park campgrounds.'];
  function GTB(url, win){ return R(url, {window:win||null}); }
  K('wy-colter-bay-campground-grand-teton', 'Colter Bay Campground', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'Mid-May', close:'Late September', note:'Staffed to Oct 10, 2026, unstaffed after.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:338, hookups:'some', hookupNote:'338 individual sites plus 12 group and 10 hiker/biker; electric-only ADA sites; full hookups are at Colter Bay RV Park.'},
    amen:{flush:true, showers:true, laundry:true, water:true, dump:true, bearBox:true, firepit:true, pets:'yes', wifi:null, store:null, cell:null, vault:null, ada:true},
    fam:{juniorRanger:true, kidNote:'Free Wi-Fi at restaurants, shops and the launderette. Showers and laundry (fee) at the launderette; the marina was closed for 2026.'},
    fees:{note:'Rate not read; a utility (water/sewer) fee applies to all camping.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/258830'),
    contact:{phone:'307-543-2811', url:'https://www.recreation.gov/camping/campgrounds/258830'},
    hi:['338 individual sites, bear boxes at each site','Complimentary dump station'], caut:GT_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/258830']
  });
  K('wy-colter-bay-rv-park-grand-teton', 'Colter Bay RV Park', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'Early May', close:'Early October', note:null}, status:'seasonal', types:['rv'],
    sites:{total:112, maxRvFt:45, hookups:'full', hookupNote:'112 full-hookup sites (sewer, water, 20/30/50 amp); pull-through up to 45 ft, back-in up to 30 ft (RV plus tow vehicle).'},
    amen:{flush:true, showers:true, laundry:true, water:true, store:true, wifi:null, pets:'yes', cell:null, vault:null, dump:null, firepit:false, bearBox:null, ada:null},
    fam:{juniorRanger:true, kidNote:'No tent camping and no wood fires.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/258831'),
    contact:{phone:'307-543-2811', url:'https://www.recreation.gov/camping/campgrounds/258831'},
    hi:['Full hookups','Propane and grocery on site'], caut:['Generators not permitted.'],
    src:['https://www.recreation.gov/camping/campgrounds/258831']
  });
  K('wy-colter-bay-tent-village-grand-teton', 'Colter Bay Tent Village', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'Mid-May', close:'Early September', note:null}, status:'seasonal', types:['cabin'],
    sites:{total:66, hookups:'none', hookupNote:'66 tent cabins with four padded bunks, stove, fire pit and bear locker. No power or private bath; bedding not included.'},
    amen:{flush:true, showers:true, laundry:true, water:true, bearBox:true, pets:'yes', vault:null, dump:null, store:null, wifi:null, firepit:true, ada:null, cell:null},
    fam:{juniorRanger:true, kidNote:'A good "camping without a tent" option for families.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/10099575'),
    contact:{phone:'307-543-2811', url:'https://www.recreation.gov/camping/campgrounds/10099575'},
    hi:['66 tent cabins'], caut:GT_CAUT, src:['https://www.recreation.gov/camping/campgrounds/10099575']
  });
  K('wy-jenny-lake-campground-grand-teton', 'Jenny Lake Campground', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'Early May', close:'Late September', note:null}, status:'seasonal', types:['tent','walk-in'],
    sites:{total:51, maxRvFt:14, hookups:'none', hookupNote:'51 sites on two loops plus 10 hiker/biker. Tent only: no trailers or towables; vehicles at most 8 ft high and 14 ft long. Generators not allowed. Max stay 7 nights.'},
    amen:{flush:true, showers:true, water:true, bearBox:true, pets:'yes', vault:null, dump:null, store:null, wifi:null, firepit:null, laundry:null, ada:true, cell:null},
    fam:{juniorRanger:true, kidNote:'The page calls it very popular: book early. Tent only.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/247664'),
    contact:{phone:'307-543-2811', url:'https://www.recreation.gov/camping/campgrounds/247664'},
    hi:['Tent-only camp near Jenny Lake','Token-operated showers'], caut:GT_CAUT.slice(0,1).concat(['Max stay 7 nights.']),
    src:['https://www.recreation.gov/camping/campgrounds/247664']
  });
  K('wy-signal-mountain-campground-grand-teton', 'Signal Mountain Campground', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    status:'seasonal', statusNote:'Normally one of the first to open and last to close; late-season snow possible.', types:['tent','rv'],
    sites:{total:80, maxRvFt:30, hookups:'some', hookupNote:'80 sites; 24 with 30/50-amp electric.'},
    amen:{flush:true, showers:true, water:true, dump:true, bearBox:true, pets:'yes', vault:null, store:null, wifi:null, firepit:true, laundry:null, ada:null, cell:null},
    fam:{juniorRanger:true, kidNote:'Showers (tokens) at adjacent Signal Mountain Lodge.'},
    fees:{note:'Rate not read; a utility fee applies.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/247663', '6-month rolling plus up to 7 more days; same-day booking online'),
    contact:{phone:'307-543-2831', url:'https://www.recreation.gov/camping/campgrounds/247663'},
    hi:['80 sites','Dump station','No first-come sites'], caut:GT_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/247663']
  });
  K('wy-gros-ventre-campground-grand-teton', 'Gros Ventre Campground', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'Late April', close:'Early October', note:null}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:279, maxRvFt:45, hookups:'some', hookupNote:'279 individual sites, 4 group sites, 39 electric-only sites. 45 ft limit including tow vehicle.'},
    amen:{flush:true, showers:false, water:true, dump:true, bearBox:true, pets:'yes', vault:null, store:null, wifi:null, firepit:null, laundry:null, ada:true, cell:null},
    fam:{juniorRanger:true, kidNote:'Large, good for groups; no showers.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/247661'),
    contact:{phone:'307-543-2811', url:'https://www.recreation.gov/camping/campgrounds/247661'},
    hi:['Two dump stations','Food lockers at each site'], caut:GT_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/247661']
  });
  K('wy-lizard-creek-campground-grand-teton', 'Lizard Creek Campground', 'Grand Teton National Park', NPS, 'WY', 'northern-rockies', 'Teton', {
    status:'seasonal', statusNote:'Usually one of the last to open and first to close.', types:['tent','rv','walk-in'],
    sites:{total:60, maxRvFt:25, hookups:'none', hookupNote:'60 sites, about half walk-in tent sites; 25 ft limit. No boat ramp.'},
    amen:{flush:true, water:true, showers:false, bearBox:true, pets:'yes', vault:null, dump:null, store:null, wifi:null, firepit:true, laundry:null, ada:null, cell:null},
    fam:{juniorRanger:true, kidNote:'Showers are at Colter Bay, about 8 miles south.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/247785', '6-month rolling plus up to 7 more days'),
    contact:{phone:'307-543-2831', url:'https://www.recreation.gov/camping/campgrounds/247785'},
    hi:['North end of the park','Flush toilets in three comfort stations'], caut:GT_CAUT.concat(['Narrow roads: some sites are hard to back into.']),
    src:['https://www.recreation.gov/camping/campgrounds/247785']
  });
  K('wy-headwaters-campground-flagg-ranch', 'Headwaters Campground at Flagg Ranch', 'John D. Rockefeller Jr. Memorial Parkway (Grand Teton NP)', NPS, 'WY', 'northern-rockies', 'Teton', {
    season:{open:'June', close:'October', note:null}, status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:171, maxRvFt:45, hookups:'full', hookupNote:'34 tent sites, 97 full-hookup RV sites and 40 camper cabins; 45 ft including tow vehicle.'},
    amen:{flush:true, showers:true, water:true, bearBox:true, pets:null, vault:null, dump:null, store:null, wifi:null, firepit:null, laundry:null, ada:true, cell:'spotty'},
    fam:{juniorRanger:true, kidNote:'Camper cabins for families who prefer a roof.'},
    book:GTB('https://www.recreation.gov/camping/campgrounds/258832', '6-month rolling'),
    contact:{phone:'307-543-2861', url:'https://www.recreation.gov/camping/campgrounds/258832'},
    hi:['Between Grand Teton and Yellowstone','Food lockers at tent and RV sites'], caut:['Grassy Lake Road is narrow dirt and gravel, not for trailers.','Cell and internet limited.'],
    src:['https://www.recreation.gov/camping/campgrounds/258832']
  });

  /* ---------------- EAST ---------------- */
  K('md-assateague-island-campground', 'Assateague Island Campground (Oceanside and Bayside)', 'Assateague Island National Seashore', NPS, 'MD', 'east', 'Worcester', {
    season:{open:'Year-round', close:null, note:'Oceanside reservable Mar 15 - Nov 15; Bayside year-round.'}, status:'open', types:['tent','rv','group','walk-in','equestrian'],
    sites:{total:159, hookups:'none', hookupNote:'159 sites listed; no hookups. Oceanside walk-in sites are 100-200 ft from parking.'},
    amen:{showers:true, vault:true, water:true, dump:true, firepit:true, pets:'limited', cell:null, flush:false, store:null, wifi:null, bearBox:null, laundry:null, ada:null},
    fam:{beach:true, swim:true, juniorRanger:true, kidNote:'Seasonal cold-water rinse showers (mid-March to mid-November). Stay 40 ft from the wild horses and never feed them. Bring repellent and screen tents.'},
    fees:{nightlyMin:40, nightlyMax:40, note:'$40 per night Oceanside and Bayside drive-in and walk-in; horse camp $80. Entrance fee separate.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232507', {window:'6 months ahead'}),
    contact:{phone:'410-641-3030', url:'https://www.nps.gov/asis/planyourvisit/marylandcamping.htm'},
    hi:['Beach camping with wild horses','Bayside available year-round'], caut:['Store food in a hard-sided container or vehicle.','Pets are banned from lifeguarded beach in season.','Generators banned in Bayside Loop B and Oceanside walk-in.'],
    src:['https://www.nps.gov/asis/planyourvisit/marylandcamping.htm','https://www.nps.gov/asis/planyourvisit/campground-regulations.htm','https://www.recreation.gov/camping/campgrounds/232507']
  });
  var SM_CAUT = ['Bear habitat: keep food, coolers, scented items and water containers sealed in a vehicle or solid container.','Only heat-treated, certified firewood may be brought in.'];
  K('tn-cades-cove-campground-great-smoky', 'Cades Cove Campground', 'Great Smoky Mountains National Park', NPS, 'TN', 'east', 'Blount', {
    season:{open:'Year-round', close:null, note:'Off-season only sites C1-12 and C26-61 are open.'}, status:'open', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Site count not stated. Some accessible sites have 5-amp for medical equipment.'},
    amen:{flush:true, showers:false, water:true, pets:'limited', cell:null, vault:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:true},
    fam:{juniorRanger:true, bikeFriendly:true, kidNote:'Cades Cove Loop is closed to vehicles sunset Tuesday to sunrise Thursday from early May to late September (Vehicle Free Day), making it good for biking.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232488', {window:'6 months ahead'}),
    contact:{phone:'865-448-4103', url:'https://www.recreation.gov/camping/campgrounds/232488'},
    hi:['Open all year','Flush toilets'], caut:SM_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/232488']
  });
  K('tn-elkmont-campground-great-smoky', 'Elkmont Campground', 'Great Smoky Mountains National Park', NPS, 'TN', 'east', 'Sevier', {
    status:'seasonal', types:['tent','rv','walk-in'],
    sites:{total:220, hookups:'none', hookupNote:'200 tent/RV sites plus 20 walk-in tent sites. No hookups.'},
    amen:{flush:true, showers:false, water:true, dump:false, pets:'limited', cell:null, vault:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:true},
    fam:{juniorRanger:true, kidNote:'Heavily used in summer and October. TN or NC fishing licence needed to fish.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232487', {window:null}),
    contact:{phone:'865-430-5560', url:'https://www.recreation.gov/camping/campgrounds/232487'},
    hi:['200 tent/RV sites + 20 walk-in','Water spigots near restrooms'], caut:SM_CAUT.concat(['RVs and trailers cannot cross the Metcalf Bottoms bridge.']),
    src:['https://www.recreation.gov/camping/campgrounds/232487']
  });
  K('nc-smokemont-campground-great-smoky', 'Smokemont Campground', 'Great Smoky Mountains National Park', NPS, 'NC', 'east', 'Swain', {
    season:{open:'Year-round', close:null, note:null}, status:'open', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Listing count 142 (a snapshot). Loop F is RV only: no tents.'},
    amen:{flush:true, showers:false, water:true, pets:'limited', cell:null, vault:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:true},
    fam:{juniorRanger:true, kidNote:'US 441 may close for weather; refunds are not given for 441 closures.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232486', {window:'6 months ahead'}),
    contact:{phone:'828-497-9270', url:'https://www.recreation.gov/camping/campgrounds/232486'},
    hi:['Open all year'], caut:SM_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/232486']
  });
  K('nc-balsam-mountain-campground-great-smoky', 'Balsam Mountain Campground', 'Great Smoky Mountains National Park', NPS, 'NC', 'east', 'Swain', {
    elev:5310, status:'seasonal', types:['tent','rv'],
    sites:{total:42, hookups:'none', hookupNote:'42 sites; no showers or hookups. Vehicles over 25 ft and trailers restricted on Heintooga Round Bottom Road.'},
    amen:{flush:true, water:true, showers:false, pets:'limited', cell:'spotty', vault:null, dump:null, store:null, wifi:null, firepit:true, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Book before arriving: cell coverage is limited and you cannot reserve on site.'},
    book:R('https://www.recreation.gov/camping/campgrounds/273848', {window:null}),
    contact:{phone:'828-497-9270', url:'https://www.recreation.gov/camping/campgrounds/273848'},
    hi:['High-elevation (5,310 ft) camp'], caut:SM_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/273848']
  });
  K('tn-cosby-campground-great-smoky', 'Cosby Campground', 'Great Smoky Mountains National Park', NPS, 'TN', 'east', 'Cocke', {
    status:'seasonal', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Listing shows 157 non-electric sites (a snapshot). Reservation only: the office takes no cash.'},
    amen:{flush:true, water:true, pets:'limited', showers:null, cell:null, vault:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:null},
    book:R('https://www.recreation.gov/camping/campgrounds/232479', {window:'Same-day booking available; advance window not read'}),
    contact:{phone:'423-487-2683', url:'https://www.recreation.gov/camping/campgrounds/232479'},
    hi:['Reservation only'], caut:SM_CAUT,
    src:['https://www.recreation.gov/camping/campgrounds/232479']
  });
  var AC_BOOK = {system:RG, url:'https://www.recreation.gov/camping/gateways/2554', phone:RGPHONE, window:'90% of sites released 6 months ahead; the remaining 10% released on a rolling basis 14 days ahead', firstComeNote:'Reservations must be made in advance on Recreation.gov, not at the campground.'};
  K('me-blackwoods-campground-acadia', 'Blackwoods Campground', 'Acadia National Park', NPS, 'ME', 'east', 'Hancock', {
    status:'seasonal', types:['tent','rv'], sites:{hookups:null}, book:AC_BOOK,
    contact:{phone:'207-288-3338', url:'https://nps.gov/acad/planyourvisit/blackwoods-campground.htm'},
    fam:{juniorRanger:true, kidNote:'East side of Mount Desert Island. Details (sites, rates, season) not read: use the NPS page.'},
    hi:['East side of Mount Desert Island'], caut:[], src:['https://www.nps.gov/acad/planyourvisit/camping.htm']
  });
  K('me-seawall-campground-acadia', 'Seawall Campground', 'Acadia National Park', NPS, 'ME', 'east', 'Hancock', {
    status:'seasonal', types:['tent','rv'], sites:{hookups:null}, book:AC_BOOK,
    contact:{phone:'207-288-3338', url:'https://nps.gov/acad/planyourvisit/seawall-campground.htm'},
    fam:{juniorRanger:true, kidNote:'Details (sites, rates, season) not read: use the NPS page.'},
    hi:['West side of Mount Desert Island'], caut:[], src:['https://www.nps.gov/acad/planyourvisit/camping.htm']
  });
  K('me-schoodic-woods-campground-acadia', 'Schoodic Woods Campground', 'Acadia National Park', NPS, 'ME', 'east', 'Hancock', {
    status:'seasonal', types:['tent','rv'], sites:{hookups:null}, book:AC_BOOK,
    contact:{phone:'207-288-3338', url:'https://nps.gov/acad/planyourvisit/schoodic-woods-campground.htm'},
    fam:{juniorRanger:true, kidNote:'On the Schoodic Peninsula. Details not read.'},
    hi:['On the Schoodic Peninsula'], caut:[], src:['https://www.nps.gov/acad/planyourvisit/camping.htm']
  });
  K('me-duck-harbor-campground-acadia', 'Duck Harbor Campground', 'Acadia National Park (Isle au Haut)', NPS, 'ME', 'east', 'Knox', {
    status:'seasonal', types:['boat-in','tent'], sites:{hookups:'none'},
    amen:{water:false, cell:null, showers:null, flush:null, vault:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, pets:null, ada:null},
    book:{system:RG, url:'https://www.recreation.gov/camping/gateways/2554', phone:RGPHONE, window:'All reservations released 10 am April 1 for the entire season', firstComeNote:'Reservations required.'},
    contact:{phone:'207-288-3338', url:'https://www.nps.gov/acad/planyourvisit/duckharbor.htm'},
    fam:{juniorRanger:true, kidNote:'Reached only by mailboat from the mainland. There is no potable water: treat water or bring enough.'},
    hi:['Mailboat access only'], caut:['No potable water source.'], src:['https://www.nps.gov/acad/planyourvisit/camping.htm']
  });
})();
