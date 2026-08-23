-- =============================================================================
-- RistoApp — schema iniziale
-- =============================================================================
-- Convenzioni adottate in tutto lo schema:
--   * Tutti gli importi sono in CENTESIMI (integer). Mai float per il denaro:
--     0.1 + 0.2 in floating point non fa 0.3, e su un conto ristorante questo
--     si traduce in centesimi che spariscono. Il denaro si conta in interi.
--   * Tutti i timestamp sono timestamptz (con fuso). Un ristorante ha clienti
--     che prenotano da fusi diversi e c'è l'ora legale: senza fuso i bug
--     arrivano puntuali la notte dell'ultima domenica di ottobre.
--   * Le misure della piantina sono in CENTIMETRI (integer), non in pixel.
--     I pixel dipendono dallo schermo, i centimetri no.
--   * Ogni tabella ha created_at. Costa poco, salva molte indagini.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- serve al vincolo anti-doppia-prenotazione

-- =============================================================================
-- 1. PERSONE
-- =============================================================================

-- Supabase gestisce già auth.users (email, password, sessioni). Non si tocca.
-- profiles è la NOSTRA tabella, agganciata 1:1, per i dati applicativi.
-- Perché separata: auth.users è di Supabase, cambia con i loro aggiornamenti e
-- non può ospitare le nostre colonne. Metafora: auth.users è il documento
-- d'identità, profiles è la scheda cliente.
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  phone         text not null,
  -- L'email vive in auth.users. Non la duplichiamo: due copie della stessa
  -- informazione divergono sempre, è solo questione di tempo.

  -- Gamification. Questi due campi sono una CACHE: la verità sta in
  -- level_events (vedi sezione 7). Sono qui perché mostrare il livello a ogni
  -- schermata non può richiedere una somma su tutta la storia dell'utente.
  level_points  integer not null default 0,
  level         smallint not null default 1,

  -- ID del cliente presso Stripe. Non è un dato di pagamento: è un puntatore.
  stripe_customer_id text unique,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- METODI DI PAGAMENTO — leggere questo commento prima di modificare la tabella.
-- -----------------------------------------------------------------------------
-- QUI NON ENTRANO MAI: numero di carta (PAN), CVV, banda magnetica, PIN.
-- Né in chiaro, né cifrati, né "solo per un attimo", né nei log.
--
-- Il numero di carta viaggia dal browser del cliente DIRETTAMENTE a Stripe
-- tramite Stripe Elements. Il nostro server riceve solo un token opaco
-- (pm_1QxYz...). Se questo database venisse esfiltrato per intero, l'attaccante
-- otterrebbe stringhe che non valgono nulla fuori dal nostro account Stripe.
--
-- Il motivo non è stilistico: toccare il PAN fa entrare l'intera
-- infrastruttura nel perimetro PCI DSS, con audit e certificazioni annesse.
-- brand e last4 sono duplicati da Stripe solo per poter scrivere "Visa ••4242"
-- in interfaccia senza una chiamata di rete a ogni render.
-- -----------------------------------------------------------------------------
create table payment_methods (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null references profiles(id) on delete cascade,
  stripe_payment_method_id text not null unique,
  brand                    text not null,          -- 'visa', 'mastercard', ...
  last4                    char(4) not null,       -- solo per l'interfaccia
  exp_month                smallint not null check (exp_month between 1 and 12),
  exp_year                 smallint not null,
  is_default               boolean not null default false,
  created_at               timestamptz not null default now()
);
create index on payment_methods (profile_id);

-- Un solo metodo predefinito per persona, garantito dal database.
-- Un indice unico parziale è il modo corretto di esprimere "al massimo uno con
-- questo flag": l'applicazione può dimenticarsene, il database no.
create unique index payment_methods_one_default
  on payment_methods (profile_id) where is_default;

-- =============================================================================
-- 2. RISTORANTI
-- =============================================================================

create type restaurant_status as enum ('draft', 'pending_review', 'active', 'suspended');

create table restaurants (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete restrict,
  name          text not null,
  slug          text not null unique,
  description   text,

  -- Contatti obbligatori in fase di registrazione
  phone         text not null,
  email         text not null,

  -- Indirizzo. Tenuto in campi separati e non in una stringa unica: serve per
  -- filtrare per città e per calcolare distanze.
  address_line  text not null,
  city          text not null,
  postal_code   text not null,
  country_code  char(2) not null default 'IT',
  latitude      numeric(9,6),
  longitude     numeric(9,6),

  cover_photo_url text,
  timezone      text not null default 'Europe/Rome',

  -- Stripe Connect: l'account del RISTORATORE. I soldi arrivano qui, non a noi.
  stripe_account_id text unique,

  -- Commissione della piattaforma in basis points (1 bp = 0,01%).
  -- 250 = 2,50%. Perché basis points e non un decimale: sono interi, quindi
  -- niente arrotondamenti strani, ed è la convenzione che usa tutto il settore
  -- dei pagamenti (Stripe compreso).
  platform_fee_bps integer not null default 250 check (platform_fee_bps between 0 and 10000),

  -- Media di spesa mostrata al cliente in fase di scelta. Anche questa è una
  -- CACHE, ricalcolata dai conti chiusi (vedi sezione 9).
  avg_spend_cents  integer,
  avg_spend_sample integer not null default 0,  -- su quanti conti è calcolata

  status        restaurant_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on restaurants (city);
create index on restaurants (status);

create table restaurant_photos (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  url           text not null,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now()
);
create index on restaurant_photos (restaurant_id, sort_order);

-- Chi può operare per conto di un ristorante.
-- Esiste come tabella separata perché un ristorante ha camerieri, e un
-- cameriere può lavorare in due locali. Mettere un "restaurant_id" dentro
-- profiles sembra più semplice oggi e diventa un vicolo cieco domani.
create type restaurant_role as enum ('owner', 'manager', 'waiter');

create table restaurant_members (
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  profile_id    uuid not null references profiles(id) on delete cascade,
  role          restaurant_role not null,
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, profile_id)
);
create index on restaurant_members (profile_id);

-- =============================================================================
-- 3. PIANTINA — il cuore visivo del prodotto
-- =============================================================================
-- Requisito: ogni piantina è unica e rispecchia il locale reale, così il
-- cliente si orienta e sceglie il tavolo che preferisce.
--
-- Di conseguenza la sala NON è una griglia e NON è un'immagine con hotspot:
-- è una tela in coordinate reali, dove ogni oggetto ha posizione, dimensione e
-- rotazione. È l'unico modello che permette anche di ricostruire la sala a
-- partire dallo schizzo su carta del ristoratore.

create table floor_plans (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,              -- 'Sala interna', 'Dehors', 'Terrazza'

  -- Dimensioni reali della sala. Sono ciò che dà la scala a tutto il resto:
  -- il frontend adatta i centimetri ai pixel dello schermo, il database no.
  width_cm      integer not null check (width_cm > 0),
  height_cm     integer not null check (height_cm > 0),

  -- Lo schizzo caricato dal ristoratore, conservato come riferimento.
  -- Serve a due cose: mostrarlo come traccia nell'editor, e poter rilanciare
  -- l'elaborazione AI se in futuro migliora.
  source_sketch_url text,

  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on floor_plans (restaurant_id);

-- Tutto ciò che nella sala NON è un tavolo: muri, porte, finestre, bancone,
-- bagni, colonne, piante. Senza questi elementi la piantina è una nuvola di
-- rettangoli e il cliente non riconosce nulla; con questi elementi può dire
-- "voglio quello vicino alla finestra".
create type floor_element_kind as enum
  ('wall', 'door', 'window', 'bar', 'restroom', 'kitchen', 'stairs', 'plant', 'pillar', 'other');

create table floor_plan_elements (
  id            uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references floor_plans(id) on delete cascade,
  kind          floor_element_kind not null,
  label         text,
  x_cm          integer not null,
  y_cm          integer not null,
  width_cm      integer not null check (width_cm > 0),
  height_cm     integer not null check (height_cm > 0),
  rotation_deg  smallint not null default 0 check (rotation_deg between 0 and 359),
  created_at    timestamptz not null default now()
);
create index on floor_plan_elements (floor_plan_id);

create type table_shape as enum ('round', 'square', 'rect');

create table restaurant_tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  floor_plan_id uuid not null references floor_plans(id) on delete cascade,

  code          text not null,              -- 'T1', 'Tavolo 7' — come lo chiama il locale
  shape         table_shape not null default 'rect',

  -- Posizione e ingombro reali sulla tela della sala
  x_cm          integer not null,
  y_cm          integer not null,
  width_cm      integer not null check (width_cm > 0),
  height_cm     integer not null check (height_cm > 0),
  rotation_deg  smallint not null default 0 check (rotation_deg between 0 and 359),

  -- Capienza come intervallo, non come numero fisso: un tavolo da 4 accoglie
  -- anche 2 persone, e il motore di ricerca deve saperlo.
  seats_min     smallint not null default 1 check (seats_min > 0),
  seats_max     smallint not null check (seats_max >= seats_min),

  -- Caratteristiche variabili nel tempo e diverse per ogni locale
  -- ('vicino_finestra', 'angolo_tranquillo', 'accessibile'). In jsonb perché
  -- è esattamente il tipo di dato che non si riesce a normalizzare in anticipo
  -- e che cambia da ristorante a ristorante.
  attributes    jsonb not null default '{}'::jsonb,

  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  unique (restaurant_id, code)
);
create index on restaurant_tables (floor_plan_id);
create index on restaurant_tables (restaurant_id) where is_active;

-- =============================================================================
-- 4. PRENOTAZIONI
-- =============================================================================

create type reservation_status as enum
  ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');

create type reservation_source as enum ('customer_app', 'staff');

create table reservations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id      uuid not null references restaurant_tables(id) on delete restrict,
  customer_id   uuid references profiles(id) on delete set null,

  party_size    smallint not null check (party_size > 0),

  -- La prenotazione è un INTERVALLO, non un istante. Un tavolo prenotato alle
  -- 20:00 non è libero alle 20:30. Modellare solo l'orario di inizio è
  -- l'errore che rende impossibile calcolare la disponibilità.
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  check (ends_at > starts_at),

  status        reservation_status not null default 'pending',
  source        reservation_source not null default 'customer_app',
  notes         text,

  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on reservations (restaurant_id, starts_at);
create index on reservations (customer_id, starts_at desc);

-- ---------------------------------------------------------------------------
-- IL VINCOLO PIÙ IMPORTANTE DELLO SCHEMA
-- ---------------------------------------------------------------------------
-- Impedisce che lo stesso tavolo risulti prenotato da due persone in orari
-- sovrapposti. Il vincolo vive nel DATABASE, non nell'applicazione.
--
-- Perché è indispensabile proprio qui: il valore centrale di RistoApp è la
-- prenotazione dell'ultimo minuto. Significa molte persone che guardano gli
-- stessi pochi tavoli liberi nello stesso momento. Un controllo applicativo
-- ("prima leggo se è libero, poi scrivo") lascia una finestra di pochi
-- millisecondi tra la lettura e la scrittura: due richieste simultanee la
-- attraversano entrambe e il tavolo viene venduto due volte. È la classica
-- race condition, e in questo prodotto non è un caso raro: è il caso normale.
--
-- EXCLUDE è un vincolo di esclusione: "non possono coesistere due righe in cui
-- il tavolo è lo stesso (=) E gli intervalli si sovrappongono (&&)".
-- Postgres lo garantisce a livello di lock sull'indice. La seconda richiesta
-- riceve un errore, non un tavolo doppio.
--
-- La WHERE finale limita il vincolo alle prenotazioni vive: una prenotazione
-- cancellata o segnata come no-show deve liberare lo slot.
-- ---------------------------------------------------------------------------
alter table reservations add constraint reservations_no_overlap
  exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'seated'));

-- =============================================================================
-- 5. MENU
-- =============================================================================

create table menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  sort_order    smallint not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on menu_categories (restaurant_id, sort_order);

create table menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid not null references menu_categories(id) on delete restrict,
  name          text not null,
  description   text,
  price_cents   integer not null check (price_cents >= 0),
  photo_url     text,
  allergens     text[] not null default '{}',   -- obbligo di legge, non un extra
  is_available  boolean not null default true,  -- "finito" per stasera
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on menu_items (restaurant_id) where is_available;
create index on menu_items (category_id, sort_order);

-- Varianti e aggiunte: "senza cipolla", "porzione grande" (+3,00), "doppio".
create table menu_item_options (
  id               uuid primary key default gen_random_uuid(),
  menu_item_id     uuid not null references menu_items(id) on delete cascade,
  name             text not null,
  price_delta_cents integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);
create index on menu_item_options (menu_item_id);

-- =============================================================================
-- 6. ORDINI E PAGAMENTI
-- =============================================================================
-- Flusso di prodotto: il cliente ordina dall'app, paga, e IL PAGAMENTO FA
-- PARTIRE LA CUCINA. Se il cliente ha problemi di connessione, il cameriere
-- prende la comanda e incassa con POS fisico o contanti (vedi sezione 6b).

create type order_status as enum (
  'draft',            -- il cliente sta componendo l'ordine
  'awaiting_payment', -- confermato, in attesa del pagamento
  'paid',             -- pagato: da qui la cucina è autorizzata a partire
  'in_kitchen',
  'served',
  'closed',
  'cancelled'
);

create type order_channel as enum ('customer_app', 'staff');

create table orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references restaurants(id) on delete restrict,
  table_id       uuid not null references restaurant_tables(id) on delete restrict,
  reservation_id uuid references reservations(id) on delete set null,

  -- Nullable: un cliente può entrare senza prenotazione e senza account, con
  -- il cameriere che apre il conto per lui.
  customer_id    uuid references profiles(id) on delete set null,
  created_by     uuid references profiles(id) on delete set null,
  channel        order_channel not null default 'customer_app',

  status         order_status not null default 'draft',

  -- Totali calcolati e CONGELATI sulla riga, non ricalcolati al volo.
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents    integer not null default 0 check (total_cents >= 0),
  currency       char(3) not null default 'EUR',

  opened_at      timestamptz not null default now(),
  closed_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on orders (restaurant_id, status);
create index on orders (customer_id, created_at desc);
create index on orders (table_id) where status not in ('closed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Le righe dell'ordine conservano una FOTOGRAFIA del piatto al momento
-- dell'ordine: nome e prezzo sono copiati, non referenziati.
--
-- Perché: il ristoratore alzerà i prezzi. Se le righe puntassero al prezzo
-- corrente di menu_items, i conti dell'anno scorso cambierebbero da soli ogni
-- volta che qualcuno tocca il menu — la contabilità diventerebbe finzione e la
-- media di spesa mostrata ai clienti sarebbe un numero senza significato.
-- Metafora: lo scontrino di ieri non si riscrive perché oggi il caffè costa
-- dieci centesimi in più.
-- ---------------------------------------------------------------------------
create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  menu_item_id       uuid references menu_items(id) on delete set null,

  name_snapshot      text not null,
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  quantity           smallint not null check (quantity > 0),
  -- Opzioni scelte, congelate anch'esse: [{"name":"senza cipolla","delta":0}]
  options_snapshot   jsonb not null default '[]'::jsonb,
  notes              text,

  line_total_cents   integer not null check (line_total_cents >= 0),
  created_at         timestamptz not null default now()
);
create index on order_items (order_id);

-- ---------------------------------------------------------------------------
-- PAGAMENTI — entità separata dall'ordine, non colonne dentro orders.
-- Perché: un conto può essere pagato in più tranche (conto diviso tra amici),
-- può fallire e essere ritentato, può essere rimborsato in parte. Tutti casi
-- che con "orders.paid = true" non si riescono nemmeno a rappresentare.
-- ---------------------------------------------------------------------------
create type payment_method_kind as enum (
  'card_app',      -- in app via Stripe: la commissione viene trattenuta qui
  'card_terminal', -- POS fisico del ristorante: fuori dal nostro circuito
  'cash'           -- contanti: fuori dal nostro circuito
);

create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create table payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references orders(id) on delete restrict,
  restaurant_id            uuid not null references restaurants(id) on delete restrict,

  method                   payment_method_kind not null,
  amount_cents             integer not null check (amount_cents > 0),
  currency                 char(3) not null default 'EUR',

  -- Quota della piattaforma su questo pagamento. Su card_app è trattenuta
  -- automaticamente da Stripe; sugli altri metodi resta 0 qui e diventa un
  -- credito differito nel ledger (sezione 6b).
  platform_fee_cents       integer not null default 0 check (platform_fee_cents >= 0),

  stripe_payment_intent_id text unique,
  status                   payment_status not null default 'pending',
  paid_at                  timestamptz,
  created_at               timestamptz not null default now()
);
create index on payments (order_id);
create index on payments (restaurant_id, paid_at desc);

-- =============================================================================
-- 6b. LEDGER DELLE COMMISSIONI — il caso "il cliente paga in contanti"
-- =============================================================================
-- Requisito di Flavio: se il cliente non può usare l'app, il cameriere incassa
-- con POS fisico o contanti, ma la piattaforma deve comunque vedersi
-- riconosciuta la sua quota, eventualmente recuperandola sul conto successivo
-- pagato tramite app.
--
-- Perché un LEDGER (registro di movimenti) e non un semplice campo
-- "restaurants.saldo_dovuto":
-- Un saldo è un numero senza storia. Quando il ristoratore contesta l'importo
-- — e succederà — con un saldo non si può ricostruire da dove viene. Un
-- registro append-only tiene una riga per ogni movimento e il saldo diventa la
-- loro somma: verificabile, spiegabile, correggibile aggiungendo una riga
-- invece che sovrascrivendo la verità.
-- Metafora: l'estratto conto della banca contro un post-it con scritto il
-- totale. Se il totale è sbagliato, con il post-it non si scopre mai perché.
-- =============================================================================

create type fee_status as enum (
  'collected', -- già trattenuta da Stripe sul pagamento in app
  'deferred',  -- maturata su pagamento offline, da recuperare
  'settled',   -- recuperata su un pagamento successivo in app
  'waived'     -- condonata (contestazione, promozione, errore)
);

create table platform_fee_ledger (
  id                  uuid primary key default gen_random_uuid(),
  restaurant_id       uuid not null references restaurants(id) on delete restrict,
  order_id            uuid not null references orders(id) on delete restrict,
  payment_id          uuid references payments(id) on delete set null,

  amount_cents        integer not null check (amount_cents > 0),
  status              fee_status not null,

  -- Su quale pagamento in app è stato recuperato un arretrato.
  settled_by_payment_id uuid references payments(id) on delete set null,
  settled_at          timestamptz,

  note                text,
  created_at          timestamptz not null default now()
);
create index on platform_fee_ledger (restaurant_id, status);
create index on platform_fee_ledger (order_id);

-- Il debito corrente di ogni ristorante verso la piattaforma, come somma dei
-- movimenti ancora aperti. Nessun campo da tenere sincronizzato a mano.
create view restaurant_outstanding_fees as
  select restaurant_id,
         coalesce(sum(amount_cents), 0)::integer as outstanding_cents,
         count(*)::integer                       as open_entries
  from platform_fee_ledger
  where status = 'deferred'
  group by restaurant_id;

-- =============================================================================
-- 7. GAMIFICATION — feedback e livelli
-- =============================================================================
-- Il cliente sale di livello grazie ai feedback del ristoratore e di altri
-- utenti. Livello più alto = sconti e omaggi.

create type feedback_direction as enum (
  'restaurant_to_customer', -- il ristoratore valuta il cliente
  'customer_to_restaurant', -- il cliente valuta il locale
  'customer_to_customer'    -- valutazione tra utenti
);

create table feedbacks (
  id             uuid primary key default gen_random_uuid(),
  direction      feedback_direction not null,
  order_id       uuid references orders(id) on delete set null,
  restaurant_id  uuid references restaurants(id) on delete cascade,

  author_id      uuid not null references profiles(id) on delete cascade,
  subject_id     uuid references profiles(id) on delete cascade,  -- chi viene valutato

  rating         smallint not null check (rating between 1 and 5),
  comment        text,
  created_at     timestamptz not null default now()
);
-- Un solo feedback per autore, per ordine, per direzione: impedisce a un
-- ristoratore di gonfiare il livello di un amico ripetendo lo stesso giudizio.
create unique index feedbacks_one_per_order
  on feedbacks (order_id, author_id, direction)
  where order_id is not null;
create index on feedbacks (subject_id);
create index on feedbacks (restaurant_id);

-- Registro dei punti. Stesso principio del ledger delle commissioni: la
-- verità sono i movimenti, profiles.level_points è solo la loro somma in cache.
-- Se un domani cambi la formula dei livelli, puoi ricalcolare tutto da qui.
create type level_event_source as enum
  ('restaurant_feedback', 'peer_feedback', 'order_completed', 'manual_adjustment');

create table level_events (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  source       level_event_source not null,
  reference_id uuid,                 -- feedback o ordine che l'ha generato
  points       integer not null,     -- può essere negativo (no-show, penalità)
  note         text,
  created_at   timestamptz not null default now()
);
create index on level_events (profile_id, created_at desc);

-- Vantaggi concessi dal ristorante a partire da un certo livello.
-- Ogni ristoratore decide i suoi: uno offre il caffè, un altro il 10%.
create type perk_kind as enum ('discount_percent', 'free_item');

create table perks (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  min_level     smallint not null check (min_level > 0),
  kind          perk_kind not null,
  -- Percentuale se discount_percent, ignorato se free_item
  discount_percent smallint check (discount_percent between 1 and 100),
  -- Piatto omaggio se free_item (amaro, caffè, calice...)
  menu_item_id  uuid references menu_items(id) on delete cascade,
  description   text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),

  -- Il vincolo garantisce che i campi giusti siano valorizzati per ogni tipo.
  check (
    (kind = 'discount_percent' and discount_percent is not null and menu_item_id is null)
    or
    (kind = 'free_item' and menu_item_id is not null and discount_percent is null)
  )
);
create index on perks (restaurant_id) where is_active;

-- Vantaggi effettivamente applicati a un ordine: serve per non riconoscere
-- due volte lo stesso omaggio e per capire quanto costa la gamification.
create table order_perks (
  order_id       uuid not null references orders(id) on delete cascade,
  perk_id        uuid not null references perks(id) on delete restrict,
  value_cents    integer not null default 0,
  created_at     timestamptz not null default now(),
  primary key (order_id, perk_id)
);

-- =============================================================================
-- 8. AGGIORNAMENTO AUTOMATICO DI updated_at
-- =============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at    before update on profiles    for each row execute function set_updated_at();
create trigger restaurants_updated_at before update on restaurants for each row execute function set_updated_at();
create trigger floor_plans_updated_at before update on floor_plans for each row execute function set_updated_at();
create trigger reservations_updated_at before update on reservations for each row execute function set_updated_at();
create trigger menu_items_updated_at  before update on menu_items  for each row execute function set_updated_at();
create trigger orders_updated_at      before update on orders      for each row execute function set_updated_at();

-- =============================================================================
-- 9. MEDIA DI SPESA — il numero che il cliente vede prima di scegliere
-- =============================================================================
-- Ricalcolata alla chiusura di ogni conto. Volutamente per PERSONA e non per
-- tavolo: al cliente interessa "quanto spendo io", non quanto ha speso un
-- tavolo da otto.
create or replace function refresh_restaurant_avg_spend()
returns trigger
language plpgsql
as $$
begin
  -- Il TG_OP = 'INSERT' copre il caso reale del conto aperto e chiuso in un
  -- colpo solo dal cameriere (cliente senza prenotazione che paga subito):
  -- senza questo ramo quel conto non entrerebbe mai nella media.
  if new.status = 'closed'
     and (tg_op = 'INSERT' or old.status is distinct from 'closed') then
    update restaurants r
    set avg_spend_cents = sub.avg_cents,
        avg_spend_sample = sub.n
    from (
      select round(avg(o.total_cents::numeric / greatest(res.party_size, 1)))::integer as avg_cents,
             count(*)::integer as n
      from orders o
      left join reservations res on res.id = o.reservation_id
      where o.restaurant_id = new.restaurant_id
        and o.status = 'closed'
    ) sub
    where r.id = new.restaurant_id;
  end if;
  return new;
end;
$$;

create trigger orders_refresh_avg_spend
  after insert or update on orders
  for each row execute function refresh_restaurant_avg_spend();
