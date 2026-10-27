/* Campica data pack: Northern California campgrounds. Facts only from sources listed in SOURCES-camps-north.md.
   Any field left null was not verified: the UI must say "check with the source". */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var RC_WINDOW = '6 months ahead; new dates open daily at 8 a.m. Pacific (per California State Parks)';
  var RC_CANCEL = 'Online reservations carry an $8.25 reservation fee and an $8.25 cancellation fee. Cancel 7+ days ahead: site fees refunded less the cancellation fee; 2-6 days ahead: first night forfeited; under 2 days or no-show: no refund (per California State Parks).';
  function K(id, name, parent, agency, region, county, lat, lon, elev, o){
    o = o || {};
    var d = {
      id: id, name: name, parent: parent, agency: agency, state: 'CA', region: region, county: county,
      lat: lat, lon: lon, elevFt: elev,
      season: mix({open:null, close:null, note:null}, o.season),
      status: o.status === undefined ? null : o.status, statusNote: o.statusNote || null,
      types: o.types || [],
      sites: mix({total:null, rv:null, tent:null, maxRvFt:null, maxTrailerFt:null, hookups:null, hookupNote:null}, o.sites),
      amenities: mix({showers:null, flush:null, vault:null, water:null, dump:null, store:null, wifi:null, firepit:null, bearBox:null, laundry:null, pets:null, ada:null, cell:null}, o.amen),
      family: mix({swim:null, beach:null, playground:null, juniorRanger:null, rangerPrograms:null, easyTrails:null, fishing:null, boating:null, bikeFriendly:null, nearTown:null, kidNote:null}, o.fam),
      fees: mix({nightlyMin:null, nightlyMax:null, extraVehicle:null, reservationFee:null, note:null, asof:ASOF}, o.fees),
      booking: mix({system:null, url:null, phone:null, window:null, firstComeNote:null, cancelNote:null}, o.book),
      contact: mix({phone:null, email:null, url:null, address:null}, o.contact),
      dispersedOk: false,
      highlights: o.hi || [], cautions: o.caut || [], src: o.src || [], asof: ASOF
    };
    CAMPS.items.push(d);
  }
  // California State Parks reservation block (ReserveCalifornia)
  function RC(extra){ return mix({system:'reservecalifornia', url:'https://www.reservecalifornia.com/', phone:'800-444-7275', window:RC_WINDOW, cancelNote:RC_CANCEL}, extra); }
  var CSP = 'California State Parks';
  var NPS = 'National Park Service';
  var RG = function(extra){ return mix({system:'recreation.gov', url:'https://www.recreation.gov/', phone:'877-444-6777'}, extra); };

  // ---------- NORTH COAST ----------
  K('ca-elk-prairie-prairie-creek','Elk Prairie Campground','Prairie Creek Redwoods State Park',CSP,'north-coast','Humboldt',41.3592,-124.0284,160,{
    season:{open:'year-round', close:null, note:'Open all year; busiest mid-May to late Sept. First-come in the slowest months, reservations the rest of the year; the northern loop closes in winter.'},
    status:'open', types:['tent','rv','cabin','walk-in'],
    sites:{total:76, hookups:'none', hookupNote:'No electric, water or sewer hookups and no dump station (per ReserveCalifornia listing mirrored by Outdoorithm).'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'yes', ada:true},
    fam:{rangerPrograms:true, nearTown:null, kidNote:'Tent camping in a tall redwood forest beside an open prairie where elk often wander through. Park runs summer interpretive and family programs.'},
    fees:{nightlyMin:35, extraVehicle:8, reservationFee:8.25, note:'Standard-site fee and extra-vehicle fee as listed on an Outdoorithm mirror of ReserveCalifornia data (2026-10); hike-and-bike is about $5. Confirm at booking.'},
    book:RC({firstComeNote:'First come, first served during the slowest months (northern loop closes in winter).'}),
    contact:{phone:'707-464-6101', url:'https://www.parks.ca.gov/415', address:'127011 Newton B. Drury Scenic Parkway, Orick, CA 95555'},
    hi:['76 sites per the park info sheet; four cabins in the campground','Two restroom-and-shower buildings','Hike-and-bike sites available'],
    caut:['Dogs are allowed in the campground and on roads but not on park trails','Bear country: use the food lockers'],
    src:['https://www.parks.ca.gov/415','https://www.parks.ca.gov/pages/415/files/PrairieCreekRedwoodsSP_Infosheet_8.5x14_031325_FINAL.pdf','https://www.parks.ca.gov/AccessibleFeatures/Details/415','https://outdoorithm.com/campgrounds/ca/prairie-creek-redwoods-sp-elk-prairie-campground/state-park-campground']});

  K('ca-mill-creek-del-norte-coast','Mill Creek Campground','Del Norte Coast Redwoods State Park',CSP,'north-coast','Del Norte',41.7008,-124.0967,null,{
    season:{open:'May 1', close:'Sep 30', note:'Season dates per an Outdoorithm mirror of ReserveCalifornia data; confirm with the park.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:145, hookups:'none', hookupNote:'Dump station listed; no hookups.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Large campground set in second-growth redwoods inland from the coast, with a dump station and showers for longer family stays.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Standard-site fee as listed on an Outdoorithm mirror of ReserveCalifornia data (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-464-6101', url:'https://www.parks.ca.gov/414', address:null},
    caut:['Vehicle length guidance conflicts between listings (about 24 to 28 ft); confirm before bringing a large rig','Dogs not allowed on trails'],
    src:['https://outdoorithm.com/campgrounds/ca/del-norte-coast-redwood-sp-mill-creek-campground/state-park-campground','https://www.parks.ca.gov/AccessibleFeatures/Details/414']});

  K('ca-jedediah-smith-campground','Jedediah Smith Campground','Jedediah Smith Redwoods State Park',CSP,'north-coast','Del Norte',41.7957,-124.0864,270,{
    season:{open:'year-round', close:null, note:'Reservations in season; first come, first served from early October to mid-May per Recreation.gov page for the park.'},
    status:'open', types:['tent','rv','cabin'],
    sites:{hookups:'none', hookupNote:'No hookups; arrive with full battery and fresh water (per Outdoorithm mirror).'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{swim:true, fishing:true, rangerPrograms:true, kidNote:'Redwood campground with river access for swimming and fishing and summer ranger campfire programs (per Recreation.gov park page).'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC({firstComeNote:'Early October to mid-May the campground is first come, first served (check the kiosk).'}),
    contact:{phone:'707-464-6101', url:'https://www.recreation.gov/camping/poi/259179', address:'1440 Highway 199, Crescent City, CA 95531'},
    caut:['RVs and trailers cannot use Howland Hill Road; vehicles must be under 22 ft','Dogs not allowed on park trails'],
    src:['https://www.recreation.gov/camping/poi/259179','https://www.parks.ca.gov/pages/413/files/JedediahSmithSP_InfoSheet_8.5x11_071025_FINAL.pdf','https://outdoorithm.com/campgrounds/ca/redwood-national-and-state-parks/jedediah-smith-campground-jedediah-smith-redwoods-state-park']});

  K('ca-albee-creek-humboldt-redwoods','Albee Creek Campground','Humboldt Redwoods State Park',CSP,'north-coast','Humboldt',40.3531,-124.0096,450,{
    season:{open:'May 25', close:'Sep 1', note:'Seasonal; listed as Memorial Day to Labor Day on an Outdoorithm mirror of ReserveCalifornia. Park info sheet confirms it is seasonal.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:40, maxRvFt:24, hookups:'none', hookupNote:'Access road is narrow; not suited to large RVs.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{rangerPrograms:true, juniorRanger:true, kidNote:'Quiet camp in the Bull Creek redwoods; park runs daily summer nature walks, campfire and Junior Ranger programs.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Fee as listed on an Outdoorithm mirror of ReserveCalifornia (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-946-2263', url:'https://www.parks.ca.gov/425', address:'Avenue of the Giants, Weott, CA 95571'},
    caut:['Park says campgrounds here do not take RVs or trailers over 24 ft','Bear country: store food properly','Dogs not allowed on trails'],
    src:['https://www.parks.ca.gov/pages/425/files/HumboldtRedwoods_InfoSheet_8.5x14_110823FINAL.pdf','https://humboldtredwoods.org/node/13','https://www.outdoorithm.com/campgrounds/ca/humboldt-redwoods-sp/albee-creek-campground']});

  K('ca-richardson-grove','Richardson Grove State Park campgrounds','Richardson Grove State Park',CSP,'north-coast','Humboldt',40.0193,-123.7925,null,{
    season:{open:null, close:null, note:'Oak Flat is summer-only; check ReserveCalifornia for current dates of the other loops.'},
    status:null, types:['tent','rv','group'],
    sites:{total:null},
    fam:{juniorRanger:true, rangerPrograms:true, kidNote:'Old-growth redwoods next to a river; summer campfire programs and a Junior Ranger program for ages 7 to 12 (per the park info sheet).'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-247-3318', url:'https://www.parks.ca.gov/422', address:'1600 U.S. Highway 101, Garberville, CA 95542'},
    hi:['Park info sheet describes more than 160 family sites across Huckleberry, Oak Flat and a group camp'],
    caut:['Dogs must stay off hiking trails'],
    src:['https://www.parks.ca.gov/pages/422/files/RichardsonGroveFinalWebLayout2018.pdf','https://www.outdoorithm.com/campgrounds/ca/richardson-grove-sp/dawn-redwood-group-campground']});

  K('ca-benbow-lake-sra','Benbow Lake State Recreation Area campground','Benbow Lake SRA',CSP,'north-coast','Humboldt',40.0619,-123.7933,null,{
    season:{open:'Memorial Day', close:'Labor Day', note:'Open seasonally per the park info sheet.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:75},
    fam:{swim:true, kidNote:'Seasonal riverside campground; the park says June and July are the best swimming months, with no lifeguards.'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-247-3318', url:'https://www.parks.ca.gov/426', address:'445 Lake Benbow Drive, Garberville, CA 95542'},
    caut:['No diving, no lifeguards; supervise children at the river','Late-summer algae blooms possible'],
    src:['https://www.parks.ca.gov/pages/426/files/Benbow_InfoSheet_8.5x11_093024_FINAL.pdf','https://en.wikipedia.org/wiki/Benbow_State_Recreation_Area']});

  // ---------- SHASTA-CASCADE ----------
  K('ca-castle-crags','Castle Crags Campground','Castle Crags State Park',CSP,'shasta-cascade','Shasta',41.1513,-122.3125,2140,{
    season:{open:'year-round', close:null, note:'Main loops and Riverside close in off-season; in severe winter weather the whole park can close. Peak mid-May to mid-Sept.'},
    status:'open', types:['tent','rv'],
    sites:{total:76},
    amen:{showers:true, flush:true, vault:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Forest campground at the foot of tall granite spires; short Campground Trail and Vista Point Trail are the only trails open to dogs.'},
    fees:{nightlyMin:25, nightlyMax:25, reservationFee:8.25, note:'$25 per night for all sites as listed on an Outdoorithm mirror of ReserveCalifornia (2026-10). Confirm at booking.'},
    book:RC({firstComeNote:'Roughly mid-September to mid-May sites are first come, first served per Outdoorithm; confirm with the park.'}),
    contact:{phone:'530-235-2684', url:'https://www.parks.ca.gov/454', address:'20022 Castle Creek Road, Castella, CA 96017'},
    hi:['76 developed sites plus 6 environmental sites per the park'],
    src:['https://www.parks.ca.gov/pages/454/files/CastleCragsSP_Infosheet_11x17_032926_FINAL.pdf','https://www.outdoorithm.com/campgrounds/ca/castle-crags-sp/campground']});

  K('ca-burney-falls-campground','McArthur-Burney Falls Memorial State Park campground','McArthur-Burney Falls Memorial State Park',CSP,'shasta-cascade','Shasta',41.017,-121.646,2890,{
    season:{open:null, close:null, note:'Listed as open seasonally; call the park for current dates.'},
    status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:104, maxRvFt:32, hookups:'none', hookupNote:'Dry camping; RV sanitation station at north end of campground.'},
    amen:{showers:true, flush:true, dump:true, store:true, pets:'yes'},
    fam:{swim:true, beach:true, rangerPrograms:true, fishing:null, kidNote:'Walk from camp to the park waterfall and a lake swim beach; camp store nearby. Dogs are not allowed on the swim beach.'},
    fees:{note:'Nightly fee not verified from an official page. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'530-335-2777', url:'https://www.parks.ca.gov/455', address:'24898 Highway 89, Burney, CA 96013'},
    caut:['Little or no cell service in the park','Dogs not allowed on trails'],
    src:['https://www.parks.ca.gov/pages/455/files/mcarthurburneyfallsmemorialspfinalweblayout120816.pdf','https://campendium.com/mcarthur-burney-falls-memorial-state-park']});

  K('ca-manzanita-lake-lassen','Manzanita Lake Campground','Lassen Volcanic National Park',NPS,'shasta-cascade','Shasta',40.5292,-121.5639,5900,{
    season:{open:null, close:null, note:'Summer-fall season; park highway closes beyond Loomis Plaza in winter (usually Nov to May). Exact dates not verified for 2026.'},
    status:'seasonal', types:['tent','rv','cabin','group'],
    sites:{total:179, maxRvFt:null, hookups:'none', hookupNote:'No hookups; dump station ($8) on site.'},
    amen:{showers:true, flush:true, vault:true, water:true, dump:true, store:true, laundry:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Biggest campground in the park, near Manzanita Lake, with a camp store, pay showers and laundry. Only campground with camping cabins.'},
    fees:{nightlyMin:15, nightlyMax:26, note:'NPS table lists $26 full service and $15 dry; group sites $72 (2026 NPS page). Park entrance fee separate.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/234039', window:null, firstComeNote:'Reservations required; on-site payment not accepted.'}),
    contact:{phone:'530-595-6100', url:'https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm', address:null},
    caut:['Every site has a bear-resistant locker; use it','Check NPS alerts for seasonal dates and fire restrictions'],
    src:['https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm','https://www.nps.gov/lavo/planyourvisit/placestogo.htm','https://outdoorithm.com/campgrounds/ca/lassen-volcanic-np/manzanita-lake']});

  K('ca-summit-lake-north-lassen','Summit Lake North Campground','Lassen Volcanic National Park',NPS,'shasta-cascade','Shasta',40.4944,-121.425,6700,{
    season:{open:'Jun 27', close:'Sep 8', note:'Projected 2026 dates per a third-party listing; closed by snow outside summer. Confirm with NPS.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:46, maxRvFt:60, maxTrailerFt:60, hookups:'none'},
    amen:{showers:false, flush:true, water:true, dump:false, firepit:true, bearBox:true, pets:'yes', cell:'none'},
    fam:{swim:true, fishing:true, kidNote:'High-elevation lakeside camp with a swim spot, fishing and an amphitheater.'},
    fees:{nightlyMin:24, nightlyMax:24, note:'NPS table: $24 per night (2026). Park entrance fee separate.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/234041'}),
    contact:{phone:'530-595-6100', url:'https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm', address:null},
    caut:['Cold nights at 6,700 ft','Bear lockers at every site'],
    src:['https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm','https://campflare.com/campground/summit-lake-north-041','https://www.recreation.gov/camping/campgrounds/234041?tab=info']});

  K('ca-summit-lake-south-lassen','Summit Lake South Campground','Lassen Volcanic National Park',NPS,'shasta-cascade','Shasta',40.4944,-121.425,6700,{
    season:{open:null, close:null, note:'Summer only; snow closes it. Dates not verified.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:48, hookups:'none'},
    amen:{flush:false, vault:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Sits by the same lake as the North campground; Loop E is a quieter tent-only loop.'},
    fees:{nightlyMin:15, nightlyMax:22, note:'NPS table: $22 full service, $15 dry (2026). Park entrance fee separate.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/234040'}),
    contact:{phone:'530-595-6100', url:'https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm', address:null},
    caut:['Map pin is shared with Summit Lake North (same lake); individual campground coordinates not verified.'],
    src:['https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm','https://www.recreation.gov/camping/campgrounds/234040?tab=info']});

  K('ca-indian-well-lava-beds','Indian Well Campground','Lava Beds National Monument',NPS,'shasta-cascade','Siskiyou',41.7175,-121.5041,4640,{
    season:{open:'year-round', close:null, note:'A-Loop open all year; B-Loop closes mid-November and reopens in spring. Group site closed Nov 1 to Mar 31.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:43, maxRvFt:30, hookups:'none'},
    amen:{flush:true, water:true, firepit:true, pets:'yes'},
    fam:{rangerPrograms:null, kidNote:'Base camp for exploring volcanic lava-tube caves; a park entrance pass is required while camping.'},
    fees:{note:'Campsite fee not shown on the NPS page. Monument entrance fee is $25 per vehicle.'},
    book:{system:'first-come', url:'https://www.nps.gov/labe/planyourvisit/campgrounds.htm', firstComeNote:'The 43 individual sites are first come, first served; the group site is reservable April to October.'},
    contact:{phone:'530-667-8113', url:'https://www.nps.gov/labe/planyourvisit/campgrounds.htm', address:null},
    caut:['Stay limit 14 days in any 30-day period','Not all sites fit motorhomes'],
    src:['https://www.nps.gov/labe/planyourvisit/campgrounds.htm','https://www.recreation.gov/camping/campgrounds/10334752?tab=info','https://outdoorithm.com/campgrounds/Recreation.gov:246908:2797']});

  // ---------- BAY AREA ----------
  K('ca-samuel-p-taylor','Samuel P. Taylor State Park campground','Samuel P. Taylor State Park',CSP,'bay-area','Marin',38.0209,-122.7344,270,{
    season:{open:'year-round', close:null, note:'Creek access closed Dec 1 to Jun 15. Some loops close in winter (Creekside Dec 1-Mar 1 per Outdoorithm).'},
    status:'open', types:['tent','rv','cabin','group','walk-in','equestrian'],
    sites:{total:60, maxRvFt:31, maxTrailerFt:27, hookups:'none', hookupNote:'No hookups. The RV dump station is out of service indefinitely.'},
    amen:{showers:true, flush:true, vault:true, water:true, dump:false, firepit:true, bearBox:true, pets:'yes'},
    fam:{swim:null, rangerPrograms:null, nearTown:null, kidNote:'Redwood and creekside camping about an hour from San Francisco; cabins available at Madrone.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Standard site $35 and senior rate $33 on the park page; hike-and-bike about $7 (Outdoorithm).'},
    book:RC(),
    contact:{phone:'415-488-9897', url:'https://parks.ca.gov/469', address:'8889 Sir Francis Drake Blvd., Lagunitas, CA 94938'},
    caut:['RV water fill and dump are not available in the park; Olema RV Resort offers them for a fee','Dogs only at campsites (not hike-and-bike or cabin area)'],
    src:['https://parks.ca.gov/469','https://www.parks.ca.gov/pages/469/files/SamuelPTaylor_Infosheet_8.5x11_101625_FINAL.pdf','https://www.outdoorithm.com/campgrounds/ca/samuel-p-taylor-sp/state-park-campground']});

  K('ca-gold-bluffs-beach-prairie-creek','Gold Bluffs Beach Campground','Prairie Creek Redwoods State Park',CSP,'north-coast','Humboldt',41.3837,-124.0696,20,{
    season:{open:'year-round', close:null, note:'Open all year; Fern Canyon / Gold Bluffs day-use permits are required May 15 to Sept 15.'},
    status:'open', types:['tent','walk-in'],
    sites:{total:25, hookups:'none'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{beach:true, kidNote:'Beachfront camping on a wide coastal strip below the bluffs, near Fern Canyon. The access road is narrow gravel.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Standard-site fee as listed on an Outdoorithm mirror of ReserveCalifornia data (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-464-6101', url:'https://www.parks.ca.gov/415', address:'127011 Newton B. Drury Scenic Parkway, Orick, CA 95555'},
    caut:['Davison Road to the campground: vehicles over 24 ft long or 8 ft wide and all trailers are not allowed','Outdoorithm lists RVs as not allowed; confirm with the park','Pets allowed in campground and on beach, not on trails'],
    src:['https://www.parks.ca.gov/pages/415/files/PrairieCreekRedwoodsSP_Infosheet_8.5x14_031325_FINAL.pdf','https://www.parks.ca.gov/415','https://outdoorithm.com/campgrounds/ca/prairie-creek-redwoods-sp-gold-bluffs-beach-camp/bluff-campground']});

  K('ca-burlington-humboldt-redwoods','Burlington Campground','Humboldt Redwoods State Park',CSP,'north-coast','Humboldt',40.3084,-123.9091,160,{
    season:{open:'year-round', close:null, note:'Year-round per the park info sheet.'},
    status:'open', types:['tent','rv'],
    sites:{total:58, maxRvFt:24, hookups:'none', hookupNote:'Dry camping. Park says its campgrounds take no RVs or trailers over 24 ft.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{rangerPrograms:true, juniorRanger:true, fishing:true, kidNote:'The park\'s main year-round campground, in the Avenue of the Giants redwoods with summer ranger and Junior Ranger programs.'},
    fees:{note:'Nightly fee not verified from an official page (a camper review reports $35 in 2024). Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-946-2263', url:'https://www.parks.ca.gov/425', address:'Avenue of the Giants, Weott, CA 95571'},
    caut:['Cell signal is weak','Bear country: store food properly','Dogs not allowed on trails'],
    src:['https://www.parks.ca.gov/pages/425/files/HumboldtRedwoods_InfoSheet_8.5x14_110823FINAL.pdf','https://humboldtredwoods.org/node/13','https://www.campendium.com/burlington-campground']});

  K('ca-sue-meg-state-park','Sue-meg State Park campgrounds (Abalone, Agate, Penn Creek)','Sue-meg State Park (formerly Patrick\'s Point)',CSP,'north-coast','Humboldt',41.1363,-124.1552,null,{
    season:{open:null, close:null, note:'Season not verified; check ReserveCalifornia.'},
    status:null, types:['tent','rv','group'],
    sites:{total:null, maxRvFt:31, hookups:'none', hookupNote:'Dump station in the park. Abalone takes RVs to about 31 ft; Agate has the only pull-through; Penn Creek suits tents (no trailers) per a third-party listing.'},
    amen:{showers:true, flush:null, water:true, dump:true, firepit:true, pets:'yes'},
    fam:{beach:true, kidNote:'Coastal forest camping above tide pools and beaches; fog and rain are common year-round.'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-677-3570', url:'https://www.parks.ca.gov/?page_id=417', address:'4150 Patrick\'s Point Drive, Trinidad, CA 95570'},
    caut:['Site count and rules vary by loop; confirm with the park'],
    src:['https://www.campgroundviews.com/campground/patricks-point-state-park','https://www.parks.ca.gov/?page_id=417 (park ID per parks.ca.gov Find-a-Park list)']});

  // ---------- TAHOE / SIERRA ----------
  K('ca-fallen-leaf-campground','Fallen Leaf Campground','Lake Tahoe Basin Management Unit (US Forest Service)','US Forest Service','tahoe-north','El Dorado',38.9264,-120.047,6340,{
    season:{open:'mid-May', close:'mid-Oct', note:'Open mid-May to mid-October; closed in winter.'},
    status:'seasonal', types:['tent','rv','cabin','yurt'],
    sites:{total:206, hookups:'none', hookupNote:'No hookups for standard sites; cabins and yurts have electricity. Some pull-through sites. RV length limit not listed.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Large forest campground near Fallen Leaf Lake with a camp store, showers and six yurts for families who do not want to pitch a tent.'},
    fees:{nightlyMin:47, nightlyMax:128, note:'Standard nonelectric $47 (+$2 holiday); cabins about $126; yurt/cabin rates to $128 (Outdoorithm mirror of Recreation.gov, 2026-10). Reservation fee extra.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/232769', window:null, phone:'877-444-6777'}),
    contact:{phone:'530-544-0426', url:'https://www.recreation.gov/camping/campgrounds/232769', address:'2165 Fallen Leaf Road, South Lake Tahoe, CA'},
    caut:['Stay limit 14 nights per calendar year','Fire restrictions can be imposed at any time','Register at the entrance kiosk'],
    src:['https://outdoorithm.com/campgrounds/ca/lake-tahoe-basin-management-unit/fallen-leaf-campground']});

  K('ca-william-kent-campground','William Kent Campground','Lake Tahoe Basin Management Unit (US Forest Service)','US Forest Service','tahoe-north','Placer',39.1396,-120.1554,6290,{
    season:{open:'May 23', close:'Oct 13', note:'Operating dates listed for the current season; confirm on Recreation.gov.'},
    status:'seasonal', types:['tent','rv','cabin','yurt'],
    sites:{total:80, hookups:'none', hookupNote:'No electric or water hookups; RV length limit not listed.'},
    amen:{showers:false, flush:true, dump:true, store:true, firepit:null, pets:'yes'},
    fam:{kidNote:'Lakeside-area forest campground on the west shore of Lake Tahoe with a dump station and a store on site.'},
    fees:{nightlyMin:42, nightlyMax:118, note:'Standard nonelectric $42 (+$2 holiday); cabin and yurt about $116 (Outdoorithm mirror of Recreation.gov, 2026-10).'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/232874'}),
    contact:{phone:'530-583-3642', url:'https://www.recreation.gov/camping/campgrounds/232874', address:'1995 West Lake Blvd, Tahoe City, CA'},
    caut:['Bear activity noted in alerts','Stay limit 14 nights','Listing conflicts on whether potable water is available; confirm before relying on it'],
    src:['https://outdoorithm.com/campgrounds/ca/lake-tahoe-basin-management-unit/william-kent-campground']});

  K('ca-emerald-bay-boat-in','Emerald Bay Boat-In Campground','Emerald Bay State Park',CSP,'tahoe-north','El Dorado',38.9599,-120.0966,6200,{
    season:{open:null, close:'Sep 1', note:'Peak late June to early September; closes Sept 1; no winter camping (per an Outdoorithm mirror of ReserveCalifornia).'},
    status:'seasonal', types:['tent','boat-in'],
    sites:{total:20, tent:20, hookups:'none'},
    fam:{boating:true, kidNote:'Reach the camp only by boat (or paddle) across Emerald Bay; plan for a short sheltered crossing and carry everything in.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Standard-site fee as listed on an Outdoorithm mirror of ReserveCalifornia data (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'530-541-3030', url:'https://www.parks.ca.gov/?page_id=506', address:null},
    src:['https://outdoorithm.com/campgrounds/ca/emerald-bay-sp/boat-in-campground']});

  K('ca-gerle-creek-eldorado','Gerle Creek Campground','Eldorado National Forest','US Forest Service','tahoe-north','El Dorado',38.975,-120.3917,5300,{
    season:{open:'May 23', close:'Sep 21', note:'Reservable through Aug 31; Sept 1 to 21 first come, first served (Outdoorithm mirror of Recreation.gov).'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:52, hookups:'none'},
    fam:{kidNote:'Forest campground in the Loon Lake / Rubicon area of the Eldorado National Forest.'},
    fees:{nightlyMin:36, nightlyMax:72, note:'Standard $36, premium $72 plus Recreation.gov reservation fee (Outdoorithm mirror, 2026-10).'},
    book:RG({url:'https://www.recreation.gov/', firstComeNote:'Sept 1 to 21 first come, first served.'}),
    contact:{phone:'831-245-6891', url:'https://www.fs.usda.gov/r05/eldorado', address:null},
    caut:['Phone shown is the concession operator listed on Outdoorithm; confirm with the Eldorado National Forest'],
    src:['https://outdoorithm.com/campgrounds/ca/eldorado/gerle-creek']});

  // ---------- LASSEN: Butte Lake ----------
  K('ca-butte-lake-lassen','Butte Lake Campground','Lassen Volcanic National Park',NPS,'shasta-cascade','Lassen',40.565,-121.3053,6100,{
    season:{open:'May 30', close:'Oct 13', note:'Dates from a third-party listing; the listing is internally inconsistent. Confirm with NPS.'},
    status:'seasonal', types:['tent','rv','group'],
    sites:{total:101, hookups:'none'},
    amen:{flush:true, vault:true, water:true, firepit:true, bearBox:true, pets:'yes', cell:'none'},
    fam:{fishing:true, kidNote:'Quiet campground at a lake in the northeast corner of the park. Motorized boats are not allowed.'},
    fees:{nightlyMin:15, nightlyMax:22, note:'NPS table: $22 full service, $15 dry (2026). Park entrance fee separate.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/234156'}),
    contact:{phone:'530-595-6100', url:'https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm', address:null},
    caut:['Sites limited to 2 vehicles and 6 people','Dogs allowed in campsites, not on trails or lake shores'],
    src:['https://www.nps.gov/lavo/planyourvisit/camping-in-campgrounds.htm','https://outdoorithm.com/campgrounds/ca/lassen-volcanic-np/butte-lake']});

  // ---------- BAY AREA ----------
  K('ca-angel-island-environmental','Angel Island environmental campsites','Angel Island State Park',CSP,'bay-area','Marin',37.8776,-122.4621,null,{
    season:{open:null, close:null, note:'Reservations via ReserveCalifornia; some sites first come, first served.'},
    status:'limited', statusNote:'Park page (10/2026) says open with restrictions: water not available at the Camp Reynolds area, with daily water containers and portable restrooms provided.',
    types:['tent','walk-in','boat-in'],
    sites:{total:11, tent:11, hookups:'none'},
    fam:{beach:true, kidNote:'Reach the island by ferry and camp in one of four small areas with views across the bay. Each site holds up to 8 people.'},
    fees:{note:'Individual site fee not verified. Check ReserveCalifornia.'},
    book:RC({firstComeNote:'Unreserved sites are first come, first served.'}),
    contact:{phone:'415-435-1915', url:'https://www.parks.ca.gov/468', address:null},
    caut:['Dogs are not allowed (service animals only)','Charcoal and camp stoves are allowed at campsites; wood fires are not','Ferry service is limited on winter weekdays (Tiburon 415-435-2131; Golden Gate Ferry 415-455-2000)'],
    src:['https://www.parks.ca.gov/468','https://www.campgroundviews.com/campground/angel-island-state-park']});

  K('ca-francis-beach-half-moon-bay','Half Moon Bay State Beach campground (Francis Beach)','Half Moon Bay State Beach',CSP,'bay-area','San Mateo',37.4688,-122.4458,null,{
    season:{open:'year-round', close:null, note:'Open year-round; coastal fog and afternoon wind are common (third-party listing).'},
    status:'open', types:['tent','rv','walk-in'],
    sites:{total:53, maxRvFt:40, hookups:'some', hookupNote:'State Parks camp map: 40 of 53 sites have electric hookups; one RV per site. 40 ft RV length and the dump station are from a third-party listing.'},
    amen:{dump:true},
    fam:{beach:true, kidNote:'Beachfront campground on the coast south of San Francisco, close to the town of Half Moon Bay.'},
    fees:{note:'Nightly fee not verified from an official page. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'650-726-8819', url:'https://www.parks.ca.gov/?page_id=531', address:'95 Kelly Ave, Half Moon Bay, CA 94019'},
    caut:['Stay limit 7 days May 1 to Oct 31, 15 days the rest of the year (park camp map)','Up to three vehicles per site including towed units'],
    src:['https://www.parks.ca.gov/pages/531/files/HalfMoonBaySB_CampMap011520.pdf','https://thedyrt.com/camping/california/francis-beach-campground']});

  K('ca-butano-ben-ries','Butano State Park family campground','Butano State Park',CSP,'bay-area','San Mateo',37.2133,-122.3097,null,{
    season:{open:null, close:null, note:'Season not stated on the sources read; check ReserveCalifornia.'},
    status:null, types:['tent','walk-in','hike-in'],
    sites:{total:39, hookups:'none'},
    amen:{showers:false, flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{kidNote:'Redwood canyon camp on the San Mateo coast side with 21 drive-in and 18 walk-in family sites; dogs stay in campsites and on paved or fire roads.'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'650-879-2040', url:'https://www.parks.ca.gov/?page_id=536', address:'1500 Cloverdale Road, Pescadero, CA 94060'},
    hi:['Park info sheet lists 39 family sites with tables, food lockers and fire rings','Pin is the park-level Wikipedia coordinate, not the campground gate'],
    caut:['No showers per Wikipedia','Quiet hours 10 p.m. to 8 a.m.; generators not allowed 8 p.m. to 10 a.m.','Dogs not allowed on trails'],
    src:['https://www.parks.ca.gov/pages/536/files/ButanoSPFinalWebLayout2017.pdf','https://en.wikipedia.org/wiki/Butano_State_Park']});

  K('ca-portola-redwoods-family','Portola Redwoods family campground','Portola Redwoods State Park',CSP,'bay-area','San Mateo',37.2597,-122.2,null,{
    season:{open:null, close:null, note:'Season not stated on the park page.'},
    status:'open', statusNote:'Park page (checked 10/2026) says the park is open; the park may close in severe weather.',
    types:['tent','group','hike-in'],
    sites:{total:55, hookups:'none'},
    amen:{store:false, cell:'none', pets:'limited'},
    fam:{kidNote:'Remote redwood camp in the Santa Cruz Mountains with no cell signal; stock up before you drive in (nearest gas is about 14 miles away).'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'650-948-9098', url:'https://www.parks.ca.gov/539', address:null},
    hi:['55-site family campground and 4 group camps per the park page','Firewood sold at the park office or by the camp host'],
    caut:['No cell reception, no store and no gas near the park','Dogs only in campsites and on paved roads','Pin is the park-level Wikipedia coordinate'],
    src:['https://www.parks.ca.gov/539','https://en.wikipedia.org/wiki/Portola_Redwoods_State_Park']});

  K('ca-pantoll-bootjack-mount-tamalpais','Pantoll and Bootjack campgrounds','Mount Tamalpais State Park',CSP,'bay-area','Marin',37.9037,-122.6038,null,{
    season:{open:null, close:null, note:'Not stated on the park page.'},
    status:null, types:['tent','group'],
    sites:{total:null, hookups:null},
    amen:{pets:'limited', ada:true},
    fam:{kidNote:'Close-in Bay Area camping on Mt. Tam; camping and fires are never allowed on the upper mountain.'},
    fees:{note:'Nightly fee and site count not verified. Check the park.'},
    book:{system:'first-come', url:'https://www.parks.ca.gov/471', phone:'415-388-2070', firstComeNote:'Pantoll and Bootjack are first come, first served; Alice Eastwood group camp is reserved through ReserveCalifornia.'},
    contact:{phone:'415-388-2070', url:'https://www.parks.ca.gov/471', address:'3801 Panoramic Highway, Mill Valley, CA 94941'},
    caut:['Camping in vehicles is prohibited in all parking lots','Fires only in provided firepits on the lower mountain and not during a red flag alert','Dogs leashed; allowed in campgrounds but only on certain paved roads and fire roads elsewhere'],
    src:['https://parks.ca.gov/?page_id=471','https://www.campgroundviews.com/campground/mount-tamalpais-state-park-2']});

  K('ca-steep-ravine-mount-tamalpais','Steep Ravine Environmental Campground','Mount Tamalpais State Park',CSP,'bay-area','Marin',37.8866,-122.6263,null,{
    season:{open:null, close:null, note:'A third-party listing says it is closed in October for annual maintenance; confirm on ReserveCalifornia.'},
    status:null, types:['tent','cabin','walk-in'],
    sites:{total:7, hookups:'none'},
    amen:{pets:'no', ada:true},
    fam:{beach:true, kidNote:'Seaside tent sites and rustic cabins on the Pacific shore near Stinson Beach; one of the most requested reservations in the Bay Area.'},
    fees:{note:'Nightly fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'415-388-2070', url:'https://www.parks.ca.gov/471', address:'3303 Shoreline Hwy, Stinson Beach, CA 94970'},
    caut:['RVs and trailers are not allowed (third-party listing)','No pets, including dogs, at Steep Ravine (third-party listing)'],
    src:['https://www.campgroundviews.com/campground/rocky-point-steep-ravine-environmental-campground','https://www.camp-california.com/campground/mount-tamalpais-sp/','https://parks.ca.gov/?page_id=471']});

  K('ca-bullfrog-pond-austin-creek','Bullfrog Pond Campground','Austin Creek State Recreation Area',CSP,'bay-area','Sonoma',38.538,-123.01,null,{
    season:{open:null, close:null, note:null},
    status:'closed-check', statusNote:'Park page (2026-10) says camping at Austin Creek is closed until further notice due to the Wallbridge Fire.',
    types:['tent'],
    sites:{total:null},
    fam:{kidNote:'Austin Creek camping is reached through the Armstrong Redwoods entrance; confirm it has reopened before planning a trip.'},
    fees:{note:'Not verified.'},
    book:RC(),
    contact:{phone:'707-869-2015', url:'https://www.parks.ca.gov/450', address:null},
    caut:['Camping closed until further notice (Wallbridge Fire)','Dogs only within a registered campsite; not on dirt trails','Pin is the Armstrong Redwoods park-level coordinate, not the campground'],
    src:['https://www.parks.ca.gov/450','https://en.wikipedia.org/wiki/Armstrong_Redwoods_State_Natural_Reserve']});

  /*__MORE__*/
})();
