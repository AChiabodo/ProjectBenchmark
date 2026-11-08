# Benchmark Suite — piano di esecuzione C1→C10

Piano di lavoro deciso nell'intervista di design del 2026-11-08. Questi documenti sono
**spec di step**, non cronaca: ogni step si esegue quando l'operatore lo comanda, e chiude
solo quando i suoi Acceptance passano.

Nessuno step è stato eseguito. Non toccare i benchmark finché l'operatore non dà il via su
C1.

## Invarianti (valgono per tutti gli step)

Presi dall'intervista, non rinegoziabili dentro uno step:

- una sessione, un host, nessun intervento umano di design (max 3 turni di chiarimento);
- **a runtime** nessuna richiesta di rete: niente API esterne, asset remoti, servizi;
- dipendenze **build-time** ammesse solo se pinnate (lockfile, tag + hash);
- più di un nodo (FE/BE/DB/worker) ⇒ profilo Docker Compose che sale con un comando;
- deploy, hosting, publishing, CI e release automation: fuori scope, non valutati;
- strumenti e baseline di toolchain (MSVC, Rust, .NET, JDK, Go, Node, Python, Docker) sono
  **informativi**, mai requisiti: si premia l'adattamento, non l'indovinare l'ambiente.

## Contratti canonici

Definiti qui una volta sola. Uno step che li contraddice è sbagliato, non alternativo.

### 1. Constraint banner — `docs/agents/constraint-banner.md` (creato in C2)

Due testi identici nel contenuto, uno per lingua. Ogni `PLAN.md` inizia con il proprio:

- progetti esistenti (italiano) → variante IT;
- progetti nuovi (inglese) → variante EN;
- wording source (T1) → nessun banner, sono prompt prodotto e restano intatti.

Blocchi obbligatori: una sessione/un host/turni di chiarimento; niente rete a runtime;
dipendenze build-time pinnate; Compose oltre un nodo; fuori scope deploy/publishing/CI;
`./verify.sh` non interattivo + `verify.json`; `RESULT.md` con wall-clock, turni, token.
Nessun tetto wall-clock o di token: si registrano, non si impongono.

### 2. `meta.json` — uno per benchmark, fonte di verità dei pesi

La tabella milestone è **autorevole in `meta.json`**; il `PLAN.md` la rende in prosa e deve
contenere ogni `id` (verificato per stringa da `scripts/index.mjs`). Niente pesi duplicati
a mano.

```json
{
  "id": "breakout",
  "title": "Breakout",
  "kind": "benchmark",
  "tier": 2,
  "spec_language": "it",
  "impl_languages": ["C17"],
  "stack": ["raylib 5.5", "CMake", "CTest"],
  "runtime": "native",
  "plan": "PLAN.md",
  "audit": "AUDIT.md",
  "verify": "./verify.sh",
  "verify_timeout_s": 600,
  "skills": ["implement", "tdd", "diagnosing-bugs", "code-review"],
  "milestones": [
    { "id": "M0", "weight": 40, "slice": true, "title": "Bootstrap + vertical slice eseguibile" },
    { "id": "M1", "weight": 25, "slice": false, "title": "Collisioni deterministiche + test" }
  ]
}
```

Regole validate dallo script: `id` univoco e uguale al nome della directory; `tier` 1–5;
`runtime` ∈ `native|browser|container|jvm|dotnet|go|python|node`; `Σ weight == 100`;
`Σ weight(slice) ∈ [30, 50]`; `plan` esiste; ogni `id` milestone compare nel `PLAN.md`;
`skills ⊆` catalogo `.agents/skills/`; `kind` ∈ `benchmark|wording-source` (per
`wording-source`: nessun `milestones`, nessun `verify`, `tier: 1`).

### 3. `verify.json` — prodotto dal progetto generato, letto dall'harness

```json
{
  "schema": 1,
  "benchmark": "breakout",
  "milestones": [{ "id": "M0", "pass": true, "detail": "CTest 34/34, slice giocabile" }],
  "notes": "build in 92s, nessun warning"
}
```

Regole: `./verify.sh` è deliverable del progetto, non interattivo, exit 0 = pass, timeout
600 s, e scrive `verify.json` con **tutti** gli id di `meta.json`. GUI native: solo build +
target di test headless, la finestra non si lancia mai. Benchmark browser: Playwright
pinnato con assert su DOM/stato, **nessun giudizio visivo automatico**.

### 4. Scoring — `docs/agents/scoring.md` (creato in C2)

- punteggio per benchmark 0–100 = somma dei pesi delle milestone con `pass: true`;
- **Vertical slice come cancello**: se una milestone `slice` fallisce, il punteggio si
  ferma alla somma dei soli pesi `slice` superati; nessun credito per il lavoro oltre;
- il tier non modifica il punteggio: segmenta soltanto la classifica;
- claim non verificati valgono 0: conta `verify.json` confermato dall'harness;
- punteggio di suite = media sui benchmark **tentati** + metrica separata di ampiezza
  (quanti benchmark chiusi), così chi fa 3 progetti bene non è falsato contro chi ne apre 17;
- `RESULT.md` obbligatorio: modello, wall-clock, turni, token, verdetto harness.

### 5. Skill policy — `docs/agents/skills-policy.md` (creato in C2)

Allowlist dichiarata in `meta.json`; default per tier, così due run sono confrontabili:

- T1–T2: `implement`, `tdd`, `diagnosing-bugs`, `prototype`, `code-review`;
- T3: + `codebase-design`, `improve-codebase-architecture`;
- T4–T5: + `to-spec`, `to-tickets`, `implement-spec`, `wayfinder`;
- escluse sempre: `research` (raggiunge la rete), `wizard` (solo operatore umano),
  `grill-*` / `ask-matt` / `to-questionnaire` (interviste all'operatore), `handoff`,
  `setup-matt-pocock-skills`.

### 6. Indice generato — `scripts/index.mjs` (creato in C2)

Node 22, **zero dipendenze**. Legge `benchmarks/*/meta.json` e
`benchmarks/staticweb/_wording-source/*/meta.json`, valida i contratti §2, e scrive:
`benchmarks.json` (ordinato per `tier`, poi `id`) e la tabella dentro
`benchmarks/README.md` fra `<!-- INDEX:START -->` e `<!-- INDEX:END -->`. `--check`
fallisce se l'output rigenerato differisce da quello committato. Nessuna CI: si lancia a mano.

## Inventario e tier

17 benchmark valutati + 4 wording source (T1, fuori dal conteggio della suite).

| id | impl | runtime | tier |
|---|---|---|---|
| `breakout` | C17 + raylib | native | T2 |
| `staticweb-camels` | HTML/CSS/JS | browser | T2 |
| `staticweb-classic-cars` | HTML/CSS/JS | browser | T2 |
| `rulechat` | Python | container | T2 |
| `match3` | TS + Vite | browser | T3 |
| `tetroshift` (ex `Tetris`) | C++20 + raylib | native | T3 |
| `staticweb-watches` | HTML/CSS/JS | browser | T3 |
| `staticweb-auction` | HTML/CSS/JS | browser | T3 |
| `connect4-minimax` | C# / .NET 8 | dotnet | T3 |
| `rust-tui-editor` | Rust + ratatui | native | T3 |
| `go-http-server` | Go | go | T3 |
| `kotlin-desktop` | Kotlin/JVM | jvm | T3 |
| `minilang` | Rust | native | T4 |
| `taskboard` | Svelte/TS + backend + Postgres, Compose | container | T4 |
| `neon-vanguard` | C++20 + raylib | native | T5 |
| `wayline` | TS + React | browser | T5 |
| `paper-feed` | Python + Compose | container | T5 |

Wording source T1: `staticweb/_wording-source/{cammelli,cammelli_inglese,car_rental,online_auction,vintage_watches}.txt`
mantenuti **identici**, con un `meta.json` accanto che li indicizza.

## Sequenza

Dipendenze: C1 → C2 → (C3…C10 in qualsiasi ordine, ma un benchmark = un commit).
C9 richiede C2. C10 richiede C2, non C3–C9.

| step | spec | esito | commit |
|---|---|---|---|
| C1 | [C1-move-to-benchmarks.md](./C1-move-to-benchmarks.md) | rinomina in `benchmarks/`, zero modifiche di contenuto | 1, solo `git mv` + path fix |
| C2 | [C2-infrastructure.md](./C2-infrastructure.md) | banner, `meta.json`, scoring, skill policy, `index.mjs`, ADR, archivio REVIEW | 1 |
| C3 | [C3-breakout.md](./C3-breakout.md) | Breakout revisionato | 1 |
| C4 | [C4-match3.md](./C4-match3.md) | Match3 revisionato | 1 |
| C5 | [C5-tetroshift.md](./C5-tetroshift.md) | Tetris alleggerito | 1 |
| C6 | [C6-neon-vanguard.md](./C6-neon-vanguard.md) | NEON VANGUARD revisionato (primo audit) | 1 |
| C7 | [C7-wayline.md](./C7-wayline.md) | WAYLINE ridotto | 1 |
| C8 | [C8-paper-feed.md](./C8-paper-feed.md) | paper-feed offline | 1 |
| C9 | [C9-staticweb.md](./C9-staticweb.md) | 4 Plan StaticWeb + wording source | 4 (uno per benchmark) |
| C10 | [C10-new-benchmarks.md](./C10-new-benchmarks.md) | 7 nuovi benchmark in inglese | 7 (uno per benchmark) |

## Come si chiude uno step

1. esegui gli step nella sua spec, in ordine;
2. lancia `node scripts/index.mjs` e poi `node scripts/index.mjs --check` (da C2 in poi);
3. verifica ogni Acceptance con un comando, non a occhio;
4. un benchmark revisionato senza `AUDIT.md` aggiornato non è chiuso.
