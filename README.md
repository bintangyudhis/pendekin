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

## Endpoint API

### `POST /api/links` — buat shortlink

Body JSON:

```json
{
  "url": "https://contoh.com/artikel/panjang",
  "kode": "promo-okt",
  "judul": "Promo Oktober"
}
```

- `url` (wajib): tautan tujuan. Skema boleh ditulis tanpa `https://`.
- `kode` (opsional): kode custom 3–32 karakter (huruf, angka, `-`, `_`).
  Kosongkan untuk kode acak 7 karakter.
- `judul` (opsional): label untuk dikenali di dasbor, maks. 120 karakter.

Respons sukses `201`:

```json
{ "ok": true, "data": { "kode": "promo-okt", "url": "https://contoh.com/...", "judul": "Promo Oktober" } }
```

Kode galat: `url-tidak-valid` (422), `kode-tidak-valid` (422),
`kode-dipakai` (409), `terlalu-sering` (429, maks. 20/jam per IP),
`body-terlalu-besar` (413).

Keamanan: URL ke host internal (localhost, IP privat, metadata cloud)
ditolak, dan shortlink tidak boleh mengarah balik ke domain pendekin
sendiri (anti redirect berputar).

### `GET /:kode` — redirect + catat klik

Mengalihkan ke tautan asli dengan status `308` (redirect tidak di-cache
agar tiap kunjungan tercatat). Setiap kunjungan menyimpan satu baris
`Click`: waktu, `referer`, dan `user-agent`. Kode tak dikenal atau tautan
yang dinonaktifkan menampilkan halaman 404.

### `GET /api/links/:kode/stats` — statistik satu tautan

Respons `200`:

```json
{
  "ok": true,
  "data": {
    "kode": "promo-okt",
    "url": "https://contoh.com/...",
    "judul": "Promo Oktober",
    "aktif": true,
    "dibuat": "2026-10-24T01:00:00.000Z",
    "totalKlik": 42,
    "perHari": [{ "tanggal": "2026-10-24", "label": "24 Okt", "klik": 5 }]
  }
}
```

`perHari` berisi 14 hari terakhir (zona WIB); hari tanpa klik bernilai 0.
Kode tak dikenal → `tidak-ditemukan` (404).

### `PATCH /api/links/:kode` — aktif/nonaktifkan tautan

Body `{ "aktif": false }` menonaktifkan: tautan menampilkan 404 saat dibuka
dan berhenti mencatat klik. Respons `200`:

```json
{ "ok": true, "data": { "kode": "promo-okt", "aktif": false } }
```

`aktif` wajib boolean (422 bila bukan). Dibatasi 60 mutasi/jam per IP
(`terlalu-sering`, 429).

### `DELETE /api/links/:kode` — hapus tautan

Menghapus tautan beserta seluruh riwayat kliknya. Respons `200`:

```json
{ "ok": true, "data": { "kode": "promo-okt" } }
```

Kode tak dikenal → `tidak-ditemukan` (404). Batas laju sama seperti PATCH.

### Halaman `/dasbor`

Dasbor pemilik: ringkasan (jumlah tautan, total klik, klik 7 hari) +
daftar tautan — tiap baris punya tombol salin, panel kode QR (di-render
di server), panel statistik (total + grafik klik harian 14 hari, dimuat
lazy dari endpoint stats), tombol aktif/nonaktif, dan hapus dengan
konfirmasi dua langkah.

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
