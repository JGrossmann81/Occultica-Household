// Reedica: modelled woodwinds. Single/double reed waveguides, air-jet flutes, free reeds and a Highland pipe with drones. The Preset is the instrument.
// 1:1 port of the web engine (Synths/worklet.js); the pitch / reed update runs every 8th sample as there.
#pragma once
#include "../common/engine.h"
#include <cmath>
namespace occ { namespace reedica {
enum { Preset, Volume, Players, Spread, Breath, Reed, Noise_, Bright, Body, Attack, Release, Tongue, Flutter, Membrane, VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange,
       Gamak, GamakRate, Scoop, Scale, Tonic, Tune, Octave, Drone, DroneLevel, ReverbMix, ReverbSize, Count };
constexpr int kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 6;
struct ScaleDef { const char* name; double off[12]; };
static const ScaleDef SCALES[] = {
  {"12-tone equal", {0,0,0,0,0,0,0,0,0,0,0,0}},
  {"Just (Shuddha)", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}},
  {"Raga Bhairav", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}},
  {"Raga Yaman", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}},
  {"Raga Todi", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}},
  {"Raga Kafi", {0,11.7,3.9,15.6,-13.7,-2,-9.8,2,13.7,-15.6,17.6,-11.7}},
  {"Pythagorean", {0,-9.8,3.9,-5.9,7.8,-2,11.7,2,-7.8,5.9,-3.9,9.8}},
  {"Chinese pentatonic", {0,0,3.9,0,7.8,0,0,2,0,5.9,0,0}},
  {"Japanese In", {0,0,0,0,0,0,0,2,0,0,0,0}},
  {"Maqam Rast", {0,0,0,50,0,0,0,0,0,0,50,0}},
  {"Maqam Bayati", {0,50,0,0,0,0,0,0,0,0,0,0}},
  {"Maqam Hijaz", {0,0,0,0,0,0,0,0,0,0,0,0}},
  {"Slendro-ish", {0,0,40,0,0,-20,0,20,0,0,-40,0}},
  {"Mongolian pentatonic", {0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0}},
};
struct Inst { const char* name; double model, slope, offs, pole, jet, even, bright, breath, reed, noise, attack, release, tongue, flutter, membrane, vibRate, vibDepth, vibDelay, scoop, gamak, glide, body, drone, droneDb, hp, lp, gain; double m[6][3]; };
static const Inst INST[] = {
  {"Clarinet", 0,-0.4,0.55,0.35,0,0,55,55,50,18,55,130,45,0,0,5.2,16,450,0,0,60,60,0,0,80,7500,1, {{330,6,5},{820,8,3},{1500,6,-2},{2400,5,2},{3300,4,-1},{4600,3,-3}}},
  {"Alto sax", 1,-0.4,0.55,0.28,0,0.3,60,58,50,24,50,160,45,0,0,5.4,26,380,6,0,70,65,0,0,100,8000,1, {{250,6,5},{600,8,4},{1100,6,3},{1900,5,3},{3000,4,1},{4400,3,-3}}},
  {"Tenor sax", 1,-0.42,0.55,0.3,0,0.3,52,58,50,26,55,180,40,0,0,5,28,420,6,0,80,68,0,0,80,6500,1.05, {{180,6,5},{440,8,4},{850,6,3},{1500,5,3},{2400,4,1},{3600,3,-3}}},
  {"Oboe", 2,-0.5,0.5,0.28,0,0,62,60,55,14,45,120,50,0,0,5.6,14,400,0,0,60,58,0,0,200,7500,1, {{1050,5,6},{1500,6,4},{2300,5,3},{3100,4,2},{4300,3,-1},{5800,3,-4}}},
  {"Bassoon", 2,-0.48,0.52,0.34,0,0,46,58,50,18,70,160,45,0,0,5,16,500,0,0,80,62,0,0,60,4200,1.1, {{230,6,5},{480,7,4},{850,6,3},{1250,5,3},{1800,4,1},{2700,3,-3}}},
  {"Flute", 3,0,0,0.55,0.35,0.15,55,55,50,30,80,150,50,0,0,5.4,18,450,0,0,90,55,0,0,180,9500,0.9, {{700,5,3},{1400,6,2},{2300,5,1},{3500,4,2},{5000,3,0},{7000,3,-3}}},
  {"Piccolo", 3,0,0,0.45,0.3,0.12,70,58,50,24,50,110,55,0,0,6,12,300,0,0,70,55,0,0,500,11000,0.9, {{1500,5,3},{2800,6,2},{4300,5,2},{6000,4,0},{8000,3,-2},{10000,3,-4}}},
  {"Recorder", 3,0,0,0.6,0.15,0.06,45,50,50,22,90,180,55,0,0,4.8,6,600,0,0,50,50,0,0,300,7000,0.9, {{900,5,3},{1700,6,2},{2700,5,0},{3900,4,0},{5200,3,-2},{6800,3,-4}}},
  {"Ocarina", 3,0,0,0.75,0.04,0.01,25,45,50,14,100,200,40,0,0,4.6,8,600,0,0,60,70,0,0,300,3800,1, {{800,5,4},{1600,7,0},{2400,5,-3},{3200,4,-4},{4000,3,-5},{5000,3,-6}}},
  {"Duduk", 2,-0.55,0.46,0.38,0,0,40,52,45,12,110,220,25,0,0,4.8,14,500,6,8,100,70,2,-26,120,4500,1.05, {{520,5,5},{980,6,5},{1400,5,3},{2000,4,1},{2800,3,-2},{3800,3,-5}}},
  {"Shehnai", 2,-0.55,0.46,0.3,0,0,56,62,50,20,80,200,40,0,0,5.4,28,250,20,30,110,60,1,-24,160,6500,1, {{760,5,5},{1300,6,5},{1900,5,4},{2700,4,3},{3800,3,0},{5200,3,-3}}},
  {"Zurna", 2,-0.6,0.44,0.24,0,0,72,68,55,24,60,140,60,0,0,5.6,14,250,8,14,90,60,0,0,200,9000,0.95, {{900,4,5},{1500,5,6},{2300,4,5},{3200,4,3},{4400,3,1},{6000,3,-2}}},
  {"Suona", 2,-0.6,0.44,0.22,0,0,78,70,55,26,60,150,65,0,0,5.8,18,250,14,12,90,58,0,0,240,9500,0.95, {{1000,4,5},{1700,5,6},{2500,4,5},{3500,4,3},{4700,3,1},{6200,3,-2}}},
  {"Ney", 3,0,0,0.62,0.55,0.3,40,52,50,55,120,240,45,0,0,4.8,20,500,10,12,100,55,3,-24,150,6500,1, {{500,5,4},{1000,6,2},{1700,5,1},{2600,4,0},{3800,3,-2},{5200,3,-4}}},
  {"Shakuhachi", 3,0,0,0.62,0.5,0.28,38,56,50,60,110,260,40,0,0,4.4,24,550,24,8,130,50,0,0,140,5800,1, {{450,5,4},{900,6,2},{1500,5,1},{2300,4,0},{3300,3,-2},{4600,3,-4}}},
  {"Bansuri", 3,0,0,0.66,0.4,0.2,42,50,50,45,120,260,30,0,0,5,16,450,14,22,120,60,1,-24,160,6000,1, {{550,5,4},{1050,6,2},{1700,5,1},{2500,4,0},{3600,3,-2},{4900,3,-4}}},
  {"Dizi", 3,0,0,0.5,0.5,0.3,66,58,50,30,60,150,55,0,60,5.6,14,350,8,12,80,55,0,0,250,9500,0.95, {{900,5,3},{1700,6,3},{2700,5,2},{3800,4,3},{5200,3,1},{7000,3,-2}}},
  {"Sheng", 4,0,0,0.5,0,0,55,55,50,12,120,230,10,0,0,4.6,6,500,0,0,100,65,0,0,150,5200,0.9, {{480,5,3},{900,6,3},{1500,5,2},{2300,4,0},{3400,3,-2},{4800,3,-4}}},
  {"Khaen", 4,0,0,0.5,0,0,48,55,50,12,140,260,10,0,0,4.4,8,500,0,0,100,65,3,-28,120,4600,0.9, {{420,5,3},{820,6,3},{1300,5,2},{2000,4,0},{3000,3,-2},{4200,3,-4}}},
  {"Highland pipe", 5,-0.55,0.46,0.26,0,0,70,70,60,10,60,90,30,0,0,5,0,0,0,0,40,60,3,-22,260,7500,0.95, {{750,4,6},{1250,5,6},{1900,4,5},{2800,4,4},{3900,3,1},{5300,3,-3}}},
};
constexpr int nI = 20, nScales = 14;
inline double dbToGain(double db) { return std::pow(10.0, db / 20); }
inline double hashf(uint32_t x, uint32_t y) { uint32_t h = x * 374761393u + y * 668265263u; h = (h ^ (h >> 13)) * 1274126177u; h = h ^ (h >> 16); return double(h & 0xFFFFFFu) / 16777215.0; }
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
// Freeverb-style room; delay buffers are float as in the web engine.
struct Rev {
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8] = {}, ai[2][4] = {}; double cz[2][8] = {};
  explicit Rev(double sr) {
    const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) cb[ch][k].assign((size_t)std::floor((ct[k] + ch * 23) * sr / 44100) + 1, 0.f);
      for (int k = 0; k < 4; ++k) ab[ch][k].assign((size_t)std::floor((at[k] + ch * 23) * sr / 44100) + 1, 0.f);
    }
  }
  double tick(int ch, double x, double fb, double damp) {
    double s = 0;
    for (int k = 0; k < 8; ++k) { std::vector<float>& b = cb[ch][k]; int i = ci[ch][k]; double y = b[(size_t)i]; double z = y * (1 - damp) + cz[ch][k] * damp; cz[ch][k] = z; b[(size_t)i] = (float)(x + z * fb); ci[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s += y; }
    for (int k = 0; k < 4; ++k) { std::vector<float>& b = ab[ch][k]; int i = ai[ch][k]; double bo = b[(size_t)i]; double y = -s + bo; b[(size_t)i] = (float)(s + bo * 0.5); ai[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s = y; }
    return s;
  }
};
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> names, scn; for (int i = 0; i < nI; ++i) names.push_back(INST[i].name); for (int i = 0; i < nScales; ++i) scn.push_back(SCALES[i].name);
  return {
    P("Preset", "", 0, nI - 1, 0, "%.0f", false, names),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"),
    P("Players", "", 0, 3, 0, "%.0f", false, {"Solo", "Duo", "Section 4", "Ensemble 8"}),
    P("Spread", "%", 0, 100, 40, "%.0f %%"),
    P("Breath", "%", 0, 100, 55, "%.0f %%"),
    P("Reed", "%", 0, 100, 50, "%.0f %%"),
    P("Air noise", "%", 0, 100, 18, "%.0f %%"),
    P("Brightness", "%", 0, 100, 55, "%.0f %%"),
    P("Body", "%", 0, 100, 60, "%.0f %%"),
    P("Attack", "ms", 5, 600, 55, "%.0f ms", true),
    P("Release", "ms", 10, 2000, 130, "%.0f ms", true),
    P("Tongue", "%", 0, 100, 45, "%.0f %%"),
    P("Flutter", "%", 0, 100, 0, "%.0f %%"),
    P("Membrane", "%", 0, 100, 0, "%.0f %%"),
    P("Vibrato depth", "cents", 0, 100, 16, "%.0f c"),
    P("Vibrato rate", "Hz", 2, 9, 5.2, "%.1f Hz"),
    P("Vibrato delay", "ms", 0, 1500, 450, "%.0f ms"),
    P("Mod wheel", "", 0, 1, 0, "%.0f", false, {"Vibrato", "Breath"}),
    P("Legato", "", 0, 1, 0, "%.0f", false, {"Poly", "Mono legato"}),
    P("Glide", "ms", 0, 800, 60, "%.0f ms"),
    P("Bend range", "st", 1, 12, 2, "%.0f st"),
    P("Gamak", "%", 0, 100, 0, "%.0f %%"),
    P("Gamak rate", "Hz", 2, 10, 6, "%.1f Hz"),
    P("Scoop", "%", 0, 100, 0, "%.0f %%"),
    P("Scale", "", 0, nScales - 1, 0, "%.0f", false, scn),
    P("Tonic", "", 0, 11, 0, "%.0f", false, {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}),
    P("Tune", "cents", -50, 50, 0, "%.0f c"),
    P("Octave", "", -2, 2, 0, "%.0f"),
    P("Drone", "", 0, 3, 0, "%.0f", false, {"Off", "Sa-Pa", "Sa-Ma", "Pipes"}),
    P("Drone level", "dB", -40, 0, 0, "%.0f dB"),
    P("Reverb mix", "%", 0, 100, 18, "%.0f %%"),
    P("Reverb size", "%", 0, 100, 50, "%.0f %%"),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Instrument sound", {Breath, Reed, Noise_, Bright, Body, Membrane}},
          {"Articulation", {Attack, Release, Tongue, Flutter, Scoop, Gamak, GamakRate}},
          {"Expression", {VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange}},
          {"Section", {Players, Spread}},
          {"Scale and tuning", {Scale, Tonic, Tune, Octave}},
          {"Drone", {Drone, DroneLevel}},
          {"Output", {Volume, ReverbMix, ReverbSize}}};
}
inline double rnd(double x) { return std::floor(x + 0.5); }
struct RVoice {
  DelayLine d; double n1a = 0, n1b = 0, n2a = 0, n2b = 0, rc1 = 0, rc2 = 0, rg = 0, qc1 = 0, qc2 = 0, qg = 0, z = 0, dcx = 0, dcy = 0, lev = 0, agc = 1, fol = 0, env = 0, nz = 0, hpz = 0, bz = 0, relK = 0.001, attackK = 0.01, tong = 0, dyn = 0.7, flPh = 0,
         lf = 6, lfT = 6, D = 50, ph[3] = {0, 0, 0}, fz1 = 0, fz2 = 0; bool on = false; int state = 0, pc = 0; double startDelay = 0; int group = -1; double pan = 0.5, detune = 0, vibPh = 0, vibAge = 0, gamPh = 0, scoopSemis = 0, age = 0, jitter = 1, pole = 0.3; uint32_t seed = 1;
  explicit RVoice(long long maxLen) : d(maxLen) {}
};
inline void clearVoice(RVoice& s) {
  s.d.clear(); s.n1a = s.n1b = s.n2a = s.n2b = 0; s.z = s.dcx = s.dcy = s.lev = s.fol = s.nz = s.hpz = s.bz = s.tong = s.flPh = s.fz1 = s.fz2 = 0; s.agc = 1; s.env = 0; s.on = false; s.state = 0; s.pc = 0; s.startDelay = 0; s.group = -1;
  s.vibPh = s.vibAge = s.gamPh = s.scoopSemis = s.age = 0; s.ph[0] = s.ph[1] = s.ph[2] = 0;
}
struct RGroup { bool on = false, held = false; int note = 0, nPl = 1; double vel = 0.7; double age = 0; int sv[8] = {0, 0, 0, 0, 0, 0, 0, 0}; };
struct Drn { double ph[4] = {0, 0, 0, 0}, lp1 = 0, lp2 = 0, lev = 0; };
static const double DRATIO[3][3] = {{0.75, 1.0, 0.5}, {0.6667, 1.0, 0.5}, {0.5, 0.5, 0.25}};
static const double MULS[3] = {1.0, 1.5, 2.0}, AMPS[3] = {1, 0.42, 0.5};
struct Engine : EngineBase {
  std::vector<Spec> specs; double dt; std::vector<RVoice> pool; RGroup grp[kVoices]; Drn drn[3]; std::vector<int> held; Biquad body[2][kModes], hp[2];
  double lpz[2] = {0, 0}, lpA = 0.5; Rev rev; occ::Noise rng;
  double bend = 0, bendS = 0, mw = 0; bool mwSeen = false; double expr = 1, expS = 1, press = 0; int ageCtr = 0; int nonFinite = 0;
  double volG = 1, glideK = 0.01, glideK4 = 0.04, instGain = 1; const Inst* inst = &INST[0];
  explicit Engine(double s) : EngineBase(s), dt(1 / s), rev(s), rng(0x9E3779B9u) {
    specs = makeSpecs(); initParams(specs);
    long long maxLen = (long long)std::floor(sr / 18) + 64; pool.reserve(kPool); for (int i = 0; i < kPool; ++i) pool.emplace_back(maxLen);
    held.reserve(256);
    loadInstrument(0, false);
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mw = m; mwSeen = true; } void pressure(double p) override { press = p; }
  void allNotesOff() override { for (auto& g : grp) if (g.on) release(g); held.clear(); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    if (id == Preset) { loadInstrument((int)std::max(0.0, std::min((double)nI - 1, rnd(x))), true); return; }
    v[(size_t)id] = x; configure();
  }
  void loadInstrument(int i, bool notify) {
    const Inst& n = INST[i]; std::vector<double>& V = v; V[Preset] = i; if (notify) writeParam(Preset, i);
    auto put = [&](int id, double val) { V[(size_t)id] = val; if (notify) writeParam(id, val); };
    put(Bright, n.bright); put(Breath, n.breath); put(Reed, n.reed); put(Noise_, n.noise); put(Attack, n.attack); put(Release, n.release); put(Tongue, n.tongue); put(Flutter, n.flutter); put(Membrane, n.membrane);
    put(VibRate, n.vibRate); put(VibDepth, n.vibDepth); put(VibDelay, n.vibDelay); put(Scoop, n.scoop); put(Gamak, n.gamak); put(Glide, n.glide); put(Body, n.body); put(Drone, n.drone); put(DroneLevel, n.droneDb);
    configure();
  }
  int scIdx() const { return (int)clampd(rnd(v[Scale]), 0, nScales - 1); }
  double scaleCents(int note) const { int pc = (((note - (int)rnd(v[Tonic])) % 12) + 12) % 12; return SCALES[scIdx()].off[pc]; }
  double noteHz(int note, double extra = 0) const { return 440 * std::pow(2.0, (note + 12 * rnd(v[Octave]) - 69 + (v[Tune] + scaleCents(note) + extra) / 100) / 12); }
  void configure() {
    const std::vector<double>& V = v; const Inst& n = INST[(int)clampd(rnd(V[Preset]), 0, nI - 1)]; inst = &n; double bg = V[Body] / 60;
    for (int c = 0; c < 2; ++c) { for (int k = 0; k < kModes; ++k) body[c][k].set(BQ_PEAK, n.m[k][0], n.m[k][1], n.m[k][2] * bg, sr); hp[c].set(BQ_HP, n.hp, 0.7, 0, sr); }
    lpA = std::exp(-2 * kPi * std::min(n.lp * (0.6 + 0.8 * V[Bright] / 100), sr * 0.45) / sr);
    volG = dbToGain(V[Volume]); instGain = n.gain;
    glideK = V[Glide] < 1 ? 1 : 1 - std::exp(-1 / (V[Glide] * 0.001 * sr)); glideK4 = glideK >= 1 ? 1 : 1 - std::pow(1 - glideK, 8);
  }
  void startVoice(RVoice& s, double hz, double vel, int player, int nPl, int groupIdx, uint32_t seed) {
    const std::vector<double>& V = v; double spread = V[Spread] * 0.01; clearVoice(s); s.on = true; s.state = 1; s.group = groupIdx; s.seed = seed;
    double h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
    s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
    s.startDelay = nPl > 1 && player > 0 ? std::floor(h2 * spread * 0.022 * sr) : 0;
    s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
    s.vibPh = h3 * 6.2832; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.dyn = vel;
    s.lf = s.lfT = std::log2(hz); s.scoopSemis = -V[Scoop] * 0.01 * 2; s.tong = V[Tongue] * 0.01 * (0.4 + 0.6 * vel);
    s.attackK = 1 / std::max(8.0, V[Attack] * 0.001 * sr * (1.3 - 0.6 * vel)); s.relK = std::exp(-1 / (V[Release] * 0.001 * sr));
    for (int k = 0; k < 3; ++k) s.ph[k] = hashf(seed, 50 + player * 3 + k);
    s.nz = rng.white() * 0.01;
  }
  void noteOn(int note, double vel) override {
    const std::vector<double>& V = v; vel = clampd(vel, 0.02, 1); double hz = noteHz(note, noteTune);
    if (V[Legato] > 0.5) {
      RGroup* g = nullptr; for (auto& q : grp) if (q.on && q.held) { g = &q; break; }
      if (g) { held.push_back(note); g->note = note; retarget(*g, hz); return; }
    }
    int gi = -1;
    for (int i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
    if (gi < 0) { double oldest = 1e300; for (int i = 0; i < kVoices; ++i) if (grp[i].age < oldest) { oldest = grp[i].age; gi = i; } for (int j = 0; j < grp[gi].nPl; ++j) pool[(size_t)grp[gi].sv[j]].on = false; grp[gi].on = false; }
    int nPl = 1 << (int)clampd(rnd(V[Players]), 0, 3);
    int got[8]; int ng = 0; for (int i = 0; i < kPool && ng < nPl; ++i) if (!pool[(size_t)i].on) got[ng++] = i;
    if (ng < nPl) {
      for (int pass = 0; pass < kVoices && ng < nPl; ++pass) {
        int vi = -1; double oldest = 1e300; for (int i = 0; i < kVoices; ++i) if (grp[i].on && i != gi && grp[i].age < oldest) { oldest = grp[i].age; vi = i; }
        if (vi < 0) break;
        for (int j = 0; j < grp[vi].nPl; ++j) pool[(size_t)grp[vi].sv[j]].on = false;
        grp[vi].on = false;
        for (int i = 0; i < kPool && ng < nPl; ++i) if (!pool[(size_t)i].on) { bool dup = false; for (int q = 0; q < ng; ++q) if (got[q] == i) dup = true; if (!dup) got[ng++] = i; }
      }
    }
    if (ng < nPl) return;
    RGroup& g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++ageCtr; uint32_t seed = ((uint32_t)note * 2654435761u) ^ ((uint32_t)ageCtr * 40503u);
    for (int j = 0; j < nPl; ++j) { g.sv[j] = got[j]; clearVoice(pool[(size_t)got[j]]); startVoice(pool[(size_t)got[j]], hz, vel, j, nPl, gi, seed); }
    held.push_back(note);
  }
  void retarget(RGroup& g, double hz) { for (int j = 0; j < g.nPl; ++j) { RVoice& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; s.lfT = std::log2(hz); if (glideK >= 1) s.lf = s.lfT; if (s.state == 3) s.state = 2; } }
  void release(RGroup& g) { g.held = false; for (int j = 0; j < g.nPl; ++j) { RVoice& s = pool[(size_t)g.sv[j]]; if (s.on && s.state != 3) s.state = 3; } }
  void noteOff(int note) override {
    for (size_t k = 0; k < held.size(); ++k) if (held[k] == note) { held.erase(held.begin() + (long)k); break; }
    if (v[Legato] > 0.5) {
      for (auto& g : grp) if (g.on && g.held) {
        if (!held.empty()) { if (g.note == note) { g.note = held.back(); retarget(g, noteHz(g.note)); } } else release(g);
        return;
      }
    }
    for (auto& g : grp) if (g.on && g.held && g.note == note) { release(g); return; }
  }
  // one voice, one sample
  double stepV(RVoice& s) {
    if (s.startDelay > 0) { --s.startDelay; return 0; }
    const std::vector<double>& V = v; const Inst& inn = *inst; bool mwVib = V[ModWheel] < 0.5; int model = (int)inn.model; s.age += dt;
    if (s.state == 1) { s.env += s.attackK; if (s.env >= 1) { s.env = 1; s.state = 2; } } else if (s.state == 3) s.env *= s.relK;
    double dyn = (!mwVib && mwSeen) ? clampd(mw + press * 0.3, 0, 1) : s.dyn;
    s.tong *= 1 - 38 * dt;
    double pressure = 0.5 + 0.5 * dyn;
    double flut = 1; if (V[Flutter] > 0.5) { s.flPh += 24 * dt; if (s.flPh >= 1) s.flPh -= 1; double sq = std::sin(6.2832 * s.flPh); flut = 1 - V[Flutter] * 0.01 * 0.85 * clampd(sq * 2.5 + 0.5, 0, 1); }
    int pk = s.pc; s.pc = (pk + 1) & 7;
    if (pk == 0) {
      double dt4 = 8 * dt;
      if (glideK < 1) s.lf += (s.lfT - s.lf) * glideK4; else s.lf = s.lfT;
      double cents = s.detune + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (std::fabs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
      s.vibAge += dt4; {
        double depth = V[VibDepth] + (mwVib ? mw * 60 : 0), ramp = clampd((s.vibAge - V[VibDelay] * 0.001) / 0.35, 0, 1);
        s.vibPh += 6.2832 * V[VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; cents += depth * ramp * std::sin(s.vibPh);
      }
      if (V[Gamak] > 0.5) { s.gamPh += V[GamakRate] * s.jitter * dt4; if (s.gamPh >= 1) s.gamPh -= 1; double tri = s.gamPh < 0.5 ? s.gamPh * 2 : 2 - s.gamPh * 2, ramp = clampd((s.age - 0.12) / 0.25, 0, 1); cents += tri * tri * (3 - 2 * tri) * V[Gamak] * 0.01 * 120 * ramp; }
      cents += bendS * V[BendRange] * 100;
      double hz = std::pow(2.0, s.lf + cents / 1200); s.D = hz;
      double b01 = V[Bright] * 0.01; s.pole = clampd(inn.pole + (0.5 - b01) * 0.5 - (dyn - 0.5) * 0.12, 0.02, 0.85);
      double comp = s.pole / (1 - s.pole);
      if (model == 3) {
        double Q = 10 + 0.4 * V[Reed], f2 = std::min(2 * hz, sr * 0.45);
        double r = 1 - kPi * std::max(hz / Q, 18.0) / sr, a1 = 2 * r * std::cos(2 * kPi * hz / sr), a2 = -r * r, vr = (1 - a2) / ((1 + a2) * ((1 - a2) * (1 - a2) - a1 * a1));
        s.rc1 = a1; s.rc2 = a2; s.rg = 1 / std::sqrt(std::max(vr, 1e-6));
        r = 1 - kPi * std::max(f2 / Q, 18.0) / sr; a1 = 2 * r * std::cos(2 * kPi * f2 / sr); a2 = -r * r; vr = (1 - a2) / ((1 + a2) * ((1 - a2) * (1 - a2) - a1 * a1));
        s.qc1 = a1; s.qc2 = a2; s.qg = 1 / std::sqrt(std::max(vr, 1e-6));
      } else if (model != 4) s.D = clampd(sr / (2 * hz) - comp, 4, double(s.d.mask - 8));
      s.lev = hz;
    }
    double nzAmt = V[Noise_] * 0.01; s.nz = s.nz * 0.55 + rng.white() * 0.45; double airNz = s.nz;
    double tongPush = 1 + s.tong * 1.6;
    double y = 0;
    if (model <= 2 || model == 5) {
      double reed = (V[Reed] - 50) * 0.01;
      double offs = clampd(inn.offs + reed * 0.10, 0.30, 0.80), slope = inn.slope * (1 + reed * 0.25);
      double bt = (model == 5 ? 0.80 : 0.62 + 0.22 * pressure * (0.7 + 0.6 * V[Breath] * 0.01)); bt = std::min(bt * tongPush, 1.15) * flut;
      double b = bt * (0.55 + 0.45 * std::min(1.0, s.env * 3)) * (1 + nzAmt * 0.10 * airNz) * (1 + 0.08 * V[VibDepth] * 0.01 * std::sin(s.vibPh));
      double arr = s.d.read(s.D); s.z = (1 - s.pole) * arr + s.pole * s.z;
      double refl = -(model == 2 || model == 5 ? 0.93 : 0.95) * s.z, pd = refl - b, tbl = clampd(offs + slope * pd, -1, 1), o = b + pd * tbl;
      s.d.push(o); y = arr;
      if (inn.even > 0) { double sq = y * y; s.bz += (sq - s.bz) * 0.001; y += inn.even * 1.6 * (sq - s.bz); }
      s.fol += (std::fabs(y) - s.fol) * 0.003;
    } else if (model == 3) {
      double hz = s.lev; s.ph[0] += hz / sr; if (s.ph[0] >= 1) s.ph[0] -= 1; double w = 6.2831853 * s.ph[0];
      double br = 0.35 + 0.65 * dyn, bgt = 0.4 + 1.2 * V[Bright] * 0.01, a2 = inn.jet * br * bgt, a3 = inn.even * br * bgt;
      double tone = (std::sin(w) + a2 * std::sin(2 * w + 0.6) + a3 * std::sin(3 * w + 1.1) + 0.5 * a3 * std::sin(4 * w + 0.3)) * (1 + 0.20 * V[VibDepth] * 0.01 * std::sin(s.vibPh)) * flut;
      double x = rng.white(), q1 = x * s.rg + s.rc1 * s.n1a + s.rc2 * s.n1b; s.n1b = s.n1a; s.n1a = q1; double q2 = x * s.qg + s.qc1 * s.n2a + s.qc2 * s.n2b; s.n2b = s.n2a; s.n2a = q2;
      double air = (q1 + 0.6 * q2) * nzAmt * 0.9 * (1 + s.tong * 3);
      y = tone + air; s.fol += (std::fabs(y) - s.fol) * 0.003;
    } else {
      double hz = s.lev; double acc = 0;
      for (int k = 0; k < 3; ++k) { double f = hz * MULS[k] * (1 + 0.0007 * (k - 1)), dtp = f / sr; s.ph[k] += dtp; if (s.ph[k] >= 1) s.ph[k] -= 1; double saw = 2 * s.ph[k] - 1 - polyBlep(s.ph[k], dtp); acc += AMPS[k] * (saw * 0.9 + 0.1 * airNz); }
      y = acc * 0.45 * flut * (1 + 0.2 * s.tong); s.fz1 += (y - s.fz1) * 0.45; y = s.fz1; s.fol += (std::fabs(y) - s.fol) * 0.003;
      y += airNz * nzAmt * 0.02;
    }
    double level = s.env * (0.10 + 0.90 * dyn * dyn * 0.8 + 0.1 * dyn) * (1 + s.tong * 0.6) * (model == 5 ? 0.7 : 1);
    double want = clampd(level * 0.28 / std::max(s.fol, 0.002), 0, 8); s.agc += (want - s.agc) * 0.004; y *= s.agc;
    if (model != 3 && model != 4) y += airNz * nzAmt * 0.012 * level;
    if (V[Membrane] > 0.5) { double m = V[Membrane] * 0.01; s.hpz += (y - s.hpz) * 0.35; double hpx = y - s.hpz; y += m * 0.55 * std::tanh(9 * hpx + 0.4 * y); }
    if (!(std::fabs(y) < 20)) { clearVoice(s); ++nonFinite; return 0; }
    if (s.state == 3 && s.env < 1e-3) { s.on = false; s.state = 0; }
    return y;
  }
  void process(float* outL, float* outR, int n) override {
    const std::vector<double>& V = v; double rvMix = V[ReverbMix] * 0.01, droneG = dbToGain(V[DroneLevel]); int droneMode = (int)clampd(rnd(V[Drone]), 0, 3);
    double lpA_ = lpA;
    double norm0 = 1 / std::sqrt((double)(1 << (int)clampd(rnd(V[Players]), 0, 3))), volG_ = volG * instGain * 0.9;
    double fbR = 0.7 + 0.28 * (V[ReverbSize] * 0.01), dm = 0.35;
    double sa = 0; const double* ratio = nullptr;
    if (droneMode > 0) { sa = droneMode == 3 ? noteHz(60 + (int)rnd(V[Tonic])) : noteHz(48 + (int)rnd(V[Tonic])); ratio = DRATIO[droneMode - 1]; }
    for (int i = 0; i < n; ++i) {
      bendS += (bend - bendS) * 0.01; expS += (expr - expS) * 0.002;
      double l = 0, r = 0; int nAct = 0;
      for (int gi = 0; gi < kVoices; ++gi) {
        RGroup& g = grp[gi]; if (!g.on) continue; bool any = false;
        for (int j = 0; j < g.nPl; ++j) {
          RVoice& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; any = true; double y = stepV(s), gl = std::cos(s.pan * 1.5708), gr = std::sin(s.pan * 1.5708); l += y * gl; r += y * gr; nAct += 1;
        }
        if (!any) g.on = false;
      }
      if (nAct > 0) { l *= norm0; r *= norm0; }
      double bl = hp[0].run(l), br = hp[1].run(r);
      for (int k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
      lpz[0] = bl * (1 - lpA_) + lpz[0] * lpA_; lpz[1] = br * (1 - lpA_) + lpz[1] * lpA_; bl = lpz[0]; br = lpz[1];
      if (droneMode > 0) {
        double dm_ = 0, dr = 0;
        for (int d = 0; d < 3; ++d) {
          Drn& q = drn[d]; double f = sa * ratio[d] * (1 + 0.0011 * (d - 1)); double acc = 0; double dtp = f / sr;
          for (int k = 0; k < 2; ++k) { q.ph[k] += dtp * (k ? 1.004 : 1); if (q.ph[k] >= 1) q.ph[k] -= 1; double saw = 2 * q.ph[k] - 1; saw -= polyBlep(q.ph[k], dtp); acc += saw * 0.5; }
          q.lp1 += (acc - q.lp1) * 0.12; q.lp2 += (q.lp1 - q.lp2) * 0.12; q.lev += (1 - q.lev) * 0.0004; double pn = 0.3 + 0.2 * d; dm_ += q.lp2 * q.lev * std::cos(pn * 1.5708); dr += q.lp2 * q.lev * std::sin(pn * 1.5708);
        }
        bl += dm_ * droneG * 1.6; br += dr * droneG * 1.6;
      }
      double gain = volG_ * expS;
      double ol = bl * gain, or_ = br * gain;
      if (rvMix > 0.001) { double x = (ol + or_) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; or_ = or_ * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
      ol = std::tanh(ol * 0.8) * 1.25; or_ = std::tanh(or_ * 0.8) * 1.25;
      if (!(ol == ol) || !(or_ == or_)) { ++nonFinite; ol = or_ = 0; }
      outL[i] = (float)ol; outR[i] = (float)or_;
    }
  }
};
inline Info info() {
  return Info{"reedica", "Reedica", "Modelled woodwinds: single and double reeds, air-jet flutes (ney, shakuhachi, bansuri, dizi ...), free reeds (sheng, khaen) and a Highland pipe with drones. The Preset is the instrument.", makeSpecs(), makeGroups(),
              Theme{"reedica", 0xff2e2012, 0xff0e0803, 0xffe3b25f, 0xfff8ebd0, 0xfff3cf86}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::reedica
