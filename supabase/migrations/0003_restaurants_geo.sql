-- =============================================================================
-- 0003 — Find restaurants near a point
--
-- The schema already stores latitude/longitude on `restaurants`, but plain
-- numbers cannot be searched by proximity: without a spatial index Postgres
-- must measure the distance to EVERY row before it can sort them. That is fine
-- for twenty restaurants and hopeless for twenty thousand.
--
-- PostGIS gives us three things a hand written formula cannot: distances on an
-- ellipsoid (metre accurate instead of "close enough"), a GiST index that
-- discards far away rows before measuring anything, and — the reason we pick it
-- over the lighter earthdistance — the ability to answer "which restaurants sit
-- inside this map rectangle", which is the query the map view will need.
--
-- Note: comments are in English per CLAUDE.md. 0001 and 0002 predate that
-- convention and are still in Italian; aligning them is a separate chore.
-- =============================================================================

-- PostGIS is not relocatable once installed, so it goes into `extensions` from
-- the start rather than polluting `public` (Supabase's own recommendation).
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. The searchable position
-- -----------------------------------------------------------------------------
-- A GENERATED column, not one the application writes: the position is a pure
-- function of latitude and longitude, so letting anyone set it independently
-- would only create a way for the two to disagree. Postgres recomputes it on
-- every insert and update, and it can never drift.
--
-- `geography` rather than `geometry`: geography measures on the real curved
-- Earth and returns metres, which is what a human means by "within 5 km".
-- geometry would measure in degrees on a flat plane, where one degree of
-- longitude is 111 km at the equator and 0 km at the pole.
alter table restaurants
  add column if not exists location extensions.geography(Point, 4326)
  generated always as (
    case
      when latitude is null or longitude is null then null
      else extensions.st_setsrid(
             extensions.st_makepoint(longitude::double precision, latitude::double precision),
             4326
           )::extensions.geography
    end
  ) stored;

comment on column restaurants.location is
  'Searchable position, derived from latitude/longitude. Never write it directly.';

-- The index that makes proximity search cheap: it groups nearby rows together
-- so a search can skip whole regions instead of measuring every restaurant.
create index if not exists restaurants_location_idx
  on restaurants using gist (location);

-- -----------------------------------------------------------------------------
-- 2. The public search function
-- -----------------------------------------------------------------------------
-- Exposed to the browser through PostgREST as an RPC. Two deliberate choices:
--
-- `security invoker` (the default, stated here because it matters): the
-- function runs as the caller, so the RLS policy on `restaurants` still
-- applies and only `status = 'active'` rows come out. A `security definer`
-- function would bypass RLS and quietly publish every draft restaurant.
--
-- The radius and the row count are CLAMPED inside the function. Anyone holding
-- the anon key can call this with any arguments they like, so "give me
-- everything within 20.000 km" must be impossible to ask for, not merely
-- impolite. Never let the caller choose how much work the server does.
create or replace function public.nearby_restaurants(
  in_lat      double precision,
  in_lon      double precision,
  in_radius_m integer default 10000,
  in_limit    integer default 20
)
returns table (
  id              uuid,
  name            text,
  slug            text,
  city            text,
  address_line    text,
  cover_photo_url text,
  avg_spend_cents integer,
  distance_m      double precision
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
    r.id,
    r.name,
    r.slug,
    r.city,
    r.address_line,
    r.cover_photo_url,
    r.avg_spend_cents,
    st_distance(r.location, origin.point) as distance_m
  from restaurants r, origin
  where r.location is not null
    -- st_dwithin is the index-aware form: it lets the GiST index reject far
    -- rows. Writing `st_distance(...) < radius` instead would compute the
    -- distance for every restaurant first, defeating the index entirely.
    and st_dwithin(r.location, origin.point, least(greatest(in_radius_m, 100), 100000))
  -- `<->` is the index-assisted nearest-neighbour operator: the index returns
  -- rows already in distance order rather than sorting them afterwards.
  order by r.location <-> origin.point
  limit least(greatest(in_limit, 1), 50);
$$;

comment on function public.nearby_restaurants is
  'Active restaurants within a radius of a point, nearest first. Radius and limit are clamped server side.';

-- Postgres grants EXECUTE to PUBLIC by default; be explicit about who may call
-- this instead of inheriting a default.
revoke execute on function public.nearby_restaurants(double precision, double precision, integer, integer) from public;
grant execute on function public.nearby_restaurants(double precision, double precision, integer, integer) to anon, authenticated;
