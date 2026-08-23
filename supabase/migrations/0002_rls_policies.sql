-- =============================================================================
-- RistoApp — Row Level Security
-- =============================================================================
-- PERCHÉ QUESTO FILE È OBBLIGATORIO, NON OPZIONALE
--
-- Con Supabase il database è raggiungibile direttamente dal browser: il
-- frontend parla con Postgres tramite l'API, senza un nostro server in mezzo.
-- La chiave "anon" che lo permette è dentro il bundle JavaScript, quindi è
-- pubblica per definizione — chiunque apra i DevTools la vede.
--
-- Senza policy RLS, "select * from payments" funziona per chiunque abbia
-- quella chiave. Non è un rischio teorico: è il modo in cui i progetti
-- Supabase finiscono sui giornali.
--
-- Metafora: Supabase consegna il ristorante già arredato, ma la porta della
-- cucina resta aperta finché non ci metti tu la serratura. RLS è la serratura,
-- e va montata su ogni porta, una per una.
--
-- MODELLO MENTALE: una policy è un WHERE che Postgres aggiunge in automatico a
-- ogni query, senza che il client possa toglierlo. Non filtra "dopo": limita
-- le righe che esistono per quell'utente.
--
-- auth.uid() = l'id dell'utente autenticato che sta facendo la richiesta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funzioni di supporto
-- -----------------------------------------------------------------------------
-- Sono SECURITY DEFINER perché devono poter leggere restaurant_members
-- ignorando l'RLS di quella tabella: se una policy dovesse a sua volta
-- interrogare una tabella protetta da policy, si otterrebbe una ricorsione
-- infinita. È lo schema standard per le funzioni di autorizzazione.
-- Lo search_path fissato evita che un utente possa dirottare la funzione su
-- tabelle omonime in uno schema che controlla lui.

create or replace function is_restaurant_member(target_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = target_restaurant
      and profile_id = auth.uid()
  );
$$;

create or replace function is_restaurant_manager(target_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from restaurant_members
    where restaurant_id = target_restaurant
      and profile_id = auth.uid()
      and role in ('owner', 'manager')
  );
$$;

-- =============================================================================
-- Attivazione RLS su TUTTE le tabelle con dati non pubblici.
-- Nota importante: attivare RLS senza scrivere policy significa "nessuno legge
-- niente". È il default sicuro, ed è voluto: meglio un'app che non mostra dati
-- di un'app che li mostra a tutti.
-- =============================================================================
alter table profiles              enable row level security;
alter table payment_methods       enable row level security;
alter table restaurants           enable row level security;
alter table restaurant_photos     enable row level security;
alter table restaurant_members    enable row level security;
alter table floor_plans           enable row level security;
alter table floor_plan_elements   enable row level security;
alter table restaurant_tables     enable row level security;
alter table reservations          enable row level security;
alter table menu_categories       enable row level security;
alter table menu_items            enable row level security;
alter table menu_item_options     enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table payments              enable row level security;
alter table platform_fee_ledger   enable row level security;
alter table feedbacks             enable row level security;
alter table level_events          enable row level security;
alter table perks                 enable row level security;
alter table order_perks           enable row level security;

-- =============================================================================
-- PROFILI
-- =============================================================================
-- Ognuno vede e modifica solo il proprio profilo.
create policy "profilo: leggo il mio"
  on profiles for select
  using (id = auth.uid());

create policy "profilo: modifico il mio"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Nota: l'INSERT non è concesso al client. Il profilo va creato da un trigger
-- su auth.users o da una funzione lato server, così nessuno può fabbricare
-- profili per altri id.

-- =============================================================================
-- METODI DI PAGAMENTO — i più sensibili
-- =============================================================================
-- Solo lettura per il proprietario. La scrittura passa SEMPRE dal server dopo
-- conferma di Stripe: se il client potesse inserire righe qui, potrebbe
-- associare al proprio account il token di un'altra persona.
create policy "pagamenti: leggo i miei"
  on payment_methods for select
  using (profile_id = auth.uid());

create policy "pagamenti: elimino i miei"
  on payment_methods for delete
  using (profile_id = auth.uid());

-- =============================================================================
-- RISTORANTI — pubblici se attivi
-- =============================================================================
create policy "ristoranti: chiunque vede quelli attivi"
  on restaurants for select
  using (status = 'active' or is_restaurant_member(id));

create policy "ristoranti: il titolare crea"
  on restaurants for insert
  with check (owner_id = auth.uid());

create policy "ristoranti: gestori modificano"
  on restaurants for update
  using (is_restaurant_manager(id))
  with check (is_restaurant_manager(id));

create policy "foto: visibili con il ristorante"
  on restaurant_photos for select
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and (r.status = 'active' or is_restaurant_member(r.id))
  ));

create policy "foto: gestite dai gestori"
  on restaurant_photos for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

create policy "staff: vedo la squadra dei miei locali"
  on restaurant_members for select
  using (profile_id = auth.uid() or is_restaurant_member(restaurant_id));

create policy "staff: gestito dai gestori"
  on restaurant_members for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

-- =============================================================================
-- PIANTINA E TAVOLI — pubblici in lettura, il cliente deve poter scegliere
-- =============================================================================
create policy "piantine: pubbliche se pubblicate"
  on floor_plans for select
  using (is_published or is_restaurant_member(restaurant_id));

create policy "piantine: gestite dai gestori"
  on floor_plans for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

create policy "elementi sala: visibili con la piantina"
  on floor_plan_elements for select
  using (exists (
    select 1 from floor_plans f
    where f.id = floor_plan_id and (f.is_published or is_restaurant_member(f.restaurant_id))
  ));

create policy "elementi sala: gestiti dai gestori"
  on floor_plan_elements for all
  using (exists (
    select 1 from floor_plans f
    where f.id = floor_plan_id and is_restaurant_manager(f.restaurant_id)
  ))
  with check (exists (
    select 1 from floor_plans f
    where f.id = floor_plan_id and is_restaurant_manager(f.restaurant_id)
  ));

create policy "tavoli: visibili a chi prenota"
  on restaurant_tables for select
  using (is_active or is_restaurant_member(restaurant_id));

create policy "tavoli: gestiti dai gestori"
  on restaurant_tables for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

-- =============================================================================
-- PRENOTAZIONI
-- =============================================================================
-- Il cliente vede le proprie. Lo staff vede quelle del proprio locale.
--
-- ATTENZIONE al problema di disponibilità: con questa policy il cliente NON
-- vede le prenotazioni altrui, quindi non può calcolare da solo quali tavoli
-- sono liberi. È corretto così (le prenotazioni altrui sono dati personali:
-- nome, telefono, orario in cui una persona sarà in un certo posto).
-- La disponibilità va esposta con una funzione dedicata che restituisce solo
-- "tavolo X libero/occupato in quella fascia", senza mai far uscire i dati di
-- chi ha prenotato.
create policy "prenotazioni: vedo le mie"
  on reservations for select
  using (customer_id = auth.uid() or is_restaurant_member(restaurant_id));

create policy "prenotazioni: prenoto per me"
  on reservations for insert
  with check (
    (customer_id = auth.uid() and source = 'customer_app')
    or is_restaurant_member(restaurant_id)
  );

create policy "prenotazioni: modifico le mie"
  on reservations for update
  using (customer_id = auth.uid() or is_restaurant_member(restaurant_id))
  with check (customer_id = auth.uid() or is_restaurant_member(restaurant_id));

-- =============================================================================
-- MENU — completamente pubblico in lettura
-- =============================================================================
create policy "categorie: pubbliche"
  on menu_categories for select using (is_active or is_restaurant_member(restaurant_id));

create policy "categorie: gestite dai gestori"
  on menu_categories for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

create policy "piatti: pubblici"
  on menu_items for select using (true);

create policy "piatti: gestiti dai gestori"
  on menu_items for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

create policy "opzioni: pubbliche"
  on menu_item_options for select using (true);

create policy "opzioni: gestite dai gestori"
  on menu_item_options for all
  using (exists (
    select 1 from menu_items m
    where m.id = menu_item_id and is_restaurant_manager(m.restaurant_id)
  ))
  with check (exists (
    select 1 from menu_items m
    where m.id = menu_item_id and is_restaurant_manager(m.restaurant_id)
  ));

-- =============================================================================
-- ORDINI
-- =============================================================================
create policy "ordini: vedo i miei"
  on orders for select
  using (customer_id = auth.uid() or is_restaurant_member(restaurant_id));

create policy "ordini: apro il mio"
  on orders for insert
  with check (
    (customer_id = auth.uid() and channel = 'customer_app')
    or is_restaurant_member(restaurant_id)
  );

-- Il cliente può modificare l'ordine SOLO finché è in bozza. Appena è
-- confermato per il pagamento, il controllo passa allo staff: altrimenti si
-- potrebbe aggiungere una bistecca dopo aver pagato il coperto.
create policy "ordini: modifico solo le bozze"
  on orders for update
  using (
    (customer_id = auth.uid() and status = 'draft')
    or is_restaurant_member(restaurant_id)
  )
  with check (
    (customer_id = auth.uid() and status in ('draft', 'awaiting_payment'))
    or is_restaurant_member(restaurant_id)
  );

create policy "righe ordine: seguono l'ordine"
  on order_items for select
  using (exists (
    select 1 from orders o
    where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id))
  ));

create policy "righe ordine: modificabili solo in bozza"
  on order_items for all
  using (exists (
    select 1 from orders o
    where o.id = order_id
      and ((o.customer_id = auth.uid() and o.status = 'draft') or is_restaurant_member(o.restaurant_id))
  ))
  with check (exists (
    select 1 from orders o
    where o.id = order_id
      and ((o.customer_id = auth.uid() and o.status = 'draft') or is_restaurant_member(o.restaurant_id))
  ));

-- =============================================================================
-- PAGAMENTI — sola lettura per tutti i client
-- =============================================================================
-- Nessuna policy di INSERT o UPDATE, intenzionalmente.
-- I pagamenti nascono e cambiano stato SOLO da webhook Stripe elaborati lato
-- server con la service_role key, che ignora l'RLS. Se il client potesse
-- scrivere qui, chiunque potrebbe dichiarare pagato un conto senza pagarlo.
create policy "pagamenti ordine: vedo i miei"
  on payments for select
  using (
    is_restaurant_member(restaurant_id)
    or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- =============================================================================
-- LEDGER COMMISSIONI — affare tra piattaforma e ristoratore
-- =============================================================================
-- Il cliente non c'entra nulla e non deve vederlo. Il ristoratore lo legge per
-- trasparenza; scrive solo il server.
create policy "commissioni: il ristoratore legge le sue"
  on platform_fee_ledger for select
  using (is_restaurant_manager(restaurant_id));

-- =============================================================================
-- FEEDBACK E LIVELLI
-- =============================================================================
create policy "feedback: leggo quelli che mi riguardano"
  on feedbacks for select
  using (
    author_id = auth.uid()
    or subject_id = auth.uid()
    or (restaurant_id is not null and is_restaurant_member(restaurant_id))
  );

-- Si può scrivere un feedback solo come sé stessi. Il with check impedisce di
-- firmare un giudizio con l'identità di un altro utente.
create policy "feedback: scrivo come me stesso"
  on feedbacks for insert
  with check (author_id = auth.uid());

-- I punti sono in sola lettura per il diretto interessato: assegnarli è
-- competenza del server, sulla base dei feedback. Se il client potesse
-- inserire righe qui, il livello 10 costerebbe una riga di JavaScript.
create policy "punti: leggo i miei"
  on level_events for select
  using (profile_id = auth.uid());

create policy "vantaggi: pubblici"
  on perks for select
  using (is_active or is_restaurant_member(restaurant_id));

create policy "vantaggi: gestiti dai gestori"
  on perks for all
  using (is_restaurant_manager(restaurant_id))
  with check (is_restaurant_manager(restaurant_id));

create policy "vantaggi applicati: seguono l'ordine"
  on order_perks for select
  using (exists (
    select 1 from orders o
    where o.id = order_id and (o.customer_id = auth.uid() or is_restaurant_member(o.restaurant_id))
  ));

-- =============================================================================
-- PROMEMORIA OPERATIVO
-- =============================================================================
-- Ogni volta che si aggiunge una tabella con dati utente:
--   1. alter table ... enable row level security;
--   2. scrivere le policy;
--   3. provare a leggerla con la chiave anon e verificare che NON restituisca
--      nulla di quello che non deve.
-- Il punto 3 è quello che si salta sempre ed è l'unico che dimostra qualcosa.
-- =============================================================================
