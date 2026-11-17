import {createClient, type Session} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const authConfigured = !!(url && key);
export const supabase = authConfigured ? createClient(url, key) : null;
const envBase = import.meta.env.VITE_API_BASE_URL || '';
const localBase = typeof window !== 'undefined' ? (window.localStorage.getItem('eka_api_url') || '') : '';
const base = (localBase || envBase || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:8787')).replace(/\/$/, '');

export interface UserProfile {
  id: string;
  displayName: string;
  role: string;
}

export interface AreaKpi {
  area_id: string;
  area_name: string;
  ro_filter_group: string | null;
  ro_source: string | null;
  rh_user_keys?: string | null;
  rh_names?: string | null;
  rank_selindo: number | null;
  rank_pool?: number | null;
  target_rp: number | null;
  achievement_rp: number | null;
  attainment_pct: number | null;
  sf_active_total: number | null;
  sf_green?: number | null;
  sf_grey?: number | null;
  sf_red?: number | null;
  pipeline_active_rp: number | null;
  carry_over_rp?: number | null;
  batal_cair_rp?: number | null;
  branch_coverage: number | null;
  korea_activity_rate: number | null;
  open_opportunity_rp?: number | null;
  sf_fulfillment?: number | null;
  min_sf_required?: number | null;
  productivity_per_sf_rp?: number | null;
  quadrant_code: string | null;
  quadrant_name: string | null;
  source_status: string | null;
  condition_summary: string | null;
  system_focus?: string | null;
}

export interface Summary {
  target_rp: number;
  achievement_rp: number;
  attainment_pct: number;
  sf_active: number;
  area_count: number;
  pipeline_active_rp: number;
  carry_over_rp?: number;
  batal_cair_rp?: number;
  branch_coverage: number | null;
  korea_activity_rate: number | null;
  productivity_per_sf_rp: number;
  sf_fulfillment: number;
  min_sf_required?: number;
  sf_green?: number;
  sf_grey?: number;
  sf_red?: number;
  pipeline_to_target?: number;
}

export interface Overview {
  period: string;
  product: string;
  summary: Summary | null;
  areas: AreaKpi[];
  publishedAt: string | null;
  sourceName: string | null;
}

export interface HistoryMonth {
  month_num: number;
  month: string;
  period_id: string;
  target_rp: number;
  actual_rp: number;
  attainment_pct: number;
  sf_active: number;
  productivity_per_sf_rp: number;
  noa: number;
  is_snapshot: boolean;
  mom_growth?: number | null;
}

export interface HistoryData {
  months: HistoryMonth[];
  current: Summary;
  contribution: Array<{
    area_id: string;
    area_name: string;
    achievement_rp: number;
    target_rp: number;
    attainment_pct: number;
    contribution_pct: number;
    rank_selindo: number | null;
    quadrant_code: string | null;
    quadrant_name: string | null;
  }>;
  latestPeriod: string;
}

export interface PotentialData {
  summary: {
    reguler_open_rp: number;
    reguler_open_noa: number;
    sla_open_rp: number;
    sla_open_noa: number;
    prap_open_rp: number;
    prap_open_noa: number;
    total_open_rp: number;
    total_open_noa: number;
    mitraguna_total_rp: number;
    asabri_total_rp: number;
    source_record_count: number;
  };
  areas: Array<{
    area_id: string;
    area_name: string;
    ro_source: string;
    reguler_open_rp: number;
    reguler_open_noa: number;
    sla_open_rp: number;
    prap_open_rp: number;
    total_open_rp: number;
    total_open_noa: number;
    sf_fulfillment: number;
    productivity_per_sf_rp: number;
    branch_coverage: number;
    achievement_rp: number;
    quadrant_code: string | null;
    quadrant_name: string | null;
    rank_selindo: number | null;
  }>;
  topBranches: Array<{
    branch_code: string;
    branch_name: string;
    area_name: string;
    sf_total: number;
    coverage_status: string;
    reguler_open_rp: number;
    sla_open_rp: number;
    prap_open_rp: number;
    total_open_rp: number;
  }>;
  sourceGranularity: string;
  sourceWarning: string;
}

export interface CapacityData {
  summary: Summary & {
    productivity_baseline: number;
    coverage_target: number;
    korea_activity_target: number;
  };
  areas: Array<{
    area_id: string;
    area_name: string;
    ro_source: string;
    sf_active: number;
    min_sf_required: number;
    sf_fulfillment: number;
    sf_green: number;
    sf_grey: number;
    sf_red: number;
    productivity_per_sf_rp: number;
    korea_activity_rate: number;
    branch_coverage: number;
    quadrant_code: string | null;
    quadrant_name: string | null;
  }>;
}

export interface BarrierItem {
  code: string;
  title: string;
  severity: number;
  evidence: string;
  meaning: string;
}

export interface BarriersData {
  summary: Summary;
  processRatio: number;
  barriers: BarrierItem[];
  allBarriers: BarrierItem[];
  pipelineReasons: Array<{
    category: string;
    reason: string;
    count: number;
    amount_rp: number;
    followup: string;
  }>;
}

export interface KoreaRanking {
  rank: number;
  nip_korea: string;
  nama_korea: string;
  area_id: string;
  area_name: string;
  rh_name: string;
  target_rp: number;
  achievement_rp: number;
  attainment_pct: number;
  sf_active: number;
  sf_green: number;
  sf_grey: number;
  sf_red: number;
  korea_activity_rate: number;
  korea_activity_status: string;
}

export interface ScopeHierarchy {
  ros: Array<{ro_name: string; rh_count: number; area_count: number}>;
  rhs: Array<{rh_key: string; rh_name: string; ro_name: string; area_count: number}>;
  areas: Array<{area_id: string; area_name: string; ro_name: string; rh_key: string; rh_name: string}>;
}

export interface AreaDetailResponse {
  area: AreaKpi | null;
  koreas: Array<{
    nip_korea: string;
    nama_korea: string;
    rh_name: string | null;
    sf_active: number;
    sf_green: number;
    sf_grey: number;
    sf_red: number;
    korea_activity_rate: number;
    korea_activity_status: string;
    pipeline_active_rp: number;
    pipeline_carry_over_rp: number;
    pipeline_batal_cair_rp: number;
    all_target_rp: number;
    all_achievement_rp: number;
    all_attainment_pct: number;
    all_rank_area: number | null;
    all_rank_selindo: number | null;
  }>;
  pipelineReasons: Array<{
    category: string;
    reason: string;
    condition: string;
    followup: string;
    count: number;
    amount_rp: number;
    share_records: number;
    share_amount: number;
  }>;
  potensi: {
    sla_open_noa: number;
    sla_open_rp: number;
    prap_open_noa: number;
    prap_open_rp: number;
    total_open_noa: number;
    total_open_rp: number;
    potensi_reguler_rp: number;
    potensi_mitraguna_rp: number;
    potensi_asabri_rp: number;
    mapping_status: string | null;
    source_note: string | null;
  } | null;
}

export interface RankingsData {
  roRankings: Array<{
    rank: number;
    ro_name: string;
    target_rp: number;
    achievement_rp: number;
    attainment_pct: number;
    area_count: number;
  }>;
  rhRankings: Array<{
    rank: number;
    rh_key: string;
    rh_name: string;
    ro_name: string;
    target_rp: number;
    achievement_rp: number;
    attainment_pct: number;
    sf_active: number;
    productivity_per_sf_rp: number;
    area_count: number;
  }>;
  koreaRankings?: KoreaRanking[];
  areaRankings: Array<{
    rank: number;
    area_id: string;
    area_name: string;
    ro_name: string;
    target_rp: number;
    achievement_rp: number;
    attainment_pct: number;
    sf_active: number;
    quadrant_code: string | null;
    quadrant_name: string | null;
  }>;
  branchRankings: Array<{
    rank: number;
    branch_name: string;
    area_name: string;
    ro_name: string;
    target_rp: number;
    achievement_rp: number;
    attainment_pct: number;
  }>;
  sfRankings: Array<{
    rank: number;
    sf_name: string;
    area_name: string;
    ro_name: string;
    achievement_rp: number;
    color: string;
    status: string;
  }>;
}

export interface ProjectionData {
  key: string;
  period: string;
  basePeriod: string;
  nextPeriod: string;
  scopeType: string;
  scopeId: string;
  base_actual_rp: number;
  current_target_rp: number;
  current_actual_rp: number;
  current_attainment_pct: number;
  projection_rp: number;
  next_projection_rp: number;
  driver_text: string;
  gap_to_target: number;
}

export interface DevelopmentPlan {
  id?: string;
  plan_id: string;
  period_id: string;
  area_id: string;
  area_name: string;
  focus_title: string;
  action_plan: string;
  how_to?: string;
  pic?: string;
  deadline?: string;
  horizon_30_day?: string;
  horizon_60_day?: string;
  horizon_90_day?: string;
  target_result?: string;
  support_bsi?: string;
  include_to_presentation: string;
  approval_status: string;
  focus_order: number;
  updated_at?: string;
}

export interface SyncRun {
  id: string;
  source_name: string;
  status: string;
  records_read: number;
  versions_published: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

export async function request<T>(
  path: string,
  session: Session | null,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  const r = await fetch(`${base}${path}`, {
    ...options,
    headers
  });
  const body = await r.json().catch(() => ({error: 'Respons server tidak valid.'}));
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body as T;
}
