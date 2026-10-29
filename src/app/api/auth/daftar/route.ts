import { prisma } from "@/lib/prisma";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekLajuAuth, ipKlien } from "@/lib/rate-limit";
import {
  buatSesi,
  emailValid,
  hashKataSandi,
  kataSandiValid,
  normalisasiEmail,
  setelCookieSesi,
} from "@/lib/auth";

type BodyDaftar = {
  email?: unknown;
  kataSandi?: unknown;
  nama?: unknown;
};

/**
 * POST /api/auth/daftar: buat akun baru, lalu langsung masuk
 * (server membuat sesi dan menyetel cookie httpOnly).
 *
 * Kata sandi hanya disimpan sebagai hash scrypt. Email dinormalisasi
 * ke huruf kecil agar keunikannya tidak bisa diakali perbedaan kapital.
 */
export async function POST(request: Request) {
  const laju = cekLajuAuth(ipKlien(request));
  if (!laju.boleh) {
    const res = apiGalat(
      "terlalu-sering",
      "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.",
      429,
    );
    res.headers.set("Retry-After", String(laju.tungguDetik));
    return res;
  }

  const hasil = await bacaJson<BodyDaftar>(request, 4 * 1024);
  if ("galat" in hasil) {
    return apiGalat("body-tidak-valid", "Body harus berupa objek JSON.", 400);
  }
  const body = hasil.data;

  if (typeof body.email !== "string" || !emailValid(normalisasiEmail(body.email))) {
    return apiGalat("email-tidak-valid", "Isi email yang valid.", 422);
  }
  const email = normalisasiEmail(body.email);

  if (typeof body.kataSandi !== "string" || !kataSandiValid(body.kataSandi)) {
    return apiGalat(
      "kata-sandi-tidak-valid",
      "Kata sandi minimal 8 karakter.",
      422,
    );
  }

  const nama =
    typeof body.nama === "string" && body.nama.trim()
      ? body.nama.trim().slice(0, 60)
      : null;

  try {
    const sudahAda = await prisma.pendekinUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (sudahAda) {
      return apiGalat(
        "email-dipakai",
        "Email ini sudah terdaftar. Masuk saja lewat halaman masuk.",
        409,
      );
    }

    const pengguna = await prisma.pendekinUser.create({
      data: { email, nama, kataSandiHash: await hashKataSandi(body.kataSandi) },
      select: { id: true, email: true, nama: true },
    });

    const res = apiSukses(pengguna, 201);
    setelCookieSesi(res, await buatSesi(pengguna.id));
    return res;
  } catch (e) {
    // Balapan dua pendaftaran dengan email sama: yang kalah dapat P2002.
    if ((e as { code?: string }).code === "P2002") {
      return apiGalat(
        "email-dipakai",
        "Email ini sudah terdaftar. Masuk saja lewat halaman masuk.",
        409,
      );
    }
    console.error("POST /api/auth/daftar gagal:", e);
    return apiGalat(
      "galat-server",
      "Terjadi galat di server. Coba lagi sebentar.",
      500,
    );
  }
}
