/**
 * ============================================================================
 * EKA BUSINESS MANAGEMENT PLATFORM (BSI) - GOOGLE SHEETS SYNC SCRIPT
 * ============================================================================
 * Pasang skrip ini di Google Sheets database BSI Anda:
 * 1. Di Google Sheets, buka menu: Extensions (Ekstensi) -> Apps Script
 * 2. Hapus isi file Code.gs bawaan (atau buat file baru bernama SyncToWeb.gs)
 * 3. Salin seluruh isi skrip ini dan simpan (Ctrl + S).
 * 4. Refresh Google Spreadsheet Anda, menu "🚀 EKA Management" akan muncul di toolbar atas!
 */

// Ganti URL ini dengan URL domain API Anda setelah hosting online (misal: Railway / Cloudflare)
const EKA_API_URL = "https://domain-hosting-anda.com/api/v1/webhook/ingest-bsi"; 
const SYNC_SECRET = "eka_sync_secret_prod_2026_x99";

/**
 * Membuat Menu Otomatis di Google Sheets saat dokumen dibuka
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 EKA Management")
    .addItem("📤 Kirim Data ke Web Platform", "syncBsiDataToWeb")
    .addSeparator()
    .addItem("ℹ️ Periksa Status Koneksi Web", "checkWebConnection")
    .addToUi();
}

/**
 * Mengirimkan data dari Tab '04_AREA_PERFORMANCE' ke Database Web
 */
function syncBsiDataToWeb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("04_AREA_PERFORMANCE");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      "Tab Tidak Ditemukan!",
      "Tab '04_AREA_PERFORMANCE' tidak ditemukan di dokumen ini.\nPastikan nama tab sudah sesuai.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert("Data Kosong", "Tab '04_AREA_PERFORMANCE' belum berisi baris data.", SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  ss.toast("Sedang memproses dan mengirim " + (data.length - 1) + " baris data ke web...", "EKA Web Sync", 10);

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { 
      "x-sync-secret": SYNC_SECRET 
    },
    payload: JSON.stringify({ 
      sourceName: "04_AREA_PERFORMANCE", 
      values: data 
    }),
    muteHttpExceptions: true
  };

  try {
    const startTime = new Date().getTime();
    const response = UrlFetchApp.fetch(EKA_API_URL, options);
    const duration = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    const code = response.getResponseCode();
    let result = {};

    try {
      result = JSON.parse(response.getContentText());
    } catch (e) {
      result = { error: response.getContentText() };
    }

    if (code === 200 && result.status === "ok") {
      const messages = (result.data && result.data.messages) ? result.data.messages.join("\n") : "Data berhasil diperbarui.";
      SpreadsheetApp.getUi().alert(
        "✅ Sinkronisasi Berhasil!",
        "Data performa BSI sukses diterbitkan ke Database Web dalam " + duration + " detik!\n\n" +
        "Ringkasan:\n" +
        "• Baris data dibaca: " + (result.data ? result.data.recordsRead : (data.length - 1)) + "\n" +
        messages + "\n\n" +
        "Silakan buka web atau presentasi 16:9, status data sekarang: BSI · DATA AKTUAL",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else if (code === 401) {
      SpreadsheetApp.getUi().alert(
        "❌ Akses Ditolak (401)",
        "Kunci rahasia (SYNC_SECRET) tidak cocok dengan server web.\nPastikan SYNC_SECRET di Apps Script sama dengan di server.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "⚠️ Gagal Memproses Data (" + code + ")",
        "Server merespons:\n" + (result.error || response.getContentText()),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      "🔴 Gagal Koneksi ke Server",
      "Tidak dapat menghubungi server:\n" + EKA_API_URL + "\n\n" +
      "Penyebab: " + err.toString() + "\n\n" +
      "Tips: Pastikan URL server web sudah di-hosting online dan dapat diakses publik.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Fungsi uji coba koneksi sederhana
 */
function checkWebConnection() {
  SpreadsheetApp.getUi().alert(
    "Target Webhook Saat Ini",
    "URL Webhook: " + EKA_API_URL + "\n" +
    "Token Terpasang: " + SYNC_SECRET.slice(0, 8) + "...\n\n" +
    "Untuk mengubah domain, ganti variabel EKA_API_URL di baris 13 skrip ini.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
