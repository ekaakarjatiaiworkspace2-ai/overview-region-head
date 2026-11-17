# Implementasi yang sudah disiapkan (bukan klaim go-live)

## Ada dalam paket v0.1

- [x] Workspace VS Code: frontend React/Vite, backend Fastify, SQL PostgreSQL.
- [x] Schema `app_users`, `user_area_access`, `dataset_versions`, `area_kpi`, `mantap_area_kpi`, `source_sync_runs`.
- [x] Worker BSI untuk membaca `04_AREA_PERFORMANCE` melalui Google Sheets API dan menyimpan versi data.
- [x] Header validation, normalisasi period, preservasi null, pencegahan duplikasi per versi, hold bila volume turun drastis.
- [x] Unit test utilitas periode/angka dan salinan `summarizeAreas_` V5.4 (5 test lulus di lingkungan pembuatan).
- [x] API `/health`, `/api/v1/me`, `/api/v1/periods`, `/api/v1/overview`, `/api/v1/sync-runs`.
- [x] Login Supabase Auth frontend dan dashboard BSI awal (ringkasan & ranking Area).
- [x] Guard scope server untuk peran ADMIN / NATIONAL / REGIONAL / RH pada endpoint kinerja BSI.

## Belum dan tidak diklaim selesai

- [ ] `npm install` dan build end-to-end melalui seluruh dependency (jika belum ada akses registry saat pembuatan).
- [ ] Koneksi ke Supabase nyata dan Google Sheets service account.
- [ ] Verifikasi hasil sinkronisasi BSI dan pencapaian Okt/Sep terhadap snapshot produksi.
- [ ] Mapping otomatis `01_USER_ACCESS`/`01_RO_RH_AREA_SCOPE` ke identitas Supabase.
- [ ] Worker API Mantap, perhitungan & modul Mantap.
- [ ] Seluruh pilar Potensi, Kapasitas, Hambatan, Action Plan, Korearea Profile, **Presentasi produksi** (v0.4 baru demo lokal).
- [ ] Snapshot histori, audit kualitas lintas sumber, dan publikasi batch yang benar-benar atomik.
- [ ] UAT banyak pengguna, permission hardening, audit keamanan, backup, observability, deployment Cloudflare.

Status: **developer starter / vertical slice**, belum aplikasi final dan belum sistem produksi.

## Tambahan pada v0.4 — Presentation Studio (DEMO_ONLY)

- [x] Menu **Story Editor** dan **Preview & Presentasi** pada navigasi DEMO.
- [x] Susunan 9–12 slide sesuai pilihan produk, memakai ID cerita terpilih V5.4 (sebagai referensi, bukan hasil bisnis sesungguhnya).
- [x] Edit headline / penjelasan / pesan lanjutan, show-hide, reset per slide, simpan draft di localStorage untuk filter aktif.
- [x] Live preview 16:9, galeri slide, presentasi layar penuh dengan keyboard (←/→/Esc), dan opsi cetak browser.
- [x] Semua slide diberi watermark penanda **SIMULASI**; data pipeline tahap dan Action Plan ditandai belum tersedia.
- [ ] Persistensi draft produksi, izin akses, database presentation versions, publish/read/export PDF server, kesetaraan template penuh V5.4, Mantap: **belum**.
- [ ] Build Vite dan uji tampilan browser nyata untuk v0.4: **belum diverifikasi di lingkungan pengembangan ini**; npm install gagal selesai karena akses registry.
