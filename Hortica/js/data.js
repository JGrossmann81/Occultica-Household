/* Hortica reference data: companions, soils, frost zones, amendments, nutrient advice, old-timer wisdom.
   Plant tokens in pair lists: an id (tomato), @family (@bra = cabbage family), %group (%allium). */
const GROUPS = {
  allium: ['onion', 'garlic', 'leek', 'chives'],
  legume: ['bushbean', 'polebean', 'peas'],
  fruittree: ['apple', 'pear', 'peach', 'plum', 'sweetcherry', 'tartcherry', 'apricot'],
  bramble: ['raspberry', 'blackberry'],
  cucurbit: ['cucumber', 'zucchini', 'winsq', 'pumpkin', 'melon', 'cantaloupe']
};
/* good pairs: "A,B|why". Distance rule: neighbors within about 3 ft (or 1.5 tiles on big tiles). */
const GOOD_TXT = `
tomato,basil|Basil is said to sweeten tomatoes and its scent confuses hornworm moths and whiteflies.
tomato,carrot|Carrots loosen the soil under tomatoes and use the shade they cast.
tomato,marigold|French marigolds help hold down root-knot nematodes and whitefly.
tomato,chives|Chives drive off aphids and are said to deter blight spores.
tomato,borage|Borage draws pollinators and traditionally keeps hornworms off tomatoes.
tomato,parsley|Parsley flowers feed the hoverflies and wasps that eat tomato pests.
tomato,asparagus|An old pairing: each is said to repel the other's beetles.
tomato,nasturtium|Nasturtiums act as a trap crop that pulls aphids off tomatoes.
tomato,onion|Onion scent confuses many tomato pests.
tomato,beebalm|Bee balm brings pollinators and is said to improve tomato flavor.
tomato,alyssum|Sweet alyssum feeds hoverflies that eat aphids.
pepper,basil|Basil repels aphids and spider mites from peppers.
pepper,onion|Onions deter aphids and make good neighbors for shallow-rooted peppers.
pepper,carrot|Carrots grow in the loose soil beside peppers and do not compete for light.
pepper,marigold|Marigolds draw pest insects away from peppers and ease nematodes.
pepper,okra|Okra gives peppers light afternoon shade in hot summers.
eggplant,bushbean|Beans repel Colorado potato beetles from eggplant.
eggplant,thyme|Thyme confuses flea beetles.
eggplant,marigold|Marigolds ease nematodes and draw pests away.
potato,bushbean|Beans repel Colorado potato beetles and potatoes repel Mexican bean beetles.
potato,marigold|Marigolds ease nematodes around potatoes.
potato,corn|Corn and potatoes use different layers of the soil and do not share pests.
potato,alyssum|Alyssum feeds beneficial insects that eat potato pests.
cucumber,radish|Radishes repel cucumber beetles.
cucumber,nasturtium|Nasturtiums repel cucumber beetles and aphids.
cucumber,dill|Dill draws beneficial wasps that prey on cucumber pests.
cucumber,sunflower|Sunflowers give cucumber vines something to climb and a little shade.
cucumber,corn|Corn is a natural trellis and breaks the wind.
cucumber,peas|Peas add nitrogen that cucumbers use later in the season.
cucumber,bushbean|Beans fix nitrogen that cucumbers love.
corn,polebean|Beans climb the corn and fix nitrogen back into the soil (the Three Sisters).
corn,winsq|Squash leaves shade out weeds and keep the soil cool and moist under corn (Three Sisters).
corn,pumpkin|Pumpkin vines shade the ground between corn rows (Three Sisters).
corn,sunflower|Sunflowers make a windbreak and draw pollinators.
corn,bushbean|Beans fix nitrogen that heavy-feeding corn uses.
corn,peas|Peas add nitrogen ahead of corn.
bushbean,carrot|Carrots and beans use different soil layers; neither bothers the other.
bushbean,celery|Celery and beans are classic partners.
bushbean,marigold|Marigolds deter bean beetles.
bushbean,strawberry|Beans fix nitrogen for strawberries.
peas,carrot|Peas fix nitrogen and carrots use the loosened soil.
peas,radish|Quick radishes mark the row and break the soil crust for peas.
peas,turnip|Turnips and peas share a cool season and do not compete.
carrot,onion|Onion scent masks the carrot from carrot rust fly, and carrot scent masks the onion from onion fly.
carrot,leek|Leek scent hides carrots from the carrot rust fly.
carrot,rosemary|Rosemary scent confuses the carrot rust fly.
carrot,sage|Sage scent confuses the carrot rust fly.
carrot,chives|Chives keep aphids off carrots.
carrot,lettuce|Lettuce shades carrot seedlings and is out of the way before carrots bulk up.
carrot,radish|Radishes break the soil crust and mark the row.
@bra,dill|Dill draws wasps that eat cabbage worms.
@bra,thyme|Thyme scent confuses the cabbage moth.
@bra,onion|Onion scent confuses cabbage maggot flies and caterpillar moths.
@bra,nasturtium|Nasturtiums are a trap crop for aphids and caterpillars.
@bra,chamomile|Chamomile is an old companion for the cabbage family and draws hoverflies.
@bra,celery|Celery scent deters the white cabbage butterfly.
@bra,beet|Beets and brassicas use different nutrients and do not compete.
@bra,rosemary|Rosemary scent confuses cabbage moths and cabbage root fly.
@bra,sage|Sage scent confuses cabbage moths.
@bra,mint|Mint scent keeps cabbage moths away (keep it in a pot; it spreads).
@bra,alyssum|Alyssum feeds hoverflies that eat aphids.
@bra,clover|Low clover under brassicas is a living mulch and confuses egg-laying moths.
lettuce,radish|Radishes loosen soil; both are quick, shallow crops.
lettuce,strawberry|Lettuce between strawberries uses the space until the plants spread.
lettuce,cucumber|Cucumber vines shade summer lettuce.
lettuce,onion|Onion scent keeps aphids and rabbits off lettuce.
lettuce,chives|Chives protect lettuce from aphids.
lettuce,alyssum|Alyssum draws the hoverflies that eat lettuce aphids.
lettuce,dill|Dill draws beneficial insects and does not compete.
spinach,strawberry|Spinach fills the space between strawberries in cool weather.
spinach,peas|Peas shade spinach and fix nitrogen it needs.
spinach,radish|Radishes break the crust and mark the row.
beet,onion|Beets and onions share the bed without competing.
beet,kohlrabi|Different root depths, no conflict.
beet,garlic|Garlic discourages pests around beets.
beet,lettuce|Shallow lettuce fills the gaps around slow beets.
onion,strawberry|Onions protect strawberries from slugs and some fungal disease.
onion,chard|Onion scent protects chard.
onion,lettuce|A classic pairing: neither competes.
garlic,rose|Garlic repels aphids from roses and may reduce black spot.
garlic,tomato|Garlic repels spider mites.
garlic,apple|Garlic is said to reduce apple scab and borers (plant a ring under the tree).
garlic,carrot|Garlic hides carrots from the rust fly.
garlic,beet|Garlic discourages pests around beets.
garlic,raspberry|Garlic discourages beetles and fungus near raspberries.
zucchini,nasturtium|Nasturtiums repel squash bugs.
zucchini,borage|Borage improves squash pollination and deters worms.
zucchini,marigold|Marigolds deter beetles around squash.
pumpkin,radish|Radishes repel squash bugs and cucumber beetles.
melon,marigold|Marigolds deter beetles and nematodes.
melon,nasturtium|Nasturtiums repel cucumber beetles and aphids.
melon,corn|Corn gives wind shelter to melon vines.
strawberry,borage|Borage near strawberries is said to improve yield and flavor.
strawberry,thyme|Thyme scent deters worms and other pests on strawberries.
strawberry,chives|Chives keep aphids off strawberries.
apple,chives|Chives under apples are an old remedy for scab.
apple,nasturtium|Nasturtiums repel woolly aphids and codling moth.
%fruittree,comfrey|Comfrey draws deep nutrients up for fruit trees; cut it for mulch.
%fruittree,daffodil|A ring of daffodils keeps grass off the root zone and gophers away.
%fruittree,clover|Clover is a living mulch that adds nitrogen and feeds bees.
%fruittree,chives|Chives and other alliums confuse many fruit tree pests.
%fruittree,yarrow|Yarrow draws hoverflies and parasitic wasps.
rose,lavender|Lavender repels aphids and draws bees to roses.
rose,chives|Chives repel aphids and may lower black spot.
rose,marigold|Marigolds deter aphids and nematodes.
basil,asparagus|Basil repels asparagus beetles.
asparagus,parsley|Parsley is said to deter asparagus beetles.
asparagus,calendula|Calendula draws beneficial insects to asparagus.
asparagus,comfrey|Comfrey mulch feeds the permanent bed.
okra,cucumber|Okra gives cucumbers light shade and a support.
celery,leek|Leek and celery are old friends.
leek,carrot|Leeks hide carrots from the rust fly and carrots hide leeks from the leek moth.
sage,rosemary|Two dry-loving herbs that share a bed happily.
lavender,thyme|Dry-soil herbs that share a sunny bed.
sunflower,melon|Sunflowers give melons wind shelter.
dill,lettuce|Dill draws beneficial insects to lettuce.
beebalm,apple|Bee balm draws pollinators to the orchard.
borage,tomato|Borage draws pollinators and traditionally deters hornworms.
chamomile,onion|Chamomile is said to improve onion flavor and draws hoverflies.
calendula,tomato|Calendula draws beneficials and traps pests.
cosmos,tomato|Cosmos feed pollinators and beneficial insects.
zinnia,cucumber|Zinnias draw pollinators and ladybugs.
yarrow,grape|Yarrow draws predatory insects to the vineyard.
grape,clover|Clover is a living mulch under vines.
grape,peas|Peas fix nitrogen for vines.
buckwheat,apple|Buckwheat flowers feed the beneficial insects that protect the orchard.
raspberry,chives|Chives deter beetles and fungus near raspberries.
blackberry,chives|Chives deter beetles and fungus near brambles.
fieldpea,oats|The classic cover mix: peas fix nitrogen and oats hold them up.
vetch,rye|The classic cover mix: vetch fixes nitrogen and rye gives it a trellis and a mulch.
rosemary,sage|Both come from hot, dry, stony ground and want the same lean, gritty soil and little water.
rosemary,thyme|Matching Mediterranean needs: full sun, sharp drainage, little water.
rosemary,lavender|Lavender and rosemary share lean alkaline soil, sun and drought, and bees love both.
thyme,oregano|Both are low, drought-proud herbs that suit the same dry, sunny bed.
thyme,lavender|Both thrive on lean, sharp-drained soil and bloom together for bees.
sage,marjoram|Related Mediterranean herbs with the same dry sun-baked needs.
tarragon,thyme|Both need sharp drainage and little feeding.
hyssop,lavender|Hyssop and lavender bloom together and pull in bees, and both like dry lean soil.
hyssop,@bra|Old gardeners say hyssop lures cabbage moths away from brassicas (folklore, but the bees are real).
anisehyssop,beebalm|Both are pollinator magnets that like the same sun and moisture.
echinacea,yarrow|Prairie plants with the same sun and drought tolerance, and both draw beneficial insects.
echinacea,beebalm|Both are bee and butterfly favorites and share the same sunny, average bed.
chamomile,yarrow|Both draw hoverflies and lacewings, and they take the same lean, sunny conditions.
dill,cilantro|Both umbels draw hoverflies and lacewings that eat aphids.
basil,parsley|Both like rich soil and steady moisture, so they share a pot or bed easily.
basil,thaibasil|Same needs. Keep them as a basil patch and pinch often.
catnip,eggplant|Catnip is said to discourage flea beetles that chew on eggplant.
horseradish,potato|Planted at the corners of a potato patch, horseradish is old advice for deterring potato bugs.
ginger,turmeric|Both are tropical rhizomes that want the same warm, humid, part-shade bed.
ginger,galangal|Close cousins with identical care: warm, moist, rich and shaded from afternoon sun.
lemongrass,ginger|Both are warm-season tropicals that like heat, moisture and rich soil.
goldenseal,ginseng|Both are woodland medicinals that want deep shade and leafy humus.
nettle,comfrey|Both are mineral accumulators for compost tea and mulch. Both run, so give them a corner of their own.
borage,hyssop|Both draw bees, and borage is a good filler between herbs.
lemonbalm,chamomile|Gentle tea herbs that share part sun and average moisture, and both bring pollinators.
calendula,basil|Calendula pulls aphids and whitefly onto itself and away from the basil.
`;
/* keep-apart pairs: "A,B|why|range ft (optional)" */
const BAD_TXT = `
tomato,potato|They share early and late blight and the Colorado potato beetle. Keep them apart.
tomato,corn|They share the same worm (corn earworm is the tomato fruitworm).
tomato,fennel|Fennel gives off compounds that stunt tomatoes.
tomato,dill|Mature dill stunts tomatoes (young dill is fine).
tomato,@bra|Brassicas and tomatoes compete hard for nutrients (traditional advice).
potato,@cuc|Squash and cucumbers make potatoes more prone to blight.
potato,sunflower|Sunflower roots give off compounds that stunt potatoes.
potato,raspberry|They share verticillium wilt.
potato,pepper|Nightshades share blight, verticillium and the Colorado potato beetle.
potato,eggplant|Nightshades share blight, verticillium and the Colorado potato beetle.
strawberry,@sol|Tomato-family crops leave verticillium wilt in the soil, which strawberries catch easily.
raspberry,@sol|Brambles are very prone to verticillium wilt; do not plant where nightshades grew.
blackberry,@sol|Brambles are very prone to verticillium wilt; do not plant where nightshades grew.
strawberry,@bra|Strawberries and brassicas inhibit each other (traditional advice).
fennel,@sol|Fennel gives off compounds that stunt most neighbors. Grow it alone, at the edge or in a pot.
fennel,%legume|Fennel gives off compounds that stunt most neighbors. Grow it alone, at the edge or in a pot.
fennel,carrot|Fennel crosses with carrot-family neighbors and stunts them.
fennel,cilantro|Fennel stunts cilantro and other neighbors.
fennel,@bra|Fennel gives off compounds that stunt most neighbors. Grow it alone, at the edge or in a pot.
dill,carrot|Dill, carrots and fennel are cousins; mature dill stunts carrots and they can cross.
%allium,%legume|Onions, garlic and leeks stunt beans and peas (widely reported).
polebean,beet|Beets and pole beans stunt each other (traditional advice).
polebean,sunflower|Sunflower roots can stunt pole beans.
cucumber,sage|Sage is said to hinder cucumbers.
celery,corn|They share corn earworm.
asparagus,%allium|Alliums compete with asparagus for the same shallow feeding zone.
grape,cabbage|Grapes and cabbage have an old rivalry in the garden lore.
rye,carrot|Rye residue stunts small-seeded crops for 2 to 4 weeks after you dig it in.
rye,lettuce|Rye residue stunts small-seeded crops for 2 to 4 weeks after you dig it in.
rye,spinach|Rye residue stunts small-seeded crops for 2 to 4 weeks after you dig it in.
blackwalnut,tomato|Black walnut roots give off juglone, which kills tomatoes. Its root zone reaches far beyond the canopy.|50
blackwalnut,potato|Black walnut juglone kills potatoes.|50
blackwalnut,eggplant|Black walnut juglone kills eggplant.|50
blackwalnut,pepper|Black walnut juglone harms peppers.|50
blackwalnut,asparagus|Black walnut juglone harms asparagus.|50
blackwalnut,cabbage|Black walnut juglone harms cabbage.|50
blackwalnut,blueberry|Black walnut juglone kills blueberries.|50
blackwalnut,apple|Black walnut juglone kills apple trees.|50
blackwalnut,pear|Black walnut juglone harms pears.|50
blackwalnut,peas|Black walnut juglone harms peas.|50
blackwalnut,strawberry|Black walnut juglone harms strawberries.|50
pecan,tomato|Pecan gives off a milder form of juglone; keep tomatoes outside the drip line.|25
pecan,potato|Pecan gives off a milder form of juglone; keep potatoes outside the drip line.|25
mint,parsley|Mint's runners crowd out parsley and its strong oils slow it down.
mint,chamomile|Mint runners smother chamomile. Keep mint in its own pot.
mint,lavender|Mint wants constant moisture and runs everywhere; lavender rots in wet soil.
mint,thyme|Mint will smother low, slow thyme.
mint,rosemary|Mint wants wet feet. Rosemary wants dry. One of them will lose.
fennel,basil|Fennel root exudates slow most neighbors. Give it its own pot or corner.
fennel,tarragon|Fennel is the loner of the herb garden and stunts nearby herbs.
fennel,chamomile|Fennel suppresses neighbors and is best grown by itself.
rosemary,basil|Rosemary wants lean dry gravel; basil wants rich moist soil. They struggle in one bed.|3
lavender,basil|Lavender wants lean dry alkaline soil; basil wants rich moist soil.|3
thyme,basil|Dry-loving thyme and thirsty basil rarely do well side by side.|3
anise,carrot|Anise and carrot are relatives that share carrot rust fly; old gardeners keep them apart.
hyssop,radish|Old herbals say hyssop and radish do not thrive together.
sage,basil|Dry-loving sage and thirsty basil are better in separate beds.|3
`;
/* USDA zones: [last spring frost day-of-year, first fall frost day-of-year] typical */
const ZONES = {
  '3a': [150, 245, -40], '3b': [140, 255, -35], '4a': [140, 258, -30], '4b': [132, 265, -25], '5a': [125, 272, -20], '5b': [117, 282, -15],
  '6a': [112, 288, -10], '6b': [105, 295, -5], '7a': [97, 302, 0], '7b': [90, 310, 5], '8a': [80, 320, 10], '8b': [68, 332, 15],
  '9a': [55, 342, 20], '9b': [40, 352, 25], '10a': [20, 360, 30], '10b': [1, 365, 35], '11a': [1, 365, 40]
};
const SOILS = {
  loam: { n: 'Loam (balanced)', f: 1, d: 'Crumbles, holds a squeezed shape and breaks apart when poked. The goal soil. Keep it fed with compost.' },
  sand: { n: 'Sandy', f: 1.4, d: 'Drains fast, warms early, loses nutrients and water quickly. Add compost every year, mulch deep, water little and often, feed lightly and more often.' },
  clay: { n: 'Clay', f: .75, d: 'Sticky, slow to drain and warm, holds nutrients. Never work it wet. Build raised beds, add compost and coarse organic matter, grow cover crops, water slowly and less often.' },
  silt: { n: 'Silty', f: .9, d: 'Smooth and soapy, holds water and nutrients well but crusts and compacts. Add compost, avoid walking on beds.' },
  raised: { n: 'Raised bed mix', f: 1.2, d: 'Fluffy, drains fast and dries out quickly, especially at the edges. Top up compost yearly and mulch.' },
  rocky: { n: 'Rocky or shallow', f: 1.3, d: 'Dries fast and limits root crops. Grow in raised beds or pick shallow-rooted crops; remove stones from carrot and parsnip rows.' }
};
/* soil amendments: id|name|gives|rate per 100 sq ft|unit|notes */
const AMEND = {
  compost: ['Compost', 'Slow, balanced food plus structure and life', 'Work in 1 to 2 inches before planting (8 to 17 cu ft per 100 sq ft)', 'cu ft'],
  manure: ['Aged manure', 'Nitrogen, phosphorus, potassium and organic matter', '1 inch (8 cu ft per 100 sq ft), aged at least a year or composted. Never fresh near crops.', 'cu ft'],
  bonemeal: ['Bone meal', 'Phosphorus and calcium for roots, bulbs and fruit', '3 lb per 100 sq ft at planting', 'lb'],
  blood: ['Blood meal', 'Quick nitrogen (12-0-0) for leafy crops', '1 to 2 lb per 100 sq ft as a side-dress; keep off stems', 'lb'],
  feather: ['Feather meal', 'Slow nitrogen (12-0-0)', '2 lb per 100 sq ft; lasts about 4 months', 'lb'],
  alfalfa: ['Alfalfa meal', 'Nitrogen with growth stimulants and trace minerals', '5 lb per 100 sq ft in spring', 'lb'],
  fish: ['Fish emulsion', 'Fast nitrogen for leaf growth', '2 Tbsp per gallon of water, every 2 weeks as a drench', 'gal'],
  kelp: ['Kelp meal or liquid', 'Potassium and trace minerals, helps stress tolerance', '1 lb per 100 sq ft, or liquid kelp monthly', 'lb'],
  ash: ['Wood ash', 'Potassium and lime (raises pH)', 'No more than 2 to 5 lb per 100 sq ft per year, never on potatoes or acid lovers', 'lb'],
  epsom: ['Epsom salt', 'Magnesium and sulfur', '1 Tbsp per gallon as a foliar spray or soil drench at first bloom', 'tbsp'],
  gypsum: ['Gypsum', 'Calcium without changing pH; loosens clay', '2 to 4 lb per 100 sq ft', 'lb'],
  lime: ['Garden lime', 'Raises pH and adds calcium', 'Only by soil test: 5 to 10 lb per 100 sq ft raises loam about 0.5 pH', 'lb'],
  sulfur: ['Elemental sulfur', 'Lowers pH for acid-loving plants', 'About 1 lb per 100 sq ft lowers loam roughly 1 pH point; retest after 3 months', 'lb'],
  greensand: ['Greensand', 'Slow potassium and iron', '5 to 10 lb per 100 sq ft', 'lb'],
  eggshell: ['Crushed eggshell', 'Slow calcium', 'Crush very fine and mix into planting holes before planting', 'cup']
};
/* nutrient advice rules: tokens|frequency (W weekly, M monthly, S once a season)|advice */
const NUTRI_TXT = `
tomato,pepper,hotpep,eggplant|S|At planting, add a handful of bone meal and 1 inch of compost per plant. Crushed eggshell or gypsum in the hole helps prevent blossom end rot.
tomato,pepper,hotpep,eggplant|M|Once flowers set, switch from nitrogen to potash and phosphorus: kelp or a low-nitrogen vegetable feed. Too much nitrogen means leaves and no fruit.
tomato,pepper|S|At first bloom, 1 Tbsp Epsom salt per gallon of water, one time, as a spray.
tomato,pepper,hotpep,eggplant,cucumber,zucchini,winsq,pumpkin,melon,cantaloupe|W|Deep, even watering. Swings in moisture cause blossom end rot and cracks, which no fertilizer fixes.
corn|S|Heavy nitrogen feeder: work in compost or aged manure before planting, then side-dress with blood meal or compost when plants are knee-high.
corn|M|Feed again at tasseling with fish emulsion.
potato|S|Light on nitrogen. Plant in compost-enriched soil and never add lime or wood ash; scab loves alkaline soil. Hill with soil or straw.
potato|M|Side-dress with compost at the first hilling. Stop feeding once flowers open.
sweetpot|S|Too much nitrogen makes vines instead of roots. Compost only, plus wood ash lightly for potassium.
@cuc|S|Heavy feeders. Plant on a compost-rich mound with aged manure underneath.
@cuc|M|Fish emulsion or compost tea every 2 weeks from the first flower, and extra potassium (kelp) as fruit sets.
@bra|S|Heavy nitrogen feeders. Work in compost plus blood meal or alfalfa meal. Keep pH near 6.5 to 7 with a little lime.
@bra|M|Side-dress with compost or fish emulsion every 3 to 4 weeks. Broccoli and cauliflower need boron: seaweed or kelp covers it.
lettuce,spinach,chard,arugula,bokchoy|M|Light feed of fish emulsion every 2 to 3 weeks keeps leaf growth tender. Do not overdo nitrogen in the last week before harvest.
carrot,beet,parsnip,radish,turnip|S|Do not use fresh manure or high nitrogen; it forks roots. Compost only, plus bone meal for phosphorus. Beets want boron; kelp or a tiny pinch of borax per 100 sq ft helps (go light).
onion,leek,garlic|S|Onions are weak feeders in the top few inches. Give compost and bone meal before planting, and nitrogen early in growth only.
onion,leek|M|Fish emulsion every 3 weeks until bulbing begins. Stop when the necks soften.
garlic|S|Feed with blood meal or fish emulsion in early spring as shoots grow, and stop by late May so the bulbs can form.
bushbean,polebean,peas,fieldpea,clover,vetch|S|These fix nitrogen. Skip nitrogen fertilizer; add compost and a bit of bone meal or wood ash. Inoculate seed the first year in a new bed.
asparagus,rhubarb|S|Permanent beds: top-dress with 2 inches of compost or aged manure every spring and mulch.
strawberry|S|Feed after renovation (mowing) in summer with compost and a light fish emulsion. Avoid feeding in spring because it softens fruit.
raspberry,blackberry|S|Top-dress with compost or aged manure in early spring, mulch with straw or wood chips.
blueberry|S|Needs acid soil (pH 4.5 to 5.5): sulfur as needed by soil test, pine needle or bark mulch, ammonium-type or cottonseed meal feeds. No lime, no wood ash, no manure.
grape|S|Light feeders. Compost in early spring; too much nitrogen means leaves and weak fruit. Potassium helps (kelp or greensand).
apple,pear,peach,plum,sweetcherry,tartcherry,apricot,fig,mulberry,persimmon,lemon,hazelnut,pecan,blackwalnut|S|Spread 2 to 4 inches of compost under the drip line in late winter, keeping it away from the trunk, and mulch. No nitrogen after July or new growth won't harden before frost.
lemon|M|Citrus are hungry. Feed with a citrus fertilizer or fish emulsion every 6 weeks from spring to late summer, plus iron if leaves yellow with green veins.
rose|S|Alfalfa meal, compost and bone meal in spring; a handful of Epsom salt per plant improves canes.
basil,parsley,cilantro,dill|M|Pinch often, feed lightly with fish emulsion monthly. Overfeeding dilutes flavor.
thyme,oregano,rosemary,sage,lavender|S|Lean soil makes the strongest oils. Skip fertilizer; add a little sand or gravel if soil is heavy.
mint,lemonbalm,comfrey|M|Greedy growers. Cut comfrey and mint hard for mulch and compost-tea material.
marigold,zinnia,cosmos,calendula,nasturtium,alyssum|S|Poor soil gives the best bloom. Too much nitrogen means leaves only.
sunflower|S|Heavy feeder with deep roots. Compost and wood ash for potassium.
okra|M|Warm-weather feeder. Compost at planting and a light side-dress after the first harvest.
celery|M|Heavy feeder and drinker. Fish emulsion every 2 weeks and constant moisture.
rye,oats,buckwheat,daikon|S|Cover crops: cut or till under 3 to 4 weeks before planting; they feed the soil as they rot.
rosemary,thyme,oregano,sage,lavender,tarragon,marjoram,hyssop,wintersavory|S|Lean-soil herbs: skip rich compost and nitrogen. Mix in a few handfuls of coarse sand or grit for drainage, and a little lime if your soil is acid. Rich soil gives leafy plants with weak flavor.
basil,thaibasil,tulsi,perilla,parsley,cilantro,chervil|M|Leafy herbs: a half-strength fish emulsion or compost tea every 2 to 3 weeks after each big cutting keeps leaves coming.
mint,peppermint,spearmint,lemonbalm,catnip,nettle|M|Hungry runners: compost on top each spring and a feed of liquid seaweed once a month in summer. Keep roots contained.
echinacea,yarrow,chamomile,calendula,hyssop,anisehyssop,beebalm|S|Flowering herbs: very little feeding. A thin compost top-dress in spring is enough; more nitrogen means leaves and few flowers.
ginger,turmeric,galangal,lemongrass|M|Tropical herbs: rich soil, mulch, and compost tea every 2 weeks while growing. Stop feeding when the leaves begin to yellow for the dry season.
goldenseal,ginseng,sweetwoodruff|S|Woodland herbs: leaf mold or well-rotted leaves as a yearly top-dress. Never fertilize with strong nitrogen.
`;
/* old-timer wisdom: title|tag|text */
const WISDOM_TXT = `
The Three Sisters|Planting|Plant corn first. When it is a hand high, plant pole beans around it, then squash or pumpkins between the mounds. Corn is the pole, beans feed nitrogen, squash shades weeds and holds moisture. An old Native American method, adopted by many farm families.
Feed the soil, not the plant|Soil|Farmers who built soil with manure, compost and cover crops said the best fertilizer is a rotting leaf. Healthy soil feeds the plants, grows less disease and holds more water.
Rotate in four|Rotation|A classic farm rotation: leafy crops, then fruiting crops, then roots, then legumes, never the same family in the same bed two years running. It cuts disease and pest carryover and spreads nutrient demand.
Age your manure|Compost|Never put fresh manure on a growing bed. Let it age a year, or compost it hot. Food-safety guidance says to wait 90 days before harvest for crops that do not touch soil and 120 days for crops that do.
Build a hot pile|Compost|Two parts brown (leaves, straw) to one part green (kitchen scraps, grass, manure). Keep it as damp as a wrung-out sponge. Turn it when it heats past 130 F. A pile that stays hot for a few days kills most weed seeds.
Weed and nettle tea|Compost|Fill a barrel a third full of comfrey, nettle or weeds, top with water, cover and stir daily. After 2 to 3 weeks dilute 1 to 10 and water the roots. It is free liquid fertilizer, and it smells like it.
Plant by the soil, not the calendar|Planting|Old rule: the ground tells you. Peas go in at 40 F, spinach at 40 F, potatoes at 45, carrots at 50, beans and squash at 60, tomatoes and peppers at 60 to 65, melons at 70. Push a thermometer 4 inches down at 9 a.m.
Oak leaves like squirrel's ears|Signs|Plant corn when oak leaves are as big as a squirrel's ear. Plant peas when dandelions bloom, beans and cucumbers when lilacs bloom, and squash when apple blossoms fall. Nature's calendar follows the actual weather of your year.
Good Friday potatoes|Planting|Many farm families planted potatoes on Good Friday or St Patrick's Day. The real reason is the soil: it is just warming to 45 F and workable. In your area check your soil, not the date.
Moon planting|Signs|The traditional almanac advice: sow above-ground crops (leaves, beans, tomatoes) while the moon waxes and root crops, bulbs and perennials while it wanes. There is no solid evidence, but it keeps you on a steady schedule, and many gardeners swear by it. Hortica shows the moon so you can follow it if you like.
Hand tests for soil|Soil|Squeeze a damp handful. Sand falls apart, clay forms a long ribbon, loam holds a shape and crumbles when poked. Worms in a spadeful (10 or more) mean a living soil. A jar test (soil, water, shake, wait a day) shows sand, silt and clay layers.
Deep mulch|Soil|Cover the soil with 6 to 12 inches of hay or straw. Weeds fade, soil stays damp and cool, worms move in, and the mulch rots into the soil. Many gardeners never till again. Keep mulch off stems.
Winter rye in the fall|Soil|Sow rye or oats on empty beds after the last crop. They hold the soil, crowd out weeds and feed it when turned under in spring. Wait 2 to 3 weeks before sowing small seeds after rye.
Save heirloom seed|Seeds|Open-pollinated varieties come true from seed. Pick the best fruit from the best plant and let it ripen fully. Beans, peas, tomatoes and lettuce are easiest. Dry seed well and store cool and dark in paper envelopes.
Sow in succession|Planting|Lettuce, radishes, beans and carrots do best sown every 2 weeks, so you harvest a little all the time instead of a glut. Stop sowing lettuce in summer heat and start again in late summer.
Harden off slowly|Planting|Take indoor seedlings outside for 1 hour and add an hour or two each day for 7 to 10 days. Skipping this is the surest way to lose transplants to sun and wind.
Water deep and early|Water|An inch a week is the rule of thumb, delivered in one or two deep soakings rather than daily sprinkles. Push a finger 2 inches into the soil; if it is dry, water. Morning is best because leaves dry before night and mildew has less of a chance.
Wood ash with care|Soil|Ash holds potassium and acts like lime. A light dusting once a year is plenty. Keep it off potatoes (scab), blueberries and acid lovers, and off wet leaves where it burns.
Keep records|Habit|Write down what you planted, when it was ready and how it did. A season in a notebook beats three seasons of memory. Hortica logs your planting dates for exactly this.
Walk it every day|Habit|The old saying is that the best fertilizer is the gardener's shadow. Ten minutes every morning catches pests, thirst and wilt before they become a loss.
Weed early, weed dry|Weeds|A weed seen is a weed pulled, and one year's seeding is seven years' weeding. Hoe on a sunny, dry morning so cut weeds wither. Never let weeds go to seed.
Root cellar basics|Storage|Roots keep at near-freezing (32 to 40 F) and high humidity (90 percent), in sand or damp sawdust. Apples give off ethylene gas that spoils potatoes, so store them apart. Onions and garlic want cool and dry. Winter squash wants 50 to 55 F.
Can it safely|Storage|High-acid foods (tomatoes with added acid, fruit, pickles) can go in a water bath. Beans, corn, carrots, meat and other low-acid foods need a pressure canner. Use tested recipes only, always.
Plant garlic in fall|Planting|Plant garlic cloves 4 to 6 weeks before the ground freezes, mulch deep, and harvest when the bottom three leaves turn brown the next summer. Save your best big heads for seed.
Prune in late winter|Orchard|The old orchardists pruned fruit trees while dormant in late winter, on dry days, cutting out dead, crossing and crowded wood so light reaches the middle of the tree. Skip pruning stone fruits in wet weather (disease).
Thin the fruit|Orchard|Pinch off extra fruit when it is marble-sized: leave one apple per cluster and a hand's width between peaches. Smaller crops every year beat big crops every other year.
Whitewash the trunks|Orchard|Brush young fruit trunks with diluted white latex paint in fall. It prevents winter sunscald and cracking and makes borers and rodents think twice.
Chickens and the garden|Animals|Run chickens over the beds in fall and they eat pests and weeds and add manure. Keep them out when crops are ripening. Composted chicken manure is hot; let it age.
Clear cold nights|Weather|A clear, still, dry evening after a warm day is when frost strikes. Cover tender plants with a sheet or row cover at dusk and water the soil first, since damp soil holds heat. Take off the cover once it warms in the morning.
Scarecrows are not enough|Animals|Birds and deer learn quickly. Move scare devices every few days, use netting on berries, and fences for deer and rabbits. The best deterrent is a fence.
Cold frames stretch the year|Season|A bottomless box with a window lid gives you spinach, lettuce and kale well into winter and gets spring crops going 4 to 6 weeks early. Vent it on sunny days.
Pick often|Harvest|Beans, cukes, zucchini and peas stop producing when fruit is left to ripen on the plant. Picking tells the plant to keep going. Harvest in the cool of morning for the best keeping.
`;
/* soil temperature chart: [crop, min F to sow, ideal F] */
const SOILTEMP = [['Peas', 40, 55], ['Spinach', 40, 55], ['Lettuce', 40, 60], ['Radish', 45, 60], ['Onion', 45, 65], ['Potato', 45, 60], ['Carrot', 50, 65], ['Beet', 50, 65], ['Cabbage family', 45, 65], ['Beans', 60, 75], ['Corn', 60, 70], ['Squash and cucumber', 65, 75], ['Tomato', 60, 70], ['Pepper', 65, 75], ['Eggplant', 65, 75], ['Melon', 70, 80], ['Okra', 70, 80], ['Sweet potato', 65, 80]];

const SEEDTYPES = [
  ['Heirloom', 'Open-pollinated varieties passed down for 50 years or more. They come true from saved seed and often have the best flavor, though yields and disease resistance vary.'],
  ['Open-pollinated (OP)', 'Pollinated naturally and true to type when you save seed. Heirlooms are OP, and so are many modern selections.'],
  ['Hybrid (F1)', 'A cross of two parent lines, often more uniform, productive and disease-resistant. Seed saved from them will not come true. Not the same as GMO.'],
  ['Organic seed', 'Grown without synthetic chemicals, and adapted to organic soils. Worth it for crops you will save and replant.'],
  ['Treated seed', 'Coated with a fungicide (usually pink or blue). Skip it if you grow organically; use untreated seed in cold, wet spring soil with a bit of patience.'],
  ['Pelleted and tape seed', 'Small seeds (carrot, lettuce) coated in clay for easy spacing. Keep damp until they sprout.']
];
const SEEDLIFE = [['Onion, parsnip, parsley, sweet corn', '1 year'], ['Pepper, leek, carrot, spinach, bean, pea', '2 to 3 years'], ['Tomato, lettuce, broccoli, kale, radish, beet', '3 to 4 years'], ['Cucumber, squash, melon, cabbage, turnip', '4 to 6 years']];
