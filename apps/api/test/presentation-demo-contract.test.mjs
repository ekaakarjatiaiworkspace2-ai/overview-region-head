// Test the pure local presentation model without relying on npm registry or a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const ts=require('typescript'); // Provided by the web workspace devDependencies after npm install
const root=path.resolve(import.meta.dirname,'../../web/src');
function load(filename,modules={}) {
  const input=fs.readFileSync(path.join(root,filename),'utf8');
  const compiled=ts.transpileModule(input,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
  assert.equal((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`TS syntax error in ${filename}`);
  const module={exports:{}};
  new Function('require','module','exports',compiled.outputText)((name)=>{if(name in modules)return modules[name];throw Error(`Unexpected dependency ${name}`)},module,module.exports);
  return module.exports;
}
function loadJson(rel) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
    d.default = d;
    return d;
  } catch {
    return {default: []};
  }
}
const bsiDataset = loadJson('data/bsi-dataset.json');
const preview=load('preview.ts', {
  './data/bsi-dataset.json': bsiDataset,
  './data/rankKorea.json': loadJson('data/rankKorea.json'),
  './data/potensiBranch.json': loadJson('data/potensiBranch.json'),
  './data/history2026.json': loadJson('data/history2026.json'),
  './data/alerts.json': loadJson('data/alerts.json'),
  './data/pipelineReason.json': loadJson('data/pipelineReason.json')
});
const model=load('presentation-model.ts',{'./preview':preview});

test('model slide ids and order preserve relevant V5.4 names',()=>{
  const data=model.getDemoPresentationData('2026-10','ALL','');
  const slides=model.buildDemoSlides(data);
  assert.equal(slides.length,12);
  assert.deepEqual(slides.slice(0,4).map(s=>s.id),['cover','executive-summary','overview-reguler','overview-mitraguna']);
  assert.ok(slides.some(s=>s.id==='resources-pipeline-closed'));
  assert.ok(slides.some(s=>s.id==='ranking-wilayah'));
  assert.ok(slides.some(s=>s.id==='langkah'));
  assert.equal(new Set(slides.map(s=>s.id)).size,slides.length);
  assert.ok(slides.every(s=>s.visible));
});

test('per-product slides use only selected product',()=>{
  for(const product of ['REGULER','MITRAGUNA']){
    const data=model.getDemoPresentationData('2026-10',product,'');
    const slides=model.buildDemoSlides(data);
    assert.equal(slides.length,9);
    assert.ok(slides.some(s=>s.id===`overview-${product.toLowerCase()}`));
    assert.ok(!slides.some(s=>s.id===`overview-${product==='REGULER'?'mitraguna':'reguler'}`));
  }
});

test('regional filter changes relevant summary; slide edits do not alter underlying data',()=>{
  const all=model.getDemoPresentationData('2026-10','ALL','');
  const ro=model.getDemoPresentationData('2026-10','ALL','RO JAWA TIMUR');
  assert.ok(all.overview.summary.area_count>ro.overview.summary.area_count);
  const slides=model.buildDemoSlides(ro),achievement=ro.overview.summary.achievement_rp;
  const edited=model.mergeStoryEdits(slides,{'cover':{headline:'Judul baru',explanation:'Penjelasan baru',supportingText:'Pesan',visible:false}});
  assert.equal(edited[0].headline,'Judul baru');
  assert.equal(edited[0].sourceHeadline,slides[0].sourceHeadline);
  assert.equal(model.visibleSlides(edited).length,slides.length-1);
  assert.equal(ro.overview.summary.achievement_rp,achievement);
});

test('story draft storage is separated by period, product and RO',()=>{
  const a=model.demoStoryStorageKey('2026-10','ALL','RO JAWA TIMUR');
  assert.notEqual(a,model.demoStoryStorageKey('2026-09','ALL','RO JAWA TIMUR'));
  assert.notEqual(a,model.demoStoryStorageKey('2026-10','REGULER','RO JAWA TIMUR'));
  assert.notEqual(a,model.demoStoryStorageKey('2026-10','ALL','RO KALIMANTAN'));
});

test('all TS/TSX frontend source files can be syntactically transpiled',()=>{
  for(const filename of ['App.tsx','PresentationStudio.tsx','presentation-model.ts','preview.ts','api.ts','main.tsx']){
    const input=fs.readFileSync(path.join(root,filename),'utf8');
    const output=ts.transpileModule(input,{fileName:filename,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
    const errors=(output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
    assert.equal(errors.length,0,`${filename}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join(', ')}`);
  }
});
