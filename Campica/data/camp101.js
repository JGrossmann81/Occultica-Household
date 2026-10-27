/* Campica data pack: Camp 101 how-to library. Own words, conservative consensus guidance.
   src[] lists only pages that were LOCATED by search (see SOURCES-camp101.md; page text could not be read in the build session).
   Items with src:[] are general practice and are marked as such in the UI. */
window.CAMP101 = window.CAMP101 || { items: [] };
(function () {
  var A = window.CAMP101.items;
  var U = {
    fire: ['https://smokeybear.com/en/prevention-how-tos/campfire-safety/how-to-maintain-and-extinguish-your-campfire'],
    bear: ['https://www.nps.gov/romo/planyourvisit/food-storage-at-campgrounds-and-trailheads.htm', 'https://home.nps.gov/seki/planyourvisit/bears.htm'],
    dz: ['https://www.fsis.usda.gov/news-events/news-press-releases/usda-urges-consumers-keep-clear-danger-zone-summer'],
    co: ['https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Carbon-Monoxide-Information-Center/Portable-Heaters--Camping-Equipment', 'https://www.cdc.gov/mmwr/preview/mmwrhtml/mm4832a1.htm'],
    ltg: ['https://www.weather.gov/rnk/outdoorslightning'],
    tick: ['https://www.cdc.gov/ticks/media/pdfs/2025/07/CDC_Tick_Removal_Fact_Sheet.pdf'],
    lnt: ['https://www.nps.gov/articles/leave-no-trace-seven-principles.htm', 'https://lnt.org/why/7-principles/'],
    flood: ['https://www.weather.gov/ffc/flood_awareness_tadd'],
    lost: ['https://www.sdmrt.org/safety/hug-a-tree'],
    snake: ['https://www.nps.gov/petr/learn/nature/snakes.htm'],
    jr: ['https://www.nps.gov/pipe/learn/kidsyouth/junior-ranger.htm'],
    wf: ['https://readyforwildfire.org/prepare-for-wildfire/emergency-supply-kit/']
  };
  /* I(id,cat,title,icon,level,minutes,steps,o) ; o = {tips,warn,kids,see,src,ing} */
  function I(id, cat, title, icon, level, minutes, steps, o) {
    o = o || {};
    A.push({ id: id, cat: cat, title: title, icon: icon, level: level, minutes: minutes, steps: steps, tips: o.tips || [], warn: o.warn || [], kids: o.kids || '', seeAlso: o.see || [], src: o.src || [], ing: o.ing || null });
  }
  var S = 'starter', N = 'next';

  /* ===== FIRST TRIP ===== */
  I('first-checklist', 'first', 'First-trip checklist: what you really need', 'list', S, 10, [
    'Shelter: tent with rainfly, stakes, a small mallet or rock, and a groundsheet or footprint.',
    'Sleep: a sleeping bag for each person, a sleeping pad or air mattress for each person, and a pillow from home.',
    'Cook: a camp stove with fuel (or plan for a fire ring), lighter and matches in a bag, pot, pan, plates, cups, utensils, can opener.',
    'Eat and drink: a cooler with ice, water jugs, dish soap, a wash tub, sponge and trash bags.',
    'See: a headlamp for each person plus spare batteries, and one lantern for the table.',
    'Stay safe: first-aid kit, sunscreen, bug repellent, whistle for every child, a paper map of the area.',
    'Wear: layers, a warm hat, rain jacket, closed shoes and a spare dry set of clothes for each child.',
    'Comfort: camp chairs, a tarp for shade or rain, a broom or brush for the tent floor, and a few games.'
  ], { tips: ['Do a practice run: pitch the tent in the yard and sleep on the pad one night before you go.', 'Pack a "first night" bin with dinner, headlamps, and kids’ pajamas so you can find them in the dark.', 'Borrow or rent gear for your first trip; buy what you miss afterward.'], kids: 'Every camper gets a job when we pack: one carries the flashlight, one picks the games, one counts the water bottles. Put your own whistle and headlamp in your own bag.', see: ['gear-buy-first', 'first-pick-campground'], src: [] });

  I('first-pick-campground', 'first', 'Picking a first campground', 'tent', S, 10, [
    'Choose a place within about two hours of home so a rough night does not mean a long drive back.',
    'Look for a developed campground with flush toilets, drinking water and a ranger or host on site.',
    'Check what is nearby: a short flat trail, a beach or creek, a playground or visitor center for rainy hours.',
    'Read the booking rules. Many popular places fill months ahead; mid-week and shoulder seasons are easier.',
    'Check the forecast for the lowest night temperature, not just the daytime high.',
    'Check for fire restrictions, closures and smoke on the land manager’s website a few days before and again the morning you leave.',
    'Pick a quiet loop away from the road and the main bathrooms if you have a light sleeper; near the bathroom if you have a small child who needs it at night.'
  ], { tips: ['Cell service is often missing. Download directions and save the campground phone number before you leave home.', 'State parks and national forests are often cheaper and calmer than private resorts, but fewer have showers.'], see: ['first-arrive-daylight', 'rv-height-length'], src: [] });

  I('first-arrive-daylight', 'first', 'Arrive before dark', 'sun', S, 8, [
    'Plan to arrive with at least two hours of daylight; tent setup takes longer than expected the first few times.',
    'Check the sunset time for your date and count backward. Add a long buffer for traffic and a stop for ice and food.',
    'Check in first. Ask the host or ranger about quiet hours, firewood, water, bear rules and any closures.',
    'Walk the site before unloading: find the flattest spot, the fire ring, the table, and the way to the bathroom.',
    'Pitch the tent first, then make beds, then set up the kitchen. Put headlamps within reach before it gets dark.',
    'Cook an easy first dinner. Save fancy recipes for the second night.'
  ], { tips: ['If you will arrive late, call ahead; many campgrounds have a late-arrival process.', 'Bring a dinner that needs no cooking for the case where everything goes wrong.'], kids: 'The sun goes down fast. Our job is to get the tent up and find our flashlights before it gets dark, so camp feels cozy and not scary.', see: ['setup-site-choice'], src: [] });

  I('first-site-rules', 'first', 'Camp rules every family should know', 'info', S, 5, [
    'Quiet hours are usually about 10 pm to 6 am. Turn off music and keep voices low.',
    'Camp only on your numbered site and park only on the pad or spur.',
    'Use the fire ring provided; never build a new one.',
    'Buy firewood near where you burn it (the rules about carrying wood are meant to stop tree pests). Check what your park allows.',
    'Keep pets leashed and attended, and clean up after them.',
    'Check-out time is usually late morning. Pack the car, do a last walk around the site and leave it cleaner than you found it.'
  ], { tips: ['The rules are posted at the entrance or on your reservation. If in doubt, ask the host.'], see: ['lnt-seven', 'lnt-quiet'], src: [] });

  /* ===== SETTING UP ===== */
  I('setup-site-choice', 'setup', 'Choosing a spot for your tent', 'pin', S, 5, [
    'Look for level, slightly raised ground. Lie down on it to test the slope; your head should be at the high end.',
    'Avoid low spots and dry stream beds where rain collects or floods.',
    'Look up. Dead branches, called widow-makers, can fall in wind. Pick a spot with no dead limbs overhead.',
    'Clear sticks, rocks and pine cones with your hands; do not dig or trench.',
    'Put the door away from the wind and toward the morning sun if you can.',
    'Stay well back from the fire ring, the road and the water’s edge.'
  ], { tips: ['Use the designated tent pad if there is one.', 'In hot places choose shade; in cold places choose morning sun.'], warn: ['Never camp in a dry wash, narrow canyon or river bank when rain is in the forecast upstream.'], see: ['weather-flash-flood'], src: U.flood });

  I('setup-pitch-tent', 'setup', 'Pitching a dome tent', 'tent', S, 15, [
    'Spread the groundsheet or footprint, then the tent body on top. Keep it smaller than the tent so rain cannot pool under the floor.',
    'Stake or weigh down the floor corners first, so wind cannot take it.',
    'Join the poles, slide or clip them through the sleeves or clips, and flex them into the grommets one corner at a time.',
    'Check the tent is square, then put in the remaining floor stakes.',
    'Throw the rainfly over the top, match the door to the tent door, and clip it to all corners.',
    'Stake out the fly and any guy lines so it is tight and does not touch the tent body.',
    'Put shoes inside the vestibule and keep the door zipped to keep bugs out.'
  ], { tips: ['Read the tent’s instructions and practise at home.', 'Two people pitch twice as fast; make it a family job.'], kids: 'Kids can hold the poles, push stakes in with their feet, and zip the door. Always keep the poles out of the air when you carry them so nobody gets poked.', see: ['setup-stakes', 'setup-guy-lines', 'setup-rainfly'], src: [] });

  I('setup-stakes', 'setup', 'Staking and soil', 'tool', S, 5, [
    'Push stakes in at a slant of about 45 degrees, pointing away from the tent.',
    'Press down with your foot; use a mallet or a smooth rock for hard ground. Do not hit plastic stakes with metal.',
    'In soft sand or snow, bury the stake sideways (as a deadman) or tie the line to a stick, rock or bag of sand.',
    'In very hard ground, use longer stakes or tie off to a rock or tree.',
    'Pull stakes by the cord loop or with a second stake hooked through, not by yanking the tent.'
  ], { tips: ['Bring a few extra stakes; they bend and go missing.'], see: ['setup-pitch-tent'], src: [] });

  I('setup-guy-lines', 'setup', 'Guy lines and wind', 'route', N, 6, [
    'Pull the corners of the rainfly out first so it stands away from the tent.',
    'Run each guy line away from the tent in the direction of the seam it is attached to, and stake it at about arm’s length from the edge.',
    'Use the slider on the line to make it taut. A taut fly sheds wind and rain.',
    'Tie a bright cloth to each line, or use reflective cord, so nobody trips at night.',
    'In wind, put the narrow end of the tent toward the wind and lower the stake angle.'
  ], { tips: ['If the wind rises at night and the tent is thrashing, move people into a car or sturdy building. A tent is not a safe place in a severe storm.'], warn: ['Mark lines well; a tripped child can pull stakes or fall on a stake.'], see: ['weather-wind'], src: [] });

  I('setup-rainfly', 'setup', 'Rainfly, condensation and staying dry', 'cloud', N, 8, [
    'Use the rainfly any time rain is possible and on cool nights; it also cuts the dew that forms on the tent.',
    'Pull the fly tight so it does not touch the inner tent; touching walls wick water inside.',
    'Open the vents and a window a little even in cold weather; breath makes moisture and a sealed tent drips.',
    'Keep wet gear in the vestibule or a bag, not at your sleeping end.',
    'In the morning shake off the water and dry the tent in the sun before packing it, or dry it fully at home the same day.'
  ], { tips: ['A tarp over the picnic table creates a dry living room in rain.'], see: ['gear-tent-care'], src: [] });

  I('setup-warm-sleep', 'setup', 'Sleeping warm: pad, bag and clothes', 'bed', S, 8, [
    'The ground steals heat. A sleeping pad matters more than a thick bag. For cool nights, use one with an R-value of about 3 or more, or layer a foam pad under an air mattress.',
    'Pick a bag rated for lower than the coldest night. The comfort rating, not the limit rating, is the one to trust.',
    'Wear clean dry base layers and a warm hat to bed. Do not wear the clothes you sweated in.',
    'Eat a snack and drink some water before bed; your body makes heat from food.',
    'Pee before bed, since a full bladder makes you colder.',
    'Put tomorrow’s clothes inside the bag at your feet so they are warm in the morning.',
    'Bring a blanket for each child as a liner. Small children chill faster than adults.'
  ], { tips: ['A warm (not boiling) water in a leakproof hard bottle at the foot of an adult bag is a classic trick. Wrap the bottle so it does not touch skin directly.', 'Do not run a camp heater, grill or stove in the tent to stay warm. See carbon monoxide.'], warn: ['Shivering that will not stop, slurred speech or confusion in someone cold or wet is a sign to warm them up right away and get help.'], see: ['safety-cold-night', 'cook-co'], src: U.co });

  I('setup-car-layout', 'setup', 'Car camp layout: kitchen, tent, fire', 'car', N, 6, [
    'Put the kitchen (table, stove, cooler) at one end of the site, near the car but away from the tent door.',
    'Keep food, cooler and cook gear in one spot so you can put it away fast, especially in bear country.',
    'Keep the fire ring a safe distance from tents, tarps and trees, and downwind from the tent.',
    'Keep a clear path from tents to the bathroom and put a light on it.',
    'Hang a bag for trash and keep a tub for dish washing with a water jug beside it.',
    'Park so the headlights do not shine into other campers’ sites.'
  ], { tips: ['Use clear bins, one per task: kitchen, bedding, clothes, fun.'], see: ['wild-bear-food', 'fire-rules'], src: [] });

  I('setup-camp-kitchen', 'setup', 'Setting up a tidy camp kitchen', 'fork', N, 6, [
    'Wipe the picnic table. Cover it with a plastic cloth you can rinse.',
    'Set the stove on a flat, stable surface out of the wind. A windscreen saves fuel.',
    'Keep a hand-wash station: water jug with spigot, soap and a towel.',
    'Prepare a three-tub dish line: scrape, wash in hot soapy water, rinse with a splash of clean water.',
    'Keep the cooler in the shade, closed, and drain meltwater away from the site; do not dump near water.',
    'Store everything food-related when you are not using it.'
  ], { see: ['cook-cleanup', 'cook-food-safety'], src: [] });

  /* ===== FIRE AND COOKING ===== */
  I('fire-rules', 'cook', 'Fire rules before you strike a match', 'flame', S, 5, [
    'Check for fire restrictions or bans on the land manager’s website and at the entrance, every trip. Rules can change daily in dry weather.',
    'Use only established fire rings or grills. Never build a new ring.',
    'Never leave a fire alone, even for a minute. An adult must be with it as long as it burns.',
    'Keep a bucket of water and a shovel within reach.',
    'Do not burn trash, plastic, or treated wood. Burn only firewood bought nearby or wood the park allows you to gather.',
    'In high wind, skip the fire. Sparks can travel.'
  ], { warn: ['Never use gasoline, lighter fluid on a hot fire, or other accelerants.', 'If a fire ban is in place, a camp stove may still be allowed but ask; the rule is sometimes stricter.'], kids: 'Fire is a grown-up tool. Kids stay at least a big step stool’s length (about 3 feet) from the ring unless an adult is right beside them. Stop, drop and roll if clothes ever catch fire.', see: ['fire-build', 'fire-out', 'weather-fire-restrictions'], src: U.fire });

  I('fire-build', 'cook', 'Building a small, safe campfire', 'flame', S, 15, [
    'Clear the ring of leaves and sticks, with at least a 10-foot circle of clear ground around it.',
    'Gather three sizes of wood: tinder (dry grass, bark, paper), kindling (pencil-thin sticks), and fuel logs (wrist-thick and up).',
    'Place a bundle of tinder in the center, lean kindling over it like a tent, and keep the fuel wood nearby.',
    'Light the tinder at the base from the upwind side. Add kindling gradually as it catches.',
    'Add bigger logs only when the kindling burns steadily. Keep flames low, no higher than knee-high.',
    'Stay with it. Keep children seated and clothing and hair away from flames.',
    'Start burning down the fire an hour before you want to go to bed so it is nearly ash when you turn in.'
  ], { tips: ['Dry softwood and kindling make a quick start; hardwood lasts longer.', 'A fire starter cube or cardboard egg carton with wax makes starting easy and clean.'], warn: ['Keep sleeping bags, tents, chairs and blankets away from sparks. Synthetic fabrics melt.'], see: ['fire-rules', 'fire-out'], src: U.fire });

  I('fire-out', 'cook', 'Putting a fire out: drown, stir, feel', 'drop', S, 10, [
    'Let the fire burn down to ash and small pieces. Do not pile on new logs near bedtime.',
    'Drown: pour plenty of water on all the embers, not just the flames. You will hear hissing and see steam.',
    'Stir: use a shovel or stick to turn the ashes and embers so water gets to the bottom. Scrape any partly burned sticks.',
    'Feel: hold the back of your hand above the ashes, then, with a gloved hand or tool, check pieces. If anything is still too hot to touch, it can still start a fire.',
    'Repeat drown, stir, feel until everything is cool and there is no steam or hiss.',
    'If you have no water, stir dirt or sand into the embers, but use water whenever you can.',
    'Never bury hot coals; they can smolder and flare up later.'
  ], { tips: ['Keep a water jug marked "fire" so it is ready when needed.'], warn: ['A fire that looks out can hold heat for hours. Treat ash as hot until it is cold to the touch.'], kids: 'Smokey Bear says only you can prevent wildfires. After a campfire we do three things: drown it with water, stir it with a stick, and feel for heat with the back of a hand held above it. It is out only when it is cold.', see: ['fire-rules'], src: U.fire });

  I('cook-stove', 'cook', 'Camp stove safety', 'fuel', S, 8, [
    'Set up the stove outdoors on a level, stable table or ground, away from tents, dry grass and overhanging branches.',
    'Check hoses and connections for damage and leaks before each trip. For propane, brush soapy water on connections; bubbles mean a leak.',
    'Open the valve slowly, light the burner, and never lean over it while lighting.',
    'Keep pot handles turned in, stay with the stove, and keep children and pets back.',
    'When done, turn off the burner and the fuel valve, and let it cool before packing.',
    'Store fuel upright, away from heat, never in a hot closed car or inside a tent.'
  ], { warn: ['Never use a stove, lantern or grill inside a tent, camper or vehicle, even with the door open.', 'If you smell gas, turn the fuel off, move away from all flames and sparks, and call the fire department if it persists.'], see: ['cook-co', 'rv-propane'], src: U.co });

  I('cook-co', 'cook', 'Carbon monoxide: never cook or heat in a tent', 'alert', S, 5, [
    'Carbon monoxide (CO) is a gas you cannot see or smell. Any flame or engine that burns fuel makes it: stoves, grills, charcoal, lanterns, heaters, generators.',
    'Use all of these outside only, well away from tent doors, windows and vents.',
    'Do not bring a hot grill or charcoal into a tent to keep warm. Charcoal can keep making CO after it looks out.',
    'Use a battery CO alarm in an RV or camper and test it before the trip.',
    'Put generators far from sleeping areas and downwind.',
    'If anyone has a headache, dizziness, nausea or confusion while a fuel burner is nearby, get everyone into fresh air and call 911.'
  ], { warn: ['CO can kill sleeping people with no warning. A cracked window or open door is not enough.'], kids: 'Never cook or keep a heater inside the tent. Outside is where fires and stoves live.', see: ['cook-stove', 'setup-warm-sleep'], src: U.co });

  I('cook-food-safety', 'cook', 'Food safety: temperatures and the cooler', 'thermo', S, 8, [
    'Keep cold food at 40 °F (4 °C) or below and hot food at 140 °F (60 °C) or above. Between those two numbers is the danger zone where bacteria multiply fast.',
    'Do not leave food in the danger zone more than 2 hours, or 1 hour if it is above 90 °F (32 °C).',
    'Cook to safe inside temperatures, checked with a thermometer: 165 °F for poultry and leftovers, 160 °F for ground meat, 145 °F for whole beef, pork and fish.',
    'Pack a cooler in layers: block ice on the bottom, raw meat sealed in bags or bins on the bottom, ready-to-eat food on top.',
    'Pre-chill the cooler, and freeze meat and drinks before the trip. Keep the cooler in shade and the lid shut.',
    'Use a thermometer in the cooler. If it climbs above 40 °F, eat or toss the perishables.',
    'Use separate boards, plates and tongs for raw and cooked food.',
    'Wash hands with soap and clean water before cooking and eating, or use sanitizer after you wash off dirt.'
  ], { tips: ['Keep a small second cooler for drinks so the food cooler stays closed.', 'When in doubt, throw it out.'], see: ['cook-cleanup'], src: U.dz });

  I('cook-cleanup', 'cook', 'Dishes, garbage and clean camp', 'trash', S, 8, [
    'Scrape food into a trash bag, not onto the ground.',
    'Wash in a tub away from streams and lakes with a small amount of biodegradable soap. Rinse in a second tub.',
    'Strain the grey water through a mesh to catch food bits, bag the bits, and scatter the water as the campground allows (some campgrounds have a drain).',
    'Sanitise with a splash of hot water if you have it, then air dry on a clean towel.',
    'Take garbage to the dumpster at night in bear country, or lock it in the bear box or car as the campground says.',
    'Wipe the table and the stove.'
  ], { tips: ['A bucket and a pair of tongs are good for picking up bits at the end.'], see: ['lnt-seven', 'wild-bear-food'], src: [] });

  I('cook-dutch-oven', 'cook', 'Dutch oven basics', 'fork', N, 20, [
    'A camp Dutch oven is a heavy lidded pot, often with legs and a lip on the lid for coals.',
    'Season it before the trip (cast iron: oil lightly and bake). After cooking, wash with hot water, dry thoroughly and rub with a thin film of oil.',
    'Heat: use charcoal briquettes or hot coals from the fire. Start with a modest number, check the pot with an oven thermometer, and add or remove a few at a time. Coal counts depend on pot size, so follow the chart that came with your oven.',
    'For baking, put most of the coals on the lid and a few under the pot; for stews and chili, put more underneath.',
    'Rotate the oven a quarter turn and the lid a quarter turn the opposite way every 10-15 minutes so nothing scorches.',
    'Lift the lid with a lid lifter or heavy gloves and dust ash off before opening so none gets in the food.',
    'Let the pot cool before cleaning.'
  ], { tips: ['Line the oven with foil or a parchment liner for easy cleanup.', 'Start with a one-pot meal like chili or cobbler.'], warn: ['Cast iron and coals are extremely hot. Keep children well back and use heat gloves.'], see: ['meal-cobbler', 'meal-chili-cornbread'], src: [] });

  I('cook-smores', 'cook', 'S’mores and fireside treats', 'star', S, 15, [
    'Classic: toast a marshmallow on a long stick over glowing coals, not flames. Place it between two graham crackers with a square of chocolate.',
    'Gooey chocolate: rest the chocolate on the warm graham for a moment so it softens before the marshmallow goes on.',
    'Peanut butter cup swap: use a peanut butter cup instead of plain chocolate.',
    'Cookie smore: use two chocolate chip cookies and a chocolate square.',
    'Fruity: add a slice of strawberry or banana.',
    'Indoor-style: make a "smores dip" by melting chocolate chips and marshmallows in a small foil pan on the grate until bubbly. Dip crackers in it.',
    'Check allergies, such as peanut, nut and gluten, before you share.'
  ], { warn: ['Marshmallows burn hotter than they look and can stick to skin. Let it cool a little. Keep sticks pointing down when walking.'], kids: 'Hold your stick low and slow. Count to ten before you taste it. Nobody runs with a marshmallow stick.', see: ['fire-build'], src: [] });

  /* ===== MEALS (25+) ===== */
  function M(id, title, minutes, ing, steps, tip, level) {
    I(id, 'meals', title, 'fork', level || S, minutes, steps, { ing: ing, tips: tip ? [tip] : [], kids: '', see: ['cook-food-safety'], src: [] });
  }
  M('meal-foil-sausage', 'Sausage and veggie foil packets', 30,
    ['Pre-cooked smoked sausage, sliced', 'Baby potatoes, quartered', 'Bell pepper and onion, chopped', 'Olive oil, salt, pepper', 'Heavy-duty foil'],
    ['Tear two squares of foil per packet and double them.', 'Toss everything with oil, salt and pepper and pile in the center.', 'Fold the foil into a sealed pouch with a little room for steam.', 'Cook on a grate over coals for about 25-30 minutes, flipping once. Potatoes should be soft when pierced.', 'Open carefully; steam is hot. Let it cool a few minutes.'], 'Cut potatoes small so they cook through.');
  M('meal-foil-chicken', 'Chicken fajita foil dinner', 30,
    ['Chicken breast strips', 'Peppers and onion, sliced', 'Fajita seasoning', 'Oil', 'Tortillas, cheese, salsa'],
    ['Mix chicken, vegetables, oil and seasoning in a bag at home or camp.', 'Divide onto doubled foil and seal.', 'Cook over medium coals for about 20-25 minutes, turning once.', 'Check that the chicken reaches 165 °F with a thermometer.', 'Serve in warm tortillas with cheese and salsa.'], 'Keep raw chicken cold until cooking, and wash your hands after handling.');
  M('meal-foil-salmon', 'Lemon-dill salmon packets', 25,
    ['Salmon fillets (frozen, thawed in cooler)', 'Lemon slices', 'Dried dill or herbs', 'Butter or oil, salt', 'Green beans or asparagus'],
    ['Place each fillet on doubled foil with beans on the side.', 'Top with butter, herbs, salt and lemon.', 'Seal and cook on a grate over coals for about 12-15 minutes.', 'Fish is done when it flakes easily; internal temperature should be 145 °F.'], 'Eat fish on the first or second night while the cooler is coldest.');
  M('meal-hobo-burger', 'Hobo burger packets', 35,
    ['Ground beef patties', 'Sliced potatoes and carrots', 'Onion slices', 'Salt, pepper, ketchup'],
    ['Layer vegetables, then a patty on foil. Season.', 'Seal tightly in double foil.', 'Cook on coals about 25-30 minutes, flipping once.', 'Check the patty reaches 160 °F in the center.'], 'Slice the vegetables thin or they stay hard.');
  M('meal-cheesy-potatoes', 'Cheesy campfire potatoes', 35,
    ['Potatoes, cubed', 'Cheddar cheese, shredded', 'Bacon bits or cooked bacon', 'Butter', 'Salt and pepper'],
    ['Combine potatoes, butter and seasonings on foil.', 'Seal and cook on coals for about 25 minutes until tender.', 'Open, add cheese and bacon, reseal for a few minutes to melt.'], 'Great side for burgers or sausages.');
  M('meal-breakfast-burrito', 'Breakfast burritos in a skillet', 20,
    ['Eggs', 'Tortillas', 'Cheese', 'Cooked sausage or beans', 'Salsa'],
    ['Warm the skillet on the stove with a little oil.', 'Scramble eggs and add the sausage or beans.', 'Stuff into warm tortillas with cheese and salsa.', 'Wrap in foil to keep warm for people who eat later.'], 'Pre-cook the filling at home and reheat for the easiest morning.');
  M('meal-pancakes', 'Pancakes on a griddle', 25,
    ['Pancake mix (just-add-water type)', 'Water or milk', 'Oil or butter', 'Syrup', 'Blueberries or chocolate chips'],
    ['Mix batter in a pitcher or bottle for easy pouring.', 'Heat a lightly oiled pan or griddle on medium.', 'Pour rounds, flip when bubbles pop on top, about 2 minutes a side.', 'Keep done pancakes warm under foil.'], 'Mix at camp, not at home, since batter spoils in a warm car.');
  M('meal-oatmeal-bar', 'Oatmeal toppings bar', 10,
    ['Instant or quick oats', 'Hot water', 'Raisins, nuts, brown sugar', 'Apple slices, cinnamon'],
    ['Boil water on the stove.', 'Fill bowls with oats and add hot water; cover for a few minutes.', 'Set out toppings and let everyone build a bowl.'], 'Kids love to choose the toppings; check nut allergies first.');
  M('meal-egg-pepper', 'Egg-in-a-pepper', 20,
    ['Bell peppers, cut into thick rings', 'Eggs', 'Oil', 'Salt, pepper'],
    ['Heat a pan and oil it lightly.', 'Place pepper rings in the pan and crack an egg into each.', 'Cook until the white sets and the yolk is as firm as you like, flipping if desired.'], 'Eggs must be cooked until firm for small children.', N);
  M('meal-overnight-oats', 'Cooler overnight oats', 5,
    ['Rolled oats', 'Milk or yogurt', 'Fruit', 'Honey or maple syrup (not for babies under 1 year)', 'Jars with lids'],
    ['At home or the night before, mix oats and milk in a jar, 1 part oats to 1 part milk.', 'Seal and keep in the cooler overnight.', 'Top with fruit in the morning and eat cold.'], 'No stove needed for the first morning.');
  M('meal-french-toast', 'Camp French toast', 20,
    ['Bread slices', 'Eggs', 'Milk', 'Cinnamon', 'Butter, syrup'],
    ['Whisk eggs, milk and cinnamon in a shallow dish.', 'Dip bread to coat both sides.', 'Fry in buttered skillet 2-3 minutes a side until golden and firm.'], 'Use day-old bread for sturdier slices.', N);
  M('meal-walking-tacos', 'Walking tacos', 15,
    ['Snack-size bags of corn chips', 'Taco meat (cooked) or chili', 'Cheese, lettuce, salsa'],
    ['Warm the meat or chili in a pot.', 'Crush chips gently in the bag, open the top and spoon in meat and toppings.', 'Eat with a fork right from the bag.'], 'No plates to wash.');
  M('meal-pie-iron-pizza', 'Pie-iron pizza pockets', 20,
    ['Bread slices', 'Pizza sauce', 'Mozzarella', 'Pepperoni or vegetables', 'Butter'],
    ['Butter the outsides of two slices of bread.', 'Put sauce, cheese and toppings between them inside the pie iron.', 'Close, trim any bread sticking out, and hold over coals for 3-4 minutes a side.', 'Open carefully; the filling is hot.'], 'Use a long-handled iron and let an adult handle it.');
  M('meal-quesadilla', 'Skillet quesadillas', 15,
    ['Tortillas', 'Shredded cheese', 'Beans or cooked chicken', 'Salsa'],
    ['Heat a dry or lightly oiled pan.', 'Place a tortilla, cover half with cheese and filling, fold over.', 'Cook until golden and cheese melts, about 2-3 minutes a side.', 'Cut into wedges.'], 'A great quick lunch for picky eaters.');
  M('meal-hot-dogs', 'Hot dogs and the roasting stick', 15,
    ['Hot dogs (fully cooked)', 'Buns', 'Mustard, ketchup, relish'],
    ['Skewer a hot dog on a clean roasting stick or fork.', 'Hold over glowing coals, turning, until hot all the way through and a little blistered.', 'Serve in a bun.'], 'Cut hot dogs lengthwise for toddlers; they are a choking hazard in round slices.');
  M('meal-chili', 'One-pot camp chili', 40,
    ['Ground beef or turkey, or extra beans', 'Canned beans', 'Canned crushed tomatoes', 'Onion', 'Chili seasoning'],
    ['Brown the meat with onion in a pot, then drain excess fat into a container for the trash.', 'Add beans, tomatoes and seasoning.', 'Simmer for 20-30 minutes, stirring.', 'Top with cheese and chips.'], 'Make it at home and reheat to a boil at camp to save time. Reheat leftovers to 165 °F.');
  M('meal-one-pot-pasta', 'One-pot pasta', 25,
    ['Pasta (short shapes)', 'Jar of sauce', 'Water', 'Parmesan', 'Pre-cooked meatballs or vegetables'],
    ['Put pasta, sauce and enough water to cover in a pot.', 'Bring to a boil, then simmer, stirring often, until the pasta is tender and the sauce is thick.', 'Add precooked meatballs or vegetables for the last few minutes.'], 'Stir often so it does not stick.');
  M('meal-mac-upgrade', 'Dressed-up mac and cheese', 20,
    ['Boxed mac and cheese', 'Frozen peas or broccoli', 'Cooked sausage or tuna'],
    ['Boil macaroni as the box says; add frozen vegetables in the last few minutes.', 'Drain, using a lid to hold back the pasta, and carefully pour water away from camp as allowed.', 'Stir in the cheese packet and any cooked sausage or fish.'], 'Handle the boiling pot with care; keep children back.');
  M('meal-banana-boats', 'Banana boats', 15,
    ['Bananas, unpeeled', 'Chocolate chips', 'Mini marshmallows'],
    ['Slit the banana lengthwise through the peel, not all the way through.', 'Stuff with chocolate and marshmallows.', 'Wrap in foil and place on coals for about 5-10 minutes.', 'Open carefully and eat with a spoon.'], 'A quick dessert for kids.');
  M('meal-foil-nachos', 'Foil pan nachos', 15,
    ['Tortilla chips', 'Shredded cheese', 'Canned black beans, drained', 'Salsa, sour cream'],
    ['Layer chips, beans and cheese in a foil pan.', 'Cover with foil and put on the grate over medium heat for 5-8 minutes until the cheese melts.', 'Top with salsa.'], 'Share from the pan to save dishes.');
  M('meal-rice-bowls', 'Rice and beans bowls', 25,
    ['Instant or pre-cooked rice pouches', 'Canned beans', 'Corn, salsa', 'Cheese, avocado'],
    ['Heat the rice as the package says.', 'Warm beans and corn in a pot.', 'Build bowls with toppings.'], 'Cheap, filling, and good for vegetarians.');
  M('meal-stir-fry', 'Veggie sausage stir-fry', 25,
    ['Pre-cooked sausage or tofu', 'Frozen stir-fry vegetables', 'Soy sauce', 'Oil', 'Instant rice'],
    ['Heat oil in a large pan.', 'Cook vegetables for several minutes, then add sausage or tofu and sauce.', 'Serve over rice.'], 'Use frozen vegetables to double as ice in the cooler.', N);
  M('meal-grilled-cheese', 'Campfire grilled cheese', 15,
    ['Bread', 'Cheese slices', 'Butter'],
    ['Butter the outside of two bread slices and put cheese between them.', 'Cook in a skillet or pie iron over medium heat until golden and melted.', 'Serve with tomato soup warmed in a pot.'], 'Low heat melts the cheese before the bread burns.');
  M('meal-fish-tacos', 'Easy fish tacos', 25,
    ['Firm white fish fillets', 'Tortillas', 'Cabbage slaw mix', 'Lime', 'Salsa or yogurt sauce'],
    ['Season fish with salt and spices.', 'Pan-fry 3-4 minutes a side until it flakes; check it reaches 145 °F.', 'Serve in tortillas with slaw, lime and sauce.'], 'Eat early in the trip while the fish is cold.', N);
  M('meal-trail-mix', 'Build-your-own trail mix', 5,
    ['Cereal or pretzels', 'Dried fruit', 'Chocolate chips', 'Seeds or nuts (check allergies)'],
    ['Set out bowls of ingredients.', 'Let each person fill a zip bag with a handful of each.', 'Label bags with names.'], 'Use seeds instead of nuts at schools and shared sites where allergies matter.');
  M('meal-popcorn', 'Campfire popcorn', 15,
    ['Popcorn kernels', 'Oil', 'Salt, butter', 'Pot with lid, or foil pouches'],
    ['Heat a little oil in a large pot with a lid on the stove.', 'Add kernels in a single layer and cover, shaking gently as they pop.', 'Remove when popping slows to a couple of seconds between pops.', 'Season.'], 'Hot oil can spit. Keep little kids back.');
  M('meal-cobbler', 'Dutch oven peach cobbler', 50,
    ['Canned peaches', 'Yellow or white cake mix', 'Butter', 'Cinnamon'],
    ['Line a Dutch oven with foil or grease it; pour in the peaches with juice.', 'Sprinkle the dry cake mix evenly over the fruit and dot with butter and cinnamon.', 'Cover and cook over coals with some on the lid for about 35-45 minutes until golden and bubbling.'], 'Use heat gloves and let it cool before serving.', N);
  M('meal-chili-cornbread', 'Cornbread in the Dutch oven', 45,
    ['Cornbread mix', 'Egg, milk or water', 'Butter', 'Pot of chili to serve with it'],
    ['Mix batter in a bowl as the box says.', 'Pour into a lined, greased Dutch oven.', 'Cook with coals under and on the lid for about 25-30 minutes until a stick comes out clean.'], 'Serve with chili.', N);
  M('meal-hash', 'Breakfast hash skillet', 30,
    ['Potatoes, diced small', 'Onion and pepper', 'Pre-cooked sausage', 'Eggs'],
    ['Cook potatoes in oil in a large pan on medium until crisp, stirring.', 'Add onion, pepper and sausage and cook until soft.', 'Make wells and crack eggs on top; cover until the whites set and yolks are firm.'], 'A one-pan breakfast with little cleanup.', N);

  /* ===== KIDS ===== */
  I('kids-rules', 'kids', 'Camp rules for kids', 'star', S, 6, [
    'Stay where a grown-up can see you, or use the buddy system.',
    'Keep a whistle on a string around your neck. Blow it only for help: three loud blasts.',
    'Walk, do not run, around the fire ring and the tents.',
    'Never go near the water without an adult.',
    'Do not touch or feed wild animals, even if they are cute.',
    'Pick up your trash and leave plants and rocks where they are.',
    'Tell a grown-up before you go to the bathroom, and go with a buddy at night.',
    'Do not eat any berry, mushroom or plant from the wild.'
  ], { kids: 'Camp rules keep us safe and keep camp fun. Whistle three times means HELP. Stay with your buddy, stay away from the fire and the water unless a grown-up is with you, and never eat wild plants.', tips: ['Practice the whistle at the start of the trip and go over the rules in a family meeting.'], see: ['kids-lost-plan', 'kids-whistle'], src: U.lost });

  I('kids-lost-plan', 'kids', 'If a child gets lost: the family plan', 'pin', S, 10, [
    'Before you leave camp each day, tell your child the boundaries: landmarks they can see, and which way is camp.',
    'Give each child a whistle on a lanyard. Teach three loud blasts as the signal for help, and practice.',
    'Teach "Hug a tree": if you are lost, stop. Stay put. Find a spot near a tree or clearing, stay there, and keep blowing the whistle.',
    'Dress kids in bright clothes so they are visible, and take a photo of them each morning in what they are wearing.',
    'If a child is missing, check the immediate area for a few minutes, then call 911 or the ranger quickly. Do not wait.',
    'Tell the searchers where the child was last seen, what they are wearing, and their favorite things.',
    'One adult stays at the last-seen spot in case the child returns. Do not scatter the group.',
    'If you are the lost child: stay put, make yourself big and visible, blow the whistle, and do not follow streams or roads.'
  ], { tips: ['Tell the child that people are looking for them and nobody will be angry.', 'Missing child cases are often solved quickly by calling for help early.'], warn: ['Do not let children go off alone at dusk or in fog.'], kids: 'If you cannot find us, STOP. Stay where you are, near a tree or a big rock. Blow your whistle three times, wait, and blow again. We are looking for you and we will find you. You will not be in trouble.', see: ['kids-whistle', 'kids-stranger'], src: U.lost });

  I('kids-whistle', 'kids', 'Whistle practice: three blasts', 'bolt', S, 5, [
    'Give each child a plastic whistle on a lanyard. Pick a safe place for a short test.',
    'Show the pattern: one long breath, three loud blasts in a row, then a pause, then again.',
    'Explain that this is the universal distress signal and that nobody blows it for play.',
    'Make a game of it: one person hides within sight, blows three times, and others find them.',
    'Stop the game after a few rounds so the neighbors are not disturbed.'
  ], { tips: ['Attach the whistle to a child’s zip pull so it is always handy.'], kids: 'Three loud blasts means help! Blow it only if you really need us. Practice with us first.', see: ['kids-lost-plan'], src: U.lost });

  I('kids-stranger', 'kids', 'Strangers and safe adults at camp', 'heart', S, 6, [
    'Teach children that camp is full of friendly people, but they do not go off with anyone, including an adult they just met, without checking with a parent.',
    'Show them whom to ask for help: a ranger, camp host or a parent with children.',
    'Practice saying "No, I need to ask my mom or dad" and "I need help."',
    'Tell them it is okay to be loud and to leave if someone makes them uncomfortable, even if it is an adult.',
    'Tell them they will never be in trouble for telling you something that worries them.',
    'Keep a flexible but real watch over young children. Know where they are.'
  ], { kids: 'Rangers and camp hosts wear uniforms or badges and are good helpers. If anyone makes you feel weird or asks you to keep a secret, tell a grown-up you trust right away.', see: ['kids-lost-plan'], src: [] });

  I('kids-junior-ranger', 'kids', 'Junior Ranger programs', 'star', S, 5, [
    'Ask at the visitor center for the Junior Ranger booklet for that park. Many are free.',
    'Do the activities in the booklet for your age group: hikes, nature observations, drawings, quizzes.',
    'Attend a ranger program if one is offered, which often counts toward the badge.',
    'Return the booklet to a ranger, who may ask you about what you learned.',
    'Take the oath, and get a badge or patch.'
  ], { tips: ['Many parks have online or printable booklets in advance. Check the park’s website.', 'State parks and national forests often have similar programs.'], kids: 'You can become a Junior Ranger! Do the activities, tell the ranger what you learned, say the promise to take care of the park, and you get a real badge.', see: ['kids-scavenger'], src: U.jr });

  I('kids-scavenger', 'kids', 'Nature scavenger hunts', 'eye', S, 20, [
    'Make a list with pictures for little ones: something smooth, something rough, something green, a feather, a pinecone, an animal track.',
    'Give each child a small bag or egg carton to collect in.',
    'Teach "look, do not take." Take photos or draw instead of picking living things.',
    'Check off items together and talk about each one.',
    'Return everything to where you found it.',
    'Wash hands afterward.'
  ], { warn: ['Check for ticks after, and teach kids not to touch unknown plants or mushrooms.'], kids: 'Today you are a nature detective! Find something soft, something spiky, something that smells good, a bug, and a bird sound. Look with your eyes and hands gently, and leave it where you found it.', see: ['lnt-seven', 'kids-journal'], src: [] });

  I('kids-night-sky', 'kids', 'Night sky basics', 'moon', S, 15, [
    'Let eyes adjust for 20 minutes away from lights. Use a red flashlight or cover a white one with red cellophane.',
    'Look for the Moon first and notice its shape. Lay a blanket down and look straight up.',
    'Find the Big Dipper in the north (in the Northern Hemisphere). Its two end stars point toward the North Star.',
    'Look for planets: bright dots that do not twinkle much.',
    'Look for satellites: slow, steady moving dots. Shooting stars appear in a flash.',
    'Use a free star-chart app with its red night mode, or a paper chart.',
    'Count how many stars you can see, and compare to home.'
  ], { tips: ['Bring a blanket and hot chocolate. Dark-sky parks are best on moonless nights.'], kids: 'Lie back and wait. Your eyes need twenty minutes to wake up to the dark. Then count the stars, and make up pictures from them.', see: ['kids-stories'], src: [] });

  I('kids-stories', 'kids', 'Campfire stories and songs', 'book', S, 15, [
    'Start with a quiet moment around the fire, and let everyone settle.',
    'Pass-the-story: each person adds one sentence and passes it on.',
    'Tell a family story from when you were small.',
    'Tell a silly story, with sound effects, and keep scary parts gentle for small children.',
    'Sing a round or a sing-along song.',
    'End with a calm story so children go to sleep relaxed.'
  ], { tips: ['Bring a headlamp with a red setting or a flashlight to read from a book.'], kids: 'Your turn! Add one sentence to the story, then pass it. The sillier the better.', see: ['kids-games'], src: [] });

  I('kids-games', 'kids', 'Camp games', 'star', S, 20, [
    'Flashlight tag: one person with a flashlight tags others with the beam. Keep to open, flat ground, away from the fire.',
    'Camouflage hide-and-seek: players hide in view; the seeker must spot them.',
    'Sock-ball toss, cornhole or ring toss with sticks and a rope loop.',
    'Camp bingo: a card with things to see, such as bird, squirrel, tent, pinecone.',
    'Charades or twenty questions at the picnic table.',
    'Glow-stick ring toss in the dark, in a safe space.',
    'Card games and dice games that fit on a table.'
  ], { warn: ['Keep active games away from the fire ring, tent lines and roads.'], kids: 'Pick a game, find a flat spot far from the fire, and make up the rules together.', see: ['kids-rainy-day'], src: [] });

  I('kids-rainy-day', 'kids', 'Rainy-day activities', 'cloud', S, 20, [
    'Set up a tarp over the picnic table or a pop-up canopy for a dry space.',
    'Bring a rain suit and boots for every child. Splashing in puddles is an activity.',
    'Play card games, read aloud, or draw in a nature journal.',
    'Go for a short wet walk to look for worms, snails and mushrooms (just look).',
    'Visit a visitor center, nature center or museum nearby.',
    'Make a hot drink and a snack, and tell stories in the dry tent or car.',
    'Pack an extra change of dry clothes for everyone.'
  ], { tips: ['Wet kids get cold; change them into dry layers and add a warm drink.'], warn: ['Do not use a stove or heater in the tent to dry out.'], kids: 'Rain is just camp with more puddles. Put on boots and see what the animals are doing.', see: ['setup-rainfly', 'cook-co'], src: [] });

  I('kids-journal', 'kids', 'Nature journal', 'edit', S, 20, [
    'Give each child a small notebook and a pencil.',
    'Write the date, place and weather at the top.',
    'Draw one thing you see: a leaf, a bug, a cloud. Add a label.',
    'Write down one thing you heard, one smelled and one felt.',
    'Rub leaf and bark textures with a crayon on paper.',
    'End each day with a favorite moment.'
  ], { tips: ['Journals work for toddlers too: let them scribble and tell you what it is.'], kids: 'Draw what you see and write one word for each sound you hear. Your journal is your own camp diary.', see: ['kids-scavenger'], src: [] });

  I('kids-toddlers', 'kids', 'First campout with toddlers', 'bed', S, 12, [
    'Pick a short trip, a campground close to home with flush toilets, and an easy escape plan back to a bed if it goes badly.',
    'Bring familiar things: a comfort toy, a blanket, a nightlight or small lantern, and familiar bedtime routine.',
    'Make a safe play area: a pop-up pen or the fenced tent area, and a set-aside zone away from the fire.',
    'Keep a close eye. Toddlers move fast toward fire, water and roads. Hold hands at the ring.',
    'Dress in layers, add a warm hat for sleeping and use a good pad. A cold toddler wakes up.',
    'Pack easy meals and snacks; stick to their regular times as much as possible.',
    'Have a plan for naps: a quiet tent with the rainfly open for shade, or a drive.',
    'Expect that it will not be perfect. A good trip is one with a few happy moments.'
  ], { tips: ['Bring a baby carrier for walks and a small potty for night.', 'Do a backyard campout first.'], warn: ['Keep small objects, stones and marshmallow sticks away from toddlers. Never leave a toddler near a fire or stove.', 'Keep an infant’s sleep area flat and firm and follow safe-sleep guidance from your pediatrician.'], see: ['setup-warm-sleep', 'fire-rules'], src: [] });

  /* ===== WILDLIFE ===== */
  I('wild-bear-food', 'wild', 'Bear country: storing food and smellables', 'bear', S, 10, [
    'Learn the rules for your campground before arriving. Many require all food and scented items in a bear-proof box at all times, and some do not allow storing in vehicles.',
    'Put everything with a smell in the bear box or the place the rules allow: food, coolers, trash, pet food, toiletries, sunscreen, toothpaste, and dishes.',
    'Never leave food, trash or coolers on the table, in a tent or unattended, even for a short time.',
    'Cook and eat away from your tent and clean up right away. Wipe the table.',
    'Bring a trash bag for every meal and take it to the dumpster as soon as you are finished.',
    'Change out of clothes that smell like food before bed and store them in the box.',
    'Latch the bear box every time. A box left open is useless.'
  ], { warn: ['Never feed any wild animal. Feeding teaches bears to look for human food and often leads to a bear being killed.'], kids: 'Bears have a super sense of smell. At camp, anything with a smell goes into the bear box: food, toothpaste, even sunscreen. Latch it every time.', see: ['wild-bear-encounter', 'wild-raccoons'], src: U.bear });

  I('wild-bear-encounter', 'wild', 'If you see a bear', 'bear', S, 6, [
    'Stay calm. Gather children close and pick up small ones.',
    'Do not run or climb a tree. Keep your eyes on the bear and back away slowly, talking in a calm, firm voice.',
    'Give the bear plenty of room and an exit. Never get between a mother and her cubs.',
    'Make yourself look big; raise your arms and slowly step back.',
    'If the bear approaches in camp, make noise, bang pots and shout, and stay in a group.',
    'Report the sighting to the host or ranger.',
    'In areas where it is recommended, carry bear spray in an accessible holster and learn how to use it before you need it.'
  ], { warn: ['If a bear makes contact, follow the specific advice for the species in your area: black bears and grizzlies are handled differently. Read the park’s bear safety page before you go.', 'Call 911 or get help for any injury.'], kids: 'If you see a bear, stay near a grown-up, stand still, and let them guide you. Do not run.', see: ['wild-bear-food'], src: U.bear });

  I('wild-raccoons', 'wild', 'Raccoons, squirrels and other raiders', 'eye', S, 5, [
    'Latch the cooler. Raccoons can open simple latches; use a cable or a bungee strap.',
    'Keep all food off the table, out of the tent and in a locked box or the car as allowed.',
    'Do not leave dishes out at night.',
    'Never feed squirrels, chipmunks or jays. They can bite and spread disease.',
    'Keep a distance from any wild animal. Do not handle one that seems tame or sick.',
    'If you are bitten or scratched by a wild animal, wash the wound with soap and water and get medical advice.'
  ], { kids: 'Animals look cute but they are wild. Watch from far away and never feed them.', see: ['wild-bear-food'], src: [] });

  I('wild-ticks', 'wild', 'Ticks: prevention and removal', 'eye', S, 8, [
    'Walk in the middle of trails and avoid brushy, grassy edges.',
    'Wear light-colored clothes so you can see ticks. Tuck pants into socks.',
    'Use an EPA-registered repellent on skin and treat clothes with permethrin before the trip (not on skin).',
    'After outdoor time, check the whole body: behind knees and ears, hairline, armpits, waist and groin. Check kids and pets.',
    'Shower within a couple of hours and put clothes in a dryer on high heat for about 10 minutes.',
    'To remove a tick: use fine-tipped tweezers to grab it as close to the skin as you can, and pull straight up with steady pressure. Do not twist or squeeze.',
    'Clean the bite and your hands with soap and water or rubbing alcohol. Do not use petroleum jelly, nail polish or a hot match.',
    'Note the date. If a rash, fever, headache or body aches develop in the next few weeks, see a doctor and say you had a tick bite.'
  ], { warn: ['If you cannot remove a tick completely, or a rash or fever follows, get medical advice.'], kids: 'After we play outside, we do a tick check: grown-ups look at your head, behind your ears, and your knees. If you find a tick, tell a grown-up and do not pull it yourself.', see: ['wild-mosquitoes'], src: U.tick });

  I('wild-mosquitoes', 'wild', 'Mosquitoes and biting bugs', 'eye', S, 6, [
    'Pick an EPA-registered repellent with DEET, picaridin, IR3535 or oil of lemon eucalyptus, and follow the label.',
    'An adult should apply it to children: spray on your hands then rub it on, avoiding eyes, mouth and hands. Do not use it under the age on the label; oil of lemon eucalyptus is not for children under 3.',
    'Do not use repellent on babies under 2 months; cover the stroller or carrier with netting instead.',
    'Wear long sleeves and pants at dawn and dusk.',
    'Pick a breezy campsite away from standing water. Use a fan.',
    'Keep the tent zipped. Use a screen tent for meals.',
    'Wash off repellent at the end of the day.'
  ], { tips: ['Clean skin before applying sunscreen, then put repellent on top.'], kids: 'Bug spray goes on by a grown-up. Close your eyes and mouth and then they put it on your arms and legs.', see: ['wild-ticks'], src: [] });

  I('wild-snakes', 'wild', 'Snakes: keep distance', 'eye', S, 6, [
    'Watch where you step and put your hands. Do not reach into holes, under rocks or logs, or in dense brush.',
    'Stay on trails. Wear closed shoes. Use a flashlight at night.',
    'If you see a snake, stop and step back slowly. Give it space of at least a few body lengths. Most snakes want to leave.',
    'Never try to move, catch, or kill a snake. Most bites happen when people mess with them.',
    'Keep children and pets close.',
    'If someone is bitten: stay calm, call 911 or go to an emergency room right away, keep the person still and the bitten area at about heart level, remove rings and tight items, and note what the snake looked like if safe to do so.',
    'Do not cut the bite, suck the venom, apply ice or use a tourniquet.'
  ], { warn: ['All snake bites need medical attention. If you cannot reach 911, drive to help or have someone fetch help.'], kids: 'If you see a snake, freeze and then back up slowly and tell a grown-up. We leave snakes alone and they leave us alone.', see: ['safety-first-aid'], src: U.snake });

  I('wild-poison-ivy', 'wild', 'Poison oak, poison ivy and itchy plants', 'leaf', S, 6, [
    'Learn the plants of the area you visit. "Leaves of three, let it be" works for poison ivy and oak, but they can look different by season. Check a local guide.',
    'Stay on trails and wear long pants in brush.',
    'Never burn brush; smoke from poison ivy or oak can cause serious lung reactions.',
    'If you touch it, wash skin with soap and cool water as soon as possible. Wash clothes, shoes, gear and pets that touched it.',
    'Do not scratch. Cool compresses and over-the-counter itch products can ease itching, following the label.',
    'See a doctor for a rash on the face, eyes or genitals, a large area, signs of infection, or if it spreads.',
    'Get help right away for trouble breathing or swelling of the face.'
  ], { kids: 'If you are not sure what a plant is, do not touch it. Tell a grown-up and they will check.', see: ['safety-first-aid'], src: [] });

  I('wild-etiquette', 'wild', 'Watching wildlife respectfully', 'eye', S, 5, [
    'Stay far from animals. Many parks say at least 25 yards (23 m) from most wildlife and 100 yards (91 m) from bears and wolves; check the park rules.',
    'Use binoculars or a camera zoom, not your feet.',
    'Never feed animals or leave food for them.',
    'If an animal changes behavior because of you, you are too close. Back away.',
    'Keep dogs leashed and under control.',
    'Do not touch baby animals; their parents are usually close by.'
  ], { kids: 'We watch animals with our eyes, not our hands. We stay far away and use binoculars.', see: ['lnt-seven', 'wild-bear-encounter'], src: [] });

  /* ===== WEATHER AND SAFETY ===== */
  I('weather-lightning', 'safety', 'Lightning: when thunder roars, go indoors', 'bolt', S, 6, [
    'If you hear thunder, you are close enough to be struck. Go to a sturdy building or a hard-topped car right away.',
    'A tent, a picnic shelter, a tarp and an open-sided pavilion do not protect you.',
    'In a car, close the windows and do not touch metal parts.',
    'Wait at least 30 minutes after the last thunder before going out.',
    'If you are caught outdoors with nowhere to go, get away from the highest points, tall isolated trees, open fields, water and metal objects. Spread the group out. Crouching low on the balls of your feet is a last resort that does not make you safe.',
    'Stay off the water and out of showers and pools during a storm.',
    'A person struck by lightning does not carry a charge. Call 911 and give CPR if trained and needed.'
  ], { tips: ['Check the forecast each morning. Thunderstorms in mountains often build in the afternoon, so plan hikes early.'], warn: ['No place outside is safe in a thunderstorm.'], kids: 'When you hear thunder, we hurry to the car or a building and stay there until half an hour after the last rumble.', see: ['weather-wind', 'weather-flash-flood'], src: U.ltg });

  I('weather-heat', 'safety', 'Heat: staying cool and spotting trouble', 'sun', S, 8, [
    'Drink water all day, before you feel thirsty. Bring more than you think.',
    'Plan hikes and chores for morning and evening. Rest in shade at midday.',
    'Wear light, loose clothes, a hat and sunscreen. Rest often.',
    'Watch children closely; they heat up faster and may not say so.',
    'Never leave a child or pet in a parked car, even for a minute.',
    'Heat exhaustion signs: heavy sweating, pale or clammy skin, weakness, headache, nausea, dizziness. Move to shade, loosen clothes, sip water and cool with wet cloths.',
    'Heat stroke is an emergency: confusion, fainting, hot dry or very sweaty skin, very high temperature. Call 911, move the person to shade and cool them quickly with water and fanning.'
  ], { warn: ['Do not give fluids to anyone who is vomiting or confused. Wait for medical help.'], kids: 'When it is hot we rest in the shade, drink water, and wear a hat. Tell a grown-up if you feel dizzy or sick.', see: ['safety-first-aid'], src: [] });

  I('safety-cold-night', 'safety', 'Cold nights and hypothermia', 'snow', S, 8, [
    'Check the overnight low and bring a bag and pad that match it.',
    'Dress in layers: a base layer that dries fast, a warm layer such as fleece, and a rain and wind shell. Avoid cotton when cold and wet.',
    'Change out of damp clothing as soon as possible.',
    'Keep a warm hat on kids day and night.',
    'Eat and drink warm things regularly.',
    'Early signs of hypothermia: shivering, clumsiness, grumbling and fumbling. Get the person out of the wind and wet, add dry layers and a hat, and give warm sweet drinks if awake.',
    'If shivering stops, speech is slurred or the person is confused or drowsy, treat as an emergency and call 911.'
  ], { warn: ['Never use a stove, grill or heater in a tent to warm up. See carbon monoxide.'], see: ['setup-warm-sleep', 'cook-co'], src: [] });

  I('weather-wind', 'safety', 'Wind and storms at camp', 'cloud', N, 6, [
    'Check the forecast for wind. Strong gusts can collapse tents, throw branches and spread fire.',
    'Choose a site sheltered from the wind, away from dead trees and large dead limbs.',
    'Stake and guy out the tent well. Bring pegs and a spare rope.',
    'Put loose items in the car. Secure canopies, or take them down when the wind picks up.',
    'In high wind, put out the fire and do not start one.',
    'If winds become dangerous, move to the car or a sturdy building.'
  ], { warn: ['Do not stay under dead trees or large limbs in a strong wind.'], see: ['setup-guy-lines', 'weather-lightning'], src: [] });

  I('weather-flash-flood', 'safety', 'Flash floods and creek camping', 'water', S, 6, [
    'Know the weather in the whole area, including upstream. Flash floods can come from rain miles away.',
    'Do not camp in dry washes, narrow canyons, or right on creek banks, especially in desert and mountain country.',
    'If you see water rising, hear a roar, or get a flood warning, move to higher ground immediately. Leave gear behind.',
    'Never walk or drive through flooded water. Six inches of fast water can knock you down, and about a foot or two can float a car.',
    'Turn around, don’t drown.',
    'Keep a phone or radio that can receive weather alerts.'
  ], { kids: 'If a grown-up says move to high ground, we go right away. Water can rise fast.', see: ['setup-site-choice'], src: U.flood });

  I('weather-wildfire', 'safety', 'Wildfire smoke and evacuation', 'flame', S, 10, [
    'Before the trip, check fire and smoke conditions, closures and alerts for the area. Check again on arrival and each morning.',
    'Learn two ways out of the campground and keep the fuel tank at least half full.',
    'Keep a small go-bag in the car: water, medications, phone charger, ID, a map and a flashlight.',
    'If you see smoke or a fire, leave early and calmly, and notify the host or call 911.',
    'If told to evacuate, go immediately. Do not wait to pack the tent. Follow official routes.',
    'If smoke is heavy, limit outdoor activity, especially for children, older adults and those with asthma or lung conditions. A well-fitted N95 respirator can help; ordinary cloth masks do not stop smoke particles.',
    'Check air quality using AirNow or a similar official tool. Consider leaving if air quality is poor.'
  ], { warn: ['Wildfire can move faster than you can walk or drive in some conditions. Do not wait to be sure.'], see: ['weather-fire-restrictions', 'fire-rules'], src: U.wf });

  I('weather-fire-restrictions', 'safety', 'Fire restrictions in plain words', 'alert', S, 5, [
    'Stage 1 or similar restrictions often limit campfires to developed campgrounds and designated rings, and ban fires elsewhere. Rules differ by agency and year.',
    'Higher stages may ban all wood and charcoal fires, even in campgrounds, but allow stoves with a shutoff valve.',
    'Check the land manager’s website, signs at the entrance and the ranger. Rules can change daily.',
    'If a ban is in place, plan no-fire meals: stove cooking, a no-cook cooler dinner, and a battery lantern for evening.',
    'Fines for breaking rules can be steep and, if you start a fire, you may be liable for the cost.'
  ], { tips: ['Keep a "no-fire" menu in your phone for dry summers.'], see: ['fire-rules', 'weather-wildfire'], src: U.fire });

  I('safety-first-aid', 'safety', 'Family first-aid kit basics', 'first', S, 10, [
    'Start with a ready-made kit and add to it for your family.',
    'Cuts and scrapes: adhesive bandages in several sizes, gauze pads, medical tape, antiseptic wipes, and a small tube of antibiotic ointment.',
    'Splinters and ticks: fine-tipped tweezers and a magnifier.',
    'Sprains: elastic bandage and a triangular bandage.',
    'Burns and stings: burn gel or cool-pack and an after-bite product; know any allergies and carry prescribed epinephrine if a family member needs it.',
    'Medicines your family already uses, with doses from the label or your doctor. Do not guess doses for children.',
    'Other: thermometer, gloves, a CPR face shield, scissors, safety pins, a whistle and an emergency blanket.',
    'Check the kit before each trip, replace used or expired items, and include a card with emergency contacts and medical information.'
  ], { warn: ['A kit is not training. Consider a first-aid and CPR course, especially for wilderness trips far from help.'], see: ['safety-get-help'], src: [] });

  I('safety-get-help', 'safety', 'When to get help', 'phone', S, 6, [
    'Call 911 for: trouble breathing, severe bleeding, chest pain, signs of stroke, loss of consciousness, a seizure, severe allergic reaction, suspected spine injury, heat stroke, severe hypothermia, a snake bite, a lost child, fire.',
    'Know where you are: campground name, loop and site number, and the nearest road. Save these in your phone.',
    'If you have no signal, send someone to higher ground or to the camp host or a ranger station. Many campgrounds have a phone or a camp host.',
    'Try a text message to 911 where voice calls fail, if your area supports it.',
    'Stay with the patient. Keep them warm and still.',
    'Tell someone your plans before you go and when you will be back.'
  ], { warn: ['If in doubt, get help early. Rangers and hosts would rather help you early.'], kids: 'If something is wrong and a grown-up cannot help, find a ranger, host or another family and say: "I need help."', see: ['safety-first-aid'], src: [] });

  /* ===== LEAVE NO TRACE ===== */
  I('lnt-seven', 'lnt', 'The seven Leave No Trace principles', 'leaf', S, 6, [
    'Plan ahead and prepare: know the rules, weather and your skills.',
    'Travel and camp on durable surfaces: stay on trails and established sites.',
    'Dispose of waste properly: pack it in, pack it out. Use toilets or follow rules for human waste.',
    'Leave what you find: rocks, plants, shells and artifacts stay.',
    'Minimize campfire impacts: use stoves and established fire rings, and put fires fully out.',
    'Respect wildlife: observe from a distance and never feed.',
    'Be considerate of other visitors: keep noise down, share the trail, and be kind.'
  ], { kids: 'Leave no trace means camp looks like we were never there. Take your trash, leave the rocks, flowers and sticks, and be kind to others.', see: ['lnt-quiet', 'lnt-pets'], src: U.lnt });

  I('lnt-quiet', 'lnt', 'Quiet hours and good neighbors', 'moon', S, 4, [
    'Find out the quiet hours (often 10 pm to 6 am) and keep to them.',
    'Keep voices, music and generators low at other times too. Sound carries in a campground.',
    'Use a red or low light after dark and point lights away from other sites.',
    'Do not cut through other sites. Walk on the road or path.',
    'Keep kids from running into others’ spaces and ask first before using a shared spot.',
    'If you have a problem with a neighbor, speak kindly or ask the host.'
  ], { tips: ['Brief a young child on how to whisper at night.'], kids: 'At night we use our inside voices outside. Other families are sleeping.', see: ['lnt-seven'], src: [] });

  I('lnt-pets', 'lnt', 'Camping with dogs', 'heart', S, 5, [
    'Check the campground’s pet rules. Some trails and areas do not allow pets.',
    'Keep your dog leashed (usually 6 feet or less), never left alone at the site, and under control.',
    'Pick up and bag all waste and dispose of it in the trash.',
    'Bring enough water and a bowl, and a vaccination record.',
    'Keep dogs out of tents with food, and do not leave them in the car on warm days.',
    'Check them for ticks and burrs daily, and keep them away from wildlife and snakes.',
    'Do not leave a dog tied and alone; barking disturbs others.'
  ], { warn: ['Never leave a dog in a parked car in warm weather.'], see: ['lnt-quiet', 'wild-ticks'], src: [] });

  /* ===== RV AND TRAILER ===== */
  I('rv-hookups', 'rv', 'Hookups: 30 amp, 50 amp, water, sewer', 'bolt', S, 10, [
    'A 30-amp hookup has a three-prong plug (about 3,600 watts). A 50-amp hookup has a four-prong plug (about 12,000 watts). Know what your rig needs.',
    'Adapters let you plug a 30-amp rig into a 50-amp pedestal, but not the other way around without limiting what you can run.',
    'Use a surge protector or an energy management unit and plug it in first at the post, with the breaker off.',
    'Turn the breaker off, plug in, then turn it on. Reverse the order to unplug.',
    'Connect water through a pressure regulator using a drinking-water hose (usually white or blue), and run the water briefly before connecting.',
    'Connect the sewer hose with a proper elbow fitting and support the hose in a downward slope, or leave the sewer closed until the tank is nearly full.',
    'Turn off the water when you leave the rig for long, to avoid leaks.'
  ], { warn: ['Do not run too many high-wattage appliances at once on 30 amp, such as the air conditioner, microwave and space heater together.'], see: ['rv-level', 'rv-tanks'], src: [] });

  I('rv-level', 'rv', 'Levelling and chocking', 'scale', S, 10, [
    'Walk the site first and pick the flattest pad; decide where hookups will land.',
    'Level side to side first. Use leveling blocks or ramps under the low-side tires and drive up slowly with a spotter.',
    'Chock the wheels, and put the parking brake on before unhitching.',
    'For a trailer, unhitch with the tongue jack, level front to back, and lower the stabilizer jacks. Stabilizers are not lifts.',
    'Check the level with a bubble level inside the rig, particularly if you use a refrigerator that needs to be level.',
    'Retract the jacks and check around the rig before leaving.'
  ], { warn: ['Never get under a rig held up only by a jack.'], see: ['rv-backing', 'rv-hookups'], src: [] });

  I('rv-tanks', 'rv', 'Tanks and dump etiquette', 'trash', S, 12, [
    'Wear disposable gloves. Keep a dedicated bin for the sewer hose and gloves.',
    'Connect the sewer hose to the rig first, then to the dump inlet, with a tight, clean fit.',
    'Open the black (toilet) valve first and let it drain fully. Then close it.',
    'Open the grey (sink and shower) valve afterward to rinse the hose.',
    'Rinse the tank with a flush system if you have one. Close both valves before disconnecting.',
    'Rinse the hose, drain what is left in it into the inlet, and stow it in its own bin.',
    'Wash your hands thoroughly. Clean up any spill at once. Never use the same hose or spigot for drinking water.',
    'Dump only at official dump stations and be quick; others may be waiting.'
  ], { tips: ['Leave the black valve closed while camping until the tank is about two-thirds full, so solids flush out.'], warn: ['Never dump grey or black water on the ground or into storm drains.'], see: ['rv-hookups'], src: [] });

  I('rv-backing', 'rv', 'Backing a trailer', 'car', N, 15, [
    'Find an empty lot to practice in before the trip.',
    'Get out and look (G.O.A.L.) when unsure. It is much cheaper than damage.',
    'Use a spotter with a clear signal. Agree on hand signals and a stop sign before you start.',
    'Place your hand at the bottom of the steering wheel. Move your hand left and the trailer goes left; right goes right.',
    'Go slow and make small corrections. If the trailer starts to turn too much, pull forward to straighten.',
    'Set up for backing by pulling past the site on the side, then backing in at an angle. Take your time.',
    'Check overhead, behind, and both sides before you move.'
  ], { tips: ['Use a two-way radio or a phone call with the spotter. Stay in sight.'], see: ['rv-height-length'], src: [] });

  I('rv-height-length', 'rv', 'Height, length and weight checks', 'route', S, 6, [
    'Measure your rig’s travel height (top of the air conditioner or antenna) and length, and write both on a card on the dashboard.',
    'Check campground limits for site length and the max rig size before booking. Some roads and parks have tunnels or tight turns.',
    'Check your route for low clearances and weight limits using an RV-aware GPS or atlas.',
    'Know your tow vehicle’s towing capacity and the trailer’s loaded weight, including water, propane and gear.',
    'Check tire pressure, lights and hitch before every trip and again after the first hour.',
    'Allow plenty of time. Towing is slower and braking distance is longer.'
  ], { warn: ['Do not trust a regular car GPS for large vehicles; it can send you under low bridges or onto narrow roads.'], see: ['rv-backing'], src: [] });

  I('rv-propane', 'rv', 'Propane safety', 'fuel', S, 8, [
    'Turn off propane at the tank when driving, refueling, or when it is not needed.',
    'Check hoses and connections for cracks. A soapy water test shows leaks as bubbles.',
    'Install and test a propane (LP) leak detector and a CO alarm in your rig and replace them before they expire.',
    'Have the tanks refilled only by a trained attendant, and only to 80 percent.',
    'Keep tanks upright and secure. Never store propane cylinders indoors.',
    'If you smell gas (like rotten eggs), turn off the appliances and the tank, get everyone out, do not use switches or flames, and call the fire department.',
    'Never use the oven or stove to heat the rig.'
  ], { warn: ['Do not use a barbecue or portable heater inside the rig unless it is made for indoor use.'], see: ['cook-co', 'cook-stove'], src: U.co });

  /* ===== GEAR AND CARE ===== */
  I('gear-buy-first', 'gear', 'What to buy first (and what to borrow)', 'cart', S, 8, [
    'Buy first: a tent big enough for everyone, with a good rainfly; sleeping pads; sleeping bags rated for your climate; headlamps.',
    'Borrow or rent: stove, cooler, camp chairs, lanterns, and the big items until you know what you like.',
    'Buy next: a two-burner stove, quality cooler, kitchen box, a tarp or canopy.',
    'Keep gear in plastic bins labeled by job: kitchen, bedding, clothes, tools.',
    'Do not buy a lot of gadgets until a trip has shown you what you miss.',
    'Check used marketplaces and outdoor-store rentals.'
  ], { tips: ['Buy a tent with two more spaces than people for gear and comfort.'], see: ['first-checklist'], src: [] });

  I('gear-tent-care', 'gear', 'Caring for your tent', 'tent', N, 10, [
    'Shake out dirt and sweep the floor before packing.',
    'Dry it completely, in the sun or hung inside at home, before storing. Damp fabric grows mildew.',
    'Clean spots with a soft sponge, mild soap and water. Do not use a washing machine or dish soap on coated fabrics.',
    'Do not fold it the same way every time; store it loosely in a breathable bag.',
    'Check poles, zippers and seams. Fix a small tear with repair tape right away.',
    'Reproof the fly or seam-seal following the maker’s instructions as it ages.',
    'Store in a cool, dry place away from sunlight and chemicals.'
  ], { warn: ['Never put a tent away damp.'], see: ['gear-store'], src: [] });

  I('gear-clean', 'gear', 'Cleaning and drying gear after a trip', 'tool', N, 15, [
    'Unpack everything the day you get home.',
    'Wash and dry sleeping bags according to their label; most can be washed in a front-loader on gentle with a mild cleaner.',
    'Air out pads and chairs. Wipe down with a damp cloth.',
    'Wash cooler and dishes with hot soapy water, and leave the cooler open to dry.',
    'Empty water jugs and let them dry. Wash and dry cookware, then oil cast iron.',
    'Restock the first-aid kit and fuel and replace batteries.',
    'Make a short list of what you wished you had.'
  ], { see: ['gear-store', 'gear-tent-care'], src: [] });

  I('gear-store', 'gear', 'Storing camping gear', 'home', N, 6, [
    'Store sleeping bags loose in a large sack, not squeezed in their stuff sack.',
    'Keep all gear in a dry, cool place; avoid damp garages and attics.',
    'Keep tent, bags and pads out of sunlight and away from mice; use sealed bins.',
    'Keep fuel in a safe place outdoors, away from heat and living spaces.',
    'Keep a packing list in the bin lid and check it off while packing next time.'
  ], { see: ['gear-clean'], src: [] });
})();
