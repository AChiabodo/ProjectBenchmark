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
| M0 | 40 | sì | Bootstrap, build, test headless e core giocabile con game over |
| M1 | 15 | — | Collisioni deterministiche e testate |
| M2 | 12 | — | Livelli: caricamento e validazione del formato |
| M3 | 15 | — | Power-up con durata, stacking e scadenza |
| M4 | 8 | — | Stati, punteggio, HUD, audio, game feel e transizioni |
| M5 | 5 | — | Release, sanitizers e packaging redistribuibile |
| M6 | 5 | — | verify.sh che emette verify.json per ogni milestone |

`M0` è la vertical slice: bootstrap, build e test harness headless verdi, poi paddle, pallina e mattoni con collisione, vite e game over giocabili.

## Verify

Contratto di verifica del progetto risultante; è l'unico canale che vale punteggio:

- `./verify.sh` è un deliverable del progetto (milestone `M6`): non interattivo, termina entro 600 s, exit 0 = pass, exit diverso da zero = fail.
- Scrive `verify.json` con tutti gli id milestone di `meta.json` (`M0`–`M6`), ognuno esattamente una volta, con `pass` e `detail`.
- Il canale è la build CMake più la suite CTest headless prescritta ai §9 e §10, sanitizers inclusi sui toolchain compatibili: la finestra di gioco non viene mai lanciata durante la verifica (regola GUI: solo build e target di test headless).
- Lo smoke manuale e la QA interattiva richiesti nel §9 restano obbligatori per la Definition of Done, ma non fanno parte del contratto e non valgono punteggio.

# Piano di sviluppo — Breakout

## 0. Obiettivo e criteri di progetto

Realizzare un Breakout/Arkanoid 2D desktop in **C17**, con **raylib 5.5**, costruito con **CMake**, eseguibile su Windows e Linux a 1280×720.

Il piano è organizzato in vertical slice incrementali: ogni milestone deve compilare, avere test pertinenti e lasciare il gioco in uno stato eseguibile. Non si implementano due sistemi di gameplay maggiori nella stessa iterazione.

### Funzionalità finali

- paddle controllabile da tastiera;
- una o più palline;
- muri, paddle e mattoni con collisioni deterministiche;
- mattoni normali, resistenti e indistruttibili;
- punteggio, vite, livelli e progressione;
- quattro power-up: paddle largo, multiball, pallina lenta, vita extra;
- menu, pausa, vittoria, game over e riavvio;
- HUD, effetti visivi e audio opzionali;
- build, test headless, sanitizers e pacchetto redistribuibile.

### Non-obiettivi dell'MVP

Niente ECS, fisica esterna, JSON, scripting, networking, salvataggi, editor di livelli, dipendenze oltre raylib, multiplayer o sistema di particelle generico.

---

## 1. Decisioni tecniche bloccate

### Stack e dipendenze

```text
Linguaggio:       C17, estensioni C disabilitate
Framework:        raylib 5.5
Build:            CMake >= 3.24
Test:             CTest + piccolo harness C con assert/test macros
Piattaforme:      Windows e Linux
Risoluzione:      1280x720; resize non richiesto per l'MVP
Simulazione:      fixed timestep 1/120 s, massimo 8 step di catch-up
Livelli:          TXT rettangolari, formato definito al §7
Random:           PRNG interno con seed conservato nello stato Game
```

### Acquisizione di raylib tramite CMake

Usare **una sola strategia**, `FetchContent`, senza mescolare raylib di sistema, package manager e copia vendorizzata:

```cmake
set(RAYLIB_VERSION "5.5" CACHE STRING "Pinned raylib version")
include(FetchContent)
FetchContent_Declare(raylib
    URL "https://github.com/raysan5/raylib/archive/refs/tags/${RAYLIB_VERSION}.tar.gz"
    URL_HASH SHA256=aea98ecf5bc5c5e0b789a76de0083a21a70457050ea4cc2aec7566935f5e258e
    DOWNLOAD_EXTRACT_TIMESTAMP OFF
)
FetchContent_MakeAvailable(raylib)
```

Requisiti del bootstrap:

1. `RAYLIB_VERSION` deve essere usato da CMake e non duplicato nei sorgenti.
2. Il progetto deve documentare il tag `5.5`, l'URL e la data di verifica (`2026-08-20`).
3. Il download deve essere cacheabile e l'opzione `FETCHCONTENT_FULLY_DISCONNECTED=ON` deve consentire build offline dopo il primo download.
4. Il bootstrap è riproducibile con `URL_HASH SHA256=aea98ecf5bc5c5e0b789a76de0083a21a70457050ea4cc2aec7566935f5e258e`, verificato sull'archivio dell'URL sopra; registrare lo stesso valore nel README.
5. Per CI usare cache CMake/FetchContent; non seguire `master` e non aggiornare la versione durante milestone di gameplay.

Il target applicativo deve linkare il target CMake esportato `raylib`, senza aggiungere manualmente OpenGL, X11 o altre librerie di sistema.

### Comandi canonici

Se è installato Ninja, creare i preset `debug`, `release` e `asan` in `CMakePresets.json` e usare:

```bash
cmake --preset debug
cmake --build --preset debug
ctest --preset debug
```

```bash
cmake --preset release
cmake --build --preset release
ctest --preset release
```

Il preset `asan` deve attivare `ENABLE_SANITIZERS=ON` sui toolchain compatibili:

```bash
cmake --preset asan
cmake --build --preset asan
ctest --preset asan
```

Fallback indipendente dai preset:

```bash
cmake -S . -B build/debug -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON
cmake --build build/debug --config Debug
ctest --test-dir build/debug --output-on-failure
```

Windows PowerShell, dopo la build:

```powershell
cmake --build build/debug --config Debug
ctest --test-dir build/debug -C Debug --output-on-failure
```

Esecuzione manuale: usare il working directory della directory che contiene `assets/` copiata dal post-build, oppure il percorso prodotto da CMake indicato dal README. Il gioco non deve funzionare soltanto dalla root del repository per effetto di path impliciti.

Packaging:

```bash
cmake --install build/release --prefix dist/breakout
cpack --config build/release/CPackConfig.cmake -G TGZ   # Linux
cpack --config build/release/CPackConfig.cmake -G ZIP   # Windows
```

Il pacchetto deve contenere l'eseguibile, `assets/levels`, gli eventuali asset audio/texture e le licenze. Va eseguito da una directory temporanea esterna al repository.

---

## 2. Architettura e confini

Il core di simulazione deve essere utilizzabile senza finestra, GPU o audio:

```text
main/app raylib
    ├── PollInputFrame()        -> InputFrame
    ├── GameUpdate(Game, input, frameDt)
    ├── GameEvents              -> audio/particelle/UI
    └── GameDraw(Game, assets)
```

`main.c` possiede il ciclo raylib e l'ordine di inizializzazione. `Game` possiede lo stato autorevole. Il rendering è osservazionale e non modifica il gameplay.

Struttura prevista, da far crescere solo quando serve:

```text
CMakeLists.txt
CMakePresets.json
README.md
assets/
  levels/level01.txt
  levels/level02.txt
  levels/level03.txt
  audio/                         # solo dalla milestone audio
  textures/                      # solo se servono
src/
  main.c
  app.c / app.h
  core/game.c / game.h
  core/collision.c / collision.h
  core/level.c / level.h
  core/powerup.c / powerup.h
  platform/input.c / input.h
  platform/renderer.c / renderer.h
  platform/assets.c / assets.h
  platform/audio.c / audio.h
tests/
  test_collision.c
  test_game_rules.c
  test_level.c
  test_powerup.c
```

Il core definisce piccoli tipi propri (`Vec2`, `Rect`) e non include raylib. L'adapter converte questi tipi in `Vector2`/`Rectangle` solo nel bordo platform. Non usare funzioni come `GetFrameTime()`, `IsKeyDown()` o `PlaySound()` dentro `src/core`.

### Ciclo di vita

1. `InitWindow`.
2. `InitAudioDevice` se l'audio è abilitato; in assenza di device l'audio opzionale viene disabilitato con warning.
3. Caricamento e validazione degli asset.
4. `GameInit(seed)`.
5. Ogni frame: input → simulazione → eventi → streaming audio → draw.
6. Unload asset, chiusura audio, `CloseWindow` in ordine inverso.

Ogni risorsa caricata deve avere un solo proprietario e un solo unload corrispondente. Gli asset essenziali devono fallire con messaggio chiaro; quelli opzionali possono usare placeholder/disabilitazione.

---

## 3. Modello dati obbligatorio

Il modello deve essere stabile prima di aggiungere multiball o power-up. La pallina **non** è un campo singolo di `Game`.

```c
typedef struct { float x, y; } Vec2;
typedef struct { float x, y, width, height; } Rect;

typedef enum {
    GAME_MENU,
    GAME_READY,
    GAME_PLAYING,
    GAME_PAUSED,
    GAME_LEVEL_COMPLETE,
    GAME_WON,
    GAME_OVER
} GameState;

typedef enum {
    BRICK_NORMAL,
    BRICK_STRONG,
    BRICK_UNBREAKABLE
} BrickType;

typedef struct {
    Vec2 position;
    Vec2 velocity;
    float radius;
    bool active;
    bool launched;
    unsigned int id;
} Ball;

typedef struct {
    Rect rect;
    float baseWidth;
    float moveSpeed;
} Paddle;

typedef struct {
    Rect rect;
    BrickType type;
    int hitPoints;
    bool active;
    unsigned int id;
} Brick;

typedef enum {
    POWERUP_WIDE,
    POWERUP_MULTIBALL,
    POWERUP_SLOW,
    POWERUP_LIFE
} PowerUpType;

typedef struct {
    Vec2 position;
    float fallSpeed;
    PowerUpType type;
    bool active;
    unsigned int id;
} PowerUp;

typedef struct {
    float wideRemaining;
    float slowRemaining;
} EffectState;

typedef struct {
    GameState state;
    unsigned int seed;
    unsigned int nextEntityId;
    int score;
    int lives;
    int levelIndex;
    int levelCount;
    float stateTimer;
    float accumulator;
    bool levelBonusAwarded;
    Paddle paddle;
    Ball balls[MAX_BALLS];
    int ballCount;
    Brick bricks[MAX_BRICKS];
    int brickCount;
    PowerUp powerups[MAX_POWERUPS];
    EffectState effects;
} Game;
```

Costanti iniziali da centralizzare in `game_config.h`:

```text
MAX_BALLS=8, MAX_POWERUPS=16, MAX_BRICKS=120
STARTING_LIVES=3, MAX_LIVES=5
WIDE_DURATION=10.0 s, SLOW_DURATION=8.0 s
POWERUP_DROP_CHANCE=0.125
FIXED_DT=1.0/120.0 s, MAX_FRAME_DT=0.100 s
MAX_CONTACTS_PER_BALL_PER_STEP=4
```

`currentPaddleWidth` e la velocità effettiva delle palline non vengono salvate come verità separata: sono derivate da `baseWidth` ed `EffectState`, così la scadenza ripristina sempre i valori base senza stato obsoleto.

---

## 4. Timing e input

- `GetFrameTime()` viene letto una sola volta nel bordo raylib.
- Il delta visuale viene limitato a `MAX_FRAME_DT`.
- La simulazione accumula il delta ed esegue step da `FIXED_DT`; il numero di step per frame è limitato a 8.
- Dopo 8 step, l'accumulatore viene limitato a meno di un `FIXED_DT` (il tempo arretrato in eccesso viene scartato), evitando la spirale di catch-up.
- Una pausa o un frame oltre il limite non deve produrre un salto enorme della pallina.
- `InputFrame` contiene intenzioni già tradotte: `moveX` in `[-1,1]`, `launchPressed`, `pausePressed`, `restartPressed`, `confirmPressed`.
- Movimento: `A/D` oppure frecce; combinazione simultanea annulla il movimento (`moveX=0`), senza priorità nascosta.
- I tasti evento sono consumati una sola volta anche se un frame grafico produce più fixed step.
- Il gioco deve funzionare allo stesso modo con step espliciti nei test e con frame rate variabile nel frontend.

---

## 5. Contratto collisioni

Separare sempre **detection** e **resolution**. `CheckCollisionCircleRec` può essere usata nel bordo o come broad phase, ma non sostituisce la risoluzione.

### Regole generali

1. Calcolare il candidato più vicino con posizione precedente, posizione corrente e penetrazione.
2. Determinare normale di contatto e profondità/tempo di impatto.
3. Correggere la posizione lungo la normale con un epsilon, prima di riflettere la velocità.
4. Riflettere una sola volta per contatto e soltanto se la velocità è diretta verso l'ostacolo.
5. Usare un ordine deterministico: muri, paddle, poi mattoni ordinati per `id`.
6. Processare al massimo 4 contatti per pallina per fixed step; contatti oltre il limite vengono lasciati al prossimo step dopo una correzione di sicurezza.
7. Due contatti con tempo di impatto uguale entro epsilon usano la normale combinata normalizzata; ciascun mattone viene danneggiato una sola volta nello step.
8. Una pallina non può colpire due volte lo stesso mattone soltanto perché è rimasta penetrata.

### Muri

- Sinistra/destra: clamp della coordinata `x` a bordo + raggio e inversione di `velocity.x` solo se sta uscendo.
- Alto: clamp della coordinata `y` a bordo + raggio e inversione di `velocity.y` solo se sta uscendo.
- Basso: non è un rimbalzo; la pallina diventa inattiva e viene gestita dalla regola vite.

### Paddle

La collisione vale solo quando la pallina sta scendendo (`velocity.y > 0`) e attraversa la superficie superiore del paddle. Correggere `y` sopra il paddle prima del bounce.

```text
impact = clamp((ball.center.x - paddle.center.x) / (paddle.width / 2), -1, 1)
velocity.x = impact * MAX_HORIZONTAL_BOUNCE_SPEED
velocity.y = -sqrt(max(MIN_VERTICAL_SPEED^2,
                       speed^2 - velocity.x^2))
```

Il vettore risultante deve puntare verso l'alto, avere una componente verticale minima e non superare la velocità massima. Il bordo sinistro produce traiettoria sinistra, il centro traiettoria quasi verticale, il bordo destro traiettoria destra.

### Mattoni

- Normale: 1 HP; viene disattivato al colpo; +100 punti.
- Strong: 2 HP; il primo colpo porta a 1 HP, il secondo lo distrugge; +200 punti soltanto alla distruzione.
- Unbreakable: non perde HP e non dà punti, ma rimbalza.
- La normale si ricava dal lato di ingresso/penetrazione minima, non invertendo entrambi gli assi per ogni overlap.
- La distruzione/decremento HP e l'evento di bounce avvengono una sola volta per contatto.

### Tunneling e casi limite

La velocità massima e la dimensione minima dei collider devono garantire che uno step non attraversi un mattone. Se il rapporto non è garantito, usare substep adattivi con massimo 8 suddivisioni oppure una swept circle-vs-AABB. È obbligatorio un test che lanci la pallina ad alta velocità contro un mattone sottile.

Sono obbligatori test per contatto esatto, sovrapposizione profonda, angolo, contatto simultaneo, rimbalzo ripetuto, parete ad alta velocità, paddle ai bordi e più mattoni attraversati nello stesso step.

---

## 6. Regole di gameplay

### Palline, lancio e perdita

- All'avvio di una vita esiste una sola pallina attiva, ancorata sopra il paddle e non lanciata.
- `SPACE`/Enter in `GAME_READY` la lancia con una direzione iniziale deterministica.
- Il numero di vite diminuisce soltanto quando **l'ultima** pallina attiva esce dal bordo inferiore.
- Con vite residue, reset di pallina, paddle ed effetti temporanei secondo le regole documentate; il punteggio e i mattoni restano.
- Con `lives == 0`, transizione a `GAME_OVER` senza decrementi ulteriori.
- `ballCount` è il numero di slot usati; ogni `Ball.active` è verificato prima dell'update.

### Multiball

- `MAX_BALLS=8`.
- Il pickup crea due palline aggiuntive a partire dalla pallina che lo raccoglie, con angoli simmetrici e velocità uguale; se non c'è capacità, crea il massimo possibile.
- Le palline sono entità indipendenti; collisioni, perdita e rendering iterano sull'array.
- La raccolta è istantanea, non ha timer e non si accumula oltre `MAX_BALLS`.
- Le palline aggiuntive non generano vite extra quando si perdono; la vita si valuta solo quando non resta alcuna pallina attiva.

### Punteggio e vite

```text
mattone normale distrutto: 100
mattone strong distrutto:  200
completamento livello:     1000
vita iniziale:             3
vita massima:              5
```

I punti non vengono assegnati a un mattone indistruttibile né al semplice danneggiamento del mattone strong. Una ricompensa di livello viene assegnata una sola volta, protetta da `levelBonusAwarded`.

---

## 7. Livelli e validazione del formato

Usare TXT, senza JSON. Il formato è volutamente rigido per evitare livelli ambigui:

```text
0 = vuoto
1 = mattone normale (1 HP)
2 = mattone strong (2 HP)
3 = mattone indistruttibile
```

Costanti: `LEVEL_COLUMNS=12`, `LEVEL_ROWS=10`. Ogni file deve contenere esattamente 10 righe da esattamente 12 caratteri. Sono accettati LF e CRLF; il newline finale è opzionale. Non sono ammessi BOM UTF-8, righe vuote, spazi, tab, commenti, caratteri non ASCII o righe extra.

`LevelParseText` deve:

- controllare dimensione massima del buffer prima del parsing;
- distinguere file mancante, riga corta, riga lunga, troppe/pochi righe, carattere non valido e livello senza mattoni distruttibili;
- produrre un errore leggibile con numero di riga e colonna;
- non modificare il livello corrente se la validazione fallisce;
- rifiutare un livello privo di `1` o `2`, perché sarebbe completato immediatamente.

Separare:

```c
LevelError LevelParseText(const char *text, size_t length, LevelData *out);
LevelError LevelLoadFile(const char *filename, LevelData *out);
bool LevelApply(Game *game, const LevelData *level);
```

`assets/levels/level01.txt`, `level02.txt` e `level03.txt` devono essere inclusi nel pacchetto tramite una lista esplicita, non tramite scansione dipendente dal sistema operativo. Gli ID dei mattoni vengono assegnati in ordine riga/colonna per rendere i test e gli eventi deterministici.

### Transizione vittoria → livello successivo/menu

1. Quando il conteggio dei mattoni distruttibili attivi raggiunge zero, aggiungere il bonus una sola volta e passare a `GAME_LEVEL_COMPLETE`.
2. Congelare palline, pickup e input di movimento; mostrare livello completato e punteggio.
3. Dopo almeno 0,75 s, `SPACE`/Enter conferma:
   - se esiste un livello successivo: incrementare `levelIndex`, caricare e validare il file successivo, azzerare il bonus, ricreare mattoni/pallina e passare a `GAME_READY`;
   - se non esiste: passare a `GAME_WON`.
4. Se il caricamento del livello successivo fallisce, mostrare errore controllato e tornare a `GAME_MENU`, senza usare dati parziali.
5. In `GAME_WON` mostrare risultato finale; Enter/Space o `R` avvia una nuova partita dal livello 1, `Esc` torna al menu.
6. In `GAME_OVER`, `R` riavvia dal livello 1 e `Esc` torna al menu.

---

## 8. Power-up ed effetti temporizzati

Un mattone distrutto ha probabilità deterministica del 12,5% di generare un pickup. Il PRNG riceve il seed in `GameInit`; i test usano seed fissi e possono iniettare una sequenza nota.

Il pickup cade verticalmente a velocità costante e viene disattivato se esce dal fondo. La collisione con il paddle applica l'effetto una sola volta.

| Tipo | Applicazione | Durata/stacking | Ripristino |
|---|---|---|---|
| `POWERUP_WIDE` | paddle più largo del 60% | timer impostato a 10 s; raccolte successive fanno **refresh**, non somma | al timer 0, larghezza base e clamp dentro lo schermo |
| `POWERUP_SLOW` | velocità di tutte le palline × 0,70 | timer impostato a 8 s; refresh, non stacking | al timer 0, velocità normale mantenendo direzione |
| `POWERUP_MULTIBALL` | crea palline aggiuntive | istantaneo; capacità massima 8 | le palline persistono finché non vengono perse |
| `POWERUP_LIFE` | `lives += 1` | istantaneo; non supera 5 | nessun rollback |

I timer vengono decrementati solo in `GAME_PLAYING`, non durante pausa, menu o schermata di completamento. La scadenza deve essere gestita con `previous > 0 && new <= 0`, ricalcolando i valori effettivi e correggendo velocità/posizioni se necessario. Il fattore slow viene applicato a una velocità base derivata, mai moltiplicato di nuovo a ogni frame o a ogni refresh. Un reset di vita non deve lasciare un timer o un paddle largo per errore: la policy scelta deve essere codificata e testata; per questo piano il reset della pallina **conserva** gli effetti ancora attivi, mentre il cambio livello li azzera.

---

## 9. Milestone con criteri di accettazione e verifica

I pesi e la slice vivono in `meta.json` (tabella «Milestone pesate» all'inizio del piano); questa sezione dettaglia implementazione, accettazione e comandi. Il canale che vale punteggio è il contratto `## Verify`: build CMake + suite CTest headless, finestra mai lanciata. I blocchi «Verifica» qui sotto sono i comandi concreti di quel canale; lo smoke manuale è QA e non vale punteggio.

### M0 — Bootstrap, build, test headless e core giocabile con game over

**Peso 40 — vertical slice.**

**Implementare:** `CMakeLists.txt`, preset, acquisizione raylib 5.5, target `game_core`, target eseguibile, CTest, warning target-locali, opzione sanitizers, copia/install degli asset e README minimo; paddle controllabile, una pallina ancorata/lanciabile, griglia di mattoni normali, movimento, draw con primitive raylib, muri, vite, perdita della pallina, game over e vittoria provvisoria.

**Accettazione:**

- configure da directory pulita senza codice raylib nei test;
- `game_core` compila in C17 con `-Wall -Wextra -Wpedantic` o `/W4`;
- l'eseguibile apre e chiude una finestra vuota;
- CTest trova almeno un test headless;
- nessun asset viene caricato prima di `InitWindow`;
- partita completa senza asset esterni: `GameUpdate` non usa raylib, il movimento dipende da `dt`, `SPACE` lancia una sola volta e il reset non lascia entità stale;
- vite e game over già giocabili nella slice: la pallina persa decreta una vita e a vite esaurite la partita termina con game over.

**Verifica:**

```bash
rm -rf build/debug && cmake --preset debug
cmake --build --preset debug
ctest --preset debug --output-on-failure
```

Su PowerShell usare `Remove-Item -Recurse -Force build/debug` se necessario. Smoke manuale (QA, fuori dal contratto verify): eseguire il binario per almeno 5 secondi e chiuderlo normalmente; avvio → movimento A/D e frecce → lancio → rimbalzo → mattone distrutto → perdita → reset → distruzione dell'ultima fila.

### M1 — Collisioni deterministiche e testate

**Implementare:** normale di contatto, correzione di penetrazione, paddle-angle, contatti multipli, substep/swept anti-tunneling, limiti di contatti per step ed eventi di collisione; angolo, tunneling e collisioni multiple nello stesso frame con i rispettivi test.

**Accettazione:** nessun incollamento o jitter visibile a pareti/paddle; la pallina non attraversa un mattone ad alta velocità; un overlap non raddoppia danno/punteggio; contatti simultanei hanno esito deterministico.

**Verifica:**

```bash
cmake --build --preset debug
ctest --test-dir build/debug -R "collision|physics" --output-on-failure
ctest --test-dir build/debug --output-on-failure
```

Aggiungere test per tutti i casi del §5 prima di procedere.

### M2 — Livelli: caricamento e validazione del formato

**Implementare:** parser puro, loader file, diagnostica e tre livelli; la transizione vittoria → livello successivo/menu del §7 è della milestone `M4`.

**Accettazione:** file valido carica una griglia rettangolare; ogni input invalido viene rifiutato senza corrompere il livello precedente.

**Verifica:**

```bash
cmake --build --preset debug
ctest --test-dir build/debug -R "level|parser" --output-on-failure
```

Testare LF, CRLF, newline mancante, riga corta/lunga, carattere `4`, spazio, BOM, file vuoto, righe extra e livello senza `1/2`.

### M3 — Power-up con durata, stacking e scadenza

**Implementare:** array `balls[]`, array `powerups[]`, spawn deterministico, raccolta, timer, stacking, scadenza, ripristino e massimo entità.

**Accettazione:** multiball non usa più un campo singolo; ogni pallina collide e viene disegnata; una vita si perde solo quando tutte sono inattive; wide/slow scadono correttamente; pickup in pausa non avanza; vita extra rispetta il cap.

**Verifica:**

```bash
cmake --build --preset debug
ctest --test-dir build/debug -R "powerup|multiball|effect" --output-on-failure
```

Smoke manuale: raccogliere ciascun pickup, attendere la scadenza, raccogliere due volte lo stesso effetto e perdere palline in ordine diverso.

### M4 — Stati, punteggio, HUD, audio, game feel e transizioni

**Implementare:** `GAME_MENU`, `GAME_READY`, `GAME_PLAYING`, `GAME_PAUSED`, `GAME_LEVEL_COMPLETE`, `GAME_WON`, `GAME_OVER`; vite, punteggio, mattoni strong/unbreakable e reset; HUD, menu e schermate finali, adapter input, renderer separato, caricamento asset con validazione, effetti audio e music stream opzionale; particelle in array statico, trail limitato, flash mattone, screen shake leggero, aumento velocità con limiti e bilanciamento dei livelli; transizione vittoria → livello successivo/menu descritta al §7.

**Accettazione:** 3 vite iniziali; decremento solo alla perdita dell'ultima pallina; game over a zero; pausa congela simulazione; punteggio esatto secondo §6; bonus di livello una sola volta; completamento blocca il gioco e la conferma passa al livello successivo o a `GAME_WON`, con errore di caricamento controllato; il core resta headless; risorse caricate una sola volta e scaricate in ordine; asset mancanti producono fallback o errore leggibile; `UpdateMusicStream` viene chiamato ogni frame; suoni di collisione non si ripetono a ogni frame di overlap; effetti non cambiano le regole; nessuna allocazione per frame; frame time limitato; performance stabile; toggle debug per FPS, collider, numero palline/pickup e stato.

**Verifica:**

```bash
cmake --build --preset debug
ctest --test-dir build/debug -R "game|score|state|life|progression" --output-on-failure
ctest --preset debug --output-on-failure
```

Smoke manuale: pausa/ripresa, perdita ripetuta, game over, restart e ritorno al menu; con audio disponibile: menu, suoni per bounce/distruzione/pickup, pausa/ripresa, mute se previsto, chiusura e riavvio ripetuto — se il device non è disponibile, registrare il limite senza segnare l'audio come verificato; a frame rate normale e con finestra ridimensionata se supportato, verificando che particelle e shake non modifichino punteggio o collisioni.

### M5 — Release, sanitizers e packaging redistribuibile

**Implementare:** documentazione completa, install rules, CPack ZIP/TGZ, eventuale CI, asset attribution e checklist di rilascio.

**Accettazione:** build Release pulita; test Debug/Release/ASan compatibili; pacchetto eseguibile fuori dal repository; asset presenti; avvio, partita, pausa, vittoria, game over e shutdown verificati.

**Verifica:**

```bash
cmake --preset release
cmake --build --preset release
ctest --preset release --output-on-failure
cmake --install build/release --prefix dist/breakout
cpack --config build/release/CPackConfig.cmake -G TGZ
```

Su Windows produrre anche ZIP e verificare il `.exe` dal contenuto estratto. Eseguire ASan/UBSan ove supportato e correggere il primo report, senza distribuire i runtime sanitizer.

### M6 — verify.sh che emette verify.json per ogni milestone

**Implementare:** `verify.sh` alla root del progetto: configura, compila ed esegue la suite CTest headless e scrive `verify.json` secondo il contratto `## Verify`.

**Accettazione:**

- non interattivo e termina entro 600 s; exit 0 se e solo se la suite del canale passa;
- scrive `verify.json` con `schema: 1`, `benchmark: "breakout"` e tutti gli id `M0`–`M6`, ognuno esattamente una volta, con `pass` e `detail`;
- la finestra di gioco non viene mai lanciata: solo build e target di test headless;
- usa i preset quando disponibili, altrimenti il fallback senza preset del §1.

**Verifica:**

```bash
./verify.sh
cat verify.json
```

---

## 10. Suite di test obbligatoria

I test devono essere piccoli, deterministici e privi di finestra/audio.

### Collisioni e fisica

- movimento con `dt=1/120` e con più frame rate equivalenti;
- clamp e rimbalzo su ciascun muro;
- contatto esatto e sovrapposizione profonda;
- paddle centro/bordo sinistro/bordo destro;
- paddle colpito mentre la pallina sale: nessun bounce spurio;
- mattone normale, strong al primo/secondo colpo e unbreakable;
- corner hit e due collider allo stesso tempo;
- alta velocità senza tunneling;
- posizione separata dopo la risoluzione;
- limite dei contatti per step e assenza di doppio damage.

### Regole e transizioni

- seed uguale → stesso spawn e stessa sequenza di pickup;
- 3 vite iniziali, perdita dell'ultima pallina e game over;
- multiball con 0, 1 e `MAX_BALLS` slot disponibili;
- score esatto e bonus di livello idempotente;
- menu → ready → playing, pause/resume, restart;
- livello completo → livello successivo → game won;
- errore caricamento livello successivo → menu senza stato parziale.

### Effetti

- timer decrementa soltanto in playing;
- wide e slow fanno refresh, non stacking;
- scadenza ripristina i valori base;
- reset vita conserva gli effetti attivi secondo §8;
- cambio livello azzera gli effetti;
- vita extra non supera 5.

### Parser

Testare ogni errore del §7 e verificare che `LevelData` di output non venga pubblicato se il parsing fallisce.

CTest deve esporre test nominati, ad esempio `collision_response`, `game_rules`, `level_parser`, `powerup_effects`, con `--output-on-failure` utile in CI.

---

## 11. Definition of Done finale

### Codice e architettura

- [ ] C17 senza estensioni e raylib 5.5 acquisita in modo dichiarato da CMake.
- [ ] Core di simulazione compilabile e testabile senza raylib window/audio.
- [ ] Array di palline esplicito, con limite e gestione della perdita dell'ultima pallina.
- [ ] Effetti temporizzati con policy di stacking, scadenza e ripristino codificata.
- [ ] Collision detection e resolution separate, con correzione posizione e anti-tunneling.
- [ ] Nessun global gameplay state non motivato e nessuna allocazione per frame.

### Build e distribuzione

- [ ] Configure/build/test Debug funzionano da directory pulita.
- [ ] Release compila e installa l'intero albero `assets/`.
- [ ] ASan/UBSan è eseguito o la limitazione del compilatore è documentata.
- [ ] ZIP Windows e TGZ Linux sono prodotti e testati fuori dal repository.
- [ ] README riporta prerequisiti, comandi, controlli, working directory, versione raylib e licenze.

### QA

- [ ] Suite CTest passa.
- [ ] Sono verificati fisica, score, vite, parser e transizioni con test automatici.
- [ ] Sono stati eseguiti smoke test interattivi per menu, gioco, pausa, restart, vittoria, game over e uscita.
- [ ] Asset mancanti, device audio assente e caricamento livello invalido hanno comportamento controllato.
- [ ] Il report finale separa evidenze automatiche, QA manuale eseguita e limiti non verificati.

---

## 12. Istruzioni operative per l'agente di sviluppo

- Usa esclusivamente C17, raylib 5.5 e CMake salvo autorizzazione esplicita.
- Prima di modificare il codice, leggi questo piano, `CMakeLists.txt`, README, test e stato Git.
- Implementa una sola milestone alla volta; non aggiungere polish mentre stai correggendo la fisica.
- Per ogni milestone: aggiungi prima i test del core, implementa il minimo, compila, esegui CTest, poi fai smoke test del gioco.
- Non spostare la logica di gioco in `main.c` e non chiamare API raylib dal core.
- Usa array a dimensione fissa e ID stabili finché i requisiti non richiedono altro.
- Mantieni tutte le costanti di gameplay in un punto documentato.
- Non usare `-Werror` sui sorgenti di raylib; i warning del progetto devono però essere trattati e spiegati.
- Non ignorare warning, sanitizer, file mancanti o risorse raylib invalide.
- Non modificare sistemi non pertinenti alla milestone corrente.
- Aggiorna README, test e istruzioni di packaging insieme alla funzionalità che li rende obsoleti.
- Prima di dichiarare una milestone completata, riportare: file cambiati, comandi eseguiti, risultati dei test, smoke test eseguiti e rischi residui.

---

## Appendice — baseline toolchain (informativa, non vincolante)

La baseline è un riferimento informativo, mai un requisito: il piano premia l'adattamento all'ambiente trovato, non l'aver indovinato la toolchain dell'host.

| strumento | baseline di riferimento |
|---|---|
| Compilatore | MSVC v18 (toolset di Visual Studio 2026) su Windows; GCC/Clang recenti su Linux |
| Generator | Ninja |
| Build system | CMake ≥ 3.24 |
| Libreria | raylib 5.5, acquisizione `FetchContent` pinnata a tag + SHA256 (§1) |

Nota per CMake ≥ 4: la compatibilità con `cmake_minimum_required` inferiore a 3.5 è stata rimossa. raylib 5.5 dichiara esattamente `VERSION 3.5`, quindi configura anche con CMake ≥ 4; se una dipendenza dichiarasse meno di 3.5 e la configurazione fallisse, impostare il floor `-DCMAKE_POLICY_VERSION_MINIMUM=3.5`.
