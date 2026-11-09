# AUDIT — wayline

Audit locale del Benchmark `wayline`, aperto in C7. I reperti della prima tabella provengono
dalla sezione 3 di `docs/archive/REVIEW-2026-08-20.md` (report storico, archiviato in C2) e ogni
reperto ha uno stato: `applied` (risolto nel piano attuale), `deferred` (non risolto, motivato) o
`obsolete` (non più pertinente). Seguono i rilievi nuovi della revisione C7. Le revisioni
successive aggiungono reperti qui, non altrove.

## Reperti dal report archiviato (sezione 3)

### Problemi individuati

| reperto | stato | motivazione |
|---|---|---|
| La struttura tecnica usa file `.js`, mentre lo stack dichiara TypeScript strict e React | applied | §10.3 vieta `.js`/`.jsx` di produzione e dichiara l'albero applicativo `.ts`/`.tsx`; l'unico JavaScript è l'output di Vite e `/sw.js`, che è un artefatto generato dal plugin e non codice sorgente. Nessun riferimento `.js` residuo altrove nel piano |
| Non sono definiti `package.json`, configurazione build, struttura React/JSX, CSS e service worker concreti | applied | §10.3 è la sezione dedicata: albero completo, `package.json` con script, `tsconfig.json` e `tsconfig.node.json` completi, `vite.config.ts` con `VitePWA` in `injectManifest`, `service-worker.ts` concreto, `tokens.css`/`global.css`/`console.css` con le variabili richieste. `package.json`, `package-lock.json` e i file di configurazione sono dichiarati **deliverable** |
| «Nessuna dipendenza runtime» è ambiguo rispetto all'uso di React 19 | applied | §1.4 e §10.2 lo ristabiliscono una volta sola: React 19 e `react-dom` sono le sole dipendenze runtime deliberate della UI, mentre il dominio (schema, codec, transizioni, PRNG, dati) non dipende da framework, rete o server. Il budget di §14.2 è ricalcolato di conseguenza |
| Il piano è estremamente ampio: il rischio principale è non riuscire a completare un vertical slice realmente giocabile | applied | Il target di release scende a 12–15 nodi, 8–10 Echi, 3 regioni, 3 scontri chiave, 1 finale (§1, §5.3); il surplus resta integro come contenuto opzionale a peso zero (§5.4). §2.0 blinda il vertical slice e la milestone slice `M0` vale 40 punti, con il cancello di punteggio di `docs/agents/scoring.md` |
| Il comportamento di browser history, `popstate`, deep link e navigazione durante una battaglia va specificato meglio | applied | §9.5 è il contratto dedicato: cosa è autorevole (`location`, non `history.state`), quando si usa `pushState`/`replaceState`, back/forward fuori e dentro la battaglia, dialog «Abbandonare lo scontro?», `BATTLE_LOCKED`, link condiviso a metà scontro, refresh, e i test obbligatori |
| I Wayline sono modificabili dall'utente: mancano decisioni su integrità, validazione anti-tampering e gestione di stati legalmente validi ma non raggiungibili | applied | §10.6: la pipeline di import in sei passi, l'envelope `{v,p,h}`, la dichiarazione esplicita che il checksum non è una firma, i tre stati di fiducia `generated`/`imported-legal`/`imported-unreachable` e il rifiuto con Via Smarrita per ogni stato illegale. La firma server-side è dichiarata fuori release |
| Le skill `game-developer` sono orientate soprattutto a Unity/Unreal e non sono perfettamente adatte al gioco browser React | deferred | Rilievo registrato come osservazione, non come modifica di piano: `benchmarks/wayline/.agents/skills/game-developer` esiste nel catalogo locale ma **non** è nella allowlist `skills` del `meta.json`, quindi non entra nel run. Il rischio residuo è neutralizzato nel piano da §10.7 «Profilo tecnico browser (non Unity/Unreal/raylib)», che dichiara toolchain e deliverable attesi. Il contenuto delle skill non è materia di questo step |

### Miglioramenti consigliati

| reperto | stato | motivazione |
|---|---|---|
| Bloccare un vertical slice molto piccolo: Valdaluce → un incontro → Sintonia → salvataggio URL | applied | Era già il blocco MVP-0 di §2.0; C7 lo rende la milestone slice `M0` (peso 40) e ne fa il cancello del punteggio, con §12 che ne fissa i task e il gate stop/go |
| Uniformare stack e layout: TypeScript/React/JSX oppure JavaScript, non entrambi | applied | §10.2 (verdetto React + TypeScript, React solo nel renderer) e §10.3 (albero `.ts`/`.tsx`, nessun `.js`/`.jsx` di produzione) dicono la stessa cosa in due punti coerenti |
| Definire contratti TypeScript per `GameState`, comandi, eventi, codec e router | applied | §10.3.1 «Contratti TypeScript minimi»: `NodeId`/`EchoId` brandizzati, `BattleState`, `GameState`, `GameCommand` come unione discriminata, `GameEvent`, `Navigation`, `TransitionResult`, `WaylineCodec`, più la superficie del router |
| Separare chiaramente MVP, contenuto narrativo successivo e requisiti di release | applied | Tre livelli dichiarati e non sovrapposti: §2.0 (MVP-0), §5.3 (target di release), §5.4 (contenuto opzionale a peso zero), riassunti nella tabella di promozione §12.1 |
| Specificare sicurezza e validazione dei Wayline | applied | §10.6 copre lunghezza, alphabet, versione, checksum, migrazioni, validazione strutturale e semantica, raggiungibilità e messaggio utente; il caso di link invalido è un task della milestone `M1` ed è un passo del percorso end-to-end di §13 |
| «Il piano è un RPG completo con due rami narrativi e due finali» come descrizione del target di release | obsolete | Descrizione superata da C7: il target di release ha un solo finale e nessun ramo; Atti III-A/III-B, secondo finale ed epiloghi regionali vivono in §5.4 con peso 0. La frase resta qui come record della riduzione |

## Rilievi nuovi (revisione C7)

- **Tabella milestone provvisoria.** Il `meta.json` scritto in C2 conteneva una tabella
  `M0`–`M6` derivata dal vecchio staging (MVP, fondamenta, tre fasi narrative, due fasi RC),
  non il set reale del piano ridotto. Sostituita con `M0`–`M8` (issue #8): `M0` slice = 40,
  Σ pesi = 100, Σ slice = 40. Il §12 è stato riscritto sulle stesse milestone, una fase per id,
  e la tabella `## Milestone pesate` è la resa di `meta.json`.
- **Target sovradimensionato.** 29 nodi, 20 Echi, 5 regioni, 6 scontri e 2 finali non sono
  raggiungibili in una sessione: il target scende a 12–15 nodi, 8–10 Echi, 3 regioni,
  3 scontri chiave, 1 finale. Nessun contenuto è cancellato: il surplus (inventario del mondo,
  Atti III-A/III-B, secondo finale, 11 Echi, strumenti di ramo) vive in §5.4 con peso 0.
  Aggiornate tutte le tabelle che ripetevano i vecchi numeri: §1, §5.1, §5.2, §5.3/§5.4,
  §11.2, §12.1, §14.1, §14.3, §15.
- **Nessun contratto di verifica.** Il piano descriveva test ovunque ma non dichiarava il
  comando che l'harness esegue. Nuova sezione §13 e milestone `M8` (peso 3): `./verify.sh` =
  `npm ci` + typecheck + unit test del dominio + build + un solo pass Playwright pinnato
  (genera la via, reload, deep link, link invalido), nessun giudizio visivo, `verify.json` con
  gli id `M0`–`M8`, timeout 600 s, exit code concorde col file.
- **`meta.json` incompleto.** `audit` era `null`; ora punta a `AUDIT.md`. La allowlist `skills`
  resta invariata: è già quella di default per T5 e nessuna skill locale del benchmark è
  richiesta dal piano ridotto.
- **Pinning delle dipendenze.** Il piano non diceva come le versioni vengono bloccate. §10.3
  ora dichiara `package.json`, `package-lock.json` e i file di configurazione come deliverable,
  vieta `@latest` e ogni install fuori dal lockfile, e impone `npm ci` come unico comando di
  install (anche in `./verify.sh`). La scelta è quella ammessa dal banner («lockfile, oppure
  tag + hash»): i range nel manifest indicano la linea, il lockfile committato è il pin esatto.
- **Coerenza numerica non verificabile a occhio.** L'accettazione dello step chiede che non
  resti nessun numero del vecchio target fuori da §5.4; il controllo eseguibile è
  `grep -nE "\b(29|20)\b" benchmarks/wayline/PLAN.md`, che ora restituisce una sola riga: la
  tabella dell'espansione dentro §5.4. Il resto del documento usa solo i numeri del target
  ridotto, e §1 rimanda a §5.4 senza ripeterli.
