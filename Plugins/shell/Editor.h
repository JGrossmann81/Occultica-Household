// Generic themed editor: header artwork, one panel per parameter group, knobs and selectors built from the instrument's Spec list.
#pragma once
#include "Processor.h"
#include "Art.h"
#include "Display.h"

class OccLookAndFeel : public juce::LookAndFeel_V4 {
public:
  explicit OccLookAndFeel(const occ::Theme& t) : th(t) {
    setColour(juce::ComboBox::backgroundColourId, juce::Colour(0xff000000).withAlpha(0.45f)); setColour(juce::ComboBox::textColourId, juce::Colour(th.ink)); setColour(juce::ComboBox::outlineColourId, juce::Colour(th.accent).withAlpha(0.5f));
    setColour(juce::ComboBox::arrowColourId, juce::Colour(th.accent)); setColour(juce::PopupMenu::backgroundColourId, juce::Colour(th.bg2).brighter(0.1f)); setColour(juce::PopupMenu::textColourId, juce::Colour(th.ink));
    setColour(juce::PopupMenu::highlightedBackgroundColourId, juce::Colour(th.accent).withAlpha(0.6f)); setColour(juce::PopupMenu::highlightedTextColourId, juce::Colours::black);
    setColour(juce::Label::textColourId, juce::Colour(th.ink));
  }
  void drawRotarySlider(juce::Graphics& g, int x, int y, int w, int h, float pos, float a0, float a1, juce::Slider& s) override {
    auto r = juce::Rectangle<float>((float)x, (float)y, (float)w, (float)h).reduced(4.f); float d = std::min(r.getWidth(), r.getHeight()); auto c = r.getCentre(); float rad = d / 2;
    juce::Colour acc(th.accent); const bool on = s.isMouseOverOrDragging();
    g.setGradientFill(juce::ColourGradient(juce::Colour(0xff3b3b3f), c.x - rad * 0.4f, c.y - rad * 0.5f, juce::Colour(0xff0d0d10), c.x + rad * 0.6f, c.y + rad * 0.7f, true)); g.fillEllipse(c.x - rad * 0.78f, c.y - rad * 0.78f, rad * 1.56f, rad * 1.56f);
    g.setColour(juce::Colours::black.withAlpha(0.6f)); g.drawEllipse(c.x - rad * 0.78f, c.y - rad * 0.78f, rad * 1.56f, rad * 1.56f, 1.5f);
    juce::Path track; track.addCentredArc(c.x, c.y, rad * 0.93f, rad * 0.93f, 0, a0, a1, true); g.setColour(juce::Colours::white.withAlpha(0.09f)); g.strokePath(track, juce::PathStrokeType(3.f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    float ang = a0 + pos * (a1 - a0); juce::Path val; val.addCentredArc(c.x, c.y, rad * 0.93f, rad * 0.93f, 0, a0, ang, true);
    g.setColour(acc.withAlpha(on ? 0.35f : 0.2f)); g.strokePath(val, juce::PathStrokeType(7.f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    g.setColour(acc); g.strokePath(val, juce::PathStrokeType(3.f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    juce::Path ptr; ptr.addRoundedRectangle(-1.6f, -rad * 0.72f, 3.2f, rad * 0.4f, 1.4f); g.setColour(juce::Colour(th.ink)); g.fillPath(ptr, juce::AffineTransform::rotation(ang).translated(c.x, c.y));
  }
  void drawComboBox(juce::Graphics& g, int w, int h, bool, int, int, int, int, juce::ComboBox& b) override {
    auto r = juce::Rectangle<float>(0, 0, (float)w, (float)h).reduced(0.5f); g.setColour(b.findColour(juce::ComboBox::backgroundColourId)); g.fillRoundedRectangle(r, 5.f);
    g.setColour(b.findColour(juce::ComboBox::outlineColourId)); g.drawRoundedRectangle(r, 5.f, 1.f);
    juce::Path ar; ar.addTriangle((float)w - 16, h / 2.f - 3, (float)w - 8, h / 2.f - 3, (float)w - 12, h / 2.f + 3); g.setColour(b.findColour(juce::ComboBox::arrowColourId)); g.fillPath(ar);
  }
  juce::Font getComboBoxFont(juce::ComboBox&) override { return juce::Font(juce::FontOptions(13.f)); }
  const occ::Theme& th;
};

class OccEditor : public juce::AudioProcessorEditor, private juce::Timer {
public:
  explicit OccEditor(OccProcessor& p) : AudioProcessorEditor(&p), proc(p), th(p.info.theme), lnf(p.info.theme), keys(p.keyState, juce::MidiKeyboardComponent::horizontalKeyboard) {
    setLookAndFeel(&lnf); const auto& specs = proc.info.specs;
    // preset selector (parameter 0)
    addControl(0, presetBox, true);
    for (auto& grp : proc.info.groups) {
      Panel pn; pn.name = grp.name;
      for (int id : grp.ids) { auto c = std::make_unique<Ctl>(); c->id = id; const auto& s = specs[(size_t)id];
        if (!s.labels.empty()) { c->box = std::make_unique<juce::ComboBox>(); fillBox(*c->box, s); c->boxAtt = std::make_unique<juce::ComboBoxParameterAttachment>(*proc.apvts.getParameter(OccProcessor::pid(id)), *c->box); addAndMakeVisible(*c->box); }
        else { c->slider = std::make_unique<juce::Slider>(juce::Slider::RotaryHorizontalVerticalDrag, juce::Slider::NoTextBox); c->slider->setRotaryParameters(juce::MathConstants<float>::pi * 1.2f, juce::MathConstants<float>::pi * 2.8f, true);
          c->slider->setDoubleClickReturnValue(true, s.def); c->att = std::make_unique<juce::SliderParameterAttachment>(*proc.apvts.getParameter(OccProcessor::pid(id)), *c->slider); addAndMakeVisible(*c->slider);
          c->value = std::make_unique<juce::Label>(); c->value->setJustificationType(juce::Justification::centred); c->value->setFont(juce::Font(juce::FontOptions(12.f))); c->value->setColour(juce::Label::textColourId, juce::Colour(th.glow)); c->value->setInterceptsMouseClicks(false, false); addAndMakeVisible(*c->value);
          Slider* sl = c->slider.get(); Label* lb = c->value.get(); sl->onValueChange = [sl, lb, &s] { lb->setText(juce::String(occ::formatValue(s, sl->getValue())), juce::dontSendNotification); }; sl->onValueChange(); }
        pn.ctls.push_back(std::move(c));
        if (id == proc.tempoId) {   // host-sync switch right next to the instrument's own Tempo
          auto t = std::make_unique<Ctl>(); t->id = -1; t->box = std::make_unique<juce::ComboBox>(); t->box->addItem("Own", 1); t->box->addItem("Host", 2);
          t->boxAtt = std::make_unique<juce::ComboBoxParameterAttachment>(*proc.apvts.getParameter("tempoSrc"), *t->box); t->box->setTooltip("Own: use the Tempo knob. Host: follow the tempo of your music program."); addAndMakeVisible(*t->box); pn.ctls.push_back(std::move(t));
        } }
      panels.push_back(std::move(pn));
    }
    qualityBox.addItemList({"Standard", "High (2x)", "Ultra (4x)"}, 1); addAndMakeVisible(qualityBox);
    qualityAtt = std::make_unique<juce::ComboBoxParameterAttachment>(*proc.apvts.getParameter("quality"), qualityBox);
    keys.setKeyWidth(22.f); keys.setColour(juce::MidiKeyboardComponent::keyDownOverlayColourId, juce::Colour(th.accent).withAlpha(0.7f)); keys.setLowestVisibleKey(36); addAndMakeVisible(keys);
    if (auto k = OccDisplay::kindFor(th); k != OccDisplay::None) { disp = std::make_unique<OccDisplay>(proc, k); addAndMakeVisible(*disp); }   // Minica / Rhodica / Fantica (and Rev2) get a live panel
    computeLayout(); refreshLabels(); startTimerHz(30);
  }
  ~OccEditor() override { setLookAndFeel(nullptr); }

  void paint(juce::Graphics& g) override {
    g.setGradientFill(juce::ColourGradient(juce::Colour(th.bg1), 0, 0, juce::Colour(th.bg2), 0, (float)getHeight(), false)); g.fillAll();
    juce::Random rnd(3); g.setColour(juce::Colours::white.withAlpha(0.025f)); for (int i = 0; i < 90; ++i) g.fillEllipse(rnd.nextFloat() * getWidth(), rnd.nextFloat() * getHeight(), 2.f, 2.f);
    // header
    auto head = juce::Rectangle<float>(0, 0, (float)getWidth(), (float)headerH);
    occart::drawMotif(g, juce::Rectangle<float>(getWidth() * 0.44f, 8, getWidth() * 0.54f, headerH - 16.f), th, proc.level.load(), tsec);
    g.setColour(juce::Colour(th.glow).withAlpha(0.22f)); g.setFont(juce::Font(juce::FontOptions(42.f, juce::Font::bold))); g.drawText(juce::String(proc.info.name).toUpperCase(), 23, 12, 420, 56, juce::Justification::centredLeft);
    g.setColour(juce::Colour(th.ink)); g.setFont(juce::Font(juce::FontOptions(42.f, juce::Font::bold))); g.drawText(juce::String(proc.info.name).toUpperCase(), 20, 10, 420, 56, juce::Justification::centredLeft);
    g.setColour(juce::Colour(th.ink).withAlpha(0.65f)); g.setFont(juce::Font(juce::FontOptions(13.f))); g.drawFittedText(proc.info.blurb, 22, 64, getWidth() * 0.42 - 30, 38, juce::Justification::topLeft, 3);
    g.setColour(juce::Colour(th.accent).withAlpha(0.5f)); g.drawLine(16, (float)headerH + 2, (float)getWidth() - 16, (float)headerH + 2, 1.2f);
    g.setColour(juce::Colour(th.ink).withAlpha(0.7f)); g.setFont(juce::Font(juce::FontOptions(12.f))); g.drawText("Preset", 22, headerH - 30, 44, 22, juce::Justification::centredLeft);
    for (auto& pn : panels) {
      g.setColour(juce::Colours::black.withAlpha(0.32f)); g.fillRoundedRectangle(pn.r, 10.f); g.setColour(juce::Colour(th.accent).withAlpha(0.28f)); g.drawRoundedRectangle(pn.r, 10.f, 1.f);
      g.setColour(juce::Colour(th.accent)); g.setFont(juce::Font(juce::FontOptions(13.f, juce::Font::bold))); g.drawText(juce::String(pn.name).toUpperCase(), (int)pn.r.getX() + 12, (int)pn.r.getY() + 6, (int)pn.r.getWidth() - 20, 20, juce::Justification::centredLeft);
      for (auto& c : pn.ctls) { g.setColour(juce::Colour(th.ink).withAlpha(0.85f)); g.setFont(juce::Font(juce::FontOptions(12.f))); const bool unused = ctlLabel(*c) == "-"; g.setColour(juce::Colour(th.ink).withAlpha(unused ? 0.3f : 0.85f)); g.drawFittedText(unused ? juce::String("(unused)") : ctlLabel(*c), c->labelR, juce::Justification::centred, 2, 1.0f); }
    }
    g.setColour(juce::Colour(th.ink).withAlpha(0.55f)); g.setFont(juce::Font(juce::FontOptions(12.f))); g.drawText("Sound quality", footerR.withWidth(100.f).toNearestInt(), juce::Justification::centredRight);
  }
  void resized() override {}

private:
  using Slider = juce::Slider; using Label = juce::Label;
  struct Ctl { int id = 0; std::unique_ptr<juce::Slider> slider; std::unique_ptr<juce::ComboBox> box; std::unique_ptr<juce::Label> value; std::unique_ptr<juce::SliderParameterAttachment> att; std::unique_ptr<juce::ComboBoxParameterAttachment> boxAtt; juce::Rectangle<int> labelR; };
  struct Panel { juce::String name; std::vector<std::unique_ptr<Ctl>> ctls; juce::Rectangle<float> r; };
  juce::String ctlLabel(const Ctl& c) const {   // control name; instruments with per-preset meanings (Avoidica macro knobs) supply their own via Info::dynLabel
    if (c.id < 0) return "Tempo source";
    if (proc.info.dynLabel) { auto s = proc.info.dynLabel(c.id, (int)std::lround(proc.apvts.getRawParameterValue(OccProcessor::pid(0))->load())); if (!s.empty()) return juce::String(s); }
    return juce::String(proc.info.specs[(size_t)c.id].name);
  }
  void refreshLabels() {
    for (auto& pn : panels) for (auto& c : pn.ctls) if (c->slider) { const bool unused = ctlLabel(*c) == "-"; c->slider->setEnabled(!unused); c->slider->setAlpha(unused ? 0.3f : 1.f); c->value->setAlpha(unused ? 0.3f : 1.f); }
  }
  void fillBox(juce::ComboBox& b, const occ::Spec& s) { for (size_t i = 0; i < s.labels.size(); ++i) b.addItem(juce::String(s.labels[i]), (int)i + 1); }
  void addControl(int id, juce::ComboBox& box, bool) { fillBox(box, proc.info.specs[(size_t)id]); presetAtt = std::make_unique<juce::ComboBoxParameterAttachment>(*proc.apvts.getParameter(OccProcessor::pid(id)), box); addAndMakeVisible(box); }
  void computeLayout() {
    const int W = 1040, M = 16, gap = 12, knobW = 82, knobH = 96, boxW = 150, boxH = 54; headerH = 128; int x = M, y = headerH + 14, rowH = 0;
    std::vector<int> sky((size_t)W + 8, 0);
    if (disp) { disp->setBounds(M, y, W - 2 * M, OccDisplay::kHeight); y += OccDisplay::kHeight + gap; std::fill(sky.begin(), sky.end(), y); }
    for (auto& pn : panels) {
      int nb = 0, nk = 0; for (auto& c : pn.ctls) (c->box ? nb : nk)++;
      int kCols = std::min(nk, 5), bCols = std::min(nb, 2), inner = std::max(kCols * knobW, bCols * (boxW + 6)), pw = std::max(inner + 24, 150);
      int bRows = bCols ? (nb + bCols - 1) / bCols : 0, kRows = kCols ? (nk + kCols - 1) / kCols : 0, ph = 32 + bRows * (boxH + 4) + kRows * knobH + 12;
      if (disp) {   // panels under a live display are packed into the lowest free spot, so the taller editor does not grow even taller
        int bx = M, by = 1 << 30; for (int cx = M; cx + pw <= W - M; cx += 4) { int top = 0; for (int i = cx; i < cx + pw; ++i) top = std::max(top, sky[(size_t)i]); if (top < by) { by = top; bx = cx; } }
        x = bx; y = by; for (int i = bx; i < bx + pw + gap && i < W; ++i) sky[(size_t)i] = by + ph + gap;
      }
      else
      if (x + pw > W - M && x > M) { x = M; y += rowH + gap; rowH = 0; }
      pn.r = juce::Rectangle<float>((float)x, (float)y, (float)pw, (float)ph);
      int bi = 0, ki = 0, by = y + 30, ky = by + bRows * (boxH + 4);
      for (auto& c : pn.ctls) {
        if (c->box) { int col = bi % bCols, row = bi / bCols; ++bi; int cx = x + 12 + col * (boxW + 6), cy = by + row * (boxH + 4); c->labelR = {cx, cy, boxW, 18}; c->box->setBounds(cx, cy + 20, boxW, 26); }
        else { int col = ki % kCols, row = ki / kCols; ++ki; int cx = x + 12 + col * knobW + (inner - kCols * knobW) / 2, cy = ky + row * knobH; c->slider->setBounds(cx + 6, cy, knobW - 12, knobW - 22); c->value->setBounds(cx, cy + knobW - 26, knobW, 16); c->labelR = {cx, cy + knobW - 12, knobW, 30}; }
      }
      x += pw + gap; rowH = std::max(rowH, ph);
    }
    if (disp) { int low = 0; for (int h : sky) low = std::max(low, h); y = low - gap; rowH = 0; }
    int bottom = y + rowH + 14; footerR = juce::Rectangle<float>((float)M, (float)bottom, 400.f, 26.f);
    presetBox.setBounds(70, headerH - 30, 230, 24); qualityBox.setBounds(M + 108, bottom, 140, 24);
    keys.setBounds(M, bottom + 34, W - 2 * M, 64); setSize(W, bottom + 34 + 64 + 14);
  }
  void timerCallback() override {
    tsec += 1.f / 30.f;
    if (proc.info.dynLabel) { int p = (int)std::lround(proc.apvts.getRawParameterValue(OccProcessor::pid(0))->load()); if (p != lastPreset) { lastPreset = p; refreshLabels(); repaint(); } }
    repaint(0, 0, getWidth(), headerH);
  }
  OccProcessor& proc; const occ::Theme& th; OccLookAndFeel lnf; std::vector<Panel> panels; juce::ComboBox presetBox, qualityBox; std::unique_ptr<juce::ComboBoxParameterAttachment> presetAtt, qualityAtt;
  std::unique_ptr<OccDisplay> disp; juce::MidiKeyboardComponent keys; int headerH = 128, lastPreset = -1; float tsec = 0; juce::Rectangle<float> footerR;
};
inline juce::AudioProcessorEditor* OccProcessor::createEditor() { return new OccEditor(*this); }
