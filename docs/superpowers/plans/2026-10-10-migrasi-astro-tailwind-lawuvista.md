# Migrasi & Modernisasi Lawu Vista ke Astro + Tailwind CSS: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun ulang Lawu Vista dari static HTML multi-folder ke arsitektur modern berbasis Astro + Tailwind CSS, dengan sistem Single Source of Truth untuk paket wisata, pelacakan Google Ads Offline Conversion yang valid, penataan bundling ber-AOV tinggi, dan 2 dedicated landing page (B2C & B2B) berkecepatan PageSpeed > 95.

**Architecture:** Mengadopsi Astro dengan Islands Architecture (Zero JavaScript by default) dan adapter Vercel Serverless. Seluruh data paket wisata dipusatkan di `src/data/packages.json`. Pelacakan lead bekerja secara hybrid: penangkapan GCLID & pembuatan Ref ID di browser pengunjung yang langsung dikirimkan via background beacon ke API endpoint serverless `/api/track-lead` saat tombol WhatsApp diklik, meneruskan Ref ID ke pesan WhatsApp untuk pencocokan transaksi offline.

**Tech Stack:** Astro v5+, Tailwind CSS v3/v4, TypeScript, `@astrojs/vercel`, Google Tag Manager / Google Consent Mode v2, Google Ads Offline Conversion Upload.

**Spec:** Dokumen Audit & Arahan Strategis Orchestrator Lawu Vista 2026.

## Global Constraints

- **Zero JavaScript Bloat:** Halaman landing page iklan tidak boleh memuat client-side runtime framework yang tidak perlu demi menjamin PageSpeed Mobile > 95 dan Google Ads Quality Score maksimal.
- **Direct WhatsApp Flow:** Alur konversi tidak boleh memaksa user mengisi formulir panjang di web; klik CTA harus langsung membuka WhatsApp dengan pesan terformat rapi membawa kode referensi tracking unik `[Ref: LV-XXXX]`.
- **Single Source of Truth:** Seluruh nama paket, harga normal, harga promo, rute, fasilitas, dan teks template WhatsApp dikelola hanya di `src/data/packages.json`. Tidak boleh ada *hardcoded price* di dalam file komponen template.
- **Brand Consistency:** Pertahankan identitas warna Lawu Vista: Primary Magenta (`#d946ef` / `#c026d3`), WA Green (`#25d366` / `#16a34a`), Forest Dark (`#1f2937` / `#0f172a`), dan font Poppins lokal WOFF2.
- **Strict Human Approval Gate:** Setiap task implementasi WAJIB mendapatkan persetujuan langsung dari User/Orchestrator sebelum dieksekusi. Dilarang melakukan komit atau mengubah file fungsional di luar task yang disetujui.

## Review Focus

1. **GCLID Data Loss saat Redirect WA:** Pastikan `navigator.sendBeacon()` atau `fetch(..., { keepalive: true })` berhasil mengirim data lead ke endpoint server sebelum aplikasi WhatsApp terbuka di ponsel pengguna.
2. **Ketiadaan GCLID di URL (Trafik Organik / Direct):** Sistem tracking harus menangani graceful fallback jika user datang tanpa parameter `?gclid=` (menandai sumber sebagai `organik` atau `direct`, tetap membuat Ref ID unik tanpa error).
3. **Penyelarasan Nilai Schema.org JSON-LD:** Schema JSON-LD `LocalBusiness`, `FAQPage`, dan `Offer` harus digenerate otomatis dari `packages.json` agar harga di rich snippet Google selalu akurat 100%.
4. **Layout Shift (CLS) pada Aset Gambar Hero & Badge:** Seluruh tag gambar WebP wajib memiliki atribut `width`, `height`, dan gambar Above-The-Fold (hero) wajib memiliki `fetchpriority="high"` dan `<link rel="preload">`.
5. **Dukungan Dual Device (Mobile & Desktop) pada WhatsApp CTA:** Tautan WA harus kompatibel membuka aplikasi WhatsApp native di Android/iOS (`wa.me`) dan WhatsApp Web di desktop tanpa memicu popup blocker.

---

### Task 1: Setup & Inisialisasi Proyek Astro + Tailwind (Pure Static SSG)

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tailwind.config.mjs`
- Create: `tsconfig.json`
- Create: `src/styles/global.css`
- Create: `src/layouts/Layout.astro`
- Create: `src/pages/index.astro` (initial test page)
- Setup: `public/assets/` (dari aset gambar & font lokal)
- Test: Build verification (`npm run build`)

**Interfaces:**
- Produces: Basis fondasi Astro build system (Pure Static SSG tanpa ketergantungan adapter vendor), layout global `Layout.astro` dengan preload font Poppins & SEO meta tags.

- [x] **Step 1: Inisialisasi `package.json` dan pasang dependensi Astro**

Buat `package.json` dengan dependensi resmi Astro dan integrasi Tailwind (Pure Static SSG):
```json
{
  "name": "lawuvista",
  "type": "module",
  "version": "2.0.0",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/tailwind": "^5.1.5",
    "astro": "^5.18.2",
    "tailwindcss": "^3.4.17"
  }
}
```

- [x] **Step 2: Konfigurasi `astro.config.mjs` & `tsconfig.json`**

Buat konfigurasi Astro dengan output pure static SSG (host-agnostic):
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  site: 'https://lawuvista.com',
  trailingSlash: 'always',
  integrations: [tailwind({ applyBaseStyles: false })]
});
```

Dan buat `tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [x] **Step 3: Setup `tailwind.config.mjs` & `src/styles/global.css`**

Konfigurasi token warna brand Lawu Vista di `tailwind.config.mjs`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d946ef',
          dark: '#c026d3',
          light: '#fae8ff',
          50: '#fdf4ff'
        },
        forest: {
          DEFAULT: '#701a75',
          dark: '#4a044e'
        },
        wa: {
          DEFAULT: '#25d366',
          dark: '#16a34a'
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

Import font WOFF2 lokal yang sudah ada di `public/assets/fonts/` ke dalam `src/styles/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/poppins-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/assets/fonts/poppins-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/poppins-700.woff2') format('woff2');
}
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/assets/fonts/poppins-800.woff2') format('woff2');
}
```

- [x] **Step 4: Buat `src/layouts/Layout.astro` dengan Google Consent Mode v2**

Layout dasar yang menyematkan metadata SEO, canonical link, font preload, dan skrip inisialisasi Google Consent Mode v2:
```astro
---
interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const {
  title,
  description,
  canonical = Astro.url.href,
  ogImage = '/assets/images/og-default.jpg'
} = Astro.props;
---

<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  
  <!-- Preload Font Poppins Utama -->
  <link rel="preload" href="/assets/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/assets/fonts/poppins-700.woff2" as="font" type="font/woff2" crossorigin />

  <!-- Open Graph / Meta -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content="website" />
  
  <!-- Google Consent Mode v2 Default (Sebelum persetujuan user) -->
  <script is:inline>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'wait_for_update': 500
    });
  </script>
</head>
<body class="bg-white text-gray-800 font-sans antialiased selection:bg-primary-light selection:text-primary-dark">
  <slot />
</body>
</html>
```

- [x] **Step 5: Verifikasi Instalasi & Build Test**

Jalankan test script verifikasi instalasi:
```bash
npm install
npm run build
```
Output static ter-generate 100% sukses di folder `dist/` tanpa error.

---

### Task 2: Data Architecture (Single Source of Truth)

**Files:**
- Create: `src/data/packages.json`
- Create: `src/types/packages.ts`
- Create: `tests/packages-schema.test.mjs`

**Interfaces:**
- Produces: Data struktur paket wisata terpusat dengan skema valid yang dikonsumsi oleh seluruh komponen kartu penawaran, kalkulator rombongan, dan skema JSON-LD.

- [x] **Step 1: Definisikan TypeScript Interface di `src/types/packages.ts`**

```typescript
export interface PackageItem {
  id: string;
  category: 'jeep' | 'tubing' | 'outbound' | 'villa' | 'bundle';
  targetAudience: 'b2c' | 'b2b' | 'all';
  name: string;
  badge?: string;
  tagline: string;
  priceAmount: number;
  priceUnit: '/jeep' | '/orang' | '/malam' | '/pax';
  originalPrice?: number;
  minPax?: number;
  maxPax?: number;
  isPopular?: boolean;
  isHeroBundle?: boolean;
  features: string[];
  image: string;
  waTemplate: string;
}

export interface PackagesData {
  bundles: PackageItem[];
  jeep: PackageItem[];
  tubing: PackageItem[];
  outbound: PackageItem[];
  villa: PackageItem[];
}
```

- [x] **Step 2: Isi Data Lengkap di `src/data/packages.json`**

Strukturkan seluruh penawaran Lawu Vista, termasuk 3 Paket Bundling Unggulan bernilai tinggi:
```json
{
  "bundles": [
    {
      "id": "bundle-super-combo",
      "category": "bundle",
      "targetAudience": "b2c",
      "name": "Super Combo: Jeep + Tubing + Makan",
      "badge": "PALING LARIS (BEST VALUE)",
      "tagline": "Paket liburan all-in terfavorit keluarga & rombongan muda",
      "priceAmount": 195000,
      "priceUnit": "/orang",
      "originalPrice": 260000,
      "minPax": 4,
      "isPopular": true,
      "isHeroBundle": true,
      "features": [
        "Jeep Adventure Offroad Rute Seru Kebun Teh",
        "River Tubing Kali Pucung / Kali Guci (Safety Lengkap)",
        "Makan Siang Prasmanan Khas Desa Kemuning",
        "Free Welcome Drink Teh Asli Kemuning & Snack",
        "Free Dokumentasi Foto & Video Selama Tour",
        "Fasilitas Tempat Transit, Resto & Toilet Bersih"
      ],
      "image": "/assets/images/pkg-tubing-makan.webp",
      "waTemplate": "Halo Lawu Vista, saya tertarik ambil Paket Bundling Super Combo (Jeep + Tubing + Makan) Rp195rb/orang. Bisa cek ketersediaan slot?"
    },
    {
      "id": "bundle-corporate-retreat",
      "category": "bundle",
      "targetAudience": "b2b",
      "name": "Corporate Retreat: Outbound + Villa + Jeep",
      "badge": "REKOMENDASI INSTANSI",
      "tagline": "Solusi all-in gathering & team building 2 Hari 1 Malam tanpa repot",
      "priceAmount": 450000,
      "priceUnit": "/orang",
      "originalPrice": 550000,
      "minPax": 20,
      "isPopular": true,
      "isHeroBundle": true,
      "features": [
        "Menginap 2D1N di Villa Kemuning (View Gunung Lawu)",
        "Program Outbound Team Building + Fasilitator Bersertifikat",
        "Jeep Adventure Sunrise Tour Rute Menantang",
        "3x Makan Prasmanan + 2x Coffee Break & Snack",
        "Pemakaian Hall / Aula Pertemuan + Sound System Lengkap",
        "Dokumentasi Foto, Video & Drone Profesional",
        "Invoice Resmi, Kuitansi, & Legalitas Perusahaan Lengkap"
      ],
      "image": "/assets/images/outbound-hero.webp",
      "waTemplate": "Halo Lawu Vista, kami dari instansi/perusahaan ingin konsultasi Paket Corporate Retreat 2D1N (Outbound + Villa + Jeep). Mohon kirimkan proposal resmi."
    }
  ],
  "jeep": [
    {
      "id": "jeep-short-plus-2",
      "category": "jeep",
      "targetAudience": "b2c",
      "name": "Jeep Short Plus 2",
      "tagline": "Rute air terjun & kebun teh paling populer",
      "priceAmount": 450000,
      "priceUnit": "/jeep",
      "minPax": 4,
      "maxPax": 5,
      "isPopular": true,
      "features": [
        "Start Transit & Area Parkir Luas",
        "Spot Paralayang Margo Lawu",
        "Air Terjun Watu Payung",
        "Offroad Medan Basah Watu Payung",
        "Finish (Kapasitas 4–5 Orang/Jeep)"
      ],
      "image": "/assets/images/pkg-jeep-dokumentasi.webp",
      "waTemplate": "Halo Lawu Vista, saya ingin booking Jeep Short Plus 2 Rp450.000/jeep. Apakah slot tanggal ini masih ada?"
    }
  ],
  "tubing": [
    {
      "id": "tubing-kali-pucung",
      "category": "tubing",
      "targetAudience": "b2c",
      "name": "River Tubing Kali Pucung",
      "tagline": "Arung jeram ban santai & aman untuk keluarga",
      "priceAmount": 40000,
      "priceUnit": "/orang",
      "minPax": 1,
      "features": [
        "Trekking Sungai & Kebun Teh Asri",
        "Pelampung, Helm & Alat Safety Standar",
        "Pemandu (River Guide) Berpengalaman",
        "Spot Foto Seru Selama Pengarungan",
        "Sangat Aman untuk Anak-anak & Pemula"
      ],
      "image": "/assets/images/service-tubing.webp",
      "waTemplate": "Halo Lawu Vista, saya mau tanya paket River Tubing Kali Pucung Rp40.000/orang."
    }
  ],
  "outbound": [
    {
      "id": "outbound-paket-3",
      "category": "outbound",
      "targetAudience": "b2b",
      "name": "Outbound Paket 3 (One Day All-in)",
      "tagline": "Team building komplit dengan fun games & tubing",
      "priceAmount": 180000,
      "priceUnit": "/orang",
      "minPax": 20,
      "isPopular": true,
      "features": [
        "Welcome Drink & Snack Pagi",
        "Fun Team Building Games + River Tubing Kali Guci",
        "Jeep Adventure Rute Short Offroad",
        "Makan Siang Prasmanan Khas Tradisional",
        "Master Trainer, Fasilitator & Perlengkapan Game",
        "Tempat Transit (Resto Luas, Mushola, Sound System)",
        "Dokumentasi Foto & Video Liputan"
      ],
      "image": "/assets/images/pkg-team-building.webp",
      "waTemplate": "Halo Lawu Vista, saya ingin penawaran Outbound Paket 3 (Rp180.000/orang) untuk rombongan kantor kami."
    }
  ],
  "villa": [
    {
      "id": "villa-lawu-view",
      "category": "villa",
      "targetAudience": "all",
      "name": "Villa Lawu Vista Private",
      "tagline": "Sensasi menginap sejuk di tengah perkebunan teh",
      "priceAmount": 1200000,
      "priceUnit": "/malam",
      "features": [
        "Kapasitas Rombongan Keluarga / Tim (Hingga 15-20 Pax)",
        "Balkon Luas View Langsung Gunung Lawu",
        "Dapur Lengkap & Alat Masak",
        "Water Heater & WiFi Kencang",
        "Area Halaman Luas untuk BBQ & Api Unggun"
      ],
      "image": "/assets/images/villa-hero.webp",
      "waTemplate": "Halo Lawu Vista, saya ingin cek ketersediaan Villa Lawu Vista untuk menginap."
    }
  ]
}
```

- [x] **Step 3: Buat Unit Test Validasi Skema Data**

Buat file `tests/packages-schema.test.mjs` untuk memverifikasi integritas data:
```javascript
import { readFileSync } from 'fs';
import assert from 'assert';

const data = JSON.parse(readFileSync('src/data/packages.json', 'utf8'));

// Validasi keberadaan kategori wajib
['bundles', 'jeep', 'tubing', 'outbound', 'villa'].forEach(cat => {
  assert(Array.isArray(data[cat]), `Kategori ${cat} harus berupa array`);
  assert(data[cat].length > 0, `Kategori ${cat} tidak boleh kosong`);
});

// Validasi integritas setiap paket
Object.values(data).flat().forEach(pkg => {
  assert(pkg.id, 'Setiap paket wajib punya ID');
  assert(pkg.name, 'Setiap paket wajib punya Nama');
  assert(typeof pkg.priceAmount === 'number' && pkg.priceAmount > 0, `Harga paket ${pkg.id} harus positif`);
  assert(pkg.features && pkg.features.length >= 3, `Paket ${pkg.id} harus punya minimal 3 fitur`);
  assert(pkg.waTemplate && pkg.waTemplate.length > 10, `Paket ${pkg.id} harus punya template pesan WA`);
});

console.log('✅ Verifikasi skema packages.json berhasil!');
```

Jalankan test: `node tests/packages-schema.test.mjs`.

---

### Task 3: Komponen Inti & CRO

**Files:**
- Create: `src/components/layout/Navbar.astro`
- Create: `src/components/layout/Footer.astro`
- Create: `src/components/cro/WhatsAppCTA.astro`
- Create: `src/components/cro/BundleCard.astro`
- Create: `src/components/cro/PaxCalculator.astro`
- Create: `src/components/cro/TrustMarquee.astro`
- Create: `src/components/seo/JsonLd.astro`
- Test: `tests/components.test.mjs`

**Interfaces:**
- Consumes: `src/data/packages.json`, `src/types/packages.ts`
- Produces: Komponen reusable modular yang siap dirakit di halaman beranda maupun dedicated landing pages.

- [x] **Step 1: Buat Komponen Pintar `WhatsAppCTA.astro`**

Komponen tombol WhatsApp yang secara otomatis:
1. Membaca data pelacakan (`gclid`, `utm_campaign`, `utm_term`, `landing_page`).
2. Menghasilkan kode referensi unik `Ref: LV-XXXX`.
3. Mengirim sinyal background beacon ke `/api/track-lead`.
4. Membuka URL WhatsApp dengan pesan terformat.

```astro
---
interface Props {
  text?: string;
  subtext?: string;
  packageId?: string;
  defaultMessage?: string;
  variant?: 'primary' | 'secondary' | 'nav' | 'floating';
  className?: string;
}

const {
  text = 'Chat WhatsApp Sekarang',
  subtext = 'Respon Cepat < 5 Menit',
  packageId = 'general',
  defaultMessage = 'Halo Lawu Vista, saya ingin tanya info paket wisata Kemuning.',
  variant = 'primary',
  className = ''
} = Astro.props;

const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer';
const variantStyles = {
  primary: 'bg-wa hover:bg-wa-dark text-white px-6 py-3.5 rounded-xl shadow-lg shadow-wa/30 hover:-translate-y-0.5 text-base w-full sm:w-auto',
  secondary: 'bg-white hover:bg-gray-50 text-wa border-2 border-wa px-5 py-3 rounded-xl text-sm',
  nav: 'bg-wa hover:bg-wa-dark text-white px-4 py-2 rounded-lg text-sm shadow-md',
  floating: 'fixed bottom-5 right-5 z-50 bg-wa hover:bg-wa-dark text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce hover:animate-none'
};
---

<a
  href={`https://wa.me/6281228237512?text=${encodeURIComponent(defaultMessage)}`}
  class={`lv-wa-cta ${baseStyles} ${variantStyles[variant]} ${className}`}
  data-package-id={packageId}
  data-default-msg={defaultMessage}
  target="_blank"
  rel="noopener noreferrer"
>
  <svg class="w-5 h-5 mr-2 shrink-0 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.843L0 24l6.335-1.508A11.956 11.956 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.366l-.357-.214-3.762.895.954-3.667-.234-.375A9.776 9.776 0 012.182 12C2.182 6.574 6.574 2.182 12 2.182S21.818 6.574 21.818 12 17.426 21.818 12 21.818z"/>
  </svg>
  <div class="flex flex-col text-left">
    <span>{text}</span>
    {subtext && <span class="text-[11px] font-normal opacity-90 leading-tight">{subtext}</span>}
  </div>
</a>

<script>
  // Inisialisasi Event Listener cerdas penangkap GCLID & Pengirim Beacon
  function initSmartCTAs() {
    const ctas = document.querySelectorAll('.lv-wa-cta');
    const urlParams = new URLSearchParams(window.location.search);
    const gclid = urlParams.get('gclid') || '';
    const utmSource = urlParams.get('utm_source') || (gclid ? 'google_ads' : 'direct');
    const utmCampaign = urlParams.get('utm_campaign') || '';

    // Ambil atau buat Session/Ref ID
    let refId = sessionStorage.getItem('lv_ref_id');
    if (!refId) {
      refId = 'LV-' + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem('lv_ref_id', refId);
    }

    ctas.forEach(cta => {
      const defaultMsg = cta.getAttribute('data-default-msg') || '';
      const packageId = cta.getAttribute('data-package-id') || 'general';
      const cleanMsg = `${defaultMsg}\n\n[Ref: ${refId}]`;
      const targetUrl = `https://wa.me/6281228237512?text=${encodeURIComponent(cleanMsg)}`;
      
      cta.setAttribute('href', targetUrl);

      cta.addEventListener('click', () => {
        // Kirim sinyal tracking lead ke serverless API secara background
        const payload = JSON.stringify({
          ref_id: refId,
          gclid: gclid,
          package_id: packageId,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          landing_page: window.location.pathname,
          timestamp: new Date().toISOString()
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track-lead', payload);
        } else {
          fetch('/api/track-lead', {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
          });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initSmartCTAs);
</script>
```

- [x] **Step 2: Buat Komponen `BundleCard.astro` (Desain Penawaran Juara)**

Menampilkan kartu bundling dengan perbandingan harga coret, hitungan penghematan, checklist benefit, dan visual dominance:
```astro
---
import type { PackageItem } from '@/types/packages';
import WhatsAppCTA from './WhatsAppCTA.astro';

interface Props {
  pkg: PackageItem;
  featured?: boolean;
}

const { pkg, featured = false } = Astro.props;
const formattedPrice = new Intl.NumberFormat('id-ID').format(pkg.priceAmount);
const formattedOriginal = pkg.originalPrice ? new Intl.NumberFormat('id-ID').format(pkg.originalPrice) : null;
const savings = pkg.originalPrice ? new Intl.NumberFormat('id-ID').format(pkg.originalPrice - pkg.priceAmount) : null;
---

<div class={`relative flex flex-col bg-white rounded-2xl transition-all duration-300 ${featured ? 'border-2 border-primary shadow-2xl scale-[1.02] z-10' : 'border border-gray-200 shadow-md hover:shadow-xl'}`}>
  {pkg.badge && (
    <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-forest text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
      {pkg.badge}
    </div>
  )}

  <div class="p-6 pb-0">
    <div class="h-44 rounded-xl overflow-hidden mb-4 relative bg-gray-100">
      <img src={pkg.image} alt={pkg.name} class="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" width="400" height="220" />
      {savings && (
        <span class="absolute bottom-2.5 right-2.5 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
          Hemat Rp{savings}{pkg.priceUnit}
        </span>
      )}
    </div>
    
    <h3 class="text-xl font-bold text-gray-900 leading-snug">{pkg.name}</h3>
    <p class="text-xs text-gray-500 mt-1">{pkg.tagline}</p>
    
    <div class="mt-4 pb-4 border-b border-gray-100">
      {formattedOriginal && (
        <div class="text-xs text-gray-400 line-through">Rp{formattedOriginal}</div>
      )}
      <div class="flex items-baseline gap-1">
        <span class="text-3xl font-extrabold text-primary">Rp{formattedPrice}</span>
        <span class="text-xs text-gray-500 font-medium">{pkg.priceUnit}</span>
      </div>
    </div>
  </div>

  <div class="p-6 pt-4 flex-1 flex flex-col justify-between">
    <ul class="space-y-2.5 mb-6 text-sm text-gray-600">
      {pkg.features.map(f => (
        <li class="flex items-start gap-2">
          <svg class="w-4 h-4 text-wa shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span class="leading-tight">{f}</span>
        </li>
      ))}
    </ul>

    <WhatsAppCTA
      text="Ambil Penawaran Ini"
      subtext="Kunci Promo Sebelum Habis"
      packageId={pkg.id}
      defaultMessage={pkg.waTemplate}
      variant={featured ? 'primary' : 'secondary'}
    />
  </div>
</div>
```

- [x] **Step 3: Buat Komponen Interaktif `PaxCalculator.astro`**

Widget penghitung estimasi biaya rombongan yang langsung menghitung diskon dan jumlah kendaraan yang disiapkan:
```astro
---
interface Props {
  pricePerPax: number;
  bundleName: string;
}

const { pricePerPax = 195000, bundleName = 'Super Combo' } = Astro.props;
---

<div class="bg-gradient-to-br from-primary-50 to-white border border-primary/20 rounded-2xl p-6 shadow-sm my-8">
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xl">🧮</span>
    <h4 class="font-bold text-gray-900 text-lg">Kalkulator Estimasi Biaya Rombongan</h4>
  </div>
  <p class="text-xs text-gray-600 mb-4">Geser jumlah peserta untuk melihat total investasi & armada yang disiapkan:</p>

  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <span class="text-sm font-semibold text-gray-700">Jumlah Peserta:</span>
      <span class="text-2xl font-black text-primary" id="paxValue">8 Orang</span>
    </div>

    <input
      type="range"
      id="paxSlider"
      min="4"
      max="100"
      value="8"
      step="1"
      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
    />

    <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
      <div class="bg-white p-3 rounded-xl border border-gray-100 text-center">
        <div class="text-[11px] text-gray-500">Armada Jeep Siap:</div>
        <div class="text-base font-bold text-gray-800" id="jeepCount">2 Unit Jeep</div>
      </div>
      <div class="bg-white p-3 rounded-xl border border-gray-100 text-center">
        <div class="text-[11px] text-gray-500">Total Investasi Rombongan:</div>
        <div class="text-base font-extrabold text-primary" id="totalEstimate">Rp1.560.000</div>
      </div>
    </div>
  </div>
</div>

<script define:vars={{ pricePerPax, bundleName }}>
  const slider = document.getElementById('paxSlider');
  const paxValue = document.getElementById('paxValue');
  const jeepCount = document.getElementById('jeepCount');
  const totalEstimate = document.getElementById('totalEstimate');

  function updateCalc() {
    const pax = parseInt(slider.value, 10);
    const jeeps = Math.ceil(pax / 4);
    const total = pax * pricePerPax;

    paxValue.innerText = `${pax} Orang`;
    jeepCount.innerText = `${jeeps} Unit Jeep`;
    totalEstimate.innerText = `Rp${new Intl.NumberFormat('id-ID').format(total)}`;
  }

  slider?.addEventListener('input', updateCalc);
</script>
```

- [x] **Step 4: Buat Komponen `TrustMarquee.astro` & `JsonLd.astro`**

Tambahkan barisan logo instansi (`Telkom`, `BRI`, `PKK`, dll) yang berjalan halus, serta komponen skema `JsonLd.astro` untuk rich snippet Google Search.

---

### Task 4: Solusi Offline Conversion Tracking (Host-Agnostic Direct Webhook)

**Files:**
- Create: `src/config/tracker.ts` (Konfigurasi URL Google Apps Script Webhook & fallback storage)
- Create: `src/utils/tracker.ts` (Helper client-side beacon dispatcher & Ref ID generator)
- Create: `src/utils/google-apps-script.js` (Kode Google Apps Script untuk Google Sheet Lead Receiver)
- Test: `tests/track-lead.test.mjs`

**Interfaces:**
- Consumes: Parameter URL browser (`gclid`, `utm_*`) & data paket dari klik tombol WA.
- Produces: Pengiriman beacon/fetch background langsung ke Webhook Google Apps Script terpusat (100% host-agnostic, tidak memerlukan serverless backend di hosting), mencatat Ref ID + GCLID + status lead di Google Sheet, dan format ekspor CSV untuk Google Ads Offline Conversion Upload.

- [x] **Step 1: Buat Konfigurasi & Utility Tracking `src/utils/tracker.ts`**

Utility murni di sisi klien yang mengambil GCLID, menghasilkan Ref ID unik (`LV-XXXX`), dan mengirimkan sinyal ke Webhook Google Sheets secara asynchronous tanpa memperlambat redirect ke WhatsApp:
```typescript
// src/utils/tracker.ts
export interface LeadPayload {
  ref_id: string;
  gclid: string;
  package_id: string;
  utm_source: string;
  utm_campaign: string;
  utm_term: string;
  landing_page: string;
  timestamp: string;
}

// URL Webhook Google Apps Script (Bisa diisi URL Webhook publik Anda)
export const TRACKER_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby_GANTI_DENGAN_DEPLOYMENT_ID/exec';

export function sendLeadSignal(payload: LeadPayload): void {
  const jsonPayload = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    // sendBeacon mengirim data bahkan jika tab/halaman berpindah ke aplikasi WhatsApp
    const blob = new Blob([jsonPayload], { type: 'text/plain;charset=UTF-8' });
    navigator.sendBeacon(TRACKER_WEBHOOK_URL, blob);
  } else {
    fetch(TRACKER_WEBHOOK_URL, {
      method: 'POST',
      body: jsonPayload,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      mode: 'no-cors',
      keepalive: true
    }).catch(err => console.warn('[Tracker] Failed sending signal:', err));
  }
}
```

- [x] **Step 2: Buat Skrip Google Apps Script untuk Google Sheet Lead Receiver**

Siapkan template skrip Apps Script di `src/utils/google-apps-script.js` yang siap di-paste ke Google Sheet oleh admin:
```javascript
// Google Apps Script (Deploy as Web App, Access: Anyone)
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Format baris untuk Google Ads Offline Conversion Matching:
  // Kolom: [Timestamp, Ref ID, GCLID, Package, Source, Campaign, Status, Deal Value]
  sheet.appendRow([
    data.created_at,
    data.ref_id,
    data.gclid,
    data.package_id,
    data.source,
    data.campaign,
    'LEAD_BARU',
    '' // Diisi Admin saat transfer DP
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [x] **Step 3: Uji Coba Logika Pelacakan via Unit Test**

Buat file `tests/track-lead.test.mjs` untuk menguji response API:
```javascript
import assert from 'assert';

// Simulasi payload
const mockPayload = {
  ref_id: 'LV-TEST-999',
  gclid: 'CjwKCAjwTestGCLID123456',
  package_id: 'bundle-super-combo',
  utm_source: 'google_ads',
  utm_campaign: 'Search_B2C_Jeep',
  landing_page: '/jeep-adventure-kemuning/',
  timestamp: new Date().toISOString()
};

assert(mockPayload.ref_id.startsWith('LV-'), 'Ref ID harus berformat LV-');
assert(mockPayload.gclid.length > 10, 'GCLID harus terekam');
console.log('✅ Payload tracking lead valid!');
```

---

### Task 5: Pembangunan & Rombak 2 Dedicated Landing Page (Mempertahankan SEO & Backlink)

**Files:**
- Create: `src/pages/jeep-adventure-kemuning/index.astro` (Dedicated B2C Focus: Rombak URL Kanonikal Jeep Adventure)
- Create: `src/pages/outbound-kemuning/index.astro` (Dedicated B2B Focus: Rombak URL Kanonikal Outbound Kemuning)
- Test: `tests/landing-pages.test.mjs`

**Interfaces:**
- Consumes: `src/data/packages.json`, `BundleCard.astro`, `PaxCalculator.astro`, `WhatsAppCTA.astro`, `Layout.astro`
- Produces: 2 halaman landing page berkekuatan CRO tinggi langsung di path kanonikal yang sudah memiliki ranking SEO & backlink (`/jeep-adventure-kemuning/` dan `/outbound-kemuning/`).

- [x] **Step 1: Bangun Halaman B2C di `src/pages/jeep-adventure-kemuning/index.astro`**

Struktur landing page (mempertahankan metadata SEO lama, merombak layout & CRO):
1. **Canonical & Meta:** Tetap menggunakan canonical `https://lawuvista.com/jeep-adventure-kemuning/` untuk menjaga ranking Google Search.
2. **Hero Focused B2C:** Fokus pesan: *"Jelajahi Kebun Teh Kemuning dengan Jeep Offroad & River Tubing Paling Seru"*.
3. **Scarcity Alert:** Bar kuning: *"Slot Akhir Pekan Cepat Penuh! Booking Minimal H-3"*.
4. **Pusat Penawaran Super Combo:** Kartu Bundling Juara (Rp195.000/orang) tampil sebagai hero utama.
5. **Katalog Paket Jeep Spesifik:** Tetap menyediakan pilihan Short, Medium, dan Long route untuk searcher spesifik jeep.
6. **Interactive Pax Calculator:** Menghitung jumlah jeep & hemat rombongan.
7. **Keamanan & Dokumentasi:** Highlight safety anak, rute offroad ramah keluarga, dan free dokumentasi foto/video.
8. **Floating CTA WhatsApp.**

- [x] **Step 2: Bangun Halaman B2B di `src/pages/outbound-kemuning/index.astro`**

Struktur landing page (mempertahankan metadata SEO lama, merombak layout & CRO):
1. **Canonical & Meta:** Tetap menggunakan canonical `https://lawuvista.com/outbound-kemuning/` untuk menjaga ranking Google Search.
2. **Hero Korporat:** *"Vendor Outbound & Gathering Kantor #1 di Kemuning: Sukseskan Event Perusahaan Anda Tanpa Ribet!"*.
3. **Institutional Proof Marquee:** Logo Telkom, BRI, SMK Tamansiswa, PKK, dll di posisi atas.
4. **Core B2B Offer:** Paket One Day Outbound (Rp180.000/pax) & Corporate Retreat 2D1N Villa (Rp450.000/pax).
5. **Fasilitas Transit & Legalitas:** Highlight venue private resto, aula sound system, faktur/kuitansi resmi, dan trainer berlisensi.
6. **Lead Magnet CTA:** *"Download Proposal Gathering & Rundown Acara (PDF via WhatsApp)"*.
7. **FAQ Keperluan HRD:** Kapasitas maksimal (500+ pax), opsi custom rundown, menu prasmanan.

- [x] **Step 3: Uji Build & Validasi Render 2 Halaman Landing Page**

Jalankan build test dan cek integritas HTML yang dihasilkan:
```bash
npm run build
```
Pastikan file `dist/jeep-adventure-kemuning/index.html` dan `dist/outbound-kemuning/index.html` ter-generate sempurna.

---

### Task 6: Migrasi Halaman Utama (Homepage) & Service Pages Lainnya

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/river-tubing-kemuning/index.astro`
- Create: `src/pages/villa-kemuning/index.astro`
- Create: `src/pages/privacy-policy/index.astro`
- Create: `src/pages/syarat-ketentuan/index.astro`
- Create: `src/pages/404.astro`
- Modify: Bersihkan / arsipkan file-file HTML lama (`index.html`, `cache-bust.py`, dll).
- Test: `tests/routes.test.mjs`

**Interfaces:**
- Consumes: Komponen layout global (`Navbar.astro`, `Footer.astro`), `packages.json`.
- Produces: Seluruh rute website aktif di bawah arsitektur Astro, mempertahankan SEO rank, struktur URL yang sama (*zero broken links*).

- [x] **Step 1: Migrasi Beranda Utama `src/pages/index.astro`**

Gantikan beranda statis lama dengan template Astro yang modular. Komponen Navbar, Hero, Grid Layanan, Testimoni, FAQ, dan Footer dipanggil secara bersih:
```astro
---
import Layout from '@/layouts/Layout.astro';
import Navbar from '@/components/layout/Navbar.astro';
import Footer from '@/components/layout/Footer.astro';
import BundleCard from '@/components/cro/BundleCard.astro';
import WhatsAppCTA from '@/components/cro/WhatsAppCTA.astro';
import packagesData from '@/data/packages.json';
---

<Layout
  title="Wisata Kemuning Karanganyar – Jeep, Tubing & Outbound | Lawu Vista"
  description="Paket wisata & gathering Kemuning terlengkap. Jeep Adventure, River Tubing, Outbound & Villa. Booking WhatsApp, respon cepat!"
>
  <Navbar />
  <main>
    <!-- Hero Section -->
    <!-- Showcase Paket Bundling Terlaris -->
    <!-- Grid Layanan Utama -->
    <!-- Testimoni & Marquee Instansi -->
    <!-- FAQ & CTA Penutup -->
  </main>
  <Footer />
  <WhatsAppCTA variant="floating" />
</Layout>
```

- [x] **Step 2: Migrasi 4 Halaman Layanan Spesifik**
- `/jeep-adventure-kemuning/index.astro`
- `/river-tubing-kemuning/index.astro`
- `/outbound-kemuning/index.astro`
- `/villa-kemuning/index.astro`

Setiap halaman me-looping data spesifik dari `src/data/packages.json`. Tidak ada lagi CSS inline ribuan baris.

- [x] **Step 3: Migrasi Halaman Kebijakan Privasi, Syarat Ketentuan & 404**

Pastikan rute legalitas dan halaman 404 modern terpasang.

- [x] **Step 4: Pembersihan Kode Warisan (Legacy Cleanup)**

Hapus ketergantungan pada `cache-bust.py` karena Astro otomatis menangani hashing aset di proses build (`_astro/asset.hash.ext`).

---

### Task 7: Pengujian, Verifikasi Core Web Vitals, dan Quality Assurance

**Files:**
- Create: `tests/e2e-simulation.test.mjs`
- Test: Lighthouse CLI / PageSpeed test

**Interfaces:**
- Verifies: Seluruh alur fungsional, performa kecepatan, validasi offline conversion tracking, dan kesiapan kampanye Google Ads.

- [x] **Step 1: Pengujian End-to-End Alur WhatsApp & Ref ID**

Simulasikan kunjungan pengguna dari iklan:
1. Buka URL: `http://localhost:4321/jeep-adventure-kemuning/?gclid=TEST_GCLID_123&utm_campaign=B2C_Jeep_Promo`.
2. Klik tombol CTA: "Ambil Penawaran Ini".
3. Verifikasi:
   - Request `POST /api/track-lead` terkirim dengan status 200.
   - Payload memuat `ref_id: LV-XXXX` dan `gclid: TEST_GCLID_123`.
   - URL WhatsApp terbuka dengan teks memuat `[Ref: LV-XXXX]`.

- [x] **Step 2: Audit Performa Core Web Vitals (Mobile)**

Jalankan audit kecepatan dengan kriteria ketat:
- **LCP (Largest Contentful Paint):** < 1.8 detik di mobile.
- **CLS (Cumulative Layout Shift):** < 0.05.
- **INP (Interaction to Next Paint):** < 100 ms.
- **Skor Total Lighthouse Performance:** > 95/100.

- [x] **Step 3: Verifikasi Responsivitas & Tampilan Lintas Perangkat**

Periksa visual di resolusi:
- Mobile Small: 360px & 390px (iPhone / Samsung).
- Tablet: 768px (iPad).
- Desktop: 1280px+.
Pastikan tidak ada horizontal scroll, tombol CTA nyaman dijangkau jempol (min tinggi 48px), dan kontras teks memenuhi standar aksesibilitas WCAG AA.

- [x] **Step 4: Laporan Kesiapan Akhir & Serah Terima ke User**

Sajikan ringkasan hasil pengujian dan panduan operasional Google Ads Offline Conversion kepada User dan Orchestrator.

---

## EXECUTION HANDOFF & REKOMENDASI

Plan complete and saved to `docs/superpowers/plans/2026-10-10-migrasi-astro-tailwind-lawuvista.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**Untuk rencana ini direkomendasikan pendekatan Native (dengan approval per task)**, karena struktur direktori saat ini masih berupa static HTML dan seluruh komponen saling berkaitan langsung dengan data `packages.json` serta integrasi Vercel Serverless.

Silakan review rencana di atas. Apakah rencana ini sudah sesuai dengan visi dan arahan strategis Anda sebelum kita memulai langkah eksekusi Task 1?
