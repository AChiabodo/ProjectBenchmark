# AUDIT — staticweb-classic-cars

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`, §6) dopo
la revisione C9 (issue #10). Il §6 recensisce il prompt `_wording-source/car_rental.txt`, che
questo Plan trasforma in benchmark senza modificarne il testo: ogni reperto è mappato a
`applied`, `deferred` o `obsolete` con la ragione e il punto del Plan in cui vive ora.
Seguono i rilievi nuovi della revisione C9.

## Reperti d'archivio (§6, «Problemi»)

| # | Reperto | Stato | Ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | I filtri chiedono categoria, anno e prezzo, ma il formato del dataset non è definito | applied | Il §«Dataset: flotta» dichiara schema, tipi, domini e la validazione; il §«Filtri» fissa i parametri, i valori ammessi e il default di ognuno |
| 2 | Header e footer condivisi implicano duplicazione manuale senza strategia di manutenzione | applied | Il §«Header e footer senza framework» dichiara la duplicazione, mette l'elenco dei link in un'unica fonte (`siteNav`) e affida ad A11 l'asserzione di parità fra le sei pagine |
| 3 | Il form è validato, ma il comportamento di invio non è definito | applied | Il §«Comportamento del form» definisce validazione al blur e al submit, `aria-invalid`, riepilogo, `preventDefault`, pannello di conferma e persistenza in `retromotors:richieste:v1`; A7 lo asserisce |
| 4 | Immagini e font esterni introducono dipendenze, licenze e rischio performance | applied | Il §«Font e immagini locali» fissa stack di sistema o file `woff2` in `assets/fonts/` con licenza, e segnaposto SVG in `assets/images/`; A1 fallisce su una sola richiesta con origine esterna |
| 5 | Le transizioni multipagina sono difficili senza JavaScript aggiuntivo e fallback | applied | Il §«Interazione caratterizzante» limita le transizioni a una dissolvenza d'ingresso ≤ 200 ms, disattivata sotto reduced motion, con navigazione nativa come percorso principale: nessuna animazione bloccante all'uscita |
| 6 | Non sono indicati reduced motion, test automatici o browser target | applied | Reduced motion in `SHARED.md` §3.5 e A9; test in `M7` e nel §«Verify» (14 asserzioni); browser target nel §«Fuori scope» (Chromium pinnato, altri browser come degradazione dichiarata) |

## Reperti d'archivio (§6, «Miglioramenti»)

| # | Miglioramento | Stato | Ragione / dove ora |
|---|---------------|-------|--------------------|
| 1 | Definire un modulo dati unico per la flotta | applied | `js/data.js` è l'unica fonte (`AUTO`, `SERVIZI`, enum, `validateDataset()`); l'anteprima in home legge lo stesso modulo (M0.6) |
| 2 | Specificare comportamento dei filtri e conteggio risultati | applied | §«Filtri, conteggio e query string»: cinque parametri, valori fuori dominio ignorati, conteggio calcolato dal dataset filtrato, stato vuoto con reset; A2–A4 |
| 3 | Prevedere una strategia per componenti condivisi | applied | §«Header e footer senza framework»: duplicazione dichiarata, `siteNav` come fonte unica, test di parità A11. L'alternativa (include lato build) è scartata perché introdurrebbe un build tool che l'issue #10 tiene fuori scope |
| 4 | Aggiungere criteri di accessibilità e performance verificabili | applied | Accessibilità in `M5` con asserzioni A10–A11 e tabella di contrasto; la performance non è più un target Lighthouse dichiarato ma un vincolo verificato (nessuna richiesta esterna, nessuna animazione continua, `aspect-ratio` per evitare spostamenti di layout) |

## Rilievi nuovi (revisione C9)

- **`meta.json` senza contratto.** Lo stub di C2 aveva `plan: null` e `audit: null`: nessun
  Plan, nessuna traccia d'audit, `--strict` in errore. Ora `plan: "PLAN.md"` e
  `audit: "AUDIT.md"`, tabella `M0`–`M7` allineata al Plan (Σ pesi 100, Σ slice 40).
- **Sesta pagina non prevista dal prompt.** Il prompt elenca cinque pagine e nessuna scheda
  auto, mentre la slice richiede una pagina dettaglio. Aggiunta `auto.html?id=` e dichiarata
  nel §«Slice verticale»: la deviazione è esplicita, non implicita.
- **Form senza destinazione.** Il prompt validava il form senza dire cosa succede dopo.
  Il Plan vieta l'invio di rete e definisce conferma locale, persistenza e difesa dello
  storage: nessuna promessa di prenotazione reale.
- **Nessun criterio per il target Lighthouse.** Il requisito «Lighthouse > 90» del prompt non
  è ripreso come criterio di punteggio: al suo posto restano asserzioni di stato e il
  divieto verificato di richieste esterne.
