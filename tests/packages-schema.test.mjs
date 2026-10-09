import { readFileSync } from 'fs';
import assert from 'assert';

const raw = readFileSync('src/data/packages.json', 'utf8');
const data = JSON.parse(raw);

console.log('🔍 Memeriksa skema packages.json...');

// 1. Validasi struktur kategori utama
const requiredCategories = ['bundles', 'jeep', 'tubing', 'outbound', 'villa'];
requiredCategories.forEach(cat => {
  assert(Array.isArray(data[cat]), `Kategori ${cat} harus berupa array`);
  assert(data[cat].length > 0, `Kategori ${cat} tidak boleh kosong`);
  console.log(`  ✓ Kategori '${cat}' valid dengan ${data[cat].length} item`);
});

// 2. Validasi kelengkapan field pada setiap paket
const allPackages = Object.values(data).flat();
const ids = new Set();

allPackages.forEach(pkg => {
  // Cek ID unik
  assert(pkg.id, `Paket ${JSON.stringify(pkg)} wajib memiliki field 'id'`);
  assert(!ids.has(pkg.id), `ID '${pkg.id}' terduplikasi`);
  ids.add(pkg.id);

  // Cek Nama & Tagline
  assert(typeof pkg.name === 'string' && pkg.name.trim().length > 0, `Paket ${pkg.id} wajib memiliki nama valid`);
  assert(typeof pkg.tagline === 'string' && pkg.tagline.trim().length > 0, `Paket ${pkg.id} wajib memiliki tagline`);

  // Cek Harga
  assert(typeof pkg.priceAmount === 'number' && pkg.priceAmount > 0, `Harga paket ${pkg.id} harus angka positif`);
  assert(['/jeep', '/orang', '/malam', '/pax'].includes(pkg.priceUnit), `Unit harga paket ${pkg.id} (${pkg.priceUnit}) tidak valid`);

  // Cek Fitur
  assert(Array.isArray(pkg.features) && pkg.features.length >= 3, `Paket ${pkg.id} harus memiliki minimal 3 fitur`);

  // Cek Template WhatsApp
  assert(typeof pkg.waTemplate === 'string' && pkg.waTemplate.length >= 10, `Paket ${pkg.id} wajib memiliki waTemplate yang jelas`);

  // Cek Gambar
  assert(typeof pkg.image === 'string' && pkg.image.startsWith('/assets/'), `Path gambar paket ${pkg.id} harus diawali '/assets/'`);
});

console.log(`\n🎉 Total ${allPackages.length} paket berhasil divalidasi tanpa cacat skema!`);
