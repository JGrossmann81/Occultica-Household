// Additica: additive synthesizer, 64 sine partials per note with two morphing spectra, shaping, per-partial decay, drift and unison layers.
#pragma once
#include "../common/engine.h"
namespace occ { namespace additica {
constexpr int kP = 64, kSpecs = 8, kPoly = 16, kPool = 20, kLayers = 4, kMaxCtl = 128;
enum { Preset, SpecA, SpecB, Morph, Bright, Stretch, Tilt, EvenOdd, Comb, CombPeriod, Formant, Vowel, FmtShift, PDecay, PDecayTilt, Drift, Unison, Detune, Spread, AmpA, AmpD, AmpS, AmpR, ModA, ModD, ModS, ModR, MorphEnv, BrightEnv, Glide, VibRate, VibDepth, Octave, Vel, Level, Count };
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> specNames = {"Saw", "Square", "Bell", "Organ", "Vocal", "Glass", "Metallic", "Brass"};
  std::vector<std::string> presetNames = {"Init Saw", "Slow Saw Pad", "Hollow Reed", "Glass Bells", "Tubular Bell", "Choir Ah", "Brass Swell", "Drawbar Organ", "Metal Pluck", "Morph Sweep", "Hollow Strings", "Glass Harmonica", "Formant Lead", "Drone Bell"};
  return {
    P("Preset", "", 0, 13, 0, "%.0f", false, presetNames),
    P("Spectrum A", "", 0, 7, 0, "%.0f", false, specNames), P("Spectrum B", "", 0, 7, 1, "%.0f", false, specNames),
    P("Morph", "", 0, 1, 0), P("Brightness", "", 0, 1, 1), P("Stretch", "", -0.2, 0.25, 0, "%+.3f"), P("Tilt", "", -1, 1, 0, "%+.2f"), P("Even/Odd", "", -1, 1, 0, "%+.2f"),
    P("Comb", "", 0, 1, 0), P("Comb Period", "", 2, 16, 6, "%.1f"), P("Formant", "", 0, 1, 0), P("Vowel", "", 0, 4, 0, "%.0f", false, {"A", "E", "I", "O", "U"}),
    P("Formant Shift", "st", -12, 12, 0, "%+.1f st"), P("Partial Decay", "", 0, 1, 0), P("Decay Tilt", "", -1, 1, 0.3, "%+.2f"), P("Drift", "", 0, 1, 0.1),
    P("Unison", "", 0, 3, 0, "%.0f", false, {"1 layer", "2 layers", "3 layers", "4 layers"}), P("Detune", "ct", 0, 50, 12, "%.1f ct"), P("Spread", "", 0, 1, 0.6),
    P("Amp Attack", "ms", 1, 10000, 5, "%.0f ms", true), P("Amp Decay", "ms", 5, 10000, 400, "%.0f ms", true), P("Amp Sustain", "", 0, 1, 0.8), P("Amp Release", "ms", 5, 15000, 250, "%.0f ms", true),
    P("Mod Attack", "ms", 1, 10000, 5, "%.0f ms", true), P("Mod Decay", "ms", 5, 10000, 600, "%.0f ms", true), P("Mod Sustain", "", 0, 1, 0), P("Mod Release", "ms", 5, 15000, 300, "%.0f ms", true),
    P("Env > Morph", "", -1, 1, 0, "%+.2f"), P("Env > Bright", "", -1, 1, 0, "%+.2f"), P("Glide", "ms", 0, 2000, 0, "%.0f ms"),
    P("Vibrato Rate", "Hz", 0.5, 12, 5.5, "%.1f Hz"), P("Vibrato Depth", "ct", 0, 100, 0, "%.0f ct"),
    P("Octave", "", 0, 4, 2, "%.0f", false, {"-2", "-1", "0", "+1", "+2"}), P("Velocity", "", 0, 1, 0.6), P("Level", "dB", -30, 6, -9, "%+.1f dB"),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Spectrum", {SpecA, SpecB, Morph, Bright, Stretch, Drift}}, {"Shape", {Tilt, EvenOdd, Comb, CombPeriod, Formant, FmtShift, Vowel}},
          {"Partials and unison", {PDecay, PDecayTilt, Unison, Detune, Spread}}, {"Amp envelope", {AmpA, AmpD, AmpS, AmpR}},
          {"Morph / bright envelope", {ModA, ModD, ModS, ModR, MorphEnv, BrightEnv}}, {"Play", {Glide, VibRate, VibDepth, Octave, Vel, Level}}};
}
struct Tables {
  double TA[kSpecs][kP], TL[kSpecs][kP], TD[kSpecs][kP], LG[kP];
  static double hsh(int k, int s) { uint32_t h = (uint32_t)k * 2654435761u + (uint32_t)s * 40503u + 12345u; h = h ^ (h >> 15); h = h * 2246822519u; h = h ^ (h >> 13); return double(h & 0xFFFF) / 65535.0; }
  static double gau(double x, double c, double w) { double d = (x - c) / w; return std::exp(-0.5 * d * d); }
  Tables() {
    static const double br[16] = {1, 0.5, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 4.5, 5.33, 6, 7.2, 8, 9.2, 10.4}, ba[16] = {1, 0.7, 0.8, 0.55, 0.75, 0.4, 0.45, 0.35, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.07};
    static const double oa[10] = {1, 0.9, 0.75, 0.6, 0.1, 0.35, 0.05, 0.3, 0.03, 0.2};
    for (int k = 0; k < kP; ++k) {
      double n = k + 1; LG[k] = std::log2(n);
      for (int s = 0; s < kSpecs; ++s) {
        double a = 0, r = n, d = 1;
        switch (s) {
          case 0: a = 1 / n; d = 1 + 0.03 * n; break;
          case 1: a = (k & 1) ? 0 : 1 / n; d = 1 + 0.03 * n; break;
          case 2: if (k < 16) { r = br[k]; a = ba[k]; } else { r = 10.4 + 0.95 * (k - 15) + 0.3 * hsh(k, 2); a = 0.07 * std::pow(0.88, k - 15); } d = 0.4 + 0.3 * std::pow(r, 1.1); break;
          case 3: a = k < 10 ? oa[k] : 0.02 * std::pow(0.9, k - 10); d = 0.3; break;
          case 4: { double g = 0.05 + gau(n, 5.6, 1.8) + 0.7 * gau(n, 8.4, 2.4) + 0.3 * gau(n, 18.8, 4) + 0.15 * gau(n, 26, 5); a = g / std::pow(n, 0.8); d = 1 + 0.02 * n; break; }
          case 5: r = 0.25 * (n + 1) * (n + 1); a = std::pow(n, -0.8) * (0.7 + 0.3 * std::cos(0.9 * n * n)); d = 0.6 + 0.04 * n; break;
          case 6: { double nn = std::floor((n + 1) * 0.5), b = (2 * nn + 1) * (2 * nn + 1) / 9; r = (k & 1) ? 1.41 * b : b; a = std::pow(n, -0.7) / (1 + 0.1 * n); d = 0.8 + 0.2 * r; break; }
          default: a = std::pow(n, -0.55) * (1 + 2.2 * gau(n, 5.5, 2.5)) / (1 + std::pow(n / 20, 3)); d = 1 + 0.03 * n; break;
        }
        TA[s][k] = a; TL[s][k] = std::log2(std::max(0.01, r)); TD[s][k] = d;
      }
    }
    for (int s = 0; s < kSpecs; ++s) { double ss = 0; for (int k = 0; k < kP; ++k) ss += TA[s][k] * TA[s][k]; double nm = 1 / std::sqrt(std::max(1e-9, ss)); for (int k = 0; k < kP; ++k) TA[s][k] *= nm; }
  }
};
inline const Tables& T() { static const Tables t; return t; }
inline void shaping(double tilt, double eo, double comb, double period, double* S) {
  period = std::max(2.0, period); const Tables& t = T();
  for (int k = 0; k < kP; ++k) {
    int n = k + 1; double g = std::pow(2.0, 1.5 * tilt * t.LG[k]);
    if (n >= 2) g *= (n & 1) ? std::min(1.0, 1 - eo) : std::min(1.0, 1 + eo);
    g *= 1 - comb * (0.5 - 0.5 * std::cos(6.2831853 * k / period));
    S[k] = g;
  }
}
static const double VOW[5][6] = {{800, 1150, 2900, 1, 0.55, 0.25}, {400, 1600, 2700, 1, 0.6, 0.3}, {270, 2140, 2950, 1, 0.4, 0.3}, {450, 800, 2830, 1, 0.65, 0.15}, {325, 700, 2530, 1, 0.5, 0.1}};
inline void formantGains(int vowel, double shiftSemis, double f0, const double* lr, double* g) {
  const double* v = VOW[(int)clampd(vowel, 0, 4)]; double sh = shiftSemis / 12, lf0 = std::log2(std::max(1.0, f0)), lcT[3];
  for (int j = 0; j < 3; ++j) lcT[j] = std::log2(v[j]) + sh;
  for (int k = 0; k < kP; ++k) { double lf = lf0 + lr[k], s = 0.05; for (int j = 0; j < 3; ++j) { double d = (lf - lcT[j]) * 5; s += v[3 + j] * std::exp(-0.5 * d * d); } g[k] = s; }
}
inline double levelNorm(double ss) { return std::min(4.0, std::pow(std::max(ss, 1e-6), -0.3)); }
struct KV { int id; double val; };
inline const std::vector<std::vector<double>>& presetTable() {
  static const std::vector<std::vector<double>> PT = [] {
    std::vector<std::vector<KV>> PO = {
      {},
      {{SpecA, 0}, {SpecB, 1}, {Morph, 0.25}, {Bright, 0.85}, {Tilt, -0.1}, {Drift, 0.35}, {Unison, 2}, {Detune, 16}, {Spread, 0.8}, {AmpA, 650}, {AmpD, 800}, {AmpS, 0.85}, {AmpR, 1400}, {ModA, 1800}, {ModD, 2500}, {ModS, 0.4}, {ModR, 1500}, {MorphEnv, 0.35}, {BrightEnv, 0.15}, {Level, -10}},
      {{SpecA, 1}, {SpecB, 3}, {Morph, 0.35}, {EvenOdd, -0.2}, {Bright, 0.7}, {BrightEnv, 0.3}, {ModA, 60}, {ModD, 500}, {ModS, 0.3}, {AmpA, 25}, {AmpD, 300}, {AmpS, 0.8}, {AmpR, 160}, {VibRate, 5.2}, {VibDepth, 8}, {Drift, 0.12}},
      {{SpecA, 5}, {SpecB, 2}, {Morph, 0.25}, {PDecay, 0.35}, {PDecayTilt, 0.5}, {AmpA, 2}, {AmpS, 1}, {AmpR, 2500}, {Drift, 0.2}, {Stretch, 0.02}, {Vel, 0.7}, {Unison, 1}, {Detune, 5}, {Spread, 0.7}},
      {{SpecA, 2}, {SpecB, 6}, {Morph, 0.15}, {PDecay, 0.28}, {PDecayTilt, 0.35}, {AmpA, 1}, {AmpS, 1}, {AmpR, 3500}, {Drift, 0.1}, {Level, -8}},
      {{SpecA, 4}, {SpecB, 3}, {Morph, 0.25}, {Formant, 0.65}, {Vowel, 0}, {Bright, 0.9}, {Unison, 3}, {Detune, 14}, {Spread, 0.85}, {Drift, 0.4}, {AmpA, 700}, {AmpD, 600}, {AmpS, 0.9}, {AmpR, 1100}, {VibRate, 5.0}, {VibDepth, 12}, {Level, -10}},
      {{SpecA, 7}, {SpecB, 0}, {Morph, 0.1}, {Bright, 0.3}, {BrightEnv, 0.7}, {MorphEnv, 0.3}, {ModA, 220}, {ModD, 600}, {ModS, 0.75}, {ModR, 250}, {AmpA, 55}, {AmpD, 300}, {AmpS, 0.85}, {AmpR, 180}, {Unison, 1}, {Detune, 7}, {Drift, 0.1}, {VibRate, 5.5}, {VibDepth, 6}, {Vel, 0.8}},
      {{SpecA, 3}, {SpecB, 1}, {Morph, 0}, {AmpA, 4}, {AmpD, 50}, {AmpS, 1}, {AmpR, 70}, {VibRate, 6.2}, {VibDepth, 6}, {Drift, 0.05}, {Vel, 0.2}, {Tilt, 0.1}},
      {{SpecA, 6}, {SpecB, 2}, {Morph, 0.3}, {MorphEnv, 0.5}, {ModA, 1}, {ModD, 450}, {ModS, 0}, {Bright, 0.4}, {BrightEnv, 0.6}, {PDecay, 0.55}, {PDecayTilt, 0.6}, {AmpA, 1}, {AmpS, 1}, {AmpR, 400}, {Drift, 0.15}, {Level, -8}},
      {{SpecA, 0}, {SpecB, 6}, {Morph, 0}, {MorphEnv, 1}, {ModA, 2800}, {ModD, 2000}, {ModS, 1}, {ModR, 2000}, {Unison, 1}, {Detune, 9}, {Spread, 0.6}, {AmpA, 400}, {AmpS, 0.9}, {AmpR, 1600}, {Drift, 0.25}},
      {{SpecA, 0}, {Comb, 0.65}, {CombPeriod, 5.5}, {Tilt, -0.25}, {Bright, 0.8}, {Unison, 2}, {Detune, 11}, {Spread, 0.9}, {Drift, 0.3}, {AmpA, 300}, {AmpD, 500}, {AmpS, 0.9}, {AmpR, 700}, {VibRate, 5.3}, {VibDepth, 7}},
      {{SpecA, 5}, {SpecB, 3}, {Morph, 0.15}, {Bright, 0.75}, {AmpA, 160}, {AmpS, 0.9}, {AmpR, 1600}, {VibRate, 5.0}, {VibDepth, 5}, {Unison, 1}, {Detune, 4}, {Drift, 0.3}},
      {{SpecA, 0}, {SpecB, 4}, {Morph, 0.35}, {Formant, 0.75}, {Vowel, 2}, {Glide, 90}, {VibRate, 5.6}, {VibDepth, 14}, {AmpA, 8}, {AmpS, 0.85}, {AmpR, 160}, {Unison, 1}, {Detune, 6}, {Bright, 0.9}},
      {{SpecA, 2}, {SpecB, 5}, {Morph, 0.5}, {PDecay, 0.1}, {PDecayTilt, 0.2}, {Stretch, -0.02}, {AmpA, 400}, {AmpS, 1}, {AmpR, 6000}, {Unison, 2}, {Detune, 9}, {Spread, 0.9}, {Drift, 0.5}, {Octave, 1}, {Level, -10}}};
    auto sp = makeSpecs(); std::vector<std::vector<double>> out;
    for (size_t i = 0; i < PO.size(); ++i) { std::vector<double> v; for (auto& s : sp) v.push_back(s.def); for (auto& kv : PO[i]) v[(size_t)kv.id] = kv.val; v[0] = (double)i; out.push_back(v); }
    return out; }();
  return PT;
}
struct Rng { uint32_t s = 0x1234567; double bi() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double(s >> 8) * (1.0 / 16777216.0) * 2 - 1; } };
struct Voice {
  Adsr amp, mod; double x[kP], e[kP], fm[kP], c[kLayers * kP], s[kLayers * kP], a[kLayers * kP]; uint8_t live[kLayers * kP]; int nLive[kLayers];
  bool on, held, fading; int note; double vel, tuneCents; long long age; double pitch, tgt; int fmtVer, quiet; uint32_t seed;
  explicit Voice(double sr) { amp.setSr(sr); mod.setSr(sr); reset(); }
  void reset() {
    on = held = fading = false; note = 0; vel = 0.7; tuneCents = 0; age = 0; pitch = 60; tgt = 60; fmtVer = -1; quiet = 0; seed = 1;
    std::fill(x, x + kP, 0.0); std::fill(fm, fm + kP, 0.0); std::fill(e, e + kP, 1.0); std::fill(c, c + kLayers * kP, 0.0); std::fill(s, s + kLayers * kP, 0.0); std::fill(a, a + kLayers * kP, 0.0);
    std::fill(live, live + kLayers * kP, (uint8_t)0); std::fill(nLive, nLive + kLayers, 0); amp.kill(); mod.kill();
  }
};
struct Eff { double amp[kP], lr[kP], dec[kP]; };
struct Engine : EngineBase {
  std::vector<Spec> specs; int ctl; std::vector<double> sm; std::vector<std::unique_ptr<Voice>> vo; bool started = false; long long ageCtr = 0; int lastVoice = -1; double lastPitch = -1;
  int curA = 0, oldA = 0, curB = 1, oldB = 1; double fa = 1, fb = 1; bool abDirty = true; Eff effA, effB; double S[kP], sCache[4], dtilt[kP], dtCache = 1e9; int fmtVer = 0;
  double lfoPh = 0, bend = 0, bendS = 0, mw = 0, press = 0, expr = 1, exprS = 1, vibCents = 0;
  double mixL[kMaxCtl], mixR[kMaxCtl], buf[kMaxCtl], tgtL[kP], frq[kP], cs0[kP], sn0[kP], cv[kP], sv[kP], av[kP], dv[kP], Cv[kP], Sv[kP], lfm[kP]; int idxs[kP]; Rng rng; std::vector<int> smoothIds;
  explicit Engine(double sr_) : EngineBase(sr_), specs(makeSpecs()) {
    initParams(specs); ctl = sr_ <= 60000 ? 64 : 128; sm = v; for (int i = 0; i < kPool; ++i) vo.emplace_back(new Voice(sr_));
    sCache[0] = 1e9; sCache[1] = sCache[2] = sCache[3] = 0; std::fill(S, S + kP, 0.0); std::fill(dtilt, dtilt + kP, 0.0);
    smoothIds = {Morph, Bright, Stretch, Tilt, EvenOdd, Comb, CombPeriod, Formant, FmtShift, PDecayTilt, Drift, Detune, Spread, Level, VibDepth};
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[(size_t)id]; if (x != x) x = sp.def;
    x = clampd(x, sp.min, sp.max); if (!sp.labels.empty()) x = std::floor(x + 0.5); v[(size_t)id] = x;
    if (!started) sm[(size_t)id] = x;
    if (id == Preset) { loadPreset(x); return; }
    changed(id);
  }
  void loadPreset(double ii) {
    int i = (int)clampd(std::floor(ii + 0.5), 0, (double)presetTable().size() - 1); const auto& t = presetTable()[(size_t)i];
    for (int id = 1; id < Count; ++id) { v[(size_t)id] = t[(size_t)id]; if (!started) sm[(size_t)id] = t[(size_t)id]; writeParam(id, t[(size_t)id]); changed(id); }
  }
  void changed(int id) {
    switch (id) {
      case SpecA: { int n = (int)std::floor(v[SpecA] + 0.5); if (n != curA) { oldA = curA; curA = n; fa = started ? 0 : 1; if (!started) oldA = n; abDirty = true; } break; }
      case SpecB: { int n = (int)std::floor(v[SpecB] + 0.5); if (n != curB) { oldB = curB; curB = n; fb = started ? 0 : 1; if (!started) oldB = n; abDirty = true; } break; }
      case Vowel: case FmtShift: ++fmtVer; break;
      case AmpA: case AmpD: case AmpS: case AmpR: case ModA: case ModD: case ModS: case ModR: refreshEnv(); break;
      default: break;
    }
  }
  void refreshEnv() {
    for (auto& up : vo) {
      Voice& w = *up; if (!w.on) continue;
      int sa = w.amp.st; double va = w.amp.v, rC = w.amp.rC; w.amp.set(v[AmpA] * 0.001, v[AmpD] * 0.001, v[AmpS], v[AmpR] * 0.001); w.amp.st = sa; w.amp.v = va; if (w.fading) w.amp.rC = rC;
      int sm_ = w.mod.st; double vm = w.mod.v; w.mod.set(v[ModA] * 0.001, v[ModD] * 0.001, v[ModS], v[ModR] * 0.001); w.mod.st = sm_; w.mod.v = vm;
    }
  }
  void allNotesOff() override { for (auto& up : vo) { Voice& w = *up; if (w.on && !w.fading) { w.held = false; w.amp.gateOff(); w.mod.gateOff(); } } }
  void pitchBend(double b) override { bend = clampd(b, -1, 1); } void modWheel(double m) override { mw = clampd(m, 0, 1); } void pressure(double p) override { press = clampd(p, 0, 1); }
  void noteOn(int note, double vel) override {
    started = true; int cnt = 0; for (auto& w : vo) if (w->on && !w->fading) ++cnt;
    if (cnt >= kPoly) {
      int victim = -1; double best = 1e9;
      for (int i = 0; i < kPool; ++i) { Voice& w = *vo[(size_t)i]; if (w.on && !w.fading && !w.held && w.amp.v < best) { best = w.amp.v; victim = i; } }
      if (victim < 0) { long long oldest = 1LL << 60; for (int i = 0; i < kPool; ++i) { Voice& w = *vo[(size_t)i]; if (w.on && !w.fading && w.age < oldest) { oldest = w.age; victim = i; } } }
      if (victim >= 0) { Voice& w = *vo[(size_t)victim]; w.fading = true; w.held = false; w.amp.st = 4; w.amp.rC = std::exp(-6.9 / std::max(1.0, 0.004 * sr)); w.mod.gateOff(); }
    }
    int slot = -1; for (int i = 0; i < kPool; ++i) if (!vo[(size_t)i]->on) { slot = i; break; }
    if (slot < 0) { double best = 1e9; for (int i = 0; i < kPool; ++i) if (vo[(size_t)i]->fading && vo[(size_t)i]->amp.v < best) { best = vo[(size_t)i]->amp.v; slot = i; } }
    if (slot < 0) return;
    Voice& w = *vo[(size_t)slot]; w.reset();
    w.on = true; w.held = true; w.note = note; w.vel = clampd(vel, 0, 1); w.tuneCents = noteTune; w.age = ++ageCtr; lastVoice = slot; w.seed = (0x9E3779B9u * (uint32_t)(ageCtr + 1)) | 1u;
    w.amp.set(v[AmpA] * 0.001, v[AmpD] * 0.001, v[AmpS], v[AmpR] * 0.001); w.mod.set(v[ModA] * 0.001, v[ModD] * 0.001, v[ModS], v[ModR] * 0.001);
    w.amp.gateOn(); w.mod.gateOn();
    w.tgt = note + 12 * (std::floor(v[Octave] + 0.5) - 2) + w.tuneCents * 0.01;
    w.pitch = (v[Glide] > 0.5 && lastPitch > 0) ? lastPitch : w.tgt; lastPitch = w.tgt;
    Rng& r = rng; r.s = w.seed; for (int k = 0; k < kP; ++k) w.x[k] = 1.7 * r.bi();
  }
  void noteOff(int note) override { for (auto& up : vo) { Voice& w = *up; if (w.on && w.held && !w.fading && w.note == note) { w.held = false; w.amp.gateOff(); w.mod.gateOff(); return; } } }
  void tick(int m) {
    const Tables& t = T(); double dt = m / sr, aS = std::exp(-dt / 0.015);
    for (int id : smoothIds) { sm[(size_t)id] = v[(size_t)id] + (sm[(size_t)id] - v[(size_t)id]) * aS; if (std::fabs(sm[(size_t)id] - v[(size_t)id]) < 1e-7) sm[(size_t)id] = v[(size_t)id]; }
    bendS += (bend - bendS) * (1 - std::exp(-dt / 0.006)); exprS += (expr - exprS) * (1 - std::exp(-dt / 0.01));
    if (std::fabs(bendS - bend) < 1e-7) bendS = bend; if (std::fabs(exprS - expr) < 1e-7) exprS = expr;
    if (fa < 1 || fb < 1 || abDirty) {
      fa = std::min(1.0, fa + dt / 0.03); fb = std::min(1.0, fb + dt / 0.03);
      for (int k = 0; k < kP; ++k) {
        effA.amp[k] = t.TA[oldA][k] + fa * (t.TA[curA][k] - t.TA[oldA][k]); effA.lr[k] = t.TL[oldA][k] + fa * (t.TL[curA][k] - t.TL[oldA][k]); effA.dec[k] = t.TD[oldA][k] + fa * (t.TD[curA][k] - t.TD[oldA][k]);
        effB.amp[k] = t.TA[oldB][k] + fb * (t.TA[curB][k] - t.TA[oldB][k]); effB.lr[k] = t.TL[oldB][k] + fb * (t.TL[curB][k] - t.TL[oldB][k]); effB.dec[k] = t.TD[oldB][k] + fb * (t.TD[curB][k] - t.TD[oldB][k]);
      }
      abDirty = fa < 1 || fb < 1;
    }
    double* sc = sCache;
    if (std::fabs(sc[0] - sm[Tilt]) > 1e-5 || std::fabs(sc[1] - sm[EvenOdd]) > 1e-5 || std::fabs(sc[2] - sm[Comb]) > 1e-5 || std::fabs(sc[3] - sm[CombPeriod]) > 1e-5) {
      sc[0] = sm[Tilt]; sc[1] = sm[EvenOdd]; sc[2] = sm[Comb]; sc[3] = sm[CombPeriod]; shaping(sc[0], sc[1], sc[2], sc[3], S);
    }
    if (std::fabs(dtCache - sm[PDecayTilt]) > 1e-5) { dtCache = sm[PDecayTilt]; for (int k = 0; k < kP; ++k) dtilt[k] = std::pow(2.0, 0.8 * dtCache * t.LG[k]); }
    lfoPh += v[VibRate] * dt; lfoPh -= std::floor(lfoPh);
    vibCents = std::sin(6.2831853 * lfoPh) * (sm[VibDepth] + 50 * mw);
  }
  void renderVoice(Voice& w, int m) {
    const Tables& t = T(); double dt = m / sr; const Eff& A = effA; const Eff& B = effB;
    double g = 0, mv = 0; for (int i = 0; i < m; ++i) { g = w.amp.next(); mv = w.mod.next(); }
    if (v[Glide] > 0.5 && !w.fading) { double tc = std::max(0.001, v[Glide] * 0.001 / 4.6); w.pitch += (w.tgt - w.pitch) * (1 - std::exp(-dt / tc)); } else w.pitch = w.tgt;
    double pitchNow = w.pitch + bendS * 2 + vibCents * 0.01;
    double f0 = 440 * std::pow(2.0, (pitchNow - 69) / 12), f0Note = 440 * std::pow(2.0, (w.tgt - 69) / 12);
    double morph = clampd(sm[Morph] + v[MorphEnv] * mv + press * 0.5, 0, 1), br = clampd(sm[Bright] + v[BrightEnv] * mv, 0, 1);
    double stretch1 = 1 + sm[Stretch], drift = sm[Drift]; bool useDrift = drift > 0.002; double fmix = sm[Formant]; bool useFmt = fmix > 0.002;
    double pd = v[PDecay]; bool useDec = pd > 0.001; double rate = 14 * pd * pd;
    double velGain = (1 - v[Vel]) + v[Vel] * w.vel, level = std::pow(10.0, sm[Level] / 20), gainV = g * velGain * exprS * level;
    if (useFmt && w.fmtVer != fmtVer) {
      for (int k = 0; k < kP; ++k) lfm[k] = (A.lr[k] + morph * (B.lr[k] - A.lr[k])) * stretch1;
      formantGains((int)std::floor(v[Vowel] + 0.5), v[FmtShift], f0Note, lfm, w.fm); w.fmtVer = fmtVer;
    }
    double dA = std::exp(-dt / 0.6), dB = std::sqrt(std::max(0.0, 1 - dA * dA)) * 1.7320508;
    Rng& r = rng; r.s = w.seed;
    int u = (int)std::floor(v[Unison] + 0.5) + 1; double det = sm[Detune];
    double Lmax = u > 1 ? std::pow(2.0, det / 1200) : 1, fLimit = 0.47 * sr, fTaper = 0.07 * sr;
    double sumsq = 0; bool brOn = br < 0.9995; double* e = w.e; double* x = w.x; double* fmv = w.fm;
    for (int k = 0; k < kP; ++k) {
      double lr = (A.lr[k] + morph * (B.lr[k] - A.lr[k])) * stretch1, ampDr = 1;
      if (useDrift) { x[k] = dA * x[k] + dB * r.bi(); ampDr = clampd(1 + 0.5 * drift * x[k], 0, 2); lr += drift * 12 * x[(k + 7) & (kP - 1)] / 1200; }
      frq[k] = f0 * std::pow(2.0, lr);
      double lv = (A.amp[k] + morph * (B.amp[k] - A.amp[k])) * S[k];
      if (useFmt) lv *= 1 + fmix * (fmv[k] - 1);
      if (brOn) lv *= std::pow(2.0, -6 * (1 - br) * t.LG[k]);
      sumsq += lv * lv;
      if (useDec) { double lam = rate * (A.dec[k] + morph * (B.dec[k] - A.dec[k])) * dtilt[k]; e[k] *= std::exp(-lam * dt); if (e[k] < 1e-6) e[k] = 0; }
      tgtL[k] = lv * e[k] * ampDr;
    }
    w.seed = r.s;
    double nm = levelNorm(sumsq) * gainV;
    for (int k = 0; k < kP; ++k) tgtL[k] *= nm;
    double w0 = 6.2831853 / sr;
    for (int k = 0; k < kP; ++k) { if (frq[k] * Lmax >= fLimit || tgtL[k] < 1e-8) { cs0[k] = 2; continue; } double ww = w0 * frq[k]; cs0[k] = std::cos(ww); sn0[k] = std::sin(ww); }
    double tot = 0, invm = 1.0 / m;
    for (int j = 0; j < kLayers; ++j) {
      if (j >= u && w.nLive[j] == 0) continue;
      double off = u == 1 ? 0 : (-1 + 2.0 * j / (u - 1)), cents = j < u ? off * det : 0, Lj = std::pow(2.0, cents / 1200), lgn = j < u ? 1 / std::sqrt((double)u) : 0;
      double pan = off * sm[Spread], ang = (pan + 1) * 0.78539816, gl = std::cos(ang), gr = std::sin(ang); int base = j * kP; double* vc = w.c; double* vs = w.s; double* va = w.a; uint8_t* live = w.live;
      int na = 0;
      for (int k = 0; k < kP; ++k) {
        double tg = 0; int ik = base + k;
        if (cs0[k] <= 1.5) { double fj = frq[k] * Lj, tp = clampd((fLimit - fj) / fTaper, 0, 1); tg = tgtL[k] * lgn * tp * tp * (3 - 2 * tp); }
        double a = va[ik];
        if (tg < 1e-8 && a < 1e-8) { va[ik] = 0; live[ik] = 0; continue; }
        if (!live[ik]) {
          live[ik] = 1; a = 0;
          if (j == 0) { vc[ik] = 1; vs[ik] = 0; } else { double ph = 6.2831853 * (0.5 + 0.5 * r.bi()); vc[ik] = std::cos(ph); vs[ik] = std::sin(ph); }
        }
        double cs = 1, sn = 0;
        if (cs0[k] <= 1.5) { double ww = w0 * frq[k], dl = ww * (Lj - 1), d2 = dl * dl, cd = 1 - 0.5 * d2 + d2 * d2 / 24, sd = dl * (1 - d2 / 6 + d2 * d2 / 120); cs = cs0[k] * cd - sn0[k] * sd; sn = sn0[k] * cd + cs0[k] * sd; }
        idxs[na] = k; cv[na] = vc[ik]; sv[na] = vs[ik]; av[na] = a; dv[na] = (tg - a) * invm; Cv[na] = cs; Sv[na] = sn; va[ik] = tg; ++na; tot += tg;
      }
      std::fill(buf, buf + m, 0.0);
      for (int q = 0; q < na; ++q) {
        double c = cv[q], s = sv[q], a = av[q]; const double d = dv[q], C = Cv[q], Sn = Sv[q];
        for (int i = 0; i < m; ++i) { buf[i] += a * s; double ns = s * C + c * Sn; c = c * C - s * Sn; s = ns; a += d; }
        double r2 = c * c + s * s, f = 1.5 - 0.5 * r2; int k = idxs[q]; vc[base + k] = c * f; vs[base + k] = s * f;
      }
      w.nLive[j] = na;
      for (int i = 0; i < m; ++i) { mixL[i] += buf[i] * gl; mixR[i] += buf[i] * gr; }
    }
    if (w.amp.st == 0) w.on = false;
    else if (w.amp.st == 3 && w.amp.v < 1e-5) w.on = false;
    else if (w.amp.st != 1 && tot < 1e-7 && gainV > 0) { if (++w.quiet > 8) w.on = false; } else w.quiet = 0;
    if (!w.on) { w.fading = false; w.held = false; }
  }
  void process(float* outL, float* outR, int n) override {
    started = true; int pos = 0;
    while (pos < n) {
      int m = std::min(ctl, n - pos); tick(m); std::fill(mixL, mixL + m, 0.0); std::fill(mixR, mixR + m, 0.0);
      for (int i = 0; i < kPool; ++i) if (vo[(size_t)i]->on) renderVoice(*vo[(size_t)i], m);
      for (int i = 0; i < m; ++i) {
        double l = mixL[i], r = mixR[i], al = std::fabs(l), ar = std::fabs(r);
        if (!(al < 1e6)) l = 0; if (!(ar < 1e6)) r = 0;
        if (al > 0.8 && al < 1e6) l = (l < 0 ? -1.0 : (l > 0 ? 1.0 : 0.0)) * (0.8 + 0.2 * fastTanh((al - 0.8) * 5));
        if (ar > 0.8 && ar < 1e6) r = (r < 0 ? -1.0 : (r > 0 ? 1.0 : 0.0)) * (0.8 + 0.2 * fastTanh((ar - 0.8) * 5));
        outL[pos + i] = (float)l; outR[pos + i] = (float)r;
      }
      pos += m;
    }
  }
};
inline Info info() {
  return Info{"additica", "Additica", "Additive synthesizer: 64 sine partials per note, two morphing spectra, tilt, comb and formant shaping, per-partial decay, drift and up to four detuned layers.", makeSpecs(), makeGroups(),
              Theme{"additica", 0xff0d1f2d, 0xff03080d, 0xff5fd0ff, 0xffe6f6ff, 0xffa4e4ff}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::additica
