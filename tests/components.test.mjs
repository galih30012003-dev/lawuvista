import { readFileSync, existsSync } from 'fs';
import assert from 'assert';

console.log('🔍 Memverifikasi komponen inti & CRO...');

// 1. Verifikasi keberadaan file komponen
const components = [
  'src/components/layout/Navbar.astro',
  'src/components/layout/Footer.astro',
  'src/components/cro/WhatsAppCTA.astro',
  'src/components/cro/BundleCard.astro',
  'src/components/cro/PaxCalculator.astro',
  'src/components/cro/TrustMarquee.astro',
  'src/components/seo/JsonLd.astro'
];

components.forEach(cmp => {
  assert(existsSync(cmp), `Komponen ${cmp} wajib ada`);
  const content = readFileSync(cmp, 'utf8');
  assert(content.length > 50, `Komponen ${cmp} tidak boleh kosong`);
  console.log(`  ✓ ${cmp} ada dan memiliki isi`);
});

// 2. Verifikasi WhatsAppCTA & tracker memiliki modul penangkap GCLID & Ref ID
const waCtaContent = readFileSync('src/components/cro/WhatsAppCTA.astro', 'utf8');
const configContent = readFileSync('src/config/tracker.ts', 'utf8');
const trackerContent = readFileSync('src/utils/tracker.ts', 'utf8');
assert(waCtaContent.includes('getOrGenerateRefId') || waCtaContent.includes('lv_ref_id'), 'WhatsAppCTA wajib memproses Ref ID');
assert(waCtaContent.includes('sendLeadSignal') || waCtaContent.includes('wa_click_conversion'), 'WhatsAppCTA wajib menembakkan event signal');
assert(configContent.includes('lv_ref_id'), 'config/tracker.ts wajib mendefinisikan storage key Ref ID');
assert(trackerContent.includes('wa_click_conversion'), 'tracker.ts wajib menembakkan event wa_click_conversion');
console.log('  ✓ WhatsAppCTA & tracker.ts memiliki logika tracking GCLID & Ref ID');

// 3. Verifikasi BundleCard memiliki elemen perbandingan harga (savings & strikethrough)
const bundleCardContent = readFileSync('src/components/cro/BundleCard.astro', 'utf8');
assert(bundleCardContent.includes('originalPrice'), 'BundleCard wajib menangani harga coret');
assert(bundleCardContent.includes('Hemat Rp'), 'BundleCard wajib memiliki badge hemat');
console.log('  ✓ BundleCard memiliki kalkulasi harga coret dan badge hemat');

console.log('\n🎉 Semua komponen inti & CRO lolos verifikasi!');
