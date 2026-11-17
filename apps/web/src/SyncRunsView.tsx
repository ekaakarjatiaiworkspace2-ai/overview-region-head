import {useState} from 'react';
import {RefreshCw, CloudDownload, CheckCircle2, AlertTriangle} from 'lucide-react';
import type {SyncRun} from './api';

export function SyncRunsView({
  runs,
  loading,
  onRefresh,
  onSyncMaster
}: {
  runs: SyncRun[];
  loading: boolean;
  onRefresh: () => void;
  onSyncMaster?: () => Promise<{ok: boolean; summary?: Record<string, number>}>;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleTriggerSync() {
    if (!onSyncMaster) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await onSyncMaster();
      if (res.ok) {
        const s = res.summary || {};
        setSyncResult(`Sinkronisasi berhasil! Tersimpan: ${s.rank_korea || 0} Korea, ${s.pipeline_reasons || 0} Alasan Pipeline, ${s.potensi_area || 0} Potensi Area, ${s.ro_rh_scope || 0} Scope Wilayah.`);
        onRefresh();
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Gagal sinkronisasi data.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="center-loading">Memuat log sinkronisasi database...</div>;
  }

  return (
    <div className="view-container">
      <div className="page-top">
        <div>
          <div className="kicker">PLATFORM & AUDIT · SUPABASE POSTGRESQL</div>
          <h1>Log Sinkronisasi Database</h1>
          <p>Penarikan data langsung dari Google Sheets master, validasi kontrak kolom, dan publikasi ke database Supabase.</p>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {onSyncMaster && (
            <button
              className="refresh-button"
              style={{background: 'var(--blue-primary)', color: '#fff', borderColor: 'var(--blue-primary)', fontWeight: '700'}}
              onClick={handleTriggerSync}
              disabled={syncing}
            >
              <CloudDownload size={16} className={syncing ? 'rotate' : ''} />
              {syncing ? 'Menyinkronkan dari Google Sheets...' : 'Tarik Data dari Google Sheets Sekarang'}
            </button>
          )}
          <button className="refresh-button" onClick={onRefresh} disabled={syncing}>
            <RefreshCw size={15} /> Segarkan Log
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="notice success" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'}}>
          <CheckCircle2 size={18} style={{color: 'var(--green-emerald)', flexShrink: 0}} />
          <span>{syncResult}</span>
        </div>
      )}

      {syncError && (
        <div className="notice danger" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'}}>
          <AlertTriangle size={18} style={{color: 'var(--red-coral)', flexShrink: 0}} />
          <span>{syncError}</span>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat stat-highlight">
          <div className="stat-label">TOTAL RIWAYAT SINKRONISASI</div>
          <div className="stat-value">{runs.length} Kali</div>
          <div className="stat-foot">Terekam di tabel source_sync_runs</div>
        </div>
        <div className="stat">
          <div className="stat-label">STATUS TERAKHIR</div>
          <div className="stat-value" style={{color: runs[0]?.status === 'SUCCESS' ? 'var(--green-emerald)' : 'var(--amber-warm)'}}>
            {runs[0]?.status || 'Belum Ada'}
          </div>
          <div className="stat-foot">
            {runs[0]?.started_at ? new Date(runs[0].started_at).toLocaleString('id-ID') : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">BARIS DATA TERAKHIR</div>
          <div className="stat-value">{runs[0]?.records_read || 0} Baris</div>
          <div className="stat-foot">Sumber: {runs[0]?.source_name || '04_AREA_PERFORMANCE'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">VERSI SNAPSHOT TERBIT</div>
          <div className="stat-value">{runs[0]?.versions_published || 0} Snapshot</div>
          <div className="stat-foot">Dataset atomic multi-version</div>
        </div>
      </div>

      <div className="section-title-row">
        <div>
          <h2>Riwayat Eksekusi Ingest ({runs.length})</h2>
          <span>Audit trail integritas data, deteksi hash duplikasi, dan pencatatan error webhook.</span>
        </div>
      </div>

      <div className="data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{width: '170px'}}>WAKTU MULAI</th>
                <th style={{width: '220px'}}>SUMBER DATA</th>
                <th style={{width: '130px'}}>STATUS</th>
                <th className="number" style={{width: '130px'}}>BARIS DIBACA</th>
                <th className="number" style={{width: '140px'}}>SNAPSHOT TERBIT</th>
                <th style={{width: '130px'}}>WAKTU SELESAI</th>
                <th style={{minWidth: '260px'}}>CATATAN / PESAN</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong>{new Date(r.started_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</strong>
                    <small>{new Date(r.started_at).toLocaleTimeString('id-ID')}</small>
                  </td>
                  <td><code>{r.source_name}</code></td>
                  <td>
                    <span className={`status-pill ${r.status === 'SUCCESS' ? 'green' : r.status === 'FAILED' ? 'danger' : 'amber'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="number emph">{r.records_read}</td>
                  <td className="number">{r.versions_published}</td>
                  <td>{r.finished_at ? new Date(r.finished_at).toLocaleTimeString('id-ID') : '—'}</td>
                  <td>
                    {r.error_message ? (
                      <span style={{color: 'var(--red-coral)', fontSize: '11px'}}>{r.error_message}</span>
                    ) : (
                      <span style={{color: 'var(--green-emerald)', fontSize: '11px', fontWeight: '600'}}>Data valid & terpublikasi</span>
                    )}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={7} className="empty-row">Belum ada log sinkronisasi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
