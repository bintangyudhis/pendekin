# Pendekin

Pemendek tautan (URL shortener) dengan dasbor analitik klik. Tempel tautan
yang panjang, dapatkan tautan pendek yang gampang dibagikan — setiap
kunjungan dicatat dan divisualisasikan per tautan.

Stack: **Next.js 16** + **Tailwind CSS v4** + **React 19**, **Prisma 6** +
**PostgreSQL** (Supabase).

## Fitur

- **Buat shortlink** — `POST /api/links`: slug otomatis atau kode custom,
  dengan validasi URL.
- **Redirect + pencatatan klik** — `GET /[kode]`: redirect 308 ke tautan asli,
  mencatat waktu, referer, dan user-agent tiap kunjungan; kode tak dikenal
  menampilkan halaman 404.
- **Dasbor** — daftar tautan (tombol salin + kode QR), statistik klik per
  tautan, grafik klik harian, hapus/nonaktifkan tautan.
- **Proteksi** — daftar tautan hanya untuk pemilik (token sederhana).

## Skema database

| Model | Isi |
| ----- | --- |
| `Link` | `code` (unik), `url` tujuan, `title` opsional, `active` |
| `Click` | satu baris per kunjungan: `linkId`, `clickedAt`, `referer`, `userAgent` |

Nama migrasi memakai prefiks `pendekin` (mis. `0001_pendekin_init`) agar tidak
bentrok dengan repo lain yang berbagi database Supabase yang sama.

## Pengembangan lokal

```bash
cp .env.example .env   # isi DATABASE_URL & DIRECT_URL
npm install
npx prisma migrate dev
npm run dev
```

## Deploy

Deploy di Vercel. `vercel.json` memakai `ignoreCommand` sehingga commit yang
pesan-nya mengandung `[skip-vercel]` tidak memicu build (hemat limit build):
deploy resmi hanya lewat commit `Day N: deploy`. Build production menjalankan
`prisma migrate deploy && next build` — migrasi database ikut teraplikasi
otomatis.

Environment yang dibutuhkan di Vercel:

- `DATABASE_URL` — pooler transaksi Supabase (port 6543) + `?pgbouncer=true`
- `DIRECT_URL` — pooler session Supabase (port 5432), dipakai saat migrasi
