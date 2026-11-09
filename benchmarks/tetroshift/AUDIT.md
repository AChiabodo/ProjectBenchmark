# AUDIT — tetroshift

Primo audit del benchmark: prima di C5 il piano non era mai stato recensito, quindi i reperti
partono da zero e sono stati raccolti durante la revisione C5. Ogni reperto ha uno stato e una
destinazione: il piano di questo step, oppure differito con motivo.

Piano revisionato: `PLAN.md` (revisione C5, issue #6). Fonte autorevole dei pesi: `meta.json`.

## Reperti

### R1 — Contratto `verify` assente
Il piano non definiva alcun comando di verifica: né build headless, né suite di test, né
`verify.json`. Il punteggio non era calcolabile dal lato harness.
- **Stato:** risolto in C5.
- **Destinazione:** sezione `## Verify` del `PLAN.md`; `verify: "./verify.sh"` e
  `verify_timeout_s: 600` nel `meta.json`.

### R2 — Roadmap non pesata
Le Fasi 1–5 non avevano pesi né una vertical slice dichiarata: nessuna misura proporzionale
del completamento parziale, nessun cancello di slice.
- **Stato:** risolto in C5.
- **Destinazione:** milestone M0–M7 pesate nel `meta.json` (fonte autorevole) e rese nella
  tabella «Milestone pesate» del `PLAN.md`; slice = M0 (peso 40).

### R3 — Ambiguità fisica/logica
§4.1 prometteva molle che partecipano alle collisioni e un «locking a rilassamento» basato
sull'energia cinetica: la fisica avrebbe guidato lo stato logico, rendendolo non deterministico
e non testabile headless.
- **Stato:** risolto in C5.
- **Destinazione:** §4.1 riscritto (fisica = juice visivo, direzione dei dati a senso unico)
  e test obbligatorio di indipendenza fisica/logica in M7 e in `## Verify`.

### R4 — Promesse geometriche non supportate
Il piano elevava a pilastro le griglie esagonali e radiali, con una Fase 5 «proof of concept»
dedicata, senza che nessuna implementazione fosse mai stata richiesta né tentata: promessa di
lavoro non misurata e non richiesta.
- **Stato:** risolto in C5.
- **Destinazione:** sezione **Non-obiettivi** del `PLAN.md`; §4.3 riscritto (l'astrazione
  `IGrid` resta come struttura, `OrthogonalGrid` unica implementazione richiesta); Fase 5
  rimossa dalla roadmap (il suo test di regressione sopravvive in M7).

### R5 — Scope carte non quantificato
«Prime 15–20 carte» senza minimo vincolante e senza relazione con la tabella di esempi §7.
- **Stato:** parzialmente risolto in C5.
- **Destinazione:** M4 quantifica il minimo (≥15 carte, incluse le 7 della tabella §7).
  L'elenco esaustivo delle restanti è differito: enumerarlo nel piano aggiungerebbe volume
  senza valore di verifica.

### R6 — Nessun criterio di determinismo per i draft
Il draft «3 carte casuali» non specificava la sorgente di casualità: senza un seed esplicito
lo stato della run non è riproducibile né testabile.
- **Stato:** risolto in C5.
- **Destinazione:** M4 richiede il seed esplicito della run per il randomizer delle offerte
  (stesso seed ⇒ stessa sequenza di carte) e un test headless di riproducibilità in M7.

### R7 — Emscripten/WebAssembly citato come target
Lo stack motivava CMake con la portabilità verso WebAssembly/Emscripten, senza che un build
web fosse mai stato richiesto.
- **Stato:** risolto in C5.
- **Destinazione:** sezione **Non-obiettivi** del `PLAN.md`; rimozione dallo stack (§2).

### R8 — Nessuna suite di test dichiarata
Il piano prescriveva solo strumenti di debug in-game (F1–F5): nessun test automatico del core
logico, nessun requisito di esecuzione headless.
- **Stato:** risolto in C5.
- **Destinazione:** M7 (suite headless) e `## Verify`.
