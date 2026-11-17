-- EKA Management Overview v0.1 | postgresql 16+
-- Rujukan angka yang disetujui: 04_AREA_PERFORMANCE, tidak dihitung ulang pada impor.
-- PENTING: database ini tidak otomatis terhubung ke Supabase Auth; petakan akun di app_users.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'NATIONAL', 'REGIONAL', 'RH', 'KOREA', 'SF')),
  legacy_user_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_area_access (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL,
  valid_from CHAR(7) NOT NULL DEFAULT '2000-01' CHECK (valid_from ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  valid_through CHAR(7) CHECK (valid_through IS NULL OR valid_through ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  PRIMARY KEY (user_id, area_id, valid_from),
  CHECK (valid_through IS NULL OR valid_through >= valid_from)
);
CREATE INDEX IF NOT EXISTS idx_access_area ON user_area_access(area_id, user_id);

CREATE TABLE IF NOT EXISTS source_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('RUNNING','SUCCESS','NO_CHANGE','FAILED')),
  records_read INTEGER NOT NULL DEFAULT 0,
  versions_published INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner TEXT NOT NULL CHECK(partner IN ('BSI','MANTAP')),
  period_id CHAR(7) NOT NULL CHECK(period_id ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  source_name TEXT NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  sync_run_id UUID NOT NULL REFERENCES source_sync_runs(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(source_sha256) = 64)
);
CREATE INDEX IF NOT EXISTS idx_versions_latest ON dataset_versions(partner, period_id, published_at DESC);

CREATE TABLE IF NOT EXISTS area_kpi (
  version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
  period_id CHAR(7) NOT NULL,
  product TEXT NOT NULL CHECK(product IN ('ALL','REGULER','MITRAGUNA')),
  area_id TEXT NOT NULL,
  area_name TEXT NOT NULL,
  ro_source TEXT,
  ro_filter_group TEXT,
  rh_user_keys TEXT,
  rh_names TEXT,
  rank_selindo INTEGER,
  rank_pool INTEGER,
  target_rp NUMERIC(22,4),
  achievement_rp NUMERIC(22,4),
  attainment_pct NUMERIC(18,12),
  sf_active_total INTEGER,
  sf_green INTEGER,
  sf_grey INTEGER,
  sf_red INTEGER,
  pipeline_active_rp NUMERIC(22,4),
  carry_over_rp NUMERIC(22,4),
  batal_cair_rp NUMERIC(22,4),
  branch_coverage NUMERIC(18,12),
  korea_activity_rate NUMERIC(18,12),
  open_opportunity_rp NUMERIC(22,4),
  sf_fulfillment NUMERIC(18,12),
  min_sf_required INTEGER,
  productivity_per_sf_rp NUMERIC(22,4),
  quadrant_code TEXT,
  quadrant_name TEXT,
  condition_summary TEXT,
  system_focus TEXT,
  source_status TEXT,
  source_payload JSONB NOT NULL,
  PRIMARY KEY (version_id, area_id, product)
);
CREATE INDEX IF NOT EXISTS idx_area_version_product ON area_kpi(version_id, product, area_id);

-- Struktur extensible untuk produk Mantap; tidak mengarang pencapaian ketika data kosong.
CREATE TABLE IF NOT EXISTS mantap_area_kpi (
  version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
  period_id CHAR(7) NOT NULL,
  product TEXT NOT NULL,
  area_id TEXT NOT NULL,
  area_name TEXT NOT NULL,
  distribution TEXT,
  rh_user_key TEXT,
  rh_name TEXT,
  sf_active INTEGER,
  sl_active INTEGER,
  unit_total INTEGER,
  unit_covered INTEGER,
  branch_coverage NUMERIC(18,12),
  pipeline_active_rp NUMERIC(22,4),
  achievement_rp NUMERIC(22,4),
  achievement_available BOOLEAN NOT NULL DEFAULT false,
  source_status TEXT,
  source_payload JSONB NOT NULL,
  PRIMARY KEY (version_id, area_id, product)
);

-- Reservasi tabel untuk pengembangan data source-to-database pada fase berikut.
CREATE TABLE IF NOT EXISTS source_registry (
  source_key TEXT PRIMARY KEY,
  spreadsheet_id TEXT,
  sheet_name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES source_sync_runs(id),
  source_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('INFO','WARNING','BLOCKER')),
  issue_code TEXT NOT NULL,
  description TEXT NOT NULL,
  row_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
