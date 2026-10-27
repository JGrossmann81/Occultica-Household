/* Campica data pack: Northeast US (ME, NH, VT, MA, CT, RI, NY, PA, MD). Facts only from pages listed in SOURCES-camps-northeast.md.
   null = NOT verified: the UI must say "check with the source" and show the official link. NO coordinates were sourced
   (lat/lon null throughout). Counties are general reference knowledge, not read from a fetched page. */
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
  function R(url, extra){ return mix({system:RG, url:url, phone:RGPHONE}, extra); }

  var ME='Maine Bureau of Parks and Lands', NH='New Hampshire State Parks', VT='Vermont State Parks', MA='Massachusetts DCR', CT='Connecticut DEEP', RI='Rhode Island DEM', NYD='New York State DEC', NYP='New York State Parks', PA='Pennsylvania DCNR', MD='Maryland Park Service', FS='USDA Forest Service';
  var USFS_FEES='https://www.fs.usda.gov/media/267608', RGFS=function(id){return 'https://www.recreation.gov/camping/campgrounds/'+id;};
  var ME_FEES='https://www.maine.gov/DACF/parks/camping/reservations/campground_fees.shtml';
  var MEB={system:'CampWithME', url:'https://www.campwithme.com', phone:null, window:null};
  var MEF='Maine resident / nonresident per site per night, before the $5 per night reservation fee and 9% lodging tax. The fee page is marked copyright 2021: confirm current rates before booking.';
  function me(id,n,cty,lo,hi,extra,o){ o=o||{}; K(id,n,n.replace(' Campground','')+' State Park',ME,'ME','northeast',cty,{
    status:'seasonal', types:o.types||['tent','rv'], sites:o.sites, fees:{nightlyMin:lo,nightlyMax:hi,note:MEF+(extra?' '+extra:'')}, book:MEB,
    contact:{url:'https://www.maine.gov/dacf/parks/'}, hi:o.hi||[], caut:o.caut||['Season dates were not on the fee page: check the park page.'], src:[ME_FEES,'https://www.maine.gov/dacf/parks/docs/fee-schedule.pdf']}); }
  me('me-camden-hills-state-park-campground','Camden Hills State Park Campground','Knox',25,45,'Residents $25 (hookup sites $35); nonresidents $35 (hookup sites $45). The page does not say which sites have hookups.',{sites:{hookups:'some'}});
  me('me-cobscook-bay-state-park-campground','Cobscook Bay State Park Campground','Washington',20,30,'Residents $20; nonresidents $30.');
  me('me-lamoine-state-park-campground','Lamoine State Park Campground','Hancock',20,30,'Residents $20; nonresidents $30.');
  me('me-sebago-lake-state-park-campground','Sebago Lake State Park Campground','Cumberland',25,45,'Residents $25 (hookup sites $35); nonresidents $35 (hookup sites $45).',{sites:{hookups:'some'}});
  me('me-bradbury-mountain-state-park-campground','Bradbury Mountain State Park Campground','Cumberland',15,25,'Residents $15; nonresidents $25.');
  me('me-lily-bay-state-park-campground','Lily Bay State Park Campground','Piscataquis',20,30,'Residents $20; nonresidents $30.');
  me('me-rangeley-lake-state-park-campground','Rangeley Lake State Park Campground','Franklin',20,40,'Residents $20 (hookup sites $30); nonresidents $30 (hookup sites $40).',{sites:{hookups:'some'}});
  me('me-warren-island-state-park-campground','Warren Island State Park Campground','Waldo',15,25,'Residents $15; nonresidents $25.',{types:['boat-in','tent'],caut:['Boat access: plan the crossing and check the park page for how to get there and the season.']});

  var NHB={system:'NH State Parks reservations', url:'https://www.nhstateparks.org', phone:'877-647-2757'};
  var NHG='https://www.nhstateparks.org/getmedia/ee509415-408a-4aa2-ba0d-5e4f0581c6b8/NH-Parks_Campground-Guide.pdf';
  function nh(id,n,parent,cty,total,types,note,o){ o=o||{}; K(id,n,parent,NH,'NH','northeast',cty,{
    status:'seasonal', sites:mix({total:total},o.sites), types:types, book:NHB, contact:{phone:null,url:'https://www.nhstateparks.org'},
    fees:{note:'Nightly rate not read: the NH campground guide lists none. Check nhstateparks.org or call 877-647-2757.'},
    fam:o.fam, amen:o.amen, hi:[note].concat(o.hi||[]), caut:['Season dates and rates are not in the guide: check nhstateparks.org before you go.'], src:[NHG]}); }
  nh('nh-lafayette-place-campground','Lafayette Place Campground','Franconia Notch State Park','Grafton',97,['tent','rv'],'97 wooded sites in Franconia, per the state campground guide.');
  nh('nh-dry-river-campground','Dry River Campground','Crawford Notch State Park','Carroll',38,['tent','rv','walk-in'],'38 sites including 6 walk-to sites, in Crawford Notch State Park.');
  nh('nh-pawtuckaway-state-park-campground','Pawtuckaway State Park Campground','Pawtuckaway State Park','Rockingham',193,['tent','rv','cabin'],'193 wooded sites in Nottingham, including 5 cabins, 1 walk-to site and 2 family group sites.');
  nh('nh-monadnock-gilson-pond-campground','Gilson Pond Campground','Monadnock State Park','Cheshire',40,['tent','rv'],'40 sites in Jaffrey for tents or pop-ups; 4 hookup sites and 5 remote walk-to sites; the headquarters campground is open year-round.',{sites:{hookups:'some'}});
  nh('nh-bear-brook-state-park-campground','Bear Brook State Park Campground','Bear Brook State Park','Merrimack',101,['tent','rv'],'101 wooded sites in Allenstown, on Beaver Pond.');
  nh('nh-white-lake-state-park-campground','White Lake State Park Campground','White Lake State Park','Carroll',202,['tent','rv'],'202 sites in Tamworth including 2 family group sites, with a beach on White Lake.',{fam:{beach:true,swim:true,kidNote:'Beach on White Lake, per the state guide.'}});

  var WM='https://www.fs.usda.gov/media/267608';
  K('nh-dolly-copp-campground','Dolly Copp Campground','White Mountain National Forest',FS,'NH','northeast','Coos',{
    status:'seasonal', season:{open:'Mid-May', close:'Mid-October', note:'From an undated Forest Service fee sheet: confirm dates.'}, types:['tent','rv'],
    sites:{total:null, hookups:'some', hookupNote:'Recreation.gov lists 168 available sites and 30/50-amp hookups on some; the Forest Service sheet lists hookup sites at +$14.'},
    amen:{showers:true, flush:true, water:true, pets:'limited'},
    fam:{rangerPrograms:true, easyTrails:true, fishing:true, kidNote:'Largest campground in the White Mountain NF, about 6 miles south of Gorham. Educational programs on summer weekends.'},
    fees:{nightlyMin:30, nightlyMax:44, note:'$30 per night, plus $14 for sites with water/electric hookups (Forest Service fee sheet, undated). Coin showers $3 for 7 minutes.'},
    book:R(RGFS(232173)), contact:{phone:null, url:'https://www.fs.usda.gov/r09/whitemountain'},
    hi:['Largest White Mountains campground','Brook trout fishing in the creek and river'], caut:['Two leashed dogs per site; use bear-aware food storage; do not move firewood.','Recreation.gov showed two different phone numbers, so none is given here: use the Recreation.gov page.'],
    src:[WM,RGFS(232173)]});
  K('nh-russell-pond-campground','Russell Pond Campground','White Mountain National Forest',FS,'NH','northeast','Grafton',{
    status:'seasonal', season:{open:'Mid-May', close:'Mid-October', note:'From an undated Forest Service fee sheet: confirm dates.'}, types:['tent','rv'],
    sites:{total:84}, amen:{showers:true, flush:true, water:true, pets:'limited'},
    fam:{swim:true, beach:true, boating:true, fishing:true, rangerPrograms:true, kidNote:'Beach and boat ramp on the pond (day-use fee $6, or $66 per year); no power boats. Free nature programs on summer Saturday evenings.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (Forest Service fee sheet, undated).'},
    book:R(RGFS(273778)), contact:{phone:null, url:'https://www.fs.usda.gov/r09/whitemountain'},
    hi:['Pond with beach, dock and boat ramp','Amphitheater programs'], caut:['Reached from I-93 Exit 31 (Tripoli Road), then about 2 miles east.'],
    src:[WM,RGFS(273778)]});
  K('nh-passaconaway-campground','Passaconaway Campground','White Mountain National Forest',FS,'NH','northeast','Carroll',{
    status:'seasonal', season:{open:'Mid-May', close:'Mid-October', note:'From an undated Forest Service fee sheet: confirm dates.'}, types:['tent','rv'],
    amen:{vault:true, pets:'limited'}, fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night (Forest Service fee sheet, undated).'},
    book:{system:null, url:RGFS(232394), phone:null, firstComeNote:'First come, first served: reservations not accepted per the fee sheet.'}, contact:{url:'https://www.fs.usda.gov/r09/whitemountain'},
    hi:['Vault toilets, near the Russell-Colbath Homestead'], caut:['First come, first served: arrive early on summer weekends.'], src:[WM]});
  K('nh-campton-campground','Campton Campground','White Mountain National Forest',FS,'NH','northeast','Grafton',{
    status:'seasonal', season:{open:'Mid-May', close:'Mid-October', note:'From an undated Forest Service fee sheet: confirm dates.'}, types:['tent','rv'],
    amen:{flush:true, showers:true, water:true, pets:'limited'}, fam:{playground:true, kidNote:'Play area and family area listed on the fee sheet.'},
    fees:{nightlyMin:30, nightlyMax:30, note:'$30 per night; coin showers $3 for 7 minutes (Forest Service fee sheet, undated).'},
    book:R('https://www.recreation.gov/gateways/1087'), contact:{url:'https://www.fs.usda.gov/r09/whitemountain'}, hi:['Flush toilets, showers and a play area'], caut:[], src:[WM]});

  var VTB={system:'Vermont State Parks reservations', url:'https://vtstateparks.com', phone:null};
  var VTF='https://vtstateparks.com/fees', VTA='https://VTSTATEPARKS.COM/assets/pdf/amenities_camp.pdf';
  function vt(id,n,cty,lean,o){ o=o||{}; K(id,n+' Campground',n+' State Park',VT,'VT','northeast',cty,{status:'seasonal',types:o.types||['tent','rv','lean-to'],book:VTB,contact:{url:'https://vtstateparks.com'},
    fees:o.fees||{nightlyMin:20,nightlyMax:38,note:'Statewide base rates (fee page effective July 1, 2025): tent/RV site $20 resident, $38 nonresident; lean-to $30 / $49; up to 4 people, $8 per extra person, $3 per pet per night, $8 non-refundable reservation fee per site. The page lists no park-specific rate for this park.'},
    hi:o.hi||[], caut:['Season dates and site counts are not confirmed here: the park amenities table could not be read column by column. Check vtstateparks.com.'], fam:o.fam, src:[VTF,VTA]}); }
  vt('vt-smugglers-notch-campground','Smugglers\' Notch','Lamoille');
  vt('vt-elmore-campground','Elmore','Lamoille');
  vt('vt-grand-isle-campground','Grand Isle','Grand Isle',0,{hi:['Cabins available (statewide cabin rate $60 resident, $85 nonresident)']});
  vt('vt-burton-island-campground','Burton Island','Franklin',0,{types:['boat-in','lean-to','cabin'],hi:['Island park: lean-tos $40 resident / $60 nonresident, cabins $73 / $85'],
    fees:{nightlyMin:40,nightlyMax:60,note:'Burton Island lean-tos $40 resident, $60 nonresident; cabins $73 / $85 (fee page effective July 1, 2025). No separate tent rate was listed.'}});
  vt('vt-little-river-campground','Little River','Washington');
  K('vt-hapgood-pond-campground','Hapgood Pond Campground','Green Mountain National Forest',FS,'VT','northeast','Bennington',{
    status:'seasonal', types:['tent','rv'], sites:{total:28}, amen:{vault:true, water:true},
    fam:{swim:true, beach:true, fishing:true, boating:true, playground:null, kidNote:'Swim beach, fishing pier and carry-down canoe/kayak launch listed on Recreation.gov.'},
    book:R(RGFS(232393),{firstComeNote:'Sites 9-28 reservable; the rest first come, first served.'}), contact:{url:'https://www.fs.usda.gov/r09/gmfl'},
    fees:{note:'Nightly rate not verified on a current page: check Recreation.gov.'}, hi:['Swim beach and fishing pier on the pond'], caut:['Fee and season were not on the Recreation.gov page.'], src:[RGFS(232393)]});

  var MAB={system:'ReserveAmerica', url:'https://www.reserveamerica.com', phone:'877-620-2267', cancelNote:'$4.50 non-refundable transaction charge; changes and cancellations $10; sites held until 8 am the day after arrival.'};
  var MAF='https://www.mass.gov/info-details/camping-fees';
  function ma(id,n,parent,cty,lo,hi,note,o){ o=o||{}; K(id,n,parent,MA,'MA','northeast',cty,{status:'seasonal',types:o.types||['tent','rv'],book:MAB,contact:{url:'https://www.mass.gov/orgs/department-of-conservation-and-recreation'},
    fees:{nightlyMin:lo,nightlyMax:hi,note:note}, hi:o.hi||[], caut:['Season dates not read: check the DCR page. Firewood is sold at the park (credit card).'], src:[MAF]}); }
  ma('ma-nickerson-state-park-campground','Nickerson State Park Campground','Nickerson State Park','Barnstable',22,75,'Basic site $22 for Massachusetts residents, $70 for out-of-state, plus a $5 trust surcharge for non-residents. Yurts $45 to $55 (resident) and $120 to $140 (out-of-state).',{hi:['Cape Cod state park campground with yurts']});
  ma('ma-wells-state-park-campground','Wells State Park Campground','Wells State Park','Worcester',17,54,'Basic site $17 for Massachusetts residents, $54 out-of-state. Yurts $45 to $55 / $120 to $140.');
  ma('ma-salisbury-beach-campground','Salisbury Beach State Reservation Campground','Salisbury Beach State Reservation','Essex',22,73,'Basic site $22 resident, $70 out-of-state; add $4 for water and $6 for electric; $3 trust surcharge. Max shown is out-of-state plus surcharge before add-ons.',{hi:['Coastal campground']});
  ma('ma-mount-greylock-campground','Mount Greylock State Reservation Primitive Camping','Mount Greylock State Reservation','Berkshire',8,20,'Primitive sites $8 for Massachusetts residents, $20 out-of-state.',{types:['tent']});

  var CTB={system:'ReserveAmerica', url:'https://www.reserveamerica.com', phone:'877-668-2267', window:'Most CT campgrounds take bookings up to 11 months ahead (2019 brochure).'};
  var CTP='https://Portal.CT.gov/-/media/deep/stateparks/camping/campingbrochurepdf.pdf';
  function ct(id,n,cty,total,lo,hi,phone,note){ K(id,n+' Campground',n,CT,'CT','northeast',cty,{status:'seasonal',types:['tent','rv'],sites:{total:total},book:CTB,contact:{phone:phone,url:'https://portal.ct.gov/deep/state-parks'},
    fees:{nightlyMin:lo,nightlyMax:hi,note:note+' From the 2019 DEEP camping brochure, the only fee table found: rates may have changed.'},
    hi:[total+' sites'], caut:['Fees and season come from a 2019 brochure: confirm on the DEEP site or by phone.'], src:[CTP]}); }
  ct('ct-hammonasset-beach-campground','Hammonasset Beach State Park','New Haven',558,20,45,'203-245-1817','CT residents $20, non-residents $30; electric/water sites $35 / $45.');
  ct('ct-rocky-neck-campground','Rocky Neck State Park','New London',160,20,30,'860-739-1339','CT residents $20, non-residents $30.');
  ct('ct-black-rock-campground','Black Rock State Park','Litchfield',78,17,27,'860-283-8088','CT residents $17, non-residents $27.');
  ct('ct-housatonic-meadows-campground','Housatonic Meadows State Park','Litchfield',61,17,27,'860-672-6772','CT residents $17, non-residents $27.');

  var RIB={system:'ReserveAmerica', url:'https://riparks.ri.gov/campgrounds', phone:'877-742-2677'};
  var RIP='https://www.visitrhodeisland.com/hotels-more/campgrounds/camping-at-state-parks/';
  K('ri-burlingame-state-park-campground','Burlingame State Park Campground','Burlingame State Park',RI,'RI','northeast','Washington',{status:'seasonal',types:['tent','rv'],book:RIB,contact:{phone:'877-742-2677',url:'https://riparks.ri.gov/campgrounds'},
    fam:{swim:null,kidNote:'On the shore of Watchaug Pond. The state says the campground beach is closed in 2026 and fewer sites are reservable during construction (expected done April 2027).'},
    hi:['Camping on Watchaug Pond'], caut:['2026 construction: fewer sites available and the campground beach is closed.','Site count, fees and season were not on the pages read.'], src:[RIP,'https://riparks.ri.gov/press-releases/wait-over-burlingame-state-campground-opens-season']});
  K('ri-ninigret-east-beach-campground','East Beach / Ninigret Conservation Area Campground','Ninigret Conservation Area',RI,'RI','northeast','Washington',{status:'seasonal',types:['tent'],sites:{total:20},book:RIB,contact:{phone:'877-742-2677',url:'https://riparks.ri.gov/campgrounds'},
    amen:{vault:null}, hi:['Barrier-beach campground with 20 sites','Composting toilets (four)'], caut:['Fees and season not on the page read.'], src:[RIP]});
  K('ri-fishermens-memorial-campground','Fishermen\'s Memorial State Park Campground','Fishermen\'s Memorial State Park',RI,'RI','northeast','Washington',{status:'seasonal',types:['tent','rv'],book:RIB,contact:{phone:'877-742-2677',url:'https://riparks.ri.gov/campgrounds'},
    hi:['Near state beaches and the Block Island ferry dock'], caut:['Site count, fees and season not on the page read.'], src:[RIP]});

  var DEC='https://www.dec.ny.gov/outdoor/7820.html', NYG='https://assets.simpleviewinc.com/simpleview/image/upload/v1/clients/newyorkstate/Parks_New_York_State_Camping_Guide_2023_14bd8276-60ff-4a31-80d6-40f301e701b7.pdf';
  var DECB={system:'NY DEC camping reservations', url:'https://dec.ny.gov/things-to-do/camping/reservations', phone:null};
  function dec(id,n,cty,fee,open,close,total,phone,o){ o=o||{}; K(id,n+' Campground',n+' (NY DEC)',NYD,'NY','northeast',cty,{status:'seasonal',season:{open:open,close:close,note:'2026 season per the DEC schedule.'},
    types:['tent','rv'],sites:{total:total},book:DECB,contact:{phone:phone,url:'https://dec.ny.gov/places'},
    fees:{nightlyMin:fee,nightlyMax:fee+5,note:'$'+fee+' per night for New York residents; non-residents pay $5 more per night (DEC 2026 schedule). Reservation fee not stated.'},
    fam:o.fam, hi:o.hi||[total+' sites (2023 NY camping guide count)'], caut:['Phone and site count come from a 2023 state camping guide: confirm with DEC.'], src:[DEC,NYG]}); }
  dec('ny-fish-creek-pond','Fish Creek Pond','Franklin',22,'May 8','Oct 12',355,'518-891-4560');
  dec('ny-rollins-pond','Rollins Pond','Franklin',20,'May 15','Sept 13',287,'518-891-3239');
  dec('ny-meacham-lake','Meacham Lake','Franklin',20,'May 15','Oct 12',219,'518-483-5116');
  dec('ny-rogers-rock','Rogers Rock','Warren',22,'May 15','Sept 7',332,'518-585-6746',{hi:['Lake George shore campground (332 sites)']});
  dec('ny-lake-george-battleground','Lake George Battleground','Warren',22,'May 15','Oct 12',68,'518-668-3348');
  dec('ny-hearthstone-point','Hearthstone Point','Warren',22,'May 15','Sept 13',249,'518-668-5193');
  dec('ny-ausable-point','Ausable Point','Clinton',22,'May 15','Oct 12',123,'518-561-7080');
  dec('ny-north-south-lake','North-South Lake','Greene',22,'May 15','Oct 25',218,'518-589-5058',{hi:['Catskills campground (218 sites), open latest of the DEC list this year']});
  dec('ny-beaverkill','Beaverkill','Sullivan',20,'May 15','Sept 7',52,'845-439-4281');
  dec('ny-kenneth-l-wilson','Kenneth L. Wilson','Ulster',22,'May 15','Oct 12',76,'845-679-7020');

  function nyp(id,n,cty,total,phone,note,o){ o=o||{}; K(id,n+' Campground',n,NYP,'NY','northeast',cty,{status:'seasonal',types:o.types||['tent','rv','cabin'],sites:{total:total},book:{system:'ReserveAmerica',url:'https://newyorkstateparks.reserveamerica.com',phone:null},contact:{phone:phone,url:'https://parks.ny.gov'},
    fam:o.fam, hi:[note], caut:['Counts and phone from a 2023 guide. The guide gives a $15 statewide base rate, $5 more per night for non-residents, $7.25 reservation fee, but no park-specific rate: check the park page.'],
    fees:{note:'Park-specific nightly rate not read. 2023 statewide guide: $15 base, +$5 per night out-of-state, $7.25 reservation fee.'}, src:[NYG]}); }
  nyp('ny-watkins-glen-campground','Watkins Glen State Park','Schuyler',288,'607-535-4511','288 sites incl. 54 electric, 10 rustic cabins, Olympic-size pool, gorge trail past 19 waterfalls.',{fam:{swim:true,easyTrails:null,kidNote:'Pool and kiddie pool; gorge trail with waterfalls.'}});
  nyp('ny-letchworth-campground','Letchworth State Park','Livingston',340,'585-493-3600','340 sites, cabins, swimming pool, playgrounds, Humphrey Nature Center.',{fam:{swim:true,playground:true,kidNote:'Pool, playgrounds and games area.'}});
  nyp('ny-allegany-campground','Allegany State Park','Cattaraugus',694,'716-354-9101','694 sites, cottages, cabins, sand beaches, playgrounds, boat rentals.',{fam:{swim:true,beach:true,playground:true,boating:true,kidNote:'Sand beaches, playgrounds and rowboat/paddleboat rentals.'}});
  nyp('ny-hither-hills-campground','Hither Hills State Park','Suffolk',176,'631-668-2554','176 oceanfront sites, hot showers, general store, playground; non-residents pay double the standard rate.',{types:['tent','rv'],fam:{beach:true,fishing:true,playground:true}});
  K('ny-fire-island-watch-hill-campground','Watch Hill Campground','Fire Island National Seashore',NPS,'NY','northeast','Suffolk',{status:'seasonal',types:['tent','walk-in','group'],sites:{total:27},
    amen:{water:true,showers:true,flush:true},book:{system:'ReserveAmerica',url:'https://www.nps.gov/fiis/planyourvisit/camping.htm',phone:null},contact:{phone:'631-515-5557',url:'https://www.nps.gov/fiis/planyourvisit/camping.htm'},
    hi:['Not reachable by car: seasonal ferry from Patchogue or private boat','27 sand sites (Wikipedia count) incl. one accessible and a group site'],
    caut:['Carry gear about 0.3 mile from the dock; ferry freight fees may apply to wagons.','Open ground fires are prohibited: bring a camp stove or use the grills.','Mosquitoes late June to October; ticks and poison ivy; little shade.'],
    fees:{note:'Fee not shown on the NPS page: see the booking link.'}, src:['https://www.nps.gov/fiis/planyourvisit/camping.htm','https://en.wikipedia.org/wiki/Watch_Hill_(New_York)']});

  var PAL='https://www.pa.gov/agencies/dcnr/recreation/what-to-do/stay-overnight/rv-and-tent-campsites/camping-locations-map';
  function pa(id,n,hi){ K(id,n+' Campground',n,PA,'PA','northeast',null,{status:'seasonal',types:['tent','rv'],book:{system:'PA DCNR reservations',url:'https://www.pa.gov/agencies/dcnr/recreation/what-to-do/stay-overnight/rv-and-tent-campsites',phone:null},contact:{url:PAL},
    hi:hi||[], caut:['Only the existence of the campground was confirmed (DCNR list). Site count, fees, season and phone were not read: check the park page.'], src:[PAL]}); }
  pa('pa-ricketts-glen-campground','Ricketts Glen State Park'); pa('pa-worlds-end-campground','Worlds End State Park');
  pa('pa-cherry-springs-campground','Cherry Springs State Park'); pa('pa-gifford-pinchot-campground','Gifford Pinchot State Park'); pa('pa-hickory-run-campground','Hickory Run State Park');
  K('pa-dingmans-campground-delaware-water-gap','Dingmans Campground','Delaware Water Gap National Recreation Area',NPS,'PA','northeast','Pike',{status:'seasonal',types:['tent','rv'],contact:{phone:'570-426-2452',url:'https://www.nps.gov/dewa/planyourvisit/index.htm'},
    hi:['Mainly tent camping with some RV sites'], caut:['Closed in winter. Sites, fees and season not read: check NPS.'], book:{system:null,url:'https://www.nps.gov/dewa/planyourvisit/eatingsleeping.htm',phone:null}, src:['https://npplan.com/parks-by-state/pennsylvania-national-parks/delaware-water-gap-national-recreation-area-park-at-a-glance/delaware-water-gap-national-recreation-area-camping/','https://www.nps.gov/dewa/planyourvisit/index.htm']});

  var MDR='https://dnr.maryland.gov/publiclands/Pages/oc.aspx';
  function md(id,n,cty,lo,hi,note){ K(id,n+' Campground',n,MD,'MD','northeast',cty,{status:'seasonal',types:['tent','rv'],book:{system:'Maryland Park Service reservations',url:MDR,phone:'888-432-2267'},contact:{url:'https://dnr.maryland.gov/publiclands'},
    fees:{nightlyMin:lo,nightlyMax:hi,note:note+' Base rates per night; transaction fees are extra (Maryland DNR rate table).'}, hi:[], caut:['Season, site counts and park phone not read: check dnr.maryland.gov.'], src:[MDR]}); }
  md('md-cunningham-falls-campground','Cunningham Falls State Park','Frederick',21.5,27.5,'Standard $21.50, electric $27.50.');
  md('md-deep-creek-lake-campground','Deep Creek Lake State Park','Garrett',21.5,27.5,'Standard $21.50, electric $27.50; Bear Den $36.75; yurt $53.');
  md('md-swallow-falls-campground','Swallow Falls State Park','Garrett',21.5,32.5,'Standard $21.50; electric/water $27.50; electric/water/sewer $32.50.');
  md('md-janes-island-campground','Janes Island State Park','Somerset',21.5,27.5,'Standard $21.50, electric $27.50.');
  md('md-rocky-gap-campground','Rocky Gap State Park','Allegany',21.5,27.5,'Standard $21.50, electric $27.50.');
  md('md-pocomoke-river-shad-landing-campground','Pocomoke River State Park (Shad Landing)','Worcester',21.5,27.5,'Standard $21.50, electric $27.50.');
})();
