# FEATURE PARITY MATRIX — V5.4 -> WEB

**Dasar:** referensi Code.gs + Index.html dari V5.4. **Status per 16 November 2026:** `STARTER_ONLY`, `DEMO_ONLY`, `NOT_STARTED`, `NEEDS_SOURCE`, `READY_FOR_UAT`, `DONE_PARITY` — jangan mengubah status tanpa bukti.

| ID | Fitur / tool | Bukti legacy utama | Status web v0.2 | Kriteria penerimaan khusus |
|---|---|---|---|---|
| F01 | Login, akses per wilayah | `loginOverviewAccess`, `requireOverviewAccess_`, `01_USER_ACCESS` | STARTER_ONLY | Identitas individual, period scope, denied test, audit |
| F02 | Filter Partner/Produk/RO/RH/Area/Periode | `getFilterContext`, `getInitialBundle`, `getMantapFilterContext_` | STARTER_ONLY (BSI period/product/RO; review vs business period helper ready) | Cascade RH/Area, partner, review vs business period |
| F03 | Ringkasan BSI | `getInitialBundle`, `summarizeAreas_` | LIVE_APPROVED_SNAPSHOT | Live approved snapshot di Supabase (periode 2026-08, 2026-09, 2026-10; 419 baris); data health dan status source aktif; formula parity terverifikasi |
| F04 | Histori/Business Review | `getHistoryBundle`,`getBusinessReviewBundle` | NOT_STARTED | Tren, MoM, NOA, ticket, closed/current pipeline setara |
| F05 | Potensi | `getPotentialBundle` | NOT_STARTED | SLA/Prapen Area, RH MTG/ASABRI dan disclaimer granularitas |
| F06 | Kondisi Tim | `getCapacityBundle` | NOT_STARTED | SF active/ideal, color, coverage, Korea activity, quadrant |
| F07 | Hambatan | `getBarrierBundle` | NOT_STARTED | Severity, evidence, kategori, alasan pipeline |
| F08 | Detail Area | `getAreaDetail` | NOT_STARTED | Cabang, Korea, SF sesuai periode dan hak akses |
| F09 | Detail Cabang/SF | `getBranchDetail`, `getKoreaPerformance_` | NOT_STARTED | Detail hierarchical, mapping NIP/ID stabil |
| F10 | Ranking summary | `getRankSummary`,`getRankingBundle` | NOT_STARTED | RO/RH/Area/Branch/Korea/SF rank + scope |
| F11 | Tab ranking & detail RH | `getRankingTab`,`getRhRankingDetail` | NOT_STARTED | Ranking lintas produk, sorted correct, no full scan |
| F12 | Input Langkah Pengembangan | `getDevelopmentPlans`,`saveDevelopmentPlan`,`deleteDevelopmentPlan` | NOT_STARTED | Create/edit/delete + audit, authorization owner/scope |
| F13 | Hasil Action Plan RH | `getActionPlanImpactBundle` | NOT_STARTED | Identity join, baseline D30/60/90, review movement |
| F14 | Proyeksi | `getProjectionBundle`,`saveProjection` | NOT_STARTED | Partner+scope+period key, carry-forward, audit |
| F15 | Story Editor | `getStoryDraft`,`saveStoryDraft` | DEMO_ONLY (v0.4 localStorage, belum API) | Slide visibility, headline, explanation, versions |
| F16 | Presentation draft + preview | `buildPresentationDraft`, Index.html renderers | DEMO_ONLY (v0.4 16:9, belum parity) | Content from same approved snapshot, partner-specific |
| F17 | Publish/Read/Print PDF | `publishPresentation`,`getPublishedPresentation`, Index.html print | DEMO_ONLY (browser print; publish/read belum ada) | Immutable version, ACL, 16:9, print/PDF accurate |
| F18 | Data Health | `getDataHealthBundle` | NOT_STARTED | Timeliness, missing, gap, status, provenance per panel |
| F19 | Sync BSI snapshot | `04_AREA_PERFORMANCE`, source config | LIVE_INGESTION_READY | File sync & webhook ingestion engine aktif; transaksi atomik, hash SHA-256, deteksi duplikasi, 419 baris live di Supabase |
| F20 | Auto precompute detail Kompas | `buildLiveBranchSf_`,`getRankingTab` | NOT_STARTED | Precompute branch/SF/Korea stable, no expensive page load |
| F21 | Sync Bank Mantap | `previewMantapSync`,`syncMantapData` | SCHEMA_ONLY | Actual worker, 5 source tabs, status/availability |
| F22 | Pilar Mantap | `getMantap...` functions | NOT_STARTED | KMP/KMPP, distinct metrics, null achievements |
| F23 | Ranking/Presentation Mantap | `getMantapRankingTab_`,`buildMantapPresentationDraft_` | NOT_STARTED | Distribution/Unit/SL/SF, accurate partner labels |
| F24 | Validasi Admin & Overrides | `previewAdminValidationSync`,`syncAdminValidationOverrides` | NOT_STARTED | View original vs override, who/when/why, scope, revert |
| F25 | Snapshot publication/rollback | `00_SNAPSHOT_META`, `00_REFRESH_LOG` | STARTER_ONLY | Atomic publish, retained prior version, rollback/test |
| F26 | Sync Logs admin | `00_REFRESH_LOG`, `00_MANTAP_SYNC_LOG` | STARTER_ONLY (read logs endpoint) | Diff reports, failure alert, retry/recovery |
| F27 | Korea Profile | baru: pengembangan produk (tidak legacy V5.4) | NOT_STARTED | Profile + team performance/activity + scope mapping |
| F28 | Production deployment & security | non-legacy target | NOT_STARTED | Secured hosted API, authorization test, backup/monitoring |

**TATA CARA:** Setiap selesai fitur, ubah status per baris dan lampirkan path kode, endpoint API, query sumber, bukti test, hasil parity, serta link/commit jika tersedia. Tidak boleh menandai DONE hanya karena UI muncul. Semua baris adalah cakupan platform; beda dengan *urut pengerjaan*.
