# C6 — `neon-vanguard` (primo audit + contratti)

**Obiettivo:** resta il benchmark "hard native" C++20: **nessun taglio di scope**. È il primo
audit mai fatto (aggiunto dopo `REVIEW.MD`) e serve a renderlo giudicabile: contratti, pesi,
verifica.

**Prerequisiti:** C2. Nessun audit precedente da migrare.

## Step

1. **Banner** IT in testa.
2. **Lettura critica completa** del piano con la lente del "una sessione": la roadmap a fasi e
   le tabelle di bilanciamento sono enorme valore, ma vanno collegate a milestone pesate.
   Deriva la tabella (bootstrap+build, player movement/dash/shoot, spawn director, orb/level-up
   + draft carte, boss 2 fasi, juice/particelle, audio procedurale, harness smoke test,
   packaging). Slice = arena giocabile con player, sparo, un tipo di nemico, morte e restart.
   Aggiorna `meta.json`.
3. **Contratti `verify`**: il piano ha già uno "Smoke Test Harness": rendilo il `./verify.sh`
   ufficiale (build + harness headless → `verify.json` con gli id), finestra mai lanciata.
   Se l'harness descritto richiede input reali, dichiara la modalità scriptata deterministica.
4. **Ambiguità da chiudere** (cerca e risolvi, una risoluzione per punto):
   - "zero warning sul codice di gioco" è un requisito o un obiettivo? come si verifica?
   - tabelle di bilanciamento: sono fonte di verità *da implementare* o parametri che il
     modello può tarare? Se fonte di verità, servono test sui valori;
   - audio sintetizzato a runtime: ha un criterio verificabile (inizializzazione headless?
     nessun file audio nel repo?);
   - nessun asset: verifica automatizzabile (grep/CI check sull'assenza di file binari).
5. **Appendice toolchain** informativa: MSVC v18 `/W4 /permissive-`, Ninja, CMake ≥ 3.22,
   raylib 5.5 FetchContent.
6. **`AUDIT.md` nuovo**: reperti con stato, almeno: roadmap non pesata, assenza di contratto
   `verify`, ambiguità warning/bilanciamento/audio, determinismo dello spawn director,
   riproducibilità del draft carte.

## Acceptance

- Banner canonico; `Σ weight == 100`; slice nel range; ogni id nel `PLAN.md`;
  `node scripts/index.mjs --check` esce 0.
- Esiste una sezione `verify` che nomina l'harness esistente come canale ufficiale.
- I quattro punti del §4 hanno una risoluzione scritta e riconoscibile nel piano.
- `AUDIT.md` con almeno 5 reperti, ciascuno con stato.
- Nessuna funzionalità rimossa rispetto al piano attuale (diff solo additivo, salvo riscritture
  di chiarimento).

## Fuori scope

Ridurre il target di release (decisione presa: non si riduce), cambiare stack, riscrivere il
design narrativo o il bilanciamento.
