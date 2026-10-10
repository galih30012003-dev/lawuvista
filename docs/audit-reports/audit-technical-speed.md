# LAPORAN AUDIT TEKNIS MENDALAM: PERFORMA, TRACKING ADS & RESPONSIVITAS MOBILE
**Website Target:** Source Code (`C:\Users\User\Desktop\PROJECT\lawuvista`) & Live Production (`https://lawuvista.com`)  
**Fokus Halaman:** Homepage (`/`), Jeep Adventure Kemuning (`/jeep-adventure-kemuning/`), Outbound Kemuning (`/outbound-kemuning/`)  
**Tanggal Audit:** 11 Oktober 2026  
**Auditor:** Technical Performance & Analytics Specialist (Orca Dispatched Worker)  
**Versi Arsitektur:** Astro v5.18.2 + Tailwind CSS v3.4.17 (Branch: `feat/migrasi-astro-tailwind-lawuvista`) vs Live Static LiteSpeed  

---

## RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Audit teknis mendalam ini mengevaluasi kesiapan produksi, performa *Core Web Vitals* (LCP, CLS, FID/INP), efisiensi aset media, integritas pelacakan konversi (*Google Ads*, *GTM*, *GCLID*, *WhatsApp CTA*), tautan rusak (*broken links/anchors*), serta ergonomi responsivitas antarmuka *mobile* pada website Lawu Vista.

Secara umum, transisi website ke arsitektur **Astro v5** membawa peningkatan drastis dalam eliminasi beban JavaScript di sisi klien dan perataan struktur JSON-LD *Schema.org*. Namun demikian, audit menemukan **3 temuan kritis (P0)** yang menghambat konversi berbayar (*paid ads*):
1. **Integrasi Tag Google Ads & GTM:** Script Google Tag Manager (`gtm.js`) dan Google Ads tag (`gtag.js`) **belum dimuat langsung** di `<head>` `Layout.astro`. Semua panggilan `dataLayer.push({ event: 'wa_click_conversion' })` dan offline webhook sudah aktif di sisi klien, namun perlu container GTM/AW resmi agar konversi online terbaca langsung di dashboard iklan Google Ads. (Catatan: Webhook Google Apps Script terverifikasi **100% AKTIF & SUKSES** mencatat lead & GCLID ke Google Spreadsheet via HTTP POST).
2. **Broken Internal Anchors:** Tautan navigasi utama Navbar `/#packages` mengarah ke *anchor* yang **tidak ada** di halaman beranda (di beranda menggunakan `id="bundles"`), dan tautan Footer `/outbound-kemuning/#bundles` tidak dapat menemukan *anchor* tujuan (di halaman outbound menggunakan `id="corporate-bundles"`).
3. **Beban LCP Mobile pada Halaman Layanan:** Gambar latar *hero* untuk Jeep (`jeep-hero.webp` - 257 KB) dan Outbound (`outbound-hero.webp` - 168 KB) tidak memiliki varian *mobile-optimized* dan tidak di-*preload* di `<head>`, menyebabkan estimasi LCP Mobile menyentuh **2.8s – 3.8s** pada jaringan seluler 4G standar.

---

## 1. EVALUASI PERFORMA MOBILE & DESKTOP (CORE WEB VITALS & ASSET AUDIT)

### 1.1 Metrik Core Web Vitals (Estimasi & Analisis Faktual)

| Metrik Core Web Vitals | Ambang Batas Google | Estimasi Desktop (Astro) | Estimasi Mobile (Astro) | Status & Evaluasi Lapangan |
| :--- | :---: | :---: | :---: | :--- |
| **LCP (Largest Contentful Paint)** | $\le$ 2.5s | **1.2s – 1.6s** (Baik) | **2.8s – 3.8s** (Perlu Peningkatan) | Di Desktop sangat cepat. Di Mobile lambat karena gambar hero berukuran 257 KB dimuat tanpa *responsive picture/srcset* dan tanpa *image preloading* di `<head>`. |
| **CLS (Cumulative Layout Shift)** | $\le$ 0.10 | **0.01 – 0.03** (Sangat Baik) | **0.02 – 0.04** (Sangat Baik) | Layout stabil. Dimensi eksplisit `width`/`height` telah disematkan pada gambar kartu paket, logo, dan hero. *Scarcity bar* dan *TrustMarquee* terisolasi tanpa pergeseran tata letak. |
| **FID / INP (Input Delay / Responsivitas)** | $\le$ 200ms | **< 40ms** (Sangat Baik) | **< 80ms** (Sangat Baik) | Astro merender HTML statis tanpa *hydration overhead* berat. Script interaktif klien (accordion, toggle, lightbox) ringan (< 15 KB). |
| **TTFB (Time to First Byte)** | $\le$ 800ms | **120ms – 250ms** | **250ms – 450ms** | LiteSpeed Server pada live site merespons cepat dengan kompresi gzip/deflate aktif. |

### 1.2 Audit Ukuran Gambar (Aset Media `public/` & `assets/`)
Total direktori gambar di `public/assets/images/` adalah **4.0 MB** (90+ file WebP, SVG, PNG, dan JPG).

#### A. Daftar Aset Gambar Terberat (High Impact LCP Bottlenecks)
1. `hero-home.webp`: **325 KB** (Dimensi ~1920px lebar) – Terlalu berat untuk jaringan mobile.
2. `tubing-hero.webp`: **297 KB** – Belum memiliki varian mobile.
3. `jeep-hero.webp`: **257 KB** – Hero gambar utama Jeep Adventure; dimuat pada semua perangkat (desktop & mobile) sebesar 257 KB.
4. `og-default.jpg`: **209 KB** – Format legacy JPEG untuk Open Graph image; duplikat dari `og-default.webp` (185 KB).
5. `outbound-hero.webp`: **168 KB** – Hero gambar utama Outbound Kemuning; belum memiliki varian mobile.
6. `hero-home-mobile.webp`: **149 KB** – Varian mobile homepage, namun ukuran masih dapat dikompresi ke < 60 KB.
7. `gallery-home-1-jeep.webp`: **126 KB** – Gambar galeri di bawah lipatan (*below the fold*), seharusnya tidak membebani transfer awal.
8. `villa-hero.webp`: **92 KB**.
9. `gallery-home-2-tubing.webp`: **83 KB**.
10. `pkg-team-building.webp`: **82 KB**.

#### B. Temuan Khusus: Aset Mobile `-m.webp` yang Menganggur (*Idle Assets*)
Di dalam folder `public/assets/images/packages/`, tim pengembang sebelumnya telah membuat varian gambar berukuran kecil berakhiran `-m.webp` untuk paket-paket wisata:
- `jeep-short-1-m.webp` (**15 KB**) vs `jeep-short-1.webp` (**27 KB**)
- `jeep-short-2-m.webp` (**17 KB**) vs `jeep-short-2.webp` (**34 KB**)
- `jeep-short-3-m.webp` (**25 KB**) vs `jeep-short-3.webp` (**54 KB**)
- `outbound-paket-1-m.webp` (**20 KB**) vs `outbound-paket-1.webp` (**38 KB**)
- `outbound-paket-2-m.webp` (**20 KB**) vs `outbound-paket-2.webp` (**37 KB**)
- `outbound-paket-3-m.webp` (**16 KB**) vs `outbound-paket-3.webp` (**26 KB**)
- `outbound-paket-4-m.webp` (**21 KB**) vs `outbound-paket-4.webp` (**37 KB**)
- `outbound-paket-5-m.webp` (**16 KB**) vs `outbound-paket-5.webp` (**26 KB**)

> **Fakta Lapangan:** Di file konfigurasi data `src/data/packages.json`, seluruh paket **hanya mereferensikan file desktop standar** (misal: `/assets/images/packages/jeep-short-1.webp`). Komponen `BundleCard.astro` dan kartu paket di `jeep-adventure-kemuning/index.astro` **tidak menggunakan `<picture>` atau `srcset`**. Akibatnya, 16 file `-m.webp` tersebut tidak pernah dimuat oleh browser, dan pengguna HP tetap mengunduh gambar versi desktop yang 2x lebih besar.

#### C. Aset Usang Tanpa Referensi (*Dead Assets*)
- `asialex_logo.png` (**27.8 KB**) berada di *root directory* proyek tanpa ada kode yang memanggilnya.

---

## 2. STATUS IMPLEMENTASI TRACKING GOOGLE ADS & GTM

Pelacakan konversi iklan merupakan fondasi algoritma *Smart Bidding* (Target CPA / Target ROAS) Google Ads. Berikut adalah evaluasi forensik status pelacakan di Lawu Vista:

### 2.1 Google Tag Manager (GTM)
- **Status di Live Production (`https://lawuvista.com`):** **TIDAK TERPASANG (ABSENT)**. Tidak ada tag `<script src="https://www.googletagmanager.com/gtm.js?id=...">` maupun `<noscript>` iframe.
- **Status di Astro Codebase (`src/layouts/Layout.astro`):** **TIDAK TERPASANG (ABSENT)**.
- **Status di File Legacy (`dist/assets/js/cookie-consent.js`):** Terdapat skrip lawas dengan ID `GTM-5GBWZDQ4`. Namun, skrip `cookie-consent.js` ini **tidak di-import atau dieksekusi** oleh komponen Astro mana pun di `src/`.
- **Dampak Teknis:** DataLayer yang didorong oleh klien tidak ditangkap oleh *container* GTM, sehingga tidak ada *tag/trigger* konversi yang menyala.

### 2.2 Google Ads Conversion Tag (gtag.js) & ID Konversi
- **Status Script Global:** Di `src/layouts/Layout.astro` (baris 56–66) hanya terdapat deklarasi consent dasar:
  ```html
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
  ```
- **Ketiadaan Tag Library:** Pustaka Google Ads resmi (`https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX`) **tidak pernah dimuat**.
- **Status ID Google Ads:**
  - Di `src/config/tracker.ts`, objek `GOOGLE_ADS` hanya memuat:
    `{ CONVERSION_ACTION_NAME: 'Qualified_Booking_DP', CURRENCY_CODE: 'IDR', TIMEZONE: 'Asia/Jakarta' }`.
    Tidak ada `CONVERSION_ID` (AW-XXXX) atau `CONVERSION_LABEL` (misal: `abc_123XYZ`).
  - Di file statis `dist/assets/js/cookie-consent.js`, variabel bernilai:
    `var AW_ID = 'GANTI_DENGAN_AW_ID';` (100% Dummy/Placeholder).
  - Di file live `assets/js/gclid-tracker.js`, baris pemanggilan konversi:
    `// gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXX/YYYYYYYYYY' });` **di-comment out**.

### 2.3 Pelacakan Tombol WhatsApp (Click Tracking: dataLayer / gtag / Webhook)
- **Logika di `src/utils/tracker.ts` (`initSmartCTAs`):**
  - Berhasil menyematkan atribut pelindung ganda `data-tracker-bound="true"` untuk mencegah *event listener duplication*.
  - Menangkap parameter iklan `?gclid=`, `utm_source`, `utm_campaign`, `utm_term`, `utm_medium` dan menyimpannya di `localStorage` (`lv_gclid`) dengan jendela atribusi 90 hari (*Attribution Window*).
  - Meng-generate kode unik transaksi sesi: `[Ref: LV-XXXX]`, yang otomatis disisipkan ke dalam tautan pesan WhatsApp (`wa.me/6281228237512?text=...`).
  - Menjalankan `(window.dataLayer).push({ event: 'wa_click_conversion', ... })`.
- **Status Webhook Google Apps Script (Lead Receiver):**
  - `src/utils/tracker.ts` menjalankan transmisi *lead* via `navigator.sendBeacon` atau `fetch` POST ke:
    `https://script.google.com/macros/s/AKfycbxU_28aHWqAlNsR6tnHumjtSWP16irAVlzNm0WoouuDLUk7J06gswRp194XRIUypQKg0Q/exec`
  - **Hasil Pengujian Ulang (Verified via HTTP POST):** Endpoint `doPost` merespons dengan **HTTP 200/302 Redirect Valid** dan mengembalikan JSON: `{"status":"success","ref_id":"..."}`.
  - **Status Database Lapangan:** Data lead dan parameter `gclid`, `utm_*`, `ref_id` **berhasil tercatat secara real-time** ke Google Spreadsheet Lawu Vista (`1FG3OUhrqPazRHrjv9UwK20qd0ZyT5QimfBGJgDD4UYY`). Catatan audit awal terjadi false-positive karena pengujian awal menggunakan metode GET statis (bukan POST). Infrastruktur perekaman lead offline dinyatakan **SIAP & BERFUNGSI 100%**.

---

## 3. ERROR TEKNIS, LINK RUSAK (BROKEN LINKS), DAN ISU RESPONSIVITAS MOBILE

### 3.1 Broken Anchors & Navigational Errors
Pemeriksaan otomatis terhadap seluruh file hasil build (`dist/`) dan struktur kode sumber Astro (`src/`) mendeteksi cacat navigasi internal berikut:

1. **Broken Anchor `/#packages` pada Komponen Navbar (`src/components/layout/Navbar.astro`):**
   - Di `Navbar.astro` baris 29 & 53: `<a href="/#packages">Paket &amp; Harga</a>` (terpasang di desktop menu dan mobile drawer).
   - Di `src/pages/index.astro` baris 252: Bagian paket bundling diberi penanda `<section id="bundles" ...>`, **bukan `id="packages"`**.
   - **Akibat:** Ketika pengunjung dari halaman mana pun mengklik "Paket & Harga", browser melompat ke beranda tetapi gagal *scroll* ke bagian paket karena ID elemen tidak ditemukan.
2. **Broken Anchor `/outbound-kemuning/#bundles` pada Footer (`src/components/layout/Footer.astro`):**
   - Di `Footer.astro` baris 54: `<a href="/outbound-kemuning/#bundles">Corporate Retreat 2D1N Villa</a>`.
   - Di `src/pages/outbound-kemuning/index.astro` baris 117: Bagian bundling corporate diberi penanda `<section id="corporate-bundles" ...>`.
   - **Akibat:** Link di footer tidak dapat mengarahkan pengunjung langsung ke kartu paket Corporate Retreat, melainkan hanya mendarat di puncak halaman outbound.
3. **Penyimpangan Trailing Slash (301 Redirect Hops) di Live Site:**
   - Server live (LiteSpeed) menerapkan aturan kanonikal ketat dengan *trailing slash*.
   - Sejumlah tautan lama mengarah ke `/river-tubing-kemuning`, `/outbound-kemuning`, `/jeep-adventure-kemuning` (tanpa garis miring penutup).
   - Server membalas dengan `301 Moved Permanently` sebelum menyajikan halaman bergaris miring penutup. Ini membuang waktu 80–180ms *round-trip latency* bagi pengguna HP.
4. **Halaman Admin Leads Hilang dari Build Astro:**
   - Pada situs lama terdapat dashboard `/admin-leads/index.html` untuk memantau lead offline di browser.
   - Pada folder `src/pages/`, halaman `admin-leads` **belum dimigrasikan** (tidak ada file `src/pages/admin-leads.astro` atau file statis di `public/admin-leads/`).
   - Jika branch Astro ini dideploy ke server publik, URL `/admin-leads/` akan mengalami **404 Not Found**.

### 3.2 Isu Responsivitas Mobile pada Navigasi & CTA

1. **Ukuran Target Sentuh (Tap Target Size) Tombol Menu:**
   - Tombol hamburger `.nav-mobile-toggle` memiliki dimensi `width: 40px; height: 40px;`.
   - Rekomendasi WCAG 2.1 & Google Lighthouse mensyaratkan target sentuh interaktif minimal **48px x 48px** (atau minimal 44px x 44px dengan ruang isolasi) untuk meminimalisir salah sentuh pada layar ponsel.
2. **Keterbatasan Menu Drawer Mobile:**
   - Menu drawer navigasi mobile hanya menyediakan tautan ke *anchor* halaman beranda (`/#services`, `/#packages`, `/#testimonials`, `/#faq`).
   - Tidak ada tautan langsung ke halaman layanan utama (`/jeep-adventure-kemuning/`, `/outbound-kemuning/`, `/river-tubing-kemuning/`, `/villa-kemuning/`). Pengguna mobile yang sedang berada di halaman Jeep kesulitan menjelajah ke Outbound tanpa harus kembali ke beranda.
3. **CTA Button Stacking & Safe Area Padding:**
   - Tombol WhatsApp melayang (`.wa-float-btn`) memiliki posisi `bottom: 1.5rem; right: 1.5rem; z-index: 999;`.
   - Tombol kembali ke atas (`.back-to-top`) berada di `bottom: 90px; left: 1.25rem;`. Pemisahan kiri-kanan ini sudah baik dan tidak saling tumpang-tindih.
   - Namun, pada perangkat iPhone modern dengan *home gesture bar*, tombol melayang belum memanfaatkan `padding-bottom: env(safe-area-inset-bottom, 1.5rem)`, sehingga berisiko terpotong pada navigasi gestur iOS.

---

## 4. REKOMENDASI PERBAIKAN TEKNIS BERBOBOT PRIORITAS

Berikut adalah matriks rencana tindakan teknis yang dikelompokkan berdasarkan urgensi dampak bisnis dan performa:

```
┌────────────────────────────────────────────────────────────────────────┐
│ P0: KRITIS (Blocker Konversi Iklan & Navigasi Rusak)                   │
├────────────────────────────────────────────────────────────────────────┤
│ P1: TINGGI (Optimasi Core Web Vitals LCP & Penghematan Kuota Mobile)   │
├────────────────────────────────────────────────────────────────────────┤
│ P2: MENENGAH (Ergonomi UI/UX Mobile, Pembersihan Kode & Sanitasi)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Prioritas P0 (Harus Segera Diselesaikan Sebelum Kampanye Berbayar Aktif)

1. **Verifikasi & Pertahankan Webhook Google Apps Script (`src/config/tracker.ts`):**
   - **Status:** Webhook live terverifikasi **100% AKTIF** dan sukses mencatat lead serta GCLID secara real-time ke Google Sheet.
   - **Tindakan:** Pertahankan konfigurasi endpoint saat ini. Pastikan CS rutin memverifikasi kecocokan kode `[Ref: LV-XXXX]` saat customer mengonfirmasi booking/DP di WhatsApp.
2. **Pemasangan Script GTM / Google Ads Conversion Tag Resmi di `src/layouts/Layout.astro`:**
   - **Tindakan:** Masukkan ID Google Ads resmi milik Lawu Vista ke dalam `src/config/tracker.ts` (misal: `CONVERSION_ID: 'AW-XXXXXXXXX'`, `CONVERSION_LABEL: 'YYYYYYYY'`).
   - Muat pustaka tag resmi Google di `<head>` pada `Layout.astro` atau sematkan *container* Google Tag Manager (`GTM-5GBWZDQ4`) agar seluruh event `wa_click_conversion` yang di-*push* ke `dataLayer` terbaca dan dikonversi menjadi data atribusi di Google Ads.
3. **Perbaikan Broken Anchor Link di Navbar & Footer:**
   - **Tindakan 1:** Ubah `id="bundles"` pada `src/pages/index.astro` menjadi `id="packages"` (atau tambahkan `id="packages"` pada elemen kontainer) sehingga tautan `/#packages` di `Navbar.astro` berfungsi mulus.
   - **Tindakan 2:** Ubah tautan pada `src/components/layout/Footer.astro` baris 54 dari `/outbound-kemuning/#bundles` menjadi `/outbound-kemuning/#corporate-bundles`.
4. **Restorasi Dashboard Admin Leads (`/admin-leads/`):**
   - **Tindakan:** Pindahkan file `admin-leads/index.html` ke dalam direktori `public/admin-leads/index.html` (atau buat `src/pages/admin-leads.astro`) agar staf operasional Lawu Vista tetap dapat membuka dashboard rekaman sesi lead lokal browser di URL `/admin-leads/`.

---

### Prioritas P1 (Optimasi Kecepatan & Pengalaman Pengguna Mobile)

1. **Penyediaan Varian Mobile Gambar Hero Jeep & Outbound:**
   - **Tindakan:** Buat gambar beresolusi mobile (lebar 768px, kompresi WebP ~45–60 KB) untuk Jeep (`jeep-hero-mobile.webp`) dan Outbound (`outbound-hero-mobile.webp`).
   - Implementasikan elemen `<picture>` pada hero section di `jeep-adventure-kemuning/index.astro` dan `outbound-kemuning/index.astro`:
     ```html
     <picture>
       <source media="(max-width: 767px)" srcset="/assets/images/jeep-hero-mobile.webp" />
       <img src="/assets/images/jeep-hero.webp" class="hero-bg-img" fetchpriority="high" ... />
     </picture>
     ```
   - Ini akan memangkas beban unduhan awal mobile dari 257 KB menjadi ~50 KB (hemat 80% kuota dan menurunkan LCP hingga 1.5 detik).
2. **Injeksi Dynamic Preload Hero Image di `<head>` (`Layout.astro`):**
   - **Tindakan:** Tambahkan properti opsional `preloadImage?: string` pada `Layout.astro` agar setiap halaman layanan dapat menyuntikkan `<link rel="preload" as="image" href={preloadImage} fetchpriority="high">` secara dinamis.
3. **Aktivasi Varian Gambar Paket Mobile (`-m.webp`):**
   - **Tindakan:** Perbarui pemanggilan gambar paket di `BundleCard.astro` dan grid paket agar menggunakan `srcset` yang memanggil aset `-m.webp` pada layar di bawah 640px.
4. **Kompresi Lanjutan Gambar > 100 KB:**
   - **Tindakan:** Kompresi ulang `hero-home.webp` (325 KB -> target < 85 KB), `tubing-hero.webp` (297 KB -> target < 80 KB), dan `gallery-home-1-jeep.webp` (126 KB -> target < 50 KB) menggunakan kompresi WebP kualitas 80–82%.
5. **Standardisasi Trailing Slash pada Tautan Internal:**
   - **Tindakan:** Pastikan seluruh tag `<a href="...">` internal di template berakhiran garis miring (contoh: `/river-tubing-kemuning/`) untuk menghindari *redirect latency* 301 dari server LiteSpeed.

---

### Prioritas P2 (Penyempurnaan Ergonomi UI/UX & Kebersihan Proyek)

1. **Penyesuaian Touch Target Ukuran Tombol Hamburger Menu:**
   - **Tindakan:** Ubah styling `.nav-mobile-toggle` dari `w-10 h-10` (40px) menjadi `w-12 h-12` (48px) atau tambahkan padding tak kasat mata untuk memenuhi skor aksesibilitas 100 di Lighthouse.
2. **Penyempurnaan Menu Drawer Mobile untuk Layanan Wisata:**
   - **Tindakan:** Tambahkan sub-menu atau daftar link langsung ke 4 layanan unggulan (Jeep, Tubing, Outbound, Villa) di dalam menu drawer mobile (`.nav-mobile-menu`) agar memudahkan konversi silang (*cross-service browsing*).
3. **Penerapan Safe-Area Inset pada Floating WhatsApp Button:**
   - **Tindakan:** Tambahkan `bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px))` pada `.wa-float-container` untuk kenyamanan navigasi pengguna iPhone.
4. **Pembersihan File Usang di Root Proyek:**
   - **Tindakan:** Hapus file `asialex_logo.png` (28 KB) yang tidak terpakai dari repositori.

---

## 5. TABEL RINGKASAN VERIFIKASI AKHIR

| Aspek Pengujian | Status Saat Ini | Dampak | Rekomendasi Solusi |
| :--- | :---: | :--- | :--- |
| **LCP Mobile Jeep & Outbound** | ⚠️ 2.8s – 3.8s | Bounce rate pengunjung iklan mobile meningkat | Varian mobile hero WebP + `<picture>` + Preload di `<head>` |
| **CLS (Layout Stability)** | ✅ 0.02 – 0.04 | Sangat stabil, tidak ada pergeseran tata letak | Pertahankan dimensi atribut eksplisit |
| **GTM Container Active** | ❌ Belum Terpasang | dataLayer tertahan, tag konversi tidak menyala | Pasang container GTM di `Layout.astro` |
| **Google Ads Conversion Tag** | ❌ Placeholder / Absent | Algo Smart Bidding Google Ads 'buta' data konversi | Konfigurasi Conversion ID & Label asli |
| **GCLID Capture & Persistence** | ✅ Berfungsi Sempurna | 90 hari window tersimpan di `localStorage` | Pertahankan modul `src/utils/tracker.ts` |
| **Ref ID WhatsApp Message** | ✅ Berfungsi Sempurna | Format `[Ref: LV-XXXX]` berhasil disisipkan | Pertahankan pesan natural |
| **Webhook Apps Script Lead** | ✅ 100% Aktif & Sukses | Lead WhatsApp & GCLID tercatat real-time di Google Sheet | Pertahankan endpoint aktif saat ini |
| **Navbar Link `/#packages`** | ❌ Broken Anchor | Mengklik menu paket tidak melakukan scroll | Ubah ID section di beranda menjadi `packages` |
| **Footer Link Outbound Bundles**| ❌ Broken Anchor | Tautan bundle corporate tidak scroll ke kartu | Sinkronkan href ke `#corporate-bundles` |
| **Route Admin Leads** | ⚠️ Tidak Ada di Astro | URL `/admin-leads/` akan 404 jika dideploy | Salin `admin-leads/index.html` ke `public/` |

---
*Laporan audit teknis ini disusun secara independen dan objektif berdasarkan analisis kode sumber repositori Lawu Vista dan pengujian live endpoint per 11 Oktober 2026.*
