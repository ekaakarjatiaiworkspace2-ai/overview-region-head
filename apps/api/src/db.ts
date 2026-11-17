import pg from 'pg';
import {cfg} from './config.js';
export const pool = new pg.Pool({
  connectionString: cfg.databaseUrl,
  ssl: cfg.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
