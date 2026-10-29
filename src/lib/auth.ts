/**
 * Sistem akun pendekin: daftar, masuk, dan sesi.
 *
 * Menggantikan model lama "satu token pemilik" (env PENDEKIN_OWNER_TOKEN)
 * sejak 30 Okt 2026 atas permintaan Yudhis: setiap pengguna mendaftar
 * dengan email + kata sandi, masuk, lalu dasbor menampilkan tautan
 * milik akun itu sendiri.
 *
 * Kata sandi: hash scrypt (node:crypto, tanpa dependensi baru) dengan
 * salt acak per pengguna, format "scrypt$<saltHex>$<hashHex>".
 * Verifikasi memakai timingSafeEqual.
 *
 * Sesi: token acak 32 byte. Cookie peramban memegang token mentahnya,
 * database (PendekinSession) hanya menyimpan hash SHA-256 token itu,
 * jadi isi database yang bocor tidak bisa dipakai sebagai cookie.
 * Logout menghapus baris sesi di server, bukan cuma cookie.
 */

import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt);

/** Nama cookie sesi akun. httpOnly, jadi JavaScript halaman tidak bisa membacanya. */
export const NAMA_COOKIE_SESI = "pendekin_sesi";

/** Umur sesi: 30 hari, selaras dengan umur baris PendekinSession. */
export const UMUR_SESI_DETIK = 30 * 24 * 60 * 60;
const UMUR_SESI_MS = UMUR_SESI_DETIK * 1000;

export type PenggunaPublik = {
  id: string;
  email: string;
  nama: string | null;
};

/** Normalisasi email: trim + huruf kecil, agar uniknya konsisten. */
export function normalisasiEmail(mentah: string): string {
  return mentah.trim().toLowerCase();
}

/** Validasi email sederhana di server: bentuk umum + batas panjang. */
export function emailValid(email: string): boolean {
  return (
    email.length >= 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

/** Kata sandi: minimal 8 karakter, maksimal 128 (rem body raksasa). */
export function kataSandiValid(kataSandi: string): boolean {
  return kataSandi.length >= 8 && kataSandi.length <= 128;
}

/** Buat hash kata sandi untuk disimpan. Salt acak 16 byte per pengguna. */
export async function hashKataSandi(kataSandi: string): Promise<string> {
  const salt = randomBytes(16);
  const turunan = (await scryptAsync(kataSandi, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${turunan.toString("hex")}`;
}

/** Periksa kata sandi terhadap hash tersimpan, dengan waktu konstan. */
export async function kataSandiCocok(
  kataSandi: string,
  tersimpan: string,
): Promise<boolean> {
  const [, saltHex, hashHex] = tersimpan.split("$");
  if (!saltHex || !hashHex) return false;
  const diharapkan = Buffer.from(hashHex, "hex");
  const turunan = (await scryptAsync(
    kataSandi,
    Buffer.from(saltHex, "hex"),
    diharapkan.length,
  )) as Buffer;
  return timingSafeEqual(turunan, diharapkan);
}

function hashTokenSesi(tokenMentah: string): string {
  return createHash("sha256").update(tokenMentah).digest("hex");
}

/**
 * Buat sesi baru untuk pengguna dan kembalikan token mentahnya
 * (hanya untuk dimasukkan ke cookie, tidak pernah disimpan).
 */
export async function buatSesi(userId: string): Promise<string> {
  const tokenMentah = randomBytes(32).toString("base64url");
  await prisma.pendekinSession.create({
    data: {
      tokenHash: hashTokenSesi(tokenMentah),
      userId,
      expiresAt: new Date(Date.now() + UMUR_SESI_MS),
    },
  });
  return tokenMentah;
}

/** Hapus sesi (logout di server). Token tidak dikenal diabaikan saja. */
export async function hapusSesi(tokenMentah: string | undefined): Promise<void> {
  if (!tokenMentah) return;
  await prisma.pendekinSession.deleteMany({
    where: { tokenHash: hashTokenSesi(tokenMentah) },
  });
}

/** Cari pengguna dari token sesi mentah. Sesi kedaluwarsa dihapus sekalian. */
export async function penggunaDariTokenSesi(
  tokenMentah: string | undefined,
): Promise<PenggunaPublik | null> {
  if (!tokenMentah) return null;
  const sesi = await prisma.pendekinSession.findUnique({
    where: { tokenHash: hashTokenSesi(tokenMentah) },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, nama: true } },
    },
  });
  if (!sesi) return null;
  if (sesi.expiresAt.getTime() <= Date.now()) {
    await prisma.pendekinSession.delete({ where: { id: sesi.id } });
    return null;
  }
  return sesi.user;
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

/** Pengguna yang masuk, dibaca dari cookie sesi sebuah Request (untuk API). */
export async function penggunaDariRequest(
  request: Request,
): Promise<PenggunaPublik | null> {
  return penggunaDariTokenSesi(
    nilaiCookieDariRequest(request, NAMA_COOKIE_SESI),
  );
}

/** Pengguna yang masuk, dibaca dari cookie sesi Server Component. */
export async function penggunaDariCookieServer(): Promise<PenggunaPublik | null> {
  const jar = await cookies();
  return penggunaDariTokenSesi(jar.get(NAMA_COOKIE_SESI)?.value);
}

/** Setel cookie sesi pada respons (dipakai daftar dan masuk). */
export function setelCookieSesi(res: NextResponse, tokenMentah: string): void {
  res.cookies.set({
    name: NAMA_COOKIE_SESI,
    value: tokenMentah,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
}

/** Hapus cookie sesi pada respons (logout). */
export function hapusCookieSesi(res: NextResponse): void {
  res.cookies.set({
    name: NAMA_COOKIE_SESI,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
