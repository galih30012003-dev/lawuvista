import { readFileSync, existsSync } from 'fs';
import assert from 'assert';

console.log('🔍 Menguji output build dedicated landing pages...');

// 1. Verifikasi Halaman B2C: /jeep-adventure-kemuning/
const jeepHtmlPath = 'dist/jeep-adventure-kemuning/index.html';
assert(existsSync(jeepHtmlPath), `File ${jeepHtmlPath} harus ter-generate`);
const jeepHtml = readFileSync(jeepHtmlPath, 'utf8');

assert(jeepHtml.includes('rel="canonical" href="https://lawuvista.com/jeep-adventure-kemuning/"'), 'Kanonikal B2C harus presisi mempertahankan SEO');
assert(jeepHtml.includes('Super Combo'), 'Halaman B2C wajib memuat penawaran Super Combo');
assert(jeepHtml.includes('pax-slider'), 'Halaman B2C wajib memuat slider Pax Calculator');
assert(jeepHtml.includes('lv-wa-cta'), 'Halaman B2C wajib memuat tombol WhatsApp cerdas');
console.log('  ✓ Halaman B2C (/jeep-adventure-kemuning/) valid & mempertahankan SEO');

// 2. Verifikasi Halaman B2B: /outbound-kemuning/
const outboundHtmlPath = 'dist/outbound-kemuning/index.html';
assert(existsSync(outboundHtmlPath), `File ${outboundHtmlPath} harus ter-generate`);
const outboundHtml = readFileSync(outboundHtmlPath, 'utf8');

assert(outboundHtml.includes('rel="canonical" href="https://lawuvista.com/outbound-kemuning/"'), 'Kanonikal B2B harus presisi mempertahankan SEO');
assert(outboundHtml.includes('Vendor Outbound &amp; Gathering') || outboundHtml.includes('Vendor Outbound'), 'Halaman B2B wajib memuat headline korporat');
assert(outboundHtml.includes('Telkom Indonesia') || outboundHtml.includes('Bank BRI'), 'Halaman B2B wajib memuat bukti instansi besar');
assert(outboundHtml.includes('Corporate Retreat'), 'Halaman B2B wajib memuat paket Corporate Retreat 2D1N');
assert(outboundHtml.includes('Proposal'), 'Halaman B2B wajib memuat penawaran proposal resmi');
console.log('  ✓ Halaman B2B (/outbound-kemuning/) valid & mempertahankan SEO');

console.log('\n🎉 Pengujian 2 Dedicated Landing Page Task 5 Sukses 100%!');
