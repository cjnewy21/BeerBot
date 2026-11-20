// ============================================================
// DRINK CONTROL PAGE LOGIC
// ============================================================
// Reads drink settings from the Supabase `drinks` table and saves
// changes through the PIN-checked `update_drink_settings` function
// (see db/control_page.sql). The PIN is never stored in this code.
// ============================================================

(function () {
  const pinForm    = document.getElementById('pin-form');
  const pinInput   = document.getElementById('pin-input');
  const pinBtn     = document.getElementById('pin-btn');
  const controlsEl = document.getElementById('controls');
  const listEl     = document.getElementById('control-list');
  const lockBtn    = document.getElementById('lock-btn');
  const statusEl   = document.getElementById('status');

  const PIN_KEY = 'bartender-control-pin';
  let pin = null;

  // ---- Status panel helpers ----
  function hideStatus() {
    statusEl.style.display = 'none';
    statusEl.className = 'status';
    statusEl.innerHTML = '';
  }
  function showStatus(stateClass, title, detail) {
    statusEl.style.display = 'block';
    statusEl.className = 'status ' + stateClass;
    statusEl.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'status-title';
    t.textContent = title;
    statusEl.appendChild(t);
    if (detail) {
      const d = document.createElement('div');
      d.className = 'status-detail';
      d.textContent = detail;
      statusEl.appendChild(d);
    }
  }

  // ---- Supabase client ----
  const credentialsSet =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
    SUPABASE_URL.length > 0;

  if (!credentialsSet) {
    pinForm.style.display = 'none';
    showStatus('error', 'Supabase not configured', 'Set the Supabase URL and key in assets/config.js.');
    return;
  }
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---- PIN (remembered for this browser tab only) ----
  function savePin(value) {
    try { sessionStorage.setItem(PIN_KEY, value); } catch (e) { /* ignore */ }
  }
  function loadPin() {
    try { return sessionStorage.getItem(PIN_KEY); } catch (e) { return null; }
  }
  function clearPin() {
    try { sessionStorage.removeItem(PIN_KEY); } catch (e) { /* ignore */ }
  }

  function lock(message) {
    pin = null;
    clearPin();
    controlsEl.style.display = 'none';
    pinForm.style.display = '';
    pinInput.value = '';
    if (message) showStatus('error', message); else hideStatus();
  }

  async function unlock(candidate) {
    pinBtn.disabled = true;
    try {
      const { data, error } = await client.rpc('check_control_pin', { p_pin: candidate });
      if (error) throw error;
      if (data !== true) { lock('Incorrect PIN'); return; }
      pin = candidate;
      savePin(candidate);
      pinForm.style.display = 'none';
      hideStatus();
      await loadControls();
    } catch (err) {
      console.error(err);
      lock();
      showStatus('error', 'Could not check PIN',
        (err.message || 'Unknown error') + ' (has db/control_page.sql been run in Supabase?)');
    } finally {
      pinBtn.disabled = false;
    }
  }

  pinForm.addEventListener('submit', e => {
    e.preventDefault();
    if (pinInput.value) unlock(pinInput.value);
  });
  lockBtn.addEventListener('click', () => lock());

  // ---- Load current settings ----
  async function loadControls() {
    const { data, error } = await client
      .from('drinks')
      .select('id, available, time_limit_enabled, available_from, available_to');
    if (error) {
      showStatus('error', 'Could not load drinks', error.message);
      return;
    }
    const byId = new Map((data || []).map(r => [r.id, r]));

    listEl.innerHTML = '';
    DRINKS.forEach(drink => listEl.appendChild(buildCard(drink, byId.get(drink.id))));
    controlsEl.style.display = '';
  }

  // ---- One card per drink ----
  function makeToggle(labelText, checked) {
    const label = document.createElement('label');
    label.className = 'toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    const track = document.createElement('span');
    track.className = 'toggle-track';
    track.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'toggle-label';
    text.textContent = labelText;
    label.append(input, track, text);
    return { label, input };
  }

  function makeTime(labelText, value) {
    const label = document.createElement('label');
    label.className = 'time-field';
    const text = document.createElement('span');
    text.className = 'field-label';
    text.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'field-select field-input';
    input.value = value ? value.slice(0, 5) : '';
    label.append(text, input);
    return { label, input };
  }

  function buildCard(drink, row) {
    const li = document.createElement('li');
    li.className = 'control-card';

    const head = document.createElement('div');
    head.className = 'control-card-head';
    const name = document.createElement('div');
    name.className = 'drink-name';
    name.textContent = drink.name;
    const style = document.createElement('div');
    style.className = 'drink-style';
    style.textContent = drink.style || '';
    const saved = document.createElement('span');
    saved.className = 'save-state';
    head.append(name, style, saved);
    li.appendChild(head);

    if (!row) {
      const warn = document.createElement('div');
      warn.className = 'drink-notes';
      warn.textContent = 'Not in the database yet. Add a row for "' + drink.id +
        '" to the Supabase drinks table before it can be controlled or ordered.';
      li.appendChild(warn);
      return li;
    }

    const avail = makeToggle('Available', row.available);
    const limit = makeToggle('Time limit', row.time_limit_enabled);
    const from  = makeTime('From (CT)', row.available_from);
    const to    = makeTime('Until (CT)', row.available_to);

    const times = document.createElement('div');
    times.className = 'time-row';
    times.append(from.label, to.label);

    function syncDisabled() {
      from.input.disabled = !limit.input.checked;
      to.input.disabled   = !limit.input.checked;
      times.classList.toggle('time-row--off', !limit.input.checked);
      li.classList.toggle('control-card--off', !avail.input.checked);
    }
    syncDisabled();

    async function save() {
      syncDisabled();
      saved.textContent = 'Saving…';
      saved.className = 'save-state';
      const inputs = [avail.input, limit.input, from.input, to.input];
      inputs.forEach(i => { i.dataset.wasDisabled = i.disabled; i.disabled = true; });
      try {
        const { error } = await client.rpc('update_drink_settings', {
          p_pin:                pin,
          p_drink_id:           drink.id,
          p_available:          avail.input.checked,
          p_time_limit_enabled: limit.input.checked,
          p_available_from:     from.input.value || null,
          p_available_to:       to.input.value || null
        });
        if (error) throw error;
        saved.textContent = 'Saved';
        saved.className = 'save-state save-state--ok';
      } catch (err) {
        console.error(err);
        if ((err.message || '').includes('Incorrect PIN')) {
          lock('PIN no longer valid. Please unlock again.');
          return;
        }
        saved.textContent = 'Not saved: ' + (err.message || 'error');
        saved.className = 'save-state save-state--err';
      } finally {
        inputs.forEach(i => { i.disabled = i.dataset.wasDisabled === 'true'; });
      }
    }

    [avail.input, limit.input, from.input, to.input]
      .forEach(i => i.addEventListener('change', save));

    const toggles = document.createElement('div');
    toggles.className = 'toggle-row';
    toggles.append(avail.label, limit.label);
    li.append(toggles, times);
    return li;
  }

  // ---- Start: reuse the PIN from this tab if there is one ----
  const remembered = loadPin();
  if (remembered) unlock(remembered);
})();
