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
inline void drawAdditica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff10303f), r.getCentreX(), r.getBottom(), C(0xff03080d), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  const int N = 32; float base = r.getBottom() - 12, bw = (r.getWidth() - 40) / N;
  for (int i = 0; i < N; ++i) { float h = (r.getHeight() - 30) * (1.f / (1 + i * 0.35f)) * (0.55f + 0.45f * std::sin(t * (1.3f + i * 0.17f) + i)) * (0.5f + level * 1.6f); h = std::min(h, r.getHeight() - 26);
    auto b = Rectangle<float>(r.getX() + 20 + i * bw + 1, base - h, bw - 2, h); g.setColour(C(th.accent).withAlpha(0.18f)); g.fillRect(b.expanded(2, 2));
    g.setGradientFill(juce::ColourGradient(C(th.glow), b.getX(), b.getY(), C(th.accent).darker(0.6f), b.getX(), b.getBottom(), false)); g.fillRect(b); }
  Path sum; for (int i = 0; i <= 160; ++i) { float u = i / 160.f, y = r.getCentreY() - 6; for (int k = 1; k <= 5; ++k) y += std::sin(u * 6.28f * k * 2 + t * 2) / k * (6.f + level * 24.f); float x = r.getX() + 20 + (r.getWidth() - 40) * u; if (i == 0) sum.startNewSubPath(x, y); else sum.lineTo(x, y); }
  g.setColour(C(0xffffffff).withAlpha(0.8f)); g.strokePath(sum, juce::PathStrokeType(1.4f));
}
inline void drawGrainica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff233318), r.getCentreX(), r.getBottom(), C(0xff070b04), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // a sample waveform strip with a scanning playhead; grains scatter around it
  Path w; float cy = r.getBottom() - 26; for (int i = 0; i <= 200; ++i) { float u = i / 200.f, a = 9.f * std::sin(u * 37.f) * std::sin(u * 5.f + 1.f) + 5.f * std::sin(u * 91.f); float x = r.getX() + 14 + (r.getWidth() - 28) * u; if (i == 0) w.startNewSubPath(x, cy + a); else w.lineTo(x, cy + a); }
  g.setColour(C(th.ink).withAlpha(0.55f)); g.strokePath(w, juce::PathStrokeType(1.3f));
  float head = r.getX() + 14 + (r.getWidth() - 28) * std::fmod(t * 0.12f, 1.f); g.setColour(C(th.glow)); g.drawLine(head, cy - 16, head, cy + 16, 1.6f);
  juce::Random rnd(11); int n = 46; for (int i = 0; i < n; ++i) { float ph = std::fmod(t * (0.35f + rnd.nextFloat() * 0.5f) + rnd.nextFloat(), 1.f); float x = head + (rnd.nextFloat() - 0.5f) * (60.f + level * 220.f), y = cy - 14 - ph * (r.getHeight() - 50); float sz = 3.f + rnd.nextFloat() * 9.f * (1.f - ph);
    g.setColour(C(th.accent).withAlpha((1.f - ph) * 0.6f)); g.fillEllipse(x - sz * 0.5f, y - sz * 0.5f, sz, sz); g.setColour(C(th.glow).withAlpha((1.f - ph) * 0.8f)); g.drawEllipse(x - sz * 0.5f, y - sz * 0.5f, sz, sz, 0.8f); }
}
inline void drawFantica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3a1a37), r.getCentreX(), r.getBottom(), C(0xff0a040a), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // rack-style stack of wavetable scopes above a row of pads
  for (int k = 0; k < 4; ++k) { auto sc = Rectangle<float>(r.getX() + 16 + k * (r.getWidth() - 32) / 4.f, r.getY() + 10, (r.getWidth() - 32) / 4.f - 8, r.getHeight() * 0.5f);
    g.setColour(C(0xff000000).withAlpha(0.5f)); g.fillRoundedRectangle(sc, 4.f); Path p; for (int i = 0; i <= 80; ++i) { float u = i / 80.f, y = sc.getCentreY(); for (int h = 1; h <= 3 + k * 2; ++h) y += std::sin(u * 6.28f * h + t * (1 + k * 0.3f)) / h * sc.getHeight() * 0.25f * (0.4f + level * 2.f); float x = sc.getX() + 4 + (sc.getWidth() - 8) * u; if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.accent).withAlpha(0.85f)); g.strokePath(p, juce::PathStrokeType(1.3f)); }
  for (int i = 0; i < 8; ++i) { auto pad = Rectangle<float>(r.getX() + 16 + i * (r.getWidth() - 32) / 8.f, r.getBottom() - 36, (r.getWidth() - 32) / 8.f - 6, 22); float on = 0.25f + 0.6f * std::max(0.f, std::sin(t * 2.f - i * 0.8f)) * (0.3f + level * 2.f);
    g.setColour(C(th.accent).withAlpha(std::min(1.f, on))); g.fillRoundedRectangle(pad, 4.f); g.setColour(C(th.glow).withAlpha(0.5f)); g.drawRoundedRectangle(pad, 4.f, 1.f); }
}
inline void drawGeneric(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setColour(C(0xff000000).withAlpha(0.35f)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  for (int k = 0; k < 3; ++k) { Path p; for (int i = 0; i <= 200; ++i) { float x = r.getX() + 10 + (r.getWidth() - 20) * i / 200.f, y = r.getCentreY() + std::sin(i * 0.12f * (k + 1) + t * (2 + k)) * r.getHeight() * 0.28f * (0.3f + level * 2.f) / (k + 1); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.accent).withAlpha(0.7f / (k + 1))); g.strokePath(p, juce::PathStrokeType(1.6f)); }
}
inline void drawMotif(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  if (th.motif == "minica") drawMinica(g, r, th, level, t); else if (th.motif == "rhodica") drawRhodica(g, r, th, level, t); else if (th.motif == "wraithica") drawWraithica(g, r, th, level, t); else if (th.motif == "additica") drawAdditica(g, r, th, level, t); else if (th.motif == "grainica") drawGrainica(g, r, th, level, t); else if (th.motif == "fantica") drawFantica(g, r, th, level, t); else drawGeneric(g, r, th, level, t);
}
}  // namespace occart
