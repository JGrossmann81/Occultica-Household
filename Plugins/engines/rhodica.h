// Rhodica: Rhodes-style electric piano (tine FM with bark, ping, tremolo/autopan amp, chorus).
#pragma once
#include "../common/engine.h"
namespace occ { namespace rhodica {
enum { Preset, Tone, Bark, Ping, Decay, Damper, VelSens, Spread, TremMode, TremRate, TremDepth, Chorus_, Drive, BendRange, Volume, Count };
inline std::vector<Spec> makeSpecs() {
  return {
    P("Preset", "", 0, 8, 8, "%.0f", false, {"Mark I", "Stage bright", "Mellow", "Barky", "Suitcase tremolo", "Autopan wide", "Bell pad", "Chorus dream", "Init"}),
    P("Tone", "", 0, 1, 0.5), P("Bark", "", 0, 1, 0.4), P("Tine ping", "", 0, 1, 0.4), P("Decay", "s", 0.5, 12, 4, "%.1f s", true), P("Damper", "s", 0.02, 2, 0.12, "%.2f s", true),
    P("Velocity", "", 0, 1, 0.7), P("Key spread", "", 0, 1, 0.3), P("Tremolo", "", 0, 2, 0, "%.0f", false, {"Off", "Tremolo", "Autopan"}), P("Trem rate", "Hz", 0.5, 9, 4.5, "%.1f Hz", true), P("Trem depth", "", 0, 1, 0.5),
    P("Chorus", "", 0, 1, 0), P("Drive", "", 0, 1, 0.15), P("Bend range", "st", 0, 12, 2, "%.0f st"), P("Volume", "dB", -24, 6, -6, "%.1f dB"),
  };
}
inline std::vector<Group> makeGroups() { return {{"Tine", {Tone, Bark, Ping, Decay, Damper, VelSens, Spread}}, {"Amp", {TremMode, TremRate, TremDepth, Chorus_, Drive, BendRange, Volume}}}; }
struct Voice { double tune = 0, gain = 1, ph = 0, ph2 = 0, amp = 0, vel = 1, tA = 0, tI = 0, pan = 0, last = 0; int note = 60; bool gate = false; long age = 0; };
struct Engine : EngineBase {
  Voice voice[20]; Chorus chorus; Lfo lfo; DcBlock dcL, dcR; double bend = 0, mod = 0;
  explicit Engine(double sr) : EngineBase(sr), chorus(sr) { initParams(makeSpecs()); }
  void set(int id, double x) override { if (id < 0 || id >= Count) return; v[id] = x; if (id == Preset) loadPreset((int)std::lround(x)); }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; }
  void allNotesOff() override { for (auto& vo : voice) vo.gate = false; }
  void noteOn(int note, double vel) override {
    int pick = -1; for (int i = 0; i < 20; ++i) if (voice[i].amp < 1e-4 && !voice[i].gate) { pick = i; break; }
    if (pick < 0) { long old = 1L << 60; for (int i = 0; i < 20; ++i) if (voice[i].age < old) { old = voice[i].age; pick = i; } }
    voice[pick] = Voice(); Voice& vo = voice[pick]; vo.note = note; vo.tune = noteTune * 0.01; vo.gate = true; vo.age = ++counter;
    double sens = v[VelSens]; vo.vel = 1 - sens + sens * vel; vo.gain = std::pow(std::max(0.05, vo.vel), 1.3); vo.tI = 0; vo.tA = 0; vo.amp = 1e-3;
    vo.pan = clampd((note - 60) / 36.0, -1, 1) * v[Spread] * 0.5;
  }
  void noteOff(int note) override { for (auto& vo : voice) if (vo.gate && vo.note == note) vo.gate = false; }
  void loadPreset(int n) {
    static const double PS[9][12] = {{.45, .40, .40, 4.5, .14, .7, .30, 0, 4.5, .5, .15, .15}, {.75, .55, .55, 3.5, .10, .75, .30, 0, 4.5, .5, .20, .20}, {.20, .15, .20, 6, .18, .6, .30, 0, 4.5, .5, .25, .05}, {.55, .95, .45, 3, .10, .9, .25, 0, 4.5, .5, 0, .45},
      {.45, .45, .40, 4.5, .14, .7, .15, 1, 5.2, .55, 0, .30}, {.50, .40, .40, 4.5, .14, .7, .15, 2, 3.2, .75, 0, .20}, {.30, .10, .85, 10, .60, .5, .50, 0, 4.5, .5, .45, 0}, {.40, .30, .35, 5, .15, .7, .40, 0, 4.5, .5, .75, .10}, {.50, .40, .40, 4, .12, .7, .30, 0, 4.5, .5, 0, .15}};
    static const int ids[12] = {Tone, Bark, Ping, Decay, Damper, VelSens, Spread, TremMode, TremRate, TremDepth, Chorus_, Drive};
    int k = (int)clampd(n, 0, 8); for (int i = 0; i < 12; ++i) { v[ids[i]] = PS[k][i]; writeParam(ids[i], PS[k][i]); }
  }
  void process(float* outL, float* outR, int n) override {
    double vol = std::pow(10.0, v[Volume] / 20), bendSt = bend * v[BendRange], drive = 1 + v[Drive] * 5;
    double damp = std::exp(-1 / (v[Damper] * sr * 0.25)); int tm = (int)clampd(std::lround(v[TremMode]), 0, 2); double td = v[TremDepth], bark = v[Bark], dmul = 1 + (drive - 1) * 0.3;
    for (int i = 0; i < n; ++i) {
      double lf = lfo.next(v[TremRate], sr, 0), L = 0, R = 0;
      for (auto& vo : voice) {
        if (!vo.gate && vo.amp < 1e-5) { vo.amp = 0; continue; }
        double f = midiHz(vo.note + vo.tune + bendSt); vo.ph += f / sr; if (vo.ph >= 1) vo.ph -= std::floor(vo.ph);
        double keyScale = std::pow(2.0, -(vo.note - 60) / 30.0), tauA = std::max(0.15, v[Decay] * keyScale) / 6.9 * 2.2, tauI = std::max(0.08, 0.55 * keyScale);
        vo.tA += 1 / sr; vo.tI += 1 / sr;
        double envA = 0.55 * std::exp(-vo.tA / (tauA * 0.18)) + 0.45 * std::exp(-vo.tA / tauA);
        double reg = 1.25 - (vo.note - 36) / 90.0;
        double idx = (0.35 + 2.6 * v[Tone]) * (0.25 + 0.75 * vo.vel * vo.vel) * reg * (0.45 + 0.9 * bark) * std::exp(-vo.tI / tauI) + 0.12 * v[Tone];
        double x = std::sin(PI2 * vo.ph + idx * std::sin(PI2 * vo.ph));
        double pingHz = f * 14;
        if (pingHz < sr * 0.42 && v[Ping] > 0) { vo.ph2 += pingHz / sr; if (vo.ph2 >= 1) vo.ph2 -= std::floor(vo.ph2); x += v[Ping] * 0.32 * vo.vel * std::exp(-vo.tA / 0.05) * std::sin(PI2 * vo.ph2); }
        x = x + 0.35 * bark * vo.vel * x * x;
        if (!vo.gate) vo.amp *= damp; else vo.amp = envA;
        if (vo.gate) vo.last = envA; else if (vo.amp > vo.last) vo.amp = vo.last;
        double y = x * vo.amp * vo.gain * 0.5;
        L += y * (0.5 - vo.pan * 0.5 + 0.25); R += y * (0.5 + vo.pan * 0.5 + 0.25);
      }
      L = dcL.run(L); R = dcR.run(R);
      L = fastTanh(L * drive) / drive * dmul; R = fastTanh(R * drive) / drive * dmul;
      if (tm == 1) { double g = 1 - td * 0.5 * (1 + lf); L *= g; R *= g; } else if (tm == 2) { L *= 1 - td * 0.5 * (1 + lf); R *= 1 - td * 0.5 * (1 - lf); }
      outL[i] = (float)(L * vol); outR[i] = (float)(R * vol);
    }
    if (v[Chorus_] > 0.001) for (int i = 0; i < n; ++i) { double l = outL[i], r = outR[i]; chorus.process(l, r, 0.45, 0.7, v[Chorus_]); outL[i] = (float)l; outR[i] = (float)r; }
  }
};
inline Info info() {
  return Info{"rhodica", "Rhodica", "Rhodes-style electric piano: bell-like tines that bark when you play harder, with a tremolo amp.", makeSpecs(), makeGroups(),
              Theme{"rhodica", 0xff1b2a2e, 0xff070d0f, 0xff7fd6c9, 0xffe6f6f2, 0xffa8f0e4}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::rhodica
