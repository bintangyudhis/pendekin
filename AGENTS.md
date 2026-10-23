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
