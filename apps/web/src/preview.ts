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
