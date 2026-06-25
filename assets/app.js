// ============================================================
// ORDER PAGE LOGIC
// ============================================================
// Reads the station ID from the URL, renders the drink menu,
// and inserts orders directly into Supabase using the JS client.
// ============================================================

(function () {
  const params    = new URLSearchParams(window.location.search);
  const stationId = parseInt(params.get('station'), 10);
  const isKiosk   = params.get('kiosk') === '1';   // reserved for future use
  const station   = STATIONS.find(s => s.id === stationId);

  const stationTagEl = document.getElementById('station-tag');
  const drinkListEl  = document.getElementById('drink-list');
  const statusEl     = document.getElementById('status');

  // ---- Set up Supabase client ----
  const credentialsSet =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
    SUPABASE_URL.length > 0;

  const client = credentialsSet
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // ---- Validate station ----
  if (!station) {
    stationTagEl.textContent = 'INVALID';
    drinkListEl.innerHTML = '';
    statusEl.className = 'status error';
    statusEl.innerHTML = `
      <div class="status-title">Station not found</div>
      <div class="status-detail">
        The URL is missing a valid station number. Ask a staff
        member for the correct QR code.
      </div>`;
    return;
  }

  stationTagEl.textContent = station.name;

  // ---- Render drinks ----
  function renderMenu() {
    drinkListEl.innerHTML = '';
    DRINKS.forEach(drink => {
      const btn = document.createElement('button');
      btn.className = 'drink-card';
      btn.type = 'button';
      btn.innerHTML = `
        <div class="drink-info">
          <div class="drink-name">${drink.name}</div>
          <div class="drink-style">${drink.style}</div>
          <div class="drink-notes">${drink.notes}</div>
        </div>
        <div class="drink-chevron" aria-hidden="true">&rarr;</div>
      `;
      btn.addEventListener('click', () => placeOrder(drink));
      drinkListEl.appendChild(btn);
    });
    statusEl.className = 'status';
    statusEl.innerHTML = `
      <div class="status-title">Tap a drink to order</div>
      <div class="status-detail">
        Your drink will be delivered to ${station.name}.
      </div>`;
  }

  // ---- Submit an order ----
  async function placeOrder(drink) {
    [...drinkListEl.querySelectorAll('button')].forEach(b => b.disabled = true);
    statusEl.className = 'status';
    statusEl.innerHTML = `
      <div class="status-title">Sending order…</div>
      <div class="status-detail">${drink.name} for ${station.name}</div>`;

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
        // No credentials yet — simulate locally so the UI can be tested.
        await new Promise(r => setTimeout(r, 500));
        order = {
          id: Math.floor(Math.random() * 9000) + 1000,
          station_id: station.id,
          drink_id: drink.id,
        };
        console.log('[SIMULATED ORDER — Supabase not configured]', order);
      }

      statusEl.className = 'status success';
      statusEl.innerHTML = `
        <div class="status-title">Order received</div>
        <div class="status-detail">
          ${drink.name} &middot; order
          <span class="order-id">#${order.id}</span><br/>
          The robot will deliver to ${station.name} shortly.
        </div>
        <div class="btn-row">
          <button class="btn" id="order-again">Order another</button>
        </div>`;
      document.getElementById('order-again').addEventListener('click', renderMenu);

    } catch (err) {
      console.error(err);
      statusEl.className = 'status error';
      statusEl.innerHTML = `
        <div class="status-title">Could not place order</div>
        <div class="status-detail">${err.message || 'Unknown error'}</div>
        <div class="btn-row">
          <button class="btn btn-primary" id="order-retry">Try again</button>
        </div>`;
      document.getElementById('order-retry').addEventListener('click', renderMenu);
    }
  }

  renderMenu();
})();
