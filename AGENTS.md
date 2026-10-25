## Pelajaran Day 4 (Next.js 16 + Tailwind v4)

- Build lokal cukup `npx next build` (tanpa migrate). `npm run build` penuh
  (`prisma migrate deploy && next build`) butuh DATABASE_URL/DIRECT_URL
  Supabase — kredensialnya hanya ada di Vercel env, tidak di VM.
- Migrasi ditulis manual mengikuti gaya keluaran Prisma (lihat
  `prisma/migrations/0001_pendekin_init/migration.sql`); di-apply otomatis
  saat deploy Vercel.
- Nama migrasi WAJIB unik per repo (prefiks `pendekin_`) karena database
  Supabase `streak-apps` dipakai bersama repo lain (topi-surya-iot, tulisqu).
- Tema "Cap Pos": token terkunci di `src/app/globals.css`
  (`--color-paper/ink/accent/line/muted`), font Archivo + IBM Plex Mono.
  Tanpa gradasi, tanpa emoji, tanpa statistik karangan — patuhi skill
  `hallmark` (sebelum menulis UI) dan checklist `kill-ai-slop` (sesudah).
- DILARANG menampilkan progres/rencana pengerjaan program di website publik.
- Util `src/lib/slug.ts` (acakSlug, slugCustomValid, slugBolehDipakai) dan
  `src/lib/tautan.ts` (normalisasiUrl) disiapkan untuk API Day 5.

## Pelajaran Day 5 (API routes + redirect)

- `export const dynamic = "force-dynamic"` DITOLAK saat `cacheComponents: true`
  (Next 16): build gagal dengan pesan "not compatible". Route handler yang
  membaca `request`/`params` sudah dinamis otomatis — tidak perlu config itu.
- `notFound()` bisa dipanggil di Route Handler — me-render `not-found.tsx`
  di segmen yang sama (`src/app/[code]/not-found.tsx`).
- Redirect shortlink pakai `NextResponse.redirect(url, { status: 308, headers:
  { "Cache-Control": "no-store" } })` — tanpa no-store, peramban meng-cache
  308 dan klik berikutnya tidak tercatat.
- Kegagalan `prisma.click.create` tidak boleh menggagalkan redirect:
  bungkus try/catch dan log saja.
- P2002 (unique violation) pada `link.create` = balapan dua request dengan
  kode custom sama → kembalikan 409, bukan 500.
- Rate limit in-memory cukup untuk rem darurat di satu instance; di Vercel
  serverless tiap instance punya hitungannya sendiri (catat di komentar kode).

## Pelajaran Day 6 (dasbor)

- `cacheComponents: true` menolak `export const dynamic` DAN menolak
  `connection()` di root page saat prerender ("blocking-prerender-dynamic").
  Pola yang benar di Next 16: cangkang halaman statis + komponen server
  async (`IsiDasbor`) di dalam `<Suspense>` — hasilnya Partial Prerender
  (◐): cangkang statis, isi dinamis di-streaming tiap request.
- `qrcode` (node-qrcode) render SVG tanpa width/height (hanya viewBox) —
  atur ukuran lewat CSS (`[&_svg]:w-full`). Warna modul diganti ke tinta
  tema (#1c1813 di atas #faf7f1): kontras tetap jauh di atas ambang pindai.
- Agregasi harian memakai zona Asia/Jakarta via `Intl.DateTimeFormat`
  (tanpa dependensi timezone): batas hari = 00:00 WIB, bukan UTC.
- `dangerouslySetInnerHTML` untuk QR aman karena SVG dibuat di server dari
  kode tervalidasi (slugBolehDipakai) + domain konstanta — bukan input
  mentah user. Komentar alasannya ditulis di kode.
- "dasbor" ditambahkan ke KODE_DILARANG agar kode custom tak menabrak
  route /dasbor.
- Sapuan keamanan ringan Day 6 (§1,§4,§6): history git bersih dari secret
  (hanya placeholder di .env.example); tanpa NEXT_PUBLIC_; tanpa outbound
  fetch baru (QR lokal, bukan API eksternal); PATCH/DELETE dibatasi
  60/jam per IP + body 16KB + `aktif` wajib boolean. CATATAN: endpoint
  stats/PATCH/DELETE masih publik — proteksi token pemilik adalah fitur
  Day 7 sesuai PLAN. `npm audit` diblokir kebijakan registry di VM ini
  (policy_denied), bukan temuan kode; qrcode = paket resmi node-qrcode
  yang umum dipakai.

## Perbaikan 24 Okt (permintaan Yudhis: navbar, tombol, anti-banjir)

- BilahAtas kini `sticky top-0 z-50 bg-paper/85 backdrop-blur-md` — satu
  komponen dipakai semua halaman, jadi cukup ubah di situ. Jangkar
  beranda diberi `scroll-mt-20` agar tidak tertutup bilah lengket.
- vercel.json memuat `"regions": ["sin1"]` (fungsi dekat DB Supabase
  Singapura) — tanpa ini fungsi jalan di region default AS dan tiap klik
  tombol terasa lambat. Toggle dasbor optimistis + `router.refresh()`
  sesudah mutasi; status sibuk per aksi (`aksiSibuk`), bukan satu flag.
- Anti-banjir pembuatan: penghitung in-memory POST DIGANTI hitungan
  database. Kolom `Link.creatorIp` (migrasi 0002, nullable, tidak pernah
  ditampilkan) + indeks `[creatorIp, createdAt]`; batas: 10/jam + 30/24jam
  per IP, pemutus global 300/24jam, balas 429 + Retry-After. Body POST
  kini maks 4 KB (dulu 16 KB). CAPTCHA belum dipasang — kandidat
  berikutnya bila banjir berlanjut (Turnstile butuh kunci Cloudflare).


## Pelajaran Day 7 (proteksi pemilik + polish final)

- Proteksi = token sederhana lewat env server `PENDEKIN_OWNER_TOKEN`
  (bukan NEXT_PUBLIC_, tidak pernah ke bundel klien). Cookie sesi berisi
  HASH SHA-256 token, bukan token mentah; perbandingan token pakai
  `timingSafeEqual` atas hash agar panjang token tidak bocor lewat waktu.
  Cookie httpOnly + SameSite lax + Secure di produksi, path "/", 30 hari.
- Fail-closed: server tanpa token menjawab 503
  (`token-belum-dikonfigurasi`), bukan membuka dasbor. Endpoint pemilik
  (GET stats, PATCH, DELETE) dijaga `penolakanPemilik()` di awal handler:
  cookie sesi ATAU header `x-owner-token`. Perhatian: dua handler memakai
  variabel `ditolak` untuk rate limit — variabel penjaga harus bernama lain
  (`ditolakPemilik`) agar build Turbopack tidak gagal "defined multiple times".
- Dasbor dijaga di Server Component `IsiDasbor` (di dalam Suspense), bukan
  di page root: tanpa sesi, database tidak dibaca sama sekali dan yang
  tampil hanya `FormMasuk`. Logout = hapus cookie + `router.refresh()`.
- Login dibatasi 10 percobaan/15 menit per IP (`cekLajuMasuk`) — rem
  tebakan token, bukan penghalang pemilik sah.
