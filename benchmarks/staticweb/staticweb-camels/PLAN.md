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
| M3 | 20 | — | Interazione caratterizzante: lightbox prodotto, parallax e carrello locale |
| M4 | 15 | — | Accessibilità |
| M5 | 15 | — | Responsive |
| M6 | 10 | — | Verify: Playwright pinnato + verify.sh |

La vertical slice vale 40 punti su 100 (`M0`+`M1`+`M2`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito. Le milestone
`M3`–`M6` sono contenuto oltre la slice e si valutano solo dopo.

## Slice verticale

Home, catalogo filtrato e una pagina dettaglio, tutte sullo stesso dataset locale:

```text
index.html ──▶ catalogo.html?collezione=…&eta=…&prezzo=…&colore=…
                        │
                        └──▶ prodotto.html?id=<id del dataset>
```

La slice è completa quando: la home mostra i prodotti in evidenza letti dal dataset; il
catalogo filtra, dichiara il conteggio e regge lo stato vuoto; la pagina dettaglio rende il
prodotto richiesto per `?id=` e gestisce l'id inesistente. Nessuna delle tre pagine contiene
dati di prodotto scritti a mano nel markup.

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

### M0 — Bootstrap e layout (peso 10, slice)

- M0.1 Struttura: `index.html`, `catalogo.html`, `prodotto.html`, `css/main.css`,
  `css/utilities.css`, `js/app.js`, `js/scroll-animations.js`, `js/components.js`,
  `js/data.js`, `assets/images/`.
- M0.2 Design token in `:root` e nel tema notte: palette del prompt, spaziature, raggi,
  ombre, tipografia di sistema; nessun asset remoto.
- M0.3 Layout mobile-first della home (hero, prodotti in evidenza, benefici, newsletter,
  footer) con segnaposto SVG locali al posto delle immagini.
- M0.4 Header con `siteNav`, skip link, footer; `data-theme` e `data-motion` su `<html>`.

**Fatto quando:** le tre pagine si aprono da server locale, senza errori in console e senza
richieste esterne, e la home è completa a 375 px e 1280 px.

### M1 — Dataset e rendering lista (peso 20, slice)

- M1.1 `js/data.js` con `PRODOTTI`, enum, `validateDataset()`; 12 prodotti come da schema.
- M1.2 `catalogo.html` rende le card dal dataset (nome, collezione, età, prezzo formattato
  dall'intero in centesimi, badge, immagine).
- M1.3 Conteggio «N risultati» calcolato dal dataset filtrato e aggiornato a ogni cambio.
- M1.4 Stato di errore del dataset: se `validateDataset()` fallisce, il catalogo mostra un
  pannello di errore con la lista dei problemi e non renderizza card parziali.

**Fatto quando:** il catalogo senza parametri mostra 12 card e «12 risultati», e il
conteggio coincide col numero di card in ogni combinazione di filtri.

### M2 — Dettaglio e filtri (peso 10, slice)

- M2.1 `prodotto.html?id=` rende il prodotto dal dataset: galleria, descrizione, specifiche,
  prezzo, stato di disponibilità, pulsante «aggiungi al carrello».
- M2.2 Id inesistente o mancante → stato «Prodotto non trovato» con link al catalogo.
- M2.3 Filtri e ordinamento come da tabella, con stato nella query string letto al
  caricamento e riscritto a ogni cambio (`history.replaceState`).
- M2.4 Stato vuoto con testo esplicito e pulsante «azzera filtri».

**Fatto quando:** un URL con filtri applicati riproduce lo stesso sottoinsieme dopo il
reload, e un `?id=` inesistente mostra lo stato «non trovato».

### M3 — Interazione caratterizzante (peso 20)

- M3.1 Lightbox prodotto con zoom, frecce, `Esc`, focus trap e ripristino del focus.
- M3.2 Parallax a tre livelli con fallback JS e spegnimento sotto `prefers-reduced-motion`.
- M3.3 Carrello locale: aggiunta, quantità, rimozione, totale, persistenza e difesa dello
  storage; contatore annunciato con `aria-live="polite"`.
- M3.4 Menu mobile con morphing SVG e fallback senza `backdrop-filter`.
- M3.5 Cursore custom solo su puntatore fine; nessun cursore custom su touch.

**Fatto quando:** aggiungere due volte lo stesso prodotto porta la quantità a 2 e il totale
al doppio del prezzo, e un reload conserva il carrello.

### M4 — Accessibilità (peso 15)

- M4.1 WCAG 2.1 AA su entrambi i temi: skip link, focus visibile, target ≥ 44×44 px,
  landmark semantici, `alt` descrittivi e decorativi con `alt=""`.
- M4.2 Dialogo lightbox e drawer carrello con semantica modale, `aria-modal`, focus trap,
  chiusura con `Esc` e ripristino del focus.
- M4.3 `aria-live="polite"` su conteggio risultati e contatore carrello, con annunci
  raggruppati (debounce ≥ 300 ms), mai per frame.
- M4.4 Tabella di contrasto dei token dei due temi, con i valori misurati.

**Fatto quando:** tutte le asserzioni di contrasto del §«Verify» passano nei due temi e il
percorso da tastiera copre header, filtri, card, dettaglio e carrello.

### M5 — Responsive (peso 15)

- M5.1 Breakpoint dichiarati: 375 px, 768 px, 1280 px; griglia 1/2/3 colonne con container
  queries sulle card.
- M5.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio` per evitare
  spostamenti di layout.
- M5.3 Menu mobile, filtri e carrello usabili a 375 px con target tattili ≥ 44 px.

**Fatto quando:** a 320, 375, 768 e 1280 px `document.scrollingElement.scrollWidth` non
supera la viewport e i tre flussi principali restano completabili.

### M6 — Verify (peso 10)

- M6.1 `package.json` con `@playwright/test` 1.65.0 e lockfile committato; nessuna
  dipendenza di runtime.
- M6.2 `playwright.config.*` con un solo progetto Chromium e server locale dei file statici.
- M6.3 `./verify.sh` non interattivo che esegue il set di asserzioni del §«Verify» ed emette
  `verify.json` con `M0`–`M6`.
- M6.4 Mapping esplicito asserzione → milestone, così ogni `pass` ha una prova.

**Fatto quando:** `./verify.sh` esce 0 su un progetto completo ed esce 1 con
`verify.json` coerente quando una milestone fallisce.

## Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-camels/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M6`, schema 1,
`benchmark` uguale a `staticweb-camels`. Le asserzioni sono solo su DOM e stato: nessun
giudizio visivo, nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le tre pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | il catalogo senza parametri mostra «12 risultati» e 12 card; il conteggio è ricalcolato importando `js/data.js` in Node, non scritto a mano | M1 |
| A3 | ogni combinazione di filtri produce il conteggio atteso e un numero di card uguale al conteggio | M1, M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `prodotto.html?id=<id valido>` rende il nome del dataset; `?id=inesistente` mostra lo stato «non trovato» con link al catalogo | M2 |
| A6 | `Esc` chiude il lightbox e il focus torna sul trigger; le frecce cambiano immagine | M3 |
| A7 | aggiunta doppia → quantità 2 e totale doppio; reload → carrello conservato; `localStorage` corrotto → carrello vuoto senza crash e avviso visibile | M3 |
| A8 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"` e non restano animazioni in esecuzione | M3, M4 |
| A9 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M4 |
| A10 | percorso da tastiera: skip link, filtri, card, dettaglio e carrello raggiungibili e attivabili con Tab/Invio/Spazio | M4 |
| A11 | a 320, 375, 768 e 1280 px nessun overflow orizzontale | M5 |
| A12 | `verify.json` contiene esattamente `M0`–`M6` e l'exit code concorda col file | M6 |

## Fuori scope

Backend, pagamenti, checkout, invio di email, account, analytics, deploy e hosting. Le
illustrazioni sono procedurali o segnaposto locali: nessuna fotografia remota.
