# Convenzione condivisa — siti statici

Vale per i quattro benchmark `staticweb-*` (`staticweb-camels`, `staticweb-classic-cars`,
`staticweb-auction`, `staticweb-watches`). I Plan la citano con un rimando e non la
ripetono: una regola che vive qui non viene riscritta in quattro modi. Ogni Plan dichiara
solo ciò che è proprio del suo sito: schema del dataset, formato dei filtri, persistenza,
interazione caratterizzante, comportamento del form.

## 1. Dataset locale unico

Ogni sito ha **un solo modulo dati**, `js/data.js` (ES module con `export const ...`), che
è l'unica fonte di verità: card, conteggi, pagina dettaglio, filtri e form leggono da lì. Il
markup non contiene dati inventati — nessun prezzo, nome, anno o conteggio scritto a mano
in HTML — e i contenuti che dipendono dal dataset sono renderizzati dal dataset.

### Schema dichiarato

Ogni Plan dichiara lo schema delle sue entità: per ogni campo il nome, il tipo e il dominio
ammesso (enum esportato oppure intervallo numerico). Regole comuni:

- ogni entità ha `id` stringa univoca e stabile, ed è la chiave dell'URL (`?id=`);
- i campi che si filtrano o si mostrano (prezzi, anni, durate) sono numeri, non stringhe;
  gli importi sono in centesimi interi, così i confronti non dipendono dalla formattazione;
- ogni enum è un array esportato dal modulo (`export const CATEGORIE = [...]`) e ogni valore
  presente nel dataset appartiene a quell'array;
- i riferimenti a immagini sono percorsi dentro `assets/`, mai URL;
- i campi opzionali sono dichiarati tali nello schema; il resto è obbligatorio.

Il modulo esporta una funzione di validazione (`validateDataset()`) eseguita al
caricamento: id duplicato, campo obbligatorio mancante, enum fuori dominio, numero fuori
intervallo. Una violazione produce lo **stato di errore visibile** del §3, non un'eccezione
silenziosa in console.

## 2. Asset: nessun URL remoto

Nessuna richiesta di rete a runtime, verificata e non promessa:

- **immagini**: SVG inline, CSS procedurale, oppure file dentro `assets/`; i segnaposto
  sono file locali generati dal progetto, non servizi di immagini;
- **font**: stack di sistema, oppure file dentro `assets/fonts/` con la licenza accanto
  (`OFL.txt`); niente fogli di stile o servizi di font;
- **icone**: SVG inline; niente font-icona;
- **codice**: nessun `<script src>` verso host esterni, nessun `@import` remoto, nessuna
  richiesta verso un'origine diversa da quella del sito.

La verifica è un'asserzione, non una promessa: `./verify.sh` intercetta ogni richiesta
emessa dalle pagine e fallisce se una sola ha un'origine diversa dal server locale del test
(§4).

## 3. Definition of Done comune

1. **Ogni pagina raggiungibile**: header e footer identici su tutte le pagine, nessun link
   morto, un solo `<h1>` per pagina.
2. **Il filtro dichiara il conteggio**: «N risultati» aggiornato a ogni cambio, calcolato
   dal dataset e coerente col numero di card renderizzate.
3. **Stati vuoto ed errore**: filtro senza risultati → messaggio esplicito e pulsante di
   reset che riporta al catalogo completo; id inesistente o dataset invalido → stato «non
   trovato» / «errore» con via d'uscita verso il catalogo.
4. **Tastiera**: ogni controllo è raggiungibile e attivabile da tastiera (Tab, Invio,
   Spazio, Esc per chiudere overlay con ripristino del focus sul trigger), con focus
   visibile di contrasto ≥ 3:1 su entrambi i temi.
5. **`prefers-reduced-motion`**: con la preferenza attiva parallax, marquee, ombre dinamiche
   e animazioni continue si spengono, senza perdita di informazione o funzionalità. Lo
   stato è osservabile nel DOM (`data-motion="reduced"` su `<html>`), così il test lo
   asserisce invece di dedurlo.
6. **Contrasto verificato**: testo ≥ 4,5:1, testo grande (≥ 24 px, o ≥ 19 px in grassetto)
   e bordi informativi ≥ 3:1, in **entrambi** i temi. Il controllo è calcolato sui colori
   risolti da `getComputedStyle`, non stimato a occhio.
7. **Nessuna richiesta di rete**: come §2, asserita dal test.
8. **Persistenza dichiarata e difensiva**: chiavi `localStorage` versionate; chiave
   assente, JSON corrotto, schema inatteso o storage inaccessibile non causano crash — il
   dato si scarta, lo stato torna al default e un avviso visibile lo dice.

## 4. Verifica comune

`./verify.sh` è un deliverable del progetto nella root del benchmark: non interattivo,
termina entro 600 s, exit 0 = pass, e scrive `verify.json` con **tutti** gli id milestone
del `meta.json` (schema 1, `benchmark` uguale all'id del benchmark, una voce
`{id, pass, detail}` per milestone). L'exit code concorda col file: 0 se e solo se tutte le
milestone sono `pass: true`.

Il motore è **Playwright pinnato** (`@playwright/test` 1.65.0, Chromium, lockfile
committato). Lo script serve i file statici da un server locale e asserisce **DOM e
stato**: testo del conteggio, numero di card, attributi `data-*` di stato, `localStorage`,
attributi ARIA, valori di `getComputedStyle`. Nessun giudizio visivo: vietati screenshot
diff, confronto di pixel e valutazioni estetiche.

I numeri attesi non si scrivono a mano: il test importa `js/data.js` in Node e ricalcola i
conteggi dal dataset, così un dataset modificato non falsa l'asserzione.

## 5. Cosa dichiara ogni Plan

- schema del dataset e valori ammessi;
- formato dei filtri, stato nella query string e comportamento del conteggio;
- cosa persiste dopo il reload, con le chiavi `localStorage`;
- l'interazione caratterizzante del sito;
- il comportamento del form, se il sito ne ha uno;
- le asserzioni specifiche di `./verify.sh` oltre a quelle comuni.
