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
inline void drawVoxica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d2040), r.getCentreX(), r.getBottom(), C(0xff0c060d), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // a singing mouth: the opening follows the level, with formant peaks drifting across a spectrum envelope behind it
  float cx = r.getCentreX(), cy = r.getCentreY(); Path env; for (int i = 0; i <= 200; ++i) { float u = i / 200.f, y = 0;
    for (int k = 0; k < 4; ++k) { float c = 0.12f + 0.2f * k + 0.04f * std::sin(t * (0.7f + k * 0.3f) + k), d = (u - c) / 0.05f; y += std::exp(-d * d) * (1.f - 0.18f * k); }
    float x = r.getX() + 14 + (r.getWidth() - 28) * u, yy = r.getBottom() - 14 - y * (r.getHeight() * 0.35f) * (0.5f + level * 2.f); if (i == 0) env.startNewSubPath(x, yy); else env.lineTo(x, yy); }
  g.setColour(C(th.glow).withAlpha(0.7f)); g.strokePath(env, juce::PathStrokeType(1.5f));
  float open = 6.f + level * 60.f + 6.f * (0.5f + 0.5f * std::sin(t * 2.f)), w = 70.f;
  Path mouth; mouth.addEllipse(cx - w * 0.5f, cy - open * 0.5f - 8, w, open); g.setColour(C(0xff1a0612)); g.fillPath(mouth); g.setColour(C(th.accent)); g.strokePath(mouth, juce::PathStrokeType(2.4f));
  g.setColour(C(th.accent).withAlpha(0.35f)); for (int k = 1; k <= 3; ++k) { float rr = w * 0.5f + k * 16.f + std::fmod(t * 14.f, 16.f); g.drawEllipse(cx - rr, cy - 8 - rr * 0.45f, rr * 2, rr * 0.9f, 1.f); }
}
inline void drawPianica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3a2c22), r.getCentreX(), r.getBottom(), C(0xff0b0807), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // strings fanning over a soundboard, hammers striking, ivory keys along the bottom
  int N = 36; float top = r.getY() + 12, bot = r.getBottom() - 34;
  for (int i = 0; i < N; ++i) { float u = i / (N - 1.f), x0 = r.getX() + 20 + (r.getWidth() - 40) * u, x1 = r.getX() + 14 + (r.getWidth() - 28) * u, wob = std::sin(t * (9.f + i * 0.4f) + i) * level * 5.f * (0.4f + 0.6f * std::sin(u * 3.14f));
    g.setColour(C(th.glow).withAlpha(0.35f + 0.4f * level)); Path p; p.startNewSubPath(x0, top); p.quadraticTo(x0 + wob, (top + bot) * 0.5f, x1, bot); g.strokePath(p, juce::PathStrokeType(i < 12 ? 1.8f : (i < 24 ? 1.2f : 0.8f))); }
  for (int i = 0; i < 6; ++i) { float k = std::fmod(t * 1.5f + i * 0.37f, 1.f), x = r.getX() + 40 + i * (r.getWidth() - 80) / 5.f, y = bot - 6 - 22 * std::abs(std::sin(k * 3.14f)); g.setColour(C(0xffe9dcc0)); g.fillRoundedRectangle(x - 4, y, 8, 12, 3.f); }
  float kw = (r.getWidth() - 28) / 28.f; for (int i = 0; i < 28; ++i) { g.setColour(C(0xfff4ecd8)); g.fillRect(r.getX() + 14 + i * kw, r.getBottom() - 26, kw - 1, 20.f); }
  for (int i : {1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 22, 23, 25, 26}) { g.setColour(C(0xff111111)); g.fillRect(r.getX() + 14 + i * kw - kw * 0.3f, r.getBottom() - 26, kw * 0.6f, 12.f); }
}
inline void drawReedica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d2a16), r.getCentreX(), r.getBottom(), C(0xff0e0803), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // a wooden pipe on a slant with finger holes; breath ripples leave the bell
  Path pipe; float x0 = r.getX() + 24, y0 = r.getBottom() - 30, x1 = r.getRight() - 70, y1 = r.getY() + 26; pipe.startNewSubPath(x0, y0); pipe.lineTo(x1, y1);
  g.setColour(C(0xff1a0f06)); g.strokePath(pipe, juce::PathStrokeType(16.f)); g.setColour(C(0xff7a4a22)); g.strokePath(pipe, juce::PathStrokeType(12.f)); g.setColour(C(th.accent).withAlpha(0.5f)); g.strokePath(pipe, juce::PathStrokeType(3.f));
  for (int i = 0; i < 6; ++i) { float u = 0.25f + i * 0.11f, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; g.setColour(C(0xff0a0603)); g.fillEllipse(x - 3.5f, y - 3.5f, 7, 7); g.setColour(C(th.glow).withAlpha(0.15f + level * 1.5f * (0.5f + 0.5f * std::sin(t * 3.f + i)))); g.fillEllipse(x - 7, y - 7, 14, 14); }
  g.setColour(C(0xff7a4a22)); g.fillEllipse(x1 - 9, y1 - 9, 18, 18); g.setColour(C(th.accent)); g.drawEllipse(x1 - 9, y1 - 9, 18, 18, 1.5f);
  for (int k = 0; k < 4; ++k) { float rr = 14.f + std::fmod(t * 20.f + k * 14.f, 56.f); g.setColour(C(th.glow).withAlpha(0.5f * (1.f - (rr - 14.f) / 56.f))); g.drawEllipse(x1 - rr, y1 - rr, rr * 2, rr * 2, 1.2f); }
}
inline void drawBrassica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff44300f), r.getCentreX(), r.getBottom(), C(0xff0d0802), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // coiled brass tube ending in a flared bell on the right, glowing with the level
  float cy = r.getCentreY(), bx = r.getRight() - 60; Path tube; tube.startNewSubPath(r.getX() + 24, cy - 14); tube.lineTo(r.getX() + 110, cy - 14); tube.quadraticTo(r.getX() + 150, cy - 14, r.getX() + 150, cy + 4); tube.quadraticTo(r.getX() + 150, cy + 24, r.getX() + 110, cy + 24); tube.lineTo(r.getX() + 90, cy + 24); tube.quadraticTo(r.getX() + 60, cy + 24, r.getX() + 60, cy + 4); tube.quadraticTo(r.getX() + 60, cy - 6, r.getX() + 90, cy - 6); tube.lineTo(bx - 40, cy - 6);
  g.setColour(C(0xff2a1a04)); g.strokePath(tube, juce::PathStrokeType(11.f)); g.setColour(C(th.accent)); g.strokePath(tube, juce::PathStrokeType(7.f)); g.setColour(C(0xfffff0b0).withAlpha(0.55f)); g.strokePath(tube, juce::PathStrokeType(1.8f));
  Path bell; bell.startNewSubPath(bx - 40, cy - 8); bell.quadraticTo(bx - 8, cy - 10, bx + 16, cy - 40 - level * 20); bell.lineTo(bx + 16, cy + 40 + level * 20); bell.quadraticTo(bx - 8, cy + 10, bx - 40, cy + 2); bell.closeSubPath();
  g.setColour(C(th.accent).darker(0.3f)); g.fillPath(bell); g.setColour(C(th.glow)); g.strokePath(bell, juce::PathStrokeType(1.6f));
  for (int k = 0; k < 4; ++k) { float rr = 10.f + std::fmod(t * 30.f + k * 18.f, 72.f); g.setColour(C(th.glow).withAlpha(juce::jlimit(0.f, 1.f, (0.3f + level * 3.f) * (1.f - (rr - 10.f) / 72.f)))); g.drawEllipse(bx + 16 - rr * 0.5f, cy - rr, rr, rr * 2, 1.4f); }
}
inline void drawClavica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d1c1f), r.getCentreX(), r.getBottom(), C(0xff0d0505), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // vintage keyboard along the bottom; above it a vibrating tine, a plucked string and a tape reel
  float kw = (r.getWidth() - 28) / 24.f; for (int i = 0; i < 24; ++i) { g.setColour(C(0xfff1e3d0)); g.fillRect(r.getX() + 14 + i * kw, r.getBottom() - 24, kw - 1, 18.f); }
  for (int i : {1, 3, 5, 8, 10, 13, 15, 17, 20, 22}) { g.setColour(C(0xff1a0c0c)); g.fillRect(r.getX() + 14 + i * kw + kw * 0.6f, r.getBottom() - 24, kw * 0.6f, 11.f); }
  float w3 = r.getWidth() / 3.f, cy = r.getCentreY() - 12;
  { float x = r.getX() + w3 * 0.5f, wob = std::sin(t * 30.f) * (2.f + level * 22.f); Path p; p.startNewSubPath(x - 30, cy + 20); p.lineTo(x + wob, cy - 24); g.setColour(C(0xffd9d9e0)); g.strokePath(p, juce::PathStrokeType(3.f)); g.setColour(C(th.accent)); g.drawEllipse(x - 12, cy - 6, 24, 20, 2.f); }
  { float x0 = r.getX() + w3 * 1.15f, x1 = r.getX() + w3 * 1.85f, wob = std::sin(t * 22.f) * (1.f + level * 16.f); Path p; p.startNewSubPath(x0, cy + 10); p.quadraticTo((x0 + x1) * 0.5f, cy + 10 + wob, x1, cy + 10); g.setColour(C(th.glow)); g.strokePath(p, juce::PathStrokeType(1.8f)); g.setColour(C(0xff2a1a1a)); g.fillRect(x0 - 3, cy, 6.f, 22.f); g.fillRect(x1 - 3, cy, 6.f, 22.f); }
  { float x = r.getX() + w3 * 2.5f; for (int s = -1; s <= 1; s += 2) { float cx = x + s * 22; g.setColour(C(0xff1a0c0c)); g.fillEllipse(cx - 16, cy - 8, 32, 32); g.setColour(C(th.accent)); g.drawEllipse(cx - 16, cy - 8, 32, 32, 1.6f); float a = t * 2.f * s; for (int k = 0; k < 3; ++k) { float ang = a + k * 2.094f; g.drawLine(cx, cy + 8, cx + std::cos(ang) * 12, cy + 8 + std::sin(ang) * 12, 1.5f); } } }
}
inline void drawStringica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff4a2a14), r.getCentreX(), r.getBottom(), C(0xff0e0705), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // a bowed string: bridge on the left, nut on the right, the bow dragging a Helmholtz kink back and forth
  float yb = r.getCentreY(), x0 = r.getX() + 30, x1 = r.getRight() - 30; g.setColour(C(0xff2a1608)); g.fillRect(x0 - 8, yb - 26, 8.f, 52.f); g.fillRect(x1, yb - 26, 8.f, 52.f);
  for (int k = 0; k < 3; ++k) { Path p; float yy = yb + (k - 1) * 11.f; p.startNewSubPath(x0, yy); p.lineTo(x1, yy); g.setColour(C(th.accent).withAlpha(0.25f)); g.strokePath(p, juce::PathStrokeType(1.f)); }
  float u = std::fmod(t * 1.1f, 1.f), kx = x0 + (x1 - x0) * (0.5f + 0.4f * std::sin(t * 6.f)), amp = 3.f + level * 40.f; Path s; s.startNewSubPath(x0, yb); s.lineTo(kx, yb - amp * (u < 0.5f ? 1 : -1)); s.lineTo(x1, yb);
  g.setColour(C(th.glow).withAlpha(0.2f)); g.strokePath(s, juce::PathStrokeType(8.f)); g.setColour(C(th.glow)); g.strokePath(s, juce::PathStrokeType(2.f));
  float bx = x0 + (x1 - x0) * 0.62f; g.setColour(C(0xffe9dcc0)); g.drawLine(bx - 24, yb + 30, bx + 24, yb - 30, 3.f); g.setColour(C(0xfff7f2e6).withAlpha(0.7f)); g.drawLine(bx - 24, yb + 30, bx + 24, yb - 30, 1.f);
  for (int k = 0; k < 3; ++k) { float rr = 10.f + std::fmod(t * 18.f + k * 14.f, 42.f); g.setColour(C(th.accent).withAlpha(0.4f * (1.f - (rr - 10.f) / 42.f))); g.drawEllipse(r.getX() + 60 - rr, r.getBottom() - 30 - rr * 0.6f, rr * 2, rr * 1.2f, 1.f); }
}
inline void drawPipica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d2616), r.getCentreX(), r.getBottom(), C(0xff0b0605), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // organ facade: gilded pipes in a rising/falling arch of heights, glowing from the mouths
  int N = 21; float pw = (r.getWidth() - 40) / N, base = r.getBottom() - 12;
  for (int i = 0; i < N; ++i) { float u = (i - (N - 1) * 0.5f) / ((N - 1) * 0.5f), h = (r.getHeight() - 26) * (0.35f + 0.65f * (1.f - u * u * 0.8f)) * (0.97f + 0.03f * std::sin(t * 3.f + i)); auto b = Rectangle<float>(r.getX() + 20 + i * pw + 1.5f, base - h, pw - 3.f, h);
    g.setGradientFill(juce::ColourGradient(C(th.glow), b.getX(), 0.f, C(th.accent).darker(0.5f), b.getRight(), 0.f, false)); g.fillRect(b);
    g.setColour(C(0xff120a06)); g.fillEllipse(b.getX() + 1.5f, b.getBottom() - b.getWidth() * 1.6f, b.getWidth() - 3.f, b.getWidth() * 0.8f);
    g.setColour(C(th.glow).withAlpha(0.1f + level * 1.5f * (0.5f + 0.5f * std::sin(t * 2.f + i * 0.6f)))); g.fillRect(b.getX() - 1, b.getBottom() - b.getWidth() * 2.2f, b.getWidth() + 2, b.getWidth() * 1.4f); }
}
inline void drawPercussica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d2616), r.getCentreX(), r.getBottom(), C(0xff0c0807), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // marimba bars of falling length with a mallet and ripples from the strike
  int N = 12; float bw = (r.getWidth() - 40) / N, base = r.getBottom() - 16; int hit = (int)(t * 2.f) % N;
  for (int i = 0; i < N; ++i) { float h = 28.f + (N - i) * 3.4f, x = r.getX() + 20 + i * bw; auto b = Rectangle<float>(x + 2, base - h, bw - 4, h * 0.5f); float on = i == hit ? 1.f : 0.f;
    g.setColour(C(0xff6b3e1c).brighter(on * 0.5f)); g.fillRoundedRectangle(b, 4.f); g.setColour(C(th.accent).withAlpha(0.6f)); g.drawRoundedRectangle(b, 4.f, 1.f);
    if (on > 0) for (int k = 0; k < 3; ++k) { float rr = 6.f + std::fmod(t * 40.f + k * 9.f, 30.f); g.setColour(C(th.glow).withAlpha((0.2f + level * 2.f) * (1.f - (rr - 6.f) / 30.f))); g.drawEllipse(b.getCentreX() - rr, b.getCentreY() - rr * 0.5f, rr * 2, rr, 1.2f); } }
  float mx = r.getX() + 20 + hit * bw + bw * 0.5f; g.setColour(C(0xffe9dcc0)); g.drawLine(mx + 22, r.getY() + 12, mx, base - 28 - (N - hit) * 1.7f, 2.f); g.fillEllipse(mx - 5, base - 33 - (N - hit) * 1.7f, 10, 10);
}
inline void drawBeachica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff0f4a63), r.getCentreX(), r.getBottom(), C(0xff03121c), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  for (int k = 0; k < 4; ++k) { Path p; float y0 = r.getY() + 30 + k * 18.f; for (int i = 0; i <= 120; ++i) { float u = i / 120.f, x = r.getX() + 10 + (r.getWidth() - 20) * u, y = y0 + std::sin(u * 9.f + t * (1.2f + k * 0.3f) + k) * (3.f + level * 24.f); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.glow).withAlpha(0.55f / (1 + k * 0.4f))); g.strokePath(p, juce::PathStrokeType(2.f - k * 0.3f)); }
  g.setColour(C(0xffd8c79a).withAlpha(0.8f)); g.fillRect(r.getX() + 8, r.getBottom() - 14, r.getWidth() - 16, 8.f);
  juce::Random rnd(3); for (int i = 0; i < 14; ++i) { float ph = std::fmod(t * (0.2f + rnd.nextFloat() * 0.3f) + rnd.nextFloat(), 1.f); float x = r.getX() + 16 + rnd.nextFloat() * (r.getWidth() - 32), y = r.getBottom() - 20 - ph * (r.getHeight() - 50); g.setColour(C(th.ink).withAlpha(0.5f * (1.f - ph))); g.drawEllipse(x, y, 4.f + rnd.nextFloat() * 4.f, 4.f + rnd.nextFloat() * 4.f, 1.f); }
  Path sp; for (int i = 0; i < 90; ++i) { float a = i * 0.14f, rr = 1.5f * std::exp(0.2f * a * 0.9f) * 3.f; float x = r.getRight() - 56 + std::cos(a) * rr, y = r.getBottom() - 48 + std::sin(a) * rr; if (i == 0) sp.startNewSubPath(x, y); else sp.lineTo(x, y); }
  g.setColour(C(th.glow).withAlpha(0.8f)); g.strokePath(sp, juce::PathStrokeType(1.6f));
}
inline void drawAvoidica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff16313b), r.getCentreX(), r.getBottom(), C(0xff060b0f), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // modular rack: four modules joined by glowing patch cables, knobs along the bottom
  float mw = (r.getWidth() - 60) / 4.f; Rectangle<float> m[4]; for (int i = 0; i < 4; ++i) { m[i] = Rectangle<float>(r.getX() + 16 + i * (mw + 9), r.getY() + 14, mw, r.getHeight() * 0.42f); g.setColour(C(0xff0a1218)); g.fillRoundedRectangle(m[i], 4.f); g.setColour(C(th.accent).withAlpha(0.6f)); g.drawRoundedRectangle(m[i], 4.f, 1.2f); }
  for (int i = 0; i < 3; ++i) { Path p; float x0 = m[i].getRight() - 6, y0 = m[i].getCentreY(), x1 = m[i + 1].getX() + 6, y1 = m[i + 1].getCentreY() + 8; p.startNewSubPath(x0, y0); p.cubicTo(x0 + 14, y0 + 30 + level * 20, x1 - 14, y1 + 30 + level * 20, x1, y1); g.setColour(C(th.glow).withAlpha(0.25f)); g.strokePath(p, juce::PathStrokeType(6.f)); g.setColour(C(th.glow)); g.strokePath(p, juce::PathStrokeType(1.8f)); }
  for (int i = 0; i < 8; ++i) { float cx = r.getX() + 30 + i * (r.getWidth() - 60) / 7.f, cy = r.getBottom() - 26, a = std::sin(t * 0.7f + i * 1.3f) * 2.2f; g.setColour(C(0xff0a1218)); g.fillEllipse(cx - 10, cy - 10, 20, 20); g.setColour(C(th.accent)); g.drawEllipse(cx - 10, cy - 10, 20, 20, 1.4f); g.drawLine(cx, cy, cx + std::sin(a) * 8, cy - std::cos(a) * 8, 2.f); }
}
inline void drawIndustrica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff33373c), r.getCentreX(), r.getBottom(), C(0xff0a0b0d), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // anvil with shock rings and sparks above a 16-step grid
  float cx = r.getCentreX(), cy = r.getCentreY() - 6; g.setColour(C(0xff1c1e22)); g.fillRoundedRectangle(cx - 44, cy + 6, 88, 18, 3.f); g.fillRect(cx - 14, cy + 22, 28.f, 14.f); g.setColour(C(th.accent).withAlpha(0.6f)); g.drawRoundedRectangle(cx - 44, cy + 6, 88, 18, 3.f, 1.4f);
  for (int k = 0; k < 4; ++k) { float rr = 8.f + std::fmod(t * 50.f + k * 14.f, 56.f); g.setColour(C(th.glow).withAlpha(juce::jlimit(0.f, 1.f, (0.25f + level * 3.f) * (1.f - (rr - 8.f) / 56.f)))); g.drawEllipse(cx - rr, cy + 6 - rr * 0.35f, rr * 2, rr * 0.7f, 1.4f); }
  juce::Random rnd(7); for (int i = 0; i < 16; ++i) { float ph = std::fmod(t * 1.4f + rnd.nextFloat(), 1.f), ang = -3.14f * (0.1f + 0.8f * rnd.nextFloat()), d = ph * (30.f + 50.f * rnd.nextFloat()); g.setColour(C(th.glow).withAlpha(1.f - ph)); g.fillEllipse(cx + std::cos(ang) * d, cy + 6 + std::sin(ang) * d + ph * ph * 30.f, 2.5f, 2.5f); }
  int cur = (int)(t * 4.f) % 16; for (int i = 0; i < 16; ++i) { auto c = Rectangle<float>(r.getX() + 16 + i * (r.getWidth() - 32) / 16.f, r.getBottom() - 18, (r.getWidth() - 32) / 16.f - 3.f, 11.f); g.setColour(C(i == cur ? th.glow : (i % 4 == 0 ? 0xff5a4a30 : 0xff3a3d42))); g.fillRoundedRectangle(c, 2.f); }
}
inline void drawPhysica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff3d2f1c), r.getCentreX(), r.getBottom(), C(0xff0e0a06), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  // workshop bench: a spinning siren disc, a balloon, a slinky, and copper pipe linking them
  float cy = r.getCentreY() - 4, x1 = r.getX() + r.getWidth() * 0.2f, x2 = r.getX() + r.getWidth() * 0.5f, x3 = r.getX() + r.getWidth() * 0.8f;
  g.setColour(C(0xff1a1208)); g.fillEllipse(x1 - 28, cy - 28, 56, 56); for (int i = 0; i < 8; ++i) { float a = t * (3.f + level * 20.f) + i * 0.785f; g.setColour(C(th.accent)); g.fillEllipse(x1 + std::cos(a) * 18 - 3, cy + std::sin(a) * 18 - 3, 6, 6); } g.setColour(C(th.accent)); g.drawEllipse(x1 - 28, cy - 28, 56, 56, 1.6f);
  float br = 20.f + level * 18.f + 2.f * std::sin(t * 3.f); g.setColour(C(0xffe05a4a).withAlpha(0.85f)); g.fillEllipse(x2 - br, cy - br * 1.2f, br * 2, br * 2.4f); g.setColour(C(0xffffffff).withAlpha(0.25f)); g.fillEllipse(x2 - br * 0.5f, cy - br * 0.9f, br * 0.4f, br * 0.6f);
  Path sl; for (int i = 0; i <= 120; ++i) { float u = i / 120.f, a = u * 40.f + t * 4.f, x = x3 - 24 + 48 * u, y = cy + std::sin(a) * (10.f + level * 20.f); if (i == 0) sl.startNewSubPath(x, y); else sl.lineTo(x, y); }
  g.setColour(C(0xffc9c9d2)); g.strokePath(sl, juce::PathStrokeType(2.f));
  Path pipe; pipe.startNewSubPath(r.getX() + 14, r.getBottom() - 18); pipe.lineTo(r.getRight() - 14, r.getBottom() - 18); g.setColour(C(0xffb87333)); g.strokePath(pipe, juce::PathStrokeType(6.f)); g.setColour(C(th.glow).withAlpha(0.5f)); g.strokePath(pipe, juce::PathStrokeType(1.5f));
}
inline void drawGalactica(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setGradientFill(juce::ColourGradient(C(0xff2a1a66), r.getCentreX(), r.getBottom(), C(0xff05030f), r.getCentreX(), r.getY(), false)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  g.setColour(C(th.accent).withAlpha(0.3f)); g.drawRoundedRectangle(r.reduced(2, 2), 8.f, 1.2f);
  juce::Random rnd(9); for (int i = 0; i < 60; ++i) { float x = r.getX() + rnd.nextFloat() * r.getWidth(), y = r.getY() + rnd.nextFloat() * r.getHeight(), tw = 0.3f + 0.7f * (0.5f + 0.5f * std::sin(t * (1.f + rnd.nextFloat() * 2.f) + i)); g.setColour(C(th.ink).withAlpha(0.6f * tw)); g.fillEllipse(x, y, 1.8f, 1.8f); }
  float px = r.getRight() - 70, py = r.getY() + 46; g.setColour(C(th.glow).withAlpha(0.15f)); g.fillEllipse(px - 30, py - 30, 60, 60); g.setColour(C(th.accent)); g.fillEllipse(px - 20, py - 20, 40, 40);
  Path ring; ring.addEllipse(px - 40, py - 8, 80, 16); g.setColour(C(th.glow).withAlpha(0.8f)); g.strokePath(ring, juce::PathStrokeType(2.f));
  for (int k = 0; k < 7; ++k) { Path p; float off = (k - 3) * (1.5f + level * 5.f); for (int i = 0; i <= 120; ++i) { float u = i / 120.f, x = r.getX() + 12 + (r.getWidth() - 24) * u, y = r.getCentreY() + 4 + off + std::sin(u * 12.f + t * (2.f + k * 0.12f)) * (10.f + level * 24.f); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.glow).withAlpha(0.15f + 0.1f * (3 - std::abs(k - 3)))); g.strokePath(p, juce::PathStrokeType(1.3f)); }
  int cur = (int)(t * 4.f) % 16; for (int i = 0; i < 16; ++i) { float x = r.getX() + 20 + i * (r.getWidth() - 40) / 15.f; g.setColour(C(i == cur ? th.glow : th.accent).withAlpha(i == cur ? 1.f : 0.4f)); g.fillEllipse(x - 4, r.getBottom() - 16, 8, 8); }
}
inline void drawGeneric(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  g.setColour(C(0xff000000).withAlpha(0.35f)); g.fillRoundedRectangle(r.reduced(2, 2), 8.f);
  for (int k = 0; k < 3; ++k) { Path p; for (int i = 0; i <= 200; ++i) { float x = r.getX() + 10 + (r.getWidth() - 20) * i / 200.f, y = r.getCentreY() + std::sin(i * 0.12f * (k + 1) + t * (2 + k)) * r.getHeight() * 0.28f * (0.3f + level * 2.f) / (k + 1); if (i == 0) p.startNewSubPath(x, y); else p.lineTo(x, y); }
    g.setColour(C(th.accent).withAlpha(0.7f / (k + 1))); g.strokePath(p, juce::PathStrokeType(1.6f)); }
}
inline void drawMotif(Graphics& g, Rectangle<float> r, const occ::Theme& th, float level, float t) {
  if (th.motif == "minica") drawMinica(g, r, th, level, t); else if (th.motif == "rhodica") drawRhodica(g, r, th, level, t); else if (th.motif == "wraithica") drawWraithica(g, r, th, level, t); else if (th.motif == "additica") drawAdditica(g, r, th, level, t); else if (th.motif == "grainica") drawGrainica(g, r, th, level, t); else if (th.motif == "fantica") drawFantica(g, r, th, level, t); else if (th.motif == "voxica") drawVoxica(g, r, th, level, t); else if (th.motif == "pianica") drawPianica(g, r, th, level, t); else if (th.motif == "reedica") drawReedica(g, r, th, level, t); else if (th.motif == "brassica") drawBrassica(g, r, th, level, t); else if (th.motif == "clavica") drawClavica(g, r, th, level, t); else if (th.motif == "stringica") drawStringica(g, r, th, level, t); else if (th.motif == "pipica") drawPipica(g, r, th, level, t); else if (th.motif == "percussica") drawPercussica(g, r, th, level, t); else if (th.motif == "beachica") drawBeachica(g, r, th, level, t); else if (th.motif == "avoidica") drawAvoidica(g, r, th, level, t); else if (th.motif == "industrica") drawIndustrica(g, r, th, level, t); else if (th.motif == "physica") drawPhysica(g, r, th, level, t); else if (th.motif == "galactica") drawGalactica(g, r, th, level, t); else drawGeneric(g, r, th, level, t);
}
}  // namespace occart
