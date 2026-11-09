# C4 — `match3` (revisione)

**Obiettivo:** il piano web più solido della suite perde le incoerenze che l'audit ha trovato
e guadagna i contratti della suite. Non si tocca la sua struttura, che è il riferimento.

**Prerequisiti:** C2. `AUDIT.md` iniziale = sezione 2 dell'archivio.

## Step

1. **Banner** IT in testa al `PLAN.md`.
2. **Milestone**: sostituisci il segnaposto con le milestone reali già implicite nel piano
   (core puro + board deterministica, FSM/input, rendering+HUD, Moves, Time, special tile,
   persistenza, accessibilità/performance). Slice = core + swap/match/clear/gravity + una
   modalità giocabile. Aggiorna `meta.json` di conseguenza.
3. **Path**: elimina ogni riferimento a `Match3Deepseek/`; la root è `benchmarks/match3/`.
4. **Incoerenza special tile**: decidi in un solo posto, e il piano oggi si contraddice —
   le special tile sono descritte come parte di v1 (`§1.3`) ma anche fuori scope. Risoluzione
   richiesta: **sono dentro v1**, con peso proprio in una milestone dedicata; le milestone
   P0 non le richiedono. Nessun'altra modifica di gameplay.
5. **`TileType`**: allinea al `as const` object che il piano stesso raccomanda altrove, oppure
   giustifica l'`enum` in una riga. Una delle due, non entrambe.
6. **Stabilizzazione forzata** dopo il limite di cascade: specifica il comportamento
   osservabile (cosa vede il giocatore, quale stato canonico, quali test lo coprono).
7. **Identità delle tile** durante swap/gravity/animazione: aggiungi il contratto
   (`tileId` stabile, mapping logico↔animazione) come sezione dedicata.
8. **Dipendenze pinnate**: `create-vite@latest` non è ripetibile; fissa le versioni
   (Vite, TypeScript, Vitest) e dichiara il lockfile come deliverable.
9. **`localStorage` difensivo**: dati corrotti, versione dello schema, migrazione o reset
   esplicito. Il piano oggi dice "persistenza difensiva" senza stato: rendilo testabile.
10. **`verify`**: `./verify.sh` = `vitest --run` + build + Playwright pinnato sulle asserzioni
    di stato (board, punteggio, modalità), nessun giudizio visivo. `verify.json` con gli id.
11. **`AUDIT.md`** con i reperti §2 mappati a `applied` / `deferred` / `obsolete` + rilievi nuovi.

## Acceptance

- Banner canonico in testa; nessuna occorrenza di `Match3Deepseek`.
- `node scripts/index.mjs --check` esce 0 con i nuovi pesi; slice nel range.
- I punti 4–10 hanno, ciascuno, una sezione o un paragrafo riconoscibile nel `PLAN.md`
  (grep per: "special", "TileType", "stabilizzazione", "tileId", "lockfile", "localStorage",
  "verify").
- Il piano non contiene più la coppia di affermazioni contraddittorie sulle special tile.
- `AUDIT.md` completo come in C3.

## Fuori scope

Nuove modalità, campagne, backend, monetizzazione, riscrittura dell'architettura.
