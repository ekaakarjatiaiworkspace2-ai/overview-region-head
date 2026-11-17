import test from 'node:test';
import assert from 'node:assert/strict';
import { BSI_COLUMNS } from '../src/lib/approved-core.mjs';

test('kontrak webhook: header lengkap dan parsing payload array', () => {
  const header = [...BSI_COLUMNS];
  const sampleRow = [
    '2026-10', 'ALL', 'AREA999', 'AREA CONTOH',
    'RO TEST', 'RO TEST', 'RH01', 'Bapak RH',
    1, 1, 1000000000, 800000000, 0.8,
    10, 8, 2, 0, 2000000000,
    100000000, 0, 0.9, 0.85,
    500000000, 0.9, 8, 80000000,
    'Q1', 'Kondisi kuat', 'Evaluasi positif',
    'Fokus ekspansi', 'NORMAL'
  ];

  assert.equal(header.length, 31);
  assert.equal(sampleRow.length, 31);
  assert.equal(header[0], 'period_id');
  assert.equal(header[1], 'product');
  assert.equal(header[2], 'area_id');
  assert.equal(header[3], 'area_name');
});
