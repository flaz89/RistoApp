-- =============================================================================
-- 0004 — Restaurant logo
--
-- The logo is the restaurant's identity in a list of many. It belongs on the
-- row itself rather than in `restaurant_photos`: photos are a gallery, ordered
-- and plural, while a logo is singular and structural — every place has exactly
-- one, and losing which of the photos was the logo would be losing information.
--
-- Only the URL is stored, never the image. The file lives in object storage
-- (Supabase Storage, or any CDN); a database is an expensive, slow and
-- badly-shaped place to keep bytes, and every backup would carry them along.
-- =============================================================================

alter table restaurants
  add column if not exists logo_url text;

comment on column restaurants.logo_url is
  'URL of the restaurant logo. The file lives in object storage; only the reference is here.';

-- -----------------------------------------------------------------------------
-- Republish nearby_restaurants with the logo included
-- -----------------------------------------------------------------------------
-- The function declares its output columns explicitly, so adding one means
-- changing the return type — and Postgres refuses to do that through CREATE OR
-- REPLACE. It has to be dropped and recreated, which also drops its grants:
-- they are restated at the bottom. This is the cost of an explicit contract,
-- and it is worth paying: the alternative, `returns setof restaurants`, would
-- silently publish every future column to the browser.
--
-- 0003 is already applied in production and is therefore never edited: a
-- migration that has run is history, not a draft.
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
