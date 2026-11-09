# C3 — `breakout` (revisione)

**Obiettivo:** il piano nativo C17 più semplice della suite diventa un benchmark a punteggio
proporzionale e verificabile, senza allargarne lo scope.

**Prerequisiti:** C2 chiuso. `AUDIT.md` iniziale = sezione 1 di `docs/archive/REVIEW-2026-08-20.md`.

## Step

1. **Banner**: anteponi `PLAN.md` la variante IT, verbatim da `docs/agents/constraint-banner.md`.
2. **Milestone**: allinea il `PLAN.md` alla tabella `meta.json` di C2 e, se la tabella attuale
   è un segnaposto `M0: 100`, ricava le milestone reali dal piano esistente (bootstrap, core
   deterministico, collisioni, power-up, livelli, HUD/audio, packaging) e aggiorna **entrambi**
   i file. Slice = bootstrap + paddle/palla/mattone con collisione e game over giocabili.
3. **Contratto `verify`**: aggiungi una sezione che impone `./verify.sh` → `verify.json` con
   gli id di `meta.json`, timeout 600 s, e la regola GUI (build + target headless, finestra
   mai lanciata). Il piano oggi prescrive già test headless e sanitizers: rendili il canale
   di verifica, non un requisito sparso.
4. **Reperti residui** dall'audit: la raylib pinnata via `FetchContent` è già nel piano
   attuale e resta; verifica che la sezione "comandi concreti di build/test" esista ancora e,
   se manca, aggiungila come tabella dei comandi del progetto risultante (non come comando
   dell'harness).
5. **Appendice toolchain** (informativa, non vincolante): MSVC v18 + Ninja + CMake ≥ 3.24 +
   raylib 5.5 FetchContent; nota il floor `CMAKE_POLICY_VERSION_MINIMUM` per CMake ≥ 4.
6. **`AUDIT.md`**: apri il file, riporta i reperti della sezione 1 dell'archivio con stato
   `applied` / `deferred` / `obsolete`, e aggiungi i rilievi nuovi emersi in questo step.

## Acceptance

- `PLAN.md` inizia con il banner IT identico, byte per byte, alla variante canonica.
- Ogni `id` milestone di `meta.json` compare nel `PLAN.md`, `Σ weight == 100`,
  `Σ slice ∈ [30,50]`; `node scripts/index.mjs --check` esce 0.
- Il Plan contiene la sezione `verify` con `./verify.sh`, `verify.json`, timeout e regola GUI.
- `AUDIT.md` esiste e ogni reperto dell'archivio sezione 1 ha uno stato.
- Nessuna funzionalità nuova aggiunta rispetto al piano preesistente (diff limitato a banner,
  milestone, verify, appendice, audit).

## Fuori scope

Power-up aggiuntivi, refactor dell'architettura descritta, cambi di stack.
