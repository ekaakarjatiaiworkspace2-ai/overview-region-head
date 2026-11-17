# Development Log — EKA Management Overview

## Baseline
- 2026-11-16: Starter v0.2 Demo disiapkan. Belum production-ready, Supabase dan Google Sheets API belum dikonfigurasi.
- Aturan bisnis V5.4 dianggap approved. Jangan ulang audit fundamental.
- Prioritas: stabilisasi starter, validasi build/test, implementasi sumber BSI via read-only sync.

## Catatan Sesi Berikutnya
Antigravity: isi di bawah ini setiap kali selesai bekerja, sertakan file berubah, tes, blocker, dan langkah selanjutnya.

## 2026-11-16 — Koreksi scope full platform (documentation handover)
- V5.4 legacy dipetakan sebagai full platform: akses, seluruh pilar, ranking/drilldown, action plan, proyeksi, story, presentasi, admin validation, Mantap, dan Korea Profile sebagai ekspansi.
- `PLATFORM_BLUEPRINT_V1.md`, `FEATURE_PARITY_MATRIX.md`, `MIGRATION_EXECUTION_PLAN.md`, `LEGACY_REFERENCE_GUIDE.md` ditambahkan.
- Referensi source Code.gs (credential/hash disamarkan) dan Index.html ditempatkan `legacy/private`, tidak boleh di-deploy/commit.
- **Status implementasi tidak berubah**: starter v0.2 masih belum menyelesaikan 28 fitur; dokumen ini adalah briefing, bukan implementasi modul.
- Next: jalankan M0/M1 dan implementasi satu fitur end-to-end dengan tes parity.

## 2026-11-16 — v0.4 Presentation Studio Demo

**Lingkup:** membuktikan alur Story Editor & Preview/Presentation pada frontend lokal. Tidak mengubah logika bisnis approved dan tidak menulis sumber Sheets.

Perubahan:
- `apps/web/src/PresentationStudio.tsx`: editor slide, visibilitas, narasi, draft lokal, live preview, gallery, fullscreen controls, print browser.
- `apps/web/src/presentation-model.ts`: konfigurasi slide ID legacy terpilih, data simulasi berdasarkan preview filter BSI.
- `apps/web/src/presentation.css`: desain presentasi 16:9, desktop/mobile, print.
- `apps/web/src/App.tsx`: navigasi Presentation Tools hanya saat demo lokal; bukan role production.
- `apps/api/test/presentation-demo-contract.test.mjs`: tes generator slide, filter, edit, storage isolation, sintaks TSX.

**Belum:** proses `npm install` terhambat koneksi ke npm registry di lingkungan penyusunan. Jangan menandai build/browsing E2E passed. Harus jalankan `npm install`, `npm test`, `npm run build` di mesin developer; buka halaman dan cek print/PDF. Fungsi `publishPresentation`, `getStoryDraft`, `saveStoryDraft` database produksi serta Mantap masih M7 dalam roadmap.

**Checkpoint:** lihat `docs/PRESENTATION_STUDIO_DEMO.md` untuk alur uji visual. Setelah UAT lokal, kontrakkan model presentation/story ke backend dan database dengan kontrol scope.

## 2026-11-16 — Full Platform Audit, Cloud Hosting Fixes & Period Engine (M0 Stabilization -> M1 Foundation)

**Lingkup:** Audit menyeluruh terhadap seluruh arsitektur, kode, legacy reference V5.4, dan integrasi paket v0.4 Presentation Studio. Perbaikan blocker hosting (Fastify host bind, SSL PostgreSQL pooler, preview environment toggle), serta formalisasi kontrak periode (`review_period` vs `business_period`).

**Perubahan Kode:**
- `EKA_ANTIGRAVITY_ONE_MASTER_PROMPT.md`: Disimpan di root workspace sebagai dokumen mandat permanen seluruh sesi Antigravity.
- `apps/api/src/config.ts`: Ditambahkan konfigurasi `host: process.env.HOST || '0.0.0.0'` dan deteksi otomatis SSL PostgreSQL (`databaseSsl`).
- `apps/api/src/index.ts`: Binding diubah dari hardcoded `127.0.0.1` ke `cfg.host` (menghilangkan blocker container/PaaS 502 Bad Gateway).
- `apps/api/src/db.ts`: Ditambahkan dukungan SSL kondisional (`{ rejectUnauthorized: false }`) untuk koneksi ke database cloud (Supabase/Neon/AWS RDS).
- `apps/web/src/App.tsx`: Diaktifkan dukungan `VITE_ENABLE_PREVIEW=true` agar mode demo dapat di-showcase pada deployment preview/staging.
- `apps/api/src/lib/approved-core.mjs` & `approved-core.d.mts`: Diimplementasikan fungsi `shiftPeriod(period, offset)` dan `resolvePeriodContext(period, isReviewPeriod)` untuk menjembatani periode review rapat legacy (e.g. `2026-11`) dengan snapshot data closed month (e.g. `2026-10`).
- `apps/api/test/approved-core.test.mjs`: Ditambahkan unit test untuk pergeseran periode dan resolusi review vs business period.

**Hasil Pengujian:**
- `npm test`: 11/11 tests PASS (termasuk 5 core V5.4 unit tests, 5 presentation contract tests, dan 1 period shift test).
- `npm run build`: Berhasil 100% (`@eka/api` via tsc dan `@eka/web` via tsc + vite build tanpa error).

**Status & Next Steps:**
- Status F01, F02, F15, F16 pada matrix telah diverifikasi faktual.
- Next: Menyiapkan model data & endpoint untuk Pilar 1 (Bisnis yang Berjalan - historical trend, MoM growth, dan pipeline status).

## 2026-11-16 — Automated Ingestion Webhook & Local File Sync Engine

**Lingkup:** Menyediakan pipeline otomatisasi data dari Google Sheets Apps Script langsung ke Database PostgreSQL tanpa bergantung pada Google Cloud Console / Service Account (Rp0, zero maintenance untuk non-technical owner).

**Perubahan Kode:**
- `apps/api/src/services/bsi-ingest.ts`: Layanan terpusat `processBsiValues()` yang mengekstrak logika ingest BSI: validasi header V5.4, parsing numerik IDR, hashing SHA-256 versi dataset, advisory lock, deteksi duplikasi, dan safety hold baris anjlok > 20%.
- `apps/api/src/index.ts`: Endpoint baru `POST /api/v1/webhook/ingest-bsi` dilindungi `x-sync-secret` untuk menerima push data langsung dari Google Apps Script Spreadsheet.
- `apps/api/src/config.ts`: Konfigurasi `syncSecret` (`SYNC_SECRET` env var).
- `apps/api/src/run-sync.ts`: Diperbarui untuk mendukung mode Google API (`npm run sync:bsi`) dan mode file lokal offline (`npm run sync:file <path>`).
- `apps/api/test/webhook-ingest.test.mjs`: Unit test kontrak webhook.

**Hasil Pengujian:**
- `npm test`: 12/12 tests PASS.
- `npm run build`: PASS (Vite dist + Fastify dist).


## Sesi 4 - Ingest Data Riil BSI 04_AREA_PERFORMANCE & Supabase Verification (2026-11-16)
- **Sumber Data:** File CSV `04_AREA_PERFORMANCE.csv` disediakan langsung oleh User, mencakup 3 periode riil: `2026-08` (135 baris), `2026-09` (146 baris), `2026-10` (138 baris).
- **Ingestion Execution:**
  - File disalin ke `data/04_AREA_PERFORMANCE.csv`.
  - Sinkronisasi dieksekusi via `npm run sync:file data/04_AREA_PERFORMANCE.csv` ke Supabase Singapore.
  - Hasil ingest: 419 baris dibaca, 3 versi snapshot dipublikasikan (`dataset_versions`), status `SUCCESS`.
- **Akun Administratif Dibuat:**
  - Email: `admin@eka.co.id`
  - Auth UID: `17b15330-2b8b-490b-8224-06c6bea46c6e` (auto-confirmed)
  - Role: `ADMIN` di `app_users` (unrestricted national access).
- **Verifikasi Query & Formula V5.4:**
  - Periode aktif: `['2026-10', '2026-09', '2026-08']`.
  - Agregasi 2026-10 ALL: Total Target Rp 1.198 T, Total Pencairan Rp 404 M (33.72%), SF Aktif 977, 46 Area.
  - Seluruh formula V5.4 lulus tanpa eror.
- **Apps Script Guide:** Dibuat `docs/APPS_SCRIPT_SYNC_BUTTON.md` untuk panduan tombol di Google Sheets.
- **Pengujian:** `npm test` 12/12 pass, `npm run build` cleanly pass.
