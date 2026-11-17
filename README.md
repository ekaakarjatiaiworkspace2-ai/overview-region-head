> **Penting untuk Antigravity:** Ini adalah **starter v0.4 (dashboard + editor/presentasi demo lokal) + referensi source legacy + dokumen full-platform**. Bukan web lengkap. Baca `AGENTS.md`, `docs/PLATFORM_BLUEPRINT_V1.md`, `docs/FEATURE_PARITY_MATRIX.md`, `docs/MIGRATION_EXECUTION_PLAN.md`. Source legacy read-only ada di `legacy/private/` dan ter-ignore oleh Git.

# EKA Management Overview — Developer Starter v0.4 — Dashboard + Presentation Studio Demo (Free-First)

Fondasi migrasi dari Google Apps Script **EKA RH Business Overview V5.4** menjadi web + PostgreSQL. Aturan bisnis V5.4 dipertahankan; data snapshot `04_AREA_PERFORMANCE` menjadi baseline untuk BSI.

> **STATUS: starter proyek, belum live dan bukan pengganti aplikasi lama.** Kode tidak mengubah satu sel pun di spreadsheet sumber.

## Teknologi

- Web: React 19 + TypeScript + Vite
- API: Fastify + Node.js 22 + TypeScript
- Database: PostgreSQL 16 (lokal Docker atau Supabase untuk staging)
- Auth: Supabase Auth + peta akun/area di database
- Data sync: Google Sheets API (read-only)

## Pendekatan gratis lebih dulu

Gunakan **Supabase Free** untuk PostgreSQL + Auth. Jalankan frontend dan API Fastify secara lokal. **Tidak perlu membeli domain atau hosting.** Batas gratis dan strategi pilot: `docs/FREE_FIRST_PLAN.md`.

## Buka dan jalankan dari VS Code

Prasyarat: Node.js 22+, npm. PostgreSQL lokal melalui Docker/Podman **opsional**; jika memakai Supabase Free tidak perlu Docker.

```bash
# Dari root folder proyek
cp .env.example .env
# Edit .env sesuai docs/ACCESS_CHECKLIST.md

# Docker compose hanya bila memakai PostgreSQL lokal.
# Bila memakai Supabase Free, lewati Docker.
npm install
npm run db:migrate
npm test
```

Setelah Supabase Auth dan Google service account disiapkan:

```bash
npm run sync:bsi
npm run dev:api
# buka terminal kedua
npm run dev:web
```

Frontend: `http://localhost:5173`. **Belum punya Supabase? Klik “Lihat Dashboard Demo”.** Setelah masuk, gunakan sidebar **Story Editor** dan **Preview & Presentasi**.
API Health: `http://127.0.0.1:8787/health`.

Jika belum ada Supabase Auth, frontend menampilkan halaman login dengan tombol **Lihat Dashboard Demo**. Di dalam demo terdapat **Story Editor**, **Preview Slide**, dan **Mode Presentasi** yang bisa digunakan tanpa database. Tombol ini hanya muncul saat menjalankan Vite dalam mode pengembangan (`npm run dev:web`), menampilkan **data SIMULASI**, tanpa request ke Supabase, API, ataupun spreadsheet. Build produksi (`npm run build`) sama sekali tidak mengizinkan akses demo. Ini tidak mem-bypass autentikasi produksi. Draft narasi editor disimpan di `localStorage` browser per periode+produk+Regional; tidak disinkronkan ke server. Presentasi adalah simulasi visual, **bukan** migrasi lengkap fungsi `buildPresentationDraft` / `saveStoryDraft` / `publishPresentation` legacy. Cetak / PDF memakai dialog print browser dan masih perlu uji manual lintas browser.

### Konfigurasi Supabase lokal

Backend membaca `SUPABASE_URL` dan `SUPABASE_ANON_KEY` untuk memverifikasi JWT, dengan `DATABASE_URL` untuk koneksi PostgreSQL. Frontend membaca `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_API_BASE_URL`. Gunakan satu project Auth yang sama untuk frontend dan backend, walaupun database backend sementara masih PostgreSQL lokal. UUID dari `auth.users.id` harus dipetakan manual ke `app_users.auth_uid` pada database aplikasi.

### Batasan source sync

Sync awal membaca semua baris tab `04_AREA_PERFORMANCE` pada spreadsheet pusat, lalu menghasilkan snapshot versi untuk setiap **bulan data** (`period_id`). Target dan hasil KPI tidak dihitung ulang. Tidak mengubah spreadsheet maupun Apps Script lama. Log ada pada `source_sync_runs`.

### Dokumentasi

- `docs/ACCESS_CHECKLIST.md`: kebutuhan yang perlu pemilik proyek sediakan.
- `docs/FREE_FIRST_PLAN.md`: arsitektur gratis, keterbatasan, dan rencana pilot.
- `docs/SOURCE_CONTRACT.md`: kontrak data source-to-database.
- `docs/SECURITY.md`: pengamanan dan batasan.
- `docs/IMPLEMENTATION_STATUS.md`: daftar yang sudah ada dan yang belum.

**Catatan:** Kredensial Google service account, database password, dan secret lain dikelola sendiri oleh pemilik proyek melalui file `.env` atau secret manager; jangan kirim ke ChatGPT dan jangan commit ke Git.

## Coba Presentation Studio (tanpa Supabase)

1. Di root proyek jalankan `npm install` lalu `npm run dev:web`.
2. Klik **Lihat Dashboard Demo** di halaman login.
3. Pilih periode/produk/Regional dari **Kinerja Bisnis** sebelum masuk editor.
4. Klik **Story Editor** di sidebar; pilih slide, ubah Headline, Penjelasan, Pesan Lanjutan, tampil/sembunyikan slide, lalu **Simpan Draft Lokal**.
5. Klik **Preview Slide** untuk melihat semua slide 16:9; klik kartu slide untuk layar penuh atau **Mulai Presentasi** untuk memulai dari slide pertama.
6. Dalam mode presentasi: tombol ← / → untuk berpindah, `Esc` untuk menutup. **Cetak / PDF** membuka print dialog browser.

**Batas demo:** seluruh angka simulasi; narasi dan isi beberapa slide berbasis sumber ringkasan sintetis. Komposisi HOT/Incoming/Carry Over/Batal Cair, Action Plan nyata, publikasi versi, serta otorisasi slide produksi belum aktif. Tidak pernah menyimpan data demo ke database atau spreadsheet.
