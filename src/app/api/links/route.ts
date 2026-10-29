import { prisma } from "@/lib/prisma";
import { acakSlug, slugBolehDipakai } from "@/lib/slug";
import { normalisasiUrl } from "@/lib/tautan";
import { apiGalat, apiSukses, bacaJson } from "@/lib/api";
import { cekBatasPembuatan, ipKlien } from "@/lib/rate-limit";
import { penggunaDariRequest } from "@/lib/auth";

// Route handler yang membaca `request` selalu dinamis — tanpa perlu
// `export const dynamic` (ditolak saat cacheComponents aktif).

type BodyBuatTautan = {
  url?: unknown;
  kode?: unknown;
  judul?: unknown;
};

const PESAN_KODE =
  "Kode custom harus 3–32 karakter: huruf, angka, strip, atau underscore.";

export async function POST(request: Request) {
  try {
    // Membuat tautan wajib masuk: tautan dicatat atas nama akun
    // pembuatnya, dan hanya akun itu yang bisa melihat statistik
    // serta mengubahnya di dasbor.
    const pengguna = await penggunaDariRequest(request);
    if (!pengguna) {
      return apiGalat(
        "perlu-masuk",
        "Masuk dulu untuk membuat tautan. Belum punya akun? Daftar gratis.",
        401,
      );
    }

    // Kuota pembuatan dihitung dari database (per IP + global) agar
    // berlaku lintas instance serverless — bukan penghitung memori.
    const ip = ipKlien(request);
    const batas = await cekBatasPembuatan(ip);
    if (!batas.boleh) {
      const res = apiGalat(
        batas.kode ?? "terlalu-sering",
        batas.pesan ?? "Terlalu banyak membuat tautan. Coba lagi nanti.",
        429,
      );
      res.headers.set("Retry-After", String(batas.tungguDetik));
      return res;
    }

    // Body dibatasi 4 KB: payload pembuatan tautan yang sah jauh di
    // bawah itu, sisanya pasti sampah.
    const hasil = await bacaJson<BodyBuatTautan>(request, 4 * 1024);
    if ("galat" in hasil) {
      const status = hasil.galat === "terlalu-besar" ? 413 : 400;
      const pesan =
        hasil.galat === "terlalu-besar"
          ? "Body terlalu besar (maks 4 KB)."
          : "Body harus berupa objek JSON.";
      return apiGalat(`body-${hasil.galat}`, pesan, status);
    }
    const body = hasil.data;

    if (typeof body.url !== "string" || !body.url.trim()) {
      return apiGalat("url-wajib", "Isi field `url` dengan tautan tujuan.", 422);
    }

    // Jangan biarkan shortlink mengarah balik ke domain pendekin sendiri.
    const hostSendiri = request.headers.get("host")?.split(":")[0];
    const url = normalisasiUrl(body.url, hostSendiri);
    if (!url) {
      return apiGalat(
        "url-tidak-valid",
        "Tautan tujuan tidak valid. Pakai http/https dengan hostname yang benar.",
        422,
      );
    }

    let kode: string;
    if (typeof body.kode === "string" && body.kode !== "") {
      if (!slugBolehDipakai(body.kode)) {
        return apiGalat("kode-tidak-valid", PESAN_KODE, 422);
      }
      const bentrok = await prisma.link.findUnique({
        where: { code: body.kode },
        select: { id: true },
      });
      if (bentrok) {
        return apiGalat(
          "kode-dipakai",
          `Kode "${body.kode}" sudah dipakai. Pilih kode lain.`,
          409,
        );
      }
      kode = body.kode;
    } else {
      kode = await kodeUnik();
    }

    const judul =
      typeof body.judul === "string" && body.judul.trim()
        ? body.judul.trim().slice(0, 120)
        : null;

    const link = await prisma.link.create({
      data: { code: kode, url, title: judul, creatorIp: ip, userId: pengguna.id },
      select: { code: true, url: true, title: true, createdAt: true },
    });

    return apiSukses(
      { kode: link.code, url: link.url, judul: link.title },
      201,
    );
  } catch (e) {
    // Balapan dua request dengan kode custom sama: yang kalah dapat P2002.
    if ((e as { code?: string }).code === "P2002") {
      return apiGalat(
        "kode-dipakai",
        "Kode itu baru saja dipakai. Pilih kode lain.",
        409,
      );
    }
    console.error("POST /api/links gagal:", e);
    return apiGalat(
      "galat-server",
      "Terjadi galat di server. Coba lagi sebentar.",
      500,
    );
  }
}

/** Buat slug acak yang belum dipakai, coba ulang bila bentrok. */
async function kodeUnik(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const kode = acakSlug(7);
    const ada = await prisma.link.findUnique({
      where: { code: kode },
      select: { id: true },
    });
    if (!ada) return kode;
  }
  throw new Error("gagal-membuat-kode-unik");
}
