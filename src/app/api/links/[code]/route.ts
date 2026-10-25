import { prisma } from "@/lib/prisma";
import { slugBolehDipakai } from "@/lib/slug";
import { agregasiKlikHarian } from "@/lib/statistik";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekLajuMutasi, ipKlien } from "@/lib/rate-limit";
import {
  pemilikMasukDariRequest,
  tokenPemilikDikonfigurasi,
} from "@/lib/pemilik";

type ParamsKode = { params: Promise<{ code: string }> };

const EMPAT_BELAS_HARI_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Penjaga data pemilik: semua endpoint di file ini (statistik, PATCH,
 * DELETE) hanya untuk pemilik. Cookie sesi dasbor atau header
 * `x-owner-token` yang sah. Server tanpa token terkonfigurasi menjawab
 * 503 — fail-closed, bukan membiarkan akses tanpa proteksi.
 */
function penolakanPemilik(request: Request) {
  if (!tokenPemilikDikonfigurasi()) {
    return apiGalat(
      "token-belum-dikonfigurasi",
      "Token pemilik belum dipasang di server.",
      503,
    );
  }
  if (!pemilikMasukDariRequest(request)) {
    return apiGalat(
      "perlu-masuk",
      "Data ini hanya untuk pemilik tautan. Masuk dulu lewat dasbor.",
      401,
    );
  }
  return null;
}

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
export async function GET(request: Request, { params }: ParamsKode) {
  const ditolakPemilik = penolakanPemilik(request);
  if (ditolakPemilik) return ditolakPemilik;
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
 * PATCH /api/links/[kode] — aktifkan/nonaktifkan tautan.
 * Body: { "aktif": true | false }. Tautan nonaktif menampilkan 404
 * saat dibuka dan berhenti mencatat klik.
 */
export async function PATCH(request: Request, { params }: ParamsKode) {
  const ditolakPemilik = penolakanPemilik(request);
  if (ditolakPemilik) return ditolakPemilik;
  const { code } = await params;
  const tidakValid = kodeAtauGalat(code);
  if (tidakValid) return tidakValid;

  const ditolak = tolakLaju(request);
  if (ditolak) return ditolak;

  const hasil = await bacaJson<BodyAktif>(request);
  if ("galat" in hasil) {
    return apiGalat("body-tidak-valid", "Body harus berupa objek JSON.", 400);
  }
  if (typeof hasil.data.aktif !== "boolean") {
    return apiGalat(
      "aktif-tidak-valid",
      'Field `aktif` wajib boolean: true atau false.',
      422,
    );
  }

  try {
    const link = await prisma.link.update({
      where: { code },
      data: { active: hasil.data.aktif },
      select: { code: true, active: true },
    });
    return apiSukses({ kode: link.code, aktif: link.active });
  } catch (e) {
    // P2025: update mengenai baris yang tidak ada.
    if ((e as { code?: string }).code === "P2025") {
      return apiGalat("tidak-ditemukan", "Tautan tidak ditemukan.", 404);
    }
    console.error("PATCH /api/links/[kode] gagal:", e);
    return apiGalat(
      "galat-server",
      "Terjadi galat di server. Coba lagi sebentar.",
      500,
    );
  }
}

/**
 * DELETE /api/links/[kode] — hapus tautan beserta seluruh riwayat kliknya
 * (relasi Click memakai onDelete: Cascade).
 */
export async function DELETE(request: Request, { params }: ParamsKode) {
  const ditolakPemilik = penolakanPemilik(request);
  if (ditolakPemilik) return ditolakPemilik;
  const { code } = await params;
  const tidakValid = kodeAtauGalat(code);
  if (tidakValid) return tidakValid;

  const ditolak = tolakLaju(request);
  if (ditolak) return ditolak;

  try {
    await prisma.link.delete({ where: { code } });
    return apiSukses({ kode: code });
  } catch (e) {
    // P2025: delete mengenai baris yang tidak ada.
    if ((e as { code?: string }).code === "P2025") {
      return apiGalat("tidak-ditemukan", "Tautan tidak ditemukan.", 404);
    }
    console.error("DELETE /api/links/[kode] gagal:", e);
    return apiGalat(
      "galat-server",
      "Terjadi galat di server. Coba lagi sebentar.",
      500,
    );
  }
}
