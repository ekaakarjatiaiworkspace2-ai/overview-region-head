import { readFile } from 'node:fs/promises';
import { google } from 'googleapis';
import { pool } from './db.js';
import { cfg } from './config.js';
import { processBsiValues } from './services/bsi-ingest.js';

async function loadGoogleValues() {
  if (!cfg.googleSpreadsheetId) throw new Error('GOOGLE_SPREADSHEET_ID belum disetel di .env.');
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: cfg.googleSpreadsheetId,
    range: "'04_AREA_PERFORMANCE'!A1:AE",
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER'
  });
  return response.data.values || [];
}

function parseDelimitedText(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let token = '';
    const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          token += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(token.trim());
        token = '';
      } else {
        token += char;
      }
    }
    row.push(token.trim());
    return row;
  });
}

async function main() {
  const mode = process.argv[2] || 'bsi';
  if (!cfg.databaseUrl) throw new Error('DATABASE_URL belum disetel di .env.');

  let values: unknown[][];
  let sourceName = '04_AREA_PERFORMANCE';

  if (mode === 'bsi') {
    console.log('Menghubungkan ke Google Sheets API...');
    values = await loadGoogleValues();
  } else if (mode === 'file') {
    const filePath = process.argv[3] || 'data/04_AREA_PERFORMANCE.csv';
    console.log(`Membaca file lokal: ${filePath}`);
    const raw = await readFile(filePath, 'utf8');
    values = parseDelimitedText(raw);
    sourceName = `FILE:${filePath}`;
  } else {
    throw new Error('Mode tidak didukung. Gunakan: npm run sync:bsi ATAU npm run sync:file <path>');
  }

  const result = await processBsiValues(values, sourceName);
  console.log(`Selesai. Status: ${result.status}, Baris dibaca: ${result.recordsRead}, Snapshot baru: ${result.versionsPublished}`);
  result.messages.forEach(msg => console.log(` - ${msg}`));
}

main()
  .catch(e => {
    console.error('Sinkronisasi gagal:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
