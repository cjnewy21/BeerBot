// ============================================================
// ORDER PAGE LOGIC
// ============================================================

(function () {
  // ---- URL parsing ----
  const params    = new URLSearchParams(window.location.search);
  const stationId = parseInt(params.get('station'), 10);
  const isKiosk   = params.get('kiosk') === '1';
  const station   = STATIONS.find(s => s.id === stationId);

  const stationTagEl  = document.getElementById('station-tag');
  const stationNameEl = document.getElementById('station-name');
  const drinkListEl   = document.getElementById('drink-list');
  const statusEl      = document.getElementById('status');

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

  // ============================================================
  // SERVER TIME SYNC
  // ============================================================
  // Fetches current time from Supabase (via the get_server_time
  // RPC) and computes the offset from the device clock. All time
  // checks use serverNow() instead of new Date(), so manipulating
  // the phone clock does not affect availability windows.
  // ============================================================

  let serverTimeOffset = 0;    // ms: serverTime - deviceTime
  let serverTimeSynced = false;

  async function syncServerTime() {
    if (!client) return false;
    try {
      const T1 = Date.now();
      const { data, error } = await client.rpc('get_server_time');
      const T2 = Date.now();
      if (error || !data) {
        console.warn('Could not sync server time:', error);
        return false;
      }
      const serverMs = new Date(data).getTime();
      // Assume server generated the timestamp at the midpoint of the round trip
      const deviceMsAtServer = (T1 + T2) / 2;
      serverTimeOffset = serverMs - deviceMsAtServer;
      serverTimeSynced = true;
      console.log('Server time synced (offset ' + Math.round(serverTimeOffset) + ' ms)');
      return true;
    } catch (err) {
      console.warn('Server time sync failed:', err);
      return false;
    }
  }

  function serverNow() {
    return new Date(Date.now() + serverTimeOffset);
  }

  // ============================================================
  // TIME-BASED AVAILABILITY (CENTRAL TIME)
  // ============================================================

  function getCentralHourMinutes(date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    const parts = formatter.formatToParts(date);
    const hour   = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
    return { hour, minute };
  }

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function isDrinkAvailable(drink) {
    if (drink.available === false) return false;
    if (!drink.availableFrom && !drink.availableTo) return true;

    const { hour, minute } = getCentralHourMinutes(serverNow());
    const nowMinutes = hour * 60 + minute;

    if (drink.availableFrom && nowMinutes < toMinutes(drink.availableFrom)) return false;
    if (drink.availableTo   && nowMinutes >= toMinutes(drink.availableTo))  return false;

    return true;
  }

  function formatTime12(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const hour12 = ((h + 11) % 12) + 1;
    const suffix = h < 12 ? 'AM' : 'PM';
    const mm = m === 0 ? '' : ':' + String(m).padStart(2, '0');
    return hour12 + mm + ' ' + suffix;
  }

  function unavailableReason(drink) {
    if (drink.available === false) return 'Currently unavailable';
    if (drink.availableFrom) return 'Available after ' + formatTime12(drink.availableFrom) + ' CT';
    if (drink.availableTo)   return 'Available until ' + formatTime12(drink.availableTo) + ' CT';
    return 'Currently unavailable';
  }

  // ============================================================
  // MENU RENDER
  // ============================================================

  function renderMenu() {
    drinkListEl.innerHTML = '';
    DRINKS.forEach(drink => {
      const btn = document.createElement('button');
      btn.className = 'drink-card';
      btn.type = 'button';

      const available = isDrinkAvailable(drink);
      if (!available) {
        btn.disabled = true;
        btn.classList.add('drink-card--unavailable');
      }

      btn.innerHTML =
        '<div class="drink-info">' +
          '<div class="drink-name">' + drink.name + '</div>' +
          '<div class="drink-style">' + drink.style + '</div>' +
          '<div class="drink-notes">' +
            (available ? drink.notes : '<em>' + unavailableReason(drink) + '</em>') +
          '</div>' +
        '</div>' +
        '<div class="drink-chevron" aria-hidden="true">&rarr;</div>';

      btn.addEventListener('click', () => {
        // Re-check availability at click time (not just at render time)
        // so drinks that just crossed a threshold behave correctly.
        if (!isDrinkAvailable(drink)) return;
        placeOrder(drink);
      });

      drinkListEl.appendChild(btn);
    });
    hideStatus();
  }

  // ============================================================
  // ORDER SUBMISSION
  // ============================================================

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

  // ============================================================
  // BOOT: sync time, render, then set up periodic refresh
  // ============================================================

  // Wait for server time (up to 2 sec) before first render so
  // the initial menu already reflects the correct availability.
  Promise.race([
    syncServerTime(),
    new Promise(resolve => setTimeout(() => resolve(false), 2000))
  ]).then(() => {
    renderMenu();
  });

  // Re-render every 30 seconds so time-gated drinks flip
  // automatically when the clock crosses their threshold
  // (e.g. Bud Light enabling at 4:00 PM). Only re-renders if
  // the menu is currently showing — never disrupts a
  // sending/success/error state.
  setInterval(() => {
    if (statusEl.style.display === 'none') {
      renderMenu();
    }
  }, 30 * 1000);

  // Re-sync server time every 5 minutes to guard against
  // clock drift on long-lived sessions.
  setInterval(syncServerTime, 5 * 60 * 1000);

})();