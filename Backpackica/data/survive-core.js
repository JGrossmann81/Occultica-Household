/* Backpackica: Survive core content (fire, shelter, water, navigation, signaling, camp, knots, gear repair).
   Written in our own words from the sources named in each item's src and in data/SOURCES-survive.md. A reference, not training. */
(function () {
  window.SURVIVE = window.SURVIVE || { items: [] };
  var CDC = 'https://www.cdc.gov/healthywater/drinking/travel/',
    GRCA = 'https://www.nps.gov/grca/planyourvisit/safe-water.htm',
    LNTNPS = 'https://home.nps.gov/articles/leave-no-trace-seven-principles.htm',
    SMOKEY = 'https://smokeybear.com/en/prevention-how-tos/campfire-safety/how-to-maintain-and-extinguish-your-campfire',
    HANG = 'https://www.nps.gov/seki/planyourvisit/bearhang.htm',
    BEARBC = 'https://www.nps.gov/seki/planyourvisit/bear_bc.htm',
    FSFOOD = 'https://www.fs.usda.gov/media/267438',
    RMNP = 'https://nps.gov/romo/planyourvisit/lightning-safety.htm',
    WTA = 'https://www.wta.org/hiking-info/basics/how-to/stay-safe-in-a-lightning-storm',
    FNS = 'https://www.fieldandstream.com/survival/ways-to-signal-for-help-in-the-wilderness',
    TXT911 = 'https://www.fairfaxcounty.gov/911/text-to-911',
    USGS = 'https://www.usgs.gov/educational-resources/why-am-i-adding-one-situation-subtracting-another';
  /* I(id, cat, icon, level, time, title, summary, steps[[t,d]], {warn, help, tags, see, src}) */
  function I(id, cat, icon, level, time, title, summary, steps, o) {
    o = o || {};
    SURVIVE.items.push({
      id: id, cat: cat, icon: icon, level: level, time: time, title: title, summary: summary,
      steps: steps.map(function (s) { return typeof s === 'string' ? { t: s } : { t: s[0], d: s[1] }; }),
      warn: o.warn || [], whenHelp: o.help || [], tags: o.tags || [], seeAlso: o.see || [], src: o.src || []
    });
  }

  /* ================= FIRE ================= */
  I('fire-site', 'fire', 'flame', 'learn', '10 min', 'Choose and clear a fire site',
    'A safe fire starts with the ground. Use an existing ring if there is one; otherwise pick flat, bare, sheltered ground well away from anything that burns.',
    [['Check the rules first', 'Fire restrictions and closures change by day. See "Fire rules and permits".'],
    ['Use an existing fire ring if there is one', 'A new scar on the ground lasts for years. In busy areas always reuse a ring.'],
    ['Pick flat, open-overhead ground', 'Keep the fire at least 15 ft (4.5 m) from tents, brush and low branches, with open sky above (clearance of at least three times the flame height).'],
    ['Clear a circle about 10 ft (3 m) across', 'Scrape leaves, needles and grass down to bare mineral soil. Duff (the spongy layer of rotting needles) can smolder underground and re-ignite later.'],
    ['Block the wind', 'Use the lee of a boulder or a log, not a cliff or overhang. Do not light a fire in strong or gusty wind.'],
    ['Stage water and a shovel before you light', 'A bucket or a big pot of water and something to stir with. Keep the fire small.']],
    { warn: ['Never build a fire under overhanging branches, on tree roots, or in dry grass.', 'No fire in high wind, red flag warnings, or when the ground is bone dry.'],
      help: ['If a fire gets away from you and you cannot put it out immediately with water, leave, warn others and call 911.'],
      tags: ['campfire', 'fire ring', 'clearing', 'wildfire'], see: ['fire-rules', 'fire-out'], src: [SMOKEY, LNTNPS] });

  I('fire-fuel', 'fire', 'flame', 'learn', '10 min', 'Tinder, kindling and fuel sizes',
    'A fire needs three sizes of dry fuel in graded steps: tinder (catches a spark), kindling (grows the flame), fuel (keeps it burning). Gather more than you think you need before you strike a light.',
    [['Tinder: thinner than a match', 'Dry grass, fine bark shreds, dead pine needles, the fuzzy dry inner bark of dead branches, or manufactured tinder. Make a loose bird-nest, not a tight ball.'],
    ['Kindling: pencil-thin to thumb-thick', 'Dry twigs that snap cleanly. Collect two good double-handfuls.'],
    ['Fuel: wrist-thick up to forearm-thick', 'Dead, dry wood only. Smaller logs burn easier and are all you need for a small fire.'],
    ['Sort it into piles within arm reach', 'Light only when all three piles are ready. Add wood in order of size; do not smother the flame.'],
    ['Test for dry', 'Dead wood that snaps with a crack is dry; wood that bends or feels cold and damp is not. Dead twigs still on the tree are often drier than wood on the ground.']],
    { warn: ['Use dead and down wood only that you can break by hand. Never cut or break living trees or branches.', 'Do not strip bark from live trees.'],
      tags: ['tinder', 'kindling', 'wood', 'dry wood', 'firewood'], see: ['fire-starters', 'fire-build', 'fire-wet'], src: [LNTNPS] });

  I('fire-starters', 'fire', 'flame', 'learn', '10 min', 'Lighters, ferro rods, matches and tinder aids',
    'Carry two independent ways to make fire and a tinder aid that works when everything is damp. Practise before you need it.',
    [['Lighter', 'Carry two. Keep one in an inside pocket: butane lighters struggle when very cold, and warm ones work.'],
    ['Waterproof or stormproof matches', 'Keep them and a striker strip in a sealed container. Ordinary matches are not enough.'],
    ['Ferrocerium rod', 'Rest the tip on the tinder, hold the rod still and pull the striker back along it quickly so sparks fall on the tinder. Practise: it takes several tries.'],
    ['Tinder aids', 'Cotton balls rubbed with petroleum jelly, commercial fire tabs or fatwood shavings burn long enough to light damp fuel. Carry them in a zip bag.'],
    ['Never use gasoline or other liquid accelerants', 'They flare and burn people. Use more tinder, not more fuel.']],
    { warn: ['Keep sparks and flame away from synthetic jackets and tents: embers melt holes in nylon.'],
      tags: ['lighter', 'ferro rod', 'matches', 'fire starter', 'tinder'], see: ['fire-fuel', 'fire-build'], src: [SMOKEY] });

  I('fire-build', 'fire', 'flame', 'learn', '15 min', 'Build a teepee, log cabin or lean-to fire',
    'Three standard lays, each for a different job: teepee for fast heat, log cabin for steady coals, lean-to for wind.',
    [['Teepee', 'Place a tinder nest in the middle. Lean kindling over it in a cone, leaving a gap on the windward side to light through. Add fuel to the cone as it catches. Fast and hot; collapses as it burns.'],
    ['Log cabin', 'Stack pairs of sticks in alternating squares around the tinder like a small log cabin, then put kindling inside. Burns more slowly and leaves a steady bed of coals for cooking.'],
    ['Lean-to', 'Put a larger log on the windward side. Lean kindling against it over the tinder and light from the downwind side. The log shields the flame in wind.'],
    ['Light low and feed gradually', 'Light the tinder, then breathe gently at the base. Add small kindling first. Wait until the flame is going before adding thicker fuel.'],
    ['Keep it small', 'A fire the size of a cooking pot gives all the warmth and light you need and is far easier to control and put out.']],
    { warn: ['Never leave a fire unattended, even briefly.', 'Do not lean over a fire in loose or synthetic clothing.'],
      tags: ['teepee', 'log cabin', 'lean-to', 'campfire'], see: ['fire-site', 'fire-out'], src: [SMOKEY] });

  I('fire-wet', 'fire', 'flame', 'learn', '20 min', 'Make a fire in wet weather',
    'Wet wood is not hopeless: the inside of dead, off-the-ground wood is usually dry. It takes patience, preparation and a lot of small fuel.',
    [['Get your shelter sorted first', 'You will need a dry spot to work and a way to keep rain off the fire. Do not light a fire under snow-laden branches.'],
    ['Find the driest wood', 'Dead standing branches and the dead lower twigs on evergreens are drier than wood on the ground. Split or shave off wet bark to reach the dry core.'],
    ['Make feather sticks and shavings', 'Shave thin curls on a stick, leaving them attached, to expose dry fibres that catch.'],
    ['Build a base', 'Lay a platform of sticks or a flat log to keep the fire off wet ground. Avoid wet river rocks: trapped moisture can make them burst when heated.'],
    ['Use your tinder aid', 'Fire tabs, jelly-coated cotton or fatwood burn long enough to dry the first kindling.'],
    ['Feed tiny pieces first', 'Add a little at a time and let each stage dry beside the flame before it goes on.']],
    { warn: ['River rocks and damp stones can crack or burst in fire. Do not build on or around them.', 'Do not cook or burn fuel inside a tent or closed shelter: carbon monoxide.'],
      help: ['If you are cold and cannot get a fire going, do not keep fiddling: use insulation, shelter and food. See the cold and wet steps.'],
      tags: ['wet', 'rain', 'damp wood', 'snow', 'cold'], see: ['fire-fuel', 'fire-starters', 'shelter-quick'], src: [SMOKEY, LNTNPS] });

  I('fire-out', 'fire', 'flame', 'learn', '15 min', 'Put a fire out completely',
    'Drown, stir, feel. If it is too hot to touch, it is too hot to leave. Escaped campfires start wildfires.',
    [['Let it burn down', 'Burn wood to ash where possible. Stop adding fuel well before you plan to leave.'],
    ['Drown', 'Pour plenty of water on the fire until the hissing stops. Do not smother it with dirt alone.'],
    ['Stir', 'Mix the water through the embers and ash with a stick or shovel. Scrape the sticks and logs until nothing is glowing or smoking.'],
    ['Drown again', 'Add more water to any hot spots.'],
    ['Feel', 'Hold the back of your hand just over the ashes. If you feel heat, repeat. Everything must be cold.'],
    ['Scatter the cold ashes and pack out your trash', 'Leave no foil or half-burned food scraps in the ring.']],
    { warn: ['Do not bury a hot fire: coals can smolder underground and burn roots.', 'Carry or have water nearby for putting the fire out, not just for drinking.'],
      help: ['If a fire escapes and spreads beyond what you can control, leave and call 911 with your location.'],
      tags: ['extinguish', 'campfire', 'drown stir feel'], see: ['fire-site', 'fire-rules'], src: [SMOKEY, LNTNPS] });

  I('fire-rules', 'fire', 'flame', 'learn', '5 min', 'Fire rules, restrictions and permits',
    'Fire rules differ by agency, season and day. You are responsible for knowing the current rule, and fines or liability for a fire you start can be severe.',
    [['Check the day before and the morning of', 'Look at the land manager site (national park, national forest, BLM, state park) or phone the ranger district. Restrictions can start overnight.'],
    ['Know the stages', 'Typical stages range from "fires only in established rings", to "stoves with a shut-off valve only", to "no flame at all". Stage names differ between agencies.'],
    ['Find out whether a permit is needed', 'Some areas require a campfire permit even where fires are allowed. Ask the local office; do not guess.'],
    ['Respect closures and red flag days', 'No fires in a closure area. No fires, and no stove use if the order says so, in high wind or on a red flag warning day.'],
    ['Have a stove as your default', 'A stove cooks in any weather and is allowed in more places. Many wilderness areas ban wood fires above a set elevation or near lakes.']],
    { warn: ['Rules can change while you are out. If you see a closure sign or a ranger tells you otherwise, follow it.'],
      tags: ['permit', 'restriction', 'closure', 'red flag', 'ban', 'regulation'], see: ['fire-site', 'fire-out'], src: [SMOKEY, LNTNPS] });

  /* ================= SHELTER ================= */
  I('shelter-quick', 'shelter', 'tent', 'now', '10 min', 'Cold or wet: get out of wind and wet, stay insulated',
    'Wet, wind and cold together are how people become hypothermic, even in mild weather. Stop, block the wind, add dry insulation, insulate from the ground and eat.',
    [['Stop and decide to take care of yourself now', 'Do not push on while shivering. Cold gets worse faster than you think.'],
    ['Get out of the wind and rain', 'Use trees, a boulder, a tarp, or a tent. Avoid cliffs, caves and overhangs in a thunderstorm.'],
    ['Change into dry layers if you have them', 'Wet cotton and soaked layers pull heat from you. Put a windproof, waterproof shell on over dry insulation.'],
    ['Insulate from the ground', 'Sit or lie on your pack, a sleeping pad, coiled rope or a thick layer of dry leaves or boughs. The ground steals heat quickly.'],
    ['Eat and drink something warm and sweet', 'Calories are your heat source. Keep snacking.'],
    ['Cover your head, neck and hands', 'Hat, hood and gloves. If you have a space blanket or bivy sack, wrap it around dry layers, not wet ones.'],
    ['Warm the whole body, with other people if you have them', 'Share body warmth. Small movements warm you without making you sweat heavily.']],
    { warn: ['Do not drink alcohol to warm up.', 'Do not rub or massage cold skin.', 'Do not use a stove or burning fuel inside a closed tent: carbon monoxide kills.'],
      help: ['Uncontrolled shivering, slurred speech, stumbling, confusion, or shivering that stops while still cold are signs of possible hypothermia: stop, warm up, and call for help.'],
      tags: ['cold', 'wet', 'hypothermia', 'wind', 'rain', 'freezing', 'shivering'], see: ['shelter-ground', 'fire-wet', 'shelter-bivy'], src: [LNTNPS] });

  I('shelter-site', 'shelter', 'tent', 'learn', '10 min', 'Choose a safe shelter site',
    'Where you sleep matters as much as what you sleep in. Look up, look down and look around before you pitch.',
    [['Look up: dead branches and dead trees', 'Falling branches ("widow-makers") and leaning snags kill people in wind and storms. Move if anything dead hangs above you.'],
    ['Look down: drainage', 'Pitch on slightly raised, flat ground. Avoid dry creek beds, washes, hollows and the low spot in the meadow: they flood in rain and snow melt, even if rain is upstream.'],
    ['Think cold air', 'Cold air sinks at night. Valley floors, hollows and the bottom of slopes are colder than a gentle bench a little higher up.'],
    ['Avoid exposed high points in storms', 'Ridges, summits, isolated trees and the tops of open slopes are lightning-prone and windy.'],
    ['Avoid avalanche and rockfall terrain', 'Do not camp below steep snow slopes (most avalanches start on slopes of about 30 to 45 degrees, but they can also run on gentler or steeper ground, and the slope above or below you counts too), in the path of past slides, or beneath cliffs with loose rock.'],
    ['Keep away from water and trails', 'Camp at least 200 ft (60 m) from lakes and streams and not on game trails. It protects the water and avoids animals walking through your camp.']],
    { warn: ['Do not camp in a dry wash or slot canyon if rain is possible anywhere in the watershed.'],
      help: ['If a storm builds and you are in an exposed spot, move to safer ground before it hits.'],
      tags: ['widow-makers', 'dead trees', 'flood', 'drainage', 'cold air', 'lightning', 'avalanche', 'campsite'], see: ['camp-site', 'shelter-storm'], src: [LNTNPS, RMNP, WTA] });

  I('shelter-tarp', 'shelter', 'tent', 'learn', '20 min', 'Pitch a tarp or emergency shelter',
    'A tarp and a length of cord make a good, light shelter. Pitch low and tight on the windward side, and leave airflow.',
    [['Choose your site', 'See "Choose a safe shelter site".'],
    ['String a ridgeline', 'Tie a cord between two trees at about head height (a taut-line hitch on one end lets you adjust). Do not tie to dead trees.'],
    ['Drape the tarp over the line', 'Make an A-frame, or pitch it as a lean-to with one edge to the ground on the windward side.'],
    ['Stake and guy the corners', 'Angle guy lines at about 45 degrees. If the ground is hard, tie to rocks or logs, or bury a stick as a deadman.'],
    ['Pitch low into the wind', 'Close the windward side to the ground. Keep gaps at the ends so air moves and condensation is reduced.'],
    ['Cover the ground and keep gear dry', 'Spread a groundsheet or poncho and keep your insulation off bare ground.']],
    { warn: ['Never burn fuel or fire inside a closed shelter: carbon monoxide.', 'A tarp stays flapping in a storm: check that the windward side is tight and low.'],
      tags: ['tarp', 'ridgeline', 'A-frame', 'lean-to', 'emergency shelter'], see: ['knot-taut-line', 'knot-clove', 'shelter-ground'], src: [] });

  I('shelter-debris', 'shelter', 'tree', 'learn', '2-3 h', 'Debris hut (last resort)',
    'A small, thickly insulated hut can save a night with no tent or tarp. It is heavy work, so only build one if you have time and daylight, and keep it body-sized.',
    [['Make sure you need it', 'Use natural shelter first: a fallen tree, a rock lee (not an overhang), or a thicket. A debris hut costs time and sweat.'],
    ['Check overhead and drainage', 'No dead branches above and no low ground that floods.'],
    ['Build the frame', 'Prop a long ridgepole on a stump or fork about waist height, with its other end on the ground. Make it only slightly longer than you and just wide enough for your shoulders.'],
    ['Add ribs', 'Lean sticks along both sides of the ridgepole like a rib cage, then a layer of smaller branches across.'],
    ['Pile on insulation', 'Cover with leaves, needles or grass, as thick as you can: more than an arm\'s length. Thicker is warmer.'],
    ['Insulate the floor', 'Pile a deep layer of dry leaves or boughs as bedding (compresses a lot). Stuff dry leaves inside your clothes if you have nothing else.'],
    ['Plug the door', 'Use your pack or a pile of debris to close the entrance once you are inside.']],
    { warn: ['Sweat is your enemy: work slowly, strip layers while building and put them on again as soon as you stop.', 'Where possible take down any structure and scatter the debris after use.', 'Do not strip live branches: use dead and fallen material.'],
      help: ['If you are hurt, getting colder or it is already dark, shelter simply and signal instead of building.'],
      tags: ['debris hut', 'survival shelter', 'insulation', 'leaves'], see: ['shelter-ground', 'signal-help-now'], src: [] });

  I('shelter-snow', 'shelter', 'snow', 'learn', '2-3 h', 'Snow shelters: caution',
    'Snow insulates, but snow shelters can collapse, trap carbon monoxide, or sit in avalanche terrain. Treat them as skills to learn in a course, not improvise.',
    [['Do not shelter in a tree well', 'The snow around tree trunks can swallow a person. Stay out.'],
    ['Check avalanche terrain', 'Do not build under steep slopes or in slide paths. If you are unsure, do not dig.'],
    ['Pick a simple option: a trench', 'On flat, safe ground dig a trench slightly longer and wider than your body, then roof it with a tarp or skis and poles, and cover with snow blocks. Insulate the floor with your pack and pad.'],
    ['Keep a vent open and your tool inside', 'Make a vent hole in the roof and keep a shovel in with you.'],
    ['Mark the entrance and stay dry', 'Mark it with a pole so you can be found. Avoid sweating while digging.']],
    { warn: ['Never use a stove or fire in a closed snow shelter.', 'Snow shelters can collapse. Never sleep without ventilation.'],
      help: ['In winter, call for help early. If you are not trained, a simple windbreak and insulation with a call for rescue beats a complex shelter.'],
      tags: ['snow cave', 'quinzhee', 'trench', 'winter', 'tree well', 'avalanche'], see: ['shelter-quick', 'signal-help-now'], src: [] });

  I('shelter-ground', 'shelter', 'bed', 'learn', '10 min', 'Insulate from the ground',
    'The ground can pull heat out of you quickly, because the insulation underneath you is squashed flat. In an emergency, anything dry and springy under you helps.',
    [['Use your sleeping pad first', 'Foam or inflatable pads are the best insulation under you.'],
    ['Sit and lie on your pack and gear', 'Put your pack, a rope coil and your shell under torso and hips. Put your feet in the empty pack.'],
    ['Gather dry bedding', 'Dry leaves, grass or dead fallen boughs, piled deep (6 to 12 inches / 15 to 30 cm). They flatten, so add more.'],
    ['Stuff clothing and insulation in rather than under yourself', 'Use extra clothes as filling in your jacket.'],
    ['Keep your insulation dry', 'Wet insulation does little. Wrap it in a bag or waterproof layer.'],
    ['Cover yourself too', 'Add a bivy sack, tarp or space blanket on top as a windproof layer, while keeping air moving to limit condensation.']],
    { warn: ['Use only dead and fallen material for bedding where you can: do not strip live trees.'],
      tags: ['ground', 'sleeping pad', 'bedding', 'insulation', 'boughs'], see: ['shelter-quick', 'shelter-bivy'], src: [LNTNPS] });

  I('shelter-bivy', 'shelter', 'bed', 'learn', '10 min', 'Emergency bivy and space blanket',
    'A bivy sack or emergency bag adds wind and rain protection. A thin foil blanket helps a little but tears easily and traps moisture.',
    [['Pick a sheltered spot and insulate underneath', 'Get your pad or pack under you first.'],
    ['Put your insulating layers on, then enter', 'Put on all dry layers and a hat before getting in.'],
    ['Foil blankets: wrap around the outside of your clothes', 'Tuck the edges so wind cannot blow it off. Expect some condensation inside.'],
    ['Keep your face out or ventilate', 'Never seal yourself in completely. Leave a gap at the face for breathing.'],
    ['Eat and drink warm fluids', 'You need fuel to keep making heat.']],
    { warn: ['Never use a stove, candle or fire inside a closed bivy: carbon monoxide.', 'Foil blankets are not enough on their own in cold or wet.'],
      tags: ['bivy', 'space blanket', 'emergency bag', 'mylar'], see: ['shelter-quick', 'shelter-ground'], src: [] });

  I('shelter-storm', 'shelter', 'bolt', 'now', '15 min', 'Storm coming: get off exposed ground',
    'Thunder means you are within lightning range. Get off ridges, summits and open slopes now, move lower, and avoid tall lone trees, cliffs and water.',
    [['Do not wait for rain', 'If you hear thunder or see towering clouds building, begin moving to safer ground immediately.'],
    ['Get down', 'Go off summits, ridgelines and open slopes. Descend by a dry gully or into a lower area rather than along the ridge.'],
    ['Choose where to wait', 'Dense forest of uniform, low trees is better than open ground. Avoid the tallest tree, isolated trees, water, wet gullies and boggy ground. Do not shelter under a cliff, in a cave or under an overhang.'],
    ['Spread out', 'Keep hikers at least 15 ft (5 m) apart so one strike does not harm everyone.'],
    ['Put metal poles down', 'Lay trekking poles, tent poles and axes away from you. Switch off your phone.'],
    ['If caught in the open, crouch', 'Last resort only, and there is little proof it helps: crouch low on the balls of your feet with your feet together, hands over your ears, and keep as little of you in contact with the ground as possible. Do not lie flat.'],
    ['Wait after the last thunder', 'Stay sheltered for at least 30 minutes after the last thunder you hear.']],
    { warn: ['A tent does not protect you from lightning. Do not wait in one on a ridge or in the open.', 'Flash floods: do not camp or wait in dry washes, slot canyons or low stream beds if heavy rain is falling nearby.', 'Hail: protect your head with your pack.'],
      help: ['Someone struck by lightning needs a 911 call immediately: they can be given CPR safely if they are not breathing.'],
      tags: ['storm', 'lightning', 'thunder', 'weather', 'ridge', 'hail'], see: ['shelter-site'], src: [RMNP, WTA] });

  I('shelter-night', 'shelter', 'moon', 'now', '30 min', 'Night is falling: stop and set up while you can still see',
    'If you are not sure of the way, do not hike on into the dark. Make camp with at least an hour of light left so you can find a site, water, and shelter.',
    [['Decide now', 'If you are on a trail you know and are close to the end, walking on with a headlamp may be fine. If you are off the route, tired, or not sure, stop.'],
    ['Pick a site with about an hour of light left', 'Choose safe ground (see "Choose a safe shelter site"). Look up for dead branches.'],
    ['Put on warm clothes before you get cold', 'Evenings drop in temperature quickly.'],
    ['Get your shelter and ground insulation set up', 'Do it first, then food.'],
    ['Eat and drink, and charge or shut down your phone', 'Switch to power-saving mode. Keep the headlamp and spare batteries within reach.'],
    ['Tell someone, if you have signal', 'Send your location and plan.'],
    ['Have your signals ready', 'Whistle and light within reach, and in the dark keep them where you can find them by feel.']],
    { warn: ['Night travel on unfamiliar or exposed ground causes falls and drifting off route.'],
      help: ['If you are lost, injured or it is getting dangerous, call 911 or use your satellite SOS rather than waiting for morning.'],
      tags: ['dark', 'night', 'sunset', 'camp', 'headlamp', 'dusk'], see: ['shelter-site', 'shelter-quick', 'nav-lost-now'], src: [] });

  /* ================= WATER ================= */
  I('water-find', 'water', 'water', 'learn', '15 min', 'Find water',
    'Flowing water is generally better than still water, and every source needs treating. Plan water on your map before you leave.',
    [['Use your map first', 'Streams, springs and lakes shown on the map, and recent trail reports, tell you where water should be. Dry-country sources can be seasonal or gone.'],
    ['Prefer clear, flowing water', 'Take it from moving water, away from muddy edges, not downstream of camps, livestock, mines or farms.'],
    ['Collect at the source of a spring if you can', 'It is generally cleaner than the stream it feeds.'],
    ['Do not collect from visible scum or mats', 'Blue-green scums can be harmful cyanobacteria. Avoid water from or near them.'],
    ['Snow and ice', 'Melt it in a pot with a little water in the bottom. Do not eat snow in the cold: it cools your core.'],
    ['Treat all of it', 'Clear and cold does not mean safe. See "Treat water".']],
    { warn: ['Standard filters and boiling do not remove dissolved cyanotoxins or chemical contamination.', 'Do not drink from sources near abandoned mines or heavy agriculture.'],
      tags: ['stream', 'spring', 'lake', 'snow', 'source', 'cyanobacteria'], see: ['water-treat', 'water-collect'], src: [GRCA, CDC] });

  I('water-none-now', 'water', 'drop', 'now', '15 min', 'No water: stop, shade, conserve sweat',
    'When water is short, the first job is to lose less of it. Stop sweating, stop chasing a guess, and use what you know about where water is.',
    [['Stop and rest in shade', 'Heat and effort burn water. Make shade with a tarp or clothes. Rest through the hottest hours.'],
    ['Drink when you are thirsty, in sips you can keep', 'Water in your body is better than water in your bottle. Do not ration to the point of being very thirsty.'],
    ['Check the map and your memory', 'Where was the last water? Where does the map show the next? If the last source is closer and safe to reach, go back there in the cool part of the day.'],
    ['Do not follow a guess across open country', 'Moving in heat uses a lot of water. Only move with a clear route to known water.'],
    ['Cover skin and rest', 'Long sleeves, hat, and light colours reduce loss, and rest at night/in cool hours.'],
    ['Signal for help', 'See "Signal for help". If you have a phone with signal, call.'],
    ['Collect dew or rain if available', 'See "Collect rain and dew".']],
    { warn: ['Never drink urine, seawater, or alcohol: they make dehydration worse.', 'Do not eat snow if you are cold.'],
      help: ['Dizziness, confusion, very dark or no urine, a racing heartbeat, or fainting are signs that you need help now. Call 911 / use satellite SOS.'],
      tags: ['no water', 'thirst', 'dehydration', 'desert', 'dry'], see: ['water-dehydration', 'water-collect', 'signal-help-now'], src: [CDC] });

  I('water-treat', 'water', 'water', 'learn', '15 min', 'Treat water: boil, filter, chemicals, UV',
    'Wild water can carry parasites, bacteria and viruses. Treat all of it. Each method covers different germs, so know what yours does and does not do.',
    [['Clear it first if it is cloudy', 'Let it settle and pour it through a cloth or coffee filter. Cloudy water reduces how well chemicals and UV work.'],
    ['Boil: the surest method', 'Bring clear water to a rolling boil for 1 minute. Above 6,500 ft (2,000 m) boil for 3 minutes. Let it cool covered.'],
    ['Filter', 'A filter rated 1 micron absolute or smaller (or NSF 53 or 58 for cysts) removes parasites like Giardia and Cryptosporidium. A pore size of 0.3 micron or smaller also removes bacteria. Most hiking filters do not remove viruses. Reverse osmosis filters and purifiers do.'],
    ['Chemicals', 'Chlorine dioxide tablets kill bacteria, viruses and Giardia, and are partly effective against Cryptosporidium (filtering first is safest). Plain chlorine bleach and iodine do not work well against parasites. Follow the label for time: it is longer in cold or cloudy water.'],
    ['UV light', 'Handheld UV units treat small amounts of clear water. Filter cloudy water first. Follow the device instructions.'],
    ['Combine when risk is higher', 'Where sewage or livestock contamination is likely, or you are unsure what your filter removes, filter and then use chemicals or UV, or boil.'],
    ['Keep treated water clean', 'Store in a clean container and do not dip dirty hands or cups.']],
    { warn: ['Iodine: avoid if pregnant, if you have thyroid problems, or are allergic to iodine; do not use for more than a few weeks.', 'None of these remove dissolved chemicals, fuel, or cyanotoxins.'],
      help: ['Persistent vomiting or diarrhea, blood in the stool, a high fever, or signs of dehydration need medical care.'],
      tags: ['boil', 'filter', 'purify', 'iodine', 'chlorine dioxide', 'UV', 'giardia', 'cryptosporidium'], see: ['water-prefilter', 'water-myths', 'water-boil-calc'], src: [CDC, GRCA] });

  I('water-prefilter', 'water', 'water', 'learn', '10 min', 'Clear cloudy water before you treat it',
    'Silt makes every treatment less effective. Clearing water does not make it safe on its own, but it lets the treatment work.',
    [['Let it settle', 'Leave the container still for a few hours if you can, then pour off the clearer top.'],
    ['Strain through cloth', 'Pour through a clean bandana or coffee filter into a second container.'],
    ['Use alum for very muddy water', 'Alum (sold in the spice aisle for pickling) can pull silt down. Use only the amount the product label or a trusted water-treatment source gives, stir, let it settle, then pour off the clear water. Do not add more than directed.'],
    ['Then treat it', 'Boil, filter or disinfect the clear water.']],
    { warn: ['Clearing is not treating. Sand, cloth and charcoal setups do not make water safe.'],
      tags: ['turbid', 'muddy', 'settle', 'alum', 'strain'], see: ['water-treat', 'water-myths'], src: [GRCA, CDC] });

  I('water-myths', 'water', 'alert', 'learn', '3 min', 'What does NOT make water safe',
    'Several popular "survival tricks" feel reassuring but do not remove germs. Knowing them keeps you from a false sense of safety.',
    [['Improvised filters (sand, charcoal, grass, cloth)', 'They clear sediment. They do not reliably remove germs or chemicals. Always boil or disinfect the water afterwards.'],
    ['Clear, cold, fast-moving water', 'It can still contain parasites, bacteria and viruses.'],
    ['Drinking urine or seawater', 'Both make dehydration worse. Never drink either.'],
    ['Alcohol', 'It dehydrates you.'],
    ['Eating snow when cold', 'It lowers your core temperature. Melt it first.'],
    ['Plants and cactus for water', 'Many are toxic or low-yield. Do not drink from plants or vines you cannot identify.']],
    { warn: ['If you cannot treat water, a clear source is still less risky than a dehydrated body in an emergency, but expect stomach illness; plan so it does not come to that.'],
      tags: ['myth', 'charcoal', 'sand filter', 'urine', 'seawater', 'unsafe'], see: ['water-treat', 'water-prefilter'], src: [CDC, GRCA] });

  I('water-collect', 'water', 'cloud', 'learn', '20 min', 'Collect rain and dew',
    'In a dry spell, rain on a tarp or dew on grass can supply water. Treat it if it touched anything dirty.',
    [['Rain', 'Tilt a tarp or poncho so rain runs into a pot or bottle. Let the first few minutes wash dust off the surface and discard that.'],
    ['Dew', 'Early in the morning wipe grass with a clean cloth and wring it into a container. It is slow work.'],
    ['Snow and ice', 'Melt in a pot with a little water in the bottom to avoid scorching.'],
    ['Treat what you collect', 'Rainwater that ran off dirty surfaces or sat in leaves should be filtered/boiled.']],
    { warn: ['Do not collect from grass that may have been sprayed with chemicals or from roofs of old buildings.'],
      tags: ['rain', 'dew', 'snow', 'collect'], see: ['water-treat'], src: [CDC] });

  I('water-dehydration', 'water', 'thermo', 'learn', '5 min', 'Dehydration and over-drinking: signs and prevention',
    'Thirst, dark urine, headache and fatigue are early signs. Too much plain water for hours can also be dangerous (low blood sodium). Aim for balance.',
    [['Drink to thirst, and a little before', 'Roughly half a liter (a pint) per hour of hard hiking in warm weather is a common rule of thumb; needs vary a lot with heat, altitude and effort.'],
    ['Check your urine', 'Pale yellow is good. Dark, strong urine, or little or none, means drink more.'],
    ['Eat salty food as well as drinking', 'Over a long day, food and electrolytes replace what you sweat out.'],
    ['Watch for over-drinking', 'Headache, nausea, bloating, swelling hands, confusion after lots of plain water and little food are signs of low sodium: stop forcing water, eat salty food, and get help if worsening.'],
    ['Slow down in heat', 'Rest in shade; hike early and late.']],
    { warn: ['Do not push on if you feel confused or dizzy.'],
      help: ['Confusion, fainting, a racing heart that does not settle with rest, no urine for many hours, or vomiting that prevents drinking are reasons to get help.'],
      tags: ['hydration', 'dehydrated', 'urine', 'electrolytes', 'hyponatremia'], see: ['water-none-now', 'weather-hot-now'], src: [CDC] });

  I('weather-hot-now', 'weather', 'sun', 'now', '15 min', 'Too hot: cool down and rest',
    'Heat exhaustion can turn into heat stroke fast. At the first signs, stop, get out of the sun, cool your body and drink.',
    [['Stop and get into shade', 'Shade of a tree, tarp or a rock lee. Sit or lie down.'],
    ['Take off extra clothing and the pack', 'Open vents and loosen collars.'],
    ['Cool your body with water', 'Wet your clothes, neck, head and wrists. Fan yourself. Cooling the body helps more than drinking alone.'],
    ['Drink if you are awake and alert', 'Small sips of water; add something salty to eat.'],
    ['Rest until you feel normal and stay out of the heat', 'Do not carry on until you are properly better; consider waiting for the cool evening.'],
    ['Watch your companions', 'Confusion or odd behavior is a warning sign.']],
    { warn: ['Do not give fluids to anyone who is confused or not fully awake.'],
      help: ['Confusion, strange behavior, fainting, or a very hot body with fast breathing may be heat stroke, a life-threatening emergency: cool them quickly with cold water and call 911 or use SOS.'],
      tags: ['hot', 'heat', 'heat stroke', 'heat exhaustion', 'sun', 'overheated'], see: ['water-dehydration', 'water-none-now'], src: [CDC] });

  I('water-boil-calc', 'water', 'clock', 'learn', '2 min', 'Boil time by elevation',
    'One minute at a rolling boil is enough up to 6,500 ft (about 2,000 m). Above that, boil for three minutes. The Tools tab has a quick calculator.',
    [['Use clear water', 'Pre-filter if cloudy.'], ['Wait for a rolling boil', 'Bubbles must be breaking the surface continuously.'],
    ['Time it', '1 minute below 6,500 ft (2,000 m); 3 minutes above.'], ['Cool covered', 'Let it cool in the covered pot.']],
    { warn: ['The extra time above 6,500 ft is a CDC recommendation; if unsure, boil longer.'],
      tags: ['boil', 'altitude', 'elevation', 'time'], see: ['water-treat'], src: [CDC] });

  /* ================= NAVIGATION ================= */
  I('nav-lost-now', 'nav', 'compass', 'now', '10 min', 'I\'m lost: STOP, think, then decide',
    'Do not keep walking in a guess. Stop, calm down, work out where you last knew you were, and decide whether to retrace or stay and signal.',
    [['Stop', 'Sit down. Drink some water, eat something, put on a layer. A clear head is your most useful tool.'],
    ['Think', 'When did you last know exactly where you were? How long have you walked since? Is anyone expecting you and when?'],
    ['Observe', 'Look at your map, compass and phone (this app\'s Today tab can show your coordinates; GPS works without signal). Note landmarks, streams, ridges, sun.'],
    ['Plan: retrace only if you are confident and it is safe', 'If you lost the trail a few minutes ago and you can follow your footprints or markers back, do that. Mark your route as you go.'],
    ['Otherwise stay put and get found', 'Stay in or near your spot, make a shelter, make yourself visible, and signal. Searchers find stationary people far sooner.'],
    ['Call or text for help if you have signal', 'See "Calling for help". Share coordinates.'],
    ['Conserve your phone', 'Airplane mode, lower brightness, close apps. Turn it on to check or call at set times.']],
    { warn: ['Do not follow a stream or ridge down by guesswork if it leads through cliffs, waterfalls or dense brush.', 'Do not move at night in unfamiliar terrain.'],
      help: ['If anyone is hurt, it is getting dark or stormy, or you are running out of water or warmth, call 911 or press your satellite SOS now.'],
      tags: ['lost', 'stop', 'disoriented', 'off trail'], see: ['signal-help-now', 'signal-911', 'nav-offtrail', 'shelter-night'], src: [] });

  I('nav-map', 'nav', 'map', 'learn', '15 min', 'Read a topographic map',
    'Contour lines show the shape of the land. Learn to read them and you can see a ridge, a saddle and a stream before you reach them.',
    [['Orient the map', 'Turn it so north on the map points north in the real world (use a compass; see "Using a compass").'],
    ['Learn the scale and the contour interval', 'The legend states how far a map inch is on the ground, and how much elevation each contour line represents.'],
    ['Close lines mean steep', 'Widely spaced lines mean gentle terrain. Lines touching mean a cliff.'],
    ['Find valleys, ridges and saddles', 'Contour lines make a V that points uphill where a stream runs. A ridge has Vs pointing downhill. A saddle is between two high points.'],
    ['Read coordinates', 'Grids label lat/lon or UTM. For UTM, read east (right) first then north (up).'],
    ['Compare map to land often', 'At every junction and stream, check the map. Keep your thumb on your last known spot.'],
    ['Check the date and the declination note', 'Old maps can be wrong. The margin gives the declination at the time of printing.']],
    { warn: ['Do not rely on a phone alone; a paper map does not run out of battery.'],
      tags: ['topo', 'contour', 'map', 'scale', 'utm'], see: ['nav-compass', 'nav-handrails'], src: [USGS] });

  I('nav-compass', 'nav', 'compass', 'learn', '15 min', 'Use a compass: bearings and declination',
    'A baseplate compass with a map can take a bearing to a landmark and walk a bearing. Declination is the difference between true north and magnetic north.',
    [['Take a bearing to a landmark', 'Point the direction-of-travel arrow at it. Turn the dial until the orienting arrow lines up with the red end of the needle. Read the number at the index line.'],
    ['Follow a bearing', 'Set the bearing, hold the compass level in front of you and turn your whole body until the needle sits in the orienting arrow. Pick a landmark on that line, walk to it, repeat.'],
    ['Take a bearing from the map', 'Place the long edge between A and B with the direction arrow toward B. Turn the dial so the orienting lines run parallel to the map\'s north-south grid lines, with the orienting arrow pointing to map north.'],
    ['Apply declination', 'Magnetic differs from true. Rule: true = magnetic + east declination (or minus west declination). Turning a map (true) bearing into a compass (magnetic) bearing does the opposite: subtract east declination, add west declination. Many compasses can be adjusted.'],
    ['Back-bearing', 'To return along a bearing, add or subtract 180 degrees.'],
    ['Keep it away from metal and electronics', 'Keep the compass away from steel, phones and magnets. Do not store it near your phone.']],
    { warn: ['Declination changes with place and slowly over time. Look up the current value on a map or from a source such as NOAA.'],
      tags: ['bearing', 'declination', 'magnetic', 'true north', 'orienteering'], see: ['nav-map', 'nav-handrails'], src: [USGS] });

  I('nav-handrails', 'nav', 'route', 'learn', '10 min', 'Handrails, catching features and aiming off',
    'Use big, obvious features to keep yourself on track and to tell you when you have gone too far.',
    [['Handrail', 'A long feature you can follow: a trail, stream, ridge, fence or power line. Keep it on one side.'],
    ['Catching feature', 'A feature beyond your target that tells you that you overshot: a road, a river, a trail crossing.'],
    ['Attack point', 'An easy-to-find feature near your target, from which you walk a short bearing.'],
    ['Aim off', 'If your target is on a linear feature, aim deliberately to one side so you know which way to turn when you reach it.'],
    ['Count paces and time', 'Learn your pace count per 100 m and your speed. Use them to estimate distance on a bearing.'],
    ['Check regularly', 'Compare map to land at every feature, about every 15 to 30 minutes.']],
    { warn: ['A river or ridge can be a poor handrail if it leads through cliffs or dangerous crossings.'],
      tags: ['handrail', 'catching feature', 'attack point', 'aiming off', 'pace count'], see: ['nav-map', 'nav-compass'], src: [] });

  I('nav-markers', 'nav', 'route', 'learn', '5 min', 'Trail markers: blazes, cairns and ducks',
    'Markers vary a lot between trails and agencies. Learn what is used where you walk and do not rely on one marker type alone.',
    [['Blazes', 'Painted marks on trees or rocks. A single mark means "keep going". On many trails, two marks (one above the other, the top offset to one side) warn of a turn. Check the trail\'s own guide.'],
    ['Cairns', 'Stacked rocks that mark the way over rock and above treeline. Follow one to the next in sight of each other.'],
    ['Ducks', 'A small two- or three-stone marker used in open country. Do not assume they are official.'],
    ['Posts, signs and flagging', 'Flagging tape is often temporary, hunter, or survey marking, not the trail.'],
    ['Do not build new cairns or move them', 'Leave what you find. False cairns lead people astray.'],
    ['If you stop seeing markers', 'Stop. Go back to the last one you saw. See "Off the trail".']],
    { warn: ['Markers can fall, be moved or be painted over. Use map and compass too.'],
      tags: ['blaze', 'cairn', 'duck', 'trail marker', 'flagging'], see: ['nav-offtrail'], src: [LNTNPS] });

  I('nav-offtrail', 'nav', 'route', 'learn', '10 min', 'Off the trail? Check and recover',
    'You are probably off the trail if you have not seen a marker for a while, the path has become faint, or the land does not match the map. Stop early.',
    [['Stop as soon as you doubt', 'Do not walk on hoping it will become clear.'],
    ['Look behind you', 'Go back to the last place you were sure of, watching for the place where the trail turned.'],
    ['Look wide at the last marker', 'Stand there and look in all directions for the next one.'],
    ['Check map and compass', 'Does the stream, ridge or junction match? Take a bearing on a known feature.'],
    ['If you cannot recover the trail', 'Switch to "Lost: STOP". Do not keep going.']],
    { warn: ['Short cuts across switchbacks cause erosion and often take you off route.'],
      tags: ['lost trail', 'off route', 'wrong way'], see: ['nav-lost-now', 'nav-markers'], src: [] });

  I('nav-phone', 'nav', 'phone', 'learn', '10 min', 'Phone GPS offline and battery care',
    'A phone\'s GPS works without cell signal, but maps, battery and the cold decide whether it helps. Back it up with paper.',
    [['Download maps before the trip', 'Offline maps from a map app work without signal. Check they cover your whole route.'],
    ['Use airplane mode on the trail', 'GPS still works and the battery lasts far longer. Turn radios on briefly when you need to call or text.'],
    ['Lower screen brightness and close apps', 'Use the Today tab for coordinates and look up when you need to.'],
    ['Keep it warm', 'Cold drains batteries. Carry it close to your body.'],
    ['Carry a power bank and cable', 'Count how many charges you need.'],
    ['Carry a paper map and compass anyway', 'And know how to use them.']],
    { warn: ['Phone compass and GPS can be wrong, especially near metal and in deep canyons. Cross-check with landmarks.'],
      tags: ['GPS', 'battery', 'offline maps', 'phone', 'airplane mode'], see: ['nav-map', 'nav-compass'], src: [] });

  I('nav-river', 'skills', 'water', 'now', '20 min', 'River crossing: decide first, then cross safely',
    'Moving water is stronger than it looks. If in doubt, do not cross: wait, go around, or turn back. If you must cross, plan it and set up your pack so you can drop it.',
    [['Decide whether to cross at all', 'Do not cross if it is fast, over knee height (and a swift knee-deep current can sweep you off your feet), you cannot see the bottom, or there are rapids or logs downstream.'],
    ['Scout upstream and downstream', 'Look for a wide, braided, shallow section with a safe runout. Avoid bends, waterfalls and narrow chutes. Look for a bridge or log if a safe one is near.'],
    ['Time it', 'Snowmelt streams are usually lowest early in the morning and highest in late afternoon. Waiting overnight may make it safe.'],
    ['Prepare', 'Wear shoes. Unbuckle the pack hip belt and chest strap so you can shed it. Put valuables in a waterproof bag.'],
    ['Use poles and move deliberately', 'Face upstream or sideways, keep two points of contact, and shuffle across. Cross at a slight angle downstream.'],
    ['Cross one person at a time, with the others watching from the bank', 'Group-crossing techniques need training. Never tie a rope to your body.'],
    ['If you fall', 'Drop the pack, float on your back with your feet downstream and toes up, and steer to the bank. Never stand up in fast water: a trapped foot is deadly.']],
    { warn: ['Cold water saps strength quickly. Do not cross if it will take long or if you are tired and cold.', 'Do not cross above rapids, a waterfall or a strainer (logs).'],
      help: ['If anyone is swept away, call 911 immediately. Keep eyes on the person and run along the bank.'],
      tags: ['river', 'ford', 'stream crossing', 'creek', 'current', 'water'], see: ['shelter-quick'], src: [] });

  /* ================= SIGNALING ================= */
  I('signal-help-now', 'signal', 'bolt', 'now', '5 min', 'Signal for help',
    'Three of anything is the standard distress call. Stay where you are if you can, make yourself easy to see and hear, and use signals when you think someone may be near.',
    [['Call or text 911 if you have any signal', 'See "Calling for help". A satellite messenger or PLB press SOS.'],
    ['Whistle: three short blasts, pause, repeat', 'A whistle carries farther and takes far less energy than shouting. Signal on a schedule and whenever you hear engines or voices.'],
    ['Stay visible', 'Move to an open spot nearby (if safe) and spread out bright clothing, a tarp or gear on the ground in a contrasting color.'],
    ['Light at night', 'Flash a headlamp three times, pause, repeat. Do not waste batteries when no one is near.'],
    ['Mirror in sunlight', 'See "Signal mirror".'],
    ['Fire and smoke', 'Three fires in a triangle or line about 100 ft (30 m) apart if it is safe and legal. Green vegetation produces thick white smoke by day.'],
    ['Make large ground signals', 'See "Ground signals".'],
    ['Stay put and keep signaling', 'Rescuers find stationary people sooner.']],
    { warn: ['Be extremely careful with fires: do not start a wildfire.', 'Save phone and headlamp batteries. Use the screen flasher in the Tools tab only when you think someone can see it.'],
      help: ['If anyone is badly hurt or you are in danger, call 911 or press the SOS button on your satellite messenger or PLB without delay.'],
      tags: ['signal', 'whistle', 'sos', 'rescue', 'visible', 'smoke'], see: ['signal-whistle-light', 'signal-mirror', 'signal-ground', 'signal-911', 'signal-plb'], src: [FNS] });

  I('signal-whistle-light', 'signal', 'bolt', 'learn', '5 min', 'Whistle, shout and light signals',
    'Three short blasts, a pause, then repeat. Always keep a whistle on your pack strap where you can reach it with cold hands.',
    [['Whistle', 'Three short, sharp blasts, pause, repeat. Louder and farther than your voice, and it saves energy.'],
    ['Voice', 'Three shouts if you have no whistle, but your voice tires quickly and carries poorly in wind or water noise.'],
    ['Light', 'In the dark, three flashes, pause, three flashes. Headlamp, strobe or phone flashlight. The Morse SOS pattern is three short, three long, three short.'],
    ['Listen', 'Pause and listen after each series. Answer any reply with your signal again.'],
    ['Conserve', 'Set times: for example, at the top of the hour. Do not blow yourself hoarse or flatten batteries early.']],
    { warn: ['Do not shine a laser or very bright light into the cockpit of an aircraft.'],
      tags: ['whistle', 'light', 'strobe', 'headlamp', 'sos', 'morse', 'three'], see: ['signal-help-now'], src: [FNS] });

  I('signal-mirror', 'signal', 'sun', 'learn', '5 min', 'Use a signal mirror',
    'A mirror flash can be seen from a great distance in sun. It is useful for aircraft and for people on the ground, and it takes practice.',
    [['Find sun and a target', 'Choose an aircraft, a distant person or a vehicle. Sun must be shining.'],
    ['Hold the mirror near your eye', 'Extend your other arm and make a V with two fingers (or use the aiming hole).'],
    ['Aim the reflected light', 'Line up the target in the V, then tilt the mirror so the reflected spot of light lands on your fingers.'],
    ['Flash toward the target', 'Tilt slightly to sweep the light across it. A steady stream of flashes is best.'],
    ['Sweep the horizon', 'If you have no target, sweep the horizon slowly: a pilot or distant searcher may see it.'],
    ['Check it is working', 'You can see the spot on your hand or ground. Many mirrors have instructions on the back.']],
    { warn: ['Do not use it if it will trouble someone who is not looking for you.'],
      tags: ['mirror', 'reflect', 'flash', 'aircraft', 'sun'], see: ['signal-help-now'], src: [FNS] });

  I('signal-ground', 'signal', 'eye', 'learn', '20 min', 'Ground signals and ground-to-air symbols',
    'Large, high-contrast shapes in an open spot can be seen from the air. Use only simple, widely understood symbols.',
    [['Find an open area', 'Meadow, beach, gravel bar, or snow. Make it visible from above and from the nearest open sky.'],
    ['Use contrast', 'Dark material on snow, bright material on dark ground. Branches, rocks, gear, tarps.'],
    ['Make it big', 'Each symbol at least 10 ft (3 m) long, as big as you can.'],
    ['Make a V', 'V means "I need assistance."'],
    ['Make an X if you cannot go on', 'X is commonly used for "need medical help / unable to proceed". Sources vary slightly, but either way it means you need help.'],
    ['Use an arrow to show your route', 'An arrow points in the direction you have gone. Leave one at junctions if you leave your site.'],
    ['Make three of something if you do not have a symbol', 'Three signal fires, panels or piles in a line or triangle.']],
    { warn: ['Remove or scatter your signals after rescue and do not leave litter.'],
      tags: ['ground to air', 'symbol', 'V', 'X', 'arrow', 'sos', 'helicopter'], see: ['signal-help-now'], src: [FNS] });

  I('signal-911', 'signal', 'phone', 'now', '5 min', 'Calling for help: what to tell 911 or search and rescue',
    'Call if you can; text if you can\'t. Calls need less than you think, and a text can get through when a call will not. Be brief and give the facts in order.',
    [['Call 911 first', 'In the US, phones can generally connect emergency calls through any available network even without your own service. Move to open, higher ground if safe and try again; a ridge can have signal.'],
    ['If calls fail, send a text', 'Send a short text to 911: where you are and what is wrong. Text to 911 is not available everywhere, may not work when roaming, and photos or video cannot be sent.'],
    ['Say where you are', 'Read your coordinates from the Today tab (decimal degrees or UTM; say which). Add trailhead, trail name, landmarks and the time you started.'],
    ['Say what happened', 'Number of people, injuries, and whether anyone is not breathing or bleeding heavily.'],
    ['Say what you have', 'Food, water, warmth, light, whistle, shelter, phone battery level.'],
    ['Do not hang up until told to', 'Answer questions and keep your phone on. Answer calls from unknown numbers: it may be search and rescue.'],
    ['Stay where you are unless unsafe', 'Make yourself visible and ready your signals.']],
    { warn: ['Save your battery: low-power mode, minimal screen time.', 'Do not rely on being able to call; tell someone your plan before you go.'],
      help: ['If you can reach nobody by phone, use a satellite messenger or PLB SOS.'],
      tags: ['911', 'call', 'text', 'sar', 'rescue', 'coordinates', 'location'], see: ['signal-plb', 'signal-help-now'], src: [TXT911, FNS] });

  I('signal-plb', 'signal', 'wifi', 'learn', '5 min', 'PLB and satellite messenger basics',
    'A personal locator beacon (PLB) or satellite messenger can summon help where there is no cell service. Learn your device before you go.',
    [['Know the difference', 'A PLB sends a distress signal via the government satellite system, needs registration and has no subscription. A satellite messenger uses a commercial network, usually with a subscription, and often allows two-way text.'],
    ['Register and test', 'Register your PLB (required in the US) and keep contact details current. Do the self-test as the maker says.'],
    ['Carry it where you can reach it', 'On your shoulder strap or hip belt, not buried in your pack.'],
    ['Use it only for life-threatening emergencies', 'Press SOS for a real emergency. If you carry a satellite messenger or PLB, press its SOS button for a life-threatening emergency.'],
    ['Keep it in the open after activating', 'Give it a clear view of the sky, do not turn it off, and stay where you are until rescuers arrive.'],
    ['Tell someone your trip plan', 'Do not rely on a device alone.']],
    { warn: ['Batteries run down in the cold; keep it warm.', 'Do not use SOS for a blister or a late return.'],
      tags: ['PLB', 'satellite', 'messenger', 'inReach', 'SOS', 'beacon', 'emergency'], see: ['signal-911', 'signal-help-now'], src: [] });

  /* ================= CAMP ================= */
  I('camp-lnt', 'camp', 'leaf', 'learn', '5 min', 'Leave No Trace: the seven principles',
    'Seven short ideas that protect the land and the experience of other people. Where rules differ, local rules win.',
    [['Plan ahead and prepare', 'Know the rules, weather and your limits.'],
    ['Travel and camp on durable surfaces', 'Trails, rock, gravel, dry grass or established sites.'],
    ['Dispose of waste properly', 'Pack out trash and toilet paper; catholes 6 to 8 inches deep, 200 ft from water.'],
    ['Leave what you find', 'Rocks, plants, artefacts and signs stay where they are.'],
    ['Minimize campfire impacts', 'Use a stove; where fires are allowed use rings and small dead wood.'],
    ['Respect wildlife', 'Observe from a distance, never feed animals, store food securely.'],
    ['Be considerate of other visitors', 'Keep voices down, yield on trails, camp out of sight.']],
    { tags: ['leave no trace', 'LNT', 'ethics', 'principles'], see: ['camp-waste', 'camp-site', 'fire-out'], src: [LNTNPS, 'https://lnt.org/why/7-principles/'] });

  I('camp-site', 'camp', 'tent', 'learn', '10 min', 'Choose and leave a campsite',
    'Good campsites are found, not made. Use what is already there and leave it better.',
    [['Use an established site in popular places', 'Concentrate use so you do not create more bare ground. Keep the site small.'],
    ['In pristine areas, spread out', 'Do not make new trails, and move on after a night or two.'],
    ['Camp at least 200 ft (60 m) from water', 'It protects the water and keeps the camp out of flood channels.'],
    ['Choose safe ground', 'See "Choose a safe shelter site".'],
    ['Check local rules', 'Many areas require designated sites, permits or set distances from trails and lakes.'],
    ['Before you leave, look around', 'Pick up all trash, including small bits. Scatter cold ashes, brush out signs of camp, and leave natural objects.']],
    { tags: ['camp', 'dispersed', 'site', 'leave no trace'], see: ['shelter-site', 'camp-lnt'], src: [LNTNPS] });

  I('camp-waste', 'camp', 'trash', 'learn', '10 min', 'Human waste, toilet paper and washing',
    'Dig a cathole 6 to 8 inches deep and 200 ft from water, camp and trails. Pack out toilet paper and hygiene items. Use toilets where they exist.',
    [['Use toilets when you can', 'Where there are toilets, use them.'],
    ['Choose the spot', 'At least 200 ft (about 70 adult steps) from water, camp and trails, on organic soil, not in a drainage.'],
    ['Dig a cathole 6 to 8 inches (15 to 20 cm) deep', 'Use a small trowel.'],
    ['Cover and disguise', 'Fill the hole with the soil and cover with leaves or a rock.'],
    ['Pack out toilet paper and hygiene products', 'Use a zip bag (double-bag). Never bury tampons or wipes.'],
    ['Where rules require it, use a waste bag or toilet system', 'Many river corridors, alpine and desert areas require carrying all human waste out.'],
    ['Wash hands, then dishes', 'Wash hands away from water. Wash dishes 200 ft from water, strain food bits and pack them out, and scatter the grey water.']],
    { warn: ['Poor sanitation spreads illness. Wash or sanitize hands before you handle food.', 'Pee away from water and trails; on rock or bare ground, not on plants animals dig up.'],
      help: ['Persistent diarrhea or vomiting needs fluids and medical advice.'],
      tags: ['cathole', 'toilet', 'poop', 'waste', 'toilet paper', 'dishes', 'wag bag'], see: ['camp-lnt', 'water-treat'], src: [LNTNPS, 'https://lnt.org/why/7-principles/'] });

  I('camp-food', 'camp', 'bear', 'learn', '10 min', 'Store food: canisters and rules',
    'Food and anything with a scent belongs in an approved container or hang, away from your tent. Rules differ by park and region, so check the one you are in.',
    [['Check the local rule', 'Some areas require bear canisters (for example, specific areas of Sequoia and Kings Canyon National Parks from May 1 to Oct 31), others recommend them. Ask the agency.'],
    ['Pack everything with a scent into the canister', 'Food, trash, soap, sunscreen, deodorant, toothpaste, and cooking gear.'],
    ['Put the canister on the ground, away from your tent', 'About 50 ft (15 m) or more from where you sleep, not on a cliff edge or near water where it can roll in.'],
    ['Keep food out of your tent and car', 'Use trailhead storage boxes where provided.'],
    ['Leave your pack open when empty', 'Open the flaps and pockets so animals do not chew through.'],
    ['Never leave food unattended', 'Not even for a short while.']],
    { warn: ['Use only approved containers where the rule requires.', 'A fed bear is a dead bear: keep food away from animals.'],
      tags: ['bear canister', 'food storage', 'bear', 'scent', 'rules'], see: ['camp-hang', 'camp-cook'], src: [BEARBC, FSFOOD, LNTNPS] });

  I('camp-hang', 'camp', 'bear', 'learn', '30 min', 'Counterbalance food hang',
    'A hang is only for places that allow it and have suitable trees. It often fails against bears that have learned to defeat it. Use a canister where possible.',
    [['Find a tree with a live, downward-sloping branch', 'You may need to move away from your camp to find one.'],
    ['Divide the food into two bags of equal weight', 'Include all scented items.'],
    ['Throw the rope over the branch', 'The branch should be about 20 ft (6 m) off the ground and at least 10 ft (3 m) from the trunk.'],
    ['Hoist the first bag to the branch', 'Tie it to one end and pull up.'],
    ['Tie the second bag as high as you can', 'Stuff the extra rope into the bag, leaving a loop outside.'],
    ['Adjust so both bags hang level, at least 12 ft (3.7 m) off the ground', 'Push the lower bag up with a stick.'],
    ['To retrieve', 'Hook the loop with a long stick and pull down slowly.']],
    { warn: ['Check if hanging is accepted. In many areas, canisters are required instead.', 'Do not hang over water or from dead branches.'],
      tags: ['hang', 'counterbalance', 'bear bag', 'food', 'rope'], see: ['camp-food', 'knot-clove'], src: [HANG, BEARBC] });

  I('camp-cook', 'camp', 'fork', 'learn', '10 min', 'Cooking, smells and stove safety',
    'Cook away from where you sleep, clean up as you go, and handle your stove with care.',
    [['Cook and eat away from your tent', 'Many parks suggest about 100 yards (90 m) from your sleeping area. Check local advice.'],
    ['Cook downwind and keep a tidy kitchen', 'Wipe up spills; put leftovers in the food container.'],
    ['Change out of clothing with cooking smells', 'Keep it with your food.'],
    ['Stove safety', 'Use a stable, level surface. Never cook inside a tent or in a vestibule: fire and carbon monoxide.'],
    ['Refuel carefully', 'Turn the stove off, let it cool, move away from flame, and refuel in open air.'],
    ['Handle the pot', 'Watch boiling water: scalds are common burns in the backcountry.']],
    { warn: ['Do not wrap a windscreen around a canister: heat can cause it to burst.', 'Never use a stove in a closed tent.'],
      tags: ['cooking', 'stove', 'smells', 'kitchen', 'canister', 'carbon monoxide'], see: ['camp-food', 'gear-stove'], src: [LNTNPS, BEARBC] });

  I('camp-wildlife-now', 'wildlife', 'eye', 'now', '3 min', 'Wild animal close: give space and back away',
    'For most large wildlife the safe move is the same: stay calm, give distance, never approach or feed it, and back away slowly. Species-specific advice is in the wildlife section.',
    [['Stop and stay calm', 'Do not run. Running can trigger a chase.'],
    ['Do not approach or feed it', 'Never get close for a photo.'],
    ['Make yourself known without screaming', 'Speak in a calm voice so the animal knows you are a person.'],
    ['Keep children and dogs close', 'Pick up small children. Put dogs on a leash.'],
    ['Back away slowly and leave the area', 'Give it a clear way out. Take a different route.'],
    ['Use bear spray if you carry it and a bear charges', 'Know how it works before you need it.']],
    { warn: ['Many parks require staying at least 100 yards (90 m) from bears and wolves and 25 yards (23 m) from other large animals. Check local rules.', 'Never put yourself between a mother and her young.'],
      help: ['Call 911 for any attack or injury. Report the encounter to rangers.'],
      tags: ['wildlife', 'animal', 'bear', 'lion', 'moose', 'distance'], see: ['camp-food', 'camp-cook'], src: [LNTNPS] });

  /* ================= KNOTS ================= */
  I('knot-bowline', 'skills', 'tool', 'learn', '5 min', 'Bowline: a fixed loop',
    'Forms a loop that does not slip or jam and can be untied after load. Good for tying a rope to a tree or tarp corner.',
    [['Make a small loop in the standing part', 'The "rabbit hole". Leave a long tail.'],
    ['Pass the tail up through the loop', 'The rabbit comes out of the hole.'],
    ['Go around behind the standing part', 'The rabbit goes around the tree.'],
    ['Go back down through the loop', 'The rabbit goes back into the hole.'],
    ['Hold the standing part and tail together and pull tight', 'Dress the knot and leave a long tail, or add a stopper knot.']],
    { warn: ['Do not use this knot, or any knot learned here, for climbing or lifesaving without training and a backup.', 'It can work loose when unloaded: leave a long tail.'],
      tags: ['bowline', 'loop', 'knot'], see: ['knot-fig8', 'knot-clove'], src: [] });

  I('knot-clove', 'skills', 'tool', 'learn', '5 min', 'Clove hitch: quick tie to a post',
    'Ties a rope to a post, pole or tree quickly and adjusts easily. Ideal for starting a ridgeline.',
    [['Pass the rope around the post', 'Cross the working end over the standing part.'],
    ['Make a second turn around the post', 'Keep it parallel to the first turn.'],
    ['Tuck the working end under the crossing', 'Slip it under the second turn.'],
    ['Pull both ends', 'The two turns should sit side by side and lock.']],
    { warn: ['It can slip if the load comes and goes. Add two half hitches for security.', 'Not for life safety.'],
      tags: ['clove hitch', 'hitch', 'post', 'ridgeline'], see: ['knot-taut-line', 'shelter-tarp'], src: [] });

  I('knot-taut-line', 'skills', 'tool', 'learn', '10 min', 'Taut-line hitch: adjustable guy line',
    'A friction hitch for guy lines and tarp ridgelines. It slides to adjust when you pull and grips when loaded.',
    [['Take the line around the stake or tree', 'Bring the working end back toward the standing line.'],
    ['Wrap the working end around the standing line twice', 'Wrap inside the loop, toward the anchor.'],
    ['Make one more wrap on the outside', 'Go to the side of those wraps farther from the anchor.'],
    ['Tuck the end through and snug it up', 'The three wraps should sit neatly.'],
    ['Test', 'The hitch should slide when you push it by hand and hold when the tent pulls. Add a wrap if it slips.']],
    { warn: ['Practice at home. Slippery cords may need an extra wrap.'],
      tags: ['taut-line', 'guy line', 'tent', 'adjustable', 'hitch'], see: ['shelter-tarp', 'knot-clove'], src: [] });

  I('knot-fig8', 'skills', 'tool', 'learn', '5 min', 'Figure-eight: stopper and loop',
    'A strong stopper knot at the end of a rope, and the basis for a secure loop.',
    [['Stopper', 'Make a loop in the end, wrap the working end around the standing part, and pass it back down through the loop. Pull tight.'],
    ['Loop', 'Double the end of the rope into a bight and tie the figure-eight with the doubled rope. The loop on the end is the fixed loop.'],
    ['Dress it', 'Make sure the strands lie parallel and flat, then pull.']],
    { warn: ['Not for climbing or lifesaving without training.'],
      tags: ['figure eight', 'stopper', 'loop', 'knot'], see: ['knot-bowline'], src: [] });

  I('knot-trucker', 'skills', 'tool', 'learn', '10 min', 'Trucker\'s hitch: haul a line tight',
    'Gives a pulley-like advantage to tension a line, for a tight ridgeline or to lash a load.',
    [['Tie a fixed loop in the line', 'Part-way along the standing line, make a small loop (for example, a slipknot or figure-eight loop).'],
    ['Pass the end around the anchor', 'Take the working end around the tree or post.'],
    ['Pass it up through the loop', 'Bring it back through the loop you made.'],
    ['Haul down', 'Pull hard on the end to tighten.'],
    ['Lock off', 'Hold the tension and tie two half hitches around the line.']],
    { warn: ['You can overload and break poles and anchors: stop when it is tight.', 'Not for life safety.'],
      tags: ['trucker', 'tension', 'ridgeline', 'lashing'], see: ['knot-taut-line', 'knot-clove'], src: [] });

  /* ================= GEAR REPAIR ================= */
  I('gear-pole', 'gear', 'tent', 'learn', '15 min', 'Tent pole splint',
    'A snapped aluminum pole can be splinted with a repair sleeve, or a stick and tape, to get you through the trip.',
    [['Straighten and align the break', 'If the pole is bent, work it gently straight.'],
    ['Slide a repair sleeve over the break', 'Center it on the damage.'],
    ['Tape both ends of the sleeve tightly', 'Wrap tape around the pole at both ends.'],
    ['No sleeve? Use a stick or tent stake', 'Lay it along the break and wrap tightly with tape or cord.'],
    ['Reduce the load', 'Guy the tent out to take stress off the pole.']],
    { warn: ['Check it before each night and in wind. Replace after the trip.'],
      tags: ['tent pole', 'splint', 'broken', 'repair'], see: ['gear-kit', 'gear-trek-pole'], src: [] });

  I('gear-pad', 'gear', 'bed', 'learn', '20 min', 'Patch a sleeping pad leak',
    'Find the leak, clean the spot, and patch it with the repair kit. Allow time to cure.',
    [['Inflate the pad and listen', 'Hold it near your face or ear to feel for air. If you can, immerse it, or use soapy water, and watch for bubbles.'],
    ['Mark the hole', 'Use a pen or a stick so you do not lose it.'],
    ['Dry and clean the spot', 'Wipe with alcohol wipe.'],
    ['Apply the patch', 'Use the kit patch or adhesive tape. Press firmly from the center out.'],
    ['Let it cure', 'Wait the cure time the patch instructions give before you inflate or lie on it.'],
    ['Backup', 'Put clothes or your pack under you if it cannot hold air.']],
    { warn: ['Poorly insulated sleeping increases the risk of getting cold at night.'],
      tags: ['air pad', 'puncture', 'patch', 'leak'], see: ['shelter-ground', 'gear-kit'], src: [] });

  I('gear-stove', 'gear', 'fuel', 'learn', '10 min', 'Stove troubleshooting',
    'Most stove problems are cold fuel, clogged jets, or poor seals. Smell for gas before you light.',
    [['Weak flame in the cold', 'Warm the canister in your jacket (never by flame). Insulate it from the ground.'],
    ['Clogged jet', 'Clean the jet with the pin or needle from the stove kit.'],
    ['Leak', 'If you smell gas, turn it off and move away from any flame. Re-seat the stove and check the O-ring.'],
    ['Liquid-fuel stove', 'Pump up pressure, prime properly, and check fuel lines and filter.'],
    ['Wind', 'Use a windscreen only around the pot and burner, not the canister.']],
    { warn: ['Never use a stove in a tent or enclosed space.', 'Do not wrap a windscreen around a gas canister.'],
      tags: ['stove', 'jet', 'canister', 'fuel', 'cold'], see: ['camp-cook'], src: [] });

  I('gear-zipper', 'gear', 'tool', 'learn', '10 min', 'Stuck or separating zipper',
    'Most zipper failures are caught fabric or a slider that has opened up. Fix gently.',
    [['Do not force it', 'Back up and free the fabric.'],
    ['Lubricate', 'Rub a pencil, candle or lip balm on the teeth.'],
    ['Separating teeth', 'Squeeze the slider gently with pliers so it grips again. Do this in small steps.'],
    ['Broken pull', 'Thread a cord or safety pin through the slider hole.'],
    ['Temporary close', 'Close the gap with safety pins or tie off with cord.']],
    { warn: ['Squeezing too hard can break the slider.'],
      tags: ['zipper', 'slider', 'stuck'], see: ['gear-kit'], src: [] });

  I('gear-feet', 'gear', 'boot', 'learn', '10 min', 'Hot spots and blisters',
    'Treat a hot spot the moment you feel it. Waiting turns a minor irritation into a blister that can end a trip.',
    [['Stop at the first hot spot', 'Take off the shoe and sock; let it air.'],
    ['Cover it', 'Apply tape or a blister pad before a blister forms. Smooth, wrinkle-free.'],
    ['Intact blister', 'Leave the skin on, pad around it with a donut shape, and cover.'],
    ['Torn blister', 'Wash gently and cover with a clean dressing. Keep it clean.'],
    ['Dry your feet', 'Change to dry socks. Adjust laces.'],
    ['Check fit later', 'Fit, socks and trimmed toenails prevent most blisters.']],
    { warn: ['Do not pull off the roof of a blister.'],
      help: ['Spreading redness, warmth, pus, red streaks, or fever are signs of infection: seek care. Take extra care if you have diabetes or poor circulation.'],
      tags: ['blister', 'hot spot', 'foot', 'boots', 'moleskin'], see: ['gear-sole'], src: [] });

  I('gear-trek-pole', 'gear', 'tool', 'learn', '10 min', 'Trekking pole repair',
    'Most failures are slipping locks or a bent or broken section. Field fixes get you to the trailhead.',
    [['Slipping lock', 'Clean grit from the section. Tighten the twist lock or adjust the expander.'],
    ['Bent section', 'Straighten slowly; do not force.'],
    ['Broken pole', 'Splint with a stick and tape, or use only the intact sections.'],
    ['Lost tip or basket', 'Wrap tape around the end for traction.'],
    ['Pole as a tent support', 'If you use poles for a shelter, do not overload them.']],
    { warn: ['Do not rely on a damaged pole on steep ground or while crossing a river.'],
      tags: ['trekking pole', 'hiking pole', 'lock', 'broken'], see: ['gear-pole', 'gear-kit'], src: [] });

  I('gear-sole', 'gear', 'boot', 'learn', '15 min', 'Boot sole failure',
    'When a sole peels away, wrap it. Duct tape or cord holds it long enough to get out.',
    [['Clean and dry the shoe', 'Remove loose dirt.'],
    ['Wrap tape around the whole shoe', 'Go under the sole and over the top, several layers, from toe to heel.'],
    ['Reinforce at the toe and heel', 'Add extra wraps where the sole is flexing.'],
    ['If no tape, use cord', 'Wrap tightly, tie, and cover with a gaiter or strap.'],
    ['Walk slowly and plan an exit', 'This is a short-term fix.']],
    { warn: ['Avoid steep, wet, or loose ground until the shoe is repaired.'],
      help: ['If you cannot walk safely, stay put and call for help.'],
      tags: ['sole', 'boot', 'delaminate', 'duct tape', 'shoe'], see: ['gear-feet', 'gear-kit'], src: [] });

  I('gear-kit', 'gear', 'tool', 'learn', '5 min', 'A small repair kit',
    'A few light things fix most trip-ending problems.',
    [['Duct or cloth tape', 'Wrap several feet around a trekking pole or lighter.'],
    ['Needle and strong thread or dental floss', 'For packs, clothes and tents.'],
    ['Safety pins and a few zip ties', 'For straps, zippers, poles and packs.'],
    ['Cordage', 'A few meters of 2 to 3 mm cord.'],
    ['Patches', 'For tents, pads and clothing, and a small tube of sealant.'],
    ['Pole splint', 'A short aluminum sleeve.'],
    ['A spare buckle', 'And a pocket knife or multi-tool.']],
    { tags: ['repair kit', 'tape', 'thread', 'tools'], see: ['gear-pole', 'gear-pad', 'gear-zipper'], src: [] });

  /* ================= GENERIC FIRST STEPS (medical section has the detail) ================= */
  I('injured-now', 'medical', 'first', 'now', '5 min', 'Injured: stop, make it safe, get help',
    'Detailed first aid is in the medical section. These are the first steps for any injury.',
    [['Stop and check the area is safe', 'Move yourself and others away from rockfall, water or traffic only if you must.'],
    ['Call 911 or use SOS right away if it is serious', 'Unresponsive, not breathing, heavy bleeding, a head, neck or back injury, or a chest injury.'],
    ['Control heavy bleeding', 'Press firmly and directly on the wound with a clean cloth and keep pressing.'],
    ['Do not move someone with a possible neck or back injury', 'Unless there is immediate danger.'],
    ['Keep the person warm and out of the wind and wet', 'Insulate them from the ground.'],
    ['Stay with them and signal', 'See "Signal for help". Write down times and what changed.']],
    { warn: ['This is a reference, not training. Take a wilderness first-aid course.'],
      help: ['When in doubt, call for help early.'],
      tags: ['injured', 'injury', 'hurt', 'bleeding', 'first aid', 'broken', 'sprain'], see: ['signal-911', 'shelter-quick'], src: [] });
})();
