# RistoApp

Applicazione per la ristorazione. Progetto in fase iniziale (avviato ad agosto 2026).

> Questo file è la fonte di verità per stack, comandi e convenzioni. Va tenuto aggiornato:
> quando una sezione qui sotto è ancora un TODO, significa che quella decisione non è stata
> presa o non è stata scritta — chiedere prima di assumere.

## Stack

| Livello | Scelta | Stato |
|---|---|---|
| Frontend | Webapp responsive (desktop + mobile) | framework da definire |
| Backend | Supabase (Postgres gestito, auth, storage, realtime) | deciso |
| Client nativo | Flutter (cross-platform) | obiettivo futuro, fase 2 |

Il ragionamento dietro queste scelte è nella memoria di progetto (`stack_decisions.md`),
non ripeterlo qui.

## Comandi

TODO — da compilare dopo lo scaffolding del progetto.

```
# install
# dev
# build
# test
# migrazioni db
```

## Struttura del repo

```
supabase/migrations/   migrazioni SQL numerate — l'unica fonte di verità dello schema
  0001_initial_schema.sql
  0002_rls_policies.sql
```

Il resto arriva con lo scaffolding del frontend.

Per eseguire le migrazioni fuori da Supabase (test locale) serve uno stub dello schema
`auth` (tabella `auth.users` e funzione `auth.uid()`), che Supabase fornisce di suo.
Lo stub non va versionato dentro `migrations/`: sporcherebbe la sequenza applicata in
produzione.

## Convenzioni

Queste sono le regole di lavoro, non di stile del codice (quelle arrivano con il linter).

- **Lo schema del database vive in migrazioni SQL versionate nel repo**, non in modifiche
  fatte a mano dalla dashboard Supabase. Se una modifica nasce dalla dashboard, va comunque
  riportata in una migrazione prima del commit.
- **Row Level Security attiva su ogni tabella con dati utente.** Una tabella senza policy RLS
  è una tabella pubblica: non va mai in produzione così.
- **Nessun segreto nel repo.** Chiavi in `.env` locale, `.env.example` versionato con i nomi
  delle variabili e valori fittizi. La `service_role` key di Supabase non tocca mai il client.
- **Regole di business lato backend/database**, non solo nel frontend. Un futuro client Flutter
  deve poter usare lo stesso backend senza riscriverle. Validazione lato client = comodità per
  l'utente; validazione lato server = sicurezza.

- **Architettura scalabile e ben organizzata come default.** Separare le responsabilità (client browser vs server, logica di dominio vs UI) e tenere le regole di business lato backend/DB, così che il futuro client Flutter le riusi senza riscriverle. Preferire moduli riutilizzabili e una struttura chiara a soluzioni "usa e getta".
- **Commenti nel codice in inglese, chiari ed esaustivi.** Spiegano il *perché* di una scelta, non solo il *cosa*. Identificatori, messaggi di commit e README in inglese; la conversazione e questa documentazione interna restano in italiano.

## Contesto sull'autore

Flavio è sviluppatore web e Unreal Engine. Conosce bene il frontend, **non è esperto di backend
e sta usando questo progetto anche per impararlo**.

Quindi: nelle spiegazioni di backend (SQL, auth, RLS, deploy) esplicitare il *perché* e il
concetto sottostante, non solo i passi da eseguire. Su task semplici essere concisi; su task
complesse argomentare bene, anche con metafore. Non dare per scontata la terminologia
backend/devops.
