import { TRACKER_CONFIG } from '@/config/tracker';

export interface LeadPayload {
  ref_id: string;
  gclid: string;
  package_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  landing_page: string;
  timestamp: string;
}

export interface TrackingParams {
  gclid: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

/**
 * Menangkap seluruh parameter pelacakan iklan dari URL browser
 */
export function extractUrlTracking(search: string = ''): TrackingParams {
  const params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  const gclid = params.get('gclid') || '';

  return {
    gclid: gclid,
    utm_source: params.get('utm_source') || (gclid ? 'google_ads' : 'direct'),
    utm_medium: params.get('utm_medium') || (gclid ? 'cpc' : ''),
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || ''
  };
}

/**
 * Menghasilkan atau mengambil kode referensi (Ref ID) persisten untuk sesi ini
 * Format: LV-YYYYMMDD-XXXX atau LV-XXXX
 */
export function getOrGenerateRefId(): string {
  if (typeof window === 'undefined') return `${TRACKER_CONFIG.REF_PREFIX}PREVIEW`;

  try {
    let existingRef = sessionStorage.getItem(TRACKER_CONFIG.STORAGE_KEYS.REF_ID);
    if (!existingRef) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      existingRef = `${TRACKER_CONFIG.REF_PREFIX}${randomPart}`;
      sessionStorage.setItem(TRACKER_CONFIG.STORAGE_KEYS.REF_ID, existingRef);
    }
    return existingRef;
  } catch (e) {
    return `${TRACKER_CONFIG.REF_PREFIX}${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Mengirimkan sinyal lead secara background tanpa memblokir redirect ke WhatsApp
 */
export function sendLeadSignal(payload: LeadPayload): void {
  if (typeof window === 'undefined') return;

  // 1. Simpan backup lead di browser session
  try {
    sessionStorage.setItem(TRACKER_CONFIG.STORAGE_KEYS.LAST_LEAD, JSON.stringify(payload));
  } catch(e) {}

  // 2. Push event ke Google Tag Manager / GA4 / Google Ads dataLayer
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'wa_click_conversion',
      event_category: 'WhatsApp',
      event_action: 'Click_CTA',
      event_label: payload.package_id,
      ref_id: payload.ref_id,
      gclid: payload.gclid,
      utm_campaign: payload.utm_campaign,
      utm_term: payload.utm_term,
      page_location: window.location.href
    });
  } catch(e) {}

  // 3. Dispatch Beacon atau Fetch asynchronous ke Webhook
  const webhookUrl = TRACKER_CONFIG.WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('GANTI_DENGAN')) {
    console.info('[Tracker] Webhook URL belum diisi. Lead terekam lokal:', payload);
    return;
  }

  const jsonString = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    // navigator.sendBeacon dijamin terkirim oleh browser meskipun tab berpindah ke WA
    const blob = new Blob([jsonString], { type: 'text/plain;charset=UTF-8' });
    navigator.sendBeacon(webhookUrl, blob);
  } else {
    fetch(webhookUrl, {
      method: 'POST',
      body: jsonString,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      mode: 'no-cors',
      keepalive: true
    }).catch(err => {
      console.warn('[Tracker] Gagal mengirim beacon ke webhook:', err);
    });
  }
}

/**
 * Membentuk URL WhatsApp dengan pesan natural yang membawa kode Ref ID
 */
export function formatWhatsAppUrl(defaultMessage: string, refId: string): string {
  const trimmed = defaultMessage.trim();
  const formattedText = `${trimmed}\n\n[Ref: ${refId}]`;
  return `https://wa.me/${TRACKER_CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(formattedText)}`;
}
