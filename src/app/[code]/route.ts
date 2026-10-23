import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ParamsKode = { params: Promise<{ code: string }> };

/**
 * GET /[kode] — alihkan pengunjung ke tautan asli dengan status 308
 * (redirect permanen, metode request dipertahankan).
 *
 * Header `Cache-Control: no-store` dipasang agar peramban tidak meng-cache
 * redirect-nya: tiap kunjungan harus lewat server supaya tercatat sebagai
 * klik dan supaya penonaktifan tautan langsung berlaku.
 */
export async function GET(_request: Request, { params }: ParamsKode) {
  const { code } = await params;
  const link = await prisma.link.findUnique({
    where: { code },
    select: { id: true, url: true, active: true },
  });

  // Kode tak dikenal atau tautan dinonaktifkan → halaman 404.
  if (!link || !link.active) notFound();

  // Catat kunjungan sebagai satu baris Click: dasar statistik dasbor.
  await catatKlik(link.id, _request);

  return NextResponse.redirect(link.url, {
    status: 308,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Potong header ke panjang kolom agar insert tidak pernah gagal. */
function potong(nilai: string | null, maks: number): string | null {
  if (nilai === null) return null;
  const bersih = nilai.trim();
  return bersih ? bersih.slice(0, maks) : null;
}

/** Simpan satu baris Click: waktu (default now), referer, user-agent. */
async function catatKlik(linkId: string, request: Request): Promise<void> {
  try {
    await prisma.click.create({
      data: {
        linkId,
        referer: potong(request.headers.get("referer"), 2048),
        userAgent: potong(request.headers.get("user-agent"), 512),
      },
    });
  } catch (e) {
    // Statistik tidak boleh menggagalkan redirect pengunjung.
    console.error("gagal mencatat klik:", e);
  }
}
