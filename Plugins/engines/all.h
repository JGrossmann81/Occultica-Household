#pragma once
#include "minica.h"
#include "rhodica.h"
namespace occ { inline std::vector<Info> allInstruments() { return {minica::info(), rhodica::info()}; } }
