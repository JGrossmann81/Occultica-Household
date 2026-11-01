// Stringica: modelled bowed and plucked strings (bow friction waveguide, resonant body, sympathetic strings, tanpura drone, microtonal scales).
// 1:1 port of the web engine. The Preset is the instrument (15 of them); keyswitches MIDI 24..28 select the articulation.
#pragma once
#include "../common/engine.h"
#include <limits>
namespace occ { namespace stringica {
enum { Preset, Volume, Articulation, Players, Spread, BowForce, BowPos, BowNoise, Attack, Release, Bright, Body, BodySize, Buzz, VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange,
       Gamak, GamakRate, Scoop, Scale, Tonic, Tune, Sympath, SympDecay, Drone, DroneLevel, DroneSpeed, ReverbMix, ReverbSize, Octave, Count };
constexpr int kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 10;
struct ScaleDef { const char* name; double off[12]; int symp[7]; int n; };
static const ScaleDef SCALES[] = {
  {"12-tone equal", {0,0,0,0,0,0,0,0,0,0,0,0}, {0,2,4,5,7,9,11}, 7},
  {"Just (Shuddha)", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}, {0,2,4,5,7,9,11}, 7},
  {"Raga Bhairav", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}, {0,1,4,5,7,8,11}, 7},
  {"Raga Yaman", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}, {0,2,4,6,7,9,11}, 7},
  {"Raga Todi", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}, {0,1,3,6,7,8,11}, 7},
  {"Raga Kafi", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}, {0,2,3,5,7,9,10}, 7},
  {"Pythagorean", {0,-9.8,3.9,-5.9,7.8,-2,11.7,2,-7.8,5.9,-3.9,9.8}, {0,2,4,5,7,9,11}, 7},
  {"Chinese pentatonic", {0,0,3.9,0,7.8,0,0,2,0,5.9,0,0}, {0,2,4,7,9,0,0}, 5},
  {"Japanese In", {0,0,0,0,0,0,0,2,0,0,0,0}, {0,1,5,7,8,0,0}, 5},
  {"Maqam Rast", {0,0,0,50,0,0,0,0,0,0,50,0}, {0,2,3,5,7,9,10}, 7},
  {"Maqam Bayati", {0,50,0,0,0,0,0,0,0,0,0,0}, {0,1,3,5,7,8,10}, 7},
  {"Maqam Hijaz", {0,0,0,0,0,0,0,0,0,0,0,0}, {0,1,4,5,7,8,10}, 7},
  {"Slendro-ish", {0,0,40,0,0,-20,0,20,0,0,-40,0}, {0,2,5,7,10,0,0}, 5},
  {"Mongolian pentatonic", {0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0}, {0,2,4,7,9,0,0}, 5},
};
constexpr int kScales = 14;
struct Inst { const char* name; double t60, bright, force, pos, noise, attack, release, vibRate, vibDepth, vibDelay, buzz, symp, sympDecay, scoop, gamak, glide, body, hp, lp, gain; double m[10][3]; };
static const Inst INST[] = {
  {"Violin",1.4,60,52,22,22,55,190,5.8,24,380,0,0,4,0,0,90,60,150,9000,1,{{275,8,6},{460,10,4},{540,12,5},{720,10,2},{1050,8,-2},{1450,6,2},{2400,3,5},{3100,4,4},{4500,3,1},{6200,3,-3}}},
  {"Viola",1.6,52,50,22,24,70,210,5.3,24,400,0,0,4,0,0,100,62,110,8000,1,{{220,8,6},{370,10,4},{430,12,5},{600,10,2},{850,8,-2},{1200,6,2},{2000,3,4},{2700,4,3},{4000,3,0},{5500,3,-3}}},
  {"Cello",2,46,48,20,26,90,260,5,26,450,0,0,4,0,0,110,64,55,6500,1,{{95,8,6},{180,10,4},{230,12,5},{330,10,3},{480,8,-1},{700,6,2},{1100,3,4},{1600,4,3},{2400,3,1},{3600,3,-3}}},
  {"Double bass",2.6,34,46,17,32,130,320,4.4,20,500,0,0,4,0,0,130,66,28,4200,1.1,{{55,8,5},{95,10,4},{140,12,4},{210,10,2},{320,8,-1},{500,6,2},{800,3,3},{1200,4,2},{1800,3,0},{2800,3,-4}}},
  {"Erhu",1,72,56,14,34,70,170,5.6,34,300,6,0,3,8,0,120,55,180,8500,0.95,{{420,7,5},{650,8,3},{1000,6,2},{1500,5,5},{2200,4,7},{3200,4,5},{4500,3,2},{6000,3,-2},{900,8,-3},{7500,3,-3}}},
  {"Gaohu",0.9,82,58,13,34,55,150,6.2,30,250,6,0,3,6,0,100,55,280,10000,0.9,{{560,7,5},{850,8,3},{1300,6,2},{1950,5,5},{2900,4,7},{4100,4,5},{5800,3,2},{7500,3,-2},{1150,8,-3},{9000,3,-3}}},
  {"Haegeum",0.9,64,60,12,46,80,160,5,30,300,14,0,3,18,0,140,52,190,7500,0.95,{{380,6,4},{600,8,4},{900,7,3},{1400,5,4},{2000,4,6},{2800,4,5},{3900,3,3},{5200,3,-1},{800,8,-3},{6800,3,-4}}},
  {"Kokyu",1,50,46,18,30,100,230,4.8,20,420,4,0,3,14,0,160,58,220,6500,0.95,{{480,6,4},{700,8,3},{1000,6,3},{1500,5,3},{2100,4,4},{3000,3,3},{4200,3,1},{5600,3,-3},{880,8,-2},{7000,3,-4}}},
  {"Sarangi",2.2,60,62,10,44,60,300,5.2,18,250,42,60,7,25,0,120,66,140,9000,1,{{200,6,5},{340,8,4},{520,8,4},{800,6,3},{1300,5,4},{2000,4,6},{3000,3,5},{4300,3,3},{6000,3,0},{680,7,-2}}},
  {"Dilruba",2.4,54,58,12,38,90,330,5,22,300,24,45,7,20,0,140,62,120,7500,1,{{190,6,5},{320,8,4},{480,8,4},{720,6,3},{1150,5,4},{1800,4,5},{2700,3,4},{3900,3,2},{5500,3,-1},{620,7,-2}}},
  {"Esraj",2.8,50,56,12,36,110,380,4.8,20,320,20,40,8,18,0,160,66,100,7000,1,{{150,6,5},{260,8,4},{400,8,4},{620,6,3},{950,5,4},{1500,4,5},{2300,3,4},{3400,3,2},{4800,3,-1},{520,7,-2}}},
  {"Carnatic violin",1.3,70,54,20,24,50,170,5.6,28,200,0,14,5,22,0,100,58,150,9500,1,{{280,8,6},{470,10,4},{550,12,5},{740,10,2},{1060,8,-2},{1480,6,2},{2500,3,6},{3300,4,5},{4700,3,2},{6400,3,-2}}},
  {"Kamancheh",1.2,66,58,12,36,75,190,5.5,26,300,10,8,4,12,0,110,58,200,8500,0.95,{{250,6,4},{440,8,3},{700,7,3},{1100,6,3},{1700,5,5},{2400,4,6},{3400,3,5},{4800,3,2},{5900,3,-2},{580,7,-2}}},
  {"Rebab",1,40,54,12,50,90,200,4.6,26,350,22,0,3,14,0,150,56,180,5500,0.95,{{300,6,4},{520,7,4},{780,6,3},{1150,5,3},{1700,4,4},{2400,4,3},{3300,3,1},{4400,3,-2},{640,7,-2},{5800,3,-5}}},
  {"Morin khuur",1.8,48,56,14,44,110,280,4.2,20,450,16,10,3,10,0,140,62,75,5800,1,{{120,7,5},{250,8,4},{400,8,4},{620,6,3},{900,5,3},{1400,4,4},{2000,3,3},{3000,3,0},{520,7,-2},{4400,3,-4}}},
};
constexpr int nI = 15;
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> inames, snames; for (auto& i : INST) inames.push_back(i.name); for (auto& s : SCALES) snames.push_back(s.name);
  return {
    P("Preset", "", 0, nI - 1, 0, "%.0f", false, inames),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"),
    P("Articulation", "", 0, 4, 0, "%.0f", false, {"Arco", "Staccato", "Pizzicato", "Tremolo", "Swell"}),
    P("Players", "", 0, 3, 0, "%.0f", false, {"Solo", "Duo", "Section 4", "Ensemble 8"}),
    P("Spread", "%", 0, 100, 40, "%.0f %"),
    P("Bow force", "%", 0, 100, 52, "%.0f %"),
    P("Bow position", "%", 0, 100, 22, "%.0f %"),
    P("Bow noise", "%", 0, 100, 22, "%.0f %"),
    P("Attack", "ms", 5, 600, 55, "%.0f ms", true),
    P("Release", "ms", 10, 2000, 190, "%.0f ms", true),
    P("Brightness", "%", 0, 100, 60, "%.0f %"),
    P("Body", "%", 0, 100, 60, "%.0f %"),
    P("Body size", "%", -100, 100, 0, "%.0f %"),
    P("Bridge buzz", "%", 0, 100, 0, "%.0f %"),
    P("Vibrato depth", "cents", 0, 100, 24, "%.0f c"),
    P("Vibrato rate", "Hz", 2, 9, 5.8, "%.1f Hz"),
    P("Vibrato delay", "ms", 0, 1500, 380, "%.0f ms"),
    P("Mod wheel", "", 0, 1, 0, "%.0f", false, {"Vibrato", "Dynamics"}),
    P("Legato", "", 0, 1, 0, "%.0f", false, {"Poly", "Mono legato"}),
    P("Glide", "ms", 0, 800, 90, "%.0f ms"),
    P("Bend range", "st", 1, 12, 2, "%.0f st"),
    P("Gamak", "%", 0, 100, 0, "%.0f %"),
    P("Gamak rate", "Hz", 2, 10, 6, "%.1f Hz"),
    P("Slide-in", "%", 0, 100, 0, "%.0f %"),
    P("Scale", "", 0, kScales - 1, 0, "%.0f", false, snames),
    P("Tonic", "", 0, 11, 0, "%.0f", false, {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}),
    P("Tune", "cents", -50, 50, 0, "%.0f c"),
    P("Sympathetic", "%", 0, 100, 0, "%.0f %"),
    P("Sympathetic decay", "s", 0.5, 12, 4, "%.1f s", true),
    P("Drone", "", 0, 3, 0, "%.0f", false, {"Off", "Sa-Pa", "Sa-Ma", "Sa-Ni"}),
    P("Drone level", "dB", -40, 0, -18, "%.0f dB"),
    P("Drone cycle", "s", 2, 9, 4.5, "%.1f s"),
    P("Reverb mix", "%", 0, 100, 18, "%.0f %"),
    P("Reverb size", "%", 0, 100, 55, "%.0f %"),
    P("Octave", "", -2, 2, 0, "%.0f"),
  };
}
inline std::vector<Group> makeGroups() {
  return {
    {"Bow", {Articulation, BowForce, BowPos, BowNoise, Attack, Release}},
    {"Body and strings", {Bright, Body, BodySize, Buzz, Sympath, SympDecay}},
    {"Expression", {VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange, Gamak, GamakRate, Scoop}},
    {"Section", {Players, Spread}},
    {"Scale and tuning", {Scale, Tonic, Tune, Octave}},
    {"Drone", {Drone, DroneLevel, DroneSpeed}},
    {"Output", {Volume, ReverbMix, ReverbSize}},
  };
}
inline double dbToGain(double db) { return std::pow(10.0, db / 20); }
inline double hashf(uint32_t x, uint32_t y) { uint32_t h = x * 374761393u + y * 668265263u; h = (h ^ (h >> 13)) * 1274126177u; h = h ^ (h >> 16); return double(h & 0xFFFFFFu) / 16777215.0; }
inline int rnd(double x) { return (int)std::floor(x + 0.5); }
enum { BQ_PEAK = 0, BQ_LP = 3, BQ_HP = 4 };
struct Biquad {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double gainDb, double sr) {
    f = std::min(std::max(f, 5.0), sr * 0.49); q = std::max(0.05, q);
    double A = std::pow(10.0, gainDb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q);
    double B0, B1, B2, A0, A1, A2;
    if (t == BQ_PEAK) { B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; }
    else if (t == BQ_LP) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
    else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
};
struct Rev {
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8], ai[2][4]; double cz[2][8];
  explicit Rev(double sr) {
    const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) { cb[ch][k].assign((size_t)std::floor((ct[k] + ch * 23) * sr / 44100) + 1, 0.f); ci[ch][k] = 0; cz[ch][k] = 0; }
      for (int k = 0; k < 4; ++k) { ab[ch][k].assign((size_t)std::floor((at[k] + ch * 23) * sr / 44100) + 1, 0.f); ai[ch][k] = 0; }
    }
  }
  double tick(int ch, double x, double fb, double damp) {
    double s = 0;
    for (int k = 0; k < 8; ++k) {
      std::vector<float>& b = cb[ch][k]; int i = ci[ch][k]; double y = b[(size_t)i]; double z = y * (1 - damp) + cz[ch][k] * damp; cz[ch][k] = z; b[(size_t)i] = (float)(x + z * fb);
      ci[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s += y;
    }
    for (int k = 0; k < 4; ++k) {
      std::vector<float>& b = ab[ch][k]; int i = ai[ch][k]; double bo = b[(size_t)i]; double y = -s + bo; b[(size_t)i] = (float)(s + bo * 0.5);
      ai[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s = y;
    }
    return s;
  }
};
struct Str {
  DelayLine neck, bridge;
  double lpB = 0, lpN = 0, lev = 0, ring = 0, pole = 0.3, loopGain = 0.999, pendingPluck = 0; bool on = false, plucked = false; int state = 0;
  double lf = 6, lfT = 6, bowEnv = 0, bowTarget = 0, bowDyn = 0, relDamp = 1, vibPh = 0, vibAge = 0, gamPh = 0, tremPh = 0, scoopSemis = 0, age = 0, holdLeft = 0, jitter = 0, nzf = 0;
  double Lb = 20, Ln = 80; int pc = 0; double pan = 0.5, detune = 0, gainTrim = 1; long long startDelay = 0; int group = -1, art = 0; double attackK = 0.01, relK = 0.001, swell = 1; uint32_t seed = 1;
  explicit Str(long long maxLen) : neck(maxLen), bridge(maxLen) {}
};
inline void clearStr(Str& s) {
  s.neck.clear(); s.bridge.clear(); s.lpB = s.lpN = s.lev = s.ring = s.pendingPluck = 0; s.on = s.plucked = false; s.state = 0; s.bowEnv = s.bowTarget = 0; s.relDamp = 1;
  s.vibPh = s.vibAge = s.gamPh = s.tremPh = s.scoopSemis = s.age = s.holdLeft = 0; s.startDelay = 0; s.group = -1;
}
struct Grp { bool on = false, held = false; int note = 0, nPl = 1; double vel = 0.7; int age = 0; int sv[8] = {0, 0, 0, 0, 0, 0, 0, 0}; int art = 0; };
struct SympC { DelayLine d; double z = 0, len = 100, fb = 0.999; bool on = false; explicit SympC(long long m) : d(m) {} };
inline double bowTable(double dv, double slope) { double x = std::fabs(dv) * slope + 0.75, x2 = x * x; return clampd(1 / (x2 * x2), 0.01, 0.98); }
static const double DRATIOS[3] = {0.75, 2.0 / 3, 0.9375};

struct Engine : EngineBase {
  std::vector<Spec> specs; std::vector<Str> pool, droneStr; std::vector<SympC> symp; Grp grp[kVoices]; std::vector<int> held; Biquad body[2][kModes], hp[2]; double lpz[2] = {0, 0}, lpA = 0.5; Rev rev; Noise rng;
  double bend = 0, bendS = 0, mw = 0, expr = 1, expS = 1, press = 0, dt = 0, dronePh = 0, volG = 1, glideK = 0.01, glideK4 = 0.04, instGain = 1, beta = 0.11; bool mwSeen = false;
  int ageCtr = 0, nonFinite = 0, droneIdx = 0, nSymp = 0; const Inst* inst = &INST[0];
  explicit Engine(double s) : EngineBase(s), rev(s), rng(0x9E3779B9u) {
    specs = makeSpecs(); initParams(specs); dt = 1 / sr;
    long long maxLen = (long long)std::floor(sr / 18) + 64; for (int i = 0; i < kPool; ++i) pool.emplace_back(maxLen);
    for (int i = 0; i < 4; ++i) droneStr.emplace_back(maxLen);
    for (int i = 0; i < 12; ++i) symp.emplace_back((long long)std::floor(sr / 20) + 64);
    loadInstrument(0, false);
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mw = m; mwSeen = true; } void pressure(double p) override { press = p; }
  void allNotesOff() override { for (auto& g : grp) if (g.on) release(g); held.clear(); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    if (id == Preset) { loadInstrument((int)std::max(0.0, std::min(double(nI - 1), std::floor(x + 0.5))), true); return; }
    v[(size_t)id] = x; configure();
  }
  void put(int id, double val, bool notify) { v[(size_t)id] = val; if (notify) writeParam(id, val); }
  void loadInstrument(int i, bool notify) {
    const Inst& n = INST[i]; v[Preset] = i; if (notify) writeParam(Preset, i);
    put(Bright, n.bright, notify); put(BowForce, n.force, notify); put(BowPos, n.pos, notify); put(BowNoise, n.noise, notify); put(Attack, n.attack, notify); put(Release, n.release, notify); put(VibRate, n.vibRate, notify); put(VibDepth, n.vibDepth, notify); put(VibDelay, n.vibDelay, notify);
    put(Buzz, n.buzz, notify); put(Sympath, n.symp, notify); put(SympDecay, n.sympDecay, notify); put(Scoop, n.scoop, notify); put(Gamak, n.gamak, notify); put(Glide, n.glide, notify); put(Body, n.body, notify);
    configure();
  }
  double scaleCents(int note) { int pc = (((note - rnd(v[Tonic])) % 12) + 12) % 12; return SCALES[rnd(v[Scale])].off[pc]; }
  double noteHz(int note, double extra = 0) { return 440 * std::pow(2.0, (note + 12 * rnd(v[Octave]) - 69 + (v[Tune] + scaleCents(note) + extra) / 100) / 12); }
  void configure() {
    const Inst& n = INST[rnd(v[Preset])]; inst = &n; double size = std::pow(2.0, v[BodySize] * 0.01 * 0.4), bg = v[Body] / 60;
    for (int c = 0; c < 2; ++c) { for (int k = 0; k < kModes; ++k) body[c][k].set(BQ_PEAK, n.m[k][0] * size, n.m[k][1], n.m[k][2] * bg, sr); hp[c].set(BQ_HP, n.hp, 0.7, 0, sr); }
    lpA = std::exp(-2 * kPi * std::min(n.lp * (0.7 + 0.6 * v[Bright] / 100), sr * 0.45) / sr);
    beta = clampd(0.05 + 0.40 * std::pow(v[BowPos] * 0.01, 1.3), 0.04, 0.5); volG = dbToGain(v[Volume]); instGain = n.gain;
    glideK = v[Glide] < 1 ? 1 : 1 - std::exp(-1 / (v[Glide] * 0.001 * sr)); glideK4 = glideK >= 1 ? 1 : 1 - std::pow(1 - glideK, 8);
    rebuildSymp();
  }
  void rebuildSymp() {
    const ScaleDef& sc = SCALES[rnd(v[Scale])]; int tonic = rnd(v[Tonic]); double sd = v[SympDecay]; nSymp = 0;
    for (auto& c : symp) c.on = false;
    if (v[Sympath] < 0.5) return;
    int k = 0;
    for (int d = 0; d < sc.n && k < 11; ++d) { int note = 60 + ((tonic + sc.symp[d]) % 12); double hz = noteHz(note); SympC& q = symp[(size_t)k++]; q.on = true; q.len = sr / hz; q.fb = std::min(0.9998, std::pow(10.0, -3 * q.len / (sr * sd))); }
    { double hz = noteHz(48 + tonic); SympC& q = symp[(size_t)k++]; q.on = true; q.len = sr / hz; q.fb = std::min(0.9998, std::pow(10.0, -3 * q.len / (sr * sd))); }
    nSymp = k;
  }
  // a plucked string: a triangular displacement with its corner at the pluck point, plus a little noise for the finger or nail
  void pluck(Str& s, double amp) {
    double hz = std::pow(2.0, s.lf), bt = clampd(0.05 + 0.40 * std::pow(v[BowPos] * 0.01, 1.3), 0.05, 0.5), D = std::max(8.0, sr / hz - s.pole / (1 - s.pole) - 0.12);
    int Lb = (int)std::max(2.0, std::floor(bt * D + 0.5)), Ln = (int)std::max(2.0, std::floor((1 - bt) * D + 0.5)); s.neck.clear(); s.bridge.clear(); double z = 0;
    for (int i = Ln - 1; i >= 0; --i) { double x = double(i) / Ln, tri = x < 0.5 ? x * 2 : (1 - x) * 2; z = z * 0.5 + rng.white() * 0.5; s.neck.push(amp * 0.5 * (tri + 0.12 * z)); }
    for (int i = Lb - 1; i >= 0; --i) { double x = double(i) / Lb, tri = x < 0.5 ? x * 2 : (1 - x) * 2; z = z * 0.5 + rng.white() * 0.5; s.bridge.push(amp * 0.5 * (tri + 0.12 * z)); }
    s.ring = amp;
  }
  void startString(Str& s, double hz, double vel, int art, bool plucked, int player, int nPl, int groupIdx, uint32_t seed) {
    double spread = v[Spread] * 0.01; const Inst& n = *inst; clearStr(s); s.on = true; s.plucked = plucked; s.state = 1; s.art = art; s.group = groupIdx; s.seed = seed;
    double h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
    s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
    s.startDelay = nPl > 1 && player > 0 ? (long long)std::floor(h2 * spread * 0.022 * sr) : 0;
    s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
    s.vibPh = h3 * 6.2832; s.gamPh = 0; s.tremPh = h2; s.nzf = 0; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.age = 0; s.vibAge = 0; s.gainTrim = 1;
    s.lf = s.lfT = std::log2(hz); s.scoopSemis = -v[Scoop] * 0.01 * 2 * (plucked ? 0 : 1); s.bowDyn = vel;
    double b01 = v[Bright] * 0.01, f0 = hz; s.pole = clampd(0.66 - 0.60 * b01, 0.03, 0.7) * clampd(std::pow(f0 / 300, 0.22), 0.6, 1.5); s.pole = clampd(s.pole, 0.03, 0.85);
    double t60 = plucked ? n.t60 : n.t60 * 2.6; s.loopGain = std::min(0.99985, std::pow(10.0, -3 / (t60 * f0)));
    double velA = 1.3 - 0.8 * vel; s.attackK = 1 / std::max(8.0, v[Attack] * 0.001 * sr * velA * (art == 1 ? 0.2 : 1)); s.relK = std::exp(-1 / (v[Release] * 0.001 * sr));
    s.holdLeft = art == 1 ? sr * (0.07 + 0.08 * (1 - vel)) : 1e30; s.swell = art == 4 ? 0 : 1;
    if (plucked) { s.bowEnv = 0; if (s.startDelay == 0) pluck(s, 0.35 + 0.65 * vel); else s.pendingPluck = 0.35 + 0.65 * vel; }
  }
  void noteOn(int note, double vel) override {
    if (note >= 24 && note <= 28) { v[Articulation] = note - 24; writeParam(Articulation, v[Articulation]); return; }
    vel = clampd(vel, 0.02, 1); int art = rnd(v[Articulation]); bool pz = art == 2; double hz = noteHz(note, noteTune);
    if (v[Legato] > 0.5) {
      Grp* g = nullptr; for (auto& q : grp) if (q.on && q.held) { g = &q; break; }
      if (g) { held.push_back(note); g->note = note; retarget(*g, hz); return; }
    }
    int gi = -1;
    for (int i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
    const double inf = std::numeric_limits<double>::infinity();
    if (gi < 0) { double oldest = inf; for (int i = 0; i < kVoices; ++i) if (grp[i].age < oldest) { oldest = grp[i].age; gi = i; } for (int j = 0; j < grp[gi].nPl; ++j) pool[(size_t)grp[gi].sv[j]].on = false; grp[gi].on = false; }
    int nPl = 1 << (int)clampd(rnd(v[Players]), 0, 3);
    std::vector<int> got; for (int i = 0; i < kPool && (int)got.size() < nPl; ++i) if (!pool[(size_t)i].on) got.push_back(i);
    if ((int)got.size() < nPl) {
      for (int pass = 0; pass < kVoices && (int)got.size() < nPl; ++pass) {
        int vi = -1; double oldest = inf; for (int i = 0; i < kVoices; ++i) if (grp[i].on && i != gi && grp[i].age < oldest) { oldest = grp[i].age; vi = i; }
        if (vi < 0) break;
        for (int j = 0; j < grp[vi].nPl; ++j) pool[(size_t)grp[vi].sv[j]].on = false;
        grp[vi].on = false;
        for (int i = 0; i < kPool && (int)got.size() < nPl; ++i) if (!pool[(size_t)i].on && std::find(got.begin(), got.end(), i) == got.end()) got.push_back(i);
      }
    }
    if ((int)got.size() < nPl) return;
    Grp& g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++ageCtr; g.art = art; uint32_t seed = ((uint32_t)note * 2654435761u) ^ ((uint32_t)ageCtr * 40503u);
    for (int j = 0; j < nPl; ++j) { g.sv[j] = got[(size_t)j]; clearStr(pool[(size_t)got[(size_t)j]]); startString(pool[(size_t)got[(size_t)j]], hz, vel, art, pz, j, nPl, gi, seed); }
    held.push_back(note);
  }
  void retarget(Grp& g, double hz) { for (int j = 0; j < g.nPl; ++j) { Str& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; s.lfT = std::log2(hz); if (glideK >= 1) s.lf = s.lfT; if (s.state == 3) s.state = 2; } }
  void release(Grp& g) { g.held = false; for (int j = 0; j < g.nPl; ++j) { Str& s = pool[(size_t)g.sv[j]]; if (s.on && s.state != 3) s.state = 3; } }
  void noteOff(int note) override {
    auto it = std::find(held.begin(), held.end(), note); if (it != held.end()) held.erase(it);
    if (v[Legato] > 0.5) {
      for (auto& g : grp) if (g.on && g.held) {
        if (!held.empty()) { if (g.note == note) { g.note = held.back(); retarget(g, noteHz(g.note)); } } else release(g);
        return;
      }
    }
    for (auto& g : grp) if (g.on && g.held && g.note == note) { release(g); return; }
  }
  // one string, one sample
  double stepStr(Str& s, double extraCents, bool isDrone) {
    if (s.startDelay > 0) { if (--s.startDelay == 0 && s.pendingPluck > 0) { pluck(s, s.pendingPluck); s.pendingPluck = 0; } return 0; }
    bool mwVib = v[ModWheel] < 0.5; s.age += dt;
    double vb = 0;
    if (!s.plucked) {
      bool tremolo = s.art == 3;
      if (s.state == 1) { s.bowEnv += s.attackK; if (s.bowEnv >= 1) { s.bowEnv = 1; s.state = 2; } }
      else if (s.state == 2) { if (s.art == 1 && (s.holdLeft -= 1) <= 0) s.state = 3; }
      else if (s.state == 3) { s.bowEnv *= s.relK * (s.art == 1 ? 0.995 : 1); s.relDamp = std::max(0.88, s.relDamp - 0.00008); }
      if (s.art == 4) s.swell = std::min(1.0, s.swell + 1 / (0.7 * sr));
      double env = s.bowEnv * (s.art == 4 ? 0.25 + 0.75 * s.swell : 1);
      if (tremolo) { s.tremPh += 11.5 / sr; if (s.tremPh >= 1) s.tremPh -= 1; double sq = std::sin(6.2832 * s.tremPh); env *= 0.18 + 0.82 * clampd(sq * 2.2 + 0.5, 0, 1); }
      double dynNow = (!mwVib && mwSeen) ? clampd(mw + press * 0.3, 0, 1) : s.bowDyn;
      s.nzf = s.nzf * 0.7 + rng.white() * 0.3;
      double dyn = (!mwVib && mwSeen) ? dynNow : s.bowDyn, dc = dyn * dyn * 0.7 + dyn * 0.3;
      double nb = v[BowNoise] * 0.01, scratch = s.state == 1 ? 1 + 5 * (1 - s.bowEnv) : 1;
      vb = env * (0.012 + 0.30 * dc) * (1 + nb * 0.35 * scratch * s.nzf * 2);
    }
    int pk = s.pc; s.pc = (pk + 1) & 7;
    if (pk == 0) {
      double dt4 = 8 / sr;
      if (glideK < 1) s.lf += (s.lfT - s.lf) * glideK4; else s.lf = s.lfT;
      double cents = s.detune + extraCents + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (std::fabs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
      s.vibAge += dt4; {
        double depth = v[VibDepth] + (mwVib ? mw * 60 : 0), ramp = clampd((s.vibAge - v[VibDelay] * 0.001) / 0.35, 0, 1);
        s.vibPh += 6.2832 * v[VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; cents += depth * ramp * std::sin(s.vibPh) * (s.plucked ? 0 : 1);
      }
      if (v[Gamak] > 0.5 && !s.plucked && !isDrone) { s.gamPh += v[GamakRate] * s.jitter * dt4; if (s.gamPh >= 1) s.gamPh -= 1; double tri = s.gamPh < 0.5 ? s.gamPh * 2 : 2 - s.gamPh * 2, ramp = clampd((s.age - 0.12) / 0.25, 0, 1); cents += tri * tri * (3 - 2 * tri) * v[Gamak] * 0.01 * 120 * ramp; }
      cents += bendS * v[BendRange] * 100;
      double hz = std::pow(2.0, s.lf + cents / 1200);
      double D = sr / hz - s.pole / (1 - s.pole) - 0.12; D = clampd(D, 7, double(s.neck.mask) - 8);
      s.Lb = std::max(2.0, beta * D); s.Ln = std::max(2.0, (1 - beta) * D);
    }
    double bArr = s.bridge.read(s.Lb), nArr = s.neck.read(s.Ln);
    s.lpB = (1 - s.pole) * bArr + s.pole * s.lpB; s.lpN = 0.9 * nArr + 0.1 * s.lpN;
    double damp = s.relDamp * (s.plucked && s.state == 3 ? 0.985 : 1);
    double bridgeRefl = -s.lpB * s.loopGain * damp, nutRefl = -s.lpN * 0.996 * damp;
    double newVel = 0;
    if (!s.plucked && s.bowEnv > 1e-4) { double slope = 1.8 + 4.2 * (v[BowForce] * 0.01) * (0.75 + 0.5 * s.bowDyn), dv = vb - (bridgeRefl + nutRefl); newVel = dv * bowTable(dv, slope) * std::min(1.0, s.bowEnv * 8); }
    s.neck.push(bridgeRefl + newVel); s.bridge.push(nutRefl + newVel);
    double y = bArr;
    if (!(std::fabs(y) < 20)) { clearStr(s); ++nonFinite; return 0; }
    s.lev += (std::fabs(y) - s.lev) * 0.002;
    if (s.state == 3 && s.lev < 2e-5 && s.bowEnv < 1e-3) { s.on = false; s.state = 0; }
    else if (s.plucked && s.state >= 1 && s.lev < 1e-5 && s.age > 0.2) { s.on = false; s.state = 0; }
    return y;
  }
  void process(float* outL, float* outR, int n) override {
    double sympL = v[Sympath] * 0.01, bz = v[Buzz] * 0.01, rvMix = v[ReverbMix] * 0.01, droneG = dbToGain(v[DroneLevel]); int droneMode = rnd(v[Drone]);
    double lpAl = lpA;
    double norm0 = 1 / std::sqrt(double(1 << (int)clampd(rnd(v[Players]), 0, 3))), vg = volG * instGain * 0.9;
    double fbR = 0.7 + 0.28 * (v[ReverbSize] * 0.01), dm = 0.35;
    for (int i = 0; i < n; ++i) {
      bendS += (bend - bendS) * 0.01; expS += (expr - expS) * 0.002;
      double l = 0, r = 0, dL = 0, dR = 0; int nAct = 0;
      for (int gi = 0; gi < kVoices; ++gi) {
        Grp& g = grp[gi]; if (!g.on) continue; bool any = false;
        for (int j = 0; j < g.nPl; ++j) {
          Str& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; any = true; double y = stepStr(s, 0, false), gl = std::cos(s.pan * 1.5708), gr = std::sin(s.pan * 1.5708); l += y * gl; r += y * gr; nAct += 1;
        }
        if (!any) g.on = false;
      }
      if (nAct > 0) { l *= norm0; r *= norm0; }
      if (bz > 0) { l = l * (1 - 0.4 * bz) + bz * 0.12 * std::tanh(8 * l); r = r * (1 - 0.4 * bz) + bz * 0.12 * std::tanh(8 * r); }
      double bl = hp[0].run(l), br = hp[1].run(r);
      for (int k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
      lpz[0] = bl * (1 - lpAl) + lpz[0] * lpAl; lpz[1] = br * (1 - lpAl) + lpz[1] * lpAl; bl = lpz[0]; br = lpz[1];
      if (sympL > 0 && nSymp > 0) {
        double m = (l + r) * 0.5, sum = 0;
        for (int k = 0; k < nSymp; ++k) { SympC& q = symp[(size_t)k]; if (!q.on) continue; double y = q.d.read(q.len); q.z = y * 0.6 + q.z * 0.4; q.d.push(m * (1 - q.fb) * 2 + q.z * q.fb); sum += y; }
        double so = sum * sympL * 1.5; bl += so * 0.8; br += so * 0.8;
      }
      if (droneMode > 0) {
        dronePh += 1 / sr; double step = v[DroneSpeed] / 4;
        if (dronePh >= step) {
          dronePh -= step; double sa = noteHz(48 + rnd(v[Tonic])); int di = droneIdx; double rat = di == 0 ? DRATIOS[droneMode - 1] : (di == 3 ? 0.5 : 1.0), f = sa * rat;
          Str& s = droneStr[(size_t)di]; clearStr(s); s.on = true; s.plucked = true; s.state = 2; s.lf = s.lfT = std::log2(f); s.pole = 0.18; s.loopGain = std::min(0.9998, std::pow(10.0, -3 / (3.6 * f))); s.pan = 0.35 + 0.1 * di; s.seed = 77 + di;
          pluck(s, 0.6 + 0.2 * hashf((uint32_t)ageCtr, (uint32_t)di)); droneIdx = (di + 1) & 3;
        }
        for (int d = 0; d < 4; ++d) { Str& s = droneStr[(size_t)d]; if (!s.on) continue; double y = stepStr(s, 0, true), gl = std::cos(s.pan * 1.5708), gr = std::sin(s.pan * 1.5708); dL += y * gl; dR += y * gr; }
        dL = (dL * 0.6 + 0.35 * std::tanh(7 * dL)) * droneG * 1.4; dR = (dR * 0.6 + 0.35 * std::tanh(7 * dR)) * droneG * 1.4; bl += dL; br += dR;
      }
      double gain = vg * expS;
      double ol = bl * gain, orr = br * gain;
      if (rvMix > 0.001) { double x = (ol + orr) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; orr = orr * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
      ol = std::tanh(ol * 0.8) * 1.25; orr = std::tanh(orr * 0.8) * 1.25;
      if (!(ol == ol) || !(orr == orr)) { ++nonFinite; ol = orr = 0; }
      outL[i] = (float)ol; outR[i] = (float)orr;
    }
  }
};
inline Info info() {
  return Info{"stringica", "Stringica", "Modelled bowed and plucked strings: bow friction waveguide, resonant bodies, sympathetic strings, tanpura drone and microtonal scales; the Preset is the instrument.",
              makeSpecs(), makeGroups(), Theme{"stringica", 0xff2e1a10, 0xff0e0705, 0xffd98a3d, 0xfff7e8d0, 0xffffb866}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::stringica
