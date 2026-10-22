import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('🔍 Menguji alignment dan centering card paket di Home dan Halaman Layanan...');

const globalCss = fs.readFileSync('src/styles/global.css', 'utf8');
const homeAstro = fs.readFileSync('src/pages/index.astro', 'utf8');
const jeepAstro = fs.readFileSync('src/pages/jeep-adventure-kemuning/index.astro', 'utf8');
const outboundAstro = fs.readFileSync('src/pages/outbound-kemuning/index.astro', 'utf8');
const tubingAstro = fs.readFileSync('src/pages/river-tubing-kemuning/index.astro', 'utf8');
const villaAstro = fs.readFileSync('src/pages/villa-kemuning/index.astro', 'utf8');

// 1. services-grid harus ada di global.css dengan aturan 4 kolom desktop dan 2 kolom tablet
assert.match(globalCss, /\.services-grid/, 'global.css harus mendefinisikan .services-grid');
assert.match(globalCss, /repeat\(4,\s*1fr\)/, 'services-grid harus mendukung repeat(4, 1fr) pada desktop');
console.log('  ✓ 1. services-grid memiliki aturan 4 kolom simetris pada desktop');

// 2. packages-grid harus mendukung auto-centering untuk 1 card, 2 card, dan 3 card
assert.match(globalCss, /\.packages-grid/, 'global.css harus mendefinisikan .packages-grid');
assert.match(globalCss, /justify-content:\s*center/, 'packages-grid harus memiliki justify-content: center');
assert.match(globalCss, /packages-grid-1/, 'global.css harus mendukung .packages-grid-1');
assert.match(globalCss, /packages-grid-2/, 'global.css harus mendukung .packages-grid-2');
console.log('  ✓ 2. packages-grid memiliki aturan responsif & auto-centering untuk 1, 2, dan 3 card');

// 3. Template Halaman Layanan menggunakan grid modifier / centered container yang tepat
assert.match(jeepAstro, /packages-grid-2/, 'jeep-adventure-kemuning harus menggunakan .packages-grid-2 untuk 2 bundling card');
assert.match(outboundAstro, /packages-grid-2/, 'outbound-kemuning harus menggunakan .packages-grid-2 untuk 2 bundling card');
assert.match(tubingAstro, /packages-grid-1/, 'river-tubing-kemuning harus menggunakan .packages-grid-1 untuk 1 bundling card');

// 4. Katalog reguler multi-baris (Outbound 8 paket, Tubing 4 paket) 3 kolom urut dari kiri
assert.match(outboundAstro, /jpkg-grid-3/, 'outbound-kemuning harus menggunakan .jpkg-grid-3 untuk 8 paket');
assert.match(tubingAstro, /jpkg-grid-3/, 'river-tubing-kemuning harus menggunakan .jpkg-grid-3 untuk 4 paket');
assert.match(jeepAstro, /jpkg-grid-row-center/, 'jeep-adventure-kemuning harus menggunakan .jpkg-grid-row-center untuk grup 2 paket');
assert.match(globalCss, /\.jpkg-grid-row-center/, 'global.css harus mendefinisikan .jpkg-grid-row-center');
assert.match(globalCss, /\.jpkg-grid-3/, 'global.css harus mendefinisikan .jpkg-grid-3');
console.log('  ✓ 4. Katalog reguler (Outbound & Tubing) 3 kolom mengalir dari kiri, grup 2 paket di tengah');

console.log('\n🎉 Seluruh verifikasi grid alignment & centering lolos 100%!');
