import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('🔍 Menguji komponen & integrasi section antarhalaman (OtherServices)...');

// 1. File komponen harus ada
assert.ok(fs.existsSync('src/components/cro/OtherServices.astro'), 'File OtherServices.astro harus ada di src/components/cro/');

const compSource = fs.readFileSync('src/components/cro/OtherServices.astro', 'utf8');
assert.match(compSource, /jeep-adventure-kemuning/, 'Harus memiliki link ke jeep');
assert.match(compSource, /outbound-kemuning/, 'Harus memiliki link ke outbound');
assert.match(compSource, /river-tubing-kemuning/, 'Harus memiliki link ke tubing');
assert.match(compSource, /villa-kemuning/, 'Harus memiliki link ke villa');
console.log('  ✓ 1. Komponen OtherServices.astro lengkap dengan 4 rute layanan');

// 2. Terintegrasi di 4 halaman layanan
const jeepSource = fs.readFileSync('src/pages/jeep-adventure-kemuning/index.astro', 'utf8');
const outboundSource = fs.readFileSync('src/pages/outbound-kemuning/index.astro', 'utf8');
const tubingSource = fs.readFileSync('src/pages/river-tubing-kemuning/index.astro', 'utf8');
const villaSource = fs.readFileSync('src/pages/villa-kemuning/index.astro', 'utf8');

assert.match(jeepSource, /OtherServices/, 'Halaman jeep harus mengimpor & menggunakan OtherServices');
assert.match(jeepSource, /currentService="jeep"/, 'Halaman jeep harus set currentService="jeep"');

assert.match(outboundSource, /OtherServices/, 'Halaman outbound harus mengimpor & menggunakan OtherServices');
assert.match(outboundSource, /currentService="outbound"/, 'Halaman outbound harus set currentService="outbound"');

assert.match(tubingSource, /OtherServices/, 'Halaman tubing harus mengimpor & menggunakan OtherServices');
assert.match(tubingSource, /currentService="tubing"/, 'Halaman tubing harus set currentService="tubing"');

assert.match(villaSource, /OtherServices/, 'Halaman villa harus mengimpor & menggunakan OtherServices');
assert.match(villaSource, /currentService="villa"/, 'Halaman villa harus set currentService="villa"');

console.log('  ✓ 2. 4 halaman layanan sukses mengintegrasikan OtherServices');
console.log('\n🎉 Seluruh pengujian komponen antarhalaman (OtherServices) sukses 100%!');
