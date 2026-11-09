# C8 — `paper-feed` (redesign offline)

**Obiettivo:** il benchmark servizi/DB/scheduler più interessante della suite oggi viola i
vincoli (arXiv, Hugging Face, GitHub, RSS via Miniflux, LLM/embeddings, SMTP reale).
Diventa offline e deterministico **senza perdere la pipeline**: è l'unico "molti servizi +
Compose" oltre a `taskboard`.

**Prerequisiti:** C2. `AUDIT.md` iniziale = sezione 4 dell'archivio.

## Step

1. **Banner** IT in testa, e rimuovi dal piano ogni promessa di integrazione remota.
2. **Sostituzioni offline** (una per riga nel piano, con la stessa interfaccia adapter):
   - Miniflux → **rimosso**; il corpus di fixture RSS/Atom entra nel repo
     (`fixtures/feeds/*.xml`, `fixtures/arxiv/*.json`, `fixtures/hf/*.json`, `fixtures/github/*.json`)
     con date fisse e casi sporchi (duplicati, titoli vuoti, date rotte, HTML nell'abstract);
   - adapter HTTP esterni → adapter che leggono fixture, stessa firma; il piano non promette
     più network;
   - LLM/embeddings → **stub deterministici** dietro le stesse interfacce: un provider
     "deterministico" che produce riassunti e vettori fissi dalla fixture (hash → testo/embedding),
     così tutta la pipeline resta esercitabile e testabile senza modelli;
   - SMTP → **MailHog** nel profilo Compose; consegna verificabile leggendo la sua API locale.
3. **Compose**: profilo primario unico `docker compose up --wait` = Postgres + worker/curator +
   MailHog (+ API web). Il piano deve dichiarare un solo comando di avvio e un solo comando di
   verifica; niente varianti "eseguibile anche localmente senza compose" come percorso
   principale (può restare come modalità di sviluppo, non come DoD).
4. **Milestone e pesi**: bootstrap+compose, ingest fixture + normalizzazione, dedupe,
   scoring deterministico, scoring semantico (stub), rendering Markdown/HTML, lock + scheduling
   idempotente, delivery MailHog, API/health, migrazioni DB. Slice = `up --wait` + ingest
   fixture + dedupe + rendering di un digest Markdown valido + `verify.json`.
5. **Reperti residui** dall'audit che restano validi anche offline: lock del worker (meccanismo,
   timeout, crash), idempotency key, retry policy, transazioni della pipeline, versionamento
   dello schema DB, retention/backup come task verificabili. I reperti su SSRF, prompt
   injection e limiti di costo LLM diventano `obsolete` per assenza di rete/modelli: dichiaralo
   nel `AUDIT.md`, non lasciarli come requisiti orfani.
6. **`verify`**: `./verify.sh` = `docker compose up --wait` + migrazioni + suite pytest
   (ingest idempotente su fixture, dedupe, scoring, rendering, delivery su MailHog) + `down`.
   Determinismo: due run sulle stesse fixture producono lo stesso digest byte per byte.
7. **`AUDIT.md`**: reperti §4 con stato, più i nuovi (assenza di contratto verify, determinismo,
   profilo Compose unico).

## Acceptance

- `grep -ri "miniflux\|arxiv.org\|huggingface.co\|github.com/api\|smtp.<dominio>" PLAN.md`
  non trova promesse di rete; le fixture sono citate e hanno un formato dichiarato.
- Esiste un solo comando di avvio e uno di verifica, entrambi nel piano.
- `Σ weight == 100`, slice nel range, id nel piano, `node scripts/index.mjs --check` esce 0.
- Ogni reperto §4 ha stato; quelli resi obsoleti hanno la motivazione.
- Il piano dichiara l'equivalenza byte-per-byte fra due run sulle stesse fixture.

## Fuori scope

Fare girare sorgenti reali, autenticazione multiutente, deploy, invio email reale, integrare
modelli veri.
