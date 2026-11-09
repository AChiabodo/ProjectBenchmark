# AUDIT — paper-feed

Stato dei reperti della revisione archiviata (`docs/archive/REVIEW-2026-08-20.md`, §4) dopo
la revisione C8 (issue #9). Ogni reperto è mappato a `applied`, `deferred` o `obsolete` con
la ragione e il punto del piano in cui vive ora. Il redesign offline cambia la forma del
threat model: i reperti che riguardavano la rete e i modelli restano qui come `obsolete` con
la motivazione, non vengono cancellati, così una revisione futura non li legge come
regressioni. Seguono i rilievi nuovi della revisione C8.

## Reperti d'archivio (§4, «Problemi individuati»)

| # | reperto | stato | ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | Le fonti personalizzate possono introdurre SSRF, ma il piano cita il test senza definire la mitigazione concreta | obsolete | Il redesign elimina il percorso: nessun adapter «custom URL» e nessun URL configurabile, gli adapter leggono solo fixture nel repository (§2, §7). Senza hostname risolvibile non c'è superficie SSRF; il reperto resta registrato perché il threat model è cambiato forma, non perché sia stato mitigato |
| 2 | Non sono descritti autenticazione e autorizzazione dell'API/UI amministrativa | obsolete | L'API si riduce a lettura locale (health, stato pipeline, archivio, anteprima) su un profilo Compose a operatore singolo (§3, §11); l'autenticazione multiutente è fuori scope per issue #9 e non esistono endpoint amministrativi con effetti |
| 3 | Mancano soglie precise per deduplicazione semantica e scoring | applied | §8 dichiara le soglie: 0.92 su titolo+autori entro una finestra di 7 giorni, 0.95 di similarità semantica come solo segnale di supporto, componenti 0–1 con policy versionata; M2 e M3 |
| 4 | Il lock del worker non specifica meccanismo, timeout e comportamento in caso di crash | applied | §9: lease su PostgreSQL con TTL 60 s e rinnovo a intervallo fisso, secondo worker attivo rifiutato, lease scaduta riacquisita; due test obbligatori; M6 |
| 5 | Non sono definiti retry e backoff | applied | §9: massimo 3 tentativi con backoff fisso 1 s / 4 s su fasi transazionali e consegna; una fonte in errore non blocca le altre |
| 6 | Non sono definiti circuit breaker e limiti di costo per provider LLM/embedding | obsolete | Non esistono endpoint remoti da proteggere e i provider sono deterministici (§10): nessuna chiamata, nessun token, costo zero per costruzione. Un circuit breaker non avrebbe oggetto |
| 7 | Il rischio di prompt injection da contenuti RSS, GitHub o paper non è esplicitamente gestito | obsolete | Nessun modello legge contenuti non fidati: `DeterministicLlmProvider` seleziona da tabelle fisse in funzione dell'hash del contenuto (§10), quindi un'istruzione iniettata non ha interprete. Il rischio residuo è markup non fidato nelle fixture, coperto dalla sanitizzazione obbligatoria (§11, M5) e dal test dedicato (§15) |
| 8 | Backup, retention e restore sono citati ma non trasformati in task verificabili | applied | §9: `newsletter backup` produce un dump deterministico, `newsletter restore` ricrea lo stato su database vuoto con confronto dei contatori, la retention elimina i digest oltre soglia con test sul numero di righe eliminate |
| 9 | La gestione della concorrenza e delle transazioni della pipeline potrebbe essere più precisa | applied | §9: una transazione per fase, run `FAILED` con errore sanitizzato e database consistente, recovery dalla fase interrotta tramite idempotency key `(finestra, fase, versione policy)`; M6 |

## Reperti d'archivio (§4, «Miglioramenti consigliati»)

| # | reperto | stato | ragione / dove ora |
|---|---------|-------|--------------------|
| 1 | Definire schema di configurazione YAML e API amministrative | applied | §12: fonti e policy editoriali in YAML versionabile, `config/` nell'albero §4; l'API amministrativa è ridotta alla API locale di lettura (§3, §11), coerentemente col reperto 2 della tabella precedente |
| 2 | Aggiungere allowlist URL e blocco di reti private per gli adapter custom | obsolete | Gli adapter custom non esistono più (§2): una allowlist difenderebbe un percorso che il redesign ha rimosso |
| 3 | Introdurre threat model per contenuti non fidati e prompt injection | obsolete | Vedi reperto 7 della tabella precedente: nessun modello consuma contenuti non fidati; la parte ancora viva (sanitizzazione dell'HTML) è requisito di M5 e test obbligatorio in §15 |
| 4 | Specificare idempotency key, lock storage, retry policy e recovery da pipeline interrotta | applied | §9: idempotency key per `PipelineRun`, lease su PostgreSQL come lock storage, retry con backoff, recovery dalla fase interrotta; M6 |
| 5 | Stabilire soglie misurabili per qualità e latenza | applied | §8 soglie di deduplicazione e scoring; §12 metriche minime con latenza per fase |
| 6 | Stabilire soglie misurabili per costi | obsolete | Nessun modello, nessun token, nessuna chiamata: il costo è zero per costruzione (§10) |
| 7 | Stabilire soglie misurabili per coverage | deferred | Il benchmark non impone una percentuale di coverage: il contratto è comportamentale (`## Verify` più i test per fase in §15) e una soglia numerica non sarebbe verificabile da `verify.json`. Registrato come non risolto per scelta, non per dimenticanza |

## Rilievi nuovi (revisione C8)

| reperto | stato | motivazione |
|---|---|---|
| Il piano prometteva integrazioni remote — aggregazione RSS, paper, modelli, release, LLM/embeddings e consegna SMTP reale — in violazione frontale del banner di vincolo | applied | §2 rende le sostituzioni offline una per riga con la stessa interfaccia adapter: aggregatore rimosso e sostituito dal corpus `fixtures/feeds/*.xml`, adapter paper/modelli/release su fixture, `DeterministicLlmProvider` e `DeterministicEmbeddingProvider`, consegna via MailHog nel profilo Compose. Il grep di accettazione su `PLAN.md` non trova più alcuna promessa di rete |
| Il contratto di verifica era assente: nessuna sezione `## Verify`, nessun `verify.sh`, nessun `verify.json`, nessun timeout | applied | Nuova sezione `## Verify`: `./verify.sh` non interattivo, timeout 600 s, exit 0 = pass, `verify.json` (schema 1, `benchmark: "paper-feed"`) con tutti gli id del `meta.json`; consegna dell'onere alla milestone M8 |
| Il determinismo non era né dichiarato né misurato | applied | §1 lo pone tra i principi, §5 fissa la finestra di date delle fixture, §10 deriva output da hash; lo step 3 di `## Verify` confronta byte per byte i digest di due run consecutive sulle stesse fixture; M8 |
| Tre percorsi di avvio equivalenti (Compose, servizio locale, SQLite) senza un profilo primario | applied | §13 dichiara un solo comando di avvio (`docker compose up --wait --build`) e un solo comando di verifica; la modalità senza Compose resta sviluppo e mai Definition of Done. SQLite è rimosso: PostgreSQL è l'unico target dichiarato (§3) |
| La tabella milestone provvisoria di C2 (M0–M4, slice 15+20=35) non rifletteva il redesign e lasciava fuori lock, consegna e verifica | applied | Sostituita con M0–M8 di issue #9: slice `M0` = 40, Σ pesi = 100, Σ slice = 40; `meta.json` e tabella del piano resi dalla stessa fonte |
| Il corpus di fixture era una riga non specificata («fixture registrate»), senza formato, date né casi sporchi | applied | §5 dichiara quattro famiglie con i campi di ciascuna, la finestra di date fisse (2026-01-05 .. 2026-01-19 UTC) e i casi sporchi con identificatore documentato: duplicati, quasi-duplicati, titoli vuoti, date non parseabili, HTML nell'abstract, item senza identificatore; M1 |
| `meta.json` dichiarava `audit: null` e uno stack che non nominava i servizi realmente avviati | applied | `audit: "AUDIT.md"`; lo stack dichiara PostgreSQL e MailHog, cioè i servizi del profilo Compose; l'aggregatore esterno non compare più |
| I test di sicurezza su secret redaction e header injection SMTP non avevano più oggetto dopo la rimozione della rete e di SMTP reale | obsolete | Non esistono credenziali oltre alle stringhe di connessione dei servizi Compose locali, e la consegna va a MailHog locale senza TLS né autenticazione con target fisso (§11): i due test sono stati tolti da §15 perché non verificherebbero nulla |
