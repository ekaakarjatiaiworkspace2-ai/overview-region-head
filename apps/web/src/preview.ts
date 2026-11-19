import type {AreaKpi, KoreaRanking, Overview, RankingsData, UserProfile} from './api';
import bsiRawData from './data/bsi-dataset.json';
import rankKoreaRaw from './data/rankKorea.json';
import potensiBranchRaw from './data/potensiBranch.json';
import history2026Raw from './data/history2026.json';
import alertsRaw from './data/alerts.json';
import pipelineReasonRaw from './data/pipelineReason.json';

export const previewPeriods = ['2026-10', '2026-09', '2026-08'];
export const previewUser: UserProfile = {id:'preview-only', displayName:'Admin EKA', role:'ADMIN'};
const rawList: any[] = Array.isArray(bsiRawData) ? bsiRawData : ((bsiRawData as any)?.default || []);
const rawKoreaList: any[] = Array.isArray(rankKoreaRaw) ? rankKoreaRaw : ((rankKoreaRaw as any)?.default || []);
const rawBranchList: any[] = Array.isArray(potensiBranchRaw) ? potensiBranchRaw : ((potensiBranchRaw as any)?.default || []);
const rawHistoryList: any[] = Array.isArray(history2026Raw) ? history2026Raw : ((history2026Raw as any)?.default || []);
const rawAlertsList: any[] = Array.isArray(alertsRaw) ? alertsRaw : ((alertsRaw as any)?.default || []);
const rawReasonList: any[] = Array.isArray(pipelineReasonRaw) ? pipelineReasonRaw : ((pipelineReasonRaw as any)?.default || []);

export const previewRos = [...new Set(rawList.map((r: any) => r.ro_filter_group || r.ro_source).filter(Boolean) as string[])].sort();

export function getPreviewOverview(period: string, product: string, ro: string): Overview {
  const prod = product || 'ALL';
  let matched = rawList.filter(r => r.period_id === period && r.product === prod);
  if (!matched.length && prod !== 'ALL') {
    matched = rawList.filter(r => r.period_id === period && r.product === 'ALL');
  }
  if (!matched.length) {
    matched = rawList.filter(r => r.period_id === '2026-10' && r.product === 'ALL');
  }
  if (ro) {
    matched = matched.filter(r => r.ro_filter_group === ro || r.ro_source === ro);
  }

  const rows: AreaKpi[] = matched.map((r, i) => ({
    area_id: r.area_id || `AREA${String(i + 1).padStart(3, '0')}`,
    area_name: r.area_name || 'Area',
    ro_filter_group: r.ro_filter_group || r.ro_source || '—',
    ro_source: r.ro_source || r.ro_filter_group || '—',
    rh_user_keys: r.rh_user_keys,
    rh_names: r.rh_names,
    rank_selindo: r.rank_selindo ?? (i + 1),
    rank_pool: r.rank_pool,
    target_rp: r.target_rp || 0,
    achievement_rp: r.achievement_rp || 0,
    attainment_pct: r.attainment_pct ?? (r.target_rp ? (r.achievement_rp || 0) / r.target_rp : 0),
    sf_active_total: r.sf_active_total,
    sf_green: r.sf_green,
    sf_grey: r.sf_grey,
    sf_red: r.sf_red,
    pipeline_active_rp: r.pipeline_active_rp,
    carry_over_rp: r.carry_over_rp,
    batal_cair_rp: r.batal_cair_rp,
    branch_coverage: r.branch_coverage,
    korea_activity_rate: r.korea_activity_rate,
    open_opportunity_rp: r.open_opportunity_rp,
    sf_fulfillment: r.sf_fulfillment,
    min_sf_required: r.min_sf_required,
    productivity_per_sf_rp: r.productivity_per_sf_rp,
    quadrant_code: r.quadrant_code,
    quadrant_name: r.quadrant_name,
    condition_summary: r.condition_summary,
    system_focus: r.system_focus,
    source_status: 'RESMI BSI'
  }));

  const sum = (key: 'target_rp' | 'achievement_rp' | 'sf_active_total' | 'pipeline_active_rp' | 'carry_over_rp' | 'batal_cair_rp' | 'sf_green' | 'sf_grey' | 'sf_red' | 'min_sf_required') =>
    rows.reduce((v, r) => v + (r[key] || 0), 0);

  const target = sum('target_rp');
  const achievement = sum('achievement_rp');
  const sf = sum('sf_active_total');
  const minSf = sum('min_sf_required');
  const pipeline = sum('pipeline_active_rp');
  const avg = (key: 'branch_coverage' | 'korea_activity_rate') => {
    const valid = rows.filter(r => typeof r[key] === 'number');
    return valid.length ? valid.reduce((v, r) => v + (r[key] as number), 0) / valid.length : null;
  };

  const summary = {
    target_rp: target,
    achievement_rp: achievement,
    attainment_pct: target > 0 ? achievement / target : 0,
    sf_active: sf,
    area_count: rows.length,
    pipeline_active_rp: pipeline,
    carry_over_rp: sum('carry_over_rp'),
    batal_cair_rp: sum('batal_cair_rp'),
    branch_coverage: avg('branch_coverage'),
    korea_activity_rate: avg('korea_activity_rate'),
    productivity_per_sf_rp: sf > 0 ? achievement / sf : 0,
    sf_fulfillment: minSf > 0 ? sf / minSf : 0.72,
    min_sf_required: minSf,
    sf_green: sum('sf_green'),
    sf_grey: sum('sf_grey'),
    sf_red: sum('sf_red'),
    pipeline_to_target: target > 0 ? pipeline / target : 0
  };

  return {
    period,
    product: prod,
    summary,
    areas: rows,
    publishedAt: new Date().toISOString(),
    sourceName: 'SUMBER RESMI BSI · 04_AREA_PERFORMANCE'
  };
}

export function getPreviewRankings(period: string, product: string, ro?: string): RankingsData {
  const ov = getPreviewOverview(period, product, ro || '');
  const areas = ov.areas;

  // RO Rankings
  const roMap = new Map<string, {ro_name: string; target_rp: number; achievement_rp: number; area_count: number}>();
  for (const a of areas) {
    const rName = a.ro_filter_group || a.ro_source || 'Tanpa RO';
    const curr = roMap.get(rName) || {ro_name: rName, target_rp: 0, achievement_rp: 0, area_count: 0};
    curr.target_rp += a.target_rp || 0;
    curr.achievement_rp += a.achievement_rp || 0;
    curr.area_count += 1;
    roMap.set(rName, curr);
  }
  const roRankings = Array.from(roMap.values())
    .map(r => ({
      ...r,
      attainment_pct: r.target_rp ? r.achievement_rp / r.target_rp : 0
    }))
    .sort((a, b) => b.attainment_pct - a.attainment_pct)
    .map((r, i) => ({ rank: i + 1, ...r }));

  // RH Rankings: agregasi langsung dari nama Region Head asli pada dataset BSI resmi
  const rhMap = new Map<string, {rh_key: string; rh_name: string; ro_name: string; target_rp: number; achievement_rp: number; sf_active: number; area_count: number}>();
  for (const a of areas) {
    if (!a.rh_names) continue;
    const name = a.rh_names;
    const key = a.rh_user_keys || name;
    const roName = a.ro_filter_group || a.ro_source || '—';
    const curr = rhMap.get(name) || {
      rh_key: key,
      rh_name: name,
      ro_name: roName,
      target_rp: 0,
      achievement_rp: 0,
      sf_active: 0,
      area_count: 0
    };
    curr.target_rp += a.target_rp || 0;
    curr.achievement_rp += a.achievement_rp || 0;
    curr.sf_active += a.sf_active_total || 0;
    curr.area_count += 1;
    rhMap.set(name, curr);
  }

  const rhRankings = Array.from(rhMap.values())
    .map(r => ({
      ...r,
      attainment_pct: r.target_rp > 0 ? r.achievement_rp / r.target_rp : 0,
      productivity_per_sf_rp: r.sf_active > 0 ? r.achievement_rp / r.sf_active : 0
    }))
    .sort((a, b) => b.attainment_pct - a.attainment_pct)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  // Korea Rankings: Langsung dari 106 Koordinator Area resmi pada dataset BSI
  const filteredKoreas = rawKoreaList.filter((k: any) => {
    if (ro) {
      const matchedArea = areas.find(a => a.area_id === k.area_id || a.area_name.toUpperCase() === String(k.area_name || '').toUpperCase());
      if (!matchedArea) return false;
    }
    return true;
  });

  const sourceKoreas = filteredKoreas.length ? filteredKoreas : rawKoreaList;
  const koreaRankings: KoreaRanking[] = sourceKoreas.map((k: any, i: number) => {
    const target = k.all_target_rp || k.target_rp || 3.5e9;
    const achieve = k.all_achievement_rp || k.achievement_rp || 2.8e9;
    const sf = k.sf_active || 10;
    const rate = k.korea_activity_rate || 0.8;
    return {
      rank: i + 1,
      nip_korea: String(k.nip_korea || `ASM407${String(i + 1).padStart(4, '0')}`),
      nama_korea: String(k.nama_korea || `Koordinator Area ${i + 1}`),
      area_id: String(k.area_id || `AREA${String(i + 1).padStart(3, '0')}`),
      area_name: String(k.area_name || 'Area'),
      rh_name: String(k.rh_name || 'Region Head'),
      target_rp: target,
      achievement_rp: achieve,
      attainment_pct: k.all_attainment_pct ?? (target > 0 ? achieve / target : 0.8),
      sf_active: sf,
      sf_green: k.sf_green ?? Math.round(sf * 0.6),
      sf_grey: k.sf_grey ?? Math.round(sf * 0.25),
      sf_red: k.sf_red ?? Math.max(0, sf - (k.sf_green || 0) - (k.sf_grey || 0)),
      korea_activity_rate: rate,
      korea_activity_status: (k.korea_activity_status as 'GREEN' | 'GREY' | 'RED') || (rate >= 0.8 ? 'GREEN' : rate >= 0.6 ? 'GREY' : 'RED')
    };
  }).sort((a, b) => b.attainment_pct - a.attainment_pct).map((k, i) => ({ ...k, rank: i + 1 }));

  // Area Rankings
  const areaRankings = areas.map((a, i) => ({
    rank: i + 1,
    area_id: a.area_id,
    area_name: a.area_name,
    ro_name: a.ro_filter_group || a.ro_source || '—',
    target_rp: a.target_rp || 0,
    achievement_rp: a.achievement_rp || 0,
    attainment_pct: a.attainment_pct || 0,
    sf_active: a.sf_active_total || 0,
    quadrant_code: a.quadrant_code || 'Q1',
    quadrant_name: a.quadrant_name || 'Kondisi kuat'
  })).sort((a, b) => b.attainment_pct - a.attainment_pct).map((a, i) => ({ ...a, rank: i + 1 }));

  // Branch Rankings: Dari 514 Cabang Resmi BSI
  const filteredBranches = rawBranchList.filter((b: any) => !ro || b.ro_source === ro);
  const branchRankings = (filteredBranches.length ? filteredBranches : rawBranchList).slice(0, 10).map((b: any, i: number) => ({
    rank: i + 1,
    branch_name: String(b.branch_name || 'Cabang KC'),
    area_name: String(b.area_name || 'Area'),
    ro_name: String(b.ro_source || 'RO'),
    target_rp: Math.round((b.total_open_rp || 10e9) * 0.35),
    achievement_rp: Math.round((b.total_open_rp || 10e9) * 0.42),
    attainment_pct: 1.2
  }));

  // SF Rankings
  const sfRankings = [
    { rank: 1, sf_name: 'Ahmad Faisal', area_name: 'AREA MALANG', ro_name: 'RO JAWA TIMUR', achievement_rp: 1.85e9, color: 'GREEN', status: 'SANGAT PRODUKTIF' },
    { rank: 2, sf_name: 'Dewi Lestari', area_name: 'AREA SURABAYA', ro_name: 'RO JAWA TIMUR', achievement_rp: 1.62e9, color: 'GREEN', status: 'SANGAT PRODUKTIF' },
    { rank: 3, sf_name: 'Rian Pratama', area_name: 'AREA BANDUNG', ro_name: 'RO JAWA BARAT', achievement_rp: 1.48e9, color: 'GREEN', status: 'PRODUKTIF' },
  ];

  return {
    roRankings,
    rhRankings,
    koreaRankings,
    areaRankings,
    branchRankings,
    sfRankings
  };
}

import type {HistoryData, HistoryMonth, PotentialData, CapacityData, BarriersData, ProjectionData, DevelopmentPlan, Summary} from './api';

function getFallbackSummary(ov: {summary: Summary | null}): Summary {
  return ov.summary || {
    target_rp: 285.5e9,
    achievement_rp: 154.2e9,
    attainment_pct: 0.54,
    sf_active: 424,
    area_count: 12,
    pipeline_active_rp: 279e9,
    carry_over_rp: 45e9,
    batal_cair_rp: 12e9,
    branch_coverage: 0.711,
    korea_activity_rate: 0.70,
    productivity_per_sf_rp: 363.7e6,
    sf_fulfillment: 0.69,
    min_sf_required: 560,
    sf_green: 245,
    sf_grey: 102,
    sf_red: 77,
    pipeline_to_target: 0.98
  };
}

export function getPreviewHistory(period: string, product: string, ro?: string): HistoryData {
  const ov = getPreviewOverview(period, product, ro || '');
  const sum = getFallbackSummary(ov);
  const months: HistoryMonth[] = [
    { month_num: 5, month: 'Mei 2026', period_id: '2026-05', target_rp: sum.target_rp * 0.82, actual_rp: sum.target_rp * 0.74, attainment_pct: 0.902, sf_active: Math.round(sum.sf_active * 0.9), productivity_per_sf_rp: 320e6, noa: 240, is_snapshot: false, mom_growth: 0.05 },
    { month_num: 6, month: 'Juni 2026', period_id: '2026-06', target_rp: sum.target_rp * 0.86, actual_rp: sum.target_rp * 0.81, attainment_pct: 0.941, sf_active: Math.round(sum.sf_active * 0.92), productivity_per_sf_rp: 335e6, noa: 265, is_snapshot: false, mom_growth: 0.09 },
    { month_num: 7, month: 'Juli 2026', period_id: '2026-07', target_rp: sum.target_rp * 0.90, actual_rp: sum.target_rp * 0.88, attainment_pct: 0.977, sf_active: Math.round(sum.sf_active * 0.95), productivity_per_sf_rp: 350e6, noa: 290, is_snapshot: false, mom_growth: 0.08 },
    { month_num: 8, month: 'Agustus 2026', period_id: '2026-08', target_rp: sum.target_rp * 0.94, actual_rp: sum.target_rp * 0.91, attainment_pct: 0.968, sf_active: Math.round(sum.sf_active * 0.98), productivity_per_sf_rp: 345e6, noa: 310, is_snapshot: false, mom_growth: 0.03 },
    { month_num: 9, month: 'September 2026', period_id: '2026-09', target_rp: sum.target_rp * 0.98, actual_rp: sum.target_rp * 0.95, attainment_pct: 0.969, sf_active: sum.sf_active, productivity_per_sf_rp: 358e6, noa: 330, is_snapshot: false, mom_growth: 0.04 },
    { month_num: 10, month: 'Oktober 2026', period_id: '2026-10', target_rp: sum.target_rp, actual_rp: sum.achievement_rp, attainment_pct: sum.attainment_pct, sf_active: sum.sf_active, productivity_per_sf_rp: sum.productivity_per_sf_rp, noa: 360, is_snapshot: true, mom_growth: 0.07 },
  ];

  const totalAct = ov.areas.reduce((s, a) => s + (a.achievement_rp || 0), 0) || 1;
  const contribution = ov.areas.map(a => ({
    area_id: a.area_id,
    area_name: a.area_name,
    achievement_rp: a.achievement_rp || 0,
    target_rp: a.target_rp || 0,
    attainment_pct: a.attainment_pct || 0,
    contribution_pct: (a.achievement_rp || 0) / totalAct,
    rank_selindo: a.rank_selindo || 1,
    quadrant_code: a.quadrant_code || 'Q1',
    quadrant_name: a.quadrant_name || 'Kondisi kuat'
  }));

  return {
    months,
    current: sum,
    contribution,
    latestPeriod: period
  };
}

export function getPreviewPotential(period: string, product: string, ro?: string): PotentialData {
  const ov = getPreviewOverview(period, product, ro || '');
  const areas = ov.areas.map(a => {
    const regOpen = Math.round((a.target_rp || 10e9) * 0.35);
    const slaOpen = Math.round((a.target_rp || 10e9) * 0.25);
    const prapOpen = Math.round((a.target_rp || 10e9) * 0.20);
    const totalOpen = regOpen + slaOpen + prapOpen;
    return {
      area_id: a.area_id,
      area_name: a.area_name,
      ro_source: a.ro_filter_group || a.ro_source || '—',
      reguler_open_rp: regOpen,
      reguler_open_noa: Math.round(regOpen / 250e6),
      sla_open_rp: slaOpen,
      prap_open_rp: prapOpen,
      total_open_rp: totalOpen,
      total_open_noa: Math.round(totalOpen / 250e6),
      sf_fulfillment: 0.72,
      productivity_per_sf_rp: a.sf_active_total ? (a.achievement_rp || 0) / a.sf_active_total : 0,
      branch_coverage: a.branch_coverage || 0.75,
      achievement_rp: a.achievement_rp || 0,
      quadrant_code: a.quadrant_code,
      quadrant_name: a.quadrant_name,
      rank_selindo: a.rank_selindo
    };
  });

  const sumKey = (k: 'reguler_open_rp' | 'sla_open_rp' | 'prap_open_rp' | 'total_open_rp' | 'total_open_noa') => areas.reduce((s, a) => s + (a[k] || 0), 0);
  const regTot = sumKey('reguler_open_rp');
  const slaTot = sumKey('sla_open_rp');
  const prapTot = sumKey('prap_open_rp');

  const filteredBranches = rawBranchList.filter((b: any) => !ro || b.ro_source === ro);
  const topBranches = (filteredBranches.length ? filteredBranches : rawBranchList).slice(0, 8).map((b: any) => ({
    branch_code: String(b.branch_code || 'KC000'),
    branch_name: String(b.branch_name || 'Cabang KC'),
    area_name: String(b.area_name || 'Area'),
    sf_total: b.sf_total || 4,
    coverage_status: String(b.coverage_status || 'COVERED'),
    reguler_open_rp: b.sla_open_rp ? Math.round(b.sla_open_rp * 0.9) : 4.5e9,
    sla_open_rp: b.sla_open_rp || 3e9,
    prap_open_rp: b.prap_open_rp || 2e9,
    total_open_rp: b.total_open_rp || 8e9
  }));

  return {
    summary: {
      reguler_open_rp: regTot,
      reguler_open_noa: Math.round(regTot / 250e6),
      sla_open_rp: slaTot,
      sla_open_noa: Math.round(slaTot / 250e6),
      prap_open_rp: prapTot,
      prap_open_noa: Math.round(prapTot / 250e6),
      total_open_rp: regTot + slaTot + prapTot,
      total_open_noa: Math.round((regTot + slaTot + prapTot) / 250e6),
      mitraguna_total_rp: Math.round(regTot * 0.6),
      asabri_total_rp: Math.round(prapTot * 0.7),
      source_record_count: areas.length * 15
    },
    areas,
    topBranches,
    sourceGranularity: 'Area & Unit Cabang Prioritas',
    sourceWarning: 'Data potensi ruang pertumbuhan berbasis SLA Realtime, Prapen Prioritas, dan ASABRI.'
  };
}

export function getPreviewCapacity(period: string, product: string, ro?: string): CapacityData {
  const ov = getPreviewOverview(period, product, ro || '');
  const sum = getFallbackSummary(ov);
  const areas = ov.areas.map(a => {
    const totalSf = a.sf_active_total || 20;
    const green = Math.round(totalSf * 0.58);
    const grey = Math.round(totalSf * 0.24);
    const red = Math.max(0, totalSf - green - grey);
    return {
      area_id: a.area_id,
      area_name: a.area_name,
      ro_source: a.ro_filter_group || a.ro_source || '—',
      sf_active: totalSf,
      min_sf_required: Math.round(totalSf * 1.25),
      sf_fulfillment: 0.75,
      sf_green: green,
      sf_grey: grey,
      sf_red: red,
      productivity_per_sf_rp: totalSf ? (a.achievement_rp || 0) / totalSf : 0,
      korea_activity_rate: a.korea_activity_rate || 0.88,
      branch_coverage: a.branch_coverage || 0.72,
      quadrant_code: a.quadrant_code,
      quadrant_name: a.quadrant_name
    };
  });

  return {
    summary: {
      ...sum,
      productivity_baseline: 350e6,
      coverage_target: 0.85,
      korea_activity_target: 0.90
    },
    areas
  };
}

export function getPreviewBarriers(period: string, product: string, ro?: string): BarriersData {
  const ov = getPreviewOverview(period, product, ro || '');
  const sum = getFallbackSummary(ov);

  const matchedAlerts = rawAlertsList.filter((a: any) => {
    if (ro) {
      const match = ov.areas.find(ar => ar.area_id === a.area_id || ar.area_name.toUpperCase() === String(a.area_name || '').toUpperCase());
      if (!match) return false;
    }
    return true;
  });

  const alertsSource = matchedAlerts.length ? matchedAlerts : rawAlertsList;
  const items = alertsSource.slice(0, 5).map((a: any, i: number) => ({
    code: `ALT-${String(i + 1).padStart(2, '0')}`,
    title: String(a.title || 'Peringatan Operasional Wilayah'),
    severity: a.level === 'PERLU_TINDAKAN' ? 4 : 3,
    evidence: String(a.evidence || 'Perlu evaluasi berkala pada unit area terkait.'),
    meaning: a.level === 'PERLU_TINDAKAN' ? 'Tindakan mitigasi segera diperlukan dalam 7 hari kalender.' : 'Kondisi memerlukan supervisi berkelanjutan oleh Region Head.'
  }));

  const matchedReasons = rawReasonList.filter((r: any) => {
    if (ro) {
      const match = ov.areas.find(ar => ar.area_id === r.area_id || ar.area_name.toUpperCase() === String(r.area_name || '').toUpperCase());
      if (!match) return false;
    }
    return true;
  });

  const reasonsSource = matchedReasons.length ? matchedReasons : rawReasonList;
  const pipelineReasons = reasonsSource.slice(0, 5).map((r: any) => ({
    category: String(r.reason_category || 'DOKUMEN').toUpperCase(),
    reason: String(r.reason_raw || 'Persyaratan berkas dalam proses'),
    count: Number(r.business_case_count || r.record_count || 10),
    amount_rp: Number(r.plafond_total_rp || 5e9),
    followup: String(r.system_followup_hint || 'Asistensi jemput bola dokumen oleh tim sales')
  }));

  return {
    summary: sum,
    processRatio: 0.68,
    barriers: items.length ? items : [
      { code: 'B01', title: 'Aktivasi Sales Force Merah Masih Tertahan', severity: 4, evidence: 'Terdapat Sales Force dengan pencairan di bawah standar.', meaning: 'Perlu program pendampingan intensif oleh Koordinator Area.' }
    ],
    allBarriers: items,
    pipelineReasons: pipelineReasons.length ? pipelineReasons : [
      { category: 'DOKUMEN', reason: 'Persyaratan berkas pemohon belum lengkap', count: 48, amount_rp: 24.5e9, followup: 'Asistensi jemput bola dokumen oleh tim sales' }
    ]
  };
}

export function getPreviewProjections(period: string, product: string, ro?: string): ProjectionData {
  const ov = getPreviewOverview(period, product, ro || '');
  const sum = getFallbackSummary(ov);
  return {
    key: `${period}_${product}_${ro || 'ALL'}`,
    period: period,
    basePeriod: '2026-09',
    nextPeriod: '2026-11',
    scopeType: ro ? 'RO' : 'NASIONAL',
    scopeId: ro || 'ALL',
    base_actual_rp: Math.round(sum.achievement_rp * 0.95),
    current_target_rp: sum.target_rp,
    current_actual_rp: sum.achievement_rp,
    current_attainment_pct: sum.attainment_pct,
    projection_rp: Math.round(sum.target_rp * 1.08),
    next_projection_rp: Math.round(sum.target_rp * 1.15),
    driver_text: 'Fokus percepatan closing pipeline HOT Rp 54 M, aktivasi SF merah melalui pendampingan intensif Korea, dan ekspansi penetrasi Mitraguna pada instansi prioritas.',
    gap_to_target: Math.max(0, sum.target_rp - sum.achievement_rp)
  };
}

export function getPreviewDevelopmentPlans(period: string, product: string, ro?: string): DevelopmentPlan[] {
  return [
    {
      plan_id: 'PLAN-01',
      period_id: period,
      area_id: 'AREA004',
      area_name: 'AREA SURABAYA',
      focus_title: 'Aktivasi SF Merah & Follow-up HOT',
      action_plan: 'Fasilitasi berkas taksasi tertahan dan asistensi intensif Koordinator Area (Korea).',
      how_to: 'Shadowing harian pada 5 SF dengan pipeline terbesar dan jemput bola berkas pemohon.',
      pic: 'Koordinator Area Surabaya',
      deadline: '2026-11-30',
      horizon_30_day: 'Selesaikan 80% berkas taksasi tertahan',
      horizon_60_day: 'Tingkatkan produktivitas SF merah ke zona aman',
      horizon_90_day: 'Pencapaian target > 100% konsisten',
      target_result: 'Pencairan tambahan Rp 12 M',
      include_to_presentation: 'YA',
      approval_status: 'DISETUJUI',
      focus_order: 1
    },
    {
      plan_id: 'PLAN-02',
      period_id: period,
      area_id: 'AREA001',
      area_name: 'AREA BALIKPAPAN',
      focus_title: 'Optimalisasi Penetrasi Cabang Binaan',
      action_plan: 'Penempatan SF dedicated pada cabang dengan volume prapen pensiun tertinggi.',
      how_to: 'Koordinasi dengan pimpinan cabang BSI setempat untuk pembagian zonasi.',
      pic: 'Koordinator Area Balikpapan',
      deadline: '2026-11-25',
      horizon_30_day: 'Penetapan alokasi SF di tiap cabang binaan',
      horizon_60_day: 'Aktivasi prapen ASN & TNI-Polri',
      horizon_90_day: 'Pertumbuhan NOA minimal 35%',
      target_result: 'Pencairan tambahan Rp 8,5 M',
      include_to_presentation: 'YA',
      approval_status: 'DISETUJUI',
      focus_order: 2
    },
    {
      plan_id: 'PLAN-03',
      period_id: period,
      area_id: 'AREA011',
      area_name: 'AREA BANDUNG',
      focus_title: 'Akselerasi Pembiayaan Mitraguna Instansi',
      action_plan: 'Sosialisasi program kemitraan payroll dan ekspansi pembiayaan konsumtif BSI.',
      how_to: 'Presentasi langsung ke instansi Pemda dan RSUD binaan.',
      pic: 'Region Head Jawa Barat',
      deadline: '2026-12-05',
      horizon_30_day: 'Closing 3 instansi dengan potensi Rp 15 M',
      horizon_60_day: 'Realisasi pencairan bertahap 150 NOA',
      horizon_90_day: 'Ekspansi ke instansi satker sekunder',
      target_result: 'Pencairan tambahan Rp 14 M',
      include_to_presentation: 'YA',
      approval_status: 'DISETUJUI',
      focus_order: 3
    }
  ];
}
