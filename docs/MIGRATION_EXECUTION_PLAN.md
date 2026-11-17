# MIGRATION EXECUTION PLAN — ANTIGRAVITY

## Cara kerja yang wajib

**Baca berurutan saat sesi dimulai:** `AGENTS.md` → `docs/PLATFORM_BLUEPRINT_V1.md` → `docs/FEATURE_PARITY_MATRIX.md` → `docs/DEVELOPMENT_LOG.md` → `README.md` → `legacy/private/Code.gs` & `Index.html` untuk domain yang sedang dikerjakan → kode apps & SQL. `legacy/private/` hanya referensi, tidak boleh dijalankan/di-commit/dideploy; password hash dan hardcoded source IDs disamarkan.

**Siklus 1 fitur end-to-end:** pilih fitur berdasarkan dependensi → periksa fungsi legacy dan sheet header → tulis kontrak payload API/output legacy → database migration → importer/read model → auth/scope → endpoint → UI → fixture+parity test → sync logs & data status → update matriks dan log. Jangan mengerjakan lima menu sebagai mockup sebelum satu fitur nyata lengkap.

**Milestone dan dependency:**

| M | Deliverable konkret | Dependensi | Kelulusan |
|---|---|---|---|
| M0 | Starter stabil, test/build, mock isolated, docs & feature inventory | tidak ada | `npm test`, `npm run build`, demo route hanya DEV, status faktual |
| M1 | Auth RBAC, scope historis, filter cascade, periode review/data yang eksplisit | M0 | Unit+integration test role/scope/period termasuk filter tampering |
| M2 | BSI snapshot sync, publish atomik, Overview BSI API/UI nyata | M1, Google Sheets, PostgreSQL | BSI Sep/Okt parity; source lineage & stale indication; no partial publish |
| M3 | Business Review (history+pipeline), Data Health, multi-product | M2 | trend/closed/current sesuai legacy, no read huge Sheets on request |
| M4 | Potensi + Kondisi Tim + Hambatan | M2–M3 | seluruh 5? tiga pilar ini parity per role/granularity |
| M5 | Ranking & drilldown RO/RH/Area/Branch/Korea/SF | M2, org identity | ranking serta detail setara, no fallback full-source scan |
| M6 | CRUD development plans + projections + Action Plan impact | M1, M2, org identity, external source | write audit, history, D30/60/90, isolation rights |
| M7 | Story Editor + Preview + Publish/Print PDF | M3–M6 | immutable coherent data version, correct partner/scope/ACL |
| M8 | Mantap ingestion/domain + semua modul yang tersedia di legacy | M1–M7 foundations | Mantap KMP/KMPP correct, no invented target/achievement |
| M9 | Korea Profile (extension) | M1, M5, activities | Korea-level team KPIs + roles, no KPI redefinition |
| M10 | UAT parallel old/new + pilot deployment, ops runbooks | semua modul yang diaktifkan | parity proofs, security, backups, rollback, actual user validation |

**Urutan dapat mengelompokkan pekerjaan backend lintas modul**, tetapi `Feature Parity Matrix` tidak boleh kehilangan satu tool. M8 Mantap boleh dimulai lebih cepat di jalur paralel setelah normalisasi organisasi stabil.

### Kondisi awal proyek v0.2 (saat dokumen dibuat)

- API nyata: `/health`, `/api/v1/me`, `/api/v1/periods`, `/api/v1/overview`, `/api/v1/sync-runs`.
- DB awal: `app_users`, `user_area_access`, `source_sync_runs`, `dataset_versions`, `area_kpi`, `mantap_area_kpi`, `source_registry`, `data_quality_issues`.
- Worker `sync:bsi` hanya membaca `04_AREA_PERFORMANCE`; Mantap table ada tetapi belum ada worker/API live. React: login + ringkasan BSI/Area list, demo only; sidebar banyak placeholders.
- **Perbedaan penting:** v0.2 API menggunakan `period=business_period` dari snapshot, sedangkan di legacy `req.periodId=review_period`. Sebelum menyatakan parity wajib menyelaraskan dua pengertian ini.
- Program frontend belum memiliki menu Action Plan, Preview, Story, ranked drilldown, seluruh 5 pilar, Mantap. Jangan mengatakan sudah karena ada nama file SQL/sidemenu.

### Risiko engineering yang harus ditangani, tidak mengubah KPI

1. `dataset_versions` starter membaca versi terakhir (bukan pointer published eksplisit). Buat publish version pointer/approval dan atomic swap.
2. `user_area_access` butuh import/sync identitas historis berdasarkan source approved; login tidak boleh membuka semua Area karena mapping kosong.
3. Data baru/user writes harus pakai DB baru. Tentukan cutover agar plan terbaru tidak terpecah antara legacy dan web.
4. Period dari Sheets berformat Date/serial/string; angka IDR comma/dot; `null` vs `0`; required headers & row identity.
5. Stale target acuan lama, gaps RHCC/Atlas, Mantap achievements unknown wajib terlihat, bukan silently default.
6. API ranking/detail/service dapat jauh lebih besar daripada dashboard initial. Precompute dan paginasi; cache query memperhitungkan role/scope dan versi.
7. Validasi admin dan konten presentasi harus bound to source version dan requester scope.
8. Mode demo (simulasi) hanya `DEV`; tidak ada dummy angka di database produksi atau client live.

### Pekerjaan langsung tanpa kredensial (mulai sekarang)

- Jalankan tes/build lokal dan tulis hasil sebenarnya.
- Audit `apps/api/src/index.ts`, `apps/api/src/auth.ts`, `apps/api/src/run-sync.ts`, `apps/web/src/App.tsx`, SQL, dan dokumen.
- Tambah test parsers/scope/period dari fixture tiruan non-PII; pastikan endpoint error mode.
- Usulkan & implementasikan `review_period`/`business_period` contract yang kompatibel dengan approved snapshot sebelum menambah modul.
- Buat `docs/API_CONTRACT_V1.md` dan `docs/DATA_MODEL_V1.md` **dari kode/sumber nyata** untuk M1–M2, bukan tabel imajiner sebagai implementasi selesai.
- Selesaikan M0 dahulu, kemudian satu vertical slice sampai M2 yang bisa dijalankan Supabase/Sheets saat pengguna menyiapkan akses.

### Output setiap sesi Antigravity

```text
MILESTONE:
FITUR/ID:
FILE DIUBAH:
API/DB/UI yang bekerja:
TEST: perintah, pass/fail, parity evidence:
RISIKO/BLOCKER NYATA:
STATUS MATRIX:
NEXT ATOMIC TASK:
```

Append log; jangan hapus histori. Wajib pisahkan “terimplementasi”, “baru scaffold”, “perlu credential”, dan “baru ide/roadmap”.
