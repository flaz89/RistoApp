---
name: Curius
last_updated: 2026-09-05
---

# Curius Strategy

> **Aggiornato 05/09/2026 dopo il pivot POC.** I ristoranti sono in stand-by, il POC si concentra sui negozi di prodotti freschi deperibili in San Salvario (Torino). La Positioning, i Boundaries, la Voce e i Users primari restano validi — sono più larghi del POC e sopravvivono al pivot. Dettaglio operativo del POC in project memory (`product_scope.md`, `pilot_playbook.md`, `poc_success_metrics.md`).

## Purpose

Il tempo è la risorsa che si perde di più oggi: in coda, nel salire e scendere per la città, nell'affidarsi alla sorte per un prodotto che potrebbe essere già finito, o — lato commerciante — nel preparare cose che finiscono buttate. Curius restituisce il tempo a entrambi i lati: a chi vuole vivere la città senza dipendere dal delivery e a chi vende senza più buttare quello che ha preparato.

## Positioning

Curius è il feed real-time del tempo che la tua città ha da vivere adesso — non da farsi consegnare. Parte dalla cultura italiana del centro cittadino (dove le persone escono, camminano, si incontrano) e si estende ovunque esista un tessuto urbano dove questo vale, mall americani inclusi in fase 2.

## Users

**Primary:** Adulto tra i 20 e i 45 anni, indipendente, con impegni lavorativi e vita privata che gli mangiano la giornata. Assume Curius per trasformare la finestra di tempo libero (uscita da lavoro, pausa lunga, weekend) in serata/pomeriggio vissuti fuori — un pane appena sfornato ritirato senza fila, un'occasione al volo per non far buttare l'invenduto, e — quando i ristoranti torneranno — un tavolo dove voleva davvero cenare — invece che in code, telefonate e ripieghi.

**POC (2026-09):** stesso primary, ristretto a chi vive/lavora in San Salvario (Torino) e passa fisicamente dai negozi di quartiere. Vedi project memory `product_scope.md` §Attori.

## Boundaries

- **Niente delivery a domicilio.** Curius porta le persone fuori, non consegna dentro; il delivery è il modello opposto (economico e culturale) e diluirebbe la Positioning.
- **Niente catene multinazionali / retail globale** (McDonald's, Burger King, Autogrill, KFC, Starbucks…). Il volume che portano non ritorna: il primary non li cerca. Sabotaggio del D30 return rate + tradimento del brand "cultura del centro".
- **Niente espansione a nuove città** prima che la città attuale sia al 40%+ di partner attivi. La densità è il valore, non il conteggio. **POC**: applica anche ai quartieri — San Salvario prima di Vanchiglia/Cit Turin/Crocetta.
- **Niente ads / promoted listing / posizioni a pagamento.** Nel feed comanda la disponibilità reale, non chi paga. La meritocrazia è parte del prodotto.

_Resist a change when:_ porta volume o ricavo ma dilata il primary (cittadino urbano) o rovescia l'approach (real-time + anti-delivery + cultura del centro). Il "volume che aiuta" è la trappola che uccide più marketplace nuovi di qualsiasi bug.

## Key metrics

Le metriche globali di lungo periodo restano quelle sotto. Per il POC valgono soglie specifiche (trigger economico + numeri sui flussi + qualitativo) in project memory `poc_success_metrics.md`.

- **WAU per zona di lancio** — cittadini unici che aprono l'app almeno una volta a settimana in una zona coperta; misurata via analytics prodotto (leading).
- **% partner attivi su iscritti** — quota di partner che ha ricevuto almeno 1 ordine negli ultimi 7 giorni; misurata via DB. Standard: <40% = problema; >60% = PMF di supply (leading).
- **Ordini completati per settimana per zona** — output economico effettivo; misurata via DB (lagging).
- **D30 return rate cliente** — su 100 utenti che fanno il primo ordine, quanti tornano entro 30 giorni; misurata via DB. <20% = no PMF; >40% = qualcosa di serio (lagging).
- **Cadenza attivazioni partner/settimana** — nuovi partner attivati per settimana; sanity check del GTM porta-a-porta. Target POC: 5 nuovi pilota in 4-6 settimane dopo il primo tester.

## Tracks

### T1 — Prodotto consumer real-time

Mappa live, feed "cosa c'è adesso qui vicino", filtri per momento/tipo, geolocalizzazione, pre-ordina-e-ritira dal listino del negozio, occasioni megafono in tempo reale. **POC**: card polimorfica con 2 CTA (pre-ordine sempre + occasione se attiva) per ogni negozio di San Salvario. **Post-POC (v2+)**: prenotazione tavolo con vista sulla piantina — sveglia dei ristoranti dal park se il POC shops valida.

_Why it serves the approach:_ il "real-time della città" vive o muore qui — è il cuore del prodotto lato demand, valuta ogni scelta con "riduce il tempo tra vuole e ottiene?".

### T2 — Infrastruttura commerciante

Backoffice PWA (non app store), notifiche push su dispositivo esistente del negoziante, integrazione stampante termica come "pager fisico" opzionale (dal 3°-4° pilota), dashboard timeline con pre-ordini in colonna separata, sistema di stato ordine semplificato (paid → ready → delivered), Stripe Connect Express con onboarding in-app, fee-back automatica su ritardi, zero-hardware per il negoziante.

_Why it serves the approach:_ la promessa real-time è possibile solo se il commerciante può rispondere in tempo reale senza rompersi le scatole — questo track fa sì che il lato supply sostenga la Positioning invece di sabotarla.

### T3 — Go-to-market Torino, quartiere per quartiere

Attivazione partner porta a porta, kit di benvenuto (vetrofania + adesivi "RITIRI CURIUS" + volantini), setup listino fatto fisicamente da Curius (~2h/pilota), referral in-app (badge e visibilità, mai cash), content locale IG/TikTok, micro-PR locale, partnership con uffici turistici, coworking, università. **POC**: **San Salvario** come zona pilota (non Vanchiglia — cambiato al pivot per densità e mix categorie).

_Why it serves the approach:_ la Positioning è cittadina e locale — "cultura del centro" non si testa da uno spreadsheet. Va costruita in strada, un caffè alla volta. È anche il track che sblocca M5.

### T4 — Brand come prodotto

Landing v2 con H1 idiom-flip animato, identità visiva coerente (anfora, arancione, Baloo, tono duale), copy che rifiuta i cliché di categoria ("pre-ordina e ritira" ≠ "salta la coda"), storytelling social. **POC**: landing rivista in modo leggero — pilastro Ristoranti marcato "In arrivo", pilastri Negozi + Occasioni pieno-schermo. Non riscritta.

_Why it serves the approach:_ contro Deliveroo/TheFork/JustEat/TooGoodToGo il vantaggio non è tecnico (loro possono copiare una feature in due settimane) — è di brand. La Positioning "anti-delivery, cultura del centro" ha bisogno di essere sentita, non solo detta.

## Brand

**Tagline (headline / hero):** *"Chi tardi arriva, meglio alloggia."* — flip dell'idiom "chi tardi arriva, male alloggia": cambia una sola parola (male → meglio) e ribalta il tabù del last-minute in vantaggio. **Nota post-pivot**: la tagline è nata pensando al tavolo ristorante ("male alloggia" = niente tavolo). Ora funziona anche per shops ("meglio" = trovo pane fresco anche a fine giornata perché l'occasione è aperta). Regge, rivedere solo se emerge dissonanza chiara sui pilota.

**Brand statement (pitch / one-liner):** *"Il feed real-time del tempo che la tua città ha da vivere adesso — non da farsi consegnare."* [Provvisorio: concetto ok, formulazione da affinare.]

**Voce di relazione (partner / comunicazione 1:1):** *"Sarai il primo a far parte del viaggio."* — usata quando un commerciante fuori zona chiede di entrare: gentile, promettente, mercuriana. [Provvisorio: da strutturare meglio quando avremo copy voice completa.]
