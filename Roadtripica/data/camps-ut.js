/* Campica data pack: Utah campgrounds (state parks, NPS, national forests, Flaming Gorge, BLM Moab).
   Facts only from pages listed in SOURCES-camps-ut.md. Any field left null was NOT verified: the UI must say
   "check with the source" and show the official link. lat/lon are null unless a source listed a coordinate.
   Nightly fees are given only where a page we read stated them (note says which source and how current). */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', USFS = 'U.S. Forest Service', BLM = 'Bureau of Land Management', UTSP = 'Utah State Parks';
  var RGPHONE = '877-444-6777', UTRES = '800-322-3770';
  var REG = 'utah';
  function K(id, name, parent, agency, county, o){
    o = o || {};
    CAMPS.items.push({
      id: id, name: name, parent: parent, agency: agency, state: 'UT', region: REG, county: county || null,
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
    });
  }
  var SPHOME = 'https://stateparks.utah.gov/';
  var SPGUIDE = 'https://stateparks.utah.gov/wp-content/uploads/sites/13/2023/06/UT23_Guide_Eng_041023.pdf';
  var SPFEES = 'https://npr.brightspotcdn.com/8f/6c/b5eedc154614bbfc738522433c29/fee-changes-for-media-2026-master-list.pdf';
  function SPB(extra){ return mix({system:'Utah State Parks reservations', url:SPHOME, phone:UTRES}, extra); }
  function RG(url, extra){ return mix({system:'recreation.gov', url:url, phone:RGPHONE}, extra); }
  var FCFS = 'First come, first served';
  var BLMPHONE = '435-259-2100';
  var BLMGUIDE = 'https://www.blm.gov/sites/default/files/docs/2025-12/BLM%20Moab%20Visitor%20Guide%207.16.24%20PFD_0.pdf';
  var FGLIST = 'https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Flaming-Gorge/Logistics/Camping';
  var FGNRA = 'https://www.fs.usda.gov/r04/ashley/recreation/flaming-gorge-national-recreation-area-0';
  var UWCFEES = 'https://fs.usda.gov/Internet/FSE_DOCUMENTS/stelprdb5363036.pdf';
  var FGNOTE = 'Nightly rate not read on any page we could open: see Recreation.gov for the current rate.';

  /* ================= UTAH STATE PARKS ================= */
  K('ut-kayenta-campground-dead-horse-point', 'Kayenta Campground', 'Dead Horse Point State Park', UTSP, 'Grand', {
    season:{open:'Year-round', note:'Park advises being self-contained Oct 2 to Mar 31 because of cold weather.'},
    status:'open', types:['rv','tent'],
    sites:{total:22, hookups:'electric', hookupNote:'22 sites with 20/30/50 amp electric; flush toilets and a dump station. No potable water at the park for RV tanks: the nearest is in Moab.'},
    amen:{flush:true, dump:true, firepit:true, pets:'limited'},
    fam:{kidNote:'Close to the Dead Horse Point overlooks; Moab is the nearest town for supplies.', nearTown:'Moab, UT'},
    fees:{note:'Kayenta nightly rate not read. The sister Wingate RV sites were $50 to $60 a night per the park fee page; confirm Kayenta on the reservation site. Extra vehicle $20 a night (park page).'},
    book:SPB({window:'Up to 4 months ahead', firstComeNote:'Reserving March through November is advised; first-come sites are sold at the visitor center gift shop and are rarely available.'}),
    contact:{phone:'435-259-2614', url:'https://stateparks.utah.gov/parks/dead-horse/park-fees/'},
    hi:['Rim-top park with overlook trails','Electric hookups','Dump station'],
    caut:['Cold winters: the park advises being self-contained Oct 2 to Mar 31.','Reservations strongly advised in the busy season.'],
    src:['https://stateparks.utah.gov/parks/dead-horse/park-fees/','https://campflare.com/group/ra-ut-344161',SPGUIDE]
  });
  K('ut-wingate-campground-dead-horse-point', 'Wingate Campground', 'Dead Horse Point State Park', UTSP, 'Grand', {
    season:{open:'Year-round'}, status:'open', types:['rv','tent','walk-in'],
    sites:{total:null, hookups:'electric', hookupNote:'About 21 RV sites with 20/30/50 amp electric plus 11 hike-in tent-only sites (hike up to 300 ft from the parking by the restroom). Dump station on site; no water for RV tanks.'},
    amen:{flush:true, vault:true, dump:true, firepit:true, pets:'limited'},
    fees:{nightlyMin:40, nightlyMax:60, extraVehicle:20, note:'Park fee page: RV sites $60 (Mar-Jun, Sep-Oct) or $50 other months; hike-in tent sites $45 or $40. A 2026 fee list shows peak RV $60 and peak tent $45 from Mar 1 2026.'},
    book:SPB({window:'Up to 4 months ahead'}),
    contact:{phone:'435-259-2614', url:'https://stateparks.utah.gov/parks/dead-horse/park-fees/'},
    hi:['Shade shelter, fire ring and tent pad at each site','Hike-in tent sites away from the RVs'],
    caut:['No potable water for RV tanks at the park.','Yurts at Wingate cost $150 a night and take no pets.'],
    src:['https://stateparks.utah.gov/parks/dead-horse/park-fees/','https://campflare.com/group/ra-ut-344161',SPFEES]
  });
  K('ut-goblin-valley-campground', 'Goblin Valley State Park Campground', 'Goblin Valley State Park', UTSP, 'Emery', {
    types:['tent','rv','group','cabin'],
    sites:{hookups:'none', hookupNote:'The main campground is $45 with no hookups. Yurts ($150 plus tax) and a group campground (up to 40 people, 10 vehicles, $200 plus tax) are also offered.'},
    amen:{water:true, dump:true},
    fam:{kidNote:'The goblin rock formations make a good scramble ground for children.'},
    fees:{nightlyMin:45, nightlyMax:45, extraVehicle:20, note:'Park fee page: main campground $45, no hookups. Dump and water station $15 for non-campers.'},
    book:SPB({window:'Not stated on the park page.'}),
    contact:{phone:'435-275-4584', url:'https://stateparks.utah.gov/parks/goblin-valley/park-fees'},
    hi:['Hoodoo "goblin" valley hikes','Yurts and group camp available'],
    caut:['Remote desert park with extreme summer heat: carry plenty of water.','Showers, site count and season were not stated on the page we read.'],
    src:['https://stateparks.utah.gov/parks/goblin-valley/park-fees',SPGUIDE]
  });
  K('ut-basin-campground-kodachrome-basin', 'Basin Campground', 'Kodachrome Basin State Park', UTSP, 'Kane', {
    season:{note:'Closed Dec 1 to Mar 1.'}, status:'seasonal', types:['tent','rv','group'],
    sites:{hookups:'some', hookupNote:'Standard sites have no hookups; 13 full-hookup sites. Oasis group campground (tents only, 35 people) is closed Nov 1 to Mar 1.'},
    fees:{nightlyMin:35, nightlyMax:45, extraVehicle:16, note:'Park page: $35 standard, $45 full hookup, $95 Oasis group site; extra vehicle $16. Fees may have changed since the page was written.'},
    book:SPB({window:'Up to 16 weeks (4 months) ahead'}),
    contact:{phone:'435-679-8562', url:'https://stateparks.utah.gov/?p=941'},
    hi:['Colourful sandstone pillars close to Bryce Canyon','Bunkhouses ($95) and a hut are also offered'],
    caut:['Quiet hours 10 pm to 7 am; generators noon to 4 pm only.'],
    src:['https://stateparks.utah.gov/?p=941',SPGUIDE]
  });
  K('ut-bryce-view-arch-campgrounds-kodachrome-basin', 'Bryce View and Arch Campgrounds', 'Kodachrome Basin State Park', UTSP, 'Kane', {
    season:{open:'Year-round', note:'Dec 1 to Mar 1 weather permitting.'}, status:'open', types:['tent','rv'],
    sites:{hookups:'some', hookupNote:'Bryce View has no hookups but has a flush toilet; Arch Campground has power and water.'},
    amen:{flush:true},
    fees:{nightlyMin:35, nightlyMax:45, extraVehicle:16, note:'Park page: Bryce View $35, Arch $45; extra vehicle $16.'},
    book:SPB({window:'Up to 16 weeks (4 months) ahead'}),
    contact:{phone:'435-679-8562', url:'https://stateparks.utah.gov/?p=941'},
    caut:['Bryce View sites hold 4 people each; Arch sites hold 8.'],
    src:['https://stateparks.utah.gov/?p=941']
  });
  K('ut-bridger-bay-campground-antelope-island', 'Bridger Bay Campground', 'Antelope Island State Park', UTSP, 'Davis', {
    lat:41.05833, lon:-112.24889, season:{open:'Year-round'}, status:'open', types:['tent','rv'],
    sites:{total:64, hookups:'partial', maxRvFt:90, hookupNote:'64 sites in two loops (6 ADA). Water and electric only in the upper loop (sites 27 to 64).'},
    amen:{showers:true, flush:true, vault:true, dump:true, store:true, firepit:true, pets:'yes', ada:true},
    fam:{beach:true, swim:true, kidNote:'Bison and big-sky views on the island; Bridger Bay Beach is close.'},
    fees:{nightlyMin:30, nightlyMax:40, extraVehicle:18, note:'Park page: $40 with hookups, $30 without; a day-use vehicle fee also applies.'},
    book:SPB({window:'Reserve at least 2 days ahead; first come on the day before and day of arrival', firstComeNote:'Reservations strongly recommended on weekends.'}),
    contact:{phone:'801-773-2941', url:'https://stateparks.utah.gov/parks/antelope-island/camping-opportunities/'},
    hi:['Bison herd and island hikes','Flush toilets and showers'],
    caut:['The park page noted visitor centre construction and no water on the island: ask before you go.','Wildlife: keep well clear of bison.'],
    src:['https://stateparks.utah.gov/parks/antelope-island/camping-opportunities/','https://campflare.com/campground/antelope-island-state-park-031 (coordinate, park listing)',SPGUIDE]
  });
  K('ut-ladyfinger-campground-antelope-island', 'Ladyfinger Campground', 'Antelope Island State Park', UTSP, 'Davis', {
    types:['tent','walk-in'], sites:{total:5, hookups:'none', hookupNote:'Five hike-in tent sites about 230 ft from the parking area. No water or electricity.'},
    amen:{vault:true, showers:false, firepit:false},
    fees:{nightlyMin:20, nightlyMax:20, note:'Park page: $20 a night, one vehicle, 4 people per site. Fires not allowed.'},
    book:SPB({window:'Reserve at least 2 days ahead; first come on the day before and day of arrival'}),
    contact:{phone:'801-773-2941', url:'https://stateparks.utah.gov/parks/antelope-island/camping-opportunities/'},
    caut:['Showers are at Bridger Bay Beach, about 1 mile away.'],
    src:['https://stateparks.utah.gov/parks/antelope-island/camping-opportunities/']
  });
  K('ut-bear-lake-state-park-campgrounds', 'Bear Lake State Park Campgrounds', 'Bear Lake State Park', UTSP, 'Rich', {
    lat:41.84554, lon:-111.33866, types:['tent','rv','group'],
    season:{note:'Rendezvous Beach loops late April to late October; Cisco Beach and Rainbow Cove year-round; North and South Eden May to October (campground listing).'},
    status:'seasonal',
    sites:{hookups:'varies', maxRvFt:90, hookupNote:'Birch and Big Creek (Rendezvous Beach) have full hookups (about 57 and 46 sites); Eden sites have partial hookups; Cisco Beach is primitive (about 59 sites).'},
    amen:{showers:true, flush:true, water:true, firepit:true},
    fam:{swim:true, beach:true, boating:true, kidNote:'Sandy beaches on a large turquoise lake.'},
    fees:{nightlyMin:30, nightlyMax:60, extraVehicle:30, note:'2026 state fee list (new rates from summer 2026): primitive $30, partial hookup $50, full hookup $60, extra vehicle $30. Earlier rates were $25/$40/$50.'},
    book:SPB({window:'Not stated.'}),
    contact:{phone:'435-946-3343', url:SPHOME, address:'381 W 1200 N, Laketown, UT 84038 (listing address)'},
    hi:['Beaches along the east shore','Full-hookup loops at Rendezvous Beach'],
    caut:['Coordinate is the Campflare listing address for the park, not a single campground gate.'],
    src:['https://campflare.com/campground/bear-lake-state-park-061',SPFEES,SPGUIDE]
  });
  K('ut-coral-pink-sand-dunes-campground', 'Coral Pink Sand Dunes Campground', 'Coral Pink Sand Dunes State Park', UTSP, 'Kane', {
    types:['tent','rv','group'], sites:{hookups:'none', hookupNote:'Primitive sites (no hookups listed) plus two group sites.'},
    fees:{nightlyMin:30, nightlyMax:60, note:'2026 state fee list (effective Jan 1 2026): primitive $30, primitive double $60; group sites $175 and $225.'},
    book:SPB(), contact:{phone:'435-648-2800', url:SPHOME},
    fam:{kidNote:'Pink dunes to play on; OHV area shares the park.'},
    caut:['The official guide did not name the campground details: confirm sites, water and showers with the park.'],
    src:[SPFEES,SPGUIDE]
  });
  K('ut-deer-creek-state-park-campground', 'Deer Creek State Park Campground', 'Deer Creek State Park', UTSP, 'Wasatch', {
    types:['tent','rv','group'], sites:{hookups:'electric', hookupNote:'RV sites with 30 or 50 amp (the state guide says full hookups); tent sites and large group sites also offered.'},
    fam:{boating:true, fishing:true, swim:true},
    fees:{nightlyMin:50, nightlyMax:60, note:'2026 state fee list (effective Jan 1 2026): 30-amp $50, 50-amp $60. The tent rate was blank in that list: confirm.'},
    book:SPB(), contact:{phone:'435-654-0171', url:SPHOME},
    src:[SPFEES,SPGUIDE]
  });
  K('ut-jordanelle-state-park-campgrounds', 'Jordanelle Campgrounds (Hailstone, Rock Cliff, Ross Creek)', 'Jordanelle State Park', UTSP, 'Wasatch', {
    types:['tent','rv'], book:SPB(), contact:{phone:'435-649-9540', url:SPHOME},
    fam:{boating:true, swim:true, fishing:true},
    caut:['Site counts, hookups and nightly rates were not on any page we read: use the official site.'],
    src:[SPGUIDE]
  });
  K('ut-wasatch-mountain-state-park-campground', 'Wasatch Mountain State Park Campground', 'Wasatch Mountain State Park', UTSP, 'Wasatch', {
    types:['tent','rv'], book:SPB(), contact:{phone:'435-654-1791', url:SPHOME},
    caut:['Site counts and nightly rates not verified: use the official site.'],
    src:[SPGUIDE]
  });
  K('ut-starvation-state-park-campgrounds', 'Starvation Campgrounds (Beach and Mountain View)', 'Fred Hayes State Park at Starvation', UTSP, 'Duchesne', {
    types:['tent','rv'], sites:{hookups:'partial', hookupNote:'Beach and Mountain View are developed; Indian Bay, Rabbit Gulch, Juniper Point and Knight Hollow are primitive.'},
    fam:{boating:true, fishing:true, swim:true},
    fees:{nightlyMin:20, nightlyMax:40, note:'2026 state fee list (effective Feb 15 2026): partial-hookup camping $40, boat camping $20.'},
    book:SPB(), contact:{phone:'435-738-2326', url:SPHOME},
    src:[SPFEES,SPGUIDE]
  });
  K('ut-green-river-state-park-campground', 'Green River State Park Campground', 'Green River State Park', UTSP, 'Emery', {
    types:['tent','rv'], book:SPB(), contact:{phone:'435-564-3633', url:SPHOME},
    fam:{boating:true},
    caut:['The state guide names no campground details. Hipcamp lists the park among Utah state park campgrounds; confirm sites and rates with the park.'],
    src:[SPGUIDE,'https://www.hipcamp.com/en-US/discover/utah/state-parks']
  });
  K('ut-escalante-petrified-forest-campground', 'Escalante Petrified Forest Campground', 'Escalante Petrified Forest State Park', UTSP, 'Garfield', {
    types:['tent','rv'], book:SPB(), contact:{phone:'435-826-4466', url:SPHOME},
    fam:{fishing:true, boating:true, easyTrails:true, kidNote:'Camping is beside Wide Hollow Reservoir.'},
    src:[SPGUIDE]
  });
  K('ut-gunlock-state-park-campground', 'Gunlock State Park Campground', 'Gunlock State Park', UTSP, 'Washington', {
    types:['tent','rv'], sites:{hookups:'partial'},
    fees:{nightlyMin:45, nightlyMax:45, note:'2026 state fee list (effective Jan 1 2026): partial-hookup camping $45.'},
    book:SPB(), contact:{phone:'435-218-6544', url:SPHOME},
    src:[SPFEES,SPGUIDE]
  });
  K('ut-palisade-state-park-campground', 'Palisade State Park Campground', 'Palisade State Park', UTSP, 'Sanpete', {
    types:['tent','rv','cabin'], sites:{hookups:'some', hookupNote:'The state guide lists tent camping, RV sites with hookups and deluxe cabins.'},
    fam:{swim:true, boating:true}, book:SPB(), contact:{phone:'435-835-7275', url:SPHOME},
    src:[SPGUIDE]
  });
  K('ut-millsite-state-park-campground', 'Millsite State Park Campground', 'Millsite State Park', UTSP, 'Emery', {
    types:['tent','rv'], season:{note:'The park phone listed is the summer number.'},
    book:SPB(), contact:{phone:'435-384-2552', url:SPHOME},
    src:[SPGUIDE]
  });
  K('ut-quail-creek-state-park-campground', 'Quail Creek State Park Campground', 'Quail Creek State Park', UTSP, 'Washington', {
    types:['tent','rv'], sites:{hookups:'partial'},
    fees:{nightlyMin:30, nightlyMax:45, note:'2026 state fee list (effective date pending new signs): primitive $30, partial hookups $45. Earlier $28 and $40.'},
    book:SPB(), contact:{phone:'435-879-2378', url:SPHOME},
    src:[SPFEES,SPGUIDE]
  });
  K('ut-sand-hollow-state-park-campgrounds', 'Sand Hollow Campgrounds', 'Sand Hollow State Park', UTSP, 'Washington', {
    lat:37.1185, lon:-113.3872, season:{open:'Year-round'}, status:'open', types:['tent','rv','group'],
    sites:{hookups:'varies', hookupNote:'Westside (full hookups, about 59 sites), Lakeview (full and partial), Sandpit (partial and dry), a primitive area and shoreline camping.'},
    amen:{showers:true}, fam:{swim:true, beach:true, boating:true, kidNote:'Reservoir beaches and sand dunes.'},
    fees:{nightlyMin:25, nightlyMax:55, note:'Rates from a campground listing (not dated): primitive $25, Sandpit $30 to $40, Westside $43, Lakeview $45 to $50. A 2026 state fee list adds Beachside $55 (pending new signs). Coordinate is the park, not a campground.'},
    book:SPB(), contact:{phone:'435-680-0715', url:SPHOME},
    src:['https://www.americansouthwest.net/utah/sand-hollow/state-park.html','https://campflare.com/group/ra-ut-345761',SPFEES,SPGUIDE]
  });
  K('ut-snow-canyon-state-park-campground', 'Snow Canyon State Park Campground', 'Snow Canyon State Park', UTSP, 'Washington', {
    types:['tent','rv'], book:SPB(), contact:{phone:'435-628-2255', url:SPHOME},
    fam:{easyTrails:true, kidNote:'Red sandstone and lava-tube scrambles near St. George.'},
    caut:['Site counts and nightly rates not verified: use the official site.'],
    src:[SPGUIDE,'https://zionarea.udot.utah.gov/state-parks']
  });
  K('ut-rockport-state-park-campgrounds', 'Rockport State Park Campgrounds', 'Rockport State Park', UTSP, 'Summit', {
    types:['tent','rv'], sites:{hookups:'partial', hookupNote:'Developed and primitive campgrounds; yurts run by a concessionaire.'},
    fam:{boating:true, fishing:true, swim:true},
    fees:{nightlyMin:35, nightlyMax:45, extraVehicle:25, note:'2026 state fee list (effective Jan 8 2026): primitive $35, partial hookups $45; doubles $45 and $70.'},
    book:SPB(), contact:{phone:'435-336-2241', url:SPHOME}, src:[SPFEES,SPGUIDE]
  });
  K('ut-east-canyon-state-park-campgrounds', 'East Canyon State Park Campgrounds', 'East Canyon State Park', UTSP, 'Morgan', {
    types:['tent','rv','cabin'], sites:{hookups:'varies', hookupNote:'RV (full and partial), hammock and primitive sites; yurts, wagons and cabins also offered.'},
    fees:{nightlyMin:40, nightlyMax:55, note:'2026 state fee list (effective by March 2026): primitive $40, hammock $40, partial $50, full $55.'},
    fam:{boating:true, fishing:true}, book:SPB(), contact:{phone:'801-829-6866', url:SPHOME}, src:[SPFEES,SPGUIDE]
  });
  K('ut-hyrum-state-park-campground', 'Hyrum State Park Campground', 'Hyrum State Park', UTSP, 'Cache', {
    types:['tent','rv','group'], sites:{hookups:'partial'},
    fees:{nightlyMin:40, nightlyMax:50, note:'2026 state fee list (effective Jan 1 2026): dry $40, partial hookups $50; large group $400.'},
    fam:{swim:true, boating:true}, book:SPB(), contact:{phone:'435-245-6866', url:SPHOME}, src:[SPFEES,SPGUIDE]
  });
  K('ut-red-fleet-state-park-campground', 'Red Fleet State Park Campground', 'Red Fleet State Park', UTSP, 'Uintah', {
    types:['tent','rv'], sites:{total:38}, fam:{boating:true, swim:true},
    book:SPB(), contact:{phone:'435-789-4432', url:SPHOME}, src:[SPGUIDE]
  });
  K('ut-steinaker-state-park-campground', 'Steinaker State Park Campground', 'Steinaker State Park', UTSP, 'Uintah', {
    types:['tent','rv'], sites:{hookups:'some', hookupNote:'The state guide says hookups are available.'}, fam:{boating:true, fishing:true},
    book:SPB(), contact:{phone:'435-789-4432', url:SPHOME}, src:[SPGUIDE]
  });
  K('ut-echo-state-park-campground', 'Echo State Park Campground', 'Echo State Park', UTSP, 'Summit', {
    types:['tent','rv'], fam:{boating:true, fishing:true},
    book:SPB(), contact:{phone:'435-336-4906', url:SPHOME}, src:[SPGUIDE]
  });

  /* ================= NPS ================= */
  K('ut-cathedral-valley-campground-capitol-reef', 'Cathedral Valley Campground', 'Capitol Reef National Park', NPS, 'Wayne', {
    season:{open:'Year-round', note:'Road can be impassable in bad weather.'}, status:'open', types:['tent'],
    sites:{total:6, hookups:'none'}, amen:{water:false, vault:true, firepit:true, showers:false},
    fees:{nightlyMin:0, nightlyMax:0, note:'NPS page: no fee. Park entrance fee may still apply.'},
    book:{system:FCFS, firstComeNote:'No reservations. Limits 8 people and 2 vehicles per site.'},
    contact:{phone:'435-425-3791', url:'https://home.nps.gov/care/planyourvisit/primitive-campgrounds.htm'},
    caut:['About 36 miles along the Cathedral Valley Loop Road; high-clearance four-wheel drive is usually needed.','No water: bring everything. Press 1 then 4 on the park phone for road conditions.'],
    src:['https://home.nps.gov/care/planyourvisit/primitive-campgrounds.htm']
  });
  K('ut-cedar-mesa-campground-capitol-reef', 'Cedar Mesa Campground', 'Capitol Reef National Park', NPS, 'Garfield', {
    season:{open:'Year-round'}, status:'open', types:['tent'],
    sites:{total:5, hookups:'none'}, amen:{water:false, vault:true, firepit:true, showers:false},
    fees:{nightlyMin:0, nightlyMax:0, note:'NPS page: no fee. Park entrance fee may still apply.'},
    book:{system:FCFS, firstComeNote:'No reservations. Limits 8 people and 2 vehicles per site.'},
    contact:{phone:'435-425-3791', url:'https://home.nps.gov/care/planyourvisit/primitive-campgrounds.htm'},
    caut:['About 23 miles south of Utah 24 on the Notom-Bullfrog Road; 2WD usually works but high clearance is sometimes required.','No water: bring everything.'],
    src:['https://home.nps.gov/care/planyourvisit/primitive-campgrounds.htm']
  });
  K('ut-point-supreme-campground-cedar-breaks', 'Point Supreme Campground', 'Cedar Breaks National Monument', NPS, 'Iron', {
    types:['tent','rv','walk-in'], sites:{hookups:'none', hookupNote:'No electricity; showers were added to the campground (NPS 2024 release).'},
    amen:{showers:true},
    fees:{nightlyMin:20, nightlyMax:30, note:'NPS release (effective May 24 2024): standard site $30, walk-in tent site $20. Confirm current rates.'},
    book:{system:'recreation.gov', url:null, phone:RGPHONE}, contact:{url:'https://nps.gov/cebr/learn/news/fee-increase-may-24-2024.htm'},
    caut:['High-elevation site: nights are cold even in summer.','Season, site count and phone were not read: check the park page.'],
    src:['https://nps.gov/cebr/learn/news/fee-increase-may-24-2024.htm']
  });
  K('ut-natural-bridges-campground', 'Natural Bridges Campground', 'Natural Bridges National Monument', NPS, 'San Juan', {
    types:['tent','rv'], book:{system:FCFS},
    contact:{url:'https://www.nps.gov/nabr/learn/news/news081621.htm'},
    caut:['An NPS 2021 release (archived) gave $15 a night, proposed $16 from 2022: not treated as current, check the park.','Site counts, season and phone not read.'],
    src:['https://www.nps.gov/nabr/learn/news/news081621.htm']
  });
  K('ut-hovenweep-campground', 'Hovenweep Campground', 'Hovenweep National Monument', NPS, 'San Juan', {
    types:['tent','rv'],
    contact:{url:'https://www.nps.gov/hove/learn/news/news081621.htm'},
    caut:['An NPS 2021 release (archived) gave $15 a night, proposed $20 from 2022: not treated as current, check the park.','Site counts, season and phone not read.'],
    src:['https://www.nps.gov/hove/learn/news/news081621.htm']
  });
  K('ut-green-river-campground-dinosaur', 'Green River Campground', 'Dinosaur National Monument', NPS, 'Uintah', {
    types:['tent','rv'],
    fees:{nightlyMin:24, nightlyMax:24, note:'NPS release (archived, from Jan 1 2025): $24 high season, half price with Senior or Access pass. Off-season shown as not applicable.'},
    book:{system:'recreation.gov', phone:RGPHONE},
    contact:{phone:'435-781-7700', url:'https://home.nps.gov/dino/planyourvisit/campgrounds.htm'},
    caut:['Generators 7 am to 9 pm only; check-out noon.','Site count and season not read; confirm with the monument.'],
    src:['https://www.nps.gov/dino/learn/news/2025campingfeeincrease.htm','https://home.nps.gov/dino/planyourvisit/campgrounds.htm']
  });
  K('ut-split-mountain-campground-dinosaur', 'Split Mountain Campground', 'Dinosaur National Monument', NPS, 'Uintah', {
    types:['group'], sites:{hookups:'none', hookupNote:'Four group sites, up to 25 people each.'},
    fees:{nightlyMin:12, nightlyMax:40, note:'NPS release (archived, from Jan 1 2025): group sites $40 in high season, $12 off season.'},
    book:{system:'recreation.gov', phone:RGPHONE, firstComeNote:'Group sites can be reserved on Recreation.gov.'},
    contact:{phone:'435-781-7700', url:'https://home.nps.gov/dino/planyourvisit/campgrounds.htm'},
    src:['https://www.nps.gov/dino/learn/news/2025campingfeeincrease.htm','https://home.nps.gov/dino/planyourvisit/campgrounds.htm']
  });
  K('ut-rainbow-park-campground-dinosaur', 'Rainbow Park Campground', 'Dinosaur National Monument', NPS, 'Uintah', {
    status:'limited', statusNote:'Closed for storm damage through April 1 2027 or until the road is repaired (Recreation.gov notice).',
    types:['tent'], sites:{total:4, hookups:'none', hookupNote:'Four tent-only sites; small RVs up to 15 ft and truck campers allowed.'},
    amen:{vault:true, water:false},
    fees:{nightlyMin:12, nightlyMax:12, note:'NPS release (archived, from Jan 1 2025): $12 a night.'},
    book:{system:'recreation.gov', url:'https://recreation.gov/camping/campgrounds/10199721', phone:RGPHONE},
    contact:{phone:'435-781-7700', url:'https://home.nps.gov/dino/planyourvisit/campgrounds.htm'},
    caut:['Unpaved road with no winter maintenance. No drinking water.'],
    src:['https://recreation.gov/camping/campgrounds/10199721','https://www.nps.gov/dino/learn/news/2025campingfeeincrease.htm']
  });
  K('ut-bullfrog-campground-glen-canyon', 'Bullfrog RV and Campground', 'Glen Canyon National Recreation Area', 'Concessionaire in Glen Canyon NRA', 'Garfield', {
    types:['rv','tent'], sites:{total:78},
    book:{system:'other', firstComeNote:'Reservations are not accepted (visitutah.com).'},
    contact:{phone:'928-608-6200', url:'https://nps.gov/glca/planyourvisit/seasonalhours.htm'},
    caut:['Facility status can change with lake levels: the NPS hours page lists Bullfrog as open or closed until further notice. Phone is the park line.'],
    src:['https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping','https://nps.gov/glca/planyourvisit/seasonalhours.htm']
  });
  K('ut-halls-crossing-campground-glen-canyon', 'Halls Crossing RV and Campground', 'Glen Canyon National Recreation Area', 'Concessionaire in Glen Canyon NRA', 'San Juan', {
    types:['rv','tent'], sites:{total:73, rv:32, tent:41, hookupNote:'32 pull-through RV spaces and 41 primitive campsites.'},
    book:{system:'other', firstComeNote:'Campsites first come; RV spaces can be booked online (visitutah.com).'},
    contact:{phone:'928-608-6200', url:'https://nps.gov/glca/planyourvisit/seasonalhours.htm'},
    caut:['Lake levels affect services; phone is the park line.'],
    src:['https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping']
  });
  K('ut-stanton-creek-glen-canyon', 'Stanton Creek Primitive Camping', 'Glen Canyon National Recreation Area', NPS, 'San Juan', {
    types:['tent'], sites:{hookups:'none', hookupNote:'No designated sites.'},
    book:{system:FCFS, firstComeNote:'Reservations are not accepted.'},
    contact:{phone:'928-608-6200', url:'https://nps.gov/glca/planyourvisit/seasonalhours.htm'},
    caut:['Primitive shoreline camping: a portable toilet is required unless one is within 200 yards.'],
    src:['https://www.visitutah.com/Places-To-Go/Parks-Outdoors/Glen-Canyon-Lake-Powell/Lake-Powell-Camping']
  });

  /* ================= NATIONAL FORESTS ================= */
  var DIXIEPHONE = '801-226-3564';
  K('ut-navajo-lake-campground', 'Navajo Lake Campground', 'Dixie National Forest', USFS, 'Kane', {
    types:['tent','rv'], sites:{total:27, hookups:'none', hookupNote:'15 single sites, 1 double, 11 walk-in tent-only sites.'},
    amen:{flush:true, vault:true, water:true, firepit:true, ada:true}, fam:{boating:true, fishing:true},
    book:RG('https://www.recreation.gov/camping/campgrounds/273822'),
    contact:{phone:DIXIEPHONE, url:'https://www.recreation.gov/camping/campgrounds/273822'},
    caut:['Primitive dirt boat landing.','Rate and season not on the page we read.'],
    src:['https://www.recreation.gov/camping/campgrounds/273822?tab=info','https://www.utah.gov/pmn/files/1063209.pdf']
  });
  K('ut-spruces-campground-dixie', 'Spruces Campground (Navajo Lake)', 'Dixie National Forest', USFS, 'Kane', {
    types:['tent','rv'], sites:{total:23, hookups:'none'},
    amen:{vault:true, water:true, firepit:true}, fam:{boating:true, fishing:true},
    book:RG('https://www.recreation.gov/camping/campgrounds/273759'),
    contact:{phone:DIXIEPHONE, url:'https://www.fs.usda.gov/r04/dixie/recreation/spruces-campground'},
    hi:['On the shore of Navajo Lake, about 25 miles east of Cedar City on SR 14 then 7 miles south'],
    caut:['Check-in 2 pm, check-out 11 am. Rate and season not on the page.'],
    src:['https://www.recreation.gov/camping/campgrounds/273759']
  });
  K('ut-te-ah-campground-dixie', 'Te-Ah Campground', 'Dixie National Forest', USFS, 'Kane', {
    elev:9200, types:['tent','rv','group'], sites:{total:42, hookups:'none', hookupNote:'41 single sites plus one group site (#33, up to 20 people).'},
    amen:{flush:true, vault:true, water:true, firepit:true, pets:'limited'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232110'),
    contact:{phone:DIXIEPHONE, url:'https://www.recreation.gov/camping/campgrounds/232110'},
    hi:['Aspen forest at 9,200 ft','Bike wash and racks'], caut:['OHVs and ATVs not allowed. Rate and season not on the page.'],
    src:['https://www.recreation.gov/camping/campgrounds/232110']
  });
  K('ut-soapstone-campground', 'Soapstone Campground', 'Uinta-Wasatch-Cache National Forest (Mirror Lake Scenic Byway)', USFS, 'Wasatch', {
    elev:8200, types:['tent','rv'], sites:{total:33, hookups:'none', hookupNote:'23 standard, 7 tent-only and 3 RV sites, all non-electric; RV hookups prohibited.'},
    amen:{vault:true, water:false, firepit:true}, fam:{kidNote:'Good moose viewing (forest-camping guide).'},
    fees:{nightlyMin:28, nightlyMax:28, extraVehicle:10, note:'$28 from a Recreation.gov-based listing (forestcamping.com); the Recreation.gov page gave extra vehicle $10 and firewood $9.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/231944'),
    contact:{phone:'435-783-4338', url:'https://www.recreation.gov/camping/campgrounds/231944'},
    caut:['No water on site. Gates 7 am to 10 pm.'],
    src:['https://www.recreation.gov/camping/campgrounds/231944','https://www.forestcamping.com/dow/intermtn/wasinfo.htm']
  });
  K('ut-mirror-lake-campground', 'Mirror Lake Campground', 'Uinta-Wasatch-Cache National Forest (Mirror Lake Scenic Byway)', USFS, null, {
    types:['tent','rv'], fees:{nightlyMin:28, nightlyMax:28, note:'$28 from a Recreation.gov-based listing (forestcamping.com), not read on the agency page.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/233730'),
    contact:{phone:'435-783-4338', url:'https://www.recreation.gov/camping/campgrounds/233730'},
    hi:['Separate equestrian and non-equestrian loops','Highline Trail access'],
    src:['https://www.forestcamping.com/dow/intermtn/wasinfo.htm','https://www.recreation.gov/gateways/1035']
  });
  K('ut-moosehorn-campground', 'Moosehorn Campground', 'Uinta-Wasatch-Cache National Forest (Mirror Lake Scenic Byway)', USFS, null, {
    types:['tent','rv'], fees:{nightlyMin:28, nightlyMax:28, note:'$28 from a Recreation.gov-based listing (forestcamping.com), not read on the agency page.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/231941'),
    contact:{phone:'435-783-4338', url:'https://www.recreation.gov/camping/campgrounds/231941'},
    hi:['Across the road from the Fehr Lake trail'],
    src:['https://www.forestcamping.com/dow/intermtn/wasinfo.htm','https://www.recreation.gov/gateways/1035']
  });
  K('ut-albion-basin-campground', 'Albion Basin Campground', 'Uinta-Wasatch-Cache National Forest (Little Cottonwood Canyon)', USFS, 'Salt Lake', {
    elev:9500, types:['tent','rv'], status:'seasonal', season:{note:'Opening date depends on snow melt.'},
    sites:{total:25, hookups:'none', hookupNote:'24 reservable sites (22 single, one double, one triple) plus first-come site #2.'},
    amen:{vault:true, firepit:true},
    fees:{nightlyMin:28, nightlyMax:28, extraVehicle:10, note:'USFS list (status as of June 2024): single site $28, double $56, triple $80.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232010'),
    contact:{phone:'801-999-2103', url:'https://www.recreation.gov/camping/campgrounds/232010'},
    hi:['Wildflower meadows at 9,500 ft'], caut:['Steep winding road not recommended for large RVs.','Spring water is limited.'],
    src:['https://www.recreation.gov/camping/campgrounds/232010',UWCFEES,'https://www.forestcamping.com/dow/intermtn/wasinfo.htm']
  });
  K('ut-tanners-flat-campground', 'Tanners Flat Campground', 'Uinta-Wasatch-Cache National Forest (Little Cottonwood Canyon)', USFS, 'Salt Lake', {
    types:['tent','rv','group'], sites:{total:38, hookups:'none'},
    fees:{nightlyMin:28, nightlyMax:28, note:'USFS list (status as of June 2024): single $28, double $56, group $121 to $203. Only the west wing was open that day.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232109'), contact:{url:'https://www.recreation.gov/camping/campgrounds/232109'},
    src:[UWCFEES]
  });
  K('ut-spruces-campground-big-cottonwood', 'Spruces Campground (Big Cottonwood Canyon)', 'Uinta-Wasatch-Cache National Forest', USFS, 'Salt Lake', {
    types:['tent','rv','group'], sites:{total:99, hookups:'none'},
    fam:{playground:false, kidNote:'Stream-side sites, ball field, volleyball and horseshoe pits (forest-camping guide).'},
    fees:{nightlyMin:28, nightlyMax:28, note:'USFS list (status as of June 2024): single $28, double $56, triple $78; glamping $99.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232103'), contact:{url:'https://www.recreation.gov/camping/campgrounds/232103'},
    src:[UWCFEES,'https://www.forestcamping.com/dow/intermtn/wasinfo.htm']
  });
  K('ut-redman-campground', 'Redman Campground', 'Uinta-Wasatch-Cache National Forest (Big Cottonwood Canyon)', USFS, 'Salt Lake', {
    types:['tent','rv','group'], sites:{total:41, hookups:'none'},
    fees:{nightlyMin:28, nightlyMax:28, note:'USFS list (status as of June 2024): single $28, double $56, triple $80. It was closed that day: check status.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232089'), contact:{url:'https://www.recreation.gov/camping/campgrounds/232089'},
    src:[UWCFEES]
  });
  K('ut-granite-flat-campground', 'Granite Flat Campground', 'Uinta-Wasatch-Cache National Forest (American Fork Canyon)', USFS, 'Utah', {
    elev:6400, types:['tent','rv','group'], status:'limited', statusNote:'Recreation.gov says closed for 2026, reopening about May 28 2027.',
    sites:{total:52, hookups:'none', hookupNote:'About 52 sites including 3 group sites; no electric hookups.'},
    amen:{vault:true, firepit:true, ada:true}, fam:{playground:false, kidNote:'Horseshoe pits and a grassy baseball field.'},
    fees:{extraVehicle:10, note:'Nightly rate not read; extra vehicle $10, firewood $9.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232230', {window:'2-night minimum on weekends, 3 on holiday weekends'}),
    contact:{phone:'801-785-3563', url:'https://www.recreation.gov/camping/campgrounds/232230'},
    src:['https://www.recreation.gov/camping/campgrounds/232230']
  });
  K('ut-mackinaw-campground-fish-lake', 'Mackinaw Campground (Fish Lake)', 'Fishlake National Forest', USFS, 'Sevier', {
    elev:9000, types:['tent','rv','group'], sites:{total:67, hookups:'none'},
    amen:{showers:true, flush:true, water:true, firepit:true}, fam:{fishing:true, boating:true},
    book:RG('https://www.recreation.gov/camping/campgrounds/231921'),
    contact:{phone:'435-836-2800', url:'https://www.recreation.gov/camping/campgrounds/231921'},
    caut:['Nearby resorts open Memorial Day to Labor Day. Rate not read.'],
    src:['https://www.recreation.gov/camping/campgrounds/231921','https://forestcamping.com/dow/intermtn/fishinfo.htm']
  });
  K('ut-doctor-creek-campground-fish-lake', 'Doctor Creek Campground (Fish Lake)', 'Fishlake National Forest', USFS, 'Sevier', {
    elev:9000, types:['tent','rv','group'], sites:{total:30, hookups:'none', hookupNote:'28 single sites plus 2 group sites; dump station at the entrance.'},
    amen:{flush:true, water:true, dump:true, firepit:true}, fam:{fishing:true, boating:true},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per a Recreation.gov list for the Fishlake NF.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/231919'),
    contact:{phone:'435-836-2800', url:'https://www.recreation.gov/camping/campgrounds/231919'},
    src:['https://www.recreation.gov/camping/campgrounds/231919','https://www.recreation.gov/gateways/1032']
  });
  K('ut-frying-pan-campground-fish-lake', 'Frying Pan Campground (Fish Lake)', 'Fishlake National Forest', USFS, 'Sevier', {
    elev:9000, types:['tent','rv','group'], sites:{total:11, hookups:'none', hookupNote:'10 single sites and 1 group site (up to 100 people).'},
    amen:{flush:true, water:true, firepit:true}, fam:{fishing:true},
    fees:{nightlyMin:25, nightlyMax:25, note:'$25 per a Recreation.gov list for the Fishlake NF.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/231920'),
    contact:{phone:'435-836-2811', url:'https://www.recreation.gov/camping/campgrounds/231920'},
    caut:['Camping limited to 16 days.'],
    src:['https://www.recreation.gov/camping/campgrounds/231920','https://www.recreation.gov/gateways/1032']
  });
  K('ut-warner-lake-campground', 'Warner Lake Campground', 'Manti-La Sal National Forest (La Sal Mountains)', USFS, 'Grand', {
    lat:38.51996, lon:-109.2766, elev:9400, types:['tent','rv','group','cabin'], status:'seasonal',
    season:{note:'Reservable mid-June through September; first come early to mid-June (Forest Service page).'},
    sites:{total:19, hookups:'none', hookupNote:'19 campsites, a group area (50 people) and a cabin sleeping 4.'},
    amen:{vault:true, water:false, firepit:true},
    fees:{nightlyMin:20, nightlyMax:20, note:'USFS page: $20 single site, $50 group site, $50 cabin.'},
    book:RG('https://www.recreation.gov/camping/campgrounds/232404'),
    contact:{phone:'435-259-7155', url:'https://www.fs.usda.gov/r04/manti-lasal/recreation/warner-lake-campground'},
    caut:['No drinking water. 14-day stay limit.','Access road was affected by construction in 2024 and 2025.'],
    src:['https://www.fs.usda.gov/r04/manti-lasal/recreation/warner-lake-campground','https://www.recreation.gov/camping/campgrounds/232404?tab=info']
  });
  K('ut-oowah-lake-campground', 'Oowah Lake Campground', 'Manti-La Sal National Forest (La Sal Mountains)', USFS, null, {
    lat:38.5028, lon:-109.2724, elev:8800, types:['tent'], status:'seasonal', season:{note:'Depends on snow and snowmelt: call ahead.'},
    sites:{total:11, hookups:'none'}, amen:{vault:true, water:false}, fam:{fishing:true},
    fees:{nightlyMin:10, nightlyMax:10, note:'USFS page: $10 a night per unit.'},
    book:{system:FCFS, firstComeNote:'No reservations.'},
    contact:{phone:'435-259-7155', url:'https://www.fs.usda.gov/r04/manti-lasal/recreation/oowah-campground'},
    caut:['No potable water.'],
    src:['https://www.fs.usda.gov/r04/manti-lasal/recreation/oowah-campground']
  });
  K('ut-devils-canyon-campground', "Devil's Canyon Campground", 'Manti-La Sal National Forest (Monticello)', USFS, null, {
    elev:7100, types:['tent','rv'], sites:{total:42}, status:'seasonal', season:{open:'May 1', close:'Dec 31', note:'Weather permitting (forest-camping listing).'},
    fees:{nightlyMin:20, nightlyMax:20, note:'Listing price $20 (forestcamping.com); the page said entries were last updated between 2009 and 2025: confirm.'},
    contact:{url:'https://forestcamping.com/dow/intermtn/mantcmp.htm'},
    src:['https://forestcamping.com/dow/intermtn/mantcmp.htm']
  });
  K('ut-joes-valley-campground', "Joe's Valley Campground", 'Manti-La Sal National Forest', USFS, 'Emery', {
    elev:7100, types:['tent','rv'], sites:{total:48}, status:'seasonal', season:{open:'May 8', close:'Oct 7', note:'Dates from an older listing: confirm.'},
    fees:{nightlyMin:10, nightlyMax:18, note:'Listing price $10 single, $18 double (forestcamping.com); confirm.'},
    contact:{url:'https://forestcamping.com/dow/intermtn/mantcmp.htm'},
    src:['https://forestcamping.com/dow/intermtn/mantcmp.htm']
  });

  /* ================= FLAMING GORGE (Ashley NF) ================= */
  function FG(id, name, county, near, siteTxt, o){
    o = o || {};
    K(id, name, 'Flaming Gorge National Recreation Area (Ashley National Forest)', USFS, 'Daggett', {
      types:o.types||['tent','rv'], sites:{total:o.total===undefined?null:o.total, hookups:o.hook||'none', hookupNote:siteTxt},
      fam:{boating:o.boat||null, fishing:o.boat||null, nearTown:near},
      fees:{note:FGNOTE}, book:o.fc ? {system:FCFS, firstComeNote:'No reservations (visitutah.com listing).'} : RG('https://www.recreation.gov/'),
      contact:{url:o.url || FGNRA},
      hi:o.hi||[], caut:['Fees, season, and phone not read on the pages we could open: check the Ashley National Forest page.'],
      src:[FGLIST, FGNRA]
    });
  }
  FG('ut-antelope-flat-campground', 'Antelope Flat Campground', 'Daggett', 'Dutch John, UT (about 10 mi NW)', '46 basic sites and 4 group sites (50 to 80 people). On the reservoir shore at about 6,000 ft.', {total:50, types:['tent','rv','group'], boat:true, url:'https://www.fs.usda.gov/r04/ashley/recreation/antelope-flat-campground'});
  FG('ut-lucerne-valley-campground', 'Lucerne Valley Campground', 'Daggett', 'Manila, UT (about 8 mi E)', '44 basic sites, 90 electric sites and 4 group sites (up to 80 people).', {total:138, types:['tent','rv','group'], hook:'electric', boat:true});
  FG('ut-dripping-springs-campground', 'Dripping Springs Campground', 'Daggett', 'Dutch John, UT (about 2 mi SE)', '21 basic, 1 double and 4 group sites (up to 60 people).', {total:26, types:['tent','rv','group']});
  FG('ut-mustang-ridge-campground', 'Mustang Ridge Campground', 'Daggett', 'Dutch John, UT (about 4 mi W)', '73 basic sites and 1 group site (up to 50 people).', {total:74, types:['tent','rv','group'], boat:true});
  FG('ut-firefighters-memorial-campground', 'Firefighters Memorial Campground', 'Daggett', 'Dutch John, UT (about 6 mi SW)', '94 basic sites.', {total:94, boat:true});
  FG('ut-skull-creek-campground', 'Skull Creek Campground', 'Daggett', 'Dutch John, UT (about 12 mi SW)', '17 basic sites.', {total:17});
  FG('ut-canyon-rim-campground', 'Canyon Rim Campground', 'Daggett', 'Dutch John, UT (about 14 mi SW)', '7 basic sites and 9 tent-only sites.', {total:16});
  FG('ut-red-canyon-campground-flaming-gorge', 'Red Canyon Campground', 'Daggett', 'Dutch John, UT (about 15 mi SW)', '8 basic sites.', {total:8});
  FG('ut-carmel-campground', 'Carmel Campground', 'Daggett', 'Manila, UT (about 7 mi S)', '15 basic sites. No reservations.', {total:15, fc:true, boat:true});
  FG('ut-willows-manns-campground', "Willows and Mann's Campgrounds", 'Daggett', 'Manila, UT (about 7 mi S)', '17 basic sites (9 Willows, 8 Mann\'s). No reservations.', {total:17, fc:true, boat:true});

  /* ================= BLM MOAB AREA ================= */
  function BM(id, name, total, ft, note, o){
    o = o || {};
    K(id, name, 'BLM Moab Field Office', BLM, 'Grand', {
      lat:o.lat===undefined?null:o.lat, lon:o.lon===undefined?null:o.lon, types:o.types||['tent','rv'],
      sites:{total:total, maxRvFt:ft, hookups:'none', hookupNote:note},
      amen:{vault:true, water:false, firepit:true, pets:'limited'},
      fees: o.fee===null ? {note:'Individual-site rate not read: check Recreation.gov.'} : {nightlyMin:o.fee||20, nightlyMax:o.fee||20, note:'BLM Moab visitor guide: $20 a night (Horsethief $25). Cash or card varies by campground.'},
      book:{system:FCFS, phone:BLMPHONE, firstComeNote:o.book||'First come, first served.'},
      contact:{phone:BLMPHONE, url:o.url || BLMGUIDE},
      caut:['No drinking water at BLM campgrounds. Stay limit 14 days in any 30.'].concat(o.caut||[]),
      src:[BLMGUIDE].concat(o.src||[])
    });
  }
  BM('ut-goose-island-campground', 'Goose Island Campground', 19, 40, 'Vault toilets, fire rings, tables; 2 group sites; card payment on site.');
  BM('ut-sand-flats-recreation-area-campgrounds', 'Sand Flats Recreation Area Campgrounds', 140, 34, 'Gravel road; 6 group sites. BLM guide lists $20; an archived 2015 release gave $15, so trust the newer guide.', {src:['https://www.blm.gov/press-release/some-fees-increase-sand-flats-recreation-area']});
  BM('ut-ledge-campgrounds', 'The Ledge Campgrounds', 98, 30, 'Five loops (A to E) on a gravel road; BLM page says 105 individual sites, guide says 98.', {lat:38.480648, lon:-109.602914, url:'https://blm.gov/visit/ledge-campground', src:['https://blm.gov/visit/ledge-campground'], caut:['Last 4+ miles of gravel with wash crossings and a steep switchback. Cash or check only per the BLM page.']});
  BM('ut-big-bend-campground', 'Big Bend Campground', 33, 40, '3 group sites; card payment on site.');
  BM('ut-grandstaff-campground', 'Grandstaff Campground', 16, 24, 'No trailers; 3 group sites.');
  BM('ut-hittle-bottom-campground', 'Hittle Bottom Campground', 15, 40, '1 group site; card payment on site.');
  BM('ut-horsethief-campground', 'Horsethief Campground', 83, 40, '5 group sites; card payment on site.', {fee:25});
  BM('ut-williams-bottom-campground', 'Williams Bottom Campground', 17, 24, 'Card payment on site.');
  BM('ut-kens-lake-campground', "Ken's Lake Campground", 48, 40, 'Loop A is reservation only; group site A reservable.', {book:'Loop A by reservation on Recreation.gov; other sites first come.', fee:null, src:['https://www.discovermoab.com/blm-campgrounds'], caut:['Individual-site fee not listed on the pages we read.']});
  BM('ut-windwhistle-campground', 'Windwhistle Campground', 15, null, 'No trailers; 1 group site.');
  BM('ut-lower-onion-creek-campground', 'Lower Onion Creek Campground', 19, 24, 'Gravel road; 4 group sites.');
})();
