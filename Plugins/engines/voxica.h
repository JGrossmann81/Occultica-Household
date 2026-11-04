// Voxica: vocal synthesizer (formant choir). Internal formant synth only; vocoder/talkbox presets sound as the formant synth, as in the web version.
#pragma once
#include "../common/engine.h"
namespace occ { namespace voxica {
enum { Preset, Mode, Source, Vowel, Vowel2, Morph, Shift, Tone, Breath, VibRate, VibDepth, SeqMode, SeqRate, SeqDepth, Choir, Voices, Glide, Bands, Bandwidth, Sibilance, Unvoiced, InGain, Attack, Release, Level, Start, End, ConsTime, ConsAmt, Nasal, Count };
struct Row { const char* name; double q[29]; };
static const Row ROWS[] = {
    {"Ah Choir", {0, 0, 0, 3, 0, 0, 0.50, 0.12, 5.2, 0.30, 0, 0.5, 0, 0.80, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.25, 0.60, -6, 0, 0, 0.14, 0.8, 0}},
    {"Oo Pad", {0, 0, 4, 3, 0.3, -2, 0.30, 0.20, 4.5, 0.25, 0, 0.5, 0, 1.00, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.50, 1.20, -6, 0, 0, 0.14, 0.8, 0}},
    {"Soprano Aahs", {0, 0, 0, 1, 0.2, 5, 0.70, 0.10, 6.0, 0.40, 0, 0.5, 0, 0.50, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.12, 0.40, -6, 0, 0, 0.14, 0.8, 0}},
    {"Bass Voices", {0, 0, 3, 4, 0, -6, 0.45, 0.18, 4.8, 0.20, 0, 0.5, 0, 0.60, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.15, 0.50, -5, 0, 0, 0.14, 0.8, 0}},
    {"Wah Vowel Sweep", {0, 1, 1, 3, 0, 0, 0.50, 0.05, 5.0, 0.20, 1, 0.8, 0.80, 0.00, 0, 0.08, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7, 0, 0, 0.14, 0.8, 0}},
    {"Vowel Steps", {0, 2, 0, 3, 0, 0, 0.50, 0.05, 5.0, 0.15, 2, 3.5, 1.00, 0.20, 1, 0.03, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7, 0, 0, 0.14, 0.8, 0}},
    {"Random Talker", {0, 1, 2, 3, 0, 0, 0.55, 0.10, 5.5, 0.20, 3, 5.0, 1.00, 0.00, 0, 0.06, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.30, -7, 0, 0, 0.14, 0.8, 0}},
    {"Whisper Voices", {0, 3, 2, 0, 0, 0, 0.50, 0.50, 5.0, 0.00, 0, 0.5, 0, 0.50, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.15, 0.50, -4, 0, 0, 0.14, 0.8, 0}},
    {"Robot Voice", {1, 1, 0, 3, 0, 0, 0.50, 0.00, 5.0, 0.10, 0, 0.5, 0, 0.20, 1, 0.03, 3, 0.50, 0.6, 0.7, 12, 0.01, 0.20, -6, 0, 0, 0.14, 0.8, 0}},
    {"Robot Choir", {1, 0, 0, 3, 0, 0, 0.50, 0.10, 5.0, 0.30, 0, 0.5, 0, 0.70, 1, 0.04, 4, 0.45, 0.5, 0.6, 12, 0.08, 0.50, -6, 0, 0, 0.14, 0.8, 0}},
    {"Whisper Robot", {1, 3, 0, 3, 0, 0, 0.50, 0.00, 5.0, 0.00, 0, 0.5, 0, 0.00, 1, 0.03, 4, 0.40, 0.4, 0.0, 12, 0.01, 0.20, -5, 0, 0, 0.14, 0.8, 0}},
    {"Vowel Lead", {2, 1, 0, 3, 0, 0, 0.50, 0.00, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.40, 0.5, 0.6, 12, 0.01, 0.25, -6, 0, 0, 0.14, 0.8, 0}},
    {"Vowel Pad", {2, 2, 0, 3, 0, 0, 0.50, 0.00, 4.8, 0.20, 0, 0.5, 0, 0.40, 1, 0.04, 3, 0.50, 0.4, 0.5, 12, 0.06, 0.50, -6, 0, 0, 0.14, 0.8, 0}},
    // speech presets: the last five numbers are Start, End, Cons time, Cons amount and Nasal
    {"Owww Mmm", {0, 0, 3, 4, 0.55, 0, 0.45, 0.15, 5.0, 0.30, 0, 0.5, 0, 0.70, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.30, 1.80, -6, 0, 1, 0.55, 0.85, 0.0}},
    {"Aum Choir", {0, 0, 0, 4, 0.60, 0, 0.45, 0.12, 5.0, 0.30, 0, 0.5, 0, 0.90, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.40, 2.40, -6, 0, 1, 0.80, 0.90, 0.0}},
    {"Mmm Aaa Pad", {0, 0, 0, 3, 0.2, 0, 0.45, 0.12, 4.8, 0.25, 0, 0.5, 0, 0.80, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.30, 1.60, -6, 14, 0, 0.45, 0.90, 0.0}},
    {"Cry Laaa", {0, 0, 0, 6, 0.25, 0, 0.55, 0.10, 5.6, 0.40, 0, 0.5, 0, 0.35, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.03, 0.90, -6, 9, 0, 0.20, 0.90, 0.0}},
    {"Laaa Lead", {0, 0, 0, 6, 0.2, 0, 0.55, 0.06, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.06, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.35, -6, 10, 0, 0.14, 0.90, 0.0}},
    {"Space Choir", {0, 0, 0, 0, 0.0, 0, 0.45, 0.14, 5.0, 0.30, 0, 0.5, 0, 0.80, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.05, 1.20, -6, 8, 0, 0.30, 0.90, 0.0}},
    {"Thee Lead", {0, 0, 2, 1, 0.1, 0, 0.60, 0.08, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.01, 0.30, -6, 3, 0, 0.16, 0.90, 0.0}},
    {"Rawr Growl", {0, 1, 7, 0, 0.5, -3, 0.80, 0.15, 6.0, 0.20, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.01, 0.30, -7, 11, 4, 0.12, 1.00, 0.2}},
    {"Wow Lead", {0, 0, 3, 0, 0.5, 0, 0.60, 0.05, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.08, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.40, -6, 12, 6, 0.14, 0.95, 0.0}},
    {"Yeah Lead", {0, 0, 6, 0, 0.5, 0, 0.60, 0.08, 5.5, 0.30, 0, 0.5, 0, 0.00, 0, 0.06, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.40, -6, 13, 0, 0.10, 0.90, 0.0}},
    {"Mama Lead", {0, 0, 0, 0, 0.0, 0, 0.60, 0.06, 5.5, 0.25, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.40, -6, 14, 0, 0.12, 0.90, 0.0}},
    {"Nay Lead", {0, 0, 1, 6, 0.3, 0, 0.60, 0.06, 5.5, 0.25, 0, 0.5, 0, 0.00, 0, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.02, 0.40, -6, 15, 2, 0.12, 0.90, 0.15}},
    {"Shh Breath", {0, 3, 5, 5, 0.0, 0, 0.50, 0.50, 5.0, 0.00, 0, 0.5, 0, 0.30, 1, 0.04, 3, 0.50, 0.3, 0.5, 6, 0.08, 0.60, -5, 2, 8, 0.30, 0.90, 0.0}},
    {"Ow Mm Lead", {0, 0, 7, 4, 0.70, 0, 0.60, 0.06, 5.5, 0.35, 0, 0.5, 0, 0.00, 0, 0.07, 3, 0.50, 0.3, 0.5, 6, 0.03, 0.80, -6, 0, 1, 0.45, 0.90, 0.0}},
    {"Aye Diphthong", {0, 0, 0, 2, 0.5, 0, 0.60, 0.06, 5.5, 0.30, 0, 0.5, 0, 0.30, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.03, 0.80, -6, 0, 7, 0.30, 0.90, 0.0}},
    {"Nasal Choir", {0, 0, 0, 3, 0.2, 0, 0.50, 0.10, 5.0, 0.30, 0, 0.5, 0, 0.85, 1, 0.05, 3, 0.50, 0.3, 0.5, 6, 0.20, 0.90, -6, 0, 0, 0.14, 0.80, 0.55}},
};
constexpr int kRows = 28;
inline std::vector<Spec> makeSpecs() {
  const double* d = ROWS[0].q; std::vector<std::string> names; for (auto& r : ROWS) names.push_back(r.name);
  return {P("Preset", "", 0, kRows - 1, 0, "%.0f", false, names),
    P("Mode", "", 0, 2, d[0], "%.0f", false, {"Formant synth", "Vocoder", "Talkbox"}),
    P("Source", "", 0, 3, d[1], "%.0f", false, {"Glottal", "Saw", "Pulse", "Whisper"}),
    P("Vowel", "", 0, 8, d[2], "%.2f"), P("Vowel 2", "", 0, 8, d[3], "%.2f"), P("Morph", "", 0, 1, d[4], "%.2f"),
    P("Formant", "st", -12, 12, d[5], "%+.1f st"), P("Glottal tone", "", 0, 1, d[6], "%.2f"), P("Breath", "", 0, 1, d[7], "%.2f"),
    P("Vib rate", "Hz", 0.5, 10, d[8], "%.1f Hz"), P("Vib depth", "", 0, 1, d[9], "%.2f"),
    P("Sequence", "", 0, 3, d[10], "%.0f", false, {"Off", "Sweep", "Steps", "Random"}), P("Seq rate", "Hz", 0.05, 12, d[11], "%.2f Hz", true), P("Seq depth", "", 0, 1, d[12], "%.2f"),
    P("Choir", "", 0, 1, d[13], "%.2f"), P("Voices", "", 0, 1, d[14], "%.0f", false, {"Mono legato", "Poly 8"}), P("Glide", "s", 0.003, 3, d[15], "%.3f s", true),
    P("Bands", "", 0, 4, d[16], "%.0f", false, {"8 bands", "12 bands", "16 bands", "20 bands", "24 bands"}), P("Bandwidth", "", 0, 1, d[17], "%.2f"),
    P("Sibilance", "", 0, 1, d[18], "%.2f"), P("Unvoiced", "", 0, 1, d[19], "%.2f"), P("In gain", "dB", -12, 36, d[20], "%+.0f dB"),
    P("Attack", "s", 0.005, 4, d[21], "%.3f s", true), P("Release", "s", 0.02, 8, d[22], "%.2f s", true), P("Level", "dB", -30, 6, d[23], "%+.1f dB"),
    P("Start", "", 0, 15, d[24], "%.0f", false, {"None", "S", "SH", "TH", "F", "T", "K", "P", "SP", "CR", "L", "R", "W", "Y", "M", "N"}),
    P("End", "", 0, 9, d[25], "%.0f", false, {"None", "M", "N", "NG", "R", "L", "W (ow)", "Y (ai)", "S", "TH"}),
    P("Cons time", "s", 0.03, 1.5, d[26], "%.2f s", true), P("Cons amount", "", 0, 1, d[27], "%.2f"), P("Nasal", "", 0, 1, d[28], "%.2f")};
}
inline std::vector<Group> makeGroups() {
  return {{"Voice", {Source, Vowel, Vowel2, Morph, Shift, Tone, Breath, Choir, Voices, Level}}, {"Speech", {Start, End, ConsTime, ConsAmt, Nasal}}, {"Vowel sequencer", {SeqMode, SeqRate, SeqDepth}}, {"Vibrato & envelope", {VibRate, VibDepth, Glide, Attack, Release}}};
}
struct SinTab { double t[4098]; SinTab() { for (int i = 0; i <= 4097; ++i) t[i] = std::sin(2 * kPi * i / 4096); } };
inline const double* ST() { static const SinTab s; return s.t; }
inline double sinCyc(double ph) { const double* st = ST(); double x = ph * 4096; long long i = (long long)std::floor(x); double f = x - double(i); i &= 4095; return st[i] + (st[i + 1] - st[i]) * f; }
inline double rnd01(Noise& n) { return 0.5 + 0.5 * n.white(); }
struct VT_ { double f[5], a[5], bw[5]; };
constexpr int kNV = 9;   // 0 ah, 1 eh, 2 ee, 3 oh, 4 oo, 5 uh, 6 ae, 7 aw, 8 er
static const VT_ VT[kNV] = {
  {{650, 1080, 2650, 2900, 3250}, {0, -6, -7, -8, -22}, {80, 90, 120, 130, 140}},
  {{400, 1700, 2600, 3200, 3580}, {0, -14, -12, -14, -20}, {70, 80, 100, 120, 120}},
  {{290, 1870, 2800, 3250, 3540}, {0, -15, -18, -20, -30}, {40, 90, 100, 120, 120}},
  {{400, 800, 2600, 2800, 3000}, {0, -10, -12, -12, -26}, {40, 80, 100, 120, 120}},
  {{350, 600, 2700, 2900, 3300}, {0, -20, -17, -14, -26}, {40, 60, 100, 120, 120}},
  {{600, 1200, 2550, 3000, 3300}, {0, -9, -10, -13, -24}, {80, 90, 120, 130, 140}},
  {{660, 1720, 2410, 3000, 3350}, {0, -8, -10, -14, -24}, {80, 90, 110, 130, 140}},
  {{570, 840, 2410, 2800, 3250}, {0, -7, -9, -12, -24}, {80, 90, 110, 130, 140}},
  {{490, 1350, 1690, 3000, 3300}, {0, -8, -4, -14, -24}, {70, 100, 100, 130, 140}}};
// consonant and nasal targets (formant sets the mouth is shaped into): 0 L, 1 R, 2 W, 3 Y, 4 M, 5 N, 6 NG, 7 nasal colour
static const VT_ CT[8] = {
  {{380, 1000, 2700, 3200, 3600}, {0, -9, -13, -18, -26}, {70, 110, 120, 140, 140}},
  {{420, 1250, 1650, 3300, 3700}, {0, -8, -4, -14, -24}, {80, 100, 100, 140, 140}},
  {{300, 620, 2200, 2900, 3300}, {0, -12, -22, -24, -32}, {50, 70, 120, 130, 140}},
  {{270, 2100, 3000, 3400, 3700}, {0, -12, -16, -22, -30}, {50, 100, 120, 130, 140}},
  {{260, 1100, 2100, 3000, 3600}, {0, -26, -32, -38, -44}, {60, 200, 250, 300, 300}},
  {{260, 1500, 2400, 3100, 3600}, {0, -24, -24, -30, -38}, {60, 200, 250, 300, 300}},
  {{260, 1900, 2500, 3100, 3600}, {0, -22, -24, -30, -38}, {60, 200, 250, 300, 300}},
  {{300, 1000, 2300, 3000, 3500}, {0, -14, -16, -22, -30}, {70, 160, 200, 250, 250}}};
static const double CNOTCH[8] = {900, 1250, 900, 1250, 1000, 1600, 2400, 1000};
struct Fm { double f[5], a[5], bw[5]; };
inline void vowelAt(double pos, Fm& r) {
  pos = clampd(pos, 0, kNV - 1); int i = (int)std::min(double(kNV - 2), std::floor(pos)); double t = pos - i; const VT_ &a = VT[i], &b = VT[i + 1];
  for (int k = 0; k < 5; ++k) { r.f[k] = a.f[k] * std::pow(b.f[k] / a.f[k], t); r.a[k] = std::pow(10.0, (a.a[k] + (b.a[k] - a.a[k]) * t) / 20); r.bw[k] = a.bw[k] + (b.bw[k] - a.bw[k]) * t; }
}
inline void mixF(Fm& F, const VT_& T, double w) {   // slide a formant set towards a target (frequencies in the log domain)
  if (w <= 0) return; if (w > 1) w = 1;
  for (int k = 0; k < 5; ++k) { F.f[k] *= std::pow(T.f[k] / F.f[k], w); F.a[k] *= std::pow(std::pow(10.0, T.a[k] / 20) / std::max(F.a[k], 1e-6), w); F.bw[k] += (T.bw[k] - F.bw[k]) * w; }
}
struct Bp {   // unity-peak band-pass, also used as a notch (x - depth*bp)
  double a1 = 0, a2 = 0, a3 = 0, k = 1, s1 = 0, s2 = 0;
  void set(double f, double q, double sr) { double g = std::tan(kPi * clampd(f, 40, 0.45 * sr) / sr); k = 1 / q; a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
  double run(double x) { double v3 = x - s2, v1 = a1 * s1 + a2 * v3, v2 = s2 + a2 * s1 + a3 * v3; s1 = 2 * v1 - s1; s2 = 2 * v2 - s2; return k * v1; }
};
struct FBank {
  double a1[5] = {}, a2[5] = {}, a3[5] = {}, g[5] = {}, s1[5] = {}, s2[5] = {};
  void set(const Fm& F, double scale, double sr) {
    for (int i = 0; i < 5; ++i) {
      double f = clampd(F.f[i] * scale, 40, 0.45 * sr), q = std::max(0.7, f / std::max(20.0, F.bw[i] * scale));
      double gg = std::tan(kPi * f / sr), k = 1 / q; a1[i] = 1 / (1 + gg * (gg + k)); a2[i] = gg * a1[i]; a3[i] = gg * a2[i]; g[i] = F.a[i] * k * ((i & 1) ? -1 : 1);
    }
  }
  double run(double x) {
    double y = 0;
    for (int i = 0; i < 5; ++i) { double v3 = x - s2[i], v1 = a1[i] * s1[i] + a2[i] * v3, v2 = s2[i] + a2[i] * s1[i] + a3[i] * v3; s1[i] = 2 * v1 - s1[i]; s2[i] = 2 * v2 - s2[i]; y += g[i] * v1; }
    return y;
  }
};
constexpr double kNoiseGain = 1.2;
constexpr int kVoices = 8, kStack = 16, kSubs = 4; constexpr double kFormGain = 2.7;
inline double velVol(double v) { return 0.3 + 0.7 * v; }
static const double WL[4] = {1, 1, 0.25, 0.8}, WR[4] = {1, 0.25, 1, 0.8}, DETUNE[4] = {0, 1, -1, 0.55};
struct Sub { double ph = 0, vp = 0, rateMul = 1, cents = 0, drift = 0, driftT = 0, g = 0; long long dCnt = 0; void reset() { *this = Sub(); } };
struct VVoice {
  Adsr env; Noise noise; Sub sub[4];
  bool active = false, gate = false, killing = false, hasPend = false; int key = 60, chan = 0, pChan = 0, pKey = 60; long long age = 0, cnt = 0; double pVel = 0, pTune = 0, kg = 1, f = 261, gl = 0, gn = 0, pitch = 60, tgt = 60, dev = 0, vel = 0.8, volS = 0, volT = 0.8, vibFade = 0, t = 0;
  void reset(double sr) {
    active = gate = killing = hasPend = false; key = 60; chan = 0; age = 0; pChan = 0; pKey = 60; pVel = 0; pTune = 0; kg = 1; f = 261; gl = 0; gn = 0; pitch = 60; tgt = 60; dev = 0; vel = 0.8; volS = 0; volT = 0.8; vibFade = 0; t = 0; cnt = 0;
    env = Adsr(); env.setSr(sr); noise.s = 0x9E3779B9u; for (auto& s : sub) s.reset();
  }
};
struct Sm { double v = 0, c = 0; double next(double t) { v = t + (v - t) * c; return v; } };
struct Held { int chan, note; double vel, tune; };
struct G_ { double tone = 0, breath = 0, vibD = 0, bend = 0, press = 0, expr = 1, choir = 0; };
struct Engine : EngineBase {
  std::vector<Spec> specs; VVoice vs[kVoices]; std::vector<Held> stack; long long ageCtr = 0; double lastPitch = -1, bendIn = 0, mod = 0, press = 0, exprIn = 1, idle = 0;
  Sm tone, breath, shift, morph, level, vib, bend, pressS, expr, choir, vow; FBank bankL, bankR; double seqPh = 0, seqHeld = 0; uint32_t seqRng = 12345; long long ctrl = 0; Fm tmpF; G_ g; double sl = 0, sr_ = 0; Osc os;
  double gc = 0, volC = 0, killStep = 0, subC = 0, driftC = 0;
  // speech: consonant clock, noise and nasal notch
  double startT = 1e9, endT = 0, cV = 1, cNoise = 0, cLevel = 1, cNasal = 0, vgS = 1, nsS = 0; bool endActive = false, prevGate = false, consAlive = false;
  Bp bpL, bpR, nxL, nxR; Noise nzL{0x1234567u}, nzR{0x7654321u};
  explicit Engine(double s) : EngineBase(s) {
    specs = makeSpecs(); initParams(specs); for (auto& x : vs) { x.reset(s); }
    double c = std::exp(-1 / (0.02 * sr)); for (Sm* m : {&tone, &breath, &shift, &morph, &level, &vib, &bend, &pressS, &expr, &choir, &vow}) m->c = c;
    vow.c = std::exp(-16 / (0.006 * sr)); morph.c = std::exp(-16 / (0.02 * sr)); shift.c = morph.c;
    tone.v = v[Tone]; breath.v = v[Breath]; shift.v = v[Shift]; morph.v = v[Morph]; level.v = lvlGain(); expr.v = 1; choir.v = v[Choir]; vow.v = v[Vowel];
    vowelAt(0, tmpF); derive();
  }
  double lvlGain() const { return std::pow(10.0, v[Level] / 20); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[(size_t)id]; if (!(x == x)) x = sp.def;
    x = clampd(x, sp.min, sp.max); if (!sp.labels.empty()) x = std::floor(x + 0.5);
    v[(size_t)id] = x; if (id == Preset) loadPreset((int)x); derive();
  }
  void put(int id, double x) { v[(size_t)id] = x; writeParam(id, x); }
  void loadPreset(int i) { const double* p = ROWS[(int)clampd(i, 0, kRows - 1)].q; for (int k = 0; k < 29; ++k) put(1 + k, p[k]); }
  void derive() {
    double gl_ = std::max(0.003, v[Glide]);
    gc = std::exp(-1 / (gl_ * sr)); volC = 1 - std::exp(-1 / (0.015 * sr)); killStep = 1 / (0.004 * sr); subC = 1 - std::exp(-1 / (0.03 * sr)); driftC = 1 - std::exp(-2 * kPi * 6 / sr);
    for (auto& x : vs) { x.env.setSr(sr); x.env.set(v[Attack], 0.01, 1, v[Release]); }
  }
  void pitchBend(double b) override { bendIn = clampd(b, -1, 1); } void modWheel(double m) override { mod = clampd(m, 0, 1); } void pressure(double p) override { press = clampd(p, 0, 1); }
  void allNotesOff() override { stack.clear(); for (auto& x : vs) if (x.active) { x.gate = false; x.env.gateOff(); } }
  bool removeFromStack(int ch, int note) { for (size_t i = 0; i < stack.size(); ++i) if (stack[i].chan == ch && stack[i].note == note) { stack.erase(stack.begin() + (long)i); return true; } return false; }
  void retarget(VVoice& x, double t) { x.dev += x.tgt - t; x.tgt = t; }
  void noteOn(int note, double vel) override {
    vel = clampd(vel, 0, 1); double tune = noteTune * 0.01; noteTune = 0; int ch = 0;
    if (v[Voices] < 0.5) {
      removeFromStack(ch, note); VVoice& x = vs[0]; bool legato = !stack.empty() && x.active && x.gate;
      if ((int)stack.size() >= kStack) stack.erase(stack.begin()); stack.push_back({ch, note, vel, tune});
      if (legato) { retarget(x, note + tune); x.key = note; x.chan = ch; x.volT = velVol(vel); } else startVoice(x, ch, note, vel, tune);
    } else {
      int pick = -1;
      for (int i = 1; i < kVoices; ++i) if (!vs[i].active) { pick = i; break; }
      if (pick < 0 && !vs[0].active) pick = 0;
      if (pick < 0) { double best = 1e9; for (int i = 0; i < kVoices; ++i) if (!vs[i].gate && !vs[i].killing && vs[i].env.v < best) { best = vs[i].env.v; pick = i; } }
      if (pick < 0) { double oldest = 1e300; for (int i = 0; i < kVoices; ++i) if (!vs[i].killing && (double)vs[i].age < oldest) { oldest = (double)vs[i].age; pick = i; } }
      if (pick < 0) pick = 0;
      VVoice& x = vs[pick];
      if (x.active) { x.killing = true; x.hasPend = true; x.pChan = ch; x.pKey = note; x.pVel = vel; x.pTune = tune; } else startVoice(x, ch, note, vel, tune);
    }
  }
  void noteOff(int note) override {
    int ch = 0;
    if (!stack.empty()) {
      Held top = stack.back(); bool wasTop = top.chan == ch && top.note == note, had = removeFromStack(ch, note); VVoice& x = vs[0];
      if (had && x.active && x.gate && v[Voices] < 0.5) {
        if (stack.empty()) { x.gate = false; x.env.gateOff(); }
        else if (wasTop) { Held h = stack.back(); retarget(x, h.note + h.tune); x.key = h.note; x.chan = h.chan; x.volT = velVol(h.vel); }
        return;
      }
    }
    for (int i = 0; i < kVoices; ++i) {
      VVoice& x = vs[i]; if (x.active && x.gate && !x.killing && x.chan == ch && x.key == note) { x.gate = false; x.env.gateOff(); }
      if (x.killing && x.hasPend && x.pChan == ch && x.pKey == note) x.hasPend = false;
    }
  }
  void startVoice(VVoice& x, int ch, int key, double vel, double tune) {
    long long age = ++ageCtr; bool wasActive = x.active && v[Voices] < 0.5;
    if (!wasActive) x.reset(sr);
    x.active = true; x.gate = true; x.killing = false; x.hasPend = false; x.kg = 1; x.key = key; x.chan = ch; x.age = age; x.vel = vel; x.volT = velVol(vel); x.tgt = key + tune; x.t = 0; x.cnt = 0;
    { uint32_t s = 0x9E3779B9u ^ ((uint32_t)age * 2654435761u); x.noise.s = s ? s : 1u; }
    if (!wasActive) {
      x.volS = 0; x.vibFade = 0; x.pitch = (lastPitch >= 0 && v[Glide] > 0.01) ? lastPitch : x.tgt;
      for (int s = 0; s < kSubs; ++s) { Sub& u = x.sub[s]; u.ph = rnd01(x.noise); u.vp = rnd01(x.noise); u.rateMul = 0.88 + 0.24 * rnd01(x.noise); u.cents = DETUNE[s] * 17; u.g = s == 0 ? 1 : 0; u.drift = 0; u.driftT = 0; u.dCnt = 0; }
      x.sub[0].ph = 0;
    }
    x.env.setSr(sr); x.env.set(v[Attack], 0.01, 1, v[Release]); x.env.gateOn(!wasActive);
    x.dev = x.pitch - x.tgt; lastPitch = x.tgt;
    startT = 0; endActive = false;
  }
  static double ss(double x) { x = clampd(x, 0, 1); return x * x * (3 - 2 * x); }
  /** Speech: shapes the formants for the start / end consonant and the nasal colour, and sets the noise and voice gain for fricatives and plosives. */
  void consonant(Fm& F, double dt) {
    startT += dt; bool gateNow = false; for (auto& x : vs) if (x.active && x.gate && !x.killing) { gateNow = true; break; }
    if (gateNow) endActive = false; else if (prevGate) { endActive = true; endT = 0; }
    prevGate = gateNow; if (endActive) endT += dt;
    const double ct = std::max(0.03, v[ConsTime]), amt = v[ConsAmt], nas = v[Nasal]; const int st = (int)std::floor(v[Start] + 0.5), en = (int)std::floor(v[End] + 0.5);
    double wF = 0, vg = 1, nz = 0, nf = 5000, nq = 1, lvl = 1; int tgt = -1;
    if (!endActive && st > 0 && startT < ct * 2) {
      const double u = startT / ct;
      auto burst = [&](double a, double b) { return (u >= a && u < b) ? 1 - (u - a) / (b - a) : 0.0; };
      switch (st) {
        case 1: nz = u < 1 ? std::pow(1 - u, 0.7) : 0; nf = 6800; nq = 1.4; vg = ss((u - 0.25) / 0.75); break;
        case 2: nz = u < 1 ? std::pow(1 - u, 0.7) : 0; nf = 3300; nq = 1.0; lvl = 1.1; vg = ss((u - 0.25) / 0.75); break;
        case 3: nz = u < 1 ? std::pow(1 - u, 0.7) : 0; nf = 7500; nq = 0.45; lvl = 0.5; vg = ss((u - 0.2) / 0.8); break;
        case 4: nz = u < 1 ? std::pow(1 - u, 0.7) : 0; nf = 4500; nq = 0.35; lvl = 0.45; vg = ss((u - 0.2) / 0.8); break;
        case 5: nz = burst(0.3, 0.5); nf = 4500; nq = 0.9; lvl = 1.1; vg = ss((u - 0.35) / 0.45); break;
        case 6: nz = burst(0.3, 0.55); nf = 1800; nq = 1.2; vg = ss((u - 0.35) / 0.45); break;
        case 7: nz = burst(0.3, 0.45); nf = 800; nq = 0.6; lvl = 0.9; vg = ss((u - 0.35) / 0.45); break;
        case 8: if (u < 0.55) { nz = std::pow(1 - u / 0.55, 0.7); nf = 6800; nq = 1.4; } else { nz = burst(0.62, 0.75); nf = 800; nq = 0.6; lvl = 0.9; } vg = ss((u - 0.68) / 0.32); break;
        case 9: nz = burst(0.3, 0.55); nf = 1800; nq = 1.2; vg = ss((u - 0.35) / 0.45); wF = u < 0.35 ? 1 : 1 - ss((u - 0.4) / 0.6); tgt = 1; break;
        default: wF = u < 0.3 ? 1 : 1 - ss((u - 0.3) / 0.7); tgt = st - 10;   // L R W Y M N -> targets 0..5
      }
    } else if (endActive && en > 0) {
      const double e = endT / ct;
      switch (en) {
        case 1: tgt = 4; wF = ss(e); break; case 2: tgt = 5; wF = ss(e); break; case 3: tgt = 6; wF = ss(e); break;
        case 4: tgt = 1; wF = ss(e); break; case 5: tgt = 0; wF = ss(e); break; case 6: tgt = 2; wF = ss(e); break; case 7: tgt = 3; wF = ss(e); break;
        case 8: nz = e < 1 ? ss(e) : std::max(0.0, 1 - (e - 1) / 1.5); nf = 6800; nq = 1.4; vg = 1 - 0.5 * ss(e); break;
        default: nz = e < 1 ? ss(e) : std::max(0.0, 1 - (e - 1) / 1.5); nf = 7500; nq = 0.45; lvl = 0.5; vg = 1 - 0.5 * ss(e);
      }
    }
    wF *= amt; nz *= amt; vg = 1 - amt * (1 - vg);
    double nw = nas * 0.8, nF = 1000;
    if (nas > 0) mixF(F, CT[7], nas * 0.65);
    if (tgt >= 0) { mixF(F, CT[tgt], wF); if (tgt >= 4 && tgt <= 6 && wF * 0.9 > nw) { nw = wF * 0.9; nF = CNOTCH[tgt]; } }
    cV = vg; cNoise = nz; cLevel = lvl; cNasal = nw; consAlive = nz > 1e-3;
    if (nz > 0) { bpL.set(nf, nq, sr); bpR.set(nf, nq, sr); }
    if (nw > 1e-3) { nxL.set(nF, 2.0, sr); nxR.set(nF, 2.0, sr); }
  }
  void control() {
    double dt = 16 / sr; double pos = v[Vowel] + (v[Vowel2] - v[Vowel]) * morph.next(v[Morph]); const double basePos = std::max(v[Vowel], v[Vowel2]); int sm = (int)std::floor(v[SeqMode] + 0.5);
    if (sm != 0) {
      double prev = seqPh; seqPh += v[SeqRate] * dt; bool wrapped = seqPh >= 1; if (wrapped) seqPh -= std::floor(seqPh);
      double d = v[SeqDepth];
      if (sm == 1) pos += d * 2 * sinCyc(seqPh);
      else if (sm == 2) pos = pos + (std::floor(seqPh * 5) - pos) * d;
      else { if (wrapped || prev > seqPh) { seqRng = seqRng * 1664525u + 1013904223u; seqHeld = 4 * double(seqRng >> 8) / 16777216.0; } pos = pos + (seqHeld - pos) * d; }
      const double top = basePos > 4.0001 ? double(kNV - 1) : 4.0; if (pos < 0) pos = -pos; if (pos > top) pos = 2 * top - pos;
    }
    pos = clampd(pos, 0, kNV - 1); double p = vow.next(pos);
    Fm& F = tmpF; vowelAt(p, F); consonant(F, dt); double sh = std::pow(2.0, shift.next(v[Shift]) / 12), spread = 0.03 * g.choir;
    for (int i = 0; i < 5; ++i) F.f[i] = std::min(F.f[i] * sh, 0.45 * sr);
    bankL.set(F, 1 - spread, sr); bankR.set(F, 1 + spread, sr);
  }
  void process(float* outL, float* outR, int n) override {
    if (n <= 0) return; double tailN = 0.25 * sr, lvT = lvlGain();
    for (int i = 0; i < n; ++i) {
      double gain = level.next(lvT);
      g.tone = tone.next(v[Tone]); g.breath = breath.next(v[Breath]); g.vibD = vib.next(std::min(1.0, v[VibDepth] + mod)); g.bend = bend.next(bendIn * 2);
      g.press = pressS.next(press); g.expr = expr.next(exprIn); g.choir = choir.next(v[Choir]);
      if ((ctrl++ & 15) == 0) control();
      bool any = false; for (int q = 0; q < kVoices; ++q) if (vs[q].active) { any = true; break; }
      if (!any && idle > tailN && !consAlive && nsS < 1e-4) { outL[i] = outR[i] = 0; continue; }
      sl = 0; sr_ = 0;
      if (any) for (int q = 0; q < kVoices; ++q) if (vs[q].active) renderVoice(vs[q]);
      if (any) idle = 0; else ++idle;
      vgS += (cV - vgS) * 0.01; nsS += (cNoise - nsS) * 0.02;
      double yl = bankL.run(sl * vgS) * kFormGain * gain, yr = bankR.run(sr_ * vgS) * kFormGain * gain;
      if (nsS > 1e-4) { const double ng = nsS * cLevel * kNoiseGain * gain; yl += bpL.run(nzL.white()) * ng; yr += bpR.run(nzR.white()) * ng; }
      if (cNasal > 1e-3) { yl -= cNasal * nxL.run(yl); yr -= cNasal * nxR.run(yr); }
      if (!(std::fabs(yl) < 100)) yl = 0; if (!(std::fabs(yr) < 100)) yr = 0;
      outL[i] = (float)fastTanh(yl); outR[i] = (float)fastTanh(yr);
    }
  }
  void renderVoice(VVoice& x) {
    double isr = 1 / sr, kgain = 1;
    if (x.killing) {
      x.kg -= killStep;
      if (x.kg <= 0) { if (x.hasPend) startVoice(x, x.pChan, x.pKey, x.pVel, x.pTune); else x.reset(sr); return; }
      kgain = x.kg;
    }
    x.t += isr; x.dev *= gc; if (std::fabs(x.dev) < 1e-6) x.dev = 0; x.pitch = x.tgt + x.dev;
    if (x.gate && x.t > 0.1) x.vibFade = std::min(1.0, x.vibFade + isr / 0.4);
    if ((x.cnt & 3) == 0) {
      x.f = clampd(440 * std::pow(2.0, (x.pitch + g.bend - 69) / 12), 8, 0.45 * sr);
      x.gl = std::max(0.04 + 0.30 * (1 - g.tone), 6 * x.f * isr); x.gn = 0.5 / std::sqrt(1.2337 / 0.55 + 1.2337 / x.gl);
    }
    ++x.cnt;
    int src = (int)std::floor(v[Source] + 0.5), nSubs = 1 + (int)std::floor(g.choir * 3 + 0.5); const double vibMax = 45, o = 0.55, driftCents = 2 + 10 * g.choir, detScale = g.choir, lim = 0.45 * sr;
    double mixL = 0, mixR = 0, gsum = 0;
    for (int s = 0; s < kSubs; ++s) {
      Sub& u = x.sub[s]; double want = s < nSubs ? 1 : 0; u.g += (want - u.g) * subC; if (u.g < 1e-4 && want == 0) { u.g = 0; continue; }
      u.vp += v[VibRate] * u.rateMul * isr; if (u.vp >= 1) u.vp -= 1;
      if (--u.dCnt <= 0) { u.dCnt = (long long)std::floor((0.08 + 0.12 * rnd01(x.noise)) * sr); u.driftT = x.noise.white() * driftCents; }
      u.drift += (u.driftT - u.drift) * driftC;
      double cents = sinCyc(u.vp) * g.vibD * x.vibFade * vibMax + u.drift + u.cents * detScale;
      double f = std::min(x.f * (1 + 0.000578 * cents + 1.7e-7 * cents * cents), lim), dt = f * isr;
      u.ph += dt; if (u.ph >= 1) u.ph -= 1;
      double p = u.ph, nz = x.noise.white(), xx = 0;
      switch (src) {
        case 0: {
          double c = x.gl, gate2 = 0;
          if (p < o) { xx = 0.5 * kPi / o * sinCyc(0.5 * p / o); gate2 = sinCyc(0.5 * p / o); }
          else if (p < o + c) xx = -(kPi * 0.5 / c) * sinCyc(0.25 * (p - o) / c);
          xx *= x.gn; xx += g.breath * nz * (0.15 + 0.85 * gate2) * 1.4; break; }
        case 1: os.ph = p; xx = os.saw(dt) * 0.8 + g.breath * nz * 0.7; break;
        case 2: { os.ph = p; double pw = 0.5 - 0.35 * g.tone, dc = 2 * pw - 1; xx = (os.square(dt, pw) - dc) * 1.1 / std::max(0.3, std::sqrt(1 - dc * dc)) + g.breath * nz * 0.7; break; }
        default: xx = nz * 2.4;
      }
      xx *= u.g; mixL += xx * WL[s]; mixR += xx * WR[s]; gsum += u.g;
    }
    double norm = 1 / std::sqrt(std::max(1.0, gsum));
    x.volS += (x.volT - x.volS) * volC; double vol = (x.volS + (1 - x.volS) * g.press) * g.expr, e = x.env.next(), a = e * vol * kgain * norm;
    sl += mixL * a; sr_ += mixR * a;
    if (!(a == a)) { x.reset(sr); return; }
    if (!x.env.active()) { x.active = false; x.gate = false; }
  }
};
inline Info info() {
  return Info{"voxica", "Voxica", "Vocal synthesizer: glottal, saw, pulse or whisper source through five morphing formants, with a choir stack and a vowel sequencer.", makeSpecs(), makeGroups(),
              Theme{"voxica", 0xff2b1a2e, 0xff0c060d, 0xffff8fb8, 0xfffbe6ef, 0xffffb8d3}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); },
              {Mode, Bands, Bandwidth, Sibilance, Unvoiced, InGain}};   // vocoder/talkbox settings need an audio input this synth does not have: hidden
}
}}  // namespace occ::voxica
