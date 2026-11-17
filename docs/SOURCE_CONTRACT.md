# Source Contract — EKA Overview V5.4

Status: **pemetaan implementasi awal; rumus bisnis existing dianggap approved**.

## Prinsip

- Spreadsheet pusat tetap READ ONLY.
- Sinkronisasi awal mengimpor `04_AREA_PERFORMANCE` secara utuh, bukan menghitung ulang dari data Kompas mentah.
- Satu baris unik: `(period_id, product, area_id)` dalam satu versi snapshot.
- Seluruh kolom asli disimpan dalam `source_payload` untuk pelacakan internal, tetapi payload mentah TIDAK diekspos API.
- `target_rp`, `achievement_rp`, `attainment_pct`, `quadrant_code`, dll. ditulis dari sumber dan bukan direvisi dalam importer.
- Normalisasi tanggal menangani serial numerik Google Sheets maupun teks `YYYY-MM`.
- Metrik `null` tetap `null`, bukan otomatis 0. Untuk agregasi `summarizeAreas_` existing, kekosongan diperlakukan sebagai 0 sesuai rumus existing.
- `source_status` disimpan apa adanya, termasuk `LIVE_KOMPAS_TARGET_ACUAN_LAMA`.
- Period UI `2026-10` adalah **bulan data pencairan**. Jangan menyamakan tanpa kontrak dengan filter layar V5.4 `2026-11`, yang menampilkan bisnis closed month `2026-10`.

## Kontrak tabel sumber BSI

Spreadsheet pusat: `TESTING OVERVIEW REGION HEAD`.
Tab: `04_AREA_PERFORMANCE`.
Kolom yang diverifikasi langsung dari header: `period_id`, `product`, `area_id`, `area_name`, `rh_user_keys`, `rh_names`, `rank_selindo`, `rank_pool`, `target_rp`, `achievement_rp`, `attainment_pct`, `sf_active_total`, `sf_green`, `sf_grey`, `sf_red`, `pipeline_active_rp`, `carry_over_rp`, `batal_cair_rp`, `branch_coverage`, `korea_activity_rate`, `open_opportunity_rp`, `sf_fulfillment`, `min_sf_required`, `productivity_per_sf_rp`, `quadrant_code`, `quadrant_name`, `condition_summary`, `system_focus`, `status`, `ro_source`, `ro_filter_group`.

`rank_selindo`, `attainment_pct`, `quadrant_code`, target, pencairan, dan kuadran dipakai **apa adanya**. Summary mengikuti fungsi `summarizeAreas_` V5.4 (termasuk mean tak berbobot untuk `branch_coverage` dan `korea_activity_rate`).

## Bank Mantap

`04_MANTAP_AREA_PERFORMANCE` sudah dipetakan sebagai tabel `mantap_area_kpi` pada SQL. Integrasi worker/API Mantap **BELUM diimplementasikan** pada paket v0.1 ini, sehingga tidak menampilkan angka Mantap yang belum ada. Perhitungan BSI tidak dijalankan pada data Mantap.

## Sumber lanjutan yang akan diintegrasikan

- `00_SOURCE_CONFIG` → sumber dan registry.
- `01_USER_ACCESS`, `01_RO_RH_AREA_SCOPE` → basis rekonsiliasi akses (autentikasi baru tetap melalui Supabase Auth).
- `02_HISTORY_2026` → histori bulanan.
- `00_TARGET_REFERENCE` → catatan sumber/acuan target.
- `02_POTENSI_*`, `03_PIPELINE_REASON`, `04_RANK_*`, `05_*`, `06_*` → pilar lain setelah baseline terbukti.
- Sumber `KOMPAS_01` s.d. `KOMPAS_06` serta data Bank Mantap dan Action Plan akan ditambahkan pada worker terpisah, tidak dibaca oleh web client.

## Gerbang publikasi saat sinkronisasi

- Kolom wajib masih ada.
- Periode, produk, area_id, nama Area valid.
- Kombinasi `(period_id, area_id, product)` tidak duplikat.
- Ada setidaknya satu baris `ALL` pada setiap bulan.
- Penurunan jumlah baris >20% dari publikasi sebelumnya akan **ditahan** (guardrail teknis, bukan rumus KPI).
- Data versi sebelumnya dipertahankan, dan perubahan dapat ditelusuri dari `source_sha256` dan `source_sync_runs`.

> Penting: Guardrail dan pemetaan teknis masih perlu diuji terhadap runtime produksi. Penerimaan KPI bisnis sudah disetujui; verifikasi kesetaraan sistem baru tetap dilakukan pada UAT.
