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
| M3 | 20 | — | Interazione caratterizzante: countdown deterministico e offerta simulata |
| M4 | 15 | — | Accessibilità |
| M5 | 15 | — | Responsive |
| M6 | 10 | — | Verify: Playwright pinnato + verify.sh |

La vertical slice vale 40 punti su 100 (`M0`+`M1`+`M2`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito.

## Slice verticale

Home, catalogo filtrato e pagina lotto, tutte sullo stesso dataset locale e sullo stesso
orologio:

```text
index.html ──▶ aste.html?categoria=…&stato=…&prezzo=…&ordina=…&q=…
                     │
                     └──▶ lotto.html?id=<id del dataset>
```

La slice è completa quando la home mostra il lotto in evidenza con il countdown reale del
dataset, il catalogo filtra e dichiara il conteggio, e la pagina lotto rende il lotto
richiesto, il suo countdown e la cronologia iniziale, oppure lo stato «Lotto non trovato».

## Convenzione condivisa

`benchmarks/staticweb/SHARED.md` è vincolante e non si ripete qui: modulo dati unico con
schema validato, nessun asset remoto, DoD comune, verifica Playwright su DOM e stato.

## Decisioni di sito

### Date relative deterministiche al posto di «aste live 24/7»

Il prompt promette aste live continue su un sito statico, il che è impossibile: non esiste un
server che chiuda i lotti. Il benchmark sostituisce la promessa con un **orologio relativo
alla sessione**:

- `js/data.js` non contiene date assolute; ogni lotto dichiara `chiudeTraMinuti` (intero,
  anche frazionario) rispetto a un'**epoca di sessione**;
- l'epoca è il timestamp del primo caricamento, salvato in `martello:epoch:v1` come stringa
  ISO: sopravvive al reload, quindi i countdown non ripartono da capo;
- `?epoch=<ISO 8601>` sostituisce l'epoca salvata: è l'aggancio di test usato da
  `./verify.sh` per rendere il countdown deterministico, e non ha altro effetto;
- lo stato del lotto **non è un campo del dataset**: si deriva dall'orologio a ogni render,
  così un lotto non può dichiararsi `live` con il countdown a zero.

| condizione su `rimanente = epoca + chiudeTraMinuti − adesso` | stato derivato |
|---|---|
| `rimanente > 1440 min` | `in-arrivo` |
| `60 min < rimanente ≤ 1440 min` | `live` |
| `0 < rimanente ≤ 60 min` | `in-chiusura` («Termina presto») |
| `rimanente ≤ 0` | `chiusa` |

Il sito non dichiara in nessun punto che l'asta è reale o in corso su un server: il §«Simulazione
dichiarata» lo dice una volta sola, in modo visibile.

### Dataset: lotti

`js/data.js` esporta `LOTTI`, `CATEGORIE`, `STATI`, `rivalTick()`, `validateDataset()`.

| campo | tipo | dominio |
|---|---|---|
| `id` | stringa | slug univoco a tre cifre, usato in `?id=` |
| `titolo` | stringa | obbligatorio |
| `autore` | stringa | obbligatorio (artista, designer o «manifattura») |
| `categoria` | stringa | `CATEGORIE`: `arte-contemporanea`, `scultura`, `design`, `fotografia`, `edizioni-limitata` |
| `descrizione` | stringa | obbligatoria, 80–600 caratteri |
| `stimaMinCentesimi`, `stimaMaxCentesimi` | interi | `> 0`, con `stimaMin < stimaMax` |
| `prezzoPartenzaCentesimi` | intero | `> 0` e `≤ stimaMin` |
| `incrementoMinimoCentesimi` | intero | `> 0` |
| `chiudeTraMinuti` | numero | `> 0`; copre `in-arrivo`, `live`, `in-chiusura` e un lotto già `chiusa` (negativo) |
| `immagini` | array di stringhe | 2–4 percorsi dentro `assets/images/lots/` |

Quattordici lotti, almeno due per categoria, almeno un `chiudeTraMinuti` negativo (lotto
chiuso), almeno uno sotto i 60 minuti e almeno uno oltre le 24 ore. `validateDataset()`
rifiuta id duplicati, stime incoerenti, prezzi di partenza sopra la stima minima e
`immagini` vuoto.

### Cosa persiste dopo il reload

| chiave | contenuto | difesa |
|---|---|---|
| `martello:epoch:v1` | ISO dell'epoca di sessione | valore non ISO → epoca ricreata, avviso visibile |
| `martello:offerte:v1` | mappa `lotId → { importo, storico: [{ ts, importo, chi }] }` | JSON corrotto, id sconosciuto o importo non intero → voce scartata |
| `martello:identita:v1` | `{ id, nome }`, identità **locale** del partecipante (nickname, non un account) | valore inatteso → identità rigenerata |
| `martello:esiti:v1` | `lotId → 'aggiudicato'` oppure `'superato'`: latch dell'esito osservato | voce sconosciuta → scartata |
| `martello:tema:v1` | `gallery` o `night` | valore inatteso → default da `prefers-color-scheme` |

Dopo un reload: countdown invariati, offerte e cronologia conservate, stato del lotto
ricalcolato dallo stesso orologio, identità locale conservata. Nulla lascia il browser.

### Simulazione dichiarata, separata dall'asta reale

- Pannello offerta con badge «SIMULAZIONE» e `role="note"` sempre visibile, non chiudibile;
- riga esplicita: «offerta dimostrativa: nessun lotto viene aggiudicato, nessun pagamento,
  nessun dato inviato»;
- la pagina `come-funziona.html` apre con la stessa dichiarazione prima dei passi;
- nessuna registrazione, nessun account, nessun pagamento, nessun invio: l'identità è un
  nickname locale;
- il titolo della pagina lotto e il `<h1>` non usano la parola «live» da soli: dicono
  «simulazione».

### Filtri, conteggio e query string

Su `aste.html`, con stato nella query string (ricaricabile e condivisibile):

| parametro | valore | default |
|---|---|---|
| `categoria` | uno dei valori di `CATEGORIE` | assente = tutte |
| `stato` | `in-arrivo`, `live`, `in-chiusura`, `chiusa` | assente = tutti |
| `prezzo` | `fino-500`, `500-5000`, `oltre-5000` (euro, su offerta corrente) | assente = tutte |
| `ordina` | `tempo-rimanente`, `prezzo`, `recente` | `tempo-rimanente` |
| `q` | testo libero sul titolo, senza distinzione di maiuscole | assente = nessun filtro |

Il conteggio «N lotti» è calcolato dal dataset filtrato con lo stato derivato all'istante del
render, e il test lo confronta col numero di card. Filtro senza risultati → stato vuoto
esplicito con pulsante «azzera filtri».

### Annunci `aria-live` a intervalli ragionevoli

Le cifre del countdown cambiano ogni secondo e non si annunciano: il contenitore è
`role="timer"` con `aria-live="off"`. Gli annunci stanno in regioni separate:

| regione | `aria-live` | frequenza |
|---|---|---|
| soglie del countdown (60, 30, 10, 5, 1 minuto, «chiusa») | `polite` | un annuncio per soglia attraversata, mai ripetuto |
| prezzo e cronologia offerte | `polite` | al massimo uno ogni 3 s, con coalescenza |
| conteggio dei filtri | `polite` | uno per cambio, con debounce ≥ 300 ms |
| «sei stato superato» | `assertive` | una volta per superamento, non a ogni rilancio del rivale |

Nessun elemento che cambia a ogni frame o a ogni decimo è dentro una regione live.

### Offerta simulata

- pulsanti «+ incremento minimo» e «+ 5×»; importo personalizzato con validazione (intero in
  centesimi, ≥ offerta corrente + incremento minimo, ≤ 10× il prezzo di partenza);
- il rivale rilanciato è deterministico: `rivalTick(lotId, indice)` in `js/data.js` deriva
  attesa (8–20 s) e moltiplicatore da un PRNG con seme sull'id, così due run producono la
  stessa sequenza;
- l'offerta dell'utente è limitata a una ogni 2 s; oltre, il pulsante è disabilitato e il
  motivo è annunciato;
- alla chiusura (`rimanente ≤ 0`) il pannello si disabilita, compare la modale di esito
  («aggiudicato in simulazione» se l'ultima offerta è dell'utente, «superato» altrimenti) e
  l'esito si blocca in `martello:esiti:v1`.

### Tema Galleria/Notte

`data-theme` su `<html>` con script inline in `<head>` per evitare il FOUC; default dalla
preferenza di sistema, poi persistito. La transizione animata fra i temi è ≤ 300 ms e si
riduce a un cambio immediato sotto reduced motion.

## Milestone e task

### M0 — Bootstrap e layout (peso 10, slice)

- M0.1 Struttura a sei pagine (`index.html`, `aste.html`, `lotto.html`,
  `come-funziona.html`, `chi-siamo.html`, `contatti.html`) con `css/main.css`,
  `css/utilities.css`, `js/data.js`, `js/app.js`, `js/scroll-animations.js`,
  `js/components.js`, `assets/images/`.
- M0.2 Token dei due temi (Galleria e Notte) con la palette del prompt, hairline, tipografia
  di sistema e monospace per i dati d'asta.
- M0.3 Header con `siteNav`, skip link, footer con il mini-countdown del lotto che chiude
  prima; `data-theme` e `data-motion` su `<html>`, tema applicato in `<head>` senza FOUC.
- M0.4 Orologio di sessione: lettura/scrittura di `martello:epoch:v1`, override `?epoch=`,
  modulo `js/clock.js` con sorgente di tempo iniettabile.

**Fatto quando:** le sei pagine si aprono da server locale senza errori in console e senza
richieste esterne, e il footer mostra un countdown coerente con l'epoca.

### M1 — Dataset e rendering lista (peso 20, slice)

- M1.1 `js/data.js` con `LOTTI`, `CATEGORIE`, `STATI`, `rivalTick()`, `validateDataset()`;
  14 lotti come da schema.
- M1.2 `aste.html` rende le card dal dataset (titolo, autore, categoria, offerta corrente,
  tempo rimanente, badge di stato derivato).
- M1.3 Conteggio «N lotti» calcolato dal dataset filtrato, aggiornato a ogni cambio.
- M1.4 Home: lotto in evidenza con countdown, ticker dei lotti in arrivo e lotti in
  evidenza, tutti letti dal dataset.
- M1.5 Stato di errore del dataset: validazione fallita → pannello con i problemi e nessuna
  card parziale.

**Fatto quando:** il catalogo senza parametri mostra 14 card e «14 lotti», e il conteggio
coincide col numero di card in ogni combinazione di filtri.

### M2 — Dettaglio e filtri (peso 10, slice)

- M2.1 `lotto.html?id=` rende il lotto dal dataset: galleria, descrizione, stima, offerta
  corrente, cronologia iniziale, countdown, pannello offerta.
- M2.2 `?id=` inesistente o mancante → stato «Lotto non trovato» con link al catalogo.
- M2.3 Filtri, ricerca e ordinamento come da tabella, con stato nella query string letto al
  caricamento e riscritto a ogni cambio (`history.replaceState`).
- M2.4 Stato vuoto con testo esplicito e pulsante «azzera filtri».

**Fatto quando:** un URL con filtri riproduce lo stesso sottoinsieme dopo il reload e un
`?id=` inesistente mostra lo stato «non trovato».

### M3 — Interazione caratterizzante (peso 20)

- M3.1 Countdown deterministico: cifre aggiornate una volta al secondo, decimi solo nel lotto
  in evidenza e solo senza reduced motion; stato derivato coerente con `chiudeTraMinuti`.
- M3.2 Pannello offerta: incrementi rapidi, importo personalizzato con validazione, throttle
  2 s, persistenza in `martello:offerte:v1`.
- M3.3 Rivale deterministico con `rivalTick()`, impulso del prezzo, notifica «sei stato
  superato» una volta per superamento.
- M3.4 Chiusura del lotto: pannello disabilitato, modale di esito, latch in
  `martello:esiti:v1`, stato `chiusa` nel catalogo dopo il reload.
- M3.5 Lightbox della galleria con frecce, `Esc`, focus trap e ripristino del focus.

**Fatto quando:** con `?epoch=` fissato, il countdown e lo stato del lotto sono gli stessi in
due run, e un'offerta valida sopravvive al reload.

### M4 — Accessibilità (peso 15)

- M4.1 WCAG 2.1 AA su entrambi i temi: skip link, focus visibile, target ≥ 44×44 px,
  landmark, `alt` descrittivi per le opere.
- M4.2 Regioni live come da tabella del §«Annunci `aria-live`», con la prova che nessuna
  regione cambia più di una volta ogni 3 s.
- M4.3 Modale di esito e lightbox con semantica modale, focus trap, `Esc` e ripristino.
- M4.4 Tabella di contrasto dei token dei due temi con i valori misurati; il neon non è mai
  solo decorativo.

**Fatto quando:** A9–A11 del §«Verify» passano nei due temi.

### M5 — Responsive (peso 15)

- M5.1 Breakpoint 375 px, 768 px, 1280 px; griglia lotti 1/2/3 colonne con container queries.
- M5.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio`.
- M5.3 Pannello offerta, filtri e ticker usabili a 375 px con target ≥ 44 px; il ticker si
  ferma al hover e al focus e non è una regione live.

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

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-auction/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M6`, schema 1,
`benchmark` uguale a `staticweb-auction`. Solo assert su DOM e stato: nessun giudizio visivo,
nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le sei pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | il catalogo senza parametri mostra «14 lotti» e 14 card; il conteggio è ricalcolato importando `js/data.js` in Node | M1 |
| A3 | ogni combinazione di filtri, ricerca e ordinamento produce il conteggio atteso e un numero di card uguale al conteggio | M1, M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `lotto.html?id=<id valido>` rende titolo e autore del dataset; `?id=inesistente` mostra «Lotto non trovato» | M2 |
| A6 | con `?epoch=` fissato, due caricamenti producono lo stesso testo del countdown e lo stesso `data-stato` per ogni lotto; un lotto con `chiudeTraMinuti` negativo è `chiusa` | M1, M3 |
| A7 | offerta valida → offerta corrente e cronologia aggiornate, voce in `martello:offerte:v1`; reload → offerta conservata; importo sotto il minimo → errore annunciato e nessuna scrittura | M3 |
| A8 | due offerte entro 2 s → la seconda è rifiutata con motivo annunciato; `rivalTick()` in Node produce la stessa sequenza per lo stesso `lotId` | M3 |
| A9 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"`, nessuna animazione in esecuzione e i decimi non sono mostrati | M3, M4 |
| A10 | nessuna regione `aria-live` contiene un nodo che cambia più di una volta ogni 3 s (osservazione con `MutationObserver` su 5 s); le cifre del countdown sono fuori dalle regioni live | M4 |
| A11 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M4 |
| A12 | a 320, 375, 768 e 1280 px nessun overflow orizzontale | M5 |
| A13 | `verify.json` contiene esattamente `M0`–`M6` e l'exit code concorda col file | M6 |

## Fuori scope

Backend, aste reali, pagamenti, account, notifiche, invio di email, deploy e hosting. Nessuna
fotografia remota: segnaposto SVG locali. Nessuna affermazione di asta in corso su un server.
