# AUDIT — staticweb-auction

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`, §7) dopo
la revisione C9 (issue #10). Il §7 recensisce il prompt
`_wording-source/online_auction.txt`, che questo Plan trasforma in benchmark senza
modificarne il testo: ogni reperto è mappato a `applied`, `deferred` o `obsolete` con la
ragione e il punto del Plan in cui vive ora. Seguono i rilievi nuovi della revisione C9.

## Reperti d'archivio (§7, «Problemi»)

| # | Reperto | Stato | Ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | «Aste live 24/7» è incompatibile con un dataset statico senza strategia per date relative | applied | Il §«Date relative deterministiche» sostituisce la promessa con l'orologio relativo alla sessione: `chiudeTraMinuti` nel dataset, epoca persistita in `martello:epoch:v1`, override `?epoch=` per i test, stato derivato a ogni render |
| 2 | Non è definito cosa persiste dopo il reload: offerte, stato del lotto, identità | applied | §«Cosa persiste dopo il reload»: cinque chiavi con contenuto e difesa. Lo stato del lotto non è persistito perché è derivato dall'epoca persistita, che è la ragione per cui non può divergere |
| 3 | La simulazione deve essere separata con grande evidenza da un'asta reale | applied | §«Simulazione dichiarata»: badge «SIMULAZIONE», `role="note"` non chiudibile, riga su nessun pagamento e nessun invio, dichiarazione in testa a `come-funziona.html`, nessun uso di «live» da solo nel titolo della pagina lotto |
| 4 | `aria-live` sui countdown, soprattutto con i decimi, genera annunci eccessivi | applied | §«Annunci `aria-live` a intervalli ragionevoli»: cifre fuori dalle regioni live (`role="timer"`, `aria-live="off"`), annunci solo alle soglie 60/30/10/5/1 minuto e «chiusa», prezzo coalescente a 3 s, risultati dei filtri con debounce ≥ 300 ms; A10 lo verifica con `MutationObserver` |
| 5 | Il prompt è probabilmente troppo grande per ottenere tutti i file in una risposta | applied | Lo scope è ridotto a una slice esplicita (home, catalogo, pagina lotto) con sei milestone pesate; il resto del prompt (ticker, tilt 3D, cursore custom, text reveal, scroll-driven) è fuori dal contratto di verifica e non vale credito |
| 6 | Mancano test, fixture e criteri per il pannello offerte | applied | `M7` e il §«Verify» con 14 asserzioni; la sequenza del rivale è una funzione pura (`rivalTick()`) verificata in Node, così non serve un fixture temporale |
| 7 | Immagini esterne, animazioni e glow possono compromettere il target Lighthouse | applied | Immagini locali procedurali (`SHARED.md` §2, A1), animazioni continue fuori scope, glow solo come decorazione con contrasto verificato (A11) |

## Reperti d'archivio (§7, «Miglioramenti»)

| # | Miglioramento | Stato | Ragione / dove ora |
|---|---------------|-------|--------------------|
| 1 | Ridurre il primo incremento a catalogo + dettaglio + countdown + offerta simulata | applied | §«Slice verticale» = home, catalogo filtrato, pagina lotto; countdown e offerta simulata stanno in `M3` |
| 2 | Definire un dataset deterministico con date relative | applied | §«Dataset: lotti» con 14 lotti, `chiudeTraMinuti` e `validateDataset()`; A6 confronta due run con la stessa epoca |
| 3 | Specificare rate limit, persistenza locale e stati della simulazione | applied | Throttle 2 s sull'offerta dell'utente, attesa 8–20 s del rivale, tabelle di persistenza e stati `in-arrivo`/`live`/`in-chiusura`/`chiusa` derivati |
| 4 | Annunciare i countdown a intervalli ragionevoli, non a ogni frame | applied | §«Annunci `aria-live`» e A10 |
| 5 | Dividere il prompt in fasi eseguibili e verificabili | applied | Milestone `M0`–`M7` con «fatto quando» per ognuna e mapping asserzione → milestone in `M7.4` |

## Rilievi nuovi (revisione C9)

- **`meta.json` senza contratto.** Lo stub di C2 aveva `plan: null` e `audit: null`: nessun
  Plan, nessuna traccia d'audit, `--strict` in errore. Ora `plan: "PLAN.md"` e
  `audit: "AUDIT.md"`, tabella `M0`–`M7` allineata al Plan (Σ pesi 100, Σ slice 40).
- **Lo stato del lotto era un campo del dataset.** Il prompt elenca `stato` fra i campi del
  lotto, il che permette a un lotto di dichiararsi `live` con il countdown a zero. Il Plan lo
  rende derivato dall'orologio e toglie il campo dallo schema: una sola fonte di verità.
- **Il decimo di secondo nel hero non è annunciabile.** Il prompt chiede i decimi e un
  `aria-live` sui countdown: insieme producono dieci annunci al secondo. Il Plan tiene i
  decimi solo come resa visiva, fuori dalle regioni live e assenti sotto reduced motion.
- **`?epoch=` è un aggancio di test dichiarato.** Serve a rendere il countdown deterministico
  in `./verify.sh`; il Plan lo dichiara come tale, con l'unico effetto di sostituire l'epoca
  salvata, così non diventa un comportamento non documentato.
- **Il prompt inglese non esiste per questo sito.** Il wording source è solo in italiano; il
  Plan resta in italiano come gli altri benchmark esistenti.
