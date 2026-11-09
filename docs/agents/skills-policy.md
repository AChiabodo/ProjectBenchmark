# Skill policy

È l'**unico** posto dove si decide quali skill un run può usare. L'allowlist è
dichiarata nel `meta.json` di ogni benchmark (`skills`), e `scripts/index.mjs`
la fa rispettare: una skill dichiarata deve esistere nel catalogo, e le skill
escluse sono rifiutate sempre, a ogni tier.

## Default per tier

Due run dello stesso benchmark usano le stesse skill: la allowlist è parte del
contratto, non una scelta del momento.

| tier | allowlist di default |
|---|---|
| T1–T2 | `implement`, `tdd`, `diagnosing-bugs`, `prototype`, `code-review` |
| T3 | default + `codebase-design`, `improve-codebase-architecture` |
| T4–T5 | default T3 + `to-spec`, `to-tickets`, `implement-spec`, `wayfinder` |

Un benchmark può dichiarare in più, nel proprio `meta.json`, solo skill che
esistono nella ** propria** cartella `.agents/skills/` del benchmark (es.
`build-raylib-c-games` per breakout): restano limitate a quel benchmark e non
entrano mai nel default di tier.

## Catalogo delle escluse

Escluse sempre, con la ragione; il gate le rifiuta in ogni `meta.json`:

| skill | ragione |
|---|---|
| `research` | raggiunge la rete: viola il vincolo runtime del banner |
| `wizard` | infrastruttura solo-operatore umano, fuori dal benchmark |
| `grill-me`, `grill-with-docs`, `grilling` (prefisso `grill-*`) | interviste all'operatore: rompono «una sessione, un host» |
| `ask-matt` | intervista all'operatore: stessa ragione delle `grill-*` |
| `to-questionnaire` | questionari all'operatore: stessa ragione |
| `handoff` | passaggio di sessione: il benchmark è una sessione sola |
| `setup-matt-pocock-skills` | setup d'infrastruttura privata, irrilevante per il run |
