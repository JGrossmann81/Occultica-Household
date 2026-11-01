// Avoidica: patchable modular-ensemble synth. 41 modules, a text patch format, 16 macro knobs and 12 factory patches (the presets).
// A patch has a voice half (evaluated per note) and a master half (evaluated once on the summed voices).
#pragma once
#include "../common/engine.h"
#include <map>
#include <mutex>
#include <cstdlib>
#include <cstring>
namespace occ { namespace avoidica {
enum { Preset, Volume, Voices, Glide, BendRange, Knob1, Tempo = Knob1 + 16, Count };
constexpr int kMaxIn = 4, kMaxOut = 8, kMaxP = 12, kVoiceMax = 16, kKnobs = 16;
enum { N_Note, N_Voices, N_Osc, N_FmOp, N_Noise, N_WaveT, N_Pluck, N_Grain, N_Svf, N_Ladder, N_Formant, N_Comb, N_Allpass, N_Shaper, N_Rectify, N_Mult, N_Atten, N_Mix4, N_Xfade, N_Pan, N_Math, N_Compare, N_Logic, N_SampleHold, N_Slew, N_Quant, N_Const, N_ADSR, N_AR, N_LFO, N_Clock, N_ClockDiv, N_Seq, N_Random, N_EnvFollow, N_Delay, N_Reverb, N_Chorus, N_Phaser, N_VoiceOut, N_Master };

struct PDef { const char* name; double def, lo, hi; };
inline PDef PD(const char* n, double d, double lo, double hi) { return PDef{n, d, lo, hi}; }
struct ModDef { const char* name; int section; std::vector<std::string> ins; std::vector<double> indef; std::vector<std::string> outs; std::vector<PDef> ps; };
static const std::vector<ModDef> D = {
{"Note", 0, {}, {}, {"pitch", "gate", "vel", "key", "mod", "press", "raw"}, {}},
{"Voices", 1, {}, {}, {"l", "r"}, {}},
{"Osc", 2, {"pitch", "fm", "pw", "sync"}, {60, 0, 0, 0}, {"out"}, {PD("wave", 0, 0, 3), PD("coarse", 0, -48, 48), PD("fine", 0, -1, 1), PD("pw", 0.5, 0.02, 0.98), PD("level", 1, 0, 2)}},
{"FmOp", 2, {"pitch", "mod", "idx"}, {60, 0, 1}, {"out"}, {PD("ratio", 1, 0.125, 16), PD("index", 0, 0, 12), PD("fb", 0, 0, 1), PD("level", 1, 0, 2)}},
{"Noise", 2, {}, {}, {"out"}, {PD("type", 0, 0, 3), PD("level", 1, 0, 2)}},
{"WaveT", 2, {"pitch", "pos"}, {60, 0}, {"out"}, {PD("table", 0, 0, 11), PD("pos", 0.3, 0, 1), PD("level", 1, 0, 2)}},
{"Pluck", 2, {"excite", "pitch"}, {0, 60}, {"out"}, {PD("decay", 2, 0.1, 20), PD("damp", 0.5, 0, 1), PD("level", 1, 0, 2)}},
{"Grain", 2, {"in", "pos", "shift"}, {0, 0, 0}, {"out"}, {PD("size", 80, 10, 500), PD("density", 20, 1, 80), PD("spread", 0.3, 0, 1), PD("pitch", 0, -24, 24), PD("freeze", 0, 0, 1), PD("level", 1, 0, 2)}},
{"Svf", 2, {"in", "cut", "res"}, {0, 0, 0}, {"lp", "bp", "hp", "notch"}, {PD("cut", 1000, 20, 20000), PD("res", 0.2, 0, 1)}},
{"Ladder", 2, {"in", "cut", "res"}, {0, 0, 0}, {"out"}, {PD("cut", 1500, 20, 20000), PD("res", 0.2, 0, 1), PD("drive", 1, 0.2, 8)}},
{"Formant", 2, {"in", "mod"}, {0, 0}, {"out"}, {PD("vowel", 0, 0, 4), PD("q", 8, 2, 24), PD("level", 1, 0, 3)}},
{"Comb", 2, {"in", "mod"}, {0, 0}, {"out"}, {PD("freq", 200, 20, 5000), PD("fb", 0.7, -0.99, 0.99), PD("damp", 0.3, 0, 1)}},
{"Allpass", 2, {"in", "mod"}, {0, 0}, {"out"}, {PD("freq", 800, 20, 12000)}},
{"Shaper", 2, {"in", "drive"}, {0, 0}, {"out"}, {PD("type", 0, 0, 4), PD("drive", 2, 0.1, 20), PD("level", 1, 0, 2)}},
{"Rectify", 2, {"in"}, {0}, {"out"}, {PD("mode", 0, 0, 2)}},
{"Mult", 2, {"a", "b"}, {1, 1}, {"out"}, {}},
{"Atten", 2, {"in", "amt"}, {0, 1}, {"out"}, {PD("scale", 1, -64, 64), PD("offset", 0, -64, 64)}},
{"Mix4", 2, {"a", "b", "c", "d"}, {0, 0, 0, 0}, {"out"}, {PD("la", 1, 0, 2), PD("lb", 1, 0, 2), PD("lc", 1, 0, 2), PD("ld", 1, 0, 2)}},
{"Xfade", 2, {"a", "b", "x"}, {0, 0, 0}, {"out"}, {PD("mix", 0.5, 0, 1)}},
{"Pan", 2, {"in", "pos"}, {0, 0}, {"l", "r"}, {PD("pan", 0, -1, 1)}},
{"Math", 2, {"a", "b"}, {0, 0}, {"out"}, {PD("op", 0, 0, 7), PD("k", 0, -100, 100)}},
{"Compare", 2, {"a", "b"}, {0, 0}, {"out"}, {PD("thr", 0.5, -1, 1)}},
{"Logic", 2, {"a", "b"}, {0, 0}, {"out"}, {PD("op", 0, 0, 3)}},
{"SampleHold", 2, {"in", "trig"}, {0, 0}, {"out"}, {}},
{"Slew", 2, {"in"}, {0}, {"out"}, {PD("up", 50, 0.1, 5000), PD("down", 50, 0.1, 5000)}},
{"Quant", 2, {"in"}, {0}, {"out"}, {PD("scale", 1, 0, 7), PD("root", 0, 0, 11)}},
{"Const", 2, {}, {}, {"out"}, {PD("value", 0, -100, 100)}},
{"ADSR", 2, {"gate"}, {0}, {"out"}, {PD("a", 0.01, 0.001, 10), PD("d", 0.2, 0.001, 10), PD("s", 0.7, 0, 1), PD("r", 0.3, 0.001, 10)}},
{"AR", 2, {"trig"}, {0}, {"out"}, {PD("a", 0.002, 0.0005, 5), PD("r", 0.3, 0.002, 10)}},
{"LFO", 2, {"rate", "reset"}, {0, 0}, {"out"}, {PD("shape", 0, 0, 5), PD("rate", 2, 0.01, 50), PD("phase", 0, 0, 1), PD("bipolar", 1, 0, 1), PD("level", 1, 0, 2)}},
{"Clock", 2, {"reset"}, {0}, {"out"}, {PD("bpm", 120, 20, 300), PD("div", 2, 0, 4), PD("sync", 0, 0, 1)}},
{"ClockDiv", 2, {"clk", "reset"}, {0, 0}, {"out"}, {PD("div", 2, 1, 16)}},
{"Seq", 2, {"clk", "reset"}, {0, 0}, {"out", "gate"}, {PD("s1", 0, -24, 24), PD("s2", 0, -24, 24), PD("s3", 0, -24, 24), PD("s4", 0, -24, 24), PD("s5", 0, -24, 24), PD("s6", 0, -24, 24), PD("s7", 0, -24, 24), PD("s8", 0, -24, 24), PD("len", 8, 1, 8), PD("gate", 0.6, 0.05, 1), PD("glide", 0, 0, 1)}},
{"Random", 2, {"trig"}, {0}, {"out"}, {PD("range", 1, 0, 24), PD("smooth", 0, 0, 500)}},
{"EnvFollow", 2, {"in"}, {0}, {"out"}, {PD("attack", 5, 0.1, 500), PD("release", 100, 1, 2000)}},
{"Delay", 2, {"in", "mod"}, {0, 0}, {"out"}, {PD("time", 350, 1, 2000), PD("fb", 0.4, 0, 0.95), PD("tone", 0.6, 0, 1), PD("mix", 0.3, 0, 1)}},
{"Reverb", 1, {"l", "r"}, {0, 0}, {"l", "r"}, {PD("size", 0.6, 0, 1), PD("damp", 0.5, 0, 1), PD("mix", 0.25, 0, 1)}},
{"Chorus", 2, {"in"}, {0}, {"out"}, {PD("rate", 0.4, 0.05, 8), PD("depth", 3, 0.1, 10), PD("mix", 0.5, 0, 1)}},
{"Phaser", 2, {"in"}, {0}, {"out"}, {PD("rate", 0.3, 0.02, 8), PD("depth", 0.8, 0, 1), PD("fb", 0.4, 0, 0.9), PD("mix", 0.5, 0, 1)}},
{"VoiceOut", 0, {"l", "r"}, {0, 0}, {}, {PD("level", 0.5, 0, 2), PD("pan", 0, -1, 1)}},
{"Master", 1, {"l", "r"}, {0, 0}, {}, {PD("level", 1, 0, 2)}}};

inline int typeByName(const std::string& n) { for (size_t i = 0; i < D.size(); ++i) if (n == D[i].name) return (int)i; return -1; }
inline int paramOf(const ModDef& d, const std::string& n) { for (size_t i = 0; i < d.ps.size(); ++i) if (n == d.ps[i].name) return (int)i; return -1; }
inline int indexOfStr(const std::vector<std::string>& v, const std::string& s) { for (size_t i = 0; i < v.size(); ++i) if (v[i] == s) return (int)i; return -1; }

// ---- patch parser (same text format as the plugin)
struct PNode { int type = 0; std::string id; double p[kMaxP] = {}; double inDef[kMaxIn] = {}; std::vector<int> src[kMaxIn]; int outBase = 0; };
struct PSec { std::vector<PNode> nodes; std::vector<int> order; int nOut = 0; };
struct PKnob { bool used = false; std::string label; int sec = 0, node = 0, param = 0; double lo = 0, hi = 1; bool exp = false; double pos = 0.5; };
struct Patch { std::string name; PSec sec[2]; PKnob knob[kKnobs]; };
struct ParseResult { bool ok = false; std::vector<std::string> errors; Patch patch; };

inline bool isWs(char c) { return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f' || c == '\v'; }
inline double parseFloatJS(const std::string& s) {  // JS parseFloat, NaN -> 0 (callers always use `|| 0`)
  size_t i = 0; while (i < s.size() && isWs(s[i])) ++i; size_t j = i; if (j < s.size() && (s[j] == '+' || s[j] == '-')) ++j;
  if (j >= s.size() || !((s[j] >= '0' && s[j] <= '9') || s[j] == '.')) return 0;
  if (s[j] == '0' && j + 1 < s.size() && (s[j + 1] == 'x' || s[j + 1] == 'X')) return 0;
  double r = std::strtod(s.c_str() + i, nullptr); return r == r ? r : 0;
}
inline std::vector<std::string> splitWs(const std::string& line) { std::vector<std::string> t; size_t i = 0; while (i < line.size()) { while (i < line.size() && isWs(line[i])) ++i; size_t j = i; while (j < line.size() && !isWs(line[j])) ++j; if (j > i) t.push_back(line.substr(i, j - i)); i = j; } return t; }
inline std::string trimStr(const std::string& s) { size_t a = 0, b = s.size(); while (a < b && isWs(s[a])) ++a; while (b > a && isWs(s[b - 1])) --b; return s.substr(a, b - a); }
inline bool splitDot(const std::string& s, std::string& a, std::string& b) { size_t d = s.find('.'); if (d == std::string::npos) return false; a = s.substr(0, d); b = s.substr(d + 1); return true; }

inline void goOrder(PSec& Sx, std::vector<char>& mark, int i) {
  if (mark[(size_t)i]) return; mark[(size_t)i] = 1;
  for (int k = 0; k < kMaxIn; ++k) for (int v : Sx.nodes[(size_t)i].src[k]) goOrder(Sx, mark, v / kMaxOut);
  Sx.order.push_back(i);
}
inline ParseResult parsePatch(const std::string& text) {
  ParseResult R; Patch& Pa = R.patch; int cur = 0; std::map<std::string, std::pair<int, int>> ids;
  struct W { int ln; std::string a, b; }; std::vector<W> wires, inLines; std::vector<std::pair<int, std::vector<std::string>>> knobLines;
  auto err = [&](int ln, const std::string& m) { R.errors.push_back("line " + std::to_string(ln) + ": " + m); };
  std::vector<std::string> lines; { size_t st = 0; for (;;) { size_t nl = text.find('\n', st); if (nl == std::string::npos) { lines.push_back(text.substr(st)); break; } lines.push_back(text.substr(st, nl - st)); st = nl + 1; } }
  for (size_t li = 0; li < lines.size(); ++li) {
    int ln = (int)li + 1; std::string line = lines[li]; size_t h = line.find('#'); if (h != std::string::npos) line = line.substr(0, h);
    std::vector<std::string> t = splitWs(line); if (t.empty()) continue;
    if (t[0] == "name") Pa.name = trimStr(line.substr(line.find("name") + 4));
    else if (t[0] == "voice") cur = 0; else if (t[0] == "master") cur = 1;
    else if (t[0] == "node") {
      if (t.size() < 3) { err(ln, "node needs an id and a type"); continue; }
      int ty = typeByName(t[2]); if (ty < 0) { err(ln, "unknown module " + t[2]); continue; }
      const ModDef& d = D[(size_t)ty]; if (d.section != 2 && d.section != cur) { err(ln, std::string(d.name) + " belongs to the other half"); continue; }
      if (ids.count(t[1])) { err(ln, "duplicate id " + t[1]); continue; }
      PNode n; n.type = ty; n.id = t[1];
      for (size_t i = 0; i < d.ps.size(); ++i) n.p[i] = d.ps[i].def; for (size_t i = 0; i < d.indef.size(); ++i) n.inDef[i] = d.indef[i];
      for (size_t k = 3; k < t.size(); ++k) {
        size_t eq = t[k].find('='); if (eq == std::string::npos) { err(ln, "expected name=value"); continue; }
        int pi = paramOf(d, t[k].substr(0, eq)); if (pi < 0) { err(ln, "no parameter " + t[k].substr(0, eq)); continue; }
        n.p[pi] = clampd(parseFloatJS(t[k].substr(eq + 1)), d.ps[(size_t)pi].lo, d.ps[(size_t)pi].hi);
      }
      ids[t[1]] = {cur, (int)Pa.sec[cur].nodes.size()}; Pa.sec[cur].nodes.push_back(n);
    }
    else if (t[0] == "wire") { if (t.size() != 3) err(ln, "wire needs a source and a destination"); else wires.push_back({ln, t[1], t[2]}); }
    else if (t[0] == "in") { if (t.size() != 3) err(ln, "in needs a target and a value"); else inLines.push_back({ln, t[1], t[2]}); }
    else if (t[0] == "knob") knobLines.push_back({ln, t});
    else err(ln, "unknown word " + t[0]);
  }
  for (const W& w : wires) {
    std::string a0, a1, b0, b1; if (!splitDot(w.a, a0, a1) || !splitDot(w.b, b0, b1)) { err(w.ln, "wire ends look like node.port"); continue; }
    auto ia = ids.find(a0), ib = ids.find(b0); if (ia == ids.end() || ib == ids.end()) { err(w.ln, "wire mentions an unknown node"); continue; }
    if (ia->second.first != ib->second.first) { err(w.ln, "wires cannot cross halves"); continue; }
    PNode& na = Pa.sec[ia->second.first].nodes[(size_t)ia->second.second]; PNode& nb = Pa.sec[ib->second.first].nodes[(size_t)ib->second.second];
    int o = indexOfStr(D[(size_t)na.type].outs, a1), i = indexOfStr(D[(size_t)nb.type].ins, b1);
    if (o < 0) { err(w.ln, "no output " + a1); continue; } if (i < 0) { err(w.ln, "no input " + b1); continue; }
    nb.src[i].push_back(-(ia->second.second * kMaxOut + o) - 1);
  }
  for (int s = 0; s < 2; ++s) {
    PSec& Sx = Pa.sec[s]; int base = 0; for (PNode& n : Sx.nodes) { n.outBase = base; base += kMaxOut; } Sx.nOut = base;
    for (PNode& n : Sx.nodes) for (int i = 0; i < kMaxIn; ++i) for (int& v : n.src[i]) { int k = -v - 1; v = Sx.nodes[(size_t)(k / kMaxOut)].outBase + k % kMaxOut; }
    std::vector<char> mark(Sx.nodes.size(), 0);
    for (size_t i = 0; i < Sx.nodes.size(); ++i) goOrder(Sx, mark, (int)i);
  }
  for (const W& l : inLines) {
    std::string a0, a1; if (!splitDot(l.a, a0, a1) || !ids.count(a0)) { err(l.ln, "in needs node.input"); continue; }
    auto id = ids[a0]; PNode& n = Pa.sec[id.first].nodes[(size_t)id.second]; int i = indexOfStr(D[(size_t)n.type].ins, a1); if (i < 0) { err(l.ln, "no input " + a1); continue; } n.inDef[i] = parseFloatJS(l.b);
  }
  for (auto& kl : knobLines) {
    const std::vector<std::string>& t = kl.second; int ln = kl.first; if (t.size() < 7) { err(ln, "knob needs: N Label node.param lo hi lin|exp"); continue; }
    char* endp = nullptr; long kk = std::strtol(t[1].c_str(), &endp, 10); if (endp == t[1].c_str()) kk = -1000; int k = (int)kk - 1; if (!(k >= 0 && k < 16)) { err(ln, "knob number is 1..16"); continue; }
    std::string a0, a1; if (!splitDot(t[3], a0, a1) || !ids.count(a0)) { err(ln, "knob target needs node.param"); continue; }
    auto id = ids[a0]; PNode& n = Pa.sec[id.first].nodes[(size_t)id.second]; int pi = paramOf(D[(size_t)n.type], a1); if (pi < 0) { err(ln, "no parameter " + a1); continue; }
    PKnob& km = Pa.knob[k]; km.used = true; km.label = t[2]; for (char& c : km.label) if (c == '_') c = ' '; km.sec = id.first; km.node = id.second; km.param = pi;
    km.lo = parseFloatJS(t[4]); km.hi = parseFloatJS(t[5]); km.exp = t[6] == "exp"; if (km.exp && (km.lo <= 0 || km.hi <= 0)) { km.exp = false; err(ln, "exp knobs need positive limits"); }
    double v = clampd(n.p[pi], std::min(km.lo, km.hi), std::max(km.lo, km.hi));
    km.pos = km.hi == km.lo ? 0 : clampd(km.exp ? std::log(v / km.lo) / std::log(km.hi / km.lo) : (v - km.lo) / (km.hi - km.lo), 0, 1);
  }
  bool hasOut = false, hasMaster = false; for (auto& n : Pa.sec[0].nodes) if (n.type == N_VoiceOut) hasOut = true; for (auto& n : Pa.sec[1].nodes) if (n.type == N_Master) hasMaster = true;
  if (!hasOut) R.errors.push_back("the voice half needs a VoiceOut"); if (!hasMaster) R.errors.push_back("the master half needs a Master");
  R.ok = R.errors.empty(); return R;
}
static const char* const PATCHES[12] = {
R"PATCH(name Init saw
voice
node n Note
node o Osc wave=0 level=0.7
node f Ladder cut=2400 res=0.15
node e ADSR a=0.005 d=0.3 s=0.7 r=0.25
node v Mult
node out VoiceOut
wire n.pitch o.pitch
wire o.out f.in
wire f.out v.a
wire e.out v.b
wire n.gate e.gate
wire v.out out.l
master
node vs Voices
node m Master
wire vs.l m.l
wire vs.r m.r
knob 1 Cutoff f.cut 40 12000 exp
knob 2 Resonance f.res 0 1 lin
knob 3 Attack e.a 0.001 3 exp
knob 4 Release e.r 0.02 4 exp
knob 5 Wave o.wave 0 3 lin
)PATCH",
R"PATCH(name Two-oscillator brass
voice
node n Note
node o1 Osc wave=0 level=0.6
node o2 Osc wave=0 fine=0.14 coarse=-12 level=0.6
node mx Mix4
node f Ladder cut=500 res=0.25 drive=1.4
node e1 ADSR a=0.06 d=0.4 s=0.8 r=0.3
node e2 ADSR a=0.12 d=0.5 s=0.35 r=0.4
node sw Atten scale=40
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire o1.out mx.a
wire o2.out mx.b
wire mx.out f.in
wire n.gate e1.gate
wire n.gate e2.gate
wire e2.out sw.in
wire sw.out f.cut
wire f.out v.a
wire e1.out v.b
wire v.out out.l
master
node vs Voices
node ch Chorus rate=0.35 depth=4 mix=0.4
node m Master
wire vs.l ch.in
wire ch.out m.l
wire ch.out m.r
knob 1 Cutoff f.cut 80 4000 exp
knob 2 Resonance f.res 0 0.9 lin
knob 3 Swell e2.a 0.01 2 exp
knob 4 Detune o2.fine 0 0.5 lin
knob 5 Chorus ch.mix 0 1 lin
)PATCH",
R"PATCH(name Glass bells
voice
node n Note
node md FmOp ratio=3.5 index=3 level=1
node c FmOp ratio=1 index=1 level=0.8
node im AR a=0.001 r=1.2
node ia Atten scale=1
node am ADSR a=0.001 d=3 s=0 r=1.5
node v Mult
node out VoiceOut
wire n.pitch md.pitch
wire n.pitch c.pitch
wire n.gate im.trig
wire im.out c.idx
wire md.out c.mod
wire n.gate am.gate
wire c.out v.a
wire am.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=420 fb=0.35 tone=0.5 mix=0.25
node rv Reverb size=0.8 damp=0.4 mix=0.3
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Brightness md.index 0 8 lin
knob 2 Shimmer im.r 0.1 5 exp
knob 3 Ratio md.ratio 0.5 8 lin
knob 4 Echo dl.mix 0 0.8 lin
knob 5 Space rv.mix 0 0.8 lin
)PATCH",
R"PATCH(name Pluck machine
voice
node n Note
node nz Noise type=0 level=0.8
node bur AR a=0.0005 r=0.012
node ex Mult
node p Pluck decay=3 damp=0.5 level=4
node f Svf cut=5000 res=0.1
node out VoiceOut
wire n.gate bur.trig
wire nz.out ex.a
wire bur.out ex.b
wire ex.out p.excite
wire n.pitch p.pitch
wire p.out f.in
wire f.lp out.l
master
node vs Voices
node dl Delay time=330 fb=0.4 tone=0.55 mix=0.28
node rv Reverb size=0.7 damp=0.5 mix=0.2
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Decay p.decay 0.3 12 exp
knob 2 Damping p.damp 0 1 lin
knob 3 Tone f.cut 500 12000 exp
knob 4 Echo dl.mix 0 0.8 lin
knob 5 Space rv.mix 0 0.8 lin
)PATCH",
R"PATCH(name Cloud nine
voice
node n Note
node o1 Osc wave=0 level=0.5
node o2 Osc wave=1 pw=0.4 fine=0.1 level=0.4
node mx Mix4
node gr Grain size=120 density=28 spread=0.4 pitch=0 level=1.2
node lf LFO shape=5 rate=0.4 bipolar=1 level=1
node e ADSR a=0.5 d=1 s=0.8 r=1.5
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire o1.out mx.a
wire o2.out mx.b
wire mx.out gr.in
wire lf.out gr.pos
wire gr.out v.a
wire n.gate e.gate
wire e.out v.b
wire v.out out.l
master
node vs Voices
node rv Reverb size=0.9 damp=0.35 mix=0.45
node m Master
wire vs.l rv.l
wire vs.r rv.r
wire rv.l m.l
wire rv.r m.r
knob 1 Grain_size gr.size 15 500 exp
knob 2 Density gr.density 1 80 exp
knob 3 Spread gr.spread 0 1 lin
knob 4 Shift gr.pitch -12 12 lin
knob 5 Freeze gr.freeze 0 1 lin
knob 6 Space rv.mix 0 0.9 lin
)PATCH",
R"PATCH(name Step machine
voice
node n Note
node ck Clock bpm=124 div=2
node sq Seq s1=0 s2=12 s3=7 s4=3 s5=0 s6=10 s7=7 s8=5 len=8 gate=0.5
node tr Math op=0 k=-60
node q Quant scale=3 root=0
node o Osc wave=0 level=0.7
node ar AR a=0.001 r=0.16
node sw Atten scale=36
node f Ladder cut=300 res=0.35 drive=1.5
node e Mult
node out VoiceOut
wire n.gate ck.reset
wire n.gate sq.reset
wire ck.out sq.clk
wire sq.out tr.a
wire n.raw tr.b
wire tr.out q.in
wire q.out o.pitch
wire ck.out ar.trig
wire ar.out sw.in
wire sw.out f.cut
wire o.out f.in
wire f.out e.a
wire n.gate e.b
wire e.out out.l
master
node vs Voices
node dl Delay time=360 fb=0.45 tone=0.5 mix=0.3
node m Master
wire vs.l dl.in
wire dl.out m.l
wire dl.out m.r
knob 1 Tempo ck.bpm 60 200 lin
knob 2 Cutoff f.cut 80 3000 exp
knob 3 Resonance f.res 0 0.95 lin
knob 4 Decay ar.r 0.03 0.6 exp
knob 5 Gate sq.gate 0.1 1 lin
knob 6 Echo dl.mix 0 0.8 lin
)PATCH",
R"PATCH(name Snare and hat
voice
node n Note
node nz Noise type=0 level=1
node hp Svf cut=6000 res=0.3
node ae AR a=0.0005 r=0.12
node ve Mult
node tn Osc wave=3 level=0.8
node pe AR a=0.0003 r=0.05
node ps Atten scale=24
node pm Math op=0
node te AR a=0.0005 r=0.1
node tv Mult
node mx Mix4 la=0.8 lb=0.7
node out VoiceOut
wire n.gate ae.trig
wire n.gate pe.trig
wire n.gate te.trig
wire nz.out hp.in
wire hp.hp ve.a
wire ae.out ve.b
wire pe.out ps.in
wire n.raw pm.a
wire ps.out pm.b
wire pm.out tn.pitch
wire tn.out tv.a
wire te.out tv.b
wire ve.out mx.a
wire tv.out mx.b
wire mx.out out.l
master
node vs Voices
node rv Reverb size=0.35 damp=0.6 mix=0.15
node m Master
wire vs.l rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Noise_tone hp.cut 800 14000 exp
knob 2 Noise_decay ae.r 0.02 0.6 exp
knob 3 Body_decay te.r 0.03 0.5 exp
knob 4 Punch ps.scale 0 48 lin
knob 5 Room rv.mix 0 0.6 lin
)PATCH",
R"PATCH(name Formant choir
voice
node n Note
node o1 Osc wave=0 level=0.5
node o2 Osc wave=0 fine=0.1 level=0.5
node vib LFO shape=0 rate=5.2 bipolar=1 level=1
node vd Atten scale=0.22
node mx Mix4
node fm Formant vowel=0 q=9 level=1.4
node lf LFO shape=5 rate=0.15 bipolar=0 level=1
node ls Atten scale=3
node e ADSR a=0.7 d=1 s=0.9 r=1.2
node v Mult
node out VoiceOut
wire n.pitch o1.pitch
wire n.pitch o2.pitch
wire vib.out vd.in
wire vd.out o1.fm
wire vd.out o2.fm
wire o1.out mx.a
wire o2.out mx.b
wire mx.out fm.in
wire lf.out ls.in
wire ls.out fm.mod
wire fm.out v.a
wire n.gate e.gate
wire e.out v.b
wire v.out out.l
master
node vs Voices
node rv Reverb size=0.85 damp=0.4 mix=0.35
node m Master
wire vs.l rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Vowel fm.vowel 0 4 lin
knob 2 Sharpness fm.q 3 20 lin
knob 3 Drift ls.scale 0 4 lin
knob 4 Vibrato vd.scale 0 1 lin
knob 5 Space rv.mix 0 0.9 lin
)PATCH",
R"PATCH(name Table sweeper
voice
node n Note
node w WaveT table=0 pos=0.1 level=0.8
node lf LFO shape=1 rate=0.25 bipolar=0 level=0.6
node pe ADSR a=0.4 d=1.2 s=0.5 r=0.5
node mx Mix4 la=1 lb=0.3
node f Ladder cut=3200 res=0.2
node ae ADSR a=0.02 d=0.4 s=0.8 r=0.5
node v Mult
node out VoiceOut
wire n.pitch w.pitch
wire lf.out mx.a
wire pe.out mx.b
wire mx.out w.pos
wire w.out f.in
wire n.gate pe.gate
wire n.gate ae.gate
wire f.out v.a
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node ph Phaser rate=0.2 depth=0.7 fb=0.3 mix=0.35
node m Master
wire vs.l ph.in
wire ph.out m.l
wire ph.out m.r
knob 1 Table w.table 0 11 lin
knob 2 Position w.pos 0 1 lin
knob 3 Sweep_rate lf.rate 0.03 4 exp
knob 4 Cutoff f.cut 200 12000 exp
knob 5 Phaser ph.mix 0 1 lin
)PATCH",
R"PATCH(name Sync lead
voice
node n Note
node ms Osc wave=1 level=0.1
node sl Osc wave=0 level=0.8
node e ADSR a=0.01 d=1.2 s=0.2 r=0.3
node sw Atten scale=19
node pt Math op=0
node sh Shaper type=0 drive=1.6
node ae ADSR a=0.005 d=0.4 s=0.85 r=0.25
node v Mult
node out VoiceOut
wire n.pitch ms.pitch
wire ms.out sl.sync
wire n.gate e.gate
wire e.out sw.in
wire n.pitch pt.a
wire sw.out pt.b
wire pt.out sl.pitch
wire sl.out sh.in
wire n.gate ae.gate
wire sh.out v.a
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=280 fb=0.3 tone=0.6 mix=0.22
node m Master
wire vs.l dl.in
wire dl.out m.l
wire dl.out m.r
knob 1 Sweep sw.scale 0 36 lin
knob 2 Sweep_time e.d 0.1 4 exp
knob 3 Drive sh.drive 0.5 8 exp
knob 4 Attack ae.a 0.002 1 exp
knob 5 Echo dl.mix 0 0.8 lin
)PATCH",
R"PATCH(name Ring robot
voice
node n Note
node c Osc wave=3 level=1
node mo Osc wave=0 coarse=7 fine=0.04 level=1
node rm Mult
node cb Comb freq=220 fb=0.6 damp=0.4
node mx Mix4 la=0.6 lb=0.5
node ae ADSR a=0.004 d=0.3 s=0.7 r=0.2
node v Mult
node out VoiceOut
wire n.pitch c.pitch
wire n.pitch mo.pitch
wire c.out rm.a
wire mo.out rm.b
wire rm.out mx.a
wire rm.out cb.in
wire cb.out mx.b
wire mx.out v.a
wire n.gate ae.gate
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node m Master
wire vs.l m.l
wire vs.r m.r
knob 1 Interval mo.coarse -12 24 lin
knob 2 Detune mo.fine 0 1 lin
knob 3 Comb_freq cb.freq 60 2000 exp
knob 4 Comb_feedback cb.fb 0 0.95 lin
knob 5 Body mx.lb 0 1 lin
)PATCH",
R"PATCH(name Feedback drone
voice
node n Note
node o Osc wave=0 level=0.7
node lf LFO shape=0 rate=0.07 bipolar=1 level=1
node ls Atten scale=18
node f Svf cut=900 res=0.55
node sh Shaper type=1 drive=1.4
node fb Atten scale=1.4
node ae ADSR a=2 d=2 s=0.9 r=3
node v Mult
node out VoiceOut
wire n.pitch o.pitch
wire o.out f.in
wire lf.out ls.in
wire ls.out f.cut
wire f.bp sh.in
wire sh.out fb.in
wire fb.out o.fm
wire f.lp v.a
wire n.gate ae.gate
wire ae.out v.b
wire v.out out.l
master
node vs Voices
node dl Delay time=640 fb=0.55 tone=0.4 mix=0.35
node rv Reverb size=0.95 damp=0.3 mix=0.4
node m Master
wire vs.l dl.in
wire dl.out rv.l
wire rv.l m.l
wire rv.r m.r
knob 1 Feedback fb.scale 0 6 lin
knob 2 Cutoff f.cut 100 6000 exp
knob 3 Resonance f.res 0 0.95 lin
knob 4 Drift ls.scale 0 36 lin
knob 5 Echo dl.mix 0 0.9 lin
knob 6 Space rv.mix 0 0.9 lin
)PATCH"};

static const char* const kPatchNames[12] = {"Init saw", "Two-oscillator brass", "Glass bells", "Pluck machine", "Cloud nine", "Step machine", "Snare and hat", "Formant choir", "Table sweeper", "Sync lead", "Ring robot", "Feedback drone"};

inline std::vector<Spec> makeSpecs() {
  ParseResult p0 = parsePatch(PATCHES[0]);
  std::vector<Spec> specs = {P("Preset", "", 0, 11, 0, "%.0f", false, std::vector<std::string>(kPatchNames, kPatchNames + 12)), P("Volume", "", 0, 1, 0.7), P("Voices", "", 1, 16, 8, "%.0f"), P("Glide", "", 0, 1, 0), P("Bend range", "st", 0, 24, 2, "%.0f st")};
  for (int i = 0; i < kKnobs; ++i) specs.push_back(P(("Knob " + std::to_string(i + 1)).c_str(), "", 0, 1, p0.patch.knob[i].used ? p0.patch.knob[i].pos : 0.5));
  specs.push_back(P("Tempo", "BPM", 40, 240, 120, "%.0f BPM"));
  return specs;
}
inline std::vector<Group> makeGroups() {
  Group a{"Macro knobs 1-8", {}}, b{"Macro knobs 9-16", {}}; for (int i = 0; i < 8; ++i) { a.ids.push_back(Knob1 + i); b.ids.push_back(Knob1 + 8 + i); }
  return {{"Main", {Volume, Voices, Glide, BendRange, Tempo}}, a, b};
}

// ---- shared building blocks
struct SinTab { double t[2050]; SinTab() { for (int i = 0; i < 2050; ++i) t[i] = std::sin(2 * kPi * i / 2048); } };
inline const double* gSin() { static const SinTab s; return s.t; }
inline double fsin(double cyc) {
  if (!(std::fabs(cyc) < 1e6)) return 0; cyc -= std::floor(cyc); const double* g = gSin(); double x = cyc * 2048; int i = (int)x; if (i > 2048) i = 2048; double f = x - i;
  return g[i] + (g[i + 1] - g[i]) * f;
}
inline double q1k(double v) { return v != v ? 0 : (v > 1000 ? 1000 : (v < -1000 ? -1000 : v)); }
inline double rnd(double x) { return std::floor(x + 0.5); }  // Math.round
inline int swi(double x) { double r = std::floor(x + 0.5); if (!(r > -1e9 && r < 1e9)) return -999; return (int)r; }
inline int idxc(double x, int lo, int hi) { double r = clampd(x, lo, hi); if (r != r) return lo; return (int)r; }
inline bool isFin(double x) { return std::isfinite(x); }
struct Rng {
  uint32_t s;
  explicit Rng(uint32_t x = 0) : s(x) {}
  double white() { uint32_t t = s; t ^= t << 13; t ^= t >> 17; t ^= t << 5; s = t; return double((int32_t)t) / 2147483648.0; }
  double uni() { return 0.5 + 0.5 * white(); }
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
  void clear() { for (int ch = 0; ch < 2; ++ch) { for (int k = 0; k < 8; ++k) { std::fill(cb[ch][k].begin(), cb[ch][k].end(), 0.f); ci[ch][k] = 0; cz[ch][k] = 0; } for (int k = 0; k < 4; ++k) { std::fill(ab[ch][k].begin(), ab[ch][k].end(), 0.f); ai[ch][k] = 0; } } }
  double tick(int ch, double inp, double fb, double damp) {
    double s = 0;
    for (int k = 0; k < 8; ++k) {
      std::vector<float>& b = cb[ch][k]; int i = ci[ch][k]; double y = b[(size_t)i], z = y * (1 - damp) + cz[ch][k] * damp; cz[ch][k] = z; b[(size_t)i] = (float)(inp + z * fb); ci[ch][k] = (i + 1 >= (int)b.size()) ? 0 : i + 1; s += y;
    }
    for (int k = 0; k < 4; ++k) {
      std::vector<float>& b = ab[ch][k]; int i = ai[ch][k]; double bo = b[(size_t)i], y = -s + bo; b[(size_t)i] = (float)(s + bo * 0.5); ai[ch][k] = (i + 1 >= (int)b.size()) ? 0 : i + 1; s = y;
    }
    return s;
  }
};

// ---- wavetable bank for the WaveT module (one table built on first use, shared by all instances)
constexpr int kTabN = 1024, kFrames = 16, kMips = 9, kMaxH = 256;
inline double whash(int a, int b) {
  uint32_t h = ((uint32_t)a * 2654435761u) ^ ((uint32_t)b * 40503u) ^ 0x9E3779B9u; h = h ^ (h >> 15); h = h * 2246822519u; h = h ^ (h >> 13); return double(h & 0xFFFF) / 65535;
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
    case 4: { double s = 1 + std::floor(p * 7); amp = (std::fmod(double(k - 1), s) == 0) ? 1 / std::pow(kk, 0.7) : 0; break; }
    case 5: { double s = 2 + std::floor(p * 6); amp = (1 / std::sqrt(kk)) * ((std::fmod(double(k), s) == 0) ? 0.15 : 1); ph = whash(k, 5); break; }
    case 7: { double lv = 2 + (1 - p) * 30, a = 1 / kk; amp = std::floor(a * lv + 0.5) / lv; break; }
    case 8: { if (!(k & 1)) { amp = 0; break; } double c = 3 + p * 20, d = (kk - c) / (3 + p * 4); amp = (1 / kk) * (0.4 + 1.6 * std::exp(-0.5 * d * d)); break; }
    case 9: amp = (1 / kk) * (0.5 + 0.5 * std::cos(2 * kPi * kk * p * 0.5)); break;
    case 10: { double lim = 1 + p * 120; amp = kk <= lim ? 1 : 0; break; }
    default: amp = 1 / kk; ph = p * whash(k, 11); break;
  }
  ramp = amp; rph = ph;
}
struct WTBank {
  std::vector<float> tabs[12]; std::once_flag fl[12]; float sinT[kTabN];
  WTBank() { for (int i = 0; i < kTabN; ++i) sinT[i] = (float)std::sin(2 * kPi * i / kTabN); }
  void build(int t) {
    std::vector<float>& T = tabs[t]; T.assign((size_t)kMips * kFrames * (kTabN + 1) + 1, 0.f);
    for (int f = 0; f < kFrames; ++f) {
      double p = double(f) / (kFrames - 1), scale = 1;
      for (int m = 0; m < kMips; ++m) {
        size_t off = (size_t)(m * kFrames + f) * (kTabN + 1); int H = kMaxH >> m;
        for (int k = 1; k <= H; ++k) {
          double a, ph; recipe(t, p, k, a, ph); if (a == 0) continue; int idx = ((int)(ph * kTabN)) & (kTabN - 1);
          for (int n = 0; n < kTabN; ++n) { T[off + (size_t)n] = (float)(double(T[off + (size_t)n]) + a * double(sinT[idx])); idx = (idx + k) & (kTabN - 1); }
        }
        if (m == 0) { double pk = 1e-6; for (int n = 0; n < kTabN; ++n) pk = std::max(pk, std::fabs(double(T[off + (size_t)n]))); scale = 0.9 / pk; }
        for (int n = 0; n < kTabN; ++n) T[off + (size_t)n] = (float)(double(T[off + (size_t)n]) * scale);
        T[off + kTabN] = T[off];
      }
    }
  }
};
inline WTBank& wtBank() { static WTBank b; return b; }
inline const float* wtTable(int t) { WTBank& b = wtBank(); std::call_once(b.fl[t], [&] { b.build(t); }); return b.tabs[t].data(); }
inline double wtRead(const float* T, double hz, double sr, double phase, double pos) {
  int m = 0; while (m < kMips - 1 && hz * (kMaxH >> m) > 0.5 * sr) ++m;
  double fp = (pos < 0 ? 0 : (pos > 1 ? 1 : pos)) * (kFrames - 1); int f0 = std::min((int)fp, kFrames - 2); double ff = fp - f0;
  double x = (phase - std::floor(phase)) * kTabN; int i = (int)x; double fr = x - i;
  size_t a = (size_t)((m * kFrames + f0) * (kTabN + 1) + i), b = (size_t)((m * kFrames + f0 + 1) * (kTabN + 1) + i);
  double va = double(T[a]) + (double(T[a + 1]) - double(T[a])) * fr, vb = double(T[b]) + (double(T[b + 1]) - double(T[b])) * fr; return va + (vb - va) * ff;
}

static const double FORM[5][3] = {{730, 1090, 2440}, {530, 1840, 2480}, {270, 2290, 3010}, {570, 840, 2410}, {300, 870, 2240}}, FORMG[3] = {1, 0.6, 0.3};
static const int QSC[8][13] = {{12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}, {7, 0, 2, 4, 5, 7, 9, 11}, {7, 0, 2, 3, 5, 7, 8, 10}, {5, 0, 2, 4, 7, 9}, {6, 0, 2, 4, 6, 8, 10}, {7, 0, 2, 3, 5, 7, 9, 10}, {7, 0, 1, 3, 5, 7, 8, 10}, {7, 0, 2, 3, 5, 7, 8, 11}};
static const double CLK_MUL[5] = {1, 2, 4, 8, 3};

struct NodeState {
  double s[16] = {}, g[40] = {}; std::unique_ptr<DelayLine> d1; std::unique_ptr<Rev> rev; Rng rng{2463534242u}; int type = 0;
};
inline void nanCache(NodeState& st) {
  double* s = st.s; const double nan = std::nan("");
  switch (st.type) { case N_Osc: case N_FmOp: case N_WaveT: case N_AR: s[8] = nan; break; case N_Ladder: s[8] = nan; s[9] = nan; break; case N_ADSR: s[8] = nan; s[10] = nan; break; case N_VoiceOut: s[0] = nan; break; }
}
inline NodeState mkState(int type, double sr) {
  NodeState st;
  switch (type) {
    case N_Pluck: case N_Comb: st.d1.reset(new DelayLine((long long)std::floor(sr / 20) + 16)); break;
    case N_Grain: st.d1.reset(new DelayLine((long long)std::floor(2 * sr))); break;
    case N_Delay: st.d1.reset(new DelayLine((long long)std::floor(2.1 * sr))); break;
    case N_Chorus: st.d1.reset(new DelayLine((long long)std::floor(0.06 * sr))); break;
    case N_Reverb: st.rev.reset(new Rev(sr)); break;
  }
  st.type = type; nanCache(st); return st;
}
inline void resetStates(std::vector<NodeState>& v) {
  for (auto& s : v) { std::fill(s.s, s.s + 16, 0.0); std::fill(s.g, s.g + 40, 0.0); if (s.d1) s.d1->clear(); if (s.rev) s.rev->clear(); nanCache(s); }
}

struct VoiceS {
  bool active = false, gate = false; int note = 60; long long age = 0, quiet = 0, life = 0; double vel = 0, pitch = 60, target = 60;
  std::vector<NodeState> st; std::vector<double> outs; double oL = 0, oR = 0;
};

struct Engine : EngineBase {
  std::vector<Spec> specs; Patch patch; std::vector<VoiceS> voice; std::vector<NodeState> ms; std::vector<double> mouts; double* cur = nullptr; double inb[kMaxIn] = {};
  double bend = 0, mod = 0, press = 0, lastPitch = 0, mastL = 0, mastR = 0; uint32_t seed = 1; bool kdirty = false; double gin[2] = {0, 0}; double tl = 0, tb = 0, th = 0; long long smoothCtr = 0;
  explicit Engine(double s) : EngineBase(s) { specs = makeSpecs(); initParams(specs); load(0, false); }
  void load(int i, bool notify) {
    i = (int)clampd(i, 0, 11); ParseResult r = parsePatch(PATCHES[i]); if (!r.ok) return; patch = r.patch; build();
    for (int k = 0; k < kKnobs; ++k) { const PKnob& km = patch.knob[k]; double x = km.used ? km.pos : 0.5; v[(size_t)(Knob1 + k)] = x; if (notify) writeParam(Knob1 + k, x); }
  }
  void build() {
    voice.clear(); voice.reserve(kVoiceMax);
    for (int i = 0; i < kVoiceMax; ++i) {
      VoiceS vv; for (auto& n : patch.sec[0].nodes) vv.st.push_back(mkState(n.type, sr)); vv.outs.assign((size_t)patch.sec[0].nOut, 0.0); voice.push_back(std::move(vv));
    }
    ms.clear(); for (size_t i = 0; i < patch.sec[1].nodes.size(); ++i) { NodeState s = mkState(patch.sec[1].nodes[i].type, sr); s.rng.s = (uint32_t)(2463534242u + (uint32_t)i * 7919u); ms.push_back(std::move(s)); }
    mouts.assign((size_t)patch.sec[1].nOut, 0.0);
    for (auto& vv : voice) for (size_t i = 0; i < vv.st.size(); ++i) vv.st[i].rng.s = (uint32_t)(2463534242u + (uint32_t)i * 7919u);
    for (auto& n : patch.sec[0].nodes) if (n.type == N_WaveT) wtTable(idxc(rnd(n.p[0]), 0, 11));
    for (int k = 0; k < kKnobs; ++k) { const PKnob& km = patch.knob[k]; if (km.used && km.sec == 0 && patch.sec[0].nodes[(size_t)km.node].type == N_WaveT && km.param == 0) for (int t = 0; t < 12; ++t) wtTable(t); }  // knob can reach any table: build up front, not on the audio thread
  }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return; v[(size_t)id] = x;
    if (id == Preset) { if (!(x == x)) x = 0; load((int)clampd(rnd(x), 0, 11), true); return; }
    if (id >= Knob1 && id < Knob1 + kKnobs) { PKnob& km = patch.knob[id - Knob1]; if (km.used) { km.pos = clampd(x, 0, 1); kdirty = true; } }
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mod = m; } void pressure(double p) override { press = p; }
  void allNotesOff() override { for (auto& vv : voice) vv.gate = false; }
  void noteOn(int note, double vel) override {
    double lim = clampd(rnd(v[Voices]), 1, kVoiceMax); int li = (int)lim; VoiceS* vp = nullptr;
    for (int i = 0; i < li && !vp; ++i) if (!voice[(size_t)i].active) vp = &voice[(size_t)i];
    if (!vp) { int o = 0; for (int i = 1; i < li; ++i) if (voice[(size_t)i].age > voice[(size_t)o].age) o = i; vp = &voice[(size_t)o]; }
    VoiceS& vv = *vp; double tuned = note + noteTune * 0.01; noteTune = 0; bool glide = v[Glide] > 0.001 && lastPitch > 0;
    resetStates(vv.st); std::fill(vv.outs.begin(), vv.outs.end(), 0.0); vv.active = true; vv.gate = true; vv.note = note; vv.vel = vel; vv.age = 0; vv.target = tuned; vv.pitch = glide ? lastPitch : tuned; vv.quiet = 0; vv.life = 0; lastPitch = tuned;
    ++seed; for (size_t i = 0; i < vv.st.size(); ++i) vv.st[i].rng.s = 2463534242u ^ (seed * 2654435761u) ^ (uint32_t)(i * 40503 + 1);
  }
  void noteOff(int note) override { for (auto& vv : voice) if (vv.active && vv.gate && vv.note == note) vv.gate = false; }
  void smoothKnobs() {
    for (int k = 0; k < kKnobs; ++k) {
      const PKnob& km = patch.knob[k]; if (!km.used) continue; PNode& n = patch.sec[km.sec].nodes[(size_t)km.node];
      double t = km.exp ? km.lo * std::pow(km.hi / km.lo, km.pos) : km.lo + (km.hi - km.lo) * km.pos, p = n.p[km.param];
      n.p[km.param] = std::fabs(p - t) < 1e-6 * (1 + std::fabs(t)) ? t : p + (t - p) * 0.25;
    }
  }
  void tpt(double fc, double q, double* s, int i1, int i2, double x) {
    double g = std::tan(kPi * clampd(fc, 10, sr * 0.45) / sr), k = 1 / q, a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, ic1 = s[i1], ic2 = s[i2];
    double v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; s[i1] = 2 * v1 - ic1; s[i2] = 2 * v2 - ic2; tl = v2; tb = v1; th = x - k * v1 - v2;
  }
  void evalNode(PNode& nd, NodeState& st, VoiceS* vc, const double* gin_) {
    double* cr = cur; int ob = nd.outBase; const double* P = nd.p; double* s = st.s; double* inn = inb; const double sr_ = sr; const double* V = v.data();
    for (int k = 0; k < kMaxIn; ++k) { const std::vector<int>& sl = nd.src[k]; if (sl.empty()) inn[k] = nd.inDef[k]; else { double a = 0; for (size_t j = 0; j < sl.size(); ++j) a += cr[sl[j]]; inn[k] = a; } }
    double i0 = inn[0], i1 = inn[1], i2 = inn[2], i3 = inn[3], hzmax = sr_ * 0.45;
    switch (nd.type) {
      case N_Note: if (vc) { cr[ob] = q1k(vc->pitch + bend * V[BendRange]); cr[ob + 1] = vc->gate ? 1 : 0; cr[ob + 2] = vc->vel; cr[ob + 3] = vc->note / 127.0; cr[ob + 4] = mod; cr[ob + 5] = press; cr[ob + 6] = q1k(vc->pitch); } break;
      case N_Voices: cr[ob] = q1k(gin_[0]); cr[ob + 1] = q1k(gin_[1]); break;
      case N_Osc: {
        double xk = i0 + P[1] + P[2] + i1; if (xk != s[8]) { s[8] = xk; s[9] = clampd(midiHz(clampd(xk, -60, 160)), 0, hzmax); } double dt = s[9] / sr_; if (i3 > 0.5 && s[1] <= 0.5) s[0] = 0; s[1] = i3;
        double ph = s[0], y;
        switch (swi(P[0])) {
          case 0: y = 2 * ph - 1 - polyBlep(ph, dt); break;
          case 1: { double pw = clampd(P[3] + i2 * 0.5, 0.02, 0.98); y = ph < pw ? 1 : -1; y += polyBlep(ph, dt); double t2 = ph + 1 - pw; if (t2 >= 1) t2 -= 1; y -= polyBlep(t2, dt); break; }
          case 2: y = 4 * std::fabs(ph - 0.5) - 1; break;
          default: y = fsin(ph); break;
        }
        ph += dt; if (ph >= 1) ph -= std::floor(ph); s[0] = ph; cr[ob] = q1k(y * P[4]); break; }
      case N_FmOp: {
        if (i0 != s[8]) { s[8] = i0; s[9] = clampd(midiHz(clampd(i0, -60, 160)), 0, hzmax); } double dt = std::min(0.45, s[9] * P[0] / sr_), ph = s[0];
        double y = fsin(ph + (i1 * P[1] * i2 + P[2] * s[2] * 1.2)); s[2] = 0.5 * (y + s[2]); ph += dt; ph -= std::floor(ph); s[0] = ph; cr[ob] = q1k(y * P[3]); break; }
      case N_Noise: {
        double w = st.rng.white(), y;
        switch (swi(P[0])) {
          case 1: s[0] = 0.99886 * s[0] + w * 0.0555179; s[1] = 0.99332 * s[1] + w * 0.0750759; s[2] = 0.969 * s[2] + w * 0.153852; s[3] = 0.8665 * s[3] + w * 0.3104856; s[4] = 0.55 * s[4] + w * 0.5329522; s[5] = -0.7616 * s[5] - w * 0.016898;
            y = (s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + w * 0.5362) * 0.11; s[6] = w * 0.115926; break;
          case 2: s[7] = clampd(s[7] + w * 0.04, -1, 1) * 0.998; y = s[7] * 3; break;
          case 3: { double u = st.rng.uni(); y = u < 0.0004 ? w * 3 : 0; break; }
          default: y = w; break;
        }
        cr[ob] = q1k(clampd(y, -2, 2) * P[1]); break; }
      case N_WaveT: {
        if (i0 != s[8]) { s[8] = i0; s[9] = clampd(midiHz(clampd(i0, -60, 160)), 0, hzmax); } double f = s[9]; int tb_ = idxc(rnd(P[0]), 0, 11);
        double y = wtRead(wtTable(tb_), std::max(f, 1.0), sr_, s[0], clampd(P[1] + i1, 0, 1)); s[0] += f / sr_; s[0] -= std::floor(s[0]); cr[ob] = q1k(y * P[2]); break; }
      case N_Pluck: {
        double f = clampd(clampd(midiHz(clampd(i1, -60, 160)), 0, hzmax), 20, sr_ * 0.4), a = 0.12 + 0.88 * (1 - P[1]) * (1 - P[1]) + 0.0001, t60 = std::max(0.05, P[0]), g = std::min(0.9995, std::pow(10.0, -3 / (t60 * f)));
        double dd = std::max(2.5, sr_ / f - (1 - a) / a - 0.5), y = st.d1->read(dd); s[0] += (y - s[0]) * a; if (!isFin(y)) { st.d1->clear(); s[0] = 0; cr[ob] = 0; break; }
        st.d1->push(clampd(i0 + s[0] * g, -8, 8)); cr[ob] = q1k(y * P[2]); break; }
      case N_Grain: {
        double* gg = st.g; double size = std::max(64.0, P[0] * 0.001 * sr_); if (P[4] < 0.5) st.d1->push(i0);
        { double u = st.rng.uni(); double w = st.rng.white();
          if (u < P[1] / sr_ * (1 + 0.5 * w)) {
            for (int i = 0; i < 8; ++i) if (gg[i * 4 + 3] <= 0) {
              double u2 = st.rng.uni(); gg[i * 4] = clampd((clampd(i1 * 0.5 + 0.5, 0, 1) * 1.5 + P[2] * 0.3 * u2) * sr_, 8, 1.9 * sr_);
              double w2 = st.rng.white(); gg[i * 4 + 1] = std::pow(2.0, (P[3] + i2 + P[2] * 0.5 * w2) / 12); gg[i * 4 + 2] = 0; gg[i * 4 + 3] = size; break; }
          } }
        double sum = 0; double fz = P[4] > 0.5 ? 0 : 1;
        for (int i = 0; i < 8; ++i) {
          int o = i * 4; if (gg[o + 3] <= 0) continue; double w = 0.5 - 0.5 * std::cos(2 * kPi * gg[o + 2] / gg[o + 3]);
          double dly = clampd(gg[o] - (gg[o + 1] - fz) * gg[o + 2], 2, sr_ * 1.95); sum += w * st.d1->read(dly); gg[o + 2] += 1; if (gg[o + 2] >= gg[o + 3]) gg[o + 3] = 0;
        }
        cr[ob] = q1k(sum * P[5] / std::sqrt(1 + P[1] * P[0] * 0.001)); break; }
      case N_Svf: {
        double fc = i1 == 0 ? P[0] : P[0] * std::pow(2.0, i1 / 12), rr = clampd(P[1] + i2, 0, 1), qq = 0.6 + rr * rr * 24; tpt(fc, qq, s, 0, 1, i0);
        double lp = tl, bp = tb, hp = th; if (!isFin(lp + bp + hp)) { s[0] = s[1] = 0; lp = bp = hp = 0; }
        cr[ob] = q1k(lp); cr[ob + 1] = q1k(bp / qq); cr[ob + 2] = q1k(hp); cr[ob + 3] = q1k(lp + hp); break; }
      case N_Ladder: {
        if (P[0] != s[8] || i1 != s[9]) { s[8] = P[0]; s[9] = i1; double fc = clampd(i1 == 0 ? P[0] : P[0] * std::pow(2.0, i1 / 12), 20, sr_ * 0.25); s[10] = std::min(0.6, 1 - std::exp(-2 * kPi * fc / sr_)); }
        double g = s[10], k = 4 * clampd(P[1] + i2, 0, 1.05);
        double x = fastTanh(i0 * P[2] - k * s[3] * 0.95);
        s[0] += g * (x - s[4]); s[4] = fastTanh(s[0]); s[1] += g * (s[4] - s[5]); s[5] = fastTanh(s[1]); s[2] += g * (s[5] - s[6]); s[6] = fastTanh(s[2]); s[3] += g * (s[6] - s[7]); s[7] = fastTanh(s[3]);
        if (!isFin(s[3])) for (int i = 0; i < 8; ++i) s[i] = 0;
        cr[ob] = q1k(s[3] * (1 + 0.4 * clampd(P[1], 0, 1)) / std::max(0.5, P[2] * 0.5 + 0.5)); break; }
      case N_Formant: {
        double vp = clampd(P[0] + i1, 0, 3.999); int v0 = (int)vp; double fr = vp - v0, y = 0;
        for (int b = 0; b < 3; ++b) { double fc = FORM[v0][b] + (FORM[v0 + 1][b] - FORM[v0][b]) * fr; tpt(fc, P[1], s, b * 2, b * 2 + 1, i0); y += tb / P[1] * FORMG[b] * 2; }
        if (!isFin(y)) { for (int i = 0; i < 6; ++i) s[i] = 0; y = 0; } cr[ob] = q1k(y * P[2]); break; }
      case N_Comb: {
        double f = clampd(P[0] * std::pow(2.0, i1 / 12), 20, sr_ * 0.4), y = st.d1->read(std::max(2.5, sr_ / f - 1)); s[0] += (y - s[0]) * (1 - P[2] * 0.9);
        if (!isFin(y)) { st.d1->clear(); s[0] = 0; cr[ob] = 0; break; } st.d1->push(clampd(i0 + s[0] * P[1], -8, 8)); cr[ob] = q1k(y); break; }
      case N_Allpass: { double f = clampd(P[0] * std::pow(2.0, i1 / 12), 20, sr_ * 0.45), t = std::tan(kPi * f / sr_), a = (t - 1) / (t + 1), y = a * i0 + s[0]; s[0] = i0 - a * y; cr[ob] = q1k(y); break; }
      case N_Shaper: {
        double dr = clampd(P[1] + i1, 0.1, 30), x = i0, y;
        switch (swi(P[0])) { case 1: y = fsin(x * dr * 0.25); break; case 2: y = clampd(x * dr, -1, 1); break; case 3: { double steps = std::max(2.0, 64 / dr); y = rnd(x * steps) / steps; break; }
          case 4: y = std::tanh(dr * x + 0.4) - std::tanh(0.4); break; default: y = std::tanh(dr * x); break; }
        cr[ob] = q1k(y * P[2]); break; }
      case N_Rectify: { int m = swi(P[0]); cr[ob] = q1k(m == 0 ? std::fabs(i0) : (m == 1 ? std::max(0.0, i0) : std::min(0.0, i0))); break; }
      case N_Mult: cr[ob] = q1k(i0 * i1); break;
      case N_Atten: cr[ob] = q1k(i0 * i1 * P[0] + P[1]); break;
      case N_Mix4: cr[ob] = q1k(i0 * P[0] + i1 * P[1] + i2 * P[2] + i3 * P[3]); break;
      case N_Xfade: { double x = clampd(P[0] + i2, 0, 1); cr[ob] = q1k(i0 + (i1 - i0) * x); break; }
      case N_Pan: { double p = clampd(P[0] + i1, -1, 1), a = (p + 1) * 0.25 * kPi; cr[ob] = q1k(i0 * std::cos(a)); cr[ob + 1] = q1k(i0 * std::sin(a)); break; }
      case N_Math: {
        double a = i0, b = i1 + P[1], y;
        switch (swi(P[0])) { case 1: y = a - b; break; case 2: y = a * b; break; case 3: y = std::fabs(b) < 1e-6 ? 0 : a / b; break; case 4: y = std::min(a, b); break; case 5: y = std::max(a, b); break;
          case 6: y = std::fabs(a - b); break; case 7: y = std::fabs(b) < 1e-6 ? 0 : a - b * std::floor(a / b); break; default: y = a + b; break; }
        cr[ob] = q1k(clampd(y, -1e4, 1e4)); break; }
      case N_Compare: cr[ob] = i0 > i1 + P[0] ? 1 : 0; break;
      case N_Logic: { bool a = i0 > 0.5, b = i1 > 0.5; int op = swi(P[0]); cr[ob] = (op == 0 ? (a && b) : op == 1 ? (a || b) : op == 2 ? (a != b) : !(a && b)) ? 1 : 0; break; }
      case N_SampleHold: if (i1 > 0.5 && s[1] <= 0.5) s[0] = i0; s[1] = i1; cr[ob] = q1k(s[0]); break;
      case N_Slew: { double t = i0 > s[0] ? P[0] : P[1]; s[0] += (i0 - s[0]) * (1 - std::exp(-1 / (std::max(0.0001, t * 0.001) * sr_))); cr[ob] = q1k(s[0]); break; }
      case N_Quant: {
        const int* sc = QSC[idxc(rnd(P[0]), 0, 7)]; double x = i0 - P[1], oc = std::floor(x / 12), r = x - 12 * oc, best = 0, bd = 1e9;
        for (int k = 1; k <= sc[0]; ++k) { double dd = std::fabs(r - sc[k]); if (dd < bd) { bd = dd; best = sc[k]; } } if (std::fabs(r - 12) < bd) best = 12;
        cr[ob] = q1k(P[1] + 12 * oc + best); break; }
      case N_Const: cr[ob] = P[0]; break;
      case N_ADSR: {
        bool g = i0 > 0.5; if (g && s[1] <= 0.5) s[2] = 1; s[1] = i0; double lv = s[0];
        if (!g && s[2] != 3 && s[2] != 0) s[2] = 3;
        if (s[2] == 1) { lv += 1 / std::max(1.0, P[0] * sr_); if (lv >= 1) { lv = 1; s[2] = 2; } }
        else if (s[2] == 2) { if (P[1] != s[8]) { s[8] = P[1]; s[9] = 1 - std::exp(-4 / std::max(1.0, P[1] * sr_)); } lv += (P[2] - lv) * s[9]; }
        else if (s[2] == 3) { if (P[3] != s[10]) { s[10] = P[3]; s[11] = 1 - std::exp(-4 / std::max(1.0, P[3] * sr_)); } lv += (0 - lv) * s[11]; if (lv < 1e-5) { lv = 0; s[2] = 0; } }
        s[0] = lv; cr[ob] = lv; break; }
      case N_AR: {
        if (i0 > 0.5 && s[1] <= 0.5) s[2] = 1; s[1] = i0; double lv = s[0];
        if (s[2] == 1) { lv += 1 / std::max(1.0, P[0] * sr_); if (lv >= 1) { lv = 1; s[2] = 2; } } else if (s[2] == 2) { if (P[1] != s[8]) { s[8] = P[1]; s[9] = 1 - std::exp(-4 / std::max(1.0, P[1] * sr_)); } lv += (0 - lv) * s[9]; if (lv < 1e-5) { lv = 0; s[2] = 0; } }
        s[0] = lv; cr[ob] = lv; break; }
      case N_LFO: {
        if (i1 > 0.5 && s[2] <= 0.5) s[0] = P[2]; s[2] = i1; double rate = clampd(P[1] * std::pow(2.0, i0), 0.001, 200), ph = s[0]; bool wrap = false; ph += rate / sr_; if (ph >= 1) { ph -= std::floor(ph); wrap = true; } s[0] = ph;
        double y; switch (swi(P[0])) { case 1: y = 4 * std::fabs(ph - 0.5) - 1; break; case 2: y = 2 * ph - 1; break; case 3: y = ph < 0.5 ? 1 : -1; break;
          case 4: if (wrap || s[3] == 0) { s[4] = st.rng.white(); s[3] = 1; } y = s[4]; break;
          case 5: if (wrap || s[3] == 0) { s[5] = s[4]; s[4] = st.rng.white(); s[3] = 1; } y = s[5] + (s[4] - s[5]) * (0.5 - 0.5 * std::cos(kPi * ph)); break;
          default: y = fsin(ph); break; }
        cr[ob] = q1k((P[3] > 0.5 ? y : 0.5 + 0.5 * y) * P[4]); break; }
      case N_Clock: {
        double bpm = P[2] > 0.5 ? V[Tempo] : P[0], rate = std::max(0.1, bpm) / 60 * CLK_MUL[idxc(rnd(P[1]), 0, 4)];
        if (i0 > 0.5 && s[1] <= 0.5) s[0] = 0.99999; s[1] = i0; s[0] += rate / sr_; bool fire = false; if (s[0] >= 1) { s[0] -= std::floor(s[0]); fire = true; } if (fire) s[2] = std::max(2.0, 0.002 * sr_);
        double y = s[2] > 0 ? 1 : 0; if (s[2] > 0) s[2] -= 1; cr[ob] = y; break; }
      case N_ClockDiv: {
        if (i1 > 0.5 && s[2] <= 0.5) { s[1] = 0; s[3] = 0; } s[2] = i1;
        if (i0 > 0.5 && s[4] <= 0.5) { s[0] += 1; if (s[0] >= std::max(1.0, rnd(P[0]))) { s[0] = 0; s[3] = 1; } else s[3] = 0; } s[4] = i0; cr[ob] = (i0 > 0.5 && s[3] > 0.5) ? 1 : 0; break; }
      case N_Seq: {
        double len = clampd(rnd(P[8]), 1, 8);
        if (i1 > 0.5 && s[3] <= 0.5) { s[0] = 0; s[5] = 1; s[6] = 0; } s[3] = i1;
        s[7] += 1; if (i0 > 0.5 && s[4] <= 0.5) { if (s[5] == 0) s[0] = std::fmod(s[0] + 1, len); s[5] = 0; s[8] = s[7]; s[7] = 0; s[6] = 1; } s[4] = i0;
        double tgt = P[idxc((double)(int)s[0], 0, 7)], c = P[10] > 0.001 ? 1 - std::exp(-1 / (P[10] * 0.05 * sr_)) : 1; s[1] += (tgt - s[1]) * c; if (!isFin(s[1])) s[1] = 0;
        double per = s[8] > 0 ? s[8] : sr_ * 0.25; bool gate = s[6] > 0.5 && s[7] < P[9] * per; cr[ob] = q1k(s[1]); cr[ob + 1] = gate ? 1 : 0; break; }
      case N_Random: { if (i0 > 0.5 && s[1] <= 0.5) s[2] = st.rng.white() * P[0]; s[1] = i0; double c = P[1] > 0 ? 1 - std::exp(-1 / (P[1] * 0.001 * sr_)) : 1; s[0] += (s[2] - s[0]) * c; cr[ob] = q1k(s[0]); break; }
      case N_EnvFollow: { double x = std::fabs(i0), t = x > s[0] ? P[0] : P[1]; s[0] += (x - s[0]) * (1 - std::exp(-1 / (std::max(0.05, t) * 0.001 * sr_))); cr[ob] = q1k(s[0]); break; }
      case N_Delay: {
        double tm = clampd(P[0] * std::pow(2.0, i1), 1, 2000) * 0.001 * sr_, y = st.d1->read(std::max(2.0, tm)); s[0] += (y - s[0]) * (0.05 + 0.95 * P[2]);
        if (!isFin(y)) { st.d1->clear(); s[0] = 0; cr[ob] = q1k(i0); break; } st.d1->push(clampd(i0 + s[0] * P[1], -8, 8)); cr[ob] = q1k(i0 * (1 - P[3] * 0.5) + y * P[3]); break; }
      case N_Reverb: {
        if (!st.rev) { cr[ob] = q1k(i0); cr[ob + 1] = q1k(i1); break; } double r = nd.src[1].empty() ? i0 : i1, x = (i0 + r) * 0.015, fb = 0.7 + 0.28 * P[0], dm = P[1] * 0.4;
        double wl = st.rev->tick(0, x, fb, dm); double wr = st.rev->tick(1, x, fb, dm); cr[ob] = q1k(i0 * (1 - P[2]) + wl * 3 * P[2]); cr[ob + 1] = q1k(r * (1 - P[2]) + wr * 3 * P[2]); break; }
      case N_Chorus: {
        s[0] += P[0] / sr_; s[0] -= std::floor(s[0]); double dly = (0.012 + 0.001 * P[1] * fsin(s[0])) * sr_, y = st.d1->read(std::max(2.0, dly)); st.d1->push(i0); cr[ob] = q1k(i0 * (1 - P[2] * 0.5) + y * P[2]); break; }
      case N_Phaser: {
        s[0] += P[0] / sr_; s[0] -= std::floor(s[0]); double f = 300 * std::pow(12.0, 0.5 + 0.5 * P[1] * fsin(s[0])), t = std::tan(kPi * std::min(f, sr_ * 0.4) / sr_), a = (t - 1) / (t + 1);
        double x = i0 + s[5] * P[2]; for (int k = 0; k < 4; ++k) { double y = a * x + s[1 + k]; s[1 + k] = x - a * y; x = y; } if (!isFin(x)) { for (int i = 0; i < 8; ++i) s[i] = 0; x = 0; }
        s[5] = x; cr[ob] = q1k(i0 * (1 - P[3] * 0.5) + x * P[3] * 0.7); break; }
      case N_VoiceOut: if (vc) { double l = i0, r = nd.src[1].empty() ? i0 : i1; if (P[1] != s[0]) { s[0] = P[1]; double a = (clampd(P[1], -1, 1) + 1) * 0.25 * kPi; s[1] = std::cos(a) * 1.41421; s[2] = std::sin(a) * 1.41421; } vc->oL += l * s[1] * P[0]; vc->oR += r * s[2] * P[0]; } break;
      case N_Master: mastL = i0 * P[0]; mastR = (nd.src[1].empty() ? i0 : i1) * P[0]; break;
      default: break;
    }
  }
  void process(float* outL, float* outR, int n) override {
    PSec& VS = patch.sec[0]; PSec& MS = patch.sec[1]; double vol = v[Volume], sr_ = sr;
    double gl = v[Glide] > 0.001 ? 1 - std::exp(-1 / (std::max(0.0005, v[Glide] * v[Glide] * 2) * sr_)) : 1; long long quietMax = (long long)(0.3 * sr_); double lifeMax = 30 * sr_;
    for (int i = 0; i < n; ++i) {
      if ((smoothCtr++ & 7) == 0 || kdirty) { smoothKnobs(); kdirty = false; }
      double sl = 0, sR = 0;
      for (int k = 0; k < kVoiceMax; ++k) {
        VoiceS& vv = voice[(size_t)k]; if (!vv.active) continue; vv.oL = 0; vv.oR = 0; vv.pitch += (vv.target - vv.pitch) * gl;
        cur = vv.outs.data(); for (size_t j = 0; j < VS.order.size(); ++j) { int idx = VS.order[j]; evalNode(VS.nodes[(size_t)idx], vv.st[(size_t)idx], &vv, nullptr); }
        sl += vv.oL; sR += vv.oR; double pk = std::max(std::fabs(vv.oL), std::fabs(vv.oR)); ++vv.life; ++vv.age;
        if (!vv.gate) { if (pk < 1e-5) { if (++vv.quiet > quietMax) vv.active = false; } else vv.quiet = 0; if (double(vv.life) > lifeMax) vv.active = false; }
      }
      gin[0] = sl; gin[1] = sR; mastL = sl; mastR = sR; cur = mouts.data();
      for (size_t j = 0; j < MS.order.size(); ++j) { int idx = MS.order[j]; evalNode(MS.nodes[(size_t)idx], ms[(size_t)idx], nullptr, gin); }
      double l = fastTanh(mastL * vol), r = fastTanh(mastR * vol); if (!isFin(l + r)) { l = r = 0; }
      outL[i] = (float)l; outR[i] = (float)r;
    }
  }
};
inline Info info() {
  return Info{"avoidica", "Avoidica", "Patchable modular-ensemble synth: 41 modules from oscillators, FM, wavetable, pluck and granulator through filters, envelopes, clock and sequencer to delay and reverb, with 12 factory patches and 16 macro knobs.", makeSpecs(), makeGroups(),
              Theme{"avoidica", 0xff102129, 0xff060b0f, 0xff4fd1c5, 0xffe3f5f2, 0xff8af2e4}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::avoidica
