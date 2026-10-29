import { prisma } from "@/lib/prisma";
import { slugBolehDipakai } from "@/lib/slug";
import { agregasiKlikHarian } from "@/lib/statistik";
import { apiGalat, apiSukses } from "@/lib/api";
import { adalahGalat, tautanMilikPengguna } from "@/lib/akses-tautan";

type ParamsKode = { params: Promise<{ code: string }> };

const EMPAT_BELAS_HARI_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * GET /api/links/[kode]/stats: statistik satu tautan milik akun yang
 * masuk. Total klik sepanjang waktu + deret klik harian 14 hari
 * terakhir (zona WIB, hari kosong = 0).
 *
 * Rute ini berdiri sendiri sejak pengerjaan sistem akun (30 Okt 2026):
 * sebelumnya handler statistik menumpang di [kode]/route.ts sehingga
 * path /stats yang diminta PanelStatistik tidak pernah cocok dan
 * panel selalu gagal memuat. Sekarang path-nya benar-benar ada.
 */
export async function GET(request: Request, { params }: ParamsKode) {
  const { code } = await params;
  if (!slugBolehDipakai(code)) {
    return apiGalat("kode-tidak-valid", "Kode tautan tidak valid.", 404);
  }

  const link = await tautanMilikPengguna(request, code);
  if (adalahGalat(link)) return link;

  const [totalKlik, klikTerbaru] = await Promise.all([
    prisma.click.count({ where: { linkId: link.id } }),
    prisma.click.findMany({
      where: {
        linkId: link.id,
        clickedAt: { gte: new Date(Date.now() - EMPAT_BELAS_HARI_MS) },
      },
      select: { clickedAt: true },
    }),
  ]);

  return apiSukses({
    kode: link.code,
    url: link.url,
    judul: link.title,
    aktif: link.active,
    dibuat: link.createdAt.toISOString(),
    totalKlik,
    perHari: agregasiKlikHarian(
      klikTerbaru.map((k) => k.clickedAt),
      14,
    ),
  });
}
