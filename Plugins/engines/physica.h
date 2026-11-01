// Physica: electro-mechanical synth. 23 modelled machines in 4 slots, 8 "room made of things" effects in 3 slots.
#pragma once
#include "../common/engine.h"
#include <map>
#include <mutex>
#include <cstring>
#include <cmath>
namespace occ { namespace physica {
/* fdlibm exp/expm1/tanh: V8 does not use the system libm, and the chaotic bowed-string models amplify 1-ulp differences. */
namespace fdl {
inline uint32_t hiw(double x) { uint64_t u; std::memcpy(&u, &x, 8); return (uint32_t)(u >> 32); }
inline uint32_t low(double x) { uint64_t u; std::memcpy(&u, &x, 8); return (uint32_t)u; }
inline double exp(double x) {
  static const double halF[2] = {0.5, -0.5}, o_threshold = 7.09782712893383973096e+02, u_threshold = -7.45133219101941108420e+02,
    ln2HI[2] = {6.93147180369123816490e-01, -6.93147180369123816490e-01}, ln2LO[2] = {1.90821492927058770002e-10, -1.90821492927058770002e-10},
    invln2 = 1.44269504088896338700e+00, P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05, P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08;
  double y, hi = 0, lo = 0, c, t, twom1000 = 9.33263618503218878990e-302; int k = 0; uint32_t hx = hiw(x); int xsb = (hx >> 31) & 1; hx &= 0x7fffffff;
  if (hx >= 0x40862E42) {
    if (hx >= 0x7ff00000) { if (((hx & 0xfffff) | low(x)) != 0) return x + x; else return xsb == 0 ? x : 0.0; }
    if (x > o_threshold) return HUGE_VAL;
    if (x < u_threshold) return 0.0;
  }
  if (hx > 0x3fd62e42) {
    if (hx < 0x3FF0A2B2) { if (x == 1.0) return 2.718281828459045; hi = x - ln2HI[xsb]; lo = ln2LO[xsb]; k = 1 - xsb - xsb; }
    else { k = (int)(invln2 * x + halF[xsb]); t = k; hi = x - t * ln2HI[0]; lo = t * ln2LO[0]; }
    x = hi - lo;
  } else if (hx < 0x3e300000) { if (1e300 + x > 1.0) return 1.0 + x; } else k = 0;
  t = x * x;
  c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  if (k == 0) return 1.0 - ((x * c) / (c - 2.0) - x);
  y = 1.0 - ((lo - (x * c) / (2.0 - c)) - hi);
  if (k >= -1021) { if (k == 1024) return y * 2.0 * 8.98846567431158e307; return std::ldexp(y, k); }
  return std::ldexp(y, k + 1000) * twom1000;
}
inline double expm1(double x) {
  static const double o_threshold = 7.09782712893383973096e+02, ln2_hi = 6.93147180369123816490e-01, ln2_lo = 1.90821492927058770002e-10, invln2 = 1.44269504088896338700e+00,
    Q1 = -3.33333333333331316428e-02, Q2 = 1.58730158725481460165e-03, Q3 = -7.93650757867487942473e-05, Q4 = 4.00821782732936239552e-06, Q5 = -2.01099218183624371326e-07;
  double y, hi, lo, c = 0, t, e, hxs, hfx, r1; int k; uint32_t hx = hiw(x); int xsb = hx & 0x80000000; hx &= 0x7fffffff;
  if (hx >= 0x4043687A) {
    if (hx >= 0x40862E42) {
      if (hx >= 0x7ff00000) { if (((hx & 0xfffff) | low(x)) != 0) return x + x; else return xsb == 0 ? x : -1.0; }
      if (x > o_threshold) return HUGE_VAL;
    }
    if (xsb != 0) { if (x + 1e-300 < 0.0) return 1e-300 - 1.0; }
  }
  if (hx > 0x3fd62e42) {
    if (hx < 0x3FF0A2B2) { if (xsb == 0) { hi = x - ln2_hi; lo = ln2_lo; k = 1; } else { hi = x + ln2_hi; lo = -ln2_lo; k = -1; } }
    else { k = (int)(invln2 * x + (xsb == 0 ? 0.5 : -0.5)); t = k; hi = x - t * ln2_hi; lo = t * ln2_lo; }
    x = hi - lo; c = (hi - x) - lo;
  } else if (hx < 0x3c900000) { t = 1e300 + x; return x - (t - (1e300 + x)); }
  else k = 0;
  hfx = 0.5 * x; hxs = x * hfx; r1 = 1.0 + hxs * (Q1 + hxs * (Q2 + hxs * (Q3 + hxs * (Q4 + hxs * Q5)))); t = 3.0 - r1 * hfx; e = hxs * ((r1 - t) / (6.0 - x * t));
  if (k == 0) return x - (x * e - hxs);
  e = (x * (e - c) - c); e -= hxs;
  if (k == -1) return 0.5 * (x - e) - 0.5;
  if (k == 1) { if (x < -0.25) return -2.0 * (e - (x + 0.5)); else return 1.0 + 2.0 * (x - e); }
  if (k <= -2 || k > 56) { y = 1.0 - (e - x); if (k == 1024) y = y * 2.0 * 8.98846567431158e307; else y = std::ldexp(y, k); return y - 1.0; }
  if (k < 20) { t = 1.0 - std::ldexp(1.0, -k); y = t - (e - x); y = std::ldexp(y, k); }
  else { t = std::ldexp(1.0, -k); y = x - (e + t); y += 1.0; y = std::ldexp(y, k); }
  return y;
}
inline double tanh(double x) {
  uint32_t jx = hiw(x); uint32_t ix = jx & 0x7fffffff; double t, z;
  if (ix >= 0x7ff00000) { if ((int32_t)jx >= 0) return 1.0 / x + 1.0; else return 1.0 / x - 1.0; }
  if (ix < 0x40360000) {
    if (ix < 0x3e300000) { if (1e300 + x > 1.0) return x; }
    if (ix >= 0x3ff00000) { t = expm1(2.0 * std::fabs(x)); z = 1.0 - 2.0 / (t + 2.0); }
    else { t = expm1(-2.0 * std::fabs(x)); z = -t / (t + 2.0); }
  } else z = 1.0 - 1e-300;
  return (int32_t)jx >= 0 ? z : -z;
}
}
constexpr double TWO_PI = 6.2831853;
constexpr int kSlots = 4, kFx = 3, kPoly = 4, kSrcTypes = 24, kFxTypes = 9;
enum { Preset, Volume, Mode, Input, Dry, Chaos, Wear, Gravity, Overload };
constexpr int SlotBase = 9, SlotParams = 8, FxBase = SlotBase + kSlots * SlotParams, FxParams = 4, Count = FxBase + kFx * FxParams;
enum { SType, SLevel, STune, SA, SB, SDrive, SDriveAmt, SPlay };
enum { FType, FA, FB, FMix };
constexpr int slotParam(int s, int p) { return SlotBase + s * SlotParams + p; }
constexpr int fxParam(int f, int p) { return FxBase + f * FxParams + p; }
inline double rnd(double x) { return std::floor(x + 0.5); }
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> src = {"- Off -", "Balloon", "Motor", "Siren disc", "Bowed squeal", "Bottle", "Dripping water", "Slinky", "Mousetrap", "Twanged ruler", "Fan", "Electric arc", "Vortex whistle", "Edge-tone pipe", "Hurdy-gurdy wheel", "Card in spokes", "Washboard", "Singing bowl", "Relay buzzer", "Solenoid chime", "Vibration motor", "Hard-drive arm", "Rubber-band wheel", "Chime carousel"};
  std::vector<std::string> fxn = {"- Off -", "Spring tube", "Underwater mic", "Slinky echo", "Garden hose", "Fan tremolo", "Vacuum pump", "Paper cups", "Bucket"};
  std::vector<std::string> pre = {"Default", "Breakfast Machine", "Submarine", "Haunted Garage", "Balloon Orchestra", "Mad Scientist", "Plumbing", "Toy Factory", "Input Eater"};
  std::vector<std::string> drv = {"None", "Input", "Slot 1", "Slot 2", "Slot 3", "Slot 4", "Chaos"};
  std::vector<Spec> sp = {P("Preset", "", 0, (double)pre.size() - 1, 0, "%.0f", false, pre), P("Volume", "dB", -24, 12, 0, "%.1f dB"),
    P("Mode", "", 0, 2, 2, "%.0f", false, {"Synth (notes)", "Effect (input)", "Both"}),
    P("Input", "", 0, 1, 1, "%.2f"), P("Dry", "", 0, 1, 0, "%.2f"), P("Chaos", "", 0, 1, 0, "%.2f"), P("Wear", "", 0, 1, 0, "%.2f"), P("Gravity", "g", 0.2, 3, 1, "%.2f g"), P("Overload", "", 0, 1, 0, "%.2f")};
  for (int s = 0; s < kSlots; ++s) {
    std::string n = "Slot " + std::to_string(s + 1) + " ";
    sp.push_back(P((n + "Type").c_str(), "", 0, kSrcTypes - 1, s == 0 ? 2 : s == 1 ? 6 : s == 2 ? 5 : 9, "%.0f", false, src));
    sp.push_back(P((n + "Level").c_str(), "", 0, 1, 0.7, "%.2f")); sp.push_back(P((n + "Tune").c_str(), "st", -36, 36, 0, "%.1f st"));
    sp.push_back(P((n + "Amount").c_str(), "", 0, 1, 0.5, "%.2f")); sp.push_back(P((n + "Character").c_str(), "", 0, 1, 0.5, "%.2f"));
    sp.push_back(P((n + "Driven by").c_str(), "", 0, 6, 0, "%.0f", false, drv)); sp.push_back(P((n + "Drive amount").c_str(), "", -1, 1, 0, "%.2f"));
    sp.push_back(P((n + "Plays").c_str(), "", 0, 1, 0, "%.0f", false, {"Played", "Drone"}));
  }
  for (int f = 0; f < kFx; ++f) {
    std::string n = "Fx " + std::to_string(f + 1) + " ";
    sp.push_back(P((n + "Type").c_str(), "", 0, kFxTypes - 1, f == 0 ? 1 : f == 1 ? 8 : 0, "%.0f", false, fxn));
    sp.push_back(P((n + "A").c_str(), "", 0, 1, 0.5, "%.2f")); sp.push_back(P((n + "B").c_str(), "", 0, 1, 0.5, "%.2f")); sp.push_back(P((n + "Mix").c_str(), "", 0, 1, f == 0 ? 0.35 : 0.25, "%.2f"));
  }
  return sp;
}
inline std::vector<Group> makeGroups() {
  auto sg = [](int s) { return std::vector<int>{slotParam(s, 0), slotParam(s, 1), slotParam(s, 3), slotParam(s, 4), slotParam(s, 2), slotParam(s, 7), slotParam(s, 5), slotParam(s, 6)}; };
  std::vector<int> a = sg(0), b = sg(1), c = sg(2), d = sg(3), fx;
  a.insert(a.end(), b.begin(), b.end()); c.insert(c.end(), d.begin(), d.end());
  for (int i = 0; i < 12; ++i) fx.push_back(FxBase + i);
  return {{"Machines 1-2", a}, {"Machines 3-4", c}, {"Rooms made of things", fx}, {"Master and wild controls", {Volume, Mode, Input, Dry, Chaos, Wear, Gravity, Overload}}};
}
/* ---- small DSP helpers */
struct Rng {
  uint32_t s;
  explicit Rng(uint32_t sd = 0) : s(sd ? sd : 0x1234567u) {}
  double uni() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double(s >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
struct Bq {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double sr) {
    f = clampd(f, 5, sr * 0.49); q = std::max(0.05, q); double w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q), B0, B1, B2;
    if (t == 3) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; } else if (t == 4) { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; } else { B0 = al; B1 = 0; B2 = -al; }
    double A0 = 1 + al; b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = -2 * cw / A0; a2 = (1 - al) / A0;
  }
  double run(double x) { double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
  void reset() { z1 = z2 = 0; }
};
inline double wrap1(double x) { return x - std::floor(x); }
inline double rdBuf(const double* buf, int mask, long long wi, double d) { d = clampd(d, 1, mask - 2); long long i = (long long)d; double fr = d - double(i), a = buf[(wi - i) & mask], b = buf[(wi - i - 1) & mask]; return a + (b - a) * fr; }
static double oBp = 0, oLp = 0, oHp = 0;
inline void svf(double* st, int o, double x, double fc, double q, double sr) {
  double g = 2 * std::sin(kPi * std::min(fc, sr * 0.1) / sr), qi = 1 / std::max(0.6, q);
  double hp = x - st[o] - qi * st[o + 1]; st[o + 1] += g * hp; st[o] += g * st[o + 1]; oBp = st[o + 1]; oLp = st[o]; oHp = hp;
}
inline void resSet(double* cf, int o, double freq, double t60, double sr) { double w = TWO_PI * std::min(freq, sr * 0.45) / sr, R = fdl::exp(-6.9078 / std::max(1.0, t60 * sr)); cf[o] = 2 * R * std::cos(w); cf[o + 1] = R * R; cf[o + 2] = std::sin(w); }
inline double resRun(double* st, int so, const double* cf, int co, double x) { double y = cf[co] * st[so] - cf[co + 1] * st[so + 1] + x; st[so + 1] = st[so]; st[so] = y; return y; }
inline void resKick(double* st, int so, const double* cf, int co, double a) { st[so] += a * cf[co + 2]; }
inline uint32_t u32(double x) { return (uint32_t)(uint64_t)x; }

struct Bub { bool on = false; double ph = 0, f = 0, k = 0, env = 0, dec = 0; };
struct V {
  Rng rng; double buf[4096], ap[24], s[6], sv[4], r1[2], r2[2]; Bub bub[6];
  bool on, gate, drone; long long note, age, ctr, k, quiet, wi; double f0, vel, env, ph, ph2, w, p, y, vv, lp, lp2, t, gap, amp;
  explicit V(uint32_t seed = 0) : rng(seed) { clear(); }
  void clear() {
    on = false; gate = false; drone = false; note = -1; age = 0; f0 = 220; vel = 1;
    env = ph = ph2 = w = p = y = vv = lp = lp2 = 0; ctr = k = quiet = wi = 0; t = gap = amp = 0;
    std::fill(buf, buf + 4096, 0.0); std::fill(ap, ap + 24, 0.0); std::fill(s, s + 6, 0.0); std::fill(sv, sv + 4, 0.0); std::fill(r1, r1 + 2, 0.0); std::fill(r2, r2 + 2, 0.0); for (auto& b : bub) b.on = false;
  }
};
struct Par { double f = 220, e = 0.5, b = 0.5, g = 1, wear = 0, sr = 48000, dt = 1.0 / 48000, vel = 1, pm = 1; bool drone = false; };
inline void trigger(V& v, int type, const Par& p) {
  v.age = 0; v.quiet = 0;
  switch (type) {
    case 1: v.p = std::min(1.3, 0.55 + 0.6 * v.vel * (0.6 + p.e)); break;
    case 7: v.ctr = 14; v.amp = 0.4 + 0.6 * v.vel; break;
    case 8: { v.k = 0; v.t = 0; double q = 1 - clampd(p.e, 0, 1); v.gap = 0.035 + 0.16 * q * q + 0.02; v.amp = 0.5 + 0.5 * v.vel; v.ctr = 1; break; }
    case 9: v.amp = 0.35 + 0.65 * v.vel; v.s[0] = 1; break;
    case 19: case 22: case 23: v.t = 1e9; break;
  }
}
static const double THR13[3] = {0.3, 0.6, 0.9}, RAT13[4] = {1, 1.5, 2, 3}, RAT17[5] = {1, 2.71, 5.15, 8.4, 1}, GAIN17[5] = {1, 0.55, 0.3, 0.15, 0.7}, RAT19[3] = {1, 2.76, 5.4}, GN19[3] = {1, 0.6, 0.3},
  RAT22[5] = {1, 1.125, 1.25, 1.5, 1.667}, RAT23[6] = {1, 1.125, 1.25, 1.5, 1.667, 2};
inline double tick(V& v, int type, Par& P) {
  const double dt = P.dt, sr = P.sr, f = clampd(v.f0 * P.pm, 8, sr * 0.4), e = clampd(P.e, 0, 1.5), b = clampd(P.b, 0, 1), n = v.rng.bi(); double out = 0; ++v.age;
  const double vel = 0.5 + 0.5 * v.vel; double* sv = v.sv;
  switch (type) {
    case 1: {
      const double tau = v.gate ? (0.25 + (2.4 - 0.25) * (1 - clampd(e, 0, 1))) / std::max(0.2, P.g) : 0.07;
      v.p -= v.p * dt / tau; if (v.p < 1e-4) v.p = 0;
      if (v.drone && v.p < 0.03) { v.ctr = (long long)(int)(sr * 0.35); trigger(v, 1, P); }
      const double fs = f * (0.55 + 0.9 * v.p) * (1 + 0.45 * b) * (1 + 0.02 * v.lp2); v.lp2 += (n - v.lp2) * 0.004; v.ph = wrap1(v.ph + fs * dt);
      const double tone = fdl::tanh(3 * std::sin(TWO_PI * v.ph)) + 0.35 * std::sin(12.566371 * v.ph + 1);
      svf(sv, 0, n, 2.2 * fs, 2.5, sr); const double nzmix = 0.15 + 0.6 * (1 - b);
      out = v.p * std::sqrt(v.p) * ((1 - nzmix) * tone * 0.4 + nzmix * oBp * 1.6) * vel; break; }
    case 2: {
      const double tgt = v.gate ? f : 0, tau = 0.03 + b * b * 1.6; v.w += (tgt - v.w) * std::min(1.0, dt / tau * (v.gate ? 1 : 0.5)); if (v.w < 0.5 && !v.gate) v.w = 0;
      v.ph = wrap1(v.ph + v.w * dt); v.ph2 = wrap1(v.ph2 + v.w * dt / 7); const double a = TWO_PI * v.ph;
      const double s = std::sin(a) + 0.5 * std::sin(2 * a + 0.6) + 0.3 * std::sin(3 * a + 1.1) + 0.18 * std::sin(5 * a);
      v.lp += (n - v.lp) * 0.5; const double brush = n - v.lp, sp = clampd(v.w / f, 0, 1);
      out = std::pow(sp, 0.7) * (0.25 + 0.75 * clampd(e, 0, 1)) * (s * 0.38 + brush * 0.12 * sp) * (0.7 + 0.3 * std::sin(TWO_PI * v.ph2)) * vel; v.p = sp; break; }
    case 3: {
      const double tgt = v.gate ? f : 0, tau = 0.05 + b * 2.2; v.w += (tgt - v.w) * std::min(1.0, dt / tau); if (v.w < 0.01 * f && !v.gate) v.w = 0;
      v.ph = wrap1(v.ph + v.w * dt); const double pulse = v.ph < 0.3 ? 1 : 0, fc = std::max(150.0, 5 * v.w);
      v.lp += (pulse - v.lp) * std::min(1.0, TWO_PI * fc * dt); v.lp2 += (n - v.lp2) * 0.15; const double sp = clampd(v.w / f, 0, 1);
      out = sp * (0.2 + 0.8 * clampd(e, 0, 1)) * ((v.lp - 0.3) * 0.9 + (n - v.lp2) * 0.07) * vel; v.p = sp; break; }
    case 4: {
      const double fr = std::min(f * 1.34, sr * 0.06), w = TWO_PI * fr;
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.02 : 0.09));
      const double vb = (0.08 + 0.92 * clampd(e, 0, 1.2)) * v.env * 0.55, N = 0.35 + 1.9 * b, vrel = v.vv - vb, mu = 0.35 + 0.65 * fdl::exp(-std::fabs(vrel) * 3), F = -N * mu * fdl::tanh(vrel * 25);
      const double acc = -w * w * v.y - 2 * 0.0015 * w * v.vv + F * w * 0.8; v.vv += acc * dt; v.vv = clampd(v.vv, -3, 3); v.y += v.vv * dt; v.y = clampd(v.y, -1, 1);
      v.lp += (n - v.lp) * 0.3; out = (v.vv * 0.55 + 0.02 * (n - v.lp) * v.env) * std::min(1.0, v.env * 3) * vel; v.p = v.env; break; }
    case 5: {
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.06 : 0.12));
      const double breath = (0.2 + 0.8 * clampd(e, 0, 1.2)) * v.env; v.lp2 += (n - v.lp2) * 0.02;
      const double vib = 1 + 0.004 * std::sin(TWO_PI * 5 * double(v.age) * dt) + 0.01 * v.lp2 * 8;
      svf(sv, 0, n * (0.4 + 0.6 * b), f * vib, 25 + 160 * (1 - b), sr); const double bp = oBp;
      svf(sv, 2, n, f * 2 * vib, 40, sr); const double bq = oBp;
      v.ph = wrap1(v.ph + f * vib * dt);
      out = breath * (bp * 0.55 * (0.5 + b) + bq * 0.08 + (1 - b) * 0.2 * std::sin(TWO_PI * v.ph) * (0.6 + 0.4 * v.rng.uni()) + (n - v.lp2) * 0.03 * (0.3 + b)) * vel; v.p = v.env; break; }
    case 6: {
      const double rate = (0.8 + clampd(e, 0, 1.2) * 12) * std::sqrt(P.g);
      if (v.gate && v.rng.uni() < rate * dt) {
        for (auto& bb : v.bub) if (!bb.on) {
          bb.on = true; bb.ph = 0; bb.f = std::min(sr * 0.3, f * (0.55 + 0.95 * v.rng.uni())); bb.k = 6 + 22 * v.rng.uni(); bb.env = (0.25 + 0.75 * v.rng.uni()) * vel;
          bb.dec = fdl::exp(-dt / (0.006 + 0.06 * (1 - b) * (0.4 + v.rng.uni()))); break; }
      }
      for (auto& bb : v.bub) if (bb.on) { bb.ph = wrap1(bb.ph + bb.f * dt); bb.f *= 1 + bb.k * dt; if (bb.f > sr * 0.35) bb.f = sr * 0.35; out += bb.env * std::sin(TWO_PI * bb.ph) * 0.35; bb.env *= bb.dec; if (bb.env < 1e-4) bb.on = false; }
      v.p = 1; break; }
    case 7: {
      const int N = 22; const double a = clampd(0.25 + 0.6 * b + 0.04 * (P.g - 1), 0.1, 0.85), Ld = clampd(sr / f - 2 - N * (1 - a) / (1 + a), 6, 4000);
      const double tau = v.gate ? 0.35 + clampd(e, 0, 1.2) * 3 : 0.12, g = std::pow(0.001, 1 / std::max(1.0, tau * f)); double x = rdBuf(v.buf, 4095, v.wi, Ld);
      double* ap = v.ap; for (int i = 0; i < N; ++i) { const double y = a * x + ap[i]; ap[i] = x - a * y; x = y; }
      x *= g; v.lp += (x - v.lp) * 0.65; double exc = 0; if (v.ctr > 0) { --v.ctr; exc = n * v.amp; }
      v.buf[v.wi & 4095] = clampd(v.lp + exc, -4, 4); ++v.wi; out = v.lp * 0.5; v.p = std::fabs(v.lp);
      if (v.drone && double(v.age) > double((long long)(int)(sr * (0.5 + 2 / (0.4 + e))))) trigger(v, 7, P);
      break; }
    case 8: {
      if (v.ctr == 1) {
        v.t += dt; const int nclicks = 6 + (int)(e * 12);
        if (v.t >= v.gap) {
          v.t = 0; v.gap *= 0.8;
          if (v.k < nclicks) { v.s[0] = (0.25 + 0.5 * v.rng.uni()) * v.amp * (0.4 + 1 * double(v.k) / nclicks); v.s[1] = f * (0.7 + 1.4 * v.rng.uni()); v.k++; }
          else { v.ctr = 2; v.s[0] = 1.2 * v.amp; const double w1 = TWO_PI * f / sr, w2 = TWO_PI * f * 2.4 / sr, R = fdl::exp(-1 / (0.15 * sr));
            v.r1[0] = (0.5 + 1.5 * b) * v.amp * std::sin(w1); v.r2[0] = (0.3 + 1 * b) * v.amp * std::sin(w2); v.r1[1] = v.r2[1] = 0; v.s[2] = 2 * R * std::cos(w1); v.s[3] = 2 * R * std::cos(w2); v.s[4] = R * R; }
        }
      }
      const double cl = v.s[0] * n; v.s[0] *= fdl::exp(-dt / 0.0015); const double fc = clampd(v.s[1], 300, 9000); svf(sv, 0, cl, fc, 1.2, sr); out = oBp * 1.5;
      if (v.ctr == 2) {
        const double y1 = v.s[2] * v.r1[0] - v.s[4] * v.r1[1]; v.r1[1] = v.r1[0]; v.r1[0] = y1; const double y2 = v.s[3] * v.r2[0] - v.s[4] * v.r2[1]; v.r2[1] = v.r2[0]; v.r2[0] = y2;
        out += (y1 + y2) * 0.35; if (std::fabs(y1) < 1e-4 && v.s[0] < 1e-4) v.ctr = 3;
      }
      out *= 0.8; v.p = v.ctr < 3 ? 1 : 0;
      if (v.drone && v.ctr == 3) { v.ctr = 4; v.t = 0; }
      if (v.drone && v.ctr == 4) { v.t += dt; if (v.t > 0.4 + 1.6 * (1 - clampd(e, 0, 1))) trigger(v, 8, P); }
      break; }
    case 9: {
      const double tau = v.gate ? 0.08 + 1.3 * clampd(e, 0, 1.2) : 0.05; v.s[0] *= fdl::exp(-dt / tau); v.s[1] *= fdl::exp(-dt / 0.03); const double a = v.s[0] * v.amp;
      v.ph = wrap1(v.ph + f * (1 + 0.12 * P.g * a * a) * dt); v.ph2 = wrap1(v.ph2 + f * 6.27 * dt);
      double y = a * std::sin(TWO_PI * v.ph) + 0.22 * a * v.s[1] * std::sin(TWO_PI * v.ph2); const double thr = 0.95 - 0.78 * b;
      if (std::fabs(y) > thr) { const double sgn = y > 0 ? 1 : -1, over = std::fabs(y) - thr; y = sgn * (thr + 0.25 * over); y += 0.9 * over * n; }
      out = y * 0.7 * vel; v.p = a; if (v.drone && v.s[0] < 0.02) { trigger(v, 9, P); v.s[1] = 1; }
      break; }
    case 10: {
      const double tgt = v.gate ? f / 8 : 0, tau = 0.05 + b * 1.6; v.w += (tgt - v.w) * std::min(1.0, dt / tau); if (v.w < 0.05 && !v.gate) v.w = 0;
      v.ph = wrap1(v.ph + v.w * dt); const double sp = clampd(v.w / std::max(1.0, f / 8), 0, 1), pulse = std::pow(0.5 + 0.5 * std::cos(TWO_PI * v.ph), 1.5 + 2 * clampd(e, 0, 1));
      svf(sv, 0, n, 250 + 1800 * clampd(e, 0, 1) * sp, 0.9, sr); out = sp * ((0.25 + 0.75 * pulse) * oBp * 0.9 + pulse * std::sin(TWO_PI * v.ph * 2) * 0.2) * vel; v.p = sp; break; }
    case 11: {
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.004 : 0.04)); v.ph = wrap1(v.ph + f * dt);
      const double saw = 2 * v.ph - 1; v.lp += (saw - v.lp) * 0.2; const double hum = std::fabs(std::sin(kPi * v.ph)) * 2 - 1, rate = 12 + clampd(e, 0, 1.2) * 500;
      if (v.rng.uni() < rate * dt) v.s[0] = 0.25 + 0.75 * v.rng.uni();
      v.s[0] *= fdl::exp(-dt / (0.0006 + 0.0025 * v.rng.uni()));
      v.lp2 += (n - v.lp2) * 0.35; const double hn = n - v.lp2;
      out = v.env * ((1 - b) * (v.lp * 0.12 + hum * 0.1) * (0.4 + 0.6 * clampd(e, 0, 1)) + (0.25 + b) * v.s[0] * hn * 0.8) * vel; v.p = v.env; break; }
    case 12: {
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.05 : 0.1)); v.lp2 += (n - v.lp2) * 0.002;
      const double ft = std::min(sr * 0.4, f * 2 * (0.85 + 0.3 * clampd(e, 0, 1.2)) * (1 + 0.012 * std::sin(TWO_PI * 4.5 * double(v.age) * dt) + 0.8 * v.lp2));
      v.ph = wrap1(v.ph + ft * dt); const double tone = std::sin(TWO_PI * v.ph) + 0.12 * std::sin(12.566371 * v.ph); svf(sv, 0, n, ft, 30, sr);
      out = v.env * (0.25 + 0.75 * clampd(e, 0, 1)) * ((0.35 + 0.65 * b) * tone * 0.5 + (1 - b) * oBp * 0.9) * vel; v.p = v.env; break; }
    case 13: {
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.03 : 0.08)); const double jet = clampd(e, 0, 1.2);
      if (v.k < 3 && jet > THR13[v.k] + 0.04) { ++v.k; v.s[0] = 0.5; } else if (v.k > 0 && jet < THR13[v.k - 1] - 0.04) { --v.k; v.s[0] = 0.5; }
      if (v.y == 0) { v.y = f * RAT13[v.k]; } v.y += (f * RAT13[v.k] - v.y) * std::min(1.0, dt / 0.004); v.s[0] *= fdl::exp(-dt / 0.01);
      v.ph = wrap1(v.ph + v.y * dt); const double a = TWO_PI * v.ph, tone = std::sin(a) + (0.1 + 0.5 * b) * std::sin(2 * a) + 0.3 * b * std::sin(3 * a);
      svf(sv, 0, n, v.y, 6, sr); out = v.env * (0.3 + 0.7 * jet) * (tone * 0.4 + oBp * 0.3 + v.s[0] * n * 0.5) * vel; v.p = v.env; break; }
    case 14: {
      const double fr = std::min(f * 1.34, sr * 0.06), w = TWO_PI * fr; v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.25 : 0.15));
      const double vb = (0.12 + 0.5 * clampd(e, 0, 1)) * v.env * (1 + 0.03 * std::sin(TWO_PI * 3 * double(v.age) * dt)), vrel = v.vv - vb, mu = 0.35 + 0.65 * fdl::exp(-std::fabs(vrel) * 3), F = -0.9 * mu * fdl::tanh(vrel * 25);
      const double acc = -w * w * v.y - 2 * 0.003 * w * v.vv + F * w * 0.8; v.vv += acc * dt; v.vv = clampd(v.vv, -3, 3); v.y += v.vv * dt; v.y = clampd(v.y, -1, 1);
      const double thr = 0.25 * (1.1 - b); double buzz = 0; if (std::fabs(v.vv) > thr) buzz = (v.vv > 0 ? 1 : -1) * (std::fabs(v.vv) - thr) * (0.5 + 0.5 * v.rng.uni()) * b * 3;
      v.lp += (n - v.lp) * 0.2; out = (v.vv * 0.55 + buzz + 0.03 * (n - v.lp) * v.env) * std::min(1.0, v.env * 3) * vel; v.p = v.env; break; }
    case 15: {
      const double tgt = v.gate ? f : 0; v.w += (tgt - v.w) * std::min(1.0, dt / (0.02 + b * 0.8)); if (v.w < 0.5 && !v.gate) v.w = 0;
      v.ph += v.w * dt; if (v.ph >= 1) { v.ph -= 1; v.s[0] = (0.5 + 0.5 * v.rng.uni()) * (0.4 + 0.6 * clampd(e, 0, 1)); }
      v.s[0] *= fdl::exp(-dt / 0.0004); const double sp = clampd(v.w / f, 0, 1); svf(sv, 0, v.s[0] * n, 1800 + 2200 * (1 - b), 3, sr);
      out = sp * (oBp * 1.2 + v.s[0] * n * 0.3) * vel; v.p = sp; break; }
    case 16: {
      const double tgt = v.gate ? f : 0; v.w += (tgt - v.w) * std::min(1.0, dt / 0.05); if (v.w < 0.5 && !v.gate) v.w = 0;
      v.lp2 += (n - v.lp2) * 0.01; v.ph += v.w * dt * (1 + 0.35 * b * v.lp2 * 6);
      if (v.ph >= 1) { v.ph -= 1; v.s[0] = (0.3 + 0.7 * v.rng.uni()) * (0.3 + 0.7 * clampd(e, 0, 1)); }
      v.s[0] *= fdl::exp(-dt / 0.0012); const double sp = clampd(v.w / f, 0, 1), x = v.s[0] * n + 0.03 * b * clampd(e, 0, 1) * n * sp;
      svf(sv, 0, x, 1100, 5, sr); const double b1 = oBp; svf(sv, 2, x, 2300, 8, sr); const double b2 = oBp;
      out = sp * (b1 * 0.8 + b2 * 0.5 + v.s[0] * n * 0.3) * vel; v.p = sp; break; }
    case 17: {
      double* B = v.buf;
      if ((v.age & 63) == 1) for (int k = 0; k < 5; ++k) resSet(B, 64 + 3 * k, f * RAT17[k] + (k == 4 ? 0.35 + 0.6 * b : 0), 5, sr);
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.7 : 0.4)); v.lp2 += (n - v.lp2) * 0.3;
      const double rub = v.lp2 * v.env * (0.05 + clampd(e, 0, 1.2)) * (0.7 + 0.3 * std::sin(TWO_PI * 0.7 * double(v.age) * dt)) * 0.0006; double acc = 0;
      for (int k = 0; k < 5; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, rub * (k >= 1 && k < 4 ? 0.4 + 1.2 * b : 1)) * GAIN17[k];
      out = acc * 0.25 * vel; v.p = v.env; break; }
    case 18: {
      const double volt = clampd(e, 0, 1.2); v.lp2 += (n - v.lp2) * 0.01; const double rate = f * (0.55 + 0.45 * std::min(volt, 1.0)) * (1 + 0.03 * v.lp2 * 6);
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.003 : 0.02)); v.ph = wrap1(v.ph + rate * dt); const long long closed = v.ph < 0.5 ? 1 : 0;
      if (closed != v.k) { v.k = closed; if (closed) { v.s[0] = 1; if (v.rng.uni() < b * 0.5) v.s[2] = 0.5; } else { v.s[0] = -0.8; v.s[1] = 0.6; } }
      v.s[2] *= fdl::exp(-dt / 0.0002); const double imp = v.s[0] + v.s[2] * n; v.s[0] *= fdl::exp(-dt / 0.0006); v.s[1] *= fdl::exp(-dt / 0.0003);
      svf(sv, 0, imp, 600 + 900 * volt, 6, sr); out = v.env * (0.4 + 0.6 * std::min(volt, 1.0)) * (oBp * 1.5 + v.s[0] * 0.3 + v.s[1] * n * 0.4) * vel; v.p = v.env; break; }
    case 19: {
      double* B = v.buf; v.t += dt; const double rr = 2 + 16 * clampd(e, 0, 1.2);
      if (v.gate && v.t >= 1 / rr) { v.t = 0; const double t60 = 0.3 + 2.7 * b; for (int k = 0; k < 3; ++k) { resSet(B, 64 + 3 * k, f * RAT19[k], t60 / (1 + 0.6 * k), sr); resKick(B, 2 * k, B, 64 + 3 * k, GN19[k] * v.vel * (0.7 + 0.3 * v.rng.uni())); } v.s[0] = 0.5; }
      double acc = 0; for (int k = 0; k < 3; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
      out = (acc * 0.6 + v.s[0] * n * 0.25) * vel; v.s[0] *= fdl::exp(-dt / 0.0008); v.p = 1; break; }
    case 20: {
      const double tgt = v.gate ? f : 0; v.w += (tgt - v.w) * std::min(1.0, dt / 0.12); if (v.w < 0.5 && !v.gate) v.w = 0;
      const double old = v.ph; v.ph = wrap1(v.ph + v.w * dt); if (v.ph < old) v.s[0] = 1; v.s[0] *= fdl::exp(-dt / 0.004);
      const double sp = clampd(v.w / f, 0, 1), x = v.s[0] + 0.3 * std::sin(TWO_PI * v.ph); svf(sv, 0, x, 100 + 400 * std::pow(0.3, b * 1.5), 6, sr);
      out = sp * (oBp * 1.1 + 0.1 * std::sin(TWO_PI * 5 * v.ph) * (0.5 + clampd(e, 0, 1)) + 0.2 * std::sin(TWO_PI * v.ph)) * (0.3 + 0.7 * clampd(e, 0, 1)) * vel; v.p = sp; break; }
    case 21: {
      v.env += ((v.gate ? 1 : 0) - v.env) * std::min(1.0, dt / (v.gate ? 0.004 : 0.03));
      const double w0 = TWO_PI * (40 + 210 * b), k0 = w0 * w0, c = 2 * 0.3 * w0; v.ph = wrap1(v.ph + f * dt);
      const double F = (v.ph < 0.5 ? 1 : -1) * (1.2 + 6 * clampd(e, 0, 1.2)) * v.env, a = -k0 * v.y - c * v.vv + F * k0; v.vv += a * dt; v.y += v.vv * dt;
      if (std::fabs(v.y) > 1) { const double sg = v.y > 0 ? 1 : -1; v.y = sg; v.s[0] = std::min(1.0, 0.5 * std::fabs(v.vv) / w0); v.vv = -0.35 * v.vv; }
      v.s[0] *= fdl::exp(-dt / 0.0008); svf(sv, 0, v.s[0] * n, 1700, 5, sr); out = (0.45 * v.y + 0.5 * v.vv / w0 + oBp * 0.9) * vel; v.p = v.env; break; }
    case 22: {
      double* B = v.buf; v.t += dt; const double rr = (3 + 16 * clampd(e, 0, 1.2)) * (0.8 + 0.4 * v.rng.uni());
      if (v.gate && v.t >= 1 / rr) { v.t = 0; const int bnd = std::min(4, (int)(v.rng.uni() * 5)); resSet(B, 64 + 3 * bnd, f * RAT22[bnd], 0.12 + 1.1 * b, sr); resKick(B, 2 * bnd, B, 64 + 3 * bnd, (0.5 + 0.5 * v.rng.uni()) * v.vel); v.s[0] = 0.4; }
      double acc = 0; for (int k = 0; k < 5; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
      out = (acc * 0.5 + v.s[0] * n * 0.15) * vel; v.s[0] *= fdl::exp(-dt / 0.0006); v.p = 1; break; }
    case 23: {
      double* B = v.buf; v.t += dt; const double rr = 0.8 + 9 * clampd(e, 0, 1.2);
      if (v.gate && v.t >= 1 / rr) { v.t = 0; const int pp = (int)(v.k % 6); v.k++; const double t60 = 1 + 3 * b;
        resSet(B, 64 + 6 * pp, f * RAT23[pp], t60, sr); resSet(B, 64 + 6 * pp + 3, f * RAT23[pp] * 2.76, t60 * 0.4, sr);
        resKick(B, 4 * pp, B, 64 + 6 * pp, v.vel); resKick(B, 4 * pp + 2, B, 64 + 6 * pp + 3, 0.5 * v.vel); v.s[0] = 0.4; }
      double acc = 0; for (int k = 0; k < 12; ++k) acc += resRun(B, 2 * k, B, 64 + 3 * k, 0);
      out = (acc * 0.4 + v.s[0] * n * 0.15) * vel; v.s[0] *= fdl::exp(-dt / 0.0008); v.p = 1; break; }
  }
  if (P.wear > 0) out += P.wear * 0.002 * v.rng.bi() * (v.p > 0 ? 1 : 0);
  if (!std::isfinite(out)) { out = 0; v.y = v.vv = 0; v.p = 0; std::fill(v.buf, v.buf + 4096, 0.0); std::fill(v.ap, v.ap + 24, 0.0); v.lp = v.lp2 = 0; std::fill(v.sv, v.sv + 4, 0.0); }
  return out < -8 ? -8 : (out > 8 ? 8 : out);
}
struct Norm { double n[kSrcTypes]; };
inline const Norm& calibrate(double sr) {
  static std::map<double, Norm> cache; static std::mutex mu; std::lock_guard<std::mutex> lk(mu);
  auto it = cache.find(sr); if (it != cache.end()) return it->second;
  Norm norm; for (double& x : norm.n) x = 1;
  for (int t = 1; t < kSrcTypes; ++t) {
    V v((uint32_t)(0xC0FFEE + t)); v.on = true; v.gate = true; v.vel = 1; v.f0 = 220;
    Par p; p.sr = sr; p.dt = 1 / sr; p.e = 0.5; p.b = 0.5; trigger(v, t, p);
    const int N = (int)(0.8 * sr), h = (int)(0.5 * sr); double sum = 0, pk = 0; int cnt = 0;
    for (int i = 0; i < N; ++i) { if (i == h) v.gate = false; double y = tick(v, t, p); if (i < h) { sum += y * y; ++cnt; pk = std::max(pk, std::fabs(y)); } }
    double rms = std::sqrt(sum / std::max(1, cnt)); norm.n[t] = clampd(std::min(0.1 / std::max(1e-4, rms), 0.45 / std::max(1e-4, pk)), 0.05, 40);
  }
  return cache.emplace(sr, norm).first->second;
}
struct Fx {
  DelayLine dl[2]; double ap[80] = {}, lp[28] = {}, lp2[4] = {}, svl[4] = {}, tapLp[24] = {}, apc[24] = {}; Bq hp[2], lpb[2], bq[2][4];
  double ph = 0, w = 0, env = 0, sup = 0, pop = 0, popEnv = 0, bubEnv = 0, bubF = 0, bubPh = 0, nz = 0, nz2 = 0, wob = 0, a = 0.5, b = 0.5, lastA = -1, lastB = -1, vv[2] = {0, 0};
  int lastType = -1; Rng rng;
  explicit Fx(double sr) : dl{DelayLine((long long)(int)(3.3 * sr)), DelayLine((long long)(int)(3.3 * sr))}, rng(0xABCDEF1u) {}
  void wipe() {
    std::fill(ap, ap + 80, 0.0); std::fill(lp, lp + 28, 0.0); std::fill(lp2, lp2 + 4, 0.0); std::fill(svl, svl + 4, 0.0); std::fill(tapLp, tapLp + 24, 0.0); std::fill(apc, apc + 24, 0.0); dl[0].clear(); dl[1].clear();
    sup = pop = popEnv = env = 0; for (int c = 0; c < 2; ++c) { hp[c].reset(); lpb[c].reset(); for (auto& q : bq[c]) q.reset(); }
  }
};
struct PresetRow { double mode, chaos, wear, grav, ovl; double s[4][8]; double f[3][4]; };
static const PresetRow PRESETS[] = {
  {2, 0, 0, 1, 0, {{2, .7, 0, .5, .5, 0, 0, 0}, {6, .7, 0, .5, .5, 0, 0, 0}, {5, .7, 0, .5, .5, 0, 0, 0}, {9, .7, 0, .5, .5, 0, 0, 0}}, {{1, .5, .5, .35}, {8, .5, .5, .25}, {0, .5, .5, .3}}},
  {2, .15, .2, 1, 0, {{2, .6, -12, .5, .4, 0, 0, 1}, {6, .7, 0, .6, .5, 2, .5, 1}, {8, .8, 0, .5, .6, 0, 0, 0}, {9, .8, 0, .5, .5, 0, 0, 0}}, {{1, .4, .5, .3}, {8, .3, .6, .25}, {0, .5, .5, .3}}},
  {2, .1, 0, 1.4, 0, {{3, .55, -24, .5, .85, 0, 0, 1}, {6, .6, 0, .5, .8, 0, 0, 1}, {5, .8, 0, .5, .6, 0, 0, 0}, {4, .7, -12, .4, .5, 0, 0, 0}}, {{2, .8, .6, .9}, {4, .6, .7, .3}, {0, .5, .5, .3}}},
  {2, .5, .7, .8, 0, {{11, .45, -12, .3, .5, 0, 0, 1}, {4, .7, 0, .6, .6, 0, 0, 0}, {10, .6, -12, .2, .6, 6, .6, 1}, {8, .8, 0, .5, .5, 3, .7, 0}}, {{1, .8, .8, .5}, {7, .3, .7, .2}, {6, .5, .6, .3}}},
  {2, 0, .1, 1, 0, {{1, .8, 0, .5, .4, 0, 0, 0}, {1, .6, 7, .4, .6, 0, 0, 0}, {1, .6, 12, .6, .8, 0, 0, 0}, {5, .6, 0, .5, .6, 0, 0, 0}}, {{4, .3, .5, .2}, {5, .4, .3, 1}, {0, .5, .5, .3}}},
  {2, .3, .3, 1, 0, {{11, .5, -12, .6, .6, 0, 0, 1}, {2, .7, -12, .5, .5, 0, 0, 0}, {3, .5, 0, .5, .4, 3, .8, 1}, {7, .8, 0, .6, .6, 0, 0, 0}}, {{3, .4, .7, .5}, {6, .6, .5, 1}, {1, .5, .5, .2}}},
  {2, .1, 0, 1, 0, {{6, .8, 0, .7, .5, 0, 0, 1}, {5, .8, 0, .5, .7, 0, 0, 0}, {6, .5, -12, .3, .8, 2, .6, 1}, {0, .7, 0, .5, .5, 0, 0, 0}}, {{4, .5, .5, .4}, {8, .4, .4, .3}, {1, .4, .5, .2}}},
  {2, .1, .2, 1, 0, {{9, .8, 0, .4, .6, 0, 0, 0}, {8, .8, 0, .5, .5, 0, 0, 0}, {2, .6, -12, .5, .3, 0, 0, 0}, {7, .7, 0, .5, .4, 0, 0, 0}}, {{5, .4, .5, 1}, {7, .3, .4, .2}, {0, .5, .5, .3}}},
  {1, .1, .2, 1, 0, {{2, .6, 0, .4, .5, 1, 1, 1}, {10, .7, 0, .3, .5, 1, 1, 1}, {3, .5, -12, .3, .5, 1, 1, 1}, {11, .35, 0, .2, .5, 1, 1, 1}}, {{6, .6, .6, 1}, {2, .5, .5, .6}, {8, .4, .5, .3}}},
};
constexpr int kPresets = 9;
struct Engine : EngineBase {
  std::vector<Spec> specs; const Norm* norm; Rng rng; std::vector<V> vo; std::vector<Fx> fx;
  double env[kSlots] = {}, fxLev[kFx] = {}, chaosT[kSlots] = {}, chaosS[kSlots] = {}, chaosB[kSlots] = {}, wearJ[kSlots] = {};
  Par par; double bend = 0, mod = 0, inEnv = 0, outLevel = 0, heat = 0, chaosN = 0, chaosTarget = 0, blow = 0, blowGain = 1, pw = 0; long long chaosCtr = 0;
  explicit Engine(double s) : EngineBase(s), rng(0x1234567u) {
    specs = makeSpecs(); initParams(specs); norm = &calibrate(s);
    for (int si = 0; si < kSlots; ++si) for (int k = 0; k < kPoly; ++k) vo.emplace_back(u32(0x1234567 + double(si * 97 + k * 31 + 1) * 40503));
    for (int f = 0; f < kFx; ++f) fx.emplace_back(s);
    par.sr = s; par.dt = 1 / s; reset();
  }
  V& voice(int s, int k) { return vo[(size_t)(s * kPoly + k)]; }
  void reset() {
    for (int s = 0; s < kSlots; ++s) for (int k = 0; k < kPoly; ++k) { V& x = voice(s, k); x.clear(); x.rng.s = u32(0x1234567 + double(s * 97 + k * 31 + 1) * 40503); }
    for (int f = 0; f < kFx; ++f) { Fx& x = fx[(size_t)f]; x.wipe(); x.w = x.wob = x.bubEnv = 0; x.lastType = -1; x.rng.s = u32(0xABCDEF1 + f * 7919); x.a = v[(size_t)fxParam(f, FA)]; x.b = v[(size_t)fxParam(f, FB)]; }
    std::fill(env, env + kSlots, 0.0); std::fill(fxLev, fxLev + kFx, 0.0); inEnv = outLevel = heat = 0; blow = 0; blowGain = 1; pw = 0;
    for (int s = 0; s < kSlots; ++s) { chaosT[s] = chaosS[s] = chaosB[s] = wearJ[s] = 0; if (v[(size_t)slotParam(s, SPlay)] > 0.5) { V& x = voice(s, 0); x.on = true; x.gate = true; x.drone = true; x.f0 = 110; x.vel = 0.9; x.age = 0; } }
  }
  void startDrone(int s) {
    V& x = voice(s, 0); x.on = true; x.gate = true; x.drone = true; x.f0 = 110; x.vel = 0.9;
    Par p; p.e = v[(size_t)slotParam(s, SA)]; p.b = v[(size_t)slotParam(s, SB)]; p.sr = sr; p.dt = 1 / sr; p.drone = true; trigger(x, (int)rnd(v[(size_t)slotParam(s, SType)]), p);
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    v[(size_t)id] = x;
    if (id == Preset) { loadPreset((int)rnd(x)); return; }
    if (id >= SlotBase && id < FxBase) {
      int s = (id - SlotBase) / SlotParams, q = (id - SlotBase) % SlotParams;
      if (q == SPlay || q == SType) {
        bool drone = v[(size_t)slotParam(s, SPlay)] > 0.5 && v[(size_t)slotParam(s, SType)] > 0.5;
        for (int k = 0; k < kPoly; ++k) { V& vv = voice(s, k); vv.clear(); uint32_t r = u32(0x7777 + double(s * 131 + k * 17 + 1) * 2246822519.0); vv.rng.s = r ? r : 1u; }
        if (drone) startDrone(s);
      }
    }
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; } void pressure(double) override {}
  void allNotesOff() override { for (auto& x : vo) x.gate = false; }
  void noteOn(int note, double vel) override {
    if (v[Mode] > 0.5 && v[Mode] < 1.5) return;
    for (int s = 0; s < kSlots; ++s) {
      int type = (int)rnd(v[(size_t)slotParam(s, SType)]); if (type <= 0 || v[(size_t)slotParam(s, SPlay)] > 0.5) continue;
      int pick = -1; double oldest = -1;
      for (int k = 0; k < kPoly; ++k) { if (!voice(s, k).on) { pick = k; break; } if (double(voice(s, k).age) > oldest) { oldest = double(voice(s, k).age); pick = k; } }
      V& x = voice(s, pick); uint32_t keep = x.rng.s; x.clear(); { uint32_t r = keep ^ 0x5bd1e995u; x.rng.s = r ? r : 1u; }
      x.on = true; x.gate = true; x.note = note; x.vel = clampd(vel, 0.05, 1); x.f0 = 440 * std::pow(2.0, (note - 69 + noteTune / 100) / 12);
      Par& p = par; p.e = v[(size_t)slotParam(s, SA)]; p.b = v[(size_t)slotParam(s, SB)]; p.vel = x.vel; p.g = v[Gravity]; p.drone = false; trigger(x, type, p);
    }
  }
  void noteOff(int note) override { for (auto& x : vo) if (x.on && x.note == note && !x.drone) x.gate = false; }
  void put(int id, double x) { set(id, x); v[(size_t)id] = x; writeParam(id, x); }
  void loadPreset(int pn) {
    const PresetRow& t = PRESETS[(int)clampd(pn, 0, kPresets - 1)];
    put(Mode, t.mode); put(Chaos, t.chaos); put(Wear, t.wear); put(Gravity, t.grav); put(Overload, t.ovl);
    for (int s = 0; s < kSlots; ++s) { const double* x = t.s[s]; for (int q = 0; q < 8; ++q) put(slotParam(s, q), x[q]); }
    for (int f = 0; f < kFx; ++f) { const double* x = t.f[f]; for (int q = 0; q < 4; ++q) put(fxParam(f, q), x[q]); }
  }
  void applyFx(int f) {
    Fx& x = fx[(size_t)f]; int type = (int)rnd(v[(size_t)fxParam(f, FType)]); double A = v[(size_t)fxParam(f, FA)], B = v[(size_t)fxParam(f, FB)];
    if (type == x.lastType && std::fabs(A - x.lastA) < 1e-4 && std::fabs(B - x.lastB) < 1e-4) return;
    if (type != x.lastType) x.wipe();
    x.lastType = type; x.lastA = A; x.lastB = B;
    if (type == 7) for (int c = 0; c < 2; ++c) { x.hp[c].set(4, 280 + 450 * A, 0.9, sr); x.lpb[c].set(3, 2200 + 2200 * A, 0.9, sr); }
    if (type == 8) { const double ratio[4] = {1, 2.32, 4.1, 6.2}, f0 = 90 + 520 * std::pow(A, 1.3), q = 5 + 55 * B; for (int c = 0; c < 2; ++c) for (int k = 0; k < 4; ++k) x.bq[c][k].set(5, f0 * ratio[k] * (c ? 1.012 : 1), q, sr); }
  }
  void process(float* outL, float* outR, int n) override {
    const int mode = (int)rnd(v[Mode]); const bool effect = mode >= 1; const double inGain = effect ? v[Input] : 0, dry = effect ? v[Dry] : 0;
    const double chaos = v[Chaos], wear = v[Wear], grav = v[Gravity], ovl = v[Overload], vol = std::pow(10.0, v[Volume] / 20), srf = sr, dt = 1 / srf;
    for (int f = 0; f < kFx; ++f) applyFx(f);
    Par& p = par; p.sr = srf; p.dt = dt; p.g = grav; p.wear = wear;
    int types[4]; double baseA[4], baseB[4], lvl[4], tune[4], damt[4]; int drvs[4];
    for (int s = 0; s < kSlots; ++s) { types[s] = (int)rnd(v[(size_t)slotParam(s, SType)]); baseA[s] = v[(size_t)slotParam(s, SA)]; baseB[s] = v[(size_t)slotParam(s, SB)]; lvl[s] = v[(size_t)slotParam(s, SLevel)]; tune[s] = v[(size_t)slotParam(s, STune)]; drvs[s] = (int)rnd(v[(size_t)slotParam(s, SDrive)]); damt[s] = v[(size_t)slotParam(s, SDriveAmt)]; }
    double io[2];
    for (int i = 0; i < n; ++i) {
      const double xl = 0, xr = 0; inEnv += (0 - inEnv) * 0.0008;
      if (--chaosCtr <= 0) { chaosCtr = (long long)(int)(srf * 0.07); chaosTarget = rng.uni(); for (int s = 0; s < kSlots; ++s) { chaosT[s] = rng.bi(); chaosB[s] = rng.uni() < chaos * 0.2 ? 0.5 * chaos : 0; } }
      chaosN += (chaosTarget - chaosN) * 0.0006;
      double sl = 0, sR = 0;
      for (int s = 0; s < kSlots; ++s) {
        const int type = types[s]; if (type <= 0) { env[s] *= 0.999; continue; }
        chaosS[s] += (chaosT[s] - chaosS[s]) * 0.0002; wearJ[s] += (rng.bi() - wearJ[s]) * 0.02;
        const int drv = drvs[s]; double dv = 0;
        if (drv == 1) dv = clampd(inEnv * 3, 0, 1); else if (drv >= 2 && drv <= 5 && drv - 2 != s) dv = clampd(env[drv - 2] * 4, 0, 1); else if (drv == 6) dv = chaosN;
        const double eBase = clampd(baseA[s] + damt[s] * dv, 0, 1.5); p.e = eBase; p.b = baseB[s];
        p.pm = std::pow(2.0, (tune[s] + chaosS[s] * chaos * 3 + wearJ[s] * wear * 0.35 + bend * 2) / 12);
        double acc = 0; const double cb = chaosB[s];
        for (int k = 0; k < kPoly; ++k) {
          V& x = voice(s, k); if (!x.on) continue;
          p.vel = x.vel; p.drone = x.drone; p.e = clampd(eBase + cb, 0, 1.5);
          const double y = tick(x, type, p); acc += y;
          if (!x.gate && !x.drone) { if (std::fabs(y) < 1e-6) { if (++x.quiet > (long long)(int)(0.5 * srf)) x.on = false; } else x.quiet = 0; }
        }
        acc *= norm->n[type] * lvl[s]; const double aa = std::fabs(acc); env[s] += (aa - env[s]) * (aa > env[s] ? 0.01 : 0.0005);
        const double pan = (s - 1.5) * 0.3; sl += acc * (1 - std::max(0.0, pan)) * 0.7; sR += acc * (1 + std::min(0.0, pan)) * 0.7;
      }
      double l = sl + xl * inGain, r = sR + xr * inGain;
      io[0] = l; io[1] = r; for (int f = 0; f < kFx; ++f) fxProcess(f, io); l = io[0] + xl * dry; r = io[1] + xr * dry;
      l *= vol; r *= vol;
      const double m2 = 0.5 * (l * l + r * r); pw += (m2 - pw) * 0.0003;
      if (ovl > 0) heat += dt * (ovl * 12 * pw - 0.15 * heat); else heat -= heat * dt * 0.5;
      if (heat < 0) heat = 0;
      if (heat > 1 && blow <= 0) { blow = 1.8; heat = 0.1; blowGain = 1; }
      double clunk = 0;
      if (blow > 0) { blow -= dt; blowGain = std::max(0.0, blowGain - dt / 0.005); const double t = 1.8 - blow; clunk = 0.35 * std::sin(TWO_PI * 70 * t) * fdl::exp(-t / 0.12) + 0.5 * rng.bi() * fdl::exp(-t / 0.02); }
      else if (blowGain < 1) blowGain = std::min(1.0, blowGain + dt / 0.3);
      l = l * blowGain + clunk; r = r * blowGain + clunk;
      if (!std::isfinite(l) || !std::isfinite(r)) { l = r = 0; }
      l = clampd(l, -16, 16); r = clampd(r, -16, 16); double a = std::fabs(l);
      if (a >= 0.8) l = (l < 0 ? -1 : 1) * (0.8 + 0.2 * fdl::tanh((a - 0.8) / 0.2));
      a = std::fabs(r); if (a >= 0.8) r = (r < 0 ? -1 : 1) * (0.8 + 0.2 * fdl::tanh((a - 0.8) / 0.2));
      outL[i] = (float)l; outR[i] = (float)r;
    }
  }
  void fxProcess(int f, double* io) {
    Fx& x = fx[(size_t)f]; const int type = x.lastType; if (type <= 0) { fxLev[f] *= 0.9995; return; }
    const double mix = v[(size_t)fxParam(f, FMix)], inL = io[0], inR = io[1], dt = 1 / sr;
    x.a += (v[(size_t)fxParam(f, FA)] - x.a) * 0.0004; x.b += (v[(size_t)fxParam(f, FB)] - x.b) * 0.0015; const double a = x.a, b = x.b;
    double wl = 0, wr = 0; const double nz = x.rng.bi(); DelayLine* dl = x.dl;
    switch (type) {
      case 1: {
        const double D = (0.02 + 0.1 * a) * sr, fb = 0.35 + 0.52 * b, shake = b * b; x.wob += dt * (3 + 5 * x.rng.uni()); x.nz += (nz - x.nz) * 0.0006;
        for (int c = 0; c < 2; ++c) {
          const double inp = (c ? inR : inL) * 0.5, Dc = D * (c ? 1.09 : 1) * (1 + shake * 0.012 * (std::sin(TWO_PI * x.wob * (c ? 1.1 : 1)) + 8 * x.nz));
          double d = dl[c].read(Dc); double* ap = x.ap; const int o0 = c * 40;
          for (int i = 0; i < 40; ++i) { const double y = 0.6 * d + ap[o0 + i]; ap[o0 + i] = d - 0.6 * y; d = y; }
          x.lp[c * 14] += (d - x.lp[c * 14]) * 0.5; const double o = x.lp[c * 14]; dl[c].push(clampd(inp + fb * o, -4, 4)); if (c) wr = o * 1.2; else wl = o * 1.2;
        }
        break; }
      case 2: {
        const double fc = 9000 * std::pow(0.04, a), co = fdl::exp(-TWO_PI * fc / sr); x.wob += dt * (0.4 + 1.2 * b); x.nz += (nz - x.nz) * 0.00005;
        if (x.rng.uni() < (0.5 + b * 14) * dt) { x.bubEnv = 0.4 + 0.6 * x.rng.uni(); x.bubF = 500 + 2200 * x.rng.uni(); x.bubPh = 0; }
        x.bubPh = wrap1(x.bubPh + x.bubF * dt); x.bubF *= 1 + 14 * dt; x.bubEnv *= fdl::exp(-dt / 0.012); const double bubble = x.bubEnv * std::sin(TWO_PI * x.bubPh) * 0.05 * b;
        for (int c = 0; c < 2; ++c) {
          const double inp = c ? inR : inL; dl[c].push(inp);
          const double mod_ = (0.0012 + 0.004 * b) * sr * (std::sin(TWO_PI * (x.wob + 0.37 * c)) * 0.6 + std::sin(TWO_PI * x.wob * 2.3 + 1 + c) * 0.25 + 8 * x.nz);
          const double s = dl[c].read(0.006 * sr + mod_); double* L = x.lp; const int o = c * 14;
          L[o] = s + (L[o] - s) * co; L[o + 1] = L[o] + (L[o + 1] - L[o]) * co; x.lp2[c * 2] += (L[o + 1] - x.lp2[c * 2]) * 0.014;
          const double w = L[o + 1] * (1 + 0.4 * a) + x.lp2[c * 2] * a * 0.9 + bubble; if (c) wr = w; else wl = w;
        }
        break; }
      case 3: {
        const double T0 = (0.04 + 0.4 * a) * sr, rr = 0.5 + 0.42 * b; dl[0].push(inL); dl[1].push(inR); double tl = 0, tr = 0, tt = 0, g = 0.9, gap = T0;
        for (int n = 0; n < 12; ++n) {
          tt += gap; gap *= rr; if (tt > 3.1 * sr) break; const double co = clampd(0.62 - 0.04 * n, 0.15, 0.7);
          for (int c = 0; c < 2; ++c) { const double s = dl[c].read(tt); x.tapLp[c * 12 + n] += (s - x.tapLp[c * 12 + n]) * co; }
          const bool even = (n & 1) == 0; const double t0 = x.tapLp[n], t1 = x.tapLp[12 + n];
          tl += t0 * g * (even ? 1 : 0.45) + t1 * g * (even ? 0.2 : 0.45); tr += t1 * g * (even ? 0.45 : 1) + t0 * g * (even ? 0.2 : 0.45); g *= 0.8;
        }
        const double da = 0.3 + 0.4 * b; double* vv = x.vv; vv[0] = tl; vv[1] = tr;
        for (int c = 0; c < 2; ++c) { double s = vv[c]; for (int i = 0; i < 12; ++i) { const double y = da * s + x.apc[c * 12 + i]; x.apc[c * 12 + i] = s - da * y; s = y; } vv[c] = s; }
        wl = vv[0] * 0.8; wr = vv[1] * 0.8; break; }
      case 4: {
        const double D = (0.005 + a * a * 0.4) * sr, fc = 7500 * std::pow(0.08, b), co = fdl::exp(-TWO_PI * fc / sr);
        for (int c = 0; c < 2; ++c) {
          const double inp = c ? inR : inL, d = dl[c].read(D * (c ? 1.031 : 1)), d2 = dl[c].read(D * 0.5 * (c ? 1.031 : 1)); const int o = c * 14;
          x.lp[o] = d + (x.lp[o] - d) * co; dl[c].push(clampd(inp + 0.58 * x.lp[o], -4, 4)); const double w = x.lp[o] - 0.25 * d2; if (c) wr = w; else wl = w;
        }
        break; }
      case 5: {
        const double target = 0.4 + 14 * a * a; x.w += (target - x.w) * dt / 0.4; x.ph = wrap1(x.ph + x.w * dt); const double depth = 0.2 + 0.8 * b, ex = 1 + 2 * a;
        const double g0 = 1 - depth * std::pow(0.5 + 0.5 * std::cos(TWO_PI * x.ph), ex), g1 = 1 - depth * std::pow(0.5 + 0.5 * std::cos(TWO_PI * (x.ph + 0.25)), ex); wl = inL * g0; wr = inR * g1; break; }
      case 6: {
        const double e = std::max(std::fabs(inL), std::fabs(inR)); x.env += (e - x.env) * (e > x.env ? 0.02 : 0.0004);
        const double tgt = clampd(x.env * 3, 0, 1); x.sup += (tgt - x.sup) * (tgt > x.sup ? dt / 0.08 : dt / 0.45); const double fc = 200 + 13000 * std::pow(1 - a * 0.97 * x.sup, 2.2);
        if (x.env < 0.01 && x.sup > 0.12 && x.pop < 0.5) { x.pop = 1; x.popEnv = b * x.sup; }
        if (x.env > 0.05) x.pop = 0;
        x.popEnv *= fdl::exp(-dt / 0.012); const double pk = x.popEnv * nz * 0.5;
        svf(x.svl, 0, inL + pk, fc, 0.7 + 2.5 * b, sr); wl = oLp; svf(x.svl, 2, inR + pk, fc, 0.7 + 2.5 * b, sr); wr = oLp; break; }
      case 7: {
        x.nz += (nz - x.nz) * 0.03;
        for (int c = 0; c < 2; ++c) {
          double s = fdl::tanh((c ? inR : inL) * 2) * 0.6; s = x.hp[c].run(s); s = x.lpb[c].run(s); s *= 1 + b * 3.2 * x.nz; s += x.nz * b * 0.2 * std::fabs(s);
          dl[c].push(s); const double d = dl[c].read(0.0031 * sr * (c ? 1.07 : 1)), w = (s + 0.35 * d) * 1.3; if (c) wr = w; else wl = w;
        }
        break; }
      case 8: {
        for (int c = 0; c < 2; ++c) { const double inp = c ? inR : inL; Bq* bq = x.bq[c]; const double q0 = bq[0].run(inp), q1 = bq[1].run(inp), q2 = bq[2].run(inp), q3 = bq[3].run(inp); const double s = inp * 0.2 + (q0 * 1 + q1 * 0.8 + q2 * 0.55 + q3 * 0.4) * 1.4; if (c) wr = s; else wl = s; }
        break; }
    }
    if (!std::isfinite(wl) || !std::isfinite(wr)) { wl = wr = 0; x.wipe(); }
    wl = clampd(wl, -16, 16); wr = clampd(wr, -16, 16); io[0] = inL * (1 - mix) + wl * mix; io[1] = inR * (1 - mix) + wr * mix;
    fxLev[f] += (std::max(std::fabs(wl), std::fabs(wr)) * mix - fxLev[f]) * 0.002;
  }
};
inline Info info() {
  return Info{"physica", "Physica", "Electro-mechanical synth: 23 modelled machines (balloon, motor, siren, bowed squeal, drips, slinky, mousetrap, ruler, fan, arc and more) in four slots that can drive one another, through three rooms made of things (spring tube, underwater mic, slinky echo, hose, fan tremolo, vacuum pump, paper cups, bucket), with Chaos, Wear, Gravity and a fuse that can blow.",
              makeSpecs(), makeGroups(), Theme{"physica", 0xff2e2417, 0xff0e0a06, 0xffe39a2e, 0xfff7ecd6, 0xfff5c264}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::physica
