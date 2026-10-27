/* Campica data pack: San Diego County and Southern California inland mountains. Facts only from sources listed in SOURCES-camps-south2.md.
   Any field left null was not verified: the UI must say "check with the source".
   New region ids used here: 'san-diego', 'inland-mountains' (plus existing 'la-orange', 'death-valley-mojave'). */
window.CAMPS = window.CAMPS || {items:[]};
(function(){
  var ASOF = '2026-10';
  function mix(base, over){ var o = {}, k; for (k in base) o[k] = base[k]; if (over) for (k in over) o[k] = over[k]; return o; }
  var RC_WINDOW = '6 months ahead; new dates open daily at 8 a.m. Pacific (per California State Parks)';
  var RC_CANCEL = 'ReserveCalifornia charges a reservation fee and a cancellation fee; refund rules depend on how far ahead you cancel. Read the current policy at booking.';
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
  var CSP = 'California State Parks';
  var USFS = 'US Forest Service';
  var OD = ' (third-party mirror of ReserveCalifornia data via Outdoorithm; confirm at booking)';

  // ---------- CUYAMACA / PALOMAR ----------
  K('ca-paso-picacho-cuyamaca','Paso Picacho Campground','Cuyamaca Rancho State Park',CSP,'san-diego','San Diego',32.9581,-116.5818,5000,{
    season:{open:'year-round', close:null, note:'Reservable April 1 to November 30; first come, first served December 1 to March 31 (per park page).'},
    status:'open', types:['tent','rv','cabin','group'],
    sites:{total:85, hookups:'none', hookupNote:'No hookups. Dump station on site. Park page gives no RV length limit.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited', ada:null},
    fam:{kidNote:'Mountain pine and oak forest at about 5,000 ft with cabins as an option for families who do not want to tent. Pets must be leashed.'},
    fees:{nightlyMin:40, nightlyMax:40, extraVehicle:10, note:'Standard site $40 ($38 seniors 62+, $20 with Disabled Discount Pass); group site $250; cabins $80-100 (park page, read 2026-10).'},
    book:RC({firstComeNote:'First come, first served December 1 to March 31.'}),
    contact:{phone:'760-765-3020', email:'cuyamaca@parks.ca.gov', url:'https://www.parks.ca.gov/667', address:'13652 Highway 79, Julian, CA 92036'},
    hi:['85 standard sites plus 6 cabins and a group camp','Flush toilets, pay showers, dump station','Firewood and ice sold on site'],
    caut:['Max 8 people and 2 vehicles per site','Fire restrictions line: 760-767-4037 (per park page)','Park page text on reservation dates is slightly inconsistent; confirm weekend availability'],
    src:['https://www.parks.ca.gov/667','https://www.outdoorithm.com/campgrounds/ca/cuyamaca-rancho-sp/paso-picacho-cabins']});

  K('ca-green-valley-cuyamaca','Green Valley Campground','Cuyamaca Rancho State Park',CSP,'san-diego','San Diego',32.9048,-116.5846,4000,{
    season:{open:'Apr 1', close:'Nov 30', note:'Reservations April 1 to November 30 per park page; a third-party listing says closed December to March for weather. Confirm.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:81, hookups:'none', hookupNote:'No hookups; dump station on site. Park page gives no RV length limit.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited'},
    fam:{kidNote:'Shadier, lower-elevation campground near Green Valley Falls trails. Pets must be leashed.'},
    fees:{nightlyMin:40, nightlyMax:45, extraVehicle:10, note:'Standard sites $40; horse sites 1-15 $45 (park page, read 2026-10).'},
    book:RC(),
    contact:{phone:'760-765-3020', email:'cuyamaca@parks.ca.gov', url:'https://www.parks.ca.gov/667', address:'13652 Highway 79, Julian, CA 92036'},
    hi:['81 sites at about 4,000 ft','Flush toilets, showers, water, dump station','Horse sites available'],
    caut:['Max 8 people and 2 vehicles per site','Fire restrictions line: 760-767-4037'],
    src:['https://www.parks.ca.gov/667','https://outdoorithm.com/campgrounds/ca/cuyamaca-rancho-sp/green-valley-campground']});

  K('ca-doane-valley-palomar','Doane Valley Campground','Palomar Mountain State Park',CSP,'san-diego','San Diego',33.3417,-116.9064,5000,{
    season:{open:'year-round', close:null, note:'Reservable April 1 to November 30; first come, first served December 1 to March 31 (park page).'},
    status:'open', types:['tent','rv','group'],
    sites:{total:31, maxRvFt:24, maxTrailerFt:24, hookups:'none', hookupNote:'Park page limits trailers and motorhomes to 24 ft.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, store:true, pets:'limited'},
    fam:{fishing:true, easyTrails:true, kidNote:'Forested campground at about 5,000 ft with trails to Doane Pond (trout fishing). Some sites are sloped.'},
    fees:{nightlyMin:40, nightlyMax:40, extraVehicle:10, note:'$40 standard ($38 seniors, $20 with Disabled Discount Pass); group camp $130 (park page, read 2026-10).'},
    book:RC({firstComeNote:'First come, first served December 1 to March 31.'}),
    contact:{phone:'760-742-3462', url:'https://www.parks.ca.gov/637', address:'19952 State Park Drive, Palomar Mountain, CA 92060'},
    hi:['31 sites plus 3-site Cedar Grove group camp','Food lockers and showers (third-party listing)'],
    caut:['Max 24 ft trailer or motorhome','2 vehicles per site','Fire restrictions line: 760-767-4037'],
    src:['https://www.parks.ca.gov/637','https://www.outdoorithm.com/campgrounds/ca/palomar-mountain-sp/state-park-campground']});

  // ---------- ANZA-BORREGO ----------
  K('ca-borrego-palm-canyon','Borrego Palm Canyon Campground','Anza-Borrego Desert State Park',CSP,'san-diego','San Diego',33.2694,-116.4080,775,{
    season:{open:'year-round', close:null, note:'Third-party listing says open year-round with reservations October 1 to April 30; summer is extremely hot.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:65, maxRvFt:35, hookups:'some', hookupNote:'About 52 full-hookup RV sites (up to 35 ft) and non-hookup sites (RV up to 25 ft) per DesertUSA; counts vary by source.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, firepit:true, pets:'limited', ada:true},
    fam:{easyTrails:true, kidNote:'Trailhead to Borrego Palm Canyon palm oasis starts at the campground. Desert heat is dangerous in summer.'},
    fees:{nightlyMin:35, nightlyMax:45, extraVehicle:10, note:'Tent $35, full-hookup RV $45, hike/bike $5, group $125 as listed on a third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'760-767-5311', url:'https://www.parks.ca.gov/638', address:'200 Palm Canyon Drive, Borrego Springs, CA 92004'},
    hi:['Hookup and non-hookup sites, showers (token), dump station','Palm oasis hike from camp'],
    caut:['Extreme summer heat','Site counts conflict between sources (52 or 65 hookup sites)'],
    src:['https://www.outdoorithm.com/campgrounds/ca/anza-borrego-desert-sp/palm-canyon-campground','https://www.desertusa.com/anza_borrego/du_abp_camp.html','https://www.parks.ca.gov/AccessibleFeatures/Details/638']});

  K('ca-tamarisk-grove-anza-borrego','Tamarisk Grove Campground','Anza-Borrego Desert State Park',CSP,'san-diego','San Diego',33.1380,-116.3758,775,{
    season:{open:'Oct 1', close:'May 31', note:'Seasonal per third-party listing' + OD + '; closed in summer.'},
    status:'seasonal', types:['tent','rv','cabin'],
    sites:{total:27, maxRvFt:21, hookups:'none', hookupNote:'No hookups. RV length limit 21 ft per third-party listing.'},
    amen:{showers:true, flush:true, water:false, firepit:true, pets:'limited', ada:true, cell:'spotty'},
    fam:{kidNote:'Small desert campground with cabins at the Highway 78 and S-3 junction; bring drinking water.'},
    fees:{nightlyMin:35, nightlyMax:35, note:'$35 standard site, cabins $70, hike/bike $5 per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'760-767-4205', url:'https://www.parks.ca.gov/638', address:'200 Palm Canyon Drive, Borrego Springs, CA 92004 (park address)'},
    hi:['27 sites and cabins','Showers and flush toilets'],
    caut:['No potable water per third-party listing; bring your own','Closed summers','Coordinates from third-party listing'],
    src:['https://www.outdoorithm.com/campgrounds/ca/anza-borrego-desert-sp/tamarisk-grove-campground','https://www.desertusa.com/anza_borrego/du_abp_camp.html','https://demo2.parks.ca.gov/pages/638/files/TamariskGrove_CampMap010815.pdf']});

  K('ca-bow-willow-anza-borrego','Bow Willow Campground','Anza-Borrego Desert State Park',CSP,'san-diego','San Diego',32.8418,-116.2249,null,{
    status:null, types:['tent','rv'],
    sites:{total:16, hookups:'none', hookupNote:'Primitive; 16 sites per DesertUSA.'},
    amen:{showers:false, flush:false, vault:true, firepit:true, ada:true},
    fam:{kidNote:'Remote primitive desert camp with chemical/vault toilets, fire rings and tables.'},
    fees:{note:'Fee not verified; call the park.'},
    book:{system:null, url:'https://www.parks.ca.gov/638'},
    contact:{phone:'760-767-5311', url:'https://www.parks.ca.gov/638', address:null},
    caut:['Primitive: no showers; water availability not verified','Coordinates from a Campertunity listing','Check season and fee with the park'],
    src:['https://www.desertusa.com/anza_borrego/du_abp_camp.html','https://www.parks.ca.gov/AccessibleFeatures/Details/638','https://campertunity.com/listings/campgrounds/bow-willow-primitive-campground-anza-borrego-desert.md']});

  // ---------- SAN DIEGO COAST / COUNTY ----------
  K('ca-lake-morena-county-park','Lake Morena County Park','Lake Morena County Park','San Diego County Parks','san-diego','San Diego',null,null,3000,{
    status:'open', types:['tent','rv','cabin','group'],
    sites:{total:86, hookups:'some', hookupNote:'South Shore: 40 full hookup, 17 partial, 10 non-hookup, 18 tent-only (park brochure); 10 wilderness cabins; 50 primitive North Shore sites open seasonally.'},
    amen:{showers:true, flush:true, dump:true, store:true, playground:true, firepit:null},
    fam:{fishing:true, boating:true, playground:true, easyTrails:true, kidNote:'Lake stocked with trout; TRACK kids trails; near Pacific Crest Trail southern terminus area.'},
    fees:{nightlyMin:33, nightlyMax:42, extraVehicle:6, reservationFee:8, note:'Tent $33, non-hookup $36, partial $39, full hookup $42, cabin $65 (county fee page, read 2026-10).'},
    book:{system:'San Diego County Parks', url:'https://parksres.sandiegocounty.gov/', phone:'858-565-3600'},
    contact:{phone:'619-579-4101', url:'https://sdparks.org/content/sdparks/en/park-pages/LakeMorena.html', address:'2550 Lake Morena Drive, Campo, CA 91906'},
    caut:['Coordinates not verified','No cabin mattresses supplied; pets not allowed in cabins'],
    src:['https://sdparks.org/content/sdparks/en/park-pages/LakeMorena.html','https://www.sdparks.org/content/sdparks/en/shop/PermitsandFees/Current-Park-Fees.html','https://www.sdparks.org/content/dam/sdparks/en/pdf/BrochuresMiscellaneous/Lake%20Morena%20Park%20Brochure.pdf']});

  K('ca-silver-strand-campground','Silver Strand State Beach Campground','Silver Strand State Beach',CSP,'san-diego','San Diego',32.6354,-117.1426,10,{
    season:{open:'year-round', close:null, note:'Peak season mid-May to mid-September.'},
    status:'open', types:['rv'],
    sites:{total:136, hookups:'some', hookupNote:'Self-contained RVs only; no tents or car camping. Electric/water hookups listed as partial (third-party mirror).'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:null, pets:'limited', ada:true},
    fam:{beach:true, swim:true, bikeFriendly:true, kidNote:'Beachfront RV camping between San Diego Bay and the Pacific on the Coronado strand.'},
    fees:{nightlyMin:65, nightlyMax:85, note:'Inland row $65, beach row $85 per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'619-435-5184', url:'https://www.parks.ca.gov/654', address:'5000 Highway 75, Coronado, CA 92118'},
    caut:['Self-contained RVs only (park campground PDF); tents not allowed','Extra vehicle fee applies'],
    src:['https://www.outdoorithm.com/campgrounds/ca/silver-strand-sb/state-beach-campground','https://www.parks.ca.gov/pages/654/files/silverstrandcampground2013.pdf']});

  K('ca-south-carlsbad-campground','South Carlsbad State Beach Campground','South Carlsbad State Beach',CSP,'san-diego','San Diego',33.1016,-117.3186,43,{
    season:{open:'year-round', close:null, note:'Peak March to November.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:223, maxRvFt:35, hookups:'some', hookupNote:'Some sites with hookups; RVs and trailers to 35 ft per third-party mirror. A second listing says 184 sites; count not firm.'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, laundry:true, firepit:true, pets:'limited', ada:true},
    fam:{beach:true, swim:true, kidNote:'Bluff-top camping above the beach with stairs down to the sand. Pets are not allowed on the beach.'},
    fees:{nightlyMin:50, nightlyMax:140, extraVehicle:15, note:'Fees by site type from a third-party mirror' + OD + '; hookup about $95, group $650.'},
    book:RC(),
    contact:{phone:'760-438-3143', url:'https://www.parks.ca.gov/660', address:'7201 Carlsbad Blvd, Carlsbad, CA 92008'},
    caut:['Site count and fees differ between listings; verify on ReserveCalifornia'],
    src:['https://outdoorithm.com/campgrounds/ca/south-carlsbad-sb/state-beach-campground','https://www.parks.ca.gov/AccessibleFeatures/Details/660']});

  K('ca-san-elijo-campground','San Elijo State Beach Campground','San Elijo State Beach',CSP,'san-diego','San Diego',33.0211,-117.2844,49,{
    season:{open:'year-round', close:null, note:'High season March to November.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:171, hookups:'some', hookupNote:'Hookup sites listed; oceanfront sites about 50-65 ft long. No max RV length stated.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited', ada:true},
    fam:{beach:true, swim:true, kidNote:'Cliff-top sites above a surf beach in Cardiff; free beach wheelchairs available.'},
    fees:{nightlyMin:50, nightlyMax:75, note:'Inland $50, oceanfront $70, hookup $75, hike/bike $15 per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'760-753-5091', url:'https://www.parks.ca.gov/659', address:'2050 S Coast Hwy 101, Cardiff, CA 92007'},
    caut:['Site count and fees not confirmed on an official page; verify when booking'],
    src:['https://www.outdoorithm.com/campgrounds/ca/san-elijo-sb/state-beach-campground']});

  K('ca-san-mateo-san-onofre','San Mateo Campground','San Onofre State Beach',CSP,'la-orange','Orange',33.4072,-117.5843,115,{
    season:{open:'year-round', close:null, note:'Peak mid-May to mid-September.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:157, hookups:'some', hookupNote:'Some sites have water and electric; large pull-through sites. Dump station $10.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited', ada:true},
    fam:{beach:true, bikeFriendly:true, kidNote:'Short trail to the Trestles and San Onofre beaches nearby; surf and beach camping area.'},
    fees:{nightlyMin:40, nightlyMax:70, note:'$40 standard, $65-70 hookup per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'949-492-4872', url:'https://www.parks.ca.gov/647', address:'830 Cristianitos Road, San Clemente, CA 92672'},
    caut:['Entrance gate locked 10 pm to 6 am','Hookup fee differs inside the same listing'],
    src:['https://www.outdoorithm.com/campgrounds/ca/san-onofre-sb/mateo-campground','https://www.parks.ca.gov/pages/647/files/SanMateo_CampgroundMap_073124_FINAL.pdf']});

  // ---------- INLAND MOUNTAINS ----------
  K('ca-mesa-silverwood-lake','Mesa Campground','Silverwood Lake State Recreation Area',CSP,'inland-mountains','San Bernardino',34.2841,-117.3452,null,{
    season:{open:'year-round', close:null, note:'Per Dyrt listing; confirm with the park.'},
    status:'open', types:['tent','rv','group'],
    sites:{total:136, maxRvFt:31, hookups:'some', hookupNote:'Full hookups at select sites (Dyrt); RV up to 31 ft. Seven walk-in hike/bike sites per park brochure.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, pets:'limited'},
    fam:{swim:true, boating:true, fishing:true, bikeFriendly:true, kidNote:'Mountain lake with swim beaches and a paved bike trail; boats need quagga mussel inspection.'},
    fees:{nightlyMin:45, nightlyMax:50, note:'Standard $45, full hookup $50 per Dyrt; one FAQ there says ~$55. Group camps $250-350.'},
    book:RC(),
    contact:{phone:'760-389-2281', email:'info@parks.ca.gov', url:'https://www.parks.ca.gov/650', address:'14651 Cedar Circle, Hesperia, CA 92345'},
    caut:['Fees conflict inside the listing; confirm when booking','Quarter-operated showers'],
    src:['https://thedyrt.com/camping/california/silverwood-lake-sra','https://www.parks.ca.gov/pages/650/files/silverwoodfinalweblayout11092010.pdf']});

  K('ca-serrano-big-bear','Serrano Campground','San Bernardino National Forest',USFS,'inland-mountains','San Bernardino',34.2663,-116.9116,6800,{
    season:{open:'late Mar', close:'Nov 30', note:'USFS page says March 27 to November 29; other listing says March 7 to November 29. Confirm.'},
    status:'seasonal', types:['tent','rv','group'],
    sites:{total:109, hookups:'some', hookupNote:'93 single and 16 double sites; hookup sites exist (USFS page). RV length limit not stated.'},
    amen:{showers:true, flush:true, water:true, dump:true, firepit:true, bearBox:true, pets:'limited', ada:true},
    fam:{rangerPrograms:true, easyTrails:true, kidNote:'North shore of Big Bear Lake with interpretive programs and trails.'},
    fees:{extraVehicle:8, note:'Fee not verified: USFS and third-party pages list conflicting rates ($40-44 single, $51-56 hookup, $56-91 double). Check Recreation.gov.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/232250', phone:'877-444-6777', window:'6 months ahead (per USFS)'},
    contact:{phone:'909-382-2790', url:'https://fs.usda.gov/r05/sanbernardino/recreation/serrano-family-campground', address:'40971 North Shore Drive, Fawnskin, CA (Discovery Center)'},
    caut:['Operator and rate details vary between pages','Fire danger often High in summer'],
    src:['https://fs.usda.gov/r05/sanbernardino/recreation/serrano-family-campground','https://outdoorithm.com/campgrounds/ca/san-bernardino-national-forest/serrano']});

  K('ca-pineknot-big-bear','Pineknot Campground','San Bernardino National Forest',USFS,'inland-mountains','San Bernardino',34.2351,-116.8841,6900,{
    season:{open:null, close:null, note:'USFS page shows 2024 dates (Apr 25 to Oct 19); current dates not verified.'},
    status:null, types:['tent','rv'],
    sites:{total:47, hookups:'none', hookupNote:'RV length not stated.'},
    amen:{water:false, flush:false, showers:false, firepit:null},
    fam:{kidNote:'Forest campground near Big Bear village; the USFS page lists no restrooms and no potable water.'},
    fees:{nightlyMin:34, nightlyMax:34, extraVehicle:8, note:'$34 single site per USFS page (2024 fee period); check current rate.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/232286', phone:'877-444-6777', firstComeNote:'No first-come sites per USFS.'},
    contact:{phone:'909-382-2790', url:'https://fs.usda.gov/r05/sanbernardino/recreation/pineknot-family-campground', address:null},
    caut:['Page may be out of date; confirm restrooms and water before you go','Coordinates are from the USFS Getting There section and may be the approach point'],
    src:['https://fs.usda.gov/r05/sanbernardino/recreation/pineknot-family-campground']});

  K('ca-holcomb-valley-big-bear','Holcomb Valley Campground','San Bernardino National Forest',USFS,'inland-mountains','San Bernardino',34.3026,-116.8959,7379,{
    season:{open:'year-round', close:null, note:'Winter access can be difficult (third-party listing).'},
    status:null, types:['tent','rv'],
    sites:{total:19, hookups:'none', hookupNote:'No water or hookups.'},
    amen:{water:false, vault:true, flush:false, showers:false, firepit:true, bearBox:true, cell:'none'},
    fam:{kidNote:'Remote forest camp on unpaved FS 3N16; high-clearance vehicle recommended.'},
    fees:{note:'Fee not verified.'},
    book:{system:null, url:'https://www.fs.usda.gov/r05/sanbernardino', firstComeNote:'Third-party listing says walk-in only; confirm with the Forest Service.'},
    contact:{phone:'909-382-2790', url:'https://www.fs.usda.gov/r05/sanbernardino', address:null},
    caut:['Bring all water','Unpaved narrow access road','Phone is the Big Bear Discovery Center, not the campground'],
    src:['https://outdoorithm.com/campgrounds/Recreation.gov:249733:1071','https://fs.usda.gov/r05/sanbernardino/recreation/pineknot-family-campground']});

  K('ca-idyllwild-county-park','Idyllwild Park Campground','Idyllwild Park (Riverside County)','Riverside County Regional Park','inland-mountains','Riverside',33.744,-116.723,5249,{
    status:'open', types:['tent','rv'],
    sites:{total:88, hookups:'none', hookupNote:'Dry camping; no dump station on site.'},
    amen:{showers:true, flush:true, water:true, dump:false, firepit:true, pets:'yes'},
    fam:{easyTrails:true, nearTown:true, kidNote:'Forested sites with a nature center and amphitheatre; grocery and gas half a mile away in Idyllwild.'},
    fees:{nightlyMin:30, nightlyMax:35, extraVehicle:6, note:'$30-35 per night covers 6 people and 2 vehicles; pets $2 per day (county page).'},
    book:{system:'Riverside County Parks', url:'https://rivcoparks.org/node/376'},
    contact:{phone:'951-659-2656', url:'https://rivcoparks.org/node/376', address:'54000 Riverside County Playground Rd., Idyllwild, CA 92549'},
    caut:['Phone and coordinates from Campendium listing; the county page lists no camp phone','Stay limit 14 days in any 28'],
    src:['https://rivcoparks.org/node/376','https://www.campendium.com/idyllwild-park']});

  K('ca-lake-hemet-campground','Lake Hemet Campground','Lake Hemet','Lake Hemet Municipal Water District (concession)','inland-mountains','Riverside',33.6697,-116.6747,4330,{
    season:{open:'year-round', close:null, note:'Swim zone generally Memorial Day to Labor Day weekend; trout stocking about November to May.'},
    status:'open', types:['tent','rv'],
    sites:{total:null, hookups:'some', hookupNote:'Full-hookup and dry sites (campground FAQ).'},
    amen:{pets:'limited'},
    fam:{fishing:true, boating:true, swim:true, kidNote:'Lake camping about 8 miles from Idyllwild.'},
    fees:{note:'Nightly rate not verified (FAQ lists $25 for a second vehicle). See golakehemet.com.'},
    book:{system:'golakehemet.com', url:'https://golakehemet.com/', phone:'951-659-2680', cancelNote:'Changes and cancellations allowed until 72 hours before arrival with a $9 change fee (FAQ).'},
    contact:{phone:'951-659-2680', url:'https://golakehemet.com/faqs', address:'56570 Highway 74, Mountain Center, CA 92561'},
    caut:['Dogs up to two per site, leashed, not in lake','Site count (listed as 600 on Campendium) not verified'],
    src:['https://golakehemet.com/faqs','https://www.campendium.com/lake-hemet-campground']});

  K('ca-idyllwild-campground-msj','Idyllwild Campground','Mount San Jacinto State Park',CSP,'inland-mountains','Riverside',33.7489,-116.7153,5400,{
    season:{open:'year-round', close:null, note:'Winter may need snow chains.'},
    status:'open', types:['tent','rv'],
    sites:{total:28, maxRvFt:24, hookups:'some', hookupNote:'Tent, electric and full-hookup sites; 24 ft max trailer or motorhome.'},
    amen:{showers:true, flush:true, water:true, firepit:true, bearBox:true, ada:true},
    fam:{nearTown:true, kidNote:'Pine forest camp near Idyllwild village and the trail network.'},
    fees:{nightlyMin:25, nightlyMax:45, extraVehicle:10, note:'Tent $25, electric $35, full hookup $45 per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'951-659-2607', url:'https://www.parks.ca.gov/636', address:'25905 Highway 243, Idyllwild, CA 92549'},
    caut:['Max stay 15 nights; 8 guests per site'],
    src:['https://www.outdoorithm.com/campgrounds/ca/mt-san-jacinto-sp/idyllwild-campground']});

  K('ca-stone-creek-mt-san-jacinto','Stone Creek Campground','Mount San Jacinto State Park',CSP,'inland-mountains','Riverside',33.7853,-116.7476,5883,{
    season:{open:null, close:null, note:'Open spring through fall, closed in winter per third-party listing; confirm dates.'},
    status:'seasonal', types:['tent','rv'],
    sites:{total:44, hookups:'some', hookupNote:'Electric sites; RV length not stated.'},
    amen:{showers:false, vault:true, flush:false, water:true, firepit:true, ada:true, cell:'none'},
    fam:{kidNote:'Quieter, higher camp on Highway 243 north of Idyllwild; no showers.'},
    fees:{nightlyMin:25, nightlyMax:45, extraVehicle:10, note:'Tent $25, electric $35, full hookup $45 per third-party mirror' + OD + '.'},
    book:RC(),
    contact:{phone:'951-659-2607', url:'https://www.parks.ca.gov/636', address:'Highway 243, Idyllwild, CA 92549'},
    caut:['Fire bans can close the campground','Snow on Highway 243 in winter'],
    src:['https://www.outdoorithm.com/campgrounds/ca/mt-san-jacinto-sp/stone-creek-campground']});

  // ---------- MOJAVE STATE PARKS ----------
  K('ca-ricardo-red-rock-canyon','Ricardo Campground','Red Rock Canyon State Park',CSP,'death-valley-mojave','Kern',35.3715,-117.9946,2621,{
    season:{open:'year-round', close:null, note:'Spring and autumn peak.'},
    status:'open', types:['tent','rv'],
    sites:{total:50, maxRvFt:30, hookups:'none', hookupNote:'No hookups.'},
    amen:{showers:false, flush:false, vault:true, water:true, firepit:true, pets:'limited', ada:true},
    fam:{easyTrails:true, kidNote:'Colorful desert cliffs; dogs not allowed on trails.'},
    fees:{nightlyMin:25, nightlyMax:25, extraVehicle:6, note:'$25 standard, $23 seniors per third-party mirror' + OD + '.'},
    book:{system:'First come, first served', url:'https://www.parks.ca.gov/631', firstComeNote:'Self-registration; no reservations per third-party listing.'},
    contact:{phone:'661-946-6092', url:'https://www.parks.ca.gov/631', address:'377 Abbott Dr, Cantil, CA 93519'},
    caut:['Third-party listing only; confirm fees with the park'],
    src:['https://www.outdoorithm.com/campgrounds/ca/red-rock-canyon-sp/ricardo-campground']});

  K('ca-providence-mountains-sra','Providence Mountains SRA Campground','Providence Mountains State Recreation Area',CSP,'death-valley-mojave','San Bernardino',34.9434,-115.5122,4300,{
    season:{open:null, close:null, note:'Third-party listing: Friday-Sunday and holiday Mondays, September to June; closed July-August.'},
    status:'limited', statusNote:'Weekend-only camping per third-party listing; confirm.',
    types:['tent'],
    sites:{total:5, hookups:'none', hookupNote:'No RVs allowed; narrow winding road.'},
    amen:{water:false, vault:null, flush:null, showers:false, firepit:true, cell:'none', pets:'limited'},
    fam:{kidNote:'Remote desert camp below the Providence Mountains; Mitchell Caverns tours at the visitor center.'},
    fees:{nightlyMin:20, nightlyMax:25, extraVehicle:10, note:'Third-party listing says $20, official text quoted there says $25.'},
    book:RC({firstComeNote:'Reservation required; no walk-up sites (third-party listing).'}),
    contact:{phone:'760-928-2586', url:'https://www.parks.ca.gov/615', address:'PO Box 1, Essex, CA 92332'},
    caut:['No potable water: bring everything','Nearest fuel Fenner (24 mi), hospital Needles (56 mi)','Gate closes at 5 pm'],
    src:['https://outdoorithm.com/campgrounds/ca/providence-mountains-sra/state-recreation-campground','https://en.wikipedia.org/wiki/Providence_Mountains_State_Recreation_Area']});
})();
