# RistoApp

Last-minute table booking on an interactive floor plan that mirrors the real
venue, in-app ordering with table-side payment, and a level-based loyalty
system for guests.

## Status

Phase 1: responsive web app (desktop + mobile). Backend on Supabase
(Postgres + auth + storage + realtime). Future goal: a dedicated native app
(Flutter).

## Structure

- `supabase/migrations/` — database schema as versioned SQL (source of truth)
- `CLAUDE.md` — stack, commands, and project conventions

## Getting started

To be filled in after the frontend scaffold.

## Configuration

Copy `.env.example` to `.env.local` and add your Supabase and Stripe keys.
Secrets are never committed.
