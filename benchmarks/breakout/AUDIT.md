# AUDIT — breakout

Audit locale del Benchmark `breakout`, aperto in C3. I reperti della prima tabella
provengono dalla sezione 1 di `docs/archive/REVIEW-2026-08-20.md` (report storico,
archiviato in C2) e ogni reperto ha uno stato: `applied` (risolto nel piano attuale),
`deferred` (non risolto, motivato) o `obsolete` (non più pertinente). Seguono i rilievi
nuovi della revisione C3. Le revisioni successive aggiungono reperti qui, non altrove.

## Reperti dal report archiviato (sezione 1)

### Problemi individuati

| reperto | stato | motivazione |
|---|---|---|
| Mancano comandi concreti di build, test e packaging | applied | §1 «Comandi canonici»: configure/build/ctest per preset `debug`/`release`/`asan`, fallback senza preset, PowerShell, `cmake --install` + CPack TGZ/ZIP |
| Raylib non è versionata né viene definita la modalità di acquisizione tramite CMake | applied | §1: unica strategia `FetchContent`, `RAYLIB_VERSION "5.5"` + `URL_HASH SHA256` pinnato, `FETCHCONTENT_FULLY_DISCONNECTED` per la build offline; nessun aggiornamento durante le milestone di gameplay |
| Le collisioni non specificano correzione della posizione, gestione degli angoli, tunneling o collisioni multiple nello stesso frame | applied | §5: correzione lungo la normale con epsilon prima del bounce, corner hit e normali combinate, substep adattivi/swept anti-tunneling, massimo 4 contatti per pallina per step, ordine deterministico per `id`; ora anche milestone pesata `M1` |
| `MULTIBALL` richiede più palline, ma il modello dati iniziale contiene una sola `Ball` | applied | §3: `Game` possiede `balls[MAX_BALLS]` + `ballCount`, mai un campo singolo; §6 «Multiball» definisce spawn simmetrico, cap e perdita dell'ultima pallina |
| I power-up non definiscono durata, stacking, scadenza o ripristino degli effetti | applied | §8: tabella durata/stacking/ripristino per tipo (refresh, mai somma), timer decrementati solo in `GAME_PLAYING`, scadenza `previous > 0 && new <= 0`, valori derivati da `baseWidth`/`EffectState`; ora anche milestone pesata `M3` |
| Il caricamento dei livelli non specifica validazione del formato, dimensioni errate o caratteri non validi | applied | §7: formato rigido 10 righe × 12 colonne, `LevelError` con riga/colonna, rifiuto di BOM/spazi/righe extra e livello senza `1`/`2`, livello corrente intatto se il parsing fallisce; ora anche milestone pesata `M2` |
| Non sono definiti test automatici per fisica, punteggio, vite e transizioni di stato | applied | §10: suite obbligatoria per collisioni/fisica, regole e transizioni, effetti, parser, con test CTest nominati; C3 li rende l'unico canale del contratto `## Verify` |
| Il passaggio vittoria → livello successivo/menu non è descritto in dettaglio | applied | §7: transizione in sei passi (bonus una volta, freeze di palline/pickup/input, attesa 0,75 s, conferma, errore di caricamento controllato, `GAME_WON`/`GAME_OVER` con restart/menu); puntuata in `M4` |

### Miglioramenti consigliati

| reperto | stato | motivazione |
|---|---|---|
| Aggiungere per ogni milestone criteri di accettazione e comandi di verifica | applied | §9: ogni milestone ha «Implementare», «Accettazione» e «Verifica» con comandi concreti |
| Separare il core di simulazione dal codice raylib, rendendo testabili collisioni e stato senza finestra | applied | §2: `src/core` non include raylib, tipi propri `Vec2`/`Rect`, conversione solo nel bordo platform; §10 testa il core headless |
| Modellare esplicitamente un array di palline e un sistema di effetti temporizzati | applied | §3 `balls[]`/`ballCount` + `EffectState`; §8 timer con policy di stacking/scadenza/ripristino codificata e testata |
| Bloccare versione e strategia di acquisizione di raylib | applied | §1: `FetchContent` pinnato a tag `5.5` + `SHA256` verificato (`2026-08-20`), registrato anche nel README richiesto dal bootstrap |

## Rilievi nuovi (revisione C3)

| reperto | stato | motivazione |
|---|---|---|
| La tabella milestone provvisoria di C2 (M0–M8, slice 12+20=32) non rifletteva lo staging reale del piano: bootstrap e core giocabile erano due slice separate, e game feel/QA finale erano mescolati a milestone diverse | applied | C3 riorganizza il set in `M0`–`M6` con la slice unica `M0` (peso 40: bootstrap, build, test headless verdi, paddle/pallina/mattone con collisione, vite e game over), allineando `meta.json` e `PLAN.md` |
| I requisiti di verifica erano sparsi nei blocchi «Verifica» delle milestone, senza un contratto unico che dichiara cosa vale punteggio e come si comporta la GUI | applied | Nuova sezione `## Verify` + milestone `M6`: `./verify.sh` → `verify.json` con tutti gli id, timeout 600 s, exit 0 = pass; canale = build CMake + CTest headless, finestra mai lanciata; lo smoke manuale è QA e non vale punti |
| La baseline toolchain non era documentata da nessuna parte | applied | Nuova appendice informativa (non vincolante): MSVC v18 + Ninja + CMake ≥ 3.24 + raylib 5.5 via `FetchContent`, con la nota `CMAKE_POLICY_VERSION_MINIMUM` per CMake ≥ 4 |
| La skill locale `build-raylib-c-games` esisteva in `benchmarks/breakout/.agents/skills/` ma non era dichiarata nel `meta.json` | applied | Aggiunta a `skills` nel `meta.json`; la policy ammette skill benchmark-local e il gate le valida |
| «eventuale CI» compare nella milestone release (§9 `M5`), in tensione con il banner che dichiara CI e release automation fuori scope e non valutate | obsolete | La CI resta una menzione opzionale che non è requisito né vale punti: il contratto `## Verify` e la Definition of Done non la richiedono; nessun intervento sul piano oltre a questa registrazione |
| L'accettazione della vecchia `M0` chiedeva di «eseguire anche il binario per almeno 5 secondi», senza distinguere QA manuale dal canale di verifica | applied | La voce è conservata ma marcata «smoke manuale (QA, fuori dal contratto verify)»: la finestra non viene mai lanciata dalla verifica, che passa solo da build + CTest headless |
