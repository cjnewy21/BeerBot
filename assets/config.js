// ============================================================
// CONFIGURATION
// ============================================================
// 1. Fill in your Supabase credentials below.
//    Get them from your Supabase dashboard:
//      Settings -> API
//      - "Project URL"             -> SUPABASE_URL
//      - "Project API Keys" (anon) -> SUPABASE_ANON_KEY
//
// 2. Add or remove stations in STATIONS. The admin page
//    automatically renders a QR code for every entry.
//
// 3. Add or remove drinks in DRINKS. (When you add a new drink
//    here, also INSERT a matching row into the `drinks` table
//    in Supabase — see db/schema.sql.)
//
// NOTE: It is SAFE to put the anon key in a public repo. It
// only allows what your Supabase Row Level Security policies
// permit — in this case, inserting into the orders table.
// ============================================================

const SUPABASE_URL      = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

const STATIONS = [
  { id: 1, name: 'Station 1', description: 'Main bar' },
  // { id: 2, name: 'Station 2', description: 'Patio' },
  // { id: 3, name: 'Station 3', description: 'Lounge' },
  // { id: 4, name: 'Station 4', description: 'Back deck' },
  // { id: 5, name: 'Station 5', description: 'VIP' },
];

const DRINKS = [
  {
    id: 'ipa',
    name: 'IPA',
    style: 'India Pale Ale',
    notes: 'Hoppy, citrus, 6.5%',
  },
  {
    id: 'lager',
    name: 'Lager',
    style: 'Pilsner',
    notes: 'Crisp, clean, 4.8%',
  },
];
