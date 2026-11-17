import {useMemo, useState} from 'react';
import {Target, Building2, TrendingUp, Compass, AlertCircle} from 'lucide-react';
import type {PotentialData} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', {maximumFractionDigits: 2})} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function PotentialView({data, loading}: {data: PotentialData | null; loading: boolean}) {
  const [activeTab, setActiveTab] = useState<'areas' | 'branches'>('areas');
  const [sortKey, setSortKey] = useState<'total' | 'reguler' | 'name'>('total');

  const s = data?.summary;
  const sortedAreas = useMemo(() => {
    if (!data?.areas) return [];
    return [...data.areas].sort((a, b) => {
      if (sortKey === 'name') return a.area_name.localeCompare(b.area_name);
      if (sortKey === 'reguler') return b.reguler_open_rp - a.reguler_open_rp;
      return b.total_open_rp - a.total_open_rp;
    });
  }, [data?.areas, sortKey]);

  if (loading) {
    return <div className="center-loading">Memuat peta potensi bisnis...</div>;
  }
  if (!data || !s) {
    return (
      <div className="blank-slate">
        <Target size={32} />
        <h2>Data potensi belum tersedia</h2>
        <p>Pilih periode lain atau periksa koneksi data.</p>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PILAR 2 · POTENSI BISNIS</div>
          <h1>Potensi yang Belum Tergarap</h1>
          <p>Pemetaan ruang pertumbuhan berdasarkan SLA Realtime, Prapen Prioritas, Mitraguna, dan ASABRI.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat stat-highlight">
          <div className="stat-label">REGULER · BELUM TERGARAP</div>
          <div className="stat-value">{smallMoney(s.reguler_open_rp)}</div>
          <div className="stat-foot">{idMoney.format(s.reguler_open_noa)} NOA potensi terbuka</div>
        </div>
        <div className="stat">
          <div className="stat-label">SLA REALTIME OPEN</div>
          <div className="stat-value">{smallMoney(s.sla_open_rp)}</div>
          <div className="stat-foot">{idMoney.format(s.sla_open_noa)} NOA pengajuan siap follow-up</div>
        </div>
        <div className="stat">
          <div className="stat-label">PRAPEN PRIORITAS</div>
          <div className="stat-value">{smallMoney(s.prap_open_rp)}</div>
          <div className="stat-foot">{idMoney.format(s.prap_open_noa)} NOA pra-pensiun prioritas</div>
        </div>
        <div className="stat">
          <div className="stat-label">TOTAL RUANG BISNIS</div>
          <div className="stat-value">{smallMoney(s.total_open_rp)}</div>
          <div className="stat-foot">Termasuk estimasi Mitraguna & ASABRI</div>
        </div>
      </div>

      {data.sourceWarning && (
        <div className="notice warning" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <AlertCircle size={18} style={{flexShrink: 0}} />
          <span>{data.sourceWarning}</span>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-heading">
            <Compass size={18} />
            <h3>Distribusi Komposisi Potensi</h3>
          </div>
          <p className="detail-intro">Komposisi peluang bisnis siap garap pada cakupan terpilih.</p>
          <div className="potential-bars">
            <div className="p-bar-row">
              <div className="p-bar-label"><span>SLA Realtime</span><strong>{smallMoney(s.sla_open_rp)}</strong></div>
              <div className="p-track"><div className="p-fill" style={{width: `${Math.round(s.sla_open_rp / Math.max(1, s.total_open_rp) * 100)}%`, background: '#2563eb'}} /></div>
            </div>
            <div className="p-bar-row">
              <div className="p-bar-label"><span>Prapen Prioritas</span><strong>{smallMoney(s.prap_open_rp)}</strong></div>
              <div className="p-track"><div className="p-fill" style={{width: `${Math.round(s.prap_open_rp / Math.max(1, s.total_open_rp) * 100)}%`, background: '#3b82f6'}} /></div>
            </div>
            <div className="p-bar-row">
              <div className="p-bar-label"><span>Mitraguna Total Potensi</span><strong>{smallMoney(s.mitraguna_total_rp)}</strong></div>
              <div className="p-track"><div className="p-fill" style={{width: `${Math.round(s.mitraguna_total_rp / Math.max(1, s.total_open_rp) * 100)}%`, background: '#10b981'}} /></div>
            </div>
            <div className="p-bar-row">
              <div className="p-bar-label"><span>ASABRI Total Potensi</span><strong>{smallMoney(s.asabri_total_rp)}</strong></div>
              <div className="p-track"><div className="p-fill" style={{width: `${Math.round(s.asabri_total_rp / Math.max(1, s.total_open_rp) * 100)}%`, background: '#f59e0b'}} /></div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-heading">
            <TrendingUp size={18} />
            <h3>Kesiapan Tim Menangkap Potensi</h3>
          </div>
          <p className="detail-intro">Korelasi antara besaran potensi dengan kapasitas SF yang tersedia.</p>
          <div className="detail-list">
            <div><span>Total Wilayah Area</span><strong>{data.areas.length} Area</strong></div>
            <div><span>Cabang Terpetakan</span><strong>{data.topBranches.length} Cabang</strong></div>
            <div><span>Granularitas Data</span><span className="status-pill neutral">{data.sourceGranularity}</span></div>
            <div><span>Rata-rata Potensi / Area</span><strong>{smallMoney(s.total_open_rp / Math.max(1, data.areas.length))}</strong></div>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button
            type="button"
            className={`btn-filter ${activeTab === 'areas' ? 'active' : ''}`}
            onClick={() => setActiveTab('areas')}
          >
            Peta Potensi per Area ({data.areas.length})
          </button>
          <button
            type="button"
            className={`btn-filter ${activeTab === 'branches' ? 'active' : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            Top 20 Cabang Potensi Terbesar
          </button>
        </div>
        {activeTab === 'areas' && (
          <label className="inline-select">
            Urutkan
            <select value={sortKey} onChange={e => setSortKey(e.target.value as typeof sortKey)}>
              <option value="total">Total Potensi</option>
              <option value="reguler">Potensi Reguler</option>
              <option value="name">Nama Area</option>
            </select>
          </label>
        )}
      </div>

      {activeTab === 'areas' ? (
        <div className="data-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{width: '260px'}}>AREA</th>
                  <th style={{width: '180px'}}>REGIONAL / RO</th>
                  <th className="number" style={{width: '150px'}}>POTENSI REGULER</th>
                  <th className="number" style={{width: '140px'}}>SLA OPEN</th>
                  <th className="number" style={{width: '140px'}}>PRAPEN OPEN</th>
                  <th className="number" style={{width: '150px'}}>TOTAL POTENSI</th>
                  <th className="number" style={{width: '130px'}}>SF FULFILLMENT</th>
                  <th style={{width: '100px'}}>KUADRAN</th>
                </tr>
              </thead>
              <tbody>
                {sortedAreas.map(a => (
                  <tr key={a.area_id}>
                    <td><strong>{a.area_name}</strong><small>Rank #{a.rank_selindo || '—'}</small></td>
                    <td>{a.ro_source}</td>
                    <td className="number emph">{smallMoney(a.reguler_open_rp)}</td>
                    <td className="number">{smallMoney(a.sla_open_rp)}</td>
                    <td className="number">{smallMoney(a.prap_open_rp)}</td>
                    <td className="number emph">{smallMoney(a.total_open_rp)}</td>
                    <td className="number"><span className="pct">{idPct.format(a.sf_fulfillment)}</span></td>
                    <td>
                      <span className={`quadrant ${a.quadrant_code || ''}`}>{a.quadrant_code || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="data-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{width: '280px'}}>NAMA CABANG</th>
                  <th style={{width: '220px'}}>AREA</th>
                  <th style={{width: '140px'}}>STATUS CAKUPAN</th>
                  <th className="number" style={{width: '110px'}}>TOTAL SF</th>
                  <th className="number" style={{width: '150px'}}>SLA OPEN</th>
                  <th className="number" style={{width: '150px'}}>PRAPEN OPEN</th>
                  <th className="number" style={{width: '160px'}}>TOTAL POTENSI</th>
                </tr>
              </thead>
              <tbody>
                {data.topBranches.map((b, i) => (
                  <tr key={b.branch_code + i}>
                    <td><strong>{b.branch_name}</strong><small>{b.branch_code}</small></td>
                    <td>{b.area_name}</td>
                    <td>
                      <span className={`status-pill ${b.coverage_status === 'OPTIMAL' ? 'green' : 'amber'}`}>
                        {b.coverage_status}
                      </span>
                    </td>
                    <td className="number">{b.sf_total} SF</td>
                    <td className="number">{smallMoney(b.sla_open_rp)}</td>
                    <td className="number">{smallMoney(b.prap_open_rp)}</td>
                    <td className="number emph">{smallMoney(b.total_open_rp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
