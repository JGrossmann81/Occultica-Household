/* Campica data pack: Central / Sierra / foothill lakes / Central Coast top-up. Facts only from sources listed in SOURCES-camps-central2.md.
   Any field left null was not verified: the UI must say "check with the source". Season dates marked "typical" come from a listing
   that quoted 2026 dates; they are not guarantees. */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var NPS = 'National Park Service', USFS = 'US Forest Service', CSP = 'California State Parks';
  var SEKI_PH = '(559) 565-3341';
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
  function RG(id, ph, win){ return {system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/' + id, phone:ph || null, window:win || null}; }
  function RC(parkId, win){ return {system:'reservecalifornia', url:'https://www.reservecalifornia.com/park/' + parkId, phone:'(800) 444-7275', window:win || null}; }
  var BEAR22 = 'Vehicles over 22 ft are not advised on the Highway 198 road between Potwisha and Giant Forest; use the Highway 180 (Kings Canyon) entrance (NPS and Recreation.gov).';
  var CAMPFLARE_NOTE = ' Price and several details come from the Campflare listing (a third-party aggregator of Forest Service / Recreation.gov data); confirm on Recreation.gov.';

  /* ---------- Kings Canyon NP: Grant Grove ---------- */
  K('ca-azalea-kings-canyon','Azalea Campground','Kings Canyon National Park (Grant Grove)',NPS,'sequoia-kings','Fresno',36.743529,-118.965325,6500,{
    season:{note:'Open year-round: all 110 sites reservable roughly May to October; about 20 first-come sites on one loop in winter (Campflare). Confirm on Recreation.gov.'},
    status:'open', statusNote:'Winter use is limited to one first-come loop; tire chains may be required at any time (Recreation.gov).',
    types:['tent','rv'],
    sites:{total:110, maxRvFt:null, maxTrailerFt:null, hookups:'none', hookupNote:'Recreation.gov lists no electric sites. Length limit not stated by Recreation.gov (Campflare shows 51 ft); no pull-through sites per Campflare.'},
    amen:{showers:false, flush:true, water:true, dump:null, store:null, wifi:false, firepit:true, bearBox:true, pets:'limited', cell:'spotty'},
    fam:{nearTown:'Grant Grove Village (market, restaurant, visitor center)', kidNote:'Next to Grant Grove Village and the General Grant Tree trail area. Every site has a bear locker.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 standard NPS campsite fee (NPS campground page, read 2026-10). Changing or cancelling costs a $10 service fee (Recreation.gov).'},
    book:mix(RG('10124502','(559) 565-4357','Up to four months ahead (Campflare); confirm on Recreation.gov.'),{cancelNote:'$10 change/cancel fee; late cancellation also forfeits the first night; vacant 24 hours after arrival = cancelled (Recreation.gov).'}),
    contact:{phone:SEKI_PH, url:'https://www.recreation.gov/camping/campgrounds/10124502', address:'47050 Generals Highway, Three Rivers, CA 93271 (park mailing address)'},
    hi:['110 sites at about 6,500 ft near the General Grant Tree','Flush toilets and tap water; no showers','Open all year (limited in winter)'],
    caut:['Active bear area: all food, drinks, scented items and coolers go in the lockers day and night.', BEAR22, 'Pets: leash 6 ft or shorter, not allowed on park trails or more than 100 ft from roads/parking (Recreation.gov).'],
    src:['https://www.recreation.gov/camping/campgrounds/10124502?tab=info','https://campflare.com/campground/azalea-campground-502','https://www.nps.gov/seki/planyourvisit/campgrounds.htm']});

  K('ca-sunset-kings-canyon','Sunset Campground','Kings Canyon National Park (Grant Grove)',NPS,'sequoia-kings','Fresno',null,null,6500,{
    season:{note:'Season dates not stated on the pages read; check Recreation.gov.'},
    status:null, statusNote:'Season dates not stated on the NPS or Recreation.gov pages read.',
    types:['tent','rv','group'],
    sites:{total:149, hookups:'none', hookupNote:'Recreation.gov lists about 149 sites incl. two tent-only group areas (A, B) and RV non-electric sites; no electric hookups listed. RVs and trailers are not allowed in the group sites.'},
    amen:{flush:true, water:true, bearBox:true, pets:'limited', ada:true},
    fam:{nearTown:'Grant Grove Village', kidNote:'Across from Grant Grove Village; the one-mile General Grant Tree trail and Ella Falls are close.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 is the NPS standard campsite fee (NPS campground page, 2026-10); group site fees differ ($50 mid-sized, $60-$80 large per the same page). Recreation.gov did not list a nightly rate for this campground.'},
    book:mix(RG('234752','(559) 565-4357'),{cancelNote:'$10 service fee to change or cancel; group cancellations within 14 days also forfeit the first night (Recreation.gov).'}),
    contact:{phone:SEKI_PH, url:'https://www.nps.gov/seki/planyourvisit/sunset.htm', address:'47050 Generals Highway, Three Rivers, CA 93271 (park mailing address)'},
    hi:['About 149 sites at about 6,500 ft in Grant Grove','Flush toilets and potable water','Two accessible sites (#116 and #026) per Recreation.gov'],
    caut:['Active bear area; use the 47 x 33 x 28 in lockers for all food and scented items.', BEAR22, 'No verified coordinate: the campground is in the Grant Grove Village area.'],
    src:['https://www.recreation.gov/camping/campgrounds/234752','https://www.nps.gov/seki/planyourvisit/sunset.htm','https://www.nps.gov/seki/planyourvisit/campgrounds.htm']});

  K('ca-crystal-springs-kings-canyon','Crystal Springs Campground','Kings Canyon National Park (Grant Grove)',NPS,'sequoia-kings','Fresno',36.744675,-118.961786,6500,{
    season:{note:'Listing showed it closed for the season and reopening about May 20 (2026 dates, Campflare); check Recreation.gov for the current season.'},
    status:'seasonal', statusNote:'Seasonal; confirm opening and closing dates on Recreation.gov.',
    types:['tent','rv'],
    sites:{total:35, maxRvFt:41, maxTrailerFt:41, hookups:'none'},
    amen:{showers:false, flush:true, water:true, store:false, firepit:true, bearBox:true, pets:'limited', cell:'spotty'},
    fam:{nearTown:'Grant Grove Village', kidNote:'Smaller, quieter 35-site loop in Grant Grove.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 per Campflare listing, matching the NPS standard campsite fee.'},
    book:RG('10124445', null, 'Reservations through Recreation.gov (Campflare).'),
    contact:{phone:SEKI_PH, url:'https://www.recreation.gov/camping/campgrounds/10124445', address:'84073 Panoramic Dr, Hume, CA 93628 (Campflare)'},
    hi:['35 sites at about 6,500 ft','Flush toilets and tap water; no showers','Verizon signal reported'],
    caut:[BEAR22, 'Length limit (41 ft) is from Campflare; confirm before booking.'],
    src:['https://campflare.com/campground/10124445','https://www.recreation.gov/camping/campgrounds/10124445','https://www.nps.gov/seki/planyourvisit/campgrounds.htm']});

  /* ---------- Kings Canyon NP: Cedar Grove ---------- */
  var CG_SRC = 'https://www.nps.gov/seki/planyourvisit/campgrounds.htm';
  var CG_SEASON = 'Cedar Grove opens when the Highway 180 road clears of snow, typically mid-May, and runs to about October (Campflare). Confirm on Recreation.gov.';
  var CG_CAUT = 'Road to Cedar Grove is closed by snow in winter; typical opening is mid-May. No cell service. Bears are active.';
  K('ca-sentinel-cedar-grove','Sentinel Campground','Kings Canyon National Park (Cedar Grove)',NPS,'sequoia-kings','Fresno',36.7902778,-118.6719444,4600,{
    season:{note:CG_SEASON}, status:'seasonal', statusNote:'Seasonal; the Cedar Grove road is closed by snow in winter.',
    types:['tent','rv'],
    sites:{total:82, hookups:'none', hookupNote:'Campflare gives conflicting RV lengths (64 ft table vs. 82 ft text, most sites sized for 20-30 ft; trailer 30 ft): check before bringing a large rig.'},
    amen:{showers:false, flush:true, water:true, dump:false, store:true, firepit:true, bearBox:true, pets:'limited', cell:'none'},
    fam:{nearTown:'Cedar Grove Village (store, showers across the road when open)', kidNote:'Near the Cedar Grove Village store and showers; river and meadow walks are close.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 per Campflare, matching the NPS standard campsite fee.'},
    book:RG('253917', null, 'Up to four months ahead (Campflare).'),
    contact:{phone:SEKI_PH, url:'https://www.recreation.gov/camping/campgrounds/253917', address:'18 Motor Nature Trl, Wilsonia, CA 93633 (Campflare)'},
    hi:['82 sites at about 4,600 ft in Kings Canyon','Flush toilets in comfort stations; showers at Cedar Grove Village'],
    caut:[CG_CAUT, 'Reported lengths conflict; confirm size limits with the park.'],
    src:['https://campflare.com/campground/sentinel-campground-917','https://www.recreation.gov/camping/campgrounds/253917?tab=info',CG_SRC]});

  K('ca-sheep-creek-cedar-grove','Sheep Creek Campground','Kings Canyon National Park (Cedar Grove)',NPS,'sequoia-kings','Fresno',36.792137,-118.680597,4600,{
    season:{note:'Typically May to September (Campflare). Confirm on Recreation.gov.'}, status:'seasonal', statusNote:'Seasonal; the Cedar Grove road is closed by snow in winter.',
    types:['tent','rv'],
    sites:{total:111, hookups:'none', hookupNote:'Campflare gives conflicting RV lengths (table 97 ft vs. text 30 ft): confirm with the park.'},
    amen:{showers:false, flush:true, water:true, dump:false, store:false, firepit:true, bearBox:true, pets:'limited', cell:'none'},
    fam:{nearTown:'Cedar Grove Village (about a quarter mile; store and showers)', kidNote:'All reservation-only; paved loop roads; Cedar Grove Village is a short walk.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 per Campflare, matching the NPS standard campsite fee.'},
    book:RG('10044765', null, 'About one month ahead (Campflare).'),
    contact:{phone:SEKI_PH, url:'https://www.recreation.gov/camping/campgrounds/10044765', address:'97 Cedar Trl, Wilsonia, CA 93633 (Campflare)'},
    hi:['111 sites at about 4,600 ft','Flush toilets; showers at Cedar Grove Village','Large bear lockers at every site'],
    caut:[CG_CAUT, 'Campflare lists a different phone (559-565-3792) than the park main line; use the park line if unsure.'],
    src:['https://campflare.com/campground/sheep-creek-campground-765','https://www.recreation.gov/camping/poi/10044765',CG_SRC]});

  K('ca-moraine-cedar-grove','Moraine Campground','Kings Canyon National Park (Cedar Grove)',NPS,'sequoia-kings','Fresno',36.784487,-118.661091,4600,{
    season:{note:'Listing showed closed for the season and reopening about May 20 (2026 dates, Campflare). Confirm on Recreation.gov.'}, status:'seasonal', statusNote:'Seasonal; the Cedar Grove road is closed by snow in winter.',
    types:['tent','rv'],
    sites:{total:121, maxRvFt:null, maxTrailerFt:null, hookups:'none', hookupNote:'Campflare lists 66 ft but also advises vehicles over 22 ft to use the Kings Canyon entrance; confirm size limits.'},
    amen:{showers:false, flush:true, water:true, dump:false, store:false, firepit:true, bearBox:true, pets:'limited', cell:'none'},
    fam:{nearTown:'Cedar Grove Village (about 0.75 mile; store and showers)', kidNote:'Largest Cedar Grove campground; all reservation-only.'},
    fees:{nightlyMin:32, nightlyMax:32, note:'$32 per Campflare, matching the NPS standard campsite fee.'},
    book:RG('10044761', null, 'About one month ahead (Campflare).'),
    contact:{phone:SEKI_PH, url:'https://www.nps.gov/seki/planyourvisit/moraine.htm', address:'Cedar Grove, Kings Canyon National Park, CA'},
    hi:['121 sites at about 4,600 ft','Flush toilets; showers at Cedar Grove Village','Bear lockers at every site'],
    caut:[CG_CAUT, 'Frequent black bear activity; expect hazing efforts (Campflare alert).'],
    src:['https://campflare.com/campground/moraine-campground-ca-761','https://www.recreation.gov/camping/poi/10044761',CG_SRC]});

  /* ---------- Sequoia National Forest (Giant Sequoia NM) ---------- */
  var SQ_ALERT = 'Bear country: food storage rules are enforced. Fire restrictions and a 14-days-in-30 stay limit apply forest-wide (Campflare alerts).';
  K('ca-hume-lake-campground','Hume Lake Campground','Sequoia National Forest (Giant Sequoia National Monument)',USFS,'sequoia-kings','Fresno',36.795433,-118.907395,null,{
    season:{note:'Typically mid-May to mid-September (Campflare); some sites may be first-come early in the season.'}, status:'seasonal', statusNote:'Seasonal; confirm dates with the Hume Lake Ranger District.',
    types:['tent','rv'],
    sites:{total:74, maxRvFt:35, maxTrailerFt:35, hookups:'none'},
    amen:{showers:false, flush:true, water:true, dump:false, store:false, firepit:true, pets:'yes', cell:'none'},
    fam:{nearTown:'Hume Lake (Christian camp and store area)', kidNote:'Close to Hume Lake and Kings Canyon Scenic Byway.'},
    fees:{nightlyMin:36, nightlyMax:36, note:'$36 on the Campflare listing.'+CAMPFLARE_NOTE},
    book:RG('232781'),
    contact:{phone:'(559) 745-4209', url:'https://www.recreation.gov/camping/campgrounds/232781', address:'6122 Hume Lake Rd, Hume, CA 93628 (Campflare)'},
    hi:['74 sites near Hume Lake in Giant Sequoia National Monument','Flush toilets and tap water; no showers','Nearest dump station is at Princess Campground (about 5 miles)'],
    caut:[SQ_ALERT],
    src:['https://campflare.com/campground/hume-lake-781']});

  K('ca-princess-campground','Princess Campground','Sequoia National Forest (Giant Sequoia National Monument)',USFS,'sequoia-kings','Fresno',36.802784,-118.938083,5900,{
    season:{note:'Typically late May to late September (Campflare); some sites first-come.'}, status:'seasonal', statusNote:'Seasonal; confirm dates with the Hume Lake Ranger District.',
    types:['tent','rv'],
    sites:{total:90, tent:19, maxRvFt:50, maxTrailerFt:50, hookups:'none', hookupNote:'Three loops: Shining Cloud, Yellow Moon, Morning Star. No hookups listed.'},
    amen:{showers:false, water:true, dump:true, store:false, firepit:true, pets:'yes'},
    fam:{nearTown:'Hume Lake (about 5 miles)', kidNote:'Has a dump station used by Kings Canyon campers on the way in.'},
    fees:{nightlyMin:36, nightlyMax:71, note:'$36 to $71 on the Campflare listing (range likely single vs. double or group sites).'+CAMPFLARE_NOTE},
    book:RG('232782'),
    contact:{phone:'(559) 745-4209', url:'https://www.recreation.gov/camping/campgrounds/232782', address:'Hume, CA 93628'},
    hi:['90 sites (19 tent-only) at about 5,900 ft','RV dump station on site','Sites up to 50 ft per listing'],
    caut:[SQ_ALERT],
    src:['https://campflare.com/campground/princess-782']});

  K('ca-stony-creek-sequoia-nf','Stony Creek Campground','Sequoia National Forest (Giant Sequoia National Monument)',USFS,'sequoia-kings','Tulare',36.665257,-118.832823,6400,{
    season:{note:'Listing showed closed for the season and reopening about May 23 (2026 dates, Campflare).'}, status:'seasonal', statusNote:'Seasonal; confirm dates with the Hume Lake Ranger District.',
    types:['tent','rv'],
    sites:{total:49, maxRvFt:30, maxTrailerFt:30, hookups:'none'},
    amen:{showers:false, water:true, firepit:true, pets:'yes', wifi:false, store:false, cell:'none'},
    fam:{nearTown:'Hume Lake', kidNote:'Small forest campground on the Generals Highway between Grant Grove and Sequoia.'},
    fees:{nightlyMin:15, nightlyMax:15, note:'$15 on the Campflare listing.'+CAMPFLARE_NOTE},
    book:mix(RG('10250694'),{firstComeNote:'Campflare links two Recreation.gov IDs (10250694 and 232785); confirm the right listing.'}),
    contact:{phone:'(559) 338-2251', url:'https://www.recreation.gov/camping/campgrounds/232785'},
    hi:['49 sites at about 6,400 ft','Water; no showers','Low nightly rate on the listing'],
    caut:[SQ_ALERT],
    src:['https://campflare.com/campground/stony-creek-campground-mt-694']});

  /* ---------- Sierra / Stanislaus National Forests ---------- */
  K('ca-pinecrest-lake-campground','Pinecrest Campground','Stanislaus National Forest (Pinecrest Lake)',USFS,'sierra-foothills','Tuolumne',38.190833,-119.997222,5600,{
    season:{note:'Typically April through October (Campflare). Early season may be first-come only before Recreation.gov bookings open.'}, status:'seasonal', statusNote:'Seasonal; confirm dates and fire restrictions.',
    types:['tent','rv'],
    sites:{total:200, maxRvFt:40, maxTrailerFt:40, hookups:'some', hookupNote:'Campflare says most sites have electricity but its hookup fields are blank; confirm before booking.'},
    amen:{showers:false, flush:true, water:true, dump:true, store:false, firepit:true, pets:'limited', cell:'spotty'},
    fam:{swim:true, beach:true, fishing:true, boating:true, easyTrails:true, nearTown:'Pinecrest (stores, restaurants)', kidNote:'Sandy swimming beach and a 4-mile lake loop trail nearby; boat rentals at the marina.'},
    fees:{nightlyMin:40, nightlyMax:40, note:'$40 on the Campflare listing; the kiosk has limited hours so carry cash for first-come nights.'},
    book:RG('232254'),
    contact:{phone:'(209) 965-3116', email:'Info@DodgeRidge.com', url:'https://www.recreation.gov/camping/campgrounds/232254', address:'188 Pinecrest Lake Rd, Pinecrest, CA 95364 (Campflare)'},
    hi:['200 sites in five loops (A to E) on Pinecrest Lake','Beach, marina and a 4-mile lake trail close by','Flush toilets and dump station'],
    caut:['Forest orders and fire restrictions change often; check Stanislaus National Forest alerts before you go.'],
    src:['https://campflare.com/campground/pinecrest-254','https://www.recreation.gov/camping/campgrounds/232254?tab=info']});

  K('ca-wishon-point-bass-lake','Wishon Point Campground','Sierra National Forest (Bass Lake)',USFS,'sierra-foothills','Madera',37.297489,-119.534668,3400,{
    season:{note:'Typically May through September (Campflare).'}, status:'seasonal', statusNote:'Seasonal; check in at the Bass Lake Camp Store before going to the campground (Campflare).',
    types:['tent','rv'],
    sites:{total:47, maxRvFt:24, maxTrailerFt:20, hookups:'none'},
    amen:{showers:false, flush:true, water:true, store:false, wifi:false, firepit:true, pets:'yes', cell:'good'},
    fam:{nearTown:'Bass Lake / Oakhurst', kidNote:'Lakeside camping at Bass Lake; narrow bumpy roads.'},
    fees:{nightlyMin:52, nightlyMax:104, note:'$52 to $104 on the Campflare listing (range likely single vs. double sites).'+CAMPFLARE_NOTE},
    book:mix(RG('232911', null, 'Up to six months ahead; two-night minimum on weekends, three on holidays; 14-night maximum (Campflare).'),{}),
    contact:{phone:'(559) 877-2218', url:'https://www.recreation.gov/camping/campgrounds/232911', address:'37870 Emory Ln, Wishon, CA 93669 (Campflare)'},
    hi:['47 sites at about 3,400 ft on Bass Lake','Flush toilets and drinking water; no showers','AT&T and Verizon signal reported'],
    caut:['Small rigs only (24 ft RV, 20 ft trailer per listing).','Bear-resistant storage required in developed sites forest-wide.'],
    src:['https://campflare.com/campground/wishon-point-campground-879','https://www.recreation.gov/camping/campgrounds/232911']});

  K('ca-catavee-huntington-lake','Catavee Campground','Sierra National Forest (Huntington Lake)',USFS,'sierra-foothills','Fresno',37.252774,-119.178783,7000,{
    season:{note:'Typically June through September or October (Campflare).'}, status:'limited', statusNote:'Campflare showed it closed until further notice because of hazard trees, with no reopening date. Confirm with the Sierra National Forest before planning.',
    types:['tent','rv'],
    sites:{total:24, maxRvFt:30, maxTrailerFt:22, hookups:'none'},
    amen:{showers:false, water:true, dump:false, store:false, wifi:false, firepit:true, cell:'spotty'},
    fam:{nearTown:'Lakeshore', kidNote:'Huntington Lake area; closed at last check.'},
    fees:{nightlyMin:47, nightlyMax:47, note:'$47 on the Campflare listing.'+CAMPFLARE_NOTE},
    book:RG('232811'),
    contact:{phone:'(559) 855-5355', url:'https://www.recreation.gov/camping/campgrounds/232811', address:'61151 Upper Deer Creek Ln, Lakeshore, CA 93634 (Campflare)'},
    hi:['24 sites at about 7,000 ft near Huntington Lake'],
    caut:['Listed as closed for hazard trees with no reopening date at the time of reading.','Bring bear-proof food containers; area is active bear country.'],
    src:['https://campflare.com/campground/catavee-811']});

  /* ---------- Eastern Sierra ---------- */
  K('ca-lower-lee-vining-campground','Lower Lee Vining Campground','Inyo National Forest (Mono Basin)',USFS,'eastern-sierra','Mono',37.928609,-119.152489,7300,{
    season:{note:'Dates not stated on the Forest Service page (it showed a closed label when read). Snow-dependent; ask the Mono Basin visitor center.'}, status:'closed-check', statusNote:'The Forest Service page showed "Site Closed" when read; confirm the season.',
    types:['tent','rv'],
    sites:{total:51, hookups:'none'},
    amen:{vault:true, water:false, bearBox:true, pets:'yes', firepit:null},
    fam:{nearTown:'Lee Vining', kidNote:'Creekside, about 2 miles west of US-395 on Highway 120 toward Tioga Pass.'},
    fees:{nightlyMin:28, nightlyMax:28, extraVehicle:10, note:'$28 per site per night plus $10 per extra vehicle (Forest Service page, read 2026-10).'},
    book:{system:'first-come', url:'https://www.fs.usda.gov/r05/inyo/recreation/lower-lee-vining-campground', phone:'(760) 647-3044', firstComeNote:'First-come, first-served; no reservations (Forest Service).'},
    contact:{phone:'(760) 647-3044', url:'https://www.fs.usda.gov/r05/inyo/recreation/lower-lee-vining-campground', address:'Mono Basin Scenic Area Visitor Center, 1 Visitor Center Dr, Lee Vining, CA 93541'},
    hi:['51 first-come sites at about 7,300 ft on Lee Vining Creek','Bear box at every site','Close to Mono Lake and Tioga Pass'],
    caut:['No drinking water at the campground; bring or treat your own.','Limit 6 people and 2 vehicles per site; a truck towing a trailer counts as two vehicles; 14-night stay limit.'],
    src:['https://fs.usda.gov/r05/inyo/recreation/lower-lee-vining-campground']});

  K('ca-lundy-canyon-campground','Lundy Canyon Campground','Mono County (Lundy Canyon)','Mono County','eastern-sierra','Mono',38.034151,-119.207022,7660,{
    season:{note:'Generally mid-April to mid-November, snow permitting (Mono County and Campflare).'}, status:'seasonal', statusNote:'Seasonal; closes in winter.',
    types:['tent','rv'],
    sites:{total:36, maxRvFt:35, maxTrailerFt:35, hookups:'none'},
    amen:{showers:false, flush:false, vault:true, water:false, dump:false, store:false, wifi:false, firepit:true, bearBox:true, pets:'yes', cell:'none'},
    fam:{nearTown:'Lee Vining', kidNote:'Aspen grove along Mill Creek; Lundy Canyon trails start nearby.'},
    fees:{nightlyMin:16, nightlyMax:16, note:'$16 per site per night, cash only, paid at the fee pedestal (Mono County page; matches Campflare).'},
    book:{system:'first-come', url:'https://www.monocounty.ca.gov/facilities/page/lundy-canyon-campground', phone:'(760) 932-5440', firstComeNote:'First-come, first-served; no reservations. No on-site host.'},
    contact:{phone:'(760) 932-5440', email:'monopw@mono.ca.gov', url:'https://www.monocounty.ca.gov/facilities/page/lundy-canyon-campground', address:'Lundy Lake Road, Lee Vining, CA 93541'},
    hi:['36 sites among aspens along Mill Creek at about 7,660 ft','$16 per night, cash','Bear box at every site'],
    caut:['No potable water: the spigots are spring-fed and non-potable; treat or bring water.','Gravel road, rough in places. Do not confuse with Lundy Lake Campground or Lundy Lake Resort.','Phone and coordinate are from Campflare; the county page lists neither.'],
    src:['https://www.monocounty.ca.gov/facilities/page/lundy-canyon-campground','https://campflare.com/campground/lundy-canyon-11-campground']});

  K('ca-whitney-portal-campground','Whitney Portal Campground','Inyo National Forest (Mount Whitney)',USFS,'eastern-sierra','Inyo',36.589861,-118.229778,8000,{
    season:{note:'Typically late May to mid-October, snow permitting (Campflare).'}, status:'seasonal', statusNote:'Seasonal; confirm on Recreation.gov.',
    types:['tent','rv'],
    sites:{total:43, maxRvFt:35, maxTrailerFt:35, hookups:'none'},
    amen:{showers:false, water:true, vault:true, dump:false, firepit:true, bearBox:true, pets:'yes', cell:'spotty'},
    fam:{fishing:true, nearTown:'Lone Pine (12.5 miles)', kidNote:'Trailhead to Mt. Whitney is about half a mile away; a small store with showers is nearby.'},
    fees:{nightlyMin:34, nightlyMax:95, note:'$34 to $95 on the Campflare listing (range likely single vs. group/multi sites).'+CAMPFLARE_NOTE},
    book:mix(RG('232123'),{firstComeNote:'Mix of reservable and first-come sites (Campflare).'}),
    contact:{phone:'(760) 937-6070', url:'https://www.recreation.gov/camping/campgrounds/232123', address:'Whitney Portal Road, Lone Pine, CA 93545'},
    hi:['43 sites at about 8,000 ft beside the Mt. Whitney trailhead','Bear lockers at every site','Potable water from hand pumps'],
    caut:['Bear lockers are mandatory; fines up to $150 for improper storage (Campflare).','Mount Whitney Zone needs the proper wilderness permit.','Stage 1 fire restrictions were listed through December 31, 2026.'],
    src:['https://campflare.com/campground/whitney-portal-123','https://www.recreation.gov/camping/campgrounds/232123']});

  K('ca-bishop-park-campground','Bishop Park Campground','Inyo National Forest (Bishop Creek)',USFS,'eastern-sierra','Inyo',null,null,null,{
    season:{note:'Season and fee not shown on the Recreation.gov page read; check Recreation.gov.'}, status:null, statusNote:'Season not stated on the page read.',
    types:['tent','rv','walk-in'],
    sites:{total:21, tent:13, hookups:'none', hookupNote:'8 standard non-electric sites and 13 tent-only sites; many tent sites are walk-in on the creek. Large RVs not recommended.'},
    amen:{flush:true, water:true, firepit:true, bearBox:true, pets:'yes'},
    fam:{fishing:true, nearTown:'Bishop (about 15 miles)', kidNote:'Creekside tent sites on the Middle Fork of Bishop Creek; stocked trout stream.'},
    fees:{note:'Nightly rate not shown on the Recreation.gov page read; check Recreation.gov. One vehicle per single site is included.'},
    book:mix(RG('10132033','(760) 872-4552'),{cancelNote:'Reserved sites are held until noon the day after arrival (Recreation.gov).'}),
    contact:{phone:'(760) 872-4552', url:'https://www.recreation.gov/camping/campgrounds/10132033', address:'3 South Lake Road, Bishop, CA 93514'},
    hi:['21 reservable sites on the Middle Fork of Bishop Creek','Flush toilets, drinking water, camp host','Close to Inyo and John Muir Wilderness trailheads'],
    caut:['Active bear area; use the food boxes.','Fire restrictions may ban campfires and charcoal in hot, dry weather.','No verified coordinate or elevation.'],
    src:['https://www.recreation.gov/camping/campgrounds/10132033']});

  /* ---------- Foothill and valley lakes ---------- */
  K('ca-trimmer-pine-flat-lake','Trimmer Campground','Pine Flat Lake (Trimmer Recreation Area)',USFS,'sierra-foothills','Fresno',36.904444,-119.293611,null,{
    season:{note:'Campflare showed it open with no season dates given.'}, status:'open', statusNote:'Water level at Pine Flat Lake fluctuates, which can limit lake access. Campflare noted the waterborne restroom was closed (vault toilet nearby).',
    types:['tent','rv'],
    sites:{total:10, maxRvFt:null, maxTrailerFt:null, hookups:'none', hookupNote:'Campflare gives conflicting RV lengths (40 ft table vs. 20 ft text for non-electric sites).'},
    amen:{showers:true, water:true, dump:false, firepit:true, pets:'yes', cell:'spotty'},
    fam:{nearTown:'Sanger / Fresno foothills', kidNote:'Boat ramp and courtesy dock next to the campground; free hot showers.'},
    fees:{nightlyMin:20, nightlyMax:20, note:'$20 on the Campflare listing.'+CAMPFLARE_NOTE},
    book:RG('233314'),
    contact:{phone:'(559) 787-2589', url:'https://www.recreation.gov/camping/campgrounds/233314', address:'39939 E Trimmer Springs Rd, Sanger, CA 93657 (Campflare)'},
    hi:['10 sites beside Pine Flat Lake','Free hot showers (per Campflare)','Boat ramp adjacent'],
    caut:['Only 10 sites; book early.','Operator is shown as Sierra National Forest by Campflare; the lake is an Army Corps of Engineers project, so confirm who manages the campground.'],
    src:['https://campflare.com/campground/trimmer-campground-314','https://en.wikipedia.org/wiki/Pine_Flat_Lake']});

  K('ca-horse-creek-lake-kaweah','Horse Creek Campground','Lake Kaweah (US Army Corps of Engineers)','US Army Corps of Engineers','sierra-foothills','Tulare',36.390556,-118.954722,null,{
    season:{note:'Campflare showed it closed for the season because of rising lake levels (individual sites reopen when out of the water).'}, status:'limited', statusNote:'Closed or partly closed when the lake is high; confirm on Recreation.gov.',
    types:['tent','rv'],
    sites:{total:80, maxRvFt:50, maxTrailerFt:60, hookups:'none', hookupNote:'About 80 sites without hookups per Campflare.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'yes', cell:'good'},
    fam:{rangerPrograms:true, nearTown:'Lemon Cove / Three Rivers', kidNote:'Weekend ranger programs May to September; limited shade. About 11 miles from Sequoia National Park south entrance.'},
    fees:{nightlyMin:30, nightlyMax:40, note:'$30 to $40 on the Campflare listing.'},
    book:mix(RG('233692','(559) 597-2301'),{firstComeNote:'Reservations required at least 1 day ahead; no first-come or same-day stays (Campflare).'}),
    contact:{phone:'(559) 597-2301', url:'https://www.recreation.gov/camping/gateways/479', address:'37110 Sierra Dr, Lemon Cove, CA 93244 (Campflare)'},
    hi:['About 80 sites on Lake Kaweah near Sequoia National Park','Showers, flush toilets and a dump station','Ranger programs on summer weekends'],
    caut:['Vehicles over 22 ft cannot use Highway 198 through Sequoia National Park.','Limited shade; hot in summer.'],
    src:['https://campflare.com/campground/horse-creek-692','https://www.recreation.gov/gateways/479']});

  K('ca-millerton-lake-sra','Millerton Lake State Recreation Area','Millerton Lake SRA',CSP,'sierra-foothills','Madera',null,null,null,{
    season:{note:'Meadows loop and group camps open year-round; other loops April to September (parks.ca.gov).'}, status:'open', statusNote:'Open year-round at the Meadows loop; other loops seasonal.',
    types:['tent','rv','group','equestrian'],
    sites:{total:null, maxRvFt:36, maxTrailerFt:36, hookups:'some', hookupNote:'36 ft per Campflare; Meadows sites 120-144 have full hookups; other loops are standard or primitive. Mono/Rocky Point not recommended for large RVs.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited', cell:'good'},
    fam:{boating:true, nearTown:'Friant', kidNote:'Lake camping near Fresno; boat-in camping at Temperance Flat when the lake is above 520 ft.'},
    fees:{nightlyMin:30, nightlyMax:40, note:'$30 standard, $40 full hookup, $2 off for ages 62+; group camps $150 and $200 (parks.ca.gov camping page). Reservation fee not stated.'},
    book:RC(678,'Reserve online at ReserveCalifornia or call (800) 444-7275; walk-ins accepted subject to availability (parks.ca.gov).'),
    contact:{phone:'(559) 822-2332', url:'https://www.parks.ca.gov/?page_id=31604', address:'5290 Millerton Rd, Friant, CA 93626 (Campflare, from directions)'},
    hi:['Meadows loop (sites 92-148) open all year','Coin-operated showers, free dump station','Dumna Strands and Valley Oak are primitive tent-only loops'],
    caut:['Dogs: the camping page links a separate Dogs in Parks page; check it before bringing pets.','Wood fires only in provided rings; gathering firewood is prohibited and none is sold in the park.','The 36 ft limit is from Campflare, not parks.ca.gov.','No verified campground-level coordinate; Campflare shows only an approximate 37.02, -119.68.'],
    src:['https://www.parks.ca.gov/?page_id=31604','https://campflare.com/campground/millerton-lake-campground-californiastateparks-119']});

  K('ca-san-luis-reservoir-sra','San Luis Reservoir State Recreation Area','San Luis Reservoir SRA',CSP,'sierra-foothills','Merced',null,null,null,{
    season:{note:'No season stated on the page read.'}, status:'limited', statusNote:'parks.ca.gov shows a Dam Safety Project temporarily closing Basalt Campground and day-use area (dates not given).',
    types:['tent','rv','group'],
    sites:{hookups:'some', maxTrailerFt:30, hookupNote:'Park-wide: tent camping, group sites, remote camping and RV sites with hookups; trailer/camper max 30 ft.'},
    amen:{dump:true, pets:'limited'},
    fam:{nearTown:'Gustine / Los Banos', kidNote:'Large reservoir on Highway 152; Medeiros and Basalt are the main camps.'},
    fees:{note:'Camping fees not listed on the page read; check ReserveCalifornia. Day use is $10 ($12 special rate).'},
    book:RC(711,'Book through ReserveCalifornia (park ID 711).'),
    contact:{phone:'(209) 826-1197', url:'https://www.parks.ca.gov/?page_id=558', address:null},
    hi:['Tent, RV, group and remote camping','RV dump station','Dogs allowed in the campground'],
    caut:['Basalt Campground has an announced temporary closure; verify which camps are open.','Phone is the Four Rivers Sector office; kiosk lines on the page: Basalt (209) 827-6846, Medeiros (209) 826-6240.','Address is not on the page read; verify with the park.'],
    src:['https://www.parks.ca.gov/?page_id=558']});

  K('ca-don-pedro-fleming-meadows','Fleming Meadows Campground','Lake Don Pedro Recreation Area','Don Pedro Recreation Agency','sierra-foothills','Tuolumne',null,null,null,{
    season:{note:'No campground season stated on the page read.'}, status:null, statusNote:'Season not stated; call the visitor center.',
    types:['tent','rv','walk-in'],
    sites:{total:266, rv:90, hookups:'full', hookupNote:'90 full-hookup sites and 176 non-hookup and walk-in tent sites; each campground lists 30 amp RV and two 20 amp outlets.'},
    amen:{showers:true, dump:true, store:true, pets:null},
    fam:{swim:true, boating:true, nearTown:'La Grange', kidNote:'Swimming lagoon, camp store and marina; hot showers at no extra charge.'},
    fees:{note:'Fees are in the agency fee schedule PDF; not read. Check donpedrolake.com.'},
    book:{system:'other', url:'https://www.donpedrolake.com/reservations/', phone:'(209) 852-2396'},
    contact:{phone:'(209) 852-2396', url:'https://www.donpedrolake.com/recreation', address:'11500 Bonds Flat Rd, La Grange, CA 95329'},
    hi:['90 full-hookup plus 176 other sites on Lake Don Pedro','Swimming lagoon, store, marina and dump station'],
    caut:['Phone is the visitor center / headquarters number; no separate campground line is listed.'],
    src:['https://www.donpedrolake.com/recreation']});

  K('ca-don-pedro-blue-oaks','Blue Oaks Campground','Lake Don Pedro Recreation Area','Don Pedro Recreation Agency','sierra-foothills','Tuolumne',null,null,null,{
    season:{note:'No campground season stated on the page read.'}, status:null, statusNote:'Season not stated; call the visitor center.',
    types:['tent','rv','group'],
    sites:{total:195, hookups:'some', hookupNote:'34 partial-hookup (water and power) sites and 161 tent sites; group camping for up to 200 people.'},
    amen:{showers:true},
    fam:{nearTown:'La Grange', kidNote:'Mostly tent sites with a hiking trail; hot showers at no extra charge.'},
    fees:{note:'Fees are in the agency fee schedule PDF; not read. Check donpedrolake.com.'},
    book:{system:'other', url:'https://www.donpedrolake.com/reservations/', phone:'(209) 852-2396'},
    contact:{phone:'(209) 852-2396', url:'https://www.donpedrolake.com/recreation', address:'10150 Bonds Flat Rd, La Grange, CA 95329'},
    hi:['161 tent sites and 34 partial-hookup sites','Group camping for up to 200'],
    caut:['Phone is the visitor center / headquarters number.'],
    src:['https://www.donpedrolake.com/recreation']});

  K('ca-don-pedro-moccasin-point','Moccasin Point Campground','Lake Don Pedro Recreation Area','Don Pedro Recreation Agency','sierra-foothills','Tuolumne',null,null,null,{
    season:{note:'No campground season stated on the page read.'}, status:null, statusNote:'Season not stated; call the visitor center.',
    types:['tent','rv'],
    sites:{total:96, rv:18, hookups:'full', hookupNote:'18 full-hookup and 78 non-hookup sites.'},
    amen:{showers:true, dump:true},
    fam:{nearTown:'Jamestown', kidNote:'East-shore camp with marina and walking trails; Moccasin Point Marina (209) 989-2206.'},
    fees:{note:'Fees are in the agency fee schedule PDF; not read. Check donpedrolake.com.'},
    book:{system:'other', url:'https://www.donpedrolake.com/reservations/', phone:'(209) 852-2396'},
    contact:{phone:'(209) 852-2396', url:'https://www.donpedrolake.com/recreation', address:'11401 Jacksonville Rd, Jamestown, CA 95327'},
    hi:['18 full-hookup and 78 other sites on the east shore','Marina, dump station, hot showers'],
    caut:['Phone is the visitor center / headquarters number.'],
    src:['https://www.donpedrolake.com/recreation']});

  K('ca-lake-mcclure-mid-campgrounds','Lake McClure and Lake McSwain Campgrounds','Merced Irrigation District Parks and Recreation','Merced Irrigation District','sierra-foothills','Mariposa',null,null,null,{
    season:{note:'Page showed all campgrounds and cabins open; no season dates given.'}, status:null, statusNote:'Season not stated.',
    types:['tent','rv','cabin','group'],
    sites:{hookups:null, hookupNote:'Hookups not specified. Campgrounds listed: Lake McSwain, McClure Point, Barrett Cove, Horseshoe Bend, and Bagby (upriver).'},
    amen:{showers:true},
    fam:{kidNote:'Options range from basic tent/RV sites to waterfront cabins.'},
    fees:{note:'Fees not listed on the page read; see the district fee schedule.'},
    book:{system:'other', url:'https://book.lakemcclure.com', phone:'(855) 800-2267'},
    contact:{phone:'(855) 800-2267', url:'https://www.lakemcclure.com/', address:null},
    hi:['Five campgrounds on and above Lake McClure and Lake McSwain','Most have hot showers'],
    caut:['The site gave conflicting campfire rules (some say no wood fires, some allow them in contained rings); confirm current rules.','One summary record covers all five campgrounds; per-campground counts were not verified.'],
    src:['https://www.lakemcclure.com/']});

  /* ---------- Central Coast ---------- */
  K('ca-san-simeon-creek-hearst-sp','San Simeon Creek Campground','Hearst San Simeon State Park',CSP,'central-coast','San Luis Obispo',null,null,null,{
    season:{note:'Season not stated; reservations are available year-round (parks.ca.gov).'}, status:null,
    types:['tent','rv'],
    sites:{total:134, maxRvFt:35, maxTrailerFt:35, hookups:'none', hookupNote:'No RV electric hookups; RV sanitation station and water fill available.'},
    amen:{showers:true, flush:true, water:true, dump:true, pets:'limited'},
    fam:{beach:true, nearTown:'Cambria', kidNote:'Near the beach and Cambria; token-operated showers.'},
    fees:{note:'Fees not listed on the page read; check ReserveCalifornia.'},
    book:RC(null,'Bookings open six months ahead (parks.ca.gov).'),
    contact:{phone:'(805) 927-2035', url:'https://www.parks.ca.gov/590', address:'500 San Simeon Creek Road, Cambria, CA 93428'},
    hi:['134 tent/RV sites near the coast','RV dump and water fill','Limit 2 vehicles and 8 people per site'],
    caut:['Dogs must be leashed and are not allowed on the beach or trails next to the campground.','Limit 10 consecutive nights and 30 nights per calendar year in the park.','Coordinate from a map link (about 35.597, -121.142) was not an official figure, so lat/lon are null.'],
    src:['https://www.parks.ca.gov/590']});
  CAMPS.items[CAMPS.items.length - 1].booking.url = 'https://www.reservecalifornia.com/';

  K('ca-washburn-hearst-sp','Washburn Campground','Hearst San Simeon State Park',CSP,'central-coast','San Luis Obispo',null,null,null,{
    season:{note:'Season not stated; reservations are available year-round (parks.ca.gov).'}, status:null,
    types:['tent','rv'],
    sites:{total:68, maxRvFt:35, maxTrailerFt:35, hookups:'none', hookupNote:'Primitive; about 1 mile inland. The 35 ft figure is the park-wide limit on the page.'},
    amen:{showers:false, flush:false, water:null, pets:'limited'},
    fam:{nearTown:'Cambria', kidNote:'Primitive, chemical toilets only; showers are at San Simeon Creek Campground.'},
    fees:{note:'Fees not listed on the page read; check ReserveCalifornia.'},
    book:RC(null,'Bookings open six months ahead (parks.ca.gov).'),
    contact:{phone:'(805) 927-2035', url:'https://www.parks.ca.gov/590', address:'Hearst San Simeon State Park, Cambria, CA'},
    hi:['68 primitive sites about a mile inland','Chemical toilets only'],
    caut:['Dogs must be leashed; not allowed on the beach or trails next to the campground.'],
    src:['https://www.parks.ca.gov/590']});
  CAMPS.items[CAMPS.items.length - 1].booking.url = 'https://www.reservecalifornia.com/';

  K('ca-fremont-peak-sp','Fremont Peak State Park Campground','Fremont Peak State Park',CSP,'central-coast','San Benito',null,null,null,{
    season:{note:'No season stated. Wood and charcoal fires are usually banned June to November, with no advance notice (parks.ca.gov).'}, status:null,
    types:['tent','rv','group'],
    sites:{maxRvFt:25, hookups:'none', hookupNote:'RVs only at some Valley View sites (1, 2, 3, 5, 6, 7, 9, 10, 11); not recommended over 25 ft. No hookups or dump station. Doe Flat Group Camp holds up to 40 people.'},
    amen:{showers:false, flush:false, vault:true, dump:false, pets:'limited'},
    fam:{nearTown:'San Juan Bautista', kidNote:'Small hilltop park known for stargazing; loops are Valley View, Oak Point and Doe Flat.'},
    fees:{nightlyMin:25, nightlyMax:25, extraVehicle:6, reservationFee:7.99, note:'$25 per site per night plus $6 per additional car; $7.99 ReserveCalifornia fee; cash only at the park (parks.ca.gov).'},
    book:RC(645,'Book at least 48 hours ahead; sites 1, 12, 14 and 15 are non-reservable (parks.ca.gov).'),
    contact:{phone:'(831) 623-4255', url:'https://parks.ca.gov/?page_id=30231', address:'San Juan Bautista, CA'},
    hi:['Hilltop campground used for stargazing','Vault toilets with locking doors; no showers'],
    caut:['Fire bans can start with no notice; dogs are not allowed on trails.','No water mentioned on the page: bring your own unless you confirm otherwise.'],
    src:['https://parks.ca.gov/?page_id=30231']});

  K('ca-lopez-lake-recreation-area','Lopez Lake Recreation Area','San Luis Obispo County Parks','San Luis Obispo County Parks','central-coast','San Luis Obispo',null,null,null,{
    season:{note:'No season stated; marina and launch ramp operate year-round.'}, status:null,
    types:['tent','rv','cabin'],
    sites:{total:350, hookups:'some', hookupNote:'"Over 350" campsites; primitive, electric and full-hookup sites. Count is the county page\'s approximate phrasing.'},
    amen:{showers:true, store:true},
    fam:{boating:true, nearTown:'Arroyo Grande', kidNote:'Marina with launch ramp, store and boat rentals; cabins available.'},
    fees:{note:'Fees are on a separate county fee schedule that was not read.'},
    book:{system:'other', url:'https://slocountyparks.com/camp/lopez-lake/', phone:'(805) 788-2381', window:'Cabins up to six months ahead (county page).'},
    contact:{phone:'(805) 788-2381', url:'https://slocountyparks.com/camp/lopez-lake/', address:'6800 Lopez Drive, Arroyo Grande, CA 93420'},
    hi:['Over 350 campsites above a large lake','Hot showers at several campgrounds, coin showers also','Marina, store and rentals'],
    caut:['From January 1, 2026, boats with internal ballast face a 30-day quarantine and all vessels need a Clean, Drain, Dry inspection (county page).','Reservations for Encinal and cabins use the same number, extension 1.'],
    src:['https://slocountyparks.com/camp/lopez-lake/']});
})();
