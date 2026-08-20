# GemSwap — Piano di sviluppo eseguibile (MVP Match-3 Web)

> **Root del progetto:** `Match3/`, cioè la cartella corrente del benchmark.
>
> **Stack confermato:** TypeScript strict + Vite + Canvas 2D + Vitest. C/raylib non
> fanno parte di questo target web; l'eventuale porting nativo è un progetto separato.

---

## 1. Obiettivo e confini

### 1.1 Obiettivo prodotto

Realizzare un match-3 giocabile su desktop e mobile:

```text
start → input swap → validazione → match → clear → gravity → refill
      → cascade fino a stabilità → score → game over → restart
```

La board è 8×8, contiene sei tipi di tile procedurali e non presenta match
automatici all'avvio. Il gioco offre due modalità:

- **Moves:** 20 mosse valide di default; valore configurabile 5–50.
- **Time:** 60 secondi di default; valore configurabile 30–300 secondi.

I valori configurati e il best score sono separati per modalità e persistiti in
`localStorage` quando il browser lo consente.

### 1.2 Scope del primo rilascio

**MVP giocabile (P0):**

- core puro e deterministico: board, match, swap, clear, gravity, refill,
  cascade, deadlock e score;
- modalità Moves prima, modalità Time subito dopo il vertical slice;
- FSM esplicita e input bloccato durante le transizioni;
- rendering Canvas procedurale, layout responsive, HUD minimo;
- reset/restart affidabile e persistenza difensiva;
- test unitari e di integrazione del core.

**Release v1 (P1, dopo il core):**

- pause, timer completo, animazioni rifinite, accessibilità, particelle, audio,
  best score e verifica responsive/performance;
- coverage branch del core ≥ 90% come gate finale, non come prerequisito per il
  primo prototipo giocabile.

**Fuori scope v1:**

- special tile (bombe, razzi, rainbow/wild), booster e livelli;
- backend, account, classifiche online e analytics;
- asset binari: forme, colori e suoni sono procedurali;
- Playwright, CI e deploy automatico: sono stretch goal documentati in §11.

### 1.3 Decisione sulle special tile

Le special tile **non fanno parte dell'MVP né dell'architettura attiva di v1**.
`Tile` non contiene quindi `specialType`, `MatchEngine` non genera effetti
secondari e `ScoreManager` non assegna bonus per bombe/linee.

Il punteggio può comunque riconoscere la geometria del match normale:

- linea di 3: `shapeBonus = 0`;
- linea di 4 o 5: bonus configurabile, ma tutte le tile vengono rimosse
  normalmente;
- forma L/T o sovrapposizione: bonus configurabile.

Le special tile saranno una milestone P2 separata, con schema dati, regole,
test e animazioni proprie. Non si devono lasciare hook parziali o codice morto
nel core v1.

---

## 2. Criteri di successo e priorità

### 2.1 Gate progressivi

| Gate | Quando | Criteri bloccanti |
|---|---|---|
| **G0 Riproducibile** | fine setup | installazione da lockfile, typecheck, lint e test dummy verdi |
| **G1 Vertical slice** | prima demo | una partita Moves completa con swap, match, cascade e restart |
| **G2 Core robusto** | prima di polish | invarianti board, deadlock, cap cascade, identità tile e test verdi |
| **G3 MVP** | fine funzionalità | Moves + Time, persistenza difensiva, responsive e HUD |
| **G4 Release v1** | fine verifica | coverage, performance, accessibilità, browser smoke e build produzione |

Un fallimento P1 non deve impedire G1: si consegna prima il core giocabile e si
aggiunge il polish in seguito.

### 2.2 Definition of Done v1

- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`
  completano senza errori;
- branch coverage ≥ 90% su `src/core` (le soglie sono applicate solo quando il
  core è completo);
- nessun `any` nel core e nessun accesso indicizzato non verificato;
- una partita completa funziona in Moves e Time;
- reset e restart azzerano score, board, selezione, transazioni, mosse e timer,
  ma non cancellano i best score;
- dati `localStorage` corrotti, mancanti, di versione sconosciuta o inaccessibili
  non causano crash;
- board stabile: piena, senza match e con almeno una mossa valida;
- nessuna identità tile duplicata o persa durante swap, gravity, refill e
  reshuffle, salvo le identità esplicitamente ritirate durante clear/reset;
- Canvas responsive a 375×667, 768×1024 e 1920×1080, senza overflow;
- nessun errore in console nella build di produzione.

Il requisito "60 FPS con CPU 4× su ogni browser e ogni dispositivo" non è un
criterio realistico per il primo prototipo. Per G4 si misura su un dispositivo
di riferimento: nessun calo sostenuto sotto 50 FPS, nessun long task >50 ms e
nessuna allocazione evidente per frame nel rendering normale. I risultati vanno
registrati, non dichiarati senza misura.

---

## 3. Stack riproducibile

Non usare `create-vite@latest`, `npm install` senza versione o versioni `^`/`~`
per le dipendenze dirette. Il repository deve committare `package-lock.json`.

Baseline da fissare in `package.json` e verificare in `package-lock.json`:

| Componente | Versione esatta |
|---|---:|
| Node | `20.19.0` |
| npm | `10.8.2` |
| `create-vite` | `7.0.6` (solo scaffold iniziale) |
| Vite | `7.0.6` |
| TypeScript | `5.8.3` |
| Vitest | `4.0.0` |
| `@vitest/coverage-v8` | `4.0.0` |
| ESLint | `9.32.0` |
| `typescript-eslint` | `8.38.0` |

Se una versione non è disponibile nell'ambiente, fermarsi e registrare la
variazione in `CHANGELOG.md`: non sostituirla silenziosamente con `latest`.
Usare `.nvmrc`/`.node-version` e `engines` in `package.json`.

Script minimi:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc -b --pretty false",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

Il lockfile è parte dell'artefatto: una macchina pulita deve produrre lo stesso
albero con `npm ci`.

---

## 4. Architettura e contratti

### 4.1 Strati e responsabilità

```text
UI shell / HUD / Overlay / InputHandler
              │ comandi ed eventi tipizzati
Rendering / Animator / Particles / Audio
              │ legge snapshot e animation plan
Core puro (Board, MatchEngine, ScoreManager, GameSession, FSM)
              │ nessun DOM, Canvas, RAF, localStorage o Web Audio
```

- **Core:** funzioni pure dove possibile; riceve RNG, clock e configurazione
  tramite parametri o adapter.
- **FSM/GameSession:** unico orchestratore dei comandi; il DOM non decide mai
  una transizione.
- **Rendering:** spettatore del core. Le coordinate pixel sono derivate dalla
  cella e dalla viewport, non sono stato di dominio.
- **Adapter:** `StorageAdapter`, `Clock` e `Rng` sono interfacce sostituibili e
  testabili.

### 4.2 Struttura dei file

```text
Match3/
├── index.html
├── package.json
├── package-lock.json
├── .nvmrc
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
├── src/
│   ├── main.ts
│   ├── config.ts
│   ├── core/
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── Board.ts
│   │   ├── MatchEngine.ts
│   │   ├── ScoreManager.ts
│   │   ├── GameSession.ts
│   │   ├── StateMachine.ts
│   │   ├── Storage.ts
│   │   └── __tests__/
│   ├── input/InputHandler.ts
│   ├── rendering/Renderer.ts
│   ├── rendering/Animator.ts
│   ├── rendering/Particles.ts
│   ├── ui/HUD.ts
│   ├── ui/Overlay.ts
│   └── audio/AudioManager.ts
└── docs/
    ├── TEST-MATRIX.md
    └── PERFORMANCE.md
```

### 4.3 Tipi senza enum

`src/core/constants.ts` deve essere la fonte unica dei valori:

```ts
export const TILE_TYPES = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  PURPLE: 'purple',
  ORANGE: 'orange',
} as const;

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

export const GAME_STATES = {
  START: 'START',
  IDLE: 'IDLE',
  SWAPPING: 'SWAPPING',
  REVERTING: 'REVERTING',
  MATCHING: 'MATCHING',
  CLEARING: 'CLEARING',
  FALLING: 'FALLING',
  REFILLING: 'REFILLING',
  RESHUFFLING: 'RESHUFFLING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
} as const;

export type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];
```

Sono vietati enum TypeScript, stringhe duplicate per gli stati e `as` usato per
aggirare `noUncheckedIndexedAccess`. I tipi devono includere almeno:

```ts
interface Tile {
  readonly id: string;
  readonly type: TileType;
  row: number;
  col: number;
  state: 'IDLE' | 'CLEARING' | 'FALLING';
}

type Board = Array<Array<Tile | null>>;
type Cell = Readonly<{ row: number; col: number }>;
type Swap = Readonly<{ from: Cell; to: Cell }>;
```

Le proprietà `row`, `col` e `state` cambiano solo durante commit atomici del
core; l'identità `id` e il tipo della tile non cambiano mai.

### 4.4 Invarianti formali della board

Ogni metodo pubblico che muta o restituisce una board deve rispettare e, in
ambiente di test, poter essere verificato contro questi invarianti:

1. dimensioni sempre `ROWS = 8`, `COLS = 8`;
2. ogni cella contiene `null` oppure una tile di tipo valido;
3. ogni tile live compare in una sola cella; gli `id` sono univoci e non vengono
   riutilizzati nella sessione;
4. per ogni tile live, `tile.row` e `tile.col` coincidono con la cella che la
   contiene;
5. `row` e `col` sono sempre nel range `[0, 7]` dopo ogni commit;
6. durante `IDLE` la board è piena, non contiene match e ha almeno una mossa
   valida;
7. durante una transazione possono esistere piani temporanei e `null`, ma mai
   una tile in due destinazioni o una destinazione assegnata a due tile;
8. una tile clearata è ritirata e non può rientrare in gravity/refill;
9. un nuovo gioco ritira tutte le tile precedenti e crea nuovi ID;
10. seed, board iniziale e lista di comandi identici producono lo stesso snapshot
    core (il clock è passato esplicitamente).

`assertBoardInvariant(board, phase)` deve essere usata nei test e, se utile, in
sviluppo; non deve introdurre lavoro per frame in produzione.

### 4.5 Contratto di identità e coordinate

La tile segue l'oggetto fisico, non la cella. Un `id` non viene mai cambiato per
far sembrare che una tile sia un'altra.

- **Swap:** prima dell'animazione si crea uno `SwapAnimationPlan` con due ID e
  celle sorgente/destinazione. La board logica non cambia durante il tween. Al
  termine, le due referenze vengono scambiate in un unico commit e i due
  `row/col` vengono aggiornati insieme. Se il match è assente, il revert è solo
  visivo e la board non viene mai committata.
- **Clear:** il match produce un set di ID, non solo coordinate. Durante il fade
  le tile sono `CLEARING` e restano referenziate per il renderer. Al commit di
  clear le celle diventano `null` e quegli ID sono ritirati.
- **Gravity:** `applyGravity` calcola una lista `{ tileId, from, to }` senza
  modificare coordinate a ogni frame. Il piano deve essere iniettivo. Al termine
  dell'animazione il core ricostruisce la colonna e aggiorna tutti i `row/col`
  in modo atomico.
- **Refill:** ogni nuova tile riceve subito un ID mai usato, una cella target
  unica e una posizione grafica di spawn sopra la board. La nuova tile entra
  nella board solo nel commit del refill o, se serve al rendering, è indicata
  separatamente come `pendingSpawn`; non può essere conteggiata due volte.
- **Reshuffle:** si permutano le referenze delle tile esistenti, preservando ID e
  tipo; al commit si aggiornano le coordinate. Se il fallback deve rigenerare i
  tipi, le vecchie tile vengono ritirate esplicitamente e la sessione emette un
  evento diagnostico.
- **Reset:** nessuna vecchia animazione può committare dopo `reset()`. Si usa un
  `sessionGeneration`/token di transazione per invalidare callback tardive.
- **Rendering:** `x/y` pixel sono sempre derivati da `row/col` e dal layout,
  oppure dal piano di animazione; non diventano una seconda fonte di verità.

Test obbligatori: ID preservati nello swap valido e invalido, coordinate corrette
post-swap, coordinate corrette dopo colonne con gap multipli, ID nuovi nel refill,
nessun commit dopo reset e IDs preservati nel reshuffle normale.

### 4.6 FSM formale

La FSM conserva `state`, `resumeState` quando è in pausa, `gameMode`,
`movesRemaining`, `timeRemainingMs`, `cascadeLevel` e una sola transazione
attiva. Solo `GameSession` invia eventi alla FSM.

| Stato | Ingresso consentito | Uscita consentita |
|---|---|---|
| `START` | `START_GAME` | `IDLE` |
| `IDLE` | `REQUEST_SWAP`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `SWAPPING`, `PAUSED`, `START`, `GAME_OVER` |
| `SWAPPING` | `SWAP_ANIMATION_DONE`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `MATCHING`, `REVERTING`, `PAUSED`, `START`, `GAME_OVER` |
| `REVERTING` | `REVERT_DONE`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `IDLE`, `PAUSED`, `START`, `GAME_OVER` |
| `MATCHING` | `MATCHES_RESOLVED`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `CLEARING`, `IDLE`, `PAUSED`, `START`, `GAME_OVER` |
| `CLEARING` | `CLEAR_ANIMATION_DONE`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `FALLING`, `PAUSED`, `START`, `GAME_OVER` |
| `FALLING` | `FALL_ANIMATION_DONE`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `REFILLING`, `PAUSED`, `START`, `GAME_OVER` |
| `REFILLING` | `REFILL_ANIMATION_DONE`, `PAUSE`, `RESET`, `GAME_OVER_REQUEST` | `MATCHING`, `RESHUFFLING`, `IDLE`, `PAUSED`, `START`, `GAME_OVER` |
| `RESHUFFLING` | `RESHUFFLE_DONE`, `RESET` | `IDLE`, `START` |
| `PAUSED` | `RESUME`, `RESET` | `resumeState`, `START` |
| `GAME_OVER` | `RESTART`, `RESET` | `START` |

Regole aggiuntive:

- `REQUEST_SWAP` è accettato solo in `IDLE`, per due celle adiacenti e con due
  tile presenti;
- una mossa viene decrementata solo quando lo swap produce almeno un match;
- durante `SWAPPING`/`REVERTING`/`MATCHING`/`CLEARING`/`FALLING`/`REFILLING`
  ogni input di gioco è ignorato, non accodato;
- `PAUSE` congela clock di gioco, Animator e transazione; `RESUME` riprende lo
  stesso stato senza ricominciare il piano;
- `GAME_OVER_REQUEST` può essere prodotto dal timer o dal contatore, ma viene
  consumato una sola volta al confine sicuro della transazione corrente; ogni
  stato attivo può quindi terminare in `GAME_OVER` senza interrompere a metà un
  commit; reset/restart azzerano il flag;
- ogni transizione illegale è un errore di sviluppo e un no-op controllato in
  produzione, mai una mutazione parziale.

---

## 5. Persistenza e tempo

### 5.1 Schema versionato

Usare chiavi namespaced e envelope versionati, ad esempio:

```text
`gem-swap:v1:settings`
`gem-swap:v1:best-scores`
```

Payload minimo:

```ts
interface SettingsV1 {
  version: 1;
  mode: 'moves' | 'time';
  moves: number;       // clamp 5..50
  timeSeconds: number; // clamp 30..300
  muted: boolean;
}

interface BestScoresV1 {
  version: 1;
  moves: number;
  time: number;
}
```

`StorageAdapter.load()` non si fida mai di un cast TypeScript: esegue parse,
controllo dei campi, controllo dei tipi, clamp e validazione degli enum.

Comportamento definito:

1. chiave assente → default (`moves=20`, `timeSeconds=60`, mode `moves`,
   `muted=false`);
2. JSON invalido, payload non-oggetto, versione sconosciuta o campo invalido
   → scarta il payload, usa i default per quel documento e rimuove la chiave
   corrotta; nessun crash e nessun dato parzialmente applicato;
3. versione precedente conosciuta → migra con funzione pura `migrateVnToV1`,
   valida il risultato e salva solo dopo migrazione riuscita;
4. `SecurityError`, quota esaurita o storage non disponibile → fallback in
   memoria per la sessione, con un warning non bloccante solo in sviluppo;
5. best score non numerico, negativo o infinito → ignora solo quel record e
   conserva l'altro;
6. salvataggio dopo modifica esplicita delle preferenze e a game-over; mai in un
   loop RAF.

Test obbligatori: assenza chiave, JSON corrotto, JSON valido ma schema errato,
versione migrabile, versione sconosciuta, `localStorage` che lancia, clamp,
reset di sessione senza perdita del best score e separazione Moves/Time.

### 5.2 Timer deterministico

Il core riceve `tick(nowMs)` da un adapter `Clock`; non usa `setInterval` per il
conteggio. Il timer:

- parte da `timeSeconds * 1000` a `START_GAME`;
- usa `performance.now()` monotono e calcola il delta dall'ultimo tick valido;
- non avanza in `PAUSED`, `START`, `GAME_OVER` o mentre la pagina è nascosta;
- clampa delta anomali dopo tab sospesa e riallinea il riferimento al resume;
- emette `timeChange` solo quando cambia il secondo visualizzato;
- a `0` emette una sola richiesta di `GAME_OVER` al confine transazionale.

Test con clock finto: tick da 0→500, pausa, tick da 500→10000, resume, scadenza
esatta, delta negativo e reset. Verificare che non si perda tempo in pausa.

---

## 6. Milestone e task eseguibili

Le stime sono per un singolo sviluppatore, senza includere attese. Le milestone
sono sequenziali; all'interno di una milestone si parallelizzano solo file
indipendenti. Ogni task deve produrre codice/test o un artefatto verificabile.

### M0 — Fondamenta riproducibili (0,5–1 giorno) — G0

- [ ] **M0.1 Scaffold pinned** — creare in `Match3/` i file Vite vanilla-ts
  usando la versione esatta di §3; aggiungere `.nvmrc`, `engines`, scripts,
  `package-lock.json`. **Done:** `npm ci`, `npm run dev`, `npm run build`.
- [ ] **M0.2 Tooling** — configurare TS strict (`noUncheckedIndexedAccess`,
  `noImplicitOverride`, `verbatimModuleSyntax`), ESLint flat config e Vitest.
  Configurare coverage solo su `src/core/**`. **Done:** typecheck, lint, test
  dummy e report coverage.
- [ ] **M0.3 Config e adapter** — creare config centralizzata, RNG seedabile,
  `Clock` e interfaccia `StorageAdapter`; nessuna dipendenza browser nel core.
  **Done:** test di riproducibilità RNG e typecheck.

### M1 — Core board e vertical slice Moves (2–3 giorni) — G1

- [ ] **M1.1 Tipi e invarianti** — implementare `constants.ts`, `types.ts`,
  `assertBoardInvariant` e generatore di ID monotono. **Done:** fixture board
  valida/invalida e test di ogni invariante.
- [ ] **M1.2 Generazione iniziale** — `generateStableBoard(seed)` evita match
  durante il riempimento e usa massimo un numero finito di tentativi. **Done:**
  1.000 seed senza match; board piena; almeno una mossa valida.
- [ ] **M1.3 MatchEngine** — scan orizzontale/verticale, run sovrapposti e
  geometria L/T; output di ID e celle immutabile. **Done:** fixture per run 3,
  run 4/5, overlap, L/T e nessun match.
- [ ] **M1.4 Board swap e FSM minima** — swap adiacente con commit atomico,
  revert senza commit, `IDLE/SWAPPING/REVERTING/MATCHING`. **Done:** test di
  transizioni, scambio di riferimenti e input bloccato.
- [ ] **M1.5 Clear, score e Moves** — rimozione, formula `tiles × 10 ×
  cascadeMultiplier + shapeBonus`, decremento solo su swap valido e HUD score.
  **Done:** vertical slice manuale completo con restart.
- [ ] **M1.6 Canvas/input minimi** — renderer di griglia e sei forme procedurali,
  pointer events e mapping cella. **Done:** swap via mouse e touch su viewport
  desktop/mobile; nessuna logica core nel DOM.

### M2 — Cascade, identità e deadlock (2–3 giorni) — G2

- [ ] **M2.1 Gravity plan** — `applyGravity` ritorna movimenti per ID, compatti
  ogni colonna verso il basso e committa coordinate solo a fine animazione.
  **Done:** colonne con zero/uno/molti gap e test `from/to` iniettivo.
- [ ] **M2.2 Refill plan** — crea ID mai usati, spawn sopra il canvas, evita
  match introdotti quando possibile e riempie tutte le celle. **Done:** board
  piena a fine commit, contatore ID corretto, coordinate finali corrette.
- [ ] **M2.3 Cascade orchestrata** — `CLEARING → FALLING → REFILLING →
  MATCHING` fino a stabilità; `cascadeLevel` incrementa solo per un nuovo
  clear. **Done:** fixture deterministica multi-cascade e nessun teleport.
- [ ] **M2.4 Cap cascade esplicito** — usare `MAX_CASCADE_DEPTH = 20`. Quando il
  refill produrrebbe la cascade 21, non assegnare score né bonus aggiuntivi e
  invocare `forceStabilize`. L'algoritmo tenta al massimo 1000 permutazioni
  deterministiche delle tile esistenti per ottenere board piena, senza match e
  con mossa valida; se fallisce, genera una nuova board stabile, ritira i vecchi
  ID e mostra una breve transizione `EMERGENCY_STABILIZING`. Non consuma mosse,
  non crea loop e azzera `cascadeLevel` a 0. **Done:** test cap, score invariato
  durante la stabilizzazione, board stabile e fallback finito.
- [ ] **M2.5 Deadlock** — a fine cascade eseguire `hasValidMoves`; se falso,
  `RESHUFFLING` con Fisher–Yates limitato a 100 tentativi, preservando ID/tipi.
  Fallback deterministico a board stabile se necessario. **Done:** fixture
  senza mosse, reshuffle finito e nessun loop infinito.
- [ ] **M2.6 Test identità/reset** — test espliciti per swap, gravity, refill,
  reshuffle, coordinate e callback tardivo dopo reset. **Done:** invarianti
  verificati dopo ogni commit e nessun ID duplicato.

### M3 — Game flow, Time e persistenza (2 giorni) — G3

- [ ] **M3.1 FSM completa** — aggiungere `START`, `PAUSED`, `GAME_OVER`,
  `RESHUFFLING` e resume state; definire eventi tipizzati e transizioni illegali.
  **Done:** tabella §4.6 coperta da test.
- [ ] **M3.2 Start/restart/reset** — overlay iniziale, `RESTART` e `RESET` con
  nuovo seed/session generation. **Done:** score, selezione, board, transazioni,
  moves e timer resettati; best score conservato.
- [ ] **M3.3 Time mode** — implementare il contratto `tick(nowMs)` e HUD countdown;
  pausa e tab nascosta non consumano tempo. **Done:** test con fake clock per
  tick, pausa, resume, scadenza e reset.
- [ ] **M3.4 Storage versionato** — implementare schema v1, validazione, migrazione,
  fallback in memoria e gestione corruzione secondo §5.1. **Done:** test di
  localStorage assente/corrotto/inaccessibile, versioni e clamp.
- [ ] **M3.5 Best score e preferenze** — salvare best per modalità e configurazione
  scelta, con HUD coerente. **Done:** reload manuale e test di isolamento
  `moves`/`time`.

### M4 — Rendering, UX e accessibilità (2–3 giorni) — G3/P1

- [ ] **M4.1 Animator** — tween con delta-time, easing, cancellazione tramite
  session token e piani swap/clear/fall/refill. **Done:** completamento singolo,
  pausa/ripresa e reset senza callback stantii.
- [ ] **M4.2 Responsive layout** — `ResizeObserver`, DPR clamp a 2, trasformazione
  Canvas corretta e hit-test derivato dallo stesso layout. **Done:** tre
  viewport della DoD senza blur/overflow o celle errate.
- [ ] **M4.3 HUD/overlay** — score, best, modalità, moves/time, pause e game-over;
  elementi HTML semantici, focus visibile e pulsanti utilizzabili da tastiera.
  **Done:** `prefers-reduced-motion`, contrasto sufficiente e aria-label per
  controlli non testuali.
- [ ] **M4.4 Polish opzionale** — particelle con pool e Web Audio sintetico con
  toggle persistito. **Done:** audio creato solo dopo gesto utente; fallback
  silenzioso; nessun calo misurabile causato dagli FX.

### M5 — Verifica e packaging (1–2 giorni) — G4

- [ ] **M5.1 Test finale** — completare casi limite e coverage branch ≥90% su
  `src/core`; nessun test random non riproducibile (ogni failure stampa seed).
  **Done:** `npm run test:coverage` verde.
- [ ] **M5.2 Performance** — misurare cascade lunga con CPU 4× su dispositivo
  di riferimento, memorizzando browser, hardware e risultati in
  `docs/PERFORMANCE.md`. **Done:** criteri misurabili in §2.2 o issue P1,
  mai un "60 FPS" non verificato.
- [ ] **M5.3 Browser smoke** — verificare desktop Chrome/Firefox e almeno un
  mobile reale (Android Chrome oppure iOS Safari); la matrice estesa è una
  attività separata. **Done:** checklist `docs/TEST-MATRIX.md`, zero errori
  console e input funzionante.
- [ ] **M5.4 Produzione** — `npm run build`, `npm run preview`, smoke test sulla
  build, verifica asset procedurali e dimensione bundle. **Done:** preview
  giocabile e artefatto `dist/` riproducibile.

**Stima totale:** 8–12 giorni lavorativi per MVP/G3, 10–14 per G4 con polish e
verifica. La coverage e la matrice browser completa non sono sovrapposte alla
stima del vertical slice.

---

## 7. Contratti di test

### 7.1 Fixture e determinismo

Le fixture usano board leggibili (una lettera per `TileType`) e ID espliciti.
Ogni test casuale riceve un seed e lo stampa in caso di failure. Le funzioni
core da testare sono almeno:

- `generateStableBoard(seed)`;
- `findMatches(board)` e `shapeBonus(matches)`;
- `isAdjacent`, `isValidSwap`, `swap`;
- `clearMatches`, `applyGravity`, `createRefillPlan`;
- `hasValidMoves`, `reshuffle`, `forceStabilize`;
- `ScoreManager`;
- reducer/FSM e `GameSession`;
- `StorageAdapter` e `tick` con clock finto.

### 7.2 Casi obbligatori

- board iniziale senza match su almeno 1.000 seed;
- match orizzontale/verticale, 4, 5, L, T e overlap;
- swap valido, swap invalido e celle non adiacenti;
- colonne vuote, gap multipli, refill completo e coordinate finali;
- cascade 1, cascade multipla, cascade cap 20 e fallback di stabilizzazione;
- deadlock e reshuffle con ID preservati;
- score e shape bonus senza special tile;
- transizioni FSM valide/illegali, input durante animazione, pause/resume;
- timer con delta, tab sospesa, pausa e scadenza;
- reset/restart durante e dopo un'animazione;
- localStorage corrotto, schema errato, versione precedente/sconosciuta,
  eccezioni di accesso, clamp e best separato per modalità;
- invariant check dopo ogni operazione pubblica.

### 7.3 E2E e test manuali

Per v1 i test di integrazione del core sono bloccanti; Playwright è stretch.
La verifica manuale minima copre:

1. start → swap valido → match → cascade → score;
2. swap invalido con revert e input bloccato;
3. Moves a zero → game-over → restart;
4. Time a zero, pausa e resume senza perdita di secondi;
5. reload con preferenze/best e localStorage corrotto;
6. touch, mouse, tastiera, portrait e landscape;
7. reduced motion, mute e assenza di supporto Web Audio.

---

## 8. Gestione degli errori e osservabilità

- Non fare affidamento su `console.error` per il flusso normale: gli errori di
  input/storage sono degradazioni controllate.
- In sviluppo, gli snapshot includono `state`, seed, cascade level e ID; in
  produzione non si stampano board o dati inutili.
- Ogni fallback (reshuffle fallito, emergency stabilization, storage in memoria)
  emette un evento diagnostico non bloccante.
- Le callback dell'Animator verificano `sessionGeneration` prima di committare.
- Nessun `while(true)`: generazione, reshuffle e stabilizzazione hanno limiti
  espliciti e fallback deterministici.

---

## 9. Performance e responsive design

- Canvas dimensionato in pixel fisici con DPR clamp `Math.min(devicePixelRatio, 2)`;
- nessuna allocazione di array/oggetti nel loop di rendering salvo transizione;
- pool per particelle, numero massimo di particelle configurabile;
- `requestAnimationFrame` solo per presentazione; il core non dipende dal frame
  rate;
- animazioni default 120–350 ms, disabilitabili/riducibili con
  `prefers-reduced-motion`;
- input con Pointer Events, `touch-action: none` solo sul canvas e hit-test
  basato sul layout condiviso con Renderer;
- test su 375×667, 768×1024, 1920×1080, orientamento portrait/landscape e DPR 1/2.

---

## 10. Rischi e mitigazioni

| Rischio | Mitigazione verificabile |
|---|---|
| cascade infinita | `MAX_CASCADE_DEPTH=20`, `forceStabilize` limitato, fallback stabile testato |
| deadlock | `hasValidMoves` a fine cascade, reshuffle limitato e fallback |
| tile duplicate/perse | piani per ID, commit atomici e invariant check |
| callback dopo reset | `sessionGeneration` verificato prima di ogni commit |
| timer drift | `performance.now`, fake clock, pausa e hidden-page testati |
| localStorage corrotto | parse/validate/version/migrate, fallback memoria e test di eccezione |
| dipendenze variabili | versioni esatte, `.nvmrc`, `package-lock.json`, `npm ci` |
| scope eccessivo | special tile, E2E, CI e deploy fuori v1; G1 prima di polish |
| jank mobile | DPR clamp, delta-time, pool, profiling registrato |
| autoplay audio | AudioContext creato/ripreso solo durante gesto utente, fallback muto |

---

## 11. Stretch post-v1

Solo dopo G4, con dipendenze sempre pinned:

- **P2 Special tile:** introdurre `SpecialType` come `as const`, regole di
  creazione/attivazione, identità/animazioni, scoring e test senza modificare le
  invarianti base;
- **E2E Playwright:** avvio, swap, score, game-over, storage e viewport mobile;
- **CI GitHub Actions:** `npm ci`, typecheck, lint, test, coverage e build;
- **Deploy Cloudflare Pages:** build `npm run build`, output `dist/`, preview e
  auto-deploy su `main`;
- daily challenge, livelli e porting C/raylib come progetti distinti.

Nessuna attività stretch può diventare requisito implicito del MVP: deve avere
una issue, una stima e un criterio di accettazione separati.

---

## 12. Comandi di verifica

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run preview
```

Playwright, CI e deploy si attivano solo dopo approvazione dello scope post-v1.
