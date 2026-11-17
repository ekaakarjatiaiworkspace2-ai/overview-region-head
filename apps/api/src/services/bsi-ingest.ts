import { createHash } from 'node:crypto';
import { pool } from '../db.js';
import { sheetRecords, normalizeBsiRow } from '../lib/approved-core.mjs';

const columns = [
  'period_id','product','area_id','area_name','ro_source','ro_filter_group','rh_user_keys','rh_names',
  'rank_selindo','rank_pool','target_rp','achievement_rp','attainment_pct','sf_active_total','sf_green',
  'sf_grey','sf_red','pipeline_active_rp','carry_over_rp','batal_cair_rp','branch_coverage',
  'korea_activity_rate','open_opportunity_rp','sf_fulfillment','min_sf_required',
  'productivity_per_sf_rp','quadrant_code','quadrant_name','condition_summary',
  'system_focus','source_status','source_payload'
] as const;

export interface IngestResult {
  runId: string;
  status: 'SUCCESS' | 'NO_CHANGE';
  recordsRead: number;
  versionsPublished: number;
  messages: string[];
}

export async function processBsiValues(values: unknown[][], sourceName = '04_AREA_PERFORMANCE'): Promise<IngestResult> {
  const run = await pool.query<{ id: string }>(
    `INSERT INTO source_sync_runs(source_name,status) VALUES($1,'RUNNING') RETURNING id`,
    [sourceName]
  );
  const runId = run.rows[0].id;
  let read = 0, changed = 0;
  const messages: string[] = [];

  try {
    const raw = sheetRecords(values);
    const rows = raw.map(normalizeBsiRow);
    read = rows.length;

    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!groups.has(row.period_id)) groups.set(row.period_id, []);
      groups.get(row.period_id)!.push(row);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [period, group] of groups) {
        if (!group.some(x => x.product === 'ALL')) {
          throw new Error(`Periode ${period}: baris produk ALL tidak ada.`);
        }
        const duplicates = new Set<string>();
        for (const row of group) {
          const key = `${row.area_id}|${row.product}`;
          if (duplicates.has(key)) throw new Error(`Duplikasi snapshot ${period}/${key}`);
          duplicates.add(key);
        }

        const canonical = group.slice().sort((a, b) =>
          `${a.area_id}|${a.product}`.localeCompare(`${b.area_id}|${b.product}`)
        );
        const hash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`EKA_BSI_${period}`]);

        const previous = await client.query<{ source_sha256: string; row_count: string }>(
          `SELECT d.source_sha256, (SELECT count(*) FROM area_kpi a WHERE a.version_id=d.id)::text AS row_count
           FROM dataset_versions d WHERE d.partner='BSI' AND d.period_id=$1
           ORDER BY d.published_at DESC, d.id DESC LIMIT 1`,
          [period]
        );

        if (previous.rows[0]?.source_sha256 === hash) {
          messages.push(`${period}: data identik dengan versi sebelumnya (tidak berubah)`);
          continue;
        }

        const oldCount = Number(previous.rows[0]?.row_count || 0);
        if (oldCount && group.length < oldCount * 0.8) {
          throw new Error(`${period}: jumlah baris turun drastis (${oldCount} -> ${group.length}); publikasi ditahan.`);
        }

        const version = await client.query<{ id: string }>(
          `INSERT INTO dataset_versions(partner,period_id,source_name,source_sha256,sync_run_id)
           VALUES('BSI',$1,$2,$3,$4) RETURNING id`,
          [period, sourceName, hash, runId]
        );
        const vid = version.rows[0].id;

        const colSql = columns.join(',');
        const placeholderSql = columns.map((_, i) => `$${i + 2}`).join(',');

        for (const r of group) {
          const record = r as unknown as Record<string, unknown>;
          const recordValues = columns.map(c =>
            c === 'source_payload' ? JSON.stringify(r.source_payload) : record[c] ?? null
          );
          await client.query(
            `INSERT INTO area_kpi(version_id,${colSql}) VALUES($1,${placeholderSql})`,
            [vid, ...recordValues]
          );
        }

        changed++;
        messages.push(`${period}: snapshot dipublikasikan (${group.length} baris)`);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const status: IngestResult['status'] = changed ? 'SUCCESS' : 'NO_CHANGE';
    await pool.query(
      `UPDATE source_sync_runs SET status=$2,records_read=$3,versions_published=$4,finished_at=now() WHERE id=$1`,
      [runId, status, read, changed]
    );

    return { runId, status, recordsRead: read, versionsPublished: changed, messages };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await pool.query(
      `UPDATE source_sync_runs SET status='FAILED',records_read=$2,versions_published=$3,error_message=$4,finished_at=now() WHERE id=$1`,
      [runId, read, changed, message]
    );
    throw e;
  }
}
