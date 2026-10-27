/* Campica data pack: central corridor (NE, KS, WY along I-80 and Medicine Bow, CO Pawnee Grassland, plus IA, IL, MO gaps).
   Facts only from pages listed in SOURCES-camps-corridor-plains.md (read 2026-10). Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. Coordinates are given only where a page printed them (noted in cautions when park-level or third-party). */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service';
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
  var NGPC = 'Nebraska Game and Parks Commission';
  var NEPH = '844-637-2757';
  var NEFEE = 'Nightly rate not on the page read: see the park pricing page. A park entry permit is also required (Nebraska-registered vehicles $7/day per a third-party listing).';
  function NE(url, extra){ return mix({system:'Nebraska Game and Parks reservations', url:url, phone:NEPH}, extra); }
  var KSP = 'Kansas Department of Wildlife and Parks';
  var KSFEE = 'Campsite nightly rate not on the page read. A state park vehicle permit is required ($5 per day or $25 per year for Kansas residents per the page).';
  var WYS = 'Wyoming State Parks, Historic Sites & Trails';
  var WYBOOK = {system:'Wyoming State Parks reservations', url:'https://reserve.wyoming.gov', phone:'877-996-7275'};
  var WYFEE = 'Camping and day-use fees apply but the amounts are not on the page read: see the Wyoming State Parks Permits & Fees page.';
  var USFS = 'US Forest Service';
  var MOB = {system:'Missouri State Parks reservations', url:'https://mostateparks.com', phone:'877-422-6766'};
  var ILB = {system:'ExploreMoreIL reservations', url:'https://recreation.exploremoreil.com/IllinoisWeb/Default.aspx'};

  /* ---------------- NEBRASKA ---------------- */
  K('ne-ponca-state-park', 'Ponca State Park Campgrounds', 'Ponca State Park', NGPC, 'NE', 'great-plains', null, {
    lat:42.60972, lon:-96.71722, season:{note:'Open year-round; modern restrooms and showers April through October, weather permitting. Off-season rates apply October 27 to April 8 (per a third-party listing).'}, status:'open',
    types:['tent','rv','group'], sites:{total:92, maxRvFt:60, hookups:'electric', hookupNote:'92 electric sites: Turkey Ridge 35 Electric Plus (first come), Oak Bluff 37 Electric Plus (reservable), Riverfront 10 Electric and 10 Electric Plus (reservable), plus basic sites (count not listed). Three group sites. Max RV length 60 ft from a third-party listing.'},
    amen:{showers:true, flush:true, dump:true, water:true, firepit:true, pets:true, wifi:false, store:false},
    fam:{swim:true, playground:true, fishing:true, boating:true, easyTrails:true, kidNote:'Playground at the campgrounds, weekly youth fishing programs and a tackle loaner program, hayrack tours, outdoor education programs. Swimming pool mid-June to mid-August (third-party listing).'},
    fees:{note:NEFEE+' A third-party listing gives a very wide range ($25 to $340) that mixes site types and cabins, so no nightly figure is shown.'},
    book:NE('https://outdoornebraska.gov/location/ponca/',{window:'Oak Bluff electric sites up to 180 days ahead', firstComeNote:'Other sites are first come, first served; iron rangers take cash or check only.'}),
    contact:{phone:'402-755-2284', email:'ponca@ngpc.ne.gov', url:'https://outdoornebraska.gov/location/ponca/', address:'88090 Spur 26E, Ponca, NE 68770'},
    hi:['Missouri River bluffs','Playground and pool','Youth fishing program'], caut:['Coordinates and the pool/dump details come from the Campflare listing, not the Game and Parks page.','Address differs slightly between the two sources; use the park phone.'],
    src:['https://outdoornebraska.gov/location/ponca/','https://campflare.com/campground/ponca-sp-143']
  });
  K('ne-platte-river-state-park', 'Platte River State Park Campground', 'Platte River State Park', NGPC, 'NE', 'great-plains', null, {
    lat:40.987045, lon:-96.209103, status:null, types:['tent','rv'],
    sites:{total:48, hookups:'full', hookupNote:'48 sites: 19 Full Hookup sites (50 amp, at least 50 ft by 20 ft; 15 pull-through) reservable in advance, plus 4 first-come basic sites as stated on the page. The page does not account for the other sites. 5 ADA sites.'},
    amen:{showers:true, flush:true, firepit:true, ada:true},
    fam:{playground:true, kidNote:'Playground and a fenced dog park at the campground.'},
    book:NE('https://visitnebraska.com/louisville/campgrounds-and-rv-camping-platte-river-state-park',{window:'Reservations by phone Mon-Fri 9-6, Sat-Sun 9-5 Central'}),
    contact:{phone:'402-234-2217', url:'https://visitnebraska.com/louisville/campgrounds-and-rv-camping-platte-river-state-park', address:'14421 346th St., Louisville, NE 68037'},
    caut:['Fees and season not listed on the page read. Coordinates come from the page directions link.'],
    src:['https://visitnebraska.com/louisville/campgrounds-and-rv-camping-platte-river-state-park']
  });
  var FR = 'https://visitnebraska.com/crawford/campgrounds-and-rv-camping-fort-robinson-state-park';
  K('ne-fort-robinson-red-cloud', 'Red Cloud Campground', 'Fort Robinson State Park', NGPC, 'NE', 'great-plains', null, {
    lat:42.66715, lon:-103.466464, types:['rv','tent'],
    sites:{total:32, hookups:'full', hookupNote:'32 Full Hookup sites.'},
    book:NE(FR,{window:'Half the sites bookable up to one year ahead'}), contact:{phone:'308-665-2900', url:FR, address:'3200 West Highway 20, Crawford, NE 69339'},
    caut:['Coordinates are the park-level point from the page directions link. Season and fees not listed on the page read.'], src:[FR]
  });
  K('ne-fort-robinson-soldier-creek', 'Soldier Creek Campground', 'Fort Robinson State Park', NGPC, 'NE', 'great-plains', null, {
    lat:42.66715, lon:-103.466464, types:['rv','tent'],
    sites:{total:98, hookups:'electric', hookupNote:'98 sites: 14 Electric Plus, 56 Electric and 28 Basic. Shaded campground.'},
    book:NE(FR,{window:'Half the sites bookable up to one year ahead'}), contact:{phone:'308-665-2900', url:FR, address:'3200 West Highway 20, Crawford, NE 69339'},
    caut:['Coordinates are the park-level point from the page directions link. Season and fees not listed on the page read. An equestrian campground (Electric and Basic sites) also exists near the Mare Barn Complex.'], src:[FR]
  });
  K('ne-chadron-state-park', 'Chadron State Park Campground', 'Chadron State Park', NGPC, 'NE', 'great-plains', null, {
    season:{note:'Electric Plus and Basic sites open year-round. A campfire ban was in effect as of April 2026: check current fire rules.'}, status:'open',
    types:['tent','rv','cabin'], sites:{hookups:'electric', hookupNote:'Electric Plus and Basic sites; site count not stated. 22 rental cabins.'},
    amen:{showers:true, dump:true, laundry:true, firepit:true},
    fam:{swim:true, playground:true, kidNote:'Campground playground, lifeguarded pool (daily Memorial Day to mid-August, weekends after), seasonal paddleboats, archery and pellet gun ranges, sports courts.'},
    book:NE('https://outdoornebraska.gov/fi/location/chadron/',{window:'Half the sites up to 180 days ahead in peak season; cabins up to one year', firstComeNote:'Other sites first come, first served; pay at the iron ranger (cash or check envelope).'}),
    contact:{phone:null, url:'https://outdoornebraska.gov/fi/location/chadron/', address:'15951 Highway 385, Chadron, NE 69337'},
    caut:['Rates not on the page read.'], src:['https://outdoornebraska.gov/fi/location/chadron/']
  });
  K('ne-mahoney-state-park', 'Eugene T. Mahoney State Park Campgrounds', 'Eugene T. Mahoney State Park', NGPC, 'NE', 'great-plains', null, {
    lat:41.02611, lon:-96.31222, season:{note:'Open year-round (third-party listing).'}, status:'open',
    types:['tent','rv','cabin'], sites:{maxRvFt:72, maxTrailerFt:50, hookups:'full', hookupNote:'Lakeside (sites 100-148) and Little Creek (sites 1-99). Electric (20/30 amp), Electric Plus (30/50 amp with water) and full-hookup sites; no pull-throughs. Total count not verified.'},
    amen:{showers:true, dump:true, water:true, store:true, laundry:true, pets:true, firepit:true, cell:'AT&T, Verizon, T-Mobile listed'},
    fam:{swim:true, playground:true, boating:true, easyTrails:true, bikeFriendly:true, kidNote:'Aquatic center with water slides, playground and basketball courts at Little Creek, marina rentals, nature programs, trails. I-80 exit 426 at Ashland puts it right off the interstate.'},
    fees:{note:'Nightly rate not verified (a third-party listing shows an unusable $25 to $1,750 range covering cabins and lodging). Park entry permit $7/day for Nebraska-registered vehicles per that listing.'},
    book:NE('https://campflare.com/campground/eugene-t-mahoney-sp-273',{window:'About half the sites up to 180 days ahead', firstComeNote:'The rest are first come, first served.'}),
    contact:{phone:'844-637-2757', address:'28500 W Park Hwy, Ashland, NE 68003', url:'https://campflare.com/campground/eugene-t-mahoney-sp-273'},
    hi:['Right off I-80','Water park and lodge'], caut:['All facts for this record come from a third-party listing (Campflare); the Game and Parks page was not read. 844-637-2757 is the statewide reservation line.'],
    src:['https://campflare.com/campground/eugene-t-mahoney-sp-273']
  });
  var MC = 'https://outdoornebraska.gov/location/lake-mcconaughy';
  K('ne-lake-mcconaughy-lone-eagle', 'Lone Eagle Campground (Lake McConaughy)', 'Lake McConaughy State Recreation Area', NGPC, 'NE', 'great-plains', null, {
    types:['rv','tent'], sites:{total:84, hookups:'full', hookupNote:'84 Full Service sites with water and sewer.'}, amen:{showers:true, flush:true, dump:true, water:true},
    fam:{playground:true, swim:true, beach:true, boating:true, kidNote:'Playground at the campground; the lake has sand beaches.'},
    book:NE(MC,{phone:'308-284-8800', window:'Peak season May 20 to Sept 10: up to 180 days ahead', firstComeNote:'Sept 11 to May 19 camping is first come, first served; pay at the iron ranger (cash or check envelope).'}),
    contact:{phone:'308-284-8800', url:MC, address:'1475 Highway 61N, Ogallala, NE 69153'},
    caut:['Rates not on the page read. Phone line is open 8 a.m. to 4 p.m. Mountain daily. Lake level changes beach access.'], src:[MC]
  });
  K('ne-lake-mcconaughy-cedar-view', 'Cedar View Campground (Lake McConaughy)', 'Lake McConaughy State Recreation Area', NGPC, 'NE', 'great-plains', null, {
    types:['rv','tent'], sites:{total:102, hookups:'electric', hookupNote:'85 Electric Plus and 17 Basic sites; water at nearly every site.'}, amen:{showers:true, flush:true, water:true},
    fam:{beach:true, swim:true, boating:true, kidNote:'Next to the lake. The campground also has one designated beach camping area of about 40 sites.'},
    book:NE(MC,{phone:'308-284-8800', window:'Peak season May 20 to Sept 10: up to 180 days ahead (beach camping 30 days)', firstComeNote:'Sept 11 to May 19 camping is first come, first served.'}),
    contact:{phone:'308-284-8800', url:MC, address:'1475 Highway 61N, Ogallala, NE 69153'},
    caut:['Rates not on the page read.'], src:[MC]
  });
  var LO = 'https://outdoornebraska.gov/location/lake-ogallala/';
  K('ne-lake-ogallala-east', 'East Campground (Lake Ogallala)', 'Lake Ogallala State Recreation Area', NGPC, 'NE', 'great-plains', null, {
    types:['rv','tent'], sites:{total:82, hookups:'electric', hookupNote:'82 Electric Plus sites with hard-surfaced roads and pads. Electric hookups are only at this campground.'}, amen:{showers:true, flush:true, water:true},
    book:NE(LO,{phone:'308-284-8800', window:'Reservations required in peak season, up to 180 days ahead', firstComeNote:'Off-season camping is first come, first served.'}),
    contact:{phone:'308-284-8800', url:LO, address:'160 Central District Dr., Keystone, NE 69144'},
    caut:['Rates not on the page read.'], src:[LO]
  });
  K('ne-lake-ogallala-west', 'West Campground (Lake Ogallala)', 'Lake Ogallala State Recreation Area', NGPC, 'NE', 'great-plains', null, {
    types:['tent','rv'], sites:{total:100, hookups:'none', hookupNote:'100 Basic sites (grass and gravel, some tent-only), picnic tables and ground grills, primitive restrooms.'}, amen:{vault:true},
    book:NE(LO,{phone:'308-284-8800', window:'Reservations required in peak season, up to 180 days ahead', firstComeNote:'Off-season camping is first come, first served.'}),
    contact:{phone:'308-284-8800', url:LO, address:'160 Central District Dr., Keystone, NE 69144'},
    caut:['Rates not on the page read.'], src:[LO]
  });

  /* ---------------- KANSAS ---------------- */
  var MILF = 'https://ksoutdoors.com/state-parks/locations/milford';
  K('ks-milford-state-park', 'Milford State Park Campgrounds', 'Milford State Park', KSP, 'KS', 'great-plains', null, {
    season:{note:'Open year-round. April 1 to October 31 campsites are reservable; November 1 to March 31 first come, first served.'}, status:'open',
    types:['tent','rv','group','cabin'], sites:{total:254, hookups:'full', hookupNote:'Eight campgrounds: 60 sites with water, sewer and electric, 91 with two utilities, 103 primitive. Ten cabins.'},
    amen:{dump:true}, fam:{playground:true, swim:true, boating:true, fishing:true, bikeFriendly:true, easyTrails:true, kidNote:'Playground and splash park, over 12 miles of trails, marina, ADA fishing dock with kayak launch.'},
    fees:{note:KSFEE}, book:{system:'ReserveAmerica / Camp It KS app', url:'https://www.reserveamerica.com', phone:'785-238-3014', window:'Seasonal reservations open mid-December', cancelNote:'Cancelling 15 or more days ahead loses the reservation fee plus $5; 0 to 2 days ahead is not refunded.'},
    contact:{phone:'785-238-3014', email:'kdwpt.milfordsp@ks.gov', url:MILF}, hi:['Splash park and playground'],
    caut:['Park office is open Monday to Friday 8 am to 4 pm. The page gives directions (northwest of Junction City, K-57 near milepost 1) but no street address.'], src:[MILF]
  });
  var CL = 'https://ksoutdoors.gov/State-Parks/Locations/Clinton';
  K('ks-clinton-state-park', 'Clinton State Park Campgrounds', 'Clinton State Park', KSP, 'KS', 'great-plains', null, {
    types:['tent','rv','cabin'], sites:{total:368, hookups:'full', hookupNote:'102 water/electric (30 amp), 68 water/electric (50/30 amp), 34 full hookup and 164 primitive sites.'},
    amen:{water:true, ada:true}, fam:{swim:true, beach:true, playground:true, fishing:true, bikeFriendly:true, easyTrails:true, kidNote:'Swim beach, playgrounds, a 1-acre children\'s fishing pond and a trout pond, disc golf, 25-mile hike/bike trail.'},
    fees:{note:KSFEE}, book:{system:'ReserveAmerica / Camp It KS app', url:'https://www.reserveamerica.com', phone:'785-842-8562'},
    contact:{phone:'785-842-8562', address:'798 N 1415 Rd, Lawrence, KS 66049', url:CL},
    caut:['Non-frost-free water hydrants are shut off at about the first freeze. Season dates not stated on the page.'], src:[CL]
  });
  var TC = 'https://ksoutdoors.com/State-Parks/Locations/Tuttle-Creek';
  K('ks-tuttle-creek-river-pond', 'River Pond and Fancy Creek Campgrounds', 'Tuttle Creek State Park', KSP, 'KS', 'great-plains', null, {
    types:['tent','rv','cabin','horse'], sites:{hookups:'electric', hookupNote:'River Pond about 165 water/electric sites plus primitive; Fancy Creek 24 electric and primitive; South Randolph horse camp 20 electric; Cedar Ridge 100 primitive, not reservable. The page totals do not agree with each other, so no single count is shown.'},
    amen:{showers:true, dump:true, store:true, laundry:true, ada:true}, fam:{swim:true, beach:true, playground:true, fishing:true, boating:true, easyTrails:true, kidNote:'Swim beach, playgrounds, 18-hole disc golf, fishing dock, canoe and kayak rentals, nature trails.'},
    fees:{note:KSFEE}, book:{system:'ReserveAmerica / Camp It KS app', url:'https://www.reserveamerica.com', phone:'785-539-7941'},
    contact:{phone:'785-539-7941', address:'5800 A River Pond Rd, Manhattan, KS 66502', url:TC},
    caut:['The page text was dated 2015 for open facilities; camping season not stated. Office open Monday to Friday 8 am to 4:30 pm.'], src:[TC]
  });
  var CH = 'https://ksoutdoors.com/State-Parks/Locations/Cheney';
  K('ks-cheney-state-park', 'Cheney State Park Campgrounds', 'Cheney State Park', KSP, 'KS', 'great-plains', null, {
    types:['tent','rv','cabin'], sites:{hookups:'electric', hookupNote:'About 223 to 245 reservable water/electric sites and 150 to 400+ primitive sites: the page gives inconsistent counts, so no total is shown.'},
    amen:{showers:true, dump:true}, fees:{note:KSFEE+' Cabins on the page: from $65 to $150 a night depending on size and day.'},
    book:{system:'ReserveAmerica / Camp It KS app', url:'https://www.reserveamerica.com', phone:'316-542-3664'},
    contact:{phone:'316-542-3664', url:CH}, caut:['No street address on the page (west of Wichita on US-54/400 to K-251, north 4 miles). Camping season not stated.'], src:[CH]
  });
  var KN = 'https://ksoutdoors.com/State-Parks/Locations/Kanopolis';
  K('ks-kanopolis-langley-point', 'Langley Point Campground', 'Kanopolis State Park', KSP, 'KS', 'great-plains', null, {
    season:{open:'April 1', close:'October 31', note:'Reservation window per the page.'}, types:['tent','rv','cabin'],
    sites:{hookups:'full', hookupNote:'Langley Point lists 105 primitive, 16 water/sewer/electric, 50 water/electric and 21 electric-only sites. ADA camping available.'},
    amen:{water:true, dump:true, ada:true}, fees:{note:KSFEE}, book:{system:'ReserveAmerica / Camp It KS app', url:'https://www.reserveamerica.com', phone:'785-546-2565'},
    contact:{phone:'785-546-2565', address:'200 Horsethief Rd., Marquette, KS 67464', url:KN}, caut:['The page notes a Yucca area closure from 2024 that may be out of date.'], src:[KN]
  });

  /* ---------------- WYOMING ---------------- */
  var CG = 'https://wyoparks.wyo.gov/index.php/activities-amenities-curt-gowdy/camping-rvs-curt-gowdy';
  K('wy-curt-gowdy-state-park', 'Curt Gowdy State Park Campgrounds', 'Curt Gowdy State Park', WYS, 'WY', 'great-plains', null, {
    season:{note:'Camping year-round. Most sites reservable only May 15 to September 30; from October 1 to May 14 all sites first come, first served. Campground water shuts off October 1.'}, status:'open',
    types:['tent','rv','cabin'], sites:{total:178, hookups:'electric', hookupNote:'178 sites; electric costs an extra $10 per night where available. No dump station in the park (nearest about 24 miles away in Cheyenne or Laramie).'},
    amen:{showers:true, flush:true, dump:false, water:true},
    fam:{swim:true, beach:true, playground:true, fishing:true, kidNote:'Playgrounds, swim beach, ADA fishing pier, volleyball and horseshoe pits. Visitor center showers and flush toilets year-round. Children\'s activity house was closed for the season at read time.'},
    fees:{extraVehicle:null, note:WYFEE+' Electric add-on $10 per night.'}, book:mix(WYBOOK,{firstComeNote:'The page also carries a notice saying all sites are first come, first served: confirm before you go.'}),
    contact:{phone:'307-632-7946', address:'1264 Granite Springs Rd, Cheyenne, WY 82009', url:CG},
    hi:['Between Cheyenne and Laramie'], caut:['A harmful cyanobacteria advisory was posted for part of Granite Springs Reservoir at read time: keep children and pets out of green water.','Stage 1 fire restrictions at read time.'],
    src:[CG,'https://wyoparks.wyo.gov/index.php/activities-amenities-curt-gowdy/camping-tents-curt-gowdy']
  });
  var GL = 'https://wyoparks.wyo.gov/index.php/activities-amenities-glendo/campsites-for-rvs-glendo';
  K('wy-glendo-state-park', 'Glendo State Park Campgrounds', 'Glendo State Park', WYS, 'WY', 'great-plains', null, {
    season:{note:'Open year-round. Reservations required May 15 to September 15; otherwise first come, first served.'}, status:'open',
    types:['tent','rv'], sites:{total:550, hookups:'electric', hookupNote:'About 550 sites in 19 camping areas. 30 and 50 amp electric at a limited number of sites in Two Moon, Reno Cove, Bennett Hill and Sandy Beach.'},
    fam:{beach:true, swim:true, boating:true, fishing:true}, fees:{note:WYFEE+' Fee booths staffed Memorial Day to Labor Day; kiosks at entrances otherwise.'},
    book:mix(WYBOOK,{}), contact:{phone:'307-735-4433', url:GL},
    caut:['Cyanobacteria advisories (including Custer Cove and the marina) and Stage 1 fire restrictions at read time. Page gave no shower or dump station list.'], src:[GL]
  });
  var SM = 'https://wyoparks.wyo.gov/index.php/activities-amenities-seminoe/campsites-for-rvs-seminoe';
  K('wy-seminoe-north-red-hills', 'North Red Hills Campground', 'Seminoe State Park', WYS, 'WY', 'great-plains', null, {
    season:{note:'Park open 365 days; reservations required May 15 to September 15.'}, types:['tent','rv'],
    sites:{total:30, hookups:'electric', hookupNote:'30 sites, 13 with electric.'}, amen:{water:true}, fam:{boating:true, fishing:true},
    fees:{note:WYFEE}, book:mix(WYBOOK,{}), contact:{phone:'307-320-3013', url:SM},
    caut:['Drinking water summer only. 307-320-3013 is park headquarters. Cyanobacteria advisory and Stage 1 fire restrictions at read time.'], src:[SM]
  });
  K('wy-seminoe-sunshine-beach', 'Sunshine Beach Campground', 'Seminoe State Park', WYS, 'WY', 'great-plains', null, {
    season:{note:'Park open 365 days; reservations required May 15 to September 15.'}, types:['tent','rv'],
    sites:{total:38, hookups:null, hookupNote:'38 sites; hookups not stated for this campground.'}, fam:{beach:true, boating:true, fishing:true},
    fees:{note:WYFEE}, book:mix(WYBOOK,{}), contact:{phone:'307-320-3013', url:SM},
    caut:['Cyanobacteria advisory and Stage 1 fire restrictions at read time.'], src:[SM]
  });
  var BL = 'https://www.recreation.gov/camping/campgrounds/231844';
  K('wy-brooklyn-lake-campground', 'Brooklyn Lake Campground', 'Medicine Bow National Forest', USFS, 'WY', 'great-plains', null, {
    elev:10500, season:{note:'Mix of reservable and first-come sites in 2026; handpump water typically July to September.'}, types:['tent','rv'],
    sites:{total:19, hookups:'none', hookupNote:'19 standard nonelectric sites; 5 pull-through sites take longer or trailered rigs. No hookups.'}, amen:{water:true, pets:true, firepit:true},
    fam:{fishing:true, boating:true, kidNote:'Non-motorized boats only; no boat ramp.'},
    book:{system:'recreation.gov', url:BL, phone:'877-444-6777'}, contact:{phone:'307-745-2300', url:BL},
    caut:['10,500 ft: the page advises acclimating a night lower. Max stay 14 days, 8 people and 2 vehicles per site. 307-745-2300 is the forest supervisor office. Fee not on the page.'],
    src:[BL+'?tab=info']
  });
  var VD = 'https://fs.usda.gov/r02/mbrtb/recreation/vedauwoo-campground';
  K('wy-vedauwoo-campground', 'Vedauwoo Campground', 'Medicine Bow National Forest', USFS, 'WY', 'great-plains', null, {
    lat:41.15743, lon:-105.37647, season:{open:'May 20', close:'November 1', note:'Seasonal, weather dependent.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:28, maxTrailerFt:32, hookups:'none', hookupNote:'28 sites in two loops plus a separate loop of 20 tent-only sites near the Box Canyon and Turtle Rock trailheads (not counted in the 28).'},
    amen:{vault:true, water:true, firepit:true}, fam:{easyTrails:true, kidNote:'Rock climbing area, a nature trail and day hikes.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night per site (Forest Service page).'}, book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/10155998', phone:'877-444-6777'},
    contact:{phone:'307-745-2300', url:VD}, caut:['307-745-2300 is the forest supervisor office, not a campground line.'], src:[VD]
  });
  var WI = 'https://www.recreation.gov/camping/campgrounds/10250594';
  K('wy-willow-campground-libby-creek', 'Willow Campground (Libby Creek)', 'Medicine Bow National Forest', USFS, 'WY', 'great-plains', null, {
    elev:8600, season:{note:'Mix of reservable and first-come sites in 2026; handpump water typically July to September.'}, types:['tent','rv'],
    sites:{total:16, hookups:'none', hookupNote:'16 sites; trailers under 22 ft. No hookups.'}, amen:{vault:true, water:true, firepit:true},
    fam:{fishing:true, easyTrails:true, kidNote:'Fishing on Libby Creek and nearby Barber Lake; trails from Corner Mountain trailhead.'},
    book:{system:'recreation.gov', url:WI, phone:'877-444-6777', firstComeNote:'Some sites first come; cash or check may be accepted on site.'}, contact:{phone:'307-745-2300', url:WI},
    caut:['Max stay 14 days, 8 people and 2 vehicles per site. Fee not on the page. The page lists the phone as N/A in one place, so confirm.'], src:[WI]
  });
  var FH = 'https://fs.usda.gov/r04/ashley/recreation/firehole-campground';
  K('wy-firehole-campground-flaming-gorge', 'Firehole Campground (Flaming Gorge)', 'Flaming Gorge National Recreation Area', USFS, 'WY', 'great-plains', null, {
    lat:41.350538, lon:-109.445076, season:{open:'May', close:'September'}, status:'seasonal', types:['tent','rv'],
    sites:{hookups:null, hookupNote:'Paved spurs; each pad serves two sites. Site count and hookups not stated. RV dump station available for a small fee.'},
    amen:{flush:true, showers:true, water:true, dump:true, pets:true}, fam:{swim:true, beach:true, boating:true, fishing:true, kidNote:'Adjacent swim beach and boat ramp (day-use pass required).'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/231904', phone:'877-444-6777'}, contact:{phone:'435-789-1181', url:FH},
    caut:['435-789-1181 is the Ashley National Forest supervisor office. Fee: see recreation.gov.'], src:[FH]
  });

  /* ---------------- COLORADO (east) ---------------- */
  var CV = 'https://www.fs.usda.gov/r02/arp/recreation/crow-valley-campground';
  K('co-crow-valley-campground-pawnee-grassland', 'Crow Valley Campground', 'Pawnee National Grassland', USFS, 'CO', 'colorado', null, {
    lat:40.644204, lon:-104.341939, elev:4800, types:['tent','rv','group'],
    sites:{total:10, maxTrailerFt:35, hookups:null, hookupNote:'Ten sites (single sites up to 8 people, double up to 16); a separate group site holds 1 to 30 people. Hookups not listed. Lark group site limit 30 ft.'},
    amen:{vault:true, firepit:true, pets:true}, fam:{easyTrails:true, kidNote:null},
    fees:{nightlyMin:17, nightlyMax:25, note:'Single site $17, double site $25, group site $77 per night; half price with Senior or Access pass (Forest Service page).'},
    book:{system:'recreation.gov', url:'https://recreation.gov/camping/campgrounds/233845', phone:'877-444-6777', firstComeNote:'Sites 1-4 and 9 reservable; 5-8 and 10 first come. Unreserved sites become first come four days before arrival.'},
    contact:{phone:'970-295-6600', url:CV}, caut:['970-295-6600 is the supervisor office. Flooding can close sites, especially spring and early summer. Season not stated.'], src:[CV]
  });

  /* ---------------- IOWA ---------------- */
  var IAB = {system:'Iowa DNR state park reservations', url:'https://www.iowadnr.gov/places-to-go/state-parks'};
  var LM = 'https://iowadnr.gov/places-to-go/state-parks/iowa-state-parks/lake-macbride-state-park';
  K('ia-lake-macbride-state-park', 'Lake Macbride State Park Campgrounds', 'Lake Macbride State Park', 'Iowa DNR', 'IA', 'midwest', null, {
    lat:41.803674, lon:-91.570988, season:{open:'April 1', close:'November 15', note:'Closed November 16 to March 31.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{hookups:'full', hookupNote:'Modern campground in the north unit (full and electric hookups, showers, dump station); non-modern shaded campground in the south unit. Site counts not stated.'},
    amen:{showers:true, dump:true}, fam:{swim:true, beach:true, playground:true, kidNote:'Swim beach with concession stand; ADA-accessible playground. Check beach advisories before swimming.'},
    book:mix(IAB,{phone:'319-624-2200', firstComeNote:'All campsites reservable online; reservation required.'}), contact:{phone:'319-624-2200', address:'3525 Highway 382 NE, Solon, IA 52333', url:LM},
    caut:['Fees not on the page read.'], src:[LM]
  });
  var MQ = 'https://www.iowadnr.gov/MaquoketaCaves';
  K('ia-maquoketa-caves-state-park', 'Maquoketa Caves State Park Campground', 'Maquoketa Caves State Park', 'Iowa DNR', 'IA', 'midwest', null, {
    season:{open:'March', close:'November', note:'Reservations accepted March through November; closed December to February.'}, status:'seasonal', types:['tent','rv','group','hike-in'],
    sites:{hookups:'electric', hookupNote:'Standard electric, walk-to, primitive hike-in and youth-group sites. Counts and amperage not stated.'},
    amen:{showers:true, ada:true}, fam:{playground:true, easyTrails:true, kidNote:'Playground between the campground and picnic area; cave trails (caves closed November 15 to April 1 for bats).'},
    book:mix(IAB,{phone:'563-652-5833', firstComeNote:'100 percent of sites reservable; reservation required.'}), contact:{phone:'563-652-5833', address:'9688 Caves Rd., Maquoketa, IA 52060', url:MQ},
    caut:['Fees not on the page read.'], src:[MQ]
  });
  var PP = 'https://www.iowadnr.gov/PikesPeak';
  K('ia-pikes-peak-state-park', 'Pikes Peak State Park Campground', 'Pikes Peak State Park', 'Iowa DNR', 'IA', 'midwest', null, {
    lat:42.993973, lon:-91.165628, season:{open:'March', close:'November', note:'Reservations March 1 through November; closed December to February. Concessions Memorial Day weekend to third Sunday of October.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{hookups:'full', hookupNote:'Full-hookup, electric, non-electric and youth-group sites; table and fire ring at each. Counts not stated.'},
    amen:{showers:true, flush:true, dump:true, store:true, firepit:true, ada:true}, fam:{easyTrails:true, kidNote:'Half-mile boardwalk to Bridal Veil Falls; fossils along trails; Effigy Mounds National Monument about 7 miles north.'},
    book:mix(IAB,{phone:'563-873-2341', firstComeNote:'100 percent of sites reservable; reservation required.'}), contact:{phone:'563-873-2341', address:'32264 Pikes Peak Rd, McGregor, IA 52157', url:PP},
    caut:['Fees not on the page read. The page does not mention a playground.'], src:[PP]
  });

  /* ---------------- ILLINOIS ---------------- */
  var KK = 'https://dnr.illinois.gov/parks/park.kankakeeriver.html';
  K('il-kankakee-river-state-park', 'Kankakee River State Park Campgrounds', 'Kankakee River State Park', 'Illinois DNR', 'IL', 'midwest', null, {
    lat:41.203, lon:-87.979, types:['tent','rv','group','horse'], sites:{hookups:null, hookupNote:'More than 200 campsites across popular campgrounds, plus group and equestrian camps. Hookups not stated on the page.'},
    book:mix(ILB,{phone:'815-933-1383'}), contact:{phone:'815-933-1383', address:'5314 W. Rt. 102, Bourbonnais, IL 60914', url:KK},
    caut:['Fees, showers and season not on the page read (the DNR camping subpage was not read). Coordinates are the park point on the page.'], src:[KK]
  });
  var PM = 'https://dnr.illinois.gov/parks/park.peremarquette.html';
  K('il-pere-marquette-state-park', 'Pere Marquette State Park Campground', 'Pere Marquette State Park', 'Illinois DNR', 'IL', 'midwest', null, {
    lat:38.973, lon:-90.543, status:'open', statusNote:'Page said the campground was open at read time.', types:['tent','rv','group','cabin'],
    sites:{hookups:null, hookupNote:'Campsites, cabins, a Youth Tent Camp and three group camps. Site counts and hookups not on the page.'},
    amen:{pets:true}, book:mix(ILB,{phone:'618-786-3323'}), contact:{phone:'618-786-3323', address:'13112 Visitor Center Lane, Grafton, IL 62037', url:PM},
    caut:['Pets must be leashed. Fees and season not on the page read. Weather can close roads: call ahead.'], src:[PM]
  });
  var GC = 'https://dnr.illinois.gov/parks/camp/park.giantcity.html';
  K('il-giant-city-state-park', 'Giant City State Park Campground', 'Giant City State Park', 'Illinois DNR', 'IL', 'midwest', null, {
    season:{note:'Class A shower building closes the day after the first shotgun deer season and reopens April 1 (weather dependent).'}, types:['tent','rv','walk-in','horse'],
    sites:{hookups:'electric', hookupNote:'Class A campground: 85 sites with water, electricity, showers and sanitary facilities. Class C: 14 primitive walk-in sites with privies and shower access. Separate equestrian Class A camp.'},
    amen:{showers:true, water:true, vault:true, firepit:true}, book:mix(ILB,{firstComeNote:'Campers without a reservation use the silent-host self-registration system.'}),
    contact:{url:GC}, caut:['Phone on the page was the statewide DNR line, so no park phone is given. Fees not on the page.'], src:[GC]
  });

  /* ---------------- MISSOURI ---------------- */
  var JS = 'https://mostateparks.com/park/johnsons-shut-ins/camping';
  K('mo-johnsons-shut-ins-state-park', 'Johnson\'s Shut-Ins State Park Campground', 'Johnson\'s Shut-Ins State Park', 'Missouri State Parks', 'MO', 'midwest', null, {
    season:{note:'Campgrounds open year-round. Water April 1 to October 31 for loops 1, 2, 4, 5; loop 3 has water year-round.'}, status:'open', types:['tent','rv','walk-in','horse'],
    sites:{hookups:'full', hookupNote:'Five loops: 1 equestrian (electric/water), 2 sewer/electric/water, 3 electric, 4 basic, 5 walk-in tent sites (14). 50-amp sites available. Total count not stated.'},
    amen:{showers:true, water:true}, book:mix(MOB,{url:JS}), contact:{url:JS, phone:'877-422-6766'},
    caut:['877-422-6766 is the statewide reservation line. Fees are in PDF schedules that were not read for current amounts.'], src:[JS]
  });
  var BS = 'https://mostateparks.com/park/bennett-spring/camping';
  K('mo-bennett-spring-state-park', 'Bennett Spring State Park Campgrounds', 'Bennett Spring State Park', 'Missouri State Parks', 'MO', 'midwest', null, {
    season:{note:'Campground 1 reservable year-round (water Apr 15 to Oct 15); campgrounds 2 and 3 Apr 15 to Oct 31; 4 and 5 Feb 25 to Oct 31.'}, types:['tent','rv'],
    sites:{hookups:'full', hookupNote:'Five campgrounds; 1 has sewer/electric/water (some 50-amp), 2 to 5 electric or basic; 2 and 5 offer family sites. Site counts not stated. Notable uphill travel to campgrounds 2 to 5.'},
    amen:{showers:true}, book:mix(MOB,{url:BS}), contact:{url:BS, phone:'877-422-6766'},
    caut:['877-422-6766 is the statewide reservation line. Fees are in PDF schedules that were not read for current amounts.'], src:[BS]
  });
})();
