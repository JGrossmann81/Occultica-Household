/* Backpackica trail food table. Generic foods only (no brand names).
   Values are PER 100 g of the portion eaten (for dry foods that is the dry weight carried), then scaled by the serving grams `g`.
   src: U = USDA FoodData Central generic value (SR Legacy / Foundation, rounded), T = typical package label, verify yours, R = rough typical estimate (restaurant food varies a lot).
   carry = grams actually carried per serving when that differs from what is eaten (cans, liquid, peel, pouches).
   cookMl = water to add or boil per serving (0 = none). cs = 1 if it can be cold-soaked (no stove). spoil = days it stays good in warm trail conditions (0 = not a worry).
   h2o = percent water by weight where known (rounded). See data/SOURCES-food.md for what was checked and what was not.
   Columns: id|name|cat|kind|g|serving label|kcal|protein|carb|fat|cookMl|cs|shelf|spoil|src|h2o|carry|note */
(function () {
  const TXT = `
tort-flour|Flour tortilla, 8 in|bread|dry|45|1 tortilla (45 g)|304|8.2|50.4|7.9|0|0|1-2 weeks unopened, about a week open|0|U|-|-|Packs flat and survives a pack better than bread. The classic trail wrap.
tort-big|Burrito-size flour tortilla, 10-12 in|bread|dry|70|1 tortilla (70 g)|304|8.2|50.4|7.9|0|0|1-2 weeks unopened, about a week open|0|U|-|-|Fewer, bigger wraps carry better than many small ones.
tort-corn|Corn tortilla, 6 in|bread|dry|26|1 tortilla (26 g)|218|5.7|44.6|2.9|0|0|1 week|0|U|-|-|Lighter and lower calorie than flour. Cracks if cold and dry; warm it first.
pita|Pita bread, white|bread|dry|60|1 pita (60 g)|275|9.1|55.7|1.2|0|0|3-5 days|0|U|-|-|Pocket pitas pack flatter than rolls.
bagel|Bagel, plain|bread|dry|100|1 bagel (100 g)|257|10|50.9|1.6|0|0|4-6 days|0|U|-|-|Dense and filling, but it weighs more per calorie than tortillas.
bread-wheat|Whole-wheat sandwich bread|bread|fresh|35|1 slice (35 g)|252|12.5|42.7|3.5|0|0|3-5 days; mold comes early in humid weather|4|U|-|-|Squishes in a pack and molds. A first-days food.
bread-white|White sandwich bread|bread|fresh|30|1 slice (30 g)|266|8.9|49.4|3.3|0|0|3-5 days; mold comes early in humid weather|4|U|-|-|Squishes in a pack and molds. A first-days food.
cracker-saltine|Saltine crackers|bread|dry|15|5 crackers (15 g)|421|9|74|10|0|0|Months|0|U|-|-|Crush-prone. Good with soup or cheese.
cracker-graham|Graham crackers|bread|dry|28|2 squares (28 g)|430|7|77|10|0|0|Months|0|U|-|-|Fragile. Handy for sweet snacks or a trail s'more.
pretzel|Hard pretzels|snack|dry|30|1 oz (30 g)|380|10|80|3|0|0|Months|0|U|-|-|Salty, which helps on hot days, but low in calories per ounce.
pb-jar|Peanut butter, smooth|spread|dry|32|2 tbsp (32 g)|597|22.5|22.3|51.1|0|0|Months; oil separates, stir|0|U|1|-|About 170 calories per ounce. Repack into a soft squeeze tube or bottle; glass and hard jars are heavy.
pb-pkt|Peanut butter, single-serve squeeze packet|spread|dry|32|1 packet (32 g)|597|22.5|22.3|51.1|0|0|Months|0|T|1|-|Same food as the jar, but the packet is trash you carry out and it costs more per ounce.
almond-butter|Almond butter|spread|dry|32|2 tbsp (32 g)|614|21|18.8|55.5|0|0|Months; oil separates, stir|0|U|-|-|Slightly more calories per ounce than peanut butter.
tahini|Tahini (sesame paste)|spread|dry|30|2 tbsp (30 g)|595|17|21.2|53.8|0|0|Months; stir|0|U|-|-|Good with honey on a tortilla.
choc-hazel|Chocolate-hazelnut spread|spread|dry|37|2 tbsp (37 g)|541|5.4|57|32|0|0|Months|0|T|-|-|A sweet, calorie-dense spread. Check your jar's label.
honey|Honey|spread|dry|21|1 tbsp (21 g)|304|0.3|82.4|0|0|0|Years|0|U|17|-|Squeeze bottle or straws. Do not give honey to infants.
jam|Jam or jelly|spread|dry|20|1 tbsp (20 g)|278|0.4|68.9|0.1|0|0|Months|0|U|-|-|Mostly sugar; carry a few single packets instead of a jar.
maple|Maple syrup|spread|dry|20|1 tbsp (20 g)|260|0|67|0.1|0|0|Months|0|U|-|-|Heavy to carry in glass; use a small plastic bottle.
sugar|Sugar, white|spread|dry|4|1 packet (4 g)|387|0|100|0|0|0|Years|0|U|0|-|For coffee, oatmeal and quick energy.
mayo-pkt|Mayonnaise packet|spread|dry|12|1 packet (12 g)|680|1|0.6|74.9|0|0|Unopened months; use all of an opened packet at once|0|U|-|-|Rich in fat and calories. Once opened in heat, finish it the same meal.
oil-olive|Olive oil (packet or small bottle)|oil|dry|14|1 tbsp (14 g)|884|0|0|100|0|0|Months|0|U|0|-|The densest food you can carry: about 250 calories per ounce. Stir into dinner.
oil-veg|Vegetable or canola oil|oil|dry|14|1 tbsp (14 g)|884|0|0|100|0|0|Months|0|U|0|-|Same calories as olive oil; cheaper.
oil-coconut|Coconut oil|oil|dry|14|1 tbsp (14 g)|862|0|0|100|0|0|Months|0|U|0|-|Melts above about 76 F. Carry in a leakproof bottle.
ghee|Ghee (clarified butter)|oil|dry|14|1 tbsp (14 g)|876|0.3|0|99.5|0|0|Months without a fridge|0|U|0|-|Shelf-stable butter flavor with no water weight.
butter|Butter|dairy|fresh|14|1 tbsp (14 g)|717|0.9|0.1|81.1|0|0|Salted keeps several days if it stays cool; melts in heat|3|U|16|-|Fine for a few days in cool weather; ghee or oil is a safer long-haul fat.
cheddar|Cheddar cheese, hard block|dairy|dry|28|1 oz (28 g)|403|22.9|3.1|33.3|0|0|Hard cheese keeps days to a week or more if it stays cool; sweats oil in heat|5|U|37|-|Wax-coated or vacuum-packed blocks last longest. Trim off any mold, and discard if slimy or smelly.
parmesan|Parmesan, hard|dairy|dry|28|1 oz (28 g)|431|38.5|4.1|28.6|0|0|Weeks; very hard cheese holds up well|10|U|29|-|The hardest cheese keeps best. Grate or shave over dinner.
gouda|Gouda, aged|dairy|dry|28|1 oz (28 g)|356|24.9|2.2|27.4|0|0|Days to a week or more if cool|5|U|41|-|Aged waxed cheese travels well.
swiss|Swiss cheese|dairy|dry|28|1 oz (28 g)|393|27|1.4|31|0|0|Days to a week if cool|5|U|37|-|Firm cheese that holds up better than soft cheese.
provolone|Provolone|dairy|dry|28|1 oz (28 g)|351|25.6|2.1|26.6|0|0|Days to a week if cool|5|U|41|-|Firm cheese.
jack|Monterey jack|dairy|dry|28|1 oz (28 g)|373|24.5|0.7|30.3|0|0|Days to a week if cool|5|U|41|-|Firm cheese, good in quesadillas.
mozz-string|Mozzarella string cheese|dairy|fresh|28|1 stick (28 g)|254|24.3|2.8|15.9|0|0|Perishable dairy: keep it cool and eat it early; unsafe after 2 hours above 40 F (1 hour above 90 F)|1|U|49|-|Soft and moist. Eat on day 1.
milk-whole-pwd|Whole milk powder|dairy|dry|30|about 1/4 cup (30 g)|496|26.3|38.4|26.7|240|1|Months sealed|0|U|2|-|Stir into oatmeal or coffee, or mix with cold water. Fat makes it spoil sooner than nonfat once opened.
milk-nonfat-pwd|Nonfat dry milk|dairy|dry|25|about 1/3 cup (25 g)|362|36.2|52.2|0.8|240|1|Months sealed|0|U|4|-|Lighter than whole milk powder per cup, but fewer calories.
egg-boiled|Hard-boiled egg|dairy|fresh|50|1 large egg (50 g)|155|12.6|1.1|10.6|0|0|Perishable: keep it cold and eat it at the first meal; unsafe after 2 hours above 40 F (1 hour above 90 F)|1|U|75|-|Perishable. Only for the first lunch out of town, packed cold.
whey|Protein powder (whey, typical)|drink|drink-mix|30|1 scoop (30 g)|400|78|7|6|240|1|Months|0|T|-|-|Check your tub. Mix with cold water in a bottle.
jerky-beef|Beef jerky|meat|dry|28|1 oz (28 g)|410|33.2|11|25.6|0|0|Commercial: months sealed; homemade: weeks|0|U|23|-|Protein-dense and light. Salty.
stick-meat|Meat snack stick (typical)|meat|dry|28|1 stick (28 g)|380|24|2|32|0|0|Weeks to months|0|T|-|-|Check your label. Salty and fatty.
salami-dry|Dry salami, hard|meat|dry|56|2 oz (56 g)|407|22.6|1.2|33.7|0|0|Unopened dry-cured: weeks without a fridge|10|U|36|-|Keeps better than most meats. Trim any slime or mold; if it smells off, discard.
pepperoni|Pepperoni|meat|dry|56|2 oz (56 g)|504|19.3|1.2|46.5|0|0|Weeks if dry-cured and kept cool|10|U|-|-|Very fatty and calorie-dense.
chorizo-dry|Dry-cured chorizo|meat|dry|56|2 oz (56 g)|455|24.1|1.9|38.3|0|0|Weeks if dry-cured and kept cool|10|U|-|-|Check that it is the dry-cured kind, not fresh raw chorizo.
bacon-cooked|Bacon, cooked and crisp|meat|fresh|16|2 slices (16 g)|541|37|1.4|41.8|0|0|Home-cooked bacon is perishable: eat on day 1 and keep it cool (unsafe after 2 hours above 40 F, 1 hour above 90 F). Shelf-stable precooked bacon: follow its label|1|U|-|-|Fatty and tasty but short-lived.
tuna-can-water|Tuna, canned in water (drained)|canned|wet|100|1 can, drained (about 100 g)|116|25.5|0|0.8|0|0|Years sealed|0|U|74|170|A wet food: you carry the can and the liquid (about 170 g) for about 100 g of fish. Pouches are lighter.
tuna-can-oil|Tuna, canned in oil (drained)|canned|wet|100|1 can, drained (about 100 g)|198|29.1|0|8.2|0|0|Years sealed|0|U|-|170|Higher calories than water-packed, but still a heavy can.
tuna-pouch|Tuna pouch, about 2.6 oz|canned|wet|74|1 pouch (74 g)|94|21|0|1|0|0|Months to years sealed|0|T|-|80|Lighter than a can and no draining. Check your label.
chicken-pouch|Chicken pouch, about 2.6 oz|canned|wet|74|1 pouch (74 g)|100|19|1|2|0|0|Months to years sealed|0|T|-|80|Good protein, low calories per ounce. Pair it with oil or mayo.
sardines-can|Sardines in oil, canned (drained)|canned|wet|92|1 can, drained (about 92 g)|208|24.6|0|11.5|0|0|Years sealed|0|U|60|125|Calorie-dense for a canned fish. You carry the can and oil.
nut-almond|Almonds|nuts|dry|28|1 oz (28 g)|579|21.2|21.6|49.9|0|0|Months|0|U|4|-|About 165 calories per ounce.
nut-cashew|Cashews, dry roasted|nuts|dry|28|1 oz (28 g)|574|15.3|32.7|46.4|0|0|Months|0|U|2|-|Soft and sweet.
nut-peanut|Peanuts, dry roasted|nuts|dry|28|1 oz (28 g)|587|24.4|21.5|49.7|0|0|Months|0|U|2|-|Cheap and filling. Peanut allergy applies.
nut-walnut|Walnuts|nuts|dry|28|1 oz (28 g)|654|15.2|13.7|65.2|0|0|Months in a cool place|0|U|4|-|Among the most calorie-dense nuts.
nut-pecan|Pecans|nuts|dry|28|1 oz (28 g)|691|9.2|13.9|72|0|0|Months in a cool place|0|U|4|-|The densest common nut.
nut-pistachio|Pistachios, dry roasted|nuts|dry|28|1 oz (28 g)|572|21.1|27.5|45.8|0|0|Months|0|U|2|-|Shelled ones weigh less; shells are trash to carry out.
nut-macadamia|Macadamia nuts|nuts|dry|28|1 oz (28 g)|718|7.9|13.8|75.8|0|0|Months in a cool place|0|U|2|-|The densest nut of all, about 200 calories per ounce.
nut-hazelnut|Hazelnuts|nuts|dry|28|1 oz (28 g)|628|15|16.7|60.8|0|0|Months in a cool place|0|U|5|-|Pairs with chocolate.
nut-brazil|Brazil nuts|nuts|dry|28|1 oz (28 g)|659|14.3|12.3|67.1|0|0|Months in a cool place|0|U|3|-|Very high in selenium; a couple a day is plenty.
nut-pine|Pine nuts|nuts|dry|28|1 oz (28 g)|673|13.7|13.1|68.4|0|0|Weeks; goes rancid sooner|0|U|2|-|Expensive. Good in couscous.
seed-sunflower|Sunflower seed kernels|nuts|dry|28|1 oz (28 g)|584|20.8|20|51.5|0|0|Months|0|U|5|-|Cheap and calorie-dense.
seed-pumpkin|Pumpkin seeds (pepitas)|nuts|dry|28|1 oz (28 g)|559|30.2|10.7|49.1|0|0|Months|0|U|5|-|High protein for a seed.
seed-chia|Chia seeds|nuts|dry|12|1 tbsp (12 g)|486|16.5|42.1|30.7|0|0|Years|0|U|6|-|Absorbs water into a gel. Great stirred into cold-soaked oats.
seed-hemp|Hemp seeds, shelled|nuts|dry|30|3 tbsp (30 g)|553|31.6|8.7|48.8|0|0|Months in a cool place|0|U|5|-|Protein-rich and mild.
seed-flax|Flaxseed, ground|nuts|dry|10|1 tbsp (10 g)|534|18.3|28.9|42.2|0|0|Weeks once ground|0|U|7|-|Stir into oatmeal.
seed-sesame|Sesame seeds|nuts|dry|9|1 tbsp (9 g)|573|17.7|23.5|49.7|0|0|Months|0|U|5|-|Sprinkle on rice or noodles.
coconut-dry|Coconut, dried and unsweetened|nuts|dry|20|about 1/4 cup (20 g)|660|6.9|23.7|64.5|0|0|Months|0|U|3|-|Light and fatty.
trailmix|Trail mix with chocolate chips, salted nuts and seeds|snack|dry|60|1/3 cup (60 g)|462|13.8|44.9|29.4|0|0|Months|0|U|-|-|Mix your own with more nuts and less raisins for more calories per ounce.
fruit-raisin|Raisins|fruit|dry|40|1/4 cup (40 g)|299|3.1|79.2|0.5|0|0|Months|0|U|15|-|Light carbs. Not very calorie-dense by weight.
fruit-currant|Dried currants|fruit|dry|40|1/4 cup (40 g)|283|4.1|74.1|0.3|0|0|Months|0|U|-|-|Smaller than raisins.
fruit-date|Dates, Medjool|fruit|dry|24|1 date (24 g)|277|1.8|75|0.2|0|0|Months|0|U|21|-|Sweet and chewy. Pit them at home to save weight.
fruit-apricot|Dried apricots|fruit|dry|40|about 5 halves (40 g)|241|3.4|62.6|0.5|0|0|Months|0|U|31|-|Sulfured ones keep color but bother some people.
fruit-prune|Prunes (dried plums)|fruit|dry|40|about 4 prunes (40 g)|240|2.2|63.9|0.4|0|0|Months|0|U|31|-|Sweet; eat a few at a time.
fruit-fig|Dried figs|fruit|dry|40|about 2 figs (40 g)|249|3.3|63.9|0.9|0|0|Months|0|U|30|-|Good with nut butter.
fruit-apple|Dried apple rings|fruit|dry|30|about 5 rings (30 g)|243|0.9|65.9|0.3|0|0|Months|0|U|32|-|The dry swap for a fresh apple: about a quarter of the weight.
fruit-cranberry|Dried cranberries, sweetened|fruit|dry|40|1/3 cup (40 g)|308|0.1|82.8|1.4|0|0|Months|0|U|-|-|Mostly added sugar.
fruit-bananachip|Banana chips (fried)|fruit|dry|30|about 1/3 cup (30 g)|519|2.3|58.4|33.6|0|0|Months|0|U|-|-|Much higher in calories than fresh or dried banana because they are fried.
fruit-mango-dry|Dried mango, sweetened (typical)|fruit|dry|40|about 4 pieces (40 g)|345|2|82|1|0|0|Months|0|T|-|-|Check your label; varies by brand.
fruit-leather|Fruit leather (typical)|fruit|dry|20|1 roll (20 g)|330|1|80|1.5|0|0|Months|0|T|-|-|Light and quick, but mostly sugar.
bar-granola-soft|Chewy granola bar (typical)|snack|dry|24|1 bar (24 g)|410|7|70|12|0|0|Months|0|T|-|-|Check your label.
bar-granola-hard|Crunchy granola bar|snack|dry|25|1 bar (25 g)|471|10.1|64.4|19.8|0|0|Months|0|U|-|-|Crumbles in a pack.
bar-protein|Protein bar (typical)|snack|dry|60|1 bar (60 g)|390|33|35|13|0|0|Months|0|T|-|-|Check your label; textures harden in the cold.
bar-fruitnut|Fruit-and-nut bar (typical)|snack|dry|40|1 bar (40 g)|450|10|55|20|0|0|Months|0|T|-|-|Check your label.
bar-meal|Dense meal bar (typical)|snack|dry|85|1 bar (85 g)|447|12|60|17|0|0|Months|0|T|-|-|The high-calorie type. Check your label.
gel|Energy gel packet (typical)|snack|treat|34|1 packet (34 g)|294|0|73|0|0|0|Months|0|T|-|-|Quick sugar for hard climbs. Many are low in calories per ounce.
chews|Energy chews (typical)|snack|treat|30|3 pieces (30 g)|333|0|83|0|0|0|Months|0|T|-|-|Check your label.
chip-potato|Potato chips|snack|treat|28|1 oz (28 g)|536|7|53|35|0|0|Weeks; crushes easily|0|U|2|-|Very calorie-dense for a snack but bulky and crushable. Buy small bags.
popcorn|Popcorn, air-popped|snack|treat|8|1 cup (8 g)|387|12.9|77.8|4.5|0|0|Weeks|0|U|4|-|Very bulky and low in calories per cup.
pork-rind|Pork rinds|snack|treat|14|1/2 oz (14 g)|544|61.3|0|31.3|0|0|Weeks|0|U|-|-|Very light and high in protein; salty and crushable.
cookie-choc|Chocolate chip cookie (typical)|sweet|treat|30|1 cookie (30 g)|480|5|65|22|0|0|1-2 weeks|0|T|-|-|Crumbles; best in a hard container.
candy-bar|Candy bar with nuts and caramel (typical)|sweet|treat|50|1 bar (50 g)|500|7|60|25|0|0|Months; melts in heat|0|T|-|-|Check your label; wrapped bars survive heat better than chocolate.
choc-milk|Milk chocolate|sweet|treat|43|1 bar (43 g)|535|7.7|59.4|29.7|0|0|Months; melts above about 80 F|0|U|1|-|Melts in heat. Keep it deep inside the pack.
choc-dark|Dark chocolate, 70-85% cacao|sweet|treat|40|about 4 squares (40 g)|598|7.8|45.9|42.6|0|0|Months; melts above about 80 F|0|U|1|-|More calories per ounce than milk chocolate.
cocoa-powder|Cocoa powder, unsweetened|sweet|treat|5|1 tbsp (5 g)|228|19.6|57.9|13.7|0|0|Years|0|U|3|-|Stir into oatmeal or milk powder for a hot cocoa.
jellybean|Jelly beans|sweet|treat|40|about 10 beans (40 g)|375|0|93.1|0.1|0|0|Months|0|U|-|-|Pure sugar, light.
marshmallow|Marshmallows|sweet|treat|28|about 4 large (28 g)|318|1.8|81.3|0.2|0|0|Weeks|0|U|16|-|Bulky and light.
candy-hard|Hard candy|sweet|treat|20|about 4 pieces (20 g)|394|0|98|0.2|0|0|Years|0|U|-|-|Good for dry throat and morale.
oats-rolled|Rolled oats, dry|breakfast|dry|40|1/2 cup dry (40 g)|379|13.2|67.7|6.5|240|1|Months|0|U|8|-|Cooks with hot water in minutes; can be cold-soaked overnight.
oats-instant|Instant oatmeal, flavored packet (typical)|breakfast|dry|43|1 packet (43 g)|372|9|74|4|180|1|Months|0|T|-|-|Check your box. Add nut butter or oil for more calories.
granola|Granola (typical)|breakfast|dry|55|about 1/2 cup (55 g)|450|10|65|18|0|0|Months|0|T|-|-|Check your label.
cereal-corn|Corn flakes cereal|breakfast|dry|30|1 cup (30 g)|357|7.5|84|0.4|0|0|Months|0|U|3|-|Very bulky. Crush it with milk powder in a bag.
pancake-mix|Pancake mix, add-water type (typical)|breakfast|dry|80|about 3/4 cup mix (80 g)|375|8|77|2.5|120|0|Months|0|T|-|-|Needs a pan and a stove and oil.
cocoa-mix|Hot chocolate mix (typical)|drink|drink-mix|28|1 packet (28 g)|390|5|80|7|240|1|Years|0|T|-|-|Check your label.
coffee-instant|Instant coffee granules|drink|drink-mix|2|1 tsp (2 g)|353|12.2|75.4|0.5|240|1|Years|0|U|3|-|Almost no calories in a cup.
coffee-3in1|Instant coffee with creamer and sugar (typical)|drink|drink-mix|18|1 sachet (18 g)|444|3|72|14|240|1|Months|0|T|-|-|Check your label.
elyte-sugar|Electrolyte drink mix, sugar-based (typical)|drink|drink-mix|12|1 packet (12 g)|375|0|93|0|500|1|Years|0|T|-|-|Sodium varies a lot by product. Check your label.
elyte-tab|Electrolyte tablet, no sugar (typical)|drink|drink-mix|4|1 tablet (4 g)|100|0|25|0|500|1|Years|0|T|-|-|Check your label for sodium.
drink-mix|Sweetened drink mix powder (typical)|drink|drink-mix|20|1 serving (20 g)|375|0|95|0|500|1|Years|0|T|-|-|Check your label.
bouillon|Bouillon cube (typical)|side|dry|4|1 cube (4 g)|250|8|20|15|240|1|Years|0|T|-|-|Mostly salt: a cube can have 800 mg or more of sodium. Check your label.
rice-white|White rice, uncooked|grain|dry|75|about 1/3 cup dry (75 g)|365|7.1|80|0.7|240|0|Years|0|U|12|-|Needs 15-20 minutes of simmering: fuel-hungry. Instant rice is lighter on fuel.
rice-instant|Instant rice, dry (typical)|grain|dry|60|about 3/4 cup dry (60 g)|375|7|83|0.7|180|0|Years|0|T|-|-|Steeps in hot water in 5-10 minutes.
rice-brown|Brown rice, uncooked|grain|dry|75|about 1/3 cup dry (75 g)|370|7.9|77.2|2.9|300|0|Months|0|U|10|-|Takes 40 minutes to cook: not a great trail food.
couscous|Couscous, dry|grain|dry|60|about 1/3 cup dry (60 g)|376|12.8|77.4|0.6|150|1|Years|0|U|9|-|Ready in 5 minutes with hot water, or cold-soak.
bulgur|Bulgur, dry|grain|dry|60|about 1/3 cup dry (60 g)|342|12.3|75.9|1.3|180|1|Years|0|U|9|-|Fine bulgur soaks in a few minutes with hot water.
quinoa|Quinoa, uncooked|grain|dry|60|about 1/3 cup dry (60 g)|368|14.1|64.2|6.1|180|0|Years|0|U|13|-|Rinse first; 15 minutes of simmering.
pasta|Pasta, dry|grain|dry|85|3 oz (85 g)|371|13|74.7|1.5|500|0|Years|0|U|10|-|Boiling needs a lot of water and fuel. Thin noodles cook faster.
noodle-rice|Rice noodles, dry|grain|dry|60|2 oz (60 g)|364|3.4|80.2|0.6|450|1|Years|0|U|-|-|Soak in hot water without a long boil.
ramen|Instant noodle block with seasoning (typical)|side|dry|85|1 block (85 g)|445|9.5|60|18|480|0|Months|0|T|-|-|Very salty (often well over 1,000 mg sodium for a whole package). Check your label.
potato-flakes|Instant mashed potato flakes (typical)|side|dry|40|about 1/2 cup flakes (40 g)|360|8|82|0.5|180|1|Months|0|T|-|-|Add oil, cheese or milk powder. Ready in a minute with hot water.
beans-refried|Instant refried bean flakes (typical)|side|dry|45|about 1/2 cup flakes (45 g)|340|20|60|1.5|150|1|Months|0|T|-|-|Check your package. Quick with hot water; tortilla filling.
tvp|Textured vegetable protein, dry (typical)|side|dry|25|about 1/3 cup dry (25 g)|330|50|30|1|60|1|Years|0|T|-|-|Rehydrates with hot water; takes on flavor from sauces.
beans-black-dry|Black beans, dry|side|dry|60|about 1/3 cup dry (60 g)|341|21.6|62.4|1.4|600|0|Years|0|U|11|-|Needs soaking and a long cook: not practical on trail unless pre-cooked and dried at home.
lentils|Lentils, dry|side|dry|60|about 1/3 cup dry (60 g)|352|24.6|63.4|1.1|450|0|Years|0|U|10|-|About 20 minutes of simmering. Practical dry protein.
splitpeas|Split peas, dry|side|dry|60|about 1/3 cup dry (60 g)|352|23.8|63.7|1.2|500|0|Years|0|U|11|-|Needs a longer simmer than lentils.
chickpeas-dry|Chickpeas, dry|side|dry|60|about 1/3 cup dry (60 g)|378|20.5|62.9|6|600|0|Years|0|U|11|-|Needs soaking and a long cook.
buckwheat|Buckwheat groats|grain|dry|60|about 1/3 cup dry (60 g)|343|13.3|71.5|3.4|180|0|Months|0|U|10|-|About 15 minutes of simmering.
flour-ap|All-purpose flour|grain|dry|60|about 1/2 cup (60 g)|364|10.3|76.3|1|60|0|Months|0|U|12|-|For flatbread or bannock in a pan.
meal-pasta|Freeze-dried pasta dinner, whole pouch (typical)|meal|meal-dehydrated|130|1 pouch dry (label says about 2 servings)|470|15|65|16|500|0|2+ years sealed; check the date|0|T|-|-|Check your pouch. Most hikers eat the whole pouch. About 130 calories per ounce.
meal-ricechicken|Freeze-dried rice and chicken dinner, whole pouch (typical)|meal|meal-dehydrated|130|1 pouch dry (label says about 2 servings)|440|22|60|11|480|0|2+ years sealed; check the date|0|T|-|-|Check your pouch.
meal-beansrice|Freeze-dried beans and rice dinner, whole pouch (typical)|meal|meal-dehydrated|125|1 pouch dry (label says about 2 servings)|435|15|70|9|470|0|2+ years sealed; check the date|0|T|-|-|Check your pouch.
meal-potatobeef|Freeze-dried beef and potato dinner, whole pouch (typical)|meal|meal-dehydrated|125|1 pouch dry (label says about 2 servings)|410|16|55|14|470|0|2+ years sealed; check the date|0|T|-|-|Check your pouch.
meal-curry|Freeze-dried vegetable curry dinner, whole pouch (typical)|meal|meal-dehydrated|120|1 pouch dry (label says about 2 servings)|440|12|63|15|450|0|2+ years sealed; check the date|0|T|-|-|Check your pouch.
meal-eggs|Freeze-dried scrambled egg breakfast, whole pouch (typical)|meal|meal-dehydrated|100|1 pouch dry|450|20|30|27|300|0|2+ years sealed; check the date|0|T|-|-|Check your pouch.
meal-oatfruit|Freeze-dried oatmeal and fruit breakfast, whole pouch (typical)|meal|meal-dehydrated|95|1 pouch dry|420|9|70|11|300|1|2+ years sealed; check the date|0|T|-|-|Check your pouch.
beans-can-black|Black beans, canned (drained)|canned|wet|250|about 1 can drained (250 g)|132|8.9|23.7|0.5|0|0|Years sealed|0|U|65|470|A wet food: roughly 470 g carried (can and liquid) for 250 g of beans, about 330 calories. The dry swap is instant bean flakes.
chickpeas-can|Chickpeas, canned (drained)|canned|wet|250|about 1 can drained (250 g)|164|8.9|27.4|2.6|0|0|Years sealed|0|U|60|470|A wet food: heavy can and liquid. Use dry or flakes on a long stretch.
rice-pouch|Cooked rice pouch (microwave style)|canned|wet|250|1 pouch (250 g)|130|2.7|28.2|0.3|0|0|Months sealed|0|U|68|255|About two-thirds water by weight. Instant rice weighs about one-third as much.
applesauce|Unsweetened applesauce pouch|canned|wet|90|1 pouch (90 g)|42|0.2|11.3|0.1|0|0|Months sealed|0|U|88|95|Mostly water. Dried apple rings give you the same fruit at a fraction of the weight.
hummus|Hummus (tub)|canned|wet|60|1/4 cup (60 g)|166|7.9|14.3|9.6|0|0|Perishable: keep it cold; discard after 2 hours above 40 F (1 hour above 90 F)|1|U|65|65|Perishable and wet; a town-day food.
fresh-banana|Banana|produce|fresh|118|1 medium (118 g peeled)|89|1.1|22.8|0.3|0|0|2-3 days; bruises|3|U|75|180|You carry the peel too (about 180 g carried for 118 g eaten).
fresh-apple|Apple|produce|fresh|182|1 medium (182 g)|52|0.3|13.8|0.2|0|0|A couple of weeks if firm|14|U|86|-|About 86% water: 100 calories for about 6 oz. Dried apple rings are the dry swap.
fresh-orange|Orange|produce|fresh|131|1 medium (131 g peeled)|47|0.9|11.8|0.1|0|0|1-2 weeks|10|U|87|180|You carry the peel too (about 180 g carried, approximate).
fresh-grapes|Grapes|produce|fresh|150|1 cup (150 g)|69|0.7|18.1|0.2|0|0|About 5 days|5|U|81|-|Mostly water, fragile.
fresh-peach|Peach|produce|fresh|150|1 medium (150 g)|39|0.9|9.5|0.3|0|0|2-3 days when ripe|3|U|89|-|A town-day treat; bruises.
fresh-pear|Pear|produce|fresh|178|1 medium (178 g)|57|0.4|15.2|0.1|0|0|About a week if firm|7|U|84|-|Mostly water.
fresh-plum|Plum|produce|fresh|66|1 plum (66 g)|46|0.7|11.4|0.3|0|0|3-4 days|4|U|87|-|Mostly water.
fresh-blueberry|Blueberries|produce|fresh|75|1/2 cup (75 g)|57|0.7|14.5|0.3|0|0|About 5 days; crush easily|4|U|84|-|Mostly water; fragile.
fresh-strawberry|Strawberries|produce|fresh|150|1 cup (150 g)|32|0.7|7.7|0.3|0|0|1-2 days|2|U|91|-|A town-day food; mostly water.
fresh-watermelon|Watermelon|produce|fresh|150|1 cup (150 g)|30|0.6|7.6|0.2|0|0|Eat in town|1|U|91|-|About 91% water: for the trailhead, not the pack.
fresh-mango|Mango|produce|fresh|165|1 cup (165 g)|60|0.8|15|0.4|0|0|2-3 days when ripe|3|U|83|-|Messy; eat in town.
fresh-carrot|Carrot|produce|fresh|61|1 medium (61 g)|41|0.9|9.6|0.2|0|0|About 2 weeks|14|U|88|-|One of the tougher fresh vegetables.
fresh-babycarrot|Baby carrots|produce|fresh|85|about 8 carrots (85 g)|35|0.6|8.2|0.1|0|0|About a week|7|U|90|-|Holds up better than most produce.
fresh-pepper|Bell pepper|produce|fresh|120|1/2 large pepper (120 g)|26|1|6|0.3|0|0|About 5 days|5|U|92|-|92% water.
fresh-tomato|Cherry tomatoes|produce|fresh|100|about 6 (100 g)|18|0.9|3.9|0.2|0|0|About 4 days; squash easily|4|U|94|-|94% water.
fresh-cucumber|Cucumber|produce|fresh|100|about 1/3 cucumber (100 g)|15|0.7|3.6|0.1|0|0|About 4 days|4|U|95|-|95% water: a refreshing snack that you pay for by the pound.
fresh-celery|Celery|produce|fresh|100|2 stalks (100 g)|14|0.7|3|0.2|0|0|About 5 days|5|U|95|-|Almost no calories for its weight.
fresh-snappea|Sugar snap peas|produce|fresh|100|about 1 cup (100 g)|42|2.8|7.6|0.2|0|0|About 4 days|4|U|-|-|A crunchy fresh snack for the first days.
fresh-avocado|Avocado|produce|fresh|150|1 medium (150 g peeled)|160|2|8.5|14.7|0|0|2-4 days once ripe|4|U|73|200|The calorie-dense fresh food. You carry the skin and pit (about 200 g carried).
croissant|Croissant, butter|deli|fresh|57|1 croissant (57 g)|406|8.2|45.8|21|0|0|About 2 days|2|U|-|-|Crushes in a pack; a first-morning treat.
pizza|Cheese pizza slice (town food)|deli|meal-fresh|107|1 slice (about 107 g)|266|11.4|33|10.4|0|0|Eat right away; cooked food is unsafe after 2 hours above 40 F (1 hour above 90 F)|1|U|-|-|A town meal. Leftovers do not last without cold.
burrito|Bean-and-cheese burrito, restaurant (typical)|deli|meal-fresh|300|1 burrito (about 300 g)|200|8|28|6|0|0|Eat right away; cooked food is unsafe after 2 hours above 40 F (1 hour above 90 F)|1|R|-|-|Restaurant burritos vary widely (500-1,100 calories). Rough typical value.
burger|Cheeseburger, fast-food style|deli|meal-fresh|120|1 burger (about 120 g)|250|13|27|11|0|0|Eat right away; cooked food is unsafe after 2 hours above 40 F (1 hour above 90 F)|1|R|-|-|Rough typical value; varies by restaurant.
fries|French fries, fast-food style|deli|meal-fresh|117|1 medium order (about 117 g)|320|3.4|41|15.5|0|0|Eat right away; cooked food is unsafe after 2 hours above 40 F (1 hour above 90 F)|1|R|-|-|Rough typical value; varies by restaurant.
colby|Colby cheese|dairy|dry|28|1 oz (28 g)|394|23.8|2.6|32.1|0|0|Days to a week if cool|5|U|-|-|Firm cheese.
edam|Edam cheese|dairy|dry|28|1 oz (28 g)|357|25|1.4|28|0|0|Days to a week or more if cool|6|U|-|-|Wax-coated rounds travel well.
romano|Romano cheese, hard|dairy|dry|28|1 oz (28 g)|387|31.8|3.6|26.9|0|0|Weeks; very hard|10|U|-|-|Hard and salty; shave over dinner.
nut-peanut-raw|Peanuts, raw|nuts|dry|28|1 oz (28 g)|567|25.8|16.1|49.2|0|0|Months|0|U|7|-|Raw nuts need no cooking but taste better roasted.
nut-cashew-raw|Cashews, raw|nuts|dry|28|1 oz (28 g)|553|18.2|30.2|43.9|0|0|Months|0|U|5|-|Slightly fewer calories than roasted.
seed-sunflower-roast|Sunflower seed kernels, dry roasted|nuts|dry|28|1 oz (28 g)|582|19.3|24.1|49.8|0|0|Months|0|U|-|-|Cheap and filling.
fruit-peach-dry|Dried peaches|fruit|dry|40|about 3 halves (40 g)|239|3.6|61.3|0.8|0|0|Months|0|U|-|-|The dry swap for a fresh peach.
fruit-pear-dry|Dried pears|fruit|dry|40|about 3 halves (40 g)|262|1.9|69.7|0.6|0|0|Months|0|U|-|-|Sweet and chewy.
fruit-date-deglet|Dates, Deglet Noor|fruit|dry|24|about 3 dates (24 g)|282|2.5|75|0.4|0|0|Months|0|U|-|-|Drier and firmer than Medjool.
barley|Barley, pearled (uncooked)|grain|dry|60|about 1/3 cup dry (60 g)|352|9.9|77.7|1.2|500|0|Years|0|U|10|-|Needs 30+ minutes of simmering: not a trail favorite.
millet|Millet, uncooked|grain|dry|60|about 1/3 cup dry (60 g)|378|11|72.9|4.2|240|0|Months|0|U|9|-|About 20 minutes of simmering.
noodle-egg|Egg noodles, dry|grain|dry|85|3 oz (85 g)|384|14.2|71.3|4.4|450|0|Months|0|U|-|-|Cooks a little faster than regular pasta.
cornmeal|Cornmeal, whole grain|grain|dry|60|about 1/2 cup (60 g)|361|8.1|76.9|3.9|300|0|Months|0|U|-|-|For polenta or a corn cake.
flour-wheat|Whole-wheat flour|grain|dry|60|about 1/2 cup (60 g)|340|13.2|72|2.5|60|0|Months|0|U|-|-|For flatbread or bannock in a pan.
rice-wild|Wild rice, uncooked|grain|dry|60|about 1/3 cup dry (60 g)|357|14.7|74.9|1.1|300|0|Years|0|U|-|-|About 45 minutes to cook: too fuel-hungry for most trips.
beans-pinto-dry|Pinto beans, dry|side|dry|60|about 1/3 cup dry (60 g)|347|21.4|62.6|1.2|600|0|Years|0|U|12|-|Needs soaking and a long cook; better as pre-cooked flakes.
beans-kidney-dry|Kidney beans, dry|side|dry|60|about 1/3 cup dry (60 g)|337|23.6|61.3|0.8|600|0|Years|0|U|-|-|Needs soaking and a long, thorough boil; do not undercook.
sugar-brown|Brown sugar|spread|dry|12|1 tbsp (12 g)|380|0.1|98.1|0|0|0|Years|0|U|-|-|Sweetens oatmeal and coffee.
fresh-cherry|Sweet cherries|produce|fresh|120|about 1 cup (120 g)|63|1.1|16|0.2|0|0|About 3 days|3|U|82|-|Pits are weight you carry out.
fresh-clementine|Clementine or tangerine|produce|fresh|88|1 fruit (88 g peeled)|53|0.8|13.3|0.3|0|0|About 10 days|10|U|87|110|The peel comes along (about 110 g carried).
fresh-cantaloupe|Cantaloupe|produce|fresh|150|1 cup (150 g)|34|0.8|8.2|0.2|0|0|Eat in town|1|U|90|-|About 90% water.
fresh-pineapple|Pineapple|produce|fresh|165|1 cup (165 g)|50|0.5|13.1|0.1|0|0|Eat in town|1|U|86|-|Heavy and sticky.
fresh-cabbage|Cabbage|produce|fresh|90|1 cup shredded (90 g)|25|1.3|5.8|0.1|0|0|1-2 weeks|14|U|92|-|Keeps better than most fresh vegetables; still 92% water.
fresh-onion|Onion|produce|fresh|110|1 medium (110 g)|40|1.1|9.3|0.1|0|0|1-2 weeks|14|U|89|-|Keeps well; adds flavor to dinner.
town-milk|Whole milk|deli|meal-fresh|244|1 cup (244 g)|61|3.2|4.8|3.3|0|0|Town only; spoils in hours without cold|0.5|U|88|-|A town drink; milk powder is the trail version.
town-oj|Orange juice|deli|meal-fresh|248|1 cup (248 g)|45|0.7|10.4|0.2|0|0|Town only|1|U|88|-|A town drink.
town-icecream|Vanilla ice cream|deli|treat|66|1/2 cup (66 g)|207|3.5|23.6|11|0|0|Town only|0|U|61|-|A town treat.
`;
  const KINDS = ['dry', 'wet', 'fresh', 'treat', 'drink-mix', 'meal-dehydrated', 'meal-fresh'];
  const num = v => (v === '-' || v === '' || v == null) ? null : parseFloat(v);
  const SRC = { U: 'USDA FoodData Central generic value', T: 'typical package label, verify yours', R: 'rough typical estimate, varies widely' };
  window.TRAILFOODS = TXT.trim().split('\n').map(l => {
    const f = l.split('|'); if (f.length < 18) return null;
    const g = num(f[4]), k = num(f[6]);
    if (KINDS.indexOf(f[3]) < 0 || !(g > 0) || k == null) return null;
    const carry = num(f[16]) || g, p = n => n == null ? null : Math.round(n * g) / 100;
    return {
      id: f[0], name: f[1], cat: f[2], kind: f[3], g: g, serving: f[5],
      kcal100: k, p100: num(f[7]), c100: num(f[8]), f100: num(f[9]),
      kcal: Math.round(k * g / 100), protein: p(num(f[7])), carb: p(num(f[8])), fat: p(num(f[9])),
      cook: num(f[10]) > 0, cookMl: num(f[10]) || 0, coldSoak: f[11] === '1',
      shelf: f[12], spoilDays: num(f[13]) || 0, src: f[14], sourceNote: SRC[f[14]] || SRC.T,
      waterPct: num(f[15]), carry: carry, note: f.slice(17).join('|')
    };
  }).filter(Boolean);
  window.TRAILFOOD_CATS = [
    { id: 'bread', label: 'Bread, wraps and crackers' }, { id: 'spread', label: 'Spreads and sweeteners' }, { id: 'oil', label: 'Oils and fats' },
    { id: 'dairy', label: 'Cheese, dairy and eggs' }, { id: 'meat', label: 'Meat, jerky and sausage' }, { id: 'canned', label: 'Canned goods and pouches' },
    { id: 'nuts', label: 'Nuts and seeds' }, { id: 'fruit', label: 'Dried fruit' }, { id: 'snack', label: 'Snacks and bars' }, { id: 'sweet', label: 'Candy and treats' },
    { id: 'breakfast', label: 'Cereal and breakfast' }, { id: 'grain', label: 'Rice, pasta and grains' }, { id: 'side', label: 'Soup, beans and dehydrated sides' },
    { id: 'drink', label: 'Drink mixes and coffee' }, { id: 'meal', label: 'Freeze-dried meals' }, { id: 'produce', label: 'Fresh produce' }, { id: 'deli', label: 'Bakery and town food' }
  ];
  /* a lighter "dry swap" for common wet or fresh foods: wet id -> dry id */
  window.TRAILFOOD_SWAPS = {
    'fresh-banana': 'fruit-bananachip', 'fresh-apple': 'fruit-apple', 'fresh-orange': 'fruit-mango-dry', 'fresh-grapes': 'fruit-raisin', 'fresh-peach': 'fruit-apricot',
    'fresh-pear': 'fruit-apple', 'fresh-plum': 'fruit-prune', 'applesauce': 'fruit-apple', 'beans-can-black': 'beans-refried', 'chickpeas-can': 'beans-refried', 'hummus': 'beans-refried',
    'rice-pouch': 'rice-instant', 'tuna-can-water': 'tuna-pouch', 'tuna-can-oil': 'tuna-pouch', 'sardines-can': 'jerky-beef', 'egg-boiled': 'jerky-beef', 'chicken-pouch': 'jerky-beef',
    'bread-wheat': 'tort-flour', 'bread-white': 'tort-flour', 'mozz-string': 'cheddar', 'bacon-cooked': 'salami-dry', 'fresh-avocado': 'oil-olive', 'butter': 'ghee', 'croissant': 'tort-flour'
  };
})();
