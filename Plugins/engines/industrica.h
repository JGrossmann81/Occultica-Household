// Industrica: metal and machine sounds, modelled (modal strikes, friction, noise and oscillator machines), with a 16-step, 8-track pattern sequencer on its own tempo clock.
#pragma once
#include "../common/engine.h"
#include <cstring>
namespace occ { namespace industrica {
constexpr int kTracks = 8, kSteps = 16, kSounds = 37, kVoices = 32, kPend = 192, kMaxModes = 16, kPatterns = 9, kKits = 7, kTrackParams = 6;
enum { Preset, Volume, PlayMode, Run, Bpm, Rate, Steps, Swing, Humanize, Probability, Gate, Worn, Overheat, Material, Size, Damage, Drive, Tone, KeySound, LoadPattern, LoadKit, GlobalCount };
constexpr int TB = GlobalCount, CB = TB + kTracks * kTrackParams, Count = CB + kTracks * kSteps;
constexpr int trackParam(int t, int p) { return TB + t * kTrackParams + p; }
constexpr int cellParam(int t, int s) { return CB + t * kSteps + s; }
enum { TSound, TTune, TDecay, TLevel, TPan, TMute };
inline double jr(double x) { return std::floor(x + 0.5); }  // Math.round
inline double tr(double x) { return std::trunc(x); }        // Math.trunc

struct Sound {
  std::string name; double f0 = 400, gain = 1; int nm = 0; double r[kMaxModes] = {}, a[kMaxModes] = {};
  double T0 = 0.5, tilt = 1, hard = 0.7, excNoise = 0, imp = 1, bLo = 0, bHi = 0, bAtk = 1, bDec = 0, bLvl = 0, sLo = 0, sHi = 0, sLvl = 0, sAmHz = 0, sAmDepth = 0,
         oType = 0, oF = 100, oS0 = 1, oS1 = 1, oSweepMs = 0, oLvl = 0, oLp = 6000, oVib = 0, oVibHz = 5, oFeed = 0, oAlt = 1, oAltHz = 0, oLfo = 0, oLfoHz = 0, oDecMs = 0, oAtk = 5, qF = 0, qLvl = 0, qHz = 0, qDrift = 0,
         rep = 0, repMs = 0, repRatio = 1, repV = 1, repSpread = 0, repJit = 0, loopMs = 0, loopJit = 0, loopV = 0.7, loopSpread = 0, sustain = 0, rel = 60;
};
inline void setField(Sound& d, const char* k, double v) {
#define F(n) if (!std::strcmp(k, #n)) { d.n = v; return; }
  F(f0) F(gain) F(T0) F(tilt) F(hard) F(excNoise) F(imp) F(bLo) F(bHi) F(bAtk) F(bDec) F(bLvl) F(sLo) F(sHi) F(sLvl) F(sAmHz) F(sAmDepth)
  F(oType) F(oF) F(oS0) F(oS1) F(oSweepMs) F(oLvl) F(oLp) F(oVib) F(oVibHz) F(oFeed) F(oAlt) F(oAltHz) F(oLfo) F(oLfoHz) F(oDecMs) F(oAtk) F(qF) F(qLvl) F(qHz) F(qDrift)
  F(rep) F(repMs) F(repRatio) F(repV) F(repSpread) F(repJit) F(loopMs) F(loopJit) F(loopV) F(loopSpread) F(sustain) F(rel)
#undef F
}
inline const std::vector<Sound>& sounds() {
  static const std::vector<Sound> SOUNDS = [] {
    std::vector<Sound> out;
    typedef std::vector<std::pair<const char*, double>> KV;
    auto S = [&](const char* name, KV o, std::vector<double> r = {}, std::vector<double> a = {}) {
      Sound d; d.name = name; for (auto& kv : o) setField(d, kv.first, kv.second);
      if (!r.empty()) { d.nm = std::min(kMaxModes, (int)r.size()); for (int i = 0; i < d.nm; ++i) d.r[i] = r[i]; int i = 0; for (; i < std::min(kMaxModes, (int)a.size()); ++i) d.a[i] = a[i]; for (; i < d.nm; ++i) d.a[i] = d.a[i - 1] * 0.7; }
      out.push_back(d);
    };
  S("Anvil",{{"f0",520},{"T0",1.5},{"tilt",1.2},{"hard",0.85},{"excNoise",0.35}},{1, 2.32, 4.25, 6.63, 9.38, 12.6},{1, 0.8, 0.6, 0.45, 0.3, 0.2});
  S("Steel sheet",{{"f0",310},{"T0",0.9},{"tilt",0.8},{"hard",0.8},{"excNoise",0.3},{"bLo",800},{"bHi",8000},{"bDec",30},{"bLvl",0.15}},{1, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.5, 4.06, 4.64},{1, 0.8, 0.9, 0.6, 0.7, 0.5, 0.5, 0.4, 0.3, 0.3});
  S("Pipe",{{"f0",220},{"T0",1.8},{"tilt",1},{"hard",0.6},{"excNoise",0.15}},{1, 2.76, 5.4, 8.93, 13.3},{1, 0.7, 0.45, 0.3, 0.2});
  S("Girder",{{"f0",88},{"T0",2.6},{"tilt",0.7},{"hard",0.5},{"excNoise",0.4},{"bLo",60},{"bHi",1200},{"bDec",60},{"bLvl",0.3}},{1, 2.76, 5.4, 8.93, 13.3},{1, 0.8, 0.55, 0.35, 0.2});
  S("Oil drum",{{"f0",135},{"T0",0.55},{"tilt",1.6},{"hard",0.55},{"excNoise",0.35},{"bLo",100},{"bHi",2500},{"bDec",40},{"bLvl",0.25}},{1, 1.7, 2.4, 3.1, 4.2, 5},{1, 0.8, 0.7, 0.5, 0.4, 0.3});
  S("Bell plate",{{"f0",700},{"T0",3},{"tilt",0.6},{"hard",0.9},{"excNoise",0.1}},{1, 2, 3, 4.16, 5.43, 6.8, 8.2},{1, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25});
  S("Cast pan",{{"f0",420},{"T0",0.35},{"tilt",1.6},{"hard",0.6},{"excNoise",0.25}},{1, 2.25, 3.7, 5.3, 7.1},{1, 0.7, 0.5, 0.35, 0.25});
  S("Rail",{{"f0",160},{"T0",4},{"tilt",0.5},{"hard",0.75},{"excNoise",0.2}},{1, 2.76, 5.4, 8.93, 13.3, 18.6},{1, 0.9, 0.7, 0.5, 0.35, 0.25});
  S("Hull gong",{{"f0",70},{"T0",6},{"tilt",0.4},{"hard",0.35},{"excNoise",0.3},{"bLo",40},{"bHi",800},{"bDec",120},{"bLvl",0.25}},{1, 1.5, 2, 2.5, 3.1, 3.9, 4.7},{1, 0.8, 0.8, 0.6, 0.5, 0.4, 0.3});
  S("Chain drop",{{"f0",2200},{"T0",0.08},{"tilt",1},{"hard",0.9},{"excNoise",0.2},{"rep",9},{"repMs",12},{"repRatio",1.12},{"repV",0.85},{"repSpread",0.3},{"repJit",0.5}},{1, 2.9, 5.1, 7.3},{1, 0.6, 0.4, 0.25});
  S("Bolt bounce",{{"f0",1700},{"T0",0.15},{"hard",0.9},{"rep",7},{"repMs",130},{"repRatio",0.72},{"repV",0.72},{"repSpread",0.04}},{1, 2.5, 4.1, 6.2},{1, 0.7, 0.5, 0.3});
  S("Pipe drop",{{"f0",260},{"T0",0.7},{"hard",0.6},{"excNoise",0.2},{"rep",4},{"repMs",190},{"repRatio",0.62},{"repV",0.6},{"repSpread",0.02}},{1, 2.76, 5.4, 8.93},{1, 0.7, 0.45, 0.3});
  S("Scrap rattle",{{"f0",3000},{"T0",0.05},{"hard",0.95},{"excNoise",0.3},{"rep",22},{"repMs",20},{"repRatio",0.96},{"repV",0.9},{"repSpread",0.8},{"repJit",1}},{1, 3.1, 6.2, 9.7},{1, 0.6, 0.4, 0.2});
  S("Relay click",{{"f0",3800},{"T0",0.02},{"hard",1},{"bLo",2000},{"bHi",7000},{"bDec",3},{"bLvl",0.5},{"rep",1},{"repMs",8},{"repV",0.7}},{1, 2.7},{1, 0.5});
  S("Latch clack",{{"f0",1100},{"T0",0.07},{"hard",0.8},{"excNoise",0.3},{"bLo",600},{"bHi",5000},{"bDec",8},{"bLvl",0.3}},{1, 2.3, 4.8},{1, 0.6, 0.3});
  S("Rivet gun",{{"f0",900},{"T0",0.06},{"hard",0.85},{"bLo",500},{"bHi",6000},{"bDec",6},{"bLvl",0.4},{"rep",8},{"repMs",34},{"repV",0.92},{"repJit",0.08}},{1, 2.4, 4.4},{1, 0.6, 0.3});
  S("Hammer smack",{{"f0",280},{"T0",0.15},{"hard",0.5},{"bLo",300},{"bHi",3000},{"bDec",25},{"bLvl",0.6}},{1, 2.4},{1, 0.5});
  S("Stamp press",{{"f0",500},{"T0",0.25},{"hard",0.7},{"bLo",40},{"bHi",1500},{"bDec",50},{"bLvl",0.6},{"oType",3},{"oF",90},{"oS0",1},{"oS1",0.4},{"oSweepMs",120},{"oDecMs",110},{"oLvl",1},{"rep",1},{"repMs",45},{"repV",0.6}},{1, 2.7, 5.2},{0.6, 0.4, 0.25});
  S("Valve thunk",{{"f0",380},{"T0",0.12},{"hard",0.6},{"bLo",2500},{"bHi",9000},{"bAtk",4},{"bDec",70},{"bLvl",0.2},{"oType",3},{"oF",160},{"oS0",1},{"oS1",0.38},{"oSweepMs",80},{"oDecMs",90},{"oLvl",0.9}},{1, 2.6},{0.7, 0.4});
  S("Squeak",{{"f0",2600},{"T0",0.1},{"sustain",1},{"qF",2400},{"qLvl",0.5},{"qHz",11},{"qDrift",0.06},{"oFeed",0.3},{"rel",40}},{1, 2.2},{0.4, 0.2});
  S("Rusty hinge",{{"f0",900},{"T0",0.12},{"sustain",1},{"qF",720},{"qLvl",0.55},{"qHz",7},{"qDrift",0.25},{"sLo",800},{"sHi",4000},{"sLvl",0.05},{"oFeed",0.4},{"rel",90}},{1, 2.6, 4.7},{0.5, 0.3, 0.15});
  S("Metal scrape",{{"f0",2600},{"T0",0.15},{"sustain",1},{"sLo",800},{"sHi",7000},{"sLvl",0.5},{"sAmHz",38},{"sAmDepth",0.8},{"qF",2400},{"qLvl",0.12},{"qHz",14},{"qDrift",0.1},{"oFeed",0.35},{"rel",70}},{1, 2.3, 3.9},{0.5, 0.3, 0.2});
  S("Grinder",{{"sustain",1},{"oType",1},{"oF",210},{"oLp",4500},{"oLvl",0.5},{"oAtk",120},{"sLo",2000},{"sHi",9000},{"sLvl",0.5},{"sAmHz",120},{"sAmDepth",0.4},{"loopMs",7},{"loopJit",1},{"loopV",0.5},{"loopSpread",0.5},{"bLo",4000},{"bHi",12000},{"bDec",3},{"bLvl",0.4},{"rel",140}});
  S("Brake squeal",{{"sustain",1},{"f0",3800},{"T0",0.2},{"qF",3800},{"qLvl",0.5},{"qHz",3},{"qDrift",0.05},{"oType",3},{"oF",3800},{"oS0",1.06},{"oS1",0.96},{"oSweepMs",1400},{"oLvl",0.12},{"oFeed",0.3},{"rel",120}},{1, 1.6},{0.3, 0.15});
  S("Chain drag",{{"sustain",1},{"f0",2300},{"T0",0.06},{"hard",0.9},{"loopMs",12},{"loopJit",0.8},{"loopV",0.8},{"loopSpread",0.3},{"sLo",800},{"sHi",4000},{"sLvl",0.08},{"rel",60}},{1, 2.9, 5.1, 7.3},{1, 0.6, 0.4, 0.25});
  S("Saw cut",{{"sustain",1},{"oType",1},{"oF",130},{"oLp",3500},{"oLvl",0.5},{"oLfo",0.06},{"oLfoHz",0.7},{"oAtk",200},{"oS0",0.5},{"oS1",1},{"oSweepMs",300},{"sLo",2500},{"sHi",9000},{"sLvl",0.45},{"sAmHz",95},{"sAmDepth",0.7},{"rel",220}});
  S("Lathe",{{"sustain",1},{"oType",1},{"oF",95},{"oLp",1800},{"oLvl",0.45},{"oAtk",250},{"oS0",0.4},{"oS1",1},{"oSweepMs",600},{"qF",3400},{"qLvl",0.15},{"qHz",3},{"qDrift",0.02},{"sLo",1000},{"sHi",6000},{"sLvl",0.2},{"rel",300}});
  S("Drill",{{"sustain",1},{"oType",1},{"oF",520},{"oS0",0.3},{"oS1",1},{"oSweepMs",220},{"oLp",5000},{"oLvl",0.5},{"oAtk",30},{"sLo",1500},{"sHi",8000},{"sLvl",0.3},{"sAmHz",28},{"sAmDepth",0.5},{"rel",160}});
  S("Plasma cutter",{{"sustain",1},{"sLo",2000},{"sHi",12000},{"sLvl",0.6},{"sAmHz",100},{"sAmDepth",0.3},{"oType",1},{"oF",100},{"oLp",800},{"oLvl",0.3},{"loopMs",15},{"loopJit",1},{"loopV",0.5},{"bLo",5000},{"bHi",14000},{"bDec",3},{"bLvl",0.4},{"rel",80}});
  S("Sparks",{{"sustain",1},{"sLo",6000},{"sHi",12000},{"sLvl",0.04},{"loopMs",5},{"loopJit",1},{"loopV",0.8},{"loopSpread",0.5},{"bLo",3000},{"bHi",14000},{"bDec",4},{"bLvl",0.8},{"f0",6000},{"T0",0.01},{"rel",40}},{1, 1.9},{0.3, 0.2});
  S("Pneumatic hiss",{{"bLo",3000},{"bHi",14000},{"bAtk",6},{"bDec",220},{"bLvl",1},{"oType",3},{"oF",120},{"oS0",1},{"oS1",0.5},{"oSweepMs",80},{"oDecMs",90},{"oLvl",0.6}});
  S("Hydraulic piston",{{"f0",220},{"T0",0.2},{"hard",0.6},{"oType",3},{"oF",48},{"oS0",0.7},{"oS1",1.2},{"oSweepMs",300},{"oDecMs",500},{"oLvl",0.8},{"bLo",150},{"bHi",800},{"bAtk",20},{"bDec",300},{"bLvl",0.5},{"rep",1},{"repMs",380},{"repV",0.8}},{1, 2.5, 4.4},{0.8, 0.5, 0.3});
  S("Klaxon",{{"sustain",1},{"oType",2},{"oF",440},{"oAlt",0.84},{"oAltHz",3.3},{"oLp",3500},{"oLvl",0.5},{"oAtk",8},{"rel",50}});
  S("Siren",{{"sustain",1},{"oType",3},{"oF",720},{"oLfo",0.35},{"oLfoHz",0.6},{"oLvl",0.6},{"oAtk",40},{"rel",200}});
  S("Turbine",{{"sustain",1},{"oType",1},{"oF",900},{"oS0",0.4},{"oS1",1},{"oSweepMs",1500},{"oLp",7000},{"oLvl",0.25},{"oAtk",300},{"sLo",3500},{"sHi",11000},{"sLvl",0.2},{"rel",500}});
  S("Conveyor",{{"sustain",1},{"f0",650},{"T0",0.05},{"hard",0.8},{"loopMs",95},{"loopJit",0.08},{"loopV",0.8},{"loopSpread",0.02},{"bLo",800},{"bHi",5000},{"bDec",8},{"bLvl",0.3},{"sLo",150},{"sHi",900},{"sLvl",0.25},{"rel",150}},{1, 2.6, 5},{1, 0.5, 0.25});
  S("Motor hum",{{"sustain",1},{"oType",1},{"oF",60},{"oLp",900},{"oLvl",0.5},{"oAtk",400},{"oS0",0.6},{"oS1",1},{"oSweepMs",800},{"oVib",0.003},{"oVibHz",5},{"rel",400}});
    return out;
  }();
  return SOUNDS;
}
static const char* const PAT_NAMES[] = {"- (keep)", "Press line", "Conveyor", "Foundry", "Hull knock", "Assembly", "Scrap yard", "Power hall", "Clear"};
static const char* const KIT_NAMES[] = {"- (keep)", "Foundry", "Shipyard", "Machine hall", "Scrap yard", "Workshop", "Power plant"};
static const char* const PATS[9][8] = {
  {"", "", "", "", "", "", "", ""},
  {"3.......2.......", "....2.......2...", "1.1.1.1.1.1.1.1.", "3.......3.....2.", "..........1....5", "......2.......2.", "................", "............2..1"},
  {"2...2...2...2...", "..1...1...1...1.", "2.2.2.2.2.2.2.2.", "1.1.1.1.1.1.1.1.", "...1.......1....", "................", "3...............", "....2.......2..4"},
  {"3..2..3...2..3..", "..2.....2.......", "1...1...1...1...", "........3.......", "5.......5.....5.", "....2.......3...", "................", "..1...1...1...1."},
  {"................", "3.......2.......", "........1.......", "................", "................", "......3.........", "................", "3..............."},
  {"2.2.2.2.2.2.2.4.", "..2.......2.....", "1.1.1.1.1.1.1.1.", "2...............", "......1.......1.", "....3...........", "................", "..2...2...2...3."},
  {"1.1.1.1.1.1.1.1.", "3...2...3...2...", "..2...2..2...2..", "......1.......1.", "5..3....5....3..", "..2.............", "2...........2...", "1..1..1..1..1..1"},
  {"2...............", "................", "2.2.2.2.2.2.2.2.", "3.......3.......", "................", "..2...........3.", "4...............", "......2........."},
  {"", "", "", "", "", "", "", ""}};
static const int KITS[7][8] = {{0, 4, 13, 17, 9, 30, 22, 10}, {0, 3, 14, 17, 9, 30, 22, 1}, {8, 7, 15, 16, 11, 18, 33, 5}, {13, 14, 18, 31, 27, 25, 26, 28}, {12, 9, 4, 6, 10, 11, 21, 29}, {16, 6, 15, 19, 14, 25, 27, 5}, {36, 34, 13, 32, 29, 31, 18, 33}};
struct PresetRow { const char* name; int pat, kit; double bpm; };
static const PresetRow PRESETS[] = {{"Init", 8, 0, 120}, {"Press line", 1, 1, 112}, {"Conveyor", 2, 3, 124}, {"Foundry", 3, 1, 96}, {"Hull knock", 4, 2, 70}, {"Assembly", 5, 5, 128}, {"Scrap yard", 6, 4, 104}, {"Power hall", 7, 6, 84}};
constexpr int kPresets = 8;
static const int DEF_SOUND[8] = {0, 4, 13, 17, 9, 30, 22, 10};
static const double NORM[] = {0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.3508,0.35,0.3502,0.3502,0.3505,0.3509,0.3812,0.3532,0.35,0.3949,0.35,0.3501,0.4169,0.5235,0.438,0.3741,0.3835,0.3549,0.3506,0.7574,0.6556,0.7001,0.3502,0.7681};

inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> SN, pn; for (auto& s : sounds()) SN.push_back(s.name); for (auto& p : PRESETS) pn.push_back(p.name);
  std::vector<std::string> patn(PAT_NAMES, PAT_NAMES + 9), kitn(KIT_NAMES, KIT_NAMES + 7);
  std::vector<Spec> sp = {
    P("Preset", "", 0, kPresets - 1, 0, "%.0f", false, pn),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"), P("Play", "", 0, 2, 0, "%.0f", false, {"Pattern + keys", "Pattern only", "Keys only"}), P("Run", "", 0, 1, 0, "%.0f", false, {"Stopped", "Running"}),
    P("Tempo", "bpm", 40, 240, 120, "%.0f bpm"), P("Rate", "", 0, 5, 2, "%.0f", false, {"1/4", "1/8", "1/16", "1/32", "1/8 triplet", "1/16 triplet"}), P("Steps", "", 1, 16, 16, "%.0f"),
    P("Swing", "%", 0, 100, 0, "%.0f %%"), P("Humanize", "%", 0, 100, 15, "%.0f %%"), P("Probability", "%", 0, 100, 100, "%.0f %%"), P("Gate", "%", 10, 400, 80, "%.0f %%", true),
    P("Worn", "%", 0, 100, 0, "%.0f %%"), P("Overheat", "%", 0, 100, 0, "%.0f %%"), P("Material", "", 0, 5, 0, "%.0f", false, {"Steel", "Cast iron", "Aluminium", "Brass", "Rusty", "Tin"}),
    P("Size", "%", -100, 100, 0, "%.0f %%"), P("Damage", "%", 0, 100, 0, "%.0f %%"), P("Drive", "%", 0, 100, 10, "%.0f %%"), P("Tone", "%", -100, 100, 0, "%.0f %%"),
    P("Key sound", "", 0, kSounds - 1, 0, "%.0f", false, SN), P("Load pattern", "", 0, kPatterns - 1, 0, "%.0f", false, patn), P("Load kit", "", 0, kKits - 1, 0, "%.0f", false, kitn),
  };
  static const char* const tp[] = {"sound", "tune", "decay", "level", "pan", "mute"};
  for (int t = 0; t < kTracks; ++t) for (int q = 0; q < kTrackParams; ++q) {
    std::string nm = "Track " + std::to_string(t + 1) + " " + tp[q];
    if (q == 0) sp.push_back(P(nm.c_str(), "", 0, kSounds - 1, DEF_SOUND[t], "%.0f", false, SN)); else if (q == 1) sp.push_back(P(nm.c_str(), "st", -24, 24, 0, "%.0f st")); else if (q == 2) sp.push_back(P(nm.c_str(), "%", -100, 100, 0, "%.0f %%"));
    else if (q == 3) sp.push_back(P(nm.c_str(), "dB", -24, 6, 0, "%.1f dB")); else if (q == 4) sp.push_back(P(nm.c_str(), "%", -100, 100, 0, "%.0f %%")); else sp.push_back(P(nm.c_str(), "", 0, 1, 0, "%.0f", false, {"On", "Muted"}));
  }
  for (int t = 0; t < kTracks; ++t) for (int s = 0; s < kSteps; ++s) { std::string nm = "T" + std::to_string(t + 1) + " step " + std::to_string(s + 1); sp.push_back(P(nm.c_str(), "", 0, 6, 0, "%.0f", false, {"Off", "Ghost", "Normal", "Accent", "x2", "x3", "x4"})); }
  return sp;
}
inline std::vector<Group> makeGroups() {
  std::vector<Group> g = {{"Sequencer", {Run, Bpm, Rate, Steps, Swing, Humanize, Probability, Gate, Worn, Overheat, LoadPattern, LoadKit, PlayMode}}, {"Sound", {KeySound, Material, Size, Damage, Drive, Tone, Volume}}};
  for (int t = 0; t < kTracks; ++t) { Group x{"Track " + std::to_string(t + 1), {}}; for (int q = 0; q < 6; ++q) x.ids.push_back(trackParam(t, q)); g.push_back(x); }
  for (int t = 0; t < kTracks; ++t) { Group x{"Pattern " + std::to_string(t + 1), {}}; for (int s = 0; s < kSteps; ++s) x.ids.push_back(cellParam(t, s)); g.push_back(x); }
  return g;
}

struct Rng {
  uint32_t s; explicit Rng(uint32_t x = 1) : s(x) {}
  double uni() { uint32_t x = s; x ^= x << 13; x ^= x >> 17; x ^= x << 5; s = x; return double(x >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
struct Shelf {  // high shelf biquad
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(double f, double q, double gdb, double sr) {
    f = clampd(f, 5, sr * 0.49); double A = std::pow(10.0, gdb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q), s = 2 * std::sqrt(A) * al;
    double B0 = A * ((A + 1) + (A - 1) * cw + s), B1 = -2 * A * ((A - 1) + (A + 1) * cw), B2 = A * ((A + 1) + (A - 1) * cw - s), A0 = (A + 1) - (A - 1) * cw + s, A1 = 2 * ((A - 1) - (A + 1) * cw), A2 = (A + 1) - (A - 1) * cw - s;
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
};
struct Voice {
  bool on = false; int snd = 0; double vel = 1, pan = 0, pitch = 1, decMul = 1, lvl = 1; bool sub = false; int track = -1, key = -1; double age = 0, gateLeft = 0; bool released = false; double relEnv = 1; int nm = 0;
  double c1[kMaxModes] = {}, c2[kMaxModes] = {}, b[kMaxModes] = {}, y1[kMaxModes] = {}, y2[kMaxModes] = {};
  double exLp = 0, exA = 0, bandHi1 = 0, bandLo1 = 0, bandHi2 = 0, bandLo2 = 0, bEnv = 0, oPh = 0, oLpS = 0, sqPh = 0, sqDrift = 0, sqAm = 0, sqLp = 0, vibPh = 0, lfoPh = 0, altPh = 0, amPh = 0, quiet = 0, loopT = 0, damageNoise = 0;
};
struct Pend { bool on = false; double t = 0; int snd = 0; double gate = 0; int track = -1, key = -1; double vel = 1, pitch = 1, pan = 0, lvl = 1, decMul = 1; bool sub = false; };
struct DD { double oLpK, sA1, sA2, bA1, bA2, qK, bAtt, relK; };
static const double MATDEC[6] = {1, 0.55, 1.5, 1.3, 0.45, 0.4}, MATHARD[6] = {1, 0.7, 1.2, 0.9, 0.8, 1.4}, MATTILT[6] = {1, 1.5, 0.6, 0.8, 1.8, 1.7}, MATDMG[6] = {0, 0.05, 0, 0, 0.5, 0.1}, RATEQ[6] = {1, 0.5, 0.25, 0.125, 1.0 / 3, 1.0 / 6};
constexpr double GATE_HELD = 268435456.0, GATE_LIM = 134217728.0;  // 1<<28, 1<<27

struct Engine : EngineBase {
  std::vector<Spec> specs; Rng rng{0xA11CE5u}; std::vector<Voice> voices; std::vector<Pend> pend; int pendN = 0;
  double stepPhase = 1; long long lastStep = -1; int stepNow = -1; bool wasRunning = false; double heat = 0, drift[kTracks] = {}, flash[kTracks] = {}, mod = 0; long long nonFinite = 0, hits = 0;
  Shelf tone[2]; std::vector<DD> dd; const std::vector<Sound>& SOUNDS;
  explicit Engine(double sr_) : EngineBase(sr_), specs(makeSpecs()), voices(kVoices), pend(kPend), SOUNDS(sounds()) {
    initParams(specs); tone[0].set(3500, 0.7, 0, sr_); tone[1].set(3500, 0.7, 0, sr_);
    const double fmax = 0.45 * sr_, TP = 6.2831853;
    for (auto& d : SOUNDS) dd.push_back(DD{1 - std::exp(-TP * std::min(d.oLp, fmax) / sr_), std::exp(-TP * std::min(d.sHi, fmax) / sr_), std::exp(-TP * std::max(d.sLo, 10.0) / sr_), std::exp(-TP * std::min(d.bHi, fmax) / sr_), std::exp(-TP * std::max(d.bLo, 10.0) / sr_),
      std::min(1.0, TP * std::max(0.5, d.qHz) / sr_ * 3), std::max(1.0, d.bAtk) * 0.001 * sr_, std::exp(-1 / (std::max(2.0, d.rel) * 0.001 * sr_))});
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    v[id] = x;
    if (id == Preset) loadPreset((int)jr(x));
    else if (id == Tone) { tone[0].set(3500, 0.7, x * 0.12, sr); tone[1].set(3500, 0.7, x * 0.12, sr); }
    else if (id == LoadPattern && x >= 1) { applyPattern((int)jr(x)); v[LoadPattern] = 0; writeParam(LoadPattern, 0); }
    else if (id == LoadKit && x >= 1) { applyKit((int)jr(x)); v[LoadKit] = 0; writeParam(LoadKit, 0); }
  }
  void put(int i, double val) { v[i] = val; writeParam(i, val); }
  void loadPreset(int n) {
    const PresetRow& p = PRESETS[(int)clampd(n, 0, kPresets - 1)]; applyPattern(p.pat); applyKit(p.kit); put(Bpm, p.bpm); put(Run, n > 0 ? 1 : 0);
  }
  void applyPattern(int p) {
    for (int t = 0; t < kTracks; ++t) { const char* row = PATS[(int)clampd(p, 0, kPatterns - 1)][t]; int len = (int)std::strlen(row); for (int s = 0; s < kSteps; ++s) { char c = len > s ? row[s] : '.'; double val = (c >= '1' && c <= '6') ? double(c - 48) : 0; put(cellParam(t, s), val); } }
  }
  void applyKit(int k) { for (int t = 0; t < kTracks; ++t) put(trackParam(t, TSound), KITS[(int)clampd(k, 0, kKits - 1)][t]); }
  void modWheel(double m) override { mod = m; }
  void allNotesOff() override { for (auto& x : voices) if (x.on) x.gateLeft = 0; }
  void schedule(double delay, int snd, double vel, double pitch, double pan, double gate, int track, int key, bool sub, double lvl, double decMul) {
    if (delay <= 0) { startVoice(snd, vel, pitch, pan, gate, track, key, sub, lvl, decMul); return; }
    for (auto& p : pend) if (!p.on) { p.on = true; p.t = delay; p.snd = snd; p.gate = gate; p.track = track; p.key = key; p.vel = vel; p.pitch = pitch; p.pan = pan; p.lvl = lvl; p.decMul = decMul; p.sub = sub; ++pendN; return; }
  }
  void startVoice(int snd, double vel, double pitch, double pan, double gate, int track, int key, bool sub, double lvl, double decMul) {
    if (snd < 0) snd = 0;
    if (snd >= kSounds) snd = kSounds - 1;
    double sr_ = sr; const Sound& d = SOUNDS[snd]; Voice* v_ = nullptr; for (auto& x : voices) if (!x.on) { v_ = &x; break; }
    if (!v_) { double best = -1; for (auto& x : voices) if (best < 0 || x.age > best) { best = x.age; v_ = &x; } }
    Voice& vo = *v_;
    std::fill(vo.c1, vo.c1 + kMaxModes, 0.0); std::fill(vo.c2, vo.c2 + kMaxModes, 0.0); std::fill(vo.b, vo.b + kMaxModes, 0.0); std::fill(vo.y1, vo.y1 + kMaxModes, 0.0); std::fill(vo.y2, vo.y2 + kMaxModes, 0.0);
    vo.on = true; vo.snd = snd; vo.vel = vel; vo.pan = pan; vo.pitch = pitch; vo.sub = sub; vo.track = track; vo.key = key; vo.age = 0; vo.gateLeft = gate; vo.lvl = lvl; vo.decMul = decMul; vo.released = false; vo.relEnv = 1;
    vo.exLp = 0; vo.bandHi1 = vo.bandLo1 = vo.bandHi2 = vo.bandLo2 = 0; vo.bEnv = 0; vo.oPh = 0; vo.oLpS = 0; vo.sqPh = 0; vo.sqDrift = 0; vo.sqAm = 0; vo.sqLp = 0; vo.vibPh = 0; vo.lfoPh = 0; vo.altPh = 0; vo.amPh = 0; ++hits;
    if (track >= 0 && track < kTracks) flash[track] = 1;
    int mat = (int)clampd(jr(v[Material]), 0, 5); double size = v[Size] * 0.01, fMul = std::pow(2.0, -size * 1.2), dMul = std::pow(2.0, size * 0.8), dmg = clampd(v[Damage] * 0.01 + MATDMG[mat], 0, 1);
    vo.nm = 0; double fmax = 0.45 * sr_;
    for (int k = 0; k < d.nm; ++k) {
      double rb = rng.bi();
      double f = d.f0 * pitch * d.r[k] * fMul * (1 + dmg * 0.03 * rb); if (f > fmax || f < 15) continue;
      double T = clampd(d.T0 * MATDEC[mat] * decMul * dMul / (1 + d.tilt * MATTILT[mat] * (d.r[k] - 1) * 0.35) * (1 - 0.5 * dmg), 0.004, 20), r = std::exp(-6.9078 / (T * sr_)), w = 6.2831853 * f / sr_;
      int i = vo.nm++; vo.c1[i] = 2 * r * std::cos(w); vo.c2[i] = -r * r; vo.b[i] = std::sin(w) * d.a[k];
    }
    double fcEx = 500 + d.hard * d.hard * 15000 * MATHARD[mat]; vo.exA = std::exp(-6.2831853 * std::min(fcEx, 0.45 * sr_) / sr_);
    vo.damageNoise = dmg * 0.35; vo.quiet = 0; vo.loopT = tr(d.loopMs * 0.001 * sr_); vo.vibPh = rng.uni(); vo.amPh = rng.uni(); vo.sqPh = rng.uni();
    if (!sub && d.rep > 0) {
      double t = 0, vv = vel, dt = d.repMs;
      for (int i = 0; i < (int)d.rep; ++i) {
        double r1 = rng.bi(); t += dt * (1 + d.repJit * 0.6 * r1); vv *= d.repV; dt *= d.repRatio; if (vv < 0.02) break;
        double r2 = rng.bi(); schedule(tr(t * 0.001 * sr_), snd, vv, pitch * (1 + d.repSpread * 0.5 * r2), pan, 0, track, -1, true, lvl, decMul);
      }
    }
  }
  void noteOn(int note, double vel) override {
    if (jr(v[PlayMode]) == 1) return;
    double tune = std::pow(2.0, noteTune / 1200);
    if (note >= 36 && note < 36 + kTracks) { int t = note - 36; triggerTrack(t, std::max(0.05, vel), 0, GATE_HELD, tune); for (auto& x : voices) if (x.on && x.track == t && x.key < 0 && x.gateLeft == GATE_HELD) x.key = note; }
    else if (note >= 48 && note <= 83) schedule(0, (int)jr(v[KeySound]), std::max(0.05, vel), std::pow(2.0, (note - 60) / 12.0) * tune, 0, GATE_HELD, -1, note, false, 1, 1);
  }
  void noteOff(int note) override { for (auto& x : voices) if (x.on && x.key == note && x.gateLeft > 0) x.gateLeft = 0; for (auto& p : pend) if (p.on && p.key == note) p.gate = 0; }
  void triggerTrack(int t, double vel, double delay, double gate, double pitchMul) {
    int snd = (int)jr(v[trackParam(t, TSound)]); double tune = std::pow(2.0, v[trackParam(t, TTune)] / 12), decMul = std::pow(2.0, v[trackParam(t, TDecay)] / 50), lvl = std::pow(10.0, v[trackParam(t, TLevel)] / 20), pan = v[trackParam(t, TPan)] * 0.01;
    schedule(delay, snd, vel, tune * pitchMul, pan, gate, t, -1, false, lvl, decMul);
  }
  void fireStep(int step, double stepSamples) {
    stepNow = step; double hum = v[Humanize] * 0.01, worn = v[Worn] * 0.01, swing = v[Swing] * 0.01, over = v[Overheat] * 0.01, prob = v[Probability] * 0.01;
    if (over > 0) { double u = rng.uni(); heat = std::min(1.0, heat + 0.012 + 0.01 * u); } else heat = std::max(0.0, heat - 0.05);
    if (rng.uni() < 0.04) heat *= 0.6;
    double gateBase = tr(stepSamples * v[Gate] * 0.01), swingDelay = (step & 1) ? tr(swing * 0.5 * stepSamples) : 0;
    for (int t = 0; t < kTracks; ++t) {
      int cell = (int)jr(v[cellParam(t, step)]); if (cell <= 0 || v[trackParam(t, TMute)] > 0.5) continue;
      if (rng.uni() > prob) continue;
      int mult = 1; if (over > 0 && rng.uni() < heat * over * 0.5) { if (rng.uni() < 0.5) continue; mult = 2; }
      { double rb = rng.bi(); drift[t] = clampd(drift[t] * 0.97 + rb * worn * 0.0006 * sr, 0, worn * 0.02 * sr); }
      int hitsN = cell >= 4 ? cell - 2 : 1; double base = cell == 1 ? 0.32 : (cell == 3 ? 1 : (cell >= 4 ? 0.78 : 0.65));
      for (int h = 0; h < hitsN * mult; ++h) {
        double spacing = tr(stepSamples / std::max(1, hitsN * mult)); double rb1 = rng.bi(), rb2 = rng.bi();
        double vel = clampd(base * (1 - 0.06 * h) * (1 + hum * 0.25 * rb1 + worn * 0.2 * rb2), 0.05, 1);
        double rb3 = rng.bi();
        double delay = swingDelay + h * spacing + tr(std::fabs(rb3) * hum * 0.015 * sr) + tr(drift[t]);
        triggerTrack(t, vel, delay, std::max(40.0, (h == 0 && hitsN * mult == 1 ? gateBase : tr(spacing * v[Gate] * 0.01))), 1);
      }
    }
  }
  void process(float* outL, float* outR, int n) override {
    double sr_ = sr; int steps = (int)clampd(jr(v[Steps]), 1, kSteps); double stepQ = RATEQ[(int)clampd(jr(v[Rate]), 0, 5)];
    bool running = jr(v[PlayMode]) != 2 && v[Run] > 0.5; double bpm = std::max(20.0, v[Bpm]), stepSamples = stepQ * 60 / bpm * sr_, stepInc = 1 / stepSamples;
    if (running && !wasRunning) { stepPhase = 1; lastStep = -1; } if (!running && wasRunning) stepNow = -1; wasRunning = running;
    double vol = std::pow(10.0, v[Volume] / 20), drive = v[Drive] * 0.01, pre = 1 + drive * 7, post = 1 / (1 + drive * 1.8); bool toneOn = std::fabs(v[Tone]) > 0.5;
    for (int i = 0; i < n; ++i) {
      if (running) { stepPhase += stepInc; if (stepPhase >= 1) { stepPhase -= 1; ++lastStep; if (lastStep < 0) lastStep = 0; fireStep((int)(lastStep % steps), tr(stepSamples)); } }
      if (pendN > 0) for (int q = 0; q < kPend; ++q) { if (pend[q].on && --pend[q].t <= 0) { Pend p = pend[q]; pend[q].on = false; --pendN; startVoice(p.snd, p.vel, p.pitch, p.pan, p.gate, p.track, p.key, p.sub, p.lvl, p.decMul); } }
      double l = 0, r = 0;
      for (int q = 0; q < kVoices; ++q) {
        Voice& vo = voices[q];
        if (vo.on) { double o = renderVoice(vo); double m = o * vo.vel * vo.lvl * NORM[vo.snd], pn = clampd(vo.pan, -1, 1), a = (pn + 1) * 0.7853982; l += m * std::cos(a) * 1.4142; r += m * std::sin(a) * 1.4142; }
      }
      l = std::tanh(l * pre) * post * vol; r = std::tanh(r * pre) * post * vol;
      if (toneOn) { l = tone[0].run(l); r = tone[1].run(r); }
      if (!(std::fabs(l) < 64 && std::fabs(r) < 64)) { l = r = 0; ++nonFinite; }
      outL[i] = (float)l; outR[i] = (float)r;
    }
    double fd = std::pow(0.5, n / sr_ * 8); for (int t = 0; t < kTracks; ++t) flash[t] *= fd;
  }
  double renderVoice(Voice& v) {
    const Sound& d = SOUNDS[v.snd]; const DD& c = dd[v.snd]; double srf = sr; bool sub = v.sub; const double TP = 6.2831853;
    if (v.gateLeft > 0 && v.gateLeft < GATE_LIM) --v.gateLeft;
    bool held = v.gateLeft > 0 || !d.sustain || sub; if (!held && !v.released) v.released = true;
    if (v.released && d.sustain) v.relEnv *= c.relK;
    double ageS = v.age / srf, o = 0, feedIn = 0;
    if (!sub && d.oType > 0) {
      double u = d.oSweepMs > 0 ? std::min(1.0, ageS * 1000 / d.oSweepMs) : 1; double mult = d.oS0 + (d.oS1 - d.oS0) * u;
      if (d.oLfo > 0) { v.lfoPh += d.oLfoHz / srf; mult *= 1 + d.oLfo * std::sin(TP * v.lfoPh); }
      if (d.oVib > 0) { v.vibPh += d.oVibHz / srf; mult *= 1 + d.oVib * std::sin(TP * v.vibPh); }
      if (d.oAltHz > 0) { v.altPh += d.oAltHz / srf; if (std::sin(TP * v.altPh) < 0) mult *= d.oAlt; }
      double f = d.oF * v.pitch * mult; v.oPh += f / srf; v.oPh -= std::floor(v.oPh);
      double w = d.oType == 1 ? 2 * v.oPh - 1 : (d.oType == 2 ? (v.oPh < 0.5 ? 1 : -1) : (d.oType == 3 ? std::sin(TP * v.oPh) : (v.oPh < 0.25 ? 1 : -1)));
      v.oLpS += (w - v.oLpS) * c.oLpK; w = v.oLpS;
      double env = d.oDecMs > 0 ? std::exp(-ageS * 1000 / d.oDecMs) : std::min(1.0, ageS * 1000 / std::max(1.0, d.oAtk)) * v.relEnv;
      double ov = w * env * d.oLvl; o += ov; feedIn += ov;
    }
    if (!sub && d.sLvl > 0) {
      double nz = rng.bi(); v.bandHi2 = c.sA1 * v.bandHi2 + (1 - c.sA1) * nz; v.bandLo2 = c.sA2 * v.bandLo2 + (1 - c.sA2) * nz; double band = (v.bandHi2 - v.bandLo2) * 3;
      v.amPh += d.sAmHz / srf; v.amPh -= std::floor(v.amPh); double am = d.sAmHz > 0 ? 1 - d.sAmDepth * (0.5 + 0.5 * std::sin(TP * v.amPh)) : 1;
      double sv = band * d.sLvl * am * std::min(1.0, ageS * 200) * v.relEnv; o += sv; feedIn += sv;
    }
    if (!sub && d.qLvl > 0) {
      double rb = rng.bi(); v.sqLp += (rb - v.sqLp) * c.qK; double target = clampd(v.sqLp * 2.4 + 0.55, 0, 1); v.sqAm += (target - v.sqAm) * 0.01;
      v.sqPh += d.qF * v.pitch * (1 + v.sqLp * d.qDrift * 3) / srf; v.sqPh -= std::floor(v.sqPh); double w = 2 * v.sqPh - 1; v.sqDrift += (w - v.sqDrift) * 0.35;
      double qv = v.sqDrift * v.sqAm * d.qLvl * std::min(1.0, ageS * 80) * v.relEnv; o += qv; feedIn += qv;
    }
    if (d.bLvl > 0 && d.bDec > 0) {
      double att = c.bAtt; if (v.age < tr(att)) v.bEnv = (v.age + 1) / att; else v.bEnv = std::exp(-(ageS - att / srf) * 1000 / d.bDec);
      if (v.bEnv > 1e-4) { double nz = rng.bi(); v.bandHi1 = c.bA1 * v.bandHi1 + (1 - c.bA1) * nz; v.bandLo1 = c.bA2 * v.bandLo1 + (1 - c.bA2) * nz; o += (v.bandHi1 - v.bandLo1) * 3 * v.bEnv * d.bLvl; }
    }
    if (v.nm > 0) {
      double x = 0; if (v.age == 0) x += d.imp; if (v.age < tr(0.004 * srf)) { double rb = rng.bi(); x += rb * d.excNoise * (1 - v.age / (0.004 * srf)); } x += feedIn * d.oFeed * 0.5;
      v.exLp = v.exA * v.exLp + (1 - v.exA) * x; double xin = v.exLp * 3, s = 0; int nm = v.nm; double *b = v.b, *c1 = v.c1, *c2 = v.c2, *y1 = v.y1, *y2 = v.y2;
      for (int k = 0; k < nm; ++k) { double y = b[k] * xin + c1[k] * y1[k] + c2[k] * y2[k]; y2[k] = y1[k]; y1[k] = y; s += y; }
      o += s;
    }
    if (v.damageNoise > 0.001) { v.damageNoise *= std::exp(-1 / (0.09 * srf)); double rb = rng.bi(); o += rb * v.damageNoise * 0.3; }
    if (!sub && d.loopMs > 0 && v.gateLeft > 0) {
      if (--v.loopT <= 0) {
        double j = rng.bi(); v.loopT = std::max(8.0, tr(d.loopMs * 0.001 * srf * (1 + d.loopJit * 0.7 * j)));
        double u = rng.uni(), sp = rng.bi();
        schedule(0, v.snd, v.vel * d.loopV * (0.5 + 0.5 * u), v.pitch * (1 + d.loopSpread * 0.5 * sp), v.pan, 0, v.track, -1, true, v.lvl, v.decMul);
      }
    }
    ++v.age;
    if (std::fabs(o) < 1e-5 && (v.released || !d.sustain)) { if (++v.quiet > 4800) v.on = false; } else v.quiet = 0;
    if (v.age > tr(14 * srf)) v.on = false;
    if (d.sustain && v.released && v.relEnv < 1e-3 && v.quiet > 2400) v.on = false;
    return o;
  }
};
inline Info info() {
  return Info{"industrica", "Industrica", "Metal and machine sounds with a pattern sequencer: 37 modelled sounds (struck metal, drops, clicks, friction, machines). Keys C1 to G1 (36 to 43) play the eight tracks, keys 48 to 83 play the Key sound up the keyboard. Press Run to start the 16-step pattern on the built-in clock (Tempo, Rate, Steps, Swing); choosing a Preset loads a pattern and kit and starts it. Click each step to set off, ghost, normal, accent or a x2 to x4 ratchet.",
              makeSpecs(), makeGroups(), Theme{"industrica", 0xff24272b, 0xff0a0b0d, 0xffe0902c, 0xffe8e3d6, 0xffffb347}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::industrica
