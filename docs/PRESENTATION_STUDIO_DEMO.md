# Presentation Studio v0.4 — Alur Demo, Batas, dan Checklist UAT

## Cara membuka

1. Jalankan `npm install` dan `npm run dev:web` dari root workspace.
2. Klik **Lihat Dashboard Demo**; di halaman **Kinerja Bisnis**, atur periode, produk, dan Regional.
3. Klik menu **Story Editor** di sidebar: pilih slide dan ubah Headline, Penjelasan, Pesan Lanjutan; matikan/tampilkan beberapa slide; klik **Simpan Draft Lokal**.
4. Klik **Preview Slide**: pastikan hanya slide yang aktif muncul, narasi terbaru terbaca, lalu klik kartu untuk mode presentasi.
5. Gunakan `←`/`→` dan `Esc`; lihat respons tombol maju/mundur di batas awal/akhir.
6. Kembali, coba **Cetak / PDF** (pilih Save as PDF), periksa orientasi 16:9 dan margin di browser masing-masing.
7. Kembali ke **Kinerja Bisnis** ganti produk/Regional/periode; pastikan draft terpisah. Kembalikan filter awal; draft yang tersimpan harus dimuat lagi.

## Pemetaan ID slide legacy

- `cover`, `executive-summary`, `overview-reguler`, `overview-mitraguna`, `resources-pipeline-closed`, `ranking-wilayah`, `pipeline-analysis-reguler`, `pipeline-current-reguler`, `pipeline-analysis-mitraguna`, `pipeline-current-mitraguna`, `recommendation`, `langkah`.
- Bila hanya satu produk dipilih, slide khusus produk lain dihilangkan.
- Tidak semua slide V5.4 dibangun pada demo. Slide pipeline-detail dan Action Plan RH detail ditunda sampai API yang benar tersedia.

## Batas penting

- Semua angka contoh, **bukan** angka snapshot atau target resmi.
- Editor menyimpan ke browser `localStorage` per filter. Tidak ada `publishPresentation`/versioning, otorisasi, audit, atau akun RH di demo.
- Tombol cetak memanggil dialog print browser; hasil PDF lintas browser belum diuji otomatis.
- Presenter tidak memuat data nyata HOT, Incoming, Carry Over, Batal Cair, Action Plan. Ketiadaan tersebut ditampilkan secara terbuka, tidak diberi angka palsu.
- Seluruh halaman baru hanya dapat diakses pada mode pengembangan lokal, tidak dipakai sebagai pintu masuk ke data produksi.

## Kriteria berikutnya (production parity)

1. Bangun `story_drafts`, `presentation_versions`, `presentation_slides` dengan `partner`, `period`, `product`, scope area/RH/RO, pemilik, revisi, audit.
2. Buat API untuk draft/publish dengan policy berbasis identitas pengguna, scope, dan hak aksi.
3. Pindahkan semua slide BSI dan Mantap sesuai source code legacy yang disetujui; tidak boleh mencampur fakta, simulasi, dan estimasi.
4. Deck published harus menyimpan snapshot tak bisa berubah dan dapat dipanggil ulang hanya oleh pihak berizin.
5. Verifikasi parity isi bisnis, responsive display, print/PDF, rollback publikasi, dan penanganan data tidak tersedia.
