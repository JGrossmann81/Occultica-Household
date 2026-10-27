/* Hortica flower library, batch 2: more annuals, perennials and cut flowers. Same 19 fields as flowers.js.
   id|emoji|name|cat|family|sun|water|feed|spacing(in)|days to first bloom|bloom weeks|sowing|pH|zones|height(in)|moon|varieties|how to grow|old-timer tip */
const FLOWER2_TXT = `
cosmossulphur|🌼|Sulphur cosmos|fl|ast|F|1|L|12|60|14|d+1|6.0-7.5|-|48|u|Bright Lights, Cosmic Orange, Ladybird|Orange and gold cosmos that loves heat and poor dry soil. Direct sow after frost, because it sulks in cold ground. Self-sows freely and butterflies cover it.|Skip the fertilizer or you get leaves and no flowers.
cosmoschocolate|🌺|Chocolate cosmos|fl|ast|F|2|L|12|110|14|t+1|6.5-7.5|7-10|24|d|Choca Mocha, Hot Chocolate|Maroon flowers that smell faintly of chocolate. It grows from a tuber and is tender, so treat it like a dahlia. Never sets seed, so it must be propagated by tuber or cutting. Needs sharp drainage in winter.|Mulch heavily or lift the tubers where winters freeze.
stock|🌸|Stock|fl|bra|F|2|M|10|90|6|i-8 t-3|6.5-7.5|-|24|u|Katz, Cinderella, Ten Week, Column|Cool-season spikes with a strong clove scent that fade in summer heat. Set out early so they bloom before the weather warms. It is a brassica relative and gets cabbage pests.|Plant where you will smell it, by a door or window.
larkspur|🌸|Larkspur|fl|ran|F|2|M|10|85|6|d-6 f-4|6.5-7.5|-|48|u|Giant Imperial, Earlibird, QIS|Annual cousin of delphinium for cutting. Sow in fall or very early spring because the seed needs cold and hates transplanting. Support tall stems. All parts are poisonous.|Chill the seed in the fridge two weeks if you sow late.
bellsofireland|🌿|Bells of Ireland|fl|lam|F|2|M|10|110|8|i-8 t-1|6.0-7.0|-|36|u|Tall Green, Green Bells|Green bell-shaped calyxes on tall spikes, loved by florists. Seed needs light and cold to sprout, so chill it first and do not cover it. Fresh or dried.|Strip the leaves right away for neater dried stems.
mealycupsalvia|🌸|Mealycup sage|fl|lam|F|1|L|12|80|18|i-8 t+0|6.0-7.5|-|24|u|Victoria Blue, Evolution, Strata|Blue-violet spikes on silvery stems that bloom until frost. Tough in heat and dry spells, perennial in zones 8 and warmer. Bees visit and deer leave it alone.|Cut it back by half in midsummer for fall bloom.
scarletsage|🌺|Scarlet sage|fl|lam|P|2|M|12|85|16|i-8 t+0|6.0-7.0|-|18|u|Vista Red, Salsa, Lady in Red|Bright red spikes that hummingbirds visit. Tolerates part shade and likes steady moisture. Not hardy below zone 9.|Pinch young plants once for bushier growth.
impatiens|🌸|Impatiens|fl|bal|S|3|M|10|75|20|i-10 t+1|5.5-6.5|-|12|u|Super Elfin, Accent, Beacon (mildew resistant)|Shade bedding color all summer. Needs steady water and wilts quickly when dry. Common impatiens is hit hard by downy mildew, so choose resistant Beacon types and avoid overhead watering.|Pinch leggy plants back in July.
newguineaimpatiens|🌺|New Guinea impatiens|fl|bal|P|3|M|14|70|20|t+1|5.5-6.5|-|18|u|Sunpatiens, Harmony, Divine|Bigger, sun-tolerant relative of impatiens with bold leaves and downy mildew resistance. Keep it watered and feed lightly each month.|Grows well in pots that get half-day sun.
coleus|🍃|Coleus|fl|lam|P|2|M|14|50|0|i-8 t+1|6.0-7.0|-|24|u|Wizard, Kong, Sedona, Wasabi|Grown for painted leaves, not flowers. Pinch off the flower spikes to keep it bushy. Takes cuttings in a glass of water easily. Frost kills it. Mildly toxic to cats and dogs.|Root cuttings in August to keep plants over winter indoors.
waxbegonia|🌸|Wax begonia|fl|beg|P|2|M|8|80|22|i-12 t+1|5.5-6.5|-|10|u|Cocktail, Baby Wing, Whopper|Tidy, waxy edging that takes sun or shade and blooms nonstop. Very slow from seed, so most people buy plants. Do not overwater, since rot follows. Toxic to pets.|Bronze-leaf types handle full sun best.
torenia|🌸|Wishbone flower|fl|lin|P|2|M|8|75|18|i-8 t+1|5.5-6.5|-|10|u|Moon, Kauai, Summer Wave|Shade-tolerant trailing annual with small orchid-like blooms, a fine edge for part-shade beds. Hummingbirds visit. Keep moist in heat.|Shear it halfway in August to renew.
shirleypoppy|🌺|Shirley poppy|fl|pap|F|1|L|8|65|6|d-6|6.0-7.5|-|30|u|Mother of Pearl, Falling in Love, Ladybird|Silky paper-thin poppy with no black centers. Scatter seed on bare soil in early spring or fall and do not transplant. Blooms for a few weeks, then sow another batch. The sap is mildly toxic.|Sow in succession every two weeks until May.
icelandicpoppy|🌼|Icelandic poppy|fl|pap|F|2|M|8|90|10|i-10 t-4|6.0-7.5|2-8|16|u|Champagne Bubbles, META, Garden Gnome|Crinkled cup flowers on wiry stems that like cool weather and fade in heat. Short-lived perennial grown as a cool-season annual in most places. Good cut flower if you sear stem ends in flame or hot water.|Bud gets picked just as it cracks open.
orientalpoppy|🌺|Oriental poppy|fl|pap|F|1|L|30|730|3|dm|6.0-7.5|3-8|36|d|Brilliant, Patty's Plum, Turkenlouis|Big papery blooms in late spring on a perennial that goes dormant by midsummer. Plant where later perennials can cover the gap. Hates wet soil and moving. Toxic in quantity.|Plant it behind baby's breath to hide the summer gap.
carnation|🌸|Carnation|fl|car|F|2|M|10|110|10|i-10 t-3|6.7-7.5|6-9|20|u|Chabaud, Grenadin, Enfant de Nice|Ruffled, clove-scented florist's flower. Needs sun, lime and sharp drainage. Short-lived perennial. Disbud for large single stems. Mildly toxic to cats and dogs.|Stake early: stems flop in rain.
hornedviola|🌼|Horned viola|fl|vio|P|2|M|6|75|20|i-10 t-4|5.5-6.8|4-8|6|u|Sorbet, Penny, Etain|Smaller, tougher cousin of pansy that blooms in cool weather and tolerates some heat. Flowers are edible. Short-lived perennial that self-sows.|Trim hard when it gets leggy in July.
hardygeranium|🌸|Hardy geranium (cranesbill)|fl|ger|P|2|L|18|730|8|dm pe|5.5-7.5|4-8|18|d|Rozanne, Biokovo, Johnson's Blue, Max Frei|True perennial geranium, not the potted kind. Mounding foliage and long blooms, best in part shade. Deer and rabbits mostly skip it. Rozanne blooms all summer.|Shear hard after the first flush.
lambsear|🌿|Lamb's ear|fl|lam|F|1|L|18|365|6|dm pe|6.0-7.5|4-8|10|d|Helene von Stein, Silver Carpet, Big Ears|Silver felted foliage for edges. Rots in humid summers or wet soil. Remove spent flower stalks and rotting leaves. Spreads slowly.|Leaves make a soft old-time bandage, but modern gardeners just enjoy the touch.
russiansage|🌸|Russian sage|fl|lam|F|1|L|30|365|12|dm pe|6.5-8.0|4-9|48|d|Little Spire, Blue Jean Baby, Denim 'n Lace|Silver-gray stems with hazy lavender flowers. Thrives in heat, poor soil and drought. Cut to 8 inches in spring. Deer and rabbits leave it alone.|Do not feed or overwater: it flops.
baptisia|🌸|False indigo|fl|leg|F|1|L|36|730|3|dm pe|6.0-7.0|3-9|40|d|Purple Smoke, Twilight Prairie Blues, Solar Flare|Long-lived native perennial with indigo spikes and handsome blue-green foliage. Slow the first two years, then huge and trouble-free with a deep taproot. Do not move it. Seed pods rattle in fall. Toxic if eaten.|Plant it once where it can stay for decades.
rosemallow|🌺|Rose mallow|fl|mal|F|3|H|48|365|6|dm pe|5.5-7.0|4-9|60|d|Lord Baltimore, Luna, Summerific|Dinner-plate hibiscus on a perennial that dies to the ground each winter and emerges very late in spring. Loves wet soil. Japanese beetles love it too.|Do not panic if it is not up by late May.
shastadaisy|🌼|Shasta daisy|fl|ast|F|2|M|18|365|8|dm pe|6.0-8.0|4-9|30|d|Becky, Alaska, Daisy May|Classic white daisy for cutting. Blooms best in full sun and rich soil. Divide every two or three years. Deer usually leave it alone. Toxic to cats and dogs if eaten.|Becky stands up in heat better than most.
painteddaisy|🌸|Painted daisy|fl|ast|F|2|M|18|365|4|dm pe|6.0-7.5|3-7|24|d|Robinson's Red, James Kelway, Duro|Ferny foliage and bright daisies in late spring. The dried flowers are the source of pyrethrum insecticide. Cut back after bloom to tidy it up. Mildly toxic to pets.|Stake in windy spots.
gerbera|🌼|Gerbera daisy|fl|ast|F|2|H|12|120|16|t+1|5.5-6.5|8-10|14|u|Garvinea, Revolution, Sweet series|Bright daisies on bare stalks. Perennial in warm zones and grown as a pot annual in cold ones. Keep the crown above soil level or it rots. Likes morning sun and afternoon shade in hot places.|Plant it a little high.
balloonflower|🌸|Balloon flower|fl|cam|F|2|L|18|730|10|dm pe|6.0-7.0|3-8|24|d|Fuji Blue, Astra Blue, Sentimental Blue|Puffed buds pop open into star flowers. Slow to appear in spring, so mark where it is. Dislikes being moved because of its taproot. Deer leave it alone.|Pinch young shoots once in May to keep it from flopping.
agastache|🌸|Hummingbird mint|fl|lam|F|1|L|18|120|12|dm pe|6.5-7.5|5-9|36|d|Blue Fortune, Black Adder, Ava, Acapulco series|Licorice-scented spikes beloved by hummingbirds and bees. Likes sun and sharp drainage. Short-lived in wet winter soil. Leaves are edible and make tea. Deer and rabbits skip it.|Leave seedheads for finches.
veronica|🌸|Spike speedwell|fl|scr|F|2|M|18|365|8|dm pe|6.0-8.0|3-8|20|d|Royal Candles, Sunny Border Blue, Goodness Grows|Violet-blue spikes for edges and borders. Deadhead for repeat bloom. Bees and butterflies come. Rarely bothered by deer.|Divide in spring every few years.
bonariensis|🌸|Tall verbena|fl|ver|F|1|L|18|110|20|i-10 t+0|6.0-7.5|7-10|60|u|Lollipop, Buenos Aires, Meteor Shower|Airy purple clusters on tall wiry stems. See-through, so plant it among other flowers. Self-sows freely. Butterflies and bees are always on it.|Let a few seedlings come up each year.
clarkia|🌸|Clarkia (godetia)|fl|ony|F|1|L|8|75|8|d-6 f-4|6.0-7.0|-|24|u|Grace, Satin, Mosaic|California wildflower in silky pastels. Likes cool weather and lean soil. Direct sow because it dislikes transplanting. Good cut flower.|Sow in fall in mild climates.
autumnsage|🌺|Autumn sage|fl|lam|F|1|L|24|365|20|dm pe|6.5-8.0|6-9|30|d|Furman's Red, Hot Lips, Heatwave|Small shrubby salvia that blooms in spring and fall. A hummingbird favorite in dry gardens. Needs sharp drainage. Deer tend to pass it by.|Trim lightly in spring, never in fall.
bellflower|🌸|Bellflower|fl|cam|P|2|M|18|365|8|dm pe|6.0-7.5|3-8|20|d|Birch Hybrid, Blue Clips, Dickson's Gold|Clump or spreading perennial with blue, purple or white bells. Some kinds, like creeping bellflower, spread aggressively by roots, so choose clumping types. Slugs sample it.|Shear after bloom to tidy.
canterburybells|🌸|Canterbury bells|fl|cam|F|2|M|18|365|6|d-8|6.0-7.5|3-8|30|u|Champion, Cup and Saucer|Biennial with big paper bells in early summer. Sow in summer for flowers the next year. Pairs well with foxglove and delphinium. Self-sows.|Mark the rosettes so you do not weed them.
amsonia|🌸|Bluestar|fl|apo|P|2|L|30|730|3|dm pe|5.5-7.0|3-9|36|d|Blue Ice, Storm Cloud, Hubrichtii|Native perennial with steely blue flowers in spring and gold fall color. Easy and long-lived. Deer resistant. The milky sap can irritate skin.|Needs no division and little fuss.
monkshood|🌸|Monkshood|fl|ran|P|3|M|18|730|4|dm|6.0-7.0|3-7|48|d|Arendsii, Bressingham Spire, Stainless Steel|Hooded deep blue spikes in late summer. Every part is extremely poisonous, and handling it can cause skin numbness. Plant it where children and pets cannot reach. Deer and gophers leave it alone.|Wear gloves and wash hands after handling.
linaria|🌸|Toadflax|fl|scr|F|1|L|6|75|10|d-6|6.0-7.0|-|12|u|Fantasy, Licilia, Northern Lights|Tiny snapdragon-like flowers in crowds. Easy cool-season annual from seed. Plant in cool spring soil.|Mix a bag of seed through the bed in early spring.
calibrachoa|🌺|Calibrachoa (million bells)|fl|sol|F|2|H|10|60|24|t+0|5.5-6.5|9-11|8|u|Superbells, Kabloom, Cabaret|Mini petunia lookalike for baskets and pots. Needs acidic soil and regular feeding, since yellowing leaves usually mean low iron. Self-cleaning, so no deadheading.|Use an acid fertilizer if the leaves yellow.
geum|🌺|Avens (geum)|fl|ros|F|2|M|14|365|8|dm pe|5.5-7.0|4-7|20|d|Mrs. Bradshaw, Totally Tangerine, Lady Stratheden|Bright orange, red or yellow blooms in late spring over scalloped leaves. Wants well-drained soil in winter. Cut spent stalks for rebloom.|Dislikes wet feet in winter.
helenium|🌼|Sneezeweed|fl|ast|F|3|M|24|365|8|dm pe|5.5-7.0|3-8|48|d|Mardi Gras, Moerheim Beauty, Ruby Tuesday|Late-summer daisies in rust, red and gold. Pinch in June to keep it shorter. Moisture-loving native. The name comes from old snuff, and the plant is toxic if eaten.|Pinch in June to keep it from flopping.
perennialflax|🌸|Blue flax|fl|lin|F|1|L|12|365|6|dm pe|6.0-8.0|4-9|24|d|Sapphire, Blue Sapphire, Appar|Delicate sky-blue flowers that open in the morning and drop by afternoon. Short-lived but self-sows. Likes drought and poor soil. Deer leave it alone.|Cut it back by a third after bloom.
alstroemeria|🌸|Peruvian lily|fl|alt|F|2|M|18|365|10|dm pe|6.0-7.0|7-10|30|d|Inca series, Indian Summer, Princess series|Orchid-like cut flowers that last two weeks in a vase. Perennial in zones 7 to 10, and a pot plant elsewhere. Pull stems rather than cutting to encourage more. The sap can irritate skin and is toxic to cats and dogs.|Pull stems with a twist, do not cut.
lisianthus|🌸|Lisianthus|fl|gen|F|2|M|8|150|8|i-14 t-1|6.5-7.0|-|24|u|ABC series, Echo, Rosanne|Rose-like florist flower with a long vase life. Seed is dust-fine and slow, so most people buy plants. Needs warmth and even moisture. Pinch for branching.|Start from plants unless you have grow lights.
heliopsis|🌼|False sunflower|fl|ast|F|2|M|30|365|10|dm pe|6.0-7.5|3-9|48|d|Summer Sun, Bleeding Hearts, Loraine Sunshine|Cheery yellow daisies that bloom for months. Tolerates heat and clay. Aphids like it, and so do ladybugs.|Cut back by a third in June for tidier plants.
eryngium|🌸|Sea holly|fl|api|F|1|L|18|365|8|dm pe|6.0-8.0|4-9|30|d|Big Blue, Blue Glitter, Miss Willmott's Ghost|Steel-blue spiny thistle look-alike that dries beautifully. Long taproot, so it does not move. Needs sun and sharp drainage. Spiny leaves can scratch. Deer pass it by.|Cut stems for dried arrangements just as color peaks.
lychnis|🌸|Rose campion|fl|car|F|1|L|12|365|8|dm pe|6.0-8.0|3-8|30|d|Alba, Oculata, Angel's Blush|Fuzzy silver leaves and magenta flowers on a short-lived perennial that self-sows. Thrives in poor soil. Deer and rabbits leave it alone. Seeds are mildly toxic.|Let a few go to seed.
dustymiller|🌿|Dusty miller|fl|ast|F|1|L|10|70|0|i-10 t-2|6.0-7.5|7-10|12|u|Silver Dust, Cirrus, New Look|Silver lacy foliage that sets off brighter colors. Seed is slow, so buy plants. Tolerates frost and drought. Pinch off yellow flowers. The leaves are mildly toxic.|Sets off red and purple like nothing else.
portulaca|🌺|Moss rose|fl|por|F|1|L|8|55|18|d+1|5.5-7.0|-|6|u|Sundial, Yubi, Margarita|Succulent annual for hot, dry, sandy spots. Flowers open in sun and close at night. Self-sows. Will not bloom well in shade or wet soil.|Do not water it much: it likes neglect.
nemesia|🌸|Nemesia|fl|scr|F|2|M|8|75|10|i-8 t-2|5.5-6.5|-|12|u|Sunsatia, Aromatica, Compact Innocence|Cool-season, fragrant, small-flowered annual that fades in summer heat. Plant early or in fall in mild zones. Shear after the first flush.|Plant in early spring for the best show.
diascia|🌸|Twinspur|fl|scr|F|2|M|10|75|16|t-1|6.0-7.0|8-10|12|u|Darla, Flying Colors, Wink|Cool-season pink or salmon flowers for pots and edges. Struggles in hot humid summers. Shear after each flush.|Cut it back by half in July.
bidens|🌼|Bidens|fl|ast|F|2|M|12|65|20|t+0|6.0-7.0|-|10|u|Golden Goodness, Campfire, Bee Dazzle|Trailing golden daisies for pots and baskets. Heat tolerant and nonstop. Pollinators visit. Feed monthly.|Needs no deadheading.
angelonia|🌸|Angelonia|fl|pla|F|2|M|12|75|20|t+1|6.0-7.0|-|18|u|Serena, Angelface, AngelMist|Summer snapdragon with grape-scented foliage and a love of heat. Blooms all summer without deadheading. Deer and rabbits skip it.|Perfect for hot pots.
scaevola|🌸|Fan flower|fl|goo|F|2|M|12|65|20|t+1|6.0-7.0|-|8|u|Whirlwind, New Wonder, Blue Wonder|Trailing plant with one-sided, fan-shaped flowers. Heat and drought hardy, ideal for pots. Does fine in humidity.|Let it dry slightly between waterings.
cuphea|🌺|Cuphea (cigar plant)|fl|lyt|F|2|M|14|75|20|t+0|5.5-7.0|9-11|24|u|Vermillionaire, Tiny Mice, Georgia Scarlet|Tubular orange and red flowers that hummingbirds adore. Heat tolerant and long-blooming. Perennial in zones 9 to 11. Cuttings root easily.|Cut back by a third in midsummer.
spiderwort|🌸|Spiderwort|fl|com|P|2|M|18|365|8|dm pe|5.5-7.0|4-9|24|d|Sweet Kate, Concord Grape, Blue and Gold|Three-petaled flowers that open in the morning and close by afternoon. Easy native perennial that spreads. Cut back after a hot spell for fresh foliage. Sap can irritate skin and the plant is mildly toxic to pets.|Chop it down in midsummer.
globethistle|🌸|Globe thistle|fl|ast|F|1|L|24|730|6|dm pe|6.0-7.5|3-8|48|d|Veitch's Blue, Taplow Blue, Arctic Glow|Steel-blue spiny globes that dry beautifully and attract bees. Needs sun and tolerates poor soil. Deer pass it by. Can self-sow.|Cut globes before they fully open for drying.
amaranthus|🌺|Love-lies-bleeding|fl|ama|F|1|L|24|90|10|d+1|6.0-7.5|-|48|u|Viridis, Hot Biscuits, Pygmy Torch|Dramatic ropes of crimson or green tassels. Heat and drought tolerant. Self-sows. Seeds and leaves are edible, and the grain is nutritious.|Cut tassels for fresh or dried arrangements.
sweetwilliam|🌸|Sweet William|fl|car|F|2|M|8|365|5|d-8|6.5-7.5|3-9|18|u|Dark Beauty, Indian Carpet, Holborn Glory|Biennial pinks with clove-scented clusters in late spring. Sow in summer for flowers next year. Self-sows. Mildly toxic to cats and dogs.|Sow in July and set out in September.
gypsophila|🌸|Baby's breath|fl|car|F|1|L|24|90|6|d-4|6.5-7.5|3-9|30|u|Covent Garden, Bristol Fairy, Festival|Cloud of tiny white flowers for cutting and filling. Prefers alkaline soil and sharp drainage. Sow in succession. Perennial kinds hate being moved. The plant is mildly toxic to pets.|Sow every two weeks for steady cutting.
lavatera|🌺|Annual mallow|fl|mal|F|2|M|24|75|10|d-4|6.0-7.5|-|36|u|Mont Blanc, Silver Cup, Pink Beauty|Fast hibiscus-like annual that makes a shrubby hedge of pink or white funnels. Easy from seed sown in spring. Mildly weedy. Watch for rust.|Direct sow, because transplanting sets it back.
mimulus|🌸|Monkey flower|fl|phr|S|3|M|10|75|10|i-8 t-2|6.0-7.0|-|10|u|Magic, Mystic, Mix|Frilly, spotted flowers for moist, shaded spots. Likes cool weather and steady moisture. Sticky foliage. Perennial in mild zones.|Keep it moist or it quits.
`;
const FLOWER2_INFO_TXT = `
cosmossulphur|b,c,o|Jul-Oct|orange, gold, red|Cut flower.|Butterflies and bees; good filler among vegetables.|None known.
cosmoschocolate|b,c,f,o|Jul-Oct|deep maroon|Cut flower and chocolate-scented novelty.|Pollinators visit. Tuberous like dahlia.|Keep tubers dry in winter. Mildly toxic to pets if eaten.
stock|b,c,f,e,o|Apr-Jun|pink, purple, white, cream|Fragrant cut flower. Flowers are edible.|Cool-season color; brassica pests may follow.|None known.
larkspur|b,c,d,t|Jun-Jul|blue, pink, white, purple|Cut and dried flower.|Self-sowing spikes for cottage beds.|All parts are poisonous to people, pets and livestock.
bellsofireland|b,c,d,o|Jul-Sep|green with white|Fresh and dried cut flower.|Unusual green accent in bouquets.|None known.
mealycupsalvia|b,c,d,o,g|Jun-Oct|blue, violet, white|Cut and dried flower.|Reliable bee plant. Deer skip it.|None known.
scarletsage|b,h,o|Jun-Oct|red, salmon, white|Beds and pots.|Hummingbird favorite.|None known.
impatiens|b|Jun-Oct|pink, red, white, orange|Shade bedding.|Color for shady beds.|Downy mildew is common. Mild stomach upset if eaten.
newguineaimpatiens|b,h|Jun-Oct|pink, red, orange, lavender|Sun and shade pots and beds.|Hummingbirds visit. Mildew resistant.|Mildly irritating if eaten.
coleus|b|Foliage|leaf color: red, lime, burgundy|Foliage bedding and pots.|Color without flowers.|Toxic to cats and dogs if eaten.
waxbegonia|b|May-Oct|pink, red, white|Edging and pots.|Edging for sun or shade.|Toxic to pets if eaten.
torenia|b,h|Jun-Oct|blue, purple, pink, white|Shade pots and baskets.|Shade-tolerant edge. Hummingbirds visit.|None known.
shirleypoppy|b,c,o|May-Jun|pink, white, red, salmon|Cut flower.|Pollen for bees.|Sap is mildly toxic. Seeds are harmless but best not eaten raw in quantity.
icelandicpoppy|b,c,o|Apr-Jun|yellow, orange, white, pink|Cut flower.|Cool-season color.|Sap is mildly toxic.
orientalpoppy|b,o,g|May-Jun|orange, red, pink, white|Showy border plant.|Early-summer drama. Deer skip it.|Plant is mildly toxic if eaten.
carnation|b,c,e,f,o|Jun-Aug|pink, red, white, yellow|Cut flower. Petals are edible but bitter.|Clove scent for beds.|Mildly toxic to pets.
hornedviola|b,e,o,c|Mar-Jun, Sep-Nov|purple, yellow, blue, white|Edible flowers.|Edging with pansies.|Eat only if unsprayed.
hardygeranium|b,o,g|May-Sep|violet, blue, pink, white|Border and groundcover.|Weeds struggle under dense foliage. Deer skip it.|None known.
lambsear|b,d,g|Jun-Jul|silver foliage, pink flowers|Soft foliage edging.|Silver contrast. Deer skip it.|None known.
russiansage|b,o,d,g,f|Jul-Oct|lavender-blue|Dry, hot beds.|Pollinators and drought-proof haze. Deer skip it.|None known.
baptisia|b,c,o,d,g,t|May-Jun|blue, yellow, white|Cut flower and seed pods.|Nitrogen-fixer. Deer skip it.|Toxic if eaten; the seed pods are rattles, not toys.
rosemallow|b,o,h|Jul-Sep|white, pink, red|Large bloom for wet sites.|Hummingbirds visit. Wet-site perennial.|Japanese beetles love it.
shastadaisy|b,c,o,g|Jun-Aug|white|Cut flower.|Pollinators; deer skip it.|Mildly toxic to cats and dogs.
painteddaisy|b,c,o,p,d|May-Jun|red, pink, white|Cut flower. Flowers dried are the source of pyrethrum insecticide.|Said to repel insects, with mixed evidence.|Mildly toxic to pets. Can irritate skin.
gerbera|b,c|Jun-Oct|orange, red, pink, yellow, white|Cut flower.|Cheerful color for pots.|Mildly toxic to pets.
balloonflower|b,c,g|Jun-Sep|blue, white, pink|Cut flower; traditional roots (Platycodon) used as food and medicine in Asia.|Late summer color. Deer skip it.|Do not self-medicate with the root.
agastache|b,c,e,f,h,o,g|Jul-Oct|blue, purple, orange, pink|Leaves make an anise-flavored tea. Cut flower.|Hummingbirds and bees. Deer skip it.|None known.
veronica|b,c,o,g|Jun-Aug|blue, purple, pink, white|Cut flower.|Bees visit. Deer skip it.|None known.
bonariensis|b,c,o|Jun-Oct|purple|Cut flower.|Butterfly magnet. Self-sows.|None known.
clarkia|b,c,o|Jun-Aug|pink, salmon, white, lavender|Cut flower.|Bees visit.|None known.
autumnsage|b,h,o,g,d|May-Oct|red, pink, coral, white|Dry borders.|Hummingbirds visit. Deer skip it.|None known.
bellflower|b,c,o|Jun-Aug|blue, purple, white|Cut flower. Petals are edible.|Spring and summer color.|Some kinds spread aggressively.
canterburybells|b,c,o|Jun-Jul|blue, pink, white|Cut flower.|Bee plant for cottage borders.|None known.
amsonia|b,o,g|Apr-Jun, fall color|pale blue, gold foliage|Native border plant.|Pollinators and fall gold. Deer skip it.|Sap can irritate skin.
monkshood|b,c,g,t|Aug-Oct|deep blue, purple, white|Late-season cut flower with care.|Deer and gophers skip it.|Extremely poisonous in every part, including skin contact. Keep from children and pets.
linaria|b,c,o|May-Aug|pink, purple, yellow, white|Cut filler.|Cool-season edging.|None known.
calibrachoa|b,h|May-Oct|every color|Pots and baskets.|Hummingbirds visit.|None known.
geum|b,c,o,m|May-Jul|orange, red, yellow|Cut flower. Roots of some avens were an old tea for sore throats.|Early color.|Skip the old root remedies; not for self-treatment.
helenium|b,c,o,t|Aug-Oct|rust, red, yellow, gold|Cut flower.|Late-season bee plant.|Toxic if eaten. Pollen can bother hay fever sufferers.
perennialflax|b,o,d,g|May-Jul|sky blue|Light airy border.|Pollinators. Deer skip it.|Fresh flax is not edible. Seed pods of garden flax can be mildly toxic raw.
alstroemeria|b,c,t|Jun-Aug|pink, orange, yellow, white|Long-lasting cut flower.|Vase longevity.|Skin irritant and toxic to cats and dogs if eaten.
lisianthus|b,c|Jun-Sep|white, pink, purple, bicolor|Premium cut flower.|Bridal bouquets.|None known.
heliopsis|b,c,o,d|Jun-Sep|yellow, gold|Cut flower.|Tough bee plant. Ladybugs follow its aphids.|None known.
eryngium|b,c,d,o,g|Jul-Sep|steel blue, silver|Cut and dried flower.|Pollinators; deer skip it.|Spiny leaves can scratch.
lychnis|b,c,o,g|Jun-Aug|magenta, white, pink|Cut flower; silver foliage.|Self-sows.|Seeds are mildly toxic.
dustymiller|b|Foliage|silver|Foliage accent.|Silver backdrop for color.|Mildly toxic to pets.
portulaca|b,e,d|Jun-Oct|every color|Ground color on hot sites. Garden purslane is related and edible, but ornamental moss rose is not grown for food.|Dry spot color.|Do not eat ornamentals unless certain.
nemesia|b,f,o|Apr-Jun|pink, white, blue, yellow|Edging and pots.|Fragrance in spring.|None known.
diascia|b,o|May-Sep|pink, salmon|Pots and edging.|Bee plant.|None known.
bidens|b,o|Jun-Oct|gold|Pots and baskets.|Pollinators.|None known.
angelonia|b,c,g|Jun-Oct|purple, white, pink, bicolor|Cut flower.|Deer skip it.|None known.
scaevola|b|May-Oct|blue, purple, white|Pots and baskets.|Heat-proof trailing color.|None known.
cuphea|b,h,o|Jun-Oct|orange, red, purple|Pots and beds.|Hummingbirds visit.|None known.
spiderwort|b,e,o|May-Aug|purple, blue, pink|Flowers are edible in salads. Tough native.|Pollinator plant.|Sap can irritate skin and the plant is mildly toxic to pets.
globethistle|b,c,d,o,g|Jul-Sep|steel blue|Cut and dried flower.|Bees love it. Deer skip it.|Spiny leaves can scratch.
amaranthus|b,c,e,d|Jul-Oct|crimson, green, gold|Cut and dried flower. Leaves and seeds are edible.|Dramatic accent.|None known.
sweetwilliam|b,c,e,f,o|May-Jun|red, pink, white, bicolor|Cut flower. Petals are edible.|Spring fragrance.|Mildly toxic to cats and dogs.
gypsophila|b,c,d,o|Jun-Aug|white, pink|Cut and dried filler.|Airy cloud for borders.|Mildly toxic to pets. Pollen can bother hay fever sufferers.
lavatera|b,c,o|Jul-Oct|pink, white|Cut flower.|Quick hedge of bloom.|None known.
mimulus|b,o|May-Sep|yellow, red, orange|Moist shade pots and edges.|Shade color.|None known.
`;
const FLOWER2_GOOD_TXT = `
tomato,scarletsage|Salvia flowers draw bees and hummingbirds that help fruit set in the tomato bed.
tomato,mealycupsalvia|Mealycup sage draws pollinators and beneficial insects to the tomato bed.
tomato,cosmossulphur|Sulphur cosmos draws parasitic wasps and hoverflies that prey on tomato pests.
tomato,agastache|Agastache feeds bees and predators through summer. A general pollinator booster.
tomato,amaranthus|Amaranth is a trap plant for some pests and a pollinator host. Weak evidence, but harmless.
cucumber,agastache|Agastache keeps bees visiting and cuts the pollination gap on cucumbers.
cucumber,cosmossulphur|Sulphur cosmos draws pollinators and beneficial wasps to the cucumber patch.
zucchini,agastache|Agastache keeps squash pollinators busy through summer.
zucchini,bonariensis|Tall verbena is a butterfly and bee magnet that boosts squash pollination.
pumpkin,cosmossulphur|Sulphur cosmos draws the bees that pumpkin flowers need.
melon,bonariensis|Tall verbena draws bees and hoverflies to melons. See-through habit does not shade.
@bra,dustymiller|Dusty miller scent is said to confuse cabbage moths. Anecdotal.
@bra,torenia|Shade-tolerant torenia fills gaps and invites beneficial insects. Practical, not proven.
@bra,bidens|Bidens draws hoverflies and parasitic wasps that eat cabbage worms.
lettuce,nemesia|Nemesia gives a cool-season border that attracts small beneficial insects.
lettuce,linaria|Toadflax is a cool-season filler that feeds hoverflies near lettuce.
carrot,bidens|Bidens feeds hoverflies and wasps that hunt carrot pests.
carrot,gypsophila|Baby's breath is a tiny-flowered umbel-like cloud that feeds small beneficial wasps.
onion,mealycupsalvia|Salvia draws pollinators without competing with shallow onion roots.
onion,carnation|Carnations tolerate onion neighbors and do not compete.
peas,sweetwilliam|Sweet William shares cool-season timing and draws bees to the pea bed.
%legume,cosmossulphur|Sulphur cosmos draws beneficial wasps and hoverflies that prey on bean pests.
%legume,clarkia|Clarkia is a cool-season filler that feeds bees near beans.
potato,alyssum|Alyssum feeds hoverflies that eat aphids around the potato patch.
pepper,coleus|Coleus gives a colorful edge and shades the soil.
pepper,angelonia|Angelonia thrives in the same heat as peppers and draws bees.
eggplant,angelonia|Angelonia thrives in eggplant heat and draws bees.
eggplant,cuphea|Cuphea draws hummingbirds and pollinators in the same heat eggplant loves.
corn,amaranthus|Amaranth and corn share a summer-warm bed, and amaranth hosts predators of corn pests.
strawberry,hornedviola|Viola is a low edible edge that shares cool-season timing with strawberries.
strawberry,lobelia|Lobelia is a low, cool-season edge that does not crowd strawberries.
apple,hardygeranium|Hardy geranium makes a living mulch under fruit trees and draws pollinators.
%fruittree,veronica|Spike speedwell draws bees and hoverflies under fruit trees in early summer.
%fruittree,hardygeranium|Hardy geranium is a shade-tolerant living mulch and bee plant below fruit trees.
%fruittree,lambsear|Lamb's ear is a low silver mulch that draws small wasps and bees under fruit trees.
rose,lavender|Classic pair: lavender masks rose scent for aphids, and both love sun. Reliable lore.
rose,hardygeranium|Hardy geranium covers the bare ground around rose canes and draws beneficials.
rose,lambsear|Silver lamb's ear sets off roses and covers bare ankles.
rose,agastache|Agastache draws hummingbirds and predators of rose pests.
rose,russiansage|Russian sage is a classic rose companion. Its scent is said to mask rose aphids, anecdotally.
rose,veronica|Veronica spikes contrast with round rose blooms and draw bees.
rose,larkspur|Larkspur is the traditional tall backdrop for roses. Poisonous, so keep away from children.
peony,russiansage|Russian sage covers peony's bare summer legs and blooms after peony fades.
peony,hardygeranium|Hardy geranium fills the gap beneath peony foliage and blooms at the same time.
baptisia,echinacea|Both are deep-rooted prairie natives that combine beautifully and share cultural needs.
baptisia,shastadaisy|Baptisia gives a sturdy backdrop and shares full-sun needs with Shasta daisy.
rosemallow,sedum|Sedum covers the bare crowns of rosemallow and draws pollinators.
agastache,echinacea|Both are tough pollinator plants with similar drainage needs.
russiansage,echinacea|Both thrive in sun and drought, with complementary purple tones.
shastadaisy,veronica|Classic cottage border: white daisy with blue spikes.
shastadaisy,balloonflower|Similar sunny, well-drained needs and complementary colors.
globethistle,echinacea|Both are prairie-style, sun-loving, drought-tolerant bee plants.
canterburybells,foxglove|Both are biennials that self-sow in a cottage border and fit together.
delphinium,larkspur|Cousins that bloom in sequence in a cottage border. Both toxic.
bidens,petunia|Both heat-loving trailers fit the same pots and feeding schedule.
impatiens,coleus|Both thrive in part shade and moist soil, making a colorful combination.
waxbegonia,dustymiller|Silver dusty miller sets off begonia color in the same bed.
calibrachoa,scaevola|Both thrive in pots with similar light, feed and drainage.
cosmoschocolate,dahlia|Same tuber habit, culture and timing. Plant together and lift together.
bonariensis,echinacea|Tall airy verbena weaves between coneflowers without shading them.
bonariensis,sedum|Verbena weaves through sedum and shares its drought tolerance.
`;
const FLOWER2_BAD_TXT = `
monkshood,horseradish|Monkshood roots have been mistaken for horseradish, with fatal results. Keep them far apart.
monkshood,carrot|Monkshood roots and leaves are deadly. Do not plant near root or leaf crops.
monkshood,parsley|Monkshood foliage can be mistaken for parsley or celery leaves. Keep it away from the kitchen garden.
monkshood,celery|Monkshood foliage can be mistaken for celery. Keep away from edibles.
larkspur,%legume|Larkspur is poisonous and its seedlings look similar to young sweet pea and other legumes. Keep it away from edible beds.
larkspur,peas|Larkspur is toxic and can be mistaken for pea seedlings. Keep apart.
larkspur,fennel|Fennel stunts neighbors and larkspur is better kept apart from it.
baptisia,%legume|Baptisia is a poisonous legume cousin and the pods look like bean pods. Keep it away from edible beans and peas.
baptisia,peas|Baptisia seedlings and pods can be mistaken for edible peas. Keep apart.
icelandicpoppy,lettuce|Poppy foliage looks like young lettuce greens to the careless. Keep it away from edible greens.
shirleypoppy,lettuce|Poppy seedlings look like salad greens. Keep them apart.
stock,@bra|Stock is itself a brassica and shares clubroot and cabbage pests with cabbage and kale. Do not rotate stock into a brassica bed.
stock,cabbage|Stock harbors the same flea beetles and clubroot as cabbage.
stock,broccoli|Stock shares clubroot and flea beetles with broccoli.
rosemallow,okra|They share rust, sawflies and Japanese beetles. Both are in the mallow family.
rosemallow,hollyhock|They share rust and Japanese beetles. Planting together invites a pest buildup.
lavatera,okra|Annual mallow shares rust, sawflies and Japanese beetles with okra.
lavatera,hollyhock|Annual mallow and hollyhock share rust. Keep apart for cleaner leaves.
hornedviola,pansy|These are close relatives. Together they share the same fungal leaf spots, so give each its own bed.
impatiens,rosemary|Impatiens like steady moisture, rosemary likes it dry. They do not suit the same bed.
impatiens,lavender|Lavender needs dry feet and sun. Impatiens need moist shade. Do not mix.
impatiens,sage|Sage wants dry sun, impatiens want moist shade.
newguineaimpatiens,lavender|Lavender needs dry feet and sun. New Guinea impatiens need moist soil.
newguineaimpatiens,rosemary|Rosemary wants it dry, impatiens want it damp.
russiansage,impatiens|Russian sage needs hot dry sun and impatiens need moist shade.
russiansage,hydrangea|Russian sage wants dry soil, hydrangea thirsty. Water needs clash.
autumnsage,hydrangea|Autumn sage wants dry soil. Hydrangea wants moisture. They do not suit the same bed.
lambsear,impatiens|Lamb's ear rots in damp soil and humid shade. Impatiens need both.
lambsear,hydrangea|Lamb's ear rots in damp soil that hydrangea likes.
eryngium,hydrangea|Sea holly needs dry feet, hydrangea needs moisture.
portulaca,impatiens|Portulaca needs hot dry sun. Impatiens need moist shade.
gerbera,rosemary|Gerbera crowns rot in damp soil; avoid grouping with plants that need frequent watering.
rosemallow,lavender|Rose mallow wants wet soil and lavender wants dry. Their needs clash.
rosemallow,russiansage|Rose mallow wants wet soil. Russian sage wants dry.
rosemallow,lambsear|Rose mallow wants wet soil. Lamb's ear rots in it.
amaranthus,potato|Amaranth hosts potato beetles and may share pests with potatoes.
amaranthus,beet|Amaranth competes aggressively with beets and shares leaf miners.
amaranthus,spinach|Amaranth shares leaf miners with spinach and beets.
stock,sedum|Stock is a cool-season annual that wants moisture. Sedum wants dry soil.
coleus,lavender|Coleus likes moisture and shade. Lavender likes dry sun.
cuphea,rosemary|Cuphea likes regular water. Rosemary likes it dry.
spiderwort,lavender|Spiderwort spreads and likes moisture. Lavender prefers dry soil and open air.
monkshood,lavender|Monkshood likes moist, cool soil. Lavender likes hot, dry soil.
calibrachoa,lavender|Calibrachoa needs acid soil and regular feeding. Lavender wants poor, alkaline, dry soil.
mimulus,lavender|Monkey flower needs constant moisture. Lavender needs dry soil.
`;
const FLOWER2_GREPEL = { baptisia: .1, monkshood: .15, eryngium: .1, russiansage: .15, lambsear: .1, orientalpoppy: .1 };
