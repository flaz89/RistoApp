# Curius (ex-RistoApp)

Applicazione per il commercio di quartiere. Progetto avviato agosto 2026, **pivotato 05/09/2026** dal modello ristoranti al **POC shops** (negozi di prodotti freschi deperibili in San Salvario, Torino). Il codice/schema ristorante-specifico è **congelato in `parked/`** — vedi memoria progetto per il ragionamento.

> Questo file è la fonte di verità per stack, comandi e convenzioni del repo. Va tenuto aggiornato: quando una sezione qui sotto è ancora un TODO, significa che quella decisione non è stata presa o non è stata scritta — chiedere prima di assumere.
>
> **Il ragionamento di prodotto** (scope POC, i due prodotti, metriche successo, pilot playbook, commissioni, feature backlog) vive nella project memory locale, non qui. File chiave della memoria: `product_scope.md`, `poc_success_metrics.md`, `pilot_playbook.md`, `payments_model.md`, `product_flows.md`, `stack_decisions.md`, `feature_backlog.md`.

## Stack

| Livello | Scelta | Stato |
|---|---|---|
| Frontend | **Next.js 16** + React 19, Tailwind v4 | deciso |
| Mappa | MapLibre GL | deciso |
| Backend | Supabase (Postgres + auth + storage + realtime) | deciso |
| Geo | PostGIS in schema `extensions` | deciso |
| Pagamenti | Stripe test mode (POC) → Stripe Connect Express (post trigger) | roadmap chiara, vedi `payments_model.md` |
| Client nativo | Flutter (cross-platform) | obiettivo futuro, fase 2 |

## Comandi

```bash
npm install
npm run dev           # next dev (con copy-map-worker automatico)
npm run build         # next build (NON gira dal bridge, serve rete: Mac o Vercel)
npm run start         # next start
npm run lint          # eslint
npm run seed          # seed dati di prova (richiede .env.local)
```

Verifica pre-push: `npx tsc --noEmit` + `npx eslint src`.

## Struttura del repo

```
src/                        codice applicativo Next.js
  app/                      route App Router
  components/               componenti UI
  lib/                      utilities (geo, supabase, ecc.)
  parked/                   CODICE CONGELATO — vedi src/parked/README.md quando creato
supabase/migrations/        migrazioni SQL numerate, unica fonte di verità dello schema
  0001_initial_schema.sql
  0002_rls_policies.sql
  0003_restaurants_geo.sql
  0004_restaurant_logo.sql
  0005_nearby_coordinates.sql
  0006_park_restaurants.sql (in review, non applicata)
public/                     asset statici (brand/, icons/, mappe)
scripts/                    script one-off (seed, migrazioni ad-hoc)
```

Per eseguire le migrazioni fuori da Supabase (test locale) serve uno stub dello schema `auth` (tabella `auth.users` e funzione `auth.uid()`), che Supabase fornisce di suo. Lo stub non va versionato dentro `migrations/`.

## Convenzioni

- **Lo schema del database vive in migrazioni SQL versionate nel repo**, non in modifiche fatte a mano dalla dashboard Supabase. Convenzioni di migrazione in dettaglio: skill `ristoapp-supabase-migration`.
- **Row Level Security attiva su ogni tabella con dati utente.** Una tabella senza policy RLS è una tabella pubblica: non va mai in produzione così.
- **Nessun segreto nel repo.** Chiavi in `.env.local`, `.env.example` versionato con nomi e valori fittizi. La `service_role` key di Supabase non tocca mai il client.
- **Regole di business lato backend/database**, non solo nel frontend. Un futuro client Flutter deve poter usare lo stesso backend senza riscriverle. Validazione lato client = comodità per l'utente; validazione lato server = sicurezza.
- **Architettura scalabile e ben organizzata come default.** Separare le responsabilità (client browser vs server, logica di dominio vs UI). Preferire moduli riutilizzabili e struttura chiara a soluzioni "usa e getta".
- **Commenti nel codice in inglese, chiari ed esaustivi.** Spiegano il *perché* di una scelta, non solo il *cosa*. Identificatori, messaggi di commit e README in inglese; la conversazione e questa documentazione interna restano in italiano.
- **Piccoli step con check-in.** Non ship in blocchi grossi senza verifica intermedia.

## Gotcha operativi

- **`npm run build` NON gira dal bridge** (VM locale senza rete). Build su Mac o Vercel.
- **Commit dal bridge (device_bash)**: git non ha identità → usare `git -c user.name="Flavio Mammoliti" -c user.email="flavio.mammoliti@gmail.com" commit`. Poi git lascia `.lock` che il bridge non può cancellare → `mv .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock .git/_locktrash/` e NON rilanciare git dopo.
- **CSS `mask` SVG non carica da `file://`** (Chromium blocca): serve http (Next dev/Vercel ok).
- Altri tranelli in `debugging_gotchas.md` della project memory.

## Pivot POC (05/09/2026) — riferimento rapido

- **Cosa costruisce il POC**: 2 prodotti (pre-ordine dal menu + occasione megafono), 6 pilota in San Salvario, categorie panetteria/pasticceria/fruttivendolo/pescheria/gelateria/macelleria, card cliente polimorfica con 2 CTA.
- **Cosa NON costruisce**: piantina sala, prenotazioni tavolo, tutto restaurant-specific (parked).
- **Metriche successo**: 3 negozi firmati con commissione reale a mese 2 (trigger economico) + almeno 1 flusso sopra soglia + 4/6 rinnovi. Dettaglio: `poc_success_metrics.md`.
- **Pagamenti**: mock ora, Stripe Connect Express al trigger. Commissioni asimmetriche (cliente su pre-ordine, negoziante su occasione). Dettaglio: `payments_model.md`.
- **Landing**: refresh leggero, pilastro Ristoranti marcato "In arrivo". Non riscritta. Dettaglio: `landing_page.md`.

## Contesto sull'autore

Flavio è sviluppatore web e Unreal Engine. Conosce bene il frontend, **non è esperto di backend e sta usando questo progetto anche per impararlo**.

Quindi: nelle spiegazioni di backend (SQL, auth, RLS, deploy) esplicitare il *perché* e il concetto sottostante, non solo i passi da eseguire. Su task semplici essere concisi; su task complesse argomentare bene, anche con metafore. Non dare per scontata la terminologia backend/devops.
