/**
 * Domain kanonis tautan pendek (keputusan satu-pintu 2026-10-23): semua
 * shortlink disajikan di domain ini, bukan di *.vercel.app. Dasbor dan
 * kode QR memakai konstanta ini agar konsisten.
 */
export const DOMAIN_PENDEK = "pendekin.bintangyudhis.my.id";

/** Bentuk tautan pendek penuh untuk sebuah kode, mis. ".../x7K2qQ". */
export function tautanPendek(kode: string): string {
  return `https://${DOMAIN_PENDEK}/${kode}`;
}
