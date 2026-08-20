# raylib Runtime Practices

## Contents

1. [Lifecycle order](#lifecycle-order)
2. [Resource ownership](#resource-ownership)
3. [Asset path strategy](#asset-path-strategy)
4. [Texture and font loading](#texture-and-font-loading)
5. [Audio](#audio)
6. [Input](#input)
7. [Collision API boundary](#collision-api-boundary)
8. [Logging and debug overlays](#logging-and-debug-overlays)
9. [Packaging and asset provenance](#packaging-and-asset-provenance)

## Lifecycle order

Use dependency order during startup and reverse dependency order during shutdown:

```c
SetConfigFlags(/* flags required before InitWindow */);
InitWindow(width, height, title);
InitAudioDevice();

Assets assets = {0};
bool assetsReady = AssetsLoad(&assets, "assets");
Game game = {0};
GameInit(&game, seed);

while (!WindowShouldClose()) {
    InputFrame input = PollInputFrame();
    float dt = GetFrameTime();

    GameUpdate(&game, input, dt);
    AudioUpdate(&assets.audio, &game);

    BeginDrawing();
    ClearBackground(BLACK);
    DrawGame(&game, &assets);
    EndDrawing();
}

GameUnload(&game);
AssetsUnload(&assets);
CloseAudioDevice();
CloseWindow();
```

Adapt the order when audio is optional, but never load sounds before the device is ready. Load GPU resources only after the window creates the graphics context. Unload GPU resources before closing that context.

Make partial initialization safe. Track validity or use zero-initialized resource aggregates so a failed load can unwind only what succeeded.

## Resource ownership

Use one matching unload operation for each successful load:

| Resource | Memory/device | Load examples | Validate | Unload |
|---|---|---|---|---|
| `Image` | CPU RAM | `LoadImage` | `IsImageValid` | `UnloadImage` |
| `Texture2D` | GPU VRAM | `LoadTexture`, `LoadTextureFromImage` | `IsTextureValid` | `UnloadTexture` |
| `RenderTexture2D` | GPU/framebuffer | `LoadRenderTexture` | `IsRenderTextureValid` | `UnloadRenderTexture` |
| `Font` | CPU data + GPU texture | `LoadFont`, `LoadFontEx` | `IsFontValid` | `UnloadFont` |
| `Wave` | CPU RAM | `LoadWave` | `IsWaveValid` | `UnloadWave` |
| `Sound` | audio buffers | `LoadSound` | `IsSoundValid` | `UnloadSound` |
| `Music` | stream/decoder | `LoadMusicStream` | `IsMusicValid` | `UnloadMusicStream` |

Do not unload an `Image` before all CPU-side transformations are complete. After `LoadTextureFromImage`, unload the `Image` when no longer needed; the texture owns a separate GPU copy.

Avoid shallow-copying structs that conceptually own the same raylib resource. A copied `Texture2D`, `Sound`, or `Music` identifier does not create a second resource and can cause double unload. Pass owners by pointer and make aliases explicitly non-owning.

## Asset path strategy

Relative paths resolve from the process working directory, not the source-file directory. Make the runtime contract explicit:

1. Store project assets under one root such as `assets/`.
2. Copy that root next to the executable as a post-build or install step.
3. Set the IDE debugger working directory to the target output directory when needed.
4. Run smoke tests from that same directory.
5. Use `FileExists()` and `DirectoryExists()` before loading required content.
6. Log both the expected path and working directory on failure.

Prefer a small asset-path helper over scattered string literals:

```c
bool AssetsLoad(Assets *assets, const char *root);
void AssetsUnload(Assets *assets);
```

Choose a required-asset policy:

- fail startup with a clear message for content essential to gameplay;
- use an obvious placeholder for optional art;
- disable optional audio when no device is available;
- never silently continue with an invalid resource that later draws blank or crashes.

Do not call `ChangeDirectory()` as a hidden global fix unless the entire application owns and documents that decision. Copying resources to a known runtime layout is easier to test and package.

## Texture and font loading

- Call texture and custom-font load functions after `InitWindow()`.
- Validate results immediately and include the failed path in the log.
- Load once at startup or scene transition, not each frame.
- Keep sprite source rectangles and origin conventions documented near the asset metadata.
- Use nearest-neighbor filtering deliberately for pixel art and test scaled output.
- Unload before `CloseWindow()`.

When using `Image` for CPU processing:

1. Load into RAM.
2. Validate and transform.
3. Upload to `Texture2D`.
4. Unload the `Image`.
5. Draw the texture during frames.
6. Unload the texture on shutdown.

## Audio

Initialize audio before loading audio assets:

```c
InitAudioDevice();
if (!IsAudioDeviceReady()) {
    TraceLog(LOG_WARNING, "Audio device unavailable; continuing without audio");
}
```

Use `Sound` for short effects and `Music` for streamed tracks. For music:

1. Load and validate the stream.
2. Call `PlayMusicStream()` once when playback should start.
3. Call `UpdateMusicStream()` every frame while the stream is active.
4. Stop/unload it before closing the audio device.

Translate gameplay events into sound once. Do not call `PlaySound()` every frame while an overlap or held condition remains true unless repeated sound is the intended mechanic.

Keep volume, mute state, and music/effects categories outside individual collision functions. Test mute, pause/resume, restart, and scene transitions for duplicate playback or stale streams.

## Input

Distinguish edges from held state:

- `IsKeyPressed` / `IsMouseButtonPressed`: true on the transition frame;
- `IsKeyDown` / `IsMouseButtonDown`: true while held;
- released/up variants: use when release itself matters.

Poll in the platform layer and produce action-level fields such as `moveX`, `fireDown`, `confirmPressed`, and `pausePressed`. This enables remapping and deterministic tests.

For simultaneous actions, avoid mutually exclusive `else if` chains unless the design requires priority. Test combinations such as move + fire and ensure release stops the intended held action.

## Collision API boundary

Use raylib helpers for basic detection:

- `CheckCollisionRecs`;
- `CheckCollisionCircles`;
- `CheckCollisionCircleRec`;
- point, line, polygon, and related helpers appropriate to the shape.

These functions do not resolve overlap, compute bounce policy, award score, or prevent high-speed tunneling. Keep those responsibilities in game code. See [architecture-and-game-loop.md](architecture-and-game-loop.md) for the resolution pipeline.

## Logging and debug overlays

Use `TraceLog()` with `LOG_DEBUG`, `LOG_INFO`, `LOG_WARNING`, and `LOG_ERROR`. Set a development threshold with `SetTraceLogLevel()` when useful.

Log state transitions and exceptional boundaries, not every frame. Useful fields include:

- state before/after;
- seed and level;
- entity identifiers;
- asset path and validity;
- collision normal/penetration for a targeted repro;
- frame time and fixed-step count when diagnosing stalls.

Add a toggleable debug overlay for FPS, frame time, active entity counts, state, and collider bounds. Keep it disabled in normal release presentation.

Use `TakeScreenshot()` for reproducible visual evidence, but do not treat a screenshot alone as proof that controls, timing, audio, or state transitions work.

## Packaging and asset provenance

- Make install/package rules copy the complete asset tree beside the executable or into a documented platform-specific location.
- Test the packaged artifact from outside the source tree so it cannot accidentally find developer assets.
- Store source URL, author, license, and attribution requirement for every external asset.
- Preserve license files required by the asset or library.
- Do not integrate an asset whose license or redistribution terms are unclear; use a placeholder and report the gate.
