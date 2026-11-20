// ============================================================
// MASTER ORDER SCREEN LOGIC
// ============================================================
// Lets staff order any drink for any station. Time windows
// (availableFrom / availableTo) are ignored here on purpose.
// Drinks marked unavailable (control page or config.js) are
// still hidden, since those are empty rather than time-restricted.
// ============================================================

(function () {
  const formEl     = document.getElementById('master-form');
  const stationSel = document.getElementById('station-select');
  const drinkSel   = document.getElementById('drink-select');
  const orderBtn   = document.getElementById('order-btn');
  const statusEl   = document.getElementById('status');

  // ---- Status panel helpers ----
  function hideStatus() {
    statusEl.style.display = 'none';
    statusEl.className = 'status';
    statusEl.innerHTML = '';
  }
  function showStatus(stateClass, html) {
    statusEl.style.display = 'block';
    statusEl.className = 'status ' + stateClass;
    statusEl.innerHTML = html;
  }

  // ---- Supabase client ----
  const credentialsSet =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
    SUPABASE_URL.length > 0;

  const client = credentialsSet
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // ---- Fill dropdowns ----
  function addOption(selectEl, value, label) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }

  STATIONS.forEach(s => {
    addOption(stationSel, s.id, s.name + (s.description ? ' - ' + s.description : ''));
  });

  // Drinks list is rebuilt whenever live settings reload, keeping
  // the current selection if that drink is still available.
  function fillDrinks() {
    const previous = drinkSel.value;
    drinkSel.innerHTML = '';
    const available = DRINKS.filter(d => d.available !== false);
    available.forEach(d => addOption(drinkSel, d.id, d.name + (d.style ? ' (' + d.style + ')' : '')));
    if (available.some(d => d.id === previous)) drinkSel.value = previous;
    if (available.length === 0) addOption(drinkSel, '', 'No drinks available');
  }

  fillDrinks();
  loadDrinkSettings(client).then(fillDrinks);
  setInterval(async () => {
    await loadDrinkSettings(client);
    if (!orderBtn.disabled) fillDrinks();
  }, 30 * 1000);

  // ---- Order submission ----
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const station = STATIONS.find(s => s.id === parseInt(stationSel.value, 10));
    const drink   = DRINKS.find(d => d.id === drinkSel.value);
    if (!station || !drink) return;

    orderBtn.disabled = true;
    stationSel.disabled = true;
    drinkSel.disabled = true;
    showStatus('',
      '<div class="status-title">Sending order…</div>' +
      '<div class="status-detail">' + drink.name + ' for ' + station.name + '</div>');

    try {
      // Make sure the drink wasn't just marked unavailable
      await loadDrinkSettings(client);
      if (drink.available === false) {
        fillDrinks();
        throw new Error(drink.name + ' was just marked unavailable on the control page.');
      }

      let order;
      if (client) {
        const { data, error } = await client
          .from('orders')
          .insert({ station_id: station.id, drink_id: drink.id })
          .select()
          .single();
        if (error) throw error;
        order = data;
      } else {
        await new Promise(r => setTimeout(r, 500));
        order = { id: Math.floor(Math.random() * 9000) + 1000 };
        console.log('[SIMULATED ORDER — Supabase not configured]', order);
      }

      showStatus('success',
        '<div class="status-title">Order received</div>' +
        '<div class="status-detail">' +
          drink.name + ' &middot; order ' +
          '<span class="order-id">#' + order.id + '</span><br/>' +
          'The robot will deliver to ' + station.name + ' shortly.' +
        '</div>');

    } catch (err) {
      console.error(err);
      showStatus('error',
        '<div class="status-title">Could not place order</div>' +
        '<div class="status-detail">' + (err.message || 'Unknown error') + '</div>');
    } finally {
      orderBtn.disabled = false;
      stationSel.disabled = false;
      drinkSel.disabled = false;
    }
  });

  // Clear the last result when the selection changes
  stationSel.addEventListener('change', hideStatus);
  drinkSel.addEventListener('change', hideStatus);
})();
