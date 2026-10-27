/* Backpackica foraging and useful-plants pack. window.FORAGE = {plants, fungi, coast, useful, meta}.
   SAFETY RULES FOR EDITING THIS FILE (read before changing anything):
   - Nothing here is an identification aid. Every entry says "confirm in person with a local field guide or expert".
   - A plant only goes in `plants` with kind 'forage' if edibility AND its dangerous lookalikes were read in a named source (see SOURCES-forage.md).
   - Every item has `src` (list of URLs, or 'hortica:' strings for the user's Hortica app data) and `asof` (YYYY-MM). Mushroom "groups" have src:null on purpose (see note there).
   - Lookalikes are listed FIRST in the UI (field `look`). If none is known, `lookNone` must say so in words.
   - Months are only a rough filter aid (monthsNote says so). Ripeness and local rules decide, not the calendar.
   Regions: ca = California and the coast ranges, pnw = Pacific Northwest, rockies = Rockies and Great Basin, sw = Southwest deserts, east = eastern and central US. */
(function () {
  'use strict';
  const U = {
    usda_ruar9: 'https://plants.sc.egov.usda.gov/DocumentLibrary/plantguide/pdf/pg_ruar9.pdf',
    nps_shrubs: 'https://www.nps.gov/whis/learn/nature/upload/Shrubs_for_web.pdf',
    fs_thimble: 'https://www.fs.usda.gov/wildflowers/plant-of-the-week/rubus_parviflorus.shtml',
    uwb_salmon: 'https://www.uwb.edu/wetland/plants/rubus-spectabilis',
    pdx_huck: 'https://gardenecology.pdx.edu/plants/vaccinium-parvifolium-red-huckleberry/',
    usda_vapa: 'https://corpora.tika.apache.org/base/docs/govdocs1/117/117658.pdf',
    wisc_bane: 'https://hort.extension.wisc.edu/?p=12359',
    awk_bane: 'https://awkwardbotany.com/2015/04/22/poisonous-plants-baneberry/',
    prac_berries: 'https://practicalselfreliance.com/poisonous-berries/',
    ncsu_moon: 'https://plants.ces.ncsu.edu/plants/menispermum-canadense/',
    mdc_moon: 'https://mdc.mo.gov/discover-nature/field-guide/common-moonseed',
    ext_grape: 'https://ask2.extension.org/kb/faq.php?id=656583',
    bnb_grape: 'https://www.birdsandblooms.com/gardening/gardening-basics/moonseed-vs-wild-grape/',
    csh_straw: 'https://commonsensehome.com/wild-strawberry/',
    usu_sask: 'https://extension.usu.edu/forestry/tree-identification/other-trees/saskatoon-western-serviceberry.php',
    osu_elder: 'https://extension.oregonstate.edu/catalog/em-9446-play-it-safe-when-preserving-elderberries',
    ucanr_elder: 'https://ccfruitandnuts.ucanr.edu/sites/default/files/2025-07/Elderberries-OSU%202024.pdf',
    asu_elder: 'https://www.asu.edu/lib/camartin/plants/Plant%20html%20files/sambucuscerulea.html',
    sfu_elder: 'https://www.sfu.ca/halkeb/html/plants/blueelderberry.htm',
    nrcs_manz: 'https://www.nrcs.usda.gov/plantmaterials/capmcpg14164.pdf',
    wf_manz: 'https://www.wildflower.org/plants/result.php?id_plant=ARPU5',
    unr_pp: 'https://extension.unr.edu/4h/pub.aspx?PubID=2157',
    az_pp: 'https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/PricklyPearCactus.pdf',
    az_mesq: 'https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/Mesquite_final_English.pdf',
    usda_pimo: 'https://plants.sc.egov.usda.gov/DocumentLibrary/plantguide/pdf/pg_pimo.pdf',
    osu_pied: 'https://landscapeplants.oregonstate.edu/plants/pinus-edulis',
    honest_pn: 'https://honest-food.net/how-to-harvest-pine-nuts/comment-page-1/',
    sod_acorn: 'https://www.suddenoakdeath.org/wp-content/uploads/2012/08/Processing-acorns.pdf',
    alm_acorn: 'https://www.almanac.com/content/how-prepare-and-cook-acorns',
    hunker_pine: 'https://www.hunker.com/13428592/which-pine-trees-are-poisonous/',
    wen_pine: 'https://wenatcheeoutdoors.org/2023/08/23/drinking-a-pine-so-divine/',
    csh_pine: 'https://commonsensehome.com/pine-needle-tea/',
    dm_pine: 'https://www.thedailymeal.com/1532521/pine-needle-tea-safety-tip/',
    msu_camas: 'https://apps.msuextension.org/magazine/assets/docs/DeathCamas.pdf',
    osu_camas: 'https://extension.oregonstate.edu/es/node/153986/printable/print',
    wsu_camas: 'https://wpcdn.web.wsu.edu/wp-ecommerce/uploads/sites/2/product-3886-sku-PNW104.pdf',
    wu_camas: 'https://wildutah.us/html/plants_scenery/h_camasfoothilldeath.html',
    latah_onion: 'https://phdns.latahcountyid.gov/article/are-wild-onions-edible-safe-foraging-tips',
    ucd_onion: 'https://sandbox.dss.ucdavis.edu/can-you-eat-wild-onions',
    wc_cattail: 'https://www.wildernesscollege.com/cattail.html',
    pei_cattail: 'https://www.pei-untamed.com/post/edible-cat-tail-vs-toxic-iris',
    fa_cattail: 'https://www.farmersalmanac.com/cooking-wild-edible-cattails',
    poison_org: 'https://www.poison.org/articles/wild-mushroom-warning',
    wikem: 'https://wikem.org/wiki/Mushroom_poisoning',
    county_mush: 'https://www.countynewscenter.com/?p=221291',
    sd_cahan: 'https://www.sandiegocounty.gov/content/dam/sdc/hhsa/programs/phs/cahan/communications_documents/12-18-2025.pdf',
    sci_mush: 'https://scienceinsights.org/how-can-you-tell-if-a-mushroom-is-poisonous/',
    cdc_water: 'https://cdc.gov/drinking-water/prevention/water-treatment-hiking-camping-traveling.html',
    mn_water: 'https://www.health.mn.gov/diseases/waterborne/prevention/backcountry.html',
    cdph_sn: 'https://www.cdph.ca.gov/Programs/OPA/Pages/SN25-025.aspx',
    sd_mussel: 'https://www.sandiegocounty.gov/content/sdc/deh/lwqd/mussel_quarantine.html',
    cfr: 'https://www.law.cornell.edu/cfr/text/36/2.1',
    nps_shen: 'https://www.nps.gov/shen/learn/management/collecting-plants.htm',
    blm: 'https://www.blm.gov/Learn/Can-I-Keep-This',
    fs_klamath: 'https://www.fs.usda.gov/r05/klamath/permits/forest-products-personal-use',
    baynature: 'https://baynature.org/article/foraging-101/',
    cms: 'https://cascademyco.org/resources/mushroom-picking-permits/',
    psms: 'https://mail.psms.org/WAMushroomRulesMay2016.pdf',
    mn_lcc: 'https://www.lcc.mn.gov/foraging/meetings/20251021/Task-Force-Summary-of-Foraging-Rules',
    kirtley: 'https://paulkirtley.co.uk/?p=10793',
    backpacker: 'https://www.backpacker.com/skills/universal-edibility-test/?scope=anon',
    merri: 'https://merriwether.substack.com/p/the-uet-is-stupid',
    wiki_r3: 'https://en.wikipedia.org/wiki/Rule_of_threes_(survival)',
    h_herbs: 'hortica:js/herbs.js',
    h_plants: 'hortica:js/plants.js',
    h_land: 'hortica:js/land.js',
    h_coast: 'hortica:js/coast.js',
    h_wet: 'hortica:js/wet.js',
    h_succ: 'hortica:js/succ.js',
    h_trees: 'hortica:js/trees1.js',
    h_shrubs: 'hortica:js/shrubs.js',
    h_fruit: 'hortica:js/fruit2.js',
    h_veg: 'hortica:js/veg2.js',
    h_fungi: 'hortica:js/fungidata.js'
  };
  const S = (...k) => k.map(x => { if (!U[x]) throw new Error('forage: unknown source key ' + x); return U[x]; });
  const ASOF = '2026-10';
  const ALL = ['ca', 'pnw', 'rockies', 'sw', 'east'];
  const LOOKLEAD = 'Confirm with a local field guide or an expert in person before eating any of it.';

  /* ---------------------------------------------------------------- PLANTS */
  const plants = [
    /* ---- fruit and berries ---- */
    {
      id: 'blackberry', kind: 'forage', cat: 'fruit', n: 'Blackberry (wild brambles)', latin: 'Rubus armeniacus (Himalayan) and other Rubus',
      regions: ['ca', 'pnw', 'east'], months: [7, 8, 9], monthsNote: 'Rough guide: mid to late summer. Ripe, fully black fruit decides, not the calendar.',
      habitat: 'Thickets along fences, vacant lots, rail lines, power-line corridors and streams, from sea level to about 1,500 m (5,000 ft).',
      part: 'Ripe, fully black fruit.', prep: 'Eat fresh or cook into jam. Wash well.',
      see: ['Arching, thorny canes that root where they touch the ground and make dense thickets.', 'Leaves usually of 5 leaflets (sometimes 3), whitish underneath.', 'Black fruit made of many small bumps; only the second-year canes fruit.'],
      look: [{ n: 'Poison oak', latin: 'Toxicodendron diversilobum', level: 'irritant', diff: 'Often grows inside blackberry thickets. It has no thorns, and touching it causes an itchy rash in many people. Look at what your hand is going into before you reach.' }],
      lookNone: 'No poisonous berry is named as a lookalike of ripe blackberry in the sources read.',
      cautions: ['The places this plant likes (rail lines, power-line corridors, vacant lots, roadsides) are often sprayed or polluted. Pick well away from them.', 'It is a listed noxious weed in many states. Picking it is fine; do not move canes or seed to new places.'],
      legal: 'Many parks allow small personal amounts (for example Shenandoah NP: about one quart per person per day; GGNRA and the Presidio allowed it in 2012), but many local parks prohibit all picking. Ask.',
      risk: 'low', hortica: true, hid: 'blackberry', src: S('usda_ruar9', 'nps_shrubs', 'baynature', 'nps_shen', 'h_plants'), asof: ASOF
    },
    {
      id: 'thimbleberry', kind: 'forage', cat: 'fruit', n: 'Thimbleberry', latin: 'Rubus parviflorus',
      regions: ['pnw', 'ca', 'rockies'], months: [7, 8], monthsNote: 'Rough guide: summer, later at elevation.',
      habitat: 'Shady, moist, cool mountain slopes and forest edges.',
      part: 'Ripe red berries.', prep: 'Eat fresh; cooks into jam or fruit leather. The berries are soft and tart.',
      see: ['Large, fuzzy, five-lobed leaves, sometimes bigger than a spread hand.', 'White five-petaled flowers with a yellow centre.', 'Ripe berry is red, like a small raspberry with many fruitlets, and shaped like a thimble.'],
      look: [], lookNone: 'No dangerous lookalike is named in the source read (U.S. Forest Service). Still match the leaf and the berry before eating; do not eat red berries from plants that do not match.',
      cautions: ['Do not pick beside roads or sprayed areas.'], legal: 'Check the land manager. National forests usually allow small incidental amounts; national parks mostly do not.',
      risk: 'low', hortica: false, hid: null, src: S('fs_thimble', 'uwb_salmon'), asof: ASOF
    },
    {
      id: 'salmonberry', kind: 'forage', cat: 'fruit', n: 'Salmonberry', latin: 'Rubus spectabilis',
      regions: ['pnw', 'ca'], months: [5, 6, 7], monthsNote: 'Rough guide: late spring to early summer. Flowers appear March to June.',
      habitat: 'Moist woods and wetland edges at low to middle elevations, Pacific coast from California to Alaska.',
      part: 'Ripe berries.', prep: 'Eat fresh or cook. Sweet, raspberry-like, orange to red.',
      see: ['Upright shrub up to about 9 ft with flaking brown bark.', 'Leaves of three leaflets.', 'Hot pink flowers in early spring before the leaves fill out; berry is raspberry-like, orange to red.'],
      look: [], lookNone: 'No dangerous lookalike is named in the source read. Match all three features above.',
      cautions: ['The source warns against eating berries from campus or roadside plants because of possible contamination.'], legal: 'Check the land manager before picking.',
      risk: 'low', hortica: false, hid: null, src: S('uwb_salmon'), asof: ASOF
    },
    {
      id: 'huckleberry', kind: 'forage', cat: 'fruit', n: 'Red huckleberry (and other wild Vaccinium berries)', latin: 'Vaccinium parvifolium',
      regions: ['pnw', 'ca'], months: [7, 8, 9], monthsNote: 'Rough guide: July to September; sources differ by a month.',
      habitat: 'Edges and openings of conifer forest, moist woods, often on old rotting stumps and logs. Southeast Alaska to central California.',
      part: 'Ripe berries.', prep: 'Eat fresh, or cook into jam or pie. Slightly sour. This entry covers red huckleberry only: blue and black huckleberries and blueberries of other regions are not described here.',
      see: ['A woody shrub with thin, bright green, strongly angled twigs.', 'Small oval, thin leaves with smooth edges and a sharp tip.', 'Berries are single, round, bright red and about 1 cm (3/8 in), each hanging from a small stalk where leaf meets stem.'],
      look: [
        { n: 'Red baneberry', latin: 'Actaea rubra', level: 'toxic', diff: 'A leafy herb 1 to 3 ft tall (not a woody shrub) with coarsely toothed compound leaves. Its red berries sit in a dense upright spike. Eating six or more berries can cause serious heart and breathing trouble.', id: 'baneberry' },
        { n: 'Yew arils', latin: 'Taxus spp.', level: 'deadly', diff: 'Yew is an evergreen conifer, not a berry shrub. The red cup around a yew seed is not a berry; the seed inside is extremely poisonous.', id: 'yew' }],
      cautions: ['Berry colour alone is never enough: red baneberry also has red berries. Only pick berries you can trace to a woody shrub with the leaves above.', 'In Hortica, "garden huckleberry" is a different plant (a nightshade that must be fully ripe and cooked). Do not mix them up.'],
      legal: 'National forests usually allow incidental personal amounts (Klamath NF: up to 1 gallon of berries per day, not within 200 ft of water). Most national parks do not.',
      risk: 'medium', hortica: true, hid: 'huckleberry', src: S('pdx_huck', 'usda_vapa', 'wisc_bane', 'awk_bane', 'fs_klamath', 'h_shrubs'), asof: ASOF
    },
    {
      id: 'wildstrawberry', kind: 'forage', cat: 'fruit', n: 'Wild strawberry', latin: 'Fragaria virginiana and relatives',
      regions: ['east', 'rockies', 'pnw', 'ca'], months: [6, 7], monthsNote: 'Rough guide: late spring to midsummer.',
      habitat: 'Meadows, forest edges and clearings.',
      part: 'Ripe red fruit.', prep: 'Eat fresh. The berries are small and sweet.',
      see: ['Flowers are white (the lookalike below has yellow flowers).', 'Leaves in three toothed leaflets.', 'Small red fruit with seeds on the outside.'],
      look: [{ n: 'Mock (Indian) strawberry', latin: 'Potentilla indica', level: 'harmless', diff: 'Yellow flowers, and a bland, watery fruit. The source says it is not poisonous, but it is not worth eating either.' }],
      lookNone: '',
      cautions: ['If you react to garden strawberries, expect to react to wild ones.'], legal: 'Check the land manager.',
      risk: 'low', hortica: true, hid: 'strawberry', src: S('csh_straw', 'h_plants'), asof: ASOF
    },
    {
      id: 'serviceberry', kind: 'forage', cat: 'fruit', n: 'Serviceberry (Saskatoon, juneberry)', latin: 'Amelanchier alnifolia and relatives',
      regions: ['pnw', 'rockies', 'east'], months: [6, 7, 8], monthsNote: 'Rough guide: early to midsummer; the ripening month is not given in the sources.',
      habitat: 'Cool, moist sites, canyons and woodland edges. Often forms groves because it sprouts from underground stems.',
      part: 'Ripe sweet fruit.', prep: 'Eat fresh or cooked.',
      see: ['Large shrub or small tree with thin, smooth brown-gray bark.', 'Simple, alternate, oval leaves with coarse teeth on the upper half to edge, darker on top.', 'Clusters of white flowers in spring; round purple-blue berries in summer.'],
      look: [], lookNone: 'No dangerous lookalike is named in the sources read. Do not eat berries from ornamental plantings that may have been sprayed, and do not eat berries that do not match the leaf.',
      cautions: ['Eat only fully ripe fruit.'], legal: 'Check the land manager.',
      risk: 'low', hortica: true, hid: 'serviceberry', src: S('usu_sask', 'h_shrubs'), asof: ASOF
    },
    {
      id: 'wildgrape', kind: 'forage', cat: 'fruit', n: 'Wild grape', latin: 'Vitis spp.',
      regions: ['east'], months: [8, 9, 10], monthsNote: 'Rough guide: late summer and fall; sweeter after the first frost.',
      habitat: 'Woods edges, fences and thickets; climbing vines up to about 75 ft.',
      part: 'Ripe fruit (cook or eat fresh).', prep: 'Each fruit has several seeds. Fruit sweetens after the first frost.',
      see: ['Climbs with curling tendrils.', 'Leaves have toothed edges; bark is reddish-brown and shreds into narrow strips.', 'Each fruit holds several round seeds.'],
      look: [
        { n: 'Canada moonseed', latin: 'Menispermum canadense', level: 'deadly', diff: 'Looks like a wild grape cluster. The fruit holds ONE flat crescent-shaped seed; wild grapes have several round seeds. Moonseed has no tendrils, its leaf edges have no teeth, and the leaf stalk joins the leaf near the edge on the underside. Deaths have been reported.', id: 'moonseed' },
        { n: 'Pokeweed', latin: 'Phytolacca americana', level: 'toxic', diff: 'Berries hang on red stems from a non-woody plant; grapes are on woody vines. All parts of the berry are poisonous.' },
        { n: 'Porcelain berry', latin: 'Ampelopsis glandulosa', level: 'unknown', diff: 'An invasive vine with bright purple and blue berries and three-lobed rounded leaves. Do not assume it is edible.' }],
      lookNone: '',
      cautions: ['Never rely on leaves alone: grape and moonseed leaves can look alike. Check tendrils AND crush a fruit to see the seed. Ask a local extension office or expert for the first time.'],
      legal: 'Fruit gathering is allowed in some parks in small amounts (Shenandoah NP lists wild grapes). Check.',
      risk: 'medium', hortica: true, hid: 'grape', src: S('mdc_moon', 'ncsu_moon', 'ext_grape', 'bnb_grape', 'prac_berries', 'nps_shen'), asof: ASOF
    },
    {
      id: 'blueelderberry', kind: 'forage', cat: 'fruit', n: 'Blue elderberry (cooked berries only)', latin: 'Sambucus nigra subsp. cerulea',
      regions: ['ca', 'pnw', 'rockies', 'sw'], months: [8, 9, 10], monthsNote: 'Rough guide: late summer to fall.',
      habitat: 'Streamsides and moist, fairly open sites, up to about 9,000 ft. Western North America.',
      part: 'Only fully ripe blue berries, cooked.', prep: 'Remove EVERY stem and leaf piece. Cook the berries (jam, jelly, syrup, wine). Do not eat or juice them raw. Freezing or drying does not remove the need to cook them.',
      see: ['Shrub or small tree 15 to 30 ft with opposite leaves made of 5 to 9 leaflets.', 'Flat-topped clusters of small white flowers in late spring.', 'Dusky blue berries with a whitish waxy bloom, in flat clusters.'],
      look: [{ n: 'Red elderberry', latin: 'Sambucus racemosa', level: 'toxic', diff: 'Bright red berries. Extension specialists say it may hold more toxin, especially in the seeds, and advise against making food from it. Leave it.' }],
      lookNone: '',
      cautions: ['Raw berries and juice can cause nausea, vomiting, cramps and in severe cases seizures (cyanide-releasing compounds).', 'Stems, bark, leaves and roots are poisonous, especially fresh. Never use stems as skewers, pipes or cups.', 'Only truly ripe berries. Green and red ones are unripe.'],
      legal: 'Check the land manager.',
      risk: 'medium', hortica: true, hid: 'elderberry', src: S('osu_elder', 'ucanr_elder', 'asu_elder', 'sfu_elder', 'h_herbs'), asof: ASOF
    },
    {
      id: 'manzanita', kind: 'forage', cat: 'fruit', n: 'Manzanita berries', latin: 'Arctostaphylos spp.',
      regions: ['ca', 'sw', 'pnw'], months: [6, 7, 8, 9], monthsNote: 'Rough guide: summer into early fall.',
      habitat: 'Dry chaparral, foothills and open woodland; California and Oregon mostly, pointleaf manzanita across the Southwest.',
      part: 'Ripe berries only. Traditional uses: eaten fresh or dried, ground into flour, or steeped in water for a sweet cider.', prep: 'Crush ripe berries, pour cold water through, and drink the cider within a few days (it turns sour and ferments). The pulp is dry and the seeds are hard: this is a small treat, not a meal.',
      see: ['Smooth, red-brown bark on twisting limbs.', 'Leathery, rounded leaves; urn-shaped pink to white flowers in winter and spring.', 'Pea-sized berries that look like tiny sticky apples.'],
      look: [], lookNone: 'The sources read (a USDA plant sheet, a National Park Service interpretive sign, and a wildflower database) name no poisonous lookalike but give only traditional-use history, not modern safety testing. Toyon (red berries on a large evergreen shrub) is a different plant that one source describes as ground into meal or cooked, not as a raw snack; do not mix them up.',
      cautions: ['One source notes that some tribes chewed the berries for flavour but did not swallow them: treat it as a taste, not a food.', 'Hard seeds can crack teeth. Eat little.'], legal: 'Most parks do not allow gathering; check the land manager.',
      risk: 'medium', hortica: true, hid: 'manzanita', src: S('nrcs_manz', 'wf_manz', 'nps_shrubs', 'h_shrubs'), asof: ASOF
    },
    {
      id: 'pricklypear', kind: 'forage', cat: 'fruit', n: 'Prickly pear (fruit and pads)', latin: 'Opuntia spp.',
      regions: ['sw', 'ca', 'rockies', 'east'], months: [8, 9, 10], monthsNote: 'Rough guide: fruit ripens around September; young pads in spring and early summer.',
      habitat: 'Dry slopes, sandy soil and open ground; widespread in western North America, with hardy eastern species such as Opuntia humifusa.',
      part: 'Ripe fruit (tunas); young, tender pads (nopales).', prep: 'The danger is the spines and the tiny hair-like glochids, not poison. Wear thick leather gloves, use tongs. Burn the glochids off the fruit over a flame, then peel. For pads, cut away every spine and needle bed on both sides, trim the edge and the base, then parboil 5 to 10 minutes. Check carefully for left-over spines. Do not rinse before the thorns are off.',
      see: ['Flat, paddle-shaped green pads (they are stems) in joined chains.', 'Clusters of long spines plus tufts of tiny glochids.', 'Large yellow flowers; ripe fruit is purple to red.'],
      look: [], lookNone: 'No poisonous lookalike is named in the sources read. Other cacti with round or cylinder stems (cholla, barrel) are not covered here: do not eat them.',
      cautions: ['Glochids lodge in skin, eyes and mouth and can be painful for days. Even "spineless" pads have them.', 'Fruit does not ripen after picking; pick it ripe.'],
      legal: 'Gathering in national parks and many state parks is prohibited. A U.S. Forest Service ranger station can tell you where fruit may be collected.',
      risk: 'medium', hortica: true, hid: 'opuntiahumifusa', src: S('unr_pp', 'az_pp', 'h_succ'), asof: ASOF
    },
    {
      id: 'mesquite', kind: 'forage', cat: 'nut', n: 'Mesquite pods (flour)', latin: 'Prosopis glandulosa, P. velutina, P. pubescens',
      regions: ['sw'], months: [6, 7], monthsNote: 'Pick ripe pods in early summer, roughly June to July, before the monsoon rains.',
      habitat: 'Desert washes, flats and roadsides in the Southwest.',
      part: 'Dry, brittle pods, ground into sweet flour.', prep: 'Pick only brittle dry pods straight off the tree, never from the ground. Dry, then grind. Use as 10 to 25 percent of the flour in baking.',
      see: ['Thorny desert tree or shrub that makes bean-like seed pods.', 'Honey, velvet and screwbean mesquite all give edible pods (the sweetness varies).'],
      look: [], lookNone: 'No lookalike is named in the source read. Many desert legumes have pods or seeds that are not food: only pods you can tie to a mesquite tree.',
      cautions: ['Pods on the ground can grow mould that makes aflatoxin, a toxic chemical. Pick before the rains and from the tree.', 'Mesquite pollen is an allergen (Hortica).'],
      legal: 'Most public land restricts it. Ask the land manager.',
      risk: 'medium', hortica: true, hid: 'mesquite', src: S('az_mesq', 'h_trees'), asof: ASOF
    },
    {
      id: 'pinyon', kind: 'forage', cat: 'nut', n: 'Pinyon pine nuts', latin: 'Pinus edulis, Pinus monophylla',
      regions: ['sw', 'rockies', 'ca'], months: [8, 9, 10], monthsNote: 'Rough guide: late summer to fall (cones ripen in August of their second year). Good crops come only every few years.',
      habitat: 'Pinyon-juniper woodland, foothills and mountains of the Southwest, Great Basin and the Sierra east side.',
      part: 'The large wingless seeds inside the cones.', prep: 'Let the cones open (about three weeks in a dry tray, spread no more than two cones deep) or roast them. Shell the nuts. Roasting in the shell is a modern way to cook them.',
      see: ['Small, slow-growing, round-crowned pine, up to about 45 ft, often with a crooked trunk.', 'Needles 1 to 2 inches, usually one per bundle in singleleaf pinyon, two per bundle in two-needle pinyon.', 'Egg-shaped, very resinous cones; large seeds 1/2 inch long.'],
      look: [], lookNone: 'No poisonous lookalike is named in the sources read. Seeds of most eastern pines are too small to be worth it.',
      cautions: ['Pitch is very sticky: wear gloves and keep it off clothing and gear.', 'Some people react to pine nuts (Hortica). Try a few first.'],
      legal: 'National parks mostly prohibit it. National forests may allow limited cone gathering (Klamath NF lists 15 cones per day).',
      risk: 'low', hortica: true, hid: 'pinyonpine', src: S('usda_pimo', 'osu_pied', 'honest_pn', 'fs_klamath', 'h_trees'), asof: ASOF
    },
    {
      id: 'acorns', kind: 'forage', cat: 'nut', n: 'Acorns (leached)', latin: 'Quercus spp.',
      regions: ALL, months: [9, 10, 11], monthsNote: 'Rough guide: fall, September to October in the sources.',
      habitat: 'Oak woodland and savanna throughout North America.',
      part: 'Shelled nutmeat, after leaching out the bitter tannins.', prep: 'NEVER eat acorns raw. Shell them, then leach: either boil in several changes of fresh boiling water, moving them without letting them cool, until the water stays fairly clear (an hour or longer), or grind, cover with cold water and change it once or twice a day for days. Taste a tiny piece: leached acorns taste mild and nutty; if your mouth puckers or feels dry, keep leaching. Do not go by the colour of the water. Roasting alone does not remove enough tannin.',
      see: ['A nut in a scaly cap, on an oak tree (alternate leaves, usually lobed).', 'White-oak group acorns (rounded leaf lobes) are milder; red-oak group (pointed lobes with bristle tips) take longer to leach.'],
      look: [], lookNone: 'Acorns are distinctive. The hazard is not a lookalike but tannins and mould: skip acorns that are cracked, holed, blackened, mouldy or smell off.',
      cautions: ['Acorns are tree nuts: people with tree-nut allergy should ask a doctor first.', 'Dry leached nut or flour thoroughly and store it cold; it goes rancid and mouldy.'],
      legal: 'Gathering nuts is allowed on some public land in small amounts and prohibited on much of it; check.',
      risk: 'medium', hortica: true, hid: 'whiteoak', src: S('alm_acorn', 'sod_acorn', 'h_trees'), asof: ASOF
    },
    /* ---- greens and bulbs ---- */
    {
      id: 'wildonion', kind: 'forage', cat: 'greens', n: 'Wild onion and wild garlic (Allium)', latin: 'Allium spp.',
      regions: ALL, months: [3, 4, 5, 6, 7], monthsNote: 'Rough guide: spring to early summer. Death camas grows in the same season and the same meadows.',
      habitat: 'Meadows, hillsides, open woods and lawns. Death camas often grows in the same places.',
      part: 'Leaves, stems and bulbs, after you have confirmed the onion smell.', prep: 'Wash and chop like scallions; cook or use fresh. Mildest in spring.',
      see: ['Crush a leaf or cut a stem: a STRONG onion or garlic smell is the key test.', 'Stems are round and hollow; leaves are long, narrow and fleshy.', 'Flowers, if present, are a rounded, globe-like cluster.'],
      look: [
        { n: 'Death camas', latin: 'Toxicoscordion (Zigadenus) venenosum and relatives', level: 'deadly', diff: 'Grass-like, V-shaped (folded) leaves; flowers in a cone-shaped spike of small cream or greenish-white blooms; and NO onion smell anywhere on the plant. All parts are poisonous and there is no known antidote. People have died mistaking it for wild onion or edible camas.', id: 'deathcamas' },
        { n: 'Star of Bethlehem and other lily-family plants', latin: 'Ornithogalum and others', level: 'toxic', diff: 'No onion smell; Star of Bethlehem has a white stripe down each leaf. Some lily-family plants have solid stems and broader leaves.' }],
      lookNone: '',
      cautions: ['No smell means no. Test each plant on its own: patches can mix, and a smell can linger on your hands, so wash and re-crush a fresh leaf each time.', 'Check the bulb as well as the leaf.', 'Do not harvest from lawns or roadsides that may be sprayed.'],
      legal: 'Digging bulbs is prohibited in most parks and preserves. Take leaves only where picking is allowed, and leave most of every patch.',
      risk: 'high', hortica: false, hid: null, src: S('msu_camas', 'osu_camas', 'wsu_camas', 'wu_camas', 'latah_onion', 'ucd_onion'), asof: ASOF
    },
    /* ---- the dangerous plants named above (kind danger: never food) ---- */
    {
      id: 'deathcamas', kind: 'danger', cat: 'danger', n: 'Death camas', latin: 'Toxicoscordion venenosum (meadow death camas) and related species',
      regions: ['ca', 'pnw', 'rockies', 'sw'], months: [4, 5, 6, 7], monthsNote: 'Flowers April to May at low elevation and June to August higher up.',
      habitat: 'Coastal prairies, meadows, pastures, stream banks, roadsides and open forest, about 1,400 to 8,000 ft.',
      part: 'NEVER FOOD. Every part is poisonous, including the pollen and nectar.', prep: '',
      see: ['Grass-like, V-shaped (folded) leaves growing from the base, 4 to 15 inches long.', 'An unbranched stem 6 to 28 inches tall topped by a cone-shaped cluster of small cream to greenish-white six-petaled flowers.', 'A small onion-like bulb with blackish scales, buried 2 to 8 inches deep. NO onion smell in any part.'],
      look: [{ n: 'Wild onion, edible camas', latin: 'Allium spp., Camassia', level: 'edible', diff: 'People are poisoned when they mistake the bulbs for wild onion or blue camas. Wild onion smells strongly of onion; death camas smells of nothing.' }],
      lookNone: '',
      cautions: ['Symptoms begin about 1 to 8 hours after eating: heavy salivation, numbness, nausea, vomiting, diarrhea, dizziness, confusion, irregular heartbeat, trouble breathing, convulsions, coma. Call Poison Control (1-800-222-1222 in the US) or 911 at once; there is no known antidote, so early hospital care matters.', 'Sheep and cattle die from it too.'],
      legal: '', risk: 'high', hortica: false, hid: null, src: S('msu_camas', 'osu_camas', 'wsu_camas', 'wu_camas'), asof: ASOF
    },
    {
      id: 'baneberry', kind: 'danger', cat: 'danger', n: 'Baneberry (doll\'s eyes)', latin: 'Actaea rubra, Actaea pachypoda',
      regions: ['ca', 'pnw', 'rockies', 'east'], months: [7, 8, 9], monthsNote: 'Berries show in summer and fall.',
      habitat: 'Shady, moist woods. Red baneberry is the most widespread across North America; white baneberry grows in the East.',
      part: 'NEVER FOOD. All parts are toxic; roots and berries are the worst.', prep: '',
      see: ['A leafy herb 1 to 3 ft tall (not a shrub) with leaves divided into 2 to 3 deeply cut, coarsely toothed leaflets.', 'A dense spike of small white flowers with showy stamens.', 'Glossy berries, red (or sometimes white) on thick stalks; white berries carry a black dot, "doll\'s eyes".'],
      look: [{ n: 'Red huckleberry and other wild berries', latin: 'Vaccinium spp.', level: 'edible', diff: 'Huckleberries grow on woody shrubs; baneberry is a leafy herb with berries in an upright spike.' }],
      lookNone: '',
      cautions: ['Eating six or more berries can cause serious breathing and heart trouble (circulatory failure). The berries are bitter, which usually stops people, but children are at risk.', 'Stomach cramps, dizziness, vomiting, diarrhea and delirium are the usual symptoms. Call Poison Control (1-800-222-1222 in the US).'],
      legal: '', risk: 'high', hortica: false, hid: null, src: S('awk_bane', 'wisc_bane', 'prac_berries'), asof: ASOF
    },
    {
      id: 'moonseed', kind: 'danger', cat: 'danger', n: 'Canada moonseed', latin: 'Menispermum canadense',
      regions: ['east'], months: [7, 8, 9, 10], monthsNote: 'Fruit July to October.',
      habitat: 'Moist woods, thickets, stream banks and bluffs across eastern North America; also fence rows and disturbed ground.',
      part: 'NEVER FOOD. Flowers, fruits, leaves and roots are poisonous; the alkaloids can cause convulsions and can be fatal.', prep: '',
      see: ['Bluish-black grape-like fruit with a whitish bloom, hanging in clusters.', 'Each fruit holds ONE flat crescent (moon-shaped) seed.', 'No tendrils: it twines. Leaf edges are smooth, with small sharp points at the lobe tips.'],
      look: [{ n: 'Wild grape', latin: 'Vitis spp.', level: 'edible', diff: 'Grapes climb with tendrils, have toothed leaves and several round seeds in each fruit.' }],
      lookNone: '',
      cautions: ['Do not rely on photos or leaves alone. If you cannot confirm, do not eat any wild grape-like fruit.', 'Call Poison Control (1-800-222-1222 in the US) if anyone, especially a child, has eaten some.'],
      legal: '', risk: 'high', hortica: false, hid: null, src: S('mdc_moon', 'ncsu_moon', 'ext_grape', 'bnb_grape', 'prac_berries'), asof: ASOF
    },
    {
      id: 'yew', kind: 'danger', cat: 'danger', n: 'Yew', latin: 'Taxus spp.',
      regions: ALL, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], monthsNote: 'Evergreen; red arils in late summer and fall.',
      habitat: 'Planted widely as a hedge and ornamental; wild Pacific yew grows in Pacific Northwest forests.',
      part: 'NEVER FOOD OR TEA. Almost every part is deadly to people and animals; only the red fleshy aril is not poisonous, and the seed inside it is extremely poisonous.', prep: '',
      see: ['Dark evergreen conifer or hedge with flat needles single on the twig, like a fir.', 'Instead of a woody cone it makes a red, cup-like fleshy aril around one seed.', 'Pines carry both male and female cones on one tree; yew trees carry only one kind of cone-like structure each.'],
      look: [{ n: 'Fir, hemlock, spruce and pine needles used for tea', latin: 'Pinus, Abies, Picea, Tsuga', level: 'edible', diff: 'Yew looks like a fir at a glance. Pines have bundled needles. If you cannot tell, do not use it.' }],
      lookNone: '',
      cautions: ['Taxine in the needles and seeds can cause serious heart rhythm problems and sudden death. Call Poison Control (1-800-222-1222 in the US) or 911.', 'Keep pets and children away from yew hedges.'],
      legal: '', risk: 'high', hortica: true, hid: 'yew', src: S('prac_berries', 'dm_pine', 'wen_pine', 'h_shrubs'), asof: ASOF
    }
  ];

  /* Wild plants whose edibility is documented in Hortica (the user's garden app) but whose wild lookalikes were NOT verified for this guide.
     They appear as "Grow it, do not forage it": garden-grown plants carry none of the identification risk. */
  const GROW_NOTE = 'Wild lookalikes for this plant were not verified for this guide, so it is not offered for wild picking here. Hortica can show you how to grow it, which removes the identification risk.';
  const grow = (id, n, latin, hid, say, caution, srcKey) => ({
    id, kind: 'grow', cat: 'grow', n, latin, regions: ALL, months: [], monthsNote: '', habitat: '', part: say, prep: '', see: [],
    look: [], lookNone: GROW_NOTE, cautions: caution, legal: '', risk: 'unverified', hortica: true, hid, src: S(srcKey || 'h_herbs'), asof: ASOF
  });
  plants.push(
    grow('g_dandelion', 'Dandelion', 'Taraxacum officinale', 'dandelion', 'Spring greens, fall roots, flowers for wine.', ['Allergy risk if you react to the daisy family.', 'Ask a clinician if you take water pills or have gallstones (Hortica).']),
    grow('g_nettle', 'Stinging nettle', 'Urtica dioica', 'nettle', 'Young tips in spring for soup and tea. Cooking or drying removes the sting.', ['Wear gloves. Pick before flowering.']),
    grow('g_minerslettuce', 'Miner\'s lettuce', 'Claytonia perfoliata', 'minerslettuce', 'Cool-season salad green with round leaves and edible flowers.', ['Grows best in shade and cold.'], 'h_veg'),
    grow('g_purslane', 'Purslane', 'Portulaca oleracea', 'purslane', 'Succulent summer green.', ['Cut often and it regrows.'], 'h_veg'),
    grow('g_sorrel', 'Sorrel', 'Rumex acetosa', 'sorrel', 'Lemony leaf green.', ['High in oxalic acid: limit it if you form kidney stones (Hortica).']),
    grow('g_plantain', 'Plantain (the lawn weed)', 'Plantago major', 'plantain', 'Young leaves; also a folk poultice.', ['Do not use a poultice on deep wounds.']),
    grow('g_ramps', 'Ramps', 'Allium tricoccum', 'ramps', 'Strong garlicky leaves and bulbs of woodland wild leek.', ['Slow from seed, so wild patches are easily over-picked. Take one leaf per plant (Hortica).'], 'h_veg'),
    grow('g_rosehips', 'Rose hips (rugosa roses)', 'Rosa rugosa', 'rose', 'Hips make a vitamin C tea.', ['Only from roses that have never been sprayed.'], 'h_plants'),
    grow('g_mulberry', 'Mulberry', 'Morus spp.', 'mulberry', 'Sweet fruit.', ['Stains patios; birds love it.'], 'h_fruit'),
    grow('g_currant', 'Currants and gooseberries', 'Ribes spp.', 'currant', 'Tart shrub fruit for jam and pie.', ['Some states restrict them because of white pine blister rust (Hortica).'], 'h_fruit'),
    grow('g_sumac', 'Staghorn sumac', 'Rhus typhina', 'sumac', 'Red fruit cones steeped into a lemony drink.', ['Hortica notes it is not related to poison sumac, which has WHITE berries. Do not collect sumac you cannot tell apart.'], 'h_shrubs'),
    grow('g_persimmon', 'American persimmon', 'Diospyros virginiana', 'persimmon', 'Fruit is astringent until fully soft and ripe.', ['Wait for the first frost before eating.'], 'h_trees'),
    grow('g_hazelnut', 'Hazelnut', 'Corylus spp.', 'hazelnut', 'Nuts.', ['Plant two varieties for cross-pollination (Hortica).'], 'h_shrubs'),
    grow('g_oregongrape', 'Oregon grape', 'Mahonia aquifolium', 'oregongrape', 'Blue tart berries for jelly.', ['Spiny leaves. Berries are very tart.'], 'h_shrubs'),
    grow('g_chicory', 'Chicory', 'Cichorium intybus', 'chicory', 'Leaves; roasted root as a coffee extender.', ['Allergy risk if you react to the daisy family.']),
    grow('g_hawthorn', 'Hawthorn', 'Crataegus spp.', 'hawthorn', 'Berries for jelly and tea.', ['Talk to a clinician if you take heart or blood-pressure medicines (Hortica).'])
  );

  /* ---------------------------------------------------------------- COAST AND WATER */
  const coast = [
    {
      id: 'shellfish', kind: 'rule', cat: 'rule', n: 'Shellfish: not a plant, but read this on any coast', latin: '',
      regions: ['ca', 'pnw', 'east'], months: [], monthsNote: '',
      text: ['Mussels, clams and other shellfish can carry natural toxins from algae blooms (red tide). Paralytic shellfish poisoning (tingling lips and tongue, then poor balance, slurred speech, paralysis) and domoic acid poisoning (vomiting, cramps, confusion, seizures, memory loss) are not destroyed by cooking.', 'California closes sport-harvested mussels every year from May 1 through October 31. During that quarantine, mussels may be taken as bait only. Other advisories (for example razor clams in Humboldt County, and several shellfish at the Northern Channel Islands in 2025) can run at any time of year.', 'Call the California Department of Public Health shellfish line, (800) 553-4133, or check the recreational bivalve advisory map before you gather. Other states run their own hotlines: ask the state health or fish agency.', 'Shellfish bought from a certified dealer or restaurant are tested; sport-harvested ones are not.'],
      cautions: [], look: [], lookNone: '', risk: 'high', hortica: false, hid: null, src: S('cdph_sn', 'sd_mussel'), asof: ASOF
    },
    {
      id: 'seaweed', kind: 'seaweed', cat: 'seaweed', n: 'Edible seaweeds: rules first', latin: 'Ulva, Palmaria, Porphyra, Laminaria, Undaria, Fucus',
      regions: ['ca', 'pnw', 'east'], months: [], monthsNote: '',
      part: 'Wild seaweed is food only when the water is clean, the harvest is legal and you can name it.',
      look: [], lookNone: 'No poisonous lookalike among the common edible seaweeds is documented in the source used (Hortica\'s seaweed guide). The real hazards are polluted water, biotoxin closures, heavy metals and iodine, not lookalikes.',
      cautions: ['Check your state or country rules first. Many coasts require a licence, limit how much you may take, or close beaches after pollution or red tide.', 'Never pick near storm drains, harbours, outfalls or after heavy rain. Seaweed concentrates metals and pollutants from the water.', 'Cut with scissors; leave the holdfast and at least two thirds of the plant so it regrows. Pick attached, living plants, not dead wrack on the beach line.', 'Rinse in clean seawater then fresh water, and dry or cook the same day.', 'Iodine overload, heavy metals (especially arsenic in some brown seaweeds) and bacteria are real concerns. Pregnant people, children and anyone with thyroid problems should ask a doctor.', 'Rules for which seaweeds you may take and how much differ by state and are not covered in this guide: read the current fish and wildlife regulations.'],
      src: S('h_land'), asof: ASOF, risk: 'medium', hortica: true, hid: null
    },
    ...[
      ['sealettuce', 'Sea lettuce', 'Ulva spp.', 'Bright green, thin sheets. Rinse and eat fresh in salads or soup, or dry it. Common on rocks in sheltered bays.'],
      ['dulse', 'Dulse', 'Palmaria spp.', 'Reddish-purple, leathery fronds. Pan-fry or dry. Found low on rocky shores in cold water.'],
      ['nori', 'Nori or laver', 'Porphyra / Pyropia spp.', 'Thin purple to brown sheets on upper rocks. Rinse well, dry flat in the sun or oven.'],
      ['kelp', 'Kelp, kombu, sugar kelp', 'Laminaria, Saccharina spp.', 'Long brown straps. Dry for broth. Very high in iodine, so go easy, especially with thyroid trouble.'],
      ['wakame', 'Wakame', 'Undaria pinnatifida', 'Frilly brown fronds with a midrib. Invasive in some regions, so check local rules.'],
      ['bladderwrack', 'Bladderwrack', 'Fucus spp.', 'Brown with air bladders. Mostly used in baths and teas; high in iodine.']
    ].map(x => ({
      id: x[0], kind: 'seaweed', cat: 'seaweed', n: x[1], latin: x[2], regions: ['ca', 'pnw', 'east'], months: [], monthsNote: 'Seasons depend on the species and the shore; check local sources.',
      habitat: 'Rocky shores and sheltered bays.', part: x[3], prep: '', see: [],
      look: [], lookNone: 'No poisonous lookalike is named in the source used. Water quality, biotoxin closures, metals and iodine are the hazards. If you cannot identify it for certain, leave it.',
      cautions: ['Follow the seaweed rules above: clean water, legal harvest, take little, never dead wrack.'], legal: 'Licence and quantity rules vary by state and are not verified here.',
      risk: 'medium', hortica: true, hid: null, src: S('h_land'), asof: ASOF
    })),
    {
      id: 'glasswort', kind: 'grow', cat: 'marsh', n: 'Glasswort (pickleweed, samphire)', latin: 'Salicornia and relatives',
      regions: ['ca', 'pnw', 'east'], months: [8, 9], monthsNote: 'Hortica: harvest tips in late summer.',
      habitat: 'Salt marsh edges on the Pacific, Atlantic and Gulf coasts.', part: 'Crisp green jointed stems; steamed tips, pickles, salad.', prep: '', see: [],
      look: [], lookNone: 'Wild lookalikes were not verified for this guide. Marshes also collect pollution and are often protected. Hortica describes how to grow it in a salty bed.',
      cautions: ['Do not harvest in protected marshes.'], legal: 'Salt marshes are often protected; do not pick without permission.',
      risk: 'unverified', hortica: true, hid: 'glasswort', src: S('h_coast'), asof: ASOF
    },
    {
      id: 'cattail', kind: 'forage', cat: 'water', n: 'Cattail (lake and marsh plant)', latin: 'Typha latifolia',
      regions: ALL, months: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3], monthsNote: 'Different parts at different seasons: spring shoots, early summer green spikes, midsummer pollen, fall and winter roots.',
      habitat: 'Wetlands, marshes, ponds, ditches and lake edges; plants up to about 10 ft.',
      part: 'Spring shoots (peeled to the white core), green flower spikes in late spring, pollen in summer, starchy rhizomes in fall and winter.', prep: 'Always cook. Wash well. Cook rhizomes thoroughly (char, then peel) and peel shoots to the tender core. Pollen is shaken into a bag, and is used in small amounts mixed with other flour.',
      see: ['Leaves about 1 inch wide, sword-like, spongy, with NO central rib; the leaf bases wrap tightly round the stalk.', 'A dark brown, dense, sausage-shaped female flower spike sits below a thinner male part at the top (spike remnants stay all winter).', 'Grows in standing or slow water, the stalk rising from a thick root system.'],
      look: [{ n: 'Yellow flag iris and blue flag iris', latin: 'Iris pseudacorus, Iris versicolor', level: 'toxic', diff: 'Spring shoots can look nearly identical. Iris leaves are flat, fan out from the base in one plane, and have a hard central rib or ridge; iris makes flowers, not a brown cigar-shaped spike. All parts of iris are toxic (mildly to more). Use last year\'s brown spikes standing beside the shoots to be sure you are in a cattail patch.' }],
      lookNone: '',
      cautions: ['Cattails absorb pollutants and metals from their water. Pick only from clean water: not roadside ditches, farm runoff, industrial or polluted urban water. If unsure, do not eat.', 'Wild water can carry giardia and other germs, so cook rhizomes thoroughly. Do not use cattail as a water treatment of any kind.'],
      legal: 'Wetlands are often protected; digging is prohibited on most public land.',
      risk: 'medium', hortica: true, hid: 'cattail', src: S('wc_cattail', 'pei_cattail', 'fa_cattail', 'h_wet'), asof: ASOF
    },
    {
      id: 'watercress', kind: 'grow', cat: 'water', n: 'Watercress', latin: 'Nasturtium officinale',
      regions: ALL, months: [], monthsNote: '', habitat: 'Cool running or shallow clean water.', part: 'Peppery greens.', prep: '', see: [],
      look: [], lookNone: 'Wild watercress grows next to poisonous water plants and in water that can carry pond parasites. Wild lookalikes were not verified for this guide, so grow it in a clean tub (see Hortica) rather than picking it wild.',
      cautions: ['Hortica: clean water only, as it can carry pond parasites.'], legal: '', risk: 'unverified', hortica: true, hid: 'watercress', src: S('h_wet'), asof: ASOF
    }
  ];

  /* ---------------------------------------------------------------- MUSHROOMS: DANGER GUIDE */
  const NOTE_GROUPS = 'This list is not verified in this build and is not an instruction to eat anything. It names groups that mushroom clubs commonly teach early. Ask a local mycological society to teach you in person.';
  const fungi = [
    { id: 'f_rule', kind: 'headline', n: 'The only safe rule', text: ['Never eat a wild mushroom because of an app, a photo, a book alone, a friend\'s say-so or a video. Eat only a mushroom that a person trained to identify mushrooms where you live has examined, in person, as a whole specimen.', 'Even experienced hunters are fooled by lookalikes. Knowing mushrooms from another country or region does not carry over. Some deadly mushrooms are plain white or brown and taste mild.', 'This app does not identify mushrooms and never will. It teaches which groups kill and what to do if someone has eaten one.'], src: S('poison_org', 'sci_mush', 'sd_cahan'), asof: ASOF },
    {
      id: 'f_amanita', kind: 'deadly', n: 'Death cap and destroying angels', latin: 'Amanita phalloides, A. ocreata, A. virosa, A. bisporigera, A. verna',
      toxin: 'Amatoxins (liver destroyers). Cooking, freezing or drying do not break them down.', tox: 'Amatoxins: liver',
      how: ['Look plain, often white, pale green or brown, and taste mild.', 'Symptoms start 6 to 24 hours after eating: vomiting, cramps, watery diarrhea. They may then ease for a day or so. That is a false recovery: liver damage is under way and can end in liver failure, transplant or death 1 to 4 days after eating.', 'Death cap has spread widely in California; a 2025 California advisory reported severe cases, acute liver failure and at least one death.'],
      do: 'Anyone who ate a wild mushroom and has these symptoms needs the emergency room, even if they felt better yesterday.', src: S('wikem', 'sd_cahan', 'county_mush'), asof: ASOF
    },
    {
      id: 'f_galerina', kind: 'deadly', n: 'Deadly galerina and small lookalikes', latin: 'Galerina spp., small Lepiota spp.',
      toxin: 'Amatoxins, the same liver poison as death cap.', tox: 'Amatoxins: liver',
      how: ['Small mushrooms. They are easy to overlook, and are dangerous because the same lethal toxin can sit in little, unremarkable mushrooms, not only in big showy ones.', 'Symptoms and timing are the same as for death cap.'],
      do: 'Treat any unknown small mushroom, even one that looks like a harmless "little brown mushroom", as unfit to eat.', src: S('wikem', 'sd_cahan'), asof: ASOF
    },
    {
      id: 'f_cort', kind: 'deadly', n: 'Cortinarius (webcaps)', latin: 'Cortinarius spp.',
      toxin: 'Orellanine, which damages the kidneys.', tox: 'Orellanine: kidneys',
      how: ['Symptoms may not appear for 1 to 3 days, and sometimes up to 2 weeks, so the cause is often missed.', 'Kidney failure can follow and may be permanent.'],
      do: 'A late kidney illness after eating any wild mushroom is an emergency. Tell the doctor about the mushroom.', src: S('wikem'), asof: ASOF
    },
    {
      id: 'f_gyro', kind: 'deadly', n: 'False morels', latin: 'Gyromitra esculenta and relatives',
      toxin: 'Gyromitrin.', tox: 'Gyromitrin: liver, seizures',
      how: ['Onset about 6 to 12 hours: stomach symptoms, then possible liver failure, seizures and blood damage.', 'Poison Control notes that fumes from cooking some poisonous mushrooms can themselves be harmful.', 'Mushroom clubs teach morels carefully because false morels exist.'],
      do: 'Do not eat any wild morel-like mushroom until a local expert has checked it in person.', src: S('wikem', 'poison_org'), asof: ASOF
    },
    {
      id: 'f_ifate', kind: 'ifate', n: 'If someone ate an unknown mushroom',
      steps: ['Call Poison Control now: 1-800-222-1222 (US, free, 24 hours). Do this before symptoms, not after. Outside the US call your local poison centre or emergency number.', 'Call 911 (or your local emergency number) for confusion, a seizure, trouble breathing, fainting, or severe vomiting. If you are far from a road or signal, send someone for help while you keep the person warm and hydrated.', 'Keep what is left of the mushroom (and any vomit) in a paper bag, not plastic, for the doctors.', 'Write down what it looked like, where it grew and when it was eaten.', 'Go to the emergency room even if the person feels better. Symptoms often start 6 to 24 hours later, may seem to pass, and the worst damage can show 1 to 4 days later.', 'Pets: call a veterinarian or the ASPCA Animal Poison Control Center, 1-888-426-4435.'],
      src: S('poison_org', 'county_mush', 'sci_mush', 'sd_cahan'), asof: ASOF
    },
    { id: 'm1', kind: 'myth', n: 'Myth: cooking, freezing or drying makes it safe', fact: 'Amatoxins are heat-stable. Cooking, freezing or drying does not destroy them.', src: S('county_mush', 'sd_cahan', 'sci_mush'), asof: ASOF },
    { id: 'm2', kind: 'myth', n: 'Myth: you can tell by taste or smell', fact: 'Deadly mushrooms are not reliably distinguishable by taste, smell or how they are cooked. Some taste mild.', src: S('sd_cahan', 'sci_mush'), asof: ASOF },
    { id: 'm3', kind: 'myth', n: 'Myth: if animals eat it, it is safe', fact: 'Different species handle toxins differently. A mushroom a squirrel eats can kill a person.', src: S('sci_mush'), asof: ASOF },
    { id: 'm4', kind: 'myth', n: 'Myth: a silver spoon, peeling the cap, or any home test works', fact: 'There is no simple field test or single feature that reliably says a mushroom is poisonous. Experts check many features at once, including the base of the stalk (dig up the whole mushroom), spores and habitat.', src: S('sci_mush', 'poison_org'), asof: ASOF },
    { id: 'm5', kind: 'myth', n: 'Myth: poisonous ones are colourful or taste bad', fact: 'Some of the deadliest are plain white or brown and mild-tasting.', src: S('sci_mush'), asof: ASOF },
    { id: 'm6', kind: 'myth', n: 'Myth: I feel fine, so I\'m fine', fact: 'Poisoning can show 6 to 24 hours later, ease for a day, and then destroy the liver. Feeling better is not the all clear.', src: S('sd_cahan', 'wikem'), asof: ASOF },
    { id: 'm7', kind: 'myth', n: 'Myth: an app or a photo can identify it', fact: 'Poison Control tells people to eat a wild mushroom only if an identification expert has confirmed it. Photos cannot show the base, spore print, smell or habitat. This app does not identify mushrooms.', src: S('poison_org', 'sci_mush'), asof: ASOF },
    ...[
      ['g_morel', 'Morels', 'Morchella', 'morel', 'Mushroom clubs teach morels carefully because false morels (Gyromitra, above) cause serious poisoning.'],
      ['g_chanterelle', 'Chanterelles', 'Cantharellus', null, 'Ask your club which lookalikes grow in your area.'],
      ['g_puffball', 'Giant puffballs', 'Calvatia', null, 'Clubs teach to cut every puffball in half: young deadly Amanita can look like a small puffball. Ask your club.'],
      ['g_chicken', 'Chicken of the woods', 'Laetiporus', null, 'Some people react to it; ask your club.'],
      ['g_hen', 'Hen of the woods (maitake)', 'Grifola frondosa', 'maitake', 'Ask your club which lookalikes grow in your area.'],
      ['g_oyster', 'Oyster mushrooms', 'Pleurotus', 'oyster', 'Ask your club which lookalikes grow in your area.'],
      ['g_lionsmane', 'Lion\'s mane and tooth fungi', 'Hericium', 'lionsmane', 'Ask your club which lookalikes grow in your area.'],
      ['g_shaggymane', 'Shaggy mane', 'Coprinus comatus', 'shaggymane', 'Ask your club how fast it spoils and how to handle it.'],
      ['g_blacktrumpet', 'Black trumpets', 'Craterellus', null, 'Ask your club which lookalikes grow in your area.'],
      ['g_cauliflower', 'Cauliflower mushroom', 'Sparassis', 'cauliflower', 'Ask your club which lookalikes grow in your area.']
    ].map(x => ({ id: x[0], kind: 'group', n: x[1], latin: x[2], hid: x[3], watch: x[4], say: 'A local mycological society can teach you to identify ' + x[1].toLowerCase() + ' safely.', src: null, note: NOTE_GROUPS, asof: ASOF })),
    { id: 's_cms', kind: 'society', n: 'Cascade Mycological Society (Oregon)', url: 'https://cascademyco.org/resources/mushroom-picking-permits/', note: 'A mushroom club with "Mushroom ID Help" and "Mushroom Hunting Safety" pages, forays and meetings. Its permit page summarises Oregon rules (last reviewed September 2026).', src: S('cms'), asof: ASOF },
    { id: 's_psms', kind: 'society', n: 'Washington public-land mushroom rules (summary kept by the Puget Sound Mycological Society, 2016)', url: 'https://mail.psms.org/WAMushroomRulesMay2016.pdf', note: 'A 2016 summary of permits, quantities and closures for Washington. It is old: check the current rules.', src: S('psms'), asof: ASOF },
    { id: 's_find', kind: 'society', n: 'A club near you', url: null, note: 'Search "mycological society" and your state or city. The North American Mycological Association lists affiliated clubs (its link was not verified for this build, so it is not shown). Go on a club foray and let people who know the local mushrooms teach you in the field.', src: [], asof: ASOF },
    { id: 's_hortica', kind: 'society', n: 'Want mushrooms to eat? Grow them (Hortica)', url: null, note: 'Hortica lists 35 cultivated mushrooms (oyster, shiitake, lion\'s mane, wine cap and more) to grow from labelled kits and spawn. Never use wild-collected mushrooms as "spawn", and do not pick lookalikes of cultivated kinds in the wild.', src: S('h_fungi'), asof: ASOF }
  ];

  /* ---------------------------------------------------------------- USEFUL PLANTS (not food) */
  const GEN = 'General practice, not individually sourced in this build: learn it in person from an instructor.';
  const useful = [
    {
      id: 'u_water', cat: 'water', n: 'Water: no plant makes it safe to drink', latin: '',
      text: ['No plant, charcoal, sand, cloth, grass or "natural filter" makes untreated water safe to drink. Clear water can still hold germs.', 'The reliable fixes are: boil (a rolling boil for 1 minute; 3 minutes above 6,500 ft), or a filter rated to 1 micron or finer (NSF 53 or 58) plus a disinfectant for viruses, or a certified purifier. Filters at 1 micron remove parasites but not viruses.', 'Let muddy water settle and pour off the clear top, or strain it through a clean cloth FIRST: that only helps your filter or boiling work. It is clarifying, not purifying.', 'Boiling and disinfecting do not remove chemical contamination or toxins. If water is near mines, factories or farm runoff, find another source.', 'A common rule of thumb is about three days without water and weeks without food, but it varies a lot, and hot weather can kill in hours. Water, shelter and a plan to be found come before any food.'],
      cautions: [], look: [], lookNone: '', risk: 'high', src: S('cdc_water', 'mn_water', 'wiki_r3'), asof: ASOF
    },
    {
      id: 'u_fire', cat: 'fire', n: 'Fire: tinder and fuel plants', latin: '',
      text: ['Tinder is dry, fine and fluffy: dry grass, the dry fibrous inner bark and fallen shreds of some trees, and the seed down of some plants. Fuel is dead, dry wood that snaps. Pine resin and resin-soaked wood (fatwood) light easily.', 'Before you light any fire check current fire restrictions and whether a campfire permit is needed. Use dead and down wood only. Do not cut or strip living trees, and take birch bark only where it has already peeled off a fallen tree and where picking is allowed.', 'Keep the fire small, clear to bare mineral soil, and never leave it unattended; drown, stir and feel it cold before you leave.'],
      cautions: ['Wet, green wood and bark smoke heavily. Sap and resin spit and burn hot.'], look: [], lookNone: '', basis: GEN, risk: 'medium', src: S('blm', 'fs_klamath'), srcNote: 'Dead-and-down wood and fire-restriction rules come from BLM and a U.S. Forest Service page. The tinder types are general bushcraft practice.', asof: ASOF
    },
    {
      id: 'u_cord', cat: 'cord', n: 'Cordage plants', latin: 'Yucca, dogbane, nettle stalks, inner bark strips',
      text: ['Long tough plant fibre can be twisted into cord: leaves of yucca, stalks of stinging nettle and dogbane, and inner-bark strips of willow and some other trees are the commonly named ones.', 'It is a hands-on skill; ask an instructor. In an emergency, strips of cloth, bootlaces and pack straps are easier.', 'Stinging nettle must be handled with gloves until dried or processed. Yucca leaf tips are sharp. Dogbane sap can irritate skin.'],
      cautions: ['Never strip bark from living trees: it kills them and is illegal on most public land.'], look: [], lookNone: '', basis: GEN, risk: 'low', src: [], asof: ASOF
    },
    {
      id: 'u_shelter', cat: 'shelter', n: 'Shelter insulation: leaves, grass and boughs', latin: '',
      text: ['The ground can pull heat away from you quickly. A thick layer of dry leaves, dry grass or evergreen boughs under and over you slows heat loss; build it thicker than seems reasonable.', 'Use what is already dead and on the ground. Do not break limbs off living trees. Avoid wet, mouldy or ant-filled material.', 'Shelter comes before food or tea. Staying dry and out of the wind protects you from hypothermia, which kills faster than hunger.'],
      cautions: ['Keep fire and insulation apart. Dry leaves ignite easily.'], look: [], lookNone: '', basis: GEN, risk: 'low', src: [], asof: ASOF
    },
    {
      id: 'u_soap', cat: 'soap', n: 'Soap plants: yucca', latin: 'Yucca glauca and relatives',
      text: ['Roots of soapweed yucca were pounded for soap by Great Plains tribes (Hortica). The plant\'s saponins make suds.', 'Saponins are toxic to pets and livestock if chewed (Hortica), and leaf tips are needle-sharp.', 'Keep any soap, even plant soap, out of streams and lakes; wash at least 200 feet (about 70 steps) away from water.'],
      cautions: ['Do not rely on a plant soap for wound cleaning.'], look: [], lookNone: '', risk: 'low', src: S('h_succ'), asof: ASOF
    },
    {
      id: 'u_bandage', cat: 'bandage', n: 'Plantain poultice (folk use only)', latin: 'Plantago major',
      text: ['Plantain, the common lawn weed, has a long folk history as a fresh leaf poultice for insect bites and minor cuts (Hortica).', 'It is folk use, not first aid. Clean a wound with clean water, cover it with a clean dressing and see a clinician for deep, dirty or gaping wounds. Do not use plantain on deep wounds.', 'Make sure the plant is plantain, from a clean place, before putting it on skin.'],
      cautions: [], look: [], lookNone: '', risk: 'low', src: S('h_herbs'), asof: ASOF
    },
    {
      id: 'u_avoid_oak', cat: 'avoid', n: 'Poison oak, poison ivy and poison sumac: do not touch', latin: 'Toxicodendron spp.',
      text: ['Poison oak causes an itchy skin rash in people who are sensitive. It often grows tangled in with other shrubs, including blackberry thickets (National Park Service). Blackberries have sharp thorns; poison oak does not.', 'Poison sumac has white berries (Hortica). Staghorn sumac, a different plant with red fruit cones, is not related.', 'The oil can stay on clothing, tools, pets and boots. If you touch it, wash skin and clothing as soon as you can; see a clinician for rashes on the face, near the eyes or covering large areas, or any breathing trouble. Never burn it: the smoke can injure lungs.'],
      cautions: [], look: [], lookNone: '', risk: 'medium', src: S('nps_shrubs', 'h_shrubs'), srcNote: 'Washing and never burning are general guidance.', asof: ASOF
    },
    {
      id: 'u_avoid_nettle', cat: 'avoid', n: 'Stinging nettle: handle with gloves', latin: 'Urtica dioica',
      text: ['Fresh nettle stings on contact. Cooking or drying removes the sting (Hortica).', 'Wear gloves to pick it. Sting relief: do not scratch; rinse with water.'],
      cautions: [], look: [], lookNone: '', risk: 'low', src: S('h_herbs'), asof: ASOF
    },
    {
      id: 'u_repel', cat: 'repel', n: 'Insect repellent plants: not reliable', latin: '',
      text: ['Rubbing leaves on skin, burning plants or wearing herbs is not a dependable defence against mosquitoes or ticks.', 'Use long clothing treated with permethrin (clothing only), tuck pants into socks, check yourself for ticks every day, and use an EPA-registered repellent on skin.'],
      cautions: ['Some plants cause rashes when crushed on skin.'], look: [], lookNone: '', basis: GEN, risk: 'low', src: [], asof: ASOF
    }
  ];

  window.FORAGE = {
    meta: { version: 1, asof: ASOF, regions: [['ca', 'California'], ['pnw', 'Pacific Northwest'], ['rockies', 'Rockies and Great Basin'], ['sw', 'Southwest deserts'], ['east', 'East and central']], U },
    plants, fungi, coast, useful
  };
})();
