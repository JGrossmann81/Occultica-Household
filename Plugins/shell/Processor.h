// Generic plugin shell: builds host parameters from an instrument's Spec list, routes MIDI, adds sustain pedal,
// optional 2x/4x oversampling, a soft limiter and level metering.
#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>
#include "../engines/all.h"
#include <atomic>
#include <array>
#include <bitset>
#include <limits>

class OccProcessor : public juce::AudioProcessor, private juce::AsyncUpdater {
public:
  explicit OccProcessor(const occ::Info& inf)
      : AudioProcessor(BusesProperties().withOutput("Output", juce::AudioChannelSet::stereo(), true)), info(inf), apvts(*this, nullptr, "STATE", makeLayout(inf)) {
    const int n = (int)info.specs.size();
    ptrs.resize(n); sent.assign(n, std::numeric_limits<double>::quiet_NaN());
    for (int i = 0; i < n; ++i) ptrs[i] = apvts.getRawParameterValue(pid(i));
    qualityPtr = apvts.getRawParameterValue("quality");
  }
  static juce::String pid(int i) { return "p" + juce::String(i); }
  static juce::AudioProcessorValueTreeState::ParameterLayout makeLayout(const occ::Info& inf) {
    juce::AudioProcessorValueTreeState::ParameterLayout L;
    for (size_t i = 0; i < inf.specs.size(); ++i) {
      const occ::Spec& s = inf.specs[i]; juce::ParameterID id(pid((int)i), 1); const juce::String nm(s.name);
      if (!s.labels.empty()) { juce::StringArray a; for (auto& t : s.labels) a.add(t); L.add(std::make_unique<juce::AudioParameterChoice>(id, nm, a, (int)std::lround(s.def))); }
      else {
        juce::NormalisableRange<float> r((float)s.min, (float)s.max); if (s.log && s.min > 0) r.setSkewForCentre((float)std::sqrt(s.min * s.max));
        const occ::Spec sc = s;
        auto attrs = juce::AudioParameterFloatAttributes().withStringFromValueFunction([sc](float v, int) { return juce::String(occ::formatValue(sc, v)); });
        L.add(std::make_unique<juce::AudioParameterFloat>(id, nm, r, (float)s.def, attrs));
      }
    }
    L.add(std::make_unique<juce::AudioParameterChoice>(juce::ParameterID("quality", 1), "Quality", juce::StringArray{"Standard", "High (2x)", "Ultra (4x)"}, 1));
    return L;
  }
  const juce::String getName() const override { return info.name; }
  bool acceptsMidi() const override { return true; }
  bool producesMidi() const override { return false; }
  bool isMidiEffect() const override { return false; }
  double getTailLengthSeconds() const override { return 4.0; }
  int getNumPrograms() override { return 1; }
  int getCurrentProgram() override { return 0; }
  void setCurrentProgram(int) override {}
  const juce::String getProgramName(int) override { return {}; }
  void changeProgramName(int, const juce::String&) override {}
  bool hasEditor() const override { return true; }
  juce::AudioProcessorEditor* createEditor() override;
  bool isBusesLayoutSupported(const BusesLayout& l) const override { return l.getMainOutputChannelSet() == juce::AudioChannelSet::stereo(); }

  void prepareToPlay(double sampleRate, int samplesPerBlock) override {
    hostRate = sampleRate; maxBlock = samplesPerBlock; rebuild(true);
  }
  void releaseResources() override {}
  void getStateInformation(juce::MemoryBlock& dest) override { if (auto xml = apvts.copyState().createXml()) copyXmlToBinary(*xml, dest); }
  void setStateInformation(const void* data, int size) override {
    if (auto xml = getXmlFromBinary(data, size)) if (xml->hasTagName(apvts.state.getType())) { apvts.replaceState(juce::ValueTree::fromXml(*xml)); suppressWrites.store(6); forceAll.store(true); }
  }

  void processBlock(juce::AudioBuffer<float>& buf, juce::MidiBuffer& midi) override {
    juce::ScopedNoDenormals nd; const int n = buf.getNumSamples(); buf.clear();
    juce::SpinLock::ScopedTryLockType lk(engineLock); if (!lk.isLocked() || !engine) { midi.clear(); return; }
    keyState.processNextMidiBuffer(midi, 0, n, true);
    pushParams();
    auto* L = buf.getWritePointer(0); auto* R = buf.getWritePointer(1);
    int pos = 0; auto it = midi.begin();
    while (pos < n) {
      int next = n; if (it != midi.end()) next = std::min(n, std::max(pos, (*it).samplePosition));
      if (next > pos) { renderRange(L + pos, R + pos, next - pos); pos = next; }
      while (it != midi.end() && (*it).samplePosition <= pos) { handleMidi((*it).getMessage()); ++it; }
    }
    float pk = 0; for (int i = 0; i < n; ++i) {
      L[i] = limit(L[i]); R[i] = limit(R[i]); pk = std::max(pk, std::max(std::fabs(L[i]), std::fabs(R[i])));
    }
    level.store(std::max(pk, level.load() * 0.92f));
    drainWrites();
  }

  juce::MidiKeyboardState keyState; std::atomic<float> level{0.f}; const occ::Info& info; juce::AudioProcessorValueTreeState apvts;

private:
  static float limit(float x) { float a = x < 0 ? -x : x; if (!(a < 1e9f)) return 0.f; if (a <= 0.8f) return x; float y = 0.8f + 0.2f * std::tanh((a - 0.8f) / 0.2f); return x < 0 ? -y : y; }
  void handleMidi(const juce::MidiMessage& m) {
    if (m.isNoteOn()) { if (sustain) held.reset(m.getNoteNumber()); engine->noteOn(m.getNoteNumber(), m.getFloatVelocity()); down.set(m.getNoteNumber()); }
    else if (m.isNoteOff()) { int k = m.getNoteNumber(); down.reset(k); if (sustain) held.set(k); else engine->noteOff(k); }
    else if (m.isPitchWheel()) engine->pitchBend((m.getPitchWheelValue() - 8192) / 8192.0);
    else if (m.isChannelPressure()) engine->pressure(m.getChannelPressureValue() / 127.0);
    else if (m.isAftertouch()) engine->pressure(m.getAfterTouchValue() / 127.0);
    else if (m.isController()) {
      int c = m.getControllerNumber(), v = m.getControllerValue();
      if (c == 1) engine->modWheel(v / 127.0);
      else if (c == 64) { bool on = v >= 64; if (sustain && !on) { for (int k = 0; k < 128; ++k) if (held.test(k)) { engine->noteOff(k); } held.reset(); } sustain = on; }
      else if (c == 123 || c == 120) { engine->allNotesOff(); held.reset(); down.reset(); }
    }
    else if (m.isAllNotesOff() || m.isAllSoundOff()) { engine->allNotesOff(); held.reset(); down.reset(); }
  }
  void renderRange(float* L, float* R, int n) {
    if (factor == 1) { engine->process(L, R, n); return; }
    while (n > 0) {   // render at the higher rate, then filter down
      const int c = std::min(n, 2048); juce::dsp::AudioBlock<float> zero(zeroBuf); auto sub = zero.getSubBlock(0, (size_t)c);
      auto up = os->processSamplesUp(sub); const int hn = (int)up.getNumSamples();
      engine->process(up.getChannelPointer(0), up.getChannelPointer(1), hn);
      float* ch[2] = {L, R}; juce::dsp::AudioBlock<float> out(ch, 2, (size_t)c); os->processSamplesDown(out);
      L += c; R += c; n -= c;
    }
  }
  void pushParams() {
    const int n = (int)info.specs.size(); const bool force = forceAll.exchange(false);
    const int q = (int)std::lround(qualityPtr->load());
    if (q != quality) { quality = q; triggerAsyncUpdate(); }
    // the Preset (id 0) first, so values the preset writes can be overridden by the rest in the same block when restoring a saved state
    bool presetChanged = false; double pv = ptrs[0]->load();
    if (force || pv != sent[0]) { engine->set(0, pv); sent[0] = pv; presetChanged = true; }
    for (int i = 1; i < n; ++i) {
      double x = ptrs[i]->load();
      if (force || (presetChanged && suppressWrites.load() > 0) || x != sent[i]) { engine->set(i, x); sent[i] = x; }
    }
  }
  void drainWrites() {
    if (engine->writes.empty()) return;
    if (suppressWrites.load() > 0) { engine->writes.clear(); suppressWrites.fetch_sub(1); return; }
    for (auto& w : engine->writes) { int s = wr.load(); if (((s + 1) & 255) != rd.load()) { fifo[s] = w; wr.store((s + 1) & 255); } sent[w.first] = w.second; }
    engine->writes.clear(); triggerAsyncUpdate();
  }
  void handleAsyncUpdate() override {
    if (quality != factorQuality) { rebuild(false); }
    while (rd.load() != wr.load()) {
      auto w = fifo[rd.load()]; rd.store((rd.load() + 1) & 255);
      if (auto* p = apvts.getParameter(pid(w.first))) p->setValueNotifyingHost(p->convertTo0to1((float)w.second));
    }
  }
  void rebuild(bool initial) {
    int q = (int)std::lround(qualityPtr->load()); factorQuality = quality = q; int f = q == 0 ? 1 : (q == 1 ? 2 : 4);
    auto e = info.make(hostRate * f); std::unique_ptr<juce::dsp::Oversampling<float>> o; juce::AudioBuffer<float> zb;
    if (f > 1) { o.reset(new juce::dsp::Oversampling<float>(2, f == 2 ? 1 : 2, juce::dsp::Oversampling<float>::filterHalfBandPolyphaseIIR, true, true)); o->initProcessing((size_t)std::max(maxBlock, 4096)); zb.setSize(2, std::max(maxBlock, 4096)); zb.clear(); }
    for (size_t i = 1; i < info.specs.size(); ++i) e->set((int)i, ptrs[i]->load()); e->set(0, ptrs[0]->load());
    for (size_t i = 1; i < info.specs.size(); ++i) e->set((int)i, ptrs[i]->load());
    e->writes.clear();
    { juce::SpinLock::ScopedLockType lk(engineLock); engine = std::move(e); os = std::move(o); zeroBuf = std::move(zb); factor = f; sent.assign(info.specs.size(), std::numeric_limits<double>::quiet_NaN());
      for (size_t i = 0; i < info.specs.size(); ++i) sent[i] = ptrs[i]->load(); held.reset(); down.reset(); sustain = false; }
    setLatencySamples(os ? (int)std::lround(os->getLatencyInSamples()) : 0);
    (void)initial;
  }

  std::unique_ptr<occ::EngineBase> engine; std::unique_ptr<juce::dsp::Oversampling<float>> os; juce::AudioBuffer<float> zeroBuf; juce::SpinLock engineLock;
  std::vector<std::atomic<float>*> ptrs; std::atomic<float>* qualityPtr = nullptr; std::vector<double> sent;
  double hostRate = 48000; int maxBlock = 512, factor = 1, quality = 1, factorQuality = 1; bool sustain = false; std::bitset<128> held, down;
  std::atomic<bool> forceAll{false}; std::atomic<int> suppressWrites{0};
  std::array<std::pair<int, double>, 256> fifo; std::atomic<int> rd{0}, wr{0};
};
