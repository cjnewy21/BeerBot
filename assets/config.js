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

const SUPABASE_URL      = 'https://gkbetyjucgahxwabcgbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYmV0eWp1Y2dhaHh3YWJjZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTcyMzMsImV4cCI6MjA5NTM5MzIzM30.rT-OEceDdHdEuS2r9PI8Ns0n3bQ5IzqWx8fuMcJDsAA';

const STATIONS = [
  { id: 1, name: 'Station 1'},
  { id: 2, name: 'Station 2'},
  { id: 3, name: 'Station 3'},
  { id: 4, name: 'Station 4'},
  { id: 5, name: 'Station 5'},
];

const DRINKS = [
  {
    id: 'surly-furious',
    name: 'Surly Furious',
    style: 'American IPA',
    notes: 'Hoppy, citrus, 6.7%',
  },
  {
    id: 'bud-light',
    name: 'Bud Light',
    style: 'Light Lager',
    notes: 'Refreshing, clean, 4.2%',
  },
];
