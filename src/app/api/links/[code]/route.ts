import { prisma } from "@/lib/prisma";
import { slugBolehDipakai } from "@/lib/slug";
import { agregasiKlikHarian } from "@/lib/statistik";
import { apiGalat, apiSukses } from "@/lib/api";

type ParamsKode = { params: Promise<{ code: string }> };

const EMPAT_BELAS_HARI_MS = 14 * 24 * 60 * 60 * 1000;

/** Kode dari path harus lolos aturan kode tautan; kalau tidak → 404. */
function kodeAtauGalat(code: string) {
  return slugBolehDipakai(code)
    ? null
    : apiGalat("kode-tidak-valid", "Kode tautan tidak valid.", 404);
}

/**
 * GET /api/links/[kode]/stats — statistik satu tautan: total klik sepanjang
 * waktu + deret klik harian 14 hari terakhir (zona WIB, hari kosong = 0).
 */
export async function GET(_request: Request, { params }: ParamsKode) {
  const { code } = await params;
  const tidakValid = kodeAtauGalat(code);
  if (tidakValid) return tidakValid;

  const link = await prisma.link.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      url: true,
      title: true,
      active: true,
      createdAt: true,
    },
  });
  if (!link) {
    return apiGalat("tidak-ditemukan", "Tautan tidak ditemukan.", 404);
  }

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
