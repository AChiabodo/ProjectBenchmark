# C7 — `wayline` (riduzione del target + contratti tecnici)

**Obiettivo:** il piano è eccellente sul prodotto e sovradimensionato sull'esecuzione. Si
riduce il target di release, si aggiungono i contratti tecnici mancanti, e il resto del design
resta come contenuto opzionale pesato.

**Prerequisiti:** C2. `AUDIT.md` iniziale = sezione 3 dell'archivio.

## Step

1. **Banner** IT in testa.
2. **Riduzione del target**: da 29 nodi / 20 Echi / 5 regioni / 6 scontri / 2 finali a
   **12–15 nodi, 8–10 Echi, 3 regioni, 3 scontri chiave, 1 finale**. Il resto del mondo
   descritto non si cancella: passa in una sezione "contenuto opzionale, fuori dal target di
   release" con peso 0. Aggiorna ogni tabella di scope che ripete i numeri.
3. **Milestone e pesi**: bootstrap + codec Wayline, vertical slice (Valdaluce → un incontro →
   Sintonia → genera Wayline → copia URL → reload/deep link), combattimento, roster Echi,
   economia, regioni del target ridotto, accessibilità, PWA/offline. Slice = il blocco già
   dichiarato come MVP-0 nel piano. Aggiorna `meta.json`.
4. **Contratti tecnici mancanti** (l'audit li elenca, qui vanno scritti):
   - `package.json` e config build dichiarati come deliverable, con versioni pinnate;
   - coerenza stack: il piano cita file `.js` ma dichiara TypeScript strict + React 19 →
     allinea a TS/TSX ovunque;
   - chiarisci "nessuna dipendenza runtime": React è dipendenza deliberata della UI,
     il dominio non dipende da framework — scrivilo in una riga e togli l'ambiguità;
   - contratti di tipo per `GameState`, comandi, eventi, codec, router;
   - history/`popstate`/deep link **durante** una battaglia: comportamento definito;
   - integrità dei Wayline: checksum, validazione, stati legali ma non raggiungibili.
5. **`verify`**: `./verify.sh` = build + test unitari del dominio + Playwright pinnato su un
   percorso end-to-end (genera via, reload, deep link, link invalido). Nessun giudizio visivo.
6. **`AUDIT.md`**: reperti §3 con stato `applied`/`deferred`/`obsolete` + rilievi nuovi
   (incluso il disallineamento delle skill orientate a Unity/Unreal, che qui non c'entrano).

## Acceptance

- Banner canonico; numeri di scope coerenti in **tutto** il documento (grep per 29, 20, 5, 6, 2
  e per le nuove cifre: nessun residuo del vecchio target fuori dalla sezione opzionale).
- `Σ weight == 100`; slice nel range; ogni id nel `PLAN.md`;
  `node scripts/index.mjs --check` esce 0.
- I sei punti del §4 hanno una sezione riconoscibile; nessuna occorrenza di `.js` dove lo
  stack dichiara TypeScript.
- `AUDIT.md` completo come in C3.
- Il design narrativo, la prosa e le tabelle di prodotto restano (nessuna riscrittura
  creativa: solo riduzione di target e chiarimenti tecnici).

## Fuori scope

Riscrivere il worldbuilding, ridurre l'accessibilità richiesta, cambiare il concept del
Wayline.
