# Build, Test, and Debug

## Contents

1. [Respect the existing build](#respect-the-existing-build)
2. [Bootstrap with CMake](#bootstrap-with-cmake)
3. [Use reproducible presets and commands](#use-reproducible-presets-and-commands)
4. [Enable warnings](#enable-warnings)
5. [Structure tests](#structure-tests)
6. [Use diagnostics](#use-diagnostics)
7. [Debug systematically](#debug-systematically)
8. [Run native-game QA](#run-native-game-qa)
9. [Diagnose common symptoms](#diagnose-common-symptoms)

## Respect the existing build

Before editing build logic:

- inspect the minimum CMake version, generator, presets, compiler, dependency integration, and target names;
- use the project's installed, vendored, package-manager, or `FetchContent` raylib path consistently;
- avoid changing the raylib version and build architecture in the same patch as gameplay work;
- keep compiler options target-local so third-party sources are not forced through project-only warning policy;
- preserve CI and platform-specific branches unless the task covers them.

Use `cmake --list-presets` when presets exist. Do not assume Ninja, Visual Studio, Makefiles, or a single-configuration generator.

## Bootstrap with CMake

For a new plain-C project, use a target-oriented baseline. Verify the current stable raylib release before selecting the pin; the version below is an example reviewed on 2026-08-12.

```cmake
cmake_minimum_required(VERSION 3.24)
project(example_game VERSION 0.1.0 LANGUAGES C)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include(FetchContent)
set(RAYLIB_VERSION "6.0" CACHE STRING "Pinned raylib version")
FetchContent_Declare(
  raylib
  URL "https://github.com/raysan5/raylib/archive/refs/tags/${RAYLIB_VERSION}.tar.gz"
  DOWNLOAD_EXTRACT_TIMESTAMP OFF
  FIND_PACKAGE_ARGS
)
FetchContent_MakeAvailable(raylib)

add_library(game_core STATIC
  src/game/game.c
  src/game/collision.c
)
target_include_directories(game_core PUBLIC src)
target_compile_features(game_core PUBLIC c_std_17)
set_target_properties(game_core PROPERTIES
  C_STANDARD_REQUIRED YES
  C_EXTENSIONS NO
)

add_executable(example_game
  src/main.c
  src/app.c
  src/platform/assets.c
  src/platform/audio.c
  src/platform/renderer.c
)
target_link_libraries(example_game PRIVATE game_core raylib)
target_compile_features(example_game PRIVATE c_std_17)
set_target_properties(example_game PROPERTIES
  C_STANDARD_REQUIRED YES
  C_EXTENSIONS NO
)

include(CTest)
if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
```

Improve supply-chain reproducibility by pinning a verified release archive with a cryptographic `URL_HASH` or an immutable Git commit. Do not paste an unverified hash. Cache downloads in CI where appropriate.

If the target platform uses an installed raylib package, prefer the project's working `find_package(raylib CONFIG REQUIRED)` flow. Link the exported target and let it propagate platform link requirements instead of manually adding OpenGL, windowing, or system libraries.

Copy assets next to the executable with an explicit post-build or install rule. Keep the debugger working directory aligned with that output directory. The official raylib game template is a useful current example, but adapt it rather than cloning its entire layout blindly.

## Use reproducible presets and commands

Commit shared settings in `CMakePresets.json`. Keep machine-local paths and secrets in `CMakeUserPresets.json`, which should not be committed.

When presets exist, use their actual names:

```text
cmake --list-presets
cmake --preset <configure-preset>
cmake --build --preset <build-preset>
ctest --preset <test-preset> --output-on-failure
```

Fallback without presets:

```text
cmake -S . -B build/debug -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON
cmake --build build/debug --config Debug
ctest --test-dir build/debug -C Debug --output-on-failure
```

`--config Debug` and `ctest -C Debug` are required for multi-configuration generators such as Visual Studio and harmless to include in shared instructions. A single-configuration generator uses `CMAKE_BUILD_TYPE` at configure time.

Do not declare a build broken because the first long configure command times out. Inspect whether the process completed, the build directory exists, and subsequent configure/build output identifies a real error.

## Enable warnings

Create an interface target or helper function applied only to project targets:

```cmake
add_library(project_warnings INTERFACE)

if(MSVC)
  target_compile_options(project_warnings INTERFACE /W4)
else()
  target_compile_options(project_warnings INTERFACE
    -Wall
    -Wextra
    -Wpedantic
  )
endif()

target_link_libraries(game_core PRIVATE project_warnings)
target_link_libraries(example_game PRIVATE project_warnings)
```

Add stricter C warnings such as `-Wconversion`, `-Wshadow`, `-Wstrict-prototypes`, and `-Wmissing-prototypes` incrementally after checking compiler support and project noise. Use explicit casts only when the conversion is intentional and range-safe.

Use warnings-as-errors in controlled CI for owned targets only after the warning baseline is clean. Do not globally apply it to raylib or other dependencies.

## Structure tests

Build pure logic as a library and link native test executables to it:

```cmake
# tests/CMakeLists.txt
add_executable(game_rules_tests
  test_game_rules.c
)
target_link_libraries(game_rules_tests PRIVATE game_core project_warnings)
add_test(NAME game_rules COMMAND game_rules_tests)
```

CTest launches commands and treats zero as success and non-zero as failure. Use `--output-on-failure` and focused selection during iteration:

```text
ctest --test-dir build/debug -C Debug -R game_rules --output-on-failure
```

Choose the smallest test harness that provides readable failures:

- tiny assertion macros for a very small project;
- an existing project framework when already present;
- pinned ThrowTheSwitch Unity for a larger new C suite.

Do not replace an existing framework without a measured reason. Do not link window, GPU, or audio initialization into pure tests.

Test layers:

1. Unit: rules, state transitions, math, timers, collision detection/resolution.
2. Scenario: several updates from a controlled state, fixed seed, and recorded input frames.
3. Resource smoke: required paths and valid loads in an environment with graphics/audio access.
4. Executable smoke: startup, controls, pause/restart, end state, and clean shutdown.
5. Platform/package: run the produced artifact outside the source tree.

## Use diagnostics

### AddressSanitizer and UndefinedBehaviorSanitizer

Add an opt-in diagnostic interface and link it to every owned target. Apply flags to both compile and link steps where the toolchain requires them.

```cmake
option(ENABLE_SANITIZERS "Enable supported runtime sanitizers" OFF)
add_library(project_sanitizers INTERFACE)

if(ENABLE_SANITIZERS)
  if(CMAKE_C_COMPILER_ID MATCHES "Clang|GNU")
    target_compile_options(project_sanitizers INTERFACE
      -fsanitize=address,undefined
      -fno-omit-frame-pointer
    )
    target_link_options(project_sanitizers INTERFACE
      -fsanitize=address,undefined
    )
  elseif(MSVC)
    target_compile_options(project_sanitizers INTERFACE /fsanitize=address)
  endif()
endif()

target_link_libraries(game_core PRIVATE project_sanitizers)
target_link_libraries(example_game PRIVATE project_sanitizers)
```

Link test executables to the same interface. Confirm toolchain and platform support; sanitizer availability differs, especially on Windows. Keep debug information. Run the program or tests normally and fix the first report before interpreting later symptoms.

Never enable sanitizer runtimes in production artifacts.

### Static analysis

Use the Clang Static Analyzer (`scan-build`) or an existing project analyzer for path-sensitive C checks. Generate `compile_commands.json` for compatible tools. Keep analysis configuration reproducible and document justified suppressions next to the affected target or rule.

### Debuggers and logs

Build with symbols. Use the native debugger for breakpoints, watch expressions, stack traces, and data breakpoints. Use `TraceLog` for raylib-aware messages and a debug overlay for time-sensitive state that would be too noisy in logs.

## Debug systematically

Use this loop:

1. Reproduce with exact compiler, configuration, arguments, working directory, and seed.
2. Preserve the first compiler, linker, sanitizer, or runtime error; later messages may be consequences.
3. Reduce scope and state the current hypothesis in falsifiable terms.
4. Add the smallest observation: assertion, trace, breakpoint, or focused test.
5. Change one cause at a time.
6. Re-run the focused reproducer, full tests, and executable smoke.
7. Remove temporary noise and retain regression evidence.

For intermittent problems, record seed, input sequence, frame times, and state transitions. Avoid "fixing" them by adding arbitrary delays.

## Run native-game QA

Compilation is not visual QA. Launch the actual target from its expected runtime directory and verify the requested slice:

- startup and missing-asset behavior;
- keyboard, mouse, and gamepad paths in scope;
- held and edge input combinations;
- pause/resume, restart, win/loss, and quit;
- collision at edges, corners, and high speed;
- frame-rate variation or simulated stalls;
- music continuity and one-shot sound triggers;
- resize/fullscreen behavior when supported;
- clean shutdown and repeated launch.

Capture screenshots and logs as evidence where useful. Do not infer audio correctness from a waveform load or visual correctness from a screenshot alone.

## Diagnose common symptoms

| Symptom | Check first |
|---|---|
| Configure cannot find raylib | Mixed acquisition methods, wrong package config, network-disabled `FetchContent`, stale cache |
| Undefined references at link | Compiler/ABI mismatch, inconsistent static/shared raylib, bypassed exported CMake target, wrong build configuration |
| Game runs only from source root | Relative asset paths, missing post-build copy, debugger working directory |
| Blank/invalid texture | Load before `InitWindow`, missing file, invalid result, resource unloaded too early |
| Silence | Audio device not ready, invalid sound/music, wrong path, volume/mute state |
| Music starts then stops | Missing per-frame `UpdateMusicStream` or stream lifetime error |
| Crash on exit/restart | Double unload, owner copied by value, stale pointer, wrong shutdown order |
| Collision jitter/sticking | Response repeated while overlapping, no positional correction, ambiguous contact normal |
| Fast object passes through wall | Displacement exceeds collider thickness; require substeps or swept detection |
| Movement changes with FPS | Per-frame displacement without `dt`, unbounded `dt`, or mixed timing models |
| Tests pass but gameplay fails | Core tests lack adapter/runtime coverage; run resource and executable smoke |
