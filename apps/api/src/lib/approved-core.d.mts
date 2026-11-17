export const BSI_PRODUCTS: readonly string[];
export const BSI_COLUMNS: readonly string[];
export function canonicalMonthKey(value:unknown):string|null;
export function shiftPeriod(period:string, offset?:number):string|null;
export interface PeriodContext {
  review_period: string;
  business_period: string;
  comparison_period: string;
}
export function resolvePeriodContext(reviewOrBusinessPeriod:string, isReviewPeriod?:boolean):PeriodContext|null;
export function sourceNumber(value:unknown):number|null;
export function sheetRecords(values:unknown[][]):Record<string,unknown>[];
export interface AreaInput {
  period_id:string;product:string;area_id:string;area_name:string;
  ro_source:string|null;ro_filter_group:string|null;rh_user_keys:string|null;rh_names:string|null;
  rank_selindo:number|null;rank_pool:number|null;target_rp:number|null;achievement_rp:number|null;
  attainment_pct:number|null;sf_active_total:number|null;sf_green:number|null;sf_grey:number|null;sf_red:number|null;
  pipeline_active_rp:number|null;carry_over_rp:number|null;batal_cair_rp:number|null;
  branch_coverage:number|null;korea_activity_rate:number|null;open_opportunity_rp:number|null;
  sf_fulfillment:number|null;min_sf_required:number|null;productivity_per_sf_rp:number|null;
  quadrant_code:string|null;quadrant_name:string|null;condition_summary:string|null;
  system_focus:string|null;source_status:string|null;source_payload:Record<string,unknown>;
}
export function normalizeBsiRow(raw:Record<string,unknown>):AreaInput;
export interface AreaSummary {
  target_rp:number;achievement_rp:number;sf_active:number;sf_green:number;sf_grey:number;sf_red:number;
  pipeline_active_rp:number;carry_over_rp:number;batal_cair_rp:number;
  open_opportunity_rp:number;min_sf_required:number;area_count:number;
  attainment_pct:number;productivity_per_sf_rp:number;pipeline_to_target:number;
  sf_fulfillment:number;branch_coverage:number|null;korea_activity_rate:number|null;
}
export function summarizeAreas(rows:Record<string,any>[]):AreaSummary;
