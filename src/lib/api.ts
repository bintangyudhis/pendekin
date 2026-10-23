import { NextResponse } from "next/server";

/**
 * Bentuk respons JSON yang konsisten untuk semua endpoint API pendekin.
 *
 * Sukses: { ok: true, data: {...} }
 * Galat:  { ok: false, kode: "...", pesan: "..." }
 */

export type ApiSukses<T> = { ok: true; data: T };
export type ApiGalat = { ok: false; kode: string; pesan: string };

/** Respons sukses JSON dengan status 200/201. */
export function apiSukses<T>(data: T, status = 200): NextResponse<ApiSukses<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Respons galat JSON dengan kode mesin + pesan bahasa Indonesia. */
export function apiGalat(
  kode: string,
  pesan: string,
  status = 400,
): NextResponse<ApiGalat> {
  return NextResponse.json({ ok: false, kode, pesan }, { status });
}

type HasilBaca<T> = { data: T } | { galat: "terlalu-besar" | "tidak-valid" };

/**
 * Baca body JSON dengan batas ukuran agar server tidak dipaksa menelan
 * body raksasa. Kembalikan penanda galat, bukan melempar exception.
 */
export async function bacaJson<T>(
  request: Request,
  batasByte = 16 * 1024,
): Promise<HasilBaca<T>> {
  const panjang = request.headers.get("content-length");
  if (panjang !== null && Number(panjang) > batasByte) {
    return { galat: "terlalu-besar" };
  }
  try {
    const teks = await request.text();
    if (teks.length > batasByte) return { galat: "terlalu-besar" };
    const data: unknown = JSON.parse(teks);
    if (typeof data !== "object" || data === null) {
      return { galat: "tidak-valid" };
    }
    return { data: data as T };
  } catch {
    return { galat: "tidak-valid" };
  }
}
