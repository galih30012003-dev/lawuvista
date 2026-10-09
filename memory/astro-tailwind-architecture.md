---
name: astro-tailwind-architecture
description: Arsitektur baru Lawu Vista berbasis Pure Static Astro SSG dan integrasi tracking Google Sheets
metadata:
  type: project
---

Lawu Vista telah dimigrasi dari static HTML multi-folder ke Astro v5 + Tailwind CSS dalam mode Pure Static SSG (tanpa adapter Vercel, host-agnostic).

**Poin-poin arsitektur penting:**
- Seluruh data paket wisata dipusatkan di `src/data/packages.json` sebagai Single Source of Truth.
- URL kanonikal lama dipertahankan untuk SEO: B2C di `/jeep-adventure-kemuning/` dan B2B di `/outbound-kemuning/`.
- Tracking offline conversion menggunakan Google Spreadsheet yang terhubung langsung via Webhook: `https://docs.google.com/spreadsheets/d/1FG3OUhrqPazRHrjv9UwK20qd0ZyT5QimfBGJgDD4UYY/edit`.
- Tombol WhatsApp menyisipkan kode referensi `[Ref: LV-XXXX]` dan background beacon mengirim data lead ke Google Sheet.
- CSS desain asli tersimpan di `src/styles/legacy-main.css` dan `src/styles/legacy-service.css`, digabungkan di `src/styles/global.css`.
