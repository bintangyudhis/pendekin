import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { buatQrSvg } from "@/lib/qr";
import { tautanPendek } from "@/lib/situs";
import { labelTanggalPenuh } from "@/lib/statistik";
import DaftarTautan, { type TautanDasbor } from "./DaftarTautan";

const TUJUH_HARI_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Isi dinamis dasbor: ringkasan angka + daftar tautan.
 * Di-render di dalam <Suspense> di page.tsx — cangkang halaman boleh
 * di-prerender, bagian ini di-streaming tiap request karena membaca database.
 */
export default async function IsiDasbor() {
  await connection();

  const [tautan, totalKlik, klik7Hari] = await Promise.all([
    prisma.link.findMany({
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
    prisma.click.count(),
    prisma.click.count({
      where: { clickedAt: { gte: new Date(Date.now() - TUJUH_HARI_MS) } },
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

  // Angka nyata dari database, bukan karangan.
  const ringkasan = [
    { kunci: "tautan", nilai: String(tautan.length) },
    { kunci: "total-klik", nilai: String(totalKlik) },
    { kunci: "klik-7-hari", nilai: String(klik7Hari) },
  ];

  return (
    <>
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
