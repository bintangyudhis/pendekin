/**
 * Agregasi klik untuk dasbor. Semua pengelompokan hari memakai zona
 * Asia/Jakarta (WIB) — jam 00:00 WIB adalah batas hari, bukan UTC.
 */

const SEHARI_MS = 86_400_000;

const fmtKunci = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const fmtLabel = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
});

const fmtPenuh = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export type KlikHarian = {
  /** Kunci hari "YYYY-MM-DD" (WIB). */
  tanggal: string;
  /** Label pendek untuk sumbu grafik, mis. "24 Okt". */
  label: string;
  klik: number;
};

/**
 * Deret N hari terakhir (termasuk hari ini) dengan jumlah klik per hari.
 * Hari tanpa klik tetap muncul dengan nilai 0 agar grafik tidak bolong.
 */
export function agregasiKlikHarian(
  waktuKlik: Date[],
  jumlahHari: number,
): KlikHarian[] {
  const hitung = new Map<string, number>();
  for (const waktu of waktuKlik) {
    const kunci = fmtKunci.format(waktu);
    hitung.set(kunci, (hitung.get(kunci) ?? 0) + 1);
  }
  const sekarang = Date.now();
  const deret: KlikHarian[] = [];
  for (let i = jumlahHari - 1; i >= 0; i--) {
    const hari = new Date(sekarang - i * SEHARI_MS);
    const tanggal = fmtKunci.format(hari);
    deret.push({
      tanggal,
      label: fmtLabel.format(hari),
      klik: hitung.get(tanggal) ?? 0,
    });
  }
  return deret;
}

/** Label tanggal WIB untuk tampilan, mis. "24 Okt 2026". */
export function labelTanggalPenuh(tanggal: Date): string {
  return fmtPenuh.format(tanggal);
}
