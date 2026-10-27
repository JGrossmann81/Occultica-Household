/* Campica data pack: Colorado and New Mexico campgrounds (state parks, NPS units, a few national-forest campgrounds).
   Facts only from pages listed in SOURCES-camps-co-nm.md. Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. lat/lon are null unless a readable page gave coordinates.
   Fees: given only where an agency page (or, where noted in src, a named listing) stated them. */
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
  var CPW = 'Colorado Parks & Wildlife', NPS = 'National Park Service', USFS = 'US Forest Service', NMSP = 'New Mexico State Parks';
  var CPWBOOK = {system:'cpwshop', url:'https://www.cpwshop.com/campinghome.page', phone:'800-244-5613', window:'Up to 6 months ahead'};
  var NMBOOK = {system:'ReserveAmerica', url:'https://newmexicostateparks.reserveamerica.com/', phone:'877-664-7787', window:'Up to 6 months ahead (not every site is reservable online)'};
  var RGPHONE = '877-444-6777';
  var CPWPASS = 'A daily vehicle pass (about $10 to $15 at last read) or annual pass is also required.';
  var NMFEE = {nightlyMin:10, nightlyMax:35, note:'New Mexico State Parks statewide schedule (in effect from Jan 2025): $10 to $15 primitive and $15 to $20 developed up to $25 to $35 with electric and sewer (the lower number is a New Mexico resident, the higher a non-resident). Which site types this park has was not confirmed: check the park. Hookup add-ons apply to annual permit holders.'};
  var NMSRC = ['https://www.emnrd.nm.gov/spd/camping/','https://www.emnrd.nm.gov/spd/?p=12123'];
  function cpwFee(min, max, extra){ return {nightlyMin:min, nightlyMax:max, note:'Per-night range read from the park page. ' + CPWPASS + (extra ? ' ' + extra : '')}; }
  function nm(id, name, county, o){ o = o || {}; var b = mix(NMBOOK, o.book || {});
    K(id, name, name.replace(/ State Park$/, '') + ' State Park', NMSP, 'NM', 'new-mexico', county, {
      lat:o.lat, lon:o.lon, elev:o.elev, season:o.season, status:o.status, types:o.types || ['tent','rv'], sites:o.sites, amen:o.amen, fam:o.fam,
      fees:o.fees || NMFEE, book:b, contact:mix({phone:null, url:'https://www.emnrd.nm.gov/spd/find-a-park/', address:null}, o.contact || {}),
      hi:o.hi, caut:o.caut, src:NMSRC.concat(o.src || [])}); }

  /* ---------------- COLORADO: STATE PARKS ---------------- */
  K('co-cheyenne-mountain-state-park', 'Cheyenne Mountain State Park Campground', 'Cheyenne Mountain State Park', CPW, 'CO', 'colorado', 'El Paso', {
    status:'open', statusNote:'Winter reservations are limited to one loop.', types:['tent','rv','group','cabin'],
    season:{open:'Year-round', close:null, note:'Showers and laundry close November to April.'},
    sites:{total:61, hookups:'full', hookupNote:'Tent sites and full hook-up RV sites, plus a private group loop. Two ADA cabins (about $120 a night at last read).'},
    amen:{showers:true, laundry:true, flush:true, firepit:true, store:true, pets:true, ada:true, cell:true},
    fam:{playground:true, nearTown:'Colorado Springs, CO'}, fees:cpwFee(21, 41), book:mix(CPWBOOK, {}),
    contact:{phone:'719-576-2016', url:'https://cpw.state.co.us/state-parks/cheyenne-mountain-state-park/cheyenne-mountain-state-park-camping-lodging', address:'410 JL Ranch Heights, Colorado Springs, CO 80926'},
    hi:['Playground at the campground','Firewood and ice sold on site','Cabins that sleep six'], caut:['Stay limit is 14 days in any 28-day period.'],
    src:['https://cpw.state.co.us/placestogo/parks/CheyenneMountain/Pages/Camping-Cabins.aspx']});
  K('co-chatfield-state-park', 'Chatfield State Park Campground', 'Chatfield State Park', CPW, 'CO', 'colorado', 'Douglas', {
    lat:39.534024, lon:-105.071313, types:['tent','rv','group'], status:'open',
    sites:{total:197, hookups:'electric', hookupNote:'197 sites in four campgrounds; every family site has electric and many have full hookups. 10 reservable group sites in addition.'},
    amen:{pets:null}, fees:cpwFee(null, null), book:mix(CPWBOOK, {}),
    contact:{phone:'303-791-7275', url:'https://cpw.state.co.us/placestogo/Parks/Chatfield', address:'11500 N. Roxborough Park Rd., Littleton, CO 80125'},
    fam:{swim:true, beach:true, nearTown:'Littleton and Denver, CO', kidNote:'Swim beach in the park (per CPW). Enter by GPS with the Roxborough address; do not type the park name.'},
    hi:['Swim beach','Close to Denver'], caut:['Campground office is closed Monday and Tuesday.','Nightly camping fee was not stated on the page read.'],
    fees:{note:'Camping fee not shown on the page read. ' + CPWPASS},
    src:['https://cpw.state.co.us:443/placestogo/parks/Chatfield','https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf']});
  K('co-cherry-creek-state-park', 'Cherry Creek State Park Campground', 'Cherry Creek State Park', CPW, 'CO', 'colorado', 'Arapahoe', {
    types:['tent','rv','group'], status:'open',
    season:{open:'Year-round', close:null, note:'Winter (Nov 1 to Mar 31) camping only in the Abilene Loop, reservation required. Dump station closed in winter, reopens Apr 1.'},
    sites:{total:135, hookups:'electric', hookupNote:'Full hook-up and tent sites plus group sites; some sites reserved for campers with disabilities.'},
    amen:{showers:true, laundry:true, dump:true, ada:true, firepit:null}, fees:cpwFee(28, 41), book:mix(CPWBOOK, {cancelNote:'Reservations are not taken at the park.'}),
    contact:{phone:'303-690-1166', url:'https://cpw.state.co.us/placestogo/parks/CherryCreek/Pages/Camping.aspx', address:'4201 South Parker Road, Aurora, CO 80014'},
    fam:{nearTown:'Aurora and Denver, CO'}, hi:['Open all year','Close to Denver'], caut:['Stay limit is 14 days in any 45-day period.'],
    src:['https://cpw.state.co.us/placestogo/parks/CherryCreek/Pages/Camping.aspx']});
  K('co-ridgway-state-park', 'Ridgway State Park Campgrounds', 'Ridgway State Park', CPW, 'CO', 'colorado', 'Ouray', {
    types:['tent','rv','group','yurt','walk-in'], status:'open', season:{open:'Year-round', close:null, note:'In winter select Elk Ridge and Dakota Terraces sites are plowed with heated restrooms and showers.'},
    sites:{total:282, hookups:'electric', hookupNote:'Dakota Terraces and Elk Ridge have 30-amp electric and shared water; Pa-Co-Chu-Puk has 50-amp with individual water and sewer. 25 walk-in tent sites. 3 yurts (about $90 a night).'},
    amen:{showers:true, flush:true, dump:true, laundry:true, firepit:true, bearBox:true, ada:true, store:true},
    fam:{swim:true, beach:true, playground:true, fishing:true, boating:true, kidNote:'Dutch Charlie area has a swim beach, boat ramp and marina store.'},
    fees:cpwFee(28, 41, 'Yurts about $90 a night.'), book:mix(CPWBOOK, {cancelNote:'Accessible sites can only be reserved by phone with a valid disability placard.'}),
    contact:{phone:'970-626-5822', url:'https://cpw.state.co.us/state-parks/ridgway-state-park/ridgway-state-park-camping-lodging', address:'28555 Highway 550, Ridgway, CO 81432'},
    hi:['Free showers','Heated yurts','Swim beach at Dutch Charlie'], caut:['Reservation required for each day of stay.'],
    src:['https://cpw.state.co.us/state-parks/ridgway-state-park/ridgway-state-park-camping-lodging']});
  K('co-rifle-falls-state-park', 'Rifle Falls State Park Campground', 'Rifle Falls State Park', CPW, 'CO', 'colorado', 'Garfield', {
    lat:39.67389, lon:-107.7, types:['tent','rv','walk-in'], status:'open',
    season:{open:'Year-round', close:null, note:'Winter camping at limited capacity, reservation only.'},
    sites:{total:20, hookups:'some', hookupNote:'13 drive-in and 7 walk-in sites along East Rifle Creek; electricity at many sites.'},
    amen:{water:true, vault:null, bearBox:true, firepit:true, ada:true}, fees:cpwFee(22, 36),
    book:mix(CPWBOOK, {}), contact:{phone:'970-625-1607', url:'https://cpw.state.co.us/state-parks/rifle-falls-state-park/rifle-falls-state-park-camping-lodging', address:'5775 Highway 325, Rifle, CO 81650'},
    hi:['Waterfall and caves nearby','Bear-proof food box at each site'], caut:['Coordinates are the park centre from Wikipedia, not the campground gate.','Stay limit 14 days in 28.'],
    src:['https://cpw.state.co.us/state-parks/rifle-falls-state-park/rifle-falls-state-park-camping-lodging','https://en.wikipedia.org/wiki/Rifle_Falls_State_Park']});
  K('co-stagecoach-state-park', 'Stagecoach State Park Campgrounds', 'Stagecoach State Park', CPW, 'CO', 'colorado', 'Routt', {
    types:['tent','rv','group'], status:'seasonal', season:{open:'May 15', close:'Sep 30', note:'Winter camping is limited to 4 to 6 sites at Pinnacle (reservation required) with vault toilets and electric; water, showers and dump station are off Oct 31 to May 15.'},
    sites:{total:92, hookups:'electric'}, amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:true, ada:true}, fees:cpwFee(null, null),
    book:mix(CPWBOOK, {}), contact:{phone:'970-736-2436', url:'https://cpw.state.co.us/placestogo/parks/Stagecoach/Pages/Camping.aspx', address:'25500 County Road 14, Oak Creek, CO 80467'},
    fees:{note:'Nightly camping fee not read. ' + CPWPASS},
    fam:{boating:true, nearTown:'Oak Creek and Steamboat Springs, CO'}, caut:['Max 6 people per site; stay limit 14 days in 28.'],
    src:['https://cpw.state.co.us/placestogo/parks/Stagecoach/Pages/Camping.aspx']});
  K('co-dutch-hill-steamboat-lake', 'Dutch Hill Campground', 'Steamboat Lake State Park', CPW, 'CO', 'colorado', 'Routt', {
    elev:8100, types:['tent','rv','walk-in'], status:'seasonal', season:{open:'Late May', close:'Mid Oct', note:'Depends on snow. Reservations open the Friday before Memorial Day to the weekend after Labor Day. 12 electric winter sites in the marina lot, first-come.'},
    sites:{total:73, hookups:'electric', hookupNote:'Wheeler loop 37 electric (50-amp); Bridge Island 16 non-electric; 20 walk-in tent sites. Roof-top tents not allowed at the walk-in sites.'},
    amen:{showers:true, laundry:true, dump:true, store:true, firepit:true}, fees:{note:'Nightly camping fee not shown on the page read. ' + CPWPASS},
    fam:{swim:true, beach:true, boating:true, kidNote:'Marina, store and swim beach.'},
    book:mix(CPWBOOK, {}), contact:{phone:'970-879-3922', url:'https://cpw.state.co.us/placestogo/parks/SteamboatLake/Pages/Campsites.aspx', address:'PO Box 750, Clark, CO 80428'},
    caut:['Elevation 8,100 ft is from a travel article for the lake area; the CPW page gave none.'],
    src:['https://cpw.state.co.us/placestogo/parks/SteamboatLake/Pages/Campsites.aspx','https://cpw.state.co.us/sites/default/files/dam/jxbwjvncno/steamboat-lake-and-pearl-lake-state-parks.pdf']});
  K('co-sunrise-vista-steamboat-lake', 'Sunrise Vista Campground', 'Steamboat Lake State Park', CPW, 'CO', 'colorado', 'Routt', {
    types:['tent','rv'], status:'seasonal', season:{open:'Late May', close:'Mid Oct', note:'Depends on snow.'},
    sites:{total:109, hookups:'some', hookupNote:'Arnica 49, Harebell 17 and Rosecrown 7 are non-electric; Larkspur 12, Lupine 7 and Yarrow 17 are electric (50-amp). Counts from the page site lists; the page itself says 188 sites for the park.'},
    amen:{showers:true, laundry:true, firepit:true}, fees:{note:'Nightly camping fee not shown on the page read. ' + CPWPASS},
    book:mix(CPWBOOK, {}), contact:{phone:'970-879-3922', url:'https://cpw.state.co.us/placestogo/parks/SteamboatLake/Pages/Campsites.aspx', address:'PO Box 750, Clark, CO 80428'},
    hi:['Camper services building and amphitheater'], caut:['Linked to Dutch Hill by a quarter-mile foot trail.'],
    src:['https://cpw.state.co.us/placestogo/parks/SteamboatLake/Pages/Campsites.aspx']});
  K('co-pearl-lake-state-park', 'Pearl Lake State Park Campground', 'Pearl Lake State Park', CPW, 'CO', 'colorado', 'Routt', {
    types:['tent','rv'], sites:{hookups:'none', hookupNote:'Non-electric campsites only.'}, fees:{note:'Nightly camping fee and site count not read. ' + CPWPASS},
    book:mix(CPWBOOK, {}), contact:{phone:'970-879-3922', url:'https://cpw.state.co.us/state-parks', address:null}, caut:['Details limited: check CPW for season and count. The brochure lists 2 yurts.'],
    src:['https://cpw.state.co.us/sites/default/files/dam/jxbwjvncno/steamboat-lake-and-pearl-lake-state-parks.pdf','https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf']});
  var LP = {types:['tent','rv'], book:CPWBOOK, contact:{phone:'719-561-9320', url:'https://cpw.state.co.us/state-parks', address:null}};
  function lp(id, name, total, hook, note, extra){
    K(id, name, 'Lake Pueblo State Park', CPW, 'CO', 'colorado', 'Pueblo', mix({types:['tent','rv'], sites:{total:total, hookups:hook, hookupNote:note}, fees:{note:'Nightly fee not verified on a CPW page (a 2020s travel article listed roughly $20 to $36). ' + CPWPASS}, book:mix(CPWBOOK, {}),
      contact:{phone:'719-561-9320', url:'https://cpw.state.co.us/state-parks', address:null}, caut:['Site count and amenities come from one travel article; confirm with CPW (the article says the park has over 400 sites).'],
      src:['https://getawaycouple.com/pueblo-reservoir-camping','https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf']}, extra || {})); }
  lp('co-arkansas-point-lake-pueblo', 'Arkansas Point Campground', 86, 'electric', 'Electric (some listings also say water/sewer). Shower house and dump station.', {lat:38.25122438, lon:-104.734684, amen:{showers:true, dump:true, flush:true}, src:['https://getawaycouple.com/pueblo-reservoir-camping','https://thedyrt.com/camping/_/colorado-lake-pueblo-state-park-arkansas-point-campground']});
  lp('co-prairie-ridge-lake-pueblo', 'Prairie Ridge Campground', 72, 'some', 'Partial electric and water spigots; showers and dump station.', {amen:{showers:true, flush:true, dump:true}});
  lp('co-yucca-flats-lake-pueblo', 'Yucca Flats Campground', 77, 'some', 'Source is inconsistent on whether sites have water; three shower houses.', {amen:{showers:true, flush:true}, fam:{playground:true}});
  lp('co-juniper-breaks-lake-pueblo', 'Juniper Breaks Campground', 83, 'none', 'Dry camping on the north side; vault toilets and dump station.', {amen:{vault:true, dump:true, showers:false}});
  lp('co-kettle-creek-lake-pueblo', 'Kettle Creek Campground', 33, 'none', 'Dry camping with water spigots; 5 walk-in tent sites; no showers.', {amen:{vault:true, water:true, showers:false}});
  lp('co-eagle-view-lake-pueblo', 'Eagle View Campground', 15, 'electric', 'Electric sites; shower house and dump station.', {amen:{showers:true, flush:true, dump:true}, fam:{playground:true}});
  var BR = 'Per the undated CPW parks brochure: count and hookup type; confirm on the park page.';
  function br(id, name, parent, county, total, hook, phone, o){ o = o || {};
    K(id, name, parent, CPW, 'CO', 'colorado', county, mix({types:['tent','rv'], sites:{total:total, hookups:hook, hookupNote:BR}, fees:{note:'Nightly camping fee not read. ' + CPWPASS}, book:mix(CPWBOOK, {}),
      contact:{phone:phone, url:'https://cpw.state.co.us/state-parks', address:null}, caut:['Details limited to the CPW parks brochure; check the park page for season and fees.'],
      src:['https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf']}, o)); }
  br('co-navajo-state-park', 'Navajo State Park Campgrounds', 'Navajo State Park', 'Archuleta', 119, 'electric', '970-883-2208', {sites:{total:119, hookups:'full', hookupNote:'Brochure: electric and full hookups. Campendium names three campgrounds (Carracas, Rosa, Tiffany).'}, types:['tent','rv','cabin'], src:['https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf','https://campendium.com/blog/why-rvers-love-colorado-state-parks/']});
  br('co-mueller-state-park', 'Mueller State Park Campgrounds', 'Mueller State Park', 'Teller', 136, 'some', '719-687-2366', {sites:{total:136, hookups:'electric', hookupNote:'A travel article lists 136 campsites, 99 electric; the CPW brochure gave no count.'}, amen:{showers:true, laundry:true, dump:true}, fam:{playground:true}, types:['tent','rv','cabin'], status:'open', season:{open:'Year-round', close:null, note:null}, src:['https://campendium.com/blog/why-rvers-love-colorado-state-parks/','https://cpw.state.co.us:443/Documents/RulesRegs/Brochure/ParksBrochure.pdf']});
  br('co-golden-gate-canyon-state-park', 'Golden Gate Canyon State Park Campgrounds', 'Golden Gate Canyon State Park', 'Jefferson', null, 'electric', '303-582-3707', {types:['tent','rv','cabin','yurt'], caut:['The brochure lists 2 campgrounds, cabins and yurts but no consistent site count.']});
  br('co-state-forest-state-park', 'State Forest State Park Campgrounds', 'State Forest State Park', 'Jackson', null, 'electric', '970-723-8366', {types:['tent','rv','cabin','yurt'], caut:['Four campgrounds, cabins and yurts per the brochure; no site count read. Moose country.']});
  br('co-mancos-state-park', 'Mancos State Park Campground', 'Mancos State Park', 'Montezuma', 32, 'none', '970-533-7065', {sites:{total:32, hookups:'none', hookupNote:BR + ' 23 main plus 9 tent sites and 2 yurts; water at the main campground only.'}, types:['tent','rv','yurt']});
  br('co-highline-lake-state-park', 'Highline Lake State Park Campground', 'Highline Lake State Park', 'Mesa', 36, null, '970-858-7208', {season:{open:'Year-round', close:null, note:'Reservations required (brochure).'}, sites:{total:36, hookups:null, hookupNote:BR}});
  br('co-island-acres-james-robb-colorado-river', 'Island Acres Campground', 'James M. Robb Colorado River State Park', 'Mesa', 80, 'full', '970-464-0548');
  br('co-boyd-lake-state-park', 'Boyd Lake State Park Campground', 'Boyd Lake State Park', 'Larimer', 148, 'electric', '970-669-1739');
  br('co-jackson-lake-state-park', 'Jackson Lake State Park Campground', 'Jackson Lake State Park', 'Morgan', 233, 'some', '970-645-2551');
  br('co-eleven-mile-state-park', 'Eleven Mile State Park Campgrounds', 'Eleven Mile State Park', 'Park', 312, 'some', '719-748-3401', {caut:['Brochure lists 9 campgrounds and walk/boat-in sites; its text says 312 sites while an icon says 326.']});
  br('co-crawford-state-park', 'Crawford State Park Campground', 'Crawford State Park', 'Delta', 66, 'some', '970-921-5721');
  br('co-north-sterling-state-park', 'North Sterling State Park Campgrounds', 'North Sterling State Park', 'Logan', 141, 'electric', '970-522-3657', {caut:['Three campgrounds; reservation only per brochure.']});
  br('co-st-vrain-state-park', 'St. Vrain State Park Campgrounds', 'St. Vrain State Park', 'Weld', 87, 'electric', '303-678-9402', {caut:['Two year-round campgrounds per brochure.']});
  br('co-john-martin-reservoir-state-park', 'John Martin Reservoir State Park Campgrounds', 'John Martin Reservoir State Park', 'Bent', 213, 'some', '719-829-1801');
  br('co-lathrop-state-park', 'Lathrop State Park Campground', 'Lathrop State Park', 'Huerfano', 103, 'some', '719-738-2376');
  br('co-paonia-state-park', 'Paonia State Park Campground', 'Paonia State Park', 'Gunnison', 13, 'none', '970-921-5721', {types:['tent'], season:{open:null, close:null, note:'Closed October to May per the brochure.'}, caut:['Primitive; no drinking water per brochure.']});
  br('co-elkhead-reservoir-state-park', 'Elkhead Reservoir State Park Campground', 'Elkhead Reservoir State Park', 'Moffat', 15, 'none', '970-276-2061', {caut:['Bear\'s Ears campground, first-come per brochure.']});
  br('co-rifle-gap-state-park', 'Rifle Gap State Park Campgrounds', 'Rifle Gap State Park', 'Garfield', null, 'full', '970-625-1607', {caut:['Brochure lists 5 campgrounds and a dump station; no count.']});
  br('co-trinidad-lake-state-park', 'Trinidad Lake State Park Campground', 'Trinidad Lake State Park', 'Las Animas', null, 'full', null, {caut:['Brochure gave no phone or site count.']});

  /* ---------------- COLORADO: NPS ---------------- */
  var RGB = function(url, o){ return mix({system:'recreation.gov', url:url, phone:RGPHONE}, o || {}); };
  K('co-south-rim-black-canyon-of-the-gunnison', 'South Rim Campground', 'Black Canyon of the Gunnison National Park', NPS, 'CO', 'colorado', 'Montrose', {
    lat:38.5505556, lon:-107.6866667, elev:8000, types:['tent','rv'], status:'limited', statusNote:'A Recreation.gov mirror said Loops B and C were closed for wildfire damage with no reopening date; confirm with the park.',
    season:{open:'Year-round', close:null, note:'Peak May 18 to Sep 30; reservations open April 15 per the mirror listing.'},
    sites:{total:102, hookups:'electric', hookupNote:'Standard non-electric and electric sites; no water or sewer hookups.'},
    amen:{vault:true, flush:false, water:null, dump:false, bearBox:true, firepit:true, cell:false, ada:true},
    fees:{nightlyMin:20, nightlyMax:34, note:'$20 non-electric and $34 electric per night read on a Recreation.gov mirror (outdoorithm); confirm on Recreation.gov.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/234052', {window:'Per listing: opens April 15'}), contact:{phone:null, url:'https://www.nps.gov/blca/planyourvisit/camping.htm', address:null},
    caut:['No dump station or flush toilets; bring drinking water.','Stay limit 14 nights.'], src:['https://outdoorithm.com/campgrounds/Recreation.gov:234052:2592']});
  K('co-elk-creek-curecanti', 'Elk Creek Campground', 'Curecanti National Recreation Area', NPS, 'CO', 'colorado', 'Gunnison', {
    elev:7540, types:['tent','rv'], sites:{total:150, hookups:'some', hookupNote:'About 150 sites in loops A to D; 30 and 50 amp electric mostly in Loop D, a few in Loop C.'},
    amen:{dump:true, cell:null, showers:null}, fam:{boating:true, fishing:true, swim:true, rangerPrograms:true, kidNote:'Summer campfire programs and an amphitheater.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/234053'), contact:{phone:'970-641-2337', url:'https://www.nps.gov/cure/planyourvisit/campgrounds.htm', address:'24830 US Hwy 50, Gunnison, CO 81230'},
    fees:{note:'Nightly rate not shown on the Recreation.gov page read; a travel listing suggested roughly $24 to $34. Check the NPS page.'},
    caut:['Dump station goes offline around Oct 8 for winter.'], src:['https://www.recreation.gov/camping/campgrounds/234053?tab=info','https://thedyrt.com/camping/colorado/near/curecanti-national-recreation-area/with/standard']});
  K('co-stevens-creek-curecanti', 'Stevens Creek Campground', 'Curecanti National Recreation Area', NPS, 'CO', 'colorado', 'Gunnison', {
    elev:7540, types:['tent','rv'], sites:{total:53, hookups:'none', hookupNote:'All 53 sites standard non-electric.'}, amen:{water:true, firepit:null},
    season:{open:null, close:null, note:'Drinking water is on from late May to mid-September.'}, fam:{boating:true, fishing:true, swim:true},
    fees:{note:'Self-pay (scan and pay) station; rate not stated on the page read.'}, book:RGB('https://www.recreation.gov/camping/campgrounds/234055'),
    contact:{phone:'970-641-2337', url:'https://www.nps.gov/cure/planyourvisit/campgrounds.htm', address:null}, src:['https://www.recreation.gov/camping/campgrounds/234055/availability']});
  K('co-saddlehorn-colorado-national-monument', 'Saddlehorn Campground', 'Colorado National Monument', NPS, 'CO', 'colorado', 'Mesa', {
    types:['tent','rv'], status:'seasonal', season:{open:null, close:null, note:'B Loop year-round; A Loop Apr 1 to Oct 15; C Loop Apr 21 to Oct 15 (2026).'},
    sites:{maxRvFt:40, maxTrailerFt:40, hookups:'none', hookupNote:'Loops A and B: RVs up to 40 ft. Loop C: 19 ft maximum, no trailers. Total site count not stated.'},
    amen:{water:false}, fees:{nightlyMin:22, nightlyMax:22, note:'$22 per night, $11 with Senior or Access Pass.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/234778', {window:'6 months ahead, 2 weeks ahead and same day releases'}), contact:{phone:'970-858-2800', url:'https://www.nps.gov/colm/planyourvisit/camping.htm', address:null},
    caut:['No water in the campground in 2026 per NPS: bring about 1 gallon per person per day; refill at the Fruita Welcome Center.'], src:['https://www.nps.gov/colm/planyourvisit/camping.htm']});
  function dino(id, name, hi, lo, note){ K(id, name, 'Dinosaur National Monument', NPS, 'CO', 'colorado', 'Moffat', {types:['tent','rv'], fees:{nightlyMin:lo, nightlyMax:hi, note:'High-season / off-season standard rates from an NPS release effective Jan 1 2025 (archived; billing unit assumed per night); half price with Senior or Access Pass. ' + note},
    book:{system:null, url:'https://www.nps.gov/dino/planyourvisit/campgrounds.htm', phone:null}, contact:{phone:'435-781-7700', url:'https://www.nps.gov/dino/planyourvisit/campgrounds.htm'}, caut:['Roads can be impassable in wet weather; food storage required (black bear country). Site counts and season not read.'], src:['https://www.nps.gov/dino/learn/news/2025campingfeeincrease.htm','https://home.nps.gov/dino/planyourvisit/campgrounds.htm']}); }
  dino('co-echo-park-dinosaur', 'Echo Park Campground', 14, 12, 'Group site is $25.');
  dino('co-deerlodge-park-dinosaur', 'Deerlodge Park Campground', 14, 12, '');
  dino('co-gates-of-lodore-dinosaur', 'Gates of Lodore Campground', 14, 12, '');

  /* ---------------- COLORADO: NATIONAL FORESTS ---------------- */
  K('co-pawnee-campground-brainard-lake', 'Pawnee Campground', 'Arapaho and Roosevelt National Forests (Brainard Lake)', USFS, 'CO', 'colorado', 'Boulder', {
    elev:10400, types:['tent','rv'], status:'seasonal', season:{open:'May 1', close:'Nov 14', note:'Camping rules differ Nov 15 to Apr 30.'},
    sites:{total:47, hookups:'none'}, amen:{vault:true, water:true, bearBox:true, showers:false, dump:false},
    fees:{nightlyMin:29, nightlyMax:58, extraVehicle:8, note:'$29 single and $58 double site per night; Brainard Lake Recreation Area fees also apply.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/232282', {firstComeNote:'Walk-up sites released at 2 pm daily.'}), contact:{phone:'970-295-6600', url:'https://www.fs.usda.gov/r02/arp/recreation/pawnee-campground'},
    caut:['10,400 ft: cold nights and snow possible any month.'], src:['https://www.fs.usda.gov/r02/arp/recreation/pawnee-campground','https://www.recreation.gov/camping/campgrounds/232282?tab=info']});
  K('co-kelly-dahl-campground', 'Kelly Dahl Campground', 'Arapaho and Roosevelt National Forests', USFS, 'CO', 'colorado', 'Boulder', {
    elev:8600, types:['tent','rv'], sites:{total:46, hookups:'none'}, amen:{vault:true, water:true, firepit:true}, fam:{playground:true, nearTown:'Nederland, CO'},
    fees:{extraVehicle:8, note:'Base nightly fee not shown on the Recreation.gov page read; extra vehicle $8 per night.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/232280', {firstComeNote:'Sites 1 to 20 are first-come.'}), contact:{phone:null, url:'https://www.fs.usda.gov/r02/arp/recreation/camping-cabins'},
    caut:['Little shade. About 4 miles south of Nederland.'], src:['https://recreation.gov/camping/campgrounds/232280']});
  K('co-echo-lake-campground', 'Echo Lake Campground', 'Arapaho and Roosevelt National Forests (Mount Evans area)', USFS, 'CO', 'colorado', 'Clear Creek', {
    elev:10600, types:['tent','rv'], sites:{total:17, hookups:'none', hookupNote:'Listing shows 17 sites (13 standard, 4 tent-only) while its overview says 18.'}, amen:{vault:true, water:true, firepit:true},
    fees:{extraVehicle:8, note:'Base nightly fee not shown on the page read.'}, book:RGB('https://www.recreation.gov/camping/campgrounds/231857'), contact:{phone:null, url:'https://www.recreation.gov/camping/campgrounds/231857'},
    caut:['10,600 ft: altitude and cold nights.'], src:['https://www.recreation.gov/camping/campgrounds/231857?tab=info']});
  K('co-junction-creek-campground', 'Junction Creek Campground', 'San Juan National Forest', USFS, 'CO', 'colorado', 'La Plata', {
    elev:7300, types:['tent','rv','group'], sites:{hookups:'some', hookupNote:'Single and double sites, many with electric; group site for up to 50.'}, amen:{vault:true, water:true, firepit:true, ada:true},
    season:{open:null, close:null, note:'Extended season 9/27 to 10/18 (2025) without water.'}, fees:{note:'Nightly rate not shown on the page read.'},
    book:RGB('https://www.recreation.gov/camping/campgrounds/234475'), contact:{phone:'970-884-2512', url:'https://www.recreation.gov/camping/campgrounds/234475'}, caut:['Forest line given is general information, not the campground.'], src:['https://recreation.gov/camping/campgrounds/234475']});
  function silver(id, name, n, elev, note){ K(id, name, 'White River National Forest (Maroon Bells area)', USFS, 'CO', 'colorado', 'Pitkin', {elev:elev, types:['tent','rv'], sites:{total:n, hookups:'none', hookupNote:note},
    season:{open:null, close:null, note:'Silver Bar runs mid-May to early October.'}, book:RGB('https://www.recreation.gov/'), contact:{phone:null, url:'https://aspenchamber.org/explore/maroon-bells/camping/'},
    caut:['Site details come from the Aspen Chamber page only; verify on Recreation.gov. Fees not stated.'], src:['https://aspenchamber.org/explore/maroon-bells/camping/']}); }
  silver('co-silver-bar-maroon-bells', 'Silver Bar Campground', 4, 8460, '4 walk-in tent-only sites; reservations required.');
  silver('co-silver-bell-maroon-bells', 'Silver Bell Campground', 14, null, 'Tent-only and walk-in; RVs and trailers at standard sites; some first-come (5-day limit).');
  silver('co-silver-queen-maroon-bells', 'Silver Queen Campground', 5, null, 'Tents, trailers and RVs; advance reservation.');

  /* ---------------- NEW MEXICO: STATE PARKS ---------------- */
  nm('nm-elephant-butte-lake-state-park', 'Elephant Butte Lake State Park', 'Sierra', {elev:4527, sites:{total:173, hookups:'some', hookupNote:'173 developed sites: 144 water and electric, 8 full hookup. Beach and boat-in primitive camping too.'}, types:['tent','rv','group','boat-in'],
    amen:{showers:true, vault:true, water:true, dump:true}, fam:{swim:true, beach:true, playground:true, boating:true}, contact:{phone:'575-744-5923', address:'101 Hwy 195, Elephant Butte, NM 87935', url:'https://www.emnrd.state.nm.us/SPD/elephantbuttelakestatepark.html'}, src:['https://www.emnrd.state.nm.us/SPD/elephantbuttelakestatepark.html']});
  nm('nm-brantley-lake-state-park', 'Brantley Lake State Park', 'Eddy', {elev:3295, season:{open:'Year-round', close:null, note:'Open 24/7 with pay stations.'}, sites:{total:51, hookups:'some', hookupNote:'38 water/electric (30 amp), 10 water/electric (50 amp), 3 full hookup (50 amp). Shoreline and boat-in primitive camping.'}, types:['tent','rv','group','boat-in'],
    amen:{showers:true, vault:true, water:true, dump:true}, fam:{playground:true}, contact:{phone:'505-690-2757', address:'33 East Brantley Lake Rd., Carlsbad, NM 88221', url:'https://www.emnrd.state.nm.us/SPD/brantleylakestatepark.html'}, src:['https://www.emnrd.state.nm.us/SPD/brantleylakestatepark.html','https://www.emnrd.nm.gov/spd/?p=12026']});
  nm('nm-bottomless-lakes-state-park', 'Bottomless Lakes State Park', 'Chaves', {lat:33.33806, lon:-104.33444, elev:3617, sites:{total:42, hookups:'some', hookupNote:'Lea Lake Campground 32 sites (6 full hookup, 26 water/electric); Lower Lakes 10 developed sites with vault toilets.'},
    amen:{showers:true, dump:true, vault:true}, contact:{phone:'575-988-3638', address:'545 A Bottomless Lakes Rd., Roswell, NM 88201', url:'https://www.emnrd.nm.gov/spd/bottomless-lakes-state-park/'}, caut:['Coordinates are the park centre from Wikipedia.'], src:['https://www.emnrd.nm.gov/spd/bottomless-lakes-state-park/','https://en.wikipedia.org/wiki/Bottomless_Lakes_State_Park']});
  nm('nm-navajo-lake-state-park', 'Navajo Lake State Park', 'San Juan', {sites:{total:244, hookups:'some', hookupNote:'Park page says over 240 developed sites (another passage says 244) with 100+ for RVs; also primitive beach sites. Campgrounds include Cottonwood (San Juan River), Sims Mesa and Pine (Juniper and Cedar loops).'}, elev:null, types:['tent','rv','group'],
    amen:{water:true, dump:true, ada:true}, fam:{fishing:true, boating:true}, contact:{phone:'505-632-2278', address:'36 Road 4110 #1, Navajo Dam, NM 87419', url:'https://farmingtonnm.org/listings/navajo-lake-state-park'}, caut:['Elevation 5,600 to 6,600 ft (Find a Park). Site count differs between sections of the source; confirm with the park.'], src:['https://farmingtonnm.org/listings/navajo-lake-state-park']});
  nm('nm-storrie-lake-state-park', 'Storrie Lake State Park', 'San Miguel', {lat:35.65639, lon:-105.23194, elev:6607, sites:{hookups:'some', hookupNote:'Campsites with RV utility hookups (count not read).'}, src:['https://en.wikipedia.org/wiki/Storrie_Lake_State_Park'], caut:['Coordinates are the park centre from Wikipedia.']});
  nm('nm-bluewater-lake-state-park', 'Bluewater Lake State Park', 'Cibola', {elev:7554});
  nm('nm-cimarron-canyon-state-park', 'Cimarron Canyon State Park', 'Colfax', {elev:7876, sites:{total:38, hookups:'none', hookupNote:'Maverick Campground: 38 sites per a Campendium guide, no hookups, potable water and restrooms, beside the Cimarron River.'}, src:['https://campendium.com/blog/video-guide-to-new-mexico-state-parks/']});
  nm('nm-rockhound-state-park', 'Rockhound State Park', 'Luna', {elev:null, sites:{total:29, maxRvFt:45, hookups:'some', hookupNote:'Per a Campendium guide: 29 sites, one loop with hookups. Park elevation 4,520 to 5,400 ft.'}, src:['https://campendium.com/blog/video-guide-to-new-mexico-state-parks/']});
  nm('nm-city-of-rocks-state-park', 'City of Rocks State Park', 'Grant', {elev:5259, sites:{total:null, maxRvFt:40, hookups:null, hookupNote:'About 50 sites per a Campendium guide (its table says 52); some first-come.'}, src:['https://campendium.com/blog/video-guide-to-new-mexico-state-parks/']});
  nm('nm-oliver-lee-memorial-state-park', 'Oliver Lee Memorial State Park', 'Otero', {sites:{total:44}, src:['https://campendium.com/blog/video-guide-to-new-mexico-state-parks/']});
  nm('nm-pancho-villa-state-park', 'Pancho Villa State Park', 'Luna', {elev:4073, sites:{hookups:'some', hookupNote:'Large campground with RV utility hookups (count not read).'}});
  nm('nm-ute-lake-state-park', 'Ute Lake State Park', 'Quay', {elev:3762, sites:{hookupNote:'Multiple campgrounds including Yucca Campground for RVs.'}});
  nm('nm-caballo-lake-state-park', 'Caballo Lake State Park', 'Sierra', {elev:4447, sites:{total:170, hookups:'some', hookupNote:'170 sites, many with RV utility hookups (Find a Park).'}});
  nm('nm-santa-rosa-lake-state-park', 'Santa Rosa Lake State Park', 'Guadalupe', {elev:4751, sites:{hookupNote:'Los Tanos Campground, equestrian-friendly.'}});
  nm('nm-hyde-memorial-state-park', 'Hyde Memorial State Park', 'Santa Fe', {types:['tent','rv','group','yurt'], sites:{hookups:'electric', hookupNote:'Campsites, group facilities and 3 yurts (each with six cots and a propane heater). Electric sites are limited to 7 days year-round.'}, caut:['Park elevation is 8,300 to 9,400 ft.']});
  nm('nm-heron-lake-state-park', 'Heron Lake State Park', 'Rio Arriba', {elev:7167, sites:{hookupNote:'Several campgrounds with primitive and developed sites.'}});
  nm('nm-el-vado-lake-state-park', 'El Vado Lake State Park', 'Rio Arriba', {elev:7209});
  nm('nm-conchas-lake-state-park', 'Conchas Lake State Park', 'San Miguel', {elev:4253});
  nm('nm-clayton-lake-state-park', 'Clayton Lake State Park', 'Union', {elev:5186});
  nm('nm-sugarite-canyon-state-park', 'Sugarite Canyon State Park', 'Colfax', {elev:6664});
  nm('nm-eagle-nest-lake-state-park', 'Eagle Nest Lake State Park', 'Colfax', {elev:8196});
  nm('nm-coyote-creek-state-park', 'Coyote Creek State Park', 'Mora', {elev:7667});
  nm('nm-fenton-lake-state-park', 'Fenton Lake State Park', 'Sandoval', {elev:7650});
  nm('nm-sumner-lake-state-park', 'Sumner Lake State Park', 'De Baca', {elev:4310, sites:{hookupNote:'Campsites with lake views.'}});
  nm('nm-villanueva-state-park', 'Villanueva State Park', 'San Miguel', {elev:6110});
  nm('nm-manzano-mountains-state-park', 'Manzano Mountains State Park', 'Torrance', {elev:7250});
  nm('nm-morphy-lake-state-park', 'Morphy Lake State Park', 'Mora', {elev:7953, types:['tent','rv'], sites:{maxRvFt:18, hookups:'none', hookupNote:'Primitive camping; RVs up to 18 ft.'}});
  nm('nm-oasis-state-park', 'Oasis State Park', 'Roosevelt', {elev:4058});
  nm('nm-percha-dam-state-park', 'Percha Dam State Park', 'Sierra', {elev:4447});

  /* ---------------- NEW MEXICO: NPS AND NATIONAL FORESTS ---------------- */
  K('nm-juniper-family-campground-bandelier', 'Juniper Family Campground', 'Bandelier National Monument', NPS, 'NM', 'new-mexico', 'Los Alamos', {
    types:['tent','rv','group'], season:{open:null, close:null, note:'Loop A first-come year-round; Loop C closes Nov 1, reopens Mar 1. Water off mid-Oct to mid-Apr.'},
    sites:{total:53, hookups:'none', hookupNote:'53 individual sites and 2 group sites in loops A, B and C. No hookups; dump station on the entry road. Limited pull-throughs.'},
    amen:{showers:false, flush:true, water:true, dump:true, cell:false}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night individual, 50% off with Senior or Access Pass; group sites $50.'},
    book:RGB('https://www.recreation.gov/', {window:'6 months ahead for Loops B and C; group sites by reservation'}), contact:{phone:'505-672-3861', url:'https://www.nps.gov/band/planyourvisit/juniper-family-campground.htm'},
    caut:['Cell service is unreliable: reserve before arriving.'], src:['https://www.nps.gov/band/planyourvisit/juniper-family-campground.htm']});
  K('nm-redondo-campground-jemez', 'Redondo Campground', 'Santa Fe National Forest (Jemez Ranger District)', USFS, 'NM', 'new-mexico', 'Sandoval', {
    lat:35.86138951, lon:-106.62672522, elev:8200, types:['tent','rv'], season:{open:'May', close:'Nov 15', note:'Page text had a typo in the year: confirm dates.'},
    sites:{total:62, maxRvFt:30, hookups:'none'}, amen:{vault:true, water:false, dump:false, firepit:true, pets:true},
    fees:{nightlyMin:15, nightlyMax:15, note:'$15 per site per night (effective 5/9/2025); 50% off with Senior Pass.'}, book:{system:null, url:'https://www.fs.usda.gov/r03/santafe/recreation/redondo-campground', phone:null},
    contact:{phone:'505-438-5300', url:'https://www.fs.usda.gov/r03/santafe/recreation/redondo-campground'}, caut:['Phone is the forest supervisor office, not a campground line. Generators off at 10 pm.'], src:['https://www.fs.usda.gov/r03/santafe/recreation/redondo-campground']});
  K('nm-upper-end-campground-lake-roberts', 'Upper End Campground', 'Gila National Forest (Lake Roberts)', USFS, 'NM', 'new-mexico', 'Grant', {
    elev:6066, types:['tent','rv'], season:{open:'Year-round', close:null, note:'Snow can affect access.'}, sites:{total:12, maxRvFt:32, hookups:'none'}, amen:{vault:true, water:true, firepit:true},
    fees:{nightlyMin:10, nightlyMax:10, note:'$10 per night from a third-party listing (Kenneth Ingham Consulting); confirm with the Forest Service.'},
    contact:{phone:null, url:'https://explorenm.com/camping/UpperEnd'}, caut:['Data is from a third-party campground listing last updated 2018.'], src:['https://explorenm.com/camping/UpperEnd']});
  K('nm-cottonwood-campground-gila', 'Cottonwood Campground', 'Gila National Forest (Glenwood Ranger District)', USFS, 'NM', 'new-mexico', 'Catron', {
    lat:33.61891174, lon:-108.8950882, elev:5816, types:['tent','rv'], season:{open:'Year-round', close:null, note:null}, sites:{hookups:'none'}, amen:{vault:true, water:false},
    fees:{nightlyMin:0, nightlyMax:0, note:'The Forest Service page says no fees are required.'}, book:{system:'first-come', url:'https://fs.usda.gov/r03/gila/recreation/cottonwood-campground', phone:null, firstComeNote:'All sites first come, first served; max 2 vehicles per site.'},
    contact:{phone:'575-539-2481', url:'https://fs.usda.gov/r03/gila/recreation/cottonwood-campground'}, caut:['No drinking water; bring your own.'], src:['https://fs.usda.gov/r03/gila/recreation/cottonwood-campground']});
})();
