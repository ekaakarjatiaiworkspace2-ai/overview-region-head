import {useMemo, useState} from 'react';
import {Users, Award, BarChart2} from 'lucide-react';
import type {CapacityData} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function CapacityView({data, loading}: {data: CapacityData | null; loading: boolean}) {
  const [filterColor, setFilterColor] = useState<'ALL' | 'GAP' | 'OK'>('ALL');

  const s = data?.summary;
  const filteredAreas = useMemo(() => {
    const list = data?.areas || [];
    if (!list.length) return [];
    if (filterColor === 'GAP') return list.filter(a => a.sf_fulfillment < 0.9);
    if (filterColor === 'OK') return list.filter(a => a.sf_fulfillment >= 0.9);
    return list;
  }, [data?.areas, filterColor]);

  if (loading) {
    return <div className="center-loading">Memuat evaluasi kapasitas tim...</div>;
  }
  if (!data || !s) {
    return <div className="blank-slate"><Users size={32}/><h2>Data kapasitas belum tersedia</h2></div>;
  }

  const totalSf = Math.max(1, (s.sf_green || 0) + (s.sf_grey || 0) + (s.sf_red || 0));
  const greenPct = Math.round(((s.sf_green || 0) / totalSf) * 100);
  const greyPct = Math.round(((s.sf_grey || 0) / totalSf) * 100);
  const redPct = 100 - greenPct - greyPct;

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PILAR 3 · KAPASITAS TIM</div>
          <h1>Kondisi & Kapasitas Tim Sales</h1>
          <p>Evaluasi pemenuhan jumlah SF, distribusi kualitas performa, cakupan cabang, dan kedisiplinan aktivitas.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat stat-highlight">
          <div className="stat-label">PEMENUHAN SF</div>
          <div className="stat-value">{idPct.format(s.sf_fulfillment)}</div>
          <div className="stat-foot">{s.sf_active} aktif dari {s.min_sf_required || '—'} kuota min</div>
        </div>
        <div className="stat">
          <div className="stat-label">PRODUKTIVITAS / SF</div>
          <div className="stat-value">{smallMoney(s.productivity_per_sf_rp)}</div>
          <div className="stat-foot">Standar baseline: Rp 300 jt / bulan</div>
        </div>
        <div className="stat">
          <div className="stat-label">CAKUPAN CABANG</div>
          <div className="stat-value">{idPct.format(s.branch_coverage ?? 0)}</div>
          <div className="stat-foot">Target minimal ideal: 90%</div>
        </div>
        <div className="stat">
          <div className="stat-label">AKTIVITAS KOREA</div>
          <div className="stat-value">{idPct.format(s.korea_activity_rate ?? 0)}</div>
          <div className="stat-foot">Target kedisiplinan penggerak: 80%</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-heading">
            <Award size={18} />
            <h3>Komposisi Kualitas Sales Force (SF)</h3>
          </div>
          <p className="detail-intro">Sebaran tingkat performa pencapaian target individual SF.</p>

          <div style={{marginTop: '12px'}}>
            <div style={{display: 'flex', height: '18px', borderRadius: '4px', overflow: 'hidden', background: '#e2e8f0'}}>
              <div style={{width: `${greenPct}%`, background: '#10b981', transition: 'width 0.3s'}} title={`Hijau: ${s.sf_green} SF`} />
              <div style={{width: `${greyPct}%`, background: '#94a3b8', transition: 'width 0.3s'}} title={`Abu-abu: ${s.sf_grey} SF`} />
              <div style={{width: `${redPct}%`, background: '#ef4444', transition: 'width 0.3s'}} title={`Merah: ${s.sf_red} SF`} />
            </div>

            <div style={{display: 'flex', gap: '20px', marginTop: '14px', flexWrap: 'wrap'}}>
              <div>
                <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '6px'}} />
                <span style={{fontSize: '11px', color: '#64748b'}}>SF Hijau (≥80%): </span>
                <strong style={{fontSize: '11.5px', marginLeft: '4px'}}>{s.sf_green ?? 0} SF ({greenPct}%)</strong>
              </div>
              <div>
                <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', marginRight: '6px'}} />
                <span style={{fontSize: '11px', color: '#64748b'}}>SF Abu-abu (50-80%): </span>
                <strong style={{fontSize: '11.5px', marginLeft: '4px'}}>{s.sf_grey ?? 0} SF ({greyPct}%)</strong>
              </div>
              <div>
                <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginRight: '6px'}} />
                <span style={{fontSize: '11px', color: '#64748b'}}>SF Merah (&lt;50%): </span>
                <strong style={{fontSize: '11.5px', marginLeft: '4px'}}>{s.sf_red ?? 0} SF ({redPct}%)</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-heading">
            <BarChart2 size={18} />
            <h3>Pemeriksaan Parameter Kinerja Tim</h3>
          </div>
          <p className="detail-intro">Kesesuaian tim terhadap target baseline operasional.</p>
          <div className="detail-list">
            <div>
              <span>Rasio Pemenuhan Kuota SF</span>
              <strong>{s.sf_fulfillment >= 1 ? '✅ Terpenuhi' : `⚠️ Kurang ${Math.max(0, (s.min_sf_required || 0) - s.sf_active)} SF`}</strong>
            </div>
            <div>
              <span>Status Produktivitas Tim</span>
              <strong>{s.productivity_per_sf_rp >= 300000000 ? '✅ Di Atas Standar' : '⚠️ Perlu Penguatan'}</strong>
            </div>
            <div>
              <span>Pemerataan Cakupan Cabang</span>
              <strong>{(s.branch_coverage ?? 0) >= 0.9 ? '✅ Optimal (≥90%)' : '⚠️ Masih Terbatas'}</strong>
            </div>
            <div>
              <span>Disiplin Aktivitas Korea</span>
              <strong>{(s.korea_activity_rate ?? 0) >= 0.8 ? '✅ Terjaga (≥80%)' : '⚠️ Perlu Ditingkatkan'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <div>
          <h2>Rincian Kapasitas per Area ({filteredAreas.length})</h2>
          <span>Pemenuhan SF, rasio warna kualitas, dan produktivitas per wilayah kerja.</span>
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button
            type="button"
            className={`btn-filter ${filterColor === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterColor('ALL')}
          >
            Semua Area
          </button>
          <button
            type="button"
            className={`btn-filter ${filterColor === 'GAP' ? 'active' : ''}`}
            onClick={() => setFilterColor('GAP')}
          >
            Kurang SF (&lt;90%)
          </button>
          <button
            type="button"
            className={`btn-filter ${filterColor === 'OK' ? 'active' : ''}`}
            onClick={() => setFilterColor('OK')}
          >
            SF Terpenuhi (≥90%)
          </button>
        </div>
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{width: '240px'}}>AREA</th>
                <th style={{width: '180px'}}>RO / REGIONAL</th>
                <th className="number" style={{width: '90px'}}>SF AKTIF</th>
                <th className="number" style={{width: '110px'}}>KEBUTUHAN MIN</th>
                <th className="number" style={{width: '110px'}}>PEMENUHAN</th>
                <th className="number" style={{width: '150px'}}>KOMPOSISI (H/A/M)</th>
                <th className="number" style={{width: '150px'}}>PRODUKTIVITAS / SF</th>
                <th className="number" style={{width: '90px'}}>CAKUPAN</th>
                <th className="number" style={{width: '90px'}}>AKTIVITAS</th>
                <th style={{width: '90px'}}>KUADRAN</th>
              </tr>
            </thead>
            <tbody>
              {filteredAreas.map(a => (
                <tr key={a.area_id}>
                  <td><strong>{a.area_name}</strong></td>
                  <td>{a.ro_source}</td>
                  <td className="number emph">{a.sf_active}</td>
                  <td className="number">{a.min_sf_required || '—'}</td>
                  <td className="number">
                    <span className={`pct ${a.sf_fulfillment < 0.8 ? 'text-red' : ''}`}>
                      {idPct.format(a.sf_fulfillment)}
                    </span>
                  </td>
                  <td className="number">
                    <span style={{color: '#10b981', fontWeight: 'bold'}}>{a.sf_green}</span> /{' '}
                    <span style={{color: '#94a3b8', fontWeight: 'bold'}}>{a.sf_grey}</span> /{' '}
                    <span style={{color: '#ef4444', fontWeight: 'bold'}}>{a.sf_red}</span>
                  </td>
                  <td className="number">{smallMoney(a.productivity_per_sf_rp)}</td>
                  <td className="number">{idPct.format(a.branch_coverage)}</td>
                  <td className="number">{idPct.format(a.korea_activity_rate)}</td>
                  <td>
                    <span className={`quadrant ${a.quadrant_code || ''}`}>{a.quadrant_code || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
