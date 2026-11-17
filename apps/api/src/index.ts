import Fastify from 'fastify';
import cors from '@fastify/cors';
import {z} from 'zod';
import {pool} from './db.js';
import {cfg} from './config.js';
import {requirePrincipal, canViewArea, unrestricted} from './auth.js';
import {summarizeAreas} from './lib/approved-core.mjs';
import {processBsiValues} from './services/bsi-ingest.js';
import {syncMasterSpreadsheet} from './services/master-sync.js';
import {
  initFeatureTables,
  getHistoryPerformance,
  getPotentialPerformance,
  getCapacityPerformance,
  getBarriersPerformance,
  getRankingsPerformance,
  getProjectionData,
  saveProjectionData,
  getDevelopmentPlansList,
  saveDevelopmentPlanItem,
  deleteDevelopmentPlanItem,
  getStoryOverridesMap,
  saveStoryOverrideItem,
  getScopeHierarchy,
  getAreaDetail
} from './services/pillars-service.js';

const app = Fastify({logger:{level:cfg.nodeEnv==='development'?'info':'warn'}});
await app.register(cors, {origin:true, methods:['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders:['Authorization','Content-Type','x-sync-secret']});
app.get('/health', async ()=>({status:'ok',service:'eka-overview-api',version:'0.1.0'}));

app.get('/api/v1/me',async(request,reply)=>{
  const principal=await requirePrincipal(request,reply);
  if (!principal) return;
  return {user:principal,canViewOverview:canViewArea(principal)};
});

app.get('/api/v1/periods',async(request,reply)=>{
  const principal=await requirePrincipal(request,reply); if(!principal)return;
  if(!canViewArea(principal)) return reply.code(403).send({error:'Dashboard level Korea/SF belum diaktifkan.'});
  const params = unrestricted(principal)?[]:[principal.id];
  const condition = unrestricted(principal) ? '' :
    `AND EXISTS (SELECT 1 FROM user_area_access s WHERE s.user_id=$1::uuid AND s.area_id=a.area_id
      AND s.valid_from<=v.period_id AND (s.valid_through IS NULL OR s.valid_through>=v.period_id))`;
  const q=`SELECT DISTINCT v.period_id FROM dataset_versions v JOIN area_kpi a ON a.version_id=v.id
    WHERE v.partner='BSI' ${condition} ORDER BY v.period_id DESC`;
  const result=await pool.query<{period_id:string}>(q,params);
  return {periods:result.rows.map(x=>x.period_id)};
});

const overviewQuery=z.object({
  period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  product:z.enum(['ALL','REGULER','MITRAGUNA']).default('ALL'),
  ro:z.string().trim().max(200).optional(),
  rh:z.string().trim().max(200).optional(),
  area:z.string().trim().max(150).optional()
});
const COLUMNS=`a.period_id,a.product,a.area_id,a.area_name,a.ro_source,a.ro_filter_group,
 a.rh_user_keys,a.rh_names,a.rank_selindo,a.rank_pool,a.target_rp,a.achievement_rp,
 a.attainment_pct,a.sf_active_total,a.sf_green,a.sf_grey,a.sf_red,a.pipeline_active_rp,
 a.carry_over_rp,a.batal_cair_rp,a.branch_coverage,a.korea_activity_rate,
 a.open_opportunity_rp,a.sf_fulfillment,a.min_sf_required,a.productivity_per_sf_rp,
 a.quadrant_code,a.quadrant_name,a.condition_summary,a.system_focus,a.source_status`;

app.get('/api/v1/overview',async(request,reply)=>{
  const principal=await requirePrincipal(request,reply); if(!principal)return;
  if(!canViewArea(principal)) return reply.code(403).send({error:'Dashboard untuk jabatan ini belum aktif.'});
  const validation=overviewQuery.safeParse(request.query);
  if(!validation.success) return reply.code(400).send({error:'Filter periode/produk tidak valid.'});
  const {period,product,ro,rh,area}=validation.data;
  const latest=await pool.query<{id:string;published_at:string;source_name:string}>(
    `SELECT id,published_at,source_name FROM dataset_versions WHERE partner='BSI' AND period_id=$1
      ORDER BY published_at DESC,id DESC LIMIT 1`,[period]);
  if(!latest.rows.length) return {period,product,summary:null,areas:[],publishedAt:null,sourceName:null};
  const version=latest.rows[0];
  const args:unknown[]=[version.id,product];
  const conditions=['a.version_id=$1::uuid','a.product=$2'];
  if(ro){args.push(ro);conditions.push(`a.ro_filter_group=$${args.length}`);}
  if(rh){
    args.push(rh);
    conditions.push(`(
      a.rh_user_keys=$${args.length} 
      OR a.rh_names ILIKE '%'||$${args.length}||'%' 
      OR a.area_id IN (SELECT area_id FROM ro_rh_scope WHERE rh_user_key=$${args.length} OR rh_name ILIKE '%'||$${args.length}||'%')
    )`);
  }
  if(area){args.push(area);conditions.push(`a.area_id=$${args.length}`);}
  if(!unrestricted(principal)){
    args.push(principal.id);
    conditions.push(`EXISTS (SELECT 1 FROM user_area_access s WHERE s.user_id=$${args.length}::uuid
       AND s.area_id=a.area_id AND s.valid_from<=a.period_id
       AND (s.valid_through IS NULL OR s.valid_through>=a.period_id))`);
  }
  const q=`SELECT ${COLUMNS} FROM area_kpi a WHERE ${conditions.join(' AND ')} ORDER BY a.area_name ASC`;
  const result=await pool.query(q,args);
  const numericKeys=['target_rp','achievement_rp','attainment_pct','pipeline_active_rp','carry_over_rp',
    'batal_cair_rp','branch_coverage','korea_activity_rate','open_opportunity_rp','sf_fulfillment','productivity_per_sf_rp'];
  const rows=result.rows.map(row=>{
    const out={...row};
    for(const k of numericKeys)if(out[k]!==null&&out[k]!==undefined)out[k]=Number(out[k]);
    return out;
  });
  return {period,product,summary:rows.length?summarizeAreas(rows):null,areas:rows,
    publishedAt:version.published_at,sourceName:version.source_name};
});

// Pilar 1 & Jejak Kinerja History
app.get('/api/v1/history', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getHistoryPerformance(validation.data);
});

// Pilar 2 Potensi Bisnis
app.get('/api/v1/potential', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getPotentialPerformance(validation.data);
});

// Pilar 3 Kondisi Tim & Kapasitas
app.get('/api/v1/capacity', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getCapacityPerformance(validation.data);
});

// Pilar 4 Hambatan Pertumbuhan
app.get('/api/v1/barriers', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getBarriersPerformance(validation.data);
});

// Peringkat Wilayah (Ranking Tab)
app.get('/api/v1/rankings', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getRankingsPerformance(validation.data);
});

// Pilar 5 Proyeksi
app.get('/api/v1/projections', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getProjectionData(validation.data);
});

app.post('/api/v1/projections', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const body = request.body as Record<string, unknown>;
  const res = await saveProjectionData({
    period: String(body.period || ''),
    product: String(body.product || 'ALL'),
    ro: body.ro ? String(body.ro) : undefined,
    area: body.area ? String(body.area) : undefined,
    projectionRp: Number(body.projectionRp || 0),
    nextProjectionRp: body.nextProjectionRp ? Number(body.nextProjectionRp) : undefined,
    driverText: String(body.driverText || ''),
    userName: principal.displayName
  });
  return res;
});

// Pilar 5 Action Plans
app.get('/api/v1/development-plans', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getDevelopmentPlansList(validation.data);
});

app.post('/api/v1/development-plans', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const body = request.body as Record<string, unknown>;
  const res = await saveDevelopmentPlanItem({
    plan_id: body.plan_id ? String(body.plan_id) : undefined,
    period_id: String(body.period_id || ''),
    area_id: String(body.area_id || ''),
    area_name: String(body.area_name || ''),
    focus_title: String(body.focus_title || ''),
    action_plan: String(body.action_plan || ''),
    how_to: body.how_to ? String(body.how_to) : undefined,
    pic: body.pic ? String(body.pic) : undefined,
    deadline: body.deadline ? String(body.deadline) : undefined,
    horizon_30_day: body.horizon_30_day ? String(body.horizon_30_day) : undefined,
    horizon_60_day: body.horizon_60_day ? String(body.horizon_60_day) : undefined,
    horizon_90_day: body.horizon_90_day ? String(body.horizon_90_day) : undefined,
    target_result: body.target_result ? String(body.target_result) : undefined,
    include_to_presentation: body.include_to_presentation ? String(body.include_to_presentation) : 'YA',
    approval_status: body.approval_status ? String(body.approval_status) : 'DISETUJUI',
    focus_order: body.focus_order ? Number(body.focus_order) : 1,
    userName: principal.displayName
  });
  return res;
});

app.delete('/api/v1/development-plans/:id', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const params = request.params as {id: string};
  return deleteDevelopmentPlanItem(params.id);
});

// Story Editor Overrides
app.get('/api/v1/story-overrides', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const validation = overviewQuery.safeParse(request.query);
  if (!validation.success) return reply.code(400).send({error: 'Filter tidak valid.'});
  return getStoryOverridesMap(validation.data);
});

app.post('/api/v1/story-overrides', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const body = request.body as Record<string, unknown>;
  return saveStoryOverrideItem({
    period: String(body.period || ''),
    product: body.product ? String(body.product) : 'ALL',
    ro: body.ro ? String(body.ro) : undefined,
    area: body.area ? String(body.area) : undefined,
    slideId: String(body.slideId || ''),
    showSlide: body.showSlide !== false,
    headline: body.headline ? String(body.headline) : undefined,
    explanation: body.explanation ? String(body.explanation) : undefined,
    supportingText: body.supportingText ? String(body.supportingText) : undefined
  });
});

// Hierarki Wilayah Cascading (RO -> RH -> Area)
app.get('/api/v1/scopes', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const period = (request.query as {period?: string})?.period || '2026-07';
  return getScopeHierarchy(period);
});

// Detail Wilayah Area Drill-Down (Koreas, Reasons, Potensi)
app.get('/api/v1/area-detail', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  const query = request.query as {areaId?: string; area?: string; period?: string; product?: string};
  const targetArea = query.areaId || query.area || '';
  const period = query.period || '2026-07';
  const product = query.product || 'ALL';
  if (!targetArea) return reply.code(400).send({error: 'Parameter area wajib diisi.'});
  return getAreaDetail(targetArea, period, product);
});

// Sinkronisasi Langsung Master Spreadsheet
app.post('/api/v1/sync/master-spreadsheet', async (request, reply) => {
  const principal = await requirePrincipal(request, reply); if (!principal) return;
  if (principal.role !== 'ADMIN') return reply.code(403).send({error: 'Khusus administrator.'});
  try {
    const res = await syncMasterSpreadsheet();
    return res;
  } catch (err) {
    request.log.error({err}, 'Sync master spreadsheet failed');
    return reply.code(500).send({error: err instanceof Error ? err.message : 'Gagal sinkronisasi master spreadsheet.'});
  }
});

app.get('/api/v1/sync-runs',async(request,reply)=>{
  const principal=await requirePrincipal(request,reply); if(!principal)return;
  if(principal.role!=='ADMIN')return reply.code(403).send({error:'Khusus administrator.'});
  const result=await pool.query('SELECT id,source_name,status,records_read,versions_published,started_at,finished_at,error_message FROM source_sync_runs ORDER BY started_at DESC LIMIT 30');
  return {runs:result.rows};
});

const webhookIngestSchema = z.object({
  values: z.array(z.array(z.unknown())).min(2, 'Data harus memiliki minimal 1 baris header dan 1 baris data.'),
  sourceName: z.string().trim().max(100).optional().default('04_AREA_PERFORMANCE')
});

app.post('/api/v1/webhook/ingest-bsi', async (request, reply) => {
  const secret = request.headers['x-sync-secret'];
  if (!secret || secret !== cfg.syncSecret) {
    return reply.code(401).send({ error: 'Kunci x-sync-secret tidak cocok atau belum disetel.' });
  }
  const validation = webhookIngestSchema.safeParse(request.body);
  if (!validation.success) {
    return reply.code(400).send({ error: 'Payload tidak valid: wajib menyertakan array values.' });
  }
  try {
    const result = await processBsiValues(validation.data.values, validation.data.sourceName);
    return reply.code(200).send({ status: 'ok', data: result });
  } catch (err) {
    request.log.error({ err }, 'Webhook ingest failed');
    return reply.code(422).send({
      status: 'error',
      error: err instanceof Error ? err.message : 'Gagal memproses sinkronisasi data.'
    });
  }
});

app.setErrorHandler((error,request,reply)=>{
  request.log.error({err:error},'Unexpected API error');
  reply.code(500).send({error:'Layanan mengalami gangguan. Hubungi administrator.'});
});

async function start(){
  if(!cfg.databaseUrl)throw new Error('DATABASE_URL belum disetel.');
  await pool.query('SELECT 1');
  await initFeatureTables();
  await app.listen({host:cfg.host,port:cfg.port});
}
start().catch((e)=>{app.log.error(e);process.exitCode=1;});
