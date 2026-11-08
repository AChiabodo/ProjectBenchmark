# C1 — Rinomina in `benchmarks/`

**Obiettivo:** normalizzare layout e id senza toccare un byte di contenuto. Commit isolato,
quasi tutto `git mv`, così la review è meccanica e il rename detection conserva la storia.

**Prerequisiti:** nessuno. È il primo step.

## Step

1. Crea `benchmarks/`.
2. Sposta, con `git mv` (mai copia+delete):

   | ora | dopo |
   |---|---|
   | `Breakout/` | `benchmarks/breakout/` |
   | `Match3/` | `benchmarks/match3/` |
   | `Tetris/` | `benchmarks/tetroshift/` |
   | `NEON VANGUARD/` | `benchmarks/neon-vanguard/` |
   | `WAYLINE/` | `benchmarks/wayline/` |
   | `paper-feed/` | `benchmarks/paper-feed/` |
   | `StaticWeb/` | `benchmarks/staticweb/` |

3. Dentro `benchmarks/staticweb/` crea `_wording-source/` e sposta lì i 5 file `.txt` con
   `git mv`, **senza rinominarli né modificarli**. Non creare ancora le sub-directory dei
   4 benchmark: sono lavoro di C9.
4. Aggiorna i path nei documenti che li citano, e solo nei path:
   - `AGENTS.md` (elenco progetti nel primo paragrafo);
   - `REVIEW.MD` (intestazioni di sezione che nominano le cartelle — resta alla root fino a
     C2, quindi i path devono essere già veri);
   - `GLOSSARY.md` no (nessun path).

## Acceptance

- `git log --stat -1` mostra solo rename (`R`), nessun contenuto riscritto: `git diff -M --stat`
  riporta 100% similarity su ogni file, eccezione ammessa solo i path dentro `AGENTS.md` e
  `REVIEW.MD`.
- `git ls-files | grep -E '^(Breakout|Match3|Tetris|WAYLINE|paper-feed|StaticWeb)/'` è vuoto.
- `ls benchmarks/` elenca i 7 nomi kebab-case e nessun altro benchmark.
- Per i 5 `.txt`: `git diff -M` non mostra alcuna modifica né di nome né di contenuto.
- `grep -rn "NEON VANGUARD/\|WAYLINE/\|Tetris/" AGENTS.md REVIEW.MD` non trova più path
  vecchi.

## Fuori scope

Nessuna riscrittura di `PLAN.md`, nessun `meta.json`, nessun audit, nessun nuovo benchmark,
nessun tocco a `.agents/` o `skills-lock.json`.
