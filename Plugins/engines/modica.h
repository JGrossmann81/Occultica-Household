// Modica: the laboratory, a polyphonic modular synth. Four specimens (analog, FM, wavetable, noise, bell body, string, chaos) that can modulate each other, two Reagent filters, three envelopes, two LFOs, Tesla (Lorenz) chaos, a 16-step sequencer, four levers, twelve wires, three Apparatus pedal slots and Mutate.
#pragma once
#include "../common/engine.h"
#include <mutex>
namespace occ { namespace modica {
constexpr int kSrc = 4, kWires = 12, kFx = 3, kSteps = 16, kVoices = 16, kTick = 8;
inline double dbToGain(double db) { return std::pow(10.0, db / 20); }
inline double rnd(double x) { return std::floor(x + 0.5); }
struct Rng {
  uint32_t s;
  explicit Rng(uint32_t x = 0) : s(x ? x : 0x1234567u) {}
  double uni() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double(s >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
struct Smooth {
  double cur = 0, target = 0, coef = 0.999;
  void setTime(double s, double sr) { coef = std::exp(-1 / std::max(1.0, s * sr)); }
  void reset(double v) { cur = target = v; }
  double next() { cur = target + (cur - target) * coef; return cur; }
};
struct OP {
  double a = 0, z = 0;
  void set(double hz, double sr) { a = std::exp(-2 * kPi * clampd(hz, 1, sr * 0.49) / sr); }
  double run(double x) { z = x * (1 - a) + z * a; return z; }
  void reset() { z = 0; }
};
struct OH {
  OP lp;
  void set(double hz, double sr) { lp.set(hz, sr); }
  double run(double x) { return x - lp.run(x); }
  void reset() { lp.reset(); }
};
enum { BQPeak = 0, BQLowShelf = 1, BQHighShelf = 2, BQLowPass = 3, BQHighPass = 4, BQBandPass = 5 };
struct Biquad {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double gdb, double sr) {
    f = clampd(f, 5, sr * 0.49); q = std::max(0.05, q);
    const double A = std::pow(10.0, gdb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q);
    double B0, B1, B2, A0, A1, A2;
    switch (t) {
      case 0: B0 = 1 + al * A; B1 = -2 * cw; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cw; A2 = 1 - al / A; break;
      case 1: { const double s = 2 * std::sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; break; }
      case 2: { const double s = 2 * std::sqrt(A) * al; B0 = A * ((A + 1) + (A - 1) * cw + s); B1 = -2 * A * ((A - 1) + (A + 1) * cw); B2 = A * ((A + 1) + (A - 1) * cw - s); A0 = (A + 1) - (A - 1) * cw + s; A1 = 2 * ((A - 1) - (A + 1) * cw); A2 = (A + 1) - (A - 1) * cw - s; break; }
      case 3: B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
      case 4: B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; break;
      default: B0 = al; B1 = 0; B2 = -al; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al;
    }
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { const double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
  void reset() { z1 = z2 = 0; }
};
struct Allpass {
  DelayLine d; long long len = 1; double g = 0.5;
  explicit Allpass(long long maxLen) : d(maxLen + 8) {}
  double run(double x) { const double v = d.tap(len - 1), w = x + g * v; d.push(w); return v - g * w; }
  double runMod(double x, double l) { const double v = d.read(l), w = x + g * v; d.push(w); return v - g * w; }
};
struct Comb {
  DelayLine d; long long len = 1; double fb = 0.8, damp = 0.2, z = 0;
  explicit Comb(long long maxLen) : d(maxLen + 8) {}
  double run(double x) { const double y = d.tap(len - 1); z = y * (1 - damp) + z * damp; d.push(x + z * fb); return y; }
};

// ---- sine table and wavetable bank
inline const double* SINT() {
  static double t[2050]; static bool init = false;
  if (!init) { for (int i = 0; i < 2050; ++i) t[i] = (double)(float)std::sin(2 * kPi * i / 2048); init = true; }
  return t;
}
struct SinInit { SinInit() { SINT(); } };
inline double fsin(double c) {
  if (!(std::fabs(c) < 1e6)) return 0;
  c -= std::floor(c); const double x = c * 2048; int i = (int)x; if (i < 0) i = 0; if (i > 2048) i = 2048;
  const double* S = SINT(); return S[i] + (S[i + 1] - S[i]) * (x - i);
}
constexpr int kTabN = 1024, kFrames = 16, kMips = 9, kTables = 12, kMaxH = 256;
inline uint32_t whash(int a, int b) {
  uint32_t h = ((uint32_t)a * 2654435761u) ^ ((uint32_t)b * 40503u) ^ 0x9E3779B9u;
  h = h ^ (h >> 15); h = h * 2246822519u; h = h ^ (h >> 13); return h;
}
inline double whash01(int a, int b) { return double(whash(a, b) & 0xFFFF) / 65535; }
inline void recipe(int t, double p, int k, double& RA, double& RP) {
  static const double FV[5][3] = {{800, 1150, 2900}, {400, 1600, 2700}, {270, 2300, 3000}, {450, 800, 2830}, {325, 700, 2530}},
                      FC[5][3] = {{800, 1050, 2800}, {600, 1000, 2500}, {300, 1800, 2900}, {500, 900, 2700}, {350, 650, 2400}};
  static const double R3[2][10] = {{1, 1, 0.8, 0, 0.5, 0, 0.3, 0.2, 0, 0}, {0.2, 1, 0.3, 0.9, 0.2, 0.7, 0.2, 0.6, 0.5, 0.4}};
  const double kk = k; RP = 0;
  switch (t) {
    case 0: RA = ((k & 1) ? 1 : (1 - p)) / kk; break;
    case 1: { const double lim = 1 + p * 63; RA = kk <= lim ? 1 / kk : (kk < lim + 2 ? (lim + 2 - kk) * 0.5 / kk : 0); break; }
    case 2: case 6: {
      const double x = p * 4; const int i = std::min((int)x, 3); const double f = x - i; const double(*A)[3] = t == 2 ? FV : FC; double s = 0;
      for (int j = 0; j < 3; ++j) { const double c = (A[i][j] + (A[i + 1][j] - A[i][j]) * f) / 110, bw = 1.2 + 0.25 * c, d = (kk - c) / bw; s += std::exp(-0.5 * d * d) * (j == 0 ? 1 : 0.7); }
      RA = s / std::pow(kk, 0.3) * (t == 6 ? 1 : 0.8); if (t == 6) RP = 0.15 * whash01(k, 6); break; }
    case 3: if (k > 10) { RA = 0; break; } RA = (R3[0][k - 1] + (R3[1][k - 1] - R3[0][k - 1]) * p) * 0.6; break;
    case 4: { const int s = 1 + (int)std::floor(p * 7); RA = ((k - 1) % s == 0) ? 1 / std::pow(kk, 0.7) : 0; break; }
    case 5: { const int s = 2 + (int)std::floor(p * 6); RA = (1 / std::sqrt(kk)) * ((k % s == 0) ? 0.15 : 1); RP = whash01(k, 5); break; }
    case 7: { const double lv = 2 + (1 - p) * 30, a = 1 / kk; RA = std::floor(a * lv + 0.5) / lv; break; }
    case 8: { if (!(k & 1)) { RA = 0; break; } const double c = 3 + p * 20, d = (kk - c) / (3 + p * 4); RA = (1 / kk) * (0.4 + 1.6 * std::exp(-0.5 * d * d)); break; }
    case 9: RA = (1 / kk) * (0.5 + 0.5 * std::cos(2 * 3.14159265 * kk * p * 0.5)); break;
    case 10: { const double lim = 1 + p * 120; RA = kk <= lim ? 1 : 0; break; }
    default: RA = 1 / kk; RP = p * whash01(k, 11);
  }
}
inline std::vector<float> buildTable(int t) {
  std::vector<float> data((size_t)kMips * kFrames * (kTabN + 1), 0.f); std::vector<double> acc(kTabN), sinT(kTabN);
  for (int i = 0; i < kTabN; ++i) sinT[i] = std::sin(2 * kPi * i / kTabN);
  for (int f = 0; f < kFrames; ++f) {
    const double p = double(f) / (kFrames - 1); std::fill(acc.begin(), acc.end(), 0.0); int done = 0;
    for (int m = kMips - 1; m >= 0; --m) {
      const int H = kMaxH >> m;
      for (int k = done + 1; k <= H; ++k) {
        double RA, RP; recipe(t, p, k, RA, RP); const double a = RA; if (a == 0) continue;
        int idx = ((int)(RP * kTabN)) & (kTabN - 1);
        for (int n = 0; n < kTabN; ++n) { acc[n] += a * sinT[idx]; idx = (idx + k) & (kTabN - 1); }
      }
      done = H; const size_t o = (size_t)(m * kFrames + f) * (kTabN + 1); for (int n = 0; n < kTabN; ++n) data[o + n] = (float)acc[n];
    }
    double pk = 1e-6; const size_t o0 = (size_t)f * (kTabN + 1); for (int n = 0; n < kTabN; ++n) pk = std::max(pk, std::fabs((double)data[o0 + n])); const double sc = 0.9 / pk;
    for (int m = 0; m < kMips; ++m) { const size_t o = (size_t)(m * kFrames + f) * (kTabN + 1); for (int n = 0; n < kTabN; ++n) data[o + n] = (float)((double)data[o + n] * sc); data[o + kTabN] = data[o]; }
  }
  return data;
}
struct TabBank { std::vector<float> d[kTables]; std::once_flag fl[kTables]; };
inline const float* tableData(int t) { static TabBank B; std::call_once(B.fl[t], [&] { B.d[t] = buildTable(t); }); return B.d[t].data(); }
inline double wtRead(int t, double hz, double sr, double phase, double pos) {
  const float* d = tableData(t); int m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
  const double fp = std::min(std::max(pos, 0.0), 1.0) * (kFrames - 1); const int f0 = std::min((int)fp, kFrames - 2); const double ff = fp - f0;
  const double x = (phase - std::floor(phase)) * kTabN; const int i = (int)x; const double fr = x - i;
  const size_t oa = (size_t)(m * kFrames + f0) * (kTabN + 1) + i, ob = oa + (kTabN + 1);
  const double va = (double)d[oa] + ((double)d[oa + 1] - (double)d[oa]) * fr, vb = (double)d[ob] + ((double)d[ob + 1] - (double)d[ob]) * fr;
  return va + (vb - va) * ff;
}
// ---- body table
struct Body { const char* name; int n; double ratio[8], amp[8], t60[8]; };
static const Body BODY[] = {
  {"Gong", 8, {1, 1.59, 2.14, 2.30, 2.65, 2.92, 3.16, 3.50}, {1, .8, .7, .6, .5, .4, .35, .3}, {7, 5, 4, 3.5, 3, 2.5, 2, 1.6}},
  {"Singing bowl", 4, {1, 2.71, 5.15, 8.43}, {1, .6, .35, .2}, {8, 5, 3, 2}},
  {"Church bell", 8, {.5, 1, 1.2, 1.5, 2, 2.5, 3, 4}, {.6, 1, .8, .6, .5, .35, .25, .15}, {9, 7, 6, 5, 4, 3, 2.5, 2}},
  {"Sitar gourd", 6, {1, 2.0, 3.02, 4.1, 5.3, 6.9}, {1, .8, .7, .55, .4, .3}, {3.5, 3, 2.5, 2, 1.6, 1.2}},
  {"Tabla", 6, {1, 2, 3, 4, 5, 6}, {1, .7, .5, .35, .25, .2}, {.9, .7, .5, .35, .25, .2}},
  {"Spanish guitar", 6, {1, 1.98, 2.97, 4.02, 5.01, 6.1}, {1, .6, .5, .35, .25, .2}, {2.2, 1.8, 1.4, 1.1, .8, .6}},
  {"Handpan", 4, {1, 2.0, 3.0, 4.01}, {1, .6, .35, .15}, {3.5, 2.5, 1.6, .9}},
  {"Steel drum", 8, {1, 2, 3, 4, 1.003, 2.004, 3.005, 4.006}, {1, .8, .5, .3, .7, .55, .35, .2}, {1.4, 1.1, .8, .5, 1.4, 1.1, .8, .5}},
  {"Gamelan", 8, {1, 2.76, 5.40, 8.93, 1.006, 2.77, 5.42, 8.95}, {1, .55, .3, .15, .8, .45, .25, .12}, {3.2, 1.4, .6, .25, 3.2, 1.4, .6, .25}},
  {"Kalimba", 3, {1, 5.4, 13.3}, {1, .5, .15}, {1.8, .4, .12}},
  {"Marimba bar", 3, {1, 3.93, 9.2}, {1, .5, .2}, {1.2, .35, .1}},
  {"Wine glass", 3, {1, 2.32, 4.25}, {1, .35, .12}, {5, 3, 1.5}}};
constexpr int kBodies = 12;
inline std::vector<std::string> bodyNames() { std::vector<std::string> r; for (auto& b : BODY) r.push_back(b.name); return r; }
inline std::vector<std::string> tableNames() { return {"Saw to square", "Harmonic rise", "Vowels", "Pipe organ", "Glass comb", "Rusty metal", "Choir", "Digital grit", "Hollow reed", "Spectral comb", "Buzz sweep", "Phase ensemble"}; }
inline std::vector<std::string> noiseNames() { return {"White", "Pink", "Brown", "Blue", "Violet", "Grey", "Velvet", "Dust", "Vinyl crackle", "Tape hiss", "Mains hum", "C64 SID", "NES long", "NES metallic", "Atari / AY", "Stepped", "Looped buzz", "Logistic chaos", "Lorenz chaos", "Henon chaos", "Rain", "Wind", "Fire", "Radio static", "Motor", "Fan", "Clock ticks", "Machinery", "Sparks"}; }
constexpr int NTypeCount = 29, NGrey = 5;
inline std::vector<std::string> keyNames() { return {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}; }
// ---- noise sources
inline double expMap(double t, double lo, double hi) { return lo * std::pow(hi / lo, clampd(t, 0, 1)); }
struct Ring { double f = 0, a = 0, p = 0; };
struct NoiseSrc {
  Ring rings[4]; double hum[8] = {}; Rng rng{1}; double sr = 48000; std::vector<float> loop;
  int sid = 0, nes = 1, atari = 1, lp = 0; double acc = 0, held = 0, lx = 0.3, ly = 1, lz = 1, zx = 0.1, zy = 0, zz = 0, hx = 0.1, hy = 0.1;
  double env = 0, env2 = 0, ph = 0, ph2 = 0, lo1 = 0, lo2 = 0, lo3 = 0, bp1 = 0, bp2 = 0, fc = 800, fcT = 800, wow = 0, wowT = 0; bool tick = false;
  double c1500, c40, c1800, c80, c2500, c6000, c60, c900, c70;
  void init(double s, int seed) {
    sr = s; rng.s = (uint32_t)seed * 2654435761u + 12345u; if (!rng.s) rng.s = 1;
    sid = 0x7FFFF8; nes = 1; atari = 1; acc = 0; held = 0; lx = 0.3; ly = 1; lz = 1; zx = 0.1; zy = 0; zz = 0; hx = 0.1; hy = 0.1;
    const int n = (int)(sr / 20) + 4; loop.assign((size_t)n, 0.f); for (int i = 0; i < n; ++i) loop[(size_t)i] = (float)rng.bi(); lp = 0;
    env = 0; env2 = 0; ph = 0; ph2 = 0; lo1 = lo2 = lo3 = 0; bp1 = bp2 = 0; fc = 800; fcT = 800; wow = 0; wowT = 0; tick = false; for (auto& r : rings) r = Ring(); for (double& h : hum) h = 0;
    auto c = [&](double h) { return std::exp(-2 * kPi * h / sr); };
    c1500 = c(1500); c40 = c(40); c1800 = c(1800); c80 = c(80); c2500 = c(2500); c6000 = c(6000); c60 = c(60); c900 = c(900); c70 = c(70);
  }
  bool poisson(double per) { return rng.uni() < per / sr; }
  double next(int type, double speed) {
    Rng& r = rng; const double sr_ = sr; const double TP = 2 * kPi;
    switch (type) {
      case 0: case 1: case 2: case 3: case 4: case 5: return r.bi() * 0.866;
      case 6: return poisson(expMap(speed, 20, 4000)) ? (r.uni() < 0.5 ? 1 : -1) : 0;
      case 7: return poisson(expMap(speed, 20, 4000)) ? r.uni() : 0;
      case 8: {
        Ring& g = rings[0];
        if (poisson(expMap(speed, 3, 120))) { const double a = r.uni(); const double sgn = r.uni() < 0.5 ? 1 : -1; g.a = sgn * a * a * a * 3; g.f = 2500 + 2000 * r.uni(); g.p = 0; }
        g.p += 2 * kPi * g.f / sr_; const double pop = std::sin(g.p) * g.a; g.a *= std::exp(-1 / (0.0015 * sr_));
        const double w1 = r.bi(); lo2 = r.bi() * (1 - c1500) + lo2 * c1500; const double hiss = (w1 - lo2) * 0.03; lo3 = r.bi() * (1 - c40) + lo3 * c40; return pop + hiss + lo3 * 0.6; }
      case 9: {
        if (poisson(0.5 + 3 * speed)) wowT = r.bi() * 0.25;
        wow += (wowT - wow) * 0.0005; const double w = r.bi(); lo1 = w * (1 - c1800) + lo1 * c1800;
        lo2 = r.bi() * (1 - c80) + lo2 * c80; return (w - lo1 * 0.9) * 0.9 * (1 + wow) + lo2 * 0.05; }
      case 10: {
        const double f0 = 30 + 90 * speed; double s = 0;
        for (int k = 1; k <= 8; ++k) { double h = hum[k - 1] + 2 * kPi * f0 * k / sr_; if (h > 2 * kPi) h -= 2 * kPi; hum[k - 1] = h; s += std::sin(h) * ((k & 1) ? 1 : 0.5) / std::pow((double)k, 0.9); }
        return s * 0.45 + r.bi() * 0.004; }
      case 11: {
        acc += expMap(speed, 100, 400000) / sr_; int g = 0;
        while (acc >= 1 && g++ < 64) { acc -= 1; const int bit = ((sid >> 22) ^ (sid >> 17)) & 1; sid = ((sid << 1) | bit) & 0x7FFFFF; }
        if (acc >= 1) acc = 0;
        const int s = sid, b = (((s >> 22) & 1) << 7) | (((s >> 20) & 1) << 6) | (((s >> 16) & 1) << 5) | (((s >> 13) & 1) << 4) | (((s >> 11) & 1) << 3) | (((s >> 7) & 1) << 2) | (((s >> 4) & 1) << 1) | ((s >> 2) & 1);
        return (b - 127.5) / 127.5 * 0.7; }
      case 12: case 13: {
        acc += expMap(speed, 100, 400000) / sr_; int g = 0; const int sh = type == 13 ? 6 : 1;
        while (acc >= 1 && g++ < 64) { acc -= 1; const int fb = (nes & 1) ^ ((nes >> sh) & 1); nes = (nes >> 1) | (fb << 14); }
        if (acc >= 1) acc = 0; return (nes & 1) ? -0.6 : 0.6; }
      case 14: {
        acc += expMap(speed, 100, 400000) / sr_; int g = 0;
        while (acc >= 1 && g++ < 64) { acc -= 1; const int fb = (atari ^ (atari >> 3)) & 1; atari = (atari >> 1) | (fb << 16); }
        if (acc >= 1) acc = 0; return (atari & 1) ? 0.6 : -0.6; }
      case 15: { acc += expMap(speed, 20, sr_ * 0.5) / sr_; if (acc >= 1) { acc -= std::floor(acc); held = r.bi(); } return held * 0.8; }
      case 16: { const int len = std::max(4, (int)(sr_ / expMap(speed, 20, 2000))); lp = (lp + 1) % len; return (double)loop[(size_t)lp] * 0.8; }
      case 17: {
        acc += expMap(speed, 200, sr_) / sr_;
        while (acc >= 1) { acc -= 1; lx = 3.9 * lx * (1 - lx); if (lx <= 0.0001 || lx >= 0.9999) lx = 0.3 + 0.4 * r.uni(); }
        return (lx * 2 - 1) * 0.9; }
      case 18: {
        const double dt = 0.0004 + 0.012 * speed * speed;
        for (int i = 0; i < 2; ++i) { const double dx = 10 * (zy - zx), dy = zx * (28 - zz) - zy, dz = zx * zy - (8.0 / 3) * zz; zx += dx * dt; zy += dy * dt; zz += dz * dt; }
        if (!std::isfinite(zx) || std::fabs(zx) > 100) { zx = 0.1; zy = 0; zz = 0; }
        return clampd(zx / 20, -1, 1); }
      case 19: {
        const double a = 1 + 0.4 * speed, nx = 1 - a * hx * hx + hy; hy = 0.3 * hx; hx = nx;
        if (!std::isfinite(hx) || std::fabs(hx) > 5) { hx = 0.1; hy = 0.1; }
        return clampd(hx / 1.3, -1, 1); }
      case 20: {
        if (poisson(expMap(speed, 40, 3000))) env = 0.2 + r.uni();
        env *= 0.995; const double w = r.bi(); lo1 = w * (1 - c2500) + lo1 * c2500; lo2 = r.bi() * (1 - c6000) + lo2 * c6000; return (w - lo1) * env * 1.2 + lo2 * 0.12; }
      case 21: {
        if (poisson(0.5 + 8 * speed)) fcT = 150 + 1700 * r.uni();
        fc += (fcT - fc) * (0.5 / sr_ * (1 + 6 * speed)); const double f = 2 * std::sin(kPi * fc / sr_), q = 0.5, hp = r.bi() - bp2 - q * bp1; bp1 += f * hp; bp2 += f * bp1; return clampd(bp1, -2, 2) * 0.9; }
      case 22: {
        if (poisson(expMap(speed, 5, 150))) { env = 0.4 + r.uni(); env2 = 0.9985 + 0.0012 * r.uni(); }
        env *= env2 > 0 ? env2 : 0.998; lo1 = r.bi() * (1 - c2500) + lo1 * c2500; lo2 = r.bi() * (1 - c60) + lo2 * c60; return lo1 * env * 3 + lo2 * 0.5; }
      case 23: {
        if (poisson(0.3 + 4 * speed)) wowT = r.uni();
        wow += (wowT - wow) * (2 / sr_); if (poisson(0.2 + 1.5 * speed)) fcT = 600 + 2400 * r.uni(); fc += (fcT - fc) * (3 / sr_);
        ph += 2 * kPi * fc / sr_; if (ph > 2 * kPi) ph -= 2 * kPi; const double wh = wow > 0.8 ? std::sin(ph) * (wow - 0.8) * 2 : 0;
        const double a = r.bi() * (0.25 + 0.6 * wow); const double b = poisson(30) ? r.bi() * 1.5 : 0; return a + wh * 0.5 + b; }
      case 24: {
        const double f0 = 5 + 95 * speed * speed; ph += 2 * kPi * f0 / sr_; if (ph > 2 * kPi) ph -= 2 * kPi; double s = 0; for (int k = 1; k <= 6; ++k) s += std::sin(ph * k) / k;
        lo1 = r.bi() * (1 - c900) + lo1 * c900; return s * 0.4 + lo1 * (0.7 + 0.5 * std::sin(ph)) * 0.8; }
      case 25: {
        const double fcc = expMap(speed, 300, 4000), f = 2 * std::sin(kPi * fcc / sr_), q = 0.12, hp = r.bi() - bp2 - q * bp1; bp1 += f * hp; bp2 += f * bp1;
        ph += 2 * kPi * (30 + 90 * speed) / sr_; if (ph > 2 * kPi) ph -= 2 * kPi; return clampd(bp1, -3, 3) * 0.5 * (1 + 0.3 * std::sin(ph)); }
      case 26: {
        acc += expMap(speed, 0.5, 20) / sr_ * (1 + 0.02 * r.bi());
        if (acc >= 1) { acc -= 1; env = 1; tick = !tick; ph2 = 0; }
        env *= 0.99; ph2 += 2 * kPi * (tick ? 1700 : 1250) / sr_; return (r.bi() * 0.5 + std::sin(ph2)) * env * env * 0.8; }
      case 27: {
        if (poisson(expMap(speed, 0.5, 10))) { const double base = 150 + 450 * r.uni(); static const double rt[4] = {1, 2.76, 5.4, 8.93}; for (int k = 0; k < 4; ++k) { rings[k].f = base * rt[k]; rings[k].a = 0.6 / (1 + k); rings[k].p = 0; } }
        double s = 0; for (int k = 0; k < 4; ++k) { Ring& g = rings[k]; g.p += 2 * kPi * g.f / sr_; s += std::sin(g.p) * g.a; g.a *= 0.99985; }
        lo1 = r.bi() * (1 - c70) + lo1 * c70; return s * 0.6 + lo1 * 0.4; }
      default: {
        if (poisson(expMap(speed, 3, 400))) { const double u1 = r.uni(); const double u2 = r.uni(); fc = 500 + 8500 * u1 * u2; env = 0.5 + r.uni(); }
        env *= 0.9991; const double f = 2 * std::sin(kPi * std::min(fc, 18000.0) / sr_), q = 0.06, hp = r.bi() - bp2 - q * bp1; bp1 += f * hp; bp2 += f * bp1; return clampd(bp1, -4, 4) * env * 0.35; }
    }
    (void)TP;
  }
};
struct SlopeLadder {
  int n = 0; double b0[20] = {}, b1[20] = {}, a1[20] = {}, gain = 1, z[2][20] = {};
  void configure(double slope, double sr) {
    n = 0; gain = 1; if (std::fabs(slope) < 0.02) return;
    const double K = 2 * sr, dec = 0.3, shift = -slope * 3.3219 * dec / 20;
    for (double lf = std::log10(15.0); n < 20; lf += dec) {
      const double fp = std::pow(10.0, lf); if (fp > sr * 0.45) break;
      const double fz = clampd(fp * std::pow(10.0, shift), 5, sr * 0.49), wp = K * std::tan(kPi * fp / sr), wz = K * std::tan(kPi * fz / sr);
      b0[n] = (wz + K) / (wp + K); b1[n] = (wz - K) / (wp + K); a1[n] = (wp - K) / (wp + K); ++n;
    }
    double acc = 0; const int M = 512;
    for (int i = 1; i <= M; ++i) {
      const double w = kPi * i / M; double hr = 1, hi = 0; const double cr = std::cos(w), ci = -std::sin(w);
      for (int k = 0; k < n; ++k) {
        const double nr = b0[k] + b1[k] * cr, ni = b1[k] * ci, dr = 1 + a1[k] * cr, di = a1[k] * ci, dd = dr * dr + di * di, qr = (nr * dr + ni * di) / dd, qi = (ni * dr - nr * di) / dd;
        const double t = hr * qr - hi * qi; hi = hr * qi + hi * qr; hr = t;
      }
      acc += hr * hr + hi * hi;
    }
    gain = 1 / std::sqrt(acc / M); for (auto& zz : z) for (double& x : zz) x = 0;
  }
  double run(int ch, double x) { if (!n) return x; double* zc = z[ch]; for (int k = 0; k < n; ++k) { const double y = b0[k] * x + zc[k]; zc[k] = b1[k] * x - a1[k] * y; x = y; } return x * gain; }
  void reset() { for (auto& zz : z) for (double& x : zz) x = 0; }
};
// ---- Apparatus: a subset of the Boardica pedals
struct QS { std::string name; double mn, mx, def; bool lg; std::vector<std::string> labels; };
inline QS Qf(const char* n, double mn, double mx, double def, bool lg = false, std::vector<std::string> labels = {}) { return QS{n, mn, mx, def, lg, std::move(labels)}; }
struct Fxd {
  double sr; std::vector<double> v; double tempo = 120;
  Fxd(double s, const std::vector<QS>& ps) : sr(s) { for (auto& p : ps) v.push_back(p.def); }
  virtual ~Fxd() = default;
  virtual void cfg() {}
  virtual void set(int i, double x) { if (i >= 0 && i < (int)v.size()) { v[(size_t)i] = x; cfg(); } }
  virtual void process(const float* iL, const float* iR, float* oL, float* oR, int n) = 0;
};
using FxPtr = std::unique_ptr<Fxd>;

inline std::vector<QS> PS_BIT() { return {Qf("Bits", 4, 16, 8), Qf("Rate", 500, 48000, 12000, true), Qf("Dither", 0, 1, 0, false, {"Off", "On"}), Qf("Drive", 0, 24, 0), Qf("Mix", 0, 100, 100), Qf("Output", -24, 12, 0)}; }
struct Bitsmashica : Fxd {
  Smooth mix, out, drive; Rng rng{7}; double hold[2] = {0, 0}, phase = 1;
  Bitsmashica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { for (Smooth* m : {&mix, &out, &drive}) m->setTime(0.02, s); cfg(); mix.reset(mix.target); out.reset(out.target); drive.reset(drive.target); }
  void cfg() override { mix.target = v[4] / 100; out.target = dbToGain(v[5]); drive.target = dbToGain(v[3]); }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double step = std::min(1.0, v[1] / sr), levels = std::pow(2.0, v[0] - 1); const bool dither = v[2] > 0.5;
    for (int i = 0; i < n; ++i) {
      const double dr = drive.next(), m = mix.next(), o = out.next(); phase += step;
      if (phase >= 1) {
        phase -= 1;
        for (int s = 0; s < 2; ++s) { double x = clampd((s ? iR[i] : iL[i]) * dr, -1, 1); if (dither) { const double a = rng.uni(); const double b = rng.uni(); x += (a - b) / levels; } hold[s] = clampd(rnd(x * levels) / levels, -1, 1); }
      }
      oL[i] = (float)((iL[i] * (1 - m) + hold[0] * m) * o); oR[i] = (float)((iR[i] * (1 - m) + hold[1] * m) * o);
    }
  }
};
inline std::vector<QS> PS_BODY() { return {Qf("Body", 0, kBodies - 1, 0, false, bodyNames()), Qf("Tonic", 0, 11, 0, false, keyNames()), Qf("Octave", -2, 3, 0), Qf("Tune", -100, 100, 0), Qf("Decay", 0.1, 4, 1, true), Qf("Brightness", 0, 100, 60), Qf("Stereo spread", 0, 100, 40), Qf("Drive", 0, 100, 25), Qf("Mix", 0, 100, 40)}; }
struct Bodica : Fxd {
  Svf m[2][10]; double amp[10] = {}; int nm = 0;
  Bodica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { cfg(); }
  void cfg() override {
    const Body& b = BODY[(int)clampd(rnd(v[0]), 0, kBodies - 1)]; const double f0 = midiHz(48 + v[1] + 12 * rnd(v[2]) + v[3] / 100); nm = 0; const double bright = v[5] / 100, spread = v[6] / 100 * 0.012;
    for (int k = 0; k < b.n && k < 10; ++k) {
      const double f = f0 * b.ratio[k]; if (f > sr * 0.42) continue;
      const double t60 = std::max(0.05, b.t60[k] * v[4]), q = std::max(0.6, 3.14159 * f * t60 / 6.91), g = 1.5 * std::sqrt(q);
      for (int c = 0; c < 2; ++c) m[c][nm].set(f * (1 + (c ? spread : -spread)), q, sr);
      amp[nm] = g * b.amp[k] * std::pow(0.35 + 0.65 * bright, k * 0.5) * (k == 0 ? 1 : 0.7); ++nm;
    }
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double mix = v[8] / 100, drive = 1 + v[7] / 100 * 5;
    for (int i = 0; i < n; ++i) {
      const double x0 = fastTanh(iL[i] * drive) / drive, x1 = fastTanh(iR[i] * drive) / drive; double w0 = 0, w1 = 0;
      for (int k = 0; k < nm; ++k) { Svf& a = m[0][k]; a.run(x0 * 0.5 + x1 * 0.5); w0 += a.band * a.k * amp[k]; Svf& b = m[1][k]; b.run(x1 * 0.5 + x0 * 0.5); w1 += b.band * b.k * amp[k]; }
      oL[i] = (float)(iL[i] * (1 - mix * 0.5) + fastTanh(w0) * mix * 1.4); oR[i] = (float)(iR[i] * (1 - mix * 0.5) + fastTanh(w1) * mix * 1.4);
    }
  }
};
inline std::vector<QS> PS_CHO() { return {Qf("Mode", 0, 2, 0, false, {"Chorus", "Vibrato", "Doubler"}), Qf("Rate", 0.05, 8, 0.8, true), Qf("Depth", 0, 100, 50), Qf("Voices", 0, 2, 1, false, {"1", "2", "3"}), Qf("Width", 0, 100, 80), Qf("Tone", 0, 100, 60), Qf("Mix", 0, 100, 50)}; }
struct Chorusica : Fxd {
  DelayLine line[2]; OP lp[2]; OP walkS[6]; double walk[6] = {}; long long walkCtr = 0; double phase = 0; Smooth mix, depth; Rng rng{11};
  Chorusica(double s, const std::vector<QS>& ps) : Fxd(s, ps), line{DelayLine((long long)(0.08 * s)), DelayLine((long long)(0.08 * s))} { mix.setTime(0.03, s); depth.setTime(0.05, s); cfg(); mix.reset(mix.target); depth.reset(depth.target); }
  void cfg() override { for (int s = 0; s < 2; ++s) lp[s].set(3000 + v[5] / 100 * 15000, sr); for (auto& w : walkS) w.set(1.5, sr); mix.target = v[6] / 100; depth.target = v[2] / 100; }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const int mode = (int)std::floor(v[0]), voices = (int)std::floor(v[3]) + 1; const double width = v[4] / 100, inc = v[1] / sr;
    for (int i = 0; i < n; ++i) {
      phase += inc; if (phase >= 1) phase -= 1; const double dep = depth.next(), m = mix.next(); line[0].push(iL[i]); line[1].push(iR[i]); double wet[2] = {0, 0};
      for (int s = 0; s < 2; ++s) {
        for (int k = 0; k < voices; ++k) {
          double d;
          if (mode == 2) {
            if (s == 0 && k == 0 && ((++walkCtr) & 63) == 0) for (int j = 0; j < 6; ++j) walk[j] = clampd(walk[j] + rng.bi() * 0.08, -1, 1);
            d = (0.022 + 0.004 * k + 0.003 * s) * sr + walkS[s * 3 + k].run(walk[s * 3 + k]) * dep * 0.003 * sr;
          } else {
            const double ph = phase + (double)k / voices + (s ? 0.25 * width : 0), lfo = std::sin(2 * kPi * ph), base = mode == 1 ? 0.004 : 0.007 + 0.0015 * k, sweep = mode == 1 ? 0.003 : 0.005;
            d = (base + sweep * dep * 0.5 * (1 + lfo)) * sr;
          }
          wet[s] += line[s].read(std::max(2.0, d));
        }
        wet[s] = lp[s].run(wet[s] / std::sqrt((double)voices));
      }
      const double mid = 0.5 * (wet[0] + wet[1]), side = 0.5 * (wet[0] - wet[1]) * (0.3 + 0.7 * width), mm = mode == 1 ? 1 : m;
      oL[i] = (float)(iL[i] * (1 - mm) + (mid + side) * mm); oR[i] = (float)(iR[i] * (1 - mm) + (mid - side) * mm);
    }
  }
};
inline std::vector<QS> PS_COMP() { return {Qf("Threshold", -60, 0, -18), Qf("Ratio", 1, 20, 4, true), Qf("Attack", 0.1, 200, 10, true), Qf("Release", 10, 2000, 120, true), Qf("Knee", 0, 24, 6), Qf("Makeup", 0, 24, 0), Qf("Auto makeup", 0, 1, 0, false, {"Off", "On"}), Qf("Detector", 0, 1, 0, false, {"Peak", "RMS"}), Qf("Side-chain HPF", 20, 500, 20, true), Qf("Mix", 0, 100, 100)}; }
struct Compressica : Fxd {
  Biquad hp[2]; Smooth mix, mk; double gr = 0, ms = 0, atk = 0, rel = 0, rmsC = 0;
  Compressica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { mix.setTime(0.02, s); mk.setTime(0.02, s); cfg(); mix.reset(mix.target); mk.reset(mk.target); }
  double makeup() { double db = v[5]; if (v[6] > 0.5) db += -v[0] * (1 - 1 / std::max(1.0, v[1])) * 0.5; return dbToGain(db); }
  void cfg() override { for (auto& h : hp) h.set(BQHighPass, v[8], 0.7071, 0, sr); atk = std::exp(-1 / std::max(1.0, v[2] * 0.001 * sr)); rel = std::exp(-1 / std::max(1.0, v[3] * 0.001 * sr)); rmsC = std::exp(-1 / (0.01 * sr)); mix.target = v[9] / 100; mk.target = makeup(); }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double T = v[0], R = std::max(1.0, v[1]), W = v[4]; const bool rms = v[7] > 0.5;
    for (int i = 0; i < n; ++i) {
      const double sl = hp[0].run(iL[i]), sr2 = hp[1].run(iR[i]); double level;
      if (rms) { const double p = 0.5 * (sl * sl + sr2 * sr2); ms = p + (ms - p) * rmsC; level = std::sqrt(ms); } else level = std::max(std::fabs(sl), std::fabs(sr2));
      const double x = 20 * std::log10(std::max(level, 1e-6)), over = x - T; double y;
      if (2 * over < -W) y = x; else if (2 * std::fabs(over) <= W) { const double t = over + W * 0.5; y = x + (1 / R - 1) * t * t / (2 * W); } else y = T + over / R;
      const double target = y - x; gr = target < gr ? target + (gr - target) * atk : target + (gr - target) * rel;
      const double g = std::pow(10.0, gr / 20) * mk.next(), m = mix.next(); oL[i] = (float)(iL[i] * (1 - m) + iL[i] * g * m); oR[i] = (float)(iR[i] * (1 - m) + iR[i] * g * m);
    }
  }
};
inline std::vector<QS> PS_DLY() { return {Qf("Mode", 0, 1, 0, false, {"Bucket brigade", "Tape"}), Qf("Time", 10, 2000, 350, true), Qf("Sync", 0, 12, 0, false, {"Off", "1/32", "1/16T", "1/16", "1/16D", "1/8T", "1/8", "1/8D", "1/4T", "1/4", "1/4D", "1/2", "1 bar"}), Qf("Feedback", 0, 100, 40), Qf("Tone", 0, 100, 50), Qf("Character", 0, 100, 40), Qf("Ping-pong", 0, 1, 0, false, {"Off", "On"}), Qf("Mix", 0, 100, 30)}; }
struct Delayica : Fxd {
  DelayLine line[2]; OP lp[2], lp2[2]; OH hp[2]; Rng noise{5}; Smooth time, mix, fb; double wow = 0, flut = 0, lastTempo = 0;
  Delayica(double s, const std::vector<QS>& ps) : Fxd(s, ps), line{DelayLine((long long)(2.6 * s)), DelayLine((long long)(2.6 * s))} { mix.setTime(0.03, s); fb.setTime(0.03, s); cfg(); time.reset(time.target); mix.reset(mix.target); fb.reset(fb.target); }
  double targetSamples() { static const double b[13] = {0, 0.125, 1.0 / 6, 0.25, 0.375, 1.0 / 3, 0.5, 0.75, 2.0 / 3, 1, 1.5, 2, 4}; const double s = clampd(std::floor(v[2]), 0, 12), ms = s == 0 ? v[1] : b[(int)s] * 60000 / std::max(20.0, tempo); return clampd(ms * 0.001 * sr, 2, 2.5 * sr); }
  void cfg() override {
    const bool tape = v[0] > 0.5; const double tone = v[4] / 100, ms = targetSamples() / sr * 1000; time.setTime(tape ? 0.35 : 0.08, sr); time.target = targetSamples();
    const double cut = tape ? 2500 + tone * 9000 : (1500 + tone * 4500) * clampd(std::pow(300 / std::max(ms, 30.0), 0.35), 0.45, 1.6);
    for (int s = 0; s < 2; ++s) { lp[s].set(cut, sr); lp2[s].set(cut * 1.6, sr); hp[s].set(tape ? 90 : 140, sr); } mix.target = v[7] / 100; fb.target = std::min(0.98, v[3] / 100 * 1.02);
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    if (lastTempo != tempo) { lastTempo = tempo; cfg(); }
    const bool tape = v[0] > 0.5, ping = v[6] > 0.5; const double ch = v[5] / 100, wInc = 2 * kPi * 0.55 / sr, fInc = 2 * kPi * 6.5 / sr;
    for (int i = 0; i < n; ++i) {
      const double t = time.next(), fbk = fb.next(), m = mix.next(); double mod = 0;
      if (tape) { wow += wInc; flut += fInc; if (wow > 2 * kPi) wow -= 2 * kPi; if (flut > 2 * kPi) flut -= 2 * kPi; mod = ch * (0.0035 * std::sin(wow) + 0.00035 * std::sin(flut)) * sr; }
      const double y0 = line[0].read(std::max(2.0, t + mod)), y1 = line[1].read(std::max(2.0, t + mod * 0.9));
      double w0 = hp[0].run(lp2[0].run(lp[0].run(y0))), w1 = hp[1].run(lp2[1].run(lp[1].run(y1)));
      if (tape) { w0 = fastTanh(w0 * (1 + ch)) / (1 + ch); w1 = fastTanh(w1 * (1 + ch)) / (1 + ch); }
      else { w0 = fastTanh(w0 * 1.4) / 1.4; w0 += noise.bi() * 0.0006 * ch; w1 = fastTanh(w1 * 1.4) / 1.4; w1 += noise.bi() * 0.0006 * ch; }
      const double xl = iL[i], xr = iR[i];
      if (ping) { line[0].push(0.5 * (xl + xr) + w1 * fbk); line[1].push(w0 * fbk); } else { line[0].push(xl + w0 * fbk); line[1].push(xr + w1 * fbk); }
      oL[i] = (float)(xl * (1 - m) + y0 * m); oR[i] = (float)(xr * (1 - m) + y1 * m);
    }
  }
};
inline std::vector<QS> PS_EQ() { return {Qf("Low cut", 0, 1, 0, false, {"Off", "On"}), Qf("Low cut freq", 20, 1000, 40, true), Qf("Low type", 0, 1, 0, false, {"Shelf", "Bell"}), Qf("Low freq", 20, 1000, 100, true), Qf("Low gain", -18, 18, 0), Qf("Low Q", 0.3, 6, 0.7, true),
  Qf("Low-mid freq", 50, 2000, 400, true), Qf("Low-mid gain", -18, 18, 0), Qf("Low-mid Q", 0.3, 10, 1, true), Qf("Mid freq", 200, 8000, 1500, true), Qf("Mid gain", -18, 18, 0), Qf("Mid Q", 0.3, 10, 1, true),
  Qf("High-mid freq", 1000, 16000, 4000, true), Qf("High-mid gain", -18, 18, 0), Qf("High-mid Q", 0.3, 10, 1, true), Qf("High type", 0, 1, 0, false, {"Shelf", "Bell"}), Qf("High freq", 2000, 20000, 10000, true), Qf("High gain", -18, 18, 0), Qf("High Q", 0.3, 6, 0.7, true),
  Qf("High cut", 0, 1, 0, false, {"Off", "On"}), Qf("High cut freq", 2000, 20000, 18000, true), Qf("Output", -18, 18, 0)}; }
struct EQualica : Fxd {
  Biquad f[2][7]; bool on[7] = {}; Smooth out;
  EQualica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { out.setTime(0.02, s); cfg(); out.reset(out.target); }
  void both(int k, int t, double fr, double q, double g) { for (auto& ch : f) { Biquad& b = ch[k]; Biquad nb; nb.set(t, fr, q, g, sr); b.b0 = nb.b0; b.b1 = nb.b1; b.b2 = nb.b2; b.a1 = nb.a1; b.a2 = nb.a2; } }
  void cfg() override {
    if (v[0] > 0.5 && !on[0]) for (auto& ch : f) ch[0].reset(); on[0] = v[0] > 0.5; both(0, BQHighPass, v[1], 0.7071, 0);
    both(1, v[2] > 0.5 ? BQPeak : BQLowShelf, v[3], v[5], v[4]); on[1] = true; both(2, BQPeak, v[6], v[8], v[7]); on[2] = true; both(3, BQPeak, v[9], v[11], v[10]); on[3] = true; both(4, BQPeak, v[12], v[14], v[13]); on[4] = true;
    both(5, v[15] > 0.5 ? BQPeak : BQHighShelf, v[16], v[18], v[17]); on[5] = true; if (v[19] > 0.5 && !on[6]) for (auto& ch : f) ch[6].reset(); on[6] = v[19] > 0.5; both(6, BQLowPass, v[20], 0.7071, 0); out.target = dbToGain(v[21]);
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    for (int i = 0; i < n; ++i) { double l = iL[i], r = iR[i]; for (int k = 0; k < 7; ++k) if (on[k]) { l = f[0][k].run(l); r = f[1][k].run(r); } const double g = out.next(); oL[i] = (float)(l * g); oR[i] = (float)(r * g); }
  }
};
inline std::vector<QS> PS_FLA() { return {Qf("Rate", 0.02, 10, 0.25, true), Qf("Depth", 0, 100, 70), Qf("Manual", 0.2, 8, 1.5, true), Qf("Feedback", -90, 90, 50), Qf("Width", 0, 100, 60), Qf("Mix", 0, 100, 60), Qf("Mode", 0, 1, 0, false, {"Classic", "Through-zero"}), Qf("Polarity", 0, 1, 0, false, {"+", "-"})}; }
struct Flangica : Fxd {
  DelayLine line[2], dry[2]; double fbz[2] = {0, 0}, phase = 0; Smooth mix;
  Flangica(double s, const std::vector<QS>& ps) : Fxd(s, ps), line{DelayLine((long long)(0.04 * s) + 8), DelayLine((long long)(0.04 * s) + 8)}, dry{DelayLine((long long)(0.04 * s) + 8), DelayLine((long long)(0.04 * s) + 8)} { mix.setTime(0.03, s); cfg(); mix.reset(mix.target); }
  void cfg() override { mix.target = v[5] / 100; }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double depth = v[1] / 100, fb = v[3] / 100, width = v[4] / 100, inc = v[0] / sr, man = v[2] * 0.001 * sr, pol = v[7] > 0.5 ? -1 : 1; const bool tz = v[6] > 0.5;
    for (int i = 0; i < n; ++i) {
      phase += inc; if (phase >= 1) phase -= 1; const double m = mix.next();
      for (int s = 0; s < 2; ++s) {
        const double x = s ? iR[i] : iL[i], lfo = 0.5 + 0.5 * std::sin(2 * kPi * (phase + (s ? 0.25 * width : 0))); line[s].push(x + fb * fbz[s]); double o;
        if (tz) { const double D0 = std::max(4.0, man * 2), d = std::max(2.0, D0 * (1 + (2 * lfo - 1) * depth)); dry[s].push(x); const double wet = line[s].read(d), dd = dry[s].read(D0); fbz[s] = std::tanh(wet); o = dd * (1 - 0.5 * m) + pol * wet * 0.5 * m; }
        else { const double d = std::max(2.0, man * (1 + 3 * depth * lfo)), wet = line[s].read(d); fbz[s] = std::tanh(wet); o = x * (1 - 0.5 * m) + pol * wet * 0.5 * m; }
        if (s) oR[i] = (float)o; else oL[i] = (float)o;
      }
    }
  }
};
inline std::vector<QS> PS_LIM() { return {Qf("Gain", 0, 24, 0), Qf("Ceiling", -12, 0, -0.3), Qf("Release", 10, 1000, 100, true)}; }
struct Limitica : Fxd {
  int n_; double dly[2][512] = {}, inst[512], mn[512]; long long pos = 0; double sum, env = 1, rel = 0; Smooth gain;
  Limitica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { n_ = (int)clampd(rnd(0.002 * s), 4, 512); for (int i = 0; i < 512; ++i) inst[i] = mn[i] = 1; sum = n_; gain.setTime(0.02, s); cfg(); gain.reset(gain.target); }
  void cfg() override { gain.target = dbToGain(v[0]); rel = std::exp(-1 / std::max(1.0, v[2] * 0.001 * sr)); }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double ceil = dbToGain(v[1]); const int N = n_;
    for (int i = 0; i < n; ++i) {
      const double g = gain.next(), l = iL[i] * g, r = iR[i] * g, pk = std::max(std::fabs(l), std::fabs(r)); const int w = (int)(pos & 511); dly[0][w] = l; dly[1][w] = r; inst[w] = pk > ceil ? ceil / pk : 1;
      double mnv = 1; for (int k = 0; k < N; ++k) { const double q = inst[(int)((pos - k) & 511)]; if (q < mnv) mnv = q; }
      sum += mnv - mn[(int)((pos - N) & 511)]; mn[w] = mnv; const double sm = sum / N; env = sm < env ? sm : sm + (env - sm) * rel;
      const int rd = (int)((pos - (N - 1)) & 511); oL[i] = (float)clampd(dly[0][rd] * env, -ceil, ceil); oR[i] = (float)clampd(dly[1][rd] * env, -ceil, ceil); ++pos;
    }
  }
};
inline std::vector<QS> PS_NZ() {
  std::vector<QS> r; const double defs[3] = {1, 8, 11}, lv[3] = {-30, -60, -60};
  for (int l = 0; l < 3; ++l) { const std::string p = std::string(1, "ABC"[l]) + " "; r.push_back(Qf((p + "Type").c_str(), 0, NTypeCount - 1, defs[l], false, noiseNames())); r.push_back(Qf((p + "Level").c_str(), -60, 12, lv[l])); r.push_back(Qf((p + "Tone").c_str(), -6, 6, 0)); r.push_back(Qf((p + "Speed").c_str(), 0, 100, 50)); }
  r.push_back(Qf("Mode", 0, 4, 0, false, {"Add", "Follow", "Fill gaps", "Ring", "Dropout"})); r.push_back(Qf("Amount", 0, 100, 60)); r.push_back(Qf("Sensitivity", -60, 0, -24)); r.push_back(Qf("Attack", 0.5, 500, 10, true)); r.push_back(Qf("Release", 5, 2000, 150, true));
  r.push_back(Qf("Low cut", 20, 2000, 20, true)); r.push_back(Qf("High cut", 500, 20000, 20000, true)); r.push_back(Qf("Drive", 0, 100, 0)); r.push_back(Qf("Width", 0, 100, 100)); r.push_back(Qf("Dry", 0, 100, 100)); r.push_back(Qf("Noise", -24, 24, 0)); r.push_back(Qf("Listen", 0, 1, 0, false, {"Mix", "Noise only"}));
  return r;
}
struct Noiszical : Fxd {
  NoiseSrc src[3][2]; SlopeLadder lad[3]; Biquad grey[2][3], cut[2][2]; Smooth lvl[3], noiseG, dryG; double env = 0, gate = 1, dn = 0; bool started = false;
  Noiszical(double s, const std::vector<QS>& ps) : Fxd(s, ps) {
    for (int l = 0; l < 3; ++l) for (int c = 0; c < 2; ++c) src[l][c].init(s, l * 2 + c + 1);
    for (Smooth& m : lvl) m.setTime(0.02, s); noiseG.setTime(0.02, s); dryG.setTime(0.02, s);
    for (int l = 0; l < 3; ++l) cfgLayer(l); cfgOut(); for (Smooth& m : lvl) m.reset(m.target); noiseG.reset(noiseG.target); dryG.reset(dryG.target);
  }
  void cfgLayer(int l) {
    const int type = (int)rnd(v[l * 4]); const double slope = (type == 1 ? -3.0103 : type == 2 ? -6.0206 : type == 3 ? 3.0103 : type == 4 ? 6.0206 : 0) + v[l * 4 + 2]; lad[l].configure(slope, sr);
    lvl[l].target = v[l * 4 + 1] <= -59.9 ? 0 : dbToGain(v[l * 4 + 1]); if (!started) lvl[l].cur = lvl[l].target;
    if (type == NGrey) for (int c = 0; c < 2; ++c) { grey[c][0].set(BQLowShelf, 150, 0.7, 14, sr); grey[c][1].set(BQPeak, 3500, 0.8, -7, sr); grey[c][2].set(BQHighShelf, 9000, 0.7, 9, sr); }
  }
  void cfgOut() { for (int c = 0; c < 2; ++c) { cut[c][0].set(BQHighPass, v[17], 0.707, 0, sr); cut[c][1].set(BQLowPass, v[18], 0.707, 0, sr); } noiseG.target = dbToGain(v[22]); dryG.target = v[21] / 100; if (!started) { noiseG.cur = noiseG.target; dryG.cur = dryG.target; } }
  void set(int i, double x) override { if (i < 0 || i >= (int)v.size()) return; v[(size_t)i] = x; if (i < 12) cfgLayer(i / 4); else cfgOut(); }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const int mode = (int)rnd(v[12]); const double amt = v[13] / 100, drive = v[19] / 100, wid = v[20] / 100, thr = dbToGain(v[14]); const bool only = v[23] > 0.5;
    const double aA = std::exp(-1 / std::max(1.0, v[15] * 0.001 * sr)), aR = std::exp(-1 / std::max(1.0, v[16] * 0.001 * sr)), pre = 1 + 8 * drive, post = 1 / (1 + 1.5 * drive); started = true;
    double nz[2], s2[2] = {0, 0}, o[2], x[2];
    for (int i = 0; i < n; ++i) {
      nz[0] = nz[1] = 0;
      for (int l = 0; l < 3; ++l) {
        const double g = lvl[l].next(); if (g < 1e-5 && lvl[l].target < 1e-5) continue; const int type = (int)rnd(v[l * 4]); const double sp = v[l * 4 + 3] / 100;
        for (int c = 0; c < 2; ++c) { double s = src[l][c].next(type, sp); s = lad[l].run(c, s); if (type == NGrey) for (int k = 0; k < 3; ++k) s = grey[c][k].run(s); s2[c] = s; }
        nz[0] += s2[0] * g; nz[1] += (s2[0] + (s2[1] - s2[0]) * wid) * g;
      }
      for (int c = 0; c < 2; ++c) { nz[c] = cut[c][1].run(cut[c][0].run(nz[c])); if (drive > 0) nz[c] = std::tanh(nz[c] * pre) * post; }
      x[0] = iL[i]; x[1] = iR[i]; const double e = 0.5 * (std::fabs(x[0]) + std::fabs(x[1])); env = e > env ? e + (env - e) * aA : e + (env - e) * aR;
      const double track = std::min(1.0, env / std::max(1e-6, thr)), master = noiseG.next(), dry = dryG.next();
      if (mode == 4) {
        dn += (0.5 * (std::fabs(nz[0]) + std::fabs(nz[1])) / std::max(1e-6, master) - dn) * 0.02; const double t = amt * 0.5, target = dn > t * 0.5 ? 1 : 0; gate += (target - gate) * 0.02;
        for (int c = 0; c < 2; ++c) o[c] = only ? nz[c] * master * (1 - gate) : x[c] * dry * (1 - amt * (1 - gate));
      } else if (mode == 3) {
        for (int c = 0; c < 2; ++c) { const double ring = x[c] * nz[c] * master * 2; o[c] = only ? ring * amt : x[c] * dry * (1 - amt) + ring * amt; }
      } else {
        double g = 1; if (mode == 1) g = 1 - amt + amt * track; else if (mode == 2) g = 1 - amt + amt * (1 - track);
        for (int c = 0; c < 2; ++c) { const double add = nz[c] * master * g; o[c] = only ? add : x[c] * dry + add; }
      }
      oL[i] = (float)o[0]; oR[i] = (float)o[1];
    }
  }
};
inline std::vector<QS> PS_OD() { return {Qf("Pre gain", -24, 24, 0), Qf("Drive", 0, 100, 50), Qf("Tone", 0, 100, 50), Qf("Post gain", -24, 24, -6), Qf("Mix", 0, 100, 100)}; }
struct Overdrivica : Fxd {
  OH hp[2], dc[2]; OP clip[2], tone[2]; Smooth pre, post, mix, drv;
  Overdrivica(double s, const std::vector<QS>& ps) : Fxd(s, ps) {
    for (Smooth* m : {&pre, &post, &mix, &drv}) m->setTime(0.02, s);
    for (int k = 0; k < 2; ++k) { hp[k].set(720, s); clip[k].set(5600, s); dc[k].set(15, s); } cfg(); for (Smooth* m : {&pre, &post, &mix, &drv}) m->reset(m->target);
  }
  void cfg() override { const double d = v[1] / 100; for (int s = 0; s < 2; ++s) tone[s].set(650 * std::pow(10.0, v[2] / 100), sr); pre.target = dbToGain(v[0]); post.target = dbToGain(v[3]); mix.target = v[4] / 100; drv.target = 1 + d * d * 150; }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    for (int i = 0; i < n; ++i) {
      const double pg = pre.next(), po = post.next(), m = mix.next(), dg = drv.next(); const double x0 = iL[i], x1 = iR[i];
      for (int s = 0; s < 2; ++s) {
        const double u = (s ? x1 : x0) * pg, h = hp[s].run(u) * dg, di = h >= 0 ? std::tanh(h) : std::tanh(h * 0.9) / 0.9 * 0.95; double o = clip[s].run(u + di); o = 4 * std::tanh(o * 0.25); o = dc[s].run(tone[s].run(o));
        const double out = (s ? x1 : x0) * (1 - m) + o * po * m; if (s) oR[i] = (float)out; else oL[i] = (float)out;
      }
    }
  }
};
inline std::vector<QS> PS_PH() { return {Qf("Stages", 0, 2, 1, false, {"4", "6", "8"}), Qf("Rate", 0.02, 10, 0.4, true), Qf("Depth", 0, 100, 70), Qf("Center", 100, 4000, 800, true), Qf("Feedback", -90, 90, 40), Qf("Width", 0, 100, 60), Qf("Mix", 0, 100, 60)}; }
struct Phasica : Fxd {
  double z[2][8] = {}, fbz[2] = {0, 0}, phase = 0; Smooth mix;
  Phasica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { mix.setTime(0.03, s); cfg(); mix.reset(mix.target); }
  void cfg() override { mix.target = v[6] / 100; }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const int stages = 4 + 2 * (int)std::floor(v[0]); const double depth = v[2] / 100, fb = v[4] / 100, width = v[5] / 100, inc = v[1] / sr;
    for (int i = 0; i < n; ++i) {
      phase += inc; if (phase >= 1) phase -= 1; const double m = mix.next();
      for (int s = 0; s < 2; ++s) {
        const double inp = s ? iR[i] : iL[i], lfo = std::sin(2 * kPi * (phase + (s ? 0.25 * width : 0))), f = clampd(v[3] * std::pow(2.0, lfo * depth * 2), 20, sr * 0.45), t = std::tan(kPi * f / sr), a = (t - 1) / (t + 1); double* zz = z[s];
        double x = inp + fb * fbz[s]; for (int k = 0; k < stages; ++k) { const double y = a * x + zz[k]; zz[k] = x - a * y; x = y; } fbz[s] = std::tanh(x); const double o = inp * (1 - 0.5 * m) + x * 0.5 * m; if (s) oR[i] = (float)o; else oL[i] = (float)o;
      }
    }
  }
};
static const double REEL_M[6][15] = {{55, 2.8, 1.1, 21000, 18, 0.60, 0.04, -74, 0.04, 0.02, 0.0, 200, 0.0, 3000, 0}, {70, 1.9, 1.0, 16000, 20, 0.92, 0.10, -68, 0.06, 0.04, 0.9, 260, 0.7, 3200, 0}, {85, 2.3, 1.2, 13000, 22, 1.15, 0.15, -66, 0.08, 0.05, 1.4, 180, -0.5, 4000, 0},
  {45, 0.6, 1.0, 22000, 16, 0.45, 0.01, -80, 0.02, 0.01, 0, 300, 0, 3000, 0}, {95, 2.1, 1.3, 11000, 25, 1.0, 0.12, -62, 0.12, 0.08, 0.6, 220, 0.4, 2800, 0}, {40, 0.3, 1.0, 16000, 75, 0.82, 0.05, -76, 0.03, 0.02, 0, 300, 1.8, 3500, 1}};
static const int HEADMASK[12] = {1, 2, 4, 3, 6, 5, 7, 0, 1, 2, 4, 7};
inline std::vector<QS> PS_REEL() { return {Qf("Machine", 0, 5, 0, false, {"Studer A80", "MCI JH-24", "Scully 280", "Telefunken M15", "Revox A77", "Nagra IV-S"}), Qf("Tape speed", 0, 2, 1, false, {"7.5 ips", "15 ips", "30 ips"}), Qf("Input", -18, 24, 0), Qf("Output", -24, 12, 0), Qf("Bias", -100, 100, 0),
  Qf("Aggressive", 0, 1, 0, false, {"Off", "On"}), Qf("Aggression", 0, 100, 50), Qf("Low-mid drive", 0, 100, 0), Qf("Low-mid focus", 100, 1200, 350, true), Qf("Head bump", 0, 200, 100), Qf("Tape age", 0, 100, 20), Qf("Hiss", 0, 100, 40), Qf("Wow", 0, 200, 100), Qf("Flutter", 0, 200, 100), Qf("Tape mix", 0, 100, 100),
  Qf("Space echo", 0, 1, 0, false, {"Off", "On"}), Qf("Echo mode", 0, 11, 3, false, {"1: Head 1", "2: Head 2", "3: Head 3", "4: Heads 1+2", "5: Heads 2+3", "6: Heads 1+3", "7: Heads 1+2+3", "8: Reverb only", "9: Reverb + 1", "10: Reverb + 2", "11: Reverb + 3", "12: Reverb + all"}),
  Qf("Repeat rate", 60, 450, 190, true), Qf("Intensity", 0, 110, 35), Qf("Echo level", 0, 100, 50), Qf("Echo bass", -12, 12, 0), Qf("Echo treble", -12, 12, 0), Qf("Echo wow", 0, 100, 35), Qf("Echo spread", 0, 100, 40), Qf("Reverb level", 0, 100, 40), Qf("Reverb decay", 0, 100, 55)}; }
struct Reelica : Fxd {
  long long baseDelay, lat; DelayLine wowD[2], dryD[2], loop[2], springD[2]; std::vector<Allpass> springAp[2];
  Biquad hp[2], lmBp[2], pre[2], de[2], bump[2], mud[2], pres[2], lp[2], eBass[2], eTreb[2]; OH dc[2], loopHp[2], springHp[2]; OP lpAge[2], springLp[2], hissLp[2], loopLp[2][2];
  Smooth gIn, gOut, mixS, echoS, revS; Rng rng{77}; double lim = 1, limEnv = 0, wowPh = 0, flutPh = 0, driftLp = 0, ePh = 0, echoT = 9000, echoTt = 9000; bool echoInit = false; long long springLen[2] = {8, 8}; double springFb = 0.7, hissLin = 0, limRel = 0.9998;
  static DelayLine mk(double n, double s) { return DelayLine((long long)(n * s)); }
  Reelica(double s, const std::vector<QS>& ps) : Fxd(s, ps), baseDelay(std::max(8LL, (long long)rnd(0.002 * s))), lat(baseDelay),
    wowD{mk(0.012, s), mk(0.012, s)}, dryD{mk(0.02, s), mk(0.02, s)}, loop{mk(1.9, s), mk(1.9, s)}, springD{mk(0.12, s), mk(0.12, s)} {
    for (int c = 0; c < 2; ++c) for (int j = 0; j < 12; ++j) springAp[c].emplace_back(8);
    for (Smooth* m : {&gIn, &gOut, &mixS, &echoS, &revS}) m->setTime(0.02, s);
    cfg(); for (Smooth* m : {&gIn, &gOut, &mixS, &echoS, &revS}) m->reset(m->target); echoT = echoTt;
  }
  void cfg() override {
    const double* M = REEL_M[(int)clampd(rnd(v[0]), 0, 5)]; const int sp = (int)rnd(v[1]); const double bias = v[4] / 100, age = v[10] / 100;
    gIn.target = dbToGain(v[2]); gOut.target = dbToGain(v[3]); mixS.target = v[14] / 100; echoS.target = v[19] / 100; revS.target = v[23] / 100;
    const double am = v[5] > 0.5 ? v[6] / 100 : 0, pr = 6 + 6 * am, spHf = sp == 0 ? 0.62 : sp == 2 ? 1.4 : 1, spBump = sp == 0 ? 0.5 : sp == 2 ? 2 : 1, spHiss = sp == 0 ? 1.4 : sp == 2 ? 0.7 : 1;
    for (int c = 0; c < 2; ++c) {
      hp[c].set(BQHighPass, M[4], 0.707, 0, sr); lmBp[c].set(BQBandPass, v[8], 0.7, 0, sr); pre[c].set(BQHighShelf, 3500, 0.6, pr, sr); de[c].set(BQHighShelf, 3500, 0.6, -pr, sr);
      bump[c].set(BQPeak, M[0] * spBump, M[2], M[1] * v[9] / 100, sr); mud[c].set(BQPeak, M[11], 0.8, M[10], sr); pres[c].set(BQPeak, M[13], 0.9, M[12], sr);
      lp[c].set(BQLowPass, std::min(sr * 0.45, M[3] * spHf * (1 - 0.22 * bias)), 0.707, 0, sr); lpAge[c].set(std::max(2500.0, 18000 * (1 - 0.8 * age) * spHf), sr);
      dc[c].set(8, sr); hissLp[c].set(2500, sr); loopHp[c].set(180, sr); loopLp[c][0].set(5200, sr); loopLp[c][1].set(5200, sr);
      eBass[c].set(BQLowShelf, 140, 0.7, v[20], sr); eTreb[c].set(BQHighShelf, 3500, 0.7, v[21], sr); springLp[c].set(2800, sr); springHp[c].set(180, sr);
      springLen[c] = std::max(8LL, (long long)((0.031 + 0.007 * c) * sr)); for (int j = 0; j < 12; ++j) { springAp[c][(size_t)j].len = 1 + (j % 3); springAp[c][(size_t)j].g = 0.62; }
    }
    springFb = 0.5 + 0.42 * v[25] / 100; const double hissDb = M[7] + 20 * std::log10(spHiss), amt = v[11] / 100; hissLin = amt <= 0 ? 0 : std::pow(10.0, hissDb / 20) * std::pow(amt / 0.4, 1.5);
    echoTt = v[17] * 0.001 * sr; if (!echoInit) { echoT = echoTt; echoInit = true; } limRel = std::exp(-1 / (0.08 * sr));
  }
  void spring(double x, double* out) { for (int c = 0; c < 2; ++c) { const double y = springD[c].tap(springLen[c] - 1); double fb = springHp[c].run(springLp[c].run(y)); for (auto& a : springAp[c]) fb = a.run(fb); springD[c].push(std::tanh(x * 0.6 + fb * springFb)); out[c] = y * 0.9; } }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double* M = REEL_M[(int)clampd(rnd(v[0]), 0, 5)]; const int sp = (int)rnd(v[1]); const bool aggr = v[5] > 0.5; const double am = aggr ? v[6] / 100 : 0, bias = v[4] / 100;
    const double kneeEff = M[5] * (1 - 0.3 * bias) * (1 + 2.5 * am), asym = M[6] + 0.07 * am - 0.04 * bias, hardMix = 0.45 * am, lmAmt = v[7] / 100, lmG = 1 + 9 * lmAmt, outTrim = 1 / (1 + 0.45 * am);
    const double spWf = sp == 0 ? 1.5 : sp == 2 ? 0.6 : 1, wowDp = M[8] * 0.01 * v[12] / 100 * spWf, fluD = M[9] * 0.01 * v[13] / 100 * spWf;
    const bool echoOn = v[15] > 0.5; const int mode = (int)rnd(v[16]), mask = HEADMASK[(int)clampd(mode, 0, 11)]; const bool hasRev = mode >= 7; const double hiss = hissLin;
    const int nh = ((mask & 1) ? 1 : 0) + ((mask & 2) ? 1 : 0) + ((mask & 4) ? 1 : 0); const double intens = v[18] / 100 * (mask ? 1 / std::max(1.0, 0.62 * nh) : 0), ewow = v[22] / 100, spread = 1 + 0.09 * v[24] / 100;
    const double tanA = std::tanh(asym), norm = 1 / (kneeEff * (1 - tanA * tanA)); double tape[2] = {0, 0}, dry[2] = {0, 0}, x[2] = {0, 0}, eo[2] = {0, 0}, sp2[2] = {0, 0};
    for (int i = 0; i < n; ++i) {
      const double gi = gIn.next(), go = gOut.next(), mx = mixS.next();
      wowPh += 2 * kPi * 0.8 / sr; flutPh += 2 * kPi * 9.3 / sr; if (wowPh > 2 * kPi) wowPh -= 2 * kPi; if (flutPh > 2 * kPi) flutPh -= 2 * kPi;
      driftLp = driftLp * 0.99997 + rng.bi() * 0.00003;
      const double mod = wowDp / (2 * kPi * 0.8) * (std::sin(wowPh) + 40 * driftLp) + fluD / (2 * kPi * 9.3) * std::sin(flutPh), dly = (double)baseDelay + mod * sr;
      x[0] = iL[i]; x[1] = iR[i];
      for (int c = 0; c < 2; ++c) {
        double u = x[c] * gi; if (lmAmt > 0.001) { const double b = lmBp[c].run(u); u += (std::tanh(lmG * b) / lmG - b) * lmAmt * 3; }
        u = hp[c].run(u); u = pre[c].run(u);
        { const double s = kneeEff * u + asym; double t = std::tanh(s) - tanA; if (hardMix > 0) { const double h = clampd(s, -1, 1) - clampd(asym, -1, 1); t = t * (1 - hardMix) + h * hardMix; } u = t * norm; }
        u = dc[c].run(u); u = de[c].run(u); u = bump[c].run(u); u = mud[c].run(u); u = pres[c].run(u); u = lp[c].run(u); u = lpAge[c].run(u);
        if (M[14] > 0) { const double a = std::fabs(u); limEnv = a > limEnv ? a : limEnv * limRel; } tape[c] = u;
      }
      if (M[14] > 0) { const double tgt = limEnv > 0.7 ? 0.7 / limEnv : 1; lim += (tgt - lim) * (tgt < lim ? 0.02 : 0.0008); tape[0] *= lim; tape[1] *= lim; }
      for (int c = 0; c < 2; ++c) {
        wowD[c].push(tape[c]); dryD[c].push(x[c]); double w = wowD[c].read(std::max(2.0, dly + 1));
        const double h1 = hiss * hissLp[c].run(rng.bi()) * 1.6; const double h2 = hiss * rng.bi() * 0.35; w += h1 + h2; dry[c] = dryD[c].tap(lat); tape[c] = w;
      }
      double l = (dry[0] * (1 - mx) + tape[0] * mx) * go * outTrim, r = (dry[1] * (1 - mx) + tape[1] * mx) * go * outTrim;
      if (echoOn) {
        const double el = echoS.next(), rv = revS.next(); echoT += (echoTt - echoT) * 0.00012; ePh += 2 * kPi * 0.62 / sr; if (ePh > 2 * kPi) ePh -= 2 * kPi;
        const double wob = 1 + ewow * (0.0016 * std::sin(ePh) + 0.0006 * std::sin(ePh * 11.7 + 1) + 0.9 * driftLp), in2[2] = {l, r}, sprIn = 0.5 * (l + r);
        for (int c = 0; c < 2; ++c) {
          const double T = echoT * wob * (c ? spread : 1); double heads = 0, fb = 0;
          for (int h = 0; h < 3; ++h) if (mask & (1 << h)) { const double rr = loop[c].read(std::max(4.0, T * (h + 1))); heads += rr * (h == 0 ? 1 : h == 1 ? 0.85 : 0.7); fb += rr; }
          double f = loopHp[c].run(fb * intens); f = loopLp[c][1].run(loopLp[c][0].run(f)); f = std::tanh(f * 1.35) / 1.35; loop[c].push(in2[c] * 0.8 + f);
          heads = eTreb[c].run(eBass[c].run(heads)); eo[c] = heads * el * 1.5;
        }
        sp2[0] = sp2[1] = 0; if (hasRev && rv > 0.001) spring(sprIn, sp2); l += eo[0] + sp2[0] * rv; r += eo[1] + sp2[1] * rv;
      }
      oL[i] = (float)l; oR[i] = (float)r;
    }
  }
};
static const int SCALE_N[9] = {7, 7, 7, 5, 5, 6, 5, 2, 12};
static const int SCALES[9][12] = {{0, 2, 4, 5, 7, 9, 11}, {0, 2, 3, 5, 7, 8, 10}, {0, 2, 3, 5, 7, 9, 10}, {0, 2, 4, 7, 9}, {0, 3, 5, 7, 10}, {0, 2, 4, 6, 8, 10}, {0, 2, 3, 7, 8}, {0, 7}, {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}};
inline std::vector<QS> PS_RES() { return {Qf("Root", 0, 11, 9, false, keyNames()), Qf("Scale", 0, 8, 3, false, {"Major", "Minor", "Dorian", "Major pentatonic", "Minor pentatonic", "Whole tone", "Hirajoshi", "Octaves and fifths", "Chromatic"}), Qf("Lowest octave", 1, 5, 2), Qf("Octaves", 1, 6, 4), Qf("Partials", 1, 3, 2),
  Qf("Decay", 50, 12000, 2500, true), Qf("Damping", 0, 100, 40), Qf("Inharmonic", 0, 100, 0), Qf("Spread", 0, 100, 60), Qf("Mix", 0, 100, 50), Qf("Level", -24, 24, 0)}; }
struct Resonica : Fxd {
  static constexpr int N = 216; double b0[N] = {}, a1[N] = {}, a2[N] = {}, y1[N] = {}, y2[N] = {}, gl[N] = {}, gr[N] = {}; int nRes = 0; bool dirty = true;
  Resonica(double s, const std::vector<QS>& ps) : Fxd(s, ps) {}
  void cfg() override { dirty = true; }
  void build() {
    dirty = false; const int sc = (int)clampd(rnd(v[1]), 0, 8); const int root = (int)rnd(v[0]), lowOct = (int)rnd(v[2]), octs = (int)rnd(v[3]), parts = (int)clampd(rnd(v[4]), 1, 3);
    const double T = v[5] * 0.001, damp = v[6] / 100, inh = v[7] / 100 * 0.02, spread = v[8] / 100; int nNotes = 0; nRes = 0;
    for (int o = 0; o < octs; ++o) for (int di = 0; di < SCALE_N[sc]; ++di) {
      const int d = SCALES[sc][di]; if (nNotes >= 72) break;
      const int midi = 12 * (lowOct + o + 1) + root + d; const double f0 = 440 * std::pow(2.0, (midi - 69) / 12.0), pan = spread * std::sin(nNotes * 2.399963), a = (pan + 1) * 0.25 * kPi, gL = std::cos(a), gR = std::sin(a);
      for (int p = 1; p <= parts; ++p) {
        const double f = f0 * p * std::sqrt(1 + inh * p * p * p); if (f > 0.45 * sr) continue;
        const double Tp = T / (1 + damp * 3 * (p - 1) + damp * f0 / 2000), w = 2 * kPi * f / sr, r = std::pow(10.0, -3 / std::max(1.0, Tp * sr)); const int k = nRes++;
        a1[k] = 2 * r * std::cos(w); a2[k] = r * r; b0[k] = std::pow(1 - r, 0.88) * std::sqrt(1 - 2 * r * std::cos(2 * w) + r * r); gl[k] = gL / p; gr[k] = gR / p;
      }
      ++nNotes;
    }
    for (int k = nRes; k < N; ++k) y1[k] = y2[k] = 0;
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    if (dirty) build(); const double mix = v[9] / 100, lvl = dbToGain(v[10]) * 2 / std::sqrt(std::max(1.0, std::floor(v[4])));
    for (int i = 0; i < n; ++i) {
      const double x = 0.5 * ((double)iL[i] + (double)iR[i]); double yl = 0, yr = 0;
      for (int k = 0; k < nRes; ++k) { double y = b0[k] * x + a1[k] * y1[k] - a2[k] * y2[k]; if (std::fabs(y) < 1e-20) y = 0; y2[k] = y1[k]; y1[k] = y; yl += y * gl[k]; yr += y * gr[k]; }
      oL[i] = (float)(iL[i] * (1 - mix) + std::tanh(yl * lvl) * mix); oR[i] = (float)(iR[i] * (1 - mix) + std::tanh(yr * lvl) * mix);
    }
  }
};
inline std::vector<QS> PS_REV() { return {Qf("Type", 0, 2, 1, false, {"Spring", "Plate", "Chamber"}), Qf("Size", 0, 100, 50), Qf("Decay", 0, 100, 55), Qf("Damping", 0, 100, 40), Qf("Pre-delay", 0, 250, 10), Qf("Low cut", 20, 1000, 120, true), Qf("High cut", 1000, 20000, 9000, true), Qf("Width", 0, 100, 100), Qf("Mix", 0, 100, 30)}; }
struct Reverbica : Fxd {
  DelayLine pre; std::vector<Allpass> inDiff; std::vector<Allpass> tankAp1, tankAp2; DelayLine tankD1[2], tankD2[2]; std::vector<Comb> comb[2]; std::vector<Allpass> roomAp[2];
  DelayLine springD[2]; std::vector<Allpass> springAp[2]; OP springLp[2]; OH springHp[2]; OP damp[2]; OP inLp; OH inHp; OP bw; Smooth mix, width;
  double lfo = 0, k = 1, pd1[2] = {1, 1}, pd2[2] = {1, 1}, pap1[2] = {0, 0}, plateDecay = 0.5, lfoInc = 0, springFb = 0.7; long long springLen[2] = {8, 8};
  static double kk(double s) { return s / 29761 * 1.6; }
  Reverbica(double s, const std::vector<QS>& ps) : Fxd(s, ps), pre((long long)(0.3 * s)),
    tankD1{DelayLine((long long)(4500 * kk(s))), DelayLine((long long)(4500 * kk(s)))}, tankD2{DelayLine((long long)(3800 * kk(s))), DelayLine((long long)(3800 * kk(s)))},
    springD{DelayLine((long long)(0.12 * s)), DelayLine((long long)(0.12 * s))} {
    const double kc = kk(s); for (int j = 0; j < 4; ++j) inDiff.emplace_back((long long)(400 * kc));
    for (int j = 0; j < 2; ++j) tankAp1.emplace_back((long long)(950 * kc)); for (int j = 0; j < 2; ++j) tankAp2.emplace_back((long long)(2700 * kc));
    const double c = s / 44100 * 1.5; for (int ch = 0; ch < 2; ++ch) { for (int j = 0; j < 8; ++j) comb[ch].emplace_back((long long)(1700 * c)); for (int j = 0; j < 4; ++j) roomAp[ch].emplace_back((long long)(600 * c)); for (int j = 0; j < 12; ++j) springAp[ch].emplace_back(8); }
    mix.setTime(0.03, s); width.setTime(0.03, s); cfg(); mix.reset(mix.target); width.reset(width.target);
  }
  void cfg() override {
    const double size = 0.5 + v[1] / 100, decay = v[2] / 100, dmp = v[3] / 100; inHp.set(v[5], sr); inLp.set(v[6], sr); mix.target = v[8] / 100; width.target = v[7] / 100; k = sr / 29761 * size;
    static const double dl[4] = {142, 107, 379, 277}, dg[4] = {0.75, 0.75, 0.625, 0.625}; for (int j = 0; j < 4; ++j) { inDiff[(size_t)j].len = std::max(1LL, (long long)(dl[j] * sr / 29761)); inDiff[(size_t)j].g = dg[j]; }
    static const double ap1[2] = {672, 908}, d1[2] = {4453, 4217}, ap2[2] = {1800, 2656}, d2[2] = {3720, 3163};
    for (int s = 0; s < 2; ++s) { pap1[s] = ap1[s] * k; tankAp1[(size_t)s].g = -0.7; tankAp2[(size_t)s].len = std::max(1LL, (long long)(ap2[s] * k)); tankAp2[(size_t)s].g = 0.5; pd1[s] = (double)std::max(1LL, (long long)(d1[s] * k)); pd2[s] = (double)std::max(1LL, (long long)(d2[s] * k)); damp[s].set(1000 + (1 - dmp) * 14000, sr); }
    bw.set(12000, sr); plateDecay = 0.2 + decay * 0.78; lfoInc = 2 * kPi * 0.9 / sr;
    static const double cl[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, al[4] = {556, 441, 341, 225}; const double c = sr / 44100 * size;
    for (int s = 0; s < 2; ++s) {
      for (int j = 0; j < 8; ++j) { Comb& cb = comb[s][(size_t)j]; cb.len = std::max(1LL, (long long)((cl[j] + s * 23) * c)); cb.fb = 0.7 + decay * 0.28; cb.damp = dmp * 0.6; }
      for (int j = 0; j < 4; ++j) { Allpass& a = roomAp[s][(size_t)j]; a.len = std::max(1LL, (long long)((al[j] + s * 23) * c)); a.g = 0.5; }
      springLen[s] = std::max(8LL, (long long)((0.033 + 0.007 * s) * size * sr)); for (int j = 0; j < 12; ++j) { springAp[s][(size_t)j].len = 1 + (j % 3); springAp[s][(size_t)j].g = 0.62; } springLp[s].set(2500 + (1 - dmp) * 3500, sr); springHp[s].set(180, sr);
    }
    springFb = 0.55 + decay * 0.38;
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const int type = (int)rnd(v[0]); const long long preLen = std::max(1LL, (long long)(v[4] * 0.001 * sr)); const double kq = k;
    auto T = [&](DelayLine& d, double at) { return d.tap(std::max(1LL, (long long)(at * kq)) - 1); };
    auto A = [&](Allpass& a, double at) { return a.d.tap(std::max(1LL, (long long)(at * kq)) - 1); };
    for (int i = 0; i < n; ++i) {
      const double dL = iL[i], dR = iR[i]; pre.push(0.5 * (dL + dR)); double x = pre.tap(preLen - 1); x = inLp.run(inHp.run(x)); double wl = 0, wr = 0;
      if (type == 1) {
        x = bw.run(x); for (auto& a : inDiff) x = a.run(x); lfo += lfoInc; if (lfo > 2 * kPi) lfo -= 2 * kPi; const double ex = 16 * kq * 0.5, dc = plateDecay;
        const double fbL = tankD2[1].tap((long long)pd2[1] - 1) * dc, fbR = tankD2[0].tap((long long)pd2[0] - 1) * dc;
        double l = tankAp1[0].runMod(x + fbL, pap1[0] + ex * std::sin(lfo)); tankD1[0].push(l); l = damp[0].run(tankD1[0].tap((long long)pd1[0] - 1)) * dc; l = tankAp2[0].run(l); tankD2[0].push(l);
        double r = tankAp1[1].runMod(x + fbR, pap1[1] + ex * std::cos(lfo)); tankD1[1].push(r); r = damp[1].run(tankD1[1].tap((long long)pd1[1] - 1)) * dc; r = tankAp2[1].run(r); tankD2[1].push(r);
        DelayLine* D1 = tankD1; DelayLine* D2 = tankD2; Allpass* P2 = tankAp2.data();
        wl = 0.6 * (T(D1[1], 266) + T(D1[1], 2974) - A(P2[1], 1913) + T(D2[1], 1996) - T(D1[0], 1990) - A(P2[0], 187) - T(D2[0], 1066));
        wr = 0.6 * (T(D1[0], 353) + T(D1[0], 3627) - A(P2[0], 1228) + T(D2[0], 2673) - T(D1[1], 2111) - A(P2[1], 335) - T(D2[1], 121));
      } else if (type == 2) {
        const double inp = x * 0.15;
        for (int s = 0; s < 2; ++s) { double acc = 0; for (auto& cb : comb[s]) acc += cb.run(inp); for (auto& ap : roomAp[s]) acc = ap.run(acc); if (s) wr = acc; else wl = acc; }
      } else {
        for (int s = 0; s < 2; ++s) { const double y = springD[s].tap(springLen[s] - 1); double fb = springHp[s].run(springLp[s].run(y)); for (auto& ap : springAp[s]) fb = ap.run(fb); springD[s].push(fastTanh(x * 0.6 + fb * springFb)); if (s) wr = y * 0.9; else wl = y * 0.9; }
      }
      const double w = width.next(), m = mix.next(), mid = 0.5 * (wl + wr), side = 0.5 * (wl - wr) * w; oL[i] = (float)(dL * (1 - m) + (mid + side) * m); oR[i] = (float)(dR * (1 - m) + (mid - side) * m);
    }
  }
};
inline std::vector<QS> PS_ROT() { return {Qf("Speed", 0, 2, 1, false, {"Stop", "Slow", "Fast"}), Qf("Drive", 0, 100, 20), Qf("Crossover", 300, 2000, 800, true), Qf("Horn level", 0, 1.5, 1), Qf("Drum level", 0, 1.5, 1), Qf("Mic spread", 0, 100, 70), Qf("Rotor depth", 0, 100, 70), Qf("Slow rate", 0.2, 2, 0.8), Qf("Fast rate", 3, 10, 6.7), Qf("Mix", 0, 100, 100)}; }
struct Rotica : Fxd {
  DelayLine horn[2], drum[2]; Svf xo; double hornHz = 0, drumHz = 0, aH = 0, aD = 0.31;
  Rotica(double s, const std::vector<QS>& ps) : Fxd(s, ps), horn{DelayLine((long long)(0.01 * s) + 16), DelayLine((long long)(0.01 * s) + 16)}, drum{DelayLine((long long)(0.01 * s) + 16), DelayLine((long long)(0.01 * s) + 16)} {}
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double spd = clampd(rnd(v[0]), 0, 2), hornT = spd == 0 ? 0 : (spd == 1 ? v[7] : v[8]), drumT = hornT * 0.88; const bool upH = hornT > hornHz, upD = drumT > drumHz;
    const double hC = 1 - std::exp(-1 / ((upH ? 0.9 : 1.6) * sr)), dC = 1 - std::exp(-1 / ((upD ? 3 : 4.5) * sr)), spread = v[5] / 100 * 1.5708, dep = v[6] / 100, mix = v[9] / 100, drive = 1 + v[1] / 100 * 7;
    const double phi[2] = {-spread, spread}, hornAm = 0.75 * dep, drumAm = 0.4 * dep, hornR = 0.17 * sr / 343 * dep, drumR = 0.09 * sr / 343 * dep, g = (1 + (drive - 1) * 0.3) / drive; double hm[2] = {0, 0}, dm[2] = {0, 0};
    xo.set(v[2], 0.7071, sr);
    for (int i = 0; i < n; ++i) {
      const double x = std::tanh(0.5 * ((double)iL[i] + (double)iR[i]) * drive) * g;
      hornHz += (hornT - hornHz) * hC; drumHz += (drumT - drumHz) * dC; if (hornT == 0 && hornHz < 0.003) hornHz = 0; if (drumT == 0 && drumHz < 0.003) drumHz = 0;
      aH += hornHz / sr; if (aH >= 1) aH -= 1; aD -= drumHz / sr; if (aD < 0) aD += 1;
      xo.run(x); const double low = xo.low, high = -xo.high, th = 2 * kPi * aH, td = 2 * kPi * aD;
      horn[0].push(high); horn[1].push(high); drum[0].push(low); drum[1].push(low);
      for (int m = 0; m < 2; ++m) { const double ch = std::cos(th - phi[m]), cd = std::cos(td - phi[m]); hm[m] = horn[m].read(hornR * (1 - ch) + 3) * (1 - hornAm * 0.5 * (1 - ch)); dm[m] = drum[m].read(drumR * (1 - cd) + 3) * (1 - drumAm * 0.5 * (1 - cd)); }
      const double wl = hm[0] * v[3] + dm[0] * v[4], wr = hm[1] * v[3] + dm[1] * v[4]; oL[i] = (float)(iL[i] * (1 - mix) + wl * mix); oR[i] = (float)(iR[i] * (1 - mix) + wr * mix);
    }
  }
};
inline std::vector<QS> PS_SEA() { return {Qf("Memory", 2, 30, 16), Qf("Rate", 0, 4, 2, false, {"1 beat", "1/2 bar", "1 bar", "2 bars", "4 bars"}), Qf("Ghost length", 0, 3, 1, false, {"1/4", "1/2", "1 beat", "2 beats"}), Qf("Pitch", 0, 4, 0, false, {"Same", "Octave down", "Octave up", "Fifth up", "Mixed"}),
  Qf("Reverse", 0, 100, 25), Qf("Haze", 0, 100, 60), Qf("Feedback", 0, 70, 15), Qf("Density", 0, 100, 60), Qf("Ghost level", -30, 6, -6), Qf("Mix", 0, 100, 50)}; }
struct Seancica : Fxd {
  struct Gr { bool on = false; double start = 0, age = 0, len = 0, rate = 1, dir = 1, gl = 1, gr = 1; };
  long long len; std::vector<float> buf[2]; long long w = 0; double clock = 0; long long filled = 0; Gr g[4]; double lp[2] = {0, 0}; uint32_t rng = 0x2545F491u; double fbL = 0, fbR = 0;
  Seancica(double s, const std::vector<QS>& ps) : Fxd(s, ps), len((long long)(31 * s)) { buf[0].assign((size_t)len, 0.f); buf[1].assign((size_t)len, 0.f); }
  double uni() { uint32_t r = rng; r ^= r << 13; r ^= r >> 17; r ^= r << 5; rng = r; return double(rng >> 8) * (1.0 / 16777216); }
  double read(int c, double pos) { const double L = (double)len; while (pos < 0) pos += L; while (pos >= L) pos -= L; const long long i = (long long)pos, j = i + 1 >= len ? 0 : i + 1; const double t = pos - (double)i; const std::vector<float>& b = buf[c]; return (double)b[(size_t)i] + ((double)b[(size_t)j] - (double)b[(size_t)i]) * t; }
  void launch(double gl, double beat, double mem) {
    Gr* gp = nullptr; for (auto& x : g) if (!x.on) { gp = &x; break; } if (!gp) return; Gr& q = *gp;
    const double maxBeats = std::max(1.0, std::floor((std::min(mem, (double)filled) - gl * 2) / beat)); const double back = std::floor(1 + uni() * maxBeats) * beat;
    const int pm = (int)clampd(rnd(v[3]), 0, 4); static const double rates[4] = {1, 0.5, 2, 1.5};
    if (pm == 0) q.rate = 1; else if (pm == 4) { const double u = uni(); q.rate = rates[((int)(u * 4)) & 3]; } else q.rate = rates[pm - 1];
    q.len = gl; q.age = 0; q.on = true; { const double u = uni(); q.dir = u * 100 < v[4] ? -1 : 1; }
    const double span = gl * q.rate, from = (double)w - back; q.start = q.dir > 0 ? from : from + span; const double p = uni() * 2 - 1; q.gl = 0.7 * (1 - 0.5 * std::max(0.0, p)); q.gr = 0.7 * (1 + 0.5 * std::min(0.0, p));
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double beat = sr * 60 / std::max(30.0, tempo); static const double rate[5] = {1, 2, 4, 8, 16}, glen[4] = {0.25, 0.5, 1, 2};
    const double every = beat * rate[(int)clampd(rnd(v[1]), 0, 4)], gl = std::max(64.0, beat * glen[(int)clampd(rnd(v[2]), 0, 3)]);
    const double mem = std::min((double)(len - 2), v[0] * sr), level = dbToGain(v[8]), mix = v[9] / 100, fb = v[6] / 100 * 0.8, haze = v[5] / 100, lpC = 1 - std::exp(-2 * kPi * (18000 - 16000 * haze) / sr);
    for (int i = 0; i < n; ++i) {
      buf[0][(size_t)w] = (float)(iL[i] + fbL * fb); buf[1][(size_t)w] = (float)(iR[i] + fbR * fb); clock += 1;
      if (clock >= every) { clock -= every; if ((double)filled > gl * 2 && uni() * 100 < v[7]) launch(gl, beat, mem); }
      double a = 0, b = 0;
      for (auto& q : g) if (q.on) { const double pos = q.start + q.dir * q.age * q.rate, env = 0.5 - 0.5 * std::cos(2 * kPi * (q.age / q.len)); a += read(0, pos) * env * q.gl; b += read(1, pos) * env * q.gr; if (++q.age >= q.len) q.on = false; }
      lp[0] += (a - lp[0]) * lpC; lp[1] += (b - lp[1]) * lpC; const double gL = haze > 0.01 ? lp[0] : a, gR = haze > 0.01 ? lp[1] : b; fbL = gL; fbR = gR;
      oL[i] = (float)(iL[i] + gL * level * mix * 2); oR[i] = (float)(iR[i] + gR * level * mix * 2); if (++w >= len) w = 0; if (filled < len) filled += 1;
    }
  }
};
inline std::vector<QS> PS_TRE() { return {Qf("Mode", 0, 2, 0, false, {"Tremolo", "Auto-pan", "Gate"}), Qf("Wave", 0, 6, 0, false, {"Sine", "Triangle", "Square", "Saw up", "Saw down", "Random", "Smooth random"}),
  Qf("Sync", 0, 11, 0, false, {"Free", "4 bar", "2 bar", "1 bar", "1/2", "1/4", "1/8", "1/16", "1/32", "1/4T", "1/8T", "1/16T"}), Qf("Rate", 0.05, 30, 4, true), Qf("Depth", 0, 100, 80), Qf("Phase", 0, 180, 0), Qf("Smooth", 0.1, 200, 4, true), Qf("Steps", 2, 16, 8), Qf("Hits", 0, 16, 3), Qf("Rotate", 0, 15, 0)}; }
inline double hash01(uint32_t a) { a = a ^ (a >> 16); a = a * 0x7feb352du; a = a ^ (a >> 15); a = a * 0x846ca68bu; a = a ^ (a >> 16); return double(a >> 8) / 16777216; }
inline double tshape(int wave, double ph, int steps, long long cycle) {
  switch (wave) {
    case 0: return 0.5 - 0.5 * std::cos(2 * kPi * ph); case 1: return ph < 0.5 ? ph * 2 : 2 - ph * 2; case 2: return ph < 0.5 ? 1 : 0; case 3: return ph; case 4: return 1 - ph;
    default: {
      const double x = ph * steps; const uint32_t i = (uint32_t)((int)x) + (uint32_t)cycle * (uint32_t)steps; const double a = hash01(i * 2654435761u + 17u); if (wave == 5) return a;
      const double b = hash01((i + 1) * 2654435761u + 17u), f = x - std::floor(x), s = 0.5 - 0.5 * std::cos(kPi * f); return a + (b - a) * s; }
  }
}
struct Tremolica : Fxd {
  double phase = 0; long long cycle = 0; double g[2] = {1, 1}, pan = 0;
  Tremolica(double s, const std::vector<QS>& ps) : Fxd(s, ps) {}
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    static const double TCB[12] = {0, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 2.0 / 3, 1.0 / 3, 1.0 / 6};
    const int mode = (int)rnd(v[0]), wave = (int)rnd(v[1]), sync = (int)rnd(v[2]), steps = std::max(2, (int)rnd(v[7])), hits = (int)rnd(v[8]), rot = (int)rnd(v[9]); const double depth = v[4] / 100, offs = v[5] / 360;
    const double cb = TCB[(int)clampd(sync, 0, 11)], inc = cb > 0 ? tempo / 60 / cb / sr : v[3] / sr, a = std::exp(-1 / std::max(1.0, v[6] * 0.001 * sr));
    for (int i = 0; i < n; ++i) {
      phase += inc; if (phase >= 1) { phase -= 1; ++cycle; } const double ph = phase; const long long cyc = cycle;
      if (mode == 1) { const double s = tshape(wave, ph, steps, cyc) * 2 - 1, target = s * depth; pan = target + (pan - target) * a; const double th = (pan + 1) * kPi * 0.25; oL[i] = (float)(iL[i] * std::cos(th) * 1.4142135); oR[i] = (float)(iR[i] * std::sin(th) * 1.4142135); }
      else for (int c = 0; c < 2; ++c) {
        double p = ph + (c ? offs : 0); p -= std::floor(p); double lvl;
        if (mode == 2) { const int k = ((((int)(p * steps) + rot) % steps) + steps) % steps; const double h = clampd(hits, 0, steps); lvl = ((k * h) - steps * std::floor(k * h / steps)) < h ? 1 : 0; } else lvl = tshape(wave, p, steps, cyc);
        const double target = 1 - depth * (1 - lvl); g[c] = target + (g[c] - target) * a; if (c) oR[i] = (float)(iR[i] * g[c]); else oL[i] = (float)(iL[i] * g[c]);
      }
    }
  }
};
inline std::vector<QS> PS_WARM() { return {Qf("Drive", 0, 30, 6), Qf("Character", 0, 2, 0, false, {"Tape", "Tube", "Transformer"}), Qf("Warmth", 0, 100, 30), Qf("Tone", -100, 100, 0), Qf("Tape head cut", 4000, 20000, 16000, true), Qf("Output", -18, 12, 0), Qf("Mix", 0, 100, 100), Qf("Low-mid warmth", 0, 100, 40), Qf("Top smoothing", 0, 100, 30)}; }
inline double lncosh(double u) { const double a = std::fabs(u); return a + std::log1p(std::exp(-2 * a)) - 0.6931472; }
struct Warmica : Fxd {
  Biquad pre[2], post[2], lo[2], hi[2], lmPre[2], lmPost[2], shelf[2]; OP head[2], smooth[2]; OH dc[2]; double xp[2] = {0, 0}, fp[2], gain = 2, slope = 1, bias = 0, biasOut = 0;
  Warmica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { fp[0] = fp[1] = lncosh(0); cfg(); }
  void cfg() override {
    const int ch = (int)clampd(rnd(v[1]), 0, 2); gain = dbToGain(v[0]); bias = ch == 1 ? 0.35 : 0; biasOut = std::tanh(bias); slope = 1 - biasOut * biasOut; const double warm = v[2] * 0.01;
    for (int c = 0; c < 2; ++c) {
      if (ch == 2) { pre[c].set(BQLowShelf, 110, 0.7, 6 * warm + 3, sr); post[c].set(BQLowShelf, 110, 0.7, -(6 * warm + 3), sr); } else { pre[c].set(BQPeak, 1000, 0.7, 0, sr); post[c].set(BQLowShelf, 100, 0.7, ch == 0 ? 3.5 * warm : 1.5 * warm, sr); }
      const double t = v[3] * 0.01 * 4; lo[c].set(BQLowShelf, 700, 0.7, -t, sr); hi[c].set(BQHighShelf, 700, 0.7, t, sr); const double lm = v[7] * 0.01, sm = v[8] * 0.01;
      lmPre[c].set(BQPeak, 280, 0.7, 9 * lm, sr); lmPost[c].set(BQPeak, 280, 0.7, -9 * lm * 0.8, sr); shelf[c].set(BQHighShelf, 5000, 0.6, -9 * sm, sr); smooth[c].set(20000 - 11000 * sm, sr); head[c].set(ch == 0 ? v[4] : 20000, sr); dc[c].set(8, sr);
    }
  }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    const double mix = v[6] * 0.01, outG = dbToGain(v[5]); const double gn = gain, bs = bias;
    for (int i = 0; i < n; ++i) for (int c = 0; c < 2; ++c) {
      const double dry = c ? iR[i] : iL[i]; const double x = lmPre[c].run(pre[c].run(dry)), u = x * gn + bs, d = u - xp[c], f = lncosh(u); double y;
      if (std::fabs(d) < 1e-4) y = std::tanh(0.5 * (u + xp[c])); else y = (f - fp[c]) / d; xp[c] = u; fp[c] = f;
      y = (y - biasOut) / (gn * slope); y = lmPost[c].run(post[c].run(y)); y = dc[c].run(y); y = lo[c].run(hi[c].run(y)); y = head[c].run(y); y = smooth[c].run(shelf[c].run(y));
      const double o = (dry + (y - dry) * mix) * outG; if (c) oR[i] = (float)o; else oL[i] = (float)o;
    }
  }
};
inline std::vector<QS> PS_WID() { return {Qf("Width", 0, 200, 100), Qf("Mid level", -18, 18, 0), Qf("Side level", -18, 18, 0), Qf("Mono below", 20, 500, 20), Qf("Balance", -100, 100, 0)}; }
struct Widica : Fxd {
  double lp1 = 0, lp2 = 0, midG = 1, sideG = 1, lpc = 0, gl = 1, gr = 1; bool monoOn = false;
  Widica(double s, const std::vector<QS>& ps) : Fxd(s, ps) { cfg(); }
  void cfg() override { midG = std::pow(10.0, v[1] / 20); sideG = std::pow(10.0, v[2] / 20) * v[0] * 0.01; monoOn = v[3] > 20.5; lpc = 1 - std::exp(-6.2831853 * v[3] / sr); const double b = v[4] * 0.01; gl = b > 0 ? 1 - b : 1; gr = b < 0 ? 1 + b : 1; }
  void process(const float* iL, const float* iR, float* oL, float* oR, int n) override {
    for (int i = 0; i < n; ++i) { const double l = iL[i], r = iR[i]; const double m = 0.5 * (l + r), s = 0.5 * (l - r); double side = s; if (monoOn) { lp1 += lpc * (s - lp1); lp2 += lpc * (lp1 - lp2); side = s - lp2; } const double mo = m * midG, so = side * sideG; oL[i] = (float)((mo + so) * gl); oR[i] = (float)((mo - so) * gr); }
  }
};
struct FxDef { std::string name; std::vector<QS> ps; std::function<FxPtr(double)> make; };
template <class T> inline FxDef fxd(const char* n, std::vector<QS> ps) { std::vector<QS> p2 = ps; return FxDef{n, ps, [p2](double sr) { return FxPtr(new T(sr, p2)); }}; }
inline const std::vector<FxDef>& FXLIST() {
  static const std::vector<FxDef> L = [] {
    std::vector<FxDef> l = {fxd<Bitsmashica>("Bitsmashica", PS_BIT()), fxd<Bodica>("Bodica", PS_BODY()), fxd<Chorusica>("Chorusica", PS_CHO()), fxd<Compressica>("Compressica", PS_COMP()), fxd<Delayica>("Delayica", PS_DLY()), fxd<EQualica>("EQualica", PS_EQ()), fxd<Flangica>("Flangica", PS_FLA()),
      fxd<Limitica>("Limitica", PS_LIM()), fxd<Noiszical>("Noiszical", PS_NZ()), fxd<Overdrivica>("Overdrivica", PS_OD()), fxd<Phasica>("Phasica", PS_PH()), fxd<Reelica>("Reelica", PS_REEL()), fxd<Resonica>("Resonica", PS_RES()), fxd<Reverbica>("Reverbica", PS_REV()),
      fxd<Rotica>("Rotica", PS_ROT()), fxd<Seancica>("Seancica", PS_SEA()), fxd<Tremolica>("Tremolica", PS_TRE()), fxd<Warmica>("Warmica", PS_WARM()), fxd<Widica>("Widica", PS_WID())};
    auto lc = [](std::string s) { for (auto& c : s) c = (char)std::tolower((unsigned char)c); return s; };
    std::sort(l.begin(), l.end(), [&](const FxDef& a, const FxDef& b) { return lc(a.name) < lc(b.name); });
    return l; }();
  return L;
}
// ---- parameters
constexpr int kGlobal = 18, kSrcN = 16, kFiltN = 6, kSrcBase = kGlobal, kFiltBase = kSrcBase + kSrc * kSrcN, kLinkId = kFiltBase + 2 * kFiltN, kBalId = kLinkId + 1, kEnvBase = kBalId + 1, kLfoBase = kEnvBase + 12,
  kTeslaSpeed = kLfoBase + 10, kTeslaChar = kTeslaSpeed + 1, kSeqRate = kTeslaChar + 1, kSeqLen = kSeqRate + 1, kSeqGlide = kSeqLen + 1, kSeqBase = kSeqGlide + 1, kWireBase = kSeqBase + kSteps, kFxMode = kWireBase + kWires * 4,
  kFxBase = kFxMode + 1, kFxN = 11, kCount = kFxBase + kFx * kFxN, kTempo = kCount;
enum { Preset, Volume, Voices, Mode, Glide, BendRange, Tuning, Tonic, VelSens, Age, Variation, Lever1, Lever2, Lever3, Lever4, Mutate, MutateAmt, MutateScope };
enum { SPType, SPCoarse, SPFine, SPLevel, SPPan, SPShape, SPColour, SPMod, SPTable, SPNoise, SPBody, SPRoute, SPXSrc, SPXAmt, SPXMode, SPTrack };
enum { TEmpty, TAnalog, TFm, TWave, TNoise, TModal, TString, TChaos };
enum { MNone = 0, MEnv2 = 1, MEnv3 = 2, MLfo1 = 3, MLfo2 = 4, MTesla = 5, MSeq = 6, MVel = 7, MKey = 8, MWheel = 9, MPress = 10, MBend = 11, MExpr = 12, MLever1 = 13, MRand = 17, MSpecA = 18, MEnv1 = 22, MOne = 23, kModSrc = 24 };
enum { DPitch = 1, DLevel = 5, DShape = 9, DColour = 13, DMod = 17, DCross = 21, DCut1 = 25, DRes1 = 26, DDrive = 29, DPan = 30, DAmp = 31, DPitchAll = 32, DLfo1 = 33, DTesla = 35, DBal = 36, kDest = 37 };
inline std::vector<std::string> devNames() { std::vector<std::string> r{"Empty rack"}; for (auto& f : FXLIST()) r.push_back(f.name); return r; }
inline int devIdx(const char* nm) { auto d = devNames(); for (size_t i = 0; i < d.size(); ++i) if (d[i] == nm) return (int)i; return -1; }
inline std::vector<Spec> makeSpecs() {
  static const char* PRESET_NAMES[] = {"Init specimen", "Frankenstein's bass", "Tesla coil lead", "Igor's bells", "Reanimation pad", "Bubbling beaker", "Lab accident", "Sitar in the cellar", "Mad wobble", "Gamelan reactor", "Doctor Noise", "Vowel experiment"};
  std::vector<std::string> pn(PRESET_NAMES, PRESET_NAMES + 12);
  std::vector<std::string> MS = {"None", "Env 2", "Env 3", "LFO 1", "LFO 2", "Tesla", "Sequencer", "Velocity", "Key", "Mod wheel", "Aftertouch", "Pitch bend", "Expression", "Lever 1", "Lever 2", "Lever 3", "Lever 4", "Voice random", "Specimen A", "Specimen B", "Specimen C", "Specimen D", "Env 1 (amp)", "Constant"};
  std::vector<std::string> MD = {"None"}; for (const char* g : {"pitch", "level", "shape", "colour", "mod", "cross"}) for (int i = 0; i < 4; ++i) MD.push_back(std::string(1, "ABCD"[i]) + " " + g);
  for (const char* g : {"R1 cutoff", "R1 resonance", "R2 cutoff", "R2 resonance", "Drive", "Pan", "Level", "Pitch (all)", "LFO 1 rate", "LFO 2 rate", "Tesla speed", "Reagent balance"}) MD.push_back(g);
  std::vector<std::string> TUN = {"Equal", "Just intonation", "Pythagorean", "Arabic Rast", "Arabic Bayati", "Indian (shruti)", "Pelog", "Slendro"};
  std::vector<Spec> sp((size_t)kCount + 1, P("", "", 0, 1, 0)); auto at = [&](int i, Spec s) { sp[(size_t)i] = std::move(s); };
  at(0, P("Preset", "", 0, 11, 0, "%.0f", false, pn)); at(1, P("Volume", "dB", -30, 6, -9, "%.1f dB")); at(2, P("Voices", "", 1, 16, 8, "%.0f")); at(3, P("Mode", "", 0, 2, 0, "%.0f", false, {"Poly", "Mono", "Legato mono"}));
  at(4, P("Glide", "s", 0, 2, 0, "%.2f s")); at(5, P("Bend range", "st", 0, 24, 2, "%.0f st")); at(6, P("Tuning", "", 0, 7, 0, "%.0f", false, TUN)); at(7, P("Tonic", "", 0, 11, 0, "%.0f", false, keyNames()));
  at(8, P("Velocity", "", 0, 1, 0.6, "%.2f")); at(9, P("Lab age (tolerance)", "", 0, 1, 0.15, "%.2f")); at(10, P("Variation per note", "", 0, 1, 0, "%.2f"));
  for (int i = 0; i < 4; ++i) at(11 + i, P(("Lever " + std::to_string(i + 1)).c_str(), "", 0, 1, 0, "%.2f"));
  at(15, P("Mutate", "", 0, 1, 0, "%.0f", false, {"Rest", "MUTATE!"})); at(16, P("Mutate amount", "", 0, 1, 0.35, "%.2f")); at(17, P("Mutate scope", "", 0, 3, 0, "%.0f", false, {"Tone (specimens)", "Reagents + envelopes", "Wires (patch matrix)", "Everything but apparatus"}));
  for (int s = 0; s < kSrc; ++s) {
    const std::string a = std::string(1, "ABCD"[s]) + " "; const int b = kSrcBase + s * kSrcN;
    at(b, P((a + "Type").c_str(), "", 0, 7, s == 0 ? 1 : 0, "%.0f", false, {"Empty jar", "Analog", "FM", "Wavetable", "Noise", "Bell body", "String", "Chaos"})); at(b + 1, P((a + "Coarse").c_str(), "st", -36, 36, 0, "%.0f st")); at(b + 2, P((a + "Fine").c_str(), "cents", -100, 100, 0, "%.0f c"));
    at(b + 3, P((a + "Level").c_str(), "", 0, 1, s == 0 ? 0.7 : 0.5, "%.2f")); at(b + 4, P((a + "Pan").c_str(), "", -1, 1, 0, "%.2f")); at(b + 5, P((a + "Shape").c_str(), "", 0, 1, 0, "%.2f")); at(b + 6, P((a + "Colour").c_str(), "", 0, 1, 0.5, "%.2f")); at(b + 7, P((a + "Mod").c_str(), "", 0, 1, 0, "%.2f"));
    at(b + 8, P((a + "Wavetable").c_str(), "", 0, 11, 0, "%.0f", false, tableNames())); at(b + 9, P((a + "Noise").c_str(), "", 0, NTypeCount - 1, 0, "%.0f", false, noiseNames())); at(b + 10, P((a + "Body").c_str(), "", 0, kBodies - 1, 0, "%.0f", false, bodyNames()));
    at(b + 11, P((a + "Route").c_str(), "", 0, 3, 0, "%.0f", false, {"Reagent 1", "Reagent 2", "Both", "Direct"})); at(b + 12, P((a + "Cross source").c_str(), "", 0, 4, 0, "%.0f", false, {"None", "Specimen A", "Specimen B", "Specimen C", "Specimen D"}));
    at(b + 13, P((a + "Cross amount").c_str(), "", 0, 1, 0, "%.2f")); at(b + 14, P((a + "Cross mode").c_str(), "", 0, 4, 0, "%.0f", false, {"Phase mod", "Ring mod", "Amp mod", "Hard sync", "Excite"})); at(b + 15, P((a + "Keyboard tracking").c_str(), "", 0, 1, 1, "%.2f"));
  }
  std::vector<std::string> FT = {"Off", "Ladder 24", "SVF low", "SVF band", "SVF high", "Notch", "Comb +", "Comb -", "Vowel", "Phaser"};
  for (int f = 0; f < 2; ++f) {
    const std::string a = "R" + std::to_string(f + 1) + " "; const int b = kFiltBase + f * kFiltN;
    at(b, P((a + "Type").c_str(), "", 0, 9, f == 0 ? 1 : 0, "%.0f", false, FT)); at(b + 1, P((a + "Cutoff").c_str(), "Hz", 20, 20000, 3000, "%.0f Hz", true)); at(b + 2, P((a + "Resonance").c_str(), "", 0, 1, 0.2, "%.2f")); at(b + 3, P((a + "Drive").c_str(), "", 0, 1, 0.1, "%.2f"));
    at(b + 4, P((a + "Key tracking").c_str(), "", 0, 1, 0.3, "%.2f")); at(b + 5, P((a + "Env 2 amount").c_str(), "", -1, 1, f == 0 ? 0.3 : 0, "%.2f"));
  }
  at(kLinkId, P("Reagent link", "", 0, 1, 0, "%.0f", false, {"Parallel", "Serial"})); at(kBalId, P("Reagent balance", "", 0, 1, 0.5, "%.2f"));
  static const double ED[3][4] = {{0.004, 0.3, 0.8, 0.3}, {0.005, 0.4, 0.3, 0.3}, {0.05, 0.6, 0.5, 0.5}};
  for (int e = 0; e < 3; ++e) {
    const std::string a = "Env " + std::to_string(e + 1) + " "; const int b = kEnvBase + e * 4;
    at(b, P((a + "Attack").c_str(), "s", 0.001, 10, ED[e][0], "%.3f s", true)); at(b + 1, P((a + "Decay").c_str(), "s", 0.005, 10, ED[e][1], "%.3f s", true)); at(b + 2, P((a + "Sustain").c_str(), "", 0, 1, ED[e][2], "%.2f")); at(b + 3, P((a + "Release").c_str(), "s", 0.005, 12, ED[e][3], "%.3f s", true));
  }
  for (int l = 0; l < 2; ++l) {
    const std::string a = "LFO " + std::to_string(l + 1) + " "; const int b = kLfoBase + l * 5;
    at(b, P((a + "Rate").c_str(), "Hz", 0.05, 40, l ? 0.7 : 4, "%.2f Hz", true)); at(b + 1, P((a + "Sync").c_str(), "", 0, 11, 0, "%.0f", false, {"Free", "1 bar", "1/2", "1/4", "1/8", "1/16", "1/32", "1/2 dotted", "1/4 dotted", "1/8 dotted", "1/4 triplet", "1/8 triplet"}));
    at(b + 2, P((a + "Shape").c_str(), "", 0, 5, 0, "%.0f", false, {"Sine", "Triangle", "Saw", "Square", "Sample & hold", "Smooth random"})); at(b + 3, P((a + "Fade in").c_str(), "s", 0, 5, 0, "%.2f s")); at(b + 4, P((a + "Start").c_str(), "", 0, 1, 0, "%.0f", false, {"Random phase", "Restart"}));
  }
  at(kTeslaSpeed, P("Tesla speed", "", 0.05, 200, 3, "%.2f", true)); at(kTeslaChar, P("Tesla character", "", 0, 1, 0.45, "%.2f"));
  at(kSeqRate, P("Seq rate", "", 0, 8, 2, "%.0f", false, {"1/32", "1/16 triplet", "1/16", "1/8 triplet", "1/8", "1/4 triplet", "1/4", "1/2", "1 bar"})); at(kSeqLen, P("Seq length", "", 1, 16, 8, "%.0f")); at(kSeqGlide, P("Seq glide", "", 0, 1, 0, "%.2f"));
  for (int i = 0; i < kSteps; ++i) at(kSeqBase + i, P(("Seq " + std::to_string(i + 1)).c_str(), "", -1, 1, 0, "%.2f"));
  for (int w = 0; w < kWires; ++w) {
    const std::string a = "Wire " + std::to_string(w + 1) + " "; const int b = kWireBase + w * 4;
    at(b, P((a + "Source").c_str(), "", 0, kModSrc - 1, 0, "%.0f", false, MS)); at(b + 1, P((a + "Via").c_str(), "", 0, kModSrc - 1, 0, "%.0f", false, MS)); at(b + 2, P((a + "Destination").c_str(), "", 0, kDest - 1, 0, "%.0f", false, MD)); at(b + 3, P((a + "Amount").c_str(), "", -1, 1, 0, "%.2f"));
  }
  at(kFxMode, P("Apparatus mode", "", 0, 1, 0, "%.0f", false, {"Series", "Parallel"}));
  const auto DN = devNames();
  for (int s = 0; s < kFx; ++s) {
    const std::string a = "App " + std::to_string(s + 1) + " "; const int b = kFxBase + s * kFxN;
    at(b, P((a + "Device").c_str(), "", 0, (double)DN.size() - 1, 0, "%.0f", false, DN)); at(b + 1, P((a + "On").c_str(), "", 0, 1, 1, "%.0f", false, {"Off", "On"})); at(b + 2, P((a + "Page").c_str(), "", 0, 3, 0, "%.0f", false, {"Dials 1-8", "Dials 9-16", "Dials 17-24", "Dials 25-32"}));
    for (int k = 0; k < 8; ++k) at(b + 3 + k, P((a + "Dial " + std::to_string(k + 1)).c_str(), "", 0, 1, 0.5, "%.2f"));
  }
  at(kTempo, P("Tempo", "BPM", 40, 240, 120, "%.0f BPM"));
  return sp;
}
inline const std::vector<Spec>& SPECS() { static const std::vector<Spec> s = makeSpecs(); return s; }
inline std::vector<Group> makeGroups() {
  std::vector<Group> g; auto range = [](int a, int n) { std::vector<int> r; for (int i = 0; i < n; ++i) r.push_back(a + i); return r; };
  g.push_back({"Performance", {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, kTempo}}); g.push_back({"Levers and Mutate", {11, 12, 13, 14, 15, 16, 17}});
  for (int s = 0; s < kSrc; ++s) g.push_back({std::string("Specimen ") + "ABCD"[s], range(kSrcBase + s * kSrcN, kSrcN)});
  { auto r = range(kFiltBase, 12); r.push_back(kLinkId); r.push_back(kBalId); g.push_back({"Reagents (filters)", r}); }
  g.push_back({"Envelopes", range(kEnvBase, 12)}); g.push_back({"LFOs and Tesla", range(kLfoBase, 12)});
  { auto r = std::vector<int>{kSeqRate, kSeqLen, kSeqGlide}; for (int i = 0; i < kSteps; ++i) r.push_back(kSeqBase + i); g.push_back({"Sequencer", r}); }
  for (int q = 0; q < 3; ++q) g.push_back({"Wires " + std::to_string(q * 4 + 1) + "-" + std::to_string(q * 4 + 4), range(kWireBase + q * 16, 16)});
  { auto r = std::vector<int>{kFxMode}; for (int i = 0; i < kFx * kFxN; ++i) r.push_back(kFxBase + i); g.push_back({"Apparatus", r}); }
  return g;
}
inline double dialToPlain(const QS& sp, double nrm) { nrm = clampd(nrm, 0, 1); if (!sp.labels.empty()) return rnd(nrm * (double)(sp.labels.size() - 1)); if (sp.lg && sp.mn > 0 && sp.mx > 0) return sp.mn * std::pow(sp.mx / sp.mn, nrm); return sp.mn + nrm * (sp.mx - sp.mn); }
inline double plainToDial(const QS& sp, double p) { if (!sp.labels.empty()) return sp.labels.size() > 1 ? clampd(p, 0, (double)sp.labels.size() - 1) / (double)(sp.labels.size() - 1) : 0; if (sp.lg && sp.mn > 0 && sp.mx > 0) return clampd(std::log(std::max(p, sp.mn) / sp.mn) / std::log(sp.mx / sp.mn), 0, 1); return sp.mx == sp.mn ? 0 : clampd((p - sp.mn) / (sp.mx - sp.mn), 0, 1); }
static const double TUNE_CENTS[8][12] = {{0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100}, {0, 111.7, 203.9, 315.6, 386.3, 498.0, 590.2, 702.0, 813.7, 884.4, 996.1, 1088.3}, {0, 90.2, 203.9, 294.1, 407.8, 498.0, 611.7, 702.0, 792.2, 905.9, 996.1, 1109.8},
  {0, 100, 200, 250, 350, 500, 600, 700, 800, 900, 950, 1050}, {0, 100, 150, 300, 400, 500, 600, 700, 800, 900, 1000, 1100}, {0, 90.2, 203.9, 294.1, 386.3, 498.0, 590.2, 702.0, 792.2, 884.4, 996.1, 1088.3},
  {0, 60, 120, 195, 270, 405, 540, 670, 727, 785, 868, 950}, {0, 115, 231, 352, 474, 595, 717, 836, 955, 1075, 1138, 1169}};
static const double VF[5][3] = {{800, 1150, 2900}, {400, 1600, 2700}, {270, 2300, 3000}, {450, 800, 2830}, {325, 700, 2530}};
static const double LFO_BEATS[12] = {0, 4, 2, 1, 0.5, 0.25, 0.125, 3, 1.5, 0.75, 2.0 / 3, 1.0 / 3}, SEQ_BEATS[9] = {0.125, 1.0 / 6, 0.25, 1.0 / 3, 0.5, 2.0 / 3, 1, 2, 4};
static const double IV[9] = {-12, -7, -5, 0, 0, 5, 7, 12, 19};
// ---- voice state
struct Filt {
  Ladder lad[2]; Svf svf[2][3]; DelayLine comb[2]; double apz[2][5] = {}, apc = 0, fb = 0, combD = 100, vg[3] = {1, 1, 1}; int type = 0; double sr;
  explicit Filt(double s) : comb{DelayLine((long long)(s / 15)), DelayLine((long long)(s / 15))}, sr(s) {}
  void clearState() { for (auto& l : lad) l.reset(); for (auto& a : svf) for (auto& s : a) s.reset(); for (int c = 0; c < 2; ++c) { comb[c].clear(); for (double& x : apz[c]) x = 0; } }
  void setup(int t, double hz, double res, double drv) {
    type = t; hz = clampd(hz, 16, std::min(20000.0, sr * 0.45));
    switch (t) {
      case 1: lad[0].set(hz, res, sr, 1 + drv * 4); lad[1].set(hz, res, sr, 1 + drv * 4); break;
      case 2: case 3: case 4: case 5: { const double q = 0.55 + res * res * 18; for (int c = 0; c < 2; ++c) svf[c][0].set(hz, q, sr); break; }
      case 6: case 7: combD = clampd(sr / hz, 4, (double)(comb[0].mask - 8)); fb = (t == 6 ? 1 : -1) * std::min(res, 0.99) * 0.96; break;
      case 8: { const double p = clampd(std::log(hz / 40) / std::log(12000.0 / 40), 0, 1) * 3.999; const int i = (int)p; const double f = p - i, q = 4 + res * 12; for (int c = 0; c < 2; ++c) for (int j = 0; j < 3; ++j) svf[c][j].set(VF[i][j] + (VF[i + 1][j] - VF[i][j]) * f, q, sr); vg[0] = 1; vg[1] = 0.7; vg[2] = 0.45; break; }
      case 9: { const double g = std::tan(kPi * hz / sr); apc = (g - 1) / (g + 1); fb = res * 0.85; break; }
    }
  }
  double run(int c, double x) {
    switch (type) {
      case 1: return lad[c].run(x);
      case 2: return svf[c][0].run(x);
      case 3: { Svf& s = svf[c][0]; s.run(x); return s.band * 1.4; }
      case 4: { Svf& s = svf[c][0]; s.run(x); return s.high; }
      case 5: { Svf& s = svf[c][0]; s.run(x); return s.low + s.high; }
      case 6: case 7: { const double d = comb[c].read(combD), y = x + fb * d; comb[c].push(fastTanh(y)); return y * 0.6; }
      case 8: { double y = 0; for (int j = 0; j < 3; ++j) { Svf& s = svf[c][j]; s.run(x); y += s.band * vg[j]; } return y * 1.2; }
      case 9: { double* z = apz[c]; double s = fastTanh(x + fb * z[4]); for (int k = 0; k < 4; ++k) { const double y = apc * s + z[k]; z[k] = s - apc * y; s = y; } z[4] = s; return 0.5 * (x + s); }
      default: return x;
    }
  }
};
struct Src {
  double ph = 0, ph2 = 0, ph3 = 0, mph = 0, fbz = 0, out = 0; bool wrapped = false; double lx = 1, ly = 1, lz = 1; Svf tune; NoiseSrc ns; double y1[10] = {}, y2[10] = {}, strike = 0, strikeLen = 1, strikeAmp = 0, burstLp = 0; DelayLine dl; double lpz = 0;
  Noise rng; double centsOff = 0, held = 0; long long holdCnt = 0; double vr[3] = {0, 0, 0}; int nm = 0; double mc1[10] = {}, mc2[10] = {}, mamp[10] = {}, sg = 0.99, sa = 0.5, sd = 100;
  Src(double sr, int seed, int i) : dl((long long)(sr / 15)), rng((uint32_t)seed * 104729u + (uint32_t)i * 977u + 5u) { ns.init(sr, seed * 31 + i); }
};
struct Voice {
  bool gate = false; Adsr e1, e2, e3; double note = 60, cur = 60, target = 60, vel = 1; long long age = 0; double rnd_ = 0; Noise rng; std::vector<Src> s; std::vector<Filt> f;
  double lfoPh[2] = {0, 0}, lfoHeld[2] = {0, 0}, lfoSm[2] = {0, 0}, lfoT[2] = {0, 0}, lx = 1, ly = 1, lz = 1, seqT = 0;
  double dCur[kDest] = {}, dPrev[kDest] = {}, semisCur[4] = {}, semisPrev[4] = {}, lvlCur[4] = {}, lvlPrev[4] = {}, shp[4] = {}, col[4] = {}, mdv[4] = {}, xam[4] = {}, gl[4] = {}, gr[4] = {};
  double ageCut = 0, ageTime = 1, ampCur = 0, ampPrev = 0, e2v = 0, e3v = 0, e1v = 0, balG1 = 1, balG2 = 1, panG[2] = {1, 1}; int tick = 0; double mod[kModSrc] = {};
  Voice(double sr, int seed) : rng((uint32_t)seed * 7919u + 1u) {
    for (int i = 0; i < kSrc; ++i) s.emplace_back(sr, seed, i); f.emplace_back(sr); f.emplace_back(sr);
    e1.setSr(sr); e2.setSr(sr); e3.setSr(sr); kill();
  }
  bool alive() const { return gate || e1.active(); }
  void release() { if (gate) { gate = false; e1.gateOff(); e2.gateOff(); e3.gateOff(); } }
  void kill() { gate = false; e1.kill(); e2.kill(); e3.kill(); ampPrev = ampCur = 0; }
};
inline double panL(double p) { return std::cos((p * 0.5 + 0.5) * kPi * 0.5); }
inline double panR(double p) { return std::sin((p * 0.5 + 0.5) * kPi * 0.5); }
inline bool isBipolar(int s) { return s == MLfo1 || s == MLfo2 || s == MTesla || s == MSeq || s == MBend || s == MRand || s == MKey || (s >= MSpecA && s <= MSpecA + 3); }
inline double oscWave(double ph, double pm, double dt, double pw, double shape) {
  ph += pm; ph -= std::floor(ph); const double sw = 2 * ph - 1 - polyBlep(ph, dt); double sq = ph < pw ? 1 : -1; sq += polyBlep(ph, dt); double t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; sq -= polyBlep(t2, dt);
  const double tri = 4 * std::fabs(ph - 0.5) - 1, sn = fsin(ph), p3 = shape * 3; if (p3 < 1) return sw + (sq * 0.8 - sw) * p3; if (p3 < 2) return sq * 0.8 + (tri - sq * 0.8) * (p3 - 1); return tri + (sn - tri) * (p3 - 2);
}
struct PE { const char* k; double v; };
inline const std::vector<std::vector<PE>>& PRESETS() {
  static const std::vector<std::vector<PE>> P_ = [] {
    const double DRev = devIdx("Reverbica"), DDel = devIdx("Delayica"), DSea = devIdx("Seancica"), DBod = devIdx("Bodica"), DBit = devIdx("Bitsmashica"), DRes = devIdx("Resonica"), DRee = devIdx("Reelica"), DNoi = devIdx("Noiszical");
    return std::vector<std::vector<PE>>{
    {},
    {{"A Type", 1}, {"A Coarse", -12}, {"A Shape", 0}, {"A Level", 0.7}, {"B Type", 1}, {"B Coarse", -12}, {"B Fine", 9}, {"B Shape", 0.33}, {"B Colour", 0.35}, {"B Level", 0.6}, {"C Type", 1}, {"C Coarse", -24}, {"C Shape", 1}, {"C Level", 0.5}, {"C Route", 3}, {"R1 Cutoff", 420}, {"R1 Resonance", 0.35}, {"R1 Drive", 0.5}, {"R1 Env 2 amount", 0.6}, {"Env 2 Decay", 0.35}, {"Env 2 Sustain", 0.15}, {"Env 1 Release", 0.2}, {"Mode", 2}, {"Glide", 0.12}, {"Voices", 1}},
    {{"A Type", 2}, {"A Colour", 0.58}, {"A Shape", 0.35}, {"A Mod", 0.2}, {"A Level", 0.5}, {"B Type", 3}, {"B Wavetable", 10}, {"B Shape", 0.5}, {"B Level", 0.5}, {"B Cross source", 1}, {"B Cross mode", 3}, {"B Cross amount", 0.5}, {"R1 Cutoff", 6000}, {"R1 Key tracking", 0.7},
     {"Wire 1 Source", 4}, {"Wire 1 Destination", 10}, {"Wire 1 Amount", 0.3}, {"Wire 2 Source", 6}, {"Wire 2 Destination", 14}, {"Wire 2 Amount", 0.25}, {"LFO 1 Rate", 5.5}, {"Wire 3 Source", 4}, {"Wire 3 Destination", 1}, {"Wire 3 Amount", 0.02}, {"Wire 3 Via", 10}, {"Mode", 2}, {"Voices", 1}},
    {{"A Type", 2}, {"A Colour", 0.75}, {"A Shape", 0.3}, {"A Level", 0.5}, {"B Type", 5}, {"B Body", 2}, {"B Level", 0.7}, {"B Shape", 0.7}, {"B Mod", 0.8}, {"B Cross source", 1}, {"B Cross mode", 4}, {"B Cross amount", 0.5}, {"A Route", 3}, {"B Route", 2}, {"Env 1 Attack", 0.001}, {"Env 1 Decay", 1.2}, {"Env 1 Sustain", 0},
     {"Env 1 Release", 2.5}, {"R1 Type", 1}, {"R1 Cutoff", 9000}, {"App 1 Device", DRev}},
    {{"A Type", 3}, {"A Wavetable", 6}, {"A Shape", 0.35}, {"A Mod", 0}, {"B Type", 1}, {"B Coarse", 0}, {"B Fine", 12}, {"B Mod", 0.4}, {"B Shape", 0.05}, {"B Level", 0.35}, {"Env 1 Attack", 1.2}, {"Env 1 Release", 2.5}, {"R1 Cutoff", 2400}, {"R1 Env 2 amount", 0}, {"Wire 1 Source", 4}, {"Wire 1 Destination", 10}, {"Wire 1 Amount", 0.5},
     {"LFO 2 Rate", 0.18}, {"Lab age (tolerance)", 0.5}, {"App 1 Device", DDel}, {"App 2 Device", DSea}},
    {{"A Type", 4}, {"A Noise", 1}, {"A Colour", 0.9}, {"A Level", 1.0}, {"B Type", 4}, {"B Noise", 18}, {"B Colour", 0.8}, {"B Shape", 0.4}, {"B Level", 0.8}, {"Env 1 Decay", 0.25}, {"Env 1 Sustain", 0.3}, {"Wire 1 Source", 6}, {"Wire 1 Destination", 1}, {"Wire 1 Amount", 0.5}, {"Wire 2 Source", 6}, {"Wire 2 Destination", 2}, {"Wire 2 Amount", 0.25},
     {"Seq rate", 2}, {"Seq length", 8}, {"Seq 1", 0}, {"Seq 2", 0.33}, {"Seq 3", 0.58}, {"Seq 4", 0.25}, {"Seq 5", 0.75}, {"Seq 6", 0.5}, {"Seq 7", 0.17}, {"Seq 8", 0.42}, {"App 1 Device", DBod}},
    {{"A Type", 2}, {"A Shape", 0.7}, {"A Mod", 0.8}, {"A Colour", 0.4}, {"B Type", 7}, {"B Shape", 0.6}, {"B Mod", 0.5}, {"B Colour", 0.9}, {"B Coarse", 7}, {"B Cross source", 1}, {"B Cross amount", 0.4}, {"A Cross source", 2}, {"A Cross amount", 0.3}, {"A Cross mode", 1},
     {"R1 Type", 8}, {"Wire 1 Source", 5}, {"Wire 1 Destination", 25}, {"Wire 1 Amount", 0.6}, {"Wire 2 Source", 5}, {"Wire 2 Destination", 10}, {"Wire 2 Amount", 0.4}, {"Wire 3 Source", 5}, {"Wire 3 Destination", 5}, {"Wire 3 Amount", 0.3}, {"Tesla speed", 6}, {"App 1 Device", DBit}},
    {{"A Type", 6}, {"A Shape", 0.55}, {"A Colour", 0.55}, {"A Mod", 0.6}, {"A Level", 0.8}, {"B Type", 5}, {"B Body", 3}, {"B Level", 0.5}, {"B Shape", 0.8}, {"B Cross source", 1}, {"B Cross mode", 4}, {"B Cross amount", 0.45}, {"Tuning", 3}, {"Tonic", 2}, {"Env 1 Attack", 0.002}, {"Env 1 Sustain", 0.9}, {"Env 1 Release", 1.5}, {"R1 Cutoff", 8000},
     {"App 1 Device", DRes}},
    {{"A Type", 1}, {"A Shape", 0}, {"B Type", 1}, {"B Fine", 8}, {"R1 Cutoff", 280}, {"R1 Resonance", 0.55}, {"R1 Drive", 0.4}, {"R1 Env 2 amount", 0}, {"LFO 1 Sync", 4}, {"LFO 1 Shape", 0}, {"Wire 1 Source", 4}, {"Wire 1 Destination", 25}, {"Wire 1 Amount", 0.75}, {"Wire 2 Source", 15}, {"Wire 2 Destination", 25}, {"Wire 2 Amount", 0.5}, {"Mode", 1}, {"A Coarse", -12}, {"B Coarse", -12}},
    {{"A Type", 5}, {"A Body", 8}, {"A Shape", 0.7}, {"A Mod", 0.7}, {"A Level", 0.8}, {"B Type", 5}, {"B Body", 7}, {"B Coarse", 7}, {"B Level", 0.4}, {"Tuning", 7}, {"Env 1 Release", 3}, {"App 1 Device", DRee}},
    {{"A Type", 4}, {"A Noise", 0}, {"A Colour", 0.6}, {"A Level", 0.8}, {"R1 Type", 3}, {"R1 Cutoff", 400}, {"R1 Resonance", 0.8}, {"R1 Env 2 amount", 0.7}, {"Env 2 Attack", 0.4}, {"Env 2 Decay", 0.8}, {"Env 1 Sustain", 0.9}, {"Wire 1 Source", 3}, {"Wire 1 Destination", 25}, {"Wire 1 Amount", 0.3}, {"LFO 1 Rate", 0.3}, {"App 1 Device", DNoi}},
    {{"A Type", 3}, {"A Wavetable", 2}, {"A Shape", 0.1}, {"A Level", 0.75}, {"Env 1 Attack", 0.05}, {"Env 1 Release", 0.6}, {"Wire 1 Source", 13}, {"Wire 1 Destination", 9}, {"Wire 1 Amount", 1}, {"Wire 2 Source", 4}, {"Wire 2 Destination", 9}, {"Wire 2 Amount", 0.15}, {"LFO 2 Rate", 0.4}, {"R1 Type", 8}, {"R1 Cutoff", 600}, {"Voices", 8}}};
  }();
  return P_;
}
struct Engine : EngineBase {
  static constexpr int BS = 512;
  const std::vector<Spec>& specs; std::vector<Voice> voice; std::vector<int> held; int lastNote = -1; double bend = 0, mod = 0, press = 0, expr = 1; uint32_t mrng = 0; long long cnt = 0;
  FxPtr fx[3]; int fxType[3] = {-1, -1, -1}; float accL[BS], accR[BS], tmpL[BS], tmpR[BS], sumL[BS], sumR[BS]; double dT[kDest]; int cType[4], cRoute[4], cX[4], cXM[4], cTab[4], cNz[4], cBody[4]; bool wr[4] = {false, false, false, false};
  explicit Engine(double s) : EngineBase(s), specs(SPECS()) {
    initParams(specs); voice.reserve(kVoices); for (int i = 0; i < kVoices; ++i) voice.emplace_back(s, i + 1);
    for (int i = 0; i < BS; ++i) accL[i] = accR[i] = tmpL[i] = tmpR[i] = sumL[i] = sumR[i] = 0.f;
    for (double& d : dT) d = 0; for (int i = 0; i < 4; ++i) cType[i] = cRoute[i] = cX[i] = cXM[i] = cTab[i] = cNz[i] = cBody[i] = 0;
  }
  double tunedSemis(int note) {
    const int t = (int)clampd(rnd(v[Tuning]), 0, 7), tonic = (int)clampd(rnd(v[Tonic]), 0, 11), rel = note - tonic; const int oct = (int)std::floor(rel / 12.0), pc = rel - oct * 12; return tonic + oct * 12 + TUNE_CENTS[t][pc] * 0.01;
  }
  // ---- parameter changes
  void set(int id, double x) override {
    if (id < 0 || id > kCount) return; const double old = v[(size_t)id]; v[(size_t)id] = x;
    if (id == Preset) { loadPreset((int)rnd(x)); return; }
    if (id == Mutate) { if (x >= 0.5 && old < 0.5) { mutate(); writeParam(Mutate, 0); v[Mutate] = 0; } return; }
    if (id >= kFxBase && id < kCount) { const int s = (id - kFxBase) / kFxN, r = (id - kFxBase) % kFxN; if (r == 0) setDevice(s, (int)rnd(x)); else if (r == 2) applyFxPage(s); else if (r >= 3) applyDial(s, r - 3); }
  }
  void setDevice(int s, int idx) {
    const int type = idx - 1; if (type == fxType[s] && fx[s]) return; fx[s].reset(); fxType[s] = -1; if (type < 0 || type >= (int)FXLIST().size()) return;
    const FxDef& d = FXLIST()[(size_t)type]; fx[s] = d.make(sr); fxType[s] = type; const auto& ps = d.ps; for (size_t i = 0; i < ps.size(); ++i) fx[s]->set((int)i, ps[i].def);
    const int page = (int)clampd(rnd(v[(size_t)(kFxBase + s * kFxN + 2)]), 0, 3);
    for (int k = 0; k < 8; ++k) { const int pi = page * 8 + k; if (pi < (int)ps.size()) { const double nrm = plainToDial(ps[(size_t)pi], ps[(size_t)pi].def); v[(size_t)(kFxBase + s * kFxN + 3 + k)] = nrm; writeParam(kFxBase + s * kFxN + 3 + k, nrm); } }
  }
  void applyDial(int s, int k) {
    if (!fx[s] || fxType[s] < 0) return; const auto& ps = FXLIST()[(size_t)fxType[s]].ps; const int page = (int)clampd(rnd(v[(size_t)(kFxBase + s * kFxN + 2)]), 0, 3), pi = page * 8 + k;
    if (pi < (int)ps.size()) fx[s]->set(pi, dialToPlain(ps[(size_t)pi], v[(size_t)(kFxBase + s * kFxN + 3 + k)]));
  }
  void applyFxPage(int s) {
    if (!fx[s] || fxType[s] < 0) return; const auto& ps = FXLIST()[(size_t)fxType[s]].ps; const int page = (int)clampd(rnd(v[(size_t)(kFxBase + s * kFxN + 2)]), 0, 3);
    for (int k = 0; k < 8; ++k) { const int pi = page * 8 + k; if (pi < (int)ps.size()) { const double nrm = plainToDial(ps[(size_t)pi], ps[(size_t)pi].def); v[(size_t)(kFxBase + s * kFxN + 3 + k)] = nrm; writeParam(kFxBase + s * kFxN + 3 + k, nrm); fx[s]->set(pi, ps[(size_t)pi].def); } }
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; } void pressure(double p) override { press = p; }
  void allNotesOff() override { held.clear(); for (auto& x : voice) x.release(); }
  // ---- notes
  void noteOn(int note, double vel) override {
    held.erase(std::remove(held.begin(), held.end(), note), held.end()); held.push_back(note);
    const int mode = (int)rnd(v[Mode]), maxV = (int)clampd(rnd(v[Voices]), 1, kVoices); const double tuned = tunedSemis(note) + noteTune * 0.01; const bool glide = v[Glide] > 0.001 && lastNote >= 0;
    if (mode != 0) {
      for (int i = 1; i < kVoices; ++i) if (voice[(size_t)i].gate) voice[(size_t)i].release();
      Voice& x = voice[0]; const bool legato = mode == 2 && x.gate; x.target = tuned; x.note = note; x.vel = vel;
      if (!legato) startVoice(x, note, vel, tuned, glide && x.alive()); else if (!glide) x.cur = tuned; lastNote = note; return;
    }
    int pick = -1; for (int i = 0; i < maxV; ++i) if (!voice[(size_t)i].alive()) { pick = i; break; }
    if (pick < 0) { double old = 1e300; for (int i = 0; i < maxV; ++i) if ((double)voice[(size_t)i].age < old) { old = (double)voice[(size_t)i].age; pick = i; } }
    for (int i = maxV; i < kVoices; ++i) if (voice[(size_t)i].gate) voice[(size_t)i].release();
    startVoice(voice[(size_t)pick], note, vel, tuned, false); lastNote = note;
  }
  void noteOff(int note) override {
    const bool wasLast = !held.empty() && held.back() == note; held.erase(std::remove(held.begin(), held.end(), note), held.end()); const int mode = (int)rnd(v[Mode]);
    if (mode != 0) {
      Voice& x = voice[0];
      if (!held.empty() && wasLast && x.gate) { const int n = held.back(); x.target = tunedSemis(n); x.note = n; if (mode == 1) startVoice(x, n, x.vel, x.target, v[Glide] > 0.001); lastNote = n; }
      else if (held.empty()) x.release();
      return;
    }
    for (auto& x : voice) if (x.gate && x.note == note) x.release();
  }
  void startVoice(Voice& x, int note, double vel, double tuned, bool glide) {
    x.gate = true; x.note = note; x.vel = vel; x.age = ++cnt; x.target = tuned; if (!glide) x.cur = tuned; x.rnd_ = x.rng.white();
    const double age = v[Age]; x.ageCut = x.rng.white() * age * 0.15; x.ageTime = 1 + x.rng.white() * age * 0.12; const double t = x.ageTime; const int e = kEnvBase;
    x.e1.set(v[(size_t)e] * t, v[(size_t)e + 1] * t, v[(size_t)e + 2], v[(size_t)e + 3] * t); x.e2.set(v[(size_t)e + 4] * t, v[(size_t)e + 5] * t, v[(size_t)e + 6], v[(size_t)e + 7] * t); x.e3.set(v[(size_t)e + 8] * t, v[(size_t)e + 9] * t, v[(size_t)e + 10], v[(size_t)e + 11] * t);
    x.e1.gateOn(true); x.e2.gateOn(true); x.e3.gateOn(true); x.e1v = x.e2v = x.e3v = 0;
    for (int l = 0; l < 2; ++l) { const bool restart = v[(size_t)(kLfoBase + l * 5 + 4)] > 0.5; x.lfoPh[l] = restart ? 0 : (x.rng.white() * 0.5 + 0.5); x.lfoHeld[l] = x.rng.white(); x.lfoSm[l] = x.lfoHeld[l]; x.lfoT[l] = 0; }
    x.lx = 1 + x.rng.white() * 0.5; x.ly = 1 + x.rng.white() * 0.5; x.lz = 10 + x.rng.white() * 5; x.seqT = 0; x.tick = 0; x.ampPrev = x.ampCur = 0; for (auto& f : x.f) f.clearState();
    const double varAmt = v[Variation];
    for (int s = 0; s < kSrc; ++s) {
      Src& r = x.s[(size_t)s]; const int b = kSrcBase + s * kSrcN; r.centsOff = r.rng.white() * age * 8; for (int k = 0; k < 3; ++k) r.vr[k] = r.rng.white() * varAmt * 0.25;
      const double p0 = (age > 0.001 || varAmt > 0.001) ? r.rng.white() * 0.5 + 0.5 : 0; r.ph = p0; r.ph2 = p0 + 0.33; r.ph3 = p0 + 0.66; r.mph = 0; r.fbz = 0; r.out = 0; r.lx = 1 + r.rng.white() * 0.3; r.ly = 1; r.lz = 1; r.lpz = 0; r.tune.reset();
      for (int k = 0; k < 10; ++k) r.y1[k] = r.y2[k] = 0; r.dl.clear(); r.burstLp = 0; const int type = (int)rnd(v[(size_t)(b + SPType)]);
      if (type == TModal) { const double hard = v[(size_t)(b + SPMod)]; r.strikeLen = 24 + (double)(int)((1 - hard) * 220); r.strike = r.strikeLen; r.strikeAmp = 0.35 * (0.4 + 0.6 * vel); }
      else if (type == TString) { const double hz = midiHz(tuned); r.strikeLen = (double)std::max(8, (int)(sr / std::max(20.0, hz))); r.strike = r.strikeLen; r.strikeAmp = 0.8 * (0.4 + 0.6 * vel); } else r.strike = 0;
    }
  }
  // ---- control rate
  void controlTick(Voice& x) {
    const std::vector<double>& V = v; const double tdt = kTick / sr, bps = V[(size_t)kTempo] / 60; double* md = x.mod;
    for (int l = 0; l < 2; ++l) {
      const int b = kLfoBase + l * 5, sync = (int)rnd(V[(size_t)b + 1]); double hz = sync == 0 ? V[(size_t)b] : bps / LFO_BEATS[(int)clampd(sync, 1, 11)]; hz *= std::pow(2.0, x.dPrev[DLfo1 + l] * 3);
      x.lfoPh[l] += hz * tdt; bool wrap = false; if (x.lfoPh[l] >= 1) { x.lfoPh[l] -= std::floor(x.lfoPh[l]); wrap = true; } x.lfoT[l] += tdt; const int shape = (int)rnd(V[(size_t)b + 2]); if (wrap) x.lfoHeld[l] = x.rng.white(); double o; const double ph = x.lfoPh[l];
      switch (shape) { case 0: o = std::sin(PI2 * ph); break; case 1: o = 4 * std::fabs(ph - 0.5) - 1; break; case 2: o = 2 * ph - 1; break; case 3: o = ph < 0.5 ? 1 : -1; break; case 4: o = x.lfoHeld[l]; break; default: x.lfoSm[l] += (x.lfoHeld[l] - x.lfoSm[l]) * std::min(1.0, hz * tdt * 6); o = x.lfoSm[l]; }
      const double fade = V[(size_t)b + 3]; md[MLfo1 + l] = o * (fade > 0.001 ? std::min(1.0, x.lfoT[l] / fade) : 1);
    }
    {
      const double rho = 12 + 48 * V[(size_t)kTeslaChar], spd = V[(size_t)kTeslaSpeed] * std::pow(2.0, x.dPrev[DTesla] * 3); double h = spd * tdt; const int steps = std::max(1, std::min(20, (int)(h / 0.01) + 1)); h /= steps;
      for (int k = 0; k < steps; ++k) { const double dx = 10 * (x.ly - x.lx), dy = x.lx * (rho - x.lz) - x.ly, dz = x.lx * x.ly - 2.6667 * x.lz; x.lx += dx * h; x.ly += dy * h; x.lz += dz * h; }
      if (!std::isfinite(x.lx + x.ly + x.lz) || std::fabs(x.lx) > 200) { x.lx = 1; x.ly = 1; x.lz = 10; } md[MTesla] = clampd(x.lx / 20, -1, 1);
    }
    {
      const double stepBeats = SEQ_BEATS[(int)clampd(rnd(V[(size_t)kSeqRate]), 0, 8)]; x.seqT += bps * tdt / stepBeats; const int len = (int)clampd(rnd(V[(size_t)kSeqLen]), 1, kSteps); const long long fl = (long long)std::floor(x.seqT); const int idx = (int)(fl % len); const double fr = x.seqT - std::floor(x.seqT);
      const double cur = V[(size_t)(kSeqBase + idx)], prev = V[(size_t)(kSeqBase + (idx + len - 1) % len)], g = V[(size_t)kSeqGlide], t = g <= 0.001 ? 1 : std::min(1.0, fr / g), sm = t * t * (3 - 2 * t); md[MSeq] = prev + (cur - prev) * sm; if (x.seqT > 1e6) x.seqT = 0;
    }
    md[MEnv2] = x.e2v; md[MEnv3] = x.e3v; md[MEnv1] = x.e1v; md[MVel] = x.vel; md[MKey] = clampd((x.note - 60) / 36, -1, 1); md[MWheel] = mod; md[MPress] = press; md[MBend] = bend; md[MExpr] = expr;
    for (int i = 0; i < 4; ++i) md[MLever1 + i] = V[(size_t)(Lever1 + i)]; md[MRand] = x.rnd_; for (int s = 0; s < kSrc; ++s) md[MSpecA + s] = x.s[(size_t)s].out; md[MOne] = 1;
    for (int i = 0; i < kDest; ++i) x.dPrev[i] = x.dCur[i]; double* d = dT; for (int i = 0; i < kDest; ++i) d[i] = 0;
    for (int w = 0; w < kWires; ++w) {
      const int b = kWireBase + w * 4, dst = (int)rnd(V[(size_t)b + 2]); const double amt = V[(size_t)b + 3]; if (dst <= 0 || dst >= kDest || amt == 0) continue; const int src = (int)rnd(V[(size_t)b]); if (src <= 0 || src >= kModSrc) continue;
      double xx = md[src]; const int via = (int)rnd(V[(size_t)b + 1]); if (via > 0 && via < kModSrc) { double m = md[via]; if (isBipolar(via)) m = m * 0.5 + 0.5; xx *= clampd(m, 0, 1); } d[dst] += xx * amt;
    }
    for (int i = 0; i < kDest; ++i) x.dCur[i] = d[i]; const double vs = V[VelSens], velScale = 1 - vs + vs * x.vel;
    for (int s = 0; s < kSrc; ++s) {
      const int b = kSrcBase + s * kSrcN; Src& r = x.s[(size_t)s]; x.semisPrev[s] = x.semisCur[s]; x.lvlPrev[s] = x.lvlCur[s]; const double track = V[(size_t)(b + SPTrack)], key = x.cur + bend * V[BendRange], base = 60 + (key - 60) * track;
      x.semisCur[s] = base + V[(size_t)(b + SPCoarse)] + (V[(size_t)(b + SPFine)] + r.centsOff) * 0.01 + d[DPitch + s] * 24 + d[DPitchAll] * 24; x.lvlCur[s] = clampd(V[(size_t)(b + SPLevel)] + d[DLevel + s], 0, 1.5);
      x.shp[s] = clampd(V[(size_t)(b + SPShape)] + d[DShape + s] + r.vr[0], 0, 1); x.col[s] = clampd(V[(size_t)(b + SPColour)] + d[DColour + s] + r.vr[1], 0, 1); x.mdv[s] = clampd(V[(size_t)(b + SPMod)] + d[DMod + s] + r.vr[2], 0, 1);
      x.xam[s] = clampd(V[(size_t)(b + SPXAmt)] + d[DCross + s], 0, 1); const double pan = clampd(V[(size_t)(b + SPPan)], -1, 1); x.gl[s] = panL(pan); x.gr[s] = panR(pan);
    }
    for (int f = 0; f < 2; ++f) {
      const int b = kFiltBase + f * kFiltN; const double oct = x.e2v * V[(size_t)b + 5] * 5 + (x.note - 60) / 12 * V[(size_t)b + 4] + d[DCut1 + f * 2] * 5 + x.ageCut, hz = V[(size_t)b + 1] * std::pow(2.0, oct), res = clampd(V[(size_t)b + 2] + d[DRes1 + f * 2], 0, 1.1);
      x.f[(size_t)f].setup((int)rnd(V[(size_t)b]), hz, res, clampd(V[(size_t)b + 3] + d[DDrive] * 0.5, 0, 1));
    }
    const double bal = clampd(V[(size_t)kBalId] + d[DBal], 0, 1); x.balG1 = std::min(1.0, 2 * (1 - bal)); x.balG2 = std::min(1.0, 2 * bal); const double pan = clampd(d[DPan], -1, 1); x.panG[0] = panL(pan) * 1.414; x.panG[1] = panR(pan) * 1.414;
    x.ampPrev = x.ampCur; x.ampCur = std::max(0.0, 1 + d[DAmp]) * velScale;
    for (int s = 0; s < kSrc; ++s) { const int t = cType[s]; if (t != TModal && t != TString) continue; const double hz = std::min(midiHz(x.semisPrev[s]), sr * 0.45); Src& r = x.s[(size_t)s]; if (t == TModal) modalCoef(r, hz, x.shp[s], x.col[s], cBody[s]); else stringCoef(r, hz, x.shp[s], x.col[s]); }
  }
  void modalCoef(Src& r, double hz, double shape, double colour, int bi) {
    const Body& body = BODY[bi]; const double bright = 0.4 + clampd(shape, 0, 1) * 1.2, dscale = 0.25 * std::pow(16.0, clampd(colour, 0, 1)), hzM = clampd(hz, 1, sr * 0.45); int n = 0;
    for (int k = 0; k < body.n; ++k) {
      const double f = hzM * body.ratio[k]; if (f > sr * 0.45) break; const double t60 = std::max(0.002, body.t60[k] * dscale), rr = std::min(0.99995, std::exp(-6.9078 / (t60 * sr))), th = 2 * kPi * f / sr;
      r.mc1[k] = 2 * rr * std::cos(th); r.mc2[k] = rr * rr; r.mamp[k] = body.amp[k] * std::pow(std::min(1.0, bright * 0.8), k * 0.7) * 0.5; ++n;
    }
    r.nm = n;
  }
  void stringCoef(Src& r, double hz, double shape, double colour) {
    const double sh = clampd(shape, 0, 1), co = clampd(colour, 0, 1), t60 = 0.15 * std::pow(80.0, sh), a = 0.12 + 0.88 * co * co + 0.0001, f = clampd(hz, 20, sr * 0.4);
    r.sa = a; r.sg = std::min(0.9995, std::pow(10.0, -3 / (t60 * f))); r.sd = std::max(2.5, sr / f - (1 - a) / a - 0.5);
  }
  // ---- one specimen, one sample
  double gen(Voice& x, int s, int type, double hz, double xv, bool xw) {
    Src& r = x.s[(size_t)s]; const double shape = x.shp[s], colour = x.col[s], md = x.mdv[s], xamt = x.xam[s]; const int xmode = cXM[s]; const bool hasX = cX[s] > 0 && xamt > 0.0005;
    const double pm = hasX && xmode == 0 ? xv * xamt * 1.5 : 0; if (hasX && xmode == 3 && xw && xamt > 0.01) { r.ph = r.ph2 = r.ph3 = 0; r.mph = 0; }
    const double dt = std::min(0.45, hz / sr); double out = 0; r.wrapped = false;
    switch (type) {
      case TAnalog: {
        const double pw = 0.05 + 0.9 * colour;
        if (md < 0.01) out = oscWave(r.ph, pm, dt, pw, shape);
        else {
          const double sp = md * 0.02; out = (oscWave(r.ph, pm, dt, pw, shape) + oscWave(r.ph2, pm, dt, pw, shape) + oscWave(r.ph3, pm, dt, pw, shape)) * 0.58;
          double w2 = r.ph2 + dt * (1 + sp); if (w2 >= 1) { w2 -= std::floor(w2); r.wrapped = true; } double w3 = r.ph3 + dt * (1 - sp * 1.3); if (w3 >= 1) { w3 -= std::floor(w3); r.wrapped = true; } r.ph2 = w2; r.ph3 = w3;
        }
        r.ph += dt; if (r.ph >= 1) { r.ph -= std::floor(r.ph); r.wrapped = true; } break; }
      case TFm: {
        const double ratio = 0.25 * std::pow(2.0, colour * 6), idx = shape * shape * 2; r.mph += dt * ratio; if (r.mph >= 1) { r.mph -= std::floor(r.mph); r.wrapped = true; }
        const double m = fsin(r.mph + md * 0.25 * r.fbz); r.fbz = m; out = fsin(r.ph + pm + idx * m); r.ph += dt; if (r.ph >= 1) { r.ph -= std::floor(r.ph); r.wrapped = true; } break; }
      case TWave: {
        const double sweep = 1 + md * 7; double ph = r.ph + pm; ph -= std::floor(ph); if (colour > 0.001) ph = std::pow(ph, 1 + colour * 3); double q = ph * sweep; q -= std::floor(q);
        out = wtRead(cTab[s], hz * sweep, sr, q, shape); r.ph += dt; if (r.ph >= 1) { r.ph -= std::floor(r.ph); r.wrapped = true; } break; }
      case TNoise: {
        const int nt = cNz[s];
        if (md > 0.001) { if (--r.holdCnt <= 0) { r.held = r.ns.next(nt, shape); r.holdCnt = 1 + (long long)(md * md * 60); } out = r.held; } else out = r.ns.next(nt, shape);
        if (colour > 0.01) { const double q = 2 + colour * colour * 120; r.tune.set(hz, q, sr); r.tune.run(out); const double tuned = r.tune.band * r.tune.k * std::sqrt(q) * 1.6; out += (tuned - out) * std::min(1.0, colour * 1.5); }
        break; }
      case TModal: {
        double e = 0; if (r.strike > 0) { const double env = r.strike / r.strikeLen; e += r.rng.white() * r.strikeAmp * env; --r.strike; } if (hasX && xmode == 4) e += xv * xamt * 0.5; double sum = 0;
        for (int k = 0; k < r.nm; ++k) { const double y = r.mamp[k] * e + r.mc1[k] * r.y1[k] - r.mc2[k] * r.y2[k]; if (!(std::fabs(y) < 50)) { r.y1[k] = r.y2[k] = 0; continue; } r.y2[k] = r.y1[k]; r.y1[k] = y; sum += y; }
        out = sum; break; }
      case TString: {
        const double moS = clampd(md, 0, 1); double e = 0; if (r.strike > 0) { r.burstLp += (r.rng.white() - r.burstLp) * (0.15 + 0.85 * moS); e += r.burstLp * r.strikeAmp; --r.strike; } if (hasX && xmode == 4) e += xv * xamt * 0.3;
        const double y = r.dl.read(r.sd); r.lpz += (y - r.lpz) * r.sa; if (!std::isfinite(y) || !std::isfinite(e)) { r.dl.clear(); r.lpz = 0; r.burstLp = 0; out = 0; break; } r.dl.push(clampd(e + r.lpz * r.sg, -8, 8)); out = y; break; }
      default: {
        double h = 0.7 * hz / sr * (0.5 + colour * 1.5); const int steps = std::max(1, std::min(8, (int)(h / 0.01) + 1)); h /= steps;
        for (int k = 0; k < steps; ++k) { const double dx = 10 * (r.ly - r.lx), dy = r.lx * (28 - r.lz) - r.ly, dz = r.lx * r.ly - 2.6667 * r.lz; r.lx += dx * h; r.ly += dy * h; r.lz += dz * h; }
        if (!std::isfinite(r.lx + r.ly + r.lz) || std::fabs(r.lx) > 200) { r.lx = 1; r.ly = 1; r.lz = 10; }
        const double xn = clampd(r.lx / 20, -1, 1), zn = clampd(r.lz / 50, 0, 1); out = fsin(r.ph + pm + shape * 1.5 * xn) * (1 - md * 0.6 + md * 0.6 * zn); r.ph += dt; if (r.ph >= 1) { r.ph -= std::floor(r.ph); r.wrapped = true; } }
    }
    if (hasX) { if (xmode == 1) out += (out * xv - out) * xamt; else if (xmode == 2) out *= (1 - xamt) + xamt * (0.5 + 0.5 * xv); }
    return out < -4 ? -4 : (out > 4 ? 4 : out);
  }
  void renderVoice(Voice& x, float* L, float* R, int n) {
    const std::vector<double>& V = v; const bool serial = V[(size_t)kLinkId] > 0.5; bool any = false; for (int s = 0; s < kSrc; ++s) any = any || cType[s] != TEmpty;
    const double glideC = V[Glide] <= 0.001 ? 1 : 1 - std::exp(-1 / (V[Glide] * 0.3 * sr)), maxHz = sr * 0.45; Filt& f1 = x.f[0]; Filt& f2 = x.f[1];
    for (int i = 0; i < n; ++i) {
      if (x.tick == 0) controlTick(x);
      const double fr = (x.tick + 1.0) / kTick; x.e1v = x.e1.next(); x.e2v = x.e2.next(); x.e3v = x.e3.next(); x.cur += (x.target - x.cur) * glideC;
      double a0l = 0, a0r = 0, a1l = 0, a1r = 0, a2l = 0, a2r = 0; wr[0] = wr[1] = wr[2] = wr[3] = false;
      if (any) for (int s = 0; s < kSrc; ++s) {
        Src& sp = x.s[(size_t)s]; if (cType[s] == TEmpty) { sp.out = 0; wr[s] = false; continue; }
        const int xs = cX[s]; double xv = 0; bool xw = false; if (xs > 0) { const int q = xs - 1; xv = x.s[(size_t)q].out; xw = q < s ? wr[q] : x.s[(size_t)q].wrapped; }
        const double semis = x.semisPrev[s] + (x.semisCur[s] - x.semisPrev[s]) * fr, hz = std::min(midiHz(semis), maxHz);
        double o = gen(x, s, cType[s], hz, xv, xw); wr[s] = sp.wrapped; sp.out = o; o *= x.lvlPrev[s] + (x.lvlCur[s] - x.lvlPrev[s]) * fr; const int rt = cRoute[s]; const double lg = x.gl[s] * 1.414, rg = x.gr[s] * 1.414;
        if (rt == 0 || rt == 2) { a0l += o * lg; a0r += o * rg; } if (rt == 1 || rt == 2) { a1l += o * lg; a1r += o * rg; } if (rt == 3) { a2l += o * lg; a2r += o * rg; }
      }
      double yl, yr;
      if (serial) { const double b0 = f1.run(0, a0l), b1 = f1.run(1, a0r); yl = f2.run(0, b0 + a1l) + a2l; yr = f2.run(1, b1 + a1r) + a2r; }
      else { yl = f1.run(0, a0l) * x.balG1 + f2.run(0, a1l) * x.balG2 + a2l; yr = f1.run(1, a0r) * x.balG1 + f2.run(1, a1r) * x.balG2 + a2r; }
      const double amp = x.e1v * (x.ampPrev + (x.ampCur - x.ampPrev) * fr); L[i] = (float)((double)L[i] + yl * amp * x.panG[0]); R[i] = (float)((double)R[i] + yr * amp * x.panG[1]); if (++x.tick >= kTick) x.tick = 0;
    }
  }
  void chunk(float* outL, float* outR, int n) {
    const std::vector<double>& V = v; for (int i = 0; i < n; ++i) accL[i] = accR[i] = 0.f;
    for (int s = 0; s < kSrc; ++s) {
      const int b = kSrcBase + s * kSrcN; cType[s] = (int)clampd(rnd(V[(size_t)b]), 0, 7); cRoute[s] = (int)clampd(rnd(V[(size_t)(b + SPRoute)]), 0, 3); cX[s] = (int)clampd(rnd(V[(size_t)(b + SPXSrc)]), 0, 4); cXM[s] = (int)rnd(V[(size_t)(b + SPXMode)]);
      cTab[s] = (int)clampd(rnd(V[(size_t)(b + SPTable)]), 0, kTables - 1); cNz[s] = (int)clampd(rnd(V[(size_t)(b + SPNoise)]), 0, NTypeCount - 1); cBody[s] = (int)clampd(rnd(V[(size_t)(b + SPBody)]), 0, kBodies - 1);
    }
    for (auto& x : voice) if (x.alive()) renderVoice(x, accL, accR, n);
    applyFx(n); const double vol = std::pow(10.0, V[Volume] / 20); for (int i = 0; i < n; ++i) { outL[i] = (float)fastTanh(accL[i] * vol); outR[i] = (float)fastTanh(accR[i] * vol); }
  }
  void applyFx(int n) {
    const std::vector<double>& V = v; const bool par = V[(size_t)kFxMode] > 0.5; int used = 0; if (par) for (int i = 0; i < n; ++i) sumL[i] = sumR[i] = 0.f;
    for (int s = 0; s < kFx; ++s) {
      Fxd* f = fx[s].get(); if (!f || V[(size_t)(kFxBase + s * kFxN + 1)] < 0.5) continue; f->tempo = V[(size_t)kTempo]; f->process(accL, accR, tmpL, tmpR, n); ++used;
      if (par) for (int i = 0; i < n; ++i) { sumL[i] = (float)((double)sumL[i] + (double)tmpL[i]); sumR[i] = (float)((double)sumR[i] + (double)tmpR[i]); } else for (int i = 0; i < n; ++i) { accL[i] = tmpL[i]; accR[i] = tmpR[i]; }
    }
    if (par && used) { const double g = 1 / std::sqrt((double)used); for (int i = 0; i < n; ++i) { accL[i] = (float)(sumL[i] * g); accR[i] = (float)(sumR[i] * g); } }
  }
  void process(float* outL, float* outR, int n) override { for (int pos = 0; pos < n;) { const int c = std::min(n - pos, BS); chunk(outL + pos, outR + pos, c); pos += c; } }
  // ---- mutate
  double mr() { uint32_t m = mrng; m ^= m << 13; m ^= m >> 17; m ^= m << 5; mrng = m; return double(mrng & 0xFFFFFF) / 16777216; }
  double mbi() { return mr() * 2 - 1; }
  void put(int id, double val) { const Spec& sp = specs[(size_t)id]; val = clampd(val, std::min(sp.min, sp.max), std::max(sp.min, sp.max)); if (!sp.labels.empty()) val = rnd(val); v[(size_t)id] = val; set(id, val); writeParam(id, val); }
  void nudge(int id, double amt) { const Spec& sp = specs[(size_t)id]; const double cur = v[(size_t)id]; if (sp.log && sp.min > 0) put(id, cur * std::pow(sp.max / sp.min, mbi() * amt * 0.25)); else put(id, cur + mbi() * amt * (sp.max - sp.min) * 0.5); }
  void mutate() {
    const std::vector<double>& V = v; if (!mrng) mrng = 0x2545F491u; mrng = mrng ^ ((uint32_t)(++cnt) * 2654435761u); if (!mrng) mrng = 1; const double a = V[MutateAmt]; const int scope = (int)clampd(rnd(V[MutateScope]), 0, 3);
    if (scope == 0 || scope == 3) for (int s = 0; s < kSrc; ++s) {
      const int b = kSrcBase + s * kSrcN, type = (int)rnd(V[(size_t)b]); if (type == TEmpty) continue;
      nudge(b + SPShape, a); nudge(b + SPColour, a); nudge(b + SPMod, a * 0.7); if (s > 0 && mr() < a) put(b + SPCoarse, IV[((int)(mr() * 9)) % 9]); put(b + SPFine, V[(size_t)(b + SPFine)] + mbi() * a * 15);
      if (type == TWave && mr() < a * 0.6) put(b + SPTable, (double)(int)(mr() * kTables)); if (type == TModal && mr() < a * 0.5) put(b + SPBody, (double)(int)(mr() * kBodies)); if (type == TNoise && mr() < a * 0.4) put(b + SPNoise, (double)(int)(mr() * NTypeCount));
      if (s > 0 && mr() < a * 0.4) { put(b + SPXSrc, 1 + ((int)(mr() * 4)) % 4); put(b + SPXAmt, mr() * a); put(b + SPXMode, (double)(((int)(mr() * 5)) % 5)); }
    }
    if (scope == 1 || scope == 3) {
      for (int f = 0; f < 2; ++f) { const int b = kFiltBase + f * kFiltN; if ((int)rnd(V[(size_t)b]) == 0) continue; nudge(b + 1, a * 1.5); nudge(b + 2, a); nudge(b + 3, a * 0.5); nudge(b + 5, a); }
      for (int e = 0; e < 3; ++e) for (int k = 0; k < 4; ++k) if (e != 0 || k != 2) nudge(kEnvBase + e * 4 + k, a * 0.6);
    }
    if (scope == 2 || scope == 3) for (int w = 0; w < kWires; ++w) {
      const int b = kWireBase + w * 4; const bool used = (int)rnd(V[(size_t)b + 2]) > 0 && V[(size_t)b + 3] != 0;
      if (used) { put(b + 3, V[(size_t)b + 3] + mbi() * a * 0.5); if (mr() < a * 0.3) put(b, 1 + ((int)(mr() * (kModSrc - 1))) % (kModSrc - 1)); if (mr() < a * 0.2) put(b + 2, 1 + ((int)(mr() * (kDest - 1))) % (kDest - 1)); }
      else if (mr() < a * 0.2) { put(b, 1 + ((int)(mr() * (kModSrc - 1))) % (kModSrc - 1)); put(b + 2, 1 + ((int)(mr() * (kDest - 1))) % (kDest - 1)); put(b + 3, mbi() * 0.6); }
    }
  }
  void loadPreset(int idx) {
    const auto& PR = PRESETS(); idx = (int)clampd(idx, 0, (double)PR.size() - 1); std::vector<double> val((size_t)kCount); for (int i = 0; i < kCount; ++i) val[(size_t)i] = specs[(size_t)i].def;
    for (const PE& pe : PR[(size_t)idx]) { int id = -1; for (int i = 0; i < (int)specs.size(); ++i) if (specs[(size_t)i].name == pe.k) id = i; if (id > 0) val[(size_t)id] = pe.v; }
    for (int id = 1; id < kCount; ++id) { if (id == Mutate || id == MutateAmt || id == MutateScope) continue; v[(size_t)id] = val[(size_t)id]; set(id, val[(size_t)id]); writeParam(id, val[(size_t)id]); }
  }
};
inline Info info() {
  return Info{"modica", "Modica", "The laboratory: a polyphonic modular synth with four patchable specimens, two Reagent filters, Tesla chaos, a sequencer, twelve patch wires, three Apparatus pedals and a Mutate button.", makeSpecs(), makeGroups(),
              Theme{"modica", 0xff0f2a26, 0xff040b0a, 0xff5cf2c4, 0xffdcfff3, 0xff9dffe2}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::modica
