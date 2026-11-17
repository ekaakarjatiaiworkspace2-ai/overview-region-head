# Yang perlu disediakan pemilik proyek

Cukup siapkan **akses resmi yang dikendalikan perusahaan**, bukan password pribadi untuk dibagikan ke ChatGPT.

## 1. Akun Google Cloud / service account pembaca

1. Gunakan proyek Google Cloud milik perusahaan (atau buat khusus untuk EKA Overview).
2. Aktifkan **Google Sheets API**.
3. Buat service account dengan akses serendah mungkin.
4. Share spreadsheet pusat dan sumber yang disetujui kepada **email service account** sebagai **Viewer**.
5. Simpan JSON kredensial secara lokal di komputer/server: isi path-nya saja pada `GOOGLE_APPLICATION_CREDENTIALS`.
6. Isi `GOOGLE_SPREADSHEET_ID` di `.env` dengan ID spreadsheet pusat.

JANGAN mengirim file JSON kunci privat, password Google, atau access token ke percakapan. File service account tidak boleh ada dalam Git atau frontend. Saat deploy nanti lebih baik menggunakan kredensial jangka pendek/workload identity bila didukung penyedia infrastruktur.

## 2. Project Supabase Free milik perusahaan

Untuk fase awal cukup **Supabase Free**, tanpa add-on berbayar. Karena database Free dapat dijeda dan tidak memiliki backup otomatis, jangan digunakan untuk data sensitif/operasional penuh sebelum ada persetujuan keamanan dan strategi backup.

1. Buat project PostgreSQL dengan region yang disetujui perusahaan.
2. Konfigurasi email/password Supabase Auth dengan kebijakan domain, MFA, dan undangan perusahaan yang disepakati.
3. Tempatkan `DATABASE_URL` pada `.env` server saja.
4. Supabase Project URL dan publishable/anon key dapat digunakan pada frontend dan API sesuai dokumentasi. JANGAN gunakan `service_role` pada browser.
5. Sediakan satu pengguna awal Admin via Supabase Auth, lalu petakan UUID akunnya ke `app_users`.

### Contoh peta admin (eksekusi DBA setelah Auth sudah membuat user)

```sql
INSERT INTO app_users(auth_uid,display_name,role)
VALUES ('<UUID_AKUN_SUPABASE_AUTH>', 'Admin EKA', 'ADMIN');
```

JANGAN memasukkan email atau ID tebakan. Untuk RH/Regional, mapping scope menggunakan `user_area_access`; contohnya:

```sql
INSERT INTO user_area_access(user_id,area_id,valid_from)
VALUES ('<UUID_APP_USER>', 'AREA001', '2026-01');
```

Pembatasan di server telah diterapkan untuk RH/Regional. Login saja TIDAK otomatis mengizinkan akses ke semua data.

## 3. Akses & identitas pengguna

- Konfirmasi siapa pemilik proyek dan **satu email admin awal**.
- Tentukan apakah menggunakan email perusahaan/SSO atau email yang disetujui.
- Pastikan daftar akun pada `01_USER_ACCESS` valid digunakan untuk pemetaan hak akses.
- Konfirmasi siapa yang menyetujui akses setiap Regional/RH.

## 4. Deploy

Domain/subdomain dan akun Cloudflare dapat disiapkan **setelah** pengujian lokal berhasil. Belum dibutuhkan sekarang. Cloudflare Pages Free dapat menampung frontend, tetapi Fastify Node tidak otomatis berjalan di Pages tanpa adaptasi.

## Batas langkah awal

Tanpa credential, kode, database, unit test, dan frontend dapat disiapkan. **Sinkronisasi nyata, login akun, dan live deployment belum bisa dijalankan** sampai akses resmi tersedia.
