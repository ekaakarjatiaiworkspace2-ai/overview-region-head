import {AlertTriangle} from 'lucide-react';
import type {BarriersData} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function BarriersView({data, loading}: {data: BarriersData | null; loading: boolean}) {
  const s = data?.summary;

  if (loading) {
    return <div className="center-loading">Mengevaluasi hambatan pertumbuhan bisnis...</div>;
  }
  if (!data || !s) {
    return <div className="blank-slate"><AlertTriangle size={32}/><h2>Data hambatan belum tersedia</h2></div>;
  }

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PILAR 4 · HAMBATAN PERTUMBUHAN</div>
          <h1>Evaluasi Hambatan & Bottleneck</h1>
          <p>Identifikasi kendala kritis yang menahan laju pencairan: masalah, bukti angka, dan dampak nyata ke bisnis.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat stat-highlight">
          <div className="stat-label">RASIO PROSES TERTAHAN</div>
          <div className="stat-value">{idPct.format(data.processRatio)}</div>
          <div className="stat-foot">Batas wajar sistem: maksimal 20%</div>
        </div>
        <div className="stat">
          <div className="stat-label">CARRY OVER BERLANJUT</div>
          <div className="stat-value">{smallMoney(s.carry_over_rp)}</div>
          <div className="stat-foot">Pengajuan tertahan proses dari bulan lalu</div>
        </div>
        <div className="stat">
          <div className="stat-label">BATAL CAIR / REJECT</div>
          <div className="stat-value">{smallMoney(s.batal_cair_rp)}</div>
          <div className="stat-foot">Potensi terlepas atau tidak lolos seleksi</div>
        </div>
        <div className="stat">
          <div className="stat-label">PIPELINE BERJALAN</div>
          <div className="stat-value">{smallMoney(s.pipeline_active_rp)}</div>
          <div className="stat-foot">{s.pipeline_to_target ? `${s.pipeline_to_target.toFixed(2)}x dari target` : '—'}</div>
        </div>
      </div>

      <div className="section-title-row">
        <div>
          <h2>Kartu Evaluasi Hambatan Utama</h2>
          <span>Diurutkan berdasarkan tingkat keparahan (severity) terhadap pencapaian target.</span>
        </div>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px'}}>
        {data.allBarriers.map((b, idx) => {
          const sevPct = Math.round(b.severity * 100);
          const isCritical = b.severity >= 0.4;
          return (
            <div
              key={b.code}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderLeft: isCritical ? '4px solid var(--red-coral)' : '4px solid var(--blue-primary)',
                borderRadius: 'var(--rad-lg)',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '50px 1fr 200px',
                gap: '16px',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{fontSize: '24px', fontWeight: '800', color: isCritical ? 'var(--red-coral)' : 'var(--text-faint)', fontVariantNumeric: 'tabular-nums'}}>
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                  <span className={`status-pill ${isCritical ? 'danger' : 'neutral'}`}>{b.code}</span>
                  <h3 style={{margin: 0, fontSize: '14px', color: 'var(--text-headline)', fontWeight: '700'}}>{b.title}</h3>
                </div>
                <div style={{fontSize: '11.5px', color: 'var(--text-body)', marginBottom: '2px'}}>
                  <strong>Bukti Data:</strong> {b.evidence}
                </div>
                <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                  <strong>Makna Bisnis:</strong> {b.meaning}
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '20px', fontWeight: '800', color: isCritical ? 'var(--red-coral)' : 'var(--blue-primary)', fontVariantNumeric: 'tabular-nums'}}>
                  {sevPct}%
                </div>
                <div style={{fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '2px'}}>
                  Tingkat Keparahan
                </div>
                <div style={{height: '6px', width: '100%', background: '#f1f5f9', borderRadius: 'var(--rad-full)', marginTop: '6px', overflow: 'hidden'}}>
                  <div
                    style={{
                      height: '100%',
                      width: `${sevPct}%`,
                      background: isCritical ? 'var(--red-coral)' : 'var(--blue-primary)',
                      borderRadius: 'var(--rad-full)'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-title-row">
        <div>
          <h2>Rincian Penyebab Pipeline Tertahan</h2>
          <span>Pemisahan pengajuan proses berlanjut dan batal cair berdasarkan kategori operasional.</span>
        </div>
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{width: '160px'}}>KATEGORI</th>
                <th style={{width: '320px'}}>FAKTOR PENYEBAB</th>
                <th className="number" style={{width: '140px'}}>JUMLAH BERKAS</th>
                <th className="number" style={{width: '160px'}}>TOTAL PLAFOND</th>
                <th>ARAH TINDAK LANJUT SISTEM</th>
              </tr>
            </thead>
            <tbody>
              {data.pipelineReasons.map((r, i) => (
                <tr key={r.category + i}>
                  <td><span className="status-pill neutral">{r.category}</span></td>
                  <td><strong>{r.reason}</strong></td>
                  <td className="number emph">{r.count} kasus</td>
                  <td className="number emph">{smallMoney(r.amount_rp)}</td>
                  <td style={{fontSize: '11px', color: 'var(--blue-primary)'}}>
                    💡 {r.followup}
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
