// ============================================================
// LIVE DRINK SETTINGS
// ============================================================
// Availability and time windows are controlled from control.html
// and stored in the Supabase `drinks` table. This loads them and
// applies them onto the DRINKS array from config.js.
//
// If the database can't be reached (or db/control_page.sql has
// not been run yet), the values in config.js are kept as-is.
// ============================================================

async function loadDrinkSettings(client) {
  if (!client) return false;
  try {
    const { data, error } = await client
      .from('drinks')
      .select('id, available, time_limit_enabled, available_from, available_to');
    if (error) throw error;

    const byId = new Map((data || []).map(r => [r.id, r]));
    DRINKS.forEach(drink => {
      const row = byId.get(drink.id);
      if (!row) return;   // not in DB: keep config.js values
      drink.available = row.available;
      // Postgres returns times as "HH:MM:SS"; the pages use "HH:MM"
      drink.availableFrom = row.time_limit_enabled && row.available_from
        ? row.available_from.slice(0, 5) : undefined;
      drink.availableTo = row.time_limit_enabled && row.available_to
        ? row.available_to.slice(0, 5) : undefined;
    });
    return byId.size > 0;
  } catch (err) {
    console.warn('Could not load drink settings, using config.js:', err);
    return false;
  }
}
