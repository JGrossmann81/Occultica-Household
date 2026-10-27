/* Campica data pack: Arizona campgrounds (state parks, NPS, national forests).
   Facts only from pages listed in SOURCES-camps-az.md. Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. Fees come from the Arizona State Parks fee schedule, NPS or
   Forest Service pages only. Coordinates are park-level pins from official pages (null where none was read). */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', USFS = 'US Forest Service', ASP = 'Arizona State Parks and Trails';
  var RG = 'recreation.gov', RGPHONE = '877-444-6777';
  var SPPHONE = '877-697-2757';
  function K(id, name, parent, agency, county, o){
    o = o || {};
    var d = {
      id: id, name: name, parent: parent, agency: agency, state: 'AZ', region: 'arizona', county: county || null,
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
  var ASPBOOK = {system:'Arizona State Parks reservations', url:'https://azstateparks.com/reserve/', phone:SPPHONE};
  var FEES = 'https://azstateparks.com/fee-schedule';
  var NEAR = 'https://azstateparks.com/camping-near-me';
  var SPNOTE = ' State park rates are per site per night for one vehicle; each extra vehicle is $15; the park charges a $3.60 non-refundable reservation fee per site; a separate day-use entrance fee may apply (not confirmed here).';
  function SP(over){ return mix({nightlyMin:null, nightlyMax:null, extraVehicle:15, reservationFee:3.6}, over); }

  /* ---------------- ARIZONA STATE PARKS ---------------- */
  K('az-catalina-state-park', 'Catalina State Park Campground', 'Catalina State Park', ASP, 'Pima', {
    season:{open:'Year-round', close:null, note:'Ringtail overflow campground is open January 1 to March 31 only.'},
    status:'open', statusNote:'The park page said the restroom/shower building in Campground A was closed (Feb to spring 2026) for a new building; portable toilets provided and showers in Campground B stay open. Check before you go.',
    types:['tent','rv','group','equestrian'],
    sites:{total:120, maxRvFt:null, hookups:'electric+water', hookupNote:'120 electric (20/30/50 amp) and water sites in Campgrounds A and B; Ringtail overflow is non-electric with no water. The park page states no limit on RV length.'},
    amen:{showers:true, flush:true, dump:true, firepit:true, water:true, vault:null, bearBox:null, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null},
    fam:{easyTrails:true, nearTown:'Tucson', kidNote:'Paved roads and parking pads; each site has a table and BBQ grill. Wood fires are prohibited (charcoal, fire logs or propane only).'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$50 per night with hook-ups; $25 for the Equestrian Center camping and for Ringtail overflow (Jan 1 to Mar 31).'+SPNOTE}),
    book:mix(ASPBOOK, {window:null, firstComeNote:'Reservation limit is 14 consecutive nights. Check-in 2 p.m., check-out noon.'}),
    contact:{phone:SPPHONE, url:'https://azstateparks.com/catalina/camping-and-rvs'},
    hi:['120 electric and water sites','RV dump station in the park','Equestrian camping with horse stalls'],
    caut:['Campground A restrooms were under replacement when read: check status.','Wood-burning fires are not allowed.'],
    src:[FEES,'https://azstateparks.com/catalina/camping-and-rvs/rv-and-tent-camping','https://azstateparks.com/catalina']
  });
  K('az-lost-dutchman-state-park', 'Lost Dutchman State Park Campground', 'Lost Dutchman State Park', ASP, 'Pinal', {
    lat:33.4630458, lon:-111.4806317,
    season:{open:'Year-round', close:null, note:null}, status:'open',
    types:['tent','rv','cabin','walk-in'],
    sites:{total:134, hookups:'electric', hookupNote:'134 sites per the park page. The fee schedule lists electric, non-electric and rustic hike-in sites; hook-up details by site were not read.'},
    amen:{firepit:true, showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{easyTrails:true, nearTown:'Apache Junction', kidNote:'Each site has a picnic table, barbecue grill and fire pit. Air-conditioned rustic cabins are also offered.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$50 electric, $35 non-electric, $25 rustic hike-in; cabins $99 standard rate; overnight parking $5.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/lost-dutchman'},
    hi:['Superstition Mountains setting','Cabins and walk-in sites as well as RV sites'],
    caut:['Coordinates are the park-level pin from the state page.'],
    src:[FEES,'https://azstateparks.com/lost-dutchman',NEAR]
  });
  K('az-kartchner-caverns-state-park', 'Kartchner Caverns State Park Campground', 'Kartchner Caverns State Park', ASP, 'Cochise', {
    season:{open:'Year-round', close:null, note:null}, status:null,
    types:['rv','tent','cabin','group'],
    sites:{total:null, hookups:'electric+water', hookupNote:'An older third-party page (DesertUSA) listed 62 water-and-electric sites and no size limits; that was not confirmed on a current state page, so the count is left blank.'},
    fam:{rangerPrograms:true, nearTown:'Benson', kidNote:'Park entrance fee is waived with a campsite reservation (per the park page). Cave tours are booked separately.'},
    fees:SP({nightlyMin:50, nightlyMax:50, note:'$50 per night with hook-ups; cabins $129; group camping $175 (up to 25 people) or $275 (26 to 50); additional parking $15.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'520-586-4100', url:'https://azstateparks.com/kartchner', address:'2980 S Hwy 90, Benson, AZ 85602'},
    hi:['Cave tours in the park','Cabins available'],
    caut:['Cave tours need their own reservation.'],
    src:[FEES,'https://azstateparks.com/kartchner','https://azstateparks.com/kartchner/events/cave-week','https://www.desertusa.com/azkartchner/camp.html']
  });
  K('az-dead-horse-ranch-state-park', 'Dead Horse Ranch State Park Campground', 'Dead Horse Ranch State Park', ASP, 'Yavapai', {
    lat:34.7537237, lon:-112.0215606,
    season:{open:'Year-round', close:null, note:'Gates close at dark; seasonal hours may apply.'}, status:'open',
    types:['tent','rv','cabin'],
    sites:{total:null, hookups:'electric', hookupNote:'Site counts and hook-up types by loop were not read (the camping subpage was not reachable).'},
    fam:{fishing:true, easyTrails:true, nearTown:'Cottonwood', kidNote:'Eight river-adjacent log cabins; lagoons and Verde River for fishing and wildlife watching.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$25 non-electric/tent, $50 electric, $70 cabins. Park entrance fee listed on the park page: $10 per vehicle with 1 person, $20 with 2 to 4.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'928-634-5283', url:'https://azstateparks.com/dead-horse', address:'675 Dead Horse Ranch Road, Cottonwood, AZ 86326'},
    hi:['Verde River and lagoons','Log cabins by the river'],
    caut:[],
    src:[FEES,'https://azstateparks.com/dead-horse',NEAR]
  });
  K('az-patagonia-lake-state-park', 'Patagonia Lake State Park Campground', 'Patagonia Lake State Park', ASP, 'Santa Cruz', {
    lat:31.488333, lon:-110.85381,
    season:{open:'Year-round', close:null, note:'Gate closed 10 p.m. to 4 a.m.'}, status:null,
    types:['tent','rv','cabin','walk-in'],
    sites:{total:null, hookups:'electric+water', hookupNote:'The park page says "over 100 sites" including boat-in sites and RV hook-ups; no exact count read.'},
    amen:{store:true, firepit:null, showers:null, flush:null, vault:null, water:null, dump:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{swim:true, beach:true, fishing:true, boating:true, nearTown:'Nogales', kidNote:'Beach near the campground, marina and boat rentals, rainbow trout stocked regularly. On busy weekends day use can close at capacity, so call ahead.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$25 non-electric and boat-in; $50 electric and water; overnight parking $5; cabins $129 standard.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'520-287-6965', url:'https://azstateparks.com/patagonia-lake', address:'400 Patagonia Lake Rd, Nogales, AZ 85621'},
    hi:['Lake beach and boat ramps','Boat-in sites','Birding at Sonoita Creek'],
    caut:['Weekend day-use closures at capacity can affect access.'],
    src:[FEES,'https://azstateparks.com/patagonia-lake',NEAR]
  });
  K('az-lake-havasu-state-park', 'Lake Havasu State Park Campground', 'Lake Havasu State Park', ASP, 'Mohave', {
    lat:34.492334, lon:-114.3599939,
    season:{open:'Year-round', close:null, note:'Park is open 24 hours. Visitor center hours change seasonally.'}, status:'open',
    types:['tent','rv','cabin'],
    sites:{total:null, hookups:'electric+water', hookupNote:'Counts were not read. Most sites take RVs or tents; water comes with a campground reservation.'},
    amen:{showers:true, flush:true, dump:true, firepit:true, water:true, pets:'limited', vault:null, store:null, wifi:null, laundry:null, ada:null, cell:null, bearBox:null},
    fam:{swim:true, beach:true, fishing:true, boating:true, nearTown:'Lake Havasu City', kidNote:'Picnic table, fire ring and shade ramada at most sites. Pets on leash; not allowed on beaches. No glass containers on beaches.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$50 with hook-ups; $25 overflow camping; $40 for an RV site in the cabin loop (includes dump station); cabins $139 standard; dump station for non-campers $20; overnight parking $10.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'928-855-2784', url:'https://azstateparks.com/lake-havasu', address:'699 London Bridge Road, Lake Havasu City, AZ 86403'},
    hi:['Lake beaches','Showers for registered campers'],
    caut:[],
    src:[FEES,'https://azstateparks.com/lake-havasu/explore/facility-information',NEAR]
  });
  K('az-fool-hollow-lake', 'Fool Hollow Lake Campground', 'Fool Hollow Lake Recreation Area', ASP, 'Navajo', {
    lat:34.2687048, lon:-110.0741088,
    season:{open:'Year-round', close:null, note:'Gate 7 a.m. to 8 p.m. Nov to Mar; 5 a.m. to 8 p.m. Apr to Oct.'}, status:'open',
    types:['tent','rv','group'],
    sites:{total:99, tent:20, rv:62, maxRvFt:40, hookups:'electric+water', hookupNote:'20 tent-only sites; 62 RV sites with 30-amp electric (some 50-amp) and water; 17 group sites (10 RV, 7 tent). Sewer only at Mallard and Redhead loops. Total 99 is the sum of those counts.'},
    amen:{showers:true, firepit:true, water:true, flush:null, vault:null, dump:null, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{fishing:true, boating:true, nearTown:'Show Low', kidNote:'150-acre lake with trout, walleye, bass and pike. Winter snow is possible at this elevation.'},
    fees:SP({nightlyMin:25, nightlyMax:75, note:'$25 non-electric; $50 with hook-ups; $75 oversize sites; ramada reservation $15 non-refundable.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'928-537-3680', url:'https://azstateparks.com/fool-hollow', address:'1500 N. Fool Hollow Lake, Show Low, AZ 85901'},
    hi:['Open all year','Lakeside RV sites','Tent sites on concrete pads'],
    caut:['Cold nights and snow in winter.'],
    src:[FEES,'https://azstateparks.com/fool-hollow/camping-and-rvs/camping-at-fool-hollow-lake',NEAR]
  });
  K('az-roper-lake-state-park', 'Roper Lake State Park Campground', 'Roper Lake State Park', ASP, 'Graham', {
    season:{open:'Year-round', close:null, note:'Entrance gate closes nightly at 9 p.m.'}, status:null,
    types:['tent','rv','cabin','group'],
    sites:{total:null, maxRvFt:45, hookups:'electric+water', hookupNote:'Hacienda: 20 water-and-electric sites (20/30 amp), pull-through and back-in. Cottonwood: 25 water-and-electric sites (20/30/50 amp), back-in. Gila: 8 cabins, 5 non-electric sites and a 14-site group camp. Max length about 45 ft.'},
    amen:{showers:true, dump:true, water:true, wifi:false, flush:null, vault:null, store:null, firepit:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{fishing:true, nearTown:'Safford', kidNote:'Dump station is for registered campers only. Check-in 2 p.m., check-out noon. Hot tub is permanently closed.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$25 non-electric; $30 water only; $50 electric; cabin $129; group site $180.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/roper-lake/camping-and-cabins/campsites'},
    hi:['Hot showers at Hacienda and Cottonwood','Cabins and group camp'],
    caut:[],
    src:[FEES,'https://azstateparks.com/roper-lake/camping-and-cabins/campsites']
  });
  K('az-lyman-lake-state-park', 'Lyman Lake State Park Campground', 'Lyman Lake State Park', ASP, 'Apache', {
    lat:34.3567407, lon:-109.3773027,
    season:{open:'Year-round', close:null, note:'Open 24 hours. The tourism page suggests late March through November depending on snow.'}, status:'limited',
    statusNote:'When read, the park said there was no drinking water at the park, boat ramps were closed for low water and harmful algal blooms were possible in the lake. Check before going.',
    types:['tent','rv','cabin','group'],
    sites:{total:56, hookups:'electric+water', hookupNote:'56 sites: 38 with hook-ups (13 with sewer) and 18 without. The page says there is no RV length limit.'},
    amen:{showers:true, flush:true, store:true, water:false, dump:null, vault:null, wifi:null, firepit:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{fishing:true, boating:true, easyTrails:true, nearTown:'St. Johns', kidNote:'Petroglyph Trail nearby. Check algal bloom and water notices before letting kids or pets in the lake.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$25 non-electric; $50 with hook-ups; cabins $80; Lake House group site $125 facility fee.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:'928-337-4441', url:'https://azstateparks.com/lyman-lake/camping-and-cabins/rv-tent-camping', address:'P.O. Box 1428, St. Johns, AZ 85936 (11 miles south of St. Johns on US 191)'},
    hi:['Lake with petroglyph trail','Cabins available'],
    caut:['No drinking water at the park when read: bring your own.','Possible algal blooms.'],
    src:[FEES,'https://azstateparks.com/lyman-lake/camping-and-cabins/rv-tent-camping',NEAR]
  });
  K('az-alamo-lake-state-park', 'Alamo Lake State Park Campground', 'Alamo Lake State Park', ASP, 'La Paz', {
    lat:34.2419122, lon:-113.573311,
    season:{open:'Year-round', close:null, note:null}, status:null,
    types:['tent','rv','cabin'],
    sites:{total:null, hookups:'electric+water+sewer', hookupNote:'Fee schedule lists water/electric/sewer, water/electric and non-electric sites; counts were not read.'},
    fam:{fishing:true, boating:true, nearTown:null, kidNote:'Bass fishing; four air-conditioned cabins per the state tourism page.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$50 water, electric and sewer; $40 water and electric; $25 non-electric; cabins $85.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/alamo-lake', address:'Wenden, AZ 85357'},
    hi:['Remote lake with bass fishing','Off-highway vehicle trails nearby'],
    caut:['Remote: bring water and supplies.'],
    src:[FEES,NEAR]
  });
  K('az-buckskin-mountain-state-park', 'Buckskin Mountain State Park Campground', 'Buckskin Mountain State Park', ASP, 'La Paz', {
    season:{open:'Year-round', close:null, note:'Described as a mild winter camping destination.'}, status:null,
    types:['tent','rv'],
    sites:{total:null, hookups:'electric', hookupNote:'Counts not read.'},
    fam:{swim:true, beach:true, fishing:true, nearTown:'Parker', kidNote:'River beach; bass and catfish fishing; trails link to River Island State Park.'},
    fees:SP({nightlyMin:35, nightlyMax:50, note:'$50 with hook-ups; $35 non-electric riverfront.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/colorado-river-camping'},
    hi:['Colorado River beach','Riverfront non-electric sites'],
    caut:[],
    src:[FEES,'https://azstateparks.com/colorado-river-camping']
  });
  K('az-cattail-cove-state-park', 'Cattail Cove State Park Campground', 'Cattail Cove State Park', ASP, 'Mohave', {
    lat:34.3515143, lon:-114.1697365,
    season:{open:'Year-round', close:null, note:'Promoted as a wintertime destination.'}, status:null,
    types:['tent','rv'],
    sites:{total:null, hookups:'electric', hookupNote:'Hook-up sites, primitive sites and boat-in sites are offered; counts were not read.'},
    fam:{swim:true, beach:true, fishing:true, boating:true, nearTown:'Lake Havasu City', kidNote:'White sand beach; kayak and paddleboard rentals; about 20 minutes from Lake Havasu City.'},
    fees:SP({nightlyMin:25, nightlyMax:50, note:'$50 with hook-ups; $25 boat-in site (overnight parking for boat-in sites $5).'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/cattail-cove'},
    hi:['Beach on Lake Havasu','Boat-in campsites'],
    caut:[],
    src:[FEES,NEAR,'https://azstateparks.com/colorado-river-camping']
  });
  K('az-river-island-state-park', 'River Island State Park Campground', 'River Island State Park', ASP, 'La Paz', {
    lat:34.2541496, lon:-114.1381799,
    season:{open:'Year-round', close:null, note:null}, status:null,
    types:['tent','rv'],
    sites:{total:37, hookups:'electric', hookupNote:'37 campsites for tent and RV; eight are at the river edge.'},
    fam:{swim:true, beach:true, fishing:true, boating:true, nearTown:'Parker', kidNote:'Protected river cove beach; trails connect to Buckskin Mountain State Park.'},
    fees:SP({nightlyMin:50, nightlyMax:50, note:'$50 with hook-ups.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/river-island'},
    hi:['Riverfront sites','Quiet cove beach'],
    caut:[],
    src:[FEES,NEAR]
  });
  K('az-picacho-peak-state-park', 'Picacho Peak State Park Campground', 'Picacho Peak State Park', ASP, 'Pinal', {
    season:{open:'Year-round', close:null, note:null}, status:null,
    types:['rv','tent','group'],
    sites:{total:null, hookups:'electric', hookupNote:'Counts not read.'},
    fees:SP({nightlyMin:50, nightlyMax:50, note:'$50 electric; group area camping (non-electric) $20 to $40.'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/picacho'},
    hi:['Between Tucson and Phoenix off I-10'],
    caut:['Only the fee schedule was read for this park; confirm details on the park page.'],
    src:[FEES]
  });
  K('az-homolovi-state-park', 'Homolovi State Park Campground', 'Homolovi State Park', ASP, 'Navajo', {
    lat:35.0464771, lon:-110.6527338,
    season:{open:'Year-round', close:null, note:null}, status:null,
    types:['tent','rv'],
    sites:{total:null, hookups:'electric', hookupNote:'The state tourism page says "over 50 sites" with hook-ups or primitive options.'},
    fam:{rangerPrograms:true, nearTown:'Winslow', kidNote:'Visitor center with archaeology exhibits; monthly star parties April to November per the state page.'},
    fees:SP({nightlyMin:25, nightlyMax:40, note:'Non-electric $25 (Nov 15 to Apr 14) or $30 (Apr 15 to Nov 14); electric $40 (Nov 15 to Mar 14) or $35 (Mar 15 to Nov 14).'+SPNOTE}),
    book:ASPBOOK,
    contact:{phone:SPPHONE, url:'https://azstateparks.com/homolovi'},
    hi:['Archaeology visitor center','Dark skies'],
    caut:[],
    src:[FEES,NEAR]
  });

  /* ---------------- NATIONAL PARK SERVICE ---------------- */
  K('az-twin-peaks-organ-pipe', 'Twin Peaks Campground', 'Organ Pipe Cactus National Monument', NPS, 'Pima', {
    season:{open:'Year-round', close:null, note:'Busy season is December through April, when it fills quickly. The park page gave no closure dates.'}, status:'open',
    types:['tent','rv','group'],
    sites:{total:208, tent:34, rv:174, maxRvFt:45, hookups:'none', hookupNote:'34 tent-only and 174 RV sites; four sites fit RVs up to 45 ft. No hook-ups. Generators allowed 8 to 10 a.m. and 4 to 6 p.m. in sites 1 to 112; never in sites 113 to 208. Four group sites hold 18 to 45 people.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:null, vault:null, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{juniorRanger:null, nearTown:'Ajo', kidNote:'Three restrooms have free solar-heated showers. Each site has a table and grill.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night; 50% off with Senior or Access pass. Group sites $50 per night. Park entrance is a separate $25 per vehicle (7 days).'},
    book:R('https://www.recreation.gov/camping/campgrounds/', {url:'https://www.nps.gov/orpi/planyourvisit/twin-peaks.htm', window:'Up to 6 months ahead, or same day', firstComeNote:null}),
    contact:{phone:'520-387-6849', url:'https://www.nps.gov/orpi/planyourvisit/twin-peaks.htm', address:'10 Organ Pipe Drive, Ajo, AZ 85321 (mailing)'},
    hi:['Sonoran Desert, flush toilets and showers','Dump and fill station','Dark-sky park setting'],
    caut:['Summer is extremely hot.','Check border-area advisories on the park site before travel.'],
    src:['https://www.nps.gov/orpi/planyourvisit/twin-peaks.htm','https://nps.gov/orpi/planyourvisit/camping.htm']
  });
  K('az-alamo-canyon-organ-pipe', 'Alamo Canyon Campground', 'Organ Pipe Cactus National Monument', NPS, 'Pima', {
    season:{open:null, close:null, note:'Season not stated on the page.'}, status:null,
    types:['tent','walk-in'],
    sites:{total:4, rv:0, tent:4, hookups:'none', hookupNote:'Four tent-only sites. No RVs, motorhomes or trailers. Access is a three-mile graded dirt road from Hwy 85 milepost 65.5 (no highway sign), suitable for cars.'},
    amen:{vault:true, water:false, firepit:false, flush:false, showers:false, dump:false, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{kidNote:'Primitive: no water. Fires of any kind and generators are prohibited. Max 7 nights, 5 people and 2 vehicles per site.'},
    fees:{nightlyMin:16, nightlyMax:16, note:'$16 per night; 50% off with Senior or Access pass. Park entrance ($25 per vehicle, 7 days) is separate.'},
    book:R('https://www.nps.gov/orpi/planyourvisit/alamo-canyon.htm', {window:'Up to 6 months ahead, or same day'}),
    contact:{phone:'520-387-6849', url:'https://www.nps.gov/orpi/planyourvisit/alamo-canyon.htm'},
    hi:['Quiet primitive tent camping','Charcoal grills and tables'],
    caut:['Bring all your water.','No fires, no generators.'],
    src:['https://www.nps.gov/orpi/planyourvisit/alamo-canyon.htm','https://nps.gov/orpi/planyourvisit/camping.htm']
  });
  K('az-bonita-canyon-chiricahua', 'Bonita Canyon Campground', 'Chiricahua National Park', NPS, 'Cochise', {
    season:{open:null, close:null, note:'Busy in March, April, October and holidays. Fire restrictions common April to July; monsoon flooding can close sites June to September; snow and freezing temperatures possible November to March.'}, status:null,
    types:['tent','rv','group'],
    sites:{total:26, maxRvFt:29, hookups:'none', hookupNote:'Sites 1 to 25 are standard non-electric; site 26 is a group tent area (9 to 24 people). Vehicles and trailers up to 29 ft; the scenic drive is limited to 24 ft. Only a few sites suit trailers or RVs.'},
    amen:{flush:true, water:true, showers:false, dump:false, store:null, wifi:null, firepit:false, vault:null, laundry:null, pets:null, ada:true, cell:false, bearBox:true},
    fam:{easyTrails:null, kidNote:'Each site has a table, raised grill, food-storage box and tent pad. No ground fires.'},
    fees:{note:'Nightly rate not read on the pages fetched: check Recreation.gov.'},
    book:R('https://recreation.gov/camping/campgrounds/250901', {window:'Up to 6 months ahead', cancelNote:'A site may be cancelled if unoccupied within 24 hours of the reservation start (per NPS).'}),
    contact:{phone:'520-824-3560', url:'https://www.nps.gov/chir/planyourvisit/camping.htm'},
    hi:['Rock-pinnacle scenery','Food-storage box at each site'],
    caut:['RV and trailer length is tightly limited.','Summer monsoon flooding can close sites.'],
    src:['https://recreation.gov/camping/campgrounds/250901','https://www.nps.gov/chir/planyourvisit/upload/Campground_Info_2025_Remediated-corrected.pdf']
  });
  K('az-tuweep-campground-grand-canyon', 'Tuweep Campground', 'Grand Canyon National Park (Tuweep / Toroweap)', NPS, 'Mohave', {
    season:{open:null, close:null, note:'No season stated. Summer monsoon storms (July to September) and winter snow or mud affect road access.'}, status:null,
    types:['tent','group','walk-in'],
    sites:{total:10, hookups:'none', hookupNote:'Nine campsites for 1 to 6 people plus one group site for 7 to 11. Composting toilets, picnic tables, no water. Fires and charcoal are prohibited.'},
    fam:{kidNote:'Very remote: 3+ hours one way on dirt roads. High-clearance vehicle needed on the campground road. Arrive before sunset; max 7 nights.'},
    fees:{note:'Fee not shown on the Tuweep page. A park pass and Backcountry Permit are needed; neither is sold on site.'},
    book:{system:'recreation.gov (Backcountry Permit)', url:'https://nps.gov/grca/planyourvisit/tuweep.htm', phone:null, window:'Permit must be obtained online at least 5 days before arrival', cancelNote:null},
    contact:{phone:'928-638-7888', url:'https://nps.gov/grca/planyourvisit/tuweep.htm'},
    hi:['Remote North Rim overlook area','Quiet dark skies'],
    caut:['No water, no services, no cell coverage assumed: carry everything.','Permits cannot be issued at Tuweep.','Roads impassable when wet or snowy.'],
    src:['https://nps.gov/grca/planyourvisit/tuweep.htm']
  });
  K('az-lees-ferry-campground', 'Lees Ferry Campground', 'Glen Canyon National Recreation Area', NPS, 'Coconino', {
    season:{open:null, close:null, note:null}, status:'limited',
    statusNote:'The NPS camping page said Lees Ferry upper loop was closed for renovations and the lower loop was open (when read). Check the NPS alerts page.',
    types:['tent','rv'],
    sites:{total:54, hookups:'none', hookupNote:'54 designated sites per the Utah tourism page; hook-ups not stated.'},
    fam:{fishing:true, kidNote:'NPS-run campgrounds here take no reservations; choose your site before paying online.'},
    fees:{note:'Campground fee not read. Entrance fee applies in addition.'},
    book:{system:'First come, first served', url:'https://www.nps.gov/glca/planyourvisit/camping.htm', phone:null, firstComeNote:'NPS campgrounds at Glen Canyon take no reservations; payment does not hold a site.'},
    contact:{phone:'928-608-6200', url:'https://www.nps.gov/glca/planyourvisit/camping.htm'},
    hi:['Colorado River at the start of the Grand Canyon','Trout fishing'],
    caut:['Camping limited to 14 consecutive days and 30 per year.','Park phone is not monitored when the building is closed.'],
    src:['https://WWW.NPS.GOV/glca/planyourvisit/camping.htm','https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping']
  });
  K('az-lone-rock-beach-glen-canyon', 'Lone Rock Beach Camping', 'Glen Canyon National Recreation Area', NPS, 'Coconino', {
    season:{open:null, close:null, note:null}, status:null,
    types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'Primitive sandy beach or dune sites per the Utah tourism page (not designated sites).'},
    fam:{swim:null, beach:true, kidNote:'Lake levels change what is available.'},
    fees:{note:'Fee not read. Entrance fee applies.'},
    book:{system:'First come, first served', url:'https://www.nps.gov/glca/planyourvisit/camping.htm', phone:null, firstComeNote:'NPS campgrounds at Glen Canyon take no reservations.'},
    contact:{phone:'928-608-6200', url:'https://www.nps.gov/glca/planyourvisit/camping.htm'},
    hi:['Beach camping on Lake Powell'],
    caut:['Sandy ground: check conditions before driving heavy rigs onto the beach.','Check NPS alerts for status.'],
    src:['https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping','https://www.nps.gov/glca/planyourvisit/seasonalhours.htm']
  });
  K('az-wahweap-rv-campground', 'Wahweap RV Park and Campground', 'Glen Canyon National Recreation Area', 'Concessioner in National Park Service area', 'Coconino', {
    season:{open:null, close:null, note:null}, status:null,
    types:['rv','tent','group'],
    sites:{total:208, hookups:'full', hookupNote:'Per the Utah tourism page: 112 dry sites, 90 full-hook-up sites and 6 group sites (counts sum to 208). Accepts reservations.'},
    fam:{boating:true, nearTown:'Page', kidNote:'Next to the Wahweap marina.'},
    fees:{note:'Rates not read: check the concessioner.'},
    book:{system:'Concessioner reservations', url:'https://www.nps.gov/glca/planyourvisit/camping.htm', phone:null},
    contact:{phone:'928-608-6200', url:'https://www.nps.gov/glca/planyourvisit/camping.htm'},
    hi:['Hook-up sites near Lake Powell and Page'],
    caut:['Phone shown is the NPS park line, not the concessioner.'],
    src:['https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping']
  });
  K('az-temple-bar-lake-mead', 'Temple Bar Campground', 'Lake Mead National Recreation Area', NPS, 'Mohave', {
    season:{open:'Year-round', close:null, note:null}, status:'open',
    types:['tent','rv'],
    sites:{total:69, hookups:'none', hookupNote:'69 standard non-electric sites listed on Recreation.gov; no hook-ups. Up to 8 people per site.'},
    amen:{flush:true, showers:false, water:true, dump:true, store:true, wifi:false, ada:true, firepit:null, vault:null, laundry:null, pets:null, cell:null, bearBox:null},
    fam:{boating:true, fishing:true, kidNote:'Seasonal cafe, store and marina for boat rental. Campground host on site.'},
    fees:{note:'Camping rate not listed on the page. Lake Mead entrance fee applies in addition.'},
    book:R('https://www.recreation.gov/camping/campgrounds/10085626'),
    contact:{phone:'702-293-8906', url:'https://www.nps.gov/lake/planyourvisit/campgrounds.htm'},
    hi:['Lake Mead shoreline','Dump and water refill near entrance'],
    caut:['No showers.'],
    src:['https://www.recreation.gov/camping/campgrounds/10085626','https://www.nps.gov/lake//planyourvisit/campgrounds.htm']
  });

  /* ---------------- NATIONAL FORESTS ---------------- */
  K('az-cave-springs-coconino', 'Cave Springs Campground', 'Coconino National Forest (Oak Creek Canyon)', USFS, 'Coconino', {
    lat:34.99589, lon:-111.73972, elev:5402,
    season:{open:null, close:null, note:'Season dates not listed on the pages read.'}, status:'open',
    types:['tent','rv'],
    sites:{total:84, maxRvFt:36, hookups:'none', hookupNote:'84 sites listed on Recreation.gov (one tent-only). No hook-ups.'},
    amen:{showers:true, vault:true, water:true, firepit:true, flush:false, dump:false, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{swim:true, fishing:true, nearTown:'Sedona', kidNote:'Sites among ponderosa pines, many beside Oak Creek. Firewood and ice sold by campground hosts.'},
    fees:{nightlyMin:30, nightlyMax:30, extraVehicle:10, note:'$30 per night for a single site (8 people, 1 vehicle); 2nd vehicle $10. Senior and Access passes 50% off the single-site fee; other interagency passes not accepted.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232194', {firstComeNote:'Walk-up availability only from the on-site host.'}),
    contact:{phone:'928-282-1629', url:'https://fs.usda.gov/r03/coconino/recreation/cave-springs-campground'},
    hi:['Oak Creek swimming and fishing','Token-operated showers'],
    caut:['Summer weekends fill: reserve.'],
    src:['https://fs.usda.gov/r03/coconino/recreation/cave-springs-campground','https://www.recreation.gov/camping/campgrounds/232194?tab=info']
  });
  K('az-pine-flat-west-coconino', 'Pine Flat Campground', 'Coconino National Forest (Oak Creek Canyon)', USFS, 'Coconino', {
    lat:35.01249, lon:-111.73866, elev:5545,
    season:{open:'Mid-April', close:'Late October', note:null}, status:'seasonal',
    types:['tent','rv'],
    sites:{total:59, hookups:'none', hookupNote:'Recreation.gov lists 59 single-unit sites (three tagged RV electric; the page also says no hook-ups, so confirm). It cannot take wide-body motorhomes.'},
    amen:{vault:true, water:true, firepit:true, showers:false, flush:false, dump:false, store:null, wifi:null, laundry:null, pets:null, ada:true, cell:null, bearBox:null},
    fam:{swim:true, fishing:true, nearTown:'Sedona', kidNote:'Firewood and ice sold by campground hosts.'},
    fees:{nightlyMin:30, nightlyMax:30, extraVehicle:10, note:'$30 per night for a single site; 2nd vehicle $10. Senior and Access passes 50% off.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232320'),
    contact:{phone:'928-282-3750', url:'https://www.fs.usda.gov/r03/coconino/recreation/pine-flat-campground'},
    hi:['Oak Creek Canyon','Drinking water and vault toilets'],
    caut:['No showers.'],
    src:['https://www.fs.usda.gov/r03/coconino/recreation/pine-flat-campground','https://www.recreation.gov/camping/campgrounds/232320?tab=info']
  });
  K('az-bonito-campground-coconino', 'Bonito Campground', 'Coconino National Forest (Sunset Crater area)', USFS, 'Coconino', {
    lat:35.36927, lon:-111.54063, elev:6925,
    season:{open:'Early May', close:'Mid-October', note:null}, status:'seasonal',
    types:['tent','rv'],
    sites:{total:44, maxRvFt:42, hookups:'none', hookupNote:'44 single sites: 22 reservable, 22 first-come, first-served. Motorhomes and trailers over 42 ft are not permitted.'},
    amen:{vault:true, water:true, firepit:true, ada:true, showers:false, flush:false, dump:false, store:null, wifi:null, laundry:null, pets:null, cell:null, bearBox:null},
    fam:{rangerPrograms:true, nearTown:'Flagstaff', kidNote:'Campfire program auditorium on site. Horses and pack animals not allowed.'},
    fees:{nightlyMin:34, nightlyMax:34, extraVehicle:10, note:'$34 per night for a single site; extra vehicle $10. Senior and Access passes 50% off.'},
    book:R('https://www.recreation.gov/camping/campgrounds/271930', {firstComeNote:'Half the sites are first come, first served.'}),
    contact:{phone:'928-774-9671', url:'https://www.fs.usda.gov/r03/coconino/recreation/bonito-campground'},
    hi:['Near Sunset Crater','Campfire program auditorium'],
    caut:['Cold nights at nearly 7,000 ft.'],
    src:['https://www.fs.usda.gov/r03/coconino/recreation/bonito-campground']
  });
  K('az-rose-canyon-coronado', 'Rose Canyon Campground', 'Coronado National Forest (Mount Lemmon)', USFS, 'Pima', {

    season:{open:'April 15', close:'October 15', note:'Minimum season per a Forest Service document; may open mid-March if feasible.'}, status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:74, hookups:'none', hookupNote:'73 single-family and 1 double-family unit across seven loops and The Flats (Forest Service 2025 fee document). An older FS page said RVs are limited to 22 ft: confirm.'},
    amen:{water:true, vault:true, firepit:true, bearBox:true, store:true, ada:true, showers:false, flush:false, dump:false, wifi:null, laundry:null, pets:null, cell:null},
    fam:{fishing:true, easyTrails:true, nearTown:'Tucson', kidNote:'Stocked-trout lake; no boating or swimming. Bear-proof food storage.'},
    fees:{nightlyMin:31, nightlyMax:51, extraVehicle:11, note:'2025 rates: $31 single, $51 double, $11 extra vehicle. Elevation about 7,200 to 7,800 ft per the Forest Service document.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232284'),
    contact:{phone:'520-576-1477', url:'https://www.recreation.gov/camping/campgrounds/232284'},
    hi:['Cool pine forest above Tucson','Rose Canyon Lake'],
    caut:['Drive with care coming up the Catalina Highway.','Secure food from bears.','Fire restrictions may ban campfires.'],
    src:['https://www.fs.usda.gov/media/234611','https://www.recreation.gov/camping/campgrounds/232284?tab=info']
  });
  K('az-spencer-canyon-coronado', 'Spencer Canyon Campground', 'Coronado National Forest (Mount Lemmon)', USFS, 'Pima', {

    season:{open:'April 15', close:'October 15', note:'Same season as Rose Canyon per the Forest Service document.'}, status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:62, hookups:'none', hookupNote:'60 single-family units and 2 group units (up to 15 people each).'},
    amen:{water:true, firepit:true, vault:null, showers:null, flush:null, dump:null, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{nearTown:'Tucson'},
    fees:{nightlyMin:31, nightlyMax:49, extraVehicle:11, note:'2025 rates: $31 single, $49 double, $11 extra vehicle.'},
    book:{system:'First come, first served', url:'https://www.fs.usda.gov/media/234611', phone:null, firstComeNote:'The document said there were no reservations at the time; check Forest Service pages.'},
    contact:{url:'https://www.fs.usda.gov/media/234611'},
    hi:['Mount Lemmon pine forest'],
    caut:['Details come from a Forest Service planning document; confirm current status.'],
    src:['https://www.fs.usda.gov/media/234611']
  });
  K('az-whitetail-group-coronado', 'Whitetail Group Campground', 'Coronado National Forest (Mount Lemmon)', USFS, 'Pima', {

    season:{open:'April 15', close:'October 15', note:null}, status:'seasonal',
    types:['group'],
    sites:{total:5, hookups:'none', hookupNote:'Five group sites with shelters for 40 to 90 people; small-appliance electricity; vault toilets.'},
    fees:{nightlyMin:150, nightlyMax:197, note:'$150 (sites 1, 3, 4), $168 (site 2, up to 60), $197 (site 5, up to 90).'},
    book:R('https://www.recreation.gov/camping/campgrounds/234564', {firstComeNote:'Reservation only.'}),
    contact:{url:'https://www.fs.usda.gov/media/234611'},
    hi:['Group shelters'], caut:['Groups only.'],
    src:['https://www.fs.usda.gov/media/234611']
  });
  K('az-showers-point-group-coronado', 'Showers Point Group Site', 'Coronado National Forest (Mount Lemmon)', USFS, 'Pima', {

    season:{open:'April 15', close:'October 15', note:null}, status:'seasonal',
    types:['group'],
    sites:{total:3, hookups:'none', hookupNote:'Three ramadas (up to 25 people each) plus one host unit.'},
    fees:{nightlyMin:114, nightlyMax:114, note:'$114 per group site (2025).'},
    book:R('https://www.recreation.gov/camping/campgrounds/232285'),
    contact:{url:'https://www.fs.usda.gov/media/234611'},
    hi:['Group ramadas'], caut:['Groups only.'],
    src:['https://www.fs.usda.gov/media/234611']
  });
  K('az-christopher-creek-tonto', 'Christopher Creek Campground', 'Tonto National Forest (Payson Ranger District)', USFS, 'Gila', {
    lat:34.3083147, lon:-111.0371849, elev:5600,
    season:{open:'April', close:'October', note:'April 1 to 14 first come, first served; from April 15 book on Recreation.gov (at least 3 days ahead).'}, status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:44, hookups:'none', hookupNote:'43 standard sites on both sides of the creek plus one group site (25 people). No RV hook-ups or dump station.'},
    amen:{vault:true, water:true, firepit:true, dump:false, showers:null, flush:false, store:null, wifi:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{fishing:true, kidNote:'No firewood sales on site.'},
    fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night standard; $80 group site; 50% off single units with Senior or Access pass. 14-day stay limit.'},
    book:R('https://www.recreation.gov/camping/campgrounds/231896', {window:'Standard sites 6 months ahead; group site 12 months ahead'}),
    contact:{phone:'928-474-7900', url:'https://www.fs.usda.gov/r03/tonto/recreation/christopher-creek-campground-and-group-site'},
    hi:['Creekside sites below the Mogollon Rim'],
    caut:['Page gave elevation as 5,640 ft in one place and 5,600 ft in another; 5,600 shown.'],
    src:['https://www.fs.usda.gov/r03/tonto/recreation/christopher-creek-campground-and-group-site']
  });
  [['az-houston-mesa-tonto','Houston Mesa Campground and Equestrian Sites','houston-mesa-campground-and-equestrian-sites',['tent','rv','equestrian']],
   ['az-ponderosa-tonto','Ponderosa Campground and Group Sites','ponderosa-campground-and-group-sites',['tent','rv','group']],
   ['az-sharp-creek-tonto','Sharp Creek Campground and Group Sites','sharp-creek-campground-and-group-sites',['tent','rv','group']]].forEach(function(a){
    K(a[0], a[1], 'Tonto National Forest (Payson Ranger District)', USFS, 'Gila', {
      season:{open:null, close:null, note:null}, status:'open',
      statusNote:'Listed as open on the Payson Ranger District page when read. Only status and the general description were read: fee, sites and season are not verified.',
      types:a[3], sites:{hookups:'none', hookupNote:'The Gila County tourism page says no RV hook-ups.'},
      fees:{note:'Fee not verified: check the Forest Service page.'},
      book:{system:null, url:'https://www.fs.usda.gov/r03/tonto/recreation/'+a[2], phone:null},
      contact:{phone:'928-474-7900', url:'https://www.fs.usda.gov/r03/tonto/recreation/'+a[2]},
      hi:[], caut:['Most details not verified: use the official link.'],
      src:['https://www.fs.usda.gov/r03/tonto/recreation/payson-ranger-district','https://discovergilacounty.com/camping-payson-ranger-district/']
    });
  });
  K('az-black-canyon-rim-asnf', 'Black Canyon Rim Campground', 'Apache-Sitgreaves National Forests (Black Mesa)', USFS, 'Coconino', {
    lat:34.30489444, lon:-110.74335, elev:7600,
    season:{open:'May 1', close:'Mid-October', note:'Generally open to Columbus Day weekend, weather permitting.'}, status:'seasonal',
    types:['tent','rv'],
    sites:{total:null, hookups:'none', hookupNote:'Site count not given on the page.'},
    amen:{vault:true, water:true, firepit:true, ada:true, showers:false, flush:false, dump:false, store:null, wifi:null, laundry:null, pets:null, cell:null, bearBox:null},
    fam:{fishing:true, kidNote:'Gas, phone and groceries about 8 miles west at Forest Lakes. Campground host on site.'},
    fees:{nightlyMin:20, nightlyMax:20, extraVehicle:12, note:'$20 per night for a single site (1 vehicle, 8 people); extra vehicle $12.'},
    book:R('https://www.recreation.gov/camping/campgrounds/250040'),
    contact:{phone:'928-535-7300', url:'https://www.fs.usda.gov/r03/apache-sitgreaves/recreation/black-canyon-rim-campground'},
    hi:['Near Black Canyon Lake and the Mogollon Rim'],
    caut:['Sand and gravel access roads.'],
    src:['https://www.fs.usda.gov/r03/apache-sitgreaves/recreation/black-canyon-rim-campground']
  });
  K('az-rim-campground-asnf', 'Rim Campground', 'Apache-Sitgreaves National Forests (Black Mesa)', USFS, 'Coconino', {
    lat:34.30558889, lon:-110.9082861,
    season:{open:'May 1', close:'Columbus Day weekend', note:'Weather permitting; the page also listed an "April 29" entry.'}, status:'seasonal',
    types:['tent','rv'],
    sites:{total:26, hookups:'none', hookupNote:'26 sites in two loops with parallel parking (about 40 ft); sites 14 to 26 are reservable. No length limit stated.'},
    amen:{vault:true, firepit:true, ada:true, water:null, showers:false, flush:false, dump:false, store:null, wifi:null, laundry:null, pets:null, cell:null, bearBox:null},
    fam:{kidNote:'The page contradicted itself on drinking water: bring your own to be safe. Off Road 300, about 1 mile from Hwy 260.'},
    fees:{nightlyMin:18, nightlyMax:18, extraVehicle:12, note:'$18 per night, non-electric single site; extra vehicle $12.'},
    book:{system:'Mixed', url:'https://www.fs.usda.gov/r03/apache-sitgreaves/recreation/rim-campground', phone:null, firstComeNote:'Sites 14 to 26 can be reserved; the rest are first come.'},
    contact:{phone:'928-333-6280', url:'https://www.fs.usda.gov/r03/apache-sitgreaves/recreation/rim-campground'},
    hi:['Rim Lakes area on the Mogollon Rim'],
    caut:['Confirm drinking water.'],
    src:['https://www.fs.usda.gov/r03/apache-sitgreaves/recreation/rim-campground','https://forestcamping.com/dow/southwst/sitginfo.htm']
  });
  K('az-los-burros-asnf', 'Los Burros Campground', 'Apache-Sitgreaves National Forests (Black Mesa)', USFS, 'Navajo', {
    lat:34.14193333, lon:-109.7761639, elev:7900,
    season:{open:null, close:null, note:'Season not stated.'}, status:'open',
    types:['tent','rv','equestrian'],
    sites:{total:null, hookups:'none', hookupNote:'Very large sites in a ponderosa meadow. One vault toilet, tables; horse camping allowed.'},
    amen:{vault:true, water:false, store:false, flush:false, showers:false, dump:false, wifi:null, firepit:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{kidNote:'No potable water and no garbage service: pack out all trash. 14-day stay limit.'},
    fees:{nightlyMin:0, nightlyMax:0, note:'The Forest Service page says there is no fee.'},
    book:{system:'First come, first served', url:'https://fs.usda.gov/r03/apache-sitgreaves/recreation/los-burros-campground', phone:null},
    contact:{phone:'928-333-6280', url:'https://fs.usda.gov/r03/apache-sitgreaves/recreation/los-burros-campground'},
    hi:['Free, quiet meadow camping','Horse camping'],
    caut:['Bring water; pack out trash.','Phone is the Forest supervisor office, not on-site.'],
    src:['https://fs.usda.gov/r03/apache-sitgreaves/recreation/los-burros-campground','https://forestcamping.com/dow/southwst/sitginfo.htm']
  });
  K('az-woods-canyon-lake-asnf', 'Woods Canyon Lake Campground and Group Site', 'Apache-Sitgreaves National Forests (Lakeside)', USFS, 'Navajo', {
    elev:7000,
    season:{open:null, close:null, note:'The Recreation.gov page mentioned walk-in use mid-April to mid-May and mid-September to mid-November, weather permitting; full season dates not given.'}, status:'seasonal',
    types:['tent','rv','group'],
    sites:{total:null, hookups:'none', hookupNote:'The Recreation.gov listing read was the group site (120 people, 30 vehicles); when not reserved by a group, family sites are first come, first served.'},
    amen:{vault:true, water:true, flush:false, showers:false, dump:false, store:null, wifi:null, firepit:null, laundry:null, pets:null, ada:null, cell:null, bearBox:null},
    fam:{fishing:true, boating:true, kidNote:'Primitive camp; only quiet generators.'},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per night for individual family sites; group fee not listed.'},
    book:R('https://www.recreation.gov/camping/campgrounds/232205'),
    contact:{phone:'928-535-0181', url:'https://www.recreation.gov/camping/campgrounds/232205'},
    hi:['Rim Lakes fishing and boating'],
    caut:['Only the group-site listing was read: confirm the family campground details.'],
    src:['https://www.recreation.gov/camping/campgrounds/232205']
  });
})();
