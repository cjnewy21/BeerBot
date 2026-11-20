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
//
//    NOTE: once db/control_page.sql has been run, availability and
//    time limits are controlled from control.html (stored in the
//    Supabase drinks table). The values below are then only used
//    if the database can't be reached.
// ============================================================

const SUPABASE_URL      = 'https://gkbetyjucgahxwabcgbb.supabase.co';
// Publishable key: safe to be public. NEVER put a secret or
// service_role key here - this file is served to every browser.
const SUPABASE_ANON_KEY = 'sb_publishable_iWDcjdpEwBUa0vo599mLRw_8_aod8V1';

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