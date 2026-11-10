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

const SUPABASE_URL      = 'https://gkbetyjucgahxwabcgbb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYmV0eWp1Y2dhaHh3YWJjZ2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgxNzIzMywiZXhwIjoyMDk1MzkzMjMzfQ.FDlsmQP8zs5DJOFokkCYmH5H8LTQNyHHCTE2OSq2jOs';

const STATIONS = [
  { id: 1, name: 'Station 1', description: 'Main bar' },
  { id: 2, name: 'Station 2', description: 'Patio' },
  { id: 3, name: 'Station 3', description: 'Lounge' },
  { id: 4, name: 'Station 4', description: 'Back deck' },
  { id: 5, name: 'Station 5', description: 'VIP' },
];

const DRINKS = [
  {
    id: '1919-rootbeer',
    name: '1919',
    style: 'Root Beer',
    notes: 'Smooth, Vanilla, Non-Alcoholic',
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