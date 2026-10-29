/**
 * Pembatas laju untuk endpoint publik — dua lapis:
 *
 * 1. Pembuatan tautan (POST /api/links): dihitung dari DATABASE (baris
 *    Link menurut createdAt + creatorIp), jadi berlaku konsisten lintas
 *    instance serverless — lihat `cekBatasPembuatan`.
 * 2. Mutasi dasbor (PATCH/DELETE): penghitung in-memory sederhana per
 *    instance. Cukup sebagai rem darurat penyalahgunaan, bukan kuota
 *    ketat — memori direset saat cold start.
 */

import { prisma } from "@/lib/prisma";

export type HasilLaju = {
  boleh: boolean;
  /** Detik sampai jendela saat ini berakhir (untuk header Retry-After). */
  tungguDetik: number;
};

/** Bangun pemeriksa laju dengan jendela dan batasnya sendiri. */
function buatPemeriksaLaju(jendelaMs: number, maksPerJendela: number) {
  const catatan = new Map<string, number[]>();

  return function cek(ip: string): HasilLaju {
    const sekarang = Date.now();
    const batasBawah = sekarang - jendelaMs;
    const riwayat = (catatan.get(ip) ?? []).filter((t) => t > batasBawah);

    if (riwayat.length >= maksPerJendela) {
      const tungguDetik = Math.ceil((riwayat[0] + jendelaMs - sekarang) / 1000);
      return { boleh: false, tungguDetik: Math.max(tungguDetik, 1) };
    }

    riwayat.push(sekarang);
    catatan.set(ip, riwayat);
    // Bersihkan entri basi sesekali agar Map tidak membengkak.
    if (catatan.size > 5000) {
      for (const [kunci, waktu] of catatan) {
        if (waktu[waktu.length - 1] <= batasBawah) catatan.delete(kunci);
      }
    }
    return { boleh: true, tungguDetik: 0 };
  };
}

export type HasilBatas = {
  boleh: boolean;
  /** Kode galat mesin bila ditolak. */
  kode?: string;
  /** Pesan ramah untuk pengguna bila ditolak. */
  pesan?: string;
  /** Detik saran menunggu (untuk header Retry-After) bila ditolak. */
  tungguDetik: number;
};

const JAM_MS = 60 * 60 * 1000;
const HARI_MS = 24 * JAM_MS;

/** Kuota pembuatan tautan publik. */
export const BATAS_IP_JAM = 10;
export const BATAS_IP_HARI = 30;
export const BATAS_GLOBAL_HARI = 300;

/**
 * Periksa kuota pembuatan tautan dari hitungan database:
 * per IP maks 10 tautan/jam dan 30 tautan/24 jam, plus pemutus global
 * 300 tautan baru/24 jam untuk seluruh situs — agar satu penyerang (atau
 * banyak) tidak bisa membanjiri database sampai keberatan. Hanya tautan
 * yang benar-benar terbuat yang dihitung; percobaan gagal tidak mengurangi
 * kuota siapa pun.
 */
export async function cekBatasPembuatan(ip: string): Promise<HasilBatas> {
  const sekarang = Date.now();
  const sejakJam = new Date(sekarang - JAM_MS);
  const sejakHari = new Date(sekarang - HARI_MS);

  const [perIpJam, perIpHari, globalHari] = await Promise.all([
    prisma.link.count({
      where: { creatorIp: ip, createdAt: { gte: sejakJam } },
    }),
    prisma.link.count({
      where: { creatorIp: ip, createdAt: { gte: sejakHari } },
    }),
    prisma.link.count({ where: { createdAt: { gte: sejakHari } } }),
  ]);

  if (perIpJam >= BATAS_IP_JAM) {
    return {
      boleh: false,
      kode: "batas-ip-jam",
      pesan:
        "Kamu sudah membuat 10 tautan dalam sejam terakhir. Istirahat sebentar, lalu coba lagi ya.",
      tungguDetik: 15 * 60,
    };
  }
  if (perIpHari >= BATAS_IP_HARI) {
    return {
      boleh: false,
      kode: "batas-ip-hari",
      pesan:
        "Batas harianmu tercapai: maksimal 30 tautan baru per hari. Coba lagi besok ya.",
      tungguDetik: 60 * 60,
    };
  }
  if (globalHari >= BATAS_GLOBAL_HARI) {
    return {
      boleh: false,
      kode: "batas-global",
      pesan:
        "Pendekin sedang ramai sekali — kuota tautan baru hari ini sudah penuh. Coba lagi besok ya.",
      tungguDetik: 60 * 60,
    };
  }
  return { boleh: true, tungguDetik: 0 };
}

/**
 * Mutasi dasbor: 60/jam per IP (dipakai PATCH/DELETE /api/links/[kode]).
 * Batasnya lebih longgar dari pembuatan karena pemilik sah bisa
 * beres-beres banyak tautan sekaligus — tetap cukup untuk menahan skrip
 * penghapus massal.
 */
export const cekLajuMutasi = buatPemeriksaLaju(60 * 60 * 1000, 60);

/**
 * Percobaan auth (daftar dan masuk): 10 percobaan per 15 menit per IP.
 * Cukup longgar untuk salah ketik, cukup sempit untuk menahan tebakan
 * kata sandi dan pendaftaran massal dari satu alamat.
 */
export const cekLajuAuth = buatPemeriksaLaju(15 * 60 * 1000, 10);

/** Ambil IP klien dari header proxy, fallback ke "tak-dikenal". */
export function ipKlien(request: Request): string {
  const teruskan = request.headers.get("x-forwarded-for");
  if (teruskan) {
    const pertama = teruskan.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return "tak-dikenal";
}
