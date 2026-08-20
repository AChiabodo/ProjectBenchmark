

## Obiettivo tecnico

Realizzare un **Breakout/Arkanoid 2D desktop** con:

- paddle controllabile;
- pallina con collisioni;
- griglia di mattoni distruttibili;
- vite e punteggio;
- livelli;
- power-up;
- menu e game over;
- effetti grafici/audio semplici.

### Stack

```text
Language:     C17
Framework:    raylib
Build:        CMake
Target:       Windows / Linux
Resolution:   1280x720
Rendering:    raylib 2D
Audio:        raylib audio API
Data:         semplici struct C + eventualmente file JSON/TXT per i livelli
```

Per il primo MVP terrei **zero dipendenze oltre raylib**.

---

### SKILL

Se disponibile, **usa la skill build-raylib-c-games per sviluppare il gioco**

# 1. Struttura iniziale

Farei creare all'agente qualcosa di simile:

```text
breakout/
├── CMakeLists.txt
├── assets/
│   ├── sounds/
│   ├── textures/
│   └── levels/
│
├── src/
│   ├── main.c
│   ├── game.c
│   ├── game.h
│   ├── paddle.c
│   ├── paddle.h
│   ├── ball.c
│   ├── ball.h
│   ├── brick.c
│   ├── brick.h
│   ├── level.c
│   ├── level.h
│   ├── powerup.c
│   └── powerup.h
│
└── README.md
```

Non separerei ulteriormente il codice finché non emerge una necessità concreta.

---

# 2. Data model fondamentale

Chiederei all'agente di definire subito poche `struct` stabili:

```c
typedef struct {
    Vector2 position;
    Vector2 size;
    float speed;
} Paddle;

typedef struct {
    Vector2 position;
    Vector2 velocity;
    float radius;
    bool active;
} Ball;

typedef struct {
    Rectangle rect;
    int hitPoints;
    bool active;
} Brick;

typedef struct {
    int score;
    int lives;
    int level;
    GameState state;

    Paddle paddle;
    Ball ball;

    Brick bricks[MAX_BRICKS];
    int brickCount;
} Game;
```

Con:

```c
typedef enum {
    GAME_MENU,
    GAME_PLAYING,
    GAME_PAUSED,
    GAME_WON,
    GAME_OVER
} GameState;
```

Questo dà all'agente una struttura abbastanza chiara da evitare stato globale sparso ovunque.

---

# 3. Milestone 1 — Core playable prototype

Prima richiesta all'agente:

> Implement only the minimal playable Breakout loop. Do not add power-ups, menus, audio, particles or abstractions that are not required.

Funzioni richieste:

```c
GameInit()
GameUpdate()
GameDraw()
GameReset()

PaddleUpdate()
PaddleDraw()

BallUpdate()
BallDraw()

BricksInit()
BricksUpdate()
BricksDraw()
```

Gameplay:

1. paddle mosso con `A/D` oppure frecce;
2. pallina inizialmente sopra il paddle;
3. `SPACE` lancia la pallina;
4. collisione con pareti;
5. collisione paddle;
6. collisione mattoni;
7. mattone distrutto al colpo;
8. perdita della pallina → reset;
9. tutti i mattoni distrutti → vittoria.

**Definition of Done:** deve essere possibile giocare una partita completa senza asset esterni.

---

# 4. Milestone 2 — Collisioni corrette

Questa è probabilmente la parte su cui fare lavorare maggiormente l'agente.

Implementare separatamente:

```text
Ball ↔ wall
Ball ↔ paddle
Ball ↔ brick
```

Per i mattoni userei:

```c
CheckCollisionCircleRec(...)
```

ma chiederei all'agente di determinare anche **da quale lato avviene la collisione**, così da invertire correttamente:

```text
collisione orizzontale → velocity.x *= -1
collisione verticale   → velocity.y *= -1
```

Sul paddle invece la direzione dovrebbe dipendere dal punto d'impatto:

```text
centro paddle   → traiettoria quasi verticale
bordo sinistro  → traiettoria verso sinistra
bordo destro    → traiettoria verso destra
```

Questo rende immediatamente il gioco molto più interessante.

---

# 5. Milestone 3 — Game systems

Una volta stabile il core:

### Lives

```text
Start: 3 lives
Ball lost → lives--
Lives == 0 → GAME_OVER
```

### Score

Esempio:

```text
normal brick: 100
strong brick: 200
level completed: +1000
```

### Brick types

```c
typedef enum {
    BRICK_NORMAL,
    BRICK_STRONG,
    BRICK_UNBREAKABLE
} BrickType;
```

Possibilità:

```text
Normal       → 1 HP
Strong       → 2-3 HP
Unbreakable  → ∞
```

---

# 6. Milestone 4 — Level system

A questo punto separerei layout e codice.

Per esempio:

```text
1111111111
1222222221
1110011111
1333333331
```

con:

```text
0 = empty
1 = normal
2 = strong
3 = unbreakable
```

L'agente dovrà implementare:

```c
bool LevelLoad(const char *filename);
void LevelUnload(void);
bool LevelCompleted(void);
```

E file:

```text
assets/levels/level01.txt
assets/levels/level02.txt
assets/levels/level03.txt
```

Per questo progetto preferirei **TXT a JSON**: è sufficiente e rende l'implementazione C molto più semplice.

---

# 7. Milestone 5 — Power-up

Solo dopo che tutto il resto funziona.

Implementerei inizialmente 4 power-up:

```text
WIDE_PADDLE
MULTIBALL
SLOW_BALL
EXTRA_LIFE
```

Struttura:

```c
typedef enum {
    POWERUP_WIDE,
    POWERUP_MULTIBALL,
    POWERUP_SLOW,
    POWERUP_LIFE
} PowerUpType;

typedef struct {
    Vector2 position;
    Vector2 velocity;
    PowerUpType type;
    bool active;
} PowerUp;
```

Flow:

```text
Brick destroyed
      ↓
random chance
      ↓
spawn power-up
      ↓
falls vertically
      ↓
paddle collision
      ↓
apply effect
```

Per il primo passaggio imposterei una probabilità del ~10–15%.

---

# 8. Milestone 6 — Game feel

Qui l'agente può migliorare molto il risultato senza cambiare gameplay.

Aggiungerei:

- screen shake leggerissimo;
- particelle quando si distrugge un mattone;
- trail della pallina;
- breve flash sui mattoni colpiti;
- variazione pitch degli effetti audio;
- interpolazione sulla dimensione del paddle;
- aumento progressivo della velocità della pallina.

Importante: **nessun sistema di particelle complesso**. Basta un array statico:

```c
Particle particles[MAX_PARTICLES];
```

---

# 9. Milestone 7 — UI e stati

Implementare:

```text
Main Menu
    ↓
Playing
    ↓
Paused
    ↓
Game Over / Victory
```

HUD:

```text
SCORE    12500

LEVEL    03

LIVES    ● ● ●
```

Controlli:

```text
A / D       move
LEFT/RIGHT  move
SPACE       launch
ESC         pause
R           restart
```

---

# 10. Ordine implementazione

**Una richiesta distinta per ogni step**:

```text
01. Bootstrap raylib + CMake project
02. Create main game loop
03. Implement paddle movement
04. Implement ball movement
05. Implement wall collisions
06. Implement paddle collision
07. Implement brick grid
08. Implement brick collisions
09. Add score
10. Add lives and ball reset
11. Add game states
12. Add multiple brick types
13. Add level loading
14. Add level progression
15. Add power-up system
16. Add particles and screen shake
17. Add audio
18. Add menu / pause / game over UI
19. Balance gameplay
20. Cleanup and documentation
```

## Regole che metterei nel prompt dell'agente

In particolare gli darei queste direttive:

```text
- Use C17 and raylib only unless explicitly authorized otherwise.
- Keep the architecture simple and procedural.
- Prefer structs + functions over complex abstraction layers.
- Avoid premature ECS, component systems or generic frameworks.
- Do not introduce dependencies without justification.
- Keep game state inside the Game structure whenever possible.
- Every feature must compile before moving to the next one.
- Never modify unrelated systems while implementing a feature.
- Prefer fixed-size arrays where practical.
- Keep functions small and responsibilities explicit.
- Update README controls and build instructions when necessary.
```

Aggiungerei soprattutto:

> **Never implement more than one major gameplay feature at a time.**

Per un agente AI è una restrizione utile: riduce molto la probabilità che, aggiungendo ad esempio il multiball, finisca anche per riscrivere collisioni, `Game` struct e level loader contemporaneamente.

### Risultato finale atteso

Il progetto rimarrebbe abbastanza piccolo — indicativamente **1.500–3.000 righe di C** — ma ti permetterebbe di sperimentare praticamente tutti gli elementi fondamentali di un piccolo gioco: **game loop, delta time, input, rendering, collision detection, state machine, entity management, level loading, audio, effetti e game feel**. Per sperimentare vibecoding con raylib lo considero un progetto particolarmente adatto.