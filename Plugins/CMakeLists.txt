cmake_minimum_required(VERSION 3.22)
project(OccultiaPlugins VERSION 1.0.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")   # no Visual C++ redistributable needed on the target PC
include(FetchContent)
FetchContent_Declare(JUCE GIT_REPOSITORY https://github.com/juce-framework/JUCE.git GIT_TAG 8.0.4 GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(JUCE)

# One plugin per instrument. Add a line here when an instrument is ported (and add its header to engines/all.h).
function(occ_plugin id Name Code)
  juce_add_plugin(${id}
    PRODUCT_NAME "${Name}"
    COMPANY_NAME "Occultica"
    PLUGIN_MANUFACTURER_CODE Occt
    PLUGIN_CODE ${Code}
    FORMATS VST3 Standalone
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    VST3_CATEGORIES Instrument Synth
    COPY_PLUGIN_AFTER_BUILD FALSE)
  target_sources(${id} PRIVATE shell/Entry.cpp)
  target_compile_definitions(${id} PRIVATE OCC_ID="${id}" JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_VST3_CAN_REPLACE_VST2=0 JUCE_DISPLAY_SPLASH_SCREEN=0 JUCE_REPORT_APP_USAGE=0)
  target_link_libraries(${id} PRIVATE juce::juce_audio_utils juce::juce_dsp juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)
  if(MSVC)
    target_compile_options(${id} PRIVATE /O2)
  else()
    target_compile_options(${id} PRIVATE -O2)
  endif()
endfunction()

occ_plugin(minica   Minica   Mnca)
occ_plugin(rhodica  Rhodica  Rhdc)
