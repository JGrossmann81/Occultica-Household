/* Saturnica data: budget lines, hustle library, quests, medals, counsel answers, dream templates. */
const BCATS = { giving: ['🎁', 'Giving', 10], housing: ['🏠', 'Housing', 35], util: ['💡', 'Utilities and phone', 10], food: ['🛒', 'Food', 15], trans: ['🚗', 'Transportation', 15], health: ['🩺', 'Health and insurance', 12], kids: ['🧒', 'Kids and pets', 10], pers: ['🧴', 'Personal', 6], fun: ['🎟️', 'Fun and hobbies', 8], other: ['📦', 'Everything else', 6] };
const BLINES = [
  ['rent', 'Rent or mortgage (principal, interest)', 'housing'], ['proptax', 'Property tax and HOA', 'housing'], ['homeins', 'Home or renter insurance', 'housing'], ['repairs', 'Home repairs and upkeep', 'housing'],
  ['electric', 'Electric', 'util'], ['gas', 'Gas or heating', 'util'], ['water', 'Water, sewer, trash', 'util'], ['internet', 'Internet', 'util'], ['phone', 'Phone', 'util'],
  ['groc', 'Groceries', 'food'], ['dining', 'Eating out and coffee', 'food'],
  ['fuel', 'Gas for the car', 'trans'], ['carins', 'Car insurance', 'trans'], ['carfix', 'Car repairs and registration', 'trans'], ['transit', 'Transit, tolls, parking', 'trans'],
  ['healthins', 'Health insurance', 'health'], ['meds', 'Medical, dental, prescriptions', 'health'], ['lifeins', 'Life or other insurance', 'health'],
  ['childcare', 'Childcare and school', 'kids'], ['kidstuff', 'Kids activities and clothes', 'kids'], ['pets', 'Pets', 'kids'],
  ['clothes', 'Clothing', 'pers'], ['hair', 'Haircuts and personal care', 'pers'], ['gym', 'Gym or fitness', 'pers'],
  ['hobby', 'Hobbies and entertainment', 'fun'], ['dates', 'Dates, outings, vacations', 'fun'],
  ['tithe', 'Giving, tithe, charity', 'giving'],
  ['gifts', 'Gifts and holidays', 'other'], ['misc', 'Miscellaneous', 'other']
];
const FREQ = { m: ['Monthly', 1], w: ['Weekly', 52 / 12], b: ['Every 2 weeks', 26 / 12], s: ['Twice a month', 2], y: ['Yearly', 1 / 12], q: ['Quarterly', 1 / 3] };
const DEBT_TYPES = { card: ['💳', 'Credit card'], car: ['🚗', 'Car loan'], student: ['🎓', 'Student loan'], personal: ['🤝', 'Personal loan'], medical: ['🩺', 'Medical bill'], mortgage: ['🏠', 'Mortgage'], heloc: ['🏡', 'Home equity loan'], payday: ['⚠️', 'Payday or title loan'], store: ['🛍️', 'Store card or buy-now-pay-later'], family: ['👪', 'Family or friend'], other: ['📄', 'Other'] };
const RINGS = [
  ['Starter Shield', '🛡️', 'Save a $1,000 starter emergency fund'],
  ['Debt Slayer', '⚔️', 'Pay off all debt except the home'],
  ['Full Fortress', '🏰', 'Build 3 to 6 months of essential expenses'],
  ['Retirement Ring', '🪐', 'Invest 15% of income for retirement'],
  ['Legacy Ring', '🎓', 'Fund kids\' education (skip if it does not apply)'],
  ['Home Free', '🔑', 'Pay off the home early'],
  ['Saturn Crown', '👑', 'Build wealth and give generously']
];
const LEVELS = [[0, 'Initiate'], [60, 'Penny Warden'], [160, 'Ledger Keeper'], [340, 'Coin Alchemist'], [650, 'Debt Slayer'], [1100, 'Vault Keeper'], [1800, 'Ringbearer'], [2900, 'Titan of Thrift'], [4600, 'Lord of Saturn'], [7500, 'Master of Time']];
const HRANKS = [[0, 'Pocket Change'], [50, 'Penny Hustler'], [250, 'Coin Collector'], [750, 'Side Gig Sage'], [2000, 'Money Maker'], [5000, 'Hustle Baron'], [12000, 'Saturn Magnate']];
const WINS = ['KA-CHING!', 'MONEY MOVE!', 'FOUND MONEY!', 'HUSTLE WIN!', 'CHA-CHING!', 'BANKED IT!', 'SATURN SMILES!'];
const WINLINES = ['Every dollar you add is a dollar of freedom.', 'Future you just said thank you.', 'The hustle pays the ones who show up.', 'Small wins stack into big rings.', 'That is one more day off the debt.', 'Money you made yourself hits different.'];

/* hustles: id|emoji|name|skills|needs|hrs/wk|startup $|low $/mo|high $/mo|how to start|tip */
const HUSTLE_TXT = `
declutter|📦|Sell what you do not use|sell|none|3|0|100|1500|List unused electronics, tools, clothes, furniture and toys on Facebook Marketplace, eBay or OfferUp. Clear one closet a week.|Photograph in daylight, price at what sold items went for (eBay sold filter), and bundle small items.
flip|🔄|Flip thrift and yard-sale finds|sell,repair|none|6|50|200|1200|Buy underpriced tools, furniture, brand-name clothes and games at thrift shops and garage sales, then resell online.|Only buy what you have already seen sell for 3x your price.
tutor|📚|Tutoring|teach,write|none|5|0|300|1500|Teach a subject you know, online or in person. Start with neighbors, local schools and tutoring platforms.|Test prep, reading and math pay best.
freelancewrite|✍️|Freelance writing and editing|write|computer|6|0|150|1800|Offer blog posts, resumes, proofreading or product copy on freelance platforms and local business groups.|Build 3 samples first, then pitch small businesses directly.
virtualassist|🖥️|Virtual assistant|admin,tech|computer|8|0|300|2000|Handle email, scheduling and data entry for busy owners. Find clients through local networking and freelance sites.|Specialize (real estate, coaches, contractors) to charge more.
bookkeeping|🧮|Bookkeeping for small business|admin,data|computer,bookkeep|8|0|400|2500|Keep books for local shops and contractors with accounting software. A short bookkeeping course helps.|Monthly retainers beat hourly work.
design|🎨|Graphic design and logos|art,tech|computer|8|0|200|2500|Design logos, flyers, menus and social posts for local businesses.|Show a small portfolio of 5 pieces to start.
photography|📷|Photography|photo,art|camera|6|0|150|2000|Shoot family portraits, real estate, pets, products or events. Offer a mini-session day to build clients.|Sell prints and photo books on top of the session fee.
videoedit|🎬|Video editing|tech,art|computer|8|0|200|2500|Edit videos for creators and small businesses. Learn free editing software and post sample reels.|Short-form video editing is in high demand.
website|🌐|Simple websites|tech,art|computer|8|0|300|3000|Build one-page sites for trades, restaurants and clubs, with a small monthly maintenance fee.|Recurring maintenance fees add up.
handyman|🔧|Handyman and small repairs|repair,trades|tools|8|50|400|3000|Mount TVs, assemble furniture, fix doors and faucets. Start with neighbors and a local app listing.|Carry liability insurance once you grow, and check what needs a license in your state.
electrician|⚡|Licensed trade side work|trades|trades|8|0|600|4000|If you hold a trade license, take small residential jobs on weekends within the rules of your license.|Never work outside your license. Insurance matters.
lawncare|🌿|Lawn and yard care|garden,outdoors|yard,tools|8|100|300|3000|Mow, edge, clean up and haul leaves for neighbors. Aim for a tight route so travel time is low.|Weekly recurring clients beat one-time jobs.
garden|🥕|Grow and sell produce, herbs, plants|garden,outdoors|yard|6|50|100|2500|Sell salad greens, herb bundles, seedlings, cut flowers or mushrooms at farmers markets, a roadside stand or to local restaurants. Your Hortica maps tell you what to plant when.|Spring seedlings and gourmet mushrooms to restaurants are the highest-margin starts. Check cottage food and farm stand rules locally.
mushrooms|🍄|Gourmet mushrooms to chefs|garden,cook|room|6|150|200|2500|Grow oyster, lion's mane and shiitake and sell by the pound to restaurants and markets. Use the Fungi tab in Hortica.|Chefs pay well for fresh, local, same-day mushrooms.
herbsales|🌱|Herb bundles and tea blends|garden,craft|yard|4|30|100|1000|Dry herbs and make tea blends or culinary mixes for farmers markets and online shops.|Label and sell as food only; follow local food rules and avoid health claims.
pets|🐕|Dog walking and pet sitting|animals|none|6|0|200|1800|Walk dogs, drop-in visits, boarding in your home. Build reviews on a sitting platform.|Holiday weeks book up first.
petgroom|✂️|Mobile or home pet grooming|animals,art|none|10|300|400|3500|Get trained or certified, then groom at home or in a small mobile setup.|Repeat clients every 6 weeks.
cleaning|🧽|House cleaning|cleaning|none|8|50|300|2800|Recurring home cleans, move-out cleans and Airbnb turnovers. Start with supplies you own.|Move-out and short-term-rental cleans pay premium rates.
pressure|💦|Pressure washing|outdoors,repair|tools|6|400|300|3000|Wash driveways, siding and decks. A good machine pays for itself in a few jobs.|Neighborhood flyers and before-after photos sell it.
movingh|🚚|Moving and hauling|physical|truck|8|0|300|3500|Haul junk, deliver furniture and help with moves. List on local hauling apps.|A pickup truck is a money machine.
delivery|🛵|Food and package delivery|drive|car|10|0|400|1800|Deliver with a gig app during peak hours and combine with errands.|Track mileage. Gas and wear can eat half the income.
rideshare|🚘|Rideshare driving|drive|car|10|0|400|2000|Drive during airport and event surges. Keep records of mileage and costs.|After wear and gas, many drivers earn far less than the headline rate.
carwash|🚿|Mobile car detailing|repair,cleaning|none|8|200|300|3000|Wash and detail cars at the customer's home with a small kit.|Sell a monthly maintenance plan.
rentcar|🔑|Rent out a spare vehicle or gear|sell|car|2|0|200|1500|List a car, trailer, camper, tools or camera gear on a peer rental platform.|Check your insurance first.
rentroom|🛏️|Rent a spare room or space|sell|room|1|100|400|1500|Rent a spare room, parking space or storage on a short or long-term basis.|Check local rules and your lease or mortgage.
cna|🩺|Home care and caregiving shifts|people,kids|cna|10|0|600|3000|Pick up per-diem shifts with an agency, or private caregiving for seniors.|Weekends and nights pay a premium.
nanny|👶|Babysitting and nanny|kids|none|8|0|300|1800|Babysit evenings and weekends through neighbors and community boards. CPR certification helps.|Offer date-night nights and holiday coverage.
cook|🍲|Meal prep and catering|cook|none|8|100|300|2500|Cook weekly meal-prep for busy families, or small catering orders. Check cottage food laws.|Healthy, simple menus with a small weekly sign-up win.
baking|🧁|Baking and treats|cook,craft|none|6|50|150|1800|Sell cakes, cookies and bread by order. Check your state cottage food law first.|Pre-orders for holidays are the best money.
etsy|🧶|Crafts and handmade goods|craft,art|none|8|50|100|2000|Sell your woodwork, knitting, candles, jewelry or prints on Etsy or at markets.|Test with a small batch, then invest in what sells.
woodwork|🪵|Woodworking and furniture refinishing|craft,repair|tools|8|100|250|2500|Build or refinish furniture, cutting boards and signs from reclaimed wood.|Refinishing thrift furniture is a classic margin play.
sewing|🧵|Sewing, alterations and repairs|craft|none|6|0|200|1500|Hem, mend and tailor clothes for locals. Partner with a dry cleaner or bridal shop.|Wedding and prom seasons pay well.
music|🎸|Music lessons or gigs|music,teach|none|5|0|200|2000|Teach beginners or play events. Post a lesson flyer at schools and music shops.|Recurring weekly students are steady income.
fitness|🏋️|Personal training or group classes|fit,people|trainer|6|100|300|2500|Teach classes or train clients at a gym, park or online. A certification builds trust.|Small-group sessions raise your hourly rate.
yoga|🧘|Yoga or wellness classes|fit,people|trainer|4|50|200|1500|Teach in studios, community centers and workplaces.|Corporate lunch classes pay well.
language|🗣️|Language tutoring and translation|lang,teach|none|5|0|250|2000|Teach conversation online or translate documents.|Native speakers of in-demand languages stand out.
tefl|🌍|Teach English online|lang,teach|teach|10|0|500|2200|Teach English to learners abroad through an online school.|Early morning hours match Asian time zones.
notary|🖋️|Mobile notary|admin|notary|4|150|200|2000|Become a commissioned notary and sign loan documents and affidavits at the customer's home.|Loan signing agents earn the most.
realestate|🏘️|Real-estate photography or showing help|photo,people|camera|6|0|200|2000|Shoot listing photos or help agents with showings and open houses.|Build relationships with 2 or 3 agents.
drone|🚁|Drone photography|photo,tech|drone|4|0|300|2500|Get the drone pilot certificate and photograph roofs, land and events.|Roof inspections for insurers pay well.
data|📊|Online surveys, testing and data tasks|data,tech|computer|4|0|30|300|Product testing, user tests and survey panels. Pays little but can fund a goal.|Skip anything that asks you to pay to start.
farmhelp|🚜|Seasonal farm and orchard work|physical,outdoors|none|10|0|400|2500|Pick up harvest, planting and packing work at local farms.|Ask at farm stands and orchards in season.
auctions|🔨|Estate sale and auction buying|sell,repair|truck|8|200|300|2500|Buy lots at estate auctions and resell the best items online.|Learn the 2 or 3 categories you know best.
sellcourse|🎓|Sell a course or guide|teach,write|computer|6|0|50|2000|Package what you know (gardening, a trade, a language) into a short guide or class.|Start with a live paid workshop to test demand.
callus|🎤|Event help and bartending|people,social|servsafe|8|0|300|2000|Serve and bartend private events with a food-safety or alcohol-service certificate.|Weddings and corporate events book months ahead.
`;
const HUSTLES = HUSTLE_TXT.trim().split('\n').map(l => { const f = l.split('|'); return { id: f[0], e: f[1], n: f[2], skills: f[3].split(','), needs: f[4].split(','), hrs: +f[5], cost: +f[6], lo: +f[7], hi: +f[8], how: f[9], tip: f[10] }; });
const SKILLS = [['sell', '🛍️ Selling and negotiating'], ['write', '✍️ Writing'], ['tech', '💻 Computers and tech'], ['art', '🎨 Art and design'], ['photo', '📷 Photography'], ['trades', '🔧 Skilled trades'], ['repair', '🛠️ Fixing things'], ['drive', '🚗 Driving'], ['teach', '📚 Teaching'], ['animals', '🐕 Animals'], ['craft', '🧶 Crafts and making'], ['cook', '🍲 Cooking and baking'], ['fit', '🏋️ Fitness'], ['lang', '🗣️ Another language'], ['music', '🎸 Music'], ['admin', '📋 Organizing and admin'], ['data', '📊 Numbers and data'], ['garden', '🌱 Growing things'], ['cleaning', '🧽 Cleaning'], ['people', '🤝 Caring for people'], ['kids', '👶 Kids'], ['outdoors', '🌳 Outdoors'], ['physical', '💪 Physical work'], ['social', '🎉 Events and people']];
const ASSETS = [['computer', '💻 Computer'], ['car', '🚗 Car'], ['truck', '🛻 Truck or trailer'], ['tools', '🧰 Tools'], ['camera', '📷 Good camera'], ['drone', '🚁 Drone license'], ['yard', '🌾 Yard, garden or land'], ['room', '🛏️ Spare room or space']];
const CERTS = [['cna', '🩺 Nursing, CNA or EMT'], ['trades', '⚡ Trade license'], ['bookkeep', '🧮 Bookkeeping or accounting'], ['teach', '🎓 Teaching or TEFL'], ['trainer', '🏋️ Fitness or yoga instructor'], ['notary', '🖋️ Notary'], ['servsafe', '🍽️ Food or alcohol service'], ['realestate', '🏘️ Real estate license'], ['cdl', '🚛 CDL']];
/* where to sell: key|label|keywords|where|tips */
const SELLTXT = `
elec|Electronics and phones|phone,laptop,tablet,console,camera,tv,monitor,headphones,speaker,watch|Swappa, eBay, Facebook Marketplace, local buy-back stores|Wipe and sign out of accounts, include the charger, and be honest about scratches.
cloth|Clothes, shoes and bags|jacket,coat,dress,shoes,boots,bag,purse,jeans,clothes,brand|Poshmark, Depop, ThredUp, local consignment|Brand-name and outdoor gear sell best. Photograph on a hanger in daylight.
furn|Furniture and home decor|couch,table,chair,desk,bed,dresser,shelf,lamp,rug,mirror,furniture|Facebook Marketplace, Craigslist, OfferUp, local consignment|Local pickup only. Measure it and list the dimensions.
tools|Tools and equipment|drill,saw,tool,mower,wrench,ladder,generator,trimmer,compressor|Facebook Marketplace, eBay, local pawn or tool shops|Test it, clean it, and list brand and model number.
books|Books, media and games|book,textbook,dvd,game,vinyl,record,cd,lego|eBay, Amazon, local used book shops, Decluttr|Textbooks sell best at the start of a term. Lego sets sell by weight.
kids|Kids gear and toys|stroller,crib,toy,carseat,kid,baby,bike,costume|Facebook Marketplace, local kids consignment sales, Mercari|Skip used car seats that are expired or crashed. Clean it first.
sport|Sports and outdoor gear|bike,golf,ski,camp,tent,kayak,fishing,gun,treadmill,weights,skate|Facebook Marketplace, eBay, Play It Again Sports, Sidelineswap|Name-brand outdoor gear holds value. Check local rules for firearms.
music|Musical instruments|guitar,piano,keyboard,drum,amp,violin,instrument|Reverb, Facebook Marketplace, local music shops|Reverb fees are low and buyers are serious.
app|Appliances|fridge,washer,dryer,microwave,dishwasher,vacuum,mixer,air fryer,appliance|Facebook Marketplace, Craigslist, appliance resale shops|Working large appliances sell fast locally.
veh|Vehicles, parts and trailers|car,truck,motorcycle,trailer,boat,rv,parts,tires|Facebook Marketplace, Autotrader, Bring a Trailer, local dealers|Sell privately for more; clear the title first. Always meet at a safe, public place.
coll|Collectibles and antiques|coin,stamp,card,comic,antique,vintage,figure,art,jewelry,gold|eBay, local dealers, specialty auction houses|Get an appraisal before you sell anything old or gold. Never take the first offer.
garden|Plants and garden gear|plant,seedling,seed,herb,pot,planter,garden,mushroom|Local plant swaps, Facebook Marketplace, farmers markets|Seedlings in spring sell out fast.
misc|Anything else|other|Facebook Marketplace, OfferUp, a garage sale|If it has sat unused for a year, sell it.
`;
const SELLS = SELLTXT.trim().split('\n').map(l => { const f = l.split('|'); return { k: f[0], n: f[1], kw: f[2].split(','), where: f[3], tip: f[4] }; });
const SELLPROMPTS = ['Look in the garage, closet and attic. What has not moved in a year?', 'Sell the extras: a second TV, old phones, a drawer of cables, unused tools.', 'Check your kids\' outgrown clothes and baby gear.', 'Sell old gift cards, unused tickets and extra gear.', 'Any hobby you quit? Sell the gear.', 'Look for brand-name items: they resell the best.'];

/* quests: id|emoji|text|xp|period (d day, w week) */
const QUEST_TXT = `
qlook|🔍|Review your budget for 2 minutes|10|d
qspend|🧘|Make a no-spend day (log it on Home)|15|d
qprice|⏳|Wait 24 hours before one non-essential buy|10|d
qsell|📦|List one thing you do not use for sale|20|w
qsub|✂️|Check your subscriptions and cancel one|25|w
qfood|🥘|Cook at home 5 nights this week|25|w
qextra|💳|Make an extra debt payment (any amount)|30|w
qvault|🏺|Feed a vault (any amount)|30|w
qbill|📞|Call one provider and ask for a lower rate|30|w
qplan|📅|Plan next week's meals and spending|15|w
qhustle|🚀|Log a side hustle win|30|w
qgoal|🎯|Update one goal's progress|15|w
`;
const QUESTS = QUEST_TXT.trim().split('\n').map(l => { const f = l.split('|'); return { id: f[0], e: f[1], t: f[2], xp: +f[3], per: f[4] }; });

/* medals: id, emoji, name, description */
const MEDALS = [
  ['first', '🌟', 'First Step', 'Add any income'], ['budget', '📒', 'Ledger Keeper', 'Fill out your budget'], ['zero', '⚖️', 'Every Dollar a Job', 'Plan every dollar (surplus near zero or better)'],
  ['debtlist', '💳', 'Face the Foe', 'List your debts'], ['extra', '⚔️', 'Extra Blow', 'Make your first extra debt payment'], ['pay1', '💀', 'One Down', 'Pay off a debt'], ['debtfree', '👑', 'Debt Slayer', 'Pay off every debt'],
  ['shield', '🛡️', 'Starter Shield', 'Save $1,000'], ['fortress', '🏰', 'Full Fortress', 'Save 3 months of expenses'], ['ring4', '🪐', 'Retirement Ring', 'Reach 15% retirement saving'], ['millionaire', '💎', 'Seven Figures', 'Net worth of $1,000,000'],
  ['h1', '🚀', 'First Hustle', 'Log your first side hustle income'], ['h100', '💵', 'Hundred Club', '$100 earned from hustles'], ['h1000', '💰', 'Grand Hustler', '$1,000 earned from hustles'], ['sold5', '📦', 'Declutterer', 'Sell 5 items'],
  ['streak7', '🔥', 'Week of Fire', '7-day streak'], ['streak30', '☄️', 'Month of Meteors', '30-day streak'], ['goal1', '🎯', 'Dreamer', 'Add a goal'], ['dream3', '🌠', 'Big Dreamer', 'Have 3 goals'],
  ['subcut', '✂️', 'Subscription Slayer', 'Cancel a subscription'], ['tier3', '🏆', 'Vault Master', 'Reach tier 3 in any vault'], ['lvl5', '⭐', 'Rising Star', 'Reach level 5'], ['lvl10', '🌌', 'Master of Time', 'Reach level 10']
];
const MEDBY = {}; MEDALS.forEach(m => { MEDBY[m[0]] = m; });

/* vault tiers: names */
const TIERN = ['Empty', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Saturn'];
const TIERCOL = ['#555d73', '#b07a4a', '#b9c0cf', '#e2b857', '#8fe3ff', '#c9a6ff'];

/* counsel: keywords|question|answer */
const FAQ_TXT = `
card,credit,interest,pay off|Should I carry a balance on my credit card?|No. Card interest often runs 20 to 30 percent a year, which no investment reliably beats. If you can not pay in full, stop using the card for new purchases, pay more than the minimum, and put the card on the debt list here so the payoff plan targets it.
emergency,fund,savings,rainy|How big should my emergency fund be?|Start with a $1,000 starter shield so small surprises do not become new debt. After the debts (not the home) are gone, build three to six months of essential expenses: housing, utilities, food, insurance, transportation and minimum payments. Keep it in a plain savings account, not invested.
snowball,avalanche,order,which debt|Snowball or avalanche?|Avalanche pays the highest interest rate first and saves the most money. Snowball pays the smallest balance first and gives the fastest wins. The best plan is the one you will stick to. Try both in the Debt tab and compare the months and interest.
consolidate,consolidation,balance transfer|Should I consolidate my debt?|Only if the new loan has a clearly lower rate (at least 3 points lower), no big fees, and you will stop using the old cards. Consolidation does not remove debt: it moves it. If spending created it, fix the budget first or it comes back.
401k,match,employer|Should I take my employer match?|Yes. A match is an instant 50 to 100 percent return. A common order: starter shield, then contribute enough to get the full match, then attack high-interest debt, then return to full retirement saving.
roth,traditional,ira|Roth or traditional?|A Roth is paid with after-tax money and grows tax-free. Traditional gives a deduction today and is taxed when you withdraw. A Roth often suits lower or middle income now and people who expect higher taxes later. A tax professional can look at your case.
retire,retirement,nest egg,how much|How much do I need to retire?|A common rule of thumb is 25 times your annual spending in retirement (the 4 percent rule). Spending $48,000 a year means about $1.2 million. Social Security and pensions reduce what you must save. Use the Vault tab to see your projection.
car,loan,buy a car,vehicle|How much car can I afford?|A strong rule: total car payments under 10 to 15 percent of take-home pay, pay with cash if you can, and buy a reliable 3 to 6 year old car rather than new. Cars lose a fifth of their value the first year.
house,mortgage,buy,home,rent|Should I buy a house?|Consider buying when you have no consumer debt, a full emergency fund, 10 to 20 percent down, and a payment (principal, interest, taxes, insurance) under 25 percent of take-home on a 15-year loan, or 30 percent on a 30-year. Renting is not wasted money if buying would stretch you.
student,loans,education|How should I handle student loans?|List each loan with its rate. Look into income-driven plans and forgiveness programs if you qualify before paying them off fast. Otherwise treat student loans like other debt: pay the minimum on all, and send every extra dollar to one target.
budget,spend,zero|How do I start a budget?|Write down take-home income, list every expense, and give every dollar a job before the month starts. Start with the Budget tab. If you are over, cut wants first, then shop your bills (insurance, phone, internet).
subscription,subscriptions,cancel|How do I find money fast?|Cancel unused subscriptions, shop your car and home insurance, call providers and ask for a lower rate, sell things you do not use, and meal plan to cut food waste. Most households find $100 to $300 a month.
side,hustle,income,extra|Should I get a side hustle?|If your budget is tight, raising income is as powerful as cutting expenses. Choose something with low startup cost and send every dollar to a specific target in Saturnica: a debt, the shield, or a goal.
insurance,life,term|What insurance do I need?|Health, auto, home or renter, disability, and term life if anyone depends on your income. Skip whole life as a savings plan. Shop term life; a healthy 30-year-old can buy 20 years of coverage cheaply.
credit,score,fico|Does my credit score matter?|It matters for mortgages and some insurance. Pay on time, keep card use low, avoid new debt, and check your free credit report. You do not need debt to build credit.
kids,college,529|How do I save for my kids' college?|After the emergency fund and your own retirement saving. You can borrow for college but not for retirement. A 529 plan grows tax-free for education.
taxes,side hustle tax,1099|Do I owe tax on side hustle income?|In the US, yes: self-employment income is taxable, and you may owe quarterly estimated tax. Set aside 25 to 30 percent of what you earn and track expenses. A local tax pro or the IRS website can confirm your situation.
irregular,income,freelance,seasonal|How do I budget with irregular income?|Budget off your lowest typical month. Put extra months into a buffer account first, then pay yourself a steady wage from it.
couple,spouse,partner,marriage|How do couples handle money?|Hold a monthly money meeting, share one budget and one set of goals, and give each person some no-questions spending money. Money fights are usually about unspoken goals: write them in the Goals tab together.
invest,investing,stocks,index|How should I invest?|After debts and the emergency fund, many people invest in low-cost diversified index funds through retirement accounts, for the long term. Avoid hot tips, leverage and anything you do not understand. This app does not give personal investment advice.
inflation,prices,cost|What about inflation?|Prices rise about 2 to 3 percent a year on average. Projections in Saturnica use a real (after-inflation) return so your future dollars mean what today's dollars do.
payday,title,loan|I took a payday or title loan. What now?|These are the most dangerous debts. Make paying them off your first priority, and ask a nonprofit credit counselor about alternatives. Never roll them over.
bankrupt,collections,garnish|I am in collections or thinking about bankruptcy.|Get free help from a nonprofit credit counselor (NFCC member agencies). Collection debts have rules and timelines you can use. A bankruptcy attorney's first consult is often free.
gift,holiday,christmas|How do I stop holiday overspending?|Use a sinking fund: divide the total you want to spend by 12 and set that aside each month. Set a limit per person before you shop.
sinking,irregular bills,annual|What is a sinking fund?|A small monthly amount for a known future expense (car repair, insurance, holidays). It turns a surprise into a plan.
`;
const FAQ = FAQ_TXT.trim().split('\n').map(l => { const f = l.split('|'); return { kw: f[0].split(','), q: f[1], a: f[2] }; });

/* dream templates: kind|emoji|name|cost|note */
const DREAM_TXT = `
travel|🏝️|A big trip each year|4500|Flights, lodging and fun for two. Do it with cash.
travel|🗼|Two weeks in Europe|7500|Two people, mid-range.
travel|🛳️|Family cruise or road trip|5000|Plan 12 months out.
travel|🌏|A sabbatical year of travel|40000|Quit the grind for a year.
home|🏡|Down payment on a first home|40000|About 10 to 20 percent of a typical home.
home|🔑|Pay off the mortgage|150000|The "Home Free" ring.
home|🏘️|Down payment on a rental property|60000|Cash-flow property that pays you.
home|🌲|Land or cabin|75000|A place of your own.
home|🔨|Major home renovation|30000|Kitchen, roof or addition.
car|🚗|Reliable car with cash|15000|Pay cash, no payment.
car|🚐|Camper or RV|60000|Freedom on wheels.
life|💍|Wedding|20000|A modest, joyful wedding.
life|🎓|Kid's college fund|60000|Four years.
life|🏢|Start a business|25000|Equipment and runway.
life|❤️|Give big every year|10000|A donation fund with purpose.
life|🧓|Retire early|0|Set the age in the retirement panel.
life|🛟|A full year of expenses saved|0|Peace of mind, tied to your budget.
`;
const DREAMS = DREAM_TXT.trim().split('\n').map(l => { const f = l.split('|'); return { k: f[0], e: f[1], n: f[2], cost: +f[3], note: f[4] }; });
const DREAMPROMPTS = ['If money were not a problem, what would a normal Tuesday look like?', 'Where would you wake up on a free January?', 'What would you do for a year if you never had to work again?', 'Which trip do you want to take before you are 65?', 'What would make your family feel secure for life?', 'Who or what would you give to if you could?'];
const GUIDE = { shield: 1000, ssWage: 0.8 };
const DISCLAIMER = 'Saturnica is an educational planning tool, not a licensed financial, tax or legal advisor. It runs on what you type in. For big decisions, talk to a qualified professional.';
