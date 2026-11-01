// Galactica: JP-8000 / SH-32 / MS-2000 style polysynth (Super Saw, wavetable bank, virtual patch bay, motion lanes, arpeggiator and 16-step sequencer, insert fx, chorus, delay, reverb).
#pragma once
#include "../common/engine.h"
#include <mutex>
#include <cstring>
namespace occ { namespace galactica {
enum { Preset, Volume, Voices, Mode, Glide, BendRange,
  O1Wave, O1Table, O1Oct, O1Fine, O1Shape, O1Detune, O1Mix, O1Level,
  O2Wave, O2Oct, O2Semi, O2Fine, O2Shape, O2Mode, O2Amount, O2Level,
  SubLevel, SubType, NoiseLevel,
  FType, FCut, FRes, FDrive, FEnv, FKey, FVel,
  AmpA, AmpD, AmpS, AmpR, FltA, FltD, FltS, FltR,
  L1Shape, L1Rate, L1Sync, L1Fade, L1Key, L2Shape, L2Rate, L2Sync, L2Fade, L2Key,
  VP1Src, VP1Dst, VP1Amt, VP2Src, VP2Dst, VP2Amt, VP3Src, VP3Dst, VP3Amt, VP4Src, VP4Dst, VP4Amt,
  FxType, FxAmount, FxTone, FxMix, ChMix, ChRate, ChDepth, DlTime, DlFb, DlTone, DlPing, DlMix, RvSize, RvDamp, RvMix,
  SqMode, SqRate, SqSwing, SqGate, SqLen, SqDir, SqOct, SqLatch, SqChord, SqRhythm, SqAccent, SqSlide, SqHuman, M1Dest, M1Depth, M2Dest, M2Depth, M3Dest, M3Depth, StepBase };
constexpr int kSteps = 16, kF = 8, Tempo = StepBase + kSteps * kF, Count = Tempo + 1;
constexpr int SNote = 0, SGate = 1, SFlags = 2, SProb = 3, SRatchet = 4, SM1 = 5, SM2 = 6, SM3 = 7;
constexpr int stepParam(int s, int f) { return StepBase + s * kF + f; }
constexpr int SrcLfo1 = 1, SrcLfo2 = 2, kSrcN = 14, DstPitch = 1, DstPitch2 = 2, DstShape = 3, DstDetune = 4, DstCut = 5, DstRes = 6, DstAmp = 7, DstPan = 8, DstLfoRate = 9, DstCross = 10, kDstN = 11;
constexpr int kPresets = 12;

inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> presetNames = {"Init", "Solar Flare", "Nebula Pad", "Event Horizon", "Pulsar", "Warp Drive", "Cosmic Rays", "Red Giant", "Comet Tail", "Void Choir", "Ring World", "Moonbase Alpha"};
  std::vector<std::string> tableNames = {"Saw to square", "Harmonic rise", "Vowels", "Pipe organ", "Glass comb", "Rusty metal", "Choir", "Digital grit", "Hollow reed", "Spectral comb", "Buzz sweep", "Phase ensemble"};
  std::vector<std::string> srcs = {"None", "LFO 1", "LFO 2", "Filter env", "Amp env", "Velocity", "Key", "Mod wheel", "Aftertouch", "Pitch bend", "Motion 1", "Motion 2", "Motion 3", "Random"};
  std::vector<std::string> dsts = {"None", "Pitch", "Osc 2 pitch", "Osc 1 shape", "Detune", "Cutoff", "Resonance", "Amp level", "Pan", "LFO 1 rate", "Cross / ring"};
  std::vector<std::string> onoff = {"Off", "On"};
  std::vector<Spec> specs((size_t)Count, P("", "", 0, 1, 0));
  auto S = [&](int id, Spec p) { specs[(size_t)id] = std::move(p); };
  S(Preset, P("Preset", "", 0, kPresets - 1, 0, "%.0f", false, presetNames)); S(Volume, P("Volume", "", 0, 1, 0.7)); S(Voices, P("Voices", "", 1, 8, 8, "%.0f")); S(Mode, P("Play mode", "", 0, 2, 0, "%.0f", false, {"Poly", "Mono", "Legato"}));
  S(Glide, P("Glide", "", 0, 1, 0)); S(BendRange, P("Bend range", "st", 0, 24, 2, "%.0f st"));
  S(O1Wave, P("Osc 1 Wave", "", 0, 8, 0, "%.0f", false, {"Super Saw", "Saw", "Square", "Triangle", "Triangle mod", "Feedback", "Formant", "Wave bank", "Noise"}));
  S(O1Table, P("Osc 1 Table", "", 0, 11, 0, "%.0f", false, tableNames)); S(O1Oct, P("Osc 1 Octave", "", -2, 2, 0, "%.0f")); S(O1Fine, P("Osc 1 Fine", "st", -1, 1, 0, "%.2f st"));
  S(O1Shape, P("Osc 1 Shape", "", 0, 1, 0.5)); S(O1Detune, P("Osc 1 Detune", "", 0, 1, 0.4)); S(O1Mix, P("Osc 1 Super mix", "", 0, 1, 0.7)); S(O1Level, P("Osc 1 Level", "", 0, 1, 0.8));
  S(O2Wave, P("Osc 2 Wave", "", 0, 4, 0, "%.0f", false, {"Saw", "Square", "Triangle", "Sine", "Noise"})); S(O2Oct, P("Osc 2 Octave", "", -2, 2, 0, "%.0f")); S(O2Semi, P("Osc 2 Semitones", "st", -12, 12, 0, "%.0f st"));
  S(O2Fine, P("Osc 2 Fine", "st", -1, 1, 0.08, "%.2f st")); S(O2Shape, P("Osc 2 Pulse width", "", 0, 1, 0.5)); S(O2Mode, P("Osc 2 Mode", "", 0, 3, 0, "%.0f", false, {"Free", "Sync", "Ring", "Cross FM"}));
  S(O2Amount, P("Osc 2 Ring / FM amount", "", 0, 1, 0.5)); S(O2Level, P("Osc 2 Level", "", 0, 1, 0));
  S(SubLevel, P("Sub level", "", 0, 1, 0)); S(SubType, P("Sub type", "", 0, 3, 0, "%.0f", false, {"-1 oct square", "-2 oct square", "-1 oct sine", "Subsonic"})); S(NoiseLevel, P("Noise level", "", 0, 1, 0));
  S(FType, P("Filter type", "", 0, 3, 0, "%.0f", false, {"LP 24 dB", "LP 12 dB", "Band pass", "High pass"})); S(FCut, P("Cutoff", "Hz", 20, 18000, 4000, "%.0f Hz", true)); S(FRes, P("Resonance", "", 0, 1, 0.2));
  S(FDrive, P("Drive", "", 0, 1, 0.1)); S(FEnv, P("Filter env amount", "", -1, 1, 0.3)); S(FKey, P("Key follow", "", 0, 1, 0.4)); S(FVel, P("Velocity to cutoff", "", 0, 1, 0.2));
  const char* en[8] = {"Amp attack", "Amp decay", "Amp sustain", "Amp release", "Filter attack", "Filter decay", "Filter sustain", "Filter release"};
  for (int i = 0; i < 8; ++i) { bool sus = i % 4 == 2; specs[(size_t)(AmpA + i)] = P(en[i], sus ? "" : "s", sus ? 0 : 0.001, sus ? 1 : 10, (i == 0 || i == 4) ? 0.005 : (i % 4 == 1 ? 0.3 : (sus ? (i < 4 ? 0.8 : 0.3) : 0.3)), sus ? "%.2f" : "%.3f s", !sus); }
  std::vector<std::string> lsh = {"Sine", "Triangle", "Saw", "Square", "Sample & hold", "Smooth random"}, lsync = {"Free", "4 bars", "2 bars", "1 bar", "1/2", "1/4", "1/8", "1/16"};
  for (int l = 0; l < 2; ++l) { int b = L1Shape + l * 5; std::string t = l ? "LFO 2 " : "LFO 1 ";
    specs[(size_t)b] = P((t + "Shape").c_str(), "", 0, 5, 0, "%.0f", false, lsh); specs[(size_t)b + 1] = P((t + "Rate").c_str(), "Hz", 0.02, 30, l ? 0.7 : 5, "%.2f Hz", true); specs[(size_t)b + 2] = P((t + "Sync").c_str(), "", 0, 7, 0, "%.0f", false, lsync);
    specs[(size_t)b + 3] = P((t + "Fade in").c_str(), "s", 0, 5, 0, "%.2f s"); specs[(size_t)b + 4] = P((t + "Key sync").c_str(), "", 0, 1, 1, "%.0f", false, onoff); }
  for (int k = 0; k < 4; ++k) { std::string t = "Patch " + std::to_string(k + 1) + " "; specs[(size_t)(VP1Src + k * 3)] = P((t + "Source").c_str(), "", 0, kSrcN - 1, 0, "%.0f", false, srcs); specs[(size_t)(VP1Src + k * 3 + 1)] = P((t + "Destination").c_str(), "", 0, kDstN - 1, 0, "%.0f", false, dsts); specs[(size_t)(VP1Src + k * 3 + 2)] = P((t + "Amount").c_str(), "", -1, 1, 0); }
  S(FxType, P("Insert type", "", 0, 7, 0, "%.0f", false, {"Off", "Distortion", "Overdrive", "Lo-Fi", "Slicer", "Phaser", "Flanger", "Ring mod"})); S(FxAmount, P("Insert amount", "", 0, 1, 0.5)); S(FxTone, P("Insert tone", "", 0, 1, 0.5)); S(FxMix, P("Insert mix", "", 0, 1, 1));
  S(ChMix, P("Chorus mix", "", 0, 1, 0.3)); S(ChRate, P("Chorus rate", "Hz", 0.05, 6, 0.6, "%.2f Hz", true)); S(ChDepth, P("Chorus depth", "", 0, 1, 0.5));
  S(DlTime, P("Delay time", "", 0, 5, 2, "%.0f", false, {"1/4", "1/8 dotted", "1/8", "1/8 triplet", "1/16 dotted", "1/16"})); S(DlFb, P("Delay feedback", "", 0, 0.95, 0.4)); S(DlTone, P("Delay tone", "", 0, 1, 0.6));
  S(DlPing, P("Delay ping-pong", "", 0, 1, 1, "%.0f", false, onoff)); S(DlMix, P("Delay mix", "", 0, 1, 0.2)); S(RvSize, P("Reverb size", "", 0, 1, 0.6)); S(RvDamp, P("Reverb damping", "", 0, 1, 0.5)); S(RvMix, P("Reverb mix", "", 0, 1, 0.2));
  S(SqMode, P("Sequencer mode", "", 0, 3, 0, "%.0f", false, {"Off", "Arp", "Step", "Arp x Step"})); S(SqRate, P("Sequencer rate", "", 0, 5, 2, "%.0f", false, {"1/4", "1/8", "1/16", "1/32", "1/8 triplet", "1/16 triplet"}));
  S(SqSwing, P("Swing", "", 0, 1, 0)); S(SqGate, P("Gate length", "", 0.05, 1, 0.6)); S(SqLen, P("Pattern length", "", 1, 16, 16, "%.0f"));
  S(SqDir, P("Arp direction", "", 0, 5, 0, "%.0f", false, {"Up", "Down", "Up-down", "Random", "As played", "Chord"})); S(SqOct, P("Arp octaves", "", 1, 4, 2, "%.0f")); S(SqLatch, P("Latch", "", 0, 1, 0, "%.0f", false, onoff));
  S(SqChord, P("Chord memory", "", 0, 15, 0, "%.0f", false, {"Off", "Major", "Minor", "Sus4", "Sus2", "Dominant 7", "Major 7", "Minor 7", "Diminished", "Augmented", "Power", "Octave", "Minor 9", "Major add9", "Sixth", "Minor sixth"}));
  S(SqRhythm, P("Rhythm style", "", 0, 15, 0, "%.0f", false, {"Straight 16", "Eighths", "Quarters", "Offbeat", "Accent 4", "Tresillo", "Syncopated", "Triplet feel", "Son clave", "Accented clave", "Tied", "Rolling", "Driving", "Pairs", "Sparse", "Shuffle"}));
  S(SqAccent, P("Accent amount", "", 0, 1, 0.6)); S(SqSlide, P("Slide time", "", 0, 1, 0.3)); S(SqHuman, P("Humanize", "", 0, 1, 0));
  for (int m = 0; m < 3; ++m) { std::string t = "Motion " + std::to_string(m + 1) + " "; specs[(size_t)(M1Dest + m * 2)] = P((t + "Destination").c_str(), "", 0, kDstN - 1, 0, "%.0f", false, dsts); specs[(size_t)(M1Dest + m * 2 + 1)] = P((t + "Depth").c_str(), "", 0, 1, 0.5); }
  for (int s = 0; s < kSteps; ++s) { std::string t = "Step " + std::to_string(s + 1) + " ";
    specs[(size_t)stepParam(s, SNote)] = P((t + "Note").c_str(), "st", -24, 24, 0, "%.0f st"); specs[(size_t)stepParam(s, SGate)] = P((t + "Gate").c_str(), "", 0, 2, 1, "%.0f", false, {"Off", "On", "Tie"});
    specs[(size_t)stepParam(s, SFlags)] = P((t + "Flags").c_str(), "", 0, 3, 0, "%.0f", false, {"-", "Accent", "Slide", "Accent+Slide"}); specs[(size_t)stepParam(s, SProb)] = P((t + "Probability").c_str(), "%", 0, 100, 100, "%.0f %%");
    specs[(size_t)stepParam(s, SRatchet)] = P((t + "Ratchet").c_str(), "", 1, 4, 1, "%.0f"); specs[(size_t)stepParam(s, SM1)] = P((t + "Motion 1").c_str(), "", 0, 1, 0.5); specs[(size_t)stepParam(s, SM2)] = P((t + "Motion 2").c_str(), "", 0, 1, 0.5); specs[(size_t)stepParam(s, SM3)] = P((t + "Motion 3").c_str(), "", 0, 1, 0.5); }
  specs[(size_t)Tempo] = P("Tempo", "BPM", 40, 240, 120, "%.0f BPM");
  return specs;
}
inline std::vector<int> rng_(int a, int n) { std::vector<int> r; for (int i = 0; i < n; ++i) r.push_back(a + i); return r; }
inline std::vector<int> stepIds(int f) { std::vector<int> r; for (int s = 0; s < kSteps; ++s) r.push_back(stepParam(s, f)); return r; }
inline std::vector<Group> makeGroups() {
  return {{"Main", {Volume, Voices, Mode, Glide, BendRange, Tempo}}, {"Oscillator 1", rng_(O1Wave, 8)}, {"Oscillator 2", rng_(O2Wave, 8)}, {"Sub & Noise", {SubLevel, SubType, NoiseLevel}},
    {"Filter", rng_(FType, 7)}, {"Amp envelope", rng_(AmpA, 4)}, {"Filter envelope", rng_(FltA, 4)}, {"LFO 1", rng_(L1Shape, 5)}, {"LFO 2", rng_(L2Shape, 5)},
    {"Virtual patch 1-2", rng_(VP1Src, 6)}, {"Virtual patch 3-4", rng_(VP3Src, 6)}, {"Insert effect", rng_(FxType, 4)}, {"Chorus", rng_(ChMix, 3)}, {"Delay", rng_(DlTime, 5)}, {"Reverb", rng_(RvSize, 3)},
    {"Arpeggiator / sequencer", rng_(SqMode, 13)}, {"Motion lanes", rng_(M1Dest, 6)},
    {"Step notes", stepIds(SNote)}, {"Step gates", stepIds(SGate)}, {"Step flags", stepIds(SFlags)}, {"Step probability", stepIds(SProb)}, {"Step ratchets", stepIds(SRatchet)},
    {"Step motion 1", stepIds(SM1)}, {"Step motion 2", stepIds(SM2)}, {"Step motion 3", stepIds(SM3)}};
}

// ---- tables
constexpr int kTabN = 1024, kFrames = 16, kMips = 9, kMaxH = 256;
struct SinTab { double t[2050]; SinTab() { for (int i = 0; i < 2050; ++i) t[i] = std::sin(2 * kPi * i / 2048); } };
inline const double* gSin() { static const SinTab s; return s.t; }
inline double fsin(double cyc) {
  if (!(std::fabs(cyc) < 1e6)) return 0;
  const double* g = gSin(); cyc -= std::floor(cyc); double x = cyc * 2048; int i = (int)x; if (i > 2048) i = 2048; double f = x - i; return g[i] + (g[i + 1] - g[i]) * f;
}
inline double whash(int a, int b) {
  uint32_t h = ((uint32_t)a * 2654435761u) ^ ((uint32_t)b * 40503u) ^ 0x9E3779B9u; h = h ^ (h >> 15); h = h * 2246822519u; h = h ^ (h >> 13); return double(h & 0xFFFFu) / 65535.0;
}
static const double FV[5][3] = {{800, 1150, 2900}, {400, 1600, 2700}, {270, 2300, 3000}, {450, 800, 2830}, {325, 700, 2530}}, GV[5][3] = {{800, 1050, 2800}, {600, 1000, 2500}, {300, 1800, 2900}, {500, 900, 2700}, {350, 650, 2400}};
static const double ORG[2][10] = {{1, 1, 0.8, 0, 0.5, 0, 0.3, 0.2, 0, 0}, {0.2, 1, 0.3, 0.9, 0.2, 0.7, 0.2, 0.6, 0.5, 0.4}};
inline void recipe(int t, double p, int k, double& ramp, double& rph) {
  double kk = k, amp = 0, ph = 0;
  switch (t) {
    case 0: amp = ((k & 1) ? 1 : (1 - p)) / kk; break;
    case 1: { double lim = 1 + p * 63; amp = kk <= lim ? 1 / kk : (kk < lim + 2 ? (lim + 2 - kk) * 0.5 / kk : 0); break; }
    case 2: case 6: {
      double x = p * 4; int i = std::min((int)x, 3); double f = x - i; const double (*A)[3] = t == 2 ? FV : GV; double s = 0;
      for (int j = 0; j < 3; ++j) { double c = (A[i][j] + (A[i + 1][j] - A[i][j]) * f) / 110, bw = 1.2 + 0.25 * c, d = (kk - c) / bw; s += std::exp(-0.5 * d * d) * (j == 0 ? 1 : 0.7); }
      amp = s / std::pow(kk, 0.3) * (t == 6 ? 1 : 0.8); if (t == 6) ph = 0.15 * whash(k, 6); break; }
    case 3: if (k > 10) { amp = 0; break; } amp = (ORG[0][k - 1] + (ORG[1][k - 1] - ORG[0][k - 1]) * p) * 0.6; break;
    case 4: { int s = 1 + (int)std::floor(p * 7); amp = ((k - 1) % s == 0) ? 1 / std::pow(kk, 0.7) : 0; break; }
    case 5: { int s = 2 + (int)std::floor(p * 6); amp = (1 / std::sqrt(kk)) * ((k % s == 0) ? 0.15 : 1); ph = whash(k, 5); break; }
    case 7: { double lv = 2 + (1 - p) * 30, a = 1 / kk; amp = std::floor(a * lv + 0.5) / lv; break; }
    case 8: { if (!(k & 1)) { amp = 0; break; } double c = 3 + p * 20, d = (kk - c) / (3 + p * 4); amp = (1 / kk) * (0.4 + 1.6 * std::exp(-0.5 * d * d)); break; }
    case 9: amp = (1 / kk) * (0.5 + 0.5 * std::cos(2 * kPi * kk * p * 0.5)); break;
    case 10: { double lim = 1 + p * 120; amp = kk <= lim ? 1 : 0; break; }
    default: amp = 1 / kk; ph = p * whash(k, 11); break;
  }
  ramp = amp; rph = ph;
}
struct WTBank {
  std::vector<float> tabs[12], sinT; std::mutex m;
  const float* table(int t) {
    std::lock_guard<std::mutex> lk(m); if (!tabs[t].empty()) return tabs[t].data();
    if (sinT.empty()) { sinT.resize(kTabN); for (int i = 0; i < kTabN; ++i) sinT[(size_t)i] = (float)std::sin(2 * kPi * i / kTabN); }
    std::vector<float>& T = tabs[t]; T.assign((size_t)kMips * kFrames * (kTabN + 1), 0.f);
    for (int f = 0; f < kFrames; ++f) {
      double p = double(f) / double(kFrames - 1), scale = 1;
      for (int mp = 0; mp < kMips; ++mp) {
        size_t off = (size_t)(mp * kFrames + f) * (kTabN + 1); int H = kMaxH >> mp;
        for (int k = 1; k <= H; ++k) {
          double a, ph; recipe(t, p, k, a, ph); if (a == 0) continue;
          int idx = ((int)(ph * kTabN)) & (kTabN - 1);
          for (int n = 0; n < kTabN; ++n) { T[off + (size_t)n] = (float)((double)T[off + (size_t)n] + a * (double)sinT[(size_t)idx]); idx = (idx + k) & (kTabN - 1); }
        }
        if (mp == 0) { double pk = 1e-6; for (int n = 0; n < kTabN; ++n) pk = std::max(pk, (double)std::fabs(T[off + (size_t)n])); scale = 0.9 / pk; }
        for (int n = 0; n < kTabN; ++n) T[off + (size_t)n] = (float)((double)T[off + (size_t)n] * scale);
        T[off + kTabN] = T[off];
      }
    }
    return T.data();
  }
};
inline WTBank& bank() { static WTBank b; return b; }
inline double wtRead(const float* T, double hz, double sr, double phase, double pos) {
  int m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
  double fp = (pos < 0 ? 0 : (pos > 1 ? 1 : pos)) * (kFrames - 1); int f0 = std::min((int)fp, kFrames - 2); double ff = fp - f0;
  double x = (phase - std::floor(phase)) * kTabN; int i = (int)x; double fr = x - i;
  size_t a = (size_t)(m * kFrames + f0) * (kTabN + 1) + (size_t)i, b = (size_t)(m * kFrames + f0 + 1) * (kTabN + 1) + (size_t)i;
  double va = (double)T[a] + ((double)T[a + 1] - (double)T[a]) * fr, vb = (double)T[b] + ((double)T[b + 1] - (double)T[b]) * fr; return va + (vb - va) * ff;
}

struct Rng {
  uint32_t s = 0; double white() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double((int32_t)s) / 2147483648.0; } double uni() { return 0.5 + 0.5 * white(); }
};
struct Rev {
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8], ai[2][4]; double cz[2][8];
  explicit Rev(double sr) {
    static const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) { cb[ch][k].assign((size_t)std::floor((ct[k] + ch * 23) * sr / 44100) + 1, 0.f); ci[ch][k] = 0; cz[ch][k] = 0; }
      for (int k = 0; k < 4; ++k) { ab[ch][k].assign((size_t)std::floor((at[k] + ch * 23) * sr / 44100) + 1, 0.f); ai[ch][k] = 0; }
    }
  }
  double tick(int ch, double inp, double fb, double damp) {
    double s = 0;
    for (int k = 0; k < 8; ++k) { std::vector<float>& b = cb[ch][k]; int i = ci[ch][k]; double y = b[(size_t)i]; double z = y * (1 - damp) + cz[ch][k] * damp; cz[ch][k] = z; b[(size_t)i] = (float)(inp + z * fb); ci[ch][k] = (i + 1 >= (int)b.size()) ? 0 : i + 1; s += y; }
    for (int k = 0; k < 4; ++k) { std::vector<float>& b = ab[ch][k]; int i = ai[ch][k]; double bo = b[(size_t)i], y = -s + bo; b[(size_t)i] = (float)(s + bo * 0.5); ai[ch][k] = (i + 1 >= (int)b.size()) ? 0 : i + 1; s = y; }
    return s;
  }
};
static const char* const rhythmPat[16] = {"xxxxxxxxxxxxxxxx", "x-x-x-x-x-x-x-x-", "x---x---x---x---", "-x-x-x-x-x-x-x-x", "xXxxxXxxxXxxxXxx", "x--x--x-x--x--x-", "x-xx-xx-x-xx-xx-", "xxx-xxx-xxx-xxx-",
  "x-x--x-x-x--x-x-", "X--xx-x-X--xx-x-", "xtxtxtxtxtxtxtxt", "x-xxx-x-x-xxx-xx", "X-x-x-xxX-x-x-xx", "xx--xx--xx--xx--", "x---x-x-x---x-x-", "-xx--xx--xx--xx-"};
static const std::vector<double> chordForms[16] = {{}, {4, 7}, {3, 7}, {5, 7}, {2, 7}, {4, 7, 10}, {4, 7, 11}, {3, 7, 10}, {3, 6}, {4, 8}, {7}, {12}, {3, 7, 10, 14}, {4, 7, 14}, {4, 7, 9}, {3, 7, 9}};
static const double SSOFF[7] = {-0.11002313, -0.06288439, -0.01952356, 0, 0.01991221, 0.06216538, 0.10745242};

struct GVoice {
  bool active = false, gate = false; double note = 60; long long age = 0; int quiet = 0, tick = 0; double offAt = -1, vel = 0, accent = 0, pitch = 60, target = 60, slideC = 0, rnd = 0;
  double ph[7] = {}, ph2 = 0, phSub = 0, fbz = 0, ic[2] = {}, ly[4] = {}, lt[4] = {}, aLv = 0, fLv = 0, wrap = 0; int aSt = 0, fSt = 0;
  double lph[2] = {}, lfade[2] = {}, lsh[2] = {}, lsh2[2] = {}, src[kSrcN] = {}, dst[kDstN] = {};
  double cutHz = 1000, qk = 1, gl = 0, aA = 0, aD = 0, aR = 0, fA = 0, fD = 0, fR = 0, panL = 0.7071 * 1.41421, panR = 0.7071 * 1.41421, spread = 0; Rng rng;
  void reset() {
    active = false; gate = false; note = 60; age = 0; quiet = 0; tick = 0; offAt = -1; vel = 0; accent = 0; pitch = 60; target = 60; slideC = 0; rnd = 0;
    std::fill(ph, ph + 7, 0.0); ph2 = 0; phSub = 0; fbz = 0; std::fill(ic, ic + 2, 0.0); std::fill(ly, ly + 4, 0.0); std::fill(lt, lt + 4, 0.0); aLv = 0; fLv = 0; wrap = 0; aSt = 0; fSt = 0;
    std::fill(lph, lph + 2, 0.0); std::fill(lfade, lfade + 2, 0.0); std::fill(lsh, lsh + 2, 0.0); std::fill(lsh2, lsh2 + 2, 0.0); std::fill(src, src + kSrcN, 0.0); std::fill(dst, dst + kDstN, 0.0); cutHz = 1000; qk = 1; gl = 0;
  }
};
struct Trig { double at, note, vel; bool accent, slide; double len; };
struct StepSpec { bool on, tie, slide; };
struct Cfg { int w1 = 0, w2 = 0, m2 = 0, ft = 0, st = 0, table = 0; double glide = 1, side = 0, cen = 0; };

struct Engine : EngineBase {
  std::vector<Spec> specs; GVoice voice[8]; std::vector<double> held, phys, play, arp; bool arpDirty = true, running = false, pendingStart = false; double clk = 0, stepLen = 12000; long long stepIdx = 0; int arpPos = 0;
  int nTrig = 0, lastSeq = -1; Trig trig[16]; double mot[3] = {0.5, 0.5, 0.5}, motT[3] = {0.5, 0.5, 0.5}, bend = 0, wheel = 0, press = 0, lastPitch = 0, lastVel = 0.8;
  double oL = 0, oR = 0, fx[2][8] = {}; int fxN[2] = {0, 0}; double fxPh = 0, rmPh = 0, chPh = 0, slPh = 0; int slIdx = 0; double dlz[2] = {0, 0};
  DelayLine dly[2], cho[2], fl[2]; Rev rev; Cfg c; const float* wt = nullptr; int wtIdx = -1;
  static DelayLine mk(double n, double sr) { return DelayLine((long long)std::floor(n * sr)); }
  explicit Engine(double s) : EngineBase(s), dly{mk(2.1, s), mk(2.1, s)}, cho{mk(0.06, s), mk(0.06, s)}, fl{mk(0.02, s), mk(0.02, s)}, rev(s) {
    specs = makeSpecs(); initParams(specs); for (int i = 0; i < 8; ++i) voice[i].rng.s = (uint32_t)(2463534242u + (uint32_t)i * 7919u);
  }
  double tempo() const { return v[Tempo]; }
  static double rnd(double x) { return std::floor(x + 0.5); }
  int seqMode() const { return (int)rnd(v[SqMode]); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; v[(size_t)id] = x;
    if (id == Preset) { loadPreset((int)rnd(x)); return; }
    if (id == SqMode) { if (seqMode() == 0) stopSeq(); }
    if (id == SqLatch && x < 0.5 && phys.empty()) { play.clear(); arpDirty = true; stopSeq(); }
    if (id == SqChord || id == SqDir || id == SqOct) arpDirty = true;
    if (id == O1Table || id == O1Wave) ensureTable();
  }
  void ensureTable() { if ((long long)rnd(v[O1Wave]) == 7) { int t = (int)clampd(rnd(v[O1Table]), 0, 11); if (t != wtIdx) { wt = bank().table(t); wtIdx = t; } } }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { wheel = m; } void pressure(double p) override { press = p; }
  static void erase(std::vector<double>& a, double n) { a.erase(std::remove(a.begin(), a.end(), n), a.end()); }
  void allNotesOff() override { for (auto& x : voice) x.gate = false; phys.clear(); if (!(v[SqLatch] > 0.5)) play.clear(); held.clear(); arpDirty = true; stopSeq(); }
  void noteOn(int noteI, double vel) override {
    double note = noteI, tuned = note + noteTune * 0.01; noteTune = 0;
    if (seqMode() == 0) { playNote(note, tuned, vel, false, -1); return; }
    if (v[SqLatch] > 0.5 && phys.empty()) play.clear();
    erase(phys, note); phys.push_back(note); erase(play, note); play.push_back(note); arpDirty = true; lastVel = vel;
    if (!running) { running = true; clk = 0; stepIdx = 0; arpPos = 0; nTrig = 0; pendingStart = true; }
  }
  void noteOff(int noteI) override {
    double note = noteI; erase(phys, note);
    if (seqMode() != 0) { if (v[SqLatch] < 0.5) { erase(play, note); arpDirty = true; if (play.empty()) stopSeq(); } return; }
    erase(held, note);
    int mode = (int)rnd(v[Mode]);
    if (mode != 0) { GVoice& x = voice[0]; if (!held.empty() && x.gate) { x.target = held.back(); x.note = x.target; } else if (held.empty()) x.gate = false; return; }
    for (auto& x : voice) if (x.active && x.gate && x.note == note && x.offAt < 0) x.gate = false;
  }
  GVoice* allocVoice() {
    int mode = (int)rnd(v[Mode]), sm = seqMode(); if (mode != 0 && sm == 0) return &voice[0];
    int lim = sm != 0 ? 8 : (int)clampd(rnd(v[Voices]), 1, 8);
    for (int i = 0; i < lim; ++i) if (!voice[i].active) return &voice[i];
    int o = 0; for (int i = 1; i < lim; ++i) if (voice[i].age > voice[o].age) o = i; return &voice[o];
  }
  void startVoice(GVoice& x, double note, double tuned, double vel, bool accent, bool retrig) {
    bool gl = v[Glide] > 0.001 && lastPitch > 0;
    if (retrig) { uint32_t seed = x.rng.s; x.reset(); x.rng.s = seed ^ ((uint32_t)((long long)note) * 2654435761u + 12345u); x.rng.white();
      for (int k = 0; k < 7; ++k) x.ph[k] = x.rng.uni(); x.ph2 = x.rng.uni(); x.rnd = x.rng.white(); x.fSt = x.aSt = 1; x.lph[0] = x.lph[1] = 0; }
    x.active = true; x.gate = true; x.note = note; x.vel = vel; x.accent = accent ? 1 : 0; x.target = tuned; x.pitch = gl ? lastPitch : tuned; x.age = 0; x.quiet = 0; x.offAt = -1; x.slideC = 0; lastPitch = tuned;
    if (retrig) { x.lfade[0] = x.lfade[1] = 0; if (v[L1Key] < 0.5) x.lph[0] = x.rng.uni(); if (v[L2Key] < 0.5) x.lph[1] = x.rng.uni(); }
  }
  void playNote(double note, double tuned, double vel, bool accent, double len) {
    int mode = (int)rnd(v[Mode]), sm = seqMode();
    if (mode == 2 && sm == 0 && voice[0].active && voice[0].gate) { GVoice& x = voice[0]; held.push_back(note); x.target = tuned; x.note = note; lastPitch = tuned; return; }
    if (mode != 0 && sm == 0) held.push_back(note);
    GVoice* x = allocVoice(); startVoice(*x, note, tuned, vel, accent, true); x->offAt = len;
    if (sm != 0) lastSeq = int(x - voice);
  }
  // ---- sequencer
  double stepSeconds() const { static const double b[6] = {1, 0.5, 0.25, 0.125, 1.0 / 3, 1.0 / 6}; return 60 / std::max(20.0, tempo()) * b[(int)clampd(rnd(v[SqRate]), 0, 5)]; }
  double stepLenFor(long long idx) const { double L = stepSeconds() * sr, s = v[SqSwing] * 0.5; return L * ((idx & 1) ? 1 - s : 1 + s); }
  void stopSeq() { running = false; nTrig = 0; for (auto& x : voice) if (x.offAt >= 0) { x.gate = false; x.offAt = -1; } }
  void rebuildArp() {
    arpDirty = false; arp.clear(); if (play.empty()) return;
    int dir = (int)rnd(v[SqDir]); std::vector<double> base = play; if (dir != 4) std::stable_sort(base.begin(), base.end());
    const std::vector<double>& form = chordForms[(int)clampd(rnd(v[SqChord]), 0, 15)]; std::vector<double> notes;
    for (double k : base) { notes.push_back(k); for (double iv : form) notes.push_back(k + iv); }
    if (dir != 4) { std::stable_sort(notes.begin(), notes.end()); std::vector<double> nn; for (size_t i = 0; i < notes.size(); ++i) if (i == 0 || notes[i] != notes[i - 1]) nn.push_back(notes[i]); notes = nn; }
    int octs = (int)clampd(rnd(v[SqOct]), 1, 4); std::vector<double> a;
    for (int o = 0; o < octs; ++o) for (double n : notes) a.push_back(std::min(127.0, n + 12 * o));
    if (dir == 1) std::reverse(a.begin(), a.end());
    else if (dir == 2 && a.size() > 2) { std::vector<double> d(a.begin() + 1, a.end() - 1); std::reverse(d.begin(), d.end()); for (double x : d) a.push_back(x); }
    arp = a; if (arpPos >= (int)arp.size()) arpPos = 0;
  }
  double nextArpNote() {
    if (arp.empty()) return 60; int dir = (int)rnd(v[SqDir]); double n;
    if (dir == 3) n = arp[(size_t)((long long)std::floor(voice[0].rng.uni() * (double)arp.size()) % (long long)arp.size())];
    else { n = arp[(size_t)(arpPos % (int)arp.size())]; arpPos = (arpPos + 1) % (int)arp.size(); }
    return n;
  }
  StepSpec specFor(long long idx) {
    int mode = seqMode();
    if (mode == 1) { char ch = rhythmPat[(int)clampd(rnd(v[SqRhythm]), 0, 15)][idx % 16]; return {ch != '-', ch == 't', false}; }
    int len = (int)clampd(rnd(v[SqLen]), 1, 16), sb = StepBase + (int)(idx % len) * kF, g = (int)rnd(v[sb + SGate]), fl_ = (int)rnd(v[sb + SFlags]);
    return {g != 0, g == 2, (fl_ & 2) != 0};
  }
  void beginStep() {
    if (arpDirty) rebuildArp();
    int mode = seqMode(); stepLen = stepLenFor(stepIdx);
    if (mode == 0 || play.empty()) return;
    int len = (int)clampd(rnd(v[SqLen]), 1, 16), si = (int)(stepIdx % len), sb = StepBase + si * kF;
    motT[0] = v[sb + SM1]; motT[1] = v[sb + SM2]; motT[2] = v[sb + SM3];
    nTrig = 0; double human = v[SqHuman]; int dir = (int)rnd(v[SqDir]);
    bool on = true, acc = false, slide = false, tie = false; int ratchet = 1; int offset = 0;
    if (mode == 1) { char ch = rhythmPat[(int)clampd(rnd(v[SqRhythm]), 0, 15)][stepIdx % 16]; on = ch != '-'; acc = ch == 'X'; tie = ch == 't'; }
    else { int g = (int)rnd(v[sb + SGate]), fl_ = (int)rnd(v[sb + SFlags]); on = g != 0; tie = g == 2; acc = (fl_ & 1) != 0; slide = (fl_ & 2) != 0;
      ratchet = (int)clampd(rnd(v[sb + SRatchet]), 1, 4); offset = (int)rnd(v[sb + SNote]); if (on && voice[0].rng.uni() * 100 > v[sb + SProb]) on = false; }
    if (!on) return;
    if (tie && lastSeq >= 0 && voice[lastSeq].active && voice[lastSeq].gate) { voice[lastSeq].offAt = std::trunc(stepLen * std::max(0.5, v[SqGate])) + 2; return; }
    double vel = acc ? 1 : clampd(lastVel * 0.85, 0.2, 1); std::vector<double> notes;
    if (mode == 2) notes.push_back(play.back() + offset);
    else if (mode == 1 && dir == 5) { if (arp.empty()) return; for (double n : arp) notes.push_back(n); if (notes.size() > 6) notes.resize(6); }
    else notes.push_back(nextArpNote() + (mode == 3 ? offset : 0));
    double gateV = clampd(v[SqGate], 0.05, 1), sub = stepLen / ratchet, gl = gateV >= 0.95 ? sub + 2 : std::max(40.0, gateV * sub);
    if (ratchet == 1) {
      double total = stepLen, lastLen = 0; long long j = 1; bool tied = false;
      while (j < 16) { StepSpec sp = specFor(stepIdx + j); if (!(sp.on && sp.tie)) break; lastLen = stepLenFor(stepIdx + j); total += lastLen; tied = true; ++j; }
      if (tied) gl = total - lastLen * (1 - gateV);
      StepSpec nx = specFor(stepIdx + j); if (nx.on && nx.slide) gl = std::max(gl, total + 2);
    }
    for (int r = 0; r < ratchet; ++r) for (double n : notes) { if (nTrig >= 16) break; double at = r * sub + (human > 0 ? voice[0].rng.uni() * human * 0.15 * stepLen : 0); trig[nTrig++] = Trig{at, clampd(n, 0, 127), vel, acc, slide && r == 0, gl}; }
  }
  void fireTrig(const Trig& t) {
    if (t.slide && lastSeq >= 0 && voice[lastSeq].active && voice[lastSeq].gate) {
      GVoice& x = voice[lastSeq]; x.target = t.note; x.note = t.note; x.slideC = 1 - std::exp(-1 / (std::max(0.002, v[SqSlide] * 0.3) * sr)); x.offAt = std::trunc(t.len); if (t.accent) x.accent = 1; lastPitch = t.note; return;
    }
    playNote(t.note, t.note, t.vel, t.accent, std::trunc(t.len));
  }
  void seqClock() {
    mot[0] += (motT[0] - mot[0]) * 0.004; mot[1] += (motT[1] - mot[1]) * 0.004; mot[2] += (motT[2] - mot[2]) * 0.004;
    if (!running || seqMode() == 0) return;
    if (pendingStart) { pendingStart = false; beginStep(); }
    for (int i = 0; i < nTrig;) { if (clk >= trig[i].at) { Trig t = trig[i]; trig[i] = trig[--nTrig]; fireTrig(t); } else ++i; }
    clk += 1; if (clk >= stepLen) { clk -= stepLen; ++stepIdx; if (nTrig > 0) { int n = nTrig; nTrig = 0; for (int i = 0; i < n; ++i) { Trig t = trig[i]; fireTrig(t); } } beginStep(); }
  }
  // ---- voice
  double lfoShape(int shape, double ph, GVoice& x, int k, bool wrap) {
    switch (shape) {
      case 1: return 4 * std::fabs(ph - 0.5) - 1;
      case 2: return 2 * ph - 1;
      case 3: return ph < 0.5 ? 1 : -1;
      case 4: if (wrap) x.lsh[k] = x.rng.white(); return x.lsh[k];
      case 5: if (wrap) { x.lsh2[k] = x.lsh[k]; x.lsh[k] = x.rng.white(); } return x.lsh2[k] + (x.lsh[k] - x.lsh2[k]) * (0.5 - 0.5 * std::cos(kPi * ph));
      default: return fsin(ph);
    }
  }
  void controlTick(GVoice& x) {
    const double T = 8; double lf[2] = {0, 0}; static const double beats[8] = {0, 16, 8, 4, 2, 1, 0.5, 0.25};
    for (int k = 0; k < 2; ++k) {
      int b = L1Shape + k * 5, sync = (int)rnd(v[b + 2]); double rate = sync > 0 ? (sync < 8 ? tempo() / 60 / beats[sync] : NAN) : v[b + 1]; if (k == 0) rate *= std::pow(2.0, x.dst[DstLfoRate] * 3);
      x.lph[k] += clampd(rate, 0.001, 100) * T / sr; bool wrap = false; if (x.lph[k] >= 1) { x.lph[k] -= std::floor(x.lph[k]); wrap = true; }
      double fade = v[b + 3]; x.lfade[k] = fade > 0.001 ? std::min(1.0, x.lfade[k] + T / (fade * sr)) : 1;
      lf[k] = lfoShape((int)rnd(v[b]), x.lph[k], x, k, wrap) * x.lfade[k];
    }
    double* s = x.src;
    s[0] = 0; s[1] = lf[0]; s[2] = lf[1]; s[3] = x.fLv; s[4] = x.aLv; s[5] = x.vel; s[6] = (x.note - 60) / 36; s[7] = wheel; s[8] = press; s[9] = bend; s[10] = (mot[0] - 0.5) * 2; s[11] = (mot[1] - 0.5) * 2; s[12] = (mot[2] - 0.5) * 2; s[13] = x.rnd;
    double* d = x.dst; std::fill(d, d + kDstN, 0.0);
    for (int k = 0; k < 4; ++k) { int sc = (int)rnd(v[VP1Src + k * 3]), t = (int)rnd(v[VP1Src + k * 3 + 1]); if (sc > 0 && t > 0 && t < kDstN) d[t] += s[(int)clampd(sc, 0, kSrcN - 1)] * v[VP1Src + k * 3 + 2]; }
    for (int m = 0; m < 3; ++m) { int t = (int)rnd(v[M1Dest + m * 2]); if (t > 0 && t < kDstN) d[t] += (mot[m] - 0.5) * 2 * v[M1Dest + m * 2 + 1]; }
    auto inc = [&](double t) { return 1 / std::max(1.0, t * sr); }; auto coef = [&](double t) { return 1 - std::exp(-4 / std::max(1.0, t * sr)); };
    x.aA = inc(v[AmpA]); x.aD = coef(v[AmpD]); x.aR = coef(v[AmpR]); x.fA = inc(v[FltA]); x.fD = coef(v[FltD]); x.fR = coef(v[FltR]);
    double acc = x.accent * v[SqAccent];
    double oct = std::log2(v[FCut] / 1000) + v[FEnv] * x.fLv * 4 * (1 + acc * 0.8) + v[FKey] * (x.note - 60) / 12 + v[FVel] * (x.vel - 0.5) * 2 + d[DstCut] * 4 + acc;
    bool lad = (int)rnd(v[FType]) == 0;
    x.cutHz = clampd(1000 * std::pow(2.0, oct), 20, lad ? sr * 0.25 : sr * 0.45);
    double res = clampd(v[FRes] + d[DstRes] * 0.5, 0, 1); x.qk = lad ? res : (1 / (0.6 + res * res * 24));
    x.gl = lad ? std::min(0.6, 1 - std::exp(-2 * kPi * x.cutHz / sr)) : std::tan(kPi * x.cutHz / sr);
    double pan = clampd(d[DstPan], -1, 1), a = (pan + 1) * 0.25 * kPi; x.panL = std::cos(a) * 1.41421; x.panR = std::sin(a) * 1.41421;
    double xx = clampd(v[O1Detune] + d[DstDetune] * 0.5, 0, 1); x.spread = xx * xx;
  }
  void prepBlock() {
    c.w1 = (int)rnd(v[O1Wave]); c.w2 = (int)rnd(v[O2Wave]); c.m2 = (int)rnd(v[O2Mode]); c.ft = (int)rnd(v[FType]); c.st = (int)rnd(v[SubType]);
    c.glide = v[Glide] > 0.001 ? 1 - std::exp(-1 / (std::max(0.0005, v[Glide] * v[Glide] * 1.5) * sr)) : 1;
    double mix = v[O1Mix]; c.side = -0.73764 * mix * mix + 1.2841 * mix + 0.044372; c.cen = -0.55366 * mix + 0.99785;
    c.table = (int)clampd(rnd(v[O1Table]), 0, 11); if (c.w1 == 7 && wtIdx != c.table) ensureTable();
  }
  void renderVoice(GVoice& x) {
    if (x.tick == 0) controlTick(x); x.tick = (x.tick + 1) & 7;
    if (x.offAt >= 0 && --x.offAt < 0) x.gate = false;
    x.pitch += (x.target - x.pitch) * (x.slideC > 0 ? x.slideC : c.glide);
    bool gate = x.gate;
    if (gate) { if (x.fSt == 0) x.fSt = 1; if (x.aSt == 0) x.aSt = 1; } else { if (x.fSt != 0 && x.fSt != 3) x.fSt = 3; if (x.aSt != 0 && x.aSt != 3) x.aSt = 3; }
    if (x.fSt == 1) { x.fLv += x.fA; if (x.fLv >= 1) { x.fLv = 1; x.fSt = 2; } } else if (x.fSt == 2) x.fLv += (v[FltS] - x.fLv) * x.fD; else if (x.fSt == 3) { x.fLv -= x.fLv * x.fR; if (x.fLv < 1e-5) { x.fLv = 0; x.fSt = 0; } }
    if (x.aSt == 1) { x.aLv += x.aA; if (x.aLv >= 1) { x.aLv = 1; x.aSt = 2; } } else if (x.aSt == 2) x.aLv += (v[AmpS] - x.aLv) * x.aD; else if (x.aSt == 3) { x.aLv -= x.aLv * x.aR; if (x.aLv < 1e-5) { x.aLv = 0; x.aSt = 0; } }
    double aenv = x.aLv;
    if (x.aSt == 0 && !x.gate) { x.active = false; return; }
    const double* d = x.dst; double base = x.pitch + bend * v[BendRange] + d[DstPitch] * 24; int m2 = c.m2;
    double f2 = clampd(midiHz(base + v[O2Oct] * 12 + v[O2Semi] + v[O2Fine] + d[DstPitch2] * 12), 0, sr * 0.45), dt2 = f2 / sr, o2 = 0;
    if (m2 == 1 && x.wrap > 0.5) x.ph2 = 0;
    double ph2 = x.ph2;
    switch (c.w2) {
      case 0: o2 = 2 * ph2 - 1 - polyBlep(ph2, dt2); break;
      case 1: { double pw = clampd(v[O2Shape], 0.05, 0.95); o2 = ph2 < pw ? 1 : -1; o2 += polyBlep(ph2, dt2); double t2 = ph2 + 1 - pw; if (t2 >= 1) t2 -= 1; o2 -= polyBlep(t2, dt2); break; }
      case 2: o2 = 4 * std::fabs(ph2 - 0.5) - 1; break;
      case 3: o2 = fsin(ph2); break;
      default: o2 = x.rng.white(); break;
    }
    x.ph2 += dt2; if (x.ph2 >= 1) x.ph2 -= std::floor(x.ph2);
    double f1 = clampd(midiHz(base + v[O1Oct] * 12 + v[O1Fine]), 0, sr * 0.45), dt = f1 / sr; int w1 = c.w1;
    double shape = clampd(v[O1Shape] + d[DstShape] * 0.5, 0, 1), cross = clampd(v[O2Amount] + d[DstCross] * 0.5, 0, 1), pmod = m2 == 3 ? o2 * cross * 0.5 : 0;
    double o1 = 0, ph = 0; bool wrapped = false;
    switch (w1) {
      case 0: { double spread = x.spread, side = c.side, cen = c.cen; double* P0 = x.ph; double sum = 0;
        for (int k = 0; k < 7; ++k) { double ratio = 1 + SSOFF[k] * spread, dd = std::min(0.45, dt * ratio); double p = P0[k] + pmod; p -= std::floor(p); sum += (2 * p - 1 - polyBlep(p, dd)) * (k == 3 ? cen : side);
          P0[k] += dd; if (P0[k] >= 1) { P0[k] -= std::floor(P0[k]); if (k == 3) wrapped = true; } }
        o1 = sum * 0.32; break; }
      case 1: ph = x.ph[0] + pmod; ph -= std::floor(ph); o1 = 2 * ph - 1 - polyBlep(ph, dt); break;
      case 2: { ph = x.ph[0] + pmod; ph -= std::floor(ph); double pw = 0.05 + 0.9 * shape; o1 = ph < pw ? 1 : -1; o1 += polyBlep(ph, dt); double t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; o1 -= polyBlep(t2, dt); break; }
      case 3: ph = x.ph[0] + pmod; ph -= std::floor(ph); o1 = 4 * std::fabs(ph - 0.5) - 1; break;
      case 4: ph = x.ph[0] + pmod; ph -= std::floor(ph); ph += shape * 0.25 * fsin(ph * 2); ph -= std::floor(ph); o1 = 4 * std::fabs(ph - 0.5) - 1; break;
      case 5: ph = x.ph[0] + pmod; ph -= std::floor(ph); o1 = fsin(ph + shape * 1.8 * x.fbz); x.fbz = 0.5 * (o1 + x.fbz); break;
      case 6: { ph = x.ph[0] + pmod; ph -= std::floor(ph); double ratio = 1 + shape * 7, win = 0.5 - 0.5 * std::cos(2 * kPi * ph); o1 = fsin(ph * ratio) * win * 1.6; break; }
      case 7: o1 = wt ? wtRead(wt, std::max(f1, 1.0), sr, x.ph[0], shape) : 0; break;
      default: o1 = x.rng.white(); break;
    }
    if (w1 != 0) { x.ph[0] += dt; if (x.ph[0] >= 1) { x.ph[0] -= std::floor(x.ph[0]); wrapped = true; } }
    x.wrap = wrapped ? 1 : 0;
    double subf = clampd(midiHz(base - 12), 1, sr * 0.45); int st = c.st; if (st == 1) subf *= 0.5; if (st == 3) subf *= 0.5; x.phSub += subf / sr; x.phSub -= std::floor(x.phSub);
    double sub = (st == 0 || st == 1) ? (x.phSub < 0.5 ? 0.7 : -0.7) : fsin(x.phSub);
    double nz = x.rng.white();
    double mixv = o1 * v[O1Level] + o2 * v[O2Level] + sub * v[SubLevel] + nz * v[NoiseLevel] * 0.5;
    if (m2 == 2) mixv += o1 * o2 * cross * 1.2;
    double drive = 1 + v[FDrive] * 3, y;
    if (c.ft == 0) {
      double* ly = x.ly; double* lt = x.lt; double g = x.gl, xx = fastTanh(mixv * drive - 4 * x.qk * ly[3] * 0.95);
      ly[0] += g * (xx - lt[0]); lt[0] = fastTanh(ly[0]); ly[1] += g * (lt[0] - lt[1]); lt[1] = fastTanh(ly[1]); ly[2] += g * (lt[1] - lt[2]); lt[2] = fastTanh(ly[2]); ly[3] += g * (lt[2] - lt[3]); lt[3] = fastTanh(ly[3]);
      if (!std::isfinite(ly[3])) { std::fill(ly, ly + 4, 0.0); std::fill(lt, lt + 4, 0.0); } y = ly[3] * (1 + 0.4 * v[FRes]) / (0.5 + 0.5 * drive);
    } else {
      double* ic = x.ic; double xx = fastTanh(mixv * drive), g = x.gl, k = x.qk, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = xx - ic[1], v1 = a1 * ic[0] + a2 * v3, v2 = ic[1] + a2 * ic[0] + a3 * v3;
      ic[0] = 2 * v1 - ic[0]; ic[1] = 2 * v2 - ic[1]; if (!std::isfinite(v2)) { ic[0] = ic[1] = 0; }
      y = c.ft == 1 ? v2 : (c.ft == 2 ? v1 * k : xx - k * v1 - v2);
    }
    double amp = clampd(1 + d[DstAmp], 0, 2) * aenv * (0.35 + 0.65 * x.vel) * (1 + x.accent * v[SqAccent] * 0.5);
    y *= amp; if (!(std::fabs(y) < 50)) y = 0;
    oL += y * x.panL; oR += y * x.panR;
    double pk = std::fabs(y); ++x.age; if (!x.gate) { if (pk < 1e-5) { if (++x.quiet > (int)(0.3 * sr)) x.active = false; } else x.quiet = 0; }
  }
  // ---- effects + output
  void process(float* outL, float* outR, int n) override {
    prepBlock();
    int ft = (int)rnd(v[FxType]); double fxAmt = v[FxAmount], fxTone = v[FxTone], fxMix = v[FxMix];
    double chMix = v[ChMix], chRate = v[ChRate], chDepth = v[ChDepth], dlMix = v[DlMix], dlFb = v[DlFb], dlTone = v[DlTone]; bool ping = v[DlPing] > 0.5;
    double rvMix = v[RvMix], rvFb = 0.7 + 0.28 * v[RvSize], rvDm = v[RvDamp] * 0.4, vol = v[Volume] * 1.4, tp = std::max(20.0, tempo());
    static const double dtab[6] = {1, 0.75, 0.5, 1.0 / 3, 0.375, 0.25}; double dlTm = clampd(60 / tp * dtab[(int)clampd(rnd(v[DlTime]), 0, 5)] * sr, 4, 2 * sr);
    double slSamples = stepSeconds() * 0.5 * sr; static const char slPat[] = "xx-xxx-xx-xxx-x-";
    for (int i = 0; i < n; ++i) {
      seqClock();
      oL = 0; oR = 0; for (int k = 0; k < 8; ++k) { GVoice& x = voice[k]; if (x.active) renderVoice(x); }
      double l = oL * 0.5, r = oR * 0.5;
      if (ft != 0) {
        double x0 = l, x1 = r, w0 = 0, w1 = 0;
        for (int ch = 0; ch < 2; ++ch) {
          double inp = ch ? x1 : x0, y = inp; double* s = fx[ch];
          switch (ft) {
            case 1: y = fastTanh(inp * (1 + fxAmt * 14)) / (0.4 + 0.6 * fastTanh(1 + fxAmt * 3)); s[0] += (y - s[0]) * (0.05 + 0.9 * fxTone); y = s[0]; break;
            case 2: { double dd = 1 + fxAmt * 8; y = fastTanh(inp * dd + 0.15 * fxAmt) - fastTanh(0.15 * fxAmt); y /= (0.5 + 0.5 * dd * 0.3); s[0] += (y - s[0]) * (0.1 + 0.9 * fxTone); y = s[0]; break; }
            case 3: { double steps = std::pow(2.0, 2 + (1 - fxAmt) * 12), hold = 1 + std::floor((1 - fxTone) * 24); if (++fxN[ch] >= hold) { fxN[ch] = 0; s[1] = std::floor(inp * steps + 0.5) / steps; } y = s[1]; break; }
            case 4: { if (ch == 0) { slPh += 1; if (slPh >= slSamples) { slPh -= slSamples; slIdx = (slIdx + 1) & 15; } } double tgt = slPat[slIdx] == 'x' ? 1 : 1 - fxAmt; s[0] += (tgt - s[0]) * 0.01; y = inp * s[0]; break; }
            case 5: { if (ch == 0) fxPh += (0.1 + fxTone * 3) / sr; fxPh -= std::floor(fxPh); double f = 300 * std::pow(12.0, 0.5 + 0.5 * fxAmt * fsin(fxPh)), t = std::tan(kPi * std::min(f, sr * 0.4) / sr), a = (t - 1) / (t + 1);
              double u = inp + s[5] * 0.5; for (int k = 0; k < 4; ++k) { double o = a * u + s[1 + k]; s[1 + k] = u - a * o; u = o; } if (!std::isfinite(u)) { std::fill(s, s + 8, 0.0); u = 0; } s[5] = u; y = 0.5 * (inp + u); break; }
            case 6: { if (ch == 0) fxPh += (0.05 + fxTone * 1.5) / sr; fxPh -= std::floor(fxPh); double dl = (0.0035 + 0.003 * fsin(fxPh + ch * 0.25)) * sr, w = fl[ch].read(std::max(2.0, dl)); fl[ch].push(inp + w * fxAmt * 0.8); y = 0.5 * (inp + w); break; }
            default: { if (ch == 0) rmPh += (20 + fxTone * fxTone * 2000) / sr; rmPh -= std::floor(rmPh); y = inp * (1 - fxAmt) + inp * fsin(rmPh) * fxAmt; break; }
          }
          double wv = inp + (y - inp) * fxMix; if (ch) w1 = wv; else w0 = wv;
        }
        l = w0; r = w1;
      }
      if (chMix > 0.001) {
        chPh += chRate / sr; chPh -= std::floor(chPh); double dp = chDepth * 0.004 * sr, bs = 0.012 * sr;
        cho[0].push(l); cho[1].push(r); double wl = cho[0].read(std::max(2.0, bs + dp * fsin(chPh))), wr = cho[1].read(std::max(2.0, bs + dp * fsin(chPh + 0.5)));
        l = l * (1 - chMix * 0.5) + wl * chMix * 0.7; r = r * (1 - chMix * 0.5) + wr * chMix * 0.7;
      }
      if (dlMix > 0.001) {
        double wl = dly[0].read(dlTm), wr = dly[1].read(dlTm), tk = 0.05 + 0.95 * dlTone; dlz[0] += (wl - dlz[0]) * tk; dlz[1] += (wr - dlz[1]) * tk;
        dly[0].push(clampd(l * 0.7 + (ping ? dlz[1] : dlz[0]) * dlFb, -4, 4)); dly[1].push(clampd(r * 0.7 + (ping ? dlz[0] : dlz[1]) * dlFb, -4, 4));
        l += dlz[0] * dlMix; r += dlz[1] * dlMix;
      }
      if (rvMix > 0.001) { double x = (l + r) * 0.015, wl = rev.tick(0, x, rvFb, rvDm), wr = rev.tick(1, x, rvFb, rvDm); l = l * (1 - rvMix * 0.4) + wl * 3 * rvMix; r = r * (1 - rvMix * 0.4) + wr * 3 * rvMix; }
      l = fastTanh(l * vol); r = fastTanh(r * vol);
      if (!std::isfinite(l + r)) { l = r = 0; }
      outL[i] = (float)l; outR[i] = (float)r;
    }
  }
  // ---- presets
  int nameToId(const char* nm) const { int id = -1; for (size_t i = 0; i < specs.size(); ++i) if (specs[i].name == nm) id = (int)i; return id; }
  void loadPreset(int pi) {
    pi = (int)clampd(pi, 0, kPresets - 1); std::vector<double> old = v;
    for (int k = 0; k < Count; ++k) if (k != Preset && k != Volume && k != Tempo) v[(size_t)k] = specs[(size_t)k].def;
    v[Preset] = pi;
    auto A = [&](std::initializer_list<std::pair<const char*, double>> kv) { for (auto& e : kv) { int id = nameToId(e.first); if (id >= 0) v[(size_t)id] = e.second; } };
    auto St = [&](int n, double note, double gate, double flags = 0, double prob = 100, double ratchet = 1, double m1 = 0.5, double m2 = 0.5, double m3 = 0.5) { int b = StepBase + n * kF; v[(size_t)(b + SNote)] = note; v[(size_t)(b + SGate)] = gate; v[(size_t)(b + SFlags)] = flags; v[(size_t)(b + SProb)] = prob; v[(size_t)(b + SRatchet)] = ratchet; v[(size_t)(b + SM1)] = m1; v[(size_t)(b + SM2)] = m2; v[(size_t)(b + SM3)] = m3; };
    switch (pi) {
      case 1: A({{"Osc 1 Detune", 0.62}, {"Osc 1 Super mix", 0.75}, {"Cutoff", 6500}, {"Resonance", 0.15}, {"Filter env amount", 0.25}, {"Amp release", 0.35}, {"Glide", 0.08}, {"Play mode", 2}, {"Chorus mix", 0.45}, {"Delay mix", 0.28}, {"Reverb mix", 0.25},
          {"Patch 1 Source", SrcLfo1}, {"Patch 1 Destination", DstPitch}, {"Patch 1 Amount", 0.012}, {"LFO 1 Fade in", 0.6}, {"LFO 1 Rate", 5.5}}); break;
      case 2: A({{"Osc 1 Detune", 0.55}, {"Osc 1 Super mix", 0.6}, {"Filter type", 1}, {"Cutoff", 1800}, {"Resonance", 0.2}, {"Filter env amount", 0.3}, {"Amp attack", 1.2}, {"Amp release", 2.6}, {"Filter attack", 1.4}, {"Filter decay", 2.0}, {"Filter sustain", 0.5},
          {"Patch 1 Source", SrcLfo1}, {"Patch 1 Destination", DstCut}, {"Patch 1 Amount", 0.3}, {"LFO 1 Shape", 1}, {"LFO 1 Rate", 0.18}, {"Patch 2 Source", SrcLfo2}, {"Patch 2 Destination", DstPan}, {"Patch 2 Amount", 0.5}, {"LFO 2 Rate", 0.3},
          {"Chorus mix", 0.6}, {"Chorus rate", 0.3}, {"Reverb size", 0.9}, {"Reverb mix", 0.45}, {"Delay mix", 0.15}}); break;
      case 3: A({{"Play mode", 1}, {"Glide", 0.12}, {"Osc 1 Wave", 5}, {"Osc 1 Shape", 0.55}, {"Osc 1 Octave", -1}, {"Sub level", 0.6}, {"Sub type", 2}, {"Cutoff", 750}, {"Resonance", 0.35}, {"Filter env amount", 0.5}, {"Filter decay", 0.35}, {"Filter sustain", 0.2},
          {"Amp sustain", 0.9}, {"Amp release", 0.2}, {"Insert type", 1}, {"Insert amount", 0.3}, {"Insert tone", 0.6}, {"Chorus mix", 0.1}, {"Delay mix", 0.1}, {"Reverb mix", 0.1}}); break;
      case 4: A({{"Sequencer mode", 2}, {"Sequencer rate", 2}, {"Gate length", 0.55}, {"Osc 1 Wave", 6}, {"Osc 1 Shape", 0.35}, {"Osc 2 Wave", 1}, {"Osc 2 Mode", 1}, {"Osc 2 Semitones", 7}, {"Osc 2 Level", 0.35}, {"Filter type", 1}, {"Cutoff", 2600}, {"Resonance", 0.3},
          {"Amp decay", 0.14}, {"Amp sustain", 0.35}, {"Amp release", 0.16}, {"Filter env amount", 0.3}, {"Motion 1 Destination", DstCut}, {"Motion 1 Depth", 0.6}, {"Motion 2 Destination", DstShape}, {"Motion 2 Depth", 0.5},
          {"Delay mix", 0.3}, {"Delay time", 2}, {"Reverb mix", 0.2}});
        { static const double nt[16] = {0, 0, 12, 0, 7, 0, 10, 0, 0, 3, 0, 12, 7, 5, 0, -5}; for (int n = 0; n < 16; ++n) St(n, nt[n], (n == 1 || n == 6 || n == 13) ? 0 : 1, n % 4 == 0 ? 1 : 0, 100, 1, 0.5 + 0.45 * std::sin(n * 0.7), 0.5 + 0.4 * std::cos(n * 0.5), 0.5); } break;
      case 5: A({{"Sequencer mode", 2}, {"Sequencer rate", 2}, {"Gate length", 0.5}, {"Osc 1 Wave", 1}, {"Cutoff", 420}, {"Resonance", 0.72}, {"Filter env amount", 0.85}, {"Filter decay", 0.22}, {"Filter sustain", 0}, {"Filter release", 0.1},
          {"Amp decay", 0.25}, {"Amp sustain", 0.55}, {"Amp release", 0.08}, {"Slide time", 0.35}, {"Accent amount", 0.85}, {"Insert type", 1}, {"Insert amount", 0.3}, {"Delay mix", 0.3}, {"Delay time", 1}, {"Reverb mix", 0.1}, {"Drive", 0.4}});
        { static const double nt[16] = {0, 0, 12, 0, 0, 10, 0, 7, 0, 0, 12, 0, 3, 0, 5, 7}, gt[16] = {1, 1, 1, 0, 1, 1, 0, 1, 1, 2, 1, 0, 1, 1, 1, 2}, fl_[16] = {1, 0, 2, 0, 0, 1, 0, 2, 1, 0, 2, 0, 0, 0, 1, 2};
          for (int n = 0; n < 16; ++n) St(n, nt[n], gt[n], fl_[n], 100, 1, 0.5, 0.5, 0.5); } break;
      case 6: A({{"Sequencer mode", 1}, {"Arp direction", 2}, {"Arp octaves", 3}, {"Chord memory", 7}, {"Rhythm style", 3}, {"Sequencer rate", 2}, {"Gate length", 0.45}, {"Osc 1 Detune", 0.35}, {"Osc 1 Super mix", 0.6}, {"Cutoff", 3500}, {"Filter env amount", 0.5},
          {"Filter decay", 0.2}, {"Filter sustain", 0.1}, {"Amp decay", 0.2}, {"Amp sustain", 0.4}, {"Amp release", 0.25}, {"Delay time", 1}, {"Delay mix", 0.38}, {"Reverb mix", 0.3}, {"Chorus mix", 0.3}}); break;
      case 7: A({{"Play mode", 1}, {"Osc 1 Wave", 1}, {"Osc 1 Level", 0.55}, {"Osc 1 Octave", -1}, {"Sub level", 0.85}, {"Sub type", 2}, {"Filter type", 1}, {"Cutoff", 520}, {"Resonance", 0.18}, {"Filter env amount", 0.4}, {"Filter decay", 0.3}, {"Filter sustain", 0.4},
          {"Amp sustain", 0.9}, {"Amp release", 0.15}, {"Insert type", 2}, {"Insert amount", 0.3}, {"Chorus mix", 0}, {"Delay mix", 0}, {"Reverb mix", 0.05}}); break;
      case 8: A({{"Osc 1 Wave", 2}, {"Osc 1 Shape", 0.3}, {"Osc 2 Level", 0.35}, {"Osc 2 Wave", 1}, {"Osc 2 Octave", 1}, {"Cutoff", 1400}, {"Resonance", 0.3}, {"Filter env amount", 0.7}, {"Filter decay", 0.3}, {"Filter sustain", 0},
          {"Amp decay", 0.38}, {"Amp sustain", 0}, {"Amp release", 0.3}, {"Patch 1 Source", SrcLfo2}, {"Patch 1 Destination", DstShape}, {"Patch 1 Amount", 0.4}, {"LFO 2 Rate", 0.6},
          {"Delay time", 1}, {"Delay feedback", 0.55}, {"Delay mix", 0.4}, {"Delay ping-pong", 1}, {"Reverb mix", 0.3}}); break;
      case 9: A({{"Osc 1 Wave", 6}, {"Osc 1 Shape", 0.5}, {"Osc 2 Level", 0.35}, {"Filter type", 1}, {"Cutoff", 3200}, {"Filter env amount", 0.1}, {"Amp attack", 1.3}, {"Amp release", 2.6}, {"Patch 1 Source", SrcLfo2}, {"Patch 1 Destination", DstShape}, {"Patch 1 Amount", 0.45}, {"LFO 2 Shape", 5}, {"LFO 2 Rate", 0.4},
          {"Patch 2 Source", SrcLfo1}, {"Patch 2 Destination", DstPitch}, {"Patch 2 Amount", 0.02}, {"LFO 1 Fade in", 1.5}, {"LFO 1 Rate", 5}, {"Chorus mix", 0.6}, {"Reverb size", 0.9}, {"Reverb mix", 0.55}, {"Delay mix", 0.12}}); break;
      case 10: A({{"Sequencer mode", 1}, {"Arp direction", 0}, {"Arp octaves", 2}, {"Chord memory", 10}, {"Rhythm style", 5}, {"Sequencer rate", 2}, {"Osc 1 Wave", 3}, {"Osc 2 Wave", 3}, {"Osc 2 Semitones", 7}, {"Osc 2 Fine", 0.3}, {"Osc 2 Mode", 2}, {"Osc 2 Ring / FM amount", 0.85},
          {"Osc 2 Level", 0.1}, {"Cutoff", 5500}, {"Amp decay", 0.18}, {"Amp sustain", 0.2}, {"Amp release", 0.2}, {"Insert type", 5}, {"Insert amount", 0.6}, {"Insert mix", 0.7}, {"Delay time", 2}, {"Delay mix", 0.3}, {"Reverb mix", 0.25}}); break;
      case 11: A({{"Sequencer mode", 3}, {"Arp direction", 0}, {"Arp octaves", 2}, {"Chord memory", 2}, {"Sequencer rate", 2}, {"Gate length", 0.5}, {"Osc 1 Wave", 1}, {"Osc 2 Wave", 0}, {"Osc 2 Mode", 1}, {"Osc 2 Semitones", 7}, {"Osc 2 Level", 0.5},
          {"Cutoff", 1800}, {"Resonance", 0.4}, {"Filter env amount", 0.4}, {"Filter decay", 0.2}, {"Amp decay", 0.18}, {"Amp sustain", 0.4}, {"Motion 1 Destination", DstPitch2}, {"Motion 1 Depth", 0.8}, {"Motion 2 Destination", DstCut}, {"Motion 2 Depth", 0.6},
          {"Delay mix", 0.3}, {"Delay time", 1}, {"Reverb mix", 0.2}});
        { static const double gt[16] = {1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1}, rt[16] = {1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 1, 1}, on[16] = {0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 12, 0, 0, 7, 0, 0};
          for (int n = 0; n < 16; ++n) St(n, on[n], gt[n], n % 4 == 0 ? 1 : 0, n == 9 ? 60 : 100, rt[n], 0.5 + 0.5 * std::sin(n * 0.4), 0.5 + 0.45 * std::sin(n * 0.9 + 1.0), 0.5); } break;
      default: break;
    }
    for (int k = 0; k < Count; ++k) if (k != Preset && std::fabs(v[(size_t)k] - old[(size_t)k]) > 1e-6) writeParam(k, v[(size_t)k]);
    play.clear(); phys.clear(); held.clear(); arpDirty = true; stopSeq(); ensureTable();
  }
};
inline Info info() {
  return Info{"galactica", "Galactica", "Space-age polysynth: JP-8000 Super Saw, SH-32 arpeggiator with chord memory, MS-2000 virtual patch bay and motion lanes, plus a 16-step sequencer.", makeSpecs(), makeGroups(),
              Theme{"galactica", 0xff1a1040, 0xff05030f, 0xff9a86ff, 0xffece8ff, 0xff5fe3ff}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::galactica
