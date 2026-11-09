---
name: build-raylib-c-games
description: Develop, refactor, debug, test, and review 2D games written in plain C with raylib and built with CMake. Use for raylib C sources, CMake configuration, game loops, input, collisions, assets, audio, screens or game states, deterministic simulation, native-game QA, packaging, and project bootstrapping. Also use to diagnose build, linker, runtime, working-directory, and resource-lifetime failures in C + raylib projects. Do not use for C++ wrappers or other engines unless the task is explicitly a port to plain C + raylib.
---

# Build C + raylib Games

## Operating contract

- Preserve the project's language, dependency, build, naming, and file-layout conventions unless the request authorizes a change.
- Keep the game in plain C. Do not silently introduce C++, an ECS, a physics engine, or a second build system.
- Prefer a small playable vertical slice over speculative infrastructure. Add an abstraction only when a current requirement or test needs it.
- Keep gameplay rules and simulation callable without opening a window or audio device. Isolate raylib lifecycle, rendering, input polling, and audio at the boundary.
- Treat loaded resources as owned values with one loader and one matching unload path.
- Use official raylib code, the raylib cheatsheet, and CMake documentation before relying on memory. Treat forums as diagnostic leads only.
- Pin dependencies. Never track raylib `master` for a normal project and never upgrade an existing pin without explaining compatibility impact.
- Do not claim that a game is playable, visually correct, or audible from compilation and unit tests alone. Run the executable and exercise the relevant flow when the environment permits it.

## Route detailed work

- Read [architecture-and-game-loop.md](references/architecture-and-game-loop.md) before creating a project, changing state flow, changing timing, or designing collision behavior.
- Read [raylib-runtime.md](references/raylib-runtime.md) before changing asset paths, texture/font/audio ownership, input polling, collision integration, or shutdown order.
- Read [build-test-debug.md](references/build-test-debug.md) before creating or changing CMake, adding tests, enabling warnings or sanitizers, investigating a failure, or preparing CI.
- Read [sources.md](references/sources.md) when an API or recommendation needs refreshing or evidence. Check the project's pinned raylib version before using APIs from newer documentation.

## Execute the workflow

### 1. Inspect before changing

1. Read repository instructions and the project plan, if present.
2. Inspect `CMakeLists.txt`, presets, source layout, tests, asset directories, and the current raylib acquisition method.
3. Check working-tree changes and preserve unrelated user work.
4. Identify the exact configure, build, test, and run commands already used by the project.
5. For a defect, reproduce it or establish the strongest available evidence before editing.

Do not mix package-manager raylib, a vendored copy, and `FetchContent` in one build. Do not replace a working integration merely to match this skill's examples.

### 2. Define one verifiable slice

State the slice in observable terms:

- player input and expected response;
- relevant game states and transitions;
- success, failure, restart, pause, and quit behavior;
- collision and timing invariants;
- assets and audio required for the slice;
- automated checks and interactive smoke steps.

For non-trivial work, split the change into dependency-ordered milestones. Keep at most one gameplay behavior under active implementation at a time.

### 3. Maintain a simple boundary

Use this dependency direction:

```text
main / app lifecycle
        |
        +--> input adapter --> InputFrame
        |
        +--> pure game update(Game *, InputFrame, dt)
        |
        +--> renderer(Game, Assets)
        +--> audio adapter(GameEvents, AudioAssets)
```

- Make `main.c` own process startup and shutdown, not gameplay rules.
- Make a `Game` or `World` value own authoritative gameplay state.
- Snapshot raylib input once per frame into a small `InputFrame` before updating the game.
- Emit gameplay events or state changes; translate them to sound and effects outside core rules.
- Keep draw functions observational: do not mutate authoritative gameplay state while rendering.
- Use explicit `Init`, `Update`, `Draw`, and `Unload` functions when a subsystem owns resources.

Start a very small prototype with `main.c`, `game.c/.h`, and `assets.c/.h`. Grow toward this layout only as systems emerge:

```text
project/
|-- CMakeLists.txt
|-- CMakePresets.json          # when shared presets add value
|-- assets/
|   |-- textures/
|   |-- audio/
|   `-- fonts/
|-- src/
|   |-- main.c
|   |-- app.c / app.h
|   |-- game/                  # state, rules, collision, levels
|   `-- platform/              # raylib input, renderer, assets, audio
`-- tests/                     # native tests for pure modules
```

Do not create empty directories or one-file-per-struct scaffolding in advance.

### 4. Implement incrementally

For each milestone:

1. Add or update a focused test for pure rules where practical.
2. Implement the smallest behavior that satisfies the acceptance criteria.
3. Build immediately with warnings enabled for project targets.
4. Run focused tests, then the broader test suite.
5. Run the game and inspect the changed player-facing flow.
6. Review the diff for accidental scope, duplicated ownership, and missing cleanup.

Prefer placeholder shapes and generated tones while proving mechanics. Add external assets only with a known license, source, and attribution requirement.

### 5. Verify in layers

Run the project's existing commands first. If none exist, use the command patterns in [build-test-debug.md](references/build-test-debug.md).

Verify in this order:

1. Configure from a clean build directory when build logic changed.
2. Compile Debug with useful warnings.
3. Run native unit tests through CTest.
4. Run sanitizer or static-analysis checks supported by the selected compiler.
5. Launch from the same working directory used by developers or packaged builds.
6. Exercise startup, controls, pause, restart, state transitions, and clean exit relevant to the change.
7. Confirm required assets load, music keeps streaming, sounds trigger once, and shutdown reports no ownership error.
8. Build Release before calling a milestone shippable.

Use a fixed random seed for reproducible tests and debug scenarios. Preserve normal random behavior for ordinary play unless the design says otherwise.

If display or audio access is unavailable, run all headless checks and report the interactive check as an open gate. Do not convert an environment limitation into a gameplay claim.

## Testing rules

- Test game rules at the pure-module boundary: state transitions, scoring, timers, spawn rules, collision response, bounds, and deterministic sequences.
- Test boundary values: exact contact, just inside/outside, zero and maximum counts, large frame gaps, repeated restart, and simultaneous inputs.
- Separate collision detection tests from collision resolution tests.
- Add regression coverage for every fixed bug that can be expressed without a window.
- Use CTest as the test runner. Reuse an existing C test framework; for a new larger project, Unity is a reasonable optional choice. A tiny assertion executable is enough for a small project.
- Keep tests out of the release executable. Do not initialize graphics or audio in ordinary unit tests.
- Treat an executable smoke test as integration evidence, not as a replacement for deterministic rule tests.

## Debugging rules

1. Capture the exact symptom, build configuration, compiler, working directory, and first relevant error.
2. Reduce the failure to one subsystem: build/link, lifecycle, asset path, input, simulation, collision, render, or audio.
3. Add temporary structured logs or a debug overlay at state transitions and invariant boundaries; avoid per-frame log spam.
4. Reproduce with a fixed seed and controlled input where possible.
5. Use a debugger for control-flow and state errors; use AddressSanitizer for memory errors; add UndefinedBehaviorSanitizer on supported Clang/GCC configurations.
6. Fix the earliest proven cause, then add a regression test or repeatable smoke scenario.
7. Remove temporary instrumentation or place it behind a debug-only option.

Never suppress a warning or sanitizer report before proving why it is safe. Never ship sanitizer runtimes in the release build.

## Avoid these anti-patterns

- A monolithic `main.c` after gameplay, assets, screens, and audio have become independent responsibilities.
- Gameplay rules that call `IsKeyDown()`, draw, play sound, or load files directly.
- Loading or unloading textures, fonts, sounds, or music inside the per-frame update/draw path.
- GPU resources loaded before `InitWindow()` or unloaded after `CloseWindow()`.
- Audio resources loaded before `InitAudioDevice()` or music streamed without `UpdateMusicStream()`.
- Ignoring `FileExists()` and resource-validity checks, then debugging a blank screen or silence as game logic.
- Using `SetTargetFPS()` as a substitute for frame-rate-independent movement or stable simulation.
- Passing an unbounded `GetFrameTime()` into collision or physics code after a pause or stall.
- Flipping velocity on every overlapping frame without positional correction, contact normals, or a separation rule.
- Adding `-Werror` globally so warnings inside third-party raylib code break the project.
- Fetching mutable branches, duplicating raylib integrations, using global include/link directories, or hand-linking platform libraries when the raylib CMake target already exports them.
- Broad refactors, mass formatting, or dependency upgrades mixed into a gameplay fix.
- Declaring work complete after build/test while interactive behavior, assets, or audio remain unverified.

## Completion checklist

### Scope and architecture

- [ ] Existing instructions, build files, tests, and local changes were inspected.
- [ ] The implemented slice and its observable acceptance criteria are explicit.
- [ ] Core rules remain testable without a graphics or audio device.
- [ ] New dependencies or architecture changes are justified and approved by scope.

### Runtime correctness

- [ ] Input edge/held semantics match the mechanic.
- [ ] Timing is bounded and appropriate for the simulation.
- [ ] Collision detection and resolution are both covered.
- [ ] Every loaded resource has one matching unload path in the correct order.
- [ ] Asset paths work from the actual runtime working directory.
- [ ] Audio device setup, per-frame music update, and cleanup are correct.

### Evidence

- [ ] Configure and Debug build pass.
- [ ] Focused and full CTest suites pass.
- [ ] Supported warning, sanitizer, or static-analysis checks pass or have documented exceptions.
- [ ] The changed flow was exercised in the running game.
- [ ] Release build passes when release readiness is claimed.
- [ ] Final reporting separates completed evidence from unrun QA and release gates.
