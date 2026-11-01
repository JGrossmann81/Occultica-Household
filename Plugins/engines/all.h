#pragma once
#include "minica.h"
#include "rhodica.h"
#include "wraithica.h"
namespace occ { inline std::vector<Info> allInstruments() { return {minica::info(), rhodica::info(), wraithica::info()}; } }
