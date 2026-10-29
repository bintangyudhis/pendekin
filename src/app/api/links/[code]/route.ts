import { prisma } from "@/lib/prisma";
import { slugBolehDipakai } from "@/lib/slug";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekLajuMutasi, ipKlien } from "@/lib/rate-limit";
import { adalahGalat, tautanMilikPengguna } from "@/lib/akses-tautan";

type ParamsKode = { params: Promise<{ code: string }> };

/** Kode dari path harus lolos aturan kode tautan; kalau tidak, 404. */
function kodeAtauGalat(code: string) {
  return slugBolehDipakai(code)
    ? null
    : apiGalat("kode-tidak-valid", "Kode tautan tidak valid.", 404);
}

/** Tanggapi penolakan laju dengan 429 + header Retry-After. */
function tolakLaju(request: Request) {
  const laju = cekLajuMutasi(ipKlien(request));
  if (!laju.boleh) {
    const res = apiGalat(
      "terlalu-sering",
      "Terlalu banyak mengubah tautan. Coba lagi nanti.",
      429,
    );
    res.headers.set("Retry-After", String(laju.tungguDetik));
    return res;
  }
  return null;
}

type BodyAktif = { aktif?: unknown };

/**
 * PATCH /api/links/[kode]: aktifkan atau nonaktifkan tautan milik
 * akun yang masuk. Body: { "aktif": true | false }. Tautan nonaktif
 * menampilkan 404 saat dibuka dan berhenti mencatat klik.
 */
export async function PATCH(request: Request, { params }: ParamsKode) {
  const { code } = await params;
  const tidakValid = kodeAtauGalat(code);
  if (tidakValid) return tidakValid;

  const ditolak = tolakLaju(request);
  if (ditolak) return ditolak;

  const link = await tautanMilikPengguna(request, code);
  if (adalahGalat(link)) return link;

  const hasil = await bacaJson<BodyAktif>(request);
  if ("galat" in hasil) {
    return apiGalat("body-tidak-valid", "Body harus berupa objek JSON.", 400);
  }
  if (typeof hasil.data.aktif !== "boolean") {
    return apiGalat(
      "aktif-tidak-valid",
      "Field `aktif` wajib boolean: true atau false.",
      422,
    );
  }

  const diperbarui = await prisma.link.update({
    where: { id: link.id },
    data: { active: hasil.data.aktif },
    select: { code: true, active: true },
  });
  return apiSukses({ kode: diperbarui.code, aktif: diperbarui.active });
}

/**
 * DELETE /api/links/[kode]: hapus tautan milik akun yang masuk
 * beserta seluruh riwayat kliknya (relasi Click onDelete: Cascade).
 */
export async function DELETE(request: Request, { params }: ParamsKode) {
  const { code } = await params;
  const tidakValid = kodeAtauGalat(code);
  if (tidakValid) return tidakValid;

  const ditolak = tolakLaju(request);
  if (ditolak) return ditolak;

  const link = await tautanMilikPengguna(request, code);
  if (adalahGalat(link)) return link;

  await prisma.link.delete({ where: { id: link.id } });
  return apiSukses({ kode: code });
}
