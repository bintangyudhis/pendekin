"use client";

import { useState } from "react";
import Link from "next/link";
import BarisTautan from "./BarisTautan";

export type TautanDasbor = {
  kode: string;
  url: string;
  judul: string | null;
  aktif: boolean;
  /** Label tanggal WIB, mis. "24 Okt 2026". */
  dibuat: string;
  totalKlik: number;
  /** Tautan pendek penuh, mis. "https://pendekin.bintangyudhis.my.id/x7K2qQ". */
  pendek: string;
  /** SVG kode QR yang di-render di server. */
  qrSvg: string;
};

type Props = {
  /** Daftar awal dari server; state lokal agar aksi langsung tercermin. */
  awal: TautanDasbor[];
};

/** Daftar tautan dasbor dalam gaya buku besar: baris pemisah, tanpa kartu. */
export default function DaftarTautan({ awal }: Props) {
  const [daftar, setDaftar] = useState(awal);

  if (daftar.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-12 text-center">
        <p className="font-mono text-sm text-muted">Belum ada tautan.</p>
        <Link
          href="/"
          className="mt-4 inline-block bg-accent px-5 py-3 text-sm font-semibold text-paper hover:brightness-95"
        >
          Buat tautan pertama
        </Link>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      {daftar.map((tautan) => (
        <li key={tautan.kode}>
          <BarisTautan
            tautan={tautan}
            onStatusBerubah={(kode, aktif) =>
              setDaftar((d) =>
                d.map((t) => (t.kode === kode ? { ...t, aktif } : t)),
              )
            }
            onTerhapus={(kode) =>
              setDaftar((d) => d.filter((t) => t.kode !== kode))
            }
          />
        </li>
      ))}
    </ol>
  );
}
