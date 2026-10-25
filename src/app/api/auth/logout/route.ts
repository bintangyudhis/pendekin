import { apiSukses } from "@/lib/api";
import { NAMA_COOKIE_PEMILIK } from "@/lib/pemilik";

/**
 * POST /api/auth/logout — keluar sebagai pemilik: hapus cookie sesi.
 * Selalu sukses, bahkan bila tidak ada sesi — tidak ada informasi yang
 * bisa dipelajari penyerang dari respons ini.
 */
export async function POST() {
  const res = apiSukses({ keluar: true });
  res.cookies.set({
    name: NAMA_COOKIE_PEMILIK,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
