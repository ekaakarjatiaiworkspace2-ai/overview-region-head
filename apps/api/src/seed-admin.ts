import { createClient } from '@supabase/supabase-js';
import { cfg } from './config.js';
import { pool } from './db.js';

const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

async function registerTestAdmin() {
  const email = process.argv[2] || 'admin@eka.co.id';
  const password = process.argv[3] || 'PasswordEka2026!';
  const displayName = process.argv[4] || 'Admin EKA';

  console.log(`Mendaftarkan akun: ${email}...`);
  const { data, error } = await client.auth.signUp({
    email,
    password
  });

  let authUid = data.user?.id;
  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User sudah terdaftar di Supabase Auth, mencari UID...');
      const check = await pool.query<{ id: string }>('SELECT id FROM auth.users WHERE email = $1', [email]);
      authUid = check.rows[0]?.id;
    } else {
      throw error;
    }
  }

  if (!authUid) {
    throw new Error('Gagal mendapatkan auth UID user');
  }

  console.log(`Auth UID: ${authUid}`);
  // Konfirmasi email langsung di database (bypass verifikasi email)
  await pool.query(`UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = $1`, [authUid]);
  console.log('Email berhasil dikonfirmasi di auth.users.');

  // Berikan role ADMIN di app_users
  const res = await pool.query<{ id: string; display_name: string; role: string }>(
    `INSERT INTO app_users(auth_uid, display_name, role)
     VALUES($1, $2, 'ADMIN')
     ON CONFLICT (auth_uid) DO UPDATE SET display_name = $2, role = 'ADMIN', is_active = true
     RETURNING id, display_name, role`,
    [authUid, displayName]
  );

  console.log('User terdaftar di app_users:', res.rows[0]);
  console.log(`\n=== AKUN ADMIN SIAP DIGUNAKAN ===`);
  console.log(`Email    : ${email}`);
  console.log(`Password : ${password}`);
  console.log(`Role     : ADMIN`);
}

registerTestAdmin()
  .catch(console.error)
  .finally(() => pool.end());
