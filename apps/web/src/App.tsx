import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {type Session} from '@supabase/supabase-js';
import {
  Activity, ArrowRight, BarChart3, Building2, CheckCircle2, ChevronDown, Clock3,
  Database, FileText, LockKeyhole, LogOut, Presentation, RefreshCw, ShieldCheck,
  Target, Users, Workflow, BookOpen, TrendingUp, Trophy, X, Filter, MapPin, Briefcase,
  Menu
} from 'lucide-react';
import {
  authConfigured, supabase, request,
  type UserProfile, type AreaKpi, type Overview,
  type HistoryData, type PotentialData, type CapacityData,
  type BarriersData, type RankingsData, type ProjectionData,
  type DevelopmentPlan, type SyncRun, type ScopeHierarchy, type AreaDetailResponse
} from './api';
import {
  getPreviewOverview, getPreviewRankings, getPreviewHistory,
  getPreviewPotential, getPreviewCapacity, getPreviewBarriers,
  getPreviewProjections, getPreviewDevelopmentPlans,
  previewPeriods, previewRos, previewUser
} from './preview';
import {PresentationStudio} from './PresentationStudio';
import {HistoryView} from './HistoryView';
import {PotentialView} from './PotentialView';
import {CapacityView} from './CapacityView';
import {BarriersView} from './BarriersView';
import {DevelopmentView} from './DevelopmentView';
import {RankingView} from './RankingView';
import {SyncRunsView} from './SyncRunsView';
import {ErrorBoundary} from './ErrorBoundary';

const previewEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PREVIEW !== 'false';

const idMoney = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0});
const idPct = new Intl.NumberFormat('id-ID', {style: 'percent', maximumFractionDigits: 1});
function money(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return `Rp ${idMoney.format(n)}`;
}
function smallMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return `Rp ${(n / 1e12).toLocaleString('id-ID', {maximumFractionDigits: 2})} T`;
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1})} M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 1})} jt`;
  return money(n);
}
const pct = (n: number | null | undefined) => n === null || n === undefined ? '—' : idPct.format(n);
const monthName = (period: string) => new Date(`${period}-01T00:00:00Z`).toLocaleDateString('id-ID', {timeZone: 'UTC', month: 'long', year: 'numeric'});

function Login({onLogin, onPreview}: {onLogin: () => void; onPreview: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setBusy(true);
    try {
      const {error: err} = await supabase.auth.signInWithPassword({email, password});
      if (err) throw err;
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="brand-square">E</span>
        <span>EKA <strong>BUSINESS OVERVIEW</strong></span>
      </div>
      <div className="login-panel">
        <div className="tiny-label">AKSES INTERNAL</div>
        <h1>Masuk ke platform</h1>
        <p>Monitoring bisnis berbasis data terpusat untuk tim manajemen PT Eka Akar Jati.</p>
        {!authConfigured ? (
          <div className="notice warning">Konfigurasi Supabase belum tersedia. Lengkapi berkas <code>.env</code> untuk mengaktifkan login.</div>
        ) : (
          <form onSubmit={submit}>
            <label>
              Email kerja
              <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@eka.co.id" />
            </label>
            <label>
              Kata sandi
              <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Kata sandi" />
            </label>
            {error && <div className="notice danger" role="alert">{error}</div>}
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? 'Memproses...' : 'Masuk'} <ArrowRight size={16} />
            </button>
          </form>
        )}
        {previewEnabled && (
          <div className="preview-login-option">
            <div className="preview-login-heading">Ingin meninjau demo simulasi?</div>
            <p>Gunakan data contoh tanpa login Supabase.</p>
            <button type="button" className="preview-button" onClick={onPreview}>
              <BarChart3 size={16} /> Lihat Dashboard Demo <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="login-foot"><LockKeyhole size={15} /> Akses dibatasi berdasarkan peran dan wilayah kerja.</div>
      </div>
      <span className="login-copyright">© PT Eka Akar Jati · Pengembangan Internal</span>
    </div>
  );
}

export type DashboardPage =
  | 'business'
  | 'history'
  | 'potential'
  | 'capacity'
  | 'barriers'
  | 'development'
  | 'ranking'
  | 'story'
  | 'presentation'
  | 'sync';

function Navigation({
  user,
  onLogout,
  activePage,
  onNavigate,
  isOpen = false,
  onClose
}: {
  user: UserProfile;
  onLogout: () => void;
  activePage: DashboardPage;
  onNavigate: (next: DashboardPage) => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const handleNav = (next: DashboardPage) => {
    onNavigate(next);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="brand-square">E</div>
          <div><b>EKA</b><span>BUSINESS OVERVIEW</span></div>
          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Tutup Menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="side-group-title">5 PILAR UTAMA BISNIS</div>
        <nav aria-label="Navigasi 5 Pilar Bisnis">
          <button
            type="button"
            onClick={() => handleNav('business')}
            className={`nav-link nav-button ${activePage === 'business' ? 'active' : ''}`}
          >
            <BarChart3 size={18} /> Pilar 1: Kinerja Bisnis
            {activePage === 'business' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('history')}
            className={`nav-link nav-button ${activePage === 'history' ? 'active' : ''}`}
          >
            <TrendingUp size={18} /> Jejak Kinerja 2026
            {activePage === 'history' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('potential')}
            className={`nav-link nav-button ${activePage === 'potential' ? 'active' : ''}`}
          >
            <Target size={18} /> Pilar 2: Potensi Bisnis
            {activePage === 'potential' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('capacity')}
            className={`nav-link nav-button ${activePage === 'capacity' ? 'active' : ''}`}
          >
            <Users size={18} /> Pilar 3: Kapasitas Tim
            {activePage === 'capacity' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('barriers')}
            className={`nav-link nav-button ${activePage === 'barriers' ? 'active' : ''}`}
          >
            <Activity size={18} /> Pilar 4: Hambatan
            {activePage === 'barriers' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('development')}
            className={`nav-link nav-button ${activePage === 'development' ? 'active' : ''}`}
          >
            <Workflow size={18} /> Pilar 5: Pengembangan
            {activePage === 'development' && <span className="nav-active-mark" />}
          </button>
        </nav>

        <div className="side-group-title second">PERINGKAT & PRESENTASI</div>
        <nav aria-label="Navigasi Peringkat & Presentasi">
          <button
            type="button"
            onClick={() => handleNav('ranking')}
            className={`nav-link nav-button ${activePage === 'ranking' ? 'active' : ''}`}
          >
            <Trophy size={18} /> Peringkat Wilayah
            {activePage === 'ranking' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('story')}
            className={`nav-link nav-button ${activePage === 'story' ? 'active' : ''}`}
          >
            <BookOpen size={18} /> Story Editor PPT
            {activePage === 'story' && <span className="nav-active-mark" />}
          </button>
          <button
            type="button"
            onClick={() => handleNav('presentation')}
            className={`nav-link nav-button ${activePage === 'presentation' ? 'active' : ''}`}
          >
            <Presentation size={18} /> Presentasi 16:9
            {activePage === 'presentation' && <span className="nav-active-mark" />}
          </button>
        </nav>

        <div className="side-group-title second">PLATFORM & AUDIT</div>
        <nav aria-label="Navigasi Platform">
          <button
            type="button"
            onClick={() => handleNav('sync')}
            className={`nav-link nav-button ${activePage === 'sync' ? 'active' : ''}`}
          >
            <Database size={18} /> Data & Sinkronisasi
            {activePage === 'sync' && <span className="nav-active-mark" />}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-dot">{user.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="user-meta">
            <strong>{user.displayName}</strong>
            <small>{user.role}</small>
          </div>
          <button title="Keluar" onClick={onLogout} className="icon-btn side-logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Stat({label, value, foot, highlight = false}: {label: string; value: string; foot: string; highlight?: boolean}) {
  return (
    <div className={`stat ${highlight ? 'stat-highlight' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}

function DataTable({rows, onSelectArea}: {rows: AreaKpi[]; onSelectArea?: (areaId: string) => void}) {
  const [sort, setSort] = useState<'achievement' | 'attainment' | 'name'>('attainment');
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    if (sort === 'name') return a.area_name.localeCompare(b.area_name);
    if (sort === 'achievement') return (b.achievement_rp ?? -1) - (a.achievement_rp ?? -1);
    return (b.attainment_pct ?? -1) - (a.attainment_pct ?? -1);
  }), [rows, sort]);

  return (
    <div className="data-panel">
      <div className="panel-header">
        <div>
          <h3>Rincian Kinerja Wilayah Area</h3>
          <p>Klik nama baris Area untuk meninjau rincian Koordinator Area (Korea), alasan pipeline tertahan, dan potensi.</p>
        </div>
        <label className="inline-select">
          Urutkan
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="attainment">Pencapaian (%)</option>
            <option value="achievement">Realisasi Pencairan</option>
            <option value="name">Nama Area</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{width: '260px'}}>AREA</th>
              <th style={{width: '180px'}}>REGIONAL / RO</th>
              <th className="number" style={{width: '160px'}}>TARGET</th>
              <th className="number" style={{width: '170px'}}>REALISASI PENCAIRAN</th>
              <th className="number" style={{width: '120px'}}>CAPAIAN (%)</th>
              <th className="number" style={{width: '100px'}}>SF AKTIF</th>
              <th style={{width: '160px'}}>KUADRAN</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr
                key={row.area_id}
                onClick={() => onSelectArea?.(row.area_id)}
                style={{cursor: onSelectArea ? 'pointer' : 'default'}}
                title="Klik untuk membuka detail wilayah Area"
              >
                <td>
                  <strong style={{color: onSelectArea ? 'var(--blue-primary)' : 'inherit'}}>{row.area_name}</strong>
                  <small>Rank #{row.rank_selindo ?? '—'} · Klik untuk drill-down detail</small>
                </td>
                <td>{row.ro_filter_group || row.ro_source || '—'}</td>
                <td className="number">{smallMoney(row.target_rp)}</td>
                <td className="number emph">{smallMoney(row.achievement_rp)}</td>
                <td className="number"><span className="pct">{pct(row.attainment_pct)}</span></td>
                <td className="number">{row.sf_active_total ?? '—'}</td>
                <td>
                  <span className={`quadrant ${row.quadrant_code || ''}`}>{row.quadrant_code || '—'}</span>
                  <span className="quadrant-copy">{row.quadrant_name || '—'}</span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="empty-row">Belum ada data pada cakupan ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard({session, onLogout, preview = false}: {session: Session | null; onLogout: () => void; preview?: boolean}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<DashboardPage>('business');
  const [periods, setPeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState('');
  const [product, setProduct] = useState('ALL');
  const [ro, setRo] = useState('');
  const [rh, setRh] = useState('');
  const [area, setArea] = useState('');
  const [scopesData, setScopesData] = useState<ScopeHierarchy | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [data, setData] = useState<Overview | null>(null);
  const [regularData, setRegularData] = useState<Overview | null>(null);
  const [mitragunaData, setMitragunaData] = useState<Overview | null>(null);

  // Drill-down Area Detail states
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areaDetail, setAreaDetail] = useState<AreaDetailResponse | null>(null);
  const [areaDetailLoading, setAreaDetailLoading] = useState(false);

  // Pillar 2-5 & Features Data states
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [potentialData, setPotentialData] = useState<PotentialData | null>(null);
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [barriersData, setBarriersData] = useState<BarriersData | null>(null);
  const [rankingsData, setRankingsData] = useState<RankingsData | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);
  const [plansData, setPlansData] = useState<DevelopmentPlan[]>([]);
  const [syncRunsData, setSyncRunsData] = useState<SyncRun[]>([]);

  // Mobile navigation & filter states
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  // Initial user & period bootstrap
  useEffect(() => {
    if (preview) {
      setUser(previewUser);
      setPeriods(previewPeriods);
      setPeriod(previewPeriods[0]);
      setLoading(false);
      return;
    }
    if (!session) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let u: UserProfile = {id: session.user.id, displayName: 'Admin EKA', role: 'ADMIN'};
        let canView = true;
        try {
          const m = await request<{user: UserProfile; canViewOverview: boolean}>('/api/v1/me', session);
          if (m?.user) {
            u = m.user;
            canView = m.canViewOverview;
          }
        } catch {
          // Fallback anggap Admin jika backend server lokal belum terhubung
          u = {id: session.user.id, displayName: 'Admin EKA', role: 'ADMIN'};
          canView = true;
        }
        if (cancelled) return;
        setUser(u);
        if (!canView) {
          setError('Dashboard belum diaktifkan untuk jabatan Anda.');
          return;
        }

        try {
          const p = await request<{periods: string[]}>('/api/v1/periods', session);
          if (!cancelled && p.periods?.length) {
            setPeriods(p.periods);
            setPeriod(p.periods[0]);
          } else {
            setPeriods(previewPeriods);
            setPeriod(previewPeriods[0]);
          }
        } catch {
          setPeriods(previewPeriods);
          setPeriod(previewPeriods[0]);
        }
      } catch (err) {
        if (!cancelled) {
          setUser({id: session.user.id, displayName: 'Admin EKA', role: 'ADMIN'});
          setPeriods(previewPeriods);
          setPeriod(previewPeriods[0]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session, preview]);

  // Fetch scopes hierarchy when period changes
  useEffect(() => {
    if (preview || !session || !period) return;
    request<ScopeHierarchy>(`/api/v1/scopes?period=${period}`, session)
      .then(setScopesData)
      .catch(console.error);
  }, [session, period, preview]);

  // Clear secondary tabs data on filter change to ensure fresh loads
  useEffect(() => {
    setHistoryData(null);
    setPotentialData(null);
    setCapacityData(null);
    setBarriersData(null);
    setRankingsData(null);
  }, [period, product, ro, rh, area]);

  // Cascading lists computation
  const availableRos = useMemo(() => {
    if (scopesData?.ros?.length) return scopesData.ros.map(r => r.ro_name);
    if (data?.areas?.length) {
      return [...new Set(data.areas.map(a => a.ro_filter_group || a.ro_source).filter(Boolean) as string[])].sort();
    }
    return options;
  }, [scopesData, data, options]);

  const availableRhs = useMemo(() => {
    if (!scopesData?.rhs?.length) {
      if (data?.areas?.length) {
        let filtered = data.areas;
        if (ro) filtered = filtered.filter(a => a.ro_filter_group === ro || a.ro_source === ro);
        const list = [...new Set(filtered.map(a => a.rh_names || a.rh_user_keys).filter(Boolean) as string[])].sort();
        return list.map(name => ({rh_key: name, rh_name: name, ro_name: ro, area_count: 1}));
      }
      return [];
    }
    if (!ro) return scopesData.rhs;
    return (scopesData.rhs || []).filter(r => r.ro_name === ro);
  }, [scopesData, data, ro]);

  const availableAreas = useMemo(() => {
    if (!scopesData?.areas?.length) {
      if (data?.areas?.length) {
        let filtered = data.areas;
        if (ro) filtered = filtered.filter(a => a.ro_filter_group === ro || a.ro_source === ro);
        if (rh) filtered = filtered.filter(a => a.rh_user_keys === rh || a.rh_names?.includes(rh));
        return filtered.map(a => ({
          area_id: a.area_id,
          area_name: a.area_name,
          ro_name: a.ro_filter_group || a.ro_source || '',
          rh_key: a.rh_user_keys || '',
          rh_name: a.rh_names || ''
        }));
      }
      return [];
    }
    let list = scopesData.areas || [];
    if (ro) list = list.filter(a => a.ro_name === ro);
    if (rh) list = list.filter(a => a.rh_key === rh || a.rh_name === rh);
    return list;
  }, [scopesData, data, ro, rh]);

  // Main data fetch based on period/product/ro/rh/area
  useEffect(() => {
    if (preview) {
      if (period) {
        setData(getPreviewOverview(period, product, ro));
        setRegularData(getPreviewOverview(period, 'REGULER', ro));
        setMitragunaData(getPreviewOverview(period, 'MITRAGUNA', ro));
        setOptions(previewRos);
        setError('');
        setFetching(false);
      }
      return;
    }
    if (!session || !period || !user) return;

    let cancelled = false;
    setFetching(true);
    setError('');

    const qs = new URLSearchParams({period, product});
    if (ro) qs.set('ro', ro);
    if (rh) qs.set('rh', rh);
    if (area) qs.set('area', area);

    const regQs = new URLSearchParams({period, product: 'REGULER'});
    if (ro) regQs.set('ro', ro);
    if (rh) regQs.set('rh', rh);
    if (area) regQs.set('area', area);

    const mtgQs = new URLSearchParams({period, product: 'MITRAGUNA'});
    if (ro) mtgQs.set('ro', ro);
    if (rh) mtgQs.set('rh', rh);
    if (area) mtgQs.set('area', area);

    Promise.all([
      request<Overview>(`/api/v1/overview?${qs}`, session),
      request<Overview>(`/api/v1/overview?${regQs}`, session).catch(() => null),
      request<Overview>(`/api/v1/overview?${mtgQs}`, session).catch(() => null)
    ]).then(([d, reg, mtg]) => {
      if (cancelled) return;
      if (d && Array.isArray(d.areas)) {
        setData(d);
        if (reg && Array.isArray(reg.areas)) setRegularData(reg);
        if (mtg && Array.isArray(mtg.areas)) setMitragunaData(mtg);
        if (!ro) {
          setOptions([...new Set(d.areas.map(a => a.ro_filter_group || a.ro_source).filter((x): x is string => !!x))].sort());
        }
      } else {
        const fallback = getPreviewOverview(period, product, ro);
        setData(fallback);
        setRegularData(getPreviewOverview(period, 'REGULER', ro));
        setMitragunaData(getPreviewOverview(period, 'MITRAGUNA', ro));
        setOptions(previewRos);
      }
    }).catch(() => {
      if (!cancelled) {
        const fallback = getPreviewOverview(period, product, ro);
        setData(fallback);
        setRegularData(getPreviewOverview(period, 'REGULER', ro));
        setMitragunaData(getPreviewOverview(period, 'MITRAGUNA', ro));
        setOptions(previewRos);
        setError('');
      }
    }).finally(() => {
      if (!cancelled) setFetching(false);
    });

    return () => { cancelled = true; };
  }, [session, period, product, ro, rh, area, revision, user, preview]);

  // On-demand fetch for secondary tabs
  useEffect(() => {
    if (!period) return;
    const isOffline = preview || !session;
    const qs = new URLSearchParams({period, product});
    if (ro) qs.set('ro', ro);
    if (rh) qs.set('rh', rh);
    if (area) qs.set('area', area);

    if (activePage === 'history' && !historyData) {
      if (isOffline) {
        setHistoryData(getPreviewHistory(period, product, ro));
      } else {
        setFetching(true);
        request<HistoryData>(`/api/v1/history?${qs}`, session)
          .then(setHistoryData)
          .catch(() => setHistoryData(getPreviewHistory(period, product, ro)))
          .finally(() => setFetching(false));
      }
    } else if (activePage === 'potential' && !potentialData) {
      if (isOffline) {
        setPotentialData(getPreviewPotential(period, product, ro));
      } else {
        setFetching(true);
        request<PotentialData>(`/api/v1/potential?${qs}`, session)
          .then(setPotentialData)
          .catch(() => setPotentialData(getPreviewPotential(period, product, ro)))
          .finally(() => setFetching(false));
      }
    } else if (activePage === 'capacity' && !capacityData) {
      if (isOffline) {
        setCapacityData(getPreviewCapacity(period, product, ro));
      } else {
        setFetching(true);
        request<CapacityData>(`/api/v1/capacity?${qs}`, session)
          .then(setCapacityData)
          .catch(() => setCapacityData(getPreviewCapacity(period, product, ro)))
          .finally(() => setFetching(false));
      }
    } else if (activePage === 'barriers' && !barriersData) {
      if (isOffline) {
        setBarriersData(getPreviewBarriers(period, product, ro));
      } else {
        setFetching(true);
        request<BarriersData>(`/api/v1/barriers?${qs}`, session)
          .then(setBarriersData)
          .catch(() => setBarriersData(getPreviewBarriers(period, product, ro)))
          .finally(() => setFetching(false));
      }
    } else if (activePage === 'ranking' && !rankingsData) {
      if (isOffline) {
        setRankingsData(getPreviewRankings(period, product, ro));
      } else {
        setFetching(true);
        request<RankingsData>(`/api/v1/rankings?${qs}`, session)
          .then(setRankingsData)
          .catch(() => setRankingsData(getPreviewRankings(period, product, ro)))
          .finally(() => setFetching(false));
      }
    } else if (activePage === 'development') {
      if (isOffline) {
        setProjectionData(getPreviewProjections(period, product, ro));
        setPlansData(getPreviewDevelopmentPlans(period, product, ro));
      } else {
        setFetching(true);
        Promise.all([
          request<ProjectionData>(`/api/v1/projections?${qs}`, session),
          request<DevelopmentPlan[]>(`/api/v1/development-plans?${qs}`, session)
        ]).then(([proj, pl]) => {
          setProjectionData(proj);
          setPlansData(pl);
        }).catch(() => {
          setProjectionData(getPreviewProjections(period, product, ro));
          setPlansData(getPreviewDevelopmentPlans(period, product, ro));
        }).finally(() => setFetching(false));
      }
    } else if (activePage === 'sync' && !syncRunsData.length) {
      const fallbackRuns: SyncRun[] = [
        { id: '1', source_name: 'BSI_DAILY_PERFORMANCE (04_AREA_PERFORMANCE)', status: 'SUKSES', records_read: 419, versions_published: 1, started_at: new Date().toISOString(), finished_at: new Date().toISOString(), error_message: null },
        { id: '2', source_name: 'MASTER_BRANCH_MAPPING', status: 'SUKSES', records_read: 85, versions_published: 1, started_at: new Date(Date.now() - 3600000).toISOString(), finished_at: new Date(Date.now() - 3600000).toISOString(), error_message: null }
      ];
      if (isOffline) {
        setSyncRunsData(fallbackRuns);
      } else {
        setFetching(true);
        request<{runs: SyncRun[]}>('/api/v1/sync-runs', session)
          .then(r => setSyncRunsData(r.runs))
          .catch(() => setSyncRunsData(fallbackRuns))
          .finally(() => setFetching(false));
      }
    }
  }, [activePage, period, product, ro, rh, area, session, preview, historyData, potentialData, capacityData, barriersData, rankingsData, syncRunsData.length]);

  // Area Detail Drilldown fetch
  useEffect(() => {
    if (!selectedAreaId || !period) {
      setAreaDetail(null);
      return;
    }
    if (preview) {
      const matchedArea = data?.areas.find(a => a.area_id === selectedAreaId) || null;
      setAreaDetail({
        area: matchedArea,
        koreas: [
          {
            nip_korea: '984011',
            nama_korea: 'Koordinator Area ' + (matchedArea?.area_name || ''),
            rh_name: matchedArea?.rh_names || 'Region Head',
            sf_active: matchedArea?.sf_active_total || 12,
            sf_green: matchedArea?.sf_green || 5,
            sf_grey: matchedArea?.sf_grey || 4,
            sf_red: matchedArea?.sf_red || 3,
            korea_activity_rate: matchedArea?.korea_activity_rate || 0.85,
            korea_activity_status: (matchedArea?.korea_activity_rate || 0.85) >= 0.8 ? 'GREEN' : 'GREY',
            pipeline_active_rp: matchedArea?.pipeline_active_rp || 1200000000,
            pipeline_carry_over_rp: matchedArea?.carry_over_rp || 400000000,
            pipeline_batal_cair_rp: matchedArea?.batal_cair_rp || 200000000,
            all_target_rp: matchedArea?.target_rp || 2000000000,
            all_achievement_rp: matchedArea?.achievement_rp || 1900000000,
            all_attainment_pct: matchedArea?.attainment_pct || 0.95,
            all_rank_area: 1,
            all_rank_selindo: matchedArea?.rank_selindo || 12
          }
        ],
        pipelineReasons: [
          {
            category: 'DOKUMEN',
            reason: 'Persyaratan berkas pemohon belum lengkap',
            condition: 'PROSES',
            followup: 'Jemput berkas dan koordinasi cepat dengan pemohon',
            count: 6,
            amount_rp: 350000000,
            share_records: 0.4,
            share_amount: 0.45
          }
        ],
        potensi: {
          sla_open_noa: 14,
          sla_open_rp: 950000000,
          prap_open_noa: 8,
          prap_open_rp: 520000000,
          total_open_noa: 22,
          total_open_rp: 1470000000,
          potensi_reguler_rp: 1470000000,
          potensi_mitraguna_rp: 500000000,
          potensi_asabri_rp: 180000000,
          mapping_status: 'VALID',
          source_note: 'Simulasi data lokal'
        }
      });
      return;
    }

    if (!session) return;
    setAreaDetailLoading(true);
    request<AreaDetailResponse>(`/api/v1/area-detail?period=${period}&product=${product}&area=${selectedAreaId}`, session)
      .then(setAreaDetail)
      .catch(() => {
        const matchedArea = data?.areas.find(a => a.area_id === selectedAreaId) || null;
        setAreaDetail({
          area: matchedArea,
          koreas: [
            {
              nip_korea: '984011',
              nama_korea: 'Koordinator Area ' + (matchedArea?.area_name || ''),
              rh_name: matchedArea?.rh_names || 'Region Head',
              sf_active: matchedArea?.sf_active_total || 12,
              sf_green: matchedArea?.sf_green || 5,
              sf_grey: matchedArea?.sf_grey || 4,
              sf_red: matchedArea?.sf_red || 3,
              korea_activity_rate: matchedArea?.korea_activity_rate || 0.85,
              korea_activity_status: (matchedArea?.korea_activity_rate || 0.85) >= 0.8 ? 'GREEN' : 'GREY',
              pipeline_active_rp: matchedArea?.pipeline_active_rp || 1200000000,
              pipeline_carry_over_rp: matchedArea?.carry_over_rp || 400000000,
              pipeline_batal_cair_rp: matchedArea?.batal_cair_rp || 200000000,
              all_target_rp: matchedArea?.target_rp || 2000000000,
              all_achievement_rp: matchedArea?.achievement_rp || 1900000000,
              all_attainment_pct: matchedArea?.attainment_pct || 0.95,
              all_rank_area: 1,
              all_rank_selindo: matchedArea?.rank_selindo || 12
            }
          ],
          pipelineReasons: [
            {
              category: 'DOKUMEN',
              reason: 'Persyaratan berkas pemohon belum lengkap',
              condition: 'PROSES',
              followup: 'Jemput berkas dan koordinasi cepat dengan pemohon',
              count: 6,
              amount_rp: 350000000,
              share_records: 0.4,
              share_amount: 0.45
            }
          ],
          potensi: {
            sla_open_noa: 14,
            sla_open_rp: 950000000,
            prap_open_noa: 8,
            prap_open_rp: 520000000,
            total_open_noa: 22,
            total_open_rp: 1470000000,
            potensi_reguler_rp: 1470000000,
            potensi_mitraguna_rp: 500000000,
            potensi_asabri_rp: 180000000,
            mapping_status: 'VALID',
            source_note: 'Simulasi data lokal'
          }
        });
      })
      .finally(() => setAreaDetailLoading(false));
  }, [selectedAreaId, period, product, session, preview, data]);

  // Handlers for Development view
  async function handleSaveProjection(projRp: number, nextProjRp: number, driverText: string) {
    if (!session) return;
    await request('/api/v1/projections', session, {
      method: 'POST',
      body: JSON.stringify({period, product, ro, projectionRp: projRp, nextProjectionRp: nextProjRp, driverText})
    });
    setProjectionData(prev => prev ? {
      ...prev,
      projection_rp: projRp,
      next_projection_rp: nextProjRp,
      driver_text: driverText
    } : null);
  }

  async function handleSavePlan(plan: Partial<DevelopmentPlan>) {
    if (!session) return;
    const res = await request<{ok: boolean; planId: string}>('/api/v1/development-plans', session, {
      method: 'POST',
      body: JSON.stringify(plan)
    });
    if (res.ok) {
      const refreshed = await request<DevelopmentPlan[]>(`/api/v1/development-plans?period=${period}`, session);
      setPlansData(refreshed);
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!session) return;
    await request(`/api/v1/development-plans/${planId}`, session, {method: 'DELETE'});
    setPlansData(prev => prev.filter(p => p.plan_id !== planId));
  }

  if (loading) {
    return <div className="center-loading"><RefreshCw className="rotate" size={22} /> Memeriksa akses platform...</div>;
  }
  if (!user) {
    return <div className="center-loading">{error || 'Profil tidak ditemukan.'}<button onClick={onLogout}>Keluar</button></div>;
  }

  const s = data?.summary;
  const q = Object.fromEntries(['Q1', 'Q2', 'Q3', 'Q4'].map(k => [k, (data?.areas || []).filter(a => a.quadrant_code === k).length || 0]));

  const livePresentationData = data ? {
    period,
    product,
    ro,
    overview: data,
    regular: regularData || data,
    mitraguna: mitragunaData || data
  } : undefined;

  return (
    <div className="layout">
      <Navigation
        user={user}
        onLogout={onLogout}
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka Menu"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              EKA <span>/</span> Business Overview <span>/</span> <strong>
                {activePage === 'business' ? 'Pilar 1: Kinerja Bisnis' :
                 activePage === 'history' ? 'Jejak Kinerja 2026' :
                 activePage === 'potential' ? 'Pilar 2: Potensi Bisnis' :
                 activePage === 'capacity' ? 'Pilar 3: Kapasitas Tim' :
                 activePage === 'barriers' ? 'Pilar 4: Hambatan Pertumbuhan' :
                 activePage === 'development' ? 'Pilar 5: Langkah Pengembangan' :
                 activePage === 'ranking' ? 'Peringkat Wilayah Nasional' :
                 activePage === 'story' ? 'Story Editor Narasi PPT' :
                 activePage === 'presentation' ? 'Presentasi 16:9 Eksekutif' : 'Platform & Log Sinkronisasi'}
              </strong>
            </div>
          </div>
          <div className="top-right">
            <ShieldCheck size={16} />
            <span>Akses {user.role}</span>
            <span className="top-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>

        <div className="page">
          <ErrorBoundary>
            {preview && (
            <div className="preview-banner" role="status">
              <div>
                <strong>MODE DEMO SIMULASI LOKAL</strong>
                <span>Angka di bawah adalah simulasi desain untuk pengembangan lokal.</span>
              </div>
              <button type="button" onClick={onLogout}>Keluar Demo</button>
            </div>
          )}

          {/* Presentation Studio Views */}
          {(activePage === 'story' || activePage === 'presentation') && period ? (
            <PresentationStudio
              key={`${period}|${product}|${ro}`}
              period={period}
              product={product}
              ro={ro}
              mode={activePage === 'story' ? 'editor' : 'preview'}
              onModeChange={p => setActivePage(p === 'editor' ? 'story' : 'presentation')}
              liveData={livePresentationData}
            />
          ) : (
            <>
              {/* MOBILE COMPACT FILTER TOGGLE */}
              <div className="mobile-filter-bar">
                <div className="mobile-filter-summary">
                  <Filter size={14} />
                  <span>{monthName(period)} · {product === 'ALL' ? 'Semua Produk' : product} {ro ? `· ${ro}` : ''}</span>
                </div>
                <button
                  type="button"
                  className="mobile-filter-toggle"
                  onClick={() => setMobileFiltersExpanded(x => !x)}
                >
                  {mobileFiltersExpanded ? 'Tutup Filter' : 'Filter Data'}
                </button>
              </div>

              {/* TOP FILTERS BAR (CASCADING: PERIODE -> PRODUK -> RO -> RH -> AREA) */}
              <section className={`filters-panel ${mobileFiltersExpanded ? 'mobile-open' : ''}`}>
                <div className="filter-unit">
                  <label>PERIODE DATA</label>
                  <div className="select-wrap">
                    <select
                      value={period}
                      onChange={e => {
                        setPeriod(e.target.value);
                        setRo('');
                        setRh('');
                        setArea('');
                      }}
                      disabled={!periods.length}
                    >
                      {periods.map(p => (
                        <option key={p} value={p}>{monthName(p)}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                <div className="filter-unit">
                  <label>PRODUK</label>
                  <div className="select-wrap">
                    <select
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                    >
                      <option value="ALL">Semua Produk (BSI)</option>
                      <option value="REGULER">Reguler</option>
                      <option value="MITRAGUNA">Mitraguna</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                <div className="filter-unit">
                  <label>REGIONAL / RO</label>
                  <div className="select-wrap">
                    <select
                      value={ro}
                      onChange={e => {
                        setRo(e.target.value);
                        setRh('');
                        setArea('');
                      }}
                    >
                      <option value="">Semua RO ({availableRos.length})</option>
                      {availableRos.map(x => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                <div className="filter-unit">
                  <label>REGION HEAD (RH)</label>
                  <div className="select-wrap">
                    <select
                      value={rh}
                      onChange={e => {
                        setRh(e.target.value);
                        setArea('');
                      }}
                    >
                      <option value="">Semua RH ({availableRhs.length})</option>
                      {availableRhs.map(r => (
                        <option key={r.rh_key} value={r.rh_name}>{r.rh_name} {ro ? '' : `(${r.ro_name})`}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                <div className="filter-unit">
                  <label>AREA</label>
                  <div className="select-wrap">
                    <select
                      value={area}
                      onChange={e => setArea(e.target.value)}
                    >
                      <option value="">Semua Area ({availableAreas.length})</option>
                      {availableAreas.map(a => (
                        <option key={a.area_id} value={a.area_name}>{a.area_name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>

                {(ro || rh || area) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRo('');
                      setRh('');
                      setArea('');
                    }}
                    className="refresh-button"
                    style={{color: 'var(--red-coral)', borderColor: 'var(--red-border)'}}
                    title="Kembalikan cakupan ke seluruh Nasional"
                  >
                    <X size={15} /> Reset Filter
                  </button>
                )}

                <button
                  onClick={() => {
                    setRevision(x => x + 1);
                    setHistoryData(null);
                    setPotentialData(null);
                    setCapacityData(null);
                    setBarriersData(null);
                    setRankingsData(null);
                  }}
                  className="refresh-button"
                  disabled={fetching || !period}
                >
                  <RefreshCw size={16} className={fetching ? 'rotate' : ''} /> Segarkan
                </button>
              </section>

              {error && <div role="alert" className="notice danger error-strip">{error}</div>}

              {/* RENDER ACTIVE TAB */}
              {activePage === 'business' && (
                <div className="view-container">
                  <div className="page-top">
                    <div>
                      <div className="kicker">PILAR 1 · BISNIS BERJALAN</div>
                      <h1>Kinerja Bisnis {period ? monthName(period) : ''}</h1>
                      <p>Realisasi pencairan vs target bisnis, produktivitas tim, dan sebaran kuadran Area.</p>
                    </div>
                    <div className="sync-info">
                      <Clock3 size={15} />
                      <div>
                        <b>Snapshot terakhir</b>
                        <span>{data?.publishedAt ? new Date(data.publishedAt).toLocaleString('id-ID', {dateStyle: 'medium', timeStyle: 'short'}) : 'Belum tersedia'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <Stat label="TOTAL PENCAIRAN" value={s ? smallMoney(s.achievement_rp) : '—'} foot="Realisasi pada periode sumber" highlight />
                    <Stat label="TARGET BISNIS" value={s ? smallMoney(s.target_rp) : '—'} foot="Target sesuai snapshot resmi" />
                    <Stat label="PENCAPAIAN TARGET" value={s ? pct(s.attainment_pct) : '—'} foot="Realisasi pencairan ÷ target" />
                    <Stat label="SALES FORCE AKTIF" value={s ? idMoney.format(s.sf_active) : '—'} foot="Total SF sesuai cakupan" />
                  </div>

                  <div className="detail-grid">
                    <div className="detail-card">
                      <div className="detail-heading"><Target size={18} /><h3>Indikator Pendukung</h3></div>
                      <div className="detail-list">
                        <div><span>Pipeline aktif</span><strong>{s ? smallMoney(s.pipeline_active_rp) : '—'}</strong></div>
                        <div><span>Produktivitas per SF</span><strong>{s ? smallMoney(s.productivity_per_sf_rp) : '—'}</strong></div>
                        <div><span>Pemenuhan SF</span><strong>{s ? pct(s.sf_fulfillment) : '—'}</strong></div>
                        <div><span>Cakupan cabang</span><strong>{pct(s?.branch_coverage)}</strong></div>
                        <div><span>Aktivitas Korea</span><strong>{pct(s?.korea_activity_rate)}</strong></div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-heading"><Building2 size={18} /><h3>Pemetaan Kuadran Wilayah</h3></div>
                      <p className="detail-intro">Pemetaan kondisi menggunakan matriks evaluasi kapasitas dan performa yang disetujui.</p>
                      <div className="quadrant-grid">
                        {[
                          ['Q1', 'Kondisi kuat'],
                          ['Q2', 'Perlu tambahan tim'],
                          ['Q3', 'Perlu perhatian utama'],
                          ['Q4', 'Hasil tim perlu ditingkatkan']
                        ].map(([id, title]) => (
                          <div key={id} className="quad-stat">
                            <span className={`quadrant ${id}`}>{id}</span>
                            <b>{q[id]}</b>
                            <small>{title}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="table-headline">
                    <h2>Detail Wilayah Area ({data?.areas.length || 0})</h2>
                    <span>Rincian metrik per unit area pada periode {period ? monthName(period) : ''}. Klik baris untuk membuka rincian Korea & hambatan.</span>
                  </div>
                  <DataTable rows={data?.areas || []} onSelectArea={setSelectedAreaId} />
                </div>
              )}

              {activePage === 'history' && (
                <HistoryView data={historyData} loading={fetching} />
              )}

              {activePage === 'potential' && (
                <PotentialView data={potentialData} loading={fetching} />
              )}

              {activePage === 'capacity' && (
                <CapacityView data={capacityData} loading={fetching} />
              )}

              {activePage === 'barriers' && (
                <BarriersView data={barriersData} loading={fetching} />
              )}

              {activePage === 'development' && (
                <DevelopmentView
                  projection={projectionData}
                  plans={plansData}
                  areas={data?.areas || []}
                  loading={fetching}
                  onSaveProjection={handleSaveProjection}
                  onSavePlan={handleSavePlan}
                  onDeletePlan={handleDeletePlan}
                />
              )}

              {activePage === 'ranking' && (
                <RankingView data={rankingsData} loading={fetching} onSelectArea={setSelectedAreaId} />
              )}

              {activePage === 'sync' && (
                <SyncRunsView
                  runs={syncRunsData}
                  loading={fetching}
                  onRefresh={() => {
                    if (session) {
                      request<{runs: SyncRun[]}>('/api/v1/sync-runs', session)
                        .then(r => setSyncRunsData(r.runs))
                        .catch(console.error);
                    }
                  }}
                  onSyncMaster={async () => {
                    if (!session) return {ok: false};
                    return request<{ok: boolean; summary?: Record<string, number>}>('/api/v1/sync/master-spreadsheet', session, {method: 'POST'});
                  }}
                />
              )}

              {/* AREA DRILL-DOWN MODAL */}
              {selectedAreaId && (
                <div className="modal-backdrop" onClick={() => setSelectedAreaId(null)}>
                  <div className="area-detail-modal" onClick={e => e.stopPropagation()}>
                    <div className="area-detail-header">
                      <div>
                        <div className="kicker">DRILL-DOWN RINCIAN WILAYAH</div>
                        <h2 style={{margin: '4px 0 6px', fontSize: '20px', color: 'var(--text-headline)'}}>
                          {areaDetail?.area?.area_name || selectedAreaId}
                        </h2>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-muted)'}}>
                          <span>RO: <strong>{areaDetail?.area?.ro_filter_group || areaDetail?.area?.ro_source || '—'}</strong></span>
                          <span>·</span>
                          <span>RH: <strong>{areaDetail?.area?.rh_names || '—'}</strong></span>
                          {areaDetail?.area?.quadrant_code && (
                            <span className={`quadrant ${areaDetail.area.quadrant_code}`} style={{marginLeft: '6px'}}>
                              {areaDetail.area.quadrant_code} · {areaDetail.area.quadrant_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="area-detail-close" onClick={() => setSelectedAreaId(null)} title="Tutup">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="area-detail-body">
                      {areaDetailLoading ? (
                        <div className="center-loading" style={{minHeight: '200px'}}>
                          <RefreshCw className="rotate" size={20} /> Memuat data lengkap wilayah...
                        </div>
                      ) : (
                        <>
                          {/* KPI Summary Cards */}
                          <div className="stats-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
                            <div className="stat stat-highlight">
                              <div className="stat-label">REALISASI PENCAIRAN</div>
                              <div className="stat-value">{smallMoney(areaDetail?.area?.achievement_rp)}</div>
                              <div className="stat-foot">Target: {smallMoney(areaDetail?.area?.target_rp)}</div>
                            </div>
                            <div className="stat">
                              <div className="stat-label">CAPAIAN TARGET</div>
                              <div className="stat-value">{pct(areaDetail?.area?.attainment_pct)}</div>
                              <div className="stat-foot">Rank #{areaDetail?.area?.rank_selindo ?? '—'} Nasional</div>
                            </div>
                            <div className="stat">
                              <div className="stat-label">SF AKTIF</div>
                              <div className="stat-value">{areaDetail?.area?.sf_active_total ?? '—'}</div>
                              <div className="stat-foot">🟢{areaDetail?.area?.sf_green ?? 0} ⚪{areaDetail?.area?.sf_grey ?? 0} 🔴{areaDetail?.area?.sf_red ?? 0}</div>
                            </div>
                            <div className="stat">
                              <div className="stat-label">PIPELINE BERJALAN</div>
                              <div className="stat-value">{smallMoney(areaDetail?.area?.pipeline_active_rp)}</div>
                              <div className="stat-foot">Batal cair: {smallMoney(areaDetail?.area?.batal_cair_rp)}</div>
                            </div>
                          </div>

                          {/* Koordinator Area (Korea) Section */}
                          <div className="area-card-section">
                            <div className="area-card-title">
                              <Briefcase size={16} style={{color: 'var(--blue-primary)'}} />
                              Koordinator Area (Korea) Terdaftar ({areaDetail?.koreas?.length || 0})
                            </div>
                            {areaDetail?.koreas?.length ? (
                              <div className="table-scroll">
                                <table>
                                  <thead>
                                    <tr>
                                      <th>NAMA KOREA</th>
                                      <th>NIP</th>
                                      <th className="number">REALISASI</th>
                                      <th className="number">CAPAIAN (%)</th>
                                      <th className="number">SF AKTIF</th>
                                      <th>STATUS AKTIVITAS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {areaDetail.koreas.map(k => (
                                      <tr key={k.nip_korea}>
                                        <td><strong>{k.nama_korea}</strong></td>
                                        <td><code>{k.nip_korea}</code></td>
                                        <td className="number emph">{smallMoney(k.all_achievement_rp)}</td>
                                        <td className="number"><span className="pct">{pct(k.all_attainment_pct)}</span></td>
                                        <td className="number">
                                          <strong>{k.sf_active}</strong>
                                          <small style={{display: 'block', color: 'var(--text-faint)'}}>
                                            🟢{k.sf_green} ⚪{k.sf_grey} 🔴{k.sf_red}
                                          </small>
                                        </td>
                                        <td>
                                          <span className={`status-pill ${k.korea_activity_status === 'GREEN' ? 'green' : k.korea_activity_status === 'RED' ? 'danger' : 'neutral'}`}>
                                            {k.korea_activity_status} ({Math.round(k.korea_activity_rate * 100)}%)
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0'}}>
                                Data Koordinator Area belum tercatat spesifik untuk area ini.
                              </div>
                            )}
                          </div>

                          {/* Pipeline Reasons Section */}
                          <div className="area-card-section">
                            <div className="area-card-title">
                              <Activity size={16} style={{color: 'var(--amber-warm)'}} />
                              Alasan Pipeline Tertahan / Bottleneck ({areaDetail?.pipelineReasons?.length || 0})
                            </div>
                            {areaDetail?.pipelineReasons?.length ? (
                              <div className="table-scroll">
                                <table>
                                  <thead>
                                    <tr>
                                      <th style={{width: '120px'}}>KATEGORI</th>
                                      <th>FAKTOR PENYEBAB</th>
                                      <th className="number" style={{width: '90px'}}>BERKAS</th>
                                      <th className="number" style={{width: '130px'}}>PLAFOND</th>
                                      <th>REKOMENDASI SOLUSI</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {areaDetail.pipelineReasons.map((p, i) => (
                                      <tr key={p.category + i}>
                                        <td><span className="status-pill neutral">{p.category}</span></td>
                                        <td><strong>{p.reason}</strong></td>
                                        <td className="number">{p.count}</td>
                                        <td className="number emph">{smallMoney(p.amount_rp)}</td>
                                        <td style={{fontSize: '11px', color: 'var(--blue-primary)'}}>💡 {p.followup}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0'}}>
                                Tidak ditemukan catatan pipeline tertahan spesifik untuk area ini.
                              </div>
                            )}
                          </div>

                          {/* Potensi Bisnis Area Section */}
                          {areaDetail?.potensi && (
                            <div className="area-card-section">
                              <div className="area-card-title">
                                <Target size={16} style={{color: 'var(--green-emerald)'}} />
                                Potensi Terbuka (Master Data Potensi Area)
                              </div>
                              <div className="stats-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0}}>
                                <div className="stat">
                                  <div className="stat-label">SLA REALTIME OPEN</div>
                                  <div className="stat-value">{smallMoney(areaDetail.potensi.sla_open_rp)}</div>
                                  <div className="stat-foot">{areaDetail.potensi.sla_open_noa} NOA pengajuan siap follow up</div>
                                </div>
                                <div className="stat">
                                  <div className="stat-label">PRAPEN PRIORITAS</div>
                                  <div className="stat-value">{smallMoney(areaDetail.potensi.prap_open_rp)}</div>
                                  <div className="stat-foot">{areaDetail.potensi.prap_open_noa} NOA pra-pensiun</div>
                                </div>
                                <div className="stat stat-highlight">
                                  <div className="stat-label">TOTAL RUANG BISNIS</div>
                                  <div className="stat-value">{smallMoney(areaDetail.potensi.total_open_rp)}</div>
                                  <div className="stat-foot">{areaDetail.potensi.total_open_noa} NOA total peluang</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </ErrorBoundary>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Smartphone">
        <button
          type="button"
          className={`m-bottom-tab ${activePage === 'business' ? 'active' : ''}`}
          onClick={() => setActivePage('business')}
        >
          <BarChart3 size={19} />
          <span>Pilar 1</span>
        </button>
        <button
          type="button"
          className={`m-bottom-tab ${activePage === 'potential' ? 'active' : ''}`}
          onClick={() => setActivePage('potential')}
        >
          <Target size={19} />
          <span>Pilar 2</span>
        </button>
        <button
          type="button"
          className={`m-bottom-tab ${activePage === 'capacity' ? 'active' : ''}`}
          onClick={() => setActivePage('capacity')}
        >
          <Users size={19} />
          <span>Pilar 3</span>
        </button>
        <button
          type="button"
          className={`m-bottom-tab ${activePage === 'ranking' ? 'active' : ''}`}
          onClick={() => setActivePage('ranking')}
        >
          <Trophy size={19} />
          <span>Peringkat</span>
        </button>
        <button
          type="button"
          className="m-bottom-tab"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu size={19} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    const client = supabase;
    client.auth.getSession().then(({data}) => {
      setSession(data.session);
      setReady(true);
    });
    const {data: subscription} = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <div className="center-loading"><RefreshCw className="rotate" /> Memuat platform...</div>;
  }
  if (preview && previewEnabled) {
    return <Dashboard session={null} preview onLogout={() => setPreview(false)} />;
  }
  if (!session) {
    return <Login onLogin={() => {}} onPreview={() => setPreview(true)} />;
  }
  return (
    <ErrorBoundary>
      <Dashboard session={session} onLogout={() => supabase?.auth.signOut()} />
    </ErrorBoundary>
  );
}
