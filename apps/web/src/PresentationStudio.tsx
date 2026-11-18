import {useEffect, useMemo, useState} from 'react';
import {ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Download, Eye, EyeOff, FileDown, Maximize2, MonitorPlay, RotateCcw, Save} from 'lucide-react';
import type {Overview} from './api';
import {
  buildDemoSlides,
  demoStoryStorageKey,
  formatPercent,
  formatPeriod,
  formatRupiah,
  getDemoPresentationData,
  mergeStoryEdits,
  visibleSlides,
  type DemoSlide,
  type PresentationData,
  type SlideEdit,
  type SlideEdits
} from './presentation-model';

type StudioMode = 'editor' | 'preview';

function figure(value: string, label: string, note?: string) {
  return (
    <div className="ps-figure">
      <div className="ps-figure-value">{value}</div>
      <div className="ps-figure-label">{label}</div>
      {note && <div className="ps-figure-note">{note}</div>}
    </div>
  );
}

function Bars({rows, field = 'achievement_rp'}: {rows: Overview['areas']; field?: 'achievement_rp' | 'pipeline_active_rp'}) {
  const selected = [...rows].sort((a, b) => (Number(b[field] ?? -1)) - (Number(a[field] ?? -1))).slice(0, 5);
  const max = Math.max(1, ...selected.map(a => Number(a[field] || 0)));
  return (
    <div className="ps-bars">
      {selected.map((a, i) => (
        <div className="ps-bar-row" key={a.area_id}>
          <div className="ps-bar-head">
            <span><b>{String(i + 1).padStart(2, '0')}</b>{a.area_name.replace(/^AREA /, '')}</span>
            <strong>{formatRupiah(a[field])}</strong>
          </div>
          <div className="ps-bar-track">
            <div style={{width: `${Math.max(0, (Number(a[field] || 0)) / max * 100)}%`}} />
          </div>
        </div>
      ))}
      {!selected.length && <div className="ps-empty">Tidak ada Area pada filter ini.</div>}
    </div>
  );
}

function SlideCanvas({slide, data, index, total, isLive}: {slide: DemoSlide; data: PresentationData; index: number; total: number; isLive?: boolean}) {
  const overview = slide.product === 'REGULER' ? data.regular : slide.product === 'MITRAGUNA' ? data.mitraguna : data.overview;
  const s = overview?.summary;
  const scope = data.ro || 'Seluruh Regional';
  const overviewAreas = overview?.areas || [];
  const q3 = overviewAreas.filter(a => a.quadrant_code === 'Q3').length;
  const q4 = overviewAreas.filter(a => a.quadrant_code === 'Q4').length;
  const gap = s ? Math.max(0, s.target_rp - s.achievement_rp) : null;
  const isCover = slide.kind === 'cover';

  return (
    <article className={`studio-slide ${isCover ? 'ps-dark' : ''}`} aria-label={`Slide ${index + 1}: ${slide.title}`}>
      <div className="ps-top">
        <div className="ps-top-left">
          <span className="ps-brand-badge">PT EKA AKAR JATI × BANK SYARIAH INDONESIA</span>
          <span className="ps-status-badge">{isLive ? 'BSI · DATA AKTUAL' : 'BSI · DATA SIMULASI'}</span>
        </div>
        <div className="ps-top-right">
          <img src="/eka-logo.png" alt="Logo PT Eka Akar Jati" className="ps-logo" />
        </div>
      </div>

      {isCover ? (
        <div className="ps-cover-layout">
          <div className="ps-cover-rule" />
          <div className="ps-cover-label">REVIEW KINERJA BISNIS</div>
          <h2>{slide.headline || slide.title}</h2>
          <p>{slide.explanation}</p>
          <div className="ps-cover-context">
            <div><span>CAKUPAN</span><strong>{scope}</strong></div>
            <div><span>PERIODE DATA</span><strong>{formatPeriod(data.period)}</strong></div>
            <div><span>PRODUK</span><strong>{data.product === 'ALL' ? 'Semua Produk' : data.product}</strong></div>
          </div>
          {slide.supportingText && <div className="ps-cover-support">{slide.supportingText}</div>}
        </div>
      ) : (
        <>
          <div className="ps-kicker">{slide.title}</div>
          <h2 className="ps-title">{slide.headline || slide.title}</h2>
          <p className="ps-subtitle">{slide.explanation}</p>
          <div className="ps-body">
            {slide.kind === 'summary' && (
              <div className="ps-summary-layout">
                <div className="ps-summary-big">
                  <div className="ps-ba-indicator">
                    <span className="ps-ba-tag after">REALISASI BERJALAN</span>
                    <span className="ps-attain-badge">
                      {s?.attainment_pct && s.attainment_pct >= 1 ? '🟢 ON TARGET' : '🟡 IN PROGRESS'}
                    </span>
                  </div>
                  <strong>{formatRupiah(s?.achievement_rp)}</strong>
                  <div className="ps-summary-progress">
                    <span style={{width: `${Math.min(100, Math.max(0, (s?.attainment_pct || 0) * 100))}%`}} />
                  </div>
                  <div className="ps-summary-metrics-row">
                    <span>Capaian: <b>{formatPercent(s?.attainment_pct)}</b></span>
                    <span>Gap: <b>{gap && gap > 0 ? `−${formatRupiah(gap)}` : 'Tercapai'}</b></span>
                  </div>
                </div>

                <div className="ps-ba-grid">
                  <div className="ps-ba-card before">
                    <div className="ps-ba-head">
                      <span className="ps-ba-pill">BEFORE / TARGET</span>
                      <small>Baseline Sasaran</small>
                    </div>
                    <div className="ps-ba-stat">
                      <span className="ps-ba-stat-label">Target Pencairan</span>
                      <strong className="ps-ba-stat-val">{formatRupiah(s?.target_rp)}</strong>
                    </div>
                    <div className="ps-ba-stat">
                      <span className="ps-ba-stat-label">Pipeline Aktif Tersedia</span>
                      <strong className="ps-ba-stat-val">{formatRupiah(s?.pipeline_active_rp)}</strong>
                    </div>
                  </div>

                  <div className="ps-ba-card after">
                    <div className="ps-ba-head">
                      <span className="ps-ba-pill">AFTER / AKTUAL</span>
                      <small>Eksekusi Lapangan</small>
                    </div>
                    <div className="ps-ba-stat">
                      <span className="ps-ba-stat-label">Sales Force Aktif</span>
                      <strong className="ps-ba-stat-val">{s?.sf_active ?? '—'} <small>SF</small></strong>
                    </div>
                    <div className="ps-ba-stat">
                      <span className="ps-ba-stat-label">Cakupan Wilayah</span>
                      <strong className="ps-ba-stat-val">{s?.area_count ?? '—'} <small>Area</small></strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {slide.kind === 'product' && (
              <div className="ps-product-layout">
                <div className="ps-product-stats">
                  {figure(formatRupiah(s?.achievement_rp), 'Pencairan')}
                  {figure(formatPercent(s?.attainment_pct), 'Pencapaian target')}
                  {figure(formatRupiah(s?.target_rp), 'Target')}
                </div>
                <div className="ps-product-chart">
                  <div className="ps-block-label">KONTRIBUSI AREA TERBESAR</div>
                  <Bars rows={overview.areas} />
                </div>
              </div>
            )}

            {slide.kind === 'capacity' && (
              <div className="ps-capacity-layout">
                <div className="ps-capacity-hero">
                  <span>SALES FORCE AKTIF</span>
                  <strong>{s?.sf_active ?? '—'}</strong>
                  <p>Periode dan wilayah sesuai filter yang sedang dipilih</p>
                </div>
                <div className="ps-capacity-metrics">
                  {figure(formatRupiah(s?.pipeline_active_rp), 'Pipeline aktif')}
                  {figure(formatPercent(s?.branch_coverage), 'Rata-rata coverage Area')}
                  {figure(formatPercent(s?.korea_activity_rate), 'Rata-rata aktivitas Korea')}
                  {figure(formatRupiah(s?.productivity_per_sf_rp), 'Produktivitas per SF')}
                </div>
              </div>
            )}

            {slide.kind === 'ranking' && (
              <div className="ps-ranking-layout">
                <div>
                  <div className="ps-block-label">AREA · DIURUTKAN MENURUT PENCAIRAN</div>
                  <Bars rows={overview.areas} />
                </div>
                <div className="ps-ranking-aside">
                  <span>CAKUPAN DATA</span>
                  <strong>{overview.areas.length}</strong>
                  <p>Area pada filter terpilih</p>
                  <div className="ps-info">Area telah terurut berdasarkan performa pencairan snapshot.</div>
                </div>
              </div>
            )}

            {slide.kind === 'pipeline' && (
              <div className="ps-product-layout">
                <div className="ps-pipeline-stats">
                  <span>PIPELINE AKTIF · NILAI TOTAL</span>
                  <strong>{formatRupiah(s?.pipeline_active_rp)}</strong>
                  <p>Suplai calon pencairan yang sedang berjalan pada wilayah terpilih.</p>
                  <div className="ps-info">Carry Over: <b>{formatRupiah(s?.carry_over_rp)}</b> · Batal Cair: <b>{formatRupiah(s?.batal_cair_rp)}</b></div>
                </div>
                <div className="ps-product-chart">
                  <div className="ps-block-label">AREA DENGAN PIPELINE TERBESAR</div>
                  <Bars rows={overview.areas} field="pipeline_active_rp" />
                </div>
              </div>
            )}

            {slide.kind === 'recommendation' && (
              <div className="ps-recommend-layout">
                <div className="ps-recommend-primary">
                  <div className="ps-ba-indicator">
                    <span className="ps-ba-tag before">BASELINE GAP</span>
                  </div>
                  <span>SELISIH MENUJU TARGET</span>
                  <strong>{formatRupiah(gap)}</strong>
                  <p>Sisa selisih menuju target pada periode dan cakupan wilayah terpilih.</p>
                </div>
                <div className="ps-recommend-cards">
                  <div className="ps-ba-card before">
                    <div className="ps-ba-head">
                      <span className="ps-ba-pill">BEFORE · EVALUASI ISU</span>
                    </div>
                    <strong>{q3 + q4} Area Butuh Pendampingan</strong>
                    <p>{q3} Area Q3 (Kapasitas & Produktivitas) · {q4} Area Q4 (Efektivitas)</p>
                  </div>
                  <div className="ps-ba-card after">
                    <div className="ps-ba-head">
                      <span className="ps-ba-pill">AFTER · TINDAKAN PRIORITAS</span>
                    </div>
                    <strong style={{color: '#10b981'}}>Aktivasi SF Merah & Follow-up HOT</strong>
                    <p>Fasilitasi berkas taksasi tertahan dan asistensi intensif Koordinator Area (Korea).</p>
                  </div>
                </div>
              </div>
            )}

            {slide.kind === 'actions' && (
              <div className="ps-action-body">
                <span>RENCANA TINDAK LANJUT</span>
                <h3>Action Plan & Proyeksi Bulan Berikutnya</h3>
                <p>Acuan langkah prioritas Region Head dan Area Manager untuk mengamankan pertumbuhan pencairan.</p>
                <div className="ps-action-chips">
                  <span>Fokus 30 Hari: Closing HOT</span>
                  <span>Horizon 60 Hari: Aktivasi Tim</span>
                  <span>Horizon 90 Hari: Target Stabil</span>
                  <span>Evaluasi Mingguan</span>
                </div>
              </div>
            )}
          </div>
          {slide.supportingText && <div className="ps-support">{slide.supportingText}</div>}
        </>
      )}

      <div className="ps-footer">
        <span>PT EKA AKAR JATI × BSI · BUSINESS MANAGEMENT REVIEW</span>
        <span className="ps-slide-num">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>
    </article>
  );
}

function Presenter({slides, data, startIndex, onClose, isLive}: {slides: DemoSlide[]; data: PresentationData; startIndex: number; onClose: () => void; isLive?: boolean}) {
  const [current, setCurrent] = useState(Math.min(Math.max(startIndex, 0), slides.length - 1));

  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); setCurrent(i => Math.min(i + 1, slides.length - 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setCurrent(i => Math.max(i - 1, 0)); }
    }
    document.addEventListener('keydown', handle);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = oldOverflow;
    };
  }, [slides.length, onClose]);

  return (
    <div className="presenter-overlay" role="dialog" aria-modal="true" aria-label="Mode presentasi">
      <div className="presenter-top">
        <div>
          <strong>EKA / BUSINESS REVIEW</strong>
          <span>MODE PRESENTASI 16:9 · {isLive ? 'DATA REAL SUPABASE' : 'DATA SIMULASI'}</span>
        </div>
        <button onClick={onClose} className="presenter-close">Tutup <span>ESC</span></button>
      </div>
      <div className="presenter-stage">
        <SlideCanvas slide={slides[current]} data={data} index={current} total={slides.length} isLive={isLive} />
      </div>
      <div className="presenter-bottom">
        <div className="presenter-current">
          {String(current + 1).padStart(2, '0')} <span>/ {String(slides.length).padStart(2, '0')}</span>
          <small>{slides[current].title}</small>
        </div>
        <div className="presenter-controls">
          <button onClick={() => setCurrent(i => Math.max(0, i - 1))} disabled={current === 0} aria-label="Slide sebelumnya">
            <ChevronLeft />
          </button>
          <span>← → untuk berpindah</span>
          <button onClick={() => setCurrent(i => Math.min(slides.length - 1, i + 1))} disabled={current >= slides.length - 1} aria-label="Slide berikutnya">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PresentationStudio({
  period,
  product,
  ro,
  mode,
  onModeChange,
  liveData
}: {
  period: string;
  product: string;
  ro: string;
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  liveData?: PresentationData;
}) {
  const isLive = !!liveData;
  const data = useMemo(() => liveData || getDemoPresentationData(period, product, ro), [liveData, period, product, ro]);
  const originalSlides = useMemo(() => buildDemoSlides(data), [data]);
  const key = `eka.story.v1.${encodeURIComponent(`${period}|${product}|${ro}`)}`;

  const [slides, setSlides] = useState<DemoSlide[]>(() => {
    try {
      const val = window.localStorage.getItem(key);
      if (val) {
        return mergeStoryEdits(originalSlides, JSON.parse(val));
      }
    } catch {
      // ignore
    }
    return originalSlides;
  });

  const [activeId, setActiveId] = useState('cover');
  const [saved, setSaved] = useState(true);
  const [message, setMessage] = useState('');
  const [presenting, setPresenting] = useState<number | null>(null);

  const active = slides.find(s => s.id === activeId) || slides[0];
  const shown = visibleSlides(slides);

  if (!active || !slides.length) {
    return (
      <div className="center-loading" style={{minHeight: '300px'}}>
        Menyiapkan dokumen presentasi...
      </div>
    );
  }

  const patch = (edit: Partial<SlideEdit>) => {
    setSlides(prev => prev.map(s => s.id === active.id ? {...s, ...edit} : s));
    setSaved(false);
    setMessage('');
  };

  const resetOne = () => {
    const defaults = originalSlides.find(x => x.id === active.id);
    if (defaults) {
      setSlides(prev => prev.map(s => s.id === active.id ? defaults : s));
      setSaved(false);
      setMessage('');
    }
  };

  const save = () => {
    const entries: SlideEdits = {};
    for (const s of slides) {
      entries[s.id] = {
        headline: s.headline,
        explanation: s.explanation,
        supportingText: s.supportingText,
        visible: s.visible
      };
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(entries));
      setSaved(true);
      setMessage('✅ Narasi presentasi berhasil disimpan.');
    } catch {
      setSaved(false);
      setMessage('Gagal menyimpan ke penyimpanan lokal.');
    }
  };

  const resetAll = () => {
    if (!window.confirm('Kembalikan seluruh narasi dan visibilitas slide ke acuan awal?')) return;
    try { window.localStorage.removeItem(key); } catch {}
    setSlides(originalSlides);
    setActiveId('cover');
    setSaved(true);
    setMessage('Seluruh slide kembali ke acuan standar.');
  };

  const openPresenter = (slideId?: string) => {
    if (!shown.length) return;
    const idx = slideId ? Math.max(0, shown.findIndex(s => s.id === slideId)) : 0;
    setPresenting(idx);
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `EKA-BSI-Presentation-${ro ? ro.replace(/\s+/g, '_') : 'Nasional'}-${period}`;
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = prevTitle;
        }, 1500);
      }, 100);
    });
  };

  const handleDownloadHtml = () => {
    const printDeck = document.querySelector('.studio-print-deck');
    if (!printDeck) return;
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EKA-BSI-Presentation-${ro ? ro.replace(/\s+/g, '_') : 'Nasional'}-${period}</title>
  ${styleTags}
  <style>
    body { margin: 0; padding: 24px; background: #071522; font-family: 'Poppins', sans-serif; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .offline-bar { width: 100%; max-width: 1280px; display: flex; justify-content: space-between; align-items: center; color: #fff; padding: 12px 18px; background: rgba(255,255,255,0.08); border-radius: 12px; backdrop-filter: blur(8px); }
    .offline-bar strong { font-size: 15px; letter-spacing: 0.05em; }
    .offline-bar small { display: block; font-size: 11px; color: #94b2ca; margin-top: 3px; }
    .offline-actions { display: flex; gap: 10px; }
    .offline-btn { background: #0f344d; color: #fff; border: 1px solid #336184; padding: 9px 15px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all .15s ease; }
    .offline-btn.strong { background: #10b981; border-color: #10b981; }
    .offline-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .studio-print-deck { display: flex !important; flex-direction: column; gap: 28px; width: min(96vw, 1280px); }
    .studio-print-page { width: 100% !important; height: auto !important; }
    .studio-print-page .studio-slide { width: 100% !important; aspect-ratio: 16/9 !important; border-radius: 14px; box-shadow: 0 16px 45px rgba(0,0,0,0.45); }
    @media print {
      body { padding: 0 !important; background: #fff !important; }
      .offline-bar { display: none !important; }
      .studio-print-deck { width: 100% !important; gap: 0 !important; }
      .studio-print-page { page-break-after: always !important; break-after: page !important; }
      .studio-print-page .studio-slide { border-radius: 0 !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="offline-bar">
    <div>
      <strong>PT EKA AKAR JATI × BSI · EKSEKUTIF REVIEW 16:9</strong>
      <small>Cakupan: ${ro || 'Seluruh Regional'} · Periode: ${formatPeriod(period)} · Produk: ${product}</small>
    </div>
    <div class="offline-actions">
      <button class="offline-btn strong" onclick="window.print()">Simpan PDF (16:9)</button>
    </div>
  </div>
  ${printDeck.outerHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EKA-BSI-Presentation-${ro ? ro.replace(/\s+/g, '_') : 'Nasional'}-${period}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="presentation-studio">
      <div className="studio-heading">
        <div>
          <div className="kicker">PRESENTATION TOOLS · BSI</div>
          <h1>{mode === 'editor' ? 'Story Editor Narasi PPT' : 'Preview Presentasi 16:9'}</h1>
          <p>{mode === 'editor' ? 'Sesuaikan narasi dan pesan setiap slide sebelum dibawa ke forum review.' : 'Tinjau tampilan slide executive 16:9 dan jalankan presentasi layar penuh.'}</p>
        </div>
        <div className="studio-heading-actions">
          <span className="studio-local-badge" style={{background: isLive ? '#10b981' : '#f59e0b', color: '#fff'}}>
            {isLive ? 'DATA REAL SUPABASE' : 'DEMO LOKAL'}
          </span>
          <button className="studio-button" type="button" onClick={handleDownloadHtml} title="Unduh File Presentasi Standalone Langsung (1-Klik)">
            <Download size={16} /> Unduh File Langsung
          </button>
          <button className="studio-button" type="button" onClick={handlePrint} title="Cetak atau Simpan sebagai PDF 16:9">
            <FileDown size={16} /> Unduh PDF (16:9)
          </button>
          <button className="studio-button" type="button" onClick={() => onModeChange(mode === 'editor' ? 'preview' : 'editor')}>
            {mode === 'editor' ? <Eye size={16} /> : <BookOpen size={16} />} {mode === 'editor' ? 'Preview Slide' : 'Buka Editor'}
          </button>
          <button className="studio-button strong" onClick={() => openPresenter()} disabled={!shown.length}>
            <MonitorPlay size={16} /> Mulai Presentasi Fullscreen
          </button>
        </div>
      </div>

      <div className="studio-scope">
        <span><b>SUMBER:</b> {isLive ? 'DATABASE REAL BSI' : 'DATA SIMULASI'}</span>
        <span><b>PERIODE:</b> {formatPeriod(period)}</span>
        <span><b>PRODUK:</b> {product === 'ALL' ? 'Semua Produk' : product}</span>
        <span><b>WILAYAH:</b> {ro || 'Seluruh Regional'}</span>
      </div>

      {mode === 'editor' ? (
        <div className="story-workspace">
          <aside className="story-list-panel">
            <div className="story-list-head">
              <strong>Urutan Slide Deck</strong>
              <span>{shown.length} dari {slides.length} aktif</span>
            </div>
            <div className="story-select-list">
              {slides.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => { setActiveId(s.id); setMessage(''); }}
                  className={`story-select ${s.id === active.id ? 'current' : ''}`}
                >
                  <span className="story-order">{String(i + 1).padStart(2, '0')}</span>
                  <span className="story-select-info">
                    <b>{s.title}</b>
                    <small>{s.visible ? 'Ditampilkan' : 'Disembunyikan'}</small>
                  </span>
                  {s.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              ))}
            </div>
          </aside>

          <div className="story-editor-body">
            <div className="story-editor-head">
              <div>
                <div className="kicker">SLIDE {String(slides.indexOf(active) + 1).padStart(2, '0')} / {slides.length}</div>
                <h2>Atur Narasi Slide</h2>
                <p>Teks pesan dapat disesuaikan. Nilai angka bersumber dari database yang disetujui.</p>
              </div>
              <button className="studio-button" onClick={resetOne}><RotateCcw size={15} /> Acuan Awal</button>
            </div>

            <label className="story-toggle">
              <span>
                <b>Tampilkan slide ini</b>
                <small>Slide yang dimatikan tidak akan muncul di preview atau fullscreen presentasi</small>
              </span>
              <input type="checkbox" checked={active.visible} onChange={e => patch({visible: e.target.checked})} />
            </label>

            <div className="story-comparison-box">
              <div className="story-before-card">
                <div className="story-ba-label before">BEFORE · SARAN NARASI SISTEM</div>
                <strong>{active.sourceHeadline}</strong>
                <p>{active.sourceExplanation}</p>
                {active.sourceSupportingText && <small>{active.sourceSupportingText}</small>}
                <button
                  type="button"
                  className="story-copy-btn"
                  onClick={() => patch({
                    headline: active.sourceHeadline,
                    explanation: active.sourceExplanation,
                    supportingText: active.sourceSupportingText
                  })}
                  title="Salin narasi default ke draf kustom Anda"
                >
                  Gunakan Narasi Sistem
                </button>
              </div>

              <div className="story-after-card">
                <div className="story-ba-label after">AFTER · NARASI KUSTOM PRESENTER</div>
                <label className="story-input">
                  <span>HEADLINE / PESAN UTAMA</span>
                  <input type="text" value={active.headline} maxLength={180} onChange={e => patch({headline: e.target.value})} />
                </label>

                <label className="story-input">
                  <span>PENJELASAN KONTEKS</span>
                  <textarea rows={3} value={active.explanation} maxLength={600} onChange={e => patch({explanation: e.target.value})} />
                </label>

                <label className="story-input">
                  <span>PESAN PENDUKUNG</span>
                  <textarea rows={2} value={active.supportingText} maxLength={400} onChange={e => patch({supportingText: e.target.value})} />
                </label>
              </div>
            </div>

            <div className="story-actions">
              <span className="story-save-status">
                {saved ? <><Check size={14} /> Narasi tersimpan</> : 'Ada perubahan narasi yang belum disimpan'}
              </span>
              <button type="button" onClick={() => onModeChange('preview')} className="studio-button">
                <Eye size={15} /> Preview Deck
              </button>
              <button type="button" onClick={save} className="studio-button strong">
                <Save size={15} /> Simpan Perubahan Narasi
              </button>
            </div>
            {message && <p className="story-message" role="status">{message}</p>}
          </div>

          <div className="story-live-preview">
            <div className="story-live-head">
              <b>LIVE PREVIEW 16:9</b>
              <span>{active.visible ? 'Tampil' : 'Disembunyikan'}</span>
            </div>
            <SlideCanvas slide={active} data={data} index={slides.indexOf(active)} total={shown.length} isLive={isLive} />
            <p style={{fontSize: '11px', color: '#64748b', marginTop: '10px'}}>
              Pratinjau proporsi 16:9 secara langsung saat mengedit teks.
            </p>
          </div>
        </div>
      ) : (
        <div className="preview-workspace">
          <div className="preview-intro">
            <div>
              <h2>Susunan Presentasi 16:9</h2>
              <p>{shown.length} slide aktif dari total {slides.length} slide. Klik salah satu slide untuk mulai presentasi fullscreen.</p>
            </div>
            <div className="preview-intro-buttons">
              <button className="studio-button" onClick={resetAll}><RotateCcw size={15} /> Reset Semua</button>
              <button className="studio-button" onClick={handleDownloadHtml} title="Unduh File Presentasi Standalone Langsung">
                <Download size={15} /> Unduh File Langsung
              </button>
              <button className="studio-button strong" onClick={handlePrint} disabled={!shown.length}>
                <FileDown size={15} /> Unduh PDF (16:9)
              </button>
            </div>
          </div>

          <div className="preview-slide-grid">
            {shown.map((s, i) => (
              <button key={s.id} type="button" className="preview-slide-tile" onClick={() => openPresenter(s.id)}>
                <div className="preview-slide-meta">
                  <b>{String(i + 1).padStart(2, '0')} · {s.title}</b>
                  <span><Maximize2 size={13} /> Fullscreen</span>
                </div>
                <div className="preview-slide-canvas">
                  <SlideCanvas slide={s} data={data} index={i} total={shown.length} isLive={isLive} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {presenting !== null && shown.length > 0 && (
        <Presenter
          slides={shown}
          data={data}
          startIndex={presenting}
          onClose={() => setPresenting(null)}
          isLive={isLive}
        />
      )}

      {/* PRINT DECK (16:9 SLIDE PER PAGE FOR PDF DOWNLOAD / CETAK) */}
      <div className="studio-print-deck" aria-hidden="true">
        {shown.map((s, i) => (
          <div key={s.id} className="studio-print-page">
            <SlideCanvas slide={s} data={data} index={i} total={shown.length} isLive={isLive} />
          </div>
        ))}
      </div>
    </section>
  );
}
