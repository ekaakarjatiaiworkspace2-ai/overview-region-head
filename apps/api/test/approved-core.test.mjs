import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalMonthKey, shiftPeriod, resolvePeriodContext, sourceNumber, normalizeBsiRow, summarizeAreas, sheetRecords } from '../src/lib/approved-core.mjs';

test('periode Google Sheets: serial, string dan nama bulan', () => {
  assert.equal(canonicalMonthKey(46296), '2026-10');
  assert.equal(canonicalMonthKey('2026-10'), '2026-10');
  assert.equal(canonicalMonthKey('Oktober 2026'), '2026-10');
  assert.equal(canonicalMonthKey('2026-13'), null);
});

test('pergeseran periode dan resolusi review vs business period', () => {
  assert.equal(shiftPeriod('2026-10', -1), '2026-09');
  assert.equal(shiftPeriod('2026-01', -1), '2025-12');
  assert.equal(shiftPeriod('2026-12', +1), '2027-01');

  // Bila review period 2026-11 (meeting bulan Nov) -> closed business period 2026-10
  const fromReview = resolvePeriodContext('2026-11', true);
  assert.deepEqual(fromReview, {
    review_period: '2026-11',
    business_period: '2026-10',
    comparison_period: '2026-09'
  });

  // Bila data period 2026-10 (snapshot Okt) -> review period 2026-11
  const fromBusiness = resolvePeriodContext('2026-10', false);
  assert.deepEqual(fromBusiness, {
    review_period: '2026-11',
    business_period: '2026-10',
    comparison_period: '2026-09'
  });
});
test('angka rupiah dan desimal id-ID', () => {
  assert.equal(sourceNumber(1234.5), 1234.5);
  assert.equal(sourceNumber('1.234.567,89'), 1234567.89);
  assert.equal(sourceNumber('0,2683486908'), 0.2683486908);
  assert.equal(sourceNumber(''), null);
});
test('summary BSI sama dengan implementasi summarizeAreas_ V5.4', () => {
  const r = [
    {target_rp:100,achievement_rp:50,sf_active_total:2,sf_green:1,min_sf_required:4,branch_coverage:.5,korea_activity_rate:0,pipeline_active_rp:10},
    {target_rp:200,achievement_rp:100,sf_active_total:4,sf_green:2,min_sf_required:5,branch_coverage:1,korea_activity_rate:1,pipeline_active_rp:30}
  ];
  const x = summarizeAreas(r);
  assert.equal(x.target_rp, 300);
  assert.equal(x.achievement_rp, 150);
  assert.equal(x.attainment_pct, .5);
  assert.equal(x.branch_coverage, .75); // mean per area: preserved legacy rule
  assert.equal(x.sf_fulfillment, 6/9);
});
test('impor tidak mengganti null dengan nol untuk metrik asal', () => {
  const row = normalizeBsiRow({period_id:'2026-10',product:'ALL',area_id:'A01',area_name:'AREA A',target_rp:'',achievement_rp:0});
  assert.equal(row.target_rp, null);
  assert.equal(row.achievement_rp, 0);
  assert.equal(row.attainment_pct, null);
});
test('header kontrak sumber wajib lengkap', () => {
  assert.throws(() => sheetRecords([['period_id','area_id']]), /Kolom hilang/);
});
