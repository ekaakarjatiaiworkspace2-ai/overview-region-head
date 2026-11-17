# EKA Management Overview — Rencana Gratis untuk Pengembangan

**Keputusan:** layanan gratis selama pengembangan dan pilot; tidak ada pembelian domain/VPS/hosting berbayar sekarang.

| Komponen | Solusi Gratis | Batas Penting |
|---|---|---|
| Web | React + Vite di VS Code lokal | Tidak butuh hosting |
| API | Fastify + Node.js di komputer developer | Hanya hidup saat dijalankan |
| Database & Auth | Supabase Free PostgreSQL + Auth | Database 500 MB; dapat pause setelah 7 hari aktivitas rendah; tidak ada backup otomatis |
| Google Sheets Sync | Sheets API read-only, impor manual via `npm run sync:bsi` | Perhatikan kuota dan kebijakan API |
| Dashboard demo online (belum dibutuhkan) | Cloudflare Pages Free untuk frontend | API Fastify Node tidak otomatis berjalan di Pages; perlu adaptasi deployment |
| Domain | Subdomain gratis bawaan platform, jika deploy | Tidak perlu domain berbayar |

## Tahap awal Rp0

1. Buat **Supabase Free** milik perusahaan dan gunakan region yang disetujui tim keamanan.
2. Buat project Google Cloud untuk **Google Sheets API** dan service account khusus read-only yang diberi izin Viewer pada spreadsheet yang dibutuhkan.
3. Simpan credential hanya pada `.env` lokal, bukan di Git dan bukan di frontend.
4. Dari VS Code jalankan `npm install`, `npm run db:migrate`, dan `npm test`.
5. Setelah konfigurasi selesai jalankan `npm run sync:bsi`, `npm run dev:api`, `npm run dev:web`.
6. Cocokkan hasil BSI yang ditampilkan dengan snapshot V5.4 sebelum mengaktifkan modul baru.

## Batas keamanan dan operasional

- **Free bukan SLA produksi.** Supabase Free dapat dijeda karena inaktivitas dan tidak memberikan backup otomatis; sediakan mekanisme ekspor/backup yang disetujui sebelum pilot lebih besar.
- **Jangan mengunggah PII nasabah** ke layanan cloud gratis sebelum ada persetujuan pemilik data dan penilaian keamanan/peraturan perusahaan.
- Database 500 MB mengharuskan strategi penyimpanan hemat: mulai dari master dan snapshot yang disetujui, jangan memindahkan seluruh raw source sekaligus.
- Cloudflare Workers Free bukan tempat yang tepat untuk memproses seluruh import besar dalam satu request. Jangan mengira Fastify Node dapat dideploy ke Cloudflare Pages tanpa penyesuaian.
- Google Sheets API penggunaan standar saat ini tersedia tanpa biaya tambahan, tetapi kuota berlaku dan perubahan kebijakan/billing harus dicek sebelum produksi.
- Kita tetap dapat memigrasikan hosting nanti tanpa mengubah aturan KPI: frontend, API, dan database dipisahkan sejak awal.

## Kapan mempertimbangkan paket berbayar?

Saat kebutuhan uptime, backup otomatis, volume data di atas kuota, pemakaian banyak pengguna, atau persyaratan keamanan produksi tidak dipenuhi paket gratis. Keputusan hanya setelah pilot dan pengukuran kebutuhan nyata.
