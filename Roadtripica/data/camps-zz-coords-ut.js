/* Fills null lat/lon on Utah camps-*.js records. Never overwrites a non-null value.
   Every coordinate was read from the cited Wikipedia article infobox (read 2026-10). All are park-level or reservoir-level pins (approx:true), not the campground itself. See SOURCES-coords-ut.md */
(function(){
var W='https://en.wikipedia.org/wiki/';
var DH=[38.50833,-109.74222,W+'Dead_Horse_Point_State_Park',true];
var KB=[37.50056,-112.00056,W+'Kodachrome_Basin_State_Park',true];
var ZI=[37.3,-113.0,W+'Zion_National_Park',true];
var BR=[37.64,-112.17,W+'Bryce_Canyon_National_Park',true];
var CR=[38.2,-111.167,W+'Capitol_Reef_National_Park',true];
var CL=[38.16691,-109.75966,W+'Canyonlands_National_Park',true];
var DI=[40.533,-108.983,W+'Dinosaur_National_Monument',true];
var FG=[40.91444,-109.42139,W+'Flaming_Gorge_National_Recreation_Area',true];
var NL=[37.58,-112.67,W+'Markagunt_Plateau',true];
var FL=[38.54861,-111.71111,W+'Fish_Lake_(Utah)',true];
var ML=[40.7045861,-110.8881861,W+'Mirror_Lake_(Uinta_Mountains)',true];
var C={
'ut-quail-creek-state-park-campground':[37.1925,-113.38528,W+'Quail_Creek_State_Park',true],
'ut-snow-canyon-state-park-campground':[37.20306,-113.64139,W+'Snow_Canyon_State_Park',true],
'ut-rockport-state-park-campgrounds':[40.79,-111.40417,W+'Rockport_Reservoir',true],
'ut-east-canyon-state-park-campgrounds':[40.90111,-111.58694,W+'East_Canyon_State_Park',true],
'ut-hyrum-state-park-campground':[41.62028,-111.8575,W+'Hyrum_State_Park',true],
'ut-red-fleet-state-park-campground':[40.58222,-109.43222,W+'Red_Fleet_State_Park',true],
'ut-steinaker-state-park-campground':[40.5175,-109.53028,W+'Steinaker_State_Park',true],
'ut-echo-state-park-campground':[40.95833,-111.40778,W+'Echo_State_Park',true],
'ut-cathedral-valley-campground-capitol-reef':CR,'ut-cedar-mesa-campground-capitol-reef':CR,'ut-fruita-campground-capitol-reef':CR,
'ut-point-supreme-campground-cedar-breaks':[37.6424776,-112.8488318,W+'Cedar_Breaks_National_Monument',true],
'ut-natural-bridges-campground':[37.6013829,-110.0137437,W+'Natural_Bridges_National_Monument',true],
'ut-hovenweep-campground':[37.38389,-109.07722,W+'Hovenweep_National_Monument',true],
'ut-green-river-campground-dinosaur':DI,'ut-split-mountain-campground-dinosaur':DI,'ut-rainbow-park-campground-dinosaur':DI,
'ut-bullfrog-campground-glen-canyon':[37.51611,-110.72861,W+'Bullfrog_Basin',true],
'ut-navajo-lake-campground':NL,'ut-spruces-campground-dixie':NL,'ut-te-ah-campground-dixie':NL,
'ut-mirror-lake-campground':ML,'ut-moosehorn-campground':ML,
'ut-mackinaw-campground-fish-lake':FL,'ut-doctor-creek-campground-fish-lake':FL,'ut-frying-pan-campground-fish-lake':FL,
'ut-joes-valley-campground':[39.28882,-111.26977,W+'Joes_Valley_Dam',true],
'ut-antelope-flat-campground':FG,'ut-lucerne-valley-campground':FG,'ut-dripping-springs-campground':FG,'ut-mustang-ridge-campground':FG,'ut-firefighters-memorial-campground':FG,'ut-skull-creek-campground':FG,'ut-canyon-rim-campground':FG,'ut-red-canyon-campground-flaming-gorge':FG,'ut-carmel-campground':FG,'ut-willows-manns-campground':FG,
'ut-lava-point-campground-zion':ZI,
'ut-north-campground-bryce-canyon':BR,'ut-sunset-campground-bryce-canyon':BR,
'ut-devils-garden-campground-arches':[38.72806,-109.54,W+'Arches_National_Park',true],
'ut-willow-flat-campground-canyonlands':CL,'ut-needles-campground-canyonlands':CL,
'ut-kayenta-campground-dead-horse-point':DH,
'ut-wingate-campground-dead-horse-point':DH,
'ut-goblin-valley-campground':[38.56667,-110.71,W+'Goblin_Valley_State_Park',true],
'ut-basin-campground-kodachrome-basin':KB,
'ut-bryce-view-arch-campgrounds-kodachrome-basin':KB,
'ut-ladyfinger-campground-antelope-island':[40.95833,-112.21389,W+'Antelope_Island',true],
'ut-coral-pink-sand-dunes-campground':[37.03778,-112.72028,W+'Coral_Pink_Sand_Dunes_State_Park',true],
'ut-deer-creek-state-park-campground':[40.41389,-111.50556,W+'Deer_Creek_State_Park_(Utah)',true],
'ut-jordanelle-state-park-campgrounds':[40.61667,-111.40833,W+'Jordanelle_Reservoir',true],
'ut-wasatch-mountain-state-park-campground':[40.50278,-111.53722,W+'Wasatch_Mountain_State_Park',true],
'ut-starvation-state-park-campgrounds':[40.20278,-110.44722,W+'Fred_Hayes_State_Park_at_Starvation',true],
'ut-green-river-state-park-campground':[38.99139,-110.15417,W+'Green_River_State_Park',true],
'ut-escalante-petrified-forest-campground':[37.78778,-111.62944,W+'Escalante_Petrified_Forest_State_Park',true],
'ut-gunlock-state-park-campground':[37.25361,-113.78444,W+'Gunlock_State_Park',true],
'ut-palisade-state-park-campground':[39.20639,-111.66556,W+'Palisade_State_Park',true],
'ut-millsite-state-park-campground':[39.09167,-111.19222,W+'Millsite_State_Park',true]
};
var it=(window.CAMPS&&window.CAMPS.items)||[];
it.forEach(function(x){var c=C[x.id];if(c&&(x.lat==null||x.lon==null)){x.lat=c[0];x.lon=c[1];x.coordSrc=c[2];if(c[3])x.coordApprox=true;if(x.src&&x.src.indexOf(c[2])<0)x.src.push(c[2]);}});
})();
