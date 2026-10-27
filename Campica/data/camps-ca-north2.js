/* Campica data pack: Northern California campgrounds, top-up. Facts only from sources listed in SOURCES-camps-north2.md.
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
  function RC(extra){ return mix({system:'reservecalifornia', url:'https://www.reservecalifornia.com/', phone:'800-444-7275', window:RC_WINDOW, cancelNote:RC_CANCEL}, extra); }
  function RG(extra){ return mix({system:'recreation.gov', url:'https://www.recreation.gov/', phone:'877-444-6777'}, extra); }
  var CSP = 'California State Parks';
  var MIRROR = 'Standard-site fee as listed on an Outdoorithm mirror of ReserveCalifornia data (2026-10). Confirm at booking.';

  // ---------- TAHOE / SIERRA ----------
  K('ca-dl-bliss-state-park','D. L. Bliss State Park Campground','D. L. Bliss State Park',CSP,'tahoe-north','El Dorado',38.9963,-120.1034,6200,{
    season:{note:'Closed for camping and vehicle traffic in winter; the Outdoorithm mirror gave a late-May reopening and a late-May to September peak. Confirm dates with the park.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:165, maxTrailerFt:15, maxRvFt:18, hookups:'none', hookupNote:'No hookups (per park info sheet). The info sheet says some sites fit trailers to 15 ft or motorhomes to 18 ft.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{swim:true, beach:true, easyTrails:true, kidNote:'Sandy beaches at Lester Beach and Calawee Cove for swimming and picnics; the Lighthouse Trail loop is 0.9 miles one way.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:MIRROR+' Day-use parking is $10 per vehicle per day (park info sheet).'},
    book:RC(),
    contact:{phone:'530-525-9528', url:'https://parks.ca.gov/?lang=en&page_id=505', address:'Lester Beach Road, South Lake Tahoe, CA 96150'},
    hi:['165 sites, each with a table and food locker (info sheet)','Lake Tahoe beaches within the park'],
    caut:['Bear country: store all food and garbage in bear-resistant lockers or dumpsters; cars and coolers are not bear-proof','Dogs allowed in the campground only, not on trails or beaches','No jumping or diving into the water from shore, rocks or piers','Outdoorithm lists 250 sites; the official info sheet says 165 (used)'],
    src:['https://www.parks.ca.gov/pages/505/files/DLBlissSP_Infosheet_85x11_061725_FINAL.pdf','https://www.outdoorithm.com/campgrounds/ca/d-l-bliss-sp/beach-campground']});

  K('ca-general-creek-sugar-pine-point','General Creek Campground','Ed Z\'berg Sugar Pine Point State Park',CSP,'tahoe-north','El Dorado',39.057845,-120.121935,null,{
    season:{open:'late May', close:'Sep 30', note:'Park info sheet says open year-round, conditions permitting. Campflare notes full services late May to Sept 30, then first-come in the first loop only, with showers and dump station closed for winter. Summer opening can be delayed by snowpack.'},
    status:'open', types:['tent','rv'],
    sites:{total:175, maxRvFt:32, maxTrailerFt:26, hookups:'none', hookupNote:'No hookups listed. Max RV 32 ft and trailer 26 ft, no pull-throughs (Campflare).'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited', cell:'none'},
    fam:{swim:true, beach:true, easyTrails:true, kidNote:'Swimming beach and pier, a paved quarter-mile lakefront interpretive trail and the historic Pine Lodge nearby (info sheet).'},
    fees:{nightlyMin:35, reservationFee:8.25, note:'Fee as listed on Campflare (2026-10). Showers are coin-operated in summer. Confirm at booking.'},
    book:RC(),
    contact:{phone:'530-525-9528', url:'https://www.parks.ca.gov/pages/510/files/EdZbergSugarPinePointSP_Infosheet_052825_FINAL.pdf', address:'7360 West Lake Boulevard, Tahoma, CA 96142'},
    hi:['175 sites per the park info sheet','Close to a Lake Tahoe swimming beach'],
    caut:['Black bears live here: store food properly and never feed wildlife','Dogs allowed in developed areas and campsites on a 6 ft leash, not on beaches or dirt trails','No cell service reported on the three major carriers'],
    src:['https://www.parks.ca.gov/pages/510/files/EdZbergSugarPinePointSP_Infosheet_052825_FINAL.pdf','https://campflare.com/campground/rc-724-726']});

  K('ca-donner-memorial-campground','Donner Memorial State Park Campground','Donner Memorial State Park',CSP,'tahoe-north','Nevada',39.3197831833,-120.2368371627,6000,{
    season:{open:'Memorial Day', close:'mid-September', note:'Park info sheet: Memorial Day to mid-September, weather permitting. Outdoorithm says into mid-October depending on snow. Confirm dates.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:154, hookups:'none', hookupNote:'No RV hookups (info sheet). Vehicle length not found.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{swim:true, beach:true, easyTrails:true, kidNote:'Beach on Donner Lake, a half-mile boardwalk nature trail and a visitor center (park info sheet).'},
    fees:{nightlyMin:35, extraVehicle:10, reservationFee:8.25, note:MIRROR+' Second vehicle $10 per night per the same mirror.'},
    book:RC(),
    contact:{phone:'530-582-7892', url:'https://www.parks.ca.gov/pages/503/files/DonnerMemorialSP_InfoSheet_8.5x14_102924_FINAL.pdf', address:'12593 Donner Pass Road, Truckee, CA 96161'},
    hi:['154 sites with picnic tables; hot showers nearby (info sheet)','Bear-resistant food lockers at every site (mirror)'],
    caut:['Dogs allowed in the campground on a 6 ft leash but not in the visitor center or on the nature trail','High elevation: cold nights even in summer'],
    src:['https://www.parks.ca.gov/pages/503/files/DonnerMemorialSP_InfoSheet_8.5x14_102924_FINAL.pdf','https://www.outdoorithm.com/campgrounds/ca/donner-memorial-sp/state-park-campground']});

  K('ca-meeks-bay-resort-campground','Meeks Bay Resort Campground','Meeks Bay Resort (Lake Tahoe Basin Management Unit)','USDA Forest Service permit, operated by the Washoe Tribe of Nevada and California','tahoe-north','El Dorado',null,null,null,{
    status:null, types:['tent','rv','cabin'],
    sites:{total:77, rv:23, tent:54, hookups:'full', hookupNote:'23 full-hookup RV sites north of Meeks Creek; some pull-throughs fit 60 ft combined length. 14 tent sites north and 40 south of the creek (Recreation.gov).'},
    amen:{showers:true, flush:true, store:true, pets:'no'},
    fam:{swim:true, beach:true, boating:true, kidNote:'Sandy Lake Tahoe beach, kayak and paddleboard rentals and a grill and general store on site.'},
    fees:{note:'Rates were not listed on the page read. Booking needs a 50% non-refundable down payment; changes and late cancellations cost $10 per site. Check Recreation.gov.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/10220612', phone:'530-525-6946'}),
    contact:{phone:'530-525-6946', url:'https://www.recreation.gov/camping/campgrounds/10220612'},
    hi:['Beachfront Tahoe resort camping with general store, grill and token showers','Lodging also available'],
    caut:['Pets are not allowed anywhere on the resort property','Season dates and coordinates not verified; check with the resort'],
    src:['https://www.recreation.gov/camping/campgrounds/10220612?tab=info']});

  K('ca-grover-hot-springs-campground','Grover Hot Springs Campground','Grover Hot Springs State Park',CSP,'tahoe-north','Alpine',38.699209,-119.834559,5900,{
    season:{open:'Memorial Day', close:'Oct', note:'Park sheet: Memorial Day through October, weather permitting. Summer reservations roughly mid-May to mid-September; winter camping moves to 20 first-come sites in the day-use area (RVs and trailers limited to 18 ft there).'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:76, hookups:'none', hookupNote:'No electric, water or sewer hookups and no dump station (Outdoorithm).'},
    amen:{showers:true, flush:true, water:true, store:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{swim:true, juniorRanger:true, rangerPrograms:true, easyTrails:true, kidNote:'A cool swimming pool plus a hot soaking pool (kept about 102 to 104 F; day-use fee applies). Summer campfire and Junior Ranger programs.'},
    fees:{nightlyMin:25, nightlyMax:35, extraVehicle:8, reservationFee:8.25, note:'Per Outdoorithm mirror (2026-10): $35 summer, $25 winter, hike-and-bike $10, extra vehicle $8. Confirm at booking.'},
    book:RC(),
    contact:{phone:'530-694-2248', url:'https://www.parks.ca.gov/?page_id=508', address:'3415 Hot Springs Road, Markleeville, CA 96120'},
    hi:['Campground adjoins natural hot springs pools','More than 75 sites in summer per the park sheet'],
    caut:['Bears day and night: use bear-resistant lockers, no scented items in vehicles','Near 6,000 ft: sudden thunderstorms possible','Pools close Wednesdays from Labor Day to Memorial Day'],
    src:['https://www.parks.ca.gov/pages/508/files/GroverHotSpringsSPWebLayout2015.pdf','https://www.outdoorithm.com/campgrounds/ca/grover-hot-springs-sp/state-park-campground']});

  K('ca-upper-jamison-plumas-eureka','Upper Jamison Creek Campground','Plumas-Eureka State Park',CSP,'tahoe-north','Plumas',null,null,null,{
    status:null, types:['tent','rv','group'],
    sites:{hookups:null},
    amen:{showers:true, flush:true, ada:true},
    fam:{kidNote:null},
    fees:{note:'Campsite fees not found on the pages read. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'530-836-2380', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/507', address:null},
    hi:['Combination restroom and shower buildings; accessible sites 9, 12, 20 and 39 (park accessibility page)','Park is about five miles west of Blairsden on County Road A-14'],
    caut:['Site count, season, vehicle limits, coordinates and fees not verified: check with the park','Camp Lisa group campground is also in the park'],
    src:['https://www.parks.ca.gov/AccessibleFeatures/Details/507']});

  // ---------- GOLD COUNTRY / FOOTHILLS ----------
  K('ca-oak-hollow-calaveras-big-trees','Oak Hollow Campground','Calaveras Big Trees State Park',CSP,'gold-country','Calaveras',38.273188426,-120.290095573,4436,{
    season:{open:'May 15', close:'Oct 1', note:'Season per the Outdoorithm mirror. Park sheet: outside the reservation season only sites 1-11 are open first-come as dry camping. Prescribed burns in spring and fall can close parts of the park.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:55, maxRvFt:30, hookups:'none', hookupNote:'No RV hookups; a seasonal dump station exists (park sheet). 55 sites per mirror; the official count was not on the sheet.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'limited', cell:'none'},
    fam:{rangerPrograms:true, easyTrails:true, kidNote:'Giant sequoia groves nearby; weekend programs year-round and daily in summer. Food trailer in summer.'},
    fees:{nightlyMin:35, nightlyMax:40, reservationFee:8.25, note:'$35 standard, $40 peak or holiday (Outdoorithm mirror, 2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'209-795-2334', url:'https://www.parks.ca.gov/pages/551/files/CalaverasBigTreesSP_11x17_Infosheet_060726_FINAL.pdf', address:'1170 CA-4, Arnold, CA 95223'},
    hi:['Sequoia grove park; North Grove Campground is the park\'s other campground'],
    caut:['Zero-tolerance bear policy: store food, scented items and garbage in lockers','Dogs not allowed on trails','Parkway past the visitor center closes to vehicles after first major snow or Dec 1'],
    src:['https://www.parks.ca.gov/pages/551/files/CalaverasBigTreesSP_11x17_Infosheet_060726_FINAL.pdf','https://www.outdoorithm.com/campgrounds/ca/calaveras-big-trees-sp/oak-hollow-campground']});

  K('ca-beals-point-folsom-lake','Beals Point Campground','Folsom Lake State Recreation Area',CSP,'gold-country','Placer',38.7184781,-121.1732447,495,{
    season:{note:'Mirror lists year-round; reservations required in peak season (about May 15 to Sept 15), first-come off-season. Confirm.'},
    status:'open', types:['tent','rv'],
    sites:{total:69, rv:20, tent:49, maxRvFt:31, hookups:'full', hookupNote:'20 RV hookup sites for rigs to 31 ft (park sheet); mirror says electric, water and sewer in sites 50-69.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'yes'},
    fam:{swim:true, beach:true, boating:true, kidNote:'Next to Folsom Lake; swim only in designated areas and no diving (park rule).'},
    fees:{nightlyMin:28, nightlyMax:58, reservationFee:8.25, note:'Per Outdoorithm mirror (2026-10): standard $33, hookup $58, lower off-peak tent rates. Confirm at booking.'},
    book:RC(),
    contact:{phone:'916-988-0205', url:'https://www.parks.ca.gov/pages/500/files/FolsomLake_FINALWebLayout_20220811.pdf', address:'7755 Folsom-Auburn Road, Folsom, CA 95630'},
    hi:['49 family sites plus 20 hookup sites (park sheet)'],
    caut:['Mirror coordinates differ slightly from its map link (38.7204, -121.1726)','Summer heat in the Sacramento foothills'],
    src:['https://www.parks.ca.gov/pages/500/files/FolsomLake_FINALWebLayout_20220811.pdf','https://outdoorithm.com/campgrounds/ca/folsom-lake-sra/beals-point-campground']});

  K('ca-peninsula-folsom-lake','Peninsula Campground','Folsom Lake State Recreation Area',CSP,'gold-country','Placer',null,null,null,{
    status:null, types:['tent','rv'],
    sites:{total:100, maxTrailerFt:18, maxRvFt:24, hookups:'none', hookupNote:'About 100 sites, no hookups; trailers to 18 ft and motorhomes to 24 ft (park sheet).'},
    amen:{showers:true, flush:true, water:true, ada:true},
    fam:{boating:true},
    fees:{note:'Fee not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'916-988-0205', url:'https://www.parks.ca.gov/pages/500/files/FolsomLake_FINALWebLayout_20220811.pdf', address:'7755 Folsom-Auburn Road, Folsom, CA 95630 (park address)'},
    hi:['Set between the north and south forks of the American River where they meet the lake'],
    caut:['Season, coordinates and fee not verified'],
    src:['https://www.parks.ca.gov/pages/500/files/FolsomLake_FINALWebLayout_20220811.pdf']});

  K('ca-bidwell-canyon-lake-oroville','Bidwell Canyon Campground','Lake Oroville State Recreation Area',CSP,'gold-country','Butte',39.5340523,-121.4575553,945,{
    season:{note:'Park says campgrounds are open 24 hours; mirror says year-round. Confirm current status.'},
    status:'open', types:['tent','rv'],
    sites:{total:75, maxTrailerFt:31, maxRvFt:40, hookups:'full', hookupNote:'Full hookups per Outdoorithm mirror; park page did not state which campgrounds have hookups.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, firepit:true, pets:'limited'},
    fam:{boating:true, fishing:true, kidNote:'Reservoir with boat launch nearby.'},
    fees:{nightlyMin:45, reservationFee:8.25, note:MIRROR},
    book:RC({firstComeNote:'ReserveCalifornia park ID 662 (per park page).'}),
    contact:{phone:'530-538-2218', url:'https://www.parks.ca.gov/?lang=en&page_id=462', address:'801 Bidwell Canyon Road, Oroville, CA 95966'},
    hi:['75 sites per mirror; 24-hour access'],
    caut:['Lake levels vary with the water year','Dogs allowed in campgrounds but not on trails or day-use areas (park rule)'],
    src:['https://www.parks.ca.gov/?lang=en&page_id=462','https://www.outdoorithm.com/campgrounds/ca/lake-oroville-sra/bidwell-canyon-campground']});

  // ---------- MENDOCINO / SONOMA COAST ----------
  K('ca-mackerricher-campground','MacKerricher State Park Campgrounds','MacKerricher State Park',CSP,'north-coast','Mendocino',39.49042,-123.79205,62,{
    season:{note:'Mirror: year-round, with a closure about Dec 2 to Dec 23 for renovations; Surfwood and East Pinewood seasonal, West Pinewood year-round. Confirm.'},
    status:'open', types:['tent','rv','walk-in','group'],
    sites:{total:140, hookups:'none', hookupNote:'Dump station listed; no hookups listed.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{beach:true, juniorRanger:true, rangerPrograms:true, easyTrails:true, kidNote:'Junior Ranger and campfire programs posted in the park; beach and boardwalk trail nearby.'},
    fees:{reservationFee:8.25, note:'Nightly fee not found (mirror showed none). Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-937-5804', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/436', address:'24100 MacKerricher Park Road, Fort Bragg, CA 95437'},
    hi:['More than 140 sites; 10 walk-in sites at Surfwood (park sheet, 2017)'],
    caut:['Never turn your back on the ocean','Dogs on a leash of 6 ft max, in tent or vehicle at night','Phone: the park sheet lists 707-937-5804 for the district; the mirror shows a different provider line'],
    src:['https://demo2.parks.ca.gov/pages/436/files/MacKerricherSPFinalWebLayout073117.pdf','https://www.outdoorithm.com/campgrounds/ca/mackerricher-sp/state-park-campground']});

  K('ca-russian-gulch-campground','Russian Gulch State Park Campground','Russian Gulch State Park',CSP,'north-coast','Mendocino',39.3304182,-123.8005468,52,{
    season:{open:'May', close:'Labor Day', note:'Closed in winter; reservations May through Labor Day (park page).'},
    status:'seasonal', types:['tent','rv','group','equestrian'],
    sites:{total:30, maxTrailerFt:24, maxRvFt:24, hookups:'none', hookupNote:'No hookups or dump station (mirror). Park page gives 30 sites in one place and 26 standard + 4 equestrian + 1 group in another.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'limited', cell:'none'},
    fam:{beach:true, juniorRanger:true, rangerPrograms:true, easyTrails:true, kidNote:'Summer interpretive hikes for all ages and Junior Ranger programs for ages 7 to 12.'},
    fees:{nightlyMin:45, reservationFee:8.25, note:MIRROR+' Pay showers.'},
    book:RC(),
    contact:{phone:'707-937-5804', url:'https://parks.ca.gov/?page_id=432', address:null},
    hi:['Trailers and motorhomes both limited to 24 ft (park page)'],
    caut:['Stay back from bluff edges; rogue waves, cold swift water, no continuous lifeguards','Dogs leashed 6 ft max; inside tent or vehicle at night'],
    src:['https://parks.ca.gov/?page_id=432','https://outdoorithm.com/campgrounds/ca/russian-gulch-sp/state-park-campground']});

  K('ca-van-damme-little-river-campground','Little River Campground','Van Damme State Park',CSP,'north-coast','Mendocino',39.2797385,-123.7865795,220,{
    season:{note:'Mirror lists year-round, peak spring through fall.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:65, maxRvFt:35, hookups:'none', hookupNote:'Dump station listed; no hookups listed. A temporary narrow bridge serves sites east of Little River; mirror users suggest trailers of 24 to 27 ft.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{beach:true, easyTrails:true, kidNote:'Family campground in Little River; specific beach and trail details not verified.'},
    fees:{nightlyMin:45, reservationFee:8.25, note:MIRROR+' Firewood and dump $10 each.'},
    book:RC(),
    contact:{phone:'707-937-5804', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/433', address:null},
    hi:['Three licensed vehicles or trailers per site (park map)'],
    caut:['Dogs leashed 6 ft max; not on most trails','Quiet hours 10 p.m. to 6 a.m.; no generators 8 p.m. to 10 a.m.'],
    src:['https://demo2.parks.ca.gov/pages/433/files/VanDamSBPDF.pdf','https://outdoorithm.com/campgrounds/ca/van-damme-sp/state-park-campground']});

  K('ca-azalea-hendy-woods','Azalea Campground','Hendy Woods State Park',CSP,'north-coast','Mendocino',39.076272,-123.476329,null,{
    season:{note:'Reservations late April to Sept 30, first-come the rest of the year (Campflare). Park page says the park is open year-round.'},
    status:'open', types:['tent','rv'],
    sites:{total:43, maxRvFt:35, hookups:'partial', hookupNote:'Electric at a few sites (37, 40, 41); dump station; no pull-throughs (Campflare). Park-wide count is 92 sites plus 4 cabins (park page).'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'limited', cell:'Verizon only'},
    fam:{juniorRanger:true, rangerPrograms:true, easyTrails:true, kidNote:'Redwood groves with Junior Ranger events, family programs and geocaching.'},
    fees:{nightlyMin:45, reservationFee:8.25, note:'Fee per Campflare (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-895-3537', url:'https://parks.ca.gov/?page_id=438', address:null},
    hi:['Old-growth redwood groves in the Anderson Valley'],
    caut:['Dogs not allowed on trails','Early-morning noise and spraying from neighbouring farms can occur'],
    src:['https://parks.ca.gov/?page_id=438','https://campflare.com/campground/rc-654-502']});

  K('ca-gerstle-cove-salt-point','Gerstle Cove Campground','Salt Point State Park',CSP,'north-coast','Sonoma',38.5688727,-123.3248053,262,{
    season:{note:'Mirror lists year-round, peak March 15 to Oct 31. Elevation is a rough mirror figure.'},
    status:'open', types:['tent','rv'],
    sites:{total:30, hookups:'none', hookupNote:'No hookups or dump station; small RVs only practical due to winding road (mirror).'},
    amen:{flush:true, water:false, firepit:true, bearBox:true, pets:'limited'},
    fam:{beach:true, easyTrails:true, kidNote:'Next to Gerstle Cove marine reserve and tidepools.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:MIRROR},
    book:RC(),
    contact:{phone:'707-847-3221', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/453', address:null},
    hi:['Sites 1 to 30 on the park map'],
    caut:['No potable water or showers reported at this campground','Dogs not on trails or beaches; leashed 6 ft max'],
    src:['https://www.outdoorithm.com/campgrounds/ca/salt-point-sp/gerstle-cove-campground','https://www.parks.ca.gov/pages/453/files/SaltPointSPCampMap_061616-45.pdf']});

  K('ca-woodside-salt-point','Woodside Campground','Salt Point State Park',CSP,'north-coast','Sonoma',null,null,null,{
    status:null, types:['tent','rv'],
    sites:{total:79, hookups:null, hookupNote:'Sites 31 to 109 (Lower Loop 31-70, Upper Loop 71-109) per park camp map.'},
    amen:{pets:'limited'},
    fees:{note:'Fee, season, coordinates and amenities not verified. Check ReserveCalifornia.'},
    book:RC(),
    contact:{phone:'707-847-3221', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/453', address:null},
    hi:['79 sites per the park camp map'],
    caut:['Only the site count was verified; call the park for the rest'],
    src:['https://www.parks.ca.gov/pages/453/files/SaltPointSPCampMap_061616-45.pdf']});

  K('ca-bodega-dunes-sonoma-coast','Bodega Dunes Campground','Sonoma Coast State Park',CSP,'north-coast','Sonoma',38.3381431,-123.0554727,46,{
    season:{note:'Mirror lists year-round; peak about May to September.'},
    status:'open', types:['tent','rv'],
    sites:{total:99, hookups:'none', hookupNote:'Dry camping only; dump station (mirror).'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited'},
    fam:{beach:true, bikeFriendly:true, kidNote:'Beach access near Bodega Bay; bike-in sites.'},
    fees:{nightlyMin:35, nightlyMax:45, reservationFee:8.25, note:'Standard to premium per mirror (2026-10); firewood extra. Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-875-3483', url:'https://www.parks.ca.gov/pages/451/files/SonomaCoast%20E%20Camps063016.pdf', address:'2485 Highway 1, Bodega Bay, CA 94923'},
    hi:['99 sites with hot showers per mirror'],
    caut:['Dogs leashed 6 ft max; max 8 people and 2 vehicles per site','Check-in 2 p.m., check-out noon'],
    src:['https://www.outdoorithm.com/campgrounds/ca/sonoma-coast-sp/bodega-dunes-campground','https://www.parks.ca.gov/pages/451/files/SonomaCoast%20E%20Camps063016.pdf']});

  K('ca-wrights-beach-sonoma-coast','Wright\'s Beach Campground','Sonoma Coast State Park',CSP,'north-coast','Sonoma',38.4002415,-123.0950755,26,{
    season:{note:'Mirror lists year-round.'},
    status:'open', types:['tent','rv'],
    sites:{total:11, hookups:'none', hookupNote:'Hookups not listed; vehicle length limit not stated.'},
    amen:{showers:false, flush:true, water:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{beach:true, kidNote:'Sites sit by the beach; strong surf and cold water.'},
    fees:{nightlyMin:35, nightlyMax:50, extraVehicle:8, reservationFee:8.25, note:'Per mirror (2026-10): standard $35-45, premium $50. Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-875-3483', url:'https://www.parks.ca.gov/pages/451/files/SonomaCoast%20E%20Camps063016.pdf', address:'7095 Highway 1, Bodega Bay, CA 94923'},
    hi:['Beachfront sites; small campground, books up early'],
    caut:['No showers','Never turn your back on the ocean; dogs leashed 6 ft max'],
    src:['https://www.outdoorithm.com/campgrounds/ca/sonoma-coast-sp/wright-s-beach-campground','https://www.parks.ca.gov/pages/451/files/SonomaCoast%20E%20Camps063016.pdf']});

  K('ca-standish-hickey-campground','Standish-Hickey Campgrounds','Standish-Hickey State Recreation Area',CSP,'north-coast','Mendocino',39.8764213,-123.7274131,820,{
    season:{note:'Mirror lists year-round, peak pricing mid-May to mid-September; park sheet says Hickey and Rock Creek are seasonal (dates not given).'},
    status:'open', types:['tent','rv'],
    sites:{total:160, hookups:'none', hookupNote:'No hookups (mirror). Pads about 27 ft.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{swim:true, rangerPrograms:true, fishing:true, kidNote:'South Fork Eel River swimming holes with no lifeguards; summer campfire programs.'},
    fees:{nightlyMin:25, nightlyMax:40, reservationFee:8.25, note:'Per mirror (2026-10): $35 standard. Confirm at booking.'},
    book:RC(),
    contact:{phone:'707-925-6482', url:'https://www.parks.ca.gov/pages/423/files/Standish-HickeySRAFinalWebLayout2019.pdf', address:'69350 US Highway 101, Leggett, CA 95455'},
    hi:['Redwoods and river swimming beside Highway 101'],
    caut:['No diving or jumping into the river; poison oak; bear lockers for food','Mirror coordinates differ slightly from its map link (39.8775, -123.7376)'],
    src:['https://www.parks.ca.gov/pages/423/files/Standish-HickeySRAFinalWebLayout2019.pdf','https://www.outdoorithm.com/campgrounds/ca/standish-hickey-sra/state-recreation-campground']});

  // ---------- BAY AREA / WINE COUNTRY ----------
  K('ca-juniper-mount-diablo','Juniper Campground','Mount Diablo State Park',CSP,'bay-area','Contra Costa',37.87858,-121.93378,3000,{
    season:{note:'Campflare: open year-round; gates lock at sunset. In fire season (May to Oct) call the park a day ahead.'},
    status:'open', types:['tent','rv'],
    sites:{total:36, maxRvFt:20, maxTrailerFt:20, hookups:'none', hookupNote:'Single loop of 36 sites; RVs and trailers to 20 ft. Park sheet says more than 50 sites park-wide across Juniper, Live Oak and Wildcat.'},
    amen:{showers:true, flush:true, water:true, firepit:true, pets:'limited', ada:true},
    fam:{easyTrails:true, kidNote:'Summit road and visitor center nearby; steep, narrow park roads.'},
    fees:{nightlyMin:30, reservationFee:8.25, note:'Per Campflare (2026-10). Confirm at booking.'},
    book:RC(),
    contact:{phone:'925-837-2525', url:'https://www.parks.ca.gov/pages/517/files/MountDiabloFinalWebLayout2018.pdf', address:'96 Mitchell Canyon Road, Clayton, CA 94517 (park address)'},
    hi:['Hot showers at no extra cost per Campflare; accessible sites at Juniper (park sheet)'],
    caut:['Fire danger high from early June to first rain; smoking prohibited then','Dogs not on trails or fire roads','Elevation is approximate'],
    src:['https://campflare.com/campground/rc-683-592','https://www.parks.ca.gov/pages/517/files/MountDiabloFinalWebLayout2018.pdf']});

  K('ca-back-ranch-meadows-china-camp','Back Ranch Meadows Campground','China Camp State Park',CSP,'bay-area','Marin',38.0056554,-122.4948589,72,{
    season:{note:'Mirror lists year-round, peak June to September.'},
    status:'open', types:['tent','walk-in'],
    sites:{total:33, hookups:'none', hookupNote:'Walk-in only: gear carried 50 to 300 yards; no RVs (mirror). The park accessibility page lists 8 walk-in or bike-in sites, so counts conflict.'},
    amen:{showers:true, flush:true, water:true, firepit:true, ada:true},
    fam:{beach:true, bikeFriendly:true, easyTrails:true, kidNote:'San Pablo Bay shoreline and hiking and biking trails.'},
    fees:{nightlyMin:35, reservationFee:8.25, note:MIRROR},
    book:RC(),
    contact:{phone:'415-456-0766', url:'https://www.parks.ca.gov/AccessibleFeatures/Details/466', address:null},
    hi:['Bay views close to San Rafael'],
    caut:['Site count conflicts between sources: confirm before booking','Mirror warns accessible facilities may be under repair'],
    src:['https://www.outdoorithm.com/campgrounds/ca/china-camp-sp/state-park-campground','https://www.parks.ca.gov/AccessibleFeatures/Details/466']});

  K('ca-bothe-napa-valley-campground','Bothe-Napa Valley State Park Campground','Bothe-Napa Valley State Park',CSP,'north-coast','Napa',null,null,null,{
    season:{note:'Reservations strongly recommended late spring to early fall (Napa Outdoors).'},
    status:'open', types:['tent','rv','walk-in','group'],
    sites:{total:44, rv:30, tent:9, maxRvFt:31, maxTrailerFt:24, hookups:'none', hookupNote:'30 tent/RV sites (no hookups), 9 walk-in tent sites, 3 accessible drive-in sites, 1 hike/bike, 1 group; no dump station.'},
    amen:{showers:true, flush:true, dump:false, pets:null},
    fees:{nightlyMin:40, nightlyMax:43, extraVehicle:15, note:'Napa Outdoors page: $43 per night, seniors $40, second car $15, hike/bike $6 per person; raised Sept 26, 2025.'},
    book:RC(),
    contact:{phone:'707-942-4575', url:'https://napaoutdoors.org/parks/bothe-napa-valley-state-park/camping-bothe-napa-valley-state-park', address:'3801 St. Helena Highway, Calistoga, CA 94515'},
    hi:['Max RV 31 ft, trailer 24 ft; coin-operated showers'],
    caut:['Campfire bans in dry months','Coordinates and pet rules not verified'],
    src:['https://napaoutdoors.org/parks/bothe-napa-valley-state-park/camping-bothe-napa-valley-state-park']});

  K('ca-sugarloaf-ridge-campground','Sugarloaf Ridge State Park Campground','Sugarloaf Ridge State Park',CSP,'north-coast','Sonoma',38.4366107,-122.5141953,1200,{
    season:{open:'Mar 15', close:'Oct 31', note:'Reservations Mar 15 to Oct 31; first-come Nov 1 to Mar 14 (park sheet).'},
    status:'open', types:['tent','rv','group'],
    sites:{total:49, maxRvFt:27, maxTrailerFt:24, hookups:'none', hookupNote:'49 developed sites; trailers to 24 ft, RVs to 27 ft (park sheet).'},
    amen:{showers:true, flush:true, water:true, firepit:true, pets:'limited'},
    fam:{easyTrails:true, kidNote:'Park has hiking trails; details beyond the campground not verified.'},
    fees:{nightlyMin:30, reservationFee:8.25, note:MIRROR},
    book:RC(),
    contact:{phone:'707-833-5712', url:'https://www.parks.ca.gov/pages/481/files/SugarLoafPDF.pdf', address:'2605 Adobe Canyon Road, Kenwood, CA 95452'},
    hi:['49 sites per the park sheet'],
    caut:['Max 7 consecutive days and 30 days per year','Dogs not on trails; wildfire risk in dry season'],
    src:['https://www.parks.ca.gov/pages/481/files/SugarLoafPDF.pdf','https://outdoorithm.com/campgrounds/ca/sugarloaf-ridge-sp/state-park-campground']});

  K('ca-kelsey-creek-clear-lake','Kelsey Creek Campground','Clear Lake State Park',CSP,'north-coast','Lake',39.0176094,-122.8123773,1320,{
    season:{note:'Park page: open year-round, reservations recommended mid-May to mid-September.'},
    status:'open', types:['tent','rv','cabin','group'],
    sites:{total:65, hookups:'none', hookupNote:'No electric or water hookups at sites; dump station (mirror). Park-wide: 149 developed sites in four campgrounds (Wikipedia).'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, firepit:true, bearBox:true, pets:'limited'},
    fam:{swim:true, boating:true, fishing:true, kidNote:'Swim area is closed to boats, fishing and dogs; children 12 and under must wear a life jacket on boats.'},
    fees:{nightlyMin:30, extraVehicle:8, reservationFee:8.25, note:'Per mirror (2026-10). Shower tokens $1 for 4 minutes.'},
    book:RC(),
    contact:{phone:'707-279-4293', url:'https://www.parks.ca.gov/pages/473/files/ClearLakeSP_CampMap2019.pdf', address:'5300 Soda Bay Road, Kelseyville, CA 95451'},
    hi:['Eight cabins in the park; other campgrounds are Cole Creek and the Bayview loops'],
    caut:['Dogs only on paved roads or in the campsite, not on trails','Blue-green algae notices are possible on Clear Lake; check posted advisories'],
    src:['https://www.outdoorithm.com/campgrounds/ca/clear-lake-sp/kelsey-creek-campground','https://www.parks.ca.gov/pages/473/files/ClearLakeSP_CampMap2019.pdf','https://en.wikipedia.org/wiki/Clear_Lake_State_Park_(California)']});

  K('ca-liberty-glen-lake-sonoma','Liberty Glen Campground','Lake Sonoma (Warm Springs Dam)','U.S. Army Corps of Engineers','north-coast','Sonoma',38.7136111,-123.0563889,1050,{
    season:{open:'Apr 1', close:'Dec 31', note:'Per Outdoorithm mirror of Recreation.gov data.'},
    status:'seasonal', types:['tent','rv','cabin','group'],
    sites:{total:100, hookups:'none', hookupNote:'No electric or water hookups; no dump station. Recreation.gov lists 99 sites (95 standard, 1 cabin, 3 group).'},
    amen:{showers:true, flush:true, water:true, firepit:true, cell:'none'},
    fam:{playground:true, easyTrails:true, kidNote:'Playground, disc golf, archery range and trailheads in the campground; no shoreline access.'},
    fees:{nightlyMin:25, reservationFee:null, note:'Mirror lists $25 to $100 including group and cabin rates; standard site fee not isolated. Check Recreation.gov.'},
    book:RG({url:'https://www.recreation.gov/camping/campgrounds/233537', phone:'877-444-6777', firstComeNote:'Gate combination comes with your reservation.'}),
    contact:{phone:'707-431-4533', url:'https://www.recreation.gov/camping/campgrounds/233537'},
    hi:['Playground and recreation area inside the campground'],
    caut:['Campground is gated: you need the code from your reservation','Limited extra-vehicle parking'],
    src:['https://www.recreation.gov/camping/campgrounds/233537','https://outdoorithm.com/campgrounds/ca/lake-sonoma/liberty-glen']});

  // ---------- POINT REYES (NPS) ----------
  function PR(id, name, miles, from, extra){
    K(id, name, 'Point Reyes National Seashore', 'National Park Service','bay-area','Marin',null,null,null,{
      status:'open', types:['tent','hike-in'],
      sites:{hookups:'none', hookupNote:'Hike-in only. No car or RV camping in the park (NPS).'},
      amen:{vault:true, water:true, bearBox:true, firepit:null, pets:'no'},
      fam:{kidNote:'Hike-in tent camp, '+miles+' miles from '+from+'.'},
      fees:{nightlyMin:30, nightlyMax:90, note:'NPS: $30 per night per site for 1-6 people; $90 per night per site for 7-25 people. Half price on the 1-6 permit with an Interagency Senior or Access pass. Recreation.gov fees extra.'},
      book:RG({url:'https://www.recreation.gov/camping/campgrounds/233359', window:'Most sites open three months ahead; the rest open 14 days ahead. Weekends and holidays fill quickly.'}),
      contact:{phone:null, email:'pore_camping@nps.gov', url:'https://www.nps.gov/thingstodo/point-reyes-backcountry-camping.htm'},
      hi:extra,
      caut:['Pets are not allowed at the backcountry campgrounds','Max 4 nights per visit and 30 nights per year; campers under 18 must be with an adult','Coordinates, site count and season not verified for this camp'],
      src:['https://www.nps.gov/thingstodo/point-reyes-backcountry-camping.htm']});
  }
  PR('ca-coast-camp-point-reyes','Coast Camp',1.8,'the Laguna Trailhead (via Laguna and Fire Lane trails)',['Each site has a table and food locker; two vault toilets and a water faucet per camp']);
  PR('ca-glen-camp-point-reyes','Glen Camp',4.6,'the Bear Valley Trailhead',['Each site has a table and food locker; two vault toilets and a water faucet per camp']);
  PR('ca-sky-camp-point-reyes','Sky Camp',1.4,'the Sky Trailhead (moderately uphill)',['Shortest hike in of the four camps']);
  PR('ca-wildcat-camp-point-reyes','Wildcat Camp',6.3,'the Bear Valley Trailhead (5.5 miles from Palomarin Trailhead)',['Each site has a table and food locker; two vault toilets and a water faucet per camp']);

  // ---------- WHISKEYTOWN (NPS) ----------
  K('ca-oak-bottom-whiskeytown','Oak Bottom Campground (tent and RV)','Whiskeytown National Recreation Area','National Park Service','shasta-cascade','Shasta',null,null,null,{
    season:{open:'year-round', note:'NPS table lists year-round. Reservations through Whiskeytown Marinas LLC, not Recreation.gov.'},
    status:'open', types:['tent','rv'],
    sites:{total:116, rv:22, tent:94, hookups:null, hookupNote:'NPS table: 94 tent sites and 22 RV sites. Hookups and length limits not listed.'},
    amen:{showers:true, flush:true, water:true},
    fam:{swim:true, boating:true, kidNote:'Next to Whiskeytown Lake.'},
    fees:{nightlyMin:20, nightlyMax:35, note:'NPS table: $20 to $35 tent, $20 to $30 RV.'},
    book:{system:'other', phone:'530-242-3400', window:null},
    contact:{phone:'530-242-3400', url:'https://www.nps.gov/whis/planyourvisit/whiskeytown-camping.htm', address:'P.O. Box 188, Whiskeytown, CA 96095'},
    hi:['Flush toilets and showers (NPS)'],
    caut:['Coordinates, pet rules and booking link not verified: call the park'],
    src:['https://www.nps.gov/whis/planyourvisit/whiskeytown-camping.htm']});

  K('ca-brandy-creek-rv-whiskeytown','Brandy Creek RV Campground','Whiskeytown National Recreation Area','National Park Service','shasta-cascade','Shasta',null,null,null,{
    season:{open:'year-round'},
    status:'open', types:['rv'],
    sites:{total:15, rv:15, hookups:null, hookupNote:'Self-contained RVs only; no tents, no toilet (NPS table).'},
    amen:{showers:false, flush:false, water:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'NPS table: $20 per night.'},
    book:RG({phone:'877-444-6777'}),
    contact:{phone:'530-242-3400', url:'https://www.nps.gov/whis/planyourvisit/whiskeytown-camping.htm', address:'P.O. Box 188, Whiskeytown, CA 96095'},
    hi:['Water available; sleeps up to 10 per site'],
    caut:['No restroom: self-contained RVs only','Coordinates and vehicle length not verified'],
    src:['https://www.nps.gov/whis/planyourvisit/whiskeytown-camping.htm']});
})();
