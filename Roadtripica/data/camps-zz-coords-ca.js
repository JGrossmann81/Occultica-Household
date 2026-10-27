/* Fills null lat/lon on earlier camps-*.js records (California). Never overwrites a non-null value.
   Every coordinate was read from the cited Wikipedia article infobox (read 2026-10). All are approx:true = park/area-level pin, not the campground itself. See SOURCES-coords-ca.md */
(function(){
var W='https://en.wikipedia.org/wiki/';
var JT=[34.1,-116.27,W+'Joshua_Tree_National_Park',true];
var MO=[34.883,-115.717,W+'Mojave_National_Preserve',true];
var YO=[37.85,-119.517,W+'Yosemite_National_Park',true];
var YV=[37.72167,-119.64639,W+'Yosemite_Valley',true];
var SQ=[36.56472,-118.77278,W+'Sequoia_National_Park',true];
var MK=[36.2703,-118.3541,W+'Mineral_King',true];
var WH=[40.62528,-122.55944,W+'Whiskeytown%E2%80%93Shasta%E2%80%93Trinity_National_Recreation_Area',true];
var DV=[36.45,-116.85,W+'Death_Valley_National_Park',true];
var PR=[38.067,-122.883,W+'Point_Reyes_National_Seashore',true];
var DP=[37.7415,-120.3735,W+'Don_Pedro_Reservoir',true];
var HS=[35.58361,-121.12167,W+'Hearst_San_Simeon_State_Park',true];
var EW=[34.28528,-119.32556,W+'Emma_Wood_State_Beach',true];
var LP=[34.667,-119.75,W+'Los_Padres_National_Forest',true];
var C={
'ca-upper-pines-yosemite':[37.73611,-119.5625,'https://campertunity.com/listings/campgrounds/upper-pines-campground-yosemite-national-park-ca-us.md',false],
'ca-lower-pines-yosemite':YV,'ca-north-pines-yosemite':YV,
'ca-wawona-yosemite':[37.53694,-119.65639,W+'Wawona,_California',true],
'ca-bridalveil-creek-yosemite':YO,'ca-hodgdon-meadow-yosemite':YO,'ca-crane-flat-yosemite':YO,'ca-tamarack-flat-yosemite':YO,'ca-yosemite-creek-yosemite':YO,'ca-porcupine-flat-yosemite':YO,
'ca-dorst-creek-sequoia':SQ,'ca-potwisha-sequoia':SQ,'ca-buckeye-flat-sequoia':SQ,
'ca-atwell-mill-sequoia':MK,'ca-cold-springs-sequoia':MK,
'ca-sunset-kings-canyon':[36.78928,-118.67286,W+'Kings_Canyon_National_Park',true],
'ca-millerton-lake-sra':[37.0425,-119.6545,W+'Millerton_Lake',true],
'ca-san-luis-reservoir-sra':[37.0679,-121.081,W+'San_Luis_Reservoir',true],
'ca-don-pedro-fleming-meadows':DP,'ca-don-pedro-blue-oaks':DP,'ca-don-pedro-moccasin-point':DP,
'ca-lake-mcclure-mid-campgrounds':[37.6425,-120.2825,W+'Lake_McClure',true],
'ca-san-simeon-creek-hearst-sp':HS,'ca-washburn-hearst-sp':HS,
'ca-lopez-lake-recreation-area':[35.19261,-120.47316,W+'Lopez_Lake',true],
'ca-meeks-bay-resort-campground':[39.03444,-120.12417,W+'Meeks_Bay,_California',true],
'ca-upper-jamison-plumas-eureka':[39.76111,-120.70667,W+'Plumas-Eureka_State_Park',true],
'ca-peninsula-folsom-lake':[38.73167,-121.13306,W+'Folsom_Lake_State_Recreation_Area',true],
'ca-woodside-salt-point':[38.583,-123.333,W+'Salt_Point_State_Park',true],
'ca-bothe-napa-valley-campground':[38.55111,-122.51611,W+'Bothe-Napa_Valley_State_Park',true],
'ca-coast-camp-point-reyes':PR,'ca-glen-camp-point-reyes':PR,'ca-sky-camp-point-reyes':PR,'ca-wildcat-camp-point-reyes':PR,
'ca-oak-bottom-whiskeytown':WH,'ca-brandy-creek-rv-whiskeytown':WH,
'ca-mesquite-spring-death-valley':DV,'ca-emigrant-death-valley':DV,'ca-thorndike-death-valley':DV,'ca-mahogany-flat-death-valley':DV,
'ca-scorpion-canyon-channel-islands':[34.0,-119.717,W+'Santa_Cruz_Island',true],
'ca-anacapa-island-channel-islands':[34.0083,-119.4167,W+'Channel_Islands_National_Park',true],
'ca-lake-morena-county-park':[32.68528,-116.5475,W+'Morena_Dam',true],
'ca-faria-beach-county-park':[34.31806,-119.3875,W+'Faria,_California',true],
'ca-emma-wood-group-ventura':EW,
'ca-wheeler-gorge-los-padres':[34.50806,-119.29139,W+'Wheeler_Springs,_California',true],
'ca-upper-oso-los-padres':LP,
'ca-fremont-peak-sp':[36.76,-121.50167,W+'Fremont_Peak_State_Park',true],
'ca-cottonwood-joshua-tree':JT,
'ca-ryan-joshua-tree':JT,
'ca-belle-joshua-tree':JT,
'ca-white-tank-joshua-tree':JT,
'ca-sheep-pass-group-joshua-tree':JT,
'ca-hole-in-the-wall-mojave':MO,
'ca-mid-hills-mojave':MO,
'ca-black-canyon-group-mojave':MO,
'ca-crystal-cove-backcountry':[33.57389,-117.84,W+'Crystal_Cove_State_Park',true]
};
var it=(window.CAMPS&&window.CAMPS.items)||[];
it.forEach(function(x){var c=C[x.id];if(c&&(x.lat==null||x.lon==null)){x.lat=c[0];x.lon=c[1];x.coordSrc=c[2];if(c[3])x.coordApprox=true;if(x.src&&x.src.indexOf(c[2])<0)x.src.push(c[2]);}});
})();
