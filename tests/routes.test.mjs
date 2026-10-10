import { readFileSync, existsSync } from 'fs';
import assert from 'assert';

console.log('🔍 Menguji kelengkapan seluruh rute website Lawu Vista...');

const routes = [
  { path: 'dist/index.html', canonical: 'https://lawuvista.com/' },
  { path: 'dist/jeep-adventure-kemuning/index.html', canonical: 'https://lawuvista.com/jeep-adventure-kemuning/' },
  { path: 'dist/outbound-kemuning/index.html', canonical: 'https://lawuvista.com/outbound-kemuning/' },
  { path: 'dist/river-tubing-kemuning/index.html', canonical: 'https://lawuvista.com/river-tubing-kemuning/' },
  { path: 'dist/villa-kemuning/index.html', canonical: 'https://lawuvista.com/villa-kemuning/' },
  { path: 'dist/privacy-policy/index.html', canonical: 'https://lawuvista.com/privacy-policy/' },
  { path: 'dist/syarat-ketentuan/index.html', canonical: 'https://lawuvista.com/syarat-ketentuan/' },
  { path: 'dist/404.html', canonical: 'https://lawuvista.com/404.html' }
];

routes.forEach(route => {
  assert(existsSync(route.path), `Rute ${route.path} wajib ada di output build`);
  const html = readFileSync(route.path, 'utf8');
  assert(html.includes('<title>'), `Halaman ${route.path} wajib memiliki tag <title>`);
  assert(html.includes(`rel="canonical" href="${route.canonical}"`), `Kanonikal URL pada ${route.path} harus presisi (${route.canonical})`);
  assert(html.includes('/assets/fonts/poppins-600.woff2'), `Halaman ${route.path} wajib melakukan preload font Poppins`);
  assert(html.includes('property="og:image" content="https://'), `Halaman ${route.path} wajib memiliki URL absolut pada og:image`);
  assert(html.length > 500, `Halaman ${route.path} tidak boleh kosong`);
  console.log(`  ✓ Rute '${route.path}' terkompilasi sempurna dengan canonical '${route.canonical}'`);
});

// Verifikasi file statis penting di folder dist
const staticFiles = [
  'dist/robots.txt',
  'dist/sitemap.xml',
  'dist/.htaccess',
  'dist/llms.txt'
];

staticFiles.forEach(file => {
  assert(existsSync(file), `File statis penting ${file} wajib ada di dist/`);
  const content = readFileSync(file, 'utf8');
  assert(content.length > 20, `File ${file} tidak boleh kosong`);
  console.log(`  ✓ File publik '${file}' terdistribusi dengan benar ke dist/`);
});

console.log(`\n🎉 Seluruh ${routes.length} rute Lawu Vista berhasil diverifikasi 100%!`);
