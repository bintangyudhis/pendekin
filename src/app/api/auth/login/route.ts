import { prisma } from "@/lib/prisma";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekLajuAuth, ipKlien } from "@/lib/rate-limit";
import {
  buatSesi,
  hashKataSandi,
  kataSandiCocok,
  normalisasiEmail,
  setelCookieSesi,
} from "@/lib/auth";

type BodyMasuk = {
  email?: unknown;
  kataSandi?: unknown;
};

/**
 * Hash umpan untuk jalur "email tidak terdaftar": verifikasi tetap
 * menjalankan scrypt agar waktu respons tidak membocorkan apakah
 * sebuah email terdaftar atau tidak. Dibuat sekali per proses.
 */
let hashUmpan: Promise<string> | null = null;
function ambilHashUmpan(): Promise<string> {
  hashUmpan ??= hashKataSandi("bukan-kata-sandi-siapa-pun");
  return hashUmpan;
}

/**
 * POST /api/auth/login: masuk dengan email + kata sandi akun.
 *
 * Pesan galat sengaja sama untuk email tak terdaftar dan kata sandi
 * salah ("Email atau kata sandi salah"), agar endpoint ini tidak bisa
 * dipakai menebak email mana saja yang punya akun. Sukses membuat
 * sesi baru di database dan menyetel cookie httpOnly.
 */
export async function POST(request: Request) {
  const laju = cekLajuAuth(ipKlien(request));
  if (!laju.boleh) {
    const res = apiGalat(
      "terlalu-sering",
      "Terlalu banyak percobaan masuk. Tunggu sebentar, lalu coba lagi.",
      429,
    );
    res.headers.set("Retry-After", String(laju.tungguDetik));
    return res;
  }

  const hasil = await bacaJson<BodyMasuk>(request, 4 * 1024);
  if ("galat" in hasil) {
    return apiGalat("body-tidak-valid", "Body harus berupa objek JSON.", 400);
  }
  const { email: emailMentah, kataSandi } = hasil.data;
  if (typeof emailMentah !== "string" || typeof kataSandi !== "string") {
    return apiGalat(
      "kredensial-wajib",
      "Isi email dan kata sandi.",
      422,
    );
  }

  try {
    const pengguna = await prisma.pendekinUser.findUnique({
      where: { email: normalisasiEmail(emailMentah) },
      select: { id: true, email: true, nama: true, kataSandiHash: true },
    });

    const cocok = await kataSandiCocok(
      kataSandi,
      pengguna?.kataSandiHash ?? (await ambilHashUmpan()),
    );
    if (!pengguna || !cocok) {
      return apiGalat(
        "kredensial-salah",
        "Email atau kata sandi salah.",
        401,
      );
    }

    const res = apiSukses({
      id: pengguna.id,
      email: pengguna.email,
      nama: pengguna.nama,
    });
    setelCookieSesi(res, await buatSesi(pengguna.id));
    return res;
  } catch (e) {
    console.error("POST /api/auth/login gagal:", e);
    return apiGalat(
      "galat-server",
      "Terjadi galat di server. Coba lagi sebentar.",
      500,
    );
  }
}
