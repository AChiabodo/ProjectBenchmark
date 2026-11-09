# AUDIT — staticweb-watches

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`, §8) dopo
la revisione C9 (issue #10). Il §8 recensisce il prompt
`_wording-source/vintage_watches.txt`, che questo Plan trasforma in benchmark senza
modificarne il testo: ogni reperto è mappato a `applied`, `deferred` o `obsolete` con la
ragione e il punto del Plan in cui vive ora. Seguono i rilievi nuovi della revisione C9.

## Reperti d'archivio (§8, «Problemi»)

| # | Reperto | Stato | Ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | Non è definito un dataset strutturato per gli orologi, necessario ai filtri | applied | §«Dataset: orologi»: schema con tipi e domini, 10 orologi, `validateDataset()`; l'epoca è derivata dall'anno con `epocaDi()`, così filtro e scheda non possono contraddirsi |
| 2 | Il tema scuro è descritto genericamente, senza palette completa e criteri di contrasto | applied | §«Palette scura e criteri di contrasto»: token per token nei due temi con rapporti misurati e soglie (4,5:1 testo, 3:1 testo grande e bordi); A10 li ricalcola da `getComputedStyle` |
| 3 | Lo smooth scroll custom può danneggiare comportamento nativo, tastiera e accessibilità | applied | §«Smooth scroll: rimosso»: nessun lerp; resta `scroll-behavior: smooth` solo senza reduced motion e solo per le ancore interne, con A9 che verifica `auto` sotto la preferenza |
| 4 | Il calcolo continuo delle ombre e del tilt può essere costoso su mobile | applied | §«Ombre dinamiche»: solo con puntatore fine, un rAF coalescato, movimento ≥ 2 px, card visibili, massimo 6, stop dopo inattività; fallback statico dichiarato e asserito da A8 |
| 5 | Il comportamento del form e della mappa non è specificato | applied | Form definito nel §«Persistenza» (validazione, `aria-invalid`, focus sul primo invalido, nessun invio, conferma locale, `tempo:richieste:v1`); la mappa interattiva è fuori scope perché richiede un servizio remoto, e al suo posto restano indirizzo e orari come testo |
| 6 | Le immagini esterne hanno problemi di licenza, affidabilità e performance | applied | `SHARED.md` §2 impone segnaposto locali dentro `assets/`; A1 fallisce su una sola richiesta con origine esterna |
| 7 | `prefers-reduced-motion` è citato ma non dettagliato per orologio, ombre e scroll | applied | §«Orologio» (secondi a scatti), §«Ombre» (statiche), §«Smooth scroll» (rimosso) e `data-motion`/`data-shadows` su `<html>`, con A9 come asserzione unica |

## Reperti d'archivio (§8, «Miglioramenti»)

| # | Miglioramento | Stato | Ragione / dove ora |
|---|---------------|-------|--------------------|
| 1 | Definire schema dati per prodotti e filtri | applied | §«Dataset: orologi» e §«Filtri, conteggio e query string» |
| 2 | Evitare lo smooth scroll custom oppure renderlo opt-in e disattivabile | applied | Scelta più semplice: rimosso (§«Smooth scroll: rimosso»), coerente con la regola del prompt «se un elemento può essere rimosso senza perdita di significato, rimuovilo» |
| 3 | Definire fallback e costi delle interazioni su mobile | applied | §«Ombre dinamiche» con le condizioni di attivazione e il fallback statico; bottoni magnetici e cursore custom solo su puntatore fine (M3.5) |
| 4 | Aggiungere test per sincronizzazione dell'orologio, filtri e accessibilità | applied | A3–A7 per filtri e orologio, A9–A11 per accessibilità, A6 con esempio numerico verificato (304,5° / 57,0° / 180,0°) |
| 5 | Specificare palette scura e relative verifiche WCAG | applied | Tabella dei token con rapporti misurati e A10 eseguibile; il divieto su `#A88F63` come testo è asserito, non solo scritto |

## Rilievi nuovi (revisione C9)

- **`meta.json` senza contratto.** Lo stub di C2 aveva `plan: null` e `audit: null`: nessun
  Plan, nessuna traccia d'audit, `--strict` in errore. Ora `plan: "PLAN.md"` e
  `audit: "AUDIT.md"`, tabella `M0`–`M6` allineata al Plan (Σ pesi 100, Σ slice 40).
- **L'ottone non passa il contrasto sull'avorio.** `#A88F63` su `#F6F4EF` misura ≈2,8:1:
  sotto la soglia 3:1, quindi non è ammesso nemmeno per testo grande, bordi informativi o
  anello di focus. Il Plan introduce `#7A6438` (≈5,0:1) per testo e focus e lascia
  `#A88F63` alla decorazione.
- **Sesta pagina non prevista dal prompt.** Il prompt elenca cinque pagine e nessuna scheda
  orologio, mentre la slice richiede una pagina dettaglio: aggiunta `orologio.html?id=` e
  dichiarata nel §«Slice verticale».
- **L'orologio non era verificabile.** Il prompt chiede un orologio sincronizzato con l'ora
  reale, ma senza un aggancio il test non può che guardare uno screenshot. Il Plan dichiara
  `?now=`, `data-angle` e `data-timestamp`, con le formule degli angoli e un esempio numerico.
- **Il quadrante è decorativo, l'ora è testo.** Il prompt vuole lancette fluide e
  accessibilità: un quadrante annunciato al secondo sarebbe rumore. Il quadrante è
  `aria-hidden`, l'ora vive in un `<time datetime>`.
- **Nessun criterio per il target Lighthouse.** Il requisito «Lighthouse > 90» non è ripreso
  come criterio di punteggio: restano asserzioni di stato e il divieto verificato di richieste
  esterne.
