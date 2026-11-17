# Mode Demo Lokal — Tanpa Database dan Tanpa Login

Tujuan: meninjau visual dashboard React lebih dahulu, seperti permintaan pengguna.

1. Ekstrak ZIP, lalu buka **folder `eka-management-web-starter-v0.2-demo`** di VS Code. Pastikan folder itu memiliki `package.json`.
2. Buka terminal VS Code, jalankan `npm install` (pertama kali) lalu `npm run dev:web`.
3. Buka `http://localhost:5173`.
4. Pada halaman login, klik **Lihat Dashboard Demo**.
5. Gunakan filter periode, produk, Regional/RO, dan pengurutan tabel. Klik **Keluar Demo** untuk kembali ke halaman login.

**PENTING:** Ini hanya demonstrasi antarmuka, **seluruh angka dalam dashboard demo merupakan SIMULASI**, bukan data operasional BSI, Bank Mantap, Kompas, atau snapshot hasil meeting. Tampilan demo menggunakan 12 nama Area sebagai label ilustrasi, tidak membaca spreadsheet atau informasi pribadi.

Mode demo hanya tersedia dalam **Vite DEV mode** (`import.meta.env.DEV`). Build production menonaktifkannya, sementara jalur pengguna sungguhan tetap memerlukan Supabase Auth dan API, seperti sebelumnya.

Untuk menguji data nyata dan hak akses, lakukan konfigurasi `.env`, migrasi PostgreSQL, dan sync BSI sesuai README dan ACCESS_CHECKLIST.
