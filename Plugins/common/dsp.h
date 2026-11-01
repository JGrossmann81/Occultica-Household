// Occultica shared DSP building blocks (C++ port of the web synths' worklet.js). No JUCE in here, so it can be tested offline.
#pragma once
#include <cmath>
#include <cstdint>
#include <vector>
#include <string>
#include <algorithm>
namespace occ {
constexpr double PI2 = 6.283185307179586476925286766559, kPi = 3.14159265358979323846;
inline double midiHz(double note, double refA = 440.0) { return refA * std::pow(2.0, (note - 69.0) / 12.0); }
inline double clampd(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline double fastTanh(double x) { if (x > 3) return 1; if (x < -3) return -1; double x2 = x * x; return x * (27 + x2) / (27 + 9 * x2); }

struct Noise {
  uint32_t s;
  explicit Noise(uint32_t seed = 0x9E3779B9u) : s(seed ? seed : 0x9E3779B9u) {}
  double white() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double((int32_t)s) / 2147483648.0; }
};
struct Adsr {
  int st = 0; double v = 0, sus = 0.7, aInc = 0.01, dC = 0.99, rC = 0.99, sr = 48000;
  void setSr(double s) { sr = s; }
  void set(double a, double d, double s, double r) { sus = clampd(s, 0, 1); aInc = 1.0 / std::max(1.0, a * sr); dC = std::exp(-6.9 / std::max(1.0, d * sr)); rC = std::exp(-6.9 / std::max(1.0, r * sr)); }
  void gateOn(bool retrig = true) { st = 1; if (retrig) v = 0; }
  void gateOff() { if (st != 0) st = 4; }
  void kill() { st = 0; v = 0; }
  double next() {
    switch (st) {
      case 0: return 0;
      case 1: v += aInc; if (v >= 1) { v = 1; st = 2; } break;
      case 2: v = sus + (v - sus) * dC; if (std::fabs(v - sus) < 1e-5) { v = sus; st = 3; } break;
      case 3: v = sus; break;
      case 4: v *= rC; if (v < 1e-5) { v = 0; st = 0; } break;
    }
    return v;
  }
  bool active() const { return st != 0; }
};
inline double polyBlep(double t, double dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
struct Osc {
  double ph = 0; bool wrapped = false;
  double saw(double dt) const { return 2 * ph - 1 - polyBlep(ph, dt); }
  double square(double dt, double pw = 0.5) const { double s = ph < pw ? 1 : -1; s += polyBlep(ph, dt); double t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; s -= polyBlep(t2, dt); return s; }
  double tri() const { return 4 * std::fabs(ph - 0.5) - 1; }
  double sine() const { return std::sin(PI2 * ph); }
  void advance(double dt) { ph += dt; wrapped = false; if (ph >= 1) { ph -= std::floor(ph); wrapped = true; } }
};
struct Ladder {
  double s[4] = {0, 0, 0, 0}, G = 0.1, k = 0, drive = 1;
  void reset() { for (auto& x : s) x = 0; }
  void set(double hz, double res, double sr, double drv = 1) { hz = clampd(hz, 8, sr * 0.45); double g = std::tan(kPi * hz / sr); G = g / (1 + g); k = clampd(res, 0, 1.12) * 4.05; drive = drv; }
  double run(double x) {
    double G2 = G * G, G4 = G2 * G2, a = 1 - G;
    double S = G2 * G * a * s[0] + G2 * a * s[1] + G * a * s[2] + a * s[3];
    double y4 = (G4 * x + S) / (1 + k * G4);
    double u = x - k * y4; u = fastTanh(u * drive) / drive;
    double in = u;
    for (int i = 0; i < 4; ++i) { double y = G * in + a * s[i]; s[i] = 2 * y - s[i]; in = y; }
    return in;
  }
};
struct Svf {
  double s1 = 0, s2 = 0, a1 = 0, a2 = 0, a3 = 0, k = 1, low = 0, band = 0, high = 0;
  void reset() { s1 = s2 = 0; }
  void set(double hz, double q, double sr) { hz = clampd(hz, 8, sr * 0.45); double g = std::tan(kPi * hz / sr); k = 1 / std::max(0.4, q); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
  double run(double x) { double v3 = x - s2, v1 = a1 * s1 + a2 * v3, v2 = s2 + a2 * s1 + a3 * v3; s1 = 2 * v1 - s1; s2 = 2 * v2 - s2; low = v2; band = v1; high = x - k * v1 - v2; return low; }
};
struct DcBlock { double x1 = 0, y1 = 0; double run(double x) { double y = x - x1 + 0.995 * y1; x1 = x; y1 = y; return y; } void reset() { x1 = y1 = 0; } };
struct Lfo {
  double ph = 0, held = 0; Noise n; bool wrapped = false;
  double next(double hz, double sr, int shape) {  // 0 sine, 1 triangle, 2 saw up, 3 square, 4 sample & hold
    ph += hz / sr; wrapped = false; if (ph >= 1) { ph -= std::floor(ph); wrapped = true; if (shape == 4) held = n.white(); }
    switch (shape) { case 0: return std::sin(PI2 * ph); case 1: return 4 * std::fabs(ph - 0.5) - 1; case 2: return 2 * ph - 1; case 3: return ph < 0.5 ? 1 : -1; default: return held; }
  }
};
struct Chorus {
  double sr; std::vector<float> l, r; int mask; long w = 0; double ph = 0;
  explicit Chorus(double sr_ = 48000) : sr(sr_) { int n = 1; while (n < int(std::floor(sr * 0.06)) + 8) n <<= 1; l.assign(n, 0.f); r.assign(n, 0.f); mask = n - 1; }
  void reset() { std::fill(l.begin(), l.end(), 0.f); std::fill(r.begin(), r.end(), 0.f); }
  double rd(const std::vector<float>& b, double d) const { double p = double(w) - d; long i0 = (long)std::floor(p); double f = p - double(i0); double a = b[i0 & mask], c = b[(i0 + 1) & mask]; return a + (c - a) * f; }
  void process(double& L, double& R, double rateHz, double depth, double mix) {
    ph += rateHz / sr; if (ph >= 1) ph -= 1;
    double base = sr * 0.012, dep = sr * 0.006 * depth, m1 = std::sin(PI2 * ph), m2 = std::sin(PI2 * (ph + 0.5));
    l[w & mask] = (float)L; r[w & mask] = (float)R;
    double wl = rd(l, base + dep * m1), wr = rd(r, base + dep * m2);
    L += (wl - L) * mix * 0.7; R += (wr - R) * mix * 0.7; ++w;
  }
};
struct DelayLine {
  std::vector<float> buf; long mask, w = 0;
  explicit DelayLine(long maxFrames = 16) { long n = 1; while (n < maxFrames + 4) n <<= 1; buf.assign((size_t)n, 0.f); mask = n - 1; }
  void clear() { std::fill(buf.begin(), buf.end(), 0.f); }
  void push(double x) { buf[(size_t)(w & mask)] = (float)x; ++w; }
  double tap(long d) const { return buf[(size_t)((w - 1 - d) & mask)]; }
  double read(double d) const {
    d = std::min(std::max(d, 2.0), double(mask - 3)); long i = (long)std::floor(d); double t = d - double(i);
    double y0 = tap(i - 2), y1 = tap(i - 1), y2 = tap(i), y3 = tap(i + 1);
    double c0 = y1, c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    return ((c3 * t + c2) * t + c1) * t + c0;
  }
};
}  // namespace occ
