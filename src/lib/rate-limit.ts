/**
 * Pembatas laju sederhana per IP untuk endpoint publik (mis. POST /api/links).
 *
 * Disimpan di memori: cukup untuk satu instance server. Di serverless
 * (Vercel), tiap instance punya hitungannya sendiri dan memori direset saat
 * cold start — cukup sebagai rem darurat penyalahgunaan, bukan kuota ketat.
 */

const JENDELA_MS = 60 * 60 * 1000; // 1 jam
const MAKS_PER_JENDELA = 20;

const catatan = new Map<string, number[]>();

export type HasilLaju = {
  boleh: boolean;
  /** Detik sampai jendela saat ini berakhir (untuk header Retry-After). */
  tungguDetik: number;
};

/** Catat satu percobaan dari IP; tolak bila melewati batas jendela. */
export function cekLaju(ip: string): HasilLaju {
  const sekarang = Date.now();
  const batasBawah = sekarang - JENDELA_MS;
  const riwayat = (catatan.get(ip) ?? []).filter((t) => t > batasBawah);

  if (riwayat.length >= MAKS_PER_JENDELA) {
    const tungguDetik = Math.ceil((riwayat[0] + JENDELA_MS - sekarang) / 1000);
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
}

/** Ambil IP klien dari header proxy, fallback ke "tak-dikenal". */
export function ipKlien(request: Request): string {
  const teruskan = request.headers.get("x-forwarded-for");
  if (teruskan) {
    const pertama = teruskan.split(",")[0]?.trim();
    if (pertama) return pertama;
  }
  return "tak-dikenal";
}
