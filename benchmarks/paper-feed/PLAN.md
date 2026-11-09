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
| M0 | 40 | sì | Bootstrap, Compose e vertical slice |
| M1 | 12 | — | Ingestione fixture e normalizzazione |
| M2 | 10 | — | Deduplicazione spiegabile |
| M3 | 10 | — | Scoring deterministico |
| M4 | 8 | — | Scoring semantico via provider stub |
| M5 | 8 | — | Rendering Markdown e HTML sanitizzato |
| M6 | 7 | — | Lock del worker e scheduling idempotente |
| M7 | 3 | — | Consegna via MailHog |
| M8 | 2 | — | Verifica e rerun byte-per-byte |

# Piano tecnico di sviluppo: AI/ML Newsletter (offline)

## 1. Obiettivo e principi

Realizzare un sistema self-hosted che raccolga contenuti su AI e Machine Learning da un corpus di fixture locale, li normalizzi, deduplichi e ordini per rilevanza, quindi produca un digest editoriale in Markdown e HTML e lo consegni tramite un canale email locale. Il benchmark è interamente **offline e deterministico**: nessuna richiesta di rete a runtime e, sulle stesse fixture, lo stesso risultato a ogni esecuzione.

La pipeline resta completa: è il benchmark «molti servizi + scheduler + database» della suite — normalizzazione, deduplicazione, scoring deterministico e semantico, curatela, rendering, consegna, scheduling con lock — ma ogni integrazione remota è sostituita da una controparte locale dietro la **stessa interfaccia adapter**.

Principi vincolanti:

- nessuna integrazione remota: fonti = fixture nel repository, provider = stub deterministici, consegna = MailHog nel profilo Compose;
- ogni passaggio ripetibile, osservabile e idempotente;
- due run sulle stesse fixture producono lo stesso digest **byte per byte**;
- UI e output senza emoji, stile professionale-editoriale.

## 2. Sostituzioni offline (una per riga, stessa interfaccia)

- Servizio esterno di aggregazione feed RSS/Atom → **rimosso**: corpus `fixtures/feeds/*.xml` (RSS 2.0 e Atom) nel repository, con date fisse e casi sporchi; l'adapter dei feed legge i file con la stessa firma `SourceAdapter`.
- API di paper → `fixtures/arxiv/*.json`: adapter paper che legge la fixture, stessa firma `SourceAdapter`.
- API di modelli e dataset → `fixtures/hf/*.json`: adapter modelli su fixture, stessa firma.
- API di release e repository → `fixtures/github/*.json`: adapter release su fixture, stessa firma.
- LLM → `DeterministicLlmProvider` dietro la stessa interfaccia `LlmProvider`: dall'hash del contenuto a un testo fisso da tabelle deterministiche.
- Embeddings → `DeterministicEmbeddingProvider` dietro la stessa interfaccia `EmbeddingProvider`: dall'hash del contenuto a un vettore a dimensione fissa (PRNG seedato dall'hash).
- Consegna via server di posta reale → **MailHog** nel profilo Compose; la consegna si verifica leggendo la sua API HTTP locale (porta 8025).

Non esiste alcun adapter «custom URL»: dopo il redesign non resta nessun percorso configurabile verso la rete. Le sostituzioni sono totali, non alternative: il piano non promette alcuna modalità con sorgenti reali.

## 3. Architettura

```text
fixtures/feeds/*.xml ──┐
fixtures/arxiv/*.json ─┤
fixtures/hf/*.json ────┼─> adapter fixture (SourceAdapter) ─> Curator
fixtures/github/*.json ┘                                       ├─ normalizzazione
                                                               ├─ deduplicazione
                                                               ├─ scoring deterministico
                                                               ├─ scoring semantico (stub)
                                                               ├─ curatela (stub)
                                                               └─ rendering ─> Markdown / HTML
PostgreSQL ── worker (lock + scheduler idempotente)
MailHog    ── consegna email, verificata via API locale
API web    ── health, stato pipeline, archivio, anteprima
```

Stack: Python 3.12, FastAPI per API e health check, Typer per la CLI, SQLAlchemy 2 + Alembic per modelli e migrazioni, Pydantic Settings per la configurazione validata, APScheduler per il scheduling nel worker, Jinja2 per i template, PostgreSQL, MailHog, Docker Compose. Immagini Docker pinnate per tag; dipendenze Python pinnate nel lockfile.

Il servizio separa API web e worker logico, anche se inizialmente condividono lo stesso pacchetto. Una sola istanza del worker detiene un lock applicativo per impedire esecuzioni duplicate (§9).

## 4. Struttura del repository

```text
paper-feed/
├─ app/
│  ├─ api/                 # health, stato run, archivio, anteprima
│  ├─ cli/                 # sync, score, curate, render, deliver, run-pipeline
│  ├─ core/                # config, logging, errori, clock, lock
│  ├─ db/                  # modelli, repository, migrazioni Alembic
│  ├─ sources/             # adapter fixture: feeds, paper, modelli, release
│  ├─ pipeline/            # normalize, dedupe, score, curate, publish
│  ├─ providers/           # LLM ed embeddings: deterministici e disabled
│  ├─ rendering/           # view model, Jinja, sanitizzazione
│  └─ delivery/            # filesystem e MailHog
├─ fixtures/               # corpus offline: vedi §5
├─ templates/
├─ tests/
├─ config/                 # fonti e policy editoriali in YAML
├─ docker-compose.yml
├─ verify.sh
└─ pyproject.toml          # con lockfile
```

Le fonti dipendono da protocolli interni, non da implementazioni concrete: ogni adapter legge fixture, e le funzioni di dominio non conoscono né FastAPI né il formato dei file.

## 5. Corpus di fixture

Quattro famiglie, una per tipo di fonte, tutte nel repository e con formato dichiarato:

- `fixtures/feeds/*.xml` — RSS 2.0 e Atom, con campi `title`, `link`, `published`, `summary`, `author`;
- `fixtures/arxiv/*.json` — paper: `id`, `title`, `abstract`, `authors`, `published`, `url`, `categories`;
- `fixtures/hf/*.json` — modelli/dataset: `id`, `title`/`name`, `abstract`/`description`, `downloads`, `likes`, `published`;
- `fixtures/github/*.json` — release: `repo`, `tag`, `title`, `notes`, `published`, `url`.

Vincoli sul corpus:

- **date fisse**: ogni `published` ricade in una finestra dichiarata (2026-01-05 .. 2026-01-19 UTC); nessun timestamp viene generato a runtime;
- **casi sporchi deliberati**, ciascuno con identificatore documentato così che i test lo coprano per nome: duplicati esatti tra famiglie, quasi-duplicati (stesso contenuto, titolo diverso), titoli vuoti, date non parseabili, HTML nell'abstract, item senza identificatore esterno;
- il numero di item per famiglia è dichiarato nel `config/` così i contatori del `PipelineRun` sono verificabili per valore esatto.

## 6. Modello dati

Entità principali:

- `Source`: tipo, nome, puntatore alla fixture, configurazione JSON, stato, frequenza, ultimo cursore;
- `Item`: fonte, identificatore esterno, URL canonico, titolo, autori, abstract/testo, data di pubblicazione, lingua, metadati JSON, hash del contenuto normalizzato;
- `ItemIdentity`: chiavi di deduplicazione (DOI, ID paper, nome repository+dataset, repo e release tag);
- `Score`: componenti deterministiche, score semantico, score finale, versione della policy, motivazioni serializzate;
- `Digest`: intervallo temporale, stato, configurazione congelata, versione del template, output e checksum;
- `DigestItem`: posizione, sezione, item, nota editoriale, motivazione di selezione;
- `PipelineRun`: fase, tempi, contatori, stato, errore sanitizzato, correlation ID, idempotency key;
- `Delivery`: digest, canale, destinatario, tentativi, esito, timestamp, `Message-ID`.

Vincoli: unicità su `(source_id, external_id)`, indice su `published_at`, URL canonico indicizzato, digest immutabile dopo la pubblicazione, provenienza conservata per ogni campo derivato. Lo schema è versionato con migrazioni Alembic (§9).

## 7. Acquisizione e normalizzazione

Contratto comune, invariato rispetto all'architettura a servizi:

```python
class SourceAdapter(Protocol):
    async def fetch(self, cursor: str | None) -> FetchBatch: ...
```

`FetchBatch` contiene item grezzi, nuovo cursore, statistiche e warning. Il cursore dell'adapter su fixture è la posizione nel corpus (file + offset), quindi rieseguire `fetch` dallo stesso cursore restituisce lo stesso batch. Implementazioni richieste: `FeedFixtureAdapter`, `PaperFixtureAdapter`, `ModelFixtureAdapter`, `ReleaseFixtureAdapter`.

Normalizzazione obbligatoria: URL canonicalizzato, date in UTC, HTML convertito in testo sicuro, whitespace uniforme, autori strutturati, identificatori estratti, metadati originali conservati. Un item non normalizzabile (data rotta, senza identificatore) viene **scartato con warning tracciato** nel `PipelineRun`, mai eliminato in silenzio; il contatore degli scarti è parte dell'esito della fase.

## 8. Deduplicazione e scoring

Deduplicazione: controlli in ordine, ciascuno con esito spiegabile e soglia dichiarata:

1. identificatori forti: DOI, ID paper, nome repository+dataset, repo e release tag — match esatto;
2. URL canonico dopo rimozione dei parametri di tracking — match esatto;
3. hash del contenuto normalizzato — match esatto;
4. similarità titolo+autori ≥ 0.92 entro una finestra di 7 giorni → `possible_duplicate`;
5. similarità semantica (embedding stub) ≥ 0.95 come **segnale di supporto**: marca, non cancella.

I duplicati si raggruppano sotto un record canonico che conserva tutte le fonti; la scelta del canonico è deterministica (record più ricco, poi ordine stabile per fonte e identificatore). Ogni decisione produce una motivazione serializzata verificabile.

Scoring, riproducibile per versione di configurazione:

```text
final = w_rule * deterministic + w_semantic * semantic - penalties
```

Lo score deterministico (0–1) combina: corrispondenza con topic e keyword pesate, autorevolezza e tipo della fonte, recenza con decadimento temporale, segnali specifici (download, like, tipo di release). Bonus per diversità di sezione, penalità per duplicati e contenuti promozionali. Lo score semantico usa gli embedding dello stub (§2) contro profili editoriali configurabili (testo e topic positivi/negativi), con cache per hash del contenuto. La selezione impone quote e limiti per `papers`, `models`, `tools`, `industry` e `research_news`: nessuna fonte domina il digest.

## 9. Lock, scheduling, transazioni, schema

Reperti dell'audit resi vincoli verificabili:

- **Lock del worker**: lock su PostgreSQL (advisory lock oppure riga di lease con TTL) con meccanismo, timeout e comportamento da crash dichiarati: lease rinnovata a intervallo fisso, TTL 60 s; se il worker muore, la lease scade e un altro worker acquisisce; un secondo worker attivo esce senza eseguire. Due test obbligatori: worker concorrente rifiutato, lease scaduta acquisita.
- **Idempotency key**: ogni `PipelineRun` è identificato da `(finestra temporale, fase, versione policy)`; rieseguire una fase già completata non duplica record né output. L'ingest è idempotente su `(source_id, external_id)` e sull'hash del contenuto.
- **Retry policy**: tentativi limitati (max 3) con backoff fisso (1 s, 4 s) su fasi transazionali e consegna; una fonte in errore non blocca le altre. Nessun circuit breaker: non esistono endpoint remoti.
- **Transazioni della pipeline**: una transazione per fase; il fallimento di una fase marca il run `FAILED` con errore sanitizzato e lascia il database in stato consistente; il recovery riprende dalla fase interrotta grazie all'idempotency key.
- **Versionamento dello schema**: migrazioni Alembic versionate, `upgrade` su database vuoto in `verify.sh`; ogni migrazione ha `downgrade` testato.
- **Retention e backup come task verificabili**: `newsletter backup` produce un dump deterministico, `newsletter restore` ricrea lo stato su un database vuoto e il test confronta i contatori; la retention elimina i digest oltre la soglia configurata, con test sul numero di righe eliminate.

## 10. Provider deterministici

Due contratti distinti, invariati:

```python
class LlmProvider(Protocol):
    async def generate_structured(self, request: LlmRequest, schema: type[T]) -> T: ...

class EmbeddingProvider(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
```

Implementazioni richieste: `DeterministicLlmProvider` (SHA-256 del contenuto → selezione da tabelle fisse di titoli, sommari e note editoriali; output validato con Pydantic), `DeterministicEmbeddingProvider` (stesso hash → PRNG seedato → vettore a dimensione fissa, con cache per hash) e `DisabledProvider` (modalità senza curatela, per test e fallback). Nessuna implementazione raggiunge la rete: non esiste opzione configurabile con URL o modello esterno.

La curatela restituisce dati strutturati (titolo del digest, sommario, nota per item, sezione, motivazione); URL, autori, date e metriche sono sempre reinseriti dal database. Provider, versione delle tabelle deterministiche e parametri vengono salvati nel `Digest`.

## 11. Rendering e consegna

Prima un `DigestViewModel` indipendente dal formato; da questo:

- Markdown leggibile anche senza CSS;
- HTML responsivo con CSS incorporato, sanitizzato (nessun markup non fidato delle fixture sopravvive nel rendering);
- pagina web locale di archivio, dettaglio e anteprima.

Direzione editoriale: tipografia sobria, gerarchia chiara, palette neutra con un solo accento, citazioni delle fonti visibili, indice, sezioni, data, tempo di lettura, nessuna emoji.

Consegna: il canale filesystem usa scrittura atomica ed è sempre disponibile; il canale email consegna a MailHog e la verifica legge la sua API HTTP locale contando i messaggi per `Message-ID` stabile (derivato dal checksum del digest). Un digest già consegnato non viene reinviato senza flag esplicito; ogni tentativo è registrato in `Delivery`.

## 12. Configurazione e operatività

Fonti e policy editoriali in YAML versionabile; variabili d'ambiente solo per la connessione ai servizi Compose; `.env.example` privo di valori reali.

Comandi minimi:

```text
newsletter db upgrade
newsletter source sync [--source NAME]
newsletter pipeline run [--from DATE --to DATE] [--dry-run]
newsletter digest render DIGEST_ID
newsletter digest deliver DIGEST_ID [--dry-run]
newsletter backup | newsletter restore
newsletter doctor
```

`doctor` verifica database, presenza e integrità delle fixture (hash confrontato con un manifest), raggiungibilità di MailHog e directory di output — tutto locale, senza inviare nulla. Log JSON in produzione e leggibili in sviluppo; metriche minime: item acquisiti, scarti per fonte, duplicati, latenza per fase, consegne.

## 13. Compose e comandi

**Un solo comando di avvio**: `docker compose up --wait --build` — porta in stato healthy PostgreSQL, worker/curator, MailHog e API web, con migrazioni applicate al primo avvio e health check per ogni servizio.

**Un solo comando di verifica**: `./verify.sh` (§ Verify).

Lo sviluppo locale senza Compose (servizi Python contro il profilo Compose, test unitari senza container) è una modalità di sviluppo, **mai** la Definition of Done: il DoD è il profilo Compose completo.

## 14. Piano di implementazione

### M0 — Bootstrap, Compose e vertical slice (40, slice)

- Compose con PostgreSQL, worker/curator, MailHog e API web; `docker compose up --wait --build` porta tutti i servizi healthy;
- migrazioni Alembic versionate su database vuoto e health check dell'API;
- ingest delle fixture dalle quattro famiglie, deduplicazione base e rendering di un digest Markdown valido;
- `verify.json` con tutti gli id milestone del `meta.json`.

Esito: da ambiente pulito, un digest Markdown leggibile con un solo comando.

### M1 — Ingestione fixture e normalizzazione (12)

- adapter fixture con cursori e statistiche; ingest idempotente (`(source_id, external_id)` + hash);
- i casi sporchi del corpus vengono normalizzati o scartati con warning tracciato e contatore verificabile.

Esito: due sync consecutivi non duplicano record; ogni caso sporco ha un esito dichiarato e testato.

### M2 — Deduplicazione spiegabile (10)

- cinque controlli in ordine con soglie dichiarate; record canonico deterministico; motivazioni serializzate; stato `possible_duplicate`.

Esito: ogni decisione di deduplicazione è ricostruibile dal database.

### M3 — Scoring deterministico (10)

- policy versionata, componenti 0–1, quote per sezione, report dei componenti dello score per item.

Esito: lo stesso set di item produce lo stesso ranking a ogni run.

### M4 — Scoring semantico via provider stub (8)

- embedding deterministici con cache per hash, profili editoriali, contributo semantico isolato e riproducibile.

Esito: il punteggio semantico non dipende da alcun modello e produce lo stesso contributo a ogni run.

### M5 — Rendering Markdown e HTML sanitizzato (8)

- `DigestViewModel`, Markdown leggibile senza CSS, HTML responsivo sanitizzato, archivio e anteprima web.

Esito: nessun markup non fidato delle fixture sopravvive nell'HTML; output senza emoji.

### M6 — Lock del worker e scheduling idempotente (7)

- lock con lease/TTL e recovery da crash (test: worker concorrente rifiutato, lease scaduta acquisita);
- scheduler con misfire policy e ripresa dopo riavvio; run idempotenti per idempotency key.

Esito: «worker singolo» è un meccanismo osservabile, non un'affermazione.

### M7 — Consegna via MailHog (3)

- canale email verso MailHog, `Message-ID` stabile, verifica tramite la API locale, nessun reinvio senza flag.

Esito: la consegna è verificata contando i messaggi nella coda locale.

### M8 — Verifica e rerun byte-per-byte (2)

- `./verify.sh` end-to-end; due run sulle stesse fixture producono digest identici byte per byte, checksum incluso.

Esito: il determinismo è misurato, non assunto.

## 15. Strategia di test e Definition of Done

Test richiesti:

- unitari per canonicalizzazione, deduplica, scoring, quote e rendering;
- contrattuali per ogni adapter fixture e per i provider deterministici (stesso input ⇒ stesso output, incluso il vettore);
- integrazione su PostgreSQL reale nel profilo Compose;
- end-to-end dal corpus di fixture alla generazione Markdown/HTML e alla consegna MailHog;
- idempotenza: due run complete non duplicano record né consegne;
- determinismo: due digest consecutivi sulle stesse fixture sono identici byte per byte;
- lock: worker concorrente rifiutato, lease scaduta acquisita;
- sanitizzazione: HTML non fidato nelle fixture non sopravvive nel rendering;
- backup/restore e retention con contatori confrontati.

Definition of Done:

- `docker compose up --wait --build` avvia l'intero sistema offline da ambiente pulito;
- le quattro famiglie di fixture producono item normalizzati con scarti tracciati;
- deduplicazione e scoring espongono motivazioni verificabili e riproducibili;
- la pipeline funziona con i provider deterministici e in modalità disabled;
- Markdown e HTML sono coerenti, sanitizzati e privi di emoji;
- la consegna verso MailHog è verificata tramite la sua API locale;
- migrazioni, backup, ripristino e retention sono documentati e testati;
- `./verify.sh` passa in ambiente pulito entro 600 s e scrive `verify.json` con tutti gli id del `meta.json`.

## Verify

`./verify.sh`, non interattivo, timeout 600 s, exit 0 = pass. Sequenza:

1. `docker compose up --wait --build` — tutti i servizi healthy, migrazioni applicate su database vuoto;
2. suite pytest nel container: ingest idempotente sulle fixture (due run non duplicano record), deduplicazione, scoring, rendering, consegna su MailHog via API locale;
3. confronto byte-per-byte dei digest di due run consecutive sulle stesse fixture;
4. `docker compose down` — sempre, anche in caso di fallimento.

Al termine scrive `verify.json` (schema 1, `benchmark: "paper-feed"`) con tutti gli id milestone del `meta.json` (`M0`–`M8`), ciascuno con `pass` e `detail`.

Determinismo dichiarato: **due run sulle stesse fixture producono lo stesso digest byte per byte**, checksum incluso; è un'asserzione verificata dallo step 3, non un'assunzione.
