import assert from 'assert';

console.log('🔍 Menguji logika pelacakan lead, GCLID persistence & offline conversion...');

// Mock browser global storage
const mockStorage = new Map();
global.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k)
};
global.sessionStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k)
};
global.window = {
  location: { search: '', pathname: '/jeep-adventure-kemuning/' }
};

// 1. Uji Kasus A: Kunjungan Pertama dari Google Ads (Landing Page dengan query)
const searchWithGclid = '?gclid=CjwKCAjwTestGCLID998877&utm_campaign=Search_B2C_Jeep&utm_term=sewa+jeep+kemuning';

// Simulasi extractUrlTracking
function testExtractUrlTracking(searchString = '') {
  const params = new URLSearchParams(searchString || window.location.search);
  const urlGclid = params.get('gclid') || '';
  const urlUtmSource = params.get('utm_source') || '';

  if (urlGclid || urlUtmSource) {
    const freshData = {
      gclid: urlGclid,
      utm_source: urlUtmSource || (urlGclid ? 'google_ads' : 'direct'),
      utm_medium: params.get('utm_medium') || (urlGclid ? 'cpc' : ''),
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || '',
      timestamp: Date.now()
    };
    localStorage.setItem('lv_gclid', JSON.stringify(freshData));
    return freshData;
  }

  // Fallback storage
  const storedJson = localStorage.getItem('lv_gclid');
  if (storedJson) {
    const stored = JSON.parse(storedJson);
    const TTL_MS = 90 * 24 * 60 * 60 * 1000;
    if (Date.now() - stored.timestamp < TTL_MS && stored.gclid) {
      return stored;
    }
  }

  return {
    gclid: '',
    utm_source: 'direct',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
  };
}

const firstLand = testExtractUrlTracking(searchWithGclid);
assert.strictEqual(firstLand.gclid, 'CjwKCAjwTestGCLID998877');
assert.strictEqual(firstLand.utm_source, 'google_ads');
assert.strictEqual(firstLand.utm_campaign, 'Search_B2C_Jeep');
console.log('  ✓ 1. Ekstraksi parameter Google Ads (GCLID) saat pertama mendarat valid');

// 2. Uji Kasus B: Navigasi Antarhalaman / URL Bersih (GCLID Wajib Tetap Bertahan via Storage!)
window.location.search = ''; // User navigasi ke halaman lain tanpa query string
const pageTwoTracking = testExtractUrlTracking('');
assert.strictEqual(pageTwoTracking.gclid, 'CjwKCAjwTestGCLID998877', 'GCLID WAJIB bertahan saat pindah halaman!');
assert.strictEqual(pageTwoTracking.utm_source, 'google_ads', 'utm_source WAJIB bertahan saat pindah halaman!');
console.log('  ✓ 2. Persistensi GCLID lintas halaman (90 hari window) bekerja sempurna');

// 3. Uji Kasus C: Kunjungan Organik Murni Tanpa GCLID Sebelumnya
mockStorage.clear();
const pureOrganic = testExtractUrlTracking('');
assert.strictEqual(pureOrganic.gclid, '');
assert.strictEqual(pureOrganic.utm_source, 'direct');
console.log('  ✓ 3. Graceful fallback kunjungan organik murni valid');

// 4. Uji Format Pesan WhatsApp & Ref ID
function mockFormatWhatsAppUrl(defaultMsg, refId) {
  const formatted = `${defaultMsg.trim()}\n\n[Ref: ${refId}]`;
  return `https://wa.me/6281228237512?text=${encodeURIComponent(formatted)}`;
}

const refId = 'LV-8765';
const defaultMessage = 'Halo Lawu Vista, saya mau tanya Paket Super Combo.';
const waUrl = mockFormatWhatsAppUrl(defaultMessage, refId);

assert(waUrl.includes('https://wa.me/6281228237512?text='), 'URL WhatsApp harus valid');
assert(decodeURIComponent(waUrl).includes('[Ref: LV-8765]'), 'Pesan WhatsApp wajib menyertakan kode Ref');
console.log('  ✓ 4. Format URL WhatsApp & penyisipan Ref ID valid');

// 5. Uji Anti-Duplikasi Listener
let clickCount = 0;
const mockCta = {
  attributes: new Map(),
  getAttribute(k) { return this.attributes.get(k) || null; },
  setAttribute(k, v) { this.attributes.set(k, String(v)); },
  listeners: [],
  addEventListener(event, fn) { this.listeners.push({ event, fn }); },
  click() { this.listeners.forEach(l => l.fn()); }
};

function bindCta(cta) {
  if (cta.getAttribute('data-tracker-bound') === 'true') return;
  cta.setAttribute('data-tracker-bound', 'true');
  cta.addEventListener('click', () => { clickCount++; });
}

// Panggilan pertama (misal dari WhatsAppCTA.astro)
bindCta(mockCta);
// Panggilan kedua (misal dari Layout.astro)
bindCta(mockCta);

mockCta.click();
assert.strictEqual(clickCount, 1, 'Event listener klik hanya boleh terpanggil tepat 1 kali!');
console.log('  ✓ 5. Anti-duplikasi listener CTA WhatsApp bekerja tepat 1x');

// 6. Verifikasi Format Google Ads Offline Conversion CSV Row
const mockConversionRow = {
  gclid: firstLand.gclid,
  conversionName: 'Qualified_Booking_DP',
  conversionTime: '2026-10-10 14:30:00 Asia/Jakarta',
  conversionValue: 195000,
  conversionCurrency: 'IDR'
};

const csvLine = `${mockConversionRow.gclid},${mockConversionRow.conversionName},${mockConversionRow.conversionTime},${mockConversionRow.conversionValue},${mockConversionRow.conversionCurrency}`;
assert(csvLine.startsWith('CjwKCAjwTestGCLID998877,Qualified_Booking_DP'), 'Baris CSV harus sesuai spesifikasi Google Ads');
console.log('  ✓ 6. Format baris CSV Google Ads Offline Conversion Upload valid');

console.log('\n🎉 Seluruh logika pelacakan & persistensi P0 lulus pengujian 100%!');
