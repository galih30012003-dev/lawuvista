/**
 * Lawu Vista – Cookie Consent & Google Ads Ready
 * ================================================
 * SETUP GOOGLE ADS:
 * 1. Ganti GANTI_DENGAN_GTM_ID  → ID Google Tag Manager kamu (format: GTM-XXXXXXX)
 * 2. Ganti GANTI_DENGAN_AW_ID   → ID Google Ads Conversion (format: AW-XXXXXXXXX)
 * 3. Uncomment blok GTM di bawah setelah memasukkan ID yang benar
 */

(function () {
  'use strict';

  /* ── 1. CONFIG ─────────────────────────────────────────── */
  var GTM_ID  = 'GTM-5GBWZDQ4';
  var AW_ID   = 'GANTI_DENGAN_AW_ID';    // contoh: 'AW-123456789'
  var STORAGE_KEY = 'lawuvista_consent';
  var CONSENT_VERSION = '1';

  /* ── 2. HELPER ─────────────────────────────────────────── */
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return null; }
  }
  function saveConsent(val) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: CONSENT_VERSION, accepted: val, ts: Date.now() })); } catch(e) {}
  }
  function hideBanner() {
    var b = document.getElementById('lv-cookie-banner');
    if (b) b.style.display = 'none';
  }

  /* ── 3. INJECT GOOGLE TAG (GTM) ────────────────────────── */
  function loadGTM() {
    if (!GTM_ID || GTM_ID === 'GANTI_DENGAN_GTM_ID') return; // belum diisi, skip
    if (window._lvGTMLoaded) return;
    window._lvGTMLoaded = true;

    // Google Tag Manager
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', GTM_ID);

    // GTM noscript fallback
    var ns = document.createElement('noscript');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID;
    iframe.height = '0'; iframe.width = '0';
    iframe.style.display = 'none'; iframe.style.visibility = 'hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }

  /* ── 4. GOOGLE ADS CONSENT MODE ────────────────────────── */
  function pushConsentMode(analytics, ads) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    gtag('consent', 'update', {
      'ad_storage':             ads     ? 'granted' : 'denied',
      'ad_user_data':           ads     ? 'granted' : 'denied',
      'ad_personalization':     ads     ? 'granted' : 'denied',
      'analytics_storage':      analytics ? 'granted' : 'denied'
    });
  }

  /* Default consent (sebelum user pilih) */
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    'ad_storage':         'denied',
    'ad_user_data':       'denied',
    'ad_personalization': 'denied',
    'analytics_storage':  'denied',
    'wait_for_update':    500
  });

  /* ── 5. INIT ────────────────────────────────────────────── */
  // PENTING: GTM dimuat LANGSUNG di setiap pageview (tidak ditunda sampai
  // user klik "Terima"). Ini sesuai rekomendasi resmi Google Consent Mode v2:
  // container GTM harus selalu jalan biar tag bisa terdeteksi & konversi
  // bisa fire — yang ngatur boleh/tidaknya Google nyimpen cookie/ngirim data
  // iklan adalah sinyal consent (default 'denied' di atas), bukan dengan
  // menahan GTM-nya sendiri. Kalau GTM ditahan, tools cek tag (Tag Assistant,
  // GTM debug, dll) gak akan pernah "lihat" container-nya.
  loadGTM();

  var stored = getConsent();
  if (stored && stored.v === CONSENT_VERSION && stored.accepted) {
    pushConsentMode(true, true);
  }

  /* ── 6. BANNER ─────────────────────────────────────────── */
  function buildBanner() {
    if (getConsent()) return; // sudah pernah pilih

    var style = document.createElement('style');
    style.textContent = [
      '#lv-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;',
      'background:#1f2937;color:#f9fafb;padding:1rem 1.25rem;',
      'display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;',
      'box-shadow:0 -4px 24px rgba(0,0,0,.25);font-family:Poppins,sans-serif;font-size:.85rem;line-height:1.5;}',
      '#lv-cookie-banner p{margin:0;flex:1;min-width:220px;}',
      '#lv-cookie-banner a{color:#e879f9;text-decoration:underline;}',
      '#lv-cookie-banner .lv-cb-btns{display:flex;gap:.5rem;flex-shrink:0;}',
      '#lv-cb-accept{background:#d946ef;color:#fff;border:none;border-radius:8px;',
      'padding:.5rem 1.25rem;font-weight:700;cursor:pointer;font-size:.85rem;}',
      '#lv-cb-accept:hover{background:#c026d3;}',
      '#lv-cb-decline{background:transparent;color:#9ca3af;border:1px solid #4b5563;',
      'border-radius:8px;padding:.5rem 1rem;cursor:pointer;font-size:.85rem;}',
      '#lv-cb-decline:hover{color:#f9fafb;}'
    ].join('');
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'lv-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie Consent');
    banner.innerHTML = [
      '<p>🍪 Kami menggunakan cookies untuk meningkatkan pengalaman Anda dan menayangkan iklan yang relevan.',
      'Dengan mengklik <strong>Terima</strong>, Anda menyetujui ',
      '<a href="/privacy-policy/">Kebijakan Privasi</a> kami.</p>',
      '<div class="lv-cb-btns">',
      '<button id="lv-cb-decline">Tolak</button>',
      '<button id="lv-cb-accept">Terima Semua</button>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    document.getElementById('lv-cb-accept').addEventListener('click', function () {
      saveConsent(true);
      pushConsentMode(true, true);
      hideBanner();
    });
    document.getElementById('lv-cb-decline').addEventListener('click', function () {
      saveConsent(false);
      pushConsentMode(false, false);
      hideBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBanner);
  } else {
    buildBanner();
  }

})();
