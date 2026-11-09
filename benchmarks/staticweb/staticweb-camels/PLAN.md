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
| M0 | 40 | sì | Slice verticale: home, catalogo filtrato e pagina prodotto |
| M1 | 12 | — | Dataset unico PRODOTTI con schema, enum e validateDataset() |
| M2 | 10 | — | Filtri, conteggi e stato nella query string |
| M3 | 12 | — | Interazione caratterizzante: lightbox prodotto, parallax e carrello locale |
| M4 | 8 | — | Stati vuoto, errore e non valido |
| M5 | 8 | — | Accessibilità, reduced motion e contrasto |
| M6 | 5 | — | Responsive sui breakpoint dichiarati |
| M7 | 5 | — | Verify: Playwright pinnato e verify.json |

La vertical slice vale 40 punti su 100 (`M0`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito. Le milestone
`M1`–`M7` sono contenuto oltre la slice e si valutano solo dopo.

# StaticWeb — Cammelli (e-commerce vetrina)

## Slice verticale

Home, catalogo filtrato e una pagina dettaglio, tutte sullo stesso dataset locale:

```text
index.html ──▶ catalogo.html?collezione=…&eta=…&prezzo=…&colore=…
                        │
                        └──▶ prodotto.html?id=<id del dataset>
```

La slice è completa quando: la home mostra i prodotti in evidenza letti dal dataset; il
catalogo filtra, dichiara il conteggio e regge lo stato vuoto; la pagina dettaglio rende il
prodotto richiesto per `?id=` e gestisce l'id inesistente. Gli stati vuoto, errore e non
trovato sono pesati in `M4`. Nessuna delle tre pagine contiene dati di prodotto scritti a
mano nel markup.

## Convenzione condivisa

`benchmarks/staticweb/SHARED.md` è vincolante e non si ripete qui: modulo dati unico con
schema validato, nessun asset remoto, DoD comune, verifica Playwright su DOM e stato. Questo
Plan dichiara solo ciò che è proprio dei cammelli.

## Decisioni di sito

### E-commerce risolto: vetrina con carrello locale, senza checkout

Il prompt dichiara un e-commerce e cita la «validazione form real-time (checkout/newsletter)»,
ma non esiste una pagina di checkout, un pagamento o un ordine. Questo benchmark è una
**vetrina con carrello locale e senza checkout**, e ogni promessa di validazione del
checkout è rimossa:

- nessuna pagina, sezione, form o messaggio di checkout;
- il carrello è locale: aggiunta, quantità, rimozione, totale; persiste in `localStorage`;
- nessun ordine viene inviato e nessun pagamento esiste: il pannello carrello lo dichiara
  con una riga visibile («dimostrazione: nessun ordine viene inviato»);
- l'unico form del sito è la newsletter in footer, con validazione real-time e stato di
  successo locale.

### Dataset: prodotti

`js/data.js` esporta `PRODOTTI`, gli enum dei campi filtrabili e `validateDataset()`.

| campo | tipo | dominio |
|---|---|---|
| `id` | stringa | slug univoco, usato in `?id=` |
| `nome` | stringa | obbligatorio |
| `collezione` | stringa | `COLLEZIONI`: `dormire`, `avventura`, `abbraccio`, `prima-infanzia` |
| `etaMin` | intero | 0–6 (anni consigliati) |
| `prezzoCentesimi` | intero | > 0 |
| `materiale` | stringa | `MATERIALI`: `velluto`, `cotone-organico`, `lana-merino` |
| `altezzaCm` | intero | 15–60 |
| `colori` | array di stringhe | sottoinsieme di `COLORI`: `corallo`, `menta`, `pesca`, `verde-pastello` |
| `descrizione` | stringa | obbligatoria, 40–400 caratteri |
| `badge` | stringa o `null` | `BADGE`: `novita`, `piu-amato`, `offerta` |
| `disponibile` | booleano | — |
| `immagine` | stringa | percorso dentro `assets/images/` |

Il dataset contiene 12 prodotti, distribuiti su tutte le collezioni e tutti i materiali, con
almeno un prodotto per ogni fascia d'età e almeno un `badge: null`. `validateDataset()`
rifiuta id duplicati, enum fuori dominio, prezzi non interi e `colori` vuoti.

### Filtri, conteggio e query string

Su `catalogo.html` i filtri sono quattro gruppi più un ordinamento, e il loro stato vive
nella query string (ricaricabile e condivisibile):

| parametro | valore | default |
|---|---|---|
| `collezione` | uno dei valori di `COLLEZIONI` | assente = tutte |
| `eta` | `0-2`, `3-5`, `6+` | assente = tutte |
| `prezzo` | `fino-25`, `25-40`, `oltre-40` (euro) | assente = tutte |
| `colore` | uno dei valori di `COLORI` | assente = tutti |
| `ordina` | `nome`, `prezzo-crescente`, `prezzo-decrescente` | `nome` |

Il conteggio «N risultati» è calcolato dal dataset filtrato, non dal DOM, e confrontato dal
test col numero di card renderizzate. Un valore di parametro fuori dominio viene ignorato e
riportato allo stato «tutti», senza errore. Filtro senza risultati → stato vuoto con testo
esplicito e pulsante «azzera filtri» che riporta al catalogo completo.

### Persistenza

| chiave | contenuto | difesa |
|---|---|---|
| `cammelli:cart:v1` | righe `{id, quantita}`; il prezzo si rilegge dal dataset | JSON corrotto o id inesistente → riga scartata, avviso visibile |
| `cammelli:theme:v1` | `day` o `night` | valore inatteso → default da `prefers-color-scheme` |

Il tema «Giorno/Notte» è applicato con `data-theme` su `<html>`, con script inline in `<head>`
per evitare il FOUC; al primo accesso segue `prefers-color-scheme`. La newsletter non
persiste nulla: mostra solo lo stato di successo.

### Header, footer e pagine

Tre pagine: `index.html`, `catalogo.html`, `prodotto.html`. L'elenco dei link di navigazione
è l'unica fonte in `js/data.js` (`siteNav`); il markup di header e footer è **duplicato
staticamente** nelle tre pagine — scelta dichiarata, senza build tool — e `./verify.sh`
confronta i link di ogni pagina con `siteNav`, così una pagina aggiornata e le altre no
fanno fallire il test invece di passare inosservate.

### Interazione caratterizzante (`M3`)

- **Lightbox prodotto**: dialogo modale con zoom sull'illustrazione, navigazione con frecce
  e `Esc`, focus trap e ripristino del focus sul trigger, `role="dialog"` e
  `aria-modal="true"`, `aria-labelledby` sul titolo.
- **Parallax multiclivello**: nuvole, stelle e colline su tre profondità, CSS con fallback JS;
  con `prefers-reduced-motion: reduce` il parallax si spegne e resta uno sfondo statico.
- **Carrello locale**: drawer con aggiunta, quantità, rimozione e totale, feedback immediato
  sull'aggiunta, contatore nel header annunciato con `aria-live="polite"` e non a ogni
  frame.
- **Menu mobile**: icona SVG con morphing e `backdrop-filter`, con fallback senza filtro.
- **Cursore custom**: solo su `(hover: hover) and (pointer: fine)`, disattivato su touch.

## Milestone e task

### M0 — Slice verticale: home, catalogo filtrato e pagina prodotto (peso 40, slice)

- M0.1 Struttura: `index.html`, `catalogo.html`, `prodotto.html`, `css/main.css`,
  `css/utilities.css`, `js/app.js`, `js/scroll-animations.js`, `js/components.js`,
  `js/data.js`, `assets/images/`.
- M0.2 Design token in `:root` e nel tema notte: palette del prompt, spaziature, raggi,
  ombre, tipografia di sistema; nessun asset remoto.
- M0.3 Layout mobile-first della home (hero, prodotti in evidenza, benefici, newsletter,
  footer) con segnaposto SVG locali al posto delle immagini.
- M0.4 Header con `siteNav`, skip link, footer; `data-theme` e `data-motion` su `<html>`.
- M0.5 `js/data.js` con `PRODOTTI` e 12 prodotti; `catalogo.html` rende le card dal dataset
  (nome, collezione, età, prezzo formattato dall'intero in centesimi, badge, immagine).
- M0.6 `prodotto.html?id=` rende il prodotto dal dataset: galleria, descrizione, specifiche,
  prezzo, stato di disponibilità, pulsante «aggiungi al carrello».
- M0.7 Filtro per collezione letto da `?collezione=` con conteggio «N risultati»: tanto basta
  a chiudere la slice, mentre il contratto completo dei filtri è `M2`.

**Fatto quando:** le tre pagine si aprono da server locale, senza errori in console e senza
richieste esterne; la home è completa a 375 px e 1280 px; il catalogo senza parametri mostra
12 card e «12 risultati»; `prodotto.html?id=<id valido>` rende il prodotto del dataset.

**Verifica:** A1, A2 e A5 del §«Verify».

### M1 — Dataset unico PRODOTTI con schema, enum e validateDataset() (peso 12)

- M1.1 `js/data.js` esporta `PRODOTTI`, gli enum `COLLEZIONI`, `MATERIALI`, `COLORI`, `BADGE`
  e lo schema del §«Dataset: prodotti» (campo, tipo, dominio), dichiarato nel modulo.
- M1.2 `validateDataset()` rifiuta id duplicati, enum fuori dominio, prezzi non interi,
  `colori` vuoti e descrizioni fuori dai 40–400 caratteri, e restituisce la lista dei
  problemi invece di lanciare un'eccezione.
- M1.3 Il dataset copre tutte le collezioni, tutti i materiali, ogni fascia d'età e almeno un
  `badge: null`.
- M1.4 Nessun dato di prodotto scritto a mano nel markup: nome, prezzo, anno e conteggi
  vengono dal modulo.

**Fatto quando:** un dataset manomesso produce la lista dei problemi attesi e un test Node che
importa `js/data.js` conta 12 prodotti e verifica che ogni valore appartenga al suo enum.

**Verifica:** A2 del §«Verify» (conteggio ricalcolato importando `js/data.js`) e A6 per il
pannello di errore.

### M2 — Filtri, conteggi e stato nella query string (peso 10)

- M2.1 Quattro gruppi di filtri più l'ordinamento, come da tabella del §«Filtri, conteggio e
  query string»: `collezione`, `eta`, `prezzo`, `colore`, `ordina`.
- M2.2 Stato letto dalla query string al caricamento e riscritto a ogni cambio con
  `history.replaceState`: l'URL resta ricaricabile e condivisibile.
- M2.3 Conteggio «N risultati» calcolato dal dataset filtrato, non dal DOM, e sempre uguale
  al numero di card renderizzate.
- M2.4 Valore di parametro fuori dominio ignorato e riportato allo stato «tutti», senza
  errore.

**Fatto quando:** ogni combinazione di filtri produce il conteggio atteso con un numero di
card uguale al conteggio, e un URL filtrato ricarica lo stesso sottoinsieme.

**Verifica:** A3 e A4 del §«Verify».

### M3 — Interazione caratterizzante: lightbox prodotto, parallax e carrello locale (peso 12)

- M3.1 Lightbox prodotto con zoom, frecce, `Esc`, focus trap e ripristino del focus.
- M3.2 Parallax a tre livelli con fallback JS e spegnimento sotto `prefers-reduced-motion`.
- M3.3 Carrello locale: aggiunta, quantità, rimozione, totale e persistenza in
  `localStorage`; contatore annunciato con `aria-live="polite"`.
- M3.4 Menu mobile con morphing SVG e fallback senza `backdrop-filter`.
- M3.5 Cursore custom solo su puntatore fine; nessun cursore custom su touch.

**Fatto quando:** aggiungere due volte lo stesso prodotto porta la quantità a 2 e il totale
al doppio del prezzo, e un reload conserva il carrello.

**Verifica:** A7 e A8 del §«Verify».

### M4 — Stati vuoto, errore e non valido (peso 8)

- M4.1 `validateDataset()` fallito → pannello di errore con la lista dei problemi e nessuna
  card parziale.
- M4.2 Filtro senza risultati → stato vuoto con testo esplicito e pulsante «azzera filtri»
  che riporta al catalogo completo.
- M4.3 `?id=` inesistente o mancante → stato «Prodotto non trovato» con link al catalogo.
- M4.4 Chiave `localStorage` corrotta, di versione sconosciuta o inaccessibile → dato
  scartato, stato al default e avviso visibile, senza crash.

**Fatto quando:** dataset manomesso, filtro senza risultati e `?id=` inesistente producono i
tre stati dichiarati, ognuno con la sua via d'uscita verso il catalogo, e uno storage corrotto
non produce eccezioni.

**Verifica:** A6 del §«Verify».

### M5 — Accessibilità, reduced motion e contrasto (peso 8)

- M5.1 WCAG 2.1 AA su entrambi i temi: skip link, focus visibile, target ≥ 44×44 px,
  landmark semantici, `alt` descrittivi e decorativi con `alt=""`.
- M5.2 Dialogo lightbox e drawer carrello con semantica modale, `aria-modal`, focus trap,
  chiusura con `Esc` e ripristino del focus.
- M5.3 `aria-live="polite"` su conteggio risultati e contatore carrello, con annunci
  raggruppati (debounce ≥ 300 ms), mai per frame.
- M5.4 Reduced motion: `data-motion="reduced"` su `<html>` e parallax, ombre e transizioni
  spente, senza perdita di informazione.
- M5.5 Tabella di contrasto dei token dei due temi, con i valori misurati.

**Fatto quando:** tutte le asserzioni di contrasto del §«Verify» passano nei due temi e il
percorso da tastiera copre header, filtri, card, dettaglio e carrello.

**Verifica:** A9, A10 e A11 del §«Verify».

### M6 — Responsive sui breakpoint dichiarati (peso 5)

- M6.1 Breakpoint dichiarati: 375 px, 768 px, 1280 px; griglia 1/2/3 colonne con container
  queries sulle card.
- M6.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio` per evitare
  spostamenti di layout.
- M6.3 Menu mobile, filtri e carrello usabili a 375 px con target tattili ≥ 44 px.

**Fatto quando:** a 320, 375, 768 e 1280 px `document.scrollingElement.scrollWidth` non
supera la viewport e i tre flussi principali restano completabili.

**Verifica:** A12 del §«Verify».

### M7 — Verify: Playwright pinnato e verify.json (peso 5)

- M7.1 `package.json` con `@playwright/test` 1.65.0 e lockfile committato; nessuna
  dipendenza di runtime.
- M7.2 `playwright.config.*` con un solo progetto Chromium e server locale dei file statici.
- M7.3 `./verify.sh` non interattivo che esegue il set di asserzioni del §«Verify» ed emette
  `verify.json` con `M0`–`M7`.
- M7.4 Mapping esplicito asserzione → milestone, così ogni `pass` ha una prova.

**Fatto quando:** `./verify.sh` esce 0 su un progetto completo ed esce 1 con
`verify.json` coerente quando una milestone fallisce.

**Verifica:** A13 del §«Verify».

## Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-camels/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M7`, schema 1,
`benchmark` uguale a `staticweb-camels`. Le asserzioni sono solo su DOM e stato: nessun
giudizio visivo, nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le tre pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | il catalogo senza parametri mostra «12 risultati» e 12 card; il conteggio è ricalcolato importando `js/data.js` in Node, non scritto a mano | M0, M2 |
| A3 | ogni combinazione di filtri produce il conteggio atteso e un numero di card uguale al conteggio | M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `prodotto.html?id=<id valido>` rende il nome del dataset | M0 |
| A6 | dataset manomesso → pannello di errore con la lista dei problemi e nessuna card parziale; filtro senza risultati → stato vuoto con pulsante «azzera filtri»; `?id=` inesistente → stato «Prodotto non trovato» con link al catalogo | M4 |
| A7 | `Esc` chiude il lightbox e il focus torna sul trigger; le frecce cambiano immagine | M3 |
| A8 | aggiunta doppia → quantità 2 e totale doppio; reload → carrello conservato; `localStorage` corrotto → carrello vuoto senza crash e avviso visibile | M3 |
| A9 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"` e non restano animazioni in esecuzione | M5 |
| A10 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M5 |
| A11 | percorso da tastiera: skip link, filtri, card, dettaglio e carrello raggiungibili e attivabili con Tab/Invio/Spazio | M5 |
| A12 | a 320, 375, 768 e 1280 px nessun overflow orizzontale | M6 |
| A13 | `verify.json` contiene esattamente `M0`–`M7` e l'exit code concorda col file | M7 |

## Fuori scope

Backend, pagamenti, checkout, invio di email, account, analytics, deploy e hosting. Le
illustrazioni sono procedurali o segnaposto locali: nessuna fotografia remota.
