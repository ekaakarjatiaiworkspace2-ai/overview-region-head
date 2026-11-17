import {getPreviewOverview} from './preview';
import type {AreaKpi, Overview} from './api';

/**
 * VISUAL DEMO ONLY. This is NOT a port of the approved buildPresentationDraft()
 * business calculation. It is a presentation *shape* driven by synthetic data.
 * Legacy slide IDs deliberately match the V5.4 story editor where possible.
 */
export type SlideKind = 'cover'|'summary'|'product'|'capacity'|'ranking'|'pipeline'|'recommendation'|'actions';
export interface DemoSlide {
  id:string; title:string; kind:SlideKind; product:'ALL'|'REGULER'|'MITRAGUNA';
  headline:string; explanation:string; supportingText:string; visible:boolean;
  sourceHeadline:string; sourceExplanation:string; sourceSupportingText:string;
}
export type SlideEdit = Pick<DemoSlide,'headline'|'explanation'|'supportingText'|'visible'>;
export type SlideEdits = Record<string,SlideEdit>;
export interface PresentationData { period:string; product:string; ro:string; overview:Overview; regular:Overview; mitraguna:Overview; }

export const formatRupiah=(n:number|null|undefined):string=> {
  if(n===null||n===undefined)return '—';
  const negative=n<0?'−':'';const a=Math.abs(n);
  if(a>=1e12)return `${negative}Rp ${(a/1e12).toLocaleString('id-ID',{maximumFractionDigits:2})} T`;
  if(a>=1e9)return `${negative}Rp ${(a/1e9).toLocaleString('id-ID',{maximumFractionDigits:1})} M`;
  if(a>=1e6)return `${negative}Rp ${(a/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})} jt`;
  return `${negative}Rp ${a.toLocaleString('id-ID',{maximumFractionDigits:0})}`;
};
export const formatPercent=(n:number|null|undefined):string=> n===null||n===undefined?'—':`${(n*100).toLocaleString('id-ID',{maximumFractionDigits:1})}%`;
export const formatPeriod=(p:string)=>new Date(`${p}-01T00:00:00Z`).toLocaleDateString('id-ID',{timeZone:'UTC',month:'long',year:'numeric'});
export const topAreas=(rows:AreaKpi[],count=5)=>[...rows].sort((a,b)=>(b.achievement_rp??-1)-(a.achievement_rp??-1)).slice(0,count);

export function getDemoPresentationData(period:string,product:string,ro:string):PresentationData {
  return {period,product,ro,overview:getPreviewOverview(period,product,ro),regular:getPreviewOverview(period,'REGULER',ro),mitraguna:getPreviewOverview(period,'MITRAGUNA',ro)};
}

function slide(id:string,title:string,kind:SlideKind,product:DemoSlide['product'],headline:string,explanation:string,supportingText=''):DemoSlide {
  return {id,title,kind,product,headline,explanation,supportingText,visible:true,
    sourceHeadline:headline,sourceExplanation:explanation,sourceSupportingText:supportingText};
}

export function buildDemoSlides(data:PresentationData):DemoSlide[] {
  const {overview,product,period,ro}=data,s=overview.summary;
  const scope=ro||'Seluruh Regional (Simulasi)';
  const periodLabel=formatPeriod(period);
  const products:DemoSlide['product'][]=product==='ALL'?['REGULER','MITRAGUNA']:[product as DemoSlide['product']];
  const slides:DemoSlide[]=[
    slide('cover','Sampul','cover','ALL','Review Kinerja Bisnis RH',`Tinjauan ${scope} · Periode data ${periodLabel}.`,'Lima pilar bisnis menjadi kerangka pembacaan review.'),
    slide('executive-summary','Ringkasan Utama','summary','ALL','Kondisi bisnis dalam satu pandangan',`Ringkasan hasil, target, pipeline dan kapasitas tim pada cakupan ${scope}.`,'Gunakan angka ringkasan untuk mengarahkan diskusi, bukan menggantikan rincian sumber.'),
  ];
  products.forEach(p=>slides.push(slide(`overview-${p.toLowerCase()}`,`Kinerja ${p==='REGULER'?'Reguler':'Mitraguna'}`,'product',p,
    `Review realisasi ${p==='REGULER'?'Reguler':'Mitraguna'}`,
    'Bandingkan pencairan dengan target, lalu lihat kontribusi Area dan jumlah SF.',
    'Angka dalam demo adalah simulasi; rumus produksi tetap mengikuti V5.4.')));
  slides.push(slide('resources-pipeline-closed','Tim & Pipeline','capacity','ALL',
    'Kapasitas tim dan pipeline perlu dibaca bersama',
    'Tinjau jumlah SF, cakupan cabang, aktivitas Korea dan posisi pipeline aktif.',
    'Detail HOT/Incoming/Carry Over/Batal Cair belum tersedia dalam dataset simulasi.'));
  slides.push(slide('ranking-wilayah','Posisi Kinerja Wilayah','ranking','ALL',
    'Area dengan kontribusi pencairan terbesar',
    'Perbandingan Area pada cakupan yang dipilih. Dalam demo hanya ranking Area, bukan RO/RH/Cabang/Korea/SF.',
    'Ranking penuh akan mengikuti endpoint V5.4 ketika migrasi backend selesai.'));
  products.forEach(p=>{
    const label=p==='REGULER'?'Reguler':'Mitraguna';
    slides.push(slide(`pipeline-analysis-${p.toLowerCase()}`,`Analisa Pipeline · ${label}`,'pipeline',p,
      `Pipeline aktif ${label}`,
      'Nilai pipeline aktif tersedia sebagai total simulasi. Komposisi tahap dan penyebab tertahan belum tersedia.',
      'Jangan menafsirkan pipeline sebagai pencairan aktual.'));
    slides.push(slide(`pipeline-current-${p.toLowerCase()}`,`Pipeline Berjalan · ${label}`,'pipeline',p,
      `Pemantauan pipeline berjalan ${label}`,
      'Rincian pipeline bulan berjalan, proyeksi dan status pengajuan menunggu modul data lengkap.',
      'Sementara, slide hanya menampilkan total pipeline simulasi dan kontribusi Area.'));
  });
  slides.push(slide('recommendation','Fokus Berikutnya','recommendation','ALL',
    'Tentukan fokus wilayah berikutnya',
    `Gunakan gap target dan kondisi Area sebagai bahan pembahasan. ${s?`${s.area_count} Area berada dalam cakupan slide.`:''}`,
    'Teks rekomendasi pada demo adalah contoh narasi, bukan keputusan manajemen.'));
  slides.push(slide('langkah','Langkah Pengembangan','actions','ALL',
    'Langkah pengembangan dan tindak lanjut',
    'Pada demo ini, Action Plan RH belum terhubung. Gunakan editor untuk mencoba menyiapkan pesan penutup.',
    'Pada produksi, rencana wajib berasal dari sumber Action Plan terotorisasi.'));
  return slides;
}

export function mergeStoryEdits(slides:DemoSlide[],edits:SlideEdits):DemoSlide[] {
  return slides.map(s=>{
    const edit=edits[s.id];if(!edit)return s;
    return {...s, headline:typeof edit.headline==='string'?edit.headline:s.headline,
      explanation:typeof edit.explanation==='string'?edit.explanation:s.explanation,
      supportingText:typeof edit.supportingText==='string'?edit.supportingText:s.supportingText,
      visible:typeof edit.visible==='boolean'?edit.visible:s.visible};
  });
}

export const visibleSlides=(slides:DemoSlide[])=>slides.filter(s=>s.visible);
export const demoStoryStorageKey=(period:string,product:string,ro:string)=>`eka.demo.story.v04.${encodeURIComponent(`${period}|${product}|${ro}`)}`;
