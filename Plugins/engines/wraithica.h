// Wraithica: theremin, musical saw, glass harmonica and waterphone in one instrument, with a built-in haunting reverb bloom.
#pragma once
#include "../common/engine.h"
namespace occ { namespace wraithica {
enum { Preset, Model, VibRate, VibDepth, Glide, Motion, Haunt, Breath, Tone, Attack, Release, Bend, Level, Count };
struct Row { const char* name; double m[12]; };
static const Row ROWS[12] = {
  {"Classic Theremin", {0, 5.4, 0.35, 0.10, 0.25, 0.25, 0.10, 0.45, 0.06, 0.30, 2, -6}}, {"Haunted Parlour", {0, 4.6, 0.45, 0.22, 0.45, 0.80, 0.18, 0.35, 0.18, 1.20, 2, -7}},
  {"Sci-Fi Warble", {0, 7.5, 0.80, 0.05, 0.60, 0.40, 0.05, 0.75, 0.03, 0.40, 12, -7}}, {"Singing Saw", {1, 5.8, 0.55, 0.12, 0.40, 0.25, 0.20, 0.50, 0.12, 0.45, 2, -6}},
  {"Carnival Wobble", {1, 6.8, 0.70, 0.08, 0.90, 0.20, 0.30, 0.60, 0.05, 0.30, 2, -7}}, {"Frozen Lake", {1, 4.2, 0.30, 0.30, 0.30, 0.90, 0.10, 0.25, 0.60, 3.00, 2, -7}},
  {"Glass Chapel", {2, 4.0, 0.15, 0.04, 0.35, 0.50, 0.12, 0.50, 0.35, 1.80, 2, -8}}, {"Wet Rim", {2, 3.5, 0.20, 0.03, 0.80, 0.30, 0.35, 0.70, 0.25, 1.00, 2, -8}},
  {"Seance Pad", {2, 3.0, 0.10, 0.10, 0.55, 1.00, 0.20, 0.35, 1.20, 5.00, 2, -8}}, {"Deep Water", {3, 4.0, 0.10, 0.06, 0.70, 0.55, 0.10, 0.45, 0.50, 3.00, 2, -7}},
  {"Ghost Ship", {3, 3.0, 0.15, 0.15, 1.00, 0.85, 0.25, 0.60, 0.80, 5.00, 2, -7}}, {"Bowed Bowl", {3, 5.0, 0.20, 0.03, 0.30, 0.20, 0.05, 0.30, 0.25, 0.80, 2, -7}}};
inline std::vector<Spec> makeSpecs() {
  const double* d0 = ROWS[0].m; std::vector<std::string> names; for (auto& r : ROWS) names.push_back(r.name);
  return {
    P("Preset", "", 0, 11, 0, "%.0f", false, names), P("Model", "", 0, 3, d0[0], "%.0f", false, {"Theremin", "Musical saw", "Glass harmonica", "Waterphone"}),
    P("Vib rate", "Hz", 0.5, 10, d0[1], "%.1f Hz"), P("Vib depth", "", 0, 1, d0[2], "%.2f"),
    P("Glide", "s", 0.003, 3, d0[3], "%.3f s", true), P("Motion", "", 0, 1, d0[4], "%.2f"), P("Haunt", "", 0, 1, d0[5], "%.2f"),
    P("Breath", "", 0, 1, d0[6], "%.2f"), P("Tone", "", 0, 1, d0[7], "%.2f"),
    P("Attack", "s", 0.005, 4, d0[8], "%.3f s", true), P("Release", "s", 0.02, 8, d0[9], "%.2f s", true),
    P("Bend", "st", 0, 24, d0[10], "%.0f st"), P("Level", "dB", -30, 6, d0[11], "%+.1f dB"),
  };
}
inline std::vector<Group> makeGroups() { return {{"Instrument", {Model, Tone, Breath, Haunt, Level}}, {"Bow & hand", {Attack, Release, Glide, Bend}}, {"Motion", {VibRate, VibDepth, Motion}}}; }

struct SinTab { double t[4098]; SinTab() { for (int i = 0; i <= 4097; ++i) t[i] = std::sin(2 * kPi * i / 4096.0); } };
inline double sinCyc(double ph) { static const SinTab st; double x = ph * 4096; long long i = (long long)std::floor(x); double f = x - double(i); i &= 4095; return st.t[i] + (st.t[i + 1] - st.t[i]) * f; }
inline double rnd01(Noise& n) { return 0.5 + 0.5 * n.white(); }
static const double VIB[4] = {90, 70, 18, 14}, MGAIN[4] = {0.55, 0.50, 0.60, 0.32}, GR[4] = {1, 2.32, 4.25, 6.63}, WR[8] = {1, 1.52, 2.17, 2.83, 3.61, 4.76, 5.93, 7.31}, GB[4] = {1, 0.40, 0.18, 0.08};
constexpr int kPoly = 8, kMono = 8, kSlots = 9, kStack = 16;
inline double velVol(double v) { return 0.2 + 0.8 * v; }
inline double sawWeight(int k, double tone, double motion, double wobB) { double p = 2.2 - 1.2 * tone, d = (k - 3.5) / 1.6; double a = std::pow((double)k, -p) * (1 + 0.9 * tone * std::exp(-d * d)); a *= std::max(0.0, 1 + motion * 0.8 * wobB * 0.15 * (k - 1)); return a; }
inline double glassWeight(int k, double tone) { return k == 0 ? 1 : GB[k] * (0.15 + 1.7 * tone * tone); }
inline double waterWeight(int k, double tone) { return std::exp(-k * (1.25 - 1.0 * tone) * 0.33) / (1 + 0.25 * k); }

struct Voice {
  double ph[16], amp[16], beat[8], sk[8], skD[8], shPh[8], shRate[8], ratioJit[8]; Adsr env; Noise noise; Svf nsv;
  bool active, gate, killing, hasPend; int model, key, chan; long long age; int pModel, pChan, pKey; double pVel, pTune, kg, f, vel, pitch, tgt, dev, scoop, volS, volT, t; long long cnt;
  double vibPh, vibFade, wander, wanderT; long long wCnt; double slPh1, slPh2, slR1, slR2, slRw, slRwT; long long slCnt; int K; double rubPh, rubRate, pan;
  Voice() { reset(); }
  void reset() {
    active = gate = killing = hasPend = false; model = 0; key = 60; chan = 0; age = 0; pModel = 0; pChan = 0; pKey = 60; pVel = 0; pTune = 0; kg = 1;
    f = 261; vel = 0.8; pitch = 60; tgt = 60; dev = 0; scoop = 0; volS = 0; volT = 0.8; t = 0;
    double s = env.sr; env = Adsr(); env.setSr(s); cnt = 0;
    std::fill(ph, ph + 16, 0.0); std::fill(amp, amp + 16, 0.0); std::fill(beat, beat + 8, 0.0); std::fill(sk, sk + 8, 0.0); std::fill(skD, skD + 8, 0.0); std::fill(shPh, shPh + 8, 0.0); std::fill(shRate, shRate + 8, 0.0); std::fill(ratioJit, ratioJit + 8, 0.0);
    vibPh = vibFade = wander = wanderT = 0; wCnt = 0; slPh1 = slPh2 = 0; slR1 = 0.5; slR2 = 1.5; slRw = slRwT = 0; slCnt = 0; K = 1; rubPh = 0; rubRate = 0.5; pan = 0.5; noise.s = 0x9E3779B9u; nsv.reset(); nsv.k = 1;
  }
};
struct Sm { double v = 0, c = 0; double next(double t) { v = t + (v - t) * c; return v; } };
struct Bloom {
  double sr; std::vector<DelayLine> dl; long long cl[2][4]; long long al[2][2]; std::vector<DelayLine> cd[2]; std::vector<DelayLine> ad[2]; double cz[2][4], cfb[2][4]; double ph1 = 0, ph2 = 0, wetMag = 0, rt = -1, lpz[2], oL = 0, oR = 0, w[2];
  explicit Bloom(double s) : sr(s) {
    double k = s / 44100.0; static const double cb[2][4] = {{1116, 1188, 1277, 1356}, {1139, 1211, 1300, 1379}}, ab[2][2] = {{556, 441}, {579, 464}};
    dl.emplace_back((long long)std::floor(s * 0.06) + 16); dl.emplace_back((long long)std::floor(s * 0.06) + 16);
    for (int c = 0; c < 2; ++c) { for (int j = 0; j < 4; ++j) { cl[c][j] = std::max(8LL, (long long)std::llround(cb[c][j] * k * 1.6)); cd[c].emplace_back(cl[c][j] + 16); cz[c][j] = 0; cfb[c][j] = 0; }
      for (int j = 0; j < 2; ++j) { al[c][j] = std::max(8LL, (long long)std::llround(ab[c][j] * k)); ad[c].emplace_back(al[c][j] + 32); } lpz[c] = 0; w[c] = 0; }
    clear();
  }
  void clear() { for (int c = 0; c < 2; ++c) { dl[c].clear(); for (int j = 0; j < 4; ++j) { cd[c][j].clear(); cz[c][j] = 0; } for (int j = 0; j < 2; ++j) ad[c][j].clear(); lpz[c] = 0; } wetMag = 0; ph1 = ph2 = 0; }
  void setRt(double rt60) { if (std::fabs(rt60 - rt) < 1e-3) return; rt = rt60; for (int c = 0; c < 2; ++c) for (int j = 0; j < 4; ++j) cfb[c][j] = std::min(0.97, std::pow(10.0, -3 * cl[c][j] / (rt60 * sr))); }
  void run(double inL, double inR, double haunt, double rt60) {
    if (haunt < 1e-4) { dl[0].push(inL); dl[1].push(inR); oL = inL; oR = inR; wetMag *= 0.999; return; }
    setRt(rt60);
    ph1 += 0.31 / sr; if (ph1 >= 1) ph1 -= 1; ph2 += 0.23 / sr; if (ph2 >= 1) ph2 -= 1;
    dl[0].push(inL); dl[1].push(inR);
    double s1 = sinCyc(ph1), s2 = sinCyc(ph2 + 0.3), ms = sr * 0.001;
    double a0 = dl[0].read(ms * (21 + 4.5 * s1)), b0 = dl[0].read(ms * (33 + 4 * s2)), a1 = dl[1].read(ms * (23 - 4.5 * s1)), b1 = dl[1].read(ms * (31 - 4 * s2));
    double cL = inL * (1 - 0.3 * haunt) + 0.5 * haunt * (a0 + b0), cR = inR * (1 - 0.3 * haunt) + 0.5 * haunt * (a1 + b1);
    double inp = 0.5 * (cL + cR) * 0.35;
    for (int c = 0; c < 2; ++c) {
      double sum = 0;
      for (int j = 0; j < 4; ++j) { double y = cd[c][j].tap(cl[c][j] - 1); double z = y * 0.55 + cz[c][j] * 0.45; cz[c][j] = z; cd[c][j].push(inp + z * cfb[c][j]); sum += y; }
      auto& a = ad[c];
      double lenF = al[c][0] + 3 * s1 * (c ? -1 : 1); double vv = a[0].read(lenF); double ww = sum * 0.25 + 0.5 * vv; a[0].push(ww); double y = vv - 0.5 * ww;
      lenF = al[c][1] + 3 * s2; vv = a[1].read(lenF); ww = y + 0.5 * vv; a[1].push(ww); y = vv - 0.5 * ww;
      lpz[c] += (y - lpz[c]) * 0.5; w[c] = lpz[c];
    }
    double wetG = 0.9 * haunt;
    oL = cL + w[0] * wetG; oR = cR + w[1] * wetG; wetMag += (std::fabs(w[0] * wetG) - wetMag) * 0.002;
  }
};
struct Engine : EngineBase {
  std::vector<Spec> specs; Voice vs[kSlots]; std::vector<std::tuple<int, int, double, double>> stack;   // chan, note, vel, tune
  long long ageCtr = 0; double lastPitch = -1, bendIn = 0, mod = 0, press = 0, exprIn = 1; long long idle = 0; bool cleared = true; Bloom fx;
  Sm tone, breath, motion, haunt, level, vib, bend, pressS, expr; struct G { double tone = 0, breath = 0, motion = 0, haunt = 0, vibD = 0, bend = 0, press = 0, expr = 1; } g; double mixL = 0, mixR = 0;
  double gc = 0, volC = 0, scoopC = 0, killStep = 0, wanderC = 0;
  explicit Engine(double sr) : EngineBase(sr), specs(makeSpecs()), fx(sr) {
    initParams(specs); for (auto& vo : vs) vo.env.setSr(sr);
    double c = std::exp(-1 / (0.02 * sr)); for (Sm* s : {&tone, &breath, &motion, &haunt, &level, &vib, &bend, &pressS, &expr}) s->c = c;
    tone.v = v[Tone]; breath.v = v[Breath]; motion.v = v[Motion]; haunt.v = v[Haunt]; level.v = lvlGain(); expr.v = 1; derive();
  }
  double lvlGain() const { return std::pow(10.0, v[Level] / 20); }
  double bloomRt60() const { return 1.5 + 3.5 * v[Haunt]; }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; const Spec& sp = specs[(size_t)id]; if (x != x) x = sp.def;
    x = clampd(x, sp.min, sp.max); if (!sp.labels.empty()) x = std::floor(x + 0.5);
    v[id] = x; if (id == Preset) loadPreset((int)x); derive();
  }
  void put(int id, double x) { v[id] = x; writeParam(id, x); }
  void loadPreset(int i) { const Row& p = ROWS[(int)clampd(i, 0, 11)]; for (int k = 1; k < 13; ++k) put(k, p.m[k - 1]); }
  void derive() {
    double g_ = std::max(0.003, v[Glide]); gc = std::exp(-1 / (g_ * sr)); volC = 1 - std::exp(-1 / (0.015 * sr)); scoopC = std::exp(-1 / (0.09 * sr)); killStep = 1 / (0.004 * sr); wanderC = 1 - std::exp(-2 * kPi * 1.2 / sr);
    for (auto& vo : vs) { vo.env.setSr(sr); vo.env.set(v[Attack], 0.01, 1, v[Release]); }
  }
  void pitchBend(double b) override { bendIn = clampd(b, -1, 1); } void modWheel(double m) override { mod = clampd(m, 0, 1); } void pressure(double p) override { press = clampd(p, 0, 1); }
  void allNotesOff() override { stack.clear(); for (auto& vo : vs) if (vo.active) { vo.gate = false; vo.env.gateOff(); } }
  bool removeFromStack(int ch, int note) { for (size_t i = 0; i < stack.size(); ++i) if (std::get<0>(stack[i]) == ch && std::get<1>(stack[i]) == note) { stack.erase(stack.begin() + (long long)i); return true; } return false; }
  void retarget(Voice& vo, double t) { vo.dev += vo.tgt - t; vo.tgt = t; }
  void noteOn(int note, double vel) override {
    vel = clampd(vel, 0, 1); double tune = noteTune * 0.01; noteTune = 0; int ch = 0, model = (int)std::floor(v[Model] + 0.5);
    if (model <= 1) {
      removeFromStack(ch, note); Voice& vo = vs[kMono]; bool legato = !stack.empty() && vo.active && vo.gate;
      if ((int)stack.size() >= kStack) stack.erase(stack.begin()); stack.emplace_back(ch, note, vel, tune);
      if (legato && vo.model == model) { retarget(vo, note + tune); vo.key = note; vo.chan = ch; vo.volT = velVol(vel); }
      else startVoice(vo, model, ch, note, vel, tune);
    } else {
      int pick = -1; for (int i = 0; i < kPoly; ++i) if (!vs[i].active) { pick = i; break; }
      if (pick < 0) { double best = 1e9; for (int i = 0; i < kPoly; ++i) if (!vs[i].gate && !vs[i].killing && vs[i].env.v < best) { best = vs[i].env.v; pick = i; } }
      if (pick < 0) { long long oldest = 1LL << 60; for (int i = 0; i < kPoly; ++i) if (!vs[i].killing && vs[i].age < oldest) { oldest = vs[i].age; pick = i; } }
      if (pick < 0) pick = 0;
      Voice& vo = vs[pick];
      if (vo.active) { vo.killing = true; vo.hasPend = true; vo.pModel = model; vo.pChan = ch; vo.pKey = note; vo.pVel = vel; vo.pTune = tune; }
      else startVoice(vo, model, ch, note, vel, tune);
    }
  }
  void noteOff(int note) override {
    int ch = 0;
    if (!stack.empty() || vs[kMono].active) {
      bool wasTop = !stack.empty() && std::get<0>(stack.back()) == ch && std::get<1>(stack.back()) == note; bool had = removeFromStack(ch, note); Voice& vo = vs[kMono];
      if (had && vo.active && vo.gate) {
        if (stack.empty()) { vo.gate = false; vo.env.gateOff(); }
        else if (wasTop) { auto h = stack.back(); retarget(vo, std::get<1>(h) + std::get<3>(h)); vo.key = std::get<1>(h); vo.chan = std::get<0>(h); vo.volT = velVol(std::get<2>(h)); }
      }
    }
    for (int i = 0; i < kPoly; ++i) {
      Voice& vo = vs[i]; if (vo.active && vo.gate && !vo.killing && vo.chan == ch && vo.key == note) { vo.gate = false; vo.env.gateOff(); }
      if (vo.killing && vo.hasPend && vo.pChan == ch && vo.pKey == note) vo.hasPend = false;
    }
  }
  void startVoice(Voice& vo, int model, int ch, int key, double vel, double tune) {
    bool mono = model <= 1; double lastP = lastPitch; long long age = ++ageCtr; bool wasActive = vo.active && vo.model == model && mono;
    if (!wasActive) vo.reset();
    vo.active = true; vo.gate = true; vo.killing = false; vo.hasPend = false; vo.kg = 1; vo.model = model; vo.key = key; vo.chan = ch; vo.age = age; vo.vel = vel; vo.volT = velVol(vel);
    vo.tgt = key + tune; vo.t = 0; vo.cnt = 0;
    { uint32_t s = 0x9E3779B9u ^ ((uint32_t)age * 2654435761u); vo.noise.s = s ? s : 1u; }
    if (!wasActive) {
      vo.volS = 0; vo.vibPh = 0; vo.vibFade = 0; std::fill(vo.ph, vo.ph + 16, 0.0);
      for (int k = 0; k < 8; ++k) { vo.ratioJit[k] = 0.7 + 0.6 * rnd01(vo.noise); vo.shRate[k] = 0.15 + 1.3 * rnd01(vo.noise); vo.shPh[k] = rnd01(vo.noise); }
      vo.rubRate = 0.25 + 0.7 * rnd01(vo.noise); vo.rubPh = rnd01(vo.noise); vo.slR1 = 0.3 + 0.5 * rnd01(vo.noise); vo.slR2 = 1.0 + 1.3 * rnd01(vo.noise);
      vo.slPh1 = rnd01(vo.noise); vo.slPh2 = rnd01(vo.noise);
      vo.pan = mono ? 0.5 : clampd(0.5 + 0.35 * ((key - 60) / 30.0) + 0.2 * vo.noise.white(), 0.1, 0.9);
      vo.nsv.reset(); vo.pitch = (lastP >= 0 && v[Glide] > 0.01 && mono) ? lastP : vo.tgt;
      if (!mono && lastP >= 0 && v[Glide] > 0.05) vo.pitch = lastP;
    }
    vo.env.setSr(sr); vo.env.set(v[Attack], 0.01, 1, v[Release]); vo.env.gateOn(!wasActive);
    if (model == 1) vo.scoop = -(0.25 + 0.75 * v[Motion]) * (vo.pitch == vo.tgt ? 1 : 0.4); else vo.scoop = 0;
    if (model == 3) { double strike = std::max(0.0, vel - 0.4) * 1.6, tau = 0.8 + 0.25 * v[Release]; for (int k = 0; k < 8; ++k) { vo.sk[k] = strike * waterWeight(k, v[Tone]); vo.skD[k] = std::exp(-(1 + 0.6 * k) / (tau * sr)); } }
    vo.dev = vo.pitch - vo.tgt; lastPitch = vo.tgt;
  }
  void process(float* outL, float* outR, int n) override {
    if (n <= 0) return; double tailN = ((v[Haunt] > 0.001 ? bloomRt60() * 1.4 : 0) + 0.4) * sr;
    for (int i = 0; i < n; ++i) {
      bool any = false; for (int q = 0; q < kSlots; ++q) if (vs[q].active) { any = true; break; }
      if (!any && double(idle) > tailN) {
        if (!cleared) { fx.clear(); cleared = true; }
        tone.v = v[Tone]; breath.v = v[Breath]; motion.v = v[Motion]; haunt.v = v[Haunt]; level.v = lvlGain(); outL[i] = outR[i] = 0; continue;
      }
      g.tone = tone.next(v[Tone]); g.breath = breath.next(v[Breath]); g.motion = motion.next(v[Motion]); g.haunt = haunt.next(v[Haunt]);
      g.vibD = vib.next(std::min(1.0, v[VibDepth] + mod)); g.bend = bend.next(bendIn * v[Bend]); g.press = pressS.next(press); g.expr = expr.next(exprIn);
      double lvl = level.next(lvlGain()); mixL = 0; mixR = 0;
      if (any) for (int q = 0; q < kSlots; ++q) if (vs[q].active) renderVoice(vs[q], q == kMono);
      if (any) { idle = 0; cleared = false; } else ++idle;
      double mL = mixL, mR = mixR; if (!(std::fabs(mL) < 100)) mL = 0; if (!(std::fabs(mR) < 100)) mR = 0;
      fx.run(mL, mR, g.haunt, bloomRt60());
      double yl = fx.oL * lvl, yr = fx.oR * lvl; if (!(std::fabs(yl) < 100)) yl = 0; if (!(std::fabs(yr) < 100)) yr = 0;
      outL[i] = (float)fastTanh(yl); outR[i] = (float)fastTanh(yr);
    }
  }
  void renderVoice(Voice& vo, bool) {
    double isr = 1 / sr, lim45 = 0.45 * sr, kgain = 1;
    if (vo.killing) {
      vo.kg -= killStep;
      if (vo.kg <= 0) { if (vo.hasPend) startVoice(vo, vo.pModel, vo.pChan, vo.pKey, vo.pVel, vo.pTune); else vo.reset(); return; }
      kgain = vo.kg;
    }
    vo.t += isr; vo.dev *= gc; if (std::fabs(vo.dev) < 1e-6) vo.dev = 0; vo.pitch = vo.tgt + vo.dev; vo.scoop *= scoopC;
    vo.vibPh += v[VibRate] * isr; if (vo.vibPh >= 1) vo.vibPh -= 1;
    double lfo = sinCyc(vo.vibPh);
    if (vo.gate && vo.t > 0.12) vo.vibFade = std::min(1.0, vo.vibFade + isr / 0.45);
    int model = vo.model; double vibS = lfo * g.vibD * vo.vibFade * VIB[model] * 0.01;
    if (--vo.wCnt <= 0) { vo.wCnt = (long long)std::floor((0.4 + 0.8 * rnd01(vo.noise)) * sr); vo.wanderT = vo.noise.white(); }
    vo.wander += (vo.wanderT - vo.wander) * wanderC;
    double wanderCents = model <= 1 ? 14 * g.motion + 6 * g.haunt : 3 * g.motion + 4 * g.haunt;
    double semis = vo.pitch + g.bend + vo.scoop + vibS + vo.wander * wanderCents * 0.01, slosh = 0;
    if (model == 3) {
      vo.slPh1 += vo.slR1 * isr; vo.slPh2 += vo.slR2 * isr; if (vo.slPh1 >= 1) vo.slPh1 -= 1; if (vo.slPh2 >= 1) vo.slPh2 -= 1;
      if (--vo.slCnt <= 0) { vo.slCnt = (long long)std::floor((0.5 + 1.5 * rnd01(vo.noise)) * sr); vo.slRwT = vo.noise.white(); }
      vo.slRw += (vo.slRwT - vo.slRw) * (wanderC * 1.5);
      slosh = g.motion * (34 * sinCyc(vo.slPh1) + 14 * sinCyc(vo.slPh2) + 26 * vo.slRw);
    }
    if ((vo.cnt & 3) == 0) vo.f = clampd(440 * std::pow(2.0, (semis - 69) / 12), 8, lim45);
    double f = vo.f;
    if ((vo.cnt++ & 15) == 0) control(vo, f);
    double s = 0;
    switch (model) {
      case 0: {
        vo.ph[0] += f * isr; if (vo.ph[0] >= 1) vo.ph[0] -= 1;
        double h2 = f * 2 < lim45 ? 0.12 + 0.35 * g.tone : 0, h3 = f * 3 < lim45 ? 0.05 + 0.30 * g.tone : 0;
        s = (sinCyc(vo.ph[0]) + h2 * sinCyc(2 * vo.ph[0] + 0.1) + h3 * sinCyc(3 * vo.ph[0] + 0.3)) * 0.7;
        vo.nsv.run(vo.noise.white()); s += vo.nsv.band * g.breath * 0.12; s *= 1 + 0.08 * g.motion * lfo; break; }
      case 1: {
        vo.ph[0] += f * isr; if (vo.ph[0] >= 1) vo.ph[0] -= 1;
        for (int k = 0; k < vo.K; ++k) s += vo.amp[k] * sinCyc((k + 1) * vo.ph[0] + 0.07 * k);
        vo.nsv.run(vo.noise.white()); s += vo.nsv.band * g.breath * 0.10; s *= 1 + 0.30 * g.motion * sinCyc(vo.vibPh + 0.18); break; }
      case 2: {
        double wB = 0.12 + 0.33 * g.motion;
        for (int k = 0; k < 4; ++k) {
          double a = vo.amp[k]; if (a <= 0) continue;
          double fk = f * GR[k], d = 0.5 * vo.beat[k];
          vo.ph[2 * k] += (fk + d) * isr; vo.ph[2 * k + 1] += (fk - d) * isr;
          if (vo.ph[2 * k] >= 1) vo.ph[2 * k] -= 1; if (vo.ph[2 * k + 1] >= 1) vo.ph[2 * k + 1] -= 1;
          s += a * ((1 - wB) * sinCyc(vo.ph[2 * k]) + wB * sinCyc(vo.ph[2 * k + 1]));
        }
        vo.rubPh += vo.rubRate * isr; if (vo.rubPh >= 1) vo.rubPh -= 1;
        s *= 1 + 0.18 * g.motion * sinCyc(vo.rubPh); vo.nsv.run(vo.noise.white()); s += vo.nsv.band * g.breath * 0.06; break; }
      default: {
        double wB = 0.3 + 0.15 * g.motion, sl = slosh * 0.000577623;
        for (int k = 0; k < 8; ++k) {
          vo.sk[k] *= vo.skD[k]; double a = vo.amp[k] + vo.sk[k]; if (a <= 1e-6) continue;
          double fk = f * WR[k] * (1 + sl * (1 + 0.12 * k)); if (fk > lim45) continue;
          vo.ph[2 * k] += fk * (1 - 0.5 * vo.beat[k]) * isr; vo.ph[2 * k + 1] += fk * (1 + 0.5 * vo.beat[k]) * isr;
          if (vo.ph[2 * k] >= 1) vo.ph[2 * k] -= 1; if (vo.ph[2 * k + 1] >= 1) vo.ph[2 * k + 1] -= 1;
          s += a * ((1 - wB) * sinCyc(vo.ph[2 * k]) + wB * sinCyc(vo.ph[2 * k + 1]));
        }
        vo.nsv.run(vo.noise.white()); s += vo.nsv.band * g.breath * 0.05 * vo.env.v; break; }
    }
    vo.volS += (vo.volT - vo.volS) * volC;
    double vol = (vo.volS + (1 - vo.volS) * g.press) * g.expr, e = vo.env.next(), amp = (model == 3 ? 1 : e) * vol, out = s * amp * kgain * MGAIN[model];
    double pl = std::sqrt(1 - vo.pan), pr = std::sqrt(vo.pan);
    mixL += out * pl * 1.414; mixR += out * pr * 1.414;
    if (!(out == out)) { vo.reset(); return; }
    bool ringing = model == 3 && vo.sk[0] > 3e-4;
    if (!vo.env.active() && !ringing) { vo.active = false; vo.gate = false; }
  }
  void control(Voice& vo, double f) {
    double lim = 0.42 * sr;
    switch (vo.model) {
      case 0: vo.nsv.set(clampd(2800, 300, 0.4 * sr), 0.9, sr); break;
      case 1: {
        int K = 0; while (K < 12 && f * (K + 1) < lim) ++K; vo.K = K; double wobB = sinCyc(vo.vibPh + 0.45);
        for (int k = 0; k < K; ++k) vo.amp[k] = sawWeight(k + 1, g.tone, g.motion, wobB) * 0.8;
        vo.nsv.set(clampd(f * 3, 400, 0.4 * sr), 1.2, sr); break; }
      case 2:
        for (int k = 0; k < 4; ++k) { vo.amp[k] = f * GR[k] < lim ? glassWeight(k, g.tone) * 0.9 : 0; vo.beat[k] = (0.35 + 1.6 * g.motion) * (1 + 0.7 * k) * vo.ratioJit[k]; }
        vo.nsv.set(clampd(f * 5, 800, 0.4 * sr), 3.5, sr); break;
      default:
        for (int k = 0; k < 8; ++k) {
          vo.shPh[k] += 16 * vo.shRate[k] / sr; if (vo.shPh[k] >= 1) vo.shPh[k] -= 1;
          double w = waterWeight(k, g.tone);
          vo.amp[k] = f * WR[k] < lim ? w * vo.env.v * (0.6 + 0.4 * sinCyc(vo.shPh[k])) * 0.9 : 0;
          vo.beat[k] = (0.0012 + 0.0045 * g.motion) * (k + 1) * vo.ratioJit[k];
        }
        vo.nsv.set(clampd(f * 4, 600, 0.4 * sr), 2.5, sr);
    }
  }
};
inline Info info() {
  return Info{"wraithica", "Wraithica", "Theremin, musical saw, glass harmonica and waterphone with a built-in haunting reverb bloom.", makeSpecs(), makeGroups(),
              Theme{"wraithica", 0xff1a1430, 0xff07050f, 0xffb48cff, 0xffeee8ff, 0xffd9c4ff}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::wraithica
