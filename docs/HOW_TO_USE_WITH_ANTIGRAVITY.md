# Cara menggunakan paket FULL PLATFORM di VS Code / Antigravity

## Apabila proyek v0.2 belum pernah diubah

1. Simpan proyek lama sebagai backup; ekstrak `eka-management-web-v0.3-full-platform-context.zip`.
2. `File > Open Folder` → pilih folder `eka-management-web-v0.3-full-platform-context` yang memiliki `package.json`.
3. Buka Antigravity dan tempel isi file `ANTIGRAVITY_MASTER_PROMPT_EKA_FULL_PLATFORM.md` yang dibagikan terpisah.
4. Pastikan Antigravity membuka `AGENTS.md`, tiga dokumen utama, dan source legacy sebelum coding modul.
5. Uji `npm install`, `npm test`, `npm run dev:web`. Backend live tetap butuh database/credential; mode demo lokal tidak.

## Apabila proyek v0.2 SUDAH diubah di VS Code / Antigravity

**JANGAN GANTI SEMUA FOLDER DENGAN ZIP.** Agar hasil coding tidak hilang:

1. Backup atau commit perubahan lokal saat ini (periksa `git status`).
2. Dari paket v0.3, pindahkan/merge hanya: `AGENTS.md` bagian 10, `docs/PLATFORM_BLUEPRINT_V1.md`, `docs/FEATURE_PARITY_MATRIX.md`, `docs/MIGRATION_EXECUTION_PLAN.md`, `docs/LEGACY_REFERENCE_GUIDE.md`, `legacy/private/Code.gs`, `legacy/private/Index.html`, dan tambahan `.gitignore` untuk `legacy/private/`.
3. Pertahankan `docs/DEVELOPMENT_LOG.md` existing dan **tambahkan** konteks terbaru; jangan hapus catatan perbaikan kode yang sudah dilakukan Antigravity.
4. Jangan mengganti `apps/` atau `sql/` yang sudah diubah tanpa diff/review.
5. Gunakan master prompt baru, minta Antigravity membaca dokumen dan **melanjutkan** kode aktual dari checkpoint terakhir.

## Catatan

Source legacy private berisi business metadata; hash password dan beberapa ID sumber hardcoded telah disamarkan. Source ini hanya acuan parity, **jangan dijalankan atau commit**.
Dokumen blueprint/matrix berisi target lengkap, tidak mengklaim fitur sudah diimplementasi.
