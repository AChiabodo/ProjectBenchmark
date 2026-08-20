# Architecture and Game Loop

## Contents

1. [Choose the smallest architecture](#choose-the-smallest-architecture)
2. [Model state explicitly](#model-state-explicitly)
3. [Run the lifecycle in a stable order](#run-the-lifecycle-in-a-stable-order)
4. [Choose a timing model](#choose-a-timing-model)
5. [Snapshot input](#snapshot-input)
6. [Detect and resolve collisions](#detect-and-resolve-collisions)
7. [Design for deterministic tests](#design-for-deterministic-tests)
8. [Evolve without over-engineering](#evolve-without-over-engineering)

## Choose the smallest architecture

Keep the first playable version close to the raylib lifecycle while protecting pure game rules from platform calls.

```text
main.c
  initialize window/audio/assets
  while running
    poll input -> InputFrame
    update Game
    translate GameEvents -> audio/effects
    draw Game
  unload assets/audio/window
```

Use three modules for a small prototype:

- `main.c`: lifecycle and loop;
- `game.c/.h`: state and deterministic update;
- `assets.c/.h`: owned textures, fonts, sounds, and music.

Split `renderer`, `audio`, `collision`, `levels`, or screens only when each gains independent state, tests, or change pressure. Avoid both extremes: a permanent giant `main.c` and premature one-file-per-type scaffolding.

## Model state explicitly

Use an enum for top-level state and one authoritative aggregate for gameplay.

```c
typedef enum GameMode {
    GAME_MODE_MENU,
    GAME_MODE_PLAYING,
    GAME_MODE_PAUSED,
    GAME_MODE_WON,
    GAME_MODE_LOST
} GameMode;

typedef struct InputFrame {
    float moveX;
    float moveY;
    bool confirmPressed;
    bool actionDown;
    bool pausePressed;
} InputFrame;

typedef struct Game {
    GameMode mode;
    unsigned int seed;
    float elapsed;
    int score;
    /* genre-specific state */
} Game;
```

Prefer state transitions through focused functions such as `GameStart`, `GamePause`, `GameRestart`, and `GameUpdate`. Centralize reset rules so restart does not leave stale timers, entities, effects, or references.

Keep rendering observational. If drawing changes state, tests and frame-order reasoning become fragile.

## Run the lifecycle in a stable order

Use a predictable frame order:

1. Poll the window-close request and snapshot input.
2. Compute or accumulate elapsed time.
3. Update pure simulation.
4. Resolve generated gameplay events.
5. Update streaming audio.
6. Draw the current or interpolated state.

Initialize in dependency order and unload in reverse order. See [raylib-runtime.md](raylib-runtime.md) for resource details.

## Choose a timing model

`SetTargetFPS()` controls frame pacing. It does not make update math frame-rate independent. `GetFrameTime()` returns the duration of the previous frame in seconds.

### Variable timestep

Use a bounded variable timestep for simple arcade movement, UI animation, particles, and games without sensitive physics:

```c
float frameDt = GetFrameTime();
float dt = frameDt < maxFrameDt ? frameDt : maxFrameDt;
GameUpdate(&game, input, dt);
```

Choose `maxFrameDt` from gameplay requirements and test it. Do not copy a magic value without considering maximum safe displacement and timers. Decide whether a long pause should be discarded, clamped, or handled as an explicit pause transition.

### Fixed simulation timestep

Use fixed updates when collision stability, deterministic replay, networking, or exact test reproducibility matters:

```c
const double fixedDt = 1.0 / 60.0;
double accumulator = 0.0;

while (!WindowShouldClose()) {
    InputFrame input = PollInputFrame();
    double frameTime = (double)GetFrameTime();
    if (frameTime > maxFrameTime) frameTime = maxFrameTime;
    accumulator += frameTime;

    int steps = 0;
    while ((accumulator >= fixedDt) && (steps < maxStepsPerFrame)) {
        GameFixedUpdate(&game, input, (float)fixedDt);
        accumulator -= fixedDt;
        steps++;
    }

    float alpha = (float)(accumulator / fixedDt);
    DrawGameInterpolated(&game, alpha);
}
```

Bound the accumulated frame time and maximum catch-up steps. Otherwise an overloaded simulation can enter the "spiral of death," where catching up costs more time than was accumulated. If interpolation is unnecessary, draw the latest state and accept a small visual stair-step.

Do not assume fixed update alone guarantees cross-platform bit-identical floating-point results. It improves reproducibility but compiler, architecture, and math choices still matter.

## Snapshot input

Poll raylib input once per rendered frame and translate it into intent:

- use `IsKeyPressed()` or button-pressed calls for one-shot transitions such as pause, confirm, and fire-on-press;
- use `IsKeyDown()` for held movement, charging, or continuous fire;
- normalize combined directional input when diagonal movement must not be faster;
- apply dead zones to analog axes;
- define how fixed updates consume an edge event when more than one simulation step runs in a render frame.

For fixed updates, latch edge events until one simulation step consumes them. Do not replay a single press across every catch-up step.

Keep key bindings in the platform adapter or configuration, not in collision or scoring rules.

## Detect and resolve collisions

Raylib's `CheckCollision*` functions answer whether simple shapes overlap. Resolution remains game code.

Use a pipeline:

1. Generate candidate pairs using the small set of active colliders or a broad phase when counts grow.
2. Detect overlap or time of impact.
3. Derive contact information: normal, penetration, impacted side, and involved entities.
4. Move objects out of penetration or rewind to contact.
5. Change velocity/state once according to material and gameplay rules.
6. Emit gameplay events such as damage, bounce, pickup, or destruction.

Avoid reversing both velocity axes on every AABB overlap. That creates corner errors, jitter, and repeated responses. Use previous position, minimum penetration, or swept collision to determine the contact normal.

For fast objects, compare maximum displacement per update to the thinnest collider. If one update can cross it, use one of:

- smaller fixed steps;
- adaptive substeps bounded by a maximum;
- swept circle/AABB or segment tests;
- ray/shape casting appropriate to the mechanic.

Test exact contact, shallow and deep overlap, corners, simultaneous contacts, repeated resting contact, and high-speed traversal.

## Design for deterministic tests

- Store the seed in game state and set it explicitly in tests.
- Wrap random selection behind a small game function or deterministic sequence.
- Pass `dt` into updates; never call `GetFrameTime()` inside pure modules.
- Pass `InputFrame`; never call raylib input functions inside pure modules.
- Return or store `GameEvent` values; never play sound inside scoring or collision functions.
- Keep allocation ownership visible in structs and module APIs.
- Prefer stable entity identifiers over raw pointers when arrays may move or compact.

Create scenario helpers that initialize only the state required by a test. Assert outcomes and invariants, not private call order.

## Evolve without over-engineering

Split a module when at least one is true:

- it owns a distinct lifecycle or resource type;
- it has meaningful pure tests;
- it changes for a different reason from its current neighbors;
- its public contract is clearer than continued file growth;
- multiple game modes reuse it.

Do not introduce an ECS, scripting language, serialization layer, hot reload, or job system solely because a future game might need it. Add them only against current acceptance criteria and measured complexity.
