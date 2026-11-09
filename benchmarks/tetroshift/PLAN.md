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
| M0 | 40 | sì | Core Tetris classico: spawn, movimento, rotazione, lock, line clear e game over con FSM valida |
| M1 | 10 | — | Griglia e operazioni pezzo tramite l'interfaccia astratta `IGrid` |
| M2 | 10 | — | Regole di lock, line clear e punteggio |
| M3 | 8 | — | Stati e transizioni della FSM |
| M4 | 10 | — | Draft carte e modificatori con seed deterministico |
| M5 | 6 | — | Negozio ed economia |
| M6 | 8 | — | Juice visivo, rendering e audio |
| M7 | 8 | — | Suite di test headless, incluso il test di indipendenza fisica/logica |
# 📐 PLAN.md — Progetto "TetroShift / MorphoTetris" (Raylib C++)

Un clone innovativo di Tetris sviluppato in **C++20** e **Raylib 5.x**, che unisce un layer di **fisica visiva** (juice: squish, wobble, screenshake) confinato al rendering, un sistema **Roguelike a modificatori/carte**, e un'architettura modulare con **griglia astratta** (`IGrid`) che tiene il core logico indipendente dalla geometria concreta.

---

## 📑 Indice
1. [Visione & Obiettivi del Progetto](#1-visione--obiettivi-del-progetto)
2. [Stack Tecnologico & Dipendenze](#2-stack-tecnologico--dipendenze)
3. [Architettura del Software & Design Patterns](#3-architettura-del-software--design-patterns)
4. [I Tre Pilastri di Innovazione](#4-i-tre-pilastri-di-innovazione)
   - [4.1 Fisica & Deformabilità — Juice Visivo](#41-fisica--deformabilità--juice-visivo)
   - [4.2 Sistema Roguelike (Carte, Reliquie, Economia)](#42-sistema-roguelike-carte-reliquie-economia)
   - [4.3 Astrazione Geometrica della Griglia](#43-astrazione-geometrica-della-griglia)
5. [Struttura delle Directory del Progetto](#5-struttura-delle-directory-del-progetto)
6. [Dettaglio dei Moduli e Interfacce C++](#6-dettaglio-dei-moduli-e-interfacce-c)
7. [Tabella delle Carte e Modificatori (Esempi MVP)](#7-tabella-delle-carte-e-modificatori-esempi-mvp)
8. [Roadmap di Sviluppo (Milestone & Task)](#8-roadmap-di-sviluppo-milestone--task)
9. [Linee Guida di Build, Test e Debugging](#9-linee-guida-di-build-test-e-debugging)
- [Non-obiettivi](#non-obiettivi)
- [Verify](#verify)
- [Appendice toolchain (informativa)](#appendice-toolchain-informativa)

---

## 1. Visione & Obiettivi del Progetto

Il progetto mira a reinventare il gameplay classico di Tetris mantenendone la reattività immediata ("game feel" arcade), ma introducendo profondità strategica e dinamismo fisico:
* **Juice Visivo Dinamico:** i pezzi sono affiancati da un modello elastico (Spring-Mass / Verlet) che produce squish, wobble, rimbalzo estetico e screenshake — effetti **puramente visivi**, che non toccano mai le collisioni logiche né lo stato canonico del pezzo (§4.1).
* **Profondità Roguelike:** Ogni partita è un "run" diviso in floor/obiettivi. Completare linee o raggiungere traguardi sblocca draft di carte che alterano radicalmente le regole (gravità multidirezionale, pezzi gelatinosi, blocchi bomba, moltiplicatori di punteggio).
* **Griglia Astratta:** il motore logico è disaccoppiato dalla griglia concreta tramite l'interfaccia `IGrid`; l'unica implementazione richiesta è la `OrthogonalGrid` 10×20 (§4.3).

---

## Non-obiettivi

- **Griglie non ortogonali** (esagonali, radiali/circolari): l'interfaccia astratta `IGrid` resta come struttura del design (§4.3), ma nessuna implementazione non ortogonale è richiesta, prevista o valutata.
- **Emscripten/WebAssembly:** nessun target web; il benchmark è nativo (Windows/Linux/macOS) e il build non deve provarci.
- La fisica Spring-Mass/Verlet **non è logica di gioco**: è juice visivo, come vincolato in §4.1.

---

## 2. Stack Tecnologico & Dipendenze

| Componente | Scelta | Motivazione |
| :--- | :--- | :--- |
| **Linguaggio** | **C++20** | Performance native, allocazione memoria controllata, `std::span`, `concepts`, `smart pointers`. |
| **Libreria Multimediale** | **Raylib 5.0+** | Rendering 2D/3D hardware-accelerated, gestione input a bassissima latenza, gestione audio senza overhead. |
| **Build System** | **CMake 3.24+** | Portabilità multipiattaforma (Windows, Linux, macOS). |
| **Sistema Fisico** | **Custom 2D Verlet / Spring-Damper** | Zero dipendenze pesanti esterne; controllo millimetrico su squish, wobble e screenshake del solo layer visivo (§4.1). |
| **UI Framework** | **Raygui / Custom Immediate GUI** | Interfaccia snella per menu, shop e draft carte integrata nel loop di Raylib. |

---

## 3. Architettura del Software & Design Patterns

L'architettura segue una combinazione di **Event-Driven Architecture**, **Strategy Pattern** (per le geometrie e modificatori) e **State Pattern** (per i flussi di gioco).

```mermaid
graph TD
    GameApp[GameApp - Main Loop] --> StateMachine[GameStateManager]
    StateMachine --> TitleState[Title / Menu State]
    StateMachine --> PlayState[PlayState]
    StateMachine --> DraftState[Card Draft State]
    StateMachine --> ShopState[Shop / Upgrade State]
    
    PlayState --> GridEngine[GridEngine (IGrid)]
    PlayState --> PieceEngine[PieceEngine - Tetromino logico]
    PlayState --> CardSystem[Card & Modifier System]
    PlayState --> EventBus[EventBus]
    PlayState --> RenderPipeline[RenderPipeline & Shaders]
    PlayState --> AudioSystem[AudioSystem]
    
    GridEngine -.-> OrthoGrid[OrthogonalGrid 10x20]
    RenderPipeline --> PhysicsEngine[PhysicsEngine - juice visivo (§4.1)]
    
    EventBus --> CardSystem
    CardSystem -->|Hooks / Mutators| PieceEngine
    CardSystem -->|Hooks / Mutators| GridEngine
```

---

## 4. I Tre Pilastri di Innovazione

### 4.1 Fisica & Deformabilità — Juice Visivo
Il layer fisico esiste **solo per il juice visivo**: non decide collisioni, piazzamenti, lock né punteggio.
* **Modello Soft-Body (Spring-Mass / Verlet):** ogni pezzo è affiancato da un reticolo di nodi e molle (*spring-damper lattice*) usato dal solo rendering per produrre squish, wobble, rimbalzo estetico e screenshake (impatti col pavimento, rotazioni a filo muro con wall kick, lock, line clear).
* **Direzione dei dati, una sola:** il reticolo visivo **legge** lo stato canonico (posizione logica del pezzo, lock, linee pulite) e lo deforma per il rendering; **non scrive mai** su di esso. A ogni lock il reticolo viene ri-sincronizzato da una copia fresca dello stato logico.
* **Varianti di massa** (Blocco d'Acciaio pesante, Blocco Gelatina, Blocco Sabbioso): sono modificatori di regole posseduti dal core logico e dalle carte (§4.2); la fisica ne rende solo la sensazione visiva.
* **Locking:** il lock è deciso dalla logica (Lock Delay, §8 M2); l'energia delle molle **non partecipa** alla decisione — al lock la fisica gioca solo l'animazione di assestamento.
* **Test obbligatorio di indipendenza fisica/logica:** una partita deterministica (seed fisso) viene simulata due volte — una con il layer fisico disattivato, una con il layer fisico attivo e sollecitato da impulsi casuali — e la sequenza di spawn, lock e line clear e il punteggio finale devono risultare **identici**. Il test è headless, fa parte della suite CTest (§8 M7) ed è richiesto dal contratto `verify` (§ Verify).

### 4.2 Sistema Roguelike (Carte, Reliquie, Economia)
* **Struttura della Run:**
  - Piani / Livelli con obiettivi (es. *Sopravvivi a 30 pezzi*, *Pulisci 12 linee*, *Sconfiggi il Boss della Gravità*).
  - Dopo ogni livello o dopo $N$ linee pulite contemporaneamente (Tetris/Triple) si attiva la fase **Draft**: scelta tra 3 carte casuali di diversa rarità (*Common, Rare, Epic, Legendary, Cursed*).
* **Tipologie di Modificatori:**
  - **Passivi (Reliquie):** Modifiche permanenti alla run (es. *"Linea di Rame: Ogni linea pulita genera 5 monete extra"*, *"Elasticità +30%"*).
  - **Attivi / Consumabili:** Abilità ricaricabili tramite linee o mana (es. *"Bomba di Gravità: distrugge 3x3 blocchi"*, *"Hold Extra"*).
  - **Maledizioni (Risk/Reward):** Bonus enormi a costo di penalità (es. *"Punteggio triplicato, ma la velocità di caduta aumenta del 50%"*).
* **Economia:** Punti ed Essenze raccolti durante il gioco permettono di acquistare consumabili nel Negozio tra un livello e l'altro.

### 4.3 Astrazione Geometrica della Griglia
L'astrazione è **struttura di design**, non una promessa di geometrie future: tiene il core logico disaccoppiato dalla griglia concreta.
* **Interfaccia `IGrid`:**
  - Coordinate logiche generalizzate `GridCoord`, indipendenti dalla geometria concreta.
  - Metodi astratti per: `IsValid(coord)`, `IsOccupied(coord)`, `SetCell(coord, cellData)`, `FindCompleteLines()`, `ClearLines(lines)`, `ToWorldPos(coord)`.
* **Unica implementazione richiesta:** `OrthogonalGrid` ($10 \times 20$) con coordinate $(x,y)$ classiche, che resta la modalità standard. Nessuna geometria non ortogonale è prevista o valutata: vedi **Non-obiettivi**.

---

## 5. Struttura delle Directory del Progetto

```text
TetrisRaylib/
├── CMakeLists.txt
├── README.md
├── PLAN.md
├── assets/
│   ├── fonts/
│   │   └── press_start.ttf
│   ├── shaders/
│   │   ├── crt_bloom.fs
│   │   └── deformation.vs
│   ├── sounds/
│   │   ├── move.wav
│   │   ├── rotate.wav
│   │   ├── drop.wav
│   │   ├── clear.wav
│   │   └── soft_impact.wav
│   └── music/
│       └── theme_synth.ogg
├── src/
│   ├── main.cpp
│   ├── core/
│   │   ├── GameApp.hpp / .cpp
│   │   ├── GameStateManager.hpp / .cpp
│   │   ├── EventBus.hpp / .cpp
│   │   └── Constants.hpp
│   ├── states/
│   │   ├── IGameState.hpp
│   │   ├── TitleState.hpp / .cpp
│   │   ├── PlayState.hpp / .cpp
│   │   ├── CardDraftState.hpp / .cpp
│   │   ├── ShopState.hpp / .cpp
│   │   └── GameOverState.hpp / .cpp
│   ├── grid/
│   │   ├── IGrid.hpp
│   │   ├── GridCoord.hpp
│   │   ├── Cell.hpp
│   │   ├── OrthogonalGrid.hpp / .cpp
│   │   └── GeometryTypes.hpp
│   ├── physics/
│   │   ├── VerletNode.hpp
│   │   ├── SpringConstraint.hpp
│   │   ├── SoftBodyMesh.hpp / .cpp
│   │   └── PhysicsEngine.hpp / .cpp
│   ├── piece/
│   │   ├── TetrominoType.hpp
│   │   ├── TetrominoDefinition.hpp
│   │   ├── ActivePiece.hpp / .cpp
│   │   └── PieceSpawner.hpp / .cpp
│   ├── roguelike/
│   │   ├── Card.hpp
│   │   ├── CardDatabase.hpp / .cpp
│   │   ├── ModifierRegistry.hpp / .cpp
│   │   ├── Inventory.hpp / .cpp
│   │   └── RunManager.hpp / .cpp
│   ├── render/
│   │   ├── Renderer.hpp / .cpp
│   │   ├── ParticleSystem.hpp / .cpp
│   │   └── ScreenEffects.hpp / .cpp
│   └── audio/
│       └── AudioManager.hpp / .cpp
```

---

## 6. Dettaglio dei Moduli e Interfacce C++

### 6.1 `IGrid.hpp` — Astrazione Griglia
```cpp
#pragma once
#include "GridCoord.hpp"
#include "Cell.hpp"
#include <vector>
#include <raylib.h>

struct LineClearResult {
    int linesCleared = 0;
    std::vector<GridCoord> clearedCells;
    float scoreMultiplier = 1.0f;
};

class IGrid {
public:
    virtual ~IGrid() = default;
    virtual void Initialize(int width, int height) = 0;
    virtual void Clear() = 0;
    virtual bool IsValidCoord(const GridCoord& coord) const = 0;
    virtual bool IsCellOccupied(const GridCoord& coord) const = 0;
    virtual const Cell& GetCell(const GridCoord& coord) const = 0;
    virtual void SetCell(const GridCoord& coord, const Cell& cell) = 0;
    
    virtual LineClearResult CheckAndClearLines() = 0;
    virtual Vector2 CoordToWorld(const GridCoord& coord, Vector2 gridOrigin, float cellSize) const = 0;
    virtual void Render(Vector2 gridOrigin, float cellSize) const = 0;
};
```

### 6.2 `SoftBodyMesh.hpp` — Nodi e Molle per il Juice Visivo
Il reticolo vive nel layer visivo (§4.1): legge lo stato logico e non lo modifica mai.
```cpp
#pragma once
#include <raylib.h>
#include <vector>

struct VerletPoint {
    Vector2 position;
    Vector2 previousPosition;
    Vector2 acceleration;
    float mass = 1.0f;
    bool isPinned = false;
};

struct Spring {
    int p1, p2;
    float restLength;
    float stiffness; // k
    float damping;
};

class SoftBodyMesh {
public:
    std::vector<VerletPoint> points;
    std::vector<Spring> springs;

    void Update(float dt, Vector2 gravity);
    void ApplyImpulse(Vector2 impulse);
    void TriggerSquish(Vector2 impactVelocity);
    void Render(Color color) const;
};
```

### 6.3 `Card.hpp` & `EventBus.hpp` — Sistema Roguelike
```cpp
#pragma once
#include <string>
#include <functional>
#include <raylib.h>

enum class CardRarity { Common, Rare, Epic, Legendary, Cursed };
enum class CardTarget { Grid, ActivePiece, Score, Spawner, Global };

struct CardContext {
    class PlayState* playState;
    class ActivePiece* piece;
    class IGrid* grid;
};

struct Card {
    std::string id;
    std::string title;
    std::string description;
    CardRarity rarity;
    CardTarget target;
    Color cardColor;
    
    // Hooks
    std::function<void(const CardContext&)> onAcquire;
    std::function<void(const CardContext&)> onPieceSpawn;
    std::function<void(const CardContext&, int linesCleared)> onLineClear;
    std::function<void(const CardContext&)> onPieceLock;
};
```

---

## 7. Tabella delle Carte e Modificatori (Esempi MVP)

| ID Carta | Nome | Rarità | Effetto Meccanico |
| :--- | :--- | :--- | :--- |
| `CARD_JELLY` | **Corpo Gelatinoso** | Common | Aumenta l'elasticità dei pezzi del 50%; i pezzi possono rimbalzare e infilarsi in fessure strette. |
| `CARD_HEAVY_IRON` | **Massa Titanica** | Rare | I pezzi cadono con massa quadrupla; al lock distruggono 1 riga sotto di loro se c'erano buchi. |
| `CARD_MAGNET_L` | **Attrazione Laterale** | Rare | Premendo un tasto, i blocchi orfani sulla griglia scivolano verso la parete più vicina. |
| `CARD_FISSION` | **Reazione a Catena** | Epic | Pulire 4 linee (Tetris) innesca un'esplosione che converte le 2 righe adiacenti in punti e le elimina. |
| `CARD_GHOST_PHASE` | **Fase Quantistica** | Epic | I pezzi possono attraversare blocchi già piazzati per i primi 0.5s dopo lo spawn. |
| `CARD_MIDAS` | **Tocco di Mida** | Legendary | Ogni 10° pezzo è d'oro: vale $5\times$ punti e ogni blocco pulito rilascia monete nello Shop. |
| `CARD_CURSE_CHAOS` | **Caos Gravitazionale** | Cursed | +100% Punti Run, ma ogni 15 secondi la direzione di caduta ruota di 90 gradi. |

---

## 8. Roadmap di Sviluppo (Milestone & Task)

Ogni milestone è pesata nel `meta.json` (tabella «Milestone pesate» in testa); la slice è M0.

### 🔹 M0 — Core Tetris classico (peso 40, slice)
La vertical slice: il pezzo cade, si muove, ruota, si blocca; le linee si puliscono; il game over arriva con la FSM in uno stato valido — tutto giocabile end-to-end.
- [x] Configurazione ambiente CMake con Raylib 5.x integrata (FetchContent o submodule).
- [x] Creazione del ciclo base `GameApp` e state machine (`GameStateManager`).
- [x] Implementazione delle strutture `GridCoord`, `Cell` e `OrthogonalGrid` (10 colonne, 20 righe).
- [x] Implementazione Tetromino standard (I, J, L, O, S, T, Z) con matrice di rotazione standard (SRS).
- [x] Logica 7-bag randomizer, DAS (Delayed Auto Shift), ARR (Auto Repeat Rate) e Lock Delay.
- [x] Rilevamento e pulizia linee con calcolo punteggio base.
- [x] Game over con la FSM in uno stato valido.

### 🔹 M1 — Griglia e operazioni pezzo tramite `IGrid` (peso 10)
- [x] Interfaccia `IGrid` come struttura del core (§4.3): `GridEngine` opera sull'astrazione, non sulla classe concreta.
- [x] Operazioni di pezzo (spawn, movimento, rotazione con wall kick, lock) e di griglia (`IsValidCoord`, `IsCellOccupied`, `SetCell`, `CheckAndClearLines`) esposte e verificate tramite l'interfaccia astratta.

### 🔹 M2 — Regole di lock, line clear e punteggio (peso 10)
- [x] Regole di Lock Delay (reset del timer, tetto di reset) codificate nel solo core logico.
- [x] Regole di rilevamento e pulizia linee, incluse le quadruple (Tetris).
- [x] Calcolo del punteggio base con moltiplicatori per linee multiple e combo.

### 🔹 M3 — Stati e transizioni della FSM (peso 8)
- [x] Stati `TitleState`, `PlayState`, `CardDraftState`, `ShopState`, `GameOverState` e transizioni tra loro (State Pattern, §3).

### 🔹 M4 — Draft carte e modificatori con seed deterministico (peso 10)
- [x] Realizzazione dell'`EventBus` per notificare eventi: `OnPieceSpawn`, `OnMove`, `OnLock`, `OnLineClear`.
- [x] Creazione del database carte (`CardDatabase`) con le prime 15-20 carte implementate (minimo 15, incluse le 7 della tabella §7).
- [x] Creazione dell'interfaccia UI `CardDraftState` (selezione a 3 carte con animazioni e tooltip).
- [ ] **Determinismo del draft:** il randomizer delle offerte è alimentato dal seed esplicito della run; stesso seed ⇒ stessa sequenza di carte offerte; un test headless lo verifica.

### 🔹 M5 — Negozio ed economia (peso 6)
- [x] Sistema di progressione a Livelli/Piani con contatore di obiettivi e negozio (`ShopState`).
- [x] Gestione inventario reliquie passive e abilità attive.
- [x] Economia: punti ed essenze raccolti in gioco permettono di acquistare consumabili nel negozio tra un livello e l'altro.

### 🔹 M6 — Juice visivo, rendering e audio (peso 8)
Tutto il layer fisico-estetico di §4.1, senza effetti sullo stato logico.
- [x] Implementazione del risolutore Verlet 2D e vincoli a molla (`SoftBodyMesh`).
- [x] Connessione tra il `Tetromino` logico e il reticolo elastico visivo (lettura a senso unico, §4.1).
- [x] Gestione degli urti con pavimento e pareti: calcolo del vettore impatto e oscillazione realistica.
- [x] Implementazione dell'effetto "Gelatina / Deformazione al contatto".
- [x] Visualizzazione rendering con poligoni Raylib deformati o shader mesh.
- [x] Sistema di particelle Raylib per impatti, frammenti di blocchi distrutti e scie.
- [x] Shader GLSL in post-processing: Bloom selettivo su blocchi neon, effetto CRT opzionale, screen shake dinamico.
- [x] Integrazione audio Raylib: effetti sonori con modulazione di pitch in base all'altezza della griglia e combo.
- [x] Transizioni fluide tra stati di gioco.

### 🔹 M7 — Suite di test headless (peso 8)
- [ ] Suite CTest headless sul core logico: spawn, rotazione e wall kick, lock, line clear, punteggio, transizioni FSM, draft deterministico.
- [ ] **Test di indipendenza fisica/logica** (§4.1): partita deterministica eseguita con fisica disattivata e con fisica attiva e sollecitata; gli stati logici risultanti devono coincidere.
- [ ] `./verify.sh` che compila, lancia la suite headless e scrive `verify.json` (vedi § Verify).
- [x] Test di regressione per garantire che l'ortogonale rimanga la modalità standard stabilissima.

---

## 9. Linee Guida di Build, Test e Debugging

### Compilazione rapida con CMake:
```bash
# Configurazione
cmake -B build -S . -DCMAKE_BUILD_TYPE=Debug

# Compilazione
cmake --build build --config Debug

# Esecuzione
./build/TetrisRaylib (o ./build/Debug/TetrisRaylib.exe su Windows)

# Test headless del core logico (la finestra non si apre mai)
ctest --test-dir build --output-on-failure
```

### Strumenti di Debug In-Game (Fasti Debug Keys):
* `F1`: Mostra hitbox fisiche e nodi molle Verlet.
* `F2`: Forza apertura immediata del Card Draft.
* `F3`: Pulizia istantanea di 4 linee (test effetti e combo).
* `F4`: Toggle wireframe / shader post-processing.
* `F5`: Ricarica rapida dello stato di gioco.

---

## Verify

`./verify.sh` è il contratto di verifica del progetto:

- **non interattivo**, termina entro **600 s**, exit 0 = pass;
- configura e compila con CMake e lancia **CTest sul core logico in modalità headless**: la finestra di gioco **non viene mai aperta**;
- la suite copre il core Tetris (spawn, rotazione/wall kick, lock, line clear, punteggio), la `IGrid`/`OrthogonalGrid`, le transizioni di FSM, il draft deterministico e il **test di indipendenza fisica/logica** (§4.1);
- scrive `verify.json` (`schema: 1`, `benchmark: "tetroshift"`, `milestones: [{id, pass, detail}]`) con **tutti gli id milestone del `meta.json`** (M0–M7).

---

## Appendice toolchain (informativa)

Baseline di riferimento per l'ambiente, **informativa e non requisito**: MSVC v18, Ninja, CMake 3.24+, raylib 5.x acquisita via `FetchContent` pinnata a un tag. L'adattamento all'ambiente disponibile viene premiato, non penalizzato; nessun tetto di toolchain entra nel punteggio.
