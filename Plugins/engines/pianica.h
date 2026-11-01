// Pianica: modelled acoustic piano (no samples). Felt hammer pulse -> 1..3 waveguide strings per key (dispersion allpass chain, loss filter, fractional delay) sharing a bridge,
// soundboard modes + short tail, half-pedalling dampers, sympathetic resonance, sostenuto and soft pedal, mechanical noises. Notes outside MIDI 21-120 are ignored.
// Pedals are switch parameters (Sustain, Sostenuto, Soft) driving pedal(cc, value 0..1), which a host may also call directly.
#pragma once
#include "../common/engine.h"
namespace occ { namespace pianica {
enum { Preset, Hardness, Brightness, Decay, Aftersound, Detune, Stretch, Body, Sympathy, PedalNoise, Width, Level, Sustain, Sostenuto, SoftPedal, Count };
inline std::vector<Spec> makeSpecs() {
  return {P("Preset", "", 0, 10, 0, "%.0f", false, {"- (keep)", "Concert Grand", "Studio Bright", "Felt Ballad", "Upright", "Honky-Tonk", "Jazz Club", "Cathedral", "Muted Felt", "Old Parlour", "Close Mic"}),
          P("Hardness", "", 0, 1, 0.5, "%.2f"), P("Brightness", "", -1, 1, 0, "%+.2f"), P("Decay", "", 0.3, 3, 1, "%.2fx", true), P("Aftersound", "", 0, 1, 0.5, "%.2f"),
          P("Detune", "cents", 0, 6, 1.1, "%.1f ct"), P("Stretch", "", 0, 1.5, 1, "%.2f"), P("Body", "", 0, 1, 0.5, "%.2f"), P("Sympathy", "", 0, 1, 0.4, "%.2f"),
          P("Pedal noise", "", 0, 1, 0.35, "%.2f"), P("Width", "", 0, 1, 0.6, "%.2f"), P("Level", "dB", -24, 12, 0, "%+.1f dB"),
          P("Sustain pedal", "", 0, 1, 0, "%.0f", false, {"Up", "Down"}), P("Sostenuto pedal", "", 0, 1, 0, "%.0f", false, {"Up", "Down"}), P("Soft pedal", "", 0, 1, 0, "%.0f", false, {"Off", "On"})};
}
inline std::vector<Group> makeGroups() {
  return {{"Hammer & strings", {Preset, Hardness, Brightness, Decay, Aftersound, Detune, Stretch}}, {"Pedals", {Sustain, Sostenuto, SoftPedal, Sympathy, PedalNoise}}, {"Room", {Body, Width, Level}}};
}
constexpr int kVoices = 32, kMaxStr = 3, kAp = 4, kKeys = 88, kLow = 21, kHigh = 120, kBlock = 128, kExc = 2048, kMech = 16;
inline double centsStretch(double n) { double x = (n - 60) / 48; return 32 * (x + 0.2 * x * x * x); }
inline double inharmonicity(double n) { return n >= 60 ? 3e-4 * std::pow(2.0, (n - 60) / 9) : 3e-4 * std::pow(2.0, (n - 60) / 24); }
inline double promptRate(double n, double decay) { return 1.2 * std::pow(2.0, (n - 21) / 14) / std::max(0.05, decay); }
inline double afterRate(double n, double decay, double after) { return promptRate(n, decay) / (1 + 5 * after); }
inline double hammerSpeed(double vel) { return 0.05 + 3.95 * std::pow(clampd(vel, 0, 1), 1.6); }
inline double hammerContact(double n, double vel, double hard) { double v = hammerSpeed(vel); return clampd(0.004 * std::pow(2.0, -(n - 21) / 22) * std::pow(v / 1.4, -0.45) * std::pow(2.0, -(hard - 0.5) * 2.2), 0.00008, 0.012); }
inline double pulseShape(double u, double hard) { if (u <= 0 || u >= 1) return 0; return std::pow(std::sin(3.14159265 * std::pow(u, 0.85)), 1.4 + 2.6 * hard); }
inline int stringsFor(int n) { return n < 36 ? 1 : (n < 48 ? 2 : 3); }
static const double GT[17] = {0.0686, 0.0964, 0.0882, 0.1094, 0.1188, 0.1525, 0.2147, 0.2552, 0.3815, 0.4971, 0.7988, 1.1814, 2.5168, 2.1815, 2.3725, 4.2893, 4.2893};
inline double gNote(double n) { double x = clampd((n - 21) / 6.6, 0, 15.999); int i = (int)std::floor(x); double f = x - i; return GT[i] + (GT[i + 1] - GT[i]) * f; }
inline double apDelay(double a, double w) { return 1 - 2 * std::atan2(a * std::sin(w), 1 + a * std::cos(w)) / w; }
inline double lpDelay(double a, double w) { return std::atan2(a * std::sin(w), 1 - a * std::cos(w)) / w; }
inline double lpMag(double a, double w) { return (1 - a) / std::sqrt(std::max(1e-12, 1 + a * a - 2 * a * std::cos(w))); }
inline double solveEta(double delay, double w) { double lo = -0.6, hi = 0.25; for (int i = 0; i < 40; ++i) { double m = 0.5 * (lo + hi); if (apDelay(m, w) > delay) lo = m; else hi = m; } return 0.5 * (lo + hi); }
inline double dbToGain(double db) { return std::pow(10.0, db / 20); }
inline double jsMax(double a, double b) { if (a != a || b != b) return std::nan(""); return a > b ? a : b; }

struct Biquad {  // band-pass and high-shelf only (RBJ), transposed direct form II
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void bandPass(double f, double q, double sr) { f = clampd(f, 5, sr * 0.49); q = std::max(0.05, q); double w = 2 * kPi * f / sr, cw = std::cos(w), al = std::sin(w) / (2 * q), A0 = 1 + al; b0 = al / A0; b1 = 0; b2 = -al / A0; a1 = -2 * cw / A0; a2 = (1 - al) / A0; }
  void highShelf(double f, double q, double gainDb, double sr) {
    f = clampd(f, 5, sr * 0.49); q = std::max(0.05, q); double A = std::pow(10.0, gainDb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), al = std::sin(w) / (2 * q), s = 2 * std::sqrt(A) * al;
    double B0 = A * ((A + 1) + (A - 1) * cw + s), B1 = -2 * A * ((A - 1) + (A + 1) * cw), B2 = A * ((A + 1) + (A - 1) * cw - s), A0 = (A + 1) - (A - 1) * cw + s, A1 = 2 * ((A - 1) - (A + 1) * cw), A2 = (A + 1) - (A - 1) * cw - s;
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
  void reset() { z1 = z2 = 0; }
};
struct Comb {
  DelayLine d; int len = 1; double fb = 0.5, damp = 0.5, z = 0;
  explicit Comb(long long maxLen) : d(maxLen + 8) {}
  double run(double x) { double y = d.tap(len - 1); z = y * (1 - damp) + z * damp; d.push(x + z * fb); return y; }
  void clear() { d.clear(); z = 0; }
};
struct OnePoleHP {
  double a = 0, z = 0;
  void set(double hz, double sr) { a = std::exp(-2 * kPi * clampd(hz, 1, sr * 0.49) / sr); }
  double run(double x) { z = x * (1 - a) + z * a; return x - z; }
  void reset() { z = 0; }
};
struct Smooth {
  double cur = 0, target = 0, coef = 0.999;
  void setTime(double s, double sr) { coef = std::exp(-1 / std::max(1.0, s * sr)); }
  void reset(double v) { cur = target = v; }
  double next() { cur = target + (cur - target) * coef; return cur; }
};
struct Rng {
  uint32_t s = 0xA1B2C3D5u;
  double uni() { uint32_t t = s; t ^= t << 13; t ^= t >> 17; t ^= t << 5; s = t; return double(t >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
struct Str { int D = 2; double eta = 0, ez = 0, lpz = 0, g = 0.99, w = 1; double ap[kAp] = {0, 0, 0, 0}; };
struct V {
  Str s[3]; float* buf[3] = {nullptr, nullptr, nullptr}; float exc[kExc] = {};
  bool on = false, keyDown = false, sost = false; int note = -1; long long age = 0; int ns = 1, M = 0, exN = 0, exK = 0, exL = 0, bp = 1, w = 0;
  double ad = 0, alp = 0, c = 0, dgF = 0.99, dmp = 0, env = 0, outGain = 1, fade = 0, lastOut = 0, panL = 0.7, panR = 0.7;
};
struct Mech { bool on = false; double env = 0, dec = 0.99, g = 0, a1 = 0.5, a2 = 0.05, z1 = 0, z2 = 0, pl = 0.7, pr = 0.7; };
static const double MH[5] = {900, 4500, 420, 520, 380}, ML[5] = {120, 800, 60, 50, 45}, MD[5] = {0.030, 0.008, 0.040, 0.090, 0.060}, MG[5] = {2.2, 1.0, 2.6, 3.2, 1.6};
static const double TAB[10][11] = {  // hardness, brightness, decay, aftersound, detune, stretch, body, sympathy, pedal noise, width, level
    {0.50, 0.00, 1.0, 0.5, 1.1, 1.0, 0.50, 0.40, 0.35, 0.60, 0}, {0.75, 0.35, 0.9, 0.4, 0.9, 1.0, 0.35, 0.25, 0.20, 0.70, 0}, {0.20, -0.30, 1.2, 0.6, 1.0, 1.0, 0.60, 0.50, 0.40, 0.55, 0},
    {0.55, -0.10, 0.6, 0.3, 1.8, 0.6, 0.30, 0.15, 0.60, 0.35, 0}, {0.70, 0.25, 0.7, 0.3, 4.2, 0.5, 0.25, 0.10, 0.40, 0.50, 0}, {0.40, -0.15, 0.9, 0.5, 1.3, 0.9, 0.55, 0.35, 0.50, 0.50, 0},
    {0.45, -0.05, 1.8, 0.7, 1.0, 1.0, 0.80, 0.80, 0.15, 0.85, -1}, {0.05, -0.50, 0.5, 0.2, 0.7, 1.0, 0.30, 0.10, 0.30, 0.40, 1}, {0.35, -0.20, 0.8, 0.4, 3.0, 0.7, 0.50, 0.45, 0.50, 0.45, 0},
    {0.60, 0.15, 1.0, 0.5, 1.1, 1.0, 0.15, 0.15, 0.70, 0.80, 0}};

struct Engine : EngineBase {
  std::vector<Spec> specs; int bufLen = 1, mask = 0; std::vector<float> pool; std::vector<V> voices; Rng rng;
  double pedT = 0, pedS = 0, exprT = 1, exprS = 1; bool sostOn = false, softOn = false; uint8_t held[128];
  double pedCoef, dmpDn, dmpUp, fadeDecay; double sy1[kKeys], sy2[kKeys], syC[kKeys], syR2[kKeys], syB[kKeys], syG[kKeys]; bool sympAct = false;
  std::vector<Biquad> bodyL, bodyR; Biquad shelfL, shelfR; std::vector<Comb> cL, cR; OnePoleHP dcL, dcR;
  Smooth sLevel, sWidth, sBody, sSymp, sNoise, sBright; Smooth* sms[6]; std::vector<Mech> mech; int mechNext = 0;
  double tmp[kBlock], busL[kBlock], busR[kBlock], ped[kBlock]; double lastBright = 99; bool snap = true, flushed = false;
  explicit Engine(double s) : EngineBase(s) {
    specs = makeSpecs(); initParams(specs); int need = (int)std::floor(sr / 20) + 32; while (bufLen < need) bufLen <<= 1; mask = bufLen - 1;
    pool.assign((size_t)kVoices * kMaxStr * (size_t)bufLen, 0.f); voices.resize(kVoices);
    for (int i = 0; i < kVoices; ++i) for (int q = 0; q < kMaxStr; ++q) voices[(size_t)i].buf[q] = pool.data() + ((size_t)i * kMaxStr + (size_t)q) * (size_t)bufLen;
    for (int i = 0; i < 128; ++i) held[i] = 0;
    pedCoef = 1 - std::exp(-1 / (0.012 * sr)); dmpDn = 1 - std::exp(-1 / (0.03 * sr)); dmpUp = 1 - std::exp(-1 / (0.012 * sr)); fadeDecay = std::exp(-1 / (0.004 * sr));
    for (int k = 0; k < kKeys; ++k) {
      sy1[k] = sy2[k] = syG[k] = 0;
      double note = kLow + k, f = 440 * std::pow(2.0, (note - 69 + centsStretch(note) / 100) / 12), w = 2 * kPi * std::min(f, sr * 0.45) / sr, T = 2.2, r = std::exp(-6.9078 / (T * sr));
      syC[k] = 2 * r * std::cos(w); syR2[k] = r * r; syB[k] = (1 - r) * 2 * std::sin(w) * 0.7;
    }
    const double bf[6] = {62, 118, 196, 310, 470, 760}, bq[6] = {5, 5, 6, 6, 7, 7}; bodyL.resize(6); bodyR.resize(6);
    for (int i = 0; i < 6; ++i) { bodyL[(size_t)i].bandPass(bf[i], bq[i], sr); bodyR[(size_t)i].bandPass(bf[i] * 1.025, bq[i], sr); }
    const double cl[2][2] = {{0.0213, 0.0337}, {0.0239, 0.0381}};
    for (int i = 0; i < 2; ++i) { Comb a((long long)std::floor(0.05 * sr)), b((long long)std::floor(0.05 * sr)); a.len = (int)std::floor(cl[0][i] * sr); b.len = (int)std::floor(cl[1][i] * sr); cL.push_back(a); cR.push_back(b); }
    dcL.set(18, sr); dcR.set(18, sr);
    Smooth* l[6] = {&sLevel, &sWidth, &sBody, &sSymp, &sNoise, &sBright}; for (int i = 0; i < 6; ++i) { sms[i] = l[i]; sms[i]->setTime(0.02, sr); }
    mech.resize(kMech); for (int i = 0; i < kBlock; ++i) tmp[i] = busL[i] = busR[i] = ped[i] = 0;
    sLevel.reset(dbToGain(v[Level])); sWidth.reset(v[Width]); sBody.reset(v[Body]); sSymp.reset(v[Sympathy]); sNoise.reset(v[PedalNoise]); sBright.reset(v[Brightness]);
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[(size_t)id]; x = clampd(x, sp.min, sp.max); if (!sp.labels.empty()) x = std::floor(x + 0.5); v[(size_t)id] = x;
    switch (id) {
      case Preset: if (x > 0) applyPreset((int)x); return;
      case Level: sLevel.target = dbToGain(x); break; case Width: sWidth.target = x; break; case Body: sBody.target = x; break;
      case Sympathy: sSymp.target = x; break; case PedalNoise: sNoise.target = x; break; case Brightness: sBright.target = x; break;
      case Sustain: pedal(64, x); break; case Sostenuto: pedal(66, x); break; case SoftPedal: pedal(67, x); break;
      default: break;
    }
  }
  void applyPreset(int p) {
    const double* t = TAB[(int)clampd(p, 1, 10) - 1];
    for (int i = 0; i < 11; ++i) { v[(size_t)(Hardness + i)] = t[i]; writeParam(Hardness + i, t[i]); }
    sBody.target = v[Body]; sSymp.target = v[Sympathy]; sNoise.target = v[PedalNoise]; sWidth.target = v[Width]; sLevel.target = dbToGain(v[Level]); sBright.target = v[Brightness];
  }
  void expression(double e) { exprT = clampd(e, 0, 1); }
  void allNotesOff() override { for (auto& x : voices) x.keyDown = false; for (int i = 0; i < 128; ++i) held[i] = 0; }
  void spawnMech(int kind, double level, double pan) {
    if (level < 1e-4) return; Mech& m = mech[(size_t)mechNext]; mechNext = (mechNext + 1) % kMech;
    m.on = true; m.env = 1; m.dec = std::exp(-1 / (MD[kind] * sr)); m.g = level * MG[kind]; m.a1 = 1 - std::exp(-2 * 3.14159265 * MH[kind] / sr); m.a2 = 1 - std::exp(-2 * 3.14159265 * ML[kind] / sr); m.z1 = m.z2 = 0;
    double p = clampd(pan, -1, 1), a = (p + 1) * 0.78539816; m.pl = std::cos(a); m.pr = std::sin(a);
  }
  int allocate() {
    int best = -1; double bestCost = 1e30;
    for (int i = 0; i < kVoices; ++i) { V& x = voices[(size_t)i]; if (!x.on) return i; double cost = (x.keyDown ? 1e6 : 0) + (x.sost ? 5e5 : 0) + x.env * 1e3 - double(x.age) * 1e-7 - (x.dmp > 0.5 ? 1e4 : 0); if (cost < bestCost) { bestCost = cost; best = i; } }
    return best < 0 ? 0 : best;
  }
  void pedal(int cc, double value) {
    value = clampd(value, 0, 1); double nz = sNoise.target;
    if (cc == 64) {
      bool was = pedT > 0.5, now = value > 0.5; pedT = value;
      if (now && !was) spawnMech(4, 0.05 * nz, 0);
      if (!now && was) { spawnMech(3, 0.05 * nz, 0); for (auto& x : voices) if (x.on && !x.keyDown && !x.sost && x.env > 1e-4) spawnMech(0, 0.03 * nz * std::min(1.0, x.env * 20), (x.note - 64) / 44.0 * 0.5); }
    } else if (cc == 66) {
      bool now = value > 0.5;
      if (now && !sostOn) { for (auto& x : voices) x.sost = x.on && x.keyDown; spawnMech(4, 0.025 * nz, 0); }
      if (!now && sostOn) for (auto& x : voices) x.sost = false;
      sostOn = now;
    } else if (cc == 67) { bool now = value > 0.5; if (now != softOn) spawnMech(4, 0.02 * nz, 0); softOn = now; }
  }
  void noteOff(int note) override {
    if (note < 0 || note > 127) return; held[note] = 0; double nz = sNoise.target;
    for (auto& x : voices) if (x.on && x.note == note && x.keyDown) {
      x.keyDown = false; bool damped = !x.sost && pedS < 0.5;
      if (damped) spawnMech(0, 0.03 * nz * std::min(1.0, x.env * 20 + 0.05), (note - 64) / 44.0 * 0.5);
      spawnMech(1, 0.006 * nz, (note - 64) / 44.0 * 0.5);
    }
  }
  void noteOn(int note, double vel) override {
    if (note < kLow || note > kHigh) return; vel = clampd(vel, 0.01, 1); int idx = -1;
    for (int i = 0; i < kVoices; ++i) if (voices[(size_t)i].on && voices[(size_t)i].note == note) { idx = i; break; }
    bool re = idx >= 0; if (!re) idx = allocate();
    V& x = voices[(size_t)idx]; if (!re && x.on) x.fade = x.lastOut; else if (!re) x.fade = 0;
    startVoice(x, note, vel, re); held[note] = 1; spawnMech(2, 0.012 * sNoise.target * vel, (note - 64) / 44.0 * 0.5);
  }
  void startVoice(V& x, int noteI, double vel, bool re) {
    const double Vsr = sr; const double note = noteI;
    if (!re) { for (int s = 0; s < kMaxStr; ++s) { std::fill(x.buf[s], x.buf[s] + bufLen, 0.f); Str& st = x.s[s]; st.ez = 0; st.lpz = 0; for (double& q : st.ap) q = 0; } x.w = 0; x.age = 0; x.dmp = 0; }
    x.on = true; x.keyDown = true; x.sost = false; x.note = noteI; x.env = 0.1;
    double soft = softOn ? 1 : 0; int ns = stringsFor(noteI); x.ns = ns; double B = inharmonicity(note), cents = v[Stretch] * centsStretch(note) + noteTune;
    double f1 = std::min(440 * std::pow(2.0, (note - 69) / 12 + cents / 1200), Vsr * 0.17), Pd = Vsr / f1;
    double decay = v[Decay], after = v[Aftersound], Rp = promptRate(note, decay), Ra = ns == 1 ? std::sqrt(Rp * afterRate(note, decay, after)) : afterRate(note, decay, after);
    double fc = 700 * std::pow(2.0, (note - 21) / 22), Ps = 1 / f1, w0 = 2 * kPi * f1 / Vsr;
    auto hf = [&](double f) { return 1 + (f / fc) * (f / fc); };
    double fh = std::max(std::min(8 * f1, Vsr * 0.4), std::min(1500.0, Vsr * 0.4)), fh2 = std::max(fh, 1.8 * f1), wh = 2 * kPi * std::min(fh2, Vsr * 0.45) / Vsr;
    double Ga0 = std::pow(10.0, -0.05 * Ps * Ra * hf(f1)), Gah = std::pow(10.0, -0.05 * Ps * Ra * hf(fh2)), Rt = clampd(Gah / std::max(1e-9, Ga0), 1e-6, 1);
    double lo = 0, hi = 0.97;
    if (lpMag(0, wh) / lpMag(0, w0) > Rt) for (int i = 0; i < 40; ++i) { double m = 0.5 * (lo + hi); if (lpMag(m, wh) / lpMag(m, w0) > Rt) lo = m; else hi = m; }
    double alp = 0.5 * (lo + hi); double gloop = Ga0 * (1 / lpMag(alp, w0)); gloop = clampd(gloop, 0, 0.99995);
    double gb = 1;
    if (ns > 1) { double Gp0 = std::pow(10.0, -0.05 * Ps * Rp * hf(f1)); gb = clampd(Gp0 / std::max(1e-9, Ga0), 0.05, 1); }
    x.c = (1 - gb) / ns; x.alp = alp;
    int M = Pd < 8 ? 0 : (Pd < 14 ? 1 : (Pd < 24 ? 2 : kAp)); double bestAd = 0, bestCost = 1e30;
    if (M > 0 && B > 1e-6) {
      static const double parts[8] = {2, 3, 4, 5, 6, 8, 10, 12};
      for (int gi = 0; gi < 78; ++gi) {
        double ad = -0.0125 * gi, t1 = M * apDelay(ad, w0) + lpDelay(alp, w0); if (Pd - t1 < 3) continue; double cost = 0; int cnt = 0;
        for (int pi = 0; pi < 8; ++pi) {
          double n = parts[pi], sn = std::sqrt((1 + B * n * n) / (1 + B)), fn = n * f1 * sn; if (fn > 0.42 * Vsr) break;
          double wn = 2 * kPi * fn / Vsr, tn = M * apDelay(ad, wn) + lpDelay(alp, wn), want = Vsr / (f1 * sn) - Vsr / f1, err = ((tn - t1) - want) / (Vsr / (f1 * sn)); cost += err * err; ++cnt;
        }
        if (cnt > 0 && cost < bestCost) { bestCost = cost; bestAd = ad; }
      }
    }
    if (M > 0 && Pd - (M * apDelay(bestAd, w0) + lpDelay(alp, w0)) < 3) { bestAd = 0; M = (int)std::max(0.0, std::min((double)M, std::floor((Pd - 4) / 1))); }
    x.M = M; x.ad = bestAd;
    double d = v[Detune], rr = 0.75 + 0.5 * rng.uni(); const double pat3[3] = {-1, 0.15, 1}, pat2[2] = {-0.5, 0.5};
    for (int s = 0; s < ns; ++s) {
      double off = (ns == 1 ? 0 : (ns == 2 ? pat2[s] : pat3[s])) * d * (s == 0 ? rr : (2 - rr)), fs = f1 * std::pow(2.0, off / 1200), ws = 2 * kPi * fs / Vsr;
      double need = Vsr / fs - (M * apDelay(bestAd, ws) + lpDelay(alp, ws)); double Dint = std::floor(need - 1), del = need - Dint;
      if (Dint < 1) { Dint = 1; del = clampd(need - 1, 1, 2); } if (Dint > bufLen - 4) { Dint = bufLen - 4; del = 1; }
      Str& st = x.s[s]; st.D = (int)Dint; st.eta = solveEta(del, ws); st.g = gloop; st.w = 1;
    }
    if (soft > 0.5) { if (ns == 3) x.s[2].w = 0; else if (ns == 2) x.s[1].w = 0.45; }
    double Td = 0.55 * std::pow(2.0, -(note - 21) / 40); x.dgF = std::pow(10.0, -3 * Ps / Td);
    double hard = clampd(v[Hardness] + 0.18 * v[Brightness] - 0.3 * soft, 0, 1), vs = hammerSpeed(vel) * (soft > 0.5 ? 0.8 : 1), Tc = hammerContact(note, vel, hard) * (soft > 0.5 ? 1.35 : 1);
    int L = (int)clampd(std::floor(Tc * Vsr + 0.5), 4, kExc - 80); double sum = 0;
    for (int k = 0; k < L; ++k) { double u = (k + 0.5) / L, xx = pulseShape(u, hard); x.exc[k] = (float)xx; sum += xx; }
    double nrm = sum > 0 ? 1 / sum : 0, amp = (vs * 0.05 * (Vsr / f1) / ns) * nrm * gNote(note);
    for (int k = 0; k < L; ++k) x.exc[k] = (float)((double)x.exc[k] * amp);
    for (int k = L; k < kExc; ++k) x.exc[k] = 0;
    double beta = 1 / (8 + 6 * (note - 21) / 87); x.bp = (int)clampd(std::floor(beta * Pd + 0.5), 1, kExc - L - 2); x.exL = L; x.exN = L + x.bp; x.exK = 0; x.outGain = 1;
    double pan = (note - 64) / 44 * 0.5, a = (pan + 1) * 0.78539816; x.panL = std::cos(a); x.panR = std::sin(a);
  }
  void renderVoice(V& x, const double* pd, int m) {
    const int msk = mask, ns = x.ns, M = x.M; const double ad = x.ad, alp = x.alp, oma = 1 - alp, c = x.c; Str* sts = x.s; float** bufs = x.buf; double xs[3] = {0, 0, 0}; double e2 = 0;
    for (int i = 0; i < m; ++i) {
      double tgt = (x.keyDown || x.sost) ? 0 : 1 - pd[i]; x.dmp += (tgt - x.dmp) * (tgt > x.dmp ? dmpDn : dmpUp);
      double gd = 1 - x.dmp * (1 - x.dgF); double S = 0;
      for (int s = 0; s < ns; ++s) { xs[s] = bufs[s][(x.w - sts[s].D) & msk]; S += xs[s]; }
      double cS = c * S; double ex = 0;
      if (x.exK < x.exN) { int k = x.exK; double e0 = k < x.exL ? x.exc[k] : 0; int k2 = k - x.bp; double e1 = (k2 >= 0 && k2 < x.exL) ? x.exc[k2] : 0; ex = e0 - e1; ++x.exK; }
      for (int s = 0; s < ns; ++s) {
        Str& st = sts[s]; double y = xs[s] - cS;
        { double t = st.eta * y + st.ez; st.ez = y - st.eta * t; y = t; }
        double* ap = st.ap; for (int q = 0; q < M; ++q) { double t = ad * y + ap[q]; ap[q] = y - ad * t; y = t; }
        y = oma * y + alp * st.lpz; st.lpz = y; y = y * (st.g * gd) + ex * st.w; bufs[s][x.w & msk] = (float)y;
      }
      x.w = (x.w + 1) & msk;
      double o = S * x.outGain + x.fade; x.fade *= fadeDecay; tmp[i] = o; e2 += o * o;
    }
    x.lastOut = tmp[m - 1]; x.age += m; double rms = std::sqrt(e2 / m); x.env = jsMax(rms, x.env * 0.985);
    if (!std::isfinite(rms)) { x.on = false; return; }
    if (x.exK >= x.exN && double(x.age) > sr * 0.05) {
      if (x.env < 3e-6 || (!x.keyDown && !x.sost && x.dmp > 0.98 && x.env < 2e-5)) {
        x.on = false; x.env = 0; for (int s = 0; s < kMaxStr; ++s) { std::fill(x.buf[s], x.buf[s] + bufLen, 0.f); x.s[s].ez = x.s[s].lpz = 0; for (double& q : x.s[s].ap) q = 0; } x.fade = 0; x.lastOut = 0;
      }
    }
  }
  void process(float* outL, float* outR, int n) override { int pos = 0; while (pos < n) { int m = std::min(kBlock, n - pos); chunk(outL, outR, pos, m); pos += m; } }
  void chunk(float* oL, float* oR, int off, int m) {
    for (int i = 0; i < m; ++i) { pedS += (pedT - pedS) * pedCoef; ped[i] = pedS; busL[i] = busR[i] = 0; }
    for (auto& x : voices) {
      if (!x.on) continue; renderVoice(x, ped, m); if (!x.on) continue;
      double pl = x.panL, pr = x.panR; for (int i = 0; i < m; ++i) { busL[i] += tmp[i] * pl; busR[i] += tmp[i] * pr; }
    }
    double symAmt = sSymp.target;
    if (pedS > 1e-3 || sympAct) {
      for (int i = 0; i < m; ++i) {
        double xin = (busL[i] + busR[i]) * 0.5, p = ped[i] * (ped[i] > 0.02 ? 1 : 0); double sum = 0;
        for (int k = 0; k < kKeys; ++k) {
          double tg = held[kLow + k] ? 0 : p; syG[k] += (tg - syG[k]) * 0.002;
          double y = syB[k] * xin + syC[k] * sy1[k] - syR2[k] * sy2[k]; sy2[k] = sy1[k]; sy1[k] = y; sum += syG[k] * y;
        }
        double o = sum * 0.35 * symAmt * symAmt * (0.4 + 0.6 * symAmt); busL[i] += o; busR[i] += o * 0.97;
      }
      double tot = 0; for (int k = 0; k < kKeys; ++k) { tot += std::fabs(sy1[k]) + std::fabs(sy2[k]); if (std::fabs(sy1[k]) < 1e-15 && std::fabs(sy2[k]) < 1e-15) sy1[k] = sy2[k] = 0; }
      sympAct = tot > 1e-10 && (pedS > 1e-3 || tot > 1e-6);
      if (!sympAct) for (int k = 0; k < kKeys; ++k) sy1[k] = sy2[k] = syG[k] = 0;
    }
    for (auto& mc : mech) {
      if (!mc.on) continue;
      for (int i = 0; i < m; ++i) { double nz = rng.bi(); mc.z1 += mc.a1 * (nz - mc.z1); mc.z2 += mc.a2 * (mc.z1 - mc.z2); double s = (mc.z1 - mc.z2) * mc.env * mc.g; mc.env *= mc.dec; busL[i] += s * mc.pl; busR[i] += s * mc.pr; }
      if (mc.env < 1e-4) mc.on = false;
    }
    if (snap) { for (Smooth* s : sms) s->cur = s->target; exprS = exprT; snap = false; }
    double peak = 0;
    for (int i = 0; i < m; ++i) {
      exprS += (exprT - exprS) * 0.004;
      double bd = sBody.next(), lv = sLevel.next(), wd = sWidth.next(), br = sBright.next();
      if (std::fabs(br - lastBright) > 0.003 && (i & 31) == 0) { shelfL.highShelf(3000, 0.7, 9 * br, sr); Biquad &a = shelfL, &b = shelfR; b.b0 = a.b0; b.b1 = a.b1; b.b2 = a.b2; b.a1 = a.a1; b.a2 = a.a2; lastBright = br; }
      double l = dcL.run(busL[i]), r = dcR.run(busR[i]), bl = 0, brr = 0;
      for (int q = 0; q < 6; ++q) { double g = 0.55 - 0.05 * q; bl += bodyL[(size_t)q].run(l) * g; brr += bodyR[(size_t)q].run(r) * g; }
      double tl = 0, tr = 0; for (int q = 0; q < 2; ++q) { tl += cL[(size_t)q].run(l * 0.5); tr += cR[(size_t)q].run(r * 0.5); }
      l += bd * (bl * 1.4 + tl * 0.16); r += bd * (brr * 1.4 + tr * 0.16);
      l = shelfL.run(l); r = shelfR.run(r);
      double mid = (l + r) * 0.5, side = (l - r) * 0.5 * (wd * 1.6); double yl = (mid + side) * lv * exprS, yr = (mid - side) * lv * exprS;
      double a = std::fabs(yl); if (a >= 0.7) { double t = 0.7 + 0.3 * std::tanh((a - 0.7) / 0.3); yl = yl < 0 ? -t : t; }
      a = std::fabs(yr); if (a >= 0.7) { double t = 0.7 + 0.3 * std::tanh((a - 0.7) / 0.3); yr = yr < 0 ? -t : t; }
      if (!std::isfinite(yl) || !std::isfinite(yr)) yl = yr = 0;
      oL[off + i] = (float)yl; oR[off + i] = (float)yr; peak = std::max(peak, std::max(std::fabs(yl), std::fabs(yr)));
    }
    bool any = false; for (auto& x : voices) if (x.on) { any = true; break; }
    if (!any && !sympAct) {
      bool mchOn = false; for (auto& mc : mech) if (mc.on) { mchOn = true; break; }
      if (!mchOn && peak < 1e-9) {
        if (!flushed) { for (auto& b : bodyL) b.reset(); for (auto& b : bodyR) b.reset(); shelfL.reset(); shelfR.reset(); dcL.reset(); dcR.reset(); for (auto& c : cL) c.clear(); for (auto& c : cR) c.clear(); flushed = true; }
      } else flushed = false;
    } else flushed = false;
  }
};
inline Info info() {
  return Info{"pianica", "Pianica", "Modelled acoustic piano with no samples: felt hammer, one to three stiff waveguide strings per key, soundboard, sympathetic resonance and sustain, sostenuto and soft pedals.", makeSpecs(), makeGroups(),
              Theme{"pianica", 0xff2a201a, 0xff0b0807, 0xffe2b567, 0xfff6edda, 0xffffd994}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::pianica
