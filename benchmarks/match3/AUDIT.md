# AUDIT — match3

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`,
§2) dopo la revisione C4 (issue #5). Ogni reperto è mappato a `applied`,
`deferred` o `obsolete` con la ragione e il punto del piano in cui vive ora.
Seguono i rilievi nuovi della revisione C4.

## Reperti d'archivio (§2, «Problemi individuati»)

| # | Reperto | Stato | Ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | La struttura del piano citava una root di progetto inesistente (archivio §2, reperto 1), mentre il benchmark è `benchmarks/match3/` | applied | La root del piano era ancora errata (`Match3/`); C4 la corregge a `benchmarks/match3/` in testa al piano, nell'albero §4.2 e nel task M0.1. Nessun riferimento residuo a radici diverse |
| 2 | `TileType` descritto come `enum`, mentre la skill TypeScript raccomanda oggetti `as const` | applied | §4.3 «Tipi senza enum» adotta l'oggetto `as const` con union type derivata e vieta gli enum: un'unica raccomandazione. La formula residua «validazione degli enum» in §5.1 è stata riformulata in «validazione dei valori ammessi» |
| 3 | Le special tile sono dichiarate nell'architettura e nello scoring, ma poi rinviate fuori scope | obsolete | Decisione C4 (issue #5) che inverte il reperto: le special tile sono **dentro v1** con la milestone dedicata M5 (peso 10); le milestone P0, in particolare la slice M0, non le richiedono. Dichiarato una volta sola in §1.3. Il reperto resta qui come record dell'inversione |
| 4 | «Stabilizzazione forzata» dopo il limite di 20 cascade non spiega quale comportamento adottare | applied | §4.8 è il contratto dedicato: comportamento osservabile (overlay `EMERGENCY_STABILIZING`, non stato FSM), stato canonico (board piena, senza match, mossa valida, `cascadeLevel = 0`, score e mosse invariati) e i sei test che lo coprono; task M1.4 |
| 5 | Mancano contratti per l'identità delle tile durante swap, gravity e animazioni | applied | §4.5 «Contratto di identità e coordinate»: `tileId` stabile, piani per ID, commit atomici, mapping logico↔animazione dichiarato; test obbligatori elencati in coda alla sezione |
| 6 | Piano molto ambizioso rispetto alla stima temporale (coverage 90%, test manuali su molti browser, verifica performance) | applied | §2.2 già ridimensionava i criteri performance (misura su dispositivo di riferimento, mai «60 FPS» dichiarato); C4 ripesa le milestone (slice M0 = 40, cancello), tiene la matrice browser estesa come attività separata (M7.5) e aggiorna la stima totale a 13–18 giorni per G3, 14–20 per G4 |
| 7 | Le dipendenze sono indicate ma non fissate: `create-vite@latest` può produrre configurazioni diverse | applied | §3 vieta `@latest`, `^` e `~`, fissa le versioni esatte (Vite 7.0.6, TypeScript 5.8.3, Vitest 4.0.0, ESLint 9.32.0, `@playwright/test` 1.65.0) e dichiara `package-lock.json` deliverable verificato con `npm ci` |
| 8 | La persistenza `localStorage` non definisce gestione di dati corrotti o versionamento | applied | §5.1: envelope versionato, sei comportamenti definiti (chiave assente, JSON corrotto, schema errato, versione migrabile, versione sconosciuta, storage inaccessibile), migrazione o reset esplicito, fallback in memoria e test obbligatori per ogni ramo; task M6 |

## Reperti d'archivio (§2, «Miglioramenti consigliati»)

| # | Miglioramento | Stato | Ragione / dove ora |
|---|---------------|-------|--------------------|
| 1 | Definire formalmente invarianti della board e FSM | applied | §4.4 invarianti formali con `assertBoardInvariant`; §4.6 FSM formale con tabella di transizioni; task M1.1 e M2.1 |
| 2 | Decidere se le special tile fanno parte dell'MVP oppure eliminarle dall'architettura iniziale | applied | Deciso in §1.3 con la risoluzione del reperto 3: dentro v1, milestone M5, slice non le richiede |
| 3 | Aggiungere test per reset, `localStorage` corrotto, timer e aggiornamento delle coordinate | applied | §7.2 casi obbligatori; task M1.3 (identità/reset), M4.1 (timer con fake clock), M6.1 (storage corrotto) |
| 4 | Pinning delle versioni e riduzione dello scope iniziale: core giocabile prima del polish | applied | §3 pinning completo; slice M0 (peso 40) consegna core e una modalità giocabile prima di ogni polish, e il cancello slice dello scoring blocca il credito oltre |

## Rilievi nuovi (revisione C4)

- **Tabella milestone provvisoria.** Il `meta.json` scritto in C2 conteneva una
  tabella M0–M5 derivata meccanicamente, non il set reale implicito nel piano.
  Sostituita con M0–M8 (issue #5): slice M0 = 40, Σ pesi = 100, Σ slice = 40.
  Il §6 è stato riorganizzato sugli stessi id, con i task esistenti
  ridistribuiti senza modifiche di contenuto.
- **Playwright «stretch» in contrasto col contratto di suite.** Il piano
  dichiarava Playwright fuori v1 in quattro punti (§1.2, §7.3, §11, §12),
  mentre il contratto di suite richiede `./verify.sh` con Playwright pinnato e
  assert su stato. Risolto: il pass Playwright entra in `./verify.sh` (§12);
  resta stretch solo la matrice E2E estesa.
- **`EMERGENCY_STABILIZING` non era uno stato.** Il vecchio task cap-cascade
  citava una «transizione `EMERGENCY_STABILIZING`» assente da `GAME_STATES` e
  dalla tabella FSM §4.6. Chiarito in §4.8: è un overlay visivo, la FSM resta
  nella transazione corrente e committa a `IDLE`.
- **Concordanza exit code/`verify.json` non specificata.** §12 ora richiede
  exit 0 se e solo se tutte le milestone sono `pass: true`, e un eventuale
  campo `weight` coerente col `meta.json`.
- **`meta.json` incompleto.** `audit` era `null` (ora `AUDIT.md`) e le skill
  locali del benchmark (`code-reviewer`, `typescript-pro`) non erano dichiarate
  nella allowlist; entrambe aggiunte, verificando che esistano in
  `benchmarks/match3/.agents/skills/`.
- **Stima totale non più allineata.** La redistribuzione dei task nelle
  milestone M0–M8 rendeva la vecchia stima (10–14 / 12–16) non più giustificabile
  dalla ripartizione; aggiornata a 13–18 giorni per G3 e 14–20 per G4.
