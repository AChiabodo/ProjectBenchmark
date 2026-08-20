# GemSwap — Piano Implementativo Dettagliato (MVP Match-3 Web)

---

## 1. Contesto (Context)

| Voce | Dettaglio |
|------|-----------|
| Obiettivo | Realizzare un gioco match-3 (swap → match → clear → refill → cascade) giocabile su browser desktop e mobile |
| Punto di partenza | Cartella vuota (solo `.agents/skills/`), **nessun repo git**, nessun codice esistente |
| Stack | TypeScript (strict) + Vite 7 (Node ≥ 20.19) + HTML5 Canvas 2D + Vitest 4 (unit/integration) · Playwright E2E (stretch, fuori scope v1) |
| Output richiesto | MVP completo di: board 8×8, swap/animazioni, match/clear, gravità/refill, cascade, punteggio, game-over, HUD, polish base, **due modalità di gioco (Moves / Time) selezionabili all'avvio con valori editabili** |
| DoD globale | TS strict senza errori · test core ≥ 90% branch coverage · 60 FPS con CPU throttle 4× · iOS Safari + Android Chrome + desktop Firefox/Chrome · zero console errors |

---

## 2. Approccio (Approach)

### 2.1 Architettura a 3 strati (dal prompt, raffinata)

```
┌──────────────────────────────────────────────────────────┐
│ Game Shell (UI)                                           │
│  HUD · Overlay (Start/GameOver/Pause) · InputHandler      │
├──────────────────────────────────────────────────────────┤
│ Engine Core (logica pura, NO DOM, 100% testabile)         │
│  StateMachine (FSM) · Board · MatchEngine · ScoreManager  │
├──────────────────────────────────────────────────────────┤
│ Rendering Layer                                           │
│  Renderer (Canvas 2D) · Animator (tween) · Particles      │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Principi guida

1. **Separazione logica/presentazione**: il core (`Board`, `MatchEngine`, `ScoreManager`, FSM) non tocca mai DOM/Canvas e non usa `requestAnimationFrame`. È testabile con Vitest in Node puro.
2. **FSM come unico orchestratore**: ogni transizione di stato è esplicita; il rendering è uno *spectator* che legge lo stato.
3. **Data-driven**: tutte le costanti (ROWS, COLS, TILE_SIZE, colori, durate animazione, punteggi) in `config.ts`; nessun magic number nel codice.
4. **Posizione = row/col nel modello, x/y derivati per il rendering**: le animazioni tweenano `x/y`, il modello resta `row/col`.
5. **Determinismo**: la generazione della board e la risoluzione cascade sono funzioni pure → testabili e riproducibili (seed RNG per il futuro daily challenge).
6. **Un input alla volta**: durante qualsiasi stato ≠ IDLE, l'input è ignorato (tranne pause/restart).

### 2.3 Struttura file (da creare ex-novo)

```
Match3Deepseek/
├── index.html
├── package.json
├── tsconfig.json  (+ tsconfig.app.json / tsconfig.node.json)
├── vite.config.ts
├── vitest.config.ts          # o integrazione in vite.config.ts
├── playwright.config.ts      # (stretch — fuori scope v1)
├── .github/workflows/ci.yml  # (stretch — fuori scope v1)
└── src/
    ├── main.ts               # bootstrap: canvas, loop, wiring
    ├── config.ts             # costanti globali
    ├── core/
    │   ├── types.ts          # Tile, Board, GameState, TileType, TileState, eventi
    │   ├── Board.ts          # generazione, gravità, refill, deadlock check
    │   ├── MatchEngine.ts    # findMatches, special-tile rules
    │   ├── ScoreManager.ts   # punteggio, combo/cascade multiplier
    │   └── StateMachine.ts   # FSM + event emitter
    ├── input/
    │   └── InputHandler.ts   # pointer events → comandi (swap)
    ├── rendering/
    │   ├── Renderer.ts       # draw loop
    │   ├── Animator.ts       # tween engine (ease/lerp)
    │   └── Particles.ts      # FX
    ├── ui/
    │   ├── HUD.ts
    │   └── Overlay.ts
    ├── audio/
    │   └── AudioManager.ts
    └── assets/               # (non serve: tile procedurali, zero asset binari)
```

### 2.4 Decisioni tecniche (confermate dal committente)

| Tema | Decisione |
|------|-----------|
| Grafica tile | **Procedurale via Canvas** (forme geometriche + gradienti, nessun file binario) → niente asset pipeline |
| Fine partita | **Due modalità selezionabili all'avvio**: `Moves` (default 20, editabile) e `Time` (default 60 s, editabile) — vedi §2.5 #10 e Fase 5 |
| Lingua UI | Inglese (testi semplici, i18n futuro facile) |
| Persistenza | `localStorage` per best score, preferenze modalità e mute (nessun backend) |
| Punteggio | Formula del prompt: `tiles × 10 × cascade_multiplier + shape_bonus` |
| Deploy | **Fuori scope v1** — step pronti per **Cloudflare Pages** + auto-deploy su push a main (S7.5) |

### 2.5 Migliorie deliberate rispetto allo spec (richieste dal committente)

| # | Miglioria | Motivo |
|---|-----------|--------|
| 1 | `noUncheckedIndexedAccess` + accessi difensivi (niente `board[r][c]!` sparsi) | Elimina bug da out-of-bounds a compile-time |
| 2 | Event emitter tipizzato core → UI | Disaccoppia engine e HUD senza polling |
| 3 | Loop RAF con delta-time (non frame-based) | Animazioni fluide indipendenti dal framerate |
| 4 | RNG deterministica con seed (mulberry32) | Test riproducibili + futuro daily challenge |
| 5 | Pool di oggetti per particelle (vincolo di design) | Niente GC spike nelle cascade |
| 6 | Clamp `devicePixelRatio` ≤ 2 | Performance su mobile |
| 7 | Tile procedurali (zero asset binari) | Niente loading screen, niente pipeline asset |
| 8 | Deadlock → reshuffle animato come feature del core | Nel prompt è un rischio; qui è un invariante testato (S4.5) |
| 9 | Cap cascade 20 + stabilizzazione forzata come invariante | Test dedicato, niente hang (S4.4) |
| 10 | Config centralizzata con modalità Moves/Time e valori editabili | Estende la P1 "Move Counter / Timer" in due game mode |
| 11 | Pausa che congela anche il timer di modalità Time | Niente drift nel countdown |
| 12 | Audio procedurale via Web Audio (nessun file .mp3/.ogg) | Zero asset, autoplay policy gestita (S6.3) |

---

## 3. Decisioni confermate (dal committente)

| # | Decisione | Scelta |
|---|-----------|--------|
| 1 | Fedeltà allo spec | Seguire lo spec introducendo **migliorie documentate** (§2.5) |
| 2 | Grafica tile | **Procedurale** via Canvas (nessun asset binario) |
| 3 | Test E2E + CI | **Solo Vitest + verifiche manuali** per la v1; Playwright/CI come stretch (S7.2, S7.6) |
| 4 | Deploy | **Fuori scope v1**; step pronti per **Cloudflare Pages** (S7.5) |
| 5 | Fine partita | **Due modalità selezionabili all'avvio**: `Moves` (default 20) e `Time` (default 60 s), valori **editabili** e persistiti |
| 6 | Lingua UI | **Inglese** |

---

## 4. Fasi, Milestones e Steps dettagliati

> Legenda step: **Obiettivo** = goal verificabile · **Attività** = cosa fare · **Done** = criterio di completamento.

### Fase 0 — Setup progetto (≈1-2 gg)

**Goal fase**: ambiente riproducibile, type-safe, lintato, con test runner pronto.

- [ ] **S0.1 Scaffold Vite + TS**
  - Obiettivo: repo funzionante con `npm run dev` che mostra una pagina vuota.
  - Attività: `npm create vite@latest . -- --template vanilla-ts`; `npm install`; verifica Node ≥ 20.19.
  - Done: `npm run dev` serve la pagina; `npm run build` produce `dist/` senza errori.
- [ ] **S0.2 Git + .gitignore**
  - Obiettivo: history versionata, artefatti esclusi.
  - Attività: `git init`, branch `main`, `.gitignore` (node_modules, dist, .env, .playwright, coverage).
  - Done: `git status` pulito; primo commit.
- [ ] **S0.3 TS strict + lint**
  - Obiettivo: rigore tipo massimo, zero errori di stile.
  - Attività: tsconfig con `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride`, `verbatimModuleSyntax`; aggiunta ESLint flat config.
  - Done: `npm run typecheck` e `npm run lint` passano su scaffold.
- [ ] **S0.4 Vitest + coverage**
  - Obiettivo: runner di test con metriche branch coverage.
  - Attività: install `vitest @vitest/coverage-v8`; script `test`, `test:coverage`; soglia 90% su `src/core`.
  - Done: `npm test` esegue un test dummy verde; `npm run test:coverage` riporta le soglie configurate.
- [ ] **S0.5 Boilerplate Canvas**
  - Obiettivo: canvas full-screen responsive con `devicePixelRatio` corretto e loop RAF.
  - Attività: `index.html` con `<canvas>`; `main.ts` con loop base (`requestAnimationFrame`, delta time); resize handler.
  - Done: rettangolo di debug disegnato; resize senza distortion; nessun errore console.

### Fase 1 — Board & Rendering (≈3 gg)

**Goal fase**: board 8×8 renderizzata e animabile, senza logica di gioco.

- [ ] **S1.1 Tipi core** (`core/types.ts`)
  - Obiettivo: contratto dati condiviso tra engine e rendering.
  - Attività: definire `TileType` (enum 0..5), `TileState`, `GameState`, `Tile { type, row, col, x, y, state }`, `Board = (Tile|null)[][]`, eventi tipizzati.
  - Done: file compila in strict mode; nessun `any`.
- [ ] **S1.2 Generazione board senza match preesistenti** (`core/Board.ts`)
  - Obiettivo: `generateBoard()` pura, deterministica (seed opzionale), mai con match iniziali.
  - Attività: per ogni cella, scegli tipo evitando che completi run di 3 (controlla 2 a sinistra e 2 sopra).
  - Done: test `generateBoard` su 1000 board → `findMatches` vuoto (test da scrivere in parallelo).
- [ ] **S1.3 Rendering tile**
  - Obiettivo: griglia visibile con tile distinte per tipo.
  - Attività: `Renderer.ts` disegna sfondo griglia + tile (forma procedurale per tipo); `TILE_SIZE` e margini in `config.ts`.
  - Done: board 8×8 visibile con 6 gemme distinguibili; scala corretta su mobile.
- [ ] **S1.4 Responsive & DPR**
  - Obiettivo: canvas nitido e centrato su portrait e landscape.
  - Attività: calcolo `TILE_SIZE` dinamico da viewport; `ctx.setTransform` per DPR; `ResizeObserver`.
  - Done: test manuale su viewport 375×667, 768×1024, 1920×1080; nessun blur/overflow.
- [ ] **S1.5 Animator base** (`rendering/Animator.ts`)
  - Obiettivo: motore tween riusabile (lerp + easing).
  - Attività: classe `Tween` (durata, easing, callback onUpdate/onComplete), gestione in RAF del loop.
  - Done: tile animabile (es. scale pulse) via tween; test unitario del calcolo easing (opzionale).

### Fase 2 — Input & Swapping (≈3 gg)

**Goal fase**: il giocatore seleziona e scambia tile adiacenti con feedback visivo; swap invalido torna indietro.

- [ ] **S2.1 InputHandler unificato**
  - Obiettivo: touch + mouse con un unico flusso `pointerdown/move/up`.
  - Attività: mapping viewport→cella (row/col), soglia drag 10 px, hit test solo su celle valide.
  - Done: tap/trascina su desktop e mobile seleziona la cella corretta (test manuale + pointer events mock).
- [ ] **S2.2 Selezione tile**
  - Obiettivo: highlight della tile selezionata.
  - Attività: stato `selected` nel renderer; animazione pulse; deselezione su tap fuori.
  - Done: selezione visibile e deselezionabile.
- [ ] **S2.3 Swap + FSM SWAPPING**
  - Obiettivo: swap animato di due tile adiacenti.
  - Attività: stato `SWAPPING` nella FSM; animazione scambio; aggiornamento modello (row/col) a fine tween.
  - Done: swap fluido; input bloccato durante l'animazione.
- [ ] **S2.4 Rilevamento match post-swap**
  - Obiettivo: decidere se lo swap produce un match.
  - Attività: dopo lo swap, `findMatches`; se match → `MATCHING`, altrimenti `REVERTING`.
  - Done: FSM transiziona correttamente nei due casi (test di integrazione).
- [ ] **S2.5 Revert animato**
  - Obiettivo: swap indietro fluido se nessun match.
  - Attività: stato `REVERTING`; ri-animazione opposta; ritorno a `IDLE`.
  - Done: swap invalido torna alla posizione originale senza perdere il turno; input riabilitato.

### Fase 3 — Match & Clear (≈3 gg)

**Goal fase**: match rilevati, rimossi con animazione, punteggio calcolato.

- [ ] **S3.1 findMatches completo** (`core/MatchEngine.ts`)
  - Obiettivo: scan orizzontale + verticale, match ≥ 3, overlap L/T gestiti.
  - Attività: implementare l'algoritmo del prompt come funzione pura; gestire run sovrapposti.
  - Done: test case — run H di 3, run V, L-shape/T-shape, doppio match, nessun match.
- [ ] **S3.2 FSM MATCHING → CLEARING**
  - Obiettivo: sequenza match→clear orchestrata dalla FSM.
  - Attività: stati `MATCHING` (rileva e marca) e `CLEARING` (anima rimozione: fade/scale-out); `Tile.state = CLEARING`.
  - Done: le tile matchate scompaiono con animazione; il modello diventa `null` sulle celle.
- [ ] **S3.3 ScoreManager**
  - Obiettivo: punteggio per evento di clear, con moltiplicatore cascade.
  - Attività: `ScoreManager` con `addClearEvent(tiles, cascadeLevel, shapeBonus)`; formula `tiles×10×mult + bonus`; evento `scoreChange`.
  - Done: test unitari della formula (match 3/4/5, cascade ×1/×2/×3).
- [ ] **S3.4 HUD punteggio**
  - Obiettivo: score visibile e aggiornato in tempo reale.
  - Attività: `HUD.ts` legge eventi dal core e aggiorna il DOM (senza logica di gioco nel DOM).
  - Done: lo score sale a ogni clear (test manuale).

### Fase 4 — Gravity & Refill (≈3 gg)

**Goal fase**: cascade completa — caduta, spawn, nuovi match, loop fino a stabilità.

- [ ] **S4.1 applyGravity** (`core/Board.ts`)
  - Obiettivo: funzione pura che compatta le colonne verso il basso.
  - Attività: per ogni colonna, sposta tile verso il basso riempiendo i `null`; ritorna lista dei movimenti (from→to) per l'animazione.
  - Done: test unitari — colonna con gap multipli, colonna piena, colonna vuota.
- [ ] **S4.2 Refill**
  - Obiettivo: spawn di nuove tile dall'alto.
  - Attività: per ogni gap in cima, crea tile con `state: FALLING` e `y` negativo (fuori canvas); tipi random senza creare match iniziali con le vicine già presenti.
  - Done: board sempre piena (8×8, nessun `null`) a fine refill.
- [ ] **S4.3 FALLING + REFILLING nella FSM**
  - Obiettivo: stati animati con modello aggiornato a fine caduta.
  - Attività: `FALLING` anima le tile verso la row target; al termine aggiorna `row/col`; transizione a `REFILLING`/`MATCHING`.
  - Done: cascade visivamente fluida; nessuna tile "teletrasportata".
- [ ] **S4.4 Loop cascade**
  - Obiettivo: ripetere match→clear→fall→refill finché stabile.
  - Attività: a fine refill, `findMatches` → se match torna a `MATCHING` (cascade level++) altrimenti `IDLE`; cap depth = 20 (rischio "board mai stabile").
  - Done: test di integrazione: da board nota, la cascade si risolve fino a stabilità in N step; test con cap 20 che forza la stabilizzazione.
- [ ] **S4.5 Deadlock detection**
  - Obiettivo: nessuna partita bloccata.
  - Attività: `hasValidMoves(board)` — esiste almeno uno swap che produce match; se assente a fine cascade → reshuffle animato.
  - Done: test con board costruita senza mosse valide → reshuffle; nessun loop infinito.

### Fase 5 — Game Flow (≈2-3 gg)

**Goal fase**: partita con selezione modalità (Moves/Time), avvio, limite, fine e restart.

- [ ] **S5.0 Modalità di gioco & configurazione**
  - Obiettivo: due game mode selezionabili con valori editabili e persistiti.
  - Attività: tipo `GameMode = 'moves' | 'time'` e `GameConfig { mode, moves: 20, timeSeconds: 60 }` in `core/types.ts`; input numerici (+/− stepper, clamp moves 5-50, time 30-300) nello start screen; persistenza in `localStorage`; la FSM e l'HUD leggono `GameConfig` (niente magic number).
  - Done: scelta modalità e modifica valori funzionanti; al reload le preferenze restano (test manuale); test unitario sul clamp dei valori.
- [ ] **S5.1 FSM GAME_OVER + Start screen**
  - Obiettivo: ciclo vita partita completo.
  - Attività: stato `GAME_OVER`; overlay Start ("Play" + selector modalità di S5.0) e GameOver (score, best, "Play again").
  - Done: da overlay si avvia una nuova partita pulita (board nuova, score 0, contatori resettati) nella modalità scelta.
- [ ] **S5.2 Move counter + Timer (per modalità)**
  - Obiettivo: limite di partita coerente con la modalità (moves: swap validi; time: countdown).
  - Attività: in `moves` solo gli swap validi consumano una mossa (evento `movesChange`); in `time` un timer basato su `performance.now()` congelato in pausa (evento `timeChange`); a 0 → GAME_OVER in entrambe.
  - Done: il contatore giusto per modalità decrementa correttamente; game-over a 0 (test manuale su entrambe le modalità); il timer non "perde" secondi in pausa.
- [ ] **S5.3 Best score (localStorage)**
  - Obiettivo: persistenza del record (separato per modalità).
  - Attività: `ScoreManager.load()/save()` con chiavi `best.moves` / `best.time`; HUD mostra best della modalità corrente; aggiornato a fine partita.
  - Done: refresh pagina → best score persistente e corretto per modalità.
- [ ] **S5.4 Pause**
  - Obiettivo: pausa senza rompere il loop né il timer.
  - Attività: stato `PAUSED` (toggle tasto/tap); RAF sospeso; overlay Pause; il timer Time è congelato (miglioria #11).
  - Done: pausa/riprendi preserva stato, animazioni e timer.

### Fase 6 — Polish (≈4 gg)

**Goal fase**: gioco "finito": FX, audio, tile speciali, combo UI.

- [ ] **S6.1 Particle FX** (`rendering/Particles.ts`)
  - Obiettivo: sparkle/explosion alla clear.
  - Attività: sistema a pool di particelle (riuso oggetti, niente GC spike); colori per tipo gemma.
  - Done: FX visibili senza drop di frame; pool riusato (test di massima: 60 FPS).
- [ ] **S6.2 Combo UI**
  - Obiettivo: feedback per cascade ("x2!", "x3!").
  - Attività: testo fluttuante al clear; evento `combo` dal core.
  - Done: testo combo visibile e animato su cascade ≥ 2.
- [ ] **S6.3 Audio via Web Audio API** (`audio/AudioManager.ts`)
  - Obiettivo: SFX (swap, match, cascade, game over) + BGM opzionale, con toggle.
  - Attività: sintesi procedurale (oscillatori) — nessun file audio esterno; mute persistente in localStorage.
  - Done: suoni coerenti; toggle funzionante; AudioContext avviato su gesto utente (autoplay policy).
- [ ] **S6.4 DEFERRED (non confermato in scope) Special tiles (P2)** — *se confermato in scope*
  - Obiettivo: match di 4 → tile "linea", match di 5 → "bomba".
  - Attività: regole di generazione post-match; logica di attivazione; animazioni dedicate.
  - Done: test unitari regole; partita giocabile con tile speciali senza regressioni.
- [ ] **S6.5 Bilanciamento & tuning**
  - Obiettivo: difficoltà ragionevole (game feel).
  - Attività: tweak di punteggi, durate animazioni (120-350 ms), soglie drag; playtest rapido.
  - Done: partita media 2-4 min; nessuna animazione "lenta".

### Fase 7 — Testing, Performance & Packaging (≈2-3 gg)

**Goal fase**: qualità verificata, build distribuita.

- [ ] **S7.1 Copertura core ≥ 90% branch**
  - Obiettivo: soglia di qualità su `src/core`.
  - Attività: colmare gap con test Vitest (Board, MatchEngine, ScoreManager, FSM, deadlock, cap cascade).
  - Done: `npm run test:coverage` verde con soglie configurate.
- [ ] **S7.2 E2E Playwright — FUORI SCOPE v1 (stretch)**
  - Obiettivo: flussi chiave automatizzati (non bloccante per la v1).
  - Attività (quando in scope): avvio partita, swap via coordinate canvas, score che aumenta, game-over.
  - Done: suite E2E verde su Chromium + WebKit (mobile viewport).
- [ ] **S7.3 Performance check**
  - Obiettivo: 60 FPS sotto carico.
  - Attività: DevTools performance con CPU 4× throttle; profiler su cascade lunghe; Lighthouse mobile.
  - Done: 60 FPS sostenuti; < 3 s load; nessun long task > 50 ms.
- [ ] **S7.4 Build di produzione + preview**
  - Obiettivo: artefatto finale valido.
  - Attività: `npm run build`; `npm run preview`; smoke test manuale sulla build.
  - Done: build senza warning; preview giocabile.
- [ ] **S7.5 Deploy su Cloudflare Pages — FUORI SCOPE v1 (step pronti)**
  - Obiettivo: gioco online con URL pubblico (attivabile a richiesta in ~1 ora).
  - Attività (quando in scope): connessione repo a **Cloudflare Pages** (build `npm run build`, output `dist/`); auto-deploy su push a main; custom domain opzionale.
  - Done: URL live; nuovo push → deploy automatico in < 2 min.
- [ ] **S7.6 CI pipeline — FUORI SCOPE v1 (step pronti)**
  - Obiettivo: qualità gate automatica su ogni PR (attivabile a richiesta).
  - Attività (quando in scope): GitHub Actions: typecheck + lint + test + coverage + build.
  - Done: PR con check verdi; main protetto (opzionale).

---

## 5. Reuse

- **Nessun codice esistente da riusare** (repo vuota). Tutto è greenfield.
- **Scaffold**: `create-vite` (template `vanilla-ts`) fornisce Vite 7 + TS + ESLint già configurati.
- **Librerie riusabili** (evitare di reinventare):
  - `vitest` + `@vitest/coverage-v8` per test e coverage.
  - `@playwright/test` per E2E (stretch — fuori scope v1).
  - Web Audio API (nativa) per SFX — zero dipendenze audio.
  - `localStorage` (nativo) per best score / mute.
  - Nessun framework UI: DOM + Canvas vanilla (il gioco è monoschermo).
- **Pattern da riusare nel nostro codice**:
  - Tween engine (Fase 1) riusato da swap/clear/fall.
  - `findMatches` riusato da FSM e da test.
  - Emitter di eventi tipizzato condiviso tra core → UI (senza dipendenze esterne).

---

## 6. Verifica (Verification)

### Comandi
| Comando | Scopo |
|---------|-------|
| `npm run dev` | sviluppo con HMR |
| `npm run typecheck` | TS strict |
| `npm run lint` | ESLint |
| `npm test` | unit + integration (Vitest) |
| `npm run test:coverage` | soglia ≥ 90% branch su core |
| `npm run build && npm run preview` | produzione + smoke test |
| `npx playwright test` | E2E (stretch — fuori scope v1) |

### Checklist manuale per fase (smoke)
- F1: board 8×8 senza match iniziali visibili; responsive.
- F2: swap valido/invalido con revert; input bloccato durante animazioni.
- F3: match 3/4/5 e L/T; score corretto.
- F4: cascade multi-step; nessuna tile "teletrasportata"; board mai bloccata.
- F5: selezione modalità (Moves/Time) con valori editabili; start → gioco → game-over (mosse esaurite o tempo scaduto) → restart; best score persistente per modalità; pausa (timer fermo).
- F6: FX/combo/audio visibili e disattivabili; special tile (se in scope).
- F7: 60 FPS a 4× throttle; zero console errors; build live.

### Matrix browser
- iOS Safari (ultime 2 major) · Android Chrome · Desktop Chrome/Firefox/Safari (ultime 2 major).

---

## 7. Rischi & Mitigazioni (dal prompt, con azioni concrete)

| Rischio | Impatto | Mitigazione nel piano |
|---------|---------|----------------------|
| Cascade infinita | Hang | Cap depth 20 + stabilizzazione forzata (S4.4) + test dedicato |
| Nessuna mossa valida | Giocatore bloccato | Deadlock check → reshuffle animato (S4.5) + test |
| Performance mobile | Jank | Pool di particelle, niente allocazioni in loop, RAF, DPR clamp ≤ 2 (S6.1, S7.3) |
| Conflitto touch/mouse | Cella sbagliata | Pointer events unificati + soglia drag 10 px (S2.1) |
| Autoplay audio bloccato | Nessun suono | AudioContext avviato al primo gesto utente (S6.3) |
| Asset non pronti | Schermo vuoto | Tile procedurali: nessun asset binario (S1.3) |

---

## 8. Definizione di Done — MVP GemSwap

- [ ] TS strict: `npm run typecheck` pulito, zero `any` nel core.
- [ ] Coverage branch ≥ 90% su `src/core`.
- [ ] 60 FPS a CPU throttle 4× (DevTools).
- [ ] Funziona su iOS Safari, Android Chrome, Firefox/Chrome/Safari desktop.
- [ ] Zero console errors/warnings in produzione.
- [ ] Partita completa giocabile in **entrambe le modalità** (Moves / Time): start → swap → match → cascade → game-over → restart.
- [ ] Valori di default corretti (20 mosse / 60 s) e editabili dall'utente; preferenze persistite in `localStorage`.
- [ ] Deploy live con auto-deploy (solo se attivato — fuori scope v1, Cloudflare Pages).