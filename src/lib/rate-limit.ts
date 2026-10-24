/**
 * Pembatas laju sederhana per IP untuk endpoint publik.
 *
 * Disimpan di memori: cukup untuk satu instance server. Di serverless
 * (Vercel), tiap instance punya hitungannya sendiri dan memori direset saat
 * cold start — cukup sebagai rem darurat penyalahgunaan, bukan kuota ketat.
 */

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

/** Pembuatan tautan: 20/jam per IP (dipakai POST /api/links). */
export const cekLaju = buatPemeriksaLaju(60 * 60 * 1000, 20);

/**
 * Mutasi dasbor: 60/jam per IP (dipakai PATCH/DELETE /api/links/[kode]).
 * Batasnya lebih longgar dari pembuatan karena pemilik sah bisa
 * beres-beres banyak tautan sekaligus — tetap cukup untuk menahan skrip
 * penghapus massal.
 */
export const cekLajuMutasi = buatPemeriksaLaju(60 * 60 * 1000, 60);

/** Ambil IP klien dari header proxy, fallback ke "tak-dikenal". */
export function ipKlien(request: Request): string {
  const teruskan = request.headers.get("x-forwarded-for");
  if (teruskan) {
    const pertama = teruskan.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return "tak-dikenal";
}
