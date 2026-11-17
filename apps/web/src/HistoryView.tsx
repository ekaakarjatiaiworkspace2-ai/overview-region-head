import {useState} from 'react';
import {BarChart3, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Info} from 'lucide-react';
import type {HistoryData, HistoryMonth} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', {maximumFractionDigits: 2})} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function HistoryView({data, loading}: {data: HistoryData | null; loading: boolean}) {
  if (loading) {
    return <div className="center-loading">Memuat perjalanan kinerja 2026...</div>;
  }
  if (!data || !data.months.length) {
    return <div className="blank-slate"><BarChart3 size={32}/><h2>Data riwayat kinerja belum tersedia</h2></div>;
  }

  const cur = data.current;
  const total2026 = data.months.reduce((sum, m) => sum + (m.actual_rp || 0), 0);
  const target2026 = data.months.reduce((sum, m) => sum + (m.target_rp || 0), 0);

  // Interactive selection state
  const defaultSelected = data.latestPeriod || data.months[data.months.length - 1]?.period_id;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultSelected);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);

  const activePeriod = hoveredPeriod || selectedPeriod;
  const activeMonth: HistoryMonth = data.months.find(m => m.period_id === activePeriod) || data.months[data.months.length - 1];
  const activeIndex = data.months.findIndex(m => m.period_id === activeMonth.period_id);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < data.months.length - 1;

  function handlePrev() {
    if (canPrev && data) setSelectedPeriod(data.months[activeIndex - 1].period_id);
  }
  function handleNext() {
    if (canNext && data) setSelectedPeriod(data.months[activeIndex + 1].period_id);
  }

  // Chart SVG Coordinates & Math
  const svgW = 760;
  const svgH = 300;
  const padTop = 32;
  const padRight = 50;
  const padBottom = 45;
  const padLeft = 70;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const maxRp = Math.max(1, ...data.months.map(m => Math.max(m.actual_rp || 0, m.target_rp || 0))) * 1.15;
  const maxAtt = 1.25; // 125% upper bound for attainment line

  const step = chartW / data.months.length;
  const barW = Math.min(32, Math.max(16, step * 0.44));

  // Attainment line points
  const linePoints = data.months.map((m, i) => {
    const x = padLeft + i * step + step / 2;
    const y = padTop + chartH - Math.min(1.2, Math.max(0, m.attainment_pct || 0) / maxAtt) * chartH;
    return {x, y, m};
  });
  const linePathD = linePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // 100% Target Reference Y
  const y100 = padTop + chartH - (1.0 / maxAtt) * chartH;

  // Active month calculation
  const activeGap = (activeMonth.actual_rp || 0) - (activeMonth.target_rp || 0);

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">BISNIS YANG BERJALAN · HISTORI 2026</div>
          <h1>Perjalanan Kinerja Januari – Oktober 2026</h1>
          <p>Tren pencapaian target bulanan, grafik interaktif pencairan vs target, dan profil performa per bulan.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat stat-highlight">
          <div className="stat-label">TOTAL REALISASI 2026 (YTD)</div>
          <div className="stat-value">{smallMoney(total2026)}</div>
          <div className="stat-foot">Kumulatif Januari hingga {data.latestPeriod}</div>
        </div>
        <div className="stat">
          <div className="stat-label">TARGET KUMULATIF 2026</div>
          <div className="stat-value">{smallMoney(target2026)}</div>
          <div className="stat-foot">Pencapaian YTD: {idPct.format(total2026 / Math.max(1, target2026))}</div>
        </div>
        <div className="stat">
          <div className="stat-label">PENCAIRAN BULAN TERAKHIR</div>
          <div className="stat-value">{smallMoney(cur.achievement_rp)}</div>
          <div className="stat-foot">Periode {data.latestPeriod} ({idPct.format(cur.attainment_pct)})</div>
        </div>
        <div className="stat">
          <div className="stat-label">PRODUKTIVITAS SF TERKINI</div>
          <div className="stat-value">{smallMoney(cur.productivity_per_sf_rp)}</div>
          <div className="stat-foot">Dengan {cur.sf_active} SF aktif</div>
        </div>
      </div>

      <div className="section-title-row">
        <div>
          <h2>Grafik Tren Pencapaian Bulanan & Rincian Interaktif</h2>
          <span>Klik pada batang grafik bulan untuk melihat deskripsi dan analisis mendalam.</span>
        </div>
      </div>

      {/* INTERACTIVE COMBO CHART + INSPECTOR CARD */}
      <div className="history-chart-layout">
        {/* CHART CARD */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Pencairan vs Target Bulanan (2026)</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{background: 'var(--blue-primary)'}} />
                <span>Realisasi Pencairan</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{background: '#cbd5e1', border: '1px dashed #94a3b8'}} />
                <span>Target Bisnis</span>
              </div>
              <div className="legend-item">
                <span className="legend-line" style={{background: 'var(--green-emerald)'}} />
                <span>Capaian Target (%)</span>
              </div>
            </div>
          </div>

          <div className="chart-svg-container">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pctVal, idx) => {
                const yVal = padTop + chartH - pctVal * chartH;
                const rpLabel = smallMoney(maxRp * pctVal);
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={yVal}
                      x2={padLeft + chartW}
                      y2={yVal}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={yVal + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontWeight="600"
                    >
                      {rpLabel}
                    </text>
                  </g>
                );
              })}

              {/* 100% Target Reference Line */}
              <line
                x1={padLeft}
                y1={y100}
                x2={padLeft + chartW}
                y2={y100}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft + chartW + 8}
                y={y100 + 3}
                fontSize="9"
                fill="#d97706"
                fontWeight="800"
              >
                100%
              </text>

              {/* Bars for Each Month */}
              {data.months.map((m, i) => {
                const xCenter = padLeft + i * step + step / 2;
                const isSelected = m.period_id === activeMonth.period_id;

                const targetHeight = ((m.target_rp || 0) / maxRp) * chartH;
                const yTarget = padTop + chartH - targetHeight;

                const actualHeight = ((m.actual_rp || 0) / maxRp) * chartH;
                const yActual = padTop + chartH - actualHeight;

                return (
                  <g key={m.period_id}>
                    {/* Active Column Highlight Band */}
                    {isSelected && (
                      <rect
                        x={padLeft + i * step + 4}
                        y={padTop}
                        width={step - 8}
                        height={chartH}
                        rx="6"
                        fill="rgba(37, 99, 235, 0.08)"
                        pointerEvents="none"
                      />
                    )}

                    {/* Target Bar (Background Outline) */}
                    <rect
                      x={xCenter - barW / 2}
                      y={yTarget}
                      width={barW}
                      height={Math.max(2, targetHeight)}
                      rx="3"
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeDasharray="3 2"
                      strokeWidth="1"
                    />

                    {/* Actual Bar (Solid Blue) */}
                    <rect
                      x={xCenter - barW / 2}
                      y={yActual}
                      width={barW}
                      height={Math.max(2, actualHeight)}
                      rx="3"
                      fill={isSelected ? '#1d496b' : 'var(--blue-primary)'}
                      stroke={isSelected ? '#2563eb' : 'none'}
                      strokeWidth={isSelected ? '2' : '0'}
                      style={{transition: 'all 0.2s ease'}}
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={xCenter}
                      y={padTop + chartH + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? '800' : '600'}
                      fill={isSelected ? 'var(--blue-primary)' : 'var(--text-muted)'}
                    >
                      {m.month}
                    </text>

                    {/* Snapshot Indicator Dot */}
                    {m.is_snapshot && (
                      <circle
                        cx={xCenter}
                        cy={padTop + chartH + 30}
                        r="2.5"
                        fill="var(--green-emerald)"
                      />
                    )}

                    {/* Invisible Clickable Hitbox */}
                    <rect
                      x={padLeft + i * step}
                      y={padTop}
                      width={step}
                      height={chartH + 35}
                      fill="transparent"
                      cursor="pointer"
                      onClick={() => setSelectedPeriod(m.period_id)}
                      onMouseEnter={() => setHoveredPeriod(m.period_id)}
                      onMouseLeave={() => setHoveredPeriod(null)}
                    >
                      <title>{`${m.month} 2026: Realisasi ${smallMoney(m.actual_rp)} (${idPct.format(m.attainment_pct)})`}</title>
                    </rect>
                  </g>
                );
              })}

              {/* Attainment Curve Line */}
              <path
                d={linePathD}
                fill="none"
                stroke="var(--green-emerald)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />

              {/* Attainment Data Dots */}
              {linePoints.map(p => {
                const isSelected = p.m.period_id === activeMonth.period_id;
                return (
                  <circle
                    key={p.m.period_id}
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 5.5 : 3.5}
                    fill={isSelected ? '#059669' : '#fff'}
                    stroke="var(--green-emerald)"
                    strokeWidth={isSelected ? '2.5' : '2'}
                    pointerEvents="none"
                  />
                );
              })}
            </svg>
          </div>

          {/* Month Selector Pills Strip */}
          <div className="month-pill-strip">
            {data.months.map(m => {
              const isSelected = m.period_id === activeMonth.period_id;
              return (
                <button
                  key={m.period_id}
                  type="button"
                  className={`month-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(m.period_id)}
                >
                  {m.month} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* DETAIL INSPECTOR CARD */}
        <div className="history-inspector-card">
          <div className="inspector-header">
            <div>
              <span className="inspector-label">RINCIAN PERFORMA BULAN</span>
              <h3 className="inspector-title">{activeMonth.month} 2026</h3>
            </div>
            <span className={`status-pill ${activeMonth.is_snapshot ? 'green' : 'amber'}`}>
              {activeMonth.is_snapshot ? 'Snapshot Resmi' : 'Data Berjalan'}
            </span>
          </div>

          <div className="inspector-kpi-block">
            <span className="inspector-label">Realisasi Pencairan</span>
            <div className="inspector-big-val">{smallMoney(activeMonth.actual_rp)}</div>
            <div className="inspector-target-info">
              <span>Target: <strong>{smallMoney(activeMonth.target_rp)}</strong></span>
              <span style={{fontWeight: '700', color: activeMonth.attainment_pct >= 1 ? 'var(--green-emerald)' : 'var(--blue-primary)'}}>
                {idPct.format(activeMonth.attainment_pct)} Capaian
              </span>
            </div>
            <div className="inspector-progress-track">
              <div
                className="inspector-progress-fill"
                style={{
                  width: `${Math.min(100, Math.round((activeMonth.attainment_pct || 0) * 100))}%`,
                  background: activeMonth.attainment_pct >= 1 ? 'var(--green-emerald)' : activeMonth.attainment_pct >= 0.8 ? 'var(--blue-primary)' : 'var(--red-coral)'
                }}
              />
            </div>
          </div>

          <div className="inspector-stats-list">
            <div className="inspector-stat-row">
              <span>Pertumbuhan MoM:</span>
              <strong>
                {activeMonth.mom_growth !== null && activeMonth.mom_growth !== undefined ? (
                  <span style={{color: activeMonth.mom_growth >= 0 ? 'var(--green-emerald)' : 'var(--red-coral)', display: 'inline-flex', alignItems: 'center', gap: '3px'}}>
                    {activeMonth.mom_growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {idPct.format(Math.abs(activeMonth.mom_growth))} MoM
                  </span>
                ) : (
                  'Bulan Pembuka'
                )}
              </strong>
            </div>

            <div className="inspector-stat-row">
              <span>Jumlah Debitur (NOA):</span>
              <strong>{idMoney.format(activeMonth.noa)} Nasabah</strong>
            </div>

            <div className="inspector-stat-row">
              <span>Sales Force Aktif:</span>
              <strong>{idMoney.format(activeMonth.sf_active)} SF</strong>
            </div>

            <div className="inspector-stat-row">
              <span>Produktivitas per SF:</span>
              <strong>{smallMoney(activeMonth.productivity_per_sf_rp)}</strong>
            </div>

            <div className="inspector-stat-row">
              <span>Gap ke Target:</span>
              <strong style={{color: activeGap >= 0 ? 'var(--green-emerald)' : 'var(--red-coral)'}}>
                {activeGap >= 0 ? `+${smallMoney(activeGap)} (Surplus)` : `${smallMoney(activeGap)}`}
              </strong>
            </div>
          </div>

          <div style={{marginTop: '16px', padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--rad-md)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
            <Info size={15} style={{color: 'var(--blue-primary)', flexShrink: 0, marginTop: '1px'}} />
            <span>
              {activeMonth.attainment_pct >= 1
                ? `Kinerja ${activeMonth.month} melampaui target bisnis dengan produktivitas tim yang solid.`
                : activeMonth.attainment_pct >= 0.9
                ? `Kinerja ${activeMonth.month} mendekati target (gap ${smallMoney(Math.abs(activeGap))}) dengan ${activeMonth.sf_active} SF aktif.`
                : `Kinerja ${activeMonth.month} memerlukan percepatan konversi pipeline untuk menutup gap target.`}
            </span>
          </div>

          <div className="inspector-nav-buttons">
            <button
              type="button"
              className="inspector-nav-btn"
              onClick={handlePrev}
              disabled={!canPrev}
            >
              <ChevronLeft size={14} /> {canPrev ? data?.months[activeIndex - 1]?.month : 'Awal'}
            </button>
            <button
              type="button"
              className="inspector-nav-btn"
              onClick={handleNext}
              disabled={!canNext}
            >
              {canNext ? data?.months[activeIndex + 1]?.month : 'Akhir'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <div>
          <h2>Area Kontributor Terbesar</h2>
          <span>Area dengan kontribusi pencairan tertinggi pada snapshot operasional terkini.</span>
        </div>
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{width: '64px'}}>RANK</th>
                <th style={{width: '260px'}}>NAMA AREA</th>
                <th className="number" style={{width: '170px'}}>REALISASI PENCAIRAN</th>
                <th className="number" style={{width: '160px'}}>TARGET BISNIS</th>
                <th className="number" style={{width: '130px'}}>PENCAPAIAN (%)</th>
                <th className="number" style={{width: '150px'}}>KONTRIBUSI KE TOTAL</th>
                <th style={{width: '130px'}}>KUADRAN</th>
              </tr>
            </thead>
            <tbody>
              {data.contribution.map((a, i) => (
                <tr key={a.area_id}>
                  <td><span className={`rank-badge ${i < 3 ? 'top-rank' : ''}`}>#{i + 1}</span></td>
                  <td><strong>{a.area_name}</strong></td>
                  <td className="number emph">{smallMoney(a.achievement_rp)}</td>
                  <td className="number">{smallMoney(a.target_rp)}</td>
                  <td className="number"><span className="pct">{idPct.format(a.attainment_pct)}</span></td>
                  <td className="number emph" style={{color: 'var(--blue-primary)'}}>{idPct.format(a.contribution_pct)}</td>
                  <td><span className={`quadrant ${a.quadrant_code || ''}`}>{a.quadrant_code || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
