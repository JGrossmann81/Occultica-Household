/* Campica data pack: family camping trip ideas (California and beyond).
   IMPORTANT: written from general knowledge; the build session could not read the official pages (see SOURCES-camp101.md, section Trips).
   Every idea therefore carries verified:false, src (official agency home pages to check) and asof. No fees, permit rules or road status are stated as fact.
   lat/lon is an APPROXIMATE anchor (rounded to 0.1 degree, about 7 miles) for "distance from me" only. */
window.CAMPTRIPS = window.CAMPTRIPS || { items: [] };
(function () {
  var A = window.CAMPTRIPS.items, ASOF = '2026-10';
  var P = {
    yose: 'https://www.nps.gov/yose/', seki: 'https://www.nps.gov/seki/', chis: 'https://www.nps.gov/chis/', jotr: 'https://www.nps.gov/jotr/', deva: 'https://www.nps.gov/deva/',
    lavo: 'https://www.nps.gov/lavo/', redw: 'https://www.nps.gov/redw/', pinn: 'https://www.nps.gov/pinn/', zion: 'https://www.nps.gov/zion/', brca: 'https://www.nps.gov/brca/',
    arch: 'https://www.nps.gov/arch/', cany: 'https://www.nps.gov/cany/', grca: 'https://www.nps.gov/grca/', yell: 'https://www.nps.gov/yell/', grte: 'https://www.nps.gov/grte/',
    glac: 'https://www.nps.gov/glac/', olym: 'https://www.nps.gov/olym/', crla: 'https://www.nps.gov/crla/', grsa: 'https://www.nps.gov/grsa/', acad: 'https://www.nps.gov/acad/',
    grsm: 'https://www.nps.gov/grsm/', asis: 'https://www.nps.gov/asis/', care: 'https://www.nps.gov/care/', moja: 'https://www.nps.gov/moja/', labe: 'https://www.nps.gov/labe/',
    ca: 'https://www.parks.ca.gov/', rc: 'https://www.recreation.gov/', inyo: 'https://www.fs.usda.gov/inyo', ltbmu: 'https://www.fs.usda.gov/ltbmu', or: 'https://stateparks.oregon.gov/',
    pore: 'https://www.nps.gov/pore/', shta: 'https://www.fs.usda.gov/shasta-trinity', romo: 'https://www.nps.gov/romo/'
  };
  /* T(id,title,region,season,days,diff,ages,theme,lat,lon,summary,itinerary,campIds,campNames,kid,cautions,booking,srcKeys,drive) */
  function T(id, title, region, season, days, diff, ages, theme, lat, lon, summary, it, campIds, campNames, kid, cautions, booking, srcKeys, drive) {
    A.push({ id: id, title: title, region: region, season: season, days: days, drive: drive || null, difficulty: diff, ages: ages, theme: theme, lat: lat, lon: lon, summary: summary,
      itinerary: it.map(function (t, i) { return { day: i + 1, text: t }; }), campIds: campIds, campNames: campNames, kidHighlights: kid, cautions: cautions, bookingTips: booking,
      src: srcKeys.map(function (k) { return P[k]; }), asof: ASOF, verified: false });
  }
  var ALL = ['spring', 'summer', 'fall', 'winter'], SSF = ['spring', 'summer', 'fall'], SS = ['summer'];
  var CAUTION_ROADS = 'Road, trail and campground status can change with snow, fire or landslides. Check the official page before you go.';
  var BOOK = 'Popular campgrounds fill months ahead on the reservation system. Look at the official page for the booking window.';

  /* ===== California: coast and redwoods ===== */
  T('ca-redwoods-prairie-creek', 'Redwoods and elk: Prairie Creek long weekend', 'North Coast', SSF.concat('winter'), 3, 'easy', 'All ages (toddlers fine on short trails)', ['redwoods', 'wildlife', 'beach'], 41.4, -124.0,
    'Tall old-growth forest, a beach with big elk on the prairie, and flat easy trails right from camp.',
    ['Arrive, set up under the trees, and take a short stroll near camp. Look for elk in the open meadow near the visitor center.', 'Walk an easy old-growth loop in the morning. Afternoon at the beach and tide pools at low tide.', 'Pack up, a last short walk, and head out. Allow extra time on narrow coastal highways.'],
    ['ca-elk-prairie-prairie-creek', 'ca-gold-bluffs-beach-prairie-creek', 'ca-mill-creek-del-norte-coast', 'ca-jedediah-smith-campground'], ['Elk Prairie Campground', 'Gold Bluffs Beach Campground'],
    ['Giant trees to hug and measure with the family', 'Roosevelt elk near the road (watch from a distance)', 'Junior Ranger booklet at the visitor center'],
    ['Fog and rain are likely any time of year; bring layers and rain gear.', 'Never approach elk; stay far back, especially in fall rut.', CAUTION_ROADS], [BOOK + ' California state park sites are booked on ReserveCalifornia.'], ['redw', 'ca'], 'about 5-6 h from the Bay Area (approx)');

  T('ca-humboldt-avenue-giants', 'Avenue of the Giants family camp', 'North Coast', SSF, 3, 'easy', 'All ages', ['redwoods', 'first-timer', 'rivers'], 40.3, -124.0,
    'A gentle redwood trip with a scenic drive, river beaches for summer play and short level walks.',
    ['Arrive and set up at a redwood campground. A short walk in the grove at dusk.', 'Drive the Avenue of the Giants, stopping at pull-outs and short loops. Swim or wade at a river bar in warm weather if the water is low and calm.', 'Pack up and take one more grove walk on the way out.'],
    ['ca-albee-creek-humboldt-redwoods', 'ca-burlington-humboldt-redwoods'], ['Burlington Campground', 'Albee Creek Campground'],
    ['Walk through hollow trees', 'River beaches and skipping stones', 'A visitor center with kids’ exhibits'],
    ['Rivers run cold and fast in spring. Keep children at the edge and supervised.', CAUTION_ROADS], [BOOK], ['redw', 'ca'], 'about 3.5-4.5 h from the Bay Area (approx)');

  T('ca-mendocino-richardson', 'Redwood grove and river: Richardson Grove', 'North Coast', SSF, 2, 'easy', 'All ages', ['redwoods', 'first-timer', 'rivers'], 40.0, -123.8,
    'A small, quiet redwood grove right off the highway with river access. Good for a first or short trip.',
    ['Arrive and set up. Walk the nature trail near the campground.', 'Morning walk and river time (summer), then drive home or continue to the coast.'],
    ['ca-richardson-grove', 'ca-benbow-lake-sra'], ['Richardson Grove State Park', 'Benbow Lake SRA'],
    ['Easy trails from camp', 'Splashing in the river in summer', 'A nearby small-town stop for ice cream'],
    ['The highway is close, so tents can be noisy.', CAUTION_ROADS], [BOOK], ['ca'], 'about 3-4 h from the Bay Area (approx)');

  T('ca-point-reyes-marin', 'Marin and Point Reyes weekend', 'Bay Area', ALL, 2, 'easy', 'All ages', ['beach', 'wildlife', 'first-timer', 'redwoods'], 38.0, -122.8,
    'A Bay Area classic: redwoods at Samuel P. Taylor, then a day on the Point Reyes coast for beaches, elk and lighthouses.',
    ['Set up in the redwoods and walk the creek trail.', 'Spend the day at Point Reyes: a beach, the elk reserve and a stop at the visitor center. Check the lighthouse stairs and wind.'],
    ['ca-samuel-p-taylor'], ['Samuel P. Taylor State Park campground'],
    ['Tule elk', 'Tide pools at low tide', 'A long, flat beach for running'],
    ['Wind and fog are common on the coast. Do not go near cliff edges.', 'Check for beach and rock safety: rogue waves.'], [BOOK], ['pore', 'ca'], 'about 1-1.5 h from San Francisco (approx)');

  T('ca-angel-island', 'Angel Island: island camping by ferry', 'Bay Area', ['spring', 'summer', 'fall'], 2, 'moderate', 'Ages 5 and up', ['islands', 'history', 'first-timer'], 37.9, -122.4,
    'Camp on an island in San Francisco Bay: ferry ride, a loop road for bikes, history at the immigration station and sweeping views.',
    ['Ferry over, hike or carry gear to the environmental campsites, set up and look at the view.', 'Walk or bike the loop road, visit the immigration station and take the ferry home.'],
    ['ca-angel-island-environmental'], ['Angel Island environmental campsites'],
    ['The ferry ride', 'Biking the loop road', 'History tour'],
    ['You carry gear a distance and must catch the last ferry. Check the schedule.', 'The sites are walk-in with limited amenities.'], ['Sites are few and book fast. Ferry tickets are separate.'], ['ca'], null);

  T('ca-half-moon-bay', 'Half Moon Bay beach camp', 'Bay Area', ALL, 2, 'easy', 'All ages', ['beach', 'first-timer', 'rv-friendly'], 37.5, -122.4,
    'An easy beach camp close to the Bay Area with tide pools, tidal flats and farm stands nearby.',
    ['Arrive and set up. Walk the beach at sunset.', 'Pancake breakfast, then tide pools and a stop at a farm stand or pumpkin patch in fall.'],
    ['ca-francis-beach-half-moon-bay'], ['Half Moon Bay State Beach campground (Francis Beach)'],
    ['Beachcombing', 'Fog-free sunsets when it clears', 'Fall pumpkin patches nearby'],
    ['The water is cold with strong currents. Wading only; keep eyes on the waves.', 'Wind can be strong; bring a windbreak.'], [BOOK], ['ca'], 'about 45 min from San Francisco (approx)');

  T('ca-santa-cruz-coast', 'Santa Cruz beaches and redwoods', 'Central Coast', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['beach', 'redwoods', 'first-timer'], 36.9, -121.9,
    'Beach camping at the edge of Monterey Bay, with the boardwalk and redwoods nearby for variety.',
    ['Set up and walk the beach.', 'A day at a state beach and the boardwalk. Dinner back at camp.', 'Visit a nearby redwood grove on the way home.'],
    ['ca-new-brighton-state-beach', 'ca-sunset-state-beach'], ['New Brighton State Beach Campground', 'Sunset State Beach Campground'],
    ['Beach play', 'Boardwalk rides (separate cost)', 'Tide pools and wildlife viewing'],
    ['Cold water and rip currents. Always supervise.', 'Fog is common in summer mornings.'], [BOOK], ['ca'], 'about 1.5 h from the Bay Area (approx)');

  T('ca-big-sur', 'Big Sur: redwoods, river and coast', 'Central Coast', ['spring', 'summer', 'fall'], 3, 'moderate', 'Ages 4 and up', ['redwoods', 'beach', 'dark-sky'], 36.3, -121.8,
    'Camp in the redwoods along the Big Sur River, with beaches and waterfalls a short drive away.',
    ['Arrive early, set up in the redwoods and take a short river walk.', 'Drive to a coastal overlook, a beach and a waterfall viewpoint. Dinner back at camp.', 'A slow morning and then head out. Plan your return drive around Highway 1 conditions.'],
    ['ca-pfeiffer-big-sur', 'ca-limekiln-big-sur', 'ca-kirk-creek-big-sur', 'ca-plaskett-creek-big-sur'], ['Pfeiffer Big Sur State Park Campground', 'Limekiln State Park Campground'],
    ['River wading in warm months', 'Waterfall viewpoints', 'A beach with bright rocks'],
    ['Highway 1 has repeated landslide closures; check road status before you leave and have a plan B.', 'Cell service is very limited. Keep gas tank full.', 'Poison oak is common. Stay on trails.'], ['Sites in this area are among the most requested; book at the first chance.'], ['ca'], null);

  T('ca-morro-bay', 'Morro Bay and Montana de Oro', 'Central Coast', ALL, 3, 'easy', 'All ages', ['beach', 'wildlife', 'first-timer'], 35.4, -120.9,
    'A friendly coastal base: kayak the bay, hike dunes and tide pool at a rugged state park.',
    ['Set up and walk by the bay and the Rock.', 'Kayak or paddleboard (guided or rental) in the calm bay, then a beach afternoon.', 'A short bluff walk at Montana de Oro before heading home.'],
    ['ca-morro-bay-state-park', 'ca-morro-strand-state-beach', 'ca-montana-de-oro-islay-creek'], ['Morro Bay State Park Campground', 'Islay Creek Campground (Montana de Oro)'],
    ['Sea otters and harbor seals in the bay', 'Tide pools', 'Sand dunes to roll down'],
    ['Cliffs are crumbly. Keep back from edges.', 'Wear a life jacket when on the water.'], [BOOK], ['ca'], null);

  T('ca-pismo-dunes', 'Pismo Beach and the dunes', 'Central Coast', ALL, 3, 'easy', 'All ages', ['beach', 'rv-friendly', 'first-timer'], 35.1, -120.6,
    'Wide beach camping with butterfly habitat in winter and sandy playgrounds.',
    ['Arrive and set up. Walk the beach.', 'A beach day with sandcastles, then a visit to the monarch grove in winter.', 'Pack up and enjoy a local breakfast on the way home.'],
    ['ca-pismo-north-beach', 'ca-pismo-oceano'], ['North Beach Campground (Pismo)', 'Oceano Campground (Pismo)'],
    ['Monarch butterflies in the cooler months', 'Sandcastles', 'Easy flat walks'],
    ['Vehicles are allowed on some dune areas. Keep kids away from them.', 'Check the tide times before beach walks.'], [BOOK], ['ca'], null);

  T('ca-santa-barbara-coast', 'Santa Barbara coast beach camping', 'Southern California', ALL, 3, 'easy', 'All ages', ['beach', 'first-timer', 'rv-friendly'], 34.5, -120.0,
    'Camp on bluffs above the beach, with a rail line, bikeable paths and tide pools.',
    ['Arrive and set up. A sunset beach walk.', 'Tide pooling at low tide and a bike ride on the coastal path.', 'Optional: day trip into Santa Barbara for the farmers’ market or zoo.'],
    ['ca-refugio-state-beach', 'ca-el-capitan-state-beach', 'ca-carpinteria-state-beach'], ['Refugio State Beach Campground', 'El Capitan State Beach Campground', 'Carpinteria State Beach Campground'],
    ['Tide pools', 'Bike rides along the coast', 'Seals at Carpinteria rookery in season'],
    ['Trains run close to some campgrounds. Expect noise.', 'Keep kids away from the cliff edges.'], [BOOK], ['ca'], null);

  T('ca-channel-islands', 'Channel Islands: a boat-to-camp adventure', 'Southern California', ['spring', 'summer', 'fall'], 3, 'moderate', 'Ages 6 and up', ['islands', 'wildlife', 'dark-sky'], 34.2, -119.3,
    'Take a boat to an island park for foxes, seabirds and clear skies. You carry everything and camp primitive.',
    ['Board the boat in Ventura (or Oxnard) with all gear. Hike up to the campground and set up.', 'Walk to a viewpoint or a short coast trail. Stargaze after dark.', 'Pack up and take the return boat. Be at the dock on time.'],
    ['ca-scorpion-canyon-channel-islands', 'ca-anacapa-island-channel-islands', 'ca-water-canyon-channel-islands', 'ca-san-miguel-island-channel-islands'], ['Scorpion Canyon Campground (Santa Cruz Island)', 'Anacapa Island Campground'],
    ['The boat ride (dolphins and whales are possible)', 'Island foxes', 'Very dark night skies'],
    ['Boat schedules depend on weather and you may be delayed. Bring extra food and water.', 'There is no store; pack out all trash, and keep food in the lockers.', 'Be ready for rough seas; consider seasickness prevention.'], ['Camping permits and boat tickets are separate; the park’s boat concessioner sells tickets. Book both early.'], ['chis', 'rc'], null);

  T('ca-malibu-mugu', 'Malibu coast camping near Los Angeles', 'Southern California', ALL, 2, 'easy', 'All ages', ['beach', 'first-timer', 'rv-friendly'], 34.1, -118.9,
    'Mountains-meet-the-sea camping within an hour of Los Angeles, with creek hikes and beaches.',
    ['Set up in a canyon campground, then walk a creek trail.', 'Beach morning and tide pools, then head home.'],
    ['ca-leo-carrillo-canyon-campground', 'ca-sycamore-canyon-point-mugu', 'ca-thornhill-broome-point-mugu', 'ca-malibu-creek-campground'], ['Leo Carrillo State Park Canyon Campground', 'Sycamore Canyon Campground'],
    ['Tide pools and sea caves at low tide', 'Creek exploring', 'Beach time'],
    ['Wildfire damage and closures are common in this region; check status first.', 'Poison oak and ticks are common in the canyon brush.'], [BOOK], ['ca'], null);

  T('ca-crystal-cove', 'Crystal Cove: Orange County coast', 'Southern California', ALL, 2, 'easy', 'All ages', ['beach', 'first-timer'], 33.6, -117.8,
    'A hillside camp above a protected beach and tide pools, in the middle of urban Southern California.',
    ['Set up in the Moro Campground and hike down to the beach.', 'Tide pooling and a beach picnic, then pack up.'],
    ['ca-moro-campground-crystal-cove'], ['Moro Campground (Crystal Cove)'],
    ['Tide pools', 'Beach walks', 'Historic beach cottages (look only)'],
    ['Fog and low tides vary; check tide times.', 'Take everything from the beach and trail back to camp.'], [BOOK], ['ca'], null);

  /* ===== California: Sierra, Tahoe, Yosemite ===== */
  T('ca-yosemite-valley', 'Yosemite Valley family camp', 'Sierra Nevada', ['spring', 'summer', 'fall'], 4, 'moderate', 'All ages', ['mountains', 'waterfalls', 'rivers'], 37.7, -119.6,
    'The classic family trip: waterfalls, a flat paved loop, a river for floating and a free shuttle.',
    ['Arrive, set up in the valley and take a short stroll to meadows near camp.', 'Walk the paved trail to a waterfall viewpoint and stop at the visitor center for Junior Ranger.', 'Rent bikes or float the river when water is gentle and safe (follow park advice).', 'Pack up and go. Allow time for traffic in busy months.'],
    ['ca-upper-pines-yosemite', 'ca-lower-pines-yosemite', 'ca-north-pines-yosemite', 'ca-camp-4-yosemite'], ['Upper Pines Campground', 'North Pines Campground', 'Lower Pines Campground'],
    ['Waterfalls (strongest in spring)', 'Biking the flat valley loop', 'Junior Ranger'],
    ['Cold, fast rivers in spring are dangerous. Stay back from river edges and waterfall tops.', 'Bears: store food and scented items in the bear boxes.', 'Reservations and entry rules have changed in some years; check the park’s page.'], ['Campgrounds sell out as soon as they open. Plan your reservation day.'], ['yose', 'rc'], 'about 3.5-4.5 h from Sacramento or the Bay Area (approx)');

  T('ca-yosemite-tuolumne', 'Tuolumne Meadows high-country camp', 'Sierra Nevada', ['summer'], 3, 'moderate', 'Ages 5 and up', ['mountains', 'lakes', 'dark-sky'], 37.9, -119.4,
    'High meadows, granite domes and cool nights. Tioga Road is only open in the warm months.',
    ['Drive the Tioga Road and set up at camp. Walk in the meadow.', 'A short hike to a lake or along the river, picnic and a swim only in safe, shallow, warm spots.', 'Stargaze from the meadow and head out the next morning.'],
    ['ca-tuolumne-meadows-yosemite', 'ca-tamarack-flat-yosemite', 'ca-white-wolf-yosemite', 'ca-porcupine-flat-yosemite'], ['Tuolumne Meadows Campground', 'White Wolf Campground'],
    ['Granite domes to scramble (carefully)', 'Meadow wildlife', 'Dark skies'],
    ['At about 8,600 ft, expect thin air, cold nights and afternoon thunderstorms. Hike early.', 'The road closes in winter and opening dates change each year.'], ['Check the opening date of Tioga Road and the campground season before you book.'], ['yose', 'rc'], null);

  T('ca-sequoia-giant-forest', 'Giant sequoias: Sequoia and Kings Canyon', 'Sierra Nevada', ['spring', 'summer', 'fall'], 3, 'moderate', 'All ages', ['mountains', 'redwoods', 'first-timer'], 36.6, -118.8,
    'Walk among the largest trees on Earth. Lower campgrounds are warmer; higher ones are cooler.',
    ['Arrive and set up. The winding road takes time: allow plenty of daylight.', 'A short trail to the biggest trees, a visit to the museum and an easy stream walk.', 'A morning in the foothills or river, then drive out.'],
    ['ca-lodgepole-sequoia', 'ca-dorst-creek-sequoia', 'ca-potwisha-sequoia', 'ca-buckeye-flat-sequoia'], ['Lodgepole Campground', 'Dorst Creek Campground', 'Potwisha Campground'],
    ['Trees as wide as a house', 'Junior Ranger', 'Snow play on winter days where open'],
    ['The main road is steep and winding, with length limits for trailers and RVs. Check the park page.', 'Bears are present: use food lockers.', 'Rattlesnakes in the foothills in warm months.'], [BOOK], ['seki', 'rc'], 'about 4-5 h from Sacramento (approx)');

  T('ca-lake-tahoe-south', 'South Lake Tahoe family camp', 'Lake Tahoe', ['summer', 'fall'], 3, 'easy', 'All ages', ['lakes', 'beach', 'mountains'], 38.9, -120.0,
    'A big, clear lake with sandy beaches, easy bike paths and plenty to do, close to the Bay Area and Sacramento.',
    ['Arrive and set up in the pines. Walk to the beach.', 'Beach, paddle or swim day. Bike the paved path.', 'Morning at an overlook such as Emerald Bay, then head home.'],
    ['ca-fallen-leaf-campground', 'ca-william-kent-campground', 'ca-emerald-bay-boat-in'], ['Fallen Leaf Campground', 'William Kent Campground'],
    ['Beach play and sand', 'Bike path', 'Boat or paddle in Emerald Bay (rentals)'],
    ['The lake is cold even in summer. Use life jackets.', 'At about 6,200 ft altitude you may feel the sun more and tire sooner.', 'Weekends and holidays are crowded.'], [BOOK], ['ltbmu', 'rc'], 'about 2-2.5 h from Sacramento (approx)');

  T('ca-gold-country', 'Gold Country history weekend', 'Gold Country', ['spring', 'fall'], 3, 'easy', 'Ages 5 and up', ['history', 'rivers', 'first-timer'], 38.8, -120.9,
    'Pan for gold, ride a historic stage or steam train and see the place where the 1848 gold rush started.',
    ['Set up at a foothill campground near the river.', 'Visit the Marshall Gold Discovery site and try gold panning where offered.', 'Walk a historic main street, then head home.'],
    [], ['Look for state park or forest campgrounds near Coloma and Columbia'],
    ['Gold panning', 'Old West main streets', 'River beaches in summer'],
    ['Summers are hot; spring and fall are better. Beware of rattlesnakes and poison oak in the foothills.', 'Mine shafts are dangerous: never enter.'], [BOOK], ['ca'], 'about 1 h from Sacramento (approx)');

  T('ca-calaveras-big-trees', 'Calaveras Big Trees camp', 'Gold Country', ['spring', 'summer', 'fall'], 2, 'easy', 'All ages', ['redwoods', 'first-timer', 'mountains'], 38.3, -120.3,
    'Giant sequoias that are reachable on a flat trail, with a river and a cool summer climate.',
    ['Set up and take the easy trail among the big trees.', 'River splash if conditions are right, then go home.'],
    [], ['State park campgrounds near Arnold (check parks.ca.gov)'],
    ['A sequoia grove on a flat trail', 'Stump and cabin history', 'Cool river pools in summer'],
    ['Check snow and road conditions outside summer.'], [BOOK], ['ca'], 'about 2.5-3 h from Sacramento (approx)');

  T('ca-mammoth-lakes', 'Mammoth Lakes basin camp', 'Eastern Sierra', ['summer', 'fall'], 3, 'moderate', 'Ages 4 and up', ['lakes', 'mountains', 'hot-springs'], 37.6, -119.0,
    'Alpine lakes, waterfalls, an easy shuttle and a nearby hot spring soak for cool evenings.',
    ['Arrive and acclimatise: the elevation is high. Set up and take a short lake walk.', 'A lake paddle or fish and a short waterfall hike. Lunch in town.', 'Fall color on the aspens (late September to early October, varies).'],
    ['ca-lake-mary-mammoth', 'ca-twin-lakes-mammoth', 'ca-sherwin-creek-mammoth', 'ca-new-shady-rest-mammoth', 'ca-reds-meadow-mammoth'], ['Lake Mary Campground', 'Sherwin Creek Campground', 'Twin Lakes Campground'],
    ['Paddling or fishing at a lake', 'Waterfalls', 'Ice cream in town'],
    ['Altitude of 8,000 ft or more can cause headaches and trouble sleeping. Drink water and go slowly the first day.', 'Hot springs can be extremely hot; follow signs and keep children out of very hot water.', 'Thunderstorms in summer afternoons.'], [BOOK], ['inyo', 'rc'], 'about 5-6 h from Sacramento (approx)');

  T('ca-june-lake-loop', 'June Lake Loop family camp', 'Eastern Sierra', ['summer', 'fall'], 3, 'easy', 'All ages', ['lakes', 'mountains'], 37.8, -119.1,
    'Four small lakes along a scenic loop, with fishing, kayaking and fall color.',
    ['Set up near a lake.', 'Rent a paddle boat or kayak. Walk the lakeshore.', 'Visit a nearby ghost-town stop or Mono Lake on the way home.'],
    ['ca-june-lake-campground', 'ca-gull-lake-june-lake', 'ca-silver-lake-june-lake', 'ca-oh-ridge-june-lake', 'ca-reversed-creek-june-lake'], ['June Lake Campground', 'Gull Lake Campground', 'Silver Lake Campground'],
    ['Fishing', 'Paddling', 'Colorful aspens in autumn'],
    ['Cold nights even in summer.', 'High altitude: go easy on the first day.'], [BOOK], ['inyo', 'rc'], null);

  T('ca-mono-lake', 'Mono Lake tufa and sky', 'Eastern Sierra', ['spring', 'summer', 'fall'], 2, 'easy', 'All ages', ['dark-sky', 'wildlife', 'lakes'], 38.0, -119.0,
    'Strange limestone towers rise from a salty lake. Add stargazing and a Tioga Pass drive.',
    ['Camp near the lake or in Lee Vining and see the tufa at sunset.', 'Morning walk to the shore, a visit to the Mono Basin visitor center, and the old mining town of Bodie if open.'],
    ['ca-ellery-lake-lee-vining', 'ca-tioga-lake-lee-vining', 'ca-glass-creek-mono'], ['Tioga Lake Campground', 'Ellery Lake Campground'],
    ['Tufa towers', 'Millions of migrating birds in season', 'Night sky'],
    ['The lake water is very salty and can irritate eyes and cuts.', 'The Tioga Pass road is closed in winter.'], [BOOK], ['inyo'], null);

  T('ca-big-pine-creek', 'Big Pine Creek and the Bristlecone area', 'Eastern Sierra', ['summer', 'fall'], 3, 'moderate', 'Ages 6 and up', ['mountains', 'dark-sky', 'rivers'], 37.1, -118.3,
    'A creekside camp under granite peaks, with the world’s oldest trees on a nearby mountain.',
    ['Set up at the creek and rest; acclimatise to altitude.', 'Hike the first flat part of the canyon trail, wading in the creek on hot days.', 'Visit the bristlecone pine forest if the road is open.'],
    ['ca-big-pine-creek-inyo'], ['Big Pine Creek Campground'],
    ['Creek play', 'Ancient trees', 'Stars'],
    ['Altitude and steep trails: turn back if children are tired.', 'Check road status for the bristlecone area.'], [BOOK], ['inyo'], null);

  T('ca-lassen-volcanic', 'Lassen Volcanic: steam, lakes and quiet', 'Northern California', ['summer', 'fall'], 3, 'moderate', 'Ages 5 and up', ['mountains', 'lakes', 'dark-sky', 'wildlife'], 40.5, -121.4,
    'Boiling mud pots, volcanic peaks and crowd-free lakes. Much of the park road is closed in winter.',
    ['Set up at a lake campground.', 'Visit the hydrothermal areas, staying on boardwalks. Then swim or paddle.', 'Short lake walk, then leave.'],
    ['ca-manzanita-lake-lassen', 'ca-summit-lake-north-lassen', 'ca-summit-lake-south-lassen', 'ca-butte-lake-lassen'], ['Manzanita Lake Campground', 'Summit Lake campgrounds'],
    ['Bubbling mud pots (look from the boardwalk)', 'Small lakes for paddling', 'Junior Ranger'],
    ['Stay on trails in thermal areas; the ground can be thin over scalding water.', 'Mosquitoes are strong in early summer.', 'The road is closed to cars in winter and spring; check opening dates.'], [BOOK], ['lavo', 'rc'], 'about 3 h from Sacramento (approx)');

  T('ca-burney-falls', 'Burney Falls and Lake Britton', 'Northern California', ['spring', 'summer', 'fall'], 2, 'easy', 'All ages', ['waterfalls', 'lakes', 'first-timer'], 41.0, -121.7,
    'A short walk leads to a big waterfall, with a lake for swimming and paddling.',
    ['Set up, then walk the short falls loop.', 'Lake swim or paddle in summer, then continue to other parks or home.'],
    ['ca-burney-falls-campground'], ['McArthur-Burney Falls Memorial State Park campground'],
    ['A big waterfall close to camp', 'Swimming beach', 'Easy trails'],
    ['Keep to the trail around the falls; slippery rocks.'], [BOOK], ['ca'], null);

  T('ca-lava-beds', 'Lava Beds caves for kids', 'Northern California', ['spring', 'fall'], 3, 'moderate', 'Ages 6 and up', ['dark-sky', 'history', 'wildlife'], 41.7, -121.5,
    'Walk through lava tube caves with a headlamp. A remote park with very dark nights and history of the Modoc War.',
    ['Set up and visit the visitor center for cave maps and any required checks.', 'Explore a few lighted-route caves with a flashlight and helmet; stay with the group.', 'Visit the petroglyphs and the stronghold, then leave.'],
    ['ca-indian-well-lava-beds'], ['Indian Well Campground'],
    ['Caves with headlamps', 'Ancient rock art', 'Star-filled night skies'],
    ['Caves are cool and dark, with low ceilings. Wear a helmet, closed shoes and a headlamp for each person.', 'Bats may be present; follow cave rules and regulations.'], [BOOK], ['care'], null);

  T('ca-shasta-lake', 'Lake Shasta houseboat-free camping', 'Northern California', ['spring', 'summer'], 3, 'easy', 'All ages', ['lakes', 'rv-friendly'], 40.8, -122.4,
    'A huge reservoir with warm summer water and caverns nearby. Look to Forest Service or private campgrounds around the lake.',
    ['Set up near the water.', 'Swim, paddle or rent a boat. Tour the limestone caverns if it suits your family.', 'Morning dip and head home.'],
    [], ['Shasta-Trinity National Forest campgrounds near the lake'],
    ['Swimming', 'Boat rides', 'Caves'],
    ['Summers are very hot. Use life jackets and sun protection.'], [BOOK], ['shta', 'rc'], null);

  T('ca-pinnacles', 'Pinnacles National Park: climbing rocks and condors', 'Central Coast', ['spring', 'fall', 'winter'], 3, 'moderate', 'Ages 5 and up', ['wildlife', 'mountains', 'dark-sky'], 36.5, -121.2,
    'Volcanic spires and talus caves. Look up for condors. Hot in summer, so visit in cooler months.',
    ['Set up. Short walk at sunset to look for condors.', 'Hike an easy trail to a talus cave with flashlights.', 'Morning wildlife watch, then go.'],
    ['ca-pinnacles-campground'], ['Pinnacles Campground'],
    ['Condors and other birds', 'Talus caves', 'Pool at the campground (check season)'],
    ['Summer heat can be extreme. Bring plenty of water.', 'Caves close at times to protect bats.'], [BOOK], ['pinn', 'rc'], null);

  /* ===== California: desert ===== */
  T('ca-joshua-tree', 'Joshua Tree: boulders and stars', 'Southern California Desert', ['fall', 'winter', 'spring'], 3, 'easy', 'All ages', ['desert', 'dark-sky', 'first-timer'], 34.0, -116.1,
    'Climbable boulders, odd trees, kid-friendly nature trails and some of the best night skies in Southern California.',
    ['Arrive and set up in a boulder campground. Climb the rocks near camp.', 'Short nature loops, a stop at the visitor center and Junior Ranger. Sunset on the rocks.', 'Stargaze at night and head home.'],
    ['ca-jumbo-rocks-joshua-tree', 'ca-hidden-valley-joshua-tree', 'ca-black-rock-joshua-tree', 'ca-cottonwood-joshua-tree', 'ca-indian-cove-joshua-tree', 'ca-ryan-joshua-tree', 'ca-belle-joshua-tree', 'ca-white-tank-joshua-tree'], ['Jumbo Rocks Campground', 'Hidden Valley Campground', 'Indian Cove Campground'],
    ['Rock scrambling', 'Junior Ranger', 'Stars'],
    ['Few sites have water at camp; bring all you need.', 'Summer heat is dangerous. Winter nights can freeze.', 'Watch for rattlesnakes and cholla cactus.'], ['Popular in spring and fall; sites book fast.'], ['jotr', 'rc'], 'about 2-3 h from Los Angeles (approx)');

  T('ca-death-valley-winter', 'Death Valley in winter', 'Southern California Desert', ['winter', 'spring'], 4, 'moderate', 'Ages 5 and up', ['desert', 'dark-sky', 'history'], 36.5, -117.1,
    'Salt flats, sand dunes and a night sky free of city light. Only visit in the cool months.',
    ['Drive in, set up and rest. Watch sunset at the dunes.', 'A viewpoint day: the lowest point in North America, a salt flat and colorful canyon.', 'A short canyon walk and borax history.', 'Stargaze and leave.'],
    ['ca-furnace-creek-death-valley', 'ca-sunset-death-valley', 'ca-texas-spring-death-valley', 'ca-stovepipe-wells-death-valley'], ['Furnace Creek Campground', 'Texas Spring Campground', 'Stovepipe Wells Campground'],
    ['Sand dunes', 'Salt flats', 'Stars'],
    ['Summers are deadly hot. Visit in the cool months only and carry extra water.', 'Distances are large and cell service is rare. Fill up on fuel when you can.', 'Flash floods can close roads.'], [BOOK], ['deva', 'rc'], null);

  T('ca-anza-borrego', 'Anza-Borrego desert wildflowers', 'Southern California Desert', ['winter', 'spring'], 3, 'easy', 'All ages', ['desert', 'dark-sky'], 33.3, -116.4,
    'A big desert state park known for spring wildflowers (in good years), palm oases and clear skies.',
    ['Set up in a campground near Borrego Springs.', 'Short walks to a palm oasis and a wildflower drive (if blooming).', 'Metal sculptures near town, then home.'],
    [], ['Borrego Palm Canyon Campground (check the state park site)'],
    ['Wildflowers in a good year', 'Palm oases', 'Metal sculptures near town'],
    ['Bloom timing varies each year. Check bloom reports.', 'Summer is hot. Watch for rattlesnakes.'], [BOOK], ['ca'], null);

  T('ca-mojave-preserve', 'Mojave National Preserve: dunes and cinder cones', 'Southern California Desert', ['fall', 'winter', 'spring'], 3, 'moderate', 'Ages 5 and up', ['desert', 'dark-sky', 'history'], 35.2, -115.5,
    'A remote, uncrowded desert with singing dunes, volcanic cinder cones and quiet campgrounds.',
    ['Set up in a campground.', 'Visit the dunes and a lava tube or cinder cone.', 'Take an easy trail at sunrise and go.'],
    ['ca-hole-in-the-wall-mojave', 'ca-mid-hills-mojave', 'ca-black-canyon-group-mojave'], ['Hole-in-the-Wall Campground', 'Mid Hills Campground'],
    ['Big sand dunes', 'Rock formations', 'Dark nights'],
    ['Remote: bring extra water, fuel and a spare tire.', 'Extreme summer heat.'], ['Many campgrounds are first-come. Check the park page.'], ['moja'], null);

  /* ===== beyond California ===== */
  T('ut-zion', 'Zion: canyon walls and river play', 'Utah', ['spring', 'fall'], 4, 'moderate', 'Ages 5 and up', ['canyons', 'rivers', 'mountains'], 37.2, -113.0,
    'Red canyon walls, a shuttle-served canyon road in season and shallow river walks. Best in spring and fall.',
    ['Arrive, set up and ride the shuttle to the main canyon.', 'Riverside Walk and an easy side-canyon trail.', 'A cooler-day option: Kolob Canyons or Scenic drive.', 'Pack up.'],
    ['ut-watchman-campground-zion', 'ut-south-campground-zion', 'ut-lava-point-campground-zion'], ['Watchman Campground', 'South Campground'],
    ['Wading in the river', 'The shuttle bus', 'Junior Ranger'],
    ['Flash floods can occur; check conditions before entering narrow canyons.', 'Some famous hikes (Angels Landing, Narrows) have permit or experience requirements and are not for young children.', 'Summer is very hot.'], ['Campgrounds fill very early. Check the booking window.'], ['zion', 'rc'], null);

  T('ut-bryce', 'Bryce Canyon: hoodoos and dark skies', 'Utah', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['canyons', 'dark-sky', 'mountains'], 37.6, -112.2,
    'Rim-top camping at high altitude, with orange hoodoos and a night sky program.',
    ['Set up and walk the rim at sunset.', 'Hike the Queen’s Garden-style trail for older kids or the rim trail for little ones. Attend a ranger program.', 'Sunrise at the rim and then leave.'],
    ['ut-north-campground-bryce-canyon', 'ut-sunset-campground-bryce-canyon'], ['North Campground', 'Sunset Campground'],
    ['Hoodoos to spot shapes in', 'Star programs', 'Junior Ranger'],
    ['At about 8,000 ft altitude, it is cool and thin-aired. Start slowly.', 'Trails drop steeply into the amphitheater; the climb out is harder than the walk down.'], [BOOK], ['brca', 'rc'], null);

  T('ut-arches-canyonlands', 'Utah arches and canyons: Moab base', 'Utah', ['spring', 'fall'], 4, 'moderate', 'Ages 5 and up', ['desert', 'canyons', 'dark-sky'], 38.6, -109.6,
    'Stone arches, short hikes and big sky near Moab. Visit in spring and fall to avoid dangerous heat.',
    ['Set up at a campground and take an evening stroll.', 'Arches early in the day: short trails to arches, avoiding midday.', 'Canyonlands viewpoints, picnic and stargaze.', 'Pack up.'],
    ['ut-devils-garden-campground-arches', 'ut-willow-flat-campground-canyonlands', 'ut-needles-campground-canyonlands'], ['Devils Garden Campground', 'Willow Flat Campground'],
    ['Arches to climb under (look, do not climb on them)', 'Junior Ranger', 'Dark skies'],
    ['Timed entry or reservations have been used in the park in some years; check.', 'Very hot in summer. Carry lots of water.', 'Stay on trails to protect the fragile soil crust.'], ['The campground in Arches is small. Book early or use a campground in Moab.'], ['arch', 'cany', 'rc'], null);

  T('ut-capitol-reef', 'Capitol Reef: orchards and canyons', 'Utah', ['spring', 'fall'], 3, 'easy', 'All ages', ['canyons', 'history', 'first-timer'], 38.3, -111.2,
    'A quieter Utah park with an orchard campground, petroglyphs and easy canyon walks.',
    ['Set up in the orchard campground.', 'Walk to petroglyphs and an easy canyon. Eat fresh pie from the local store.', 'Pick fruit in season where permitted, then leave.'],
    ['ut-fruita-campground-capitol-reef'], ['Fruita Campground'],
    ['Fruit picking in season', 'Petroglyphs', 'Pie'],
    ['Flash floods in canyons. Check the forecast.'], [BOOK], ['care', 'rc'], null);

  T('az-grand-canyon', 'Grand Canyon South Rim family camp', 'Arizona', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['canyons', 'dark-sky', 'mountains'], 36.1, -112.1,
    'Camp in the pines on the rim, walk the flat Rim Trail and use the park shuttle.',
    ['Arrive, set up in the pines and walk to the rim at sunset.', 'Ride the shuttle to viewpoints, visit a museum and go on a ranger talk.', 'Sunrise at the rim, then leave.'],
    ['az-mather-campground-grand-canyon', 'az-desert-view-campground-grand-canyon', 'az-trailer-village-grand-canyon', 'az-north-rim-campground-grand-canyon'], ['Mather Campground', 'Desert View Campground'],
    ['The first view of the canyon', 'Junior Ranger', 'Rim Trail with strollers'],
    ['Do not go over fences or near edges. Keep children close.', 'Hiking into the canyon is dangerous in heat; do not try to hike to the river and back in a day.', 'The North Rim has a shorter season.'], ['Book early; the South Rim is one of the busiest parks.'], ['grca', 'rc'], null);

  T('wy-yellowstone', 'Yellowstone: geysers and wildlife', 'Wyoming', ['summer', 'fall'], 5, 'moderate', 'Ages 5 and up', ['wildlife', 'mountains', 'lakes'], 44.5, -110.8,
    'Geysers, hot springs, bison and elk. Distances are huge, so base yourself near the parts you want to see.',
    ['Arrive and set up. Short walk at a geyser basin on boardwalks.', 'Watch Old Faithful and visit museums and ranger programs.', 'Wildlife drive at dawn: valleys with bison and elk.', 'A lake day at Yellowstone Lake.', 'Pack up and leave.'],
    [], ['Check the park website for NPS-run and concession campgrounds'],
    ['Geysers', 'Bison', 'Junior Ranger'],
    ['Stay on boardwalks in thermal areas; the ground is scalding.', 'Never approach wildlife. Keep at least 25 yards from bison and elk, 100 yards from bears and wolves.', 'Bear spray is recommended in the backcountry; food storage is required in camp.', 'Some roads close in winter or after storms.'], ['Campgrounds fill early in summer; book as soon as they open.'], ['yell', 'rc'], null);

  T('wy-grand-teton', 'Grand Teton lakeside camp', 'Wyoming', ['summer', 'fall'], 4, 'moderate', 'All ages', ['mountains', 'lakes', 'wildlife'], 43.8, -110.7,
    'Jagged peaks over blue lakes, with easy shoreline trails and boat rides.',
    ['Set up and walk to the lake at sunset.', 'Boat across a lake to an easy trail with waterfalls.', 'Wildlife drive at dawn and dusk.', 'Pack up.'],
    ['wy-colter-bay-campground-grand-teton', 'wy-jenny-lake-campground-grand-teton', 'wy-signal-mountain-campground-grand-teton', 'wy-lizard-creek-campground-grand-teton', 'wy-gros-ventre-campground-grand-teton'], ['Colter Bay Campground', 'Jenny Lake Campground', 'Signal Mountain Campground'],
    ['Boat shuttle across Jenny Lake', 'Moose spotting', 'Swim at a warm shallow cove'],
    ['Bear country: use food boxes and keep a clean camp.', 'Cold nights even in summer.', 'Keep a safe distance from moose and bison.'], ['Tent-only sites at Jenny Lake fill on opening day. Check rules.'], ['grte', 'rc'], null);

  T('mt-glacier', 'Glacier National Park: lakes and the Sun Road', 'Montana', ['summer'], 5, 'moderate', 'Ages 5 and up', ['mountains', 'lakes', 'wildlife'], 48.5, -114.0,
    'Glacial lakes, mountain goats and a scenic road across the Continental Divide. The high road is only open in summer.',
    ['Arrive and set up near a lake. Evening shore walk.', 'Easy lake loop and a boat ride.', 'Drive the Going-to-the-Sun Road (check the vehicle rules).', 'Short waterfall hike and picnic.', 'Pack up.'],
    ['mt-apgar-campground-glacier', 'mt-many-glacier-campground-glacier', 'mt-two-medicine-campground-glacier', 'mt-st-mary-campground-glacier', 'mt-fish-creek-campground-glacier', 'mt-rising-sun-campground-glacier'], ['Apgar Campground', 'Many Glacier Campground', 'Two Medicine Campground'],
    ['Lakes with colorful stones', 'Mountain goats and bighorn sheep', 'Junior Ranger'],
    ['The Going-to-the-Sun Road has had vehicle reservations and size limits in some years; check before you plan.', 'Grizzly bears: carry bear spray, hike in groups, make noise and store food correctly.', 'Snow can persist on high trails into July.'], ['Book campgrounds as soon as they open; many fill quickly.'], ['glac', 'rc'], null);

  T('wa-olympic', 'Olympic Peninsula: rain forest, lakes and beach', 'Washington', ['summer', 'fall'], 5, 'moderate', 'All ages', ['redwoods', 'beach', 'lakes'], 47.9, -123.9,
    'Mossy rain forest, a mountain lake and wild Pacific beaches in one park. Plan for rain.',
    ['Travel by road (and ferry from Seattle if needed). Set up near a lake.', 'Walk an easy moss trail in the Hoh or Quinault rain forest.', 'Beach day at the coast: tide pools and driftwood forts.', 'Visit a lake and a waterfall trail.', 'Pack up.'],
    [], ['Check the park website for campgrounds such as Kalaloch and Fairholme'],
    ['Tide pools', 'Moss-covered trees', 'Driftwood forts'],
    ['Tides and logs: sneaker waves can be dangerous. Never turn your back on the ocean.', 'Rain is likely; use waterproof gear.', 'Check the tide tables before beach walking.'], ['Book early for summer.'], ['olym', 'rc'], null);

  T('or-oregon-coast', 'Oregon Coast state parks road trip', 'Oregon', ['spring', 'summer', 'fall'], 4, 'easy', 'All ages', ['beach', 'redwoods', 'wildlife', 'rv-friendly'], 45.9, -124.0,
    'Wide public beaches, sea stacks and tide pools, linked by Highway 101 and many well-run state park campgrounds with yurts as a backup.',
    ['Set up at a state park near the beach.', 'Tide pools at low tide and a sand castle contest.', 'Drive to a lighthouse or forest overlook.', 'Pack up.'],
    [], ['Oregon state park campgrounds along US 101 (see stateparks.oregon.gov)'],
    ['Beach play and kite flying', 'Tide pools', 'Lighthouses'],
    ['Never turn your back on the ocean. Sneaker waves and floating logs are dangerous.', 'Check the tide tables and avoid being trapped by rising tide.'], ['Oregon state parks have their own reservation system and book far ahead.'], ['or'], null);

  T('or-crater-lake', 'Crater Lake: the deep blue caldera', 'Oregon', ['summer'], 3, 'moderate', 'Ages 5 and up', ['lakes', 'mountains', 'dark-sky'], 42.9, -122.1,
    'One of the deepest lakes in the world. The camping season is short because of heavy snow.',
    ['Set up at the village campground.', 'Drive the rim and take a short walk to a viewpoint.', 'Boat tour (check the schedule and conditions) and stargaze.'],
    ['or-mazama-village-campground-crater-lake'], ['Mazama Village Campground'],
    ['The blue water', 'Boat tour (if running)', 'Night sky'],
    ['Snow can linger into July and return early. Check the season.', 'The cliffs have no barriers at many points. Keep children close.'], [BOOK], ['crla', 'rc'], null);

  T('co-great-sand-dunes', 'Great Sand Dunes: a sandbox for the whole family', 'Colorado', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['desert', 'dark-sky', 'first-timer'], 37.7, -105.5,
    'Tall dunes, a seasonal creek that kids can splash in and very dark nights.',
    ['Set up near the dunes. Evening walk onto the sand.', 'Sand sledding or boarding with rented boards. Splash in the creek when it flows (spring and early summer).', 'Star program and leave.'],
    ['co-pinon-flats-campground-great-sand-dunes'], ['Pinon Flats Campground'],
    ['Sand sledding', 'Medano Creek splash', 'Dark skies'],
    ['The sand surface can be 150 F or more on hot afternoons. Go early or late and wear shoes.', 'Lightning on the dunes is dangerous. Leave at the first thunder.'], [BOOK], ['grsa', 'rc'], null);

  T('co-rocky-mountain', 'Rocky Mountain National Park: elk and alpine lakes', 'Colorado', ['summer', 'fall'], 4, 'moderate', 'Ages 5 and up', ['mountains', 'lakes', 'wildlife'], 40.3, -105.7,
    'Meadows with elk, easy lake loops and high mountain views. Fall brings elk rut.',
    ['Arrive and set up. Elk watch at dusk, from a distance.', 'Easy lake walk and picnic.', 'Drive the high road if it is open, and take a short alpine walk.', 'Pack up.'],
    ['co-moraine-park-campground-rocky-mountain', 'co-glacier-basin-campground-rocky-mountain', 'co-aspenglen-campground-rocky-mountain', 'co-timber-creek-campground-rocky-mountain'], ['Moraine Park Campground', 'Glacier Basin Campground', 'Aspenglen Campground'],
    ['Elk', 'Alpine lakes', 'Junior Ranger'],
    ['At 8,000 to 12,000 ft, altitude sickness and quick afternoon storms can strike. Be off high ground early.', 'Timed-entry permits have been required in some seasons; check.'], [BOOK], ['romo', 'rc'], null);

  T('me-acadia', 'Acadia: Maine coast with kids', 'Maine', ['summer', 'fall'], 4, 'easy', 'All ages', ['beach', 'mountains', 'wildlife'], 44.3, -68.3,
    'Rocky shore, tide pools, carriage roads for biking, and small mountains with big views.',
    ['Set up near the coast. Tide pool at low tide.', 'Bike the carriage roads and have a popover.', 'Short summit walk or drive, a sunrise view.', 'Pack up.'],
    ['me-blackwoods-campground-acadia', 'me-seawall-campground-acadia', 'me-schoodic-woods-campground-acadia'], ['Blackwoods Campground', 'Seawall Campground'],
    ['Tide pools', 'Biking on car-free roads', 'Junior Ranger'],
    ['Rocks by the shore are slippery. Waves can surge unexpectedly.', 'Cold water. Wading only.', 'Check for ticks.'], [BOOK], ['acad', 'rc'], null);

  T('tn-great-smoky', 'Great Smoky Mountains: streams and fireflies', 'Tennessee and North Carolina', ['spring', 'summer', 'fall'], 4, 'easy', 'All ages', ['mountains', 'rivers', 'wildlife', 'history'], 35.6, -83.5,
    'Misty mountains, creek splashing and old farm buildings. Fall color is the busiest time.',
    ['Set up beside a creek.', 'Drive a loop road and look for wildlife at dawn.', 'Walk to an easy waterfall and splash in the creek.', 'Pack up.'],
    ['tn-cades-cove-campground-great-smoky', 'tn-elkmont-campground-great-smoky', 'nc-smokemont-campground-great-smoky', 'nc-balsam-mountain-campground-great-smoky', 'tn-cosby-campground-great-smoky'], ['Cades Cove Campground', 'Elkmont Campground', 'Smokemont Campground'],
    ['Tubing or wading in cold creeks', 'Black bears seen from the car', 'Fireflies in early summer (limited places and times)'],
    ['Bears are common. Keep food locked up and never feed them.', 'Creek rocks are slippery. Supervise children.', 'Ticks are present.'], [BOOK], ['grsm', 'rc'], null);

  T('md-assateague', 'Assateague Island: wild ponies and surf', 'Maryland', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['beach', 'wildlife'], 38.1, -75.2,
    'Beach camping with free-roaming wild horses. Mosquitoes can be intense in summer; plan for bug protection.',
    ['Set up and walk the beach.', 'Bike or walk a nature trail. Watch ponies from a distance.', 'Crabbing, shell collecting and leave.'],
    ['md-assateague-island-campground'], ['Assateague Island Campground'],
    ['Wild ponies', 'Crabbing', 'Wide beach'],
    ['Never feed or touch the horses; they bite and kick.', 'Mosquitoes and biting flies are a serious nuisance. Bring screens and repellent.', 'Rip currents.'], [BOOK], ['asis', 'rc'], null);
})();
