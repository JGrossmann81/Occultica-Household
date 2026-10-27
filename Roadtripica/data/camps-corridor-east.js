/* Campica data pack: central-east corridor (OH, IN, PA I-80/I-70/Allegheny/Pocono/Laurel Highlands, NJ, DE, NY NYC-region gaps, IL).
   Facts only from pages listed in SOURCES-camps-corridor-east.md (read 2026-10). null = NOT verified: the UI must say
   "check with the source" and show the official link. lat/lon are set only where an official page printed them (Wildwood, Beaver Pond,
   Ohiopyle); everything else is null. Counties are general reference knowledge (not read from a page); null where unsure. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
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

  /* ---------------- OHIO (ODNR) ---------------- */
  var OHD = 'Ohio Department of Natural Resources (Ohio State Parks)';
  var OH_RATES = 'https://ohiodnr.gov/discover-and-learn/safety-conservation/about-ODNR/division-parks-watercraft/stay-overnight/Rates/camping-rates';
  var OH_BOOK = {system:'ReserveOhio', url:'https://www.reserveohio.com', phone:'866-644-6727', window:'Up to six months ahead (park page).'};
  var OH_PARK = function(slug){ return 'https://ohiodnr.gov/go-and-do/plan-a-visit/find-a-property/' + slug; };
  var OH_FEE = ' ODNR rate page is dated effective April 1, 2024 (Apr 1 to Oct 31 rate shown; lower Nov 1 to Mar 31) and says rates are subject to change; reservation service fee is extra.';
  function oh(id, name, parent, slug, county, o){
    o.book = mix(OH_BOOK, o.book); o.contact = mix({url: OH_PARK(slug)}, o.contact);
    o.src = [OH_PARK(slug)].concat(o.fees && o.fees.nightlyMax != null ? [OH_RATES] : [], o.src || []);
    K(id, name, parent, OHD, 'OH', 'midwest', county, o);
  }
  oh('oh-hueston-woods-campground', 'Hueston Woods State Park Campground', 'Hueston Woods State Park', 'hueston-woods-state-park-campground', 'Butler', {
    status:'open', season:{open:'Year-round', close:null, note:'Off-peak Nov 1 to Apr 1: shower house, dump station and water stay available; A and B rows, cabins and lodges open.'},
    types:['tent','rv','cabin','group','horse'], sites:{total:365, hookups:'electric', hookupNote:'228 electric sites (20 of them full hookup) plus 137 non-electric sites with vault latrines. Total is the sum of those two counts. Equestrian camp (count not stated) and three primitive group camps are extra.'},
    amen:{showers:true, flush:true, vault:true, laundry:true, dump:true, pets:true},
    fam:{playground:true, kidNote:'Page lists playgrounds and basketball, volleyball and checkers courts. Swimming and beach were not described on the campground page.'},
    fees:{nightlyMin:27, nightlyMax:50, note:'Non-electric $27, electric $37, full service $50 (equestrian sites $23 to $33).' + OH_FEE},
    book:{firstComeNote:'Two vehicles per site with a reservation.'}, contact:{phone:'513-523-1060'},
    hi:['Large campground with electric and non-electric loops','Playgrounds and game courts in the campground'],
    caut:['Phone 513-523-1060 is the campground check-in station; reservation line is 866-644-6727.','Max RV length was not stated.']
  });
  oh('oh-pymatuning-campground', 'Pymatuning State Park Campground', 'Pymatuning State Park', 'pymatuning-state-park-campground', 'Ashtabula', {
    status:'limited', season:{open:null, close:null, note:'Camp office open May through November; winter camping only at sites 1 to 59 and 85 to 87 (sites 40 to 59 have no water).'},
    types:['tent','rv','cabin'], sites:{hookups:'electric', hookupNote:'Page lists full-hookup (30/50 amp), electric (20/30 amp) and non-electric sites; no counts given.'},
    amen:{showers:true, flush:true, laundry:true, store:true},
    fam:{beach:true, playground:true, rangerPrograms:true, kidNote:'Small beach for campers, playgrounds, basketball and volleyball courts, naturalist programs and a seasonal nature center nearby.'},
    fees:{nightlyMin:29, nightlyMax:52, note:'Non-electric $29, electric $39, premium $43, full service $52.' + OH_FEE},
    contact:{phone:'440-293-4292'},
    hi:['Camper beach and fish cleaning station','Naturalist programs'], caut:['440-293-4292 is the camp office; park office is 440-293-6684.','Page carries a notice (dated 8/5/26) that the road from the south end of Cabin Beach to Birches Marina is closed to vehicles.']
  });
  oh('oh-east-harbor-campground', 'East Harbor State Park Campground', 'East Harbor State Park', 'east-harbor-state-park', 'Ottawa', {
    types:['tent','rv','cabin','group'], sites:{hookups:'electric', hookupNote:'Full hookup, electric, non-electric and ADA sites plus two Sherman cabins; counts not stated.'},
    amen:{pets:true}, season:{note:'Camping season not stated on the page; camper boat ramps open Apr 1 to Oct 31. Reservations are required.'},
    fam:{swim:true, beach:true, playground:true, boating:true, easyTrails:true, kidNote:'1,500 ft Lake Erie sand beach with restrooms, changing rooms and outdoor showers (no dogs on the beach); marina and ramp; more than 10 miles of trails; disc golf.'},
    fees:{nightlyMin:31, nightlyMax:52, note:'Non-electric back-in $31, electric $41, full service $52.' + OH_FEE},
    contact:{phone:'419-734-4424'},
    hi:['Lake Erie swim beach','Marina and nature center'], caut:['Swimming is at your own risk; the page says to check beach advisories.']
  });
  oh('oh-john-bryan-campground', 'John Bryan State Park Campground', 'John Bryan State Park', 'john-bryan-state-park-campground', 'Greene', {
    status:'open', season:{open:'Year-round', close:null, note:'Off-peak Nov 1 to Apr 1: shower house, dump station, water and all sites available; group camps closed.'},
    types:['tent','rv','group'], sites:{total:52, hookups:'electric', hookupNote:'32 electric and 20 non-electric sites; four group camps of 25 people each (no RVs at the group camps).'},
    amen:{showers:true, water:true, dump:true, store:true, firepit:true, pets:true},
    fees:{nightlyMin:27, nightlyMax:37, note:'Non-electric $27, electric $37.' + OH_FEE},
    contact:{phone:'937-767-1274'}, hi:['Wooded, mostly shaded sites','Camp store with firewood and ice'],
    caut:['Site numbers were recently renumbered; check your reservation.','Max RV length not stated.']
  });
  oh('oh-jesse-owens-big-muskie-campground', 'Big Muskie Campground (Jesse Owens State Park)', 'Jesse Owens State Park', 'jesse-owens-state-park-campground', 'Morgan', {
    status:'open', season:{open:'Year-round', close:null, note:'Big Muskie and Sawmill open year-round; no-fee primitive areas generally Apr 1 to mid-December.'},
    types:['tent','rv','cabin'], sites:{hookups:'full', hookupNote:'Big Muskie has 50 fee-based full-hookup sites. Hook Lake, Maple Grove and Sand Hollow are primitive no-fee first-come areas (no water or electric).'},
    amen:{showers:true, flush:true},
    fam:{playground:true, fishing:true, kidNote:'Playground at Big Muskie; youth-only fishing ponds at Hook Lake (15 and under).'},
    fees:{nightlyMin:0, nightlyMax:46, note:'Primitive sites no fee; non-electric $27; full service $46 (rate page, effective April 1, 2024). The campground page and rate page disagree on which areas are fee-based; confirm.'},
    contact:{phone:'740-558-6040', address:'Big Muskie: 100 Natural Resources Road 1, McConnelsville, OH 43756'},
    book:{firstComeNote:'No-fee primitive sites are first come, first served, two-week maximum stay.'},
    hi:['Free primitive camping areas','Four ADA-compliant RV sites at Big Muskie'], caut:['Reservation lines are printed as 866-644-6727 on the park page.']
  });
  oh('oh-stonelick-campground', 'Stonelick State Park Campground', 'Stonelick State Park', 'stonelick-state-park-campground', 'Clermont', {
    status:'open', season:{open:'Year-round', close:null, note:'Nov 1 to Mar 31: 75 electric and 2 premium sites open; non-electric closed, shower house closed.'},
    types:['tent','rv','cabin'], sites:{total:122, hookups:'electric', hookupNote:'Peak season: 107 electric, 6 non-electric and 9 premium lakeside sites (total is their sum); plus a camper cabin and a shelter house.'},
    amen:{showers:true, flush:true, laundry:true, store:true, pets:true},
    fam:{playground:true, fishing:true, boating:true, kidNote:'Fishing pier, hand-powered boat ramp, game courts, rentals in peak season. Swimming rules not stated; no pets on the campground beach.'},
    fees:{note:'Nightly rate not verified: Stonelick falls after the cut-off of the ODNR rate page we could read. Check the official page.'},
    contact:{phone:'513-625-6593'}, book:{firstComeNote:'Walk-ins are no longer accepted; check the camp store when open.'},
    hi:['Paved pads at every site','Camper cabin on site'], caut:['Showers only in peak season.']
  });
  oh('oh-salt-fork-campground', 'Salt Fork State Park Campground', 'Salt Fork State Park', 'salt-fork-state-park-campground', 'Guernsey', {
    status:'open', season:{open:null, close:null, note:'Off-peak Dec 8 to Apr 1: Loop A and the bridle camp stay open; full hookup sites have no water then.'},
    types:['tent','rv','group','horse'], sites:{hookups:'full', hookupNote:'Large RV, full hookup (50 amp), electric and tent-only sites plus primitive tent, bridle and group camps; counts not stated.'},
    amen:{showers:true, flush:true, dump:true, store:true, pets:true},
    fam:{playground:true, kidNote:'Playgrounds at the camp office and camp areas A, E, F and G. Salt Fork Beach Complex was still under construction (page note 4/24/26).'},
    fees:{note:'Nightly rate not verified: Salt Fork rows were cut off on the ODNR rate page we could read. Check the official page.'},
    contact:{phone:'740-432-1508'}, hi:['Huge state park on I-77 and US 22','Seasonal gem mining at the check-in station'],
    caut:['Beach complex construction: confirm what is open before planning a swim.']
  });
  oh('oh-mohican-campground', 'Mohican State Park Campground', 'Mohican State Park', 'mohican-state-park-campground', 'Ashland', {
    status:'open', season:{open:null, close:null, note:'Off-peak mid-November to March 31 with reduced fees and no water at full hookup sites; some sites stay open all winter.'},
    types:['tent','rv','cabin','group'], sites:{total:184, hookups:'full', hookupNote:'100 electric, 51 full hookup and 33 non-electric sites (some riverside); plus two Sherman cabins in the campground.'},
    amen:{showers:true, flush:true, dump:true, store:true, firepit:true, pets:true},
    fam:{swim:true, playground:true, rangerPrograms:true, kidNote:'Swimming pool and nature center open Memorial Day to Labor Day (pool closed for maintenance Aug 6 to 12 per the page); playground, courts, nature programming year-round.'},
    fees:{nightlyMin:27, nightlyMax:56, note:'Class B $27, tent-only non-electric $31, electric $41, full service $56.' + OH_FEE},
    contact:{phone:'419-994-4290'}, hi:['Pool and nature center','Riverside non-electric sites'], caut:['Up to two pets per campsite; no pets in Sherman cabins.']
  });
  oh('oh-caesar-creek-campground', 'Caesar Creek State Park Campground', 'Caesar Creek State Park', 'caesar-creek-state-park-campground', 'Warren', {
    types:['tent','rv','group','horse'], sites:{total:287, hookups:'electric', hookupNote:'252 electric and 35 full hookup sites (total is the sum); separate equestrian camp with 29 primitive sites.'},
    amen:{showers:true, flush:true, dump:true, store:true, pets:true},
    fam:{swim:true, beach:true, playground:true, boating:true, easyTrails:true, kidNote:'Small secluded camper swim area nearby and a 1,300 ft main beach a short drive away; playground, boat ramp, 3+ miles of trails.'},
    fees:{nightlyMin:39, nightlyMax:52, note:'Electric $39, full service $52 (equestrian $24).' + OH_FEE},
    book:{firstComeNote:'Check-in 3 pm, check-out 1 pm; 14 nights maximum in 30 days; six people per site.'},
    hi:['Camper beach and boat ramp','Trails with mountain-bike access'], caut:['Campground phone was not clearly given on the page; use the reservation line 866-644-6727.','Season not stated.']
  });
  oh('oh-punderson-campground', 'Punderson State Park Campground', 'Punderson State Park', 'punderson-state-park-campground', 'Geauga', {
    types:['tent','rv','group'], sites:{total:172, hookups:'electric', hookupNote:'15 non-electric hill sites, 137 electric (50 amp) and 20 full hookup sites (total is the sum); three group sites (site 1 closed during construction).'},
    amen:{showers:true, flush:true, dump:true, pets:true},
    fam:{playground:true, boating:true, kidNote:'Playground, basketball court, amphitheater and nature center; kayak, canoe, paddleboard and bike rentals at the camp office. Lake is hand-powered and electric-motor boats only.'},
    fees:{nightlyMin:27, nightlyMax:50, note:'Non-electric $27, electric $37, full service $50.' + OH_FEE},
    contact:{phone:'440-564-1195'}, hi:['Paddling on a no-gas-motor lake'], caut:['Water and sewer are off from October 31 through winter.','Season dates not stated.']
  });

  /* ---------------- INDIANA (DNR) ---------------- */
  var IND = 'Indiana Department of Natural Resources (State Parks)';
  var IN_RATES = 'https://secure.in.gov/dnr/state-parks/rates-and-fees/camping-fees';
  var IN_BOOK = {system:'Indiana State Parks reservations (ReserveAmerica)', url:'https://indianastateparks.reserveamerica.com/', phone:null};
  var IN_FEE = 'Statewide Indiana schedule (page dated March 9, 2026, taxes not included, park-by-park rates not given): non-electric $20 to $22 Sun to Wed and $23 to $25 Thu to Sat; electric $33 to $45 Sun to Wed and $40 to $52 Thu to Sat; full hookup $40 to $52 Sun to Wed and $50 to $62 Thu to Sat; primitive $14 to $16. The exact rate for this park is not stated: check the official page.';
  K('in-brown-county-state-park-campground', 'Brown County State Park Campground', 'Brown County State Park', IND, 'IN', 'midwest', 'Brown', {
    types:['tent','rv','horse','group'], sites:{total:429, hookups:'electric', hookupNote:'401 electric and 28 non-electric family sites (total is the sum); plus 60 rally sites and a Horsemen\'s camp with 118 electric and 86 non-electric sites.'},
    amen:{dump:true, store:true},
    fam:{swim:null, playground:null, kidNote:'The park page lists playground equipment park-wide and a pool at Abe Martin Lodge (hours vary: call the office).'},
    fees:{note:IN_FEE}, book:IN_BOOK, contact:{phone:'812-988-6406', url:'https://www.in.gov/dnr/state-parks/parks-lakes/brown-county-state-park/', address:'West Gate: 1405 S.R. 46 W, Nashville, IN 47448 (mailing: P.O. Box 608)'},
    hi:['Very large campground in hill country','Horsemen\'s camp with its own entrance'],
    caut:['All RVs and vehicles towing trailers MUST use the west entrance: the north entrance has a covered bridge (9 ft height limit, 3-ton limit). The page warns GPS may not route to the right gate.','Season not stated.'],
    src:['https://www.in.gov/dnr/state-parks/parks-lakes/brown-county-state-park/', IN_RATES]
  });
  K('in-turkey-run-state-park-campground', 'Turkey Run State Park Campground', 'Turkey Run State Park', IND, 'IN', 'midwest', 'Parke', {
    types:['tent','rv','group'], sites:{total:213, hookups:'electric', hookupNote:'213 electric sites; youth tent areas (count not stated).'},
    amen:{dump:true, store:true}, fam:{kidNote:'Swimming/pool is listed as a park activity; pool hours vary, call the office.'},
    fees:{note:IN_FEE}, book:IN_BOOK, contact:{phone:'765-597-2635', url:'https://www.in.gov/dnr/state-parks/parks-lakes/turkey-run-state-park/', address:'8121 E. Park Road, Marshall, IN 47859'},
    hi:['Electric sites in a classic Indiana canyon park'], caut:['Season not stated.'],
    src:['https://www.in.gov/dnr/state-parks/parks-lakes/turkey-run-state-park/', IN_RATES]
  });
  K('in-mccormicks-creek-state-park-campground', 'McCormick\'s Creek State Park Campground', 'McCormick\'s Creek State Park', IND, 'IN', 'midwest', 'Owen', {
    status:'closed-check', statusNote:'The park page says the campground is closed indefinitely for tornado recovery. Confirm before planning.',
    types:['cabin'], fam:{kidNote:'Swimming/pool is listed as a park activity; pool hours vary.'},
    fees:{note:'Campground closed (see status). ' + IN_FEE}, book:IN_BOOK, contact:{phone:'812-829-2235', url:'https://www.in.gov/dnr/state-parks/parks-lakes/mccormicks-creek-state-park/', address:'250 McCormick\'s Creek Park Road, Spencer, IN 47460'},
    hi:['Family cabins are listed on the park page'], caut:['Campground closed indefinitely for tornado recovery (park page, read 2026-10).'],
    src:['https://www.in.gov/dnr/state-parks/parks-lakes/mccormicks-creek-state-park/']
  });

  /* ---------------- PENNSYLVANIA (DCNR + Allegheny NF) ---------------- */
  var PAD = 'Pennsylvania DCNR (State Parks)';
  var PA_FIND = function(slug){ return 'https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/' + slug + '/stay'; };
  var PA_PRICES = 'https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/state-park-prices/camping';
  var PA_MAP = 'https://www.pa.gov/agencies/dcnr/recreation/what-to-do/stay-overnight/rv-and-tent-campsites/camping-locations-map';
  var PA_BOOK = {system:'Pennsylvania State Parks reservations (ReserveAmerica)', url:'https://pennsylvaniastateparks.reserveamerica.com/', phone:'888-727-2757', window:'Phone line 7 am to 5 pm Monday to Saturday (DCNR price page).'};
  var PA_FEE = 'Statewide DCNR schedule (page undated): base campsite $16 PA resident / $21 non-resident per night; add-ons per night: modern (showers) $4, premium (Fri, Sat, holidays) $4, electric $7, water $8, water and sewer $14. Two-night minimum on summer weekends. $6.50 non-refundable transaction fee per site. Which add-ons apply at this park is not stated: check the park page.';
  function pa(id, name, parent, slug, county, o){
    o.book = mix(PA_BOOK, o.book); o.fees = mix({reservationFee:6.5, nightlyMin:16, note:PA_FEE}, o.fees);
    o.contact = mix({url: PA_FIND(slug)}, o.contact); o.src = [PA_FIND(slug), PA_PRICES].concat(o.src || []);
    K(id, name, parent, PAD, 'PA', 'northeast', county, o);
  }
  pa('pa-tobyhanna-campground', 'Tobyhanna State Park Campground', 'Tobyhanna State Park', 'tobyhanna-state-park', 'Monroe', {
    status:'seasonal', season:{open:'Mid-April', close:'Mid-October', note:'Organized group tenting is open year-round.'}, types:['tent','rv','group'],
    sites:{total:135}, amen:{showers:true, flush:true, water:true, dump:true},
    fam:{playground:true, kidNote:'Playground at the campground. Park sits near 2,000 ft: expect cool nights even in summer.'},
    hi:['Poconos lake park with a modern campground'], caut:['Pets are allowed only at selected campsites for a fee.','Park phone not stated on the page.'],
    src:[PA_MAP]
  });
  pa('pa-promised-land-campgrounds', 'Promised Land State Park Campgrounds', 'Promised Land State Park', 'promised-land-state-park', 'Pike', {
    status:'seasonal', season:{open:null, close:null, note:'Varies by area: Pickerel Point and Deerfield year-round (limited sites in winter); Lower Lake early April to mid-October; Pines Memorial Day weekend to Labor Day.'},
    types:['tent','rv','cabin','horse'], sites:{total:390, hookups:'electric', hookupNote:'Six areas: Beechwood 106, Northwoods 48, Rhododendron 63, Hemlock Hill Equestrian 6, Pickerel Point 75, Deerfield 34, Pines 58 (total of those figures is the sum, not printed). Three camping cottages at Pickerel Point.'},
    amen:{showers:true, flush:true, laundry:true, dump:true, pets:true}, fam:{kidNote:'Several areas have flush toilets and showers; Rhododendron loop is pet-free.'},
    hi:['Seven camping areas in the Poconos','Three year-round camping cottages'], caut:['Alcohol is prohibited; 14-night summer stay limit.','Park phone not stated on the page.'], src:[PA_MAP]
  });
  pa('pa-prince-gallitzin-crooked-run-campground', 'Prince Gallitzin State Park Campground (Crooked Run)', 'Prince Gallitzin State Park', 'prince-gallitzin-state-park', 'Cambria', {
    status:'seasonal', season:{open:'Mid-April', close:'Late October', note:'Modern cabins year-round; beach summer only.'}, types:['tent','rv','cabin','group'],
    sites:{total:398, hookups:'electric', hookupNote:'Many sites electric, some full hookup. Seven main loops of 43 to 84 sites.'},
    amen:{showers:true, flush:true, dump:true, store:true, laundry:true, wifi:true},
    fam:{swim:true, beach:true, playground:true, boating:true, kidNote:'Swimming beach, boat rental and mooring, playgrounds. Wi-Fi at Crooked Run is for a fee.'},
    hi:['Beach, boat rental and big campground on Glendale Lake'], caut:['Dogs allowed only in cabins 1, 9 and 10; campsite pet rules not stated.'], src:[PA_MAP]
  });
  pa('pa-raccoon-creek-campground', 'Raccoon Creek State Park Campground', 'Raccoon Creek State Park', 'raccoon-creek-state-park', 'Beaver', {
    status:'seasonal', season:{open:null, close:null, note:'Modern loops E and F: early April to mid-October; loops A to D: late May to mid-September; Sioux Rustic Campground year-round.'},
    types:['tent','rv','group'], sites:{total:172, hookups:'electric', hookupNote:'172 modern tent/trailer sites with optional electricity; rustic Sioux campground count not stated.'},
    amen:{showers:true, flush:true, dump:true, pets:true}, fam:{playground:true, kidNote:'Playground and five washhouses in the modern campground.'},
    hi:['Modern and rustic camping near Pittsburgh'], caut:['Pets allowed only in loops C and F of the modern campground.','Park phone not stated on the page.'], src:[PA_MAP]
  });
  pa('pa-ohiopyle-kentuck-campground', 'Kentuck Campground (Ohiopyle State Park)', 'Ohiopyle State Park', 'ohiopyle-state-park', 'Fayette', {
    lat:39.88783, lon:-79.49427,
    status:'seasonal', season:{open:'April', close:'Mid-December', note:'Advance reservations are required for campsites.'}, types:['tent','rv','cabin','group'],
    sites:{total:200, hookups:'electric', hookupNote:'About 200 sites including 27 walk-to sites and three multi-sites; many have electric hookups. Cottages and yurts are also offered.'},
    amen:{showers:true, dump:true, firepit:true}, fam:{kidNote:'Gateway to whitewater and the Laurel Highlands; yurts and cottages sleep five.'},
    hi:['Laurel Highlands base for the Youghiogheny River'], caut:['Coordinates are the park coordinates printed on the DCNR page, not the campground gate.','Site count is "about 200" per the page.','Park phone not stated on the page.'], src:[PA_MAP]
  });
  pa('pa-black-moshannon-campground', 'Black Moshannon State Park Campground', 'Black Moshannon State Park', 'black-moshannon-state-park', 'Centre', {
    status:'seasonal', season:{open:'April', close:'December'}, types:['tent','rv'],
    caut:['Only the season was verified (DCNR camping location list). Site count, facilities and phone not read.'], src:[PA_MAP]
  });
  pa('pa-bald-eagle-letterman-campground', 'Bald Eagle State Park Campground (Letterman)', 'Bald Eagle State Park', 'bald-eagle-state-park', 'Centre', {
    status:'seasonal', season:{open:'April', close:'December', note:'Letterman Campground April to December; the Rustic Campground runs May to October.'}, types:['tent','rv'],
    caut:['Only the seasons were verified (DCNR camping location list). Site count, facilities and phone not read.'], src:[PA_MAP]
  });
  pa('pa-laurel-hill-campground', 'Laurel Hill State Park Campground', 'Laurel Hill State Park', 'laurel-hill-state-park', 'Somerset', {
    status:'seasonal', season:{open:'April', close:'October'}, types:['tent','rv'],
    caut:['Only the season was verified (DCNR camping location list). Site count, facilities and phone not read.'], src:[PA_MAP]
  });
  K('pa-willow-bay-campground-allegheny-nf', 'Willow Bay Campground', 'Allegheny National Forest (Kinzua area)', 'USDA Forest Service', 'PA', 'northeast', 'Warren', {
    status:'seasonal', season:{open:'April 1', close:'October 31', note:'Shower houses and water run April 1 to October 30; closes to camping after October 31.'},
    types:['tent','rv','cabin'], sites:{hookups:'electric', hookupNote:'About 99 listings across four loops including tent, RV, walk-to and cabin sites and one group picnic area; some sites have electric. Total not stated.'},
    amen:{showers:true, flush:true, vault:true, water:true, firepit:true, store:true},
    fam:{boating:true, kidNote:'Boat launch with courtesy dock, kayak and canoe rentals, firewood and ice sold in peak season.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/232127', phone:'877-444-6777'},
    contact:{phone:'814-368-4158', url:'https://www.recreation.gov/camping/campgrounds/232127'},
    hi:['Allegheny Reservoir shore with rentals','Heated cabins without plumbing'], caut:['Nightly fee not stated on the page read.','The 814-368-4158 number is the general contact; 814-362-4613 for facility questions.','Check-in 2 pm, check-out 12 noon.'],
    src:['https://www.recreation.gov/camping/campgrounds/232127']
  });

  /* ---------------- NEW JERSEY ---------------- */
  var NJA = 'New Jersey State Park Service';
  var NJ_FEES = 'https://www.nj.gov/dep/parksandforests/parks/relatedfees.html';
  var NJ_CAMP = 'https://nj.gov/dep/parksandforests/parks/campreserv.html';
  var NJ_PIN = 'https://www.nj.gov/pinelands/infor/fact/Camping_Lodging_Pinelands.pdf';
  var NJ_FEE = 'Statewide campsite fee: $20 NJ resident / $25 non-resident per night (fee page undated; wilderness sites $17/$22, primitive $3/$5 per person). Residents 62+ get $2 off. Park-specific site types not verified: check the official page.';
  function nj(id, name, parent, county, o){
    o = o || {};
    o.fees = mix({nightlyMin:20, nightlyMax:25, note:NJ_FEE}, o.fees);
    o.book = mix({system:'NJ State Parks reservations', url:'https://camping.nj.gov', phone:null, window:'Cabins up to 11 months ahead; other facilities not stated (NJ page last updated Aug 2020).'}, o.book);
    o.src = [NJ_CAMP, NJ_FEES].concat(o.src || []);
    o.caut = (o.caut || []).concat(['Site count, season and facilities were not verified.']);
    K(id, name, parent, NJA, 'NJ', 'northeast', county, o);
  }
  nj('nj-bass-river-state-forest-campground', 'Bass River State Forest Campground', 'Bass River State Forest', 'Burlington', {
    contact:{phone:'609-296-1114', address:'762 Stage Road, Bass River Twp, NJ 08224', url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, src:[NJ_PIN],
    caut:['Phone and address are from a Pinelands Commission list dated November 2021: confirm.']
  });
  nj('nj-brendan-byrne-state-forest-campground', 'Brendan T. Byrne State Forest Campground', 'Brendan T. Byrne State Forest', 'Burlington', {
    contact:{phone:'609-726-1191', address:'Mile Marker 1, Route 72 East, Woodland Twp, NJ 08088', url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, src:[NJ_PIN],
    caut:['Phone and address are from a Pinelands Commission list dated November 2021: confirm.']
  });
  nj('nj-belleplain-state-forest-campground', 'Belleplain State Forest Campground', 'Belleplain State Forest', 'Cape May', {
    contact:{phone:'609-861-2404', address:'1 Henkinsifkin Road, Woodbine, NJ 08270', url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, src:[NJ_PIN],
    hi:['Heated lean-tos are offered at Belleplain per the NJ fee page ($40 resident / $45 non-resident)'],
    caut:['Phone and address are from a Pinelands Commission list dated November 2021: confirm.']
  });
  nj('nj-wharton-state-forest-campground', 'Wharton State Forest Campgrounds', 'Wharton State Forest', null, {
    contact:{phone:'609-561-0024', address:'31 Batsto Road, Hammonton, NJ 08037', url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, src:[NJ_PIN],
    caut:['609-561-0024 is the Batsto office; the Atsion office is 609-268-0444 (Pinelands Commission list, November 2021): confirm.']
  });
  nj('nj-stokes-state-forest-campground', 'Stokes State Forest Campground', 'Stokes State Forest', 'Sussex', {
    contact:{url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, caut:['Listed among the 19 NJ parks with camping; no phone was found on a page we could read.']
  });
  nj('nj-cheesequake-state-park-campground', 'Cheesequake State Park Campground', 'Cheesequake State Park', 'Middlesex', {
    contact:{url:'https://www.nj.gov/dep/parksandforests/parks/campreserv.html'}, caut:['Listed among the 19 NJ parks with camping; no phone was found on a page we could read.']
  });

  /* ---------------- DELAWARE ---------------- */
  var DEA = 'Delaware State Parks';
  var DE_RATES = 'https://www.destateparks.com/wp-content/uploads/2025/02/business_Rate_Charges.pdf';
  var DE_ART = 'https://www.destateparks.com/5-campgrounds-in-delaware-for-your-next-camping-trip/';
  var DE_NOTE = ' Rates are the 2025 schedule: lowest is winter weekday resident, highest is summer weekend non-resident; $4 reservation fee per reservation, premium sites add $5 to $10, extra campers $2 per person beyond four. Confirm current rates.';
  var DE_BOOK = {system:'Delaware State Parks reservations', url:'https://www.destateparks.com', phone:null, window:null};
  function de(id, name, parent, slug, county, o){
    o.book = mix(DE_BOOK, o.book); o.fees = mix({reservationFee:4}, o.fees);
    o.contact = mix({url:'https://www.destateparks.com/park/' + slug + '/'}, o.contact);
    o.src = ['https://www.destateparks.com/park/' + slug + '/', DE_RATES, DE_ART].concat(o.src || []);
    K(id, name, parent, DEA, 'DE', 'northeast', county, o);
  }
  de('de-cape-henlopen-campground', 'Cape Henlopen State Park Campground', 'Cape Henlopen State Park', 'cape-henlopen', 'Sussex', {
    status:'open', season:{open:'Year-round', close:null, note:'RV reservations at select sites year-round; cabins year-round.'}, types:['tent','rv','cabin'],
    sites:{maxRvFt:45, hookups:'electric', hookupNote:'Water-only, electric and water (30, 50 and 100 amp), pull-through and walk-in tent sites. Max RV 45 ft back-in or 128 ft pull-through (Delaware article).'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, laundry:true},
    fam:{swim:true, beach:true, playground:true, bikeFriendly:true, nearTown:true, kidNote:'Guarded swimming beach (Memorial Day Saturday to Labor Day Monday, 9 am to 5 pm), seaside nature center, bike trails toward Lewes and Rehoboth.'},
    fees:{nightlyMin:20, nightlyMax:70, note:'Walk-in tent $20 to $53; electric and water $35 to $70; water only $26 to $60; camping cabin $80 to $170.' + DE_NOTE},
    contact:{phone:'302-645-8983'}, hi:['Ocean and bay beaches','Fort Miles museum nearby'], caut:['No street address printed on the page.']
  });
  de('de-delaware-seashore-campground', 'Delaware Seashore State Park Campground', 'Delaware Seashore State Park', 'delaware-seashore', 'Sussex', {
    status:'open', season:{open:'Year-round', close:null, note:'Winter camping only for self-contained units.'}, types:['tent','rv'],
    sites:{maxRvFt:54, hookups:'full', hookupNote:'Two campgrounds either side of Indian River Inlet; full hookup, no-hookup and tent-only sites. Max RV 52 ft back-in or 54 ft pull-through (Delaware article).'},
    amen:{showers:true, flush:true, dump:true, store:true, pets:true},
    fam:{swim:true, beach:true, playground:true, fishing:true, boating:true, kidNote:'Guarded swim beach Memorial Day Saturday to Labor Day Monday, 9 am to 5 pm; Life-Saving Station museum. Parts of the beaches north and south of the inlet are closed Sept 15, 2026 to Mar 15, 2027 for sand bypass work.'},
    fees:{nightlyMin:20, nightlyMax:75, note:'Tent only $20 to $53; no hookup $25 to $58; full hookup $32 to $75.' + DE_NOTE},
    contact:{phone:'302-227-2800'}, book:{window:'Up to one year ahead, up to 14 nights; two-night minimum on weekends.'},
    caut:['Campfires are not permitted at the park; outside firewood is banned.','Check-in 1 pm, check-out noon.','Two campgrounds: confirm which side your site is on.']
  });
  de('de-killens-pond-campground', 'Killens Pond State Park Campground', 'Killens Pond State Park', 'killens-pond', 'Kent', {
    status:'open', season:{open:'Year-round', close:null}, types:['tent','rv','cabin'],
    sites:{total:76, maxRvFt:40, hookups:'electric', hookupNote:'59 RV/tent sites with electric and water plus 17 walk-in tent-only sites (total is the sum); 11 cabins. Max RV 40 ft back-in (Delaware article).'},
    amen:{showers:null, dump:true, store:true},
    fam:{swim:true, playground:true, boating:true, fishing:true, kidNote:'Killens Pond Waterpark (main, leisure and baby pools) open Memorial Day weekend to Labor Day, weekends-only at times. Pond swimming not mentioned.'},
    fees:{nightlyMin:17, nightlyMax:48, note:'Walk-in tent $17 to $37; water and electric $23 to $48.' + DE_NOTE},
    contact:{phone:'302-284-4526'}, hi:['Waterpark and nature center'], caut:['Senior discount $1 per night at Killens Pond, Lums Pond and Trap Pond only.']
  });
  de('de-trap-pond-campground', 'Trap Pond State Park Campground', 'Trap Pond State Park', 'trap-pond', 'Sussex', {
    status:'open', season:{open:'Year-round', close:null}, types:['tent','rv','cabin'],
    sites:{total:142, maxRvFt:57, hookups:'electric', hookupNote:'142 sites on the north shore, 130 with water and electric; camping cabins and yurts also offered. Max RV 57 ft back-in (Delaware article).'},
    amen:{showers:true, dump:true, store:true, laundry:true},
    fam:{playground:true, boating:true, easyTrails:true, kidNote:'Baldcypress Nature Center and trails; swimming not mentioned on the page.'},
    fees:{nightlyMin:17, nightlyMax:48, note:'Walk-in tent $17 to $37; water and electric $23 to $48 (island tent sites $43 to $89, camping cabin and yurt rates separate).' + DE_NOTE},
    contact:{phone:'302-875-5153'}, hi:['Baldcypress swamp and pond paddling','Yurts and camping cabins']
  });
  de('de-lums-pond-campground', 'Lums Pond State Park Campground', 'Lums Pond State Park', 'lums-pond', 'New Castle', {
    status:'open', season:{open:'Year-round', close:null}, types:['tent','rv'],
    sites:{maxRvFt:50, hookups:'full', hookupNote:'Full-hookup RV sites and walk-in tent sites; counts not stated. Max RV 50 ft back-in (Delaware article).'},
    amen:{dump:true, store:true},
    fam:{playground:true, fishing:true, boating:true, kidNote:'Fishing pier, nature center and an off-leash dog park per the Delaware article; swimming not mentioned.'},
    fees:{nightlyMin:17, nightlyMax:64, note:'Walk-in tent $17 to $37; full hookup $32 to $64.' + DE_NOTE},
    contact:{phone:'302-368-6989'}, hi:['Playground and fishing pier']
  });

  /* ---------------- NEW YORK (State Parks, NYC-region gaps) ---------------- */
  var NYS = 'New York State Parks';
  var NY_FEES = 'https://parks.ny.gov/camping/fees-policies';
  var NY_BOOK = {system:'ReserveAmerica (NY State Parks)', url:'https://newyorkstateparks.reserveamerica.com/', phone:'800-456-2267', window:null};
  var NY_FEE = 'Statewide base (rate page undated): standard site $17 NY resident / $22 non-resident, primitive $14 / $19, plus per-night add-ons (weekend/holiday $4, electric $7 to $9, full hookup $13 to $15, waterfront $6, platform $3; flagship campgrounds +$3). $7.25 reservation fee. Which add-ons apply here is not stated.';
  K('ny-wildwood-state-park-campground', 'Wildwood State Park Campground', 'Wildwood State Park', NYS, 'NY', 'northeast', 'Suffolk', {
    lat:40.96083, lon:-72.79639,
    status:'seasonal', season:{open:'April 16', close:'October 10', note:'Dates shown are the 2027 season (page read Oct 2026): loops T, B, D from April 16; loops A, C, E from May 28; cottages April 16 to October 16.'},
    types:['tent','rv','cabin'], sites:{total:314, hookupNote:'314 campsites plus 10 cottages (page total 324).'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true},
    fam:{swim:true, beach:true, playground:true, kidNote:'Beach swimming, playground, ball courts, concession, biking and hiking.'},
    fees:{note:NY_FEE}, book:NY_BOOK, contact:{phone:'631-929-4314', url:'https://newyorkstateparks.reserveamerica.com/camping/wildwood-state-park/r/campgroundDetails.do?contractCode=NY&parkId=288'},
    hi:['Long Island Sound beach and bluff-top camping'], caut:['Coordinates are the ones printed on the reservation page.'],
    src:['https://newyorkstateparks.reserveamerica.com/camping/wildwood-state-park/r/campgroundDetails.do?contractCode=NY&parkId=288', NY_FEES]
  });
  K('ny-beaver-pond-campground-harriman', 'Beaver Pond Campground', 'Harriman State Park (Beaver Pond)', NYS, 'NY', 'northeast', null, {
    lat:41.23083, lon:-74.06917,
    status:'seasonal', season:{open:'April 17', close:'October 11', note:'2026 season; Section A runs May 22 to September 6, 2026. 2027: April 16 to October 10; Section A May 21 to September 5.'},
    types:['tent','rv'], sites:{total:129}, amen:{showers:true, flush:true, dump:true, laundry:true, firepit:true},
    fam:{swim:true, beach:true, fishing:true, boating:true, kidNote:'Swimming beach when lifeguards are on duty; boat launch.'},
    fees:{note:NY_FEE}, book:NY_BOOK, contact:{phone:'845-947-2792', url:'https://newyorkstateparks.reserveamerica.com/camping/beaver-pond-state-park/r/campgroundDetails.do?contractCode=NY&parkId=392'},
    hi:['Hudson Highlands camping with a swim beach'], caut:['Coordinates printed on the reservation page.'],
    src:['https://newyorkstateparks.reserveamerica.com/camping/beaver-pond-state-park/r/campgroundDetails.do?contractCode=NY&parkId=392', NY_FEES]
  });
  K('ny-lake-taghkanic-campground', 'Lake Taghkanic State Park Campground', 'Lake Taghkanic State Park', NYS, 'NY', 'northeast', 'Columbia', {
    status:'seasonal', season:{open:'May 15', close:'October 25', note:'2026 camping season.'}, types:['tent','rv','cabin'],
    sites:{maxRvFt:20, hookupNote:'Tent sites, raised deck platform sites, trailers/RVs up to 20 ft, cabins and cottages. Site count not stated.'},
    amen:{showers:true, store:true, pets:true, ada:true},
    fam:{swim:true, beach:true, kidNote:'West Beach open for swimming only in 2026 (East Beach closed); $10 vehicle entrance fee on beach dates.'},
    fees:{nightlyMin:17, nightlyMax:24, extraVehicle:10, reservationFee:7.25, note:'Tent $17 to $24; deck platform $20 Sun to Thu and $24 Fri to Sun/holidays; RV up to 20 ft $17 weekday and $21 weekend; $5 per night non-resident surcharge. Extra vehicle beyond two $10.'},
    book:NY_BOOK, contact:{phone:'518-851-3631', url:'https://parks.ny.gov/visit/state-parks/lake-taghkanic-state-park', address:'1528 Route 82, Ancram, NY 12502'},
    hi:['Lake beach and campground store'], caut:['Maximum of two pets in the campground, crated or on a leash 6 ft or less.','Coordinates on the page are for entrances only, so lat/lon are null. Campers, trailers and RVs use the Route 82 entrance.'],
    src:['https://parks.ny.gov/visit/state-parks/lake-taghkanic-state-park', NY_FEES]
  });

  /* ---------------- ILLINOIS ---------------- */
  var ILA = 'Illinois Department of Natural Resources';
  var IL_FEES = 'https://dnr.illinois.gov/content/dam/soi/en/web/dnr/parks/camp/documents/campingfeeschedule.pdf';
  var IL_BOOK = {system:'ExploreMoreIL', url:'https://recreation.exploremoreil.com', phone:null, window:null};
  var IL_FEE = 'IDNR schedule (undated; read Oct 2026): Class A $20 and A Premium $25 per night (camping fee plus $10 utility fee), $35 for A Premium on Memorial Day, July 4 and Labor Day weekends; $5 reservation fee. Which class applies at this campground is not confirmed. IDNR also posted a document about camping fee changes for 2027 (title seen, not read): confirm current rates.';
  K('il-rock-cut-state-park-campground', 'Rock Cut State Park Campground', 'Rock Cut State Park', ILA, 'IL', 'midwest', 'Winnebago', {
    types:['tent','rv','horse'], sites:{total:270, hookups:'electric', hookupNote:'210 Class A Premium and 60 Class B/S Premium sites (total is the sum); one primitive cabin; equestrian site on Hart Road, first come.'},
    amen:{showers:true, flush:true, water:true, dump:true}, season:{note:'November to April only electricity is available (no water or dump station). Operating dates not stated.'},
    fam:{playground:true, boating:true, kidNote:'Playground equipment and boat launch at the park.'},
    fees:{reservationFee:5, note:IL_FEE}, book:IL_BOOK, contact:{url:'https://dnr.illinois.gov/parks/camp/park.rockcut.html'},
    hi:['Electric sites at every site'], caut:['Park office no longer takes reservations: book through ExploreMoreIL.','Alcohol-free park, strictly enforced.'],
    src:['https://dnr.illinois.gov/parks/camp/park.rockcut.html', IL_FEES]
  });
  K('il-chain-o-lakes-state-park-campground', 'Chain O\' Lakes State Park Campground', 'Chain O\' Lakes State Park', ILA, 'IL', 'midwest', 'Lake', {
    status:'seasonal', season:{open:'March 1', close:'October 25', note:'2026 season: limited sites March 1; full campground reservable from April 1; closes 10/25/26. Fox Den is walk-in only until electrical upgrades are done.'},
    types:['tent','rv','group'], sites:{total:238, hookupNote:'151 Class A-Premium sites (Honey Suckle Hollow and Fox Den) and 87 Class B-Premium sites (total is the sum); youth group camp for 150.'},
    fees:{nightlyMin:12, nightlyMax:25, reservationFee:5, note:'Class A-Premium $25 ($35 on Memorial Day, July 4 and Labor Day weekends); Class B-Premium $12. $5 non-refundable reservation fee.'},
    book:{system:'ExploreMoreIL', url:'https://recreation.exploremoreil.com', phone:'866-716-6550'}, contact:{url:'https://dnr.illinois.gov/parks/camp/park.chainolakes.html'},
    caut:['Maximum stay 14 nights in a 30-day period; alcohol prohibited; gathering firewood in the park is strictly prohibited.','Amenities (showers, toilets, hookups) were not listed on the 2026 page.'],
    src:['https://dnr.illinois.gov/parks/camp/park.chainolakes.html']
  });
  K('il-giant-city-state-park-campground', 'Giant City State Park Campground', 'Giant City State Park', ILA, 'IL', 'midwest', 'Jackson', {
    types:['tent','rv','horse'], sites:{total:99, hookups:'electric', hookupNote:'85 Class A sites (water, electric, showers) plus 14 Class C walk-in tent sites (total is the sum); a separate Class A equestrian campground.'},
    amen:{showers:true, water:true, vault:true, firepit:true}, season:{note:'Class A shower building closes the day after the first shotgun deer season and reopens April 1; camping dates not stated.'},
    fees:{reservationFee:5, note:IL_FEE}, book:IL_BOOK, contact:{url:'https://dnr.illinois.gov/parks/camp/park.giantcity.html'},
    hi:['Class A reservable sites and walk-in Class C tent area'],
    caut:['Walk-ins use the camp host or the self-registration drop box.','Park-specific phone not stated; page shows only the general IDNR line 217-782-6302.'],
    src:['https://dnr.illinois.gov/parks/camp/park.giantcity.html', IL_FEES]
  });
  K('il-oak-point-lake-glendale-shawnee-nf', 'Oak Point Campground (Lake Glendale)', 'Shawnee National Forest (Lake Glendale)', 'USDA Forest Service', 'IL', 'midwest', 'Pope', {
    status:'seasonal', season:{open:'April 1', close:'December 15', note:'Shawnee campgrounds are usually open April 1 to Dec 15 with some exceptions (forest-wide statement).'},
    types:['tent','rv'], sites:{total:59, hookups:'electric', hookupNote:'35 electric/water sites and 24 non-electric sites (total is the sum).'},
    fees:{note:'Nightly fee not printed on the forest page; it points to a Recreation Site Information Chart. Check the official page.'},
    book:{system:null, url:'https://www.fs.usda.gov/r09/shawnee/recreation/camping-cabins', phone:null, firstComeNote:'The forest page says it does not accept reservations; campsites are first come, first served. Large groups at Lake Glendale go through the concessionaire.'},
    contact:{phone:'618-253-7114', url:'https://www.fs.usda.gov/r09/shawnee/recreation/camping-cabins'},
    caut:['618-253-7114 is the Shawnee National Forest supervisor\'s office, not the campground.','The forest page mentions a "Has Reservations" filter without saying which sites: confirm before driving far.'],
    src:['https://www.fs.usda.gov/r09/shawnee/recreation/camping-cabins']
  });
})();
