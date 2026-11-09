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
| M0 | 40 | sì | Bootstrap e vertical slice: Valdaluce → incontro → Sintonia → Wayline → copia URL → reload/deep link |
| M1 | 12 | — | Codec Wayline: checksum, validazione, messaggio per link invalido |
| M2 | 10 | — | Combattimento con il sistema tattico leggero |
| M3 | 10 | — | Roster Echi del target (8–10) con risonanze |
| M4 | 8 | — | Economia e consumabili |
| M5 | 8 | — | Le tre regioni del target e 12–15 nodi |
| M6 | 5 | — | Accessibilità: tastiera, touch, screen reader, 320 px |
| M7 | 4 | — | PWA installabile e giocabile offline |
| M8 | 3 | — | verify.sh e verify.json |
# WAYLINE — L'Atlante Spezzato

---

*Documento autosufficiente di design e implementazione. È la fonte unica di verità per narrativa, sistemi, UX e architettura; ogni sezione è vincolante salvo deroga esplicita in un gate di rilascio (12.1, 14.3). Il progetto è **greenfield**: non estende né rimodella alcun progetto preesistente.*

## 1. Visione del prodotto

| Campo | Direzione |
|---|---|
| **Titolo di lavoro** | **WAYLINE — L'Atlante Spezzato** |
| **Codename tecnico** | `route-explorer` |
| **Genere** | RPG d'esplorazione testuale, combattimento tattico leggero, avventura narrativa |
| **Piattaforma** | Browser desktop e mobile, PWA installabile e giocabile offline |
| **Durata obiettivo** | 25–45 minuti alla prima partita nel target di release; 60–90 minuti con l'espansione completa di §5.4 |
| **Pubblico** | 12+, giocatori di avventure compatte, sistemi leggibili e interfacce retro |
| **Promessa centrale** | Ogni indirizzo è un luogo; ogni link è un sentiero; ogni URL condiviso è una storia giocabile |
| **Modello commerciale** | Distribuzione gratuita o pay-what-you-want, senza pubblicità, gacha o acquisti in gioco |
| **Scope release target** | 12–15 nodi di mondo, 8–10 Echi, 3 regioni principali, 3 scontri chiave, 1 finale; il design completo del mondo sopravvive come espansione opzionale a peso zero (§5.4) |

### 1.1 High concept

Il mondo di **Elyndra** non è disegnato su una mappa: esiste attraverso l'**Atlante delle Vie**, una rete di nomi, sentieri e ricordi. Quando intere rotte iniziano a perdere il proprio indirizzo, luoghi e persone vengono cancellati dalla realtà. Il giocatore è un giovane **Tracciatore** capace di fissare le Vie in un Wayline, un indirizzo vivo che può essere conservato, riaperto o affidato a un altro viandante.

Durante il viaggio il Tracciatore entra in sintonia con gli **Echi**, manifestazioni della memoria dei luoghi. Gli Echi non vengono catturati né posseduti: scelgono di accompagnare il protagonista dopo che la loro instabilità è stata placata. Le loro risonanze modificano lo stile di combattimento e di esplorazione dell'eroe.

### 1.2 Elevator pitch

> Un RPG tascabile in cui la barra degli indirizzi è la mappa del mondo. Esplora sentieri che stanno scomparendo, stringi patti con gli Echi dei luoghi e ricomponi un Atlante spezzato prima che la Marea Bianca cancelli ogni strada.

### 1.3 Cosa rende il gioco riconoscibile

1. **La URL è diegetica.** Non è solo tecnologia: rappresenta la Via che mantiene reale un luogo.
2. **Il salvataggio è un oggetto sociale.** Un Wayline può essere copiato, conservato e condiviso come una cartolina giocabile.
3. **Gli alleati cambiano la build, non sostituiscono il protagonista.** Il giocatore combatte; fino a quattro Echi forniscono risonanze passive e reazioni contestuali.
4. **Il mondo è piccolo ma interconnesso.** Ogni regione introduce una scelta, un nuovo uso degli strumenti e una conseguenza narrativa.
5. **L'interfaccia è un dispositivo di gioco.** Una console portatile originale a due schermi presenta scena e comandi senza nascondere la posizione corrente.

### 1.4 Non-obiettivi

- Nessun sistema di evoluzioni, allevamento, scambio o collezione enciclopedica.
- Nessuna ruota elementale o struttura basata su palestre, medaglie e campionato.
- Nessun open world procedurale: la forza è nella progressione curata e verificabile.
- Nessun backend, account o servizio remoto necessario per giocare. React e `react-dom` sono dipendenze runtime deliberate della UI; “nessuna dipendenza runtime” significa invece che il dominio non dipende da framework, rete, server o librerie native aggiuntive.
- Nessun inventario infinito o grind richiesto per superare i cancelli principali.

---

## 2. Pilastri di design

### 2.0 Strategia di consegna e vertical slice bloccato

Il progetto ha due livelli distinti: **MVP tecnico/playable** e **release narrativa completa**. Il secondo non può iniziare finché il primo non è dimostrato in un browser reale.

**Vertical slice obbligatorio (MVP-0, nessun contenuto extra):**

```text
Valdaluce → Prato delle Scie → un incontro → COLPISCI/SINTONIA
→ primo Eco in Compagnia → genera Wayline → copia URL → reload/deep link
```

Il slice usa una sola scena, un solo Eco accordabile, un solo consumabile e un solo risultato di viaggio. Deve già dimostrare:

- stato canonico in TypeScript strict e transizioni deterministiche;
- URL leggibile più Short Save, con checksum, validazione e messaggio per link invalido;
- ripristino esatto dopo reload, apertura in nuova scheda e browser back/forward;
- un flusso completo da tastiera, touch, screen reader e viewport 320 px;
- nessun `Math.random()`, stato React autorevole o accesso DOM nel dominio.

**Fuori dal vertical slice:** Torre, i rami dell'espansione (§5.4), roster completo, economia avanzata, pixel art, audio, analytics, challenge e contenuti opzionali. Se il gate MVP-0 fallisce, si corregge il slice: non si aggiungono regioni.

### 2.1 La Via è l'interfaccia

- Ogni path corrisponde a un nodo reale del mondo.
- Avanti/indietro del browser devono comportarsi come passi del viaggio.
- Un deep link valido deve ripristinare luogo, stato e incontro in corso.
- Un indirizzo non valido diventa fiction: una **Via Smarrita**, non una pagina tecnica di errore.

### 2.2 Scelte compatte, conseguenze leggibili

- Ogni schermata presenta al massimo quattro azioni primarie.
- Il risultato di un'azione aggiorna testo, stato e URL nello stesso momento.
- Le conseguenze permanenti sono anticipate e confermate nel log.
- Gli ostacoli spiegano sempre cosa manca e dove il giocatore può cercarlo.

### 2.3 Sintonia, non collezione

- Gli Echi sono memorie viventi legate al territorio.
- La vittoria riduce la loro instabilità; la **Sintonia** crea un patto volontario.
- I guardiani narrativi non possono essere vincolati alla Compagnia.
- Duplicati e rarità non sono il cuore della progressione; contano combinazioni e identità.

### 2.4 Determinismo equo

- Lo stesso Wayline e la stessa sequenza di comandi producono lo stesso risultato.
- Il caso è usato per varietà, non per rendere opache le regole.
- Danni, probabilità di Sintonia e requisiti sono mostrati o spiegati.
- Una modifica all'interfaccia non deve alterare gli esiti del dominio di gioco.

### 2.5 Piccolo, accessibile, condivisibile

- Esperienza completa in una o due sessioni.
- Funzioni essenziali disponibili da tastiera, touch e screen reader.
- ASCII semantico come modalità visiva primaria e fallback offline.
- Nessuno scroll del documento durante il gioco ordinario; eventuale overflow resta confinato ai pannelli secondari.

---

## 3. Identità narrativa originale

### 3.1 Premessa del mondo

Secoli prima degli eventi di gioco, i Cartografi unirono le comunità di Elyndra compilando l'Atlante delle Vie. Ogni luogo ricevette un **Nome di Rotta**: finché qualcuno poteva ricordarlo e percorrerlo, il luogo rimaneva ancorato alla realtà.

Il Consorzio dell'Asse trasformò gradualmente l'Atlante in un sistema centralizzato. Per eliminare sentieri ritenuti pericolosi o improduttivi, i suoi tecnici crearono il **Protocollo Bianco**, capace di cancellare una rotta dalla memoria collettiva. Il protocollo sfuggì al controllo e divenne la **Marea Bianca**: un vuoto che divora nomi, devia percorsi e rende instabili gli Echi nati dai luoghi dimenticati.

La guida del protagonista, **Mira Senza-Mappa**, conserva un Wayline incompleto proveniente dal Picco dell'Asse. Quando anche Valdaluce inizia a sbiadire, affida al giocatore una bussola d'archivio e una scelta: restaurare l'Atlante originario oppure renderlo finalmente libero da un unico custode.

### 3.2 Temi

- **Memoria contro controllo:** ricordare un luogo significa proteggerlo, ma anche decidere chi può definirlo.
- **Orientamento come identità:** perdersi non equivale a fallire; può rivelare strade cancellate dalla versione ufficiale.
- **Reciprocità:** persone, Echi e sentieri aiutano il protagonista solo dopo essere stati ascoltati e compresi.
- **Condivisione:** affidare un Wayline a un altro giocatore rende concreta l'idea che una strada sopravvive se viene percorsa.

### 3.3 Lessico canonico

| Concetto | Termine canonico | Funzione |
|---|---|---|
| Creatura alleata | **Eco** | Memoria vivente di un luogo |
| Party attivo | **Compagnia** | Massimo quattro Echi in risonanza |
| Deposito | **Archivio delle Risonanze** | Echi conosciuti ma non attivi |
| Cattura | **Sintonia** | Patto ottenuto placando un Eco instabile |
| Strumento di cattura | **Sigillo d'Intesa** | Consumabile che stabilizza la Sintonia |
| Abilità da esplorazione | **Strumento da campo** | Equipaggiamento del protagonista, non mossa di un Eco |
| Medaglia/chiave di città | **Sigillo Meridiano** | Autorizzazione narrativa e meccanica |
| Centro cure | **Casa del Ristoro** | Cura del protagonista e gestione Archivio |
| Professor/laboratorio | **Archivista / Officina dell'Atlante** | Introduzione a Echi e Wayline |
| Box/save | **Wayline** | Stato completo e condivisibile |
| Boss finale | **Custode dell'Asse** | Eco primordiale corrotto dalla Marea Bianca |

### 3.4 Regole di naming e distanza da Pokémon

Il testo pubblico, i dati e l'interfaccia non devono usare né evocare direttamente: Pokémon/Pokéball, professor Oak, Nurse Joy, HM, palestra, capopalestra, medaglia, allenatore, “gotcha”, PC box o “catturali tutti”.

Le regole creative sono:

- i personaggi hanno un mestiere e un conflitto, non un ruolo-funzione copiato;
- gli Echi derivano da fenomeni, materiali e memorie, non da semplici animali con un elemento;
- gli strumenti di campo appartengono al viaggiatore e hanno usi narrativi oltre ai cancelli;
- i duelli sono prove civiche o scontri con instabilità, non una lega sportiva;
- la Compagnia modifica l'eroe tramite risonanze; gli Echi non combattono in turni separati come unità intercambiabili;
- rarità e Sintonia non alimentano monetizzazione o completionism obbligatorio.

### 3.5 Personaggi canonici

Ogni personaggio ha un mestiere e un conflitto (3.4) e deve rispettare il contratto dati di 11.1 (location esistente, grafo di dialogo terminante, ricompense idempotenti). I guardiani della Compagnia sono gli Echi di 6.2; qui si enumerano i personaggi umani e i nodi-chiave che li ospitano.

| Nome | Mestiere | Location | Funzione nel grafo | Ricompensa / flag |
|---|---|---|---|---|
| **Mira Senza-Mappa** | Guida del Tracciatore | Valdaluce | Consegna la bussola d'archivio e pone la scelta inaugurale (restaurare o liberare l'Atlante); tutorial della URL come mappa | — (mentor) |
| **Neral Vey** | Archivista (Officina dell'Atlante) | Valdaluce | Insegna a fissare un luogo nel Wayline; consegna il kit iniziale | Sigilli d'Intesa ×3, Tonico, Lanterna a Lume, Filo di Richiamo |
| **Prefetto Dain** | Prefetto della Torre | Rocca / Torre (Atrio) | Spiega che la Torre verifica la stabilità di un Wayline | — (info) |
| **Custode Oran** | Custode dell'Osservatorio | Torre (Osservatorio) | Sfidante non antagonista; rivela la propagazione del Protocollo Bianco | Sigillo Meridiano (atomico con la vittoria) |
| **Syl** | Memorialista | Selva del Sussurro | Chiede di accordare i rovi con le Cesoie invece di tagliarli | Cesoie di Risonanza + accesso al passaggio della Selva |
| **Brann** | Scalpellino | Caverne di Vetro | Confessa l'estrazione dei cristalli-memoria da parte del Consorzio | — (lore) |
| **Nema** | Pilota | Costa di Vetro | Rivela le vie sommerse e fornisce la Vela Pieghevole | Vela Pieghevole |
| **Eiren** | Saggia | Isola della Bruma | Racconta l'origine (comprensibile) della Marea Bianca | — (lore) |
| **Aster Veyr** | Primo Cartografo | Picco dell'Asse | Antagonista filosofico; creatore del Protocollo Bianco | — (trigger del finale) |

I guardiani e il boss finale sono gli Echi `Guardiano Rovi` (Ponte), `Bastione di Scaglia` (Torre, Contrappeso), `Fiamma Frondosa` (Torre, Osservatorio), `Spira Prismatica` (Selva), `Aurora Cinerea` (Costa) e `Leviatano Meridiano` (Picco); tutti non accordabili (6.2).

---

## 4. Trama e struttura in quattro atti

*La struttura narrativa resta integra come design del mondo. Nel target di release ridotto (§1, §5.3) la sequenza implementata è Prologo → Atto I → Atto II → Atto IV con un solo finale; gli Atti III-A/III-B, il secondo finale e gli epiloghi regionali differenzianti appartengono all'espansione completa, contenuto opzionale a peso zero (§5.4).*

### Prologo — Il sentiero che dimentica

Il protagonista raggiunge **Valdaluce** seguendo un Wayline lasciato da un familiare scomparso. La scritta sul cartello del villaggio si dissolve davanti ai suoi occhi. Mira insegna a fissare un luogo nella bussola d'archivio e segnala che la strada verso la Rocca delle Soglie è stata divorata dalla Marea Bianca.

Obiettivi di onboarding:

- compiere il primo viaggio usando un link;
- leggere posizione e stato nel Wayline;
- ricevere da Neral Vey tre Sigilli d'Intesa, un Tonico, la **Lanterna a Lume** e un **Filo di Richiamo**;
- incontrare e placare il primo Eco;
- apprendere che gli Echi forniscono risonanze passive alla Compagnia.

### Atto I — Il ponte senza approdo

Il **Ponte di Radica** cambia destinazione ogni notte. Il Guardiano Rovi, un Eco nato dalle promesse dei viandanti, lo difende perché la sponda opposta sta perdendo il proprio Nome di Rotta. Dopo lo scontro, il protagonista non lo cattura: ricuce il Wayline del ponte e ottiene il flag narrativo `causeway_restored`.

L'arrivo alla **Rocca delle Soglie** rivela il primo conflitto umano. Il Consorzio ha chiuso le porte verso la Selva e la Costa, dichiarando che solo chi supera la Torre Meridiana può viaggiare senza scorta.

### Atto II — La Torre Meridiana

La Torre non è una palestra, ma un antico nodo di sincronizzazione dell'Atlante.

1. **Atrio:** il Prefetto Dain spiega che la torre verifica la capacità di mantenere stabile un Wayline.
2. **Camera del Contrappeso:** il Bastione di Scaglia mette alla prova difesa, oggetti e composizione della Compagnia.
3. **Osservatorio:** la Custode Oran affronta il protagonista con un Eco foglia-fuoco divenuto instabile per la Marea Bianca.
4. **Rivelazione:** Oran non è un antagonista; custodiva le porte perché il Protocollo Bianco si propaga attraverso le rotte aperte.

La vittoria e il dialogo successivo assegnano atomicamente il **Sigillo Meridiano**. Il sigillo apre due rami esplorabili in qualsiasi ordine.

### Atto III-A — La memoria sotto la Selva

Nella **Selva del Sussurro**, le radici ripetono nomi di paesi ormai cancellati. La Memorialista Syl chiede di non distruggere i rovi: le Cesoie di Risonanza devono accordarli per aprire un passaggio. Nelle Caverne di Vetro, lo Scalpellino Brann confessa che il Consorzio estraeva cristalli-memoria per alimentare il Protocollo Bianco.

Il ramo culmina nel confronto con la **Spira Prismatica**. Placarne l'instabilità libera il **Frammento di Memoria**, prima coordinata necessaria per raggiungere il Picco dell'Asse.

### Atto III-B — La rotta che il mare nasconde

Alla **Costa di Vetro**, la pilota Nema rivela che alcune vie continuano sotto la superficie. Con una Vela Pieghevole il giocatore attraversa il Mare Aperto e raggiunge l'**Isola della Bruma**, assente dall'Atlante ufficiale.

La Saggia Eiren racconta che la Marea Bianca nacque da una paura comprensibile: le Vie instabili avevano causato disastri, e il Consorzio cercò una soluzione assoluta. Dopo la prova contro l'**Aurora Cinerea**, il protagonista ottiene il **Cifrario di Marea**, seconda coordinata del Picco.

### Atto IV — Il Picco dell'Asse

Con Sigillo, Frammento e Cifrario, il giocatore ricostruisce il Wayline del Picco. Durante la salita, le ultime Vie cambiano nome e collegamenti, mostrando cosa accadrà al mondo in caso di fallimento.

In vetta attende **Aster Veyr**, Primo Cartografo e creatore del Protocollo Bianco. Veyr sostiene che un Atlante libero produrrà caos; vuole ridurre il mondo a poche rotte controllabili. Prima che il confronto possa concludersi, il **Leviatano Meridiano**, Eco dell'intera rete, emerge corrotto dalla Marea.

La battaglia finale non uccide il Leviatano: ne separa memoria e protocollo. Al termine, il giocatore sceglie:

- **Restaurare l'Atlante:** le Vie tornano stabili, ma la Custodia centrale sopravvive sotto nuove regole condivise.
- **Liberare le Vie:** ogni comunità può nominare e mantenere le proprie rotte; il mondo diventa più fragile ma nessuno può cancellarlo da solo.

Entrambi i finali producono un Wayline persistente e condivisibile, con epilogo diverso nelle regioni già visitate.

### 4.1 Arco emotivo del protagonista

| Fase | Domanda | Trasformazione |
|---|---|---|
| Prologo | “Posso fidarmi di una mappa incompleta?” | Impara a leggere e conservare le Vie |
| Torre | “Essere autorizzato significa essere pronto?” | Comprende il costo della sicurezza imposta |
| Due rami | “Chi ha il diritto di nominare un luogo?” | Ascolta versioni incompatibili della stessa storia |
| Finale | “Una strada deve essere sicura o libera?” | Assume responsabilità sul futuro dell'Atlante |

---

## 5. Mondo e progressione

### 5.1 Struttura macro

```text
Via iniziale
   |
Valdaluce -- Prato delle Scie -- Ruscello Fiorito
   |                              |
Officina / Ristoro / Emporio -- Ponte di Radica [guardiano]
                                  |
                         Rocca delle Soglie
                                  |
                     Torre Meridiana [2 prove]
                       /                    \
          Selva del Sussurro             Costa di Vetro
          |              |               |
   Bosco profondo   Caverne di Vetro [Lanterna a Lume]   Mare Aperto
          |              |               |
   sentiero montano [Frammento]       Isola della Bruma [Cifrario]
          \___________________  __________________/
                              \/
                      Picco dell'Asse [finale]
```

*La mappa rappresenta il mondo completo, incluso il contenuto dell'espansione opzionale (§5.4); il target di release implementa le sole tre regioni di §5.3.*

*Le **Caverne di Vetro** sono grotte buie e richiedono la **Lanterna a Lume** per essere esplorate; vi risiede la Spira Prismatica, per cui il Frammento di Memoria è raggiungibile solo dopo aver ottenuto la lanterna nel kit iniziale. **Bosco profondo** è un'area opzionale di esplorazione.*

### 5.2 Regole di progressione

- Il prologo è lineare per non più di 8 minuti.
- Dopo il Ponte, la Torre costituisce il primo controllo di padronanza dei sistemi.
- **Target ridotto:** dopo la Torre, il Picco dell'Asse è raggiungibile con il solo Sigillo Meridiano; Frammento di Memoria e Cifrario di Marea tornano requisiti del Picco solo nell'espansione completa (§5.4).
- Dopo la Torre, Selva e Costa sono affrontabili in qualsiasi ordine (espansione completa).
- Nessuno dei due rami può essere saltato nella prima partita completa, ma ogni ramo contiene almeno un'area opzionale (regola dell'espansione; nel target ridotto i due rami non sono presenti).
- Il ritorno alle città deve essere sempre possibile senza consumare una risorsa rara.
- Ogni cancello usa al massimo due requisiti e comunica produttore, zona e stato mancante.
- Strumenti e valuta necessari alla storia devono essere ottenibili senza incontri casuali obbligatori.
- Le rotte visitate dopo il finale mostrano epiloghi contestuali, dando valore al backtracking.

### 5.3 Inventario di lancio — target di release

Inventario del **target di release ridotto**; l'inventario completo dell'espansione (regioni, nodi e incontri surplus) è conservato in §5.4.

| Regione | Nodi target | Incontri | Funzione |
|---|---:|---:|---|
| Valdaluce e dintorni | 7 | 1 pool + 1 guardiano (Rovi) | Onboarding, primo Eco, economia iniziale |
| Rocca delle Soglie e Torre Meridiana | 3 | 1 prova (Osservatorio) | Verifica padronanza, sblocco macro |
| Picco dell'Asse | 3 | 1 pool + finale scriptato | Sintesi delle build e conclusione |
| **Totale** | **13** | **3 scontri chiave (2 guardiani + finale scriptato) / 9 Echi (6 accordabili + 3 non accordabili)** | Scope target della release |

### 5.4 Contenuto opzionale, fuori dal target di release (peso 0)

Nulla del design completo viene cancellato: tutto ciò che eccede il target di release (§1, §5.3) vive in questa sezione come **contenuto opzionale a peso zero**. Non compare in `meta.json`, non è richiesto da `verify.sh`, non vale punti e non può aprire cancelli necessari al target. Si costruisce solo dopo la release del target ridotto, senza modificare schema o bilanciamento senza migrazione e regression suite.

**Espansione completa del mondo (inventario originale, conservato integro):**

| Regione | Nodi target | Incontri | Funzione |
|---|---:|---:|---|
| Valdaluce e dintorni | 9 | 2 pool + 1 guardiano | Onboarding, primo Eco, economia iniziale |
| Rocca e Torre Meridiana | 7 | 2 prove | Verifica padronanza, sblocco macro |
| Selva e Caverne di Vetro | 7 | 5 pool + 1 guardiano | Strumenti, memoria, percorso difensivo |
| Costa, Mare e Isola | 3 | 3 pool + 1 guardiano | Mobilità, rischio/ricompensa, percorso offensivo |
| Picco dell'Asse | 3 | 2 pool + finale | Sintesi delle build e scelta conclusiva |
| **Totale** | **29** | **17 incontri (12 pool + 5 boss; il finale è scriptato a parte) / 20 Echi** | Scope dell'espansione completa |

**Contenuto narrativo dell'espansione:**

- Gli Atti III-A e III-B: Selva del Sussurro (con Bosco profondo), Caverne di Vetro, Costa di Vetro, Mare Aperto e Isola della Bruma, con Syl, Brann, Nema ed Eiren.
- La prova della **Camera del Contrappeso** (Bastione di Scaglia) nella Torre Meridiana.
- Le coordinate **Frammento di Memoria** e **Cifrario di Marea**, che nell'espansione tornano prerequisiti del Picco dell'Asse accanto al Sigillo Meridiano.
- Il secondo finale: nel target di release il confronto finale si conclude con **Restaurare l'Atlante**; il finale **Liberare le Vie**, la scelta conclusiva tra i due epiloghi e gli epiloghi regionali differenzianti appartengono all'espansione.
- Gli strumenti da campo legati ai rami: Cesoie di Risonanza e Vela Pieghevole (la Lanterna a Lume resta nel kit iniziale del target perché consegnata a Valdaluce).

**Roster surplus (11 Echi fuori target, nessun peso):** `woodowl`, `mossmole`, `shadowlynx`, `groveguardian`, `echobat`, `shadowbat`, `spiregolem`, `crystaldragon`, `tideturtle`, `deepshark`, `phoenixbird` (§6.2).

**Contenuto opzionale di rifinitura (già previsto dal design originale):**

- Tre **Vie Smarrite** raggiungibili inserendo indizi di path scoperti nei dialoghi.
- Un Eco opzionale per regione (disponibilità facoltativa, non un sistema di rarità: nessun livello o valore di rarità), con risonanza che abilita build differenti ma non blocca la storia.
- Dialoghi di ritorno dopo Torre, prima coordinata e finale.
- Un registro compatto dei Wayline scoperti; non una enciclopedia di creature.
- Challenge replay con seed pubblico e inventario predefinito, senza ricompense esclusive.

---

## 6. Echi e Compagnia

### 6.1 Ruolo sistemico

Il protagonista rimane l'agente principale. Ogni Eco nella Compagnia aggiunge una **Risonanza** passiva; l'ultimo Eco accordato può anche reagire visivamente all'attacco del giocatore. La Compagnia ha quattro posti e l'Archivio ottanta.

Categorie di risonanza:

- **Impeto:** bonus al danno e probabilità di colpo critico;
- **Riparo:** scudo, salute massima e mitigazione;
- **Flusso:** schivata, recupero e drenaggio;
- **Intesa:** probabilità di Sintonia e ricompense di esplorazione.

Le risonanze si sommano con limiti espliciti. Non esistono livelli individuali, evoluzioni o mosse apprese: la profondità nasce dalla composizione della Compagnia.

### 6.2 Roster canonico

| ID (wire canonico) | Nome target | Memoria incarnata | Risonanza primaria |
|---|---|---|---|
| `fieldfox` | **Scintilla Rossa** | Sentieri scaldati dal sole | Impeto |
| `grasshopper` | **Saltacanna** | Erba piegata dai passi | Intesa |
| `rivertoad` | **Dorso di Riva** | Guadi e attese pazienti | Riparo |
| `brambleboar` | **Guardiano Rovi** | Promesse fatte sui ponti | Boss, non accordabile |
| `spiregolem` | **Bastione di Scaglia** | Peso e misura della Torre | Boss, non accordabile |
| `mapledrake` | **Fiamma Frondosa** | Fuochi civici della Rocca | Boss, non accordabile |
| `woodowl` | **Vegliafosca** | Segreti sussurrati di notte | Intesa |
| `mossmole` | **Scavaterra** | Tracce sepolte nel sottobosco | Riparo |
| `shadowlynx` | **Passo d'Ombra** | Sentieri evitati dai viandanti | Impeto |
| `groveguardian` | **Corona Verde** | Nomi antichi degli alberi | Riparo |
| `echobat` | **Alarintocco** | Voci riflesse nelle grotte | Flusso |
| `stonegolem` | **Nato dalla Faglia** | Pressione della montagna | Riparo |
| `shadowbat` | **Alamuta** | Paura degli spazi senza nome | Flusso |
| `crystaldragon` | **Spira Prismatica** | Memorie conservate nel cristallo | Guardiano di ramo |
| `tideturtle` | **Gusciofrangente** | Rotte costiere cancellate | Riparo |
| `deepshark` | **Fauce di Fondo** | Naufragi mai registrati | Impeto |
| `phoenixbird` | **Aurora Cinerea** | Isole che ricompaiono all'alba | Guardiano di ramo |
| `frostfalcon` | **Rasogelido** | Correnti sopra i valichi | Flusso |
| `stormdrake` | **Corno di Burrasca** | Tempeste che ridisegnano i sentieri | Impeto |
| `celestialguardian` | **Leviatano Meridiano** | Memoria dell'intero Atlante | Boss finale, non accordabile |

### 6.3 Sintonia

1. Un incontro inizia con un livello di Instabilità.
2. Attaccare riduce HP/Instabilità dell'Eco ma non lo distrugge: la sconfitta risolve il conflitto narrativo senza cancellare la memoria del luogo.
3. Il comando **SINTONIA** consuma un Sigillo d'Intesa.
4. La probabilità cresce al diminuire dell'Instabilità e con le risonanze Intesa.
5. Al successo l'Eco entra nella Compagnia, oppure nell'Archivio se i quattro posti sono occupati.
6. I guardiani espongono chiaramente `Sintonia non possibile`; la vittoria risolve il conflitto narrativo.

Formula iniziale da bilanciare:

```text
P(sintonia) = clamp(10%, 95%, 10% + (1 - hp/maxHp) * 80% + bonus_intesa)
```

---

## 7. Combattimento ed economia

### 7.1 Turno di combattimento

| Comando | Effetto | Costo/rischio |
|---|---|---|
| **COLPISCI** | Danno base + Impeto; può attivare critico e recupero | L'Eco avversario risponde se resta attivo |
| **SINTONIA** | Tenta il patto con un Eco accordabile | Consuma un Sigillo; fallire concede risposta nemica |
| **USA** | Impiega un Tonico o oggetto contestuale | Consuma inventario; vietato a salute piena |
| **RITIRATI** | Tenta di lasciare un incontro libero | Possibile fallimento; mai disponibile nei guardiani |

I comandi mostrati in battaglia sono un sottoinsieme di quelli disponibili: **SINTONIA** compare solo quando `battle.canAttune` è vero (mai nei guardiani, che espongono `Sintonia non possibile`); **RITIRATI** non compare mai nei guardiani. Ogni turno segue l'ordine: il giocatore emette un comando, poi l'Eco avversario risponde se ancora attivo; i tiri derivano dai canali deterministici di 10.4. Le etichette delle azioni sono localizzate e si mappano 1:1 sui tipi canonici del dominio: `COLPISCI`→`ATTACK`, `SINTONIA`→`ATTUNE`, `USA`→`USE_ITEM`, `RITIRATI`→`RETREAT`, `VIAGGIA`→`TRAVEL`.

### 7.2 Regole di leggibilità

- Il pannello mostra salute, salute massima, turno, stato di accordabilità e ultime tre righe di log.
- Danno assorbito, schivata, critico e recupero hanno messaggi distinti.
- I tasti 1–4 corrispondono sempre ai quattro comandi visibili.
- Il salvataggio durante uno scontro conserva Eco, HP, seed, turno e path.
- Sconfitta: ritorno all'ultima Casa del Ristoro con perdita massima del 15% della valuta; nessun soft-lock.

### 7.3 Bilanciamento target

| Metrica | Obiettivo |
|---|---:|
| Durata incontro comune | 2–4 turni |
| Durata guardiano | 5–8 turni |
| Probabilità vittoria primo guardiano, player preparato | 75–85% |
| Tentativi mediani boss finale | 1–3 |
| Incontri casuali consecutivi prima di una zona sicura | massimo 2 |
| Grind richiesto per acquistare uno strumento obbligatorio | 0 incontri obbligatori |
| Build valide al finale | almeno 4 archetipi verificati |

### 7.4 Economia

- Valuta: **Gettoni di Rotta**, ottenuti da scontri, riparazione di Wayline e piccoli incarichi.
- Consumabili: Tonico, Tonico Integro, Sigillo d'Intesa, Filo di Richiamo.
- Strumenti permanenti: Lanterna a Lume, Vela Pieghevole, Cesoie di Risonanza.
- Oggetto chiave: Sigillo Meridiano; non vendibile e assegnato una sola volta.
- Ogni strumento obbligatorio ha un produttore alternativo o un prezzo coperto dalle ricompense garantite.
- - **Lanterna a Lume** (strumento permanente, non vendibile): consegnata da Neral Vey nel kit iniziale a Valdaluce; richiesta per entrare nelle **Caverne di Vetro** (grotte buie) e dunque per affrontare la Spira Prismatica e ottenere il Frammento di Memoria. Prerequisito di ramo, ma ottenibile senza incontri casuali obbligatori.
- **Filo di Richiamo** (consumabile): consegnato da Neral Vey e acquistabile all'Emporio (prezzo coperto dalle ricompense garantite); consumandolo permette di scambiare uno Eco dell'Archivio con uno della Compagnia anche fuori dalla Casa del Ristoro, per riconfigurare la build sul campo. Non richiesto dalla storia.
- Il test economico simula un giocatore che evita tutti gli incontri casuali non necessari.

---

## 8. UX e direzione audiovisiva

### 8.1 Struttura della console

```text
barra identità + stato Wayline
┌──────────────────────────────────────┐
│ SCHERMO SCENA                        │
│ luogo / ASCII o pixel art / racconto │
├──────────────────────────────────────┤
│ SCHERMO COMANDI                      │
│ VIAGGIA AZIONI COMPAGNIA SACCA SISTEMA│
└──────────────────────────────────────┘
AUDIO  SALVA  CARICA
```

- Desktop: scocca centrata con larghezza massima 920 px.
- Mobile: pieno viewport, safe-area rispettata, controlli touch da almeno 44×44 px.
- Nessuno scroll del documento nelle scene ordinarie; pannelli densi possono scorrere internamente.
- Il luogo resta visibile mentre il giocatore consulta inventario o Compagnia.
- Dialoghi, blocchi, battaglie, vittoria e Vie Smarrite usano lo stesso sistema visivo.
- Menu e log non usano emoji come icone funzionali.

### 8.2 Art direction

Direzione: **cartografia notturna da console portatile**, non imitazione diretta di hardware o franchise esistenti.

- Scocca grafite, schermi verde-nebbia, accento ambra per selezione e pericolo.
- Font monospace di sistema; nessun font esterno necessario al runtime.
- ASCII primario: massimo 58 colonne × 12 righe per ambienti e 42 × 8 per incontri.
- Ogni regione possiede silhouette, densità e ritmo di caratteri riconoscibili.
- Riduzione movimento disattiva scanline animate e transizioni non essenziali.
- Asset raster opzionali in atlanti WebP lossless per bioma, massimo 40 KB ciascuno.
- L'ASCII rimane nel DOM come contenuto semantico e fallback di decodifica/offline.

La modalità pixel art è opzionale e lazy-loaded (massimo 40 KB per bioma, mai nel precache predefinito). L'ASCII resta la modalità visiva predefinita finché un atlas non rispetta tale budget; in caso contrario l'ASCII resta il fallback offline e semantico.

### 8.3 Audio

- Effetti sintetizzati via Web Audio: viaggio, conferma, blocco, colpo, Sintonia, vittoria.
- Nessun file musicale obbligatorio; eventuali loop devono essere piccoli, originali e disattivabili.
- Audio avviato soltanto dopo gesto utente e preferenza conservata localmente.
- Ogni informazione sonora importante possiede anche un equivalente testuale o visivo.

### 8.4 Accessibilità

- Navigazione completa con tastiera, ordine di focus stabile e focus sempre visibile.
- `aria-live` per cambi di stato e log, senza annunciare decorazioni ASCII riga per riga.
- Contrasto WCAG AA per testo e controlli.
- Nessuna informazione affidata solo al colore.
- Supporto `prefers-reduced-motion`, zoom 200% e viewport 320 px.
- Dialog di caricamento etichettato; niente `window.prompt` per operazioni principali.

---

## 9. URL, stato e condivisione

### 9.1 Schema della posizione

```text
/{regione}/{luogo}/{sottoluogo}

/                                  titolo
/valdaluce                         villaggio iniziale
/valdaluce/prato                   primo incontro
/rocca-soglie/torre/contrappeso    prova intermedia
/selva/caverne/camera-prismatica   guardiano del Frammento
/costa/mare/isola-bruma            guardiano del Cifrario
/picco-asse/vetta                  finale
```

I nomi pubblici possono essere localizzati, ma gli slug restano stabili, in minuscolo ASCII e indipendenti dalla lingua.

### 9.2 Stato autorevole

Lo stato di gioco è completamente rappresentabile dal Wayline:

| Gruppo | Campi |
|---|---|
| Protagonista | `hp`, `maxHp`, valuta |
| Progressione | flag, finale scelto, contatore incontri |
| Inventario | ID e quantità, strumenti da campo |
| Echi | Compagnia ordinata e Archivio |
| Battaglia | ID Eco, HP corrente, seed, turno, path di origine |
| Versione | versione schema e migrazione applicata |

Formato canonico condiviso: `?s=<ShortSave>` dove `ShortSave` è l'envelope `{v,p,h}` di 10.6. I parametri leggibili restano disponibili in sviluppo come forma diagnostica; la forma canonica condivisibile è `?s=`.

### 9.3 Stato non autorevole

Può vivere in `localStorage` senza entrare nel Wayline:

- audio acceso/spento;
- ASCII/pixel mode;
- tab dell'interfaccia selezionata;
- preferenze di movimento ridotto;
- ultimo codice copiato come comodità, mai come unico salvataggio.

### 9.4 Contratto di compatibilità

- Ogni save contiene una versione esplicita.
- Le migrazioni sono una catena `Vn -> Vn+1`, mai condizioni sparse nel decoder.
- Link futuri non supportati falliscono senza caricare stato parziale.
- Il più grande salvataggio ufficiale deve restare sotto 2.000 caratteri.
- Quando un ID canonico cambia in una major release futura, mantenere un alias di retrocompatibilità per almeno una major release.
- Un refactor narrativo non può invalidare i Wayline esistenti: i cambi di ID canonici avvengono solo con migrazione esplicita e alias di retrocompatibilità.

### 9.5 Contratto browser: History API, deep link e battaglia

La URL è la rappresentazione persistente; `history.state` è soltanto metadato non autorevole (`entryIndex`, `schemaVersion`, `waylineDigest`). Il router non usa React Router e non duplica lo stato in un context globale.

- **Avvio/deep link:** `main.tsx` legge `location.pathname` e `?s=`. Prima normalizza e migra il save, poi valida lo slug e infine renderizza. Il path e `state.node` devono coincidere; l'unica eccezione è un alias di retrocompatibilità che viene canonicalizzato con `replaceState`. Un path sconosciuto o un save invalido mostra una **Via Smarrita** senza eseguire transizioni e offre “Torna all'inizio”; il server statico deve rispondere con `index.html` per ogni path.
- **Comando di dominio:** ogni comando accettato produce `nextState`, eventi e URL canonica in un'unica operazione. Per un cambiamento di gioco si usa `pushState`; `replaceState` è ammesso solo per canonicalizzazione, ripristino dopo errore o modifica di preferenze UI. Lo stesso URL non viene aggiunto due volte.
- **Back/forward fuori battaglia:** `popstate` decodifica la destinazione e la tratta come snapshot autorevole già validato; non richiama il comando precedente e non ricalcola casualità. Il log e la UI vengono ricostruiti dal nuovo stato. Forward ripristina uno snapshot esistente oppure, se la cronologia è stata sostituita, non inventa uno stato.
- **Durante una battaglia:** ogni turno accettato crea uno snapshot con `battleId`, HP, turno, seed e path; Back/Forward può quindi ripristinare esattamente un turno precedente/successivo. I comandi di viaggio e cambio scena sono disabilitati e `transition` li rifiuta con evento `BATTLE_LOCKED`. Per evitare che il Back accidentale abbandoni lo scontro, se la destinazione non contiene lo stesso `battleId` il router torna all'indice corrente (`history.go`) e apre un dialog accessibile: “Abbandonare lo scontro?”. Solo **RITIRATI**, vittoria o sconfitta possono chiudere la battaglia e creare una nuova entry di viaggio.
- **Link condiviso durante uno scontro:** è valido e riprende lo scontro esatto dal seed e dal turno salvati; non riproduce una sequenza implicita e non consuma un turno al caricamento.
- **Refresh/chiusura:** nessun `beforeunload` blocca l'utente. L'ultimo stato è già nella URL; `localStorage` è solo comodità e non viene usato per sovrascrivere un deep link esplicito.
- **Test obbligatori:** deep link a ogni nodo, back/forward tra comando e battaglia, reload a ogni fase del combattimento, apertura in nuova scheda, slug sconosciuto, query corrotta e server statico senza rewrite manuale.

---

## 10. Architettura tecnica greenfield

### 10.1 Principio di separazione

```text
URL / Short Save / dati canonici
             |
             v
schema + migrazioni + validazione
             |
             v
       GameState normalizzato
             |
             v
transition(state, command, random deterministico)
             |
             v
{ nextState, events, navigation }
             |
             v
router / renderer / audio / clipboard / service worker
```

DOM, History API, audio e cache non devono essere importati dal dominio puro. React vive soltanto nel renderer: schema, codec, transizioni, PRNG e dati restano TypeScript puro, eseguibili e testabili in Node senza DOM.

### 10.2 Stack

**Verdetto:** React + TypeScript è possibile e compatibile con la natura del gioco, a due condizioni: TypeScript copre tutto il codice (contratti, codec, transizioni, UI), mentre React vive **solo** nello strato di presentazione, senza toccare il dominio puro (principio 10.1). Il costo è una build statica e un bundle più pesante, gestito con decisione esplicita sul budget (14.2).

| Livello | Scelta | Motivazione |
|---|---|---|
| Linguaggio | TypeScript strict (target ES2020) | Union discriminate per comandi/eventi, tipi su schema, codec, migrazioni e transizioni; JSDoc non basta per i contratti |
| Framework UI | React 19, solo nel renderer | Il dominio puro resta framework-free e testabile in Node senza DOM; React gestisce pannelli, focus, aria-live e aggiornamenti atomici stato → UI |
| Routing | History API con fallback statico a `index.html` | Deep link con slug stabili e hosting statico; hash routing non viene usato perché la URL è parte della fiction |
| Stato | Schema normalizzato V1+ e codec Short Save | Condivisione, migrazioni e limiti espliciti |
| Dati | Un'unica fonte canonica validata | Evita divergenza tra JSON e moduli duplicati |
| Casualità | Hash/PRNG deterministico per canali nominati | Replay identici tra browser |
| Rendering | React + CSS custom properties | L'ASCII resta nel DOM come contenuto semantico; tema compatto e accessibile |
| Audio / Clipboard | Web Audio API e navigator.clipboard vanilla | Nessun framework necessario fuori dal renderer |
| Offline | Service Worker versionato, network-first per codice | Aggiornamenti affidabili con fallback offline |
| Test | Vitest + React Testing Library + Playwright (Chromium/Firefox/WebKit) | Dominio puro senza jsdom; componenti e flussi reali in browser |
| Build | Vite: build statico TS/JSX minificato e hashato; script di validazione/generazione dati | Deploy statico semplice, nessun build al runtime |

**Conseguenze esplicite:** React 19 + react-dom sono le sole dipendenze runtime applicative e aggiungono circa 140 KB minificati (circa 46 KB gzip); il gate passa quindi a <250 KB non compressi / <75 KB gzip. Vite, TypeScript, Vitest, Playwright, Testing Library e `vite-plugin-pwa` sono dev/build dependencies e non vengono caricate dalla pagina come pacchetti separati. Se il peso tornasse critico, Preact è un'alternativa valutabile soltanto dopo il vertical slice, senza modificare contratti o dominio. I moduli di dominio (schema, codec, transizioni, PRNG, dati) non importano mai React né DOM.

### 10.3 Struttura del repository e configurazione eseguibile

Non sono ammessi file di produzione `.js` o `.jsx`: il codice applicativo è `.ts`/`.tsx`; l'unico JavaScript distribuito è l'output generato da Vite. JSON e CSS restano formati dati/asset, non una seconda implementazione del dominio.

```text
package.json
package-lock.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
public/
  manifest.webmanifest
  icons/
src/
  main.tsx
  App.tsx
  styles/
    tokens.css
    global.css
    console.css
  data/
    world.json
    echoes.json
    characters.json
    items.json
  domain/
    state/schema.ts
    state/normalize.ts
    state/migrations.ts
    state/codec.ts
    transitions/battle.ts
    transitions/quest.ts
    transitions/storage.ts
    random.ts
    validation/contracts.ts
    validation/reachability.ts
  router/
    route.ts
    history-router.ts
  renderer/
    SceneScreen.tsx
    CommandScreen.tsx
    BattlePanel.tsx
    WaylineBar.tsx
    dialogs.tsx
  platform/
    audio.ts
    clipboard.ts
    storage.ts
  pwa/
    register.ts
    service-worker.ts
  app.css
tests/
  unit/
  fixtures/saves/
  e2e/
```

`package.json`, `package-lock.json` e i quattro file di configurazione (`vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`) sono **deliverable**: senza di loro il progetto non si avvia e nessuna milestone è valutabile. Regola di pinning: nessun `@latest`, nessuna installazione fuori dal lockfile; `package-lock.json` è committato, è la fonte esatta delle versioni e si aggiorna solo con una verifica completa. `npm ci` è l'unico comando di install ammesso, incluso `./verify.sh` (§13).

Manifest minimo da creare in `package.json` (i range indicano la linea ammessa; le versioni esatte sono quelle del lockfile committato):

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p tsconfig.json --pretty false && tsc --noEmit -p tsconfig.node.json --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "validate": "npm run typecheck && npm test && npm run build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "~5.0.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "vite-plugin-pwa": "^0.21.1",
    "workbox-precaching": "^7.3.0",
    "workbox-routing": "^7.3.0",
    "workbox-strategies": "^7.3.0"
  }
}
```

`vite.config.ts` deve usare `@vitejs/plugin-react` e `VitePWA` con `strategies: "injectManifest"`, `srcDir: "src/pwa"`, `filename: "service-worker.ts"`, `registerType: "prompt"` e manifest webapp. `tsconfig.json` deve avere `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noEmit: true`, `jsx: "react-jsx"`, `moduleResolution: "Bundler"` e target ES2020. `tsconfig.node.json` include solo `vite.config.ts`. `index.html` importa `src/main.tsx`, contiene un `<main id="root">` e non contiene stato di gioco. `src/main.tsx` monta React, registra il service worker e passa a `App.tsx` esclusivamente lo snapshot restituito dal router.

Configurazione minima di `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Configurazione minima di `tsconfig.node.json`:

```json
{
  "compilerOptions": { "composite": true, "module": "ESNext", "moduleResolution": "Bundler", "allowJs": false, "strict": true, "noEmit": true },
  "include": ["vite.config.ts"]
}
```

Configurazione minima di `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "service-worker.ts",
      injectRegister: false,
      registerType: "prompt",
      manifest: { name: "WAYLINE", short_name: "WAYLINE", display: "standalone", start_url: "/" }
    })
  ],
  build: { target: "es2020", sourcemap: true, cssCodeSplit: true }
});
```

`src/main.tsx` crea il root React, chiama `readLocation()` e registra `src/pwa/register.ts`; `App.tsx` riceve un modello di rendering e un dispatcher di `GameCommand`. Il dispatcher esegue `transition`, serializza `nextState`, chiama `pushState` e poi aggiorna React. Un `setState` UI non è mai sufficiente per salvare.

`src/pwa/service-worker.ts` è concreto e minimale:

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(({ request, url }) => ["document", "script", "style"].includes(request.destination) || url.pathname.endsWith(".json"), new NetworkFirst({ cacheName: "wayline-shell-v1" }));
registerRoute(({ request }) => request.destination === "image", new CacheFirst({ cacheName: "wayline-assets-v1" }));
```

I dati JSON sono serviti dalla stessa policy network-first; gli atlanti opzionali non sono nel manifest precached. `register.ts` ascolta `waiting`, mostra “Aggiornamento pronto” e invia `SKIP_WAITING` solo dopo azione esplicita dell'utente. Il service worker sorgente è compilato dal plugin e produce `/sw.js`; il file in `dist/` è un artefatto, non codice sorgente da modificare a mano. Nessun CDN, font remoto o stile inline è necessario per il funzionamento.

I CSS sono espliciti e locali: `tokens.css` contiene colori, spaziatura, focus e safe-area; `console.css` contiene layout desktop/mobile; `global.css` contiene reset e media query. Il tema deve definire almeno `--color-bg`, `--color-fg`, `--color-focus`, `--touch-target: 44px`, `--console-max-width: 920px` e una variante `prefers-reduced-motion`.
### 10.3.1 Contratti TypeScript minimi

I contratti sono la seam tra dominio, renderer e piattaforma. Ogni comando UI viene convertito in unione discriminata; il renderer non può costruire direttamente un `GameState`.

```ts
export type NodeId = string & { readonly __brand: "NodeId" };
export type EchoId = string & { readonly __brand: "EchoId" };

export interface BattleState {
  readonly battleId: string;
  readonly echoId: EchoId;
  readonly enemyHp: number;
  readonly enemyMaxHp: number;
  readonly turn: number;
  readonly seed: number;
  readonly origin: NodeId;
  readonly canAttune: boolean;
}

export interface GameState {
  readonly schemaVersion: number;
  readonly node: NodeId;
  readonly hp: number;
  readonly maxHp: number;
  readonly tokens: number;
  readonly flags: ReadonlySet<string>;
  readonly inventory: Readonly<Record<string, number>>;
  readonly party: readonly EchoId[];
  readonly archive: readonly EchoId[];
  readonly battle: BattleState | null;
  readonly ending: "restored" | "freed" | null;
}

export type GameCommand =
  | { readonly type: "TRAVEL"; readonly destination: NodeId }
  | { readonly type: "ATTACK" }
  | { readonly type: "ATTUNE" }
  | { readonly type: "USE_ITEM"; readonly itemId: string }
  | { readonly type: "RETREAT" }
  | { readonly type: "CHOOSE_ENDING"; readonly ending: "restored" | "freed" };

export interface GameEvent { readonly type: string; readonly messageKey: string; readonly data?: unknown; }
export interface Navigation { readonly kind: "stay" | "push" | "replace"; readonly path: string; }
export interface TransitionResult { readonly nextState: GameState; readonly events: readonly GameEvent[]; readonly navigation: Navigation; }

export interface WaylineCodec {
  encode(state: GameState): string;
  decode(input: string): { kind: "ok"; state: GameState } | { kind: "invalid"; reason: string };
}
```

`transition(state, command, rng)` è l'unico produttore di nuovi stati. `GameEvent.data` non contiene HTML: il renderer risolve solo chiavi e valori già validati. Il router espone `readLocation()`, `writeLocation()`, `onPopState()` e `replaceInvalidLocation()`; `history.state` contiene solo indice e digest tecnico, mai lo stato autorevole.

### 10.4 Determinismo

Ogni tiro deriva da:

```text
roll(battleSeed, turnNumber, channel)
```

Canali iniziali: `encounter_trigger`, `echo_selection`, `player_damage`, `critical_hit`, `enemy_attack`, `enemy_variance`, `dodge`, `attunement`, `retreat`.

`encounter_trigger` determina se un viaggio in una zona a pool genera un incontro; i pool sono limitati a 2 incontri consecutivi prima di una zona sicura (7.3). Aggiungere un tiro a un canale non deve spostare gli esiti di tutti gli altri. Nessun `Math.random()` è ammesso nei moduli di dominio.

### 10.5 PWA e aggiornamenti

- Incrementare `CACHE_NAME` a ogni modifica di moduli o dati precached.
- Usare network-first per HTML, JS, CSS e dati; cache come fallback offline.
- Non precache gli atlanti opzionali: download e cache solo dopo opt-in.
- Chiamare `registration.update()` all'avvio.
- Ricaricare automaticamente solo quando un service worker già attivo viene sostituito; mai alla prima installazione.
- Un timeout del browser non è prova di fallimento: verificare versione cache, controller attivo e asset realmente serviti.

### 10.6 Integrità, anti-tampering e stati non raggiungibili dei Wayline

Il progetto è offline-first e senza account: non è possibile autenticare crittograficamente un Wayline nel client. Un checksum non è una firma e un utente che modifica la URL può ricalcolarlo. Questa è una decisione esplicita, non una lacuna.

**Pipeline di import, in ordine:**

1. limite di lunghezza, alphabet base64url e percent-encoding sicuro;
2. decode del payload canonico e verifica della versione/checksum;
3. migrazione `Vn -> Vcurrent` senza fallback parziali;
4. validazione strutturale: numeri finiti e nei limiti, enum noti, ID esistenti, quantità non negative, party senza duplicati e battaglia coerente;
5. validazione semantica: flag compatibili, strumenti prodotti da un nodo noto, finale coerente con il boss, HP coerenti con lo scontro;
6. classificazione della raggiungibilità, senza mutare silenziosamente il save.

Il codec usa un envelope canonico compatto `{ v, p, h }`, dove `p` è payload serializzato in ordine stabile e `h` è un digest/checksum troncato. Prima della serializzazione, `ReadonlySet` diventa un array ordinato e gli oggetti vengono emessi con chiavi ordinate; il decoder ricostruisce il modello normalizzato. Il checksum rileva corruzione accidentale e test di compatibilità; la sicurezza reale deriva dal rifiuto di dati fuori contratto, dal rendering esclusivamente tramite ID/chiavi e dall'assenza di HTML o codice eseguibile nei save.

Ogni import riceve uno stato di provenienza:

```ts
type SaveTrust = "generated" | "imported-legal" | "imported-unreachable";
type LoadResult =
  | { kind: "ok"; state: GameState; trust: SaveTrust }
  | { kind: "invalid"; reason: "corrupt" | "unsupported" | "illegal" };
```

- `generated` è prodotto da `transition` e abilita tutti i test di replay;
- `imported-legal` supera schema e semantica ma non ha una prova completa di provenienza;
- `imported-unreachable` è strutturalmente valido, ma contiene una combinazione che il grafo di progressione non può produrre (per esempio una quantità al limite massimo ma senza alcun produttore raggiunto). In modalità storia viene caricato come **Wayline non canonico**, con badge visibile, senza achievement, challenge seed o telemetria di bilanciamento; il giocatore può continuare o ricominciare. Non si correggono flag automaticamente.

Uno stato semanticamente illegale, troppo grande, non supportato o con riferimenti sconosciuti viene rifiutato con una Via Smarrita e un motivo comprensibile. La validazione di raggiungibilità produce sia prove positive sia contraddizioni; uno stato non dimostrabile ma non contraddittorio resta `imported-legal`, mai “verificato”.

La firma server-side/HMAC di Wayline ufficiali è **fuori MVP e fuori dalla release offline**: potrà esistere in un formato separato (`official=1`) solo con servizio di verifica, scadenza, rotazione chiavi e fallback chiaramente documentati. Non si devono promettere classifiche o ricompense basate su save client-side.

### 10.7 Profilo tecnico browser (non Unity/Unreal/raylib)

Le skill e i deliverable di implementazione sono quelli di un'applicazione React browser: TypeScript strict, DOM semantico, CSS responsive, History API, Web Audio, Clipboard, Service Worker, Vitest e Playwright. Unity, Unreal, C e raylib non fanno parte del runtime o della toolchain di release perché non producono la PWA condivisibile richiesta.

Ogni formula e bilanciamento deve essere definita e verificata in `src/domain` (TypeScript puro, testabile in Node); il piano non accetta un secondo motore. Le review devono quindi includere routing browser, accessibilità, ciclo di vita React, cache PWA e sicurezza del parsing, non rendering loop, ECS o asset pipeline 3D.

---

## 11. Contratti dati e test di progressione

### 11.1 Contratti obbligatori

- **Mondo:** path unici, uscite esistenti, requisiti noti, descrizioni e art key valide.
- **Echi:** ID unici, HP/danni positivi, risonanze entro limiti, boss non accordabili, flag ricompensa unici.
- **Personaggi:** location esistente, grafi di dialogo terminanti, ricompense note e idempotenti.
- **Oggetti:** ID coerente, tipo valido, prezzo non negativo, campi richiesti per categoria.
- **Progressione:** ogni flag, strumento, coordinata e finale richiesto ha un produttore raggiungibile.
- **Codec:** ogni ID canonico e relativo alias di retrocompatibilità ha token compatto stabile.

Il roster personaggi completo è definito in §3.5; ogni personaggio deve rispettare questo contratto (location esistente, grafo di dialogo terminante, ricompense idempotenti) prima del gate R1.

### 11.2 Raggiungibilità

Due test distinti:

1. **BFS strutturale:** ignorando i requisiti, ogni nodo appartiene alla componente del titolo.
2. **Punto fisso di progressione:** parte dallo stato iniziale, visita nodi accessibili, applica produttori garantiti di oggetti/flag e ripete finché non emergono nuove capacità.

Il test deve dimostrare:

- nel target ridotto il Picco è raggiungibile con il solo Sigillo Meridiano, senza Frammento né Cifrario;
- nell'espansione completa (§5.4) entrambi i rami sono completabili in qualsiasi ordine e Sigillo, Frammento e Cifrario permettono di raggiungere il Picco;
- il finale del target è producibile e persistente, e nell'espansione lo sono entrambi i finali;
- esiste sempre un percorso di ritorno verso una Casa del Ristoro;
- nessun requisito viene richiesto prima che il suo produttore sia raggiungibile.

La raggiungibilità strutturale non sostituisce il test economico o il playtest di bilanciamento.

### 11.3 Matrice minima del dominio

| Sistema | Casi obbligatori |
|---|---|
| Colpisci | normale, critico, schivata, scudo, recupero, vittoria, sconfitta, flag boss |
| Sintonia | nessun sigillo, boss, fallimento, successo Compagnia, successo Archivio pieno/valido |
| Oggetto | assente, salute piena, cura normale, cura totale, decremento quantità |
| Ritirata | successo, fallimento, guardiano |
| Quest | prerequisito assente, ogni step, ricompensa una sola volta, flag+item atomici |
| Archivio | deposito/prelievo, Compagnia piena, Archivio pieno, ID assente |
| Finali | scelta, persistenza, epiloghi e caricamento da deep link |

---

## 12. Piano di produzione da zero

Le fasi corrispondono 1:1 alle milestone pesate di `meta.json`: stesso id, stesso peso, stessa slice. Il target è quello ridotto di §5.3; il contenuto dell'espansione completa (§5.4) ha peso 0 e non fa parte di questo piano.

### M0 — Bootstrap e vertical slice (peso 40, slice) — settimana 1

- [ ] Approvare solo il lessico e il contratto narrativo necessari a Valdaluce.
- [ ] Creare repository TypeScript/React con `package.json`, Vite, `tsconfig`, CSS e test runner funzionanti (10.3).
- [ ] Definire schema V1, stato iniziale, comandi, eventi, codec e router secondo i contratti 10.3.1.
- [ ] Implementare soltanto: Valdaluce → Prato → un incontro → Sintonia → Wayline condiviso.
- [ ] Coprire reload, nuova scheda, back/forward, link corrotto e Via Smarrita.
- [ ] Validare il loop con 5 giocatori e il tono con 3 lettori esterni.

**Gate MVP-0, stop/go:** il vertical slice comunica il concept senza riferimenti a Pokémon, è giocabile da tastiera e touch, ripristina lo stato tramite URL in tre browser e passa `npm run validate`. Nessun lavoro su Torre o altri Echi è autorizzato prima di questo gate. Superare questa milestone è il cancello di punteggio di `docs/agents/scoring.md`: se fallisce, il credito si ferma ai soli pesi slice superati.

### M1 — Codec Wayline (peso 12) — settimana 2

- [ ] Codec `?s=` con envelope `{v,p,h}`, checksum e limiti di lunghezza (10.6).
- [ ] Migrazioni `Vn -> Vn+1` e rifiuto dei link futuri non supportati (9.4).
- [ ] Validazione strutturale e semantica con classificazione `generated`/`imported-legal`/`imported-unreachable` (10.6).
- [ ] Via Smarrita con motivo comprensibile e “Torna all'inizio” per ogni link rifiutato.
- [ ] Golden save e fuzz deterministico del decoder.

**Gate:** replay identico su tre browser; Short Save massimo sotto 2.000 caratteri; nessun link invalido carica uno stato parziale.

### M2 — Combattimento con il sistema tattico leggero (peso 10) — settimana 3

- [ ] PRNG a canali nominati (10.4) e transizioni di battaglia pure, senza DOM.
- [ ] COLPISCI/SINTONIA/USA/RITIRATI mappati 1:1 sui comandi canonici, con i casi della matrice 11.3.
- [ ] Guardiano Rovi al Ponte di Radica; viaggio e cambio scena rifiutati con `BATTLE_LOCKED` (9.5).
- [ ] Snapshot per turno (`battleId`, HP, turno, seed, path) ricostruibile da URL e da back/forward.

**Gate:** matrice del dominio di 11.3 verde; ogni turno è ripristinabile da URL senza alterare gli esiti.

### M3 — Roster Echi del target (peso 10) — settimane 3–4

- [ ] I 9 Echi del target di §5.3 (6 accordabili + 3 non accordabili) con risonanze entro i limiti di 6.1.
- [ ] Compagnia da quattro posti, Archivio e scambio dentro e fuori dalla Casa del Ristoro.
- [ ] Sintonia con la formula di 6.3; i guardiani espongono sempre `Sintonia non possibile`.
- [ ] Contratti dati degli Echi di 11.1 validati automaticamente.

**Gate:** nessun Eco del target è ottenibile fuori dal proprio nodo; i tre non accordabili non entrano mai in Compagnia.

### M4 — Economia e consumabili (peso 8) — settimana 4

- [ ] Gettoni di Rotta, Tonico, Tonico Integro, Sigillo d'Intesa e Filo di Richiamo (7.4).
- [ ] Kit iniziale di Neral Vey con la Lanterna a Lume consegnata a Valdaluce.
- [ ] Sigillo Meridiano assegnato atomicamente con la vittoria dell'Osservatorio.
- [ ] Test economico senza incontri casuali obbligatori.

**Gate:** il test economico di 7.4 passa con zero grind obbligatorio; nessun oggetto chiave è vendibile.

### M5 — Le tre regioni del target e 12–15 nodi (peso 8) — settimana 5

- [ ] Valdaluce e dintorni (7 nodi), Rocca delle Soglie e Torre Meridiana (3 nodi), Picco dell'Asse (3 nodi): 13 nodi complessivi (§5.3).
- [ ] Sequenza Prologo → Atto I → Atto II → Atto IV, senza i rami dell'espansione (§4).
- [ ] Finale unico “Restaurare l'Atlante” con Wayline di vittoria condivisibile.
- [ ] Raggiungibilità di 11.2 sul solo target ridotto: il Picco è raggiungibile con il solo Sigillo Meridiano.

**Gate:** un nuovo giocatore arriva al Picco in 25–45 minuti senza assistenza e senza soft-lock.

### M6 — Accessibilità (peso 5) — settimana 6

- [ ] Tastiera con focus sempre visibile, ordine stabile e tasti 1–4 allineati ai comandi visibili (7.2).
- [ ] Touch con bersagli da almeno 44×44 px e safe-area rispettata (8.1).
- [ ] Screen reader: `aria-live` per log e cambi di stato, dialoghi etichettati, nessuna informazione solo cromatica (8.4).
- [ ] Viewport 320 px, zoom 200%, `prefers-reduced-motion` e contrasto WCAG AA.
- [ ] Shell accessibile desktop/mobile senza overflow del documento.

**Gate:** il flusso completo del target è giocabile con tastiera, touch e screen reader alle viewport di 14.2.

### M7 — PWA installabile e giocabile offline (peso 4) — settimana 7

- [ ] `vite-plugin-pwa` in `injectManifest`, service worker versionato e manifest installabile (10.3, 10.5).
- [ ] Network-first per HTML, JS, CSS e dati; fallback offline dopo una visita.
- [ ] Update flow con prompt esplicito e `SKIP_WAITING` solo su azione dell'utente.
- [ ] Deep link su hosting statico senza rewrite manuale (9.5).

**Gate:** dopo una visita il gioco riparte offline, un aggiornamento non serve codice o dati obsoleti e nessun asset remoto è richiesto.

### M8 — `verify.sh` e `verify.json` (peso 3) — settimana 7

- [ ] `./verify.sh` non interattivo, entro 600 s, con `npm ci` e dipendenze pinnate dal lockfile.
- [ ] `verify.json` con gli id `M0`–`M8` del `meta.json` ed exit code concorde.
- [ ] Pass Playwright pinnato sul percorso end-to-end di §13.

**Gate:** `./verify.sh` esce 0 su un albero pulito e `node scripts/score.mjs` legge il `verify.json` senza violazioni.

### Fase E — Espansione completa (peso 0, fuori dal target di release)

Non è una milestone: non compare in `meta.json`, non vale punti e non è richiesta da `./verify.sh`. Si costruisce solo dopo la release del target ridotto, senza modificare schema o bilanciamento senza migrazione e regression suite (§5.4).

- [ ] Atti III-A e III-B: Selva del Sussurro, Caverne di Vetro, Costa di Vetro, Mare Aperto, Isola della Bruma.
- [ ] Camera del Contrappeso e secondo guardiano della Torre; Frammento di Memoria e Cifrario di Marea come prerequisiti del Picco.
- [ ] Roster completo dell'espansione (§5.4), secondo finale “Liberare le Vie” ed epiloghi regionali differenzianti.
- [ ] Vie Smarrite, Echi opzionali per regione e challenge replay con seed pubblico.

### 12.1 Separazione degli scope e criteri di promozione

| Livello | Include | Non include | Criterio per procedere |
|---|---|---|---|
| **MVP-0** | Milestone `M0`: vertical slice Valdaluce, un incontro, Sintonia, Wayline, reload/deep link, Via Smarrita, tastiera/mobile, test di dominio | Torre, roster del target, economia, pixel art, audio, analytics | Gate MVP-0 chiuso; altrimenti solo correzioni del slice |
| **Target di release (R1)** | Milestone `M1`–`M8`: 12–15 nodi, 8–10 Echi, 3 regioni, 3 scontri chiave, 1 finale, codec, PWA, accessibilità, migrazioni | Espansione di §5.4, challenge pubblica, Wayline firmati | Tutti i gate 14.3 chiusi e 10–15 playtest completi |
| **Post-release opzionale (peso 0)** | Espansione completa di §5.4: rami, secondo finale, Vie Smarrite, Echi rari, replay seed, pixel atlas, telemetry opt-in | Qualsiasi requisito per capire o finire la storia | Non modifica schema o bilanciamento R1 senza migration e regression suite |

Ogni milestone deve produrre una build installabile, un changelog e fixture riproducibili. Il lavoro narrativo successivo non può mascherare un problema del dominio, del router, dei save o del vertical slice.

---

## 13. Verify — `./verify.sh` e `verify.json`

`./verify.sh` è un deliverable del progetto, risiede nella root `benchmarks/wayline/` ed è l'unico comando di verifica dell'harness: non interattivo, termina entro 600 s, exit 0 = pass, e scrive `verify.json` con esattamente gli id milestone del `meta.json` (`M0`–`M8`, schema 1, benchmark `wayline`, una voce `{id, pass, detail}` per milestone, `weight` facoltativo ma coerente con il `meta.json`). L'exit code concorda con il file: 0 se e solo se tutte le milestone sono `pass: true`.

Sequenza eseguita dallo script, con tutte le dipendenze pinnate nel lockfile (10.3):

```bash
npm ci
npm run typecheck
vitest --run          # test unitari del dominio: codec, transizioni, PRNG, raggiungibilità
npm run build
npx playwright test   # pass pinnato: @playwright/test, Chromium
```

Il pass Playwright è **uno solo** e copre il percorso end-to-end del target:

1. apertura di Valdaluce e primo incontro;
2. Sintonia e ingresso del primo Eco in Compagnia;
3. generazione del Wayline, copia della URL e verifica del checksum;
4. reload della URL con stato identico;
5. deep link in una nuova scheda sullo stesso nodo e sullo stesso turno di battaglia;
6. link manomesso o troncato: Via Smarrita con motivo, nessuno stato parziale caricato.

Solo **assert su DOM e stato** (testo del nodo corrente, HP, turno, `battleId`, presenza della Via Smarrita): nessun giudizio visivo, vietati screenshot diff e confronti di pixel. Le milestone ricevono `pass` dai risultati che competono loro: unit test del dominio per `M1`–`M5`, build e assert Playwright per `M0`, `M6`, `M7`, esecuzione dello script stesso per `M8`. `npm run dev`, la matrice E2E estesa su tre browser e il playtest umano restano attività di sviluppo, non passi di `./verify.sh`.

---

## 14. KPI e criteri di successo

### 14.1 Esperienza

- 90% dei tester completa la prima Sintonia entro 8 minuti.
- 85% comprende che il Wayline è il salvataggio senza aprire la guida.
- 80% sa spiegare perché gli Echi non vengono “catturati”.
- Almeno il 30% dei giocatori sceglie ciascun ramo per primo: nessun ordine appare obbligatorio (KPI dell'espansione completa, §5.4; nel target ridotto non ci sono rami).
- Meno del 10% delle sessioni termina per soft-lock percepito o requisito non compreso.

### 14.2 Qualità tecnica

- 100% test dominio e contratti dati verdi.
- Matrice E2E verde su Chromium, Firefox e WebKit.
- Zero errori console nei percorsi rappresentativi.
- Nessun overflow documento a 320×568, 390×844, 1440×900 e 1920×1080.
- Runtime JS+CSS obiettivo <250 KB non compressi / <75 KB gzip — decisione esplicita (sezione 10.2): React 19 + react-dom pesano ~140 KB minificati (~46 KB gzip), il resto è dominio e dati; dati non critici lazy-loaded, Preact (~4 KB gzip) come drop-in se il budget tornasse critico.
- Atlas opzionale <40 KB per bioma e mai nel precache predefinito.
- Short Save massimo ufficiale <2.000 caratteri.

### 14.3 Release verdict

**MVP-0 GO** soltanto se il gate della milestone `M0` è chiuso. Questo autorizza la costruzione della release narrativa, non è un verdetto per il gioco completo.

**R1 GO** soltanto se:

- storia e lessico canonico sono applicati a UI, dati, test e asset;
- i vecchi Wayline migrano senza perdita di stato;
- il Picco dell'Asse è raggiungibile con il solo Sigillo Meridiano e il finale del target è verificato end-to-end (rami e secondo finale valgono per l'espansione di §5.4);
- il flusso service worker non serve codice o dati obsoleti;
- performance, accessibilità e licenze superano i gate;
- almeno 10 playtest umani completi non evidenziano blocchi critici.

---

## 15. Rischi e contromisure

| Rischio | Prob. | Impatto | Contromisura |
|---|---|---|---|
| La struttura o i nomi continuano a evocare franchise rimossi (es. Pokémon) | Alta | Alto | Riscrivere fantasia, loop, ruoli e progressione insieme ai nomi; review narrativa esterna |
| URL troppo lungo con Archivio e battaglia | Media | Alto | Dizionario stabile, codec compatto, diagnostica e limite CI di 2.000 caratteri |
| Cache PWA mantiene vecchi dati o flag | Alta | Alto | Versione cache, network-first, test update da versione precedente |
| Doppia fonte dati diverge | Media | Alto | Una fonte canonica e generazione/validazione automatica |
| Economia obbliga grinding | Media | Medio | Ricompense garantite e simulazione no-random-encounters |
| I due rami dell'espansione creano combinazioni non testate | Media | Alto | Test di raggiungibilità per entrambe le permutazioni + E2E mirati |
| ASCII illeggibile su mobile | Media | Medio | Budget righe/colonne, snapshot viewport e fallback testuale |
| Pixel art aumenta peso e rompe offline | Media | Medio | Opt-in lazy, limite 40 KB/bioma, ASCII sempre disponibile |
| Passivi della Compagnia producono build dominante | Alta | Medio | Cap espliciti, quattro archetipi benchmark, telemetry playtest |
| Il finale morale dell'espansione appare arbitrario | Media | Alto | Foreshadowing in entrambi i rami e dialoghi reattivi alle scelte |

---

## 16. Definition of Done

Una feature è completa quando:

- [ ] usa il lessico canonico e non reintroduce riferimenti ai franchise rimossi;
- [ ] ha contratto dati e transizione di dominio testati senza DOM;
- [ ] aggiorna stato, feedback e Wayline atomicamente;
- [ ] è raggiungibile nei grafi strutturale e di progressione;
- [ ] preserva i save delle versioni precedenti o include migrazione e fixture;
- [ ] classifica Wayline importati come `generated`, `imported-legal` o `imported-unreachable` senza fidarsi del checksum come firma;
- [ ] funziona con tastiera, touch e tecnologie assistive;
- [ ] è verificata nel browser alle viewport target senza overflow;
- [ ] funziona offline dopo una visita e si aggiorna correttamente online;
- [ ] rispetta i budget di codice, asset e lunghezza save;
- [ ] aggiorna documentazione, dati e test nello stesso work package.

Il gioco è **release-ready** soltanto quando tutti i gate della sezione 14.3 sono chiusi. Fino ad allora il verdetto rimane **NO-GO per il narrativo**.
