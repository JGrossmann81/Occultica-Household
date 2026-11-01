// Percussica: modal percussion, 49 instruments (tuned bars and bells, skin drums, hand percussion, cymbals and gongs, plus two kits). Every sound is a bank of resonators struck by a mallet pulse and/or noise bursts.
#pragma once
#include "../common/engine.h"
namespace occ { namespace percussica {
enum { Preset, Volume, Articulation, Layers, Spread, Strike, Position, Damping, Size, Resonance, Noise, Snare, Bend, BendTime, Motor, MotorRate, Rub, Roll, RollRate, Flam, Humanize,
       VelCurve, ModWheel, BendRange, Release, Choke, Bright, Body, Scale, Tonic, Tune, Octave, ReverbMix, ReverbSize, Count };
static const int KA = 47, KB = 48, kHits = 48, kModes = 28;
inline double jround(double x) { return std::floor(x + 0.5); }
inline std::vector<std::string> names() {
  return {"Marimba", "Xylophone", "Vibraphone", "Glockenspiel", "Tubular bells", "Kalimba", "Steel pan", "Gender", "Saron", "Bonang", "Handbell", "Crotales",
          "Timpani", "Taiko", "Tom", "Djembe", "Conga", "Bongo", "Tabla", "Bayan", "Frame drum", "Dhol", "Cajon", "Darbuka", "Talking drum",
          "Kick", "Snare", "Side stick", "Clap", "Hi-hat closed", "Hi-hat open", "Hi-hat pedal", "Crash", "Ride", "China", "Cowbell", "Tambourine", "Shaker", "Claves", "Woodblock", "Triangle", "Cabasa", "Guiro", "Gong", "Singing bowl",
          "Wind chimes", "Splash", "Drum kit", "World kit"};
}
inline std::vector<Spec> makeSpecs() {
  std::vector<std::string> scales = {"12-tone equal", "Just (Shuddha)", "Raga Bhairav", "Raga Yaman", "Raga Todi", "Raga Kafi", "Pythagorean", "Chinese pentatonic", "Japanese In", "Maqam Rast", "Maqam Bayati", "Maqam Hijaz", "Slendro-ish", "Mongolian pentatonic"};
  return {
    P("Preset", "", 0, 48, 0, "%.0f", false, names()),
    P("Volume", "dB", -24, 12, 0, "%.1f dB"), P("Articulation", "", 0, 4, 0, "%.0f", false, {"Open", "Edge / slap", "Muted", "Rim / ping", "Brush"}), P("Layers", "", 0, 2, 0, "%.0f", false, {"Single", "Pair", "Ensemble 4"}),
    P("Spread", "%", 0, 100, 35, "%.0f %%"), P("Strike", "%", 0, 100, 45, "%.0f %%"), P("Position", "%", 0, 100, 50, "%.0f %%"), P("Damping", "%", 0, 100, 50, "%.0f %%"),
    P("Size", "%", -100, 100, 0, "%.0f %%"), P("Resonance", "%", 0, 100, 60, "%.0f %%"), P("Stick noise", "%", 0, 100, 14, "%.0f %%"), P("Snare wires", "%", 0, 100, 0, "%.0f %%"),
    P("Pitch bend", "cents", -1200, 2400, 0, "%.0f c"), P("Bend time", "ms", 5, 600, 80, "%.0f ms", true), P("Motor depth", "%", 0, 100, 0, "%.0f %%"), P("Motor rate", "Hz", 0.5, 12, 5, "%.1f Hz"),
    P("Rub", "%", 0, 100, 0, "%.0f %%"), P("Roll", "", 0, 1, 0, "%.0f", false, {"Off", "Roll on hold"}), P("Roll rate", "Hz", 4, 40, 16, "%.0f Hz"), P("Flam", "ms", 0, 60, 0, "%.0f ms"),
    P("Humanize", "%", 0, 100, 30, "%.0f %%"), P("Velocity", "", 0, 2, 1, "%.0f", false, {"Soft", "Linear", "Hard"}), P("Mod wheel", "", 0, 3, 0, "%.0f", false, {"Damping", "Position", "Strike", "Pitch bend"}),
    P("Bend range", "st", 1, 12, 2, "%.0f st"), P("Release", "ms", 10, 4000, 220, "%.0f ms", true), P("Choke", "", 0, 1, 1, "%.0f", false, {"Off", "Hi-hat groups"}),
    P("Brightness", "%", 0, 100, 60, "%.0f %%"), P("Body", "%", 0, 100, 50, "%.0f %%"),
    P("Scale", "", 0, 13, 0, "%.0f", false, scales), P("Tonic", "", 0, 11, 0, "%.0f", false, {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}),
    P("Tune", "cents", -50, 50, 0, "%.0f c"), P("Octave", "", -2, 2, 0, "%.0f"), P("Reverb mix", "%", 0, 100, 18, "%.0f %%"), P("Reverb size", "%", 0, 100, 45, "%.0f %%"),
  };
}
inline std::vector<Group> makeGroups() {
  return {{"Strike", {Articulation, Strike, Position, Damping, Size, Resonance, Noise, Snare}},
          {"Player", {Layers, Spread, Humanize, VelCurve, Flam, Roll, RollRate, Choke}},
          {"Pitch and motion", {Bend, BendTime, BendRange, Motor, MotorRate, Rub, ModWheel}},
          {"Tuning", {Scale, Tonic, Tune, Octave}},
          {"Output", {Volume, Release, Bright, Body, ReverbMix, ReverbSize}}};
}
// scale offsets in cents per pitch class
inline const double (*scaleOff())[12] {
  static const double JI[12] = {0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, 17.6, -11.7};
  static double T[14][12]; static bool init = false;
  if (!init) {
    static const double other[14][12] = {
      {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, {0}, {0}, {0}, {0}, {0},
      {0, -9.8, 3.9, -5.9, 7.8, -2.0, 11.7, 2.0, -7.8, 5.9, -3.9, 9.8}, {0, 0, 3.9, 0, 7.8, 0, 0, 2.0, 0, 5.9, 0, 0}, {0, 0, 0, 0, 0, 0, 0, 2.0, 0, 0, 0, 0},
      {0, 0, 0, 50, 0, 0, 0, 0, 0, 0, 50, 0}, {0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}, {0, 0, 40, 0, 0, -20, 0, 20, 0, 0, -40, 0}, {0, 0, 3.9, 0, -13.7, 0, 0, 2.0, 0, -15.6, 0, 0}};
    for (int i = 0; i < 14; ++i) for (int k = 0; k < 12; ++k) T[i][k] = (i >= 1 && i <= 5) ? JI[k] : other[i][k];
    init = true;
  }
  return T;
}
struct Inst {
  std::string name; int kind = 0; bool pitched = false; double f0 = 440, baseNote = 60, track = 0; int nm = 0; double r[12] = {0}, a[12] = {0}, t0 = 1, dexp = 0.8, beat = 0, shell = 0, pulseAmp = 1; double nb = 0, sp = 0, atk = 3, dec = 80, nzAmp = 0,
    strike = 50, pos = 50, damp = 50, res = 40, noise = 15, snare = 0, bend = 0, bendMs = 80, motor = 0, rel = 800; int choke = 0; double pan = 0.5, gain = 1, hp = 40, lp = 16000; int gen = 0; double gLo = 0, gHi = 0, gPw = 1, gSeed = 1;
};
inline void A(std::vector<Inst>& T, const char* name, void (*f)(Inst&), const std::vector<double>& r = {}, const std::vector<double>& a = {}) {
  Inst d; d.name = name; f(d);
  if (!r.empty()) { d.nm = (int)std::min<size_t>(12, r.size()); for (int i = 0; i < d.nm; ++i) d.r[i] = r[i]; int i = 0; for (; i < (int)std::min<size_t>(12, a.size()); ++i) d.a[i] = a[i]; for (; i < d.nm; ++i) d.a[i] = d.a[i - 1] * 0.6; }
  T.push_back(d);
}
inline const std::vector<Inst>& table() {
  static std::vector<Inst> T;
  if (T.empty()) {
  A(T,"Marimba",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=2.0; d.dexp=0.9; d.strike=45; d.res=60; d.damp=50; d.rel=220; d.noise=14; d.shell=0.5; d.pan=0.5; d.gain=1.1; d.hp=50; d.lp=9000; }, {1, 4.0, 9.9, 16.5}, {1, 0.42, 0.16, 0.06});
  A(T,"Xylophone",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=0.9; d.dexp=0.9; d.strike=75; d.res=35; d.rel=150; d.noise=20; d.gain=1.0; d.hp=120; d.lp=14000; }, {1, 3.0, 6.2, 10.4}, {1, 0.55, 0.28, 0.12});
  A(T,"Vibraphone",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=5.5; d.dexp=0.55; d.strike=40; d.res=55; d.rel=600; d.noise=10; d.motor=55; d.gain=1.05; d.hp=80; d.lp=11000; }, {1, 3.99, 9.6}, {1, 0.35, 0.10});
  A(T,"Glockenspiel",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=3.0; d.dexp=0.5; d.strike=80; d.rel=400; d.noise=18; d.hp=400; d.lp=16000; d.gain=0.9; }, {1, 2.76, 5.40, 8.93}, {1, 0.5, 0.3, 0.15});
  A(T,"Tubular bells",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=7.0; d.dexp=0.45; d.strike=70; d.rel=1500; d.noise=12; d.hp=100; d.lp=12000; d.gain=0.9; }, {1, 2.02, 3.12, 4.31, 5.9, 7.6}, {1, 0.7, 0.55, 0.4, 0.25, 0.12});
  A(T,"Kalimba",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=1.6; d.dexp=0.6; d.strike=55; d.res=60; d.rel=600; d.noise=10; d.shell=0.4; d.hp=150; d.lp=9000; d.gain=1.2; }, {1, 6.27, 17.5}, {1, 0.20, 0.04});
  A(T,"Steel pan",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=1.9; d.dexp=0.6; d.strike=55; d.rel=800; d.noise=12; d.hp=150; d.lp=8000; d.gain=0.95; }, {1, 1.004, 2.0, 2.007, 3.0, 4.012, 5.1}, {1, 0.7, 0.6, 0.4, 0.35, 0.2, 0.1});
  A(T,"Gender",[](Inst& d){ d.kind=0; d.pitched=true; d.beat=5.5; d.t0=4.0; d.dexp=0.55; d.strike=35; d.res=60; d.rel=500; d.noise=8; d.hp=100; d.lp=7000; d.gain=1.0; }, {1, 2.4, 5.6}, {1, 0.45, 0.18});
  A(T,"Saron",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=1.4; d.dexp=0.7; d.strike=60; d.rel=250; d.noise=16; d.hp=150; d.lp=9000; d.gain=1.0; }, {1, 2.76, 5.4, 8.9}, {1, 0.4, 0.2, 0.1});
  A(T,"Bonang",[](Inst& d){ d.kind=0; d.pitched=true; d.beat=3.0; d.t0=2.6; d.dexp=0.6; d.strike=50; d.rel=700; d.noise=10; d.hp=150; d.lp=8000; d.gain=1.0; }, {1, 1.42, 2.2, 2.9, 3.6}, {1, 0.6, 0.4, 0.25, 0.15});
  A(T,"Handbell",[](Inst& d){ d.kind=0; d.pitched=true; d.beat=1.2; d.t0=3.5; d.dexp=0.5; d.strike=65; d.rel=1200; d.noise=10; d.hp=300; d.lp=14000; d.gain=0.9; }, {1, 2.0, 2.4, 3.0, 4.1}, {1, 0.6, 0.4, 0.3, 0.15});
  A(T,"Crotales",[](Inst& d){ d.kind=0; d.pitched=true; d.t0=6.0; d.dexp=0.4; d.strike=85; d.rel=1500; d.noise=12; d.hp=800; d.lp=18000; d.gain=0.75; }, {1, 2.76, 5.4, 8.9}, {1, 0.5, 0.3, 0.15});
  A(T,"Timpani",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=2.8; d.dexp=0.7; d.shell=0.3; d.strike=40; d.res=50; d.bend=60; d.bendMs=120; d.rel=2500; d.noise=10; d.hp=30; d.lp=7000; d.gain=1.3; }, {1, 1.5, 1.99, 2.44, 2.89}, {1, 0.7, 0.45, 0.3, 0.15});
  A(T,"Taiko",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=1.5; d.dexp=0.85; d.shell=0.7; d.strike=55; d.pos=55; d.res=60; d.bend=-60; d.bendMs=90; d.rel=1500; d.noise=22; d.hp=28; d.lp=6500; d.gain=1.4; });
  A(T,"Tom",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=1.0; d.dexp=0.9; d.shell=0.5; d.strike=55; d.res=55; d.bend=160; d.bendMs=60; d.rel=1200; d.noise=24; d.hp=40; d.lp=9000; d.gain=1.3; });
  A(T,"Djembe",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.55; d.dexp=1.0; d.shell=0.8; d.strike=60; d.pos=45; d.res=55; d.bend=80; d.bendMs=50; d.rel=600; d.noise=30; d.hp=40; d.lp=9000; d.gain=1.3; });
  A(T,"Conga",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.7; d.dexp=1.0; d.shell=0.6; d.strike=55; d.pos=40; d.res=55; d.bend=60; d.bendMs=45; d.rel=700; d.noise=26; d.hp=60; d.lp=8500; d.gain=1.2; });
  A(T,"Bongo",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.28; d.dexp=1.0; d.shell=0.2; d.strike=70; d.pos=35; d.res=40; d.bend=40; d.bendMs=30; d.rel=300; d.noise=30; d.hp=120; d.lp=11000; d.gain=1.1; });
  A(T,"Tabla",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=1.1; d.dexp=0.5; d.shell=0.0; d.strike=65; d.pos=25; d.res=30; d.bend=0; d.rel=700; d.noise=20; d.hp=100; d.lp=11000; d.gain=1.1; }, {1, 2.0, 3.0, 4.0, 5.0, 6.0}, {1, 0.7, 0.5, 0.3, 0.2, 0.1});
  A(T,"Bayan",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=1.0; d.dexp=0.9; d.shell=0.6; d.strike=40; d.pos=60; d.res=60; d.bend=-350; d.bendMs=260; d.rel=1200; d.noise=16; d.hp=40; d.lp=6000; d.gain=1.3; });
  A(T,"Frame drum",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.9; d.dexp=0.8; d.shell=0.2; d.strike=45; d.pos=45; d.res=40; d.bend=30; d.bendMs=60; d.rel=900; d.noise=22; d.hp=60; d.lp=8000; d.gain=1.1; });
  A(T,"Dhol",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.9; d.dexp=0.9; d.shell=0.6; d.strike=60; d.pos=55; d.res=55; d.bend=90; d.bendMs=55; d.rel=800; d.noise=28; d.snare=12; d.hp=40; d.lp=9500; d.gain=1.3; });
  A(T,"Cajon",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.28; d.dexp=1.0; d.shell=0.9; d.strike=60; d.pos=50; d.res=65; d.bend=30; d.bendMs=30; d.rel=300; d.noise=38; d.snare=18; d.hp=45; d.lp=9000; d.gain=1.4; }, {1, 1.9, 2.7, 3.9, 5.2}, {1, 0.6, 0.4, 0.25, 0.12});
  A(T,"Darbuka",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.55; d.dexp=1.0; d.shell=0.45; d.strike=62; d.pos=40; d.res=50; d.bend=70; d.bendMs=40; d.rel=500; d.noise=26; d.hp=70; d.lp=11000; d.gain=1.15; });
  A(T,"Talking drum",[](Inst& d){ d.kind=1; d.pitched=true; d.t0=0.9; d.dexp=0.6; d.shell=0.3; d.strike=45; d.res=40; d.bend=0; d.rel=900; d.noise=14; d.hp=60; d.lp=7000; d.gain=1.2; }, {1, 2.0, 3.0, 4.0}, {1, 0.5, 0.3, 0.15});
  A(T,"Kick",[](Inst& d){ d.kind=1; d.pitched=false; d.f0=58; d.baseNote=36; d.track=0.15; d.t0=0.45; d.dexp=1.1; d.shell=0.9; d.strike=45; d.pos=70; d.res=70; d.bend=700; d.bendMs=38; d.rel=600; d.noise=38; d.hp=25; d.lp=8000; d.gain=1.6; d.pan=0.5; });
  A(T,"Snare",[](Inst& d){ d.kind=1; d.pitched=false; d.f0=190; d.baseNote=38; d.track=0.1; d.t0=0.22; d.dexp=1.0; d.shell=0.4; d.strike=62; d.pos=55; d.res=40; d.bend=120; d.bendMs=24; d.rel=400; d.noise=36; d.snare=62; d.hp=70; d.lp=14000; d.gain=1.3; d.pan=0.48; });
  A(T,"Side stick",[](Inst& d){ d.kind=0; d.pitched=false; d.f0=1700; d.baseNote=37; d.track=0.1; d.t0=0.06; d.dexp=0.7; d.strike=90; d.rel=100; d.noise=55; d.hp=400; d.lp=12000; d.gain=1.1; }, {1, 1.9, 3.3}, {1, 0.7, 0.4});
  A(T,"Clap",[](Inst& d){ d.kind=3; d.pitched=false; d.f0=1200; d.baseNote=39; d.track=0.05; d.t0=0.03; d.dexp=0.2; d.pulseAmp=0; d.nb=4; d.sp=9; d.atk=0.5; d.dec=130; d.nzAmp=1.8; d.rel=200; d.hp=400; d.lp=9000; d.gain=1.0; }, {1, 2.0, 3.2}, {1, 0.7, 0.4});
  A(T,"Hi-hat closed",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=42; d.track=0.0; d.gen=1; d.nm=20; d.gLo=3200; d.gHi=12500; d.gPw=1.2; d.gSeed=3; d.t0=0.07; d.dexp=0.3; d.strike=75; d.nb=1; d.atk=1; d.dec=35; d.nzAmp=0.5; d.choke=1; d.rel=60; d.noise=8; d.hp=600; d.lp=18000; d.gain=0.8; d.pan=0.62; });
  A(T,"Hi-hat open",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=46; d.track=0.0; d.gen=1; d.nm=22; d.gLo=3000; d.gHi=12500; d.gPw=1.2; d.gSeed=3; d.t0=0.9; d.dexp=0.35; d.strike=70; d.nb=1; d.atk=3; d.dec=220; d.nzAmp=0.55; d.choke=1; d.rel=120; d.noise=8; d.hp=600; d.lp=18000; d.gain=0.75; d.pan=0.62; });
  A(T,"Hi-hat pedal",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=44; d.track=0.0; d.gen=1; d.nm=16; d.gLo=2600; d.gHi=11000; d.gPw=1.2; d.gSeed=3; d.t0=0.05; d.dexp=0.3; d.strike=40; d.nb=1; d.atk=1; d.dec=22; d.nzAmp=0.3; d.choke=1; d.rel=40; d.noise=4; d.hp=500; d.lp=12000; d.gain=0.7; d.pan=0.62; });
  A(T,"Crash",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=49; d.track=0.0; d.gen=1; d.nm=26; d.gLo=350; d.gHi=12000; d.gPw=1.3; d.gSeed=7; d.t0=2.6; d.dexp=0.4; d.strike=70; d.nb=1; d.atk=12; d.dec=380; d.nzAmp=0.7; d.rel=1500; d.noise=10; d.hp=300; d.lp=18000; d.gain=0.7; d.pan=0.3; });
  A(T,"Ride",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=51; d.track=0.0; d.gen=1; d.nm=24; d.gLo=500; d.gHi=11000; d.gPw=1.4; d.gSeed=11; d.t0=3.2; d.dexp=0.35; d.strike=60; d.nb=1; d.atk=18; d.dec=200; d.nzAmp=0.35; d.rel=2000; d.noise=10; d.hp=350; d.lp=16000; d.gain=0.65; d.pan=0.72; });
  A(T,"China",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=52; d.track=0.0; d.gen=1; d.nm=24; d.gLo=260; d.gHi=9500; d.gPw=1.0; d.gSeed=19; d.t0=1.6; d.dexp=0.3; d.strike=80; d.nb=1; d.atk=6; d.dec=300; d.nzAmp=1.1; d.rel=1000; d.noise=14; d.hp=250; d.lp=16000; d.gain=0.7; d.pan=0.78; });
  A(T,"Cowbell",[](Inst& d){ d.kind=0; d.pitched=false; d.f0=560; d.baseNote=56; d.track=0.2; d.t0=0.4; d.dexp=0.3; d.strike=80; d.rel=250; d.noise=20; d.hp=300; d.lp=7000; d.gain=1.0; }, {1, 1.504, 2.74}, {1, 0.9, 0.25});
  A(T,"Tambourine",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=54; d.track=0.0; d.gen=1; d.nm=12; d.gLo=4200; d.gHi=10500; d.gPw=1.0; d.gSeed=23; d.t0=0.32; d.dexp=0.2; d.strike=60; d.nb=3; d.sp=11; d.atk=1; d.dec=60; d.nzAmp=0.9; d.rel=300; d.noise=8; d.hp=1000; d.lp=17000; d.gain=0.8; });
  A(T,"Shaker",[](Inst& d){ d.kind=3; d.pitched=false; d.f0=5200; d.baseNote=70; d.track=0.0; d.t0=0.012; d.dexp=0.1; d.pulseAmp=0; d.nb=2; d.sp=62; d.atk=12; d.dec=55; d.nzAmp=3.0; d.rel=100; d.hp=1800; d.lp=14000; d.gain=1.0; }, {1, 1.5}, {1, 0.6});
  A(T,"Claves",[](Inst& d){ d.kind=0; d.pitched=false; d.f0=2400; d.baseNote=75; d.track=0.2; d.t0=0.09; d.dexp=0.5; d.strike=85; d.rel=100; d.noise=20; d.hp=600; d.lp=9000; d.gain=1.1; }, {1, 2.3}, {1, 0.3});
  A(T,"Woodblock",[](Inst& d){ d.kind=0; d.pitched=false; d.f0=1050; d.baseNote=76; d.track=0.3; d.t0=0.13; d.dexp=0.6; d.strike=80; d.rel=150; d.noise=24; d.hp=300; d.lp=7000; d.gain=1.1; }, {1, 2.4, 4.6}, {1, 0.5, 0.2});
  A(T,"Triangle",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=81; d.track=0.0; d.gen=1; d.nm=9; d.gLo=3300; d.gHi=13500; d.gPw=0.9; d.gSeed=29; d.t0=3.8; d.dexp=0.25; d.strike=85; d.rel=1500; d.noise=8; d.hp=1500; d.lp=19000; d.gain=1.5; });
  A(T,"Cabasa",[](Inst& d){ d.kind=3; d.pitched=false; d.f0=4200; d.baseNote=69; d.track=0.0; d.t0=0.01; d.dexp=0.1; d.pulseAmp=0; d.nb=5; d.sp=15; d.atk=3; d.dec=24; d.nzAmp=2.6; d.rel=100; d.hp=1800; d.lp=14000; d.gain=1.0; }, {1, 1.7}, {1, 0.7});
  A(T,"Guiro",[](Inst& d){ d.kind=3; d.pitched=false; d.f0=2300; d.baseNote=73; d.track=0.0; d.t0=0.008; d.dexp=0.1; d.pulseAmp=0; d.nb=9; d.sp=17; d.atk=0.8; d.dec=9; d.nzAmp=3.2; d.rel=100; d.hp=900; d.lp=11000; d.gain=1.0; }, {1, 1.55, 2.4}, {1, 0.8, 0.5});
  A(T,"Gong",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=48; d.track=0.0; d.gen=1; d.nm=24; d.gLo=85; d.gHi=4200; d.gPw=1.5; d.gSeed=31; d.t0=7.5; d.dexp=0.6; d.strike=35; d.nb=1; d.atk=220; d.dec=700; d.nzAmp=0.5; d.rel=3000; d.noise=6; d.hp=30; d.lp=9000; d.gain=1.2; });
  A(T,"Singing bowl",[](Inst& d){ d.kind=0; d.pitched=true; d.beat=0.7; d.t0=9.0; d.dexp=0.35; d.strike=25; d.rel=3500; d.noise=4; d.hp=150; d.lp=9000; d.gain=0.9; }, {1, 2.71, 5.15, 8.4}, {1, 0.5, 0.25, 0.1});
  A(T,"Wind chimes",[](Inst& d){ d.kind=0; d.pitched=false; d.f0=2100; d.baseNote=84; d.track=0.6; d.t0=3.0; d.dexp=0.4; d.strike=80; d.rel=1500; d.noise=6; d.hp=800; d.lp=16000; d.gain=0.7; }, {1, 2.76, 5.4}, {1, 0.4, 0.15});
  A(T,"Splash",[](Inst& d){ d.kind=2; d.pitched=false; d.f0=1; d.baseNote=55; d.track=0.0; d.gen=1; d.nm=20; d.gLo=900; d.gHi=13500; d.gPw=1.2; d.gSeed=37; d.t0=0.9; d.dexp=0.35; d.strike=78; d.nb=1; d.atk=5; d.dec=150; d.nzAmp=0.6; d.rel=800; d.noise=10; d.hp=600; d.lp=18000; d.gain=0.7; d.pan=0.7; });
  A(T,"Drum kit",[](Inst& d){ d.kind=1; d.pitched=false; d.f0=100; d.baseNote=36; });
  A(T,"World kit",[](Inst& d){ d.kind=1; d.pitched=false; d.f0=100; d.baseNote=36; });
  }
  return T;
}
inline const Inst& inst(double i) { return table()[(int)clampd(i, 0, 48)]; }
inline int idxOf(const char* nm) { const auto& T = table(); for (size_t i = 0; i < T.size(); ++i) if (T[i].name == nm) return (int)i; return -1; }
inline double hashf(uint32_t x, uint32_t y) { uint32_t h = x * 374761393u + y * 668265263u; h = (h ^ (h >> 13)) * 1274126177u; h = h ^ (h >> 16); return double(h & 0xFFFFFFu) / 16777215.0; }
static const double MEM[10] = {1, 1.593, 2.136, 2.296, 2.653, 2.918, 3.156, 3.500, 3.600, 3.652}, MEMA[10] = {1, 0.6, 0.45, 0.35, 0.3, 0.22, 0.18, 0.14, 0.1, 0.08};
static const int MEMM[10] = {0, 1, 2, 0, 3, 1, 4, 2, 0, 5};
static const int TOMS[6] = {41, 43, 45, 47, 48, 50};

struct Rng { uint32_t s; explicit Rng(uint32_t x = 1) : s(x) {} double uni() { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return double(s >> 8) * (1.0 / 16777216.0); } double bi() { return uni() * 2 - 1; } };
struct Bq {
  double b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
  void set(int t, double f, double q, double gdb, double sr) {  // types: 1 LowShelf, 4 HighPass
    f = clampd(f, 5, sr * 0.49); q = std::max(0.05, q); const double A = std::pow(10.0, gdb / 40), w = 2 * kPi * f / sr, cw = std::cos(w), sw = std::sin(w), al = sw / (2 * q); double B0, B1, B2, A0, A1, A2;
    if (t == 1) { const double s = 2 * std::sqrt(A) * al; B0 = A * ((A + 1) - (A - 1) * cw + s); B1 = 2 * A * ((A - 1) - (A + 1) * cw); B2 = A * ((A + 1) - (A - 1) * cw - s); A0 = (A + 1) + (A - 1) * cw + s; A1 = -2 * ((A - 1) + (A + 1) * cw); A2 = (A + 1) + (A - 1) * cw - s; }
    else { B0 = (1 + cw) / 2; B1 = -(1 + cw); B2 = B0; A0 = 1 + al; A1 = -2 * cw; A2 = 1 - al; }
    b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0;
  }
  double run(double x) { const double y = b0 * x + z1; z1 = b1 * x - a1 * y + z2; z2 = b2 * x - a2 * y; return y; }
};
struct Rev {
  std::vector<float> cb[2][8], ab[2][4]; int ci[2][8] = {{0}}, ai[2][4] = {{0}}; double cz[2][8] = {{0}};
  explicit Rev(double sr) {
    static const int ct[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}, at[4] = {556, 441, 341, 225};
    for (int ch = 0; ch < 2; ++ch) {
      for (int k = 0; k < 8; ++k) cb[ch][k].assign((size_t)std::floor((ct[k] + ch * 23) * sr / 44100) + 1, 0.f);
      for (int k = 0; k < 4; ++k) ab[ch][k].assign((size_t)std::floor((at[k] + ch * 23) * sr / 44100) + 1, 0.f);
    }
  }
  double tick(int ch, double inp, double fb, double damp) {
    double s = 0; const double d1 = 1 - damp; int* ci_ = ci[ch]; double* cz_ = cz[ch];
    for (int k = 0; k < 8; ++k) { std::vector<float>& b = cb[ch][k]; const int i = ci_[k]; const double y = b[i]; cz_[k] = y * d1 + cz_[k] * damp; b[i] = (float)(inp + cz_[k] * fb); ci_[k] = i + 1 >= (int)b.size() ? 0 : i + 1; s += y; }
    int* ai_ = ai[ch];
    for (int k = 0; k < 4; ++k) { std::vector<float>& b = ab[ch][k]; const int i = ai_[k]; const double bo = b[i], y = -s + bo; b[i] = (float)(s + bo * 0.5); ai_[k] = i + 1 >= (int)b.size() ? 0 : i + 1; s = y; }
    return s;
  }
};
struct Hit {
  bool on = false; int nm = 0, inst = 0, note = 0, group = 0; double startDelay = 0; bool held = false, live = false;
  double c1[kModes], c2[kModes], bk[kModes], y1[kModes], y2[kModes], w[kModes], rr[kModes];
  double level = 1, pan = 0.5, pl = 0.7, pr = 0.7, age = 0, maxAge = 4, fade = 1, relK = 1, chokeK = 1, follow = 0, quiet = 0, pw = 40, pn = 0, pulseAmp = 1, eRaw = 0, eSm = 0, decK = 0.999, atkK = 0.1, nzAmp = 0, burstsLeft = 0, nextBurst = 0, spacing = 0,
    stick = 0, snare = 0, snz1 = 0, snz2 = 0, clk = 0, rub = 0, rubLp = 0, bendCents = 0, bendK = 0.999, bendK8 = 1, curBend = 0; long long updC = 0; uint32_t seed = 1;
  Hit() { std::fill_n(c1, kModes, 0.0); std::fill_n(c2, kModes, 0.0); std::fill_n(bk, kModes, 0.0); std::fill_n(y1, kModes, 0.0); std::fill_n(y2, kModes, 0.0); std::fill_n(w, kModes, 0.0); std::fill_n(rr, kModes, 0.0); }
};
struct RollSt { bool on = false; int note = 0; double vel = 0.7, timer = 0; long long n = 0; };
struct Piece { int inst, art, note; double vel; };

struct Engine : EngineBase {
  std::vector<Spec> specs; Rng rng{0x9E3779B9u}; std::vector<Hit> hits; RollSt rolls[6]; Bq eq[2][2]; double lpz[2] = {0, 0}, lpA = 0.5; Rev rev;
  double bend = 0, bendS = 0, mw = 0; bool mwSeen = false; double expS = 1; long long sampleCtr = 0; long long ageCtr = 0; double motorPh = 0, volG = 1; long long nonFinite = 0; double flash = 0;
  double amp_[kModes], fr_[kModes], t60_[kModes];
  explicit Engine(double sr_) : EngineBase(sr_), specs(makeSpecs()), hits(kHits), rev(sr_) { initParams(specs); table(); configure(); }
  void set(int id, double x) override {
    if (id < 0 || id >= Count) return;
    v[id] = x;
    if (id == Preset) {
      const Inst& n = inst(jround(x)); auto put = [&](int i, double val) { v[i] = val; writeParam(i, val); };
      put(Strike, n.strike); put(Position, n.pos); put(Damping, n.damp); put(Resonance, n.res); put(Noise, n.noise); put(Snare, n.snare); put(Bend, n.bend); put(BendTime, n.bendMs); put(Motor, n.motor); put(Release, n.rel);
    }
    configure();
  }
  void pitchBend(double b) override { bend = b; } void modWheel(double m) override { mw = m; mwSeen = true; } void pressure(double) override {}
  void allNotesOff() override { for (auto& r : rolls) r.on = false; for (auto& h : hits) if (h.on) h.relK = 0.9995; }
  void configure() {
    for (int c = 0; c < 2; ++c) { eq[c][0].set(1, 180, 0.7, (v[Body] - 50) * 0.14, sr); eq[c][1].set(4, 28, 0.7, 0, sr); }
    lpA = std::exp(-2 * kPi * std::min(1800 + 17000 * std::pow(v[Bright] / 100, 1.6), sr * 0.45) / sr); volG = std::pow(10.0, v[Volume] / 20);
  }
  double noteHz(int note, double extra) const {
    const int ti = (int)jround(v[Tonic]); const int pc = (((note - ti) % 12) + 12) % 12; const int sc = (int)jround(v[Scale]); const int si = sc < 0 ? 0 : (sc > 13 ? 13 : sc);  // JS would throw for scale index outside 0..13
    return 440 * std::pow(2.0, (note + 12 * v[Octave] - 69 + (v[Tune] + scaleOff()[si][pc] + extra) / 100) / 12);
  }
  Piece pieceFor(int note) const {
    const int cur = (int)jround(v[Preset]);
    auto I = [](const char* nm) { return idxOf(nm); };
    auto pc = [](int inst_, int art, int nt, double vel) { return Piece{inst_, art, nt, vel}; };
    if (cur == KA) {
      switch (note) {
        case 35: case 36: return pc(I("Kick"), -1, note, 1); case 37: return pc(I("Side stick"), -1, note, 1); case 38: return pc(I("Snare"), -1, note, 1); case 40: return pc(I("Snare"), 1, note, 0.9);
        case 39: return pc(I("Clap"), -1, note, 1); case 42: return pc(I("Hi-hat closed"), -1, note, 1); case 44: return pc(I("Hi-hat pedal"), -1, note, 1); case 46: return pc(I("Hi-hat open"), -1, note, 1);
        case 49: case 57: return pc(I("Crash"), -1, note, 1); case 51: case 59: return pc(I("Ride"), -1, note, 1); case 53: return pc(I("Ride"), 3, note, 1); case 52: return pc(I("China"), -1, note, 1);
        case 55: return pc(I("Splash"), -1, note, 1); case 54: return pc(I("Tambourine"), -1, note, 1); case 56: return pc(I("Cowbell"), -1, note, 1); case 69: case 70: return pc(I("Shaker"), -1, note, 1);
        case 75: return pc(I("Claves"), -1, note, 1); case 76: case 77: return pc(I("Woodblock"), -1, note, 1); case 81: case 80: return pc(I("Triangle"), note == 80 ? 2 : -1, note, 1);
      }
      for (int t : TOMS) if (t == note) return pc(I("Tom"), -1, note, 1);
      return pc(-1, -1, note, 1);
    }
    if (cur == KB) {
      switch (note) {
        case 35: case 36: return pc(I("Taiko"), -1, 39, 1); case 37: return pc(I("Frame drum"), 3, 50, 1); case 38: return pc(I("Djembe"), -1, 52, 1); case 40: return pc(I("Djembe"), 1, 57, 1); case 39: return pc(I("Clap"), -1, note, 1);
        case 41: return pc(I("Conga"), -1, 52, 1); case 43: return pc(I("Conga"), -1, 57, 1); case 45: return pc(I("Conga"), 1, 62, 1); case 47: return pc(I("Bongo"), -1, 64, 1); case 48: return pc(I("Bongo"), -1, 69, 1);
        case 50: return pc(I("Darbuka"), -1, 50, 1); case 52: return pc(I("Darbuka"), 1, 62, 1); case 53: return pc(I("Tabla"), -1, 55, 1); case 55: return pc(I("Bayan"), -1, 41, 1); case 54: return pc(I("Tambourine"), -1, note, 1);
        case 56: return pc(I("Cowbell"), -1, note, 1); case 58: return pc(I("Frame drum"), -1, 45, 1); case 60: return pc(I("Dhol"), -1, 43, 1); case 62: return pc(I("Dhol"), 1, 55, 1); case 69: case 70: return pc(I("Shaker"), -1, note, 1);
        case 73: return pc(I("Guiro"), -1, note, 1); case 75: return pc(I("Claves"), -1, note, 1); case 76: return pc(I("Woodblock"), -1, note, 1); case 81: return pc(I("Triangle"), -1, note, 1); case 84: return pc(I("Wind chimes"), -1, note, 1);
      }
      return pc(-1, -1, note, 1);
    }
    return pc(cur, -1, note, 1);
  }
  void buildHit(Hit& h, int instIdx, int note, double vel, int art, int player, int nPl, uint32_t seed) {
    const Inst& cur = inst(jround(v[Preset])); const Inst& n = inst(instIdx); const double spread = v[Spread] * 0.01, hum = v[Humanize] * 0.01;
    const double hr = hashf(seed, 5 + player), hr2 = hashf(seed, 9 + player), hr3 = hashf(seed, 13 + player);
    std::fill_n(h.c1, kModes, 0.0); std::fill_n(h.c2, kModes, 0.0); std::fill_n(h.bk, kModes, 0.0); std::fill_n(h.y1, kModes, 0.0); std::fill_n(h.y2, kModes, 0.0); std::fill_n(h.w, kModes, 0.0); std::fill_n(h.rr, kModes, 0.0);
    h.on = true; h.nm = 0; h.inst = instIdx; h.note = note; h.group = (v[Choke] > 0.5) ? n.choke : 0; h.startDelay = 0; h.held = false; h.live = false; h.follow = 0; h.quiet = 0; h.pn = 0; h.eRaw = 0; h.eSm = 0; h.nextBurst = 0;
    h.snz1 = 0; h.snz2 = 0; h.clk = 0; h.rubLp = 0; h.updC = 0; h.age = 0; h.seed = seed;
    auto knob = [&](int id, double pieceVal, double curVal) { return pieceVal + (v[id] - curVal); };
    double strike = clampd(knob(Strike, n.strike, cur.strike) * 0.01, 0, 1), pos = clampd(knob(Position, n.pos, cur.pos) * 0.01, 0, 1);
    double damp = knob(Damping, n.damp, cur.damp); const double res = clampd(knob(Resonance, n.res, cur.res) * 0.01, 0, 1), noise = clampd(knob(Noise, n.noise, cur.noise) * 0.01, 0, 1);
    const double snare = clampd(knob(Snare, n.snare, cur.snare) * 0.01, 0, 1), bend_ = knob(Bend, n.bend, cur.bend), bendMs = std::max(5.0, n.bendMs * (v[BendTime] / std::max(5.0, cur.bendMs)));
    const int mwMode = (int)jround(v[ModWheel]); const double mwv = mwSeen ? mw : 0;
    if (mwMode == 0) damp += mwv * 50; else if (mwMode == 1) pos = clampd(pos + mwv * 0.5, 0, 1); else if (mwMode == 2) strike = clampd(strike + mwv * 0.5, 0, 1);
    double tScale = 1, noiseExtra = 0, resScale = res;
    switch (art) {
      case 1: pos *= 0.3; strike = std::min(1.0, strike + 0.2); noiseExtra = 0.15; tScale = 0.6; break;
      case 2: tScale = 0.2; resScale = 0; break;
      case 3: pos = 0.05; strike = 1; noiseExtra = 0.35; tScale = 0.5; break;
    }
    const bool brush = art == 4; const int vcm = (int)jround(v[VelCurve]); const double vc = vcm == 0 ? 0.6 : (vcm == 2 ? 1.6 : 1.0);
    double vv = std::pow(clampd(vel, 0.02, 1), vc) * (1 + hum * 0.25 * (hr - 0.5)); vv = clampd(vv, 0.02, 1.2);
    h.level = n.gain * vv * (0.15 + 0.85 * vv);
    if (nPl > 1) h.pan = clampd(0.5 + ((player + 0.5) / nPl - 0.5) * (0.3 + 0.7 * spread) * 1.2 + (hr3 - 0.5) * 0.1 * spread, 0.05, 0.95);
    else if (n.pitched) h.pan = clampd(0.3 + 0.4 * clampd((note - 36) / 60.0, 0, 1), 0.2, 0.8); else h.pan = n.pan;
    h.pl = std::cos(h.pan * 1.5708); h.pr = std::sin(h.pan * 1.5708);
    const double sizeK = std::pow(2.0, v[Size] * 0.01 * 0.5);
    double f0 = n.pitched ? noteHz(note, noteTune) : n.f0 * std::pow(2.0, (note - n.baseNote) * n.track / 12 + (v[Tune] + 0) / 1200 + 12 * v[Octave] * n.track / 12);
    f0 *= sizeK; f0 *= std::pow(2.0, (nPl > 1 ? (hr - 0.5) * 2 * 10 * spread : 0) / 1200) * std::pow(2.0, hum * (hr2 - 0.5) * 6 / 1200);
    const double tk = std::pow(2.0, (50 - damp) / 25) * tScale;
    int nm = 0; double* amp = amp_; double* fr = fr_; double* t60 = t60_; const double edge = 1 - pos; const double sr_ = sr;
    auto push = [&](double f, double a, double t) { if (nm >= kModes || f < 15 || f > sr_ * 0.45) return; fr[nm] = f; amp[nm] = a; t60[nm] = t; ++nm; };
    if (n.kind == 0 || (n.kind == 1 && n.nm > 0) || (n.kind == 3 && n.nm > 0)) {
      const double posD = std::fabs(pos - 0.5) * 2;
      for (int k = 0; k < n.nm; ++k) {
        double a = n.a[k]; if (n.kind == 0) a *= (k == 0 ? 1 : 0.35 + 0.65 * std::fabs(std::sin(3.1416 * k * posD * 0.5 + 0.4 * (1 - posD))));
        else if (n.kind == 1) a *= (k == 0 ? (0.7 + 0.3 * pos) : 0.4 + 0.6 * edge);
        if (art == 3) a *= 0.3 + k / std::max(1.0, n.nm - 1.0);
        const double f = f0 * n.r[k], t = n.t0 * tk * std::pow(std::max(0.05, 1 / n.r[k]), n.dexp);
        push(f, a, t); if (n.beat > 0 && nm < kModes) push(f + n.beat * (k == 0 ? 1 : 1 + 0.3 * k), a * 0.8, t);
      }
    } else if (n.kind == 1) {
      for (int k = 0; k < 10; ++k) { double a = MEMA[k] * (MEMM[k] == 0 ? (0.7 + 0.3 * pos) : 0.25 + 0.75 * edge); if (art == 3) a *= 0.3 + 0.1 * k; push(f0 * MEM[k], a, n.t0 * tk * std::pow(1 / MEM[k], n.dexp)); }
    } else if (n.kind == 2) {
      const int cnt = n.nm; const double lo = n.gLo * sizeK, hi = n.gHi * sizeK;
      for (int k = 0; k < cnt; ++k) {
        const double u = (k + hashf((uint32_t)(n.gSeed * 17 + k), 3) * 0.9) / cnt, f = lo * std::pow(hi / lo, std::pow(u, n.gPw)), a = std::pow(lo / f, 0.35) * (0.5 + 0.5 * hashf((uint32_t)(n.gSeed * 31 + k), 7));
        const double t = n.t0 * tk * (0.4 + 0.6 * hashf((uint32_t)(n.gSeed * 13 + k), 11)) * std::pow(lo / f, n.dexp); push(f, a * (art == 3 ? 0.4 + 1.2 * u : 1), t);
      }
    }
    if (n.shell > 0 && resScale > 0 && n.kind == 1) push(f0 * 0.55, n.shell * resScale * 0.9, 0.12 + 0.25 * tk * n.t0);
    if ((n.kind == 0 && n.shell > 0) && resScale > 0) push(f0, n.shell * resScale * 0.6, n.t0 * tk * 0.8);
    const double eff = clampd(strike * (0.6 + 0.4 * vv), 0, 1); h.pw = std::max(3.0, sr * 0.001 * (0.25 + 4.5 * (1 - eff))); h.pulseAmp = brush ? 0.1 : n.pulseAmp;
    h.nzAmp = n.nzAmp; h.decK = std::exp(-1 / (sr * 0.001 * std::max(1.0, n.dec))); h.atkK = 1 - std::exp(-1 / (sr * 0.001 * std::max(0.3, n.atk)));
    h.burstsLeft = n.nb; h.spacing = sr * 0.001 * n.sp; h.nextBurst = 0; h.eRaw = 0;
    if (brush) { h.nzAmp = 0.8; h.burstsLeft = 1; h.decK = std::exp(-1 / (sr * 0.25)); h.atkK = 1 - std::exp(-1 / (sr * 0.05)); }
    h.stick = n.pulseAmp > 0 ? (noise + noiseExtra) : 0; h.snare = snare * (art == 2 ? 0.3 : 1); h.rub = v[Rub] * 0.01; h.maxAge = 0.2;
    h.nm = nm; double maxT = 0.1;
    for (int k = 0; k < nm; ++k) { const double w = 2 * 3.14159265 * fr[k] / sr, r = std::exp(-6.9078 / (std::max(0.004, t60[k]) * sr)); h.w[k] = w; h.rr[k] = r; h.c1[k] = 2 * r * std::cos(w); h.c2[k] = -r * r; h.bk[k] = amp[k] * std::sin(w); maxT = std::max(maxT, t60[k]); }
    h.maxAge = std::min(12.0, maxT * 1.3 + (n.nb > 0 ? n.dec * 0.004 + n.nb * n.sp * 0.001 : 0)); if (h.rub > 0) h.maxAge = 20;
    h.bendCents = bend_ * (1 + 0.3 * (hr2 - 0.5) * hum); h.bendK = std::exp(-1 / (sr * 0.001 * bendMs)); h.bendK8 = std::pow(h.bendK, 8); h.live = n.kind == 1 || n.nm > 0; h.curBend = h.bendCents;
    h.relK = 1; h.fade = 1; h.chokeK = 1;
  }
  void trigger(int instIdx, int note, double vel, int art, double delay, uint32_t seed, bool grace) {
    if (instIdx < 0) return;
    const int nPl = v[Layers] < 0.5 ? 1 : (v[Layers] < 1.5 ? 2 : 4);
    for (int j = 0; j < nPl; ++j) {
      int slot = -1; for (int i = 0; i < kHits; ++i) if (!hits[i].on) { slot = i; break; }
      if (slot < 0) { double low = 1e9; for (int i = 0; i < kHits; ++i) { const double s = hits[i].level * hits[i].fade / (1 + hits[i].age * 2); if (s < low) { low = s; slot = i; } } }
      Hit& h = hits[slot]; buildHit(h, instIdx, note, vel * (grace ? 0.45 : 1) * (nPl > 1 ? 1 / std::sqrt((double)nPl) * 1.4 : 1), art, j, nPl, seed + (uint32_t)(j * 7919));
      h.startDelay = delay + (nPl > 1 && j > 0 ? std::trunc(hashf(seed, 77 + j) * v[Spread] * 0.01 * 0.012 * sr) : 0); h.held = true; h.age = 0;
      if (v[Choke] > 0.5 && h.group > 0) for (auto& o : hits) if (&o != &h && o.on && o.group == h.group) o.chokeK = 0.9992;
    }
    flash = std::min(1.5, flash + 0.5 + 0.5 * vel);
  }
  void noteOn(int note, double vel) override {
    if (note >= 24 && note <= 28) { v[Articulation] = note - 24; writeParam(Articulation, v[Articulation]); return; }
    vel = clampd(vel, 0.02, 1); const Piece pc = pieceFor(note); if (pc.inst < 0) return;
    const int art = pc.art >= 0 ? pc.art : (int)jround(v[Articulation]); const uint32_t seed = ((uint32_t)note * 2654435761u) ^ ((uint32_t)(++ageCtr) * 40503u);
    double vv = vel * pc.vel; const double hum = v[Humanize] * 0.01; vv = clampd(vv * (1 + hum * 0.2 * rng.bi()), 0.02, 1); const double flam = v[Flam];
    if (flam > 0.5) { trigger(pc.inst, pc.note, vv, art, 0, seed ^ 0xA5A5u, true); trigger(pc.inst, pc.note, vv, art, std::trunc(sr * 0.001 * flam), seed, false); }
    else trigger(pc.inst, pc.note, vv, art, 0, seed, false);
    if (v[Roll] > 0.5) for (auto& r : rolls) if (!r.on) { r.on = true; r.note = note; r.vel = vv; r.timer = sr / std::max(1.0, v[RollRate]); r.n = 0; break; }
  }
  void noteOff(int note) override {
    for (auto& r : rolls) if (r.on && r.note == note) r.on = false;
    const Piece pc = pieceFor(note); if (pc.inst < 0) return; const double k = std::exp(-1 / (sr * 0.001 * std::max(10.0, v[Release])));
    for (auto& h : hits) if (h.on && h.held && h.note == note && h.inst == pc.inst) { h.held = false; h.relK = k; }
  }
  double stepHit(Hit& h) {
    if (h.startDelay > 0) { --h.startDelay; return 0; }
    h.age += 1 / sr;
    double x = 0; if (h.pn < h.pw) { x = h.pulseAmp * std::sin(3.14159265 * h.pn / h.pw) * (1.5708 / h.pw); h.pn += 1; }
    double nz = 0;
    if (h.burstsLeft > 0 || h.eRaw > 1e-4 || h.eSm > 1e-4) {
      if (h.burstsLeft > 0 && h.nextBurst <= 0) { h.eRaw += 1; --h.burstsLeft; h.nextBurst = h.spacing * (0.8 + 0.4 * (rng.bi() * 0.5 + 0.5)); } else h.nextBurst -= 1;
      h.eRaw *= h.decK; h.eSm += (h.eRaw - h.eSm) * h.atkK; nz = rng.bi() * h.eSm * h.nzAmp * 0.12;
    }
    double rubIn = 0; if (h.rub > 0 && h.held) { const double b = rng.bi(); h.rubLp += (b - h.rubLp) * 0.02; rubIn = h.rubLp * h.rub * 0.5 * std::min(1.0, h.age * 2); }
    const double drive = x + nz + rubIn; const int nm = h.nm; double* c1 = h.c1; double* c2 = h.c2; double* y1 = h.y1; double* y2 = h.y2; double* bk = h.bk;
    if (h.live && ((h.updC++ & 7) == 0)) {
      const bool bw = std::fabs(h.curBend) > 0.5 || std::fabs(bendS) > 1e-4;
      if (bw) { const double f = std::pow(2.0, (h.curBend + bendS * v[BendRange] * 100) / 1200); for (int k = 0; k < nm; ++k) c1[k] = 2 * h.rr[k] * std::cos(std::min(h.w[k] * f, 3.0)); }
      else if (h.curBend != 0) { for (int k = 0; k < nm; ++k) c1[k] = 2 * h.rr[k] * std::cos(h.w[k]); h.curBend = 0; }
    }
    if (std::fabs(h.curBend) > 0.5 && (h.updC & 7) == 1) h.curBend *= h.bendK8;
    double y = 0; for (int k = 0; k < nm; ++k) { const double o = bk[k] * drive + c1[k] * y1[k] + c2[k] * y2[k]; y2[k] = y1[k]; y1[k] = o; y += o; }
    y *= h.level;
    if (h.stick > 0 && h.age < 0.012) { const double b1 = rng.bi(); h.clk = h.clk * 0.5 + b1 * 0.5; const double e = std::exp(-h.age * 1100); const double b2 = rng.bi(); y += (b2 - h.clk * 0.5) * e * h.stick * 0.35 * h.level; }
    if (h.snare > 0) { h.follow += (std::fabs(y) - h.follow) * 0.01; const double n1 = rng.bi(); h.snz1 += (n1 - h.snz1) * 0.55; h.snz2 += (h.snz1 - h.snz2) * 0.5; y += (h.snz1 - h.snz2) * std::min(2.5, h.follow * 30) * h.snare * 3; }
    if (!h.held) h.fade *= h.relK;
    h.fade *= h.chokeK; y *= h.fade;
    h.quiet = std::fabs(y) > 2e-5 ? 0 : h.quiet + 1 / sr;
    if (!(std::fabs(y) < 30)) { h.on = false; ++nonFinite; return 0; }
    if (h.age > h.maxAge || h.fade < 1e-4 || (h.quiet > 0.15 && h.age > 0.1 && h.burstsLeft == 0 && !(h.rub > 0 && h.held))) h.on = false;
    return y;
  }
  void process(float* outL, float* outR, int n) override {
    const double rvMix = v[ReverbMix] * 0.01, motorD = v[Motor] * 0.01, motorInc = 6.2832 * v[MotorRate] / sr; const double lpA_ = lpA, volG_ = volG;
    const double rfb = 0.7 + 0.28 * (v[ReverbSize] * 0.01);
    for (int i = 0; i < n; ++i) {
      bendS += (bend - bendS) * 0.01; expS += (1 - expS) * 0.002; const long long ctr = ++sampleCtr;
      if (ctr % 8 == 0) for (int q = 0; q < kHits; ++q) { Hit& h = hits[q]; if (h.on && h.curBend != 0 && h.startDelay == 0) { h.curBend *= h.bendK8; if (std::fabs(h.curBend) < 0.5) h.curBend = 0.001; } }
      for (auto& r : rolls) if (r.on) {
        r.timer -= 1;
        if (r.timer <= 0) {
          const double b = rng.bi(); r.timer += (sr / std::max(1.0, v[RollRate])) * (0.9 + 0.2 * (b * 0.5 + 0.5)); ++r.n; const Piece pc = pieceFor(r.note);
          if (pc.inst >= 0) { const double b2 = rng.bi(); trigger(pc.inst, pc.note, r.vel * (0.55 + 0.2 * (b2 * 0.5 + 0.5)), pc.art >= 0 ? pc.art : (int)jround(v[Articulation]), 0, ((uint32_t)r.n * 2654435761u) + (uint32_t)r.note, false); }
        }
      }
      double l = 0, r = 0;
      for (int q = 0; q < kHits; ++q) { Hit& h = hits[q]; if (h.on) { const double y = stepHit(h); l += y * h.pl; r += y * h.pr; } }
      motorPh += motorInc; if (motorPh > 6.2832) motorPh -= 6.2832; if (motorD > 0) { const double mod = 1 - motorD * 0.5 * (1 - std::cos(motorPh)) * 0.6; l *= mod; r *= mod; }
      double bl = eq[0][1].run(eq[0][0].run(l)), br = eq[1][1].run(eq[1][0].run(r)); lpz[0] = bl * (1 - lpA_) + lpz[0] * lpA_; bl = lpz[0]; lpz[1] = br * (1 - lpA_) + lpz[1] * lpA_; br = lpz[1];
      double oL = bl * volG_ * expS * 0.9, oR = br * volG_ * expS * 0.9;
      if (rvMix > 0.001) { const double x = (oL + oR) * 0.015, wl = rev.tick(0, x, rfb, 0.35), wr = rev.tick(1, x, rfb, 0.35); oL = oL * (1 - rvMix * 0.3) + wl * 3 * rvMix; oR = oR * (1 - rvMix * 0.3) + wr * 3 * rvMix; }
      oL = std::tanh(oL * 0.8) * 1.25; oR = std::tanh(oR * 0.8) * 1.25;
      if (!(oL - oL == 0) || !(oR - oR == 0)) { ++nonFinite; oL = oR = 0; }
      outL[i] = (float)oL; outR[i] = (float)oR;
    }
    flash *= std::exp(-n / (0.35 * sr));
  }
};
inline Info info() {
  return Info{"percussica", "Percussica", "Modelled percussion with 49 instruments: bars and bells, skin drums, hand percussion, cymbals and gongs, and two General-MIDI style kits; keys 24 to 28 switch articulation.",
              makeSpecs(), makeGroups(), Theme{"percussica", 0xff2c1b12, 0xff0c0807, 0xffd9a441, 0xfff3e5cc, 0xffffd27a}, [](double sr) { return std::unique_ptr<EngineBase>(new Engine(sr)); }};
}
}}  // namespace occ::percussica
