/** Approved V5.4 mapping helpers. Import preserves source metric values as-is. */
export const BSI_PRODUCTS = Object.freeze(['ALL', 'REGULER', 'MITRAGUNA']);
export const BSI_COLUMNS = Object.freeze([
  'period_id','product','area_id','area_name','rh_user_keys','rh_names',
  'rank_selindo','rank_pool','target_rp','achievement_rp','attainment_pct',
  'sf_active_total','sf_green','sf_grey','sf_red','pipeline_active_rp',
  'carry_over_rp','batal_cair_rp','branch_coverage','korea_activity_rate',
  'open_opportunity_rp','sf_fulfillment','min_sf_required',
  'productivity_per_sf_rp','quadrant_code','quadrant_name',
  'condition_summary','system_focus','status','ro_source','ro_filter_group'
]);

export function canonicalMonthKey(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 7);
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Google Sheets date serial (Sheets API with dateTimeRenderOption SERIAL_NUMBER).
    if (value >= 20000 && value <= 90000) {
      return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 7);
    }
    return null;
  }
  const s = String(value).trim().toUpperCase();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (m) return validMonth(m[1], m[2]);
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (m) return validMonth(m[2], m[1]);
  m = s.match(/^(\d{4})(\d{2})$/);
  if (m) return validMonth(m[1], m[2]);
  const months = {JAN:1,JANUARI:1,FEB:2,FEBRUARI:2,MAR:3,MARET:3,APR:4,APRIL:4,MEI:5,MAY:5,JUN:6,JUNI:6,JUL:7,JULI:7,AGU:8,AGS:8,AGUSTUS:8,AUG:8,SEP:9,SEPTEMBER:9,OKT:10,OKTOBER:10,OCT:10,NOV:11,NOVEMBER:11,DES:12,DESEMBER:12,DEC:12};
  m = s.match(/^([A-Z]+)[\s\-_]*(\d{4})$/);
  if (m && months[m[1]]) return validMonth(m[2], months[m[1]]);
  m = s.match(/^(\d{4})[\s\-_]*([A-Z]+)$/);
  if (m && months[m[2]]) return validMonth(m[1], months[m[2]]);
  return null;
}
function validMonth(y, m) {
  const mm = Number(m);
  return Number(y) >= 2000 && Number(y) <= 2100 && mm >= 1 && mm <= 12
    ? `${y}-${String(mm).padStart(2, '0')}` : null;
}

export function shiftPeriod(period, offset = 0) {
  const norm = canonicalMonthKey(period);
  if (!norm) return null;
  const [y, m] = norm.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + offset;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
}

export function resolvePeriodContext(reviewOrBusinessPeriod, isReviewPeriod = false) {
  const norm = canonicalMonthKey(reviewOrBusinessPeriod);
  if (!norm) return null;
  const review_period = isReviewPeriod ? norm : shiftPeriod(norm, +1);
  const business_period = isReviewPeriod ? shiftPeriod(norm, -1) : norm;
  const comparison_period = shiftPeriod(business_period, -1);
  return {
    review_period,
    business_period,
    comparison_period
  };
}

export function sourceNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = String(value).trim().replace(/\s|Rp|IDR/gi, '').replace(/[^\d.,-]/g, '');
  if (!s || s === '-') return null;
  if (s.includes('.') && s.includes(',')) {
    const decimal = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const thousands = decimal === '.' ? ',' : '.';
    s = s.split(thousands).join('').replace(decimal, '.');
  } else if (s.includes(',')) {
    s = s.replace(/,/g, '.'); // Known source locale: id-ID comma decimals.
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // id-ID thousand groups.
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function optionalString(v) { return v === null || v === undefined || v === '' ? null : String(v).trim(); }
function optionalNumber(v) { return sourceNumber(v); }
function optionalInteger(v) {
  const n = sourceNumber(v);
  if (n === null) return null;
  if (!Number.isInteger(n)) throw new Error(`Nilai integer tidak valid: ${String(v)}`);
  return n;
}

export function sheetRecords(values) {
  if (!Array.isArray(values) || !values.length) throw new Error('Spreadsheet belum memiliki header.');
  const headers = values[0].map((h) => String(h ?? '').trim().toLowerCase());
  const missing = BSI_COLUMNS.filter((h) => !headers.includes(h));
  if (missing.length) throw new Error(`Kontrak sumber berubah. Kolom hilang: ${missing.join(', ')}`);
  return values.slice(1).filter((r) => r.some((x) => x !== '' && x !== null && x !== undefined)).map((r) => Object.fromEntries(headers.map((h,i) => [h, r[i] ?? null])));
}

export function normalizeBsiRow(raw) {
  const period_id = canonicalMonthKey(raw.period_id);
  const product = String(raw.product ?? '').trim().toUpperCase();
  const area_id = String(raw.area_id ?? '').trim();
  const area_name = String(raw.area_name ?? '').trim();
  if (!period_id || !BSI_PRODUCTS.includes(product) || !area_id || !area_name) {
    throw new Error(`Baris tidak valid: periode=${raw.period_id} produk=${raw.product} area=${raw.area_id}`);
  }
  const numbers = [
    'target_rp','achievement_rp','attainment_pct','pipeline_active_rp','carry_over_rp',
    'batal_cair_rp','branch_coverage','korea_activity_rate','open_opportunity_rp',
    'sf_fulfillment','productivity_per_sf_rp'
  ];
  const ints = ['rank_selindo','rank_pool','sf_active_total','sf_green','sf_grey','sf_red','min_sf_required'];
  const r = {
    period_id, product, area_id, area_name,
    ro_source:optionalString(raw.ro_source), ro_filter_group:optionalString(raw.ro_filter_group),
    rh_user_keys:optionalString(raw.rh_user_keys), rh_names:optionalString(raw.rh_names),
    quadrant_code:optionalString(raw.quadrant_code),quadrant_name:optionalString(raw.quadrant_name),
    condition_summary:optionalString(raw.condition_summary),system_focus:optionalString(raw.system_focus),
    source_status:optionalString(raw.status),
    source_payload:raw
  };
  for (const n of numbers) r[n] = optionalNumber(raw[n]);
  for (const n of ints) r[n] = optionalInteger(raw[n]);
  if (r.target_rp !== null && r.target_rp < 0) throw new Error(`Target negatif: ${area_id}`);
  if (r.achievement_rp !== null && r.achievement_rp < 0) throw new Error(`Pencairan negatif: ${area_id}`);
  return r;
}

/** Literal port of Code.gs summarizeAreas_() for BSI, without redefining approved metrics. */
export function summarizeAreas(rows) {
  const s = { target_rp:0, achievement_rp:0,sf_active:0,sf_green:0,sf_grey:0,sf_red:0,
    pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0,open_opportunity_rp:0,
    min_sf_required:0,area_count:rows.length };
  let cov=0,covn=0,act=0,actn=0;
  for (const r of rows) {
    for (const [k, rk] of [
      ['target_rp','target_rp'],['achievement_rp','achievement_rp'],['sf_active','sf_active_total'],
      ['sf_green','sf_green'],['sf_grey','sf_grey'],['sf_red','sf_red'],
      ['pipeline_active_rp','pipeline_active_rp'],['carry_over_rp','carry_over_rp'],
      ['batal_cair_rp','batal_cair_rp'],['open_opportunity_rp','open_opportunity_rp'],
      ['min_sf_required','min_sf_required']
    ]) s[k] += Number(r[rk] ?? 0);
    if (r.branch_coverage !== null && r.branch_coverage !== undefined) { cov += Number(r.branch_coverage);covn++; }
    if (r.korea_activity_rate !== null && r.korea_activity_rate !== undefined) { act += Number(r.korea_activity_rate);actn++; }
  }
  const div = (a,b) => b ? a / b : 0;
  return {
    ...s,
    attainment_pct: div(s.achievement_rp,s.target_rp),
    productivity_per_sf_rp: div(s.achievement_rp,s.sf_active),
    pipeline_to_target: div(s.pipeline_active_rp,s.target_rp),
    sf_fulfillment: div(s.sf_active,s.min_sf_required),
    branch_coverage: covn ? cov / covn : null,
    korea_activity_rate: actn ? act / actn : null
  };
}
