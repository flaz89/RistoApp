-- =============================================================================
-- 0006 — Park restaurant domain (pivot 05/09/2026)
--
-- The 05/09/2026 pivot moves the POC from restaurants to shops: order-ahead
-- + megaphone opportunities for shops of perishable goods in San Salvario. The
-- restaurant domain is not deleted — it is "parked", ready to be revived if
-- the shops POC validates and a second vertical becomes worth building. The
-- application code moves under `src/parked/` (a separate task, tracked as
-- Linear SHP-2); this migration drops the schema those tables live in so
-- the database does not carry vestigial structures while the shops schema
-- is built on top (planned in a follow-up migration, Linear SHP-3).
--
-- What stays: profiles, payment_methods (both user-scoped, reused by shops),
-- the pgcrypto/btree_gist/postgis extensions, and the set_updated_at()
-- trigger function. RLS policies from 0002 that target the dropped tables
-- disappear implicitly with the tables (CASCADE), so nothing extra to remove.
--
-- CASCADE is used deliberately: every restaurant-scoped table depends on
-- `restaurants` directly or transitively, and enumerating the drop order by
-- hand is noise. If a future object outside this migration depended on any
-- of these tables, CASCADE would drop it too — we accept that risk here
-- because the whole vertical is being parked in one atomic operation.
--
-- Reversibility: to bring restaurants back, replay migrations 0001-0005
-- against a fresh vertical (or rewrite them as a single 000X_shops_and_
-- restaurants.sql that scopes tables by business_type). This migration is
-- not itself reversible in-place — history is history.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Drop the public RPC first (it references `restaurants`)
-- -----------------------------------------------------------------------------
-- The signature must match exactly for `drop function` to find it; kept in
-- sync with 0005 (the last definition).
drop function if exists public.nearby_restaurants(double precision, double precision, integer, integer);

-- -----------------------------------------------------------------------------
-- 2. Drop restaurant-scoped tables (CASCADE handles the dependency graph)
-- -----------------------------------------------------------------------------
-- Order does not matter with CASCADE, but tables are listed roughly leaf-first
-- for readability. Every RLS policy attached to these tables is dropped
-- automatically with the table.
drop table if exists public.order_perks           cascade;
drop table if exists public.perks                 cascade;
drop table if exists public.level_events          cascade;
drop table if exists public.feedbacks             cascade;
drop table if exists public.platform_fee_ledger   cascade;
drop table if exists public.payments              cascade;
drop table if exists public.order_items           cascade;
drop table if exists public.orders                cascade;
drop table if exists public.menu_item_options     cascade;
drop table if exists public.menu_items            cascade;
drop table if exists public.menu_categories       cascade;
drop table if exists public.reservations          cascade;
drop table if exists public.restaurant_tables     cascade;
drop table if exists public.floor_plan_elements   cascade;
drop table if exists public.floor_plans           cascade;
drop table if exists public.restaurant_members    cascade;
drop table if exists public.restaurant_photos     cascade;
drop table if exists public.restaurants           cascade;

-- -----------------------------------------------------------------------------
-- 3. Drop restaurant-scoped enum types
-- -----------------------------------------------------------------------------
-- These are all defined in 0001 and are only used by the tables above. CASCADE
-- is a no-op for enums (no dependencies remain after step 2) but harmless.
drop type if exists public.restaurant_status      cascade;
drop type if exists public.restaurant_role        cascade;
drop type if exists public.floor_element_kind     cascade;
drop type if exists public.table_shape            cascade;
drop type if exists public.reservation_status     cascade;
drop type if exists public.reservation_source     cascade;
drop type if exists public.order_status           cascade;
drop type if exists public.order_channel          cascade;
drop type if exists public.payment_method_kind    cascade;
drop type if exists public.payment_status         cascade;
drop type if exists public.fee_status             cascade;
drop type if exists public.feedback_direction     cascade;
drop type if exists public.level_event_source     cascade;
drop type if exists public.perk_kind              cascade;

-- -----------------------------------------------------------------------------
-- 4. What remains
-- -----------------------------------------------------------------------------
-- Tables:     profiles, payment_methods
-- Extensions: pgcrypto, btree_gist, postgis
-- Functions:  set_updated_at() (the trigger fn from 0001; its restaurant-scoped
--             triggers were dropped with the tables above)
-- All of these are reused by the shops schema in the follow-up migration
-- (Linear SHP-3): businesses, menu_products, opportunities, orders (with a
-- flow_type enum for 'preorder' | 'occasion'), and their RLS policies.
