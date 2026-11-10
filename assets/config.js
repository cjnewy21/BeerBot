// ============================================================
// CONFIGURATION
// ============================================================
// 1. Fill in your Supabase credentials below.
//    Get them from: Supabase dashboard -> Settings -> API
//
// 2. Add or remove stations in STATIONS.
//
// 3. Add or remove drinks in DRINKS.
//    Optional per-drink availability fields:
//      available:     false to grey out entirely
//      availableFrom: "HH:MM" (24-hour, Central Time) - orderable at/after
//      availableTo:   "HH:MM" (24-hour, Central Time) - orderable before
//    All time checks use CENTRAL TIME from the Supabase server,
//    so device clock manipulation doesn't bypass them.
// ============================================================

const SUPABASE_URL      = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

const STATIONS = [
  { id: 1, name: 'Station 1', description: 'Main bar' },
  { id: 2, name: 'Station 2', description: 'Patio' },
  { id: 3, name: 'Station 3', description: 'Lounge' },
  { id: 4, name: 'Station 4', description: 'Back deck' },
  { id: 5, name: 'Station 5', description: 'VIP' },
];

const DRINKS = [
  {
    id: 'surly-furious',
    name: 'Millstream Root Beer',
    style: 'Root Beer',
    notes: 'Sweet, creamy, 0% ABV',
    available: true
    // No time restrictions — orderable any time.
  },
  {
    id: 'bud-light',
    name: 'Bud Light',
    style: 'Light Lager',
    notes: 'Refreshing, clean, 4.2%',
    available: true,
    availableFrom: '16:00'   // 4:00 PM Central
    // No availableTo means "until end of day".
  },
];