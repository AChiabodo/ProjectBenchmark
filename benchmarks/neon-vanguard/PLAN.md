> **Banner di vincolo — condizioni non negoziabili della sessione**
>
> - Una sessione, un host: nessun intervento umano di design; al massimo 3 turni di chiarimento con l'operatore.
> - Nessuna richiesta di rete a runtime: niente API esterne, asset remoti o servizi; ogni risorsa è locale o generata dal codice.
> - Dipendenze build-time ammesse solo se pinnate (lockfile, oppure tag + hash).
> - Più di un nodo (FE/BE/DB/worker) ⇒ un profilo Docker Compose che sale con un solo comando.
> - Deploy, hosting, publishing, CI e release automation: fuori scope, non valutati.
> - `./verify.sh` è non interattivo, termina entro 600 s, exit 0 = pass, e scrive `verify.json` con tutti gli id milestone del `meta.json`.
> - `RESULT.md` è obbligatorio: modello, wall-clock, turni, token e verdetto dell'harness.
> - Nessun tetto wall-clock o di token: si registrano, non si impongono.

## Milestone pesate

Tabella resa da `meta.json`, che resta la fonte autorevole dei pesi; `scripts/index.mjs --check` ne verifica la coerenza.

| id | peso | slice | titolo |
|----|-----:|:-----:|--------|
| M0 | 40 | sì | Slice verticale: arena giocabile con player, dash, sparo, un tipo di nemico, morte e restart |
| M1 | 12 | — | Spawn Director con curva di budget seedata |
| M2 | 12 | — | Orb XP, level-up e draft di 3 carte con seed riproducibile |
| M3 | 8 | — | Boss a due fasi |
| M4 | 8 | — | Juice: particelle, screenshake, hit-stop |
| M5 | 6 | — | Audio procedurale con criterio di inizializzazione headless |
| M6 | 6 | — | Check automatico: nessun asset binario e build senza warning |
| M7 | 3 | — | Costanti di bilanciamento sotto test |
| M8 | 5 | — | verify.sh che emette verify.json |

Mappatura sulla roadmap (Sez. 10), che resta il piano di esecuzione: **M0** = Fasi 1–2
(scaffold, loop a timestep fisso, core gameplay) ridotte alla sola AI del CHASER, con
di conseguenza l'harness già verde; **M1** = Fase 3A (SpawnDirector) con il requisito di
seed; **M2** = Fase 5 (roguelite + UI); **M3** = Fase 6 limitatamente al boss a due fasi;
**M4** = Fase 3B (juice) come integrata dalla Fase 4; **M5** = Fase 3B (audio) con il
criterio headless; **M6**–**M7** = contratti di qualità delle Sez. 6 e 11 resi meccanici;
**M8** = contratto di verifica (sezione Verify). La Fase 7 (review + fix pass) resta il
criterio di accettazione finale trasversale e non ha peso proprio: è la condizione sotto cui
M0–M8 superano l'harness.

## Verify

`./verify.sh` è il **canale ufficiale di verifica** del benchmark: promuove lo Smoke Test
Harness della Sez. 9 da strategia di validazione interna a contratto. Non esistono altri
canali: nessun giudizio visivo, nessuna prova a mano.

- **Build + harness headless**: `./verify.sh` configura e compila il progetto (CMake, build
  Release) e poi esegue l'harness `--smoke` della Sez. 9. **La finestra non viene mai
  lanciata**: nessuna chiamata raylib che richieda contesto (Sez. 4.1), nessun audio device.
- **Input scriptato deterministico**: l'input umano della tabella comandi (Sez. 1) non è
  richiesto. La modalità scriptata che lo sostituisce è `SimulateInput(frame, world)`
  (Sez. 3.3 e 9), il bot di sopravvivenza a timestep fisso, con RNG centralizzato a seed
  fisso (Sez. 3.2): due esecuzioni dello stesso comando producono lo stesso risultato.
- **Contratto**: non interattivo, termina entro 600 s, exit 0 = pass, e scrive `verify.json`
  con **tutti** gli id M0–M8 del `meta.json`, ciascuno con `pass` booleano e `detail`.
- Criterio binario per milestone, tutti a carico dell'harness:
  - **M0** — `--smoke 600` exit 0, `playerBullets > 0`, e una corsa dedicata in cui il bot
    muore (GAMEOVER) e la partita riparte: morte e restart esercitati, non solo presenti.
  - **M1** — due run `--smoke` a parità di seed producono la stessa sequenza di spawn
    (stessa ondata e stessi nemici nello stesso ordine) e `wave ≥ 2`.
  - **M2** — `level > 1`, `upgradesPicked ≥ 1`, e a parità di seed la mano del draft al
    level-up k è identica tra due run.
  - **M3** — `--smoke 6000 6` exit 0 con `bossSpawned ≥ 1`, `bossKilled ≥ 1`, e attraversamento
    verificato della soglia 50% HP (fase 2 raggiunta).
  - **M4** — dopo un kill: particelle attive > 0, trauma > 0, e hit-stop osservabile
    (almeno un frame con il mondo congelato e particelle in movimento).
  - **M5** — nessun file audio nel repository (check del harness) e `Audio::Init(false)`
    completato in headless senza device, con `Play*` no-op sicuri.
  - **M6** — build del harness con warning-as-errors sul solo codice di gioco (Risoluzione R1)
    e check di assenza di file binari nel repository (Risoluzione R4).
  - **M7** — unit test che affermano i valori delle costanti `cfg` della Sez. 6 (Risoluzione R2).
  - **M8** — il `verify.sh` stesso: esiste, è non interattivo, rispetta il timeout e produce
    un `verify.json` con tutti gli id e senza duplicati.

## Risoluzioni vincolanti (ex ambiguità)

Quattro punti del piano erano giudicabili in due modi diversi; ognuno ha una sola lettura
vincolante da questo punto in avanti. Le sedi originali (Sez. 1, 2, 6, 8, 11) puntano qui.

**R1 — "Zero warning" è un requisito, non un obiettivo.** Ambito: solo il codice di gioco
(`src/`), mai le dipendenze di terze parti (raylib via FetchContent). Canale di verifica: la
stessa build che l'harness esegue, dove i warning sul codice di gioco diventano errori
(`/WX` su MSVC, `-Werror` su GCC/Clang, applicati al solo target `NeonVanguard`). La Fase 7
("zero warning di gioco" nella validazione finale) va intesa così: la regola non viene
abbandonata, diventa meccanica. I warning di raylib restano tollerati.

**R2 — Le tabelle di bilanciamento (Sez. 6) sono fonti di verità da implementare, non
parametri da tarare.** Il piano è insolitamente esplicito sui numeri: i valori esatti vanno
implementati in `cfg` e verificati da unit test sui valori (milestone M7). Una deviazione è
ammessa solo se registrata in `RESULT.md` con la costante, il valore usato e la ragione;
non esiste una seconda lettura "tunabile". Tunare resta legittimo nello sviluppo locale,
ma ciò che l'harness valuta sono i valori della Sez. 6.

**R3 — L'audio procedurale ha un criterio verificabile: nessun file audio nel repository e
il sistema audio si inizializza in headless senza device.** Il criterio è a carico
dell'harness (M5): check di assenza di file audio (`*.wav`, `*.mp3`, `*.ogg`, `*.flac`,
`*.opus`) e affermazione che `Audio::Init(false)` completi la sintesi delle Wave senza alcuna
chiamata raylib-audio. La qualità sonora resta fuori dal giudizio: non esiste un criterio
d'opinione.

**R4 — "Nessun asset" è verificato automaticamente.** Il pillar zero-asset (Sez. 1) non è
una dichiarazione: l'harness controlla (M6) che il repository non contenga file binari di
media — immagini (`*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.bmp`, `*.webp`, `*.ico`, `*.tga`),
audio (vedi R3), font, modelli/video — via elenco di estensioni e controllo che i file di
testo rimangano testo. Eventuali binari di build nella directory `build/` sono esclusi dal
check perché generati, non asset.

# 📐 PLAN.md — NEON VANGUARD

**Piano di sviluppo completo per la realizzazione da zero di un arena survival twin-stick shooter roguelite in C++20 + raylib 5.5.**

---

## 📑 Indice
1. [Visione & Obiettivi](#1-visione--obiettivi)
2. [Stack Tecnologico & Setup di Build](#2-stack-tecnologico--setup-di-build)
3. [Architettura & Contratti tra Moduli](#3-architettura--contratti-tra-moduli)
4. [Game Loop & Macchina a Stati](#4-game-loop--macchina-a-stati)
5. [Specifiche di Gameplay Dettagliate](#5-specifiche-di-gameplay-dettagliate)
6. [Tabelle di Bilanciamento (fonte di verità)](#6-tabelle-di-bilanciamento-fonte-di-verità)
7. [Rendering Neon & Juice](#7-rendering-neon--juice)
8. [Audio Procedurale](#8-audio-procedurale)
9. [Smoke Test Harness (canale ufficiale di verifica)](#9-smoke-test-harness-canale-ufficiale-di-verifica)
10. [Roadmap di Sviluppo in Fasi](#10-roadmap-di-sviluppo-in-fasi)
11. [Regole di Qualità](#11-regole-di-qualità)
12. [Sviluppi Futuri](#12-sviluppi-futuri)

---

## 1. Visione & Obiettivi

**NEON VANGUARD** è un *arena survival shooter* a visuale dall'alto, in stile **neon vettoriale** (nessuna texture: tutto disegnato con primitive geometriche e blending additivo), con progressione **roguelite** a run singola.

### Pillari di design
1. **Game feel arcade immediato** — movimento con inerzia, dash con invulnerabilità, sparo reattivo, feedback costante (particelle, screenshake, hit-stop, suoni sintetizzati).
2. **Zero asset esterni** — grafica 100% procedurale (primitive raylib), audio 100% sintetizzato a runtime. Il progetto compila e gira senza alcun file binario aggiuntivo. Questo elimina l'intera pipeline asset ed è un requisito non negoziabile — verificato automaticamente (Risoluzione R4; per l'audio, R3).
3. **Roguelite a draft** — ogni kill rilascia orb XP; ogni level-up congelà il gioco e offre la scelta tra 3 carte-upgrade che alterano radicalmente il build del player.
4. **Difficoltà a direttore** — uno *Spawn Director* a budget pilota le ondate con curva quadratica; ogni 5 ondate un Boss a due fasi.

### Esperienza target
- Durata media di una run: **8–15 minuti**.
- Morte plausibile ma evitabile: la difficoltà deriva dal numero/proiettili, non da ingiustizia.
- Schermo: 1280×720, 60 FPS, timestep fisso.

### Controlli
| Input | Azione |
|---|---|
| `W A S D` | Movimento (normalizzato, diagonale = ortogonale) |
| Mouse | Mira (mirino a schermo) |
| Click sinistro | Sparo (tenuto continuo) |
| `SPAZIO` | Dash (burst di velocità + i-frames) |
| `ESC` | Pausa |
| `INVIO` | Conferma menu / start / game over |
| `1` `2` `3` | Scelta carta upgrade al level-up |

---

## 2. Stack Tecnologico & Setup di Build

| Componente | Scelta | Note |
|---|---|---|
| Linguaggio | **C++20** | `std::erase_if`, design con header leggeri |
| Libreria | **raylib 5.5** | via CMake `FetchContent` |
| Build | **CMake ≥ 3.22** | generatore Visual Studio 2022+ (Windows) o equivalente |
| Compiler flags | MSVC: `/W4 /permissive- /utf-8`; GCC/Clang: `-Wall -Wextra -Wpedantic` | **zero warning** sul codice di gioco: requisito, non obiettivo (Risoluzione R1) |
| Asset | **Nessuno** | grafica = primitive; audio = sintesi runtime |

### CMakeLists.txt (partenza)
```cmake
cmake_minimum_required(VERSION 3.22)
project(NeonVanguard LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    add_compile_options(/W4 /permissive- /utf-8)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

include(FetchContent)
# Ottimizzazione locale (opzionale): se esiste una copia locale dei sorgenti raylib,
# salta il download di rete:
#   set(FETCHCONTENT_SOURCE_DIR_RAYLIB "<path>/raylib-src")
#   set(FETCHCONTENT_FULLY_DISCONNECTED ON)
set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
FetchContent_Declare(raylib
    GIT_REPOSITORY https://github.com/raysan5/raylib.git
    GIT_TAG 5.5
    GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(raylib)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS "src/*.cpp" "src/*.hpp")
add_executable(NeonVanguard ${SOURCES})
target_include_directories(NeonVanguard PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_link_libraries(NeonVanguard PRIVATE raylib)
set_target_properties(NeonVanguard PROPERTIES
    VS_DEBUGGER_WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")
```

### Struttura directory target (finale)
```
NeonVanguard/
├── CMakeLists.txt
└── src/
    ├── main.cpp              # entry point, parse CLI, InitWindow / smoke
    ├── core/                 # Config, Types, Input, GameWorld, Game
    ├── entities/             # Player, Bullet, Enemy, Orb, Boss
    ├── systems/              # SpawnDirector, Collision, Particles, Fx, Audio, Upgrades, Hud
    └── render/               # Neon (helper glow)
```

---

## 3. Architettura & Contratti tra Moduli

Principio guida: **contratti espliciti prima del codice**. Le struct sotto vanno scritte ESATTAMENTE con questi nomi di campi — i moduli successivi le estendono aggiungendo campi, mai rinominando.

### 3.1 Config centrale (`core/Config.hpp`)
Namespace `cfg` con tutte le costanti di gioco (finestra, palette, bilanciamento). **Tutti i magic numbers del gameplay vivono qui** — vedi [Sezione 6](#6-tabelle-di-bilanciamento-fonte-di-verità) per i valori esatti.

```cpp
inline constexpr int SCREEN_W = 1280;
inline constexpr int SCREEN_H = 720;
inline constexpr int TARGET_FPS = 60;
inline constexpr float FIXED_DT = 1.0f / 60.0f;
```

### 3.2 Utility (`core/Types.hpp`)
```cpp
inline float Lerp(float a, float b, float t);
inline float Clamp01(float v);
inline float RandRange(float min, float max); // std::mt19937 statico seedato da std::random_device
```

**Determinismo del RNG** (vincolante per M1 e M2): esiste **un solo** generatore, iniettabile
e seedabile da CLI (`--seed N`). In gioco il seed può venire da `std::random_device`; in
`--smoke` il seed è **fisso** (default 42), così spawn director (Sez. 5.3), draft carte
(Sez. 5.6) e bot usano la stessa sequenza e due run dello stesso comando sono riproducibili
bit per bit.

### 3.3 Input (`core/Input.hpp`)
L'input è **disaccoppiato da raylib** tramite snapshot: è il perno che rende possibile lo smoke test headless.

```cpp
struct InputSnapshot {
    Vector2 moveDir{ 0, 0 };   // normalizzato
    Vector2 aimDir{ 0, 0 };    // normalizzato
    bool fire  = false;
    bool dash  = false;
    bool pick1 = false;        // tasti 1/2/3 per il draft (tengono conto anche di KEY_KP_1..3)
    bool pick2 = false;
    bool pick3 = false;
};

InputSnapshot GatherInputReal(Vector2 playerPos);  // WASD + mouse + click + SPACE
InputSnapshot SimulateInput(int frame, const GameWorld& world); // bot headless (Sez. 9)
```

### 3.4 Entità (contratti)
```cpp
struct PlayerStats {
    float damage = 10;  float fireRate = 5;  float speed = 260;
    int   multishot = 1; int pierce = 0;
    float maxHp = 100;   float dashCooldown = 2;
    float magnetRadius = 70; float bulletSpeed = 620;
};

struct Player {
    Vector2 pos{ 0,0 }, vel{ 0,0 };
    float radius = 12;
    float hp = 100;
    float fireTimer = 0, dashTimer = 0, invulnTimer = 0;
    PlayerStats stats;
    bool alive = true;
    // estensione roguelite (fase 5):
    int xp = 0, xpToNext = 4, level = 1;
};

struct Bullet {
    Vector2 pos{ 0,0 }, vel{ 0,0 };
    float radius = 4, damage = 10;
    bool alive = true;
    float life = 2;          // secondi; despawn anche fuori arena
    int pierceLeft = 0;      // fase 5: pierce reale
    int lastHitEnemyId = -1; // fase 7: previene multi-hit con pierce
};

enum class EnemyType { CHASER = 0, SHOOTER, SPLITTER, TANK, BOSS };

struct Enemy {
    Vector2 pos{ 0,0 }, vel{ 0,0 };
    float radius = 14, hp = 20, maxHp = 20;
    int type = 0;            // cast da EnemyType
    float timer = 0;         // timer hit-flash (decresce, NON cresce)
    bool alive = true;
    bool elite = false;
    int xpValue = 1, scoreValue = 10;
    int id = 0;              // id univoco monotono (counter statico in factory)
    // estensioni fase 3:
    float speed = 180; float fireTimer = 0;
    int splitGeneration = 0; // 0 = parent, 1 = figlio (non ri-splitta)
    // estensioni fase 6 (boss):
    float chargeTimer = 0, chargeDuration = 0; Vector2 chargeDir{ 0,0 };
};

struct Orb {                 // fase 5: orb XP
    Vector2 pos{ 0,0 }, vel{ 0,0 };
    float radius = 5; int xp = 1; bool alive = true;
};
```

### 3.5 Contenitore di stato (`core/GameWorld`)
```cpp
struct GameWorld {
    Player player;
    std::vector<Bullet> playerBullets;
    std::vector<Bullet> enemyBullets;
    std::vector<Enemy>  enemies;
    std::vector<Orb>    orbs;      // fase 5
    void RemoveDead();             // std::erase_if su tutti i vettori (alive==false)
    void Reset();                  // player al centro {SCREEN_W/2, SCREEN_H/2}, svuota tutti i vettori
};
```

### 3.6 API dei sistemi (contratti)
```cpp
// systems/SpawnDirector — direttore delle ondate a budget
void StartWave(int n);                       // calcola budget, costruisce coda mescolata
void Update(float dt, GameWorld& world);     // consuma la coda a intervalli
bool WaveCleared(const GameWorld& w) const;  // coda vuota E zero nemici vivi
int  CurrentWave() const;

// systems/Collision — funzioni pure, UNICA autorità sul danno al player
struct CollisionSummary {
    int enemiesKilled = 0; int enemiesHit = 0;
    float damageToPlayer = 0; int playerHits = 0; int bulletsConsumed = 0;
};
CollisionSummary ResolveCollisions(GameWorld& world, float dt);

// systems/Particles — pool fisso, zero allocazioni a runtime
void SpawnBurst(Vector2 pos, Color c, int count, float speedMin, float speedMax, float life, float radius);
void SpawnTrail(Vector2 pos, Color c);
void SpawnMuzzle(Vector2 pos, Vector2 dir);
void Update(float dt); void Draw() const;   // Draw SOLO dentro BeginGlow/EndGlow
int  ActiveCount() const;                    // pool: 2048 slot

// systems/Fx — juice a schermo
void AddTrauma(float amount);  Vector2 GetShakeOffset() const;  float GetShakeAngle() const;
void AddFlash(Color c, float strength);  void DrawFlash() const; // DrawFlash FUORI dal glow
void Update(float dt);

// systems/Audio — singleton o istanza; sintesi una tantum
void Init(bool enableDevice);  void Shutdown();
void PlayShoot(); PlayExplosion(); PlayHit(); PlayPickup();
void PlayLevelUp(); PlayDash(); PlayPlayerHit();
bool IsEnabled() const;

// systems/Upgrades — draft roguelite
enum class UpgradeType { DAMAGE, FIRERATE, MULTISHOT, PIERCE, SPEED, MAXHP, DASHCD, MAGNET, BULLETSPEED };
struct UpgradeDef { UpgradeType type; const char* name; const char* desc; Color color; };
std::vector<UpgradeDef> Draft3();               // 3 tipi distinti, rispettando stack max
void Apply(Player& player, UpgradeType t);
int  GetStack(UpgradeType t) const;

// systems/Hud — UI stile neon
void Draw(const GameWorld& world, int wave, int score, int kills, int highscore = 0); // + barra boss se vivo

// render/Neon — helper glow (statici)
void BeginGlow();  void EndGlow();              // BLEND_ADDITIVE
void DrawGlowCircle(Vector2 p, float r, Color c, float intensity);
void DrawGlowLine(Vector2 a, Vector2 b, Color c, float thickness);
void DrawGlowRing(Vector2 p, float r, Color c, float thickness);
```

---

## 4. Game Loop & Macchina a Stati

### 4.1 Loop a timestep fisso
```cpp
// Pseudocodice del loop (classe Game)
void Game::Run() {
    double acc = 0;
    while (state != GameState::QUIT) {
        if (!smokeMode) acc += std::min(GetFrameTime(), 0.25); // clamp anti "spiral of death"
        else           acc += FIXED_DT;
        while (acc >= FIXED_DT) { Update(FIXED_DT, input); acc -= FIXED_DT; }
        if (!smokeMode) Draw();   // in smoke: nessuna chiamata raylib
    }
}
```
Regole:
- **Update a 60 Hz fissi**, rendering svincolato (interpolazione facoltativa).
- Il clamp a `0.25s` evita che il drag della finestra generi migliaia di step di recupero.
- In `smokeMode`: **mai** chiamare `InitWindow`/`InitAudioDevice`/qualsiasi funzione raylib che richieda contesto OpenGL (nemmeno `IsKeyDown`, `GetMousePosition`, `BeginDrawing`). L'input arriva da `SimulateInput`.

### 4.2 Macchina a stati
```
MENU ──INVIO──► PLAYING ──hp<=0──► GAMEOVER ──INVIO──► MENU
                  │  ▲
                  ├──┴── ESC (PAUSED, mondo congelato)
                  │
                  └─xp>=soglia──► LEVELUP (mondo congelato, scelta 1/2/3) ──► PLAYING
```
- **MENU**: titolo pulsante `sin(GetTime()*3.5)`, istruzioni comandi, best score.
- **PAUSED**: overlay scuro + "PAUSED"; solo ESC riprende; l'update di gioco si ferma del tutto.
- **LEVELUP**: il mondo NON si aggiorna; disegno di 3 carte; dopo la scelta si riapplica il check `xp >= xpToNext` (multi-level-up in cascata al frame dopo).
- **GAMEOVER**: score/wave/kills/level/best, `*** NEW RECORD! ***` animato se battuto, scrittura `highscore.txt`.
- **QUIT**: chiusura pulita (Shutdown audio, CloseWindow).

### 4.3 Ordine di update in PLAYING (rispettare scrupolosamente)
1. Se `WaveCleared() && coda vuota` → `StartWave(current+1)` (+ heal ondata, vedi §6).
2. `SpawnDirector::Update(dt, world)` — immette nemici dai bordi.
3. `UpdateEnemies(world, dt)` — AI (include spari shooter e pattern boss).
4. `UpdatePlayer` — movimento/attrito, dash, sparo → `playerBullets`.
5. Trail/muzzle particelle + suoni di sparo/dash (solo a transizione, non ogni frame).
6. `UpdateBullets` per entrambi i vettori (life--, despawn fuori arena).
7. `CollisionSummary s = ResolveCollisions(world, dt)` → feedback: burst/esplosioni, suoni, trauma, score, XP orbs dai nemici morti.
8. `UpdateOrbs` — magnetismo, raccolta.
9. `particles.Update(dt); fx.Update(dt);` (aggiornano ANCHE durante hit-stop).
10. `world.RemoveDead()`.
11. Check morte player → GAMEOVER (salva finalScore, highscore).
12. Check `xp >= xpToNext` → LEVELUP.

**Hit-stop**: quando muore un nemico, impostare `hitStopTimer = 0.03s`; finché > 0, i passi 2–8 e 10–12 vengono saltati (il mondo si congela), ma passi 5(particles)/9 continuano. È il condimento del game feel: 30ms di freeze a ogni kill.

---

## 5. Specifiche di Gameplay Dettagliate

### 5.1 Player
- **Movimento**: velocità target = `moveDir * speed`; attrito-lerp verso il target: `vel += (target − vel) * min(1.0, 14.0 * dt)`; normalizzare `moveDir` solo se magnitudine² > 0.0001 (diagonali mai più veloci).
- **Clamp**: dentro l'arena `[radius, SCREEN_W-radius] × [radius, SCREEN_H-radius]`.
- **Dash**: richiesto solo se `dashTimer <= 0`; burst a `speed * 4` per 0.12s (durante il burst l'attrito verso la velocità target è sospeso), `invulnTimer = 0.3s`, poi `dashTimer = stats.dashCooldown`. **Direzione del dash**: `moveDir`; se nullo → `aimDir`; se anche nullo → `{1, 0}`.
- **Sparo**: se `fire && fireTimer <= 0` → `multishot` proiettili con spread di ~6° attorno a `aimDir`, velocità `stats.bulletSpeed`, damage `stats.damage`, `pierceLeft = stats.pierce`; `fireTimer = 1/fireRate`.
- **Invulnerabilità post-colpo**: 1.0s con lampeggio visivo a ~20 Hz.
- **Rendering**: cerchio ciano + anello glow + "canna" (rettangolo/linea) orientata verso l'aim.

### 5.2 Nemici — AI e comportamenti
Factory `CreateEnemy(type, pos, elite, splitGeneration, wave)` centralizza la creazione e assegna `id` da counter statico monotono.

| Tipo | Radius | HP | Speed | XP | Score | Comportamento |
|---|---|---|---|---|---|---|
| CHASER | 14 | 20 | 180 | 1 | 10 | Steering diretto verso il player |
| SHOOTER | 13 | 25 | 135 | 2 | 15 | Mantiene distanza ~300 (avanza/arretra); ogni **1.6s** spara 1 proiettile (dmg 8, speed 260, radius 5, life 3s) verso il player |
| SPLITTER (parent) | 16 | 30 | 120 | 2 | 12 | Come chaser ma lento; **alla morte**: 2 figli (radius 8, hp 6, speed 160, xp 1, score 6, `splitGeneration = 1`) solo se `splitGeneration == 0`; figli a offset `pos + {−6,−6}` / `pos + {+6,+6}` con velocità iniziali `{−80,−80}` / `{+80,+80}`, clampati dentro l'arena |
| TANK | 22 | 90 | 60 | 3 | 25 | Lento e coriaceo |
| BOSS | 46 | 400+60·wave | 85 | 15 | 500·wave | Vedi §5.4 |

- **Elite** (solo dai costi dello spawner): `hp ×3`, `speed ×1.15`, `scoreValue ×5`, tinta dorata brillante.
- **Contatto col player**: 12 dmg (TANK 20, BOSS 30) — applicato solo se `invulnTimer <= 0`.
- **Steering**: velocità target ruotata verso la direzione di comportamento con rate `vel += (targetVel − vel) * min(1, steerRate·dt)`. steerRate: CHASER/SPLITTER **6.0**, SHOOTER **5.0**, TANK/BOSS **4.0**; velocità finale normalizzata e clampata a `speed`.
- **Shooter zona morta**: avanza se dist > 320px, arretra se dist < 280px, velocità target 0 dentro `[280, 320]`.
- Nemici possono trovarsi fino a ~60px fuori arena (spawnano fuori e entrano; posizione clampata a `[−60, SCREEN+60]`).
- Hit-flash: alla collisione `timer = 0.10f`; il timer **decresce** con dt; durante `timer > 0` il rendering è bianco pieno. Nemici feriti (`hp < maxHp`) disegnano una **mini barra HP** (larghezza `max(20, radius·2)`, altezza 3px, a `pos.y − radius − 8`).

### 5.3 Spawn Director
- **Budget ondata n**: `budget = 60·n + 8·n²`.
- **Costi**: CHASER 10, SHOOTER 18, SPLITTER 14, TANK 30, BOSS 100.
- **Sblocco tipi**: wave 1 CHASER; wave 2 +SHOOTER; wave 3 +SPLITTER; wave 5 +TANK.
- **Elite**: probabilità 0 fino alla wave 3; dalla wave 4: `min(0.35, 0.15 + 0.02·n)`.
- Costruire la coda riempiendo il budget con tipi sbloccati casuali, poi **mescolare**; `push_front` del boss nelle wave `n % 5 == 0` (e ridurre il budget dei minion del 30% in quelle wave).
- **Consumo**: 1 spawn ogni `max(0.1, 0.8 − min(0.1, 0.02·n))` secondi; posizione: bordo casuale, 10–40px fuori arena, direzione iniziale verso il centro.
- **Seed**: la costruzione della coda attinge dal RNG centralizzato (Sez. 3.2); a parità di seed, la coda dell'ondata n è identica in ogni run (M1).
- `WaveCleared` = coda vuota E zero nemici vivi.

### 5.4 Boss "Vanguard Prime" (ogni 5 ondate)
- HP `400 + 60·wave`, radius 46, contatto 30 dmg, score `500·wave`, xp 15, steerRate 4.0.
- **Fase 1 (hp > 50%)**: movimento orbitale lento attorno al player (raggio ~350, speed 85) + ogni **2.2s** burst radiale di **16** proiettili a 360° (speed 220, dmg 10, radius 6, **life 4.5s**).
- **Fase 2 (hp ≤ 50%)**: il burst radiale sale a **24** proiettili ma resta su un **timer indipendente di 2.2s**; ogni **3.0s** charge: salva la direzione verso il player (`chargeDir`) e per **0.6s** si muove in linea retta a `85 × 5 = 425 px/s` (nessuna correzione di rotta durante la carica); tra una carica e l'altra insegue a speed normale con steering 4.0.
- Morte: mega burst di 60 particelle, trauma 0.8, score bonus, **5 orbs** da xp 3 espulsi radialmente a 72° l'uno dall'altro (raggio iniziale 18px dal centro, velocità radiale 50 px/s).
- Rendering: cerchio grande magenta/rosso pulsante + barra HP dedicata in HUD con nome.

### 5.5 Collisioni (contratto preciso)
`ResolveCollisions` è l'**unica autorità** che modifica hp/invulnerabilità del player; restituisce il summary SOLO per il feedback audiovisivo. In ordine:
1. **playerBullets × enemies**: se `bullet.lastHitEnemyId == enemy.id` → skip (pierce senza multi-hit); se dist < somma raggi → `enemy.hp -= damage`; se `pierceLeft > 0` → `pierceLeft--` e `lastHitEnemyId = enemy.id`, altrimenti `bullet.alive = false`. hp ≤ 0 → kill (splitter: spawn figli clampati).
2. **enemyBullets × player**: se `invulnTimer <= 0` → `hp -= dmg`, `invulnTimer = 0.4`, bullet consumato, `playerHits++`.
3. **enemies × player (contatto)**: se `invulnTimer <= 0` → `hp -= contact`, `invulnTimer = 0.5`, `playerHits++`.

In Game, alla ricezione del summary: se `playerHits > 0` → flash rosso, trauma 0.4, suono hit player, e `invulnTimer = max(invulnTimer, 1.0f)` (i-frames generosi sono una scelta di design).

### 5.6 Progressione roguelite
- Ogni nemico morto droppa **1 Orb** con `xp = xpValue` (boss: 5 orbs da xp 3, esplosi radialmente).
- **Magnetismo** (algoritmo esatto): entro `magnetRadius` → `t = 1 − clamp(dist / magnetRadius, 0, 1)`; `targetSpeed = 260 + 520·t`; l'orb lerp della velocità verso l'homing con rate `12.0·dt`; fuori dal raggio frena con `vel *= (1 − min(1, 4·dt))`. Raccolta a dist < 16px → `player.xp += xp`, suono, mini burst.
- **Curva XP**: a Lv.1 `xpToNext = 4`. Al superamento: `xp −= xpToNext; level++; xpToNext = 4 + level·3;` (→ 4 XP per Lv.2, 10 per Lv.3, 13 per Lv.4…; ~1 level-up ogni 1–2 ondate nel early game). Al level-up: heal +10 HP, poi draft.
- **Draft**: 3 carte distinte; stack massimi: MULTISHOT e PIERCE **4**, gli altri **6**; i tipi a stack pieno non tornano nel pool. Se restano meno di 3 upgrade disponibili, il draft ne offre solo quelli idonei (HUD centra il numero ridotto di carte); se il pool è **vuoto** il LEVELUP viene ignorato (nessun freeze).
- Selezione tasti `1/2/3`; il mondo resta congelato finché non si sceglie. La mano del draft attinge dal RNG centralizzato (Sez. 3.2): a parità di seed, la mano offerta al level-up k è identica tra due run (M2).

**Dettagli HUD** (stile neon, helper `Neon`):
- Barra HP con bordo ciano + numeri `HP: X/Y`; barra XP gialla sotto con `LV X` e progresso.
- Indicatore dash: cerchio pieno con doppio anello glow quando pronto; arco di ricarica `DrawRing` con countdown in secondi quando in cooldown.
- Wave centrale in alto; `SCORE`, `KILLS`, `BEST`, `ENEMIES` a destra.
- Banner boss: barra HP larga ~400px in alto al centro sotto la wave, riempimento rosso/magenta pulsante, etichetta **VANGUARD PRIME**; scompare alla morte.

### 5.7 Highscore
File `highscore.txt` nella working directory: lettura a avvio del Game (gestire file assente/corrotto → 0), scrittura al game over se superato.

---

## 6. Tabelle di Bilanciamento (fonte di verità)

Tutte in `core/Config.hpp`, namespace `cfg`. **Non inventare valori: usa questi.** Normative,
non tarabili: la lettura vincolante è la Risoluzione R2 (deviazioni solo in `RESULT.md`).

### Palette neon
| Costante | RGBA |
|---|---|
| COLOR_CYAN | (0, 240, 255) |
| COLOR_MAGENTA | (255, 0, 220) |
| COLOR_YELLOW | (255, 235, 20) |
| COLOR_ACID (verde acido) | (57, 255, 20) |
| COLOR_RED | (255, 45, 75) |
| COLOR_BG (blu scurissimo) | (8, 10, 20) |

### Nemici (costi e statistiche)
| Costante | Valore |
|---|---|
| COST_CHASER / SHOOTER / SPLITTER / TANK / BOSS | 10 / 18 / 14 / 30 / 100 |
| CHASER_HP / SPEED / CONTACT_DMG | 20 / 180 / 12 |
| SHOOTER_HP / SPEED / CONTACT_DMG | 25 / 135 / 12 |
| SHOOTER_BULLET_DMG / SPEED / RADIUS / LIFE | 8 / 260 / 5 / 3.0 |
| SPLITTER_HP / CHILD_HP / SPEED / CHILD_SPEED / CONTACT_DMG | 30 / 6 / 120 / 160 / 12 |
| TANK_HP / SPEED / CONTACT_DMG | 90 / 60 / 20 |

### Boss
| Costante | Valore |
|---|---|
| BOSS_RADIUS | 46 |
| BOSS_BASE_HP / BOSS_HP_PER_WAVE | 400 / 60 |
| BOSS_SPEED / CONTACT_DMG | 85 / 30 |
| BOSS_XP_VALUE / BOSS_SCORE_MULT | 15 / 500 |
| BOSS_BURST_INTERVAL | 2.2 s (entrambe le fasi, timer indipendente) |
| BOSS_P1_BULLETS / BOSS_P2_BULLETS | 16 / 24 |
| BOSS_BULLET_SPEED / DAMAGE / RADIUS / LIFE | 220 / 10 / 6 / 4.5 |
| BOSS_ORBIT_RADIUS | 350 |
| BOSS_CHARGE_INTERVAL / DURATION / SPEED_MULT | 3.0 s / 0.6 s / 5.0 |

### Player
| Costante | Valore |
|---|---|
| PLAYER_BASE_HP | 100 |
| PLAYER_BASE_DAMAGE | 10 |
| PLAYER_BASE_FIRE_RATE | 5.0 |
| PLAYER_BASE_SPEED | 260 |
| PLAYER_BASE_MAGNET | 70 |
| PLAYER_BASE_DASH_CD | 2.0 |
| PLAYER_BASE_BULLET_SPEED | 620 |

### XP & ondate
| Costante | Valore |
|---|---|
| XP_BASE / XP_PER_LEVEL | 4 / 3 |
| WAVE_BUDGET_BASE / QUAD | 60 / 8 |
| BOSS_WAVE_BUDGET_MULT | 0.70 |
| WAVE_CLEAR_HEAL | 15 HP |
| LEVEL_UP_HEAL | 10 HP |

### Sustain & feel
| Costante | Valore |
|---|---|
| HIT_STOP_DURATION | 0.03 s |
| LOW_HP_THRESHOLD_RATIO | 0.30 |

### Upgrade (pool completo, valori esatti di Apply)
| Tipo | Nome carta | Effetto | Colore | Max stack |
|---|---|---|---|---|
| DAMAGE | OVERCHARGE | damage ×1.25 | rosso | 6 |
| FIRERATE | HYPER TRIGGER | fireRate ×1.20 | giallo | 6 |
| MULTISHOT | SPLIT BARREL | multishot +1 | ciano | 4 |
| PIERCE | RAILGUN CORE | pierce +1 | magenta | 4 |
| SPEED | OVERDRIVE | speed ×1.12 | verde acido | 6 |
| MAXHP | NANO REINFORCE | maxHp +20 e hp +20 | verde (50,220,100) | 6 |
| DASHCD | PHASE CAPACITOR | dashCooldown ×0.85 (min 0.4) | azzurro (80,200,255) | 6 |
| MAGNET | GRAVITY WELL | magnetRadius ×1.40 | arancio (255,170,40) | 6 |
| BULLETSPEED | PLASMA ACCELERATOR | bulletSpeed ×1.15 | rosa (255,120,220) | 6 |

---

## 7. Rendering Neon & Juice

### 7.1 Principi
- Sfondo `COLOR_BG` + **griglia neon tenue** (linee ogni 64px, alpha molto basso) + bordo arena glow ciano.
- **Blending additivo** (`BLEND_ADDITIVE`) per tutti gli elementi luminosi: entrare/uscire dal blocco glow con `Neon::BeginGlow()/EndGlow()`.
- Glow = disegno a strati: alone grande a bassa alpha + core pieno. Cerchi, anelli (`DrawRing`), linee spesse; **mai texture**.

### 7.2 Ordine di draw in PLAYING
1. Sfondo + griglia (fuori camera shake, o dentro: scelta libera ma coerente).
2. `BeginMode2D` con camera shake: `offset = {SCREEN_W/2 + shake.x, SCREEN_H/2 + shake.y}`, `target = centro`, `rotation = shakeAngle` (gradi).
3. Nemici (colore per tipo da `GetEnemyColor`, bianco pieno se hit-flash, mini barra HP se ferito).
4. Proiettili nemici (magenta con scia) e player (gialli, trail = linea da `pos` a `pos - vel*0.03`).
5. Player (lampeggio se invulnerabile, canna verso aim).
6. Dentro `BeginGlow/EndGlow`: `particles.Draw()`.
7. `EndMode2D` → **vignetta low-HP** (4 bordi rossi alpha pulsante se `hp < 30% maxHp`, disegnata PRIMA dell'HUD per non oscurarlo) → HUD → `fx.DrawFlash()`.

Nota camera: `ScreenFx::GetShakeAngle()` restituisce **radianti**; `Camera2D.rotation` vuole **gradi** → `camera.rotation = GetShakeAngle() * (180/π)`.

Nota orbs: gli **Orbs XP si disegnano subito dopo l'arena e prima dei nemici** (core bianco + glow circolare pulsante con `sin(GetTime()*6 + pos.x)`) — ometterli renderebbe la progressione invisibile al giocatore.

### 7.3 Palette feedback
| Evento | Feedback |
|---|---|
| Kill nemico | burst particelle colore nemico + trauma 0.15 + hit-stop + esplosione sonora |
| Hit senza kill | mini burst bianco + hit-flash 0.1s |
| Player colpito | flash rosso 0.35 + trauma 0.4 + suono grave |
| Sparo | muzzle flash (3–5 particelle a ventaglio ±20°) + suono throttled |
| Dash | burst ciano + suono whoosh |
| Orb raccolta | mini burst giallo + blip |
| Level-up | burst ciano + arpeggio |
| Boss morto | 60 particelle + trauma 0.8 |

---

## 8. Audio Procedurale

Nessun file audio: **tutti i suoni sono Wave generate a startup** (44100 Hz, mono, 16-bit PCM, `std::vector<short>` → `LoadSoundFromWave` → `UnloadWave` immediato — raylib copia i dati).

| Suono | Ricetta di sintesi |
|---|---|
| `sfxShoot` | onda quadra discendente 880→220 Hz, 0.09s, decay esponenziale e^(−4.5t) |
| `sfxExplosion` | white noise 0.35s, lowpass a media mobile (8 campioni), decay e^(−5.5t) |
| `sfxHit` | transiente 0.04s, freq 1600→250 Hz, decay e^(−16t) |
| `sfxPickup` | sine crescente 440→880 Hz, 0.12s, attacco morbido |
| `sfxLevelUp` | arpeggio C5-E5-G5 (523.25/659.25/783.99 Hz), 0.10s per nota, con armonica di ottava |
| `sfxDash` | noise filtrato (finestra 6 campioni) 0.15s, envelope attacco 0.03s / rilascio 0.12s |
| `sfxPlayerHit` | tone 110→80 Hz, 0.20s, seconda armonica per impatto sordo |

Regole operative:
- Volume master 0.5 (`SetSoundVolume` su tutti).
- `PlayShoot` throttled: max 1 emissione ogni 40ms (`std::chrono::steady_clock`).
- `Init(enableDevice)`: se `enableDevice == false` (smoke) **zero chiamate** raylib-audio; ogni `Play*` è un no-op sicuro. Se `InitAudioDevice` fallisce → continua muto.
- `Shutdown`: `UnloadSound` (con guardia `IsSoundValid`) + `CloseAudioDevice`.
- Criterio verificabile di questa sezione: Risoluzione R3 (nessun file audio nel repo + inizializzazione headless senza device, a carico dell'harness, M5).

---

## 9. Smoke Test Harness (canale ufficiale di verifica)

**Ogni fase termina SOLO se la sua validazione è verde.** Il harness è la rete di sicurezza dello sviluppo. Da questo punto è anche il **canale ufficiale di verifica** del benchmark: la sezione Verify lo dichiara contratto `./verify.sh` (build + `--smoke` headless → `verify.json`, finestra mai lanciata).

### Comportamento `--smoke [frames] [dtScale]`
- Nessuna finestra, nessun audio device, nessuna chiamata raylib legata al contesto.
- Esegue esattamente `frames` step da `FIXED_DT · dtScale` (default dtScale 1) partendo da MENU con transizione forzata a PLAYING al primo frame.
- Input fornito da `SimulateInput(frame, world)` — un bot di sopravvivenza:
  - mira al **nemico più vicino** (altrimenti mira rotante) e **spara in continuo** (`fire = true` ogni frame);
  - **kiting**: se un nemico è entro **220px** se ne allontana; **dash d'emergenza** se un nemico è entro **110px** o un proiettile nemico entro **90px**;
  - in condizioni di sicurezza si muove verso l'**orb più vicina** o il centro;
  - in LEVELUP seleziona immediatamente la carta 1 (`pick1 = true` a ogni frame).
- Stampa ogni 240 frame `SMOKE-STATS: wave=, kills=, score=, level=, bossSpawned=, bossKilled=`; la voce `upgradesPicked=` viene appesa **solo alla stampa finale** (ultimo frame).
- Esce con **exit code 0** e stampa `SMOKE OK`; qualunque eccezione → exit 1.
- **Mai lanciare l'eseguibile senza `--smoke`** (apre una finestra interattiva).

### Criteri di accettazione per fase — vedi roadmap.

---

## 10. Roadmap di Sviluppo in Fasi

Ogni fase è **atomicamente validabile**: build verde + smoke con criteri espliciti. I contratti della Sezione 3 vanno scritti PRIMA di iniziare le fasi 2–4, perché alcune fasi sono parallelizzabili solo grazie a ownership di file disgiunti.

### Fase 1 — Scaffold + Game Loop + Smoke
**Deliverable**: CMakeLists, `main.cpp` con parse `--smoke`, `Config.hpp`, `Types.hpp`, `Game` con macchina a stati minimale (MENU→PLAYING→GAMEOVER, player finto WASD), loop a timestep fisso.
**Validazione**: `cmake -S . -B build && cmake --build build --config Release && build/Release/NeonVanguard.exe --smoke 300` → `SMOKE OK`, exit 0.

### Fase 2 — Core Gameplay
**Deliverable**: contratti §3.3–3.4, `Player` (movimento/attrito/dash/sparo), `Bullet`, `InputSnapshot` + `GatherInputReal`/`SimulateInput` (versione base), `GameWorld`, `render/Neon` helpers, arena+griglia, integrazione in Game.
**Validazione**: smoke 600 → exit 0 e `playerBullets > 0` nei log periodici.

### Fase 3 — Sistemi (2 worker in parallelo su file disgiunti, se si lavora in team)
**A) Nemici + Spawner + Collisioni**: `Enemy` (4 AI + factory + id), `SpawnDirector`, `Collision` (§5.5).
**B) Juice + Audio**: `Particles`, `Fx`, `Audio` (§7–8). Moduli standalone, NON ancora integrati.
**Validazione (entrambi)**: smoke 600 exit 0, propri file senza warning. *Nota per il parallelismo: usare build directory separate se si condivide la stessa checkout, oppure filtri disgiunti nel GLOB.*

### Fase 4 — Integrazione
**Deliverable**: Game istanzia SpawnDirector/Particles/Fx/Audio; ordine di update §4.3; camera shake Camera2D; feedback eventi §7.3; GAMEOVER funzionante; `SimulateInput` potenziato (mira nemico più vicino).
**Validazione**: smoke 900 → exit 0, `kills > 0`, `wave ≥ 2` in SMOKE-STATS.

### Fase 5 — Roguelite + UI
**Deliverable**: `Upgrades` (pool §6), `Orb` + magnetismo, campo `pierceLeft` (pierce reale), stato LEVELUP con draft 1/2/3, `Hud` completo (HP/XP/wave/score/kills/dash), MENU/PAUSED/GAMEOVER rifiniti, `highscore.txt`.
**Validazione**: smoke 1200 → exit 0, `level > 1`, `upgradesPicked ≥ 1`.

### Fase 6 — Boss + Balance + Polish
**Deliverable**: Boss due fasi §5.4, barra boss HUD, tuning §6 (fireRate 5, magnet 70, heal ondata/level-up, hit-stop, vignetta low-HP, sparkle orbs), `--smoke [frames] [dtScale]`.
**Validazione**: `--smoke 6000 6` → exit 0, `wave ≥ 6`, `bossSpawned ≥ 1`, `level ≥ 4`.

### Fase 7 — Review indipendente + Fix pass
**Deliverable**: review del codice (ODR/duplicazioni, multi-hit pierce, clamp spawn figli, contratto danno player unico, memory raylib: `UnloadWave`/`UnloadSound` con `IsSoundValid`, magari numeri in Config) + fix dei BLOCKER/MAJOR (i NIT a discrezione).
**Validazione finale di accettazione**: clean build + `--smoke 3000 4` → exit 0, `wave ≥ 8`, `bossKilled ≥ 1`, `upgradesPicked ≥ 10`, zero warning di gioco.

### Checklist anti-regressione (da rieseguire a ogni PR)
```bash
cmake --build build --config Release && ./build/Release/NeonVanguard.exe --smoke 1200 2
```

---

## 11. Regole di Qualità

1. **Zero warning** sul codice di gioco (i warning interni di raylib sono tollerati) — requisito meccanizzato dalla Risoluzione R1.
2. **Contratti prima del codice**: le struct della Sezione 3 sono legge; estendere con campi nuovi, mai rinominare.
3. **Un solo writer per file**: in team, ogni modulo ha un proprietario; le integrazioni in `Game` sono una fase dedicata a scrittore unico.
4. **Nessuna chiamata raylib dipendente da contesto in smoke mode** (input, audio, drawing).
5. **Tutti i numeri di gameplay in `Config.hpp`** — niente magic numbers nei moduli.
6. RAII e cleanup esplicito delle risorse raylib (`UnloadWave`, `UnloadSound` con `IsSoundValid`).
7. Commenti di contratto negli header pubblici (chi muta lo stato? chi è l'autorità? es. Collision sul danno player).

---

## 12. Sviluppi Futuri

Roadmap di crescita per rendere il gioco **completo, unico e vendibile**, in ordine di impatto/costo.

### 12.1 Contenuto & profondità (post-MVP)
- **Reliche passive** (stile Slay the Spire): oggetti rari non-stackabili con effetti unici (i proiettili rimbalzano sui muri; kill a catena; scudo 1-colpo ogni ondata). Distinguono la run e creano momenti "build-defining".
- **Economia & shop tra ondate**: valuta "scrap" spendibile in uno shop a metà run (heal, reroll del draft, upgrade garantiti). Aggiunge la decisione economica tipica dei roguelite vincenti.
- **Biomi/arena multiple**: 3 arene con varianti di regola (arena con muri interni; arena che si rimpicciolisce; arena a gravità alterata) selezionate a run-start — aumenta la rigiocabilità.
- **2° boss e miniboss alternativi** ogni 10 ondate, con pattern bullet-hell più sofisticati (laser telegrafati, anelli rotanti, invocazione minion).
- **Meteo di armi alternative**: shotgun (spread corto), railgun a carica, boomerang — selezionabili come "arma primaria" al primo level-up.

### 12.2 Meta-progressione (retention)
- **Meta-currency permanente** (es. "cores") convertita a fine run e spesa in un albero di sblocchi persistenti (nuove carte nel pool, +1 slot carta, start con dash extra). È il singolo meccanismo che più trasforma un arcade in un prodotto con retention.
- **Sfide giornaliere con seed**: run con seed fisso e classifica locale — sfrutta la centralizzazione RNG già prevista (`SetSeed`) come prerequisito tecnico.
- **Achievements/missioni** con sblocco cosmetici (palette alternate per il neon: "Vaporwave", "Sunset", "Toxic").

### 12.3 Esperienza & presentazione
- **Audio musica procedurale**: sequencer sintetizzato (basso + arpeggi in scala minore, intensità legata al numero di nemici vivi) — coerente col pillar zero-asset.
- **CRT/bloom pass finale**: post-process a shader (scanlines leggere, aberrazione cromatica sui flash) per un look memorabile a costo minimo.
- **Setted particles/parallax**: stelle di fondo con parallasse 3 livelli.
- **Tutorial integrato**: ondata 0 guidata con prompt contestuali (movimento→mira→dash→draft).
- **Leaderboard locale + export run**: salvataggio run summary in JSON (replay deterministici quando arriverà il RNG seedabile).

### 12.4 Tecniche & piattaforme
- **RNG seedabile centralizzato** (prerequisito già anticipato): unico `std::mt19937` iniettabile, seed da CLI `--seed N`.
- **Gamepad** (raylib lo espone nativamente): stick sinistro movimento, destro mira, trigger sparo — raddoppia l'audience.
- **Porting Web (Emscripten)**: raylib è il framework C++ più semplice per il web; il build è già asset-free, quindi il port è quasi solo configurazione CMake.
- **Steam ready**: wrapper settings (fullscreen/volume), cloud save per highscore, build CI con lo smoke harness come gate automatico (exit code 0 = merge ok).
- **Local co-op a 2 giocatori** su split-screen orizzontale: le entità sono già agnostiche dal player — estrarre `Player` in array con input sorgente parametrico.

### 12.5 Priorità consigliata (impatto per sforzo)
1. Meta-progressione + RNG seedabile → 2. Reliche → 3. Musica procedurale → 4. Gamepad → 5. Shop/relic economy → 6. Emscripten → 7. Biomi/boss extra → 8. Steam packaging.

---

## Appendice A — Toolchain (informativa)

Baseline **informativa, mai requisito**: adattarsi all'ambiente disponibile è premiato, non
trovare esattamente questa combinazione. Vale tutto ciò che compila C++20 con raylib 5.5
rispettando i contratti di Sez. 2 e le Risoluzioni R1–R4.

| Componente | Baseline | Note |
|---|---|---|
| Compilatore | MSVC v18, `/W4 /permissive- /utf-8` | GCC/Clang equivalente: `-Wall -Wextra -Wpedantic` (Sez. 2); gli altri ambienti restano legittimi |
| Generatore build | Ninja | `Visual Studio 2022+` su Windows o equivalente: il generatore non è parte del contratto |
| Build system | CMake ≥ 3.22 | richiesto da `FetchContent`/raylib come da Sez. 2 |
| Libreria | raylib 5.5 via CMake `FetchContent`, pinnata al tag `5.5` | dipendenza build-time ammessa perché pinnata; copia locale via `FETCHCONTENT_SOURCE_DIR_RAYLIB` per build offline (Sez. 2) |

---

*Fine del piano. Buona build — e che il neon sia con te.* ⚡
