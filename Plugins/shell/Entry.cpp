#include "Editor.h"
#ifndef OCC_ID
#error OCC_ID must name the instrument
#endif
static const occ::Info& chosen() {
  static const std::vector<occ::Info> all = occ::allInstruments();
  for (auto& i : all) if (std::string(i.id) == OCC_ID) return i;
  jassertfalse; return all.front();
}
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new OccProcessor(chosen()); }
