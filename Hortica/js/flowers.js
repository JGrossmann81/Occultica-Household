/* Hortica flower library: beauty, cutting, pollinators, pest helpers, traditional medicine. Same fields as the plant book.
   id|emoji|name|cat|family|sun|water|feed|spacing(in)|days to first bloom|bloom weeks|sowing|pH|zones|height(in)|moon|varieties|how to grow|old-timer tip */
const FLOWER_TXT = `
sweetpea|🌸|Sweet pea|fl|leg|F|2|M|6|85|8|d-6|6.5-7.5|-|72|u|Cupid, Spencer mix, Matucana, Winter Sunshine|Climbing annual with the best fragrance in the garden. Soak seed overnight and sow early, because it stops blooming in summer heat. Give it a trellis. The seeds and pods are poisonous.|Pick every few days or it quits.
snapdragon|🌸|Snapdragon|fl|scr|F|2|M|8|90|10|i-8 t-2|6.0-7.0|-|30|u|Rocket, Madame Butterfly, Floral Showers, Chantilly|Cool-season spikes that take a light frost. Surface-sow the dust-fine seed indoors. Pinch young plants for more stems.|Cut back after the first flush and it blooms again in fall.
petunia|🌺|Petunia|fl|sol|F|2|H|12|80|20|i-10 t+0|5.5-6.5|-|12|u|Wave, Supertunia, Madness, Dreams|Heavy-blooming annual for beds and baskets. Feed every week or two and shear back in midsummer. Sticky leaves trap small pests.|Pinch spent blooms to keep them going.
pansy|🌼|Pansy and viola|fl|vio|P|2|M|6|75|14|i-10 t-4 f-2|5.4-6.8|-|8|u|Matrix, Majestic Giants, Johnny Jump-Up|Cool-season flowers that bloom through light frosts and fade in heat. Plant in early spring or fall. The flowers are edible.|Fall-planted pansies bloom first thing in spring.
dianthus|🌸|Dianthus and carnation|fl|car|F|2|M|8|90|10|i-8 t-2|6.5-7.5|3-9|14|u|Sweet William, Cheddar pinks, Fire Witch|Clove-scented flowers for edges and cutting. Needs sharp drainage and sun. Sweet William is a biennial that blooms its second year.|Cut stems when half the buds have opened.
cornflower|🌸|Cornflower (bachelor's button)|fl|ast|F|1|L|8|65|8|d-4|6.0-7.5|-|30|u|Blue Boy, Black Ball, Frosted Queen|Easy blue annual that self-sows. Sow early, because it likes cool weather. Petals are edible and dry well.|Sow every three weeks in spring for steady blue.
californiapoppy|🌼|California poppy|fl|pap|F|1|L|8|60|10|d-3|6.5-7.5|-|14|u|Orange King, Mission Bells, Thai Silk|Drought-proof self-sowing poppy that hates transplanting. Scatter seed on bare soil in early spring or fall. Closes at night and on cloudy days. Traditionally a mild sleep tea.|Never fertilize it: poor dry soil makes the best blooms.
celosia|🌺|Celosia|fl|ama|F|2|M|10|90|10|i-6 t+1|6.0-7.0|-|24|u|Cramer's Burgundy, Flamingo Feather, Bombay|Velvet plumes and brain-like cockscombs in hot colors. Loves heat and holds color when dried.|Hang cut stems upside down to dry.
gomphrena|🌸|Globe amaranth|fl|ama|F|1|L|10|90|14|i-6 t+1|6.0-7.5|-|24|u|Strawberry Fields, Audray, Fireworks|Heat-proof button flowers that bees love and that dry with color intact. Slow to start, so begin indoors.|One of the best everlastings for wreaths.
cleome|🌸|Cleome (spider flower)|fl|cle|F|1|L|18|80|12|d0|6.0-7.5|-|48|u|Helen Campbell, Violet Queen, Cherry Queen|Tall airy annual with thorny stems and a skunky smell that rabbits and deer skip. Self-sows. Hummingbirds and moths visit.|Wear gloves to cut: the stems are prickly.
salvia|🌸|Salvia (perennial)|fl|lam|F|1|L|18|60|10|pe|6.0-7.5|4-9|24|d|May Night, Caradonna, Blue Hill|Purple spikes that bees cover. Cut back after the first bloom for a second one. Deer and rabbits leave it alone.|Shear it hard in midsummer.
verbena|🌸|Verbena|fl|ver|F|1|L|12|90|16|i-10 t+0|6.0-7.0|-|12|u|Homestead Purple, Aztec, Lollipop|Heat-tough butterfly flower with clusters of color all summer. Keep it on the dry side. Mildew follows wet leaves.|Bonariensis verbena is the tall airy kind that self-sows.
lobelia|🌸|Lobelia|fl|cam|P|2|M|6|75|14|i-10 t-1|6.0-7.0|-|8|u|Crystal Palace, Regatta, Riviera|Tiny blue trailing flowers for edges and baskets. Likes cool weather and steady moisture.|Shear in midsummer if it stops blooming.
phlox|🌸|Garden phlox|fl|pol|F|2|M|24|100|8|pe|6.0-7.5|3-8|36|d|David, Jeana, Franz Schubert|Fragrant mounds of summer color that butterflies and hummingbirds love. Powdery mildew is the trouble, so give it air and pick resistant varieties.|Divide every three years.
morningglory|🌺|Morning glory|fl|con|F|2|L|8|70|14|d+1|6.0-7.5|-|120|u|Heavenly Blue, Grandpa Ott, Star of Yelta|Fast twiner for fences. Nick the seed and soak overnight. Self-sows to the point of nuisance, and the seeds are poisonous.|Keep it off your vegetables: it strangles.
moonflower|🌼|Moonflower|fl|con|F|2|L|12|100|10|i-5 t+2|6.0-7.5|-|120|u|Giant White, Alba|A white vine whose huge fragrant blooms open at dusk, drawing sphinx moths. Nick the seed. A true night-garden plant. All parts are poisonous.|Plant it where you sit on summer evenings.
fouroclock|🌺|Four o'clock|fl|nyc|F|2|L|18|70|14|d0|6.0-7.5|-|30|u|Marvel of Peru, Jingles, Broken Colors|Trumpets open in late afternoon and smell sweet at dusk. Tuberous, self-sows. Japanese beetles are said to be drawn to it and are poisoned by it, though the evidence is thin. Seeds are toxic.|Dig the black tubers in cold zones and store like dahlias.
strawflower|🌼|Strawflower|fl|ast|F|1|L|12|90|12|i-6 t+1|6.0-7.5|-|30|u|Bright Bikini, Monstrosum, Silvery Rose|Papery blooms that stay colored when dried. Pick before the center shows.|Cut with long stems and hang to dry.
statice|🌸|Statice|fl|plu|F|1|L|12|100|10|i-8 t+0|6.5-7.5|-|24|u|Pacific Mix, Fortress, Sunset|A classic dried flower. Needs warmth, sun and dry feet.|Hang bunches in a dark airy room.
ageratum|🌸|Ageratum|fl|ast|P|2|M|8|75|14|i-8 t+1|6.0-7.5|-|10|u|Blue Horizon, Hawaii, Artist Alto|Fluffy blue edging that pollinators love. Skip fertilizer for more bloom.|Shear lightly midsummer.
hollyhock|🌺|Hollyhock|fl|mal|F|2|M|24|365|8|d-4|6.0-8.0|3-9|84|d|Chater's Double, Indian Spring, Nigra|Cottage-garden giant, a biennial that blooms its second summer. Rust is the usual problem: clean up leaves in fall and give air. Petals are edible and traditionally soothing in tea.|Plant by a wall or fence and let it self-seed.
foxglove|🌸|Foxglove|fl|scr|P|2|M|18|365|6|d-4|6.0-7.0|4-9|60|d|Excelsior, Camelot, Sutton's Apricot|Tall biennial spires that hummingbirds and bumblebees love. Blooms its second year and self-sows. Every part is deadly poisonous, and it is the source of the heart drug digoxin: never use it as a home remedy. The first-year leaves look like comfrey.|Label it clearly and keep it away from the herb bed.
delphinium|🌸|Delphinium and larkspur|fl|ran|F|2|H|18|100|6|i-8 t-2|6.5-7.5|3-7|60|u|Pacific Giants, Magic Fountains, Rocket larkspur|Tall blue spires for the back of the border. Stake them early. Slugs love the young shoots. Every part is toxic.|Cut spent spikes to the base for a fall repeat.
lupine|🌸|Lupine|fl|leg|F|2|N|18|365|6|d-6|5.5-6.5|4-8|36|u|Russell hybrids, Gallery, Texas bluebonnet|Fixes its own nitrogen and feeds bumblebees. Soak seed and sow early. Wants acid, cool and well-drained soil. Seeds are toxic.|Do not feed it: nitrogen makes leaves and no flowers.
columbine|🌸|Columbine|fl|ran|P|2|L|12|365|5|pe|6.0-7.0|3-9|24|d|McKana, Origami, Songbird|Delicate spurred flowers that hummingbirds visit. Self-sows politely. Leaf miners scribble the leaves but rarely hurt it.|Cut back leaves in midsummer for fresh growth.
blackeyedsusan|🌼|Black-eyed Susan|fl|ast|F|1|L|18|100|10|pe|6.0-7.0|3-9|30|d|Goldsturm, Cherokee Sunset, Indian Summer|Tough golden daisies that bloom into fall and feed goldfinches on the seed heads. Thrives in clay and drought.|Leave the seed heads standing for birds.
aster|🌸|New England aster|fl|ast|F|2|L|24|120|8|pe|6.0-7.5|3-8|48|d|Purple Dome, Alma Potschke, Harrington's Pink|The last big feast for bees and migrating monarchs in fall. Pinch in early summer for compact plants.|Cut back by half in June.
goldenrod|🌼|Goldenrod|fl|ast|F|1|L|24|150|8|pe|6.0-7.5|3-9|48|d|Fireworks, Wichita Mountain, Little Lemon|A late-summer pollinator magnet. It does not cause hay fever; ragweed blooming at the same time does. Spreads by roots.|Give it room or a corner.
milkweed|🌸|Milkweed|fl|apo|F|1|L|18|300|8|d-6|6.0-7.5|3-9|36|d|Swamp milkweed, Butterfly weed, Common milkweed|The monarch's only caterpillar food. Sow seed in fall or chill it in the fridge for 30 days. Slow to settle in, then long-lived. The sap is toxic.|Plant a patch and leave the leaves for the caterpillars.
catmint|🌸|Catmint|fl|lam|F|1|L|18|60|12|pe|6.0-7.5|3-8|24|d|Walker's Low, Six Hills Giant, Junior Walker|Lavender-blue haze from spring to frost. Bees swarm it. Deer, rabbits and many pests dislike its scent. Shear after the first bloom.|Plant it along a bed edge as a living fence.
peony|🌸|Peony|fl|pae|F|2|M|36|700|3|dm|6.5-7.5|3-8|36|d|Sarah Bernhardt, Festiva Maxima, Coral Charm|A long-lived perennial that needs cold winters. Plant the eyes no deeper than 2 inches or it will not bloom. Ants on the buds are harmless. It dislikes being moved.|Plant it once and leave it for forty years.
iris|🌸|Iris (bearded)|fl|iri|F|1|L|18|365|3|dm|6.5-7.5|3-9|30|d|Immortality, Beverly Sills, Siberian iris|Plant rhizomes with the tops showing at the soil surface. Deer, rabbits and gophers usually leave it alone. Iris borer is the main pest. Rhizomes are toxic.|Lift and divide every 3 to 4 years after bloom.
tulip|🌷|Tulip|fl|lil|F|2|L|6|180|3|f-4|6.0-7.0|3-8|18|d|Darwin hybrid, Parrot, Angelique, Red Emperor|Plant bulbs 6 to 8 inches deep in fall. Gophers, voles and squirrels adore tulip bulbs: plant in wire baskets. Darwin hybrids return best.|Plant daffodils among them to discourage diggers.
crocus|🌷|Crocus|fl|iri|F|2|L|3|150|3|f-4|6.0-7.0|3-8|4|d|Snow crocus, Dutch hybrids, Orange Monarch|The first food of the year for bees. Plant corms 3 inches deep in lawns or beds. Squirrels sometimes dig them.|Let the leaves die back before mowing.
hyacinth|🌷|Hyacinth|fl|asp|F|2|L|6|180|3|f-4|6.0-7.0|4-8|10|d|Delft Blue, Pink Pearl, Carnegie|Heavily fragrant spikes in early spring. Wear gloves: the bulbs can irritate skin. Rodents usually leave them alone.|Force a few bulbs indoors in water for winter scent.
muscari|🌷|Grape hyacinth|fl|asp|F|2|L|3|180|4|f-4|6.0-7.0|3-9|8|d|Blue Spike, Valerie Finnis, Album|Tiny blue spring bulbs that spread. Mice and gophers tend to skip them.|Plant under taller bulbs.
allium|🌸|Ornamental allium|fl|ama|F|1|L|8|200|4|f-4|6.0-7.5|4-9|36|d|Globemaster, Purple Sensation, Gladiator|Purple globes that bees love. The onion smell keeps deer, rabbits and gophers away. Plant bulbs 4 to 6 inches deep in fall. The dried heads last for months.|Ring your tulips and roses with them.
lily|🌺|Lily|fl|lil|F|2|M|12|365|4|dm|6.0-7.0|3-8|36|d|Stargazer, Casa Blanca, Asiatic mix|Plant bulbs 6 inches deep with a mulched base and sunny head. Scarlet lily beetles chew them. All parts are very toxic to cats. Gophers love the bulbs.|Cut stems high and leave some leaves on the stalk or the bulb starves.
daylily|🌺|Daylily|fl|asp|F|2|M|24|365|6|pe|6.0-7.0|3-9|30|d|Stella de Oro, Happy Returns, Hyperion|Nearly indestructible perennial. Each bloom lasts one day, but there are dozens per scape. Buds and flowers are edible (eat only true Hemerocallis, never other lilies).|Divide in fall every 4 years.
fritillaria|🌼|Crown imperial|fl|lil|F|2|L|12|365|3|f-4|6.0-7.0|5-8|36|d|Rubra Maxima, Lutea, Aurora|Spring bulbs with a skunk-like smell that is said to push gophers, voles and deer away. The evidence is mostly anecdotal. Plant bulbs 6 inches deep on their side in well-drained soil.|Tuck them among prized bulbs.
dahlia|🌺|Dahlia|fl|ast|F|2|H|18|90|16|t+1|6.0-7.0|8-10|36|u|Cafe au Lait, Bishop of Llandaff, Karma|Tubers planted after frost bloom from midsummer until frost. Stake early. Slugs, earwigs and gophers like them. Lift tubers in zones colder than 8.|Pinch the center when 12 inches tall for a bushy plant.
gladiolus|🌸|Gladiolus|fl|iri|F|2|M|6|90|3|t+0 t+3 t+6|6.0-7.0|8-10|48|u|Priscilla, Boone, Atom|Plant corms every 2 weeks for a long cutting season. Thrips and gophers are the problems. Lift corms in cold zones.|Cut when the lowest flower opens.
canna|🌺|Canna|fl|can|F|3|H|24|100|14|t+1|6.0-7.0|7-10|60|u|Tropicanna, Pretoria, Cleopatra|Tropical leaves and flowers for hot weather. Likes water and food. Lift rhizomes in cold zones.|Plant beside a pond or damp spot.
hydrangea|🌸|Hydrangea|fl|hyd|P|3|M|60|700|10|dm|5.5-6.5|4-9|60|d|Annabelle, Limelight, Endless Summer|A shrub for part shade. Soil pH changes blue flowers to pink. Needs steady moisture. Panicle and smooth types are the hardiest.|Mulch deeply to hold water.
lilac|🌸|Lilac|fl|ole|F|2|L|96|700|3|dm|6.5-7.5|3-7|120|d|Common, Miss Kim, Bloomerang|The scent of a farmhouse spring. Needs winter cold and plenty of sun. Prune right after bloom. Flowers are edible.|Remove suckers to keep it tidy.
hellebore|🌸|Hellebore|fl|ran|S|2|L|18|365|10|dm|6.5-7.5|4-9|18|d|Lenten rose, Ivory Prince, Onyx Odyssey|Blooms in late winter in shade. Deer and rabbits leave it alone. Every part is toxic. Long associated with old herb lore and witches' gardens.|Cut last year's leaves in late winter so the flowers show.
violet|🌸|Sweet violet|fl|vio|S|2|M|6|365|6|pe|6.0-7.0|4-9|6|d|Viola odorata, Queen Charlotte, Royal Robe|A fragrant woodland groundcover with edible flowers and leaves. Spreads by runners and self-sows. Traditional cough tea and spring salad.|Candy the flowers for cakes.
primrose|🌼|Primrose|fl|pri|P|2|M|8|365|8|pe|6.0-7.0|3-8|8|d|Julian, Wanda, Cowichan|Early-spring color that tolerates damp shade. Slugs are the problem. Flowers and young leaves are edible.|Divide clumps after bloom.
forgetmenot|🌸|Forget-me-not|fl|bor|S|2|L|6|120|8|d-6|6.0-7.0|-|8|u|Victoria Blue, Mon Amie, Rosylva|A biennial that self-sows into frothy blue clouds in spring. Pull what you do not want.|Scatter seed under shrubs and roses.
bleedingheart|🌸|Bleeding heart|fl|pap|S|2|M|24|365|4|dm|6.0-7.0|3-9|30|d|Old-fashioned, Luxuriant, Alba|Heart-shaped flowers in spring shade. Goes dormant by midsummer, so plant it near hosta. Deer leave it alone. Toxic.|Underplant with ferns to cover the gap.
sedum|🌸|Sedum (stonecrop)|fl|cra|F|1|L|18|150|10|pe|6.0-7.5|3-9|18|d|Autumn Joy, Matrona, Dragon's Blood|Drought-proof succulent whose flowers carry bees and butterflies into fall. Leave the seed heads for winter.|Pinch in June to stop flopping.
honeysuckle|🌼|Honeysuckle (native)|fl|cap|P|2|M|60|700|10|dm|6.0-7.0|4-9|120|d|Coral honeysuckle, Major Wheeler, Goldflame|A fragrant vine that hummingbirds love. Choose native Lonicera sempervirens, not the invasive Japanese kind. Berries are toxic.|Give it a trellis away from small trees.
clematis|🌸|Clematis|fl|ran|P|2|M|24|700|6|dm|6.5-7.5|4-9|120|d|Jackmanii, Nelly Moser, Sweet Autumn|The classic partner for roses: roots cool, head in the sun. Plant deep. Prune by variety group.|Shade the roots with a low plant or mulch.
jasmine|🌼|Jasmine|fl|ole|F|2|M|36|700|10|dm|6.0-7.5|8-10|120|d|Common jasmine, Winter jasmine, Star jasmine|A fragrant vine for warm zones, grown for evening scent and jasmine tea. Needs a trellis. In cold zones grow it in a pot indoors.|Pick flowers at dusk for tea.
gardenia|🌼|Gardenia|fl|rub|P|3|H|36|700|6|dm|5.0-6.0|8-11|48|d|Veitchii, Kleim's Hardy, August Beauty|Heavily scented shrub for warm zones and acid soil. Bud drop means too dry, too cool or too much change.|Feed with an acid-plant fertilizer.
camellia|🌸|Camellia|fl|the|P|2|M|60|700|12|dm|5.5-6.5|7-9|96|d|Japonica, Sasanqua, Yuletide|Glossy evergreen that blooms in winter. Plant high and keep the roots cool. Camellia sinensis is the tea plant.|Mulch with pine needles.
hardyhibiscus|🌺|Hardy hibiscus|fl|mal|F|3|H|36|120|8|pe|6.0-7.0|4-9|60|d|Lord Baltimore, Kopper King, Luna|Dinner-plate blooms on tall perennials in late summer. Late to leaf out, so mark it. Thirsty and hungry.|Cut to the ground in late winter.
geranium|🌸|Geranium (pelargonium)|fl|ger|F|2|M|12|90|20|i-12 t+1|6.0-7.0|-|18|u|Zonal, Ivy, Martha Washington|Heat-tolerant color for pots. Japanese beetles are said to be poisoned or stunned by feeding on the leaves. Overwinter in a cool bright spot. Toxic to pets.|Deadhead for nonstop bloom.
chrysanthemum|🌼|Garden mum|fl|ast|F|2|H|18|120|8|pe|6.0-7.0|5-9|24|d|Sheffield Pink, Clara Curtis, Mammoth series|Fall color. Pinch until July 4th for round plants. Plant by early fall in cold zones to establish.|Divide every spring.
pyrethrum|🌼|Pyrethrum daisy|fl|ast|F|1|L|18|100|6|pe|6.0-7.5|5-9|24|d|Tanacetum cinerariifolium, Painted daisy, Robinson's Red|The flowers are the source of natural pyrethrin insecticide. Dried and powdered, they stun many insects, but pyrethrin also kills bees and fish: use only at dusk and never on blooming plants.|The painted daisy (Tanacetum coccineum) is weaker but prettier.
tansy|🌼|Tansy|fl|ast|F|1|L|18|100|8|pe|6.0-7.5|3-9|36|d|Common tansy, Isla Gold, Crispum|Old farmhouse plant said to repel ants, flies and cucumber beetles. The evidence is thin. Spreads fast by roots and is toxic to eat. Plant in a contained corner.|Cut the flowers for dried bouquets.
nicotiana|🌸|Flowering tobacco|fl|sol|P|2|M|12|85|16|i-8 t+0|6.0-7.0|-|36|u|Perfume White, Lime Green, Jasmine|Evening-fragrant sticky flowers that draw hawk moths and trap whiteflies and aphids on the leaves. Toxic to eat. Wear gloves.|Plant at the end of the tomato row as a trap.
tithonia|🌻|Mexican sunflower|fl|ast|F|1|L|24|90|14|i-6 t+1|6.0-7.5|-|72|u|Torch, Fiesta del Sol, Goldfinger|Orange giants that monarchs and hummingbirds adore. Thrives in heat and poor soil.|Plant at the back of the border.
safflower|🌼|Safflower|fl|ast|F|1|L|12|110|6|d-2|6.0-8.0|-|30|u|Zanzibar, Kinko, Orange Gem|A thistle-like orange flower for dye, dried bouquets and oil seed. Drought-proof once rooted. Spiny leaves.|Pick petals for a cheap saffron substitute in rice.
mallow|🌸|Mallow|fl|mal|F|1|L|18|100|10|d-2|6.0-8.0|4-9|36|d|Zebrina, Mystic Merlin, Primley Blue|Purple-striped flowers on a tough plant. The leaves and flowers have been made into soothing tea for generations. Self-sows. Cousin to okra and hollyhock.|Pick flowers in the morning for tea.
scabiosa|🌸|Scabiosa|fl|dip|F|2|M|12|100|10|d-4|6.5-7.5|-|24|u|Black Knight, Ace of Spades, Fama|Pincushion flowers that butterflies and bees love. Excellent cut flower. Deadhead for months of bloom.|Sow indoors for blooms the first summer.
ammi|🌸|Ammi (false Queen Anne's lace)|fl|api|F|2|M|12|90|8|d-4|6.0-7.5|-|36|u|Visnaga, Graceland, Green Mist|Lacy white umbels that draw tiny parasitic wasps, lacewings and hoverflies to hunt pests. Superb filler for bouquets. Related to carrots and dill.|Sow in fall or very early spring.
penstemon|🌸|Penstemon|fl|scr|F|1|L|18|365|8|pe|6.5-7.5|3-9|30|d|Husker Red, Pike's Peak Purple, Firecracker|Tubular flowers that hummingbirds visit. Hates wet feet. Deer tend to leave it alone.|Do not mulch the crown.
coreopsis|🌼|Coreopsis|fl|ast|F|1|L|12|90|12|pe|6.0-7.0|3-9|18|d|Moonbeam, Early Sunrise, Mercury Rising|Golden daisies that bloom all summer in poor soil. Shear after the first flush.|Deadhead for a long show.
gaillardia|🌼|Blanket flower|fl|ast|F|1|L|12|90|14|pe|6.0-7.0|3-9|18|d|Arizona Sun, Goblin, Burgundy|Red and gold daisies that thrive in heat, drought and poor soil. Short-lived but self-sows.|Leave it alone: rich soil makes it flop.
liatris|🌸|Blazing star|fl|ast|F|2|L|12|365|6|dm|6.0-7.5|3-9|36|d|Kobold, Floristan White, Alba|Purple spikes that open from the top down and draw butterflies. Native prairie plant. Plant corms 2 inches deep.|Cut flowers last a week in a vase.
wildmix|🌼|Pollinator meadow mix|fl|mix|F|1|L|12|75|12|d-4 f-2|6.0-7.5|-|30|u|Regional wildflower mix, Annual bee mix, Beneficial insectary mix|A blend of annuals and perennials that feeds bees, butterflies and beneficial insects. Rake the soil bare, scatter seed and press in. Water until up. Choose a mix for your region.|Sow a strip at the edge of the vegetable garden as insect housing.
`;

/* roles: b beauty, c cut, m traditional medicinal, e edible, o pollinators, p pest helper, d dried, f fragrant, h hummingbirds, g gopher and deer resistant, t toxic: caution
   id|tags|bloom months|colors|uses|pest and garden role|caution */
const FLOWER_INFO_TXT = `
sweetpea|b,c,f,o,t|May-Jul|pink, purple, white, red|Fragrant cut flower for bouquets.|Climbs a trellis. Fixes a little nitrogen. Bees visit.|Seeds and pods are poisonous.
snapdragon|b,c,e,o|Jun-Oct|every color but blue|Cut flower. Petals are edible but bitter.|Bumblebees pry open the flowers.|None known.
petunia|b,f|May-Oct|every color|Beds, baskets and pots.|Sticky leaves trap tiny insects.|Sticky sap irritates some skin.
pansy|b,e,c|Mar-Jun, Sep-Nov|every color|Edible garnish. The wild heartsease was a traditional skin and cough herb.|Plant cool-season color between slow vegetables.|Eat only flowers grown without sprays.
dianthus|b,c,e,f,o|May-Jul|pink, red, white|Clove-scented cut flower. Petals are edible.|Edge plant for dry sunny beds.|None known.
cornflower|b,c,e,o,m|May-Aug|blue, pink, white, black|Edible petals; traditional eyewash and tea.|Brings in bees and hoverflies. Good for field margins.|Use herbal eye washes only under a clinician's advice.
californiapoppy|b,m,o,g|May-Sep|orange, yellow, cream, red|Traditional mild calming tea (not related to opium poppy).|Drought-proof filler. Deer tend to skip it.|Not for use in pregnancy or with sedatives.
celosia|b,c,d,e|Jul-Oct|red, orange, yellow, pink|Cut and dried flowers. Some celosias are eaten as greens.|Heat-proof color.|None known.
gomphrena|b,c,d,o,e|Jul-Oct|magenta, purple, white, orange|Dried everlasting. Flowers are edible.|Bee magnet.|None known.
cleome|b,c,o,h,g|Jun-Oct|pink, purple, white|Tall cut filler.|Attracts hummingbirds and moths. Deer and rabbits skip it.|Thorny stems.
salvia|b,c,o,h,g,d|Jun-Sep|purple, blue, pink|Cut and dried flowers.|Bees love it. Deer, rabbits and gophers usually leave it alone.|None known.
verbena|b,o,c|Jun-Oct|purple, pink, red|Tall verbena is an airy cut flower.|Butterfly and hoverfly magnet.|Mildew in wet weather.
lobelia|b|May-Sep|blue, purple, white|Edging and baskets.|Pretty edging in front of low vegetables.|None known.
phlox|b,c,f,o,h|Jun-Sep|pink, purple, white|Fragrant cut flower.|Butterfly and hummingbird plant.|Mildew-prone.
morningglory|b,t|Jun-Oct|blue, pink, purple|Fast screen.|Hides bare fences. Feeds some pollinators.|Seeds are poisonous. Aggressively self-sows.
moonflower|b,f,t|Jul-Oct, at dusk|white|Evening garden fragrance.|Draws sphinx moths whose caterpillars the tomato hornworm resembles; tell them apart before spraying.|All parts are poisonous.
fouroclock|b,f,t,o|Jun-Oct, late afternoon|pink, yellow, white, magenta|Evening fragrance. Self-sows.|Said to trap Japanese beetles, which it poisons. Evidence is thin.|Seeds and roots are toxic.
strawflower|b,c,d,o|Jul-Oct|yellow, orange, red, white|Everlasting for dried arrangements.|Bee plant for late summer.|None known.
statice|b,c,d|Jun-Sep|purple, pink, yellow, white|Dried everlasting.|Low and tidy.|None known.
ageratum|b,o|May-Oct|blue, white, pink|Edging.|Pollinator magnet.|Some varieties are toxic to livestock.
hollyhock|b,m,e,o,h|Jun-Aug|every color|Edible petals. Traditional soothing flower tea.|Tall screen. Can host rust and Japanese beetles, which draw them from other plants.|Treat rust early and clear fallen leaves.
foxglove|b,o,h,g,t|Jun-Jul|purple, pink, white, yellow|Beauty only. Do not make remedies.|Deer and rabbits will not touch it.|DEADLY POISONOUS. Looks like comfrey in leaf.
delphinium|b,c,o,h,g,t|Jun-Jul|blue, purple, white, pink|Tall cut flowers.|Deer and rabbits leave it alone.|Every part is toxic.
lupine|b,o,t|May-Jun|blue, purple, pink, yellow|Beauty and nitrogen fixing.|Fixes nitrogen. Feeds bumblebees.|Seeds are toxic.
columbine|b,o,h,g|Apr-Jun|purple, pink, yellow, red|Beauty for part shade.|Hummingbird flower. Deer skip it.|Seeds are toxic.
blackeyedsusan|b,c,o,m,g|Jul-Oct|golden yellow|Cut flower. Traditional wound and cold herb (Rudbeckia is an echinacea cousin).|Seed heads feed finches. Bees visit.|None known.
aster|b,c,o|Sep-Oct|purple, pink, white|Late cut flower.|Last food for bees and migrating monarchs.|None known.
goldenrod|b,c,o,m|Aug-Oct|gold|Tea and wound wash in old herb lore.|Huge beneficial-insect flower. Not the cause of hay fever.|Spreads. Some people react to the pollen.
milkweed|b,o,t|Jun-Aug|orange, pink, white|Monarch host plant.|Monarch nursery. Aphids also love it, so watch for them and keep them off vegetables.|Sap is toxic.
catmint|b,c,o,p,g,d|May-Sep|lavender-blue|Edging and cutting.|Repels aphids and flea beetles in some trials and tends to keep deer and rabbits off.|None known.
peony|b,c,f,m,g|May-Jun|pink, white, red|Cut flower. The root is used in Chinese herbal tradition.|Deer and rabbits leave it alone. Ants on buds are harmless.|Root and seeds are toxic in quantity.
iris|b,c,f,g,t|May-Jun|every color|Orris root is used in perfume. Cut flower.|Gophers and deer usually leave it alone.|Rhizomes are toxic.
tulip|b,c|Mar-May|every color|Cut flower. Petals are edible but not tasty.|Gophers and voles dig the bulbs. Grow in baskets.|Bulbs are toxic to pets.
crocus|b,o|Feb-Apr|purple, yellow, white|Early bee food. Saffron is a different crocus.|First food of the year for bees.|Spring crocus is not saffron.
hyacinth|b,c,f,g,t|Mar-May|blue, pink, white|Fragrance.|Rodents usually skip it.|Bulbs irritate skin and are toxic.
muscari|b,g|Mar-May|blue, white|Edging under trees and shrubs.|Rodents usually skip it. Early bee food.|None known.
allium|b,c,d,o,p,g,e|May-Jul|purple, pink, white|Dried ornamental. Flowers are edible, onion flavor.|Repels deer, rabbits and gophers and helps aphid control among roses.|Eat only true edible alliums, not look-alikes.
lily|b,c,f,t,g|Jun-Aug|every color|Cut flower. Do not eat.|Deer eat them.|Toxic to cats: even pollen can kill.
daylily|b,e,o,m|Jun-Aug|every color|Buds and flowers are eaten in Asian cooking. Traditional tea.|Suppresses weeds on banks.|Only true Hemerocallis is edible. Some people react.
fritillaria|b,g,t|Apr-May|orange, yellow|Beauty.|Skunk smell is said to repel gophers, voles and deer. Evidence is anecdotal.|Bulbs are toxic.
dahlia|b,c,e|Jul-Oct|every color|Cut flower. Tubers are edible in Mexican tradition.|Pest favorite: slugs, earwigs, gophers.|Edible only when positively identified.
gladiolus|b,c|Jul-Sep|every color|Cut flower.|Cut flower successions. Thrips and gophers like it.|Corms toxic if eaten.
canna|b,o,h|Jul-Oct|red, orange, yellow|Tropical leaves and bloom.|Hummingbird flower.|None known.
hydrangea|b,c,d,t|Jun-Sep|blue, pink, white|Cut and dried. Do not eat.|Needs moisture.|Buds and leaves are toxic.
lilac|b,c,e,f,o|Apr-May|purple, white, pink|Edible flowers. Strongest fragrance.|Early nectar for butterflies. Deer skip it.|None known.
hellebore|b,g,t|Jan-Apr|white, pink, burgundy, green|Beauty only. Old herb lore calls it a witches' plant.|Deer and rabbits leave it alone.|All parts are poisonous.
violet|b,e,f,m,o|Mar-May|purple, white|Candied flowers, salad and cough tea in old herb lore.|Groundcover and early bee food.|Do not confuse with African violet or poisonous look-alikes.
primrose|b,e,o|Mar-May|yellow, pink, purple, blue|Edible flowers. Traditional cough and calming tea.|Early nectar.|Some people get a skin rash.
forgetmenot|b,o|Apr-Jun|blue|Beauty and cut flower.|Fills under shrubs and bulbs.|Leaves may irritate skin.
bleedingheart|b,c,g,t|Apr-Jun|pink, white|Spring shade color.|Deer leave it alone.|Toxic if eaten.
sedum|b,o,d|Aug-Oct|pink, rose, red|Cut and dried. Leaves of some sedums are edible.|Huge fall pollinator plant.|None known.
honeysuckle|b,f,h,o,t|May-Aug|red, orange, yellow|Beauty. Native types are not eaten.|Hummingbirds visit.|Berries are toxic.
clematis|b,c,o|May-Sep|purple, pink, white|Beauty.|Shades the roots of roses when planted beside them.|Sap irritates skin. Toxic.
jasmine|b,f,m,e|Jun-Sep|white, yellow|Jasmine tea. Fragrance.|Evening moth plant.|Only true Jasminum officinale and sambac are used for tea.
gardenia|b,c,f|May-Jul|white|Fragrance.|None known.|Toxic to pets.
camellia|b,c,e|Nov-Apr|pink, red, white|Camellia sinensis leaves make tea.|Evergreen screening.|Only Camellia sinensis is used for tea.
hardyhibiscus|b,c,o,h|Jul-Sep|red, pink, white|Beauty. Related to roselle (sorrel).|Hummingbird flower. Japanese beetles love it, so it can trap them away from beans.|None known.
geranium|b,c,p|May-Oct|red, pink, white, salmon|Beauty and pots.|Japanese beetles that feed on it can be poisoned or stunned. It also nudges cabbage worm moths.|Toxic to pets.
chrysanthemum|b,c|Sep-Nov|every color|Fall color. Chrysanthemum tea comes from specific edible types.|Contains small amounts of pyrethrins.|Toxic to pets.
pyrethrum|b,c,d,p,m|Jun-Jul|pink, red, white|Source of pyrethrin insecticide when dried and ground.|Pyrethrin kills bees too: apply only at dusk, never on blooming plants.|Use dust with gloves and a mask. Very toxic to fish and cats.
tansy|b,d,p,t|Jul-Sep|yellow buttons|Beauty and dried flowers.|Said to repel ants, flies and cucumber beetles. Evidence is thin.|Toxic to eat. Invasive by roots.
nicotiana|b,f,o,p,t|Jun-Oct|white, green, pink, red|Evening fragrance.|Trap crop: whiteflies and aphids stick to the leaves.|All parts are toxic. Wear gloves.
tithonia|b,c,o,h|Jul-Oct|orange|Cut flower. Huge nectar source.|Monarch and hummingbird magnet.|None known.
safflower|b,c,d,e,o,m|Jul-Aug|orange, yellow|Dye and cooking petals. Traditional tea in Chinese medicine.|Birds love the seed.|Not for use in pregnancy.
mallow|b,e,m,o|Jun-Sep|purple-striped|Leaves and flowers make a soothing traditional tea.|Bee plant.|None known.
scabiosa|b,c,o|Jun-Oct|blue, white, black, pink|Cut flower.|Butterfly and bee magnet.|None known.
ammi|b,c,o,p|Jun-Aug|white|Cut filler.|Draws parasitic wasps, lacewings and hoverflies that eat aphids and caterpillars.|Sap can sensitize skin to sun.
penstemon|b,o,h,g|May-Jul|red, pink, purple|Beauty.|Hummingbird flower. Deer tend to skip it.|None known.
coreopsis|b,c,o|Jun-Sep|gold, red|Cut flower.|Pollinator and beneficial insect plant.|None known.
gaillardia|b,c,o|Jun-Oct|red and gold|Cut flower.|Long-blooming pollinator plant.|None known.
liatris|b,c,d,o|Jul-Sep|purple, white|Cut and dried.|Butterfly magnet. Deer tend to skip it.|None known.
wildmix|b,c,o,p|Jun-Sep|mixed|Cut bouquets.|Insectary strip. Feeds bees, hoverflies and parasitic wasps that eat garden pests.|Choose seed for your region.
marigold|b,c,e,o,p|Jun-Oct|orange, yellow, red|Edible petals. Dye. Pot marigold is calendula, a different plant.|French marigolds suppress root-knot nematodes when grown as a dense cover and confuse some pests. Whiteflies avoid them in trials.|Not a cure-all: it does not drive away deer or gophers.
nasturtium|b,c,e,o,p|Jun-Oct|orange, red, yellow|Peppery leaves, flowers and seed pods are edible.|Trap crop that draws aphids and cabbage white butterflies away from vegetables.|None known.
sunflower|b,c,e,o,p|Jul-Oct|yellow, orange, red, bicolor|Edible seed. Cut flower.|Trap crop for stink bugs and a living trellis. Birds eat the seed.|Heavy feeder. Shades its northern neighbors.
zinnia|b,c,e,o|Jul-Oct|every color|Cut flower. Petals are edible.|Pollinator and beneficial insect plant. Japanese beetles also love it, which can protect other crops.|Powdery mildew in wet weather.
calendula|b,c,e,m,o,p|May-Oct|orange, yellow|Petals for salve, tea and food coloring.|Trap crop for aphids. Draws hoverflies.|Allergic to daisies? Test first.
cosmos|b,c,e,o,p|Jul-Oct|pink, white, magenta, orange|Cut flower.|Draws lacewings, hoverflies and beneficial wasps.|None known.
alyssum|b,o,p,f|May-Oct|white, purple, pink|Honey-scented edging.|Hoverflies lay eggs among it, and the larvae eat aphids on nearby lettuce and brassicas.|None known.
daffodil|b,c,g,t|Mar-Apr|yellow, white, orange|Beauty. Never eat: bulbs look like onions.|Rodents, deer and gophers usually leave the bulbs alone.|All parts are poisonous.
yarrow|b,c,d,m,o,p|Jun-Sep|white, yellow, pink, red|Traditional wound herb and tea.|Draws hoverflies and lady beetles. Brings up minerals.|Some people react to the pollen. Not for pregnancy.
beebalm|b,c,e,m,o,h|Jun-Aug|red, pink, purple|Oswego tea. Leaves and flowers are edible.|Hummingbird and bee magnet.|Mildew-prone.
lavender|b,c,d,e,f,m,o,g,p|Jun-Aug|purple|Tea, sachets, baking, calming oil.|Deer, rabbits, gophers and moths dislike it.|Essential oil is not for swallowing.
chamomile|b,e,m,o,p|Jun-Sep|white|Calming tea.|Draws hoverflies. Called the plant doctor.|Allergy to ragweed relatives.
borage|b,e,m,o,p|Jun-Sep|blue|Edible flowers. Seed oil in tradition.|Bees love it. Said to deter tomato hornworm. Self-sows.|Contains pyrrolizidine alkaloids: do not take it as medicine.
echinacea|b,c,m,o,g|Jul-Sep|purple, pink, white|Traditional cold-season tea and tincture.|Goldfinch and bee plant. Deer sometimes browse it.|Not for those allergic to daisies.
feverfew|b,m,o,p|Jun-Sep|white|Traditional headache herb.|Bitter. Said to repel some insects.|Not for pregnancy.
valerian|b,f,m,o|Jun-Aug|white, pink|Traditional sleep root.|Draws beneficial insects.|Cats go wild for it.
stjohnswort|b,m,o|Jun-Aug|golden yellow|Traditional mood-lifting oil and tea.|Bee plant.|Interacts with many medicines. Skin sun sensitivity.
eveningprimrose|b,f,m,o|Jun-Sep, at dusk|yellow|Traditional seed oil. Evening moth plant.|Draws moths and bats.|None known.
chicory|b,e,m,o|Jul-Sep|blue|Roasted root coffee substitute. Edible leaves.|Blue wildflower for bees.|None known.
dandelion|b,e,m,o|Mar-Oct|yellow|Salad, wine and tea. Traditional digestive tonic.|First big nectar for bees.|Allergy to daisies.
hibiscus|b,e,m,h|Aug-Oct|yellow, red calyx|Roselle calyces make tart red tea.|Hummingbird plant.|Lowers blood pressure. Check with your clinician.
elderflower|b,e,f,m,o|May-Jun|cream|Flower cordial and traditional fever tea.|Early summer bee plant.|Other parts of the plant are toxic raw.
passionflower|b,e,m,f,o|Jun-Sep|purple|Traditional calming tea. Fruit is edible.|Host for fritillary butterflies.|Not for pregnancy.
anisehyssop|b,e,m,o,h,p|Jul-Sep|purple|Anise-flavored tea.|Hummingbird and bee magnet.|None known.
hyssop|b,e,m,o,p|Jun-Sep|blue, purple|Traditional cough tea.|Bee plant. Folklore pairs it with grapes and cabbage.|Not for pregnancy or epilepsy.
pineapplesage|b,e,h,o|Sep-Nov|red|Edible red flowers.|Hummingbird plant.|None known.
redclover|b,e,m,o,p|May-Sep|pink|Flower tea and traditional skin herb.|Nitrogen fixer and bee plant.|Not for those with hormone-sensitive conditions.
saffron|b,e,d|Oct-Nov|purple|The red threads are saffron.|None known.|Do not mix with autumn crocus, which is poisonous.
nigella|b,c,d,e,o|Jun-Aug|blue, white|Seed pods dry. Black cumin seed is the spice.|Bees and hoverflies.|None known.
catnip|b,m,o,p,g|Jun-Sep|lavender|Tea. Cats go wild.|Repels aphids, flea beetles and squash bugs in some trials.|Cats roll in it.
rose|b,c,e,m,f,o|May-Sep|every color|Petals and hips for tea and jelly.|Hips are rich in vitamin C. Roses attract Japanese beetles.|Spray only rose-safe products on edible roses.
`;

/* flower-specific neighbor rules, same format as the vegetable rules. Third field is an optional distance in feet */
const FLOWER_GOOD_TXT = `
tomato,alyssum|Alyssum draws hoverflies whose larvae eat aphids.
tomato,calendula|Calendula pulls aphids and whiteflies off tomatoes and draws hoverflies.
tomato,cosmos|Cosmos draws beneficial wasps and lacewings that eat tomato pests.
tomato,nicotiana|Whiteflies and aphids stick to flowering tobacco leaves. Keep the plant away from pets and children.
tomato,sunflower|Sunflowers give pollinators and trap stink bugs, but they shade tomatoes if planted on the south side.
tomato,pyrethrum|Pyrethrum daisies draw predators. The dried flowers are a natural insecticide.
cucumber,nasturtium|Nasturtium is said to draw cucumber beetles and aphids away from cucumbers.
cucumber,sunflower|Sunflowers give cucumber vines a trellis and draw pollinators.
cucumber,alyssum|Alyssum feeds hoverflies that eat cucumber aphids.
cucumber,tansy|Tansy is said to repel cucumber beetles. Little hard evidence.
cucumber,marigold|Marigolds draw pollinators and are said to confuse cucumber beetles.
zucchini,nasturtium|Nasturtium is said to draw squash bugs and whiteflies away from squash. Some gardeners swear by it.
zucchini,borage|Borage draws the bees squash needs for fruit set.
zucchini,tansy|Tansy is said to repel squash bugs and cucumber beetles. Little hard evidence.
winsq,nasturtium|Nasturtium is said to draw squash bugs away. A good living mulch.
winsq,sunflower|Sunflowers draw bees for squash and give a windbreak.
pumpkin,nasturtium|Nasturtium is said to deter squash bugs.
pumpkin,marigold|Marigolds draw pollinators and are said to confuse squash bugs.
corn,sunflower|Sunflowers give pollinator habitat at the corn field edge and draw beneficial insects.
corn,zinnia|Zinnia draws beneficial wasps that attack corn earworm.
corn,cosmos|Cosmos feeds beneficial wasps that eat corn pests.
@bra,alyssum|Alyssum draws hoverflies whose larvae eat cabbage aphids.
@bra,nasturtium|Nasturtium is a trap crop that draws aphids and cabbage white butterflies away.
@bra,calendula|Calendula is a trap crop for aphids and draws hoverflies.
@bra,cosmos|Cosmos draws parasitic wasps that attack cabbage worms.
@bra,ammi|Ammi draws parasitic wasps and hoverflies that hunt cabbage pests.
@bra,hyssop|Hyssop is said to draw cabbage white butterflies away from brassicas.
@bra,geranium|Geraniums are said to deter cabbage worm moths.
lettuce,alyssum|Alyssum draws hoverflies whose larvae eat lettuce aphids. This one is backed by field trials.
lettuce,calendula|Calendula draws hoverflies and acts as a trap for aphids.
lettuce,nasturtium|Nasturtium is a trap crop for aphids.
carrot,calendula|Calendula draws hoverflies and parasitic wasps that eat carrot pests.
carrot,ammi|Ammi relatives draw the same beneficial wasps and hoverflies.
carrot,cosmos|Cosmos draws beneficial insects to the carrot patch.
onion,calendula|Calendula draws hoverflies that eat onion aphids.
%legume,sweetpea|Sweet pea shares the bean family trellis and draws bees.
%legume,nasturtium|Nasturtium draws aphids off beans and leaves the pods clean.
%legume,marigold|Marigolds are said to draw beetles off beans. Evidence is mixed.
%legume,zinnia|Zinnias give pollinators and distract Mexican bean beetles.
bushbean,calendula|Calendula draws pollinators and acts as a trap crop for aphids.
peas,sweetpea|Same family, same trellis, same cool season.
peas,alyssum|Alyssum draws hoverflies that eat pea aphids.
polebean,sunflower|Sunflowers give pole beans a living pole and attract pollinators.
potato,alyssum|Alyssum draws beneficial insects to the potato patch.
potato,marigold|Marigolds are said to confuse Colorado potato beetles and suppress nematodes.
potato,nasturtium|Nasturtium is a trap crop for aphids.
pepper,marigold|Marigolds draw beneficials and are said to deter nematodes.
pepper,alyssum|Alyssum draws hoverflies that eat pepper aphids.
pepper,calendula|Calendula draws hoverflies and acts as an aphid trap.
eggplant,nasturtium|Nasturtium draws aphids and flea beetles away from eggplant.
eggplant,alyssum|Alyssum draws hoverflies that eat aphids on eggplant.
eggplant,marigold|Marigolds draw beneficial insects.
okra,marigold|Marigolds draw beneficials and are said to deter nematodes.
strawberry,borage|Borage draws pollinators and is said to improve strawberry flavor and set.
strawberry,alyssum|Alyssum draws hoverflies and keeps the strawberry bed busy with beneficial insects.
strawberry,marigold|Marigolds are said to deter nematodes in strawberry beds.
strawberry,pansy|Pansies draw pollinators and shade the soil.
%bramble,nasturtium|Nasturtium is said to deter aphids on cane berries.
%bramble,calendula|Calendula draws beneficial insects to the cane fruit.
grape,hyssop|An old vineyard pairing: hyssop draws bees and is said to improve fruit set.
grape,allium|Alliums are said to deter grape pests and give year-round vine cover.
%fruittree,nasturtium|Nasturtium is said to deter woolly aphids and codling moths. Mostly folk wisdom.
%fruittree,daffodil|A ring of daffodils keeps grass from the tree trunk and discourages gophers and rodents.
%fruittree,allium|Alliums discourage rodents and deer, and the flowers draw pollinators.
%fruittree,alyssum|Alyssum under fruit trees draws hoverflies and lacewings.
%fruittree,borage|Borage draws pollinators to the orchard.
%fruittree,comfrey|Comfrey brings up minerals and is a classic fruit tree guild plant.
rose,allium|Alliums are the best-known rose partners: said to deter aphids and black spot, and gophers leave the roots alone.
rose,lavender|Lavender repels aphids and deer and draws bees to the rose bed.
rose,catmint|Catmint repels aphids and covers the bare rose legs.
rose,alyssum|Alyssum draws hoverflies that eat rose aphids.
rose,clematis|The classic climbing partner: the clematis roots stay cool under the rose.
rose,salvia|Salvia draws beneficial insects and holds up under the rose's shade.
rose,geranium|Geraniums are said to lure Japanese beetles and be poisonous to them.
rose,marigold|Marigolds are said to deter nematodes and draw hoverflies.
rose,garlic|An old rose companion: garlic is said to deter aphids and fungal disease.
rose,chives|Chive flowers are said to deter aphids and black spot.
tulip,daffodil|Daffodils planted among tulips discourage gophers, voles and squirrels from digging the tulip bulbs.
tulip,allium|Alliums discourage rodents and cover the fading tulip foliage.
tulip,muscari|Grape hyacinths fill the gap and rodents tend to avoid them.
lily,allium|Alliums discourage rodents and aphids, and hide the bare lily stems.
lily,daffodil|Daffodils discourage rodents that dig lily bulbs.
dahlia,marigold|Marigolds are said to draw slugs and nematodes away from dahlias.
dahlia,allium|Alliums discourage gophers around the tubers.
gladiolus,marigold|Marigolds are said to deter thrips.
sunflower,sweetpea|Sweet pea climbs the sunflower stalk.
sunflower,zinnia|Both love sun and heat and draw different beneficial insects.
sunflower,cosmos|Both thrive in poor soil and draw beneficial insects.
sunflower,nasturtium|Nasturtium trails below sunflowers as a living mulch and aphid trap.
zinnia,marigold|A reliable pair for beneficial insects in hot sun.
zinnia,cosmos|Both draw beneficial wasps and hoverflies.
zinnia,basil|Basil and zinnia draw bees and repel some pests. Both love the heat.
cosmos,calendula|Both draw hoverflies and lacewings in a cottage-style bed.
lavender,salvia|Both love dry soil and sun and draw bees all summer.
lavender,catmint|A classic border pair: both love dry sun and deer skip them.
echinacea,blackeyedsusan|A prairie pair that feeds bees and goldfinches.
echinacea,salvia|Both love heat and drought and draw bees.
echinacea,liatris|A classic butterfly pair that thrives in poor soil.
milkweed,aster|Monarchs lay eggs on milkweed and need aster for fall fuel.
milkweed,goldenrod|Monarchs lay eggs on milkweed and need goldenrod for fall fuel.
foxglove,rose|An old cottage pair: foxglove is said to protect neighbors, and it blooms with the roses.
hellebore,daffodil|Daffodils bloom as hellebores fade, and both deer and gophers leave them alone.
peony,allium|Alliums fill the gaps and discourage digging pests.
peony,iris|Both love sun and dislike disturbance, and they bloom in sequence.
clematis,rose|The classic partner for climbing roses.
nasturtium,marigold|Both pull pests off nearby crops.
alyssum,calendula|Both feed hoverflies. A good insectary edge.
borage,calendula|Both pull in pollinators. Self-sowing partners.
pansy,tulip|Pansies carpet the soil under spring bulbs.
pansy,daffodil|Pansies carpet the soil under spring bulbs.
forgetmenot,tulip|Forget-me-nots carpet the soil under spring bulbs.
violet,daffodil|Violets carpet the soil under spring bulbs and draw early bees.
wildmix,%fruittree|A wildflower strip under fruit trees feeds the beneficial insects that eat orchard pests.
wildmix,tomato|A wildflower strip near tomatoes feeds the insects that eat hornworms and aphids.
wildmix,@cuc|A wildflower strip near squash feeds the bees that squash needs.
pyrethrum,rose|Pyrethrum daisies draw predators to the rose bed.
ammi,dill|Both draw tiny parasitic wasps and hoverflies. A full insectary.
`;
const FLOWER_BAD_TXT = `
foxglove,comfrey|The first-year leaves look just like comfrey, and people have been poisoned by mistaking them. Keep them apart and labeled.
foxglove,borage|Young foxglove leaves look like borage leaves, which are eaten. Keep them apart and labeled.
daffodil,%allium|Daffodil bulbs look like onions and have caused poisonings. Keep them well apart and labeled.
daffodil,garlic|Daffodil bulbs look like garlic and onions and have caused poisonings. Keep them well apart and labeled.
sweetpea,%allium|Alliums are said to stunt peas and beans. Keep them apart.
lupine,%allium|Alliums are said to stunt legumes. Keep them apart.
sweetpea,fennel|Fennel stunts most neighbors, including peas.
hollyhock,okra|They share rust and Japanese beetles. Both are in the mallow family.
hardyhibiscus,okra|They share rust, sawflies and Japanese beetles.
hollyhock,hardyhibiscus|They share rust and Japanese beetles.
morningglory,corn|Morning glory smothers corn and can topple it.
morningglory,%legume|Morning glory twines over beans and robs the light.
honeysuckle,%fruittree|Honeysuckle vines strangle young fruit trees and shade them.
clematis,%fruittree|A vigorous clematis can overwhelm a young fruit tree.
tansy,@cuc|Tansy roots compete hard, and it spreads. Give it a contained corner. (Some gardeners still use it as a trap near squash.)
tansy,@bra|Tansy roots compete hard, and it spreads. Give it a contained corner.
blackwalnut,peony|Juglone from black walnut roots harms peonies.
blackwalnut,hydrangea|Juglone from black walnut roots harms hydrangeas.
blackwalnut,petunia|Juglone from black walnut roots harms petunias.
blackwalnut,lilac|Black walnut roots stunt lilac.
blackwalnut,lily|Black walnut roots harm many lilies.
blackwalnut,tulip|Black walnut roots stunt tulips.
fennel,dahlia|Fennel stunts nearby flowers.
sunflower,@cuc|Large sunflowers shade squash vines and take much water and nutrients.
tulip,%root|Gophers and voles dig tulip bulbs, and then they move on to your root crops. Keep tulips in wire baskets away from the vegetables.
lily,%root|Gophers love lily bulbs and then move on to root crops. Plant lilies in wire baskets and away from vegetables.
dahlia,potato|Both are tuber crops that gophers, voles and slugs hunt. Together they make one big target.
milkweed,%fruittree|Milkweed aphids spread easily to fruit trees. Give it a corner away from the orchard.
`;
const FLOWER_TAGS = { b: '🌸 Beauty', c: '✂️ Cut flower', m: '⚕️ Traditional medicinal', e: '🍽 Edible', o: '🐝 Pollinators', p: '🐛 Pest helper', d: '💐 Dried', f: '🪻 Fragrant', h: '🐦 Hummingbirds', g: '🛡 Gopher and deer resistant', t: '☠️ Toxic: caution' };
const FLOWER_INFO = {}; (FLOWER_INFO_TXT + '\n' + FLOWER2_INFO_TXT).trim().split('\n').filter(l => l.indexOf('|') > 0).forEach(l => { const f = l.split('|'); FLOWER_INFO[f[0]] = { tags: f[1].split(','), bloom: f[2], colors: f[3], uses: f[4], role: f[5], caution: f[6] }; });
const FLOWER_IDS = new Set((FLOWER_TXT + '\n' + FLOWER2_TXT).trim().split('\n').filter(l => l.indexOf('|') > 0).map(l => l.split('|')[0]));
/* flowers and plants that discourage gophers (traditional and anecdotal, ranked): share of danger removed within about 6 feet */
const GREPEL = { daffodil: .45, allium: .4, fritillaria: .35, iris: .3, muscari: .2, hyacinth: .2, lavender: .25, rosemary: .25, sage: .2, salvia: .2, catmint: .15, marigold: .15, garlic: .3, chives: .2, onion: .2, peony: .1, hellebore: .15, foxglove: .1, columbine: .1 };
Object.assign(GREPEL, FLOWER2_GREPEL);
const FLOWER_DISCLAIMER = 'Traditional and historical uses are shared for gardeners, not as medical advice. Many beautiful flowers are poisonous, so identify plants with certainty and keep toxic ones away from children, pets and the kitchen. Companion planting claims range from solid research to old-timer folklore, and each pairing says which is which where it can.';
