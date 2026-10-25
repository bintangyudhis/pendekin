"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TombolSalin from "./TombolSalin";
import PanelStatistik from "./PanelStatistik";
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
export default function BarisTautan({
  tautan,
  onStatusBerubah,
  onTerhapus,
}: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<"qr" | "statistik" | null>(null);
  // Sibuk per aksi: label "menyimpan…"/"menghapus…" hanya muncul di tombol
  // yang benar-benar sedang bekerja, bukan di semua tombol sekaligus.
  const [aksiSibuk, setAksiSibuk] = useState<"status" | "hapus" | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [hapusTahap, setHapusTahap] = useState<"siap" | "yakin">("siap");
  const domainTampil = tautan.pendek.replace(/^https?:\/\//, "");

  /** Buka-tutup satu panel; membuka yang lain menutup yang sedang terbuka. */
  function alihPanel(nama: "qr" | "statistik") {
    setPanel(panel === nama ? null : nama);
  }

  /**
   * Balik status aktif via PATCH — optimistis: tampilan berubah seketika,
   * dikembalikan ke status semula bila server menolak, agar klik terasa
   * instan walau jaringan lambat.
   */
  async function ubahStatus() {
    const target = !tautan.aktif;
    setAksiSibuk("status");
    setGalat(null);
    onStatusBerubah(tautan.kode, target);
    try {
      const res = await fetch(`/api/links/${tautan.kode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: target }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { aktif: boolean } }
        | { ok: false; pesan: string };
      if (!json.ok) {
        onStatusBerubah(tautan.kode, tautan.aktif);
        // Sesi habis terasa beda dari galat biasa: arahkan pemilik untuk
        // masuk ulang, bukan menekan tombol yang sama berulang kali.
        setGalat(
          res.status === 401
            ? "Sesi pemilik berakhir — muat ulang dasbor dan masuk lagi."
            : json.pesan,
        );
      } else {
        onStatusBerubah(tautan.kode, json.data.aktif);
        router.refresh();
      }
    } catch {
      onStatusBerubah(tautan.kode, tautan.aktif);
      setGalat("Gagal menghubungi server. Coba lagi.");
    } finally {
      setAksiSibuk(null);
    }
  }

  /**
   * Hapus tautan via DELETE — dua langkah agar tidak kepencet:
   * klik pertama meminta konfirmasi, klik kedua mengeksekusi.
   */
  async function hapus() {
    setAksiSibuk("hapus");
    setGalat(null);
    try {
      const res = await fetch(`/api/links/${tautan.kode}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as
        | { ok: true; data: { kode: string } }
        | { ok: false; pesan: string };
      if (!json.ok) {
        setGalat(
          res.status === 401
            ? "Sesi pemilik berakhir — muat ulang dasbor dan masuk lagi."
            : json.pesan,
        );
        setHapusTahap("siap");
      } else {
        onTerhapus(tautan.kode);
        // Segarkan data server agar angka ringkasan ikut berkurang.
        router.refresh();
      }
    } catch {
      setGalat("Gagal menghubungi server. Coba lagi.");
      setHapusTahap("siap");
    } finally {
      setAksiSibuk(null);
    }
  }

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
          onClick={() => alihPanel("qr")}
          aria-expanded={panel === "qr"}
          className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink"
        >
          {panel === "qr" ? "tutup qr" : "kode qr"}
        </button>
        <button
          type="button"
          onClick={() => alihPanel("statistik")}
          aria-expanded={panel === "statistik"}
          className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink"
        >
          {panel === "statistik" ? "tutup statistik" : "statistik"}
        </button>
        <button
          type="button"
          onClick={ubahStatus}
          disabled={aksiSibuk !== null}
          className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink disabled:opacity-50"
        >
          {aksiSibuk === "status"
            ? "menyimpan…"
            : tautan.aktif
              ? "nonaktifkan"
              : "aktifkan"}
        </button>
        {hapusTahap === "siap" ? (
          <button
            type="button"
            onClick={() => setHapusTahap("yakin")}
            disabled={aksiSibuk !== null}
            className="border border-line px-3 py-1.5 font-mono text-xs text-accent hover:border-accent disabled:opacity-50"
          >
            hapus
          </button>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">
              Hapus beserta riwayat kliknya?
            </span>
            <button
              type="button"
              onClick={hapus}
              disabled={aksiSibuk !== null}
              className="bg-accent px-3 py-1.5 font-mono text-xs text-paper hover:brightness-95 disabled:opacity-50"
            >
              {aksiSibuk === "hapus" ? "menghapus…" : "ya, hapus"}
            </button>
            <button
              type="button"
              onClick={() => setHapusTahap("siap")}
              disabled={aksiSibuk !== null}
              className="border border-line px-3 py-1.5 font-mono text-xs hover:border-ink disabled:opacity-50"
            >
              batal
            </button>
          </span>
        )}
      </div>

      {galat && (
        <p role="alert" className="mt-3 border-l-2 border-accent pl-3 text-sm">
          {galat}
        </p>
      )}

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

      {panel === "statistik" && <PanelStatistik kode={tautan.kode} />}
    </div>
  );
}
