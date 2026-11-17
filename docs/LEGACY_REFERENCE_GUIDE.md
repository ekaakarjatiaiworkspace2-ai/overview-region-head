# LEGACY SOURCE READ-ONLY REFERENCE

- `legacy/private/Code.gs`: source asli Google Apps Script V5.4 yang disediakan pengguna, dengan **nilai password hash dan tiga spreadsheet ID hardcoded disamarkan** untuk mencegah kebocoran kredensial/identifier. Fungsinya masih terbaca untuk kontrak dan parity; ini bukan source runnable.
- `legacy/private/Index.html`: UI, event handlers, dan presentation renderers legacy V5.4. Hanya referensi fungsi/navigasi, tidak wajib disalin gaya UI-nya.
- **Jangan commit, push, deploy, atau publish folder `legacy/private/`**. Folder di-ignore Git. Jika perlu implementasi rincian data yang tidak ada di source snapshot, minta source/izin yang benar.
- Kode legacy dapat memuat nama karyawan dan nama unit sebagai test seed/konfigurasi. Jangan mengirimkannya ke layanan publik atau dataset demo.
- Dokumen `PLATFORM_BLUEPRINT_V1.md` dan `FEATURE_PARITY_MATRIX.md` bukan pengganti source. Pada saat coding sebuah modul, baca fungsi yang disebut secara langsung dari kedua file legacy.
