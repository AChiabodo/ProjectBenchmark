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
| M0 | 40 | sì | Slice verticale: home, collezione filtrata e scheda orologio |
| M1 | 12 | — | Dataset unico OROLOGI con schema, enum e validateDataset() |
| M2 | 10 | — | Filtri, conteggi e stato nella query string |
| M3 | 12 | — | Interazione caratterizzante: orologio analogico e ombre dinamiche |
| M4 | 8 | — | Stati vuoto, errore e non valido |
| M5 | 8 | — | Accessibilità, reduced motion e contrasto |
| M6 | 5 | — | Responsive sui breakpoint dichiarati |
| M7 | 5 | — | Verify: Playwright pinnato e verify.json |

La vertical slice vale 40 punti su 100 (`M0`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito.

# StaticWeb — Orologi d'epoca

## Slice verticale

Home, collezione filtrata e scheda orologio, tutte sullo stesso dataset locale:

```text
index.html ──▶ collezione.html?epoca=…&movimento=…&prezzo=…&ordina=…
                      │
                      └──▶ orologio.html?id=<id del dataset>
```

Il prompt non elenca una pagina per il singolo orologio, ma la slice ne richiede una: il Plan
aggiunge `orologio.html?id=` come sesta pagina e lo dichiara qui. La slice è completa quando
la home mostra i pezzi in evidenza e l'orologio dell'hero, la collezione filtra e dichiara il
conteggio, e la scheda rende l'orologio richiesto o lo stato «Orologio non trovato». Gli
stati vuoto, errore e non valido sono pesati in `M4`.

## Convenzione condivisa

`benchmarks/staticweb/SHARED.md` è vincolante e non si ripete qui: modulo dati unico con
schema validato, nessun asset remoto, DoD comune, verifica Playwright su DOM e stato.

## Decisioni di sito

### Dataset: orologi

`js/data.js` esporta `OROLOGI`, `EPOCHE`, `MOVIMENTI`, `validateDataset()` e la funzione
`epocaDi(anno)` che deriva l'epoca dall'anno.

| campo | tipo | dominio |
|---|---|---|
| `id` | stringa | slug univoco, usato in `?id=` |
| `nome` | stringa | obbligatorio |
| `referenza` | stringa | obbligatoria, formato `NNNN-NN` |
| `manifattura` | stringa | obbligatoria |
| `anno` | intero | 1890–1990 |
| `movimento` | stringa | `MOVIMENTI`: `carica-manuale`, `automatico`, `quarzo` |
| `calibro` | stringa | obbligatorio (es. «Valjoux 72») |
| `diametroMm` | numero | 26–48 |
| `materialeCassa` | stringa | `MATERIALI`: `acciaio`, `oro-giallo`, `oro-rosa`, `ottone`, `platino` |
| `prezzoCentesimi` | intero | > 0 |
| `descrizione` | stringa | obbligatoria, 80–600 caratteri |
| `immagini` | array di stringhe | 2–4 percorsi dentro `assets/images/collection/` |

`epoca` **non è un campo**: si deriva dall'anno con `epocaDi()` — `1890-1940`, `1940-1970`,
`1970-1990` — così un filtro non può contraddire l'anno mostrato. Il dataset contiene 10
orologi, almeno due per epoca, tutti i movimenti rappresentati, almeno un quarzo e almeno un
orologio per ogni materiale di cassa. `validateDataset()` rifiuta id duplicati, anni fuori
intervallo, referenze fuori formato, diametri fuori intervallo e `immagini` vuoto.

### Filtri, conteggio e query string

Su `collezione.html`, con stato nella query string (ricaricabile e condivisibile):

| parametro | valore | default |
|---|---|---|
| `epoca` | `1890-1940`, `1940-1970`, `1970-1990` | assente = tutte |
| `movimento` | uno dei valori di `MOVIMENTI` | assente = tutti |
| `prezzo` | `fino-2000`, `2000-8000`, `oltre-8000` (euro) | assente = tutte |
| `ordina` | `anno`, `prezzo-crescente`, `prezzo-decrescente` | `anno` |

Il conteggio «N orologi» è calcolato dal dataset filtrato e confrontato dal test col numero di
card. Un parametro fuori dominio viene ignorato e riportato allo stato «tutti». Filtro senza
risultati → stato vuoto esplicito con pulsante «azzera filtri». I risultati sono annunciati in
una regione `aria-live="polite"` con debounce ≥ 300 ms, non a ogni battitura.

### Palette scura e criteri di contrasto

Due temi con token dichiarati; i valori sotto sono misurati con la formula WCAG sul rapporto
di contrasto, e A11 li ricalcola dai colori risolti da `getComputedStyle`, così la tabella non
può divergere dal CSS.

| token | chiaro | scuro |
|---|---|---|
| sfondo | `#F6F4EF` (avorio) | `#1C1A18` |
| superficie | `#EAE6DC` (greige) | `#24211E` |
| testo | `#2B2825` (inchiostro, ≈13,3:1 su avorio) | `#F0EDE6` (≈14,8:1 su scuro) |
| testo secondario | `#6E675F` (taupe, ≈5,1:1) | `#B9B2A6` (≈8,2:1) |
| accento ottone | `#A88F63` (≈2,8:1 su avorio) | `#C9A96A` (≈7,7:1) |
| ottone per testo e focus | `#7A6438` (≈5,0:1 su avorio) | `#C9A96A` |

Criteri vincolanti:

- testo ≥ 4,5:1, testo grande (≥ 24 px, o ≥ 19 px in grassetto) e bordi informativi ≥ 3:1, in
  entrambi i temi;
- `#A88F63` misura ≈2,8:1 sull'avorio, quindi **non** è ammesso per testo, icone informative,
  bordi informativi o anello di focus: resta decorazione (hairline, lancette ornamentali,
  riempimenti). Per testo e focus su chiaro si usa `#7A6438`;
- il tema scuro non è un'inversione automatica: la palette è dichiarata token per token, e
  l'ottone resta l'unico accento;
- l'anello di focus ha contrasto ≥ 3:1 sia contro il proprio sfondo sia contro la superficie
  adiacente, nei due temi.

### Smooth scroll: rimosso

Il prompt chiede uno smooth scroll custom con lerp. È **rimosso**, non reso opt-in: intercetta
rotella, `PgUp`/`PgDn`, barra spazi e ancora del focus, e non porta informazione. Restano:

- scorrimento nativo, con `scroll-behavior: smooth` applicato solo dentro
  `@media (prefers-reduced-motion: no-preference)` e solo per i link ancora interni;
- con `prefers-reduced-motion: reduce` `scroll-behavior` vale `auto`, e il test lo asserisce.

### Ombre dinamiche: costo limitato e fallback dichiarato

- Le ombre si calcolano **solo** con `(hover: hover) and (pointer: fine)` e
  `prefers-reduced-motion: no-preference`; altrimenti `<html>` ha `data-shadows="static"` e le
  card usano l'ombra statica a due livelli dei token;
- con puntatore fine `<html>` ha `data-shadows="dynamic"`; un solo listener `pointermove`
  coalescato in un frame `requestAnimationFrame`, aggiornamento solo se il puntatore si è
  spostato ≥ 2 px, solo per le card visibili (`IntersectionObserver`) e al massimo 6;
- l'aggiornamento scrive solo custom properties (`--shadow-x`, `--shadow-y`,
  `--shadow-alpha`) con lerp; nessuna lettura di layout nel frame, nessun `box-shadow`
  ricalcolato in JavaScript;
- il ciclo si ferma quando il delta è < 0,1 o dopo 300 ms di inattività: nessun rAF perpetuo;
- su touch, con reduced motion o con `hardwareConcurrency ≤ 4` la variante è quella statica,
  dichiarata e verificata (A9).

### Orologio analogico e sincronizzazione testabile

- Quadrante SVG nell'hero e nel footer, con lancette ore, minuti e secondi; `js/clock.js`
  espone `now()` come **unica** sorgente di tempo e riusa lo stesso valore per tutte le
  istanze;
- `?now=<ISO 8601>` sostituisce la sorgente: è l'aggancio di test, e non ha altri effetti;
- ogni lancetta espone `data-angle` (gradi, un decimale) oltre alla `transform`, così il test
  asserisce un numero invece di interpretare una matrice;
- formule dichiarate: `ore = ((h % 12) + m/60 + s/3600) × 30`, `minuti = (m + s/60) × 6`,
  `secondi = s × 6` (+ `ms × 0,006` solo con secondi fluidi);
- esempio verificato: `?now=2026-03-01T10:09:30+01:00` con `timezoneId: 'Europe/Rome'` →
  ore 304,5°, minuti 57,0°, secondi 180,0°;
- il quadrante espone anche `data-timestamp` (ms epoch usati per il disegno): senza override
  deve restare entro 100 ms da `Date.now()` della pagina;
- i secondi sono fluidi solo senza reduced motion; con la preferenza attiva avanzano a scatti
  di un secondo e `data-motion="reduced"` lo dichiara.

### Persistenza

| chiave | contenuto | difesa |
|---|---|---|
| `tempo:tema:v1` | `chiaro` o `scuro` | valore inatteso → default da `prefers-color-scheme` |
| `tempo:richieste:v1` | ultime 5 richieste di appuntamento validate | JSON corrotto o voce malformata → voce scartata, avviso visibile |

Il form di `contatti.html` (nome, email, telefono, tipo di servizio, modello o referenza, data
desiderata, messaggio) valida al blur e al submit, lega gli errori con `aria-describedby` e
`aria-invalid`, porta il focus sul primo campo invalido, non invia nulla (`preventDefault`,
nessuna richiesta di rete) e mostra un pannello di conferma con il riepilogo e la riga
«richiesta registrata solo in questo browser». Dopo il reload il form mostra l'ultima
richiesta salvata.

## Milestone e task

### M0 — Slice verticale: home, collezione filtrata e scheda orologio (peso 40, slice)

- M0.1 Struttura a sei pagine (`index.html`, `collezione.html`, `orologio.html`,
  `artigianato.html`, `storia.html`, `contatti.html`) con `css/main.css`,
  `css/utilities.css`, `js/data.js`, `js/app.js`, `js/clock.js`, `js/scroll-animations.js`,
  `js/components.js`, `assets/images/`.
- M0.2 Token dei due temi come da tabella, hairline da 1 px, tipografia di sistema e
  monospace per le specifiche; `data-theme` applicato in `<head>` senza FOUC.
- M0.3 Header con `siteNav`, skip link, footer con il secondo orologio; `data-motion` e
  `data-shadows` su `<html>`.
- M0.4 `js/clock.js` con sorgente iniettabile e override `?now=`.
- M0.5 `js/data.js` con `OROLOGI` e 10 orologi; `collezione.html` rende le card dal dataset
  (nome, manifattura, anno, epoca derivata, movimento, prezzo formattato dal valore in
  centesimi, immagine).
- M0.6 Home: pezzi in evidenza e anteprima atelier letti dal dataset.
- M0.7 `orologio.html?id=` rende l'orologio dal dataset: galleria con lightbox, specifiche
  (referenza, calibro, diametro, materiale), descrizione, prezzo.
- M0.8 Filtro per epoca letto da `?epoca=` con conteggio «N orologi»: tanto basta a chiudere
  la slice, mentre il contratto completo dei filtri è `M2`.

**Fatto quando:** le sei pagine si aprono da server locale senza errori in console e senza
richieste esterne, il quadrante del footer mostra un'ora coerente con `data-timestamp`, la
collezione senza parametri mostra 10 card e «10 orologi», e `orologio.html?id=<id valido>`
rende nome e referenza del dataset.

**Verifica:** A1, A2 e A5 del §«Verify».

### M1 — Dataset unico OROLOGI con schema, enum e validateDataset() (peso 12)

- M1.1 `js/data.js` esporta `OROLOGI`, gli enum `EPOCHE` e `MOVIMENTI`, `epocaDi()`,
  `validateDataset()` e lo schema del §«Dataset: orologi» (campo, tipo, dominio).
- M1.2 `validateDataset()` rifiuta id duplicati, anni fuori dall'intervallo 1890–1990,
  referenze fuori dal formato `NNNN-NN`, diametri fuori da 26–48 mm e `immagini` vuoto o
  fuori da 2–4 percorsi, e restituisce la lista dei problemi invece di lanciare un'eccezione.
- M1.3 Il dataset contiene 10 orologi, almeno due per epoca, tutti i movimenti rappresentati,
  almeno un quarzo e almeno un orologio per ogni materiale di cassa.
- M1.4 `epoca` non è un campo: si deriva dall'anno con `epocaDi()`, così un filtro non può
  contraddire l'anno mostrato.

**Fatto quando:** un dataset manomesso produce la lista dei problemi attesi e un test Node che
importa `js/data.js` conta 10 orologi e verifica che `epocaDi(anno)` restituisca l'epoca
dichiarata.

**Verifica:** A2 del §«Verify» (conteggio ricalcolato importando `js/data.js`) e A6 per il
pannello di errore.

### M2 — Filtri, conteggi e stato nella query string (peso 10)

- M2.1 Filtri e ordinamento come da tabella del §«Filtri, conteggio e query string»:
  `epoca`, `movimento`, `prezzo`, `ordina`.
- M2.2 Stato letto dalla query string al caricamento e riscritto a ogni cambio con
  `history.replaceState`: l'URL resta ricaricabile e condivisibile.
- M2.3 Conteggio «N orologi» calcolato dal dataset filtrato e sempre uguale al numero di
  card.
- M2.4 Valore di parametro fuori dominio ignorato e riportato allo stato «tutti», senza
  errore.

**Fatto quando:** ogni combinazione di filtri produce il conteggio atteso con un numero di
card uguale al conteggio, l'epoca mostrata coincide con `epocaDi(anno)` e un URL filtrato
ricarica lo stesso sottoinsieme.

**Verifica:** A3 e A4 del §«Verify».

### M3 — Interazione caratterizzante: orologio analogico e ombre dinamiche (peso 12)

- M3.1 Orologio analogico: `data-angle` sulle tre lancette, formule dichiarate, secondi
  fluidi solo senza reduced motion, stessa sorgente di tempo per hero e footer.
- M3.2 Ombre dinamiche con costo limitato come da §«Ombre dinamiche» e fallback statico su
  touch, reduced motion e CPU limitata.
- M3.3 Lightbox della galleria con frecce, swipe touch, `Esc`, focus trap e ripristino del
  focus.
- M3.4 Parallax a due livelli e text reveal riga per riga, entrambi spenti sotto reduced
  motion.
- M3.5 Bottoni magnetici solo su puntatore fine; nessun effetto su touch.

**Fatto quando:** con `?now=` fissato le tre lancette hanno gli angoli attesi, e su un
contesto touch `data-shadows="static"` con ombra invariata nel tempo.

**Verifica:** A7, A8 e A9 del §«Verify».

### M4 — Stati vuoto, errore e non valido (peso 8)

- M4.1 `validateDataset()` fallito → pannello di errore con la lista dei problemi e nessuna
  card parziale.
- M4.2 Filtro senza risultati → stato vuoto con testo esplicito e pulsante «azzera filtri»
  che riporta alla collezione completa.
- M4.3 `?id=` inesistente o mancante → stato «Orologio non trovato» con link alla collezione.
- M4.4 Form: campi invalidi con `aria-invalid` e messaggio legato da `aria-describedby`,
  focus sul primo invalido; richiesta valida salvata in `tempo:richieste:v1` (ultime 5) e
  storage corrotto o voce malformata → voce scartata con avviso visibile, nessun crash.

**Fatto quando:** dataset manomesso, filtro senza risultati, `?id=` inesistente e submit con
email non valida producono gli stati dichiarati, ognuno con la sua via d'uscita, e uno storage
corrotto non produce eccezioni.

**Verifica:** A6 e A12 del §«Verify».

### M5 — Accessibilità, reduced motion e contrasto (peso 8)

- M5.1 WCAG 2.1 AA sui due temi: skip link, focus visibile in ottone scuro, target ≥ 44×44 px,
  landmark, `alt` descrittivi per gli orologi e `alt=""` per gli ornamenti.
- M5.2 L'orologio è decorativo per gli screen reader (`aria-hidden` sul quadrante) e l'ora è
  disponibile come testo in `<time datetime>`: nessun annuncio al secondo.
- M5.3 Lightbox e pannelli con semantica modale, focus trap, `Esc` e ripristino del focus;
  risultati dei filtri annunciati con debounce ≥ 300 ms, non a ogni battitura.
- M5.4 Reduced motion: `data-motion="reduced"`, `data-shadows="static"`, nessuna animazione e
  `scroll-behavior: auto`.
- M5.5 Tabella di contrasto del §«Palette scura» con i valori misurati, e divieto verificato
  di usare `#A88F63` per testo o bordi informativi.

**Fatto quando:** tutte le asserzioni di contrasto e di semantica del §«Verify» passano nei
due temi e il percorso da tastiera copre header, filtri, collezione, scheda e form.

**Verifica:** A10, A11 e A12 del §«Verify».

### M6 — Responsive sui breakpoint dichiarati (peso 5)

- M6.1 Breakpoint 375 px, 768 px, 1280 px; griglia collezione 1/2/3 colonne con container
  queries.
- M6.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio`.
- M6.3 Il quadrante scala senza deformarsi (`viewBox` e `preserveAspectRatio`); filtri, form e
  lightbox usabili a 375 px con target ≥ 44 px.

**Fatto quando:** A13 passa a 320, 375, 768 e 1280 px.

**Verifica:** A13 del §«Verify».

### M7 — Verify: Playwright pinnato e verify.json (peso 5)

- M7.1 `package.json` con `@playwright/test` 1.65.0 e lockfile committato.
- M7.2 `playwright.config.*` con un progetto Chromium, `timezoneId: 'Europe/Rome'` e server
  locale dei file statici.
- M7.3 `./verify.sh` non interattivo che esegue le asserzioni del §«Verify» ed emette
  `verify.json` con `M0`–`M7`.
- M7.4 Mapping asserzione → milestone.

**Fatto quando:** `./verify.sh` esce 0 su un progetto completo ed esce 1 con `verify.json`
coerente quando una milestone fallisce.

**Verifica:** A14 del §«Verify».

## Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-watches/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M7`, schema 1,
`benchmark` uguale a `staticweb-watches`. Solo assert su DOM e stato: nessun giudizio visivo,
nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le sei pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | la collezione senza parametri mostra «10 orologi» e 10 card; il conteggio è ricalcolato importando `js/data.js` in Node | M0, M2 |
| A3 | ogni combinazione di filtri e ordinamento produce il conteggio atteso e un numero di card uguale al conteggio; l'epoca mostrata coincide con `epocaDi(anno)` | M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `orologio.html?id=<id valido>` rende nome e referenza del dataset | M0 |
| A6 | dataset manomesso → pannello di errore con la lista dei problemi e nessuna card parziale; filtro senza risultati → stato vuoto con pulsante «azzera filtri»; `?id=` inesistente → stato «Orologio non trovato» con link alla collezione | M4 |
| A7 | con `?now=2026-03-01T10:09:30+01:00` e `timezoneId: 'Europe/Rome'` le lancette hanno `data-angle` 304,5 / 57,0 / 180,0 (± 1°); senza override `data-timestamp` resta entro 100 ms da `Date.now()` | M3 |
| A8 | dopo 2 s la lancetta dei secondi è avanzata di 12° (± 1°) e il quadrante del footer mostra lo stesso angolo dell'hero | M3 |
| A9 | contesto con `hasTouch: true` → `data-shadows="static"` e `box-shadow` di una card invariato dopo 1 s; contesto con puntatore fine → `data-shadows="dynamic"` e ombra che cambia dopo un movimento del puntatore | M3 |
| A10 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"`, `data-shadows="static"`, nessuna animazione in esecuzione e `scroll-behavior: auto` | M5 |
| A11 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi; nessun testo risolve a `#A88F63` su avorio | M5 |
| A12 | submit del form con email non valida → nessuna conferma, `aria-invalid` e focus sul primo invalido; con dati validi → conferma e voce in `tempo:richieste:v1`; reload → «ultima richiesta» presente; storage corrotto → nessun crash | M4, M5 |
| A13 | a 320, 375, 768 e 1280 px nessun overflow orizzontale e il quadrante mantiene le proporzioni | M6 |
| A14 | `verify.json` contiene esattamente `M0`–`M7` e l'exit code concorda col file | M7 |

## Fuori scope

Backend, valutazioni reali, pagamenti, mappa interattiva, invio di email, deploy e hosting.
Nessuna fotografia remota: segnaposto SVG locali. Il contratto di verifica è un solo browser,
Chromium pinnato da Playwright.
