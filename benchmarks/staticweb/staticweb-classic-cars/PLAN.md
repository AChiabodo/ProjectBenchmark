> **Banner di vincolo — condizioni non negoziabili della sessione**
>
> - Una sessione, un host: nessun intervento umano di design; al massimo 3 turni di chiarimento con l'operatore.
> - Nessuna richiesta di rete a runtime: niente API esterne, asset remoti o servizi; ogni risorsa è locale o generata dal codice.
> - Dipendenze build-time ammesse solo se pinnate (lockfile, oppure tag + hash).
> - Più di un nodo (FE/BE/DB/worker) ⇒ un profilo Docker Compose che sale con un solo comando.
> - Deploy, hosting, publishing, CI e release automation: fuori scope, non valutati.
> - `./verify.sh` è non interattivo, termina entro 600 s, exit 0 = pass, e scrive `verify.json` con tutti gli id milestone del `meta.json`.
> - `RESULT.md` è obbligatorio: modello, wall-clock, turni, token e verdetto dell'harness.
> - Nessun tetto wall-clock o di token: si registrano, non si impongono.

## Milestone pesate

Tabella resa da `meta.json`, che resta la fonte autorevole dei pesi; `scripts/index.mjs --check` ne verifica la coerenza.

| id | peso | slice | titolo |
|----|-----:|:-----:|--------|
| M0 | 10 | sì | Bootstrap e layout |
| M1 | 20 | sì | Dataset e rendering lista |
| M2 | 10 | sì | Dettaglio e filtri |
| M3 | 20 | — | Interazione caratterizzante: galleria con lightbox e parallax |
| M4 | 15 | — | Accessibilità |
| M5 | 15 | — | Responsive |
| M6 | 10 | — | Verify: Playwright pinnato + verify.sh |

La vertical slice vale 40 punti su 100 (`M0`+`M1`+`M2`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito.

## Slice verticale

Home, flotta filtrata e una scheda auto, tutte sullo stesso dataset locale:

```text
index.html ──▶ flotta.html?categoria=…&anno=…&prezzo=…&ordina=…
                     │
                     └──▶ auto.html?id=<id del dataset>
```

Il prompt non elenca una pagina per la singola auto, ma la slice ne richiede una: il Plan
aggiunge `auto.html?id=` come sesta pagina e lo dichiara qui, invece di lasciarla implicita.
La slice è completa quando la home mostra l'anteprima flotta dal dataset, la flotta filtra e
dichiara il conteggio, e la pagina dettaglio rende l'auto richiesta o lo stato «non
trovata».

## Convenzione condivisa

`benchmarks/staticweb/SHARED.md` è vincolante e non si ripete qui: modulo dati unico con
schema validato, nessun asset remoto, DoD comune, verifica Playwright su DOM e stato.

## Decisioni di sito

### Dataset: flotta

`js/data.js` esporta `AUTO`, gli enum filtrabili, `SERVIZI` (le tipologie di noleggio usate
anche dal form) e `validateDataset()`.

| campo | tipo | dominio |
|---|---|---|
| `id` | stringa | slug univoco, usato in `auto.html?id=` |
| `marca` | stringa | obbligatoria |
| `modello` | stringa | obbligatorio |
| `anno` | intero | 1948–1979 |
| `categoria` | stringa | `CATEGORIE`: `sportiva`, `coupe`, `cabrio`, `berlina` |
| `prezzoGiornoCentesimi` | intero | > 0 |
| `cauzioneCentesimi` | intero | ≥ `prezzoGiornoCentesimi` |
| `trasmissione` | stringa | `TRASMISSIONI`: `manuale`, `automatica` |
| `posti` | intero | 2–5 |
| `colore` | stringa | `COLORI`: `nero-carbone`, `bordeaux`, `argento`, `verde-british`, `avorio` |
| `descrizione` | stringa | obbligatoria, 60–500 caratteri |
| `disponibile` | booleano | — |
| `immagini` | array di stringhe | 2–4 percorsi dentro `assets/images/flotta/` |

Il dataset contiene 8 auto, almeno una per categoria, almeno due cabrio e almeno una non
disponibile. `validateDataset()` rifiuta id duplicati, anni fuori intervallo, cauzione
inferiore al prezzo/giorno, `immagini` vuoto.

### Filtri, conteggio e query string

Su `flotta.html`, con stato nella query string (ricaricabile e condivisibile):

| parametro | valore | default |
|---|---|---|
| `categoria` | uno dei valori di `CATEGORIE` | assente = tutte |
| `anno` | `ante-1960`, `1960-1969`, `1970-1979` | assente = tutti |
| `prezzo` | `fino-300`, `300-600`, `oltre-600` (euro al giorno) | assente = tutte |
| `disponibilita` | `tutte`, `disponibili` | `tutte` |
| `ordina` | `anno`, `prezzo-crescente`, `prezzo-decrescente` | `anno` |

Il conteggio «N vetture» è calcolato dal dataset filtrato e confrontato dal test col numero
di card renderizzate. Un parametro fuori dominio viene ignorato e riportato allo stato
«tutti». Filtro senza risultati → stato vuoto esplicito e pulsante «azzera filtri».

### Header e footer senza framework

Le sei pagine condividono header e footer, e il prompt non dice come tenerli allineati.
Questo Plan sceglie la **duplicazione dichiarata**, l'unica opzione senza build tool:

- l'elenco dei link di navigazione è l'unica fonte in `js/data.js` (`siteNav`), con href
  relativi identici su tutte le pagine;
- il markup di `<header>` e `<footer>` è copiato nelle sei pagine, con lo stesso testo e
  gli stessi `aria-label`;
- `./verify.sh` (A11) confronta i link renderizzati di ogni pagina con `siteNav` e il testo
  del footer: una pagina aggiornata e le altre no fanno fallire il test.

Il costo è accettato e misurato: sei copie di circa 30 righe, con un test che ne rileva la
divergenza.

### Font e immagini locali

- **Font**: nessun servizio di font. Titoli con stack di sistema serif (`Georgia, 'Iowan Old
  Style', 'Times New Roman', serif`); testo con stack sans di sistema (`system-ui, 'Segoe UI',
  Roboto, sans-serif`); dettagli in `ui-monospace`. Un carattere display è ammesso solo come
  file `woff2` dentro `assets/fonts/` con la licenza accanto, e la scelta va registrata nel
  `RESULT.md`.
- **Immagini**: segnaposto SVG procedurali generati dal progetto in `assets/images/`, con i
  nomi del prompt (`hero-classic-car.svg`, `flotta/<id>.svg`, `about/garage.svg`, …). Nessuna
  fotografia remota: `SHARED.md` §2 e l'asserzione A1.

### Comportamento del form

`contatti.html` ha il form di prenotazione: nome, email, telefono, data evento, tipo di
servizio, auto desiderata, messaggio. Comportamento dichiarato:

- validazione al blur e al submit; errori inline legati con `aria-describedby` e
  `aria-invalid`, riepilogo errori in `aria-live="polite"` e focus sul primo campo invalido;
- `data evento` obbligatoria e non antecedente a oggi (confronto su data locale, senza fuso
  implicito);
- `auto desiderata` è una `select` popolata da `AUTO` e il valore deve esistere nel dataset;
- il submit è `preventDefault`: nessuna richiesta di rete, nessun invio. Con dati validi si
  mostra un pannello di conferma con il riepilogo e la riga «richiesta registrata solo in
  questo browser: nessun invio»;
- la richiesta valida è salvata in `localStorage` (`retromotors:richieste:v1`, ultime 5) e
  ricompare al reload come «ultima richiesta»; storage corrotto o inaccessibile → pannello
  vuoto, nessun crash.

### Interazione caratterizzante (`M3`)

- **Galleria con lightbox**: su `flotta.html` (scheda auto) e `about.html` (galleria garage),
  con frecce, swipe touch, `Esc`, focus trap e ripristino del focus, contatore «3 di 4».
- **Parallax dell'hero** a due livelli con fallback JS, spento sotto reduced motion.
- **Transizioni di pagina**: dissolvenza d'ingresso ≤ 200 ms, disattivata sotto reduced
  motion; nessuna animazione bloccante all'uscita, perché la navigazione resta nativa.

## Milestone e task

### M0 — Bootstrap e layout (peso 10, slice)

- M0.1 Struttura a sei pagine (`index.html`, `flotta.html`, `auto.html`, `servizi.html`,
  `about.html`, `contatti.html`) con `css/main.css`, `css/utilities.css`, `js/app.js`,
  `js/scroll-animations.js`, `js/components.js`, `js/data.js`, `assets/images/`,
  `assets/fonts/`.
- M0.2 Token dei due temi: palette del prompt, spaziature, hairline, tipografia di sistema.
- M0.3 Header con `siteNav`, skip link, footer; `data-theme` e `data-motion` su `<html>`,
  tema persistito e applicato in `<head>` per evitare il FOUC.
- M0.4 Segnaposto SVG locali e layout della home (hero, anteprima flotta, servizi,
  testimonianze, CTA).

**Fatto quando:** le sei pagine si aprono da server locale senza errori in console e senza
richieste esterne, con header e footer coerenti.

### M1 — Dataset e rendering lista (peso 20, slice)

- M1.1 `js/data.js` con `AUTO`, `SERVIZI`, enum e `validateDataset()`; 8 auto come da schema.
- M1.2 `flotta.html` rende le card dal dataset (marca, modello, anno, categoria, prezzo al
  giorno formattato dal valore in centesimi, stato di disponibilità, immagine).
- M1.3 Conteggio «N vetture» calcolato dal dataset filtrato, aggiornato a ogni cambio.
- M1.4 Anteprima flotta in home: le prime tre auto disponibili lette dal dataset, non scritte
  a mano.
- M1.5 Stato di errore del dataset: validazione fallita → pannello con i problemi e nessuna
  card parziale.

**Fatto quando:** la flotta senza parametri mostra 8 card e «8 vetture», e il conteggio
coincide col numero di card in ogni combinazione di filtri.

### M2 — Dettaglio e filtri (peso 10, slice)

- M2.1 `auto.html?id=` rende l'auto dal dataset: galleria, descrizione, specifiche, prezzo, cauzione,
  pulsante «prenota questa auto» che porta al form con l'auto preselezionata.
- M2.2 `?id=` inesistente o mancante → stato «Vettura non trovata» con link alla flotta.
- M2.3 Filtri e ordinamento come da tabella, con stato letto dalla query string al
  caricamento e riscritto a ogni cambio (`history.replaceState`).
- M2.4 Stato vuoto con testo esplicito e pulsante «azzera filtri».

**Fatto quando:** un URL con filtri riproduce lo stesso sottoinsieme dopo il reload e un
`?id=` inesistente mostra lo stato «non trovata».

### M3 — Interazione caratterizzante (peso 20)

- M3.1 Lightbox con frecce, swipe touch, `Esc`, focus trap, ripristino del focus e contatore
  «n di m».
- M3.2 Parallax a due livelli con fallback JS e spegnimento sotto `prefers-reduced-motion`.
- M3.3 Transizioni di pagina ≤ 200 ms, disattivate sotto reduced motion.
- M3.4 Menu mobile con morphing SVG e fallback senza `backdrop-filter`.
- M3.5 Cursore custom solo su puntatore fine; reveal delle immagini al scroll via
  `IntersectionObserver` con `loading="lazy"` e fallback.

**Fatto quando:** la galleria si apre e si chiude da tastiera su entrambe le pagine, e con
reduced motion non resta alcuna animazione in esecuzione.

### M4 — Accessibilità (peso 15)

- M4.1 WCAG 2.1 AA sui due temi: skip link, focus visibile, target ≥ 44×44 px, landmark,
  `alt` descrittivi per le auto e `alt=""` per gli ornamenti.
- M4.2 Lightbox con semantica modale (`role="dialog"`, `aria-modal`, `aria-labelledby`).
- M4.3 Form: label associate, errori con `aria-describedby`, riepilogo in
  `aria-live="polite"`, focus sul primo invalido, stato di conferma annunciato.
- M4.4 Tabella di contrasto dei token dei due temi con i valori misurati.

**Fatto quando:** A7, A9 e A10 del §«Verify» passano nei due temi.

### M5 — Responsive (peso 15)

- M5.1 Breakpoint 375 px, 768 px, 1280 px; griglia flotta 1/2/3 colonne con container
  queries sulle card.
- M5.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio` per evitare
  spostamenti di layout.
- M5.3 Form e filtri usabili a 375 px con target ≥ 44 px.

**Fatto quando:** A12 passa a 320, 375, 768 e 1280 px.

### M6 — Verify (peso 10)

- M6.1 `package.json` con `@playwright/test` 1.65.0 e lockfile committato.
- M6.2 `playwright.config.*` con un progetto Chromium e server locale dei file statici.
- M6.3 `./verify.sh` non interattivo che esegue le asserzioni del §«Verify» ed emette
  `verify.json` con `M0`–`M6`.
- M6.4 Mapping asserzione → milestone.

**Fatto quando:** `./verify.sh` esce 0 su un progetto completo ed esce 1 con `verify.json`
coerente quando una milestone fallisce.

## Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-classic-cars/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M6`, schema 1,
`benchmark` uguale a `staticweb-classic-cars`. Solo assert su DOM e stato: nessun giudizio
visivo, nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le sei pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | la flotta senza parametri mostra «8 vetture» e 8 card; il conteggio è ricalcolato importando `js/data.js` in Node | M1 |
| A3 | ogni combinazione di filtri produce il conteggio atteso e un numero di card uguale al conteggio | M1, M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `auto.html?id=<id valido>` rende marca e modello del dataset; `?id=inesistente` mostra lo stato «non trovata» con link alla flotta | M2 |
| A6 | l'anteprima flotta in home mostra tre auto presenti nel dataset | M1 |
| A7 | submit del form con email non valida → nessuna conferma, `aria-invalid` sul campo e focus sul primo invalido; con dati validi → pannello di conferma e voce in `localStorage`; reload → «ultima richiesta» presente; storage corrotto → nessun crash | M2, M4 |
| A8 | `Esc` chiude il lightbox e il focus torna sul trigger; le frecce cambiano immagine e aggiornano il contatore | M3 |
| A9 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"` e non restano animazioni in esecuzione | M3, M4 |
| A10 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M4 |
| A11 | ogni pagina espone lo stesso insieme di link di `siteNav` e lo stesso testo di footer; una pagina divergente fallisce | M0, M5 |
| A12 | a 320, 375, 768 e 1280 px nessun overflow orizzontale e i tre flussi principali completabili | M5 |
| A13 | `verify.json` contiene esattamente `M0`–`M6` e l'exit code concorda col file | M6 |

## Fuori scope

Backend, pagamenti, disponibilità reale, mappa interattiva, invio di email, deploy e hosting.
Nessuna fotografia remota: segnaposto SVG locali.

Il contratto di verifica è un solo browser, Chromium pinnato da Playwright; Firefox e Safari
restano degradazione dichiarata (fallback senza `backdrop-filter`, senza `animation-timeline`),
non una matrice di test.
