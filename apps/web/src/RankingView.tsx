import {useState} from 'react';
import {Trophy, Building2, User, Users, MapPin, Briefcase} from 'lucide-react';
import type {RankingsData} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', {maximumFractionDigits: 2})} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function RankingView({
  data,
  loading,
  onSelectArea
}: {
  data: RankingsData | null;
  loading: boolean;
  onSelectArea?: (areaId: string) => void;
}) {
  const [tab, setTab] = useState<'RO' | 'RH' | 'KOREA' | 'AREA' | 'BRANCH' | 'SF'>('RO');

  if (loading) {
    return <div className="center-loading">Memuat peringkat performa wilayah...</div>;
  }
  if (!data) {
    return <div className="blank-slate"><Trophy size={32}/><h2>Data peringkat belum tersedia</h2></div>;
  }

  const koreaList = data.koreaRankings || [];

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PERINGKAT WILAYAH & TIM</div>
          <h1>Klasemen Kinerja Nasional</h1>
          <p>Pemetaan posisi pencapaian target dan produktivitas pada tingkat RO, Region Head, Koordinator Area (Korea), Area, Cabang, dan Sales Force.</p>
        </div>
      </div>

      <div className="segmented-nav">
        <button
          type="button"
          className={`btn-filter ${tab === 'RO' ? 'active' : ''}`}
          onClick={() => setTab('RO')}
        >
          <Building2 size={15} /> Peringkat RO ({data.roRankings.length})
        </button>
        <button
          type="button"
          className={`btn-filter ${tab === 'RH' ? 'active' : ''}`}
          onClick={() => setTab('RH')}
        >
          <User size={15} /> Peringkat Region Head ({data.rhRankings.length})
        </button>
        <button
          type="button"
          className={`btn-filter ${tab === 'KOREA' ? 'active' : ''}`}
          onClick={() => setTab('KOREA')}
        >
          <Briefcase size={15} /> Koordinator Area / Korea ({koreaList.length})
        </button>
        <button
          type="button"
          className={`btn-filter ${tab === 'AREA' ? 'active' : ''}`}
          onClick={() => setTab('AREA')}
        >
          <MapPin size={15} /> Peringkat Area ({data.areaRankings.length})
        </button>
        <button
          type="button"
          className={`btn-filter ${tab === 'BRANCH' ? 'active' : ''}`}
          onClick={() => setTab('BRANCH')}
        >
          <Building2 size={15} /> Top Cabang ({data.branchRankings.length})
        </button>
        <button
          type="button"
          className={`btn-filter ${tab === 'SF' ? 'active' : ''}`}
          onClick={() => setTab('SF')}
        >
          <Users size={15} /> Top Sales Force ({data.sfRankings.length})
        </button>
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          {tab === 'RO' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '260px'}}>REGIONAL / RO</th>
                  <th className="number" style={{width: '170px'}}>TARGET</th>
                  <th className="number" style={{width: '180px'}}>REALISASI PENCAIRAN</th>
                  <th className="number" style={{width: '130px'}}>CAPAIAN (%)</th>
                  <th className="number" style={{width: '130px'}}>JUMLAH AREA</th>
                </tr>
              </thead>
              <tbody>
                {data.roRankings.map(r => (
                  <tr key={r.ro_name}>
                    <td>
                      <span className={`rank-badge ${r.rank <= 3 ? 'top-rank' : ''}`}>#{r.rank}</span>
                    </td>
                    <td><strong>{r.ro_name}</strong></td>
                    <td className="number">{smallMoney(r.target_rp)}</td>
                    <td className="number emph">{smallMoney(r.achievement_rp)}</td>
                    <td className="number">
                      <span className="pct">{idPct.format(r.attainment_pct)}</span>
                    </td>
                    <td className="number">{r.area_count} Area</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'RH' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '260px'}}>REGION HEAD</th>
                  <th style={{width: '180px'}}>WILAYAH RO</th>
                  <th className="number" style={{width: '160px'}}>TARGET</th>
                  <th className="number" style={{width: '170px'}}>REALISASI</th>
                  <th className="number" style={{width: '130px'}}>CAPAIAN (%)</th>
                  <th className="number" style={{width: '110px'}}>SF AKTIF</th>
                  <th className="number" style={{width: '160px'}}>PRODUKTIVITAS / SF</th>
                </tr>
              </thead>
              <tbody>
                {data.rhRankings.map(r => (
                  <tr key={r.rh_key}>
                    <td>
                      <span className={`rank-badge ${r.rank <= 3 ? 'top-rank' : ''}`}>#{r.rank}</span>
                    </td>
                    <td><strong>{r.rh_name}</strong><small>{r.rh_key}</small></td>
                    <td>{r.ro_name}</td>
                    <td className="number">{smallMoney(r.target_rp)}</td>
                    <td className="number emph">{smallMoney(r.achievement_rp)}</td>
                    <td className="number">
                      <span className="pct">{idPct.format(r.attainment_pct)}</span>
                    </td>
                    <td className="number">{r.sf_active}</td>
                    <td className="number">{smallMoney(r.productivity_per_sf_rp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'KOREA' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '240px'}}>KOORDINATOR AREA (KOREA)</th>
                  <th style={{width: '180px'}}>AREA BINAAN</th>
                  <th style={{width: '170px'}}>REGION HEAD</th>
                  <th className="number" style={{width: '150px'}}>TARGET</th>
                  <th className="number" style={{width: '160px'}}>REALISASI</th>
                  <th className="number" style={{width: '120px'}}>CAPAIAN (%)</th>
                  <th className="number" style={{width: '140px'}}>SF ASISTENSI</th>
                  <th style={{width: '130px'}}>STATUS AKTIVITAS</th>
                </tr>
              </thead>
              <tbody>
                {koreaList.map(k => (
                  <tr
                    key={k.nip_korea + k.area_id}
                    onClick={() => onSelectArea?.(k.area_id)}
                    style={{cursor: onSelectArea ? 'pointer' : 'default'}}
                    title="Klik untuk melihat detail performa Area"
                  >
                    <td>
                      <span className={`rank-badge ${k.rank <= 3 ? 'top-rank' : ''}`}>#{k.rank}</span>
                    </td>
                    <td>
                      <strong>{k.nama_korea}</strong>
                      <small>NIP: {k.nip_korea}</small>
                    </td>
                    <td>
                      <span style={{color: 'var(--blue-primary)', fontWeight: '600'}}>{k.area_name}</span>
                    </td>
                    <td>{k.rh_name}</td>
                    <td className="number">{smallMoney(k.target_rp)}</td>
                    <td className="number emph">{smallMoney(k.achievement_rp)}</td>
                    <td className="number">
                      <span className="pct">{idPct.format(k.attainment_pct)}</span>
                    </td>
                    <td className="number">
                      <strong>{k.sf_active}</strong> SF
                      <small style={{display: 'block', color: 'var(--text-faint)'}}>
                        🟢{k.sf_green} ⚪{k.sf_grey} 🔴{k.sf_red}
                      </small>
                    </td>
                    <td>
                      <span className={`status-pill ${k.korea_activity_status === 'GREEN' ? 'green' : k.korea_activity_status === 'RED' ? 'danger' : 'neutral'}`}>
                        {k.korea_activity_status} · {Math.round(k.korea_activity_rate * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!koreaList.length && (
                  <tr>
                    <td colSpan={9} className="empty-row">Belum ada data Koordinator Area untuk filter terpilih.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'AREA' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '260px'}}>AREA</th>
                  <th style={{width: '180px'}}>RO / REGIONAL</th>
                  <th className="number" style={{width: '160px'}}>TARGET</th>
                  <th className="number" style={{width: '170px'}}>PENCAIRAN</th>
                  <th className="number" style={{width: '130px'}}>CAPAIAN (%)</th>
                  <th className="number" style={{width: '100px'}}>SF</th>
                  <th style={{width: '140px'}}>KUADRAN</th>
                </tr>
              </thead>
              <tbody>
                {data.areaRankings.map(a => (
                  <tr
                    key={a.area_id}
                    onClick={() => onSelectArea?.(a.area_id)}
                    style={{cursor: onSelectArea ? 'pointer' : 'default'}}
                    title="Klik untuk melihat detail performa Area"
                  >
                    <td>
                      <span className={`rank-badge ${a.rank <= 3 ? 'top-rank' : ''}`}>#{a.rank}</span>
                    </td>
                    <td>
                      <strong style={{color: 'var(--blue-primary)'}}>{a.area_name}</strong>
                      <small>Klik untuk drill-down detail</small>
                    </td>
                    <td>{a.ro_name}</td>
                    <td className="number">{smallMoney(a.target_rp)}</td>
                    <td className="number emph">{smallMoney(a.achievement_rp)}</td>
                    <td className="number">
                      <span className="pct">{idPct.format(a.attainment_pct)}</span>
                    </td>
                    <td className="number">{a.sf_active}</td>
                    <td>
                      <span className={`quadrant ${a.quadrant_code || ''}`}>{a.quadrant_code || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'BRANCH' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '260px'}}>NAMA CABANG</th>
                  <th style={{width: '200px'}}>AREA</th>
                  <th style={{width: '160px'}}>RO</th>
                  <th className="number" style={{width: '160px'}}>TARGET</th>
                  <th className="number" style={{width: '170px'}}>PENCAIRAN</th>
                  <th className="number" style={{width: '130px'}}>CAPAIAN (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.branchRankings.map(b => (
                  <tr key={b.branch_name + b.rank}>
                    <td>
                      <span className={`rank-badge ${b.rank <= 3 ? 'top-rank' : ''}`}>#{b.rank}</span>
                    </td>
                    <td><strong>{b.branch_name}</strong></td>
                    <td>{b.area_name}</td>
                    <td>{b.ro_name}</td>
                    <td className="number">{smallMoney(b.target_rp)}</td>
                    <td className="number emph">{smallMoney(b.achievement_rp)}</td>
                    <td className="number">
                      <span className="pct">{idPct.format(b.attainment_pct)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'SF' && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '64px'}}>RANK</th>
                  <th style={{width: '260px'}}>NAMA SALES FORCE</th>
                  <th style={{width: '200px'}}>AREA</th>
                  <th style={{width: '160px'}}>RO</th>
                  <th className="number" style={{width: '170px'}}>REALISASI PENCAIRAN</th>
                  <th style={{width: '130px'}}>KATEGORI</th>
                  <th style={{width: '180px'}}>STATUS PERFORMA</th>
                </tr>
              </thead>
              <tbody>
                {data.sfRankings.map(sf => (
                  <tr key={sf.sf_name + sf.rank}>
                    <td>
                      <span className={`rank-badge ${sf.rank <= 3 ? 'top-rank' : ''}`}>#{sf.rank}</span>
                    </td>
                    <td><strong>{sf.sf_name}</strong></td>
                    <td>{sf.area_name}</td>
                    <td>{sf.ro_name}</td>
                    <td className="number emph">{smallMoney(sf.achievement_rp)}</td>
                    <td>
                      <span className={`status-pill ${sf.color === 'GREEN' ? 'green' : sf.color === 'GREY' ? 'neutral' : 'danger'}`}>
                        SF {sf.color}
                      </span>
                    </td>
                    <td style={{fontSize: '11px', color: 'var(--text-muted)'}}>{sf.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
