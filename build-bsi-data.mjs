import fs from 'node:fs';
import path from 'node:path';

const csvPath = path.resolve('data/04_AREA_PERFORMANCE.csv');
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/).filter(Boolean);

function parseCsvLine(line) {
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

const headers = parseCsvLine(lines[0]);
const data = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  const obj = {};
  headers.forEach((h, idx) => {
    const val = cols[idx];
    if ([
      'target_rp','achievement_rp','attainment_pct','sf_active_total','sf_green',
      'sf_grey','sf_red','pipeline_active_rp','carry_over_rp','batal_cair_rp',
      'branch_coverage','korea_activity_rate','open_opportunity_rp','sf_fulfillment',
      'min_sf_required','productivity_per_sf_rp','rank_selindo','rank_pool'
    ].includes(h)) {
      obj[h] = num(val);
    } else {
      obj[h] = val || null;
    }
  });
  data.push(obj);
}

fs.mkdirSync('apps/web/src/data', { recursive: true });
fs.writeFileSync('apps/web/src/data/bsi-dataset.json', JSON.stringify(data));
console.log('Successfully generated apps/web/src/data/bsi-dataset.json with', data.length, 'records.');
