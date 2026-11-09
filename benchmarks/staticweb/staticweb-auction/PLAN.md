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
| M0 | 40 | sì | Slice verticale: home, catalogo lotti filtrato e pagina lotto |
| M1 | 12 | — | Dataset unico LOTTI con schema, enum e validateDataset() |
| M2 | 10 | — | Filtri, ricerca, conteggi e stato nella query string |
| M3 | 12 | — | Interazione caratterizzante: countdown deterministico e offerta simulata |
| M4 | 8 | — | Stati vuoto, errore e non valido |
| M5 | 8 | — | Accessibilità, reduced motion e contrasto |
| M6 | 5 | — | Responsive sui breakpoint dichiarati |
| M7 | 5 | — | Verify: Playwright pinnato e verify.json |

La vertical slice vale 40 punti su 100 (`M0`) ed è il cancello dello scoring
(`docs/agents/scoring.md`): finché non passa, il resto non vale credito.

# StaticWeb — Aste virtuali online

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
Gli stati vuoto, errore e non valido sono pesati in `M4`.

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

### M0 — Slice verticale: home, catalogo lotti filtrato e pagina lotto (peso 40, slice)

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
- M0.5 `js/data.js` con `LOTTI` e 14 lotti; `aste.html` rende le card dal dataset (titolo,
  autore, categoria, offerta corrente, tempo rimanente, badge di stato derivato).
- M0.6 Home: lotto in evidenza con countdown, ticker dei lotti in arrivo e lotti in
  evidenza, tutti letti dal dataset.
- M0.7 `lotto.html?id=` rende il lotto dal dataset: galleria, descrizione, stima, offerta
  corrente, cronologia iniziale, countdown, pannello offerta.
- M0.8 Filtro per categoria letto da `?categoria=` con conteggio «N lotti»: tanto basta a
  chiudere la slice, mentre il contratto completo dei filtri è `M2`.

**Fatto quando:** le sei pagine si aprono da server locale senza errori in console e senza
richieste esterne, il footer mostra un countdown coerente con l'epoca, il catalogo senza
parametri mostra 14 card e «14 lotti», e `lotto.html?id=<id valido>` rende titolo e autore del
dataset.

**Verifica:** A1, A2 e A5 del §«Verify».

### M1 — Dataset unico LOTTI con schema, enum e validateDataset() (peso 12)

- M1.1 `js/data.js` esporta `LOTTI`, gli enum `CATEGORIE` e `STATI`, `rivalTick()`,
  `validateDataset()` e lo schema del §«Dataset: lotti» (campo, tipo, dominio).
- M1.2 `validateDataset()` rifiuta id duplicati, stime incoerenti, prezzi di partenza sopra
  la stima minima e `immagini` vuoto o fuori da 2–4 percorsi, e restituisce la lista dei
  problemi invece di lanciare un'eccezione.
- M1.3 Il dataset contiene 14 lotti, almeno due per categoria, almeno un
  `chiudeTraMinuti` negativo, almeno uno sotto i 60 minuti e almeno uno oltre le 24 ore.
- M1.4 Lo stato del lotto non è un campo del dataset: si deriva dall'orologio a ogni render,
  secondo la tabella del §«Date relative deterministiche».

**Fatto quando:** un dataset manomesso produce la lista dei problemi attesi e un test Node che
importa `js/data.js` conta 14 lotti e deriva gli stati attesi da un'epoca fissata.

**Verifica:** A2 del §«Verify» (conteggio ricalcolato importando `js/data.js`) e A6 per il
pannello di errore.

### M2 — Filtri, ricerca, conteggi e stato nella query string (peso 10)

- M2.1 Filtri, ricerca e ordinamento come da tabella del §«Filtri, conteggio e query string»:
  `categoria`, `stato`, `prezzo`, `ordina`, `q`.
- M2.2 Stato letto dalla query string al caricamento e riscritto a ogni cambio con
  `history.replaceState`: l'URL resta ricaricabile e condivisibile.
- M2.3 Conteggio «N lotti» calcolato dal dataset filtrato con lo stato derivato all'istante
  del render, e sempre uguale al numero di card.
- M2.4 Valore di parametro fuori dominio ignorato e riportato allo stato «tutti», senza
  errore.

**Fatto quando:** ogni combinazione di filtri, ricerca e ordinamento produce il conteggio
atteso con un numero di card uguale al conteggio, e un URL filtrato ricarica lo stesso
sottoinsieme.

**Verifica:** A3 e A4 del §«Verify».

### M3 — Interazione caratterizzante: countdown deterministico e offerta simulata (peso 12)

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

**Verifica:** A7, A8 e A9 del §«Verify».

### M4 — Stati vuoto, errore e non valido (peso 8)

- M4.1 `validateDataset()` fallito → pannello di errore con la lista dei problemi e nessuna
  card parziale.
- M4.2 Filtro senza risultati → stato vuoto con testo esplicito e pulsante «azzera filtri»
  che riporta al catalogo completo.
- M4.3 `?id=` inesistente o mancante → stato «Lotto non trovato» con link al catalogo.
- M4.4 Dato persistito non valido → voce scartata e avviso visibile: epoca non ISO ricreata,
  offerta con importo non intero o id sconosciuto scartata, esito sconosciuto ignorato,
  nessun crash.

**Fatto quando:** dataset manomesso, filtro senza risultati e `?id=` inesistente producono i
tre stati dichiarati, ognuno con la sua via d'uscita verso il catalogo, e uno storage corrotto
non produce eccezioni.

**Verifica:** A6 del §«Verify».

### M5 — Accessibilità, reduced motion e contrasto (peso 8)

- M5.1 WCAG 2.1 AA su entrambi i temi: skip link, focus visibile, target ≥ 44×44 px,
  landmark, `alt` descrittivi per le opere.
- M5.2 Regioni live come da tabella del §«Annunci `aria-live`», con la prova che nessuna
  regione cambia più di una volta ogni 3 s.
- M5.3 Modale di esito e lightbox con semantica modale, focus trap, `Esc` e ripristino del
  focus.
- M5.4 Reduced motion: `data-motion="reduced"` su `<html>`, nessuna animazione in esecuzione
  e decimi non mostrati.
- M5.5 Tabella di contrasto dei token dei due temi con i valori misurati; il neon non è mai
  solo decorativo.

**Fatto quando:** tutte le asserzioni di regione live e di contrasto del §«Verify» passano
nei due temi e il percorso da tastiera copre header, filtri, card, lotto e pannello offerta.

**Verifica:** A10, A11 e A12 del §«Verify».

### M6 — Responsive sui breakpoint dichiarati (peso 5)

- M6.1 Breakpoint 375 px, 768 px, 1280 px; griglia lotti 1/2/3 colonne con container queries.
- M6.2 Nessun overflow orizzontale a 320 px; immagini con `aspect-ratio`.
- M6.3 Pannello offerta, filtri e ticker usabili a 375 px con target ≥ 44 px; il ticker si
  ferma al hover e al focus e non è una regione live.

**Fatto quando:** A13 passa a 320, 375, 768 e 1280 px.

**Verifica:** A13 del §«Verify».

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

`./verify.sh` è un deliverable del progetto nella root `benchmarks/staticweb/staticweb-auction/`:
non interattivo, entro 600 s, exit 0 = pass, `verify.json` con gli id `M0`–`M7`, schema 1,
`benchmark` uguale a `staticweb-auction`. Solo assert su DOM e stato: nessun giudizio visivo,
nessuno screenshot diff.

| # | asserzione | milestone |
|---|------------|-----------|
| A1 | le sei pagine caricano senza errori di console e senza richieste con origine diversa dal server locale | M0 |
| A2 | il catalogo senza parametri mostra «14 lotti» e 14 card; il conteggio è ricalcolato importando `js/data.js` in Node | M0, M2 |
| A3 | ogni combinazione di filtri, ricerca e ordinamento produce il conteggio atteso e un numero di card uguale al conteggio | M2 |
| A4 | i filtri nell'URL si rileggono dopo il reload e riproducono lo stesso sottoinsieme | M2 |
| A5 | `lotto.html?id=<id valido>` rende titolo e autore del dataset | M0 |
| A6 | dataset manomesso → pannello di errore con la lista dei problemi e nessuna card parziale; filtro senza risultati → stato vuoto con pulsante «azzera filtri»; `?id=` inesistente → stato «Lotto non trovato» con link al catalogo | M4 |
| A7 | con `?epoch=` fissato, due caricamenti producono lo stesso testo del countdown e lo stesso `data-stato` per ogni lotto; un lotto con `chiudeTraMinuti` negativo è `chiusa` | M3 |
| A8 | offerta valida → offerta corrente e cronologia aggiornate, voce in `martello:offerte:v1`; reload → offerta conservata; importo sotto il minimo → errore annunciato e nessuna scrittura | M3 |
| A9 | due offerte entro 2 s → la seconda è rifiutata con motivo annunciato; `rivalTick()` in Node produce la stessa sequenza per lo stesso `lotId` | M3 |
| A10 | con `emulateMedia({reducedMotion: 'reduce'})` `<html>` ha `data-motion="reduced"`, nessuna animazione in esecuzione e i decimi non sono mostrati | M5 |
| A11 | nessuna regione `aria-live` contiene un nodo che cambia più di una volta ogni 3 s (osservazione con `MutationObserver` su 5 s); le cifre del countdown sono fuori dalle regioni live | M5 |
| A12 | contrasto calcolato da `getComputedStyle` sulle coppie testo/sfondo dei due temi: ≥ 4,5:1 il testo, ≥ 3:1 il testo grande e i bordi informativi | M5 |
| A13 | a 320, 375, 768 e 1280 px nessun overflow orizzontale | M6 |
| A14 | `verify.json` contiene esattamente `M0`–`M7` e l'exit code concorda col file | M7 |

## Fuori scope

Backend, aste reali, pagamenti, account, notifiche, invio di email, deploy e hosting. Nessuna
fotografia remota: segnaposto SVG locali. Nessuna affermazione di asta in corso su un server.
