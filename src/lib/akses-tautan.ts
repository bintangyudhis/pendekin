/**
 * Penjaga kepemilikan tautan untuk endpoint dasbor (statistik, PATCH,
 * DELETE). Inti perlindungan IDOR pendekin sejak sistem akun:
 *
 * - Belum masuk: 401 perlu-masuk.
 * - Tautan tidak ada ATAU bukan milik akun yang masuk: sama-sama 404,
 *   agar keberadaan tautan orang lain tidak bocor dari perbedaan respons.
 * - Tautan lama dari era token pemilik (userId null) tidak bisa diakses
 *   akun mana pun lewat jalur ini. Redirect publiknya tetap berjalan,
 *   karena jalur redirect tidak melewati penjaga ini.
 */

import { prisma } from "@/lib/prisma";
import { apiGalat, type ApiGalat } from "@/lib/api";
import { penggunaDariRequest } from "@/lib/auth";
import type { NextResponse } from "next/server";

export type TautanTerjaga = {
  id: string;
  code: string;
  url: string;
  title: string | null;
  active: boolean;
  createdAt: Date;
};

/** Muat tautan hanya bila ia milik akun yang sedang masuk. */
export async function tautanMilikPengguna(
  request: Request,
  code: string,
): Promise<TautanTerjaga | NextResponse<ApiGalat>> {
  const pengguna = await penggunaDariRequest(request);
  if (!pengguna) {
    return apiGalat(
      "perlu-masuk",
      "Masuk dulu untuk mengakses data tautanmu.",
      401,
    );
  }
  const link = await prisma.link.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      url: true,
      title: true,
      active: true,
      createdAt: true,
      userId: true,
    },
  });
  if (!link || link.userId !== pengguna.id) {
    return apiGalat("tidak-ditemukan", "Tautan tidak ditemukan.", 404);
  }
  return link;
}

/** Pemeriksa tipe: hasil penjaga adalah respons galat, bukan tautan. */
export function adalahGalat(
  hasil: TautanTerjaga | NextResponse<ApiGalat>,
): hasil is NextResponse<ApiGalat> {
  return "status" in hasil;
}
