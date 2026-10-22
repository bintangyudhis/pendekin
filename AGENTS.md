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
