/**
 * EKA RH BUSINESS OVERVIEW V5.4 — PARTNER TOOLS FAST FIX · DATA SAFE
 * PT Eka Akar Jati × BSI
 *
 * Kerangka utama:
 * 1. Bisnis yang Sudah Berjalan
 * 2. Potensi yang Belum Tergarap
 * 3. Kapasitas Tim yang Tersedia
 * 4. Hambatan Pertumbuhan
 * 5. Langkah Pengembangan Berikutnya
 *
 * Prinsip teknis:
 * - Selindo-first untuk validasi.
 * - Filter Produk/RH/Area dilakukan di browser setelah data Area termuat.
 * - Historical, potensi, hambatan, detail Area, SF, dan presentasi dimuat saat diperlukan.
 * - Cache dipakai pada hasil olahan yang kecil, bukan raw sheet besar.
 * - Sistem memberi kondisi, bukti, dan arah pemeriksaan. Strategi tetap input RH/Admin.
 */

const PRESENTATION_EXPORT_VERSION = '5.4.0';
const ACTION_PLAN_SOURCE_SS_ID = '[REDACTED_REFERENCE_ONLY]';
const MANTAP_SOURCE_SS_ID = '[REDACTED_REFERENCE_ONLY]';
const ADMIN_VALIDATION_SOURCE_SS_ID = '[REDACTED_REFERENCE_ONLY]';

const APP = Object.freeze({
  NAME: 'Overview Kinerja & Pengembangan Bisnis RH',
  COMPANY: 'PT Eka Akar Jati',
  PARTNER: 'BSI',
  PARTNERS: Object.freeze({BSI:'BSI', MANTAP:'MANTAP'}),
  PROP_SS_ID: 'EKA_RH_OVERVIEW_SS_ID',
  CACHE_AREA_TTL: 600,
  CACHE_REFERENCE_TTL: 1800,
  VERSION: '5.4.0 Partner Tools Fast Fix · Data Safe · Manual Source Sync',
  SHEETS: Object.freeze({
    APP_CONFIG: '00_APP_CONFIG',
    SOURCE_CONFIG: '00_SOURCE_CONFIG',
    BUSINESS_RULES: '00_BUSINESS_RULES',
    SNAPSHOT: '00_SNAPSHOT_META',
    REFRESH_LOG: '00_REFRESH_LOG',
    USER_ACCESS: '01_USER_ACCESS',
    USER_AREA_SCOPE: '01_USER_AREA_SCOPE',
    RO_RH_SCOPE: '01_RO_RH_AREA_SCOPE',
    HISTORY_2026: '02_HISTORY_2026',
    POT_AREA: '02_POTENSI_AREA',
    POT_BRANCH: '02_POTENSI_BRANCH',
    POT_RH_REAL: '02_POTENSI_RH_REAL',
    PIPE_REASON: '03_PIPELINE_REASON',
    AREA_PERF: '04_AREA_PERFORMANCE',
    RANK_KOREA: '04_RANK_KOREA',
    RANK_BRANCH: '04_BRANCH_PERFORMANCE',
    RANK_SF: '04_SF_PERFORMANCE',
    ALERT: '04_ALERT',
    BARRIER_RULES: '04_GROWTH_BARRIER_RULES',
    DEV_INPUT: '05_DEVELOPMENT_INPUT',
    DEV_AGENDA: '05_DEVELOPMENT_AGENDA',
    VERSION: '06_PRESENTATION_VERSION',
    STORY_EDITOR: '06_STORY_EDITOR',
    PROJECTION_INPUT: '05_PROJECTION_INPUT',
    ACTION_MAP: '05_ACTION_PLAN_USER_MAP',
    DATA_GAPS: '00_DATA_GAPS',
    MANTAP_AREA_PERF: '04_MANTAP_AREA_PERFORMANCE',
    MANTAP_RH_MONTHLY: '02_MANTAP_RH_MONTHLY',
    MANTAP_SL_PERF: '04_MANTAP_SL_PERFORMANCE',
    MANTAP_SF_PERF: '04_MANTAP_SF_PERFORMANCE',
    MANTAP_PIPELINE: '03_MANTAP_PIPELINE_DETAIL',
    MANTAP_SYNC_LOG: '00_MANTAP_SYNC_LOG',
    MANTAP_RH_MAP: '00_MANTAP_RH_MAP',
    ADMIN_VALIDATION_OVERRIDE: '05_ADMIN_VALIDATION_OVERRIDE',
    ADMIN_VALIDATION_LOG: '00_VALIDATION_SYNC_LOG'
  }),
  RULES: Object.freeze({
    PRODUCTIVITY_BASELINE: 300000000,
    SF_TARGET_REG: 300000000,
    SF_TARGET_MTG: 1000000000,
    SF_GREEN_MIN: 0.80,
    SF_GREY_MIN: 0.50,
    PIPELINE_IDEAL: 2,
    COVERAGE_GREEN: 0.90,
    COVERAGE_GREY: 0.70,
    KOREA_ACTIVITY_OK: 0.80,
    PROCESS_RATIO_WATCH: 0.20
  })
});


/**
 * Satu pintu pemanggilan dari Index.html.
 * Diperlukan karena google.script.run tidak mendukung pemanggilan fungsi
 * secara dinamis dengan pola runner[functionName](...).
 */

/** =========================
 *  V5.0 — AKSES REGIONAL + TIM KP
 *  =========================
 *  Password disimpan sebagai hash SHA-256, bukan plaintext.
 *  Ini adalah gate aplikasi + pembatas scope data, bukan pengganti SSO/IAM enterprise.
 */
const ACCESS_SESSION_TTL_SEC = 21600;
const OVERVIEW_ACCESS = Object.freeze({
  REGIONAL_MEDAN:{label:'Regional Medan',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO MEDAN','REGIONAL MEDAN','MEDAN']},
  REGIONAL_PALEMBANG:{label:'Regional Palembang',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO PALEMBANG','REGIONAL PALEMBANG','PALEMBANG']},
  REGIONAL_ACEH:{label:'Regional Aceh',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO ACEH','REGIONAL ACEH','ACEH','BANDA ACEH']},
  REGIONAL_JAKARTA_1:{label:'Regional Jakarta 1',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO JAKARTA 1','REGIONAL JAKARTA 1','JAKARTA 1']},
  REGIONAL_JAKARTA_2:{label:'Regional Jakarta 2',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO JAKARTA 2','REGIONAL JAKARTA 2','JAKARTA 2']},
  REGIONAL_JAKARTA_3:{label:'Regional Jakarta 3',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO JAKARTA 3','REGIONAL JAKARTA 3','JAKARTA 3']},
  REGIONAL_BANDUNG:{label:'Regional Bandung',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO BANDUNG','REGIONAL BANDUNG','BANDUNG']},
  REGIONAL_SEMARANG:{label:'Regional Semarang',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO SEMARANG','REGIONAL SEMARANG','SEMARANG']},
  REGIONAL_SURABAYA:{label:'Regional Surabaya',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO SURABAYA','REGIONAL SURABAYA','SURABAYA']},
  REGIONAL_SURABAYA_1:{label:'Regional Surabaya 1',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO SURABAYA 1','REGIONAL SURABAYA 1','SURABAYA 1','RO SBN 1','SBN 1']},
  REGIONAL_MAKASSAR:{label:'Regional Makassar',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO MAKASSAR','REGIONAL MAKASSAR','MAKASSAR']},
  REGIONAL_KALIMANTAN:{label:'Regional Kalimantan',role:'REGIONAL',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:['RO KALIMANTAN','REGIONAL KALIMANTAN','KALIMANTAN']},
  TIM_KP:{label:'Tim KP',role:'KP',passwordHash:'[REDACTED_REFERENCE_ONLY]',aliases:[]}
});

function sha256Hex_(value){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8);
  return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function loginOverviewAccess(payload){
  const code=upper_(payload&&payload.scopeCode),password=String(payload&&payload.password||'');
  const def=OVERVIEW_ACCESS[code];
  if(!def)throw new Error('Akses tidak dikenali.');
  if(sha256Hex_(password)!==def.passwordHash)throw new Error('Password belum sesuai.');
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'').slice(0,12);
  const session={scopeCode:code,label:def.label,role:def.role,issuedAt:Date.now()};
  CacheService.getScriptCache().put('ACCESS_SESSION_'+token,JSON.stringify(session),ACCESS_SESSION_TTL_SEC);
  const out={ok:true,token,scopeCode:code,label:def.label,role:def.role,expiresInSec:ACCESS_SESSION_TTL_SEC,dataRevision:getDataRevision_(),currentPeriod:currentPeriodId_()};
  // V5.3: login pertama dapat sekaligus membawa bootstrap. Ini menghapus satu round-trip
  // google.script.run tanpa mengubah sumber data maupun aturan perhitungan.
  if(payload&&payload.includeBootstrap){
    const p=Object.assign({},payload,{accessScopeCode:code,accessRole:def.role,accessLabel:def.label,partner:upper_(payload.partner||'BSI')||'BSI',periodId:canonicalMonthKey_(payload.periodId)||currentPeriodId_()});
    out.bootstrap=getInitialBundle(p);
  }
  return out;
}
function logoutOverviewAccess(payload){
  const token=norm_(payload&&payload._accessToken);
  if(token)try{CacheService.getScriptCache().remove('ACCESS_SESSION_'+token);}catch(e){}
  return {ok:true};
}
function requireOverviewAccess_(payload){
  const token=norm_(payload&&payload._accessToken);
  if(!token)throw new Error('ACCESS_REQUIRED: Silakan masuk terlebih dahulu.');
  const raw=CacheService.getScriptCache().get('ACCESS_SESSION_'+token);
  if(!raw)throw new Error('ACCESS_REQUIRED: Sesi sudah berakhir. Silakan masuk kembali.');
  try{return JSON.parse(raw);}catch(e){throw new Error('ACCESS_REQUIRED: Sesi tidak valid. Silakan masuk kembali.');}
}
function getOverviewAccessOptions(){
  return Object.keys(OVERVIEW_ACCESS).map(k=>({value:k,label:OVERVIEW_ACCESS[k].label,role:OVERVIEW_ACCESS[k].role}));
}
function getFastAppState(payload){
  return {
    ok:true,
    dataRevision:getDataRevision_(),
    currentPeriod:currentPeriodId_(),
    version:APP.VERSION,
    scopeCode:upper_(payload&&payload.accessScopeCode),
    role:upper_(payload&&payload.accessRole),
    label:norm_(payload&&payload.accessLabel)
  };
}
function accessDef_(scopeCode){return OVERVIEW_ACCESS[upper_(scopeCode)]||null;}
function accessTextKey_(v){return upper_(v).replace(/^(RO|REGIONAL)\s+/,'').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function roMatchesAccess_(ro,scopeCode){
  const def=accessDef_(scopeCode);if(!def||def.role==='KP')return true;
  const key=accessTextKey_(ro);
  return (def.aliases||[]).some(a=>{
    const ak=accessTextKey_(a);
    if(key===ak)return true;
    // Hindari scope bernomor saling terbaca, contoh SURABAYA vs SURABAYA 1.
    if(/\d/.test(key)||/\d/.test(ak))return false;
    return key.indexOf(ak)>=0||ak.indexOf(key)>=0;
  });
}
function getAllowedRhKeysForAccess_(scopeCode){
  const def=accessDef_(scopeCode);if(!def||def.role==='KP')return null;
  const rows=getRoRhScopeCached_(),set=new Set();
  rows.forEach(r=>{if(roMatchesAccess_(r.filter_ro||r.source_ro,scopeCode)&&norm_(r.rh_user_key))set.add(norm_(r.rh_user_key));});
  return set;
}
function applyAccessToScopeRows_(rows,req){
  const code=upper_(req&&req.accessScopeCode),role=upper_(req&&req.accessRole);
  if(!code||role==='KP')return (rows||[]).slice();
  const allowed=getAllowedRhKeysForAccess_(code);
  return (rows||[]).filter(r=>{
    const rh=norm_(r.rh_user_key);
    if(allowed&&allowed.size&&rh&&allowed.has(rh))return true;
    return roMatchesAccess_(r.filter_ro||r.source_ro,code);
  });
}
function applyAccessToAreaRows_(rows,req){
  const code=upper_(req&&req.accessScopeCode),role=upper_(req&&req.accessRole);
  if(!code||role==='KP')return (rows||[]).slice();
  const allowed=getAllowedRhKeysForAccess_(code);
  return (rows||[]).filter(r=>{
    const rhs=String(r.rh_user_keys||'').split('|').map(norm_).filter(Boolean);
    if(allowed&&allowed.size&&rhs.some(k=>allowed.has(k)))return true;
    return roMatchesAccess_(r.ro_filter_group||r.ro_source,code);
  });
}
function applyAccessToUserAreaRows_(rows,req){
  if(upper_(req&&req.accessRole)==='KP')return (rows||[]).slice();
  const scoped=applyAccessToScopeRows_(getRoRhScopeCached_(),req),ids=new Set(scoped.map(r=>norm_(r.area_id)));
  return (rows||[]).filter(r=>ids.has(norm_(r.area_id)));
}
function getAllowedAreaIdsForAccess_(req){
  if(upper_(req&&req.accessRole)==='KP')return null;
  const partner=upper_(req&&req.partner)||'BSI',code=upper_(req&&req.accessScopeCode);
  const key=cacheKey_('ACCESS_AREA_IDS_V50',partner,code),cached=cacheGetJson_(key);
  if(cached)return new Set(cached);
  const ids=new Set();
  if(partner==='MANTAP'){
    const allowedRh=getAllowedRhKeysForAccess_(code);
    if(allowedRh&&allowedRh.size){
      readObjectsIfExists_(APP.SHEETS.MANTAP_AREA_PERF).forEach(r=>{
        if(allowedRh.has(norm_(r.rh_user_key))&&norm_(r.area_id))ids.add(norm_(r.area_id));
      });
    }
  }else{
    applyAccessToScopeRows_(getRoRhScopeCached_(),req).forEach(r=>{if(norm_(r.area_id))ids.add(norm_(r.area_id));});
  }
  cachePutJson_(key,Array.from(ids),APP.CACHE_REFERENCE_TTL);
  return ids;
}
function isAreaAllowedForAccess_(areaId,req){
  const id=norm_(areaId);
  if(!id)return true;
  if(upper_(req&&req.accessRole)==='KP')return true;
  const ids=getAllowedAreaIdsForAccess_(req);
  return !!(ids&&ids.has(id));
}
function assertRequestWithinAccess_(req){
  if(upper_(req&&req.accessRole)!=='REGIONAL')return true;
  const allowedRh=getAllowedRhKeysForAccess_(req.accessScopeCode);
  if(upper_(req&&req.partner)!=='MANTAP' && req.roSource && !roMatchesAccess_(req.roSource,req.accessScopeCode)){
    throw new Error('Akses Regional tidak memiliki cakupan RO tersebut.');
  }
  if(req.rhUserKey && (!allowedRh||!allowedRh.has(norm_(req.rhUserKey)))){
    throw new Error('Akses Regional tidak memiliki cakupan Region Head tersebut.');
  }
  if(req.areaId && !isAreaAllowedForAccess_(req.areaId,req)){
    throw new Error('Akses Regional tidak memiliki cakupan Area tersebut.');
  }
  return true;
}
function currentPeriodId_(){
  return Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM');
}
function getDynamicPeriodOptions_(existing){
  const set=new Set();
  (existing||[]).forEach(x=>{const p=canonicalMonthKey_(x&&x.value!=null?x.value:x);if(/^\d{4}-(0[1-9]|1[0-2])$/.test(p))set.add(p);});
  const current=currentPeriodId_(),year=Number(current.slice(0,4)),month=Number(current.slice(5,7));
  for(let m=1;m<=month;m++)set.add(year+'-'+String(m).padStart(2,'0'));
  return Array.from(set).filter(p=>p<=current).sort().reverse().map(p=>({value:p,label:periodLabel_(p)}));
}

function apiCall(functionName, payload) {
  const fn=String(functionName||'');
  if(fn==='loginOverviewAccess') return loginOverviewAccess(payload||{});
  if(fn==='logoutOverviewAccess') return logoutOverviewAccess(payload||{});
  if(fn==='getOverviewAccessOptions') return getOverviewAccessOptions();
  const access=requireOverviewAccess_(payload||{});
  const kpOnly=new Set(['previewMantapSync','syncMantapData','previewAdminValidationSync','syncAdminValidationOverrides']);
  if(kpOnly.has(fn)&&access.role!=='KP')throw new Error('Fungsi ini hanya tersedia untuk Tim KP.');
  payload=Object.assign({},payload||{},{
    accessScopeCode:access.scopeCode,
    accessRole:access.role,
    accessLabel:access.label
  });
  assertRequestWithinAccess_(normalizeFilters_(payload));
  switch (fn) {
    case 'getFastAppState': return getFastAppState(payload);
    case 'getInitialBundle': return getInitialBundle(payload);
    case 'getProductAreaBundle': return getProductAreaBundle(payload);
    case 'previewMantapSync': return previewMantapSync(payload);
    case 'syncMantapData': return syncMantapData(payload);
    case 'previewAdminValidationSync': return previewAdminValidationSync(payload);
    case 'syncAdminValidationOverrides': return syncAdminValidationOverrides(payload);
    case 'getFilterContext': return getFilterContext(payload);
    case 'getDataHealthBundle': return getDataHealthBundle(payload);
    case 'getOverviewExtrasBundle': return getOverviewExtrasBundle(payload);
    case 'getHistoryBundle': return getHistoryBundle(payload);
    case 'getBusinessReviewBundle': return getBusinessReviewBundle(payload);
    case 'getPotentialBundle': return getPotentialBundle(payload);
    case 'getCapacityBundle': return getCapacityBundle(payload);
    case 'getBarrierBundle': return getBarrierBundle(payload);
    case 'getActionPlanImpactBundle': return getActionPlanImpactBundle(payload);
    case 'getAreaDetail': return getAreaDetail(payload);
    case 'getBranchDetail': return getBranchDetail(payload);
    case 'getDevelopmentPlans': return getDevelopmentPlans(payload);
    case 'saveDevelopmentPlan': return saveDevelopmentPlan(payload);
    case 'buildPresentationDraft': return buildPresentationDraft(payload);
    case 'publishPresentation': return publishPresentation(payload);
    case 'getStoryDraft': return getStoryDraft(payload);
    case 'saveStoryDraft': return saveStoryDraft(payload);
    case 'getRankSummary': return getRankSummary(payload);
    case 'getRankingTab': return getRankingTab(payload);
    case 'getRankingBundle': return getRankingBundle(payload);
    case 'getRhRankingDetail': return getRhRankingDetail(payload);
    case 'getProjectionBundle': return getProjectionBundle(payload);
    case 'saveProjection': return saveProjection(payload);
    case 'deleteDevelopmentPlan': return deleteDevelopmentPlan(payload);
    case 'getPublishedPresentation': return getPublishedPresentation(payload && payload.versionId ? payload.versionId : payload);
    default:
      throw new Error('Fungsi server tidak dikenali: ' + functionName);
  }
}

function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index');
  t.initialView = JSON.stringify((e && e.parameter && e.parameter.view) || 'ringkasan');
  return t.evaluate()
    .setTitle(APP.NAME + ' — ' + APP.COMPANY)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  const menuUpdate = ui.createMenu('Perbarui Data')
    .addItem('Cek Kesiapan Data', 'menuCekKesiapanDataOverview')
    .addItem('Perbarui Data Overview', 'menuPerbaruiDataOverview')
    .addSeparator()
    .addItem('Kirim Data ke Web Database', 'syncBsiDataToWeb')
    .addSeparator()
    .addItem('BSI — Pilih Periode', 'menuAmbilDataTerbaru')
    .addItem('Mantap — Perbarui Data', 'menuSyncMantapData');

  const menuValidasi = ui.createMenu('Validasi & Acuan')
    .addItem('Cek Validasi Admin', 'menuPreviewAdminValidationSync')
    .addItem('Terapkan Validasi Admin', 'menuSyncAdminValidationOverrides')
    .addSeparator()
    .addItem('Perbarui Acuan RH Command Center', 'menuPerbaruiRhcc');

  const menuPengaturan = ui.createMenu('Pengaturan')
    .addItem('Siapkan Aplikasi', 'setupAplikasi')
    .addItem('Bersihkan Cache Aplikasi', 'clearAppCache');

  ui.createMenu('Overview RH')
    .addItem('Buka Overview RH', 'menuBukaWebApp')
    .addItem('Kirim Data ke Web Database', 'syncBsiDataToWeb')
    .addSeparator()
    .addSubMenu(menuUpdate)
    .addSubMenu(menuValidasi)
    .addSubMenu(menuPengaturan)
    .addToUi();
}

/**
 * SINKRONISASI OTOMATIS DATA DARI TAB WADAH KE WEB DATABASE
 */
function syncBsiDataToWeb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("04_AREA_PERFORMANCE");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Tab '04_AREA_PERFORMANCE' tidak ditemukan!");
    return;
  }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  ss.toast("Mengirim " + (data.length - 1) + " baris data ke database web...", "Proses Web", 5);

  const EKA_API_URL = "https://domain-hosting-anda.com/api/v1/webhook/ingest-bsi"; 
  const SYNC_SECRET = "eka_sync_secret_prod_2026_x99";

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "x-sync-secret": SYNC_SECRET },
    payload: JSON.stringify({ sourceName: "04_AREA_PERFORMANCE", values: data }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(EKA_API_URL, options);
    const result = JSON.parse(response.getContentText());
    if (response.getResponseCode() === 200 && result.status === "ok") {
      SpreadsheetApp.getUi().alert("Sukses", "Data berhasil disinkronkan ke Web Database!\n" + (result.data.messages || []).join("\n"), SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      SpreadsheetApp.getUi().alert("Peringatan", "Server merespons: " + (result.error || response.getContentText()), SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert("Gagal Koneksi", err.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}


function setupAplikasi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Jalankan dari Apps Script yang terhubung ke spreadsheet database.');
  PropertiesService.getScriptProperties().setProperty(APP.PROP_SS_ID, ss.getId());
  ensureRuntimeSheets_(ss);
  ensureActionPlanIntegration_(ss);
  ensureMantapIntegration_(ss);
  ensureAdminValidationIntegration_(ss);
  clearAppCache();
  SpreadsheetApp.flush();
  return { ok: true, spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl() };
}

function menuAmbilDataTerbaru() {
  const ui = SpreadsheetApp.getUi();
  const ans = ui.prompt('Perbarui Data BSI — Pilih Periode', 'Masukkan periode dalam format YYYY-MM. Contoh: 2026-10', ui.ButtonSet.OK_CANCEL);
  if (ans.getSelectedButton() !== ui.Button.OK) return;
  const result = ambilDataTerbaru(ans.getResponseText());
  ui.alert(result.message || 'Proses selesai.');
}

function menuPerbaruiRhcc() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r = refreshRhccReferences_();
    ui.alert(r.message || 'Data acuan RH Command Center selesai diperbarui.');
  } catch (err) {
    ui.alert('Belum dapat diperbarui:\n' + err.message);
  }
}

function menuBukaWebApp() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(url ? ('URL Web App:\n' + url) : 'Web App belum di-deploy.');
}

/** =========================
 *  1) MUAT AWAL — RINGAN
 *  ========================= */


function getFilterContext(payload) {
  const req=normalizeFilters_(payload||{});
  if(req.partner==='MANTAP') return getMantapFilterContext_(req);
  const allScope=applyAccessToScopeRows_(getRoRhScopeCached_(),req);
  let scope=allScope.filter(r=>(!r.period_id||r.period_id===req.periodId));
  if(!scope.length) scope=getLatestRoRhScope_(allScope);
  if(!scope.length) scope=buildScopeFromAreaRows_(applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,'ALL'),req),req.periodId);
  const roRows=req.roSource?scope.filter(r=>upper_(r.filter_ro)===upper_(req.roSource)):scope;
  const rhRows=req.rhUserKey?roRows.filter(r=>r.rh_user_key===req.rhUserKey):roRows;
  return {
    partner:'BSI',
    ros:uniqueRoOptionsFromScope_(scope),
    rhs:buildRhOptionsFromRoScope_(roRows),
    areas:Array.from(new Map(rhRows.map(r=>[r.area_id,{value:r.area_id,label:r.area_name}])).values()).sort((a,b)=>a.label.localeCompare(b.label)),
    scopeMode: allScope.some(r=>r.period_id===req.periodId)?'PERIOD_SCOPE':'CURRENT_SCOPE_FOR_HISTORY'
  };
}

function getInitialBundle(payload) {
  const req=normalizeFilters_(payload||{});
  if(req.partner==='MANTAP') return getMantapInitialBundle_(req);
  const periodId = req.periodId;
  const dataPeriodId=nextPeriodId_(periodId,-1);
  const bootKey=cacheKey_('BOOTSTRAP_V53','BSI',periodId,req.accessScopeCode||'ALL');
  const bootCached=cacheGetJson_(bootKey);if(bootCached)return bootCached;
  const ss = getSpreadsheet_();

  // V5.0: periode dropdown adalah periode review.
  // Ringkasan kinerja memakai bulan yang sudah selesai (review - 1 bulan).
  // Contoh Oktober => kinerja September, dibanding Agustus.
  const areaByProduct = {ALL:applyAccessToAreaRows_(getAreaRowsCached_(dataPeriodId,'ALL'),req)};
  if(!areaByProduct.ALL.length){
    for(let i=1;i<=12&&!areaByProduct.ALL.length;i++){
      const fallback=nextPeriodId_(dataPeriodId,-i);
      areaByProduct.ALL=applyAccessToAreaRows_(getAreaRowsCached_(fallback,'ALL'),req);
    }
  }

  const scopeRows = applyAccessToUserAreaRows_(getScopeRowsCached_(),req);
  const allScope = applyAccessToScopeRows_(getRoRhScopeCached_(),req);
  let roRhScope = allScope.filter(r => !r.period_id || r.period_id === periodId);
  let scopeMode='PERIOD_SCOPE';
  if(!roRhScope.length){roRhScope=getLatestRoRhScope_(allScope);scopeMode='CURRENT_SCOPE_FOR_HISTORY';}
  if(!roRhScope.length){roRhScope=buildScopeFromAreaRows_(areaByProduct.ALL,periodId);scopeMode='AREA_ROW_FALLBACK';}
  const rhs = buildRhOptionsFromRoScope_(roRhScope);
  const areas = uniqueAreaOptions_(areaByProduct.ALL);
  const ros = uniqueRoOptionsFromScope_(roRhScope.length?roRhScope:buildScopeFromAreaRows_(areaByProduct.ALL,periodId));
  // V5.3: dropdown review mengikuti kalender berjalan; tidak perlu membaca HISTORY + AREA_PERF hanya untuk membentuk pilihan bulan.
  const periods = getDynamicPeriodOptions_([]);

  const out={
    app:{name:APP.NAME,company:APP.COMPANY,partner:'BSI',databaseUrl:ss.getUrl(),generatedAt:formatDateTime_(new Date()),validationMode:true,version:APP.VERSION,accessLabel:req.accessLabel||'',accessRole:req.accessRole||''},
    partner:'BSI',periodId,dataRevision:getDataRevision_(),dataPeriodId:(areaByProduct.ALL[0]&&areaByProduct.ALL[0].period_id)||dataPeriodId,
    options:{
      partners:[{value:'BSI',label:'BSI'},{value:'MANTAP',label:'Bank Mantap'}],
      periods,
      products:[{value:'ALL',label:'Semua Produk'},{value:'REGULER',label:'Reguler'},{value:'MITRAGUNA',label:'Mitraguna'}],
      rhs:[{value:'',label:req.accessRole==='REGIONAL'?(req.accessLabel||'Regional'):'Selindo',rhId:''}].concat(rhs),
      ros:[{value:'',label:req.accessRole==='REGIONAL'?(req.accessLabel||'Regional'):'Semua RO'}].concat(ros),
      areas:[{value:'',label:'Semua Area'}].concat(areas)
    },
    areaByProduct,scopeRows,roRhScope,scopeMode,snapshot:getSnapshotMeta_((areaByProduct.ALL[0]&&areaByProduct.ALL[0].period_id)||dataPeriodId),
    dataGaps:[],
    bootstrap:{lazyProducts:true,loadedProducts:['ALL'],regionalScoped:req.accessRole==='REGIONAL'}
  };
  cachePutJson_(bootKey,out,1800);
  return out;
}

function getProductAreaBundle(payload){
  const req=normalizeFilters_(payload||{}),dataPeriodId=nextPeriodId_(req.periodId,-1);
  if(req.partner==='MANTAP') return {partner:'MANTAP',periodId:req.periodId,dataRevision:getDataRevision_(),dataPeriodId,product:req.product,rows:filterMantapRows_(getMantapAreaRowsCached_(dataPeriodId,req.product),Object.assign({},req,{periodId:dataPeriodId,roSource:'',rhUserKey:'',areaId:''}))};
  return {partner:'BSI',periodId:req.periodId,dataRevision:getDataRevision_(),dataPeriodId,product:req.product,rows:applyAccessToAreaRows_(getAreaRowsCached_(dataPeriodId,req.product),req)};
}


/** =========================
 *  V5.1 — BSI LIVE SERVING SNAPSHOT DARI KOMPAS
 *  Dipakai saat closed month baru belum ada di 04_AREA_PERFORMANCE.
 *  Tidak mengubah raw Kompas. Manual refresh dapat mem-persist hasil ini.
 *  ========================= */
function bsiLiveProductFromHpp_(v){const x=upper_(v);return /MITRAGUNA|(^|[^A-Z])MTG([^A-Z]|$)|IMPLAN/.test(x)?'MITRAGUNA':'REGULER';}
function bsiLiveProductFromSf_(v){const x=upper_(v);return /MITRAGUNA|MTG|IMPLAN/.test(x)?'MITRAGUNA':'REGULER';}
function bsiLiveAreaDirectory_(){
  const rows=getLatestRoRhScope_(getRoRhScopeCached_()),out={};
  rows.forEach(r=>{const a=upper_(r.area_name);if(a&&!out[a])out[a]={area_id:norm_(r.area_id),area_name:norm_(r.area_name),ro_source:norm_(r.source_ro||r.filter_ro),ro_filter_group:norm_(r.filter_ro||r.source_ro),rh_user_key:norm_(r.rh_user_key),rh_name:norm_(r.rh_name)};});
  readObjectsIfExists_(APP.SHEETS.AREA_PERF).forEach(r=>{const a=upper_(r.area_name);if(!a)return;if(!out[a])out[a]={area_id:norm_(r.area_id),area_name:norm_(r.area_name),ro_source:norm_(r.ro_source),ro_filter_group:norm_(r.ro_filter_group||r.ro_source),rh_user_key:norm_(r.rh_user_keys),rh_name:norm_(r.rh_names)};});
  return out;
}
function bsiLatestTargetMap_(periodId){
  const rows=readObjectsIfExists_('00_TARGET_REFERENCE'),best={};
  rows.forEach(r=>{
    const p=canonicalMonthKey_(r.period_id),area=upper_(r.area_name),prod=upper_(r.product||'ALL');if(!area||!prod||!p)return;
    if(p>periodId)return;const k=area+'|'+prod;if(!best[k]||canonicalMonthKey_(best[k].period_id)<p)best[k]=r;
  });
  return best;
}
function bsiLatestAreaReferenceMap_(periodId){
  const rows=readObjectsIfExists_(APP.SHEETS.AREA_PERF),best={};
  rows.forEach(r=>{const p=canonicalMonthKey_(r.period_id),area=upper_(r.area_name),prod=upper_(r.product||'ALL');if(!p||!area||!prod||p>periodId)return;const k=area+'|'+prod;if(!best[k]||canonicalMonthKey_(best[k].period_id)<p)best[k]=r;});
  return best;
}
function buildBsiLiveAreaRows_(periodId){
  periodId=canonicalMonthKey_(periodId)||periodId;if(!/^\d{4}-\d{2}$/.test(periodId))return[];
  const hpp=readSourceObjects_('KOMPAS_04').filter(r=>sourceMonthMatches_(r,periodId));
  const sf=readSourceObjects_('KOMPAS_02').filter(r=>sourceMonthMatches_(r,periodId));
  const reg=readSourceObjects_('KOMPAS_05_REG').filter(r=>sourceMonthMatches_(r,periodId));
  const mtg=readSourceObjects_('KOMPAS_05_MTG').filter(r=>sourceMonthMatches_(r,periodId));
  const br=readSourceObjects_('KOMPAS_03').filter(r=>sourceMonthMatches_(r,periodId));
  let kr=[],act=[];try{kr=readSourceObjects_('KOMPAS_01').filter(r=>sourceMonthMatches_(r,periodId));}catch(e){}try{act=readSourceObjects_('KOMPAS_06').filter(r=>sourceMonthMatches_(r,periodId));}catch(e){}
  if(!hpp.length&&!sf.length&&!reg.length&&!mtg.length)return[];
  const dir=bsiLiveAreaDirectory_(),targets=bsiLatestTargetMap_(periodId),refs=bsiLatestAreaReferenceMap_(periodId),groups={};
  function areaMeta(area,ro,rh){const k=upper_(area);const d=dir[k]||{};return{area_id:d.area_id||('LIVE_'+k.replace(/[^A-Z0-9]+/g,'_').slice(0,45)),area_name:norm_(area)||'AREA BELUM TERPETAKAN',ro_source:d.ro_source||norm_(ro),ro_filter_group:d.ro_filter_group||norm_(ro),rh_user_keys:d.rh_user_key||'',rh_names:d.rh_name||norm_(rh)};}
  function ensure(area,prod,ro,rh){const meta=areaMeta(area,ro,rh),k=upper_(meta.area_name)+'|'+prod;if(!groups[k]){const tr=targets[upper_(meta.area_name)+'|'+prod]||{},ref=refs[upper_(meta.area_name)+'|'+prod]||{};groups[k]={period_id:periodId,product:prod,...meta,target_rp:num_(tr.target_rp),target_source_period:canonicalMonthKey_(tr.period_id)||'',achievement_rp:0,sfSet:{},sf_green:0,sf_grey:0,sf_red:0,pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0,branchSet:{},branchCovered:{},koreaSet:{},koreaActiveSet:{},open_opportunity_rp:num_(ref.open_opportunity_rp),koreaActivitySet:{},status:'LIVE_KOMPAS'};}return groups[k];}
  function both(area,prod,ro,rh){const a=ensure(area,'ALL',ro,rh);return prod==='ALL'?[a]:[a,ensure(area,prod,ro,rh)];}
  // SF aktif + warna.
  sf.forEach(r=>{const st=upper_(pick_(r,['STATUS_SYNC','STATUS_SF','STATUS']));if(st&& !/AKTIF|ACTIVE/.test(st))return;const area=norm_(pick_(r,['AREA','AREA_NAME']));if(!area)return;const prod=bsiLiveProductFromSf_(pick_(r,['JENIS_SF'])),sfid=norm_(pick_(r,['NIP_SF_KEY','NIP_SF','NIK_SF']));if(!sfid)return;const target=num_(pick_(r,['TARGET_OL_SF','TARGET_SF','TARGET'])),actual=prod==='MITRAGUNA'?num_(pick_(r,['CAIR_MITRAGUNA'])):num_(pick_(r,['CAIR_REGULER'])),ratio=target?safeDiv_(actual,target):0,color=ratio>=APP.RULES.SF_GREEN_MIN?'GREEN':(ratio>=APP.RULES.SF_GREY_MIN?'GREY':'RED');both(area,prod,pick_(r,['REGION','RO']),pick_(r,['RH','REGION_HEAD'])).forEach(g=>{if(!g.sfSet[sfid]){g.sfSet[sfid]=1;g['sf_'+color.toLowerCase()]++;}});});
  // Actual cair dari HPP.
  hpp.forEach(r=>{const area=norm_(pick_(r,['AREA','AREA_NAME']));if(!area)return;const prod=bsiLiveProductFromHpp_(pick_(r,['SEGMEN_PRODUK','PRODUK','JENIS_PRODUK'])),amt=num_(pick_(r,['PLAFOND_CAIR','PLAFOND','NOMINAL_CAIR','CAIR']));both(area,prod,pick_(r,['REGION','RO']),pick_(r,['REGION_HEAD','RH'])).forEach(g=>g.achievement_rp+=amt);});
  function addPipe(rows,prod){(rows||[]).forEach(r=>{const area=norm_(pick_(r,['AREA','AREA_NAME']));if(!area)return;const amt=num_(pick_(r,['PLAFOND_PIPELINE','PLAFOND','NOMINAL'])),stage=upper_(pick_(r,['STAGE','STATUS_STAGE'])),ket=upper_([pick_(r,['KET']),pick_(r,['DETAIL_KETERANGAN']),pick_(r,['STATUS'])].join(' ')),batal=/BATAL\s*CAIR|BATAL|REJECT/.test(ket),carry=/CARRY\s*OVER|CARRY|BERLANJUT|LANJUT/.test(ket);both(area,prod,pick_(r,['REGION','RO']),pick_(r,['REGION_HEAD','RH'])).forEach(g=>{if(stage!=='CAIR'&&!batal&&!carry)g.pipeline_active_rp+=amt;if(carry&&!batal)g.carry_over_rp+=amt;if(batal)g.batal_cair_rp+=amt;});});}
  addPipe(reg,'REGULER');addPipe(mtg,'MITRAGUNA');
  // Coverage cabang.
  br.forEach(r=>{const area=norm_(pick_(r,['AREA','AREA_NAME']));if(!area)return;const bid=norm_(pick_(r,['BRANCH_ID','ID_BRANCH']))||norm_(pick_(r,['NAMA_BRANCH','BRANCH']));if(!bid)return;const regN=num_(pick_(r,['JML SF REG NOW','JML_SF_REG_NOW'])),mtgN=num_(pick_(r,['JML SF MTG NOW','JML_SF_MTG_NOW']));[['ALL',regN+mtgN],['REGULER',regN],['MITRAGUNA',mtgN]].forEach(([prod,n])=>{const g=ensure(area,prod,pick_(r,['REGION','RO']),pick_(r,['REGION_HEAD','RH']));g.branchSet[bid]=1;if(n>0)g.branchCovered[bid]=1;});});
  // Korea aktif dan aktivitas minimal ada pada bulan tersebut.
  kr.forEach(r=>{const area=norm_(pick_(r,['AREA','AREA_NAME'])),kid=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA']));if(!area||!kid)return;['ALL','REGULER','MITRAGUNA'].forEach(prod=>{const g=ensure(area,prod,pick_(r,['REGION','RO']),pick_(r,['REGION_HEAD','RH']));g.koreaSet[kid]=1;if(!upper_(pick_(r,['STATUS_SYNC','STATUS'])).includes('NON'))g.koreaActiveSet[kid]=1;});});
  act.forEach(r=>{const area=norm_(pick_(r,['AREA_KOREA_CURRENT','AREA','AREA_NAME'])),kid=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA']));if(!area||!kid)return;['ALL','REGULER','MITRAGUNA'].forEach(prod=>ensure(area,prod,pick_(r,['REGION_KOREA_CURRENT','REGION','RO']),pick_(r,['RH_CURRENT','REGION_HEAD'])).koreaActivitySet[kid]=1);});
  const out=Object.values(groups);
  out.forEach(g=>{g.sf_active_total=Object.keys(g.sfSet).length;g.branch_coverage=Object.keys(g.branchSet).length?safeDiv_(Object.keys(g.branchCovered).length,Object.keys(g.branchSet).length):null;g.korea_activity_rate=Object.keys(g.koreaActiveSet).length?safeDiv_(Object.keys(g.koreaActivitySet).filter(k=>g.koreaActiveSet[k]).length,Object.keys(g.koreaActiveSet).length):null;g.attainment_pct=g.target_rp?safeDiv_(g.achievement_rp,g.target_rp):null;g.min_sf_required=g.product==='MITRAGUNA'?Math.ceil(g.target_rp/APP.RULES.SF_TARGET_MTG):(g.product==='REGULER'?Math.ceil(g.target_rp/APP.RULES.SF_TARGET_REG):0);g.sf_fulfillment=g.min_sf_required?safeDiv_(g.sf_active_total,g.min_sf_required):null;g.productivity_per_sf_rp=g.sf_active_total?safeDiv_(g.achievement_rp,g.sf_active_total):null;const sfOk=g.sf_fulfillment!=null&&g.sf_fulfillment>=1,prodOk=g.productivity_per_sf_rp!=null&&g.productivity_per_sf_rp>=APP.RULES.PRODUCTIVITY_BASELINE;g.quadrant_code=sfOk?(prodOk?'Q1':'Q4'):(prodOk?'Q2':'Q3');g.quadrant_name={Q1:'Kondisi Kuat',Q2:'Perlu Tambahan Tim',Q3:'Perlu Perhatian Utama',Q4:'Perlu Meningkatkan Hasil Tim'}[g.quadrant_code];g.condition_summary='Data '+periodLabel_(periodId)+' dibaca dari Kompas pada saat Perbarui Data Overview.'+(g.target_source_period&&g.target_source_period!==periodId?' Target masih memakai acuan '+periodLabel_(g.target_source_period)+' yang terakhir tervalidasi.':'');g.system_focus='Periksa pencairan, pipeline, kondisi SF, dan cakupan cabang.';if(g.target_source_period&&g.target_source_period!==periodId)g.status='LIVE_KOMPAS_TARGET_ACUAN_LAMA';delete g.sfSet;delete g.branchSet;delete g.branchCovered;delete g.koreaSet;delete g.koreaActiveSet;delete g.koreaActivitySet;});
  // ALL min SF = Reguler + Mitraguna supaya tetap konsisten dengan aturan existing.
  const byArea={};out.forEach(g=>{const k=upper_(g.area_name);if(!byArea[k])byArea[k]={};byArea[k][g.product]=g;});Object.keys(byArea).forEach(k=>{const a=byArea[k].ALL,r=byArea[k].REGULER,m=byArea[k].MITRAGUNA;if(a){a.min_sf_required=(r?r.min_sf_required:0)+(m?m.min_sf_required:0);a.sf_fulfillment=a.min_sf_required?safeDiv_(a.sf_active_total,a.min_sf_required):null;}});
  ['ALL','REGULER','MITRAGUNA'].forEach(prod=>{const list=out.filter(x=>x.product===prod);assignRanks_(list,'attainment_pct','rank_selindo');list.forEach(x=>x.rank_pool=list.length);});
  return out;
}
function persistBsiClosedMonthSnapshot_(periodId){
  const rows=buildBsiLiveAreaRows_(periodId);if(!rows.length)throw new Error('Kompas belum menghasilkan snapshot Area untuk '+periodLabel_(periodId)+'.');
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.AREA_PERF);if(!sh)throw new Error('04_AREA_PERFORMANCE tidak ditemukan.');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(norm_),existing=sheetToObjects_(sh).filter(r=>canonicalMonthKey_(r.period_id)!==periodId),combined=existing.concat(rows);
  replaceSheetObjects_(sh,headers,combined);
  persistBsiHistoryMonth_(periodId,rows);
  upsertBsiSnapshotMeta_(periodId,rows.length);
  return{periodId,rowCount:rows.length};
}
function persistBsiHistoryMonth_(periodId,areaRows){
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.HISTORY_2026);if(!sh)return;
  const hpp=readSourceObjects_('KOMPAS_04').filter(r=>sourceMonthMatches_(r,periodId)),noa={};
  hpp.forEach((r,i)=>{const area=upper_(pick_(r,['AREA','AREA_NAME']));if(!area)return;const prod=bsiLiveProductFromHpp_(pick_(r,['SEGMEN_PRODUK','PRODUK','JENIS_PRODUK'])),id=norm_(pick_(r,['LD','NOPEN_NIP','ID_PENGAJUAN']))||('R'+i),k=area+'|'+prod;if(!noa[k])noa[k]=new Set();noa[k].add(id);});
  const byArea={};areaRows.forEach(r=>{const k=upper_(r.area_name);if(!byArea[k])byArea[k]={};byArea[k][upper_(r.product)]=r;});
  const hist=[];Object.keys(byArea).forEach(k=>{const a=byArea[k].ALL||{},rg=byArea[k].REGULER||{},mg=byArea[k].MITRAGUNA||{};hist.push({year:+periodId.slice(0,4),month_num:+periodId.slice(5,7),month:periodLabel_(periodId).split(' ')[0].slice(0,3).toUpperCase(),period_id:periodId,area_name:a.area_name||rg.area_name||mg.area_name,ro_source:a.ro_source||rg.ro_source||mg.ro_source,target_reg_rp:num_(rg.target_rp),target_mtg_rp:num_(mg.target_rp),target_all_rp:num_(a.target_rp),actual_reg_rp:num_(rg.achievement_rp),actual_mtg_rp:num_(mg.achievement_rp),actual_all_rp:num_(a.achievement_rp),actual_asabri_rp:0,attainment_reg:safeDiv_(rg.achievement_rp,rg.target_rp),attainment_mtg:safeDiv_(mg.achievement_rp,mg.target_rp),attainment_all:safeDiv_(a.achievement_rp,a.target_rp),sf_reg:num_(rg.sf_active_total),sf_mtg:num_(mg.sf_active_total),sf_total:num_(a.sf_active_total),productivity_reg_rp:safeDiv_(rg.achievement_rp,rg.sf_active_total),productivity_mtg_rp:safeDiv_(mg.achievement_rp,mg.sf_active_total),productivity_all_rp:safeDiv_(a.achievement_rp,a.sf_active_total),reg_noa:(noa[k+'|REGULER']||new Set()).size,mtg_noa:(noa[k+'|MITRAGUNA']||new Set()).size,total_noa:(noa[k+'|REGULER']||new Set()).size+(noa[k+'|MITRAGUNA']||new Set()).size,data_available:1,source_note:'Kompas manual refresh: KOMPAS_04 + KOMPAS_02; target memakai acuan terakhir tervalidasi.'});});
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(norm_),existing=sheetToObjects_(sh).filter(r=>canonicalMonthKey_(r.period_id)!==periodId);replaceSheetObjects_(sh,headers,existing.concat(hist));
}
function upsertBsiSnapshotMeta_(periodId,rowCount){
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.SNAPSHOT);if(!sh)return;const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(norm_),existing=sheetToObjects_(sh).filter(r=>canonicalMonthKey_(r.period_id)!==periodId),row={snapshot_id:'SNAP-'+periodId.replace('-','')+'-KOMPAS',period_id:periodId,month_key:monthKeyFromPeriod_(periodId),version:1,status:'LIVE_KOMPAS',source_master_db:'KOMPAS_01-06 · MANUAL REFRESH'};replaceSheetObjects_(sh,headers,existing.concat([row]));
}

function getAreaRowsCached_(periodId, product) {
  const p = upper_(product || 'ALL');
  const key = cacheKey_('AREA_V53', periodId, p);
  const cached = cacheGetJson_(key);
  if (cached) return cached;

  const grouped = { ALL:[], REGULER:[], MITRAGUNA:[] };
  const sourceRows=readObjects_(APP.SHEETS.AREA_PERF).filter(r => norm_(r.period_id) === periodId);
  if(sourceRows.length){
    sourceRows.forEach(r => {
      const prod = upper_(r.product || 'ALL');
      if (!grouped[prod]) return;
      const row = normalizeAreaRow_(r);
      if (row.area_id) grouped[prod].push(row);
    });
  } else {
    // V5.1: untuk periode baru (mis. Sep 2026) jangan mundur otomatis ke
    // snapshot Agustus. Coba bangun snapshot langsung dari Kompas dahulu.
    let live=[];
    try{ live=buildBsiLiveAreaRows_(periodId); }catch(e){ live=[]; }
    if(live.length){
      live.forEach(r=>{
        const prod=upper_(r.product||'ALL');
        if(grouped[prod])grouped[prod].push(normalizeAreaRow_(r));
      });
    }else{
      const hist=buildHistoricalAreaRows_(periodId);
      hist.forEach(row=>{if(grouped[row.product])grouped[row.product].push(row);});
    }
  }
  Object.keys(grouped).forEach(prod => {
    grouped[prod].sort((a,b) => (a.rank_selindo || 9999) - (b.rank_selindo || 9999));
    cachePutJson_(cacheKey_('AREA_V53', periodId, prod), grouped[prod], APP.CACHE_AREA_TTL);
  });
  return grouped[p] || [];
}

function normalizeAreaRow_(r) {
  return {
    period_id: norm_(r.period_id), product: upper_(r.product || 'ALL'),
    area_id: norm_(r.area_id), area_name: norm_(r.area_name), ro_source:norm_(r.ro_source), ro_filter_group:norm_(r.ro_filter_group || r.ro_source),
    rh_user_keys: norm_(r.rh_user_keys), rh_names: norm_(r.rh_names),
    rank_selindo: numOrNull_(r.rank_selindo), rank_pool: numOrNull_(r.rank_pool),
    target_rp: num_(r.target_rp), achievement_rp: num_(r.achievement_rp), attainment_pct: numOrNull_(r.attainment_pct),
    sf_active: num_(r.sf_active_total), sf_green: num_(r.sf_green), sf_grey: num_(r.sf_grey), sf_red: num_(r.sf_red),
    pipeline_active_rp: num_(r.pipeline_active_rp), carry_over_rp: num_(r.carry_over_rp), batal_cair_rp: num_(r.batal_cair_rp),
    branch_coverage: numOrNull_(r.branch_coverage), korea_activity_rate: numOrNull_(r.korea_activity_rate),
    open_opportunity_rp: num_(r.open_opportunity_rp), sf_fulfillment: numOrNull_(r.sf_fulfillment), min_sf_required: num_(r.min_sf_required),
    productivity_per_sf_rp: num_(r.productivity_per_sf_rp), quadrant_code: norm_(r.quadrant_code), quadrant_name: norm_(r.quadrant_name),
    condition_summary: norm_(r.condition_summary), system_focus: norm_(r.system_focus), status: norm_(r.status)
  };
}


function buildHistoricalAreaRows_(periodId) {
  const hist=readObjects_(APP.SHEETS.HISTORY_2026).filter(r=>norm_(r.period_id)===periodId);
  if(!hist.length)return[];
  const currentScope=getLatestRoRhScope_(getRoRhScopeCached_());
  const scopeByArea={};
  currentScope.forEach(r=>{scopeByArea[upper_(r.area_name)]=r;});
  const currentAreas=readObjects_(APP.SHEETS.AREA_PERF).filter(r=>upper_(r.product||'ALL')==='ALL');
  const idByArea={}; currentAreas.forEach(r=>{if(r.area_name)idByArea[upper_(r.area_name)]=norm_(r.area_id);});
  const out=[];
  hist.forEach(r=>{
    const areaName=norm_(r.area_name); if(!areaName)return;
    const sc=scopeByArea[upper_(areaName)]||{};
    const areaId=idByArea[upper_(areaName)]||norm_(sc.area_id)||('HIST_'+upper_(areaName).replace(/[^A-Z0-9]+/g,'_'));
    const defs=[
      ['ALL','target_all_rp','actual_all_rp','sf_total'],
      ['REGULER','target_reg_rp','actual_reg_rp','sf_reg'],
      ['MITRAGUNA','target_mtg_rp','actual_mtg_rp','sf_mtg']
    ];
    defs.forEach(d=>{
      const product=d[0],target=num_(r[d[1]]),actual=num_(r[d[2]]),sf=num_(r[d[3]]);
      const minSf=product==='MITRAGUNA'?Math.ceil(target/APP.RULES.SF_TARGET_MTG):product==='REGULER'?Math.ceil(target/APP.RULES.SF_TARGET_REG):(Math.ceil(num_(r.target_reg_rp)/APP.RULES.SF_TARGET_REG)+Math.ceil(num_(r.target_mtg_rp)/APP.RULES.SF_TARGET_MTG));
      const fulfill=minSf?safeDiv_(sf,minSf):null,prod=sf?safeDiv_(actual,sf):0;
      const sfOk=fulfill!=null&&fulfill>=1,prodOk=prod>=APP.RULES.PRODUCTIVITY_BASELINE;
      const q=sfOk?(prodOk?'Q1':'Q4'):(prodOk?'Q2':'Q3');
      const qName={Q1:'Kondisi Kuat',Q2:'Perlu Tambahan Tim',Q3:'Perlu Perhatian Utama',Q4:'Perlu Meningkatkan Hasil Tim'}[q];
      out.push({
        period_id:periodId,product,area_id:areaId,area_name:areaName,
        ro_source:norm_(r.ro_source),ro_filter_group:norm_(sc.filter_ro||r.ro_source),
        rh_user_keys:norm_(sc.rh_user_key),rh_names:norm_(sc.rh_name),rank_selindo:null,rank_pool:null,
        target_rp:target,achievement_rp:actual,attainment_pct:target?safeDiv_(actual,target):0,
        sf_active:sf,sf_green:null,sf_grey:null,sf_red:null,
        pipeline_active_rp:null,carry_over_rp:null,batal_cair_rp:null,
        branch_coverage:null,korea_activity_rate:null,open_opportunity_rp:0,
        sf_fulfillment:fulfill,min_sf_required:minSf,productivity_per_sf_rp:prod,
        quadrant_code:q,quadrant_name:qName,
        condition_summary:'Historical 2026: target, pencairan, SF, produktivitas, dan kuadran dasar tersedia.',
        system_focus:'Pipeline, aktivitas, cakupan cabang, dan kualitas SF belum tersedia lengkap untuk snapshot historis ini.',
        status:'HISTORICAL_BASIC'
      });
    });
  });
  ['ALL','REGULER','MITRAGUNA'].forEach(prod=>{
    const rows=out.filter(x=>x.product===prod); assignRanks_(rows,'attainment_pct','rank_selindo');
  });
  return out;
}

function getLatestRoRhScope_(rows){
  if(!rows||!rows.length)return[];
  const periods=Array.from(new Set(rows.map(r=>norm_(r.period_id)).filter(Boolean))).sort();
  const latest=periods.length?periods[periods.length-1]:'';
  return latest?rows.filter(r=>norm_(r.period_id)===latest):rows.slice();
}

function buildScopeFromAreaRows_(rows,periodId){
  const out=[];
  (rows||[]).forEach(r=>{
    const keys=norm_(r.rh_user_keys).split('|').map(x=>x.trim()).filter(Boolean);
    const names=norm_(r.rh_names).split('|').map(x=>x.trim()).filter(Boolean);
    if(!keys.length){out.push({period_id:periodId,filter_ro:norm_(r.ro_filter_group||r.ro_source),source_ro:norm_(r.ro_source),rh_user_key:'',rh_name:'',area_id:r.area_id,area_name:r.area_name,scope_status:'FALLBACK'});return;}
    keys.forEach((k,i)=>out.push({period_id:periodId,filter_ro:norm_(r.ro_filter_group||r.ro_source),source_ro:norm_(r.ro_source),rh_user_key:k,rh_name:names[i]||names[0]||k,area_id:r.area_id,area_name:r.area_name,scope_status:'FALLBACK'}));
  });
  return out;
}

function getScopeRowsCached_() {
  const key = 'SCOPE_ROWS_V4';
  const cached = cacheGetJson_(key);
  if (cached) return cached;
  const rows = readObjects_(APP.SHEETS.USER_AREA_SCOPE).map(r => ({
    user_key: norm_(r.user_key), display_name: norm_(r.display_name), role: upper_(r.role),
    area_id: norm_(r.area_id), area_name: norm_(r.area_name), allowed_region_ids: norm_(r.allowed_region_ids)
  })).filter(r => r.user_key && r.area_id);
  cachePutJson_(key, rows, APP.CACHE_REFERENCE_TTL);
  return rows;
}

/** =========================
 *  2) BISNIS YANG SUDAH BERJALAN
 *  ========================= */

function getHistoryBundle(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapHistoryBundle_(req);
  const scopeAreaNames = getScopeAreaNames_(req);
  const cacheKey = cacheKey_('HIST_V51', req.periodId, req.product, req.roSource, req.rhUserKey, req.areaId, req.accessScopeCode||'ALL');
  const cached = cacheGetJson_(cacheKey);
  if (cached) return cached;

  const historyPeriod=nextPeriodId_(req.periodId,-1);
  const cutoffMonth=/^\d{4}-\d{2}$/.test(historyPeriod)?Number(historyPeriod.slice(5,7)):12;
  const rows = readObjects_(APP.SHEETS.HISTORY_2026)
    .filter(r => num_(r.year) === 2026 && num_(r.month_num)<=cutoffMonth && scopeAreaNames.has(upper_(r.area_name)));

  const monthMap = {};
  rows.forEach(r => {
    const m = Math.floor(num_(r.month_num));
    if (!m) return;
    if (!monthMap[m]) monthMap[m] = { month_num:m, month:norm_(r.month), target_rp:0, actual_rp:0, sf_active:0, asabri_actual_rp:0, noa:0 };
    const x = monthMap[m];
    if (req.product === 'REGULER') {
      x.target_rp += num_(r.target_reg_rp); x.actual_rp += num_(r.actual_reg_rp); x.sf_active += num_(r.sf_reg); x.noa += num_(r.reg_noa);
    } else if (req.product === 'MITRAGUNA') {
      x.target_rp += num_(r.target_mtg_rp); x.actual_rp += num_(r.actual_mtg_rp); x.sf_active += num_(r.sf_mtg); x.noa += num_(r.mtg_noa);
    } else {
      x.target_rp += num_(r.target_all_rp); x.actual_rp += num_(r.actual_all_rp); x.sf_active += num_(r.sf_total); x.noa += num_(r.total_noa);
      x.asabri_actual_rp += num_(r.actual_asabri_rp);
    }
  });

  // V5.1: jangan hanya menambahkan closed month. Isi SEMUA bulan yang belum ada
  // dari serving snapshot / Kompas live fallback. Ini memperbaiki Jejak Kinerja
  // yang sebelumnya berhenti di Juli walaupun Agustus/September sudah tersedia.
  for(let mo=1;mo<=cutoffMonth;mo++){
    if(monthMap[mo])continue;
    const p='2026-'+String(mo).padStart(2,'0');
    const snapRows=filterScopeRows_(getAreaRowsCached_(p,req.product),Object.assign({},req,{periodId:p}));
    if(!snapRows.length)continue;
    const sm=summarizeAreas_(snapRows);
    monthMap[mo]={
      month_num:mo,
      month:periodLabel_(p).split(' ')[0].slice(0,3).toUpperCase(),
      target_rp:sm.target_rp,
      actual_rp:sm.achievement_rp,
      sf_active:sm.sf_active,
      asabri_actual_rp:0,
      noa:0
    };
    // Untuk bulan closed terbaru, NoA/actual/SF dipertegas dari Kompas.
    if(p===historyPeriod){
      try{
        const live=buildKompasMonthPerformance_(p,req);
        if(live&&live.hasData){
          monthMap[mo].actual_rp=live.actual_rp;
          if(live.sf_active>0)monthMap[mo].sf_active=live.sf_active;
          if(live.noa>0)monthMap[mo].noa=live.noa;
        }
      }catch(e){}
    }
  }

  const currentRows = filterScopeRows_(getAreaRowsCached_(historyPeriod, req.product), Object.assign({},req,{periodId:historyPeriod}));
  const current = summarizeAreas_(currentRows);
  const months = Object.keys(monthMap).map(Number).sort((a,b)=>a-b).map(m => {
    const x = monthMap[m];
    x.attainment_pct = safeDiv_(x.actual_rp, x.target_rp);
    x.productivity_per_sf_rp = safeDiv_(x.actual_rp, x.sf_active);
    return x;
  });

  const contribution = currentRows.slice().sort((a,b)=>b.achievement_rp-a.achievement_rp).map(r => ({
    area_id:r.area_id, area_name:r.area_name, achievement_rp:r.achievement_rp,
    contribution_pct:safeDiv_(r.achievement_rp,current.achievement_rp), attainment_pct:r.attainment_pct,
    rank_selindo:r.rank_selindo, quadrant_code:r.quadrant_code, quadrant_name:r.quadrant_name
  }));

  const historicalBasic=currentRows.some(r=>upper_(r.status)==='HISTORICAL_BASIC');
  const out = {
    months, current, contribution, scopeAreaCount: scopeAreaNames.size,
    historicalBasic,
    sourceNote:'Riwayat memakai snapshot historis yang tersedia; bulan closed terbaru dibaca dari Kompas setelah Perbarui Data Overview dijalankan.'
  };
  cachePutJson_(cacheKey, out, APP.CACHE_REFERENCE_TTL);
  return out;
}

/**
 * Ringkasan tambahan halaman awal dalam satu server call.
 * Tujuan: mengurangi 3 round-trip google.script.run (history, kelengkapan data, ranking)
 * menjadi satu request setelah ringkasan utama sudah terlihat.
 */
function getOverviewExtrasBundle(payload){
  const req=normalizeFilters_(payload||{});
  const key=cacheKey_('OVERVIEW_EXTRAS_V53',req.partner,req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const cached=cacheGetJson_(key);if(cached)return cached;
  const out={
    history:getHistoryBundle(req),
    dataHealth:getDataHealthBundle(req),
    rankSummary:getRankSummary(req),
    generatedAt:formatDateTime_(new Date())
  };
  cachePutJson_(key,out,300);
  return out;
}



/** =========================
 *  2B) BUSINESS PERFORMANCE REVIEW DATA ENGINE
 *  =========================
 *
 * Tujuan:
 * - Membentuk layer data sebelum presentation engine.
 * - Menyatukan historical 2026, growth MoM, achievement, gap,
 *   productivity, ticket size, pipeline closed-month dan current-month.
 * - Actual/SF/NOA bulan berjalan/closed-month dapat membaca Kompas.
 * - Historical Jan-Jul mempertahankan snapshot 2026 yang sudah tervalidasi;
 *   target tetap mengikuti reference yang sudah ada.
 *
 * Tidak membuat angka strategi. Sistem hanya menghitung dan membaca data.
 */
function getBusinessReviewBundle(payload){
  const req=normalizeFilters_(payload||{});
  if(req.partner==='MANTAP') return getMantapBusinessReviewBundle_(req);
  const key=cacheKey_('BUSINESS_REVIEW_V53',req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const cached=cacheGetJson_(key); if(cached)return cached;

  const closedPeriod=nextPeriodId_(req.periodId,-1);
  const previousClosedPeriod=nextPeriodId_(closedPeriod,-1);
  const performance=buildBusinessPerformance_(req,closedPeriod);
  const pipeline=buildPipelineReview_(req,closedPeriod,req.periodId);
  pipeline.closed.summary=applyAdminPipelineSummaryOverrides_(pipeline.closed.summary,req,closedPeriod);
  pipeline.current.summary=applyAdminPipelineSummaryOverrides_(pipeline.current.summary,req,req.periodId);
  const analysis=buildBusinessReviewAnalysis_(performance,pipeline);

  const out={
    filters:req,
    period:{current_period_id:req.periodId,current_period_label:periodLabel_(req.periodId),closed_period_id:closedPeriod,closed_period_label:periodLabel_(closedPeriod),previous_closed_period_id:previousClosedPeriod,previous_closed_period_label:periodLabel_(previousClosedPeriod)},
    performance,
    pipeline,
    analysis,
    sourceNote:'Perjalanan kinerja memakai snapshot yang sudah tervalidasi dan hasil manual refresh terbaru; pipeline bulan berjalan membaca sumber Kompas. Pencairan aktual membaca HPP Achievement.',
    generatedAt:formatDateTime_(new Date())
  };
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);
  return out;
}

function buildBusinessPerformance_(req,closedPeriod){
  const scopeAreaNames=getScopeAreaNames_(req);
  const historyRows=readObjectsIfExists_(APP.SHEETS.HISTORY_2026).filter(r=>num_(r.year)===2026&&scopeAreaNames.has(upper_(r.area_name)));
  const months=[];
  for(let m=1;m<=12;m++){
    const p='2026-'+String(m).padStart(2,'0');
    if(p>closedPeriod)break;
    const base=historyRows.filter(r=>norm_(r.period_id)===p);
    let x=aggregateHistoryPerformanceRows_(base,req.product);
    // Closed month yang belum masuk HISTORY_2026 (contoh Agustus 2026)
    // diambil dari snapshot AREA_PERFORMANCE + Kompas untuk SF/NOA.
    if(!base.length){
      const currentRows=filterScopeRows_(getAreaRowsCached_(p,req.product),req);
      x=aggregateCurrentPerformanceSnapshot_(currentRows,req.product);
      if(p===closedPeriod){
        try{
          const live=buildKompasMonthPerformance_(p,req);
          x=mergePerformanceMetrics_(x,live);
        }catch(err){
          x.source_note='Snapshot internal dipakai; Kompas bulan '+p+' belum dapat dibaca: '+err.message;
        }
      }
    }
    if(x.hasData){
      x.period_id=p;x.month_num=m;x.month=['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m];
      months.push(x);
    }
  }

  // Jika Kompas tersedia, gunakan actual/SF/NOA untuk closed month agar ticket size
  // dan produktivitas mengikuti source operasional yang sama dengan Kompas.
  const latest=months.length?months[months.length-1]:null;
  const prev=months.length>1?months[months.length-2]:null;
  months.forEach((x,i)=>{
    const b=i?months[i-1]:null;
    x.attainment_pct=safeDiv_(x.actual_rp,x.target_rp);
    x.productivity_per_sf_rp=safeDiv_(x.actual_rp,x.sf_active);
    x.ticket_size_rp=safeDiv_(x.actual_rp,x.noa);
    x.growth_actual_pct=b?safeGrowth_(x.actual_rp,b.actual_rp):null;
    x.growth_target_pct=b?safeGrowth_(x.target_rp,b.target_rp):null;
    x.growth_sf_pct=b?safeGrowth_(x.sf_active,b.sf_active):null;
    x.growth_noa_pct=b?safeGrowth_(x.noa,b.noa):null;
    x.growth_productivity_pct=b?safeGrowth_(x.productivity_per_sf_rp,b.productivity_per_sf_rp):null;
    x.growth_ticket_size_pct=b?safeGrowth_(x.ticket_size_rp,b.ticket_size_rp):null;
    x.gap_rp=x.actual_rp-x.target_rp;
  });

  const latestFinal=months.length?months[months.length-1]:emptyPerformanceMonth_(closedPeriod);
  const previousFinal=months.length>1?months[months.length-2]:emptyPerformanceMonth_(previousPeriodSafe_(closedPeriod));
  const comparison={
    previous:previousFinal,
    latest:latestFinal,
    actual_growth_pct:safeGrowth_(latestFinal.actual_rp,previousFinal.actual_rp),
    productivity_growth_pct:safeGrowth_(latestFinal.productivity_per_sf_rp,previousFinal.productivity_per_sf_rp),
    ticket_size_growth_pct:safeGrowth_(latestFinal.ticket_size_rp,previousFinal.ticket_size_rp),
    sf_growth_pct:safeGrowth_(latestFinal.sf_active,previousFinal.sf_active),
    noa_growth_pct:safeGrowth_(latestFinal.noa,previousFinal.noa),
    target_growth_pct:safeGrowth_(latestFinal.target_rp,previousFinal.target_rp),
    gap_change_rp:latestFinal.gap_rp-previousFinal.gap_rp,
    achievement_change_pct:latestFinal.attainment_pct-previousFinal.attainment_pct
  };

  const cumulative=months.reduce((s,x)=>{s.actual_rp+=num_(x.actual_rp);s.target_rp+=num_(x.target_rp);s.noa+=num_(x.noa);return s;},{actual_rp:0,target_rp:0,noa:0});
  cumulative.achievement_pct=safeDiv_(cumulative.actual_rp,cumulative.target_rp);
  cumulative.ticket_size_rp=safeDiv_(cumulative.actual_rp,cumulative.noa);

  return {months,latest:latestFinal,previous:previousFinal,comparison,cumulative,source:'HISTORY_2026 + KOMPAS_04 + KOMPAS_02',product:req.product};
}

function aggregateHistoryPerformanceRows_(rows,product){
  const out=emptyPerformanceMonth_('');
  const p=upper_(product||'ALL');
  rows.forEach(r=>{
    if(p==='REGULER'){out.target_rp+=num_(r.target_reg_rp);out.actual_rp+=num_(r.actual_reg_rp);out.sf_active+=num_(r.sf_reg);out.noa+=num_(r.reg_noa);}
    else if(p==='MITRAGUNA'){out.target_rp+=num_(r.target_mtg_rp);out.actual_rp+=num_(r.actual_mtg_rp);out.sf_active+=num_(r.sf_mtg);out.noa+=num_(r.mtg_noa);}
    else {out.target_rp+=num_(r.target_all_rp);out.actual_rp+=num_(r.actual_all_rp);out.sf_active+=num_(r.sf_total);out.noa+=num_(r.total_noa);}
  });
  out.hasData=rows.length>0;out.source_note='HISTORY_2026';return out;
}

function aggregateCurrentPerformanceSnapshot_(rows,product){
  const out=emptyPerformanceMonth_('');
  rows.forEach(r=>{out.target_rp+=num_(r.target_rp);out.actual_rp+=num_(r.achievement_rp);out.sf_active+=num_(r.sf_active);});
  out.hasData=rows.length>0;out.source_note='04_AREA_PERFORMANCE';return out;
}

function buildKompasMonthPerformance_(periodId,req){
  const monthKey=monthKeyFromPeriod_(periodId),scopeAreaNames=getScopeAreaNames_(req),p=upper_(req.product||'ALL');
  const hpp=readSourceObjects_('KOMPAS_04').filter(r=>sourceMonthMatches_(r, periodId));
  const sf=readSourceObjects_('KOMPAS_02').filter(r=>sourceMonthMatches_(r, periodId));
  let koreaMap={};
  try{
    const kr=readSourceObjects_('KOMPAS_01').filter(r=>sourceMonthMatches_(r, periodId));
    kr.forEach(r=>{const k=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA','NIK_KOREA']));if(k)koreaMap[k]={area_name:norm_(pick_(r,['AREA','AREA_NAME'])),ro:norm_(pick_(r,['RO','REGION','SOURCE_RO']))};});
  }catch(err){}
  const areaAllowed=(r)=>{
    const area=norm_(pick_(r,['AREA','AREA_NAME']));
    if(area)return scopeAreaNames.has(upper_(area));
    const k=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA','NIK_KOREA']));
    return !!(k&&koreaMap[k]&&scopeAreaNames.has(upper_(koreaMap[k].area_name)));
  };
  const out=emptyPerformanceMonth_(periodId);
  const seenNoa={};
  hpp.forEach(r=>{
    if(!areaAllowed(r))return;
    const seg=upper_(pick_(r,['SEGMEN_PRODUK','SEGMEN PRODUK','PRODUK','JENIS_PRODUK']));
    const isMtg=/MITRAGUNA|(^|[^A-Z])MTG([^A-Z]|$)|IMPLAN/.test(seg);
    if(p==='REGULER'&&isMtg)return;
    if(p==='MITRAGUNA'&&!isMtg)return;
    const amount=num_(pick_(r,['PLAFOND_CAIR','PLAFOND','NOMINAL_CAIR','CAIR']));out.actual_rp+=amount;
    const id=norm_(pick_(r,['NOPEN_NIP','NOPEN','NOA','ID_PENGAJUAN','ID','NOMOR_APLIKASI']))||('ROW_'+Object.keys(seenNoa).length+'_'+amount);
    seenNoa[id]=1;
  });
  out.noa=Object.keys(seenNoa).length;
  const sfSeen={};
  sf.forEach(r=>{
    const st=upper_(pick_(r,['STATUS_SYNC','STATUS_SF','STATUS']));if(st&& !/AKTIF|ACTIVE/.test(st))return;
    const jenis=upper_(pick_(r,['JENIS_SF','TYPE_SF','KATEGORI_SF']));const isMtg=/MITRAGUNA|MTG|IMPLAN/.test(jenis);
    const pp=isMtg?'MITRAGUNA':'REGULER';if(p!=='ALL'&&pp!==p)return;
    const area=norm_(pick_(r,['AREA','AREA_NAME']));if(area && !scopeAreaNames.has(upper_(area)))return;
    const k=norm_(pick_(r,['NIP_SF_KEY','NIP_SF','NIK_SF']));if(k)sfSeen[k]=1;
  });
  out.sf_active=Object.keys(sfSeen).length;out.hasData=hpp.length>0||sf.length>0;out.source_note='KOMPAS_04 HPP_ACHIEV + KOMPAS_02 MASTER_SF';return out;
}

function mergePerformanceMetrics_(base,live){
  if(!live||!live.hasData)return base;
  const out=Object.assign({},base);
  if(live.actual_rp!=null)out.actual_rp=live.actual_rp;
  if(live.sf_active!=null&&live.sf_active>0)out.sf_active=live.sf_active;
  if(live.noa!=null&&live.noa>0)out.noa=live.noa;
  out.hasData=true;out.source_note=live.source_note||base.source_note;return out;
}

function emptyPerformanceMonth_(periodId){return{period_id:periodId||'',month_num:0,month:'',target_rp:0,actual_rp:0,sf_active:0,noa:0,hasData:false,source_note:''};}
function previousPeriodSafe_(periodId){return nextPeriodId_(periodId,-1);}
function safeGrowth_(current,previous){const c=num_(current),p=num_(previous);return p===0?null:(c-p)/Math.abs(p);}

function buildBusinessReviewAnalysis_(performance,pipeline){
  const c=performance.comparison||{},l=performance.latest||{};
  const bullets=[];
  if(c.actual_growth_pct!=null)bullets.push((c.actual_growth_pct>=0?'Realisasi meningkat ':'Realisasi menurun ')+pctText_(Math.abs(c.actual_growth_pct))+' dibanding bulan sebelumnya.');
  if(c.productivity_growth_pct!=null)bullets.push((c.productivity_growth_pct>=0?'Produktivitas per SF naik ':'Produktivitas per SF turun ')+pctText_(Math.abs(c.productivity_growth_pct))+'.');
  if(c.ticket_size_growth_pct!=null)bullets.push((c.ticket_size_growth_pct>=0?'Ticket size naik ':'Ticket size turun ')+pctText_(Math.abs(c.ticket_size_growth_pct))+'.');
  if(l.attainment_pct<1)bullets.push('Pencapaian periode terakhir '+pctText_(l.attainment_pct)+' dengan gap '+moneyText_(Math.max(0,l.target_rp-l.actual_rp))+' terhadap target.');
  const p=pipeline&&pipeline.closed&&pipeline.closed.summary||null;
  if(p&&p.incoming_rp){const stuck=p.carry_over_rp+p.batal_cair_rp;bullets.push('Pipeline yang tertahan mencapai '+moneyText_(stuck)+'; sistem memisahkan Carry Over dan Batal Cair beserta alasannya.');}
  return{headline:buildBusinessReviewHeadline_(performance,pipeline),bullets:bullets.slice(0,5),latest_reading:bullets.slice(0,3),data_quality:pipeline&&pipeline.dataQuality||[]};
}

function buildBusinessReviewHeadline_(performance,pipeline){
  const l=performance.latest||{},c=performance.comparison||{};
  if(c.actual_growth_pct!=null&&c.actual_growth_pct<-0.05)return'Pencairan periode terakhir melemah; perlu dibaca bersama produktivitas, ticket size, dan pipeline.';
  if(l.attainment_pct>=1)return'Realisasi sudah mencapai target; fokus berikutnya adalah menjaga kualitas pertumbuhan dan kesinambungan pipeline.';
  if(c.productivity_growth_pct!=null&&c.productivity_growth_pct>0.05)return'Produktivitas membaik, namun realisasi masih perlu didorong menuju target.';
  return'Realisasi belum mencapai target; pertumbuhan perlu dibaca dari kapasitas, produktivitas, dan kualitas pipeline.';
}

function buildPipelineReview_(req,closedPeriod,currentPeriod){
  const scopeAreaNames=getScopeAreaNames_(req),closed=aggregatePipelineMonth_(closedPeriod,req,scopeAreaNames),current=aggregatePipelineMonth_(currentPeriod,req,scopeAreaNames);
  return{closed,current,dataQuality:[].concat(closed.dataQuality||[],current.dataQuality||[]),source:'KOMPAS_05_REG + KOMPAS_05_MTG'};
}

function aggregatePipelineMonth_(periodId,req,scopeAreaNames){
  const monthKey=monthKeyFromPeriod_(periodId),p=upper_(req.product||'ALL');
  const pipeSources=p==='REGULER'?['KOMPAS_05_REG']:(p==='MITRAGUNA'?['KOMPAS_05_MTG']:['KOMPAS_05_REG','KOMPAS_05_MTG']);
  const pipeRows=[],dataQuality=[];
  pipeSources.forEach(src=>{try{readSourceObjects_(src).forEach(r=>{if(sourceMonthMatches_(r,periodId))pipeRows.push(Object.assign({__source:src},r));});}catch(err){dataQuality.push(src+': '+err.message);}});
  const koreaAreaMap=getKompasKoreaAreaMap_(periodId);
  const rows=pipeRows.filter(r=>pipelineRowInScope_(r,scopeAreaNames,koreaAreaMap));
  const hppRowsRaw=[];
  try{readSourceObjects_('KOMPAS_04').forEach(r=>{if(sourceMonthMatches_(r,periodId))hppRowsRaw.push(r);});}catch(err){dataQuality.push('KOMPAS_04: '+err.message);}
  const hppRows=hppRowsRaw.filter(r=>hppRowInScopeAndProduct_(r,scopeAreaNames,p,koreaAreaMap));
  const summary={hot_rp:0,incoming_rp:0,analisa_rp:0,akad_rp:0,cair_rp:0,hot_noa:0,incoming_noa:0,analisa_noa:0,akad_noa:0,cair_noa:0,total_open_rp:0,total_open_noa:0,carry_over_rp:0,carry_over_noa:0,batal_cair_rp:0,batal_cair_noa:0,ticket_size_rp:null,has_hot_data:false,has_incoming_data:false,has_process_data:false,has_akad_data:false,has_cair_data:false,has_carry_data:false,has_batal_data:false};
  const seen={HOT:new Set(),INCOMING:new Set(),PROSES:new Set(),AKAD:new Set(),CAIR:new Set(),CARRY:new Set(),BATAL:new Set()};
  const reasonMap={carry:{},batal:{}};const productBreakdown={};
  rows.forEach((r,rowIndex)=>{
    const amount=num_(pick_(r,['PLAFOND_PIPELINE','PLAFOND','NOMINAL']));
    const stage=upper_(pick_(r,['STAGE','STATUS_STAGE']));
    const ket=upper_([pick_(r,['KET']),pick_(r,['DETAIL_KETERANGAN']),pick_(r,['STATUS']),pick_(r,['REASON'])].join(' '));
    const id=norm_(pick_(r,['ID_PENGAJUAN','NOPEN_NIP','NOPEN','NOA','ID','NOMOR_APLIKASI']))||('PIPE_'+rowIndex);
    const isBatal=/BATAL\s*CAIR|BATAL|REJECT/.test(ket),isCarry=/CARRY\s*OVER|CARRY|BERLANJUT|LANJUT/.test(ket);
    const prodRaw=upper_(pick_(r,['PRODUK','SEGMEN_PRODUK','SEGMEN PRODUK','JENIS_PRODUK']))||(r.__source==='KOMPAS_05_MTG'?'MITRAGUNA':'REGULER');
    const subKey=pipelineSubProduct_(prodRaw,r.__source);if(!productBreakdown[subKey])productBreakdown[subKey]={label:subKey,hot_rp:0,incoming_rp:0,analisa_rp:0,akad_rp:0,cair_rp:0,carry_over_rp:0,batal_cair_rp:0,hot_noa:0,incoming_noa:0,analisa_noa:0,akad_noa:0,cair_noa:0};const pb=productBreakdown[subKey];
    if(stage==='HOT'){summary.hot_rp+=amount;seen.HOT.add(id);summary.has_hot_data=true;pb.hot_rp+=amount;pb.hot_noa++;}
    else if(stage==='INCOMING'){summary.incoming_rp+=amount;seen.INCOMING.add(id);summary.has_incoming_data=true;pb.incoming_rp+=amount;pb.incoming_noa++;}
    else if(stage==='AKAD'){summary.akad_rp+=amount;seen.AKAD.add(id);summary.has_akad_data=true;pb.akad_rp+=amount;pb.akad_noa++;}
    else if(stage==='ANALISA'||stage==='PROSES'||stage==='PROCESS'){summary.analisa_rp+=amount;seen.PROSES.add(id);summary.has_process_data=true;pb.analisa_rp+=amount;pb.analisa_noa++;}
    if(isCarry&&!isBatal){summary.carry_over_rp+=amount;seen.CARRY.add(id);summary.has_carry_data=true;const rc=normalizePipelineReason_(r,'carry');reasonMap.carry[rc]=(reasonMap.carry[rc]||0)+amount;}
    if(isBatal){summary.batal_cair_rp+=amount;seen.BATAL.add(id);summary.has_batal_data=true;const rc=normalizePipelineReason_(r,'batal');reasonMap.batal[rc]=(reasonMap.batal[rc]||0)+amount;}
    if(stage!=='CAIR'&&!isBatal&&!isCarry)summary.total_open_rp+=amount;
  });
  hppRows.forEach((r,rowIndex)=>{
    const amount=num_(pick_(r,['PLAFOND_CAIR','PLAFOND','NOMINAL_CAIR','CAIR','NOMINAL']));
    const id=norm_(pick_(r,['NOPEN_NIP','NOPEN','NOA','ID_PENGAJUAN','ID','NOMOR_APLIKASI']))||('HPP_'+rowIndex);
    const prodRaw=upper_(pick_(r,['SEGMEN_PRODUK','SEGMEN PRODUK','PRODUK','JENIS_PRODUK']));
    const subKey=pipelineSubProduct_(prodRaw,'KOMPAS_04');if(!productBreakdown[subKey])productBreakdown[subKey]={label:subKey,hot_rp:0,incoming_rp:0,analisa_rp:0,akad_rp:0,cair_rp:0,carry_over_rp:0,batal_cair_rp:0,hot_noa:0,incoming_noa:0,analisa_noa:0,akad_noa:0,cair_noa:0};const pb=productBreakdown[subKey];
    summary.cair_rp+=amount;seen.CAIR.add(id);summary.has_cair_data=true;pb.cair_rp+=amount;pb.cair_noa++;
  });
  summary.hot_noa=seen.HOT.size;summary.incoming_noa=seen.INCOMING.size;summary.analisa_noa=seen.PROSES.size;summary.akad_noa=seen.AKAD.size;summary.cair_noa=seen.CAIR.size;summary.carry_over_noa=seen.CARRY.size;summary.batal_cair_noa=seen.BATAL.size;summary.total_open_noa=summary.hot_noa+summary.incoming_noa;
  summary.ticket_size_rp=summary.has_cair_data?safeDiv_(summary.cair_rp,summary.cair_noa):null;summary.incoming_to_cair_pct=safeDiv_(summary.cair_rp,summary.incoming_rp);summary.cair_share_of_hot=safeDiv_(summary.cair_rp,summary.hot_rp);summary.stuck_rp=summary.carry_over_rp+summary.batal_cair_rp;summary.stuck_share_of_hot=safeDiv_(summary.stuck_rp,summary.hot_rp);summary.carry_share_of_hot=safeDiv_(summary.carry_over_rp,summary.hot_rp);summary.batal_share_of_hot=safeDiv_(summary.batal_cair_rp,summary.hot_rp);
  summary.stuck_share_of_incoming=safeDiv_(summary.stuck_rp,summary.incoming_rp);summary.carry_share_of_incoming=safeDiv_(summary.carry_over_rp,summary.incoming_rp);summary.batal_share_of_incoming=safeDiv_(summary.batal_cair_rp,summary.incoming_rp);
  Object.keys(productBreakdown).forEach(k=>{productBreakdown[k].ticket_size_rp=productBreakdown[k].cair_noa?safeDiv_(productBreakdown[k].cair_rp,productBreakdown[k].cair_noa):null;});
  const reasonRows=obj=>{const total=Object.values(obj).reduce((a,b)=>a+b,0);return Object.keys(obj).map(k=>({reason:k,amount_rp:obj[k],share_rp:safeDiv_(obj[k],total)})).sort((a,b)=>b.amount_rp-a.amount_rp);};
  const detail=buildPipelineProductDetail_(rows,hppRows);
  return{period_id:periodId,month_key:monthKey,summary,reason:{carry:reasonRows(reasonMap.carry),batal:reasonRows(reasonMap.batal)},productBreakdown,detail,dataQuality,source:{pipeline:pipeSources,actual_cair:'KOMPAS_04'}};
}
function hppRowInScopeAndProduct_(r,scopeAreaNames,product,koreaAreaMap){const area=norm_(pick_(r,['AREA','AREA_NAME']));const korea=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA','NIK_KOREA']));const mappedArea=!area&&korea&&koreaAreaMap?koreaAreaMap[korea]:'';const effectiveArea=area||mappedArea;if(effectiveArea&&scopeAreaNames&&scopeAreaNames.size&&!scopeAreaNames.has(upper_(effectiveArea)))return false;const p=upper_(product||'ALL');if(p==='ALL')return true;const seg=upper_(pick_(r,['SEGMEN_PRODUK','SEGMEN PRODUK','PRODUK','JENIS_PRODUK']));const isMtg=/MITRAGUNA|(^|[^A-Z])MTG([^A-Z]|$)|IMPLAN/.test(seg);return p==='MITRAGUNA'?isMtg:!isMtg;}
function pipelineSubProduct_(prodRaw,source){const t=upper_(prodRaw||'');if(/MITRAGUNA|MTG|IMPLAN/.test(t))return'MITRAGUNA';if(/PRA|PRAPEN|PRAPENSIUN/.test(t))return'PRA PENSIUN';if(/PENSIUN|PENSIUNAN/.test(t))return'PENSIUN';return source==='KOMPAS_05_MTG'?'MITRAGUNA':'REGULER';}

function pipelineRowInScope_(r,scopeAreaNames,koreaAreaMap){const area=norm_(pick_(r,['AREA','AREA_NAME']));const korea=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA','NIK_KOREA']));const mappedArea=!area&&korea&&koreaAreaMap?koreaAreaMap[korea]:'';const effectiveArea=area||mappedArea;return !scopeAreaNames||!scopeAreaNames.size||!effectiveArea||scopeAreaNames.has(upper_(effectiveArea));}
function getKompasKoreaAreaMap_(periodId){const key=cacheKey_('KOREA_AREA_MAP',periodId),cached=cacheGetJson_(key);if(cached)return cached;const out={};try{readSourceObjects_('KOMPAS_01').forEach(r=>{if(!sourceMonthMatches_(r,periodId))return;const k=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA','NIK_KOREA'])),a=norm_(pick_(r,['AREA','AREA_NAME']));if(k&&a)out[k]=a;});}catch(err){}cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);return out;}
function normalizePipelineReason_(r,type){const t=upper_([pick_(r,['DETAIL_KETERANGAN']),pick_(r,['KET']),pick_(r,['ALASAN']),pick_(r,['REASON'])].join(' '));if(type==='carry'){if(/COLLECT\s*DOKUMEN/.test(t))return'Collect Dokumen';if(/FEEDBACK/.test(t))return'Feedback Nasabah';if(/JADWAL.*TO/.test(t))return'Jadwal TO';if(/ANTRIAN.*PROSES|PROSES/.test(t))return'Antrian Proses';return clean_([pick_(r,['DETAIL_KETERANGAN']),pick_(r,['KET'])].filter(Boolean).join(' — '),120)||'Lainnya';}if(/PLAFOND.*CUKUP|PLAFON.*CUKUP/.test(t))return'Plafond Tidak Cukup';if(/BI\s*CHECK|KOL/.test(t))return'BI Checking / KOL';if(/ELIGIB|KELAYAKAN/.test(t))return'Nasabah Eligibility';if(/KELUARGA/.test(t))return'Persetujuan Keluarga';if(/TAKE\s*OVER|TO\b/.test(t))return'Kendala Take Over';if(/NON\s*MARKET/.test(t))return'Non Market';if(/STOP.*GO/.test(t))return'Cabang Stop n Go';if(/ASURANSI|MCU/.test(t))return'Asuransi / MCU';if(/DOKUMEN|ADMIN/.test(t))return'Administratif';return clean_([pick_(r,['DETAIL_KETERANGAN']),pick_(r,['KET'])].filter(Boolean).join(' — '),120)||'Lainnya';}
function buildPipelineProductDetail_(rows,hppRows){
  const map={};const ensure=sub=>{if(!map[sub])map[sub]={label:sub,hot_rp:0,incoming_rp:0,analisa_rp:0,akad_rp:0,cair_rp:0,carry_over_rp:0,batal_cair_rp:0,hot_noa:0,incoming_noa:0,analisa_noa:0,akad_noa:0,cair_noa:0};return map[sub];};
  (rows||[]).forEach(r=>{const prodRaw=upper_(pick_(r,['PRODUK','SEGMEN_PRODUK','SEGMEN PRODUK','JENIS_PRODUK']))||(r.__source==='KOMPAS_05_MTG'?'MITRAGUNA':'REGULER'),sub=pipelineSubProduct_(prodRaw,r.__source),x=ensure(sub),amount=num_(pick_(r,['PLAFOND_PIPELINE','PLAFOND','NOMINAL'])),stage=upper_(pick_(r,['STAGE','STATUS_STAGE'])),ket=upper_([pick_(r,['KET']),pick_(r,['DETAIL_KETERANGAN']),pick_(r,['STATUS'])].join(' '));if(stage==='HOT'){x.hot_rp+=amount;x.hot_noa++;}if(stage==='INCOMING'){x.incoming_rp+=amount;x.incoming_noa++;}if(stage==='PROSES'||stage==='PROCESS'||stage==='ANALISA'){x.analisa_rp+=amount;x.analisa_noa++;}if(stage==='AKAD'){x.akad_rp+=amount;x.akad_noa++;}if(/CARRY\s*OVER|CARRY|BERLANJUT|LANJUT/.test(ket)&&!/BATAL\s*CAIR|BATAL|REJECT/.test(ket))x.carry_over_rp+=amount;if(/BATAL\s*CAIR|BATAL|REJECT/.test(ket))x.batal_cair_rp+=amount;});
  (hppRows||[]).forEach(r=>{const prodRaw=upper_(pick_(r,['SEGMEN_PRODUK','SEGMEN PRODUK','PRODUK','JENIS_PRODUK'])),sub=pipelineSubProduct_(prodRaw,'KOMPAS_04'),x=ensure(sub),amount=num_(pick_(r,['PLAFOND_CAIR','PLAFOND','NOMINAL_CAIR','CAIR','NOMINAL']));x.cair_rp+=amount;x.cair_noa++;});
  return Object.values(map).sort((a,b)=>b.hot_rp-b.hot_rp||b.incoming_rp-a.incoming_rp);
}


/** =========================
 *  2C) HASIL ACTION PLAN RH — V4.7
 *  =========================
 *
 * Prinsip:
 * - Action Plan = komitmen RH; hasil aktual = data Overview/Kompas.
 * - Plan aktif = SUBMITTED terbaru per RH + partner. Jika belum ada, DRAFT terbaru hanya ditampilkan sebagai draft.
 * - Mapping program memakai rule-based keyword agar auditable dan scalable.
 * - Current-month Cair hanya dianggap tersedia jika HPP_ACHIEV tersedia. Tidak pernah mengubah no-data menjadi Rp0.
 * - Action Plan RH selalu dibaca pada scope RH. Jika user sedang memilih Area, Area tidak mempersempit evaluasi plan RH.
 */

function getActionPlanImpactBundle(payload){
  const req=normalizeFilters_(payload||{});
  const key=cacheKey_('ACTION_IMPACT_V50',req.partner,req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const cached=cacheGetJson_(key); if(cached)return cached;
  const out=buildActionPlanImpactBundle_(req,null);
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);
  return out;
}

function buildActionPlanImpactBundle_(req,preloadedBusinessReview){
  const source=getActionPlanSourceBundle_();
  let rhUserKey=norm_(req.rhUserKey);
  if(!rhUserKey&&req.areaId){
    const candidates=(req.partner==='MANTAP'?getMantapScopeRows_(req.periodId):getRoRhScopeCached_()).filter(r=>r.area_id===req.areaId&&r.rh_user_key).map(r=>r.rh_user_key);
    const uniq=Array.from(new Set(candidates)); if(uniq.length===1)rhUserKey=uniq[0];
  }
  if(!rhUserKey){
    return buildActionPlanList_(req,source);
  }

  const rhProfile=getOverviewRhProfile_(rhUserKey,req);
  const identity=resolveActionPlanIdentity_(rhUserKey,rhProfile.rhName,source);
  if(!identity.actionUserKey){
    return {mode:'DETAIL',filters:req,profile:rhProfile,plan:null,priorities:[],review:null,movement:null,matrix:null,
      managementInsight:'Action Plan belum ditemukan untuk Region Head ini.',dataQuality:['Mapping Action Plan belum tersedia untuk '+(rhProfile.rhName||rhUserKey)],generatedAt:formatDateTime_(new Date())};
  }

  const partnerKey=req.partner==='MANTAP'?'MANTAP':'BSI';
  const plan=selectActiveActionPlan_(source.plans,identity.actionUserKey,partnerKey);
  if(!plan){
    return {mode:'DETAIL',filters:req,profile:Object.assign({},rhProfile,{actionUserKey:identity.actionUserKey}),plan:null,priorities:[],review:null,movement:null,matrix:null,
      managementInsight:'Action Plan '+(req.partner==='MANTAP'?'Mantap':'BSI')+' belum tersedia untuk Region Head ini.',dataQuality:[],generatedAt:formatDateTime_(new Date())};
  }

  const planView=normalizeActionPlan_(plan);
  const review=selectActionReview_(source.reviews,planView,identity.actionUserKey,partnerKey);
  const rhReq=Object.assign({},req,{rhUserKey,areaId:''});
  const baselinePeriod=nextPeriodId_(req.periodId,-1),currentPeriod=req.periodId;
  const business=preloadedBusinessReview||getBusinessReviewBundle(rhReq);
  const baselineCapacity=getActionCapacitySnapshot_(baselinePeriod,rhReq);
  const currentCapacity=getActionCapacitySnapshot_(currentPeriod,rhReq);
  const movement=buildActionMovement_(baselinePeriod,currentPeriod,business,baselineCapacity,currentCapacity,rhReq);
  const priorityReviewMap=parsePriorityReviewMap_(review);
  const priorities=(planView.priorities||[]).filter(p=>actionPriorityHasContent_(p)).map((p,i)=>buildActionPriorityImpact_(p,i,movement,planView,priorityReviewMap[i]||priorityReviewMap[norm_(p.title)]||null));
  const matrix=buildActionGrowthMatrix_(movement);
  const result={
    mode:'DETAIL',filters:req,
    profile:Object.assign({},rhProfile,{actionUserKey:identity.actionUserKey,mappingMethod:identity.method,partnerKey:planView.partnerKey,partnerName:planView.partnerName}),
    plan:planView,review,movement,matrix,priorities,
    managementInsight:buildActionManagementInsight_(movement,planView),
    sourceNote:req.partner==='MANTAP'?'Action Plan: RH Command Center · Actual: Database Bank Mantap. Pencairan hanya dari MASTER_ACHIEV setelah tersedia.':'Action Plan: RH Command Center · Actual: Overview RH / Kompas. Pencairan current month hanya dari HPP_ACHIEV.',
    dataQuality:buildActionDataQuality_(movement,planView,identity),generatedAt:formatDateTime_(new Date())
  };
  return result;
}

function buildActionPlanList_(req,source){
  let scope=req.partner==='MANTAP'?getMantapScopeRows_(req.periodId):getRoRhScopeCached_();
  scope=applyAccessToScopeRows_(scope,req);
  if(req.roSource)scope=scope.filter(r=>upper_(r.filter_ro)===upper_(req.roSource));
  if(req.areaId)scope=scope.filter(r=>r.area_id===req.areaId);
  const rhMap={};
  scope.forEach(r=>{if(r.rh_user_key&&!rhMap[r.rh_user_key])rhMap[r.rh_user_key]={rhUserKey:r.rh_user_key,rhName:r.rh_name||r.rh_user_key,roName:r.filter_ro||r.source_ro||'',areas:[]};if(r.rh_user_key&&r.area_name&&!rhMap[r.rh_user_key].areas.includes(r.area_name))rhMap[r.rh_user_key].areas.push(r.area_name);});
  if(!Object.keys(rhMap).length){
    const allowed=req.accessRole==='REGIONAL'?getAllowedRhKeysForAccess_(req.accessScopeCode):null;
    getRhOptionsCached_().forEach(r=>{if(!allowed||allowed.has(r.value))rhMap[r.value]={rhUserKey:r.value,rhName:r.label,roName:'',areas:[]};});
  }
  const plans=[];
  Object.values(rhMap).forEach(rh=>{
    const id=resolveActionPlanIdentity_(rh.rhUserKey,rh.rhName,source); if(!id.actionUserKey)return;
    const p=selectActiveActionPlan_(source.plans,id.actionUserKey,req.partner==='MANTAP'?'MANTAP':'BSI'); if(!p)return;
    const v=normalizeActionPlan_(p),cycle=actionPlanCycle_(v);
    plans.push({rhUserKey:rh.rhUserKey,rhName:rh.rhName,roName:rh.roName,areas:rh.areas,planStatus:v.status,submittedAt:v.submittedAt||v.createdAt,reviewPoint:cycle.reviewPoint,reviewLabel:cycle.reviewLabel,priorityCount:(v.priorities||[]).filter(actionPriorityHasContent_).length,committed:v.committed,partnerName:v.partnerName});
  });
  plans.sort((a,b)=>a.rhName.localeCompare(b.rhName));
  return {mode:'LIST',filters:req,plans,managementInsight:plans.length?plans.length+' Region Head memiliki Action Plan pada cakupan ini.':'Belum ada Action Plan RH pada cakupan ini.',generatedAt:formatDateTime_(new Date())};
}

function getActionPlanSourceBundle_(){
  const key=cacheKey_('ACTION_PLAN_SOURCE_V47'); const cached=cacheGetJson_(key); if(cached)return cached;
  const out={users:readActionSourceObjects_('RH_ACTION_USERS','RH_ASSESS_USERS'),plans:readActionSourceObjects_('RH_ACTION_PLAN','RH_ASSESS_ACTION_PLAN_PARTNER'),reviews:readActionSourceObjects_('RH_ACTION_REVIEW','RH_ASSESS_ACTION_REVIEW_PARTNER')};
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL); return out;
}

function readActionSourceObjects_(sourceKey,sheetName){
  try{return readSourceObjects_(sourceKey);}catch(err){
    const ss=SpreadsheetApp.openById(ACTION_PLAN_SOURCE_SS_ID),sh=ss.getSheetByName(sheetName); if(!sh)throw err; return sheetToObjects_(sh);
  }
}

function getOverviewRhProfile_(rhUserKey,req){
  const user=readObjectsIfExists_(APP.SHEETS.USER_ACCESS).find(r=>norm_(r.user_key)===rhUserKey)||{};
  let scope=(req.partner==='MANTAP'?getMantapScopeRows_(req.periodId):getRoRhScopeCached_()).filter(r=>r.rh_user_key===rhUserKey); if(req.roSource)scope=scope.filter(r=>upper_(r.filter_ro)===upper_(req.roSource));
  const areas=Array.from(new Set(scope.map(r=>r.area_name).filter(Boolean))); const ros=Array.from(new Set(scope.map(r=>r.filter_ro||r.source_ro).filter(Boolean)));
  return {rhUserKey,rhId:norm_(user.rh_id),rhName:norm_(user.display_name)||norm_(scope[0]&&scope[0].rh_name)||rhUserKey,roName:ros.join(' · '),areas};
}

function resolveActionPlanIdentity_(rhUserKey,rhName,source){
  const map=readObjectsIfExists_(APP.SHEETS.ACTION_MAP).find(r=>norm_(r.overview_rh_user_key)===rhUserKey&&upper_(r.active||'Y')!=='N');
  if(map&&norm_(map.action_user_key))return{actionUserKey:norm_(map.action_user_key),method:'EXPLICIT_MAP'};
  const nameKey=actionNameKey_(rhName); const user=(source.users||[]).find(r=>actionNameKey_(pick_(r,['DISPLAY_NAME','LOGIN_NAME']))===nameKey&&upper_(pick_(r,['ACTIVE']))!=='FALSE');
  return user?{actionUserKey:norm_(pick_(user,['USER_KEY'])),method:'EXACT_NAME'}:{actionUserKey:'',method:'NOT_MAPPED'};
}
function actionNameKey_(v){return upper_(v).replace(/[^A-Z0-9]/g,'');}

function selectActiveActionPlan_(rows,actionUserKey,partnerKey){
  const x=(rows||[]).filter(r=>norm_(pick_(r,['USER_KEY']))===actionUserKey&&upper_(pick_(r,['PARTNER_KEY']))===upper_(partnerKey||'BSI'));
  if(!x.length)return null;
  const submitted=x.filter(r=>upper_(pick_(r,['STATUS']))==='SUBMITTED');
  const pool=submitted.length?submitted:x;
  return pool.slice().sort((a,b)=>actionRowTime_(b)-actionRowTime_(a))[0]||null;
}
function actionRowTime_(r){const d=parseActionDate_(pick_(r,['SUBMITTED_AT','UPDATED_AT','CREATED_AT']));return d?d.getTime():0;}

function normalizeActionPlan_(r){
  const priorities=parseJsonSafe_(pick_(r,['PRIORITIES_JSON']),[]); const swot=parseJsonSafe_(pick_(r,['SWOT_JSON']),{}); const status=upper_(pick_(r,['STATUS']))||'DRAFT';
  const base={planId:norm_(pick_(r,['PLAN_ID'])),actionUserKey:norm_(pick_(r,['USER_KEY'])),partnerKey:norm_(pick_(r,['PARTNER_KEY']))||'BSI',partnerName:norm_(pick_(r,['PARTNER_NAME']))||'Mitra BSI',status,committed:status==='SUBMITTED',createdAt:actionDateText_(pick_(r,['CREATED_AT'])),updatedAt:actionDateText_(pick_(r,['UPDATED_AT'])),submittedAt:actionDateText_(pick_(r,['SUBMITTED_AT'])),businessToProtect:norm_(pick_(r,['BUSINESS_TO_PROTECT'])),businessToGrow:norm_(pick_(r,['BUSINESS_TO_GROW'])),whyPriorities:norm_(pick_(r,['WHY_PRIORITIES'])),commitment:norm_(pick_(r,['COMMITMENT'])),priorities:Array.isArray(priorities)?priorities:[],swot};
  const cycle=actionPlanCycle_(base); return Object.assign(base,cycle);
}

function selectActionReview_(rows,plan,actionUserKey,partnerKey){
  const x=(rows||[]).filter(r=>norm_(pick_(r,['PLAN_ID']))===plan.planId&&norm_(pick_(r,['USER_KEY']))===actionUserKey&&upper_(pick_(r,['PARTNER_KEY']))===upper_(partnerKey||'BSI'));
  if(!x.length)return null;
  const phase=upper_(plan.reviewPoint||''); let pool=x.filter(r=>upper_(pick_(r,['PHASE']))===phase); if(!pool.length)pool=x;
  const r=pool.slice().sort((a,b)=>actionRowTime_(b)-actionRowTime_(a))[0];
  return {reviewId:norm_(pick_(r,['REVIEW_ID'])),phase:norm_(pick_(r,['PHASE'])),status:norm_(pick_(r,['STATUS'])),overallProgress:pick_(r,['OVERALL_PROGRESS']),businessResult:norm_(pick_(r,['BUSINESS_RESULT'])),whatWorked:norm_(pick_(r,['WHAT_WORKED'])),blocker:norm_(pick_(r,['BLOCKER'])),adjustment:norm_(pick_(r,['ADJUSTMENT'])),nextAction:norm_(pick_(r,['NEXT_ACTION'])),evidence:norm_(pick_(r,['EVIDENCE'])),priorityProgress:parseJsonSafe_(pick_(r,['PRIORITY_PROGRESS_JSON']),[]),submittedAt:actionDateText_(pick_(r,['SUBMITTED_AT']))};
}

function parsePriorityReviewMap_(review){
  const out={}; if(!review||!Array.isArray(review.priorityProgress))return out;
  review.priorityProgress.forEach((r,i)=>{out[i]=r;const t=norm_(r&&[r.title,r.programName,r.program_name,r.priority_title].find(Boolean));if(t)out[t]=r;}); return out;
}

function parseJsonSafe_(v,fallback){try{if(v==null||v==='')return fallback;return typeof v==='string'?JSON.parse(v):v;}catch(err){return fallback;}}
function parseActionDate_(v){if(v instanceof Date&&!isNaN(v.getTime()))return v;const s=norm_(v);if(!s)return null;let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0));const d=new Date(s);return isNaN(d.getTime())?null:d;}
function actionDateText_(v){const d=parseActionDate_(v);return d?Utilities.formatDate(d,getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','dd/MM/yyyy'):norm_(v);}
function addDays_(d,n){const x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function actionPlanCycle_(plan){
  const start=parseActionDate_(plan.submittedAt)||parseActionDate_(plan.createdAt)||new Date(); const now=new Date(); const elapsed=Math.max(0,Math.floor((now-start)/86400000));
  const checkpoints=[{d:30,k:'D30'},{d:60,k:'D60'},{d:90,k:'D90'}]; checkpoints.sort((a,b)=>Math.abs(a.d-elapsed)-Math.abs(b.d-elapsed)); const reviewPoint=checkpoints[0].k;
  return {cycleStart:Utilities.formatDate(start,getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','dd MMM yyyy'),cycleEnd:Utilities.formatDate(addDays_(start,90),getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','dd MMM yyyy'),reviewPoint,reviewLabel:reviewPoint+' · '+periodLabel_(monthKeyFromDate_(now))};
}
function monthKeyFromDate_(d){return Utilities.formatDate(d,getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','yyyy-MM');}

function getActionCapacitySnapshot_(periodId,req){
  if(req.partner==='MANTAP') return getMantapActionCapacitySnapshot_(periodId,req);
  const key=cacheKey_('ACTION_CAPACITY_V48',periodId,req.product,req.rhUserKey);const cached=cacheGetJson_(key);if(cached)return cached;
  const areas=getScopeAreaNames_(Object.assign({},req,{areaId:''})); const product=upper_(req.product||'ALL'); let source=[];const quality=[];
  try{source=readSourceObjects_('KOMPAS_02').filter(r=>sourceMonthMatches_(r,periodId));}catch(err){quality.push(err.message);}
  const sf=new Set(),productiveSf=new Set(),branches=new Set(),productiveBranches=new Set();let matched=0;
  source.forEach(r=>{
    const area=norm_(pick_(r,['AREA','AREA_NAME']));if(area&&!areas.has(upper_(area)))return;
    const st=upper_(pick_(r,['STATUS_SYNC','STATUS_SF','STATUS']));if(st&&!/AKTIF|ACTIVE/.test(st))return;
    const jenis=upper_(pick_(r,['JENIS_SF','TYPE_SF','KATEGORI_SF']));const isMtg=/MITRAGUNA|MTG|IMPLAN/.test(jenis);if(product==='REGULER'&&isMtg)return;if(product==='MITRAGUNA'&&!isMtg)return;
    const id=norm_(pick_(r,['NIP_SF_KEY','NIP_SF','NIK_SF']));if(!id)return;matched++;sf.add(id);
    const br=norm_(pick_(r,['ID_BRANCH','BRANCH_ID','BRANCH']));if(br)branches.add(br);
    const cairReg=num_(pick_(r,['CAIR_REGULER'])),cairMtg=num_(pick_(r,['CAIR_MITRAGUNA']));const cair=product==='REGULER'?cairReg:(product==='MITRAGUNA'?cairMtg:cairReg+cairMtg);
    if(cair>0){productiveSf.add(id);if(br)productiveBranches.add(br);}
  });
  let out={periodId,hasData:matched>0,sfActive:matched?sf.size:null,sfProductiveIndicator:matched?productiveSf.size:null,branchCovered:matched?branches.size:null,branchProductiveIndicator:matched?productiveBranches.size:null,source:'KOMPAS_02 / MASTER_SF',dataQuality:quality};out=applyAdminCapacityOverrides_(out,req,periodId);cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);return out;
}

function buildActionMovement_(baselinePeriod,currentPeriod,business,baseCap,currentCap,req){
  const closed=business&&business.pipeline&&business.pipeline.closed&&business.pipeline.closed.summary||{}; const current=business&&business.pipeline&&business.pipeline.current&&business.pipeline.current.summary||{}; const perf=business&&business.performance&&business.performance.latest||{};
  const baselineCair=perf.hasData!==false?numOrNull_(perf.actual_rp):null; const currentCair=current.has_cair_data?num_(current.cair_rp):null;
  const closedFinal=applyAdminPipelineSummaryOverrides_(closed,req||{},baselinePeriod),currentFinal=applyAdminPipelineSummaryOverrides_(current,req||{},currentPeriod);
  const baselinePipeline=numOrNull_(closedFinal.total_open_rp),currentPipeline=numOrNull_(currentFinal.total_open_rp);
  const baseSf=baseCap&&baseCap.hasData?baseCap.sfActive:null,curSf=currentCap&&currentCap.hasData?currentCap.sfActive:null;
  const baselineProd=(baselineCair!=null&&baseSf)?baselineCair/baseSf:null,currentProd=(currentCair!=null&&curSf)?currentCair/curSf:null;
  return {
    baselinePeriod,currentPeriod,baselineLabel:periodLabel_(baselinePeriod),currentLabel:periodLabel_(currentPeriod),
    business:{baselineCairRp:baselineCair,currentCairRp:currentCair,hasCurrentCair:currentCair!=null,businessGrowthPct:actionGrowth_(currentCair,baselineCair),baselinePipelineRp:baselinePipeline,currentPipelineRp:currentPipeline,pipelineGrowthPct:actionGrowth_(currentPipeline,baselinePipeline),baselineProductivityRp:baselineProd,currentProductivityRp:currentProd,productivityGrowthPct:actionGrowth_(currentProd,baselineProd),hotRp:current.has_hot_data?num_(currentFinal.hot_rp):null,incomingRp:current.has_incoming_data?num_(currentFinal.incoming_rp):null,processRp:current.has_process_data?num_(currentFinal.analisa_rp):null,akadRp:current.has_akad_data?num_(currentFinal.akad_rp):null,carryOverRp:current.has_carry_data?num_(currentFinal.carry_over_rp):null,batalCairRp:current.has_batal_data?num_(currentFinal.batal_cair_rp):null},
    team:{baselineSf:baseSf,currentSf:curSf,sfDelta:actionDelta_(curSf,baseSf),sfGrowthPct:actionGrowth_(curSf,baseSf),baselineProductiveSf:baseCap.sfProductiveIndicator,currentProductiveSf:currentCap.sfProductiveIndicator,productiveSfDelta:actionDelta_(currentCap.sfProductiveIndicator,baseCap.sfProductiveIndicator),baselineCoveredBranches:baseCap.branchCovered,currentCoveredBranches:currentCap.branchCovered,coveredBranchDelta:actionDelta_(currentCap.branchCovered,baseCap.branchCovered),baselineProductiveBranches:baseCap.branchProductiveIndicator,currentProductiveBranches:currentCap.branchProductiveIndicator,productiveBranchDelta:actionDelta_(currentCap.branchProductiveIndicator,baseCap.branchProductiveIndicator)},
    dataQuality:[].concat(baseCap.dataQuality||[],currentCap.dataQuality||[],business&&business.pipeline&&business.pipeline.dataQuality||[])
  };
}
function actionDelta_(c,b){return c==null||b==null?null:num_(c)-num_(b);}
function actionGrowth_(c,b){if(c==null||b==null||num_(b)===0)return null;return(num_(c)-num_(b))/Math.abs(num_(b));}

function actionPriorityHasContent_(p){if(!p)return false;return !!norm_([p.title,p.programName,p.objective,p.targetOutcome,p.day1_30].filter(Boolean).join(' ')).replace(/—/g,'');}
function actionPriorityCategory_(p){
  const t=upper_([p.title,p.programName,p.objective,p.targetOutcome,p.successMeasure,p.keyActions].filter(Boolean).join(' '));
  if(/PIPELINE|KONTROL|CONTROL|MONITOR|HALO|CONVERSION|AKAD|CAIR/.test(t))return'PIPELINE';
  if(/PRODUKTIV|PERFORMANCE|ACHIEV|PENCAPAIAN|KOREA PRODUCTIVITY/.test(t))return'PERFORMANCE';
  if(/ASABRI|MITRAGUNA|PRODUK|PENSIUN/.test(t))return'PRODUCT';
  if(/PEMENUHAN|REKRUT|RECRUIT|MANPOWER|SDM|SALES FORCE|\bSF\b|COVERAGE/.test(t))return'MANPOWER';
  if(/KOMUNIKASI|SAPA|MITRA|RELATION|AREA MANAGER|ENGAGEMENT|KOLABORASI/.test(t))return'RELATIONSHIP';
  return'GENERAL';
}

function buildActionPriorityImpact_(p,index,movement,plan,reviewPart){
  const category=actionPriorityCategory_(p),title=norm_(p.programName)||norm_(p.title)||('Prioritas '+(index+1)); const review=reviewPart||{};
  const generated=actionPriorityGenerated_(category,movement,p);
  const d30=norm_(p.day1_30),d60=norm_(p.day31_60),d90=norm_(p.day61_90),keyActions=norm_(p.keyActions);
  const howTo=keyActions||[d30,d60,d90].filter(Boolean).join(' → ')||'Cara menjalankan belum dirinci.';
  return {index:index+1,title,category,whyPriority:norm_(p.whyPriority),targetOutcome:norm_(p.targetOutcome),successMeasure:norm_(p.successMeasure),baseline:norm_(p.baseline),evidence:norm_(p.evidence),day30:d30,day60:d60,day90:d90,keyActions,howTo,before:norm_(p.baseline)||norm_(p.evidence)||'Kondisi awal belum dirinci.',movement:generated.movement,result:generated.result,status:actionPriorityStatus_(category,movement,plan,review),review:{whatWorked:norm_(review.whatWorked||review.what_worked),blocker:norm_(review.blocker),adjustment:norm_(review.adjustment),nextAction:norm_(review.nextAction||review.next_action),evidence:norm_(review.evidence),status:norm_(review.status)}};
}


function actionPriorityGenerated_(category,m,p){
  const t=m.team,b=m.business; let movement='',result='';
  if(category==='MANPOWER')movement='SF aktif '+actionArrow_(t.baselineSf,t.currentSf)+'; cabang ter-cover '+actionArrow_(t.baselineCoveredBranches,t.currentCoveredBranches)+'; SF produktif '+actionArrow_(t.baselineProductiveSf,t.currentProductiveSf)+'.';
  else if(category==='PIPELINE')movement='Pipeline aktif '+actionMoneyArrow_(b.baselinePipelineRp,b.currentPipelineRp)+'. Current: HOT '+actionMoneyMaybe_(b.hotRp)+' · Incoming '+actionMoneyMaybe_(b.incomingRp)+' · Akad '+actionMoneyMaybe_(b.akadRp)+'.';
  else if(category==='PERFORMANCE')movement='SF produktif '+actionArrow_(t.baselineProductiveSf,t.currentProductiveSf)+'; pipeline '+actionMoneyArrow_(b.baselinePipelineRp,b.currentPipelineRp)+'.';
  else if(category==='PRODUCT')movement='Pipeline current '+actionMoneyMaybe_(b.currentPipelineRp)+'. Hasil produk spesifik mengikuti evidence produk dan review RH; sistem tidak mengalokasikan pencairan produk dengan asumsi.';
  else if(category==='RELATIONSHIP')movement='Kualitas hubungan tidak dinilai hanya dari angka. Gunakan bukti kunjungan, issue yang selesai, dan opportunity yang terbuka pada Evaluasi RH.';
  else movement='Perkembangan dibaca dari data sistem dan evidence RH pada review berjalan.';
  result=b.hasCurrentCair?'Pencairan '+actionMoneyArrow_(b.baselineCairRp,b.currentCairRp)+(b.businessGrowthPct!=null?' · growth '+pctTextSigned_(b.businessGrowthPct):'')+'.':'Pencairan '+m.currentLabel+' belum tersedia di HPP_ACHIEV; hasil bisnis belum dinilai sebagai Rp0.';
  return {movement,result};
}
function actionPriorityStatus_(category,m,plan,review){
  if(!plan.committed)return'DRAFT'; const rs=upper_(review&&review.status); if(rs&&/TARGET|ACHIEV|SELESAI|DONE/.test(rs))return'TARGET TERCAPAI';
  if(review&&Object.keys(review).some(k=>norm_(review[k])))return'HASIL MULAI TERLIHAT';
  if(category==='MANPOWER'){if(m.team.sfDelta!=null&&m.team.sfDelta>0)return m.business.businessGrowthPct!=null&&m.business.businessGrowthPct>0?'HASIL MULAI TERLIHAT':'MULAI BERJALAN';if(m.team.sfDelta!=null&&m.team.sfDelta<0)return'PERLU PERHATIAN';return'MENUNGGU HASIL';}
  if(category==='PIPELINE'){if(m.business.pipelineGrowthPct!=null&&m.business.pipelineGrowthPct>0)return m.business.hasCurrentCair&&m.business.businessGrowthPct>0?'HASIL MULAI TERLIHAT':'MULAI BERJALAN';if(m.business.pipelineGrowthPct!=null&&m.business.pipelineGrowthPct<0)return'PERLU PERHATIAN';return'MENUNGGU HASIL';}
  if(category==='PERFORMANCE')return m.business.hasCurrentCair?(m.business.businessGrowthPct>0?'HASIL MULAI TERLIHAT':'PERLU PERHATIAN'):'MENUNGGU HASIL';
  if(category==='PRODUCT'||category==='RELATIONSHIP')return'MENUNGGU BUKTI'; return'MULAI BERJALAN';
}

function buildActionGrowthMatrix_(m){
  const x=m.team.sfGrowthPct,y=m.business.businessGrowthPct;if(y==null)return{label:'Menunggu Pencairan Aktual',manpowerGrowthPct:x,businessGrowthPct:null,hasBusinessData:false};
  let label='Perlu Penguatan Tim & Bisnis';if(x>0&&y>0)label='Tim Bertambah, Bisnis Tumbuh';else if(x>0&&y<=0)label='Tim Bertambah, Hasil Belum Terlihat';else if(x<=0&&y>0)label='Produktivitas Tim Meningkat';return{label,manpowerGrowthPct:x,businessGrowthPct:y,hasBusinessData:true};
}

function buildActionManagementInsight_(m,plan){
  if(!plan.committed)return'Action Plan masih berstatus DRAFT; data aktual ditampilkan sebagai konteks, bukan sebagai penilaian atas komitmen final.';
  const sf=m.team.sfDelta,pg=m.business.pipelineGrowthPct,bg=m.business.businessGrowthPct;
  if(bg==null){let x='Pencairan '+m.currentLabel+' belum tersedia di HPP_ACHIEV. ';if(sf!=null)x+='SF aktif '+(sf>0?'bertambah '+sf:(sf<0?'berkurang '+Math.abs(sf):'belum berubah'))+'. ';if(pg!=null)x+='Pipeline aktif '+(pg>=0?'naik ':'turun ')+pctText_(Math.abs(pg))+'. ';return x+'Pertumbuhan bisnis belum disimpulkan sampai pencairan aktual tersedia.';}
  if(sf>0&&bg>0)return'Tim bertambah dan pencairan ikut tumbuh. Selanjutnya cek apakah pertumbuhan juga terlihat pada SF/cabang yang menjadi sasaran Action Plan.';
  if(sf>0&&bg<=0)return'Tim bertambah, tetapi pencairan belum mengikuti. Fokus review bergeser dari pemenuhan tim ke aktivasi, produktivitas, dan proses menuju pencairan.';
  if(sf<=0&&bg>0)return'Pencairan tumbuh tanpa penambahan SF; pertumbuhan saat ini lebih banyak ditopang produktivitas tim yang sudah ada.';
  return'Kapasitas tim dan hasil bisnis belum menunjukkan perbaikan yang searah; prioritas dan blocker perlu direview kembali.';
}
function buildActionDataQuality_(m,plan,identity){const q=[].concat(m&&m.dataQuality||[]);if(identity.method==='EXACT_NAME')q.push('Mapping Action Plan menggunakan exact-name fallback; isi 05_ACTION_PLAN_USER_MAP jika nama berbeda.');if(!m.business.hasCurrentCair)q.push(plan&&upper_(plan.partnerKey)==='MANTAP'?'Actual Cair Mantap current month belum tersedia di MASTER_ACHIEV; ditampilkan sebagai —.':'Actual Cair current month belum tersedia di HPP_ACHIEV; ditampilkan sebagai —.');if(!plan.committed)q.push('Action Plan masih DRAFT dan tidak diperlakukan sebagai komitmen final.');return Array.from(new Set(q.filter(Boolean)));}
function actionArrow_(a,b){return a==null||b==null?'—':fmtInt_(a)+' → '+fmtInt_(b);}
function actionMoneyArrow_(a,b){return a==null||b==null?'—':moneyText_(a)+' → '+moneyText_(b);}
function actionMoneyMaybe_(v){return v==null?'—':moneyText_(v);}
function fmtInt_(v){return Math.round(num_(v)).toLocaleString('id-ID');}
function pctTextSigned_(v){if(v==null)return'—';return(v>=0?'+':'')+pctText_(v);}


/** =========================
 *  3) POTENSI YANG BELUM TERGARAP
 *  ========================= */

function getPotentialBundle(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapPotentialBundle_(req);
  const key = cacheKey_('POT_V50', req.periodId, req.product, req.roSource, req.rhUserKey, req.areaId, req.accessScopeCode||'ALL');
  const cached = cacheGetJson_(key);
  if (cached) return cached;

  const scopeAreaNames = getScopeAreaNames_(req);
  const areaPerf = filterScopeRows_(getAreaRowsCached_(req.periodId, 'ALL'), req);
  const perfMap = {}; areaPerf.forEach(r => perfMap[upper_(r.area_name)] = r);

  // Detail Area/Branch saat ini tersedia untuk potensi Reguler (SLA + Prapen Prioritas).
  const sourceRows = readObjects_(APP.SHEETS.POT_AREA).filter(r => scopeAreaNames.has(upper_(r.area_name)));
  const areas = sourceRows.map(r => {
    const p = perfMap[upper_(r.area_name)] || {};
    return {
      area_name:norm_(r.area_name), ro_source:norm_(r.ro_source),
      reguler_open_noa:num_(r.potensi_reguler_noa || r.total_open_noa),
      reguler_open_rp:num_(r.potensi_reguler_rp || r.total_open_rp),
      sla_open_noa:num_(r.sla_open_noa), sla_open_rp:num_(r.sla_open_rp),
      prap_open_noa:num_(r.prap_open_noa), prap_open_rp:num_(r.prap_open_rp),
      total_open_noa:num_(r.total_open_noa), total_open_rp:num_(r.total_open_rp),
      sf_fulfillment:p.sf_fulfillment, productivity_per_sf_rp:p.productivity_per_sf_rp,
      branch_coverage:p.branch_coverage, achievement_rp:p.achievement_rp,
      quadrant_code:p.quadrant_code, quadrant_name:p.quadrant_name, rank_selindo:p.rank_selindo
    };
  }).sort((a,b)=>b.reguler_open_rp-a.reguler_open_rp);

  let summary=null, sourceGranularity='', sourceWarning='';
  const realRows=readObjectsIfExists_(APP.SHEETS.POT_RH_REAL).filter(r=>upper_(r.record_type)==='DETAIL');
  if(req.areaId){
    summary=areas.reduce((s,r)=>{
      s.sla_open_noa+=r.sla_open_noa;s.sla_open_rp+=r.sla_open_rp;
      s.prap_open_noa+=r.prap_open_noa;s.prap_open_rp+=r.prap_open_rp;
      s.reguler_open_noa+=r.reguler_open_noa;s.reguler_open_rp+=r.reguler_open_rp;
      return s;
    },emptyPotentialSummary_());
    summary.mitraguna_total_noa=null;summary.mitraguna_total_rp=null;summary.asabri_total_noa=null;summary.asabri_total_rp=null;
    sourceGranularity='AREA_REGULER_ONLY';
    sourceWarning='Pada level Area, sumber rinci yang tervalidasi saat ini hanya Potensi Reguler (SLA Realtime + Prapen Prioritas). Mitraguna dan ASABRI tersedia per RH dan tidak dialokasikan secara asumsi.';
  } else {
    let scoped=realRows.slice();
    if(req.rhUserKey) scoped=scoped.filter(r=>norm_(r.rh_user_key)===req.rhUserKey);
    else if(req.roSource) scoped=scoped.filter(r=>upper_(r.filter_ro)===upper_(req.roSource));
    else if(req.accessRole==='REGIONAL'){
      const allowedRh=getAllowedRhKeysForAccess_(req.accessScopeCode);
      scoped=scoped.filter(r=>{
        const rh=norm_(r.rh_user_key);
        return (allowedRh&&allowedRh.has(rh)) || roMatchesAccess_(r.filter_ro,req.accessScopeCode);
      });
    }
    summary=aggregateRealPotential_(scoped);
    sourceGranularity=req.rhUserKey?'RH_REAL':(req.roSource?'RO_SOURCE_GROUP':(req.accessRole==='REGIONAL'?'REGIONAL_REAL':'SELINDO_REAL'));
    const notes=Array.from(new Set(scoped.map(r=>norm_(r.scope_note)).filter(Boolean)));
    if(notes.length)sourceWarning=notes.join(' ');
    if(req.roSource && !sourceWarning)sourceWarning='Potensi Mitraguna dan ASABRI mengikuti agregasi source per RH/region pada file rekap.';
  }

  if(req.product==='REGULER'){
    summary.primary_label='Reguler — Belum Tergarap'; summary.primary_noa=summary.reguler_open_noa; summary.primary_rp=summary.reguler_open_rp;
  } else if(req.product==='MITRAGUNA'){
    summary.primary_label='Mitraguna — Total Potensi'; summary.primary_noa=summary.mitraguna_total_noa; summary.primary_rp=summary.mitraguna_total_rp;
  } else {
    summary.primary_label='Potensi Produk'; summary.primary_noa=null; summary.primary_rp=null;
  }

  let branchRows = readObjects_(APP.SHEETS.POT_BRANCH).filter(r => scopeAreaNames.has(upper_(r.area_name)));
  branchRows = branchRows.map(r => ({
    branch_code:norm_(r.branch_code), branch_name:norm_(r.branch_name), area_name:norm_(r.area_name),
    sf_total:num_(r.sf_total), coverage_status:norm_(r.coverage_status),
    reguler_open_noa:num_(r.total_open_noa), reguler_open_rp:num_(r.total_open_rp),
    total_open_noa:num_(r.total_open_noa), total_open_rp:num_(r.total_open_rp),
    sla_open_rp:num_(r.sla_open_rp), prap_open_rp:num_(r.prap_open_rp)
  })).sort((a,b)=>b.reguler_open_rp-a.reguler_open_rp).slice(0,20);

  const showAreaPotential=req.product!=='MITRAGUNA';
  const out = {
    summary,
    areas:showAreaPotential?areas:[],
    topBranches:showAreaPotential?branchRows:[],
    productMappingConfirmed:true,
    sourceGranularity,
    sourceWarning,
    mappingNote:buildPotentialMappingNote_(req,summary,sourceGranularity,sourceWarning)
  };
  cachePutJson_(key, out, APP.CACHE_REFERENCE_TTL);
  return out;
}

function emptyPotentialSummary_(){return{
  sla_total_noa:0,sla_total_rp:0,sla_cair_noa:0,sla_cair_rp:0,sla_open_noa:0,sla_open_rp:0,
  prap_total_noa:0,prap_total_rp:0,prap_cair_noa:0,prap_cair_rp:0,prap_open_noa:0,prap_open_rp:0,
  reguler_total_noa:0,reguler_total_rp:0,reguler_cair_noa:0,reguler_cair_rp:0,reguler_open_noa:0,reguler_open_rp:0,
  mitraguna_total_noa:0,mitraguna_total_rp:0,asabri_total_noa:0,asabri_total_rp:0,source_record_count:0
};}

function aggregateRealPotential_(rows){
  const s=emptyPotentialSummary_();
  (rows||[]).forEach(r=>{
    ['sla_total_noa','sla_total_rp','sla_cair_noa','sla_cair_rp','sla_open_noa','sla_open_rp',
     'prap_total_noa','prap_total_rp','prap_cair_noa','prap_cair_rp','prap_open_noa','prap_open_rp',
     'reguler_total_noa','reguler_total_rp','reguler_cair_noa','reguler_cair_rp','reguler_open_noa','reguler_open_rp',
     'mitraguna_total_noa','mitraguna_total_rp','asabri_total_noa','asabri_total_rp'].forEach(k=>s[k]+=num_(r[k]));
    s.source_record_count++;
  });
  return s;
}

function buildPotentialMappingNote_(req,s,granularity,warning){
  if(granularity==='AREA_REGULER_ONLY')return warning;
  let text='Reguler dihitung dari SLA Realtime + Prapen Prioritas. Untuk Reguler, angka belum tergarap = total potensi dikurangi yang sudah cair.';
  text+=' Mitraguna dan ASABRI pada source tersedia sebagai total potensi per RH.';
  if(warning)text+=' '+warning;
  return text;
}

/** =========================
 *  4) KAPASITAS TIM + HAMBATAN
 *  ========================= */

function getCapacityBundle(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapCapacityBundle_(req);
  const rows = filterScopeRows_(getAreaRowsCached_(req.periodId, req.product), req);
  const s = summarizeAreas_(rows);
  if(req.rhUserKey&&!req.areaId){const v=getAdminValidationValue_(req,req.periodId,'SF_ACTIVE',s.sf_active);if(v.overridden){s.sf_active=num_(v.value);s.productivity_per_sf_rp=s.sf_active?safeDiv_(s.achievement_rp,s.sf_active):null;s.adminValidation=[{metric:'SF_ACTIVE',validation:v.validation}];}}
  const byArea = rows.map(r => ({
    area_id:r.area_id, area_name:r.area_name, sf_active:r.sf_active, min_sf_required:r.min_sf_required,
    sf_fulfillment:r.sf_fulfillment, sf_green:r.sf_green, sf_grey:r.sf_grey, sf_red:r.sf_red,
    productivity_per_sf_rp:r.productivity_per_sf_rp, korea_activity_rate:r.korea_activity_rate,
    branch_coverage:r.branch_coverage, quadrant_code:r.quadrant_code, quadrant_name:r.quadrant_name
  })).sort((a,b)=>(a.sf_fulfillment==null?9:a.sf_fulfillment)-(b.sf_fulfillment==null?9:b.sf_fulfillment));
  return { summary:s, areas:byArea };
}

function getBarrierBundle(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapBarrierBundle_(req);
  const key = cacheKey_('BAR_V50', req.periodId, req.product, req.rhUserKey, req.areaId, req.accessScopeCode||'ALL');
  const cached = cacheGetJson_(key);
  if (cached) return cached;

  const rows = filterScopeRows_(getAreaRowsCached_(req.periodId, req.product), req);
  const s = summarizeAreas_(rows);
  const sfFul = safeDiv_(rows.reduce((n,r)=>n+num_(r.sf_active),0), rows.reduce((n,r)=>n+num_(r.min_sf_required),0));
  const processRatio = safeDiv_(s.carry_over_rp + s.batal_cair_rp, Math.max(s.pipeline_active_rp,1));
  const barriers = [];

  addBarrier_(barriers, 'KAPASITAS', 'Kapasitas SF belum mencukupi', Math.max(0,1-sfFul),
    'Pemenuhan SF ' + pctText_(sfFul) + '.',
    sfFul < 1 ? 'Jumlah SF masih di bawah kebutuhan wilayah.' : 'Jumlah SF telah memenuhi kebutuhan minimum.');

  addBarrier_(barriers, 'PRODUKTIVITAS', 'Produktivitas tim belum optimal', Math.max(0,1-safeDiv_(s.productivity_per_sf_rp,APP.RULES.PRODUCTIVITY_BASELINE)),
    'Hasil per SF ' + moneyText_(s.productivity_per_sf_rp) + ' dibanding standar ' + moneyText_(APP.RULES.PRODUCTIVITY_BASELINE) + '.',
    s.productivity_per_sf_rp < APP.RULES.PRODUCTIVITY_BASELINE ? 'Kapasitas yang ada belum menghasilkan secara optimal.' : 'Produktivitas per SF berada di atas standar.');

  addBarrier_(barriers, 'PIPELINE', 'Pengajuan berjalan belum cukup', Math.max(0,1-safeDiv_(s.pipeline_to_target,APP.RULES.PIPELINE_IDEAL)),
    'Pengajuan berjalan ' + s.pipeline_to_target.toFixed(2).replace('.',',') + ' kali target; kondisi ideal minimal 2 kali.',
    s.pipeline_to_target < APP.RULES.PIPELINE_IDEAL ? 'Suplai calon pencairan belum cukup kuat untuk menjaga target.' : 'Pengajuan berjalan telah memenuhi tingkat ideal.');

  addBarrier_(barriers, 'PROSES', 'Pengajuan belum selesai menjadi pencairan', processRatio > APP.RULES.PROCESS_RATIO_WATCH ? Math.min(1,(processRatio-APP.RULES.PROCESS_RATIO_WATCH)/0.8) : 0,
    'Pengajuan berlanjut + batal cair setara ' + pctText_(processRatio) + ' dari pengajuan berjalan.',
    processRatio > APP.RULES.PROCESS_RATIO_WATCH ? 'Sebagian nilai bisnis tertahan setelah pipeline terbentuk.' : 'Tekanan dari pengajuan berlanjut dan batal cair relatif terkendali.');

  const activity = s.korea_activity_rate == null ? 1 : s.korea_activity_rate;
  addBarrier_(barriers, 'AKTIVITAS', 'Aktivitas penggerak bisnis masih rendah', Math.max(0,1-safeDiv_(activity,APP.RULES.KOREA_ACTIVITY_OK)),
    'Rata-rata pemenuhan aktivitas Korea ' + pctText_(activity) + '.',
    activity < APP.RULES.KOREA_ACTIVITY_OK ? 'Aktivitas belum konsisten menopang pembentukan pipeline.' : 'Aktivitas Korea relatif terjaga.');

  const coverage = s.branch_coverage == null ? 1 : s.branch_coverage;
  addBarrier_(barriers, 'COVERAGE', 'Cakupan cabang belum optimal', Math.max(0,1-safeDiv_(coverage,APP.RULES.COVERAGE_GREEN)),
    'Rata-rata cakupan cabang ' + pctText_(coverage) + '.',
    coverage < APP.RULES.COVERAGE_GREEN ? 'Masih terdapat cabang yang belum ter-cover secara memadai.' : 'Cakupan cabang relatif baik.');

  barriers.sort((a,b)=>b.severity-a.severity);
  const top = barriers.filter(x=>x.severity>0.01).slice(0,5);
  const reasons = req.areaId ? getPipelineReasons_(req.periodId, req.areaId) : [];
  const out = { summary:s, sf_fulfillment:sfFul, process_ratio:processRatio, barriers:top, pipelineReasons:reasons };
  cachePutJson_(key, out, APP.CACHE_AREA_TTL);
  return out;
}

function addBarrier_(arr, code, title, severity, evidence, meaning) {
  arr.push({ code, title, severity:Math.max(0,Math.min(1,num_(severity))), evidence, meaning });
}

/** =========================
 *  5) DETAIL AREA / KOREA / CABANG / SF
 *  ========================= */

function getAreaDetail(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapAreaDetail_(req);
  if (!req.areaId) throw new Error('Area belum dipilih.');
  const key = cacheKey_('DETAIL_V50', req.periodId, req.product, req.areaId, req.accessScopeCode||'ALL');
  const cached = cacheGetJson_(key);
  if (cached) return cached;

  const area = getAreaRowsCached_(req.periodId, req.product).find(r=>r.area_id===req.areaId);
  if (!area) throw new Error('Data Area tidak ditemukan.');
  const koreas = getKoreaPerformance_(req.periodId, req.product, req.areaId);
  const alerts = readObjectsIfExists_(APP.SHEETS.ALERT)
    .filter(r => norm_(r.period_id)===req.periodId && norm_(r.area_id)===req.areaId)
    .sort((a,b)=>alertWeight_(a.level)-alertWeight_(b.level));
  const reasons = getPipelineReasons_(req.periodId, req.areaId);
  const branchPotentials = readObjectsIfExists_(APP.SHEETS.POT_BRANCH)
    .filter(r => upper_(r.area_name)===upper_(area.area_name))
    .map(r=>({branch_code:norm_(r.branch_code),branch_name:norm_(r.branch_name),sf_total:num_(r.sf_total),coverage_status:norm_(r.coverage_status),total_open_rp:num_(r.total_open_rp)}))
    .sort((a,b)=>b.total_open_rp-a.total_open_rp).slice(0,10);

  let branches = readObjectsIfExists_(APP.SHEETS.RANK_BRANCH)
    .filter(r => norm_(r.period_id)===req.periodId && upper_(r.product)===req.product && norm_(r.area_id)===req.areaId)
    .sort((a,b)=>num_(a.rank_area)-num_(b.rank_area));
  let branchMode = 'PRECOMPUTED';
  if (!branches.length) {
    branchMode = 'LAZY_FALLBACK';
    try { branches = buildLiveBranchSf_(req.periodId, req.product, req.areaId).branches; }
    catch (err) { branches = []; branchMode = 'NOT_READY'; }
  }

  const out = { area, koreas, alerts, reasons, branches, branchPotentials, branchMode };
  cachePutJson_(key, out, APP.CACHE_AREA_TTL);
  return out;
}

function getBranchDetail(payload) {
  const req = normalizeFilters_(payload || {});
  if(req.partner==='MANTAP') return getMantapBranchDetail_(req);
  if(req.accessRole==='REGIONAL'&&!req.areaId)throw new Error('Pilih Area terlebih dahulu untuk membuka detail Cabang.');
  const branchId = norm_(payload && payload.branchId);
  if (!branchId) throw new Error('Cabang belum dipilih.');
  const key = cacheKey_('BRANCH_V50', req.periodId, req.product, req.areaId, branchId, req.accessScopeCode||'ALL');
  const cached = cacheGetJson_(key);
  if (cached) return cached;

  let sfs = readObjectsIfExists_(APP.SHEETS.RANK_SF)
    .filter(r => norm_(r.period_id)===req.periodId && upper_(r.product)===req.product && norm_(r.branch_id)===branchId)
    .sort((a,b)=>num_(a.rank_branch)-num_(b.rank_branch));
  let mode='PRECOMPUTED';
  if (!sfs.length && req.areaId) {
    mode='LAZY_FALLBACK';
    try {
      const live = buildLiveBranchSf_(req.periodId, req.product, req.areaId);
      sfs = live.sfs.filter(r=>norm_(r.branch_id)===branchId).sort((a,b)=>num_(a.rank_branch)-num_(b.rank_branch));
    } catch (err) { sfs=[]; mode='NOT_READY'; }
  }
  const out={ branchId, sfs, mode };
  cachePutJson_(key,out,APP.CACHE_AREA_TTL);
  return out;
}

function getKoreaPerformance_(periodId, product, areaId) {
  const key=cacheKey_('KOREA',periodId,product,areaId);
  const cached=cacheGetJson_(key); if(cached)return cached;
  const rows=readObjects_(APP.SHEETS.RANK_KOREA).filter(r=>norm_(r.period_id)===periodId && norm_(r.area_id)===areaId);
  const p=upper_(product||'ALL'); const prefix=p==='REGULER'?'reg':(p==='MITRAGUNA'?'mtg':'all');
  const out=rows.map(r=>({
    nip_korea_key:norm_(r.nip_korea_key),nama_korea:norm_(r.nama_korea),area_id:norm_(r.area_id),area_name:norm_(r.area_name),
    rh_id:norm_(r.rh_id),rh_name:norm_(r.rh_name),rank_area:numOrNull_(r[prefix+'_rank_area']),rank_area_pool:numOrNull_(r[prefix+'_rank_area_pool']),
    rank_selindo:numOrNull_(r[prefix+'_rank_selindo']),rank_selindo_pool:numOrNull_(r[prefix+'_rank_selindo_pool']),
    target_rp:num_(r[prefix+'_target_rp']),achievement_rp:num_(r[prefix+'_achievement_rp']),attainment_pct:numOrNull_(r[prefix+'_attainment_pct']),
    sf_active:num_(r.sf_active),sf_green:num_(r.sf_green),sf_grey:num_(r.sf_grey),sf_red:num_(r.sf_red),
    activity_rate:numOrNull_(r.korea_activity_rate),activity_status:norm_(r.korea_activity_status),pipeline_active_rp:num_(r.pipeline_active_rp),
    carry_over_rp:num_(r.pipeline_carry_over_rp),batal_cair_rp:num_(r.pipeline_batal_cair_rp),status:norm_(r[prefix+'_rank_status'])
  })).filter(r=>r.status!=='NO_RESULT_DATA').sort((a,b)=>(a.rank_area||9999)-(b.rank_area||9999));
  cachePutJson_(key,out,APP.CACHE_AREA_TTL); return out;
}

function getPipelineReasons_(periodId, areaId) {
  return readObjectsIfExists_(APP.SHEETS.PIPE_REASON)
    .filter(r=>norm_(r.period_id)===periodId && norm_(r.area_id)===areaId)
    .map(r=>({condition:norm_(r.pipeline_condition),category:norm_(r.reason_category),reason:norm_(r.reason_raw),followup:norm_(r.system_followup_hint),review_required:num_(r.review_required),count:num_(r.business_case_count||r.record_count),amount_rp:num_(r.plafond_total_rp)}))
    .sort((a,b)=>b.amount_rp-a.amount_rp);
}


function nextPeriodId_(periodId, offset){
  const m=/^(\d{4})-(\d{2})$/.exec(norm_(periodId));
  if(!m)return periodId;
  const d=new Date(Number(m[1]),Number(m[2])-1+(offset||0),1);
  return Utilities.formatDate(d, getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta', 'yyyy-MM');
}

function projectionScope_(req){
  const scopeType=req.areaId?'AREA':(req.rhUserKey?'RH':(req.roSource?'RO':'SELINDO'));
  const scopeId=req.areaId||req.rhUserKey||req.roSource||'SELINDO';
  return {scopeType,scopeId,scopeName:getScopeName_(req)};
}

function getProjectionBundle(payload){
  const req=normalizeFilters_(payload||{}),scope=projectionScope_(req),currentPeriod=req.periodId,closedPeriod=nextPeriodId_(currentPeriod,-1),projectionPeriod=currentPeriod,nextProjectionPeriod=nextPeriodId_(currentPeriod,1);
  const rows=readObjectsIfExists_(APP.SHEETS.PROJECTION_INPUT),partner=req.partner==='MANTAP'?'MANTAP':'BSI';
  const key=[partner,currentPeriod,req.product||'ALL',scope.scopeType,scope.scopeId].join('|');
  const legacyKey=[currentPeriod,req.product||'ALL',scope.scopeType,scope.scopeId].join('|');
  const saved=rows.find(r=>norm_(r.projection_key)===key)||(partner==='BSI'?rows.find(r=>norm_(r.projection_key)===legacyKey):null)||{};
  const previousBase=nextPeriodId_(currentPeriod,-1),previousKey=[partner,previousBase,req.product||'ALL',scope.scopeType,scope.scopeId].join('|'),previousLegacy=[previousBase,req.product||'ALL',scope.scopeType,scope.scopeId].join('|');
  const previous=rows.find(r=>norm_(r.projection_key)===previousKey)||(partner==='BSI'?rows.find(r=>norm_(r.projection_key)===previousLegacy):null)||{};
  const areaRows=req.partner==='MANTAP'
    ? filterMantapRows_(getMantapAreaRowsCached_(closedPeriod,req.product),Object.assign({},req,{periodId:closedPeriod}))
    : filterScopeRows_(getAreaRowsCached_(closedPeriod,req.product),Object.assign({},req,{periodId:closedPeriod}));
  const current=req.partner==='MANTAP'?aggregateMantapRows_(areaRows):summarizeAreas_(areaRows);
  const currentActual=req.partner==='MANTAP'?(current.achievement_available?current.achievement_rp:null):current.achievement_rp;
  const currentTarget=req.partner==='MANTAP'?null:current.target_rp;
  const currentAtt=req.partner==='MANTAP'?null:current.attainment_pct;
  const out={
    partner,
    base_period_id:closedPeriod,base_period_label:periodLabel_(closedPeriod),
    projection_period_id:projectionPeriod,projection_period_label:periodLabel_(projectionPeriod),
    next_projection_period_id:nextProjectionPeriod,next_projection_period_label:periodLabel_(nextProjectionPeriod),
    current_actual_rp:currentActual,current_target_rp:currentTarget,current_attainment_pct:currentAtt,
    projection_rp:numOrNull_(saved.projection_rp)!=null?num_(saved.projection_rp):(numOrNull_(previous.next_projection_rp)!=null?num_(previous.next_projection_rp):null),
    next_projection_rp:numOrNull_(saved.next_projection_rp),driver_text:norm_(saved.driver_text),source_saved:!!norm_(saved.projection_key),carried_forward:!norm_(saved.projection_key)&&numOrNull_(previous.next_projection_rp)!=null,
    scope_type:scope.scopeType,scope_id:scope.scopeId,scope_name:scope.scopeName
  };
  out.gap_to_current_target=out.projection_rp!=null&&currentTarget!=null?out.projection_rp-currentTarget:null;
  return out;
}

function saveProjection(payload){
  payload=payload||{};
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.PROJECTION_INPUT);if(!sh)throw new Error('Sheet proyeksi belum tersedia. Jalankan setupAplikasi() sekali.');
  const req=normalizeFilters_(payload),scope=projectionScope_(req),partner=req.partner==='MANTAP'?'MANTAP':'BSI',projectionPeriod=req.periodId,nextProjectionPeriod=nextPeriodId_(req.periodId,1),key=[partner,req.periodId,req.product||'ALL',scope.scopeType,scope.scopeId].join('|');
  const projection=payload.projectionRp===''||payload.projectionRp==null?null:num_(payload.projectionRp),nextProjection=payload.nextProjectionRp===''||payload.nextProjectionRp==null?null:num_(payload.nextProjectionRp);
  const obj={projection_key:key,base_period_id:nextPeriodId_(req.periodId,-1),projection_period_id:projectionPeriod,next_projection_period_id:nextProjectionPeriod,product:req.product||'ALL',scope_type:scope.scopeType,scope_id:scope.scopeId,scope_name:scope.scopeName,projection_rp:projection==null?'':projection,next_projection_rp:nextProjection==null?'':nextProjection,driver_text:clean_(payload.driverText,1600),updated_at:new Date(),updated_by:getUserLabel_(),partner};
  upsertByKey_(sh,'projection_key',key,obj);clearAppCache();return{ok:true,message:'Proyeksi '+(partner==='MANTAP'?'Bank Mantap':'BSI')+' tersimpan.',projectionPeriod:projectionPeriod,nextProjectionPeriod:nextProjectionPeriod};
}

/** =========================
 *  LANGKAH PENGEMBANGAN — INPUT RH/ADMIN
 *  ========================= */

function getDevelopmentPlans(payload) {
  const req=normalizeFilters_(payload||{}), partner=req.partner==='MANTAP'?'MANTAP':'BSI';
  let rows=readObjectsIfExists_(APP.SHEETS.DEV_INPUT)
    .filter(r=>norm_(r.period_id)===req.periodId)
    .filter(r=>upper_(r.partner||'BSI')===partner);
  const base=req.partner==='MANTAP'?getMantapAreaRowsCached_(req.periodId,'ALL'):getAreaRowsCached_(req.periodId,'ALL');
  const scoped=req.partner==='MANTAP'?filterMantapRows_(base,req):filterScopeRows_(base,req);
  let allowed=new Set(scoped.map(r=>norm_(r.area_id)).filter(Boolean));
  if(req.accessRole==='REGIONAL'){
    const accessAllowed=getAllowedAreaIdsForAccess_(req);
    if(accessAllowed)allowed=accessAllowed;
    rows=rows.filter(r=>allowed.has(norm_(r.area_id)));
  }else{
    rows=rows.filter(r=>!allowed.size||allowed.has(norm_(r.area_id)));
  }
  return rows.map(r=>Object.assign({},r,{
    partner:upper_(r.partner||'BSI'),
    action_plan:norm_(r.action_plan)||norm_(r.focus_title),
    how_to:norm_(r.how_to)||norm_(r.strategy_rh)||norm_(r.horizon_30_day),
    development_progress:norm_(r.development_progress),
    result_text:norm_(r.result_text),
    include_to_presentation:upper_(r.include_to_presentation||r.include_to_bsi)==='YA'?'YA':'TIDAK'
  })).sort((a,b)=>num_(a.focus_order)-num_(b.focus_order));
}


function saveDevelopmentPlan(payload) {
  payload=payload||{};
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.DEV_INPUT);
  if(!sh)throw new Error('Sheet Langkah Pengembangan belum tersedia.');
  const req=normalizeFilters_(payload),periodId=clean_(payload.periodId,20),areaId=clean_(payload.areaId,60),areaName=clean_(payload.areaName,160);
  if(!periodId||!areaId)throw new Error('Periode dan Area wajib dipilih.');
  const partner=req.partner==='MANTAP'?'MANTAP':'BSI';
  const actionPlan=clean_(payload.actionPlan||payload.focusTitle,2600);
  if(!actionPlan)throw new Error('Action Plan wajib diisi.');
  const planId=clean_(payload.planId,100)||('PLAN-'+periodId.replace('-','')+'-'+areaId+'-'+Utilities.getUuid().slice(0,8));
  const old=readObjectsIfExists_(APP.SHEETS.DEV_INPUT).find(r=>norm_(r.plan_id)===planId)||{};
  const focusTitle=clean_(payload.focusTitle,200)||actionPlan.split(/\r?\n/)[0].slice(0,200);
  const include=upper_(payload.includeToPresentation||payload.includeToBsi)==='YA'?'YA':'TIDAK';
  const obj={
    plan_id:planId,period_id:periodId,user_key:clean_(payload.userKey,100)||getUserLabel_(),scope_type:clean_(payload.scopeType,30)||'AREA',
    rh_id:clean_(payload.rhId,80)||norm_(old.rh_id),rh_name:clean_(payload.rhName,160)||norm_(old.rh_name),area_id:areaId,area_name:areaName,focus_title:focusTitle,
    analysis_condition:norm_(old.analysis_condition),cause_text:norm_(old.cause_text),strategy_rh:norm_(old.strategy_rh),
    action_plan:actionPlan,target_result:norm_(old.target_result),pic:norm_(old.pic),deadline:norm_(old.deadline),
    horizon_30_day:norm_(old.horizon_30_day),horizon_60_day:norm_(old.horizon_60_day),horizon_90_day:norm_(old.horizon_90_day),
    support_bsi:norm_(old.support_bsi),include_to_bsi:partner==='BSI'?include:'TIDAK',
    focus_order:Math.max(1,Math.floor(num_(payload.focusOrder)||num_(old.focus_order)||1)),approval_status:clean_(payload.approvalStatus,30)||norm_(old.approval_status)||'DRAF',
    updated_at:new Date(),updated_by:getUserLabel_(),partner,
    how_to:clean_(payload.howTo,3200),development_progress:clean_(payload.developmentProgress,2600),result_text:clean_(payload.resultText,2600),include_to_presentation:include
  };
  upsertByKey_(sh,'plan_id',planId,obj); clearAppCache();
  return {ok:true,planId,updatedAt:formatDateTime_(obj.updated_at)};
}


function deleteDevelopmentPlan(payload) {
  const req=normalizeFilters_(payload||{}),planId=norm_(payload&&payload.planId);
  if(!planId)return{ok:false};
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.DEV_INPUT); if(!sh)return{ok:false};
  const data=sh.getDataRange().getValues(); if(data.length<2)return{ok:false};
  const h=data[0].map(norm_),ix=h.indexOf('plan_id'),areaIx=h.indexOf('area_id'),partnerIx=h.indexOf('partner');
  for(let r=data.length-1;r>=1;r--){
    if(norm_(data[r][ix])!==planId)continue;
    const rowPartner=partnerIx>=0?upper_(data[r][partnerIx]||'BSI'):'BSI';
    const areaId=areaIx>=0?norm_(data[r][areaIx]):'';
    const accessReq=Object.assign({},req,{partner:rowPartner,areaId});
    if(req.accessRole==='REGIONAL'&&!isAreaAllowedForAccess_(areaId,accessReq))throw new Error('Akses Regional tidak dapat menghapus Action Plan di luar wilayahnya.');
    sh.deleteRow(r+1);clearAppCache();return{ok:true};
  }
  return{ok:false};
}

/** =========================
 *  PRESENTASI
 *  ========================= */

function buildPresentationDraft(payload) {
  const skipRanking=!!(payload&&payload.skipRanking),presentationLite=!!(payload&&payload.presentationLite),req=normalizeFilters_(payload||{});
  if(req.partner==='MANTAP') return buildMantapPresentationDraft_(req,payload||{});
  const presentationCacheKey=cacheKey_('PRESENTATION_DRAFT_V54',req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL',presentationLite?'LITE':'FULL',skipRanking?'NORANK':'RANK');
  const presentationCached=cacheGetJson_(presentationCacheKey);if(presentationCached)return presentationCached;
  const areaRows=filterScopeRows_(getAreaRowsCached_(req.periodId,req.product),req),summary=summarizeAreas_(areaRows),businessReview=getBusinessReviewBundle(req),history=Object.assign({},businessReview.performance,{months:businessReview.performance.months||[]}),potential=presentationLite?null:getPotentialBundle(req),capacity=getCapacityBundle(req),barrier=presentationLite?null:getBarrierBundle(req),projection=getProjectionBundle(req),dataHealth=getDataHealthBundle(req),q=countQuadrants_(areaRows),scopeName=getScopeName_(req),ranking=skipRanking?null:getPresentationRankingSnapshot_(req);
  const plans=getDevelopmentPlans(req).filter(r=>upper_(r.include_to_presentation||r.include_to_bsi)==='YA'&&upper_(r.approval_status)!=='DITOLAK');
  const presentationAreas=areaRows.map(r=>({area_id:r.area_id,area_name:r.area_name,rank_selindo:r.rank_selindo,attainment_pct:r.attainment_pct,sf_fulfillment:r.sf_fulfillment,productivity_per_sf_rp:r.productivity_per_sf_rp,quadrant_code:r.quadrant_code,quadrant_name:r.quadrant_name,target_rp:r.target_rp,achievement_rp:r.achievement_rp,pipeline_active_rp:r.pipeline_active_rp,branch_coverage:r.branch_coverage}));
  const makeProductContext_=(product)=>{const r=Object.assign({},req,{product}),br=getBusinessReviewBundle(r);return{product,review:br,performance:br.performance,pipeline:br.pipeline,projection:getProjectionBundle(r)}};
  const productContexts=req.product==='ALL'?[makeProductContext_('REGULER'),makeProductContext_('MITRAGUNA')]:[makeProductContext_(req.product)];
  const slides=[{id:'cover',type:'cover',title:'Review Kinerja Bisnis RH',headline:'Review Kinerja Bisnis RH'}];
  slides.push({id:'executive-summary',type:'mg_exec_summary',title:'Ringkasan Utama',headline:businessReview.analysis&&businessReview.analysis.headline?businessReview.analysis.headline:'Ringkasan kondisi bisnis pada periode review.',businessReview,capacity,productContexts});
  productContexts.forEach(pc=>slides.push({id:'overview-'+pc.product.toLowerCase(),type:'mg_overview',title:'Kinerja '+productLabel_(pc.product),headline:managementOverviewHeadline_(pc.performance,pc.product),product:pc.product,productContext:pc}));
  slides.push({id:'resources-pipeline-closed',type:'mg_resources_pipeline',title:'Tim & Pipeline '+(productContexts[0]?.review?.period?.closed_period_label||'Bulan Selesai'),headline:managementResourcesPipelineHeadline_(productContexts,capacity),productContexts,capacity});
  if(ranking)slides.push({id:'ranking-wilayah',type:'ranking_overview',title:'Posisi Kinerja Wilayah',headline:'Lihat posisi RO, Area, Cabang, Korea, dan SF dalam satu halaman.',ranking});
  productContexts.forEach(pc=>{
    slides.push({id:'pipeline-analysis-'+pc.product.toLowerCase(),type:'mg_pipeline_analysis',title:'Analisa Pipeline · '+productLabel_(pc.product),headline:managementPipelineAnalysisHeadline_(pc.pipeline,pc.product),product:pc.product,productContext:pc});
    slides.push({id:'pipeline-detail-'+pc.product.toLowerCase(),type:'mg_pipeline_detail',title:'Rincian Pipeline '+(pc.review.period.closed_period_label||'Bulan Selesai')+' · '+productLabel_(pc.product),headline:managementPipelineDetailHeadline_(pc.pipeline,pc.product),product:pc.product,productContext:pc});
    slides.push({id:'pipeline-current-'+pc.product.toLowerCase(),type:'mg_pipeline_current',title:'Pipeline '+(pc.review.period.current_period_label||'Bulan Berjalan')+' · '+productLabel_(pc.product),headline:managementCurrentPipelineHeadline_(pc.pipeline,pc.product),product:pc.product,productContext:pc,projection:pc.projection||null});
  });
  const actionImpact=req.rhUserKey?buildActionPlanImpactBundle_(req,businessReview):null;
  if(actionImpact&&actionImpact.mode==='DETAIL'&&actionImpact.plan){
    const pri=(actionImpact.priorities||[]).filter(Boolean);
    if(pri.length)pri.slice(0,3).forEach((p,idx)=>slides.push({id:idx===0?'action-plan-impact':'action-plan-impact-'+(idx+1),type:'action_impact',title:'Hasil Action Plan RH · '+(idx+1),headline:p.title||actionImpact.managementInsight,actionImpact,priorityIndex:idx}));
    else slides.push({id:'action-plan-impact',type:'action_impact',title:'Hasil Action Plan RH',headline:actionImpact.managementInsight,actionImpact,priorityIndex:0});
  }
  slides.push({id:'recommendation',type:'mg_recommendation',title:'Fokus Berikutnya',headline:managementRecommendationHeadline_(productContexts),productContexts,projection});
  slides.push({id:'langkah',type:'next',title:'Langkah Pengembangan',headline:projection.projection_rp||projection.next_projection_rp||plans.length?'Proyeksi bulan berikutnya menjadi acuan untuk menjalankan Action Plan.':'Langkah pengembangan belum diisi oleh RH/Admin.',projection,plans});
  const storyMap=getStoryOverrideMap_(req),storyItems=slides.map((s,i)=>{const ov=storyMap[s.id]||{},systemHeadline=s.headline||'',systemExplanation=defaultStoryExplanation_(summary,q,potential,capacity,barrier,s,plans),systemSupporting=defaultStorySupporting_(summary,q,potential,capacity,barrier,s,plans);s.headline=norm_(ov.headline)||systemHeadline;s.explanation=norm_(ov.explanation)||systemExplanation;s.supporting_text=norm_(ov.supporting_text)||systemSupporting;s.show_slide=upper_(ov.show_slide||'YA')!=='TIDAK';return{slide_id:s.id,slide_title:s.title||s.id,slide_order:i+1,show_slide:s.show_slide,headline:s.headline,explanation:s.explanation,supporting_text:s.supporting_text,system_headline:systemHeadline,system_explanation:systemExplanation,system_supporting_text:systemSupporting}});
  const result={meta:{title:'Review Kinerja Bisnis RH',scopeName,periodLabel:periodLabel_(req.periodId),productLabel:productLabel_(req.product),company:APP.COMPANY,partner:'BSI',generatedAt:formatDateTime_(new Date())},filters:req,summary,history,businessReview,pipelineReview:businessReview.pipeline,potential,capacity,barrier,actionImpact,dataHealth,areas:presentationAreas,quadrantCounts:q,plans,slides,storyItems,ranking};
  cachePutJson_(presentationCacheKey,result,APP.CACHE_REFERENCE_TTL);return result;
}


function getStoryContext_(payload){
  const req=normalizeFilters_(payload||{});
  const scopeType=req.areaId?'AREA':(req.rhUserKey?'RH':(req.roSource?'RO':'SELINDO'));
  const scopeId=req.areaId||req.rhUserKey||req.roSource||'SELINDO';
  const scopeName=getScopeName_(req);
  return {req,scopeType,scopeId,scopeName};
}

function getStoryOverrideMap_(req){
  const ctx=getStoryContext_(req),partner=ctx.req.partner==='MANTAP'?'MANTAP':'BSI';
  const rows=readObjectsIfExists_(APP.SHEETS.STORY_EDITOR).filter(r=>
    norm_(r.period_id)===ctx.req.periodId && upper_(r.product||'ALL')===upper_(ctx.req.product||'ALL') &&
    upper_(r.scope_type)===ctx.scopeType && norm_(r.scope_id)===ctx.scopeId &&
    (upper_(r.partner||'BSI')===partner || (partner==='BSI'&&!norm_(r.partner)))
  );
  const out={}; rows.forEach(r=>out[norm_(r.slide_id)]={show_slide:norm_(r.show_slide),headline:norm_(r.headline),explanation:norm_(r.explanation),supporting_text:norm_(r.supporting_text)}); return out;
}

function defaultStoryExplanation_(summary,q,potential,capacity,barrier,slide,plans){
  switch(String(slide.type||'')){
    case 'cover': return 'Ringkasan ini dipakai untuk menjelaskan kondisi bisnis, potensi, kapasitas tim, hambatan, dan langkah pengembangan pada cakupan yang sedang dipilih.';
    case 'business': return 'Fokus utamanya adalah posisi pencairan terhadap target, perjalanan kinerja Januari–Agustus 2026, serta Area yang paling banyak membentuk hasil.';
    case 'mg_exec_summary': return 'Ringkasan utama menyatukan hasil bulan sebelumnya, kondisi tim, pipeline bulan berjalan, dan isu utama agar manajemen mendapat konteks sebelum masuk ke detail produk.';
    case 'ranking_overview': return 'Slide ranking memperlihatkan posisi wilayah dan tim pada level RO/Distribution, Region Head, Area, Cabang/Unit, Korea/Sales Leader, dan SF.';
    case 'mg_overview': return 'Ringkasan produk menampilkan perjalanan 2026, jumlah dan produktivitas SF, ticket size, pencairan terhadap target, serta perubahan bulan terakhir.';
    case 'mantap_overview': return 'Ringkasan Bank Mantap menampilkan pencairan bila tersedia, pipeline aktif, kondisi tim, dan sebaran Area tanpa mencampurkannya dengan BSI.';
    case 'mantap_pipeline': return 'Pipeline Mantap dibaca sebagai alur HOT → Incoming → Diproses → Akad, dengan Reject sebagai pengajuan yang perlu diperbaiki.';
    case 'mantap_capacity': return 'Kondisi tim Mantap dibaca dari Sales Leader, SF, jumlah unit, cakupan unit, dan produktivitas bila pencairan sudah tersedia.';
    case 'mantap_focus': return 'Penutup Mantap merangkum hambatan utama dan fokus tindak lanjut berdasarkan kondisi tim, pipeline, serta kelengkapan data yang tersedia.';
    case 'mg_growth': return 'Pertumbuhan dibaca sebelum masuk ke slide pipeline: perubahan pencairan, produktivitas, ticket size, SF, pencapaian, dan gap dibanding bulan sebelumnya.';
    case 'mg_pipeline_closed': return 'Bulan sebelumnya dipakai untuk membaca kualitas pipeline yang sudah terjadi: Hot, Incoming, Cair, Ticket Size, Carry Over, dan Batal Cair.';
    case 'mg_pipeline_analysis': return 'Incoming yang belum menjadi pencairan dipisahkan menjadi Carry Over dan Batal Cair, lalu alasan utamanya ditampilkan agar sumber kehilangan dapat dibaca.';
    case 'mg_pipeline_current': return 'Bulan berjalan dipakai untuk melihat posisi pipeline per tahap, proyeksi cair akhir bulan, batal cair saat ini, dan acuan bulan berikutnya.';
    case 'mg_pipeline_detail': return 'Bulan sebelumnya dipecah per produk agar Pensiun, Pra Pensiun, dan Mitraguna dapat dibaca tanpa mencampurkan proses menuju pencairan dan sumber pengajuan tertahan.';
    case 'mg_resources_pipeline': return 'Kondisi tim ditempatkan berdampingan dengan pipeline bulan sebelumnya agar manajemen dapat membaca hubungan tim dan hasil bisnis dalam satu konteks.';
    case 'action_impact': return 'Bagian ini membandingkan komitmen Action Plan RH dengan perubahan tim, pipeline, dan pencairan aktual yang tersedia. Sistem membedakan perkembangan dari hasil bisnis.';
    case 'mg_recommendation': return 'Fokus berikutnya diturunkan dari gap kinerja dan kualitas pipeline. Sistem memberikan arah berbasis data; keputusan akhir tetap dapat disesuaikan melalui Atur Narasi PPT.';
    case 'mg_resources': return 'Kondisi tim menghubungkan hasil bisnis dengan jumlah SF, produktivitas, pemenuhan kebutuhan, dan kualitas tim.';
    case 'quadrant': return 'Kuadran membantu membaca apakah persoalan utama berada pada jumlah SF, produktivitas tim, atau kombinasi keduanya.';
    case 'potential': return 'Bagian ini menunjukkan ruang pertumbuhan yang masih terbuka dan Area mana yang paling siap untuk menangkapnya.';
    case 'capacity': return 'Kondisi tim dibaca dari jumlah SF, kualitas SF, pemerataan warna, cakupan cabang, dan kedisiplinan aktivitas.';
    case 'barriers': return 'Hambatan dibawa dalam bahasa sederhana: masalahnya apa, buktinya apa, dan dampaknya ke bisnis apa.';
    case 'plan': return 'Area prioritas diterjemahkan menjadi tindakan, target hasil, PIC, dan waktu pantau.';
    case 'next': return 'Penutup difokuskan pada proyeksi dan agenda tindak lanjut yang siap dipantau pada forum berikutnya.';
    default: return '';
  }
}

function defaultStorySupporting_(summary,q,potential,capacity,barrier,slide,plans){
  const type=String(slide.type||'');
  if(type==='business'){
    const gap=Math.max(0,num_(summary.target_rp)-num_(summary.achievement_rp));
    return num_(summary.attainment_pct)>=1 ? 'Target periode sudah tercapai. Fokus berikutnya menjaga pipeline dan kesinambungan hasil.' : 'Sisa ke target '+formatRupiahShort_(gap)+'; penguatan hasil per SF dan pipeline perlu dipantau.';
  }
  if(type==='quadrant'){
    if(num_(q.Q3)>0)return q.Q3+' Area berada pada prioritas perbaikan karena kapasitas dan hasil tim sama-sama perlu diperkuat.';
    if(num_(q.Q2)>0)return q.Q2+' Area produktif tetapi masih membutuhkan penguatan kapasitas tim.';
    return 'Tidak ada Area yang masuk prioritas perbaikan utama pada periode ini.';
  }
  if(type==='capacity'){
    const f=num_(summary.sf_fulfillment);
    return f<1?'Pemenuhan SF masih '+Math.round(f*100)+'% dari kebutuhan minimum wilayah.':'Jumlah SF telah memenuhi kebutuhan minimum; perhatian berpindah ke kualitas dan produktivitas.';
  }
  if(type==='barriers'){
    const top=(barrier&&barrier.barriers&&barrier.barriers[0])||null;
    return top?norm_(top.evidence):'';
  }
  if(type==='action_impact'){const a=slide.actionImpact||{};return norm_(a.managementInsight);}
  if(type==='next')return plans&&plans.length?plans.length+' fokus sudah siap dipantau pada review berikutnya.':'';
  return '';
}

function formatRupiahShort_(n){
  n=num_(n); if(Math.abs(n)>=1e12)return 'Rp'+(n/1e12).toFixed(1).replace('.',',')+' T';
  if(Math.abs(n)>=1e9)return 'Rp'+(n/1e9).toFixed(1).replace('.',',')+' M';
  if(Math.abs(n)>=1e6)return 'Rp'+Math.round(n/1e6)+' jt'; return 'Rp'+Math.round(n);
}


function managementOverviewHeadline_(performance,product){
  const l=performance&&performance.latest||{},c=performance&&performance.comparison||{};
  const p=productLabel_(product);
  if(c.actual_growth_pct!=null&&c.actual_growth_pct>0.05)return p+' tumbuh '+pctText_(c.actual_growth_pct)+' dibanding bulan lalu; kualitas pertumbuhan perlu dilihat dari produktivitas dan ticket size.';
  if(c.actual_growth_pct!=null&&c.actual_growth_pct<-0.05)return p+' melemah '+pctText_(Math.abs(c.actual_growth_pct))+' dibanding bulan lalu; gap target perlu dibaca bersama kondisi tim dan pipeline.';
  if(l.attainment_pct!=null&&l.attainment_pct>=1)return p+' sudah mencapai target pada periode terakhir; fokus berikutnya menjaga kesinambungan hasil.';
  return p+' masih perlu diperkuat dari sisi realisasi, produktivitas, dan kualitas pipeline.';
}
function managementGrowthHeadline_(performance,product){
  const c=performance&&performance.comparison||{};
  const p=productLabel_(product);
  const parts=[];
  if(c.actual_growth_pct!=null)parts.push('realisasi '+(c.actual_growth_pct>=0?'naik ':'turun ')+pctText_(Math.abs(c.actual_growth_pct)));
  if(c.productivity_growth_pct!=null)parts.push('produktivitas '+(c.productivity_growth_pct>=0?'naik ':'turun ')+pctText_(Math.abs(c.productivity_growth_pct)));
  if(c.ticket_size_growth_pct!=null)parts.push('ticket size '+(c.ticket_size_growth_pct>=0?'naik ':'turun ')+pctText_(Math.abs(c.ticket_size_growth_pct)));
  return p+' — '+(parts.length?parts.join(', ')+'.':'Pertumbuhan bulanan belum cukup terbaca dari data periode yang tersedia.');
}
function managementClosedPipelineHeadline_(pipeline,product){
  const s=pipeline&&pipeline.closed&&pipeline.closed.summary||{};
  const p=productLabel_(product),stuck=num_(s.stuck_rp);
  if(s.incoming_rp)return p+' Agustus: Incoming '+moneyText_(s.incoming_rp)+', Cair '+moneyText_(s.cair_rp)+', dan '+moneyText_(stuck)+' masih tertahan sebagai Carry Over + Batal Cair.';
  return 'Pipeline '+p+' pada bulan sebelumnya belum memiliki data yang cukup untuk dibaca.';
}
function managementPipelineAnalysisHeadline_(pipeline,product){
  const p=productLabel_(product),d=(pipeline&&pipeline.closed&&pipeline.closed.detail)||[];
  let primary=d.find(x=>upper_(x.label)==='PENSIUN')||d.find(x=>upper_(x.label)==='MITRAGUNA')||d[0];
  if(primary&&num_(primary.incoming_rp)){
    const stuck=num_(primary.carry_over_rp)+num_(primary.batal_cair_rp);
    return 'Dari Incoming '+primary.label+' pada '+(pipeline.closed.month_key||'bulan sebelumnya')+', pipeline yang belum menjadi cair mencapai '+moneyText_(stuck)+' ('+pctText_(safeDiv_(stuck,primary.incoming_rp))+').';
  }
  const s=pipeline&&pipeline.closed&&pipeline.closed.summary||{};
  return s.incoming_rp?'Dari Incoming '+p+', pipeline yang belum menjadi cair mencapai '+moneyText_(s.stuck_rp)+' ('+pctText_(s.stuck_share_of_incoming)+').':'Analisa pipeline belum dapat dibentuk karena Incoming bulan sebelumnya belum tersedia.';
}
function managementCurrentPipelineHeadline_(pipeline,product){
  const s=pipeline&&pipeline.current&&pipeline.current.summary||{};
  const p=productLabel_(product);
  if(s.incoming_rp)return 'Pipeline '+p+' '+(pipeline.current.month_key||'bulan berjalan')+' perlu diarahkan dari Incoming menuju Akad dan Cair.';
  return 'Pipeline '+p+' bulan berjalan belum cukup terbentuk untuk membaca proyeksi.';
}
function managementResourcesHeadline_(capacity){
  const s=capacity&&capacity.summary||{};
  if(s.sf_fulfillment!=null&&s.sf_fulfillment<1)return 'Kapasitas SF baru memenuhi '+pctText_(s.sf_fulfillment)+' kebutuhan minimum; produktivitas menjadi penentu setelah kapasitas tersedia.';
  if(s.productivity_per_sf_rp!=null&&s.productivity_per_sf_rp<APP.RULES.PRODUCTIVITY_BASELINE)return 'Jumlah SF relatif mencukupi, tetapi produktivitas per SF masih menjadi ruang perbaikan utama.';
  return 'Tim relatif tersedia; perhatian berikutnya menjaga produktivitas dan pemerataan SF.';
}
function managementResourcesPipelineHeadline_(productContexts,capacity){
  const labels=(productContexts||[]).map(pc=>{
    const s=pc.pipeline?.closed?.summary||{};
    return `${productLabel_(pc.product)} cair ${moneyText_(s.cair_rp)} dari Incoming ${moneyText_(s.incoming_rp)}`;
  });
  const f=capacity?.summary?.sf_fulfillment;
  return labels.join(' · ')+(f!=null?' · Pemenuhan SF '+pctText_(f):'');
}
function managementPipelineDetailHeadline_(pipeline,product){
  const detail=pipeline?.closed?.detail||[];
  if(upper_(product)==='REGULER'){
    const pens=detail.find(x=>upper_(x.label)==='PENSIUN')||{},prap=detail.find(x=>/PRA/.test(upper_(x.label)))||{};
    return `Pensiun ${moneyText_(pens.incoming_rp)} Incoming dan Pra Pensiun ${moneyText_(prap.incoming_rp)} Incoming pada bulan sebelumnya.`;
  }
  const s=pipeline?.closed?.summary||{};
  return `Mitraguna ${moneyText_(s.incoming_rp)} Incoming dan ${moneyText_(s.cair_rp)} Cair pada bulan sebelumnya.`;
}
function managementRecommendationHeadline_(productContexts){
  const rec=[];
  (productContexts||[]).forEach(pc=>{
    const s=pc.pipeline?.current?.summary||{},c=pc.performance?.comparison||{};
    if(s.incoming_rp&&s.cair_rp<s.incoming_rp)rec.push('Penguatan pipeline menuju realisasi '+productLabel_(pc.product));
    if(s.batal_cair_rp>0)rec.push('Tindak lanjut pipeline yang sudah ada dan kasus prioritas '+productLabel_(pc.product));
    if(c.productivity_growth_pct!=null&&c.productivity_growth_pct<0)rec.push('Percepat proses dan perbaiki produktivitas '+productLabel_(pc.product));
  });
  return rec.slice(0,3).join(' · ')||'Fokus berikutnya menjaga pipeline, mempercepat proses menuju pencairan, dan memastikan kondisi tim mendukung target.';
}

function getStoryDraft(payload){
  const ctx=getStoryContext_(payload);
  const draft=buildPresentationDraft(Object.assign({},ctx.req,{skipRanking:true,presentationLite:true}));
  return {meta:{partner:ctx.req.partner,scopeType:ctx.scopeType,scopeId:ctx.scopeId,scopeName:ctx.scopeName,periodId:ctx.req.periodId,product:ctx.req.product},items:draft.storyItems||[]};
}

function saveStoryDraft(payload){
  const ctx=getStoryContext_(payload),partner=ctx.req.partner==='MANTAP'?'MANTAP':'BSI';
  const items=(payload&&payload.items)||[];
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.STORY_EDITOR); if(!sh) throw new Error('Sheet story editor belum tersedia.');
  items.forEach((it,idx)=>{
    const slideId=norm_(it.slide_id); if(!slideId) return;
    const key=[partner,ctx.req.periodId,ctx.req.product||'ALL',ctx.scopeType,ctx.scopeId,slideId].join('|');
    upsertByKey_(sh,'story_key',key,{
      story_key:key, period_id:ctx.req.periodId, product:ctx.req.product||'ALL', scope_type:ctx.scopeType, scope_id:ctx.scopeId, scope_name:ctx.scopeName,
      slide_id:slideId, slide_title:norm_(it.slide_title)||slideId, show_slide:upper_(it.show_slide||'YA')==='TIDAK'?'TIDAK':'YA',
      headline:norm_(it.headline), explanation:norm_(it.explanation), supporting_text:norm_(it.supporting_text), updated_at:new Date(), updated_by:getUserLabel_(), partner
    });
  });
  clearAppCache();
  return {ok:true,message:'Story editor '+(partner==='MANTAP'?'Bank Mantap':'BSI')+' tersimpan.',saved:items.length};
}


function getRhScopeForPeriod_(periodId){
  const all=getRoRhScopeCached_();
  const exact=all.filter(r=>norm_(r.period_id)===periodId);
  return exact.length?exact:getLatestRoRhScope_(all);
}

function buildRhRankingRows_(req){
  const cacheKey=cacheKey_('RH_RANK_V50',req.periodId,req.product,req.accessScopeCode||'ALL');
  const cached=cacheGetJson_(cacheKey);
  if(cached){const current=cached.rows.find(r=>norm_(r.rh_user_key)===norm_(req.rhUserKey))||null;return {rows:cached.rows,current,scope_mode:cached.scope_mode};}
  const scope=applyAccessToScopeRows_(getRhScopeForPeriod_(req.periodId),req);
  const areaRows=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const byArea={};areaRows.forEach(r=>byArea[r.area_id]=r);
  const groups={};
  scope.forEach(s=>{
    const rhKey=norm_(s.rh_user_key); if(!rhKey)return;
    if(!groups[rhKey])groups[rhKey]={rh_user_key:rhKey,rh_name:norm_(s.rh_name)||rhKey,ros:new Set(),areaIds:new Set()};
    const g=groups[rhKey]; if(s.filter_ro)g.ros.add(s.filter_ro); if(s.area_id)g.areaIds.add(s.area_id);
  });
  let rows=Object.values(groups).map(g=>{
    let target=0,achievement=0,sf=0;const areaNames=[];
    g.areaIds.forEach(id=>{const r=byArea[id];if(!r)return;target+=num_(r.target_rp);achievement+=num_(r.achievement_rp);sf+=num_(r.sf_active);if(r.area_name)areaNames.push(r.area_name)});
    const roNames=Array.from(g.ros);return {rh_user_key:g.rh_user_key,rh_name:g.rh_name,ro_name:roNames.join(' · '),area_count:g.areaIds.size,area_names:areaNames,target_rp:target,achievement_rp:achievement,attainment_pct:safeDiv_(achievement,target),sf_active:sf,productivity_per_sf_rp:safeDiv_(achievement,sf),status:target||achievement?'ACTIVE':'NO_DATA'};
  });
  rows.sort((a,b)=>b.attainment_pct-a.attainment_pct||b.achievement_rp-a.achievement_rp);assignRanks_(rows,'attainment_pct','rank_selindo');
  const scope_mode=getRoRhScopeCached_().some(r=>norm_(r.period_id)===req.periodId)?'PERIOD_SCOPE':'CURRENT_SCOPE_FALLBACK';
  cachePutJson_(cacheKey,{rows,scope_mode},300);
  const current=rows.find(r=>norm_(r.rh_user_key)===norm_(req.rhUserKey))||null;
  return {rows,current,scope_mode};
}

function rankingPeriodRequest_(req){
  const closed=nextPeriodId_(req.periodId,-1);
  const closedRows=req.partner==='MANTAP'?getMantapAreaRowsCached_(closed,req.product||'ALL'):getAreaRowsCached_(closed,req.product||'ALL');
  if(closedRows&&closedRows.length)return Object.assign({},req,{periodId:closed,ranking_period_id:closed,ranking_source_period_id:closed});
  const currentRows=req.partner==='MANTAP'?getMantapAreaRowsCached_(req.periodId,req.product||'ALL'):getAreaRowsCached_(req.periodId,req.product||'ALL');
  return Object.assign({},req,{ranking_period_id:req.periodId,ranking_source_period_id:currentRows&&currentRows.length?req.periodId:''});
}

function getRhRankingDetail(payload){
  const originalReq=normalizeFilters_(payload||{}),req=rankingPeriodRequest_(originalReq);
  if(req.partner==='MANTAP') return getMantapRhRankingDetail_(req);const rankReq=req;const rhKey=norm_(payload&&payload.rhUserKey);if(!rhKey)throw new Error('Region Head belum dipilih.');
  const baseReq=Object.assign({},rankReq,{roSource:'',rhUserKey:rhKey,areaId:''});
  const ranking=buildRhRankingRows_(baseReq);const profile=ranking.current||{};
  const history=getHistoryBundle(Object.assign({},originalReq,{roSource:'',rhUserKey:rhKey,areaId:''}));
  const periods=getAvailablePeriods_().map(x=>x.value).sort();
  const trend=(history.months||[]).map(m=>({month_num:m.month_num,month:m.month,target_rp:m.target_rp,actual_rp:m.actual_rp,attainment_pct:m.attainment_pct,productivity_per_sf_rp:m.productivity_per_sf_rp,sf_active:m.sf_active}));
  return {profile:{...profile,area_names:(profile.area_names||[]).slice(0,12)},trend,historySource:history.sourceNote||'',scopeMode:ranking.scope_mode};
}

function getRankSummary(payload){
  const originalReq=normalizeFilters_(payload||{}),req=rankingPeriodRequest_(originalReq);
  if(req.partner==='MANTAP') return getMantapRankSummary_(req);
  const fastKey=cacheKey_('RANK_SUMMARY_V50',req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const fastCached=cacheGetJson_(fastKey); if(fastCached)return fastCached;
  const allAreas=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const scopeAreas=filterScopeRows_(allAreas,req);
  const currentArea=scopeAreas[0]||null;
  const currentRo=req.roSource || (currentArea&&currentArea.ro_filter_group) || '';
  const roMap={};
  allAreas.forEach(r=>{
    const ro=norm_(r.ro_filter_group||r.ro_source)||'TANPA RO';
    if(!roMap[ro])roMap[ro]={ro_name:ro,target_rp:0,achievement_rp:0,area_count:0};
    roMap[ro].target_rp+=num_(r.target_rp); roMap[ro].achievement_rp+=num_(r.achievement_rp); roMap[ro].area_count++;
  });
  const roRows=Object.values(roMap); roRows.forEach(r=>r.attainment_pct=safeDiv_(r.achievement_rp,r.target_rp)); assignRanks_(roRows,'attainment_pct','rank_selindo'); roRows.sort((a,b)=>a.rank_selindo-b.rank_selindo);
  const scopeAreaRows=scopeAreas.slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  const currentRoRow=roRows.find(r=>norm_(r.ro_name)===norm_(currentRo))||null;
  const out={summary:{ro_current:currentRoRow,area_current:scopeAreaRows[0]||null,area_best:scopeAreaRows[0]||null,area_count_scope:scopeAreaRows.length,ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)},ro:{current:currentRoRow,top10:roRows.slice(0,10),all:roRows},area:{current:scopeAreaRows,top10:allAreas.slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999)).slice(0,10)},ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)};
  cachePutJson_(fastKey,out,300);
  return out;
}



/**
 * Lightweight ranking endpoint.
 * The modal no longer loads RO + Area + Cabang + Korea + SF + RH in one request.
 * Each tab is loaded only when selected and cached for a short period.
 */
function getRankingTab(payload){
  const originalReq=normalizeFilters_(payload||{}),req=rankingPeriodRequest_(originalReq);
  if(req.partner==='MANTAP') return getMantapRankingTab_(req,Object.assign({},payload||{},{periodId:req.periodId}));
  const tab=upper_(payload&&payload.tab||'RH').toLowerCase();
  const key=cacheKey_('RANK_TAB_V50',tab,req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const cached=cacheGetJson_(key); if(cached)return cached;
  let out;

  if(tab==='rh'){
    const rh=buildRhRankingRows_(req);
    out={tab:'rh',regionHead:{current:rh.current,all:rh.rows,scopeMode:rh.scope_mode},ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)};
  }else if(tab==='ro' || tab==='area'){
    const s=getRankSummary(payload);
    out={tab,summary:s.summary,ro:s.ro,area:s.area,ranking_period_id:s.ranking_period_id,ranking_period_label:s.ranking_period_label};
  }else if(tab==='branch'){
    out={tab:'branch',branch:buildRankingBranchTab_(req),ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)};
  }else if(tab==='sf'){
    out={tab:'sf',sf:buildRankingSfTab_(req),ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)};
  }else if(tab==='korea'){
    out={tab:'korea',korea:buildRankingKoreaTab_(req),ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)};
  }else{
    throw new Error('Tab ranking tidak dikenal: '+tab);
  }

  cachePutJson_(key,out,300);
  return out;
}

function buildRankingBranchTab_(req){
  const allAreas=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const scopeAreas=filterScopeRows_(allAreas,req);
  const areaIds=new Set(scopeAreas.map(r=>r.area_id));
  const allSource=readObjectsIfExists_(APP.SHEETS.RANK_BRANCH).filter(r=>norm_(r.period_id)===req.periodId);
  let allRows=aggregateBranchRankRows_(allSource,req.product);
  let scopeRows=allRows.filter(r=>!areaIds.size||areaIds.has(r.area_id));
  let mode='PRECOMPUTED';
  if(!scopeRows.length){
    mode='LIVE_FALLBACK';
    const live=buildLiveScopeBranchSf_(req.periodId,req.product,Array.from(areaIds));
    allRows=live.allBranches||[]; scopeRows=live.branches||[];
  }
  scopeRows.sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  return {top10:scopeRows.slice(0,10),all:scopeRows.slice(0,100),mode};
}

function buildRankingSfTab_(req){
  const allAreas=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const scopeAreas=filterScopeRows_(allAreas,req);
  const areaIds=new Set(scopeAreas.map(r=>r.area_id));
  const allSource=readObjectsIfExists_(APP.SHEETS.RANK_SF).filter(r=>norm_(r.period_id)===req.periodId);
  let allRows=aggregateSfRankRows_(allSource,req.product);
  let scopeRows=allRows.filter(r=>!areaIds.size||areaIds.has(r.area_id));
  let mode='PRECOMPUTED';
  if(!scopeRows.length){
    mode='LIVE_FALLBACK';
    const live=buildLiveScopeBranchSf_(req.periodId,req.product,Array.from(areaIds));
    allRows=live.allSfs||[]; scopeRows=live.sfs||[];
  }
  scopeRows.sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  return {top10:scopeRows.slice(0,10),all:scopeRows.slice(0,100),mode};
}

function buildRankingKoreaTab_(req){
  const allAreas=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const scopeAreas=filterScopeRows_(allAreas,req);
  const areaIds=new Set(scopeAreas.map(r=>r.area_id));
  const prefix=upper_(req.product||'ALL')==='REGULER'?'reg':(upper_(req.product||'ALL')==='MITRAGUNA'?'mtg':'all');
  let rows=readObjectsIfExists_(APP.SHEETS.RANK_KOREA)
    .filter(r=>norm_(r.period_id)===req.periodId&&(!areaIds.size||areaIds.has(norm_(r.area_id))))
    .map(r=>({nip_korea_key:norm_(r.nip_korea_key),nama_korea:norm_(r.nama_korea),area_name:norm_(r.area_name),rh_name:norm_(r.rh_name),rank_selindo:numOrNull_(r[prefix+'_rank_selindo']),achievement_rp:num_(r[prefix+'_achievement_rp']),attainment_pct:numOrNull_(r[prefix+'_attainment_pct'])}))
    .filter(r=>r.rank_selindo!=null)
    .sort((a,b)=>a.rank_selindo-b.rank_selindo);
  let mode='PRECOMPUTED';
  if(!rows.length){rows=buildLiveKoreaRankingRows_(req.periodId,req.product,areaIds);mode='LIVE_KOMPAS';}
  return {top10:rows.slice(0,10),all:rows.slice(0,100),mode};
}


function buildLiveKoreaRankingRows_(periodId,product,areaIds){
  const p=upper_(product||'ALL'),ids=areaIds||new Set(),areas=getAreaRowsCached_(periodId,'ALL'),areaByName={};areas.forEach(a=>areaByName[upper_(a.area_name)]=a);
  const sfTargets={};readSourceObjects_('KOMPAS_02').filter(r=>sourceMonthMatches_(r,periodId)).forEach(r=>{const kid=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA']));if(!kid)return;const prod=bsiLiveProductFromSf_(pick_(r,['JENIS_SF']));if(!sfTargets[kid])sfTargets[kid]={REGULER:0,MITRAGUNA:0};sfTargets[kid][prod]+=num_(pick_(r,['TARGET_OL_SF','TARGET_SF','TARGET']));});
  const rows=[];readSourceObjects_('KOMPAS_01').filter(r=>sourceMonthMatches_(r,periodId)).forEach(r=>{const area=norm_(pick_(r,['AREA','AREA_NAME'])),meta=areaByName[upper_(area)]||{},areaId=norm_(meta.area_id);if(ids.size&&(!areaId||!ids.has(areaId)))return;const kid=norm_(pick_(r,['NIP_KOREA_KEY','NIP_KOREA'])),regAch=num_(pick_(r,['CAIR_REGULER'])),mtgAch=num_(pick_(r,['CAIR_MITRAGUNA'])),regT=(sfTargets[kid]||{}).REGULER||0,mtgT=(sfTargets[kid]||{}).MITRAGUNA||0,ach=p==='REGULER'?regAch:(p==='MITRAGUNA'?mtgAch:regAch+mtgAch),tar=p==='REGULER'?regT:(p==='MITRAGUNA'?mtgT:regT+mtgT);rows.push({nip_korea_key:kid,nama_korea:norm_(pick_(r,['NAMA_KOREA'])),area_name:area,rh_name:norm_(meta.rh_names)||norm_(pick_(r,['REGION_HEAD'])),achievement_rp:ach,target_rp:tar,attainment_pct:tar?safeDiv_(ach,tar):null});});
  rows.sort((a,b)=>{const aa=a.attainment_pct==null?-1:a.attainment_pct,bb=b.attainment_pct==null?-1:b.attainment_pct;return bb-aa||b.achievement_rp-a.achievement_rp;});rows.forEach((r,i)=>r.rank_selindo=i+1);return rows;
}

function getRankingBundle(payload){
  const originalReq=normalizeFilters_(payload||{});
  const req=rankingPeriodRequest_(originalReq);
  const allAreas=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,req.product),req);
  const scopeAreas=filterScopeRows_(allAreas,req);
  const currentRo=req.roSource || (scopeAreas[0]&&scopeAreas[0].ro_filter_group) || '';
  const rhRanking=buildRhRankingRows_(req);
  const roMap={};
  allAreas.forEach(r=>{const ro=norm_(r.ro_filter_group||r.ro_source)||'TANPA RO';if(!roMap[ro])roMap[ro]={ro_name:ro,target_rp:0,achievement_rp:0,area_count:0};roMap[ro].target_rp+=num_(r.target_rp);roMap[ro].achievement_rp+=num_(r.achievement_rp);roMap[ro].area_count++;});
  const roRows=Object.values(roMap);roRows.forEach(r=>r.attainment_pct=safeDiv_(r.achievement_rp,r.target_rp));assignRanks_(roRows,'attainment_pct','rank_selindo');roRows.sort((a,b)=>a.rank_selindo-b.rank_selindo);
  const currentRoRow=roRows.find(r=>norm_(r.ro_name)===norm_(currentRo))||null;
  const areaRows=allAreas.slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  const scopeAreaRows=scopeAreas.slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  const areaIds=new Set(scopeAreas.map(r=>r.area_id));

  // Cabang: precomputed rows first; when product=ALL, combine Reguler+Mitraguna.
  const branchSource=readObjectsIfExists_(APP.SHEETS.RANK_BRANCH).filter(r=>norm_(r.period_id)===req.periodId&&(!areaIds.size||areaIds.has(norm_(r.area_id))));
  const branchAllSource=readObjectsIfExists_(APP.SHEETS.RANK_BRANCH).filter(r=>norm_(r.period_id)===req.periodId);
  let branchRows=aggregateBranchRankRows_(branchAllSource,req.product);
  let scopeBranchRows=branchRows.filter(r=>!areaIds.size||areaIds.has(r.area_id));
  let branchMode='PRECOMPUTED';
  if(!scopeBranchRows.length){
    branchMode='LAZY_FALLBACK';
    const live=buildLiveScopeBranchSf_(req.periodId,req.product,Array.from(areaIds));
    scopeBranchRows=live.branches;branchRows=live.allBranches||scopeBranchRows;
  }
  branchRows.forEach(r=>{r.rank_selindo=r.rank_selindo||null});
  scopeBranchRows.sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));

  // SF: same strategy, with product=ALL aggregated across products.
  const sfAllSource=readObjectsIfExists_(APP.SHEETS.RANK_SF).filter(r=>norm_(r.period_id)===req.periodId);
  let sfRows=aggregateSfRankRows_(sfAllSource,req.product);
  let scopeSfRows=sfRows.filter(r=>!areaIds.size||areaIds.has(r.area_id));
  let sfMode='PRECOMPUTED';
  if(!scopeSfRows.length){
    sfMode='LAZY_FALLBACK';
    const live=buildLiveScopeBranchSf_(req.periodId,req.product,Array.from(areaIds));
    scopeSfRows=live.sfs;sfRows=live.allSfs||scopeSfRows;
  }
  scopeSfRows.sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));

  const prefix=upper_(req.product||'ALL')==='REGULER'?'reg':(upper_(req.product||'ALL')==='MITRAGUNA'?'mtg':'all');
  const koreaRows=readObjectsIfExists_(APP.SHEETS.RANK_KOREA).filter(r=>norm_(r.period_id)===req.periodId&&(!areaIds.size||areaIds.has(norm_(r.area_id)))).map(r=>({nip_korea_key:norm_(r.nip_korea_key),nama_korea:norm_(r.nama_korea),area_name:norm_(r.area_name),rh_name:norm_(r.rh_name),rank_selindo:numOrNull_(r[prefix+'_rank_selindo']),achievement_rp:num_(r[prefix+'_achievement_rp']),attainment_pct:numOrNull_(r[prefix+'_attainment_pct'])})).filter(r=>r.rank_selindo!=null).sort((a,b)=>a.rank_selindo-b.rank_selindo);
  return {summary:{ro_current:currentRoRow,area_current:scopeAreaRows[0]||null,area_best:scopeAreaRows[0]||null,area_count_scope:scopeAreaRows.length,rh_current:rhRanking.current||null,ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)},ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId),regionHead:{current:rhRanking.current,all:rhRanking.rows,scopeMode:rhRanking.scope_mode},ro:{current:currentRoRow,top10:roRows.slice(0,10),all:roRows},area:{current:scopeAreaRows.slice(0,10),top10:areaRows.slice(0,10)},branch:{top10:scopeBranchRows.slice(0,10),all:scopeBranchRows,mode:branchMode},korea:{top10:koreaRows.slice(0,10)},sf:{top10:scopeSfRows.slice(0,10),all:scopeSfRows,mode:sfMode}};
}

function branchDisplayName_(r){
  return norm_(pick_(r,['BRANCH_NAME','NAMA_BRANCH','NAMA_CABANG','CABANG_NAME','CABANG','NAMA_UNIT','UNIT_NAME'])) || norm_(pick_(r,['BRANCH_ID','ID_BRANCH','UNIT_ID'])) || '—';
}
function getBranchNameMap_(periodId){
  const key=cacheKey_('BRANCH_NAME_MAP_V49',periodId||'ALL'),cached=cacheGetJson_(key);if(cached)return cached;
  const out={};
  ['KOMPAS_03','KOMPAS_02'].forEach(src=>{try{readSourceObjects_(src).forEach(r=>{if(periodId&&!sourceMonthMatches_(r,periodId))return;const id=norm_(pick_(r,['BRANCH_ID','ID_BRANCH','UNIT_ID','ID_UNIT'])),name=norm_(pick_(r,['NAMA_BRANCH','BRANCH_NAME','NAMA_CABANG','CABANG_NAME','CABANG','NAMA_UNIT','UNIT_NAME']));if(id&&name&&!out[id])out[id]=name;});}catch(err){}});
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);return out;
}
function canonicalBranchName_(r,nameMap){
  const branchId=norm_(pick_(r,['BRANCH_ID','ID_BRANCH','UNIT_ID','ID_UNIT']));
  const rawName=norm_(pick_(r,['BRANCH_NAME','NAMA_BRANCH','NAMA_CABANG','CABANG_NAME','CABANG','NAMA_UNIT','UNIT_NAME']));
  return rawName || (branchId&&nameMap&&nameMap[branchId]) || branchId || '—';
}
function aggregateBranchRankRows_(rows,product){
  const p=upper_(product||'ALL');const allowed=p==='ALL'?new Set(['REGULER','MITRAGUNA']):new Set([p]);const m={};
  const periodId=norm_((rows&&rows[0]&&rows[0].period_id)||''),nameMap=getBranchNameMap_(periodId);
  rows.forEach(r=>{if(!allowed.has(upper_(r.product)))return;const branchId=norm_(pick_(r,['BRANCH_ID','ID_BRANCH','UNIT_ID','ID_UNIT'])),branchName=canonicalBranchName_(r,nameMap),k=branchId||branchName;if(!k)return;if(!m[k])m[k]={branch_id:branchId,branch_name:branchName,area_id:norm_(r.area_id),area_name:norm_(r.area_name),target_team_rp:0,achievement_rp:0,sf_active:0,sf_green:0,sf_grey:0,sf_red:0,pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0};const x=m[k];if((!x.branch_name||x.branch_name==='—'||x.branch_name===x.branch_id)&&branchName)x.branch_name=branchName;x.target_team_rp+=num_(r.target_team_rp);x.achievement_rp+=num_(r.achievement_rp);x.sf_active+=num_(r.sf_active);x.sf_green+=num_(r.sf_green);x.sf_grey+=num_(r.sf_grey);x.sf_red+=num_(r.sf_red);x.pipeline_active_rp+=num_(r.pipeline_active_rp);x.carry_over_rp+=num_(r.carry_over_rp);x.batal_cair_rp+=num_(r.batal_cair_rp);});
  const out=Object.values(m);out.forEach(x=>x.attainment_pct=safeDiv_(x.achievement_rp,x.target_team_rp));assignRanks_(out,'attainment_pct','rank_selindo');return out;
}

function aggregateSfRankRows_(rows,product){
  const p=upper_(product||'ALL');const allowed=p==='ALL'?new Set(['REGULER','MITRAGUNA']):new Set([p]);const m={};
  const periodId=norm_((rows&&rows[0]&&rows[0].period_id)||''),nameMap=getBranchNameMap_(periodId);
  rows.forEach(r=>{if(!allowed.has(upper_(r.product)))return;const k=norm_(r.nip_sf_key);if(!k)return;const branchId=norm_(pick_(r,['BRANCH_ID','ID_BRANCH','UNIT_ID','ID_UNIT'])),branchName=canonicalBranchName_(r,nameMap);if(!m[k])m[k]={nip_sf_key:k,nama_sf:norm_(r.nama_sf),area_id:norm_(r.area_id),area_name:norm_(r.area_name),branch_id:branchId,branch_name:branchName,nama_korea:norm_(r.nama_korea),target_rp:0,achievement_rp:0,activity_count:0};const x=m[k];if((!x.branch_name||x.branch_name==='—'||x.branch_name===x.branch_id)&&branchName)x.branch_name=branchName;x.target_rp+=num_(r.target_rp);x.achievement_rp+=num_(r.achievement_rp);x.activity_count+=num_(r.activity_count);});
  const out=Object.values(m);out.forEach(x=>x.attainment_pct=safeDiv_(x.achievement_rp,x.target_rp));assignRanks_(out,'attainment_pct','rank_selindo');return out;
}
function getPresentationRankingSnapshot_(payload){
  const originalReq=normalizeFilters_(payload||{}),req=rankingPeriodRequest_(originalReq);if(req.partner==='MANTAP')return getMantapPresentationRankingSnapshot_(req);
  const sum=getRankSummary(req),rh=buildRhRankingRows_(req),areas=filterScopeRows_(getAreaRowsCached_(req.periodId,req.product),req).slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  const branch=buildRankingBranchTab_(req),korea=buildRankingKoreaTab_(req),sf=buildRankingSfTab_(req);
  return{period_id:req.periodId,period_label:periodLabel_(req.periodId),labels:{ro:'RO',branch:'Cabang',coordinator:'Korea',sf:'SF'},summary:{ro_current:sum.summary.ro_current||null,rh_current:rh.current||null,area_best:areas[0]||null,ro_total:(sum.ro.all||[]).length,rh_total:(rh.rows||[]).length,area_total:areas.length,branch_total:(branch.all||[]).length,korea_total:(korea.all||[]).length,sf_total:(sf.all||[]).length},ro:{all:(sum.ro.all||[])},rh:{all:(rh.rows||[])},area:{all:areas},branch:{all:(branch.all||[]).slice(0,30)},korea:{all:(korea.all||[]).slice(0,30)},sf:{all:(sf.all||[]).slice(0,30)}};
}
function getMantapPresentationRankingSnapshot_(req){
  const sum=getMantapRankSummary_(req),rh=getMantapRankingTab_(req,{tab:'RH'}),branch=getMantapRankingTab_(req,{tab:'BRANCH'}),sl=getMantapRankingTab_(req,{tab:'KOREA'}),sf=getMantapRankingTab_(req,{tab:'SF'}),areas=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req).slice().sort((a,b)=>(a.rank_selindo||9999)-(b.rank_selindo||9999));
  return{period_id:req.periodId,period_label:periodLabel_(req.periodId),labels:{ro:'Distribution',branch:'Unit',coordinator:'Sales Leader',sf:'SF'},summary:{ro_current:sum.summary.ro_current||null,rh_current:rh.regionHead&&rh.regionHead.current||null,area_best:areas[0]||null,ro_total:(sum.ro.all||[]).length,rh_total:(rh.regionHead&&rh.regionHead.all||[]).length,area_total:areas.length,branch_total:(branch.branch&&branch.branch.all||[]).length,korea_total:(sl.korea&&sl.korea.all||[]).length,sf_total:(sf.sf&&sf.sf.all||[]).length},ro:{all:sum.ro.all||[]},rh:{all:rh.regionHead&&rh.regionHead.all||[]},area:{all:areas},branch:{all:(branch.branch&&branch.branch.all||[]).slice(0,30)},korea:{all:(sl.korea&&sl.korea.all||[]).slice(0,30)},sf:{all:(sf.sf&&sf.sf.all||[]).slice(0,30)},mantap:true};
}



function buildLiveScopeBranchSf_(periodId,product,areaIds){
  const ids=new Set((areaIds||[]).filter(Boolean));const branches=[];const sfs=[];const allAreas=getAreaRowsCached_(periodId,'ALL');
  ids.forEach(areaId=>{try{const live=buildLiveBranchSf_(periodId,product,areaId);(live.branches||[]).forEach(x=>branches.push(x));(live.sfs||[]).forEach(x=>sfs.push(x));}catch(err){}});
  // Aggregate duplicate branch/SF rows across Areas and rank Selindo within the available live scope.
  const bm={};branches.forEach(r=>{const k=norm_(r.branch_id)||norm_(r.branch_name);if(!k)return;if(!bm[k])bm[k]={...r,target_team_rp:0,achievement_rp:0,sf_active:0,sf_green:0,sf_grey:0,sf_red:0,pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0};const x=bm[k];x.target_team_rp+=num_(r.target_team_rp);x.achievement_rp+=num_(r.achievement_rp);x.sf_active+=num_(r.sf_active);x.sf_green+=num_(r.sf_green);x.sf_grey+=num_(r.sf_grey);x.sf_red+=num_(r.sf_red);x.pipeline_active_rp+=num_(r.pipeline_active_rp);x.carry_over_rp+=num_(r.carry_over_rp);x.batal_cair_rp+=num_(r.batal_cair_rp);});
  const allB=Object.values(bm);allB.forEach(x=>x.attainment_pct=safeDiv_(x.achievement_rp,x.target_team_rp));assignRanks_(allB,'attainment_pct','rank_selindo');
  const sm={};sfs.forEach(r=>{const k=norm_(r.nip_sf_key);if(!k)return;if(!sm[k])sm[k]={...r,target_rp:0,achievement_rp:0};const x=sm[k];x.target_rp+=num_(r.target_rp);x.achievement_rp+=num_(r.achievement_rp);});const allS=Object.values(sm);allS.forEach(x=>x.attainment_pct=safeDiv_(x.achievement_rp,x.target_rp));assignRanks_(allS,'attainment_pct','rank_selindo');
  return {branches:allB.filter(r=>!ids.size||ids.has(r.area_id)),allBranches:allB,sfs:allS.filter(r=>!ids.size||ids.has(r.area_id)),allSfs:allS};
}



function publishPresentation(payload) {
  const draft=buildPresentationDraft(payload||{}), sh=getSpreadsheet_().getSheetByName(APP.SHEETS.VERSION);
  if(!sh)throw new Error('Sheet versi presentasi belum tersedia.');
  const now=new Date(), req=normalizeFilters_(payload||{}), scopeType=req.areaId?'AREA':(req.rhUserKey?'RH':(req.roSource?'RO':'SELINDO')), scopeId=req.areaId||req.rhUserKey||req.roSource||'SELINDO';
  const versionId='VER-'+Utilities.formatDate(now,getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','yyyyMMdd-HHmmss');
  const json=JSON.stringify(draft);
  if(json.length>49000)throw new Error('Snapshot presentasi terlalu besar. Pilih cakupan RH/Area atau kurangi fokus yang dibawa ke BSI.');
  sh.appendRow([versionId,req.periodId,scopeType,scopeId,draft.meta.scopeName,now,getUserLabel_(),json,'PUBLISHED']);
  return {ok:true,versionId,publishedAt:formatDateTime_(now),snapshot:draft};
}

function getPublishedPresentation(versionId) {
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.VERSION); if(!sh||sh.getLastRow()<2)return null;
  const rows=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
  for(let i=rows.length-1;i>=0;i--){if(versionId&&norm_(rows[i][0])!==norm_(versionId))continue;if(upper_(rows[i][8])!=='PUBLISHED')continue;try{return JSON.parse(String(rows[i][7]||''));}catch(err){}}
  return null;
}


function setConfigValue_(key,value){
  const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.APP_CONFIG);
  if(!sh)return false;
  const lc=sh.getLastColumn();if(lc<2)return false;
  const headers=sh.getRange(1,1,1,lc).getValues()[0].map(h=>norm_(h));
  const ki=headers.indexOf('pengaturan'),vi=headers.indexOf('nilai');if(ki<0||vi<0)return false;
  const lr=sh.getLastRow();
  if(lr>=2){
    const vals=sh.getRange(2,ki+1,lr-1,1).getValues();
    for(let i=0;i<vals.length;i++)if(norm_(vals[i][0])===key){sh.getRange(i+2,vi+1).setValue(value);return true;}
  }
  const row=new Array(lc).fill('');row[ki]=key;row[vi]=value;sh.appendRow(row);return true;
}
function checkBsiSourcePeriod_(periodId,mode){
  const keys=['KOMPAS_01','KOMPAS_02','KOMPAS_03','KOMPAS_04','KOMPAS_05_REG','KOMPAS_05_MTG','KOMPAS_06'];
  const checks=keys.map(key=>{const rows=readSourceObjects_(key);return{key,count:rows.filter(r=>sourceMonthMatches_(r,periodId)).length};});
  const required=mode==='CLOSED'?['KOMPAS_02','KOMPAS_04']:['KOMPAS_02','KOMPAS_05_REG','KOMPAS_05_MTG'];
  return{periodId,mode,checks,ready:required.every(k=>(checks.find(x=>x.key===k)||{}).count>0),missing:required.filter(k=>!(checks.find(x=>x.key===k)||{}).count)};
}
function warmRegionalBootstrapCaches_(periodId){
  const out={warmed:0,failed:[]};
  Object.keys(OVERVIEW_ACCESS).forEach(code=>{
    const def=OVERVIEW_ACCESS[code];
    if(!def||def.role!=='REGIONAL')return;
    ['BSI','MANTAP'].forEach(partner=>{
      try{
        getInitialBundle({
          partner,
          periodId,
          accessScopeCode:code,
          accessRole:def.role,
          accessLabel:def.label
        });
        out.warmed++;
      }catch(e){
        out.failed.push(def.label+' / '+partner+': '+e.message);
      }
    });
  });
  return out;
}

function getOverviewSourceReadiness_(){
  const current=currentPeriodId_(),closed=nextPeriodId_(current,-1),previous=nextPeriodId_(closed,-1),bsiClosed=checkBsiSourcePeriod_(closed,'CLOSED'),bsiCurrent=checkBsiSourcePeriod_(current,'CURRENT');
  let mantap={periods:[],achievementPeriods:[],latest:''};
  try{const src=getMantapSourceBundle_(),ps=new Set(),aps=new Set();[].concat(src.units||[],src.sfs||[],src.pipeline||[]).forEach(r=>{const p=mantapPeriod_(r);if(p)ps.add(p);});(src.achievement||[]).forEach(r=>{const p=mantapPeriod_(r);if(p){ps.add(p);aps.add(p);}});mantap.periods=Array.from(ps).sort();mantap.achievementPeriods=Array.from(aps).sort();mantap.latest=mantap.periods[mantap.periods.length-1]||'';}catch(e){mantap.error=e.message;}
  return{current,closed,previous,bsiClosed,bsiCurrent,mantap};
}
function menuCekKesiapanDataOverview(){
  const ui=SpreadsheetApp.getUi(),r=getOverviewSourceReadiness_(),lines=['Periode Review: '+periodLabel_(r.current),'Kinerja: '+periodLabel_(r.closed)+' vs '+periodLabel_(r.previous),'','BSI '+periodLabel_(r.closed)+': '+(r.bsiClosed.ready?'SIAP':'BELUM LENGKAP')+(r.bsiClosed.missing.length?' · kurang '+r.bsiClosed.missing.join(', '):''),'BSI '+periodLabel_(r.current)+' (pipeline): '+(r.bsiCurrent.ready?'SIAP':'BELUM LENGKAP')+(r.bsiCurrent.missing.length?' · kurang '+r.bsiCurrent.missing.join(', '):''),'','Mantap periode tersedia: '+(r.mantap.periods.join(', ')||'—'),'Mantap pencairan tersedia: '+(r.mantap.achievementPeriods.join(', ')||'—')];if(r.mantap.error)lines.push('Mantap error: '+r.mantap.error);ui.alert('Cek Kesiapan Data',lines.join('\n'),ui.ButtonSet.OK);return r;
}
function menuPerbaruiDataOverview(){
  resetRuntimeSourceCaches_(); clearAppCache();
  const ui=SpreadsheetApp.getUi(),ready=getOverviewSourceReadiness_(),current=ready.current,closed=ready.closed,previous=ready.previous;
  const confirmText='Periode Review: '+periodLabel_(current)+'\nKinerja: '+periodLabel_(closed)+' vs '+periodLabel_(previous)+'\nPipeline berjalan: '+periodLabel_(current)+'\n\nBSI closed month: '+(ready.bsiClosed.ready?'SIAP':'BELUM LENGKAP')+'\nMantap source: '+(ready.mantap.periods.join(', ')||'belum ada')+'\n\nLanjut perbarui snapshot manual dari sumber?';
  if(ui.alert('Perbarui Data Overview',confirmText,ui.ButtonSet.YES_NO)!==ui.Button.YES)return;
  const started=Date.now(),runId='MANUAL-'+Utilities.getUuid().slice(0,8),result={ok:true,current,closed,previous};
  // BSI: closed month dipersist dari Kompas supaya Overview tidak mundur ke Agustus.
  if(ready.bsiClosed.ready){
    try{result.bsi=persistBsiClosedMonthSnapshot_(closed);logRefresh_(runId,closed,'SYNC BSI CLOSED','SUCCESS',result.bsi.rowCount,started,'04_AREA_PERFORMANCE + 02_HISTORY_2026 diperbarui dari Kompas.');}
    catch(e){result.bsiError=e.message;logRefresh_(runId,closed,'SYNC BSI CLOSED','FAILED',0,started,e.message);}
  }else result.bsiError='Sumber BSI closed month belum lengkap: '+ready.bsiClosed.missing.join(', ');
  // Mantap: selalu rebuild SEMUA periode sumber agar history (Jul/Agu) tidak hilang ketika Sep ditarik.
  try{result.mantap=syncMantapData({periodId:''});}catch(e){result.mantapError=e.message;}
  setConfigValue_('periode_berjalan',current);
  setConfigValue_('periode_awal',current);
  clearAppCache();SpreadsheetApp.flush();
  const warm=warmRegionalBootstrapCaches_(current);result.warm=warm;
  const lines=['Periode Review: '+periodLabel_(current),'Kinerja: '+periodLabel_(closed)+' vs '+periodLabel_(previous),'','BSI: '+(result.bsiError?'GAGAL · '+result.bsiError:'SELESAI · '+result.bsi.rowCount+' baris Area/Product'),'Mantap: '+(result.mantapError?'GAGAL · '+result.mantapError:(result.mantap&&result.mantap.message||'SELESAI')),'','Cache Regional disiapkan: '+warm.warmed+(warm.failed.length?' · '+warm.failed.length+' gagal':''),'Silakan buka ulang Overview RH.'];
  ui.alert('Perbarui Data Overview Selesai',lines.join('\n'),ui.ButtonSet.OK);return result;
}

/** =========================
 *  REFRESH / SUMBER
 *  ========================= */

function resolveRefreshPeriod_(periodId) {
  periodId = norm_(periodId);
  if (periodId) {
    // Terima input standar YYYY-MM.
    if (/^\d{4}-\d{2}$/.test(periodId)) return periodId;
    // Toleransi untuk input tanggal penuh dari UI/manual copy-paste.
    const m = periodId.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (m) return m[1] + '-' + m[2];
    return periodId;
  }

  // Default: closed month berdasarkan tanggal hari ini.
  // Jika sekarang September 2026, otomatis memilih Agustus 2026.
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  first.setMonth(first.getMonth() - 1);
  return first.getFullYear() + '-' + String(first.getMonth() + 1).padStart(2, '0');
}

function ambilDataTerbaruManual() {
  return ambilDataTerbaru('');
}

function ambilDataTerbaru(periodId) {
  // Jika dijalankan langsung dari Apps Script tanpa argumen, gunakan closed month otomatis.
  // Contoh: saat September 2026 -> 2026-08.
  periodId = resolveRefreshPeriod_(periodId);
  if(!/^\d{4}-\d{2}$/.test(periodId))throw new Error('Periode harus menggunakan format YYYY-MM.');
  const runId='RUN-'+Utilities.getUuid().slice(0,8),started=Date.now(),monthKey=monthKeyFromPeriod_(periodId),checks=[];
  ['KOMPAS_01','KOMPAS_02','KOMPAS_03','KOMPAS_04','KOMPAS_05_REG','KOMPAS_05_MTG','KOMPAS_06'].forEach(key=>{
    const rows=readSourceObjects_(key); const count=rows.filter(r=>sourceMonthMatches_(r, periodId)).length; checks.push({key,count});
  });
  const missing=checks.filter(x=>['KOMPAS_02','KOMPAS_04'].includes(x.key)&&x.count===0);
  if(missing.length){logRefresh_(runId,periodId,'VALIDASI SUMBER','STOP',0,started,'Data inti belum tersedia: '+missing.map(x=>x.key).join(', '));return{ok:false,code:'SOURCE_NOT_READY',checks,message:'Data inti Kompas untuk periode ini belum lengkap. Snapshot lama tetap dipakai.'};}
  clearAppCache();
  logRefresh_(runId,periodId,'VALIDASI SUMBER','SUCCESS',checks.reduce((n,x)=>n+x.count,0),started,'Kompas terbaca. Rebuild snapshot produksi tetap membutuhkan Atlas period-valid dan target RH Command Center yang tervalidasi.');
  return{ok:true,code:'SOURCE_READY',checks,message:'Kompas 01–06 berhasil dibaca. Cache sudah dibersihkan. Snapshot produksi belum diganti otomatis sebelum mapping Atlas dan target periode tervalidasi.'};
}

function refreshRhccReferences_() {
  const cfg=readObjects_(APP.SHEETS.SOURCE_CONFIG).find(r=>upper_(r.source_key)==='RHCC');
  if(!cfg||!norm_(cfg.spreadsheet_id))throw new Error('Spreadsheet ID RH Command Center belum diisi pada 00_SOURCE_CONFIG.');
  const src=SpreadsheetApp.openById(norm_(cfg.spreadsheet_id));
  const required=['TARGET_RBB_AREA','WEB_DATA_MONTHLY','FACT_AREA_MONTHLY','PFM_AREA_OPPORTUNITY','GROWTH_BRANCH'];
  required.forEach(n=>{if(!src.getSheetByName(n))throw new Error('Sheet RH Command Center tidak ditemukan: '+n);});
  // V3 menyimpan snapshot referensi di database. Untuk mencegah overwrite salah struktur,
  // refresh otomatis penuh dilakukan setelah mapping field produk potensi dikonfirmasi.
  clearAppCache();
  return{ok:true,message:'Koneksi RH Command Center berhasil. Struktur sumber tersedia. Snapshot produk potensi belum dioverwrite otomatis sebelum mapping Reguler/Mitraguna/ASABRI dikonfirmasi.'};
}

function resetRuntimeSourceCaches_(){
  try{Object.keys(RUNTIME_SOURCE_OBJECTS_||{}).forEach(k=>delete RUNTIME_SOURCE_OBJECTS_[k]);}catch(e){}
  try{RUNTIME_SOURCE_CONFIG_=null;}catch(e){}
}
function getDataRevision_(){return PropertiesService.getScriptProperties().getProperty('CACHE_BUSTER')||'0';}
function clearAppCache() {
  resetRuntimeSourceCaches_();
  try{CacheService.getScriptCache().removeAll(['SCOPE_ROWS_V4','RO_RH_SCOPE_V4','RO_RH_SCOPE_V4_1']);}catch(err){}
  const rev=String(Date.now());
  PropertiesService.getScriptProperties().setProperty('CACHE_BUSTER',rev);
  return {ok:true,dataRevision:rev};
}

/** =========================
 *  FALLBACK CABANG/SF DARI KOMPAS
 *  ========================= */

function buildLiveBranchSf_(periodId, product, areaId) {
  const monthKey=monthKeyFromPeriod_(periodId),prod=upper_(product||'ALL');
  const allSfRaw=readSourceObjects_('KOMPAS_02').filter(r=>sourceMonthMatches_(r, periodId));
  const hppRaw=readSourceObjects_('KOMPAS_04').filter(r=>sourceMonthMatches_(r, periodId));
  function sfProduct_(jenis){return /MITRAGUNA|MTG|IMPLAN/.test(upper_(jenis))?'MITRAGUNA':'REGULER';}
  function includeProd_(p){return prod==='ALL'||p===prod;}
  function active_(r){const s=upper_(pick_(r,['STATUS_SYNC','STATUS_SF','STATUS']));return !s||/AKTIF|ACTIVE/.test(s);}
  const sfMaster=[];
  allSfRaw.forEach(r=>{if(!active_(r))return;const p=sfProduct_(pick_(r,['JENIS_SF']));if(!includeProd_(p))return;const key=norm_(pick_(r,['NIP_SF_KEY']));if(!key)return;sfMaster.push({nip_sf_key:key,nama_sf:norm_(pick_(r,['NAMA_SF'])),jenis_sf:norm_(pick_(r,['JENIS_SF'])),product:p,area_name:norm_(pick_(r,['AREA'])),branch_id:norm_(pick_(r,['BRANCH_ID','ID_BRANCH'])),branch_name:norm_(pick_(r,['NAMA_BRANCH','BRANCH_NAME','NAMA_CABANG','CABANG','NAMA_UNIT'])),nip_korea_key:norm_(pick_(r,['NIP_KOREA_KEY'])),nama_korea:norm_(pick_(r,['NAMA_KOREA'])),target_rp:p==='MITRAGUNA'?APP.RULES.SF_TARGET_MTG:APP.RULES.SF_TARGET_REG});});
  const ach={};
  hppRaw.forEach(r=>{const p=/MITRAGUNA|MTG|IMPLAN/.test(upper_(pick_(r,['SEGMEN_PRODUK','PRODUK','JENIS_PRODUK'])))?'MITRAGUNA':'REGULER';if(!includeProd_(p))return;const k=norm_(pick_(r,['NIP_SF_KEY']));if(!k)return;ach[k]=(ach[k]||0)+num_(pick_(r,['PLAFOND_CAIR','PLAFOND','NOMINAL_CAIR','CAIR']));});
  const national=sfMaster.map(s=>Object.assign({},s,{achievement_rp:ach[s.nip_sf_key]||0,attainment_pct:s.target_rp?(ach[s.nip_sf_key]||0)/s.target_rp:0}));assignRanks_(national,'attainment_pct','rank_selindo');
  const branchNat={};national.forEach(s=>{const k=s.branch_id||s.branch_name;if(!k)return;if(!branchNat[k])branchNat[k]={branch_id:s.branch_id,branch_name:s.branch_name,target_team_rp:0,achievement_rp:0};branchNat[k].target_team_rp+=s.target_rp;branchNat[k].achievement_rp+=s.achievement_rp;});
  const branchNational=Object.values(branchNat);branchNational.forEach(b=>b.attainment_pct=safeDiv_(b.achievement_rp,b.target_team_rp));assignRanks_(branchNational,'attainment_pct','rank_selindo');const bRank={};branchNational.forEach(b=>bRank[b.branch_id||b.branch_name]=b.rank_selindo);
  const areaRow=getAreaRowsCached_(periodId,'ALL').find(r=>r.area_id===areaId)||{},areaName=areaRow.area_name||'';
  const areaSf=national.filter(s=>upper_(s.area_name)===upper_(areaName));
  const pipeBySf={};const pipeSources=prod==='REGULER'?['KOMPAS_05_REG']:(prod==='MITRAGUNA'?['KOMPAS_05_MTG']:['KOMPAS_05_REG','KOMPAS_05_MTG']);
  pipeSources.forEach(src=>readSourceObjects_(src).forEach(r=>{if(!sourceMonthMatches_(r, periodId))return;if(upper_(pick_(r,['AREA']))!==upper_(areaName))return;const k=norm_(pick_(r,['NIP_SF_KEY']));if(!k)return;if(!pipeBySf[k])pipeBySf[k]={active:0,carry:0,batal:0};const n=num_(pick_(r,['PLAFOND_PIPELINE','PLAFOND','NOMINAL'])),ket=upper_([pick_(r,['KET']),pick_(r,['STAGE']),pick_(r,['DETAIL_KETERANGAN'])].join(' '));if(/BATAL/.test(ket))pipeBySf[k].batal+=n;else if(/CARRY\s*OVER|BERLANJUT/.test(ket))pipeBySf[k].carry+=n;else if(!/CAIR|REJECT/.test(ket))pipeBySf[k].active+=n;}));
  const actBySf={};try{readSourceObjects_('KOMPAS_06').forEach((r,i)=>{if(!sourceMonthMatches_(r, periodId))return;const k=norm_(pick_(r,['NIP_SF_KEY']));if(!k)return;if(!actBySf[k])actBySf[k]=new Set();actBySf[k].add(norm_(pick_(r,['ACTIVITY_ID','ID_ACTIVITY','TANGGAL','DATE']))||('ROW'+i));});}catch(err){}
  areaSf.forEach(s=>{const p=pipeBySf[s.nip_sf_key]||{};s.pipeline_active_rp=p.active||0;s.carry_over_rp=p.carry||0;s.batal_cair_rp=p.batal||0;s.activity_count=actBySf[s.nip_sf_key]?actBySf[s.nip_sf_key].size:0;s.sf_color=s.attainment_pct>=APP.RULES.SF_GREEN_MIN?'GREEN':(s.attainment_pct>=APP.RULES.SF_GREY_MIN?'GREY':'RED');});assignRanks_(areaSf,'attainment_pct','rank_area');
  const branches={};areaSf.forEach(s=>{const k=s.branch_id||s.branch_name;if(!k)return;if(!branches[k])branches[k]={period_id:periodId,product:prod,area_id:areaId,area_name:areaName,branch_id:s.branch_id,branch_name:s.branch_name,target_team_rp:0,achievement_rp:0,sf_active:0,sf_green:0,sf_grey:0,sf_red:0,pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0,status:'AVAILABLE'};const b=branches[k];b.target_team_rp+=s.target_rp;b.achievement_rp+=s.achievement_rp;b.sf_active++;b['sf_'+s.sf_color.toLowerCase()]++;b.pipeline_active_rp+=s.pipeline_active_rp;b.carry_over_rp+=s.carry_over_rp;b.batal_cair_rp+=s.batal_cair_rp;});
  const branchRows=Object.values(branches);branchRows.forEach(b=>{b.attainment_pct=safeDiv_(b.achievement_rp,b.target_team_rp);b.rank_selindo=bRank[b.branch_id||b.branch_name]||null;});assignRanks_(branchRows,'attainment_pct','rank_area');branchRows.sort((a,b)=>a.rank_area-b.rank_area);
  areaSf.forEach(s=>{const same=areaSf.filter(x=>(x.branch_id||x.branch_name)===(s.branch_id||s.branch_name));assignRanks_(same,'attainment_pct','rank_branch');s.rank_branch=(same.find(x=>x.nip_sf_key===s.nip_sf_key)||{}).rank_branch;s.period_id=periodId;s.product=prod;s.area_id=areaId;s.status='AVAILABLE';});
  return{branches:branchRows,sfs:areaSf};
}

function assignRanks_(rows,field,outField){const sorted=rows.slice().sort((a,b)=>num_(b[field])-num_(a[field]));let last=null,rank=0;sorted.forEach((r,i)=>{const v=num_(r[field]);if(last===null||v!==last)rank=i+1;r[outField]=rank;last=v;});}

/** =========================
 *  SCOPE / SUMMARY
 *  ========================= */

function filterScopeRows_(rows, req) {
  let out=applyAccessToAreaRows_(rows,req);
  if(req.roSource)out=out.filter(r=>upper_(r.ro_filter_group||r.ro_source)===upper_(req.roSource));
  if(req.rhUserKey){const ids=getAreaIdsForRh_(req.rhUserKey);out=out.filter(r=>ids.has(r.area_id));}
  if(req.areaId)out=out.filter(r=>r.area_id===req.areaId);
  applyScopeRanking_(out); return out;
}

function getScopeAreaNames_(req) {
  let rows=filterScopeRows_(getAreaRowsCached_(req.periodId,'ALL'),req);
  // Current-month pipeline (e.g. September) may not yet have a published AREA_PERFORMANCE snapshot.
  // Fall back to the latest available closed-month area scope so Kompas current-month data is still scoped correctly.
  if(!rows.length){
    for(let i=1;i<=12&&!rows.length;i++){
      const fallback=nextPeriodId_(req.periodId,-i);
      const candidate=filterScopeRows_(getAreaRowsCached_(fallback,'ALL'),req);
      if(candidate.length)rows=candidate;
    }
  }
  const set=new Set();rows.forEach(r=>set.add(upper_(r.area_name)));return set;
}

function summarizeAreas_(rows) {
  const s={target_rp:0,achievement_rp:0,sf_active:0,sf_green:0,sf_grey:0,sf_red:0,pipeline_active_rp:0,carry_over_rp:0,batal_cair_rp:0,open_opportunity_rp:0,min_sf_required:0,area_count:rows.length};
  let cov=0,covn=0,act=0,actn=0;
  rows.forEach(r=>{s.target_rp+=num_(r.target_rp);s.achievement_rp+=num_(r.achievement_rp);s.sf_active+=num_(r.sf_active);s.sf_green+=num_(r.sf_green);s.sf_grey+=num_(r.sf_grey);s.sf_red+=num_(r.sf_red);s.pipeline_active_rp+=num_(r.pipeline_active_rp);s.carry_over_rp+=num_(r.carry_over_rp);s.batal_cair_rp+=num_(r.batal_cair_rp);s.open_opportunity_rp+=num_(r.open_opportunity_rp);s.min_sf_required+=num_(r.min_sf_required);if(r.branch_coverage!=null){cov+=num_(r.branch_coverage);covn++;}if(r.korea_activity_rate!=null){act+=num_(r.korea_activity_rate);actn++;}});
  s.attainment_pct=safeDiv_(s.achievement_rp,s.target_rp);s.productivity_per_sf_rp=safeDiv_(s.achievement_rp,s.sf_active);s.pipeline_to_target=safeDiv_(s.pipeline_active_rp,s.target_rp);s.sf_fulfillment=safeDiv_(s.sf_active,s.min_sf_required);s.branch_coverage=covn?cov/covn:null;s.korea_activity_rate=actn?act/actn:null;return s;
}

function countQuadrants_(rows){const o={Q1:0,Q2:0,Q3:0,Q4:0,ND:0};rows.forEach(r=>{const q=Object.prototype.hasOwnProperty.call(o,r.quadrant_code)?r.quadrant_code:'ND';o[q]++;});return o;}
function applyScopeRanking_(rows){const s=rows.slice().sort((a,b)=>(b.attainment_pct==null?-1:b.attainment_pct)-(a.attainment_pct==null?-1:a.attainment_pct));let last=null,rank=0;s.forEach((r,i)=>{const v=r.attainment_pct==null?-Infinity:r.attainment_pct;if(last===null||v!==last)rank=i+1;r.rank_scope=rank;last=v;});}
function getAreaIdsForRh_(key){const set=new Set();getScopeRowsCached_().filter(r=>r.user_key===key).forEach(r=>set.add(r.area_id));return set;}
function getRhOptionsCached_(){const key='RH_OPTIONS_V3',c=cacheGetJson_(key);if(c)return c;const rows=readObjects_(APP.SHEETS.USER_ACCESS).filter(r=>upper_(r.role)==='RH').map(r=>({value:norm_(r.user_key),label:norm_(r.display_name),rhId:norm_(r.rh_id)})).filter(r=>r.value&&r.label).sort((a,b)=>a.label.localeCompare(b.label));cachePutJson_(key,rows,APP.CACHE_REFERENCE_TTL);return rows;}
function buildRhOptions_(rows){const m={};rows.filter(r=>r.role==='RH').forEach(r=>{if(!m[r.user_key])m[r.user_key]={value:r.user_key,label:r.display_name,rhId:''};});return Object.values(m).sort((a,b)=>a.label.localeCompare(b.label));}
function uniqueRoOptions_(rows){const s=new Set(rows.map(r=>norm_(r.ro_filter_group||r.ro_source)).filter(Boolean));return Array.from(s).sort().map(x=>({value:x,label:x}));}
function uniqueAreaOptions_(rows){return rows.slice().sort((a,b)=>a.area_name.localeCompare(b.area_name)).map(r=>({value:r.area_id,label:r.area_name}));}
function getScopeName_(req){if(req.areaId){const a=applyAccessToAreaRows_(getAreaRowsCached_(req.periodId,'ALL'),req).find(r=>r.area_id===req.areaId);return a?a.area_name:'Area';}if(req.rhUserKey){const r=getRhOptionsCached_().find(x=>x.value===req.rhUserKey);return r?r.label:'Region Head';}if(req.roSource)return req.roSource;if(req.accessRole==='REGIONAL'&&req.accessLabel)return req.accessLabel;return 'Selindo';}
function getAvailablePeriods_(){
  const current=currentPeriodId_(),key=cacheKey_('PERIOD_OPTIONS_V53',current),cached=cacheGetJson_(key);
  if(cached)return cached;
  const set=new Set();
  readObjectsIfExists_(APP.SHEETS.HISTORY_2026).forEach(r=>{const p=canonicalMonthKey_(r.period_id);if(/^\d{4}-(0[1-9]|1[0-2])$/.test(p))set.add(p);});
  readObjectsIfExists_(APP.SHEETS.AREA_PERF).forEach(r=>{const p=canonicalMonthKey_(r.period_id);if(/^\d{4}-(0[1-9]|1[0-2])$/.test(p))set.add(p);});
  const out=getDynamicPeriodOptions_(Array.from(set));
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);
  return out;
}
function getSnapshotMeta_(periodId){
  const key=cacheKey_('SNAPSHOT_META_V53',periodId),cached=cacheGetJson_(key);if(cached)return cached;
  const r=readObjectsIfExists_(APP.SHEETS.SNAPSHOT).filter(x=>norm_(x.period_id)===periodId).slice(-1)[0]||null;
  if(r)cachePutJson_(key,r,APP.CACHE_REFERENCE_TTL);
  return r;
}

/** =========================
 *  DATABASE / CACHE HELPERS
 *  ========================= */

function ensureRuntimeSheets_(ss) {
  const specs=[
    [APP.SHEETS.DEV_INPUT,['plan_id','period_id','user_key','scope_type','rh_id','rh_name','area_id','area_name','focus_title','analysis_condition','cause_text','strategy_rh','action_plan','target_result','pic','deadline','horizon_30_day','horizon_60_day','horizon_90_day','support_bsi','include_to_bsi','focus_order','approval_status','updated_at','updated_by','partner','how_to','development_progress','result_text','include_to_presentation']],
    [APP.SHEETS.VERSION,['version_id','period_id','scope_type','scope_id','scope_name','published_at','published_by','snapshot_json','status']],
    [APP.SHEETS.STORY_EDITOR,['story_key','period_id','product','scope_type','scope_id','scope_name','slide_id','slide_title','show_slide','headline','explanation','supporting_text','updated_at','updated_by','partner']],
    [APP.SHEETS.PROJECTION_INPUT,['projection_key','base_period_id','projection_period_id','next_projection_period_id','product','scope_type','scope_id','scope_name','projection_rp','next_projection_rp','driver_text','updated_at','updated_by','partner']],
    [APP.SHEETS.ACTION_MAP,['overview_rh_user_key','action_user_key','rh_name','active','note']],
    [APP.SHEETS.REFRESH_LOG,['waktu','run_id','periode','tahap','status','jumlah_baris','durasi_detik','catatan']],
    [APP.SHEETS.RANK_BRANCH,['period_id','product','area_id','area_name','branch_id','branch_name','rank_area','rank_area_pool','rank_selindo','rank_selindo_pool','target_team_rp','achievement_rp','attainment_pct','sf_active','sf_green','sf_grey','sf_red','pipeline_active_rp','carry_over_rp','batal_cair_rp','status']],
    [APP.SHEETS.RANK_SF,['period_id','product','area_id','area_name','branch_id','branch_name','nip_sf_key','nama_sf','jenis_sf','nip_korea_key','nama_korea','rank_branch','rank_area','rank_selindo','target_rp','achievement_rp','attainment_pct','sf_color','pipeline_active_rp','carry_over_rp','batal_cair_rp','activity_count','status']]
  ];
  specs.forEach(([name,headers])=>ensureSheetHeaders_(ss,name,headers));
}


function ensureActionPlanIntegration_(ss){
  const src=ss.getSheetByName(APP.SHEETS.SOURCE_CONFIG); if(src){
    const rows=[
      ['RH_ACTION_USERS','RH Action Plan Users',ACTION_PLAN_SOURCE_SS_ID,'RH_ASSESS_USERS','Y','Mapping user Action Plan RH','Read only · V4.7'],
      ['RH_ACTION_PLAN','RH Action Plan Partner',ACTION_PLAN_SOURCE_SS_ID,'RH_ASSESS_ACTION_PLAN_PARTNER','Y','Commitment Action Plan RH per mitra','Read only · V4.7'],
      ['RH_ACTION_REVIEW','RH Action Review Partner',ACTION_PLAN_SOURCE_SS_ID,'RH_ASSESS_ACTION_REVIEW_PARTNER','Y','Review D30/D60/D90 Action Plan RH','Read only · V4.7']
    ];
    const headers=src.getRange(1,1,1,src.getLastColumn()).getValues()[0].map(norm_),keyIx=headers.indexOf('source_key');const existing=keyIx>=0&&src.getLastRow()>1?src.getRange(2,keyIx+1,src.getLastRow()-1,1).getValues().flat().map(upper_):[];
    rows.forEach(row=>{if(!existing.includes(upper_(row[0])))src.appendRow(row);});
  }
  const sh=ss.getSheetByName(APP.SHEETS.ACTION_MAP); if(sh){
    const seeds=[['RH_RH0020','RH_AYU','Ayu Kusnandini','Y','Pilot mapping V4.7'],['RH_RH0019','RH_VERA','Vera Ariesta Dewi','Y','Pilot mapping V4.7'],['RH_RH0018','RH_NUR','Nur Noviyanti','Y','Pilot mapping V4.7']];
    const vals=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat().map(norm_):[];seeds.forEach(r=>{if(!vals.includes(r[0]))sh.appendRow(r);});
  }
  const contract=ss.getSheetByName('00_BACKEND_CONTRACT');
  if(contract&&contract.getLastRow()>=1){
    const services=contract.getLastRow()>1?contract.getRange(2,1,contract.getLastRow()-1,1).getValues().flat().map(norm_):[];
    if(!services.includes('getActionPlanImpactBundle'))contract.appendRow(['getActionPlanImpactBundle','Menu Hasil Action Plan RH dibuka','RH Action Plan + Overview/Kompas','Commitment → perkembangan → hasil + evaluasi RH']);
  }
}

let RUNTIME_SPREADSHEET_=null;
function getSpreadsheet_(){
  if(RUNTIME_SPREADSHEET_)return RUNTIME_SPREADSHEET_;
  const id=PropertiesService.getScriptProperties().getProperty(APP.PROP_SS_ID);
  if(id){RUNTIME_SPREADSHEET_=SpreadsheetApp.openById(id);return RUNTIME_SPREADSHEET_;}
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss)throw new Error('Spreadsheet database belum terhubung. Jalankan setupAplikasi() satu kali.');
  RUNTIME_SPREADSHEET_=ss;
  return ss;
}
const RUNTIME_INTERNAL_OBJECTS_={};
function readObjects_(sheetName){
  const key=String(sheetName||'');
  if(Object.prototype.hasOwnProperty.call(RUNTIME_INTERNAL_OBJECTS_,key))return RUNTIME_INTERNAL_OBJECTS_[key];
  const sh=getSpreadsheet_().getSheetByName(key);if(!sh)throw new Error('Sheet tidak ditemukan: '+key);
  RUNTIME_INTERNAL_OBJECTS_[key]=sheetToObjects_(sh);return RUNTIME_INTERNAL_OBJECTS_[key];
}
function readObjectsIfExists_(sheetName){
  const key=String(sheetName||'');
  if(Object.prototype.hasOwnProperty.call(RUNTIME_INTERNAL_OBJECTS_,key))return RUNTIME_INTERNAL_OBJECTS_[key];
  const sh=getSpreadsheet_().getSheetByName(key);if(!sh){RUNTIME_INTERNAL_OBJECTS_[key]=[];return RUNTIME_INTERNAL_OBJECTS_[key];}
  RUNTIME_INTERNAL_OBJECTS_[key]=sheetToObjects_(sh);return RUNTIME_INTERNAL_OBJECTS_[key];
}
function invalidateRuntimeInternal_(sheetName){if(sheetName)delete RUNTIME_INTERNAL_OBJECTS_[String(sheetName)];else Object.keys(RUNTIME_INTERNAL_OBJECTS_).forEach(k=>delete RUNTIME_INTERNAL_OBJECTS_[k]);}
function sheetToObjects_(sh){const lr=sh.getLastRow(),lc=sh.getLastColumn();if(lr<2||lc<1)return[];const v=sh.getRange(1,1,lr,lc).getValues(),h=v[0].map(norm_);return v.slice(1).filter(r=>r.some(x=>x!==''&&x!=null)).map(r=>{const o={};h.forEach((k,i)=>{if(k)o[k]=r[i];});return o;});}
const RUNTIME_SOURCE_OBJECTS_={};
let RUNTIME_SOURCE_CONFIG_=null;
function getSourceConfigRuntime_(){
  if(RUNTIME_SOURCE_CONFIG_)return RUNTIME_SOURCE_CONFIG_;
  RUNTIME_SOURCE_CONFIG_=readObjects_(APP.SHEETS.SOURCE_CONFIG);
  return RUNTIME_SOURCE_CONFIG_;
}
function readSourceObjects_(sourceKey){
  const key=upper_(sourceKey);
  if(Object.prototype.hasOwnProperty.call(RUNTIME_SOURCE_OBJECTS_,key))return RUNTIME_SOURCE_OBJECTS_[key];
  const c=getSourceConfigRuntime_().find(r=>upper_(r.source_key)===key);
  if(!c||upper_(c.aktif)!=='Y'){RUNTIME_SOURCE_OBJECTS_[key]=[];return RUNTIME_SOURCE_OBJECTS_[key];}
  if(!norm_(c.spreadsheet_id))throw new Error('Spreadsheet ID sumber belum diisi: '+sourceKey);
  const ss=SpreadsheetApp.openById(norm_(c.spreadsheet_id)),sh=ss.getSheetByName(norm_(c.sheet_name));
  if(!sh)throw new Error('Sheet sumber tidak ditemukan: '+sourceKey+' / '+c.sheet_name);
  RUNTIME_SOURCE_OBJECTS_[key]=sheetToObjects_(sh);
  return RUNTIME_SOURCE_OBJECTS_[key];
}
function upsertByKey_(sh,keyName,keyValue,rowObj){const lr=sh.getLastRow(),lc=sh.getLastColumn(),headers=sh.getRange(1,1,1,lc).getValues()[0].map(norm_),ix=headers.indexOf(keyName);if(ix<0)throw new Error('Kolom kunci tidak ditemukan: '+keyName);let target=lr+1;if(lr>=2){const vals=sh.getRange(2,ix+1,lr-1,1).getValues();for(let i=0;i<vals.length;i++){if(norm_(vals[i][0])===keyValue){target=i+2;break;}}}sh.getRange(target,1,1,lc).setValues([headers.map(h=>rowObj[h]==null?'':rowObj[h])]);}
function logRefresh_(runId,periodId,stage,status,rows,started,note){const sh=getSpreadsheet_().getSheetByName(APP.SHEETS.REFRESH_LOG);if(sh)sh.appendRow([new Date(),runId,periodId,stage,status,rows,Math.round((Date.now()-started)/1000),note||'']);}
function getConfigValue_(key,fallback){const r=readObjectsIfExists_(APP.SHEETS.APP_CONFIG).find(x=>norm_(x.pengaturan)===key);return r?r.nilai:fallback;}

function getRoRhScopeCached_(){const key='RO_RH_SCOPE_V4_1',c=cacheGetJson_(key);if(c)return c;const rows=readObjectsIfExists_(APP.SHEETS.RO_RH_SCOPE).map(r=>({period_id:norm_(r.period_id),filter_ro:norm_(r.filter_ro),source_ro:norm_(r.source_ro),rh_user_key:norm_(r.rh_user_key),rh_name:norm_(r.rh_name),area_id:norm_(r.area_id),area_name:norm_(r.area_name),scope_status:norm_(r.scope_status)})).filter(r=>r.area_id&&r.filter_ro);cachePutJson_(key,rows,APP.CACHE_REFERENCE_TTL);return rows;}
function buildRhOptionsFromRoScope_(rows){const m={};rows.forEach(r=>{if(r.rh_user_key&&!m[r.rh_user_key])m[r.rh_user_key]={value:r.rh_user_key,label:r.rh_name||r.rh_user_key,rhId:r.rh_user_key.replace('RH_','')};});return Object.values(m).sort((a,b)=>a.label.localeCompare(b.label));}
function uniqueRoOptionsFromScope_(rows){const s=new Set(rows.map(r=>r.filter_ro).filter(Boolean));return Array.from(s).sort().map(x=>({value:x,label:x}));}

function cacheKey_(){const parts=Array.prototype.slice.call(arguments).map(x=>norm_(x).replace(/[^A-Za-z0-9_-]/g,'_'));const b=PropertiesService.getScriptProperties().getProperty('CACHE_BUSTER')||'0';return 'V5:'+b+':'+parts.join(':');}
function cacheGetJson_(key){try{const x=CacheService.getScriptCache().get(key);return x?JSON.parse(x):null;}catch(err){return null;}}
function cachePutJson_(key,obj,ttl){try{const s=JSON.stringify(obj);if(s.length<95000)CacheService.getScriptCache().put(key,s,ttl||600);}catch(err){}}

/** =========================
 *  TEKS / ANGKA
 *  ========================= */

function normalizeFilters_(f){f=f||{};const rawPeriod=Object.prototype.hasOwnProperty.call(f,'periodId')?f.periodId:currentPeriodId_();const periodId=canonicalMonthKey_(rawPeriod)||currentPeriodId_();return{partner:upper_(f.partner||'BSI')||'BSI',periodId,product:upper_(f.product||'ALL')||'ALL',roSource:norm_(f.roSource),rhUserKey:norm_(f.rhUserKey),areaId:norm_(f.areaId),accessScopeCode:upper_(f.accessScopeCode),accessRole:upper_(f.accessRole),accessLabel:norm_(f.accessLabel)};}
function norm_(v){return v==null?'':String(v).trim();}
function upper_(v){return norm_(v).toUpperCase();}
function num_(v){if(v==null||v==='')return 0;if(typeof v==='number')return Number.isFinite(v)?v:0;const s=String(v).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0;}
function numOrNull_(v){return v==null||v===''?null:num_(v);}
function safeDiv_(a,b){return b?num_(a)/num_(b):0;}
function clean_(v,max){return norm_(v).replace(/[<>]/g,'').slice(0,max||2000);}
function pick_(o,aliases){const n={};Object.keys(o||{}).forEach(k=>n[upper_(k).replace(/[^A-Z0-9]+/g,'_')]=o[k]);for(const a of aliases){const k=upper_(a).replace(/[^A-Z0-9]+/g,'_');if(Object.prototype.hasOwnProperty.call(n,k))return n[k];}return '';}
function alertWeight_(level){const x=upper_(level);return x==='PERLU_TINDAKAN'?1:(x==='PERLU_DIJAGA'?2:3);}
function periodLabel_(p){if(!/^\d{4}-\d{2}$/.test(norm_(p)))return norm_(p);const [y,m]=p.split('-'),n=['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return n[Number(m)]+' '+y;}
function productLabel_(p){return upper_(p)==='REGULER'?'Reguler':(upper_(p)==='MITRAGUNA'?'Mitraguna':'Semua Produk');}
function formatDateTime_(d){return Utilities.formatDate(new Date(d),getSpreadsheet_().getSpreadsheetTimeZone()||'Asia/Jakarta','dd MMM yyyy HH:mm');}
function getUserLabel_(){return Session.getActiveUser().getEmail()||'Pengguna';}
function monthKeyFromPeriod_(p){
  p=norm_(p);
  if(!/^\d{4}-\d{2}$/.test(p))throw new Error('Periode harus menggunakan format YYYY-MM.');
  return p;
}

function canonicalMonthKey_(value){
  if(value instanceof Date && !isNaN(value.getTime())){
    return Utilities.formatDate(value, Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM');
  }
  const s=upper_(value).trim();
  if(!s)return '';
  const months={JAN:'01',JANUARI:'01',JANUARY:'01',FEB:'02',FEBRUARI:'02',FEBRUARY:'02',MAR:'03',MARET:'03',MARCH:'03',APR:'04',APRIL:'04',MEI:'05',MAY:'05',JUN:'06',JUNI:'06',JUNE:'06',JUL:'07',JULI:'07',JULY:'07',AGU:'08',AGS:'08',AGUSTUS:'08',AUG:'08',AUGUST:'08',SEP:'09',SEPT:'09',SEPTEMBER:'09',OKT:'10',OKTOBER:'10',OCT:'10',OCTOBER:'10',NOV:'11',NOVEMBER:'11',DES:'12',DESEMBER:'12',DEC:'12',DECEMBER:'12'};
  let m=s.match(/^(\d{4})[-\/.](\d{1,2})(?:[-\/.]\d{1,2})?$/); if(m)return m[1]+'-'+String(m[2]).padStart(2,'0');
  m=s.match(/^(\d{1,2})[-\/.](\d{4})$/); if(m)return m[2]+'-'+String(m[1]).padStart(2,'0');
  m=s.match(/^(\d{4})(\d{2})$/); if(m)return m[1]+'-'+m[2];
  m=s.match(/^([A-Z]+)[\s\-_/]*T?[\s\-_/]*(\d{4})$/); if(m&&months[m[1]])return m[2]+'-'+months[m[1]];
  m=s.match(/^(\d{4})[\s\-_/]*T?[\s\-_/]*([A-Z]+)$/); if(m&&months[m[2]])return m[1]+'-'+months[m[2]];
  const d=new Date(s); if(!isNaN(d.getTime()) && /\d{4}/.test(s))return Utilities.formatDate(d,Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM');
  return '';
}

function sourceMonthMatches_(row, periodId){
  const target=monthKeyFromPeriod_(periodId);
  const raw=pick_(row,['MONTH_KEY','PERIOD_ID','PERIODE','PERIODE_DATA','BULAN_KEY']);
  const normalized=canonicalMonthKey_(raw);
  if(normalized)return normalized===target;
  const dateRaw=pick_(row,['DATE','TANGGAL','TANGGAL_DATA','PROCESS_DATE','DATA_DATE']);
  const dateKey=canonicalMonthKey_(dateRaw);
  return dateKey===target;
}
function moneyText_(v){const n=num_(v);if(n>=1e12)return'Rp'+(n/1e12).toFixed(1).replace('.',',')+' T';if(n>=1e9)return'Rp'+(n/1e9).toFixed(1).replace('.',',')+' M';if(n>=1e6)return'Rp'+(n/1e6).toFixed(0)+' jt';return'Rp'+Math.round(n).toLocaleString('id-ID');}
function pctText_(v){return(num_(v)*100).toFixed(1).replace('.',',')+'%';}
function businessHeadline_(s){if(!s.area_count)return'Belum ada data pada cakupan ini.';if(s.attainment_pct>=1)return'Pencairan telah mencapai target; fokus berikutnya adalah menjaga kesinambungan pertumbuhan.';if(s.productivity_per_sf_rp<APP.RULES.PRODUCTIVITY_BASELINE)return'Pencairan masih tertahan oleh produktivitas tim dan pemerataan hasil antar Area.';return'Produktivitas relatif baik, namun pencairan wilayah masih belum mencapai target.';}
function quadrantHeadline_(q){const n=(q.Q3||0)+(q.Q4||0);return n?n+' Area masih membutuhkan perbaikan produktivitas atau kapasitas tim.':'Mayoritas Area berada pada kondisi yang relatif terjaga.';}
function potentialHeadline_(p){if(!p||!p.summary)return'Data potensi belum tersedia pada cakupan ini.';const s=p.summary;if(num_(s.reguler_open_rp)+num_(s.mitraguna_total_rp)+num_(s.asabri_total_rp)<=0)return'Data potensi belum tersedia pada cakupan ini.';if(p.sourceGranularity==='AREA_REGULER_ONLY')return'Potensi Reguler Area sudah terbaca; Mitraguna dan ASABRI tetap ditahan pada level RH agar tidak dialokasikan secara asumsi.';return'Ruang pertumbuhan kini dibaca dari potensi Reguler yang belum tergarap serta total potensi Mitraguna dan ASABRI pada sumber real per RH.';}
function capacityHeadline_(s){if(s.sf_fulfillment>=1&&s.productivity_per_sf_rp>=APP.RULES.PRODUCTIVITY_BASELINE)return'Jumlah SF dan produktivitas berada pada tingkat yang relatif memadai.';if(s.sf_fulfillment<1&&s.productivity_per_sf_rp>=APP.RULES.PRODUCTIVITY_BASELINE)return'Produktivitas baik, tetapi kapasitas SF masih perlu ditambah.';if(s.sf_fulfillment>=1)return'Jumlah SF relatif cukup, tetapi hasil per SF masih perlu ditingkatkan.';return'Kapasitas SF dan produktivitas sama-sama masih perlu diperkuat.';}
function barrierHeadline_(b){if(!b||!b.barriers||!b.barriers.length)return'Hambatan utama belum terdeteksi pada cakupan ini.';return b.barriers[0].title+' menjadi hambatan yang paling perlu diperhatikan saat ini.';}


/** =========================
 *  V4.8.2 — DATA HEALTH
 *  Mengukur kelengkapan sumber, bukan menilai performance RH.
 *  ========================= */
function getDataHealthBundle(payload){
  const req=normalizeFilters_(payload||{});
  const healthKey=cacheKey_('DATA_HEALTH_V54',req.partner,req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL');
  const healthCached=cacheGetJson_(healthKey);if(healthCached)return healthCached;
  const checks=[],warnings=[];
  let score=0,lastSync='',label='';
  if(req.partner==='MANTAP'){
    const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),s=aggregateMantapRows_(rows);
    const hasSnapshot=rows.length>0,hasSf=rows.some(r=>r.sf_active!=null),hasPipeline=rows.some(r=>r.pipeline_active_rp!=null),hasAch=s.achievement_available,achComplete=s.achievement_complete,achCoverage=s.achievement_coverage||0;
    const scopeRh=new Set(rows.map(r=>norm_(r.rh_user_keys)).filter(Boolean));
    const mapRows=readObjectsIfExists_(APP.SHEETS.MANTAP_RH_MAP).filter(r=>upper_(r.active||'Y')!=='N');
    const unmatched=mapRows.filter(r=>(upper_(r.mapping_method).indexOf('UNMATCHED')>=0||norm_(r.overview_rh_user_key).startsWith('MANTAP_RH_')) && (!scopeRh.size||scopeRh.has(norm_(r.overview_rh_user_key))));
    checks.push({key:'snapshot',label:'Snapshot Mantap',ok:hasSnapshot,note:hasSnapshot?rows.length+' Area/Product tersedia':'Belum ada snapshot pada filter ini'});if(hasSnapshot)score+=25;
    checks.push({key:'sf',label:'MASTER_SF',ok:hasSf,note:hasSf?fmtInt_(s.sf_active)+' SF terbaca':'SF belum terbaca'});if(hasSf)score+=20;
    checks.push({key:'pipeline',label:'MASTER_PIPELINE',ok:hasPipeline,note:hasPipeline?'Pipeline tersedia':'Pipeline belum tersedia'});if(hasPipeline)score+=20;
    checks.push({key:'achievement',label:'MASTER_ACHIEV',ok:hasAch,note:hasAch?(achComplete?'Pencairan tersedia di sebagian besar Area':'Pencairan tersedia sebagian · '+Math.round(achCoverage*100)+'% Area'):'Pencairan belum tersedia'});if(achComplete)score+=20;else if(hasAch){score+=10;warnings.push('Pencairan Bank Mantap baru tersedia sebagian; nominal aktual tetap ditampilkan sesuai source, produktivitas belum disimpulkan.');}else warnings.push('Pencairan Bank Mantap belum tersedia.');
    checks.push({key:'mapping',label:'Mapping RH',ok:unmatched.length===0,note:unmatched.length?unmatched.length+' mapping RH perlu review':'Mapping RH terpetakan'});if(unmatched.length===0)score+=15;else warnings.push('Masih ada mapping RH Mantap yang perlu dikunci.');
    const logs=readObjectsIfExists_(APP.SHEETS.MANTAP_SYNC_LOG);const last=logs.length?logs[logs.length-1]:null;lastSync=last&&last.finished_at?formatDateTime_(last.finished_at):'';
    label='Bank Mantap';
  }else{
    const closed=nextPeriodId_(req.periodId,-1),closedReq=Object.assign({},req,{periodId:closed}),rows=filterScopeRows_(getAreaRowsCached_(closed,req.product),closedReq),hasSnapshot=rows.length>0,hasActual=rows.some(r=>r.achievement_rp!=null),hasSf=rows.some(r=>r.sf_active!=null);
    let hasPipeline=false;try{const pr=checkBsiSourcePeriod_(req.periodId,'CURRENT');hasPipeline=pr.ready;}catch(e){}
    checks.push({key:'snapshot',label:'Data Bulan Selesai',ok:hasSnapshot,note:hasSnapshot?rows.length+' Area · '+periodLabel_(closed):'Belum ada data '+periodLabel_(closed)});if(hasSnapshot)score+=25;
    checks.push({key:'actual',label:'Pencairan / HPP',ok:hasActual,note:hasActual?'Pencairan '+periodLabel_(closed)+' tersedia':'Pencairan bulan selesai belum tersedia'});if(hasActual)score+=25;else warnings.push('Pencairan '+periodLabel_(closed)+' belum tersedia.');
    checks.push({key:'sf',label:'MASTER_SF',ok:hasSf,note:hasSf?'Data SF bulan selesai tersedia':'Data SF belum tersedia'});if(hasSf)score+=20;
    checks.push({key:'pipeline',label:'Pipeline Bulan Berjalan',ok:hasPipeline,note:hasPipeline?'Pipeline '+periodLabel_(req.periodId)+' tersedia':'Pipeline bulan berjalan belum lengkap'});if(hasPipeline)score+=20;
    const snap=getSnapshotMeta_(closed);const snapOk=!!snap||rows.some(r=>upper_(r.status)==='LIVE_KOMPAS');checks.push({key:'meta',label:'Status Pembaruan',ok:snapOk,note:snapOk?'Data '+periodLabel_(closed)+' sudah diperbarui':'Jalankan Perbarui Data Overview'});if(snapOk)score+=10;
    const logs=readObjectsIfExists_(APP.SHEETS.REFRESH_LOG).filter(r=>canonicalMonthKey_(r.periode)===closed);const last=logs.length?logs[logs.length-1]:null;lastSync=last&&last.waktu?formatDateTime_(last.waktu):'';
    label='BSI';
  }
  const status=score>=90?'LENGKAP':score>=70?'CUKUP':'PERLU PERHATIAN';
  const out={partner:req.partner,partnerLabel:label,periodId:req.periodId,score,status,checks,warnings,lastSync,generatedAt:formatDateTime_(new Date())};
  cachePutJson_(healthKey,out,Math.min(APP.CACHE_AREA_TTL,600));
  return out;
}

/** =========================
 *  V4.8 — BANK MANTAP MULTI-PARTNER ENGINE
 *  ========================= */
function ensureMantapIntegration_(ss){
  const defs={};
  defs[APP.SHEETS.MANTAP_AREA_PERF]=['period_id','product','area_id','area_name','distribution','rh_user_key','rh_name','sf_active','sl_active','unit_total','unit_covered','branch_coverage','pipeline_active_rp','hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp','achievement_rp','achievement_noa','achievement_available','productivity_per_sf_rp','status','source_note','synced_at'];
  defs[APP.SHEETS.MANTAP_RH_MONTHLY]=['period_id','product','distribution','rh_user_key','rh_name','area_count','unit_total','unit_covered','sf_active','sl_active','pipeline_active_rp','hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp','achievement_rp','achievement_noa','achievement_available','productivity_per_sf_rp','synced_at'];
  defs[APP.SHEETS.MANTAP_SL_PERF]=['period_id','nip_sl','nama_sl','role_sl','status_sl','distribution','rh_user_key','rh_name','unit_covered','sf_active','pipeline_active_rp','pipeline_noa','achievement_rp','achievement_noa','synced_at'];
  defs[APP.SHEETS.MANTAP_SF_PERF]=['period_id','nip_sf','sales_code','nama_sf','jenis_sf','status_sf','unit_id','nama_unit','area_name','distribution','nip_sl','nama_sl','rh_user_key','rh_name','pipeline_active_rp','pipeline_noa','achievement_rp','achievement_noa','synced_at'];
  defs[APP.SHEETS.MANTAP_PIPELINE]=['period_id','id_pengajuan','kode_pengajuan','nip_sf','nama_sf','unit_id','nama_unit','nip_sl','nama_sl','area_name','distribution','rh_user_key','rh_name','product','status_pipeline','status_final','plafond_rp','tgl_cair','synced_at'];
  defs[APP.SHEETS.MANTAP_SYNC_LOG]=['sync_id','started_at','finished_at','period_request','periods_synced','unit_rows','sl_rows','sf_rows','pipeline_rows','achievement_rows','status','note','synced_by'];
  defs[APP.SHEETS.MANTAP_RH_MAP]=['source_rh_key','source_rh_name','overview_rh_user_key','overview_rh_name','mapping_method','active'];
  Object.keys(defs).forEach(name=>ensureSheetHeaders_(ss,name,defs[name]));
  const src=ss.getSheetByName(APP.SHEETS.SOURCE_CONFIG);
  if(src){
    const h=src.getRange(1,1,1,src.getLastColumn()).getValues()[0].map(norm_);
    const keyIx=h.indexOf('source_key');
    let found=false;
    if(keyIx>=0&&src.getLastRow()>1){src.getRange(2,keyIx+1,src.getLastRow()-1,1).getValues().forEach(v=>{if(upper_(v[0])==='MANTAP_DB')found=true;});}
    if(!found){const row={source_key:'MANTAP_DB',nama_sumber:'DATABASE BANK MANTAP CLEANSING',spreadsheet_id:MANTAP_SOURCE_SS_ID,sheet_name:'MULTI_TABLE',aktif:'Y',fungsi:'Unit, SL, SF, Pipeline, Achievement Bank Mantap',catatan:'Tarik melalui syncMantapData / menu Overview RH.'};src.appendRow(h.map(k=>row[k]==null?'':row[k]));}
  }
}
function ensureSheetHeaders_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);else{const cur=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0].map(norm_);if(headers.some((x,i)=>cur[i]!==x)){sh.getRange(1,1,1,headers.length).setValues([headers]);}}return sh;}
function replaceSheetObjects_(sh,headers,objects){sh.clearContents();sh.getRange(1,1,1,headers.length).setValues([headers]);if(objects&&objects.length){const vals=objects.map(o=>headers.map(h=>o[h]==null?'':o[h]));sh.getRange(2,1,vals.length,headers.length).setValues(vals);}sh.setFrozenRows(1);}
function menuPreviewMantapSync(){const ui=SpreadsheetApp.getUi();const a=ui.prompt('Cek Data Mantap Sebelum Tarik','Periode YYYY-MM. Kosongkan untuk seluruh periode yang tersedia.',ui.ButtonSet.OK_CANCEL);if(a.getSelectedButton()!==ui.Button.OK)return;try{const r=previewMantapSync({periodId:norm_(a.getResponseText())});ui.alert(r.message+'\n\n'+JSON.stringify(r.summary,null,2));}catch(e){ui.alert('Cek data Mantap gagal:\n'+e.message);}}
function menuSyncMantapData(){const ui=SpreadsheetApp.getUi();const a=ui.alert('Perbarui Data Bank Mantap','Sistem akan membaca ulang seluruh periode yang tersedia pada DATABASE_BANK_MANTAP_CLEANSING agar histori pencairan tidak hilang. Lanjutkan?',ui.ButtonSet.YES_NO);if(a!==ui.Button.YES)return;try{const r=syncMantapData({periodId:''});ui.alert(r.message);}catch(e){ui.alert('Perbarui data Mantap gagal:\n'+e.message);}}
function readMantapSourceObjects_(sheetName,sourceSs){const ss=sourceSs||SpreadsheetApp.openById(MANTAP_SOURCE_SS_ID),sh=ss.getSheetByName(sheetName);if(!sh)throw new Error('Sheet Mantap tidak ditemukan: '+sheetName);return sheetToObjects_(sh);}
function getMantapSourceBundle_(forceFresh){
  const key=cacheKey_('MANTAP_SOURCE_RAW_V52');
  if(!forceFresh){const c=cacheGetJson_(key);if(c)return c;}
  const ss=SpreadsheetApp.openById(MANTAP_SOURCE_SS_ID);
  const out={units:readMantapSourceObjects_('MASTER_UNIT',ss),sls:readMantapSourceObjects_('MASTER_SL',ss),sfs:readMantapSourceObjects_('MASTER_SF',ss),pipeline:readMantapSourceObjects_('MASTER_PIPELINE',ss),achievement:readMantapSourceObjects_('MASTER_ACHIEV',ss)};
  cachePutJson_(key,out,300);
  return out;
}
function mantapPeriod_(r){return canonicalMonthKey_(pick_(r,['MONTH_KEY','period_id','PERIOD_ID','PERIODE']));}
function mantapNameKey_(v){return upper_(v).replace(/[^A-Z0-9]/g,'');}
function mantapAutoRhResolver_(){
  const access=readObjectsIfExists_(APP.SHEETS.USER_ACCESS).filter(r=>upper_(r.role)==='RH'),byName={};
  access.forEach(r=>{const k=mantapNameKey_(r.display_name);if(k)byName[k]={key:norm_(r.user_key),name:norm_(r.display_name)};});
  const aliases={
    DIANPRAJAAIDILADHA:'DIANP',MVILLARHALIMWARDANA:'MVILLAR',GANIWIHARSO:'GANIW',HERPAWENANG:'HERPA',
    NURACHLISANDARW:'NURACHLISA',MAREZZAPUTRIANGGREANI:'MAREZZA',SUGIHARTONO:'SUGIH',MOCHAMADNOOR:'MNOOR',
    BUDHIDHARMAWAN:'BUDHID',AWALUDDINNLAUNDU:'AWALUDDIN'
  };
  return function(name){
    const nk=mantapNameKey_(name),exact=byName[nk],alias=byName[aliases[nk]||''],m=exact||alias;
    return m?{key:m.key,name:m.name,method:exact?'EXACT_NAME':'ALIAS'}:{key:'MANTAP_RH_'+nk.slice(0,28),name:norm_(name)||'Region Head',method:'UNMATCHED_SYNTHETIC'};
  };
}
function mantapRhMap_(){
  // Mapping sheet is authoritative when a row has been manually/explicitly mapped to an Overview RH key.
  const existing=readObjectsIfExists_(APP.SHEETS.MANTAP_RH_MAP),locked={};
  existing.forEach(r=>{
    const sk=norm_(r.source_rh_key)||mantapNameKey_(r.source_rh_name),ok=norm_(r.overview_rh_user_key),method=upper_(r.mapping_method),active=upper_(r.active||'Y')!=='N';
    if(!sk||!ok||!active)return;
    const isReal=!ok.startsWith('MANTAP_RH_');
    if(isReal||method.indexOf('MANUAL')>=0||method.indexOf('LOCKED')>=0)locked[sk]={key:ok,name:norm_(r.overview_rh_name)||norm_(r.source_rh_name),method:method||'MAPPING_SHEET'};
  });
  const auto=mantapAutoRhResolver_();
  return function(name){const nk=mantapNameKey_(name);return locked[nk]||auto(name);};
}
function buildMantapRhMapRows_(src){
  const auto=mantapAutoRhResolver_(),existing=readObjectsIfExists_(APP.SHEETS.MANTAP_RH_MAP),oldByKey={};
  existing.forEach(r=>{const k=norm_(r.source_rh_key)||mantapNameKey_(r.source_rh_name);if(k)oldByKey[k]=r;});
  const names=new Set();[src.units,src.sls,src.sfs,src.pipeline].forEach(a=>(a||[]).forEach(r=>{if(norm_(r.REGION_HEAD))names.add(norm_(r.REGION_HEAD));}));
  return Array.from(names).sort().map(name=>{
    const nk=mantapNameKey_(name),old=oldByKey[nk]||{},oldKey=norm_(old.overview_rh_user_key),oldMethod=upper_(old.mapping_method),oldActive=upper_(old.active||'Y')!=='N';
    const oldIsAuthoritative=oldActive&&oldKey&&(!oldKey.startsWith('MANTAP_RH_')||oldMethod.indexOf('MANUAL')>=0||oldMethod.indexOf('LOCKED')>=0);
    if(oldIsAuthoritative)return{source_rh_key:nk,source_rh_name:name,overview_rh_user_key:oldKey,overview_rh_name:norm_(old.overview_rh_name)||name,mapping_method:oldMethod||'MAPPING_SHEET',active:'Y'};
    const m=auto(name);return{source_rh_key:nk,source_rh_name:name,overview_rh_user_key:m.key,overview_rh_name:m.name,mapping_method:m.method,active:'Y'};
  });
}
function mantapProductKey_(v){const x=upper_(v);if(/KMPP|PRA\s*PENSIUN/.test(x))return'KMPP';if(/KMP|PENSIUN/.test(x))return'KMP';return'ALL';}
function mantapStatusKey_(r){const x=upper_(pick_(r,['STATUS_FINAL','STATUS_PIPELINE']));if(x==='DIPROSES'||x==='PROSES'||x==='ANALISA')return'PROSES';if(x==='REJECT'||x==='BATAL'||x==='BATAL CAIR')return'REJECT';return x||'UNKNOWN';}
function mantapAreaId_(distribution,rhName,area){return'MTA_'+mantapNameKey_(distribution+'_'+rhName+'_'+area).slice(0,55);}
function buildMantapSnapshotData_(opt){
  opt=opt||{};const src=getMantapSourceBundle_(!!opt.forceFresh),mapRh=mantapRhMap_();
  let periods=[];[src.units,src.sfs,src.pipeline,src.achievement].forEach(arr=>(arr||[]).forEach(r=>{const p=mantapPeriod_(r);if(p&&!periods.includes(p))periods.push(p);}));periods.sort();if(opt.periodId)periods=periods.filter(p=>p===opt.periodId);
  const now=new Date(),areaMap={},slMap={},sfMap={},pipeDetail=[];const unitById={},sfById={};
  (src.units||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;const unitId=norm_(r.UNIT_ID),rh=mapRh(r.REGION_HEAD);unitById[p+'|'+unitId]={area:norm_(r.AREA),distribution:norm_(r.DISTRIBUTION),rh};});
  (src.sfs||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;const id=norm_(r.NIP_SF),rh=mapRh(r.REGION_HEAD);if(id)sfById[p+'|'+id]={area:norm_(r.AREA),distribution:norm_(r.DISTRIBUTION),rh,unitId:norm_(r.UNIT_ID)};});
  function areaGroup(p,product,distribution,rh,area){const k=[p,product,distribution,rh.key,area].join('|');if(!areaMap[k])areaMap[k]={period_id:p,product,area_id:mantapAreaId_(distribution,rh.name,area),area_name:area,distribution,rh_user_key:rh.key,rh_name:rh.name,sfSet:{},slSet:{},unitSet:{},coveredSet:{},pipeline_active_rp:0,hot_rp:0,incoming_rp:0,process_rp:0,akad_rp:0,cair_pipeline_rp:0,reject_rp:0,achievement_rp:0,achievement_noa:0,achievement_available:false};return areaMap[k];}
  function groupsFor(p,prod,distribution,rh,area){const all=areaGroup(p,'ALL',distribution,rh,area);if(prod&&prod!=='ALL')return[all,areaGroup(p,prod,distribution,rh,area)];return[all];}
  (src.units||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;const rh=mapRh(r.REGION_HEAD),area=norm_(r.AREA)||'AREA BELUM TERPETAKAN',dist=norm_(r.DISTRIBUTION)||'DISTRIBUTION BELUM TERPETAKAN',u=norm_(r.UNIT_ID),sl=norm_(r.NIP_SL);['ALL','KMP','KMPP'].forEach(prod=>{const g=areaGroup(p,prod,dist,rh,area);if(u)g.unitSet[u]=1;if(num_(r.JML_SF_AKTIF)>0&&u)g.coveredSet[u]=1;if(sl)g.slSet[sl]=1;});});
  (src.sfs||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;if(upper_(r.STATUS_SF)&&upper_(r.STATUS_SF)!=='AKTIF')return;const rh=mapRh(r.REGION_HEAD),area=norm_(r.AREA)||'AREA BELUM TERPETAKAN',dist=norm_(r.DISTRIBUTION)||'DISTRIBUTION BELUM TERPETAKAN',sfid=norm_(r.NIP_SF),slid=norm_(r.NIP_SL);['ALL','KMP','KMPP'].forEach(prod=>{const g=areaGroup(p,prod,dist,rh,area);if(sfid)g.sfSet[sfid]=1;if(slid)g.slSet[slid]=1;});});
  (src.pipeline||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;let rh=mapRh(r.REGION_HEAD),area=norm_(r.AREA),dist=norm_(r.DISTRIBUTION);const sfref=sfById[p+'|'+norm_(r.NIP_SF)],uref=unitById[p+'|'+norm_(r.UNIT_ID)];if((!area||!dist)&&sfref){area=area||sfref.area;dist=dist||sfref.distribution;rh=sfref.rh||rh;}if((!area||!dist)&&uref){area=area||uref.area;dist=dist||uref.distribution;rh=uref.rh||rh;}area=area||'AREA BELUM TERPETAKAN';dist=dist||'DISTRIBUTION BELUM TERPETAKAN';const prod=mantapProductKey_(r.PRODUK),status=mantapStatusKey_(r),amount=num_(r.PLAFOND_PENGAJUAN);groupsFor(p,prod,dist,rh,area).forEach(g=>{if(['HOT','INCOMING','PROSES','AKAD'].includes(status))g.pipeline_active_rp+=amount;if(status==='HOT')g.hot_rp+=amount;if(status==='INCOMING')g.incoming_rp+=amount;if(status==='PROSES')g.process_rp+=amount;if(status==='AKAD')g.akad_rp+=amount;if(status==='CAIR')g.cair_pipeline_rp+=amount;if(status==='REJECT')g.reject_rp+=amount;});pipeDetail.push({period_id:p,id_pengajuan:norm_(r.ID_PENGAJUAN),kode_pengajuan:norm_(r.KODE_PENGAJUAN),nip_sf:norm_(r.NIP_SF),nama_sf:norm_(r.NAMA_SF),unit_id:norm_(r.UNIT_ID),nama_unit:norm_(r.NAMA_UNIT),nip_sl:norm_(r.NIP_SL),nama_sl:norm_(r.NAMA_SL),area_name:area,distribution:dist,rh_user_key:rh.key,rh_name:rh.name,product:prod,status_pipeline:norm_(r.STATUS_PIPELINE),status_final:status,plafond_rp:amount,tgl_cair:r.TGL_CAIR||'',synced_at:now});});
  (src.achievement||[]).forEach(r=>{
    const p=mantapPeriod_(r);if(!periods.includes(p))return;
    const nipSf=norm_(pick_(r,['NIP_SF','NIK_SF','NIP_SF_KEY'])),unitId=norm_(pick_(r,['UNIT_ID','ID_UNIT']));
    const sfref=sfById[p+'|'+nipSf],uref=unitById[p+'|'+unitId],ref=sfref||uref||null;
    const sourceRh=norm_(pick_(r,['REGION_HEAD','NAMA_REGION_HEAD','RH']));
    let rh=ref&&ref.rh?ref.rh:mapRh(sourceRh),area=(ref&&ref.area)||norm_(pick_(r,['AREA','AREA_NAME'])),dist=(ref&&ref.distribution)||norm_(pick_(r,['DISTRIBUTION','REGION','RO']));
    if(!area&&uref)area=uref.area;if(!dist&&uref)dist=uref.distribution;
    area=area||'AREA BELUM TERPETAKAN';dist=dist||'DISTRIBUTION BELUM TERPETAKAN';
    const prod=mantapProductKey_(pick_(r,['PRODUK','PRODUCT','SEGMEN_PRODUK'])),amount=num_(pick_(r,['PLAFON_CAIR','PLAFOND_CAIR','NOMINAL_CAIR','PLAFOND','PLAFON'])),noa=num_(pick_(r,['NOA','JML_NOA']))||1;
    if(amount<=0)return;
    groupsFor(p,prod,dist,rh,area).forEach(g=>{g.achievement_rp+=amount;g.achievement_noa+=noa;g.achievement_available=true;});
  });
  const areaRows=Object.values(areaMap).map(g=>({period_id:g.period_id,product:g.product,area_id:g.area_id,area_name:g.area_name,distribution:g.distribution,rh_user_key:g.rh_user_key,rh_name:g.rh_name,sf_active:Object.keys(g.sfSet).length,sl_active:Object.keys(g.slSet).length,unit_total:Object.keys(g.unitSet).length,unit_covered:Object.keys(g.coveredSet).length,branch_coverage:Object.keys(g.unitSet).length?Object.keys(g.coveredSet).length/Object.keys(g.unitSet).length:null,pipeline_active_rp:g.pipeline_active_rp,hot_rp:g.hot_rp,incoming_rp:g.incoming_rp,process_rp:g.process_rp,akad_rp:g.akad_rp,cair_pipeline_rp:g.cair_pipeline_rp,reject_rp:g.reject_rp,achievement_rp:g.achievement_available?g.achievement_rp:null,achievement_noa:g.achievement_available?g.achievement_noa:null,achievement_available:g.achievement_available?'Y':'N',productivity_per_sf_rp:g.achievement_available&&Object.keys(g.sfSet).length?g.achievement_rp/Object.keys(g.sfSet).length:null,status:'MANTAP_SNAPSHOT',source_note:'DATABASE_BANK_MANTAP_CLEANSING',synced_at:now}));
  const rhGroups={};areaRows.forEach(r=>{const k=[r.period_id,r.product,r.distribution,r.rh_user_key].join('|');if(!rhGroups[k])rhGroups[k]={period_id:r.period_id,product:r.product,distribution:r.distribution,rh_user_key:r.rh_user_key,rh_name:r.rh_name,areas:{},sf_active:0,sl_active:0,unit_total:0,unit_covered:0,pipeline_active_rp:0,hot_rp:0,incoming_rp:0,process_rp:0,akad_rp:0,cair_pipeline_rp:0,reject_rp:0,achievement_rp:0,achievement_noa:0,achievement_available:false};const g=rhGroups[k];g.areas[r.area_id]=1;g.sf_active+=num_(r.sf_active);g.sl_active+=num_(r.sl_active);g.unit_total+=num_(r.unit_total);g.unit_covered+=num_(r.unit_covered);['pipeline_active_rp','hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp'].forEach(x=>g[x]+=num_(r[x]));if(upper_(r.achievement_available)==='Y'){g.achievement_available=true;g.achievement_rp+=num_(r.achievement_rp);g.achievement_noa+=num_(r.achievement_noa);}});
  const rhRows=Object.values(rhGroups).map(g=>({period_id:g.period_id,product:g.product,distribution:g.distribution,rh_user_key:g.rh_user_key,rh_name:g.rh_name,area_count:Object.keys(g.areas).length,unit_total:g.unit_total,unit_covered:g.unit_covered,sf_active:g.sf_active,sl_active:g.sl_active,pipeline_active_rp:g.pipeline_active_rp,hot_rp:g.hot_rp,incoming_rp:g.incoming_rp,process_rp:g.process_rp,akad_rp:g.akad_rp,cair_pipeline_rp:g.cair_pipeline_rp,reject_rp:g.reject_rp,achievement_rp:g.achievement_available?g.achievement_rp:null,achievement_noa:g.achievement_available?g.achievement_noa:null,achievement_available:g.achievement_available?'Y':'N',productivity_per_sf_rp:g.achievement_available&&g.sf_active?g.achievement_rp/g.sf_active:null,synced_at:now}));
  const slPerf=buildMantapSlPerf_(src,periods,mapRh,pipeDetail);const sfPerf=buildMantapSfPerf_(src,periods,mapRh,pipeDetail);
  return{periods,areaRows,rhRows,slPerf,sfPerf,pipeDetail,rhMapRows:buildMantapRhMapRows_(src),sourceCounts:{unit:(src.units||[]).filter(r=>periods.includes(mantapPeriod_(r))).length,sl:(src.sls||[]).filter(r=>periods.includes(mantapPeriod_(r))).length,sf:(src.sfs||[]).filter(r=>periods.includes(mantapPeriod_(r))).length,pipeline:(src.pipeline||[]).filter(r=>periods.includes(mantapPeriod_(r))).length,achievement:(src.achievement||[]).filter(r=>periods.includes(mantapPeriod_(r))).length}};
}
function buildMantapSlPerf_(src,periods,mapRh,pipeDetail){const out=[],distMap={},sfSl={},achSl={};(src.units||[]).forEach(u=>{const p=mantapPeriod_(u),nip=norm_(u.NIP_SL),d=norm_(u.DISTRIBUTION);if(p&&nip&&d&&!distMap[p+'|'+nip])distMap[p+'|'+nip]=d;});(src.sfs||[]).forEach(x=>{const p=mantapPeriod_(x),sf=norm_(x.NIP_SF),sl=norm_(x.NIP_SL);if(p&&sf&&sl)sfSl[p+'|'+sf]=sl;});(src.achievement||[]).forEach(a=>{const p=mantapPeriod_(a),sl=sfSl[p+'|'+norm_(a.NIP_SF)];if(!p||!sl)return;const k=p+'|'+sl;if(!achSl[k])achSl[k]={rp:0,noa:0};achSl[k].rp+=num_(a.PLAFON_CAIR);achSl[k].noa+=num_(a.NOA)||1;});(src.sls||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;const rh=mapRh(r.REGION_HEAD),nip=norm_(r.NIP_SL),pd=pipeDetail.filter(x=>x.period_id===p&&x.nip_sl===nip),active=pd.filter(x=>['HOT','INCOMING','PROSES','AKAD'].includes(x.status_final)),a=achSl[p+'|'+nip];out.push({period_id:p,nip_sl:nip,nama_sl:norm_(r.NAMA_SL),role_sl:norm_(r.ROLE_SL),status_sl:norm_(r.STATUS_SL),distribution:distMap[p+'|'+nip]||'',rh_user_key:rh.key,rh_name:rh.name,unit_covered:num_(r.JML_UNIT_COVERED),sf_active:num_(r.JML_SF_AKTIF),pipeline_active_rp:active.reduce((x,y)=>x+num_(y.plafond_rp),0),pipeline_noa:active.length,achievement_rp:a?a.rp:null,achievement_noa:a?a.noa:null,synced_at:new Date()});});return out;}
function buildMantapSfPerf_(src,periods,mapRh,pipeDetail){const out=[],ach={};(src.achievement||[]).forEach(a=>{const p=mantapPeriod_(a),nip=norm_(a.NIP_SF);if(!p||!nip)return;const k=p+'|'+nip;if(!ach[k])ach[k]={rp:0,noa:0};ach[k].rp+=num_(a.PLAFON_CAIR);ach[k].noa+=num_(a.NOA)||1;});(src.sfs||[]).forEach(r=>{const p=mantapPeriod_(r);if(!periods.includes(p))return;const rh=mapRh(r.REGION_HEAD),nip=norm_(r.NIP_SF),pd=pipeDetail.filter(x=>x.period_id===p&&x.nip_sf===nip),active=pd.filter(x=>['HOT','INCOMING','PROSES','AKAD'].includes(x.status_final)),a=ach[p+'|'+nip];out.push({period_id:p,nip_sf:nip,sales_code:norm_(r.SALES_CODE),nama_sf:norm_(r.NAMA_SF),jenis_sf:norm_(r.JENIS_SF),status_sf:norm_(r.STATUS_SF),unit_id:norm_(r.UNIT_ID),nama_unit:norm_(r.NAMA_UNIT),area_name:norm_(r.AREA),distribution:norm_(r.DISTRIBUTION),nip_sl:norm_(r.NIP_SL),nama_sl:norm_(r.NAMA_SL),rh_user_key:rh.key,rh_name:rh.name,pipeline_active_rp:active.reduce((x,y)=>x+num_(y.plafond_rp),0),pipeline_noa:active.length,achievement_rp:a?a.rp:null,achievement_noa:a?a.noa:null,synced_at:new Date()});});return out;}
function previewMantapSync(payload){const req=normalizeFilters_(Object.assign({partner:'MANTAP'},payload||{})),requested=payload&&payload.periodId?canonicalMonthKey_(payload.periodId):'',b=buildMantapSnapshotData_({periodId:'',forceFresh:true});const rhs=Array.from(new Set(b.areaRows.map(r=>r.rh_name))),dists=Array.from(new Set(b.areaRows.map(r=>r.distribution)));return{ok:true,message:'Preview Mantap siap. Belum ada data yang ditulis ke Overview.',summary:{periods:b.periods,region_heads:rhs.length,distributions:dists.length,areas:new Set(b.areaRows.map(r=>r.area_name)).size,...b.sourceCounts}};}
function getMantapAreaRowsCached_(periodId,product){periodId=canonicalMonthKey_(periodId)||periodId;const p=upper_(product||'ALL'),key=cacheKey_('MANTAP_AREA_V52',periodId,p),c=cacheGetJson_(key);if(c)return c;let rows=readObjectsIfExists_(APP.SHEETS.MANTAP_AREA_PERF).filter(r=>canonicalMonthKey_(r.period_id)===periodId&&upper_(r.product||'ALL')===p);const out=rows.map(r=>({period_id:canonicalMonthKey_(r.period_id)||periodId,product:upper_(r.product||'ALL'),area_id:norm_(r.area_id),area_name:norm_(r.area_name),ro_source:norm_(r.distribution),ro_filter_group:norm_(r.distribution),rh_user_keys:norm_(r.rh_user_key),rh_names:norm_(r.rh_name),rank_selindo:null,rank_pool:null,target_rp:null,achievement_rp:upper_(r.achievement_available)==='Y'?num_(r.achievement_rp):null,attainment_pct:null,sf_active:num_(r.sf_active),sf_green:null,sf_grey:null,sf_red:null,pipeline_active_rp:num_(r.pipeline_active_rp),carry_over_rp:null,batal_cair_rp:num_(r.reject_rp),branch_coverage:numOrNull_(r.branch_coverage),korea_activity_rate:null,open_opportunity_rp:num_(r.pipeline_active_rp),sf_fulfillment:null,min_sf_required:null,productivity_per_sf_rp:upper_(r.achievement_available)==='Y'?numOrNull_(r.productivity_per_sf_rp):null,quadrant_code:'',quadrant_name:'',condition_summary:'Mantap: '+num_(r.sf_active)+' SF · '+num_(r.sl_active)+' SL · '+num_(r.unit_covered)+'/'+num_(r.unit_total)+' unit ter-cover.',system_focus:'Fokus pada cakupan SF, pipeline, dan proses menuju pencairan.',status:'MANTAP_SNAPSHOT',mantap:{sl_active:num_(r.sl_active),unit_total:num_(r.unit_total),unit_covered:num_(r.unit_covered),hot_rp:num_(r.hot_rp),incoming_rp:num_(r.incoming_rp),process_rp:num_(r.process_rp),akad_rp:num_(r.akad_rp),cair_pipeline_rp:num_(r.cair_pipeline_rp),reject_rp:num_(r.reject_rp),achievement_noa:upper_(r.achievement_available)==='Y'?num_(r.achievement_noa):null,achievement_available:upper_(r.achievement_available)==='Y'}}));const ranked=out.slice().sort((a,b)=>num_(b.achievement_rp)-num_(a.achievement_rp)||num_(b.pipeline_active_rp)-num_(a.pipeline_active_rp));ranked.forEach((r,i)=>r.rank_selindo=i+1);cachePutJson_(key,ranked,APP.CACHE_AREA_TTL);return ranked;}
function getMantapScopeRows_(periodId){const rows=getMantapAreaRowsCached_(periodId,'ALL'),out=[];rows.forEach(r=>out.push({period_id:periodId,filter_ro:r.ro_filter_group,source_ro:r.ro_source,rh_user_key:r.rh_user_keys,rh_name:r.rh_names,area_id:r.area_id,area_name:r.area_name,scope_status:'MANTAP'}));return out;}
function getMantapFilterContext_(req){const scope=getMantapScopeRows_(req.periodId),roRows=req.roSource?scope.filter(r=>r.filter_ro===req.roSource):scope,rhRows=req.rhUserKey?roRows.filter(r=>r.rh_user_key===req.rhUserKey):roRows;return{partner:'MANTAP',ros:uniqueRoOptionsFromScope_(scope),rhs:buildRhOptionsFromRoScope_(roRows),areas:Array.from(new Map(rhRows.map(r=>[r.area_id,{value:r.area_id,label:r.area_name}])).values()).sort((a,b)=>a.label.localeCompare(b.label)),scopeMode:'MANTAP_SNAPSHOT'};}
function getMantapInitialBundle_(req){
  const requested=req.periodId||currentPeriodId_(),dataPeriodId=nextPeriodId_(requested,-1);
  const bootKey=cacheKey_('BOOTSTRAP_V52','MANTAP',requested,req.accessScopeCode||'ALL');
  const bootCached=cacheGetJson_(bootKey);if(bootCached)return bootCached;
  const all=filterMantapRows_(getMantapAreaRowsCached_(dataPeriodId,'ALL'),Object.assign({},req,{periodId:dataPeriodId,roSource:'',rhUserKey:'',areaId:''}));
  const currentRows=filterMantapRows_(getMantapAreaRowsCached_(requested,'ALL'),Object.assign({},req,{periodId:requested,roSource:'',rhUserKey:'',areaId:''}));
  const available=getMantapAvailablePeriods_(),latestAvailable=available.length?available[available.length-1]:'';
  const scopePeriod=currentRows.length?requested:(latestAvailable||dataPeriodId);
  const scope=applyAccessToScopeRows_(getMantapScopeRows_(scopePeriod),req);
  const ros=uniqueRoOptionsFromScope_(scope),rhs=buildRhOptionsFromRoScope_(scope);
  const out={
    app:{name:APP.NAME,company:APP.COMPANY,partner:'Bank Mantap',databaseUrl:getSpreadsheet_().getUrl(),generatedAt:formatDateTime_(new Date()),validationMode:true,version:APP.VERSION,accessLabel:req.accessLabel||'',accessRole:req.accessRole||''},
    partner:'MANTAP',periodId:requested,dataRevision:getDataRevision_(),dataPeriodId:(all[0]&&all[0].period_id)||dataPeriodId,
    options:{
      partners:[{value:'BSI',label:'BSI'},{value:'MANTAP',label:'Bank Mantap'}],
      periods:getDynamicPeriodOptions_(available),
      products:[{value:'ALL',label:'Semua Produk'},{value:'KMP',label:'KMP'},{value:'KMPP',label:'KMPP'}],
      rhs:[{value:'',label:req.accessRole==='REGIONAL'?(req.accessLabel||'Regional'):'Semua Region Head'}].concat(rhs),
      ros:[{value:'',label:'Semua Distribution'}].concat(ros),
      areas:[{value:'',label:'Semua Area'}].concat(uniqueAreaOptions_(all))
    },
    areaByProduct:{ALL:all},scopeRows:scope,roRhScope:scope,scopeMode:'MANTAP_SNAPSHOT',
    snapshot:{period_id:requested,status:currentRows.length?'MANTAP_CURRENT_AVAILABLE':'NO_CURRENT_DATA',note:currentRows.length?'Data bulan berjalan Mantap tersedia.':'Data bulan berjalan belum tersedia; ringkasan kinerja tetap memakai bulan sebelumnya.'},
    dataGaps:currentRows.length?[]:[{code:'MANTAP_CURRENT_NOT_AVAILABLE',status:'INFO',note:'Data '+periodLabel_(requested)+' belum tersedia di source Mantap.'}],
    bootstrap:{lazyProducts:true,loadedProducts:['ALL'],scopePeriod,regionalScoped:req.accessRole==='REGIONAL'}
  };
  cachePutJson_(bootKey,out,1800);
  return out;
}
function getMantapAvailablePeriods_(){
  const key=cacheKey_('MANTAP_PERIODS_V52'),cached=cacheGetJson_(key);if(cached)return cached;
  let rows=readObjectsIfExists_(APP.SHEETS.MANTAP_AREA_PERF),ps=Array.from(new Set(rows.map(r=>canonicalMonthKey_(r.period_id)).filter(Boolean))).sort();
  if(!ps.length){try{const src=getMantapSourceBundle_();ps=Array.from(new Set([].concat(src.units,src.pipeline,src.sfs,src.achievement||[]).map(r=>mantapPeriod_(r)).filter(Boolean))).sort();}catch(e){}}
  const out=ps.filter(p=>/^\d{4}-(0[1-9]|1[0-2])$/.test(p));
  cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);return out;
}
function filterMantapRows_(rows,req){let x=applyAccessToAreaRows_(rows||[],req);if(req.roSource)x=x.filter(r=>r.ro_filter_group===req.roSource);if(req.rhUserKey)x=x.filter(r=>String(r.rh_user_keys||'')===req.rhUserKey);if(req.areaId)x=x.filter(r=>r.area_id===req.areaId);return x;}
function aggregateMantapRows_(rows){const list=rows||[],s={sf_active:0,sl_active:0,unit_total:0,unit_covered:0,pipeline_active_rp:0,hot_rp:0,incoming_rp:0,process_rp:0,akad_rp:0,cair_pipeline_rp:0,reject_rp:0,achievement_rp:0,achievement_noa:0,achievement_available:false,achievement_complete:false,achievement_partial:false,achievement_coverage:0,achievement_area_count:0,area_count:list.length};list.forEach(r=>{s.sf_active+=num_(r.sf_active);s.sl_active+=num_(r.mantap&&r.mantap.sl_active);s.unit_total+=num_(r.mantap&&r.mantap.unit_total);s.unit_covered+=num_(r.mantap&&r.mantap.unit_covered);s.pipeline_active_rp+=num_(r.pipeline_active_rp);['hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp'].forEach(k=>s[k]+=num_(r.mantap&&r.mantap[k]));if(r.achievement_rp!=null){s.achievement_area_count++;s.achievement_rp+=num_(r.achievement_rp);s.achievement_noa+=num_(r.mantap&&r.mantap.achievement_noa);}});s.achievement_coverage=list.length?s.achievement_area_count/list.length:0;s.achievement_available=s.achievement_area_count>0;s.achievement_complete=list.length>0&&s.achievement_coverage>=0.8;s.achievement_partial=s.achievement_available&&!s.achievement_complete;s.branch_coverage=s.unit_total?s.unit_covered/s.unit_total:null;s.productivity_per_sf_rp=s.achievement_complete&&s.sf_active?s.achievement_rp/s.sf_active:null;return s;}
function getMantapHistoryBundle_(req){const historyPeriod=nextPeriodId_(req.periodId,-1),periods=getMantapAvailablePeriods_().filter(p=>p<=historyPeriod),months=[];periods.forEach(p=>{const rows=filterMantapRows_(getMantapAreaRowsCached_(p,req.product),Object.assign({},req,{periodId:p})),s=aggregateMantapRows_(rows);if(!rows.length)return;const n=+p.slice(5,7);months.push({period_id:p,month_num:n,month:periodLabel_(p).replace(/\s+\d{4}$/,''),target_rp:null,actual_rp:s.achievement_available?s.achievement_rp:null,attainment_pct:null,sf_active:s.sf_active,productivity_per_sf_rp:s.productivity_per_sf_rp,noa:s.achievement_available?s.achievement_noa:null,pipeline_active_rp:s.pipeline_active_rp,hasData:true});});const cur=months[months.length-1]||{};const curRows=filterMantapRows_(getMantapAreaRowsCached_(historyPeriod,req.product),Object.assign({},req,{periodId:historyPeriod})),total=curRows.reduce((a,r)=>a+num_(r.achievement_rp),0);const contribution=curRows.map(r=>({area_id:r.area_id,area_name:r.area_name,achievement_rp:r.achievement_rp,contribution_pct:total&&r.achievement_rp!=null?num_(r.achievement_rp)/total:null,attainment_pct:null,rank_selindo:r.rank_selindo,quadrant_code:''}));return{months,current:{achievement_rp:cur.actual_rp,attainment_pct:null,pipeline_to_target:null,productivity_per_sf_rp:cur.productivity_per_sf_rp},contribution,sourceNote:'Bank Mantap: tim & pipeline dari DATABASE_BANK_MANTAP_CLEANSING. Pencairan hanya tampil jika MASTER_ACHIEV tersedia.'};}
function getMantapBusinessReviewBundle_(req){const closed=nextPeriodId_(req.periodId,-1),hist=getMantapHistoryBundle_(req),months=hist.months||[];months.forEach((x,i)=>{const b=i?months[i-1]:null;x.growth_actual_pct=b&&x.actual_rp!=null&&b.actual_rp!=null?safeGrowth_(x.actual_rp,b.actual_rp):null;x.growth_sf_pct=b?safeGrowth_(x.sf_active,b.sf_active):null;x.growth_productivity_pct=b&&x.productivity_per_sf_rp!=null&&b.productivity_per_sf_rp!=null?safeGrowth_(x.productivity_per_sf_rp,b.productivity_per_sf_rp):null;x.ticket_size_rp=x.actual_rp!=null&&x.noa?safeDiv_(x.actual_rp,x.noa):null;x.growth_ticket_size_pct=null;x.gap_rp=null;});const latest=months[months.length-1]||emptyPerformanceMonth_(closed),previous=months.length>1?months[months.length-2]:emptyPerformanceMonth_(nextPeriodId_(closed,-1)),comparison={actual_growth_pct:latest.actual_rp!=null&&previous.actual_rp!=null?safeGrowth_(latest.actual_rp,previous.actual_rp):null,productivity_growth_pct:latest.productivity_per_sf_rp!=null&&previous.productivity_per_sf_rp!=null?safeGrowth_(latest.productivity_per_sf_rp,previous.productivity_per_sf_rp):null,ticket_size_growth_pct:null,sf_growth_pct:safeGrowth_(latest.sf_active,previous.sf_active),noa_growth_pct:null,target_growth_pct:null,gap_change_rp:null,achievement_change_pct:null};const closedPipe=mantapPipelinePeriod_(closed,req),currentPipe=mantapPipelinePeriod_(req.periodId,req);const performance={months,latest,previous,comparison,cumulative:{actual_rp:months.reduce((a,x)=>a+num_(x.actual_rp),0),target_rp:null,noa:months.reduce((a,x)=>a+num_(x.noa),0),achievement_pct:null,ticket_size_rp:null},source:'MANTAP MASTER_ACHIEV + MASTER_SF',product:req.product};const pipeline={closed:closedPipe,current:currentPipe};const bullets=[];if(latest.actual_rp==null)bullets.push('Pencairan Mantap belum lengkap pada bulan sebelumnya; pembacaan difokuskan pada tim, cakupan unit, dan pipeline.');if(comparison.sf_growth_pct!=null)bullets.push('SF aktif '+(comparison.sf_growth_pct>=0?'naik ':'turun ')+pctText_(Math.abs(comparison.sf_growth_pct))+' dibanding bulan sebelumnya.');if(currentPipe.summary.total_open_rp>closedPipe.summary.total_open_rp)bullets.push('Pipeline bulan berjalan lebih besar dibanding bulan sebelumnya.');return{filters:req,period:{current_period_id:req.periodId,current_period_label:periodLabel_(req.periodId),closed_period_id:closed,closed_period_label:periodLabel_(closed),previous_closed_period_id:nextPeriodId_(closed,-1),previous_closed_period_label:periodLabel_(nextPeriodId_(closed,-1))},performance,pipeline,analysis:{headline:latest.actual_rp==null?'Pencairan belum lengkap; fokus review Mantap saat ini adalah kondisi tim dan pipeline.':'Kinerja Mantap dibaca dari pencairan, kondisi tim, dan pipeline.',bullets},sourceNote:'Bank Mantap menggunakan database Mantap terpisah. Data tidak digabung ke presentasi BSI.',generatedAt:formatDateTime_(new Date()),mantap:true};}
function mantapPipelinePeriod_(periodId,req){const rows=filterMantapRows_(getMantapAreaRowsCached_(periodId,req.product),Object.assign({},req,{periodId})),s=aggregateMantapRows_(rows),sum={hot_rp:s.hot_rp,incoming_rp:s.incoming_rp,analisa_rp:s.process_rp,akad_rp:s.akad_rp,cair_rp:s.achievement_available?s.achievement_rp:null,hot_noa:null,incoming_noa:null,cair_noa:s.achievement_available?s.achievement_noa:null,carry_over_rp:null,batal_cair_rp:s.reject_rp,total_open_rp:s.pipeline_active_rp,ticket_size_rp:s.achievement_available&&s.achievement_noa?s.achievement_rp/s.achievement_noa:null,has_hot_data:true,has_incoming_data:true,has_process_data:true,has_akad_data:true,has_cair_data:s.achievement_available,has_carry_data:false,has_batal_data:true,incoming_to_cair_pct:s.achievement_available&&s.incoming_rp?s.achievement_rp/s.incoming_rp:null,carry_share_of_hot:null,batal_share_of_hot:s.hot_rp?s.reject_rp/s.hot_rp:null};return{period_id:periodId,summary:sum,reason:{carry:[],batal:[]},detail:[{label:req.product==='ALL'?'KMP + KMPP':req.product,hot_rp:s.hot_rp,incoming_rp:s.incoming_rp,analisa_rp:s.process_rp,akad_rp:s.akad_rp,cair_rp:s.achievement_available?s.achievement_rp:null,carry_over_rp:null,batal_cair_rp:s.reject_rp,cair_noa:s.achievement_available?s.achievement_noa:null}],dataQuality:s.achievement_available?[]:['MASTER_ACHIEV belum tersedia/lengkap untuk periode ini.']};}
function getMantapPotentialBundle_(req){const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),s=aggregateMantapRows_(rows);return{mantap:true,summary:{pipeline_open_rp:s.pipeline_active_rp,hot_rp:s.hot_rp,incoming_rp:s.incoming_rp,process_rp:s.process_rp,akad_rp:s.akad_rp,reject_rp:s.reject_rp},areas:rows.map(r=>({area_id:r.area_id,area_name:r.area_name,total_open_rp:r.pipeline_active_rp,sf_active:r.sf_active,branch_coverage:r.branch_coverage,rh_name:r.rh_names})).sort((a,b)=>b.total_open_rp-a.total_open_rp),topBranches:[],mappingNote:'Mantap: ruang bisnis dibaca dari pipeline aktif per Area. Potensi eksternal terpisah belum tersedia.',sourceWarning:'Pipeline Mantap tidak disatukan dengan potensi BSI.'};}
function getMantapCapacityBundle_(req){const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),s=aggregateMantapRows_(rows);return{mantap:true,summary:{sf_active:s.sf_active,sl_active:s.sl_active,unit_total:s.unit_total,unit_covered:s.unit_covered,branch_coverage:s.branch_coverage,productivity_per_sf_rp:s.productivity_per_sf_rp,achievement_available:s.achievement_available},areas:rows.map(r=>({area_id:r.area_id,area_name:r.area_name,sf_active:r.sf_active,sl_active:r.mantap.sl_active,unit_total:r.mantap.unit_total,unit_covered:r.mantap.unit_covered,branch_coverage:r.branch_coverage,pipeline_active_rp:r.pipeline_active_rp,productivity_per_sf_rp:r.productivity_per_sf_rp,rh_name:r.rh_names})).sort((a,b)=>(a.branch_coverage??9)-(b.branch_coverage??9))};}
function getMantapBarrierBundle_(req){const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),s=aggregateMantapRows_(rows),b=[];if(s.branch_coverage!=null&&s.branch_coverage<.9)b.push({title:'Cakupan unit belum merata',severity:1-s.branch_coverage,evidence:'Unit ter-cover '+fmtInt_(s.unit_covered)+' dari '+fmtInt_(s.unit_total)+' ('+pctText_(s.branch_coverage)+').',meaning:'Pemenuhan SF perlu difokuskan ke unit yang belum ter-cover.'});if(s.sf_active===0)b.push({title:'SF aktif belum tersedia',severity:1,evidence:'Belum ada SF aktif pada cakupan ini.',meaning:'Aktivasi SF menjadi prasyarat utama.'});if(s.reject_rp>0)b.push({title:'Pipeline reject perlu ditindaklanjuti',severity:s.pipeline_active_rp?Math.min(1,s.reject_rp/(s.pipeline_active_rp+s.reject_rp)):0.5,evidence:'Reject '+moneyText_(s.reject_rp)+'.',meaning:'Periksa pola penyebab reject sebelum menambah data baru.'});if(!s.achievement_available)b.push({title:'Pencairan belum tersedia',severity:.35,evidence:'MASTER_ACHIEV belum lengkap untuk periode ini.',meaning:'Pertumbuhan pencairan belum dapat disimpulkan; gunakan pipeline dan kondisi tim sebagai gambaran awal.'});return{mantap:true,barriers:b.sort((a,c)=>c.severity-a.severity).slice(0,5),pipelineReasons:[]};}
function getMantapActionCapacitySnapshot_(periodId,req){const rows=filterMantapRows_(getMantapAreaRowsCached_(periodId,req.product),Object.assign({},req,{periodId,areaId:''})),s=aggregateMantapRows_(rows);let out={periodId,hasData:rows.length>0,sfActive:s.sf_active,sfProductiveIndicator:null,branchCovered:s.unit_covered,branchProductiveIndicator:null,source:'MANTAP / MASTER_SF + MASTER_UNIT',dataQuality:s.achievement_available?[]:['Pencairan Mantap belum tersedia/lengkap.']};return applyAdminCapacityOverrides_(out,req,periodId);}
function getMantapAreaDetail_(req){const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),area=rows[0];if(!area)return{area:null,koreas:[],branches:[],mantap:true};const sl=readObjectsIfExists_(APP.SHEETS.MANTAP_SL_PERF).filter(r=>canonicalMonthKey_(r.period_id)===req.periodId&&norm_(r.rh_user_key)===norm_(area.rh_user_keys)),sf=readObjectsIfExists_(APP.SHEETS.MANTAP_SF_PERF).filter(r=>canonicalMonthKey_(r.period_id)===req.periodId&&norm_(r.area_name)===norm_(area.area_name));return{area,koreas:sl.map(r=>({nip_korea:norm_(r.nip_sl),nama_korea:norm_(r.nama_sl),sf_active:num_(r.sf_active),pipeline_active_rp:num_(r.pipeline_active_rp),role:'Sales Leader'})),branches:[],sfs:sf,mantap:true,labelCoordinator:'Sales Leader'};}
function getMantapBranchDetail_(req){return{mantap:true,branch:null,sfs:[]};}
function getMantapRankSummary_(req){
  const all=applyAccessToAreaRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),scope=filterMantapRows_(all,req),dist={};
  all.forEach(r=>{const k=r.ro_filter_group||'Tanpa Distribution';if(!dist[k])dist[k]={ro_name:k,achievement_rp:0,pipeline_active_rp:0,area_count:0};dist[k].achievement_rp+=num_(r.achievement_rp);dist[k].pipeline_active_rp+=num_(r.pipeline_active_rp);dist[k].area_count++;});
  const dr=Object.values(dist).sort((a,b)=>(b.achievement_rp-a.achievement_rp)||(b.pipeline_active_rp-a.pipeline_active_rp));dr.forEach((r,i)=>r.rank_selindo=i+1);
  const ca=scope[0]||null,currentDist=req.roSource||(ca&&ca.ro_filter_group)||'',cr=dr.find(r=>r.ro_name===currentDist)||null;
  return{summary:{ro_current:cr,area_current:ca,area_best:scope[0]||null,area_count_scope:scope.length,ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId)},ro:{current:cr,top10:dr.slice(0,10),all:dr},area:{current:scope,top10:all.slice(0,10)},ranking_period_id:req.periodId,ranking_period_label:periodLabel_(req.periodId),mantap:true};
}

function getMantapRankingTab_(req,payload){
  const tab=upper_(payload&&payload.tab||'RH').toLowerCase(),all=applyAccessToAreaRows_(getMantapAreaRowsCached_(req.periodId,req.product),req);
  if(tab==='area')return{tab:'area',area:{current:filterMantapRows_(all,req).slice(0,50),top10:all.slice(0,10)},mantap:true};
  if(tab==='ro'||tab==='distribution'){const x=getMantapRankSummary_(req);return{tab:'ro',summary:x.summary,ro:x.ro,area:x.area,mantap:true};}
  if(tab==='branch'){
    const scope=filterMantapRows_(all,req),areaNames=new Set(scope.map(r=>norm_(r.area_name))),rhKeys=new Set(scope.map(r=>norm_(r.rh_user_keys)));
    const sf=readObjectsIfExists_(APP.SHEETS.MANTAP_SF_PERF).filter(r=>canonicalMonthKey_(r.period_id)===req.periodId&&(!rhKeys.size||rhKeys.has(norm_(r.rh_user_key)))&&(!areaNames.size||areaNames.has(norm_(r.area_name))));
    const m={};sf.forEach(r=>{const k=norm_(r.unit_id)||norm_(r.nama_unit);if(!k)return;if(!m[k])m[k]={branch_name:norm_(r.nama_unit)||k,area_name:norm_(r.area_name),achievement_rp:0,pipeline_active_rp:0,sf_active:0,attainment_pct:null};m[k].achievement_rp+=num_(r.achievement_rp);m[k].pipeline_active_rp+=num_(r.pipeline_active_rp);m[k].sf_active++;});
    const rows=Object.values(m).sort((a,b)=>(b.achievement_rp-a.achievement_rp)||(b.pipeline_active_rp-a.pipeline_active_rp));rows.forEach((r,i)=>r.rank_selindo=i+1);return{tab:'branch',branch:{top10:rows.slice(0,10),all:rows,mode:'MANTAP_UNIT'},mantap:true};
  }
  if(tab==='korea'){
    const scope=filterMantapRows_(all,req),rhKeys=new Set(scope.map(r=>norm_(r.rh_user_keys))),dists=new Set(scope.map(r=>norm_(r.ro_filter_group)));
    let rows=readObjectsIfExists_(APP.SHEETS.MANTAP_SL_PERF).filter(r=>canonicalMonthKey_(r.period_id)===req.periodId&&(!rhKeys.size||rhKeys.has(norm_(r.rh_user_key)))&&(!dists.size||dists.has(norm_(r.distribution))));
    rows=rows.map(r=>({nip_korea:norm_(r.nip_sl),nama_korea:norm_(r.nama_sl),area_name:norm_(r.distribution),role:norm_(r.role_sl)||'Sales Leader',sf_active:num_(r.sf_active),achievement_rp:num_(r.achievement_rp),pipeline_active_rp:num_(r.pipeline_active_rp),attainment_pct:null})).sort((a,b)=>(b.achievement_rp-a.achievement_rp)||(b.pipeline_active_rp-a.pipeline_active_rp));rows.forEach((r,i)=>r.rank_selindo=i+1);return{tab:'korea',korea:{top10:rows.slice(0,10),all:rows,mode:'MANTAP_SL'},labelCoordinator:'Sales Leader',mantap:true};
  }
  if(tab==='sf'){
    const scope=filterMantapRows_(all,req),rhKeys=new Set(scope.map(r=>norm_(r.rh_user_keys))),areaNames=new Set(scope.map(r=>norm_(r.area_name)));
    let rows=readObjectsIfExists_(APP.SHEETS.MANTAP_SF_PERF).filter(r=>canonicalMonthKey_(r.period_id)===req.periodId&&(!rhKeys.size||rhKeys.has(norm_(r.rh_user_key)))&&(!areaNames.size||areaNames.has(norm_(r.area_name))));
    rows=rows.map(r=>({nip_sf:norm_(r.nip_sf),nama_sf:norm_(r.nama_sf),branch_name:norm_(r.nama_unit),area_name:norm_(r.area_name),achievement_rp:num_(r.achievement_rp),pipeline_active_rp:num_(r.pipeline_active_rp),attainment_pct:null})).sort((a,b)=>(b.achievement_rp-a.achievement_rp)||(b.pipeline_active_rp-a.pipeline_active_rp));rows.forEach((r,i)=>r.rank_selindo=i+1);return{tab:'sf',sf:{top10:rows.slice(0,10),all:rows,mode:'MANTAP_SF'},mantap:true};
  }
  const groups={};all.forEach(r=>{const k=r.rh_user_keys;if(!groups[k])groups[k]={rh_user_key:k,rh_name:r.rh_names,ro_name:r.ro_filter_group,area_count:0,achievement_rp:0,pipeline_active_rp:0,sf_active:0,attainment_pct:null};const g=groups[k];g.area_count++;g.achievement_rp+=num_(r.achievement_rp);g.pipeline_active_rp+=num_(r.pipeline_active_rp);g.sf_active+=num_(r.sf_active);});
  const rows=Object.values(groups).sort((a,b)=>(b.achievement_rp-a.achievement_rp)||(b.pipeline_active_rp-a.pipeline_active_rp));rows.forEach((r,i)=>r.rank_selindo=i+1);const current=rows.find(r=>r.rh_user_key===req.rhUserKey)||null;return{tab:'rh',regionHead:{current,all:rows,scopeMode:'MANTAP'},mantap:true};
}

function syncMantapData(payload){
  // V5.1: manual sync selalu membaca source Mantap terbaru, bukan cache raw sebelumnya.
  clearAppCache();
  const started=new Date(),requested=payload&&payload.periodId?canonicalMonthKey_(payload.periodId):'',ss=getSpreadsheet_();ensureMantapIntegration_(ss);
  let b=null;
  try{
    b=buildMantapSnapshotData_({periodId:'',forceFresh:true});
    if(!b.periods.length)throw new Error('Tidak ada periode Mantap yang cocok dengan '+(requested||'source')+'.');
    const defs={};
    defs[APP.SHEETS.MANTAP_AREA_PERF]=['period_id','product','area_id','area_name','distribution','rh_user_key','rh_name','sf_active','sl_active','unit_total','unit_covered','branch_coverage','pipeline_active_rp','hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp','achievement_rp','achievement_noa','achievement_available','productivity_per_sf_rp','status','source_note','synced_at'];
    defs[APP.SHEETS.MANTAP_RH_MONTHLY]=['period_id','product','distribution','rh_user_key','rh_name','area_count','unit_total','unit_covered','sf_active','sl_active','pipeline_active_rp','hot_rp','incoming_rp','process_rp','akad_rp','cair_pipeline_rp','reject_rp','achievement_rp','achievement_noa','achievement_available','productivity_per_sf_rp','synced_at'];
    defs[APP.SHEETS.MANTAP_SL_PERF]=['period_id','nip_sl','nama_sl','role_sl','status_sl','distribution','rh_user_key','rh_name','unit_covered','sf_active','pipeline_active_rp','pipeline_noa','achievement_rp','achievement_noa','synced_at'];
    defs[APP.SHEETS.MANTAP_SF_PERF]=['period_id','nip_sf','sales_code','nama_sf','jenis_sf','status_sf','unit_id','nama_unit','area_name','distribution','nip_sl','nama_sl','rh_user_key','rh_name','pipeline_active_rp','pipeline_noa','achievement_rp','achievement_noa','synced_at'];
    defs[APP.SHEETS.MANTAP_PIPELINE]=['period_id','id_pengajuan','kode_pengajuan','nip_sf','nama_sf','unit_id','nama_unit','nip_sl','nama_sl','area_name','distribution','rh_user_key','rh_name','product','status_pipeline','status_final','plafond_rp','tgl_cair','synced_at'];
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_AREA_PERF),defs[APP.SHEETS.MANTAP_AREA_PERF],b.areaRows);
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_RH_MONTHLY),defs[APP.SHEETS.MANTAP_RH_MONTHLY],b.rhRows);
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_SL_PERF),defs[APP.SHEETS.MANTAP_SL_PERF],b.slPerf);
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_SF_PERF),defs[APP.SHEETS.MANTAP_SF_PERF],b.sfPerf);
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_PIPELINE),defs[APP.SHEETS.MANTAP_PIPELINE],b.pipeDetail);
    replaceSheetObjects_(ss.getSheetByName(APP.SHEETS.MANTAP_RH_MAP),['source_rh_key','source_rh_name','overview_rh_user_key','overview_rh_name','mapping_method','active'],b.rhMapRows||[]);
    const finished=new Date(),log=ss.getSheetByName(APP.SHEETS.MANTAP_SYNC_LOG);
    log.appendRow(['MANTAP-'+Utilities.formatDate(finished,ss.getSpreadsheetTimeZone()||'Asia/Jakarta','yyyyMMddHHmmss'),started,finished,requested,b.periods.join('|'),b.sourceCounts.unit,b.sourceCounts.sl,b.sourceCounts.sf,b.sourceCounts.pipeline,b.sourceCounts.achievement,'SUCCESS','Seluruh periode Mantap dari source disinkronkan agar histori tidak hilang. Mapping RH authoritative dipertahankan.',getUserLabel_()]);
    clearAppCache();
    return{ok:true,message:'Data Bank Mantap berhasil ditarik untuk '+b.periods.join(', ')+'. '+b.areaRows.length+' baris Area/Product siap dipakai Overview.',periods:b.periods,counts:b.sourceCounts};
  }catch(e){
    try{const log=ss.getSheetByName(APP.SHEETS.MANTAP_SYNC_LOG);if(log)log.appendRow(['MANTAP-FAIL-'+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone()||'Asia/Jakarta','yyyyMMddHHmmss'),started,new Date(),requested,b&&b.periods?b.periods.join('|'):'',0,0,0,0,0,'FAILED',String(e&&e.message||e),getUserLabel_()]);}catch(_){}
    throw new Error('Tarik Data Mantap gagal. Data snapshot terakhir tetap dipakai. Detail: '+String(e&&e.message||e));
  }
}
function getMantapRankingBundle_(req){const sum=getMantapRankSummary_(req),rh=getMantapRankingTab_(req,{tab:'RH'}),br=getMantapRankingTab_(req,{tab:'BRANCH'}),sf=getMantapRankingTab_(req,{tab:'SF'}),sl=getMantapRankingTab_(req,{tab:'KOREA'});return{summary:Object.assign({},sum.summary,{rh_current:rh.regionHead.current}),regionHead:rh.regionHead,ro:{top10:sum.ro.top10,all:sum.ro.all||sum.ro.top10},area:{current:sum.area.current,top10:getMantapAreaRowsCached_(req.periodId,req.product).slice(0,10)},branch:br.branch,korea:sl.korea,sf:sf.sf,mantap:true};}
function getMantapRhRankingDetail_(req){const base=Object.assign({},req,{roSource:'',areaId:''}),rh=getMantapRankingTab_(base,{tab:'RH'}),profile=(rh.regionHead.all||[]).find(r=>r.rh_user_key===req.rhUserKey)||null,history=getMantapHistoryBundle_(base);return{profile,trend:(history.months||[]).map(m=>({month_num:m.month_num,month:m.month,target_rp:null,actual_rp:m.actual_rp,attainment_pct:null,productivity_per_sf_rp:m.productivity_per_sf_rp,sf_active:m.sf_active})),historySource:history.sourceNote||'',scopeMode:'MANTAP'};}
function buildMantapPresentationDraft_(req,payload){
  const presentationLite=!!(payload&&payload.presentationLite),skipRanking=!!(payload&&payload.skipRanking),cacheKey=cacheKey_('MANTAP_PRESENTATION_V54',req.periodId,req.product,req.roSource,req.rhUserKey,req.areaId,req.accessScopeCode||'ALL',presentationLite?'LITE':'FULL',skipRanking?'NORANK':'RANK'),cached=cacheGetJson_(cacheKey);if(cached)return cached;
  const rows=filterMantapRows_(getMantapAreaRowsCached_(req.periodId,req.product),req),s=aggregateMantapRows_(rows),hist=getMantapHistoryBundle_(req),businessReview=getMantapBusinessReviewBundle_(req),capacity=getMantapCapacityBundle_(req),barrier=getMantapBarrierBundle_(req),action=req.rhUserKey?getActionPlanImpactBundle(req):null,health=getDataHealthBundle(req),projection=getProjectionBundle(req),ranking=skipRanking?null:getMantapPresentationRankingSnapshot_(req),plans=getDevelopmentPlans(req).filter(r=>upper_(r.include_to_presentation)==='YA'&&upper_(r.approval_status)!=='DITOLAK'),scopeName=req.areaId?(rows[0]&&rows[0].area_name||'Area'):req.rhUserKey?(rows[0]&&rows[0].rh_names||'Region Head'):req.roSource||'Bank Mantap';
  const summary={target:null,actual:s.achievement_available?s.achievement_rp:null,att:null,sf:s.sf_active,prod:s.productivity_per_sf_rp,pipeline:s.pipeline_active_rp,carry:null,batal:s.reject_rp};
  const slides=[
    {id:'cover',type:'cover',title:'Review Kinerja Bisnis RH',headline:'Review Kinerja Bisnis RH · Bank Mantap',explanation:'Review Bank Mantap berdiri sendiri dari BSI dan dibaca dari pencairan, kondisi tim, cakupan unit, dan pipeline.',supporting_text:'Distribution · Region Head · Sales Leader · SF',show_slide:true},
    {id:'mantap-overview',type:'mantap_overview',title:'Ringkasan Bank Mantap',headline:s.achievement_available?'Pencairan, kondisi tim, dan pipeline memberikan gambaran posisi Mantap.':'Data pencairan belum lengkap; posisi Mantap saat ini dibaca dari tim, cakupan unit, dan pipeline.',show_slide:true},
    {id:'mantap-pipeline',type:'mantap_pipeline',title:'Pipeline Bank Mantap',headline:'Pipeline bulan berjalan dibaca dari HOT → Incoming → Diproses → Akad, sedangkan Reject dibaca sebagai pengajuan yang perlu diperbaiki.',show_slide:true},
    {id:'mantap-capacity',type:'mantap_capacity',title:'Kondisi Tim Mantap',headline:'Kondisi tim Mantap dibaca dari Sales Leader, SF, dan pemerataan unit yang sudah ter-cover.',show_slide:true}
  ];
  if(ranking)slides.push({id:'ranking-wilayah',type:'ranking_overview',title:'Posisi Kinerja Wilayah',headline:'Lihat posisi Distribution, Area, Unit, Sales Leader, dan SF dalam satu halaman.',ranking});
  if(action&&action.plan){const pri=(action.priorities||[]).filter(Boolean);if(pri.length)pri.slice(0,3).forEach((p,idx)=>slides.push({id:idx===0?'action-plan-impact':'action-plan-impact-'+(idx+1),type:'action_impact',title:'Hasil Action Plan RH · '+(idx+1),headline:p.title||action.managementInsight,actionImpact:action,priorityIndex:idx}));else slides.push({id:'action-plan-impact',type:'action_impact',title:'Hasil Action Plan RH',headline:action.managementInsight||'Perkembangan Action Plan RH',actionImpact:action,priorityIndex:0});}
  slides.push({id:'mantap-focus',type:'mantap_focus',title:'Fokus Berikutnya',headline:(barrier&&barrier.barriers&&barrier.barriers[0])?barrier.barriers[0].title+' menjadi perhatian utama pada review berikutnya.':'Fokus berikutnya adalah menjaga cakupan unit dan mempercepat pipeline menuju pencairan.',show_slide:true});
  if(plans.length)slides.push({id:'langkah',type:'next',title:'Langkah Pengembangan',headline:'Action Plan, cara menjalankan, perkembangan, dan hasil dibaca dalam satu alur.',projection,plans,show_slide:true});
  const storyMap=getStoryOverrideMap_(req),storyItems=slides.map((slide,i)=>{const ov=storyMap[slide.id]||{},systemHeadline=slide.headline||'',systemExplanation=defaultStoryExplanation_(summary,{Q1:0,Q2:0,Q3:0,Q4:0},null,capacity,barrier,slide,plans),systemSupporting=defaultStorySupporting_(summary,{Q1:0,Q2:0,Q3:0,Q4:0},null,capacity,barrier,slide,plans);slide.headline=norm_(ov.headline)||systemHeadline;slide.explanation=norm_(ov.explanation)||systemExplanation;slide.supporting_text=norm_(ov.supporting_text)||systemSupporting;slide.show_slide=upper_(ov.show_slide||'YA')!=='TIDAK';return{slide_id:slide.id,slide_title:slide.title||slide.id,slide_order:i+1,show_slide:slide.show_slide,headline:slide.headline,explanation:slide.explanation,supporting_text:slide.supporting_text,system_headline:systemHeadline,system_explanation:systemExplanation,system_supporting_text:systemSupporting}});
  const result={meta:{title:'Review Kinerja Bisnis RH · Bank Mantap',scopeName,periodLabel:periodLabel_(req.periodId),productLabel:req.product==='ALL'?'Semua Produk':req.product,company:APP.COMPANY,partner:'Bank Mantap',generatedAt:formatDateTime_(new Date())},filters:req,summary,history:hist,businessReview,potential:presentationLite?null:getMantapPotentialBundle_(req),capacity,barrier,actionImpact:action,dataHealth:health,projection,areas:rows,quadrantCounts:{Q1:0,Q2:0,Q3:0,Q4:0},plans,slides,storyItems,ranking,mantap:true};
  cachePutJson_(cacheKey,result,APP.CACHE_REFERENCE_TTL);return result;
}

function ensureAdminValidationIntegration_(ss){
  // Old columns stay in the same position; audit/approval columns are appended so existing rows are not shifted.
  const overrideHeaders=['validation_key','rh_user_key','rh_name','partner','scope_level','period_id','product','metric_key','metric_label','system_value','override_value','final_value','manual_source','update_note','update_date','status','source_sheet','source_row','synced_at','synced_by','submitted_at','submitted_by','approved_at','approved_by','published_at','published_by'];
  const logHeaders=['sync_id','started_at','finished_at','source_spreadsheet_id','rows_scanned','override_rows','valid_rows','invalid_rows','locked_rows','written_rows','status','note','synced_by'];
  ensureSheetHeaders_(ss,APP.SHEETS.ADMIN_VALIDATION_OVERRIDE,overrideHeaders);
  ensureSheetHeaders_(ss,APP.SHEETS.ADMIN_VALIDATION_LOG,logHeaders);
  const src=ss.getSheetByName(APP.SHEETS.SOURCE_CONFIG);
  if(src){
    const h=src.getRange(1,1,1,src.getLastColumn()).getValues()[0].map(norm_),keyIx=h.indexOf('source_key');let found=false;
    if(keyIx>=0&&src.getLastRow()>1)src.getRange(2,keyIx+1,src.getLastRow()-1,1).getValues().forEach(v=>{if(upper_(v[0])==='ADMIN_VALIDATION')found=true;});
    if(!found){const row={source_key:'ADMIN_VALIDATION',nama_sumber:'Tools Validasi Overview Region Head',spreadsheet_id:ADMIN_VALIDATION_SOURCE_SS_ID,sheet_name:'MULTI_SHEET',aktif:'Y',fungsi:'Validasi dan Final Value RH-level yang sudah direview RnD',catatan:'Tidak menimpa source Kompas/Mantap; publish melalui syncAdminValidationOverrides.'};src.appendRow(h.map(k=>row[k]==null?'':row[k]));}
  }
}
function menuPreviewAdminValidationSync(){const ui=SpreadsheetApp.getUi();try{const r=previewAdminValidationSync({});ui.alert(r.message+'\n\n'+JSON.stringify(r.summary,null,2));}catch(e){ui.alert('Cek validasi gagal:\n'+e.message);}}
function menuSyncAdminValidationOverrides(){const ui=SpreadsheetApp.getUi();const confirm=ui.alert('Terapkan Validasi Admin','Data validasi yang sudah lengkap akan dipakai sebagai data final di Overview. Data sumber asli tidak diubah. Lanjutkan?',ui.ButtonSet.YES_NO);if(confirm!==ui.Button.YES)return;try{const r=syncAdminValidationOverrides({});ui.alert(r.message);}catch(e){ui.alert('Terapkan validasi gagal:\n'+e.message);}}
function adminValidationPeriodId_(v){const s=norm_(v);if(/^\d{4}-\d{2}$/.test(s))return s;const m={'JANUARI':'01','FEBRUARI':'02','MARET':'03','APRIL':'04','MEI':'05','JUNI':'06','JULI':'07','AGUSTUS':'08','SEPTEMBER':'09','OKTOBER':'10','NOVEMBER':'11','DESEMBER':'12'};const x=upper_(s).match(/(JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER)\s+(20\d{2})/);return x?x[2]+'-'+m[x[1]]:'';}
function adminValidationProduct_(v){const x=upper_(v);if(x==='REGULER')return'REGULER';if(x==='MITRAGUNA'||x==='MTG')return'MITRAGUNA';if(x==='KMP')return'KMP';if(x==='KMPP')return'KMPP';return'ALL';}
function adminValidationMetric_(section,label){const sec=upper_(section),x=upper_(label).replace(/[—–-]/g,' ');if(sec==='ACTION PLAN'||sec==='PERKEMBANGAN')return{key:'',policy:'CALCULATED'};if(/PENCAIRAN\s+ACTUAL|PENCAIRAN AKTUAL/.test(x))return{key:'ACTUAL_CAIR_RP',policy:'LOCKED_SOURCE'};if(/PENCAPAIAN|PERTUMBUHAN|PERUBAHAN|SELISIH/.test(x))return{key:'',policy:'CALCULATED'};if(/SF\s+PRODUKTIF/.test(x))return{key:'SF_PRODUCTIVE',policy:'OVERRIDABLE'};if(/SF\s+AKTIF/.test(x))return{key:'SF_ACTIVE',policy:'OVERRIDABLE'};if(/CABANG\s+TER\s*COVER/.test(x))return{key:'BRANCH_COVERED',policy:'OVERRIDABLE'};if(/CABANG\s+PRODUKTIF/.test(x))return{key:'BRANCH_PRODUCTIVE',policy:'OVERRIDABLE'};if(/^HOT$/.test(x.trim()))return{key:'HOT_RP',policy:'OVERRIDABLE'};if(/^INCOMING$/.test(x.trim()))return{key:'INCOMING_RP',policy:'OVERRIDABLE'};if(/^PROSES$/.test(x.trim()))return{key:'PROCESS_RP',policy:'OVERRIDABLE'};if(/^AKAD$/.test(x.trim()))return{key:'AKAD_RP',policy:'OVERRIDABLE'};if(/PIPELINE\s+AKTIF/.test(x))return{key:'PIPELINE_ACTIVE_RP',policy:'OVERRIDABLE'};if(/CARRY\s*OVER/.test(x))return{key:'CARRY_OVER_RP',policy:'OVERRIDABLE'};if(/BATAL\s+CAIR/.test(x))return{key:'BATAL_CAIR_RP',policy:'OVERRIDABLE'};return{key:'',policy:'UNSUPPORTED'};}
function resolveOverviewRhByName_(name){const nk=actionNameKey_(name),rows=readObjectsIfExists_(APP.SHEETS.USER_ACCESS).filter(r=>upper_(r.role)==='RH');const aliases={AYUKUSNANDINI:'AYUKUSNANDINI',VERA:'VERAARIESTADEWI',VERAARIESTADEWI:'VERAARIESTADEWI',NURNOVIYANTI:'NURNOVIYANTI'};const target=aliases[nk]||nk;const r=rows.find(x=>actionNameKey_(x.display_name)===target)||rows.find(x=>actionNameKey_(x.display_name).includes(target)||target.includes(actionNameKey_(x.display_name)));return r?{key:norm_(r.user_key),name:norm_(r.display_name)}:null;}
function readAdminValidationSource_(){
  const ss=SpreadsheetApp.openById(ADMIN_VALIDATION_SOURCE_SS_ID),out=[];
  ss.getSheets().forEach(sh=>{
    const vals=sh.getDataRange().getValues();let currentRh=null,currentAdmin='';
    vals.forEach((row,i)=>{
      const first=norm_(row[0]);if(first.indexOf('·')>=0&&/Admin\s+/i.test(first)){const parts=first.split('·').map(norm_);const n=parts[0];const rh=resolveOverviewRhByName_(n);if(rh){currentRh=rh;const m=first.match(/Admin\s+(.+)$/i);currentAdmin=m?norm_(m[1]):'';}return;}
      if(first==='Section')return;
      if(!currentRh||!first)return;
      const section=norm_(row[0]),metricLabel=norm_(row[1]),product=adminValidationProduct_(row[2]),periodId=adminValidationPeriodId_(row[3]);
      const systemValue=row[4],overrideValue=row[5],finalValue=row[6],manualSource=norm_(row[9]),updateNote=norm_(row[10]),updateDate=row[11];
      if(overrideValue===''||overrideValue==null)return;
      const mm=adminValidationMetric_(section,metricLabel);const complete=!!manualSource&&!!updateNote&&!!updateDate;
      out.push({rh_user_key:currentRh.key,rh_name:currentRh.name,admin_name:currentAdmin,partner:'BSI',scope_level:'RH',period_id:periodId,product,metric_key:mm.key,metric_label:metricLabel,policy:mm.policy,system_value:systemValue,override_value:overrideValue,final_value:finalValue,manual_source:manualSource,update_note:updateNote,update_date:updateDate,complete,source_sheet:sh.getName(),source_row:i+1});
    });
  });
  return out;
}
function previewAdminValidationSync(){
  ensureAdminValidationIntegration_(getSpreadsheet_());const rows=readAdminValidationSource_();const valid=rows.filter(r=>r.policy==='OVERRIDABLE'&&r.complete&&r.metric_key&&r.period_id);const locked=rows.filter(r=>r.policy==='LOCKED_SOURCE');const invalid=rows.filter(r=>r.policy==='OVERRIDABLE'&&(!r.complete||!r.metric_key||!r.period_id));const unsupported=rows.filter(r=>!['OVERRIDABLE','LOCKED_SOURCE'].includes(r.policy));
  return{ok:true,message:'Preview selesai. Belum ada data yang dipublish.',summary:{override_rows:rows.length,siap_publish:valid.length,belum_lengkap:invalid.length,locked_source:locked.length,unsupported:unsupported.length,rh:Array.from(new Set(rows.map(r=>r.rh_name)))},rows:rows.map(r=>({rh:r.rh_name,period:r.period_id,metric:r.metric_label,metric_key:r.metric_key,override:r.override_value,policy:r.policy,complete:r.complete,source:r.manual_source,note:r.update_note}))};
}
function syncAdminValidationOverrides(){
  const ss=getSpreadsheet_();ensureAdminValidationIntegration_(ss);const started=new Date(),rows=readAdminValidationSource_(),valid=rows.filter(r=>r.policy==='OVERRIDABLE'&&r.complete&&r.metric_key&&r.period_id),sh=ss.getSheetByName(APP.SHEETS.ADMIN_VALIDATION_OVERRIDE),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(norm_),existing=readObjectsIfExists_(APP.SHEETS.ADMIN_VALIDATION_OVERRIDE),map={};existing.forEach(r=>map[norm_(r.validation_key)]=r);const who=Session.getActiveUser().getEmail()||'RND',now=new Date();
  valid.forEach(r=>{const key=[r.rh_user_key,r.partner,r.period_id,r.product,r.metric_key].join('|'),old=map[key]||{};map[key]={validation_key:key,rh_user_key:r.rh_user_key,rh_name:r.rh_name,partner:r.partner,scope_level:'RH',period_id:r.period_id,product:r.product,metric_key:r.metric_key,metric_label:r.metric_label,system_value:r.system_value,override_value:r.override_value,final_value:r.override_value,manual_source:r.manual_source,update_note:r.update_note,update_date:r.update_date,status:'PUBLISHED',source_sheet:r.source_sheet,source_row:r.source_row,submitted_at:old.submitted_at||now,submitted_by:old.submitted_by||r.admin_name||'ADMIN',approved_at:now,approved_by:who,published_at:now,published_by:who,synced_at:now,synced_by:who};});
  replaceSheetObjects_(sh,headers,Object.values(map));
  const log=ss.getSheetByName(APP.SHEETS.ADMIN_VALIDATION_LOG);log.appendRow(['VALSYNC_'+Utilities.getUuid().slice(0,8),started,new Date(),ADMIN_VALIDATION_SOURCE_SS_ID,'',rows.length,valid.length,rows.filter(r=>r.policy==='OVERRIDABLE'&&!r.complete).length,rows.filter(r=>r.policy==='LOCKED_SOURCE').length,valid.length,'SUCCESS','Manual sync = approval + publish RnD. Locked source tidak dipublish.',who]);
  clearAppCache();SpreadsheetApp.flush();return{ok:true,message:'Validasi Admin berhasil dipublish: '+valid.length+' override aktif sebagai Final Value. Source asli tidak diubah.',written:valid.length,status:'PUBLISHED'};
}
function getAdminValidationMap_(){const key='ADMIN_VALIDATION_MAP_V482',c=cacheGetJson_(key);if(c)return c;const out={};readObjectsIfExists_(APP.SHEETS.ADMIN_VALIDATION_OVERRIDE).filter(r=>['APPROVED','PUBLISHED'].includes(upper_(r.status))).forEach(r=>{out[norm_(r.validation_key)]={value:r.final_value,source:norm_(r.manual_source),note:norm_(r.update_note),date:r.update_date,syncedBy:norm_(r.synced_by)};});cachePutJson_(key,out,APP.CACHE_REFERENCE_TTL);return out;}
function getAdminValidationValue_(req,periodId,metricKey,systemValue){if(!req||!req.rhUserKey||req.areaId)return{value:systemValue,overridden:false};const partner=req.partner==='MANTAP'?'MANTAP':'BSI',product=upper_(req.product||'ALL');const m=getAdminValidationMap_();const keys=[[req.rhUserKey,partner,periodId,product,metricKey].join('|'),[req.rhUserKey,partner,periodId,'ALL',metricKey].join('|')];for(const k of keys){if(m[k])return{value:m[k].value,overridden:true,validation:m[k]};}return{value:systemValue,overridden:false};}
function applyAdminCapacityOverrides_(out,req,periodId){if(!req.rhUserKey||req.areaId)return out;const x=Object.assign({},out),used=[];[['sfActive','SF_ACTIVE'],['sfProductiveIndicator','SF_PRODUCTIVE'],['branchCovered','BRANCH_COVERED'],['branchProductiveIndicator','BRANCH_PRODUCTIVE']].forEach(([f,k])=>{const v=getAdminValidationValue_(req,periodId,k,x[f]);if(v.overridden){x[f]=numOrNull_(v.value);used.push({metric:k,validation:v.validation});}});if(used.length)x.adminValidation=used;return x;}
function applyAdminPipelineSummaryOverrides_(summary,req,periodId){if(!summary||!req.rhUserKey||req.areaId)return summary;const s=Object.assign({},summary),used=[];const fields=[['hot_rp','HOT_RP'],['incoming_rp','INCOMING_RP'],['analisa_rp','PROCESS_RP'],['akad_rp','AKAD_RP'],['total_open_rp','PIPELINE_ACTIVE_RP'],['carry_over_rp','CARRY_OVER_RP'],['batal_cair_rp','BATAL_CAIR_RP']];fields.forEach(([f,k])=>{const v=getAdminValidationValue_(req,periodId,k,s[f]);if(v.overridden){s[f]=num_(v.value);used.push({metric:k,validation:v.validation});}});s.stuck_rp=num_(s.carry_over_rp)+num_(s.batal_cair_rp);s.incoming_to_cair_pct=safeDiv_(s.cair_rp,s.incoming_rp);s.carry_share_of_hot=safeDiv_(s.carry_over_rp,s.hot_rp);s.batal_share_of_hot=safeDiv_(s.batal_cair_rp,s.hot_rp);s.stuck_share_of_hot=safeDiv_(s.stuck_rp,s.hot_rp);if(used.length)s.adminValidation=used;return s;}
