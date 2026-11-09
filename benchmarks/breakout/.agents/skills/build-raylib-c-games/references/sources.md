# Sources and Refresh Policy

Last reviewed: 2026-08-12.

Verify version-sensitive facts before changing a dependency pin or using an API absent from the project's raylib version. The official stable release observed during review was raylib 6.0; the `master` header already identified itself as 6.1-dev, which is why this skill separates stable pins from current development documentation.

## raylib primary sources

- [raylib repository and official learning/build links](https://github.com/raysan5/raylib) — supported platforms, examples-first documentation model, releases, and license.
- [raylib cheatsheet](https://www.raylib.com/cheatsheet/cheatsheet.html) — current public API surface.
- [raylib examples](https://github.com/raysan5/raylib/tree/master/examples) — maintainer-reviewed usage patterns; check the example's recorded version.
- [raylib C header](https://raw.githubusercontent.com/raysan5/raylib/master/src/raylib.h) — exact declarations and ownership-related load/validate/unload pairs on the development branch.
- [Official raylib game template](https://github.com/raysan5/raylib-game-template) and its [CMakeLists.txt](https://github.com/raysan5/raylib-game-template/blob/main/CMakeLists.txt) — current project layout, pinned dependency acquisition, resource copying, and runtime working-directory patterns.
- [Working with CMake](https://github.com/raysan5/raylib/wiki/Working-with-CMake) — installed-package and build-directory basics.
- [raylib introduction course](https://github.com/raysan5/raylib-intro-course) — lifecycle, state screens, input, collision detection versus resolution, textures, fonts, and audio.
- [Delta-time example](https://github.com/raysan5/raylib/blob/master/examples/core/core_delta_time.c) — `GetFrameTime()`-based movement and FPS variation.
- [Image-loading example](https://github.com/raysan5/raylib/blob/master/examples/textures/textures_image_loading.c) — CPU `Image`, GPU `Texture2D`, context ordering, and matching unloads.
- [Music-stream example](https://github.com/raysan5/raylib/blob/master/examples/audio/audio_music_stream.c) — streamed-audio lifecycle.

## Build, test, C, and diagnostics

- [CMake tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/index.html) — target-oriented build fundamentals and progressive examples.
- [CMake dependency guide](https://cmake.org/cmake/help/latest/guide/using-dependencies/index.html) — `find_package`, `FetchContent`, immutable tags/commits, and archive hashes.
- [CMake language-standard properties](https://cmake.org/cmake/help/latest/prop_tgt/LANG_STANDARD.html) — `C_STANDARD`, required-standard behavior, and extensions.
- [CMake presets manual](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html) — shared `CMakePresets.json` versus local `CMakeUserPresets.json`.
- [CMake testing and CTest](https://cmake.org/cmake/help/latest/guide/tutorial/Testing%20and%20CTest.html) — `BUILD_TESTING`, `add_test`, focused runs, and multi-config notes.
- [GCC warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html) — actual coverage of `-Wall`, `-Wextra`, conversions, and C-specific warnings.
- [Clang AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) — memory-error coverage, compile/link flags, symbolization, and production limitations.
- [Clang UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html) — undefined-behavior checks and supported platforms.
- [Clang Static Analyzer](https://clang.llvm.org/docs/ClangStaticAnalyzer.html) — path-sensitive analysis for C.
- [Microsoft AddressSanitizer](https://learn.microsoft.com/en-us/cpp/sanitizers/asan?view=msvc-170) — `/fsanitize=address`, CMake/IDE integration, and Windows limitations.
- [SEI CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c) — authoritative rules and recommendations for arrays, integers, memory, I/O, and error handling.
- [ThrowTheSwitch Unity getting started](https://github.com/ThrowTheSwitch/Unity/blob/master/docs/UnityGettingStartedGuide.md) — optional small pure-C unit-test framework and native test-executable model.

## Game-loop source

- Glenn Fiedler, [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) — bounded, semi-fixed, and fixed timestep designs; catch-up headroom; the spiral of death; interpolation. This is a seminal engineering article rather than raylib documentation.

## Agentic coding and skill format

- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills) — required `SKILL.md` structure, progressive disclosure, trigger descriptions, imperative steps, and optional resources/UI metadata.
- [OpenAI model guidance: prompting best practices](https://developers.openai.com/api/docs/guides/latest-model) — lean instructions, explicit autonomy boundaries, representative evaluation, and evidence-oriented outcomes.

## Community diagnostic leads

Use these to find similar symptoms, then verify proposed fixes against source, current docs, and the project's toolchain:

- [raylib GitHub Discussions](https://github.com/raysan5/raylib/discussions)
- [raylib GitHub Issues](https://github.com/raysan5/raylib/issues)
- [Officially linked raylib Discord](https://discord.gg/raylib)
- [Example toolchain-mismatch discussion](https://github.com/raysan5/raylib/issues/4846) — illustrates why mixing MinGW, MSVC-compatible Clang, static libraries, and hand-written platform link flags is fragile; it is not a universal build recipe.
