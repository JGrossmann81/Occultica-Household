/* Campica data pack: Southeast US (VA, WV, NC, SC, GA, FL, MS, KY, TN). Facts only from pages listed in SOURCES-camps-southeast.md.
   null = not verified (UI shows 'check with the source'). Third-party listings are flagged in notes. */
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
  function R(url, extra){ return mix({system:RG, url:url || 'https://www.recreation.gov/', phone:RGPHONE}, extra); }

  var RGU = function(id){ return 'https://www.recreation.gov/camping/campgrounds/' + id; };
  var NPSW = 'https://www.nps.gov/';
  var SM_FEE = 'https://www.nps.gov/grsm/planyourvisit/fee-rates.htm';
  var BRP_NOTE = 'Blue Ridge Parkway campgrounds: the 2024 NPS fee release and a National Parks Traveler page both give $30 per standard site; the Parkway has no electric hookups. Dates vary each year (usually about May to late October): check Recreation.gov.';
  function brp(id, name, st, mp, o){
    o = o || {};
    K(id, name, 'Blue Ridge Parkway', NPS, st, 'southeast', null, {
      elev:o.elev, season:{open:null, close:null, note:'Usually open about May to late October; exact dates change yearly.'}, status:'seasonal',
      types:o.types || ['tent','rv'], sites:{total:o.total, hookups:'none', hookupNote:'No electric hookups at Parkway campgrounds (per National Parks Traveler).'},
      amen:{showers:o.showers === true ? true : null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
      fees:{nightlyMin:30, nightlyMax:30, note:'$30 per standard site (NPS 2024 fee release; group sites $45 at Rocky Knob, Linville Falls and Doughton Park). Confirm current rate on Recreation.gov.'},
      book:{system:RG, url:'https://www.recreation.gov/camping/gateways/2593', phone:RGPHONE, window:'Up to 6 months ahead', firstComeNote:'Some sites are first-come, first-served.'},
      contact:{phone:null, url:'https://www.nps.gov/blri/planyourvisit/camping.htm'},
      hi:['Parkway milepost ' + mp].concat(o.hi || []), caut:['Parkway weather can bring fog, cold nights and early or late snow: check conditions.'].concat(o.caut || []),
      src:['https://www.nationalparkstraveler.org/parks/blue-ridge-parkway/camping-blue-ridge-parkway','https://www.nps.gov/blri/learn/news/blue-ridge-parkway-announces-changes-to-camping-fee-structure.htm']
    });
  }

  /* ---------------- GREAT SMOKY MOUNTAINS (extras) ---------------- */
  K('nc-cataloochee-campground-great-smoky', 'Cataloochee Campground', 'Great Smoky Mountains National Park', NPS, 'NC', 'southeast', 'Haywood', {
    elev:2600, season:{open:null, close:null, note:'Typically mid-April to the end of October; dates change yearly.'}, status:'seasonal', statusNote:'A reservation is required and must be made before driving in (no cell service, no on-site payment).',
    types:['tent','rv','group'], sites:{total:27, hookups:'none', hookupNote:'No electric or water hookups. Motorhomes over 29 ft and trailers over 25 ft are not recommended because of the access road.'},
    amen:{flush:true, showers:false, water:true, firepit:true, store:false, cell:false, pets:'limited', vault:null, dump:null, wifi:null, bearBox:null, laundry:null, ada:null},
    fam:{juniorRanger:true, kidNote:'Known for elk in Cataloochee Valley. Reached by long gravel and winding roads from I-40 exit 20.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (NPS fee page, updated Aug 2026). Group camp $50. No on-site payment.'},
    book:R(RGU(233284), {window:'Reserve before driving in'}), contact:{phone:'828-497-9270', url:'https://www.recreation.gov/camping/campgrounds/233284'},
    hi:['Elk in the valley','Creekside sites (3, 5, 7 closest to water)','Historic buildings nearby'], caut:['No cell service in the valley: book before you go.','No firewood for sale on site (nearest about 14 miles).'],
    src:[SM_FEE,'https://www.recreation.gov/camping/campgrounds/233284?tab=fees','https://npplan.com/parks-by-state/north-carolina-national-parks/great-smoky-mountains-national-park-park-at-a-glance/great-smoky-mountains-national-park-cataloochee-region/great-smoky-mountains-national-park-cataloochee-campground/']
  });
  K('nc-deep-creek-campground-great-smoky', 'Deep Creek Campground', 'Great Smoky Mountains National Park', NPS, 'NC', 'southeast', null, {
    season:{open:null, close:null, note:'Roughly May to October per a third-party summary; check NPS.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:92, hookups:'none', hookupNote:'Site count (92) from a third-party summary (nationalparked.com); confirm on NPS/Recreation.gov.'},
    amen:{flush:true, water:true, firepit:true, dump:true, pets:'limited', showers:null, vault:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Near Bryson City; known for waterfalls and creek tubing nearby (confirm current rules).'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (NPS fee page, Aug 2026). Group camp $50.'},
    book:R(null, {firstComeNote:'Reservation status changes by year: a third-party page said first-come; check NPS.'}), contact:{phone:null, url:'https://www.nps.gov/grsm/planyourvisit/campgrounds.htm'},
    hi:['Near Bryson City','Dump station'], caut:['Black bears: store food properly and follow park food-storage rules.'], src:[SM_FEE,'https://www.nationalparked.com/?p=1313']
  });
  K('tn-look-rock-campground-great-smoky', 'Look Rock Campground', 'Great Smoky Mountains National Park', NPS, 'TN', 'southeast', null, {
    season:{open:null, close:null, note:'Roughly May to October per a third-party summary; check NPS.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:68, hookups:'some', hookupNote:'Electric sites exist (priced higher by NPS). Site count (68) from a third-party summary (nationalparked.com).'},
    amen:{flush:true, water:true, firepit:true, pets:'limited', showers:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Off the Foothills Parkway, near its midpoint.'},
    fees:{nightlyMin:30, nightlyMax:36, note:'$30 standard, $36 electric per night (NPS fee page, Aug 2026).'},
    book:R(null), contact:{phone:null, url:'https://www.nps.gov/grsm/planyourvisit/campgrounds.htm'},
    hi:['Foothills Parkway location','Electric sites available'], caut:['Check the NPS page for current open dates.'], src:[SM_FEE,'https://www.nationalparked.com/?p=1313']
  });
  K('tn-abrams-creek-campground-great-smoky', 'Abrams Creek Campground', 'Great Smoky Mountains National Park', NPS, 'TN', 'southeast', null, {
    season:{open:null, close:null, note:'Roughly May to October per a third-party summary.'}, status:'seasonal', types:['tent','rv'], sites:{total:16, hookups:'none', hookupNote:'Site count (16) from a third-party summary.'},
    amen:{flush:true, water:true, firepit:true, pets:'limited', showers:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Small, quiet campground 6 miles down Happy Valley Road off US-129.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (NPS fee page, Aug 2026).'}, book:R(null), contact:{phone:null, url:'https://www.nps.gov/grsm/planyourvisit/campgrounds.htm'},
    hi:['Small campground'], caut:['Check current open dates and road conditions.'], src:[SM_FEE,'https://www.nationalparked.com/?p=1313']
  });
  K('nc-big-creek-campground-great-smoky', 'Big Creek Campground', 'Great Smoky Mountains National Park', NPS, 'NC', 'southeast', null, {
    season:{open:null, close:null, note:'Roughly April to October per a third-party summary.'}, status:'seasonal', types:['tent','group'], sites:{total:12, hookups:'none', hookupNote:'Site count (12) from a third-party summary.'},
    amen:{flush:true, water:true, firepit:true, pets:'limited', showers:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (NPS fee page, Aug 2026).'}, book:R(null), contact:{phone:null, url:'https://www.nps.gov/grsm/planyourvisit/campgrounds.htm'},
    hi:['Small, creekside area'], caut:['Check current open dates.'], src:[SM_FEE,'https://www.nationalparked.com/?p=1313']
  });

  /* ---------------- BLUE RIDGE PARKWAY ---------------- */
  brp('va-otter-creek-campground-blue-ridge-parkway', 'Otter Creek Campground', 'VA', '60.8', {total:68, hi:['Lowest-elevation Parkway campground (elevation sources disagree, not shown)']});
  brp('va-peaks-of-otter-campground-blue-ridge-parkway', 'Peaks of Otter Campground', 'VA', '85.9', {total:139, elev:2880, hi:['Sharp Top and Flat Top trails nearby']});
  brp('va-rocky-knob-campground-blue-ridge-parkway', 'Rocky Knob Campground', 'VA', '167.1', {total:106, types:['tent','rv','group'], hi:['Group sites (20 people) are $45']});
  brp('nc-doughton-park-campground-blue-ridge-parkway', 'Doughton Park Campground (Basin Cove area)', 'NC', '239.2', {total:108, types:['tent','rv','group'], hi:['Group sites (20 people) are $45']});
  brp('nc-julian-price-campground-blue-ridge-parkway', 'Julian Price Park Campground', 'NC', '297', {total:190, hi:['Price Lake nearby','Non-camper showers $6 per NPS release']});
  brp('nc-linville-falls-campground-blue-ridge-parkway', 'Linville Falls Campground', 'NC', '316.4', {total:64, types:['tent','rv','group'], hi:['Close to Linville Falls trails']});
  brp('nc-crabtree-falls-campground-blue-ridge-parkway', 'Crabtree Falls Campground', 'NC', '339.5', {total:81, hi:['Crabtree Falls trail nearby']});
  brp('nc-mount-pisgah-campground-blue-ridge-parkway', 'Mount Pisgah Campground', 'NC', '408.8', {total:125, elev:5000, showers:true, hi:['Only Parkway campground listed with showers','High elevation: cooler summer nights'], caut:['At about 5,000 ft nights can be cold even in summer.']});

  /* ---------------- SHENANDOAH ---------------- */
  var SHEN = 'https://www.nationalparkstraveler.org/parks/shenandoah-national-park/camping-shenandoah-national-park';
  K('va-mathews-arm-campground-shenandoah', 'Mathews Arm Campground', 'Shenandoah National Park', NPS, 'VA', 'southeast', null, {
    lat:38.763144, lon:-78.296388, season:{open:'Apr 29', close:'Nov 1', note:'Dates given for the 2026 season; they change yearly.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:165, maxRvFt:50, hookups:'none', hookupNote:'Nonelectric sites. Includes 47 first-come sites, 3 group sites and 4 ADA sites (AAA listing).'},
    amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:false, wifi:null, bearBox:null, laundry:null, ada:true, cell:null},
    fam:{kidNote:'Elkwallow Wayside, about 2 miles away, has food and supplies.'},
    fees:{nightlyMin:30, nightlyMax:75, note:'$30 per standard site; group site (7 to 25 people) $75 per night.'},
    book:R(null, {firstComeNote:'Mix of reservable and first-come sites.'}), contact:{phone:null, url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm'},
    hi:['Elkwallow Wayside nearby'], caut:['Check current dates and any mid-season closures.'], src:[SHEN,'https://ww2.aaa.com/tripcanvas/campground/mathews-arm-campground-NPSC4944EF0_E744_47F8_ACEB_F6283723AFCA']
  });
  K('va-lewis-mountain-campground-shenandoah', 'Lewis Mountain Campground', 'Shenandoah National Park', NPS, 'VA', 'southeast', null, {
    season:{open:'Mar 27', close:'Nov 22', note:'Dates given for the 2026 season; they change yearly.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:30, hookups:'none'}, amen:{showers:true, store:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, wifi:null, bearBox:null, laundry:null, ada:false, cell:null},
    fam:{kidNote:'Small campground with a seasonal camp store and showers.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night. First-come, first-served; pay with the Scan and Pay app.'},
    book:{system:'first-come', url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm', phone:null, firstComeNote:'First-come, first-served; pay via the Scan and Pay app.'}, contact:{phone:null, url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm'},
    hi:['Seasonal showers and camp store','Small and quieter than Big Meadows'], caut:['No reservations: arrive early on summer and fall weekends.'], src:[SHEN]
  });
  K('va-loft-mountain-campground-shenandoah', 'Loft Mountain Campground', 'Shenandoah National Park', NPS, 'VA', 'southeast', null, {
    lat:38.246415, lon:-78.670701, season:{open:'Apr 29', close:'Nov 1', note:'Dates given for the 2026 season; they change yearly.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:207, tent:50, maxRvFt:50, hookups:'none', hookupNote:'Nonelectric sites. One site fits up to 55 ft; others up to 50 ft.'},
    amen:{showers:true, store:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, wifi:null, bearBox:null, laundry:null, ada:true, cell:null},
    fam:{kidNote:'Largest Shenandoah campground; mountain is about 10 F cooler than the valley.'},
    fees:{nightlyMin:30, nightlyMax:75, note:'$30 per standard site; group site $75 per night.'},
    book:R(null, {firstComeNote:'Mix of reservable and first-come sites.'}), contact:{phone:null, url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm'},
    hi:['Seasonal showers and camp store','Large; 50 tent-only sites'], caut:['Check current dates and closures.'], src:[SHEN,'https://www.aaa.com/tripcanvas/campground/loft-mountain-campground-NPSBFBDA380_305A_4821_BB62_C72A939C78FC']
  });

  /* ---------------- VIRGINIA STATE PARKS ---------------- */
  var VAFEE = 'https://dcr.virginia.gov/state-parks/camping-fees';
  var VAB = {system:'Virginia State Parks reservations', url:'https://www.dcr.virginia.gov/state-parks/', phone:'800-933-7275', window:null};
  K('va-grayson-highlands-state-park', 'Grayson Highlands State Park (Hickory Ridge)', 'Grayson Highlands State Park', 'Virginia State Parks', 'VA', 'southeast', null, {
    lat:36.628322, lon:-81.496889, season:{open:null, close:null, note:'Full-service camping May to October; primitive camping Nov, Mar, Apr; none from the first Monday in December to the first Friday in March.'}, status:'seasonal', types:['tent','rv','group','cabin','yurt'],
    sites:{total:null, maxRvFt:40, hookups:'some', hookupNote:'38 electric/water sites (20/30/50 amp), 28 no-hookup sites (up to 30 ft), 4 yurts, 1 bunkhouse, 1 group site. Separate equestrian campground with 24 horse sites.'},
    amen:{showers:true, water:true, pets:null, firepit:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:true, cell:null},
    fam:{easyTrails:true, kidNote:'Wild ponies roam the highlands; park entrance elevation is 3,698 ft. Wildlife (ponies) must not be fed or touched.'},
    fees:{nightlyMin:16, nightlyMax:43, note:'Per night, resident/non-resident: electric+water $37/$43, standard $27/$32, primitive $16/$19, group $75/$88 (effective 2025-05-12). Plus $5 transaction fee and tax.'},
    book:mix(VAB, {}), contact:{phone:'276-579-7092', url:'https://www.dcr.virginia.gov/state-parks/grayson-highlands', address:'829 Grayson Highland Ln., Mouth of Wilson, VA 24363'},
    hi:['Wild ponies','High-elevation hiking','Near the Appalachian Trail'], caut:['Cool, windy weather even in summer at high elevation.'], src:['https://www.dcr.virginia.gov/state-parks/grayson-highlands',VAFEE]
  });
  K('va-hungry-mother-state-park', 'Hungry Mother State Park Campground', 'Hungry Mother State Park', 'Virginia State Parks', 'VA', 'southeast', null, {
    season:{note:'Season not read: check the park page.'}, status:null, types:['tent','rv','yurt'], sites:{total:81, hookups:'some', hookupNote:'81 campsites in total (50 in Camp Burson); electric/water and electric/water/sewer sites exist.'},
    amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{swim:true, beach:true, boating:true, fishing:true, kidNote:'108-acre lake with a sandy beach, boat rentals and an accessible fishing pier.'},
    fees:{nightlyMin:27, nightlyMax:48, note:'Per night resident/non-resident: standard $27/$32, electric+water $37/$43, full hookup $41/$48 (effective 2025-05-12). Plus $5 transaction fee.'},
    book:mix(VAB, {}), contact:{phone:null, url:'https://www.dcr.virginia.gov/state-parks/hungry-mother'},
    hi:['Lake swimming beach','Boat rentals','Yurts'], caut:['Confirm swim-area and season details with the park.'], src:['https://www.dcr.virginia.gov/state-parks/blog/top-3-favorite-camping-destinations-in-western-virginia',VAFEE]
  });
  K('va-douthat-state-park', 'Douthat State Park Campground', 'Douthat State Park', 'Virginia State Parks', 'VA', 'southeast', null, {
    status:null, types:['tent','rv'], sites:{total:87, hookups:'some', hookupNote:'Electric and water sites; lakefront campground with electric and water.'},
    amen:{store:true, showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{swim:true, beach:true, boating:true, fishing:true, playground:true, kidNote:'50-acre trout-stocked lake, swimming beach with snack bar, boat rentals, camp store, playgrounds and amphitheater.'},
    fees:{nightlyMin:37, nightlyMax:48, note:'Per night resident/non-resident: electric+water $37/$43, lakefront (electric+water) $43/$48 (effective 2025-05-12). Plus $5 transaction fee.'},
    book:mix(VAB, {}), contact:{phone:null, url:'https://www.dcr.virginia.gov/state-parks/douthat'},
    hi:['Trout lake','43+ miles of trails','Camp store'], caut:['Season dates not read: check the park page.'], src:['https://www.dcr.virginia.gov/state-parks/blog/top-3-favorite-camping-destinations-in-western-virginia',VAFEE]
  });
  K('va-smith-mountain-lake-state-park', 'Smith Mountain Lake State Park Campground', 'Smith Mountain Lake State Park', 'Virginia State Parks', 'VA', 'southeast', null, {
    status:null, types:['tent','rv'], sites:{hookups:'some', hookupNote:'Electric/water and standard sites; site count not read.'},
    amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{boating:true, kidNote:'Lakeside park: confirm beach and boat-launch details with the park.'},
    fees:{nightlyMin:27, nightlyMax:43, note:'Per night resident/non-resident: standard $27/$32, electric+water $37/$43 (effective 2025-05-12). Plus $5 transaction fee.'},
    book:mix(VAB, {}), contact:{phone:null, url:'https://www.dcr.virginia.gov/state-parks/smith-mountain-lake'},
    hi:['Large reservoir lake'], caut:['Only fees were verified for this park.'], src:[VAFEE]
  });

  /* ---------------- NORTH CAROLINA STATE PARKS ---------------- */
  var NCB = {system:'ReserveAmerica (NC State Parks)', url:'https://www.ncparks.gov/hours-fees-and-permits', phone:'877-722-6762'};
  var NCNOTE = 'NC State Parks list a statewide schedule by site type (primitive $20, no hookups $30, electric $35, electric+water $40, full hookups $45, plus $3 reservation fee), not by park: confirm the park\'s own rate on ReserveAmerica.';
  K('nc-hanging-rock-state-park', 'Hanging Rock State Park Family Campground', 'Hanging Rock State Park', 'NC State Parks', 'NC', 'southeast', 'Stokes', {
    status:'closed-check', statusNote:'The park page said the family campground was closed about 10 to 12 months for new shower houses and site improvements. The closure date was not stated: check the park before planning.',
    types:['tent','rv'], sites:{total:73, hookups:'none', hookupNote:'73 sites in two loops; hookups not stated on the page.'}, amen:{showers:true, firepit:true, water:true, pets:'limited', flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Waterfalls and the Hanging Rock summit trail are within the park.'},
    fees:{note:NCNOTE}, book:mix(NCB, {}), contact:{phone:'336-593-8480', url:'https://www.ncparks.gov/state-parks/hanging-rock-state-park/camping', address:'1790 Hanging Rock Park Road, Danbury, NC 27016'},
    hi:['Waterfalls and summit hikes'], caut:['Campground closure: verify status.'], src:['https://www.ncparks.gov/state-parks/hanging-rock-state-park/camping','https://www.ncparks.gov/hours-fees-and-permits']
  });
  K('nc-pilot-mountain-state-park', 'Pilot Mountain State Park Campground', 'Pilot Mountain State Park', 'NC State Parks', 'NC', 'southeast', null, {
    status:null, types:['tent','rv'], sites:{}, amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Pilot Knob is the park\'s famous landmark.'}, fees:{note:NCNOTE}, book:mix(NCB, {}),
    contact:{phone:'336-444-5100', url:'https://www.ncparks.gov/state-parks/pilot-mountain-state-park/general-information', address:'1721 Pilot Knob Park Road, Pinnacle, NC 27043'},
    hi:['Pilot Knob landmark'], caut:['Site counts, hookups and season not read; the park page said some autumn weekends were full.'], src:['https://www.ncparks.gov/state-parks/pilot-mountain-state-park/general-information']
  });
  K('nc-jordan-lake-state-recreation-area', 'Jordan Lake State Recreation Area (Parkers Creek)', 'Jordan Lake State Recreation Area', 'NC State Parks', 'NC', 'southeast', null, {
    status:null, types:['tent','rv','group'], sites:{hookups:'some', hookupNote:'Some sites have water and electric; walk-up-only loops exist.'}, amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{swim:true, beach:true, kidNote:'Swim beach and picnic shelters at Parkers Creek.'}, fees:{note:NCNOTE + ' Day-use entrance fee is $10 per vehicle on certain dates.'}, book:mix(NCB, {}),
    contact:{phone:'919-362-0586', email:'jordan.lake@ncparks.gov', url:'https://www.ncparks.gov/park-features/jordan-lake-state-recreation-area-parkers-creek-access', address:'Parkers Creek Beach Road, Chapel Hill, NC 27517'},
    hi:['Swim beach','Close to the Triangle'], caut:['Jordan Lake has several campground areas; only Parkers Creek was read.'], src:['https://www.ncparks.gov/park-features/jordan-lake-state-recreation-area-parkers-creek-access','https://www.ncparks.gov/hours-fees-and-permits']
  });

  /* ---------------- CAPE HATTERAS NATIONAL SEASHORE ---------------- */
  var CAHAB = {system:RG, url:'https://www.recreation.gov/', phone:RGPHONE, firstComeNote:'Online reservations are site-specific. Same-day walk-ups are allowed but must be paid online or by phone; rangers cannot take payment.'};
  var CAHAS = ['https://www.nps.gov/caha/planyourvisit/campgrounds.htm','https://www.nps.gov/caha/planyourvisit/fees.htm'];
  var CAHAC = {phone:'252-473-2111', url:'https://www.nps.gov/caha/planyourvisit/campgrounds.htm'};
  var CAHAK = ['Limit of two vehicles and six people per site.'];
  K('nc-oregon-inlet-campground-cape-hatteras', 'Oregon Inlet Campground', 'Cape Hatteras National Seashore', NPS, 'NC', 'southeast', 'Dare', {
    season:{open:'Year-round'}, status:'open', types:['tent','rv','group'], sites:{total:107, hookups:'some', hookupNote:'47 sites have electricity and water.'}, amen:{showers:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, kidNote:'Heated showers; on the Outer Banks near Oregon Inlet.'}, fees:{nightlyMin:28, nightlyMax:35, note:'$28 without utilities, $35 with utility hookups; group (max 30 people) $70. Half price with Senior or Access Pass (not group).'},
    book:mix(CAHAB, {}), contact:mix(CAHAC, {}), hi:['Open year-round','Heated showers'], caut:CAHAK.concat(['Wind, sand and mosquitoes: bring stakes for sand and bug protection.']), src:CAHAS
  });
  K('nc-cape-point-campground-cape-hatteras', 'Cape Point Campground', 'Cape Hatteras National Seashore', NPS, 'NC', 'southeast', 'Dare', {
    season:{note:'Spring to fall: check Recreation.gov for dates.'}, status:'closed-check', statusNote:'An NPS news release titled "Cape Point Campground Remains Closed" appeared in search results (date not read): confirm it is open.',
    types:['tent','rv'], sites:{total:202, hookups:'none'}, amen:{showers:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night (half with Senior/Access Pass).'}, book:mix(CAHAB, {}), contact:mix(CAHAC, {}), hi:['Beach campground near Cape Point'], caut:CAHAK.concat(['Unheated showers; verify campground status.']), src:CAHAS.concat(['https://www.nps.gov/caha/learn/news/cape-point-campground-remains-closed.htm'])
  });
  K('nc-frisco-campground-cape-hatteras', 'Frisco Campground', 'Cape Hatteras National Seashore', NPS, 'NC', 'southeast', 'Dare', {
    season:{note:'Spring to fall: check Recreation.gov for dates.'}, status:'seasonal', types:['tent','rv'], sites:{total:127, hookups:'none'}, amen:{showers:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true}, fees:{nightlyMin:28, nightlyMax:28, note:'$28 per night (half with Senior/Access Pass).'}, book:mix(CAHAB, {}), contact:mix(CAHAC, {}), hi:['Beach access'], caut:CAHAK.concat(['Unheated showers.']), src:CAHAS
  });
  K('nc-ocracoke-campground-cape-hatteras', 'Ocracoke Campground', 'Cape Hatteras National Seashore', NPS, 'NC', 'southeast', 'Hyde', {
    season:{open:'Year-round', note:'Reached by ferry from the north; confirm ferry schedules.'}, status:'open', types:['tent','rv'], sites:{total:136, hookups:'none'}, amen:{showers:true, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, nearTown:'Ocracoke village'}, fees:{nightlyMin:28, nightlyMax:28, note:'$28 per night (half with Senior/Access Pass).'}, book:mix(CAHAB, {}), contact:mix(CAHAC, {}), hi:['Island setting','Open year-round'], caut:CAHAK.concat(['Unheated showers; ferry needed to reach the island.']), src:CAHAS
  });

  /* ---------------- GEORGIA ---------------- */
  K('ga-vogel-state-park', 'Vogel State Park Campground', 'Vogel State Park', 'Georgia State Parks', 'GA', 'southeast', 'Union', {
    lat:34.765883, lon:-83.925416, elev:2500, status:null, types:['tent','rv','walk-in'], sites:{total:null, hookups:'electric', hookupNote:'90 tent/trailer/RV sites listed as electric; 18 walk-in tent-only sites; plus a Pioneer campground (call for limits).'},
    amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{swim:true, beach:true, kidNote:'Sand beach and a CCC museum (both seasonal).'}, fees:{note:'Nightly rate not shown on the park page: check Georgia State Parks.'},
    book:{system:'Georgia State Parks reservations', url:'https://gastateparks.org/Vogel', phone:'800-864-7275'}, contact:{phone:'706-745-2628', url:'https://gastateparks.org/Vogel', address:'405 Vogel State Park Road, Blairsville, GA 30512'},
    hi:['Mountain lake and beach','Near the Appalachian Trail'], caut:['Season not stated on the page.'], src:['https://gastateparks.org/Vogel']
  });
  K('ga-sea-camp-cumberland-island', 'Sea Camp Campground (Cumberland Island)', 'Cumberland Island National Seashore', NPS, 'GA', 'southeast', 'Camden', {
    status:'open', types:['tent','group','walk-in'], sites:{hookups:'none', hookupNote:'About a half mile from Sea Camp Dock; carts help carry gear. Group campground max 20 people.'},
    amen:{water:true, firepit:true, pets:'no', flush:null, vault:null, showers:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, kidNote:'Island beaches and wild horses; no lifeguards.'},
    fees:{note:'Rate not read on a current page (a 2016 proposal listed $25 per site, a historical document). Confirm on Recreation.gov. Senior/Access Pass: 50% off individual sites.'},
    book:{system:RG, url:'https://www.recreation.gov/camping/campgrounds/253730', phone:RGPHONE, window:'6 months ahead to the day', cancelNote:'Refund minus 25% if cancelled 10+ days out; minus 50% if less than 10 days.'}, contact:{phone:'912-882-4336', url:'https://www.nps.gov/cuis/planyourvisit/camping.htm'},
    hi:['Boat access only','Wild horses'], caut:['Ferry to the island required; 7-night limit; no pets; no trash cans, pack out all trash.','Sea Camp campers must return on the 10:15 a.m. ferry.','Raccoons are common: secure food.'], src:['https://www.nps.gov/cuis/planyourvisit/camping.htm','https://www.nps.gov/cuis/learn/news/entrance-fee-increase-and-camping-fee-restructuring.htm']
  });

  /* ---------------- SOUTH CAROLINA ---------------- */
  var SCNOTE = 'State park rates were not read from an official page; a third-party listing gave: ';
  K('sc-hunting-island-state-park', 'Hunting Island State Park Campground', 'Hunting Island State Park', 'South Carolina State Parks', 'SC', 'southeast', 'Beaufort', {
    lat:32.3872, lon:-80.4339, season:{open:'Year-round'}, status:'open', types:['tent','rv'], sites:{total:127, hookups:'some', hookupNote:'102 standard sites with water/electric, plus a 25-site tent area; no sewer. Minimum 2 nights, maximum 14 (third-party listing).'},
    amen:{showers:true, dump:true, laundry:true, store:true, wifi:true, firepit:true, pets:'yes', flush:null, vault:null, water:true, bearBox:null, ada:null, cell:null},
    fam:{beach:true, swim:true, kidNote:'Beach and lighthouse on site.'}, fees:{note:SCNOTE + '$45 to $65 per night. Confirm on the official page.'},
    book:{system:'SC State Parks', url:'https://southcarolinaparks.com/hunting-island', phone:'866-345-7275'}, contact:{phone:'843-838-2011', url:'https://southcarolinaparks.com/hunting-island'},
    hi:['Beach campground','Camp store and WiFi (listing)'], caut:['Sites, hookups and amenities come from a third-party listing (campflare.com).'], src:['https://campflare.com/campground/south-carolina-hunting-island']
  });
  K('sc-huntington-beach-state-park', 'Huntington Beach State Park Campground', 'Huntington Beach State Park', 'South Carolina State Parks', 'SC', 'southeast', 'Georgetown', {
    lat:33.5124, lon:-79.0718, season:{open:'Year-round'}, status:'open', types:['tent','rv'], sites:{hookups:'full', hookupNote:'Mostly water/electric; sewer in the south section; dump station (third-party listing). Six tent sites.'},
    amen:{dump:true, showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, swim:true, kidNote:'Beach and Atalaya Castle nearby.'}, fees:{note:SCNOTE + '$0 to $95 per night depending on season/site (not trusted as exact). Confirm on the official page.'},
    book:{system:'SC State Parks', url:'https://southcarolinaparks.com/huntington-beach', phone:'866-345-7275'}, contact:{phone:'843-237-4440', url:'https://southcarolinaparks.com/huntington-beach'},
    hi:['Beachfront state park','Birding'], caut:['Details are from a third-party listing (thedyrt.com).'], src:['https://www.thedyrt.com/camping/south-carolina/huntington-beach']
  });
  K('sc-table-rock-state-park', 'Table Rock State Park Campground', 'Table Rock State Park', 'South Carolina State Parks', 'SC', 'southeast', 'Pickens', {
    lat:35.0246, lon:-82.7041, season:{open:'Year-round'}, status:'open', types:['tent','rv'], sites:{total:94, hookups:'some', hookupNote:'69 near the entrance and 25 near White Oaks picnic area, plus six walk-in tent sites at Pine Point; water/electric at standard sites, no sewer (third-party listing).'},
    amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{swim:true, kidNote:'Lake and the Table Rock summit trail.'}, fees:{note:SCNOTE + '$16 to $234 per night (wide range, not trusted as exact). Confirm on the official page.'},
    book:{system:'SC State Parks', url:'https://southcarolinaparks.com/table-rock', phone:null}, contact:{phone:'864-878-9813', url:'https://southcarolinaparks.com/table-rock'},
    hi:['Table Rock summit trail','Lake'], caut:['Details are from a third-party listing (campflare.com).'], src:['https://campflare.com/campground/south-carolina-table-rock']
  });

  /* ---------------- FLORIDA ---------------- */
  var FLB = {system:'Florida State Parks reservations', url:'https://www.floridastateparks.org/', phone:'800-326-3521'};
  K('fl-bahia-honda-state-park', 'Bahia Honda State Park Campground', 'Bahia Honda State Park', 'Florida State Parks', 'FL', 'southeast', 'Monroe', {
    status:null, types:['tent','rv'], sites:{hookups:'some'}, amen:{showers:null, pets:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, swim:true, kidNote:'Lower Keys beach park (location: southwest of Marathon).'}, fees:{nightlyMin:36, nightlyMax:43, note:'$36 base per night plus tax; RV, cabin and boat units add a $7 utility fee. $6.70 non-refundable reservation fee. Florida residents 65+ get 50% off the base fee.'},
    book:mix(FLB, {}), contact:{phone:'850-245-2157', url:'https://www.floridastateparks.org/parks-and-trails/bahia-honda-state-park'}, hi:['Keys beaches and snorkeling'], caut:['Phone shown is the statewide information line. Site counts and amenities not read.'], src:['https://www.floridastateparks.org/parks-and-trails/bahia-honda-state-park/hours-fees']
  });
  K('fl-john-pennekamp-coral-reef-state-park', 'John Pennekamp Coral Reef State Park Campground', 'John Pennekamp Coral Reef State Park', 'Florida State Parks', 'FL', 'southeast', 'Monroe', {
    status:null, types:['tent','rv','group'], sites:{total:42, maxRvFt:40, hookups:'full', hookupNote:'42 reservable sites, each with 30/50-amp electric, water and sewer; most fit an RV up to 40 ft. Primitive group camp for 6 to 24 people.'},
    amen:{showers:true, laundry:true, firepit:null, pets:null, water:true, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, ada:null, cell:null},
    fam:{swim:true, boating:true, kidNote:'Snorkeling and glass-bottom-boat reef trips (confirm with the park).'}, fees:{nightlyMin:36, nightlyMax:43, note:'$36 per night plus tax; $7 utility fee for RV units; $6.70 non-refundable reservation fee.'},
    book:mix(FLB, {}), contact:{phone:'305-676-3777', url:'https://www.floridastateparks.org/parks-and-trails/john-pennekamp-coral-reef-state-park', address:'102601 Overseas Highway, Key Largo, FL 33037'},
    hi:['Full-hookup sites','Reef access'], caut:['Max 8 people per site.'], src:['https://www.floridastateparks.org/parks-and-trails/john-pennekamp-coral-reef-state-park/hours-fees','https://www.floridastateparks.org/parks-and-trails/john-pennekamp-coral-reef-state-park/experiences-amenities','https://www.floridastateparks.org/parks-and-trails/john-pennekamp-coral-reef-state-park']
  });
  K('fl-silver-springs-state-park', 'Silver Springs State Park Campground', 'Silver Springs State Park', 'Florida State Parks', 'FL', 'southeast', 'Marion', {
    lat:29.1971, lon:-82.0354, season:{open:'Year-round'}, status:'open', types:['tent','rv'], sites:{total:59, maxRvFt:50, hookups:'some', hookupNote:'Two loops (Fort King and Sharpes Ferry); every site has 50-amp electric and water, 12 also have sewer; dump station. Third-party listing (campflare.com).'},
    amen:{dump:true, showers:null, pets:null, firepit:null, water:true, flush:null, vault:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Glass-bottom boats and the spring run nearby.'}, fees:{note:'Official rate not read; a third-party listing showed $24 to $110.'},
    book:mix(FLB, {}), contact:{phone:'352-261-5840', url:'https://www.floridastateparks.org/parks-and-trails/silver-springs-state-park'}, hi:['Springs park'], caut:['Details are from a third-party listing.'], src:['https://campflare.com/campground/fsp-63-171']
  });
  K('fl-flamingo-campground-everglades', 'Flamingo Campground', 'Everglades National Park', NPS, 'FL', 'southeast', 'Monroe', {
    season:{note:'Busiest November to April; reservations accepted through April 16, afterwards not needed for remaining sites.'}, status:'seasonal', types:['tent','rv'], sites:{total:276, hookups:'some', hookupNote:'235 drive-up sites plus 41 electric sites in T-Loop.'},
    amen:{pets:null, showers:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'At the southern tip of the park on Florida Bay.'}, fees:{nightlyMin:16, nightlyMax:30, note:'$16 per night; T-Loop electric sites $30 per night (half with Senior/Access Pass).'},
    book:R(null, {window:'Opens November 20 for the winter season'}), contact:{phone:'305-242-7700', url:'https://www.nps.gov/ever/planyourvisit/permits-and-reservations.htm'},
    hi:['Florida Bay setting','Wildlife viewing'], caut:['Stay limits: 14 consecutive days Nov 1 to Apr 30, 30 days per year.','Mosquitoes can be severe in summer: check conditions.'], src:['https://www.nps.gov/ever/planyourvisit/permits-and-reservations.htm','https://www.nps.gov/ever/camping-fees.htm']
  });
  K('fl-long-pine-key-campground-everglades', 'Long Pine Key Campground', 'Everglades National Park', NPS, 'FL', 'southeast', 'Miami-Dade', {
    season:{note:'Busiest November to April.'}, status:'seasonal', types:['tent','rv','group'], sites:{total:108, hookups:'none'}, amen:{pets:null, showers:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Pine rockland setting near the park entrance.'}, fees:{nightlyMin:16, nightlyMax:16, note:'$16 per night (half with Senior/Access Pass).'},
    book:{system:'first-come', url:'https://www.nps.gov/ever/planyourvisit/permits-and-reservations.htm', phone:RGPHONE, firstComeNote:'Individual sites are first-come, first-served. Only group sites (15+ people) are reservable on Recreation.gov.'}, contact:{phone:'305-242-7700', url:'https://www.nps.gov/ever/planyourvisit/permits-and-reservations.htm'},
    hi:['First-come drive-up camping'], caut:['Stay limits: 14 consecutive days Nov 1 to Apr 30, 30 days per year.'], src:['https://www.nps.gov/ever/planyourvisit/permits-and-reservations.htm']
  });
  K('fl-garden-key-dry-tortugas', 'Garden Key Campground (Fort Jefferson)', 'Dry Tortugas National Park', NPS, 'FL', 'southeast', 'Monroe', {
    status:'open', types:['tent','boat-in','group'], sites:{hookups:'none', hookupNote:'Regular sites hold up to three 2-person tents (6 people); one large group site for 10 to 20 people.'},
    amen:{wifi:null, store:false, firepit:null, pets:null, showers:null, water:null, flush:null, vault:null, dump:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{boating:true, fishing:true, kidNote:'Reached by ferry, private boat or tour operator only.'}, fees:{nightlyMin:15, nightlyMax:30, note:'$15 per night per regular site; $30 per night for the large group site. Pay with the Scan & Pay app. Senior/Access Pass 50% off.'},
    book:{system:'first-come', url:'https://www.nps.gov/drto/planyourvisit/camping.htm', phone:null, firstComeNote:'Regular sites cannot be reserved; once you arrive a spot is guaranteed. Group site is by emailed application. Ferry camper space is limited to 10 per day and often sells out months ahead.'}, contact:{phone:'305-242-7700', url:'https://www.nps.gov/drto/planyourvisit/camping.htm'},
    hi:['Camp beside Fort Jefferson','Snorkeling'], caut:['Bring all food, water and gear; there are no supplies for sale.','Tents required (wildlife); charcoal only, no wood fires.','Pack out all trash.','Ferry operator phone: 800-634-0939.'], src:['https://www.nps.gov/drto/planyourvisit/camping.htm']
  });
  K('fl-fort-pickens-campground-gulf-islands', 'Fort Pickens Campground', 'Gulf Islands National Seashore', NPS, 'FL', 'southeast', 'Escambia', {
    season:{note:'Peak March 1 through Labor Day.'}, status:'open', types:['tent','rv'], sites:{hookups:'some', hookupNote:'Electric and non-electric sites; all have water, fire rings and picnic tables. Site count not read.'},
    amen:{water:true, flush:true, firepit:true, pets:null, showers:null, vault:null, dump:true, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{beach:true, kidNote:'On Santa Rosa Island near the historic fort.'}, fees:{nightlyMin:26, nightlyMax:40, note:'Electric $40, non-electric $26 per night plus the park entrance fee. Dump station $5 for non-campers.'},
    book:R(null, {firstComeNote:'You cannot reserve by calling the park.'}), contact:{phone:'850-934-2622', url:'https://www.nps.gov/guis/planyourvisit/eatingsleeping.htm'},
    hi:['Gulf beach and fort'], caut:['Stay limits: 14 consecutive days, 42 days per year.','Hurricane season: watch forecasts.'], src:['https://www.nps.gov/guis/planyourvisit/eatingsleeping.htm','https://www.nps.gov/guis/planyourvisit/facilityfees.htm']
  });
  K('ms-davis-bayou-campground-gulf-islands', 'Davis Bayou Campground', 'Gulf Islands National Seashore', NPS, 'MS', 'southeast', 'Jackson', {
    status:'open', types:['tent','rv'], sites:{hookups:'some', hookupNote:'Electric sites; all sites have water, fire rings and picnic tables. Site count not read.'},
    amen:{water:true, flush:true, firepit:true, dump:true, pets:null, showers:null, vault:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{kidNote:'Bayou setting at Ocean Springs.'}, fees:{nightlyMin:22, nightlyMax:22, note:'Electric $22 per night; no entrance fee. Dump station $5 for non-campers.'},
    book:R(null), contact:{phone:'228-230-4136', url:'https://www.nps.gov/guis/planyourvisit/eatingsleeping.htm'},
    hi:['No entrance fee'], caut:['Campground office open Tuesday to Saturday 8 a.m. to 4 p.m.','Stay limits: 14 consecutive days, 42 days per year.'], src:['https://www.nps.gov/guis/planyourvisit/eatingsleeping.htm','https://www.nps.gov/guis/planyourvisit/facilityfees.htm']
  });

  /* ---------------- NATCHEZ TRACE PARKWAY ---------------- */
  function nt(id, name, st, mp){
    K(id, name, 'Natchez Trace Parkway', NPS, st, 'southeast', null, {
      status:'open', types:['tent','rv'], sites:{hookups:'none', hookupNote:'No electricity, showers or dump stations. Site count and RV length not read.'}, amen:{showers:false, pets:null, firepit:null, water:null, flush:null, vault:null, dump:false, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
      fam:{}, fees:{nightlyMin:0, nightlyMax:0, note:'Free (NPS page).'}, book:{system:'first-come', url:'https://www.nps.gov/natr/planyourvisit/camping.htm', phone:null, firstComeNote:'First-come, first-served; no reservations.'}, contact:{phone:'662-680-4027', url:'https://www.nps.gov/natr/planyourvisit/camping.htm'},
      hi:['Free camping at Parkway milepost ' + mp], caut:['Maximum stay 14 days per campground per calendar year.','Dispersed camping is not allowed.','Phone is the Parkway general line.'], src:['https://www.nps.gov/natr/planyourvisit/camping.htm']
    });
  }
  nt('tn-meriwether-lewis-campground-natchez-trace', 'Meriwether Lewis Campground', 'TN', '385.9');
  nt('ms-rocky-springs-campground-natchez-trace', 'Rocky Springs Campground', 'MS', '54.8');
  nt('ms-jeff-busby-campground-natchez-trace', 'Jeff Busby Campground', 'MS', '193.1');

  /* ---------------- KENTUCKY ---------------- */
  K('ky-houchin-ferry-campground-mammoth-cave', 'Houchin Ferry Campground', 'Mammoth Cave National Park', NPS, 'KY', 'southeast', 'Edmonson', {
    season:{open:'Year-round'}, status:'open', types:['tent'], sites:{total:12, hookups:'none', hookupNote:'Tent only; no RVs or trailers.'}, amen:{pets:null, showers:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night ($10 with Senior/Access Pass).'}, book:R('https://www.recreation.gov/camping/campgrounds/258992'), contact:{phone:null, url:'https://www.nps.gov/maca/planyourvisit/camping.htm'},
    hi:['Tent-only sites','Open year-round'], caut:['Park contact phone not read: use the NPS page.'], src:['https://www.nps.gov/maca/planyourvisit/camping.htm']
  });
  K('ky-maple-springs-group-mammoth-cave', 'Maple Springs Group Campground', 'Mammoth Cave National Park', NPS, 'KY', 'southeast', 'Edmonson', {
    season:{open:'Mar 1', close:'Nov 30'}, status:'seasonal', types:['group','rv','equestrian'], sites:{total:7, maxRvFt:40, hookups:'electric', hookupNote:'Electric hookups, no sewer. Group, horseback group and RV sites.'}, amen:{pets:null, showers:null, firepit:null, water:null, flush:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{}, fees:{nightlyMin:50, nightlyMax:50, note:'$50 per night; no discount for group sites.'}, book:R(null), contact:{phone:null, url:'https://www.nps.gov/maca/planyourvisit/camping.htm'},
    hi:['Group and horse camping'], caut:['This is not the main Mammoth Cave campground; that one was not read.'], src:['https://www.nps.gov/maca/planyourvisit/camping.htm']
  });
  K('va-wilderness-road-campground-cumberland-gap', 'Wilderness Road Campground', 'Cumberland Gap National Historical Park', NPS, 'VA', 'southeast', 'Lee', {
    status:'open', types:['tent','rv','group'], sites:{total:120, hookups:'some', hookupNote:'41 electric sites; heated restrooms with free showers.'}, amen:{showers:true, flush:true, pets:null, firepit:null, water:null, vault:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
    fam:{}, fees:{nightlyMin:18, nightlyMax:39, note:'Non-electric $18, electric $24, group $39 per night. Senior/Access Pass half price (not group).'}, book:R(null, {window:'6 months ahead', firstComeNote:'All sites must be reserved and paid on Recreation.gov, even same-day.'}), contact:{phone:null, url:'https://www.nps.gov/cuga/planyourvisit/fees.htm'},
    hi:['Free showers'], caut:['The campground is in Virginia (near the Cumberland Gap tri-state area).'], src:['https://www.nps.gov/cuga/planyourvisit/fees.htm']
  });

  /* ---------------- WEST VIRGINIA ---------------- */
  var NERIS = ['https://www.nationalparkstraveler.org/node/28562'];
  function neri(id, name, total, rvft, note, tent){
    K(id, name, 'New River Gorge National Park and Preserve', NPS, 'WV', 'southeast', null, {
      status:'open', season:{open:'Year-round'}, types:tent ? ['tent'] : ['tent','rv'], sites:{total:total, maxRvFt:rvft, hookups:'none', hookupNote:note},
      amen:{water:false, vault:true, pets:null, showers:null, firepit:null, flush:null, dump:null, store:null, wifi:null, bearBox:null, laundry:null, ada:null, cell:null},
      fam:{}, fees:{nightlyMin:0, nightlyMax:0, note:'Free (National Parks Traveler listing of NPS campgrounds). Only a 2013 NPS proposal of $5 per night was read; confirm on nps.gov.'},
      book:{system:'first-come', url:'https://www.nps.gov/neri/planyourvisit/camping.htm', phone:null, firstComeNote:'First-come, first-served.'}, contact:{phone:null, url:'https://www.nps.gov/neri/planyourvisit/camping.htm'},
      hi:['Free riverside camping'], caut:['No water at the site: bring or treat your own.','Primitive; composting toilets.'], src:NERIS
    });
  }
  neri('wv-army-camp-new-river-gorge', 'Army Camp Campground', 11, 31, 'No water. Max 31 ft, no pull-throughs.', false);
  neri('wv-grandview-sandbar-new-river-gorge', 'Grandview Sandbar Campground', 16, 31, 'No water. Max 31 ft, no pull-throughs. Includes 6 tent-only sites.', false);
  neri('wv-glade-creek-new-river-gorge', 'Glade Creek Campground', 11, 31, 'No water. Max 31 ft, no pull-throughs. Includes 6 tent-only sites.', false);
  neri('wv-meadow-creek-new-river-gorge', 'Meadow Creek Campground', 17, null, 'No water. No RVs or vehicle-trailer combinations. Train noise possible.', true);
})();
