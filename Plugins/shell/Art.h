// Procedural header artwork, one motif per instrument. Everything is drawn with paths, so it scales and needs no image files.
#pragma once
#include <juce_gui_basics/juce_gui_basics.h>
#include "../common/engine.h"
namespace occart {
using juce::Colour; using juce::Graphics; using juce::Path; using juce::Rectangle;
inline Colour C(unsigned argb) { return Colour(argb); }
inline void woodGrain(Graphics& g, Rectangle<float> r, Colour base, int seed) {
  juce::ColourGradient gr(base.brighter(0.15f), r.getX(), r.getY(), base.darker(0.5f), r.getRight(), r.getBottom(), false); g.setGradientFill(gr); g.fillRoundedRectangle(r, 6.f);
  juce::Random rnd(seed); g.setColour(base.darker(0.7f).withAlpha(0.35f));
  for (int i = 0; i < 26; ++i) { float y = r.getY() + rnd.nextFloat() * r.getHeight(), w = 0.5f + rnd.nextFloat() * 1.4f; Path p; p.startNewSubPath(r.getX(), y);
    for (float x = r.getX(); x <= r.getRight(); x += 8.f) p.lineTo(x, y + std::sin(x * 0.03f + i) * 2.5f); g.strokePath(p, juce::PathStrokeType(w)); }
}
// scrolling oscilloscope-like trace of a wave shape: 0 saw, 1 square, 2 triangle
inline void trace(Graphics& g, Rectangle<float> r, int shape, float t, Colour col, float amp) {
  Path p; const int N = 160; for (int i = 0; i <= N; ++i) {
    float x = r.getX() + r.getWidth() * i / N, ph = std::fmod(i / 40.f - t * 0.5f + 8.f, 1.f), y;
    if (shape == 0) y = 2 * ph - 1; else if (shape == 1) y = ph < 0.5f ? 1.f : -1.f; else y = 4 * std::fabs(ph - 0.5f) - 1;
    y = r.getCentreY() - y * r.getHeight() * 0.38f * amp; if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
  g.setColour(col.withAlpha(0.18f)); g.strokePath(p, juce::PathStrokeType(7.f)); g.setColour(col.withAlpha(0.45f)); g.strokePath(p, juce::PathStrokeType(3.5f)); g.setColour(col.brighter(0.4f)); g.strokePath(p, juce::PathStrokeType(1.4f));
}
inline void drawMinica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  auto wood = r.removeFromLeft(r.getWidth() * 0.16f).reduced(0, 4); woodGrain(g, wood, C(0xff6b3f1d), 7);
  auto wood2 = r.removeFromRight(r.getWidth() * 0.12f).reduced(0, 4); woodGrain(g, wood2, C(0xff6b3f1d), 11);
  g.setColour(C(0xff120a05)); g.fillRoundedRectangle(r.reduced(4, 4), 5.f); g.setColour(C(th.accent).withAlpha(0.35f)); g.drawRoundedRectangle(r.reduced(4, 4), 5.f, 1.2f);
  auto scope = r.reduced(14, 10).removeFromLeft(r.getWidth() * 0.62f);
  g.setColour(C(th.accent).withAlpha(0.08f)); for (int i = 1; i < 6; ++i) g.drawHorizontalLine((int)(scope.getY() + scope.getHeight() * i / 6), scope.getX(), scope.getRight());
  float a = 0.55f + std::min(0.45f, level * 2.f);
  trace(g, scope, 0, t, C(0xffffb347), a); trace(g, scope.translated(0, 4), 1, t * 1.01f, C(0xffff7a3d), a * 0.8f); trace(g, scope.translated(0, -4), 2, t * 0.99f, C(0xffffe08a), a * 0.8f);
  // VU meter
  auto vu = r.reduced(14, 10).removeFromRight(r.getWidth() * 0.28f); g.setColour(C(0xfff0dfb6)); g.fillRoundedRectangle(vu, 4.f);
  g.setColour(C(0xff3a2a14)); Path arc; arc.addCentredArc(vu.getCentreX(), vu.getBottom() - 4, vu.getWidth() * 0.42f, vu.getHeight() * 0.8f, 0, -0.9f, 0.9f, true); g.strokePath(arc, juce::PathStrokeType(1.2f));
  float ang = -0.85f + std::min(1.f, std::pow(level, 0.5f) * 1.2f) * 1.7f; Path nd; nd.startNewSubPath(vu.getCentreX(), vu.getBottom() - 4); nd.lineTo(vu.getCentreX() + std::sin(ang) * vu.getHeight() * 0.75f, vu.getBottom() - 4 - std::cos(ang) * vu.getHeight() * 0.75f);
  g.setColour(C(0xffb3201a)); g.strokePath(nd, juce::PathStrokeType(1.6f));
}
inline void drawRhodica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setColour(C(0xff0a1214)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f); g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  auto a = r.reduced(24, 12); const int N = 30; float bar = a.getY() + 6;
  g.setColour(C(0xffb8c4c6)); g.fillRoundedRectangle(a.getX() - 6, bar - 3, a.getWidth() + 12, 6, 3.f);   // tone bar
  for (int i = 0; i < N; ++i) {
    float x = a.getX() + a.getWidth() * (i + 0.5f) / N, len = a.getHeight() * (0.95f - 0.62f * i / N), wob = std::sin(t * (7.f + i * 0.9f) + i) * (1.5f + level * 26.f) * (1.f - 0.5f * i / N);
    Path p; p.startNewSubPath(x, bar); p.quadraticTo(x + wob * 0.3f, bar + len * 0.5f, x + wob, bar + len);
    g.setColour(C(th.accent).withAlpha(0.14f)); g.strokePath(p, juce::PathStrokeType(6.f)); g.setColour(C(0xffdfe9ea)); g.strokePath(p, juce::PathStrokeType(1.8f));
    g.setColour(C(th.accent).brighter(0.2f)); g.fillEllipse(x + wob - 3.f, bar + len - 3.f, 6.f, 6.f);
  }
}
inline void drawWraithica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff241a45), r.getCentreX(), r.getBottom(), C(0xff07050f), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // moon
  g.setColour(C(0xffeee8ff).withAlpha(0.10f)); g.fillEllipse(r.getRight() - 90, r.getY() + 8, 62, 62); g.setColour(C(0xffeee8ff).withAlpha(0.22f)); g.fillEllipse(r.getRight() - 84, r.getY() + 14, 50, 50);
  // theremin: vertical pitch antenna on the right, loop antenna on the left, wooden cabinet below
  float base = r.getBottom() - 14; auto cab = Rectangle<float>(r.getX() + r.getWidth() * 0.18f, base - 16, r.getWidth() * 0.5f, 16);
  g.setColour(C(0xff3a2a22)); g.fillRoundedRectangle(cab, 3.f); g.setColour(C(0xff6a5040)); g.drawRoundedRectangle(cab, 3.f, 1.f);
  float ax = cab.getRight() - 14; g.setColour(C(0xffc9c9d6)); g.drawLine(ax, cab.getY(), ax, r.getY() + 14, 2.2f); g.setColour(C(th.glow).withAlpha(0.5f)); g.fillEllipse(ax - 4, r.getY() + 10, 8, 8);
  Path loop; loop.addCentredArc(cab.getX() + 18, cab.getY() - 18, 14, 18, 0, 0, juce::MathConstants<float>::twoPi, true); g.setColour(C(0xffc9c9d6)); g.strokePath(loop, juce::PathStrokeType(2.2f));
  g.drawLine(cab.getX() + 18, cab.getY() - 0.5f, cab.getX() + 18, cab.getY(), 2.2f);
  // ghost wisps: ribbons that swell with the sound
  for (int k = 0; k < 4; ++k) {
    Path p; float amp = 5.f + level * 70.f + k * 3.f; for (int i = 0; i <= 120; ++i) { float u = i / 120.f, x = r.getX() + 20 + (r.getWidth() - 40) * u, y = r.getCentreY() - 8 + std::sin(u * 7.f + t * (1.1f + k * 0.4f) + k * 1.7f) * amp * (0.35f + 0.65f * std::sin(u * 3.14159f)); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.accent).withAlpha(0.10f)); g.strokePath(p, juce::PathStrokeType(9.f - k)); g.setColour(C(th.glow).withAlpha(0.55f / (1 + k * 0.5f))); g.strokePath(p, juce::PathStrokeType(1.5f));
  }
  juce::Random rnd(5); for (int i = 0; i < 18; ++i) { float x = r.getX() + rnd.nextFloat() * r.getWidth(), y = r.getY() + std::fmod(rnd.nextFloat() * r.getHeight() - t * (6 + i), r.getHeight()); if (y < r.getY()) y += r.getHeight();
    g.setColour(C(th.glow).withAlpha(0.15f + 0.4f * rnd.nextFloat())); g.fillEllipse(x, y, 2.5f, 2.5f); }
}
inline void drawGeneric(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setColour(C(0xff000000).withAlpha(0.35f)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  for (int k = 0; k < 3; ++k) { Path p; for (int i = 0; i <= 200; ++i) { float x = r.getX() + 10 + (r.getWidth() - 20) * i / 200.f, y = r.getCentreY() + std::sin(i * 0.12f * (k + 1) + t * (2 + k)) * r.getHeight() * 0.28f * (0.3f + level * 2.f) / (k + 1); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.accent).withAlpha(0.7f / (k + 1))); g.strokePath(p, juce::PathStrokeType(1.6f)); }
}
inline void drawMotif(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  if (th.motif == "minica") drawMinica(g, r, th, level, t); else if (th.motif == "rhodica") drawRhodica(g, r, th, level, t); else if (th.motif == "wraithica") drawWraithica(g, r, th, level, t); else drawGeneric(g, r, th, level, t);
}
}  // namespace occart
