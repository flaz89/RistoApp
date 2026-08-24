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

/**
 * The project URL must be the ORIGIN only. The dashboard also shows endpoint
 * URLs ending in /rest/v1; passing one of those makes the client build a
 * doubled path and the gateway answers "Invalid path specified in request
 * URL", which names nothing. Checking here turns that into a real sentence.
 *
 * This duplicates src/lib/supabase/env.ts on purpose: a plain .mjs script
 * cannot import the TypeScript module, and a build step just to seed a
 * database would cost more than these ten lines.
 */
function projectUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL (run through `npm run seed`, which loads .env.local).');

  const parsed = new URL(raw);
  if (parsed.pathname !== '/' || parsed.search) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the project origin only, but it ends with "${parsed.pathname}${parsed.search}". ` +
      `Use ${parsed.origin} — in .env.local and in the Vercel project settings.`,
    );
  }
  return parsed.origin;
}

const url = projectUrl();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
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
  { email: 'owner.ferrero@ristoapp.test', firstName: 'Chiara', lastName: 'Ferrero', phone: '+39 011 3333333' },
];

// Milan, around the Duomo.
const MILANO = [
  { owner: 0, name: 'Trattoria del Naviglio Piccolo', slug: 'trattoria-naviglio-piccolo', address: 'Ripa di Porta Ticinese 41', postal: '20143', lat: 45.4520, lon: 9.1750, spend: 3200 },
  { owner: 0, name: 'Osteria Bocca Buona',            slug: 'osteria-bocca-buona',        address: 'Via Fiori Chiari 12',      postal: '20121', lat: 45.4720, lon: 9.1870, spend: 4500 },
  { owner: 0, name: "Il Cortile d'Isola",             slug: 'il-cortile-isola',           address: 'Via Pastrengo 8',          postal: '20159', lat: 45.4870, lon: 9.1880, spend: 2800 },
  { owner: 0, name: 'Cucina Porta Romana',            slug: 'cucina-porta-romana',        address: 'Corso Lodi 22',            postal: '20135', lat: 45.4520, lon: 9.2050, spend: 3800 },
  { owner: 1, name: 'Bistrot Lambretta',              slug: 'bistrot-lambretta',          address: 'Via Conte Rosso 15',       postal: '20134', lat: 45.4850, lon: 9.2380, spend: 2600 },
  { owner: 1, name: 'Ai Due Campanili',               slug: 'ai-due-campanili',           address: 'Via Torino 30',            postal: '20123', lat: 45.4625, lon: 9.1830, spend: 5200 },
  { owner: 1, name: 'Sempione Bistrò',                slug: 'sempione-bistro',            address: 'Viale Elvezia 4',          postal: '20154', lat: 45.4750, lon: 9.1690, spend: 4100 },
  { owner: 1, name: 'La Corte di Città Studi',        slug: 'la-corte-citta-studi',       address: 'Via Pascoli 55',           postal: '20133', lat: 45.4780, lon: 9.2280, spend: 3000 },
].map((r) => ({ ...r, city: 'Milano' }));

// Turin, spread across the districts on purpose: a couple in the centre so the
// 1 km filter returns something, and Lingotto / Barriera far enough out that
// widening the radius visibly changes the list.
const TORINO = [
  { owner: 2, name: 'Caffè Reale',              slug: 'caffe-reale',              address: 'Piazza Castello 20',       postal: '10122', lat: 45.0705, lon: 7.6868, spend: 4800 },
  { owner: 2, name: 'Osteria del Quadrilatero', slug: 'osteria-del-quadrilatero', address: 'Via Sant\'Agostino 12',    postal: '10122', lat: 45.0760, lon: 7.6820, spend: 3600 },
  { owner: 2, name: 'Trattoria San Salvario',   slug: 'trattoria-san-salvario',   address: 'Via Baretti 20',           postal: '10125', lat: 45.0555, lon: 7.6810, spend: 3100 },
  { owner: 2, name: 'Bistrot Vanchiglia',       slug: 'bistrot-vanchiglia',       address: 'Via Vanchiglia 18',        postal: '10124', lat: 45.0700, lon: 7.6990, spend: 2900 },
  { owner: 2, name: 'La Crocetta in Tavola',    slug: 'la-crocetta-in-tavola',    address: 'Via Marco Polo 33',        postal: '10129', lat: 45.0610, lon: 7.6630, spend: 4200 },
  { owner: 2, name: 'Il Balcone sul Po',        slug: 'il-balcone-sul-po',        address: 'Via Villa della Regina 4', postal: '10131', lat: 45.0620, lon: 7.7010, spend: 5500 },
  { owner: 1, name: 'Cit Turin Cucina',         slug: 'cit-turin-cucina',         address: 'Corso Francia 55',         postal: '10138', lat: 45.0740, lon: 7.6570, spend: 3400 },
  { owner: 1, name: 'Officina Lingotto',        slug: 'officina-lingotto',        address: 'Via Nizza 230',            postal: '10126', lat: 45.0300, lon: 7.6650, spend: 2700 },
  { owner: 1, name: 'Barriera Bistrò',          slug: 'barriera-bistro',          address: 'Corso Palermo 90',         postal: '10154', lat: 45.0930, lon: 7.7000, spend: 2400 },
  { owner: 1, name: 'Santa Rita Trattoria',     slug: 'santa-rita-trattoria',     address: 'Via Tripoli 120',          postal: '10137', lat: 45.0430, lon: 7.6450, spend: 2900 },
].map((r) => ({ ...r, city: 'Torino' }));

const RESTAURANTS = [...MILANO, ...TORINO];

/**
 * Placeholder logos for a handful of places, on purpose not for all of them:
 * the list has to look right both with and without one. Real logos will be
 * uploaded by the owner and will point at object storage instead of /public.
 */
const LOGOS = {
  'caffe-reale': '/logos/caffe-reale.svg',
  'osteria-del-quadrilatero': '/logos/quadrilatero.svg',
  'trattoria-san-salvario': '/logos/san-salvario.svg',
  'il-balcone-sul-po': '/logos/balcone-sul-po.svg',
  'ai-due-campanili': '/logos/due-campanili.svg',
  'osteria-bocca-buona': '/logos/bocca-buona.svg',
};

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
    city: r.city,
    postal_code: r.postal,
    country_code: 'IT',
    latitude: r.lat,
    longitude: r.lon,
    avg_spend_cents: r.spend,
    logo_url: LOGOS[r.slug] ?? null,
    // Only active restaurants are visible through RLS to an anonymous visitor,
    // so seeding them as 'draft' would produce an empty, puzzling search.
    status: 'active',
  }));

  const { data, error } = await supabase
    .from('restaurants')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug');
  if (error) throw error;

  const byCity = RESTAURANTS.reduce((acc, r) => ({ ...acc, [r.city]: (acc[r.city] ?? 0) + 1 }), {});
  console.log(`\n${data.length} restaurants seeded:`, byCity);
  console.log('Milano:  select * from nearby_restaurants(45.4642, 9.1900, 5000, 10);');
  console.log('Torino:  select * from nearby_restaurants(45.0705, 7.6868, 5000, 10);');
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error);
  process.exit(1);
});
