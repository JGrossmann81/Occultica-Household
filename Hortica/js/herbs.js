/* Hortica herb library: spices, seasonings, teas and traditional medicinal herbs. Same fields as plants.js.
   HERB_INFO: id|tags (cul culinary, spice, tea, med traditional medicinal, aro aromatic or craft, dye)|parts used|traditional uses|cautions */
const HERB_TXT = `
tarragon|🌿|French tarragon|h|ast|F|1|L|18|60|20|i-8 t0|6.5-7.5|4-8|24|u|French tarragon (cutting only), Russian (bland)|Buy French tarragon as a plant: it does not set viable seed. Needs sharp drainage; dies in wet winters. Divide every 3 years.|Cut stems back by half in midsummer to refresh the plant.
marjoram|🌿|Sweet marjoram|h|lam|F|1|L|8|70|12|i-8 t+1|6.5-7.5|-|12|u|Sweet marjoram, Pot marjoram|Sweeter and milder than oregano. Grown as an annual in cold zones. Slow to sprout; start early indoors.|Pick before flowering for the best flavor, and dry in bunches.
summersavory|🌿|Summer savory|h|lam|F|1|L|6|60|8|d0|6.0-7.0|-|12|u|Summer savory|Peppery bean herb. Direct sow after frost, thin to 6 inches. Pick before flowering.|The old cooks called it the bean herb: add it to the pot with green beans.
wintersavory|🌿|Winter savory|h|lam|F|1|L|12|90|20|i-8 t0|6.5-7.5|5-9|10|u|Winter savory|A hardy perennial edging herb with a stronger, peppery taste than summer savory. Cut back after flowering.|Good evergreen edging for a kitchen border.
chervil|🌿|Chervil|h|api|P|2|L|6|60|6|d-4 f8|6.0-7.0|-|18|u|Common chervil|A delicate anise-parsley herb. Bolts in heat, so sow in early spring and fall, in part shade. Sow where it will grow.|Sow every 3 weeks for steady pickings.
sorrel|🌿|Sorrel|h|pol|P|2|M|12|60|30|d-4 f8|5.5-6.5|3-9|18|d|French sorrel, Red-veined, Buckler leaf|Lemony perennial leaf green. Cut flower stalks to keep leaves tender. Divide every 3 to 4 years.|One of the first greens of spring, for soups and sauces.
lovage|🌿|Lovage|h|api|F|2|M|36|90|20|i-8 t0|6.0-7.0|4-8|72|d|Lovage|A giant celery-flavored perennial. Use leaves, stems and seed. Needs room and rich soil.|One plant is enough for a family. Use it in soups.
garlicchives|🌿|Garlic chives|h|all|F|2|L|8|90|30|d-4 t0|6.0-7.0|3-9|18|d|Chinese chives, Nira|Flat leaves with a mild garlic taste and white flowers late summer. Self-seeds freely; cut flowers if unwanted.|Cut to the ground in spring for fresh growth.
bay|🌿|Bay laurel|s|lau|F|1|L|96|730|52|pe|6.0-7.5|8-10|120|d|Laurus nobilis|Slow-growing evergreen for mild climates; grow in a pot elsewhere and bring in before hard frost. Pick leaves anytime.|Dry leaves flat under a weight for a month for the best flavor.
curryleaf|🌿|Curry leaf|s|rut|F|2|M|72|730|40|pe|5.5-7.0|9-11|120|d|Murraya koenigii|Tropical shrub for pots in cold climates. Pick leaves fresh and fry them in oil at the start of a dish.|Bring it indoors at 50 F.
lemongrass|🌿|Lemongrass|h|gra|F|2|M|24|100|20|i-8 t+2|6.0-7.5|9-11|48|u|West Indian lemongrass|A tender perennial grass. Start from a store stalk rooted in water. Harvest thick stalks at the base; overwinter indoors in cold zones.|Great in tea, soups and as a mosquito-friendly clump.
thaibasil|🌿|Thai basil|h|lam|F|2|M|12|60|10|i-6 t+2|6.0-7.0|-|24|u|Thai basil, Siam Queen|Sturdy anise-flavored basil for hot dishes. Pinch flowers to keep leaves coming.|Stands up to heat and cooking better than sweet basil.
tulsi|🌿|Holy basil (tulsi)|h|lam|F|2|L|12|70|12|i-6 t+2|6.0-7.5|-|24|u|Rama, Krishna, Vana|A sacred Indian basil, grown for tea. Warm-weather annual. Pinch to bush it out.|Harvest leaves and flowering tops in the morning.
perilla|🌿|Shiso (perilla)|h|lam|P|2|M|12|60|10|d+1|6.0-7.0|-|36|u|Green shiso, Red shiso|Japanese herb for sushi and pickles. Reseeds freely; sow in warm soil.|Pinch tips and use the leaves young.
epazote|🌿|Epazote|h|che|F|1|L|12|50|12|d+0|6.0-8.0|-|36|u|Epazote|Mexican herb for beans: it eases digestion of beans and adds a unique flavor. Self-seeds heavily.|Cut before the seeds mature or it will take over.
culantro|🌿|Culantro|h|api|P|3|M|6|90|10|i-6 t+2|6.0-7.0|-|12|u|Culantro|A shade-loving, stronger cousin of cilantro that handles heat, popular in Caribbean cooking.|Likes it moist and shady, like a woodland edge.
stevia|🌿|Stevia|h|ast|F|2|L|12|90|8|i-8 t+2|6.0-7.0|9-11|24|u|Stevia rebaudiana|A natural sweetener leaf. Grown as an annual. Pick before flowering when sweetest.|Dry the leaves and grind them for tea sweetening.
lemonverbena|🌿|Lemon verbena|h|ver|F|2|M|36|90|16|t+2|6.0-7.0|8-10|60|u|Lemon verbena|The strongest lemon scent of all herbs, for tea. Tender: pot it and bring it indoors in cold zones. Drops its leaves in winter.|Pinch back for a bushy plant.
anise|🌿|Anise|h|api|F|1|L|8|110|8|d0|6.0-7.5|-|24|u|Anise|Grown for licorice-flavored seed. Direct sow, as it dislikes transplanting. Needs a long warm season.|Cut the seed heads when they brown and dry them on a sheet.
caraway|🌿|Caraway|h|api|F|2|L|8|365|8|d-3 f8|6.0-7.5|3-7|24|u|Caraway|A biennial: leaves the first year, seed in the second. Sow in early spring or fall.|Harvest seed when it browns; shake it into a bag.
cumin|🌿|Cumin|h|api|F|1|L|6|110|6|d+1|6.0-8.0|-|18|u|Cumin|Needs 3 to 4 hot months to set seed. Easier in warm climates.|Sow where it will grow; it hates root disturbance.
fenugreek|🌿|Fenugreek|h|leg|F|2|N|4|100|8|d0|6.0-7.5|-|18|u|Fenugreek|A quick legume for seed and leaves (methi). Good cover crop too.|Pick leaves at 4 weeks for cooking; let some go to seed.
nigella|🌿|Nigella (black cumin)|h|ran|F|1|L|6|100|6|d-3|6.0-7.5|-|24|u|Nigella sativa|Black seed for breads and curries. Pretty blue flowers. Sow in place.|Seed pods look like little lanterns; pick when they brown.
mustard|🌿|Mustard (seed and greens)|h|bra|F|2|M|6|50|6|d-4 f8|6.0-7.5|-|36|u|Brown mustard, Yellow mustard, Southern Giant|Grow the leaves in cool weather or the seed for prepared mustard. Bolts quickly in heat.|Cut and thresh the pods when they are dry and tan.
horseradish|🌿|Horseradish|h|bra|F|2|M|18|240|40|d-4|6.0-7.5|3-9|36|d|Bohemian, Maliner Kren|Plant root pieces in early spring. Vigorous and hard to remove: contain it in a bed of its own. Dig roots after the first frost.|Grate with vinegar right away; it loses punch within minutes.
ginger|🌿|Ginger|h|zin|P|2|H|8|240|8|i-6 t+3|5.5-6.5|9-11|36|d|Culinary ginger|Sprout a piece of organic rhizome indoors, plant out in warm weather in rich, moist, shaded soil. Dig at 8 to 10 months before frost.|Harvest "baby ginger" at 4 months for a tender, mild root.
turmeric|🌿|Turmeric|h|zin|P|2|H|10|270|8|i-8 t+3|5.5-6.5|9-11|36|d|Turmeric|Tropical rhizome needing a long hot season. Sprout indoors; grow in rich soil in pots in cold zones. Dig after the leaves yellow.|Wear gloves: it stains everything.
galangal|🌿|Galangal|h|zin|P|3|H|12|300|8|i-8 t+3|5.5-6.5|9-11|48|d|Greater galangal|A Thai spice ginger relative. Same culture as ginger, but bigger.|Pot it and bring it inside in cool climates.
saffron|🌸|Saffron crocus|h|iri|F|1|L|4|365|3|dm|6.0-8.0|6-9|6|d|Crocus sativus|Plant corms in late summer; they flower in fall. Pick the three red stigmas by hand each morning. Needs sharp drainage.|About 150 flowers make a gram of saffron. Dry stigmas gently.
ajwain|🌿|Ajwain|h|api|F|1|L|6|130|6|d0|6.5-8.0|-|24|u|Ajwain (carom)|A thyme-flavored seed for Indian cooking. Warm-season annual.|Harvest seed heads when gray-brown.
anisehyssop|🌿|Anise hyssop|h|lam|F|1|L|15|90|20|d-4 t0|6.0-7.5|4-9|36|u|Agastache foeniculum|Licorice-scented leaves for tea and baking, with a purple flower spike that bees love.|Self-seeds gently and draws pollinators.
hyssop|🌿|Hyssop|h|lam|F|1|L|15|100|20|d-4 t0|6.5-7.5|4-9|24|u|Hyssop officinalis|A hardy, aromatic evergreen-ish perennial with blue flowers, used in tea and as a bee plant.|Cut back by a third after flowering.
pineapplesage|🌿|Pineapple sage|h|lam|F|2|M|36|100|16|t+2|6.0-7.0|8-10|48|u|Salvia elegans|Pineapple-scented leaves and edible scarlet flowers in fall. Tender in cold zones.|Take cuttings in late summer to carry it over winter.
scentedgeranium|🌿|Scented geranium|h|ger|F|1|L|12|90|20|t+2|6.0-7.0|10-11|24|u|Rose, Lemon, Mint, Nutmeg|Leaves flavor cakes, sugar and tea. Grow in pots and bring in before frost.|Lay a leaf in the bottom of a cake pan.
peppermint|🌿|Peppermint|h|lam|P|3|M|18|60|30|t-2|6.0-7.5|3-9|30|u|Black Mitcham, Chocolate mint|Strong menthol mint for tea. Spreads by runners: grow in a pot sunk in the ground.|Cut stems just above a leaf pair for repeated harvests.
spearmint|🌿|Spearmint|h|lam|P|3|M|18|60|30|t-2|6.0-7.5|3-9|30|u|Spearmint, Kentucky Colonel|Sweet mint for mint sauce, juleps and tea. Contain it.|Harvest before flowering and dry in bunches.
catnip|🌿|Catnip|h|lam|F|1|L|18|70|20|d-4 t0|6.0-7.5|3-9|36|u|Nepeta cataria|Cats love it, bees love it, and it makes a mild tea. Grow where cats will not flatten it, or fence the young plants.|Hang bunches to dry, and cats love dried sachets.
echinacea|🌸|Echinacea|h|ast|F|1|L|18|730|16|i-10 t0|6.0-7.5|3-9|36|d|Purple coneflower, Pale purple, Tennessee|Drought-tough perennial. Seed needs cold stratification (30 days in the fridge). Harvest roots at year 3 to 4 in the fall.|Leave the seed heads in winter for goldfinches.
feverfew|🌼|Feverfew|h|ast|F|2|L|10|90|16|d-4 t0|6.0-7.5|5-9|24|u|Feverfew|A daisy-like short-lived perennial that self-seeds. Leaves are bitter.|Pretty companion for roses and borders.
valerian|🌸|Valerian|h|val|P|2|M|24|730|16|d-4 t0|6.0-7.5|4-9|60|d|Valerian officinalis|A tall perennial; roots are dug in fall of the second year. The smell is strong.|Cats are drawn to it as well.
passionflower|🌺|Passionflower (maypop)|s|pas|F|2|M|72|365|20|t0|6.0-7.5|6-10|180|u|Passiflora incarnata|A vigorous native vine with spectacular flowers and edible fruit. Spreads by root suckers.|The hardiest passionflower and a fine pollinator plant.
skullcap|🌿|Skullcap|h|lam|P|2|M|12|120|12|d-4 t0|6.0-7.5|4-9|24|u|American skullcap|A small perennial with blue flowers for tea. Likes damp edges and part sun.|Harvest the aerial parts when in flower.
motherwort|🌿|Motherwort|h|lam|P|2|L|18|120|12|d-4 t0|6.0-7.5|3-9|48|u|Leonurus cardiaca|A tough perennial with prickly seed heads. Self-seeds freely.|Cut before seeds drop.
milkthistle|🌿|Milk thistle|h|ast|F|1|L|24|180|8|d-2|6.0-7.5|5-9|60|d|Silybum marianum|A big spiny annual or biennial grown for seed. Gloves needed. Can self-seed aggressively.|Cut the flower heads when the pappus appears and dry them in paper bags.
ashwagandha|🌿|Ashwagandha|h|sol|F|1|L|18|180|8|i-8 t+2|6.5-8.0|9-11|36|u|Withania somnifera|A warm-season Ayurvedic root crop. Grown as an annual; dig roots in fall. Needs well-drained soil.|It is related to tomato, so rotate with nightshades.
astragalus|🌿|Astragalus|h|leg|F|1|N|18|1095|12|d-6|6.0-7.5|4-9|48|d|Astragalus membranaceus|A slow perennial legume grown for its root, harvested at year 4 to 5. Seed needs scarification.|Rub seed on sandpaper before sowing.
marshmallow|🌸|Marshmallow root|h|mal|F|3|M|24|730|16|d-4 t0|6.0-7.5|3-9|60|d|Althaea officinalis|A tall moisture-lover with soft leaves and pale flowers. The root was the original marshmallow.|Dig roots in fall of year 2.
mullein|🌿|Mullein|h|scr|F|1|L|24|365|12|d-4|6.0-8.0|3-9|72|u|Verbascum thapsus|A tall biennial with a velvety rosette. Self-seeds into dry poor soil. Leaves are used for tea.|It chooses its own spot; let a few stay.
plantain|🌿|Plantain|h|pla|P|2|L|8|60|20|d-4|5.5-7.5|3-9|12|u|Broadleaf plantain|A common lawn weed with a long folk history as a poultice. Easy to grow and hard to kill.|Pick young leaves for the best texture.
dandelion|🌼|Dandelion|h|ast|F|2|L|10|60|20|d-4 f8|6.0-7.0|3-9|12|u|Improved Arack, French Dandelion|Greens in spring, roots in fall, flowers for wine. Plant a cultivated variety to enjoy it.|Dig roots in fall for roasting as a coffee substitute.
nettle|🌿|Stinging nettle|h|urt|P|3|H|18|60|20|d-4 t0|6.0-7.5|3-10|48|u|Urtica dioica|Rich in minerals. Wear gloves. Cut young tips in spring for soup and tea. Spreads by roots, so contain it.|Pick before flowering. Cooking or drying removes the sting.
selfheal|🌿|Self-heal|h|lam|P|2|L|8|90|20|d-4 t0|5.5-7.5|3-9|12|u|Prunella vulgaris|A low, creeping, violet-flowered plant used in old herbals. Works as a living mulch.|Spreads easily; keep it where you want it.
stjohnswort|🌼|St John's wort|h|hyp|F|1|L|18|180|10|d-4 t0|6.0-7.5|4-9|30|u|Hypericum perforatum|A sun-loving, drought-hardy perennial with yellow flowers. It is invasive in some regions and listed as a weed: check local rules.|Pick flower tops at midsummer.
hawthorn|🌳|Hawthorn|t|ros|F|2|L|180|1825|8|dm|6.0-7.5|4-8|240|d|Crataegus monogyna|A thorny small tree with a long folk use. Berries ripen in fall. Good hedge and bird tree.|Use gloves when pruning: thorns are long.
goldenseal|🌿|Goldenseal|h|ran|S|3|M|8|1095|8|dm|6.0-7.0|3-8|18|d|Hydrastis canadensis|A woodland plant, slow to grow and over-collected from the wild. Grow only from nursery stock in rich, damp shade.|Buy cultivated roots only.
ginseng|🌿|American ginseng|h|ara|S|2|L|6|2000|8|dm|5.0-6.0|3-8|18|d|Panax quinquefolius|A woodland root grown over 6 to 10 years in deep shade. Slow, valuable and regulated in many states: check rules before growing or selling.|Needs forest-like shade and patience.
eveningprimrose|🌼|Evening primrose|h|ona|F|1|L|12|365|8|d-4|6.0-7.5|4-8|48|u|Oenothera biennis|A biennial with yellow evening-opening flowers that moths love.|Seed is rich in oil; collect pods when brown.
chicory|🌼|Chicory|h|ast|F|1|L|12|120|16|d-4 f8|6.0-7.5|3-9|48|d|Witloof, Magdeburg|The blue flowers brighten roadsides. The root is roasted as a coffee extender and the leaves eaten.|Dig roots in fall and dry, then roast.
burdock|🌿|Burdock|h|ast|F|2|M|12|150|12|d-4|6.0-7.5|3-9|72|d|Gobo|A tall biennial with a deep root, eaten as gobo in Japan. Loosen the soil deeply; grow it in a tube or raised bed.|Dig carefully; the root is brittle.
redclover|🌸|Red clover|h|leg|F|2|N|8|90|16|d-4 f8|6.0-7.0|3-9|24|u|Medium red clover|A cover crop, bee plant and tea herb. Fixes nitrogen.|Cut flower heads in full bloom and dry them.
hops|🌿|Hops|s|can|F|2|H|36|365|16|pe|6.0-7.5|3-8|240|u|Cascade, Chinook, Golden|A fast vine for beer, tea and a classic sleep pillow. Needs a tall trellis. Plant rhizomes in early spring.|Cut the vine to the ground each fall.
sweetwoodruff|🌿|Sweet woodruff|h|rub|S|2|L|8|90|10|d-4 t0|5.5-7.0|4-8|8|u|Galium odoratum|A shady ground cover whose dried leaves smell of fresh hay and flavor May wine.|Dry the leaves before using; the scent develops as they wilt.
hibiscus|🌺|Roselle hibiscus|h|mal|F|2|M|36|150|8|i-6 t+2|6.0-7.0|9-11|72|u|Hibiscus sabdariffa|Red calyxes make a tart tea (agua de jamaica). Needs a long hot season.|Harvest the calyxes when swollen, before frost.
jiaogulan|🌿|Jiaogulan|h|cuc|P|2|M|18|120|20|t+2|6.0-7.0|7-10|120|u|Gynostemma pentaphyllum|A shade-tolerant climbing perennial for tea. Grows easily from cuttings.|Pinch to keep it bushy.
licorice|🌿|Licorice|h|leg|F|2|N|24|1095|16|d-4 t0|6.0-8.0|7-10|48|d|Glycyrrhiza glabra|A deep-rooted perennial legume. Roots dug in year 3 or later. Needs deep, loose, warm soil.|Provides the real licorice taste.
woodbetony|🌿|Wood betony|h|lam|P|2|L|12|120|12|d-4 t0|6.0-7.5|4-8|24|u|Stachys officinalis|A low purple-flowered mint relative used in tea for generations. Easy in borders.|Harvest the top third at flowering.
vervain|🌿|Blue vervain|h|ver|F|2|L|18|120|12|d-4 t0|6.0-7.5|3-8|48|u|Verbena hastata|A tall native with violet spikes, loved by bees and butterflies. Thrives in damp ground.|Cut stems at the start of flowering.
aloe|🌵|Aloe vera|h|asp|F|1|L|12|730|52|pe|6.0-8.0|10-11|24|u|Aloe vera|A tender succulent for pots. Keep dry in winter, bright and above 45 F. Break off outer leaves for the gel.|Water deeply but rarely.
elderflower|🌼|Elderflower|s|ado|F|2|M|72|730|3|dm|5.5-6.5|3-9|144|u|American elder, Black Lace|Fragrant flower heads for cordial and fritters in early summer. Same plant as elderberry; berries must be cooked.|Pick flowers on a dry, sunny morning.
perillared|🌿|Cinnamon basil|h|lam|F|2|M|12|60|10|i-6 t+2|6.0-7.0|-|24|u|Cinnamon basil|A basil with a cinnamon scent and pink flowers. Pinch tips often.|Lovely in tea and baked goods.
costmary|🌿|Costmary|h|ast|F|2|L|18|90|20|d-4 t0|6.0-7.5|4-9|48|u|Tanacetum balsamita|A minty-balsam perennial historically used as a bookmark in Bibles. Thrives in neglect.|Leaves scent linens and tea.
`;
const HERB_INFO_TXT = `
basil|cul,aro|Leaves|Pesto, tomato dishes, tea. Traditionally used for digestion.|Large medicinal amounts are not advised in pregnancy.
parsley|cul,med|Leaves, root|Garnish and sauces. Traditionally a diuretic and breath freshener.|Large medicinal amounts are best avoided in pregnancy.
cilantro|cul,spice|Leaves, seed (coriander)|Salsa, curries; coriander seed is a spice.|Some people find the leaves taste soapy (a genetic trait).
dill|cul,spice|Leaves, seed|Pickles, fish, potatoes. Seed for pickling and digestive teas.|None for normal food use.
chives|cul|Leaves, flowers|Garnish, eggs, potatoes. Flowers are edible.|None for normal food use.
thyme|cul,med,tea|Leaves|Meat, stews, beans. Traditional tea for coughs and throat.|None for normal food use.
oregano|cul,med|Leaves|Pizza, tomato dishes. A traditional kitchen antiseptic.|Strong oil is not for home use.
rosemary|cul,aro,med|Leaves, stems|Roasts, bread, grilled foods. Traditionally used for memory and circulation.|Large medicinal amounts are not advised in pregnancy.
sage|cul,med,tea|Leaves|Sausage, poultry stuffing. Traditional tea for sore throats.|Not for long-term or heavy use; avoid in pregnancy and breastfeeding.
mint|cul,tea,med|Leaves|Tea, sauces, desserts. Traditionally used for upset stomach.|Menthol can aggravate acid reflux.
lavender|cul,aro,tea|Flowers|Baking, tea, sachets, sleep pillows.|Culinary lavender only (English types); the oil is not for ingestion.
lemonbalm|tea,med,cul|Leaves|Calming tea. Traditionally used for tension and sleep, and for cold sores topically.|Can interact with thyroid and sedative medicines.
fennel|cul,spice,tea|Bulb, fronds, seed|Fish, sausage, digestive after-dinner seed.|Large amounts of seed tea are best avoided in pregnancy.
borage|cul,tea|Flowers, young leaves|Blue edible flowers for drinks and salads.|Leaves contain traces of alkaloids; do not use as a daily medicine.
comfrey|med,aro|Leaves, root (external)|Traditionally used as a poultice for bruises and sprains; also a prized compost and mulch plant.|Not for internal use: it contains liver-toxic alkaloids. Do not apply to broken skin.
chamomile|tea,med|Flowers|Calming bedtime tea. Traditionally used for digestion and sleep.|Allergy risk for people sensitive to ragweed or daisy family.
marigold|dye,aro,cul|Petals|Pest-repelling companion; petals add color to food.|Use edible types (Tagetes tenuifolia) for food.
calendula|med,tea,dye,cos|Flower petals|Salves for dry or chapped skin; petals color rice and butter. Traditionally used for minor skin irritation.|Allergy risk for people sensitive to ragweed or daisy family.
yarrow|med,tea|Flowering tops|Traditionally used as a wound herb and fever tea. Bee and beneficial insect plant.|Avoid in pregnancy; may cause skin sensitivity.
beebalm|tea,cul|Leaves, flowers|Tea (Oswego tea). Oregano-like flavor.|None for normal food use.
elderberry|med,cul|Cooked berries, flowers|Syrups and jams from ripe, cooked berries; flower cordial. Traditional winter-season syrup.|Raw berries, leaves, bark and stems are toxic; always cook the berries.
tarragon|cul|Leaves|Chicken, fish, béarnaise, vinegar.|None for normal food use.
marjoram|cul,tea|Leaves|Sausage, tomato dishes, Mediterranean blends.|None for normal food use.
summersavory|cul|Leaves|Green beans, lentils, meat rubs.|None for normal food use.
wintersavory|cul|Leaves|Meat, bean dishes.|None for normal food use.
chervil|cul|Leaves|French fines herbes, eggs, fish.|None for normal food use.
sorrel|cul|Leaves|Soups, sauces, salads with a lemony zing.|High in oxalic acid; limit if you form kidney stones.
lovage|cul,spice|Leaves, stems, seed|Soups, Bloody Marys; seed in breads.|Avoid in pregnancy in medicinal amounts.
garlicchives|cul|Leaves, flowers|Stir-fries, dumplings, eggs.|None for normal food use.
bay|cul|Leaves|Stews, beans, stocks. Remove before serving.|Leaves are stiff and should not be eaten whole.
curryleaf|cul|Leaves|South Indian tempering for dals and curries.|None for normal food use.
lemongrass|cul,tea|Stalks|Thai soups, curries, tea.|None for normal food use.
thaibasil|cul|Leaves|Pho, curries, stir-fries.|None for normal food use.
tulsi|tea,med,cul|Leaves, flowers|Tea, a revered Ayurvedic herb traditionally used for stress and respiratory comfort.|Talk to a clinician about use with blood-sugar or blood-thinning medicines.
perilla|cul|Leaves, seed|Sushi, pickles, wraps.|None for normal food use.
epazote|cul|Leaves|Beans, soups, quesadillas.|Strong; avoid in pregnancy in large amounts.
culantro|cul|Leaves|Caribbean sofrito, salsas.|None for normal food use.
stevia|cul|Leaves|Natural sweetener for tea.|None for normal food use.
lemonverbena|tea,cul|Leaves|Tea, desserts, syrups.|None for normal food use.
anise|spice,tea,cul|Seed|Baking, liqueurs, digestive seed tea.|None for normal food use.
caraway|spice,cul|Seed|Rye bread, sauerkraut, cabbage dishes.|None for normal food use.
cumin|spice|Seed|Chili, curries, tacos.|None for normal food use.
fenugreek|spice,cul,med|Seed, leaves|Curries (methi); seed traditionally used for lactation and digestion.|Avoid in pregnancy; can lower blood sugar.
nigella|spice|Seed|Breads, curries, pickles.|None for normal food use.
mustard|spice,cul|Seed, leaves|Prepared mustard, pickles, greens.|None for normal food use.
horseradish|spice,cul|Root|Sauces, roast beef.|Strong irritant when freshly grated.
ginger|spice,tea,med|Rhizome|Cooking and tea. Traditionally used for nausea and digestion.|May interact with blood-thinning medicines in large amounts.
turmeric|spice,med,dye|Rhizome|Curries, golden milk, a yellow dye. Traditionally a daily kitchen herb.|May interact with blood thinners and gallbladder disease.
galangal|spice|Rhizome|Thai soups and curries.|None for normal food use.
saffron|spice,dye|Stigmas|Paella, risotto, breads.|None for normal food use.
ajwain|spice,med|Seed|Indian breads and snacks; traditional digestive.|Avoid medicinal amounts in pregnancy.
anisehyssop|tea,cul|Leaves, flowers|Tea, baking, salads.|None for normal food use.
hyssop|tea,med,cul|Leaves, flowers|Tea; traditionally used for coughs.|Avoid in pregnancy and with seizure disorders.
pineapplesage|tea,cul|Leaves, flowers|Tea, fruit salads, drinks.|None for normal food use.
scentedgeranium|cul,aro|Leaves|Flavor for cakes, jellies and sugar.|Use only the edible scented types; do not eat garden geraniums (Pelargonium hortorum).
peppermint|tea,med,cul|Leaves|Tea, candy, desserts. Traditionally used for digestion and headaches.|Menthol can aggravate acid reflux; not for babies' faces.
spearmint|tea,cul|Leaves|Tea, sauces, salads, cocktails.|None for normal food use.
catnip|tea,med|Leaves|Mild tea traditionally used for restlessness and digestion; cat pleaser.|Avoid in pregnancy.
echinacea|med,tea|Root, flowers, leaves|Traditionally taken at the first sign of a winter cold.|Allergy risk for ragweed-sensitive people; talk to a clinician about autoimmune conditions.
feverfew|med,tea|Leaves|Traditionally used for headaches.|Avoid in pregnancy; allergy risk for daisy family; stopping suddenly can cause rebound headaches.
valerian|med,tea|Root|Traditionally used as a sleep aid.|Can interact with sedatives and alcohol; avoid in pregnancy.
passionflower|tea,med|Leaves, flowers|Traditionally used as a calming tea; the fruit is edible.|Avoid in pregnancy; can interact with sedatives.
skullcap|tea,med|Aerial parts|Traditionally used for tension and nervousness.|Buy plants labeled Scutellaria lateriflora; adulterated dried products have caused liver problems.
motherwort|tea,med|Aerial parts|Traditionally used for nervous heart flutters and women's wellness.|Avoid in pregnancy; can interact with heart medicines.
milkthistle|med,tea|Seed|Traditionally used to support the liver.|Allergy risk for ragweed-sensitive people.
ashwagandha|med|Root|Ayurvedic tonic, traditionally used for stress and vitality.|Avoid in pregnancy; talk to a clinician about thyroid or autoimmune conditions.
astragalus|med|Root|Traditional Chinese tonic, simmered in soups.|Talk to a clinician about autoimmune conditions and immunosuppressants.
marshmallow|med,tea|Root, leaf|Cold-water infusion traditionally used for dry coughs and sore throats.|Can slow the absorption of other medicines taken at the same time.
mullein|med,tea|Leaf, flower|Traditionally used in tea for coughs.|Strain the tea well; the fine hairs irritate the throat.
plantain|med|Leaves|Traditionally used as a fresh poultice for insect bites and minor cuts.|Do not use on deep wounds.
dandelion|cul,med,tea|Leaves, root, flowers|Spring greens, roasted root tea, flower wine. Traditionally used as a spring tonic.|Allergy risk for daisy family; talk to a clinician about water pills and gallstones.
nettle|cul,med,tea|Young tops, leaves, root|Soups, tea, compost activator. Traditionally a spring tonic.|Wear gloves for harvest; cook or dry to remove the sting.
selfheal|med,tea|Aerial parts|Traditionally used as a throat gargle and wound herb.|None known at normal use.
stjohnswort|med,tea,dye|Flowering tops|Traditionally used for low mood and as an infused oil for skin.|Interacts with MANY prescription medicines, including antidepressants, birth control and blood thinners. Do not use without a clinician. Causes sun sensitivity.
hawthorn|med,tea,cul|Berries, leaves, flowers|Jelly and tea; traditionally used as a heart tonic.|Talk to a clinician if you take heart or blood pressure medicines.
goldenseal|med|Root|Traditionally used topically and in teas.|Avoid in pregnancy; endangered in the wild so grow only nursery-propagated plants; can interact with medicines.
ginseng|med|Root|Traditional tonic.|Regulated in many states and countries; can interact with blood thinners and diabetes medicines.
eveningprimrose|med,cul|Seed oil, roots, young leaves|Traditional use for skin and women's wellness; roots are edible cooked.|Talk to a clinician before using the oil.
chicory|cul,med|Root, leaves, flowers|Roasted root coffee substitute, salad greens.|Allergy risk for daisy family.
burdock|cul,med|Root, seed|Gobo root in stir-fries; a traditional blood-and-skin tonic.|Allergy risk for daisy family.
redclover|tea,med|Flower heads|Tea; a traditional women's wellness herb.|Contains plant estrogens: avoid in pregnancy and with hormone-sensitive conditions; interacts with blood thinners.
hops|tea,aro,cul|Cones, shoots|Beer, sleep pillows; young spring shoots are eaten.|Avoid in depression and with sedatives; toxic to dogs.
sweetwoodruff|cul,aro|Dried leaves|May wine, fruit punch.|Use only in small amounts; large quantities can cause headaches and blood-thinning effects.
hibiscus|tea,cul|Calyxes|Tart red tea, jams, agua de jamaica.|Can lower blood pressure; avoid in pregnancy.
jiaogulan|tea,med|Leaves|Tea, called the immortality herb in China.|Can interact with blood thinners.
licorice|med,cul,spice|Root|Candy, tea and traditionally used for sore throats and digestion.|Can raise blood pressure and lower potassium. Avoid in heart or kidney problems and pregnancy.
woodbetony|tea,med|Aerial parts|Traditionally a headache and nerves tea.|Avoid in pregnancy.
vervain|tea,med|Aerial parts|Traditionally used as a bitter nerve tea.|Avoid in pregnancy.
aloe|med,cos|Leaf gel|Gel traditionally used for minor sunburn and kitchen burns.|Use the clear inner gel only; the yellow latex is a strong laxative and not for internal use.
elderflower|tea,cul,med|Flowers|Cordial, fritters, champagne, tea.|Raw berries and other parts are toxic; flowers only, cooked or steeped.
perillared|cul,tea|Leaves|Tea, baking, fruit salads.|None for normal food use.
costmary|aro,tea,cul|Leaves|Old-time bookmark herb; leaves scent tea and linens.|None known at normal use.
`;
const HERB_INFO = {}; HERB_INFO_TXT.trim().split('\n').forEach(l => { const f = l.split('|'); HERB_INFO[f[0]] = { tags: f[1].split(','), parts: f[2], uses: f[3], caution: f[4] }; });
const HERB_TAGS = { cul: 'Culinary', spice: 'Spice', tea: 'Tea', med: 'Traditional medicinal', aro: 'Aromatic', dye: 'Dye', cos: 'Skin care' };
const HERB_DISCLAIMER = 'This is traditional and historical use, shared for gardeners, not medical advice. Herbs act like medicines: they can interact with prescriptions, and some are unsafe in pregnancy, for children or with certain conditions. Talk to your clinician or pharmacist before using any herb medicinally, and never use a plant you have not identified with certainty.';
