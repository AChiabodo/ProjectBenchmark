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
| M0 | 40 | sì | Slice verticale: home, flotta filtrata e scheda auto |
| M1 | 12 | — | Dataset unico AUTO con schema, enum e validateDataset() |
| M2 | 10 | — | Filtri, conteggi e stato nella query string |
| M3 | 12 | — | Interazione caratterizzante: galleria con lightbox e parallax |
| M4 | 8 | — | Stati vuoto, errore e non valido |
| M5 | 8 | — | Accessibilità, reduced motion e contrasto |
| M6 | 5 | — | Responsive sui breakpoint dichiarati |
| M7 | 5 | — | Verify: Playwright pinnato e verify.json |

La vertical slice vale 40 punti su 100 (`M0`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito.

# StaticWeb — Auto d'epoca (noleggio)

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
trovata». Gli stati vuoto, errore e non valido sono pesati in `M4`.

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
- `./verify.sh` (A12) confronta i link renderizzati di ogni pagina con `siteNav` e il testo
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

### M0 — Slice verticale: home, flotta filtrata e scheda auto (peso 40, slice)

- M0.1 Struttura a sei pagine (`index.html`, `flotta.html`, `auto.html`, `servizi.html`,
  `about.html`, `contatti.html`) con `css/main.css`, `css/utilities.css`, `js/app.js`,
  `js/scroll-animations.js`, `js/components.js`, `js/data.js`, `assets/images/`,
  `assets/fonts/`.
- M0.2 Token dei due temi: palette del prompt, spaziature, hairline, tipografia di sistema.
- M0.3 Header con `siteNav`, skip link, footer; `data-theme` e `data-motion` su `<html>`,
  tema persistito e applicato in `<head>` per evitare il FOUC.
- M0.4 Segnaposto SVG locali e layout della home (hero, anteprima flotta, servizi,
  testimonianze, CTA).
- M0.5 `js/data.js` con `AUTO` e 8 auto; `flotta.html` rende le card dal dataset (marca,
  modello, anno, categoria, prezzo al giorno formattato dal valore in centesimi, stato di
  disponibilità, immagine).
- M0.6 Anteprima flotta in home: le prime tre auto disponibili lette dal dataset, non scritte
  a mano.
- M0.7 `auto.html?id=` rende l'auto dal dataset: galleria, descrizione, specifiche, prezzo,
  cauzione, pulsante «prenota questa auto» che porta al form con l'auto preselezionata.
- M0.8 Filtro per categoria letto da `?categoria=` con conteggio «N vetture»: tanto basta a
  chiudere la slice, mentre il contratto completo dei filtri è `M2`.

**Fatto quando:** le sei pagine si aprono da server locale senza errori in console e senza
richieste esterne, con header e footer coerenti; la flotta senza parametri mostra 8 card e
«8 vetture»; `auto.html?id=<id valido>` rende l'auto del dataset.

**Verifica:** A1, A2, A5, A6 e A12 del §«Verify».

### M1 — Dataset unico AUTO con schema, enum e validateDataset() (peso 12)

- M1.1 `js/data.js` esporta `AUTO`, gli enum `CATEGORIE`, `TRASMISSIONI`, `COLORI`, la tabella
  `SERVIZI` usata anche dal form e lo schema del §«Dataset: flotta» (campo, tipo, dominio).
- M1.2 `validateDataset()` rifiuta id duplicati, anni fuori dall'intervallo 1948–1979,
  cauzione inferiore al prezzo/giorno, `immagini` vuoto o fuori da 2–4 percorsi, e restituisce
  la lista dei problemi invece di lanciare un'eccezione.
- M1.3 Il dataset contiene 8 auto, almeno una per categoria, almeno due cabrio e almeno una
  non disponibile.
- M1.4 Nessun dato scritto a mano nel markup: marca, modello, prezzo e conteggi vengono dal
  modulo.

**Fatto quando:** un dataset manomesso produce la lista dei problemi attesi e un test Node che
importa `js/data.js` conta 8 auto e verifica che ogni valore appartenga al suo enum.

**Verifica:** A2 del §«Verify» (conteggio ricalcolato importando `js/data.js`) e A7 per il
pannello di errore.

### M2 — Filtri, conteggi e stato nella query string (peso 10)

- M2.1 Filtri e ordinamento come da tabella del §«Filtri, conteggio e query string»:
  `categoria`, `anno`, `prezzo`, `disponibilita`, `ordina`.
- M2.2 Stato letto dalla query string al caricamento e riscritto a ogni cambio con
  `history.replaceState`: l'URL resta ricaricabile e condivisibile.
- M2.3 Conteggio «N vetture» calcolato dal dataset filtrato, non dal DOM, e sempre uguale al
  numero di card renderizzate.
- M2.4 Valore di parametro fuori dominio ignorato e riportato allo stato «tutti», senza
  errore.

**Fatto quando:** ogni combinazione di filtri produce il conteggio atteso con un numero di
card uguale al conteggio, e un URL filtrato ricarica lo stesso sottoinsieme.

**Verifica:** A3 e A4 del §«Verify».

### M3 — Interazione caratterizzante: galleria con lightbox e parallax (peso 12)

- M3.1 Lightbox con frecce, swipe touch, `Esc`, focus trap, ripristino del focus e contatore
  «n di m».
- M3.2 Parallax a due livelli con fallback JS e spegnimento sotto `prefers-reduced-motion`.
- M3.3 Transizioni di pagina ≤ 200 ms, disattivate sotto reduced motion.
- M3.4 Menu mobile con morphing SVG e fallback senza `backdrop-filter`.
- M3.5 Cursore custom solo su puntatore fine; reveal delle immagini al scroll via
  `IntersectionObserver` con `loading="lazy"` e fallback.

**Fatto quando:** la galleria si apre e si chiude da tastiera su entrambe le pagine, e con
reduced motion non resta alcuna animazione in esecuzione.

**Verifica:** A9 del §«Verify».

### M4 — Stati vuoto, errore e non valido (peso 8)

- M4.1 `validateDataset()` fallito → pannello di errore con la lista dei problemi e nessuna
  card parziale.
- M4.2 Filtro senza risultati → stato vuoto con testo esplicito e pulsante «azzera filtri»
  che riporta alla flotta completa.
- M4.3 `?id=` inesistente o mancante → stato «Vettura non trovata» con link alla flotta.
- M4.4 Form: campi invalidi con `aria-invalid` e messaggio legato da `aria-describedby`,
  riepilogo in `aria-live="polite"` e focus sul primo campo invalido; richiesta valida salvata
  in `retromotors:richieste:v1` (ultime 5) e storage corrotto o inaccessibile → pannello
  vuoto, nessun crash.

**Fatto quando:** dataset manomesso, filtro senza risultati, `?id=` inesistente e submit con
email non valida producono gli stati dichiarati, ognuno con la sua via d'uscita, e uno storage
corrotto non produce eccezioni.

**Verifica:** A7 e A8 del §«Verify».

### M5 — Accessibilità, reduced motion e contrasto (peso 8)

- M5.1 WCAG 2.1 AA sui due temi: skip link, focus visibile, target ≥ 44×44 px, landmark,
  `alt` descrittivi per le auto e `alt=""` per gli ornamenti.
- M5.2 Lightbox con semantica modale (`role="dialog"`, `aria-modal`, `aria-labelledby`).
- M5.3 Form: label associate, errori con `aria-describedby`, riepilogo in
  `aria-live="polite"`, focus sul primo invalido, stato di conferma annunciato.
- M5.4 Reduced motion: `data-motion="reduced"` su `<html>`, parallax e transizioni spente.
- M5.5 Tabella di contrasto dei token dei due temi con i valori misurati.

**Fatto quando:** tutte le asserzioni di contrasto del §«Verify» passano nei due temi e il
percorso da tastiera copre header, filtri, card, dettaglio e form.

**Verifica:** A8, A10 e A11 del §«Verify».

### M6 — Responsive sui breakpoint dichiarati (peso 5)

- M6.1 Breakpoint 375 px, 768 px, 1280 px; griglia flotta 1/2/3 colonne con container
  queries sulle card.
- M6.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio` per evitare
  spostamenti di layout.
- M6.3 Form e filtri usabili a 375 px con target ≥ 44 px.

**Fatto quando:** A13 passa a 320, 375, 768 e 1280 px.

**Verifica:** A12 e A13 del §«Verify».

### M7 — Verify: Playwright pinnato e verify.json (peso 5)

- M7.1 `package.json` con `@playwright/test` 1.65.0 e lockfile committato.
- M7.2 `playwright.config.*` con un progetto Chromium e server locale dei file statici.
- M7.3 `./verify.sh` non interattivo che esegue le asserzioni del §«Verify» ed emette
  `verify.json` con `M0`–`M7`.
- M7.4 Mapping asserzione → milestone.

**Fatto quando:** `./verify.sh` esce 0 su un progetto completo ed esce 1 con `verify.json`
coerente quando una milestone fallisce.

**Verifica:** A14 del §«Verify».

## Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-classic-cars/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M7`, schema 1,
`benchmark` uguale a `staticweb-classic-cars`. Solo assert su DOM e stato: nessun giudizio
visivo, nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le sei pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | la flotta senza parametri mostra «8 vetture» e 8 card; il conteggio è ricalcolato importando `js/data.js` in Node | M0, M2 |
| A3 | ogni combinazione di filtri produce il conteggio atteso e un numero di card uguale al conteggio | M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `auto.html?id=<id valido>` rende marca e modello del dataset | M0 |
| A6 | l'anteprima flotta in home mostra tre auto presenti nel dataset | M0 |
| A7 | dataset manomesso → pannello di errore con la lista dei problemi e nessuna card parziale; filtro senza risultati → stato vuoto con pulsante «azzera filtri»; `?id=` inesistente → stato «Vettura non trovata» con link alla flotta | M4 |
| A8 | submit del form con email non valida → nessuna conferma, `aria-invalid` sul campo e focus sul primo invalido; con dati validi → pannello di conferma e voce in `localStorage`; reload → «ultima richiesta» presente; storage corrotto → nessun crash | M4, M5 |
| A9 | `Esc` chiude il lightbox e il focus torna sul trigger; le frecce cambiano immagine e aggiornano il contatore | M3 |
| A10 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"` e non restano animazioni in esecuzione | M5 |
| A11 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M5 |
| A12 | ogni pagina espone lo stesso insieme di link di `siteNav` e lo stesso testo di footer; una pagina divergente fallisce | M0, M6 |
| A13 | a 320, 375, 768 e 1280 px nessun overflow orizzontale e i tre flussi principali completabili | M6 |
| A14 | `verify.json` contiene esattamente `M0`–`M7` e l'exit code concorda col file | M7 |

## Fuori scope

Backend, pagamenti, disponibilità reale, mappa interattiva, invio di email, deploy e hosting.
Nessuna fotografia remota: segnaposto SVG locali.

Il contratto di verifica è un solo browser, Chromium pinnato da Playwright; Firefox e Safari
restano degradazione dichiarata (fallback senza `backdrop-filter`, senza `animation-timeline`),
non una matrice di test.
