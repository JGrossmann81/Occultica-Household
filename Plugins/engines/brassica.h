// Brassica: modelled brass (lip resonator + waveguide bore, bell brightening, mutes, flutter-tongue, shakes, drone, microtonal scales). 1:1 port of the web engine.
// The Preset is the instrument (trumpet ... karnay); choosing it loads that instrument's settings into the sliders. The pitch/bore/lip update runs every 8th sample.
#pragma once
#include "../common/engine.h"
#include <limits>
namespace occ { namespace brassica {
enum { Preset, Volume, Mute, Players, Spread, Breath, Lips, Buzz, Bright, Body, Attack, Release, Tongue, Flutter, Growl, VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange,
       Shake, ShakeRate, Scoop, Scale, Tonic, Tune, Octave, Drone, DroneLevel, ReverbMix, ReverbSize, Count };
constexpr int kVoices = 8, kMaxPlayers = 8, kPool = kVoices * kMaxPlayers, kModes = 6;
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
  {"Mongolian pentatonic", {0,0,3.9,0,-13.7,0,0,2,0,-15.6,0,0}, {0,2,4,7,9,0,0}, 5}};
constexpr int kScales = 14;
inline double dbToGain(double db) { return std::pow(10.0, db / 20); }
inline double hashf(uint32_t x, int y) { uint32_t h = x * 374761393u + (uint32_t)y * 668265263u; h = (h ^ (h >> 13)) * 1274126177u; h = h ^ (h >> 16); return double(h & 0xFFFFFFu) / 16777215.0; }
inline double rnd(double x) { return std::floor(x + 0.5); }  // Math.round
enum { BQ_PEAK = 0, BQ_LP = 3, BQ_HP = 4 };
struct Biquad {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double gainDb, double sr) {
    f = std::min(std::max(f, 5.0), sr * 0.49); q = std::max(0.05, q);
    const double A = std::pow(10.0, gainDb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q);
    double B0, B1, B2, A0, A1, A2;
    if (t == BQ_PEAK) { B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; }
    else if (t == BQ_LP) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
    else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { const double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
};
// Freeverb-style room
struct Rev {
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8] = {}, ai[2][4] = {}; double cz[2][8] = {};
  explicit Rev(double sr) {
    static const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) cb[ch][k].assign((size_t)(std::floor((ct[k] + ch * 23) * sr / 44100) + 1), 0.f);
      for (int k = 0; k < 4; ++k) ab[ch][k].assign((size_t)(std::floor((at[k] + ch * 23) * sr / 44100) + 1), 0.f);
    }
  }
  double tick(int ch, double x, double fb, double damp) {
    double s = 0;
    for (int k = 0; k < 8; ++k) {
      std::vector<float>& b = cb[ch][k]; const int i = ci[ch][k]; const double y = b[(size_t)i];
      const double z = y * (1 - damp) + cz[ch][k] * damp; cz[ch][k] = z; b[(size_t)i] = (float)(x + z * fb); ci[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s += y;
    }
    for (int k = 0; k < 4; ++k) {
      std::vector<float>& b = ab[ch][k]; const int i = ai[ch][k]; const double bo = b[(size_t)i];
      const double y = -s + bo; b[(size_t)i] = (float)(s + bo * 0.5); ai[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s = y;
    }
    return s;
  }
};
struct Raw { const char* name; double q[23]; double m[6][3]; };
static const Raw RAW[] = {
{"Trumpet", {117,0.18,62,62,55,18,40,120,55,0,0,5.4,18,350,0,0,40,60,0,0,150,11000,1}, {{1100,4,4},{1800,5,5},{2700,4,5},{3800,4,3},{5200,3,1},{7500,3,-3}}},
{"Cornet", {117,0.24,52,58,52,16,45,130,50,0,0,5.2,18,350,0,0,40,62,0,0,150,9500,1}, {{900,4,4},{1500,5,4},{2300,4,4},{3200,4,2},{4600,3,0},{6500,3,-3}}},
{"Flugelhorn", {117,0.36,38,52,48,14,55,160,40,0,0,5,20,400,0,0,50,66,0,0,130,6500,1.05}, {{500,4,5},{900,5,4},{1500,4,2},{2300,4,0},{3300,3,-2},{4600,3,-5}}},
{"Horn", {87,0.34,42,56,48,16,70,220,40,0,0,4.8,16,450,0,0,80,70,0,0,90,6000,1.1}, {{350,4,5},{700,5,5},{1100,4,4},{1700,4,2},{2600,3,-1},{3800,3,-4}}},
{"Trombone", {58,0.26,50,60,52,16,55,150,50,0,0,5,16,450,0,0,220,64,0,0,80,7500,1.1}, {{450,4,4},{800,5,4},{1300,4,4},{2000,4,3},{3000,3,0},{4400,3,-3}}},
{"Bass trombone", {41,0.3,44,60,50,16,70,180,45,0,0,4.6,14,500,0,0,240,66,0,0,50,5200,1.15}, {{250,4,5},{500,5,5},{900,4,4},{1400,4,3},{2200,3,-1},{3300,3,-4}}},
{"Euphonium", {58,0.4,34,54,46,12,70,200,35,0,0,5,22,450,0,0,100,68,0,0,60,4600,1.15}, {{300,4,5},{560,5,5},{950,4,3},{1500,4,0},{2300,3,-3},{3300,3,-5}}},
{"Tuba", {29,0.46,28,56,44,12,90,240,40,0,0,4.2,12,600,0,0,120,70,0,0,30,2800,1.3}, {{110,4,6},{220,5,5},{400,4,4},{700,4,2},{1100,3,-2},{1800,3,-6}}},
{"Alphorn", {44,0.42,30,54,46,14,120,320,30,0,0,4.4,12,600,0,0,160,72,3,-26,40,3600,1.2}, {{200,4,5},{420,5,5},{760,4,3},{1200,4,0},{1900,3,-3},{2800,3,-6}}},
{"Didgeridoo", {3000,0.4,40,60,42,26,40,160,55,0,40,4,6,800,0,0,400,60,0,0,40,3800,1.25}, {{180,3,5},{380,5,5},{640,4,4},{900,4,2},{1500,3,-1},{2400,3,-4}}},
{"Shofar", {150,0.3,46,62,54,28,30,200,70,0,0,5,8,500,10,0,90,56,0,0,100,5200,1.1}, {{420,4,4},{800,5,4},{1300,4,3},{2000,4,1},{2900,3,-2},{4000,3,-5}}},
{"Conch", {200,0.34,34,58,46,30,80,300,60,0,0,4.8,10,600,12,0,160,66,0,0,100,3600,1.1}, {{300,4,5},{620,5,5},{1000,4,2},{1600,4,0},{2400,3,-3},{3400,3,-5}}},
{"Dungchen", {33,0.48,26,60,44,20,180,400,40,0,20,3.6,8,700,0,0,200,72,3,-22,25,2400,1.35}, {{90,4,6},{180,5,5},{320,4,4},{560,4,2},{900,3,-2},{1500,3,-6}}},
{"Karnay", {100,0.22,70,68,60,34,40,140,70,0,0,5.4,14,300,18,0,70,56,1,-24,120,8500,1}, {{800,4,5},{1400,5,6},{2200,4,5},{3200,4,3},{4600,3,0},{6400,3,-3}}}
};
constexpr int nI = 14;
static const double C0[17] = {0, 100, 44, 36, 31, 28, 25, 23, 21, 17, 11, 10, 9, 8, 7, 7, 7};
static const double DRATIO[3][3] = {{1.0, 1.0, 0.5}, {1.0, 1.5, 0.5}, {0.5, 0.5, 0.25}};
// q indices: 0 b0, 1 pole, 2 bright, 3 breath, 4 lips, 5 buzz, 6 attack, 7 release, 8 tongue, 9 flutter, 10 growl, 11 vibRate, 12 vibDepth, 13 vibDelay, 14 scoop, 15 shake, 16 glide, 17 body, 18 drone, 19 droneDb, 20 hp, 21 lp, 22 gain
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> names; for (auto& r : RAW) names.push_back(r.name);
  std::vector<std::string> sn; for (auto& s : SCALES) sn.push_back(s.name);
  return {
    P("Preset", "", 0, nI - 1, 0, "%.0f", false, names),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"),
    P("Mute", "", 0, 4, 0, "%.0f", false, {"Open", "Straight", "Cup", "Harmon", "Plunger"}),
    P("Players", "", 0, 3, 0, "%.0f", false, {"Solo", "Duo", "Section 4", "Ensemble 8"}),
    P("Spread", "%", 0, 100, 40, "%.0f %%"),
    P("Breath", "%", 0, 100, 62, "%.0f %%"),
    P("Lips", "%", 0, 100, 55, "%.0f %%"),
    P("Lip buzz", "%", 0, 100, 18, "%.0f %%"),
    P("Brightness", "%", 0, 100, 62, "%.0f %%"),
    P("Body", "%", 0, 100, 60, "%.0f %%"),
    P("Attack", "ms", 5, 600, 40, "%.0f ms", true),
    P("Release", "ms", 10, 2000, 120, "%.0f ms", true),
    P("Tongue", "%", 0, 100, 55, "%.0f %%"),
    P("Flutter", "%", 0, 100, 0, "%.0f %%"),
    P("Growl", "%", 0, 100, 0, "%.0f %%"),
    P("Vibrato depth", "cents", 0, 100, 18, "%.0f c"),
    P("Vibrato rate", "Hz", 2, 9, 5.4, "%.1f Hz"),
    P("Vibrato delay", "ms", 0, 1500, 350, "%.0f ms"),
    P("Mod wheel", "", 0, 1, 0, "%.0f", false, {"Vibrato", "Breath"}),
    P("Legato", "", 0, 1, 0, "%.0f", false, {"Poly", "Mono legato"}),
    P("Glide", "ms", 0, 800, 40, "%.0f ms"),
    P("Bend range", "st", 1, 12, 2, "%.0f st"),
    P("Shake", "%", 0, 100, 0, "%.0f %%"),
    P("Shake rate", "Hz", 2, 10, 6, "%.1f Hz"),
    P("Scoop", "%", 0, 100, 0, "%.0f %%"),
    P("Scale", "", 0, kScales - 1, 0, "%.0f", false, sn),
    P("Tonic", "", 0, 11, 0, "%.0f", false, {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}),
    P("Tune", "cents", -50, 50, 0, "%.0f c"),
    P("Octave", "", -2, 2, 0, "%.0f"),
    P("Drone", "", 0, 3, 0, "%.0f", false, {"Off", "Tonic", "Tonic-Fifth", "Pedal"}),
    P("Drone level", "dB", -40, 0, 0, "%.0f dB"),
    P("Reverb mix", "%", 0, 100, 20, "%.0f %%"),
    P("Reverb size", "%", 0, 100, 55, "%.0f %%"),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Instrument sound", {Breath, Lips, Buzz, Bright, Body, Mute}},
          {"Articulation", {Attack, Release, Tongue, Flutter, Growl, Scoop, Shake, ShakeRate}},
          {"Expression", {VibDepth, VibRate, VibDelay, ModWheel, Legato, Glide, BendRange}},
          {"Section", {Players, Spread}},
          {"Scale and tuning", {Scale, Tonic, Tune, Octave}},
          {"Drone", {Drone, DroneLevel}},
          {"Output", {Volume, ReverbMix, ReverbSize}}};
}
struct BVoice {
  DelayLine d; double z = 0, dcx = 0, dcy = 0, y1 = 0, y2 = 0, c1 = 0, c2 = 0, lg = 0, agc = 1, fol = 0, env = 0, relK = 0.001, attackK = 0.01, tong = 0, dyn = 0.7, flPh = 0, grPh = 0, trim = 0; int part = 2;
  double lf = 6, lfT = 6, D = 50, hz = 100; bool on = false; int state = 0, pc = 0; long long startDelay = 0; int group = -1;
  double pan = 0.5, detune = 0, vibPh = 0, vibAge = 0, shPh = 0, scoopSemis = 0, age = 0, jitter = 1, pole = 0.3; uint32_t seed = 1; double gl = 0.707, gr = 0.707, sv = 0;
  explicit BVoice(long long maxLen) : d(maxLen) {}
};
inline void clearVoice(BVoice& s) {
  s.d.clear(); s.z = s.dcx = s.dcy = s.y1 = s.y2 = s.fol = s.tong = s.flPh = s.grPh = 0; s.agc = 1; s.env = 0; s.on = false; s.state = 0; s.pc = 0; s.startDelay = 0; s.group = -1;
  s.vibPh = s.vibAge = s.shPh = s.scoopSemis = s.age = 0; s.trim = 0;
}
struct BGroup { bool on = false, held = false; int note = 0, nPl = 1; double vel = 0.7; long long age = 0; int sv[8] = {0, 0, 0, 0, 0, 0, 0, 0}; };
struct BDrone { double ph[4] = {0, 0, 0, 0}, lp1 = 0, lp2 = 0, lev = 0; };

struct Engine : EngineBase {
  std::vector<Spec> specs; std::vector<BVoice> pool; BGroup grp[kVoices]; BDrone drn[3]; std::vector<int> held;
  Biquad body[2][kModes], mute[2][3], hp[2]; double lpz[2] = {0, 0}, lpA = 0.5; Rev rev; Noise rng;
  double bend = 0, bendS = 0, mw = 0, expr = 1, expS = 1, press = 0; bool mwSeen = false; long long ageCtr = 0; long long nonFinite = 0;
  double volG = 1, glideK = 0.01, glideK4 = 0.04, instGain = 1, dt; bool muteOn = false; const Raw* inst;
  explicit Engine(double s) : EngineBase(s), rev(s), rng(0x9E3779B9u), dt(1 / s), inst(&RAW[0]) {
    specs = makeSpecs(); initParams(specs);
    const long long maxLen = (long long)std::floor(sr / 14) + 64; pool.reserve(kPool); for (int i = 0; i < kPool; ++i) pool.emplace_back(maxLen);
    loadInstrument(0, false);
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mw = m; mwSeen = true; } void pressure(double p) override { press = p; }
  void allNotesOff() override { for (auto& g : grp) if (g.on) release(g); held.clear(); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    if (id == Preset) { loadInstrument((int)std::max(0.0, std::min(double(nI - 1), rnd(x))), true); return; }
    v[(size_t)id] = x; configure();
  }
  void loadInstrument(int i, bool notify) {
    const Raw& n = RAW[i]; const double* q = n.q; v[Preset] = i; if (notify) writeParam(Preset, i);
    auto put = [&](int id, double val) { v[(size_t)id] = val; if (notify) writeParam(id, val); };
    put(Bright, q[2]); put(Breath, q[3]); put(Lips, q[4]); put(Buzz, q[5]); put(Attack, q[6]); put(Release, q[7]); put(Tongue, q[8]); put(Flutter, q[9]); put(Growl, q[10]);
    put(VibRate, q[11]); put(VibDepth, q[12]); put(VibDelay, q[13]); put(Scoop, q[14]); put(Shake, q[15]); put(Glide, q[16]); put(Body, q[17]); put(Drone, q[18]); put(DroneLevel, q[19]);
    configure();
  }
  double scaleCents(int note) const { const int pc = (((note - (int)rnd(v[Tonic])) % 12) + 12) % 12; int si = (int)rnd(v[Scale]); si = si < 0 ? 0 : (si >= kScales ? kScales - 1 : si); return SCALES[si].off[pc]; }
  double noteHz(int note, double extra = 0) const { return 440 * std::pow(2.0, (note + 12 * rnd(v[Octave]) - 69 + (v[Tune] + scaleCents(note) + extra) / 100) / 12); }
  void configure() {
    const double* V = v.data(); const Raw& n = RAW[(int)rnd(V[Preset])]; inst = &n; const double bg = V[Body] / 60;
    for (int c = 0; c < 2; ++c) { for (int k = 0; k < kModes; ++k) body[c][k].set(BQ_PEAK, n.m[k][0], n.m[k][1], n.m[k][2] * bg, sr); hp[c].set(BQ_HP, n.q[20], 0.7, 0, sr); }
    const int mt = (int)rnd(V[Mute]); muteOn = mt > 0;
    for (int c = 0; c < 2; ++c) {
      Biquad* m = mute[c];
      switch (mt) {
        case 1: m[0].set(BQ_HP, 380, 0.7, 0, sr); m[1].set(BQ_PEAK, 1700, 2.2, 8, sr); m[2].set(BQ_LP, 6500, 0.7, 0, sr); break;
        case 2: m[0].set(BQ_HP, 160, 0.7, 0, sr); m[1].set(BQ_PEAK, 650, 1.2, 4, sr); m[2].set(BQ_LP, 3200, 0.8, 0, sr); break;
        case 3: m[0].set(BQ_HP, 520, 0.8, 0, sr); m[1].set(BQ_PEAK, 2600, 3.5, 12, sr); m[2].set(BQ_PEAK, 1100, 3.0, -8, sr); break;
        case 4: m[0].set(BQ_HP, 200, 0.7, 0, sr); m[1].set(BQ_PEAK, 900, 2.5, 7, sr); m[2].set(BQ_LP, 2400, 1.2, 0, sr); break;
        default: for (int k = 0; k < 3; ++k) m[k].set(BQ_PEAK, 1000, 1.0, 0, sr); break;
      }
    }
    lpA = std::exp(-2 * kPi * std::min(n.q[21] * (0.6 + 0.8 * V[Bright] / 100), sr * 0.45) / sr);
    volG = dbToGain(V[Volume]); instGain = n.q[22];
    glideK = V[Glide] < 1 ? 1 : 1 - std::exp(-1 / (V[Glide] * 0.001 * sr)); glideK4 = glideK >= 1 ? 1 : 1 - std::pow(1 - glideK, 8);
  }
  void startVoice(BVoice& s, double hz, double vel, int player, int nPl, int groupIdx, uint32_t seed) {
    const double* V = v.data(); const Raw& inn = *inst; const double spread = V[Spread] * 0.01; clearVoice(s); s.on = true; s.state = 1; s.group = groupIdx; s.seed = seed;
    const double h1 = hashf(seed, 1 + player), h2 = hashf(seed, 17 + player), h3 = hashf(seed, 31 + player);
    s.detune = nPl > 1 ? (h1 * 2 - 1) * 12 * spread : 0;
    s.startDelay = nPl > 1 && player > 0 ? (long long)std::floor(h2 * spread * 0.022 * sr) : 0;
    s.pan = nPl > 1 ? 0.5 + 0.5 * ((player + 0.5) / nPl * 2 - 1) * (0.2 + 0.8 * spread) + (h3 - 0.5) * 0.08 * spread : 0.5;
    s.vibPh = h3 * 6.2832; s.jitter = 1 + (h2 - 0.5) * (nPl > 1 ? 0.16 : 0.04); s.dyn = vel; s.grPh = h1;
    s.lf = s.lfT = std::log2(hz); s.scoopSemis = -V[Scoop] * 0.01 * 2; s.tong = V[Tongue] * 0.01 * (0.4 + 0.6 * vel);
    s.attackK = 1 / std::max(8.0, V[Attack] * 0.001 * sr * (1.3 - 0.6 * vel)); s.relK = std::exp(-1 / (V[Release] * 0.001 * sr));
    s.part = (int)clampd(rnd(hz / inn.q[0]), 2, 16); s.gl = std::cos(s.pan * 1.5708); s.gr = std::sin(s.pan * 1.5708); s.sv = std::sin(s.vibPh);
  }
  void noteOn(int note, double vel) override {
    const double* V = v.data(); vel = clampd(vel, 0.02, 1); const double hz = noteHz(note, noteTune);
    if (V[Legato] > 0.5) {
      BGroup* g = nullptr; for (auto& q : grp) if (q.on && q.held) { g = &q; break; }
      if (g) { held.push_back(note); g->note = note; retarget(*g, hz); return; }
    }
    int gi = -1;
    for (int i = 0; i < kVoices; ++i) if (!grp[i].on) { gi = i; break; }
    if (gi < 0) { double oldest = std::numeric_limits<double>::infinity(); for (int i = 0; i < kVoices; ++i) if ((double)grp[i].age < oldest) { oldest = (double)grp[i].age; gi = i; } for (int j = 0; j < grp[gi].nPl; ++j) pool[(size_t)grp[gi].sv[j]].on = false; grp[gi].on = false; }
    const int nPl = 1 << (int)clampd(rnd(V[Players]), 0, 3);
    int got[kMaxPlayers]; int ng = 0; for (int i = 0; i < kPool && ng < nPl; ++i) if (!pool[(size_t)i].on) got[ng++] = i;
    if (ng < nPl) {
      for (int pass = 0; pass < kVoices && ng < nPl; ++pass) {
        int vi = -1; double oldest = std::numeric_limits<double>::infinity(); for (int i = 0; i < kVoices; ++i) if (grp[i].on && i != gi && (double)grp[i].age < oldest) { oldest = (double)grp[i].age; vi = i; }
        if (vi < 0) break;
        for (int j = 0; j < grp[vi].nPl; ++j) pool[(size_t)grp[vi].sv[j]].on = false; grp[vi].on = false;
        for (int i = 0; i < kPool && ng < nPl; ++i) { if (pool[(size_t)i].on) continue; bool dup = false; for (int k = 0; k < ng; ++k) if (got[k] == i) dup = true; if (!dup) got[ng++] = i; }
      }
    }
    if (ng < nPl) return;
    BGroup& g = grp[gi]; g.on = true; g.held = true; g.note = note; g.nPl = nPl; g.vel = vel; g.age = ++ageCtr;
    const uint32_t seed = ((uint32_t)note * 2654435761u) ^ ((uint32_t)ageCtr * 40503u);
    for (int j = 0; j < nPl; ++j) { g.sv[j] = got[j]; clearVoice(pool[(size_t)got[j]]); startVoice(pool[(size_t)got[j]], hz, vel, j, nPl, gi, seed); }
    held.push_back(note);
  }
  void retarget(BGroup& g, double hz) { for (int j = 0; j < g.nPl; ++j) { BVoice& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; s.lfT = std::log2(hz); if (glideK >= 1) s.lf = s.lfT; if (s.state == 3) s.state = 2; } }
  void release(BGroup& g) { g.held = false; for (int j = 0; j < g.nPl; ++j) { BVoice& s = pool[(size_t)g.sv[j]]; if (s.on && s.state != 3) s.state = 3; } }
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
  double stepV(BVoice& s) {
    if (s.startDelay > 0) { --s.startDelay; return 0; }
    const double* V = v.data(); const Raw& inn = *inst; const bool mwVib = V[ModWheel] < 0.5; s.age += dt;
    if (s.state == 1) { s.env += s.attackK; if (s.env >= 1) { s.env = 1; s.state = 2; } } else if (s.state == 3) s.env *= s.relK;
    const double dyn = (!mwVib && mwSeen) ? clampd(mw + press * 0.3, 0, 1) : s.dyn;
    s.tong *= 1 - 30 * dt;
    double flut = 1; if (V[Flutter] > 0.5) { s.flPh += 24 * dt; if (s.flPh >= 1) s.flPh -= 1; const double sq = std::sin(6.2832 * s.flPh); flut = 1 - V[Flutter] * 0.01 * 0.85 * clampd(sq * 2.5 + 0.5, 0, 1); }
    const double growl = V[Growl] * 0.01; if (growl > 0) { s.grPh += (30 + 8 * s.jitter) * dt; if (s.grPh >= 1) s.grPh -= 1; }
    const int pk = s.pc; s.pc = (pk + 1) & 7;
    if (pk == 0) {
      const double dt4 = 8 * dt;
      if (glideK < 1) s.lf += (s.lfT - s.lf) * glideK4; else s.lf = s.lfT;
      double cents = s.detune + s.scoopSemis * 100; s.scoopSemis *= 0.99760144; if (std::fabs(s.scoopSemis) < 1e-4) s.scoopSemis = 0;
      s.vibAge += dt4; {
        const double depth = V[VibDepth] + (mwVib ? mw * 60 : 0), ramp = clampd((s.vibAge - V[VibDelay] * 0.001) / 0.35, 0, 1);
        s.vibPh += 6.2832 * V[VibRate] * s.jitter * dt4; if (s.vibPh > 6.2832) s.vibPh -= 6.2832; const double sv = std::sin(s.vibPh); s.sv = sv; cents += depth * ramp * sv;
      }
      if (V[Shake] > 0.5) { s.shPh += V[ShakeRate] * s.jitter * dt4; if (s.shPh >= 1) s.shPh -= 1; const double tri = s.shPh < 0.5 ? s.shPh * 2 : 2 - s.shPh * 2, ramp = clampd((s.age - 0.10) / 0.2, 0, 1); cents += tri * tri * (3 - 2 * tri) * V[Shake] * 0.01 * 160 * ramp; }
      cents += bendS * V[BendRange] * 100;
      const double hz = std::pow(2.0, s.lf + cents / 1200); s.hz = hz;
      const double b01 = V[Bright] * 0.01; s.pole = clampd(inn.q[1] + (0.5 - b01) * 0.35 - (dyn - 0.5) * 0.10, 0.04, 0.8);
      const double cs = C0[s.part] - (18.0 / s.part) * (std::max(s.lf, 6.78) - 7.6439); s.trim = clampd(cs, -20, 140);
      const double comp = s.pole / (1 - s.pole), fb = hz * std::pow(2.0, -s.trim / 1200) / s.part;
      s.D = clampd(sr / fb - 2 - comp, 6, double(s.d.mask - 8));
      const double Q = 40 + 0.5 * V[Lips], lipHz = std::min(hz * std::pow(2.0, -s.trim / 1200) * (1 + 0.05 * growl * std::sin(6.2831853 * s.grPh)), sr * 0.4);
      const double r = 1 - kPi * (lipHz / Q) / sr; s.c1 = 2 * r * std::cos(2 * kPi * lipHz / sr); s.c2 = -r * r; s.lg = (1 - r) * 2 * std::sin(2 * kPi * lipHz / sr) * 160;
    }
    const double tongPush = 1 + s.tong * 1.2;
    double bt = (0.20 + 0.34 * (0.5 + 0.5 * dyn) * (0.7 + 0.6 * V[Breath] * 0.01)) * tongPush * flut; bt = std::min(bt, 0.9);
    const double mouth = bt * (0.55 + 0.45 * std::min(1.0, s.env * 3)) * (1 + 0.06 * V[VibDepth] * 0.01 * s.sv) + rng.white() * V[Buzz] * 0.01 * 0.03 * bt;
    DelayLine& dl = s.d; float* dbuf = dl.buf.data(); const long long dmask = dl.mask, dw = dl.w; const double Dd = s.D; const long long di = (long long)Dd; const double dtt = Dd - double(di);
    const double ya = dbuf[(dw - di + 1) & dmask], yb_ = dbuf[(dw - di) & dmask], yc = dbuf[(dw - 1 - di) & dmask], yd = dbuf[(dw - 2 - di) & dmask];
    const double arr = ((0.5 * (yd - ya) + 1.5 * (yb_ - yc)) * dtt + (ya - 2.5 * yb_ + 2 * yc - 0.5 * yd)) * dtt * dtt + 0.5 * (yc - ya) * dtt + yb_;
    s.z = (1 - s.pole) * arr + s.pole * s.z; const double bore = 0.85 * s.z;
    const double dp = mouth - bore, yy = dp * s.lg + s.c1 * s.y1 + s.c2 * s.y2; s.y2 = s.y1; s.y1 = yy; double q = yy * yy; if (q > 1) q = 1;
    const double o = q * mouth + (1 - q) * bore, yb = o - s.dcx + 0.995 * s.dcy; s.dcx = o; s.dcy = yb; dbuf[dw & dmask] = (float)yb; dl.w = dw + 1;
    double y = arr;
    s.fol += (std::fabs(y) - s.fol) * 0.003;
    const double level = s.env * (0.10 + 0.90 * dyn * dyn * 0.8 + 0.1 * dyn) * (1 + s.tong * 0.5);
    const double want = clampd(level * 0.28 / std::max(s.fol, 0.002), 0, 8); s.agc += (want - s.agc) * 0.004; y *= s.agc;
    if (growl > 0) y *= 1 + 0.35 * growl * std::sin(6.2831853 * s.grPh);
    if (!(std::fabs(y) < 20)) { clearVoice(s); ++nonFinite; return 0; }
    if (s.state == 3 && s.env < 1e-3) { s.on = false; s.state = 0; }
    return y;
  }
  void process(float* outL, float* outR, int n) override {
    const double* V = v.data(); const double rvMix = V[ReverbMix] * 0.01, droneG = dbToGain(V[DroneLevel]); const int droneMode = (int)rnd(V[Drone]);
    const bool muteOn_ = muteOn; const double lpA_ = lpA;
    const double norm0 = 1 / std::sqrt((double)(1 << (int)clampd(rnd(V[Players]), 0, 3))), volG_ = volG * instGain * 0.9;
    const double fbR = 0.7 + 0.28 * (V[ReverbSize] * 0.01), dm = 0.35;
    double sa = 0; const double* ratio = nullptr;
    if (droneMode > 0) { sa = noteHz(36 + (int)rnd(V[Tonic])); ratio = DRATIO[droneMode - 1]; }
    for (int i = 0; i < n; ++i) {
      bendS += (bend - bendS) * 0.01; expS += (expr - expS) * 0.002;
      double l = 0, r = 0; int nAct = 0;
      for (int gi = 0; gi < kVoices; ++gi) {
        BGroup& g = grp[gi]; if (!g.on) continue; bool any = false;
        for (int j = 0; j < g.nPl; ++j) {
          BVoice& s = pool[(size_t)g.sv[j]]; if (!s.on) continue; any = true; const double y = stepV(s); l += y * s.gl; r += y * s.gr; nAct += 1;
        }
        if (!any) g.on = false;
      }
      if (nAct > 0) { l *= norm0; r *= norm0; }
      double bl = hp[0].run(l), br = hp[1].run(r);
      for (int k = 0; k < kModes; ++k) { bl = body[0][k].run(bl); br = body[1][k].run(br); }
      if (muteOn_) { for (int k = 0; k < 3; ++k) { bl = mute[0][k].run(bl); br = mute[1][k].run(br); } bl *= 1.4; br *= 1.4; }
      lpz[0] = bl * (1 - lpA_) + lpz[0] * lpA_; lpz[1] = br * (1 - lpA_) + lpz[1] * lpA_; bl = lpz[0]; br = lpz[1];
      if (droneMode > 0) {
        double dm_ = 0, dr = 0;
        for (int d = 0; d < 3; ++d) {
          BDrone& q = drn[d]; const double f = sa * ratio[d] * (1 + 0.0013 * (d - 1)); double acc = 0; const double dtp = f / sr;
          for (int k = 0; k < 2; ++k) { q.ph[k] += dtp * (k ? 1.004 : 1); if (q.ph[k] >= 1) q.ph[k] -= 1; double saw = 2 * q.ph[k] - 1; saw -= polyBlep(q.ph[k], dtp); acc += saw * 0.5; }
          q.lp1 += (acc - q.lp1) * 0.05; q.lp2 += (q.lp1 - q.lp2) * 0.05; q.lev += (1 - q.lev) * 0.0004; const double pn = 0.3 + 0.2 * d; dm_ += q.lp2 * q.lev * std::cos(pn * 1.5708); dr += q.lp2 * q.lev * std::sin(pn * 1.5708);
        }
        bl += dm_ * droneG * 2.2; br += dr * droneG * 2.2;
      }
      const double gain = volG_ * expS;
      double ol = bl * gain, orr = br * gain;
      if (rvMix > 0.001) { const double x = (ol + orr) * 0.015, wl = rev.tick(0, x, fbR, dm), wr = rev.tick(1, x, fbR, dm); ol = ol * (1 - rvMix * 0.3) + wl * 3 * rvMix; orr = orr * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
      ol = std::tanh(ol * 0.8) * 1.25; orr = std::tanh(orr * 0.8) * 1.25;
      if (!(ol == ol) || !(orr == orr)) { ++nonFinite; ol = orr = 0; }
      outL[i] = (float)ol; outR[i] = (float)orr;
    }
  }
};
inline Info info() {
  return Info{"brassica", "Brassica", "Modelled brass: lips buzzing against a mouthpiece and bore, mutes, flutter-tongue, shakes, drone and microtonal scales. The Preset is the instrument (trumpet, horn, trombone, tuba, alphorn, didgeridoo, shofar, karnay ...).",
              makeSpecs(), makeGroups(), Theme{"brassica", 0xff2e1f0a, 0xff0d0802, 0xffe3b23c, 0xfff8ecd0, 0xffffd36e}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::brassica
