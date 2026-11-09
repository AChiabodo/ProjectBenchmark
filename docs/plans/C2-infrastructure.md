# C2 — Infrastruttura della suite

**Obiettivo:** esistono i contratti (banner, metadati, scoring, skill policy, indice) e
l'indice è rigenerabile. Da qui in poi ogni benchmark revisionato si limita a rispettarli.

**Prerequisiti:** C1 chiuso all'`git mv` e i path già veri.

## Step

1. **`docs/agents/constraint-banner.md`** — il testo canonico del banner nelle due varianti
   IT ed EN, secondo i blocchi obbligatori di `docs/plans/README.md` §1. È il file a cui i
   `PLAN.md` si conformano; nessun Plan parafrasa il banner per conto proprio.
2. **`docs/agents/scoring.md`** — regole §4 dell'overview: somma pesi, cancello slice,
   tier neutro, claim non verificati = 0, media sugli attempted + metrica di ampiezza,
   `RESULT.md` obbligatorio. Includi un esempio numerico completo (benchmark da 100 con
   slice 40, meta senza slice superati → punteggio 40).
3. **`docs/agents/skills-policy.md`** — allowlist per tier e catalogo delle skill escluse con
   la ragione di ciascuna (§5). È l'unico posto dove si decide quali skill un run può usare.
4. **`meta.json` per i 12 benchmark esistenti**: i 6 spostati in C1 (`breakout`, `match3`,
   `tetroshift`, `neon-vanguard`, `wayline`, `paper-feed`) più i 4 StaticWeb, che qui ricevono
   solo il proprio stub `benchmarks/staticweb/<nome>/` con `meta.json` e `plan: null`
   temporaneo (il `PLAN.md` arriva in C9).
   **Wording source**: i 5 `.txt` stanno flat in `benchmarks/staticweb/_wording-source/`,
   quindi non serve un `meta.json` per file: crea `_wording-source/index.meta.json` con un
   array `entries` di `{ file, title, tier: 1, kind: "wording-source" }`.
   Campi completi secondo lo schema §2. Le milestone iniziali sono quelle che il `PLAN.md`
   dichiara già oggi, con i pesi che C3–C8 dovranno comunque rivedere; se il Plan non ha
   milestone usa un segnaposto `M0: 100` e registra il caso nell'`AUDIT.md` dello step
   successivo — non inventare contenuto che il piano non contiene.
5. **`benchmarks/README.md`** — intestazione, tabella dentro i marker `<!-- INDEX:START -->`
   / `<!-- INDEX:END -->`, e una riga che spiega come rigenerare.
6. **`scripts/index.mjs`** — Node 22, zero dipendenze (`node:fs`, `node:path`, `node:url`).
   Legge `benchmarks/*/meta.json` più `_wording-source/index.meta.json`, valida §2, scrive
   `benchmarks.json` e la tabella. Flag `--check`: rigenera in memoria e fallisce con exit 1
   se differisce da ciò che è su disco. Errori leggibili per `id`, mai stack trace come unico
   output. Ordina per `tier`, poi `id`.
7. **`benchmarks.json`** — generato dallo script, committato.
8. **4 ADR** in `docs/adr/`, formato della skill `domain-modeling`:
   - `0001-external-requests-runtime-only.md` — rete vietata a runtime, dipendenze build-time
     pinnate (trade-off: riproducibilità offline vs. realismo delle pipeline);
   - `0002-weighted-milestones-gated-by-verify-json.md` — punteggio proporzionale, cancello
     slice, `verify.json` come unica prova (trade-off: parzialità vs. onestà del punteggio);
   - `0003-offline-paper-feed-fixtures.md` — fixture al posto delle fonti reali, MailHog al
     posto di SMTP (trade-off: si perde l'integrazione vera, si guadagna determinismo);
   - `0004-benchmarks-directory-with-generated-index.md` — `benchmarks/` + `meta.json` +
     indice generato (trade-off: rinomina massiva vs. indicizzazione verificabile).
9. **Archivia `REVIEW.MD`**: `git mv` in `docs/archive/REVIEW-2026-08-20.md`, invariato,
   con una riga in testa che dichiara lo stato (storico; i reperti migrano in
   `benchmarks/<id>/AUDIT.md` durante C3–C9).
10. **`AGENTS.md`**: aggiungi i pointer per `docs/plans/README.md`, `docs/agents/scoring.md`,
    `docs/agents/skills-policy.md`, `docs/agents/constraint-banner.md`, `docs/adr/`.
    Frasi corte, con il trigger esplicito ("quando revisioni un benchmark", "quando assegni
    un punteggio"), non un catalogo.

## Acceptance

- `node scripts/index.mjs --check` esce 0; `node scripts/index.mjs` senza flag non modifica
  nulla (`git status --porcelain` vuoto).
- Rompendo di proposito un `meta.json` di prova (pesi ≠ 100) lo script esce 1, nomina l'`id`
  e indica il campo: verificalo, poi ripristina.
- `benchmarks.json` contiene 12 benchmark + 5 wording source; ogni `id` benchmark ha una
  directory corrispondente, ogni file dei wording source esiste davvero.
- Ogni `meta.json` ha `Σ weight == 100` e `Σ slice ∈ [30,50]`, o è `kind: wording-source`
  senza milestone.
- Esistono i 4 ADR, i 3 file `docs/agents/`, `REVIEW.MD` non è più alla root e
  `docs/archive/REVIEW-2026-08-20.md` è byte-identico all'originale più la riga di stato.
- `AGENTS.md` non contiene più path pre-C1 e i nuovi pointer risolvono a file esistenti.

## Fuori scope

Riscrivere i `PLAN.md` esistenti (C3–C9), creare i Plan nuovi (C10), validazione visuale dei
`.txt`. Le cartelle StaticWeb stub esistono ma senza `PLAN.md`: lo script deve accettare
`plan: null` **solo** per loro e fallire su questo stato da C9 in poi (aggiungi il
`--strict` che C9 renderà definitivo).
