-- =============================================================================
-- 0007 — Shops schema (POC pivot 05/09/2026)
--
-- Introduces the six tables that carry the two shop-facing products of the POC:
-- pre-order from the shop's menu, and one-off "megaphone" opportunities to
-- clear near-waste stock. Both flows converge on a single `orders` table with
-- a `flow_type` discriminator, so pricing, reporting and refunds can be reasoned
-- about uniformly.
--
-- Assumptions (already true in the DB after 0006_park_restaurants):
--   * `profiles`, `payment_methods` are the only application tables left.
--   * Extensions `pgcrypto`, `btree_gist`, `postgis` are installed (postgis in
--     schema `extensions`).
--   * The trigger function `public.set_updated_at()` from 0001 still exists.
--
-- Conventions inherited from schema_decisions and the ristoapp-supabase-migration
-- skill — non-negotiable in this file:
--   * Money in integer cents, never float.
--   * All instants are `timestamptz`.
--   * Historical rows (order_items) SNAPSHOT the values they need. They do not
--     join the live catalog at read time — the shop owner will change prices
--     and past receipts must stay stable.
--   * `on delete` chosen deliberately per FK.
--
-- What this migration DOES NOT do (deliberately):
--   * RLS policies and the `nearby_businesses` RPC → next migration (RIS-47,
--     0008_shops_rls.sql). Leaving RLS off here means these tables are
--     accessible without policies for a brief window between this migration and
--     0008; do not apply this alone to a public environment without immediately
--     applying 0008 after it.
--   * The "one opportunity per 4 hours of opening" cap → application-level
--     check in the create-opportunity RPC. It depends on `opening_hours`
--     interpretation and is too shape-heavy for a Postgres constraint.
--   * `owner_id` on businesses. Membership lives entirely in
--     `business_memberships` from day one — see account_model project memory
--     for the rationale (delegation, multi-owner, catene). This deviates from
--     the wording in Linear RIS-46 which mentions `owner_id (FK profiles)`;
--     account_model is the current source of truth.
-- =============================================================================

set search_path = public, extensions;

-- =============================================================================
-- 1. Enum types
-- =============================================================================

-- The type of activity a business runs. Only `shop` is created in the POC;
-- `restaurant` is kept in the enum so a future revival does not require a
-- migration that alters the enum in production (adding a value to an enum in
-- Postgres is trivial, but changing the shape of downstream tables that hard-
-- coded a check on the enum is not).
create type business_type as enum ('shop', 'restaurant');

-- The six shop categories the POC recruits pilots from. Freeform text was
-- considered and rejected: the category drives filtering, iconography and
-- outreach lists, so a typo becomes a silent bug.
create type shop_category as enum (
  'panetteria',
  'pasticceria',
  'fruttivendolo',
  'pescheria',
  'gelateria',
  'macelleria'
);

-- Membership role on a business. New roles can be added later without touching
-- policies that check role membership as an IN(...) set.
create type business_role as enum ('owner', 'manager', 'staff');

-- Which of the two product flows an order belongs to. Determines who pays the
-- platform fee (client on preorder, shop on occasion — see payments_model).
create type order_flow_type as enum ('preorder', 'occasion');

-- Order lifecycle for the POC. Names are deliberately about the physical event,
-- not the internal system: `paid` = client has paid and the shop must prepare;
-- `ready` = shop marked it prepared (optional, only if it wants to notify);
-- `delivered` = QR scanned at pickup; `refunded` = money returned;
-- `unclaimed` = a nightly job marks stale `paid` rows that were never picked up
-- (the shop keeps the money — see product_scope §Refund).
create type order_status as enum ('paid', 'ready', 'delivered', 'refunded', 'unclaimed');

-- Opportunity lifecycle. `active` is the only state that counts against the
-- "one opportunity at a time per business" rule (partial unique index below);
-- `closed_early` is the shop pulling it before it sold out or expired.
create type opportunity_status as enum ('active', 'sold_out', 'expired', 'closed_early');

-- =============================================================================
-- 2. businesses
-- =============================================================================
-- The shop itself. Owned/managed by users through `business_memberships`
-- exclusively — there is no `owner_id` column on this table. That keeps every
-- write policy uniform ("does this user have a membership with role in (...)
-- on this business?") and lets us add owners, sell businesses, or delegate to
-- a manager without touching the schema.
create table businesses (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  business_type            business_type not null,
  category                 shop_category not null,

  -- Fiscal identifiers. Unique on P.IVA prevents accidentally creating the
  -- same business twice through the onboarding form. Nullable stripe account
  -- because it is populated only when the business finishes Stripe Connect
  -- Express onboarding (phase 2 — see payments_model); before then, the
  -- business exists in mock mode.
  vat_number               text not null unique,
  iban                     text,
  stripe_account_id        text unique,

  -- Location. Latitude/longitude are what humans and forms deal with; the
  -- `location` geography column is what the map query uses. Same pattern as
  -- restaurants in 0003: `location` is GENERATED so it cannot drift from the
  -- two numeric columns.
  address                  text not null,
  city                     text not null,
  latitude                 double precision not null,
  longitude                double precision not null,
  location extensions.geography(Point, 4326) generated always as (
    extensions.st_setsrid(
      extensions.st_makepoint(longitude::double precision, latitude::double precision),
      4326
    )::extensions.geography
  ) stored,

  -- Presentation and calendar.
  photo_url                text,
  -- Weekly opening hours as {mon:[{open,close},...], tue:[...], ...}. JSON
  -- rather than columns because a shop can have split hours (e.g. 8-13, 16-20)
  -- and the shape needs to survive schema changes to how it is edited.
  opening_hours            jsonb not null default '{}'::jsonb,
  -- Extraordinary closures as an array of dates. Cheaper than a table for the
  -- POC and easy to iterate on the client. A companion `extraordinary_openings`
  -- (holidays the shop opens against its default) can be added later.
  extraordinary_closures   date[] not null default '{}',

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index businesses_type_category_idx on businesses (business_type, category);
create index businesses_location_idx      on businesses using gist (location);

create trigger businesses_set_updated_at
  before update on businesses
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 3. business_memberships
-- =============================================================================
-- Composite primary key: a user cannot hold two roles on the same business (if
-- role changes, the existing row is updated). If we ever need multiple roles
-- per user per business, we swap this to a surrogate PK — that is not a
-- migration we need to preempt today.
create table business_memberships (
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid not null references profiles(id)   on delete cascade,
  role        business_role not null,
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- The reverse lookup ("which businesses is this user a member of") is common
-- enough (backoffice landing, session bootstrap) to warrant its own index; the
-- PK above already indexes (business_id, user_id).
create index business_memberships_user_id_idx on business_memberships (user_id);

-- =============================================================================
-- 4. menu_products
-- =============================================================================
-- The shop's ongoing catalog. Setup is done physically by Curius on the pilot's
-- device (pilot_playbook) — this table stores what the shop offers day-to-day
-- through pre-order. `is_available` is the "sold out today" toggle; the daily
-- default is "same as yesterday" (managed in application code, not here).
create table menu_products (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,

  name          text not null,
  -- Length cap is a soft product rule (keeps the card scannable). Enforced
  -- at the DB so the app cannot accidentally save a paragraph and blow up the
  -- layout.
  description   text check (description is null or char_length(description) <= 200),

  -- Photo is required per product_scope; a card without a photo looks broken
  -- and product_scope makes this an explicit rule of the pilot setup.
  photo_url     text not null,

  price_cents   integer not null check (price_cents >= 0),

  -- Freeform text in the POC ("pane", "biscotti", "insalate"). If clustering
  -- emerges from the pilot data we can promote it to an enum later; enforcing
  -- one now would fail closed on the first shop that phrases things differently.
  category      text,

  is_available  boolean not null default true,
  sort_order    integer not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index menu_products_business_id_idx on menu_products (business_id);

create trigger menu_products_set_updated_at
  before update on menu_products
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 5. opportunities
-- =============================================================================
-- A one-off "megaphone" push: near-waste stock the shop wants gone by a set
-- pickup deadline. Photo and pickup deadline are required (the whole event is
-- built around them); the description is optional so the 60-second creation
-- flow stays actually 60 seconds.
create table opportunities (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,

  photo_url           text not null,
  description         text,
  price_cents         integer not null check (price_cents >= 0),

  -- Quantities are the visible countdown for the client. `quantity_remaining`
  -- is the source of truth (never derive it from `orders` on the read path —
  -- the client card must not run a subquery to render); it is decremented by
  -- the order-creation RPC (0008).
  quantity_total      integer not null check (quantity_total > 0),
  quantity_remaining  integer not null check (quantity_remaining >= 0),
  check (quantity_remaining <= quantity_total),

  pickup_by           timestamptz not null,
  status              opportunity_status not null default 'active',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index opportunities_business_id_idx on opportunities (business_id);

-- "One opportunity at a time per business" from shops_megaphone §Rules. A
-- partial unique index is the cheapest form of this rule: it lets the shop
-- have many historical rows in other states but prevents two concurrent
-- `active` ones. The 4-hour cap is application-level (see file header).
create unique index opportunities_one_active_per_business
  on opportunities (business_id)
  where status = 'active';

create trigger opportunities_set_updated_at
  before update on opportunities
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 6. orders
-- =============================================================================
-- One row per client payment. `flow_type` says which product it belongs to and
-- decides who pays the platform fee (informational at this level — the
-- application computes fees before insert; the ledger columns below are the
-- record of what was actually charged).
create table orders (
  id                uuid primary key default gen_random_uuid(),

  -- restrict on business: refuse to delete a shop that has orders in its
  -- history. If a shop leaves the platform, its orders stay in ours (they are
  -- our accounting), so tearing the shop out from under them is never right.
  business_id       uuid not null references businesses(id) on delete restrict,

  -- set null on customer: a GDPR erasure of a user must be possible without
  -- destroying the shop's income history. order_items snapshot the item name
  -- (see below), so an anonymized order is still legible.
  customer_id       uuid references profiles(id) on delete set null,

  flow_type         order_flow_type not null,

  -- Total the client actually paid, in cents. `curius_fee_cents` and
  -- `stripe_fee_cents` are the pieces of that total, kept on the order so the
  -- payout amount is a simple `total - fees` and the split is auditable per
  -- order. They are NOT a substitute for the append-only fee ledger that
  -- payments will introduce later; they are the per-order breakdown at the
  -- moment of charge.
  total_cents       integer not null check (total_cents >= 0),
  curius_fee_cents  integer not null default 0 check (curius_fee_cents >= 0),
  stripe_fee_cents  integer not null default 0 check (stripe_fee_cents >= 0),

  status            order_status not null default 'paid',

  -- Random opaque token the shop scans at pickup. Kept `text` (not uuid) so
  -- the QR encoder can use a short URL-safe token if it prefers. Uniqueness is
  -- what makes it usable as an identifier at the counter.
  qr_code           text not null unique,

  notes             text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_business_id_idx on orders (business_id);
create index orders_customer_id_idx on orders (customer_id);
-- The dashboard queries "current pending orders per business" repeatedly.
create index orders_business_status_idx on orders (business_id, status);

create trigger orders_set_updated_at
  before update on orders
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 7. order_items
-- =============================================================================
-- One row per product in a preorder, or one row per occasion purchase (the
-- occasion case is a single row per order — an occasion is one product with a
-- quantity, not a cart). We keep both cases in one table because a POC report
-- like "revenue per shop" wants to sum both flows uniformly.
--
-- SNAPSHOT: `item_name_snapshot` and `unit_price_cents` are copied at the
-- moment of purchase and are NEVER updated. The shop will change prices and
-- rename products; historical receipts must not change with them. The FKs are
-- kept for convenience joins on live data, and go to `set null` on delete so
-- that a deleted product does not orphan an order row — the snapshot remains
-- readable.
create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,

  menu_product_id    uuid references menu_products(id) on delete set null,
  opportunity_id     uuid references opportunities(id) on delete set null,

  -- XOR: a row is either a preorder line (menu_product_id) or an occasion
  -- purchase (opportunity_id), never both, never neither. The parent order's
  -- `flow_type` is expected to match; enforcing that cross-row consistency is
  -- the responsibility of the order-creation RPC in 0008 (a check constraint
  -- here would need the parent's flow_type on every row, which is what an RPC
  -- avoids).
  check (
    (menu_product_id is not null and opportunity_id is null)
    or (menu_product_id is null and opportunity_id is not null)
  ),

  quantity           integer not null check (quantity > 0),
  unit_price_cents   integer not null check (unit_price_cents >= 0),

  -- The name as the shop saw it at purchase time. Required so an anonymized
  -- or product-deleted row still tells the accountant what was sold.
  item_name_snapshot text not null,

  created_at         timestamptz not null default now()
);

create index order_items_order_id_idx        on order_items (order_id);
create index order_items_menu_product_id_idx on order_items (menu_product_id);
create index order_items_opportunity_id_idx  on order_items (opportunity_id);

-- =============================================================================
-- 8. What comes next (RIS-47, 0008_shops_rls.sql)
-- =============================================================================
-- * enable row level security + policies on all six tables above.
-- * public.nearby_businesses(lat, lon, radius_m, limit) RPC — same shape as
--   nearby_restaurants in 0005, filtering active shops only.
-- * order-creation RPC that atomically decrements opportunities.quantity_remaining,
--   flips status to 'sold_out' when it reaches zero, and enforces the
--   4-hour-per-day cap.
-- Do not deploy 0007 to a public environment without 0008.
