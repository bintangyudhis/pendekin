# Pendekin

Pendekin adalah aplikasi pemendek tautan. Pengguna mendaftar akun, menempelkan tautan panjang, dan mendapat tautan pendek dengan slug acak atau slug pilihan sendiri. Setiap kunjungan ke tautan pendek dicatat dan ringkasannya tampil di dasbor akun pembuatnya.

Situs live: https://pendekin.bintangyudhis.my.id

## Fitur

- Pembuatan tautan pendek lewat `POST /api/links` dengan validasi URL tujuan. Skema `https://` boleh tidak ditulis.
- Slug custom 3 sampai 32 karakter berupa huruf, angka, tanda hubung, dan garis bawah.
- Redirect 308 ke tautan tujuan. Setiap kunjungan mencatat waktu, referer, dan user agent.
- Halaman 404 untuk kode yang tidak dikenal.
- Akun pengguna lewat halaman daftar dan masuk dengan email dan kata sandi. Kata sandi disimpan sebagai hash scrypt dan sesi disimpan di database sebagai hash token dengan cookie httpOnly selama 30 hari.
- Pembuatan tautan wajib masuk. Setiap tautan tercatat atas nama akun pembuatnya.
- Dasbor akun berisi daftar tautan milik akun itu sendiri, tombol salin, kode QR, statistik klik per tautan, dan grafik klik harian 14 hari.
- Tautan bisa dinonaktifkan dan dihapus oleh pemiliknya dari dasbor. Statistik, pengubahan, dan penghapusan tautan akun lain ditolak di server.
- Tautan yang dibuat sebelum ada sistem akun tetap bisa dibuka pengunjung, tetapi tidak tampil di dasbor akun mana pun.
- Pembatasan jumlah pembuatan tautan per alamat IP untuk menekan penyalahgunaan.

## Teknologi

- Next.js 16 dan React 19 dengan App Router
- TypeScript
- Tailwind CSS v4
- Prisma 6 dan PostgreSQL dari Supabase lewat connection pooler
- Paket qrcode untuk membuat kode QR tautan

## Cara Instalasi

Prasyarat:

- Node.js 20 atau lebih baru
- Database PostgreSQL, misalnya project Supabase

Langkah instalasi:

```bash
git clone https://github.com/bintangyudhis/pendekin.git
cd pendekin
npm install
cp .env.example .env
```

Isi nilai variabel berikut di berkas `.env`:

- `DATABASE_URL`
- `DIRECT_URL`

Lalu jalankan migrasi database:

```bash
npx prisma migrate deploy
```

## Cara Menjalankan

Mode pengembangan:

```bash
npm run dev
```

Buka http://localhost:3000 di browser. Buat akun lewat http://localhost:3000/daftar, lalu dasbor akunmu berada di http://localhost:3000/dasbor.

Mode produksi:

```bash
npm run build
npm start
```

Perintah `npm run build` menjalankan migrasi database lebih dulu, lalu membangun aplikasi. Pemeriksaan kode memakai `npm run lint`.

## Tangkapan Layar

![Tampilan halaman utama Pendekin.](docs/screenshot.png)

## Lisensi

Proyek ini memakai lisensi MIT. Lihat berkas [LICENSE](LICENSE).
