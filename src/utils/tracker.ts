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

interface StoredTrackingData extends TrackingParams {
  timestamp: number;
}

const STORAGE_KEY_GCLID = TRACKER_CONFIG.STORAGE_KEYS.GCLID || 'lv_gclid';
const ATTRIBUTION_WINDOW_MS = (TRACKER_CONFIG.ATTRIBUTION_WINDOW_DAYS || 90) * 24 * 60 * 60 * 1000;

function safeSetStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    try {
      sessionStorage.setItem(key, value);
    } catch (_) {}
  }
}

function safeGetStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(key);
    if (val) return val;
  } catch (e) {}
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/**
 * Menangkap seluruh parameter pelacakan iklan dari URL browser
 * Dengan persistensi otomatis ke localStorage (90 hari Attribution Window)
 * dan graceful fallback saat bernavigasi ke halaman bersih tanpa URL query
 */
export function extractUrlTracking(search: string = ''): TrackingParams {
  const searchString = search || (typeof window !== 'undefined' ? window.location.search : '');
  const params = new URLSearchParams(searchString);
  const urlGclid = params.get('gclid') || '';
  const urlUtmSource = params.get('utm_source') || '';

  // 1. Jika ada parameter iklan baru di URL saat ini: simpan & jadikan aktif
  if (urlGclid || urlUtmSource) {
    const freshData: StoredTrackingData = {
      gclid: urlGclid,
      utm_source: urlUtmSource || (urlGclid ? 'google_ads' : 'direct'),
      utm_medium: params.get('utm_medium') || (urlGclid ? 'cpc' : ''),
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
      timestamp: Date.now()
    };

    safeSetStorage(STORAGE_KEY_GCLID, JSON.stringify(freshData));
    return {
      gclid: freshData.gclid,
      utm_source: freshData.utm_source,
      utm_medium: freshData.utm_medium,
      utm_campaign: freshData.utm_campaign,
      utm_term: freshData.utm_term,
      utm_content: freshData.utm_content
    };
  }

  // 2. Jika URL saat ini bersih: ambil dari penyimpanan lokal (fallback 90 hari)
  const storedJson = safeGetStorage(STORAGE_KEY_GCLID);
  if (storedJson) {
    try {
      const stored: StoredTrackingData = JSON.parse(storedJson);
      if (stored && typeof stored.timestamp === 'number') {
        const isFresh = (Date.now() - stored.timestamp) < ATTRIBUTION_WINDOW_MS;
        if (isFresh && stored.gclid) {
          return {
            gclid: stored.gclid,
            utm_source: stored.utm_source || 'google_ads',
            utm_medium: stored.utm_medium || 'cpc',
            utm_campaign: stored.utm_campaign || '',
            utm_term: stored.utm_term || '',
            utm_content: stored.utm_content || ''
          };
        }
      }
    } catch (e) {}
  }

  // 3. Fallback murni Organik / Direct
  return {
    gclid: '',
    utm_source: 'direct',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
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

/**
 * Inisialisasi pelacakan CTA WhatsApp secara cerdas & anti-duplikasi listener
 */
export function initSmartCTAs(): void {
  if (typeof window === 'undefined') return;

  const ctas = document.querySelectorAll<HTMLAnchorElement>('.lv-wa-cta, a[href*="wa.me"], a[href*="whatsapp.com"]');
  if (!ctas.length) return;

  const tracking = extractUrlTracking();
  const refId = getOrGenerateRefId();

  ctas.forEach(cta => {
    // CEGAH DOUBLE LISTENER: Jika sudah di-bind sebelumnya, lewati!
    if (cta.getAttribute('data-tracker-bound') === 'true') return;
    cta.setAttribute('data-tracker-bound', 'true');

    const defaultMsg = cta.getAttribute('data-default-msg') || 'Halo Lawu Vista';
    const packageId = cta.getAttribute('data-package-id') || 'general';

    let baseMsg = defaultMsg;
    const currentHref = cta.getAttribute('href') || '';
    try {
      if (currentHref.includes('text=')) {
        const urlObj = new URL(currentHref);
        const rawMsg = urlObj.searchParams.get('text');
        if (rawMsg) baseMsg = decodeURIComponent(rawMsg);
      }
    } catch(e) {}

    const cleanBaseMsg = baseMsg.replace(/\n\n\[Ref: [^\]]+\]/g, '').trim();
    cta.setAttribute('href', formatWhatsAppUrl(cleanBaseMsg, refId));

    cta.addEventListener('click', () => {
      // Selalu ambil tracking terbaru (dari storage jika query URL kosong)
      const latestTracking = extractUrlTracking();
      sendLeadSignal({
        ref_id: refId,
        gclid: latestTracking.gclid,
        package_id: cta.getAttribute('data-package-id') || packageId,
        utm_source: latestTracking.utm_source,
        utm_medium: latestTracking.utm_medium,
        utm_campaign: latestTracking.utm_campaign,
        utm_term: latestTracking.utm_term,
        utm_content: latestTracking.utm_content,
        landing_page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    });
  });
}
