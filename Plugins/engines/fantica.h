// Fantica: Fantom-style multi-category sound module, 41 patches built from 24 band-limited wavetables.
#pragma once
#include "../common/engine.h"
namespace occ { namespace fantica {
constexpr int kSize = 2048, kMask = 2047, kMips = 9, kMaxH = 384, kWaves = 24, kUni = 7, NV = 24;
struct Row { double q[24]; const char* name; };
static const Row T[] = {
  {{6, 3, 0.3, 0, 5, 0, 1, 0, 1, 6000, 0.1, 0.45, 0.7, 0.002, 3.5, 0, 0.4, 0.6, 0.1, 0.05, 0, 0, 0.7, 0.1}, "Concert Grand"},
  {{6, 5, 0.25, 12, 4, 0, 1, 0, 1, 10000, 0.1, 0.3, 0.8, 0.002, 2.5, 0, 0.3, 0.4, 0.2, 0.07, 0, 0, 0.8, 0.1}, "Bright Piano"},
  {{6, 6, 0.5, 0, 22, 0, 1, 0, 1, 5500, 0.1, 0.3, 0.7, 0.002, 2.5, 0, 0.3, 0.5, 0.2, 0.05, 0, 0, 0.6, 0}, "Honky-tonk"},
  {{6, 0, 0.4, 12, 3, 0, 1, 0, 0, 4000, 0.1, 0.3, 0.6, 0.003, 2, 0, 0.35, 0.7, 0.1, 0.02, 0, 0, 0.7, 0.35}, "Tine E.Piano"},
  {{6, 8, 0.3, 12, 2, 0, 1, 0, 0, 6500, 0.1, 0.25, 0.7, 0.002, 2.8, 0, 0.4, 0.5, 0.15, 0.03, 0, 0, 0.7, 0.3}, "Bell E.Piano"},
  {{5, 5, 0.5, 12, 0, 0, 1, 0, 4, 8000, 0, 0, 0, 0.004, 0.1, 1, 0.08, 0.1, 1, 0, 0, 0, 0.1, 0.3}, "Drawbar Organ"},
  {{5, 2, 0.3, 0, 0, 0, 1, 0, 0, 5500, 0.1, 0, 0.5, 0.004, 0.1, 1, 0.08, 0.1, 1, 0.02, 0, 0, 0.1, 0.2}, "Rock Organ"},
  {{5, 13, 0.5, 12, 0, 0, 1, 0, 0, 4000, 0.05, 0, 0.4, 0.05, 0.2, 1, 0.25, 0.1, 1, 0, 0, 0, 0.1, 0.5}, "Church Organ"},
  {{7, 2, 0.2, 0, 3, 0, 1, 0, 0, 5000, 0.2, 0.4, 0.7, 0.001, 0.4, 0.1, 0.1, 0.3, 0.1, 0.02, 0, 0, 0.7, 0}, "Clav"},
  {{4, 7, 0.5, 12, 6, 0, 1, 0, 0, 9000, 0.1, 0.2, 0.6, 0.001, 1.2, 0, 0.15, 0.3, 0.1, 0.02, 0, 0, 0.3, 0.1}, "Harpsichord"},
  {{13, 13, 0.6, 0, 9, 0, 5, 18, 0, 5500, 0.1, 0.2, 0.5, 0.5, 1, 0.9, 0.8, 1.2, 0.7, 0, 0.08, 0, 0.3, 0.6}, "Studio Strings"},
  {{13, 22, 0.5, 0, 8, 0, 5, 20, 0, 3500, 0.1, 0.2, 0.4, 1.1, 1.5, 0.9, 1.4, 1.8, 0.7, 0, 0.08, 0, 0.2, 0.6}, "Slow Strings"},
  {{13, 1, 0.3, 0, 6, 0, 3, 10, 0, 4500, 0.1, 0.5, 0.6, 0.002, 0.25, 0, 0.15, 0.2, 0, 0.02, 0, 0, 0.6, 0.2}, "Pizzicato"},
  {{12, 1, 0.3, 0, 6, 0, 2, 10, 1, 2200, 0.15, 0.6, 0.6, 0.05, 0.4, 0.8, 0.2, 0.5, 0.5, 0, 0, 0, 0.6, 0.15}, "Brass Section"},
  {{12, 3, 0.4, 0, 5, 0, 1, 0, 0, 1600, 0.1, 0.5, 0.5, 0.1, 0.5, 0.85, 0.3, 0.6, 0.5, 0, 0.05, 0, 0.4, 0.2}, "Soft Brass"},
  {{1, 1, 0.6, 0, 12, 0, 3, 16, 1, 2500, 0.2, 0.65, 0.6, 0.03, 0.4, 0.75, 0.2, 0.5, 0.4, 0, 0, 0, 0.6, 0.3}, "Synth Brass"},
  {{14, 0, 0.3, 12, 2, 0, 1, 0, 0, 7000, 0.05, 0.1, 0.5, 0.06, 0.2, 0.9, 0.2, 0.3, 0.6, 0.03, 0.1, 0, 0.4, 0.15}, "Flute"},
  {{15, 0, 0.2, 12, 2, 0, 1, 0, 0, 4000, 0.1, 0.2, 0.6, 0.04, 0.2, 0.9, 0.2, 0.3, 0.6, 0.01, 0.08, 0, 0.4, 0.15}, "Clarinet"},
  {{12, 15, 0.5, 0, 3, 0, 1, 0, 3, 2200, 0.45, 0.3, 0.7, 0.05, 0.2, 0.9, 0.2, 0.3, 0.6, 0.01, 0.1, 0, 0.4, 0.1}, "Oboe"},
  {{9, 20, 0.5, 0, 9, 0, 3, 14, 0, 3800, 0.15, 0.15, 0.5, 0.5, 1, 0.9, 0.9, 1.5, 0.7, 0, 0.1, 0, 0.3, 0.6}, "Choir Aahs"},
  {{10, 20, 0.5, 0, 8, 0, 3, 14, 0, 3000, 0.1, 0.1, 0.5, 0.5, 1, 0.9, 0.9, 1.5, 0.7, 0, 0.1, 0, 0.3, 0.6}, "Choir Oohs"},
  {{11, 9, 0.5, 0, 7, 0, 3, 16, 0, 4500, 0.15, 0.2, 0.5, 0.7, 1, 0.9, 1.2, 1.6, 0.6, 0, 0.12, 0, 0.3, 0.6}, "Vox Pad"},
  {{1, 1, 0.5, 0, 10, 0, 7, 26, 0, 7000, 0.15, 0.25, 0.6, 0.01, 0.3, 0.9, 0.2, 0.5, 0.6, 0, 0.05, 0, 0.5, 0.3}, "SuperSaw Lead"},
  {{2, 2, 0.4, 12, 5, 0, 1, 0, 0, 3500, 0.2, 0.4, 0.5, 0.005, 0.3, 0.9, 0.2, 0.5, 0.6, 0, 0.1, 0, 0.5, 0.1}, "Square Lead"},
  {{21, 1, 0.3, 0, 8, 0, 2, 10, 0, 5500, 0.3, 0.35, 0.6, 0.01, 0.5, 0.8, 0.2, 0.7, 0.5, 0, 0.1, 0, 0.5, 0.2}, "Sync Lead"},
  {{1, 2, 0.4, 0, 6, 0, 1, 0, 1, 1800, 0.25, 0.6, 0.5, 0.002, 0.25, 0, 0.15, 0.2, 0, 0, 0, 0, 0.6, 0.1}, "Mono Pluck"},
  {{22, 13, 0.4, 0, 9, 0, 3, 12, 0, 2800, 0.15, 0.25, 0.4, 0.9, 1.5, 0.9, 1.4, 1.5, 0.6, 0, 0.05, 0, 0.2, 0.6}, "Warm Pad"},
  {{17, 22, 0.5, 12, 6, 0, 2, 10, 0, 5000, 0.15, 0.15, 0.4, 0.9, 1, 0.9, 1.5, 2, 0.7, 0, 0.05, 0, 0.2, 0.5}, "Glass Pad"},
  {{16, 22, 0.5, 7, 10, 0, 3, 18, 0, 2500, 0.3, 0.35, 0.4, 1.5, 2, 0.8, 20, 3.5, 0.4, 0, 0.05, 0.9, 0.2, 0.6}, "Evolving Pad"},
  {{1, 1, 0.5, 0, 10, 0, 3, 15, 1, 900, 0.3, 0.8, 0.5, 1.8, 2.5, 0.8, 2, 3.5, 0.6, 0, 0, 0, 0.2, 0.5}, "Sweep Pad"},
  {{18, 1, 0.3, -12, 4, -1, 1, 0, 1, 900, 0.3, 0.6, 0.4, 0.002, 0.35, 0.5, 0.1, 0.25, 0.1, 0, 0, 0, 0.6, 0}, "Synth Bass"},
  {{18, 3, 0.4, 0, 3, -1, 1, 0, 0, 700, 0.1, 0.4, 0.5, 0.003, 0.9, 0.1, 0.2, 0.5, 0.1, 0.04, 0, 0, 0.7, 0}, "Fingered Bass"},
  {{0, 3, 0.3, 0, 0, -1, 1, 0, 0, 400, 0.05, 0.1, 0.4, 0.01, 0.5, 1, 0.15, 0.3, 1, 0, 0, 0, 0.5, 0}, "Sub Bass"},
  {{1, 2, 0.4, -12, 4, -1, 1, 0, 1, 600, 0.35, 0.8, 0.4, 0.002, 0.3, 0, 0.12, 0.18, 0, 0, 0, 0, 0.6, 0}, "Pluck Bass"},
  {{8, 0, 0.4, 19, 0, 0, 1, 0, 4, 8000, 0, 0, 0, 0.001, 4, 0, 1.2, 0.1, 1, 0.04, 0, 0, 0.6, 0.3}, "Bell"},
  {{0, 8, 0.25, 24, 3, 0, 1, 0, 4, 8000, 0, 0, 0, 0.002, 3, 0, 0.8, 0.1, 1, 0.03, 0.12, 0, 0.6, 0.2}, "Vibes"},
  {{0, 6, 0.25, 12, 2, 0, 1, 0, 0, 3500, 0.05, 0.3, 0.6, 0.001, 0.6, 0, 0.15, 0.3, 0, 0.08, 0, 0, 0.7, 0}, "Marimba"},
  {{8, 0, 0.3, 12, 1, 1, 1, 0, 4, 8000, 0, 0, 0, 0.001, 1.8, 0, 0.7, 0.1, 1, 0.03, 0, 0, 0.6, 0.15}, "Music Box"},
  {{16, 19, 0.4, 7, 6, 0, 1, 0, 0, 6000, 0.2, 0.5, 0.5, 0.001, 0.5, 0, 0.2, 0.35, 0, 0.03, 0, 0, 0.6, 0.2}, "Digital Pluck"},
  {{22, 2, 0.4, 0, 7, 0, 1, 0, 1, 2500, 0.2, 0.4, 0.5, 0.02, 0.4, 0.9, 0.3, 0.6, 0.6, 0, 0.08, 0, 0.5, 0.2}, "Warm Lead"},
  {{1, 1, 0, 0, 7, 0, 1, 0, 0, 8000, 0.15, 0, 0.5, 0.005, 0.3, 0.8, 0.3, 0.4, 0.2, 0, 0, 0, 0.5, 0}, "Init"},
};
constexpr int kPatches = (int)(sizeof(T) / sizeof(T[0]));
enum { Patch, Cutoff, Resonance, Attack, Release, Width, Ensemble, Touch, Octave, LfoRate, Vibrato, BendRange, Volume, Count };
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> names; for (auto& r : T) names.push_back(r.name);
  return {P("Preset", "", 0, kPatches - 1, kPatches - 1, "%.0f", false, names),
    P("Cutoff", "", 0, 1, 0.5), P("Resonance", "", 0, 1, 0.5), P("Attack", "", 0, 1, 0.5), P("Release", "", 0, 1, 0.5),
    P("Width", "", 0, 1, 0.5), P("Ensemble", "", 0, 1, 0.5), P("Touch", "", 0, 1, 0.5), P("Octave", "", -2, 2, 0, "%.0f"),
    P("LFO rate", "Hz", 0.1, 12, 5.5, "%.1f Hz", true), P("Mod wheel vibrato", "", 0, 1, 0.6), P("Bend range", "st", 0, 24, 2, "%.0f st"), P("Volume", "dB", -24, 6, -6, "%.1f dB")};
}
inline std::vector<Group> makeGroups() { return {{"Macros", {Cutoff, Resonance, Attack, Release, Width, Ensemble, Touch}}, {"Performance", {Octave, LfoRate, Vibrato, BendRange, Volume}}}; }
inline double formant(double h, double c, double w) { double d = (h - c) / w; return std::exp(-d * d); }
inline bool isPrime(int n) { if (n < 2) return false; for (int i = 2; i * i <= n; ++i) if (n % i == 0) return false; return true; }
inline void recipe(int w, double* a, double* p) {
  std::fill(a, a + kMaxH + 1, 0.0); std::fill(p, p + kMaxH + 1, 0.0); uint32_t seed = (uint32_t)(12345 + w * 977);
  auto rnd = [&]() { seed = seed * 1664525u + 1013904223u; return double(seed >> 8) / 16777216.0; }; const double PI = kPi;
  for (int h = 1; h <= kMaxH; ++h) {
    double x = h, v = 0, ph = 0;
    switch (w) {
      case 0: v = h == 1 ? 1 : 0; break;
      case 1: v = 1 / x; break;
      case 2: v = (h & 1) ? 1 / x : 0; break;
      case 3: v = (h & 1) ? 1 / (x * x) : 0; ph = ((h >> 1) & 1) ? PI : 0; break;
      case 4: v = std::fabs(std::sin(PI * x * 0.25)) / x; ph = 0.5 * PI * x * 0.25; break;
      case 5: { static const double d[9] = {0, 1, .8, .7, .5, 0, .4, 0, .3}; v = h < 9 ? d[h] : 0; break; }
      case 6: { static const double d[9] = {0, 1, .55, .3, .18, .08, .05, .13, .04}; v = h < 9 ? d[h] : 0; break; }
      case 7: v = h <= 24 ? std::pow(x, -0.65) * (0.25 + 0.75 * std::fabs(std::sin(PI * x * 0.21))) : 0; break;
      case 8: { static const double d[12] = {0, 1, .25, .8, .1, .6, .15, .5, .08, .35, .05, .25}; v = h < 12 ? d[h] : (h < 24 ? 0.12 / (x - 10) : 0); break; }
      case 9: v = formant(x, 5.4, 1.6) * 1 + formant(x, 8.5, 2.2) * 0.6 + formant(x, 1, 0.6) * 0.4; v /= std::pow(x, 0.3); break;
      case 10: v = formant(x, 2.3, 1) * 1 + formant(x, 6.7, 1.8) * 0.3 + formant(x, 1, 0.5) * 0.5; break;
      case 11: v = formant(x, 2.1, 0.9) * 0.9 + formant(x, 17.7, 3.5) * 0.35 + formant(x, 1, 0.5) * 0.4; break;
      case 12: v = std::pow(x, -0.75) * (0.4 + 1.6 * formant(x, 4, 3)); break;
      case 13: v = std::pow(x, -1.05); ph = 0.4 * std::sin(x * 1.7); break;
      case 14: { static const double d[6] = {0, 1, .22, .08, .03, .01}; v = h < 6 ? d[h] : 0; break; }
      case 15: v = (h & 1) ? std::pow(x, -0.9) : (h < 12 ? 0.04 / x : 0); break;
      case 16: v = h <= 32 ? (0.2 + 0.8 * rnd()) / std::sqrt(x) : 0; ph = rnd() * 2 * PI; break;
      case 17: v = (h % 2 == 1 && h % 3 != 0 && h <= 40) ? 1 / std::sqrt(x) : 0; break;
      case 18: { static const double d[7] = {0, 1, .7, .45, .25, .12, .06}; v = h < 7 ? d[h] : 0; break; }
      case 19: v = (isPrime(h) && h <= 60) ? 1 / std::pow(x, 0.4) : (h == 1 ? 1 : 0); break;
      case 20: v = (formant(x, 5, 2.2) + formant(x, 9, 3) * 0.5 + formant(x, 1, 0.7) * 0.5) / std::pow(x, 0.25); ph = rnd() * 2 * PI; break;
      case 21: v = h <= 40 ? (1 / x) * (0.15 + formant(x, 9, 3.5)) : 0; break;
      case 22: v = h <= 12 ? 1 / (x * x) : (h <= 40 ? 0.02 / x : 0); break;
      default: v = (h % 2 == 0) ? 1 / x : (h == 1 ? 0.5 : 0);
    }
    a[h] = v; p[h] = ph;
  }
}
struct Bank {
  std::vector<float> tab;
  Bank() {
    tab.assign((size_t)kWaves * kMips * kSize, 0.f); std::vector<double> amp(kMaxH + 1), ph(kMaxH + 1);
    for (int w = 0; w < kWaves; ++w) {
      recipe(w, amp.data(), ph.data()); std::vector<double> acc(kSize, 0.0); int done = 0;
      for (int m = kMips - 1; m >= 0; --m) {
        int H = kMaxH >> m;
        for (int h = done + 1; h <= H; ++h) {
          if (amp[(size_t)h] == 0) continue; double dw = 2 * kPi * h / kSize, c = std::cos(ph[(size_t)h]), s = std::sin(ph[(size_t)h]); double cd = std::cos(dw), sd = std::sin(dw), A = amp[(size_t)h];
          for (int n = 0; n < kSize; ++n) { acc[(size_t)n] += A * s; double ns = s * cd + c * sd; c = c * cd - s * sd; s = ns; }
        }
        done = H; size_t off = ((size_t)w * kMips + (size_t)m) * kSize; for (int n = 0; n < kSize; ++n) tab[off + (size_t)n] = (float)acc[(size_t)n];
      }
      size_t o0 = (size_t)w * kMips * kSize; double e = 0; for (int n = 0; n < kSize; ++n) e += double(tab[o0 + (size_t)n]) * double(tab[o0 + (size_t)n]);
      double rms = std::sqrt(e / kSize), k = rms > 1e-9 ? 0.32 / rms : 1;
      for (int m = 0; m < kMips; ++m) { size_t off = ((size_t)w * kMips + (size_t)m) * kSize; for (int n = 0; n < kSize; ++n) tab[off + (size_t)n] = (float)(double(tab[off + (size_t)n]) * k); }
    }
  }
};
inline const Bank& bank() { static const Bank b; return b; }
inline int mipFor(double dt) { double allowed = 0.45 / std::max(1e-6, dt); int m = 0; while (m < kMips - 1 && (kMaxH >> m) > allowed) ++m; return m; }
inline double wtRead(const float* TAB, int w, int m, double ph) {
  size_t o = ((size_t)w * kMips + (size_t)m) * kSize; double x = ph * kSize; long long i = (long long)std::floor(x); double f = x - double(i);
  double y0 = TAB[o + (size_t)((i - 1) & kMask)], y1 = TAB[o + (size_t)(i & kMask)], y2 = TAB[o + (size_t)((i + 1) & kMask)], y3 = TAB[o + (size_t)((i + 2) & kMask)];
  return y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
}
struct Patch_ { double w1 = 1, w2 = 1, mix2 = 0, semi2 = 0, det2 = 7, oct = 0, uni = 1, uniDet = 14, uniSpread = 0.7, ftype = 0, cut = 8000, res = 0.15, envAmt = 0, kt = 0.5, a = 0.005, d = 0.3, s = 0.8, r = 0.3, fd = 0.4, fs = 0.2, noise = 0, noiseDec = 0.03, lfoP = 0, lfoF = 0, velAmp = 0.5, velFilt = 0.3, level = 1, pan = 0; };
struct UniCache { double U = -1, det = -1, sp = -1, k[7], gl[7], gr[7]; };
struct WtVoice {
  Adsr ae, fe; Svf sv[2], svR[2]; Noise noise; double ph[2 * kUni]; int note_ = 60; double tune = 0, vel = 1, ne = 0; bool gate_ = false; long long age = 0;
  WtVoice() { std::fill(ph, ph + 2 * kUni, 0.0); }
  void start(const Patch_& p, int note, double v, double sr, double tuneCents) {
    tune = tuneCents * 0.01; note_ = note; vel = v; gate_ = true; ae.setSr(sr); fe.setSr(sr);
    ae.set(p.a, p.d, p.s, p.r); fe.set(0.001, p.fd, p.fs, p.r); ae.gateOn(true); fe.gateOn(true);
    sv[0].reset(); sv[1].reset(); svR[0].reset(); svR[1].reset(); ne = 1;
    uint32_t s = (uint32_t)note * 2654435761u + 0x9E3779B9u; for (int i = 0; i < 2 * kUni; ++i) { s = s * 1664525u + 1013904223u; ph[i] = double(s >> 8) / 16777216.0; }
    noise.s = s | 1u;
  }
  void release() { gate_ = false; ae.gateOff(); fe.gateOff(); }
  void retime(const Patch_& p) { ae.set(p.a, p.d, p.s, p.r); fe.set(0.001, p.fd, p.fs, p.r); }
  bool active() const { return ae.active(); }
  void render(const Patch_& p, double sr, double lfo, double bendSt, double* out, UniCache& C, const float* TAB) {
    double base = note_ + tune + p.oct * 12 + bendSt + p.lfoP * lfo, f1 = midiHz(base), f2 = midiHz(base + p.semi2 + p.det2 * 0.01);
    double U = clampd(p.uni, 1, kUni), dt1 = std::min(0.45, f1 / sr), dt2 = std::min(0.45, f2 / sr); int m1 = mipFor(dt1 * (U > 1 ? 1.01 : 1)), m2 = mipFor(dt2 * (U > 1 ? 1.01 : 1));
    double sl = 0, srr = 0; bool two = p.mix2 > 0.001;
    if (C.U != U || C.det != p.uniDet || C.sp != p.uniSpread) {
      C.U = U; C.det = p.uniDet; C.sp = p.uniSpread;
      for (int u = 0; u < U; ++u) { double pos = U > 1 ? (u / (U - 1)) * 2 - 1 : 0, sp = pos * p.uniSpread; C.k[u] = std::pow(2.0, pos * p.uniDet / 1200); C.gl[u] = std::sqrt(0.5 * (1 - sp)); C.gr[u] = std::sqrt(0.5 * (1 + sp)); }
    }
    for (int u = 0; u < U; ++u) {
      double k = C.k[u];
      double x = wtRead(TAB, (int)p.w1, m1, ph[u]); ph[u] += dt1 * k; if (ph[u] >= 1) ph[u] -= 1;
      if (two) { x = x * (1 - 0.5 * p.mix2) + wtRead(TAB, (int)p.w2, m2, ph[kUni + u]) * p.mix2; ph[kUni + u] += dt2 * k; if (ph[kUni + u] >= 1) ph[kUni + u] -= 1; }
      sl += x * C.gl[u]; srr += x * C.gr[u];
    }
    double norm = 1 / std::sqrt(U); sl *= norm; srr *= norm;
    if (p.noise > 0) { double n = noise.white() * p.noise * ne; ne *= std::exp(-1 / (std::max(0.002, p.noiseDec) * sr)); sl += n; srr += n; }
    double fe_ = fe.next(), ae_ = ae.next();
    if (p.ftype != 4) {
      double oct = p.envAmt * 5 * fe_ + p.kt * (note_ - 60) / 12 + p.lfoF * lfo + p.velFilt * (vel - 0.5) * 2, hz = p.cut * std::pow(2.0, oct), q = 0.55 + p.res * 8; Svf &s0 = sv[0], &s1 = sv[1], &r0 = svR[0], &r1 = svR[1];
      s0.set(hz, q, sr);
      s1.a1 = r0.a1 = r1.a1 = s0.a1; s1.a2 = r0.a2 = r1.a2 = s0.a2; s1.a3 = r0.a3 = r1.a3 = s0.a3; s1.k = r0.k = r1.k = s0.k;
      s0.run(sl); r0.run(srr);
      switch ((int)p.ftype) {
        case 0: sl = s0.low; srr = r0.low; break;
        case 1: s1.run(s0.low); r1.run(r0.low); sl = s1.low; srr = r1.low; break;
        case 2: sl = s0.high; srr = r0.high; break;
        default: sl = s0.band * (0.8 + p.res); srr = r0.band * (0.8 + p.res);
      }
    }
    double g = ae_ * (1 - p.velAmp + p.velAmp * vel) * p.level, pl = std::sqrt(0.5 * (1 - p.pan)), pr = std::sqrt(0.5 * (1 + p.pan));
    out[0] += sl * g * pl * 1.414; out[1] += srr * g * pr * 1.414;
  }
};
struct Engine : EngineBase {
  std::vector<Spec> specs; WtVoice voice[NV]; Patch_ patch, p2; Chorus chorus; Lfo lfo; double bend = 0, mod = 0, chorusAmt = 0; UniCache cache;
  explicit Engine(double sr_) : EngineBase(sr_), chorus(sr_) { specs = makeSpecs(); bank(); initParams(specs); rebuild(); }
  void rebuild() {
    int pi = (int)clampd(std::floor(v[Patch] + 0.5), 0, kPatches - 1); const double* q = T[pi].q; Patch_& p = patch;
    p.w1 = q[0]; p.w2 = q[1]; p.mix2 = q[2]; p.semi2 = q[3]; p.det2 = q[4]; p.oct = q[5] + std::floor(v[Octave] + 0.5);
    p.uni = q[6]; p.uniDet = q[7] * 2 * v[Width]; p.uniSpread = std::min(1.0, 1.4 * v[Width]);
    p.ftype = q[8]; p.cut = q[9] * std::pow(2.0, (v[Cutoff] - 0.5) * 6); p.res = clampd(q[10] + (v[Resonance] - 0.5) * 0.9, 0, 1); p.envAmt = q[11]; p.kt = q[12];
    double ak = std::pow(4.0, (v[Attack] - 0.5) * 2), rk = std::pow(4.0, (v[Release] - 0.5) * 2);
    p.a = q[13] * ak; p.d = q[14]; p.s = q[15]; p.r = q[16] * rk; p.fd = q[17]; p.fs = q[18]; p.noise = q[19] * 0.5; p.lfoP = q[20]; p.lfoF = q[21];
    p.velAmp = clampd(q[22] * 2 * v[Touch], 0, 1); p.velFilt = p.velAmp * 0.5;
    chorusAmt = clampd(q[23] + (v[Ensemble] - 0.5), 0, 1);
  }
  void set(int id, double x) override { if (id < 0 || id >= Count) return; v[(size_t)id] = x; rebuild(); for (auto& s : voice) if (s.active()) s.retime(patch); }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; }
  void allNotesOff() override { for (auto& s : voice) if (s.active()) s.release(); }
  void noteOn(int note, double vel) override {
    int pick = -1; for (int i = 0; i < NV; ++i) if (!voice[i].active()) { pick = i; break; }
    if (pick < 0) { long long old = 1LL << 60; for (int i = 0; i < NV; ++i) if (voice[i].age < old) { old = voice[i].age; pick = i; } }
    WtVoice& s = voice[pick]; s.start(patch, note, vel, sr, noteTune); s.age = ++counter;
  }
  void noteOff(int note) override { for (auto& s : voice) if (s.active() && s.gate_ && s.note_ == note) s.release(); }
  void process(float* outL, float* outR, int n) override {
    double vol = std::pow(10.0, v[Volume] / 20), bendSt = bend * v[BendRange], io[2]; const float* TAB = bank().tab.data();
    p2 = patch; p2.lfoP += mod * v[Vibrato] * 0.7; WtVoice* act[NV]; int na = 0; for (auto& s : voice) if (s.active()) act[na++] = &s;
    for (int i = 0; i < n; ++i) {
      double l = lfo.next(v[LfoRate], sr, 0); io[0] = 0; io[1] = 0;
      for (int k = 0; k < na; ++k) act[k]->render(p2, sr, l, bendSt, io, cache, TAB);
      outL[i] = (float)(fastTanh(io[0] * 0.7) * 1.25 * vol); outR[i] = (float)(fastTanh(io[1] * 0.7) * 1.25 * vol);
    }
    if (chorusAmt > 0.001) for (int i = 0; i < n; ++i) { double a = outL[i], b = outR[i]; chorus.process(a, b, 0.55, 0.7, chorusAmt); outL[i] = (float)a; outR[i] = (float)b; }
  }
};
inline Info info() {
  return Info{"fantica", "Fantica", "Fantom-style sound module: 41 patches (pianos, organs, strings, brass, winds, voices, leads, pads, basses, mallets) from 24 wavetables.", makeSpecs(), makeGroups(),
              Theme{"fantica", 0xff281426, 0xff0a040a, 0xffff7ad9, 0xfffbe8f6, 0xffffb0ea}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::fantica
