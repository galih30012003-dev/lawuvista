/**
 * Konfigurasi Pelacakan Lead & Google Ads Offline Conversion
 * Lawu Vista (Host-Agnostic Setup)
 */

export const TRACKER_CONFIG = {
  // Ganti URL ini dengan URL Deployment Google Apps Script Web App Anda
  // (Format: https://script.google.com/macros/s/AKfycb.../exec)
  WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbx_LAWU_VISTA_LEAD_RECEIVER_WEBHOOK/exec',

  // Nomor WhatsApp Resmi CS Lawu Vista
  WHATSAPP_PHONE: '6281228237512',

  // Awalan Kode Referensi Unik Lead
  REF_PREFIX: 'LV-',

  // Masa berlaku session GCLID (90 hari sesuai standar Google Ads Attribution Window)
  ATTRIBUTION_WINDOW_DAYS: 90,

  // Kunci penyimpanan sesi browser
  STORAGE_KEYS: {
    REF_ID: 'lv_ref_id',
    GCLID: 'lv_gclid',
    CAPTURED_AT: 'lv_gclid_time',
    LAST_LEAD: 'lv_last_lead'
  },

  // Metadata default untuk ekspor Google Ads Offline Conversion
  GOOGLE_ADS: {
    CONVERSION_ACTION_NAME: 'Qualified_Booking_DP',
    CURRENCY_CODE: 'IDR',
    TIMEZONE: 'Asia/Jakarta'
  }
};
