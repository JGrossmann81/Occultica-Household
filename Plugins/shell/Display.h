// Live, instrument-specific display panels for the editor (Minica, Rhodica, Fantica and their Rev2 builds, which share the theme motif).
// Everything is drawn from the host parameters (proc.apvts), the keyboard state and the output level, so it reacts to the knobs and to playing.
// Display only: nothing here touches the DSP.
#pragma once
#include "Processor.h"
#include <bitset>
#include <cmath>
#include <complex>
#include <string>

namespace occdisp {
using Gfx = juce::Graphics; using Rect = juce::Rectangle<float>; using Col = juce::Colour;
constexpr double kTwoPi = 6.283185307179586;
inline double clampd_(double x, double a, double b) { return x < a ? a : (x > b ? b : x); }
inline float clampf_(float x, float a, float b) { return x < a ? a : (x > b ? b : x); }
inline double frac_(double x) { return x - std::floor(x); }

// What is being played, as seen from the keyboard state. When nobody has played for a while a short demo phrase runs, so the panel is never dead.
struct Play {
  bool held = false, demo = false, newNote = false; int note = 60; double tHeld = 0, tRel = 99, tHeldAtRel = 0, idle = 8, demoT = 0; float vel = 0.8f;
  std::bitset<128> prev;
  void update(juce::MidiKeyboardState& ks, double dt) {
    static const int kDemo[4] = {60, 64, 67, 55};
    std::bitset<128> cur; int top = -1, fresh = -1;
    for (int n = 0; n < 128; ++n) if (ks.isNoteOnForChannels(0xffff, n)) { cur.set(n); top = n; if (!prev.test(n)) fresh = n; }
    prev = cur; newNote = false; int want = -1;
    if (top >= 0) { idle = 0; demo = false; demoT = 0; want = fresh >= 0 ? fresh : (held && cur.test(note) ? note : top); }
    else { idle += dt; if (idle > 7.0) { demo = true; demoT += dt; if (std::fmod(demoT, 4.8) < 2.4) want = kDemo[(int)(demoT / 4.8) % 4]; } else demo = false; }
    const bool was = held; held = want >= 0;
    if (held) { if (!was || want != note || fresh >= 0) { tHeld = 0; newNote = true; } note = want; tHeld += dt; tRel = 0; }
    else { if (was) { tHeldAtRel = tHeld; tRel = 0; } tRel += dt; }
  }
};

// ADSR as the engine's Adsr does it: linear attack, exponential decay towards sustain, exponential release.
struct Env { double a, d, s, r; };
inline double envHeld(const Env& e, double t) { if (t < e.a) return t / std::max(1e-6, e.a); return e.s + (1 - e.s) * std::exp(-6.9 * (t - e.a) / std::max(1e-3, e.d)); }
inline double envNow(const Env& e, bool held, double th, double tr, double thRel) { return held ? envHeld(e, th) : envHeld(e, thRel) * std::exp(-6.9 * tr / std::max(1e-3, e.r)); }
// Position of "now" on a stage-warped time axis (A 0..0.22, D ..0.52, S ..0.72, R ..1).
inline double envX(const Env& e, bool held, double th, double tr) {
  if (!held) return 0.72 + 0.28 * clampd_(tr / std::max(1e-3, e.r), 0, 1);
  if (th < e.a) return 0.22 * th / std::max(1e-6, e.a);
  double u = th - e.a; if (u < e.d) return 0.22 + 0.30 * u / std::max(1e-3, e.d);
  return 0.52 + 0.20 * clampd_((u - e.d) / 1.0, 0, 1);
}

inline void caption(Gfx& g, const juce::String& s, Rect r, float size, Col c, juce::Justification j = juce::Justification::centredLeft, bool bold = false) {
  g.setColour(c); g.setFont(juce::Font(juce::FontOptions(size, bold ? juce::Font::bold : juce::Font::plain))); g.drawText(s, r.toNearestInt(), j, false);
}
inline void mono(Gfx& g, const juce::String& s, Rect r, float size, Col c, juce::Justification j = juce::Justification::centredLeft) {
  g.setColour(c); g.setFont(juce::Font(juce::FontOptions(juce::Font::getDefaultMonospacedFontName(), size, juce::Font::plain))); g.drawText(s, r.toNearestInt(), j, false);
}
inline void glowStroke(Gfx& g, const juce::Path& p, Col c, float w) {
  g.setColour(c.withAlpha(0.14f)); g.strokePath(p, juce::PathStrokeType(w * 3.2f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
  g.setColour(c); g.strokePath(p, juce::PathStrokeType(w, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
}
}  // namespace occdisp

class OccDisplay : public juce::Component, private juce::Timer {
public:
  enum Kind { None, Minica, Rhodica, Fantica };
  static Kind kindFor(const occ::Theme& t) { return t.motif == "minica" ? Minica : (t.motif == "rhodica" ? Rhodica : (t.motif == "fantica" ? Fantica : None)); }
  static constexpr int kHeight = 262;

  OccDisplay(OccProcessor& p, Kind k) : proc(p), kind(k), th(p.info.theme) {
    for (size_t i = 0; i < p.info.specs.size(); ++i) ptrs.push_back(p.apvts.getRawParameterValue(OccProcessor::pid((int)i)));
    last = juce::Time::getMillisecondCounterHiRes(); setInterceptsMouseClicks(false, false); setOpaque(false); startTimerHz(30);
  }
  void paint(juce::Graphics& g) override {
    using namespace occdisp; auto b = getLocalBounds().toFloat();
    g.setColour(juce::Colours::black.withAlpha(0.32f)); g.fillRoundedRectangle(b, 10.f); g.setColour(Col(th.accent).withAlpha(0.28f)); g.drawRoundedRectangle(b.reduced(0.5f), 10.f, 1.f);
    auto in = b.reduced(8.f);
    if (kind == Minica) paintMinica(g, in); else if (kind == Rhodica) paintRhodica(g, in); else if (kind == Fantica) paintFantica(g, in);
    if (play.demo) caption(g, "demo - play a key", b.removeFromBottom(14.f).removeFromRight(120.f).translated(-12, 0), 10.f, Col(th.ink).withAlpha(0.35f), juce::Justification::centredRight);
  }

private:
  using Rect = occdisp::Rect; using Col = occdisp::Col;
  OccProcessor& proc; Kind kind; const occ::Theme& th; std::vector<std::atomic<float>*> ptrs;
  occdisp::Play play; double last = 0, ts = 0, scroll = 0, tinePh = 0, lcdPos = -1; float levelSm = 0;

  void timerCallback() override {
    double now = juce::Time::getMillisecondCounterHiRes(), dt = occdisp::clampd_((now - last) / 1000.0, 0.0, 0.2); last = now; ts += dt;
    play.update(proc.keyState, dt); scroll += dt * (play.held ? 1.4 : 0.3);
    levelSm = std::max(proc.level.load(), levelSm * 0.85f);
    repaint();
  }
  double pv(int id) const { return (double)ptrs[(size_t)id]->load(); }
  Col acc() const { return Col(th.accent); } Col ink() const { return Col(th.ink); } Col glow() const { return Col(th.glow); }

  // ---- shared drawing helpers -------------------------------------------------------------------------------------------------------
  Rect sub(juce::Graphics& g, Rect r, const juce::String& title, Col tint, bool lcd = false) const {
    g.setColour(lcd ? tint.withMultipliedBrightness(0.12f).withAlpha(0.95f) : juce::Colours::black.withAlpha(0.38f)); g.fillRoundedRectangle(r, 7.f);
    g.setColour(acc().withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(0.5f), 7.f, 1.f);
    occdisp::caption(g, title.toUpperCase(), r.withHeight(20.f).withTrimmedLeft(9.f), 11.f, acc(), juce::Justification::centredLeft, true);
    return r.withTrimmedTop(20.f).reduced(8.f, 4.f);
  }
  void grid(juce::Graphics& g, Rect r, int nx, int ny, float a = 0.07f, Col c = Col()) const {
    if (c.isTransparent()) c = acc(); g.setColour(c.withAlpha(a));
    for (int i = 0; i <= nx; ++i) { float x = r.getX() + r.getWidth() * i / nx; g.drawVerticalLine((int)x, r.getY(), r.getBottom()); }
    for (int j = 0; j <= ny; ++j) { float y = r.getY() + r.getHeight() * j / ny; g.drawHorizontalLine((int)y, r.getX(), r.getRight()); }
  }
  // Envelope with the playhead dot; the time axis is warped per stage so a 1 ms attack stays visible.
  void drawEnv(juce::Graphics& g, Rect r, const occdisp::Env& e, Col c, const juce::String& label) const {
    using namespace occdisp;
    g.setColour(juce::Colours::black.withAlpha(0.35f)); g.fillRoundedRectangle(r, 4.f); grid(g, r, 4, 2, 0.06f, c);
    juce::Path p, f; const int N = 120; auto at = [&](double x) {
      double v; if (x < 0.22) v = x / 0.22; else if (x < 0.52) v = e.s + (1 - e.s) * std::exp(-6.9 * (x - 0.22) / 0.30); else if (x < 0.72) v = e.s; else v = e.s * std::exp(-6.9 * (x - 0.72) / 0.28);
      return juce::Point<float>(r.getX() + 3 + (float)x * (r.getWidth() - 6), r.getBottom() - 3 - (float)v * (r.getHeight() - 8)); };
    f.startNewSubPath(r.getX() + 3, r.getBottom() - 3);
    for (int i = 0; i <= N; ++i) { auto q = at((double)i / N); if (i == 0) p.startNewSubPath(q); else p.lineTo(q); f.lineTo(q); }
    f.lineTo(r.getRight() - 3, r.getBottom() - 3); f.closeSubPath(); g.setColour(c.withAlpha(0.14f)); g.fillPath(f); glowStroke(g, p, c, 1.6f);
    g.setColour(ink().withAlpha(0.18f)); for (double x : {0.22, 0.52, 0.72}) g.drawVerticalLine((int)(r.getX() + 3 + x * (r.getWidth() - 6)), r.getY() + 2, r.getBottom() - 2);
    double x = envX(e, play.held, play.tHeld, play.tRel), v = envNow(e, play.held, play.tHeld, play.tRel, play.tHeldAtRel);
    if (play.held || play.tRel < e.r * 1.3 + 0.1) {
      auto d = juce::Point<float>(r.getX() + 3 + (float)x * (r.getWidth() - 6), r.getBottom() - 3 - (float)clampd_(v, 0, 1) * (r.getHeight() - 8));
      g.setColour(Col(th.glow).withAlpha(0.35f)); g.fillEllipse(d.x - 6, d.y - 6, 12, 12); g.setColour(juce::Colours::white); g.fillEllipse(d.x - 2.6f, d.y - 2.6f, 5.2f, 5.2f);
    }
    caption(g, label, r.withHeight(14.f).translated(4, 1), 10.f, ink().withAlpha(0.7f));
  }
  static juce::String secs(double s) { return s < 0.1 ? juce::String(s * 1000.0, 0) + " ms" : juce::String(s, s < 1 ? 2 : 1) + " s"; }
  void meterBar(juce::Graphics& g, Rect r, double v, Col c, bool vertical) const {
    g.setColour(juce::Colours::black.withAlpha(0.45f)); g.fillRoundedRectangle(r, 3.f);
    const int seg = 14; for (int i = 0; i < seg; ++i) {
      Rect s = vertical ? Rect(r.getX() + 2, r.getBottom() - 2 - (i + 1) * (r.getHeight() - 4) / seg + 1, r.getWidth() - 4, (r.getHeight() - 4) / seg - 1)
                        : Rect(r.getX() + 2 + i * (r.getWidth() - 4) / seg, r.getY() + 2, (r.getWidth() - 4) / seg - 1, r.getHeight() - 4);
      bool on = v * seg > i + 0.01; g.setColour(on ? c.withAlpha(0.35f + 0.65f * (float)i / seg) : c.withAlpha(0.08f)); g.fillRect(s);
    }
  }

  // =====================================================================================================================================
  //  MINICA: three oscillator scopes, mixer with overload, ladder filter with contour, filter and loudness envelopes
  // =====================================================================================================================================
  static double mWave(int w, double p) {
    switch (w) {
      case 0: return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
      case 1: return 0.5 * ((p < 0.5 ? 4 * p - 1 : 3 - 4 * p) + (2 * p - 1));
      case 2: return 2 * p - 1;
      case 3: return p < 0.5 ? 1 : -1;
      case 4: return ((p < 0.3 ? 1.0 : -1.0) - (2 * 0.3 - 1)) / (1 + std::fabs(2 * 0.3 - 1));
      default: return ((p < 0.15 ? 1.0 : -1.0) - (2 * 0.15 - 1)) / (1 + std::fabs(2 * 0.15 - 1));
    }
  }
  void paintMinica(juce::Graphics& g, Rect b) {
    using namespace occdisp; namespace M = occ::minica; const auto& sp = proc.info.specs;
    const float gap = 6.f; auto oscR = b.removeFromLeft(404.f); b.removeFromLeft(gap); auto mixR = b.removeFromLeft(168.f); b.removeFromLeft(gap); auto fltR = b;
    // --- oscillators
    {
      auto in = sub(g, oscR, "Oscillators - range / wave / level", acc()); const float rh = (in.getHeight() - 2 * 5.f) / 3.f;
      const int rid[3] = {M::O1Range, M::O2Range, M::O3Range}, wid[3] = {M::O1Wave, M::O2Wave, M::O3Wave}, vid[3] = {M::Vol1, M::Vol2, M::Vol3};
      for (int o = 0; o < 3; ++o) {
        Rect row(in.getX(), in.getY() + o * (rh + 5.f), in.getWidth(), rh); auto lab = row.removeFromLeft(86.f); auto sc = row.reduced(2.f, 0.f);
        int rg = (int)std::lround(pv(rid[o])), wv = (int)std::lround(pv(wid[o])); double lvl = pv(vid[o]), cents = o == 0 ? 0.0 : pv(o == 1 ? M::O2Tune : M::O3Tune);
        caption(g, "OSC " + juce::String(o + 1), lab.removeFromTop(16.f), 12.f, ink(), juce::Justification::centredLeft, true);
        caption(g, juce::String(occ::formatValue(sp[(size_t)wid[o]], (double)wv)), lab.removeFromTop(15.f), 11.f, glow());
        caption(g, juce::String(occ::formatValue(sp[(size_t)rid[o]], (double)rg)) + (o ? juce::String::formatted("  %+.0fc", cents) : juce::String()), lab.removeFromTop(15.f), 11.f, ink().withAlpha(0.75f));
        g.setColour(juce::Colour(0xff060403).withAlpha(0.75f)); g.fillRoundedRectangle(sc, 4.f); grid(g, sc, 8, 4, 0.07f);
        g.setColour(acc().withAlpha(0.22f)); g.drawHorizontalLine((int)sc.getCentreY(), sc.getX(), sc.getRight());
        double cyc = std::pow(2.0, rg) * std::pow(2.0, cents / 1200.0), ph0 = scroll * 0.5 + cents * 0.004 * ts * 8.0;
        juce::Path p; const int N = (int)sc.getWidth(); const float amp = (float)(sc.getHeight() * 0.5f - 4.f) * (float)lvl;
        for (int i = 0; i <= N; ++i) { double x = (double)i / N, y = mWave(wv, frac_(cyc * x * 0.5 + ph0 * (0.25 + 0.03 * cyc)));
          float px = sc.getX() + (float)x * sc.getWidth(), py = sc.getCentreY() - (float)y * amp; if (i == 0) p.startNewSubPath(px, py); else p.lineTo(px, py); }
        g.saveState(); g.reduceClipRegion(sc.toNearestInt()); glowStroke(g, p, glow(), 1.5f); g.restoreState();
      }
    }
    // --- mixer + overload
    {
      auto in = sub(g, mixR, "Mixer", acc()); auto bars = in.removeFromTop(112.f);
      const int ids[4] = {M::Vol1, M::Vol2, M::Vol3, M::VolNoise}; const char* nm[4] = {"1", "2", "3", "N"}; const float cw = bars.getWidth() / 4.f;
      for (int i = 0; i < 4; ++i) {
        Rect c(bars.getX() + i * cw, bars.getY(), cw, bars.getHeight()); double lv = pv(ids[i]);
        meterBar(g, c.reduced(cw * 0.22f, 0).withTrimmedBottom(16.f), lv, i == 3 ? ink() : acc(), true);
        if (play.held && lv > 0) { double a = envNow({pv(M::AAtt), pv(M::ADec), pv(M::ASus), pv(M::Release)}, true, play.tHeld, play.tRel, play.tHeldAtRel); g.setColour(glow().withAlpha((float)(0.25 * a))); g.fillRoundedRectangle(c.reduced(cw * 0.22f, 0).withTrimmedBottom(16.f), 3.f); }
        caption(g, nm[i], c.removeFromBottom(14.f), 11.f, ink().withAlpha(0.85f), juce::Justification::centred);
      }
      in.removeFromTop(4.f);
      double ov = pv(M::Overload), fd = pv(M::FilterDrive), drive = 1 + ov * 2.5 + fd * 9, gain = 0.5 + ov + fd * 1.5, sum = 0.5 * (pv(M::Vol1) + pv(M::Vol2) + pv(M::Vol3)) + 0.6 * pv(M::VolNoise);
      double hot = clampd_((sum * gain * drive - 1.0) / 4.0, 0, 1);
      auto lamp = in.removeFromBottom(18.f); auto crv = in.reduced(4.f, 0.f);
      g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(crv, 4.f); grid(g, crv, 4, 2, 0.07f);
      juce::Path p; for (int i = 0; i <= 60; ++i) { double x = (i / 60.0) * 2 - 1, y = std::tanh(x * drive * 0.9) / std::tanh(drive * 0.9);
        float px = crv.getX() + (float)(x * 0.5 + 0.5) * crv.getWidth(), py = crv.getCentreY() - (float)y * (crv.getHeight() * 0.5f - 3.f); if (i == 0) p.startNewSubPath(px, py); else p.lineTo(px, py); }
      glowStroke(g, p, Col(0xffff7a4a).interpolatedWith(acc(), 1.f - (float)hot), 1.5f);
      double lv = play.held ? envNow({pv(M::AAtt), pv(M::ADec), pv(M::ASus), pv(M::Release)}, true, play.tHeld, play.tRel, play.tHeldAtRel) : 0.0;
      double xin = clampd_(sum * gain * 0.6, 0, 1) * std::sin(ts * 5.1) * (0.35 + 0.65 * lv);
      { double y = std::tanh(xin * drive * 0.9) / std::tanh(drive * 0.9); g.setColour(juce::Colours::white); g.fillEllipse(crv.getX() + (float)(xin * 0.5 + 0.5) * crv.getWidth() - 2.5f, crv.getCentreY() - (float)y * (crv.getHeight() * 0.5f - 3.f) - 2.5f, 5.f, 5.f); }
      g.setColour(Col(0xffff5a30).withAlpha(0.15f + 0.85f * (float)hot)); g.fillEllipse(lamp.getX() + 6, lamp.getCentreY() - 5, 10, 10); g.setColour(ink().withAlpha(0.4f)); g.drawEllipse(lamp.getX() + 6, lamp.getCentreY() - 5, 10, 10, 1.f);
      caption(g, "OVERLOAD " + juce::String(ov, 2), lamp.withTrimmedLeft(22.f), 11.f, ink().withAlpha(0.85f));
    }
    // --- filter
    {
      auto top = fltR.removeFromTop(132.f); fltR.removeFromTop(gap); auto fin = sub(g, top, "Ladder filter - cutoff + contour", acc());
      auto info = fin.removeFromBottom(14.f); auto plot = fin; g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(plot, 4.f);
      const double fmin = 20, fmax = 20000, dbLo = -48, dbHi = 20;
      auto X = [&](double f) { return plot.getX() + (float)(std::log(f / fmin) / std::log(fmax / fmin)) * plot.getWidth(); };
      auto Y = [&](double db) { return plot.getBottom() - (float)((clampd_(db, dbLo, dbHi) - dbLo) / (dbHi - dbLo)) * plot.getHeight(); };
      for (double f : {100.0, 1000.0, 10000.0}) { g.setColour(acc().withAlpha(0.1f)); g.drawVerticalLine((int)X(f), plot.getY(), plot.getBottom()); }
      for (double d : {-36.0, -24.0, -12.0, 0.0}) { g.setColour(acc().withAlpha(d == 0 ? 0.2f : 0.07f)); g.drawHorizontalLine((int)Y(d), plot.getX(), plot.getRight()); }
      double cut = pv(M::Cutoff), con = pv(M::Contour), kbd = std::array<double, 4>{0, 0.333, 0.667, 1}[(size_t)clampd_(std::lround(pv(M::KbdTrack)), 0, 3)];
      double k = std::min(1.1, pv(M::Emphasis) * 1.08) * 4.05, vsc = 1 - pv(M::Velocity) + pv(M::Velocity) * (double)play.vel;
      occdisp::Env fe{pv(M::FAtt), pv(M::FDec), pv(M::FSus), pv(M::Release)}, ae{pv(M::AAtt), pv(M::ADec), pv(M::ASus), pv(M::Release)};
      double kt = kbd * ((play.held || play.tRel < 4 ? play.note : 60) - 60) / 12.0, fev = occdisp::envNow(fe, play.held, play.tHeld, play.tRel, play.tHeldAtRel);
      double base = cut * std::pow(2.0, kt), peak = cut * std::pow(2.0, con * 5 * (0.4 + 0.6 * vsc) + kt), live = cut * std::pow(2.0, con * 5 * fev * (0.4 + 0.6 * vsc) + kt);
      auto resp = [&](double fc, juce::Path& p, bool close) {
        for (int i = 0; i <= 160; ++i) { double f = fmin * std::pow(fmax / fmin, i / 160.0), w = f / std::min(fc, 18000.0);
          std::complex<double> s(0, w), d = (std::complex<double>(1, 0) + s); d = d * d * d * d + k; double mag = 1.0 / std::max(0.14, std::abs(d));
          float px = X(f), py = Y(20 * std::log10(mag)); if (i == 0) p.startNewSubPath(px, py); else p.lineTo(px, py); }
        if (close) { p.lineTo(plot.getRight(), plot.getBottom()); p.lineTo(plot.getX(), plot.getBottom()); p.closeSubPath(); } };
      g.saveState(); g.reduceClipRegion(plot.toNearestInt());
      { juce::Path p; resp(peak, p, false); g.setColour(glow().withAlpha(0.28f)); const float dash[2] = {3.f, 3.f}; juce::Path d; juce::PathStrokeType(1.f).createDashedStroke(d, p, dash, 2); g.fillPath(d); }
      { juce::Path p; resp(base, p, false); g.setColour(ink().withAlpha(0.3f)); g.strokePath(p, juce::PathStrokeType(1.f)); }
      { juce::Path f; resp(live, f, true); g.setColour(acc().withAlpha(0.18f)); g.fillPath(f); juce::Path p; resp(live, p, false); glowStroke(g, p, glow(), 1.8f); }
      g.setColour(glow().withAlpha(0.6f)); g.drawVerticalLine((int)X(std::min(live, 19000.0)), plot.getY(), plot.getBottom());
      g.restoreState();
      caption(g, "base " + juce::String((int)base) + " Hz   peak " + juce::String((int)std::min(peak, 99999.0)) + " Hz   now " + juce::String((int)std::min(live, 99999.0)) + " Hz   Q " + juce::String(pv(M::Emphasis), 2), info, 10.f, ink().withAlpha(0.8f));
      auto both = fltR; const float hw = (both.getWidth() - gap) / 2.f;
      auto l = sub(g, both.removeFromLeft(hw), "Filter contour", acc()); both.removeFromLeft(gap); auto r = sub(g, both, "Loudness", acc());
      auto ll = l.removeFromBottom(13.f), rl = r.removeFromBottom(13.f);
      drawEnv(g, l, fe, glow(), "A D S R"); drawEnv(g, r, ae, acc(), "A D S R");
      caption(g, secs(fe.a) + "  " + secs(fe.d) + "  " + juce::String(fe.s, 2), ll, 10.f, ink().withAlpha(0.75f)); caption(g, secs(ae.a) + "  " + secs(ae.d) + "  " + juce::String(ae.s, 2) + "  R " + secs(ae.r), rl, 10.f, ink().withAlpha(0.75f));
    }
  }

  // =====================================================================================================================================
  //  RHODICA: vibrating tine over the pickup with damper, bark waveform, suitcase tremolo / autopan
  // =====================================================================================================================================
  struct RhodesState { double keyScale, tauA, tauI, reg, gain, f; };
  RhodesState rhState() const {
    namespace R = occ::rhodica; RhodesState s; int n = play.note; s.keyScale = std::pow(2.0, -(n - 60) / 30.0); s.tauA = std::max(0.15, pv(R::Decay) * s.keyScale) / 6.9 * 2.2;
    s.tauI = std::max(0.08, 0.55 * s.keyScale); s.reg = 1.25 - (n - 36) / 90.0; double sens = pv(R::VelSens), vel = 1 - sens + sens * (double)play.vel; s.gain = std::pow(std::max(0.05, vel), 1.3);
    s.f = 440.0 * std::pow(2.0, (n - 69) / 12.0); return s;
  }
  double rhAmp(const RhodesState& s, double t) const { return 0.55 * std::exp(-t / (s.tauA * 0.18)) + 0.45 * std::exp(-t / s.tauA); }
  double rhLive(const RhodesState& s) const {   // current tine amplitude 0..1 (the damper is felt on release)
    namespace R = occ::rhodica; if (play.held) return rhAmp(s, play.tHeld);
    return rhAmp(s, play.tHeldAtRel) * std::exp(-play.tRel / (pv(R::Damper) * 0.25));
  }
  void paintRhodica(juce::Graphics& g, Rect b) {
    using namespace occdisp; namespace R = occ::rhodica; const float gap = 6.f;
    const float avail = b.getWidth() - 2 * gap; auto tineR = b.removeFromLeft(avail * 0.42f); b.removeFromLeft(gap); auto barkR = b.removeFromLeft(avail * 0.30f); b.removeFromLeft(gap); auto ampR = b;
    auto s = rhState(); const double amp = rhLive(s), vel = (double)play.vel, tone = pv(R::Tone), bark = pv(R::Bark), ping = pv(R::Ping);
    // --- tine and pickup
    {
      auto in = sub(g, tineR, "Tine - pickup - damper", acc()); auto scene = in.removeFromTop(122.f); auto curve = in.reduced(0.f, 2.f);
      g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(scene, 5.f);
      float x0 = scene.getX() + 34.f, y0 = scene.getCentreY() - 6.f, len = scene.getWidth() - 100.f;
      double fvis = 2.5 + 0.10 * clampd_(play.note - 36, 0, 60); tinePh += fvis / 30.0; double ph = std::sin(tinePh * kTwoPi);
      float A = (float)(amp * (0.45 + 0.55 * s.gain) * 30.0);
      // pickup: magnet pole, copper coil, field arcs
      float tipX = x0 + len; Rect coil(tipX - 26.f, y0 + 20.f, 52.f, 40.f);
      g.setColour(Col(0xff1c1210)); g.fillRoundedRectangle(coil, 5.f);
      for (int i = 0; i < 7; ++i) { g.setColour(Col(0xffb06a3c).withAlpha(0.8f)); g.drawLine(coil.getX() + 4, coil.getY() + 4 + i * 5.f, coil.getRight() - 4, coil.getY() + 4 + i * 5.f, 2.f); }
      g.setColour(Col(0xff9aa4a4)); g.fillRoundedRectangle(tipX - 5.f, y0 + 10.f, 10.f, 18.f, 2.f);
      for (int i = 1; i <= 3; ++i) { g.setColour(glow().withAlpha((0.05f + 0.35f * (float)amp) / (float)i)); g.drawEllipse(tipX - 10.f * i, y0 - 4.f - 3.f * i, 20.f * i, 34.f + 3.f * i, 1.f); }
      // tine (cantilever mode shape) and the tone bar at its base
      juce::Path t; const int N = 40; for (int i = 0; i <= N; ++i) { double u = (double)i / N, sh = u * u * (3 - u) * 0.5; float px = x0 + (float)u * len, py = y0 - (float)(sh * ph) * A; if (i == 0) t.startNewSubPath(px, py); else t.lineTo(px, py); }
      g.setColour(acc().withAlpha(0.12f)); { juce::Path ghost; for (int i = 0; i <= N; ++i) { double u = (double)i / N, sh = u * u * (3 - u) * 0.5; float px = x0 + (float)u * len, py = y0 - (float)(sh) * A; if (i == 0) ghost.startNewSubPath(px, py); else ghost.lineTo(px, py); }
        for (int i = N; i >= 0; --i) { double u = (double)i / N, sh = u * u * (3 - u) * 0.5; ghost.lineTo(x0 + (float)u * len, y0 + (float)sh * A); } ghost.closeSubPath(); g.fillPath(ghost); }
      glowStroke(g, t, glow(), 2.4f);
      g.setColour(Col(0xff55605f)); g.fillRoundedRectangle(x0 - 26.f, y0 - 14.f, 22.f, 28.f, 3.f); g.setColour(acc()); g.fillEllipse(x0 - 22.f, y0 - 8.f, 14.f, 14.f);   // base block + tone bar weight
      g.setColour(Col(0xffb0b8b8)); g.fillRect(x0 - 4.f, y0 - 3.f, 12.f, 6.f);
      // damper felt: rests on the tine when the key is up, lifts when a key is down
      float lift = play.held ? 1.f : (float)std::exp(-play.tRel / (pv(R::Damper) * 0.25 + 0.02)), dy = y0 - 6.f - 22.f * lift;   // lift decays to rest as the damper falls
      float dx = x0 + len * 0.55f; g.setColour(Col(0xffc9a56a).withAlpha(0.95f)); g.fillRoundedRectangle(dx - 11.f, dy - 14.f, 22.f, 14.f, 3.f); g.setColour(Col(0xff6b5a3a)); g.drawLine(dx, dy - 14.f, dx, scene.getY() + 4, 2.f);
      caption(g, play.held ? "key down - damper lifted" : "key up - damper on tine", scene.withHeight(14.f).translated(6, 2), 10.f, ink().withAlpha(0.65f));
      // decay curve with the playhead and the damper drop
      g.setColour(juce::Colours::black.withAlpha(0.35f)); g.fillRoundedRectangle(curve, 4.f); grid(g, curve, 6, 2, 0.06f);
      double T = std::max(0.5, s.tauA * 4.6), tr = play.tHeldAtRel; juce::Path p, fl; auto CX = [&](double t_) { return curve.getX() + 3.f + (float)clampd_(t_ / T, 0, 1) * (curve.getWidth() - 6.f); }; auto CY = [&](double v) { return curve.getBottom() - 3.f - (float)clampd_(v, 0, 1.05) * (curve.getHeight() - 18.f); };
      fl.startNewSubPath(CX(0), curve.getBottom() - 3.f); for (int i = 0; i <= 120; ++i) { double t_ = T * i / 120.0; auto q = juce::Point<float>(CX(t_), CY(rhAmp(s, t_))); if (i == 0) p.startNewSubPath(q); else p.lineTo(q); fl.lineTo(q); }
      fl.lineTo(CX(T), curve.getBottom() - 3.f); fl.closeSubPath(); g.setColour(acc().withAlpha(0.14f)); g.fillPath(fl); glowStroke(g, p, acc(), 1.4f);
      double nowT = play.held ? play.tHeld : tr + play.tRel; double nowV = amp;
      if (!play.held && play.tRel < 6) { g.setColour(Col(0xffff8a5a)); juce::Path dp; dp.startNewSubPath(CX(tr), CY(rhAmp(s, tr))); for (int i = 1; i <= 20; ++i) { double tt = pv(R::Damper) * 0.25 * 3.0 * i / 20.0; dp.lineTo(CX(tr + tt), CY(rhAmp(s, tr) * std::exp(-tt / (pv(R::Damper) * 0.25)))); } g.strokePath(dp, juce::PathStrokeType(1.6f)); }
      if (nowT < T) { g.setColour(glow().withAlpha(0.4f)); g.fillEllipse(CX(nowT) - 6, CY(nowV) - 6, 12, 12); g.setColour(juce::Colours::white); g.fillEllipse(CX(nowT) - 2.5f, CY(nowV) - 2.5f, 5.f, 5.f); }
      caption(g, "decay " + juce::String(pv(R::Decay), 1) + " s  (this key " + juce::String(s.tauA * 6.9 / 2.2, 1) + " s)   damper " + secs(pv(R::Damper)), curve.withHeight(14.f).translated(5, 1), 10.f, ink().withAlpha(0.75f));
    }
    // --- bark waveform
    {
      auto in = sub(g, barkR, "Pickup signal - bark", acc()); auto scope = in.removeFromTop(124.f); g.setColour(juce::Colour(0xff030808).withAlpha(0.8f)); g.fillRoundedRectangle(scope, 4.f); grid(g, scope, 8, 4, 0.07f);
      double tI = play.held ? play.tHeld : play.tHeldAtRel + play.tRel, drive = 1 + pv(R::Drive) * 5, idx0 = (0.35 + 2.6 * tone) * (0.25 + 0.75 * vel * vel) * s.reg * (0.45 + 0.9 * bark);
      double idxNow = idx0 * std::exp(-tI / s.tauI) + 0.12 * tone, idxHit = idx0 + 0.12 * tone;
      auto wave = [&](double idx, double pingAmt, double a, juce::Path& p) {
        for (int i = 0; i <= 200; ++i) { double u = (double)i / 200, phi = kTwoPi * (2.0 * u + 0.17 * ts * 0.5); double x = std::sin(phi + idx * std::sin(phi));
          x += ping * 0.32 * vel * pingAmt * std::sin(14 * phi); x = x + 0.35 * bark * vel * x * x;
          double y = std::tanh(x * a * drive * 0.9) / std::tanh(drive * 0.9);
          float px = scope.getX() + (float)u * scope.getWidth(), py = scope.getCentreY() - (float)clampd_(y, -1.2, 1.2) * (scope.getHeight() * 0.5f - 6.f); if (i == 0) p.startNewSubPath(px, py); else p.lineTo(px, py); } };
      g.saveState(); g.reduceClipRegion(scope.toNearestInt());
      { juce::Path p; wave(idxHit, 1.0, 0.7, p); g.setColour(ink().withAlpha(0.22f)); g.strokePath(p, juce::PathStrokeType(1.f)); }
      { juce::Path p; wave(idxNow, std::exp(-tI / 0.05), std::max(0.06, amp) * (0.5 + 0.5 * s.gain) * 1.4, p); glowStroke(g, p, glow(), 1.6f); }
      g.restoreState();
      caption(g, "strike (grey) vs now", scope.withHeight(14.f).translated(5, 1), 10.f, ink().withAlpha(0.6f));
      in.removeFromTop(6.f); const char* nm[3] = {"FM index", "Bark", "Ping"}; const double vals[3] = {clampd_(idxNow / 3.2, 0, 1), bark, ping}; const juce::String txt[3] = {juce::String(idxNow, 2), juce::String(bark, 2), juce::String(ping, 2)};
      for (int i = 0; i < 3; ++i) { Rect row = in.removeFromTop(16.f); caption(g, nm[i], row.removeFromLeft(58.f), 11.f, ink().withAlpha(0.85f)); caption(g, txt[i], row.removeFromRight(34.f), 11.f, glow(), juce::Justification::centredRight); meterBar(g, row.reduced(2.f, 3.f), vals[i], i == 0 ? glow() : acc(), false); }
    }
    // --- suitcase amp: tremolo / autopan
    {
      auto in = sub(g, ampR, "Suitcase amp", acc()); int mode = (int)std::lround(pv(R::TremMode)); double rate = pv(R::TremRate), depth = pv(R::TremDepth), chorus = pv(R::Chorus_);
      auto gains = [&](double t_, double& gl, double& gr) { double lf = std::sin(kTwoPi * rate * t_); gl = gr = 1; if (mode == 1) gl = gr = 1 - depth * 0.5 * (1 + lf); else if (mode == 2) { gl = 1 - depth * 0.5 * (1 + lf); gr = 1 - depth * 0.5 * (1 - lf); } };
      double gl, gr; gains(ts, gl, gr); auto spk = in.removeFromTop(104.f); g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(spk, 5.f);
      for (int c = 0; c < 2; ++c) {
        float cx = spk.getX() + spk.getWidth() * (c == 0 ? 0.26f : 0.74f), cy = spk.getCentreY() + 2.f; double gn = c == 0 ? gl : gr, rad = 32.0;
        g.setColour(Col(0xff1b1514)); g.fillRoundedRectangle(cx - 38.f, cy - 40.f, 76.f, 80.f, 7.f);
        for (int i = 0; i < 3; ++i) { g.setColour(glow().withAlpha((float)(gn * (0.55 - 0.15 * i)))); g.drawEllipse(cx - (float)rad + 7.f * i, cy - (float)rad + 7.f * i, (float)(2 * rad - 14 * i), (float)(2 * rad - 14 * i), 1.6f); }
        float cone = 7.f + (float)gn * 4.f * (0.4f + levelSm * 3.f); g.setColour(acc().withAlpha(0.25f + 0.7f * (float)gn)); g.fillEllipse(cx - cone, cy - cone, cone * 2, cone * 2);
        if (chorus > 0.01) { g.setColour(glow().withAlpha((float)chorus * 0.5f)); float o = (float)(chorus * 4.0 * std::sin(ts * 1.7 + c)); g.drawEllipse(cx - 36.f + o, cy - 36.f - o, 72.f, 72.f, 1.f); }
        caption(g, c == 0 ? "L" : "R", Rect(cx - 8.f, spk.getY() + 2.f, 16.f, 12.f), 10.f, ink().withAlpha(0.6f), juce::Justification::centred);
      }
      in.removeFromTop(6.f); auto lfo = in.removeFromTop(in.getHeight() - 30.f); g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(lfo, 4.f); grid(g, lfo, 6, 2, 0.06f);
      const double win = 1.6; juce::Path pl, pr; for (int i = 0; i <= 120; ++i) { double t_ = ts - win + win * i / 120.0, a, c; gains(t_, a, c); float px = lfo.getX() + (float)i / 120.f * lfo.getWidth();
        float ya = lfo.getBottom() - 3.f - (float)a * (lfo.getHeight() - 8.f), yc = lfo.getBottom() - 3.f - (float)c * (lfo.getHeight() - 8.f); if (i == 0) { pl.startNewSubPath(px, ya); pr.startNewSubPath(px, yc); } else { pl.lineTo(px, ya); pr.lineTo(px, yc); } }
      glowStroke(g, pl, acc(), 1.4f); if (mode == 2) glowStroke(g, pr, glow(), 1.4f);
      g.setColour(juce::Colours::white); g.fillRect(lfo.getRight() - 2.f, lfo.getY(), 2.f, lfo.getHeight());
      caption(g, juce::String(std::array<const char*, 3>{"Off", "Tremolo", "Autopan"}[(size_t)clampd_(mode, 0, 2)]) + "  " + juce::String(rate, 1) + " Hz  depth " + juce::String(depth, 2), in.removeFromTop(14.f).translated(0, 3.f), 11.f, ink().withAlpha(0.85f));
      caption(g, "chorus " + juce::String(chorus, 2) + "   drive " + juce::String(pv(R::Drive), 2), in.removeFromTop(14.f).translated(0, 3.f), 11.f, ink().withAlpha(0.65f));
    }
  }

  // =====================================================================================================================================
  //  FANTICA: LCD patch list, filter + envelopes from the macros, unison stereo field with Width / Ensemble
  // =====================================================================================================================================
  struct FPatch { int idx; double uni, uniDet, spread, ftype, cut, res, envAmt, kt, chorus; occdisp::Env ae, fe; };
  FPatch faPatch() const {
    namespace F = occ::fantica; FPatch p; p.idx = (int)occdisp::clampd_(std::floor(pv(F::Patch) + 0.5), 0, F::kPatches - 1); const double* q = F::T[p.idx].q;
    p.uni = q[6]; p.uniDet = q[7] * 2 * pv(F::Width); p.spread = std::min(1.0, 1.4 * pv(F::Width)); p.ftype = q[8]; p.cut = q[9] * std::pow(2.0, (pv(F::Cutoff) - 0.5) * 6);
    p.res = occdisp::clampd_(q[10] + (pv(F::Resonance) - 0.5) * 0.9, 0, 1); p.envAmt = q[11]; p.kt = q[12];
    double ak = std::pow(4.0, (pv(F::Attack) - 0.5) * 2), rk = std::pow(4.0, (pv(F::Release) - 0.5) * 2), r = q[16] * rk;
    p.ae = {q[13] * ak, q[14], q[15], r}; p.fe = {0.001, q[17], q[18], r}; p.chorus = occdisp::clampd_(q[23] + (pv(F::Ensemble) - 0.5), 0, 1); return p;
  }
  void paintFantica(juce::Graphics& g, Rect b) {
    using namespace occdisp; namespace F = occ::fantica; const float gap = 6.f; auto p = faPatch(); const auto& names = proc.info.specs[0].labels;
    auto lcdR = b.removeFromLeft(268.f); b.removeFromLeft(gap); auto fltR = b.removeFromLeft(424.f); b.removeFromLeft(gap); auto uniR = b;
    // --- LCD patch list
    {
      Col lcd = acc(); auto in = sub(g, lcdR, "Patch", lcd, true);
      g.setColour(Col(0xff12040f)); g.fillRoundedRectangle(in, 4.f);
      if (lcdPos < 0) lcdPos = p.idx; lcdPos += (p.idx - lcdPos) * 0.35; if (std::fabs(p.idx - lcdPos) < 0.01) lcdPos = p.idx;
      const float rh = 19.f; const int rows = (int)((in.getHeight() - 34.f) / rh); auto list = in.withTrimmedBottom(32.f).reduced(0.f, 2.f);
      g.saveState(); g.reduceClipRegion(list.toNearestInt());
      for (int i = -rows / 2 - 1; i <= rows / 2 + 1; ++i) {
        int pi = (int)std::lround(lcdPos) + i; if (pi < 0 || pi >= (int)names.size()) continue; float y = list.getCentreY() + ((float)(pi - lcdPos)) * rh - rh * 0.5f; Rect row(list.getX(), y, list.getWidth(), rh);
        bool cur = pi == p.idx; float fade = 1.f - std::min(1.f, std::fabs((float)(pi - lcdPos)) / ((float)rows / 2 + 1.f)) * 0.75f;
        if (cur) { g.setColour(lcd.withAlpha(0.92f)); g.fillRect(row.reduced(1.f, 0.f)); }
        mono(g, juce::String::formatted("%02d", pi + 1) + (cur ? " >" : "  ") + juce::String(names[(size_t)pi]), row.withTrimmedLeft(6.f), 12.f, cur ? Col(0xff1a0415) : lcd.withAlpha(0.8f * fade));
      }
      g.restoreState();
      g.setColour(Col(0xff000000).withAlpha(0.22f)); for (float y = in.getY(); y < in.getBottom(); y += 2.f) g.drawHorizontalLine((int)y, in.getX(), in.getRight());
      auto foot = in.removeFromBottom(30.f).withTrimmedTop(2.f); const char* ft[5] = {"LP12", "LP24", "HP", "BP", "OFF"};
      mono(g, juce::String::formatted("%02d/%02d", p.idx + 1, F::kPatches) + "  UNI x" + juce::String((int)p.uni) + "  " + ft[(int)clampd_(p.ftype, 0, 4)], foot, 11.f, lcd.withAlpha(0.9f));
      mono(g, juce::String("WT ") + juce::String((int)F::T[p.idx].q[0]) + "+" + juce::String((int)F::T[p.idx].q[1]) + (play.held ? "   NOTE " + juce::String(play.note) : ""), foot.translated(0, 13.f), 10.f, lcd.withAlpha(0.6f));
    }
    // --- filter + envelopes
    {
      auto top = fltR.removeFromTop(138.f); fltR.removeFromTop(gap); auto fin = sub(g, top, "Filter - from the macros", acc()); auto info = fin.removeFromBottom(14.f); auto plot = fin;
      g.setColour(Col(0xff12040f).withAlpha(0.9f)); g.fillRoundedRectangle(plot, 4.f); grid(g, plot, 10, 4, 0.1f);
      const double fmin = 20, fmax = 20000, dbLo = -48, dbHi = 24; auto X = [&](double f) { return plot.getX() + (float)(std::log(f / fmin) / std::log(fmax / fmin)) * plot.getWidth(); };
      auto Y = [&](double db) { return plot.getBottom() - (float)((clampd_(db, dbLo, dbHi) - dbLo) / (dbHi - dbLo)) * plot.getHeight(); };
      double fev = envNow(p.fe, play.held, play.tHeld, play.tRel, play.tHeldAtRel), nn = (play.held || play.tRel < 4) ? play.note : 60;
      double base = p.cut * std::pow(2.0, p.kt * (nn - 60) / 12.0), live = p.cut * std::pow(2.0, p.envAmt * 5 * fev + p.kt * (nn - 60) / 12.0), q = 0.55 + p.res * 8, k = 1.0 / std::max(0.4, q);
      auto resp = [&](double fc, juce::Path& pa, bool close) {
        for (int i = 0; i <= 160; ++i) { double f = fmin * std::pow(fmax / fmin, i / 160.0), w = f / std::min(fc, 18000.0); std::complex<double> den(1 - w * w, w * k), lp = 1.0 / den, h; int ft = (int)p.ftype;
          if (ft == 0) h = lp; else if (ft == 1) h = lp * lp; else if (ft == 2) h = -w * w * lp; else if (ft == 3) h = std::complex<double>(0, w) * lp * (0.8 + p.res); else h = 1.0;
          float px = X(f), py = Y(20 * std::log10(std::max(1e-5, std::abs(h)))); if (i == 0) pa.startNewSubPath(px, py); else pa.lineTo(px, py); }
        if (close) { pa.lineTo(plot.getRight(), plot.getBottom()); pa.lineTo(plot.getX(), plot.getBottom()); pa.closeSubPath(); } };
      g.saveState(); g.reduceClipRegion(plot.toNearestInt());
      { juce::Path pa; resp(base, pa, false); g.setColour(ink().withAlpha(0.3f)); g.strokePath(pa, juce::PathStrokeType(1.f)); }
      { juce::Path f; resp(live, f, true); g.setColour(acc().withAlpha(0.2f)); g.fillPath(f); juce::Path pa; resp(live, pa, false); glowStroke(g, pa, glow(), 1.8f); }
      if (p.ftype < 4) { g.setColour(glow().withAlpha(0.6f)); g.drawVerticalLine((int)X(std::min(live, 19000.0)), plot.getY(), plot.getBottom()); }
      g.restoreState();
      caption(g, juce::String(p.ftype > 3.5 ? "filter bypassed in this patch" : "cutoff " + juce::String((int)base) + " Hz -> " + juce::String((int)std::min(live, 99999.0)) + " Hz   res " + juce::String(p.res, 2)), info, 10.f, ink().withAlpha(0.8f));
      auto both = fltR; const float hw = (both.getWidth() - gap) / 2.f; auto l = sub(g, both.removeFromLeft(hw), "Amp envelope", acc()); both.removeFromLeft(gap); auto r = sub(g, both, "Filter envelope", acc());
      auto ll = l.removeFromBottom(13.f), rl = r.removeFromBottom(13.f); drawEnv(g, l, p.ae, acc(), "A D S R"); drawEnv(g, r, p.fe, glow(), "D S R");
      caption(g, "A " + secs(p.ae.a) + "  D " + secs(p.ae.d) + "  S " + juce::String(p.ae.s, 2) + "  R " + secs(p.ae.r), ll, 10.f, ink().withAlpha(0.75f)); caption(g, "D " + secs(p.fe.d) + "  S " + juce::String(p.fe.s, 2) + "  amt " + juce::String(p.envAmt, 2), rl, 10.f, ink().withAlpha(0.75f));
    }
    // --- unison stereo field + ensemble
    {
      auto top = uniR.removeFromTop(150.f); uniR.removeFromTop(gap); auto in = sub(g, top, "Unison field - width", acc()); auto cap = in.removeFromBottom(14.f);
      g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(in, 4.f); float cx = in.getCentreX(), cy = in.getCentreY();
      g.setColour(acc().withAlpha(0.14f)); g.drawLine(in.getX() + 6, cy, in.getRight() - 6, cy, 1.f); g.drawLine(cx, in.getY() + 4, cx, in.getBottom() - 4, 1.f);
      caption(g, "L", Rect(in.getX() + 3, in.getY() + 2, 14, 12), 10.f, ink().withAlpha(0.55f)); caption(g, "R", Rect(in.getRight() - 17, in.getY() + 2, 14, 12), 10.f, ink().withAlpha(0.55f));
      caption(g, "+cents", Rect(in.getX() + 3, in.getBottom() - 14, 44, 12), 9.f, ink().withAlpha(0.4f));
      const int U = (int)std::lround(clampd_(p.uni, 1, 7)); const float halfW = in.getWidth() * 0.5f - 14.f, halfH = in.getHeight() * 0.5f - 10.f;
      if (U > 1) { Rect field(cx - (float)p.spread * halfW - 6.f, cy - (float)std::min(1.0, p.uniDet / 52.0) * halfH - 6.f, (float)p.spread * halfW * 2 + 12.f, (float)std::min(1.0, p.uniDet / 52.0) * halfH * 2 + 12.f);
        g.setColour(acc().withAlpha(0.1f)); g.fillRoundedRectangle(field, 8.f); g.setColour(acc().withAlpha(0.35f)); g.drawRoundedRectangle(field, 8.f, 1.f); }
      for (int u = 0; u < U; ++u) {
        double pos = U > 1 ? ((double)u / (U - 1)) * 2 - 1 : 0, sp = pos * p.spread, cents = pos * p.uniDet; float px = cx + (float)sp * halfW, py = cy - (float)(cents / 52.0) * halfH;
        double beat = 0.5 + 0.5 * std::sin(ts * (1.5 + std::fabs(cents) * 0.5) + u); float r_ = 4.f + 3.f * (float)beat * (0.4f + 0.6f * levelSm * 3.f + (play.held ? 0.6f : 0.f));
        g.setColour(glow().withAlpha(0.18f)); g.fillEllipse(px - r_ * 1.8f, py - r_ * 1.8f, r_ * 3.6f, r_ * 3.6f); g.setColour(acc().withAlpha(0.95f)); g.fillEllipse(px - r_, py - r_, r_ * 2, r_ * 2);
        double pl = std::sqrt(0.5 * (1 - sp)), pr = std::sqrt(0.5 * (1 + sp)); g.setColour(ink().withAlpha(0.35f)); g.drawLine(px, py + r_ + 1, px, py + r_ + 1 + 8.f * (float)(pl - pr), 1.2f);
      }
      caption(g, U > 1 ? juce::String(U) + " voices   width " + juce::String(pv(F::Width), 2) + "   +/-" + juce::String(p.uniDet, 0) + " c   spread " + juce::String((int)std::lround(p.spread * 100)) + "%" : "single voice (no unison)  width " + juce::String(pv(F::Width), 2), cap, 10.f, ink().withAlpha(0.8f));
      auto in2 = sub(g, uniR, "Ensemble", acc()); auto cap2 = in2.removeFromBottom(14.f); g.setColour(juce::Colours::black.withAlpha(0.4f)); g.fillRoundedRectangle(in2, 4.f);
      for (int c = 0; c < 3; ++c) {
        juce::Path pa; double sep = c == 0 ? 0 : (c == 1 ? -1 : 1) * p.chorus * (7.0 + 5.0 * std::sin(ts * 0.9 + c)), ph = kTwoPi * 0.0;
        for (int i = 0; i <= 120; ++i) { double u = (double)i / 120; double y = std::sin(kTwoPi * (2.2 * u - ts * 0.35 - (c == 0 ? 0 : (c == 1 ? -1 : 1) * 0.06 * p.chorus * std::sin(ts * 1.3 + c))) + ph);
          float px = in2.getX() + 4.f + (float)u * (in2.getWidth() - 8.f), py = in2.getCentreY() + (float)sep + (float)y * (in2.getHeight() * 0.28f); if (i == 0) pa.startNewSubPath(px, py); else pa.lineTo(px, py); }
        if (c == 0) glowStroke(g, pa, acc(), 1.5f); else { g.setColour(glow().withAlpha(0.15f + 0.6f * (float)p.chorus)); g.strokePath(pa, juce::PathStrokeType(1.2f)); }
      }
      caption(g, "ensemble " + juce::String(pv(F::Ensemble), 2) + " -> chorus " + juce::String(p.chorus, 2) + "   vib " + juce::String(pv(F::Vibrato), 2), cap2, 10.f, ink().withAlpha(0.8f));
    }
  }
};
