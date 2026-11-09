# Benchmark suite

Ogni benchmark vive in `benchmarks/<id>/` e dichiara i propri contratti in `meta.json`: tier, lingua della spec, runtime, allowlist di skill e milestone pesate (fonte autorevole dei pesi, resa anche nel `PLAN.md`). I wording source T1 stanno in `benchmarks/staticweb/_wording-source/` e restano intatti: sono prompt prodotto, non Plan.

<!-- INDEX:START -->
| id | titolo | tier | runtime | impl | piano |
|----|--------|:----:|---------|------|-------|
| breakout | Breakout | T2 | native | C17 | PLAN.md |
| rulechat | RuleChat — deterministic conversational chatbot | T2 | container | Python | PLAN.md |
| staticweb-camels | StaticWeb — Cammelli (e-commerce vetrina) | T2 | browser | HTML, CSS, JavaScript | PLAN.md |
| staticweb-classic-cars | StaticWeb — Auto d'epoca (noleggio) | T2 | browser | HTML, CSS, JavaScript | PLAN.md |
| connect4-minimax | Connect4-Minimax — deterministic Connect Four search engine | T3 | dotnet | C# | PLAN.md |
| match3 | GemSwap (Match-3 Web) | T3 | browser | TypeScript | PLAN.md |
| rust-tui-editor | Rust TUI editor — headless-testable editor core | T3 | native | Rust | PLAN.md |
| staticweb-auction | StaticWeb — Aste virtuali online | T3 | browser | HTML, CSS, JavaScript | PLAN.md |
| staticweb-watches | StaticWeb — Orologi d'epoca | T3 | browser | HTML, CSS, JavaScript | PLAN.md |
| tetroshift | TetroShift / MorphoTetris | T3 | native | C++20 | PLAN.md |
| minilang | MiniLang — mini-language interpreter | T4 | native | Rust | PLAN.md |
| taskboard | Taskboard — board full stack on Docker Compose | T4 | container | TypeScript, SQL | PLAN.md |
| neon-vanguard | NEON VANGUARD | T5 | native | C++20 | PLAN.md |
| paper-feed | AI/ML Newsletter (paper-feed) | T5 | container | Python | PLAN.md |
| wayline | WAYLINE — L'Atlante Spezzato | T5 | browser | TypeScript | PLAN.md |

Wording source (T1, prompt prodotto, fuori dal punteggio della suite):

| file | titolo | tier |
|------|--------|:----:|
| cammelli.txt | Sito Web Statico Avanzato — Cammelli (IT) | T1 |
| cammelli_inglese.txt | Advanced Static Website — Camels (EN) | T1 |
| car_rental.txt | Sito Web Statico Multipagina — Noleggio Auto d'Epoca | T1 |
| online_auction.txt | Sito Web Statico Multipagina — Aste Virtuali Online | T1 |
| vintage_watches.txt | Sito Web Statico Multipagina — Orologi d'Epoca | T1 |
<!-- INDEX:END -->

La tabella e `benchmarks.json` sono generati: `node scripts/index.mjs` li rigenera, `node scripts/index.mjs --check` esce 1 se divergono dai `meta.json` (questo è il gate della suite). `--strict` rifiuta inoltre ogni `plan: null`. Il punteggio è definito in `docs/agents/scoring.md` ed è calcolato da `scripts/score.mjs`.
