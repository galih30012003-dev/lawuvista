/**
 * ==============================================================================
 * LAWU VISTA — GOOGLE APPS SCRIPT LEAD RECEIVER & GOOGLE ADS OFFLINE CONVERSION
 * ==============================================================================
 *
 * PANDUAN AKTIVASI WEBHOOK (HANYA 1 MENIT):
 * SPREADSHEET AKTIF:
 * URL: https://docs.google.com/spreadsheets/d/1FG3OUhrqPazRHrjv9UwK20qd0ZyT5QimfBGJgDD4UYY/edit
 * ID:  1FG3OUhrqPazRHrjv9UwK20qd0ZyT5QimfBGJgDD4UYY
 *
 * 1. Buka spreadsheet aktif di link atas
 * 2. Klik menu: Extensions (Ekstensi) > Apps Script
 * 3. Hapus semua kode default, paste seluruh kode di file ini, lalu tekan Save (Ctrl+S).
 * 4. Klik tombol "Deploy" (Terapkan) di pojok kanan atas > "New deployment" (Penerapan baru).
 * 5. Pilih tipe: "Web app" (Aplikasi Web).
 * 6. Konfigurasi:
 *    - Description: "Lead Receiver v2"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)  <-- WAJIB PILIH INI AGAR WEBHOOK BISA MENERIMA DATA
 * 7. Klik Deploy > Berikan izin akun Google Anda.
 * 8. Salin "Web app URL" (format: https://script.google.com/macros/s/AKfycb.../exec)
 * 9. Tempelkan URL tersebut ke file `src/config/tracker.ts` pada variabel `WEBHOOK_URL`.
 *
 * CARA KERJA:
 * - Setiap ada pengunjung website mengklik tombol WhatsApp, data GCLID + Ref ID otomatis
 *   masuk ke baris baru di Google Sheet ini secara real-time.
 * - Saat customer mentransfer DP ke rekening Lawu Vista, CS/Admin cukup:
 *   1. Mencari kode [Ref: LV-XXXX] yang dikirim customer di WhatsApp.
 *   2. Mengubah kolom "Status" menjadi "DEAL_PAID" dan mengisi nominal di kolom "Deal Value (Rp)".
 * - Buka menu khusus di Google Sheet: "🎯 Lawu Vista Ads" > "Export CSV Konversi Offline Google Ads"
 *   untuk mengunduh file CSV yang langsung siap di-upload ke dashboard ads.google.com!
 */

// 1. SETUP HEADER SAAT SPREADSHEET PERTAMA KALI DIBUKA
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 Lawu Vista Ads')
    .addItem('Setup Header Sheet Otomatis', 'setupSheetHeaders')
    .addItem('Export CSV Konversi Offline Google Ads', 'generateGoogleAdsUploadCSV')
    .addToUi();
}

function setupSheetHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
    'Timestamp',
    'Ref ID',
    'GCLID (Google Click ID)',
    'Paket Dipilih',
    'Sumber (UTM Source)',
    'Kampanye (UTM Campaign)',
    'Keyword (UTM Term)',
    'Landing Page',
    'Status Lead',
    'Deal Value (Rp)',
    'Waktu Bayar / Closing'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1f2937')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('✅ Header sheet berhasil disiapkan!');
}

// 2. ENDPOINT WEBHOOK PENERIMA LEAD (DIPANGGIL OTOMATIS OLEH WEBSITE)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Pastikan baris pertama sudah ada header
    if (sheet.getLastRow() === 0) {
      setupSheetHeaders();
    }

    var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    var formattedTime = Utilities.formatDate(timestamp, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

    // Tambahkan baris baru
    sheet.appendRow([
      formattedTime,
      data.ref_id || '',
      data.gclid || '',
      data.package_id || 'general',
      data.utm_source || 'direct',
      data.utm_campaign || '',
      data.utm_term || '',
      data.landing_page || '/',
      'LEAD_BARU', // Status awal: LEAD_BARU, ubah ke DEAL_PAID saat transfer
      '',          // Kolom Deal Value (diisi saat deal)
      ''           // Kolom Waktu Closing
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', ref_id: data.ref_id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. EXPORT CSV GOOGLE ADS OFFLINE CONVERSION
function generateGoogleAdsUploadCSV() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert('Belum ada data leads.');
    return;
  }

  // Format standar Google Ads Offline Conversion:
  // Google Click ID, Conversion Name, Conversion Time, Conversion Value, Conversion Currency
  var csvRows = [
    ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency']
  ];

  var paidCount = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var gclid = row[2];
    var status = row[8];
    var value = row[9];
    var timestamp = row[0];

    // Hanya export lead yang memiliki GCLID dan statusnya DEAL_PAID
    if (gclid && (status === 'DEAL_PAID' || status === 'booking' || status === 'bayar')) {
      var convTime = Utilities.formatDate(new Date(timestamp), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss z');
      var convValue = value ? Number(value) : 150000;

      csvRows.push([
        gclid,
        'Qualified_Booking_DP',
        convTime,
        convValue,
        'IDR'
      ]);
      paidCount++;
    }
  }

  if (paidCount === 0) {
    SpreadsheetApp.getUi().alert('Belum ada data transaksi yang berstatus DEAL_PAID dengan GCLID terisi.\n\nTips: Ubah kolom Status Lead menjadi DEAL_PAID pada customer yang sudah transfer DP.');
    return;
  }

  var csvContent = csvRows.map(function(r) { return r.join(','); }).join('\n');
  var file = DriveApp.createFile('Google_Ads_Offline_Conversions_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmm') + '.csv', csvContent, MimeType.CSV);

  SpreadsheetApp.getUi().alert('🎉 Berhasil mengekspor ' + paidCount + ' konversi offline!\nFile telah disimpan di Google Drive Anda dengan nama:\n' + file.getName());
}
