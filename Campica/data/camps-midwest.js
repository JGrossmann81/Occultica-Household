/* Campica data pack: Midwest and Great Plains (SD, ND, MN, WI, MI, IL, IN, IA, OH).
   Facts only from pages listed in SOURCES-camps-midwest.md. Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. Coordinates are given only where a page stated them (some are park-level, noted in SOURCES). */
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
  var SD = 'South Dakota Game, Fish and Parks';
  var RGW = 'https://www.recreation.gov';
  function R(url, extra){ return mix({system:RG, url:url, phone:RGPHONE}, extra); }

  /* ---------------- SOUTH DAKOTA ---------------- */
  var CSP = 'https://gfp.sd.gov/csp-campgrounds/';
  var CSPRES = {system:'SD Game, Fish and Parks reservations', url:'https://reservations.gooutdoorssouthdakota.com', phone:'605-223-7660', firstComeNote:'Phone number is the park customer-service line listed on the GFP page; Custer State Park also charges a park entrance license (amount not verified here).'};
  function CS(id, name, o){
    o.book = mix(CSPRES, o.book || {});
    o.contact = mix({phone:'605-223-7660', url:CSP}, o.contact || {});
    o.src = [CSP, 'https://gfp.sd.gov/UserDocs/nav/PRO_Rule_Proposal_41_03_04_03_Camping_Fees.pdf'].concat(o.src || []);
    K(id, name, 'Custer State Park', SD, 'SD', 'great-plains', 'Custer', o);
  }
  CS('sd-sylvan-lake-campground-custer', 'Sylvan Lake Campground', {
    season:{open:'Open House Weekend', close:'About October 1', note:'Dates may change with weather.'}, status:'seasonal',
    types:['tent','rv'], sites:{total:39, hookups:'electric', hookupNote:'Tent-only sites and electric-hookup sites. Not suitable for large tents or RVs over 27 ft.', maxRvFt:27},
    amen:{showers:true, flush:true, vault:true}, fees:{nightlyMin:16, nightlyMax:34, note:'$16 tent-only, $34 electric hookup (GFP page, read 2026-10).'},
    hi:['Flush toilets, showers and vault toilets','Tent-only and electric sites'], caut:['Sites do not suit RVs over 27 ft; large RVs and campers should avoid Needles Highway.']
  });
  CS('sd-blue-bell-campground-custer', 'Blue Bell Campground', {
    season:{open:'May 1', close:'November 1'}, status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:31, hookups:'electric', hookupNote:'31 campsites plus 23 camping cabins. Tent-only (no electric) and electric-hookup sites.'},
    amen:{showers:true, flush:true, vault:true}, fees:{nightlyMin:16, nightlyMax:34, note:'Page lists $16 tent-only, $23 electric and $34 electric hookup; camping cabins $60.'},
    hi:['Camping cabins on site','Two shower and flush-toilet facilities']
  });
  CS('sd-game-lodge-campground-custer', 'Game Lodge Campground', {
    season:{open:'May 1', close:'November 1', note:'Full facilities May 1 to Nov 1; the comfort station is closed Nov 2 to Apr 30 (vault toilets and a water hydrant remain). Weather may change dates.'}, status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:59, hookups:'electric', hookupNote:'59 campsites plus 11 camping cabins. With and without electricity.'},
    amen:{showers:true, flush:true, vault:true, laundry:true}, fees:{nightlyMin:16, nightlyMax:34, note:'Page lists $16 tent-only no electric, $23 tent-only electric, $27 campsite no electric, $34 campsite electric; cabins $60.'},
    hi:['Cold-water laundry in the main season','Camping cabins on site']
  });
  CS('sd-stockade-north-campground-custer', 'Stockade North Campground', {
    season:{open:'Open House Weekend', close:'About October 1', note:'Dates may change with weather.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:42, hookups:'electric', hookupNote:'Tent-only and campsite options, with and without electricity.'},
    amen:{showers:true, flush:true, vault:true}, fees:{nightlyMin:16, nightlyMax:34, note:'Page lists $16 tent-only no electric, $23 tent-only electric, $27 campsite no electric, $34 campsite electric.'},
    fam:{boating:null, fishing:null, kidNote:'Next to Stockade Lake (lake use rules not verified here).'}
  });
  CS('sd-stockade-south-campground-custer', 'Stockade South Campground', {
    season:{open:'Open House Weekend', close:'About October 1', note:'Dates may change with weather.'}, status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:23, hookups:'electric', hookupNote:'23 campsites plus 13 camping cabins. Described as suitable for mid-sized RVs; no length limit stated.'},
    amen:{showers:true, flush:true}, fees:{nightlyMin:16, nightlyMax:34, note:'Page lists $16 tent-only and $34 electric hookup; cabins $55.'}
  });
  CS('sd-legion-lake-campground-custer', 'Legion Lake Campground', {
    season:{open:'Open House Weekend', close:'About October 10', note:'Dates may change with weather.'}, status:'seasonal', types:['rv','tent'],
    sites:{total:26, hookups:'electric', hookupNote:'All 26 campsites are electric hookup. Described as accommodating large RVs and tents.'},
    amen:{showers:true, flush:true}, fees:{nightlyMin:34, nightlyMax:34, note:'Page lists $34 electric hookup.'}
  });
  CS('sd-center-lake-campground-custer', 'Center Lake Campground', {
    season:{open:'Open House Weekend', close:'September 30'}, status:'seasonal', types:['tent','rv'],
    sites:{total:71, hookups:'none', hookupNote:'71 sites, no electricity; suited to smaller RVs and tents.'},
    amen:{showers:true, vault:true}, fees:{nightlyMin:16, nightlyMax:23, note:'Page lists $16 tent-only and $23 site with no electricity.'},
    book:{firstComeNote:'The page mentions same-day reservations.'}
  });
  CS('sd-grace-coolidge-campground-custer', 'Grace Coolidge Campground', {
    season:{open:'Open House Weekend', close:'About October 10', note:'Dates may change with weather.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:20, hookups:'electric', hookupNote:'20 sites including 6 tent-only sites across the highway; electric-hookup sites on the south side.'},
    amen:{showers:true, flush:true, vault:true}, fees:{nightlyMin:16, nightlyMax:34, note:'Page lists $16 tent-only, $23 tent-only electric and $34 electric hookup.'}
  });
  CS('sd-french-creek-horse-camp-custer', 'French Creek Horse Camp', {
    season:{open:'May 1', close:'October 31', note:'Full facilities May 1 to Oct 31; basic camping Nov 1 to Apr 29.'}, status:'seasonal', types:['horse','rv','tent'],
    sites:{total:28, hookups:'electric', hookupNote:'28 campsites plus 3 camping cabins; each site includes two corrals.'},
    amen:{showers:true, flush:true, vault:true}, fees:{nightlyMin:44, nightlyMax:44, note:'Page lists $44 per campsite (includes two corrals); cabins $60.'}
  });

  K('sd-elk-mountain-campground-wind-cave', 'Elk Mountain Campground', 'Wind Cave National Park', NPS, 'SD', 'great-plains', 'Custer', {
    season:{open:'Year-round', close:null, note:'NPS says reservations run May through September 30. In the off-season only sites 15 to 35 are open, with a vault toilet and no water.'}, status:'open',
    types:['tent','rv','group'], sites:{total:63, maxRvFt:36, hookups:'none', hookupNote:'63 campsites plus two group sites. Site size limit is 36 ft long and 10 ft wide with slides out. Hookup status is not stated on the page read.'},
    amen:{water:null, vault:true, ada:true}, fees:{nightlyMin:12, nightlyMax:24, note:'$24 per site, $12 off-season, per a third-party listing (nationalparked.com); the NPS page says fees are half price when water is off. Confirm with the park.'},
    fam:{rangerPrograms:true, kidNote:'Ranger evening programs, including an Elk Bugling Program, are held at the campground amphitheater (weather permitting). Sites 17 and 49 are wheelchair accessible.'},
    book:R('https://www.recreation.gov/camping/campgrounds/246878'), contact:{phone:'605-745-4600', url:'https://www.nps.gov/wica/planyourvisit/campgrounds.htm'},
    hi:['Forest-and-prairie edge setting','Free backcountry permit in the north of the park'], caut:['Water is off in the off-season, and only sites 15 to 35 are open.'],
    src:['https://nps.gov/wica/planyourvisit/campgrounds.htm','https://nationalparked.com/wind-cave/camping','https://www.recreation.gov/camping/campgrounds/246878']
  });

  /* ---------------- NORTH DAKOTA ---------------- */
  var TRFEE = {nightlyMin:10, nightlyMax:20, note:'$20 per night May 15 to Sept 30 and half price ($10) the rest of the year, effective Oct 1, 2024 (NPS release, archived Jan 2025: confirm). Senior and Access Pass holders get half price. Park entrance fee is separate.'};
  K('nd-cottonwood-campground-theodore-roosevelt', 'Cottonwood Campground', 'Theodore Roosevelt National Park (South Unit)', NPS, 'ND', 'great-plains', 'Billings', {
    types:['tent','rv','group'], fees:TRFEE,
    book:R('https://www.recreation.gov/camping/campgrounds/10386756', {url:'https://www.nps.gov/thro/planyourvisit/campgrounds.htm', window:'NPS release: sites reservable May 15 to Sept 30'}),
    contact:{url:'https://www.nps.gov/thro/planyourvisit/campgrounds.htm'},
    hi:['South Unit campground'], caut:['Site count, hookups and facilities were not verified: check the NPS page.'],
    src:['https://www.nps.gov/thro/learn/news/campgrounds-rates-are-changing-at-theodore-roosevelt-national-park.htm']
  });
  K('nd-juniper-campground-theodore-roosevelt', 'Juniper Campground', 'Theodore Roosevelt National Park (North Unit)', NPS, 'ND', 'great-plains', 'McKenzie', {
    season:{open:'Year-round', close:null, note:'Water fill and dump service runs May to about Oct 1; water is not always available in May or after Oct 1. Stay limit 14 nights May 1 to Oct 31, 30 days per calendar year.'}, status:'open',
    types:['tent','rv','walk-in','group'], sites:{total:46, hookups:'none', hookupNote:'46 sites listed: 37 standard nonelectric and 9 walk-to. Vehicles over 13 ft may not fit under the trees. Generators 8 am to 8 pm.', maxRvFt:13},
    amen:{water:true, vault:true, dump:true, showers:false, laundry:false}, fees:TRFEE,
    book:R('https://www.recreation.gov/camping/campgrounds/10386756'), contact:{url:'https://www.nps.gov/thro/planyourvisit/campgrounds.htm'},
    hi:['Seasonal water fill and dump station'], caut:['Vehicles over 13 ft may not fit under the trees.','Park entrance fee of $30 per vehicle is separate (Recreation.gov page).'],
    src:['https://www.recreation.gov/camping/campgrounds/10386756','https://www.nps.gov/thro/learn/news/campgrounds-rates-are-changing-at-theodore-roosevelt-national-park.htm']
  });

  /* ---------------- MICHIGAN ---------------- */
  var PIRO = 'https://home.nps.gov/thingstodo/drive-in-camping-at-pictured-rocks.htm';
  function PR(id, name, sites, o){
    o.sites = mix({total:sites, hookups:'none', hookupNote:'No electric, water or sewer hookups. No more than two vehicles per site, including towed vehicles.'}, o.sites || {});
    o.season = {open:'May 15', close:'October 15', note:'Closed the rest of the year (NPS).'};
    o.fees = {nightlyMin:25, nightlyMax:25, note:'$25 per site per night (NPS page, read 2026-10).'};
    o.amen = mix({water:true, vault:true}, o.amen || {});
    o.book = o.book || R('https://www.recreation.gov/camping/campgrounds/247603', {window:'Up to 6 months ahead', firstComeNote:'NPS: reservations required through Recreation.gov, no drop-in camping.'});
    o.src = [PIRO].concat(o.src || []);
    K(id, name, 'Pictured Rocks National Lakeshore', NPS, 'MI', 'midwest', 'Alger', o);
  }
  PR('mi-hurricane-river-campground-pictured-rocks', 'Hurricane River Campground', 21, {
    status:'seasonal', types:['tent','rv'], amen:{pets:'limited', ada:true}, contact:{phone:'906-387-3700', url:'https://www.nps.gov/piro/planyourvisit/camping.htm'},
    sites:{hookupNote:'No hookups. NPS lists 21 sites; Recreation.gov lists 22 (10 upper, 12 lower).'},
    book:R('https://www.recreation.gov/camping/campgrounds/247603', {window:'Up to 6 months ahead', firstComeNote:'Recreation.gov also mentions same-day reservations. Phone 906-387-3700 is the one on the Recreation.gov page.'}),
    fam:{beach:true, kidNote:'On Lake Superior. Leashed pets allowed; generator-free areas.'}, caut:['No cell reception typically.'], src:['https://www.recreation.gov/camping/campgrounds/247603?tab=info']
  });
  PR('mi-twelvemile-beach-campground-pictured-rocks', 'Twelvemile Beach Campground', 36, {
    status:'seasonal', types:['tent','rv'], amen:{pets:'limited'}, contact:{url:'https://www.nps.gov/piro/planyourvisit/camping.htm'}, fam:{beach:true, kidNote:'On Lake Superior. Leashed pets allowed; generator-free areas.'}
  });
  PR('mi-little-beaver-lake-campground-pictured-rocks', 'Little Beaver Lake Campground', 8, {
    status:'seasonal', types:['tent'], amen:{pets:false}, contact:{url:'https://www.nps.gov/piro/planyourvisit/camping.htm'}, fam:{kidNote:'Eight sites on an inland lake in the Beaver Basin Wilderness. Pets are not allowed.'}
  });

  K('mi-dh-day-campground-sleeping-bear-dunes', 'D.H. Day Campground', 'Sleeping Bear Dunes National Lakeshore', NPS, 'MI', 'midwest', 'Leelanau', {
    season:{open:'April 27', close:'Fourth Sunday in November', note:'Weather permitting. Reservations are required May 15 to Oct 15.'}, status:'seasonal',
    types:['tent','rv','walk-in'], sites:{total:81, hookups:'none', hookupNote:'Nonelectric RV, tent-only, walk-to and standard sites. Generators only in sites 1 to 31, 9 am to 6 pm.'},
    amen:{water:true, vault:true, showers:false, firepit:true}, fees:{note:'Nightly fee not listed on the page read; a separate park entrance pass is required (the Michigan Recreation Passport is not accepted).'},
    book:R('https://www.recreation.gov/camping/campgrounds/259242'), contact:{phone:'231-326-4700', address:'8000 W. Harbor Hwy, Glen Arbor, MI 49636', url:'https://www.nps.gov/slbe/planyourvisit/camping.htm'},
    hi:['Wooded sites','Firewood sold at a self-pay station'], caut:['No showers on site: free hot showers are at Platte River Campground, about 17 miles south.','Camping is limited to 14 total days between Memorial Day weekend and Labor Day.'],
    src:['https://www.recreation.gov/camping/campgrounds/259242?tab=info']
  });
  K('mi-platte-river-campground-sleeping-bear-dunes', 'Platte River Campground', 'Sleeping Bear Dunes National Lakeshore', NPS, 'MI', 'midwest', 'Benzie', {
    lat:44.71551, lon:-86.119114,
    season:{open:'May 1', close:'October 31', note:'Reservation-only May 1 to Oct 31 (listing); dates outside that were not stated.'}, status:'seasonal',
    types:['tent','rv','walk-in','group'], sites:{total:179, maxRvFt:40, hookups:'electric', hookupNote:'Listing counts: 96 electric, 30 tent-only, 25 walk/boat-in, 5 group. RVs and trailers up to 40 ft.'},
    amen:{showers:true, water:true, dump:true, ada:true, bearBox:null}, fees:{nightlyMin:22, nightlyMax:31, note:'Listing (AAA TripCanvas): $31 electric, $26 non-electric, $22 walk-in; group $50. Plus a separate NPS entrance pass. Confirm on Recreation.gov.'},
    fam:{rangerPrograms:true, kidNote:'Amphitheater on site.'},
    book:R('https://www.recreation.gov/camping/campgrounds/259242', {url:'https://www.nps.gov/slbe/planyourvisit/camping.htm', firstComeNote:'Same-day reservations are available on Recreation.gov. Use the Recreation.gov search for the Platte River page.'}),
    contact:{address:'5685 Lake Michigan Road, Honor, MI 49640', url:'https://www.nps.gov/slbe/planyourvisit/camping.htm'}, caut:['Facts come from a third-party listing, not an NPS page.'],
    src:['https://www.aaa.com/tripcanvas/campground/platte-river-campground-NPS64C7EA2F_FCB4_47A3_A19E_D6ED6EADF6F6']
  });
  K('mi-presque-isle-campground-porcupine-mountains', 'Presque Isle Campground', 'Porcupine Mountains Wilderness State Park', 'Michigan DNR', 'MI', 'midwest', 'Gogebic', {
    lat:46.70618079, lon:-89.97878865, elev:730,
    season:{open:'Year-round', close:null, note:'Third-party listing; check Michigan DNR.'}, types:['tent','rv','walk-in'],
    sites:{total:50, hookups:'none', hookupNote:'East loop allows generators, quieter west loop does not. Six walk-in sites on the bluff about 50 yards from parking.'},
    amen:{vault:true, water:true, showers:false, flush:false, dump:false}, fees:{nightlyMin:17, nightlyMax:17, note:'$17 per night per a third-party listing (outdoorithm.com); confirm with Michigan DNR.'},
    book:{system:'Michigan DNR reservations', url:'https://www.michigan.gov/dnr/places/natural-areas/presque-isle-river-scenic-site'}, contact:{url:'https://www.michigan.gov/dnr/places/natural-areas/presque-isle-river-scenic-site'},
    hi:['Trails to the Presque Isle River waterfalls and Lake Superior shore'], caut:['No cell service on most carriers (listing).'],
    src:['https://outdoorithm.com/campgrounds/mi/michigan-state-park/porcupine-mountains-presque-isle-campground','https://www.michigan.gov/dnr/places/natural-areas/presque-isle-river-scenic-site']
  });
  var TQ = 'https://campflare.com/campground/tahquamenon-misp';
  function TQK(id, name, n, extra){
    K(id, name, 'Tahquamenon Falls State Park', 'Michigan DNR', 'MI', 'midwest', 'Chippewa', {
      types:['tent','rv'], sites:{total:n, maxRvFt:50, hookups:'electric', hookupNote:extra},
      amen:{showers:true, flush:true, dump:true, store:true, pets:true}, fees:{nightlyMin:20, nightlyMax:46, note:'$20 to $46 is the range for the park as a whole per the Campflare listing; not specific to this campground.'},
      book:{system:'Michigan DNR reservations', url:'https://midnrreservations.com'}, contact:{phone:'906-492-3415', address:'41845 W M 123, Paradise, MI 49768', url:TQ},
      caut:['All figures come from a third-party listing (Campflare): confirm with Michigan DNR.'], src:[TQ]
    });
  }
  TQK('mi-lower-falls-modern-campground-tahquamenon', 'Lower Falls Modern Campground', 188, 'Hemlock and Portage loops. Electric and water hookups are available at the park; no sewer hookups.');
  TQK('mi-rivermouth-modern-campground-tahquamenon', 'Rivermouth Modern Campground', 72, 'Electric and water hookups are available at the park; no sewer hookups.');
  TQK('mi-rivermouth-pines-campground-tahquamenon', 'Rivermouth Pines Campground', 36, 'Described as semi-modern (36 sites).');

  /* ---------------- INDIANA / ILLINOIS / OHIO / IOWA ---------------- */
  K('in-dunewood-campground-indiana-dunes', 'Dunewood Campground', 'Indiana Dunes National Park', NPS, 'IN', 'midwest', 'Porter', {
    types:['tent','rv','walk-in'], sites:{total:66, hookups:'none', hookupNote:'54 drive-in and 12 walk-in sites, 4 fully accessible. No electric or water hookups. Some sites limit RV length: check each site description.'},
    amen:{showers:true, flush:true, ada:true}, fees:{note:'Nightly fee not listed on the Recreation.gov page read.'},
    book:R('https://www.recreation.gov/camping/campgrounds/258887'), contact:{phone:'219-395-1882', address:'1100 N. Mineral Springs Rd, Porter, IN 46304', url:'https://www.nps.gov/indu/planyourvisit/camping.htm'},
    hi:['Showers on site'], caut:['Up to 8 people per site. Stays limited to 14 days in any 30-day period.','No campground host on Tuesdays and Wednesdays.'], src:['https://www.recreation.gov/camping/campgrounds/258887?tab=info']
  });
  K('il-starved-rock-campground', 'Starved Rock State Park Campground', 'Starved Rock State Park', 'Illinois DNR', 'IL', 'midwest', 'LaSalle', {
    season:{open:'Year-round (West Loop)', close:null, note:'East Loop closes the weekend before Thanksgiving and reopens April 1. Camp store usually May 1 to Oct 31. Fills May to October weekends first.'}, status:'open',
    types:['rv','tent','walk-in'], sites:{total:133, hookups:'electric', hookupNote:'133 Class A premium sites, electric only (30 or 50 amp). Walk-in sites open 2 days before arrival, first come first served.'},
    amen:{showers:true, flush:true, water:true, dump:true, playground:null, store:true}, fees:{nightlyMin:25, nightlyMax:35, note:'$25 regular, $35 on Memorial Day, July 4 and Labor Day (Illinois DNR brochure); seniors and some others pay less.'},
    fam:{playground:true}, book:{system:'Illinois DNR online reservations', url:'https://dnr.illinois.gov/parks/camp/park.starvedrock.html', phone:'815-667-4726', window:'6 months to 4 days before arrival, online only', firstComeNote:'No phone reservations.'},
    contact:{phone:'815-667-4726', address:'2570 E. 950th Rd, Oglesby, IL 61358', url:'https://dnr.illinois.gov/parks/camp/park.starvedrock.html'},
    caut:['Park office phone hours are weekdays 9 am to 3:30 pm. Alcohol is prohibited in the campground.'],
    src:['https://dnr.illinois.gov/parks/camp/park.starvedrock.html','https://dnr.illinois.gov/content/dam/soi/en/web/dnr/parks/camp/documents/starved_rock_campground_brochure.pdf']
  });
  K('oh-hocking-hills-state-park-campground', 'Hocking Hills State Park Campground', 'Hocking Hills State Park', 'Ohio DNR', 'OH', 'midwest', 'Hocking', {
    season:{open:null, close:null, note:'Off-peak (Nov 1 to Apr 1): water and showers only at Shower House 1. Outdoor pool Memorial Day to Labor Day.'},
    types:['tent','rv','group','walk-in'], sites:{hookups:'electric', hookupNote:'Full-hookup sites and 20-, 30- or 50-amp electric sites, plus non-electric sites. Site count not stated.'},
    amen:{showers:true, flush:true, dump:true, store:true, laundry:true, pets:true, water:true}, fees:{note:'Nightly fee not listed on the page read.'},
    fam:{swim:true, playground:true, kidNote:'Playgrounds, volleyball, horseshoes, a seasonal pool and Saturday summer movies at the amphitheater.'},
    book:{system:'Ohio State Parks reservations', url:'https://ohiodnr.gov/go-and-do/plan-a-visit/find-a-property/hocking-hills-state-park-campground', phone:'866-644-6727', window:'Up to 6 months ahead'},
    contact:{phone:'740-385-6842', url:'https://ohiodnr.gov/go-and-do/plan-a-visit/find-a-property/hocking-hills-state-park-campground'},
    caut:['740-385-6842 is the campground store line.'], src:['https://ohiodnr.gov/go-and-do/plan-a-visit/find-a-property/hocking-hills-state-park-campground']
  });
  var BB = 'https://iowadnr.gov/places-to-go/state-parks/iowa-state-parks/backbone-state-park';
  K('ia-south-lake-campground-backbone', 'South Lake Campground', 'Backbone State Park', 'Iowa DNR', 'IA', 'midwest', 'Delaware', {
    lat:42.60106, lon:-91.539051, season:{open:null, close:'November 30', note:'Campflare listing: both campgrounds close Dec 1 to Mar 31.'},
    types:['tent','rv'], sites:{hookups:'electric', hookupNote:'Electric and non-electric sites; two full-hookup sites per a listing.'},
    amen:{showers:true, dump:true, water:true, pets:true, flush:null}, fees:{note:'Fees not on the Iowa DNR page; a listing gives $21 to $275 for the park. Confirm on the reservation site.'},
    fam:{playground:true}, book:{system:'Iowa State Parks (ReserveAmerica)', url:'https://iowastateparks.reserveamerica.com', phone:'563-924-2527', firstComeNote:'Iowa DNR: campgrounds are 100% reservable and a reservation is required.'},
    contact:{phone:'563-924-2527', url:BB}, caut:['Coordinates are the park-level point on the Iowa DNR page.'], src:[BB,'https://campflare.com/campground/backbone-state-park-105']
  });
  K('ia-six-pine-campground-backbone', 'Six Pine Campground', 'Backbone State Park', 'Iowa DNR', 'IA', 'midwest', 'Delaware', {
    lat:42.60106, lon:-91.539051, types:['tent','rv'], sites:{hookups:'none', hookupNote:'Near the west entrance; non-electric sites.'}, amen:{vault:true},
    fees:{note:'Fees not on the Iowa DNR page. Confirm on the reservation site.'},
    book:{system:'Iowa State Parks (ReserveAmerica)', url:'https://iowastateparks.reserveamerica.com', phone:'563-924-2527', firstComeNote:'Reservation required.'},
    contact:{phone:'563-924-2527', url:BB}, caut:['Pit latrines.','Coordinates are the park-level point on the Iowa DNR page.'], src:[BB]
  });

  /* ---------------- WISCONSIN ---------------- */
  var PEN = 'https://dnr.wisconsin.gov/topic/parks/peninsula/recreation/camping';
  function PK(id, name, n, elec, sh, flush, note){
    K(id, name, 'Peninsula State Park', 'Wisconsin DNR', 'WI', 'midwest', 'Door', {
      lat:45.1271, lon:-87.2364, types:['tent','rv'], sites:{total:n, hookups:elec ? 'electric' : 'none', hookupNote:note},
      amen:{showers:sh, flush:flush}, book:{system:'Wisconsin State Parks reservations', url:'https://wisconsin.goingtocamp.com', phone:'888-947-2757'},
      contact:{phone:'920-868-3258', url:PEN}, fees:{note:'Campsite fee not on the page read. A vehicle admission sticker is required.'},
      fam:{beach:true, bikeFriendly:true, kidNote:'The park has a sand beach, bike trails, a lighthouse and a summer theater.'},
      caut:['Coordinates are park-level (the park page directions link), not the campground.'], src:[PEN,'https://dnr.wisconsin.gov/topic/parks/peninsula']
    });
  }
  PK('wi-north-nicolet-bay-campground-peninsula', 'North Nicolet Bay Campground', 44, false, true, true, '44 sites, none electric.');
  PK('wi-south-nicolet-bay-campground-peninsula', 'South Nicolet Bay Campground', 143, true, true, true, '143 sites, 54 electric.');
  PK('wi-tennison-bay-campground-peninsula', 'Tennison Bay Campground', 188, true, true, true, '188 sites, 97 electric. Winter camping on electric sites (reserve first).');
  PK('wi-weborg-point-campground-peninsula', 'Weborg Point Campground', 12, true, true, true, '12 sites, all electric; one fully accessible building.');
  PK('wi-welcker-point-campground-peninsula', "Welcker's Point Campground", 81, false, true, true, '81 sites, none electric.');
  var DL = 'https://dnr.wisconsin.gov/topic/parks/devilslake/recreation/camping';
  K('wi-quartzite-campground-devils-lake', 'Quartzite Campground', "Devil's Lake State Park", 'Wisconsin DNR', 'WI', 'midwest', 'Sauk', {
    season:{open:'Year-round', close:null}, status:'open', types:['tent','rv'], sites:{hookups:'electric', hookupNote:'Sites 1 to 100; 75 electric. Many of the largest RVs stay here.'},
    amen:{showers:true, vault:true}, fees:{note:'Campsite fee not on the page read.'},
    book:{system:'Wisconsin State Parks reservations', url:'https://wisconsin.goingtocamp.com', phone:'888-947-2757', window:'Same day to 11 months ahead', firstComeNote:'All sites are reservable.'},
    contact:{url:DL}, src:[DL]
  });
  K('wi-ice-age-campground-devils-lake', 'Ice Age Campground', "Devil's Lake State Park", 'Wisconsin DNR', 'WI', 'midwest', 'Sauk', {
    season:{open:'About April', close:'About October', note:'Typically closes in October and reopens around April.'}, status:'seasonal', types:['tent','rv'], sites:{total:225, hookups:'none', hookupNote:'About 225 non-electric sites (lower loop 301 to 390, upper loop 401 to 535).'},
    amen:{showers:true, vault:true}, fees:{note:'Campsite fee not on the page read.'},
    book:{system:'Wisconsin State Parks reservations', url:'https://wisconsin.goingtocamp.com', phone:'888-947-2757', window:'Same day to 11 months ahead', firstComeNote:'All sites are reservable.'},
    contact:{url:DL}, src:[DL]
  });
  K('wi-stockton-island-campsites-apostle-islands', 'Stockton Island Campsites', 'Apostle Islands National Lakeshore', NPS, 'WI', 'midwest', 'Bayfield', {
    types:['boat-in','backcountry','group'], sites:{total:19, hookups:'none', hookupNote:'19 numbered individual sites plus Group Sites A and B. Reached by boat or kayak; Site 21 by a 6.3 mile unmaintained trail from Presque Isle.'},
    amen:{vault:true, water:null}, fees:{nightlyMin:15, nightlyMax:15, note:'$15 per site per night (individual sites); group sites $30. Overnight docking $15 under 40 ft, $30 for 40 ft and over.'},
    book:{system:RG, url:'https://www.recreation.gov', phone:'715-779-3398', window:'30 days from the start of the trip (individual sites)', firstComeNote:'Reservations required for all camping. Group sites are by annual March lottery.'},
    contact:{phone:'715-779-3398', url:'https://www.nps.gov/apis/planyourvisit/stockton-campsites.htm'},
    caut:['Potable water is only sometimes available near Site 1: carry or treat water.','Season dates were not stated on the pages read.'], src:['https://www.nps.gov/apis/planyourvisit/stockton-campsites.htm','https://www.nps.gov/apis/planyourvisit/camping.htm']
  });

  /* ---------------- MINNESOTA ---------------- */
  var MNF = 'https://www.dnr.state.mn.us/state-parks/fees.html';
  var MNB = {system:'Minnesota State Parks reservations', url:'https://reservemn.usedirect.com', phone:'888-646-6367', firstComeNote:'888-646-6367 is the general MN DNR info line. Reservation fee $8 online or $10 by phone per site; none for same-day.'};
  K('mn-gooseberry-falls-campground', 'Gooseberry Falls State Park Campground', 'Gooseberry Falls State Park', 'Minnesota DNR', 'MN', 'midwest', 'Lake', {
    types:['tent','rv'], sites:{hookups:null, hookupNote:'The DNR tour page says the campsites have no electricity and fit tents or RVs, but the page may be dated: check. Site count not stated.'},
    amen:{showers:true, flush:true}, fees:{note:'Statewide DNR range: drive-in $20 to $35 per night, plus $10 for electric. Park-specific rate not read.'},
    book:MNB, contact:{phone:'888-646-6367', url:'https://www.dnr.state.mn.us/state_parks/virtual_tour/gooseberry_falls/dialup.html'},
    caut:['Two modern shower buildings; the shelter restrooms are typically open early May to early October.','A state park vehicle permit is also needed ($7 day, $35 annual).'], src:['https://www.dnr.state.mn.us/state_parks/virtual_tour/gooseberry_falls/dialup.html',MNF]
  });
  K('mn-shipwreck-creek-campground-split-rock', 'Shipwreck Creek Drive-in Campground', 'Split Rock Lighthouse State Park', 'Minnesota DNR', 'MN', 'midwest', 'Lake', {
    types:['tent','rv'], sites:{total:46, hookups:null, hookupNote:'The DNR page read states electricity at all sites; confirm which sites before relying on it. No dump or fill station: fill water before arriving.'},
    amen:{showers:true, dump:false}, fees:{note:'Statewide DNR range: drive-in $20 to $35 per night, plus $10 for electric. Park-specific rate not read.'},
    book:MNB, contact:{phone:'888-646-6367', url:'https://www.dnr.state.mn.us/state_parks/virtual_tour/split_rock_lighthouse/dialup.html'},
    caut:['Shower building is seasonal.'], src:['https://www.dnr.state.mn.us/state_parks/virtual_tour/split_rock_lighthouse/dialup.html',MNF]
  });
  K('mn-cart-in-campground-split-rock', 'Cart-in Campground', 'Split Rock Lighthouse State Park', 'Minnesota DNR', 'MN', 'midwest', 'Lake', {
    types:['tent','walk-in'], sites:{total:20, hookups:'none', hookupNote:'20 reservable sites between Lake Superior and Day Hill. Haul gear by cart from the parking lot. Each site has fire ring, table, tent pad and an animal-proof food box.'},
    amen:{showers:true, flush:true, bearBox:true}, fees:{nightlyMin:20, nightlyMax:25, note:'Statewide DNR range for cart-in and walk-in sites; park-specific rate not read.'},
    book:MNB, contact:{phone:'888-646-6367', url:'https://www.dnr.state.mn.us/state_parks/virtual_tour/split_rock_lighthouse/dialup.html'},
    src:['https://www.dnr.state.mn.us/state_parks/virtual_tour/split_rock_lighthouse/dialup.html',MNF]
  });
  K('mn-itasca-state-park-campgrounds', 'Itasca State Park Campgrounds', 'Itasca State Park', 'Minnesota DNR', 'MN', 'midwest', 'Clearwater', {
    types:['tent','rv'], sites:{hookups:null, hookupNote:'The DNR page says hundreds of campsites; reservations required. Bear Paw Campground is wooded near the lake; there is also an RV area. Counts and hookups not read.'},
    fees:{note:'Statewide DNR range: drive-in $20 to $35 per night. Park-specific rate not read.'},
    book:MNB, contact:{phone:'888-646-6367', url:'https://www.dnr.state.mn.us/state_parks/virtual_tour/itasca/dialup.html'}, src:['https://www.dnr.state.mn.us/state_parks/virtual_tour/itasca/dialup.html',MNF]
  });
  K('mn-voyageurs-frontcountry-boat-in', 'Voyageurs Frontcountry Sites (boat-in)', 'Voyageurs National Park', NPS, 'MN', 'midwest', 'St. Louis', {
    types:['boat-in'], season:{open:'May 15', close:'October 15', note:'High-use season May 15 to Oct 15; low-use Oct 16 to May 14.'}, status:'seasonal',
    sites:{total:137, hookups:'none', hookupNote:'NPS camping page lists 137 frontcountry sites; another NPS page says 157. All are on lakes or islands and need a boat from a mainland launch (the two Kab-Ash Trail sites are hike-in). There are no drive-in campgrounds inside the park.'},
    fees:{nightlyMin:10, nightlyMax:32, note:'Small site $26 and large site $32 in high season, $10 in low season, plus a $10 reservation fee per transaction (NPS page; the pages did not say which sites are small or large).'},
    book:{system:RG, url:'https://www.recreation.gov', phone:'218-283-6600', window:'High-season permits open the previous November 15; low-season the previous April 15', firstComeNote:'Every camping type needs a reservation/permit.'},
    contact:{phone:'218-283-6600', url:'https://www.nps.gov/voya/planyourvisit/camping.htm'}, caut:['Dispersed camping is not allowed. Car or RV camping is outside the park in gateway communities.'],
    src:['https://www.nps.gov/voya/planyourvisit/camping.htm','https://www.nps.gov/voya/planyourvisit/tent-camping.htm']
  });
  K('mi-isle-royale-campgrounds', 'Isle Royale Campgrounds (backcountry)', 'Isle Royale National Park', NPS, 'MI', 'midwest', 'Keweenaw', {
    types:['backcountry','boat-in'], sites:{hookups:'none', hookupNote:'36 campgrounds reachable only on foot or by watercraft. Each has tent sites, a water source and outhouses; some have shelters.'},
    fees:{nightlyMin:0, nightlyMax:0, note:'Free permit for parties of six or fewer and boaters; group permits $25 each; park entrance fee is separate.'},
    book:{system:'NPS permit', url:'https://www.nps.gov/isro/planyourvisit/camping.htm', firstComeNote:'Parties of six or fewer: first come, first served, permit on arrival at Rock Harbor, Windigo or the Ranger III. Seven or more: advance group reservation.'},
    contact:{url:'https://www.nps.gov/isro/planyourvisit/camping.htm'}, caut:['Treat all backcountry water.','Season dates, ferry and seaplane details were not on the page read.'],
    src:['https://www.nps.gov/isro/planyourvisit/camping.htm']
  });
})();
