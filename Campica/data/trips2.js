/* Campica data pack: more family camping trip ideas (Southwest, Rockies, Texas and the East).
   Written from general knowledge in the builder's own words; official pages could not be fetched in this session (see SOURCES-trips2.md).
   Every idea carries verified:false, src (official agency pages to check) and asof. No fees, permit dates, road status or reservation rules are stated as fact.
   lat/lon is an APPROXIMATE regional anchor (rounded to 0.1 degree) used only for "distance from me". */
window.CAMPTRIPS = window.CAMPTRIPS || { items: [] };
(function () {
  var A = window.CAMPTRIPS.items, ASOF = '2026-10';
  function n(c) { return 'https://www.nps.gov/' + c + '/'; }
  var P = {
    zion: n('zion'), brca: n('brca'), care: n('care'), arch: n('arch'), cany: n('cany'), glca: n('glca'), grca: n('grca'), sagu: n('sagu'), jotr: n('jotr'),
    lake: n('lake'), grba: n('grba'), chir: n('chir'), pefo: n('pefo'), meve: n('meve'), blca: n('blca'), cure: n('cure'), colm: n('colm'), band: n('band'),
    whsa: n('whsa'), cave: n('cave'), bibe: n('bibe'), gumo: n('gumo'), pais: n('pais'), grsm: n('grsm'), blri: n('blri'), shen: n('shen'), acad: n('acad'),
    caco: n('caco'), caha: n('caha'), ever: n('ever'), bisc: n('bisc'), wica: n('wica'), badl: n('badl'), piro: n('piro'), slbe: n('slbe'), indu: n('indu'),
    buff: n('buff'), neri: n('neri'), maca: n('maca'), rc: 'https://www.recreation.gov/', coco: 'https://www.fs.usda.gov/coconino', wmnf: 'https://www.fs.usda.gov/whitemountain',
    vof: 'https://parks.nv.gov/parks/valley-of-fire', nvsp: 'https://parks.nv.gov/', utsp: 'https://stateparks.utah.gov/', tpwd: 'https://tpwd.texas.gov/state-parks/',
    ohio: 'https://ohiodnr.gov/', ny: 'https://dec.ny.gov/places/adirondacks', sd: 'https://gfp.sd.gov/parks/', miDnr: 'https://www.michigan.gov/dnr/places/state-parks',
    wi: 'https://dnr.wisconsin.gov/topic/parks', fl: 'https://www.floridastateparks.org/', nh: 'https://www.nhstateparks.org/', nc: 'https://www.ncparks.gov/',
    flam: 'https://www.fs.usda.gov/ashley', azsp: 'https://azstateparks.com/', cosp: 'https://cpw.state.co.us/placestogo/parks', nmsp: 'https://www.emnrd.nm.gov/spd/',
    pcnf: 'https://www.fs.usda.gov/psicc', ozark: 'https://www.fs.usda.gov/osfnf', hoco: 'https://ohiodnr.gov/go-and-do/plan-a-visit/find-a-property/hocking-hills-state-park'
  };
  /* T(id,title,region,season,days,diff,ages,theme,lat,lon,summary,itinerary,campIds,campNames,kid,cautions,booking,srcKeys,drive) */
  function T(id, title, region, season, days, diff, ages, theme, lat, lon, summary, it, campIds, campNames, kid, cautions, booking, srcKeys, drive) {
    A.push({ id: id, title: title, region: region, season: season, days: days, drive: drive || null, difficulty: diff, ages: ages, theme: theme, lat: lat, lon: lon, summary: summary,
      itinerary: it.map(function (t, i) { return { day: i + 1, text: t }; }), campIds: campIds, campNames: campNames, kidHighlights: kid, cautions: cautions, bookingTips: booking,
      src: srcKeys.map(function (k) { return P[k]; }), asof: ASOF, verified: false });
  }
  var ALL = ['spring', 'summer', 'fall', 'winter'], SSF = ['spring', 'summer', 'fall'], SF = ['spring', 'fall'], SU = ['summer'], FW = ['fall', 'winter', 'spring'];
  var BOOK = 'Popular campgrounds can fill months ahead. Check the official page for the booking window and any permit or entry system.';
  var ROADS = 'Road, trail and campground status can change with weather, fire or flooding. Check the official page before you go.';
  var HEAT = 'Desert heat is dangerous for kids: carry far more water than you expect, hike early, and turn back when anyone is struggling.';
  var FLASH = 'Flash floods can start from storms miles away. Stay out of narrow canyons and washes when rain is forecast.';
  var TICK = 'Ticks are common in woods and grass in warm months. Do a tick check each evening and know the local guidance.';
  var COLD = 'Mountain weather turns fast, even in summer. Pack warm layers and rain gear.';

  /* ===== Utah ===== */
  T('ut-zion-bryce-capitol-reef-loop', 'Utah Big Three loop: Zion, Bryce and Capitol Reef', 'Utah', SF.concat('summer'), 8, 'moderate', 'Ages 6 and up (long drives)', ['canyons', 'road-trip', 'dark-sky'], 37.3, -113.0,
    'A classic red-rock loop that links three very different parks with scenic drives. Short hikes, a river, hoodoos and pioneer orchards.',
    ['Settle in near Zion and take the canyon shuttle for riverside walks.', 'A second Zion day: a shaded side canyon or the river, plus an early night.', 'Drive east to Bryce; walk the rim at sunset.', 'Easy rim walking or a ranger program; stars after dark.', 'Scenic drive on Highway 12 toward Capitol Reef; stop for short walks.', 'Capitol Reef: orchards, petroglyph boardwalk and a short slot-style walk.', 'Slow morning, then head home or onward.'],
    ['ut-watchman-campground-zion', 'ut-south-campground-zion', 'ut-north-campground-bryce-canyon', 'ut-sunset-campground-bryce-canyon', 'ut-fruita-campground-capitol-reef'], [],
    ['Wading in the Virgin River', 'Spotting shapes in the hoodoos', 'Picking fruit in season at the Fruita orchards (check what is open)', 'Junior Ranger at each park'],
    [FLASH, 'Bryce is high and cool; Zion and Capitol Reef can be very hot in summer. Plan hikes for mornings.', 'Distances between parks are long; build in snack and fuel stops.', ROADS], [BOOK], ['zion', 'brca', 'care', 'rc'], 'About 350 miles of driving between the three parks (approximate)');

  T('ut-moab-with-kids', 'Moab with kids: arches, river and easy hikes', 'Utah', SF, 4, 'moderate', 'Ages 5 and up', ['canyons', 'desert', 'rivers'], 38.6, -109.5,
    'Sandstone arches near the road, a calm river float and short desert walks make Moab a good first red-rock trip.',
    ['Arrive and set up camp. Short evening walk near town.', 'Arches: pick one or two short arch trails early, before the heat or crowds.', 'A half-day calm-water river float with a licensed outfitter, or the Island in the Sky mesa top.', 'Dinosaur tracks or a petroglyph panel near Moab, then pack up.'],
    ['ut-devils-garden-campground-arches', 'ut-willow-flat-campground-canyonlands'], ['Moab-area BLM campgrounds', 'Moab-area private campgrounds'],
    ['Walking under big natural arches', 'Floating a gentle river section', 'Finding dinosaur tracks'],
    [HEAT, 'Stay on marked trails and away from cliff edges; hold small hands near drop-offs.', 'Check whether the park uses timed entry or reservations for your dates.'], [BOOK], ['arch', 'cany', 'rc'], null);

  T('ut-lake-powell-houseboat-or-shore', 'Lake Powell: red canyons and beach camping', 'Utah/Arizona', ['spring', 'summer', 'fall'], 4, 'easy', 'All ages', ['lake', 'boating', 'canyons'], 37.0, -111.5,
    'A huge desert reservoir with sandy coves, warm swimming and boat-in canyons. Camp at a lakeside campground and rent a boat for a day, or base near Page.',
    ['Arrive, set up near the water and swim.', 'Rent a boat or take a guided tour into a side canyon.', 'Visit the dam overlook and nearby slot canyon tours (guided only for most).', 'Easy morning swim, then leave.'],
    [], ['Wahweap Campground (Page, AZ)', 'Lees Ferry Campground', 'Bullfrog Campground', 'Halls Crossing'],
    ['Swimming and sandy beaches', 'Boat rides into narrow side canyons', 'Dam tour'],
    ['Water levels vary, so launch ramps and beaches can move; check current conditions.', 'Children should wear life jackets on and near the water.', HEAT, FLASH], [BOOK], ['glca', 'rc'], null);

  T('ut-goblin-valley-san-rafael', 'Goblin Valley and the San Rafael Swell', 'Utah', SF.concat('winter'), 3, 'easy', 'All ages', ['desert', 'dark-sky', 'hoodoos'], 38.6, -110.7,
    'Kids can scramble among rounded "goblin" rocks and play hide and seek in the maze. Dark skies and quiet desert camping.',
    ['Arrive at the state park, set up and explore the goblin field before sunset.', 'Short hike in a nearby canyon area, then stargaze.', 'Optional dirt-road drive in the Swell, then leave.'],
    [], ['Goblin Valley State Park Campground'],
    ['Climbing around the goblins', 'Stargazing', 'Easy short canyon walks'],
    [HEAT, 'Dirt roads in the Swell can be impassable when wet. Fuel up and carry extra water.'], [BOOK], ['utsp'], null);

  T('ut-flaming-gorge-fishing', 'Flaming Gorge: lake, fishing and the Uintas', 'Utah/Wyoming', SU.concat('fall'), 4, 'easy', 'All ages', ['lake', 'fishing', 'mountains'], 40.9, -109.5,
    'A cool, forested reservoir ringed by red cliffs. Good for kids learning to fish, paddling coves and spotting wildlife.',
    ['Set up at a lake or forest campground; walk to the shoreline.', 'Fishing or paddling in a calm cove.', 'Scenic overlook drive and a short walk.', 'Pack up and head home.'],
    [], ['Lucerne Valley Campground', 'Antelope Flat Campground', 'Dripping Springs Campground'],
    ['Fishing from shore or a dock', 'Paddling', 'Spotting wildlife'],
    ['Check fishing license rules for your child ages.', COLD, 'Keep food stored; bears live in the area.'], [BOOK], ['flam', 'rc'], null);

  T('ut-antelope-island', 'Antelope Island: bison and Great Salt Lake', 'Utah', ['spring', 'fall', 'winter'], 2, 'easy', 'All ages', ['wildlife', 'lake', 'weekend'], 41.0, -112.2,
    'A short, easy overnight with free-roaming bison, bird life and wide salt-lake views close to Salt Lake City.',
    ['Cross the causeway, set up at a campground and watch for bison.', 'Short shoreline hike, then leave.'],
    [], ['Bridger Bay Campground', 'Antelope Island State Park campgrounds'],
    ['Bison from a safe distance', 'Floating in salt water (check current lake conditions)', 'Bird watching'],
    ['Stay far from bison; they can run fast and are dangerous.', 'Biting insects can be heavy in early summer.'], [BOOK], ['utsp'], null);

  /* ===== Arizona ===== */
  T('az-grand-canyon-south-rim', 'Grand Canyon South Rim: rim camping basics', 'Arizona', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages (rim walks)', ['canyons', 'dark-sky', 'iconic'], 36.1, -112.1,
    'Camp in the pines near the rim, walk the paved rim path, take the park shuttle and watch the canyon change color at sunrise and sunset.',
    ['Arrive, set up in the forest, and walk to a rim viewpoint for sunset.', 'Ride the shuttle to overlooks, walk part of the rim path, and visit the visitor center.', 'Sunrise at a viewpoint, then head home.'],
    ['az-mather-campground-grand-canyon', 'az-desert-view-campground-grand-canyon'], [],
    ['Junior Ranger program', 'Shuttle bus', 'Condors and elk in the area'],
    ['Never let young kids run near unfenced rims.', 'Hiking down into the canyon in summer heat is the main cause of rescues. Little kids should stay on the rim.', 'The rim sits at roughly 7,000 ft; take it easy on day one.'], [BOOK], ['grca', 'rc'], null);

  T('az-grand-canyon-north-rim', 'Grand Canyon North Rim: quiet and cool', 'Arizona', ['summer', 'fall'], 3, 'moderate', 'Ages 5 and up', ['canyons', 'mountains', 'quiet'], 36.2, -112.1,
    'Higher, greener and less crowded than the South Rim. Meadows, aspens and easy rim trails. Access is seasonal.',
    ['Arrive and set up, then walk the short rim trail at the lodge area.', 'Easy forest and rim walks; picnic by a viewpoint.', 'Sunrise on the rim, then pack up.'],
    ['az-north-rim-campground-grand-canyon'], [],
    ['Meadows and cool air', 'Short flat rim trails', 'Stargazing'],
    ['The rim is open only part of the year and the road can close for snow. Check status before you go.', 'Services are far away; bring fuel and supplies.', 'Fenced and unfenced edges both need watching with kids.'], [BOOK], ['grca', 'rc'], 'Roughly 4.5 hours from Las Vegas or Flagstaff (approximate)');

  T('az-sedona-red-rocks', 'Sedona red rocks and Oak Creek', 'Arizona', SF.concat('winter'), 3, 'easy', 'All ages', ['desert', 'creek', 'scenic'], 34.9, -111.8,
    'Red cliffs, short scenic trails and a creek to splash in. Camp in the national forest near town.',
    ['Set up camp and take a short walk to a viewpoint.', 'Morning trail with a fun landmark, afternoon splashing in the creek (in season).', 'Quick scenic drive, then home.'],
    [], ['Cave Springs Campground', 'Pine Flat Campground', 'Manzanita Campground'],
    ['Creek wading', 'Scrambling on slickrock', 'Spotting rock shapes'],
    [HEAT, 'Red Rock Pass or parking rules apply at some trailheads; check the national forest page.', 'Rattlesnakes are present in warm months; stay on trails.'], [BOOK], ['coco', 'rc'], null);

  T('az-saguaro-tucson', 'Saguaro and Tucson desert weekend', 'Arizona', FW, 3, 'easy', 'All ages', ['desert', 'cactus', 'winter-sun'], 32.2, -111.2,
    'Giant cacti, roadrunners and a cool-season sunshine escape. Camp in a nearby park and visit both sections of Saguaro National Park.',
    ['Set up camp; short desert-nature walk before sunset.', 'Saguaro cactus loop drive and a short trail; a visit to a desert museum or zoo-style site if open.', 'Sunrise walk among the cacti, then head home.'],
    [], ['Gilbert Ray Campground (Tucson Mountain Park)', 'Catalina State Park Campground', 'Lost Dutchman State Park (Phoenix area)'],
    ['Looking for cactus wrens and roadrunners', 'Junior Ranger', 'Night walks with a red flashlight'],
    ['Never touch cacti; cholla spines jump into skin and clothes. Carry tweezers and a comb.', HEAT, 'Snakes and scorpions: shake out boots and shoes.'], [BOOK], ['sagu', 'azsp'], null);

  T('az-joshua-tree-to-grand-canyon-road-trip', 'Joshua Tree to Grand Canyon road trip', 'California/Nevada/Arizona', FW.concat([]), 8, 'moderate', 'Ages 6 and up', ['road-trip', 'desert', 'iconic'], 34.0, -115.9,
    'A desert tour linking Joshua Tree, the Mojave, Route 66 stops, Hoover Dam or Lake Mead and the Grand Canyon. Best in the cooler seasons.',
    ['Joshua Tree: boulders and a short Cholla or Hidden Valley walk.', 'Drive east across the Mojave with a Route 66 snack stop.', 'Optional Lake Mead and Hoover Dam day with a swim or picnic.', 'Head toward Flagstaff or Williams, an easy rest day.', 'Grand Canyon South Rim: rim walk and sunset.', 'Second canyon day: shuttle viewpoints and ranger program.', 'Leave via Sedona or Flagstaff.'],
    ['az-mather-campground-grand-canyon'], ['Joshua Tree NP campgrounds', 'Lake Mead area campgrounds'],
    ['Climbing boulders at Joshua Tree', 'Roadside Route 66 kitsch', 'Canyon at sunrise'],
    [HEAT, 'Long driving days; plan stops and keep a full water jug in the car.', 'Services are sparse on desert roads; fill the tank early.'], [BOOK], ['jotr', 'lake', 'grca', 'rc'], 'About 500 miles in total, with long days of driving (approximate)');

  T('az-chiricahua-sky-islands', 'Chiricahua: rock pinnacles and sky-island hikes', 'Arizona', SF, 3, 'moderate', 'Ages 5 and up', ['hoodoos', 'birds', 'hiking'], 32.0, -109.4,
    'Thousands of stone pinnacles, forested trails and unusual birds in a remote mountain range in southeast Arizona.',
    ['Arrive, set up, and drive the scenic road to a viewpoint.', 'A hike among the pinnacles suited to the kids age (shorter loops available).', 'Birding or a ranger program, then head home.'],
    [], ['Bonita Canyon Campground (Chiricahua NM)'],
    ['Balanced-rock shapes', 'Bird spotting', 'Quiet dark skies'],
    ['Remote location, little cell service.', HEAT, 'Watch for rattlesnakes on warm days.'], [BOOK], ['chir', 'rc'], null);

  T('az-flagstaff-petrified-forest', 'Flagstaff, Petrified Forest and the Painted Desert', 'Arizona', SSF, 4, 'easy', 'All ages', ['fossils', 'desert', 'volcanoes'], 35.2, -111.6,
    'Cool pine forests near Flagstaff, volcano and cliff-dwelling stops, and a day at fossil-wood hills in the Painted Desert.',
    ['Camp near Flagstaff and visit a volcano or lava-tube stop.', 'Easy cliff-dwelling or ruins visit nearby.', 'Drive east to Petrified Forest; short trails and the Painted Desert.', 'Return or continue to Meteor Crater.'],
    [], ['Flagstaff-area national forest campgrounds'],
    ['Finding colored petrified wood (leave it where it is)', 'Walking on old lava flows', 'Junior Ranger'],
    ['Removing petrified wood is illegal and harmful.', COLD, HEAT], [BOOK], ['pefo', 'coco'], null);

  /* ===== Nevada ===== */
  T('nv-valley-of-fire-lake-mead', 'Valley of Fire and Lake Mead', 'Nevada', FW, 3, 'easy', 'All ages', ['desert', 'lake', 'petroglyphs'], 36.5, -114.5,
    'Fiery sandstone, short trails to petroglyphs and a lake swim close to Las Vegas. Best from fall to spring.',
    ['Arrive at Valley of Fire; set up at a campground tucked among the rocks.', 'Short walks: petroglyphs and a color-banded rock area.', 'Lake Mead beach or shoreline stop before heading home.'],
    ['nv-atlatl-rock-campground-valley-of-fire', 'nv-arch-rock-campground-valley-of-fire'], ['Lake Mead NRA campgrounds'],
    ['Climbing on low rocks', 'Reading ancient rock art (from the trail)', 'Lake swimming in warm months'],
    [HEAT, 'Do not touch petroglyphs; skin oils damage them.', 'Flash floods are possible in washes during storms.'], [BOOK], ['vof', 'lake'], null);

  T('nv-great-basin-dark-skies', 'Great Basin: caves, bristlecones and dark skies', 'Nevada', SSF, 4, 'moderate', 'Ages 6 and up', ['dark-sky', 'caves', 'mountains'], 39.0, -114.2,
    'One of the darkest sky regions in the US with a cave tour, bristlecone pines and mountain camps. Remote; take supplies.',
    ['Arrive, set up, and look at the stars after dark.', 'Cave tour and a short walk to see old trees or alpine lakes.', 'Drive the scenic road toward Wheeler Peak and picnic at altitude.', 'Pack up and head out.'],
    ['nv-lower-lehman-creek-campground-great-basin', 'nv-upper-lehman-creek-campground-great-basin', 'nv-wheeler-peak-campground-great-basin', 'nv-baker-creek-campground-great-basin', 'nv-grey-cliffs-campground-great-basin'], [],
    ['Stargazing', 'Ranger cave tour (check tour rules and ages)', 'Seeing 3,000-year-old trees'],
    ['High elevation can cause headaches for kids; hydrate and go slow.', COLD, 'Gas and groceries are far away; bring plenty.', ROADS], [BOOK], ['grba', 'rc'], 'Remote, about 4 to 5 hours from Las Vegas or Salt Lake City (approximate)');

  T('nv-red-rock-canyon', 'Red Rock Canyon: Vegas-area desert camp', 'Nevada', FW, 2, 'easy', 'All ages', ['desert', 'scenic-drive', 'weekend'], 36.2, -115.4,
    'A quick red-rock escape from Las Vegas with a scenic loop drive and easy short trails. Great first-night desert campout.',
    ['Take the scenic loop and walk a short trail with kids, then set up camp.', 'Morning hike, then home.'],
    [], ['Red Rock Canyon Campground'],
    ['Climbing on low slick rocks', 'Burro and bighorn spotting (from afar)', 'Short canyon with a seasonal pool'],
    [HEAT, 'Entry systems can apply at times; check the official page.'], [BOOK], ['nvsp'], null);

  T('nv-cathedral-gorge-kershaw-ryan', 'Cathedral Gorge and Nevada state parks', 'Nevada', SF, 3, 'easy', 'All ages', ['canyons', 'state-parks', 'quiet'], 37.8, -114.4,
    'Fluted clay formations you can walk into, plus nearby state parks and an old-time rail stop. Quiet and uncrowded.',
    ['Arrive at Cathedral Gorge and walk into the slot-like clay gullies.', 'Visit nearby Kershaw-Ryan or Beaver Dam, and a ghost-town stop.', 'Return.'],
    [], ['Cathedral Gorge State Park Campground', 'Kershaw-Ryan State Park Campground'],
    ['Walking in clay canyons', 'Ghost-town exploring', 'Quiet skies'],
    ['Clay can be slippery or unstable when wet. Stay on marked routes.', HEAT, 'Roads are remote; carry water and a charged phone.'], [BOOK], ['nvsp'], null);

  /* ===== Colorado and New Mexico ===== */
  T('co-mesa-verde-cliff-dwellings', 'Mesa Verde: cliff dwellings and mesa-top camp', 'Colorado', ['spring', 'summer', 'fall'], 3, 'moderate', 'Ages 6 and up', ['history', 'cliff-dwellings', 'scenic-drive'], 37.2, -108.5,
    'Ancestral Puebloan cliff homes tucked under overhangs. Campground sits on the mesa with views of the valley.',
    ['Set up at the campground and take the scenic drive to overlooks.', 'Ranger-led cliff dwelling tour (tickets may be required; check) and short trail.', 'Museum visit, then leave.'],
    ['co-morefield-campground-mesa-verde'], [],
    ['Climbing ladders on tours', 'Junior Ranger', 'Peering into ancient rooms'],
    ['Tours involve ladders, stairs and heights; check rules for small kids.', 'Altitude is roughly 7,000 ft or higher.', ROADS], [BOOK], ['meve', 'rc'], null);

  T('co-black-canyon-curecanti', 'Black Canyon and Curecanti: deep gorge and reservoir', 'Colorado', SSF, 4, 'moderate', 'Ages 5 and up', ['canyons', 'lake', 'fishing'], 38.6, -107.7,
    'A very narrow, deep dark gorge to see from the rim, plus a reservoir for paddling and fishing nearby.',
    ['Set up camp at a lakeside campground.', 'Drive the rim road viewpoints at Black Canyon; short rim walk.', 'Paddle or fish at the reservoir; picnic.', 'Pack up.'],
    [], ['South Rim Campground (Black Canyon)', 'Elk Creek Campground (Curecanti)', 'Lake Fork Campground (Curecanti)'],
    ['Looking down into a dark canyon', 'Paddling calm water', 'Boat and fish from shore'],
    ['The canyon walls are very steep. Hold small hands at overlooks.', 'Cold nights even in summer.', 'Boat life jackets for kids.'], [BOOK], ['blca', 'cure', 'rc'], null);

  T('co-colorado-national-monument-grand-junction', 'Colorado National Monument and Grand Junction', 'Colorado', SF.concat('summer'), 3, 'easy', 'All ages', ['canyons', 'scenic-drive', 'fruit'], 39.1, -108.7,
    'A scenic rim drive with red canyons, short walks and an on-site campground, with orchards and farm stands nearby.',
    ['Arrive, set up and take a short rim-top walk.', 'Drive Rim Rock Road with stops at overlooks; picnic.', 'Fruit stand visit in town, then home.'],
    [], ['Saddlehorn Campground (Colorado National Monument)'],
    ['Overlook scavenger hunts', 'Bighorn spotting', 'Fresh peaches or fruit in season'],
    [HEAT, 'Some sections of the scenic drive are narrow with drop-offs.'], [BOOK], ['colm', 'rc'], null);

  T('nm-bandelier-santa-fe-hills', 'Bandelier and the Santa Fe high country', 'New Mexico', SSF, 3, 'easy', 'All ages', ['history', 'canyons', 'mountains'], 35.8, -106.3,
    'Cliff dwellings and cave rooms reached by easy trails, plus piny mountain camping near Santa Fe.',
    ['Set up camp; short canyon walk to the main ruins.', 'Climb ladders to cave rooms, then picnic by the creek.', 'Optional Santa Fe plaza stop on the way home.'],
    [], ['Juniper Campground (Bandelier)', 'Santa Fe National Forest campgrounds'],
    ['Climbing short ladders into cave rooms', 'Creek splash', 'Junior Ranger'],
    ['Altitude is about 6,000 to 7,000 ft; drink water.', 'Thunderstorms are common on summer afternoons.', ROADS], [BOOK], ['band', 'rc'], null);

  T('nm-white-sands-carlsbad', 'White Sands and Carlsbad Caverns', 'New Mexico/Texas', FW, 4, 'easy', 'All ages', ['dunes', 'caves', 'desert'], 32.8, -106.2,
    'Sled down gypsum dunes, then explore one of the great caves. Plan around cave tour rules and the heat.',
    ['White Sands: sled the dunes and have a picnic. Camp at a nearby state park.', 'Drive south toward Carlsbad.', 'Carlsbad Caverns: walk or ride in, ask rangers about tours.', 'Bat flights if offered in the season, then home.'],
    [], ['Oliver Lee Memorial State Park', 'Brantley Lake State Park (Carlsbad)'],
    ['Dune sledding', 'Exploring a huge cave', 'Evening bat flight (seasonal)'],
    [HEAT, 'Caves are cool and can be slippery; wear shoes with grip.', 'Check cave reservation rules.'], [BOOK], ['whsa', 'cave', 'nmsp'], null);

  /* ===== Texas ===== */
  T('tx-big-bend', 'Big Bend: desert, river and mountains', 'Texas', FW, 5, 'moderate', 'Ages 5 and up', ['desert', 'river', 'dark-sky'], 29.3, -103.2,
    'A huge, remote park with hot springs, canyons and dark skies. Plan for cool-season camping and long drives to get anywhere.',
    ['Arrive and set up at a campground; look for roadrunners.', 'Canyon walk (Santa Elena or Boquillas) and a visit to the visitor center.', 'Chisos Basin trail for older kids; or a hot springs soak (check conditions).', 'Scenic drive to a river overlook; picnic.', 'Pack up.'],
    [], ['Rio Grande Village Campground', 'Chisos Basin Campground', 'Cottonwood Campground'],
    ['Soaking in warm springs', 'Looking across the border river', 'Javelinas and roadrunners'],
    [HEAT, 'Cell service and fuel are scarce; fill up before entering.', 'Keep food stored; javelinas and bears are in the area.', 'Border area: check any current guidance.'], [BOOK], ['bibe', 'rc'], 'Remote; hours from the nearest large city (approximate)');

  T('tx-guadalupe-mountains', 'Guadalupe Mountains: high desert and sand dunes', 'Texas', SF, 3, 'moderate', 'Ages 6 and up', ['desert', 'mountains', 'dark-sky'], 31.9, -104.8,
    'Texas highest peaks, quiet campsites and a sand dune walk. Dry, windy and very quiet.',
    ['Arrive and set up at a campground; short nature walk.', 'Hike an easier trail with older kids, or visit Williams Ranch road area.', 'Pack up.'],
    [], ['Pine Springs Campground', 'Dog Canyon Campground'],
    ['Sand dunes', 'Mountain views', 'Night skies'],
    ['Wind can be strong and tents need extra staking.', HEAT, 'Little cell service.'], [BOOK], ['gumo', 'rc'], null);

  T('tx-padre-island-beach-camping', 'Padre Island: seashore camping', 'Texas', ['spring', 'fall', 'winter'], 3, 'easy', 'All ages', ['beach', 'birds', 'sea-turtles'], 27.4, -97.3,
    'Long sandy beaches, birds and a chance to learn about sea turtle nesting at a national seashore.',
    ['Set up near the beach and walk in the surf.', 'Beach combing, kite flying and a ranger talk.', 'Return.'],
    [], ['Malaquite Campground'],
    ['Looking for shells', 'Kite flying', 'Sea turtle talks (seasonal)'],
    ['Sun and wind are strong, bring shade.', 'Hurricane season runs through fall; check forecasts.', 'Driving on the beach may need a high-clearance vehicle and care with tides.'], [BOOK], ['pais', 'rc'], null);

  T('tx-hill-country-state-parks', 'Texas Hill Country: rivers, caves and bats', 'Texas', SF.concat('winter'), 3, 'easy', 'All ages', ['river', 'state-parks', 'caves'], 29.9, -98.9,
    'Spring-fed rivers, easy trails and bat flights. Texas state parks make a great beginner choice.',
    ['Set up at a state park campground; swim or wade in the river.', 'Short hike and a cave or bat-viewing stop in season.', 'Return.'],
    [], ['Garner State Park', 'Lost Maples State Natural Area', 'Pedernales Falls State Park'],
    ['Swimming and tubing in the river (when open)', 'Bat flight evenings', 'Easy hikes with creek crossings'],
    [FLASH, HEAT, 'Many state parks require day-use or camping reservations; check the park page.'], [BOOK], ['tpwd'], null);

  T('tx-palo-duro-canyon', 'Palo Duro Canyon: Texas Panhandle canyon', 'Texas', SF, 3, 'moderate', 'Ages 5 and up', ['canyons', 'rock-formations', 'hiking'], 34.9, -101.7,
    'A colorful canyon in the Texas plains with short trails to rock formations and cabins or campsites on the canyon floor.',
    ['Camp on the canyon floor and walk a short trail.', 'Hike to a famous rock formation; picnic.', 'Return.'],
    [], ['Palo Duro Canyon State Park campgrounds'],
    ['Lighthouse-style rock formation hike', 'Horseback options (check)', 'Night skies'],
    [HEAT, 'The canyon floor can flood in storms; stay out of low spots.', 'Wind and sudden weather changes are common.'], [BOOK], ['tpwd'], null);

  /* ===== East: Appalachians and Mid-Atlantic ===== */
  T('nc-great-smoky-cherokee-side', 'Great Smoky Mountains: North Carolina side', 'North Carolina', SSF, 4, 'easy', 'All ages', ['mountains', 'wildlife', 'streams'], 35.6, -83.5,
    'Creek splashing, elk in the Oconaluftee valley, and easy forest walks. The NC side is often calmer than the Tennessee side.',
    ['Set up camp near a stream; short creek-side walk.', 'See elk in the valley and visit the pioneer farmstead area.', 'Easy waterfall walk; picnic.', 'Pack up.'],
    ['nc-smokemont-campground-great-smoky', 'nc-balsam-mountain-campground-great-smoky'], [],
    ['Creek splashing', 'Elk viewing from a safe distance', 'Junior Ranger'],
    ['Stay at least the recommended distance from elk and bears.', 'Store food properly.', TICK, ROADS], [BOOK], ['grsm', 'rc'], null);

  T('nc-va-blue-ridge-parkway-camping', 'Blue Ridge Parkway: slow drive and camp', 'North Carolina/Virginia', SSF, 5, 'easy', 'All ages', ['road-trip', 'mountains', 'scenic-drive'], 36.6, -80.9,
    'A slow, scenic ridge drive with short overlooks and picnic stops. Choose a handful of campgrounds along the road.',
    ['Start at the northern end and camp at the first parkway campground.', 'Short waterfall and overlook stops, picnic.', 'Visit a farm or craft stop; easy hike.', 'More short stops and a ranger program if offered.', 'Finish the drive.'],
    [], ['Peaks of Otter Campground', 'Doughton Park Campground', 'Julian Price Campground', 'Mt Pisgah Campground'],
    ['Waterfalls near the road', 'Short ridge walks', 'Old mill and farm stops'],
    ['Fog is common and can reduce visibility on curvy roads.', ROADS, TICK], [BOOK], ['blri', 'rc'], 'About 470 miles end to end; take it slowly (approximate)');

  T('va-shenandoah-skyline-drive', 'Shenandoah: Skyline Drive and Big Meadows', 'Virginia', SSF, 3, 'easy', 'All ages', ['mountains', 'waterfalls', 'wildlife'], 38.5, -78.4,
    'A slow ridge drive, short hikes to waterfalls and meadows with deer. Excellent beginner trip near Washington DC.',
    ['Set up at Big Meadows; evening deer watching.', 'Short hike to a waterfall (choose a gentle one); picnic.', 'Another overlook stop, then home.'],
    ['va-big-meadows-campground-shenandoah'], [],
    ['Deer and wildflowers in meadows', 'Waterfall hikes', 'Junior Ranger'],
    ['Black bears live here; follow food storage rules.', TICK, 'Fog and fall crowds can slow the drive.'], [BOOK], ['shen', 'rc'], null);

  T('wv-new-river-gorge', 'New River Gorge: bridge, river and forest', 'West Virginia', SSF, 4, 'moderate', 'Ages 5 and up', ['river', 'bridge', 'hiking'], 38.0, -81.1,
    'A deep forested gorge with a famous bridge, river views and lots of outdoor options for kids at different ages.',
    ['Set up camp; walk to a bridge overlook.', 'Easy river-side trails or railroad-grade walks.', 'Optional guided whitewater or calm float for ages that fit.', 'Pack up.'],
    [], ['Grandview Sandbar Campground', 'Army Camp Campground', 'Babcock State Park'],
    ['Seeing the huge bridge from below', 'Short river trails', 'Splashing at the river'],
    ['Whitewater rafting has age and skill limits; use a licensed outfitter.', TICK, ROADS], [BOOK], ['neri', 'rc'], null);

  T('ky-mammoth-cave', 'Mammoth Cave: cave tours and forest camp', 'Kentucky', SSF, 3, 'easy', 'Ages 6 and up for most tours', ['caves', 'forest', 'rivers'], 37.2, -86.1,
    'The longest known cave system in the world. Pick a short family cave tour and hike in the woods above.',
    ['Set up camp; walk a short forest trail.', 'Take a ranger-led cave tour that suits your kids (check ages and booking).', 'Easy river or forest walk, then home.'],
    [], ['Mammoth Cave Campground'],
    ['Walking in the dark with lanterns or lights', 'Forest hikes', 'Junior Ranger'],
    ['Tours often sell out and have age or fitness limits. Check before you travel.', 'Cave air is cool. Pack a jacket.', TICK], [BOOK], ['maca', 'rc'], null);

  /* ===== East: Northeast ===== */
  T('me-schoodic-downeast', 'Schoodic and Downeast Maine: quieter Acadia', 'Maine', SSF, 4, 'easy', 'All ages', ['coast', 'tidepools', 'quiet'], 44.3, -68.0,
    'The quieter section of Acadia on the mainland peninsula with rocky shore walks, tidepools and biking on car-free roads.',
    ['Set up and walk to the shore to look at tidepools at low tide.', 'Bike an easy loop road; picnic at the shore.', 'Short hike up a small peak for views.', 'Pack up.'],
    ['me-schoodic-woods-campground-acadia'], [],
    ['Tidepool hunting at low tide', 'Biking easy roads', 'Crashing waves on granite'],
    ['Slippery wet rocks and waves can sweep people off the shore. Keep kids well back from the surf.', 'Water is cold; swimming is usually brief.', TICK], [BOOK], ['acad', 'rc'], null);

  T('ny-adirondacks-lake-camping', 'Adirondacks: lakes, canoes and campfires', 'New York', ['summer', 'fall'], 4, 'easy', 'All ages', ['lakes', 'canoeing', 'forest'], 44.1, -74.2,
    'Classic lake camping with canoes, loons and swimming. Many state campgrounds sit on water.',
    ['Set up on the lake; swim or paddle near shore.', 'Canoe or kayak across the lake; picnic.', 'Easy hike to a small mountain summit for older kids.', 'Pack up.'],
    [], ['Lake George Battlefield area campgrounds', 'Fish Creek Pond Campground', 'Meadowbrook Campground'],
    ['Canoeing', 'Loon listening', 'Swimming off the beach'],
    ['Bring and use life jackets.', 'Bugs (blackflies, mosquitoes) can be intense in late spring and early summer.', TICK], [BOOK], ['ny'], null);

  T('nh-white-mountains', 'White Mountains: waterfalls and easy peaks', 'New Hampshire', SU.concat('fall'), 4, 'moderate', 'Ages 5 and up', ['mountains', 'waterfalls', 'foliage'], 44.1, -71.6,
    'National forest campgrounds with easy waterfall walks, a notch drive and short family-friendly hikes. Spectacular fall color.',
    ['Set up in the forest, short brook walk.', 'Waterfall hike and picnic.', 'Scenic drive, small mountain or hut visit.', 'Pack up.'],
    [], ['Russell Pond Campground', 'Lafayette Place Campground', 'Basin Campground', 'Jigger Johnson Campground'],
    ['Waterfalls and swimming holes', 'Scenic notch drive', 'Fall color'],
    ['Weather on summits can change quickly; turn around if it worsens.', 'Parking passes may be needed at national forest trailheads; check the page.', 'Bugs in early summer.'], [BOOK], ['wmnf', 'nh'], null);

  T('ma-cape-cod-national-seashore', 'Cape Cod: dunes, ponds and beaches', 'Massachusetts', SU.concat('fall'), 4, 'easy', 'All ages', ['beach', 'bike', 'dunes'], 41.8, -70.0,
    'Sandy beaches, freshwater ponds for easy swimming, bike trails and lighthouse stops. Camp at private and state campgrounds nearby.',
    ['Set up and visit a beach; sandcastles and surf.', 'Bike trail ride and pond swim.', 'Lighthouse and visitor-center visit, tidepool stop.', 'Pack up.'],
    [], ['Nickerson State Park (Brewster)', 'Private campgrounds near Wellfleet and Truro'],
    ['Bike trails', 'Swimming in calm ponds', 'Lighthouse climbs'],
    ['Strong rip currents and cold water at ocean beaches. Swim at lifeguarded beaches.', 'Summer traffic and parking are tight.', TICK], [BOOK], ['caco', 'nh'], null);

  T('nc-outer-banks', 'Outer Banks: beaches, lighthouses and ferries', 'North Carolina', ['spring', 'summer', 'fall'], 5, 'easy', 'All ages', ['beach', 'lighthouses', 'history'], 35.5, -75.5,
    'Long barrier-island beaches, big lighthouses and a ferry to Ocracoke. Camp in the national seashore or at a private site.',
    ['Set up near the dunes; first beach evening.', 'Climb a lighthouse if open; visit the Wright Brothers site.', 'Ferry trip to Ocracoke for the village and beach.', 'Wildlife viewing at wildlife refuge.', 'Return.'],
    [], ['Oregon Inlet Campground', 'Cape Point Campground', 'Frisco Campground', 'Ocracoke Campground'],
    ['Climbing a striped lighthouse', 'Beach shelling', 'Ferry rides'],
    ['Hurricane season; check forecasts.', 'Rip currents are common. Swim near a lifeguard.', 'Mosquitoes and biting flies in warm months.'], [BOOK], ['caha', 'rc', 'nc'], null);

  T('fl-everglades-florida-keys', 'Everglades and Florida Keys camping', 'Florida', FW, 5, 'easy', 'All ages', ['wetlands', 'beach', 'snorkeling'], 25.3, -80.9,
    'Boardwalk wildlife in the Everglades, then a drive down the Keys with snorkeling and sunset stops. Best in the dry, cooler months.',
    ['Everglades: ranger program and boardwalk trails.', 'Gator-spotting walk at dawn; leave for the Keys.', 'Snorkel or glass-bottom boat tour at a Keys state park.', 'Beach day and a sunset stop.', 'Return north.'],
    [], ['Flamingo Campground (Everglades)', 'Long Key State Park', 'Bahia Honda State Park', 'John Pennekamp Coral Reef State Park'],
    ['Alligators and birds from boardwalks', 'Snorkeling at a coral-reef park', 'Seeing a manatee (seasonal)'],
    ['Keep a safe distance from alligators; do not feed wildlife.', 'Mosquitoes can be intense, especially in summer.', 'Hurricane season runs June to November.'], [BOOK], ['ever', 'bisc', 'fl'], null);

  /* ===== East/Central: Black Hills, Great Lakes, Midwest, Ozarks ===== */
  T('sd-black-hills-badlands', 'Black Hills and Badlands road trip', 'South Dakota', SU.concat(['fall']), 6, 'easy', 'All ages', ['road-trip', 'wildlife', 'history'], 43.9, -103.5,
    'Bison, prairie dogs, caves and granite needles. A classic family trip combining a state park, a cave park and the striking Badlands.',
    ['Camp at a Black Hills state park; drive the wildlife loop.', 'Wind Cave or a Jewel Cave tour (book if needed).', 'Easy hike and scenic drive among granite spires.', 'Drive to Badlands; sunset walk.', 'Badlands prairie dog town and short trails.', 'Return.'],
    ['sd-cedar-pass-campground-badlands'], ['Custer State Park campgrounds', 'Sylvan Lake area', 'Wind Cave Elk Mountain Campground'],
    ['Bison and burros up close (from the car)', 'Prairie dogs', 'Cave tour'],
    ['Never approach bison; they are dangerous.', 'Badlands rocks are crumbly and steep. Keep children on trail.', 'Summer heat and storms.'], [BOOK], ['wica', 'badl', 'sd'], null);

  T('mi-pictured-rocks', 'Pictured Rocks: Lake Superior cliffs', 'Michigan', SU.concat('fall'), 4, 'moderate', 'Ages 5 and up', ['great-lakes', 'cliffs', 'waterfalls'], 46.5, -86.3,
    'Colorful cliffs on Lake Superior, waterfalls and sandy beaches. Camp in the forest and take a boat cruise.',
    ['Set up in the Upper Peninsula; short walk to a beach.', 'Boat cruise along the cliffs (book ahead); waterfall walk.', 'Lighthouse and dunes stop.', 'Pack up.'],
    [], ['Munising Tourist Park Campground', 'Hurricane River Campground', 'Little Beaver Lake Campground'],
    ['Seeing the cliffs from a boat', 'Chilly beach play', 'Waterfall hikes'],
    ['Lake Superior is very cold and has dangerous currents. Keep kids close to the shore.', 'Biting flies and mosquitoes in early summer.', 'Cliffs have unfenced edges.'], [BOOK], ['piro', 'rc', 'miDnr'], null);

  T('mi-sleeping-bear-ludington-dunes', 'Michigan dunes: Sleeping Bear and Ludington', 'Michigan', SU.concat('fall'), 4, 'easy', 'All ages', ['dunes', 'great-lakes', 'beach'], 44.9, -86.0,
    'Climb huge sand dunes, swim in Lake Michigan and visit lighthouses. Two parks offer easy family camping.',
    ['Set up and play on the beach.', 'Dune climb and picnic at a scenic overlook.', 'Lighthouse or ferry day.', 'Pack up.'],
    [], ['D. H. Day Campground (Sleeping Bear)', 'Platte River Campground', 'Ludington State Park'],
    ['Running down the dunes', 'Lake swimming', 'Lighthouse climbing'],
    ['Dunes are hot underfoot in midsummer; wear shoes.', 'Check Lake Michigan beach flags for currents.', 'Do not allow kids to dig deep holes in dunes.'], [BOOK], ['slbe', 'indu', 'miDnr'], null);

  T('wi-door-county', 'Door County, Wisconsin: lake shore and cherry stops', 'Wisconsin', SU.concat('fall'), 3, 'easy', 'All ages', ['great-lakes', 'beach', 'small-town'], 45.2, -87.1,
    'State park camping on a Lake Michigan peninsula with calm water, bike paths and farm stops.',
    ['Set up and swim or paddle at a beach.', 'Bike ride on a park trail; fruit farm stop.', 'Pack up.'],
    [], ['Peninsula State Park', 'Potawatomi State Park', 'Newport State Park'],
    ['Biking park trails', 'Cherry or ice cream stops', 'Lighthouse'],
    ['Cool lake water; watch kids near the shore.', 'Bugs in early summer.', 'Popular sites book up early in summer.'], [BOOK], ['wi'], null);

  T('oh-hocking-hills', 'Hocking Hills: caves, waterfalls and gorges', 'Ohio', ['spring', 'summer', 'fall'], 3, 'easy', 'All ages', ['waterfalls', 'caves', 'forest'], 39.4, -82.5,
    'Short trails to recess caves and waterfalls in a leafy gorge system. Good for first-time hikers with kids.',
    ['Set up and take a short gorge walk.', 'Visit a waterfall and cave trail; picnic.', 'Easy stop at another gorge, then home.'],
    [], ['Hocking Hills State Park Campground', 'Private campgrounds near Logan, Ohio'],
    ['Walking behind waterfalls', 'Cave-like rock shelters', 'Fall color'],
    ['Stay on marked trails and rails; stairs and edges are slippery.', 'Parts of trails may be closed after storms or for repairs. Check the park page.', TICK], [BOOK], ['hoco', 'ohio'], null);

  T('ar-buffalo-river-ozarks', 'Buffalo River and the Ozarks', 'Arkansas', SF.concat('summer'), 4, 'easy', 'All ages', ['river', 'canoeing', 'elk'], 36.0, -93.1,
    'Float a calm stretch of river in canoes, camp by the water and look for elk in the valley.',
    ['Set up at a riverside campground; skip rocks.', 'Rent a canoe or kayak and take a gentle float.', 'Elk-viewing at dawn or dusk; waterfall walk.', 'Return.'],
    [], ['Buffalo Point Campground', 'Tyler Bend Campground', 'Lost Valley Campground'],
    ['Floating down the river', 'Elk watching', 'Bluffs and waterfalls'],
    ['River levels vary widely. Check conditions before floating.', 'Life jackets for children.', TICK], [BOOK], ['buff', 'ozark'], null);

  T('in-indiana-dunes', 'Indiana Dunes: Lake Michigan beach camping', 'Indiana', SU.concat('fall'), 3, 'easy', 'All ages', ['dunes', 'great-lakes', 'beach'], 41.6, -87.1,
    'A near-city dunes park with beaches, bird walks and short trails, a quick weekend near Chicago.',
    ['Set up, beach evening.', 'Dune climb, short trail and picnic.', 'Return.'],
    [], ['Dunewood Campground', 'Indiana Dunes State Park Campground'],
    ['Dune running', 'Beach play', 'Birdwatching'],
    ['Lake Michigan currents can be dangerous. Obey flags.', 'Dune vegetation is fragile. Stay on trails.', TICK], [BOOK], ['indu', 'rc'], null);

  T('nc-mountains-state-park-weekend', 'North Carolina mountains: easy state park weekend', 'North Carolina', SSF, 3, 'easy', 'All ages', ['mountains', 'state-parks', 'weekend'], 35.8, -82.1,
    'A low-key first camping weekend in a state park with short trails and creek or lake play.',
    ['Set up and take a short walk.', 'Lake paddling or creek play; picnic.', 'Pack up.'],
    [], ['Stone Mountain State Park', 'Hanging Rock State Park', 'Lake James State Park'],
    ['Creek wading', 'Paddling', 'Junior Ranger'],
    ['Some water can be fast after storms.', TICK, 'Check for reservation requirements.'], [BOOK], ['nc'], null);
})();
