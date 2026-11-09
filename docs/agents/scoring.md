# Regola di punteggio

Definita una volta sola qui (§4 dell'overview in `docs/plans/README.md`); la sua
definizione eseguibile è `scripts/score.mjs`. Chi assegna un punteggio non
decide nulla a mano: applica questa pagina.

## Punteggio per benchmark (0–100)

- Il punteggio è la **somma dei pesi delle milestone con `pass: true`** in
  `verify.json`. I pesi vivono solo in `meta.json`: la tabella nel `PLAN.md` è
  una resa, non una fonte.
- **Vertical slice come cancello**: se una milestone `slice: true` fallisce, il
  punteggio si ferma alla **somma dei soli pesi slice superati**; nessun credito
  per il lavoro oltre la slice, per quanto funzionante. La slice va superata
  prima che qualsiasi contenuto stretch venga valutato.
- Il **tier non modifica il punteggio**: segmenta soltanto la classifica.
- **Claim non verificati valgono 0**: conta solo il `verify.json` confermato
  dall'harness. `RESULT.md` è obbligatorio (modello, wall-clock, turni, token,
  verdetto) ma non vale punti.

## Punteggio di suite

- Media sui benchmark **tentati**, non sul totale dell'inventario, così chi
  completa bene 3 benchmark non è falsato contro chi ne apre 17.
- Una metrica separata di ampiezza conta i **benchmark chiusi**; le due misure
  si leggono insieme, mai sommate.

## Stato attuale

Il punteggio **per benchmark** è già eseguibile: `scripts/score.mjs` legge il
`verify.json` e il `meta.json` e applica la regola qui sopra. Il **punteggio di
suite** (media sui benchmark tentati più la metrica di ampiezza) è definito in
questa pagina e per ora si aggrega a mano, perché non esiste un run store da
cui leggere i risultati di più run: finché non c'è, chi pubblica un punteggio di
suite dichiara la media e l'ampiezza calcolate a mano. È un buco noto, non un
requisito nascosto.

## Esempio numerico completo

Benchmark da 100 punti con una milestone slice: `M0` peso 40 (`slice: true`),
`M1` peso 35, `M2` peso 25 (entrambe non slice).

| verify.json | calcolo | punteggio |
|---|---|---:|
| `M0` pass, `M1`/`M2` fail | nessuna slice fallita: 40 | **40** |
| `M0` fail, `M1`/`M2` pass | slice fallita: cap = pesi slice superati = 0; i 60 punti non slice non contano | **0** |
| tutto pass | 40 + 35 + 25 | **100** |

Il caso centrale è il cancello: una slice da 40 superata con tutto il resto da
finire vale **40**; la stessa slice fallita con tutto il resto finito vale **0**,
non 40 e non 60. Con più milestone slice, il cap è la somma dei pesi delle sole
slice superate (esempio vivo: `scripts/fixtures/verify-slice-failed.json`, dove
slice 10+25 con la prima passata e la seconda fallita dà punteggio 10, ignorando
i 65 punti di credito grezzo oltre la slice).

> Nota: la cap QUI definita è «somma dei pesi slice superati», come da issue #3
> e README §4, che vincolano il piano di step C2. Qualunque lettura in cui una
> slice fallita conservi comunque il proprio peso è esclusa.

## Contratto di `verify.json` (validato da `scripts/score.mjs`)

- `schema: 1`, `benchmark` uguale all'id del `meta.json`,
  `milestones` come array di `{id, pass, detail}`, `notes` opzionale.
- Ogni id milestone del `meta.json` compare **esattamente una volta**; id
  sconosciuti o duplicati sono violazioni.
- Un eventuale campo `weight` in una voce di `verify.json` deve coincidere con
  il `meta.json`: una divergenza è una violazione, non un dato a scelta.
- L'exit code di `./verify.sh` (passato con `--exit N`) deve concordare con il
  file: exit 0 se e solo se tutte le milestone sono superate. Il disaccordo è
  una violazione **riportata**, mai risolta in silenzio.

Ogni violazione è una riga che nomina il benchmark e il campo; lo score non
viene prodotto su input non validi. `node scripts/score.mjs --self-test`
esegue la definizione eseguibile del contratto sui fixture committati.
