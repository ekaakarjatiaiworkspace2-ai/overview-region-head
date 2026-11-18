import {useState, useEffect, type FormEvent} from 'react';
import {Plus, Trash2, Edit3, Send, Sparkles} from 'lucide-react';
import type {ProjectionData, DevelopmentPlan, AreaKpi} from './api';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});

function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', {maximumFractionDigits: 2})} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return `Rp ${idMoney.format(n)}`;
}

export function DevelopmentView({
  projection,
  plans,
  areas,
  loading,
  onSaveProjection,
  onSavePlan,
  onDeletePlan
}: {
  projection: ProjectionData | null;
  plans: DevelopmentPlan[];
  areas: AreaKpi[];
  loading: boolean;
  onSaveProjection: (projRp: number, nextProjRp: number, driverText: string) => Promise<void>;
  onSavePlan: (plan: Partial<DevelopmentPlan>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}) {
  const [projRp, setProjRp] = useState(projection ? String(projection.projection_rp) : '');
  const [nextProjRp, setNextProjRp] = useState(projection ? String(projection.next_projection_rp || '') : '');
  const [driverText, setDriverText] = useState(projection?.driver_text || '');
  const [savingProj, setSavingProj] = useState(false);
  const [projSavedMsg, setProjSavedMsg] = useState('');

  useEffect(() => {
    if (projection) {
      setProjRp(String(projection.projection_rp || ''));
      setNextProjRp(String(projection.next_projection_rp || ''));
      setDriverText(projection.driver_text || '');
    }
  }, [projection]);

  // Plan Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<DevelopmentPlan> | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  async function handleProjSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProj(true);
    setProjSavedMsg('');
    try {
      await onSaveProjection(Number(projRp) || 0, Number(nextProjRp) || 0, driverText);
      setProjSavedMsg('Proyeksi berhasil disimpan!');
      setTimeout(() => setProjSavedMsg(''), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan proyeksi.');
    } finally {
      setSavingProj(false);
    }
  }

  async function handlePlanSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingPlan?.area_id || !editingPlan?.action_plan) {
      alert('Area dan Rencana Tindakan (Action Plan) wajib diisi.');
      return;
    }
    setSavingPlan(true);
    try {
      const selectedArea = areas.find(a => a.area_id === editingPlan.area_id);
      await onSavePlan({
        ...editingPlan,
        area_name: selectedArea?.area_name || editingPlan.area_name || 'Area',
        focus_title: editingPlan.focus_title || editingPlan.action_plan.slice(0, 100),
        include_to_presentation: editingPlan.include_to_presentation || 'YA',
        approval_status: editingPlan.approval_status || 'DISETUJUI'
      });
      setShowModal(false);
      setEditingPlan(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan Action Plan.');
    } finally {
      setSavingPlan(false);
    }
  }

  if (loading) {
    return <div className="center-loading">Memuat proyeksi dan rencana pengembangan...</div>;
  }

  const gap = projection ? (Number(projRp) || 0) - projection.current_target_rp : 0;

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PILAR 5 · LANGKAH PENGEMBANGAN</div>
          <h1>Proyeksi & Action Plan</h1>
          <p>Penetapan proyeksi pertumbuhan bisnis ke depan dan rencana aksi konkret lintas horizon 30-60-90 hari.</p>
        </div>
      </div>

      {/* PROJECTION CARD */}
      <div className="detail-card">
        <div className="detail-heading">
          <Sparkles size={18} />
          <h3>Proyeksi Bisnis Wilayah</h3>
        </div>
        <p className="detail-intro">
          Bulan Acuan: <strong>{projection?.basePeriod || '—'}</strong> · Periode Berjalan: <strong>{projection?.period || '—'}</strong> · Bulan Berikutnya: <strong>{projection?.nextPeriod || '—'}</strong>
        </p>

        <form onSubmit={handleProjSubmit}>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-label">REALISASI BULAN ACUAN</div>
              <div className="stat-value">{smallMoney(projection?.base_actual_rp)}</div>
              <div className="stat-foot">Pencairan aktual closed period</div>
            </div>
            <div className="stat">
              <div className="stat-label">TARGET BULAN INI</div>
              <div className="stat-value">{smallMoney(projection?.current_target_rp)}</div>
              <div className="stat-foot">Target periode berjalan</div>
            </div>
            <div className="stat stat-highlight">
              <div className="stat-label">PROYEKSI BULAN BERJALAN</div>
              <input
                type="number"
                value={projRp}
                onChange={e => setProjRp(e.target.value)}
                className="form-control"
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: 'var(--blue-primary)',
                  marginTop: '8px'
                }}
                required
              />
              <div className="stat-foot" style={{color: gap >= 0 ? 'var(--green-emerald)' : 'var(--red-coral)', marginTop: '6px', fontWeight: '700'}}>
                Gap ke target: {gap >= 0 ? `+${smallMoney(gap)}` : smallMoney(gap)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">PROYEKSI BULAN DEPAN</div>
              <input
                type="number"
                value={nextProjRp}
                onChange={e => setNextProjRp(e.target.value)}
                className="form-control"
                style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  marginTop: '8px'
                }}
              />
              <div className="stat-foot" style={{marginTop: '6px'}}>Estimasi bulan {projection?.nextPeriod || 'mendatang'}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Faktor Pendorong Pertumbuhan (Growth Driver):</label>
            <textarea
              value={driverText}
              onChange={e => setDriverText(e.target.value)}
              rows={2}
              className="form-control"
              placeholder="Contoh: Percepatan penyelesaian SLA berkas tertahan dan penambahan penempatan SF di cabang-cabang utama."
            />
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
            <span style={{fontSize: '12px', color: 'var(--green-emerald)', fontWeight: '700'}}>{projSavedMsg}</span>
            <button className="primary-button" style={{width: 'auto', padding: '0 24px', margin: 0}} disabled={savingProj} type="submit">
              {savingProj ? 'Menyimpan...' : 'Simpan Proyeksi'} <Send size={15} style={{marginLeft: '6px'}} />
            </button>
          </div>
        </form>
      </div>

      {/* ACTION PLANS LIST */}
      <div className="section-title-row">
        <div>
          <h2>Daftar Action Plan Region Head ({plans.length})</h2>
          <span>Langkah tindak lanjut prioritas dengan horizon waktu pelaksanaan yang terukur.</span>
        </div>
        <button
          type="button"
          className="refresh-button"
          style={{background: 'var(--navy-light)', color: '#fff', borderColor: 'var(--navy-light)'}}
          onClick={() => {
            setEditingPlan({
              period_id: projection?.period || '2026-10',
              area_id: areas[0]?.area_id || '',
              area_name: areas[0]?.area_name || '',
              focus_title: '',
              action_plan: '',
              how_to: '',
              pic: '',
              deadline: '',
              horizon_30_day: '',
              horizon_60_day: '',
              horizon_90_day: '',
              target_result: '',
              include_to_presentation: 'YA'
            });
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Tambah Action Plan
        </button>
      </div>

      <div className="action-plan-list">
        {plans.map((p, idx) => (
          <div key={p.plan_id || idx} className="action-plan-card">
            <div className="action-plan-header">
              <div>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px'}}>
                  <span className="status-pill green">{p.approval_status || 'DISETUJUI'}</span>
                  <span className="status-pill neutral">{p.area_name}</span>
                  {p.include_to_presentation === 'YA' && (
                    <span className="status-pill amber">Tampil di PPT</span>
                  )}
                </div>
                <h3 className="action-plan-title">
                  {p.focus_title || p.action_plan}
                </h3>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  type="button"
                  className="icon-btn"
                  title="Edit Rencana"
                  onClick={() => {
                    setEditingPlan(p);
                    setShowModal(true);
                  }}
                >
                  <Edit3 size={15} color="var(--text-muted)" />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Hapus Rencana"
                  onClick={() => {
                    if (confirm(`Hapus action plan "${p.focus_title}"?`)) {
                      onDeletePlan(p.plan_id);
                    }
                  }}
                >
                  <Trash2 size={15} color="var(--red-coral)" />
                </button>
              </div>
            </div>

            <p style={{fontSize: '12px', color: 'var(--text-body)', lineHeight: '1.6', margin: '8px 0'}}>
              <strong>Action Plan:</strong> {p.action_plan}
            </p>
            {p.how_to && (
              <p style={{fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '4px 0'}}>
                <strong>Strategi / Cara Eksekusi:</strong> {p.how_to}
              </p>
            )}

            <div className="action-plan-horizon-grid">
              <div className="horizon-cell">
                <span>Horizon 30 Hari</span>
                <div>{p.horizon_30_day || 'Fokus eksekusi awal.'}</div>
              </div>
              <div className="horizon-cell">
                <span>Horizon 60 Hari</span>
                <div>{p.horizon_60_day || 'Penguatan kapasitas tim.'}</div>
              </div>
              <div className="horizon-cell">
                <span>Horizon 90 Hari</span>
                <div>{p.horizon_90_day || 'Pencapaian target stabil.'}</div>
              </div>
            </div>

            <div className="action-plan-meta">
              <span><strong>PIC:</strong> {p.pic || 'Region Head'}</span>
              <span><strong>Tenggat:</strong> {p.deadline || 'Akhir Bulan'}</span>
              <span><strong>Target Hasil:</strong> {p.target_result || 'Pencapaian Target Wilayah'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM */}
      {showModal && editingPlan && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>{editingPlan.plan_id?.startsWith('PLAN-') ? 'Edit Action Plan' : 'Tambah Action Plan Baru'}</h2>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Area Terkait</label>
                <select
                  value={editingPlan.area_id}
                  onChange={e => setEditingPlan({...editingPlan, area_id: e.target.value})}
                  className="form-control"
                >
                  {areas.map(a => (
                    <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Judul Fokus / Tindakan</label>
                <input
                  type="text"
                  value={editingPlan.focus_title || ''}
                  onChange={e => setEditingPlan({...editingPlan, focus_title: e.target.value})}
                  placeholder="Contoh: Percepatan Konversi Pipeline HOT"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Deskripsi Rencana Aksi (Action Plan)</label>
                <textarea
                  value={editingPlan.action_plan || ''}
                  onChange={e => setEditingPlan({...editingPlan, action_plan: e.target.value})}
                  rows={2}
                  placeholder="Jelaskan tindakan konkret apa yang akan dilakukan..."
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Strategi / How-To</label>
                <textarea
                  value={editingPlan.how_to || ''}
                  onChange={e => setEditingPlan({...editingPlan, how_to: e.target.value})}
                  rows={2}
                  placeholder="Langkah spesifik, jadwal koordinasi, briefing..."
                  className="form-control"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    value={editingPlan.pic || ''}
                    onChange={e => setEditingPlan({...editingPlan, pic: e.target.value})}
                    placeholder="Nama PIC"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Tenggat Waktu (Deadline)</label>
                  <input
                    type="text"
                    value={editingPlan.deadline || ''}
                    onChange={e => setEditingPlan({...editingPlan, deadline: e.target.value})}
                    placeholder="Contoh: 30 November"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Hasil</label>
                <input
                  type="text"
                  value={editingPlan.target_result || ''}
                  onChange={e => setEditingPlan({...editingPlan, target_result: e.target.value})}
                  placeholder="Contoh: Realisasi minimal Rp 5 Miliar"
                  className="form-control"
                />
              </div>

              <div style={{display: 'flex', gap: '10px', alignItems: 'center', margin: '16px 0'}}>
                <input
                  type="checkbox"
                  id="includePpt"
                  checked={editingPlan.include_to_presentation === 'YA'}
                  onChange={e => setEditingPlan({...editingPlan, include_to_presentation: e.target.checked ? 'YA' : 'TIDAK'})}
                />
                <label htmlFor="includePpt" style={{fontSize: '12px', color: 'var(--text-headline)', cursor: 'pointer', fontWeight: '500'}}>
                  Sertakan rencana ini ke dalam Slide Presentasi Eksekutif
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{width: 'auto', padding: '0 20px', margin: 0}}
                  disabled={savingPlan}
                >
                  {savingPlan ? 'Menyimpan...' : 'Simpan Action Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
