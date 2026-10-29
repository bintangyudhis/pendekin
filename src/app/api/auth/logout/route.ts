import { cookies } from "next/headers";
import { apiSukses } from "@/lib/api";
import { NAMA_COOKIE_SESI, hapusCookieSesi, hapusSesi } from "@/lib/auth";

/**
 * POST /api/auth/logout: keluar dari akun.
 *
 * Baris sesi dihapus di server (token tidak bisa dipakai lagi walau
 * cookie-nya sempat tersalin), lalu cookie dibersihkan. Selalu sukses,
 * bahkan bila tidak ada sesi: tidak ada informasi yang bisa dipelajari
 * dari respons ini.
 */
export async function POST() {
  const jar = await cookies();
  await hapusSesi(jar.get(NAMA_COOKIE_SESI)?.value);
  const res = apiSukses({ keluar: true });
  hapusCookieSesi(res);
  return res;
}
