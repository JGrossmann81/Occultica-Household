// Engine interface shared by every Occultica instrument. Parameters are described once (Spec) and the plugin shell builds knobs and host automation from them.
#pragma once
#include "dsp.h"
#include <cstdio>
#include <functional>
#include <memory>
namespace occ {
struct Spec { std::string name, unit; double min, max, def; std::string fmt; bool log; std::vector<std::string> labels; };
inline Spec P(const char* name, const char* unit, double mn, double mx, double def, const char* fmt = "%.2f", bool lg = false, std::vector<std::string> labels = {}) { return Spec{name, unit, mn, mx, def, fmt, lg, std::move(labels)}; }
struct Group { std::string name; std::vector<int> ids; };
struct EngineBase {
  double sr; std::vector<double> v; std::vector<std::pair<int, double>> writes; double noteTune = 0; long counter = 0;
  explicit EngineBase(double s) : sr(s) {}
  virtual ~EngineBase() = default;
  void initParams(const std::vector<Spec>& specs) { v.resize(specs.size()); for (size_t i = 0; i < specs.size(); ++i) v[i] = specs[i].def; }
  void writeParam(int id, double x) { if (writes.size() < 512) writes.emplace_back(id, x); }
  virtual void set(int id, double x) = 0;
  virtual void noteOn(int note, double vel) = 0;
  virtual void noteOff(int note) = 0;
  virtual void allNotesOff() = 0;
  virtual void pitchBend(double) {}
  virtual void modWheel(double) {}
  virtual void pressure(double) {}
  virtual void process(float* L, float* R, int n) = 0;
};
// Visual identity of an instrument: the editor reads this.
struct Theme { std::string motif; unsigned bg1, bg2, accent, ink, glow; };
struct Info { const char* id; const char* name; const char* blurb; std::vector<Spec> specs; std::vector<Group> groups; Theme theme; std::function<std::unique_ptr<EngineBase>(double)> make;
  std::vector<int> hidden = {};                        // parameter ids that do nothing in this build: not registered with the host, not shown (the engine keeps its own value)
  std::function<std::string(int, int)> dynLabel = {};  // optional: (parameter id, current preset) -> label for the editor; "" keeps the Spec name, "-" marks the control unused
};
inline std::string formatValue(const Spec& s, double v) {
  if (!s.labels.empty()) { long i = std::lround(v); if (i < 0) i = 0; if (i >= (long)s.labels.size()) i = (long)s.labels.size() - 1; return s.labels[i]; }
  char b[64]; std::snprintf(b, sizeof b, s.fmt.c_str(), v); return b;
}
}  // namespace occ
