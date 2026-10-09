/**
 * Lawu Vista – GCLID Tracker untuk Offline Conversion
 * =====================================================
 * Cara kerja:
 * 1. Pengunjung klik iklan Google → GCLID ada di URL (?gclid=xxx)
 * 2. Script simpan GCLID + info halaman + waktu di localStorage
 * 3. Saat pengunjung klik tombol WA → cuma Session ID kecil yang disisipkan
 *    ke pesan WA (pesan tetap singkat & natural)
 * 4. Detail lengkap (GCLID, UTM, kampanye, keyword, dll) sudah otomatis
 *    tersimpan di /admin-leads/ — cocokkan via Session ID kalau perlu cek
 *
 * SETUP:
 * - Tidak perlu konfigurasi tambahan
 * - Script ini otomatis aktif di semua halaman
 * - Untuk upload ke Google Ads: gunakan halaman /admin-leads/ (terpisah)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'lv_gclid_data';
  var SESSION_KEY = 'lv_session';

  /* ── 1. AMBIL GCLID DARI URL ── */
  function getParam(name) {
    try {
      var url = new URL(window.location.href);
      return url.searchParams.get(name) || '';
    } catch(e) { return ''; }
  }

  function captureGCLID() {
    var gclid  = getParam('gclid');
    var utm_source   = getParam('utm_source');
    var utm_medium   = getParam('utm_medium');
    var utm_campaign = getParam('utm_campaign');
    var utm_content  = getParam('utm_content');
    var utm_term     = getParam('utm_term');

    if (!gclid) return;

    var data = {
      gclid        : gclid,
      utm_source   : utm_source   || 'google',
      utm_medium   : utm_medium   || 'cpc',
      utm_campaign : utm_campaign || '',
      utm_content  : utm_content  || '',
      utm_term     : utm_term     || '',
      landing_page : window.location.pathname,
      captured_at  : new Date().toISOString(),
      expires_at   : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 hari
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) {}

    // Push ke dataLayer untuk GTM
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'gclid_captured', gclid: gclid });
  }

  /* ── 2. BACA GCLID TERSIMPAN ── */
  function getStoredData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // Cek expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch(e) { return null; }
  }

  /* ── 3. BUAT SESSION ID ── */
  function getSessionId() {
    try {
      var sid = sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = 'LV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        sessionStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch(e) {
      return 'LV-' + Date.now();
    }
  }

  /* ── 4. INJECT GCLID KE SEMUA LINK WA ── */
  function injectGCLIDtoWALinks() {
    var data = getStoredData();
    var sessionId = getSessionId();

    // Ambil semua link WA di halaman
    var waLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]');

    waLinks.forEach(function(link) {
      // Cegah listener terpasang dobel (script ini dipanggil ulang setelah 1 detik
      // untuk nangkep link yang lambat render — tanpa guard ini, link yang sudah
      // ke-bind di run pertama bakal dapat listener KEDUA di run kedua, jadi
      // sekali klik = trigger 2x → ID dobel di pesan & lead/konversi tercatat 2x)
      if (link.dataset.lvBound) return;
      link.dataset.lvBound = '1';

      link.addEventListener('click', function(e) {
        var href = link.getAttribute('href') || '';
        if (!href.includes('wa.me') && !href.includes('whatsapp.com')) return;

        try {
          // Dekode pesan yang sudah ada
          var urlObj = new URL(href);
          var existingText = urlObj.searchParams.get('text') || '';
          try { existingText = decodeURIComponent(existingText); } catch(e) {}

          // Info tracking ringkas — cukup session ID
          // (GCLID, UTM, halaman, dll sudah lengkap tercatat di /admin-leads/)
          var trackingInfo = '\n\n(ID: ' + sessionId + ')';

          var newText = existingText + trackingInfo;
          var newHref = href.split('?')[0] + '?text=' + encodeURIComponent(newText);
          link.setAttribute('href', newHref);

          // Simpan lead ke localStorage untuk admin dashboard
          saveLead(sessionId, data, link);

          // Push conversion event ke GTM/Google Ads
          pushWAClick(data, sessionId);

        } catch(err) {
          // Gagal parse URL, biarkan link jalan normal
        }
      }, { once: true }); // once: true supaya tidak double-inject
    });
  }

  /* ── 5. SIMPAN DATA LEAD ── */
  function saveLead(sessionId, gclidData, link) {
    try {
      var leadsRaw = localStorage.getItem('lv_leads') || '[]';
      var leads = JSON.parse(leadsRaw);

      // Cek apakah session ini sudah ada
      var existing = leads.find(function(l) { return l.session_id === sessionId; });
      if (existing) {
        existing.wa_clicks = (existing.wa_clicks || 0) + 1;
        existing.last_click = new Date().toISOString();
        existing.last_page = window.location.pathname;
      } else {
        leads.push({
          session_id   : sessionId,
          gclid        : gclidData ? gclidData.gclid        : '',
          utm_source   : gclidData ? gclidData.utm_source   : 'organik',
          utm_medium   : gclidData ? gclidData.utm_medium   : '',
          utm_campaign : gclidData ? gclidData.utm_campaign : '',
          utm_term     : gclidData ? gclidData.utm_term     : '',
          utm_content  : gclidData ? gclidData.utm_content  : '',
          landing_page : gclidData ? gclidData.landing_page : window.location.pathname,
          first_click  : new Date().toISOString(),
          last_click   : new Date().toISOString(),
          last_page    : window.location.pathname,
          wa_clicks    : 1,
          status       : 'lead_baru' // bisa diubah: lead_baru, follow_up, booking, bayar
        });
      }

      // Batasi 500 leads di localStorage
      if (leads.length > 500) leads = leads.slice(-500);
      localStorage.setItem('lv_leads', JSON.stringify(leads));
    } catch(e) {}
  }

  /* ── 6. PUSH EVENT KE GOOGLE ADS (via GTM) ── */
  function pushWAClick(gclidData, sessionId) {
    window.dataLayer = window.dataLayer || [];

    // Event standar untuk Google Ads conversion
    window.dataLayer.push({
      event           : 'wa_click_conversion',
      event_category  : 'WhatsApp',
      event_action    : 'Click',
      event_label     : window.location.pathname,
      session_id      : sessionId,
      gclid           : gclidData ? gclidData.gclid        : '',
      utm_campaign    : gclidData ? gclidData.utm_campaign : '',
      utm_term        : gclidData ? gclidData.utm_term     : ''
    });

    // Juga push sebagai konversi Google Ads jika gtag tersedia
    if (typeof gtag === 'function') {
      // Ganti 'AW-XXXXXXXXX/YYYYYYYYYY' dengan Conversion ID/Label dari Google Ads
      // gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXX/YYYYYYYYYY' });
    }
  }

  /* ── 7. INIT ── */
  captureGCLID();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectGCLIDtoWALinks);
  } else {
    injectGCLIDtoWALinks();
  }

  // Re-run setelah 1 detik untuk link yang di-render lambat (SPA-style)
  setTimeout(injectGCLIDtoWALinks, 1000);

})();
