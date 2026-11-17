# EKA MANAGEMENT OVERVIEW — FULL PLATFORM BLUEPRINT v1.0

> **Status dokumen:** spesifikasi migrasi berbasis referensi `legacy/private/Code.gs` dan `legacy/private/Index.html` (V5.4) yang tersedia di paket ini, ditambah kode starter React/Fastify v0.2. Bukan klaim bahwa fitur telah berjalan di web baru.
>
> **Keputusan bisnis:** KPI, target, perhitungan, kebijakan bisnis, dan hasil meeting manajemen **APPROVED**. Jangan melakukan audit ulang atau mengganti formula. Tugas engineer adalah **porting dengan kesetaraan perilaku** (*functional parity*) dan keamanan teknis; uji kesetaraan angka adalah QA migrasi, bukan membuka ulang pembahasan business rules.

## A. Definisi proyek — SATU PLATFORM, BUKAN HANYA DASHBOARD

**Nama kerja:** EKA Business Management Platform. **Legacy utama:** EKA RH Business Overview V5.4, berbasis Google Apps Script + HTML + spreadsheet pusat TESTING OVERVIEW REGION HEAD. **Web baru sekarang:** developer starter v0.2; pada menu `App.tsx`, baru Kinerja Bisnis yang nyata tersusun, sedangkan Potensi, Kapasitas, Hambatan, Pengembangan bertanda 'Menyusul'. Demo menggunakan simulasi.

**Cakupan migrasi wajib (semua menjadi backlog, bukan dianggap selesai):**
1. Login dan otorisasi tingkat KP/Nasional/Regional/RH, pembatasan area dan pengguna.
2. Filter mitra, periode review, periode data bisnis, produk, Regional/RO/Distribution, RH, Area; filter cascade dan URL/state persisten.
3. Ringkasan manajemen dan indikator inti; status kualitas, catatan sumber, waktu pembaruan.
4. Pilar Bisnis Berjalan: target, realisasi, gap, pencapaian, tren Jan–Des, growth MoM, produktivitas, NOA/ticket size, pipeline closed/current, carry-over, batal cair, alasan pengajuan.
5. Pilar Potensi: area/branch Reguler SLA + Prapen Prioritas, potensi RH-level MTG/ASABRI, detail dan peringatan granularitas; Mantap pipeline sebagai peluang menurut definisi legacy.
6. Pilar Kondisi Tim: SF aktif, kebutuhan minimum, pemenuhan, hijau/abu/merah, aktivitas Korea, coverage branch, kuadran Q1–Q4.
7. Pilar Hambatan: enam kategori legacy (kapasitas, produktivitas, pipeline, proses, aktivitas, coverage), severity, bukti, arti, alasan pipeline.
8. Pilar Langkah Pengembangan: CRUD rencana RH per Area/mitra/periode, fokus, cara eksekusi, progress, hasil, urutan, status approval, pilih untuk presentasi.
9. Hasil Action Plan RH: integrasi external RH Action Plan dan review D30/D60/D90, pemetaan user, perkembangan baseline→current, matriks dampak dan rekomendasi manajemen.
10. Drilldown dan Ranking: Selindo/RO/RH/Area/Branch/Korea/SF; ranking berdasar produk, scope, bulan dan definisi mitra; detail Area dan Cabang, Korea, SF.
11. Proyeksi: pencairan proyeksi bulan ini dan bulan berikutnya, driver, carry-forward dengan catatan sumber, scope per partner/periode.
12. Sistem presentasi: draft, editor narasi, preview slide 16:9, mode presentasi/print PDF, publikasi versi; pembacaan versi terbit sesuai scope.
13. Data Health: kelengkapan, validasi data, status target acuan, data gaps, log sync, override validasi Admin, publikasi dataset.
14. Bank Mantap: jalur data dan KPI sendiri (KMP/KMPP, Distribution/RH/Unit/Sales Leader/SF, capaian jika tersedia, pipeline). **Tidak disamakan dengan BSI.**
15. Perluasan sesudah parity: Korea Profile dan monitoring pelaksanaan di bawah koordinasi Korea; ini ekstensi yang dirancang terpisah dari fitur existing V5.4, tidak boleh diklaim sudah ada pada legacy.

## B. Arsitektur fisik dan pengendalian sumber kebenaran

```text
[Kompas 01–06] [Sheets pusat 55 tab] [Bank Mantap] [RH Action Plan] [Validasi Admin]
               | READ ONLY / service account read-only, minimal scope
               v
     SYNC WORKERS per sumber + extractor terjadwal/manual
               |
     raw staging + metadata sumber + mapping ID + canonical YYYY-MM
               |
     quality gates TEKNIS + versioned snapshots + audit + diff
               |
    PostgreSQL (operational writes + published read models)
               |
       Fastify API (auth, scope, policy, domain services)
               |
       React UI (satu app dengan layout dan hak akses)
               |
  Dashboard / Detail / Actions / Story / Presentation / Admin / Korea Profile
```

Tidak boleh akses langsung dari browser ke spreadsheet, service account, atau database admin. API baca hanya **published dataset version**, bukan tabel staging. Sinkronisasi *idempotent*; kegagalan batch tidak boleh mempublikasikan data parsial. Tiap panel tampilkan sumber+periode+status+waktu refresh. Jika potensi tidak tersedia untuk scope, tampilkan `Tidak tersedia pada granularitas ini`, bukan angka estimasi.

**Tiga domain data harus dipisah**: (1) fakta bersumber/snapshot approved, (2) input operasional pengguna (plan, proyeksi, story, review), (3) dataset/ringkasan turunan siap tampil. Input plan/story/proyeksi milik web memiliki DB utama baru; perlu strategi migrasi dari sheet lama, audit trail, dan kebijakan write-back (default **TIDAK write back** ke spreadsheet legacy kecuali owner menyetujui). Backend harus mendukung rollback snapshot dan reprocess tanpa mengubah histori bisnis.

### B1. Sumber internal spreadsheet utama

| Kelompok | Tab legacy teridentifikasi | Penggunaan |
|---|---|---|
| Registry dan aturan | `00_SOURCE_CONFIG`, `00_APP_CONFIG`, `00_BUSINESS_RULES`, `00_BACKEND_CONTRACT`, `00_DATA_GAPS` | Konfigurasi/ketersediaan sumber, bukan hardcode baru sembarang |
| Scope dan pengguna | `01_USER_ACCESS`, `01_USER_AREA_SCOPE`, `01_RO_RH_AREA_SCOPE` | Scope login/Regional/RH/Area historis |
| Achievement dan history | `04_AREA_PERFORMANCE`, `02_HISTORY_2026`, `00_TARGET_REFERENCE`, `00_SNAPSHOT_META` | Snapshot approved, riwayat, provenance target |
| Potensi | `02_POTENSI_AREA`, `02_POTENSI_BRANCH`, `02_POTENSI_RH_REAL`, `00_POTENSI_MAPPING` | Granularitas Area/Branch vs RH berbeda |
| Pipeline dan ranking | `03_PIPELINE_REASON`, `04_RANK_KOREA`, `04_BRANCH_PERFORMANCE`, `04_SF_PERFORMANCE`, `04_ALERT` | Detail kendala/ranking; fallback perhitungan live perlu diganti precompute |
| Input/presentasi | `05_DEVELOPMENT_INPUT`, `05_DEVELOPMENT_AGENDA`, `05_PROJECTION_INPUT`, `05_ACTION_PLAN_USER_MAP`, `06_STORY_EDITOR`, `06_PRESENTATION_VERSION` | Data pengguna berversi dan output presentasi |
| Mantap | `04_MANTAP_AREA_PERFORMANCE`, `02_MANTAP_RH_MONTHLY`, `04_MANTAP_SL_PERFORMANCE`, `04_MANTAP_SF_PERFORMANCE`, `03_MANTAP_PIPELINE_DETAIL`, `00_MANTAP_RH_MAP`, `00_MANTAP_SYNC_LOG` | Jalur khusus Mantap |
| Validasi/monitoring | `05_ADMIN_VALIDATION_OVERRIDE`, `00_VALIDATION_SYNC_LOG`, `00_REFRESH_LOG` | Override terdokumentasi dan audit proses |

Nama tab referensi muncul dari konstanta `APP.SHEETS`/legacy. Tidak semua 55 tab berarti wajib disalin mentah atau sumbernya aktif. Cek `00_SOURCE_CONFIG` untuk status asli dan tab yang benar saat integrasi.

### B2. Sumber eksternal

| Source key | Sheet kerja | Domain |
|---|---|---|
| `KOMPAS_01` | `MASTER_KOREA` | Master Korea, relasi Area |
| `KOMPAS_02` | `MASTER_SF` | SF, branch, relasi Korea |
| `KOMPAS_03` | `MASTER_BRANCH` | Cabang dan wilayah |
| `KOMPAS_04` | `HPP_ACHIEV` | Realisasi pencairan |
| `KOMPAS_05_REG` | `PIPELINE` | Pipeline Reguler |
| `KOMPAS_05_MTG` | `PIPELINE_MTG` | Pipeline Mitraguna |
| `KOMPAS_06` | `MASTER_ACTIVITY_KOMPAS` | Aktivitas Korea/SF |
| `MANTAP_DB` | `MASTER_UNIT`, `MASTER_SL`, `MASTER_SF`, `MASTER_PIPELINE`, `MASTER_ACHIEV` | Operasional Bank Mantap |
| `RH_ACTION_USERS/PLAN/REVIEW` | Sheets RH Action Plan | Komitmen & evaluasi RH |
| `ADMIN_VALIDATION` | Sheets sumber Admin | Nilai validasi / override RH |

**Khusus** RHCC, Atlas, dan beberapa sumber yang pernah di-config literal `null` atau GAP: tandai `NOT_CONNECTED` dan tampilkan dependensi; jangan fabricate integrasi atau menganggap tersedia. Sumber kini jangan dimasukkan ke frontend langsung.

### B3. Relasi organisasi

BSI: Selindo > RO/Regional > RH > Area > Korea > SF, dengan cabang/unit sebagai simpul relasi tersendiri (SF dapat dipetakan ke cabang). Mantap: Distribution > RH > Area/Unit > Sales Leader > SF sesuai pemetaan sumber aktual. Gunakan **identitas stabil** (ID, kode/NIP yang telah dinormalisasi) dan riwayat penempatan yang memiliki valid_from/valid_to. **Jangan** menggunakan `nama` sebagai primary key; perpindahan SF/Korea/RH tidak boleh mengubah pemilik data historis. Jangan memaksakan bahwa Korea BSI sama dengan Sales Leader Mantap di level logika bisnis; kesamaan hanya UI label bila didukung sumber.

### B4. Periode & produk

**V5.4 memakai periode review**: `getInitialBundle(req.periodId)` mengambil `dataPeriodId = prev(periodId)` untuk ringkasan closed month. `getBusinessReviewBundle` memakai `closedPeriod = prev(req.periodId)`, tetapi pipeline current memakai bulan review. `04_AREA_PERFORMANCE.period_id` sendiri adalah periode data, bukan selalu periode view. Di API baru, buat eksplisit `review_period`, `business_period`, `comparison_period` beserta label; tidak boleh hardcode minus satu untuk setiap metrik tanpa memahami endpoint legacy. Pilihan produk BSI: `ALL`, `REGULER`, `MITRAGUNA`; Mantap: `ALL`, `KMP`, `KMPP` (cek normalisasi legacy). **Batasan per partner wajib berlaku di API dan UI**.

## C. Kontrak bisnis approved (jangan diganti)

- KPI snapshot BSI dari `04_AREA_PERFORMANCE`: target, pencairan, attainment, SF, pipeline, coverage, activity, potensi open, rank, kuadran, status disimpan utuh.
- Reguler BSI SLA + Prapen Prioritas open; MTG/ASABRI pada RH-level tidak dialokasikan ke Area/Korea/SF tanpa sumber nyata.
- SF baseline Reguler BSI Rp300 juta/SF/bulan; MTG Rp1 miliar/SF/bulan; pipeline ideal 2× target; warna SF hijau ≥80%, abu-abu ≥50%; branch coverage hijau ≥90%, abu-abu ≥70%; aktivitas Korea menurut aturan existing.
- Kuadran Q1 kuat dan produktif, Q2 produktif/kapasitas kurang, Q3 kedua indikator lemah, Q4 kapasitas cukup/hasil rendah. Port fungsi legacy, bukan formulasi baru.
- Aggregation `summarizeAreas_`: mean tak berbobot untuk `branch_coverage`/`korea_activity_rate` di level Area; **jangan** diganti weighted tanpa keputusan eksplisit.
- Target `LIVE_KOMPAS_TARGET_ACUAN_LAMA` tetap ditandai target acuan lama; status `null`/missing terpisah dari 0.
- Mantap: capaian unavailable = `null`, jangan hitung attainment jika tidak ada target; perbedaan KMP/KMPP, pipeline, ranking dan Unit/SL/SF wajib dijaga.
- Admin validation override: nilai sumber baku tidak ditimpa; simpan nilai asli, nilai override, identitas persetujuan, asal, waktu, dan hasil efektif sebagai entitas terpisah.

**Larangan:** jangan mengubah logika KPI karena temuan teknis; tuliskan catatan dan uji parity. Validasi migrasi ≠ re-approval KPI.

## D. Bagaimana ALL TOOLS bekerja — dari input hingga hasil

| Tool/layar legacy | Apa yang terlihat pengguna | Data/logic sumber | Sisi backend & database baru |
|---|---|---|---|
| Login/Filter | akses sesuai peran + partner/periode/produk/Regional/RH/Area | `loginOverviewAccess`, `getInitialBundle`, `getFilterContext`, `01_USER_ACCESS`, `01_RO_RH_AREA_SCOPE` | Account mapping + effective scope per periode + audited filter queries; migrasi scope tanpa membawa password/hash lama |
| Ringkasan | headline, target, pencairan, gap, attainment, kontribusi Area, histori singkat, status data | `getInitialBundle`, `getOverviewExtrasBundle`, `summarizeAreas_` | Read model `overview`, `area_kpi`, history; metrics mengikuti review period |
| Bisnis Berjalan | grafik tren, perbandingan bulanan, pipeline closed/current, sumber penyebab | `getBusinessReviewBundle`, `getHistoryBundle`, `buildBusinessPerformance_`, `buildPipelineReview_` | materialized performance history, pipeline breakdown & source status |
| Potensi | SLA/Prapen, nilai NOA/Rp, ranking Area, granularitas RH MTG/ASABRI | `getPotentialBundle`; `02_POTENSI_AREA/BRANCH/RH_REAL` | potential facts with scope/granularity; no arbitrary allocation |
| Kondisi Tim | SF aktif/ideal, gap, warna SF, coverage, activity, kuadran | `getCapacityBundle`, `summarizeAreas_`, Area snapshot + Kompas | precomputed capacity & quadrant detail, group by scope |
| Hambatan | severity tertinggi, bukti, makna bisnis, alasan pipeline | `getBarrierBundle`, `addBarrier_`, `getPipelineReasons_` | domain service/approved barrier rules + evidence links |
| Langkah Pengembangan | create/edit/delete plan, cara eksekusi, progress, hasil, approval & presentasi | `getDevelopmentPlans`, `saveDevelopmentPlan`, `deleteDevelopmentPlan`, `05_DEVELOPMENT_INPUT` | transactional CRUD + scope ownership + audit, optimistic locking |
| Hasil Action Plan RH | komitmen → pergerakan → evaluasi D30/60/90 per mitra | `getActionPlanImpactBundle`, `buildActionPlanImpactBundle_`, RH action sources | identity mapping, plan version, baselines, review/cycle, evidence & calculation |
| Detail Area / Branch | rincian Korea, Cabang, SF & alasan pipeline | `getAreaDetail`, `getBranchDetail`, `getKoreaPerformance_` | drilldown area→branch/coordinator→SF, period-scoped RBAC |
| Ranking | Selindo/RO/RH/Area/Branch/Korea/SF, tab dan detail | `getRankSummary`, `getRankingTab`, `getRankingBundle`, `getRhRankingDetail`; `04_RANK_*` | rank tables precompute; source rank existing, no on-open full Kompas scan |
| Proyeksi | target proyeksi berjalan/berikutnya, driver, carried forward | `getProjectionBundle`, `saveProjection`, `05_PROJECTION_INPUT` | versioned user-entered projections, scopes, provenance |
| Editor Narasi | edit headline, keterangan, teks pendukung, show/hide slide | `getStoryDraft`, `saveStoryDraft`, `06_STORY_EDITOR` | story revisions, partner+scope+period+slide keys |
| Preview/Presentasi/PDF | draft dari data, slide ranking/pilar/Action Plan, presentasi & print/PDF | `buildPresentationDraft`, `publishPresentation`, `getPublishedPresentation`, `06_PRESENTATION_VERSION` + Index.html renderers | immutable presentation data snapshot, approved story overrides, export engine; view permissions & version ACL |
| Data Health/Admin | status sumber, run, gap, preview sync, validasi override | `getDataHealthBundle`, `previewAdminValidationSync`, `syncAdminValidationOverrides` | admin-only sync logs, quality issues, preview diff, approve publish, override audit |
| Sync Bank Mantap | preview, sync, lihat 5 pilar, ranking/presentasi khusus | `previewMantapSync`, `syncMantapData`, `getMantap...` families | separate ingestion + domain read models; never reuse BSI attainment rules |
| Korea Profile (pengembangan BARU) | profil Korea, target, kualitas dan aktivitas SF binaan, peluang & tindakan | kebutuhan ekstensi proyek, sumber KOMPAS + hasil platform | rancang setelah master identitas & scope stabil; **bukan legacy V5.4 existing** |

**Setiap modul minimal memiliki:** (a) pemetaan sumber, (b) kontrak DB, (c) API + auth/scope, (d) UI state + filter, (e) uji parity dengan respons legacy, (f) hasil UAT, (g) status di Feature Parity Matrix. Jangan membuat menu 'selesai' bila hanya placeholder.

## E. Tata kelola peran & proses baca/tulis

Role dari legacy memiliki `TIM_KP` dan `REGIONAL_*`; starter web memberi role `ADMIN`,`NATIONAL`,`REGIONAL`,`RH`,`KOREA`,`SF`. Ini **belum mapping final**; Antigravity wajib menyusun matriks *identity/scope* berdasarkan akses legacy tanpa memindahkan hash password lama ke produksi. `KP` = operational management access hanya jika dipetakan secara sah. `ADMIN` untuk sync/validasi dan konfigurasi; `RH` hanya wilayahnya; `KOREA` hanya tim dan capaian yang dibina; `SF` hanya data yang diizinkan. Permission write `development_plans`, `projections`, `stories`, `publication`, `admin_override`, `sync_control` harus dicek per action dan bukan cuma menu. `getPublishedPresentation` lama perlu review security: endpoint baru mesti cek scope dan pemilik/izin versi yang diminta.

**Workflow kerja pengguna**:
1. Admin refresh/read source -> staging -> quality report -> preview diff -> publish snapshot.
2. Manajemen login -> filter partner & review period -> lihat ringkasan + status data -> pilih pilar -> ranking/drilldown.
3. RH evaluasi gap dan hambatan -> membuat Langkah Pengembangan -> update cara/progress/hasil -> evaluasi Action Plan -> pakai di presentasi.
4. Admin/pejabat sesuai role edit narasi -> preview -> publish version -> lihat/print PDF; angka tetap snapshot penerbitan meskipun ada sync baru.
5. Setelah sync, user dapat melihat versi baru; histori versi lama tetap dapat diaudit.

**Jangan langsung memodifikasi source Sheet** saat save plan/story/proyeksi dalam web baru. Putuskan strategi coexistence (old/new dual-write atau hanya new) dan *cutover* secara eksplisit sebelum data pengguna mulai diinput sungguhan.

## F. Target database (desain, BELUM dibangun sepenuhnya)

Starter sekarang hanya punya `app_users`, `user_area_access`, `dataset_versions`, `area_kpi`, `mantap_area_kpi`, `source_sync_runs`, `source_registry`, `data_quality_issues`. Itu adalah awal, bukan full schema. Penambahan yang diperlukan saat tiap modul dibangun:

- **Identity/org:** `organization_units`, `organization_assignments`, `user_identities`, `partner_scope_map`, `product_catalog`.
- **Business facts:** `history_monthly`, `achievement_facts`, `pipeline_cases`, `pipeline_status_events`, `activity_facts`, `potential_facts` dengan `granularity`, `source_references`, `target_references`.
- **Serving/read models:** `region_kpi`, `rh_kpi`, `area_kpi`, `branch_kpi`, `coordinator_kpi`, `sf_kpi`, `ranking_snapshots`, `capacity_snapshots`, `barrier_snapshots` (nama rancangan, sesuaikan implementasi tanpa menduplikasi yang sudah ada).
- **Workflow/outputs:** `development_plans`, `plan_revisions`, `action_plan_external`, `action_plan_reviews`, `projections`, `story_drafts`, `presentation_versions`, `presentation_slides`.
- **Governance:** `sync_runs`, `data_quality_issues`, `admin_validations`, `audit_events`, `dataset_publications` / `published_version_per_scope`.

Jangan membangun semua tabel sekaligus tanpa feature dependency; tiap schema migration harus reversible dan menjaga data lama. Buat index untuk partner+period+scope+product, bukan full-table recompute tiap request. Angka rupiah gunakan NUMERIC dan format hanya di UI. PII dikontrol menurut klasifikasi data perusahaan.

## G. Prinsip performa, UX, reliability

- Hindari membaca Kompas 35 ribu+ rows pada setiap page request. Gunakan sync batch, indexing, computed snapshot, query terarah, pagination, cache berdasarkan **partner+review/data period+produk+RO+RH+Area+user/scope+version**; invalidasi saat publish dan perubahan izin.
- Bersihkan risiko Apps Script lama: `period_id` tanggal vs teks, parser angka titik/koma, fallback raw scan, cache filter, dan response yang berpotensi berbeda antar-role. Ini risiko *porting*, bukan alasan mengganti hasil approved.
- States wajib: loading, empty, stale data, missing granular data, data dari target acuan lama, error, access denied, partial source, progress sync.
- UI bukan copy template cards AI. Fokus alur keputusan: hasil→masalah→wilayah/orang terdampak→aksi; tabel dan drilldown lebih diutamakan daripada dekorasi.
- Free-first: localhost untuk React/Fastify, Supabase Free opsional untuk DB/Auth setelah izin, Cloudflare Pages Free untuk frontend statis saja saat perlu online. Tidak ada kewajiban membeli domain/server. Free tier **bukan janji uptime, SLA, atau backup produksi**.

## H. Definisi feature parity — kontrak penerimaan

Satu fitur boleh ditandai **DONE** hanya jika:
1. Data source & status dipetakan dari legacy dan tidak menabrak approval bisnis.
2. Backend validasi scope, produk, periode, akses baca/tulis serta audit jika ada perubahan.
3. Hasil **field-by-field** atau secara bisnis ekuivalen dengan V5.4 pada fixture/snapshot representatif (BSI Reguler/MTG/ALL, Sep/Okt 2026, beberapa RO/RH/Area; Mantap KMP/KMPP bila data tersedia). Semua perbedaan terjelaskan dan disetujui.
4. UI bekerja dari API nyata di mode live; mode demo tidak bisa salah dikenali sebagai produksi.
5. Unit + integration + contract tests serta UI smoke test lulus; build berhasil.
6. Error/loading/empty/null/source-warning berfungsi.
7. `docs/DEVELOPMENT_LOG.md` dan matriks fitur diperbarui dengan bukti, bukan klaim verbal.

**Penting:** jangan mengklaim parity full platform atau go-live hanya karena `/api/v1/overview` sudah berjalan. Status sekarang adalah `starter_v0.2/demo`.
