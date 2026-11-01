// Beachica: the shore and the sea, modelled. Surf bed, wind, gulls, whales, bubbles, pebbles, crickets and 14 playable voices, a Waterline control and Fibonacci shell/coral filters.
// 1:1 port of the web engine (worklet.js), including its 32-sample control sub-blocks.
#pragma once
#include "../common/engine.h"
#include <array>
namespace occ { namespace beachica {
enum { Preset, Volume, Waterline, Day, Surf, Wind, Gulls, Whales, Bubbles, Pebbles, Night, BedMode, WaveSize, WavePeriod, Foam, Backwash, Storm, TideSync,
       FibAmount, FibMode, FibRoot, FibQ, FibSpin, Pressure, Current, Attack, Release, Bright, Focus, Spread, ModWheel, Scale, Tonic, Tune, Octave, ReverbMix, ReverbSize, Count };
static const char* const VOICES[14] = {"Surf wash", "Tide choir", "Shell", "Coral glass", "Deep drone", "Sonar", "Whale song", "Dolphin", "Gull", "Bubbles", "Stones", "Buoy bell", "Foghorn", "Kelp pad"};
static const char* const SCALES[14] = {"12-tone equal", "Just (Shuddha)", "Raga Bhairav", "Raga Yaman", "Raga Todi", "Raga Kafi", "Pythagorean", "Chinese pentatonic", "Japanese In", "Maqam Rast", "Maqam Bayati", "Maqam Hijaz", "Slendro-ish", "Mongolian pentatonic"};
static const double JI[12] = {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7};
static const double SCALE_OFF[14][12] = {{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
    {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7}, {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7}, {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7},
    {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7}, {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7},
    {0, -9.8, 3.9, -5.9, 7.8, -2.0, 11.7, 2.0, -7.8, 5.9, -3.9, 9.8}, {0, 0, 3.9, 0, 7.8, 0, 0, 2.0, 0, 5.9, 0, 0}, {0, 0, 0, 0, 0, 0, 0, 2.0, 0, 0, 0, 0},
    {0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 50, 0}, {0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, {0, 0, 40, 0, 0, -20, 0, 20, 0, 0, -40, 0}, {0, 0, 3.9, 0, -13.7, 0, 0, 2.0, 0, -15.6, 0, 0}};
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> vn(VOICES, VOICES + 14), sn(SCALES, SCALES + 14);
  return {
    P("Preset", "", 0, 13, 13, "%.0f", false, vn),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"), P("Waterline", "", -100, 100, 35, "%.0f"), P("Time of day", "", 0, 2, 1, "%.0f", false, {"Day", "Golden hour", "Night"}),
    P("Surf", "%", 0, 100, 55, "%.0f %%"), P("Wind", "%", 0, 100, 30, "%.0f %%"), P("Gulls", "%", 0, 100, 30, "%.0f %%"), P("Whales", "%", 0, 100, 20, "%.0f %%"),
    P("Bubbles", "%", 0, 100, 25, "%.0f %%"), P("Pebbles", "%", 0, 100, 25, "%.0f %%"), P("Night life", "%", 0, 100, 40, "%.0f %%"), P("Bed", "", 0, 1, 0, "%.0f", false, {"Always", "With keys"}),
    P("Wave size", "%", 0, 100, 55, "%.0f %%"), P("Wave period", "s", 3, 16, 8, "%.1f s"), P("Foam", "%", 0, 100, 50, "%.0f %%"), P("Backwash", "%", 0, 100, 50, "%.0f %%"),
    P("Storm", "%", 0, 100, 0, "%.0f %%"), P("Tide sync", "%", 0, 100, 35, "%.0f %%"),
    P("Shell/coral", "%", 0, 100, 25, "%.0f %%"), P("Filter mode", "", 0, 4, 0, "%.0f", false, {"Auto", "Shell", "Coral", "Spiral", "Follow key"}),
    P("Filter root", "Hz", 60, 800, 220, "%.0f Hz", true), P("Filter Q", "", 5, 80, 25, "%.0f"), P("Spiral rate", "Hz", 0.02, 1, 0.1, "%.2f Hz", true),
    P("Pressure", "%", 0, 100, 40, "%.0f %%"), P("Current", "%", 0, 100, 30, "%.0f %%"),
    P("Attack", "ms", 5, 4000, 1500, "%.0f ms", true), P("Release", "ms", 20, 8000, 3500, "%.0f ms", true), P("Brightness", "%", 0, 100, 50, "%.0f %%"),
    P("Focus", "%", 0, 100, 50, "%.0f %%"), P("Spread", "%", 0, 100, 40, "%.0f %%"),
    P("Mod wheel", "", 0, 4, 0, "%.0f", false, {"Waterline", "Storm", "Wave size", "Shell/coral", "Brightness"}),
    P("Scale", "", 0, 13, 0, "%.0f", false, sn),
    P("Tonic", "", 0, 11, 0, "%.0f", false, {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}),
    P("Tune", "cents", -50, 50, 0, "%.0f c"), P("Octave", "", -2, 2, 0, "%.0f"), P("Reverb mix", "%", 0, 100, 25, "%.0f %%"), P("Reverb size", "%", 0, 100, 55, "%.0f %%")};
}
inline std::vector<Group> makeGroups() {
  return {{"Scene", {Waterline, Day, BedMode, Volume}},
          {"Bed", {Surf, Wind, Gulls, Whales, Bubbles, Pebbles, Night, Storm}},
          {"Waves", {WaveSize, WavePeriod, Foam, Backwash, TideSync}},
          {"Shell and coral", {FibAmount, FibMode, FibRoot, FibQ, FibSpin}},
          {"Water", {Pressure, Current}},
          {"Keys", {Attack, Release, Bright, Focus, Spread, ModWheel}},
          {"Tuning", {Scale, Tonic, Tune, Octave}},
          {"Room", {ReverbMix, ReverbSize}}};
}
// voice table: attack, release, bright, focus, oneShot
static const double VD[14][5] = {{900, 2500, 55, 40, 0}, {700, 1800, 55, 50, 0}, {30, 2500, 60, 50, 0}, {1200, 3000, 60, 50, 0}, {1800, 4000, 35, 50, 0}, {5, 600, 60, 50, 1}, {600, 3000, 45, 50, 0},
    {20, 400, 70, 50, 0}, {5, 200, 70, 50, 1}, {5, 200, 60, 50, 1}, {5, 300, 60, 50, 1}, {10, 2500, 55, 50, 0}, {250, 1800, 40, 50, 0}, {1500, 3500, 50, 50, 0}};
constexpr double PHI = 1.6180339887, TWO_PI = 6.2831853, HP = 1.5708;
static const double MUL13[6] = {1, 2, 3, 4, 6, 8}, AMP13[6] = {1, 0.6, 0.4, 0.3, 0.2, 0.12};
static const double FIBN[8] = {1, 2, 3, 5, 8, 13, 21, 34};

inline double jsround(double x) { return std::floor(x + 0.5); }
inline double sq(double x) { return x * x; }  // Math.pow(x, 2)
inline double clampf(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

struct Rng {
  uint32_t s;
  explicit Rng(uint32_t seed = 0) : s(seed) {}
  double uni() { uint32_t t = s; t ^= t << 13; t ^= t >> 17; t ^= t << 5; s = t; return (t >> 8) * (1.0 / 16777216); }
  double bi() { return uni() * 2 - 1; }
};
struct Bq {  // types: 3 LowPass, 4 HighPass, 5 BandPass
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double sr) {
    f = clampf(f, 5, sr * 0.49); q = std::max(0.05, q); double w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q), B0, B1, B2;
    if (t == 3) { B0 = (1 - cw) / 2; B1 = 1 - cw; B2 = B0; } else if (t == 4) { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; } else { B0 = al; B1 = 0; B2 = -al; }
    double A0 = 1 + al; b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = -2 * cw / A0; a2 = (1 - al) / A0;
  }
  void cp(const Bq& o) { b0 = o.b0; b1 = o.b1; b2 = o.b2; a1 = o.a1; a2 = o.a2; }
  double run(double x) { double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
  void reset() { z1 = z2 = 0; }
};
struct Rev {  // Freeverb-style room
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8], ai[2][4]; double cz[2][8];
  explicit Rev(double sr) {
    static const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) cb[ch][k].assign((size_t)std::floor((ct[k] + ch * 23) * sr / 44100) + 1, 0.f);
      for (int k = 0; k < 4; ++k) ab[ch][k].assign((size_t)std::floor((at[k] + ch * 23) * sr / 44100) + 1, 0.f);
      for (int k = 0; k < 8; ++k) { ci[ch][k] = 0; cz[ch][k] = 0; }
      for (int k = 0; k < 4; ++k) ai[ch][k] = 0;
    }
  }
  double tick(int ch, double inp, double fb, double damp) {
    double s = 0, d1 = 1 - damp;
    for (int k = 0; k < 8; ++k) {
      std::vector<float>& b = cb[ch][k]; int i = ci[ch][k]; double y = b[i]; cz[ch][k] = y * d1 + cz[ch][k] * damp; b[i] = (float)(inp + cz[ch][k] * fb);
      ci[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s += y;
    }
    for (int k = 0; k < 4; ++k) {
      std::vector<float>& b = ab[ch][k]; int i = ai[ch][k]; double bo = b[i], y = -s + bo; b[i] = (float)(s + bo * 0.5); ai[ch][k] = i + 1 >= (int)b.size() ? 0 : i + 1; s = y;
    }
    return s;
  }
};
inline double ar2gain(double c1, double c2) { double v = (1 - c2) / ((1 + c2) * ((1 - c2) * (1 - c2) - c1 * c1)); return 1 / std::sqrt(std::max(1e-9, v)); }
struct WTab { double WH[9], WH2[8]; WTab() { for (int h = 0; h < 9; ++h) WH[h] = 0; for (int h = 0; h < 8; ++h) WH2[h] = 0;
  for (int h = 1; h <= 8; ++h) WH[h] = std::pow((double)h, -1.1) * (0.7 + 0.3 * std::cos(h * 1.7));
  for (int h = 1; h <= 7; ++h) WH2[h] = std::pow((double)h, -1.15) * (0.7 + 0.3 * std::cos(h * 1.7)); } };
inline const WTab& wtab() { static const WTab t; return t; }

struct Gull {
  bool on = false; int left = 0; double gap = 0, t = 0, dur = 0.3, fa = 1200, fb = 2000, fc = 900, vib = 0.03, vr = 30, amp = 0.3, pan = 0.5, rasp = 0.4, rz = 0, base = 1400, ph = 0; double w[16] = {}; int H = 8; uint32_t cnt = 0;
  void syllable(Rng& r) {
    double b = base; fa = b * (0.8 + 0.15 * r.uni()); fb = b * (1.3 + 0.2 * r.uni()); fc = b * (0.5 + 0.15 * r.uni()); dur = 0.16 + 0.18 * r.uni(); vib = 0.01 + 0.04 * r.uni(); vr = 24 + 14 * r.uni(); t = 0;
  }
  void start(double b, double a, double p, int syl, Rng& r) { on = true; base = b; amp = a; pan = p; left = syl - 1; gap = 0; rasp = 0.2 + 0.5 * r.uni(); syllable(r); }
  double step(double sr, Rng& r) {
    if (!on) return 0;
    if (gap > 0) { gap -= 1 / sr; if (gap <= 0) { gap = 0; syllable(r); base *= 0.92 + 0.12 * r.uni(); } return 0; }
    double u = t / dur; double f = u < 0.28 ? fa + (fb - fa) * std::pow(u / 0.28, 0.8) : fb + (fc - fb) * std::pow((u - 0.28) / 0.72, 0.9);
    f *= 1 + vib * std::sin(TWO_PI * vr * t);
    if ((cnt++ & 31) == 0) {
      H = (int)clampf(std::trunc(0.42 * sr / std::max(200.0, f)), 2, 14); double s2 = 0;
      for (int h = 1; h <= H; ++h) { double fh = h * f; w[h] = std::pow((double)h, -0.65) * (0.25 + 1.8 * std::exp(-sq((fh - 1900) / 800)) + 0.8 * std::exp(-sq((fh - 3800) / 1100))); s2 += w[h] * w[h]; }
      double g = 1 / std::sqrt(std::max(1e-6, s2)); for (int h = 1; h <= H; ++h) w[h] *= g;
    }
    ph += TWO_PI * f / sr; if (ph > TWO_PI) ph -= TWO_PI;
    double s1 = std::sin(ph), c1 = std::cos(ph), sp = 0, sc = s1, sum = w[1] * s1;
    for (int h = 2; h <= H; ++h) { double sn = 2 * c1 * sc - sp; sum += w[h] * sn; sp = sc; sc = sn; }
    rz = 0.8 * rz + 0.2 * r.bi(); double env = std::sqrt(std::max(0.0, std::sin(3.14159 * std::min(1.0, u)))) * std::min(1.0, t / 0.008);
    t += 1 / sr; if (t >= dur) { if (left > 0) { --left; gap = 0.05 + 0.1 * r.uni(); } else on = false; }
    return sum * env * amp * 0.35 * (1 + rasp * 3.5 * rz);
  }
};
struct Whale {
  bool on = false; int mode = 0, left = 0, clicks = 0; double gap = 0, t = 0, dur = 2, f0 = 150, f1 = 150, amp = 0.2, pan = 0.5, ph = 0, nextClick = 0, clickEnv = 0, rate = 18; Bq bp;
  void note(Rng& r, bool first) {
    if (first) f0 = 110 + 220 * r.uni(); else f0 = f1;
    f1 = clampf(f0 * std::pow(2.0, (r.uni() - 0.5) * 1.4), 90, 420); dur = 1.4 + 1.8 * r.uni(); t = 0;
  }
  void startSong(Rng& r, double a, double p, int notes) { on = true; mode = 0; amp = a; pan = p; left = notes - 1; gap = 0; note(r, true); }
  void startClicks(Rng& r, double a, double p, double sr) { on = true; mode = 1; amp = a; pan = p; clicks = 20 + (int)std::trunc(r.uni() * 24); rate = 18; nextClick = 0; clickEnv = 0; bp.reset(); bp.set(5, 2800, 1.1, sr); }
  double step(double sr, Rng& r) {
    if (!on) return 0;
    if (mode == 1) {
      nextClick -= 1 / sr; if (nextClick <= 0 && clicks > 0) { clickEnv = 1; --clicks; rate = std::max(8.0, rate * 0.96); nextClick = 1 / rate; }
      if (clicks <= 0 && clickEnv < 1e-3) on = false;
      clickEnv *= std::exp(-1 / (sr * 0.0012)); return bp.run(r.bi() * clickEnv) * amp * 3;
    }
    if (gap > 0) { gap -= 1 / sr; if (gap <= 0) note(r, false); return 0; }
    double u = t / dur, sm = u * u * (3 - 2 * u); double f = f0 * std::pow(f1 / f0, sm); f *= 1 + 0.004 * std::sin(TWO_PI * 3.2 * t);
    ph += TWO_PI * f / sr; if (ph > TWO_PI) ph -= TWO_PI; double sum = 0; const double* WH2 = wtab().WH2; for (int h = 1; h <= 7; ++h) sum += WH2[h] * std::sin(h * ph);
    double env = std::pow(std::max(0.0, std::sin(3.14159 * std::min(1.0, u))), 1.4); t += 1 / sr;
    if (t >= dur) { if (left > 0) { --left; gap = 0.2 + 0.5 * r.uni(); } else on = false; }
    return sum * env * amp * 0.9;
  }
};
struct Vox {
  bool on = false, gate = false; int note = 60, type = 0, nm = 0; double f = 440, vel = 0.7, env = 0, age = 0, pan = 0.5, relK = 0.9999, atkK = 0.001;
  double ph[6] = {}, aux[8] = {}, y1[6] = {}, y2[6] = {}, c1[6] = {}, c2[6] = {}, bk[6] = {}; Bq bq[3]; double lpA = 0, lpZ = 0, quiet = 0;
};
struct Bub { bool on = false; long long delay = 0; double ph = 0, f = 800, k = 2, a = 0.2, dec = 0.999, pan = 0.5; };
struct Ping { bool on = false; double y1 = 0, y2 = 0, c1 = 0, c2 = 0, pan = 0.5; long long life = 0; };
struct Cricket { double ph, fc, chirp, pulse, period, rate, pan; };

struct Engine : EngineBase {
  Rng rng{0x2545F491u};
  double ph[2] = {0.2, 0.6}; Bq body[2], rum[2], foam[2], back[2], wind[2], rain[2];
  double swL = 0, swR = 0, crL = 0, crR = 0, bkL = 0, bkR = 0, swellMix = 0, backMix = 0, crashMix = 0, gust = 0.5;
  Gull gulls[4], keyGulls[6]; Whale whales[2]; Bub bubs[40]; Ping pings[64]; Cricket crickets[3];
  double gullT = 2, whaleT = 6, bubT = 0.5;
  Vox voices[16]; Bq sb[2], ub[2], kb[2]; double sbF = 20000, ubF = 9000, kbF = 20000;
  double age = 0, keysHeld = 0, bedGate = 1, lastHz = 0;
  Bq fib[2][8]; double lf[8] = {}, fw[8] = {}, spinPh = 0; bool fibInit = false;
  std::vector<DelayLine> cur; double curPh = 0, rumPh = 0, rumA, rumZ = 0; Rev rev;
  double wlS = 35, wlE = 35, bend = 0, bendS = 0, mw = 0, mwS = 0, expS = 1, tAbs = 0, flash = 0, vl = 0, vr = 0; long long nonFinite = 0;
  double sh[3] = {0, 0, 0}, shR[3] = {0, 0, 0};
  explicit Engine(double s) : EngineBase(s), rev(s) {
    initParams(makeSpecs());
    for (int i = 0; i < 3; ++i) { crickets[i] = Cricket{0, 4300.0 + 450 * i, 0.3 * i, 0, 0.5 + 0.09 * i, 26.0 + 3 * i, 0.3 + 0.2 * i}; }
    long long n = (long long)std::floor(0.06 * s); cur.emplace_back(n); cur.emplace_back(n);
    rumA = std::exp(-TWO_PI * 70 / s);
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; v[id] = x;
    if (id == Preset) {
      const double* d = VD[(int)clampf(jsround(x), 0, 13)];
      auto put = [&](int i, double val) { v[i] = val; writeParam(i, val); };
      put(Attack, d[0]); put(Release, d[1]); put(Bright, d[2]); put(Focus, d[3]);
    }
  }
  void allNotesOff() override { for (auto& vx : voices) if (vx.on) vx.gate = false; keysHeld = 0; }
  void pitchBend(double b) override { bend = b; }
  void modWheel(double m) override { mw = m; }
  void pressure(double) override {}
  double noteHz(int note, double extra) {
    int m = (int)jsround(v[Tonic]);
    return 440 * std::pow(2.0, (note + 12 * v[Octave] - 69 + (v[Tune] + SCALE_OFF[(int)jsround(v[Scale])][(((note - m) % 12) + 12) % 12] + extra) / 100) / 12);
  }
  void spawnGull(double base, double amp, double pan, int syl, Gull* pool, int n) {
    int slot = -1; for (int i = 0; i < n; ++i) if (!pool[i].on) { slot = i; break; }
    if (slot < 0) slot = (int)std::trunc(rng.uni() * n) % n;
    pool[slot].start(base, amp, pan, syl, rng);
  }
  void spawnBubble(double f, double a, double pan, long long delay) {
    int slot = -1; for (int i = 0; i < 40; ++i) if (!bubs[i].on) { slot = i; break; }
    if (slot < 0) return; Bub& b = bubs[slot];
    b.on = true; b.delay = delay; b.ph = 0; b.f = f; b.k = 1.2 + 1.5 * rng.uni(); b.a = a; b.pan = pan; b.dec = std::exp(-1 / (sr * (9 / f)));
  }
  void spawnPing(double f, double t60, double a, double pan) {
    int slot = -1; for (int i = 0; i < 64; ++i) if (!pings[i].on) { slot = i; break; }
    if (slot < 0) return; Ping& p = pings[slot];
    f = std::min(f, sr * 0.45); double w = TWO_PI * f / sr, r = std::exp(-6.9078 / (t60 * sr)); p.on = true; p.c1 = 2 * r * std::cos(w); p.c2 = -r * r; p.y1 = a * std::sin(w); p.y2 = 0; p.pan = pan; p.life = (long long)std::trunc(t60 * 1.2 * sr);
  }
  void modes(Vox& vx, int cnt, const double* ratio, const double* amp, const double* t60, double tScale, double strike) {
    int k = 0;
    for (int j = 0; j < cnt; ++j) {
      if (k >= 6) break; double fm = vx.f * ratio[j]; if (fm > sr * 0.45) { ++k; continue; }
      double w = TWO_PI * fm / sr, rr = std::exp(-6.9078 / (std::max(0.02, t60[j] * tScale) * sr));
      vx.c1[k] = 2 * rr * std::cos(w); vx.c2[k] = -rr * rr; vx.bk[k] = amp[j] * ar2gain(vx.c1[k], vx.c2[k]); vx.y1[k] = amp[j] * strike * std::sin(w); ++k;
    }
    vx.nm = k;
  }
  void startVox(Vox& vx, int note, double vel) {
    double sr_ = sr; int type = (int)clampf(jsround(v[Preset]), 0, 13);
    vx.on = true; vx.gate = true; vx.note = note; vx.type = type; vx.vel = vel; vx.f = noteHz(note, noteTune); vx.age = 0; vx.env = 0; vx.quiet = 0; vx.nm = 0; vx.lpZ = 0; vx.lpA = 0;
    for (int k = 0; k < 6; ++k) { vx.ph[k] = 0; vx.y1[k] = 0; vx.y2[k] = 0; vx.c1[k] = 0; vx.c2[k] = 0; vx.bk[k] = 0; } for (int k = 0; k < 8; ++k) vx.aux[k] = 0; for (auto& b : vx.bq) b.reset();
    double spr = v[Spread] * 0.01; vx.pan = clampf(0.5 + ((note - 60) / 48.0) * 0.3 * spr + (rng.uni() - 0.5) * 0.25 * spr, 0.05, 0.95); ++age;
    vx.atkK = 1 - std::exp(-1 / (sr_ * 0.001 * std::max(5.0, v[Attack]) * 0.35)); vx.relK = std::exp(-1 / (sr_ * 0.001 * std::max(20.0, v[Release]) * 0.35));
    if (VD[type][4] != 0) vx.env = 1;
    double foc = v[Focus] * 0.01, bri = v[Bright] * 0.01;
    auto lpHz = [&](double hz) { vx.lpA = std::exp(-TWO_PI * hz / sr_); };
    switch (type) {
      case 0: { double q = 8 + foc * 50; for (int k = 0; k < 3; ++k) vx.bq[k].set(5, std::min(vx.f * (k + 1), sr_ * 0.4), q, sr_); vx.aux[0] = std::sqrt(q * sr_ / (3.14159 * vx.f)) * 0.25; vx.aux[0] = std::min(vx.aux[0], 40.0); break; }
      case 1: vx.bq[0].set(5, 300 + 500 * foc, 4, sr_); vx.bq[1].set(5, 800 + 1200 * foc, 6, sr_); vx.bq[2].set(3, 700 + 7000 * bri, 0.7, sr_); vx.ph[0] = rng.uni(); vx.ph[1] = rng.uni(); vx.ph[2] = rng.uni(); break;
      case 2: { const double r[5] = {1, PHI, PHI * PHI, PHI * PHI * PHI, PHI * PHI * PHI * PHI}, a[5] = {1, 0.6, 0.45, 0.3, 0.2}, t[5] = {2.2, 1.6, 1.2, 0.9, 0.6}; modes(vx, 5, r, a, t, 0.5 + foc, 0.5); vx.aux[1] = 0.05; break; }
      case 3: { const double r[6] = {1, 2, 3, 5, 8, 13}, a[6] = {1, 0.5, 0.35, 0.25, 0.15, 0.08}, t[6] = {3, 2.6, 2.2, 1.8, 1.4, 1}; modes(vx, 6, r, a, t, 0.5 + foc, 0.1); break; }
      case 4: vx.ph[0] = rng.uni(); vx.ph[1] = rng.uni(); vx.ph[2] = rng.uni(); vx.ph[3] = rng.uni(); lpHz(120 + 900 * bri); break;
      case 5: vx.ph[0] = 0; break;
      case 6: lpHz(500 + 3000 * bri); break;
      case 7: vx.bq[0].set(5, 2800, 1.1, sr_); break;
      case 8: { int syl = 2 + (int)std::trunc(rng.uni() * 2.5); spawnGull(clampf(vx.f * 2, 500, 3200), 0.6 * vel, vx.pan, syl, keyGulls, 6); vx.on = false; flash = std::min(1.5, flash + 0.6); break; }
      case 9: {
        int nb = 5 + (int)std::trunc(rng.uni() * 5);
        for (int i = 0; i < nb; ++i) {
          double u1 = rng.uni(), u2 = rng.uni(), u3 = rng.uni(), u4 = rng.uni();
          spawnBubble(vx.f * (0.8 + 0.5 * u1), 0.3 * vel * (0.5 + 0.5 * u2), clampf(vx.pan + (u3 - 0.5) * 0.3, 0.05, 0.95), (long long)std::trunc(sr_ * (0.01 + 0.07 * i * (0.4 + u4))));
        }
        vx.on = false; flash = std::min(1.5, flash + 0.6); break; }
      case 10: { double tS = 0.5 + foc; spawnPing(vx.f, 0.35 * tS, 0.5 * vel, vx.pan); spawnPing(vx.f * 2.76, 0.2 * tS, 0.3 * vel, vx.pan); spawnPing(vx.f * 5.4, 0.12 * tS, 0.15 * vel, vx.pan); spawnPing(std::min(3500.0, vx.f * 7), 0.004, 0.4 * vel, vx.pan); vx.on = false; flash = std::min(1.5, flash + 0.6); break; }
      case 11: { const double r[5] = {1, 2.0, 2.57, 3.7, 4.9}, a[5] = {1, 0.55, 0.4, 0.25, 0.15}, t[5] = {5, 3.5, 2.8, 1.8, 1.2}; modes(vx, 5, r, a, t, 0.5 + foc, 0.6); vx.aux[2] = rng.uni() * 6.28; break; }
      case 12: lpHz(300 + 1500 * bri); vx.ph[0] = 0; vx.ph[1] = 0.3; break;
      case 13: for (int k = 0; k < 6; ++k) { vx.ph[k] = rng.uni(); vx.aux[k] = 0.07 + 0.25 * rng.uni(); } lpHz(400 + 4000 * bri); break;
    }
    flash = std::min(1.5, flash + 0.3 + 0.4 * vel);
  }
  void noteOn(int note, double vel) override {
    vel = clampf(vel, 0.02, 1); lastHz = noteHz(note, 0); keysHeld += 1;
    int slot = -1; for (int i = 0; i < 16; ++i) if (!voices[i].on) { slot = i; break; }
    if (slot < 0) { double low = 1e9; for (int i = 0; i < 16; ++i) { double s = voices[i].env * (voices[i].gate ? 2 : 1) / (1 + voices[i].age); if (s < low) { low = s; slot = i; } } }
    startVox(voices[slot], note, vel);
  }
  void noteOff(int note) override { keysHeld = std::max(0.0, keysHeld - 1); for (auto& vx : voices) if (vx.on && vx.gate && vx.note == note) vx.gate = false; }
  // one key voice for one sample, added into vl/vr
  void stepVox(Vox& vx, double swell, double bf, double spr, double br, double foc, const double* cf) {
    double sr_ = sr, dt = 1 / sr_; int type = vx.type; bool oneShot = VD[type][4] == 1; vx.age += dt;
    if (!oneShot) { if (vx.gate) vx.env += (1 - vx.env) * vx.atkK; else vx.env *= vx.relK; }
    double f = vx.f * bf, o = 0, oL = 0, oR = 0, age_ = vx.age; bool stereo = false;
    switch (type) {
      case 0: { double n = rng.bi(); double s = vx.bq[0].run(n) + 0.6 * vx.bq[1].run(n) + 0.35 * vx.bq[2].run(n); o = s * vx.aux[0] * (0.25 + 0.75 * swell) * (0.4 + 0.6 * br); break; }
      case 1: {
        double vib = 1 + 0.003 * std::sin(TWO_PI * 5 * age_), s0 = 0, s1 = 0, s2 = 0;
        for (int k = 0; k < 3; ++k) { double fk = f * vib * cf[k]; double dtp = std::min(0.4, fk / sr_); double p = vx.ph[k] + dtp; if (p >= 1) p -= 1; vx.ph[k] = p; double s = 2 * p - 1 - polyBlep(p, dtp); if (k == 0) s0 = s; else if (k == 1) s1 = s; else s2 = s; }
        double mid = s0 + s1 + s2; double fm = vx.bq[0].run(mid) * 1.6 + vx.bq[1].run(mid) * 1.2; double lpv = vx.bq[2].run(mid) * 0.35; o = (fm + lpv) * 0.5; oL = o + 0.3 * lpv * (s0 - s2); oR = o - 0.3 * lpv * (s0 - s2); stereo = true; break;
      }
      case 2: case 3: case 11: {
        double x = rng.bi() * (type == 2 ? (vx.gate ? 0.03 : 0) : (type == 3 ? 0.5 : 0)); double s = 0;
        for (int k = 0; k < vx.nm; ++k) { double y = vx.bk[k] * x + vx.c1[k] * vx.y1[k] + vx.c2[k] * vx.y2[k]; vx.y2[k] = vx.y1[k]; vx.y1[k] = y; s += y; }
        if (type == 11) { s *= (1 + 0.12 * std::sin(TWO_PI * 0.9 * age_ + vx.aux[2])) * 1.5; } if (type == 3) s *= (1 + 0.1 * std::sin(TWO_PI * 4 * age_)) * 0.6; o = s * (0.4 + 0.6 * br); break;
      }
      case 4: {
        double drift = 1 + 0.0007 * std::sin(TWO_PI * 0.07 * age_); double f2 = f * drift * 1.0007, f3 = f / drift * 0.9993;
        vx.ph[0] += f * 0.5 / sr_; vx.ph[1] += f / sr_; double s0 = std::sin(TWO_PI * vx.ph[0]), s1 = std::sin(TWO_PI * vx.ph[1]);
        double d2 = std::min(0.4, f2 / sr_); vx.ph[2] += d2; if (vx.ph[2] >= 1) vx.ph[2] -= 1; double s2 = 2 * vx.ph[2] - 1 - polyBlep(vx.ph[2], d2);
        double d3 = std::min(0.4, f3 / sr_); vx.ph[3] += d3; if (vx.ph[3] >= 1) vx.ph[3] -= 1; double s3 = 2 * vx.ph[3] - 1 - polyBlep(vx.ph[3], d3);
        vx.lpZ = vx.lpA * vx.lpZ + (1 - vx.lpA) * (0.5 * (s2 + s3)); double saws = vx.lpZ; double breathe = 0.85 + 0.15 * std::sin(TWO_PI * 0.11 * age_);
        o = (0.6 * s0 + 0.3 * s1 + 0.9 * saws) * breathe * 0.6; oL = o + 0.15 * saws * spr * 2; oR = o - 0.15 * saws * spr * 2; stereo = true; break;
      }
      case 5: {
        double fq = f * (1 + 0.012 * std::exp(-age_ / 0.2)); vx.ph[0] += TWO_PI * fq / sr_; if (vx.ph[0] > TWO_PI) vx.ph[0] -= TWO_PI;
        double e = 0;  // echoes at 0, 0.55, 1.3, 2.2 s
        if (age_ >= 0) { double a = age_; e += std::exp(-a / (0.35 + 0.5 * foc)) * (1 - std::exp(-a / 0.003)); }
        if (age_ >= 0.55) { double a = age_ - 0.55; e += 0.4 * std::exp(-a / (0.35 + 0.5 * foc)) * (1 - std::exp(-a / 0.003)); }
        if (age_ >= 1.3) { double a = age_ - 1.3; e += 0.2 * std::exp(-a / (0.35 + 0.5 * foc)) * (1 - std::exp(-a / 0.003)); }
        if (age_ >= 2.2) { double a = age_ - 2.2; e += 0.1 * std::exp(-a / (0.35 + 0.5 * foc)) * (1 - std::exp(-a / 0.003)); }
        o = std::sin(vx.ph[0]) * e * 0.7; if (age_ > 6) vx.on = false; break;
      }
      case 6: {
        double glide = 1 - 0.2 * std::exp(-age_ / 0.5); double vib = 1 + 0.005 * std::sin(TWO_PI * 0.5 * age_) * std::min(1.0, age_) + 0.003 * std::sin(TWO_PI * 4 * age_) * std::min(1.0, age_ * 0.5);
        double fw_ = f * glide * vib; vx.ph[0] += TWO_PI * fw_ / sr_; if (vx.ph[0] > TWO_PI) vx.ph[0] -= TWO_PI; double s = 0; double ph_ = vx.ph[0]; const double* WH = wtab().WH;
        for (int h = 1; h <= 8; ++h) { if (h * fw_ > sr_ * 0.45) break; s += WH[h] * std::sin(h * ph_); }
        vx.lpZ = vx.lpA * vx.lpZ + (1 - vx.lpA) * s; o = vx.lpZ * 0.9; break;
      }
      case 7: {
        double fq = f * (0.6 + 0.4 * (1 - std::exp(-age_ / 0.12)) * 2.25 * 0.6 + 0.4 * 0) * (1 + 0.04 * std::sin(TWO_PI * 7 * age_)); vx.ph[0] += TWO_PI * fq / sr_; if (vx.ph[0] > TWO_PI) vx.ph[0] -= TWO_PI;
        double s = std::sin(vx.ph[0]) + 0.35 * std::sin(2 * vx.ph[0]) * br * 2 + 0.12 * std::sin(3 * vx.ph[0]);
        if (age_ < 0.45) { vx.aux[0] -= dt; if (vx.aux[0] <= 0) { vx.aux[1] = 1; vx.aux[0] = 1.0 / 45; } } vx.aux[1] *= std::exp(-1 / (sr_ * 0.0008)); s = s * 0.5 + vx.bq[0].run(rng.bi() * vx.aux[1]) * 1.4; o = s * 0.7; break;
      }
      case 12: {
        double fq = f * (1 + 0.04 * std::exp(-age_ / 0.12)) * (1 + 0.002 * std::sin(TWO_PI * 0.12 * age_)); double s = 0;
        for (int k = 0; k < 2; ++k) { double dtp = std::min(0.4, fq * (k ? 1.003 : 1) / sr_); vx.ph[k] += dtp; if (vx.ph[k] >= 1) vx.ph[k] -= 1; s += 2 * vx.ph[k] - 1 - polyBlep(vx.ph[k], dtp); }
        vx.lpZ = vx.lpA * vx.lpZ + (1 - vx.lpA) * (0.5 * s + 0.05 * rng.bi()); o = vx.lpZ * 1.5; break;
      }
      case 13: {
        double s = 0; for (int k = 0; k < 6; ++k) { double m = MUL13[k]; if (f * m > sr_ * 0.45) break; vx.ph[k] += f * m * (1 + ((k & 1) ? 0.0012 : -0.0008)) / sr_; if (vx.ph[k] >= 1) vx.ph[k] -= 1; s += AMP13[k] * std::sin(TWO_PI * vx.ph[k]) * (0.55 + 0.45 * std::sin(TWO_PI * vx.aux[k] * age_ + k * 1.3)); }
        vx.lpZ = vx.lpA * vx.lpZ + (1 - vx.lpA) * s; o = vx.lpZ * 0.45; oL = o; oR = o; stereo = true; break;
      }
    }
    if (!stereo) { oL = oR = o; }
    if (!(std::fabs(oL) < 50 && std::fabs(oR) < 50)) { vx.on = false; ++nonFinite; return; }
    double g = vx.env * (0.3 + 0.7 * vx.vel) * expS, pl = std::cos(vx.pan * HP) * 1.414, pr = std::sin(vx.pan * HP) * 1.414;
    vl += oL * g * pl; vr += oR * g * pr;
    if (!oneShot) { if (!vx.gate && vx.env < 1e-4) vx.on = false; } else if (vx.age > 12) vx.on = false;
  }
  void updateFib(double wlE_) {
    int mode = (int)jsround(v[FibMode]); int eff = mode; if (mode == 0) eff = wlE_ > -8 ? 1 : 2; if (mode == 4) eff = 1;
    double root = v[FibRoot]; if (mode == 4 && lastHz > 0) root = clampf(lastHz, 60, 1200); double s = spinPh - std::floor(spinPh), q = v[FibQ];
    for (int k = 0; k < 8; ++k) {
      double tf, w;
      if (eff == 1) { tf = root * std::pow(PHI, (double)k); w = 1 / (1 + 0.12 * k); }
      else if (eff == 2) { tf = root * 0.5 * FIBN[k]; w = 1 / (1 + 0.1 * k); }
      else { tf = root * std::pow(PHI, k + s); double u = (k + s) / 8; w = std::sin(3.14159 * clampf(u, 0, 1)) * 1.3; }
      tf = clampf(tf, 40, sr * 0.42); double lt = std::log(tf);
      if (!fibInit) { lf[k] = lt; fw[k] = w; } else { lf[k] += (lt - lf[k]) * (eff == 3 ? 0.2 : 0.03); fw[k] += (w - fw[k]) * 0.05; }
      fib[0][k].set(5, std::exp(lf[k]), q, sr); fib[1][k].cp(fib[0][k]);
    }
    fibInit = true;
  }
  static void shape(double p, double* out) { p -= std::floor(p); out[0] = p < 0.55 ? std::pow(p / 0.55, 2.2) : std::exp(-(p - 0.55) * 6); double x = (p - 0.58) / 0.05; out[1] = std::exp(-x * x); out[2] = p > 0.7 ? std::sin(3.14159 * (p - 0.7) / 0.3) : 0; }
  void process(float* outL, float* outR, int n) override {
    const std::vector<double>& V = v; const double sr_ = sr, dt = 1 / sr_; int done = 0;
    const double rvMix = V[ReverbMix] * 0.01, vg = std::pow(10.0, V[Volume] / 20), cu = V[Current] * 0.01, ts = V[TideSync] * 0.01, pressure_ = V[Pressure], foamK = V[Foam] * 0.02, backK = V[Backwash] * 0.02, surfPct = V[Surf] * 0.01, windPct = V[Wind] * 0.01;
    const double fibQ = V[FibQ];
    while (done < n) {
      const int blk = std::min(32, n - done);
      mwS += (mw - mwS) * 0.05; bendS += (bend - bendS) * 0.2; expS += (1 - expS) * 0.02; const int mwm = (int)jsround(V[ModWheel]); const double mwS_ = mwS;
      const double wlT = clampf(V[Waterline] - (mwm == 0 ? 130 * mwS_ : 0), -100, 100); wlS += (wlT - wlS) * 0.01; const double wlE_ = wlE = wlS;
      const double storm = clampf(V[Storm] * 0.01 + (mwm == 1 ? mwS_ : 0), 0, 1), wsize = clampf(V[WaveSize] * 0.01 + (mwm == 2 ? mwS_ * 0.6 : 0), 0, 1), fibA = clampf(V[FibAmount] * 0.01 + (mwm == 3 ? mwS_ : 0), 0, 1);
      const double brightEff = mwm == 4 ? V[Bright] + (100 - V[Bright]) * mwS_ : V[Bright];  // mod wheel 'Brightness': opens the key voices' tone and the key bus filter toward fully bright (not in the web original; other wheel choices are unchanged)
      const double depth = clampf(-wlE_ * 0.01, 0, 1), height = clampf(wlE_ * 0.01, 0, 1);
      const double bob = (1 - std::min(1.0, std::fabs(wlE_) / 30)) * 0.3 * std::sin(TWO_PI * (ph[0] + 0.1)), dEff = clampf(depth + bob, 0, 1);
      const int day = (int)jsround(V[Day]); const double gullDay = day == 0 ? 1 : (day == 1 ? 0.7 : 0.04), cricketDay = day == 0 ? 0 : (day == 1 ? 0.25 : 1);
      if ((int)jsround(V[BedMode]) == 1) { double want = keysHeld > 0.5 ? 1 : 0; bedGate += (want - bedGate) * (want > bedGate ? 0.002 : 0.00012); } else bedGate += (1 - bedGate) * 0.01;
      const double bedGate_ = bedGate;
      const double surfG = 1 - 0.35 * dEff, windG = std::pow(1 - dEff, 1.5), gullG = sq(1 - dEff), cricG = gullG, pebG = 1 - 0.5 * dEff, whaleG = 0.25 + 0.75 * dEff, bubG = 0.08 + 0.92 * dEff;
      const double period = std::max(3.0, V[WavePeriod]);
      shape(ph[0], sh); const double sw0 = sh[0], cr0 = sh[1], bk0 = sh[2]; shape(ph[1], sh); const double sw1 = sh[0], cr1 = sh[1], bk1 = sh[2];
      shape(ph[0] - 0.06, shR); const double swR0 = shR[0], crR0 = shR[1], bkR0 = shR[2]; shape(ph[1] - 0.06, shR); const double swR1 = shR[0], crR1 = shR[1], bkR1 = shR[2];
      const double tL = 0.65 * sw0 + 0.45 * sw1, tR = 0.65 * swR0 + 0.45 * swR1, cL = 0.65 * cr0 + 0.45 * cr1, cR = 0.65 * crR0 + 0.45 * crR1, bL = 0.65 * bk0 + 0.45 * bk1, bR = 0.65 * bkR0 + 0.45 * bkR1;
      swellMix = 0.5 * (tL + tR) * 0.9; backMix = 0.5 * (bL + bR); crashMix = 0.5 * (cL + cR);
      { double s = 0.5 * (tL + tR); body[0].set(3, 250 + 2600 * s * (0.5 + wsize) + 800 * storm, 0.7, sr_); body[1].cp(body[0]); }
      rum[0].set(3, 90, 0.9, sr_); rum[1].cp(rum[0]); foam[0].set(5, 4500, 0.4, sr_); foam[1].cp(foam[0]); back[0].set(5, 1100, 0.6, sr_); back[1].cp(back[0]);
      gust = 0.5 + 0.25 * std::sin(tAbs * 0.31) + 0.15 * std::sin(tAbs * 0.77 + 1) + 0.1 * std::sin(tAbs * 1.9 + 2); const double gu = clampf(gust * (1 + 1.5 * storm), 0.1, 2);
      const double wfc = 280 + 800 * gu + 400 * storm; wind[0].set(5, wfc, 1.3, sr_); wind[1].cp(wind[0]); const double windComp = std::sqrt(1.3 * sr_ / (3.14159 * wfc)) * 0.3;
      rain[0].set(4, 4000, 0.7, sr_); rain[1].cp(rain[0]);
      const double sbT = 20000 * std::pow(10.0, -2 * dEff), ubT = 9000 - 4500 * dEff, kbT = 20000 * std::pow(10.0, -1.3 * dEff) * (0.35 + 0.65 * (0.4 + 0.6 * std::min(1.0, brightEff * 0.02)));
      sbF += (sbT - sbF) * 0.2; ubF += (ubT - ubF) * 0.2; kbF += (kbT - kbF) * 0.2;
      sb[0].set(3, sbF, 0.7, sr_); sb[1].cp(sb[0]); ub[0].set(3, ubF, 0.7, sr_); ub[1].cp(ub[0]); kb[0].set(3, kbF, 0.7, sr_); kb[1].cp(kb[0]);
      spinPh += dt * blk * V[FibSpin]; if (fibA > 0.001) updateFib(wlE_);
      const double gl = V[Gulls] * 0.01, wh = V[Whales] * 0.01, bu = V[Bubbles] * 0.01, pe = V[Pebbles] * 0.01, ni = V[Night] * 0.01;
      gullT -= dt * blk;
      if (gullT <= 0) {
        gullT = (2.5 + 6.5 * rng.uni()) / (0.3 + 1.5 * gl);
        if (gl * gullG * gullDay > 0.02) { double a1 = rng.uni(), a2 = rng.uni(), a3 = rng.uni(), a4 = rng.uni(); spawnGull(1100 + 700 * a1, 0.5 * gl * gullG * gullDay * (0.4 + 0.6 * a2), 0.15 + 0.7 * a3, 1 + (int)std::trunc(a4 * 4), gulls, 4); }
      }
      whaleT -= dt * blk;
      if (whaleT <= 0) {
        whaleT = (12 + 18 * rng.uni()) / (0.4 + 1.5 * wh);
        if (wh * whaleG > 0.02) {
          for (int q = 0; q < 2; ++q) { Whale& w = whales[q]; if (!w.on) { double a = 0.5 * wh * whaleG, p = 0.15 + 0.7 * rng.uni(); if (rng.uni() < 0.8) { int nn = 3 + (int)std::trunc(rng.uni() * 3); w.startSong(rng, a, p, nn); } else w.startClicks(rng, a, p, sr_); break; } }
        }
      }
      const double bubRate = (0.3 + 22 * dEff + 5 * storm * height) * (0.2 + bu * 1.6); bubT -= dt * blk;
      if (bubT <= 0) {
        bubT = -std::log(std::max(1e-4, rng.uni())) / std::max(0.05, bubRate);
        if (bu * bubG > 0.01) { double b1 = rng.uni(), b2 = rng.uni(), b3 = rng.uni(); spawnBubble(std::exp(std::log(350.0) + std::log(10.0) * b1), 0.25 * bu * (0.3 + 0.7 * b2) * (0.3 + 0.7 * bubG), b3, 0); }
      }
      const double pebRate = 160 * (backMix * 0.9 + crashMix * 0.5) * pe * (0.3 + 0.7 * wsize) * pebG, pebP = pebRate * dt;
      const double surfLvl0 = surfPct * (1 + 0.8 * storm) * surfG, sz = 0.3 + 1.2 * wsize, swellK = (1 - ts) + ts * (0.3 + 0.7 * std::min(1.0, swellMix * 1.2)), swellV = std::min(1.0, swellMix * 1.2);
      const double spr = V[Spread] * 0.01, br = brightEff * 0.01, foc = V[Focus] * 0.01, bf = std::pow(2.0, bendS * 2 / 12);
      const double cf[3] = {std::pow(2.0, -(2 + 18 * spr) / 1200), 1, std::pow(2.0, (2 + 18 * spr) / 1200)};
      const double useGull = gullG;
      const bool cricketOn = cricketDay * ni * cricG > 0.002;
      const double rainK = 0.25 * storm * std::min(1.0, 0.3 + windG) * (1 - 0.5 * dEff), windK = windPct * gu * windG * 0.5 * windComp;
      for (int j = 0; j < blk; ++j) {
        const int i = done + j;
        swL += (tL - swL) * 0.01; swR += (tR - swR) * 0.01; crL += (cL - crL) * 0.01; crR += (cR - crR) * 0.01; bkL += (bL - bkL) * 0.01; bkR += (bR - bkR) * 0.01;
        double sbL = 0, sbR = 0, ubL = 0, ubR = 0;
        for (int c = 0; c < 2; ++c) {
          const double sw = c ? swR : swL, cr = c ? crR : crL, bk = c ? bkR : bkL;
          const double bodyv = body[c].run(rng.bi()) * 1.4 * std::pow(sw, 0.9) * sz;
          const double rumv = rum[c].run(rng.bi()) * 8 * (0.5 * sw * sw + cr) * sz;
          const double foamv = foam[c].run(rng.bi()) * 0.9 * (cr + 0.3 * sw * sw * sw) * foamK * sz;
          const double backv = back[c].run(rng.bi()) * 1.6 * bk * backK * (0.4 + 0.6 * sz);
          double s = (bodyv + rumv + foamv + backv) * surfLvl0; s += wind[c].run(rng.bi()) * windK; s += rain[c].run(rng.bi()) * rainK;
          if (c) sbR = s; else sbL = s;
        }
        for (int q = 0; q < 4; ++q) { Gull& g = gulls[q]; if (g.on) { double y = g.step(sr_, rng); sbL += y * std::cos(g.pan * HP) * useGull; sbR += y * std::sin(g.pan * HP) * useGull; } }
        for (int q = 0; q < 6; ++q) { Gull& g = keyGulls[q]; if (g.on) { double y = g.step(sr_, rng); sbL += y * std::cos(g.pan * HP); sbR += y * std::sin(g.pan * HP); } }
        if (cricketOn) for (auto& k : crickets) {
          k.chirp += dt / k.period; if (k.chirp >= 1) k.chirp -= 1; double p = 0; if (k.chirp < 0.35) { k.pulse += k.rate * dt; double f = k.pulse - std::floor(k.pulse); p = std::sin(3.14159 * f); p *= p; } k.ph += TWO_PI * k.fc / sr_; if (k.ph > TWO_PI) k.ph -= TWO_PI;
          double y = std::sin(k.ph) * p * 0.05 * cricketDay * ni * cricG; sbL += y * std::cos(k.pan * HP); sbR += y * std::sin(k.pan * HP);
        }
        if (pebP > 0 && rng.uni() < pebP) { double p1 = rng.uni(), p2 = rng.uni(), p3 = rng.uni(), p4 = rng.uni(), p5 = rng.uni(); spawnPing(700 + 4300 * p1 * p2, 0.006 + 0.012 * p3, 0.25 * (0.3 + 0.7 * p4), p5); }
        for (int q = 0; q < 64; ++q) {
          Ping& p = pings[q]; if (!p.on) continue; double y = p.c1 * p.y1 + p.c2 * p.y2; p.y2 = p.y1; p.y1 = y; if (--p.life <= 0) p.on = false;
          if (p.life > 0 && p.c1 != 0 && std::fabs(p.y1) < 1e-6 && std::fabs(p.y2) < 1e-6) p.on = false; sbL += y * std::cos(p.pan * HP); sbR += y * std::sin(p.pan * HP);
        }
        for (int q = 0; q < 2; ++q) { Whale& w = whales[q]; if (w.on) { double y = w.step(sr_, rng) * whaleG; ubL += y * std::cos(w.pan * HP); ubR += y * std::sin(w.pan * HP); } }
        for (int q = 0; q < 40; ++q) {
          Bub& b = bubs[q]; if (!b.on) continue; if (b.delay > 0) { --b.delay; continue; }
          double y = std::sin(b.ph) * b.a; b.ph += TWO_PI * b.f / sr_; if (b.ph > TWO_PI) b.ph -= TWO_PI; b.f *= 1 + b.k * dt * 3; b.a *= b.dec; if (b.a < 1e-4 || b.f > sr_ * 0.4) b.on = false; ubL += y * std::cos(b.pan * HP); ubR += y * std::sin(b.pan * HP);
        }
        vl = 0; vr = 0; for (int q = 0; q < 16; ++q) { Vox& vx = voices[q]; if (vx.on) stepVox(vx, swellV, bf, spr, br, foc, cf); }
        double mL = sb[0].run(sbL * bedGate_) + ub[0].run(ubL * bedGate_) + kb[0].run(vl * swellK), mR = sb[1].run(sbR * bedGate_) + ub[1].run(ubR * bedGate_) + kb[1].run(vr * swellK);
        if (dEff > 0.02 && pressure_ > 0.5) {
          rumPh += 41 * dt; if (rumPh > 1) rumPh -= 1; rumZ = rumA * rumZ + (1 - rumA) * rng.bi(); double rn = rumZ * 5;
          double pr = (std::sin(TWO_PI * rumPh) * 0.5 + rn * 0.25) * pressure_ * 0.01 * dEff * dEff * 0.22 * (0.8 + 0.2 * std::sin(TWO_PI * 0.13 * tAbs)); mL += pr; mR += pr;
        }
        if (fibA > 0.001) {
          double comp = 0.9 * std::sqrt(fibQ * 0.1), wl = 0, wr = 0;
          for (int k = 0; k < 8; ++k) { wl += fw[k] * fib[0][k].run(mL); wr += fw[k] * fib[1][k].run(mR); }
          mL = mL * (1 - 0.5 * fibA) + wl * fibA * comp; mR = mR * (1 - 0.5 * fibA) + wr * fibA * comp;
        }
        cur[0].push(mL); cur[1].push(mR);
        if (cu > 0.001) {
          curPh += dt * 0.27; if (curPh > 1) curPh -= 1; double dl = (8 + 5 * std::sin(TWO_PI * curPh)) * 0.001 * sr_, dr = (8 + 5 * std::sin(TWO_PI * curPh * 1.31 + 1.7)) * 0.001 * sr_;
          double mixc = cu * (0.25 + 0.35 * dEff); mL = mL * (1 - mixc * 0.5) + cur[0].read(dl) * mixc; mR = mR * (1 - mixc * 0.5) + cur[1].read(dr) * mixc;
        }
        double oL = mL, oR = mR;
        if (rvMix > 0.001) {
          double x = (mL + mR) * 0.015, fb = 0.7 + 0.28 * (V[ReverbSize] * 0.01) + 0.02 * dEff, dm = 0.35 + 0.3 * dEff; double wl2 = rev.tick(0, x, fb, dm), wr2 = rev.tick(1, x, fb, dm);
          oL = mL * (1 - rvMix * 0.3) + wl2 * 3 * rvMix; oR = mR * (1 - rvMix * 0.3) + wr2 * 3 * rvMix;
        }
        oL = std::tanh(oL * vg * 0.9) * 1.15; oR = std::tanh(oR * vg * 0.9) * 1.15;
        if (!(oL - oL == 0) || !(oR - oR == 0)) { ++nonFinite; oL = oR = 0; }
        outL[i] = (float)oL; outR[i] = (float)oR;
      }
      for (int j = 0; j < 2; ++j) { ph[j] += blk * dt / (period * (j ? 1.31 : 1)); if (ph[j] >= 1) ph[j] -= 1; }
      tAbs += blk * dt; done += blk;
    }
    flash *= std::exp(-n / (0.35 * sr_));
  }
};
inline Info info() {
  return Info{"beachica", "Beachica", "The shore and the sea, modelled: surf, wind, gulls, whales, bubbles and 14 playable voices, with a Waterline slider from sand to deep water and golden-ratio shell and coral filters.", makeSpecs(), makeGroups(),
              Theme{"beachica", 0xff0c3347, 0xff03121c, 0xff4fd1c5, 0xffe6f5f1, 0xff8fe9ff}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::beachica
