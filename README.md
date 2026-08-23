# RistoApp

Prenotazione tavoli last-minute con piantina interattiva del locale, ordine e
pagamento al tavolo, e gamification a livelli per i clienti.

## Stato

Fase 1: webapp responsive. Backend su Supabase (Postgres + auth + storage +
realtime). Obiettivo futuro: app nativa dedicata (Flutter).

## Struttura

- `supabase/migrations/` — schema del database in SQL versionato (fonte di verità)
- `CLAUDE.md` — stack, comandi e convenzioni di progetto

## Avvio

Da compilare dopo lo scaffolding del frontend.

## Configurazione

Copia `.env.example` in `.env.local` e inserisci le chiavi di Supabase e Stripe.
I segreti non vanno mai committati.
