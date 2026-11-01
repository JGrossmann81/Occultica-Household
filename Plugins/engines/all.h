#pragma once
#include "minica.h"
#include "rhodica.h"
#include "wraithica.h"
#include "additica.h"
#include "grainica.h"
#include "fantica.h"
#include "voxica.h"
namespace occ { inline std::vector<Info> allInstruments() { return {minica::info(), rhodica::info(), wraithica::info(), additica::info(), grainica::info(), fantica::info(), voxica::info()}; } }
