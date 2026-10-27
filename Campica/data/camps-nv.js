/* Campica data pack: Nevada (state parks, Lake Mead NRA, Red Rock, Spring Mountains NRA, Ruby/East Humboldt and Jarbidge areas) plus Temple Bar (AZ side of Lake Mead).
   Facts only from pages listed in SOURCES-camps-nv.md (read 2026-10). Any field left null was NOT verified: the UI must say "check with the source".
   Nevada State Parks fees are per vehicle per night: Nevada-plated vehicles pay the lower figure, others the higher. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', NSP = 'Nevada State Parks', USFS = 'US Forest Service', BLM = 'Bureau of Land Management';
  var RG = 'recreation.gov', RGPHONE = '877-444-6777';
  var RN = 'Reserve Nevada', RNURL = 'https://reservenevada.com';
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
  var SPF = 'Nevada State Parks fee: $15 per vehicle per night for Nevada-plated vehicles, $20 for others. Utility-hookup sites add $10. Confirm on the park page.';
  var SPFB = 'Nevada State Parks fee: $15 per vehicle per night (Nevada plates) or $20 (others); camp-and-boat $20 or $25. Hookup sites add $10 where offered. Confirm on the park page.';
  var SPR = {system:RN, url:RNURL, phone:null};
  var SPX = 'Fire restrictions were posted on Nevada State Parks pages when read (Oct 2026): check before you light a fire.';
  var P = 'https://parks.nv.gov/parks/';
  var STAY14 = 'Stay limit 14 days in any 30-day period.';

  /* ---------------- NEVADA STATE PARKS ---------------- */
  K('nv-washoe-lake-state-park-campground', 'Washoe Lake Campground', 'Washoe Lake State Park', NSP, 'NV', 'nevada', 'Washoe', {
    lat:39.2459, lon:-119.7613, season:{open:'Year-round', note:'Park page says camping is open year round.'}, status:'open', types:['tent','rv'],
    sites:{total:49, maxRvFt:45, hookups:'partial', hookupNote:'Loop A (24 sites) has water and utility hookups; the page says several sites fit RVs up to 45 ft.'},
    amen:{showers:true, dump:true, firepit:true},
    fam:{fishing:null, boating:true, kidNote:'Lakeside state park south of Reno; camp-and-boat rate offered.'},
    fees:{nightlyMin:15, nightlyMax:20, note:SPFB+' Stay limit 7 days in any 30-day period.'},
    book:SPR, contact:{phone:'775-687-4319', url:P+'washoe-lake/'},
    hi:['Camp-and-boat rate','Dump station on site','Two comfort stations, one with a shower'],
    caut:['The page showed Stage One fire restrictions and a "No Campfires Allowed" notice even though sites have fire rings: confirm before planning a fire.','Coordinates are the park address pin, not the campground.'],
    src:[P+'washoe-lake/'] });
  K('nv-spooner-lake-walk-in-campgrounds', 'Marlette Peak, Hobart and North Canyon Walk-in Camps', 'Lake Tahoe Nevada State Park (Spooner backcountry)', NSP, 'NV', 'nevada', 'Carson City', {
    lat:39.107, lon:-119.909, season:{open:null, close:null, note:'Backcountry cabins May 1 to Oct 15 per the page; campground dates not stated.'}, status:null,
    statusNote:'Park page listed a Hobart closure and construction project, low water at Spooner Lake and a harmful algal bloom watch (Oct 2026).', types:['tent','walk-in'],
    amen:{vault:true, bearBox:true},
    fees:{note:'Camping fee not stated on the park page. Contact the park. Dispersed camping is not allowed around Marlette Lake or elsewhere in the park.'},
    book:SPR, contact:{phone:'775-749-5980', email:'slsp@parks.nv.gov', url:P+'spooner-lake/'},
    hi:['Primitive walk-in camps with restrooms and bear-resistant food/trash boxes'],
    caut:['Walk-in only: you carry gear in.','Black bears: use the food boxes.','Coordinates are for the park area, not the camps.',STAY14],
    src:[P+'spooner-lake/'] });
  K('nv-beaver-dam-state-park-campgrounds', 'Beaver Dam Campgrounds (A and B)', 'Beaver Dam State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    lat:37.5179, lon:-114.0831, elev:5000, season:{open:'Year-round', note:'Winter access can be limited or impossible due to weather and road conditions. Drinking water April to November.'},
    status:'open', statusNote:'Becomes first-come, first-served starting November 1 per the park page.', types:['tent','rv','group'],
    sites:{hookups:'none', hookupNote:'No electric power in the park, no trailer dump station. Each site fits one vehicle and a small trailer.'},
    amen:{vault:true, water:true, firepit:true, dump:false, cell:'Cell reception at the north entrance gate only'},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others. '+STAY14},
    book:SPR, contact:{phone:'775-728-8101', url:P+'beaver-dam/'},
    hi:['Remote southeastern Nevada canyon park','Group area with large shade ramada in Campground B'],
    caut:['No landline; very limited cell service.','Check road conditions in winter.','Coordinates are the park address pin.'],
    src:[P+'beaver-dam/'] });
  K('nv-berlin-ichthyosaur-state-park-campground', 'Berlin-Ichthyosaur Campground', 'Berlin-Ichthyosaur State Park', NSP, 'NV', 'nevada', 'Nye', {
    lat:38.872, lon:-117.594, season:{open:'Year-round', note:'Drinking water typically mid-April to end of October.'}, status:'open', types:['tent','rv'],
    sites:{total:14, maxRvFt:25, hookupNote:'Some sites take RVs up to 25 ft. Hookups not mentioned on the page.'},
    amen:{dump:true, water:true, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others. Cash or check only, no cards. '+STAY14},
    book:SPR, contact:{phone:'775-427-9332', url:P+'berlin-ichthyosaur'},
    hi:['Ghost town and fossil site','Site elevation of the park runs 6,840 to 7,880 ft'],
    caut:['Cash or check only.','Remote: fuel up and carry water outside the summer water season.','Coordinates are the park address pin.',SPX],
    src:[P+'berlin-ichthyosaur'] });
  K('nv-big-bend-of-the-colorado-campground', 'Big Bend of the Colorado Campground', 'Big Bend of the Colorado State Recreation Area', NSP, 'NV', 'nevada', 'Clark', {
    lat:35.1149, lon:-114.6490, season:{open:'Year-round'}, status:'open', types:['rv','tent'],
    sites:{total:32, hookups:'full', hookupNote:'24 reservable RV sites with water, electric and sewer, plus 8 first-come sites behind the loop; three ADA sites need an ADA permit. Most sites are pull-through.'},
    amen:{showers:true, flush:true, firepit:null, ada:true},
    fam:{boating:true, fishing:null},
    fees:{nightlyMin:20, nightlyMax:25, note:'$20 per vehicle (Nevada plates), $25 others; camp-and-boat $30/$35; hookup sites add $10. '+STAY14},
    book:SPR, contact:{phone:'702-298-1859', url:P+'big-bend-of-the-colorado/'},
    hi:['Riverside RV camping near Laughlin','Showers and restrooms'],
    caut:['Sewer hookups are often locked in summer because of vandalism: ask staff to unlock yours on arrival.','Summer heat is extreme.'],
    src:[P+'big-bend-of-the-colorado/'] });
  K('nv-cathedral-gorge-state-park-campground', 'Cathedral Gorge Campground', 'Cathedral Gorge State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    lat:37.824, lon:-114.415, season:{open:'Year-round'}, status:'open', types:['tent','rv','group'],
    sites:{total:22, hookups:'electric', hookupNote:'Electric hookups available; each site has a table, grill and shade ramada. A group area has two accessible sites.'},
    amen:{showers:true, flush:true, water:true, firepit:true, ada:true},
    fees:{nightlyMin:15, nightlyMax:20, note:SPF+' '+STAY14},
    book:SPR, contact:{phone:'775-728-8101', email:'cgsp@parks.nv.gov', url:P+'cathedral-gorge/'},
    hi:['Slot-like clay badlands near Panaca','Year-round showers and flush toilets'],
    caut:['Coordinates are the park address pin.'],
    src:[P+'cathedral-gorge/'] });
  K('nv-cave-lake-elk-flat-campground', 'Elk Flat Campground', 'Cave Lake State Park', NSP, 'NV', 'nevada', 'White Pine', {
    lat:39.1838, lon:-114.7173, season:{open:'Early May', close:'Mid-October', note:'Weather permitting.'}, status:'seasonal', types:['tent','rv','group'],
    amen:{showers:true, flush:true, firepit:true}, fam:{fishing:true, boating:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. Stay limit 7 days in any 30-day period. One group site.'},
    book:SPR, contact:{phone:'775-296-1505', email:'clsp@parks.nv.gov', url:P+'cave-lake/'},
    hi:['First camping area reached from Highways 93, 50 and 6','Near Ely'],
    caut:['Access roads are unpaved.','Site count and hookups not stated on the page.','Coordinates are the park pin, not the campground.'],
    src:[P+'cave-lake/'] });
  K('nv-cave-lake-lake-view-campground', 'Lake View Campground', 'Cave Lake State Park', NSP, 'NV', 'nevada', 'White Pine', {
    lat:39.1838, lon:-114.7173, season:{open:'Year-round', note:'Facilities may close in extreme cold: call the park before a winter trip.'}, status:'open', types:['tent','rv','group'],
    amen:{showers:true, flush:true, firepit:true}, fam:{fishing:true, boating:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. Stay limit 7 days in any 30-day period. One group site.'},
    book:SPR, contact:{phone:'775-296-1505', email:'clsp@parks.nv.gov', url:P+'cave-lake/'},
    hi:['Near the lake','Open year-round'],
    caut:['Access roads are unpaved.','Site count and hookups not stated on the page.','Coordinates are the park pin, not the campground.'],
    src:[P+'cave-lake/'] });
  K('nv-dayton-state-park-campground', 'Dayton State Park Campground', 'Dayton State Park', NSP, 'NV', 'nevada', 'Lyon', {
    lat:39.2491, lon:-119.5876, season:{open:'Year-round'}, status:'open', statusNote:'Park page said the RV dump station was closed until further notice (Oct 2026).', types:['tent','rv'],
    sites:{total:10, maxRvFt:34}, amen:{flush:true, dump:false, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others. Stay limit 7 days in any 30-day period.'},
    book:SPR, contact:{phone:'775-867-3001', email:'daytonsp@parks.nv.gov', url:P+'dayton/'},
    hi:['Small campground beside Nevada\'s oldest settlement area'],
    caut:['Hookups and showers not mentioned on the page.','Coordinates come from map links on the page and are approximate.',SPX],
    src:[P+'dayton/'] });
  K('nv-echo-canyon-north-campground', 'North Campground', 'Echo Canyon State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    lat:37.9110, lon:-114.2673, season:{open:'Year-round'}, status:'open', types:['tent','rv'],
    sites:{total:33}, amen:{water:true, firepit:true}, fam:{fishing:null, boating:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. '+STAY14},
    book:mix(SPR,{firstComeNote:'Sites left unreserved on arrival day are first-come, first-served.'}), contact:{phone:'775-962-5103', email:'ecsp@parks.nv.gov', url:P+'echo-canyon/'},
    hi:['Reservoir camping near Pioche'],
    caut:['Showers not stated.','Coordinates are the park address pin.'],
    src:[P+'echo-canyon/'] });
  K('nv-echo-canyon-rv-campground', 'RV Campground', 'Echo Canyon State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    lat:37.9110, lon:-114.2673, season:{open:'Year-round'}, status:'open', types:['rv'],
    sites:{total:20, hookups:'full', hookupNote:'20 full-hookup sites on a hill overlooking Dry Valley.'}, amen:{flush:true, dump:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others, plus $10 for hookup sites. '+STAY14},
    book:SPR, contact:{phone:'775-962-5103', email:'ecsp@parks.nv.gov', url:P+'echo-canyon/'},
    hi:['Full hookups','Dump station on site'], caut:['Coordinates are the park address pin.'],
    src:[P+'echo-canyon/'] });
  K('nv-fort-churchill-campground', 'Fort Churchill Campground', 'Fort Churchill State Historic Park', NSP, 'NV', 'nevada', 'Lyon', {
    lat:39.2944, lon:-119.2677, elev:4250, season:{open:'Year-round'}, status:'open', types:['tent','rv','group'],
    sites:{total:20, hookups:'none', hookupNote:'20 shaded sites; no hookups. Dump station near the campground entrance. Group area (up to 60 people) is closed to RVs.'},
    amen:{dump:true, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others.'},
    book:SPR, contact:{phone:'775-577-2345', email:'ftcsp@parks.nv.gov', url:P+'fort-churchill/'},
    hi:['Shaded cottonwood sites near the Carson River','Historic 1860s fort ruins'],
    caut:['Showers not mentioned on the page.',SPX],
    src:[P+'fort-churchill/'] });
  K('nv-fort-churchill-scout-camp', 'Scout Camp', 'Fort Churchill State Historic Park', NSP, 'NV', 'nevada', 'Lyon', {
    lat:39.2944, lon:-119.2677, season:{open:'Year-round'}, status:'open', types:['tent','group','equestrian'],
    sites:{hookups:'none', hookupNote:'Dispersed area with tables, fire rings, one vault toilet and horse corrals; no electricity, no water.'},
    amen:{vault:true, water:false, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others.'},
    book:{system:null, url:P+'fort-churchill/', phone:null, firstComeNote:'Scout Camp sites cannot be reserved.'}, contact:{phone:'775-577-2345', email:'ftcsp@parks.nv.gov', url:P+'fort-churchill/'},
    hi:['Horse corrals','Quiet, primitive camping'],
    caut:['Bring all water.','Carry out your trash; horse manure must be removed or taken to the designated dump.','Coordinates are the park address pin.'],
    src:[P+'fort-churchill/'] });
  K('nv-kershaw-ryan-state-park-campground', 'Kershaw-Ryan Campground', 'Kershaw-Ryan State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    lat:37.5889, lon:-114.5213, season:{open:'Year-round', note:'Site water is usually shut off late October to early April; frost-free hydrants stay on.'}, status:'open', types:['tent','rv'],
    sites:{total:20, hookups:'partial', hookupNote:'16 sites with 30/50-amp power and water, shade ramada, table, fire ring and grill; 4 tent-only first-come sites without hookups.'},
    amen:{showers:true, flush:true, dump:true, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, extraVehicle:null, note:'$15 per vehicle (Nevada plates), $20 others, hookups add $10; bike-in $2 per bike. Stay limit 7 days in any 30-day period.'},
    book:mix(SPR,{firstComeNote:'The 4 tent-only sites are first-come, first-served.'}), contact:{phone:'775-726-3564', email:'krsp@parks.nv.gov', url:P+'kershaw-ryan/', address:'9056 Kershaw Canyon Rd, Caliente, NV 89008'},
    hi:['Shaded canyon park near Caliente','Coin-operated showers'],
    caut:['Rattlesnakes in summer.','Flash-flood risk in thunderstorms.','Coordinates are approximate, from the park page.'],
    src:[P+'kershaw-ryan/'] });
  K('nv-lahontan-silver-springs-beach-7', 'Silver Springs Beach (#7)', 'Lahontan State Recreation Area', NSP, 'NV', 'nevada', 'Lyon', {
    lat:39.376, lon:-119.202, season:{open:'Year-round', note:'Showers and flush toilets closed October through May.'}, status:'open',
    statusNote:'Park page posted a harmful algal bloom DANGER advisory and Stage One fire restrictions (Oct 2026).', types:['tent','rv'],
    amen:{dump:true, firepit:null}, fam:{beach:true, swim:null, boating:true, fishing:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $25/$30. '+STAY14},
    book:SPR, contact:{phone:'775-577-2226', url:P+'lahontan/'},
    hi:['Developed beach camp with restrooms, tables and grills'],
    caut:['Check the algal bloom advisory before letting children or pets in the water.','Site count and hookups not stated.','Coordinates are the park address pin.'],
    src:[P+'lahontan/'] });
  K('nv-lahontan-river-camp', 'River Camp', 'Lahontan State Recreation Area', NSP, 'NV', 'nevada', 'Lyon', {
    lat:39.376, lon:-119.202, status:null, statusNote:'Park page posted a harmful algal bloom DANGER advisory (Oct 2026).', types:['tent','rv'],
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $25/$30. '+STAY14},
    book:SPR, contact:{phone:'775-577-2226', url:P+'lahontan/'},
    hi:['Reservable camp on the Carson River side of the park'],
    caut:['Only a one-line description on the park page: sites, amenities and season not stated.','Coordinates are the park address pin.'],
    src:[P+'lahontan/'] });
  K('nv-rye-patch-river-campground', 'River Campground (below the dam)', 'Rye Patch State Recreation Area', NSP, 'NV', 'nevada', 'Pershing', {
    lat:40.4723, lon:-118.3106, season:{open:'Year-round'}, status:'open', statusNote:'Park page posted a harmful algal bloom watch and fire restrictions (Oct 2026).', types:['tent','rv'],
    sites:{total:22}, amen:{showers:true, flush:true, dump:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. '+STAY14},
    book:SPR, contact:{phone:'775-442-0135', email:'rpsra@parks.nv.gov', url:P+'rye-patch/', address:'2505 Rye Patch Reservoir Rd, Lovelock, NV 89419'},
    hi:['Hot showers','Dump station with potable water on the dam\'s west side'],
    caut:['Hookups not stated.','Coordinates are the park address pin.'],
    src:[P+'rye-patch/'] });
  K('nv-rye-patch-west-side-campground', 'West Side Reservoir Campground', 'Rye Patch State Recreation Area', NSP, 'NV', 'nevada', 'Pershing', {
    lat:40.4723, lon:-118.3106, season:{open:'Year-round'}, status:'open', statusNote:'Park page posted a harmful algal bloom watch and fire restrictions (Oct 2026).', types:['tent','rv'],
    sites:{total:25}, amen:{showers:true, flush:true, dump:true}, fam:{boating:true, fishing:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. '+STAY14},
    book:SPR, contact:{phone:'775-442-0135', email:'rpsra@parks.nv.gov', url:P+'rye-patch/', address:'2505 Rye Patch Reservoir Rd, Lovelock, NV 89419'},
    hi:['Reservoir-side camping with hot showers'],
    caut:['Hookups not stated.','Coordinates are the park address pin.'],
    src:[P+'rye-patch/'] });
  K('nv-south-fork-state-park-campground', 'South Fork Campground', 'South Fork State Recreation Area', NSP, 'NV', 'nevada', 'Elko', {
    season:{open:'Year-round', note:'The park page says camping is open all year.'}, status:'open', statusNote:'A boat ramp closure was posted (no details) when read.', types:['tent','rv','group'],
    sites:{total:25, hookups:'partial', hookupNote:'25 sites off the north access road; East Campground has powersites (additional mandatory $10 fee, used or not) and there are utility-hookup sites.'},
    amen:{showers:true, flush:true, dump:true, firepit:true}, fam:{boating:true, fishing:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25; hookup sites add $10. '+STAY14},
    book:SPR, contact:{phone:'775-744-4346', email:'sfsra@parks.nv.gov', url:P+'south-fork/'},
    hi:['Reservoir near Elko','Open camping along the southwest shore'],
    caut:['No campground coordinates on the page.'],
    src:[P+'south-fork/'] });
  K('nv-spring-valley-main-campground', 'Main Campground', 'Spring Valley State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    season:{open:'Year-round', note:'Park open 365 days a year.'}, status:'open', types:['tent','rv','group'],
    fam:{boating:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25. Stay limit 7 days in any 30-day period.'},
    book:SPR, contact:{phone:'775-962-5102', email:'svsp@parks.nv.gov', url:P+'spring-valley/'},
    hi:['Reservoir camping near Pioche; group camping at the south end of the reservoir (reserve ahead)'],
    caut:['The park page gives no site count, hookups or showers for the main campground.'],
    src:[P+'spring-valley/'] });
  K('nv-spring-valley-ranch-campground', 'Ranch Campground', 'Spring Valley State Park', NSP, 'NV', 'nevada', 'Lincoln', {
    season:{open:'Year-round'}, status:'open', types:['tent','rv'],
    sites:{total:7}, amen:{water:true, firepit:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others. Stay limit 7 days in any 30-day period.'},
    book:{system:null, url:P+'spring-valley/', phone:null, firstComeNote:'Sites are first come, first served.'}, contact:{phone:'775-962-5102', email:'svsp@parks.nv.gov', url:P+'spring-valley/'},
    hi:['Seven quiet sites with tables, grills and water'], caut:['Primitive restrooms.','About two miles north of the main campground.'],
    src:[P+'spring-valley/'] });
  K('nv-walker-river-riverbend-campground', 'Riverbend Campground', 'Walker River State Recreation Area (Pitchfork Ranch)', NSP, 'NV', 'nevada', 'Lyon', {
    season:{open:'Year-round', note:'Park open 365 days a year; hours vary by location.'}, status:'open', statusNote:'Park page posted fire restrictions, East Walker Road construction and a note that park phone lines were down (Oct 2026).', types:['tent','rv'],
    sites:{total:16}, amen:{showers:true, flush:true, firepit:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others, hookup sites add $10. '+STAY14},
    book:SPR, contact:{phone:'775-684-2561', email:'wrsra@parks.nv.gov', url:P+'walker-river'},
    hi:['Restrooms and showers nearby'], caut:['Hookups not stated for Riverbend.','No campground coordinates on the page.'],
    src:[P+'walker-river'] });
  K('nv-walker-river-quail-run-campground', 'Quail Run Campground', 'Walker River State Recreation Area (Pitchfork Ranch)', NSP, 'NV', 'nevada', 'Lyon', {
    season:{open:'Year-round'}, status:'open', statusNote:'Park page posted fire restrictions and East Walker Road construction (Oct 2026).', types:['tent','rv'],
    sites:{total:19, hookups:'partial', hookupNote:'RV sites with power and water.'}, amen:{showers:true, flush:true},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others, hookup sites add $10. '+STAY14},
    book:SPR, contact:{phone:'775-684-2561', email:'wrsra@parks.nv.gov', url:P+'walker-river'},
    hi:['Power and water RV sites'], caut:['No campground coordinates on the page.'],
    src:[P+'walker-river'] });
  K('nv-walker-river-bighorn-campground', 'Bighorn Campground', 'Walker River State Recreation Area (The Elbow)', NSP, 'NV', 'nevada', 'Mineral', {
    season:{open:'Year-round'}, status:'open', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'Sites with table and fire ring; restroom only.'}, amen:{vault:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others. '+STAY14},
    book:{system:null, url:P+'walker-river', phone:null, firstComeNote:'Reservations not accepted: first come, first served.'}, contact:{phone:'775-684-2561', email:'wrsra@parks.nv.gov', url:P+'walker-river'},
    hi:['Simple riverside camp at The Elbow'], caut:['Basic: restroom only, no hookups.','No campground coordinates on the page.'],
    src:[P+'walker-river'] });
  K('nv-wild-horse-state-recreation-area-campground', 'Wild Horse Campground', 'Wild Horse State Recreation Area', NSP, 'NV', 'nevada', 'Elko', {
    lat:41.6694, lon:-115.8003, season:{open:'Year-round', note:'Water faucets and dump station are summer only.'}, status:'open', types:['tent','rv'],
    sites:{total:34, hookupNote:'The camping text says no hookups but the fee schedule lists a hookup surcharge: confirm when booking. Pull-through sites fit large RVs.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true}, fam:{boating:true, fishing:null},
    fees:{nightlyMin:15, nightlyMax:20, note:'$15 per vehicle (Nevada plates), $20 others; camp-and-boat $20/$25; hookup sites add $10. '+STAY14},
    book:SPR, contact:{phone:'775-385-5939', email:'whsra@parks.nv.gov', url:P+'wild-horse/'},
    hi:['34 sites with table, shade, fire pit and pad','Reservoir in far northern Nevada'],
    caut:['Park page carried a harmful algal bloom watch notice (Oct 2026).','Coordinates are the park address pin.'],
    src:[P+'wild-horse/'] });

  /* ---------------- LAKE MEAD NRA ---------------- */
  var LMF = 'NPS-run campsites are $20 per night per the Recreation.gov Lake Mead gateway listing (the NPS Callville Bay and Temple Bar pages also say $20); the park entrance fee is extra. Senior and Access pass holders get 50% off. Confirm on Recreation.gov.';
  var LMP = {system:RG, phone:RGPHONE, window:null, cancelNote:'All NPS-managed Lake Mead campsites must be reserved in advance on Recreation.gov (same-day booking is possible).'};
  K('nv-boulder-beach-campground-lake-mead', 'Boulder Beach Campground', 'Lake Mead National Recreation Area', NPS, 'NV', 'nevada', 'Clark', {
    lat:36.0352, lon:-114.8021, season:{open:'Year-round', note:'Loops A and B closed May 26 to August 31, 2026 per the NPS page; check the current year.'}, status:'open',
    statusNote:'Loops A and B close each summer (2026: May 26 to Aug 31).', types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'NPS sites have no hookups; RVs may use any site. A concession RV village nearby has hookups.'},
    amen:{flush:true, water:true, dump:true, wifi:false, showers:false, ada:true, pets:true}, fam:{beach:true, swim:true, fishing:true, boating:true},
    fees:{nightlyMin:20, nightlyMax:20, note:LMF},
    book:mix(LMP,{url:'https://recreation.gov/gateways/14519'}), contact:{phone:'702-293-8990', url:'https://www.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm', address:'601 Nevada Way, Boulder City, NV 89005'},
    hi:['Closest Lake Mead campground to Las Vegas','Swimming beach nearby'],
    caut:['Summer heat is extreme (100 F and up).','Coordinates and amenity list are from a third-party listing (Campendium).','Site count not verified (a third-party listing says 135).'],
    src:['https://home.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm','https://recreation.gov/gateways/14519','https://www.campendium.com/boulder-beach-campground'] });
  K('nv-callville-bay-campground-lake-mead', 'Callville Bay Campground', 'Lake Mead National Recreation Area', NPS, 'NV', 'nevada', 'Clark', {
    season:{open:'Year-round'}, status:'open', types:['tent','rv'],
    sites:{total:52, hookups:'none', hookupNote:'NPS page: 52 NPS campsites (Recreation.gov lists 46 standard nonelectric) plus 5 concession RV sites; NPS sites have no hookups. One RV or camp trailer plus up to two motor vehicles per site.'},
    amen:{flush:true, showers:false, water:true, dump:true, wifi:false, firepit:true, ada:true, pets:true}, fam:{boating:true, fishing:null},
    fees:{nightlyMin:20, nightlyMax:20, note:LMF},
    book:mix(LMP,{url:'https://www.recreation.gov/camping/campgrounds/10068459'}), contact:{phone:'702-293-8906', url:'https://www.nps.gov/places/callville-bay.htm', address:'100 Callville Bay Rd, Overton, NV 89040'},
    hi:['Paved sites, a few with lake views','Campground host on site'],
    caut:['Extreme summer heat.','Quiet hours 10 p.m. to 6 a.m. include generators.','Stay limit 30 days in any developed campground.'],
    src:['https://www.recreation.gov/camping/campgrounds/10068459','https://www.nps.gov/places/callville-bay.htm'] });
  K('nv-echo-bay-campground-lake-mead', 'Echo Bay Campground', 'Lake Mead National Recreation Area', NPS, 'NV', 'nevada', 'Clark', {
    status:null, types:['tent','rv'],
    fees:{nightlyMin:20, nightlyMax:20, note:LMF},
    book:mix(LMP,{url:'https://recreation.gov/gateways/14519'}), contact:{phone:'702-293-8990', url:'https://www.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm', address:'601 Nevada Way, Boulder City, NV 89005'},
    hi:['Overton Arm of Lake Mead'],
    caut:['Site count, season, hookups and current status were not verified on an official page: check NPS alerts before driving out.','Listings disagree about hookups (NPS: none at NPS sites; a third-party listing: full hookups, probably the concession).'],
    src:['https://recreation.gov/gateways/14519','https://home.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm'] });
  K('nv-las-vegas-bay-campground-lake-mead', 'Las Vegas Bay Campground', 'Lake Mead National Recreation Area', NPS, 'NV', 'nevada', 'Clark', {
    status:null, types:['tent','rv'],
    fees:{nightlyMin:20, nightlyMax:20, note:LMF},
    book:mix(LMP,{url:'https://recreation.gov/gateways/14519'}), contact:{phone:'702-293-8990', url:'https://www.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm', address:'601 Nevada Way, Boulder City, NV 89005'},
    hi:['Close to Las Vegas on the Boulder Basin side of the lake'],
    caut:['Site count, season, hookups and current status were not verified on an official page: check NPS alerts.'],
    src:['https://recreation.gov/gateways/14519','https://home.nps.gov/lake/planyourvisit/lake-mead-campgrounds.htm'] });
  K('az-temple-bar-campground-lake-mead', 'Temple Bar Campground', 'Lake Mead National Recreation Area', NPS, 'AZ', 'arizona', 'Mohave', {
    status:null, types:['tent','rv'],
    sites:{total:71, hookups:'none', hookupNote:'NPS page: 71 NPS sites; plus a separate concession RV park with 10 sites booked at templebarlakemead.com.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'NPS page: $20 per night, 50% off with a Senior or Access pass. Park entrance fee extra.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/10085626', phone:RGPHONE}, contact:{phone:'702-293-8990', url:'https://www.nps.gov/places/temple-bar.htm', address:'1 Main Street, Temple Bar Marina, AZ'},
    hi:['Remote Arizona side of Lake Mead'],
    caut:['Season, showers and coordinates not stated; NPS page last updated April 2024.','Park info line 702-293-8990 is the Lake Mead number; the campground itself has no listed phone.'],
    src:['https://www.nps.gov/places/temple-bar.htm'] });

  /* ---------------- BLM ---------------- */
  K('nv-red-rock-canyon-campground', 'Red Rock Canyon Campground', 'Red Rock Canyon National Conservation Area', BLM, 'NV', 'nevada', 'Clark', {
    lat:36.1314, lon:-115.3839, season:{open:'September 1', close:'May 31', note:'Closed June 1 to August 31 per the recreation.gov page. Propane stoves only during fire season (about May to October).'}, status:'seasonal', types:['tent','rv','group','walk-in'],
    sites:{total:76, hookups:'none', hookupNote:'53 standard sites (3 fully accessible), 10 walk-to, 6 RV sites without hookups, 7 group sites. Class A/C RVs and gooseneck trailers fit only in standard sites 1-45.'},
    amen:{vault:true, water:true, firepit:true, ada:true, cell:'Limited', pets:true},
    fees:{nightlyMin:20, nightlyMax:33, note:'BLM page: standard and RV sites $33 (online) / $34 (phone), walk-to $20 / $21, group $88 / $89. Senior Lifetime and Access passes give 50% off standard and RV sites only.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/250877', phone:RGPHONE, window:'Standard sites 6 months ahead, group sites 12 months ahead', cancelNote:'$10 change fee for different dates, $10 cancellation fee, $20 no-show fee plus first night.'},
    contact:{phone:'702-515-5387', email:'BLM_NV_RR_Campground@blm.gov', url:'https://www.blm.gov/visit/red-rock-canyon-campground', address:'3293 Moenkopi Rd, Las Vegas, NV 89161'},
    hi:['About 20 miles from the Strip','Sandstone cliffs and Calico Hills nearby'],
    caut:['Online reservation only. Max stay 14 days.','Winds can gust over 30 mph; nights drop below freezing in winter.','The scenic drive needs a separate timed-entry reservation Oct 1 to May 31, but campers staying here do not need one.','Reopening date after the summer closure: check the BLM page.'],
    src:['https://www.blm.gov/visit/red-rock-canyon-campground','https://www.recreation.gov/camping/campgrounds/250877'] });

  /* ---------------- SPRING MOUNTAINS NRA (Humboldt-Toiyabe NF) ---------------- */
  var SM = 'https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/';
  K('nv-mcwilliams-campground-mount-charleston', 'McWilliams Campground', 'Spring Mountains National Recreation Area (Lee Canyon)', USFS, 'NV', 'nevada', 'Clark', {
    lat:36.3090, lon:-115.6780, elev:8500, season:{note:'Opening dates vary with snow levels.'}, status:'open', types:['tent','rv','group'],
    sites:{total:75, hookups:'none', hookupNote:'75 standard nonelectric sites in five loops: Eureka, McWill, Dolomite (sites 34-45), Oxbow and OldD.'},
    amen:{flush:true, water:true, firepit:true, cell:'No cell service per reviewers', ada:true},
    fees:{note:'Nightly rate not stated on the Forest Service or Recreation.gov pages read. Check Recreation.gov.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/232168', phone:'775-331-6444', firstComeNote:'Some sites are first-come, first-served. The site must be occupied the first night of a reservation.'},
    contact:{phone:'702-872-5486', url:SM+'mcwilliams-campground'},
    hi:['Largest campground in the recreation area, among ponderosa and white pine','Cool escape from Las Vegas heat'],
    caut:['Call 702-872-5486 for fire restrictions.','Cold nights even in October (reviewer saw 29 F).','Coordinates and elevation are from a third-party listing (The Dyrt).'],
    src:['https://www.recreation.gov/camping/campgrounds/232168?tab=info','https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/spring-mountains-national-recreation-area','https://thedyrt.com/camping/nevada/toiyabe-national-forest-dolomite-campground'] });
  K('nv-hilltop-campground-mount-charleston', 'Hilltop Campground', 'Spring Mountains National Recreation Area (Deer Creek Highway)', USFS, 'NV', 'nevada', 'Clark', {
    status:'open', types:['tent','rv'],
    sites:{total:35, maxTrailerFt:25, hookups:'none', hookupNote:'Trailers over 25 ft not recommended: narrow road with tight turns.'},
    amen:{vault:true, water:false, firepit:true, ada:null},
    fees:{note:'Nightly rate not stated on the pages read. Check Recreation.gov.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/232276', phone:'775-331-6444', firstComeNote:'Odd-numbered sites are reservable; even-numbered sites are first-come, first-served. Occupy the site the first night of a reservation.'},
    contact:{phone:'702-872-5486', url:SM+'hilltop-campground'},
    hi:['High forest sites with valley views'],
    caut:['No water on site: bring everything for drinking, washing and dousing fires.','Call 702-872-5486 for fire restrictions.','Coordinates not verified.'],
    src:['https://www.recreation.gov/camping/campgrounds/232276?tab=info','https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/spring-mountains-national-recreation-area'] });
  K('nv-fletcher-view-campground-mount-charleston', 'Fletcher View Campground', 'Spring Mountains National Recreation Area (Kyle Canyon)', USFS, 'NV', 'nevada', 'Clark', {
    lat:36.2624, lon:-115.6179, elev:7000, season:{open:'Year-round', note:'Mid-July to mid-September (monsoon season) reservations may be cancelled and the campground temporarily closed.'}, status:'open', types:['rv','tent'],
    sites:{total:11, hookups:'electric', hookupNote:'All 11 sites have electric hookups; drinking-water spigots are shared and not for filling RV tanks.'},
    amen:{flush:true, water:true, firepit:true, dump:false},
    fees:{nightlyMin:33, nightlyMax:58, note:'Forest Service page: $33 per night for a single electric site, $58 for a double.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/234005', phone:'775-331-6444', firstComeNote:'Some first-come sites are available year-round. Occupy the site the first night of a reservation.'},
    contact:{phone:'702-872-5486', url:SM+'fletcher-view-campground'},
    hi:['Electric sites in a timbered area along Kyle Canyon Wash','Fletcher Canyon trailhead'],
    caut:['Horses and pack animals not allowed. Dogs on leash.','Monsoon-season closures.'],
    src:[SM+'fletcher-view-campground','https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/spring-mountains-national-recreation-area'] });

  /* ---------------- RUBY / EAST HUMBOLDT / JARBIDGE (Humboldt-Toiyabe NF) ---------------- */
  var HT = 'https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/';
  K('nv-thomas-canyon-campground-lamoille', 'Thomas Canyon Campground', 'Ruby Mountains (Lamoille Canyon)', USFS, 'NV', 'nevada', 'Elko', {
    lat:40.6472, lon:-115.4068, elev:7200, season:{open:'May', close:'November', note:'Reservations generally Memorial Day to Labor Day; first-come season roughly late September to late October. Water is shut off in fall.'},
    status:'closed-check', statusNote:'The ranger district page listed it as Closed and a Recreation.gov note said it closed for the season after Sept 14 because of Lamoille Canyon Road repairs. Check before going.', types:['tent','rv'],
    sites:{total:39, hookups:'none', hookupNote:'About 39 sites listed on Recreation.gov (list may be incomplete), standard and RV nonelectric, one tent-only site.'},
    amen:{vault:true, water:true, firepit:true},
    fees:{nightlyMin:19, nightlyMax:38, extraVehicle:6, note:'Forest Service page: $19 single site, $38 double site; extra vehicle $6. Double sites not eligible for pass discounts.'},
    book:{system:RG, url:'https://recreation.gov/camping/campgrounds/232112', phone:RGPHONE, firstComeNote:'Some sites first-come. Unoccupied reservation voided after the next day\'s check-out time.'},
    contact:{phone:'775-738-5171', url:HT+'thomas-canyon-campground'},
    hi:['Trailheads into the high Ruby Mountains','Mountain goats and Himalayan snowcock may be seen'],
    caut:['Livestock not allowed.','No host in the first-come season.','Road repairs on Lamoille Canyon Road were expected to finish by end of October.'],
    src:[HT+'thomas-canyon-campground','https://recreation.gov/camping/campgrounds/232112','https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/mountain-city-ruby-mountains-jarbidge-ranger-district'] });
  K('nv-angel-lake-campground-wells', 'Angel Lake Campground', 'East Humboldt Range (above Wells)', USFS, 'NV', 'nevada', 'Elko', {
    lat:41.0256, lon:-115.0854, elev:8350, season:{open:'Late May', close:'Early September', note:'Reservations generally Memorial Day to Labor Day; it closed for the 2026 season on Sept 7 for dam construction and repair.'},
    status:'closed-check', statusNote:'Forest Service page showed Site Closed after the 2026 season-end closure (dam work).', types:['tent','rv'],
    sites:{total:25, hookups:'none', hookupNote:'About 25 sites, no electric hookups. Steep winding access road: caution with large trailers.'},
    amen:{vault:true, water:false, firepit:true}, fam:{fishing:true, boating:true},
    fees:{nightlyMin:18, nightlyMax:36, note:'Forest Service page: $18 single site, $36 double.'},
    book:{system:RG, url:'https://recreation.gov/camping/campgrounds/232015', phone:RGPHONE, firstComeNote:'A small number of sites are first-come.'},
    contact:{phone:'775-752-3357', url:HT+'angel-lake-campground'},
    hi:['Glacial cirque lake at 8,000+ ft','Canoeing and trout fishing; Smith Lake Trail starts here'],
    caut:['The Forest Service page says no potable water; Recreation.gov elevation says 8,400 ft.','Livestock not allowed.','Services are 8 miles away.'],
    src:['https://fs.usda.gov/r04/humboldt-toiyabe/recreation/angel-lake-campground','https://recreation.gov/camping/campgrounds/232015'] });
  K('nv-angel-creek-campground-wells', 'Angel Creek Campground', 'East Humboldt Range (above Wells)', USFS, 'NV', 'nevada', 'Elko', {
    elev:6200, season:{note:'Reservations generally Memorial Day to Labor Day; off-season first-come, weather permitting.'}, status:'open', types:['tent','rv','group'],
    sites:{total:18, hookups:'none', hookupNote:'18 standard nonelectric sites plus one group tent-only area (up to 30 people, six tents).'},
    amen:{vault:true, water:true, firepit:true, ada:true},
    fees:{extraVehicle:6, note:'Base nightly rate not stated on the Recreation.gov page read (single covers one vehicle, double two; extra vehicle $6). Check Recreation.gov.'},
    book:{system:RG, url:'https://recreation.gov/camping/campgrounds/232014', phone:RGPHONE},
    contact:{phone:'775-752-3357', url:HT+'angel-creek-campground'},
    hi:['Aspen picnic area; Smith Lake Trail starts at the entrance','About four miles from Angel Lake'],
    caut:['Drinking water and trash service in peak season only.','Livestock not allowed.','Coordinates not verified.'],
    src:['https://recreation.gov/camping/campgrounds/232014','https://www.fs.usda.gov/r04/humboldt-toiyabe/recreation/mountain-city-ruby-mountains-jarbidge-ranger-district'] });
  K('nv-pine-creek-campground-jarbidge', 'Pine Creek Campground', 'Jarbidge Wilderness area', USFS, 'NV', 'nevada', 'Elko', {
    lat:41.8382, lon:-115.4291, season:{open:'June', close:'October'}, status:'open', types:['tent','rv'],
    sites:{total:5, hookups:'none'}, amen:{water:false},
    fees:{nightlyMin:0, nightlyMax:0, note:'Forest Service page: no fee.'},
    book:{system:null, url:HT+'pine-creek-campground-jarbidge', phone:null},
    contact:{phone:'775-738-5171', url:HT+'pine-creek-campground-jarbidge'},
    hi:['Trailhead to the Jarbidge Wilderness via Snowslide Gulch','About 4 miles south of Jarbidge on Forest Road 58064'],
    caut:['Primitive, no drinking water.','Narrow, rocky road with a difficult turnaround: scout before taking a large trailer.'],
    src:[HT+'pine-creek-campground-jarbidge','https://thisisreno.com/2013/03/camping-opportunities-abound-in-northeastern-nevada/'] });
})();
