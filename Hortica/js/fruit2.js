/* Hortica fruit2: more berries, cane fruit, tropical and melon fruits, plus cover crops and green manures. Same 19 pipe fields as PLANT_TXT in plants.js. */
const FRUIT2_TXT = `
alpinestrawberry|🍓|Alpine strawberry|f|ros|P|2|M|10|120|20|pe i-10 t0|5.5-6.8|3-9|8|d|Mignonette, Alexandria, Yellow Wonder, Reugen|Clump-forming strawberry with no runners that bears tiny, intensely sweet berries from early summer to frost. Tolerates part shade. Sow seed indoors early (it needs light to sprout) or divide clumps in spring.|Grow it as an edging along a path and pick a handful as you walk by.
dayneutralstrawberry|🍓|Day-neutral strawberry|f|ros|F|2|H|12|90|16|pe|5.5-6.8|4-9|10|d|Seascape, Albion, Tristar, Evie 2|Sets fruit in flushes from early summer to frost whatever the day length. Pinch the first flush of flowers for stronger plants, feed every few weeks and keep it evenly watered. Produces few runners, so plant closely and replace every 2 to 3 years.|Heavy feeders. Side-dress with compost after each flush.
junebearingstrawberry|🍓|June-bearing strawberry|f|ros|F|2|M|18|365|3|pe|5.5-6.8|3-8|8|d|Earliglow, Jewel, Allstar, Honeoye, Sparkle|One big crop over about 3 weeks in early summer. Pinch off all flowers the first year so runners root and the bed fills. After harvest mow or trim the leaves to 1 inch, thin runners and feed. Renovate yearly and renew the bed every 4 years.|Matted-row beds love a good renovation the day after the last berry.
blackraspberry|🫐|Black raspberry|f|ros|F|2|M|36|730|3|dm pe|5.8-6.5|4-8|60|d|Jewel, Bristol, Mac Black, Allen|Summer-bearing blackcap that tips over and roots at the cane tip. Pinch new canes at 30 inches to force side branches, and remove the old fruited canes after harvest. Keep at least 100 feet from wild brambles and never plant where nightshades grew.|Cut out fruited canes right after picking to slow disease.
goldenraspberry|🍓|Golden raspberry|f|ros|F|2|M|24|730|4|dm pe|5.6-6.5|3-9|60|d|Anne, Fallgold, Honeyqueen, Kiwigold|Yellow-fruited form of the red raspberry with a mild honey flavor. Everbearing types fruit on new canes in fall, so mow the whole patch in late winter for an easy single crop. Needs a trellis and well-drained soil.|Birds often overlook the pale fruit, which is a quiet bonus.
purpleraspberry|🍇|Purple raspberry|f|ros|F|2|M|36|730|3|dm pe|5.8-6.5|4-8|72|d|Brandywine, Royalty, Glencoe|A cross of red and black raspberry, vigorous and heavy-bearing with a rich tart flavor. Needs strong support and room, since canes grow tall and arching. Prune out old canes after fruiting and head back new ones in early spring.|Make jam with it, since it holds flavor better than red.
thornlessblackberry|🍇|Thornless blackberry|f|ros|F|2|M|60|730|5|dm pe|5.5-6.5|5-9|72|d|Triple Crown, Chester, Navaho, Apache, Ouachita|Semi-erect, spine-free canes that need a two-wire trellis. Tip new canes at 4 feet, then prune laterals in late winter. Remove canes that fruited after harvest. Mulch deeply, since roots are shallow and need steady water.|Choose Chester in cold places, since it is the hardiest thornless type.
boysenberry|🍇|Boysenberry|f|ros|F|2|M|72|730|4|dm pe|5.5-6.5|5-9|60|d|Thornless Boysen, Brazos, Lawrence|A large, sweet-tart trailing bramble related to blackberry and raspberry. Train canes along a trellis and tie them in. Cut out fruited canes after harvest. Needs winter protection in cold zones and good drainage.|Great in pies. Protect the canes with straw before hard freezes.
loganberry|🍇|Loganberry|f|ros|F|2|M|72|730|4|dm pe|5.5-6.5|6-9|60|d|LY 654, Thornless Logan|A tart, tangy red berry that is a natural cross of raspberry and blackberry. Train trailing canes on wires and tie in new canes each year while removing the old. Likes cool coastal summers.|Best cooked with sugar, since fresh it can be sharp.
tayberry|🍇|Tayberry|f|ros|F|2|M|72|730|3|dm pe|5.5-6.5|6-9|72|d|Medana, Buckingham|A sweet, aromatic cross of blackberry and raspberry with long, thorny canes. Train on wires, tie in new canes and cut out the old after fruiting. Handle the fragile fruit gently, as it does not travel.|Eat it fresh the day you pick. It does not keep.
blackcurrant|🫐|Blackcurrant|f|gro|P|2|M|60|730|3|dm pe|5.5-7.0|3-8|60|d|Ben Sarek, Consort, Titania, Ben Lomond|Rich in vitamin C and fruited on one-year wood. Plant deep, prune out the oldest third of stems each winter and mulch with compost. Some states restrict currants for white pine blister rust, so check local rules.|Plant a bit deeper than it grew in the pot to get more shoots.
whitecurrant|🍇|White currant|f|gro|P|2|M|48|730|3|dm pe|5.5-7.0|3-8|48|d|White Versailles, White Pearl, Blanka|A mild, sweet pale cousin of red currant that fruits on spurs of older wood. Keep an open vase shape with 8 to 10 main stems and prune in winter. Partial afternoon shade prevents sun scald. Check local rules, as currants may host white pine blister rust.|Hang the strings of fruit over a bowl to pick them whole.
redcurrant|🍒|Red currant|f|gro|P|2|M|48|730|3|dm pe|5.5-7.0|3-8|48|d|Jonkheer van Tets, Red Lake, Rovada, Wilder|Shiny, tart berries borne on spurs of older wood. Keep a mix of 1, 2 and 3 year stems and cut older wood out in winter. Grow in cool, moist, well-drained soil with afternoon shade in hot places. Check local rules, as currants may host white pine blister rust.|Jelly made with red currant sets itself, since the fruit is rich in pectin.
cranberry|🍒|Cranberry|f|eri|F|3|L|18|730|4|dm pe|4.0-5.5|2-7|6|d|Stevens, Pilgrim, Early Black, Ben Lear|A low evergreen vine for acid, moist, peaty soil. A bog is not required, just a bed lined to hold moisture, with sand and peat. Mulch with sand, keep weeds out and avoid rich fertilizer. Harvest in October when the berries are firm and deep red.|Do not feed with nitrogen. Lean soil makes the best fruit.
pineapple|🍍|Pineapple|f|bro|F|1|L|24|900|8|pe t+2|5.5-6.5|10-12|36|d|Smooth Cayenne, Sugarloaf, Red Spanish|Tropical plant started from the crown of a store pineapple or from a sucker. Root the crown in gritty mix, grow in a big pot in full sun and bring indoors below 50F. Takes about 2 years to fruit. Water the central cup lightly and the soil only when dry.|Pot it and wheel it out after the last frost. Ripe fruit smells sweet at the base.
groundcherry|🟡|Ground cherry|f|sol|F|2|M|24|75|8|i-6 t+2|6.0-7.0|4-9|30|u|Aunt Molly's, Cossack Pineapple, Goldie|Husk tomato that bears small golden berries in papery lanterns. Treat like a tomato, but no staking is needed. Fruit is ripe when it drops to the ground and the husk turns tan. Reseeds freely.|Lay a sheet under it to catch the fallen fruit. It stores a month in the husk.
hardybanana|🍌|Hardy banana|f|mus|F|3|H|96|365|8|pe t+1|5.5-7.0|5-10|168|d|Basjoo, Dwarf Cavendish (zone 8 and up), Musa Siam Ruby|Musa basjoo is grown for its huge leaves and cold-hardy roots, though its fruit is inedible. For edible bananas in cooler climates, use a protected Dwarf Cavendish in a sunny spot. Mulch the crown deeply in winter. Feed heavily and water often in summer.|Wrap the trunk with straw and burlap in fall to carry it through winter.
tropicalbanana|🍌|Banana|f|mus|F|3|H|120|330|10|pe t+2|5.5-7.0|9-12|180|d|Dwarf Cavendish, Ice Cream, Lady Finger, Namwah, Ladyfinger|Fast-growing, heavy feeder needing 9 to 12 months of warmth to fruit. Keep to 2 or 3 stalks per clump by removing extra suckers, mulch deeply and water often. Cut the fruited stalk after harvest. In cold places, grow in a large pot and move indoors.|Hang the cut bunch in a cool shady spot to ripen.
dragonfruit|🐉|Dragon fruit|f|cac|F|1|L|60|365|6|pe t+2|6.0-7.0|10-11|96|d|Physical Graffiti, American Beauty, Vietnamese White, Sugar Dragon|Climbing cactus that needs a sturdy post or trellis. Cuttings root easily in gritty mix. Blooms are night-opening, so hand-pollinate for better fruit. Water moderately, protect from frost and keep from midday scorch in hot places.|Dry a cutting for a few days before sticking it in soil.
honeydew|🍈|Honeydew|f|cuc|F|2|M|36|95|3|i-3 t+2|6.0-6.8|-|12|u|Honey Orange, Venus, Earlidew, Tam Dew|Needs a long hot season with a lot of sun. Set out only when soil is warm, use black plastic and keep moisture even until fruit sets. Do not pick until the rind turns creamy and slightly sticky.|Unlike cantaloupe, ripe honeydew does not slip, so cut it from the vine.
citronmelon|🍉|Citron melon|f|cuc|F|2|M|48|100|4|d+2 i-3 t+2|6.0-6.8|-|12|u|Red-Seeded, Green-Seeded|Not sweet when raw. Grown for its firm white flesh that makes preserves and pickles. Vigorous vines need lots of room. Direct sow into warm soil after the last frost, and pick when the rind is fully mature.|The old pickled-rind recipe in many grandmothers' cookbooks.
charentais|🍈|Charentais melon|f|cuc|F|2|M|36|80|3|i-3 t+2|6.0-6.8|-|12|u|Charentais, Savor, Sivan|Small, intensely sweet, perfumed French cantaloupe that does well in short seasons. Use black plastic and row cover early. The ripe fruit slips from the vine and smells strongly sweet.|Smell it at the stem end. A rich sweet aroma means ripe.
casabamelon|🍈|Casaba melon|f|cuc|F|2|M|48|110|3|i-3 t+2|6.0-6.8|-|12|u|Golden Beauty, Santa Claus, Sungold|A winter melon with a wrinkled rind and no musky smell. Needs a long hot season. Harvest when the end opposite the stem yields slightly to the thumb. Stores for weeks after picking.|It keeps well, so you can harvest before the weather turns.
canarymelon|🍈|Canary melon|f|cuc|F|2|M|48|90|3|i-3 t+2|6.0-6.8|-|12|u|Juan Canary, Golden Honeymoon|Bright yellow, oval melon with sweet white flesh. Warm soil and steady water give the best fruit. Cut when the skin is waxy yellow and the blossom end gives. Stop watering heavily near ripening for better flavor.|Sets well even in a moderately warm summer.
pieldesapo|🍈|Piel de sapo melon|f|cuc|F|2|M|48|105|3|i-3 t+2|6.0-6.8|-|12|u|Piel de Sapo, Santa Claus|Spanish winter melon with a green, mottled rind and crisp, sweet pale flesh. Needs a long hot season, black plastic and steady water until fruit sizes up. Cut when the stem end smells sweet and the blossom end gives slightly. Stores for several weeks.|Harvest before the first cold nights and let it mellow indoors.
tamarillo|🍅|Tamarillo|f|sol|F|2|M|72|365|10|pe t+2|5.5-6.5|9-11|120|d|Red, Gold, Amber|Tree tomato bearing egg-shaped fruit in clusters in the second year. Frost tender and wind tender, so shelter it. Pinch young plants to branch and feed in spring. Grow in a large pot in cold regions and overwinter indoors.|Plant two or three for a better fruit set.
naranjilla|🍊|Naranjilla|f|sol|P|2|H|72|300|10|pe t+2|5.5-6.5|10-11|72|d|Quito Orange, Baquicha|Subtropical shrub from the Andes with fuzzy leaves and orange fruit that tastes of citrus and rhubarb. Needs part shade, rich moist soil, shelter from wind and warm frost-free conditions. Spines on the leaves and stems, so wear gloves.|Rub the fuzz off the ripe fruit and juice it, since the skin is bitter.
capegooseberry|🟡|Cape gooseberry|f|sol|F|2|M|36|75|8|i-6 t+2|6.0-7.0|8-11|36|u|Goldie, Giant Poha Berry, Cossack Pineapple|Also called golden berry or poha. Grown like a tomato as a tender annual. Fruit sweetens in a papery husk and falls when ripe. Easy from seed indoors, and does well in a large pot.|Leave the husk on for storage. The berry keeps a month or more.
pepino|🍈|Pepino melon|f|sol|F|2|M|36|120|8|i-8 t+2|6.0-7.0|9-11|36|d|Colossal, Miski, Golden Beauty|Sweet, melon-flavored fruit on a nightshade shrub. Start from cuttings or seed and grow like a tomato, with cages or stakes. Frost tender, so overwinter cuttings indoors. Sets fruit best at night temperatures of 65 to 75F.|Cuttings from a mother plant root easily in water and carry on year to year.
miraclefruit|🍒|Miracle fruit|f|sap|P|2|M|36|730|6|pe t+2|4.5-5.8|10-12|72|d|Common|Slow-growing tropical shrub whose red berry makes sour foods taste sweet for about an hour. Needs acidic soil, warmth and humidity, so grow in a pot in cool areas and bring indoors below 50F. Water with rainwater where tap water is alkaline.|Pot with acidic peat mix and use rainwater, since it dislikes hard water.
sugarcane|🎋|Sugarcane|f|gra|F|3|H|36|300|8|pe t+2|6.0-7.5|8-11|144|d|Louisiana Ribbon, Georgia Red, Black Cane|Tall tropical grass planted from stalk sections laid in a trench. Needs rich soil, plenty of water and heat, and 8 to 12 months to mature. Cut stalks at ground level and strip the leaves. Fine for chewing or pressing for juice.|Plant billets with two nodes each and cover with 2 inches of soil.
jaboticaba|🍇|Jaboticaba|f|myr|P|2|M|180|2400|4|pe t+2|5.5-6.5|9-11|240|d|Sabara, Red Hybrid, Paulista|Brazilian tree whose purple, grape-like fruit grows directly on the trunk. Slow, taking years to bear, so buy a grafted plant or large pot. Needs acid soil and regular water. Protect from frost and keep wet during bloom.|Grow in a big pot where winters freeze, and be patient.
strawberryguava|🍒|Strawberry guava|f|myr|F|2|M|120|730|8|pe t+2|5.0-7.0|9-11|180|d|Red Cattley, Yellow Cattley, Lemon Guava|Small evergreen tree or shrub with glossy leaves and sweet, red or yellow fruit. Thrives in warm, humid weather and tolerates light frost once established. Prune to shape after fruiting. Can seed itself in warm wet areas, so check local invasiveness.|Shape as a hedge, since it takes pruning well.
mousemelon|🥒|Mouse melon|f|cuc|F|2|L|18|70|8|i-3 t+2 d+2|6.0-7.0|-|72|u|Mexican Sour Gherkin, Cucamelon|Tiny grape-sized fruit that taste like cucumber with lime. Climbs on a trellis and bears heavily. Plant out after frost, keep evenly moist and pick often. Disease and pest problems are rare.|The tubers can be dug and stored like dahlias for the next year.
kiwano|🥒|Horned melon|f|cuc|F|2|M|48|100|6|i-4 t+2|6.0-7.0|-|96|u|Jelly Melon, African Horned|Spiny orange fruit with green jelly pulp tasting of cucumber and lime. Needs a long warm season and a trellis. Direct sowing is unreliable, so start indoors. Pick when the skin turns fully orange.|Stores for months once fully orange.
crimsonclover|☘️|Crimson clover|c|leg|F|2|N|3|180|0|d-4 f8|6.0-7.0|-|18|d|Dixie, Kentucky Pride, Contea|Sow in late summer to early fall at least 6 weeks before first frost for a winter cover or in early spring for a spring cover. Fixes nitrogen and gives brilliant red flowers that bees love. Terminate by mowing at full bloom, then lay as mulch or dig in 2 weeks before planting.|Mow when the first flower heads show crimson and before seed set.
berseemclover|☘️|Berseem clover|c|leg|F|3|N|3|60|0|d-3 d+1 f8|6.0-7.5|-|24|d|Bigbee, Multicut, Frosty|Fast annual legume that fixes lots of nitrogen but is not frost-hardy. Sow in spring or late summer. Tolerates wet soil and heat. Mow at flowering and incorporate or leave as mulch. Winterkills in cold zones, so no tillage is needed.|Use it as a short summer smother crop between spring and fall plantings.
sweetclover|☘️|Sweet clover|c|leg|F|1|N|3|120|0|d-4 f8|6.0-8.0|3-9|60|d|White Blossom, Yellow Blossom|Deep-rooted biennial legume that breaks up compacted soil and fixes nitrogen. Sow in early spring or late summer. Mow before it sets seed in the second year, or dig in at bud stage. Do not let it go to seed, as it can spread.|The deep taproot opens hardpan like a subsoiler.
alfalfa|🌿|Alfalfa|c|leg|F|2|N|3|90|0|d-4 f8|6.5-7.5|3-9|36|d|Vernal, Ranger, Cimarron|Deep-rooted perennial legume used as a green manure, mulch source and bee plant. Needs well-drained, neutral soil. Sow in spring or late summer and mow at bud, using clippings as mulch. Terminate by tilling or smothering the sod in a year or two.|Alfalfa clippings make a rich nitrogen mulch for hungry crops.
annualryegrass|🌱|Annual ryegrass|c|gra|F|2|L|2|60|0|d-5 f8|5.5-7.5|-|24|d|Gulf, Marshall, Winter Express|Fast-sprouting grass that suppresses weeds and relieves compaction with fibrous roots. Sow in early spring or fall. Winterkills in cold zones, though in mild areas mow it before heading and incorporate 3 weeks before planting.|Sow after the last harvest and let winter finish it.
phacelia|💜|Phacelia|c|bor|F|2|L|4|50|0|d-4 d+0 f8|6.0-7.5|-|30|d|Lacy phacelia, Purple Tansy|Quick-growing cover with lavender flowers that bees love, giving soft green mulch. Sow in spring, summer or early fall. Winterkills in heavy frost. Chop at flowering and leave on top or dig under before seed set.|Plant it by the hive. Honey bees work it hard.
mustardcover|🌼|Mustard cover crop|c|bra|F|2|L|2|60|0|d-4 f6|5.5-7.5|-|36|u|Caliente 199, Pacific Gold, Brown Mustard|Fast biofumigant cover. Sow in early spring or late summer. Chop and incorporate at early flower, then irrigate and cover with plastic for 2 weeks to release natural compounds that suppress soil pests. Wait 2 weeks before planting.|Wait two weeks after chopping or the residues can hurt seedlings.
oilseedradish|🥬|Oilseed radish|c|bra|F|2|L|4|60|0|d-4 f8|6.0-7.5|-|30|d|Daikon, Tillage Radish, Image|Big taproot breaks up compacted soil and scavenges nitrogen. Sow in late summer so it grows before frost, then it winterkills and rots by spring. It leaves open channels in the soil. Seed before flowering to prevent volunteers.|Sow about 6 weeks before first fall frost.
sunnhemp|🌿|Sunn hemp|c|leg|F|2|N|4|75|0|d+2|6.0-7.5|-|96|u|Tropic Sun, Common|Warm-season legume that grows up to 8 feet in a few months, fixing nitrogen and smothering weeds. Sow after the soil is warm. Mow at early flower for best results. Winterkills with frost. Seeds toxic, so keep from pets and children.|Crimp or mow at flowering for a thick, nitrogen-rich mulch.
cowpeacover|🌱|Cowpea cover crop|c|leg|F|1|N|4|70|0|d+2|5.5-7.0|-|24|d|Iron and Clay, Red Ripper, Black-eyed Pea, Cowpea|Heat- and drought-tolerant legume for summer. Sow after the soil warms in late spring. Fixes nitrogen, shades weeds and feeds pollinators. Mow or roll at bloom and let winter finish it off.|Sow in the gap between spring and fall crops.
sudangrass|🌾|Sudangrass|c|gra|F|2|L|2|60|0|d+2|5.5-7.5|-|96|u|Piper, Sweet Sudan|Tall summer grass that smothers weeds and builds organic matter with deep fibrous roots. Sow after soil warms in late spring. Mow at 3 to 4 feet to force more tillering, then incorporate or let winter terminate it.|Mow it twice for the most root mass.
sorghumsudan|🌾|Sorghum sudan|c|gra|F|2|L|2|65|0|d+2|5.5-7.5|-|120|u|Hybrid Sudex, Sweet Six|A very tall, rapid cover from the cross of sorghum and sudangrass for summer weed suppression. Direct sow in warm soil. Cut or mow at 4 to 5 feet and let the residue lie as mulch. Stand dies with frost.|Cut it before seed heads form so it does not volunteer.
favacover|🌱|Faba bean cover|c|leg|F|2|N|4|90|0|d-6 f8|6.0-7.5|-|48|d|Banner, Windsor, Fava|Cool-season legume that fixes nitrogen and loosens soil with its roots. Sow in early spring or in fall in mild areas, 2 inches deep. Terminate by chopping at 10 percent bloom and digging in or laying as mulch. Edible beans if left.|Chop at early flower for the most nitrogen.
triticale|🌾|Triticale|c|gra|F|2|L|2|240|0|f6|5.5-7.5|3-9|60|d|Trical 336, Fridge|Wheat and rye hybrid cover crop with strong weed suppression. Sow in fall about 6 weeks before first frost. Terminate in spring by mowing or rolling at flowering, then wait 2 weeks before planting.|Less aggressive than rye, so easier to manage in spring.
winterwheat|🌾|Winter wheat cover|c|gra|F|2|L|2|240|0|f6|6.0-7.5|3-9|48|d|Hard Red Winter, Soft Red Winter|A good fall cover that holds soil through winter and is easier to kill than rye. Sow 4 to 6 weeks before first fall frost. Mow or till in spring before it heads. Wait 2 weeks before planting small seeds.|Sow it as a nurse crop under a clover seeding.
barley|🌾|Barley cover|c|gra|F|2|L|2|90|0|d-4 f6|6.0-8.5|-|36|d|Hulless, Robust, Common|Fast-growing grass that suppresses weeds and tolerates dry, even salty, soils. Sow in early spring or fall. Winterkills in cold zones, or mow before heading in spring. Not for acid soil.|A good weed-suppressing nurse crop for spring clover.
flaxcover|🌿|Flax cover crop|c|lin|F|1|L|3|100|0|d-4|6.0-7.5|-|36|u|Linum, Brown flax|Cool-season cover with sky-blue flowers that bees visit. Sow in early spring. Thin canopy lets weeds in, so sow thick. Terminate by mowing at flowering and incorporating or leaving as mulch.|Pretty enough for the flower garden as well.
teff|🌾|Teff|c|gra|F|2|L|3|60|0|d+3|5.5-7.5|-|36|u|Tef, Dessie, Corvallis|Quick, warm-season annual grass with tiny seeds. Sow on a firm, level bed after the soil is warm. Mow at heading before seed set. Dies with frost, leaving a fine mulch.|Barely cover the seed. It is that small.
sunflowercover|🌻|Sunflower cover crop|c|ast|F|2|L|8|70|0|d+1|6.0-7.5|-|72|u|Black Oil, Peredovik, Mammoth|Tall summer cover that scavenges phosphorus, feeds bees and produces thick stalks. Direct sow after the last frost. Chop before seed set at early bloom, though stalks decompose slowly. Do not follow with potatoes.|Let a patch go to seed for the birds.
subclover|☘️|Subterranean clover|c|leg|F|1|N|3|180|0|d-4 f8|5.5-7.0|7-10|8|d|Mt. Barker, Woogenellup|Low-growing legume for orchards and paths that fixes nitrogen and resists mowing. Sow in fall in mild climates. Drought tolerant and a good living mulch, though it dies back in summer heat. Mow to terminate.|Self-seeds, so it returns each fall with little work.
`;
const FRUIT2_GOOD_TXT = `
alpinestrawberry,chives|Chive scent deters aphids and the allium roots keep soil lively below the strawberry crowns.
alpinestrawberry,thyme|Low thyme makes a fragrant ground cover that suits alpine strawberries and draws pollinators.
alpinestrawberry,borage|Borage brings bees that set more strawberry fruit.
dayneutralstrawberry,borage|Borage is the classic strawberry partner, drawing bees and said to improve flavor.
dayneutralstrawberry,garlic|Garlic around the bed helps deter slugs, aphids and spider mites.
junebearingstrawberry,%allium|Alliums discourage many berry pests with their scent.
junebearingstrawberry,spinach|Spinach fills the space between rows and is cut before berries need the room.
junebearingstrawberry,lettuce|Shallow lettuce tucks between plants and is picked before the strawberries need the room.
blackraspberry,garlic|Garlic near brambles is an old way to deter Japanese beetles and keep the patch clean.
blackraspberry,chives|Chives help ward off aphids around cane fruit.
goldenraspberry,tansy|Tansy is said to deter Japanese beetles and ants around bramble canes.
goldenraspberry,garlic|Garlic cloves around the base help deter pests from cane fruit.
thornlessblackberry,tansy|Tansy is traditionally planted to repel beetles from brambles.
thornlessblackberry,clover|Clover underneath feeds soil nitrogen and its flowers attract pollinators.
blackcurrant,chives|Chives reduce aphid pressure on currants.
blackcurrant,garlic|Garlic and chives around currants deter aphids and are said to lessen mildew.
redcurrant,%allium|Alliums near currants help keep aphids down.
whitecurrant,clover|A living clover mulch feeds currants and holds moisture in the shallow root zone.
cranberry,blueberry|Both thrive in acid, moist, low-nutrient soil and share the same needs.
cranberry,lingonberry|Lingonberry and cranberry both want very acid, lean, moist soil.
tropicalbanana,sweetpot|Sweet potato makes a living mulch under bananas and shares the same warmth.
tropicalbanana,pineapple|Pineapple grows at the foot of banana and thrives in the same warm, mulched system.
hardybanana,sweetpot|A sweet potato ground cover shades the soil beneath banana clumps.
dragonfruit,pineapple|Both want heat, drainage and sun, and they share the same sandy bed.
groundcherry,basil|Basil near ground cherry confuses pests, as it does with tomatoes.
groundcherry,marigold|French marigolds help hold nematodes down for nightshade crops.
capegooseberry,basil|Basil aroma helps confuse the whitefly and hornworm that attack nightshades.
tamarillo,basil|Basil near tamarillo helps ward off whitefly and aphids.
pepino,marigold|Marigolds help ward off soil nematodes in nightshade beds.
honeydew,nasturtium|Nasturtium repels cucumber beetles and draws aphids away from melons.
honeydew,corn|Tall corn gives wind shelter and light shade to young melon vines.
charentais,radish|Radishes sown at the base are said to deter cucumber beetles.
casabamelon,nasturtium|Nasturtium is a trap crop for melon aphids and beetles.
mousemelon,dill|Dill draws beneficial wasps that prey on cucumber pests.
kiwano,nasturtium|Nasturtium is a trap crop for aphids and beetles that bother vine melons.
crimsonclover,@bra|Crimson clover fixes nitrogen that hungry brassicas will use, and its flowers bring beneficial insects.
crimsonclover,corn|Clover undersown at the last cultivation fixes nitrogen for corn.
berseemclover,tomato|Berseem as a summer cover before or under tomatoes feeds nitrogen to the next crop.
sweetclover,@cuc|Mowed sweet clover mulch supplies nitrogen to hungry squash and melons.
alfalfa,@cuc|Alfalfa mulch gives vining crops nitrogen and holds moisture.
phacelia,@ros|Phacelia flowers bring the bees and hoverflies that pollinate berries and tree fruit.
phacelia,@sol|Phacelia flowers feed predatory insects that protect tomato-family crops.
oilseedradish,@sol|A radish cover before nightshades breaks compaction and scavenges nitrogen for them.
sunnhemp,@cuc|Sunn hemp chopped before cucurbits adds nitrogen and suppresses summer weeds.
cowpeacover,corn|Cowpea between corn rows fixes nitrogen and shades weeds in the Three Sisters spirit.
sudangrass,@bra|A summer sudangrass cover before fall brassicas leaves a weed-free, loosened bed.
favacover,@sol|Faba cover in cool weather adds nitrogen ahead of summer nightshades.
winterwheat,@cuc|Wheat mulch rolled over transplanted squash suppresses weeds and holds moisture.
barley,clover|Barley is a gentle nurse crop that shelters young clover through the first weeks.
flaxcover,@bra|Flax flowers feed beneficial insects that protect brassica crops.
teff,@sol|Teff cover mowed before nightshades go in leaves a fine mulch and a weed-free bed.
subclover,@ros|Subterranean clover makes a low living mulch under berries and orchards.
`;
const FRUIT2_BAD_TXT = `
alpinestrawberry,@sol|Tomato-family crops leave verticillium wilt in the soil, which strawberries catch easily.
dayneutralstrawberry,@sol|Verticillium wilt from nightshades persists and attacks strawberries.
junebearingstrawberry,@sol|Strawberries are very prone to verticillium wilt where nightshades grew.
junebearingstrawberry,@bra|Strawberries and brassicas inhibit each other (traditional advice).
dayneutralstrawberry,@bra|Brassicas and strawberries are poor neighbors by old gardener's rule.
blackraspberry,@sol|Brambles are very prone to verticillium wilt where nightshades grew.
blackraspberry,raspberry|Black raspberries catch viruses from red types, so keep them well apart.
purpleraspberry,@sol|Brambles are very prone to verticillium wilt where nightshades grew.
goldenraspberry,@sol|Brambles are very prone to verticillium wilt where nightshades grew.
thornlessblackberry,@sol|Brambles are very prone to verticillium wilt where nightshades grew.
boysenberry,@sol|Brambles pick up verticillium wilt from nightshade soil.
loganberry,@sol|Brambles pick up verticillium wilt from nightshade soil.
tayberry,@sol|Brambles pick up verticillium wilt from nightshade soil.
blackcurrant,blackwalnut|Black walnut roots release juglone that damages many fruit shrubs.
redcurrant,fennel|Fennel stunts most neighbors, so keep it away from berries.
cranberry,lavender|Lavender wants lean, alkaline, dry soil, the opposite of cranberry.
tropicalbanana,blackwalnut|Black walnut juglone harms bananas and other tender fruit.
groundcherry,potato|Nightshades share blight, verticillium and the Colorado potato beetle.
groundcherry,fennel|Fennel gives off compounds that stunt most neighbors.
capegooseberry,potato|Nightshades share blight and Colorado potato beetle, so keep potato away.
tamarillo,potato|Nightshades pass on blight and pests, so keep them apart.
pepino,potato|Nightshades share blight and Colorado potato beetle.
pepino,@bra|Brassicas compete hard with pepino for nutrients.
honeydew,potato|Potatoes and melons compete and share blight problems.
casabamelon,potato|Potato and melon vines share blight, so keep them apart.
canarymelon,potato|Potato and melon vines share blight, so keep them apart.
mousemelon,fennel|Fennel stunts nearby vegetables, including cucurbits.
crimsonclover,@leg|Legumes sown after clover or beside it share diseases, so rotate.
sunnhemp,peas|Sunn hemp and peas share some root diseases and compete for the same niche.
cowpeacover,bushbean|Cowpea and bean share root pests and diseases, so rotate between them.
sudangrass,@gra|Sudangrass releases compounds that can stunt small-seeded grass crops that follow too soon.
sorghumsudan,@bra|Sorghum-sudan residues release growth-inhibiting compounds, so wait 3 to 4 weeks before sowing brassicas.
sorghumsudan,lettuce|Sorghum-sudan residues can stunt small-seeded lettuce sown too soon after.
winterwheat,peas|Wheat residue can slow peas that follow too soon in cold, wet soil.
triticale,@sol|Triticale residue can tie up nitrogen and stunt tomato transplants set out too soon.
barley,potato|Barley residue can lock up nitrogen and leave scab-prone soil for potatoes.
alfalfa,@leg|Alfalfa shares root diseases and nematodes with other legumes, so rotate crops.
mustardcover,@bra|A mustard cover is a brassica and will carry clubroot and flea beetles to the next brassica crop.
oilseedradish,@bra|An oilseed radish cover carries clubroot and flea beetles to brassica crops that follow.
sweetclover,blueberry|Sweet clover wants alkaline soil and fixes nitrogen that acid-loving blueberries do not need.
flaxcover,@gra|Flax grows slowly and is easily overrun by a dense grass cover.
teff,fennel|Fennel stunts neighbors, and teff seedlings are too small to compete.
sunflowercover,potato|Sunflower roots give off compounds that stunt potatoes.
sunflowercover,@leg|Sunflower shades and out-competes young legume seedlings.
favacover,onion|Faba bean residue is a poor partner for onions by traditional advice.
subclover,@gra|Subterranean clover and grass compete for water when summer turns dry.
`;
