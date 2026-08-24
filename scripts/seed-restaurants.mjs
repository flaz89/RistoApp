/**
 * Seed a handful of active restaurants around Milan so the proximity search has
 * something to find.
 *
 * Run it with:
 *   npm run seed
 *
 * Why a script and not a migration: seed data is not schema. Migrations run in
 * every environment, production included, and fictional restaurants must never
 * land there. Keeping them apart is the difference between "the database has a
 * shape" and "the database has content".
 *
 * Why the service_role key: `restaurants` is protected by RLS, and inserting a
 * restaurant means being its owner. The service_role key bypasses RLS — which
 * is exactly why it lives only in .env.local and never reaches the browser.
 *
 * The script is idempotent: run it as often as you like.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run through `npm run seed`, which loads .env.local.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Fictional restaurants at real Milan coordinates. The names are invented on
 * purpose: seed data must never look like a claim about a real business.
 */
const OWNERS = [
  { email: 'owner.rossi@ristoapp.test', firstName: 'Giulia', lastName: 'Rossi', phone: '+39 02 1111111' },
  { email: 'owner.bianchi@ristoapp.test', firstName: 'Marco', lastName: 'Bianchi', phone: '+39 02 2222222' },
];

const RESTAURANTS = [
  { owner: 0, name: 'Trattoria del Naviglio Piccolo', slug: 'trattoria-naviglio-piccolo', address: 'Ripa di Porta Ticinese 41', postal: '20143', lat: 45.4520, lon: 9.1750, spend: 3200 },
  { owner: 0, name: 'Osteria Bocca Buona',            slug: 'osteria-bocca-buona',        address: 'Via Fiori Chiari 12',        postal: '20121', lat: 45.4720, lon: 9.1870, spend: 4500 },
  { owner: 0, name: "Il Cortile d'Isola",             slug: 'il-cortile-isola',           address: 'Via Pastrengo 8',            postal: '20159', lat: 45.4870, lon: 9.1880, spend: 2800 },
  { owner: 0, name: 'Cucina Porta Romana',            slug: 'cucina-porta-romana',        address: 'Corso Lodi 22',              postal: '20135', lat: 45.4520, lon: 9.2050, spend: 3800 },
  { owner: 1, name: 'Bistrot Lambretta',              slug: 'bistrot-lambretta',          address: 'Via Conte Rosso 15',         postal: '20134', lat: 45.4850, lon: 9.2380, spend: 2600 },
  { owner: 1, name: 'Ai Due Campanili',               slug: 'ai-due-campanili',           address: 'Via Torino 30',              postal: '20123', lat: 45.4625, lon: 9.1830, spend: 5200 },
  { owner: 1, name: 'Sempione Bistrò',                slug: 'sempione-bistro',            address: 'Viale Elvezia 4',            postal: '20154', lat: 45.4750, lon: 9.1690, spend: 4100 },
  { owner: 1, name: 'La Corte di Città Studi',        slug: 'la-corte-citta-studi',       address: 'Via Pascoli 55',             postal: '20133', lat: 45.4780, lon: 9.2280, spend: 3000 },
];

/** Create the auth user, or find it if a previous run already made it. */
async function ensureUser(owner) {
  const created = await supabase.auth.admin.createUser({
    email: owner.email,
    password: crypto.randomUUID(),   // nobody logs in as these; a real password is never needed
    email_confirm: true,
  });

  if (created.data?.user) return created.data.user.id;

  // createUser refuses duplicates, so on the second run we look the user up.
  const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (existing.error) throw existing.error;

  const found = existing.data.users.find((u) => u.email === owner.email);
  if (!found) throw created.error ?? new Error(`could not create or find ${owner.email}`);
  return found.id;
}

async function main() {
  const ownerIds = [];

  for (const owner of OWNERS) {
    const id = await ensureUser(owner);

    // The profile is a separate row from the auth user: auth.users belongs to
    // Supabase and cannot carry our columns.
    const { error } = await supabase.from('profiles').upsert({
      id,
      first_name: owner.firstName,
      last_name: owner.lastName,
      phone: owner.phone,
    });
    if (error) throw error;

    ownerIds.push(id);
    console.log(`owner ready: ${owner.email}`);
  }

  const rows = RESTAURANTS.map((r) => ({
    owner_id: ownerIds[r.owner],
    name: r.name,
    slug: r.slug,
    description: 'Locale di prova generato dal seed. Non è un ristorante reale.',
    phone: '+39 02 0000000',
    email: `info@${r.slug}.test`,
    address_line: r.address,
    city: 'Milano',
    postal_code: r.postal,
    country_code: 'IT',
    latitude: r.lat,
    longitude: r.lon,
    avg_spend_cents: r.spend,
    // Only active restaurants are visible through RLS to an anonymous visitor,
    // so seeding them as 'draft' would produce an empty, puzzling search.
    status: 'active',
  }));

  const { data, error } = await supabase
    .from('restaurants')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug');
  if (error) throw error;

  console.log(`\n${data.length} restaurants seeded in Milan.`);
  console.log('Try it:  select * from nearby_restaurants(45.4642, 9.19, 5000, 10);');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error);
  process.exit(1);
});
