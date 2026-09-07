-- =============================================================================
-- 0008 — Shops RLS + nearby_businesses RPC (RIS-47)
--
-- Turns on Row Level Security for the six tables 0007 created, and exposes the
-- public map query. See 0007's header for why this had to be a separate
-- migration in the first place.
--
-- Two visibility concepts are kept deliberately separate, decided with Flavio
-- in this session:
--
--   * `businesses.is_active` (new column below) — a permanent switch: does
--     this shop exist on Curius at all. It gates every read/write policy.
--     Managed by the shop owner/manager or Curius staff, not by the clock.
--
--   * "Open right now" — derived at query time from `opening_hours` +
--     `extraordinary_closures` (both already on `businesses`), via the
--     `is_business_open_now()` function below. It is NOT an RLS gate: a shop
--     stays fully readable (search, detail page, menu, badge "closed, reopens
--     at 15:00") while it is closed, because pre-orders must remain possible
--     during a lunch break — they simply queue for prep from reopening time
--     (a `create_order` concern for 0009, not a data-visibility one).
--     The ONLY place this function gates rows is the `nearby_businesses` map
--     query, per product decision: a closed shop should not clutter the map,
--     but must still turn up in search.
--
-- What this migration deliberately leaves out (see file footer):
--   * `create_order` RPC with atomic stock decrement — its own migration
--     (0009) once the cart/checkout UI is designed. Money path, deserves its
--     own careful pass rather than being bolted onto an RLS migration.
--   * Any client write policy on `orders`/`order_items` — same reason: every
--     order is born through `create_order`, so until it exists there is
--     nothing legitimate for a client to insert here.
--   * Dashboard actions (mark order ready/delivered, scan QR) — not yet a
--     scoped ticket; adding UPDATE policies for functionality that does not
--     exist yet would be exactly the kind of speculative policy ponytail
--     warns against ("una policy per caso reale, non 'just in case'").
--   * A `businesses` INSERT policy — in the POC, shop onboarding is done
--     manually by Curius (pilot_playbook.md), i.e. via the service_role key,
--     which ignores RLS entirely. Self-serve signup is a later product step.
-- =============================================================================

set search_path = public, extensions;

-- =============================================================================
-- 1. businesses.is_active
-- =============================================================================
-- The permanent "does this shop exist on Curius" switch. Defaults to true so
-- the six pilot shops (already onboarded manually) stay visible without a
-- backfill statement.
alter table businesses
  add column is_active boolean not null default true;

comment on column businesses.is_active is
  'Permanent listing switch (owner/manager/Curius-controlled). Not the same as "open right now" — see is_business_open_now().';

-- =============================================================================
-- 2. Support functions
-- =============================================================================

-- SECURITY DEFINER for the same reason as is_restaurant_member/manager in
-- 0002: a policy on business_memberships that queried business_memberships
-- through a non-definer function would recurse into itself via RLS.
create or replace function public.is_business_member(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from business_memberships
    where business_id = target_business
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_business_manager(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from business_memberships
    where business_id = target_business
      and user_id = auth.uid()
      and role in ('owner', 'manager')
  );
$$;

-- Whether a shop is open at a given instant, computed from its weekly
-- schedule and its list of extraordinary closures — never persisted, because
-- persisting "open now" would mean recomputing it on a cron just to keep it
-- from going stale.
--
-- Single hardcoded timezone (Europe/Rome): the POC runs in one city
-- (San Salvario, Torino). A per-shop timezone column is not worth it until
-- Curius operates across timezones.
--
-- Does not handle a closing time past midnight (e.g. open 20:00, close
-- 02:00) — no pilot shop needs it, and the split-hours array already covers
-- the real case this POC has (lunch break: 08:00-13:00, 16:00-20:00).
create or replace function public.is_business_open_now(
  p_opening_hours jsonb,
  p_extraordinary_closures date[],
  p_at timestamptz default now()
)
returns boolean
language sql
stable
as $$
  select
    not coalesce(ctx.local_date = any(p_extraordinary_closures), false)
    and coalesce(
      (
        select bool_or(
          ctx.local_time >= (slot ->> 'open')::time
          and ctx.local_time <  (slot ->> 'close')::time
        )
        from jsonb_array_elements(
          coalesce(p_opening_hours -> ctx.day_key, '[]'::jsonb)
        ) as slot
      ),
      false
    )
  from (
    select
      (p_at at time zone 'Europe/Rome')::date as local_date,
      (p_at at time zone 'Europe/Rome')::time as local_time,
      -- extract(isodow) returns 1=Monday..7=Sunday, matching this array's order.
      (array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])[
        extract(isodow from (p_at at time zone 'Europe/Rome'))::int
      ] as day_key
  ) as ctx;
$$;

comment on function public.is_business_open_now is
  'Whether a shop is open at p_at (default now()), from its weekly opening_hours + extraordinary_closures. Not persisted, not an RLS gate — see file header.';

-- Same reasoning as nearby_restaurants in 0003: be explicit about who may
-- call these instead of inheriting the default PUBLIC grant. Both are meant
-- to be called directly from the client — is_business_open_now so the
-- frontend can render the same "aperto/chiuso" badge everywhere without
-- reimplementing the schedule logic in JS.
revoke execute on function public.is_business_open_now(jsonb, date[], timestamptz) from public;
grant execute on function public.is_business_open_now(jsonb, date[], timestamptz) to anon, authenticated;

-- =============================================================================
-- 3. Enable RLS on all six shop tables
-- =============================================================================
-- Enabling RLS without policies means "nobody reads anything" — the safe
-- default while the policies below are being written line by line.
alter table businesses            enable row level security;
alter table business_memberships  enable row level security;
alter table menu_products         enable row level security;
alter table opportunities         enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;

-- =============================================================================
-- 4. businesses
-- =============================================================================
create policy "businesses: public reads active ones, members read their own"
  on businesses for select
  using (is_active or is_business_member(id));

create policy "businesses: managers update their own"
  on businesses for update
  using (is_business_manager(id))
  with check (is_business_manager(id));

-- No INSERT/DELETE policy: onboarding is manual via service_role in the POC
-- (see file header). Client inserts/deletes are refused by default under RLS.

-- =============================================================================
-- 5. business_memberships
-- =============================================================================
create policy "memberships: I see mine and my fellow members"
  on business_memberships for select
  using (user_id = auth.uid() or is_business_member(business_id));

create policy "memberships: managers manage them"
  on business_memberships for all
  using (is_business_manager(business_id))
  with check (is_business_manager(business_id));

-- Bootstrap note: the very first membership on a new business cannot satisfy
-- is_business_manager() yet (no membership exists). That first row is part
-- of the same manual, service_role onboarding step as the business itself.

-- =============================================================================
-- 6. menu_products
-- =============================================================================
create policy "menu_products: public reads available items of active shops"
  on menu_products for select
  using (
    (
      is_available
      and exists (select 1 from businesses b where b.id = business_id and b.is_active)
    )
    or is_business_member(business_id)
  );

create policy "menu_products: managers manage their own"
  on menu_products for all
  using (is_business_manager(business_id))
  with check (is_business_manager(business_id));

-- =============================================================================
-- 7. opportunities
-- =============================================================================
create policy "opportunities: public reads active ones of active shops"
  on opportunities for select
  using (
    (
      status = 'active'
      and exists (select 1 from businesses b where b.id = business_id and b.is_active)
    )
    or is_business_member(business_id)
  );

create policy "opportunities: managers manage their own"
  on opportunities for all
  using (is_business_manager(business_id))
  with check (is_business_manager(business_id));

-- =============================================================================
-- 8. orders — read only, no client writes (see file header)
-- =============================================================================
-- No INSERT/UPDATE/DELETE policy here on purpose: every order is born through
-- the create_order RPC (0009), which will run with the privileges it needs to
-- also decrement opportunities.quantity_remaining atomically. Until that RPC
-- exists, there is nothing a client is allowed to write here — "server is
-- king" per Flavio's confirmation.
create policy "orders: customer reads their own, shop reads its own"
  on orders for select
  using (customer_id = auth.uid() or is_business_member(business_id));

-- =============================================================================
-- 9. order_items — follows its order, same read-only stance
-- =============================================================================
create policy "order_items: follow the parent order"
  on order_items for select
  using (exists (
    select 1 from orders o
    where o.id = order_id
      and (o.customer_id = auth.uid() or is_business_member(o.business_id))
  ));

-- =============================================================================
-- 10. nearby_businesses — the public map query
-- =============================================================================
-- Same shape as nearby_restaurants (0003), plus:
--   * filtered through is_business_open_now() — closed shops do not appear on
--     the map (product decision), even though they remain fully readable via
--     search/detail through the SELECT policy above.
--   * has_active_opportunity / active_opportunity_id, so the client can show
--     the "🔥 Occasione" CTA without a second round trip per business.
create or replace function public.nearby_businesses(
  in_lat      double precision,
  in_lon      double precision,
  in_radius_m integer default 10000,
  in_limit    integer default 20
)
returns table (
  id                     uuid,
  name                   text,
  category               shop_category,
  address_line           text,
  latitude               double precision,
  longitude              double precision,
  photo_url              text,
  distance_m             double precision,
  has_active_opportunity boolean,
  active_opportunity_id  uuid
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(in_lon, in_lat), 4326)::geography as point
  )
  select
    b.id,
    b.name,
    b.category,
    b.address as address_line,
    b.latitude,
    b.longitude,
    b.photo_url,
    st_distance(b.location, origin.point) as distance_m,
    (o.id is not null) as has_active_opportunity,
    o.id as active_opportunity_id
  from businesses b
  left join opportunities o
    on o.business_id = b.id and o.status = 'active'
  cross join origin
  where b.is_active
    and is_business_open_now(b.opening_hours, b.extraordinary_closures)
    and st_dwithin(b.location, origin.point, least(greatest(in_radius_m, 100), 100000))
  order by b.location <-> origin.point
  limit least(greatest(in_limit, 1), 50);
$$;

comment on function public.nearby_businesses is
  'Active, currently-open shops within a radius of a point, nearest first. Radius and limit are clamped server side.';

revoke execute on function public.nearby_businesses(double precision, double precision, integer, integer) from public;
grant execute on function public.nearby_businesses(double precision, double precision, integer, integer) to anon, authenticated;

-- =============================================================================
-- 11. What comes next (0009)
-- =============================================================================
-- * create_order RPC: atomically decrements opportunities.quantity_remaining,
--   flips status to 'sold_out' at zero, enforces the 4-hour-per-day cap, and
--   is the only legitimate writer of orders/order_items. Allows placing a
--   preorder while the shop is currently closed (pickup queues from reopening
--   time) — is_business_open_now() is deliberately NOT part of its guard.
-- * Once create_order exists, revisit whether dashboard actions (mark ready/
--   delivered, scan QR) need their own UPDATE policy on orders, scoped to
--   is_business_member(business_id).
