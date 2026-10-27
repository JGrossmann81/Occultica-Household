/* Fills null lat/lon on earlier camps-*.js records. Never overwrites a non-null value.
   Every coordinate was read from the cited Wikipedia article (read 2026-10). approx:true = locality/park-level pin, not the campground itself. See SOURCES-coords.md */
(function(){
var W='https://en.wikipedia.org/wiki/';
var C={
'ca-camp-4-yosemite':[37.74167,-119.6025,W+'Camp_4_(Yosemite)',false],
'ca-white-wolf-yosemite':[37.8706778,-119.6470889,W+'White_Wolf_Campground',false],
'ca-tuolumne-meadows-yosemite':[37.875,-119.35,W+'Tuolumne_Meadows',true],
'ca-lodgepole-sequoia':[36.60889,-118.75278,W+'Wuksachi_Village',true],
'ca-morro-strand-state-beach':[35.37583,-120.86306,W+'Morro_Strand_State_Beach',true],
'ca-montana-de-oro-islay-creek':[35.2639,-120.8622,W+'Monta%C3%B1a_de_Oro_State_Park',true],
'ca-pismo-north-beach':[35.11028,-120.63139,W+'Pismo_State_Beach',true],
'ca-pismo-oceano':[35.11028,-120.63139,W+'Pismo_State_Beach',true],
'ca-pinnacles-campground':[36.48694,-121.16694,W+'Pinnacles_National_Park',true],
'ca-hidden-valley-joshua-tree':[34.0138472,-116.1705083,W+'Hidden_Valley_(Joshua_Tree_National_Park)',true],
'ca-texas-spring-death-valley':[36.45806,-116.87083,W+'Furnace_Creek,_California',true],
'ca-sunset-death-valley':[36.45806,-116.87083,W+'Furnace_Creek,_California',true],
'ca-mcgrath-state-beach':[34.22500,-119.25833,W+'McGrath_State_Beach',true],
'ca-sycamore-canyon-point-mugu':[34.1,-119.0,W+'Point_Mugu_State_Park',true],
'ca-thornhill-broome-point-mugu':[34.1,-119.0,W+'Point_Mugu_State_Park',true],
'ca-water-canyon-channel-islands':[33.967,-120.1,W+'Santa_Rosa_Island_(California)',true],
'ut-south-campground-zion':[37.184701,-112.979614,W+'The_Watchman_(Utah)',true],
'az-north-rim-campground-grand-canyon':[36.19722,-112.05333,W+'Grand_Canyon_Lodge',true],
'co-glacier-basin-campground-rocky-mountain':[40.33,-105.59444,W+'Glacier_Basin_Campground_Ranger_Station',false],
'co-moraine-park-campground-rocky-mountain':[40.35861,-105.58389,W+'Moraine_Park_Museum_and_Amphitheater',true],
'mt-apgar-campground-glacier':[48.52778,-113.99306,W+'Apgar,_Montana',true],
'wy-jenny-lake-campground-grand-teton':[43.76389,-110.73,W+'Jenny_Lake',true],
'md-assateague-island-campground':[38.08333,-75.20833,W+'Assateague_Island_National_Seashore',true],
'tn-elkmont-campground-great-smoky':[35.65556,-83.58444,W+'Elkmont,_Tennessee',true],
'tn-cosby-campground-great-smoky':[35.795,-83.24556,W+'Cosby,_Tennessee',true],
'me-blackwoods-campground-acadia':[44.31056,-68.20417,W+'Blackwoods_Campground',false],
'me-seawall-campground-acadia':[44.24056,-68.30444,W+'Seawall_Campground',false]
};
var it=(window.CAMPS&&window.CAMPS.items)||[];
it.forEach(function(x){var c=C[x.id];if(c&&(x.lat==null||x.lon==null)){x.lat=c[0];x.lon=c[1];x.coordSrc=c[2];if(c[3])x.coordApprox=true;if(x.src&&x.src.indexOf(c[2])<0)x.src.push(c[2]);}});
})();
