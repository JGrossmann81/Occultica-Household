// Pipica: pipe organ (table-lookup pipes in four families, wind sag, tremulant, chiff, swell box, couplers, old tunings, 22 rooms, theatre traps, barrel organ).
#pragma once
#include "../common/engine.h"
#include <cstring>
#include <cstdlib>
#include <map>
#include <mutex>
namespace occ { namespace pipica {
constexpr int kTab = 2048, kBands = 20, kMaxHarm = 64, kVoices = 56, kDivs = 3, kStopsPer = 8, kPlaces = 22, kRegs = 16, kTypes = 5;
enum { Church, Theatre, Chamber, Positive, Barrel };
enum { Great, Swell, Pedal };
enum { F_Principal, F_Flute, F_String, F_Reed };
enum { R_Principal, R_Octave, R_Diapason, R_Hohl, R_Gedackt, R_Rohr, R_Tibia, R_Spitz, R_OpenFlute, R_Nasard, R_Salicional, R_Gamba, R_Violin, R_Trumpet, R_Tuba, R_Oboe, R_Clarinet, R_Regal, R_Vox, R_Kinura, R_Count };
enum { P_None, P_Xylophone, P_Glock, P_Chimes, P_BassDrum, P_Zimbel };
enum { Preset, Type, Place, RoomMix, Size, DecayTrim, KeyMode, Split, StopBase, CplSwGt = StopBase + kDivs * kStopsPer, CplGtPed, CplSwPed, CplSuper, CplSub, SwellBox, TremDepth, TremRate, WindSag, WindFlutter, WindNoise, Chiff, Bright, Detune, Temper, A4, Release, Volume, LevelG, LevelS, LevelP, Traps, TrapLevel, BarrelTune, BarrelPlay, Crank, Wobble, TrapKeys, Count };
enum { M_Scale, M_Width, M_Depth, M_Height, M_Roof, M_Curve, M_Topology, M_OpenL, M_OpenR, M_OpenFront, M_OpenBack, M_OpenFloor, M_OpenCeil, M_Material, M_Damping, M_Warmth, M_Diffusion, M_Speed, M_SrcX, M_SrcY, M_ListX, M_ListY, M_Orbit, M_OrbitR, M_Breathe, M_BreatheRate, M_Quake, M_Inertia, M_Order, M_EarlyLate, M_Freeze, M_Spread, M_Mix, M_Count };
inline int stopId(int d, int i) { return StopBase + d * kStopsPer + i; }
inline int rnd(double x) { return (int)std::floor(x + 0.5); }
inline int ci(double x, int lo, int hi) { return (int)clampd(x, lo, hi); }

inline int recipeFamily(int r) {
  switch (r) { case R_Principal: case R_Octave: case R_Diapason: return F_Principal; case R_Salicional: case R_Gamba: case R_Violin: return F_String;
    case R_Trumpet: case R_Tuba: case R_Oboe: case R_Clarinet: case R_Regal: case R_Vox: case R_Kinura: return F_Reed; default: return F_Flute; }
}
inline double formant(double hz, double fc, double bw, double g) { double x = (hz - fc) / bw; return 1 + g * std::exp(-x * x); }
inline double harmonicAmp(int recipe, int k, double f0) {
  const double K = k, hz = k * f0; const double odd = (k & 1) ? 1 : 0;
  auto pw = [](double a, double b) { return std::pow(a, b); }; auto ex = [](double a) { return std::exp(a); };
  switch (recipe) {
    case R_Principal: return pw(K, -1.05) * ex(-K / 14) * (k == 2 ? 1.15 : 1);
    case R_Octave: return pw(K, -0.85) * ex(-K / 20);
    case R_Diapason: return pw(K, -1.1) * ex(-K / 9) * (k < 4 ? 1.4 : 1);
    case R_Hohl: return pw(K, -1.6) * ex(-K / 5) * (odd ? 1.2 : 1);
    case R_Gedackt: return pw(K, -1.3) * ex(-K / 9) * (odd ? 1 : 0.03);
    case R_Rohr: return pw(K, -1.3) * ex(-K / 11) * (odd ? 1 : 0.05) * (1 + 1.2 * ex(-pw((K - 5) / 1.5, 2)));
    case R_Tibia: return k == 1 ? 1 : (k == 2 ? 0.16 : (k == 3 ? 0.30 : pw(K, -2.1) * ex(-K / 6)));
    case R_Spitz: return pw(K, -1.2) * ex(-K / 10);
    case R_OpenFlute: return pw(K, -2.0) * ex(-K / 6);
    case R_Nasard: return pw(K, -1.2) * ex(-K / 12) * (odd ? 1 : 0.25) * (1 + 0.8 * ex(-pw((K - 3) / 1.2, 2)));
    case R_Salicional: return pw(K, -0.7) * ex(-K / 16) * (1 + 1.5 * ex(-pw((K - 7) / 3, 2)));
    case R_Gamba: return pw(K, -0.55) * ex(-K / 22) * (1 + 2.0 * ex(-pw((K - 9) / 4, 2)));
    case R_Violin: return pw(K, -0.45) * ex(-K / 26) * (1 + 2.5 * ex(-pw((K - 11) / 3, 2)));
    case R_Trumpet: return pw(K, -0.3) * ex(-K / 30) * formant(hz, 1700, 900, 2.5);
    case R_Tuba: return pw(K, -0.3) * ex(-K / 20) * formant(hz, 500, 350, 2.5);
    case R_Oboe: return pw(K, -0.45) * ex(-K / 24) * formant(hz, 1100, 300, 3.0);
    case R_Clarinet: return pw(K, -0.8) * ex(-K / 20) * (odd ? 1 : 0.05) * formant(hz, 1600, 500, 0.8);
    case R_Regal: return pw(K, -0.4) * ex(-K / 32) * formant(hz, 2500, 700, 1.5);
    case R_Vox: return pw(K, -0.8) * ex(-K / 18) * (formant(hz, 800, 180, 3.0) + 0.5 * formant(hz, 1250, 200, 1.5));
    case R_Kinura: return pw(K, -0.3) * ex(-K / 40) * formant(hz, 2800, 900, 2.0);
  }
  return 0;
}
// ---- stops
struct Comp { double ratio, amp, cents; };
struct StopDef { const char* name; int recipe, ncomp; Comp comp[5]; double level, attack, release, chiff; int perc; };
inline StopDef S1(const char* name, int recipe, double ratio, double level, double attack, double release, double chiff) { StopDef d{}; d.name = name; d.recipe = recipe; d.ncomp = 1; d.comp[0] = {ratio, 1, 0}; d.level = level; d.attack = attack; d.release = release; d.chiff = chiff; d.perc = 0; return d; }
inline StopDef SC(const char* name, int recipe, double ratio, double level, double attack, double release, double chiff) { StopDef d{}; d.name = name; d.recipe = recipe; d.ncomp = 2; d.comp[0] = {ratio, 0.8, -4}; d.comp[1] = {ratio, 0.8, 4}; d.level = level; d.attack = attack; d.release = release; d.chiff = chiff; d.perc = 0; return d; }
inline StopDef SM(const char* name, int recipe, std::vector<double> ratios, double level, double attack, double release, double chiff) {
  StopDef d{}; d.name = name; d.recipe = recipe; d.ncomp = 0; for (double x : ratios) if (d.ncomp < 5) { d.comp[d.ncomp++] = {x, 1.0 / (double)ratios.size() * 1.6, 0}; }
  d.level = level; d.attack = attack; d.release = release; d.chiff = chiff; d.perc = 0; return d;
}
inline StopDef SP(const char* name, int kind, double level) { StopDef d{}; d.name = name; d.recipe = R_Principal; d.ncomp = 1; d.comp[0] = {1, 1, 0}; d.level = level; d.attack = 0; d.release = 0.08; d.chiff = 0; d.perc = kind; return d; }
struct StopTables {
  StopDef t[kTypes][kDivs][kStopsPer];
  StopTables() {
    std::vector<StopDef> T[kTypes][kDivs];
    T[Church][Great] = {S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.04, 0.08, 0.3), S1("Principal 8'", R_Principal, 1, 1, 0.025, 0.09, 0.2), S1("Hohlfl\xc3\xb6te 8'", R_Hohl, 1, 0.9, 0.035, 0.08, 0.5),
      S1("Gamba 8'", R_Gamba, 1, 0.7, 0.09, 0.10, 0.25), S1("Octave 4'", R_Octave, 2, 0.8, 0.02, 0.07, 0.2), S1("Rohrfl\xc3\xb6te 4'", R_Rohr, 2, 0.7, 0.035, 0.07, 0.4),
      SM("Mixture IV", R_Octave, {3, 4, 5, 6}, 0.55, 0.02, 0.06, 0.1), S1("Trumpet 8'", R_Trumpet, 1, 0.8, 0.012, 0.06, 0)};
    T[Church][Swell] = {S1("Stopped Diapason 8'", R_Gedackt, 1, 0.9, 0.04, 0.08, 0.3), S1("Salicional 8'", R_Salicional, 1, 0.7, 0.09, 0.10, 0.2), SC("Voix C\xc3\xa9leste 8'", R_Salicional, 1, 0.6, 0.10, 0.10, 0.2),
      S1("Fl\xc3\xbbte Octaviante 4'", R_OpenFlute, 2, 0.8, 0.04, 0.07, 0.5), S1("Nazard 2 2/3'", R_Nasard, 3, 0.6, 0.04, 0.07, 0.3), S1("Oboe 8'", R_Oboe, 1, 0.75, 0.02, 0.07, 0),
      S1("Trompette 8'", R_Trumpet, 1, 0.8, 0.012, 0.06, 0), S1("Vox Humana 8'", R_Vox, 1, 0.6, 0.03, 0.08, 0)};
    T[Church][Pedal] = {S1("Contra Bourdon 32'", R_Gedackt, 0.25, 0.8, 0.07, 0.10, 0.1), S1("Open Wood 16'", R_Principal, 0.5, 1, 0.04, 0.09, 0.2), S1("Subbass 16'", R_Gedackt, 0.5, 0.9, 0.05, 0.09, 0.2),
      S1("Octave 8'", R_Principal, 1, 0.9, 0.03, 0.08, 0.2), S1("Bass Flute 8'", R_Hohl, 1, 0.8, 0.04, 0.08, 0.4), S1("Choral Bass 4'", R_Octave, 2, 0.8, 0.02, 0.07, 0.2),
      S1("Posaune 16'", R_Tuba, 0.5, 0.8, 0.02, 0.07, 0), S1("Trumpet 8'", R_Trumpet, 1, 0.7, 0.012, 0.06, 0)};
    T[Theatre][Great] = {S1("Tibia Clausa 8'", R_Tibia, 1, 1, 0.03, 0.08, 0.5), S1("Tibia 4'", R_Tibia, 2, 0.8, 0.03, 0.07, 0.5), S1("Diaphonic Diapason 8'", R_Diapason, 1, 1, 0.03, 0.09, 0.2),
      S1("Kinura 8'", R_Kinura, 1, 0.6, 0.012, 0.06, 0), S1("Tuba Mirabilis 8'", R_Tuba, 1, 0.9, 0.012, 0.07, 0), S1("Orchestral Oboe 8'", R_Oboe, 1, 0.75, 0.02, 0.07, 0),
      S1("Vox Humana 8'", R_Vox, 1, 0.65, 0.03, 0.08, 0), SP("Xylophone", P_Xylophone, 0.9)};
    T[Theatre][Swell] = {S1("Concert Flute 8'", R_OpenFlute, 1, 0.9, 0.04, 0.08, 0.5), S1("Violin 8'", R_Violin, 1, 0.65, 0.08, 0.10, 0.2), SC("Viol Celeste 8'", R_Violin, 1, 0.55, 0.09, 0.10, 0.2),
      S1("Clarinet 8'", R_Clarinet, 1, 0.75, 0.02, 0.07, 0), S1("Dulciana 8'", R_Salicional, 1, 0.6, 0.07, 0.09, 0.2), S1("Quintadena 8'", R_Rohr, 1, 0.7, 0.035, 0.07, 0.4),
      SP("Glockenspiel", P_Glock, 0.8), SP("Chimes", P_Chimes, 0.8)};
    T[Theatre][Pedal] = {S1("Tibia 16'", R_Tibia, 0.5, 1, 0.05, 0.09, 0.3), S1("Diaphone 16'", R_Diapason, 0.5, 1, 0.03, 0.09, 0.2), S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.05, 0.09, 0.2),
      S1("Cello 8'", R_Violin, 1, 0.7, 0.07, 0.10, 0.2), S1("Flute 8'", R_OpenFlute, 1, 0.8, 0.04, 0.08, 0.4), S1("Tuba 16'", R_Tuba, 0.5, 0.8, 0.02, 0.07, 0),
      S1("Tibia 8'", R_Tibia, 1, 0.9, 0.04, 0.08, 0.4), SP("Bass Drum", P_BassDrum, 0.9)};
    T[Chamber][Great] = {S1("Holzgedackt 8'", R_Gedackt, 1, 1, 0.04, 0.08, 0.4), S1("Rohrfl\xc3\xb6te 4'", R_Rohr, 2, 0.8, 0.035, 0.07, 0.4), S1("Principal 4'", R_Principal, 2, 0.9, 0.025, 0.07, 0.2),
      S1("Octave 2'", R_Octave, 4, 0.7, 0.02, 0.06, 0.2), S1("Quinte 1 1/3'", R_Nasard, 6, 0.5, 0.03, 0.06, 0.3), SM("Sesquialtera II", R_Nasard, {3, 5}, 0.55, 0.03, 0.06, 0.3),
      S1("Siffl\xc3\xb6te 1'", R_OpenFlute, 8, 0.45, 0.03, 0.06, 0.4), S1("Dulzian 8'", R_Regal, 1, 0.65, 0.015, 0.06, 0)};
    T[Positive][Great] = {S1("Gedackt 8'", R_Gedackt, 1, 1, 0.04, 0.08, 0.5), S1("Spitzfl\xc3\xb6te 4'", R_Spitz, 2, 0.8, 0.035, 0.07, 0.4), S1("Principal 4'", R_Principal, 2, 0.9, 0.025, 0.07, 0.3),
      S1("Nasat 2 2/3'", R_Nasard, 3, 0.6, 0.03, 0.06, 0.3), S1("Octave 2'", R_Octave, 4, 0.7, 0.02, 0.06, 0.2), S1("Terz 1 3/5'", R_Nasard, 5, 0.5, 0.03, 0.06, 0.3),
      S1("Regal 8'", R_Regal, 1, 0.7, 0.012, 0.05, 0), SP("Zimbelstern", P_Zimbel, 0.6)};
    T[Barrel][Great] = {S1("Flute 8'", R_OpenFlute, 1, 1, 0.03, 0.06, 0.5), S1("Stopped 8'", R_Gedackt, 1, 0.9, 0.035, 0.06, 0.4), S1("Principal 4'", R_Principal, 2, 0.8, 0.02, 0.06, 0.3),
      S1("Piccolo 2'", R_OpenFlute, 4, 0.6, 0.02, 0.05, 0.5), S1("Flute 4'", R_Hohl, 2, 0.7, 0.03, 0.06, 0.5), S1("Regal 8'", R_Regal, 1, 0.6, 0.012, 0.05, 0),
      S1("Trumpet 8'", R_Trumpet, 1, 0.65, 0.012, 0.05, 0), S1("Bourdon 16'", R_Gedackt, 0.5, 0.7, 0.04, 0.07, 0.3)};
    T[Barrel][Pedal] = {S1("Bourdon 16'", R_Gedackt, 0.5, 0.9, 0.04, 0.08, 0.3), S1("Stopped Bass 8'", R_Gedackt, 1, 0.9, 0.04, 0.07, 0.3)};
    StopDef none = S1("-", R_Principal, 1, 0, 0.02, 0.05, 0);
    for (int a = 0; a < kTypes; ++a) for (int d = 0; d < kDivs; ++d) { while ((int)T[a][d].size() < kStopsPer) T[a][d].push_back(none); for (int i = 0; i < kStopsPer; ++i) t[a][d][i] = T[a][d][i]; }
  }
};
inline const StopTables& tables() { static const StopTables s; return s; }
static const int STOPCOUNT[5][3] = {{8, 8, 8}, {8, 8, 8}, {8, 0, 0}, {8, 0, 0}, {8, 0, 2}};
inline int stopCount(int type, int d) { return STOPCOUNT[ci(type, 0, kTypes - 1)][ci(d, 0, kDivs - 1)]; }
inline const StopDef& stopDef(int type, int d, int i) { return tables().t[ci(type, 0, kTypes - 1)][ci(d, 0, kDivs - 1)][ci(i, 0, kStopsPer - 1)]; }
static const char* TYPENAMES[5] = {"Church / Classical", "Theatre / Cinema", "Chamber", "Positive", "Barrel"};
static const char* TEMPNAMES[4] = {"Equal", "Werckmeister III", "Valotti", "Quarter-comma meantone"};
static const double TEMPS[4][12] = {{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
  {0, -9.775, -7.82, -5.865, -9.775, -1.955, -11.73, -3.91, -7.82, -11.73, -3.91, -7.82},
  {0, -5.865, -3.91, -1.955, -7.82, 1.955, -7.82, -1.955, -3.91, -5.865, 0, -5.865},
  {0, -23.95, -6.843, 10.265, -13.686, 3.421, -20.53, -3.422, -27.373, -10.265, 6.843, -17.108}};
struct PlaceRow { const char* name; double w, l, h, roof, mat, rt, warm, diff, sx, sy, lx, ly, oc; };
static const PlaceRow PLACES[kPlaces] = {
  {"Dry (no room)", 6, 8, 3, 0, 2, 0.5, 1.0, 65, 50, 30, 50, 50, 0}, {"Notre-Dame de Paris", 40, 120, 33, 1, 0, 6.5, 1.0, 85, 50, 10, 50, 55, 0},
  {"Cologne Cathedral", 45, 140, 43, 1, 0, 9.0, 1.1, 85, 50, 8, 50, 55, 0}, {"St. Peter's Basilica, Rome", 60, 180, 60, 2, 0, 9.5, 1.1, 80, 50, 15, 50, 60, 0},
  {"Hagia Sophia, Istanbul", 70, 80, 55, 2, 0, 10.5, 1.2, 80, 50, 25, 50, 60, 0}, {"St Paul's Cathedral, London", 50, 150, 65, 2, 0, 8.0, 1.0, 80, 50, 12, 50, 55, 0},
  {"Westminster Abbey", 35, 150, 31, 1, 0, 5.8, 0.9, 80, 50, 10, 50, 55, 0}, {"King's College Chapel", 12, 88, 24, 1, 0, 6.5, 1.0, 80, 50, 12, 50, 55, 0},
  {"Sainte-Chapelle, Paris", 17, 36, 20, 1, 4, 3.2, 0.8, 85, 50, 12, 50, 65, 0}, {"Sagrada Fam\xc3\xadlia, Barcelona", 45, 90, 45, 1, 1, 7.0, 1.0, 85, 50, 10, 50, 55, 0},
  {"Grace Cathedral, San Francisco", 35, 100, 28, 1, 1, 4.8, 1.0, 85, 50, 10, 50, 55, 0}, {"Mormon Tabernacle, Salt Lake City", 46, 76, 20, 2, 3, 4.5, 0.9, 80, 50, 20, 50, 60, 0},
  {"Thomaskirche, Leipzig", 25, 55, 18, 1, 2, 4.0, 0.9, 80, 50, 12, 50, 55, 0}, {"Stephansdom, Vienna", 34, 100, 28, 1, 0, 8.5, 1.0, 85, 50, 10, 50, 55, 0},
  {"Duomo di Milano", 90, 150, 45, 1, 0, 10.0, 1.1, 85, 50, 15, 50, 60, 0}, {"Pantheon, Rome", 43, 43, 43, 2, 0, 7.0, 1.0, 70, 50, 20, 50, 60, 4},
  {"Village stone church", 9, 22, 9, 1, 0, 2.6, 0.9, 85, 50, 12, 50, 60, 0}, {"Stone chapel", 6, 14, 7, 1, 0, 2.0, 0.9, 80, 50, 15, 50, 55, 0},
  {"Home parlour", 5, 6.5, 2.8, 0, 2, 0.6, 0.9, 20, 20, 60, 70, 70, 0}, {"Cinema palace", 30, 40, 14, 0, 7, 1.6, 0.8, 50, 8, 50, 55, 85, 0},
  {"Castle hall", 10, 24, 9, 0, 3, 2.2, 0.9, 50, 10, 50, 60, 85, 0}, {"Fairground (open air)", 18, 22, 9, 0, 5, 0.8, 0.8, 50, 20, 50, 60, 85, 45}};
struct TuneRow { const char* name; double tempo; const char* mel; const char* bass; };
static const TuneRow TUNES[4] = {
  {"Ode to Joy", 104, "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2", "C3:4 G2:4 C3:4 G2:4 C3:4 G2:4 C3:4 G2:2 C3:2"},
  {"Greensleeves", 96, "A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:2 A3:1 A3:1.5 G#3:.5 A3:1 B3:2 G#3:1 E3:2 A3:1 C4:2 D4:1 E4:1.5 F4:.5 E4:1 D4:2 B3:1 G3:1.5 A3:.5 B3:1 C4:1.5 B3:.5 A3:1 G#3:1.5 F#3:.5 G#3:1 A3:3",
   "A2:3 A2:3 C3:3 G2:3 G2:3 C3:3 A2:3 E2:3 A2:3 A2:3 C3:3 G2:3 E2:3 A2:3 E2:3 A2:3"},
  {"Silent Night", 66, "G4:1.5 A4:.5 G4:1 E4:3 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 B4:3 C5:2 C5:1 G4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 A4:2 A4:1 C5:1.5 B4:.5 A4:1 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 F5:1.5 D5:.5 B4:1 C5:3 E5:3 C5:1 G4:1 E4:1 G4:1.5 F4:.5 D4:1 C4:3",
   "C3:3 C3:3 C3:3 C3:3 F3:3 C3:3 F3:3 C3:3 G2:3 G2:3 C3:3 C3:3 F3:3 C3:3 F3:3 C3:3 G2:3 D3:3 C3:3 C3:3"},
  {"Amazing Grace", 72, "D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 D5:3 B4:3 D5:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 A4:2 G4:1 G4:3",
   "G2:3 G2:3 G2:3 C3:3 G2:3 G2:3 D3:3 G2:3 G2:3 G2:3 C3:3 G2:3 D3:3 G2:3 G2:3"}};
struct RegRow { const char* name; int type, place, stops[3], cpl, temper; double a4; int trem, traps, barrelTune; };
static const RegRow REGS[kRegs] = {
  {"Init - Principal 8'", Church, 1, {0x02, 0x00, 0x00}, 0, 0, 440, 0, 0, 0}, {"Toccata - full organ (Notre-Dame)", Church, 1, {0xD3, 0x7F, 0x4B}, 0x03, 0, 440, 0, 0, 0},
  {"Quiet communion (Sainte-Chapelle)", Church, 8, {0x04, 0x03, 0x04}, 0x01, 0, 440, 0, 0, 0}, {"Bach plenum (Thomaskirche)", Church, 12, {0x72, 0x00, 0x2A}, 0x02, 1, 415, 0, 0, 0},
  {"Celestial strings (Hagia Sophia)", Church, 4, {0x08, 0x07, 0x04}, 0x01, 0, 440, 0, 0, 0}, {"Dome festival (St. Peter's)", Church, 3, {0xF3, 0xDB, 0x4F}, 0x07, 0, 440, 0, 0, 0},
  {"Voix humaine (Westminster Abbey)", Church, 6, {0x01, 0xA1, 0x04}, 0, 2, 440, 1, 0, 0}, {"Hymn on the hill (Grace Cathedral)", Church, 10, {0x16, 0x0B, 0x0C}, 0x03, 0, 440, 0, 0, 0},
  {"Tabernacle hymn (Salt Lake)", Church, 11, {0x96, 0x4B, 0x0E}, 0x03, 0, 440, 0, 0, 0}, {"Silent-film palace (Tibia & Vox)", Theatre, 19, {0x43, 0x0F, 0x41}, 0x03, 0, 440, 2, 1, 0},
  {"Kinura & Tuba (cinema)", Theatre, 19, {0x1D, 0x0A, 0x25}, 0x01, 0, 440, 2, 1, 0}, {"Chamber gedackt (parlour)", Chamber, 18, {0x03, 0, 0}, 0, 1, 440, 0, 0, 0},
  {"Medieval positive (castle hall)", Positive, 20, {0xE5, 0, 0}, 0, 3, 440, 0, 0, 0}, {"Barrel organ: Ode to Joy (fairground)", Barrel, 21, {0x1B, 0, 0x03}, 0, 0, 440, 0, 0, 0},
  {"Pedal thunder (Pantheon)", Church, 15, {0x01, 0x00, 0x87}, 0x02, 0, 440, 0, 0, 0}, {"Mixture shimmer (Cologne)", Church, 2, {0x52, 0x14, 0x00}, 0x01, 0, 440, 0, 0, 0}};
static const double TYPE_DEFAULTS[5][11] = {{1, 0, 4.8, 35, 25, 20, 45, 50, 1.0, 0, 0}, {19, 55, 6.6, 50, 20, 15, 50, 55, 0.8, 0, 1}, {18, 0, 4.5, 20, 20, 25, 60, 50, 0.7, 2, 0}, {20, 0, 4.5, 25, 30, 30, 70, 50, 0.6, 2, 0}, {21, 0, 5, 30, 45, 35, 70, 55, 0.5, 2, 0}};

// ---- the room (AcousiMagica)
static const double ROOM_DEF[33] = {1, 50, 45, 35, 0, 50, 0, 0, 0, 0, 0, 0, 0, 2, 40, 50, 80, 343, 30, 50, 65, 50, 0, 40, 0, 0.3, 0, 150, 1, 50, 0, 100, 35};
static const double MATS[10][2] = {{.03, .08}, {.05, .10}, {.08, .15}, {.12, .22}, {.04, .05}, {.04, .10}, {.02, .04}, {.30, .70}, {.45, .90}, {.75, 1.4}};
static const double WORLD[7] = {0.5, 1, 3, 8, 40, 250, 2000};
struct RoomIn { double lnLx, lnLy, lnLz, lnC, sxF, syF, lxF, lyF, open[6], alpha, hf, warm; };
inline RoomIn roomInputs(const double* v) {
  double sc = WORLD[ci(rnd(v[M_Scale]), 0, 6)]; const double* m = MATS[ci(rnd(v[M_Material]), 0, 9)]; RoomIn r;
  r.lnLx = std::log(sc * 1.5 * std::pow(12.0, v[M_Width] / 100)); r.lnLy = std::log(sc * 1.5 * std::pow(12.0, v[M_Depth] / 100)); r.lnLz = std::log(sc * 1.2 * std::pow(8.0, v[M_Height] / 100)); r.lnC = std::log(std::max(20.0, v[M_Speed]));
  r.sxF = v[M_SrcX] / 100; r.syF = v[M_SrcY] / 100; r.lxF = v[M_ListX] / 100; r.lyF = v[M_ListY] / 100;
  r.open[0] = v[M_OpenL] / 100; r.open[1] = v[M_OpenR] / 100; r.open[2] = v[M_OpenFront] / 100; r.open[3] = v[M_OpenBack] / 100; r.open[4] = v[M_OpenFloor] / 100; r.open[5] = v[M_OpenCeil] / 100;
  r.alpha = clampd(m[0] + (v[M_Damping] - 40) / 100 * 0.6, 0.005, 0.95); r.hf = m[1]; r.warm = clampd(0.2 + v[M_Warmth] / 100 * 1.6, 0.2, 2.6);
  return r;
}
struct RoomG { double Lx, Ly, Lz, c, alpha[6], beta[6], V, S, A, rtMid, rtHf, rtLow, sx, sy, sz, lx, ly, lz; };
inline RoomG roomDerive(const RoomIn& inp) {
  RoomG g; g.Lx = std::exp(inp.lnLx); g.Ly = std::exp(inp.lnLy); g.Lz = std::exp(inp.lnLz); g.c = std::exp(inp.lnC);
  g.V = g.Lx * g.Ly * g.Lz; g.S = 2 * (g.Lx * g.Ly + g.Lx * g.Lz + g.Ly * g.Lz);
  const double area[6] = {g.Ly * g.Lz, g.Ly * g.Lz, g.Lx * g.Lz, g.Lx * g.Lz, g.Lx * g.Ly, g.Lx * g.Ly}; double A = 0, Ahf = 0;
  for (int w = 0; w < 6; ++w) {
    double base = inp.alpha; double a = base + (1 - base) * inp.open[w], ah = base + inp.hf * 0.12 * (1 - inp.open[w]) + (1 - base) * inp.open[w];
    a = clampd(a, 0.002, 0.995); ah = clampd(ah, a, 0.995); g.alpha[w] = a; g.beta[w] = std::sqrt(1 - a); A += area[w] * -std::log(1 - a); Ahf += area[w] * -std::log(1 - ah);
  }
  g.A = A; double k = 55.26 / g.c;
  g.rtMid = k * g.V / (A + 4 * 0.0005 * g.V); g.rtHf = std::min(g.rtMid, k * g.V / (Ahf + 4 * 0.003 * g.V)); g.rtLow = g.rtMid * inp.warm;
  g.sx = clampd(inp.sxF, 0.02, 0.98) * g.Lx; g.sy = clampd(inp.syF, 0.02, 0.98) * g.Ly; g.sz = 0.35 * g.Lz;
  g.lx = clampd(inp.lxF, 0.02, 0.98) * g.Lx; g.ly = clampd(inp.lyF, 0.02, 0.98) * g.Ly; g.lz = 0.35 * g.Lz;
  return g;
}
inline double roomFor(const PlaceRow& p, double sizeTrim, double decayTrim, double mix, double* v, double* rtOut) {
  for (int i = 0; i < M_Count; ++i) v[i] = ROOM_DEF[i];
  double Lx = p.w * sizeTrim, Ly = p.l * sizeTrim, Lz = p.h * sizeTrim; int best = 0; double bestErr = 1e9, bw = 0, bd = 0, bh = 0;
  for (int world = 0; world < 6; ++world) {
    double sc = WORLD[world], w = 100 * std::log(Lx / (1.5 * sc)) / std::log(12.0), d = 100 * std::log(Ly / (1.5 * sc)) / std::log(12.0), h = 100 * std::log(Lz / (1.2 * sc)) / std::log(8.0);
    auto over = [](double x) { return x < 0 ? -x : (x > 100 ? x - 100 : 0); }; double err = over(w) + over(d) + over(h);
    if (err < bestErr - 1e-9) { bestErr = err; best = world; bw = w; bd = d; bh = h; }
    if (err == 0) break;
  }
  v[M_Scale] = best; v[M_Width] = clampd(bw, 0, 100); v[M_Depth] = clampd(bd, 0, 100); v[M_Height] = clampd(bh, 0, 100);
  v[M_Roof] = p.roof; v[M_Curve] = 60; v[M_Material] = p.mat; v[M_Warmth] = p.warm * 50; v[M_Diffusion] = p.diff;
  v[M_SrcX] = p.sx; v[M_SrcY] = p.sy; v[M_ListX] = p.lx; v[M_ListY] = p.ly; v[M_OpenCeil] = p.oc; v[M_Mix] = mix; v[M_EarlyLate] = 45; v[M_Inertia] = 400;
  double target = std::max(0.15, p.rt * decayTrim), lo = 0, hi = 100;
  for (int it = 0; it < 30; ++it) { double mid = 0.5 * (lo + hi); v[M_Damping] = mid; double rt = roomDerive(roomInputs(v)).rtMid; if (rt > target) lo = mid; else hi = mid; }
  v[M_Damping] = 0.5 * (lo + hi);
  *rtOut = roomDerive(roomInputs(v)).rtMid; return *rtOut;
}
inline uint32_t hashRoom(uint32_t x) { x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }
constexpr int kTick = 32, kLines = 8, kMaxTaps = 140; constexpr double kMaxDelay = 7.0, kMaxFdn = 3.0;
static const double HADL[8] = {1, -1, 1, -1, 1, -1, 1, -1}, HADR[8] = {1, 1, -1, -1, 1, 1, -1, -1};
struct Img { int ix, iy, iz, qx, qy, qz, hits, ceil; };
inline const std::vector<Img>& images() {
  static const std::vector<Img> im = [] {
    std::vector<Img> r;
    for (int ix = -4; ix <= 4; ++ix) for (int qx = 0; qx < 2; ++qx) for (int iy = -4; iy <= 4; ++iy) for (int qy = 0; qy < 2; ++qy) for (int iz = -4; iz <= 4; ++iz) for (int qz = 0; qz < 2; ++qz) {
      int h = std::abs(ix - qx) + std::abs(ix) + std::abs(iy - qy) + std::abs(iy) + std::abs(iz - qz) + std::abs(iz);
      if (h <= 3) r.push_back({ix, iy, iz, qx, qy, qz, h, std::abs(iz)});
    }
    std::stable_sort(r.begin(), r.end(), [](const Img& a, const Img& b) { return a.hits < b.hits; });
    return r;
  }();
  return im;
}
struct Room {
  double sr; double v[M_Count]; DelayLine hist; std::vector<DelayLine> fdn; const std::vector<Img>& img;
  std::vector<double> dly, dstep, gain, gstep, lpA, zt; double fdCur[kLines], fdStep[kLines], fg[kLines], fp[kLines], fz[kLines], zv[kLines], dv[kLines];
  double lateDelay = 100, rotC = 0.8, rotS = 0.6, lateScale = 1; int nTaps = 0; bool snap = true, haveSm = false, active = true; RoomIn sm{};
  explicit Room(double s) : sr(s), hist((long long)std::floor(kMaxDelay * s) + 8), img(images()) {
    for (int i = 0; i < M_Count; ++i) v[i] = ROOM_DEF[i];
    for (int k = 0; k < kLines; ++k) fdn.emplace_back((long long)std::floor(kMaxFdn * s) + 8);
    const size_t T = 2 * kMaxTaps; dly.assign(T, 0); dstep.assign(T, 0); gain.assign(T, 0); gstep.assign(T, 0); lpA.assign(T, 0); zt.assign(T, 0);
    for (int k = 0; k < kLines; ++k) { fdCur[k] = 100; fdStep[k] = fg[k] = fp[k] = fz[k] = zv[k] = dv[k] = 0; }
  }
  void reset() { hist.clear(); for (auto& l : fdn) l.clear(); std::fill(zt.begin(), zt.end(), 0.0); for (int k = 0; k < kLines; ++k) { fz[k] = 0; fdCur[k] = 100; } snap = true; nTaps = 0; std::fill(gain.begin(), gain.end(), 0.0); std::fill(gstep.begin(), gstep.end(), 0.0); std::fill(dstep.begin(), dstep.end(), 0.0); }
  void tick(int m) {
    double dt = m / sr; RoomIn tg = roomInputs(v);
    double a = snap ? 1 : 1 - std::exp(-dt / std::max(0.003, v[M_Inertia] * 0.001));
    if (snap || !haveSm) { sm = tg; haveSm = true; } else {
      auto f = [a](double c, double t) { return c + (t - c) * a; };
      sm.lnLx = f(sm.lnLx, tg.lnLx); sm.lnLy = f(sm.lnLy, tg.lnLy); sm.lnLz = f(sm.lnLz, tg.lnLz); sm.lnC = f(sm.lnC, tg.lnC);
      sm.sxF = f(sm.sxF, tg.sxF); sm.syF = f(sm.syF, tg.syF); sm.lxF = f(sm.lxF, tg.lxF); sm.lyF = f(sm.lyF, tg.lyF);
      for (int w = 0; w < 6; ++w) sm.open[w] = f(sm.open[w], tg.open[w]);
      sm.alpha = f(sm.alpha, tg.alpha); sm.hf = f(sm.hf, tg.hf); sm.warm = f(sm.warm, tg.warm);
    }
    const RoomIn& S = sm; RoomG g = roomDerive(S);
    double cap = (kMaxDelay - 0.05) * sr, sps = sr / g.c; int order = 2 + ci(rnd(v[M_Order]), 0, 2); double curve = v[M_Curve] / 100; int roof = ci(rnd(v[M_Roof]), 0, 3); const double ear = 0.09;
    double pwr[6][5]; for (int w = 0; w < 6; ++w) { pwr[w][0] = 1; for (int k = 1; k < 5; ++k) pwr[w][k] = pwr[w][k - 1] * g.beta[w]; }
    double hfLoss = S.hf; int nt = 0; double mx[2] = {g.lx - ear, g.lx + ear};
    double roofGain = roof == 2 ? 1 + 1.8 * curve : (roof == 1 ? 1 + 0.3 * curve : (roof == 3 ? 1 - 0.2 * curve : 1)), apex = roof == 0 ? 1 : 1 + 0.6 * curve;
    for (const Img& im : img) {
      if (im.hits > order || nt >= kMaxTaps) continue;
      double X = 2 * im.ix * g.Lx + (im.qx ? -g.sx : g.sx), Y = 2 * im.iy * g.Ly + (im.qy ? -g.sy : g.sy), Lz = g.Lz * (im.ceil ? apex : 1), Z = 2 * im.iz * Lz + (im.qz ? -g.sz : g.sz);
      double gn = pwr[0][std::abs(im.ix - im.qx)] * pwr[1][std::abs(im.ix)] * pwr[2][std::abs(im.iy - im.qy)] * pwr[3][std::abs(im.iy)] * pwr[4][std::abs(im.iz - im.qz)] * pwr[5][std::abs(im.iz)];
      if (im.ceil) gn *= std::pow(roofGain, (double)im.ceil);
      for (int mic = 0; mic < 2; ++mic) {
        double dx = X - mx[mic], dy = Y - g.ly, dz = Z - g.lz; double dist = std::sqrt(dx * dx + dy * dy + dz * dz);
        if (im.ceil && roof == 1) dist += curve * im.ceil * 0.5 * (0.5 + 0.5 * ((double)(hashRoom((uint32_t)(nt * 977 + mic * 131)) & 255) / 255.0));
        if (im.ceil && roof == 3) dist += (mic ? -1 : 1) * curve * im.ceil * 0.4;
        double d = dist * sps, gg = gn / std::max(dist, 0.25);
        if (d > cap || d < 2) { d = clampd(d, 2, cap); gg = d >= cap ? 0 : gg; }
        double fc = 16000 * std::exp(-im.hits * hfLoss * (roof == 2 && im.ceil ? 0.4 : 1)) / (1 + dist / 120), la = std::exp(-6.2831853 * std::min(fc, sr * 0.45) / sr);
        int ix = mic * kMaxTaps + nt; bool fresh = snap || nt >= nTaps;
        if (fresh) { dly[ix] = d; dstep[ix] = 0; gain[ix] = 0; gstep[ix] = 0; }
        dstep[ix] = (d - dly[ix]) / m; gstep[ix] = (gg - gain[ix]) / m; lpA[ix] = la;
        if (fresh) { gain[ix] = gg; gstep[ix] = 0; dstep[ix] = 0; }
      }
      ++nt;
    }
    for (int t = nt; t < nTaps; ++t) for (int mic = 0; mic < 2; ++mic) { int ix = mic * kMaxTaps + t; gstep[ix] = (0 - gain[ix]) / m; dstep[ix] = 0; }
    nTaps = std::max(nt, nTaps);
    if (nTaps > nt) { bool quiet = true; for (int t = nt; t < nTaps; ++t) if (std::fabs(gain[t]) > 1e-4 || std::fabs(gain[kMaxTaps + t]) > 1e-4) quiet = false; if (quiet) nTaps = nt; }
    double mfp = 4 * g.V / g.S;
    double raw[8] = {2 * g.Lx, 2 * g.Ly, 2 * g.Lz, 2 * std::sqrt(g.Lx * g.Lx + g.Ly * g.Ly), 2 * std::sqrt(g.Lx * g.Lx + g.Lz * g.Lz), 2 * std::sqrt(g.Ly * g.Ly + g.Lz * g.Lz), 2 * std::sqrt(g.Lx * g.Lx + g.Ly * g.Ly + g.Lz * g.Lz), mfp * 1.3};
    for (int k = 0; k < kLines; ++k) {
      double sec = clampd(raw[k] / g.c, 0.003 * (1 + 0.37 * k), kMaxFdn - 0.1), d = sec * sr;
      if (snap || fdCur[k] > 50000000) fdCur[k] = d;
      fdStep[k] = (d - fdCur[k]) / m;
      double gl = std::min(0.99995, std::pow(10.0, -3 * sec / g.rtLow)), gh = std::min(gl, std::pow(10.0, -3 * sec / g.rtHf));
      double r = gl > 1e-9 ? gh / gl : 0, c4 = std::cos(6.2831853 * 4000 / sr), r2 = r * r, p = 0;
      if (r2 < 0.999999) { double q = 1 - r2 * c4, disc = std::max(0.0, q * q - (1 - r2) * (1 - r2)); p = (q - std::sqrt(disc)) / (1 - r2); }
      fg[k] = gl; fp[k] = clampd(p, 0, 0.97);
    }
    double dDirect = std::sqrt((g.sx - g.lx) * (g.sx - g.lx) + (g.sy - g.ly) * (g.sy - g.ly) + (g.sz - g.lz) * (g.sz - g.lz)) * sps;
    lateDelay = std::min(cap, dDirect + 0.3 * (raw[7] / g.c) * sr);
    double diffusion = v[M_Diffusion] / 100; if (roof == 2) diffusion *= 1 - 0.5 * curve;
    rotC = std::cos(diffusion * 0.78539816); rotS = std::sin(diffusion * 0.78539816);
    lateScale = std::min(2.5, std::sqrt(50.27 / std::max(1.0, g.A)));
    snap = false;
  }
  void process(const double* inL, const double* inR, double* outL, double* outR, int n) {
    if (v[M_Mix] <= 0.0001) { for (int i = 0; i < n; ++i) { outL[i] = inL[i]; outR[i] = inR[i]; } active = false; return; }
    if (!active) { reset(); active = true; }
    int done = 0;
    while (done < n) {
      int m = std::min(kTick, n - done); tick(m);
      double mix = v[M_Mix] / 100, spread = v[M_Spread] / 100, eg = clampd(v[M_EarlyLate] / 50, 0, 2), lg = clampd((100 - v[M_EarlyLate]) / 50, 0, 2), lateGain = lg * lateScale, earlyGain = eg * 0.8;
      int nT = nTaps; double rc = rotC, rs = rotS, lDel = std::max(2.0, lateDelay); const float* hbuf = hist.buf.data(); long long hmask = hist.mask;
      for (int i = 0; i < m; ++i) {
        double xl = inL[done + i], xr = inR[done + i];
        hist.push(0.5 * (xl + xr));
        long long w = hist.w;
        double e0 = 0, e1 = 0;
        for (int mic = 0; mic < 2; ++mic) {
          int base = mic * kMaxTaps; double e = 0;
          for (int t = 0; t < nT; ++t) {
            int ix = base + t; double d = dly[ix] + dstep[ix]; dly[ix] = d; double g = gain[ix] + gstep[ix]; gain[ix] = g;
            if (g == 0 && gstep[ix] == 0) continue;
            long long id = (long long)std::floor(d); double fr = d - (double)id, x0 = (double)hbuf[(w - id) & hmask], x1 = (double)hbuf[(w - 1 - id) & hmask], x = x0 + (x1 - x0) * fr;
            double la = lpA[ix], zz = x * (1 - la) + zt[ix] * la; zt[ix] = zz; e += zz * g;
          }
          if (mic) e1 = e; else e0 = e;
        }
        double in8 = hist.read(lDel);
        double yl = 0, yr = 0;
        for (int k = 0; k < kLines; ++k) { fdCur[k] += fdStep[k]; double z = fdn[(size_t)k].read(std::max(2.0, fdCur[k])); zv[k] = z; yl += HADL[k] * z; yr += HADR[k] * z; }
        for (int k = 0; k < kLines; ++k) { fz[k] = zv[k] * (1 - fp[k]) + fz[k] * fp[k]; dv[k] = fz[k] * fg[k]; }
        for (int stride = 1; stride < kLines; stride <<= 1)
          for (int base = 0; base < kLines; base += 2 * stride) for (int j = base; j < base + stride; ++j) { double u = dv[j], ww = dv[j + stride]; dv[j] = rc * u - rs * ww; dv[j + stride] = rs * u + rc * ww; }
        for (int k = 0; k < kLines; ++k) fdn[(size_t)k].push(in8 * 0.35355339 + dv[k]);
        yl *= 0.35355339; yr *= 0.35355339;
        double wl = e0 * earlyGain + yl * lateGain, wr = e1 * earlyGain + yr * lateGain;
        double mid = 0.5 * (wl + wr), side = 0.5 * (wl - wr) * spread; wl = mid + side; wr = mid - side;
        outL[done + i] = xl * (1 - mix) + wl * mix; outR[done + i] = xr * (1 - mix) + wr * mix;
      }
      done += m;
    }
  }
};
// ---- the pipe tables: one cycle of each recipe for each half-octave (built when first needed, shared by all instances)
struct SineTab { float t[kTab]; SineTab() { for (int i = 0; i < kTab; ++i) t[i] = (float)std::sin(2 * kPi * i / kTab); } };
inline const float* SINE() { static const SineTab s; return s.t; }
inline double bandLow(int b) { return 16 * std::pow(2.0, b / 2.0); }
inline int bandFor(double f) { return ci(std::floor(2 * std::log2(std::max(f, 16.0) / 16)), 0, kBands - 1); }
inline std::vector<float>* buildTable(double sr, int r, int b) {
  auto* tp = new std::vector<float>(kTab + 2, 0.f); std::vector<float>& t = *tp; const float* SN = SINE();
  double fc = bandLow(b) * std::sqrt(std::sqrt(2.0)), fTop = bandLow(b + 1); int K = (int)clampd(std::floor(0.46 * sr / fTop), 1, kMaxHarm); bool reed = recipeFamily(r) == F_Reed;
  for (int k = 1; k <= K; ++k) {
    double a = harmonicAmp(r, k, fc); if (a < 1e-5) continue;
    uint32_t h = (uint32_t)(r * 7919 + k * 104729 + 17); h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    int ph0 = reed ? 0 : (int)std::floor((double)(h % 1000) * 0.5 / 1000 * kTab);
    for (int i = 0; i < kTab; ++i) t[(size_t)i] = (float)((double)t[(size_t)i] + a * (double)SN[(k * i + ph0) & (kTab - 1)]);
  }
  double e = 0; for (int i = 0; i < kTab; ++i) e += (double)t[(size_t)i] * (double)t[(size_t)i];
  double norm = e > 0 ? 0.25 / std::sqrt(e / kTab) : 0; for (int i = 0; i < kTab; ++i) t[(size_t)i] = (float)((double)t[(size_t)i] * norm);
  t[kTab] = t[0]; t[kTab + 1] = t[1];
  return tp;
}
inline const float* sharedTable(double sr, int r, int b) {
  static std::mutex mu; static std::map<double, std::vector<std::vector<float>*>> cache; std::lock_guard<std::mutex> lk(mu);
  auto& arr = cache[sr]; if (arr.empty()) arr.assign((size_t)(R_Count * kBands), nullptr);
  auto*& slot = arr[(size_t)(r * kBands + b)]; if (!slot) slot = buildTable(sr, r, b); return slot->data();
}
// ---- parameters
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> regNames, plNames, tpNames, tmNames, tuNames; for (auto& r : REGS) regNames.push_back(r.name); for (auto& p : PLACES) plNames.push_back(p.name); for (auto n : TYPENAMES) tpNames.push_back(n); for (auto n : TEMPNAMES) tmNames.push_back(n); for (auto& t : TUNES) tuNames.push_back(t.name);
  std::vector<Spec> s = {P("Preset", "", 0, kRegs - 1, 0, "%.0f", false, regNames), P("Organ type", "", 0, kTypes - 1, 0, "%.0f", false, tpNames), P("Place", "", 0, kPlaces - 1, 1, "%.0f", false, plNames),
    P("Room mix", "%", 0, 100, 35, "%.0f %%"), P("Room size", "%", 40, 250, 100, "%.0f %%", true), P("Decay", "%", 25, 200, 100, "%.0f %%", true),
    P("Keyboards", "", 0, 2, 0, "%.0f", false, {"Pedal split", "By MIDI channel", "Manual only"}), P("Pedal split", "", 36, 72, 48, "%.0f")};
  const char* dn[3] = {"Great", "Swell", "Pedal"};
  for (int d = 0; d < 3; ++d) for (int i = 0; i < 8; ++i) s.push_back(P((std::string(dn[d]) + " stop " + std::to_string(i + 1)).c_str(), "", 0, 1, (d == 0 && i == 1) ? 1 : 0, "%.0f", false, {"In", "Out"}));
  for (const char* n : {"Swell to Great", "Great to Pedal", "Swell to Pedal", "Super octave", "Sub octave"}) s.push_back(P(n, "", 0, 1, 0, "%.0f", false, {"Off", "On"}));
  std::vector<Spec> r = {P("Swell shutters", "%", 0, 100, 100, "%.0f %%"), P("Tremulant", "%", 0, 100, 0, "%.0f %%"), P("Tremulant rate", "Hz", 2, 9, 4.8, "%.1f Hz", true),
    P("Wind sag", "%", 0, 100, 35, "%.0f %%"), P("Wind flutter", "%", 0, 100, 25, "%.0f %%"), P("Wind noise", "%", 0, 100, 20, "%.0f %%"),
    P("Chiff", "%", 0, 100, 45, "%.0f %%"), P("Brightness", "%", 0, 100, 50, "%.0f %%"), P("Pipe detune", "cents", 0, 12, 2.5, "%.1f ct"),
    P("Tuning", "", 0, 3, 0, "%.0f", false, tmNames), P("Pitch A4", "Hz", 392, 466, 440, "%.1f Hz"), P("Release", "x", 0.3, 3, 1, "%.2f x", true),
    P("Volume", "dB", -30, 6, -6, "%.1f dB"), P("Great level", "dB", -24, 6, 0, "%.1f dB"), P("Swell level", "dB", -24, 6, 0, "%.1f dB"), P("Pedal level", "dB", -24, 6, 0, "%.1f dB"),
    P("Traps", "", 0, 1, 0, "%.0f", false, {"Off", "On"}), P("Traps level", "dB", -24, 6, -3, "%.1f dB"),
    P("Barrel tune", "", 0, 3, 0, "%.0f", false, tuNames), P("Barrel", "", 0, 1, 0, "%.0f", false, {"Stopped", "Cranking"}),
    P("Crank speed", "%", 40, 160, 100, "%.0f %%"), P("Crank wobble", "%", 0, 100, 25, "%.0f %%"), P("Trap keys", "", 0, 1, 0, "%.0f", false, {"Off", "Keys below C2"})};
  for (auto& x : r) s.push_back(x);
  return s;
}
inline std::vector<int> sg(int d) { std::vector<int> a; for (int i = 0; i < 8; ++i) a.push_back(stopId(d, i)); return a; }
inline std::vector<Group> makeGroups() {
  return {{"Organ", {Type, Place, RoomMix, Size, DecayTrim}}, {"Great stops", sg(Great)}, {"Swell stops", sg(Swell)}, {"Pedal stops", sg(Pedal)},
    {"Couplers and box", {CplSwGt, CplGtPed, CplSwPed, CplSuper, CplSub, SwellBox}}, {"Keyboards", {KeyMode, Split, LevelG, LevelS, LevelP}},
    {"Wind and voicing", {TremDepth, TremRate, WindSag, WindFlutter, WindNoise, Chiff, Bright, Detune, Release}}, {"Tuning", {Temper, A4}},
    {"Theatre traps", {Traps, TrapKeys, TrapLevel}}, {"Barrel organ", {BarrelTune, BarrelPlay, Crank, Wobble}}, {"Output", {Volume}}};
}
inline uint32_t hash3(uint32_t a, uint32_t b, uint32_t c) { uint32_t h = (a * 0x9E3779B1U) ^ ((b + 0x7F4A7C15U) * 0x85EBCA6BU) ^ ((c + 0x165667B1U) * 0xC2B2AE35U); h = h ^ (h >> 15); h *= 0x2C1B3C6DU; h = h ^ (h >> 12); return h; }
struct Stop { bool on = false; int idx = 0; double env = 0, attInc = 0.01, relMul = 0.99, off = 0; double ph[5] = {}, pe[5] = {}; const StopDef* def = nullptr; double cInc[5] = {}, cAmp[5] = {}; const float* cTab[5] = {}; double pd[5] = {}; };
struct Voice { bool active = false, gate = false; int div = 0, note = 60, key = 60, chan = 0; long long age = 0; double f0 = 261, panL = 0.7, panR = 0.7, chiffEnv = 0, chiffAmt = 0, chiffTau = 0.99, s1 = 0, s2 = 0, vol = 1; uint32_t rng = 1; Stop st[kStopsPer]; };
struct Trap { bool on = false; int kind = 0; double t = 0, a = 1, f = 100, ph = 0, lp = 0, hp = 0; };
struct Bell { bool on = false; double f = 2000, t = 0, ph[3] = {0, 0, 0}; };
static const double XY[3][2] = {{1, 1}, {3, 0.45}, {6, 0.15}}, GL[4][2] = {{1, 1}, {2.76, 0.5}, {5.4, 0.3}, {8.93, 0.15}}, CH[5][2] = {{0.5, 0.5}, {1, 1}, {2, 0.4}, {2.76, 0.3}, {4.1, 0.15}};
static const int TRAPKEY[12] = {36, 37, 38, 75, 41, 45, 42, 48, 54, 49, 70, 51};
struct PNote { int note; double beats; int pos; };
inline PNote parseNote(const char* s, int pos) {
  int len = (int)std::strlen(s); auto at = [&](int p) -> char { return p < len ? s[p] : '\0'; };
  while (at(pos) == ' ') ++pos;
  if (pos >= len) return {-1, 1, pos};
  int n = 0; switch (at(pos)) { case 'A': n = 9; break; case 'B': n = 11; break; case 'C': n = 0; break; case 'D': n = 2; break; case 'E': n = 4; break; case 'F': n = 5; break; case 'G': n = 7; break; default: n = 0; } ++pos;
  if (at(pos) == '#') { ++n; ++pos; } else if (at(pos) == 'b') { --n; ++pos; }
  int oct = 4; if (at(pos) >= '0' && at(pos) <= '9') { oct = at(pos) - '0'; ++pos; }
  double beats = 1; if (at(pos) == ':') { ++pos; int q = pos; while ((at(q) >= '0' && at(q) <= '9') || at(q) == '.') ++q; beats = std::strtod(std::string(s + pos, (size_t)(q - pos)).c_str(), nullptr); if (!(beats > 0)) beats = 0; pos = q; }
  return {12 * (oct + 1) + n, beats, pos};
}
inline double softLimit(double x) { if (!(x == x) || x == INFINITY || x == -INFINITY) return 0; double a = std::fabs(x); if (a <= 0.9) return x; double y = 0.9 + 0.1 * std::tanh((a - 0.9) / 0.1); return x < 0 ? -y : y; }

struct Engine : EngineBase {
  std::vector<Spec> specs; Room room; Voice voice[kVoices]; Trap trap[8]; Bell bell[6];
  double gL[kTick], gR[kTick], sL[kTick], sR[kTick], pL[kTick], pR[kTick], rL[kTick], rR[kTick], oL[kTick], oR[kTick], tmp[kTick];
  Noise noise{0x9E3779B9u}; double tremPh = 0, flutN = 0, flutA = 0, sag = 0, activity = 0; long long ctr = 0; bool barrelOn = false;
  double lpSwL = 0, lpSwR = 0, toneL = 0, toneR = 0, windN = 0, zimT = 0.3, wobPh = 0, swellOpen = 1, barrelPitch = 0, expr = 1, mod = 0, bend = 0; bool inReg = false; int depth = 0; double pend[Count]; unsigned char pendHas[Count];
  double bMelT = 0, bBasT = 0, bMelLen = 0, bBasLen = 0, bMelNote = -1, bBasNote = -1; int bMelPos = 0, bBasPos = 0; double roomRt = 0;
  const float* localTab[R_Count * kBands] = {};
  explicit Engine(double s) : EngineBase(s), room(s) {
    specs = makeSpecs(); initParams(specs);
    for (int i = 0; i < kTick; ++i) gL[i] = gR[i] = sL[i] = sR[i] = pL[i] = pR[i] = rL[i] = rR[i] = oL[i] = oR[i] = tmp[i] = 0;
    for (int i = 0; i < Count; ++i) { pend[i] = 0; pendHas[i] = 0; }
    applyRoom();
  }
  const float* getTable(int r, int b) { int key = r * kBands + b; const float*& p = localTab[key]; if (!p) p = sharedTable(sr, r, b); return p; }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; } void pressure(double) override {} void expression(double e) { expr = e; }
  void allNotesOff() override { for (auto& vo : voice) vo.gate = false; stopBarrel(); }
  // ---- parameters and presets
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    if (!(x == x)) x = specs[(size_t)id].def;
    double prev = v[(size_t)id]; v[(size_t)id] = x;
    if (id == Preset) loadReg(ci(rnd(x), 0, kRegs - 1));
    else if (id == Type && rnd(prev) != rnd(x) && !inReg) loadTypeDefaults(rnd(x));
    if (id == Place || id == RoomMix || id == Size || id == DecayTrim) applyRoom();
    if (id == BarrelPlay || id == BarrelTune) { if (id == BarrelTune || v[BarrelPlay] < 0.5) stopBarrel(); if (id == BarrelPlay && v[BarrelPlay] > 0.5) startBarrel(); }
  }
  void put(int id, double x) { v[(size_t)id] = x; pend[id] = x; pendHas[id] = 1; }
  void beginPuts() { ++depth; }
  void endPuts() { if (--depth > 0) return; for (int i = 0; i < Count; ++i) if (pendHas[i]) { writeParam(i, pend[i]); pendHas[i] = 0; } }
  void loadTypeDefaults(int type) {
    beginPuts();
    const double* d = TYPE_DEFAULTS[ci(type, 0, kTypes - 1)];
    put(Place, d[0]); put(TremDepth, d[1]); put(TremRate, d[2]); put(WindSag, d[3]); put(WindFlutter, d[4]); put(WindNoise, d[5]); put(Chiff, d[6]);
    put(Bright, d[7]); put(Release, d[8]); put(KeyMode, d[9]); put(Traps, d[10]);
    for (int dd = 0; dd < kDivs; ++dd) for (int i = 0; i < kStopsPer; ++i) put(stopId(dd, i), 0);
    put(stopId(0, type == Church ? 1 : 0), 1); for (int c = CplSwGt; c <= CplSub; ++c) put(c, 0);
    put(Temper, 0); put(A4, 440); put(BarrelPlay, 0); stopBarrel(); applyRoom();
    endPuts();
  }
  void loadReg(int n) {
    const RegRow& r = REGS[n]; inReg = true; beginPuts();
    put(Type, r.type); loadTypeDefaults(r.type);
    put(Place, r.place);
    for (int d = 0; d < kDivs; ++d) for (int i = 0; i < kStopsPer; ++i) put(stopId(d, i), (r.stops[d] >> i) & 1);
    for (int c = 0; c < 5; ++c) put(CplSwGt + c, (r.cpl >> c) & 1);
    put(Temper, r.temper); put(A4, r.a4); put(Traps, r.traps);
    put(TremDepth, r.trem == 0 ? 0 : (r.trem == 1 ? 40 : 60)); put(TremRate, r.trem == 2 ? 6.6 : 4.8);
    put(BarrelTune, r.barrelTune); if (r.type == Barrel) { put(BarrelPlay, 1); startBarrel(); }
    inReg = false; applyRoom(); endPuts();
  }
  void applyRoom() {
    int pl = rnd(v[Place]); const PlaceRow& p = PLACES[ci(pl, 0, kPlaces - 1)];
    double rv[M_Count]; roomFor(p, v[Size] / 100, v[DecayTrim] / 100, pl == 0 ? 0 : v[RoomMix], rv, &roomRt);
    for (int i = 0; i < M_Count; ++i) room.v[i] = rv[i];
  }
  // ---- playing
  void noteOn(int note, double) override { noteOnCh(0, note); }
  void noteOff(int note) override { noteOffCh(0, note); }
  void noteOnCh(int ch, int note) {
    int type = rnd(v[Type]);
    if (type == Theatre && v[Traps] > 0.5) {
      if (ch == 9) { trapHit(note); return; }
      if (v[TrapKeys] > 0.5 && note < 36) { trapHit(TRAPKEY[((note % 12) + 12) % 12]); return; }
    }
    if (ch == 9 && type == Theatre) return;
    route(ch, note);
  }
  void noteOffCh(int ch, int note) { for (auto& vo : voice) if (vo.active && vo.gate && vo.chan == ch && vo.key == note) vo.gate = false; }
  void route(int ch, int note) {
    int km = rnd(v[KeyMode]); int div = Great;
    if (km == 0) div = (note <= rnd(v[Split]) && stopCount(rnd(v[Type]), Pedal) > 0) ? Pedal : Great;
    else if (km == 1) div = ch == 1 ? Swell : (ch == 2 ? Pedal : Great);
    playOn(div, note, ch, note);
  }
  void playOn(int div, int note, int chan, int key) {
    spawn(div, note, chan, key);
    if (div == Great) {
      if (v[CplSwGt] > 0.5) spawn(Swell, note, chan, key);
      if (v[CplSuper] > 0.5) spawn(Great, note + 12, chan, key);
      if (v[CplSub] > 0.5) spawn(Great, note - 12, chan, key);
    } else if (div == Pedal) {
      if (v[CplGtPed] > 0.5) spawn(Great, note, chan, key);
      if (v[CplSwPed] > 0.5) spawn(Swell, note, chan, key);
    }
  }
  void spawn(int div, int note, int chan, int key) {
    if (note < 0 || note > 127) return;
    int type = rnd(v[Type]), cnt = stopCount(type, div);
    bool any = false; for (int i = 0; i < cnt; ++i) if (v[(size_t)stopId(div, i)] > 0.5) any = true;
    if (!any) return;
    int pick = -1; for (int i = 0; i < kVoices; ++i) if (!voice[i].active) { pick = i; break; }
    if (pick < 0) { double old = INFINITY; for (int i = 0; i < kVoices; ++i) if (!voice[i].gate && (double)voice[i].age < old) { old = (double)voice[i].age; pick = i; } }
    if (pick < 0) { double old = INFINITY; for (int i = 0; i < kVoices; ++i) if ((double)voice[i].age < old) { old = (double)voice[i].age; pick = i; } }
    voice[pick] = Voice(); Voice& vo = voice[pick];
    vo.active = true; vo.gate = true; vo.div = div; vo.note = note; vo.key = key; vo.chan = chan; vo.age = ++ctr; vo.rng = hash3((uint32_t)note, (uint32_t)div, (uint32_t)ctr) | 1u;
    const double* dev = TEMPS[ci(rnd(v[Temper]), 0, 3)];
    vo.f0 = v[A4] * std::pow(2.0, (note - 69) / 12.0 + dev[((note % 12) + 12) % 12] / 1200) * std::pow(2.0, noteTune * 0.01 / 12);
    double spread = clampd((note - 60) / 48.0, -1, 1) * 0.22, basePan = div == Swell ? 0.2 : (div == Pedal ? -0.25 : 0), pan = clampd(basePan + spread, -1, 1);
    vo.panL = std::sqrt(0.5 * (1 - pan)); vo.panR = std::sqrt(0.5 * (1 + pan));
    double chiff = 0, lvl = 0, rel = v[Release], bright = v[Bright] / 100;
    for (int i = 0; i < cnt; ++i) {
      if (v[(size_t)stopId(div, i)] < 0.5) continue;
      const StopDef& d = stopDef(type, div, i); Stop& s = vo.st[i]; s.on = true; s.idx = i;
      double fund = vo.f0 * d.comp[0].ratio;
      if (d.perc == P_Zimbel) { s.on = false; continue; }
      double att = std::max(0.004, d.attack * (1.3 - 0.6 * bright) * (fund > 800 ? 0.7 : 1));
      s.attInc = 1 / (att * sr); s.relMul = std::exp(-6.9 / (std::max(0.01, d.release * rel) * sr));
      s.env = d.perc ? 1 : 0;
      for (int c = 0; c < 5; ++c) s.ph[c] = (double)(hash3((uint32_t)note, (uint32_t)(i * 8 + c), (uint32_t)div) & 0xFFFF) / 65536.0;
      s.off = ((double)(hash3((uint32_t)note, (uint32_t)i, (uint32_t)(div + 31)) % 2001u) - 1000) / 1000 * v[Detune];
      chiff += d.chiff * d.level; lvl += d.level;
    }
    vo.chiffAmt = lvl > 0 ? chiff / lvl * v[Chiff] / 100 : 0; vo.chiffEnv = 1;
    vo.chiffTau = std::exp(-1 / ((0.02 + 0.03 * (1 - std::min(1.0, vo.f0 / 2000))) * sr));
    vo.vol = 1;
  }
  void trapHit(int note) {
    int kind = 1;
    if (note == 35 || note == 36) kind = 0; else if (note == 38 || note == 40 || note == 37) kind = 1;
    else if (note >= 41 && note <= 50 && note != 42 && note != 44 && note != 46 && note != 49) kind = 2;
    else if (note == 49 || note == 51 || note == 52 || note == 55 || note == 57 || note == 59 || note == 42 || note == 44 || note == 46) kind = 3;
    else if (note == 54 || note == 70) kind = 4; else if (note == 76 || note == 77 || note == 75) kind = 5;
    int pick = 0; double old = -1; for (int i = 0; i < 8; ++i) { if (!trap[i].on) { pick = i; old = 1e9; break; } if (trap[i].t > old) { old = trap[i].t; pick = i; } }
    trap[pick] = Trap(); Trap& t = trap[pick]; t.on = true; t.kind = kind; t.f = kind == 2 ? 90 + (note - 41) * 14 : 100;
  }
  // ---- barrel
  void startBarrel() { stopBarrel(); barrelOn = true; bMelPos = 0; bBasPos = 0; bMelT = bBasT = 0; bMelLen = bBasLen = 0; bMelNote = bBasNote = -1; }
  void stopBarrel() { barrelOn = false; for (auto& vo : voice) if (vo.active && (vo.chan == 14 || vo.chan == 15)) vo.gate = false; }
  void barrelStep(int which, const char* str, int chan, int div, double beats) {
    double t = (which ? bBasT : bMelT) + beats, len = which ? bBasLen : bMelLen; int note = (int)(which ? bBasNote : bMelNote), pos = which ? bBasPos : bMelPos;
    if (note >= 0 && t >= len * 0.9) { for (auto& vo : voice) if (vo.active && vo.gate && vo.chan == chan && vo.key == note) vo.gate = false; note = -1; }
    if (t >= len) {
      t -= len; PNote r = parseNote(str, pos);
      if (r.note < 0) { pos = 0; r = parseNote(str, pos); }
      pos = r.pos; note = r.note; len = r.beats; if (r.note >= 0) playOn(div, r.note, chan, r.note);
      if (len <= 0) len = 0.01;
    }
    if (which) { bBasT = t; bBasLen = len; bBasNote = note; bBasPos = pos; } else { bMelT = t; bMelLen = len; bMelNote = note; bMelPos = pos; }
  }
  void barrelAdvance(double beats) {
    if (!barrelOn) return;
    const TuneRow& tn = TUNES[ci(rnd(v[BarrelTune]), 0, 3)]; int type = rnd(v[Type]);
    barrelStep(0, tn.mel, 14, Great, beats);
    barrelStep(1, tn.bass, 15, stopCount(type, Pedal) > 0 ? Pedal : Great, beats);
  }
  // ---- audio
  void process(float* outL, float* outR, int n) override { int done = 0; while (done < n) { int m = std::min(n - done, kTick); block(outL, outR, done, m); done += m; } }
  double percDecay(Stop& st, int slot, int kind, double freq, int partial) {
    if (st.pd[slot] != 0) return st.pd[slot];
    double tau = 0.3;
    switch (kind) {
      case P_Xylophone: { static const double a[3] = {0.35, 0.12, 0.05}; tau = a[std::min(partial, 2)]; break; }
      case P_Glock: { static const double a[4] = {1.2, 0.5, 0.25, 0.12}; tau = a[std::min(partial, 3)]; break; }
      case P_Chimes: { static const double a[5] = {6.0, 5.0, 3.6, 2.4, 1.4}; tau = a[std::min(partial, 4)]; break; }
      case P_BassDrum: tau = 0.28; break;
    }
    tau *= clampd(600 / std::max(freq, 100.0), 0.3, 2.5);
    return st.pd[slot] = std::exp(-6.9 / (tau * sr));
  }
  double percussion(Voice& vo, Stop& st, const StopDef& d) {
    int np = d.perc == P_Xylophone ? 3 : (d.perc == P_Glock ? 4 : (d.perc == P_Chimes ? 5 : 1)); int base = d.perc == P_Xylophone ? 2 : (d.perc == P_Glock ? 4 : (d.perc == P_Chimes ? 2 : 1));
    double y = 0;
    if (d.perc == P_BassDrum) {
      if (st.pe[0] == 0) { st.pe[0] = 1; st.pe[1] = 1; }
      double f = (45 + (vo.note - 36) * 1.2) * (1 + 1.6 * st.pe[1]);
      st.ph[0] += f / sr; if (st.ph[0] > 1) st.ph[0] -= 1;
      y = std::sin(2 * kPi * st.ph[0]) * st.pe[0] * 1.2; st.pe[0] *= percDecay(st, 0, d.perc, 100, 0); st.pe[1] *= 0.9993;
      st.env = st.pe[0] < 1e-4 ? 0 : 1;
      return y * d.level;
    }
    const double (*tb)[2] = d.perc == P_Xylophone ? XY : (d.perc == P_Glock ? GL : CH);
    for (int p = 0; p < np; ++p) {
      if (st.pe[p] == 0) st.pe[p] = tb[p][1];
      double f = vo.f0 * base * tb[p][0];
      if (f < 0.45 * sr) { st.ph[p] += f / sr; if (st.ph[p] >= 1) st.ph[p] -= 1; y += std::sin(2 * kPi * st.ph[p]) * st.pe[p]; }
      st.pe[p] *= percDecay(st, p, d.perc, vo.f0 * base, p);
    }
    if (!vo.gate && d.perc != P_Chimes) st.pe[0] *= 0.9996;
    double m = 0; for (int q = 0; q < np; ++q) m = std::max(m, st.pe[q]);
    st.env = m < 1e-4 ? 0 : 1;
    return y * d.level * 0.5;
  }
  void block(float* outL, float* outR, int off, int n) {
    const std::vector<double>& V = v; int type = rnd(V[Type]);
    for (int i = 0; i < n; ++i) { gL[i] = gR[i] = sL[i] = sR[i] = pL[i] = pR[i] = 0; }
    // wind, tremulant, flutter: one value per block
    tremPh += V[TremRate] * (1 + 0.02 * flutA) * n / sr; if (tremPh >= 1) tremPh -= std::floor(tremPh);
    double tl = std::sin(2 * kPi * tremPh), td = clampd(V[TremDepth] / 100 + mod * 0.5, 0, 1);
    flutN = flutN * 0.995 + noise.white() * 0.0016; flutA = flutN;
    double flutC = (flutN * 220 + 0.6 * std::sin(0.00031 * (double)ctr * 32) + 0.35 * std::sin(0.00071 * (double)ctr * 32 + 1)) * (V[WindFlutter] / 100) * 2.5;
    sag += ((1 - std::exp(-activity / 28)) * V[WindSag] / 100 - sag) * 0.04;
    double sagC = -sag * 7, sagG = 1 - 0.18 * sag;
    if (barrelOn) {
      wobPh += 0.7 * n / sr; if (wobPh > 1) wobPh -= 1;
      double wob = V[Wobble] / 100, crank = V[Crank] / 100 * (1 + wob * 0.12 * (std::sin(2 * kPi * wobPh) + 0.5 * noise.white()));
      barrelAdvance(TUNES[ci(rnd(V[BarrelTune]), 0, 3)].tempo / 60 * crank * n / sr);
      barrelPitch = wob * 8 * std::sin(2 * kPi * wobPh);
    } else barrelPitch = 0;
    double swO = clampd(V[SwellBox] / 100 * expr, 0, 1); swellOpen += (swO - swellOpen) * 0.2;
    double act = 0; bool tremAll = type != Church; const double kTab_ = kTab;
    for (int vi = 0; vi < kVoices; ++vi) {
      Voice& vo = voice[vi]; if (!vo.active) continue;
      double* oLp = vo.div == Great ? gL : (vo.div == Swell ? sL : pL); double* oRp = vo.div == Great ? gR : (vo.div == Swell ? sR : pR);
      bool trm = td > 0.001 && (tremAll || vo.div == Swell);
      double cents = sagC + flutC + barrelPitch + bend * 200 + (trm ? td * 5 * tl : 0);
      double ampT = sagG * (trm ? 1 - td * 0.22 * (0.5 + 0.5 * tl) : 1), fscale = std::pow(2.0, cents / 1200);
      bool anyOn = false;
      for (int s = 0; s < kStopsPer; ++s) {
        Stop& st = vo.st[s]; st.def = nullptr; if (!st.on) continue;
        const StopDef& d = stopDef(type, vo.div, s); st.def = &d; anyOn = true;
        if (d.perc) continue;
        for (int c = 0; c < d.ncomp; ++c) {
          const Comp& cc = d.comp[c]; double f = vo.f0 * cc.ratio * fscale * std::pow(2.0, (cc.cents + st.off) / 1200);
          st.cInc[c] = f / sr * kTab_; st.cTab[c] = f < 0.46 * sr ? getTable(d.recipe, bandFor(f)) : nullptr; st.cAmp[c] = cc.amp;
        }
      }
      if (!anyOn) { vo.active = false; continue; }
      for (int i = 0; i < n; ++i) tmp[i] = 0;
      double vact = 0;
      for (int s = 0; s < kStopsPer; ++s) {
        Stop& st = vo.st[s]; const StopDef* dp = st.def; if (!dp) continue; const StopDef& d = *dp;
        if (d.perc) { for (int i = 0; i < n; ++i) tmp[i] += percussion(vo, st, d); continue; }
        int nc = d.ncomp; double lvl = d.level; bool gate = vo.gate; double attInc = st.attInc, relMul = st.relMul, env = st.env;
        for (int i = 0; i < n; ++i) {
          if (gate) { env = env + attInc; if (env > 1) env = 1; } else { env *= relMul; if (env < 1e-5) { env = 0; } }
          if (env <= 0) continue;
          double y = 0;
          for (int c = 0; c < nc; ++c) {
            const float* tab = st.cTab[c]; if (!tab) continue;
            double ph = st.ph[c] + st.cInc[c]; if (ph >= kTab_) ph -= kTab_; st.ph[c] = ph;
            int i0 = (int)ph; double fr = ph - i0; y += st.cAmp[c] * ((double)tab[i0] + ((double)tab[i0 + 1] - (double)tab[i0]) * fr);
          }
          tmp[i] += y * env * lvl; vact += env * lvl;
        }
        st.env = env;
      }
      if (vo.chiffEnv > 1e-4 && vo.chiffAmt > 0.001) {
        double g = std::tan(kPi * std::min(vo.f0 * 3.2, 9000.0) / sr), k = 0.45, den = 1 / (1 + g * (k + g)); uint32_t r = vo.rng; double s1 = vo.s1, s2 = vo.s2, ce = vo.chiffEnv; const double ca = vo.chiffAmt * 0.5, ct = vo.chiffTau;
        for (int i = 0; i < n; ++i) {
          if (ce <= 1e-4) break;
          r ^= r << 13; r ^= r >> 17; r ^= r << 5; double w = (double)(int32_t)r * (1.0 / 2147483648.0);
          double hp = (w - (k + g) * s1 - s2) * den, bp = g * hp + s1; s1 = g * hp + bp; double lp = g * bp + s2; s2 = g * bp + lp;
          tmp[i] += bp * ce * ca; ce *= ct;
        }
        vo.rng = r; vo.s1 = s1; vo.s2 = s2; vo.chiffEnv = ce;
      }
      for (int i = 0; i < n; ++i) { double acc = tmp[i] * ampT; oLp[i] += acc * vo.panL; oRp[i] += acc * vo.panR; }
      bool alive = false; for (int s = 0; s < kStopsPer; ++s) if (vo.st[s].def && vo.st[s].env > 1e-5) alive = true;
      if (!alive && !vo.gate) vo.active = false;
      act += vact;
    }
    activity += (act - activity) * 0.2;
    trapsAndBells(n);
    double lvG = std::pow(10.0, V[LevelG] / 20), lvS = std::pow(10.0, V[LevelS] / 20) * (0.2 + 0.8 * std::pow(swellOpen, 0.7)), lvP = std::pow(10.0, V[LevelP] / 20);
    double swFc = 900 * std::pow(13.0, swellOpen), swA = 1 - std::exp(-2 * kPi * swFc / sr);
    double toneFc = 2500 * std::pow(8.0, V[Bright] / 100), toneA = 1 - std::exp(-2 * kPi * std::min(toneFc, 18000.0) / sr);
    double vol = std::pow(10.0, V[Volume] / 20), windG = V[WindNoise] / 100 * 0.012 * std::min(1.0, activity / 4);
    for (int i = 0; i < n; ++i) {
      lpSwL += (sL[i] - lpSwL) * swA; lpSwR += (sR[i] - lpSwR) * swA;
      double L = gL[i] * lvG + lpSwL * lvS + pL[i] * lvP, R = gR[i] * lvG + lpSwR * lvS + pR[i] * lvP;
      windN += (noise.white() - windN) * 0.25; L += windN * windG; R += windN * windG * 0.9;
      toneL += (L - toneL) * toneA; toneR += (R - toneR) * toneA;
      rL[i] = fastTanh(toneL * vol); rR[i] = fastTanh(toneR * vol);
    }
    room.process(rL, rR, oL, oR, n);
    for (int i = 0; i < n; ++i) { outL[off + i] = (float)softLimit(oL[i]); outR[off + i] = (float)softLimit(oR[i]); }
    ctr += 1;
  }
  void trapsAndBells(int n) {
    const std::vector<double>& V = v; double lv = std::pow(10.0, V[TrapLevel] / 20);
    for (auto& t : trap) {
      if (!t.on) continue;
      for (int i = 0; i < n; ++i) {
        double w = noise.white(), y = 0; double st = t.t;
        switch (t.kind) {
          case 0: { double f = 48 + 130 * std::exp(-st * 40); t.ph += f / sr; y = std::sin(2 * kPi * t.ph) * std::exp(-st * 11) * 1.3; break; }
          case 1: { t.ph += 190 / sr; t.lp += (w - t.lp) * 0.6; y = (t.lp * 0.9 + std::sin(2 * kPi * t.ph) * 0.4) * std::exp(-st * 18); break; }
          case 2: { double f = t.f * (1 + 0.6 * std::exp(-st * 30)); t.ph += f / sr; y = std::sin(2 * kPi * t.ph) * std::exp(-st * 9); break; }
          case 3: { double h = w - t.hp; t.hp += (w - t.hp) * 0.35; y = h * std::exp(-st * 2.6) * 0.7; break; }
          case 4: { double h = w - t.hp; t.hp += (w - t.hp) * 0.55; y = h * std::exp(-st * 14) * (0.5 + 0.5 * std::sin(st * 200)) * 0.7; break; }
          default: { t.ph += 880 / sr; y = (std::sin(2 * kPi * t.ph) * 0.8 + w * 0.1) * std::exp(-st * 45); break; }
        }
        t.t += 1 / sr; if (t.ph > 1) t.ph -= 1;
        gL[i] += y * lv * 0.35; gR[i] += y * lv * 0.35;
      }
      if (t.t > 3) t.on = false;
    }
    int type = rnd(V[Type]); bool zim = false;
    for (int i = 0; i < kStopsPer; ++i) if (V[(size_t)stopId(0, i)] > 0.5 && stopDef(type, Great, i).perc == P_Zimbel) zim = true;
    if (zim && activity > 0.05) {
      zimT -= n / sr;
      if (zimT <= 0) {
        static const double hz[6] = {2093, 2349, 2637, 3136, 3520, 4186}; int k = 0; for (int i = 0; i < 6; ++i) if (!bell[i].on) { k = i; break; }
        bell[k] = Bell(); Bell& b = bell[k]; b.on = true; b.f = hz[(int)std::floor((noise.white() * 0.5 + 0.5) * 5.99)] * (V[A4] / 440); zimT = 0.12 + 0.4 * (noise.white() * 0.5 + 0.5);
      }
    }
    static const double pr[3] = {1, 2.4, 3.9}, am[3] = {1, 0.4, 0.2};
    for (auto& b : bell) {
      if (!b.on) continue;
      for (int i = 0; i < n; ++i) {
        double y = 0; for (int p = 0; p < 3; ++p) { b.ph[p] += b.f * pr[p] / sr; if (b.ph[p] > 1) b.ph[p] -= 1; y += am[p] * std::sin(2 * kPi * b.ph[p]); }
        y *= std::exp(-b.t * 3.2) * 0.05; b.t += 1 / sr; gL[i] += y * 0.7; gR[i] += y * 1.1;
      }
      if (b.t > 3) b.on = false;
    }
  }
};
inline Info info() {
  return Info{"pipica", "Pipica", "A pipe organ: table-lookup pipes in principal, flute, string and reed families, wind sag, tremulant, chiff, swell box, couplers, old tunings, 22 real-world rooms, theatre traps and a barrel organ that plays its own tunes. Preset = whole-organ registration.",
              makeSpecs(), makeGroups(), Theme{"pipica", 0xff2e1b10, 0xff0b0605, 0xffd9a441, 0xfff7e8c9, 0xffffd37a}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::pipica
