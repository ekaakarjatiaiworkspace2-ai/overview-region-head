import { config as readEnv } from 'dotenv';
readEnv({path:new URL('../../../.env', import.meta.url)});
export const cfg = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 8787),
  origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production' || /supabase|neon|amazonaws|railway/i.test(process.env.DATABASE_URL || ''),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  googleSpreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
  syncSecret: process.env.SYNC_SECRET || 'eka_secret_change_me',
  nodeEnv: process.env.NODE_ENV || 'development'
};
