/**
 * Konfigurasi Pelacakan Lead & Google Ads Offline Conversion
 * Lawu Vista (Host-Agnostic Setup)
 */

export const TRACKER_CONFIG = {
  // URL Deployment Google Apps Script Web App Aktif (Lawu Vista Lead Receiver)
  WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbxU_28aHWqAlNsR6tnHumjtSWP16irAVlzNm0WoouuDLUk7J06gswRp194XRIUypQKg0Q/exec',

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
