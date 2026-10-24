"use client";

import { useEffect, useState } from "react";
import GrafikHarian from "./GrafikHarian";
import type { KlikHarian } from "@/lib/statistik";

type DataStatistik = {
  kode: string;
  totalKlik: number;
  perHari: KlikHarian[];
};

type HasilApi =
  | { ok: true; data: DataStatistik }
  | { ok: false; kode: string; pesan: string };

/**
 * Panel statistik satu tautan. Data dimuat dari
 * GET /api/links/[kode]/stats saat panel dibuka, bukan saat halaman
 * dimuat — dasbor tetap ringan walau tautannya banyak.
 */
export default function PanelStatistik({ kode }: { kode: string }) {
  const [data, setData] = useState<DataStatistik | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    async function muat() {
      try {
        const res = await fetch(`/api/links/${kode}/stats`);
        const json = (await res.json()) as HasilApi;
        if (batal) return;
        if (!json.ok) setGalat(json.pesan);
        else setData(json.data);
      } catch {
        if (!batal) setGalat("Gagal menghubungi server.");
      }
    }
    muat();
    return () => {
      batal = true;
    };
  }, [kode]);

  if (galat) {
    return (
      <p role="alert" className="border-l-2 border-accent pl-3 text-sm">
        {galat}
      </p>
    );
  }
  if (!data) {
    return <p className="font-mono text-xs text-muted">Memuat statistik…</p>;
  }

  const klik14Hari = data.perHari.reduce((jumlah, d) => jumlah + d.klik, 0);
  const rataRata = (klik14Hari / data.perHari.length)
    .toFixed(1)
    .replace(".", ",");

  const angka = [
    { kunci: "total-klik", nilai: String(data.totalKlik) },
    { kunci: "klik-14-hari", nilai: String(klik14Hari) },
    { kunci: "rata-rata/hari", nilai: rataRata },
  ];

  return (
    <div className="mt-4 border-t border-line pt-4">
      <dl className="grid grid-cols-3 gap-4 pb-5">
        {angka.map((baris) => (
          <div key={baris.kunci}>
            <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              {baris.kunci}
            </dt>
            <dd className="mt-1 font-mono text-xl font-semibold tracking-tight">
              {baris.nilai}
            </dd>
          </div>
        ))}
      </dl>
      <GrafikHarian data={data.perHari} />
    </div>
  );
}
