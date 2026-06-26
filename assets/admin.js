// ============================================================
// ADMIN PAGE LOGIC
// ============================================================

(function () {
  const gridEl    = document.getElementById('station-grid');
  const warningEl = document.getElementById('config-warning');

  const credentialsSet =
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';

  if (!credentialsSet) {
    warningEl.style.display = 'block';
    warningEl.textContent =
      'Heads up: Supabase credentials are not set. Orders will be ' +
      'simulated in the browser console. Edit assets/config.js to ' +
      'connect to your Supabase project.';
  }

  const baseUrl = window.location.origin +
                  window.location.pathname.replace(/[^/]*$/, '');

  STATIONS.forEach(station => {
    const kioskUrl = baseUrl + 'order.html?station=' + station.id + '&kiosk=1';
    const adminUrl = baseUrl + 'order.html?station=' + station.id;

    const card = document.createElement('div');
    card.className = 'station-card';
    card.innerHTML =
      '<div class="station-card-head">' +
        '<div class="station-card-title">' + station.name + '</div>' +
        '<span class="station-eyebrow">#' + station.id + '</span>' +
      '</div>' +
      '<div class="station-card-desc">' + station.description + '</div>' +
      '<div class="qr-frame">' +
        '<canvas id="qr-' + station.id + '" aria-label="QR code for ' + station.name + '"></canvas>' +
      '</div>' +
      '<div class="station-links">' +
        '<span class="station-links-label">QR target (kiosk)</span>' +
        '<a href="' + kioskUrl + '" target="_blank" rel="noopener">' + kioskUrl + '</a>' +
        '<span class="station-links-label" style="margin-top:0.5rem">Direct admin link</span>' +
        '<a href="' + adminUrl + '" target="_blank" rel="noopener">' + adminUrl + '</a>' +
      '</div>';
    gridEl.appendChild(card);

    QRCode.toCanvas(
      document.getElementById('qr-' + station.id),
      kioskUrl,
      {
        width: 220,
        margin: 1,
        color: { dark: '#02033D', light: '#FFFFFF' },
      },
      err => { if (err) console.error('QR render error:', err); }
    );
  });

  if (STATIONS.length === 0) {
    gridEl.innerHTML =
      '<div class="status" style="display:block">' +
        '<div class="status-title">No stations configured</div>' +
        '<div class="status-detail">' +
          'Add at least one entry to the STATIONS array in ' +
          '<code>assets/config.js</code>.' +
        '</div>' +
      '</div>';
  }
})();
