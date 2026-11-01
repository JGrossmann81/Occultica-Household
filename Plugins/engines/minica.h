// Minica: Minimoog-style monosynth with optional poly mode (three oscillators, ladder filter, glide).
#pragma once
#include "../common/engine.h"
namespace occ { namespace minica {
enum { Preset, O1Range, O1Wave, O2Range, O2Wave, O2Tune, O3Range, O3Wave, O3Tune, O3Kbd, Vol1, Vol2, Vol3, VolNoise, Overload, Cutoff, Emphasis, Contour, KbdTrack, FAtt, FDec, FSus, AAtt, ADec, ASus, Release, Glide, Mode, Trigger, LfoRate, LfoShape, VibDepth, FiltMod, Velocity, BendRange, Volume, FilterDrive, LowMidDrive, LowMidFreq, Count };
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> rng = {"32'", "16'", "8'", "4'", "2'"}, wav = {"Triangle", "Shark tooth", "Saw", "Square", "Wide pulse", "Narrow pulse"};
  return {
    P("Preset", "", 0, 9, 9, "%.0f", false, {"Fat bass", "Lead (singing)", "Brass", "Funk bass", "Pluck", "Sync-ish lead", "Soft pad", "Sub bass", "Wow sweep", "Init"}),
    P("Osc 1 range", "", 0, 4, 2, "%.0f", false, rng), P("Osc 1 wave", "", 0, 5, 2, "%.0f", false, wav),
    P("Osc 2 range", "", 0, 4, 2, "%.0f", false, rng), P("Osc 2 wave", "", 0, 5, 2, "%.0f", false, wav), P("Osc 2 tune", "cents", -100, 100, 6, "%.0f c"),
    P("Osc 3 range", "", 0, 4, 1, "%.0f", false, rng), P("Osc 3 wave", "", 0, 5, 2, "%.0f", false, wav), P("Osc 3 tune", "cents", -100, 100, -6, "%.0f c"),
    P("Osc 3 follows keys", "", 0, 1, 1, "%.0f", false, {"Off", "On"}),
    P("Osc 1 level", "", 0, 1, 0.8), P("Osc 2 level", "", 0, 1, 0.7), P("Osc 3 level", "", 0, 1, 0.7), P("Noise level", "", 0, 1, 0),
    P("Overload", "", 0, 1, 0.3),
    P("Cutoff", "Hz", 30, 16000, 900, "%.0f Hz", true), P("Emphasis", "", 0, 1, 0.25), P("Contour amount", "", 0, 1, 0.5),
    P("Keyboard tracking", "", 0, 3, 2, "%.0f", false, {"Off", "1/3", "2/3", "Full"}),
    P("Filter attack", "s", 0.001, 5, 0.005, "%.3f s", true), P("Filter decay", "s", 0.005, 8, 0.45, "%.3f s", true), P("Filter sustain", "", 0, 1, 0.3),
    P("Loudness attack", "s", 0.001, 5, 0.004, "%.3f s", true), P("Loudness decay", "s", 0.005, 8, 0.6, "%.3f s", true), P("Loudness sustain", "", 0, 1, 0.8),
    P("Release", "s", 0.005, 8, 0.25, "%.3f s", true), P("Glide", "s", 0, 2, 0, "%.2f s"),
    P("Voices", "", 0, 2, 0, "%.0f", false, {"Mono", "Poly 4", "Poly 8"}), P("Trigger", "", 0, 1, 1, "%.0f", false, {"Single (legato)", "Multi (retrigger)"}),
    P("LFO rate", "Hz", 0.1, 25, 5.5, "%.1f Hz", true), P("LFO shape", "", 0, 3, 0, "%.0f", false, {"Triangle", "Square", "Saw up", "Sample & hold"}),
    P("Vibrato", "", 0, 1, 0), P("Filter mod", "", 0, 1, 0),
    P("Velocity", "", 0, 1, 0.5), P("Bend range", "st", 0, 24, 2, "%.0f st"), P("Volume", "dB", -24, 6, -6, "%.1f dB"),
    P("Filter drive", "", 0, 1, 0.35), P("Low-mid drive", "", 0, 1, 0), P("Low-mid focus", "Hz", 120, 1200, 380, "%.0f Hz", true),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Oscillators", {O1Range, O1Wave, O2Range, O2Wave, O2Tune, O3Range, O3Wave, O3Tune, O3Kbd}},
          {"Mixer", {Vol1, Vol2, Vol3, VolNoise, Overload}},
          {"Filter", {Cutoff, Emphasis, Contour, KbdTrack, FAtt, FDec, FSus, FilterDrive, LowMidDrive, LowMidFreq}},
          {"Loudness", {AAtt, ADec, ASus, Release}},
          {"Play", {Mode, Trigger, Glide, Velocity, BendRange, Volume}},
          {"Modulation", {LfoRate, LfoShape, VibDepth, FiltMod}}};
}
struct Voice { Osc o[3]; Ladder lad; Adsr fe, ae; Noise noise; double cur = 60, target = 60, vel = 1; int note = -1; bool gate = false; long long age = 0; };
struct Held { int note; double vel; };
inline double wave(Osc& o, int w, double dt) {
  double s;
  switch (w) { case 0: s = o.tri(); break; case 1: s = 0.5 * (o.tri() + o.saw(dt)); break; case 2: s = o.saw(dt); break; case 3: s = o.square(dt, 0.5); break; case 4: s = o.square(dt, 0.3) - 0.4; break; default: s = o.square(dt, 0.15) - 0.7; }
  o.advance(dt); return s * 0.5;
}
struct Engine : EngineBase {
  std::vector<Spec> specs; Voice voice[8]; std::vector<Held> stack; Lfo lfo; Svf lm; double bend = 0, mod = 0, press = 0, glideC = 0, kbd = 0.667;
  explicit Engine(double sr) : EngineBase(sr), specs(makeSpecs()) { initParams(specs); for (auto& vo : voice) { vo.fe.setSr(sr); vo.ae.setSr(sr); } configure(); }
  void set(int id, double x) override { if (id < 0 || id >= Count) return; v[id] = x; if (id == Preset) { loadPreset((int)std::lround(x)); return; } configure(); }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; } void pressure(double p) override { press = p; }
  void allNotesOff() override { stack.clear(); for (auto& vo : voice) if (vo.ae.active()) { vo.ae.gateOff(); vo.fe.gateOff(); vo.gate = false; } }
  int voices() const { int m = (int)std::lround(v[Mode]); return m == 0 ? 1 : (m == 1 ? 4 : 8); }
  void noteOn(int note, double vel) override {
    int nv = voices(); double nt = noteTune * 0.01;
    if (nv == 1) {
      stack.erase(std::remove_if(stack.begin(), stack.end(), [&](const Held& h) { return h.note == note; }), stack.end());
      bool wasHeld = !stack.empty() && voice[0].gate;
      stack.push_back({note, vel});
      Voice& vo = voice[0]; vo.target = note + nt; vo.vel = vel;
      if (!wasHeld || vo.ae.st == 0) vo.cur = note + nt;
      if (!(wasHeld && v[Trigger] < 0.5)) { vo.fe.gateOn(false); vo.ae.gateOn(false); }
      vo.gate = true; vo.note = note; return;
    }
    int pick = -1; for (int i = 0; i < nv; ++i) if (!voice[i].ae.active()) { pick = i; break; }
    if (pick < 0) { long long oldest = 1LL << 60; for (int i = 0; i < nv; ++i) if (voice[i].age < oldest) { oldest = voice[i].age; pick = i; } }
    Voice& vo = voice[pick]; vo.note = note; vo.cur = vo.target = note + nt; vo.vel = vel; vo.gate = true; vo.age = ++counter;
    vo.fe.gateOn(true); vo.ae.gateOn(true);
  }
  void noteOff(int note) override {
    if (voices() == 1) {
      stack.erase(std::remove_if(stack.begin(), stack.end(), [&](const Held& h) { return h.note == note; }), stack.end()); Voice& vo = voice[0];
      if (!stack.empty()) { Held t = stack.back(); vo.target = t.note; vo.note = t.note; if (v[Trigger] > 0.5) { vo.fe.gateOn(false); vo.ae.gateOn(false); } }
      else { vo.gate = false; vo.fe.gateOff(); vo.ae.gateOff(); }
      return;
    }
    for (int i = 0; i < 8; ++i) { Voice& vo = voice[i]; if (vo.gate && vo.note == note) { vo.gate = false; vo.fe.gateOff(); vo.ae.gateOff(); } }
  }
  void configure() {
    glideC = v[Glide] <= 0.001 ? 1 : 1 - std::exp(-1 / (v[Glide] * 0.35 * sr));
    static const double kt[4] = {0, 0.333, 0.667, 1}; kbd = kt[(int)clampd(std::lround(v[KbdTrack]), 0, 3)];
    for (auto& vo : voice) { vo.fe.set(v[FAtt], v[FDec], v[FSus], v[Release]); vo.ae.set(v[AAtt], v[ADec], v[ASus], v[Release]); }
  }
  void loadPreset(int n) {
    static const double INIT[] = {0, 2, 2, 2, 2, 6, 1, 2, -6, 1, 0.8, 0.7, 0.7, 0, 0.3, 900, 0.25, 0.5, 2, 0.005, 0.45, 0.3, 0.004, 0.6, 0.8, 0.25, 0, 0, 1, 5.5, 0, 0, 0, 0.5, 2, -6};
    struct KV { int id; double val; };
    static const std::vector<std::vector<KV>> PS = {
      {{O1Range, 1}, {O2Range, 1}, {O3Range, 0}, {O1Wave, 2}, {O2Wave, 2}, {O3Wave, 3}, {Cutoff, 500}, {Emphasis, 0.3}, {Contour, 0.55}, {FDec, 0.28}, {FSus, 0.2}, {ASus, 0.9}, {Release, 0.15}, {Overload, 0.45}},
      {{O1Wave, 2}, {O2Wave, 2}, {O3Wave, 3}, {O2Tune, 8}, {O3Tune, -8}, {Cutoff, 2600}, {Emphasis, 0.2}, {Contour, 0.25}, {FDec, 0.8}, {FSus, 0.6}, {ASus, 1}, {Glide, 0.12}, {VibDepth, 0.15}, {Release, 0.3}, {Trigger, 0}},
      {{O1Wave, 2}, {O2Wave, 2}, {O3Wave, 2}, {O2Tune, 10}, {O3Tune, -10}, {Cutoff, 700}, {Emphasis, 0.15}, {Contour, 0.7}, {FAtt, 0.12}, {FDec, 0.5}, {FSus, 0.5}, {AAtt, 0.04}, {ASus, 0.9}, {Release, 0.35}, {Mode, 2}},
      {{O1Range, 1}, {O2Range, 1}, {O3Range, 1}, {O1Wave, 3}, {O2Wave, 2}, {O3Wave, 0}, {Cutoff, 300}, {Emphasis, 0.45}, {Contour, 0.9}, {FDec, 0.16}, {FSus, 0}, {ADec, 0.3}, {ASus, 0}, {Release, 0.1}, {Trigger, 1}},
      {{O1Wave, 4}, {O2Wave, 2}, {O3Wave, 0}, {Cutoff, 400}, {Emphasis, 0.35}, {Contour, 0.85}, {FDec, 0.2}, {FSus, 0}, {ADec, 0.35}, {ASus, 0}, {Release, 0.2}, {Mode, 1}},
      {{O1Wave, 5}, {O2Wave, 2}, {O3Wave, 5}, {O2Tune, 14}, {O3Tune, -3}, {Cutoff, 3200}, {Emphasis, 0.5}, {Contour, 0.2}, {ASus, 1}, {Glide, 0.08}, {Release, 0.2}},
      {{O1Wave, 0}, {O2Wave, 1}, {O3Wave, 0}, {O2Tune, 9}, {O3Tune, -9}, {Cutoff, 1200}, {Emphasis, 0.1}, {Contour, 0.3}, {FAtt, 0.6}, {FDec, 1.5}, {FSus, 0.6}, {AAtt, 0.5}, {ASus, 1}, {Release, 1.2}, {Mode, 2}, {VibDepth, 0.08}},
      {{O1Range, 0}, {O2Range, 1}, {O3Range, 0}, {O1Wave, 3}, {O2Wave, 0}, {O3Wave, 0}, {Vol2, 0.3}, {Vol3, 0.4}, {Cutoff, 250}, {Emphasis, 0.1}, {Contour, 0.2}, {ASus, 1}, {Release, 0.12}},
      {{O1Wave, 2}, {O2Wave, 2}, {O3Wave, 2}, {Cutoff, 200}, {Emphasis, 0.7}, {Contour, 0.9}, {FAtt, 0.9}, {FDec, 1.4}, {FSus, 0.1}, {ASus, 1}, {Release, 0.8}, {FiltMod, 0.35}, {LfoRate, 0.6}, {Mode, 2}},
      {}};
    int idx = (int)clampd(n, 0, (double)PS.size() - 1); std::vector<double> nv(INIT, INIT + 36); while ((int)nv.size() < Count) nv.push_back(0);
    for (const KV& kv : PS[idx]) nv[kv.id] = kv.val;
    for (int i = 1; i < Count; ++i) { v[i] = nv[i]; writeParam(i, nv[i]); }
    configure();
  }
  void process(float* outL, float* outR, int n) override {
    int nv = voices(); double vol = std::pow(10.0, v[Volume] / 20), sr_ = sr; static const int shapeMap[4] = {1, 3, 2, 4}; int shp = shapeMap[(int)clampd(std::lround(v[LfoShape]), 0, 3)];
    auto shift = [&](int id) { return (std::lround(v[id]) - 2) * 12.0; };
    for (int i = 0; i < n; ++i) {
      double l = lfo.next(v[LfoRate], sr_, shp), vib = l * (v[VibDepth] + mod * 0.6) * 0.5, fmod = l * (v[FiltMod] + mod * 0.5 + press * 0.3), bendSt = bend * v[BendRange];
      double mix = 0;
      for (int k = 0; k < nv; ++k) {
        Voice& vo = voice[k]; if (!vo.ae.active()) continue;
        vo.cur += (vo.target - vo.cur) * glideC;
        double base = vo.cur + bendSt + vib;
        double f1 = midiHz(base + shift(O1Range)), f2 = midiHz(base + shift(O2Range) + v[O2Tune] * 0.01);
        double f3 = midiHz((v[O3Kbd] > 0.5 ? base : 60 + bendSt) + shift(O3Range) + v[O3Tune] * 0.01);
        double s = 0;
        s += v[Vol1] * wave(vo.o[0], (int)v[O1Wave], f1 / sr_);
        s += v[Vol2] * wave(vo.o[1], (int)v[O2Wave], f2 / sr_);
        s += v[Vol3] * wave(vo.o[2], (int)v[O3Wave], f3 / sr_);
        if (v[VolNoise] > 0) s += v[VolNoise] * 0.6 * vo.noise.white();
        double fe = vo.fe.next(), ae = vo.ae.next(), kt = kbd * (vo.cur - 60) / 12, vsc = 1 - v[Velocity] + v[Velocity] * vo.vel;
        double oct = v[Contour] * 5 * fe * (0.4 + 0.6 * vsc) + kt + fmod * 1.5;
        vo.lad.set(v[Cutoff] * std::pow(2.0, oct), std::min(1.1, v[Emphasis] * 1.08), sr_, 1 + v[Overload] * 2.5 + v[FilterDrive] * 9);
        double y = vo.lad.run(s * (0.5 + v[Overload] + v[FilterDrive] * 1.5));
        mix += y * ae * (0.5 + 0.5 * vsc);
      }
      if (v[LowMidDrive] > 0.001) {
        lm.set(v[LowMidFreq], 0.8, sr_); lm.run(mix); double band = lm.band * lm.k, d = 1 + v[LowMidDrive] * 14;
        mix += (fastTanh(band * d) / d * (1 + v[LowMidDrive] * 3) - band);
      }
      mix = fastTanh(mix * 0.9) * vol * 0.9; outL[i] = (float)mix; outR[i] = (float)mix;
    }
  }
};
inline Info info() {
  return Info{"minica", "Minica", "Minimoog-style analogue monosynth: three oscillators, a ladder filter and glide.", makeSpecs(), makeGroups(),
              Theme{"minica", 0xff2a1a10, 0xff0e0805, 0xffe8a33d, 0xfff3e2c4, 0xffffc766}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::minica
