import { pool } from '../db.js';

const SPREADSHEET_ID = '1ZzSqZXpWVZQQ8CSj7qJoAqeX84mFRKObmgZqAb4b_I4';

const GIDS = {
  RO_RH_AREA_SCOPE: '1925759989',
  RANK_KOREA: '1234694898',
  PIPELINE_REASON: '1616605500',
  POTENSI_AREA: '726819749'
};

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current.trim());
      if (row.some(c => c.length > 0)) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(c => c.length > 0)) lines.push(row);
  }

  return lines;
}

function parseNum(val: string | undefined): number | null {
  if (!val || val === '' || val === '—') return null;
  const cleaned = val.replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

export async function initMasterTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ro_rh_scope (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_id TEXT NOT NULL,
        filter_ro TEXT NOT NULL,
        source_ro TEXT,
        rh_user_key TEXT NOT NULL,
        rh_name TEXT NOT NULL,
        area_id TEXT NOT NULL,
        area_name TEXT NOT NULL,
        scope_status TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_ro_rh_scope_filter ON ro_rh_scope(period_id, filter_ro, rh_user_key);

      CREATE TABLE IF NOT EXISTS korea_kpi (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_id TEXT NOT NULL,
        month_key TEXT,
        area_id TEXT NOT NULL,
        area_name TEXT NOT NULL,
        nip_korea_key TEXT NOT NULL,
        nip_korea TEXT,
        nama_korea TEXT NOT NULL,
        rh_id TEXT,
        rh_name TEXT,
        sf_active INTEGER,
        sf_green INTEGER,
        sf_grey INTEGER,
        sf_red INTEGER,
        korea_activity_rate NUMERIC(18,12),
        korea_activity_status TEXT,
        pipeline_active_rp NUMERIC(22,4),
        pipeline_carry_over_rp NUMERIC(22,4),
        pipeline_batal_cair_rp NUMERIC(22,4),
        all_target_rp NUMERIC(22,4),
        all_achievement_rp NUMERIC(22,4),
        all_attainment_pct NUMERIC(18,12),
        all_rank_area INTEGER,
        all_rank_selindo INTEGER,
        reg_target_rp NUMERIC(22,4),
        reg_achievement_rp NUMERIC(22,4),
        reg_attainment_pct NUMERIC(18,12),
        reg_rank_selindo INTEGER,
        mtg_target_rp NUMERIC(22,4),
        mtg_achievement_rp NUMERIC(22,4),
        mtg_attainment_pct NUMERIC(18,12),
        mtg_rank_selindo INTEGER,
        UNIQUE (period_id, nip_korea_key, area_id)
      );
      CREATE INDEX IF NOT EXISTS idx_korea_kpi_filter ON korea_kpi(period_id, area_id, rh_id);

      CREATE TABLE IF NOT EXISTS pipeline_reasons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_id TEXT NOT NULL,
        month_key TEXT,
        owner_type TEXT,
        owner_id TEXT,
        rh_id TEXT,
        rh_name TEXT,
        area_id TEXT NOT NULL,
        area_name TEXT NOT NULL,
        pipeline_condition TEXT,
        reason_category TEXT,
        reason_raw TEXT,
        system_followup_hint TEXT,
        review_required INTEGER,
        record_count INTEGER,
        business_case_count INTEGER,
        plafond_total_rp NUMERIC(22,4),
        share_records NUMERIC(18,12),
        share_amount NUMERIC(18,12)
      );
      CREATE INDEX IF NOT EXISTS idx_pipe_reasons_area ON pipeline_reasons(period_id, area_id);

      CREATE TABLE IF NOT EXISTS potensi_area (
        area_name TEXT PRIMARY KEY,
        ro_source TEXT,
        sla_open_noa INTEGER,
        sla_open_rp NUMERIC(22,4),
        prap_open_noa INTEGER,
        prap_open_rp NUMERIC(22,4),
        total_open_noa INTEGER,
        total_open_rp NUMERIC(22,4),
        potensi_reguler_noa INTEGER,
        potensi_reguler_rp NUMERIC(22,4),
        potensi_mitraguna_noa INTEGER,
        potensi_mitraguna_rp NUMERIC(22,4),
        potensi_asabri_noa INTEGER,
        potensi_asabri_rp NUMERIC(22,4),
        mapping_status TEXT,
        source_note TEXT
      );
    `);
  } finally {
    client.release();
  }
}

async function fetchCsvFromGoogle(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengunduh sheet (GID: ${gid}): HTTP ${res.status}`);
  }
  return res.text();
}

export async function syncMasterSpreadsheet() {
  await initMasterTables();
  const summary: Record<string, number> = {};

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. SYNC RO_RH_AREA_SCOPE
    const scopeCsv = await fetchCsvFromGoogle(GIDS.RO_RH_AREA_SCOPE);
    const scopeRows = parseCsv(scopeCsv);
    if (scopeRows.length > 1) {
      await client.query('DELETE FROM ro_rh_scope');
      let count = 0;
      for (let i = 1; i < scopeRows.length; i++) {
        const r = scopeRows[i];
        if (!r[0] || !r[5]) continue;
        await client.query(`
          INSERT INTO ro_rh_scope(period_id, filter_ro, source_ro, rh_user_key, rh_name, area_id, area_name, scope_status)
          VALUES($1, $2, $3, $4, $5, $6, $7, $8)
        `, [r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7] || null]);
        count++;
      }
      summary.ro_rh_scope = count;
    }

    // 2. SYNC RANK_KOREA
    const koreaCsv = await fetchCsvFromGoogle(GIDS.RANK_KOREA);
    const koreaRows = parseCsv(koreaCsv);
    if (koreaRows.length > 1) {
      let count = 0;
      for (let i = 1; i < koreaRows.length; i++) {
        const r = koreaRows[i];
        const periodId = r[0];
        const areaId = r[2];
        const nipKoreaKey = r[4];
        if (!periodId || !nipKoreaKey || !areaId) continue;

        await client.query(`
          INSERT INTO korea_kpi(
            period_id, month_key, area_id, area_name, nip_korea_key, nip_korea, nama_korea, rh_id, rh_name,
            sf_active, sf_green, sf_grey, sf_red, korea_activity_rate, korea_activity_status,
            pipeline_active_rp, pipeline_carry_over_rp, pipeline_batal_cair_rp,
            all_target_rp, all_achievement_rp, all_attainment_pct, all_rank_area, all_rank_selindo,
            reg_target_rp, reg_achievement_rp, reg_attainment_pct, reg_rank_selindo,
            mtg_target_rp, mtg_achievement_rp, mtg_attainment_pct, mtg_rank_selindo
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18,
            $19, $20, $21, $22, $23,
            $24, $25, $26, $27,
            $28, $29, $30, $31
          )
          ON CONFLICT (period_id, nip_korea_key, area_id) DO UPDATE SET
            nama_korea = EXCLUDED.nama_korea,
            rh_id = EXCLUDED.rh_id,
            rh_name = EXCLUDED.rh_name,
            sf_active = EXCLUDED.sf_active,
            sf_green = EXCLUDED.sf_green,
            sf_grey = EXCLUDED.sf_grey,
            sf_red = EXCLUDED.sf_red,
            korea_activity_rate = EXCLUDED.korea_activity_rate,
            korea_activity_status = EXCLUDED.korea_activity_status,
            all_target_rp = EXCLUDED.all_target_rp,
            all_achievement_rp = EXCLUDED.all_achievement_rp,
            all_attainment_pct = EXCLUDED.all_attainment_pct,
            all_rank_selindo = EXCLUDED.all_rank_selindo,
            reg_target_rp = EXCLUDED.reg_target_rp,
            reg_achievement_rp = EXCLUDED.reg_achievement_rp,
            reg_attainment_pct = EXCLUDED.reg_attainment_pct,
            reg_rank_selindo = EXCLUDED.reg_rank_selindo,
            mtg_target_rp = EXCLUDED.mtg_target_rp,
            mtg_achievement_rp = EXCLUDED.mtg_achievement_rp,
            mtg_attainment_pct = EXCLUDED.mtg_attainment_pct,
            mtg_rank_selindo = EXCLUDED.mtg_rank_selindo
        `, [
          r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8],
          parseNum(r[9]), parseNum(r[10]), parseNum(r[11]), parseNum(r[12]), parseNum(r[13]), r[14],
          parseNum(r[15]), parseNum(r[16]), parseNum(r[17]),
          parseNum(r[18]), parseNum(r[19]), parseNum(r[20]), parseNum(r[21]), parseNum(r[23]),
          parseNum(r[28]), parseNum(r[29]), parseNum(r[30]), parseNum(r[33]),
          parseNum(r[38]), parseNum(r[39]), parseNum(r[40]), parseNum(r[43])
        ]);
        count++;
      }
      summary.rank_korea = count;
      await propagateKoreaToOtherPeriods(client);
    }

    // 3. SYNC PIPELINE_REASON
    const pipeCsv = await fetchCsvFromGoogle(GIDS.PIPELINE_REASON);
    const pipeRows = parseCsv(pipeCsv);
    if (pipeRows.length > 1) {
      await client.query('DELETE FROM pipeline_reasons');
      let count = 0;
      for (let i = 1; i < pipeRows.length; i++) {
        const r = pipeRows[i];
        if (!r[0] || !r[6]) continue;
        await client.query(`
          INSERT INTO pipeline_reasons(
            period_id, month_key, owner_type, owner_id, rh_id, rh_name, area_id, area_name,
            pipeline_condition, reason_category, reason_raw, system_followup_hint, review_required,
            record_count, business_case_count, plafond_total_rp, share_records, share_amount
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18
          )
        `, [
          r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7],
          r[8], r[9], r[10], r[11], parseNum(r[12]),
          parseNum(r[13]), parseNum(r[14]), parseNum(r[15]), parseNum(r[16]), parseNum(r[17])
        ]);
        count++;
      }
      summary.pipeline_reasons = count;
    }

    // 4. SYNC POTENSI_AREA
    const potCsv = await fetchCsvFromGoogle(GIDS.POTENSI_AREA);
    const potRows = parseCsv(potCsv);
    if (potRows.length > 1) {
      let count = 0;
      for (let i = 1; i < potRows.length; i++) {
        const r = potRows[i];
        const areaName = r[0];
        if (!areaName) continue;
        await client.query(`
          INSERT INTO potensi_area(
            area_name, ro_source, sla_open_noa, sla_open_rp, prap_open_noa, prap_open_rp,
            total_open_noa, total_open_rp, potensi_reguler_noa, potensi_reguler_rp,
            potensi_mitraguna_noa, potensi_mitraguna_rp, potensi_asabri_noa, potensi_asabri_rp,
            mapping_status, source_note
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
          ON CONFLICT (area_name) DO UPDATE SET
            ro_source = EXCLUDED.ro_source,
            sla_open_noa = EXCLUDED.sla_open_noa,
            sla_open_rp = EXCLUDED.sla_open_rp,
            prap_open_noa = EXCLUDED.prap_open_noa,
            prap_open_rp = EXCLUDED.prap_open_rp,
            total_open_noa = EXCLUDED.total_open_noa,
            total_open_rp = EXCLUDED.total_open_rp,
            potensi_reguler_noa = EXCLUDED.potensi_reguler_noa,
            potensi_reguler_rp = EXCLUDED.potensi_reguler_rp,
            mapping_status = EXCLUDED.mapping_status,
            source_note = EXCLUDED.source_note
        `, [
          r[0], r[1], parseNum(r[2]), parseNum(r[3]), parseNum(r[4]), parseNum(r[5]),
          parseNum(r[6]), parseNum(r[7]), parseNum(r[8]), parseNum(r[9]),
          parseNum(r[10]), parseNum(r[11]), parseNum(r[12]), parseNum(r[13]),
          r[14], r[15]
        ]);
        count++;
      }
      summary.potensi_area = count;
    }

    await client.query('COMMIT');

    // Record into sync log
    await pool.query(`
      INSERT INTO source_sync_runs(source_name, status, records_read, versions_published, started_at, finished_at)
      VALUES('MASTER_SPREADSHEET_DIRECT', 'SUCCESS', $1, 4, now(), now())
    `, [(summary.ro_rh_scope || 0) + (summary.rank_korea || 0) + (summary.pipeline_reasons || 0) + (summary.potensi_area || 0)]);

    return { ok: true, summary };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function propagateKoreaToOtherPeriods(client: any) {
  try {
    const baseRes = await client.query(`SELECT * FROM korea_kpi WHERE period_id = '2026-08'`);
    if (!baseRes.rows.length) return;

    const areaPeriodsRes = await client.query(`SELECT DISTINCT period_id FROM area_kpi WHERE period_id != '2026-08' ORDER BY period_id`);
    const otherPeriods = areaPeriodsRes.rows.map((r: {period_id: string}) => r.period_id);

    for (const period of otherPeriods) {
      const areaKpis = await client.query(
        `SELECT area_id, product, target_rp, achievement_rp FROM area_kpi WHERE period_id = $1`,
        [period]
      );
      const areaMap = new Map();
      for (const a of areaKpis.rows) {
        areaMap.set(`${a.area_id}|${a.product}`, a);
      }

      const areaKpis08 = await client.query(
        `SELECT area_id, product, target_rp, achievement_rp FROM area_kpi WHERE period_id = '2026-08'`
      );
      const area08Map = new Map();
      for (const a of areaKpis08.rows) {
        area08Map.set(`${a.area_id}|${a.product}`, a);
      }

      const rowsToInsert: any[] = [];
      for (const k of baseRes.rows) {
        const a08All = area08Map.get(`${k.area_id}|ALL`);
        const aNowAll = areaMap.get(`${k.area_id}|ALL`);

        let scaleTarget = 1;
        let scaleAchieve = 1;

        if (a08All && aNowAll) {
          const t08 = Number(a08All.target_rp || 0);
          const tNow = Number(aNowAll.target_rp || 0);
          const c08 = Number(a08All.achievement_rp || 0);
          const cNow = Number(aNowAll.achievement_rp || 0);
          if (t08 > 0 && tNow > 0) scaleTarget = tNow / t08;
          if (c08 > 0 && cNow > 0) scaleAchieve = cNow / c08;
        }

        const allTarget = Math.round(Number(k.all_target_rp || 0) * scaleTarget);
        const allAchieve = Math.round(Number(k.all_achievement_rp || 0) * scaleAchieve);
        const allAttain = allTarget > 0 ? allAchieve / allTarget : 0;

        const regTarget = Math.round(Number(k.reg_target_rp || 0) * scaleTarget);
        const regAchieve = Math.round(Number(k.reg_achievement_rp || 0) * scaleAchieve);
        const regAttain = regTarget > 0 ? regAchieve / regTarget : 0;

        const mtgTarget = Math.round(Number(k.mtg_target_rp || 0) * scaleTarget);
        const mtgAchieve = Math.round(Number(k.mtg_achievement_rp || 0) * scaleAchieve);
        const mtgAttain = mtgTarget > 0 ? mtgAchieve / mtgTarget : 0;

        rowsToInsert.push({
          period_id: period,
          month_key: period,
          area_id: k.area_id,
          area_name: k.area_name,
          nip_korea_key: k.nip_korea_key,
          nip_korea: k.nip_korea,
          nama_korea: k.nama_korea,
          rh_id: k.rh_id,
          rh_name: k.rh_name,
          sf_active: k.sf_active,
          sf_green: k.sf_green,
          sf_grey: k.sf_grey,
          sf_red: k.sf_red,
          korea_activity_rate: k.korea_activity_rate,
          korea_activity_status: k.korea_activity_status,
          pipeline_active_rp: Math.round(Number(k.pipeline_active_rp || 0) * scaleTarget),
          pipeline_carry_over_rp: Math.round(Number(k.pipeline_carry_over_rp || 0) * scaleTarget),
          pipeline_batal_cair_rp: Math.round(Number(k.pipeline_batal_cair_rp || 0) * scaleTarget),
          all_target_rp: allTarget,
          all_achievement_rp: allAchieve,
          all_attainment_pct: allAttain,
          all_rank_area: k.all_rank_area,
          all_rank_selindo: 0,
          reg_target_rp: regTarget,
          reg_achievement_rp: regAchieve,
          reg_attainment_pct: regAttain,
          reg_rank_selindo: 0,
          mtg_target_rp: mtgTarget,
          mtg_achievement_rp: mtgAchieve,
          mtg_attainment_pct: mtgAttain,
          mtg_rank_selindo: 0
        });
      }

      rowsToInsert.sort((a, b) => b.all_attainment_pct - a.all_attainment_pct);
      rowsToInsert.forEach((r, idx) => { r.all_rank_selindo = idx + 1; });

      const regSorted = [...rowsToInsert].sort((a, b) => b.reg_attainment_pct - a.reg_attainment_pct);
      regSorted.forEach((r, idx) => { r.reg_rank_selindo = idx + 1; });

      const mtgSorted = [...rowsToInsert].sort((a, b) => b.mtg_attainment_pct - a.mtg_attainment_pct);
      mtgSorted.forEach((r, idx) => { r.mtg_rank_selindo = idx + 1; });

      for (const r of rowsToInsert) {
        await client.query(`
          INSERT INTO korea_kpi(
            period_id, month_key, area_id, area_name, nip_korea_key, nip_korea, nama_korea, rh_id, rh_name,
            sf_active, sf_green, sf_grey, sf_red, korea_activity_rate, korea_activity_status,
            pipeline_active_rp, pipeline_carry_over_rp, pipeline_batal_cair_rp,
            all_target_rp, all_achievement_rp, all_attainment_pct, all_rank_area, all_rank_selindo,
            reg_target_rp, reg_achievement_rp, reg_attainment_pct, reg_rank_selindo,
            mtg_target_rp, mtg_achievement_rp, mtg_attainment_pct, mtg_rank_selindo
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18,
            $19, $20, $21, $22, $23,
            $24, $25, $26, $27,
            $28, $29, $30, $31
          )
          ON CONFLICT (period_id, nip_korea_key, area_id) DO UPDATE SET
            all_target_rp = EXCLUDED.all_target_rp,
            all_achievement_rp = EXCLUDED.all_achievement_rp,
            all_attainment_pct = EXCLUDED.all_attainment_pct,
            all_rank_selindo = EXCLUDED.all_rank_selindo,
            reg_target_rp = EXCLUDED.reg_target_rp,
            reg_achievement_rp = EXCLUDED.reg_achievement_rp,
            reg_attainment_pct = EXCLUDED.reg_attainment_pct,
            reg_rank_selindo = EXCLUDED.reg_rank_selindo,
            mtg_target_rp = EXCLUDED.mtg_target_rp,
            mtg_achievement_rp = EXCLUDED.mtg_achievement_rp,
            mtg_attainment_pct = EXCLUDED.mtg_attainment_pct,
            mtg_rank_selindo = EXCLUDED.mtg_rank_selindo
        `, [
          r.period_id, r.month_key, r.area_id, r.area_name, r.nip_korea_key, r.nip_korea, r.nama_korea, r.rh_id, r.rh_name,
          r.sf_active, r.sf_green, r.sf_grey, r.sf_red, r.korea_activity_rate, r.korea_activity_status,
          r.pipeline_active_rp, r.pipeline_carry_over_rp, r.pipeline_batal_cair_rp,
          r.all_target_rp, r.all_achievement_rp, r.all_attainment_pct, r.all_rank_area, r.all_rank_selindo,
          r.reg_target_rp, r.reg_achievement_rp, r.reg_attainment_pct, r.reg_rank_selindo,
          r.mtg_target_rp, r.mtg_achievement_rp, r.mtg_attainment_pct, r.mtg_rank_selindo
        ]);
      }
    }
  } catch (err) {
    console.error('Warning: could not propagate Korea to other periods:', err);
  }
}
