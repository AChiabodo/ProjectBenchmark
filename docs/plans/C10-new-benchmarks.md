# C10 — Nuovi benchmark (inglese, 7 progetti)

**Obiettivo:** chiudere i gap di copertura (conversazionale, interprete, fullstack con Compose,
ricerca algoritmica, TUI, concorrenza Go, Kotlin/JVM) con 7 benchmark scritti **in inglese**,
banner EN, `meta.json` con `spec_language: "en"`. Un commit per benchmark.

**Prerequisiti:** C2. Non dipende da C3–C9.

## Regole comuni a tutti e 7

- prima riga: banner EN verbatim da `docs/agents/constraint-banner.md`;
- milestone pesate in `meta.json`, slice nel piano, `./verify.sh` → `verify.json`, timeout 600 s;
- nessuna API esterna né asset remoto; se serve un servizio, è un container nel Compose;
- `AUDIT.md` non serve (nessuna revisione): il campo `audit` resta `null`;
- niente skill fuori policy; ogni piano dichiara la appendice toolchain come informativa.

## 1. `rulechat` — Python, container, T2

Chatbot conversazionale **deterministico**: NLU a regole/FSM su un corpus di utterance incluso
nel repo (intent, entità, slot), dialogo multi-turno con slot filling, memoria per sessione,
fallback e escalation, log strutturato. Nessun LLM, nessuna API.
**Slice:** server + una conversazione di 3 turni che riempie uno slot e chiude un intent.
**Milestone:** bootstrap+API, corpus+intent matcher, slot filling/FSM, persistence sessioni
(SQLite), fallback+escalation, test table-driven, verify.

## 2. `minilang` — Rust, native, T4

Interprete di un piccolo linguaggio (sintassi dichiarata nel piano: espressioni, variabili,
`if`, `while`, funzioni, print): lexer, parser, AST, valutatore, REPL, errori con posizione.
**Slice:** `print 1+2*3;` end-to-end, con errore lessicale e sintattico riportati con riga/colonna.
**Milestone:** lexer, parser+AST, valutatore, scope/funzioni, REPL+CLI, gestione errori, suite
table-driven (snapshot di output e di errori), verify.

## 3. `taskboard` — Svelte/TS + backend + Postgres, Compose, T4

L'unico multi-nodo con database: REST API (CRUD board/column/task, ordinamento, move), frontend
che consuma l'API, Postgres con migrazioni, seed, e un comando unico `docker compose up --wait`.
**Slice:** `up --wait` + crea lista + crea task + sposta task visibile dopo reload.
**Milestone:** compose+migrazioni, API CRUD, ordinamento/move, frontend lista+board,
stati errore/vuoto, seed deterministico, test API (container) + e2e Playwright, verify.

## 4. `connect4-minimax` — C#/.NET 8, dotnet, T3

Motore di ricerca deterministico: Connect-4 con negamax + alpha-beta, depth configurabile,
valutazione a finestre, transposition table opzionale, CLI per giocare, harness di
self-play/perft su posizioni fissate. Nessuna UI grafica.
**Slice:** CLI giocabile che risponde entro un budget dichiarato e rifiuta mosse illegali.
**Milestone:** regole+board, win detection, negamax+alpha-beta, valutazione, CLI,
test su posizioni note/perft, benchmark di tempo deterministico, verify.

## 5. `rust-tui-editor` — Rust + ratatui, native, T3

Editor di testo a schermo intero con **logica testabile headless**: buffer a gap/rope, cursore,
selezione, undo/redo, ricerca, comandi, salvataggio, e un layer TUI sottile.
**Slice:** apri un file, modifica, undo/redo, salva, riapri con contenuto corretto, senza TUI
(harness headless).
**Milestone:** buffer+editing, cursore/selezione, undo/redo, search, save/load+encoding,
keymap+commands, TUI rendering, suite headless, verify.

## 6. `go-http-server` — Go, T3

Server HTTP concorrente senza DB esterno: routing, middleware (logging, rate limit, recover),
worker pool con coda bounded, backpressure, graceful shutdown, `/healthz`, `/metrics` testuale,
test con `-race` e test di concorrenza su carico controllato.
**Slice:** server che risponde, elabora N job con worker pool e si spegne pulito sotto timeout.
**Milestone:** router+handler, middleware, worker pool+coda, backpressure, shutdown, test
funzionali + `-race`, verify.

## 7. `kotlin-desktop` — Kotlin/JVM (Compose Desktop o Swing), jvm, T3

App desktop realmente eseguibile **senza Android SDK**: un dominio testabile (modello +
persistenza locale, es. tracker di spese con categorie e report) e una UI desktop sottile.
**Slice:** app che parte, inserisce un elemento, lo persiste e lo mostra dopo riavvio, con test
JVM del dominio.
**Milestone:** progetto Gradle+dominio, persistenza locale, UI inserimento/lista, report,
validazione/stati errore, test JVM, verify (build + test + smoke di avvio headless).
**Nota:** variante Android dichiarata **stretch goal non valutato** (solo build + unit test),
perché l'SDK non è sull'host.

## Acceptance (per ogni benchmark nuovo)

- Banner EN canonico; `spec_language: "en"`; `audit: null`.
- `Σ weight == 100`; slice nel range; ogni id nel `PLAN.md`;
  `node scripts/index.mjs --check --strict` esce 0.
- Il piano dichiara un solo comando di avvio e uno di verifica; per `taskboard` e i servizi,
  `docker compose up --wait`.
- Nessun riferimento a servizi o asset remoti nel piano (grep come in C9).
- Tier come da inventario: T2 `rulechat`; T3 `connect4-minimax`, `rust-tui-editor`,
  `go-http-server`, `kotlin-desktop`; T4 `minilang`, `taskboard`.
- `benchmarks.json` e `benchmarks/README.md` rigenerati (17 benchmark + 5 wording source).

## Fuori scope

App Android con emulatore, LLM reali, qualunque deploy o pubblicazione, benchmark che richiedano
un secondo host.
