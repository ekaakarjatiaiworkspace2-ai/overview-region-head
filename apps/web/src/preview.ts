import type {AreaKpi, KoreaRanking, Overview, RankingsData, UserProfile} from './api';

/**
 * Visual-only local preview. These are synthetic figures: NOT APPROVED BUSINESS DATA.
 * Never publish them or allow them to be treated as production records.
 */
export const previewPeriods = ['2026-10', '2026-09'];
export const previewUser: UserProfile = {id:'preview-only', displayName:'Peninjau Tampilan', role:'ADMIN'};
const areas: Array<[string,string,string,number,number,number,number,string]> = [
  ['AREA001','AREA BALIKPAPAN','RO KALIMANTAN',19.7,9.9,28,15,'Q3'],
  ['AREA002','AREA BANJARMASIN','RO KALIMANTAN',24.5,17.1,36,24,'Q1'],
  ['AREA003','AREA MALANG','RO JAWA TIMUR',28.2,18.4,44,31,'Q1'],
  ['AREA004','AREA SURABAYA','RO JAWA TIMUR',31.4,13.8,53,38,'Q4'],
  ['AREA005','AREA JEMBER','RO JAWA TIMUR',17.3,8.4,24,17,'Q3'],
  ['AREA006','AREA SEMARANG','RO JAWA TENGAH',27.5,14.2,29,21,'Q2'],
  ['AREA007','AREA SOLO','RO JAWA TENGAH',18.1,12.8,31,19,'Q1'],
  ['AREA008','AREA YOGYAKARTA','RO JAWA TENGAH',22.3,10.9,40,26,'Q4'],
  ['AREA009','AREA MAKASSAR','RO SULAWESI',28.7,14.1,38,24,'Q2'],
  ['AREA010','AREA MANADO','RO SULAWESI',16.9,7.9,25,16,'Q3'],
  ['AREA011','AREA BANDUNG','RO JAWA BARAT',29.3,16.9,42,28,'Q1'],
  ['AREA012','AREA BOGOR','RO JAWA BARAT',21.6,9.8,34,20,'Q4'],
];
export const previewRos=[...new Set(areas.map(a=>a[2]))].sort();
const quadrantNames:Record<string,string> = {Q1:'Kondisi kuat', Q2:'Perlu tambahan tim', Q3:'Perlu perhatian utama', Q4:'Produktivitas perlu ditingkatkan'};
export function getPreviewOverview(period:string, product:string, ro:string):Overview {
  const previous=period==='2026-09';
  const rows:AreaKpi[]=areas.filter(a=>!ro||a[2]===ro).map(([id,name,region,targetB,actualB,sf,pipelineB,quad],i)=>{
    const productTargetFactor=product==='REGULER'?0.34:product==='MITRAGUNA'?0.66:1;
    const productActualFactor=product==='REGULER'?0.27:product==='MITRAGUNA'?0.73:1;
    const monthFactor=previous?1.09:1;
    const target=targetB*1e9*productTargetFactor;
    const achievement=actualB*1e9*productActualFactor*monthFactor;
    return {
      area_id:id,area_name:name,ro_filter_group:region,ro_source:region,
      rank_selindo:i+1,target_rp:target,achievement_rp:achievement,
      attainment_pct:target>0?achievement/target:null,
      sf_active_total:sf,pipeline_active_rp:pipelineB*1e9*productTargetFactor,
      branch_coverage:Math.min(0.95,0.58+(i%5)*0.075),
      korea_activity_rate:Math.min(0.98,0.52+(i%4)*0.12),
      quadrant_code:quad,quadrant_name:quadrantNames[quad],
      source_status:'SIMULASI',condition_summary:'Contoh untuk pengujian tampilan',
    };
  });
  const sum=(key:'target_rp'|'achievement_rp'|'sf_active_total'|'pipeline_active_rp')=>rows.reduce((v,r)=>v+(r[key]||0),0);
  const target=sum('target_rp');const achievement=sum('achievement_rp');const sf=sum('sf_active_total');
  const average=(key:'branch_coverage'|'korea_activity_rate')=>rows.length?rows.reduce((v,r)=>v+(r[key]||0),0)/rows.length:null;
  const summary={
    target_rp:target,achievement_rp:achievement,attainment_pct:target?achievement/target:0,
    sf_active:sf,area_count:rows.length,pipeline_active_rp:sum('pipeline_active_rp'),
    branch_coverage:average('branch_coverage'),korea_activity_rate:average('korea_activity_rate'),
    productivity_per_sf_rp:sf?achievement/sf:0,sf_fulfillment:0.69,
  };
  return {period,product,summary,areas:rows,publishedAt:null,sourceName:'SIMULASI LOKAL — BUKAN DATA PRODUKSI'};
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

  // RH Rankings
  const rhNames = ['Budi Santoso', 'Hendro Wijaya', 'Sugi H.', 'M. Villar', 'Fandi B.', 'Ahmad Fauzi'];
  const rhRankings = rhNames.map((name, i) => {
    const target = 15e9 + i * 2e9;
    const achieve = 16e9 + (5 - i) * 2.5e9;
    return {
      rank: i + 1,
      rh_key: `RH00${i + 1}`,
      rh_name: name,
      ro_name: previewRos[i % previewRos.length],
      target_rp: target,
      achievement_rp: achieve,
      attainment_pct: achieve / target,
      sf_active: 25 + i * 5,
      productivity_per_sf_rp: achieve / (25 + i * 5),
      area_count: 2 + (i % 3)
    };
  }).sort((a, b) => b.attainment_pct - a.attainment_pct).map((r, i) => ({ ...r, rank: i + 1 }));

  // Korea Rankings
  const sampleKoreas = [
    { name: 'Tarisa Jesika Harmaini', areaId: 'AREA010', areaName: 'AREA MANADO', rh: 'Ahmad Fauzi', sf: 12, target: 2.9e9, achieve: 7.37e9, status: 'GREEN', rate: 0.95 },
    { name: 'Chamari Aksar', areaId: 'AREA003', areaName: 'AREA MALANG', rh: 'Hendro Wijaya', sf: 15, target: 2.9e9, achieve: 6.92e9, status: 'GREEN', rate: 0.92 },
    { name: 'Astati Saflia', areaId: 'AREA009', areaName: 'AREA MAKASSAR', rh: 'Ahmad Fauzi', sf: 18, target: 6.1e9, achieve: 14.02e9, status: 'GREEN', rate: 0.88 },
    { name: 'Rico Triyadi', areaId: 'AREA011', areaName: 'AREA BANDUNG', rh: 'Budi Santoso', sf: 20, target: 9.6e9, achieve: 21.5e9, status: 'GREEN', rate: 0.96 },
    { name: 'Sri Wulandari', areaId: 'AREA004', areaName: 'AREA SURABAYA', rh: 'Hendro Wijaya', sf: 14, target: 2.6e9, achieve: 5.8e9, status: 'GREEN', rate: 0.90 },
    { name: 'M. Abduh', areaId: 'AREA001', areaName: 'AREA BALIKPAPAN', rh: 'M. Villar', sf: 22, target: 13.6e9, achieve: 28.4e9, status: 'GREEN', rate: 0.85 },
    { name: 'Totok Agus Sopiyan', areaId: 'AREA007', areaName: 'AREA SOLO', rh: 'Fandi B.', sf: 16, target: 6.5e9, achieve: 11.2e9, status: 'GREY', rate: 0.74 },
    { name: 'Mirda Ayu Citra Daniar', areaId: 'AREA005', areaName: 'AREA JEMBER', rh: 'Sugi H.', sf: 10, target: 3.7e9, achieve: 4.8e9, status: 'GREY', rate: 0.65 },
    { name: 'Mufidatur Rodiana', areaId: 'AREA002', areaName: 'AREA BANJARMASIN', rh: 'M. Villar', sf: 8, target: 2.6e9, achieve: 2.9e9, status: 'RED', rate: 0.45 },
    { name: "Ma'rifatul Azizah", areaId: 'AREA006', areaName: 'AREA SEMARANG', rh: 'Fandi B.', sf: 9, target: 2.2e9, achieve: 2.1e9, status: 'RED', rate: 0.42 },
  ];

  const koreaRankings: KoreaRanking[] = sampleKoreas.map((k, i) => {
    const attain = k.achieve / k.target;
    return {
      rank: i + 1,
      nip_korea: `407${1000 + i}`,
      nama_korea: k.name,
      area_id: k.areaId,
      area_name: k.areaName,
      rh_name: k.rh,
      target_rp: k.target,
      achievement_rp: k.achieve,
      attainment_pct: attain,
      sf_active: k.sf,
      sf_green: Math.round(k.sf * 0.6),
      sf_grey: Math.round(k.sf * 0.25),
      sf_red: Math.max(0, k.sf - Math.round(k.sf * 0.6) - Math.round(k.sf * 0.25)),
      korea_activity_rate: k.rate,
      korea_activity_status: k.status
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

  // Branch Rankings
  const branchRankings = [
    { rank: 1, branch_name: 'KC SURABAYA DARMO', area_name: 'AREA SURABAYA', ro_name: 'RO JAWA TIMUR', target_rp: 8e9, achievement_rp: 12.5e9, attainment_pct: 1.56 },
    { rank: 2, branch_name: 'KC BANDUNG ASIA AFRIKA', area_name: 'AREA BANDUNG', ro_name: 'RO JAWA BARAT', target_rp: 7.5e9, achievement_rp: 10.8e9, attainment_pct: 1.44 },
    { rank: 3, branch_name: 'KC MAKASSAR RATULANGI', area_name: 'AREA MAKASSAR', ro_name: 'RO SULAWESI', target_rp: 6e9, achievement_rp: 8.2e9, attainment_pct: 1.36 },
  ];

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

  const topBranches = [
    { branch_code: 'KC001', branch_name: 'KC SURABAYA DARMO', area_name: 'AREA SURABAYA', sf_total: 18, coverage_status: 'OPTIMAL', reguler_open_rp: 5.4e9, sla_open_rp: 3.2e9, prap_open_rp: 2.1e9, total_open_rp: 10.7e9 },
    { branch_code: 'KC002', branch_name: 'KC BANDUNG ASIA AFRIKA', area_name: 'AREA BANDUNG', sf_total: 16, coverage_status: 'OPTIMAL', reguler_open_rp: 4.8e9, sla_open_rp: 2.9e9, prap_open_rp: 1.9e9, total_open_rp: 9.6e9 },
    { branch_code: 'KC003', branch_name: 'KC MAKASSAR RATULANGI', area_name: 'AREA MAKASSAR', sf_total: 14, coverage_status: 'CUKUP', reguler_open_rp: 4.2e9, sla_open_rp: 2.5e9, prap_open_rp: 1.6e9, total_open_rp: 8.3e9 },
    { branch_code: 'KC004', branch_name: 'KC MALANG KAWI', area_name: 'AREA MALANG', sf_total: 12, coverage_status: 'OPTIMAL', reguler_open_rp: 3.8e9, sla_open_rp: 2.2e9, prap_open_rp: 1.5e9, total_open_rp: 7.5e9 },
  ];

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
  const items = [
    { code: 'B01', title: 'Aktivasi Sales Force Merah Masih Tertahan', severity: 4, evidence: 'Terdapat 58 Sales Force (14%) dengan pencairan di bawah standar minimal Rp 150 jt/bulan.', meaning: 'Perlu program pendampingan intensif dan evaluasi mingguan oleh Koordinator Area.' },
    { code: 'B02', title: 'Pipeline Tertahan di Tahap Dokumen & Taksasi', severity: 3, evidence: 'Sebesar Rp 54 M berkas taksasi tertahan > 14 hari di cabang pembiayaan.', meaning: 'Diperlukan koordinasi percepatan jadwal taksasi dan jemput bola berkas pemohon.' },
    { code: 'B03', title: 'Rasio Cakupan Cabang Belum Merata', severity: 3, evidence: '28% cabang binaan memiliki rasio coverage di bawah 65%.', meaning: 'Penugasan dan rotasi Sales Force aktif ke cabang-cabang berpotensi tinggi.' },
    { code: 'B04', title: 'Aktivitas Visit Koordinator Area (Korea)', severity: 2, evidence: 'Rata-rata aktivitas visit Korea baru mencapai 70% dari target minimal 85%.', meaning: 'Pengawasan logbook harian Korea dan checklist supervisi lapangan.' }
  ];

  const pipelineReasons = [
    { category: 'DOKUMEN', reason: 'Persyaratan berkas pemohon belum lengkap', count: 48, amount_rp: 24.5e9, followup: 'Asistensi jemput bola dokumen oleh SF pendamping' },
    { category: 'TAKSASI', reason: 'Menunggu jadwal taksasi jaminan appraisal', count: 32, amount_rp: 18.2e9, followup: 'Eskalasi jadwal prioritas ke Pincab BSI setempat' },
    { category: 'VERIFIKASI', reason: 'Proses konfirmasi instansi/bendahara gaji mitra', count: 21, amount_rp: 11.3e9, followup: 'Kunjungan bersama Korea ke instansi mitra BUMN/ASN' },
  ];

  return {
    summary: sum,
    processRatio: 0.68,
    barriers: items,
    allBarriers: items,
    pipelineReasons
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
