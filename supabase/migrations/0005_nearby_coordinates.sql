-- =============================================================================
-- 0005 — Expose restaurant coordinates from nearby_restaurants
--
-- The map view needs to place a pin per restaurant, which means it needs each
-- restaurant's latitude and longitude. The columns already exist on the table
-- (0003 derives the searchable `location` from them); the search function just
-- never returned them. This migration republishes the function with the two
-- coordinate columns added to its output.
--
-- Returning the exact position is deliberate and safe: a restaurant is a public
-- business whose whole purpose is to be found and reached. There is nothing to
-- round here — unlike the *user's* position, which stays rounded to the
-- neighbourhood (see useGeolocation). RLS on `restaurants` still applies, so
-- only `status = 'active'` rows ever come out.
--
-- Same shape as 0004: an explicit RETURNS TABLE means adding a column changes
-- the return type, which CREATE OR REPLACE refuses. The function is dropped and
-- recreated, and its grants — dropped along with it — are restated at the
-- bottom. 0003 and 0004 are already applied and are therefore never edited.
-- =============================================================================

drop function if exists public.nearby_restaurants(double precision, double precision, integer, integer);

create function public.nearby_restaurants(
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
  latitude        double precision,
  longitude       double precision,
  cover_photo_url text,
  logo_url        text,
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
    r.latitude,
    r.longitude,
    r.cover_photo_url,
    r.logo_url,
    r.avg_spend_cents,
    st_distance(r.location, origin.point) as distance_m
  from restaurants r, origin
  where r.location is not null
    and st_dwithin(r.location, origin.point, least(greatest(in_radius_m, 100), 100000))
  order by r.location <-> origin.point
  limit least(greatest(in_limit, 1), 50);
$$;

comment on function public.nearby_restaurants is
  'Active restaurants within a radius of a point, nearest first. Radius and limit are clamped server side.';

revoke execute on function public.nearby_restaurants(double precision, double precision, integer, integer) from public;
grant execute on function public.nearby_restaurants(double precision, double precision, integer, integer) to anon, authenticated;
