# C9 — `staticweb` (4 benchmark + wording source)

**Obiettivo:** i 4 prompt prodotto diventano 4 benchmark giudicabili con una convenzione
condivisa; i 5 `.txt` originali restano intatti come corsia T1 per modelli deboli.

**Prerequisiti:** C2 (stub di cartella e `index.meta.json` dei wording source già creati).

## Step

1. **`benchmarks/staticweb/SHARED.md`** — la convenzione comune, referenziata dai 4 Plan e mai
   duplicata:
   - **dataset**: ogni sito ha un modulo dati unico e locale (`data.js` o JSON) con schema
     dichiarato per tipo di entità; nessun dato inventato sparso nel markup;
   - **asset**: niente URL remoti. Immagini = SVG/CSS procedurali o placeholder inclusi in
     `assets/`; font di sistema o file locali;
   - **DoD comune**: ogni pagina raggiungibile, filtro con conteggio risultati, stati
     vuoto/errore, tastiera, `prefers-reduced-motion`, contrasto verificato, nessuna richiesta
     di rete (verificata, non promessa);
   - **verify comune**: Playwright pinnato con assert su DOM/stato, nessun giudizio visivo,
     `./verify.sh` → `verify.json`.
2. **Un `PLAN.md` per benchmark**, uno per commit, ognuno con: banner IT, milestone pesate,
   slice, `verify`, e la sua `AUDIT.md` dai reperti dell'archivio (§5 cammelli, §6 auto,
   §7 aste, §8 orologi).
   - `staticweb-camels` (T2): e-commerce dichiarato ma senza carrello/checkout nel prompt →
     risolvi: o "demo vetrina" senza promesse di acquisto, o carrello minimo con persistenza
     locale. Scegli **vetrina + carrello locale senza checkout** e togli ogni riferimento a
     validazione checkout.
   - `staticweb-classic-cars` (T2): modulo dati unico per la flotta; strategia per header/footer
     senza framework (include lato build o duplicazione dichiarata); comportamento del form
     definito; font/immagini locali.
   - `staticweb-auction` (T3): date relative deterministiche al posto di "live 24/7"; cosa
     persiste dopo reload (offerte, stato lotto, identità locale); separazione evidente fra
     simulazione e asta reale; `aria-live` a intervalli ragionevoli, non a ogni frame.
   - `staticweb-watches` (T3): dataset orologi; palette scura con criteri di contrasto; smooth
     scroll custom opt-in o rimosso; costo delle ombre dinamiche su mobile con fallback;
     sincronizzazione dell'orologio testabile.
3. **Milestone**: lo scheletro è quello dichiarato dalla issue #10, identico per i quattro siti
   (cambia solo l'interazione caratterizzante di `M3`), e la issue è autorevole su questo
   documento: `M0` 40 slice — home + catalogo filtrato + una pagina dettaglio, tutto dal dataset
   locale; `M1` 12 — modulo dati unico con schema e validazione; `M2` 10 — filtri, conteggi dei
   risultati e stato nella query string; `M3` 12 — interazione caratterizzante (lightbox+parallax,
   galleria+filtri, countdown+offerta simulata, orologio+ombre); `M4` 8 — stati vuoto, errore e
   non valido; `M5` 8 — accessibilità, reduced motion, contrasto; `M6` 5 — responsive sui
   breakpoint dichiarati; `M7` 5 — `verify.sh` che emette `verify.json`. Σ weight = 100,
   Σ slice = 40: gli stati vuoto/errore/non valido hanno una milestone pesata propria, non sono
   sotto-punti di un'altra.
4. **Wording source**: verifica che i 5 `.txt` siano byte-identici agli originali (solo
   spostati in C1) e che `_wording-source/index.meta.json` li elenchi come `kind:
   wording-source`, `tier: 1`. Nessuna modifica ai testi.
5. **`--strict`**: passa `scripts/index.mjs` in modalità strict (nessun `plan: null` ammesso).

## Acceptance

- `benchmarks/staticweb/` contiene `SHARED.md`, `_wording-source/` (5 `.txt` + indice) e 4
  cartelle con `PLAN.md`, `AUDIT.md`, `meta.json`; `node scripts/index.mjs --check --strict`
  esce 0.
- Ogni `meta.json`: `tier` 2/2/3/3 come da inventario, `Σ weight == 100`, slice nel range,
  id milestone presenti nei rispettivi `PLAN.md`, `skills` secondo policy.
- Esiste la prova che nessun Plan promette asset remoti: `grep -ri "unsplash\|fonts.googleapis\|cdn\."` vuoto nei 4 Plan.
- I 5 `.txt` hanno lo stesso hash di C1 e di `main` pre-crisi: `git log --follow` mostra solo
  il rename.

## Fuori scope

Riscrivere i `.txt`, unificare i 4 siti in un solo progetto, aggiungere build tool o framework.
