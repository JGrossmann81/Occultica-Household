/* Campica data pack: Southern California coast and Los Padres campgrounds (top-up). Facts only from sources in SOURCES-camps-south3.md. Null = not verified. */
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
  function RC(extra){ return mix({system:'reservecalifornia', url:'https://www.reservecalifornia.com/', phone:'800-444-7275', window:RC_WINDOW, cancelNote:RC_CANCEL}, extra); }
  var CSP = 'California State Parks';
  var USFS = 'USDA Forest Service';
  var OD = 'Fee and details from an Outdoorithm mirror of ReserveCalifornia data (read 2026-10); confirm at booking.';

  K('ca-jalama-beach-county-park','Jalama Beach County Park Campground','Jalama Beach County Park','Santa Barbara County Parks','santa-barbara-ventura','Santa Barbara',34.5098,-120.5009,null,{
    status:null, types:['tent','rv','cabin'],
    sites:{total:117, maxRvFt:40, hookups:'partial', hookupNote:'A Campendium listing shows some sites with 20/30 amp power and many with none; confirm your site type when booking.'},
    amen:{showers:true, water:true, dump:true, store:true, firepit:null, pets:'limited'},
    fam:{beach:true, playground:true, fishing:true, kidNote:'Oceanfront camping on a remote beach with a playground and an on-site grill and store. Dogs may use the beach for a per-dog daily fee (county tourism page).'},
    fees:{nightlyMin:30, note:'Tourism page says sites start at $30 a night; reviewers on Campendium report up to about $65 for beach sites. Confirm with the county.'},
    book:{system:'county', url:'https://explorelompoc.com/jalama-beach', phone:'805-568-2460', window:null, firstComeNote:'Reservations strongly recommended; reviewers say it books months ahead.', cancelNote:null},
    contact:{phone:'805-568-2460', url:'https://explorelompoc.com/jalama-beach', address:'9999 Jalama Road, Lompoc, CA 93436'},
    hi:['Oceanfront sites on a quiet stretch of coast','Beach Grill on site','Cabins also available'],
    caut:['Gate line 805-736-3504 is not for reservations (per county tourism page)','Narrow turns to upper sites can be hard for big rigs (reviewers)','Long, winding road in; fill fuel and groceries before leaving Highway 1/101'],
    src:['https://explorelompoc.com/jalama-beach','https://www.campendium.com/jalama-beach-county-park']});

  K('ca-gaviota-state-park','Gaviota Campground','Gaviota State Park',CSP,'santa-barbara-ventura','Santa Barbara',34.4724,-120.2285,null,{
    season:{open:'Apr 1', close:'Oct 1', note:'Outdoorithm mirror says closed Oct 1 to Apr 1; confirm with the park, as seasons change.'},
    status:null, types:['tent','rv'],
    sites:{total:40, maxRvFt:25, hookups:'none', hookupNote:'No electric or site water hookups; potable water in camp.'},
    amen:{showers:true, flush:true, water:true, pets:'limited'},
    fam:{beach:true, kidNote:'The beach is a short walk from camp. Pets are allowed in the campground but not on the beach.'},
    fees:{nightlyMin:45, reservationFee:8.25, note:OD+' Hike/bike site is $10.'},
    book:RC(),
    contact:{phone:'805-968-1033', url:'https://www.parks.ca.gov/?page_id=606', address:null},
    hi:['40 sites near a beach 33 miles west of Santa Barbara','Hike/bike sites available'],
    caut:['Season dates came from a third-party mirror: verify before you drive out','Reviewers mention foxtails at some sites'],
    src:['https://www.outdoorithm.com/campgrounds/ca/gaviota-sp/campground','https://demo2.parks.ca.gov/pages/606/files/gaviotastateparkcampgroundmap.pdf']});

  K('ca-cachuma-lake-recreation-area','Cachuma Lake Recreation Area','Cachuma Lake Recreation Area','Santa Barbara County Parks','santa-barbara-ventura','Santa Barbara',34.5733,-119.9589,790,{
    status:null, types:['tent','rv','group'],
    sites:{total:420, hookups:'varies', hookupNote:'Campendium lists 20/30 amp, water, sewer, full hookups and dry sites. Some full-hookup sites were limited by construction (reviewers).'},
    amen:{showers:true, flush:true, water:true, dump:true, store:true, pets:'yes'},
    fam:{fishing:true, boating:true, kidNote:'Lake with boat ramp and rentals, an on-site store and restaurant, and a dog park.'},
    fees:{note:'Rates were only seen as reviewer reports ($40 to $65), so no fee is stored; see the county page or call.'},
    book:{system:'county', url:'https://www.campendium.com/cachuma-lake-recreation-area', phone:'805-686-5055', window:null, firstComeNote:null, cancelNote:null},
    contact:{phone:'805-686-5055', url:null, address:'64 Lake View Dr., Santa Barbara, CA 93105'},
    hi:['Lake camping with fishing and boat rentals','Hookup, tent and group sites'],
    caut:['Campendium reviewers mention dust and ground-squirrel holes','Details come from a third-party listing: confirm with the park'],
    src:['https://www.campendium.com/cachuma-lake-recreation-area']});

  K('ca-lake-casitas-recreation-area','Lake Casitas Recreation Area','Lake Casitas Recreation Area','Casitas Municipal Water District','santa-barbara-ventura','Ventura',34.4165,-119.3381,null,{
    status:null, types:['tent','rv'],
    sites:{total:445, maxRvFt:null, hookups:'varies', hookupNote:'Campendium lists 20/30/50 amp electric, water and sewer on some sites.'},
    amen:{showers:true, dump:true, store:true, pets:'limited'},
    fam:{fishing:true, boating:true, swim:false, kidNote:'No body contact with the lake is allowed (district rules), so the kids cannot swim in it; a separate paid water park is listed by reviewers.'},
    fees:{note:'Current rates show only on the district booking calendar; third-party figures varied too widely to store.'},
    book:{system:'casitas', url:'https://reservations.casitaswater.org', phone:'805-649-1122', window:null, firstComeNote:null, cancelNote:null},
    contact:{phone:'805-649-2233', url:'https://reservations.casitaswater.org', address:'11311 Santa Ana Rd., Ventura, CA 93001'},
    hi:['Large lakeside campground with boat ramp and general store','Max 8 people and 2 vehicles per site'],
    caut:['Canoes, kayaks, paddle boards and inflatables are not permitted; boats go through an inspection and quarantine (district rules)','Dogs must stay 50 ft from the shoreline and streams','Latest entry 10 pm; quiet hours 10 pm to 8 am'],
    src:['https://reservations.casitaswater.org','https://campendium.com/lake-casitas-recreation-area']});

  K('ca-faria-beach-county-park','Faria Beach Park Campground','Faria Beach Park','Ventura County Parks','santa-barbara-ventura','Ventura',null,null,null,{
    status:null, types:['tent','rv'],
    sites:{total:42, hookups:'varies', hookupNote:'Sites 14-24 are full hookup (50/30/20 amp); sites 39-42 also hookup. Sites 25-38 are non-campfire.'},
    amen:{showers:true, flush:true, wifi:true, store:true, pets:'limited'},
    fam:{beach:true, kidNote:'Beachfront camping with a concession stand. Dogs are allowed on a 6-ft leash for a $1 daily charge per dog.'},
    fees:{nightlyMin:35, nightlyMax:58, note:'County schedule: $35 to $50 weekdays, up to $58 on weekends/holidays depending on site group.'},
    book:{system:null, url:'https://visitventuraca.com/?p=10086519', phone:null, window:null, firstComeNote:null, cancelNote:null},
    contact:{phone:null, url:'https://parks.venturacounty.gov/', address:'4350 Pacific Coast Hwy, Ventura, CA 93001'},
    hi:['Camp on the sand beside Pacific Coast Highway','Hookup and non-hookup sites'],
    caut:['Quiet hours 9 pm to 7 am; no generators','Max 6 people per site; each extra vehicle pays a camping fee','Day-use parking is extremely limited'],
    src:['https://visitventuraca.com/?p=10086519']});

  K('ca-emma-wood-group-ventura','Emma Wood State Beach Group Campground','Emma Wood State Beach',CSP,'santa-barbara-ventura','Ventura',null,null,null,{
    status:null, types:['group','tent','rv'],
    sites:{hookups:'none', hookupNote:'No electric or water hookups. Tent group sites and RV group sites are separate areas; RVs up to 45 ft.'},
    amen:{showers:true, flush:true, water:true, firepit:true, pets:'limited'},
    fam:{beach:true, kidNote:'Beach about a 3-minute walk from most sites.'},
    fees:{nightlyMin:130, nightlyMax:360, note:'Group rates ($130 tent group, $360 RV group) as listed on an Outdoorithm mirror of ReserveCalifornia data (read 2026-10); confirm at booking.'},
    book:RC(),
    contact:{phone:'805-968-1033', url:'https://www.parks.ca.gov/?page_id=604', address:'State Beach Access Rd., Ventura, CA 93001 (Campendium)'},
    hi:['Group camping steps from the beach'],
    caut:['Highway 101 and train tracks are close, so noise is strong','High tides can close the campground','The separate North Beach campground was reported closed for repairs; check parks.ca.gov'],
    src:['https://www.outdoorithm.com/campgrounds/ca/emma-wood-sb/state-beach-group-campground','https://campendium.com/emma-wood-state-beach']});

  K('ca-wheeler-gorge-los-padres','Wheeler Gorge Campground','Los Padres National Forest',USFS,'santa-barbara-ventura','Ventura',null,null,null,{
    season:{open:'year-round', close:null, note:null}, status:'open', types:['tent','rv'],
    sites:{maxRvFt:35, hookups:'none', hookupNote:'Nonelectric loop; no drinking water in camp.'},
    amen:{water:false, vault:true, wifi:false, firepit:true, cell:'none'},
    fam:{fishing:true, swim:true, kidNote:'A small swimming hole sits near the highway. Stream is not stocked.'},
    fees:{note:'Base nightly fee not listed on the recreation.gov page. Extra person over 6 and a second vehicle are $10 each per night.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/232138', phone:'805-434-1996', window:null, firstComeNote:'Some sites are first-come, first-served.', cancelNote:null},
    contact:{phone:'805-434-1996', url:'https://www.recreation.gov/camping/campgrounds/232138', address:'1190 E. Ojai Ave., Ojai, CA 93023'},
    hi:['Streamside camp on Highway 33 north of Ojai'],
    caut:['Bring all drinking and washing water','Gate locks at 10 pm','Poison oak possible; summer highs near 95 F'],
    src:['https://www.recreation.gov/camping/campgrounds/232138']});

  K('ca-reyes-peak-los-padres','Reyes Peak Campground','Los Padres National Forest',USFS,'santa-barbara-ventura','Ventura',null,null,7000,{
    status:null, types:['tent'],
    sites:{total:6, hookups:'none', hookupNote:'Tent-only, nonelectric.'},
    amen:{water:false, vault:true, showers:false, firepit:true, cell:'spotty'},
    fees:{note:'Base fee not listed on the recreation.gov page. Each extra vehicle is $10.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/273844', phone:'805-434-1996', window:null, firstComeNote:'Two-night minimum on weekends and three nights on holidays.', cancelNote:null},
    contact:{phone:'805-434-1996', url:'https://www.recreation.gov/camping/campgrounds/273844', address:null},
    hi:['Six high-country tent sites at about 7,000 ft'],
    caut:['No water; bring all you need','Fires only in Forest Service rings; restrictions can apply','Nearest stores about 15 miles south in Ojai','Season not listed: check road and weather conditions with the Ojai Ranger District'],
    src:['https://www.recreation.gov/camping/campgrounds/273844']});

  K('ca-upper-oso-los-padres','Upper Oso Campground','Los Padres National Forest',USFS,'santa-barbara-ventura','Santa Barbara',null,null,1040,{
    season:{open:'year-round', close:null, note:'Closures can happen in winter when river levels change.'}, status:null, types:['tent','rv'],
    sites:{hookups:'none', hookupNote:'About two dozen sites; roughly 10 have horse corrals and long paved spurs.'},
    amen:{water:true, flush:true, firepit:null},
    fam:{kidNote:'Creekside forest camp near Lake Cachuma with drinking water throughout.'},
    fees:{note:'Base fee not listed on the recreation.gov page. $10 per extra vehicle and $10 per person beyond 6.'},
    book:{system:'recreation.gov', url:'https://www.recreation.gov/camping/campgrounds/231961', phone:'805-434-1996', window:null, firstComeNote:'Some sites first-come, first-served.', cancelNote:null},
    contact:{phone:'805-434-1996', url:'https://www.recreation.gov/camping/campgrounds/231961', address:null},
    hi:['Drinking water and flush toilets in a forest camp','Firewood sold by the host'],
    caut:['Winter river crossings can close the campground','Poison oak possible'],
    src:['https://www.recreation.gov/camping/campgrounds/231961']});

  K('ca-lake-piru-recreation-area','Lake Piru Recreation Area','Lake Piru Recreation Area','United Water Conservation District','santa-barbara-ventura','Ventura',34.4754,-118.7642,null,{
    status:null, types:['tent','rv'],
    sites:{total:250, maxRvFt:40, hookups:'varies', hookupNote:'Basic, electric and full-hookup sites (district fee schedule).'},
    amen:{showers:true, dump:true, store:true, pets:'yes'},
    fam:{swim:true, boating:true, fishing:true, kidNote:'Swimming beach, boat ramp and rentals, and a dog run (Campendium). Check current swim rules with the district.'},
    fees:{nightlyMin:28, nightlyMax:56, reservationFee:10, extraVehicle:20, note:'District fee schedule effective May 2024: basic $28 (Oct-Mar) / $36 (Apr-Sep); electric $32 / $43; full hookup $45 / $56. Dump $9 per use. Fees may have changed since.'},
    book:{system:'district', url:'https://www.unitedwater.org/', phone:'805-521-1500', window:null, firstComeNote:null, cancelNote:'$10 cancellation fee and $10 site-change fee per the 2024 schedule.'},
    contact:{phone:'805-521-1500', url:'https://www.unitedwater.org/', address:'4780 Piru Canyon Rd., Piru/Castaic, CA 91384 (Campendium)'},
    hi:['Large lake campground with swim beach and marina'],
    caut:['Phone and coordinates come from a third-party listing; fees from a 2024 district PDF'],
    src:['https://www.unitedwater.org/wp-content/uploads/2024/04/2024-04-10-LPRA-Fee-Schedule-Effective-10-May-2024.pdf','https://campendium.com/lake-piru-recreation-area']});

  K('ca-doheny-state-beach','Doheny State Beach Campground','Doheny State Beach',CSP,'la-orange','Orange',33.4622,-117.6804,null,{
    season:{open:'year-round', close:null, note:null}, status:null, types:['tent','rv'],
    sites:{total:113, hookups:'none', hookupNote:'No electric or site water hookups; 33 premium beachfront sites. Dump station listed.'},
    amen:{showers:true, water:true, dump:true, firepit:true, pets:'limited'},
    fam:{beach:true, swim:true, kidNote:'Swimming area and tide pools at the north end. Dogs are allowed in camp but not on the beach.'},
    fees:{nightlyMin:40, nightlyMax:65, extraVehicle:15, note:'Mirror lists $40 standard and $65 beachside, but another line said $50 for standard; confirm at booking.'},
    book:RC(),
    contact:{phone:'949-496-6171', url:'https://www.parks.ca.gov/?page_id=642', address:'25300 Dana Point Harbor Drive, Dana Point, CA 92629'},
    hi:['Beachfront camping next to Dana Point Harbor'],
    caut:['Fires only in designated rings','Fees conflict between listings'],
    src:['https://www.outdoorithm.com/campgrounds/ca/doheny-sb/state-beach-campground']});

  K('ca-san-clemente-state-beach','San Clemente State Beach Campground','San Clemente State Beach',CSP,'la-orange','Orange',33.4023,-117.6011,null,{
    season:{open:'year-round', close:null, note:null}, status:null, types:['tent','rv'],
    sites:{total:159, maxRvFt:30, hookups:'varies', hookupNote:'Some full-hookup sites (electric, water, sewer); dump station.'},
    amen:{showers:true, flush:true, water:true, dump:true, pets:'limited'},
    fam:{beach:true, kidNote:'Mile-long beach below the bluffs, reached by steep trails. Dogs not allowed on trails or beach.'},
    fees:{nightlyMin:25, nightlyMax:45, note:OD+' $25 standard, $45 hookup; extra vehicles cost more.'},
    book:RC(),
    contact:{phone:'949-492-3156', url:'https://www.parks.ca.gov/?page_id=646', address:'225 Avenida Calafia, San Clemente, CA 92672'},
    hi:['Bluff-top camp with hookup sites above a mile of beach'],
    caut:['Entrance construction may cause delays (mirror)','Phone is the campground provider line; park office may differ'],
    src:['https://www.outdoorithm.com/campgrounds/ca/san-clemente-sb/rv-campground']});

  K('ca-bolsa-chica-state-beach','Bolsa Chica State Beach Campground','Bolsa Chica State Beach',CSP,'la-orange','Orange',33.6914,-118.0438,null,{
    season:{open:'year-round', close:null, note:null}, status:'open', types:['rv'],
    sites:{total:50, hookups:'none', hookupNote:'Self-contained RVs and trailers only; no tents or car camping.'},
    amen:{showers:null, water:null, dump:null, pets:'limited'},
    fam:{beach:true, kidNote:'Beachfront RV camping. Dogs are not allowed on the sand.'},
    fees:{nightlyMin:60, nightlyMax:70, note:'Official flyer: beachside $70, back row $60; seniors 62+ get $2 off. Includes passes for 2 vehicles.'},
    book:RC(),
    contact:{phone:'714-377-5691', url:'https://www.parks.ca.gov/?page_id=642', address:'17851 Pacific Coast Highway, Huntington Beach, CA 92649'},
    hi:['Camp directly on the beach in Huntington Beach'],
    caut:['Self-contained RVs only: tents are not allowed','Stay limit 7 days in peak season, 14 off-peak, 30 per year','Park office phone hours 9 am to 4 pm'],
    src:['https://www.parks.ca.gov/pages/642/files/Camping Regulations Flyer (Updated 2023)v.2.pdf','https://www.outdoorithm.com/campgrounds/ca/bolsa-chica-sb/state-beach-campground']});

  K('ca-crystal-cove-backcountry','Crystal Cove Backcountry Camping','Crystal Cove State Park',CSP,'la-orange','Orange',null,null,null,{
    status:null, types:['tent','hike-in'],
    sites:{hookups:'none', hookupNote:'Three primitive hike-in areas reached by a strenuous 3 to 4 mile uphill hike.'},
    amen:{water:false, firepit:false, pets:'no'},
    fam:{kidNote:'Strenuous; pack in all water. No pets (service animals only) and no open flames.'},
    fees:{note:'Fees not listed on the park brochure; see ReserveCalifornia.'},
    book:RC(),
    contact:{phone:null, url:'https://www.parks.ca.gov/crystalcove', address:null},
    hi:['Primitive backcountry sites above the coast'],
    caut:['Reservations required','Carry all water in and all trash out'],
    src:['https://www.parks.ca.gov/pages/644/files/CrystalCoveFinalWebLayout2019.pdf']});
})();
