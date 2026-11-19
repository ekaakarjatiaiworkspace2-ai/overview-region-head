import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SPREADSHEET_ID = '1ZzSqZXpWVZQQ8CSj7qJoAqeX84mFRKObmgZqAb4b_I4';

const tabs = [
  { key: 'areaPerformance', name: '04_AREA_PERFORMANCE', gid: '1476503340' },
  { key: 'roRhScope', name: '01_RO_RH_AREA_SCOPE', gid: '1925759989' },
  { key: 'history2026', name: '02_HISTORY_2026', gid: '1805092600' },
  { key: 'potensiArea', name: '02_POTENSI_AREA', gid: '726819749' },
  { key: 'potensiBranch', name: '02_POTENSI_BRANCH', gid: '294857242' },
  { key: 'rankKorea', name: '04_RANK_KOREA', gid: '1234694898' },
  { key: 'pipelineReason', name: '03_PIPELINE_REASON', gid: '1616605500' },
  { key: 'alerts', name: '04_ALERT', gid: '1703170849' },
  { key: 'mantapAreaPerformance', name: '04_MANTAP_AREA_PERFORMANCE', gid: '356250651' }
];

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];

  function parseLine(line) {
    const row = [];
    let inQuotes = false, token = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') { token += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (c === ',' && !inQuotes) {
        row.push(token.trim()); token = '';
      } else { token += c; }
    }
    row.push(token.trim());
    return row;
  }

  function num(val) {
    if (val === null || val === undefined || val === '') return null;
    const s = String(val).replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  const headers = parseLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      const val = cols[idx];
      // Numeric fields detection
      if (
        h.endsWith('_rp') || h.endsWith('_noa') || h.endsWith('_pct') ||
        h.endsWith('_total') || h.endsWith('_rate') || h.endsWith('_fulfillment') ||
        h.startsWith('rank_') || h.startsWith('sf_') || h === 'actual_value' ||
        h === 'benchmark_value' || h === 'month_num' || h === 'year' ||
        h === 'min_sf_required' || h === 'productivity_per_sf_rp' || h === 'unit_total' ||
        h === 'unit_covered' || h === 'sl_active'
      ) {
        obj[h] = num(val);
      } else {
        obj[h] = val || null;
      }
    });
    records.push(obj);
  }
  return records;
}

const outDir = path.resolve('apps/web/src/data');
fs.mkdirSync(outDir, { recursive: true });

console.log('Fetching and compiling all key spreadsheet tabs...');

for (const tab of tabs) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${tab.gid}`;
  try {
    const csv = execSync(`curl.exe -s -L "${url}"`, { encoding: 'utf8', timeout: 15000 });
    const records = parseCsv(csv);
    const targetFile = path.join(outDir, `${tab.key}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(records, null, 2));
    console.log(`[SAVED] ${tab.name} -> ${records.length} records in ${tab.key}.json`);

    // For backwards compatibility with bsi-dataset.json
    if (tab.key === 'areaPerformance') {
      fs.writeFileSync(path.join(outDir, 'bsi-dataset.json'), JSON.stringify(records));
      console.log(`[COPIED] ${records.length} records into bsi-dataset.json`);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to fetch ${tab.name}:`, err.message);
  }
}

console.log('All spreadsheet data compiled successfully into apps/web/src/data/');
