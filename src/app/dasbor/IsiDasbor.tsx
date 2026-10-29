import { connection } from "next/server";
import Link from "next/link";
import { penggunaDariCookieServer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TombolKeluar from "./TombolKeluar";
import { buatQrSvg } from "@/lib/qr";
import { tautanPendek } from "@/lib/situs";
import { labelTanggalPenuh, sejakBerapaMsLalu } from "@/lib/statistik";
import DaftarTautan, { type TautanDasbor } from "./DaftarTautan";

const TUJUH_HARI_MS = 7 * 24 * 60 * 60 * 1000;

/** Panel untuk pengunjung yang belum masuk: database tidak dibaca sama sekali. */
function PanelBelumMasuk() {
  return (
    <section aria-label="Belum masuk" className="py-10 md:py-14">
      <div className="max-w-md border border-line">
        <div className="border-b border-line px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            area-akun
          </p>
        </div>
        <div className="space-y-4 px-5 py-6">
          <p className="leading-relaxed">
            Dasbor berisi tautan milik akunmu sendiri. Masuk dulu untuk
            melihatnya, atau daftar bila belum punya akun.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/masuk"
              className="bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95"
            >
              masuk
            </Link>
            <Link
              href="/daftar"
              className="border border-ink px-5 py-3 font-mono text-sm hover:bg-ink hover:text-paper"
            >
              daftar akun
            </Link>
          </div>
          <p className="font-mono text-xs leading-relaxed text-muted">
            Tautan yang dibuat sebelum ada sistem akun tetap bisa dibuka
            pengunjung seperti biasa, tetapi tidak tampil di dasbor akun
            mana pun.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Isi dinamis dasbor: ringkasan angka + daftar tautan MILIK akun yang
 * masuk. Di-render di dalam <Suspense> di page.tsx agar cangkang
 * halaman bisa di-prerender dan bagian ini di-streaming tiap request.
 */
export default async function IsiDasbor() {
  await connection();

  const pengguna = await penggunaDariCookieServer();
  if (!pengguna) {
    return <PanelBelumMasuk />;
  }

  const [tautan, totalKlik, klik7Hari] = await Promise.all([
    prisma.link.findMany({
      where: { userId: pengguna.id },
      orderBy: { createdAt: "desc" },
      select: {
        code: true,
        url: true,
        title: true,
        active: true,
        createdAt: true,
        _count: { select: { clicks: true } },
      },
    }),
    prisma.click.count({ where: { link: { userId: pengguna.id } } }),
    prisma.click.count({
      where: {
        link: { userId: pengguna.id },
        clickedAt: { gte: sejakBerapaMsLalu(TUJUH_HARI_MS) },
      },
    }),
  ]);

  const daftar: TautanDasbor[] = await Promise.all(
    tautan.map(async (t) => {
      const pendek = tautanPendek(t.code);
      return {
        kode: t.code,
        url: t.url,
        judul: t.title,
        aktif: t.active,
        dibuat: labelTanggalPenuh(t.createdAt),
        totalKlik: t._count.clicks,
        pendek,
        qrSvg: await buatQrSvg(pendek),
      };
    }),
  );

  // Angka nyata dari database, hanya milik akun ini.
  const ringkasan = [
    { kunci: "tautan", nilai: String(tautan.length) },
    { kunci: "total-klik", nilai: String(totalKlik) },
    { kunci: "klik-7-hari", nilai: String(klik7Hari) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="font-mono text-xs text-muted">
          masuk sebagai{" "}
          {pengguna.nama ? `${pengguna.nama} (${pengguna.email})` : pengguna.email}
        </p>
        <TombolKeluar />
      </div>
      <section aria-label="Ringkasan" className="border-y border-line">
        <dl className="grid grid-cols-3 divide-x divide-line">
          {ringkasan.map((baris) => (
            <div key={baris.kunci} className="px-4 py-5 md:px-6 md:py-6">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {baris.kunci}
              </dt>
              <dd className="mt-2 font-mono text-2xl font-semibold tracking-tight md:text-3xl">
                {baris.nilai}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Daftar tautan" className="py-10 md:py-14">
        <DaftarTautan awal={daftar} />
      </section>
    </>
  );
}
