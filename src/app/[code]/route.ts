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

  return NextResponse.redirect(link.url, {
    status: 308,
    headers: { "Cache-Control": "no-store" },
  });
}
