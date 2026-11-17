# Panduan Tombol Sinkronisasi Google Apps Script ke Platform Web EKA

Dokumen ini menjelaskan cara memasang tombol di spreadsheet utama ("wadah") yang secara otomatis mengirimkan data snapshot dari tab `04_AREA_PERFORMANCE` ke database Supabase melalui API Webhook.

---

## 1. Kode Google Apps Script (`Code.gs`)

Buka Spreadsheet Anda, lalu klik menu **Extensions (Ekstensi)** > **Apps Script**, kemudian tempelkan (copy-paste) skrip berikut:

```javascript
/**
 * EKA BUSINESS MANAGEMENT - SINKRONISASI OTOMATIS KE WEB
 * Fungsi ini membaca data dari tab '04_AREA_PERFORMANCE' dan
 * mengirimkannya ke Webhook API untuk disimpan ke Supabase PostgreSQL.
 */

// Ganti URL ini dengan URL Web API Anda setelah dihosting (atau URL ngrok/tunnel saat pengujian lokal)
const EKA_API_URL = "https://your-api-domain.com/api/v1/webhook/ingest-bsi";

// Sesuaikan dengan SYNC_SECRET di file .env Anda
const SYNC_SECRET = "eka_sync_secret_prod_2026_x99";

function syncBsiDataToWeb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("04_AREA_PERFORMANCE");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      "Peringatan", 
      "Tab '04_AREA_PERFORMANCE' tidak ditemukan di spreadsheet ini!", 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // Ambil semua data beserta header
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert(
      "Informasi", 
      "Data masih kosong atau hanya berisi baris header.", 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // Tampilkan notifikasi toast sedang memproses
  ss.toast("Sedang mengirim " + (data.length - 1) + " baris data ke database...", "Sinkronisasi Web", 5);

  const payload = {
    sourceName: "04_AREA_PERFORMANCE",
    values: data
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-sync-secret": SYNC_SECRET
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(EKA_API_URL, options);
    const code = response.getResponseCode();
    const resultText = response.getContentText();
    const result = JSON.parse(resultText);

    if (code === 200 && result.status === "ok") {
      const info = result.data;
      let msg = "Sinkronisasi Berhasil!\n\n" +
                "Status: " + info.status + "\n" +
                "Baris Diproses: " + info.recordsRead + "\n" +
                "Versi Snapshot Baru: " + info.versionsPublished + "\n\n" +
                info.messages.join("\n");
      
      SpreadsheetApp.getUi().alert("Sukses", msg, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert(
        "Gagal Sinkronisasi", 
        "Server menolak data (Kode " + code + "):\n" + (result.error || resultText), 
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      "Koneksi Gagal", 
      "Gagal menghubungi server web:\n" + err.toString(), 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
```

---

## 2. Cara Menghubungkan ke Tombol di Spreadsheet

1. Kembali ke Spreadsheet Anda.
2. Klik menu **Insert (Sisipkan)** > **Drawing (Gambar)**.
3. Buat bentuk kotak / tombol (misal beri warna hijau atau biru, tulis teks: `Sinkronkan ke Web`).
4. Klik **Save and Close (Simpan dan Tutup)**.
5. Klik tanda titik tiga di sudut kanan atas tombol tersebut > pilih **Assign script (Tetapkan skrip)**.
6. Ketikkan nama fungsinya: `syncBsiDataToWeb`.
7. Klik **OK**.
8. Selesai! Saat tombol ditekan, skrip akan langsung membaca tab `04_AREA_PERFORMANCE` dan menyimpannya secara otomatis ke database.
