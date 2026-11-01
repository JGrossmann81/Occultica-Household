// Grainica: granular synthesizer. Grains are cut from eight generated sources (voice pad, bell, pluck, noise bed, strings, glass, breath, tine keys).
#pragma once
#include "../common/engine.h"
#include <mutex>
namespace occ { namespace grainica {
constexpr int kSources = 8, kVoices = 8, kPool = 12, kMaxGrains = 256, kSrcRate = 32000, kSrcLen = 128000, kChunk = 256, kWindows = 6;
enum { Preset, Source, Position, Jitter, Scan, Size, Density, Spread, Scatter, Reverse, Window, Width, Freeze, KeyTrack, Pitch, Dynamics, Attack, Release, Level, Velocity, Count };
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> sourceNames = {"Voice Pad", "Bell", "Pluck", "Noise Bed", "Strings", "Glass", "Breath", "Tine Keys"}, windowNames = {"Hann", "Gauss", "Triangle", "Flat top", "Decay", "Swell"};
  std::vector<std::string> presetNames = {"Init Cloud", "Frozen Choir", "Glass Rain", "Bell Smear", "Pluck Dust", "Noise Weather", "Ensemble Shimmer", "Breath Clouds", "Tine Scatter", "Reverse Swell", "Grain Buzz", "Freeze Drone"};
  return {
    P("Preset", "", 0, 11, 0, "%.0f", false, presetNames), P("Source", "", 0, 7, 0, "%.0f", false, sourceNames),
    P("Position", "", 0, 1, 0.2, "%.3f"), P("Jitter", "", 0, 1, 0.1), P("Scan", "", -2, 2, 0, "%+.2f x"),
    P("Size", "ms", 5, 500, 90, "%.0f ms", true), P("Density", "/s", 1, 200, 30, "%.0f /s", true), P("Pitch Spread", "ct", 0, 1200, 10, "%.0f ct"),
    P("Scatter", "", 0, 1, 0), P("Reverse", "", 0, 1, 0), P("Window", "", 0, 5, 0, "%.0f", false, windowNames), P("Width", "", 0, 1, 0.6),
    P("Freeze", "", 0, 1, 0, "%.0f", false, {"Off", "Frozen"}), P("Key Track", "", 0, 1, 1), P("Pitch", "st", -24, 24, 0, "%+.2f st"), P("Dynamics", "", 0, 1, 0.2),
    P("Attack", "ms", 1, 5000, 40, "%.0f ms", true), P("Release", "ms", 5, 10000, 400, "%.0f ms", true), P("Level", "dB", -30, 6, -6, "%+.1f dB"), P("Velocity", "", 0, 1, 0.5),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Source and cloud", {Source, Position, Jitter, Scan, Freeze}}, {"Grains", {Size, Density, Window, Reverse, Scatter, Dynamics}}, {"Pitch and stereo", {Pitch, KeyTrack, Spread, Width}}, {"Envelope and level", {Attack, Release, Velocity, Level}}};
}
constexpr double PI = kPi, TP = 2 * kPi;
struct Rot { double c = 1, s = 0, C = 1, S = 0; void set(double hz, double sr, double ph) { double w = TP * hz / sr; C = std::cos(w); S = std::sin(w); c = std::cos(ph); s = std::sin(ph); } double next() { double y = s, nc = c * C - s * S; s = s * C + c * S; c = nc; return y; } };
struct GSvf { double ic1 = 0, ic2 = 0, a1 = 0, a2 = 0, a3 = 0; void set(double hz, double q, double sr) { double g = std::tan(PI * std::min(hz, sr * 0.45) / sr), k = 1 / q; a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
  double bp(double x) { double v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2; return v1; } };
inline double fadeEnd(double i, double N, double t0) { double x = i / N; if (x < t0) return 1; double u = (x - t0) / (1 - t0); return 0.5 + 0.5 * std::cos(PI * u); }
inline void ring(std::vector<double>& out, long long i0, double hz, double amp, double tau, double phase, double sr) {
  long long N = (long long)out.size(); Rot r; r.set(hz, sr, phase); double e = amp, d = std::exp(-1 / (tau * sr)); for (long long i = i0; i < N && e > 1e-6; ++i) { out[(size_t)i] += e * r.next(); e *= d; }
}
static const double VW[4][6] = {{800, 1150, 2900, 1, 0.55, 0.25}, {450, 800, 2830, 1, 0.65, 0.15}, {400, 1600, 2700, 1, 0.6, 0.3}, {325, 700, 2530, 1, 0.5, 0.1}};
inline void vowelAt(double u, double* F, double* G) { double x = u * 4, fl = std::floor(x); int i = (int)fl & 3, j = (i + 1) & 3; double f = x - fl, s = 0.5 - 0.5 * std::cos(PI * f); for (int k = 0; k < 3; ++k) { F[k] = VW[i][k] * std::pow(VW[j][k] / VW[i][k], s); G[k] = VW[i][3 + k] + s * (VW[j][3 + k] - VW[i][3 + k]); } }
inline std::vector<double> loopNoise(const std::vector<double>& buf, int N, int X) { std::vector<double> out((size_t)N); for (int i = 0; i < N; ++i) { if (i < X) { double w = double(i) / X, a = std::sin(w * 1.5707963267948966), b = std::cos(w * 1.5707963267948966); out[(size_t)i] = buf[(size_t)i] * a + buf[(size_t)(N + i)] * b; } else out[(size_t)i] = buf[(size_t)i]; } return out; }
struct Src { std::vector<float> data; double root = 261.6256; };
inline Src buildSource(int s) {
  const int N = kSrcLen; const double sr = kSrcRate, T = N / sr; std::vector<double> y((size_t)N, 0.0); double root = 261.6256;
  switch (s) {
    case 0: {
      const double f0s[3] = {261.25, 261.75, 262.5}; const int B64 = 64; double F[3] = {0, 0, 0}, G[3] = {0, 0, 0};
      for (int v = 0; v < 3; ++v) {
        int H = std::min(40, (int)std::floor(11000 / f0s[v])); std::vector<Rot> rot((size_t)H); for (int h = 0; h < H; ++h) rot[(size_t)h].set(f0s[v] * (h + 1), sr, 0.37 * v + 0.11 * h * h);
        std::vector<double> a0((size_t)H, 0.0), a1((size_t)H, 0.0);
        auto amps = [&](double t, std::vector<double>& A) { vowelAt(t / T, F, G); for (int h = 0; h < H; ++h) { double f = f0s[v] * (h + 1), g = 0.05; for (int k = 0; k < 3; ++k) { double d = std::log2(f / F[k]) / 0.22; g += G[k] * std::exp(-0.5 * d * d); } A[(size_t)h] = g / std::pow(h + 1, 0.8); } };
        amps(0, a0); double trem[64];
        for (int i0 = 0; i0 < N; i0 += B64) {
          amps((i0 + B64) / sr, a1); int m = std::min(B64, N - i0);
          for (int i = 0; i < m; ++i) trem[i] = 1 + 0.25 * std::sin(TP * (v + 1) * 0.25 * (i0 + i) / sr + 1.7 * v);
          for (int h = 0; h < H; ++h) { double a = a0[(size_t)h], d = (a1[(size_t)h] - a) / B64; Rot& r = rot[(size_t)h]; for (int i = 0; i < m; ++i) { y[(size_t)(i0 + i)] += a * r.next() * trem[i]; a += d; } }
          std::swap(a0, a1);
        }
      }
      root = 261.75; break;
    }
    case 1: {
      const double f0 = 261.6256, r[12] = {0.5, 1, 1.2, 1.5, 2, 2.5, 2.67, 3, 4, 5.33, 6, 8}, a[12] = {0.6, 1, 0.8, 0.55, 0.7, 0.4, 0.35, 0.3, 0.25, 0.15, 0.1, 0.08}, tau[12] = {1.6, 1.2, 0.95, 0.75, 0.6, 0.5, 0.45, 0.4, 0.3, 0.2, 0.15, 0.1};
      const long long strikes[2] = {(long long)std::floor(0.01 * sr), (long long)std::floor(2 * sr)}; const double sa[2] = {1, 0.7};
      for (int q = 0; q < 2; ++q) for (int k = 0; k < 12; ++k) { ring(y, strikes[q], f0 * r[k], a[k] * sa[q], tau[k], 0.3 * k, sr); ring(y, strikes[q], f0 * r[k] + 0.75, a[k] * sa[q] * 0.5, tau[k] * 1.1, 1.1 * k, sr); }
      Noise nz(0x1234567); double lp = 0; for (int q = 0; q < 2; ++q) for (int i = 0; i < (int)std::floor(0.02 * sr) && strikes[q] + i < N; ++i) { lp += 0.35 * (nz.white() - lp); y[(size_t)(strikes[q] + i)] += 0.5 * sa[q] * lp * std::exp(-i / (0.004 * sr)); }
      for (int i = 0; i < N; ++i) y[(size_t)i] *= fadeEnd(i, N, 0.88);
      root = f0; break;
    }
    case 2: {
      const double f0 = 261.6256, pos[4] = {0.12, 0.3, 0.2, 0.4}, t0[4] = {0.02, 1, 2, 3}; Noise nz(0x1234567);
      for (int p = 0; p < 4; ++p) {
        long long i0 = (long long)std::floor(t0[p] * sr);
        for (int n = 1; n <= 40; ++n) { double f = f0 * n * std::sqrt(1 + 2e-5 * n * n); if (f > 11000) break; double amp = std::fabs(std::sin(PI * n * pos[p])) / n; ring(y, i0, f, amp, 1.5 / (1 + 0.1 * std::pow((double)n, 1.3)), 0.7 * n, sr); }
        double lp = 0; for (int i = 0; i < (int)std::floor(0.015 * sr) && i0 + i < N; ++i) { lp += 0.5 * (nz.white() - lp); y[(size_t)(i0 + i)] += 0.25 * lp * std::exp(-i / (0.003 * sr)); }
      }
      for (int i = 0; i < N; ++i) y[(size_t)i] *= fadeEnd(i, N, 0.9);
      break;
    }
    case 3: {
      const int X = 16000; std::vector<double> buf((size_t)(N + X)); Noise nz(0x1234567); GSvf s1, s2, s3; double lp = 0;
      for (int i = 0; i < N + X; ++i) {
        double t = i / sr, u = t / T;
        if ((i & 31) == 0) { s1.set(200 * std::pow(2.0, 4.2 * (0.5 - 0.5 * std::cos(TP * u))), 3, sr); s2.set(5200 * std::pow(2.0, -3.2 * (0.5 - 0.5 * std::cos(TP * (u + 0.3)))), 4, sr); s3.set(900 * std::pow(2.0, 1.5 * std::sin(TP * 2 * u)), 1.5, sr); }
        double x = nz.white(); lp += 0.05 * (x - lp);
        buf[(size_t)i] = 1.4 * s1.bp(x) + 1.1 * s2.bp(x) + 0.6 * s3.bp(x) + 0.5 * lp;
      }
      y = loopNoise(buf, N, X); break;
    }
    case 4: {
      const double f0s[4] = {260.25, 261.25, 262, 263}; std::vector<double> sw((size_t)N);
      for (int v = 0; v < 4; ++v) {
        int H = std::min(26, (int)std::floor(11000 / f0s[v])); for (int i = 0; i < N; ++i) sw[(size_t)i] = 0.7 + 0.3 * std::sin(TP * 0.25 * (v + 1) * i / sr + 1.3 * v);
        for (int h = 0; h < H; ++h) { Rot r; r.set(f0s[v] * (h + 1), sr, 0.9 * v + 0.2 * h); double a = 1 / ((h + 1) * (1 + std::pow((h + 1) / 11.0, 2))); for (int i = 0; i < N; ++i) y[(size_t)i] += a * sw[(size_t)i] * r.next(); }
      }
      root = 261.625; break;
    }
    case 5: {
      const double f1 = 261.5, r[5] = {1, 2.32, 4.25, 6.63, 9.38}, a[5] = {1, 0.6, 0.4, 0.25, 0.15};
      for (int k = 0; k < 5; ++k) { double f = std::floor(f1 * r[k] * 4 + 0.5) / 4; for (int p = 0; p < 2; ++p) { Rot rt; rt.set(f + 0.5 * p, sr, 0.8 * k + 2.1 * p); for (int i = 0; i < N; ++i) { double sw = 0.65 + 0.35 * std::sin(TP * 0.25 * (k + 1 + p) * i / sr + 0.9 * k); y[(size_t)i] += a[k] * sw * rt.next(); } } }
      root = 261.75; break;
    }
    case 6: {
      const int X = 16000; std::vector<double> buf((size_t)(N + X)); Noise nz(0x1234567); GSvf f[3]; Rot t1, t2; double F[3] = {0, 0, 0}, G[3] = {0, 0, 0}; t1.set(261.75, sr, 0); t2.set(523.5, sr, 0.4);
      for (int i = 0; i < N + X; ++i) {
        double t = i / sr, u = t / T;
        if ((i & 31) == 0) { vowelAt(std::fmod(u * 0.5, 1.0), F, G); for (int k = 0; k < 3; ++k) f[k].set(F[k], 9, sr); }
        double x = nz.white(), sv = 3 * f[0].bp(x) + 2.2 * f[1].bp(x) + 1.2 * f[2].bp(x), gust = 0.6 + 0.4 * std::sin(TP * 2 * u + 0.5);
        buf[(size_t)i] = sv * gust + 0.25 * gust * (t1.next() + 0.4 * t2.next());
      }
      y = loopNoise(buf, N, X); root = 261.75; break;
    }
    default: {
      const double f0 = 261.6256; const long long st[2] = {(long long)std::floor(0.02 * sr), (long long)std::floor(2 * sr)}; const double sa[2] = {1, 0.8};
      for (int q = 0; q < 2; ++q) for (long long i = st[q]; i < N; ++i) {
        double tt = double(i - st[q]) / sr, env = std::exp(-tt / 1.3); if (env < 1e-4) break;
        double ph = TP * f0 * tt, I = 2 * std::exp(-tt / 0.3) + 0.35, I2 = 1.4 * std::exp(-tt / 0.05);
        y[(size_t)i] += sa[q] * env * (std::sin(ph + I * std::sin(ph)) + 0.3 * I2 * std::sin(14 * ph));
      }
      for (int i = 0; i < N; ++i) y[(size_t)i] *= fadeEnd(i, N, 0.9);
    }
  }
  double mean = 0; for (int i = 0; i < N; ++i) mean += y[(size_t)i]; mean /= N; double e = 0, pk = 0; for (int i = 0; i < N; ++i) { double x = y[(size_t)i] - mean; y[(size_t)i] = x; e += x * x; pk = std::max(pk, std::fabs(x)); }
  double rms = std::sqrt(e / N), g = std::min(0.2 / std::max(1e-9, rms), 0.95 / std::max(1e-9, pk));
  Src out; out.data.assign((size_t)N + 4, 0.f); for (int i = 0; i < N; ++i) out.data[(size_t)i + 1] = (float)(y[(size_t)i] * g); out.data[0] = out.data[(size_t)N]; out.data[(size_t)N + 1] = out.data[1]; out.data[(size_t)N + 2] = out.data[2]; out.data[(size_t)N + 3] = out.data[3];
  out.root = root; return out;
}
// All sources are built once (on the first instance) so that changing the Source knob never stalls the audio thread.
struct Bank {
  Src src[kSources]; float win[kWindows][514]; double wms[kWindows];
  Bank() {
    for (int s = 0; s < kSources; ++s) src[s] = buildSource(s);
    for (int w = 0; w < kWindows; ++w) {
      double ms = 0; auto decay = [](double q) { double a = q < 0.02 ? 0.5 - 0.5 * std::cos(PI * q / 0.02) : 1, tail = q > 0.97 ? 0.5 + 0.5 * std::cos(PI * (q - 0.97) / 0.03) : 1; return a * std::exp(-5 * q) * tail; };
      for (int i = 0; i < 513; ++i) {
        double x = i / 512.0, e = 0;
        switch (w) {
          case 0: e = std::pow(std::sin(PI * x), 2); break;
          case 1: { double g0 = std::exp(-0.5 * std::pow(0.5 / 0.16, 2)); e = (std::exp(-0.5 * std::pow((x - 0.5) / 0.16, 2)) - g0) / (1 - g0); break; }
          case 2: e = 1 - std::fabs(2 * x - 1); break;
          case 3: e = x < 0.1 ? 0.5 - 0.5 * std::cos(PI * x / 0.1) : (x > 0.9 ? 0.5 - 0.5 * std::cos(PI * (1 - x) / 0.1) : 1); break;
          case 4: e = decay(x); break;
          default: e = decay(1 - x);
        }
        win[w][i] = (float)e; if (i < 512) ms += e * e;
      }
      win[w][513] = win[w][512]; win[w][512] = win[w][512]; wms[w] = ms / 512;
    }
  }
};
inline const Bank& bank() { static const Bank b; return b; }
struct KV { int id; double val; };
inline const std::vector<std::vector<double>>& presetTable() {
  static const std::vector<std::vector<double>> PT = [] {
    std::vector<std::vector<KV>> PO = {
      {},
      {{Source, 0}, {Position, 0.1}, {Jitter, 0.08}, {Scan, 0.05}, {Size, 220}, {Density, 24}, {Spread, 6}, {Width, 0.9}, {Attack, 600}, {Release, 1500}},
      {{Source, 5}, {Position, 0.3}, {Jitter, 0.5}, {Scan, 0.1}, {Size, 45}, {Density, 90}, {Spread, 20}, {Scatter, 0.35}, {Reverse, 0.1}, {Window, 1}, {Width, 1}, {Attack, 20}, {Release, 900}},
      {{Source, 1}, {Position, 0.02}, {Jitter, 0.05}, {Scan, 0.12}, {Size, 180}, {Density, 22}, {Spread, 8}, {Scatter, 0.15}, {Window, 1}, {Width, 0.8}, {Attack, 40}, {Release, 1800}},
      {{Source, 2}, {Position, 0.25}, {Jitter, 0.5}, {Size, 28}, {Density, 110}, {Spread, 35}, {Scatter, 0.2}, {Window, 4}, {Width, 0.9}, {Dynamics, 0.5}, {Attack, 5}, {Release, 300}},
      {{Source, 3}, {Position, 0.5}, {Jitter, 0.6}, {Scan, 0.25}, {Size, 320}, {Density, 45}, {Spread, 0}, {KeyTrack, 0.5}, {Width, 1}, {Attack, 1200}, {Release, 2500}},
      {{Source, 4}, {Position, 0.4}, {Jitter, 0.2}, {Scan, 0.05}, {Size, 140}, {Density, 34}, {Spread, 12}, {Scatter, 0.4}, {Width, 0.9}, {Attack, 300}, {Release, 1600}},
      {{Source, 6}, {Position, 0.3}, {Jitter, 0.4}, {Scan, 0.2}, {Size, 160}, {Density, 38}, {Spread, 8}, {Width, 0.8}, {Attack, 400}, {Release, 1200}},
      {{Source, 7}, {Position, 0.02}, {Jitter, 0.12}, {Scan, 0.08}, {Size, 60}, {Density, 50}, {Spread, 15}, {Reverse, 0.3}, {Window, 2}, {Width, 0.8}, {Attack, 5}, {Release, 700}},
      {{Source, 0}, {Position, 0.3}, {Jitter, 0.3}, {Size, 420}, {Density, 20}, {Reverse, 0.55}, {Window, 5}, {Width, 1}, {Attack, 900}, {Release, 2000}},
      {{Source, 4}, {Position, 0.3}, {Jitter, 0.02}, {Size, 14}, {Density, 140}, {Spread, 3}, {Width, 0.3}, {Attack, 10}, {Release, 250}},
      {{Source, 5}, {Position, 0.45}, {Jitter, 0.03}, {Size, 400}, {Density, 18}, {Spread, 5}, {Pitch, -12}, {Width, 1}, {Attack, 1500}, {Release, 3000}}};
    auto sp = makeSpecs(); std::vector<std::vector<double>> out;
    for (size_t i = 0; i < PO.size(); ++i) { std::vector<double> v; for (auto& s : sp) v.push_back(s.def); for (auto& kv : PO[i]) v[(size_t)kv.id] = kv.val; v[0] = (double)i; out.push_back(v); }
    return out; }();
  return PT;
}
struct Rng { uint32_t s = 0x2545F491u; double uni() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double(s >> 8) * (1.0 / 16777216.0); } double bi() { return uni() * 2 - 1; } };
struct Grain { bool on = false; int voice = 0, delay = 0, len = 0, n = 0; double pos = 0, inc = 1, ePh = 0, eInc = 0, gL = 0, gR = 0; const float* win = nullptr; const float* src = nullptr; };
struct Vox {
  Adsr env; bool on, held, fading, pend; int note; double vel, tuneCents, scanOff; long long age; int nGr; double next;
  explicit Vox(double sr) { env.setSr(sr); reset(); }
  void reset() { on = held = fading = pend = false; note = 0; vel = 0.7; tuneCents = 0; scanOff = 0; age = 0; nGr = 0; next = 0; env.kill(); }
};
struct Engine : EngineBase {
  std::vector<Spec> specs; int grainCap; std::vector<std::unique_ptr<Vox>> vo; std::vector<Grain> gr; int nGr = 0; long long ageCtr = 0; int scanIdx = 0; Rng rng; double levelS, bend = 0, mw = 0, expr = 1; bool frozen = false;
  std::vector<std::vector<double>> vL, vR, envB; int srcIdx = 0;
  explicit Engine(double sr_) : EngineBase(sr_), specs(makeSpecs()), gr(kMaxGrains) {
    initParams(specs); grainCap = sr_ <= 52000 ? kMaxGrains : (sr_ <= 100000 ? 160 : 96); for (int i = 0; i < kPool; ++i) vo.emplace_back(new Vox(sr_));
    levelS = std::pow(10.0, v[Level] / 20); for (int i = 0; i < kPool; ++i) { vL.emplace_back(kChunk, 0.0); vR.emplace_back(kChunk, 0.0); envB.emplace_back(kChunk, 0.0); }
    bank(); srcIdx = (int)std::floor(v[Source] + 0.5);
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[(size_t)id]; if (x != x) x = sp.def;
    x = clampd(x, sp.min, sp.max); if (!sp.labels.empty()) x = std::floor(x + 0.5); double old = v[(size_t)id]; v[(size_t)id] = x;
    if (id == Preset) { loadPreset(x); return; }
    changed(id, old);
  }
  void loadPreset(double ii) {
    int i = (int)clampd(std::floor(ii + 0.5), 0, (double)presetTable().size() - 1); const auto& t = presetTable()[(size_t)i];
    for (int id = 1; id < Count; ++id) { double old = v[(size_t)id]; v[(size_t)id] = t[(size_t)id]; writeParam(id, t[(size_t)id]); changed(id, old); }
  }
  void changed(int id, double old) {
    switch (id) {
      case Source: srcIdx = (int)std::floor(v[Source] + 0.5); break;
      case Attack: case Release: refreshEnv(); break;
      case Freeze: frozen = v[Freeze] > 0.5; if (!frozen && old > 0.5) for (auto& w : vo) if (w->on && w->pend) { w->pend = false; w->env.gateOff(); } break;
      default: break;
    }
  }
  void refreshEnv() { for (auto& w : vo) { if (!w->on) continue; int s = w->env.st; double val = w->env.v, rC = w->env.rC; w->env.set(v[Attack] * 0.001, 0.001, 1, v[Release] * 0.001); w->env.st = s; w->env.v = val; if (w->fading) w->env.rC = rC; } }
  void allNotesOff() override { for (auto& w : vo) if (w->on && !w->fading) { w->held = false; w->pend = false; w->env.gateOff(); } }
  void pitchBend(double b) override { bend = clampd(b, -1, 1); } void modWheel(double m) override { mw = clampd(m, 0, 1); }
  void killVoice(int vi) { for (auto& g : gr) if (g.on && g.voice == vi) { g.on = false; --nGr; } Vox& w = *vo[(size_t)vi]; w.nGr = 0; w.on = false; w.fading = false; w.held = false; w.pend = false; }
  void noteOn(int note, double vel) override {
    int cnt = 0; for (auto& w : vo) if (w->on && !w->fading) ++cnt;
    if (cnt >= kVoices) {
      int victim = -1; double best = 1e9;
      for (int i = 0; i < kPool; ++i) { Vox& w = *vo[(size_t)i]; if (w.on && !w.fading && !w.held && !w.pend && w.env.v < best) { best = w.env.v; victim = i; } }
      if (victim < 0) for (int i = 0; i < kPool; ++i) { Vox& w = *vo[(size_t)i]; if (w.on && !w.fading && !w.held && w.env.v < best) { best = w.env.v; victim = i; } }
      if (victim < 0) { long long oldest = 1LL << 60; for (int i = 0; i < kPool; ++i) { Vox& w = *vo[(size_t)i]; if (w.on && !w.fading && w.age < oldest) { oldest = w.age; victim = i; } } }
      if (victim >= 0) { Vox& w = *vo[(size_t)victim]; w.fading = true; w.held = false; w.pend = false; w.env.st = 4; w.env.rC = std::exp(-6.9 / std::max(1.0, 0.006 * sr)); }
    }
    int slot = -1; for (int i = 0; i < kPool; ++i) if (!vo[(size_t)i]->on) { slot = i; break; }
    if (slot < 0) { double best = 1e9; for (int i = 0; i < kPool; ++i) if (vo[(size_t)i]->fading && vo[(size_t)i]->env.v < best) { best = vo[(size_t)i]->env.v; slot = i; } if (slot >= 0) killVoice(slot); }
    if (slot < 0) return;
    Vox& w = *vo[(size_t)slot]; w.reset(); w.on = true; w.held = true; w.note = note; w.vel = clampd(vel, 0, 1); w.tuneCents = noteTune; w.age = ++ageCtr;
    w.env.set(v[Attack] * 0.001, 0.001, 1, v[Release] * 0.001); w.env.gateOn(); w.next = 0;
  }
  void noteOff(int note) override { for (auto& w : vo) if (w->on && w->held && !w->fading && w->note == note) { w->held = false; if (frozen) w->pend = true; else w->env.gateOff(); return; } }
  void spawn(int vi, Vox& w, int delay) {
    const Bank& B = bank(); const Src& src = B.src[srcIdx]; int nAct = 0; for (auto& q : vo) if (q->on) ++nAct;
    int cap = std::max(32, grainCap / std::max(1, nAct));
    if (nGr >= grainCap || w.nGr >= std::min(cap, grainCap)) return;
    int slot = -1; for (int k = 0; k < kMaxGrains; ++k) { int j = (scanIdx + k) & (kMaxGrains - 1); if (!gr[(size_t)j].on) { slot = j; break; } }
    if (slot < 0) return; scanIdx = (slot + 1) & (kMaxGrains - 1);
    double base = v[Position] + w.scanOff, dev = v[Jitter] * 0.5 * rng.bi(); double pn = base + dev; pn -= std::floor(pn);
    double semis = (w.note - 60) * v[KeyTrack] + v[Pitch] + bend * 2 + w.tuneCents * 0.01; semis += v[Spread] * 0.01 * rng.bi();
    if (v[Scatter] > 0.001 && rng.uni() < v[Scatter]) { static const int iv[6] = {-12, 7, 12, -5, 19, 24}; semis += iv[(int)std::floor(rng.uni() * 5.999)]; }
    double ratio = clampd(std::pow(2.0, semis / 12) * (261.6256 / src.root) * (kSrcRate / sr), 0.02, 8.0 * kSrcRate / sr);
    bool rev = v[Reverse] > 0.001 && rng.uni() < v[Reverse];
    int len = (int)std::max(24.0, std::floor(v[Size] * 0.001 * sr)), wi = (int)clampd(std::floor(v[Window] + 0.5), 0, kWindows - 1);
    double pan = v[Width] * rng.bi(), ang = (pan + 1) * 0.78539816;
    double overlap = v[Density] * v[Size] * 0.001, norm = 1 / std::sqrt(std::max(1.0, overlap * B.wms[wi]));
    double velG = (1 - v[Velocity]) + v[Velocity] * w.vel, dyn = 1 - v[Dynamics] * rng.uni();
    Grain& g = gr[(size_t)slot]; g.on = true; g.voice = vi; g.delay = delay; g.len = len; g.n = 0; g.pos = pn * kSrcLen; g.inc = rev ? -ratio : ratio; g.ePh = 0; g.eInc = 1.0 / len; g.win = B.win[wi]; g.src = src.data.data();
    double gg = norm * velG * dyn; g.gL = std::cos(ang) * gg; g.gR = std::sin(ang) * gg; ++nGr; ++w.nGr;
  }
  void process(float* outL, float* outR, int n) override {
    const double srcSec = double(kSrcLen) / kSrcRate; const int L = kSrcLen; int pos = 0;
    while (pos < n) {
      int m = std::min(kChunk, n - pos); double dt = m / sr;
      for (int vi = 0; vi < kPool; ++vi) {
        Vox& w = *vo[(size_t)vi]; if (!w.on) continue;
        auto& e = envB[(size_t)vi]; for (int i = 0; i < m; ++i) e[(size_t)i] = w.env.next();
        if (!frozen) { w.scanOff += v[Scan] * dt / srcSec; w.scanOff -= std::floor(w.scanOff); }
        if (w.env.st == 0 || (w.env.st == 4 && w.env.v < 1e-5)) { killVoice(vi); continue; }
        std::fill(vL[(size_t)vi].begin(), vL[(size_t)vi].begin() + m, 0.0); std::fill(vR[(size_t)vi].begin(), vR[(size_t)vi].begin() + m, 0.0);
        if (!w.fading) { double interval = std::max(2.0, sr / v[Density]); while (w.next < m) { spawn(vi, w, (int)std::floor(w.next)); w.next += interval * (0.65 + 0.7 * rng.uni()); } w.next -= m; }
      }
      for (int gi = 0; gi < kMaxGrains; ++gi) {
        Grain& g = gr[(size_t)gi]; if (!g.on) continue;
        double* dl = vL[(size_t)g.voice].data(); double* dr = vR[(size_t)g.voice].data(); int i = g.delay; g.delay = 0;
        int run = std::min(m - i, g.len - g.n); double p = g.pos, ep = g.ePh; const double inc = g.inc, ei = g.eInc, gL = g.gL, gR = g.gR; const float* s = g.src; const float* w = g.win;
        for (int k = 0; k < run;) {
          int sub = std::min(8, run - k); double u0 = ep * 512, u1 = std::min(512.0, (ep + ei * sub) * 512); int w0 = (int)u0, w1 = (int)u1;
          double e0 = w[w0] + (u0 - w0) * (w[w0 + 1] - w[w0]), e1 = w[w1] + (u1 - w1) * (w[w1 + 1] - w[w1]); double env = e0, de = (e1 - e0) / sub;
          for (int j = 0; j < sub; ++j, ++i) {
            int ip = (int)p; double t = p - ip; int b = ip;
            double y0 = s[b], y1 = s[b + 1], y2 = s[b + 2], y3 = s[b + 3];
            double c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
            double o = (((c3 * t + c2) * t + c1) * t + y1) * env; dl[i] += o * gL; dr[i] += o * gR; env += de;
            p += inc; if (p >= L) p -= L; else if (p < 0) p += L;
          }
          ep += ei * sub; k += sub;
        }
        g.pos = p; g.ePh = ep; g.n += run;
        if (g.n >= g.len) { g.on = false; --nGr; --vo[(size_t)g.voice]->nGr; }
      }
      levelS += (std::pow(10.0, v[Level] / 20) - levelS) * (1 - std::exp(-dt / 0.02));
      for (int i = 0; i < m; ++i) { outL[pos + i] = 0; outR[pos + i] = 0; }
      for (int vi = 0; vi < kPool; ++vi) {
        if (!vo[(size_t)vi]->on) continue; const auto& e = envB[(size_t)vi]; const auto& a = vL[(size_t)vi]; const auto& b = vR[(size_t)vi];
        for (int i = 0; i < m; ++i) { outL[pos + i] += (float)(a[(size_t)i] * e[(size_t)i]); outR[pos + i] += (float)(b[(size_t)i] * e[(size_t)i]); }
      }
      double gain = levelS * (0.6 + 0.4 * expr);
      for (int i = 0; i < m; ++i) {
        double l = outL[pos + i] * gain, r = outR[pos + i] * gain, al = std::fabs(l), ar = std::fabs(r);
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
  return Info{"grainica", "Grainica", "Granular synthesizer: clouds of windowed grains from eight generated sources, with position, scan, jitter, size, density, reverse, scatter and freeze.", makeSpecs(), makeGroups(),
              Theme{"grainica", 0xff1d2616, 0xff070b04, 0xffb5e35a, 0xffeef7dc, 0xffd6f58f}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::grainica
