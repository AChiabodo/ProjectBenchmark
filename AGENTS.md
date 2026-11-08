# Benchmark

A collection of independent benchmark projects under `benchmarks/` (`breakout`, `match3`, `neon-vanguard`, `staticweb`, `tetroshift`, `wayline`, `paper-feed`), each with its own `PLAN.md`. Skills for these projects live in `.agents/skills/`.

## Benchmark contracts (C2+)

- Quando esegui uno step della suite C1–C10: i contratti canonici, l'inventario dei tier e la sequenza stanno in `docs/plans/README.md`.
- Quando scrivi o revisioni il Plan di un benchmark: il banner di vincolo verbatim è in `docs/agents/constraint-banner.md`; i pesi delle milestone vivono nel `meta.json` del benchmark.
- Quando assegni un punteggio: la regola è `docs/agents/scoring.md`, la sua definizione eseguibile è `scripts/score.mjs`.
- Quando scegli le skill di un run: l'allowlist per tier è in `docs/agents/skills-policy.md`, dichiarata nel `meta.json`.
- Quando ti chiedi perché la suite è offline-first e metadata-driven: le decisioni difficili da invertire stanno in `docs/adr/`.
- Quando modifichi i `meta.json` o aggiungi un benchmark: rigenera con `node scripts/index.mjs`; `node scripts/index.mjs --check` è il gate della suite.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `AChiabodo/ProjectBenchmark`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map to same-named labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and one `docs/adr/` at the repo root. See `docs/agents/domain.md`.
