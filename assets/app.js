// ============================================================
// ORDER PAGE LOGIC
// ============================================================

(function () {
  const params    = new URLSearchParams(window.location.search);
  const stationId = parseInt(params.get('station'), 10);
  const isKiosk   = params.get('kiosk') === '1';   // reserved for future use
  const station   = STATIONS.find(s => s.id === stationId);

  const stationTagEl  = document.getElementById('station-tag');
  const stationNameEl = document.getElementById('station-name');
  const drinkListEl   = document.getElementById('drink-list');
  const statusEl      = document.getElementById('status');

  // ---- Helpers: status panel is now hidden by default ----
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

  // ---- Set up Supabase client ----
  const credentialsSet =
    SUPABASE_URL !== 'https://gkbetyjucgahxwabcgbb.supabase.co' &&
    SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYmV0eWp1Y2dhaHh3YWJjZ2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTcyMzMsImV4cCI6MjA5NTM5MzIzM30.rT-OEceDdHdEuS2r9PI8Ns0n3bQ5IzqWx8fuMcJDsAA' &&
    SUPABASE_URL.length > 0;

  const client = credentialsSet
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // ---- Validate station ----
  if (!station) {
    stationTagEl.textContent = 'Invalid';
    if (stationNameEl) stationNameEl.textContent = 'your station';
    drinkListEl.innerHTML = '';
    showStatus('error',
      '<div class="status-title">Station not found</div>' +
      '<div class="status-detail">' +
      'The URL is missing a valid station number. Ask a staff ' +
      'member for the correct QR code.' +
      '</div>');
    return;
  }

  stationTagEl.textContent = station.name;
  if (stationNameEl) stationNameEl.textContent = station.name;

  // ---- Render the menu (default state — no status panel) ----
  function renderMenu() {
    drinkListEl.innerHTML = '';
    DRINKS.forEach(drink => {
      const btn = document.createElement('button');
      btn.className = 'drink-card';
      btn.type = 'button';
      btn.innerHTML =
        '<div class="drink-info">' +
          '<div class="drink-name">' + drink.name + '</div>' +
          '<div class="drink-style">' + drink.style + '</div>' +
          '<div class="drink-notes">' + drink.notes + '</div>' +
        '</div>' +
        '<div class="drink-chevron" aria-hidden="true">&rarr;</div>';
      btn.addEventListener('click', () => placeOrder(drink));
      drinkListEl.appendChild(btn);
    });
    hideStatus();
  }

  // ---- Submit an order ----
  async function placeOrder(drink) {
    [...drinkListEl.querySelectorAll('button')].forEach(b => b.disabled = true);
    showStatus('',
      '<div class="status-title">Sending order…</div>' +
      '<div class="status-detail">' + drink.name + ' for ' + station.name + '</div>');

    try {
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
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-primary" id="order-again">Start a new order</button>' +
        '</div>');
      document.getElementById('order-again').addEventListener('click', renderMenu);

    } catch (err) {
      console.error(err);
      showStatus('error',
        '<div class="status-title">Could not place order</div>' +
        '<div class="status-detail">' + (err.message || 'Unknown error') + '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-primary" id="order-retry">Try again</button>' +
        '</div>');
      document.getElementById('order-retry').addEventListener('click', renderMenu);
    }
  }

  renderMenu();
})();
