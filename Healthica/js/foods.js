/* Healthica foods: values per 100 g, rounded from standard USDA reference data. Approximate.
   cols: name | cat | serving g | serving label | kcal P C F fiber | A(mcg) C(mg) D(mcg) E(mg) K(mcg) B12(mcg) Folate(mcg) Fe(mg) Ca(mg) Mg(mg) K(mg) Zn(mg) */
const FOOD_TXT = `
Chicken breast, cooked|meat|140|1 breast (140 g)|165 31 0 3.6 0|6 0 0.1 0.3 0.3 0.3 4 1 15 29 256 1
Chicken thigh, skinless, cooked|meat|100|1 thigh (100 g)|179 25 0 8.2 0|12 0 0.1 0.3 3 0.4 7 1.3 11 24 240 2.4
Chicken thigh with skin, roasted|meat|100|1 thigh (100 g)|229 24 0 14 0|36 0 0.1 0.3 3 0.4 7 1.2 11 23 230 2.2
Chicken wings, cooked|meat|85|3 wings (85 g)|254 27 0 15 0|45 0 0.1 0.3 3 0.4 6 1.1 15 23 190 2.1
Turkey breast, cooked|meat|120|1 serving (120 g)|135 30 0 0.7 0|0 0 0.2 0.1 0 0.4 8 1.1 14 32 293 1.7
Ground turkey 93% lean, cooked|meat|113|4 oz (113 g)|213 27 0 11 0|0 0 0.4 0.3 0 1.6 9 1.3 25 31 292 3
Ground beef 90% lean, cooked|meat|113|4 oz (113 g)|217 26 0 12 0|0 0 0.1 0.4 2 2.6 8 2.7 18 21 318 5.9
Ground beef 80% lean, cooked|meat|113|4 oz (113 g)|254 26 0 16 0|0 0 0.1 0.4 2 2.5 7 2.6 18 20 300 5.8
Beef sirloin steak, cooked|meat|170|6 oz (170 g)|206 29 0 9 0|0 0 0.1 0.2 1 1.5 9 2.4 18 27 340 5.5
Beef ribeye steak, cooked|meat|170|6 oz (170 g)|291 25 0 21 0|0 0 0.1 0.4 1 2.4 8 2.1 10 22 285 5.5
Beef tenderloin (filet), cooked|meat|140|5 oz (140 g)|232 27 0 13 0|0 0 0.1 0.3 1 2.3 8 2.7 10 23 330 5
Pot roast / chuck, cooked|meat|140|5 oz (140 g)|250 30 0 14 0|0 0 0.1 0.3 1 2.8 8 3.3 14 22 290 7
Bison, cooked|meat|140|5 oz (140 g)|146 28 0 2.4 0|0 0 0.1 0.2 1 2.9 7 3.4 10 29 360 4.1
Pork loin chop, cooked|meat|140|1 chop (140 g)|196 29 0 8 0|2 0 0.7 0.2 0 0.7 3 0.9 21 28 360 2.3
Pork tenderloin, cooked|meat|120|4 oz (120 g)|143 26 0 3.5 0|2 0 0.5 0.2 0 0.7 3 1.3 6 28 420 2.5
Bacon, cooked|meat|16|2 slices (16 g)|541 37 1.4 42 0|11 0 0.8 0.2 0 1.1 2 1.4 11 38 565 3.2
Ham, deli sliced|meat|56|2 oz (56 g)|107 17 2 3 0|0 0 0.4 0.1 0 0.6 3 0.8 8 21 260 1.9
Pork sausage, cooked|meat|70|2 links (70 g)|300 19 2 23 0|0 0 0.5 0.2 0 1.2 3 1.2 24 18 280 2.5
Lamb, cooked|meat|120|4 oz (120 g)|250 25 0 17 0|0 0 0.1 0.2 3 2.6 20 1.9 17 25 280 4.5
Beef liver, cooked|meat|85|3 oz (85 g)|175 27 3.8 5.3 0|6580 2 1.2 0.6 3 70 253 6.5 6 18 350 4
Beef jerky|meat|28|1 oz (28 g)|410 33 11 26 1|0 0 0.1 0.5 0 1.1 10 4 20 55 600 8
Salmon, Atlantic farmed, cooked|fish|140|5 oz fillet (140 g)|206 22 0 12 0|50 0 11 1.1 0 3.2 29 0.4 15 30 384 0.6
Salmon, wild, cooked|fish|140|5 oz fillet (140 g)|182 25 0 8 0|15 0 11 1.2 0 3.2 25 0.9 15 37 440 0.8
Tuna, canned in water|fish|100|1 can drained (100 g)|116 26 0 0.8 0|0 0 1.7 0.4 0 2.5 4 1.4 10 27 237 0.8
Tuna steak, cooked|fish|140|5 oz (140 g)|184 30 0 6 0|0 0 1.7 1 0 2.2 2 1.4 16 40 520 0.9
Cod, cooked|fish|140|5 oz fillet (140 g)|105 23 0 0.9 0|12 1 1 0.6 0 1 8 0.5 14 42 244 0.6
Tilapia, cooked|fish|120|1 fillet (120 g)|128 26 0 2.7 0|0 0 3.1 0.8 0 1.9 7 0.7 14 34 380 0.4
Halibut, cooked|fish|140|5 oz (140 g)|140 27 0 2.9 0|45 0 4 0.9 0 1.2 14 0.2 60 28 520 0.6
Shrimp, cooked|fish|100|about 10 large (100 g)|99 24 0.2 0.3 0|54 0 0.1 1.3 0 1.1 3 0.5 70 37 220 1.6
Sardines, canned in oil|fish|92|1 can (92 g)|208 25 0 11 0|32 0 4.8 2 3 8.9 12 2.9 382 39 397 1.3
Mackerel, cooked|fish|140|5 oz (140 g)|262 24 0 18 0|50 0 16 1.5 0 19 1 1.6 15 97 520 1
Scallops, cooked|fish|100|5 large (100 g)|111 21 5 1 0|0 0 0 0 0 1.5 18 0.3 10 40 250 1.3
Egg, whole, boiled|dairy|50|1 large egg (50 g)|155 13 1.1 11 0|160 0 2.2 1 0.3 1.1 44 1.2 50 10 126 1.1
Egg whites, cooked|dairy|99|3 egg whites (99 g)|52 11 0.7 0.2 0|0 0 0 0 0 0.1 4 0.1 7 11 163 0
Greek yogurt, plain nonfat|dairy|170|3/4 cup (170 g)|59 10 3.6 0.4 0|1 0 0 0 0 0.8 7 0 110 11 141 0.5
Greek yogurt, plain 2%|dairy|170|3/4 cup (170 g)|73 10 4 2 0|15 0 0 0 0 0.8 7 0 115 11 141 0.5
Cottage cheese, low fat|dairy|113|1/2 cup (113 g)|81 10 3.4 2.3 0|27 0 0 0 0 0.4 12 0.1 111 8 134 0.4
Milk, 2%|dairy|244|1 cup (244 g)|50 3.3 4.8 2 0|47 0 1.1 0.1 0 0.5 5 0 120 11 150 0.4
Milk, skim|dairy|245|1 cup (245 g)|34 3.4 5 0.1 0|46 0 1.1 0 0 0.5 5 0 122 11 156 0.4
Cheddar cheese|dairy|28|1 oz (28 g)|403 25 1.3 33 0|330 0 0.6 0.3 3 0.8 27 0.7 710 28 98 3.1
Mozzarella, part-skim|dairy|28|1 oz (28 g)|254 24 2.8 16 0|110 0 0.4 0.2 2 2.3 7 0.4 730 20 76 3
Parmesan, grated|dairy|10|2 tbsp (10 g)|431 38 4.1 29 0|220 0 0.5 0.2 2 1.2 7 0.8 1180 44 92 2.8
Feta cheese|dairy|28|1 oz (28 g)|264 14 4 21 0|125 0 0.4 0.2 2 1.7 32 0.7 493 19 62 2.9
Butter|dairy|14|1 tbsp (14 g)|717 0.9 0.1 81 0|684 0 1.5 2.3 7 0.2 3 0 24 2 24 0.1
Broccoli, cooked|veg|156|1 cup (156 g)|35 2.4 7.2 0.4 3.3|77 65 0 1.5 141 0 108 0.7 40 21 293 0.7
Spinach, raw|veg|30|1 cup (30 g)|23 2.9 3.6 0.4 2.2|469 28 0 2 483 0 194 2.7 99 79 558 0.5
Spinach, cooked|veg|180|1 cup (180 g)|23 3 3.8 0.3 2.4|524 10 0 2 494 0 146 3.6 136 87 466 0.8
Kale, raw|veg|67|1 cup chopped (67 g)|35 2.9 4.4 1.5 4.1|241 93 0 0.7 390 0 62 1.5 150 47 348 0.4
Asparagus, cooked|veg|134|1 cup (134 g)|22 2.4 4.1 0.2 2|38 8 0 1.5 50 0 149 0.9 23 14 202 0.5
Green beans, cooked|veg|125|1 cup (125 g)|35 1.9 7.8 0.3 3.2|35 12 0 0.4 48 0 33 1 37 25 146 0.3
Bell pepper, red, raw|veg|120|1 medium (120 g)|31 1 6 0.3 2.1|157 128 0 1.6 5 0 46 0.4 7 12 211 0.3
Zucchini, cooked|veg|180|1 cup (180 g)|17 1.2 3.1 0.3 1|10 17 0 0.1 4 0 24 0.4 15 18 261 0.3
Cauliflower, cooked|veg|124|1 cup (124 g)|23 1.8 4.1 0.5 2.3|0 44 0 0.1 14 0 44 0.3 16 9 142 0.2
Cabbage, raw|veg|89|1 cup (89 g)|25 1.3 5.8 0.1 2.5|5 37 0 0.2 76 0 43 0.5 40 12 170 0.2
Brussels sprouts, cooked|veg|156|1 cup (156 g)|36 2.5 7.1 0.5 2.6|38 62 0 0.9 140 0 61 1.2 36 20 317 0.3
Carrots, raw|veg|72|1 medium (72 g)|41 0.9 9.6 0.2 2.8|835 6 0 0.7 13 0 19 0.3 33 12 320 0.2
Sweet potato, baked|carb|130|1 medium (130 g)|90 2 20.7 0.2 3.3|961 20 0 0.3 2 0 6 0.7 38 27 475 0.3
Tomato, raw|veg|123|1 medium (123 g)|18 0.9 3.9 0.2 1.2|42 14 0 0.5 8 0 15 0.3 10 11 237 0.2
Cucumber, raw|veg|120|1/2 large (120 g)|15 0.7 3.6 0.1 0.5|5 3 0 0.1 16 0 7 0.3 16 13 147 0.2
Romaine lettuce|veg|47|1 cup (47 g)|17 1.2 3.3 0.3 2.1|436 4 0 0.1 103 0 136 1 33 14 247 0.2
Mixed salad greens|veg|85|2 cups (85 g)|20 1.8 3.5 0.2 2|300 18 0 0.5 170 0 100 1.5 50 25 300 0.4
Mushrooms, white, raw|veg|70|1 cup sliced (70 g)|22 3.1 3.3 0.3 1|0 2 0.2 0 0 0.04 17 0.5 3 9 318 0.5
Onion, raw|veg|110|1 medium (110 g)|40 1.1 9.3 0.1 1.7|0 7 0 0 0.4 0 19 0.2 23 10 146 0.2
Garlic, raw|veg|3|1 clove (3 g)|149 6.4 33 0.5 2.1|0 31 0 0.1 1.7 0 3 1.7 181 25 401 1.2
Avocado|fruit|150|1 medium (150 g)|160 2 8.5 14.7 6.7|7 10 0 2.1 21 0 81 0.6 12 29 485 0.6
Corn, cooked|carb|90|1/2 cup (90 g)|96 3.4 21 1.5 2.4|9 7 0 0.1 0.4 0 42 0.5 2 26 218 0.5
Green peas, cooked|veg|160|1 cup (160 g)|84 5.4 15.6 0.2 5.5|38 14 0 0.1 25 0 63 1.5 27 39 271 1.2
Edamame, cooked|legume|155|1 cup (155 g)|121 12 8.9 5.2 5.2|9 6 0 0.7 27 0 311 2.3 63 64 436 1.4
Beets, cooked|veg|170|1 cup (170 g)|44 1.7 10 0.2 2|2 4 0 0 0.2 0 80 0.8 16 23 305 0.4
Potato, baked with skin|carb|173|1 medium (173 g)|93 2.5 21 0.1 2.2|1 10 0 0 2 0 28 1.1 15 28 535 0.4
Tomato sauce / marinara|veg|125|1/2 cup (125 g)|50 1.5 8 1.5 2|20 8 0 1.5 4 0 15 0.9 20 18 380 0.3
Rice, white, cooked|carb|158|1 cup (158 g)|130 2.7 28 0.3 0.4|0 0 0 0 0 0 58 1.2 10 12 35 0.5
Rice, brown, cooked|carb|195|1 cup (195 g)|123 2.7 25.6 1 1.6|0 0 0 0.1 0.6 0 4 0.6 10 39 86 0.6
Oats, dry rolled|carb|40|1/2 cup dry (40 g)|389 16.9 66 6.9 10.6|0 0 0 0.4 2 0 56 4.7 54 177 429 4
Oatmeal, cooked in water|carb|234|1 cup (234 g)|71 2.5 12 1.5 1.7|0 0 0 0.1 0.6 0 6 1.1 9 27 80 1
Pasta, cooked|carb|140|1 cup (140 g)|158 5.8 31 0.9 1.8|0 0 0 0.1 0.2 0 7 1.3 7 18 44 0.5
Pasta, whole wheat, cooked|carb|140|1 cup (140 g)|124 5.3 26.5 0.5 3.9|0 0 0 0.1 0.2 0 4 1.1 15 42 44 1.1
Bread, white|carb|30|1 slice (30 g)|266 9 49 3.3 2.7|0 0 0 0.2 3 0 111 3.6 144 26 115 0.8
Bread, whole wheat|carb|35|1 slice (35 g)|252 12.5 43 3.5 6|0 0 0 0.6 8 0 44 2.5 161 80 250 1.8
Bread, sourdough|carb|50|1 slice (50 g)|289 12 56 2.4 2.4|0 0 0 0.3 3 0 70 3.3 20 20 115 0.8
Tortilla, flour|carb|45|1 medium (45 g)|304 8 50 8 3|0 0 0 0.4 3 0 40 3.2 120 21 120 0.6
Quinoa, cooked|carb|185|1 cup (185 g)|120 4.4 21.3 1.9 2.8|0 0 0 0.6 0 0 42 1.5 17 64 172 1.1
Couscous, cooked|carb|157|1 cup (157 g)|112 3.8 23 0.2 1.4|0 0 0 0.1 0.1 0 15 0.4 8 8 58 0.3
Banana|fruit|118|1 medium (118 g)|89 1.1 22.8 0.3 2.6|3 9 0 0.1 0.5 0 20 0.3 5 27 358 0.2
Apple|fruit|182|1 medium (182 g)|52 0.3 13.8 0.2 2.4|3 5 0 0.2 2 0 3 0.1 6 5 107 0
Blueberries|fruit|148|1 cup (148 g)|57 0.7 14.5 0.3 2.4|3 10 0 0.6 19 0 6 0.3 6 6 77 0.2
Strawberries|fruit|152|1 cup (152 g)|32 0.7 7.7 0.3 2|1 59 0 0.3 2 0 24 0.4 16 13 153 0.1
Orange|fruit|131|1 medium (131 g)|47 0.9 11.8 0.1 2.4|11 53 0 0.2 0 0 30 0.1 40 10 181 0.1
Grapes|fruit|150|1 cup (150 g)|69 0.7 18 0.2 0.9|3 3 0 0.2 15 0 2 0.4 10 7 191 0.1
Watermelon|fruit|152|1 cup (152 g)|30 0.6 7.6 0.2 0.4|28 8 0 0.1 0.1 0 3 0.2 7 10 112 0.1
Mango|fruit|165|1 cup (165 g)|60 0.8 15 0.4 1.6|54 36 0 0.9 4 0 43 0.2 11 10 168 0.1
Pineapple|fruit|165|1 cup (165 g)|50 0.5 13 0.1 1.4|3 48 0 0 0.7 0 18 0.3 13 12 109 0.1
Dates, Medjool|fruit|24|1 date (24 g)|277 1.8 75 0.2 6.7|7 0 0 0 2.7 0 15 0.9 64 54 696 0.4
Honey|carb|21|1 tbsp (21 g)|304 0.3 82 0 0.2|0 1 0 0 0 0 2 0.4 6 2 52 0.2
Black beans, cooked|legume|172|1 cup (172 g)|132 8.9 23.7 0.5 8.7|0 0 0 0 3 0 149 2.1 27 70 355 1.1
Lentils, cooked|legume|198|1 cup (198 g)|116 9 20 0.4 7.9|0 2 0 0.1 2 0 181 3.3 19 36 369 1.3
Chickpeas, cooked|legume|164|1 cup (164 g)|164 8.9 27.4 2.6 7.6|1 1 0 0.4 4 0 172 2.9 49 48 291 1.5
Tofu, firm|legume|126|1/2 cup (126 g)|144 17 2.8 8.7 2.3|3 0 0 0 3 0 29 2.7 683 58 237 1.6
Hummus|legume|60|1/4 cup (60 g)|166 8 14 9.6 6|0 0 0 0.4 8 0 83 2.4 38 71 228 1.8
Almonds|nut|28|1 oz (28 g)|579 21 21.6 50 12.5|0 0 0 25.6 0 0 44 3.7 269 270 733 3.1
Walnuts|nut|28|1 oz (28 g)|654 15 13.7 65 6.7|1 1 0 0.7 3 0 98 2.9 98 158 441 3.1
Cashews|nut|28|1 oz (28 g)|553 18 30 44 3.3|0 0 0 0.9 34 0 25 6.7 37 292 660 5.8
Peanut butter|nut|32|2 tbsp (32 g)|588 25 20 50 6|0 0 0 9 0 0 87 1.9 49 154 649 2.9
Chia seeds|nut|12|1 tbsp (12 g)|486 17 42 31 34|0 2 0 0.5 0 0 49 7.7 631 335 407 4.6
Flaxseed, ground|nut|10|1 tbsp (10 g)|534 18 29 42 27|0 1 0 0.3 4 0 87 5.7 255 392 813 4.3
Pumpkin seeds|nut|28|1 oz (28 g)|559 30 11 49 6|0 2 0 2.2 7 0 58 8.8 46 592 809 7.8
Olive oil|nut|14|1 tbsp (14 g)|884 0 0 100 0|0 0 0 14 60 0 0 0.6 1 0 1 0
Coconut oil|nut|14|1 tbsp (14 g)|892 0 0 99 0|0 0 0 0.1 0.5 0 0 0 0 0 0 0
Whey protein powder|shake|31|1 scoop (31 g)|387 77 10 5 0|0 0 0 0 0 0 0 0.5 300 70 400 1
Plant protein powder (pea blend)|shake|35|1 scoop (35 g)|380 74 8 6 3|0 0 0 0 0 0 0 10 60 40 300 3
Casein protein powder|shake|33|1 scoop (33 g)|370 75 9 3 0|0 0 0 0 0 0 0 0.5 500 40 300 1
Protein shake, ready-to-drink|shake|340|1 bottle (340 g)|47 8.8 1.5 0.9 0.3|0 0 0 0 0 0.8 0 0.4 95 20 150 0.4
Collagen peptides|shake|10|1 scoop (10 g)|360 90 0 0 0|0 0 0 0 0 0 0 0 0 0 0 0
Protein bar (generic)|shake|60|1 bar (60 g)|350 33 36 10 5|0 0 0 0 0 0 0 3 150 60 250 3
Almond milk, unsweetened|drink|240|1 cup (240 g)|15 0.6 0.3 1.2 0.2|0 0 2 3 0 0 0 0.3 184 17 170 0.1
Oat milk|drink|240|1 cup (240 g)|45 1 6.7 1.5 0.8|0 0 1 0 0 0.5 0 0.3 120 10 150 0.1
Tempeh|legume|84|3 oz (84 g)|192 20 7.6 11 0|0 0 0 0 0 0.1 24 2.7 111 81 412 1.1
Seitan (prepared)|legume|100|3.5 oz (100 g)|130 21 5 2 0.5|0 0 0 0 0 0 20 2.5 20 20 60 1
Kidney beans, cooked|legume|177|1 cup (177 g)|127 8.7 22.8 0.5 6.4|0 1.2 0 0 8.4 0 130 2.9 28 45 403 1.4
White beans, cooked|legume|179|1 cup (179 g)|139 9.7 25 0.4 6.3|0 0 0 0 3.5 0 140 3.7 90 63 561 1.2
Soy milk, fortified, unsweetened|drink|243|1 cup (243 g)|33 2.9 1.7 1.8 0.4|60 0 1.2 0.2 3 0.6 20 0.6 120 15 118 0.3
Nutritional yeast, fortified|other|16|2 tbsp (16 g)|375 50 33 5 20|0 0 0 0 0 30 800 8 25 150 1000 8
Tahini|nut|15|1 tbsp (15 g)|595 17 21 54 9|0 0 0 0.8 1.8 0 98 9 426 95 414 4.6
Peanuts, dry roasted|nut|28|1 oz (28 g)|587 24 21 50 8|0 0 0 6.9 0 0 145 1.3 54 176 634 3.3
Hemp seeds|nut|30|3 tbsp (30 g)|553 32 8.7 49 4|1 0.5 0 0.8 0 0 110 8 70 700 1200 10
Orange juice|drink|248|1 cup (248 g)|45 0.7 10.4 0.2 0.2|10 50 0 0 0.1 0 30 0.2 11 11 200 0.1
Coffee, black|drink|240|1 cup (240 g)|1 0.1 0 0 0|0 0 0 0 0.1 0 0 0 2 3 49 0
Green tea|drink|240|1 cup (240 g)|1 0 0.2 0 0|0 0 0 0 0 0 0 0 0 1 8 0
Coconut water|drink|240|1 cup (240 g)|19 0.7 3.7 0.2 1.1|0 2 0 0 0 0 3 0.3 24 25 250 0.1
Cola|drink|355|1 can (355 g)|41 0 10.6 0 0|0 0 0 0 0 0 0 0 2 0 2 0
Red wine|drink|150|1 glass (150 ml)|85 0.1 2.6 0 0|0 0 0 0 0 0 0 0.5 8 12 127 0.1
Beer|drink|355|1 can (355 ml)|43 0.5 3.6 0 0|0 0 0 0 0 0 6 0 4 6 27 0
Dark chocolate 70%|other|28|1 oz (28 g)|598 7.8 46 43 11|0 0 0 0.6 7 0 13 12 73 228 715 3.3
Pizza, cheese slice|other|107|1 slice (107 g)|266 11 33 10 2.3|65 0.4 0.3 0.4 4 0.7 70 2.5 180 24 172 1.5
Hamburger on bun|other|150|1 burger (150 g)|250 13 25 11 1.4|0 0 0 0.3 3 1.5 40 2.4 90 20 200 3
French fries|other|117|1 medium (117 g)|312 3.4 41 15 3.8|0 5 0 1.5 15 0 30 0.9 15 29 580 0.4
Ice cream, vanilla|other|66|1/2 cup (66 g)|207 3.5 24 11 0.7|118 0.6 0.2 0.3 0.2 0.5 4 0.1 128 14 199 0.7
`;
const FOOD_CATS = {meat:'Meats', fish:'Seafood', dairy:'Eggs & dairy', veg:'Veggies', fruit:'Fruit', carb:'Carbs', legume:'Beans & tofu', nut:'Nuts & fats', shake:'Shakes & bars', drink:'Drinks', other:'Other'};
const NUT_KEYS = ['vitA','vitC','vitD','vitE','vitK','b12','folate','iron','calcium','magnesium','potassium','zinc'];
const FOODS = FOOD_TXT.trim().split('\n').map((ln,i)=>{
  const p=ln.split('|'); const m=p[4].trim().split(/\s+/).map(Number); const mic=p[5].trim().split(/\s+/).map(Number);
  const n={}; NUT_KEYS.forEach((k,j)=>n[k]=mic[j]||0);
  return {id:'f'+i, name:p[0], cat:p[1], servG:+p[2], servLabel:p[3], kcal:m[0], p:m[1], c:m[2], f:m[3], fib:m[4], n, per:100};
});
