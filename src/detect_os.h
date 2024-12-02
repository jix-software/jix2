/*
 * detect_os.h
 *
 * Copyright (C) 2014, 2020  Henri Lesourd
 *
 *  This file is part of HOP.
 *
 *  HOP is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  HOP is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with HOP.  If not, see <http://www.gnu.org/licenses/>.
 */

// Windows
#if defined(_WIN32) || defined(_WIN64)
#define WINDOWS

// Apple
#elif defined(__APPLE__) && defined(__MACH__)
#include <TargetConditionals.h>

#if TARGET_OS_MAC == 1
#define MACOSX
#endif

// UNIX
#else
#define UNIX
#endif
