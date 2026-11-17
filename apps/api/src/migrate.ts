import {readFile} from 'node:fs/promises';
import {pool} from './db.js';

const path = new URL('../../../sql/001_initial.sql', import.meta.url);
async function run() {
  const sql = await readFile(path, 'utf8');
  const client = await pool.connect();
  try { await client.query(sql); console.log('Migrasi 001: berhasil.'); }
  finally {client.release(); await pool.end();}
}
run().catch((e)=>{console.error('Migrasi gagal:',e.message);process.exitCode=1;});
