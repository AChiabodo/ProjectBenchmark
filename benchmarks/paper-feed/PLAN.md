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
| M0 | 15 | sì | Fondazioni e persistenza |
| M1 | 20 | sì | Ingestione e deduplicazione |
| M2 | 25 | — | Ranking e selezione |
| M3 | 25 | — | Curatela e pubblicazione |
| M4 | 15 | — | Scheduler, UI minima e hardening |
# Piano tecnico di sviluppo: AI/ML Newsletter

## 1. Obiettivo e principi

Realizzare un sistema self-hosted che raccolga contenuti su AI e Machine Learning, li normalizzi, deduplichi e ordini per rilevanza, quindi produca un digest editoriale in Markdown e HTML. La consegna via SMTP è opzionale; il prodotto deve restare utilizzabile anche solo tramite file locali o interfaccia web.

Principi vincolanti:

- scheduling, persistenza, scoring, curatela e rendering devono funzionare senza servizi di automazione esterni;
- Miniflux gestisce feed RSS/Atom, stato di lettura e aggiornamento delle fonti;
- un servizio Python gestisce arXiv, Hugging Face, GitHub e API personalizzate, oltre alla pipeline editoriale;
- ogni passaggio deve essere ripetibile, osservabile e idempotente;
- SQLite deve essere supportato per sviluppo e installazioni minime; PostgreSQL è il target consigliato per uso continuativo;
- l'uso di un LLM deve essere sostituibile e degradabile: la raccolta e un digest basilare devono funzionare anche senza LLM;
- UI e output non devono contenere emoji e devono adottare uno stile professionale-editoriale.

## 2. Architettura proposta

```text
RSS / Atom ───────────────> Miniflux ───────┐
                                            │
arXiv / Hugging Face / GitHub / Custom API ─┼─> Python Curator
                                            │    ├─ normalizzazione
                                            │    ├─ deduplicazione
                                            │    ├─ scoring deterministico
                                            │    ├─ scoring semantico
                                            │    ├─ curatela LLM opzionale
                                            │    └─ rendering
                                            │
                                            └─> SQLite / PostgreSQL
                                                     │
                                                     ├─> Markdown
                                                     ├─> HTML / UI locale
                                                     └─> SMTP opzionale
```

Stack raccomandato:

- Python 3.12, FastAPI per API amministrative e health check, Typer per CLI;
- SQLAlchemy 2 e Alembic per portabilità e migrazioni;
- Pydantic Settings per configurazione validata;
- `httpx` con timeout, retry limitati e backoff per integrazioni HTTP;
- APScheduler nel processo worker per scheduling locale persistente;
- Jinja2 per template Markdown e HTML;
- Miniflux e PostgreSQL in Docker Compose; servizio Python eseguibile sia in Compose sia localmente;
- embeddings e LLM dietro interfacce indipendenti dal provider.

Il servizio deve separare API web e worker logico, anche se inizialmente possono condividere lo stesso pacchetto e container. Una singola istanza del worker deve detenere un lock applicativo per impedire esecuzioni duplicate.

## 3. Struttura del repository

```text
ai-ml-newsletter/
├─ app/
│  ├─ api/                 # health, run status, preview, amministrazione
│  ├─ cli/                 # sync, score, curate, render, deliver, run-pipeline
│  ├─ core/                # config, logging, errori, clock, lock
│  ├─ db/                  # modelli, repository, migrazioni
│  ├─ sources/             # miniflux, arxiv, huggingface, github, custom
│  ├─ pipeline/            # normalize, dedupe, score, curate, publish
│  ├─ providers/           # LLM ed embeddings
│  ├─ rendering/           # view model, Jinja, sanitizzazione
│  └─ delivery/            # filesystem e SMTP
├─ templates/
├─ tests/
├─ config/
├─ docker-compose.yml
├─ .env.example
└─ pyproject.toml
```

Le integrazioni devono dipendere da protocolli interni, non da implementazioni concrete. Le funzioni di dominio non devono conoscere FastAPI, il client Miniflux o il provider LLM.

## 4. Modello dati minimo

Entità principali:

- `Source`: tipo, nome, URL o identificatore, configurazione JSON, stato, frequenza, ultimo cursore;
- `Item`: fonte, identificatore esterno, URL canonico, titolo, autori, abstract/testo, data di pubblicazione, lingua, metadati JSON, hash del contenuto;
- `ItemIdentity`: chiavi di deduplicazione quali DOI, arXiv ID, repository e release ID;
- `Score`: componenti deterministiche, score semantico, score finale, versione della policy e motivazioni serializzate;
- `Digest`: intervallo temporale, stato, configurazione congelata, versione del template, output e checksum;
- `DigestItem`: posizione, sezione, item, nota editoriale, motivazione di selezione;
- `PipelineRun`: fase, tempi, contatori, stato, errore sanitizzato e correlation ID;
- `Delivery`: digest, canale, destinatario o destinazione, tentativi, esito e timestamp.

Vincoli importanti: unicità su `(source_id, external_id)`, indice su `published_at`, URL canonico indicizzato, digest immutabile dopo la pubblicazione. Conservare la provenienza di ogni campo derivato.

## 5. Acquisizione e normalizzazione

Definire un contratto comune:

```python
class SourceAdapter(Protocol):
    async def fetch(self, cursor: str | None) -> FetchBatch: ...
```

`FetchBatch` contiene item grezzi, nuovo cursore, statistiche e warning. Ogni adapter traduce in un `NormalizedItem` validato, senza scrivere direttamente nel database.

Implementazioni iniziali:

1. `MinifluxAdapter`: usa l'API di Miniflux, importa solo entry nuove o modificate e conserva feed, categorie e stato;
2. `ArxivAdapter`: query configurabili per categorie e parole chiave, con rispetto dei limiti del servizio;
3. `HuggingFaceAdapter`: modelli, dataset o paper filtrati per tag, data e popolarità;
4. `GitHubAdapter`: release e repository monitorati; autenticazione opzionale tramite token;
5. `JsonApiAdapter`: mapping dichiarativo da payload JSON a campi normalizzati, per fonti personalizzate semplici.

Normalizzazione obbligatoria: URL canonicalizzato, date in UTC, HTML convertito in testo sicuro, whitespace uniforme, autori strutturati, identificatori estratti e metadati originali conservati. Credenziali e header sensibili non devono finire nei log o nel database.

## 6. Deduplicazione

Applicare i controlli in ordine, producendo sempre una spiegazione verificabile:

1. corrispondenza esatta di identificatori forti: DOI, arXiv ID, URL Hugging Face, repository e release tag;
2. URL canonico dopo rimozione dei parametri di tracking;
3. hash del contenuto normalizzato;
4. similarità di titolo e autori entro una finestra temporale configurabile;
5. similarità semantica solo come segnale di supporto, mai come cancellazione automatica non tracciata.

Gli item duplicati devono essere raggruppati sotto un record canonico conservando tutte le fonti. Preferire il record più ricco e autorevole, con regole deterministiche. Prevedere una soglia `possible_duplicate` per revisione o diagnosi.

## 7. Relevance scoring

Lo score finale deve essere riproducibile per versione di configurazione:

```text
final = w_rule * deterministic + w_semantic * semantic - penalties
```

Score deterministico, normalizzato tra 0 e 1:

- corrispondenza con topic e keyword pesate;
- autorevolezza e tipo della fonte;
- recenza con decadimento temporale;
- segnali specifici: citazioni disponibili, download, like, stelle, trend o tipo di release;
- bonus per diversità di sezione e penalità per duplicati, contenuti promozionali o copertura ripetitiva.

Score semantico:

- embedding del titolo più abstract/testo breve;
- confronto con profili editoriali configurabili, ciascuno descritto da testo e topic positivi/negativi;
- cache degli embedding per hash, nome del modello e versione del preprocessing;
- provider locale o remoto intercambiabile; batching e dimensione del vettore validati.

La selezione deve imporre quote e limiti configurabili per `papers`, `models`, `tools`, `industry` e `research_news`, evitando che una sola fonte domini il digest.

## 8. Astrazione LLM ed embeddings

Definire due contratti distinti:

```python
class LlmProvider(Protocol):
    async def generate_structured(self, request: LlmRequest, schema: type[T]) -> T: ...


class EmbeddingProvider(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
```

Implementazioni iniziali:

- `OpenAICompatibleProvider`: `base_url`, `api_key`, `model`, header aggiuntivi, timeout e opzioni modello configurabili. Deve funzionare con endpoint OpenAI-compatible/OpenAI-like locali o remoti, incluso opencode-go quando espone il relativo contratto;
- `OllamaProvider`: adapter opzionale per API native, senza renderlo il percorso privilegiato;
- `DisabledProvider`: modalità senza LLM, utile per test e fallback;
- equivalenti provider embeddings, separati dal modello di generazione.

Non assumere URL, nomi modello o capacità implicite. Le capability devono essere configurate o rilevate: JSON Schema/structured output, tool calling, lunghezza del contesto e API embeddings. Per provider senza structured output nativo, validare la risposta con Pydantic e consentire un solo tentativo di riparazione controllata.

La curatela LLM riceve solo item già filtrati e deve restituire dati strutturati: titolo del digest, sommario, nota per item, sezione e motivazione. Non può inventare fatti non presenti nel contenuto fornito; URL, autori, date e metriche vengono sempre reinseriti dal database. Salvare provider, modello, prompt version e parametri, senza memorizzare segreti.

## 9. Rendering, UI e consegna

Costruire prima un `DigestViewModel` indipendente dal formato. Da questo generare:

- Markdown leggibile anche senza CSS;
- HTML responsivo con CSS incorporato e compatibile con client email;
- pagina web locale di archivio, dettaglio e anteprima.

Direzione editoriale: tipografia sobria, gerarchia chiara, palette neutra con un solo colore d'accento, densità informativa controllata, citazioni delle fonti visibili, nessuna emoji. Evitare dashboard decorative; privilegiare indice, sezioni, data, tempo di lettura e motivazioni concise.

La consegna filesystem è sempre disponibile e usa scrittura atomica. SMTP è un plugin configurabile con TLS, mittente, destinatari e modalità dry-run. Un digest già consegnato non deve essere reinviato senza flag esplicito; usare `Message-ID` stabile e registrare l'esito.

## 10. Configurazione e operatività

Usare file YAML versionabile per fonti e policy editoriali; usare variabili d'ambiente o secret file per credenziali. Fornire `.env.example` privo di valori reali.

Comandi minimi:

```text
newsletter db upgrade
newsletter source sync [--source NAME]
newsletter pipeline run [--from DATE --to DATE] [--dry-run]
newsletter digest render DIGEST_ID
newsletter digest deliver DIGEST_ID [--dry-run]
newsletter doctor
```

`doctor` verifica database, Miniflux, provider LLM/embeddings, directory di output e SMTP senza inviare email. Log JSON in produzione e leggibili in sviluppo; metriche minime: item acquisiti, errori per fonte, duplicati, latenza per fase, token/chiamate LLM e consegne.

## 11. Piano di implementazione

### Fase 1: fondazioni e persistenza

- inizializzare package, configurazione, logging, modelli SQLAlchemy e migrazioni;
- preparare Compose con Miniflux, PostgreSQL e servizio Python;
- implementare CLI, health check, repository e `PipelineRun`;
- verificare avvio pulito sia con SQLite sia con PostgreSQL.

Esito: schema migrabile, servizi healthy e pipeline vuota idempotente.

### Fase 2: ingestione e deduplicazione

- implementare Miniflux, arXiv, Hugging Face e GitHub;
- aggiungere normalizzazione, cursori, retry e deduplicazione spiegabile;
- introdurre fixture registrate e test contrattuali per ogni adapter.

Esito: due esecuzioni consecutive non duplicano record e un errore di fonte non blocca le altre.

### Fase 3: ranking e selezione

- implementare policy deterministica versionata e report dei componenti dello score;
- aggiungere embeddings, profili semantici, cache e fallback;
- applicare quote editoriali e comporre il set candidato.

Esito: ranking riproducibile su fixture e digest bilanciato anche con embeddings disabilitati.

### Fase 4: curatela e pubblicazione

- implementare provider OpenAI-compatible, Ollama opzionale e modalità disabled;
- creare prompt versionati, output Pydantic e protezioni contro dati inventati;
- generare Markdown e HTML, archivio locale e consegna filesystem;
- aggiungere SMTP dry-run e invio idempotente.

Esito: lo stesso set candidato produce un digest valido, tracciabile e renderizzato senza dipendere da un provider specifico.

### Fase 5: scheduler, UI minima e hardening

- attivare scheduler interno con lock, misfire policy e recupero dopo riavvio;
- aggiungere UI di archivio, stato pipeline, preview e rilancio controllato;
- completare limiti, sanitizzazione, retention, backup e documentazione operativa.

Esito: esecuzione continuativa in Compose, diagnosi autonoma e ripristino documentato.

## 12. Strategia di test e criteri di completamento

Test richiesti:

- unitari per canonicalizzazione, deduplica, scoring, quote e rendering;
- contrattuali per adapter e provider tramite server HTTP simulato;
- integrazione su SQLite e PostgreSQL reale;
- end-to-end dalla fixture di fonti alla generazione Markdown/HTML;
- snapshot semantici limitati alla struttura, evitando test fragili sul testo LLM;
- test di sicurezza su HTML non fidato, secret redaction, SSRF nelle fonti personalizzate e header injection SMTP;
- smoke test del Compose dopo riavvio e verifica dell'idempotenza.

Definition of Done iniziale:

- una singola configurazione avvia l'intero sistema self-hosted;
- RSS tramite Miniflux e almeno tre adapter diretti producono item normalizzati;
- deduplicazione e scoring espongono motivazioni verificabili;
- la pipeline funziona con provider OpenAI-compatible, con Ollama opzionale e senza LLM;
- Markdown e HTML sono coerenti, accessibili, privi di emoji e sanitizzati;
- SMTP è opzionale, testabile in dry-run e non causa invii duplicati;
- migrazioni, backup, ripristino, configurazione e troubleshooting sono documentati;
- test automatici e smoke test Compose passano in ambiente pulito.
