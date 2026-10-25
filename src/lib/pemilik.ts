/**
 * Token pemilik dasbor — proteksi sederhana untuk data pemilik.
 *
 * Modelnya sengaja tanpa akun/password database: satu token rahasia yang
 * hanya diketahui pemilik, disimpan sebagai environment variable server
 * `PENDEKIN_OWNER_TOKEN` (bukan NEXT_PUBLIC_*, jadi tidak pernah sampai
 * ke bundel JavaScript klien).
 *
 * Yang disimpan di cookie peramban BUKAN token mentahnya, melainkan hash
 * SHA-256-nya: cookie yang bocor tidak bisa dipakai sebagai token header,
 * dan token mentah tidak pernah ditulis ke cookie, log, atau respons.
 * Perbandingan token memakai `timingSafeEqual` atas hash berukuran tetap,
 * jadi panjang token tidak bocor lewat waktu respons.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** Nama cookie sesi pemilik. httpOnly, jadi JavaScript halaman tak bisa membacanya. */
export const NAMA_COOKIE_PEMILIK = "pendekin_pemilik";

/** Umur sesi pemilik: 30 hari, agar tidak perlu masuk tiap kali membuka dasbor. */
export const UMUR_COOKIE_PEMILIK_DETIK = 30 * 24 * 60 * 60;

/** Benar bila server sudah diberi token pemilik lewat environment. */
export function tokenPemilikDikonfigurasi(): boolean {
  return Boolean(process.env.PENDEKIN_OWNER_TOKEN?.trim());
}

function hashNilai(nilai: string): Buffer {
  return createHash("sha256").update(nilai).digest();
}

/** Hash token untuk disimpan di cookie (bukan token mentah). */
export function hashTokenPemilik(token: string): string {
  return hashNilai(token).toString("hex");
}

/**
 * Periksa token mentah (dari body login atau header `x-owner-token`)
 * terhadap token server, dengan perbandingan waktu-konstan.
 */
export function tokenPemilikSah(kandidat: string | undefined | null): boolean {
  const diharapkan = process.env.PENDEKIN_OWNER_TOKEN?.trim();
  if (!diharapkan || !kandidat) return false;
  return timingSafeEqual(hashNilai(kandidat), hashNilai(diharapkan));
}

/** Periksa nilai cookie sesi terhadap hash token server. */
export function cookiePemilikSah(nilaiCookie: string | undefined): boolean {
  const diharapkan = process.env.PENDEKIN_OWNER_TOKEN?.trim();
  if (!diharapkan || !nilaiCookie) return false;
  return nilaiCookie === hashTokenPemilik(diharapkan);
}

/** Ambil nilai satu cookie dari header `Cookie` mentah sebuah Request. */
function nilaiCookieDariRequest(request: Request, nama: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const bagian of header.split(";")) {
    const pisah = bagian.trim().split("=");
    if (pisah[0] === nama) return decodeURIComponent(pisah.slice(1).join("="));
  }
  return undefined;
}

/**
 * Pemilik dikenali lewat salah satu dari dua jalur:
 * cookie sesi (peramban dasbor) atau header `x-owner-token` (klien API).
 * Header tidak pernah dibaca dari halaman publik — hanya dari pemanggil
 * API yang sengaja mengirimnya.
 */
export function pemilikMasukDariRequest(request: Request): boolean {
  if (cookiePemilikSah(nilaiCookieDariRequest(request, NAMA_COOKIE_PEMILIK))) {
    return true;
  }
  return tokenPemilikSah(request.headers.get("x-owner-token"));
}

/** Pemeriksaan sesi untuk Server Component (dasbor). */
export async function pemilikMasukDariCookieServer(): Promise<boolean> {
  const jar = await cookies();
  return cookiePemilikSah(jar.get(NAMA_COOKIE_PEMILIK)?.value);
}
