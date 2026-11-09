# C5 — `tetroshift` (ex `Tetris`, alleggerimento)

**Obiettivo:** il piano è già stato chiuso con successo da più modelli usando sub-agent: non si
taglia il gameplay. Si tolgono solo le tre escrescenze che nessuno ha mai chiesto e si aggiunge
ciò che manca alla suite.

**Prerequisiti:** C2. `AUDIT.md` nasce qui: il piano non è mai stato recensito.

## Step

1. **Banner** IT in testa.
2. **Alleggerimento chirurgico** (solo questi tre punti):
   - griglie esagonali e radiali: spostale dai pilastri ai **Non-obiettivi**, mantenendo
     l'interfaccia astratta `IGrid` come struttura (costa poco ed è ciò che rende il piano
     interessante), ma senza richiedere alcuna implementazione non ortogonale;
   - fisica: Spring-Mass / Verlet guida **solo il juice visivo** (squish, wobble, screenshake,
     rimbalzo estetico), **non** le collisioni logiche né lo stato canonico del pezzo. Riscrivi
     §4.1 di conseguenza, con un test che prova che la logica ignora la fisica;
   - Emscripten/WebAssembly: esplicito non-obiettivo.
3. **Milestone e pesi**: ricava la tabella dal piano attuale (bootstrap, core tetromino +
   griglia ortogonale, lock/clear/score, FSM stati, draft carte + modificatori, shop/economia,
   juice/render, audio, test). Slice = pezzo che cade, rotazione, lock, line clear, game over
   con FSM valida. Aggiorna `meta.json`.
4. **`verify`**: `./verify.sh` = build + CTest headless sul core logico + un test che dimostra
   l'indipendenza della fisica dalla logica; finestra mai lanciata.
5. **Appendice toolchain** informativa (MSVC v18/Ninja/CMake 3.24+/raylib FetchContent).
6. **`AUDIT.md` nuovo**: reperti da zero — almeno: assenza di contratti `verify`, roadmap non
   pesata, ambiguità fisica/logica, scope carte non quantificato, nessun criterio di
   determinismo nei draft di carte (seed?). Ogni reperto con stato e destinazione (piano di
   questo step o deferito con motivo).

## Acceptance

- I tre punti del §2 sono applicati e verificabili con grep ("Non-obiettivi", "esagonal",
  "Emscripten", "juice"); il piano non promette più griglie non ortogonali come feature.
- `Σ weight == 100`, slice nel range, ogni id presente nel `PLAN.md`,
  `node scripts/index.mjs --check` esce 0.
- Il Plan contiene una sezione che dichiara la logica indipendente dalla fisica e il test che
  lo prova.
- `AUDIT.md` esiste con almeno 5 reperti, ciascuno con stato.
- Nessun taglio a roguelike, carte, shop, FSM, audio.

## Fuori scope

Ridurre il gameplay, cambiare stack, aggiungere modalità.
