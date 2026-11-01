// Clavica: five keyboards of different physics under one set of knobs (electric piano, clav, harpsichord, tape keys, string machine).
// 1:1 port of the web engine. Tape loops are synthesised once per tape type on first use and shared by every instance.
#pragma once
#include "../common/engine.h"
#include <cmath>
#include <mutex>
namespace occ { namespace clavica {
enum { Preset, Model, Voice, Attack, Position, Damping, Color, Tone, Drive, Mod, Rate, Release, Tune, Level, Count };
enum { EP = 0, CLAV = 1, HARP = 2, TAPE = 3, STR = 4 };
constexpr int kVoices = 24, kBlock = 128, kExc = 4096, kCenters = 15, kLoopLen = 48000, kTypes = 4, kLoopSr = 24000;

inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> pn = {"- (keep)", "Mellow Tines", "Bark Tine", "Reed Wurly", "Glass Bell", "Vibra Bar", "Funk Clav", "Quack Neck", "Muted Chick", "Baroque 8'", "Octave Sparkle", "Lute Stop", "Flute Tape", "String Tape", "Choir Tape", "Broken Motor", "Violin Ensemble", "Cello Pad"};
  return {
    P("Preset", "", 0, 17, 0, "%.0f", false, pn),
    P("Model", "", 0, 4, 0, "%.0f", false, {"Electric Piano", "Clav", "Harpsichord", "Tape Keys", "String Machine"}),
    P("Voice", "", 0, 3, 0, "%.0f", false, {"I", "II", "III", "IV"}),
    P("Attack", "", 0, 1, 0.5), P("Position", "", 0, 1, 0.5), P("Damping", "", 0, 1, 0.4), P("Color", "", 0, 1, 0.5),
    P("Tone", "", 0, 1, 0.5), P("Drive", "", 0, 1, 0.2), P("Mod", "", 0, 1, 0.4), P("Rate", "Hz", 0.1, 12, 4.5, "%.2f Hz", true),
    P("Release", "s", 0.02, 4, 0.25, "%.2f s", true), P("Tune", "cents", -100, 100, 0, "%+.0f ct"), P("Level", "dB", -24, 12, 0, "%+.1f dB"),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Instrument", {Preset, Model, Voice}}, {"Playing", {Attack, Position, Damping, Color, Release, Tune}}, {"Sound", {Tone, Drive, Mod, Rate, Level}}};
}

static const double GAIN[200] = {
  0.4754, 0.4317, 0.4480, 0.4802, 0.5250, 0.6006, 0.7022, 0.8657, 1.0846, 1.4282,
  0.4936, 0.4581, 0.4991, 0.5599, 0.6420, 0.7811, 0.9654, 1.2617, 1.6614, 2.3475,
  0.4530, 0.4364, 0.4634, 0.5047, 0.5606, 0.6530, 0.7749, 0.9683, 1.3635, 1.7938,
  0.4677, 0.4262, 0.4410, 0.4738, 0.5182, 0.5928, 0.6938, 0.8556, 1.0706, 1.4393,
  0.1043, 0.1431, 0.2103, 0.3406, 0.5536, 1.0632, 2.0692, 6.9038, 12, 12,
  0.0500, 0.0616, 0.0864, 0.1272, 0.2006, 0.3956, 1.0252, 6.2548, 12, 12,
  0.0509, 0.0687, 0.0973, 0.1444, 0.2286, 0.4558, 1.1510, 5.1379, 12, 12,
  0.0659, 0.0897, 0.1259, 0.1900, 0.3009, 0.5738, 1.3693, 9.9602, 12, 12,
  0.0731, 0.0908, 0.1313, 0.2007, 0.3175, 0.5830, 1.3609, 4.0015, 12, 12,
  0.0500, 0.0740, 0.1087, 0.1803, 0.3503, 0.9445, 3.2915, 12, 12, 12,
  0.0500, 0.0523, 0.0771, 0.1213, 0.1913, 0.3526, 0.8542, 3.8093, 12, 12,
  0.0780, 0.1046, 0.1618, 0.2773, 0.6102, 1.9513, 5.6451, 12, 12, 12,
  1.0904, 1.4116, 0.9367, 0.9505, 1.0778, 1.3689, 1.1331, 1.1009, 1.4882, 1.5909,
  0.7753, 0.6984, 0.7123, 0.7345, 0.7421, 0.7525, 0.7234, 0.8927, 1.0072, 1.7320,
  1.0400, 1.0277, 1.0205, 1.0132, 0.9212, 0.9079, 0.9295, 1.0836, 1.3589, 2.1759,
  0.7610, 0.6191, 0.6760, 0.7032, 0.6728, 0.6159, 0.6815, 0.8233, 0.9026, 1.6270,
  0.9622, 0.6089, 0.4618, 0.3280, 0.2224, 0.1942, 0.1906, 0.1692, 0.2430, 0.8162,
  0.5857, 0.3792, 0.2756, 0.1962, 0.1722, 0.1443, 0.1543, 0.2086, 0.2884, 0.8450,
  0.1766, 0.1532, 0.1590, 0.1870, 0.2047, 0.2191, 0.3228, 1.0463, 4.4537, 12,
  0.1973, 0.1705, 0.1785, 0.1941, 0.1980, 0.2020, 0.2088, 0.2230, 0.2694, 0.7218,
};
inline double clampf(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline double jsRound(double x) { return std::floor(x + 0.5); }
inline double modelGain(double model, double vs, double note) {
  double x = clampf((note - 24) / 10.5, 0, 8.999); int i = (int)std::floor(x); double f = x - i; int b = (int)((clampf(model, 0, 4) * 4 + clampf(vs, 0, 3)) * 10);
  return GAIN[b + i] + (GAIN[b + i + 1] - GAIN[b + i]) * f;
}
static const double PRE[17][13] = {  // model, voice, attack, position, damping, color, tone, drive, mod, rate, release, tune, level
  {0, 0, 0.35, 0.35, 0.35, 0.40, 0.45, 0.10, 0.35, 4.8, 0.30, 0, 0},
  {0, 0, 0.78, 0.80, 0.30, 0.55, 0.55, 0.40, 0.30, 5.5, 0.20, 0, -1},
  {0, 1, 0.60, 0.55, 0.50, 0.40, 0.55, 0.30, 0.50, 5.5, 0.15, 0, 0},
  {0, 2, 0.45, 0.40, 0.30, 0.80, 0.60, 0.10, 0.25, 4.0, 0.40, 0, 0},
  {0, 3, 0.40, 0.30, 0.25, 0.50, 0.50, 0.00, 0.40, 5.0, 0.60, 0, 0},
  {1, 2, 0.75, 0.45, 0.45, 0.45, 0.60, 0.25, 0.00, 4.5, 0.06, 0, 0},
  {1, 0, 0.65, 0.80, 0.30, 0.65, 0.60, 0.35, 0.25, 0.8, 0.10, 0, 0},
  {1, 1, 0.55, 0.35, 0.85, 0.30, 0.50, 0.20, 0.00, 4.5, 0.04, 0, 1},
  {2, 0, 0.60, 0.50, 0.35, 0.55, 0.55, 0.00, 0.15, 1.2, 0.12, 0, 0},
  {2, 2, 0.70, 0.45, 0.40, 0.60, 0.60, 0.00, 0.25, 1.5, 0.12, 0, 0},
  {2, 3, 0.45, 0.30, 0.50, 0.50, 0.45, 0.05, 0.10, 1.0, 0.10, 0, 1},
  {3, 0, 0.55, 0.45, 0.30, 0.30, 0.50, 0.10, 0.35, 5.0, 0.35, 0, 0},
  {3, 1, 0.45, 0.60, 0.35, 0.40, 0.50, 0.15, 0.25, 4.8, 0.40, 0, 0},
  {3, 2, 0.40, 0.70, 0.40, 0.45, 0.55, 0.15, 0.30, 4.5, 0.45, 0, 0},
  {3, 3, 0.30, 0.50, 0.85, 1.00, 0.40, 0.30, 0.50, 3.0, 0.70, 0, 0},
  {4, 0, 0.35, 0.65, 0.30, 0.25, 0.55, 0.00, 0.80, 4.5, 0.40, 0, 0},
  {4, 2, 0.25, 0.20, 0.45, 0.20, 0.45, 0.00, 0.70, 3.5, 0.70, 0, 0},
};

// ---- small DSP helpers
enum { BQ_Peak = 0, BQ_LowShelf = 1, BQ_HighShelf = 2, BQ_LowPass = 3, BQ_HighPass = 4, BQ_BandPass = 5 };
struct Biquad {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double gainDb, double sr) {
    f = clampf(f, 5, sr * 0.49); q = std::max(0.05, q);
    const double A = std::pow(10.0, gainDb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q); double B0, B1, B2, A0, A1, A2;
    switch (t) {
      case 0: B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; break;
      case 1: { const double s = 2 * std::sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; break; }
      case 2: { const double s = 2 * std::sqrt(A) * al; B0 = A * ((A + 1) + (A - 1) * cw + s); B1 = -2 * A * ((A - 1) + (A + 1) * cw); B2 = A * ((A + 1) + (A - 1) * cw - s); A0 = (A + 1) - (A - 1) * cw + s; A1 = 2 * ((A - 1) - (A + 1) * cw); A2 = (A + 1) - (A - 1) * cw - s; break; }
      case 3: B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = (1 - cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
      case 4: B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = (1 + cw) / 2; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
      default: B0 = al; B1 = 0; B2 = -al; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al;
    }
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  void copyFrom(const Biquad& o) { b0 = o.b0; b1 = o.b1; b2 = o.b2; a1 = o.a1; a2 = o.a2; }
  double run(double x) { const double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
  void reset() { z1 = z2 = 0; }
};
struct OnePoleLP { double a = 0, z = 0; void set(double hz, double sr) { a = std::exp(-2 * kPi * clampf(hz, 1, sr * 0.49) / sr); } double run(double x) { z = x * (1 - a) + z * a; return z; } void reset() { z = 0; } };
struct OnePoleHP { OnePoleLP lp; void set(double hz, double sr) { lp.set(hz, sr); } double run(double x) { return x - lp.run(x); } void reset() { lp.reset(); } };
struct Smooth { double cur = 0, target = 0, coef = 0.999; void setTime(double s, double sr) { coef = std::exp(-1 / std::max(1.0, s * sr)); } double next() { cur = target + (cur - target) * coef; return cur; } };
struct Rng {
  uint32_t s = 0x91E10DA5u;
  double uni() { uint32_t x = s; x ^= x << 13; x ^= x >> 17; x ^= x << 5; s = x; return (x >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
// 2x oversampled nonlinearity: half-band Kaiser FIR (63 taps), zero taps skipped.
struct Oversampler {
  static constexpr int n = 63, half = 31;
  double h[n], up[n], dn[n], hk[n]; int ks[n], nks = 0, pu = 0, pd = 0; double pre = 1, bias = 0, tb = 0, comp = 1;
  Oversampler() {
    const double beta = 9, pi = kPi;
    auto b0 = [](double x) { double s = 1, t = 1; for (int k = 1; k < 40; ++k) { t *= (x / (2 * k)) * (x / (2 * k)); s += t; } return s; };
    double sum = 0;
    for (int k = 0; k < n; ++k) { const double x = k - half, sinc = x == 0 ? 0.5 : std::sin(pi * x / 2) / (pi * x), r = 2.0 * k / (n - 1) - 1, w = b0(beta * std::sqrt(std::max(0.0, 1 - r * r))) / b0(beta); h[k] = sinc * w; sum += sinc * w; }
    for (int k = 0; k < n; ++k) h[k] /= sum;
    for (int k = (half & 1) ? 0 : 1; k < n; k += 2) if (k != half) { ks[nks] = k; hk[nks] = h[k]; ++nks; }
    for (int i = 0; i < n; ++i) up[i] = dn[i] = 0;
  }
  double fir(const double* buf, int pos) const {
    int i0 = pos - half; if (i0 < 0) i0 += n; double y = h[half] * buf[i0];
    for (int j = 0; j < nks; ++j) { int idx = pos - ks[j]; if (idx < 0) idx += n; y += hk[j] * buf[idx]; }
    return y;
  }
  double sat(double x) const { return (std::tanh(x * pre + bias) - tb) * comp; }
  double run(double x) {
    pu = (pu + 1) % n; up[pu] = x * 2; const double o0 = fir(up, pu);
    pu = (pu + 1) % n; up[pu] = 0; const double o1 = fir(up, pu);
    const double a = sat(o0), b = sat(o1);
    pd = (pd + 1) % n; dn[pd] = a; pd = (pd + 1) % n; dn[pd] = b; return fir(dn, pd);
  }
};
inline double apDelay(double a, double w) { return 1 - 2 * std::atan2(a * std::sin(w), 1 + a * std::cos(w)) / w; }
inline double lpDelay(double a, double w) { return std::atan2(a * std::sin(w), 1 - a * std::cos(w)) / w; }
inline double lpMag(double a, double w) { return (1 - a) / std::sqrt(std::max(1e-12, 1 + a * a - 2 * a * std::cos(w))); }
inline double solveEta(double delay, double w) { double lo = -0.6, hi = 0.25; for (int i = 0; i < 40; ++i) { const double m = 0.5 * (lo + hi); if (apDelay(m, w) > delay) lo = m; else hi = m; } return 0.5 * (lo + hi); }
inline double pickupCurve(double u, double d, bool reed) { const double lim = d - 0.12; u = clampf(u, -lim, lim); double y = u / (d - u); if (reed) y += 0.9 * u * u; return y * d * 0.5; }
inline double pickupDistance(double pos) { const double q = 1 - clampf(pos, 0, 1); return 1.08 + 2.2 * q * q; }
inline double combGain(double g, double n) { return std::fabs(std::sin(3.14159265 * g * n)) * 2; }
inline double polyBlepF(double t, double dt) { if (t < dt) { const double x = t / dt; return x + x - x * x - 1; } if (t > 1 - dt) { const double x = (t - 1) / dt; return x * x + x + x + 1; } return 0; }

// ---- tape loops: synthesised once per type, on first use, shared by every instance
struct Loops { std::vector<float> data[kTypes]; double freq[kTypes][kCenters]; bool built[kTypes]; std::mutex mu; Loops() { for (int t = 0; t < kTypes; ++t) { built[t] = false; for (int c = 0; c < kCenters; ++c) freq[t][c] = 0; } } };
inline Loops& loops() { static Loops L; return L; }
struct VC { double j, vibCyc, vibDepth, amp, f1, f2, f3, g1, g2, g3, bw, rolloff, cutoff; };
inline void buildLoops(int type) {
  Loops& LO = loops(); std::lock_guard<std::mutex> lock(LO.mu); if (LO.built[type]) return;
  const int L = kLoopLen; const double LS = kLoopSr, pi2 = 6.28318530717959; const int T = 4096;
  std::vector<float> sinT(T); for (int i = 0; i < T; ++i) sinT[i] = (float)std::sin(pi2 * i / T);
  std::vector<float> data((size_t)kCenters * L);
  for (int ci = 0; ci < kCenters; ++ci) {
    const double fc = 440 * std::pow(2.0, (24 + 6 * ci - 69) / 12.0), N = std::max(1.0, jsRound(fc * L / LS)), fa = N * LS / L; LO.freq[type][ci] = fa;
    float* out = data.data() + (size_t)ci * L;
    std::vector<VC> vc; double breathAmp = 0, breathLo = 2000, breathHi = 6000, amC = 1, amD = 0.1; const double partialsMax = 100;
    if (type == 0) { vc = {{0, 10, 0.05, 1.0, 0, 0, 0, 0, 0, 0, 0, 0, 6000}}; breathAmp = 0.05; amC = 1; amD = 0.08; }
    else if (type == 1) { vc = {{-1, 9, 0.03, 0.8, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000}, {0, 10, 0.03, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000}, {1, 11, 0.03, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000}, {2, 12, 0.03, 0.7, 0, 0, 0, 0, 0, 0, 0, 1.0, 7000}}; breathAmp = 0.03; breathLo = 3000; breathHi = 9000; amC = 3; amD = 0.12; }
    else if (type == 2) { vc = {{-1, 10, 0.05, 1.0, 700, 1100, 2450, 1.0, 0.7, 0.35, 220, 1.0, 5500}, {0, 11, 0.05, 0.9, 450, 800, 2400, 1.0, 0.5, 0.3, 200, 1.0, 5500}, {1, 12, 0.05, 1.0, 700, 1150, 2500, 1.0, 0.6, 0.3, 230, 1.0, 5500}, {2, 13, 0.05, 0.8, 550, 1800, 2500, 1.0, 0.4, 0.3, 240, 1.0, 5500}, {0, 9, 0.05, 0.7, 330, 800, 2300, 1.0, 0.3, 0.2, 180, 1.0, 5500}}; breathAmp = 0.04; breathLo = 600; breathHi = 3000; amC = 2; amD = 0.1; }
    else { vc = {{-1, 7, 0.02, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500}, {0, 8, 0.02, 1.0, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500}, {1, 9, 0.02, 0.9, 0, 0, 0, 0, 0, 0, 0, 1.3, 1500}}; breathAmp = 0.04; breathLo = 200; breathHi = 1800; amC = 3; amD = 0.2; }
    const int nmax = (int)std::floor(std::min(partialsMax * 1.2, std::floor(10500 / fa))), nv = (int)vc.size(); std::vector<float> tab((size_t)T * nv, 0.f);
    for (int v = 0; v < nv; ++v) {
      const VC& c = vc[v]; std::vector<double> a(nmax + 1, 0.0); double norm = 0;
      for (int n = 1; n <= nmax; ++n) {
        const double fn = n * fa; double amp;
        if (type == 0) { static const double fl[8] = {1, 0.45, 0.2, 0.08, 0.04, 0.02, 0.01, 0.005}; amp = n <= 8 ? fl[n - 1] : 0; }
        else if (type == 2) {
          auto g = [&](double F, double G) { const double x = (fn - F) / c.bw; return G * std::exp(-0.5 * x * x * (F > 1500 ? 0.25 : 1.0)); };
          amp = (1 / std::pow((double)n, 0.6)) * (g(c.f1, c.g1) + g(c.f2, c.g2) + g(c.f3, c.g3) + 0.03) * (n == 1 ? 0.7 : 1.0);
        } else amp = 1 / std::pow((double)n, c.rolloff);
        amp *= 1 / std::sqrt(1 + std::pow(fn / c.cutoff, 4.0)); a[n] = amp; norm += amp * amp;
      }
      const int off = v * T; const double sn = std::sqrt(std::max(1e-9, norm));
      for (int n = 1; n <= nmax; ++n) {
        const double am = a[n] / sn, ph0 = 0.7 * n * n + 1.3 * v; const int po = (int)jsRound(std::fmod(ph0, 1.0) * T); if (am < 1e-5) continue;
        for (int k = 0; k < T; ++k) tab[off + k] = (float)(tab[off + k] + am * sinT[(n * k + po) & (T - 1)]);
      }
    }
    const int X = 800; std::vector<float> nz(L + X); uint32_t s = (uint32_t)(0x1234567 + (type * 977 + ci * 131));
    for (size_t i = 0; i < nz.size(); ++i) { s ^= s << 13; s ^= s >> 17; s ^= s << 5; nz[i] = (float)((s >> 8) * (1.0 / 16777216) * 2 - 1); }
    { Biquad hp, lpf; hp.set(BQ_HighPass, breathLo, 0.7, 0, LS); lpf.set(BQ_LowPass, breathHi, 0.7, 0, LS); for (size_t i = 0; i < nz.size(); ++i) nz[i] = (float)lpf.run(hp.run(nz[i])); }
    std::vector<float> nz2(L);
    for (int i = 0; i < L; ++i) { if (i < X) { const double t = (double)i / X; nz2[i] = (float)(nz[i] * std::sin(0.5 * 3.14159265 * t) + nz[L + i] * std::cos(0.5 * 3.14159265 * t)); } else nz2[i] = nz[i]; }
    double nrm = 0; for (int i = 0; i < L; ++i) nrm += (double)nz2[i] * nz2[i]; nrm = std::sqrt(nrm / L); for (int i = 0; i < L; ++i) nz2[i] = (float)(nz2[i] / std::max(1e-9, nrm));
    for (int i = 0; i < L; ++i) {
      const double t = (double)i / L; double sum = 0;
      for (int v = 0; v < nv; ++v) {
        const VC& c = vc[v]; const double cyc = (N + c.j) * t + (c.vibDepth / pi2) * std::sin(pi2 * c.vibCyc * t), ph = cyc - std::floor(cyc), fi = ph * T, i0d = std::floor(fi), fr = fi - i0d; const int i0 = (int)i0d, o = v * T;
        const double t0 = tab[o + (i0 & (T - 1))], t1 = tab[o + ((i0 + 1) & (T - 1))], val = t0 + (t1 - t0) * fr;
        sum += c.amp * val * (1 + 0.1 * std::sin(pi2 * (nv > 1 ? 1 + v : 1) * t + 1.7 * v));
      }
      const double am = 1 + amD * std::sin(pi2 * amC * t) + 0.5 * amD * std::sin(pi2 * (amC + 1) * t + 0.9), bam = 0.6 + 0.4 * std::sin(pi2 * 2 * t + 0.3);
      out[i] = (float)(sum * am + breathAmp * (type == 3 ? 3 : 1) * bam * nz2[i] * std::sqrt((double)nv));
    }
    double e = 0; for (int i = 0; i < L; ++i) e += (double)out[i] * out[i]; const double g = 0.2 / std::sqrt(std::max(1e-12, e / L)); for (int i = 0; i < L; ++i) out[i] = (float)(out[i] * g);
    double mean = 0; for (int i = 0; i < L; ++i) mean += out[i]; mean /= L; for (int i = 0; i < L; ++i) out[i] = (float)(out[i] - mean);
  }
  LO.data[type] = std::move(data); LO.built[type] = true;
}

struct Loop { int D = 2, M = 0; double eta = 0, ez = 0, lpz = 0, alp = 0, ad = 0, g = 0.99, dgF = 0.99, ap0 = 0, ap1 = 0; int w = 0; float* buf = nullptr; };
struct CV {
  double mre[4], mim[4], mc[4], ms[4]; Loop lp[2]; float exc[kExc]; double sw[2], ph[2], sph[3];
  bool on = false, gate = false, reed = false; int model = 0, vsel = 0, note = -1, pick = 0, exN = 0, exK = 0, exL = 0, bp = 1, ltype = 0, lci = 0;
  double age = 0, vel = 0, env = 0, rel = 1, relK = 1, fadeL = 0, fadeR = 0, lastL = 0, lastR = 0, gain = 1, dmp = 0, pd = 1.6, tz = 0, tenv = 0, tk = 0.99, tamp = 0;
  double ns = 1, tau1 = 0, tau2 = 0, n1 = 1, n2 = 1, w1 = 1, w2 = 0, clickEnv = 0, clickK = 0.99, clickAmp = 0, rate0 = 1, aEnv = 0, aK = 0.01, tlp = 0, dropT = 0, dropG = 1, sag = 1, tpan = 0, sdt = 0;
  CV() { reset(); }
  void reset() {
    on = false; gate = false; model = 0; vsel = 0; note = -1; age = 0; vel = 0; env = 0; rel = 1; relK = 1; fadeL = 0; fadeR = 0; lastL = 0; lastR = 0; gain = 1; dmp = 0;
    for (int k = 0; k < 4; ++k) { mre[k] = mim[k] = mc[k] = ms[k] = 0; } pd = 1.6; tz = 0; tenv = 0; tk = 0.99; tamp = 0; reed = false;
    ns = 1; tau1 = 0; tau2 = 0; n1 = 1; n2 = 1; w1 = 1; w2 = 0; sw[0] = 1; sw[1] = 1; pick = 0; for (int k = 0; k < kExc; ++k) exc[k] = 0; exN = 0; exK = 0; exL = 0; bp = 1; clickEnv = 0; clickK = 0.99; clickAmp = 0;
    ph[0] = 0; ph[1] = 0; rate0 = 1; aEnv = 0; aK = 0.01; tlp = 0; dropT = 0; dropG = 1; sag = 1; tpan = 0; ltype = 0; lci = 0;
    sph[0] = sph[1] = sph[2] = 0; sdt = 0;
    for (auto& l : lp) { l.ez = 0; l.lpz = 0; l.ap0 = 0; l.ap1 = 0; l.w = 0; }
  }
};

struct Engine : EngineBase {
  std::vector<Spec> specs; int model = 0, bufLen = 1, mask = 0; std::vector<float> pool; std::vector<CV> voices; Rng rng;
  std::vector<double> busBuf[3][2]; std::vector<double> spd;
  double gtime = 0, ensPh = 0, lfoPh = 0, slowPh = 0, wowPh = 0, flutPh = 0, motor = 1, motorTarget = 1, idle = 0, drift = 0, driftT = 0, hissLp = 0;
  Smooth sTone, sDrive, sLevel, sTrem, sWet, sDry, sBase, sDepth, sTap2, sTap3, sPos, sDamp, sColor; Smooth* sm[13];
  bool snap = true; double lastTone = -9; DelayLine dl0, dl1;
  OnePoleHP dcL, dcR, dc2L, dc2R; Oversampler osL, osR; OnePoleLP cabL, cabR; Biquad toneHiL, toneHiR, toneLoL, toneLoR, regA, regB, regC, bodyBp[5];
  double lastReg0 = -9, lastReg3 = -9, outLev = 0; bool tapeActive = false;
  explicit Engine(double sr_) : EngineBase(sr_), specs(makeSpecs()), dl0((long long)std::floor(0.04 * sr_) + 8), dl1((long long)std::floor(0.04 * sr_) + 8) {
    initParams(specs); model = 0;
    int need = (int)std::floor(2 * sr / 22) + 64; bufLen = 1; while (bufLen < need) bufLen <<= 1; mask = bufLen - 1;
    pool.assign((size_t)kVoices * 2 * bufLen, 0.f); voices.resize(kVoices);
    for (int i = 0; i < kVoices; ++i) for (int s = 0; s < 2; ++s) voices[i].lp[s].buf = pool.data() + (size_t)(i * 2 + s) * bufLen;
    for (int b = 0; b < 3; ++b) for (int c = 0; c < 2; ++c) busBuf[b][c].assign(kBlock, 0.0);
    spd.assign(kBlock, 0.0);
    Smooth* all[13] = {&sTone, &sDrive, &sLevel, &sTrem, &sWet, &sDry, &sBase, &sDepth, &sTap2, &sTap3, &sPos, &sDamp, &sColor};
    for (int i = 0; i < 13; ++i) { sm[i] = all[i]; sm[i]->setTime(0.03, sr); }
    dcL.set(18, sr); dcR.set(18, sr); cabL.set(7500, sr); cabR.set(7500, sr); dc2L.set(12, sr); dc2R.set(12, sr);
    const double bf[5] = {90, 175, 310, 620, 1250}, bq[5] = {5, 6, 6, 5, 4}; for (int i = 0; i < 5; ++i) bodyBp[i].set(BQ_BandPass, bf[i], bq[i], 0, sr);
    motor = motorTarget = 1 - 0.45 * v[Color]; idle = 3; tapeActive = false;
    modelTargets();
  }
  double noteFreq(double note, double extra = 0) const { return 440 * std::pow(2.0, (note - 69) / 12 + (v[Tune] + noteTune + extra) / 1200); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[id]; x = clampf(x, sp.min, sp.max); if (!sp.labels.empty()) x = jsRound(x); v[id] = x;
    if (id == Preset) { if (x > 0) applyPreset((int)x); return; }
    if (id == Model) model = (int)x;
    if ((id == Model || id == Voice) && (int)jsRound(v[Model]) == TAPE) buildLoops((int)jsRound(v[Voice]));
    modelTargets();
  }
  void applyPreset(int p) {
    const double* t = PRE[(int)clampf(p, 1, 17) - 1];
    for (int i = 0; i < 13; ++i) { v[Model + i] = t[i]; writeParam(Model + i, t[i]); }
    model = (int)jsRound(v[Model]); if (model == TAPE) buildLoops((int)jsRound(v[Voice])); modelTargets();
  }
  void modelTargets() {
    const double mod = v[Mod]; const int m = model;
    sTone.target = v[Tone]; sDrive.target = v[Drive]; sLevel.target = std::pow(10.0, v[Level] / 20); sPos.target = v[Position]; sDamp.target = v[Damping]; sColor.target = v[Color];
    double trem = 0, wet = 0, dry = 1, base = 8, depth = 0, tap2 = 0, tap3 = 0;
    switch (m) {
      case EP: trem = mod * 0.9; break;
      case CLAV: wet = 0.5 * mod; dry = 1 - 0.4 * mod; base = 10; depth = 2.0 * mod; tap2 = 1; break;
      case HARP: wet = 0.55 * mod; dry = 1 - 0.3 * mod; base = 11; depth = 2.6 * mod; tap2 = 1; break;
      case TAPE: wet = 1; dry = 0; base = 4; depth = mod * 0.9 * std::min(1.0, 5 / std::max(0.1, v[Rate])); break;
      default: wet = 0.35 + 0.65 * mod; dry = 1 - 0.5 * wet; base = 10; depth = 4.0 * mod; tap2 = 1; tap3 = 1;
    }
    if (mod <= 0.001 && m != EP) { wet = 0; dry = 1; depth = 0; }
    sTrem.target = trem; sWet.target = wet; sDry.target = dry; sBase.target = base; sDepth.target = depth; sTap2.target = tap2; sTap3.target = tap3;
  }
  void allNotesOff() override { for (auto& vo : voices) if (vo.on) release(vo); }
  void release(CV& vo) {
    vo.gate = false; if (vo.model == CLAV || vo.model == HARP) return;
    const double T = std::max(0.02, v[Release]); vo.relK = std::pow(10.0, -3 / (T * sr));
    if (vo.model == TAPE) vo.relK = std::pow(10.0, -3 / (std::max(0.05, T * 0.6) * sr));
  }
  void noteOff(int note) override { for (auto& vo : voices) if (vo.on && vo.gate && vo.note == note) release(vo); }
  void noteOn(int noteIn, double vel) override {
    vel = clampf(vel, 0.01, 1); const int note = (int)clampf(jsRound(noteIn), 0, 127); int idx = -1; double bestCost = 1e30;
    for (int i = 0; i < kVoices; ++i) {
      CV& vo = voices[i]; if (!vo.on) { idx = i; bestCost = -1; break; }
      const double cost = (vo.gate ? 1e6 : 0) + vo.env * 1e3 - vo.age * 1e-7 + (vo.note == note ? -5e5 : 0); if (cost < bestCost) { bestCost = cost; idx = i; }
    }
    CV& vo = voices[idx]; const double fl = vo.on ? vo.lastL : 0, fr = vo.on ? vo.lastR : 0; vo.reset();
    for (int s = 0; s < 2; ++s) std::fill(vo.lp[s].buf, vo.lp[s].buf + bufLen, 0.f);
    vo.fadeL = fl; vo.fadeR = fr; vo.on = true; vo.gate = true; vo.model = model; vo.vsel = (int)jsRound(v[Voice]); vo.note = note; vo.vel = vel; vo.rel = 1; vo.relK = 1; vo.env = 0.1;
    switch (vo.model) { case EP: startEP(vo, note, vel); break; case CLAV: startClav(vo, note, vel); break; case HARP: startHarpsi(vo, note, vel); break; case TAPE: startTape(vo, note, vel); break; default: startStrings(vo, note, vel); }
  }
  // ---- electric piano
  void startEP(CV& vo, int note, double vel) {
    static const double R[4][4] = {{1, 6.267, 17.55, 34.4}, {1, 6.267, 17.55, 34.4}, {1, 6.267, 17.55, 34.4}, {1, 2.756, 5.404, 8.933}};
    static const double A[4][4] = {{1, 0.5, 0.13, 0.05}, {1, 0.3, 0.1, 0.04}, {0.8, 1, 0.2, 0.08}, {1, 0.55, 0.3, 0.14}};
    static const double T[4][4] = {{1, 0.22, 0.08, 0.04}, {0.55, 0.15, 0.06, 0.03}, {1, 0.5, 0.12, 0.05}, {1, 0.5, 0.25, 0.12}};
    const int vs = vo.vsel; const double f0 = noteFreq(note), hard = v[Attack], bell = v[Color];
    const double T0 = 7 * std::pow(2.0, -(note - 48) / 20.0) * std::pow(2.0, -3.2 * v[Damping]), sc = 0.22 + 0.78 * std::pow(vel, 1.25);
    for (int k = 0; k < 4; ++k) {
      const double f = f0 * R[vs][k]; double amp = A[vs][k] * sc;
      if (k > 0) amp *= (0.2 + 1.1 * hard) * (0.5 + 0.5 * vel) * (k == 1 ? (0.3 + 1.4 * bell) : 1);
      if (f > sr * 0.45) amp = 0;
      const double t60 = std::max(0.02, T0 * T[vs][k]), r = std::exp(-6.9078 / (t60 * sr)), w = 2 * kPi * std::min(f, sr * 0.45) / sr;
      vo.mc[k] = r * std::cos(w); vo.ms[k] = r * std::sin(w); vo.mre[k] = 0; vo.mim[k] = amp * 0.5;
    }
    vo.pd = pickupDistance(v[Position]) + (vs == 3 ? 0.9 : 0); vo.reed = vs == 1; vo.tamp = 0.05 * hard * vel; vo.tenv = 1; vo.tk = std::exp(-1 / (0.005 * sr)); vo.gain = modelGain(EP, vs, note);
  }
  void renderEP(CV& vo, int m, double* bl, double* br) {
    double e2 = 0; const double d = vo.pd; const bool reed = vo.reed; double* mc = vo.mc; double* ms = vo.ms; double* mre = vo.mre; double* mim = vo.mim;
    for (int i = 0; i < m; ++i) {
      double u = 0;
      for (int k = 0; k < 4; ++k) { const double re = mc[k] * mre[k] - ms[k] * mim[k], im = ms[k] * mre[k] + mc[k] * mim[k]; mre[k] = re; mim[k] = im; u += re; }
      double y = pickupCurve(u, d, reed);
      if (vo.tenv > 1e-4) { const double nz = rng.bi(); vo.tz += 0.3 * (nz - vo.tz); y += vo.tz * vo.tenv * vo.tamp; vo.tenv *= vo.tk; }
      vo.rel *= vo.relK; const double o = y * vo.rel * vo.gain + vo.fadeL; vo.fadeL *= 0.995; bl[i] += o; br[i] += o; e2 += o * o;
    }
    vo.env = std::max(std::sqrt(e2 / m), vo.env * 0.985);
  }
  // ---- string models
  void setupLoop(Loop& s, double f, double T60, double alp, int M, double ad, float* buf) {
    alp = std::pow(clampf(alp, 0, 0.99), 48000 / sr);
    f = clampf(f, 24, sr * 0.17); const double w0 = 2 * kPi * f / sr, P = sr / f;
    const double need = P - (M * apDelay(ad, w0) + lpDelay(alp, w0)); double Dint = std::floor(need - 1), del = need - Dint; if (Dint < 1) { Dint = 1; del = clampf(need - 1, 1, 2); }
    if (Dint > bufLen / 2 - 4) { Dint = bufLen / 2 - 4; del = 1; }
    s.D = (int)Dint; s.eta = solveEta(del, w0); s.alp = alp; s.ad = ad; s.M = M; s.buf = buf;
    const double G = std::pow(10.0, -3 / (f * std::max(0.02, T60))); s.g = clampf(G / lpMag(alp, w0), 0, 0.99995); s.dgF = std::pow(10.0, -3 / (f * std::max(0.02, v[Release])));
  }
  void makeExcitation(CV& vo, double pole, double area, double beta, double P) {
    const int L = (int)clampf(std::floor(sr * 0.012), 16, kExc - 200); double z1 = 0, z2 = 0, sum = 0; const double p = std::pow(clampf(pole, 0, 0.98), 48000 / sr);
    for (int k = 0; k < L; ++k) { const double x = k == 0 ? 1 : 0; z1 += (1 - p) * (x - z1); z2 += (1 - p) * (z1 - z2); vo.exc[k] = (float)z2; sum += z2; }
    const double nrm = sum > 0 ? area / sum : 0; for (int k = 0; k < L; ++k) vo.exc[k] = (float)(vo.exc[k] * nrm); for (int k = L; k < kExc; ++k) vo.exc[k] = 0;
    vo.bp = (int)clampf(jsRound(beta * P), 1, kExc - L - 2); vo.exL = L; vo.exN = L + vo.bp; vo.exK = 0;
  }
  void startClav(CV& vo, int note, double vel) {
    const double f0 = clampf(noteFreq(note), 24, sr * 0.17), hard = v[Attack], P = sr / f0; vo.ns = 1;
    const double T60 = 3 * std::pow(2.0, -(note - 48) / 24.0) * std::pow(2.0, -2.5 * v[Damping]), alp = 0.02 + 0.45 * std::pow(1 - hard, 1.5); const int M = P > 12 ? 2 : 0; const double ad = -0.5 * v[Color];
    setupLoop(vo.lp[0], f0, T60, alp, M, ad, vo.lp[0].buf);
    makeExcitation(vo, 0.88 * (1 - 0.8 * hard), std::pow(vel, 0.8) * 0.05 * (sr / f0), 0.12, P);
    const double pos = v[Position], g1 = 0.22 + 0.28 * pos, g2 = 0.06 + 0.14 * pos; vo.pick = vo.vsel;
    vo.tau1 = g1 * P; vo.tau2 = g2 * P; vo.n1 = 1 / std::max(0.3, combGain(g1, 1)); vo.n2 = 1 / std::max(0.3, combGain(g2, 1));
    vo.clickAmp = (0.03 + 0.25 * hard) * vel; vo.clickEnv = 1; vo.clickK = std::exp(-1 / (0.003 * sr)); vo.gain = modelGain(CLAV, vo.vsel, note);
  }
  void startHarpsi(CV& vo, int note, double vel) {
    const double f0 = noteFreq(note), hard = v[Attack]; const int vs = vo.vsel; const double beta0 = vs == 3 ? 0.06 : (vs == 1 ? 0.12 : 0.14), beta = beta0 * (0.6 + 0.8 * v[Position]);
    vo.ns = vs == 2 ? 2 : 1; double Tm = 4.5 * std::pow(2.0, -(note - 48) / 20.0) * std::pow(2.0, -2.2 * v[Damping]); if (vs == 3) Tm *= 0.55;
    const double alp = 0.02 + 0.4 * std::pow(1 - hard, 1.5) + (vs == 3 ? 0.2 : 0), fs0 = vs == 1 ? 2 * f0 : f0, P0 = sr / clampf(fs0, 24, sr * 0.17);
    setupLoop(vo.lp[0], fs0, vs == 1 ? Tm * 0.6 : Tm, alp, 1, -0.1, vo.lp[0].buf); vo.sw[0] = 1;
    if (vs == 2) { setupLoop(vo.lp[1], 2 * f0, Tm * 0.6, alp * 0.8, 1, -0.1, vo.lp[1].buf); vo.sw[1] = 0.7; }
    const double velc = 0.78 + 0.22 * std::pow(vel, 0.7);
    makeExcitation(vo, 0.55 + 0.4 * (1 - hard) * (0.9 + 0.1 * vel) * 0.95 - 0.3 * hard * 0.6, velc * 0.05 * (sr / std::min(sr * 0.17, std::max(24.0, f0))), beta, P0);
    vo.clickAmp = 0.02 + 0.06 * hard; vo.clickEnv = 1; vo.clickK = std::exp(-1 / (0.004 * sr)); vo.gain = modelGain(HARP, vs, note);
  }
  void renderString(CV& vo, int m, double* bl, double* br) {
    const int msk = mask; const bool clav = vo.model == CLAV; const double dmpUp = 1 - std::exp(-1 / (0.006 * sr)); double e2 = 0;
    for (int i = 0; i < m; ++i) {
      const double tgt = vo.gate ? 0 : 1; vo.dmp += (tgt - vo.dmp) * dmpUp;
      double ex = 0;
      if (vo.exK < vo.exN) { const int k = vo.exK; const double e0 = k < vo.exL ? vo.exc[k] : 0; const int k2 = k - vo.bp; const double e1 = (k2 >= 0 && k2 < vo.exL) ? vo.exc[k2] : 0; ex = e0 - e1; ++vo.exK; }
      double out = 0;
      for (int s = 0; s < (int)vo.ns; ++s) {
        Loop& L = vo.lp[s]; float* buf = L.buf; const double x = buf[(L.w - L.D) & msk]; double y = x;
        { const double t = L.eta * y + L.ez; L.ez = y - L.eta * t; y = t; }
        if (L.M > 0) { double t = L.ad * y + L.ap0; L.ap0 = y - L.ad * t; y = t; if (L.M > 1) { t = L.ad * y + L.ap1; L.ap1 = y - L.ad * t; y = t; } }
        y = (1 - L.alp) * y + L.alp * L.lpz; L.lpz = y;
        y = y * (L.g * (1 - vo.dmp * (1 - L.dgF))) + ex;
        if (clav) {
          double pos = L.D + vo.tau1; long long i0 = (long long)std::floor(pos); double fr = pos - (double)i0; double a0 = buf[(L.w - i0) & msk], a1 = buf[(L.w - i0 - 1) & msk]; const double l1 = a0 + (a1 - a0) * fr;
          pos = L.D + vo.tau2; i0 = (long long)std::floor(pos); fr = pos - (double)i0; a0 = buf[(L.w - i0) & msk]; a1 = buf[(L.w - i0 - 1) & msk]; const double l2 = a0 + (a1 - a0) * fr;
          const double c1 = (x - l1) * vo.n1, c2 = (x - l2) * vo.n2;
          switch (vo.pick) { case 0: out += c1; break; case 1: out += c2; break; case 2: out += 0.7 * (c1 + c2); break; default: out += 0.8 * (c1 - c2); }
        } else out += x * vo.sw[s];
        buf[L.w & msk] = (float)y; L.w = (L.w + 1) & msk;
      }
      if (vo.clickEnv > 1e-4) { const double nz = rng.bi(); out += nz * vo.clickEnv * vo.clickAmp * (clav ? 1 : 0.5); vo.clickEnv *= vo.clickK; }
      const double o = out * vo.gain + vo.fadeL; vo.fadeL *= 0.995; bl[i] += o; br[i] += o; e2 += o * o;
    }
    vo.env = std::max(std::sqrt(e2 / m), vo.env * 0.985);
  }
  // ---- tape keys
  void startTape(CV& vo, int note, double vel) {
    const int type = (int)clampf(vo.vsel, 0, 3), ci = (int)clampf(jsRound((note - 24) / 6.0), 0, kCenters - 1); vo.ltype = type; vo.lci = ci; buildLoops(type);
    const double f = noteFreq(note), fa = loops().freq[type][ci];
    vo.rate0 = clampf(f / fa * kLoopSr / sr, 0.05, 6);
    const double off = rng.uni(); vo.ph[0] = off * kLoopLen; vo.ph[1] = std::fmod(vo.ph[0] + 0.37 * kLoopLen, (double)kLoopLen);
    const double a = v[Attack]; vo.aK = 1 - std::exp(-1 / ((0.004 + 0.18 * std::pow(1 - a, 1.5)) * sr)); vo.aEnv = 0; vo.gain = (0.75 + 0.25 * vel) * modelGain(TAPE, type, note); vo.sag = 1; vo.tpan = ((note - 60) / 40.0) * 0.3;
    vo.dropT = (0.3 + 3 * rng.uni()) * sr; vo.dropG = 1; tapeActive = true; idle = 0; motorTarget = 1;
  }
  void renderTape(CV& vo, int m, double* bl, double* br) {
    const float* loop = loops().data[vo.ltype].data(); const int base = vo.lci * kLoopLen, Ln = kLoopLen; double e2 = 0; const double sp = sPos.cur, dmp = sDamp.cur, rate = vo.rate0;
    const double lpA = 1 - std::exp(-2 * 3.14159265 * std::min(0.45 * sr, 11000 * std::pow(2.0, -3.4 * dmp)) / sr), dropRate = dmp * dmp * 1.2;
    const bool stop = !vo.gate; const double stopK = stop ? std::exp(-1 / (std::max(0.05, v[Release] * 0.35) * sr)) : 1;
    for (int i = 0; i < m; ++i) {
      const double sm_ = spd[i]; vo.sag *= stopK; vo.rel *= vo.relK; if (!stop) vo.aEnv += (1 - vo.aEnv) * vo.aK;
      const double inc = rate * sm_ * vo.sag; double s0 = 0, s1 = 0;
      for (int h = 0; h < 2; ++h) {
        double p = vo.ph[h] + inc; if (p >= Ln) p -= Ln; else if (p < 0) p += Ln; vo.ph[h] = p;
        const int i1 = (int)std::floor(p); const double t = p - i1;
        const double y0 = loop[base + ((i1 - 1 + Ln) % Ln)], y1 = loop[base + (i1 % Ln)], y2 = loop[base + ((i1 + 1) % Ln)], y3 = loop[base + ((i1 + 2) % Ln)];
        const double c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2), val = ((c3 * t + c2) * t + c1) * t + y1;
        if (h == 0) s0 = val; else s1 = val;
      }
      vo.dropT -= 1; double dgT = 1;
      if (vo.dropT <= 0) { if (vo.dropT > -0.04 * sr) dgT = 0.35; else vo.dropT = (0.2 + 4 * rng.uni()) * sr / std::max(0.05, dropRate + 0.05); if (dropRate < 0.01) { dgT = 1; vo.dropT = 1e9; } }
      vo.dropG += (dgT - vo.dropG) * 0.01;
      const double mid = (s0 + sp * s1) / (1 + sp), sd = 0.5 * sp * (s0 - s1); double l = mid + sd, r = mid - sd;
      vo.tlp += lpA * ((l + r) * 0.5 - vo.tlp); const double damp = vo.tlp - (l + r) * 0.5; l += damp; r += damp;
      const double g = vo.aEnv * vo.rel * vo.gain * vo.dropG * 0.5, pl = 1 - vo.tpan * 0.5, pr = 1 + vo.tpan * 0.5;
      const double ol = l * g * pl + vo.fadeL, orr = r * g * pr + vo.fadeR; vo.fadeL *= 0.995; vo.fadeR *= 0.995; bl[i] += ol; br[i] += orr; e2 += 0.5 * (ol * ol + orr * orr);
    }
    vo.env = std::max(std::sqrt(e2 / m), vo.env * 0.985);
  }
  // ---- string machine
  void startStrings(CV& vo, int note, double vel) {
    const double f = noteFreq(note); vo.sdt = f / sr;
    for (int o = 0; o < 3; ++o) { const double fo = f * (o == 0 ? 0.5 : (o == 1 ? 1 : 2)), x = gtime * fo; vo.sph[o] = x - std::floor(x); }
    const double a = v[Attack]; vo.aK = 1 - std::exp(-1 / ((0.006 + 0.35 * std::pow(1 - a, 1.4)) * sr)); vo.aEnv = 0; vo.gain = (0.8 + 0.2 * vel) * modelGain(STR, vo.vsel, note);
  }
  void renderStrings(CV& vo, int m, double* bl) {
    const double pos = sPos.cur, col = sColor.cur, w16 = clampf((0.5 - pos) * 2, 0, 1), w4 = clampf((pos - 0.5) * 2, 0, 1), w8 = 1 - 0.5 * std::max(w16, w4); double e2 = 0;
    const double dts[3] = {vo.sdt * 0.5, vo.sdt, vo.sdt * 2}, ws[3] = {w16 * 0.9, w8, w4 * 0.8}; const bool stop = !vo.gate; double* sph = vo.sph;
    for (int i = 0; i < m; ++i) {
      double s = 0;
      for (int o = 0; o < 3; ++o) {
        if (ws[o] <= 0) { sph[o] += dts[o]; sph[o] -= std::floor(sph[o]); continue; }
        const double t = sph[o], dt = std::min(0.45, dts[o]); double saw = 2 * t - 1 - polyBlepF(t, dt);
        if (col > 0.001) { double t2 = t + 0.5; if (t2 >= 1) t2 -= 1; const double saw2 = 2 * t2 - 1 - polyBlepF(t2, dt); saw = saw * (1 - col) + (saw - saw2) * 0.7 * col; }
        if (dts[o] > 0.45) saw = 0;
        s += saw * ws[o]; sph[o] += dts[o]; sph[o] -= std::floor(sph[o]);
      }
      vo.aEnv += ((stop ? 0 : 1) - vo.aEnv) * (stop ? 0 : vo.aK); vo.rel *= vo.relK;
      const double o = s * vo.aEnv * vo.rel * vo.gain + vo.fadeL; vo.fadeL *= 0.995; bl[i] += o; e2 += o * o;
    }
    vo.env = std::max(std::sqrt(e2 / m), vo.env * 0.985);
  }
  void process(float* outL, float* outR, int n) override { int pos = 0; while (pos < n) { const int m = std::min(kBlock, n - pos); chunk(outL, outR, pos, m); pos += m; } }
  void chunk(float* oL, float* oR, int off, int m) {
    if (snap) { for (auto* s : sm) s->cur = s->target; snap = false; }
    for (int b = 0; b < 3; ++b) { std::fill(busBuf[b][0].begin(), busBuf[b][0].begin() + m, 0.0); std::fill(busBuf[b][1].begin(), busBuf[b][1].begin() + m, 0.0); }
    double* bb[3][2]; for (int b = 0; b < 3; ++b) for (int c = 0; c < 2; ++c) bb[b][c] = busBuf[b][c].data();
    bool anyTape = false; for (auto& vo : voices) if (vo.on && vo.model == TAPE) { anyTape = true; break; }
    if (anyTape) idle = 0; else idle += m / sr;
    const double colr = sColor.cur, age = sDamp.cur, flo = 1 - 0.45 * v[Color];
    motorTarget = (!anyTape && idle > 2.5) ? flo : 1;
    const double kUp = 1 - std::exp(-1 / ((0.12 + 0.5 * v[Color]) * sr)), kDn = 1 - std::exp(-1 / (0.7 * sr)), dWow = 6.283185307 * 0.8 / sr, dFl = 6.283185307 * 7.3 / sr, wf = colr * (1 + age);
    for (int i = 0; i < m; ++i) {
      motor += (motorTarget - motor) * (motorTarget > motor ? kUp : kDn); wowPh += dWow; flutPh += dFl; if (wowPh > 6.283185307) wowPh -= 6.283185307; if (flutPh > 6.283185307) flutPh -= 6.283185307;
      driftT += 1; if (driftT > 0.05 * sr) { driftT = 0; drift += 0.4 * (rng.bi() - drift); }
      const double mod = wf * (0.004 * std::sin(wowPh) + 0.0012 * std::sin(flutPh) + 0.0015 * drift);
      spd[i] = motor * (1 + mod);
    }
    for (auto& vo : voices) {
      if (!vo.on) continue; double* bl = bb[0][0]; double* br = bb[0][1];
      switch (vo.model) {
        case EP: renderEP(vo, m, bl, br); break;
        case CLAV: renderString(vo, m, bl, br); break;
        case HARP: renderString(vo, m, bb[1][0], bb[1][1]); break;
        case TAPE: renderTape(vo, m, bl, br); break;
        default: renderStrings(vo, m, bb[2][0]);
      }
      vo.age += m; vo.lastL = bl[m - 1]; vo.lastR = br[m - 1];
      if (!std::isfinite(vo.env)) { vo.on = false; continue; }
      const bool strModel = vo.model == CLAV || vo.model == HARP;
      if (vo.age > sr * 0.05 && (vo.env < 3e-6 || (!vo.gate && (strModel ? (vo.dmp > 0.98 && vo.env < 2e-5) : vo.rel < 1e-4)))) { vo.on = false; vo.env = 0; for (int s = 0; s < 2; ++s) std::fill(vo.lp[s].buf, vo.lp[s].buf + bufLen, 0.f); }
    }
    if (anyTape && age > 0.01) { const double hs = 0.012 * age * age; for (int i = 0; i < m; ++i) { hissLp += 0.35 * (rng.bi() - hissLp); bb[0][0][i] += hissLp * hs; bb[0][1][i] += hissLp * hs * 0.9; } }
    {
      const double body = sColor.cur * 1.2; static const double gb[5] = {0.5, 0.5, 0.4, 0.3, 0.2}; double* b1 = bb[1][0]; double* b1r = bb[1][1];
      for (int i = 0; i < m; ++i) { const double x = b1[i]; double y = x; if (body > 1e-3) { for (int k = 0; k < 5; ++k) y += body * gb[k] * bodyBp[k].run(x); } else { for (int k = 0; k < 5; ++k) bodyBp[k].run(x); } b1[i] = y; b1r[i] = y; }
    }
    {
      const int vs = (int)jsRound(v[Voice]); const double dmp = sDamp.cur;
      if (std::fabs(lastReg0 - vs) > 0.5 || std::fabs(lastReg3 - dmp) > 0.004) {
        lastReg0 = vs; lastReg3 = dmp;
        switch (vs) {
          case 0: regA.set(BQ_HighPass, 300, 0.7, 0, sr); regB.set(BQ_Peak, 2800, 1.0, 3.0, sr); break;
          case 1: regA.set(BQ_HighPass, 140, 0.7, 0, sr); regB.set(BQ_Peak, 900, 0.9, 4.0, sr); break;
          case 2: regA.set(BQ_LowPass, 1100, 0.8, 0, sr); regB.set(BQ_LowShelf, 160, 0.7, 3.0, sr); break;
          default: regA.set(BQ_LowShelf, 120, 0.7, 2.0, sr); regB.set(BQ_HighShelf, 4000, 0.7, 1.5, sr);
        }
        regC.set(BQ_LowPass, std::min(14000 * std::pow(2.0, -4 * dmp), sr * 0.45), 0.7, 0, sr);
      }
      if (model == STR) for (int i = 0; i < m; ++i) { const double y = regC.run(regB.run(regA.run(bb[2][0][i]))); bb[2][0][i] = y; bb[2][1][i] = y; }
    }
    const int mdl = model; const double rate = v[Rate], r1 = mdl == STR ? rate / 8 : (mdl == TAPE ? rate : rate * 0.25), r2 = rate * 1.35;
    const double d1 = 6.283185307 * r1 / sr, d2 = 6.283185307 * r2 / sr, dT = 6.283185307 * rate / sr, tone = sTone.cur;
    if (std::fabs(tone - lastTone) > 0.002) { lastTone = tone; toneHiL.set(BQ_HighShelf, 2400, 0.7, (tone - 0.5) * 2 * 9, sr); toneHiR.copyFrom(toneHiL); toneLoL.set(BQ_LowShelf, 220, 0.7, -(tone - 0.5) * 2 * 4, sr); toneLoR.copyFrom(toneLoL); }
    const double msr = sr * 0.001; double wgt[3] = {1, 0, 0};
    for (int i = 0; i < m; ++i) {
      double l = bb[0][0][i] + bb[1][0][i] + bb[2][0][i], r = bb[0][1][i] + bb[1][1][i] + bb[2][1][i];
      l = dcL.run(l); r = dcR.run(r);
      const double tm = sTrem.next(), wet = sWet.next(), dry = sDry.next(), base = sBase.next(), depth = sDepth.next(), w2 = sTap2.next(), w3 = sTap3.next();
      lfoPh += dT; if (lfoPh > 6.283185307) lfoPh -= 6.283185307; slowPh += d1; if (slowPh > 6.283185307) slowPh -= 6.283185307; ensPh += d2; if (ensPh > 6.283185307) ensPh -= 6.283185307;
      const double sl = std::sin(lfoPh); l *= 1 - tm * 0.48 * (1 + sl); r *= 1 - tm * 0.48 * (1 - sl);
      if (wet > 1e-4) {
        dl0.push(l); dl1.push(r); double aL = 0, aR = 0; const double fm = 0.3 * w3; wgt[1] = w2; wgt[2] = w3; const double norm = 1 / (1 + w2 + w3);
        for (int k = 0; k < 3; ++k) {
          if (wgt[k] <= 1e-4) continue; const double ph = k * 2.0943951;
          const double sg = (1 - fm) * std::sin(slowPh + ph) + fm * std::sin(ensPh + ph), sg2 = (1 - fm) * std::sin(slowPh + ph + 1.0471976) + fm * std::sin(ensPh + ph + 1.0471976);
          aL += wgt[k] * dl0.read((base + depth * sg) * msr); aR += wgt[k] * dl1.read((base + depth * sg2) * msr);
        }
        l = l * dry + wet * aL * norm; r = r * dry + wet * aR * norm;
      } else { dl0.push(l); dl1.push(r); }
      const double dr = sDrive.next(), pre = 1 + dr * dr * 18, bias = 0.12 * dr, tb = std::tanh(bias), sech2 = 1 - tb * tb, comp = std::pow(pre, 0.55) / (pre * sech2);
      osL.pre = osR.pre = pre; osL.bias = osR.bias = bias; osL.tb = osR.tb = tb; osL.comp = osR.comp = comp;
      double yl = osL.run(l), yr = osR.run(r);
      if (dr > 0.002) { const double cl = cabL.run(yl), cr = cabR.run(yr), k = std::min(1.0, dr * 0.9); yl += (cl - yl) * k; yr += (cr - yr) * k; } else { cabL.run(yl); cabR.run(yr); }
      yl = dc2L.run(yl); yr = dc2R.run(yr);
      yl = toneLoL.run(toneHiL.run(yl)); yr = toneLoR.run(toneHiR.run(yr));
      const double lv = sLevel.next(); yl *= lv; yr *= lv;
      double a = std::fabs(yl); if (a >= 0.7) { const double t = 0.7 + 0.3 * std::tanh((a - 0.7) / 0.3); yl = yl < 0 ? -t : t; }
      a = std::fabs(yr); if (a >= 0.7) { const double t = 0.7 + 0.3 * std::tanh((a - 0.7) / 0.3); yr = yr < 0 ? -t : t; }
      if (!std::isfinite(yl) || !std::isfinite(yr)) { yl = yr = 0; }
      oL[off + i] = (float)yl; oR[off + i] = (float)yr;
      sPos.next(); sDamp.next(); sColor.next();
    }
    gtime += m / sr;
  }
};
inline Info info() {
  return Info{"clavica", "Clavica",
              "Five keyboards, five little physics: electric piano, clav, harpsichord, tape keys (varispeed loops) and a string machine; Voice I-IV picks the variant and Attack/Position/Damping/Color change meaning per model.",
              makeSpecs(), makeGroups(), Theme{"clavica", 0xff2e1618, 0xff0d0505, 0xffe8604c, 0xfff8e4dc, 0xffff9a80},
              [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::clavica
