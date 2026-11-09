# AUDIT — neon-vanguard

Primo audit del benchmark: `neon-vanguard` è stato aggiunto dopo l'ultimo report di review
e non era mai stato recensito. Ambito di questo passaggio (C6): giudicabilità del piano —
pesi, contratto di verifica, chiusura delle ambiguità, determinismo. Nessun taglio di
scope: il diff sul `PLAN.md` è additivo, salvo riscritture di chiarimento.

Ogni reperto ha uno **stato** e una **destinazione** (dove vive la risoluzione). Stati:
`risolto` (chiuso da questo passaggio), `risolto-contratto` (chiuso a livello di piano; la
verifica meccanica arriva con l'implementazione della milestone indicata), `aperto`.

| id | reperto | stato | destinazione |
|----|---------|-------|--------------|
| A1 | Roadmap a fasi (Sez. 10) non pesata: sette fasi senza pesi né vertical slice dichiarata, quindi nessun punteggio confrontabile con il resto della suite. | risolto | `meta.json` (M0–M8, `Σ` 100, slice 40) + tabella e mappatura in `PLAN.md` |
| A2 | Nessun contratto `verify`: lo Smoke Test Harness (Sez. 9) era strategia interna di validazione, non canale ufficiale; "passare" non era definito per un gioco a finestra. | risolto | `PLAN.md` sezione **Verify** + `meta.json` `verify: ./verify.sh`; harness promosso a contratto con `verify.json` per M0–M8 (milestone M8) |
| A3 | Ambiguità "zero warning sul codice di gioco" (Sez. 2 e 11): requisito o obiettivo? Con quale canale si verifica, e i warning di raylib contano? | risolto | `PLAN.md` **Risoluzione R1**: requisito; warning-as-errors sul solo codice di gioco (`src/`) nella build dell'harness; raylib escluso. Milestone M6 |
| A4 | Ambiguità tabelle di bilanciamento (Sez. 6): la sezione si dichiara "fonte di verità" ma nulla dice se il modello possa tararle; rischio di una milestone spesa a inseguire numeri esatti senza credito, o il contrario. | risolto | `PLAN.md` **Risoluzione R2**: normative, test sui valori; deviazioni solo in `RESULT.md`. Milestone M7 |
| A5 | Ambiguità audio procedurale (Sez. 8): "sintetizzato a runtime" senza criterio verificabile — nessun check su file audio presenti né su inizializzazione headless. | risolto | `PLAN.md` **Risoluzione R3**: nessun file audio nel repository + `Audio::Init(false)` headless senza device, a carico dell'harness. Milestone M5 |
| A6 | Ambiguità "zero asset" (Sez. 1, pillar 2): requisito non negoziabile dichiarato ma non verificato — nessun check automatico sull'assenza di file binari. | risolto | `PLAN.md` **Risoluzione R4**: check dell'harness sull'assenza di media binari nel repository (immagini/audio/font/modelli; `build/` escluso). Milestone M6 |
| A7 | Determinismo dello Spawn Director: `RandRange` (Sez. 3.2) è seedato da `std::random_device`; le curve di difficoltà e i criteri di validazione per ondata/boss (Fase 6: `wave ≥ 6`, `bossSpawned ≥ 1`) dipendevano da run non riproducibili. | risolto-contratto | `PLAN.md` Sez. 3.2 e 5.3: RNG centralizzato iniettabile, seed fisso in `--smoke` (default 42); a parità di seed la coda dell'ondata è identica. Verifica meccanica con M1 |
| A8 | Riproducibilità del draft carte: il pool `Draft3()` (Sez. 3.6/5.6) usava lo stesso RNG non seedato; due run dello stesso comando offrivano mani diverse, rendendo i build non confrontabili. | risolto-contratto | `PLAN.md` Sez. 5.6: draft dal RNG centralizzato, mano identica a parità di seed. Verifica meccanica con M2 |
| A9 | Benchmark non indicizzato nella suite: `audit: null` nel `meta.json`, nessun `AUDIT.md`, pesi provvisori C2 non derivati dalla roadmap. | risolto | questo file + `meta.json` (`audit: "AUDIT.md"`, milestone rivedute) |

Note di audit:

- Il piano resta di qualità altissima per un benchmark T5 (contratti di moduli espliciti,
  tabelle di bilanciamento complete, harness già pensato headless): il problema non era il
  contenuto ma la giudicabilità. Questo audit non chiede riscritture: aggiunge contratti.
- Le milestone M0–M8 non aggiungono scope rispetto alle Fasi 1–7: la mappatura in
  `PLAN.md` dichiara la corrispondenza; la Fase 7 (review + fix pass) resta criterio
  trasversale di accettazione senza peso proprio.
