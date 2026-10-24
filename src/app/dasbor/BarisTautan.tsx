"use client";

import { useState } from "react";
import TombolSalin from "./TombolSalin";
import type { TautanDasbor } from "./DaftarTautan";

type Props = {
  tautan: TautanDasbor;
  onStatusBerubah: (kode: string, aktif: boolean) => void;
  onTerhapus: (kode: string) => void;
};

/**
 * Satu baris tautan di dasbor: info ringkas + aksi.
 * Panel tambahan (QR, statistik) dibuka-tutup per baris.
 */
export default function BarisTautan({ tautan }: Props) {
  const [panel, setPanel] = useState<"qr" | null>(null);
  const domainTampil = tautan.pendek.replace(/^https?:\/\//, "");

  return (
    <div className="py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={tautan.pendek}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-lg font-semibold tracking-tight text-accent underline-offset-4 hover:underline"
        >
          {domainTampil}
        </a>
        {!tautan.aktif && (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            nonaktif
          </span>
        )}
      </div>

      <p className="mt-1.5 truncate font-mono text-xs text-muted">
        {tautan.judul ? (
          <span className="text-ink">{tautan.judul} — </span>
        ) : null}
        {tautan.url}
      </p>
      <p className="mt-1 font-mono text-xs text-muted">
        {tautan.totalKlik} klik · dibuat {tautan.dibuat}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <TombolSalin teks={tautan.pendek} />
        <button
          type="button"
          onClick={() => setPanel(panel === "qr" ? null : "qr")}
          aria-expanded={panel === "qr"}
          className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink"
        >
          {panel === "qr" ? "tutup qr" : "kode qr"}
        </button>
      </div>

      {panel === "qr" && (
        <div className="mt-4 flex items-start gap-4 border-t border-line pt-4">
          {/* SVG dibuat di server dari kode yang tervalidasi + domain
              konstanta — bukan dari input mentah user, jadi aman. */}
          <div
            className="w-32 shrink-0 border border-line p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: tautan.qrSvg }}
            role="img"
            aria-label={`Kode QR untuk ${domainTampil}`}
          />
          <p className="font-mono text-xs leading-relaxed text-muted">
            Pindai untuk membuka {domainTampil}.
            <br />
            Cetak atau tempel di materi promosi — pengunjung langsung
            diarahkan ke tautan aslinya.
          </p>
        </div>
      )}
    </div>
  );
}
