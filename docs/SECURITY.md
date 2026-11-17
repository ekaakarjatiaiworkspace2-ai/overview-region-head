# Keamanan — v0.1, scope awal

- Google Sheets dibaca oleh backend worker saja melalui izin read-only.
- API menguji session token ke Supabase Auth (`getUser`), lalu mewajibkan `auth_uid` yang terdaftar dan aktif dalam `app_users`.
- Peran `REGIONAL` dan `RH` hanya memperoleh `area_kpi` yang memiliki pasangan `user_area_access` sesuai `area_id` dan periode. Permintaan filter `ro` maupun `area` hanya mempersempit cakupan, tidak melebarkannya.
- `ADMIN` dan `NATIONAL` memiliki cakupan nasional **hanya jika** role tersebut diberikan dalam database.
- Peran `KOREA` dan `SF` belum dibuka pada endpoint Overview Area; jangan menggunakan agregat Area untuk akses individu.
- API mengeluarkan kolom tertentu saja; JSON raw tidak diekspos.
- Database credential dan service account key wajib tetap di server.
- Port PostgreSQL Docker hanya bind localhost (pengembangan).
- Sistem produksi memerlukan reverse proxy HTTPS, rate limit, monitoring, backup teruji, rotasi credential, pengelolaan secret, kebijakan retensi, logging audit akses, SSO/MFA, dan validasi akses seluruh endpoint termasuk saat scope berubah.
- API v0.1 belum siap digunakan sebagai layanan publik. Belum diaudit penetration test, belum diuji beban, dan belum mempunyai admin UI untuk approval hak akses.
