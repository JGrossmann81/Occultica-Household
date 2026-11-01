// Renders every instrument's editor to a PNG (no screen needed) so the artwork can be checked by eye. Also plays a few notes through the processor as a smoke test.
#include "../shell/Editor.h"
#include <cstdio>
int main(int argc, char** argv) {
  juce::ScopedJuceInitialiser_GUI gui; const juce::File outDir = juce::File::getCurrentWorkingDirectory().getChildFile(argc > 1 ? argv[1] : "snapshots"); outDir.createDirectory();
  auto all = occ::allInstruments(); int bad = 0;
  for (auto& inf : all) {
    OccProcessor proc(inf); proc.setPlayConfigDetails(0, 2, 48000, 512); proc.prepareToPlay(48000, 512);
    juce::AudioBuffer<float> buf(2, 512); juce::MidiBuffer mb; float peak = 0;
    for (int b = 0; b < 160; ++b) {
      mb.clear(); if (b == 0) { mb.addEvent(juce::MidiMessage::noteOn(1, 60, 0.8f), 0); mb.addEvent(juce::MidiMessage::noteOn(1, 64, 0.8f), 100); mb.addEvent(juce::MidiMessage::noteOn(1, 67, 0.8f), 200); }
      if (b == 100) mb.addEvent(juce::MidiMessage::noteOff(1, 60), 10);
      proc.processBlock(buf, mb); peak = std::max(peak, buf.getMagnitude(0, 512));
    }
    std::printf("%s: peak %.3f\n", inf.id, peak); if (!(peak > 0.01f) || !(peak < 1.5f)) { std::printf("  BAD LEVEL\n"); bad = 1; }
    for (int q = 0; q < 3; ++q) {   // switching sound quality must keep working
      proc.apvts.getParameter("quality")->setValueNotifyingHost(q / 2.f); juce::MessageManager::getInstance()->runDispatchLoopUntil(60);
      for (int b = 0; b < 40; ++b) { mb.clear(); if (b == 0) mb.addEvent(juce::MidiMessage::noteOn(1, 62, 0.7f), 0); proc.processBlock(buf, mb); }
      std::printf("  quality %d peak %.3f\n", q, buf.getMagnitude(0, 512));
    }
    std::unique_ptr<juce::AudioProcessorEditor> ed(proc.createEditor()); ed->setVisible(true);
    for (int b = 0; b < 3; ++b) { mb.clear(); mb.addEvent(juce::MidiMessage::noteOn(1, 60 + b * 4, 0.9f), 0); proc.processBlock(buf, mb); }
    proc.keyState.noteOn(1, 64, 0.8f);
    juce::MessageManager::getInstance()->runDispatchLoopUntil(300);
    juce::Image img = ed->createComponentSnapshot(ed->getLocalBounds(), true, 1.0f);
    juce::File f = outDir.getChildFile(juce::String(inf.id) + ".png"); juce::FileOutputStream os(f); os.setPosition(0); os.truncate(); juce::PNGImageFormat().writeImageToStream(img, os);
    std::printf("  wrote %s (%dx%d)\n", f.getFullPathName().toRawUTF8(), img.getWidth(), img.getHeight());
  }
  return bad;
}
