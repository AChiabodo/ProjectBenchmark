# AUDIT — staticweb-camels

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`, §5) dopo
la revisione C9 (issue #10). Il §5 recensisce il prompt `_wording-source/cammelli.txt`, che
questo Plan trasforma in benchmark senza modificarne il testo: ogni reperto è mappato a
`applied`, `deferred` o `obsolete` con la ragione e il punto del Plan in cui vive ora.
Seguono i rilievi nuovi della revisione C9.

## Reperti d'archivio (§5, «Problemi»)

| # | Reperto | Stato | Ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | E-commerce dichiarato senza catalogo dati, quantità, carrello, prezzi, checkout o persistenza | applied | Il §«Dataset: prodotti» dichiara schema, dominio e 12 prodotti; il §«E-commerce risolto» fissa carrello con quantità e totale; il §«Persistenza» fissa `cammelli:cart:v1`; i prezzi sono interi in centesimi |
| 2 | Validazione del checkout citata senza una pagina di checkout | applied | Il checkout non esiste e non viene promesso: il §«E-commerce risolto» vieta pagina, form e messaggi di checkout, e l'unico form del sito è la newsletter. Il benchmark è una vetrina con carrello locale |
| 3 | Non è chiaro se i segnaposto immagine siano asset locali o URL esterni | applied | `SHARED.md` §2 impone file dentro `assets/` o SVG/CSS procedurali, e A1 di `./verify.sh` fallisce su una sola richiesta con origine esterna: la regola è asserita, non dichiarata |
| 4 | Mancano test e criteri di verifica oltre Lighthouse | applied | `M7` e il §«Verify» sostituiscono il target Lighthouse con 13 asserzioni su DOM e stato; Lighthouse non è più un criterio di punteggio |
| 5 | Parallax, animazioni continue, cursore custom e immagini remote possono confliggere con la performance | applied | Parallax a tre livelli con fallback e spegnimento sotto reduced motion (`M3.2`); cursore custom solo su puntatore fine (`M3.5`); immagini locali procedurali (`SHARED.md` §2). Nessun criterio di FPS dichiarato senza misura |
| 6 | `prefers-reduced-motion` non è esplicitato | applied | `SHARED.md` §3.5 lo rende DoD comune con stato osservabile (`data-motion="reduced"`); A8 lo asserisce |

## Reperti d'archivio (§5, «Miglioramenti»)

| # | Miglioramento | Stato | Ragione / dove ora |
|---|---------------|-------|--------------------|
| 1 | Definire un dataset prodotti e il comportamento minimo del carrello | applied | Schema prodotti con enum e validazione (§«Dataset»), carrello definito in `M3.3` con aggiunta, quantità, rimozione, totale e persistenza |
| 2 | Separare la demo UI dal commercio reale | applied | Riga visibile nel pannello carrello («dimostrazione: nessun ordine viene inviato»), nessun pagamento, nessun invio; §«Fuori scope» |
| 3 | Aggiungere stati di errore, successo e persistenza | applied | Stato vuoto e di reset (`M4.2`), errore dataset (`M4.1`), «non trovato» (`M4.3`), storage difensivo (§«Persistenza»), successo della newsletter |
| 4 | Specificare test per tastiera, mobile, tema scuro e reduced motion | applied | A8 (reduced motion), A9 (contrasto nei due temi), A10 (tastiera), A11 (320–1280 px) |

## Rilievi nuovi (revisione C9)

- **`meta.json` senza contratto.** Lo stub di C2 aveva `plan: null` e `audit: null`, quindi
  nessun Plan e nessuna traccia d'audit: `node scripts/index.mjs --check --strict` falliva.
  Ora `plan: "PLAN.md"` e `audit: "AUDIT.md"`, con la tabella `M0`–`M7` allineata a questo
  Plan (Σ pesi 100, Σ slice 40).
- **Il prompt inglese dichiara un checkout client-side.** `cammelli_inglese.txt` chiede
  «product catalog, shopping cart, checkout interface»: la risoluzione vale per entrambe le
  varianti del wording source, e nessun Plan promette un checkout. I due `.txt` restano
  intatti.
- **Titolo dello stub già nella forma risolta.** «Cammelli (e-commerce vetrina)» dice
  vetrina, non negozio: il `meta.json` non cambia titolo, e il corpo del Plan dice una volta
  sola che il carrello è locale e il checkout non esiste.
- **Le tre pagine non sono nel prompt.** Il prompt chiede un solo `index.html`; la slice
  richiede una pagina dettaglio. Il Plan dichiara tre pagine e la strategia per header e
  footer (elenco link unico in `siteNav`, markup duplicato, parità verificata), invece di
  lasciare la scelta all'implementatore.
- **Nessun requisito di performance misurabile.** Il prompt chiedeva «Lighthouse > 90» senza
  dire come misurarlo. Il Plan non lo riprende come criterio: al suo posto restano
  asserzioni di stato e il vincolo di nessuna richiesta di rete.
