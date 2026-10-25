import { NextResponse } from "next/server";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekLajuMasuk, ipKlien } from "@/lib/rate-limit";
import {
  NAMA_COOKIE_PEMILIK,
  UMUR_COOKIE_PEMILIK_DETIK,
  hashTokenPemilik,
  tokenPemilikDikonfigurasi,
  tokenPemilikSah,
} from "@/lib/pemilik";

type BodyMasuk = { token?: unknown };

/**
 * POST /api/auth/login — masuk sebagai pemilik dasbor.
 * Body: { "token": "<nilai PENDEKIN_OWNER_TOKEN>" }.
 *
 * Bila token cocok, server menyetel cookie sesi httpOnly berisi HASH token
 * (bukan token mentah). Bila server belum dikonfigurasi token, jawab 503
 * dengan pesan yang jelas — bukan 401 yang menyesatkan.
 */
export async function POST(request: Request) {
  const laju = cekLajuMasuk(ipKlien(request));
  if (!laju.boleh) {
    const res = apiGalat(
      "terlalu-sering",
      "Terlalu banyak percobaan masuk. Tunggu sebentar, lalu coba lagi.",
      429,
    );
    res.headers.set("Retry-After", String(laju.tungguDetik));
    return res;
  }

  if (!tokenPemilikDikonfigurasi()) {
    return apiGalat(
      "token-belum-dikonfigurasi",
      "Token pemilik belum dipasang di server. Pasang PENDEKIN_OWNER_TOKEN di environment, lalu deploy ulang.",
      503,
    );
  }

  const hasil = await bacaJson<BodyMasuk>(request, 1024);
  if ("galat" in hasil) {
    return apiGalat("body-tidak-valid", "Body harus berupa objek JSON.", 400);
  }
  if (typeof hasil.data.token !== "string" || !hasil.data.token) {
    return apiGalat("token-wajib", "Isi field `token`.", 422);
  }

  // Perbandingan waktu-konstan ada di tokenPemilikSah; pesan galat dibuat
  // sama untuk token salah dan token kosong agar tidak membocorkan apa pun.
  if (!tokenPemilikSah(hasil.data.token)) {
    return apiGalat("token-salah", "Token tidak cocok. Periksa lagi.", 401);
  }

  const res = apiSukses({ masuk: true });
  res.cookies.set({
    name: NAMA_COOKIE_PEMILIK,
    value: hashTokenPemilik(hasil.data.token),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_COOKIE_PEMILIK_DETIK,
  });
  return res;
}
