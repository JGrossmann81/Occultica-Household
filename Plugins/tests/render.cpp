// Offline render for checking the C++ engines against the web engines: render <id> <preset> <out.f32>
#include "../engines/all.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>
int main(int argc, char** argv) {
  if (argc < 4) return 2; const double sr = 48000; auto all = occ::allInstruments(); occ::Info* inf = nullptr; for (auto& i : all) if (!strcmp(i.id, argv[1])) inf = &i; if (!inf) { fprintf(stderr, "no such instrument\n"); return 3; }
  auto e = inf->make(sr); for (size_t i = 1; i < inf->specs.size(); ++i) e->set((int)i, inf->specs[i].def); e->writes.clear();
  int preset = atoi(argv[2]); if (preset >= 0) e->set(0, preset);
  FILE* f = fopen(argv[3], "wb"); const int total = int(sr * 3), B = 128; std::vector<float> L(B), R(B);
  for (int pos = 0; pos < total; pos += B) {
    if (pos == 0) e->noteOn(60, 0.8); if (pos == 128 * 75) e->noteOn(64, 0.7); if (pos == 128 * 150) e->noteOff(60); if (pos == 128 * 150 + 128 * 20) e->noteOn(48, 1.0); if (pos == 128 * 225) e->noteOff(64);
    e->process(L.data(), R.data(), B); for (int i = 0; i < B; ++i) { fwrite(&L[i], 4, 1, f); fwrite(&R[i], 4, 1, f); }
  }
  fclose(f); return 0;
}
