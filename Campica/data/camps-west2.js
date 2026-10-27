/* Campica data pack: Yellowstone, Mount Rainier, Olympic, Pacific Northwest and Oregon coast state parks,
   Valley of Fire, Badlands, Shenandoah. Facts only from pages listed in SOURCES-camps-west2.md.
   null = NOT verified: the UI must say "check with the source" and show the official link.
   Season dates quoted from NPS pages are the 2026 season; confirm the current year before travelling. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', RG = 'recreation.gov', RGPHONE = '877-444-6777';
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

  /* ---------------- YELLOWSTONE ---------------- */
  var YP = '307-344-7381', YURL = 'https://www.nps.gov/yell/planyourvisit/campgrounds.htm';
  var YSRC = [YURL];
  var YBEAR = 'Yellowstone is grizzly and black bear country: all food, coolers and scented items must be stored in a hard-sided vehicle or the provided lockers, never in a tent.';
  var YLODGE = function(extra){ return mix({system:'Yellowstone National Park Lodges', url:YURL, phone:null, window:null, firstComeNote:null, cancelNote:null}, extra); };
  var YRG = function(extra){ return mix({system:RG, url:YURL, phone:RGPHONE}, extra); };
  K('wy-madison-campground-yellowstone', 'Madison Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'May 1', close:'Oct 17', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:276, maxRvFt:60, hookups:'none', hookupNote:'The NPS table shows no hookup symbol; check with the park for current status.'},
    amen:{flush:true, dump:true, ada:true, cell:null, showers:null},
    fees:{nightlyMin:38, nightlyMax:38, note:'$38 per night plus taxes, per the NPS table (2026 season). Yellowstone National Park Lodges operates the booking.'},
    book:YLODGE({firstComeNote:'Sold through Yellowstone National Park Lodges; the NPS page lists no phone, call the park for help.'}),
    contact:{phone:YP, url:YURL},
    hi:['Flush toilets, accessible sites and a dump station','Sites for bicycle travellers','Large campground at a central location on the park loop'],
    caut:[YBEAR,'The NPS table marks generators as permitted; follow posted hours.'], src:YSRC });
  K('wy-grant-village-campground-yellowstone', 'Grant Village Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'Jun 26', close:'Sep 26', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:429, maxRvFt:50, hookups:'none', hookupNote:'No hookups indicated on the NPS table.'},
    amen:{flush:true, showers:true, dump:true, ada:true},
    fees:{nightlyMin:45, nightlyMax:45, note:'$45 per night plus taxes, per the NPS table (2026 season).'},
    book:YLODGE(), contact:{phone:YP, url:YURL},
    hi:['Showers on site','On the West Thumb shore of Yellowstone Lake area','Dump station'], caut:[YBEAR], src:YSRC });
  K('wy-bridge-bay-campground-yellowstone', 'Bridge Bay Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'May 15', close:'Sep 13', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:431, maxRvFt:60, hookups:'none', hookupNote:'No hookups indicated on the NPS table.'},
    amen:{flush:true, dump:true, ada:true}, fam:{boating:true},
    fees:{nightlyMin:38, nightlyMax:38, note:'$38 per night plus taxes, per the NPS table (2026 season).'},
    book:YLODGE(), contact:{phone:YP, url:YURL},
    hi:['Largest campground in the table by site count','Bicycle sites','Near Yellowstone Lake'], caut:[YBEAR], src:YSRC });
  K('wy-fishing-bridge-rv-park-yellowstone', 'Fishing Bridge RV Park', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'May 8', close:'Oct 17', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['rv'],
    sites:{total:310, maxRvFt:95, hookups:null, hookupNote:'The NPS table marks hookups for this RV park; the exact hookup set was not stated, check with the park.'},
    amen:{flush:true, showers:true, dump:true, ada:true},
    fees:{nightlyMin:94, nightlyMax:94, note:'$94 per night plus taxes, per the NPS table (2026 season). Listed as an RV park: confirm tent rules with the park.'},
    book:YLODGE(), contact:{phone:YP, url:YURL},
    hi:['Only Yellowstone campground with hookups listed','Accepts RVs up to 95 ft per the table'], caut:[YBEAR], src:YSRC });
  K('wy-canyon-campground-yellowstone', 'Canyon Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'May 29', close:'Sep 19', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:272, maxRvFt:40, hookups:'none', hookupNote:'No hookups indicated on the NPS table.'},
    amen:{flush:true, showers:true, dump:true, ada:true},
    fees:{nightlyMin:45, nightlyMax:45, note:'$45 per night plus taxes, per the NPS table (2026 season).'},
    book:YLODGE(), contact:{phone:YP, url:YURL},
    hi:['Showers on site','Bicycle sites','Near the Grand Canyon of the Yellowstone'], caut:[YBEAR,'Max RV length 40 ft per the NPS table.'], src:YSRC });
  K('wy-mammoth-campground-yellowstone', 'Mammoth Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'Year-round', close:null, note:'NPS table marks it year-round; first-come sites Oct 15 to Apr 1.'}, status:'open', types:['tent','rv'],
    sites:{total:82, maxRvFt:45, hookups:'none', hookupNote:'Max RV length is 30 ft in winter (mid-Oct to April) and 45 ft May to mid-Oct.'},
    amen:{flush:true, ada:true},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per night, per the NPS table.'},
    book:YRG({firstComeNote:'First-come, first-served from Oct 15 to Apr 1; reservable on Recreation.gov otherwise (per NPS).'}),
    contact:{phone:YP, url:YURL}, fam:{nearTown:'Gardiner, MT'},
    hi:['Only Yellowstone campground open all year','Flush toilets','Bicycle sites'], caut:[YBEAR,'Winter nights are very cold; check road and weather conditions.'], src:YSRC });
  K('wy-norris-campground-yellowstone', 'Norris Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    lat:44.7378, lon:-110.6936, status:'closed-check', statusNote:'Not listed in the NPS campground table this season and a listing showed it closed. Check the NPS page before planning around it.',
    types:['tent','rv'], sites:{total:112, hookups:'none'},
    amen:{water:true, vault:null}, fees:{note:'A third-party listing (AAA TripCanvas) shows $25 per night; not on the NPS table. Confirm with the park.'},
    book:{system:RG, url:YURL, phone:RGPHONE}, contact:{phone:YP, url:YURL},
    hi:['Amphitheater and food storage lockers per a listing'], caut:[YBEAR,'Possibly closed: verify before travelling.'],
    src:[YURL,'https://www.aaa.com/tripcanvas/campground/norris-campground-NPS6B63B182_983C_41D9_82F7_F879170A3517'] });
  K('wy-indian-creek-campground-yellowstone', 'Indian Creek Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'Jun 12', close:'Sep 14', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:70, maxRvFt:35, hookups:'none'}, amen:{vault:true, ada:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night, per the NPS table (2026 season).'},
    book:YRG(), contact:{phone:YP, url:YURL}, hi:['Quieter, smaller camp near Mammoth side of the park','Vault toilets'], caut:[YBEAR], src:YSRC });
  K('wy-slough-creek-campground-yellowstone', 'Slough Creek Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'Jun 15', close:'Oct 12', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:16, maxRvFt:30, hookups:'none', hookupNote:'The NPS table says to assess the access road first for larger rigs.'}, amen:{vault:true, ada:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night, per the NPS table (2026 season).'},
    book:YRG(), contact:{phone:YP, url:YURL}, hi:['Small camp, only 16 sites','Lamar Valley wildlife area'], caut:[YBEAR,'Check the road before towing.'], src:YSRC });
  K('wy-pebble-creek-campground-yellowstone', 'Pebble Creek Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    status:'closed-check', statusNote:'The NPS page shows it closed for flood recovery work. Reservations normally run Apr 15 to Oct 15, first-come the rest of the year.',
    types:['tent','rv'], sites:{total:27, hookups:'none', hookupNote:'The NPS footnote mentions long pull-throughs.'}, amen:{vault:true, ada:true},
    fees:{note:'Rate not stated on the NPS table while closed.'},
    book:YRG(), contact:{phone:YP, url:YURL}, hi:['Small camp in the northeast of the park'], caut:[YBEAR,'Closed at time of reading.'], src:YSRC });
  K('wy-tower-fall-campground-yellowstone', 'Tower Fall Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    season:{open:'May 22', close:'Sep 27', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:31, maxRvFt:30, hookups:'none', hookupNote:'The NPS table warns of a hairpin curve on the access.'}, amen:{vault:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night, per the NPS table (2026 season).'},
    book:YRG(), contact:{phone:YP, url:YURL}, hi:['Bicycle sites','Near Tower Fall'], caut:[YBEAR,'Hairpin curve on the approach: not for long rigs.'], src:YSRC });
  K('wy-lewis-lake-campground-yellowstone', 'Lewis Lake Campground', 'Yellowstone National Park', NPS, 'WY', 'northern-rockies', null, {
    lat:44.2822, lon:-110.628, elev:7800, season:{open:'Jun 15', close:'Oct 11', note:'2026 dates per the NPS table.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:84, maxRvFt:25, hookups:'none', hookupNote:'A listing counts 85 sites; the NPS table says 84.'}, amen:{vault:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night, per the NPS table (2026 season).'},
    book:YRG(), contact:{phone:YP, url:YURL}, fam:{boating:true, fishing:true},
    hi:['On Lewis Lake','Vault toilets'], caut:[YBEAR,'Rigs over 25 ft do not fit per the NPS table.'],
    src:[YURL,'https://outdoorithm.com/campgrounds/wy/yellowstone-np/lewis-lake-campground'] });

  /* ---------------- MOUNT RAINIER ---------------- */
  var MURL = 'https://nps.gov/mora/planyourvisit/campgrounds.htm', MP = '360-569-2211';
  K('wa-cougar-rock-campground-mount-rainier', 'Cougar Rock Campground', 'Mount Rainier National Park', NPS, 'WA', 'pacific-northwest', 'Pierce', {
    season:{open:'Late May', close:'Late September', note:'Closed for the season as of 10/13/2026 per the NPS page.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:178, maxRvFt:35, maxTrailerFt:27, hookups:'none', hookupNote:'178 individual and 5 group sites. No hookups. The RV dump station was closed until further notice.'},
    amen:{flush:true, water:true, dump:false, showers:false},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 individual, $60 group, per the NPS page.'},
    book:{system:RG, url:MURL, phone:RGPHONE, firstComeNote:'Recreation.gov, with some first-come sites per the NPS page.'}, contact:{phone:MP, url:MURL},
    hi:['Flush toilets and water','No public showers in the park'], caut:['Check road and campground status before travelling.'], src:[MURL] });
  K('wa-ohanapecosh-campground-mount-rainier', 'Ohanapecosh Campground', 'Mount Rainier National Park', NPS, 'WA', 'pacific-northwest', 'Lewis', {
    lat:46.73, lon:-121.57, season:{open:'Late May', close:'Late September', note:'Normally late May to early October depending on snow.'}, status:'closed-check',
    statusNote:'Closed for summer 2026 for a rehabilitation project per the NPS page and Recreation.gov listing.', types:['tent','rv','group'],
    sites:{total:179, maxRvFt:32, maxTrailerFt:27, hookups:'none', hookupNote:'179 individual (129 reservable, 50 first-come) and 2 group sites per Recreation.gov listing; 47 tent-only, 9 RV-only.'},
    amen:{flush:true, water:true, dump:false, showers:false},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 individual ($10 with Access or Senior Pass), $60 group.'},
    book:{system:RG, url:MURL, phone:RGPHONE}, contact:{phone:MP, url:MURL},
    hi:['Forest setting near the park southeast entrance'], caut:['Closed for 2026: verify reopening before planning.','Coordinates are approximate (two listing coordinates differ slightly).'],
    src:[MURL,'https://www.aaa.com/tripcanvas/campground/ohanapecosh-campground-NPSEE30401B_4172_4BBA_91AE_B63EAE532367'] });
  K('wa-white-river-campground-mount-rainier', 'White River Campground', 'Mount Rainier National Park', NPS, 'WA', 'pacific-northwest', 'Pierce', {
    season:{open:'Late June', close:'Late September', note:'Closed for the season as of 10/13/2026 per the NPS page.'}, status:'seasonal', types:['tent','rv'],
    sites:{total:88, maxRvFt:27, maxTrailerFt:18, hookups:'none'}, amen:{flush:true, water:true, dump:false, showers:false},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20, per the NPS page.'},
    book:{system:'First-come (pay via Recreation.gov Scan and Pay)', url:MURL, phone:null, firstComeNote:'First-come, first-served permits only per the NPS page.'}, contact:{phone:MP, url:MURL},
    hi:['Close to Sunrise area trailheads'], caut:['Short RV limit (27 ft).'], src:[MURL] });

  /* ---------------- OLYMPIC ---------------- */
  var OURL = 'https://www.nps.gov/olym/planyourvisit/camping.htm', OP = '360-565-3130';
  var OB = function(extra){ return mix({system:RG, url:OURL, phone:RGPHONE}, extra); };
  var OSRC = [OURL];
  var oc = function(id, name, county, o){ o.contact = {phone:OP, url:OURL}; o.src = OSRC; o.types = o.types || ['tent','rv']; K(id, name, 'Olympic National Park', NPS, 'WA', 'pacific-northwest', county, o); };
  oc('wa-kalaloch-campground-olympic', 'Kalaloch Campground', 'Jefferson', {
    season:{open:'Year-round', close:null, note:'May close temporarily in severe weather.'}, status:'open', sites:{total:170, maxRvFt:21, hookups:'none', hookupNote:'21 ft for most sites; a few take 35 ft. Dump station $10 per use.'},
    amen:{flush:true, dump:true}, fam:{beach:true}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:OB({window:'Reservations required May 15 to Sep 20, 2026; first-come otherwise.'}), hi:['Coast campground near the beach'], caut:['Storm closures possible.'] });
  oc('wa-mora-campground-olympic', 'Mora Campground', 'Clallam', {
    season:{open:'Year-round', close:null, note:'May close temporarily in severe weather.'}, status:'open', sites:{total:94, maxRvFt:21, hookups:'none', hookupNote:'21 ft; a few 35 ft. Dump station $10 per use.'},
    amen:{flush:true, dump:true}, fam:{beach:true}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:OB({window:'Reservations required May 15 to Sep 20, 2026; first-come otherwise.'}), hi:['Near Rialto Beach'], caut:[] });
  oc('wa-hoh-campground-olympic', 'Hoh Rain Forest Campground', 'Jefferson', {
    season:{open:'Year-round', close:null, note:'May close temporarily in severe weather.'}, status:'open', sites:{total:78, maxRvFt:21, hookups:'none', hookupNote:'21 ft; a few up to 35 ft. No dump station.'},
    amen:{flush:true, dump:false}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:OB({window:'Reservations required Jun 12 to Sep 6, 2026; first-come otherwise.'}), hi:['In the Hoh rain forest'], caut:[] });
  oc('wa-sol-duc-campground-olympic', 'Sol Duc Campground and RV Park', 'Clallam', {
    season:{open:null, close:null, note:'Primitive camping until the road closes for winter; may close temporarily.'}, status:'seasonal', sites:{total:82, maxRvFt:21, hookups:'partial', hookupNote:'Campground 82 sites at $33. A separate 17-site RV park has water and electric at $58 (26 to 36 ft). Dump station $10 per use.'},
    amen:{flush:true, dump:true}, fees:{nightlyMin:33, nightlyMax:58, note:'$33 campground; $58 RV park, per the NPS page.'},
    book:OB({window:'Reservations required Mar 20 to Nov 1, 2026.'}), hi:['Near Sol Duc Falls trails'], caut:['Hot springs resort is separate; check its fees separately.'] });
  oc('wa-fairholme-campground-olympic', 'Fairholme Campground', 'Clallam', {
    season:{open:'Apr 25', close:'Sep 29', note:'2026 dates per the NPS page.'}, status:'seasonal', sites:{total:88, maxRvFt:21, hookups:'none', hookupNote:'21 ft; some up to 35 ft. Dump $10.'},
    amen:{flush:true, dump:true}, fam:{boating:true}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:OB({window:'Reservations required May 15 to Sep 29, 2026; first-come otherwise.'}), hi:['On Lake Crescent'], caut:[] });
  oc('wa-staircase-campground-olympic', 'Staircase Campground', 'Mason', {
    season:{open:null, close:null, note:'Seasonal; dates not stated on the page.'}, status:'seasonal', sites:{total:49, maxRvFt:21, hookups:'none', hookupNote:'21 ft; a few 35 ft.'},
    amen:{flush:true}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:OB({window:'Reservations required Jul 8 to Sep 29; first-come otherwise.'}), hi:['Southeast corner, trailheads into the Skokomish valley'], caut:[] });
  oc('wa-south-beach-campground-olympic', 'South Beach Campground', 'Jefferson', {
    season:{open:'May 19', close:'Oct 10', note:'2026 dates per the NPS page.'}, status:'seasonal', sites:{total:55, maxRvFt:21, hookups:'none', hookupNote:'21 ft; a few 35 ft.'},
    amen:{flush:true, ada:false}, fam:{beach:true}, fees:{nightlyMin:20, nightlyMax:20, note:'$20 per night per the NPS page.'},
    book:{system:'First-come, first-served', url:OURL, phone:null, firstComeNote:'First-come, first-served per the NPS page.'}, hi:['Ocean beach access'], caut:['Restrooms not wheelchair accessible per the NPS page.'] });
  oc('wa-heart-o-the-hills-campground-olympic', "Heart O' the Hills Campground", 'Clallam', {
    season:{open:'Year-round', close:null, note:'Walk-in only during heavy snowfall.'}, status:'open', sites:{total:97, maxRvFt:21, hookups:'none', hookupNote:'21 ft; a few 35 ft. No dump station.'},
    amen:{flush:true, dump:false}, fees:{nightlyMin:24, nightlyMax:24, note:'$24 per night per the NPS page.'},
    book:{system:'First-come, first-served', url:OURL, phone:null}, hi:['Near Hurricane Ridge road'], caut:[] });

  /* ---------------- WASHINGTON STATE PARKS ---------------- */
  var WAF = 'Peak May 15 to Sep 15; shoulder Apr 1 to May 14 and Sep 16 to Oct 31 (statewide table). Reservation fee $8 online / $10 phone; non-WA residents +$15 per reservation; extra vehicle $10 per night.';
  K('wa-deception-pass-state-park', 'Deception Pass State Park campgrounds', 'Deception Pass State Park', 'Washington State Parks', 'WA', 'pacific-northwest', 'Island/Skagit', {
    lat:48.3973, lon:-122.646, season:{open:null, close:null, note:'Winter camping listed as an activity; check dates.'}, status:'open', types:['tent','rv'],
    amen:{showers:true, flush:true, water:true, firepit:true}, fees:{note:'Site rates not on the park page; the WA statewide table lists standard $23 to $43, partial hookup $35 to $51, full hookup $41 to $56 by season. '+WAF},
    book:{system:'Washington State Parks (goingtocamp)', url:'https://washington.goingtocamp.com', phone:null}, contact:{phone:'360-675-3767', email:'Deception.Pass@parks.wa.gov', url:'https://parks.wa.gov/find-parks/state-parks/deception-pass-state-park', address:'41229 State Route 20, Oak Harbor, WA 98277'},
    fam:{beach:true}, hi:['Cranberry Lake camp loop; Lake Store between campgrounds'], caut:['Site counts not read; burn bans may limit fires.'],
    src:['https://parks.wa.gov/find-parks/state-parks/deception-pass-state-park','https://parks.wa.gov/231/Fees'] });
  K('wa-cape-disappointment-state-park', 'Cape Disappointment State Park campground', 'Cape Disappointment State Park', 'Washington State Parks', 'WA', 'pacific-northwest', 'Pacific', {
    lat:46.29, lon:-124.0718, status:'closed-check', statusNote:'A listing said closed for major renovations until June 30, 2026 with reservations expected from July 1; confirm current status.', types:['tent','rv'],
    sites:{hookups:'full', hookupNote:'Loops A to D with tent, partial and full hookup sites; five hiker/biker sites first-come.'},
    fees:{note:'Site rates not on a park page. WA statewide: standard $23 to $43, partial $35 to $51, full $41 to $56; at Cape Disappointment the shoulder rate extends through winter. '+WAF},
    book:{system:'Washington State Parks (goingtocamp)', url:'https://washington.goingtocamp.com', phone:null}, contact:{phone:'360-642-3078', url:'https://parks.wa.gov'},
    fam:{beach:true}, hi:['Four camping loops near the Columbia River mouth'], caut:['Verify reopening status.'],
    src:['https://campflare.com/campground/cape-disappointment-wsp','https://parks.wa.gov/231/Fees'] });

  /* ---------------- OREGON STATE PARKS ---------------- */
  var ORF = 'Statewide Oregon rates from May 1 2026: tent $20 to $42, electric $29 to $70, full hookup $31 to $70 (resident to non-resident ranges); yurts about $73 to $103; extra vehicle $10. Not a per-park price.';
  var ORB = {system:'Oregon State Parks (ReserveAmerica)', url:'https://oregonstateparks.reserveamerica.com', phone:'800-452-5687', window:'Up to 6 months ahead'};
  K('or-fort-stevens-state-park-campground', 'Fort Stevens State Park campground', 'Fort Stevens State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Clatsop', {
    season:{open:'Year-round', close:null, note:null}, status:'open', types:['tent','rv'],
    sites:{total:null, hookups:'full', hookupNote:'174 full-hookup (36 pull-through), 302 electric with water (11 pull-through), 6 tent, 15 yurts, 11 deluxe cabins, 9 hike-in primitive, hiker/biker.'},
    amen:{showers:true, flush:true, dump:true, firepit:true, cell:true, ada:true}, fees:{nightlyMin:20, nightlyMax:70, note:ORF},
    book:ORB, contact:{phone:'503-861-3170', url:'https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=129'},
    fam:{beach:true}, hi:['Yurts and cabins for year-round trips','Dump station $10 per use'], caut:['Reservations required.'],
    src:['https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=129','https://stateparks.oregon.gov/index.cfm?do=reserve.rates'] });
  K('or-cape-lookout-state-park-campground', 'Cape Lookout State Park campground', 'Cape Lookout State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Tillamook', {
    season:{open:'Year-round', close:null, note:'Annual winter closures apply.'}, status:'closed-check', statusNote:'Campground closed Aug 3, 2026 for improvements, expected through spring 2027.', types:['tent','rv'],
    sites:{hookups:'full', hookupNote:'38 full-hookup, 170 tent, 1 electric, 13 yurts, 6 deluxe cabins, group area, hiker/biker.'},
    amen:{showers:true, flush:true, dump:true}, fees:{nightlyMin:20, nightlyMax:70, note:ORF},
    book:ORB, contact:{phone:'503-842-4981', url:'https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=134'},
    fam:{beach:true}, hi:['Beachside tent camping per listings'], caut:['Closed for construction: verify.'],
    src:['https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=134','https://stateparks.oregon.gov/index.cfm?do=reserve.rates'] });
  K('or-beverly-beach-state-park-campground', 'Beverly Beach State Park campground', 'Beverly Beach State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Lincoln', {
    season:{open:'Year-round', close:null, note:'D, E and G loop restrooms and showers close Oct 1, 2026 and reopen spring 2027.'}, status:'open', types:['tent','rv'],
    sites:{hookups:'full', hookupNote:'53 full-hookup, 76 electric with water (32 pull-through), 128 tent, 21 yurts, 3 group tent areas, hiker/biker.'},
    amen:{showers:true, flush:true, dump:true, ada:true}, fees:{nightlyMin:20, nightlyMax:70, note:ORF},
    book:ORB, contact:{phone:'541-265-9278', url:'https://stateparks.oregon.gov/park_227.php'},
    fam:{beach:true}, hi:['Firewood sold daily'], caut:['Some showers closed from Oct 1 2026.'],
    src:['https://stateparks.oregon.gov/park_227.php','https://stateparks.oregon.gov/index.cfm?do=reserve.rates'] });
  K('or-south-beach-state-park-campground', 'South Beach State Park campground', 'South Beach State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Lincoln', {
    lat:44.6042, lon:-124.0625, elev:23, status:'open', types:['tent','rv'],
    sites:{total:285, hookups:'partial', hookupNote:'285 campsites including 27 yurts and 3 group tent areas; electric and water hookups.'},
    amen:{dump:true, water:true}, fees:{nightlyMin:22, nightlyMax:22, note:'Standard site $22 per the listing; extra vehicle $7; dump $10. Statewide table may differ. '+ORF},
    book:ORB, contact:{phone:'541-867-4715', url:'https://outdoorithm.com/campgrounds/or/newport/beverly-beach-state-park'},
    fam:{beach:true}, hi:['Beach and dunes near Newport'], caut:['Third-party listing (outdoorithm); confirm on stateparks.oregon.gov.'],
    src:['https://outdoorithm.com/campgrounds/or/newport/beverly-beach-state-park'] });
  K('or-honeyman-state-park-campground', 'Jessie M. Honeyman State Park campground', 'Jessie M. Honeyman Memorial State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Lane', {
    season:{open:'Year-round', close:null, note:'F loop, G loop, B loop 57-79 and C loop 102-151 closed Oct 1 2026 to May 21 2027; all loops closed Jan 1 to Feb 28 2027.'}, status:'seasonal', types:['tent','rv'],
    sites:{hookups:'full', hookupNote:'47 full-hookup, 121 electric with water, 187 tent, 10 yurts, 6 group tent areas, hiker/biker.'},
    amen:{showers:true, flush:true, dump:true, ada:true}, fees:{nightlyMin:20, nightlyMax:70, note:ORF},
    book:ORB, contact:{phone:'541-997-3851', url:'https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=95'},
    fam:{swim:true}, hi:['Lakes and dunes'], caut:['Check winter closures.'],
    src:['https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=95','https://stateparks.oregon.gov/index.cfm?do=reserve.rates'] });
  K('or-silver-falls-state-park-campground', 'Silver Falls State Park campground', 'Silver Falls State Park', 'Oregon State Parks', 'OR', 'pacific-northwest', 'Marion', {
    lat:44.8717, lon:-122.6513, season:{open:null, close:null, note:'Tent sites May to October; 18+ electric sites and cabins year-round.'}, status:'open', types:['tent','rv'],
    sites:{hookups:'partial', hookupNote:'48 electric with water, 43 tent, 14 cabins; Howard Creek Horse Camp May to Sept.'},
    amen:{showers:true, flush:true, dump:true, ada:true}, fees:{nightlyMin:20, nightlyMax:70, note:ORF+' Firewood $7, ice $3.'},
    book:ORB, contact:{phone:'503-873-8681', url:'https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=151', address:'20024 Silver Falls Hwy SE, Sublimity, OR 97385'},
    hi:['Waterfall trails'], caut:['Coordinates approximate, derived from a page link.'],
    src:['https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=151','https://stateparks.oregon.gov/index.cfm?do=reserve.rates'] });

  /* ---------------- NEVADA / SD / VA ---------------- */
  K('nv-atlatl-rock-campground-valley-of-fire', 'Atlatl Rock Campground', 'Valley of Fire State Park', 'Nevada State Parks', 'NV', 'desert-southwest', 'Clark', {
    lat:36.4187, lon:-114.5517, status:'open', types:['tent','rv'],
    sites:{total:44, hookups:'partial', hookupNote:'Listing: sites 23 to 44 have electric and water.'}, amen:{showers:true},
    fees:{note:'Listing shows past reviewer-reported rates from $10 to $40 plus a day-use fee; not official. Confirm with the park.'},
    book:{system:null, url:'https://parks.nv.gov', phone:null}, contact:{phone:'702-397-2088', url:'https://parks.nv.gov'},
    hi:['Desert camp near Atlatl Rock petroglyphs'], caut:['Extreme summer heat.','Third-party source only; confirm everything with Nevada State Parks.'],
    src:['https://campendium.com/atlatl-rock-campground-valley-fire-sp'] });
  K('nv-arch-rock-campground-valley-of-fire', 'Arch Rock Campground', 'Valley of Fire State Park', 'Nevada State Parks', 'NV', 'desert-southwest', 'Clark', {
    status:null, types:['tent','rv'], fees:{note:'Not verified.'}, book:{system:'First-come, first-served (per listing)', url:'https://parks.nv.gov', phone:null},
    contact:{phone:'702-397-2088', url:'https://parks.nv.gov'}, hi:['More primitive than Atlatl Rock per a listing'], caut:['Only a brief third-party mention; confirm with the park.'],
    src:['https://campendium.com/atlatl-rock-campground-valley-fire-sp'] });
  K('sd-cedar-pass-campground-badlands', 'Cedar Pass Campground', 'Badlands National Park', NPS, 'SD', 'great-plains', 'Jackson', {
    lat:43.7442, lon:-101.9502, status:'open', statusNote:'A limited section is open in winter.', types:['tent','rv','group'],
    sites:{total:96, hookups:'electric', hookupNote:'Listing: 82 tent-only, 14 RV-only, 10 electric; electric only, no water or sewer; septic dump nearby $1.'},
    amen:{flush:true, water:true, dump:true}, fees:{nightlyMin:37, nightlyMax:47, note:'Tent and non-electric RV $37, electric RV $47 per a listing; confirm.'},
    book:{system:RG, url:'https://www.nps.gov/badl/planyourvisit/camping.htm', phone:RGPHONE}, contact:{url:'https://www.nps.gov/badl/planyourvisit/camping.htm', address:'20681 SD Highway 240, Interior, SD 57750'},
    hi:['Gateway to the Badlands loop road'], caut:['RV stays limited to 14 nights in summer per listing.','Third-party source; confirm with the park.'],
    src:['https://www.aaa.com/tripcanvas/campground/cedar-pass-campground-NPS92F73FF4_10AB_45D0_915E_AC0A063420E2'] });
  K('va-big-meadows-campground-shenandoah', 'Big Meadows Campground', 'Shenandoah National Park', NPS, 'VA', 'east', 'Madison', {
    lat:38.5286, lon:-78.4387, elev:3630, season:{open:'Late March', close:'Late November', note:'Reservable season Mar 26 to Nov 29 per one listing.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{total:200, hookups:'none', hookupNote:'Listings give 200 or 221 sites; no electric hookups.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, wifi:true, laundry:true, firepit:true, bearBox:true, cell:false},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 standard site, $75 group, per a listing; confirm on Recreation.gov.'},
    book:{system:RG, url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm', phone:RGPHONE}, contact:{phone:'540-999-3500', url:'https://www.nps.gov/shen/planyourvisit/campgrounds.htm'},
    hi:['Camp store, laundry and showers on site'], caut:['Cell service is very limited.','Third-party source; confirm with the park.'],
    src:['https://www.outdoorithm.com/campgrounds/va/shenandoah-np/big-meadows-campground-va','https://ww2.aaa.com/tripcanvas/campground/big-meadows-campground-NPS75E4DC88_1332_456C_9F06_05E9F4E1CAB6'] });
})();
